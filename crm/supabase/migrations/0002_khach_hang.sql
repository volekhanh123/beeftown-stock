-- =============================================================================
-- BEEFTOWN CRM — 0002 · KHÁCH HÀNG
-- Hồ sơ khách · Nhật ký đồng ý · Lượt ghé
-- =============================================================================
-- Các trường bám đúng Beeftown_CRM_Design.html mục B1.
-- =============================================================================

-- =============================================================================
-- KHÁCH HÀNG
-- =============================================================================
-- SĐT là khóa tự nhiên, UNIQUE toàn hệ thống — một người chỉ có một hồ sơ
-- dù ghé chi nhánh nào. chi_nhanh_dau_tien chỉ để biết ai kéo được khách về.
-- =============================================================================
create table khach_hang (
  id          uuid primary key default gen_random_uuid(),

  -- Định danh
  sdt         text not null unique,
  ho_ten      text,
  ngay_sinh_ngay  smallint,   -- 1..31 — chỉ lưu ngày/tháng, không lưu năm
  ngay_sinh_thang smallint,   -- 1..12   (đủ cho kịch bản sinh nhật, ít nhạy cảm hơn)

  -- Nguồn gốc
  chi_nhanh_dau_tien uuid references chi_nhanh(id) on delete set null,
  nguon_utm_source   text,
  nguon_utm_medium   text,
  nguon_utm_campaign text,

  -- Sở thích ghi nhận được
  dip_thuong_di   text,       -- 'Bữa ăn gia đình' | 'Tiệc công ty' | ...
  so_khach_thuong smallint,
  ghi_chu         text,       -- ghi chú của nhân viên: dị ứng, thích phần cắt nào...

  -- Khách doanh nghiệp (tệp khách #2) — xử lý riêng, không tích điểm cá nhân
  la_khach_b2b    boolean not null default false,
  ten_cong_ty     text,

  dang_hoat_dong  boolean not null default true,   -- false = khách yêu cầu xóa
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint khach_hang_sdt_hop_le check (sdt_hop_le(sdt)),
  constraint khach_hang_ngay_sinh_hop_le check (
    (ngay_sinh_ngay is null and ngay_sinh_thang is null)
    or (ngay_sinh_ngay between 1 and 31 and ngay_sinh_thang between 1 and 12)
  )
);

create trigger khach_hang_updated_at
  before update on khach_hang
  for each row execute function tu_dong_cap_nhat_updated_at();

create index khach_hang_ten_idx on khach_hang using gin (to_tsvector('simple', coalesce(ho_ten,'')));
create index khach_hang_sinh_nhat_idx on khach_hang(ngay_sinh_thang, ngay_sinh_ngay)
  where ngay_sinh_thang is not null;
create index khach_hang_b2b_idx on khach_hang(la_khach_b2b) where la_khach_b2b;

comment on table khach_hang is
  'Hồ sơ khách. SĐT chuẩn hóa là khóa tự nhiên — dùng ham_tim_hoac_tao_khach() để tránh trùng.';

-- -----------------------------------------------------------------------------
-- CHẶN SĐT SAI ĐỊNH DẠNG NGAY TỪ ĐẦU VÀO
-- -----------------------------------------------------------------------------
-- Tự chuẩn hóa khi insert/update, không phụ thuộc code app nhớ gọi hàm.
-- -----------------------------------------------------------------------------
create or replace function khach_hang_chuan_hoa_sdt()
returns trigger
language plpgsql
as $$
begin
  new.sdt := chuan_hoa_sdt(new.sdt);
  if new.sdt is null or not sdt_hop_le(new.sdt) then
    raise exception 'Số điện thoại không hợp lệ: %', coalesce(new.sdt, '(rỗng)')
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger khach_hang_chuan_hoa_sdt_trigger
  before insert or update of sdt on khach_hang
  for each row execute function khach_hang_chuan_hoa_sdt();

-- -----------------------------------------------------------------------------
-- TÌM HOẶC TẠO KHÁCH — dùng ở mọi điểm tiếp nhận (web, POS, quầy)
-- -----------------------------------------------------------------------------
create or replace function tim_hoac_tao_khach(
  p_sdt        text,
  p_ho_ten     text default null,
  p_chi_nhanh  uuid default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns khach_hang
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sdt   text := chuan_hoa_sdt(p_sdt);
  v_khach khach_hang;
begin
  if v_sdt is null or not sdt_hop_le(v_sdt) then
    raise exception 'Số điện thoại không hợp lệ: %', coalesce(p_sdt, '(rỗng)')
      using errcode = 'check_violation';
  end if;

  select * into v_khach from khach_hang where sdt = v_sdt;

  if found then
    -- Khách cũ: chỉ bổ sung thông tin còn thiếu, KHÔNG ghi đè dữ liệu đã có
    update khach_hang
    set ho_ten = coalesce(khach_hang.ho_ten, p_ho_ten)
    where id = v_khach.id
    returning * into v_khach;
    return v_khach;
  end if;

  insert into khach_hang (sdt, ho_ten, chi_nhanh_dau_tien,
                          nguon_utm_source, nguon_utm_medium, nguon_utm_campaign)
  values (v_sdt, p_ho_ten, p_chi_nhanh, p_utm_source, p_utm_medium, p_utm_campaign)
  returning * into v_khach;

  return v_khach;
end;
$$;

comment on function tim_hoac_tao_khach is
  'Điểm vào duy nhất để tạo khách. Chống trùng hồ sơ do SĐT khác định dạng.';

-- =============================================================================
-- NHẬT KÝ ĐỒNG Ý — nghĩa vụ pháp lý (NĐ 13/2023)
-- =============================================================================
-- Chỉ ghi thêm, không sửa. Muốn biết trạng thái hiện tại thì lấy bản ghi mới nhất.
-- Phải chứng minh được: ai đồng ý, lúc nào, qua kênh nào, nội dung gì.
-- =============================================================================
create type kenh_dong_y as enum ('web', 'quay', 'zalo', 'dien_thoai');

create table nhat_ky_dong_y (
  id           uuid primary key default gen_random_uuid(),
  khach_hang_id uuid not null references khach_hang(id) on delete cascade,
  dong_y       boolean not null,          -- true = đồng ý, false = rút lại
  kenh         kenh_dong_y not null,
  noi_dung     text not null,             -- nguyên văn câu khách đã đọc/nghe
  ip           inet,
  created_at   timestamptz not null default now()
);

create index nhat_ky_dong_y_khach_idx on nhat_ky_dong_y(khach_hang_id, created_at desc);

comment on table nhat_ky_dong_y is
  'Nhật ký đồng ý nhận tin. CHỈ GHI THÊM. Bằng chứng tuân thủ NĐ 13/2023.';

-- Trạng thái đồng ý hiện tại của mỗi khách
create or replace view v_dong_y_hien_tai as
select distinct on (khach_hang_id)
  khach_hang_id,
  dong_y   as dang_dong_y,
  kenh,
  created_at as thoi_diem
from nhat_ky_dong_y
order by khach_hang_id, created_at desc;

comment on view v_dong_y_hien_tai is
  'Trạng thái đồng ý mới nhất. Bắt buộc kiểm tra trước khi gửi tin quảng cáo.';

-- =============================================================================
-- LƯỢT GHÉ — nguồn tính tần suất, chi tiêu, và điểm
-- =============================================================================
create table luot_ghe (
  id            uuid primary key default gen_random_uuid(),
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  khach_hang_id uuid not null references khach_hang(id) on delete cascade,

  thoi_diem     timestamptz not null default now(),
  so_khach      smallint,

  -- Tiền (đơn vị: đồng, dùng bigint — VND không có phần thập phân)
  tong_hoa_don  bigint not null,           -- tổng trước khi trừ điểm
  diem_da_dung  bigint not null default 0, -- phần trừ bằng điểm
  thuc_thu      bigint generated always as (tong_hoa_don - diem_da_dung) stored,

  la_khuyen_mai boolean not null default false,  -- luật D3: KM lớn thì không tích điểm
  ma_hoa_don    text,                            -- đối chiếu với POS
  ghi_chu       text,

  created_at    timestamptz not null default now(),
  created_by    uuid references nhan_su(id),

  constraint luot_ghe_tien_hop_le check (tong_hoa_don >= 0 and diem_da_dung >= 0),
  constraint luot_ghe_khong_tru_qua check (diem_da_dung <= tong_hoa_don)
);

create index luot_ghe_khach_idx     on luot_ghe(khach_hang_id, thoi_diem desc);
create index luot_ghe_chi_nhanh_idx on luot_ghe(chi_nhanh_id, thoi_diem desc);
create unique index luot_ghe_ma_hoa_don_idx
  on luot_ghe(chi_nhanh_id, ma_hoa_don) where ma_hoa_don is not null;

comment on table luot_ghe is
  'Mỗi lượt khách ăn + hóa đơn. Nguồn của mọi chỉ số CRM.';
comment on column luot_ghe.la_khuyen_mai is
  'Luật D3: hóa đơn khuyến mãi lớn thì không tích điểm — tránh ăn hai lần vào biên.';
