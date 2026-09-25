-- =============================================================================
-- BEEFTOWN CRM — 0007 · PHÂN QUYỀN (Row Level Security)
-- =============================================================================
-- Tách dữ liệu theo chi nhánh ở TẦNG DATABASE, không phụ thuộc code app nhớ
-- lọc. Kể cả khi có lỗi lập trình hoặc ai đó gọi API trực tiếp, dữ liệu chi
-- nhánh này vẫn không lọt sang chi nhánh kia.
--
-- Vai trò (xem migration 0001):
--   chu_so_huu : xem mọi chi nhánh
--   quan_ly    : toàn quyền trong chi nhánh mình
--   thu_ngan   : tra khách, ghi lượt ghé, tích/trừ điểm
--   marketing  : xem khách và chạy chiến dịch, KHÔNG sửa được điểm
--
-- Website công khai KHÔNG có quyền vào bảng nào cả — nó chỉ gọi được
-- vài hàm SECURITY DEFINER ở cuối file.
-- =============================================================================

alter table chi_nhanh          enable row level security;
alter table nhan_su            enable row level security;
alter table khach_hang         enable row level security;
alter table nhat_ky_dong_y     enable row level security;
alter table luot_ghe           enable row level security;
alter table cau_hinh_tich_diem enable row level security;
alter table so_cai_diem        enable row level security;
alter table ban_an             enable row level security;
alter table dat_ban            enable row level security;
alter table mau_tin            enable row level security;
alter table chien_dich         enable row level security;
alter table nhat_ky_tin        enable row level security;

-- =============================================================================
-- CHI NHÁNH
-- =============================================================================
create policy chi_nhanh_doc on chi_nhanh
  for select using (duoc_truy_cap_chi_nhanh(id));

create policy chi_nhanh_sua on chi_nhanh
  for all using (la_chu_so_huu()) with check (la_chu_so_huu());

-- =============================================================================
-- NHÂN SỰ — chỉ chủ sở hữu và quản lý mới đụng được
-- =============================================================================
create policy nhan_su_doc on nhan_su
  for select using (
    la_chu_so_huu()
    or auth_uid = auth.uid()                       -- ai cũng xem được hồ sơ mình
    or duoc_truy_cap_chi_nhanh(chi_nhanh_id)
  );

create policy nhan_su_sua on nhan_su
  for all using (la_chu_so_huu()) with check (la_chu_so_huu());

-- =============================================================================
-- KHÁCH HÀNG
-- =============================================================================
-- Khách là dữ liệu toàn hệ thống (SĐT unique), nhưng nhân sự chi nhánh chỉ
-- thấy khách ĐÃ TỪNG tới chi nhánh mình — đặt bàn hoặc đã ăn. Chủ sở hữu
-- thấy tất cả. Quan trọng cho mục tiêu nhượng quyền: chi nhánh nhượng quyền
-- không được xem toàn bộ tệp khách của thương hiệu.
-- =============================================================================
create policy khach_hang_doc on khach_hang
  for select using (
    la_chu_so_huu()
    or exists (
      select 1 from luot_ghe lg
      where lg.khach_hang_id = khach_hang.id
        and duoc_truy_cap_chi_nhanh(lg.chi_nhanh_id)
    )
    or exists (
      select 1 from dat_ban db
      where db.khach_hang_id = khach_hang.id
        and duoc_truy_cap_chi_nhanh(db.chi_nhanh_id)
    )
  );

