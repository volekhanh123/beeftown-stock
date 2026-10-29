/**
 * SEPAY — đọc tin "có tiền về" (webhook), hàm thuần, không database
 * =================================================================
 *
 * Nguồn: tài liệu SePay, đọc 29/10/2026 — developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook (dạng tin),
 * /xac-thuc (HMAC-SHA256), /bao-mat (kiểm số tiền, tài khoản, mã), /xu-ly-loi (gửi lại 8 lần trong 33 phút).
 *
 *   · Mỗi giao dịch SePay POST một JSON: id (số, không đổi qua mọi lần gửi lại — khóa chống trùng), gateway,
 *     transactionDate ("YYYY-MM-DD HH:mm:ss" giờ VN), accountNumber, subAccount, code (mã thanh toán SePay bóc theo
 *     tiền tố đã khai, hoặc null), content, transferType ("in" / "out"), description, transferAmount (đồng, luôn
 *     dương), accumulated, referenceCode.
 *   · Ký HMAC-SHA256: header X-SePay-Signature "sha256=<hex>", X-SePay-Timestamp (giây). Chuỗi ký là
 *     "<timestamp>.<thân gốc>" — phải dùng đúng byte thân nhận được, không JSON.stringify lại. Lệch quá 5 phút: từ chối.
 *   · Chỉ tính là đã nhận khi trả 200 / 201 với thân {"success": true} trong 30 giây; khác đi SePay gửi lại.
 *
 * Không giữ content / description: hai trường này có thể chứa tên và số tài khoản của người chuyển — thỏa thuận
 * Zalo coi thông tin tài khoản ngân hàng là dữ liệu cá nhân nhạy cảm. Chỉ giữ mã giao dịch, số tiền, giờ, mã đơn.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { TIEN_TO_MA_THANH_TOAN } from './viet-qr.ts';

export const GIAY_LECH_TOI_DA = 300;
/** Thân trả về đúng y dạng SePay đòi. */
export const DA_NHAN = '{"success": true}';

/** Kiểm chữ ký HMAC-SHA256 trên thân gốc. `giayBayGio` theo đồng hồ máy chủ (NTP). */
export function kiemChuKy(thanGoc: string, chuKy: string | null, giayKy: string | null, khoa: string, giayBayGio: number):
  'dung' | 'sai_chu_ky' | 'qua_han' {
  if (!chuKy || !giayKy || !/^\d{1,12}$/.test(giayKy) || !khoa) return 'sai_chu_ky';
  if (Math.abs(giayBayGio - Number(giayKy)) > GIAY_LECH_TOI_DA) return 'qua_han';
  const dung = Buffer.from('sha256=' + createHmac('sha256', khoa).update(`${giayKy}.${thanGoc}`).digest('hex'));
  const gui = Buffer.from(chuKy);
  return dung.length === gui.length && timingSafeEqual(dung, gui) ? 'dung' : 'sai_chu_ky';
}

export interface TinTienVe {
  idSepay: number;
  vao: boolean;
  soTien: number;
  soTaiKhoan: string;
  /** "YYYY-MM-DD HH:mm:ss" giờ VN, như SePay gửi. */
  ngayGiaoDich: string;
  maThamChieu: string;
  /** Mã đơn 8 ký tự đọc được từ mã thanh toán hay nội dung, hoặc null. */
  maDon: string | null;
}

const CHU_MA = '[ACDEFGHJKMNPQRTUVWXY34679]';
const MAU_MA_TRONG_NOI_DUNG = new RegExp(`${TIEN_TO_MA_THANH_TOAN}\\s?(${CHU_MA}{8})(?![A-Z0-9])`);

/**
 * Mã đơn trong một lần chuyển: ưu tiên `code` SePay đã bóc; không có thì tìm "BT" + 8 ký tự trong nội dung
 * (chữ hoa hóa — app ngân hàng hay đổi hoa thường; vài ngân hàng chèn dấu cách sau tiền tố).
 */
export function timMaDon(code: unknown, noiDung: unknown): string | null {
  for (const v of [code, noiDung]) {
    if (typeof v !== 'string' || !v) continue;
    const m = v.toUpperCase().match(MAU_MA_TRONG_NOI_DUNG);
    if (m) return m[1];
  }
  return null;
}

/** Thân JSON của SePay → TinTienVe, hoặc null khi thiếu trường bắt buộc / sai kiểu (không bao giờ ném lỗi). */
export function docTinTienVe(than: unknown): TinTienVe | null {
  if (!than || typeof than !== 'object' || Array.isArray(than)) return null;
  const b = than as Record<string, unknown>;
  const id = b.id, tien = b.transferAmount;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return null;
  if (typeof tien !== 'number' || !Number.isSafeInteger(tien) || tien <= 0) return null;
  if (b.transferType !== 'in' && b.transferType !== 'out') return null;
  if (typeof b.accountNumber !== 'string') return null;
  const ngay = typeof b.transactionDate === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(b.transactionDate)
    ? b.transactionDate : '';
  return {
    idSepay: id, vao: b.transferType === 'in', soTien: tien, soTaiKhoan: b.accountNumber.trim(), ngayGiaoDich: ngay,
    maThamChieu: typeof b.referenceCode === 'string' ? b.referenceCode.slice(0, 64) : '',
    maDon: timMaDon(b.code, b.content),
  };
}
