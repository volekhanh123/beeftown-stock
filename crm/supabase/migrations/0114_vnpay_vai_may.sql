-- =============================================================================
-- BEEFTOWN CRM — 0114 · VNPAY TRÊN WEBSITE · VAI MÁY
-- =============================================================================
-- CHẠY FILE NÀY MỘT MÌNH, TRƯỚC 0115 — giống 0017, 0029, 0046, 0052, 0059: Postgres không cho dùng giá trị enum vừa
-- thêm trong cùng giao dịch đã thêm nó.
--
--   may_vnpay : tài khoản máy của Worker nhận kết quả thanh toán VNPay cho đơn Mua thịt về trên website
--               (web/src/lib/vnpay-hook.ts — IPN, và trang kết quả khách được VNPay đưa về). Nó KHÔNG đọc được bảng
--               CRM hay kho nào; mọi việc đi qua hai RPC máy ở 0115 (vnpay_ghi_ipn, vnpay_ghi_ve).
--               duoc_truy_cap_chi_nhanh() (0018) không nhắc tới vai này — và KHÔNG được thêm vào; kho_vai_duoc() cũng
--               không; don_mua_thit_duoc_xem() (0113) cũng không.
--
-- Thêm giá trị ở đây chưa mở quyền gì: tường ngăn CRM (0018) chặn mọi vai ngoài bốn vai CRM, và 0115 mới cấp đúng
-- phần việc cho may_vnpay.
-- =============================================================================

alter type vai_tro add value if not exists 'may_vnpay';
