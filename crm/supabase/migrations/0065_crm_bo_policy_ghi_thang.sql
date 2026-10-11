-- =============================================================================
-- BEEFTOWN CRM — 0065 · BỎ POLICY GHI THẲNG BẢNG KHÁCH, ĐỒNG Ý, TIN, ĐIỂM
-- =============================================================================
-- Policy ghi của 0007 viết lúc chưa có hàm definer: "nhân viên chi nhánh được
-- ghi". Sau đó mọi đường ghi thật chuyển vào hàm definer tự kiểm vai —
-- tao_dat_ban, ghi_luot_ghe, tim_hoac_tao_khach (0045), xep_hang_gui_tin
-- (0045), zalo_* (0047) — nhưng policy cũ ở lại và mở lại đúng những cửa các
-- hàm đó đã đóng. Rà soát nợ kỹ thuật 11/10/2026 thử được cả bốn:
--
--   · nhat_ky_dong_y `with check (true)`: MỌI tài khoản đăng nhập — tài khoản
--     không có dòng nhan_su, nhân sự đã nghỉ, quản lý chi nhánh khác — ghi được
--     "khách đồng ý nhận tin" cho khách đã rút lại. Bằng chứng tuân thủ Nghị
--     định 13/2023 làm giả được.
--   · nhat_ky_tin: thu ngân, marketing chèn thẳng dòng `cho_gui` với số điện
--     thoại tùy ý. zalo_bat_dau_luot kiểm đồng ý theo khach_hang_id nhưng gửi
--     tới sdt_gui — tin ZBS có tính phí đi tới số bất kỳ, vòng qua kiểm vai và
--     khoá chống gửi hai lần (khoa_gui) của zalo_tao_chien_dich.
--   · so_cai_diem / luot_ghe: thu ngân tự cộng 5.000.000 điểm, ghi created_by
--     là người khác — vòng qua kiểm "không ghi dưới tên nhân sự khác" của 0045.
--   · khach_hang (update chỉ kiểm vai, không kiểm chi nhánh): thu ngân Q1 chạy
--     `update khach_hang set dang_hoat_dong = false` không điều kiện là tắt cả
--     khách chỉ có ở Q7 — khách bị coi là "đã yêu cầu xoá", mọi tin Zalo dừng.
--
-- Web (web/src) và Beeftown Cân (can-app/src) không ghi thẳng bảng nào trong
-- năm bảng đó — test-quyen-ghi-thang-crm.mjs mục 1 quét mã nguồn để giữ điều
-- này. Bảng vẫn bật RLS; không còn policy ghi = authenticated không ghi thẳng
-- được; hàm definer chạy dưới quyền chủ bảng nên ghi như cũ. Policy ĐỌC giữ
-- nguyên. GIỮ dat_ban_them / dat_ban_sua: /noi-bo/dat-ban sửa thẳng dat_ban,
-- và 0063 tính tới việc nhân viên chèn thẳng một dòng đặt bàn.
--
-- Kèm: don_dep_phieu_tai_len() (0012) là hàm dọn duy nhất không kiểm vai —
-- thủ kho, marketing, tài khoản không có nhan_su đều chạy được. Thêm kiểm vai
-- như don_dep_su_kien_web / tao_tin_tuyen_dung_mau: có phiên đăng nhập thì
-- phải là chủ sở hữu hoặc quản lý (hai vai thấy nút ở /noi-bo/cai-dat); không
-- phiên (SQL Editor, lịch chạy) vẫn chạy như cũ. Thân hàm còn lại chép y 0012.
--
-- Không tạo hàm mới: CREATE OR REPLACE giữ nguyên quyền gọi của hàm cũ, nên
-- không cần khối CHỐT QUYỀN (test-an-toan.mjs vẫn gác danh sách hàm anon).
-- Kiểm thử: crm/test/test-quyen-ghi-thang-crm.mjs.
-- =============================================================================

-- 1 · Năm bảng CRM: bỏ policy GHI (đọc giữ nguyên)
drop policy if exists dong_y_them      on nhat_ky_dong_y;
drop policy if exists nhat_ky_tin_them on nhat_ky_tin;
drop policy if exists so_cai_them      on so_cai_diem;
drop policy if exists luot_ghe_them    on luot_ghe;
drop policy if exists khach_hang_them  on khach_hang;
drop policy if exists khach_hang_sua   on khach_hang;


-- 2 · don_dep_phieu_tai_len(): kiểm vai ở đầu thân hàm
create or replace function don_dep_phieu_tai_len()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_so int;
begin
  if co_phien_dang_nhap() and not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
    raise exception 'Chỉ chủ sở hữu hoặc quản lý mới dọn được vé tải CV'
      using errcode = 'insufficient_privilege';
  end if;

  with da_xoa as (
    delete from phieu_tai_len
    where het_han < now() - interval '1 day'
    returning 1)
  select count(*) into v_so from da_xoa;
  return v_so;
end;
$$;
