-- =============================================================================
-- BEEFTOWN CRM — 0043 · LOẠI HỢP ĐỒNG "CHƯA CHỐT"
-- =============================================================================
-- VẤN ĐỀ
--
-- 0012 bắt vi_tri_tuyen_dung.loai_hop_dong NOT NULL, mặc định 'ban_thoi_gian'.
-- Tức là mọi tin buộc phải nói mình là toàn thời gian, bán thời gian, thời vụ
-- hay thực tập — kể cả khi nhà hàng CHƯA quyết.
--
-- JD đội mở cửa (26/09/2026) ghi "Employment Type: TO BE CONFIRMED — except
-- Hall Crew, currently planned as part-time". Ba tin còn lại (bếp, thợ lọc
-- thịt, đóng gói quầy thịt) vì thế đang hiện một loại hợp đồng còn sót lại từ
-- bản nháp cũ: trang công khai nói với ứng viên một điều nhà hàng chưa hứa.
--
-- CÁCH LÀM
--
-- NULL nghĩa là CHƯA CHỐT. Trang công khai không hiện dòng loại hợp đồng; màn
-- nội bộ có lựa chọn "Chưa chốt".
--
-- Không thêm giá trị 'chua_chot' vào enum: enum là danh sách loại hợp đồng
-- THẬT, và bảng nhãn LOAI_HOP_DONG của web phải khớp đúng từng giá trị của nó
-- (test-hop-dong-web). "Chưa chốt" là vắng một quyết định, không phải một loại
-- hợp đồng thứ năm.
--
-- Mặc định 'ban_thoi_gian' giữ nguyên: màn tạo tin luôn gửi giá trị người dùng
-- chọn (kể cả "Chưa chốt" → null), nên mặc định chỉ còn tác dụng với những câu
-- insert viết tay, và đổi nó không đem lại gì.
--
-- tin_tuyen_dung_cong_khai() trả thẳng cột này (0036), không cần sửa: hàm vẫn
-- trả loai_hop_dong, chỉ là giờ có thể null.
-- =============================================================================

alter table vi_tri_tuyen_dung
  alter column loai_hop_dong drop not null;

comment on column vi_tri_tuyen_dung.loai_hop_dong is
  'Loại hợp đồng của tin. NULL = chưa chốt (0043): trang công khai không hiện dòng này.';
