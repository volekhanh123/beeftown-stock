/**
 * PHẦN CHỮ KHÁCH ĐỌC ĐƯỢC CỦA MỘT TRANG — và chỗ miễn duy nhất cho giá đã chốt
 * ===========================================================================
 *
 * Dùng chung cho quet-chuoi-cam.mjs (npm run quet, lượt quét đêm trên beeftown.vn) và thu-day-du.mjs nhóm 12.
 * Tách khỏi quet-chuoi-cam.mjs vì file đó tự chạy main() khi nạp: kiểm thử (crm/test/test-cong-khai-quet-gia.mjs)
 * cần nạp đúng hai hàm này mà không bật máy chủ.
 *
 * chuHienRa(html) — chữ khách đọc: bỏ script, style, chú thích; giữ tiêu đề, nội dung thẻ meta và JSON-LD (chúng
 * hiện ra ở kết quả tìm kiếm và ô xem trước khi chia sẻ link).
 *
 * boTienDaChot(html, duongDan) — CHỖ MIỄN DUY NHẤT của luật "không số tiền nào trên trang công khai"
 * (web/src/lib/chuoi-cam.js, mẫu cuối). Trang Mua thịt về (PR 2, migration 0101) in giá gói chủ đã chốt ở
 * /noi-bo/ban-le; luật chữ cấm KHÔNG đổi, bộ quét chỉ bỏ qua đúng những số tiền đó trước khi quét:
 *   · chỉ trên ba đường dẫn DUONG_DAN_HIEN_GIA (dòng /mua-thit-ve của CAP_DUONG_DAN, chép tay — kiểm thử so hai bên);
 *   · <span data-tien>X</span>: X là chữ trơn và đúng một số tiền dạng "400.000 đ" (dấu cách thường hoặc không ngắt)
 *     → bỏ X. Chữ khác, dạng tiền khác ("400.000đ", "400,000 ₫", "400.000 VND"), thẻ lồng bên trong → giữ, vẫn bị báo;
 *   · <textarea data-tien> (tin đơn): bỏ từng số tiền đúng dạng đó, phần chữ còn lại vẫn quét ("Wagyu" vẫn bị báo);
 *   · số tiền ở mọi chỗ khác — mô tả món, ô chữ công bố, tiêu đề, thẻ meta, JSON-LD, trang khác — vẫn bị báo.
 * Thêm trang in giá khác thì thêm đường dẫn ở đây và kiểm thử cùng PR; đừng nới mẫu trong chuoi-cam.js.
 */

/** Ba đường dẫn của trang Mua thịt về — chép tay dòng /mua-thit-ve của CAP_DUONG_DAN (web/src/lib/chu.ts). */
export const DUONG_DAN_HIEN_GIA = Object.freeze(['/mua-thit-ve', '/en/buy-meat', '/ko/buy-meat']);

// -----------------------------------------------------------------------------
// LẤY PHẦN CHỮ KHÁCH ĐỌC ĐƯỢC
// -----------------------------------------------------------------------------
// Bỏ script, style và chú thích HTML — ba thứ này có trong file nhưng không
// bao giờ hiện thành chữ. Giữ lại nội dung thẻ mô tả: chúng KHÔNG nằm trên
// trang, nhưng hiện ra ở kết quả tìm kiếm và ô xem trước khi chia sẻ link,
// nên với khách chúng cũng là chữ đọc được.
// -----------------------------------------------------------------------------
export function chuHienRa(html) {
  const than = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const phan = [];

  const tieuDe = than.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (tieuDe) phan.push(tieuDe[1]);

  for (const m of than.matchAll(/<meta\b[^>]*\bcontent\s*=\s*"([^"]*)"[^>]*>/gi)) {
    phan.push(m[1]);
  }

  // JSON-LD nằm trong <script> nên đã bị bỏ ở trên. Lấy lại riêng: Google đọc
  // nó và đưa lên kết quả tìm kiếm, nên nó cũng là chữ khách đọc được.
  for (const m of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    phan.push(m[1]);
  }

  phan.push(than.replace(/<[^>]+>/g, ' '));

  return phan.join(' \n ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ');
}

// -----------------------------------------------------------------------------
// BỎ SỐ TIỀN ĐÃ CHỐT CỦA TRANG MUA THỊT VỀ
// -----------------------------------------------------------------------------

