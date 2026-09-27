-- =============================================================================
-- BEEFTOWN CRM — 0051 · MESSENGER · VAI MÁY
-- =============================================================================
-- CHẠY FILE NÀY MỘT MÌNH, TRƯỚC 0052 — giống 0017, 0029 và 0046: Postgres
-- không cho dùng giá trị enum vừa thêm trong cùng giao dịch đã thêm nó.
--
--   may_messenger : tài khoản máy của Worker trả lời tin nhắn Facebook
--                   Messenger (bot đặt bàn, web/src/lib/messenger-hook.ts). Nó
--                   KHÔNG đọc được bảng CRM hay kho nào; mọi việc đi qua bốn
--                   RPC máy ở 0052 (mess_lay_phien, mess_luu_phien,
--                   mess_ghi_tra_cuu, mess_ghi_su_kien). Đặt bàn, tra cứu, hủy
--                   thì Worker gọi bằng client anon KHÔNG phiên — y như website.
--                   duoc_truy_cap_chi_nhanh() (0018) không nhắc tới vai này —
--                   và KHÔNG được thêm vào; kho_vai_duoc() cũng không.
--
-- Thêm giá trị ở đây chưa mở quyền gì: tường ngăn CRM (0018) chặn mọi vai
-- ngoài bốn vai CRM, và 0052 mới cấp đúng phần việc cho may_messenger.
-- =============================================================================

alter type vai_tro add value if not exists 'may_messenger';
