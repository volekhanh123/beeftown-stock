-- =============================================================================
-- BEEFTOWN CRM — 0006 · GỬI TIN (ZBS)
-- Mẫu tin · Chiến dịch · Nhật ký gửi
-- =============================================================================
-- Từ 01/01/2026 Zalo thay ZNS bằng chuẩn ZBS Template Message.
-- Điều kiện bắt buộc:
--   · OA đã xác thực (tick vàng) — OA thường không gửi được
--   · Có tài khoản ZBS để nạp tiền, và một App
--   · Mẫu tin phải đăng ký duyệt trước (2–3 ngày làm việc)
--   · Người nhận phải từng giao dịch với doanh nghiệp
--
-- Lớp gửi tin được tách riêng để nếu Zalo đổi luật chơi lần nữa (đã đổi
-- 01/01/2026) thì chỉ thay phần này, không phải sửa cả hệ thống.
-- =============================================================================

-- =============================================================================
-- MẪU TIN
-- =============================================================================
-- Hai loại theo phân loại của Zalo:
--   giao_dich  — xác nhận, nhắc lịch, báo điểm. Khách luôn hoan nghênh,
--                KHÔNG cần kiểm tra đồng ý marketing.
--   cham_soc   — ưu đãi, món mới, đánh thức khách. BẮT BUỘC có đồng ý.
-- =============================================================================
create type loai_mau_tin as enum ('giao_dich', 'cham_soc');

