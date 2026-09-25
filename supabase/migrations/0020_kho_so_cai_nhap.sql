-- =============================================================================
-- BEEFTOWN — 0020 · KHO · LÔ HÀNG, SỔ KHO, TỒN KHO, PHIẾU NHẬP
-- =============================================================================
-- Lõi của cả phần mềm kho. Bốn quyết định:
--
-- 1. SỔ KHO BẤT BIẾN (kho_so_cai) — theo đúng khuôn sổ cái điểm ở 0003. Mọi
--    thay đổi tồn là một dòng ghi thêm; sửa sai bằng dòng đảo ngược hoặc điều
--    chỉnh, không bao giờ sửa dòng cũ. Nhờ vậy luôn trả lời được "vì sao lô
--    này còn 3,2 kg" bằng cách đọc lại sổ.
--
-- 2. TỒN KHO (kho_ton) CHỈ DO TRIGGER CỦA SỔ GHI. Không hàm nào, kể cả hàm
--    definer, ghi thẳng vào kho_ton được — trigger canh pg_trigger_depth().
--    Vì vậy tồn và sổ không thể lệch nhau; kho_doi_soat_ton() là phép thử.
--
-- 3. KHÔNG CÓ CỘT TIỀN TRONG SỔ KHO. Giá vốn nằm riêng ở kho_lo_gia, chỉ vai
--    xem_gia đọc được. Nhân viên quầy/bếp đọc được sổ để biết hàng đi đâu,
--    nhưng không đọc được giá — đúng như chủ nhà hàng đã chốt.
--
-- 4. TỒN CHỈ CỘNG KHI PHIẾU NHẬP ĐƯỢC DUYỆT. Phiếu nháp và phiếu chờ duyệt
--    không chạm vào sổ. Duyệt xong mới sinh lô và dòng sổ.
--
-- XẾP HÀNG: mọi hàm ghi sổ khóa hàng kho_cai_dat của chi nhánh TRƯỚC TIÊN
-- (như tao_dat_ban khóa chi_nhanh). Hai người cùng bấm duyệt ở hai máy thì
-- một người chờ người kia xong — không có tình huống khóa chéo nhau.
-- =============================================================================


-- =============================================================================
-- 1 · SỐ CHỨNG TỪ LIÊN TỤC
-- =============================================================================
-- Kế toán cần số phiếu liên tục, không nhảy cóc: PN-2609-0007 là phiếu nhập
-- thứ 7 của tháng 9/2026. Mã ngẫu nhiên kiểu mã đặt bàn (0013) hợp cho khách
-- tra cứu, không hợp cho sổ sách.
--
-- Bộ đếm nằm trong cùng giao dịch với chứng từ: giao dịch hỏng thì số cũng
-- không bị tiêu — nên không có lỗ hổng trong dãy số.
--
-- Mã lô theo NGÀY: L260925-003 = lô thứ 3 tạo ngày 25/9/2026. Đọc mã là biết
-- lô tươi hay cũ, không cần tra máy.
-- =============================================================================
create table kho_so_thu_tu (
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete cascade,
  loai         text not null,
  ky           text not null,
  so_cuoi      int not null default 0,
  primary key (chi_nhanh_id, loai, ky)
);

comment on table kho_so_thu_tu is
  'Bộ đếm số chứng từ và mã lô theo chi nhánh, loại, kỳ. Chỉ kho_sinh_so() ghi vào.';