/** Đường dẫn (hay địa chỉ đầy đủ) → đường dẫn không chuỗi truy vấn, không "/" cuối. */
function chuanDuongDan(duongDan) {
  let d;
  try { d = new URL(String(duongDan ?? ''), 'http://trang.invalid').pathname; } catch { return ''; }
  return d.replace(/\/+$/, '') || '/';
}

/** Trang này được in giá đã chốt (một trong ba đường dẫn Mua thịt về). */
export function laTrangHienGia(duongDan) {
  return DUONG_DAN_HIEN_GIA.includes(chuanDuongDan(duongDan));
}

// Thuộc tính của một thẻ mở: tên, rồi (tùy) = giá trị có ngoặc kép, ngoặc đơn hoặc trơn. Giá trị có ngoặc nên
// chứa được ">" mà không cắt thẻ giữa chừng.
const THUOC_TINH = String.raw`\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>\x60]+))?`;
const TEN_THUOC_TINH = new RegExp(String.raw`\s+([^\s"'>\/=]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>\x60]+))?`, 'g');
// Quét từ trái sang phải; ở mỗi chỗ thử lần lượt:
//   1. script / style / chú thích — giữ nguyên (không bao giờ là chữ trên trang);
//   2. <span …>chữ trơn</span>;
//   3. <textarea …>…</textarea>;
//   4. mọi thẻ khác, trọn cả thuộc tính — giữ nguyên, để "<span" nằm trong giá trị một thuộc tính (thẻ meta…)
//      không bao giờ bị coi là một phần tử.
const PHAN_TU = new RegExp([
  String.raw`(<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->)`,
  String.raw`<span((?:${THUOC_TINH})*)\s*>([^<]*)<\/span\s*>`,
  String.raw`<textarea((?:${THUOC_TINH})*)\s*>([\s\S]*?)<\/textarea\s*>`,
  String.raw`(<[a-zA-Z][^\s>\/]*(?:${THUOC_TINH})*\s*\/?>)`,
].join('|'), 'gi');

const coDataTien = thuocTinh => [...thuocTinh.matchAll(TEN_THUOC_TINH)].some(m => m[1].toLowerCase() === 'data-tien');
/** Dấu cách không ngắt viết bằng thực thể HTML → ký tự U+00A0 (bản build có thể in một trong ba dạng). */
const giaiMaCachKhongNgat = s => s.replace(/&nbsp;|&#160;|&#x0*a0;/gi, ' ');
/** Đúng một số tiền: nhóm nghìn bằng dấu chấm, một dấu cách (thường hoặc không ngắt), chữ "đ". */
const MOT_SO_TIEN = /^\d{1,3}(?:\.\d{3})+[  ]đ$/;
/** Số tiền đúng dạng trong một đoạn chữ: không dính số / dấu ngăn phía trước, không dính chữ phía sau ("đồng"). */
const SO_TIEN_TRONG_CHU = /(?<![\p{N}.,])\d{1,3}(?:\.\d{3})+[  ]đ(?![\p{L}\p{N}])/gu;

/**
 * HTML của trang sau khi bỏ số tiền đã chốt ở đúng các phần tử data-tien — chỉ trên trang Mua thịt về; trang khác
 * trả nguyên văn. Không ném lỗi: html không phải chuỗi → chuỗi rỗng.
 */
export function boTienDaChot(html, duongDan) {
  const s = typeof html === 'string' ? html : '';
  if (!laTrangHienGia(duongDan)) return s;
  return s.replace(PHAN_TU, (ca, giuNguyen, ttSpan, chuSpan, ttTextarea, chuTextarea, theKhac) => {
    if (giuNguyen !== undefined || theKhac !== undefined) return ca;
    if (ttSpan !== undefined) {
      const x = giaiMaCachKhongNgat(chuSpan).replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g, '');
      return coDataTien(ttSpan) && MOT_SO_TIEN.test(x) ? `<span${ttSpan}> </span>` : ca;
    }
    if (!coDataTien(ttTextarea)) return ca;
    return `<textarea${ttTextarea}>${giaiMaCachKhongNgat(chuTextarea).replace(SO_TIEN_TRONG_CHU, ' ')}</textarea>`;
  });
}
