/**
 * BOT MESSENGER ĐẶT BÀN — phần THUẦN (0052, 0053)
 * ===============================================
 *
 * Không gọi mạng, không đọc bí mật, không đọc đồng hồ: mọi thứ vào qua tham số.
 * lib/messenger-hook.ts lo phần I/O (webhook Meta, database, Send API) và gọi
 * các hàm ở đây.
 *
 *   · kiemChuKy        X-Hub-Signature-256 = HMAC-SHA256(body THÔ, META_APP_SECRET)
 *   · xacMinhWebhook   GET hub.mode=subscribe & hub.verify_token → hub.challenge
 *   · tachSuKien       JSON webhook → tin chữ / quick reply / postback / echo
 *   · bamPsid          PSID → HMAC-SHA256(PSID, MESS_KHOA_BAM) 64 hex — database
 *                      chỉ thấy chuỗi băm này, không bao giờ PSID thô
 *   · buocTiep         MÁY TRẠNG THÁI hội thoại: (phiên, sự kiện, ngữ cảnh) →
 *                      tin trả lời + phiên mới + việc cần làm (gọi database) +
 *                      sự kiện cần đếm. Việc cần làm chạy xong thì hook đưa kết
 *                      quả vào lại buocTiep dưới dạng sự kiện 'ket_qua'.
 *   · thanTin / thanDangGo / thanHoSo   dựng body Send API / Messenger Profile
 *   · hieuNgay / hieuGio / chuanHoaSdt  hiểu chữ khách gõ
 *   · xoaBiMat         làm sạch câu log: token, SĐT, PSID, chuỗi băm
 *
 * LỜI BOT NÓI tuân theo trang đặt bàn (lib/dat-ban.ts, TrangDatBan.astro):
 * "Beeftown đã nhận yêu cầu", không bao giờ "đặt bàn thành công" — yêu cầu chỉ
 * có hiệu lực khi nhân viên gọi xác nhận. Không nói số bàn còn trống, không giá.
 */

import { homNayVn, gioVnTuMs, congNgay as congNgayVn } from './gio-vn.ts';

// =============================================================================
// CHỈNH KHI CÓ TÀI LIỆU — mọi chi tiết API của Meta nằm ở đúng một chỗ này.
// Lúc viết (27/09/2026) proxy chặn developers.facebook.com, nên các giá trị dưới
// đây theo chuẩn Messenger Platform đã biết (Graph API, Send API, Messenger
// Profile API, webhook "page"). Phiên bản Graph ghi rõ; đổi phiên bản = sửa
// một dòng, chạy lại node crm/test/test-messenger-web.mjs.
// =============================================================================
const PHIEN_BAN_GRAPH = 'v21.0';

export const META_API = {
  /** Phiên bản Graph API. */
  phienBan: PHIEN_BAN_GRAPH,
  /** Send API: POST, JSON, Page Access Token ở tham số truy vấn access_token. */
  urlGuiTin: `https://graph.facebook.com/${PHIEN_BAN_GRAPH}/me/messages`,
  /** Messenger Profile API: nút Bắt đầu, lời chào, menu cố định. */
  urlHoSo: `https://graph.facebook.com/${PHIEN_BAN_GRAPH}/me/messenger_profile`,
  /** Tên tham số truy vấn mang token. */
  thamSoToken: 'access_token',
  /** Header chữ ký webhook (Headers của fetch đọc không phân biệt hoa thường). */
  headerChuKy: 'x-hub-signature-256',
  tienToChuKy: 'sha256=',
  /** Trả lời trong 24 giờ sau tin của khách. */
  messagingType: 'RESPONSE',
  /** Quick reply xin số điện thoại khách đã lưu trong Facebook. */
  loaiNutSdt: 'user_phone_number',
  /** Chỉ báo "đang gõ". */
  dangGo: 'typing_on',
  /**
   * Gắn vào mọi tin bot gửi (message.metadata). Meta gửi lại nguyên chuỗi này
   * trong echo — nhờ đó phân biệt echo của bot với tin nhân viên gõ trên Trang
   * mà không cần biết App ID (META_APP_ID vẫn dùng được nếu cài).
   */
  metadataBot: 'beeftown_bot',
  /** Trường webhook phải đăng ký trong App Meta. */
  truongDangKy: ['messages', 'messaging_postbacks', 'message_echoes'],
  gioiHan: {
    nutNhanh: 13,        // quick replies mỗi tin
    tieuDeNutNhanh: 20,  // ký tự tiêu đề quick reply
    chu: 640,            // ký tự một tin chữ / chữ của button template
    nut: 3,              // nút của button template
    tieuDeNut: 20,       // ký tự tiêu đề nút
    payload: 1000,       // ký tự payload
    loiChao: 160,        // ký tự lời chào (greeting) của Messenger Profile
    menu: 20,            // mục menu cố định (persistent_menu)
    tieuDeMenu: 30,      // ký tự tiêu đề mục menu cố định
  },
  /** Body webhook tối đa (byte) — quá thì 413. */
  bodyToiDa: 256 * 1024,
  /** Số sự kiện tối đa xử lý trong một lần Meta gọi. */
  suKienToiDa: 20,
} as const;

// =============================================================================
// CÁC GIỚI HẠN CỦA NHÀ HÀNG (giống trang đặt bàn)
// =============================================================================
export const KHACH_TOI_DA = 8;
export const NGAY_TOI_DA = 60;
/** Số lần gửi yêu cầu đặt bàn tối đa mỗi khách (PSID) mỗi ngày giờ VN — như mess_xin_dat_ban (0053). */
export const DAT_BAN_TOI_DA_NGAY = 5;
/** Phiên đang làm dở mà khách im quá lâu → coi như bắt đầu lại từ menu. */
export const PHIEN_CU_MS = 12 * 60 * 60 * 1000;

export type LoaiDem =
  | 'dat_ban' | 'dat_ban_that_bai' | 'huy_dat_ban' | 'hoi_dap' | 'gap_nhan_vien' | 'nhan_vien_tra_loi' | 'loi';

// =============================================================================
// CHỮ KÝ, XÁC MINH, BĂM
// =============================================================================
const enc = new TextEncoder();

function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacHex(khoa: string, du: Uint8Array | string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(khoa), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const byte = typeof du === 'string' ? enc.encode(du) : du;
  return hex(await crypto.subtle.sign('HMAC', k, byte as Uint8Array<ArrayBuffer>));
}

/** So sánh hai chuỗi trong thời gian không phụ thuộc chỗ khác nhau đầu tiên. */
export function bangNhauHang(a: string, b: string): boolean {
  const x = enc.encode(String(a ?? ''));
  const y = enc.encode(String(b ?? ''));
  const n = Math.max(x.length, y.length);
  let khac = x.length ^ y.length;
  for (let i = 0; i < n; i++) khac |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return khac === 0;
}

/**
 * Kiểm header X-Hub-Signature-256 ("sha256=<hex>") trên body THÔ (đúng từng
 * byte Meta gửi — không parse rồi dựng lại). Thiếu / sai dạng / sai → false.
 */
export async function kiemChuKy(bodyTho: Uint8Array | string, header: string | null | undefined, appSecret: string): Promise<boolean> {
  if (!header || !appSecret) return false;
  const h = header.trim();
  if (!h.toLowerCase().startsWith(META_API.tienToChuKy)) return false;
  const nhan = h.slice(META_API.tienToChuKy.length).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(nhan)) return false;
  const tinh = await hmacHex(appSecret, bodyTho);
  return bangNhauHang(nhan, tinh);
}

/** GET xác minh webhook: đúng → trả hub.challenge, sai → null. */
export function xacMinhWebhook(url: URL, verifyToken: string): string | null {
  const q = url.searchParams;
  const challenge = q.get('hub.challenge') ?? '';
  if (q.get('hub.mode') !== 'subscribe' || !verifyToken) return null;
  if (!bangNhauHang(q.get('hub.verify_token') ?? '', verifyToken)) return null;
  if (!challenge || challenge.length > 256) return null;
  return challenge;
}

/** PSID → HMAC-SHA256(PSID, MESS_KHOA_BAM), 64 hex thường (khóa phiên trong database). */
export async function bamPsid(psid: string, khoaBam: string): Promise<string> {
  return hmacHex(khoaBam, String(psid));
}

// =============================================================================
// SỰ KIỆN WEBHOOK
// =============================================================================
export type SuKien =
  /** Khách gõ chữ (kể cả số điện thoại chọn từ nút user_phone_number). */
  | { loai: 'tin'; psid: string; chu: string }
  /** Khách bấm quick reply của bot. */
  | { loai: 'nut'; psid: string; payload: string }
  /** Khách bấm nút (button template, menu cố định, Bắt đầu). */
  | { loai: 'postback'; psid: string; payload: string }
  /** Tin do Trang gửi đi (bot hoặc nhân viên). psid = người nhận. */
  | { loai: 'echo'; psid: string; appId: string | null; metadata: string | null }
  /** Khách gửi ảnh, sticker, vị trí… */
  | { loai: 'khac'; psid: string };

export type SuKienKhach = Exclude<SuKien, { loai: 'echo' }>;

const laChuoi = (x: unknown): x is string => typeof x === 'string';
const laDoiTuong = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

/** Payload do bot đặt luôn bắt đầu bằng "BT_". Khác thế (vd. số điện thoại từ nút user_phone_number) là chữ khách gửi. */
export const TIEN_TO_PAYLOAD = 'BT_';

/**
 * Đọc JSON webhook "page". Bỏ qua sự kiện không hiểu (đã đọc, đã giao…).
 * Không bao giờ ném lỗi.
 */
