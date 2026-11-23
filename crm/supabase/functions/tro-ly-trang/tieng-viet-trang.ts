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
  // Bộ chấm lần 1 (18/11/2026, câu #30, #41): "em ghi lại giúp ở phần ghi chú", "anh chờ em một chút" — Trang chỉ nhắn tin.
  // "em lưu ý anh/chị ghi giờ ở ô Ghi chú", "để em báo giá ở thẻ" là câu đúng — không bắt.
  { re: /em\s+(ghi|lưu)\s+(lại\s+(giúp|hộ)?|giúp|hộ)[^.!?\n]{0,30}ghi\s+chú|chờ\s+em\s+(một\s+)?(chút|lát|xíu|tí)(?![\p{L}])|để\s+em\s+(kiểm\s+tra|xem\s+lại)(?![\p{L}])|(để\s+)?em\s+(sẽ\s+)?(báo|nhắn|gọi)\s+(cho\s+)?(nhân viên|quán|quản lý|bếp)/iu,
    vi_sao: 'Trang chỉ nhắn tin: không nói như đang ghi chú hộ, bắt khách chờ, hay đi báo, kiểm tra, gọi cho ai.' },
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

// -----------------------------------------------------------------------------
// TIẾNG HÀN (Khánh 23/11/2026: "Làm tiếng Hàn") — khách viết tiếng Hàn, hay đang ở trang /ko/buy-meat, thì Trang trả
// lời tiếng Hàn. Cùng ba lớp giữ như tiếng Việt: lời dặn (phần TIẾNG HÀN của trang.ts), máy kiểm ở đây (viết lại một
// lần), rồi thay bảng từ / bỏ tin.
// -----------------------------------------------------------------------------
export type NgonNguTrang = 'vi' | 'ko';

/** Chữ Hàn: âm tiết ghép, chữ cái rời (jamo), chữ cái tương thích. */
const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힯]/;

/** Đoạn chữ có chữ Hàn không. */
export function coChuHan(text: unknown): boolean {
  return HANGUL.test(String(text ?? ''));
}

/**
 * Ngôn ngữ Trang trả lời lượt này: tin khách có chữ Hàn → tiếng Hàn; có dấu tiếng Việt → tiếng Việt; không có cả hai
 * ("ok", "4", "ribeye", tiếng Việt không dấu) → theo macDinh — ngôn ngữ Trang đang nói trong cuộc chat, chưa nói gì thì
 * ngôn ngữ của trang đang mở.
 */
export function ngonNguTraLoi(tin: unknown, macDinh: NgonNguTrang): NgonNguTrang {
  const s = String(tin ?? '').normalize('NFC');
  if (HANGUL.test(s)) return 'ko';
  if (DAU_VIET.test(s.toLowerCase())) return 'vi';
  return macDinh;
}

/** Chữ La-tinh được giữ trong câu tiếng Hàn (viết thường): tên riêng, đơn vị, "LA" của LA갈비, địa chỉ quán. */
export const GIU_NGUYEN_HAN: readonly string[] = [
  'beeftown', 'trang', 'vnpay', 'zalo', 'ahamove', 'facebook', 'qr', 'g', 'kg', 'la', 'chimichurri',
  'tp', 'hcm', 'hồ', 'tùng', 'mậu',
];

/** Đánh dấu trong danh sách chữ lạ: câu không có chữ Hàn nào (Claude trả tiếng Việt hay tiếng Anh). */
export const KHONG_CO_CHU_HAN = '(không có chữ Hàn)';

/**
 * Chữ không hợp trong một câu tiếng Hàn (viết thường, không lặp). Rỗng = sạch. Mọi đoạn chữ La-tinh (kể cả chữ Việt:
 * "đầu thăn ngoại", "ạ") phải nằm trong GIU_NGUYEN_HAN — "LA갈비", "150 g", "Beeftown" qua; "ribeye", "AI", "ok" bị bắt.
 * Câu không có chữ Hàn nào thì thêm KHONG_CO_CHU_HAN.
 */
export function chuNgoaiHan(text: unknown): string[] {
  const s = String(text ?? '').normalize('NFC');
  const ra: string[] = [];
  for (const w of s.toLowerCase().match(/\p{Script=Latin}+/gu) ?? []) {
    if (!GIU_NGUYEN_HAN.includes(w) && !ra.includes(w)) ra.push(w);
  }
  if (s.trim() && !HANGUL.test(s)) ra.push(KHONG_CO_CHU_HAN);
  return ra;
}