create table mau_tin (
  id          uuid primary key default gen_random_uuid(),
  ma          text not null unique,       -- 'ZBS-01' ... khớp Bộ nhận diện số mục B4
  ten         text not null,
  loai        loai_mau_tin not null,
  noi_dung    text not null,              -- nguyên văn, có chỗ trống <customer_name>
  ma_zalo     text,                       -- mã Zalo trả về sau khi duyệt
  da_duyet    boolean not null default false,
  dang_dung   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger mau_tin_updated_at
  before update on mau_tin
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table mau_tin is
  'Mẫu tin ZBS. Chỉ gửi được khi da_duyet = true và có ma_zalo.';

-- =============================================================================
-- CHIẾN DỊCH
-- =============================================================================
create type trang_thai_chien_dich as enum ('nhap', 'dang_chay', 'tam_dung', 'hoan_tat');

create table chien_dich (
  id           uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete cascade,
  mau_tin_id   uuid not null references mau_tin(id) on delete restrict,

  ten          text not null,
  nhom_muc_tieu text,                     -- 'ngu_dong', 'moi'... khớp v_phan_nhom_khach
  trang_thai   trang_thai_chien_dich not null default 'nhap',

  bat_dau      timestamptz,
  ket_thuc     timestamptz,
  created_at   timestamptz not null default now(),
  created_by   uuid references nhan_su(id)
);

create index chien_dich_chi_nhanh_idx on chien_dich(chi_nhanh_id, created_at desc);

-- =============================================================================
-- NHẬT KÝ GỬI TIN
-- =============================================================================
-- Ghi từng tin đã gửi: để đo hiệu quả, để đối soát chi phí với Zalo,
-- và để chứng minh khi có khiếu nại.
-- =============================================================================
create type ket_qua_gui as enum ('cho_gui', 'da_gui', 'that_bai', 'bi_tu_choi');

create table nhat_ky_tin (
  id            uuid primary key default gen_random_uuid(),
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  khach_hang_id uuid not null references khach_hang(id) on delete cascade,
  mau_tin_id    uuid references mau_tin(id) on delete set null,
  chien_dich_id uuid references chien_dich(id) on delete set null,

  sdt_gui    text not null,               -- bản sao SĐT lúc gửi
  noi_dung   text,                        -- nội dung sau khi điền chỗ trống
  ket_qua    ket_qua_gui not null default 'cho_gui',
  ma_zalo_tra_ve text,                    -- id tin nhắn phía Zalo
  loi        text,
  chi_phi    integer,                     -- đồng, để đối soát

  created_at timestamptz not null default now(),
  gui_luc    timestamptz
);

create index nhat_ky_tin_khach_idx on nhat_ky_tin(khach_hang_id, created_at desc);
create index nhat_ky_tin_chien_dich_idx on nhat_ky_tin(chien_dich_id);

comment on table nhat_ky_tin is
  'Nhật ký từng tin. Nguồn đối soát chi phí ZBS và bằng chứng khi khiếu nại.';

-- =============================================================================
-- KIỂM TRA ĐƯỢC PHÉP GỬI — chốt chặn cuối cùng
-- =============================================================================
-- Gọi hàm này trước mọi lần gửi. Nó cưỡng chế đồng thời hai điều kiện:
--   · Yêu cầu pháp lý (NĐ 13/2023): tin quảng cáo phải có đồng ý
--   · Yêu cầu của Zalo: người nhận phải từng giao dịch
-- =============================================================================
create or replace function duoc_phep_gui(
  p_khach_hang_id uuid,
  p_loai_tin      loai_mau_tin
)
returns table (duoc_gui boolean, ly_do text)
language plpgsql
stable
as $$
declare
  v_dang_hoat_dong boolean;
  v_so_lan_ghe     bigint;
  v_dong_y         boolean;
begin
  select kh.dang_hoat_dong,
         (select count(*) from luot_ghe where khach_hang_id = kh.id),
         coalesce(dy.dang_dong_y, false)
    into v_dang_hoat_dong, v_so_lan_ghe, v_dong_y
  from khach_hang kh
  left join v_dong_y_hien_tai dy on dy.khach_hang_id = kh.id
  where kh.id = p_khach_hang_id;

  if not found then
    return query select false, 'Không tìm thấy khách hàng'::text; return;
  end if;

  if not v_dang_hoat_dong then
    return query select false, 'Khách đã yêu cầu xoá dữ liệu'::text; return;
  end if;

  -- Điều kiện của Zalo: phải từng giao dịch mới được nhận tin
  if v_so_lan_ghe = 0 then
    return query select false, 'Khách chưa từng giao dịch — Zalo không cho gửi'::text; return;
  end if;

  -- Tin chăm sóc (quảng cáo) bắt buộc có đồng ý; tin giao dịch thì không
  if p_loai_tin = 'cham_soc' and not v_dong_y then
    return query select false, 'Khách chưa đồng ý nhận tin quảng cáo'::text; return;
  end if;

  return query select true, 'OK'::text;
end;
$$;

comment on function duoc_phep_gui is
  'Chốt chặn trước khi gửi. LUÔN gọi hàm này, đừng gửi thẳng từ danh sách khách.';

-- -----------------------------------------------------------------------------
-- GHI NHẬN MỘT TIN CẦN GỬI — kiểm tra điều kiện rồi mới xếp hàng
-- -----------------------------------------------------------------------------
create or replace function xep_hang_gui_tin(
  p_chi_nhanh_id  uuid,
  p_khach_hang_id uuid,
  p_mau_tin_ma    text,
  p_noi_dung      text default null,
  p_chien_dich_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mau   mau_tin;
  v_khach khach_hang;
  v_check record;
  v_id    uuid;
begin
  select * into v_mau from mau_tin where ma = p_mau_tin_ma and dang_dung;
  if not found then
    raise exception 'Không tìm thấy mẫu tin %', p_mau_tin_ma
      using errcode = 'foreign_key_violation';
  end if;

  if not v_mau.da_duyet or v_mau.ma_zalo is null then
    raise exception 'Mẫu tin % chưa được Zalo duyệt', p_mau_tin_ma
      using errcode = 'check_violation';
  end if;

  select * into v_khach from khach_hang where id = p_khach_hang_id;
  if not found then
    raise exception 'Không tìm thấy khách hàng' using errcode = 'foreign_key_violation';
  end if;

  select * into v_check from duoc_phep_gui(p_khach_hang_id, v_mau.loai);
  if not v_check.duoc_gui then
    raise exception 'Không được phép gửi: %', v_check.ly_do
      using errcode = 'check_violation';
  end if;

  insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, mau_tin_id, chien_dich_id,
                           sdt_gui, noi_dung, ket_qua)
  values (p_chi_nhanh_id, p_khach_hang_id, v_mau.id, p_chien_dich_id,
          v_khach.sdt, coalesce(p_noi_dung, v_mau.noi_dung), 'cho_gui')
  returning id into v_id;

  return v_id;
end;
$$;

-- =============================================================================
-- BỐN MẪU TIN SẴN CÓ — nội dung lấy từ Bộ nhận diện số mục B4
-- =============================================================================
-- da_duyet = false vì chưa gửi Zalo duyệt. Sau khi Zalo duyệt xong thì
-- cập nhật ma_zalo và đặt da_duyet = true.
-- =============================================================================
insert into mau_tin (ma, ten, loai, noi_dung) values
('ZBS-01', 'Xác nhận đặt bàn', 'giao_dich',
 E'BEEFTOWN — XÁC NHẬN ĐẶT BÀN\nKhách hàng: <customer_name>\nSố điện thoại: <phone>\nNgày: <date>\nGiờ: <time>\nSố khách: <guests>\nMã đặt bàn: <booking_code>\n\nBàn được giữ trong 15 phút kể từ giờ hẹn.'),

('ZBS-02', 'Nhắc lịch trước 2 tiếng', 'giao_dich',
 E'BEEFTOWN — NHẮC LỊCH HÔM NAY\nAnh/chị <customer_name> ơi, bàn <guests> khách lúc <time> hôm nay đã sẵn sàng.\nBàn giữ 15 phút kể từ giờ hẹn.'),

('ZBS-03', 'Cảm ơn & xin đánh giá', 'cham_soc',
 E'BEEFTOWN — CẢM ƠN ANH/CHỊ\nCảm ơn anh/chị <customer_name> đã ghé Beeftown hôm nay.\nNếu bữa ăn vừa ý, anh/chị dành 30 giây đánh giá giúp tụi em nhé.\nĐánh giá tại: <google_review_link>'),

('ZBS-04', 'Thông báo tích điểm', 'giao_dich',
 E'BEEFTOWN — THẺ THÀNH VIÊN\nAnh/chị <customer_name> vừa tích <points> điểm từ hóa đơn <amount>đ.\nTổng điểm hiện có: <total_points> điểm\nĐiểm được trừ trực tiếp vào hóa đơn lần sau.');
