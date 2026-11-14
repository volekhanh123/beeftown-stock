-- =============================================================================
-- BEEFTOWN — 0118 · VIDEO ĐÀO TẠO · VAI HỌC VIÊN
-- =============================================================================
-- CHẠY FILE NÀY MỘT MÌNH, TRƯỚC 0119 — giống 0017, 0029, 0046, 0052, 0059, 0114: Postgres không cho dùng giá trị enum
-- vừa thêm trong cùng giao dịch đã thêm nó.
--
--   hoc_vien : tài khoản demo dùng chung cho buổi đào tạo (Khánh 14/11/2026: "1 tài khoản demo về việc training và
--              chỉ mở cho việc training thôi"). Nó chỉ đọc được bảng video_dao_tao (0119) và dòng nhan_su của chính
--              nó (policy nhan_su_doc — mọi tài khoản đều đọc được hồ sơ mình, layPhien cần dòng đó để đăng nhập).
--              duoc_truy_cap_chi_nhanh() (0018), crm_cn_duoc() (0070), kho_vai_duoc() (0018) không nhắc tới vai này —
--              và KHÔNG được thêm vào: thêm vào một trong ba hàm đó là mở dữ liệu khách hoặc kho cho cả lớp học.
--
-- Thêm giá trị ở đây chưa mở quyền gì: tường ngăn CRM (0018) chặn mọi vai ngoài bốn vai CRM, kho chỉ mở cho vai có
-- trong kho_vai_duoc(), và 0119 mới cấp đúng phần việc cho hoc_vien.
-- =============================================================================

alter type vai_tro add value if not exists 'hoc_vien';
