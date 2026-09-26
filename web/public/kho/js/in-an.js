/*
 * KHO — NÚT "IN PHIẾU" VÀ "CHIA SẺ" (tăng cường, không bắt buộc)
 *
 * Nút in có thuộc tính hidden: tắt JavaScript thì nút không hiện, người dùng
 * vẫn in được bằng menu trình duyệt (Ctrl+P, hoặc Chia sẻ → In trên điện
 * thoại) — cách trình bày khi in nằm hết trong CSS @media print. Trong hộp in
 * chọn "Lưu thành PDF" là có file PDF gửi Zalo.
 *
 * GĐ8a (đơn đặt hàng): nút [data-chia-se] gửi nội dung đơn (data-tieu-de,
 * data-chu) qua Web Share API — trên điện thoại mở bảng chia sẻ (Zalo…). Máy
 * không có navigator.share thì nút giữ ẩn; trang đã có hướng dẫn "Lưu PDF rồi
 * gửi Zalo" và ô chép tin nhắn. Không thư viện nào.
 */
(function () {
  var nut = document.querySelectorAll('[data-in]');
  for (var i = 0; i < nut.length; i++) {
    nut[i].hidden = false;
    nut[i].addEventListener('click', function () { window.print(); });
  }
  if (typeof navigator.share !== 'function') return;
  var chiaSe = document.querySelectorAll('[data-chia-se]');
  for (var j = 0; j < chiaSe.length; j++) {
    chiaSe[j].hidden = false;
    chiaSe[j].addEventListener('click', function (e) {
      var n = e.currentTarget;
      navigator.share({ title: n.getAttribute('data-tieu-de') || document.title, text: n.getAttribute('data-chu') || '' })
        .catch(function () { /* người dùng đóng bảng chia sẻ — không làm gì */ });
    });
  }
})();
