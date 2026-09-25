-- =============================================================================
-- BEEFTOWN CRM — 0001 · NỀN MÓNG
-- Chi nhánh · Nhân sự · Hàm dùng chung
-- =============================================================================
-- Đặc tả nghiệp vụ: Beeftown_CRM_Design.html
-- Nguyên tắc: mọi bảng nghiệp vụ đều có branch_id ngay từ đầu, kể cả khi
-- hiện chỉ chạy 1 nhà hàng — thêm chi nhánh sau không phải sửa cấu trúc.
-- =============================================================================

-- Không cần extension nào cả:
--   · gen_random_uuid() có sẵn trong nhân Postgres từ phiên bản 13
--   · So sánh không phân biệt hoa thường dùng chỉ mục lower(), không dùng citext
-- Nhờ vậy schema chạy được trên mọi Postgres chuẩn, không riêng Supabase.

-- -----------------------------------------------------------------------------
-- CHUẨN HÓA SỐ ĐIỆN THOẠI
-- -----------------------------------------------------------------------------
-- Số điện thoại là KHÓA TỰ NHIÊN nối dữ liệu giữa web, POS và Zalo
-- (Beeftown_CRM_Design.html mục B1). Nếu không chuẩn hóa, một người sẽ
-- thành nhiều hồ sơ. Đặt ở tầng database để KHÔNG THỂ lọt số sai định dạng
-- dù nhập từ nguồn nào.
--
--   +84912345678  ->  0912345678
--   84912345678   ->  0912345678
--   0912 345 678  ->  0912345678
--   912345678     ->  0912345678
-- -----------------------------------------------------------------------------
create or replace function chuan_hoa_sdt(raw text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  if raw is null then
    return null;
  end if;

  -- Bỏ mọi ký tự không phải chữ số
  s := regexp_replace(raw, '[^0-9]', '', 'g');

  if s = '' then
    return null;
  end if;

  -- 84xxxxxxxxx -> 0xxxxxxxxx  (chỉ khi đủ dài, tránh nhầm số bắt đầu bằng 84)
  if left(s, 2) = '84' and length(s) between 11 and 12 then
    s := '0' || substring(s from 3);
  end if;

  -- 9 chữ số thiếu số 0 đầu -> thêm vào
  if length(s) = 9 and left(s, 1) <> '0' then
    s := '0' || s;
  end if;

  return s;
end;
$$;

comment on function chuan_hoa_sdt(text) is
  'Chuẩn hóa SĐT Việt Nam về dạng 0xxxxxxxxx. Khóa tự nhiên của bảng khach_hang.';

-- Kiểm tra SĐT hợp lệ sau chuẩn hóa: 10 số, bắt đầu bằng 0
create or replace function sdt_hop_le(raw text)
returns boolean
language sql
immutable
as $$
  select raw ~ '^0[0-9]{9}$';
$$;

-- -----------------------------------------------------------------------------
-- CẬP NHẬT updated_at TỰ ĐỘNG
-- -----------------------------------------------------------------------------
create or replace function tu_dong_cap_nhat_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- =============================================================================
-- CHI NHÁNH
-- =============================================================================
create table chi_nhanh (
  id            uuid primary key default gen_random_uuid(),
  ma            text not null,                   -- 'q1' — dùng trong URL và API
  ten           text   not null,                 -- 'Beeftown Quận 1'
  khu_vuc       text,                            -- 'Cầu Ông Lãnh'
  dia_chi       text,
  dien_thoai    text,

  -- Giờ mở cửa (Beeftown: trưa 11:00–14:00, tối 17:00–22:00)
  trua_bat_dau  time not null default '11:00',
  trua_ket_thuc time not null default '14:00',
  toi_bat_dau   time not null default '17:00',
  toi_ket_thuc  time not null default '22:00',

  -- Đặt bàn
  buoc_khung_gio_phut int not null default 30,   -- khoảng cách giữa các khung giờ
  thoi_luong_bua_phut int not null default 120,  -- một lượt ngồi chiếm bao lâu
  giu_ban_phut        int not null default 15,   -- giữ bàn bao lâu sau giờ hẹn

  dang_hoat_dong boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint chi_nhanh_gio_trua_hop_le check (trua_ket_thuc > trua_bat_dau),
  constraint chi_nhanh_gio_toi_hop_le  check (toi_ket_thuc  > toi_bat_dau),
  constraint chi_nhanh_buoc_hop_le     check (buoc_khung_gio_phut between 15 and 120)
);

-- Mã chi nhánh duy nhất, không phân biệt hoa thường ('Q1' và 'q1' là một)
create unique index chi_nhanh_ma_idx on chi_nhanh(lower(ma));

create trigger chi_nhanh_updated_at
  before update on chi_nhanh
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table chi_nhanh is
  'Chi nhánh nhà hàng. Mọi bảng nghiệp vụ tham chiếu tới đây.';

-- =============================================================================
-- NHÂN SỰ — gắn tài khoản đăng nhập với chi nhánh và vai trò
-- =============================================================================
-- Vai trò:
--   chu_so_huu : xem mọi chi nhánh, mọi báo cáo
--   quan_ly    : toàn quyền trong chi nhánh của mình
--   thu_ngan   : tra khách, ghi lượt ghé, tích/trừ điểm
--   marketing  : xem khách và chạy chiến dịch, KHÔNG sửa được điểm
-- =============================================================================
create type vai_tro as enum ('chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing');

create table nhan_su (
  id          uuid primary key default gen_random_uuid(),
  auth_uid    uuid unique,                       -- id tài khoản Supabase Auth
  chi_nhanh_id uuid references chi_nhanh(id) on delete restrict,
  ho_ten      text not null,
  email       text,
  vai_tro     vai_tro not null default 'thu_ngan',
  dang_lam    boolean not null default true,     -- nghỉ việc thì tắt, không xóa
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- Chủ sở hữu không gắn chi nhánh (xem tất cả); các vai trò khác bắt buộc có
  constraint nhan_su_chi_nhanh_hop_le check (
    (vai_tro = 'chu_so_huu' and chi_nhanh_id is null)
    or (vai_tro <> 'chu_so_huu' and chi_nhanh_id is not null)
  )
);

create trigger nhan_su_updated_at
  before update on nhan_su
  for each row execute function tu_dong_cap_nhat_updated_at();

create index nhan_su_auth_uid_idx on nhan_su(auth_uid) where dang_lam;

comment on table nhan_su is
  'Nhân sự và phân quyền. Nghỉ việc thì đặt dang_lam=false, không xóa dòng (giữ vết ai làm gì).';

-- -----------------------------------------------------------------------------
-- HÀM PHÂN QUYỀN — dùng cho toàn bộ chính sách RLS ở migration 0007
-- -----------------------------------------------------------------------------
-- Đặt security definer + search_path cố định để không bị chiếm quyền qua
-- schema giả mạo.
-- -----------------------------------------------------------------------------
create or replace function nhan_su_hien_tai()
returns nhan_su
language sql
stable
security definer
set search_path = public
as $$
  select * from nhan_su
  where auth_uid = auth.uid()
    and dang_lam
  limit 1;
$$;

create or replace function la_chu_so_huu()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from nhan_su
    where auth_uid = auth.uid()
      and dang_lam
      and vai_tro = 'chu_so_huu'
  );
$$;

-- Nhân sự có được đụng vào dữ liệu của chi_nhanh này không?
create or replace function duoc_truy_cap_chi_nhanh(muc_tieu uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from nhan_su
    where auth_uid = auth.uid()
      and dang_lam
      and (vai_tro = 'chu_so_huu' or chi_nhanh_id = muc_tieu)
  );
$$;

create or replace function co_vai_tro(cac_vai_tro vai_tro[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from nhan_su
    where auth_uid = auth.uid()
      and dang_lam
      and vai_tro = any(cac_vai_tro)
  );
$$;
