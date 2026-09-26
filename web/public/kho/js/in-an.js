/*
 * KHO — NÚT "IN PHIẾU" (tăng cường, không bắt buộc)
 *
 * Nút in có thuộc tính hidden: tắt JavaScript thì nút không hiện, người dùng
 * vẫn in được bằng menu trình duyệt (Ctrl+P, hoặc Chia sẻ → In trên điện
 * thoại) — cách trình bày khi in nằm hết trong CSS @media print.
 * File này chỉ hiện nút và gọi window.print() khi bấm. Không thư viện nào.
 */
(function () {
  var nut = document.querySelectorAll('[data-in]');
  for (var i = 0; i < nut.length; i++) {
    nut[i].hidden = false;
    nut[i].addEventListener('click', function () { window.print(); });
  }
})();