create or replace function kho_sinh_so(p_chi_nhanh_id uuid, p_loai text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ky text;
  v_so int;
begin
  v_ky := case when p_loai = 'L' then to_char(hom_nay_vn(), 'YYMMDD')
               else to_char(hom_nay_vn(), 'YYMM') end;

  insert into kho_so_thu_tu (chi_nhanh_id, loai, ky, so_cuoi)
  values (p_chi_nhanh_id, p_loai, v_ky, 1)
  on conflict (chi_nhanh_id, loai, ky)
    do update set so_cuoi = kho_so_thu_tu.so_cuoi + 1
  returning so_cuoi into v_so;

  if p_loai = 'L' then
    return 'L' || v_ky || '-' || lpad(v_so::text, 3, '0');
  end if;
  return p_loai || '-' || v_ky || '-' || lpad(v_so::text, 4, '0');
end;
$$;

comment on function kho_sinh_so is
  'Sinh số chứng từ liên tục (PN-2609-0007) hoặc mã lô theo ngày (L260925-003). Nội bộ — chỉ hàm definer khác gọi.';


-- =============================================================================
-- 2 · CHIA TIỀN KHÔNG LỆCH MỘT ĐỒNG
-- =============================================================================
-- Chia 1.000.000đ chi phí vận chuyển cho ba dòng theo kg: làm tròn từng phần
-- thì tổng có thể thành 999.999đ hoặc 1.000.001đ. Phương pháp số dư lớn nhất:
-- làm tròn xuống từng phần, rồi phát từng đồng còn thiếu cho phần có số lẻ
-- lớn nhất. Tổng luôn đúng tuyệt đối.
--
-- Dùng chung cho giá vốn nhập kho (0020), chia giá vốn pha lóc (0022) và chia
-- kg đo được cho các lô (0023) — với kg thì chia theo gram.
-- =============================================================================
create or replace function kho_chia_so_du_lon_nhat(p_tong bigint, p_trong_so numeric[])
returns bigint[]
language plpgsql
immutable
as $$
declare
  n        int := coalesce(array_length(p_trong_so, 1), 0);
  v_tong   numeric := 0;
  v_ts     numeric[];
  v_phan   numeric[];
  v_ra     bigint[];
  v_du     bigint;
  i        int;
begin
  if n = 0 then
    if coalesce(p_tong, 0) <> 0 then
      raise exception 'Không có dòng nào để chia % đồng', p_tong
        using errcode = 'check_violation';
    end if;
    return '{}'::bigint[];
  end if;
  if p_tong is null or p_tong < 0 then
    raise exception 'Số cần chia phải không âm' using errcode = 'check_violation';
  end if;

  v_ts := p_trong_so;
  for i in 1..n loop
    if v_ts[i] is null or v_ts[i] < 0 then
      raise exception 'Trọng số chia phải không âm' using errcode = 'check_violation';
    end if;
    v_tong := v_tong + v_ts[i];
  end loop;

  -- Mọi trọng số bằng 0 thì chia đều.
  if v_tong = 0 then
    v_ts := array_fill(1::numeric, array[n]);
    v_tong := n;
  end if;

  v_ra   := array_fill(0::bigint, array[n]);
  v_phan := array_fill(0::numeric, array[n]);
  v_du   := p_tong;
  for i in 1..n loop
    v_phan[i] := p_tong::numeric * v_ts[i] / v_tong;
    v_ra[i]   := floor(v_phan[i])::bigint;
    v_du      := v_du - v_ra[i];
  end loop;

  for i in
    select u.idx::int
    from unnest(v_phan) with ordinality as u(phan, idx)
    order by (u.phan - floor(u.phan)) desc, u.idx
    limit v_du
  loop
    v_ra[i] := v_ra[i] + 1;
  end loop;

  return v_ra;
end;
$$;

comment on function kho_chia_so_du_lon_nhat is
  'Chia một số nguyên theo trọng số, tổng các phần luôn đúng bằng số gốc (phương pháp số dư lớn nhất).';


-- =============================================================================
-- 3 · LÔ HÀNG
-- =============================================================================
-- Một lô = một đợt hàng có cùng nguồn gốc, cùng hạn dùng, cùng giá vốn/kg:
-- một dòng phiếu nhập được duyệt, hoặc một phần cắt ra từ một phiên pha lóc.
-- Lô BẤT BIẾN sau khi tạo — hạn dùng và giá vốn là sự thật tại thời điểm đó.
--
-- Truy vết: lô phần cắt → phiên pha lóc → các lô tảng đầu vào → dòng phiếu
-- nhập → nhà cung cấp và số lô của nhà cung cấp. Đủ để trả lời "gói thịt khách
-- phản ánh hôm qua đến từ tảng nào, của ai".
-- =============================================================================
create table kho_lo (
  id                 uuid primary key default gen_random_uuid(),
  chi_nhanh_id       uuid not null references chi_nhanh(id) on delete restrict,
  ma_lo              text not null,
  mat_hang_id        uuid not null references kho_mat_hang(id) on delete restrict,
  nguon              text not null,
  phieu_nhap_dong_id uuid,
  phien_pha_id       uuid,
  ngay_dong_goi      date not null default hom_nay_vn(),
  ngay_san_xuat      date,
  han_dung           date not null,
  so_lo_ncc          text,
  truong_them        jsonb not null default '{}',
  created_at         timestamptz not null default now(),

  constraint kho_lo_ma_duy_nhat   unique (chi_nhanh_id, ma_lo),
  constraint kho_lo_nguon_hop_le  check (nguon in ('nhap', 'ton_dau', 'pha_loc', 'dieu_chinh')),
  constraint kho_lo_han_hop_le    check (ngay_san_xuat is null or han_dung >= ngay_san_xuat)
);

create index kho_lo_mat_hang_idx on kho_lo(chi_nhanh_id, mat_hang_id, han_dung);

comment on table kho_lo is
  'Lô hàng: một dòng phiếu nhập đã duyệt hoặc một đầu ra pha lóc. Bất biến. Giá vốn ở kho_lo_gia.';

create table kho_lo_gia (
  lo_id        uuid primary key references kho_lo(id) on delete restrict,
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  gia_tri      bigint not null,
  so_kg_goc    numeric(12,3) not null,
  gia_von_kg   numeric(16,4) generated always as (round(gia_tri::numeric / so_kg_goc, 4)) stored,
  created_at   timestamptz not null default now(),

  constraint kho_lo_gia_gia_tri_hop_le check (gia_tri >= 0),
  constraint kho_lo_gia_kg_hop_le      check (so_kg_goc > 0)
);

comment on table kho_lo_gia is
  'Giá vốn của lô: tổng giá trị (đồng, số nguyên) và số kg lúc tạo. Lưu tổng chứ không lưu đơn giá làm tròn — nhờ vậy tổng giá trị các lô luôn khớp tuyệt đối với phiếu gốc.';

create or replace function kho_lo_chan_sua_xoa()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Lô hàng và giá vốn của lô là bất biến. Nhập sai thì hủy phiếu (khi lô chưa được dùng) hoặc điều chỉnh qua kiểm kê.'
    using errcode = 'restrict_violation';
end;
$$;

create trigger kho_lo_chan_sua
  before update or delete on kho_lo
  for each row execute function kho_lo_chan_sua_xoa();

create trigger kho_lo_gia_chan_sua
  before update or delete on kho_lo_gia
  for each row execute function kho_lo_chan_sua_xoa();


-- =============================================================================
-- 4 · TỒN KHO VÀ SỔ KHO
-- =============================================================================
create table kho_ton (
  lo_id        uuid not null references kho_lo(id) on delete restrict,
  vi_tri_id    uuid not null references kho_vi_tri(id) on delete restrict,
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  mat_hang_id  uuid not null references kho_mat_hang(id) on delete restrict,
  so_kg        numeric(12,3) not null default 0,
  so_goi       int not null default 0,
  updated_at   timestamptz not null default now(),

  primary key (lo_id, vi_tri_id),
  constraint kho_ton_khong_am check (so_kg >= 0 and so_goi >= 0)
);

create index kho_ton_con_hang_idx on kho_ton(chi_nhanh_id, vi_tri_id, mat_hang_id)
  where so_kg > 0 or so_goi > 0;

comment on table kho_ton is
  'Tồn hiện tại theo lô × vị trí. CHỈ trigger của kho_so_cai ghi được vào đây.';

create or replace function kho_ton_chi_qua_so_cai()
returns trigger
language plpgsql
as $$
begin
  -- Độ sâu 1 = một câu lệnh ghi thẳng vào kho_ton. Độ sâu 2 = đang chạy bên
  -- trong trigger của kho_so_cai. Chỉ đường thứ hai được phép.
  if pg_trigger_depth() < 2 then
    raise exception 'Tồn kho chỉ thay đổi qua sổ kho — không sửa tay được'
      using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger kho_ton_chi_qua_so_cai_trigger
  before insert or update or delete on kho_ton
  for each row execute function kho_ton_chi_qua_so_cai();

-- -----------------------------------------------------------------------------
-- SỔ KHO
-- -----------------------------------------------------------------------------
-- Loại dòng và dấu:
--   nhap, pha_loc_ra, chuyen_den            : cộng
--   pha_loc_vao, chuyen_di, ban, xuat_bep, huy : trừ
--   kiem_ke  : chênh lệch khi kiểm kê (cộng hoặc trừ)
--   hao_hut  : điều chỉnh trọng lượng tự động — ví dụ tổng kg trên nhãn cân
--              lệch với kg trung bình của lô (cộng hoặc trừ)
--   dao_nguoc: đảo đúng một dòng cũ (dao_cua), để hủy phiếu mà không sửa sổ
-- -----------------------------------------------------------------------------
create table kho_so_cai (
  id            uuid primary key default gen_random_uuid(),
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  lo_id         uuid not null references kho_lo(id) on delete restrict,
  vi_tri_id     uuid not null references kho_vi_tri(id) on delete restrict,
  mat_hang_id   uuid not null references kho_mat_hang(id) on delete restrict,
  loai          text not null,
  so_kg         numeric(12,3) not null,
  so_goi        int not null default 0,
  ton_sau_kg    numeric(12,3) not null default 0,
  ton_sau_goi   int not null default 0,
  chung_tu_loai text not null,
  chung_tu_id   uuid not null,
  dao_cua       uuid unique references kho_so_cai(id) on delete restrict,
  ghi_chu       text,
  nguoi_ghi     uuid references nhan_su(id) on delete set null,
  ngay          date not null default hom_nay_vn(),
  -- clock_timestamp: nhiều dòng ghi trong một giao dịch vẫn có thứ tự thật.
  created_at    timestamptz not null default clock_timestamp(),

  constraint kho_so_cai_khac_khong check (so_kg <> 0 or so_goi <> 0),
  constraint kho_so_cai_loai_hop_le check (loai in (
    'nhap', 'pha_loc_vao', 'pha_loc_ra', 'chuyen_di', 'chuyen_den',
    'ban', 'xuat_bep', 'huy', 'kiem_ke', 'hao_hut', 'dao_nguoc')),
  constraint kho_so_cai_dau_hop_le check (
    (loai in ('nhap', 'pha_loc_ra', 'chuyen_den') and so_kg >= 0 and so_goi >= 0)
    or (loai in ('pha_loc_vao', 'chuyen_di', 'ban', 'xuat_bep', 'huy') and so_kg <= 0 and so_goi <= 0)
    or loai in ('kiem_ke', 'hao_hut', 'dao_nguoc')
  ),
  constraint kho_so_cai_chung_tu_hop_le check (chung_tu_loai in (
    'phieu_nhap', 'phien_pha', 'phieu_xuat', 'kiem_ke', 'ban_hang')),
  constraint kho_so_cai_dao_nguoc_hop_le check ((loai = 'dao_nguoc') = (dao_cua is not null))
);

create index kho_so_cai_lo_idx       on kho_so_cai(lo_id, created_at);
create index kho_so_cai_ngay_idx     on kho_so_cai(chi_nhanh_id, ngay);
create index kho_so_cai_chung_tu_idx on kho_so_cai(chung_tu_loai, chung_tu_id);
create index kho_so_cai_mat_hang_idx on kho_so_cai(mat_hang_id, ngay);

comment on table kho_so_cai is
  'Sổ kho BẤT BIẾN. Không bao giờ UPDATE/DELETE — sửa sai bằng dòng dao_nguoc hoặc kiem_ke. Không có cột tiền: giá trị = so_kg × kho_lo_gia.gia_von_kg.';

-- Trước mỗi dòng sổ: khóa lô, kiểm vị trí, tính tồn sau, chặn âm, cập nhật
-- kho_ton. Chi nhánh và mặt hàng lấy TỪ LÔ — người gọi truyền gì cũng bị bỏ
-- qua, nên không thể ghi lô chi nhánh A vào sổ chi nhánh B.
create or replace function kho_so_cai_ghi()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_lo     kho_lo;
  v_vt     kho_vi_tri;
  v_goc    kho_so_cai;
  v_kg     numeric(12,3);
  v_goi    int;
  v_dv     text;
begin
  select * into v_lo from kho_lo where id = new.lo_id for update;
  if not found then
    raise exception 'Không tìm thấy lô hàng' using errcode = 'foreign_key_violation';
  end if;

  select * into v_vt from kho_vi_tri where id = new.vi_tri_id;
  if not found or v_vt.chi_nhanh_id <> v_lo.chi_nhanh_id then
    raise exception 'Vị trí kho không thuộc chi nhánh của lô hàng'
      using errcode = 'check_violation';
  end if;

  new.chi_nhanh_id := v_lo.chi_nhanh_id;
  new.mat_hang_id  := v_lo.mat_hang_id;

  if new.dao_cua is not null then
    select * into v_goc from kho_so_cai where id = new.dao_cua;
    if not found
       or v_goc.lo_id <> new.lo_id
       or v_goc.vi_tri_id <> new.vi_tri_id
       or new.so_kg <> -v_goc.so_kg
       or new.so_goi <> -v_goc.so_goi then
      raise exception 'Dòng đảo ngược phải bằng đúng dòng gốc, ngược dấu'
        using errcode = 'check_violation';
    end if;
  end if;

  select so_kg, so_goi into v_kg, v_goi
  from kho_ton where lo_id = new.lo_id and vi_tri_id = new.vi_tri_id
  for update;
  v_kg  := coalesce(v_kg, 0);
  v_goi := coalesce(v_goi, 0);

  new.ton_sau_kg  := v_kg + new.so_kg;
  new.ton_sau_goi := v_goi + new.so_goi;

  if new.ton_sau_kg < 0 or new.ton_sau_goi < 0 then
    select don_vi_goi into v_dv from kho_mat_hang where id = v_lo.mat_hang_id;
    raise exception 'Không đủ tồn: lô % ở "%" chỉ còn % kg và % %',
      v_lo.ma_lo, v_vt.ten, v_kg, v_goi, v_dv
      using errcode = 'check_violation';
  end if;

  insert into kho_ton (lo_id, vi_tri_id, chi_nhanh_id, mat_hang_id, so_kg, so_goi, updated_at)
  values (new.lo_id, new.vi_tri_id, new.chi_nhanh_id, new.mat_hang_id,
          new.ton_sau_kg, new.ton_sau_goi, now())
  on conflict (lo_id, vi_tri_id) do update
    set so_kg = excluded.so_kg, so_goi = excluded.so_goi, updated_at = now();

  return new;
end;
$$;

create trigger kho_so_cai_ghi_trigger
  before insert on kho_so_cai
  for each row execute function kho_so_cai_ghi();

create or replace function kho_so_cai_chan_sua_xoa()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Sổ kho là bất biến. Muốn sửa sai, ghi thêm một dòng đảo ngược hoặc điều chỉnh kiểm kê.'
    using errcode = 'restrict_violation';
end;
$$;

create trigger kho_so_cai_chan_sua
  before update or delete on kho_so_cai
  for each row execute function kho_so_cai_chan_sua_xoa();

-- Phép thử toàn vẹn: tồn hiện tại phải bằng đúng tổng sổ. Trả về các cặp
-- lô × vị trí bị lệch — bình thường là KHÔNG CÓ DÒNG NÀO.
create or replace function kho_doi_soat_ton()
returns table (lo_id uuid, vi_tri_id uuid,
               ton_kg numeric, so_cai_kg numeric, ton_goi bigint, so_cai_goi bigint)
language sql
stable
set search_path = public
as $$
  select coalesce(t.lo_id, s.lo_id), coalesce(t.vi_tri_id, s.vi_tri_id),
         coalesce(t.so_kg, 0), coalesce(s.kg, 0),
         coalesce(t.so_goi, 0)::bigint, coalesce(s.goi, 0)::bigint
  from kho_ton t
  full join (
    select sc.lo_id, sc.vi_tri_id, sum(sc.so_kg) as kg, sum(sc.so_goi) as goi
    from kho_so_cai sc
    group by sc.lo_id, sc.vi_tri_id
  ) s on s.lo_id = t.lo_id and s.vi_tri_id = t.vi_tri_id
  where coalesce(t.so_kg, 0) <> coalesce(s.kg, 0)
     or coalesce(t.so_goi, 0) <> coalesce(s.goi, 0);
$$;

comment on function kho_doi_soat_ton is
  'Đối soát tồn với sổ kho. Không trả dòng nào nghĩa là toàn vẹn.';


-- =============================================================================
-- 5 · PHIẾU NHẬP
-- =============================================================================
-- Hai loại:
--   mua     : hàng mua của nhà cung cấp — có giá, có hóa đơn, vào công nợ
--   ton_dau : tồn đầu kỳ, nhập MỘT LẦN khi bắt đầu dùng phần mềm. Không có
--             nhà cung cấp, không vào công nợ, nhưng vẫn phải duyệt.
--
-- Vòng đời:
--   nhap ─gửi→ cho_duyet ─duyệt→ da_duyet ─hủy (lô chưa dùng)→ da_huy
--                 │   └─rút về→ nhap
--                 └─từ chối→ tu_choi ─sửa→ nhap
--   nhap / tu_choi ─hủy→ da_huy
--
-- phien_ban tăng sau mỗi lần ghi: hai máy cùng mở một phiếu nháp thì máy lưu
-- sau bị từ chối thay vì lặng lẽ đè lên bản của máy kia.
-- ma_gui do trang web sinh lúc hiện form: bấm "Lưu" hai lần, hay F5 sau khi
-- lưu, vẫn chỉ ra MỘT phiếu.
-- =============================================================================
create table kho_phieu_nhap (
  id              uuid primary key default gen_random_uuid(),
  chi_nhanh_id    uuid not null references chi_nhanh(id) on delete restrict,
  so_phieu        text not null,
  ma_gui          uuid not null,
  phien_ban       int not null default 1,
  loai            text not null default 'mua',
  nha_cung_cap_id uuid references kho_nha_cung_cap(id) on delete restrict,
  vi_tri_id       uuid not null references kho_vi_tri(id) on delete restrict,
  ngay_nhap       date not null default hom_nay_vn(),
  so_hoa_don      text,
  ngay_hoa_don    date,
  han_thanh_toan  date,
  tien_thue       bigint not null default 0,
  chi_phi_khac    bigint not null default 0,
  ghi_chu         text,
  anh             text[] not null default '{}',
  truong_them     jsonb not null default '{}',
  trang_thai      text not null default 'nhap',
  ly_do           text,
  nguoi_tao       uuid references nhan_su(id) on delete set null,
  nguoi_gui       uuid references nhan_su(id) on delete set null,
  gui_luc         timestamptz,
  nguoi_duyet     uuid references nhan_su(id) on delete set null,
  duyet_luc       timestamptz,
  nguoi_huy       uuid references nhan_su(id) on delete set null,
  huy_luc         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint kho_phieu_nhap_so_duy_nhat  unique (chi_nhanh_id, so_phieu),
  constraint kho_phieu_nhap_ma_gui_duy_nhat unique (ma_gui),
  constraint kho_phieu_nhap_loai_hop_le  check (loai in ('mua', 'ton_dau')),
  constraint kho_phieu_nhap_trang_thai_hop_le
    check (trang_thai in ('nhap', 'cho_duyet', 'da_duyet', 'tu_choi', 'da_huy')),
  constraint kho_phieu_nhap_tien_hop_le  check (tien_thue >= 0 and chi_phi_khac >= 0),
  constraint kho_phieu_nhap_ton_dau_hop_le check (
    loai = 'mua' or (nha_cung_cap_id is null and tien_thue = 0 and chi_phi_khac = 0)),
  constraint kho_phieu_nhap_truong_them_hop_le check (jsonb_typeof(truong_them) = 'object')
);

create index kho_phieu_nhap_trang_thai_idx on kho_phieu_nhap(chi_nhanh_id, trang_thai, ngay_nhap desc);
create index kho_phieu_nhap_ncc_idx on kho_phieu_nhap(nha_cung_cap_id) where nha_cung_cap_id is not null;

create trigger kho_phieu_nhap_updated_at
  before update on kho_phieu_nhap
  for each row execute function tu_dong_cap_nhat_updated_at();

-- Chứng từ: kiểm KIỂU khi lưu, kiểm BẮT BUỘC lúc gửi duyệt.
create trigger kho_phieu_nhap_truong_them_trigger
  before insert or update on kho_phieu_nhap
  for each row execute function kho_truong_them_kiem('phieu_nhap', 'false');

comment on table kho_phieu_nhap is
  'Phiếu nhập hàng (mua) và tồn đầu kỳ. Chỉ ghi qua các hàm kho_*_phieu_nhap. Tồn chỉ cộng khi duyệt.';

create table kho_phieu_nhap_dong (
  id            uuid primary key default gen_random_uuid(),
  phieu_nhap_id uuid not null references kho_phieu_nhap(id) on delete cascade,
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  thu_tu        int not null default 0,
  mat_hang_id   uuid not null references kho_mat_hang(id) on delete restrict,
  so_goi        int not null default 0,
  so_kg         numeric(12,3) not null,
  don_gia_kg    bigint not null default 0,
  thanh_tien    bigint generated always as (round(so_kg * don_gia_kg)::bigint) stored,
  so_lo_ncc     text,
  ngay_san_xuat date,
  han_dung      date not null,
  truong_them   jsonb not null default '{}',
  lo_id         uuid references kho_lo(id) on delete restrict,

  constraint kho_phieu_nhap_dong_so_hop_le   check (so_goi >= 0 and so_kg > 0 and don_gia_kg >= 0),
  constraint kho_phieu_nhap_dong_han_hop_le  check (ngay_san_xuat is null or han_dung >= ngay_san_xuat),
  constraint kho_phieu_nhap_dong_truong_them_hop_le check (jsonb_typeof(truong_them) = 'object')
);

create index kho_phieu_nhap_dong_phieu_idx on kho_phieu_nhap_dong(phieu_nhap_id, thu_tu);

create trigger kho_phieu_nhap_dong_truong_them_trigger
  before insert or update on kho_phieu_nhap_dong
  for each row execute function kho_truong_them_kiem('lo_hang', 'false');

alter table kho_lo
  add constraint kho_lo_phieu_nhap_dong_fk
  foreign key (phieu_nhap_dong_id) references kho_phieu_nhap_dong(id) on delete restrict;

comment on table kho_phieu_nhap_dong is
  'Dòng phiếu nhập. Mỗi dòng thành MỘT lô khi phiếu được duyệt (lo_id). Ô thông tin thêm của dòng (đối tượng lo_hang) được chép sang lô.';


-- =============================================================================
-- 6 · HÀM PHIẾU NHẬP
-- =============================================================================

-- Đọc các dòng hàng từ jsonb. Chỉ nhận đúng các khóa đã biết, đúng kiểu.
-- Hạn dùng bỏ trống thì lấy ngày nhập + hạn mặc định của mặt hàng.
create or replace function kho_ghi_dong_phieu_nhap(
  p_phieu_id     uuid,
  p_chi_nhanh_id uuid,
  p_ngay_nhap    date,
  p_dong         jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dong  jsonb;
  v_khoa  text;
  v_i     int := 0;
  v_mh    kho_mat_hang;
  v_han   date;
  v_nsx   date;
  v_kg    numeric;
  v_goi   int;
  v_gia   bigint;
  c_khoa  constant text[] := array['mat_hang_id', 'so_goi', 'so_kg', 'don_gia_kg',
                                   'so_lo_ncc', 'ngay_san_xuat', 'han_dung', 'truong_them'];
begin
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' then
    raise exception 'Danh sách dòng hàng không hợp lệ' using errcode = 'check_violation';
  end if;

  for v_dong in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if not (v_khoa = any(c_khoa)) then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa
          using errcode = 'check_violation';
      end if;
    end loop;

    if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string'
       or (v_dong ->> 'mat_hang_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Dòng %: chưa chọn mặt hàng', v_i using errcode = 'check_violation';
    end if;
    select * into v_mh from kho_mat_hang
    where id = (v_dong ->> 'mat_hang_id')::uuid;
    if not found or not v_mh.dang_dung then
      raise exception 'Dòng %: mặt hàng không có hoặc đã ngừng dùng', v_i
        using errcode = 'check_violation';
    end if;

    if jsonb_typeof(v_dong -> 'so_kg') is distinct from 'number' then
      raise exception 'Dòng % (%): chưa nhập số kg', v_i, v_mh.ten using errcode = 'check_violation';
    end if;
    v_kg := (v_dong ->> 'so_kg')::numeric;
    if v_kg <= 0 or v_kg >= 1000000 or v_kg <> round(v_kg, 3) then
      raise exception 'Dòng % (%): số kg phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mh.ten
        using errcode = 'check_violation';
    end if;

    v_goi := 0;
    if v_dong ? 'so_goi' and v_dong -> 'so_goi' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi') <> 'number'
         or (v_dong ->> 'so_goi')::numeric <> trunc((v_dong ->> 'so_goi')::numeric)
         or (v_dong ->> 'so_goi')::numeric < 0 then
        raise exception 'Dòng % (%): số % phải là số nguyên không âm', v_i, v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi')::int;
    end if;
    if v_mh.dem_goi and v_goi = 0 then
      raise exception 'Dòng % (%): chưa nhập số %', v_i, v_mh.ten, v_mh.don_vi_goi
        using errcode = 'check_violation';
    end if;

    v_gia := 0;
    if v_dong ? 'don_gia_kg' and v_dong -> 'don_gia_kg' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'don_gia_kg') <> 'number'
         or (v_dong ->> 'don_gia_kg')::numeric <> trunc((v_dong ->> 'don_gia_kg')::numeric)
         or (v_dong ->> 'don_gia_kg')::numeric < 0 then
        raise exception 'Dòng % (%): đơn giá phải là số đồng không âm', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      v_gia := (v_dong ->> 'don_gia_kg')::bigint;
    end if;

    v_nsx := null;
    if coalesce(v_dong ->> 'ngay_san_xuat', '') <> '' then
      begin
        v_nsx := (v_dong ->> 'ngay_san_xuat')::date;
      exception when others then
        raise exception 'Dòng % (%): ngày sản xuất không hợp lệ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end;
    end if;

    if coalesce(v_dong ->> 'han_dung', '') <> '' then
      begin
        v_han := (v_dong ->> 'han_dung')::date;
      exception when others then
        raise exception 'Dòng % (%): hạn dùng không hợp lệ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end;
    elsif v_mh.han_dung_ngay is not null then
      v_han := p_ngay_nhap + v_mh.han_dung_ngay;
    else
      raise exception 'Dòng % (%): chưa có hạn dùng, và mặt hàng chưa cài hạn mặc định', v_i, v_mh.ten
        using errcode = 'check_violation';
    end if;

    insert into kho_phieu_nhap_dong
      (phieu_nhap_id, chi_nhanh_id, thu_tu, mat_hang_id, so_goi, so_kg, don_gia_kg,
       so_lo_ncc, ngay_san_xuat, han_dung, truong_them)
    values
      (p_phieu_id, p_chi_nhanh_id, v_i, v_mh.id, v_goi, v_kg, v_gia,
       nullif(btrim(v_dong ->> 'so_lo_ncc'), ''), v_nsx, v_han,
       coalesce(v_dong -> 'truong_them', '{}'::jsonb));
  end loop;

  return v_i;
end;
$$;

-- Lưu nháp: tạo mới (p_id null) hoặc ghi đè bản nháp. Thay toàn bộ dòng hàng
-- — dòng nháp chưa được ai tham chiếu nên thay được.
create or replace function kho_luu_phieu_nhap(
  p_id              uuid,
  p_chi_nhanh_id    uuid,
  p_ma_gui          uuid,
  p_phien_ban       int,
  p_loai            text,
  p_nha_cung_cap_id uuid,
  p_vi_tri_id       uuid,
  p_ngay_nhap       date,
  p_so_hoa_don      text,
  p_ngay_hoa_don    date,
  p_han_thanh_toan  date,
  p_tien_thue       bigint,
  p_chi_phi_khac    bigint,
  p_ghi_chu         text,
  p_anh             text[],
  p_truong_them     jsonb,
  p_dong            jsonb
)
returns table (phieu_id uuid, phien_ban_moi int, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv   nhan_su;
  v_pn   kho_phieu_nhap;
  v_id   uuid;
  v_pb   int;
  v_anh  text;
begin
  if not kho_duoc(p_chi_nhanh_id, 'nhap') then
    raise exception 'Tài khoản của bạn không được lập phiếu nhập'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();

  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho — vào Cài đặt kho, bấm "Bắt đầu dùng kho"'
      using errcode = 'check_violation';
  end if;

  if p_loai not in ('mua', 'ton_dau') then
    raise exception 'Loại phiếu nhập không hợp lệ' using errcode = 'check_violation';
  end if;
  if p_ngay_nhap is null or p_ngay_nhap > hom_nay_vn() then
    raise exception 'Ngày nhập không được sau hôm nay' using errcode = 'check_violation';
  end if;
  if p_ngay_nhap < hom_nay_vn() - 90 then
    raise exception 'Ngày nhập quá 90 ngày trước — kiểm tra lại ngày' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from kho_vi_tri
                 where id = p_vi_tri_id and chi_nhanh_id = p_chi_nhanh_id
                   and dang_dung and loai in ('kho', 'quay')) then
    raise exception 'Chọn nơi nhận hàng là một kho hoặc quầy đang dùng'
      using errcode = 'check_violation';
  end if;
  if p_loai = 'ton_dau' and (p_nha_cung_cap_id is not null
                             or coalesce(p_tien_thue, 0) <> 0
                             or coalesce(p_chi_phi_khac, 0) <> 0) then
    raise exception 'Phiếu tồn đầu kỳ không có nhà cung cấp, thuế hay chi phí mua'
      using errcode = 'check_violation';
  end if;
  if coalesce(p_tien_thue, 0) < 0 or coalesce(p_chi_phi_khac, 0) < 0 then
    raise exception 'Tiền thuế và chi phí khác không được âm' using errcode = 'check_violation';
  end if;
  if p_nha_cung_cap_id is not null and not exists (
       select 1 from kho_nha_cung_cap where id = p_nha_cung_cap_id and dang_dung) then
    raise exception 'Nhà cung cấp không có hoặc đã ngừng dùng' using errcode = 'check_violation';
  end if;
  foreach v_anh in array coalesce(p_anh, '{}'::text[]) loop
    if v_anh not like p_chi_nhanh_id::text || '/nhap/%' then
      raise exception 'Đường dẫn ảnh không thuộc chi nhánh này' using errcode = 'check_violation';
    end if;
  end loop;

  if p_id is null then
    select pn.id, pn.phien_ban into v_id, v_pb
    from kho_phieu_nhap pn where pn.ma_gui = p_ma_gui;
    if found then
      return query select v_id, v_pb, true;
      return;
    end if;

    insert into kho_phieu_nhap
      (chi_nhanh_id, so_phieu, ma_gui, loai, nha_cung_cap_id, vi_tri_id, ngay_nhap,
       so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_thue, chi_phi_khac,
       ghi_chu, anh, truong_them, nguoi_tao)
    values
      (p_chi_nhanh_id,
       kho_sinh_so(p_chi_nhanh_id, case when p_loai = 'ton_dau' then 'TD' else 'PN' end),
       p_ma_gui, p_loai, p_nha_cung_cap_id, p_vi_tri_id, p_ngay_nhap,
       nullif(btrim(p_so_hoa_don), ''), p_ngay_hoa_don, p_han_thanh_toan,
       coalesce(p_tien_thue, 0), coalesce(p_chi_phi_khac, 0),
       nullif(btrim(p_ghi_chu), ''), coalesce(p_anh, '{}'), coalesce(p_truong_them, '{}'),
       v_nv.id)
    returning kho_phieu_nhap.id, kho_phieu_nhap.phien_ban into v_id, v_pb;
  else
    select * into v_pn from kho_phieu_nhap where kho_phieu_nhap.id = p_id for update;
    if not found or v_pn.chi_nhanh_id <> p_chi_nhanh_id then
      raise exception 'Không tìm thấy phiếu nhập' using errcode = 'foreign_key_violation';
    end if;
    if v_pn.trang_thai = 'cho_duyet' then
      raise exception 'Phiếu đang chờ duyệt — rút về rồi mới sửa được' using errcode = 'check_violation';
    end if;
    if v_pn.trang_thai not in ('nhap', 'tu_choi') then
      raise exception 'Phiếu % đã % — không sửa được nữa', v_pn.so_phieu,
        case v_pn.trang_thai when 'da_duyet' then 'được duyệt' else 'bị hủy' end
        using errcode = 'check_violation';
    end if;
    if p_phien_ban is distinct from v_pn.phien_ban then
      raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
        using errcode = 'check_violation';
    end if;
    if p_loai <> v_pn.loai then
      raise exception 'Không đổi được loại phiếu sau khi đã tạo' using errcode = 'check_violation';
    end if;

    update kho_phieu_nhap set
      nha_cung_cap_id = p_nha_cung_cap_id,
      vi_tri_id       = p_vi_tri_id,
      ngay_nhap       = p_ngay_nhap,
      so_hoa_don      = nullif(btrim(p_so_hoa_don), ''),
      ngay_hoa_don    = p_ngay_hoa_don,
      han_thanh_toan  = p_han_thanh_toan,
      tien_thue       = coalesce(p_tien_thue, 0),
      chi_phi_khac    = coalesce(p_chi_phi_khac, 0),
      ghi_chu         = nullif(btrim(p_ghi_chu), ''),
      anh             = coalesce(p_anh, '{}'),
      truong_them     = coalesce(p_truong_them, '{}'),
      trang_thai      = 'nhap',
      phien_ban       = kho_phieu_nhap.phien_ban + 1
    where kho_phieu_nhap.id = p_id
    returning kho_phieu_nhap.id, kho_phieu_nhap.phien_ban into v_id, v_pb;

    delete from kho_phieu_nhap_dong where phieu_nhap_id = p_id;
  end if;

  perform kho_ghi_dong_phieu_nhap(v_id, p_chi_nhanh_id, p_ngay_nhap, coalesce(p_dong, '[]'::jsonb));

  return query select v_id, v_pb, false;
end;
$$;

comment on function kho_luu_phieu_nhap is
  'Lưu nháp phiếu nhập (tạo mới khi p_id null). Chống trùng bằng p_ma_gui, chống ghi đè bằng p_phien_ban. Không chạm tồn kho.';

create or replace function kho_gui_duyet_phieu_nhap(p_id uuid, p_phien_ban int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn   kho_phieu_nhap;
  v_dong kho_phieu_nhap_dong;
  v_so   int;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id for update;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được gửi duyệt'
      using errcode = 'insufficient_privilege';
  end if;
  if v_pn.trang_thai = 'cho_duyet' then
    return 'Phiếu ' || v_pn.so_phieu || ' đã được gửi duyệt trước đó.';
  end if;
  if v_pn.trang_thai not in ('nhap', 'tu_choi') then
    raise exception 'Phiếu % không còn ở trạng thái nháp', v_pn.so_phieu
      using errcode = 'check_violation';
  end if;
  if p_phien_ban is distinct from v_pn.phien_ban then
    raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
      using errcode = 'check_violation';
  end if;
  if v_pn.loai = 'mua' and v_pn.nha_cung_cap_id is null then
    raise exception 'Chưa chọn nhà cung cấp' using errcode = 'check_violation';
  end if;

  select count(*) into v_so from kho_phieu_nhap_dong where phieu_nhap_id = p_id;
  if v_so = 0 then
    raise exception 'Phiếu chưa có dòng hàng nào' using errcode = 'check_violation';
  end if;

  -- Ô bắt buộc: kiểm lúc gửi, không kiểm lúc lưu nháp.
  perform kho_chuan_hoa_truong_them('phieu_nhap', v_pn.truong_them, true);
  for v_dong in select * from kho_phieu_nhap_dong where phieu_nhap_id = p_id order by thu_tu loop
    perform kho_chuan_hoa_truong_them('lo_hang', v_dong.truong_them, true);
  end loop;

  update kho_phieu_nhap set
    trang_thai = 'cho_duyet',
    nguoi_gui  = (nhan_su_hien_tai()).id,
    gui_luc    = now(),
    ly_do      = null,
    phien_ban  = phien_ban + 1
  where id = p_id;

  return 'Đã gửi phiếu ' || v_pn.so_phieu || ' chờ quản lý duyệt.';
end;
$$;

create or replace function kho_rut_phieu_nhap(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn kho_phieu_nhap;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id for update;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được rút phiếu'
      using errcode = 'insufficient_privilege';
  end if;
  if v_pn.trang_thai = 'nhap' then
    return 'Phiếu ' || v_pn.so_phieu || ' đang là bản nháp.';
  end if;
  if v_pn.trang_thai <> 'cho_duyet' then
    raise exception 'Chỉ rút được phiếu đang chờ duyệt' using errcode = 'check_violation';
  end if;

  update kho_phieu_nhap set trang_thai = 'nhap', phien_ban = phien_ban + 1 where id = p_id;
  return 'Đã rút phiếu ' || v_pn.so_phieu || ' về để sửa.';
end;
$$;

create or replace function kho_duyet_phieu_nhap(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn     kho_phieu_nhap;
  v_cd     kho_cai_dat;
  v_nv     nhan_su;
  v_dong   kho_phieu_nhap_dong;
  v_ids    uuid[];
  v_kg     numeric[];
  v_hang   numeric[];
  v_cp     bigint[];
  v_vat    bigint[];
  v_tong_hang bigint;
  v_lo     uuid;
  v_i      int := 0;
  v_han_tt date;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được duyệt phiếu'
      using errcode = 'insufficient_privilege';
  end if;

  -- Khóa theo đúng thứ tự: cài đặt chi nhánh trước, phiếu sau.
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_pn.chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;
  select * into v_pn from kho_phieu_nhap where id = p_id for update;

  if v_pn.trang_thai = 'da_duyet' then
    return 'Phiếu ' || v_pn.so_phieu || ' đã được duyệt trước đó.';
  end if;
  if v_pn.trang_thai <> 'cho_duyet' then
    raise exception 'Phiếu % chưa được gửi duyệt', v_pn.so_phieu using errcode = 'check_violation';
  end if;

  v_nv := nhan_su_hien_tai();
  if not v_cd.cho_tu_duyet
     and v_nv.id is not null
     and v_nv.id in (v_pn.nguoi_tao, v_pn.nguoi_gui) then
    raise exception 'Cài đặt không cho tự duyệt phiếu do chính mình lập — nhờ quản lý khác duyệt'
      using errcode = 'insufficient_privilege';
  end if;

  select array_agg(d.id order by d.thu_tu),
         array_agg(d.so_kg order by d.thu_tu),
         array_agg(d.thanh_tien::numeric order by d.thu_tu),
         coalesce(sum(d.thanh_tien), 0)
    into v_ids, v_kg, v_hang, v_tong_hang
  from kho_phieu_nhap_dong d where d.phieu_nhap_id = p_id;

  if v_ids is null then
    raise exception 'Phiếu chưa có dòng hàng nào' using errcode = 'check_violation';
  end if;

  -- Giá vốn nhập kho = tiền hàng + chi phí khác (chia theo kg) + thuế (chia
  -- theo tiền hàng) — mỗi khoản chỉ tính khi cài đặt bật.
  v_cp  := kho_chia_so_du_lon_nhat(
             case when v_cd.chi_phi_vao_gia_von then v_pn.chi_phi_khac else 0 end, v_kg);
  v_vat := kho_chia_so_du_lon_nhat(
             case when v_cd.vat_vao_gia_von then v_pn.tien_thue else 0 end,
             case when v_tong_hang > 0 then v_hang else v_kg end);

  for v_dong in
    select * from kho_phieu_nhap_dong where phieu_nhap_id = p_id order by thu_tu
  loop
    v_i := v_i + 1;

    insert into kho_lo
      (chi_nhanh_id, ma_lo, mat_hang_id, nguon, phieu_nhap_dong_id,
       ngay_dong_goi, ngay_san_xuat, han_dung, so_lo_ncc, truong_them)
    values
      (v_pn.chi_nhanh_id, kho_sinh_so(v_pn.chi_nhanh_id, 'L'), v_dong.mat_hang_id,
       case when v_pn.loai = 'ton_dau' then 'ton_dau' else 'nhap' end, v_dong.id,
       v_pn.ngay_nhap, v_dong.ngay_san_xuat, v_dong.han_dung, v_dong.so_lo_ncc,
       v_dong.truong_them)
    returning id into v_lo;

    insert into kho_lo_gia (lo_id, chi_nhanh_id, gia_tri, so_kg_goc)
    values (v_lo, v_pn.chi_nhanh_id,
            v_dong.thanh_tien + v_cp[v_i] + v_vat[v_i], v_dong.so_kg);

    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
    values
      (v_pn.chi_nhanh_id, v_lo, v_pn.vi_tri_id, v_dong.mat_hang_id, 'nhap',
       v_dong.so_kg, v_dong.so_goi, 'phieu_nhap', v_pn.id, v_nv.id, v_pn.ngay_nhap);

    update kho_phieu_nhap_dong set lo_id = v_lo where id = v_dong.id;
  end loop;

  if v_pn.loai = 'mua' and v_pn.han_thanh_toan is null then
    select coalesce(v_pn.ngay_hoa_don, v_pn.ngay_nhap) + ncc.so_ngay_no into v_han_tt
    from kho_nha_cung_cap ncc where ncc.id = v_pn.nha_cung_cap_id;
  else
    v_han_tt := v_pn.han_thanh_toan;
  end if;

  update kho_phieu_nhap set
    trang_thai     = 'da_duyet',
    nguoi_duyet    = v_nv.id,
    duyet_luc      = now(),
    han_thanh_toan = v_han_tt,
    phien_ban      = phien_ban + 1
  where id = p_id;

  return 'Đã duyệt phiếu ' || v_pn.so_phieu || ': ' || v_i || ' lô hàng đã vào kho.';
end;
$$;

comment on function kho_duyet_phieu_nhap is
  'Duyệt phiếu nhập: mỗi dòng thành một lô, có giá vốn nhập kho (cộng chi phí và thuế theo cài đặt, chia không lệch một đồng), và một dòng sổ kho. Chỉ lúc này tồn mới cộng.';

create or replace function kho_tu_choi_phieu_nhap(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn kho_phieu_nhap;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id for update;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được duyệt phiếu'
      using errcode = 'insufficient_privilege';
  end if;
  if v_pn.trang_thai = 'tu_choi' then
    return 'Phiếu ' || v_pn.so_phieu || ' đã bị từ chối trước đó.';
  end if;
  if v_pn.trang_thai <> 'cho_duyet' then
    raise exception 'Chỉ từ chối được phiếu đang chờ duyệt' using errcode = 'check_violation';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Cần ghi lý do từ chối để người lập phiếu biết sửa gì'
      using errcode = 'check_violation';
  end if;

  update kho_phieu_nhap set
    trang_thai  = 'tu_choi',
    ly_do       = btrim(p_ly_do),
    nguoi_duyet = (nhan_su_hien_tai()).id,
    duyet_luc   = now(),
    phien_ban   = phien_ban + 1
  where id = p_id;

  return 'Đã từ chối phiếu ' || v_pn.so_phieu || '.';
end;
$$;

-- Hủy phiếu. Nháp / bị từ chối: người lập hủy được. Đã duyệt: chỉ quản lý,
-- phải có lý do, và chỉ khi MỌI lô của phiếu chưa được dùng — tức mỗi lô chỉ
-- có đúng một dòng sổ là dòng nhập. Hủy = ghi dòng đảo ngược, sổ cũ nguyên vẹn.
create or replace function kho_huy_phieu_nhap(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn    kho_phieu_nhap;
  v_dong  record;
  v_nv    nhan_su;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  if not found then
    raise exception 'Không tìm thấy phiếu nhập' using errcode = 'foreign_key_violation';
  end if;
  if v_pn.trang_thai = 'da_huy' then
    return 'Phiếu ' || v_pn.so_phieu || ' đã bị hủy trước đó.';
  end if;
  if v_pn.trang_thai = 'cho_duyet' then
    raise exception 'Phiếu đang chờ duyệt — rút về hoặc từ chối trước khi hủy'
      using errcode = 'check_violation';
  end if;

  v_nv := nhan_su_hien_tai();

  if v_pn.trang_thai in ('nhap', 'tu_choi') then
    if not kho_duoc(v_pn.chi_nhanh_id, 'nhap') then
      raise exception 'Tài khoản của bạn không được hủy phiếu nhập'
        using errcode = 'insufficient_privilege';
    end if;
    update kho_phieu_nhap set
      trang_thai = 'da_huy', ly_do = nullif(btrim(p_ly_do), ''),
      nguoi_huy = v_nv.id, huy_luc = now(), phien_ban = phien_ban + 1
    where id = p_id;
    return 'Đã hủy phiếu nháp ' || v_pn.so_phieu || '.';
  end if;

  -- Từ đây: phiếu đã duyệt. Cùng cửa với việc duyệt.
  if not kho_duoc(v_pn.chi_nhanh_id, 'duyet') then
    raise exception 'Chỉ quản lý hủy được phiếu đã duyệt' using errcode = 'insufficient_privilege';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Cần ghi lý do hủy phiếu đã duyệt' using errcode = 'check_violation';
  end if;

  perform 1 from kho_cai_dat where chi_nhanh_id = v_pn.chi_nhanh_id for update;
  select * into v_pn from kho_phieu_nhap where id = p_id for update;
  if v_pn.trang_thai <> 'da_duyet' then
    raise exception 'Phiếu vừa được người khác xử lý — tải lại trang' using errcode = 'check_violation';
  end if;

  for v_dong in
    select d.lo_id, l.ma_lo,
           (select count(*) from kho_so_cai s where s.lo_id = d.lo_id) as so_dong
    from kho_phieu_nhap_dong d
    join kho_lo l on l.id = d.lo_id
    where d.phieu_nhap_id = p_id
  loop
    if v_dong.so_dong <> 1 then
      raise exception 'Không hủy được: lô % đã được dùng (pha lóc, chuyển, xuất hoặc kiểm kê). Hãy điều chỉnh qua kiểm kê.', v_dong.ma_lo
        using errcode = 'check_violation';
    end if;
  end loop;

  insert into kho_so_cai
    (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
     chung_tu_loai, chung_tu_id, dao_cua, ghi_chu, nguoi_ghi)
  select s.chi_nhanh_id, s.lo_id, s.vi_tri_id, s.mat_hang_id, 'dao_nguoc',
         -s.so_kg, -s.so_goi, 'phieu_nhap', p_id, s.id, 'Hủy phiếu nhập', v_nv.id
  from kho_so_cai s
  join kho_phieu_nhap_dong d on d.lo_id = s.lo_id
  where d.phieu_nhap_id = p_id and s.loai = 'nhap'
  order by d.thu_tu;

  update kho_phieu_nhap set
    trang_thai = 'da_huy', ly_do = btrim(p_ly_do),
    nguoi_huy = v_nv.id, huy_luc = now(), phien_ban = phien_ban + 1
  where id = p_id;

  return 'Đã hủy phiếu ' || v_pn.so_phieu || ' và trả tồn về như trước khi nhập.';
end;
$$;


-- =============================================================================
-- 7 · VIEW
-- =============================================================================
-- Không view nào chứa tiền trừ kho_v_ton_gia và kho_v_phieu_nhap — và hai view
-- đó đọc bảng chỉ vai xem_gia mới qua được RLS.
-- =============================================================================
create view kho_v_ton with (security_invoker = true) as
select t.chi_nhanh_id,
       t.lo_id,
       l.ma_lo,
       t.mat_hang_id,
       m.ma            as ma_hang,
       m.ten           as ten_hang,
       m.nhom,
       m.loai          as loai_hang,
       m.dem_goi,
       m.don_vi_goi,
       t.vi_tri_id,
       v.ten           as ten_vi_tri,
       v.loai          as loai_vi_tri,
       t.so_kg,
       t.so_goi,
       l.nguon,
       l.ngay_dong_goi,
       l.han_dung,
       (l.han_dung - hom_nay_vn()) as so_ngay_con,
       case
         when l.han_dung < hom_nay_vn() then 'het_han'
         when l.han_dung - hom_nay_vn()
              <= coalesce(m.canh_bao_truoc_ngay, cd.canh_bao_truoc_ngay, 1) then 'sap_het'
         else 'con_han'
       end as tinh_trang_han,
       l.created_at    as lo_tao_luc
from kho_ton t
join kho_lo l       on l.id = t.lo_id
join kho_mat_hang m on m.id = t.mat_hang_id
join kho_vi_tri v   on v.id = t.vi_tri_id
left join kho_cai_dat cd on cd.chi_nhanh_id = t.chi_nhanh_id
where t.so_kg > 0 or t.so_goi > 0;

comment on view kho_v_ton is
  'Tồn hiện tại theo lô × vị trí, kèm hạn dùng và tình trạng (het_han / sap_het / con_han). Không có tiền — nhân viên quầy đọc được.';

create view kho_v_ton_gia with (security_invoker = true) as
select t.chi_nhanh_id, t.lo_id, t.vi_tri_id, t.mat_hang_id, t.so_kg, t.so_goi,
       g.gia_von_kg,
       round(t.so_kg * g.gia_von_kg)::bigint as gia_tri
from kho_ton t
join kho_lo_gia g on g.lo_id = t.lo_id
where t.so_kg > 0 or t.so_goi > 0;

comment on view kho_v_ton_gia is
  'Giá trị tồn theo lô × vị trí. Chỉ vai xem_gia thấy dòng (RLS của kho_lo_gia).';

create view kho_v_phieu_nhap with (security_invoker = true) as
select p.id, p.chi_nhanh_id, p.so_phieu, p.loai, p.trang_thai, p.phien_ban,
       p.nha_cung_cap_id, ncc.ten as ten_nha_cung_cap,
       p.vi_tri_id, v.ten as ten_vi_tri,
       p.ngay_nhap, p.so_hoa_don, p.ngay_hoa_don, p.han_thanh_toan,
       p.tien_thue, p.chi_phi_khac, p.ghi_chu, p.ly_do,
       p.nguoi_tao, p.nguoi_gui, p.gui_luc, p.nguoi_duyet, p.duyet_luc,
       p.nguoi_huy, p.huy_luc, p.created_at, p.updated_at,
       coalesce(d.so_dong, 0)   as so_dong,
       coalesce(d.tong_kg, 0)   as tong_kg,
       coalesce(d.tong_goi, 0)  as tong_goi,
       coalesce(d.tien_hang, 0) as tien_hang,
       coalesce(d.tien_hang, 0) + p.tien_thue + p.chi_phi_khac as tong_tien
from kho_phieu_nhap p
left join kho_nha_cung_cap ncc on ncc.id = p.nha_cung_cap_id
left join kho_vi_tri v on v.id = p.vi_tri_id
left join lateral (
  select count(*) as so_dong, sum(dd.so_kg) as tong_kg,
         sum(dd.so_goi) as tong_goi, sum(dd.thanh_tien) as tien_hang
  from kho_phieu_nhap_dong dd where dd.phieu_nhap_id = p.id
) d on true;

comment on view kho_v_phieu_nhap is
  'Danh sách phiếu nhập kèm tổng kg, tổng tiền. Chỉ vai xem_gia đọc được (RLS của kho_phieu_nhap).';


-- =============================================================================
-- 8 · PHÂN QUYỀN
-- =============================================================================
-- Chỉ có policy ĐỌC. Mọi lệnh ghi đi qua hàm definer tự kiểm vai và chi nhánh.
-- Không có policy ghi nghĩa là PostgREST từ chối insert/update/delete thẳng.
-- =============================================================================
alter table kho_so_thu_tu       enable row level security;
alter table kho_lo              enable row level security;
alter table kho_lo_gia          enable row level security;
alter table kho_ton             enable row level security;
alter table kho_so_cai          enable row level security;
alter table kho_phieu_nhap      enable row level security;
alter table kho_phieu_nhap_dong enable row level security;

-- kho_so_thu_tu: không policy nào — chỉ kho_sinh_so() đụng tới.

create policy kho_lo_doc on kho_lo
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));

create policy kho_lo_gia_doc on kho_lo_gia
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));

create policy kho_ton_doc on kho_ton
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));

create policy kho_so_cai_doc on kho_so_cai
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));

