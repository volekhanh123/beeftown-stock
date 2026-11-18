/**
 * TIẾNG VIỆT CỦA TRANG — máy kiểm từng tin trước khi tới khách (Khánh 18/11/2026: "việt hóa hoàn toàn")
 * ===================================================================================================
 *
 * Trang (trợ lý ảo của Beeftown, khung chat ở trang Mua thịt về) chỉ nói tiếng Việt có dấu. Ba lớp giữ:
 *   1 · lời dặn có bảng từ (crm/supabase/functions/tro-ly-trang/trang.ts);
 *   2 · máy kiểm ở file này: chữ có dấu tiếng Việt thì qua; chữ không dấu phải có dạng một âm tiết tiếng Việt; thêm danh
 *       sách chữ tiếng Anh có dạng âm tiết (set, top, cap…). Thấy chữ nước ngoài, chữ cấm hay câu sai sự thật thì Edge
 *       Function bắt Claude viết lại MỘT lần;
 *   3 · vẫn còn chữ nước ngoài thì thay theo bảng từ (thayBangTu); vẫn còn thì bỏ tin đó.
 * Màn duyệt sổ học (/noi-bo/tro-ly) cũng chạy máy kiểm này: câu trả lời còn chữ nước ngoài hay chữ cấm thì không lưu được.
 *
 * MỘT FILE, HAI NƠI CHẠY: web (màn duyệt sổ học) và Edge Function tro-ly-trang. Supabase chỉ đóng gói thư mục của hàm,
 * nên thư mục hàm giữ một BẢN CHÉP đúng từng byte của file này và của chuoi-cam.js — crm/test/test-tro-ly-trang-ham.mjs
 * đỏ khi hai bản lệch. Sửa ở đây rồi chép sang: cp web/src/lib/tieng-viet-trang.ts web/src/lib/chuoi-cam.js
 * crm/supabase/functions/tro-ly-trang/
 *
 * File thuần: chỉ nạp chuoi-cam.js; không mạng, không đồng hồ, không DOM. Bộ kiểm nguồn gốc: bản thử ngày 18/11/2026
 * (07_Marketing_TaiLieu/Beeftown_TroLy_ChonBo_2026-11-17/tro-ly-chon-bo_demo_v3.html — chuNgoai, BANG_TU, CAM).
 */
import { timChuoiCam } from './chuoi-cam.js';

/**
 * Tên riêng, đơn vị giữ nguyên (viết thường). "ai" là một âm tiết tiếng Việt ("ai ăn", "có ai") nên máy kiểm âm tiết cho
 * qua; chữ "AI" viết hoa thì CAM_TRANG chặn — Trang không bao giờ viết "AI" trong tin (Khánh 18/11/2026).
 */
export const GIU_NGUYEN: readonly string[] = [
  'beeftown', 'vn', 'vnpay', 'zalo', 'ahamove', 'qr', 'chimichurri', 'facebook', 'g', 'kg',
  // Địa chỉ quán Trang được dạy nói: "tầng 3, 63 Hồ Tùng Mậu, TP.HCM".
  'tp', 'hcm',
];

/** Chữ tiếng Anh có dạng một âm tiết tiếng Việt không dấu — máy kiểm âm tiết không bắt được nên liệt kê. */
export const CHU_NGOAI: readonly string[] = [
  'set', 'top', 'cap', 'cut', 'hot', 'pot', 'on', 'it', 'the', 'vat', 'ok', 'oke', 'okay', 'shop', 'menu', 'online',
  'size', 'combo', 'ship', 'order', 'check', 'sale', 'deal', 'steak', 'medium', 'rare', 'well', 'done', 'skin', 'pack',
  'ribeye', 'skirt', 'blade', 'galbi', 'galbisal', 'kimchi', 'bbq', 'wagyu', 'beef', 'gas', 'atm', 'link', 'bot', 'chat',
  'chatbot', 'web', 'website', 'app', 'sorry', 'thanks', 'hi', 'hello', 'bye',
];

