/**
 * KHO — ĐỌC MÃ VẠCH EAN-13 TỪ ẢNH CAMERA (GĐ5b)
 *
 * Safari trên iPhone/iPad không có BarcodeDetector, nên QuetMa.astro nạp file
 * này và đưa từng khung hình (canvas) vào window.KhoEan13.giaiMa(imageData).
 * Viết tay, không thư viện. Trả chuỗi 13 số, hoặc null nếu không đọc được.
 *
 * Cách đọc:
 *   1. Đổi ảnh sang xám; lấy nhiều hàng ngang ở giữa ảnh (mỗi hàng là trung
 *      bình 3 dòng điểm ảnh cho bớt nhiễu), thêm vài cột dọc cho lúc cầm máy
 *      dọc gói.
 *   2. Mỗi hàng: ngưỡng sáng/tối = giữa mức tối và mức sáng của hàng đó; tìm
 *      chỗ đổi màu, nội suy để biết mép vạch lẻ nửa điểm ảnh (vạch trên camera
 *      thường chỉ rộng 2–3 điểm ảnh).
 *   3. Tìm 59 dải liền nhau (3 vạch mở + 6 số × 4 + 5 vạch giữa + 6 số × 4 +
 *      3 vạch đóng) có khoảng trắng hai bên; đo độ rộng từng dải, so với bảng
 *      L / G / R của EAN-13.
 *   4. Kiểu L/G của 6 số bên trái cho ra số đầu tiên; cuối cùng kiểm số kiểm
 *      tra. Sai một số là bỏ — không bao giờ đoán.
 * Đọc được ở nhiều hàng thì lấy mã được nhiều hàng đọc ra nhất.
 *
 * Node đọc thẳng file này để kiểm thử (crm/test/test-kho-ma-vach.mjs), nên
 * không dùng gì của trình duyệt ngoài `window`.
 */