create policy kho_phieu_nhap_doc on kho_phieu_nhap
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));

create policy kho_phieu_nhap_dong_doc on kho_phieu_nhap_dong
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));


-- =============================================================================
-- HÀM NỘI BỘ — không ai gọi thẳng qua API được
-- =============================================================================
-- Supabase cấp EXECUTE cho authenticated trên mọi hàm mới. Ba hàm dưới đây chỉ
-- dành cho các hàm definer khác gọi (chủ hàm vẫn có quyền), nên rút khỏi
-- authenticated. Bọc kiểm pg_roles: chay-test.mjs không tạo vai này.
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_sinh_so(uuid, text) from authenticated';
    execute 'revoke execute on function kho_chia_so_du_lon_nhat(bigint, numeric[]) from authenticated';
    execute 'revoke execute on function kho_ghi_dong_phieu_nhap(uuid, uuid, date, jsonb) from authenticated';
  end if;
end
$$;


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on all functions in schema public from public';
    execute 'revoke execute on all functions in schema public from anon';

    -- Đặt bàn
    execute 'grant execute on function tao_dat_ban(text,text,text,date,time,smallint,text,text,boolean,text,text,text,text,inet) to anon';
    execute 'grant execute on function lich_trong_theo_ma(text,date) to anon';
    execute 'grant execute on function chi_nhanh_cong_khai() to anon';
    execute 'grant execute on function tra_cuu_dat_ban(text,text,inet) to anon';
    execute 'grant execute on function ghi_nhat_ky_tra_cuu(inet,text,boolean) to anon';
    execute 'grant execute on function huy_dat_ban(text,text,text,inet) to anon';

    -- Nội dung
    execute 'grant execute on function noi_dung_cong_khai(text) to anon';
    execute 'grant execute on function thuc_don_cong_khai(text) to anon';

    -- Tuyển dụng
    execute 'grant execute on function tin_tuyen_dung_cong_khai(text) to anon';
    execute 'grant execute on function xin_phieu_tai_cv(inet) to anon';
    execute 'grant execute on function nop_ho_so_ung_tuyen(text,text,text,text,smallint,text,text,text[],uuid,text,boolean,text,int,text,text,inet) to anon';

    -- Đo lường
    execute 'grant execute on function ghi_su_kien_web(text,text,uuid,text,text,text,text,text,text,text) to anon';
  end if;
end
$$;
