/**
 * MÃ VIETQR CHO MỘT ĐƠN — chuyển khoản vào tài khoản của Công ty TNHH SLK Group
 * =============================================================================
 *
 * Khánh chọn 29/10/2026: thu tiền online qua SePay (tài khoản VietinBank, sẽ mở sau). Khách quét mã bằng app ngân
 * hàng, app điền sẵn số tài khoản, số tiền, nội dung "BT<mã đơn>"; SePay thấy tiền về thì báo máy chủ (sepay.ts).
 *
 * Chuỗi theo chuẩn VietQR của NAPAS (EMVCo, mỗi trường "mã 2 số · độ dài 2 số · giá trị"):
 *   00 "01" · 01 "12" (mã động, có số tiền) · 38 { 00 "A000000727" · 01 { 00 BIN ngân hàng · 01 số tài khoản } ·
 *   02 "QRIBFTTA" (chuyển tới tài khoản) } · 53 "704" (VND) · 54 số tiền · 58 "VN" · 62 { 08 nội dung } ·
 *   63 CRC16-CCITT (đa thức 0x1021, khởi đầu 0xFFFF) tính trên cả chuỗi kể cả "6304".
 * Tự dựng chuỗi ở máy chủ, không gọi ảnh QR của bên ngoài (vietqr.app/img): số tiền và mã đơn không rời máy chủ.
 */
import QR from 'qrcode';

/** Tiền tố mã thanh toán — khai giống hệt ở SePay: Cấu hình chung → Cấu trúc mã thanh toán, tiền tố BT, hậu tố 8–8, Số và chữ. */
export const TIEN_TO_MA_THANH_TOAN = 'BT';

/** Nội dung chuyển khoản của đơn: "BT" + mã đơn 8 ký tự (chữ hoa, số — không dấu, ngân hàng nào cũng giữ nguyên). */
export const noiDungChuyenKhoan = (maDon: string) => `${TIEN_TO_MA_THANH_TOAN}${maDon}`;

export interface TaiKhoanNhan {
  /** Mã BIN 6 số của ngân hàng theo NAPAS (VietinBank 970415). */
  bin: string;
  soTaiKhoan: string;
  /** Tên chủ tài khoản hiện cho khách xem trước khi chuyển (thỏa thuận Zalo: phải rõ ai nhận tiền). */
  tenTaiKhoan: string;
  /** Tên ngân hàng hiện cho khách. */
  tenNganHang: string;
}

/** Tài khoản nhận hợp lệ: BIN 6 số, số tài khoản 6–19 chữ số, tên có chữ. */
export function laTaiKhoanNhan(t: Partial<TaiKhoanNhan>): t is TaiKhoanNhan {
  return /^\d{6}$/.test(t.bin ?? '') && /^\d{6,19}$/.test(t.soTaiKhoan ?? '')
    && (t.tenTaiKhoan ?? '').trim().length >= 2 && (t.tenNganHang ?? '').trim().length >= 2;
}

const truong = (ma: string, giaTri: string) => {
  if (giaTri.length > 99) throw new Error(`Trường ${ma} của VietQR dài quá 99 ký tự`);
  return `${ma}${String(giaTri.length).padStart(2, '0')}${giaTri}`;
};

/** CRC16-CCITT (FALSE): đa thức 0x1021, khởi đầu 0xFFFF, không đảo bit — 4 chữ số hex viết hoa. */
export function crc16(chu: string): string {
  let crc = 0xffff;
  for (const b of Buffer.from(chu, 'utf8')) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Chuỗi VietQR cho một lần chuyển: đúng số tiền, đúng nội dung. Số tiền phải là số nguyên dương (đồng). */
export function chuoiVietQr(tk: TaiKhoanNhan, soTien: number, noiDung: string): string {
  if (!Number.isInteger(soTien) || soTien <= 0) throw new Error('Số tiền VietQR phải là số nguyên dương');
  if (!/^[A-Za-z0-9 ]{1,25}$/.test(noiDung)) throw new Error('Nội dung VietQR chỉ chữ không dấu, số, dấu cách, tối đa 25 ký tự');
  const nguoiNhan = truong('00', 'A000000727') + truong('01', truong('00', tk.bin) + truong('01', tk.soTaiKhoan)) + truong('02', 'QRIBFTTA');
  const than = truong('00', '01') + truong('01', '12') + truong('38', nguoiNhan) + truong('53', '704')
    + truong('54', String(soTien)) + truong('58', 'VN') + truong('62', truong('08', noiDung)) + '6304';
  return than + crc16(than);
}

/** Đọc lại chuỗi VietQR thành từng trường (kiểm thử, và để chắc chuỗi tự dựng không lệch độ dài). */
export function docTruong(chuoi: string): Record<string, string> {
  const ra: Record<string, string> = {};
  for (let i = 0; i < chuoi.length;) {
    const ma = chuoi.slice(i, i + 2), dai = Number(chuoi.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(ma) || !Number.isInteger(dai)) throw new Error(`VietQR hỏng ở vị trí ${i}`);
    ra[ma] = chuoi.slice(i + 4, i + 4 + dai);
    i += 4 + dai;
  }
  return ra;
}

/** Ảnh SVG của mã — đen trên trắng, chừa lề 4 ô như chuẩn QR để app ngân hàng quét được. */
export function svgVietQr(chuoi: string): Promise<string> {
  return QR.toString(chuoi, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, color: { dark: '#000000', light: '#FFFFFF' } });
}
