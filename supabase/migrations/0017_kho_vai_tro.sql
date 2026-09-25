-- =============================================================================
-- BEEFTOWN — 0017 · KHO · BA VAI TRÒ MỚI
-- =============================================================================
-- Phần mềm quản lý kho (web/src/pages/noi-bo/kho) cần ba vai trò không có
-- trong CRM:
--
--   thu_kho        : thủ kho — nhập hàng, pha lóc, kiểm kê. Dùng điện thoại.
--   nhan_vien_quay : nhân viên quầy thịt / bếp — chuyển hàng ra quầy, xuất
--                    bếp, báo hủy, đếm kiểm kê. Dùng tablet. KHÔNG thấy giá
--                    nhập và giá vốn.
--   ke_toan        : kế toán — đối chiếu hóa đơn, công nợ nhà cung cấp.
--
-- FILE NÀY CHỈ CÓ BA DÒNG, VÀ PHẢI NHƯ VẬY
--
-- Postgres cho `alter type ... add value` chạy trong giao dịch, nhưng giá trị
-- mới chưa DÙNG được cho tới khi giao dịch đó commit — dùng sớm là lỗi
-- "unsafe use of new value". Mỗi file migration chạy trong một giao dịch, nên
-- mọi chỗ nhắc tới ba giá trị này (policy, hàm, CHECK, dữ liệu) phải nằm từ
-- 0018 trở đi.
--
-- Trên SQL Editor của Supabase: chạy file này RIÊNG một lần, rồi mới chạy 0018.
--
-- Giá trị enum không xóa được. Tên đặt cẩn thận là vì vậy.
--
-- CHÚ Ý AN TOÀN — đọc trước khi tạo tài khoản
--
-- Hàm duoc_truy_cap_chi_nhanh() ở 0001 trả true cho MỌI vai trò cùng chi
-- nhánh, và khoảng hai mươi policy CRM (khách hàng, đặt bàn, sổ điểm...) chỉ
-- kiểm đúng hàm đó. Nghĩa là một tài khoản thu_kho tạo ra ngay sau file này sẽ
-- đọc được số điện thoại khách. 0018 dựng tường ngăn. ĐỪNG tạo tài khoản vai
-- kho khi chưa chạy 0018.
-- =============================================================================

alter type vai_tro add value if not exists 'thu_kho';
alter type vai_tro add value if not exists 'nhan_vien_quay';
alter type vai_tro add value if not exists 'ke_toan';
