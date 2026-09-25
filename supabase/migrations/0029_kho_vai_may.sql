-- =============================================================================
-- BEEFTOWN KHO — 0029 · HAI VAI "MÁY"
-- =============================================================================
-- CHẠY FILE NÀY MỘT MÌNH, TRƯỚC 0030 — giống 0017: Postgres không cho dùng
-- giá trị enum vừa thêm trong cùng giao dịch đã thêm nó.
--
--   may_chung : tài khoản của một TABLET DÙNG CHUNG ở quầy/bếp. Nó không làm
--               nghiệp vụ gì — chỉ giữ màn "Ai đang dùng máy?" và kiểm mã PIN
--               để đổi sang phiên của đúng người (quyền cấp ở giai đoạn 5d).
--   may_ipos  : tài khoản máy đồng bộ bán hàng iPOS mỗi 5 phút (giai đoạn 7a).
--
-- Gom cả hai vào một file để chủ nhà hàng chỉ có MỘT bước "chạy riêng" nữa.
-- Thêm vai ở đây chưa mở quyền gì: kho_vai_duoc (0018) chưa nhắc tới hai vai
-- này, và tường ngăn CRM (0018) đã chặn mọi vai ngoài bốn vai CRM.
-- =============================================================================

alter type vai_tro add value if not exists 'may_chung';
alter type vai_tro add value if not exists 'may_ipos';