const DAU_VIET = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/;
const AM_TIET = /^(ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr|[bcdghklmnprstvx])?(oai|oay|oeo|uya|uyu|uoi|uou|ieu|yeu|ai|ao|au|ay|eo|eu|ia|ie|iu|oa|oe|oi|ua|ue|ui|uo|uy|ye|a|e|i|o|u|y)(ch|nh|ng|[cmnpt])?$/;

/**
 * Chữ không phải tiếng Việt trong một đoạn (viết thường, không lặp). Rỗng = sạch. Số và dấu câu là chỗ ngắt chữ, nên
 * "150 g", "VNPay", "mã QR" qua; "Ribeye", "set", "ok" bị bắt.
 */
export function chuNgoai(text: unknown): string[] {
  const ra: string[] = [];
  for (const w of String(text ?? '').normalize('NFC').toLowerCase().split(/[^\p{L}]+/u)) {
    if (!w || GIU_NGUYEN.includes(w)) continue;
    const ngoai = CHU_NGOAI.includes(w) || (!DAU_VIET.test(w) && !AM_TIET.test(w));
    if (ngoai && !ra.includes(w)) ra.push(w);
  }
  return ra;
}

/**
 * Bảng từ: [khách hay nói / nhãn khay, Trang nói, mẫu để máy tự thay, chữ thay (mặc định cột hai)]. Cụm dài đứng
 * trước cụm ngắn. Lời dặn của Trang in hai cột đầu.
 */
export const BANG_TU: readonly (readonly [string, string, RegExp, string?])[] = [
  ['Ribeye with Cap', 'đầu thăn ngoại còn nắp', /rib\s?eye\s+with\s+cap/gi],
  ['ribeye cap, nắp ribeye', 'nắp đầu thăn ngoại', /rib\s?eye\s+cap|nắp\s+rib\s?eye/gi],
  ['lõi ribeye', 'lõi đầu thăn ngoại', /lõi\s+rib\s?eye/gi],
  ['ribeye', 'đầu thăn ngoại', /rib\s?eye/gi],
  ['Outside Skirt', 'diềm thăn bò', /outside\s+skirt/gi],
  ['Top Blade', 'lõi vai bò', /top\s+blade/gi],
  ['LA Galbi', 'sườn bò cắt ngang ướp sẵn', /\bla\s+galbi\b/gi],
  ['Galbisal', 'dẻ sườn bò', /galbisal/gi],
  ['medium rare', 'tái chín (giữa còn hồng đỏ)', /medium[\s-]+rare/gi],
  ['medium well', 'chín tới (giữa còn ánh hồng)', /medium[\s-]+well/gi],
  ['well done', 'chín hẳn', /well[\s-]+done/gi],
  ['medium', 'chín vừa (giữa hồng nhạt)', /\bmedium\b/gi],
  ['rare', 'tái', /\brare\b/gi],
  ['khay Skin Pack', 'khay màng ôm sát', /khay\s+skin[\s-]*pack/gi],
  ['Skin Pack, skin-pack', 'khay màng ôm sát', /skin[\s-]*pack/gi],
  ['kimchi', 'kim chi', /kimchi/gi],
  ['set (sốt, kim chi, rau)', 'phần', /\bset\b/gi],
  ['menu', 'thực đơn', /\bmenu\b/gi],
  ['online, trên web', 'qua mạng', /\bonline\b|trên\s+web\b/gi],
  ['ship', 'giao', /\bship\b/gi],
  ['steak', 'bít tết', /\bsteak\b/gi],
  ['BBQ', 'đồ nướng', /\bbbq\b/gi],
  ['VAT', 'thuế', /\bvat\b/gi],
  ['gas', 'ga', /\bgas\b/gi],
  ['thẻ ATM', 'thẻ ngân hàng nội địa', /thẻ\s+atm/gi],
  ['link', 'đường dẫn', /\blink\b/gi],
  ['khung chat', 'khung nhắn tin', /khung\s+chat\b/gi],
  ['chat', 'nhắn tin', /\bchat\b/gi],
  ['trang web, website', 'trang', /trang\s+web(site)?\b|\bwebsite\b/gi],
  ['shop', 'quán', /\bshop\b/gi],
  ['size', 'cỡ', /\bsize\b/gi],
  ['combo', 'phần ăn', /\bcombo\b/gi],
  ['order', 'đơn', /\border\b/gi],
  ['ok, oke', 'dạ, được', /\b(ok|oke|okay)\b,?\s*/gi, ''],
];

