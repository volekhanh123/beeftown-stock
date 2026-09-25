-- =============================================================================
-- BEEFTOWN CRM — 0003 · THẺ THÀNH VIÊN (SỔ CÁI ĐIỂM)
-- =============================================================================
-- ĐIỂM LÀ TIỀN. Vì vậy đây là SỔ CÁI BẤT BIẾN, không phải một cột số dư:
--   · Chỉ ghi thêm — không sửa, không xóa (có trigger chặn ở tầng database)
--   · Số dư = tổng cộng dồn các dòng
--   · Mỗi dòng lưu kèm số dư sau giao dịch để phát hiện sai lệch
--
-- Ba luật giữ chi phí (Beeftown_CRM_Design.html mục D3):
--   1. Ngưỡng dùng tối thiểu 50.000đ
--   2. Không tích điểm trên phần đã trừ bằng điểm
--   3. Không tích điểm trên hóa đơn khuyến mãi lớn
-- Cả ba đều cưỡng chế ở database, không phụ thuộc code app nhớ kiểm tra.
-- =============================================================================

-- =============================================================================
-- CẤU HÌNH TÍCH ĐIỂM — mỗi chi nhánh một cấu hình
-- =============================================================================
create table cau_hinh_tich_diem (
  chi_nhanh_id uuid primary key references chi_nhanh(id) on delete cascade,

  -- Tỷ lệ tích: 0.03 = 3% (đề xuất ở mục D1, tính theo biên đóng góp 13,2%)
  ty_le_tich numeric(5,4) not null default 0.0300,

  -- Luật 1: dưới ngưỡng này thì chưa được dùng điểm
  nguong_dung_toi_thieu bigint not null default 50000,

  -- Tuần 5 mới bật (mục H). Trước đó chỉ thu SĐT, chưa tích điểm.
  dang_bat boolean not null default false,

  updated_at timestamptz not null default now(),

  constraint ty_le_tich_hop_ly check (ty_le_tich >= 0 and ty_le_tich <= 0.20),
  constraint nguong_hop_ly     check (nguong_dung_toi_thieu >= 0)
);

create trigger cau_hinh_tich_diem_updated_at
  before update on cau_hinh_tich_diem
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on column cau_hinh_tich_diem.ty_le_tich is
  'Trần 20% là chốt chặn an toàn: biên đóng góp chỉ 13,2%, tích 10% đã xóa gần hết lợi nhuận.';

-- =============================================================================
-- SỔ CÁI ĐIỂM
-- =============================================================================
create type loai_giao_dich_diem as enum (
  'tich',        -- cộng điểm từ hóa đơn
  'dung',        -- khách trừ điểm vào hóa đơn
  'dieu_chinh',  -- quản lý cộng/trừ tay (bù điểm, sửa sai)
  'huy'          -- hủy hóa đơn -> hoàn lại điểm đã tích
);

create table so_cai_diem (
  id            uuid primary key default gen_random_uuid(),
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  khach_hang_id uuid not null references khach_hang(id) on delete cascade,
  luot_ghe_id   uuid references luot_ghe(id) on delete set null,

  loai      loai_giao_dich_diem not null,
  so_diem   bigint not null,   -- DƯƠNG = cộng, ÂM = trừ. Đơn vị: đồng.
  so_du_sau bigint not null,   -- do trigger tự điền, dùng để soát toàn vẹn

  ly_do      text,
  created_at timestamptz not null default now(),
  created_by uuid references nhan_su(id),

  constraint so_diem_khac_khong check (so_diem <> 0),
  constraint so_du_khong_am     check (so_du_sau >= 0),
  -- 'tich' phải dương, 'dung' phải âm — chặn nhầm dấu
  constraint dau_dung_loai check (
    (loai = 'tich' and so_diem > 0)
    or (loai = 'dung' and so_diem < 0)
    or (loai in ('dieu_chinh', 'huy'))
  )
);

create index so_cai_diem_khach_idx on so_cai_diem(khach_hang_id, created_at desc);
create index so_cai_diem_luot_ghe_idx on so_cai_diem(luot_ghe_id) where luot_ghe_id is not null;

comment on table so_cai_diem is
  'Sổ cái điểm BẤT BIẾN. Không bao giờ UPDATE/DELETE — sửa sai bằng dòng dieu_chinh mới.';