export function tachSuKien(json: unknown): SuKien[] {
  const ra: SuKien[] = [];
  if (!laDoiTuong(json) || json.object !== 'page' || !Array.isArray(json.entry)) return ra;
  for (const e of json.entry) {
    if (!laDoiTuong(e) || !Array.isArray(e.messaging)) continue;
    for (const m of e.messaging) {
      if (ra.length >= META_API.suKienToiDa) return ra;
      if (!laDoiTuong(m)) continue;
      const sender = laDoiTuong(m.sender) && laChuoi(m.sender.id) ? m.sender.id : null;
      const recipient = laDoiTuong(m.recipient) && laChuoi(m.recipient.id) ? m.recipient.id : null;
      const msg = laDoiTuong(m.message) ? m.message : null;
      if (msg && msg.is_echo === true) {
        if (!recipient) continue;
        const appId = msg.app_id === undefined || msg.app_id === null ? null : String(msg.app_id);
        ra.push({ loai: 'echo', psid: recipient, appId, metadata: laChuoi(msg.metadata) ? msg.metadata : null });
        continue;
      }
      if (!sender) continue;
      if (msg) {
        const qr = laDoiTuong(msg.quick_reply) && laChuoi(msg.quick_reply.payload) ? msg.quick_reply.payload : null;
        if (qr && qr.startsWith(TIEN_TO_PAYLOAD)) ra.push({ loai: 'nut', psid: sender, payload: qr });
        else if (laChuoi(msg.text) && msg.text.trim()) ra.push({ loai: 'tin', psid: sender, chu: msg.text.slice(0, 2000) });
        else if (qr) ra.push({ loai: 'tin', psid: sender, chu: qr.slice(0, 2000) });
        else ra.push({ loai: 'khac', psid: sender });
        continue;
      }
      if (laDoiTuong(m.postback) && laChuoi(m.postback.payload)) {
        ra.push({ loai: 'postback', psid: sender, payload: m.postback.payload.slice(0, META_API.gioiHan.payload) });
      }
    }
  }
  return ra;
}

// =============================================================================
// LÀM SẠCH CÂU LOG
// =============================================================================
/**
 * Xóa khỏi câu: bí mật truyền vào, token ("access_token=…", "EAA…"), chuỗi 64
 * hex (PSID đã băm), dãy số dài ≥ 9 chữ số kể cả có dấu cách / chấm / gạch
 * (số điện thoại, PSID thô).
 */
export function xoaBiMat(cau: unknown, ...biMat: Array<string | null | undefined>): string {
  let s = String(cau ?? '');
  for (const b of biMat) {
    if (!b || b.length < 4) continue;
    for (const t of new Set([b, encodeURIComponent(b)])) s = s.split(t).join('***');
  }
  s = s.replace(/(access_token|token|appsecret_proof|verify_token)(["']?\s*[=:]\s*["']?)[^&\s"',;}]+/gi, '$1$2***');
  s = s.replace(/\bEAA[A-Za-z0-9]{10,}/g, '***');
  s = s.replace(/\b[0-9a-f]{64}\b/gi, '***');
  s = s.replace(/\+?\d[\d .\-]{7,}\d/g, m => (m.replace(/\D/g, '').length >= 9 ? '***' : m));
  return s;
}

