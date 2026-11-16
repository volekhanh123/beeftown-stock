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
 * script này — components/SauDangXuat.astro). Đoạn mã dưới giấu trang ở hai lúc và so hai dấu ở hai lúc:
 *
 *   · gửi form Đăng xuất → GIẤU NGAY, trước khi máy chủ trả lời. Chromium đưa một trang ra từ bộ nhớ quay lại bằng
 *     khung hình CUỐI nó đã vẽ cho trang đó, trước khi kịp dựng lại trang; giấu lúc rời trang thì không còn lượt vẽ
 *     nào sau đó, khung hình cuối vẫn là trang đầy đủ (vòng rà soát bốn đo bằng quay màn hình: 6/8 lần bấm Quay lại
 *     sau khi đăng xuất thấy một khung hình của trang cũ). Giấu lúc gửi thì trong lúc chờ máy chủ, trang kịp vẽ lại ở
 *     dạng đã giấu (0/8). Trang không rời đi được (bấm Dừng) thì 10 giây sau hiện lại;
 *   · rời trang (pagehide) → GIẤU trang, LÚC NÀO CŨNG VẬY. Lúc rời, trang không biết phiên của nó có kết thúc trước
 *     khi nó được đưa trở lại hay không, nên trạng thái cất vào bộ nhớ luôn là "đã giấu": trình duyệt nào dựng lại
 *     trang từ trạng thái đó thì không lóe ra gì. Chromium thì vẫn có thể hiện khung hình cuối đã vẽ của một trang rời
 *     đi TRƯỚC lần đăng xuất — với Chromium, lệnh Clear-Site-Data của mọi trả lời kết thúc phiên gỡ hẳn các trang đó;
 *   · hiện lại từ bộ nhớ (pageshow, persisted) → so dấu. Dấu KHÔNG đổi: cho hiện lại ngay, không xin gì — bấm nhầm
 *     một link rồi Quay lại, chữ đang gõ dở vẫn còn. Dấu đã khác: vẫn giấu và XIN LẠI TRANG. Máy chủ quyết định: chưa
 *     đăng nhập thì về trang đăng nhập, người khác đã đăng nhập thì hiện trang theo quyền của người đó. Trang đã giấu
 *     lúc rời thì lần hiện kế tiếp luôn được xét — pageshow, hay thẻ hiện ra lại (visibilitychange) với trình duyệt
 *     nào không báo pageshow — không bao giờ nằm lại ở trạng thái bị giấu;
 *   · bấm Quay lại / Tiến mà trình duyệt DỰNG LẠI trang từ bản lưu đệm của nó (không lấy nguyên trang từ bộ nhớ
 *     quay lại, cũng không hỏi máy chủ) và dấu đã khác → giấu ngay — mã này nằm trong <head>, thân trang chưa hiện
 *     — rồi xin lại trang. Lớp này để không phải trông vào Clear-Site-Data: trình duyệt nào không nghe lệnh đó thì
 *     vẫn còn bản lưu đệm của trang cũ. Trang vừa xin lại (kiểu tải "navigate") không vào nhánh này, nên không bao
 *     giờ lặp; trình duyệt không cho biết kiểu tải thì bỏ qua lớp này.
 *
 * XIN LẠI TRANG LÀ MỘT LƯỢT GET — location.replace(địa chỉ của trang, bỏ phần sau dấu #) — KHÔNG BAO GIỜ
 * location.reload(). Trang nội
 * bộ báo lỗi của một lần gửi form ngay tại chỗ, trong trả lời của POST (form đăng nhập thì không còn: lượt POST của
 * nó luôn trả 303 — lib/phien.ts, guiFormDangNhap; các form khác vẫn vậy); trình duyệt dựng lại
 * trang đó từ bản lưu đệm khi bấm Quay lại, và reload() do MÃ gọi làm nó GỬI LẠI form mà không hỏi (người tự bấm tải
 * lại thì được hỏi). Vòng rà soát bốn (14/11) đo được trên Chromium thật, với bản đầu của lớp "lúc tải": một lần ghi
 * ngoài ý muốn dưới quyền người đăng nhập sau, và một lần đăng nhập lại dưới tên người trước — chỉ bằng nút Quay lại.
 * Bỏ phần sau dấu # của địa chỉ: chỉ khác phần đó thì trình duyệt coi là cuộn trong trang, không xin lại.
 *
 * Dấu không đổi thì trang hiện lại y như lúc rời, không xin lại gì. Làm mới token không đổi dấu. Giấu là đặt
 * visibility của <html> — không đổi bố cục, không mất chữ đang gõ, không mất chỗ đang cuộn (nên không CSS nào được
 * tự đặt "visibility: visible": phần tử đó sẽ lộ ra). Việc quyết định trang thuộc phiên nào không dựa vào đồng hồ
 * của máy, không localStorage, không dựa vào việc bắt được lúc bấm nút (giấu lúc gửi form chỉ để khung hình cuối là
 * khung trống; bắt hụt thì lúc rời vẫn giấu), không tải file nào riêng — bản đầu của phần này làm theo các cách đó và
 * vòng rà soát ba chỉ ra từng chỗ hở.
 *
 * Không đọc được cookie, không thấy thẻ của chính mình, hay thấy HAI cookie dấu cùng tên (một cái ai đó đặt sẵn với
 * Path dài hơn thì đứng trước cái thật, máy chủ và mã đều đọc nhầm nó): coi như dấu đã đổi (xin lại thừa còn hơn hiện
 * trang của người trước). MÁY CHỦ MỚI LÀ NƠI QUYẾT ĐỊNH: tắt JavaScript thì mọi trang vẫn chạy đủ, chỉ mất lớp này. Chỉ ĐỌC
 * cookie; không gọi mạng; không thư viện nào. Máy tính bảng dùng chung có thêm file đếm giờ tự khóa, tải lại ở MỌI
 * lần trang hiện lại từ bộ nhớ.
 *
 * RỜI TRANG LÀ XÓA MỌI Ô MẬT KHẨU / PIN (input type="password"; issue #194). Việc này không đợi dấu phiên đổi: ô mật
 * khẩu đáng giấu nhất là ở trang CHƯA có ai đăng nhập — trang đăng nhập, máy dùng chung đang khóa (ô PIN, gắn người,
 * đăng ký máy) — nơi dấu phiên không bao giờ đổi. Trình duyệt giữ trang vừa rời trong bộ nhớ quay lại cùng chữ đã gõ
 * (đo trên Chromium 156: gõ mật khẩu, bấm một link, Quay lại là thấy nguyên ô đó). Lượt gửi form đã lấy chữ trước lúc
 * này nên không mất gì; bấm nhầm link rồi Quay lại thì gõ lại mật khẩu. Không tìm được ô thì thôi — trang vẫn được giấu.
 *
 * Kiểm: crm/test/test-noi-bo-dang-xuat.mjs nhóm 8b, 9 (chạy chính file này với cửa sổ giả), crm/test/test-kho-may-lich-
 * su.mjs nhóm 4 (xóa ô mật khẩu); trên bản build thật, Chromium bản đầy đủ có bfcache: web/kiem-tra/trinh-duyet.mjs nhóm 4.
 */
(function () {
  var the = document.currentScript;
  // Dấu của phiên lúc MÁY CHỦ dựng trang này. null = không thấy thẻ của chính mình.
  var dauLucDung = the && typeof the.getAttribute === 'function' ? (the.getAttribute('data-dau-phien') || '') : null;
  var laTrangCu = false;   // đã biết trang này thuộc một phiên đã kết thúc — biết rồi thì không đổi lại
  var choXetLai = false;   // trang đã giấu lúc rời, chưa được xét lại lần nào kể từ đó
  var dangChoDangXuat = false;   // đã giấu lúc gửi form Đăng xuất, trang chưa rời đi

  /** Dấu phiên trình duyệt đang giữ. '' = chưa có dấu nào; null = không đọc được cookie, hoặc có hơn một dấu. */
  function dauHienTai() {
    try {
      var cacDau = document.cookie.match(/(?:^|;\s*)bt_dau_phien=[^;]*/g) || [];
      if (cacDau.length > 1) return null;
      return cacDau.length ? cacDau[0].replace(/^;?\s*bt_dau_phien=/, '') : '';
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

  function hienLai() {
    document.documentElement.style.visibility = '';
  }

  /** Xóa chữ trong mọi ô mật khẩu / PIN của trang — xem đầu file. */
  function xoaMatKhau() {
    try {
      var o = document.querySelectorAll('input[type="password"]');
      for (var i = 0; i < o.length; i++) o[i].value = '';
    } catch (loi) { /* không tìm được ô thì thôi: trang vẫn được giấu */ }
  }

  /**
   * Xin lại trang này từ máy chủ bằng một lượt GET. Không reload(): xem đầu file. Dùng địa chỉ ĐẦY ĐỦ của trang, cắt
   * phần sau dấu # — không ghép "đường dẫn + tham số": trang mở qua //noi-bo/… có đường dẫn bắt đầu bằng hai dấu
   * gạch chéo, và chuỗi như vậy với trình duyệt là địa chỉ của một máy chủ khác.
   */
  function xinLaiTrang() {
    window.location.replace(String(window.location.href).split('#')[0]);
  }

  /**
   * Trang này được dựng do bấm Quay lại / Tiến (trình duyệt báo kiểu tải "back_forward")? Không biết thì coi là
   * không — nhánh dùng hàm này có xin lại trang, và xin lại nhầm chỗ là xin lại mãi.
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
    xinLaiTrang();
  }

  // Bấm Đăng xuất: giấu ngay lúc GỬI form, không đợi lúc rời trang — xem đầu file. Handler khác đã chặn lần gửi thì
  // thôi. Trang không rời đi được (bấm Dừng giữa chừng) thì hẹn giờ dự phòng cho trang hiện lại, không kẹt ở dạng trống.
  window.addEventListener('submit', function (suKien) {
    try {
      var form = suKien.target;
      if (suKien.defaultPrevented || !form || typeof form.getAttribute !== 'function') return;
      if (form.getAttribute('action') !== '/noi-bo/dang-xuat') return;
      dangChoDangXuat = true;
      giau();
      window.setTimeout(function () {
        if (!dangChoDangXuat) return;
        dangChoDangXuat = false;
        hienLai();
      }, 10000);
    } catch (loi) { /* không giấu được lúc gửi thì lúc rời trang vẫn giấu */ }
  });

  // Rời trang: GIẤU, lúc nào cũng vậy. Dấu đã đổi ngay lúc này thì ghi nhớ luôn (trang cũ thì mãi là trang cũ).
  window.addEventListener('pagehide', function () {
    phienDaKetThuc();
    dangChoDangXuat = false;
    choXetLai = true;
    giau();
    xoaMatKhau();
  });

  /** Trang đã giấu lúc rời nay hiện lại: so dấu rồi mới cho hiện. Mỗi lần rời chỉ xét MỘT lần. */
  function xetLai() {
    if (!choXetLai) return;
    choXetLai = false;
    if (phienDaKetThuc()) {
      giau();
      xinLaiTrang();
      return;
    }
    hienLai();
  }

  // Hiện lại từ bộ nhớ quay lại. Lần hiện ĐẦU của một trang vừa tải (chưa rời lần nào) thì không có gì để xét — nhánh
  // "lúc tải" ở trên đã xét, và xin lại trang ở đây là xin lại mãi.
  window.addEventListener('pageshow', xetLai);

  // Dự phòng: trình duyệt nào hiện lại một trang đã báo rời đi mà KHÔNG kèm pageshow (đổi tab, mở lại ứng dụng) thì
  // xét lúc thẻ hiện ra — trang không bao giờ kẹt ở dạng trống.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') xetLai();
  });
})();
