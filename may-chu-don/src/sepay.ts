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
 *     "<timestamp>.<thân gốc>" — phải dùng đúng byte thân nhận được, không JSON.stringify lại. Giờ ký: xem GIAY_CU_TOI_DA.
 *   · Chỉ tính là đã nhận khi trả 200 / 201 với thân {"success": true} trong 30 giây; khác đi SePay gửi lại.
 *
 * Không giữ content / description: hai trường này có thể chứa tên và số tài khoản của người chuyển — thỏa thuận
 * Zalo coi thông tin tài khoản ngân hàng là dữ liệu cá nhân nhạy cảm. Chỉ giữ mã giao dịch, số tiền, giờ, mã đơn.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { TIEN_TO_MA_THANH_TOAN } from './viet-qr.ts';

/**
 * Giờ ký được lệch bao nhiêu. Tương lai: 5 phút (đồng hồ lệch). Quá khứ: 6 giờ — SePay gửi lại 8 lần trong 33 phút và
 * quét gửi lại tới 5 giờ; nếu lần gửi lại mang giờ ký cũ thì cửa 5 phút sẽ từ chối mãi một khoản tiền thật. Gửi lại
 * tin cũ cũng vô hại: chữ ký vẫn phải đúng, và mỗi id SePay chỉ được ghi một lần (SoDon.ghiTienVe).
 */
export const GIAY_SOM_TOI_DA = 300;
export const GIAY_CU_TOI_DA = 6 * 60 * 60;
/** Thân trả về đúng y dạng SePay đòi. */
export const DA_NHAN = '{"success": true}';

/** Kiểm chữ ký HMAC-SHA256 trên thân gốc. `giayBayGio` theo đồng hồ máy chủ (NTP). */
export function kiemChuKy(thanGoc: string, chuKy: string | null, giayKy: string | null, khoa: string, giayBayGio: number):
  'dung' | 'sai_chu_ky' | 'qua_han' {
  if (!chuKy || !giayKy || !/^\d{1,12}$/.test(giayKy) || !khoa) return 'sai_chu_ky';
  const lech = giayBayGio - Number(giayKy);
  if (lech > GIAY_CU_TOI_DA || -lech > GIAY_SOM_TOI_DA) return 'qua_han';
  const dung = Buffer.from('sha256=' + createHmac('sha256', khoa).update(`${giayKy}.${thanGoc}`).digest('hex'));
  const gui = Buffer.from(chuKy);
  return dung.length === gui.length && timingSafeEqual(dung, gui) ? 'dung' : 'sai_chu_ky';
}

export interface TinTienVe {
  idSepay: number;
  vao: boolean;
  soTien: number;
  soTaiKhoan: string;
  /** Tài khoản ảo (VA) khớp giao dịch, "" nếu không có. */
  taiKhoanPhu: string;
  /** Nội dung có dạng mã của quán ("BT" + chữ số / chữ) dù không đọc ra mã đơn hợp lệ — phải có người xem. */
  coMaQuan: boolean;
  /** "YYYY-MM-DD HH:mm:ss" giờ VN, như SePay gửi. */
  ngayGiaoDich: string;
  maThamChieu: string;
  /** Mã đơn 8 ký tự đọc được từ mã thanh toán hay nội dung, hoặc null. */
  maDon: string | null;
}

const CHU_MA = '[ACDEFGHJKMNPQRTUVWXY34679]';
// Trước "BT" không được dính chữ / số ("...DEBTACDEFGHJ" không phải mã), sau mã cũng vậy.
const MAU_MA_TRONG_NOI_DUNG = new RegExp(`(?<![A-Z0-9])${TIEN_TO_MA_THANH_TOAN}\\s?(${CHU_MA}{8})(?![A-Z0-9])`);
const MAU_GIONG_MA = new RegExp(`(?<![A-Z0-9])${TIEN_TO_MA_THANH_TOAN}\\s?[A-Z0-9]{6,}`);

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
  const giongMa = [b.code, b.content].some(v => typeof v === 'string' && MAU_GIONG_MA.test(v.toUpperCase()));
  return {
    idSepay: id, vao: b.transferType === 'in', soTien: tien, soTaiKhoan: b.accountNumber.trim(),
    taiKhoanPhu: typeof b.subAccount === 'string' ? b.subAccount.trim() : '', coMaQuan: giongMa, ngayGiaoDich: ngay,
    maThamChieu: typeof b.referenceCode === 'string' ? b.referenceCode.slice(0, 64) : '',
    maDon: timMaDon(b.code, b.content),
  };
}
