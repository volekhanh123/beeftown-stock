/*
 * KHO — MÁY TÍNH BẢNG DÙNG CHUNG: ĐẾM GIỜ TỰ KHÓA (GĐ5d, tăng cường)
 *
 * Chỉ được nạp khi có người đang dùng máy dùng chung (layouts/Kho.astro).
 * MÁY CHỦ MỚI LÀ NƠI QUYẾT ĐỊNH: moTrangKho khóa máy khi mở trang quá giờ,
 * nên tắt JavaScript vẫn an toàn. File này chỉ làm hai việc:
 *
 *   1. Không ai chạm / gõ quá phut_khoa phút → chuyển sang
 *      /noi-bo/kho/may?khoa=1 (khóa ngay, không chờ người sau mở trang).
 *   2. Người dùng vẫn đang chạm / gõ trên trang (gõ dở phiếu dài không gửi
 *      request nào) → mỗi phút báo máy chủ một lần (?giu=1) để máy chủ không
 *      tính là bỏ máy. Máy chủ trả 409 = đã quá giờ → khóa.
 *
 * Không đọc, không ghi cookie (cookie máy là httpOnly). Không thư viện nào.
 */
(function () {
  var the = document.querySelector('script[data-may-chung]');
  if (!the) return;
  var phut = parseInt(the.getAttribute('data-phut'), 10);
  if (!(phut >= 1 && phut <= 60)) phut = 5;
  var han = phut * 60000;
  var MOT_PHUT = 60000;

  var lanCham = Date.now();  // lần người dùng chạm / gõ gần nhất
  var lanBao = Date.now();   // lần máy chủ biết máy còn dùng (mở trang cũng tính)
  var daKhoa = false;

  function khoa() {
    if (daKhoa) return;
    daKhoa = true;
    location.replace('/noi-bo/kho/may?khoa=1');
  }

  function cham() { lanCham = Date.now(); }
  var suKien = ['pointerdown', 'keydown', 'input', 'touchstart', 'wheel'];
  for (var i = 0; i < suKien.length; i++) {
    window.addEventListener(suKien[i], cham, { passive: true, capture: true });
  }

  function kiem() {
    var bayGio = Date.now();
    if (bayGio - lanCham >= han) { khoa(); return; }
    if (lanCham > lanBao && bayGio - lanBao >= MOT_PHUT && window.fetch) {
      lanBao = bayGio;
      fetch('/noi-bo/kho/may?giu=1', { credentials: 'same-origin', cache: 'no-store' })
        .then(function (r) { if (r.status === 409) khoa(); })
        .catch(function () { /* mất mạng: máy chủ vẫn tự khóa khi quá giờ */ });
    }
  }

  setInterval(kiem, 10000);
  // Màn hình tắt rồi bật lại, đổi tab: đồng hồ có thể đã dừng — kiểm ngay.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') kiem();
  });
  // Nút "Quay lại" sau khi đã khóa: trình duyệt lấy trang cũ từ bộ nhớ đệm
  // (còn thông tin của người trước) — tải lại để máy chủ quyết định.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) location.reload();
  });
})();