-- -----------------------------------------------------------------------------
-- TÍNH SỐ DƯ + CHẶN ÂM (chạy trước mỗi lần ghi)
-- -----------------------------------------------------------------------------
-- Khóa dòng khách hàng để hai giao dịch cùng lúc không tính sai số dư.
-- -----------------------------------------------------------------------------
create or replace function so_cai_diem_tinh_so_du()
returns trigger
language plpgsql
as $$
declare
  v_so_du_hien_tai bigint;
  v_so_du_moi      bigint;
begin
  -- Khóa khách hàng: mọi giao dịch điểm của cùng một người phải xếp hàng
  perform 1 from khach_hang where id = new.khach_hang_id for update;

  select coalesce(sum(so_diem), 0) into v_so_du_hien_tai
  from so_cai_diem
  where khach_hang_id = new.khach_hang_id;

  v_so_du_moi := v_so_du_hien_tai + new.so_diem;

  if v_so_du_moi < 0 then
    raise exception 'Không đủ điểm: số dư % , yêu cầu trừ %',
      v_so_du_hien_tai, abs(new.so_diem)
      using errcode = 'check_violation';
  end if;

  new.so_du_sau := v_so_du_moi;
  return new;
end;
$$;

create trigger so_cai_diem_tinh_so_du_trigger
  before insert on so_cai_diem
  for each row execute function so_cai_diem_tinh_so_du();

-- -----------------------------------------------------------------------------
-- BẤT BIẾN — chặn sửa/xóa ở tầng database
-- -----------------------------------------------------------------------------
create or replace function so_cai_diem_chan_sua_xoa()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Sổ cái điểm là bất biến. Muốn sửa sai, ghi thêm một dòng loai=dieu_chinh.'
    using errcode = 'restrict_violation';
end;
$$;

create trigger so_cai_diem_chan_sua
  before update or delete on so_cai_diem
  for each row execute function so_cai_diem_chan_sua_xoa();

-- -----------------------------------------------------------------------------
-- SỐ DƯ ĐIỂM
-- -----------------------------------------------------------------------------
create or replace function so_du_diem(p_khach_hang_id uuid)
returns bigint
language sql
stable
as $$
  select coalesce(sum(so_diem), 0)::bigint
  from so_cai_diem
  where khach_hang_id = p_khach_hang_id;
$$;

create or replace view v_so_du_diem as
select
  kh.id as khach_hang_id,
  kh.sdt,
  kh.ho_ten,
  coalesce(sum(sc.so_diem), 0)::bigint as so_du,
  max(sc.created_at) as giao_dich_gan_nhat
from khach_hang kh
left join so_cai_diem sc on sc.khach_hang_id = kh.id
group by kh.id, kh.sdt, kh.ho_ten;

-- =============================================================================
-- TÍNH ĐIỂM TÍCH ĐƯỢC — cưỡng chế luật 2 và 3
-- =============================================================================
create or replace function tinh_diem_tich(
  p_tong_hoa_don  bigint,
  p_diem_da_dung  bigint,
  p_la_khuyen_mai boolean,
  p_ty_le         numeric
)
returns bigint
language plpgsql
immutable
as $$
declare
  v_phan_duoc_tinh bigint;
begin
  -- Luật 3: hóa đơn khuyến mãi lớn thì không tích
  if p_la_khuyen_mai then
    return 0;
  end if;

  -- Luật 2: không tích trên phần đã trừ bằng điểm
  v_phan_duoc_tinh := p_tong_hoa_don - coalesce(p_diem_da_dung, 0);

  if v_phan_duoc_tinh <= 0 then
    return 0;
  end if;

  return floor(v_phan_duoc_tinh * p_ty_le)::bigint;
end;
$$;

comment on function tinh_diem_tich is
  'Cưỡng chế luật D3-2 (không tích trên phần trừ điểm) và D3-3 (không tích khi khuyến mãi).';

