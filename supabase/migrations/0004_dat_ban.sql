-- =============================================================================
-- BEEFTOWN CRM — 0004 · ĐẶT BÀN
-- Bàn thật · Khung giờ · Số bàn còn trống
-- =============================================================================
-- Thay thế hai thứ tạm bợ trên website:
--   · google-apps-script.gs  (lưu vào Google Sheet)
--   · hàm remainingFor()     (số bàn trống giả lập)
-- =============================================================================

-- =============================================================================
-- BÀN
-- =============================================================================
create table ban_an (
  id           uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete cascade,
  ten          text not null,               -- 'B01', 'Phòng riêng 1'
  so_cho       smallint not null default 4,
  la_phong_rieng boolean not null default false,
  dang_dung    boolean not null default true,
  created_at   timestamptz not null default now(),

  constraint ban_an_so_cho_hop_le check (so_cho between 1 and 50),
  unique (chi_nhanh_id, ten)
);

create index ban_an_chi_nhanh_idx on ban_an(chi_nhanh_id) where dang_dung;

comment on table ban_an is
  'Bàn thật của nhà hàng. Số bàn còn trống tính từ đây, không phải số giả lập.';

-- =============================================================================
-- ĐẶT BÀN
-- =============================================================================
create type trang_thai_dat_ban as enum (
  'cho_xac_nhan',  -- khách vừa gửi form, chưa gọi xác nhận
  'da_xac_nhan',   -- đã gọi xác nhận
  'da_den',        -- khách đã tới
  'khong_den',     -- đặt rồi không tới (chỉ số cần theo dõi)
  'da_huy'
);

create table dat_ban (
  id            uuid primary key default gen_random_uuid(),
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  khach_hang_id uuid not null references khach_hang(id) on delete cascade,

  ngay          date not null,
  gio           time not null,
  so_khach      smallint not null,
  dip           text,
  ghi_chu       text,

  trang_thai    trang_thai_dat_ban not null default 'cho_xac_nhan',
  ban_an_id     uuid references ban_an(id) on delete set null,  -- xếp bàn khi khách tới

  -- Nguồn khách (quy ước UTM ở Bộ nhận diện số mục F3)
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  trang_gioi_thieu text,

  -- Đồng ý nhận tin tại thời điểm đặt (bản sao để đối chiếu nhanh)
  dong_y_nhan_tin boolean not null default false,

  luot_ghe_id   uuid references luot_ghe(id) on delete set null,  -- nối khi khách tới
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint dat_ban_so_khach_hop_le check (so_khach between 1 and 100)
);

create trigger dat_ban_updated_at
  before update on dat_ban
  for each row execute function tu_dong_cap_nhat_updated_at();

create index dat_ban_lich_idx on dat_ban(chi_nhanh_id, ngay, gio)
  where trang_thai in ('cho_xac_nhan', 'da_xac_nhan');
create index dat_ban_khach_idx on dat_ban(khach_hang_id, ngay desc);

comment on table dat_ban is
  'Đặt bàn. Thay thế Google Sheet — dữ liệu nằm trong database do Beeftown sở hữu.';

