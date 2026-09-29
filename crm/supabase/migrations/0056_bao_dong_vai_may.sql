-- =============================================================================
-- BEEFTOWN — 0056 · BÁO ĐỘNG · VAI MÁY
-- =============================================================================
-- CHẠY FILE NÀY MỘT MÌNH, TRƯỚC 0057 — giống 0017, 0029, 0046 và 0052: Postgres
-- không cho dùng giá trị enum vừa thêm trong cùng giao dịch đã thêm nó.
--
--   may_bao_dong : tài khoản máy của việc chạy nền báo động (Worker, cron riêng
--                  "2-59/5 * * * *", web/src/lib/bao-dong.ts). Nó đọc số liệu của
--                  bảng sức khỏe hệ thống và ghi sổ sự cố — CHỈ qua bốn RPC máy ở
--                  0057 (bao_dong_bat_dau_luot, bao_dong_ghi_luot, bao_dong_da_gui,
--                  bao_dong_ket_thuc_luot). Nó KHÔNG đọc được bảng CRM hay kho nào.
--                  duoc_truy_cap_chi_nhanh() (0018) không nhắc tới vai này — và
--                  KHÔNG được thêm vào; kho_vai_duoc() cũng không.
--
-- Thêm giá trị ở đây chưa mở quyền gì: tường ngăn CRM (0018) chặn mọi vai
-- ngoài bốn vai CRM, và 0057 mới cấp đúng phần việc cho may_bao_dong.
-- =============================================================================

alter type vai_tro add value if not exists 'may_bao_dong';