create policy khach_hang_them on khach_hang
  for insert with check (co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan']::vai_tro[]));

create policy khach_hang_sua on khach_hang
  for update using (co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan']::vai_tro[]));

-- Không ai được XOÁ khách. Khách yêu cầu xoá thì đặt dang_hoat_dong = false
-- (giữ được tính toàn vẹn của sổ cái điểm và lịch sử giao dịch).

-- =============================================================================
-- NHẬT KÝ ĐỒNG Ý — chỉ ghi thêm, không sửa không xoá
-- =============================================================================
create policy dong_y_doc on nhat_ky_dong_y
  for select using (
    la_chu_so_huu()
    or exists (select 1 from khach_hang kh where kh.id = khach_hang_id)
  );

create policy dong_y_them on nhat_ky_dong_y
  for insert with check (true);

-- =============================================================================
-- LƯỢT GHÉ
-- =============================================================================
create policy luot_ghe_doc on luot_ghe
  for select using (duoc_truy_cap_chi_nhanh(chi_nhanh_id));

create policy luot_ghe_them on luot_ghe
  for insert with check (
    duoc_truy_cap_chi_nhanh(chi_nhanh_id)
    and co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan']::vai_tro[])
  );

create policy luot_ghe_sua on luot_ghe
  for update using (
    duoc_truy_cap_chi_nhanh(chi_nhanh_id)
    and co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[])
  );

-- =============================================================================
-- CẤU HÌNH TÍCH ĐIỂM — ảnh hưởng trực tiếp tới biên lợi nhuận
-- =============================================================================
create policy cau_hinh_doc on cau_hinh_tich_diem
  for select using (duoc_truy_cap_chi_nhanh(chi_nhanh_id));

-- Chỉ chủ sở hữu đổi được tỷ lệ tích điểm — quản lý chi nhánh không được.
create policy cau_hinh_sua on cau_hinh_tich_diem
  for all using (la_chu_so_huu()) with check (la_chu_so_huu());

-- =============================================================================
-- SỔ CÁI ĐIỂM — điểm là tiền
-- =============================================================================
create policy so_cai_doc on so_cai_diem
  for select using (duoc_truy_cap_chi_nhanh(chi_nhanh_id));

-- Marketing KHÔNG được ghi sổ cái điểm
create policy so_cai_them on so_cai_diem
  for insert with check (
    duoc_truy_cap_chi_nhanh(chi_nhanh_id)
    and co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan']::vai_tro[])
  );

-- Không có policy UPDATE/DELETE: sổ cái bất biến.
-- Trigger ở migration 0003 cũng chặn, đây là lớp bảo vệ thứ hai.

-- =============================================================================
-- BÀN & ĐẶT BÀN
-- =============================================================================
create policy ban_an_doc on ban_an
  for select using (duoc_truy_cap_chi_nhanh(chi_nhanh_id));

create policy ban_an_sua on ban_an
  for all using (
    duoc_truy_cap_chi_nhanh(chi_nhanh_id)
    and co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[])
  );

create policy dat_ban_doc on dat_ban
  for select using (duoc_truy_cap_chi_nhanh(chi_nhanh_id));

create policy dat_ban_them on dat_ban
  for insert with check (duoc_truy_cap_chi_nhanh(chi_nhanh_id));

create policy dat_ban_sua on dat_ban
  for update using (duoc_truy_cap_chi_nhanh(chi_nhanh_id));

-- =============================================================================
-- GỬI TIN
-- =============================================================================
-- Mẫu tin dùng chung toàn thương hiệu (đảm bảo nhất quán khi nhượng quyền)
create policy mau_tin_doc on mau_tin
  for select using (auth.uid() is not null);

create policy mau_tin_sua on mau_tin
  for all using (la_chu_so_huu()) with check (la_chu_so_huu());

create policy chien_dich_doc on chien_dich
  for select using (duoc_truy_cap_chi_nhanh(chi_nhanh_id));

create policy chien_dich_sua on chien_dich
  for all using (
    duoc_truy_cap_chi_nhanh(chi_nhanh_id)
    and co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])
  );

create policy nhat_ky_tin_doc on nhat_ky_tin
  for select using (duoc_truy_cap_chi_nhanh(chi_nhanh_id));

create policy nhat_ky_tin_them on nhat_ky_tin
  for insert with check (duoc_truy_cap_chi_nhanh(chi_nhanh_id));

-- =============================================================================
-- QUYỀN CHO WEBSITE CÔNG KHAI
-- =============================================================================
-- Vai trò `anon` (khách vãng lai trên website) KHÔNG được đụng vào bảng nào.
-- Nó chỉ gọi được ba hàm dưới đây — đều là SECURITY DEFINER nên chạy được
-- mà không cần quyền bảng.
--
-- Trên Supabase, `anon` và `authenticated` là hai vai trò có sẵn. Nếu chạy
-- trên Postgres thường thì tạo trước, nên bọc trong khối kiểm tra.
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    -- Chặn sạch quyền bảng
    execute 'revoke all on all tables in schema public from anon';

    -- Chỉ mở đúng ba hàm website cần
    execute 'grant execute on function tao_dat_ban(text,text,text,date,time,smallint,text,text,boolean,text,text,text,text,inet) to anon';
    execute 'grant execute on function lich_trong_theo_ngay(uuid,date) to anon';
    execute 'grant execute on function so_ban_con_trong(uuid,date,time) to anon';
  end if;
end
$$;

comment on function tao_dat_ban is
  'API công khai cho website. SECURITY DEFINER — anon gọi được mà không cần quyền bảng.';
