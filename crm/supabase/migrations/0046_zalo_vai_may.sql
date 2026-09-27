-- =============================================================================
-- BEEFTOWN CRM — 0046 · ZALO · VAI MÁY VÀ TRẠNG THÁI "ĐÃ HỦY"
-- =============================================================================
-- CHẠY FILE NÀY MỘT MÌNH, TRƯỚC 0047 — giống 0017 và 0029: Postgres không cho
-- dùng giá trị enum vừa thêm trong cùng giao dịch đã thêm nó.
--
--   may_zalo : tài khoản máy của Worker gửi tin Zalo ZBS mỗi 5 phút. Nó KHÔNG
--              đọc được bảng CRM nào; mọi việc đi qua bốn RPC máy ở 0047
--              (zalo_bat_dau_luot, zalo_ghi_ket_qua, zalo_luu_token,
--              zalo_ket_thuc_luot). duoc_truy_cap_chi_nhanh() (0018) không
--              nhắc tới vai này — và KHÔNG được thêm vào.
--   da_huy   : tin trong hàng chờ không gửi nữa vì lý do nghiệp vụ — khách hủy
--              đặt bàn, đổi giờ sát quá, chiến dịch bị dừng, mẫu tin bị tắt.
--              Khác that_bai (Zalo báo lỗi) và bi_tu_choi (duoc_phep_gui() chặn).
--
-- Thêm giá trị ở đây chưa mở quyền gì: tường ngăn CRM (0018) chặn mọi vai
-- ngoài bốn vai CRM, và 0047 mới cấp đúng phần việc cho may_zalo.
-- =============================================================================

alter type vai_tro add value if not exists 'may_zalo';
alter type ket_qua_gui add value if not exists 'da_huy';