-- =============================================================================
-- GHI LƯỢT GHÉ + TÍCH ĐIỂM — điểm vào chính cho thu ngân/POS
-- =============================================================================
-- Làm trọn trong một giao dịch: tạo lượt ghé, trừ điểm đã dùng, cộng điểm mới.
-- Kiểm tra ngưỡng dùng tối thiểu (luật 1) tại đây.
-- =============================================================================
create or replace function ghi_luot_ghe(
  p_chi_nhanh_id  uuid,
  p_sdt           text,
  p_tong_hoa_don  bigint,
  p_ho_ten        text    default null,
  p_so_khach      smallint default null,
  p_diem_muon_dung bigint default 0,
  p_la_khuyen_mai boolean default false,
  p_ma_hoa_don    text    default null,
  p_nhan_su_id    uuid    default null
)
returns table (
  luot_ghe_id  uuid,
  khach_hang_id uuid,
  diem_da_dung bigint,
  diem_tich_duoc bigint,
  so_du_moi    bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_khach   khach_hang;
  v_cau_hinh cau_hinh_tich_diem;
  v_so_du   bigint;
  v_dung    bigint := coalesce(p_diem_muon_dung, 0);
  v_tich    bigint := 0;
  v_luot    luot_ghe;
begin
  if p_tong_hoa_don < 0 then
    raise exception 'Tổng hóa đơn không được âm' using errcode = 'check_violation';
  end if;

  v_khach := tim_hoac_tao_khach(p_sdt, p_ho_ten, p_chi_nhanh_id);

  select * into v_cau_hinh from cau_hinh_tich_diem where chi_nhanh_id = p_chi_nhanh_id;
  if not found then
    raise exception 'Chi nhánh chưa có cấu hình tích điểm' using errcode = 'foreign_key_violation';
  end if;

  -- ---- Trừ điểm khách muốn dùng -------------------------------------------
  if v_dung > 0 then
    if not v_cau_hinh.dang_bat then
      raise exception 'Chương trình tích điểm chưa được bật cho chi nhánh này'
        using errcode = 'check_violation';
    end if;

    v_so_du := so_du_diem(v_khach.id);

    -- Luật 1: ngưỡng dùng tối thiểu
    if v_so_du < v_cau_hinh.nguong_dung_toi_thieu then
      raise exception 'Chưa đủ ngưỡng dùng điểm: cần tối thiểu %đ, hiện có %đ',
        v_cau_hinh.nguong_dung_toi_thieu, v_so_du
        using errcode = 'check_violation';
    end if;

    if v_dung > v_so_du then
      raise exception 'Không đủ điểm: số dư %đ, muốn dùng %đ', v_so_du, v_dung
        using errcode = 'check_violation';
    end if;

    if v_dung > p_tong_hoa_don then
      raise exception 'Không thể trừ %đ điểm cho hóa đơn %đ', v_dung, p_tong_hoa_don
        using errcode = 'check_violation';
    end if;
  end if;

  -- ---- Tạo lượt ghé --------------------------------------------------------
  insert into luot_ghe (chi_nhanh_id, khach_hang_id, so_khach,
                        tong_hoa_don, diem_da_dung, la_khuyen_mai,
                        ma_hoa_don, created_by)
  values (p_chi_nhanh_id, v_khach.id, p_so_khach,
          p_tong_hoa_don, v_dung, p_la_khuyen_mai,
          p_ma_hoa_don, p_nhan_su_id)
  returning * into v_luot;

  -- ---- Ghi sổ cái: trừ trước, cộng sau -------------------------------------
  if v_dung > 0 then
    insert into so_cai_diem (chi_nhanh_id, khach_hang_id, luot_ghe_id,
                             loai, so_diem, ly_do, created_by)
    values (p_chi_nhanh_id, v_khach.id, v_luot.id,
            'dung', -v_dung, 'Trừ vào hóa đơn ' || coalesce(p_ma_hoa_don, v_luot.id::text),
            p_nhan_su_id);
  end if;

  if v_cau_hinh.dang_bat then
    v_tich := tinh_diem_tich(p_tong_hoa_don, v_dung, p_la_khuyen_mai, v_cau_hinh.ty_le_tich);

    if v_tich > 0 then
      insert into so_cai_diem (chi_nhanh_id, khach_hang_id, luot_ghe_id,
                               loai, so_diem, ly_do, created_by)
      values (p_chi_nhanh_id, v_khach.id, v_luot.id,
              'tich', v_tich,
              'Tích ' || (v_cau_hinh.ty_le_tich * 100)::text || '% hóa đơn',
              p_nhan_su_id);
    end if;
  end if;

  return query
  select v_luot.id, v_khach.id, v_dung, v_tich, so_du_diem(v_khach.id);
end;
$$;

comment on function ghi_luot_ghe is
  'Điểm vào duy nhất cho thu ngân. Làm trọn trong một giao dịch: lượt ghé + trừ điểm + tích điểm.';
