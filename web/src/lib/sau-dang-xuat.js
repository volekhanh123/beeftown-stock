/*
 * NỘI BỘ — NÚT "QUAY LẠI" SAU KHI ĐĂNG XUẤT (rà soát bảo mật 14/11/2026)
 *
 * Trình duyệt giữ nguyên trang vừa rời trong bộ nhớ (bfcache): bấm Quay lại là trang hiện ngay, KHÔNG hỏi máy
 * chủ — cookie đã xóa và phiên đã thu hồi không được xét tới. Trên máy nhiều người dùng, người đến sau bấm Quay
 * lại là thấy lại trang của người vừa đăng xuất (danh sách khách, công nợ). Trả lời đăng xuất có mang
 * Clear-Site-Data: "cache", nhưng lệnh đó chỉ gỡ được các trang ĐÃ nằm trong bộ nhớ quay lại; chính trang vừa bấm
 * Đăng xuất vào bộ nhớ sau khi lệnh được xử lý và nằm đó khoảng 10 phút (thử bằng Chromium 156 và Chrome 153 bản
 * đầy đủ). Trình duyệt khác chưa chắc gỡ gì.
 *
 * TÍN HIỆU ĐẾN TỪ MÁY CHỦ. Mỗi lần cookie phiên bị xóa (đăng xuất, phiên bị từ chối), máy chủ đổi cookie
 * bt_dau_phien — "dấu phiên", một chuỗi ngẫu nhiên, JavaScript đọc được, không mang gì của phiên (lib/phien.ts,
 * xoaToken). Máy chủ in vào mỗi trang nội bộ dấu nó thấy lúc dựng trang đó (thuộc tính data-dau-phien của chính thẻ
 * script này — components/SauDangXuat.astro). Đoạn mã dưới so hai dấu ở ba thời điểm:
 *
 *   · rời trang (pagehide) mà dấu đã khác → GIẤU trang. Bấm Đăng xuất ở chính trang này thì trả lời đăng xuất đã đổi
 *     dấu trước khi trang rời đi, nên bản trình duyệt cất vào bộ nhớ là bản đã giấu — bấm Quay lại không lóe ra;
 *   · hiện lại từ bộ nhớ (pageshow, persisted) mà dấu đã khác → giấu và TẢI LẠI. Máy chủ quyết định: chưa đăng nhập
 *     thì về trang đăng nhập, người khác đã đăng nhập thì hiện trang theo quyền của người đó;
 *   · bấm Quay lại / Tiến mà trình duyệt DỰNG LẠI trang từ bản lưu đệm của nó (không lấy nguyên trang từ bộ nhớ
 *     quay lại, cũng không hỏi máy chủ) và dấu đã khác → giấu ngay — mã này nằm trong <head>, thân trang chưa hiện
 *     — rồi tải lại. Lớp này để không phải trông vào Clear-Site-Data: trình duyệt nào không nghe lệnh đó thì vẫn
 *     còn bản lưu đệm của trang cũ. Trang vừa được tải lại (kiểu "reload") không vào nhánh này, nên không bao giờ
 *     tải lại hai lần liền; trình duyệt không cho biết kiểu tải thì bỏ qua lớp này.
 *
 * Dấu không đổi thì không làm gì: bấm nhầm một link rồi Quay lại, chữ đang gõ dở vẫn còn. Làm mới token không đổi
 * dấu. Không dựa vào đồng hồ của máy, không localStorage, không cần bắt lúc bấm nút, không tải file nào riêng —
 * bản đầu của phần này làm theo ba cách đó và vòng rà soát ba chỉ ra từng chỗ hở.
 *
 * Không đọc được cookie, hay không thấy thẻ của chính mình: coi như dấu đã đổi (tải lại thừa còn hơn hiện trang của
 * người trước). MÁY CHỦ MỚI LÀ NƠI QUYẾT ĐỊNH: tắt JavaScript thì mọi trang vẫn chạy đủ, chỉ mất lớp này. Chỉ ĐỌC
 * cookie; không gọi mạng; không thư viện nào. Máy tính bảng dùng chung có thêm file đếm giờ tự khóa, tải lại ở MỌI
 * lần trang hiện lại từ bộ nhớ.
 *
 * Kiểm: crm/test/test-noi-bo-dang-xuat.mjs nhóm 8b, 9 (chạy chính file này với cửa sổ giả); trên bản build thật,
 * Chromium bản đầy đủ có bfcache: web/kiem-tra/trinh-duyet.mjs nhóm 4.
 */
(function () {
  var the = document.currentScript;
  // Dấu của phiên lúc MÁY CHỦ dựng trang này. null = không thấy thẻ của chính mình.
  var dauLucDung = the && typeof the.getAttribute === 'function' ? (the.getAttribute('data-dau-phien') || '') : null;
  var laTrangCu = false;   // đã biết trang này thuộc một phiên đã kết thúc — biết rồi thì không đổi lại

  /** Dấu phiên trình duyệt đang giữ. '' = chưa có dấu nào; null = không đọc được cookie. */
  function dauHienTai() {
    try {
      var khop = document.cookie.match(/(?:^|;\s*)bt_dau_phien=([^;]*)/);
      return khop ? khop[1] : '';
    } catch (loi) {
      return null;
    }
  }

  function phienDaKetThuc() {
    if (!laTrangCu) {
      var dau = dauHienTai();
      laTrangCu = dauLucDung === null || dau === null || dau !== dauLucDung;
    }
    return laTrangCu;
  }

  function giau() {
    document.documentElement.style.visibility = 'hidden';
  }

  /**
   * Trang này được dựng do bấm Quay lại / Tiến (trình duyệt báo kiểu tải "back_forward")? Không biết thì coi là
   * không — nhánh dùng hàm này có gọi tải lại, và tải lại nhầm chỗ là tải lại mãi.
   */
  function duocDungDoLuiTien() {
    try {
      var hieuNang = window.performance;
      if (!hieuNang) return false;
      var muc = typeof hieuNang.getEntriesByType === 'function' ? hieuNang.getEntriesByType('navigation')[0] : null;
      if (muc && typeof muc.type === 'string') return muc.type === 'back_forward';
      return !!hieuNang.navigation && hieuNang.navigation.type === 2;   // trình duyệt cũ: 2 = lùi / tiến
    } catch (loi) {
      return false;
    }
  }

  // Lúc tải: trang dựng lại từ bản lưu đệm khi bấm Quay lại, mà phiên của nó đã kết thúc.
  if (duocDungDoLuiTien() && phienDaKetThuc()) {
    giau();
    window.location.reload();
  }

  window.addEventListener('pagehide', function () {
    if (phienDaKetThuc()) giau();
  });

  window.addEventListener('pageshow', function (suKien) {
    if (!suKien.persisted) return;
    if (phienDaKetThuc()) {
      giau();
      window.location.reload();
    }
  });
})();