-- =============================================================================
-- KHUNG GIỜ & SỐ BÀN CÒN TRỐNG
-- =============================================================================
-- Sinh khung giờ từ cấu hình chi nhánh (trưa + tối, bước 30 phút),
-- không lưu cứng thành bảng — đổi giờ mở cửa chỉ cần sửa chi_nhanh.
-- =============================================================================
-- security definer: website (vai trò anon) gọi được mà không cần quyền đọc
-- bảng chi_nhanh. Chỉ lộ ra khung giờ mở cửa — thông tin vốn đã công khai.
create or replace function khung_gio_trong_ngay(p_chi_nhanh_id uuid)
returns table (gio time, buoi text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cn chi_nhanh;
begin
  select * into v_cn from chi_nhanh where id = p_chi_nhanh_id;
  if not found then
    raise exception 'Không tìm thấy chi nhánh %', p_chi_nhanh_id;
  end if;

  -- generate_series không nhận kiểu `time`, nên sinh trên timestamp với một
  -- ngày mốc bất kỳ rồi ép về time.
  return query
  select t::time, 'trua'::text
  from generate_series(
    date '2000-01-01' + v_cn.trua_bat_dau,
    date '2000-01-01' + v_cn.trua_ket_thuc - make_interval(mins => v_cn.buoc_khung_gio_phut),
    make_interval(mins => v_cn.buoc_khung_gio_phut)
  ) t
  union all
  select t::time, 'toi'::text
  from generate_series(
    date '2000-01-01' + v_cn.toi_bat_dau,
    date '2000-01-01' + v_cn.toi_ket_thuc - make_interval(mins => v_cn.buoc_khung_gio_phut),
    make_interval(mins => v_cn.buoc_khung_gio_phut)
  ) t
  order by 1;
end;
$$;

-- -----------------------------------------------------------------------------
-- SỐ BÀN CÒN TRỐNG TẠI MỘT KHUNG GIỜ
-- -----------------------------------------------------------------------------
-- Một lượt ngồi chiếm thoi_luong_bua_phut (mặc định 120 phút), nên đặt bàn
-- lúc 17:00 sẽ chặn cả khung 17:00–19:00. Bàn trống = tổng bàn đang dùng
-- trừ đi số đặt bàn còn hiệu lực có khoảng thời gian giao nhau.
-- -----------------------------------------------------------------------------
create or replace function so_ban_con_trong(
  p_chi_nhanh_id uuid,
  p_ngay         date,
  p_gio          time
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cn        chi_nhanh;
  v_tong_ban  integer;
  v_da_dat    integer;
  v_bat_dau   timestamp;
  v_ket_thuc  timestamp;
begin
  select * into v_cn from chi_nhanh where id = p_chi_nhanh_id;
  if not found then
    return 0;
  end if;

  select count(*) into v_tong_ban
  from ban_an
  where chi_nhanh_id = p_chi_nhanh_id and dang_dung;

  v_bat_dau  := p_ngay + p_gio;
  v_ket_thuc := v_bat_dau + make_interval(mins => v_cn.thoi_luong_bua_phut);

  -- Đếm đặt bàn có khoảng [bắt đầu, kết thúc) giao với khung đang xét
  select count(*) into v_da_dat
  from dat_ban db
  where db.chi_nhanh_id = p_chi_nhanh_id
    and db.ngay = p_ngay
    and db.trang_thai in ('cho_xac_nhan', 'da_xac_nhan', 'da_den')
    and (db.ngay + db.gio) < v_ket_thuc
    and (db.ngay + db.gio + make_interval(mins => v_cn.thoi_luong_bua_phut)) > v_bat_dau;

  return greatest(v_tong_ban - v_da_dat, 0);
end;
$$;

comment on function so_ban_con_trong is
  'Số bàn còn nhận tại một khung giờ. Thay thế hàm remainingFor() giả lập trên website.';

-- -----------------------------------------------------------------------------
-- LỊCH TRỐNG CẢ NGÀY — API cho website gọi
-- -----------------------------------------------------------------------------
create or replace function lich_trong_theo_ngay(
  p_chi_nhanh_id uuid,
  p_ngay         date
)
returns table (
  gio        time,
  buoi       text,
  con_trong  integer,
  da_qua     boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    k.gio,
    k.buoi,
    so_ban_con_trong(p_chi_nhanh_id, p_ngay, k.gio) as con_trong,
    -- Khung giờ đã qua trong ngày hôm nay thì không nhận nữa
    (p_ngay < current_date)
      or (p_ngay = current_date and k.gio <= current_time) as da_qua
  from khung_gio_trong_ngay(p_chi_nhanh_id) k
  order by k.gio;
$$;

-- =============================================================================
-- TẠO ĐẶT BÀN — dùng cho form trên website
-- =============================================================================
-- Kiểm tra còn bàn NGAY TRONG giao dịch để hai người đặt cùng lúc không
-- vượt quá sức chứa.
-- =============================================================================
create or replace function tao_dat_ban(
  p_chi_nhanh_ma text,
  p_sdt          text,
  p_ho_ten       text,
  p_ngay         date,
  p_gio          time,
  p_so_khach     smallint,
  p_dip          text default null,
  p_ghi_chu      text default null,
  p_dong_y       boolean default false,
  p_utm_source   text default null,
  p_utm_medium   text default null,
  p_utm_campaign text default null,
  p_trang_gioi_thieu text default null,
  p_ip           inet default null
)
returns table (
  dat_ban_id uuid,
  ma_dat_ban text,
  con_trong  integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cn     chi_nhanh;
  v_khach  khach_hang;
  v_trong  integer;
  v_dat    dat_ban;
begin
  select * into v_cn from chi_nhanh
  where lower(ma) = lower(p_chi_nhanh_ma) and dang_hoat_dong;
  if not found then
    raise exception 'Không tìm thấy chi nhánh %', p_chi_nhanh_ma
      using errcode = 'foreign_key_violation';
  end if;

  if p_ngay < current_date then
    raise exception 'Không thể đặt bàn cho ngày trong quá khứ'
      using errcode = 'check_violation';
  end if;

  -- Khóa chi nhánh để việc kiểm tra chỗ trống và ghi đặt bàn là nguyên tử
  perform 1 from chi_nhanh where id = v_cn.id for update;

  v_trong := so_ban_con_trong(v_cn.id, p_ngay, p_gio);
  if v_trong <= 0 then
    raise exception 'Khung giờ % ngày % đã hết bàn', p_gio, p_ngay
      using errcode = 'check_violation';
  end if;

  v_khach := tim_hoac_tao_khach(p_sdt, p_ho_ten, v_cn.id,
                                p_utm_source, p_utm_medium, p_utm_campaign);

  insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach,
                       dip, ghi_chu, dong_y_nhan_tin,
                       utm_source, utm_medium, utm_campaign, trang_gioi_thieu)
  values (v_cn.id, v_khach.id, p_ngay, p_gio, p_so_khach,
          p_dip, p_ghi_chu, p_dong_y,
          p_utm_source, p_utm_medium, p_utm_campaign, p_trang_gioi_thieu)
  returning * into v_dat;

  -- Ghi nhật ký đồng ý — bằng chứng tuân thủ NĐ 13/2023
  if p_dong_y then
    insert into nhat_ky_dong_y (khach_hang_id, dong_y, kenh, noi_dung, ip)
    values (v_khach.id, true, 'web',
            'Tôi đồng ý để Beeftown liên hệ xác nhận đặt bàn và gửi thông tin ưu đãi qua số điện thoại này. Có thể huỷ nhận tin bất cứ lúc nào.',
            p_ip);
  end if;

  return query
  select v_dat.id,
         upper(substring(v_dat.id::text, 1, 6)),   -- mã ngắn đọc cho khách qua điện thoại
         so_ban_con_trong(v_cn.id, p_ngay, p_gio);
end;
$$;

comment on function tao_dat_ban is
  'API tạo đặt bàn cho website. Kiểm tra chỗ trống nguyên tử, chống đặt vượt sức chứa.';