// =============================================================================
// CHỮ KHÁCH GÕ
// =============================================================================
/** Bỏ dấu, chữ thường, gọn khoảng trắng: "Bắt đầu  lại!" → "bat dau lai!" */
export function boDau(s: string): string {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Như chuan_hoa_sdt() (0001): +84 / 84 / dấu cách → 0xxxxxxxxx. Trả chuỗi đã chuẩn hóa (chưa kiểm hợp lệ). */
export function chuanHoaSdt(raw: unknown): string {
  let s = String(raw ?? '').replace(/[^0-9]/g, '');
  if (s.startsWith('84') && s.length >= 11 && s.length <= 12) s = '0' + s.slice(2);
  if (s.length === 9 && !s.startsWith('0')) s = '0' + s;
  return s;
}

/** Số di động / cố định Việt Nam 10 số sau chuẩn hóa (giống sdt_hop_le). Sai → null. */
export function sdtHopLe(raw: unknown): string | null {
  const s = chuanHoaSdt(raw);
  return /^0\d{9}$/.test(s) ? s : null;
}

/** "0912345678" → "09****5678" (như tra_cuu_dat_ban). */
export function cheSdt(sdt: string): string {
  return sdt.length >= 7 ? sdt.slice(0, 2) + '*'.repeat(sdt.length - 6) + sdt.slice(-4) : '***';
}

// --- Ngày (tính ở gio-vn.ts — một chỗ duy nhất cho giờ Việt Nam) ---------------

/** Ngày hôm nay giờ Việt Nam (UTC+7) từ mốc ms. */
export function ngayVn(ms: number): string {
  return homNayVn(ms);
}

/** Giờ:phút hiện tại giờ Việt Nam. */
export function gioVnHienTai(ms: number): string {
  return gioVnTuMs(ms).slice(11, 16);
}

export const congNgay = congNgayVn;

function thuCua(iso: string): number {
  return new Date(iso + 'T00:00:00Z').getUTCDay();
}

const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** "2026-10-03" → "Thứ Bảy, 03/10/2026" */
export function ngayDep(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${THU[thuCua(iso)]}, ${d}/${m}/${y}`;
}

/** "2026-10-03" → "3/10" */
function ngayNgan(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${Number(d)}/${Number(m)}`;
}

function ngayHopLe(y: number, m: number, d: number): string | null {
  if (!(y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

export type KetQuaNgay =
  | { ok: true; ngay: string }
  | { ok: false; lyDo: 'khong_hieu' | 'sai' | 'qua' | 'xa'; ngay?: string };

const TU_THU: Record<string, number> = {
  'chu nhat': 0, 'cn': 0,
  'thu hai': 1, 'thu 2': 1, 't2': 1,
  'thu ba': 2, 'thu 3': 2, 't3': 2,
  'thu tu': 3, 'thu 4': 3, 't4': 3,
  'thu nam': 4, 'thu 5': 4, 't5': 4,
  'thu sau': 5, 'thu 6': 5, 't6': 5,
  'thu bay': 6, 'thu 7': 6, 't7': 6,
};

/**
 * Hiểu ngày khách gõ: "hôm nay", "mai", "mốt" / "ngày kia", "thứ bảy" / "t7",
 * "chủ nhật" / "cn", "28/9", "28-9", "28/09/2026", "28/9/26", "2026-09-28".
 * Ngày không có năm mà đã qua trong năm nay → năm sau, nếu vẫn trong 60 ngày
 * tới; không thì là "đã qua". Kiểm luôn: không quá khứ, không xa hơn 60 ngày.
 */
export function hieuNgay(chu: string, homNay: string): KetQuaNgay {
  const s = boDau(chu).replace(/^(ngay|dat|vao|cho)\s+/, '').replace(/[.!?,]+$/, '').trim();
  let ngay: string | null = null;

  if (/^(hom nay|nay|today)$/.test(s)) ngay = homNay;
  else if (/^(mai|ngay mai|tomorrow)$/.test(s)) ngay = congNgay(homNay, 1);
  else if (/^(mot|ngay mot|ngay kia|kia)$/.test(s)) ngay = congNgay(homNay, 2);
  else if (s.replace(/^(vao |ngay )/, '') in TU_THU) {
    const t = TU_THU[s.replace(/^(vao |ngay )/, '')];
    const cach = (t - thuCua(homNay) + 7) % 7;
    ngay = congNgay(homNay, cach);
  } else {
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) {
      ngay = ngayHopLe(+m[1], +m[2], +m[3]);
      if (!ngay) return { ok: false, lyDo: 'sai' };
    } else {
      m = s.match(/^(\d{1,2})\s*[/.\-]\s*(\d{1,2})(?:\s*[/.\-]\s*(\d{2}|\d{4}))?$/)
        ?? s.match(/^(\d{1,2})\s*thang\s*(\d{1,2})(?:\s*(?:nam)?\s*(\d{4}))?$/);
      if (!m) return { ok: false, lyDo: 'khong_hieu' };
      const d = +m[1], th = +m[2];
      const namNay = +homNay.slice(0, 4);
      if (m[3]) {
        const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
        ngay = ngayHopLe(y, th, d);
        if (!ngay) return { ok: false, lyDo: 'sai' };
      } else {
        ngay = ngayHopLe(namNay, th, d);
        if (!ngay) return { ok: false, lyDo: 'sai' };
        if (ngay < homNay) {
          const sau = ngayHopLe(namNay + 1, th, d);
          if (sau && sau <= congNgay(homNay, NGAY_TOI_DA)) ngay = sau;
        }
      }
    }
  }
  if (!ngay) return { ok: false, lyDo: 'khong_hieu' };
  if (ngay < homNay) return { ok: false, lyDo: 'qua', ngay };
  if (ngay > congNgay(homNay, NGAY_TOI_DA)) return { ok: false, lyDo: 'xa', ngay };
  return { ok: true, ngay };
}

/**
 * Hiểu giờ khách gõ: "19:00", "19h", "19h30", "19g30", "19 giờ 30", "7h tối",
 * "7pm", "12h trưa", "19". Trả "HH:MM" hoặc null.
 */
export function hieuGio(chu: string): string | null {
  const s = boDau(chu).replace(/^(luc|vao luc|vao)\s+/, '').replace(/[.!?,]+$/, '').trim();
  const m = s.match(/^(\d{1,2})\s*(?:(?:[:hg]|gio)\s*(\d{1,2})?\s*(?:phut|p)?)?\s*(sang|trua|chieu|toi|dem|am|pm)?$/);
  if (!m) return null;
  let h = +m[1];
  const p = m[2] ? +m[2] : 0;
  const buoi = m[3];
  if (p > 59 || h > 23) return null;
  if ((buoi === 'chieu' || buoi === 'toi' || buoi === 'dem' || buoi === 'pm') && h < 12) h += 12;
  else if (buoi === 'trua' && h <= 5) h += 12;
  else if (buoi === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(p).padStart(2, '0')}`;
}

/** "Nguyễn   Văn An " → "Nguyễn Văn An"; không giống tên → null. */
export function hieuTen(chu: string): string | null {
  const s = String(chu ?? '').replace(/\s+/g, ' ').trim();
  if (s.length < 2 || s.length > 60) return null;
  if (!/\p{L}/u.test(s)) return null;
  if ((s.match(/\d/g) ?? []).length >= 3) return null;
  if (/[<>{}\[\]\\/@#$%^*=_|~`]/.test(s)) return null;
  return s;
}

/** Số khách gõ tay: "4", "4 người", "bốn"… → số, hoặc null. */
export function hieuSoKhach(chu: string): number | null {
  const s = boDau(chu);
  const m = s.match(/^(\d{1,3})\s*(nguoi|khach|ng|pax)?$/);
  if (m) return +m[1];
  const CHU: Record<string, number> = {
    'mot': 1, 'hai': 2, 'ba': 3, 'bon': 4, 'nam': 5, 'sau': 6, 'bay': 7, 'tam': 8, 'chin': 9, 'muoi': 10,
  };
  const c = s.match(/^([a-z]+)\s*(nguoi|khach)?$/);
  return c && c[1] in CHU ? CHU[c[1]] : null;
}

// =============================================================================
// TIN BOT GỬI
// =============================================================================
export type NutNhanh = { tieuDe: string; payload: string } | { sdt: true };
export type Nut =
  | { loai: 'postback'; tieuDe: string; payload: string }
  | { loai: 'web'; tieuDe: string; url: string }
  | { loai: 'goi'; tieuDe: string; sdt: string };

export interface Tin {
  chu: string;
  nutNhanh?: NutNhanh[];
  /** Có nút → button template (tối đa 3 nút). */
  nut?: Nut[];
}

/** Cắt theo ký tự (không cắt đôi chữ có dấu), thêm "…" khi phải cắt. */
export function catChu(s: string, toiDa: number): string {
  const kt = [...String(s ?? '')];
  return kt.length <= toiDa ? kt.join('') : kt.slice(0, toiDa - 1).join('') + '…';
}

/** "0912345678" → "+84912345678" cho nút gọi điện. */
function sdtQuocTe(sdt: string): string | null {
  const s = sdtHopLe(sdt);
  return s ? '+84' + s.slice(1) : null;
}

/** Body Send API cho một tin — luôn trong giới hạn của META_API.gioiHan. */
export function thanTin(psid: string, tin: Tin): Record<string, unknown> {
  const G = META_API.gioiHan;
  const message: Record<string, unknown> = {};
  const nut = (tin.nut ?? []).slice(0, G.nut).map(n =>
    n.loai === 'postback' ? { type: 'postback', title: catChu(n.tieuDe, G.tieuDeNut), payload: n.payload.slice(0, G.payload) }
    : n.loai === 'web' ? { type: 'web_url', title: catChu(n.tieuDe, G.tieuDeNut), url: n.url }
    : { type: 'phone_number', title: catChu(n.tieuDe, G.tieuDeNut), payload: n.sdt });
  if (nut.length) {
    message.attachment = { type: 'template', payload: { template_type: 'button', text: catChu(tin.chu, G.chu), buttons: nut } };
  } else {
    message.text = catChu(tin.chu, G.chu);
  }
  const qr = (tin.nutNhanh ?? []).slice(0, G.nutNhanh).map(n =>
    'sdt' in n ? { content_type: META_API.loaiNutSdt }
    : { content_type: 'text', title: catChu(n.tieuDe, G.tieuDeNutNhanh), payload: n.payload.slice(0, G.payload) });
  if (qr.length) message.quick_replies = qr;
  message.metadata = META_API.metadataBot;
  return { recipient: { id: psid }, messaging_type: META_API.messagingType, message };
}

/** Body Send API cho chỉ báo "đang gõ". */
export function thanDangGo(psid: string): Record<string, unknown> {
  return { recipient: { id: psid }, sender_action: META_API.dangGo };
}

export interface YeuCauMeta { url: string; init: { method: 'POST'; headers: Record<string, string>; body: string } }

/** Yêu cầu POST tới Graph API; token chỉ nằm ở tham số truy vấn (không bao giờ vào log — xoaBiMat). */
export function dungYeuCauMeta(url: string, token: string, body: unknown): YeuCauMeta {
  return {
    url: `${url}?${META_API.thamSoToken}=${encodeURIComponent(token)}`,
    init: { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
  };
}

// =============================================================================
// PAYLOAD VÀ MENU
// =============================================================================
export const PAYLOAD = {
  batDau: 'BT_BAT_DAU',
  menu: 'BT_MENU',
  datBan: 'BT_DAT_BAN',
  traCuu: 'BT_TRA_CUU',
  gioMo: 'BT_GIO_MO',
  thucDon: 'BT_THUC_DON',
  nhanVien: 'BT_NHAN_VIEN',
  huyThaoTac: 'BT_HUY',
  ngay: 'BT_NGAY:',
  buoi: 'BT_BUOI:',
  gio: 'BT_GIO:',
  khach: 'BT_KHACH:',
  doiNgay: 'BT_DOI_NGAY',
  xacNhan: 'BT_XAC_NHAN',
  sua: 'BT_SUA',
  suaMuc: 'BT_SUA:',
  huyDatBan: 'BT_HUY_DAT_BAN',
  huyCo: 'BT_HUY_CO',
  huyKhong: 'BT_HUY_KHONG',
  traLai: 'BT_TRA_LAI',
} as const;

/** Menu chính — cũng là menu cố định cài bằng Messenger Profile API. */
export const MENU_CHINH: ReadonlyArray<{ tieuDe: string; payload: string }> = [
  { tieuDe: 'Đặt bàn', payload: PAYLOAD.datBan },
  { tieuDe: 'Tra/hủy đặt bàn', payload: PAYLOAD.traCuu },
  { tieuDe: 'Giờ mở cửa & địa chỉ', payload: PAYLOAD.gioMo },
  { tieuDe: 'Thực đơn', payload: PAYLOAD.thucDon },
  { tieuDe: 'Gặp nhân viên', payload: PAYLOAD.nhanVien },
];

/** Body Messenger Profile API: nút Bắt đầu, lời chào (≤ 160 ký tự), menu cố định. */
export function thanHoSo(loiChao: string): Record<string, unknown> {
  const G = META_API.gioiHan;
  return {
    get_started: { payload: PAYLOAD.batDau },
    greeting: [{ locale: 'default', text: catChu(String(loiChao ?? '').trim() || 'Beeftown', G.loiChao) }],
    persistent_menu: [{
      locale: 'default',
      composer_input_disabled: false,
      call_to_actions: MENU_CHINH.slice(0, G.menu).map(m => ({ type: 'postback', title: catChu(m.tieuDe, G.tieuDeMenu), payload: m.payload })),
    }],
  };
}

// =============================================================================
// MÁY TRẠNG THÁI HỘI THOẠI
// =============================================================================
/** Khung giờ như lich_trong_theo_ma trả về. */
export interface KhungGio { gio: string; buoi: 'trua' | 'toi' | string; con_cho: boolean; da_qua: boolean }

/** Một dòng tra_cuu_dat_ban (đã che tên / SĐT). */
export interface DongTraCuu {
  ma_dat_ban: string; chi_nhanh_ten?: string | null; ngay: string; gio: string; so_khach: number;
  trang_thai: string; ho_ten_che?: string | null; sdt_che?: string | null;
}

/** Thông tin công khai cho câu hỏi thường gặp (noi_dung_cong_khai + chi_nhanh_cong_khai). */
export interface ThongTinCongKhai {
  formMo: boolean;
  hienThucDon: boolean;
  diaChi: string | null;
  hotline: string | null;
  mapsUrl: string | null;
  tenChiNhanh: string | null;
  /** null khi giờ phục vụ chưa công bố. */
  gio: { trua: [string, string] | null; toi: [string, string] | null } | null;
}

/** Dữ liệu bot đang hỏi dở — lưu vào mess_phien.du_lieu (≤ 4000 byte). */
export interface DuLieu {
  ngay?: string;
  gio?: string;
  /** Khung còn nhận của `ngay` (chỉ con_cho && !da_qua), "HH:MM". */
  khung?: { ngay: string; trua: string[]; toi: string[] };
  buoi?: 'trua' | 'toi';
  so_khach?: number;
  ho_ten?: string;
  sdt?: string;
  /** Tra / hủy: mã đặt bàn và SĐT khách gõ, ngày giờ của đặt bàn tìm được. */
  ma?: string;
  tra_ngay?: string;
  tra_gio?: string;
}

export interface PhienBot { buoc: string; duLieu: DuLieu }

export interface NguCanh {
  /** Mốc hiện tại (ms). */
  bayGio: number;
  loiChao: string;
  phutTamDung: number;
  /** Tra cứu đang bị khóa (mess_lay_phien.phien.bi_khoa). */
  biKhoa: boolean;
  /** Lần cuối phiên được cập nhật (ISO) — cũ quá PHIEN_CU_MS thì về menu. */
  capNhat?: string | null;
  /** Gốc website, vd. https://beeftown.vn */
  web: string;
}

export type YeuCauGoi =
  | { goi: 'lich_trong'; ngay: string }
  | { goi: 'tao_dat_ban'; ngay: string; gio: string; soKhach: number; hoTen: string; sdt: string }
  | { goi: 'tra_cuu'; ma: string; sdt: string }
  | { goi: 'huy'; ma: string; sdt: string }
  | { goi: 'thong_tin'; muc: 'gio_mo' | 'thuc_don' | 'dat_ban' | 'khoa' };

export type KetQuaGoi =
  | { goi: 'lich_trong'; ok: true; khung: KhungGio[] }
  | { goi: 'tao_dat_ban'; ok: true; ma: string }
  /**
   * loi = câu database (tiếng Việt); khongChac = đứt giữa chừng, không biết đã ghi chưa;
   * gioiHan = hook chưa gọi tao_dat_ban vì mess_xin_dat_ban từ chối: 'dang_gui' (vừa có
   * một lần gửi cho khách này — sự kiện lặp / bấm hai lần), 'qua_luot' (hết lượt trong ngày).
   */
  | { goi: 'tao_dat_ban'; ok: false; loi?: string; khongChac?: boolean; gioiHan?: 'dang_gui' | 'qua_luot' }
  | { goi: 'tra_cuu'; ok: true; dong: DongTraCuu | null; biKhoa: boolean }
  | { goi: 'huy'; ok: true; daHuy: boolean; biKhoa: boolean }
  | { goi: 'huy'; ok: false; loi?: string }
  | { goi: 'thong_tin'; ok: true; muc: 'gio_mo' | 'thuc_don' | 'dat_ban' | 'khoa'; tt: ThongTinCongKhai }
  | { goi: 'lich_trong' | 'tra_cuu' | 'thong_tin'; ok: false; muc?: string };

export type DauVao = SuKienKhach | { loai: 'ket_qua'; kq: KetQuaGoi };

export interface KetQuaBuoc {
  tin: Tin[];
  phien: PhienBot;
  /** Việc cần hook làm; xong thì đưa kết quả vào lại buocTiep. */
  goi?: YeuCauGoi;
  /** Khách cần người thật: hook tạm dừng bot phut_tam_dung phút cho PSID này. */
  tamDung?: boolean;
  /** Không lưu phiên lượt này (một lần gửi khác của cùng khách đang chạy — để nó lưu). */
  khongLuu?: boolean;
  dem: LoaiDem[];
}

// --- Câu chữ -----------------------------------------------------------------
export const CAU_BOT = {
  hoiMenu: 'Bạn cần Beeftown giúp gì? Chọn một mục bên dưới nhé.',
  troGiup: 'Mình là trợ lý tự động của Beeftown: đặt bàn, tra/hủy đặt bàn, giờ mở cửa và địa chỉ, thực đơn. '
    + 'Bạn chọn một mục bên dưới, hoặc chọn "Gặp nhân viên" để nói chuyện với người thật.',
  daDung: 'Đã dừng việc đang làm.',
  chiDocChu: 'Mình chỉ đọc được tin chữ.',
  nutCu: 'Nút này thuộc bước trước nên không dùng được nữa.',
  chonNut: 'Bạn chọn một nút bên dưới giúp mình nhé.',
  // Đặt bàn
  chuaMoDatBan: 'Beeftown chưa mở đặt bàn qua tin nhắn. Bạn chọn "Gặp nhân viên" để nhân viên giữ chỗ giúp bạn.',
  hoiNgay: `Bạn muốn đặt bàn ngày nào? Chọn nút bên dưới hoặc gõ ngày (vd: 28/9, mai, thứ bảy). Beeftown nhận đặt bàn trong ${NGAY_TOI_DA} ngày tới.`,
  ngayKhongHieu: 'Mình chưa hiểu ngày bạn gõ. Bạn gõ kiểu 28/9, mai, thứ bảy — hoặc chọn nút bên dưới.',
  ngaySai: 'Ngày này không có trên lịch. Bạn kiểm tra lại giúp mình nhé.',
  ngayQua: (d: string) => `${d} đã qua. Bạn chọn ngày từ hôm nay trở đi nhé.`,
  ngayXa: (d: string) => `Beeftown chỉ nhận đặt bàn trong ${NGAY_TOI_DA} ngày tới (đến ${d}). Bạn chọn ngày gần hơn nhé.`,
  hetGio: (d: string) => `${d} không còn giờ nào nhận đặt bàn (đã kín chỗ hoặc đã qua giờ). Bạn chọn ngày khác nhé.`,
  chuaCoLich: 'Beeftown chưa mở lịch đặt bàn cho ngày này. Bạn chọn ngày khác, hoặc chọn "Gặp nhân viên" nhé.',
  khongDocLich: 'Chưa đọc được lịch trống lúc này. Bạn thử lại sau ít phút, hoặc chọn "Gặp nhân viên".',
  hoiBuoi: (d: string) => `${d}: bạn muốn đến buổi trưa hay buổi tối?`,
  hoiGio: (d: string) => `${d} còn nhận các giờ dưới đây. Bạn chọn giờ đến (hoặc gõ giờ, vd 19:30):`,
  gioKhongCo: (g: string) => `Giờ ${g} không có trong các giờ còn nhận của ngày này. Bạn chọn một nút bên dưới nhé.`,
  gioKhongHieu: 'Mình chưa hiểu giờ bạn gõ. Bạn chọn một nút bên dưới, hoặc gõ kiểu 19:30.',
  hoiKhach: `Bàn cho mấy người? (nhận từ 1 đến ${KHACH_TOI_DA} người)`,
  khachSai: `Bạn chọn số người từ 1 đến ${KHACH_TOI_DA} nhé.`,
  nhomDong: 'Nhóm từ 9 người trở lên thì nhân viên Beeftown sẽ trực tiếp sắp xếp với bạn. '
    + 'Mình đã báo nhân viên — nhân viên sẽ trả lời bạn ngay trong cuộc trò chuyện này.',
  hoiTen: 'Cho Beeftown xin tên người đặt bàn:',
  tenSai: 'Bạn gõ họ tên (2–60 ký tự, không kèm số điện thoại) giúp mình nhé.',
  hoiSdt: 'Số điện thoại để nhân viên gọi xác nhận? Bấm nút bên dưới để dùng số trong Facebook, hoặc gõ số (vd 0912345678).',
  sdtSai: 'Số điện thoại chưa đúng. Beeftown nhận số Việt Nam 10 chữ số, vd 0912345678.',
  xacNhan: (d: DuLieu) => [
    'Bạn kiểm tra lại giúp Beeftown:',
    `• Ngày: ${d.ngay ? ngayDep(d.ngay) : ''}`,
    `• Giờ: ${d.gio ?? ''}`,
    `• Số khách: ${d.so_khach ?? ''}`,
    `• Tên: ${d.ho_ten ?? ''}`,
    `• Số điện thoại: ${d.sdt ?? ''}`,
    'Bấm "Xác nhận" để gửi yêu cầu. Nhân viên sẽ gọi lại để xác nhận bàn.',
  ].join('\n'),
  hoiSua: 'Bạn muốn sửa mục nào?',
  daNhan: (ma: string, d: DuLieu) => [
    'Beeftown đã nhận yêu cầu đặt bàn của bạn.',
    `Mã đặt bàn: ${ma}`,
    `${d.ngay ? ngayDep(d.ngay) : ''} lúc ${d.gio ?? ''}, ${d.so_khach ?? ''} khách.`,
    'Yêu cầu chỉ có hiệu lực sau khi nhân viên gọi xác nhận — hiện chưa có bàn nào được giữ. '
      + `Nhân viên sẽ gọi số ${d.sdt ? cheSdt(d.sdt) : ''} để xác nhận.`,
    'Cần tra hoặc hủy, bạn chọn "Tra/hủy đặt bàn" và nhập mã này.',
  ].join('\n'),
  vuaHetCho: (g: string) => `Giờ ${g} vừa hết chỗ. Yêu cầu CHƯA được ghi nhận — bạn chọn giờ khác nhé.`,
  gioVuaQua: (g: string) => `Giờ ${g} hôm nay vừa qua. Yêu cầu CHƯA được ghi nhận — bạn chọn giờ khác nhé.`,
  formDong: 'Đặt bàn trực tuyến đang tạm đóng. Yêu cầu CHƯA được ghi nhận. Bạn chọn "Gặp nhân viên" để nhân viên giữ chỗ giúp bạn.',
  chuaGhi: 'Chưa gửi được yêu cầu. Yêu cầu của bạn CHƯA được ghi nhận.',
  khongChac: 'Không nhận được phản hồi. Beeftown KHÔNG CHẮC yêu cầu đã được ghi nhận hay chưa. '
    + 'Bạn chọn "Gặp nhân viên" để kiểm tra — đừng gửi lại nhiều lần.',
  dangGui: 'Beeftown đang xử lý yêu cầu đặt bàn bạn vừa gửi — bạn đợi tin trả lời trong giây lát nhé, không cần gửi lại.',
  quaLuot: `Hôm nay bạn đã gửi ${DAT_BAN_TOI_DA_NGAY} yêu cầu đặt bàn qua tin nhắn nên yêu cầu này CHƯA được ghi nhận. `
    + 'Cần đặt thêm, bạn chọn "Gặp nhân viên" để nhân viên hỗ trợ nhé.',
  heThongBan: 'Xin lỗi, trợ lý tự động của Beeftown đang gặp trục trặc nên chưa trả lời được. '
    + 'Nếu bạn đang đặt bàn, yêu cầu CHƯA được gửi. Nhân viên sẽ xem tin nhắn và trả lời bạn sớm.',
  // Tra / hủy
  hoiMa: 'Bạn gõ mã đặt bàn (6 ký tự, có trong tin Beeftown gửi khi nhận yêu cầu):',
  maSai: 'Mã đặt bàn gồm chữ và số, vd K7M2QX. Bạn gõ lại giúp mình nhé.',
  hoiSdtTra: 'Số điện thoại đã dùng khi đặt bàn?',
  khoaTra: (hotline: string | null) => 'Bạn đã nhập sai nhiều lần nên tra cứu tạm khóa 15 phút. '
    + (hotline ? `Cần gấp, bạn gọi nhà hàng: ${hotline}.` : 'Cần gấp, bạn chọn "Gặp nhân viên" nhé.'),
  khongThay: 'Không tìm thấy đặt bàn nào khớp mã và số điện thoại này (chỉ tra được đặt bàn từ hôm qua trở đi). Bạn kiểm tra lại nhé.',
  khongTraDuoc: 'Chưa tra cứu được lúc này. Bạn thử lại sau ít phút, hoặc chọn "Gặp nhân viên".',
  hoiHuy: (ma: string, ngay?: string, gio?: string) =>
    `Bạn chắc chắn muốn hủy đặt bàn ${ma}${ngay ? ` ngày ${ngayDep(ngay)}` : ''}${gio ? ` lúc ${gio}` : ''}?`,
  daHuy: (ma: string) => `Đã hủy yêu cầu đặt bàn ${ma}. Hẹn gặp bạn dịp khác!`,
  khongHuyDuoc: 'Không hủy được: không còn đặt bàn nào khớp mã và số điện thoại này từ hôm nay trở đi.',
  giuNguyen: 'Đặt bàn của bạn vẫn giữ nguyên.',
  // Câu hỏi thường gặp
  gioChuaCo: 'Giờ phục vụ chưa được công bố — Beeftown sẽ cập nhật trên Trang khi chốt lịch mở cửa.',
  chuaCoThongTin: 'Địa chỉ và giờ mở cửa sẽ được công bố trên Trang Beeftown sớm. Bạn cần gì, chọn "Gặp nhân viên" nhé.',
  khongDocThongTin: 'Chưa đọc được thông tin lúc này. Bạn thử lại sau ít phút, hoặc chọn "Gặp nhân viên".',
  thucDonCo: 'Thực đơn Beeftown có trên website:',
  thucDonChua: 'Thực đơn đang được hoàn thiện và sẽ công bố trên website và Trang Beeftown. Cần tư vấn món, bạn chọn "Gặp nhân viên" nhé.',
  // Người thật
  gapNhanVien: (phut: number) => 'Mình đã báo nhân viên Beeftown. Nhân viên sẽ trả lời bạn ngay trong cuộc trò chuyện này (trong giờ làm việc). '
    + `Trong ${phut} phút tới bot sẽ không tự trả lời để nhân viên nói chuyện với bạn.`,
  xoaDuLieu: 'Beeftown đã xóa thông tin bot đang lưu dở cho cuộc trò chuyện này. '
    + 'Để xóa thông tin đặt bàn (tên, số điện thoại), mình đã báo nhân viên — nhân viên sẽ xử lý và trả lời bạn tại đây.',
} as const;

const TRANG_THAI: Record<string, string> = {
  cho_xac_nhan: 'Chờ nhà hàng gọi xác nhận',
  da_xac_nhan: 'Nhà hàng đã xác nhận',
  da_den: 'Đã đến',
  khong_den: 'Không đến',
  da_huy: 'Đã hủy',
};

/** Câu database tiếng Việt (có dấu) thì hiện nguyên văn cho khách — như cauLoiDatabase() của lib/chu.ts. */
const CO_DAU = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

const LENH_MENU = new Set(['menu', 'bat dau', 'bat dau lai', 'start', 'restart', 've menu', 'quay lai', 'lam lai', 'get started']);
const LENH_HUY = new Set(['huy', 'huy bo', 'thoi', 'dung', 'dung lai', 'thoat', 'cancel', 'stop', 'khong dat nua']);

const qrMenu = (): NutNhanh[] => MENU_CHINH.map(m => ({ ...m }));
const QR_HUY: NutNhanh = { tieuDe: 'Hủy', payload: PAYLOAD.huyThaoTac };

/** 7 ngày gần nhất: "Hôm nay 27/9", "Mai 28/9", "T3 29/9"… */
function qrNgay(homNay: string): NutNhanh[] {
  const ra: NutNhanh[] = [];
  for (let i = 0; i < 7; i++) {
    const n = congNgay(homNay, i);
    const nhan = i === 0 ? 'Hôm nay' : i === 1 ? 'Mai' : THU_NGAN[thuCua(n)];
    ra.push({ tieuDe: `${nhan} ${ngayNgan(n)}`, payload: PAYLOAD.ngay + n });
  }
  ra.push(QR_HUY);
  return ra;
}

const hhmm = (g: string) => String(g ?? '').slice(0, 5);

/** Khung còn nhận của một ngày (chỉ con_cho && !da_qua), chia trưa / tối. */
export function khungConNhan(ngay: string, khung: KhungGio[]): { ngay: string; trua: string[]; toi: string[] } {
  const ok = khung.filter(k => k.con_cho === true && k.da_qua !== true);
  return {
    ngay,
    trua: ok.filter(k => k.buoi === 'trua').map(k => hhmm(k.gio)),
    toi: ok.filter(k => k.buoi !== 'trua').map(k => hhmm(k.gio)),
  };
}

/** Số nút giờ tối đa: chừa chỗ cho "Đổi ngày" và "Hủy" (13 − 2). */
const GIO_TOI_DA = META_API.gioiHan.nutNhanh - 2;

function tinHoiGio(d: DuLieu): Tin {
  const k = d.khung!;
  const tong = k.trua.length + k.toi.length;
  const tieuDeNgay = ngayDep(k.ngay);
  const cuoi: NutNhanh[] = [{ tieuDe: 'Đổi ngày', payload: PAYLOAD.doiNgay }, QR_HUY];
  if (tong <= GIO_TOI_DA) {
    return { chu: CAU_BOT.hoiGio(tieuDeNgay), nutNhanh: [...k.trua, ...k.toi].map((g): NutNhanh => ({ tieuDe: g, payload: PAYLOAD.gio + g })).concat(cuoi) };
  }
  const buoi = d.buoi && k[d.buoi].length ? d.buoi : null;
  if (!buoi) {
    const nut: NutNhanh[] = [];
    if (k.trua.length) nut.push({ tieuDe: 'Buổi trưa', payload: PAYLOAD.buoi + 'trua' });
    if (k.toi.length) nut.push({ tieuDe: 'Buổi tối', payload: PAYLOAD.buoi + 'toi' });
    return { chu: CAU_BOT.hoiBuoi(tieuDeNgay), nutNhanh: nut.concat(cuoi) };
  }
  // Buổi có hơn 11 khung (bước 15 phút…): nút chỉ chứa 11 giờ đầu — ghi rõ các giờ còn lại để khách gõ.
  const conLai = k[buoi].slice(GIO_TOI_DA);
  const chu = CAU_BOT.hoiGio(tieuDeNgay) + (conLai.length ? `\nCòn nhận thêm (gõ giờ để chọn): ${conLai.join(', ')}` : '');
  return { chu, nutNhanh: k[buoi].slice(0, GIO_TOI_DA).map((g): NutNhanh => ({ tieuDe: g, payload: PAYLOAD.gio + g })).concat(cuoi) };
}

function qrKhach(): NutNhanh[] {
  const ra: NutNhanh[] = [];
  for (let i = 1; i <= KHACH_TOI_DA; i++) ra.push({ tieuDe: `${i} người`, payload: PAYLOAD.khach + i });
  ra.push({ tieuDe: `Trên ${KHACH_TOI_DA} người`, payload: PAYLOAD.khach + (KHACH_TOI_DA + 1) });
  ra.push(QR_HUY);
  return ra;
}

const QR_XAC_NHAN: NutNhanh[] = [
  { tieuDe: 'Xác nhận', payload: PAYLOAD.xacNhan },
  { tieuDe: 'Sửa', payload: PAYLOAD.sua },
  QR_HUY,
];

const QR_SUA: NutNhanh[] = [
  { tieuDe: 'Ngày & giờ', payload: PAYLOAD.suaMuc + 'ngay' },
  { tieuDe: 'Giờ', payload: PAYLOAD.suaMuc + 'gio' },
  { tieuDe: 'Số khách', payload: PAYLOAD.suaMuc + 'khach' },
  { tieuDe: 'Tên', payload: PAYLOAD.suaMuc + 'ten' },
  { tieuDe: 'Số điện thoại', payload: PAYLOAD.suaMuc + 'sdt' },
  { tieuDe: 'Giữ nguyên', payload: PAYLOAD.suaMuc + 'giu' },
];

// --- Khung kết quả -----------------------------------------------------------
function kq(buoc: string, duLieu: DuLieu, tin: Tin[], them: Partial<KetQuaBuoc> = {}): KetQuaBuoc {
  return { tin, phien: { buoc, duLieu }, dem: [], ...them };
}

function veMenu(truoc: string[] = [], them: Partial<KetQuaBuoc> = {}): KetQuaBuoc {
  const chu = [...truoc, CAU_BOT.hoiMenu].join('\n');
  return kq('menu', {}, [{ chu, nutNhanh: qrMenu() }], them);
}

/** Bước kế tiếp của đặt bàn: mục đầu tiên còn thiếu. */
function diTiep(d: DuLieu, nc: NguCanh, truoc: string[] = [], them: Partial<KetQuaBuoc> = {}): KetQuaBuoc {
  const loiTruoc = truoc.length ? truoc.join('\n') + '\n' : '';
  const homNay = ngayVn(nc.bayGio);
  if (!d.ngay) return kq('dat_ngay', d, [{ chu: loiTruoc + CAU_BOT.hoiNgay, nutNhanh: qrNgay(homNay) }], them);
  if (!d.gio) {
    if (!d.khung || d.khung.ngay !== d.ngay) {
      const { khung: _k, buoi: _b, ...con } = d;
      void _k; void _b;
      return kq('dat_gio', con, truoc.length ? [{ chu: truoc.join('\n') }] : [], { ...them, goi: { goi: 'lich_trong', ngay: d.ngay } });
    }
    const t = tinHoiGio(d);
    return kq('dat_gio', d, [{ ...t, chu: loiTruoc + t.chu }], them);
  }
  if (!d.so_khach) return kq('dat_khach', d, [{ chu: loiTruoc + CAU_BOT.hoiKhach, nutNhanh: qrKhach() }], them);
  if (!d.ho_ten) return kq('dat_ten', d, [{ chu: loiTruoc + CAU_BOT.hoiTen, nutNhanh: [QR_HUY] }], them);
  if (!d.sdt) return kq('dat_sdt', d, [{ chu: loiTruoc + CAU_BOT.hoiSdt, nutNhanh: [{ sdt: true }, QR_HUY] }], them);
  return kq('dat_xac_nhan', d, [{ chu: loiTruoc + CAU_BOT.xacNhan(d), nutNhanh: QR_XAC_NHAN }], them);
}

/** Hỏi lại đúng câu của bước đang đứng (khi khách gõ / bấm thứ không hợp). */
function hoiLai(phien: PhienBot, nc: NguCanh, truoc: string): KetQuaBuoc {
  const d = phien.duLieu;
  switch (phien.buoc) {
    case 'dat_ngay': case 'dat_gio': case 'dat_khach': case 'dat_ten': case 'dat_sdt': case 'dat_xac_nhan':
      return diTiep(d, nc, [truoc]);
    case 'dat_sua':
      return kq('dat_sua', d, [{ chu: `${truoc}\n${CAU_BOT.hoiSua}`, nutNhanh: QR_SUA }]);
    case 'tra_ma':
      return kq('tra_ma', d, [{ chu: `${truoc}\n${CAU_BOT.hoiMa}`, nutNhanh: [QR_HUY] }]);
    case 'tra_sdt':
      return kq('tra_sdt', d, [{ chu: `${truoc}\n${CAU_BOT.hoiSdtTra}`, nutNhanh: [{ sdt: true }, QR_HUY] }]);
    case 'huy_xac_nhan':
      return kq('huy_xac_nhan', d, [{ chu: `${truoc}\n${CAU_BOT.hoiHuy(d.ma ?? '', d.tra_ngay, d.tra_gio)}`, nutNhanh: qrHuy() }]);
    default:
      return veMenu([truoc]);
  }
}

const qrHuy = (): NutNhanh[] => [
  { tieuDe: 'Có, hủy bàn', payload: PAYLOAD.huyCo },
  { tieuDe: 'Không', payload: PAYLOAD.huyKhong },
];

function batDauDatBan(): KetQuaBuoc {
  // Hỏi công tắc form_dat_ban_dang_mo trước — database mới là luật.
  return kq('dat_ngay', {}, [], { goi: { goi: 'thong_tin', muc: 'dat_ban' } });
}

function batDauTraCuu(nc: NguCanh): KetQuaBuoc {
  if (nc.biKhoa) return kq('menu', {}, [], { goi: { goi: 'thong_tin', muc: 'khoa' } });
  return kq('tra_ma', {}, [{ chu: CAU_BOT.hoiMa, nutNhanh: [QR_HUY] }]);
}

function gapNhanVien(nc: NguCanh, cau?: string): KetQuaBuoc {
  return kq('menu', {}, [{ chu: cau ?? CAU_BOT.gapNhanVien(nc.phutTamDung) }], { tamDung: true, dem: ['gap_nhan_vien'] });
}

function loiChaoVaMenu(nc: NguCanh): KetQuaBuoc {
  const chao = String(nc.loiChao ?? '').trim();
  return kq('menu', {}, [{ chu: chao ? `${chao}\n${CAU_BOT.hoiMenu}` : CAU_BOT.hoiMenu, nutNhanh: qrMenu() }]);
}

/** Đổi phiên vào thành phiên dùng được: thiếu / hỏng / để quá lâu → menu. */
function chuanPhien(p: PhienBot | null, nc: NguCanh): PhienBot {
  if (!p || typeof p.buoc !== 'string') return { buoc: 'menu', duLieu: {} };
  const duLieu = (p.duLieu && typeof p.duLieu === 'object' && !Array.isArray(p.duLieu)) ? p.duLieu : {};
  if (p.buoc !== 'menu' && nc.capNhat) {
    const t = Date.parse(nc.capNhat);
    if (Number.isFinite(t) && nc.bayGio - t > PHIEN_CU_MS) return { buoc: 'menu', duLieu: {} };
  }
  return { buoc: p.buoc, duLieu };
}

/**
 * MỘT BƯỚC HỘI THOẠI. Thuần: cùng đầu vào → cùng đầu ra.
 *
 * `phienVao` null = khách mới (chưa có phiên). `vao` là sự kiện khách gửi,
 * hoặc kết quả của việc (goi) mà bước trước yêu cầu.
 */
export function buocTiep(phienVao: PhienBot | null, vao: DauVao, nc: NguCanh): KetQuaBuoc {
  const phien = chuanPhien(phienVao, nc);
  if (vao.loai === 'ket_qua') return xuLyKetQua(phien, vao.kq, nc);
  if (vao.loai === 'nut' || vao.loai === 'postback') return xuLyNut(phien, vao.payload, nc);
  if (vao.loai === 'khac') {
    if (phien.buoc === 'menu') return veMenu([CAU_BOT.chiDocChu]);
    return hoiLai(phien, nc, CAU_BOT.chiDocChu);
  }

  const chu = String(vao.chu ?? '').trim();
  const bd = boDau(chu).replace(/[.!?,;~…]+$/g, '').trim();
  // Bỏ dấu thì "đúng" (xác nhận) và "dừng" (thôi) cùng là "dung" — xét chữ có dấu.
  const thuong = chu.normalize('NFC').toLowerCase().replace(/[.!?,;~…]+$/g, '').replace(/\s+/g, ' ').trim();
  const noiDung = /^đúng( rồi| vậy| ạ| rồi ạ)?$/.test(thuong);
  const buocHoiChac = phien.buoc === 'dat_xac_nhan' || phien.buoc === 'huy_xac_nhan';
  const dungKhongDau = bd === 'dung' && thuong === 'dung';

  if (LENH_MENU.has(bd)) return veMenu();
  if (LENH_HUY.has(bd) && !noiDung && !(dungKhongDau && buocHoiChac)) {
    // Đang hỏi "chắc chắn hủy bàn?" mà khách gõ "hủy / thôi": nói rõ bàn vẫn giữ.
    if (phien.buoc === 'huy_xac_nhan') return veMenu([CAU_BOT.giuNguyen]);
    return veMenu(phien.buoc === 'menu' ? [] : [CAU_BOT.daDung]);
  }
  if (/^((xoa|xoa het) (du lieu|thong tin)( cua toi)?|delete (my )?data)$/.test(bd)) return gapNhanVien(nc, CAU_BOT.xoaDuLieu);

  const d = phien.duLieu;
  switch (phien.buoc) {
    case 'dat_ngay': {
      const n = hieuNgay(chu, ngayVn(nc.bayGio));
      if (n.ok) return chonNgay(d, n.ngay, nc);
      return diTiep({ ...d, ngay: undefined }, nc, [cauNgaySai(n, nc)]);
    }
    case 'dat_gio': {
      if (!d.khung) return diTiep(d, nc);
      const g = hieuGio(chu);
      if (g) return chonGio(d, g, nc);
      const n = hieuNgay(chu, ngayVn(nc.bayGio));
      if (n.ok) return chonNgay(d, n.ngay, nc);
      return diTiep(d, nc, [CAU_BOT.gioKhongHieu]);
    }
    case 'dat_khach': {
      const so = hieuSoKhach(chu);
      if (so === null || so < 1) return diTiep(d, nc, [CAU_BOT.khachSai]);
      return chonKhach(d, so, nc);
    }
    case 'dat_ten': {
      const ten = hieuTen(chu);
      if (!ten) return diTiep(d, nc, [CAU_BOT.tenSai]);
      return diTiep({ ...d, ho_ten: ten }, nc);
    }
    case 'dat_sdt': {
      const sdt = sdtHopLe(chu);
      if (!sdt) return diTiep(d, nc, [CAU_BOT.sdtSai]);
      return diTiep({ ...d, sdt }, nc);
    }
    case 'dat_xac_nhan':
      if (noiDung || /^(xac nhan|ok|oke|okay|dong y|co|yes|gui|chot)$/.test(bd)) return xacNhanDatBan(d, nc);
      if (/^(sua|sua lai)$/.test(bd)) return kq('dat_sua', d, [{ chu: CAU_BOT.hoiSua, nutNhanh: QR_SUA }]);
      return hoiLai(phien, nc, CAU_BOT.chonNut);
    case 'dat_sua':
      return hoiLai(phien, nc, CAU_BOT.chonNut);
    case 'tra_ma': {
      const ma = chu.replace(/[\s\-]/g, '').toUpperCase();
      if (!/^[A-Z0-9]{4,12}$/.test(ma)) return hoiLai(phien, nc, CAU_BOT.maSai);
      return kq('tra_sdt', { ma }, [{ chu: CAU_BOT.hoiSdtTra, nutNhanh: [{ sdt: true }, QR_HUY] }]);
    }
    case 'tra_sdt': {
      const sdt = sdtHopLe(chu);
      if (!sdt) return hoiLai(phien, nc, CAU_BOT.sdtSai);
      if (!d.ma) return batDauTraCuu(nc);
      return kq('tra_ket_qua', { ma: d.ma, sdt }, [], { goi: { goi: 'tra_cuu', ma: d.ma, sdt } });
    }
    case 'huy_xac_nhan':
      if (noiDung || /^(co|dong y|yes|ok|huy ban|co huy)$/.test(bd)) return xuLyNut(phien, PAYLOAD.huyCo, nc);
      if (/^(khong|ko|no|thoi)$/.test(bd)) return xuLyNut(phien, PAYLOAD.huyKhong, nc);
      return hoiLai(phien, nc, CAU_BOT.chonNut);
    default:
      return hieuYMenu(bd, phienVao === null, nc);
  }
}

/** Chữ tự do ở menu: đoán việc khách muốn; không đoán được → lời chào / trợ giúp. */
function hieuYMenu(bd: string, khachMoi: boolean, nc: NguCanh): KetQuaBuoc {
  if (/(^| )(huy|tra cuu|kiem tra|xem lai)( |$)/.test(bd) && /(dat ban|ban|ma)/.test(bd)) return batDauTraCuu(nc);
  if (/(^| )(dat ban|dat cho|giu ban|giu cho|book|booking|dat)( |$)/.test(bd)) return batDauDatBan();
  if (/(nhan vien|nguoi that|tu van|hotline|goi dien|lien he)/.test(bd)) return gapNhanVien(nc);
  if (/(gio mo|mo cua|may gio|dia chi|o dau|cho nao|duong nao|chi duong|ban do)/.test(bd)) {
    return kq('menu', {}, [], { goi: { goi: 'thong_tin', muc: 'gio_mo' } });
  }
  if (/(thuc don|menu mon|mon an|co mon|(^| )gia( |$))/.test(bd)) return kq('menu', {}, [], { goi: { goi: 'thong_tin', muc: 'thuc_don' } });
  if (khachMoi || /^(xin chao|chao|hi|hello|alo|hey|chao shop|chao ban|shop oi|ad oi|admin oi)( .*)?$/.test(bd)) return loiChaoVaMenu(nc);
  return veMenu([CAU_BOT.troGiup]);
}

function cauNgaySai(n: Extract<KetQuaNgay, { ok: false }>, nc: NguCanh): string {
  if (n.lyDo === 'qua') return CAU_BOT.ngayQua(n.ngay ? ngayDep(n.ngay) : '');
  if (n.lyDo === 'xa') return CAU_BOT.ngayXa(ngayDep(congNgay(ngayVn(nc.bayGio), NGAY_TOI_DA)));
  if (n.lyDo === 'sai') return CAU_BOT.ngaySai;
  return CAU_BOT.ngayKhongHieu;
}

function chonNgay(d: DuLieu, ngay: string, nc: NguCanh): KetQuaBuoc {
  const homNay = ngayVn(nc.bayGio);
  if (ngay < homNay) return diTiep({ ...d, ngay: undefined, gio: undefined }, nc, [CAU_BOT.ngayQua(ngayDep(ngay))]);
  if (ngay > congNgay(homNay, NGAY_TOI_DA)) {
    return diTiep({ ...d, ngay: undefined, gio: undefined }, nc, [CAU_BOT.ngayXa(ngayDep(congNgay(homNay, NGAY_TOI_DA)))]);
  }
  const { khung: _k, buoi: _b, gio: _g, ...con } = d;
  void _k; void _b; void _g;
  return diTiep({ ...con, ngay }, nc);
}

function chonGio(d: DuLieu, gio: string, nc: NguCanh): KetQuaBuoc {
  const k = d.khung;
  if (!k || k.ngay !== d.ngay) return diTiep({ ...d, gio: undefined }, nc);
  if (![...k.trua, ...k.toi].includes(gio)) return diTiep(d, nc, [CAU_BOT.gioKhongCo(gio)]);
  return diTiep({ ...d, gio }, nc);
}

function chonKhach(d: DuLieu, so: number, nc: NguCanh): KetQuaBuoc {
  if (so > KHACH_TOI_DA) return gapNhanVien(nc, CAU_BOT.nhomDong);
  if (!Number.isInteger(so) || so < 1) return diTiep(d, nc, [CAU_BOT.khachSai]);
  return diTiep({ ...d, so_khach: so }, nc);
}

function xacNhanDatBan(d: DuLieu, nc: NguCanh): KetQuaBuoc {
  if (!d.ngay || !d.gio || !d.so_khach || !d.ho_ten || !d.sdt) return diTiep(d, nc);
  const homNay = ngayVn(nc.bayGio);
  if (d.ngay < homNay) return diTiep({ ...d, ngay: undefined, gio: undefined, khung: undefined }, nc, [CAU_BOT.ngayQua(ngayDep(d.ngay))]);
  if (d.ngay === homNay && d.gio <= gioVnHienTai(nc.bayGio)) {
    return diTiep({ ...d, gio: undefined, khung: undefined }, nc, [CAU_BOT.gioVuaQua(d.gio)]);
  }
  return kq('dat_xac_nhan', d, [], {
    goi: { goi: 'tao_dat_ban', ngay: d.ngay, gio: d.gio, soKhach: d.so_khach, hoTen: d.ho_ten, sdt: d.sdt },
  });
}

function xuLyNut(phien: PhienBot, payload: string, nc: NguCanh): KetQuaBuoc {
  const d = phien.duLieu;
  const dangDat = phien.buoc.startsWith('dat_');
  switch (payload) {
    case PAYLOAD.batDau: return loiChaoVaMenu(nc);
    case PAYLOAD.menu: return veMenu();
    case PAYLOAD.huyThaoTac: return veMenu(phien.buoc === 'menu' ? [] : [CAU_BOT.daDung]);
    case PAYLOAD.datBan: return batDauDatBan();
    case PAYLOAD.traCuu: case PAYLOAD.traLai: return batDauTraCuu(nc);
    case PAYLOAD.gioMo: return kq('menu', {}, [], { goi: { goi: 'thong_tin', muc: 'gio_mo' } });
    case PAYLOAD.thucDon: return kq('menu', {}, [], { goi: { goi: 'thong_tin', muc: 'thuc_don' } });
    case PAYLOAD.nhanVien: return gapNhanVien(nc);
    case PAYLOAD.doiNgay:
      if (!dangDat) return hoiLai(phien, nc, CAU_BOT.nutCu);
      return diTiep({ ...d, ngay: undefined, gio: undefined, khung: undefined, buoi: undefined }, nc);
    case PAYLOAD.xacNhan:
      if (phien.buoc !== 'dat_xac_nhan') return hoiLai(phien, nc, CAU_BOT.nutCu);
      return xacNhanDatBan(d, nc);
    case PAYLOAD.sua:
      if (phien.buoc !== 'dat_xac_nhan') return hoiLai(phien, nc, CAU_BOT.nutCu);
      return kq('dat_sua', d, [{ chu: CAU_BOT.hoiSua, nutNhanh: QR_SUA }]);
    case PAYLOAD.huyDatBan:
      if (phien.buoc !== 'tra_ket_qua' || !d.ma || !d.sdt) return hoiLai(phien, nc, CAU_BOT.nutCu);
      return kq('huy_xac_nhan', d, [{ chu: CAU_BOT.hoiHuy(d.ma, d.tra_ngay, d.tra_gio), nutNhanh: qrHuy() }]);
    case PAYLOAD.huyCo:
      if (phien.buoc !== 'huy_xac_nhan' || !d.ma || !d.sdt) return hoiLai(phien, nc, CAU_BOT.nutCu);
      return kq('menu', d, [], { goi: { goi: 'huy', ma: d.ma, sdt: d.sdt } });
    case PAYLOAD.huyKhong:
      if (phien.buoc !== 'huy_xac_nhan') return hoiLai(phien, nc, CAU_BOT.nutCu);
      return veMenu([CAU_BOT.giuNguyen]);
  }
  if (payload.startsWith(PAYLOAD.ngay)) {
    const ngay = payload.slice(PAYLOAD.ngay.length);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay)) return hoiLai(phien, nc, CAU_BOT.nutCu);
    // Nút ngày cũ bấm lại lúc khác vẫn hợp lý: bắt đầu (lại) đặt bàn với ngày đó.
    return chonNgay(dangDat ? d : {}, ngay, nc);
  }
  if (payload.startsWith(PAYLOAD.buoi)) {
    const buoi = payload.slice(PAYLOAD.buoi.length);
    if (phien.buoc !== 'dat_gio' || !d.khung || (buoi !== 'trua' && buoi !== 'toi')) return hoiLai(phien, nc, CAU_BOT.nutCu);
    return diTiep({ ...d, buoi }, nc);
  }
  if (payload.startsWith(PAYLOAD.gio)) {
    if (phien.buoc !== 'dat_gio') return hoiLai(phien, nc, CAU_BOT.nutCu);
    return chonGio(d, payload.slice(PAYLOAD.gio.length), nc);
  }
  if (payload.startsWith(PAYLOAD.khach)) {
    if (phien.buoc !== 'dat_khach') return hoiLai(phien, nc, CAU_BOT.nutCu);
    return chonKhach(d, Number(payload.slice(PAYLOAD.khach.length)), nc);
  }
  if (payload.startsWith(PAYLOAD.suaMuc)) {
    if (phien.buoc !== 'dat_sua') return hoiLai(phien, nc, CAU_BOT.nutCu);
    const muc = payload.slice(PAYLOAD.suaMuc.length);
    if (muc === 'ngay') return diTiep({ ...d, ngay: undefined, gio: undefined, khung: undefined, buoi: undefined }, nc);
    if (muc === 'gio') return diTiep({ ...d, gio: undefined }, nc);
    if (muc === 'khach') return diTiep({ ...d, so_khach: undefined }, nc);
    if (muc === 'ten') return diTiep({ ...d, ho_ten: undefined }, nc);
    if (muc === 'sdt') return diTiep({ ...d, sdt: undefined }, nc);
    return diTiep(d, nc);
  }
  return hoiLai(phien, nc, CAU_BOT.nutCu);
}