(function (goc) {
  'use strict';

  // Độ rộng 4 dải (trắng, đen, trắng, đen) của từng số kiểu L, tính theo
  // "mô-đun" (vạch mảnh nhất). Kiểu R: cùng độ rộng nhưng bắt đầu bằng đen.
  // Kiểu G: độ rộng của L đảo ngược.
  var L = [
    [3, 2, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [1, 4, 1, 1], [1, 1, 3, 2],
    [1, 2, 3, 1], [1, 1, 1, 4], [1, 3, 1, 2], [1, 2, 1, 3], [3, 1, 1, 2],
  ];
  var G = L.map(function (p) { return p.slice().reverse(); });
  // Kiểu L/G của 6 số bên trái → số đầu tiên (0 = L, 1 = G).
  var SO_DAU = {
    '000000': 0, '001011': 1, '001101': 2, '001110': 3, '010011': 4,
    '011001': 5, '011100': 6, '010101': 7, '010110': 8, '011010': 9,
  };
  // Tổng lệch (theo mô-đun) lớn hơn mức này thì coi là không khớp số nào.
  var LECH_TOI_DA = 1.6;

  function soKiemTraDung(ma) {
    var tong = 0;
    for (var i = 0; i < 12; i++) tong += Number(ma[i]) * (i % 2 === 0 ? 1 : 3);
    return (10 - (tong % 10)) % 10 === Number(ma[12]);
  }

  /** 4 độ rộng → số khớp nhất trong bảng, kèm độ lệch. */
  function khopSo(w, bang) {
    var tong = w[0] + w[1] + w[2] + w[3];
    if (!(tong > 0)) return null;
    var tot = -1, lech = Infinity;
    for (var s = 0; s < 10; s++) {
      var p = bang[s], d = 0;
      for (var j = 0; j < 4; j++) d += Math.abs((w[j] * 7) / tong - p[j]);
      if (d < lech) { lech = d; tot = s; }
    }
    return { so: tot, lech: lech };
  }

  /** Dải có gần đúng `n` mô-đun không (cho vạch mở / giữa / đóng). */
  function gan(w, n, mod) {
    return w > n * mod * 0.45 && w < n * mod * 1.8;
  }

  /**
   * Đọc một dãy dải (độ rộng + đen/trắng) theo MỘT chiều. Trả mã hoặc null.
   */
  function docDai(rong, den) {
    var n = rong.length;
    for (var s = 1; s + 59 < n; s++) {
      if (!den[s]) continue;
      var tong = 0;
      for (var k = 0; k < 59; k++) tong += rong[s + k];
      var mod = tong / 95;
      // Khoảng trắng hai bên mã ít nhất 3 mô-đun (nhãn thật để 7–11).
      if (rong[s - 1] < mod * 3 || rong[s + 59] < mod * 3) continue;
      if (!gan(rong[s], 1, mod) || !gan(rong[s + 1], 1, mod) || !gan(rong[s + 2], 1, mod)) continue;
      if (!gan(rong[s + 56], 1, mod) || !gan(rong[s + 57], 1, mod) || !gan(rong[s + 58], 1, mod)) continue;
      var giuaDung = true;
      for (k = 27; k < 32; k++) if (!gan(rong[s + k], 1, mod)) { giuaDung = false; break; }
      if (!giuaDung) continue;

      var ma = '', kieu = '', hong = false;
      for (var i = 0; i < 6 && !hong; i++) {
        var o = s + 3 + i * 4;
        var w = [rong[o], rong[o + 1], rong[o + 2], rong[o + 3]];
        var a = khopSo(w, L), b = khopSo(w, G);
        var chon = a && (!b || a.lech <= b.lech) ? a : b;
        if (!chon || chon.lech > LECH_TOI_DA) { hong = true; break; }
        ma += chon.so;
        kieu += chon === a ? '0' : '1';
      }
      if (hong) continue;
      for (i = 0; i < 6 && !hong; i++) {
        o = s + 32 + i * 4;
        var r = khopSo([rong[o], rong[o + 1], rong[o + 2], rong[o + 3]], L);
        if (!r || r.lech > LECH_TOI_DA) { hong = true; break; }
        ma += r.so;
      }
      if (hong) continue;
      var dau = SO_DAU[kieu];
      if (dau === undefined) continue;
      ma = dau + ma;
      if (soKiemTraDung(ma)) return ma;
    }
    return null;
  }

  /**
   * Một hàng mức sáng → dải đen/trắng. Mép vạch nội suy giữa hai điểm ảnh
   * nằm hai bên ngưỡng, để vạch rộng 2,5 điểm ảnh vẫn đo ra 2,5.
   */
  function taoDai(hang) {
    var n = hang.length;
    var xep = Array.prototype.slice.call(hang).sort(function (x, y) { return x - y; });
    var toi = xep[Math.floor(n * 0.05)], sang = xep[Math.floor(n * 0.95)];
    if (sang - toi < 24) return null;   // ảnh phẳng, không có vạch
    var nguong = (toi + sang) / 2;
    var rong = [], den = [];
    var laDen = hang[0] < nguong, dau = 0;
    for (var x = 0; x + 1 < n; x++) {
      var sauDen = hang[x + 1] < nguong;
      if (sauDen === laDen) continue;
      var moc = x + (nguong - hang[x]) / (hang[x + 1] - hang[x]);
      rong.push(moc - dau); den.push(laDen);
      dau = moc; laDen = sauDen;
    }
    rong.push(n - dau); den.push(laDen);
    return rong.length >= 61 ? { rong: rong, den: den } : null;
  }

  function docHang(hang) {
    var d = taoDai(hang);
    if (!d) return null;
    var ma = docDai(d.rong, d.den);
    if (ma) return ma;
    // Gói lộn ngược: đọc từ phải sang trái.
    return docDai(d.rong.slice().reverse(), d.den.slice().reverse());
  }

  /**
   * imageData: { width, height, data } như ctx.getImageData() (RGBA, mỗi
   * điểm 4 byte). Trả mã 13 số hoặc null.
   */
  function giaiMa(imageData) {
    if (!imageData || !imageData.data || !(imageData.width > 0) || !(imageData.height > 0)) return null;
    var w = imageData.width, h = imageData.height, px = imageData.data;
    if (px.length < w * h * 4) return null;
    var xam = new Float32Array(w * h);
    for (var i = 0, j = 0; i < w * h; i++, j += 4) {
      xam[i] = px[j] * 0.299 + px[j + 1] * 0.587 + px[j + 2] * 0.114;
    }

    var phieu = {};
    var tot = null, nhieuNhat = 0;
    var ghi = function (ma) {
      if (!ma) return;
      phieu[ma] = (phieu[ma] || 0) + 1;
      if (phieu[ma] > nhieuNhat) { nhieuNhat = phieu[ma]; tot = ma; }
    };

    // Hàng ngang: 25 hàng từ 15% tới 85% chiều cao.
    var SO_HANG = 25;
    var hang = new Float32Array(w);
    for (var k = 0; k < SO_HANG; k++) {
      var y = Math.round(h * (0.15 + (0.7 * k) / (SO_HANG - 1)));
      var y0 = Math.max(0, y - 1), y1 = Math.min(h - 1, y + 1), dem = y1 - y0 + 1;
      for (var x = 0; x < w; x++) {
        var t = 0;
        for (var yy = y0; yy <= y1; yy++) t += xam[yy * w + x];
        hang[x] = t / dem;
      }
      ghi(docHang(hang));
      // Ba hàng khớp nhau là đủ chắc — dừng sớm cho nhẹ máy.
      if (nhieuNhat >= 3) return tot;
    }
    if (tot) return tot;

    // Cột dọc: gói xoay 90°.
    var SO_COT = 15;
    var cot = new Float32Array(h);
    for (k = 0; k < SO_COT; k++) {
      var cx = Math.round(w * (0.15 + (0.7 * k) / (SO_COT - 1)));
      var x0 = Math.max(0, cx - 1), x1 = Math.min(w - 1, cx + 1), demX = x1 - x0 + 1;
      for (y = 0; y < h; y++) {
        var tc = 0;
        for (var xx = x0; xx <= x1; xx++) tc += xam[y * w + xx];
        cot[y] = tc / demX;
      }
      ghi(docHang(cot));
      if (nhieuNhat >= 3) return tot;
    }
    return tot;
  }

  goc.KhoEan13 = { giaiMa: giaiMa };
})(typeof window !== 'undefined' ? window : this);
