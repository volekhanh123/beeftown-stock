-- =============================================================================
-- BEEFTOWN — 0095 · CHỮ MỚI CHO MẪU ZBS-03 "CẢM ƠN & XIN ĐÁNH GIÁ"
-- =============================================================================
-- PHẢI CHẠY SAU 0047 (mau_tin.tham_so tự tính bằng trigger mau_tin_zalo_tham_so, CHECK câu NGUNG).
--
-- Khánh chọn bản B ngày 25/10/2026 (GPT viết, Claude soát luật chữ của repo): gần gũi mà vẫn chuyên nghiệp.
-- Sửa hai lỗi của chữ 0047:
--   · Khách không có tên thì zalo_du_lieu_goc() điền "Quý khách", nên câu cũ ra "Cảm ơn anh/chị Quý khách".
--     Câu mới để Beeftown đứng đầu: "Beeftown cảm ơn Quý khách đã dùng bữa tại quán hôm nay."
--   · Câu cũ chỉ xin đánh giá khi bữa ăn "vừa ý" — Google không cho xin riêng đánh giá tốt. Câu mới mời mọi
--     khách nhận xét.
--
-- Năm dòng có chữ là năm ô của mẫu tuỳ chỉnh trên ZBS: tiêu đề + 4 đoạn. Chữ trên ZBS phải khớp nguyên văn
-- (màn Cài đặt Zalo, bước 3). Tham số giữ nguyên: <customer_name>, <google_review_link>.
--
-- Như 0047: chỉ sửa mẫu CHƯA duyệt — mẫu đã duyệt phải khớp đúng bản đã nộp Zalo. Chạy lại không đổi gì.
-- Triển khai: chạy migration TRƯỚC khi chủ đánh dấu ZBS-03 "Zalo đã duyệt" ở /noi-bo/zalo/cai-dat — đánh dấu
-- rồi thì migration bỏ qua mẫu, database giữ chữ cũ. Không cần deploy web.
-- =============================================================================

update mau_tin set noi_dung =
 E'Cảm ơn anh/chị đã dùng bữa tại Beeftown\nBeeftown cảm ơn <customer_name> đã dùng bữa tại quán hôm nay.\nMời anh/chị chia sẻ cảm nhận về bữa ăn trên Google. Góp ý của anh/chị giúp Beeftown hiểu rõ hơn trải nghiệm tại quán.\nGửi nhận xét tại: <google_review_link>\n\nĐể ngừng nhận tin, anh/chị vui lòng nhắn NGUNG cho Beeftown.'
where ma = 'ZBS-03' and not da_duyet;