function dongThongTin(tt: ThongTinCongKhai): { chu: string; nut: Nut[] } {
  const dong: string[] = [];
  const ten = !tt.tenChiNhanh ? 'Beeftown' : /beeftown/i.test(tt.tenChiNhanh) ? tt.tenChiNhanh : `Beeftown — ${tt.tenChiNhanh}`;
  if (tt.diaChi) dong.push(`${ten}\nĐịa chỉ: ${tt.diaChi}`);
  if (tt.gio && (tt.gio.trua || tt.gio.toi)) {
    const phan = [tt.gio.trua && `trưa ${tt.gio.trua[0]}–${tt.gio.trua[1]}`, tt.gio.toi && `tối ${tt.gio.toi[0]}–${tt.gio.toi[1]}`].filter(Boolean);
    dong.push(`Giờ phục vụ: ${phan.join(', ')}`);
  } else if (tt.diaChi) {
    dong.push(CAU_BOT.gioChuaCo);
  }
  if (tt.hotline) dong.push(`Hotline: ${tt.hotline}`);
  const nut: Nut[] = [];
  if (tt.mapsUrl && /^https:\/\//.test(tt.mapsUrl)) nut.push({ loai: 'web', tieuDe: 'Chỉ đường', url: tt.mapsUrl });
  const goi = tt.hotline ? sdtQuocTe(tt.hotline) : null;
  if (goi) nut.push({ loai: 'goi', tieuDe: 'Gọi nhà hàng', sdt: goi });
  if (!dong.length) return { chu: CAU_BOT.chuaCoThongTin, nut: [] };
  return { chu: dong.join('\n'), nut };
}

function xuLyKetQua(phien: PhienBot, r: KetQuaGoi, nc: NguCanh): KetQuaBuoc {
  const d = phien.duLieu;
  switch (r.goi) {
    case 'lich_trong': {
      if (!r.ok) return kq('dat_ngay', { ...d, ngay: undefined, gio: undefined }, [{ chu: CAU_BOT.khongDocLich, nutNhanh: qrNgay(ngayVn(nc.bayGio)) }], { dem: ['loi'] });
      const ngay = d.ngay ?? '';
      if (!r.khung.length) return veMenu([CAU_BOT.chuaCoLich]);
      const khung = khungConNhan(ngay, r.khung);
      if (!khung.trua.length && !khung.toi.length) {
        return diTiep({ ...d, ngay: undefined, gio: undefined, khung: undefined, buoi: undefined }, nc, [CAU_BOT.hetGio(ngayDep(ngay))]);
      }
      return diTiep({ ...d, khung, buoi: undefined }, nc);
    }
    case 'tao_dat_ban': {
      if (r.ok) return veMenu([CAU_BOT.daNhan(r.ma, d)], { dem: ['dat_ban'] });
      if (r.khongChac) return veMenu([CAU_BOT.khongChac], { dem: ['loi'] });
      if (r.gioiHan === 'dang_gui') return kq(phien.buoc, d, [{ chu: CAU_BOT.dangGui }], { khongLuu: true });
      if (r.gioiHan === 'qua_luot') return veMenu([CAU_BOT.quaLuot], { dem: ['dat_ban_that_bai'] });
      const loi = String(r.loi ?? '');
      const that = { dem: ['dat_ban_that_bai'] as LoaiDem[] };
      if (/đã hết bàn/.test(loi)) return diTiep({ ...d, gio: undefined, khung: undefined, buoi: undefined }, nc, [CAU_BOT.vuaHetCho(d.gio ?? '')], that);
      if (/hôm nay đã qua/.test(loi)) return diTiep({ ...d, gio: undefined, khung: undefined, buoi: undefined }, nc, [CAU_BOT.gioVuaQua(d.gio ?? '')], that);
      if (/^Form đặt bàn đang tạm đóng/.test(loi)) return veMenu([CAU_BOT.formDong], that);
      if (/quá khứ/.test(loi)) return diTiep({ ...d, ngay: undefined, gio: undefined, khung: undefined }, nc, [CAU_BOT.ngayQua(d.ngay ? ngayDep(d.ngay) : '')], that);
      if (/^Số điện thoại không hợp lệ/.test(loi)) return diTiep({ ...d, sdt: undefined }, nc, [CAU_BOT.sdtSai], that);
      return veMenu([CAU_BOT.chuaGhi], that);
    }
    case 'tra_cuu': {
      if (!r.ok) return veMenu([CAU_BOT.khongTraDuoc], { dem: ['loi'] });
      if (!r.dong) {
        if (r.biKhoa) return kq('menu', {}, [{ chu: CAU_BOT.khongThay }], { goi: { goi: 'thong_tin', muc: 'khoa' } });
        return kq('menu', {}, [{ chu: CAU_BOT.khongThay, nutNhanh: [{ tieuDe: 'Thử lại', payload: PAYLOAD.traLai }, ...qrMenu()] }]);
      }
      const x = r.dong;
      const ngay = String(x.ngay).slice(0, 10);
      const gio = hhmm(x.gio);
      const chu = [
        `Tìm thấy đặt bàn ${x.ma_dat_ban}:`,
        `• Ngày: ${/^\d{4}-\d{2}-\d{2}$/.test(ngay) ? ngayDep(ngay) : ngay}`,
        `• Giờ: ${gio}`,
        `• Số khách: ${x.so_khach}`,
        x.ho_ten_che ? `• Tên: ${x.ho_ten_che}` : '',
        x.sdt_che ? `• Số điện thoại: ${x.sdt_che}` : '',
        `• Trạng thái: ${TRANG_THAI[x.trang_thai] ?? x.trang_thai}`,
      ].filter(Boolean).join('\n');
      const huyDuoc = (x.trang_thai === 'cho_xac_nhan' || x.trang_thai === 'da_xac_nhan') && ngay >= ngayVn(nc.bayGio);
      const nut: Nut[] = huyDuoc ? [{ loai: 'postback', tieuDe: 'Hủy đặt bàn', payload: PAYLOAD.huyDatBan }] : [];
      nut.push({ loai: 'postback', tieuDe: 'Về menu', payload: PAYLOAD.menu });
      return kq('tra_ket_qua', { ma: x.ma_dat_ban, sdt: d.sdt, tra_ngay: ngay, tra_gio: gio }, [{ chu, nut }]);
    }
    case 'huy': {
      if (!r.ok) {
        const loi = String(r.loi ?? '');
        // Câu database viết để hiện thẳng cho khách ("… không huỷ được nữa, vui lòng gọi nhà hàng").
        return veMenu([CO_DAU.test(loi) ? loi : CAU_BOT.khongTraDuoc], { dem: CO_DAU.test(loi) ? [] : ['loi'] });
      }
      if (r.daHuy) return veMenu([CAU_BOT.daHuy(d.ma ?? '')], { dem: ['huy_dat_ban'] });
      if (r.biKhoa) return kq('menu', {}, [{ chu: CAU_BOT.khongHuyDuoc }], { goi: { goi: 'thong_tin', muc: 'khoa' } });
      return veMenu([CAU_BOT.khongHuyDuoc]);
    }
    case 'thong_tin': {
      const muc = r.ok ? r.muc : (r.muc ?? '');
      if (!r.ok) {
        if (muc === 'khoa') return veMenu([CAU_BOT.khoaTra(null)]);
        if (muc === 'dat_ban') return veMenu([CAU_BOT.khongDocThongTin], { dem: ['loi'] });
        return veMenu([CAU_BOT.khongDocThongTin], { dem: ['loi'] });
      }
      const tt = r.tt;
      if (r.muc === 'khoa') return veMenu([CAU_BOT.khoaTra(tt.hotline)]);
      if (r.muc === 'dat_ban') {
        if (tt.formMo !== true) return veMenu([CAU_BOT.chuaMoDatBan]);
        return diTiep({}, nc);
      }
      if (r.muc === 'thuc_don') {
        if (tt.hienThucDon) {
          return kq('menu', {}, [{ chu: CAU_BOT.thucDonCo, nut: [{ loai: 'web', tieuDe: 'Xem thực đơn', url: `${nc.web.replace(/\/$/, '')}/` }], nutNhanh: qrMenu() }], { dem: ['hoi_dap'] });
        }
        return veMenu([CAU_BOT.thucDonChua], { dem: ['hoi_dap'] });
      }
      const { chu, nut } = dongThongTin(tt);
      return kq('menu', {}, [{ chu, nut, nutNhanh: qrMenu() }], { dem: ['hoi_dap'] });
    }
  }
}
