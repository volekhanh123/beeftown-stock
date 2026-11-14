/*
 * NỘI BỘ — NÚT "QUAY LẠI" SAU KHI ĐĂNG XUẤT (rà soát bảo mật 14/11/2026, vòng hai)
 *
 * Trình duyệt giữ nguyên trang vừa rời trong bộ nhớ (bfcache): bấm Quay lại là trang hiện ngay, KHÔNG hỏi máy
 * chủ — cookie đã xóa và phiên đã thu hồi không được xét tới. Trên máy nhiều người dùng, người đến sau bấm Quay
 * lại là thấy lại trang của người vừa đăng xuất (danh sách khách, công nợ).
 *
 * Lượt đăng xuất có gửi Clear-Site-Data: "cache" (pages/noi-bo/dang-xuat.ts). Thử trong Chromium 156 và Chrome
 * 153 bản đầy đủ, bfcache bật: lệnh đó gỡ các trang ĐÃ nằm trong bộ nhớ quay lại, nhưng KHÔNG gỡ được chính
 * trang vừa bấm Đăng xuất — trang đó vào bộ nhớ sau khi lệnh đã được xử lý, và còn ở đó khoảng 10 phút. Trình
 * duyệt khác chưa chắc gỡ gì. File này lấp chỗ đó mà không dựa vào lệnh kia:
 *
 *   trang hiện lại từ bộ nhớ (pageshow, persisted) mà có một lần bấm Đăng xuất SAU lúc trang được tải
 *   → giấu trang, tải lại. Máy chủ quyết định: chưa đăng nhập thì về trang đăng nhập; người khác đã đăng nhập
 *   thì hiện trang theo quyền của người đó.
 *
 *     · bấm ở chính trang này: nhớ trong biến (biến còn nguyên khi trang hiện lại từ bộ nhớ);
 *     · bấm ở trang khác, tab khác: giờ bấm ghi vào localStorage — chung cho mọi tab của site.
 *
 * Chưa có lần đăng xuất nào sau lúc trang tải thì KHÔNG tải lại: bấm nhầm một link rồi Quay lại, chữ đang gõ dở
 * vẫn còn.
 *
 * MÁY CHỦ MỚI LÀ NƠI QUYẾT ĐỊNH: tắt JavaScript thì mọi trang vẫn chạy đủ, chỉ mất lớp này. Không đọc, không ghi
 * cookie (cookie phiên là httpOnly), không gọi mạng, không thư viện nào. Máy tính bảng dùng chung không có nút
 * Đăng xuất mà có Khóa máy — ở đó file đếm giờ tự khóa tải lại ở MỌI lần trang hiện lại từ bộ nhớ.
 *
 * Kiểm: crm/test/test-noi-bo-dang-xuat.mjs nhóm 9 (chạy chính file này với cửa sổ giả); trên bản build thật,
 * bằng Chromium bản đầy đủ có bfcache: web/kiem-tra/trinh-duyet.mjs nhóm 4.
 */
(function () {
  var KHOA = 'bt_dang_xuat_luc';
  var FORM_DANG_XUAT = /^\/noi-bo\/dang-xuat\/?(?:[?#]|$)/;
  var taiLuc = Date.now();   // lúc trang này được tải
  var daBam = false;         // đã bấm Đăng xuất ở chính trang này

  /** Giờ của lần bấm Đăng xuất gần nhất trên trình duyệt này (mọi tab); 0 = chưa có, hoặc không đọc được. */
  function lanDangXuatGanNhat() {
    try { return parseInt(window.localStorage.getItem(KHOA), 10) || 0; } catch (loi) { return 0; }
  }

  document.addEventListener('submit', function (suKien) {
    var form = suKien.target;
    if (!form || typeof form.getAttribute !== 'function') return;
    if (!FORM_DANG_XUAT.test(form.getAttribute('action') || '')) return;
    daBam = true;
    // Trình duyệt chặn lưu (chế độ riêng tư cũ, cài đặt chặn dữ liệu của trang): vẫn còn biến daBam cho trang này.
    try { window.localStorage.setItem(KHOA, String(Date.now())); } catch (loi) { /* bỏ qua */ }
  }, true);

  window.addEventListener('pageshow', function (suKien) {
    if (!suKien.persisted) return;
    if (daBam || lanDangXuatGanNhat() >= taiLuc) {
      document.documentElement.style.visibility = 'hidden';   // không để trang cũ lóe lên trong lúc tải lại
      window.location.reload();
    }
  });
})();
