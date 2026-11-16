/*
 * KHO — TRANG DỰNG NGAY TRONG TRẢ LỜI CỦA LƯỢT POST TỰ XÓA THÂN FORM KHỎI LỊCH SỬ (issue #194, đợt 5; Khánh chọn
 * cách 2 ngày 16/11/2026)
 *
 * 31 trang kho báo lỗi (hay hiện bước xem trước, thêm dòng) NGAY TRONG trả lời của lượt POST, để số đã gõ theo từng
 * dòng, mã gửi chống ghi trùng, ảnh đã tải, phiên bản phiếu còn nguyên — những thứ không vừa một cookie để chuyển trang
 * (danh sách CON_TAI_CHO, crm/test/test-kho-loi-chuyen-huong.mjs). Mục lịch sử của trang như vậy giữ nguyên thân form:
 * bấm F5 trên nó, hay rời đi rồi Quay lại / Tiến tới và F5, là trình duyệt GỬI LẠI cả form — dưới tên người đang đăng
 * nhập trên máy lúc đó.
 *
 * Đoạn mã này thay mục lịch sử của chính trang bằng một mục cùng địa chỉ (cả ?… và #…), cùng history.state, KHÔNG có
 * thân form. Trang đang hiện không đổi gì: câu lỗi, chữ đã gõ, mã gửi còn nguyên, bấm Lưu lại như cũ. Đo trên Chromium
 * 16/11/2026, form gửi về chính địa chỉ của nó, có và không có bfcache:
 *   · không có đoạn mã: F5 là một lượt POST mang nguyên thân form, không hỏi; rời đi rồi Quay lại thì trình duyệt dựng
 *     lại trang báo lỗi từ bản lưu đệm, và F5 lúc đó lại gửi lại form;
 *   · có đoạn mã: F5 là một lượt GET — form như lúc mới mở; Quay lại / Tiến tới về mục đó cũng là một lượt GET (trình
 *     duyệt tự điền lại chữ người dùng gõ SAU khi trang báo lỗi hiện, không điền lại số máy chủ in vào trang báo lỗi).
 *     Trang báo lỗi chỉ còn tới lúc rời nó hay tải lại.
 *
 * Chỉ một lệnh, trong try: trình duyệt từ chối thì thôi. KHÔNG tải lại, KHÔNG chuyển trang: reload() do mã gọi trên
 * trang của lượt POST là gửi lại form mà không hỏi (đầu file lib/sau-dang-xuat.js). Không gọi mạng, không đọc cookie
 * hay bộ nhớ của trình duyệt. Tắt JavaScript thì như trước: F5 làm trình duyệt hỏi "gửi lại biểu mẫu".
 * components/kho/XoaThanPost.astro in thẳng đoạn này vào <head> của khung Kho, CHỈ ở trả lời của lượt POST, trước thẻ
 * phông chữ (mã đứng sau một thẻ bảng kiểu phải chờ bảng kiểu đó tải xong). Khung CRM (NoiBo) không có — Khánh quyết để
 * nguyên bảy màn CRM. Phần chú thích này không in ra trang.
 *
 * Kiểm: crm/test/test-kho-loi-chuyen-huong.mjs nhóm 5 (chạy chính đoạn này với cửa sổ giả); trên Chromium thật, có
 * phép đối chứng không có đoạn mã: web/kiem-tra/trinh-duyet.mjs nhóm 4 ("trang kho dựng tại chỗ").
 */
(function () {
  try {
    window.history.replaceState(window.history.state, '', window.location.href);
  } catch (loi) { /* trình duyệt từ chối thì thôi: F5 làm trình duyệt hỏi như trước */ }
})();
