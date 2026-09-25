/**
 * BEEFTOWN — Nhận dữ liệu đặt bàn từ website vào Google Sheet
 * ============================================================
 * Mục đích: Beeftown sở hữu 100% dữ liệu khách, không bị khóa trong vendor
 * (đúng nguyên tắc trong Beeftown_Ma_tran_phan_mem.xlsx).
 * Cột trong Sheet khớp với cấu trúc dữ liệu ở Beeftown_CRM_Design.html mục B1.
 *
 * ------------------------------------------------------------
 * HƯỚNG DẪN CÀI ĐẶT — 5 BƯỚC, KHOẢNG 5 PHÚT
 * ------------------------------------------------------------
 * 1. Vào https://sheets.new để tạo một Google Sheet mới.
 *    Đặt tên ví dụ "Beeftown — Đặt bàn". Không cần tạo cột, script tự tạo.
 *
 * 2. Trong Sheet đó, chọn menu  Tiện ích mở rộng (Extensions)
 *    → Apps Script.  Một tab mới mở ra.
 *
 * 3. Xóa hết code mẫu trong đó, dán TOÀN BỘ nội dung file này vào, rồi bấm
 *    biểu tượng đĩa mềm để lưu.
 *
 * 4. Bấm nút  Triển khai (Deploy) → Lần triển khai mới (New deployment).
 *    - Bấm biểu tượng bánh răng cạnh "Chọn loại", chọn  Ứng dụng web (Web app)
 *    - Mô tả: Beeftown booking
 *    - Thực thi với tư cách (Execute as):  Tôi (Me)
 *    - Ai có quyền truy cập (Who has access):  Bất kỳ ai (Anyone)      ← QUAN TRỌNG
 *    - Bấm  Triển khai.  Google sẽ hỏi cấp quyền → bấm qua các bước cho phép.
 *      (Màn hình cảnh báo "Google hasn't verified this app" là bình thường với
 *       script tự viết: bấm Nâng cao → Đi tới ... (không an toàn) → Cho phép.)
 *
 * 5. Copy đường dẫn "URL ứng dụng web" hiện ra (dạng
 *    https://script.google.com/macros/s/AKfy..../exec )
 *    rồi dán vào file Beeftown_Website/index.html — tìm dòng:
 *        var BOOKING_ENDPOINT = '';
 *    và điền vào giữa hai dấu nháy.
 *
 * ------------------------------------------------------------
 * LƯU Ý VỀ QUYỀN "BẤT KỲ AI"
 * ------------------------------------------------------------
 * Cần chọn "Bất kỳ ai" thì trình duyệt của khách mới gửi dữ liệu vào được.
 * Điều này CHỈ cho phép người khác GỬI dữ liệu vào Sheet, KHÔNG cho phép ai
 * đọc Sheet của bạn — quyền xem Sheet vẫn hoàn toàn do bạn kiểm soát.
 *
 * Nếu sau này bị spam, bỏ ghi chú (xóa dấu //) ở phần kiểm tra SECRET_TOKEN
 * bên dưới và điền cùng một chuỗi bí mật ở cả hai file.
 */

// Tên sheet sẽ được tạo tự động trong bảng tính
var SHEET_NAME = 'Đặt bàn';

// Chống spam (tùy chọn) — nếu dùng, điền cùng chuỗi này vào index.html
var SECRET_TOKEN = '';

// Thứ tự cột — khớp Beeftown_CRM_Design.html mục B1
var HEADERS = [
  'Thời điểm nhận',
  'Họ tên',
  'Số điện thoại',
  'Chi nhánh',
  'Ngày đặt',
  'Giờ đặt',
  'Số khách',
  'Dịp',
  'Ghi chú',
  'Đồng ý nhận tin',
  'Nguồn (utm_source)',
  'Kênh (utm_medium)',
  'Chiến dịch (utm_campaign)',
  'Trang giới thiệu'
];

/**
 * Nhận dữ liệu POST từ form đặt bàn trên website.
 */
function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};

    // Chống spam — bỏ ghi chú 3 dòng dưới nếu đã đặt SECRET_TOKEN
    // if (SECRET_TOKEN && p.token !== SECRET_TOKEN) {
    //   return json({ ok: false, error: 'unauthorized' });
    // }

    var sheet = getSheet_();

    sheet.appendRow([
      new Date(),
      p.name || '',
      normalizePhone_(p.phone),
      p.branch || '',
      p.date || '',
      p.time || '',
      p.guests || '',
      p.occasion || '',
      p.note || '',
      p.consent === '1' ? 'Có' : 'Không',
      p.utm_source || '',
      p.utm_medium || '',
      p.utm_campaign || '',
      p.referrer || ''
    ]);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/**
 * Mở link web app bằng trình duyệt sẽ thấy dòng này — dùng để kiểm tra
 * đã triển khai thành công hay chưa.
 */
function doGet() {
  return ContentService
    .createTextOutput('Beeftown booking endpoint đang hoạt động.')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Lấy sheet, tạo mới kèm hàng tiêu đề nếu chưa có.
 */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    var header = sheet.getRange(1, 1, 1, HEADERS.length);
    header.setFontWeight('bold');
    header.setBackground('#1E160E');   // Charcoal — màu thương hiệu
    header.setFontColor('#FBF4E1');    // Cream
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(3, 130);
  }

  return sheet;
}

/**
 * Chuẩn hóa số điện thoại về dạng 0xxxxxxxxx.
 * Đây là KHÓA CHÍNH nối dữ liệu giữa website, POS và Zalo
 * (xem Beeftown_CRM_Design.html mục B1) — không chuẩn hóa thì một người
 * sẽ thành nhiều hồ sơ khác nhau.
 */
function normalizePhone_(raw) {
  if (!raw) return '';

  var s = String(raw).replace(/[^0-9+]/g, '');

  if (s.indexOf('+84') === 0) {
    s = '0' + s.substring(3);
  } else if (s.indexOf('84') === 0 && s.length >= 10) {
    s = '0' + s.substring(2);
  } else if (s.charAt(0) !== '0' && s.length === 9) {
    s = '0' + s;
  }

  s = s.replace(/\+/g, '');

  // Ghi dạng chuỗi để Google Sheet không cắt mất số 0 đầu
  return "'" + s;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