/** Thay theo bảng từ rồi viết hoa đầu câu (lớp giữ cuối cùng). */
export function thayBangTu(t: unknown): string {
  let s = String(t ?? '');
  for (const [, noi, mau, thay] of BANG_TU) s = s.replace(mau, thay ?? noi);
  return s.replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_m, a: string, b: string) => a + b.toUpperCase());
}

/**
 * Luật riêng của Trang, cùng chạy với danh sách chữ cấm của web (timChuoiCam). Mỗi dòng kèm lý do, như chuoi-cam.js.
 */
export const CAM_TRANG: readonly { re: RegExp; vi_sao: string }[] = [
  { re: /(^|[^\p{L}])rẻ($|[^\p{L}])|hanwoo|한우/iu,
    vi_sao: 'Không dùng chữ "rẻ"; Hanwoo là giống bò quán chưa xác nhận.' },
  { re: /\d\s?(nghìn|ngàn|triệu|trăm|k|đồng|vnđ|vnd)(?![\p{L}])|\d+([.,]\d{3})+/iu,
    vi_sao: 'Số tiền trong tin: giá chỉ có trên thẻ do trang tự tính.' },
  { re: /\bem\s+(là|đúng là)\s+người(\s+thật)?(?![\p{L}])|em\s+không\s+phải\s+(là\s+)?(máy|ai|bot|trợ\s?lý)|(nhân viên|người)\s+(sẽ|đang)\s+vào\s+(chat|trả lời)|(quán|nhân viên)\s+sẽ\s+gọi\s+lại\s+ngay/iu,
    vi_sao: 'Trang không nhận là người, không hứa nhân viên vào khung chat hay gọi lại.' },
  // Khánh 18/11/2026: "xóa các thông tin cho rằng đây là trợ lý AI" trong tin — đầu khung đã có dòng "trợ lý ảo";
  // khách hỏi người hay máy thì Trang nói "em là trợ lý ảo của Beeftown". "AI" phân biệt hoa thường: "ai" là tiếng Việt.
  { re: /(^|[^\p{L}])A\.?I\.?(?![\p{L}])/u,
    vi_sao: 'Không chữ "AI" trong tin: dòng dưới tên Trang đã nói đây là trợ lý ảo; khách hỏi thì nói "trợ lý ảo".' },
  { re: /tự\s+động|trí\s+tuệ\s+nhân\s+tạo|(^|[^\p{L}])(chat\s?bot|bot|robot)(?![\p{L}])/iu,
    vi_sao: 'Không chữ "tự động", "bot", "trí tuệ nhân tạo" trong tin: khách hỏi thì nói "trợ lý ảo".' },
  { re: /(em|mình)\s+(đang|vừa|mới)\s+(đứng|ở)\s+(quầy|tủ|bếp|kho)|em\s+(vừa|mới|đã)\s+(hỏi|kiểm|xem)\s+(bếp|kho|quầy|tủ|anh|chị)|để\s+em\s+(ra|xuống|vào|chạy)\s+(kho|quầy|bếp|tủ)/iu,
    vi_sao: 'Trang không bịa việc mình không làm được (đứng quầy, hỏi bếp, kiểm kho).' },
];

/** Chữ cấm trong một tin: danh sách của web (chuoi-cam.js) cộng CAM_TRANG. Rỗng = sạch. */
export function chuCam(text: unknown): string[] {
  const s = String(text ?? '').normalize('NFC');
  const ra = timChuoiCam(s).map(x => x.vi_sao);
  for (const { re, vi_sao } of CAM_TRANG) if (re.test(s)) ra.push(vi_sao);
  return ra;
}