/** Bảng từ tiếng Hàn của lớp giữ cuối: chữ tiếng Anh lọt vào câu tiếng Hàn → tên trang tiếng Hàn ghi. Cụm dài trước. */
export const BANG_TU_HAN: readonly (readonly [RegExp, string])[] = [
  [/rib\s?eye\s+with\s+cap/gi, '립아이 캡'],
  [/outside\s+skirt/gi, '안창살'],
  [/top\s+blade/gi, '부채살'],
  [/\bla\s+galbi\b/gi, 'LA갈비'],
  [/galbisal/gi, '갈비살'],
  [/rib\s?eye/gi, '꽃등심'],
  [/medium[\s-]+rare/gi, '미디엄 레어'],
  [/medium[\s-]+well/gi, '미디엄 웰던'],
  [/well[\s-]+done/gi, '웰던'],
  [/\bmedium\b/gi, '미디엄'],
  [/\brare\b/gi, '레어'],
  [/skin[\s-]*pack/gi, '스킨팩'],
  [/kimchi/gi, '김치'],
  [/\b(ok|oke|okay)\b,?\s*/gi, ''],
];

/** Thay theo bảng từ tiếng Hàn (lớp giữ cuối của câu tiếng Hàn). */
export function thayBangTuHan(t: unknown): string {
  let s = String(t ?? '');
  for (const [mau, thay] of BANG_TU_HAN) s = s.replace(mau, thay);
  return s.replace(/\s{2,}/g, ' ').trim();
}

/** Luật riêng của câu tiếng Hàn — cùng ý với CAM_TRANG, viết theo tiếng Hàn. Mỗi dòng kèm lý do. */
export const CAM_TRANG_HAN: readonly { re: RegExp; vi_sao: string }[] = [
  { re: /\d\s?(원|동)(?![\p{L}])|\d\s?(천|만)\s?(원|동)|\d+([.,]\d{3})+/u,
    vi_sao: 'Số tiền trong tin (tiếng Hàn): giá chỉ có trên thẻ do trang tự tính.' },
  { re: /저렴|값싼|싸요|싸게/u,
    vi_sao: 'Không nói "rẻ" (저렴, 싸요): chỉ nói phần nào giá gói thấp hơn.' },
  { re: /인공지능|챗봇|로봇|(^|[^\p{L}])봇(?![\p{L}])|자동\s?(응답|답변|상담)/u,
    vi_sao: 'Không chữ AI, bot, tự động trong tin (tiếng Hàn): khách hỏi thì nói "가상 도우미".' },
  { re: /(저는|전|제가)\s*(진짜\s*|실제\s*)?(사람|직원)(이에요|입니다|이야|예요)|사람\s*맞아요|(직원|매장|사장님?)(이|가|께서)?\s*(곧|바로|금방)\s*(들어|연락|전화)/u,
    vi_sao: 'Trang không nhận là người, không hứa nhân viên vào chat hay gọi lại (tiếng Hàn).' },
  // "직원에게 여쭤봐 주시면" (khách tự hỏi nhân viên) là câu đúng — chỉ bắt câu Trang tự đi hỏi: "물어보고", "확인해 드릴게요".
  { re: /(잠시만|잠깐만?)\s*(기다려|기다리)|(확인|체크)해\s*(볼게요|드릴게요|보겠습니다)|(직원|매장|주방|사장님?)(에게|께|한테)\s*(물어|여쭤|확인해|전달해)\s?(보고|볼게요|봐\s?드릴게요|드릴게요)/u,
    vi_sao: 'Trang chỉ nhắn tin: không bắt khách chờ, không nói đi kiểm tra hay đi hỏi ai (tiếng Hàn).' },
];

/** Chữ cấm trong một câu tiếng Hàn: danh sách của web (đã có mẫu tiếng Hàn), CAM_TRANG (chữ AI, Hanwoo), CAM_TRANG_HAN. */
export function chuCamHan(text: unknown): string[] {
  const s = String(text ?? '').normalize('NFC');
  const ra = chuCam(s);
  for (const { re, vi_sao } of CAM_TRANG_HAN) if (re.test(s)) ra.push(vi_sao);
  return ra;
}
