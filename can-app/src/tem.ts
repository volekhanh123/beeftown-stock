/**
 * BEEFTOWN CÂN — MẪU TEM VÀ PHÍM TẮT TRONG FILE .TMS
 *
 * Cách đọc theo đặc tả dịch ngược phần mềm TM-xA v3.10 của hãng, đã đối chiếu
 * file cân thật (firmware V3.14E8):
 *   - Phần LAB có nhiều mẫu tem. Mỗi mẫu: một dòng LAB, các dòng LAS (mỗi dòng
 *     là một ô in trên tem, tối đa 100 ô, số thứ tự ô 0–99 cũng là thứ tự in),
 *     rồi dòng LAE (luôn có, kể cả mẫu không có ô nào).
 *   - Dòng LAB: cột 1 số mẫu · 2 tên · 3 loại tem (1 = tem một hàng) · 4 rộng mm ·
 *     5 cao mm · 6–21 chữ cố định số 0–15 · 22 kiểu phông (cờ, không phải chữ) ·
 *     23–38 chữ cố định số 16–31 · rồi ô rỗng sau tab cuối.
 *   - Dòng LAS: 1 số thứ tự ô · 2 loại ô (LOAI_O) · 3 và 4 mã dữ liệu, nghĩa tuỳ
 *     loại ô (dữ liệu của hàng: cột 4 theo TRUONG_HANG; thông tin lúc in: cột 3
 *     theo TRUONG_BAN; chữ cố định: cột 3 là số ô chữ) · 5 điều kiện in
 *     (DIEU_KIEN_IN) · 6 góc xoay ×90° theo chiều kim đồng hồ · 7 canh chữ (4 bit
 *     thấp 0–9, bit cao chưa rõ nghĩa — giữ nguyên) · 8 cỡ chữ (CO_CHU) ·
 *     9–12 x, y, rộng, cao tính bằng chấm (8 chấm/mm, gốc ở góc trên trái) ·
 *     rồi ô rỗng sau tab cuối. (Công cụ HTML cũ Beeftown_Can_TMA.html, đã lưu trữ
 *     12/10/2026, đọc nhầm cột 7 là cỡ chữ — trường đó không dùng để vẽ hay ghi.)
 *   - Phần TMS dòng số 0 cho biết cân đang in bằng mẫu số mấy.
 *   - Phần SCP: phím tắt tầng 1 — phím số k gọi PLU nào.
 *
 * Chỉnh tem ở đây gồm: sửa chữ cố định trên dòng LAB; tắt / bật ô (bỏ / trả
 * lại dòng LAS, dòng bị tắt nhớ trong tem-da-tat.json để bật lại được); di
 * chuyển, đổi khung, cỡ chữ, điều kiện in, canh, xoay một ô; thêm ô mới
 * (O_THEM_DUOC). Dòng nào không đổi thì giữ y nguyên từng byte. Mẫu tem có ô
 * Phân vùng (phiếu dài, tem cộng dồn) thì chỉ sửa chữ và tắt / bật như cũ: thứ
 * tự ô trên mẫu đó quyết định vùng in, sửa sai là lệch cả phiếu.
 *
 * Sửa / thêm ô, và gợi ý "chỉ in HSD khi hàng có hạn dùng": chưa thử trên cân thật.
 */
import { createHash } from 'node:crypto';
import { docFileCan, sangChuoiByte, tuChuoiByte, type FileCan } from '../../web/src/lib/kho/can-tma.ts';

const UTF8 = new TextDecoder('utf-8');
const docChu = (s: string | undefined) => UTF8.decode(tuChuoiByte(s ?? ''));
const ghiChu = (t: string) => sangChuoiByte(new TextEncoder().encode(t));
const soNguyen = (v: string | undefined, macDinh: number) => { const n = parseInt(v ?? '', 10); return Number.isFinite(n) ? n : macDinh; };

export const CHU_TEM_TOI_DA = 40;
/** Một mẫu tem có tối đa 100 ô; số thứ tự ô 0–99 (phần mềm của hãng). */
export const O_TOI_DA = 100;
export const SO_THU_TU_TOI_DA = 99;
/** Dòng LAB có 32 ô chữ cố định, số 0–31. */
export const SO_O_CHU = 32;
/** Máy in của cân: 8 chấm mỗi mm (203 dpi). */
export const CHAM_MOI_MM = 8;
/** x, y, rộng, cao lưu 2 byte trên cân. */
const CHAM_TOI_DA = 65535;
/** Cột 22 của dòng LAB là kiểu phông, không phải chữ. */
const COT_KIEU_PHONG = 22;

/** Ô chữ số t trên tem nằm ở cột nào của dòng LAB (cột 22 là cờ, không phải chữ). */
export const cotChu = (t: number) => (t < 16 ? 6 + t : 7 + t);

// -----------------------------------------------------------------------------
// DANH MỤC MÃ (tên tiếng Việt cho từng mã của hãng; tên trong ngoặc là giải thích,
// tenO bỏ phần ngoặc khi gọi tên ô)
// -----------------------------------------------------------------------------
/** Loại ô — cột 2 của dòng LAS. */
export const LOAI_O: Readonly<Record<number, string>> = {
  0: 'Mã vạch',
  1: 'Dữ liệu của hàng',
  2: 'Thông tin lúc in',
  3: 'Chữ cố định',
  4: 'Khung viền',
  5: 'Phân vùng',
  6: 'Hình (logo)',
  7: 'In riêng của hãng',
};

/** Ô dữ liệu của hàng (loại 1): mã ở cột 4 → tên. Cột 3 = 0 là hàng đang in, 1–31 là hàng thứ n đã cộng dồn. */
export const TRUONG_HANG: Readonly<Record<number, string>> = {
  0: 'Tên hàng',
  1: 'Trọng lượng / số lượng',
  2: 'Bì',
  3: 'Đơn giá gốc (trước khi giảm)',
  4: 'Đơn giá',
  5: 'Thành tiền của hàng (tem thường dùng Thành tiền lúc in)',
  6: 'Số PLU',
  7: 'Số nhóm hàng',
  8: 'Số bộ phận',
  9: 'Mã vạch ngoài (Index)',
  10: 'Mã hàng',
  11: 'Ngày bán',
  12: 'Giờ bán',
  13: 'Ngày đóng gói',
  14: 'Giờ đóng gói',
  15: 'Hạn dùng (HSD)',
  16: 'Chữ 1 của hàng',
  17: 'Chữ 2 của hàng',
  18: 'Chữ 3 của hàng',
  19: 'Chữ 4 của hàng',
  20: 'Chữ 5 của hàng',
  21: 'Chữ 6 của hàng',
  22: 'Chữ 7 của hàng',
  23: 'Tổng trọng lượng (cả bì)',
  24: 'Đơn vị tính',
  25: 'Đơn vị của đơn giá',
  26: 'Giá chưa thuế',
  27: 'Thuế',
  28: 'Phí dịch vụ của hàng',
  29: 'Thuế suất',
  30: 'Số PLU và tên hàng',
  31: 'Đơn giá trước khi giảm',
  32: 'Trọng lượng của hàng đếm cái',
  33: 'Hình của hàng',
  34: 'Bì theo bao bì',
  35: 'Bì theo phần trăm',
  36: 'Phần trăm bì',
};

/** Ô thông tin lúc in (loại 2): mã ở cột 3 → tên. */
export const TRUONG_BAN: Readonly<Record<number, string>> = {
  0: 'Tên quán',
  1: 'Tên cân',
  2: 'Số cân',
  3: 'Ngày in (quán dùng làm ngày đóng gói)',
  4: 'Giờ in',
  5: 'Số lần cộng dồn',
  6: 'Tổng số cái',
  7: 'Tổng trọng lượng',
  8: 'Tổng tiền (trước làm tròn)',
  9: 'Tiền khách trả',
  10: 'Tiền thối',
  11: 'Tiền làm tròn',
  12: 'Đơn vị trọng lượng',
  13: 'Đơn vị giá theo trọng lượng',
  14: 'Đơn vị đếm',
  15: 'Đơn vị giá theo cái',
  16: 'Đơn vị tiền',
  17: 'Ghi chú cân 1',
  18: 'Ghi chú cân 2',
  19: 'Ghi chú cân 3',
  20: 'Ghi chú cân 4',
  21: 'Ghi chú cân 5',
  22: 'Ghi chú cân 6',
  23: 'Ghi chú cân 7',
  24: 'Ghi chú cân 8',
  25: 'Số giao dịch (FID)',
  26: 'Số phiếu (SID)',
  27: 'Thành tiền',
  28: 'Tổng cộng dồn (trước giảm và làm tròn)',
  29: 'Tiền giảm và làm tròn',
  30: 'Số người bán',
  31: 'Tên người bán',
  32: 'Tổng tiền chưa thuế',
  33: 'Tổng thuế',
  34: 'Số người phục vụ',
  35: 'Tên người phục vụ',
  36: 'Chữ dự phòng 1',
  37: 'Chữ dự phòng 2',
  38: 'Dấu ngành hàng',
  39: 'Tên WiFi (không nên in)',
  40: 'Mật khẩu WiFi (không được in)',
  41: 'Chữ dự phòng 6',
  42: 'Chữ dự phòng 7',
  43: 'Tên miền máy chủ',
  44: 'Phí dịch vụ',
  45: 'Thuế của phí dịch vụ',
  46: 'Phí dịch vụ chưa thuế',
  47: 'Số bàn',
  48: 'Số dư thẻ',
  49: 'Số dư thẻ ban đầu',
  50: 'Thông tin thẻ',
  51: 'Trả bằng thẻ',
  52: 'Thanh toán 1',
  53: 'Thanh toán 2',
  54: 'Thanh toán 3',
  55: 'Loại giao dịch',
  56: 'Mã khách VIP',
  57: 'Mã phụ khách VIP',
  58: 'Giảm giá VIP',
  59: 'Điểm VIP',
  60: 'Thành tiền (loại tiền thứ hai)',
  61: 'Thông tin riêng 1',
  62: 'Thông tin riêng 2',
  63: 'Thông tin riêng 3',
  64: 'Thông tin riêng 4',
  65: 'Địa chỉ MAC của cân',
  66: 'Tiền giảm và làm tròn (có thuế)',
  67: 'Kiểu thanh toán qua mạng',
  68: 'Số tiền thanh toán qua mạng',
  69: 'Mã thanh toán qua mạng',
};

/** Điều kiện in — cột 5 của dòng LAS. */
export const DIEU_KIEN_IN: Readonly<Record<number, string>> = {
  0: 'Không in',
  1: 'Luôn in',
  2: 'Chỉ hàng cân ký',
  3: 'Chỉ hàng đếm cái',
  4: 'Chỉ hàng bán tạm (không có PLU)',
  5: 'Chỉ hàng có trừ bì',
  6: 'Chỉ hàng tặng',
  7: 'Chỉ khi hàng có ngày bán',
  8: 'Chỉ khi hàng có ngày đóng gói',
  9: 'Chỉ khi hàng có hạn dùng (HSD)',
  10: 'Chỉ khi không phải đúng 1 cái',
  11: 'Chỉ hàng có phí dịch vụ',
  12: 'Chỉ khi có phí dịch vụ',
  13: 'Chỉ hàng có thuế',
  14: 'Chỉ khi trả tiền mặt',
  15: 'Chỉ khi trả bằng thẻ',
  16: 'Chỉ khi có giảm giá tổng',
  17: 'Chỉ khi dùng thanh toán 1',
  18: 'Chỉ khi dùng thanh toán 2',
  19: 'Chỉ khi dùng thanh toán 3',
  20: 'Chỉ khách VIP',
  21: 'Chỉ lần in thường (không phải in lại / in trước)',
  22: 'Chỉ khi in lại',
  23: 'Chỉ khi in trước',
  24: 'Chỉ hàng đúng 1 cái',
  25: 'Chỉ hàng không phải bán tạm',
  26: 'Chỉ hàng không trừ bì',
  27: 'Chỉ hàng không phải hàng tặng',
  28: 'Chỉ hàng miễn thuế',
  29: 'Chỉ khách không phải VIP',
  30: 'Chỉ hàng có bì mặc định',
  31: 'Chỉ khi in thông tin thẻ',
  32: 'Chỉ khi thanh toán qua mạng',
  33: 'Chỉ hàng không có bì mặc định',
};

/** Cỡ chữ — cột 8 của dòng LAS: rộng một chữ Latin × chiều cao dòng, tính bằng chấm. */
export const CO_CHU: readonly { rong: number; cao: number; ten: string }[] = [
  { rong: 10, cao: 18, ten: 'Nhỏ' },
  { rong: 14, cao: 26, ten: 'Vừa' },
  { rong: 18, cao: 34, ten: 'Lớn' },
  { rong: 10, cao: 36, ten: 'Nhỏ, cao gấp đôi' },
  { rong: 14, cao: 52, ten: 'Vừa, cao gấp đôi' },
  { rong: 18, cao: 68, ten: 'Lớn, cao gấp đôi' },
  { rong: 28, cao: 52, ten: 'Vừa, to gấp đôi' },
  { rong: 36, cao: 68, ten: 'Lớn, to gấp đôi' },
  { rong: 36, cao: 136, ten: 'Lớn, rộng gấp đôi, cao gấp bốn' },
  { rong: 54, cao: 102, ten: 'Lớn, to gấp ba' },
];

/** Canh chữ trong khung — 4 bit thấp của cột 7 (bit cao giữ nguyên, chưa rõ nghĩa). */
export const CANH_CHU: Readonly<Record<number, string>> = {
  0: 'Mặc định (phần mềm của hãng vẽ ở giữa)',
  1: 'Trên, trái',
  2: 'Trên, giữa',
  3: 'Trên, phải',
  4: 'Giữa, trái',
  5: 'Giữa',
  6: 'Giữa, phải',
  7: 'Dưới, trái',
  8: 'Dưới, giữa',
  9: 'Dưới, phải',
};

/** Góc xoay — cột 6 của dòng LAS, theo chiều kim đồng hồ. */
export const XOAY: Readonly<Record<number, string>> = { 0: 'Không xoay', 1: 'Xoay 90°', 2: 'Xoay 180°', 3: 'Xoay 270°' };

/** Một loại ô người dùng thêm được lên tem. */
export interface MauOThem {
  khoa: string;
  ten: string;
  flag1: number;        // loại ô (LOAI_O)
  flag2: number;        // ô chữ cố định: số ô chữ do chương trình tự chọn (giá trị ở đây bỏ qua)
  flag3: number;
  inKhi: number;        // điều kiện in mặc định (DIEU_KIEN_IN)
  font: number;         // cỡ chữ mặc định (CO_CHU)
  canh: number;         // canh chữ mặc định (CANH_CHU)
  w: number; h: number; // khung mặc định, chấm
  chu?: string;         // ô chữ cố định: chữ mặc định
  ghiChu?: string;
}

/**
 * Các ô thêm được (khung mặc định theo tem 58×40 mm của quán). Cố ý KHÔNG có tên
 * / mật khẩu WiFi (thông tin lúc in 39, 40): cân in được, nhưng không bao giờ nên in.
 */
export const O_THEM_DUOC: readonly MauOThem[] = [
  { khoa: 'ten-hang', ten: 'Tên hàng', flag1: 1, flag2: 0, flag3: 0, inKhi: 1, font: 2, canh: 5, w: 400, h: 34 },
  { khoa: 'so-plu', ten: 'Số PLU', flag1: 1, flag2: 0, flag3: 6, inKhi: 1, font: 0, canh: 5, w: 60, h: 20 },
  { khoa: 'ma-hang', ten: 'Mã hàng', flag1: 1, flag2: 0, flag3: 10, inKhi: 1, font: 0, canh: 5, w: 120, h: 20 },
  { khoa: 'trong-luong', ten: 'Trọng lượng / số lượng', flag1: 1, flag2: 0, flag3: 1, inKhi: 1, font: 1, canh: 5, w: 120, h: 26 },
  { khoa: 'don-gia', ten: 'Đơn giá', flag1: 1, flag2: 0, flag3: 4, inKhi: 1, font: 1, canh: 5, w: 120, h: 26 },
  { khoa: 'don-vi-tinh', ten: 'Đơn vị tính', flag1: 1, flag2: 0, flag3: 24, inKhi: 1, font: 1, canh: 5, w: 60, h: 26 },
  { khoa: 'thanh-tien', ten: 'Thành tiền', flag1: 2, flag2: 27, flag3: 0, inKhi: 1, font: 2, canh: 5, w: 200, h: 34 },
  { khoa: 'don-vi-tien', ten: 'Đơn vị tiền', flag1: 2, flag2: 16, flag3: 0, inKhi: 1, font: 1, canh: 5, w: 42, h: 26 },
  // Ngày đóng gói của quán = ngày cân in tem (ô "Ngày in"). Ô "Ngày đóng gói" của hàng (dữ liệu hàng 13)
  // chỉ in khi PLU có đặt ngày đóng gói riêng — Beeftown Cân không đặt, nên không cho thêm ô đó.
  { khoa: 'ngay-in', ten: 'Ngày in (dùng làm ngày đóng gói)', flag1: 2, flag2: 3, flag3: 0, inKhi: 1, font: 0, canh: 5, w: 156, h: 20,
    ghiChu: 'Ngày cân in tem — tem của quán dùng ngày này làm ngày đóng gói.' },
  { khoa: 'gio-in', ten: 'Giờ in', flag1: 2, flag2: 4, flag3: 0, inKhi: 1, font: 0, canh: 5, w: 100, h: 20 },
  { khoa: 'hsd', ten: 'Hạn dùng (HSD)', flag1: 1, flag2: 0, flag3: 15, inKhi: 9, font: 0, canh: 5, w: 200, h: 26,
    ghiChu: 'Chỉ in khi hàng có hạn dùng (chưa thử trên cân thật).' },
  { khoa: 'chu-hsd', ten: 'Chữ "HSD"', flag1: 3, flag2: 0, flag3: 0, inKhi: 9, font: 0, canh: 5, w: 94, h: 23, chu: 'HSD',
    ghiChu: 'Chỉ in khi hàng có hạn dùng, cùng lúc với ô Hạn dùng (chưa thử trên cân thật).' },
  { khoa: 'chu', ten: 'Chữ cố định', flag1: 3, flag2: 0, flag3: 0, inKhi: 1, font: 0, canh: 5, w: 160, h: 20 },
  { khoa: 'ten-quan', ten: 'Tên quán', flag1: 2, flag2: 0, flag3: 0, inKhi: 1, font: 1, canh: 5, w: 400, h: 26 },
  // 2.4: chữ của "Ghi chú cân 1–8" (chữ cài đặt chung TMT 4–11) sửa ở thẻ Cân & thông số, mục 6.
  ...Array.from({ length: 8 }, (_, i): MauOThem => ({ khoa: `ghi-chu-${i + 1}`, ten: `Ghi chú cân ${i + 1}`, flag1: 2, flag2: 17 + i, flag3: 0,
    inKhi: 1, font: 0, canh: 5, w: 400, h: 20,
    ghiChu: `Chữ của ô này sửa ở thẻ Cân & thông số, mục 6 (Ghi chú cân ${i + 1}) — chưa thử trên cân thật.` })),
  { khoa: 'ma-vach', ten: 'Mã vạch', flag1: 0, flag2: 0, flag3: 0, inKhi: 1, font: 0, canh: 5, w: 257, h: 74 },
];

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export interface OTem {
  tho: string;          // nguyên dòng LAS, dạng chuỗi byte
  loai: string;         // cột 2: '0' mã vạch · '1' dữ liệu hàng · '2' thông tin lúc in · '3' chữ cố định … (LOAI_O)
  chu: number;          // cột 3
  duLieu: number;       // cột 4
  dieuKien: string;     // cột 5 nguyên chữ (điều kiện in)
  x: number; y: number; w: number; h: number;   // cột 9–12, chấm
  subId: number;        // cột 1: số thứ tự ô (thứ tự in)
  inKhi: number;        // cột 5 dạng số (DIEU_KIEN_IN)
  xoay: number;         // cột 6: 0–3 × 90°
  canh: number;         // cột 7 nguyên giá trị (cả bit cao); canh chữ = canh & 0x0F
  font: number;         // cột 8: cỡ chữ (CO_CHU)
}

export interface MauTem {
  id: string;
  ten: string;
  rong: number;          // mm
  cao: number;           // mm
  dongLab: number;       // vị trí dòng LAB trong file
  dongLae: number;       // vị trí dòng LAE (hoặc cuối phần LAB)
  cot: string[];         // các cột dòng LAB, dạng chuỗi byte
  o: OTem[];
  phanVung: boolean;     // có ô Phân vùng (loại 5) đang in
}

function docO(tho: string): OTem {
  const f = tho.split('\t');
  return { tho, loai: f[2] ?? '', chu: soNguyen(f[3], -1), duLieu: soNguyen(f[4], -1), dieuKien: f[5] ?? '',
    x: soNguyen(f[9], 0), y: soNguyen(f[10], 0), w: soNguyen(f[11], 0), h: soNguyen(f[12], 0),
    subId: soNguyen(f[1], -1), inKhi: soNguyen(f[5], -1), xoay: soNguyen(f[6], 0), canh: soNguyen(f[7], 0), font: soNguyen(f[8], 0) };
}

const laPhanVung = (o: OTem) => o.loai === '5';

function thongSo(file: FileCan): Record<number, string> {
  const spec: Record<number, string> = {};
  const T = file.phan.TMS;
  if (!T) return spec;
  for (let i = T.dau + 1; i < T.cuoi; i++) {
    const c = file.dong[i].split('\t');
    if (c[0] === 'TMS') spec[parseInt(c[1], 10)] = c[2];
  }
  return spec;
}

/** Các mẫu tem trong file, và mẫu cân đang dùng (null nếu file không có phần LAB). */
export function docTem(file: FileCan): { cacMau: MauTem[]; dangDung: MauTem | null } {
  const cacMau: MauTem[] = [];
  const L = file.phan.LAB;
  if (L) {
    let dang: MauTem | null = null;
    for (let i = L.dau + 1; i < L.cuoi; i++) {
      const d = file.dong[i];
      const f = d.split('\t');
      if (f[0] === 'LAB') {
        if (dang) dang.dongLae = i;
        dang = { id: f[1] ?? '', ten: docChu(f[2]), rong: soNguyen(f[4], 58), cao: soNguyen(f[5], 40), dongLab: i, dongLae: L.cuoi, cot: f, o: [], phanVung: false };
        cacMau.push(dang);
      } else if (f[0] === 'LAS' && dang) dang.o.push(docO(d));
      else if (f[0] === 'LAE' && dang) { dang.dongLae = i; dang = null; }
    }
  }
  for (const m of cacMau) m.phanVung = m.o.some(laPhanVung);
  const so0 = thongSo(file)[0];
  const dangDung = cacMau.find(m => m.id === so0 && m.cot[3] === '1') ?? cacMau.find(m => m.cot[3] === '1') ?? null;
  return { cacMau, dangDung };
}

/**
 * 2.7 — các dòng của mẫu tem cân đang dùng (LAB, các LAS, LAE) trong file, dạng chuỗi byte: khối gửi riêng mẫu tem qua
 * cổng hai chiều ("DWL LAB" … "END LAB" — cân thay cả mẫu cùng số). Không có mẫu tem, hay mẫu thiếu dòng LAE (file hỏng)
 * → LoiTem: không bao giờ gửi nửa mẫu tem.
 */
export function dongMauTemDangDung(file: FileCan): string[] {
  const { dangDung: m } = docTem(file);
  if (!m) throw new LoiTem('File của cân không có mẫu tem (phần LAB).');
  const dong = file.dong.slice(m.dongLab, m.dongLae + 1);
  if (dong.length < 2 || !dong[dong.length - 1].startsWith('LAE\t')) {
    throw new LoiTem('Mẫu tem trong file thiếu dòng kết thúc (LAE) — sửa tem bằng USB hoặc phần mềm của hãng.');
  }
  return dong;
}

/** "Hạn dùng (HSD)" → "Hạn dùng": tên ngắn để gọi ô. */
const tenNgan = (t: string) => t.replace(/\s*\([^)]*\)$/, '');

/** Tên dễ hiểu của một ô trên tem. */
export function tenO(o: OTem, cot: string[]): string {
  if (o.loai === '0') return 'Mã vạch';
  if (o.loai === '1') {
    const ten = TRUONG_HANG[o.duLieu] !== undefined ? tenNgan(TRUONG_HANG[o.duLieu]) : `Dữ liệu hàng số ${o.duLieu}`;
    return o.chu > 0 ? `${ten} (hàng thứ ${o.chu})` : ten;
  }
  if (o.loai === '2') return TRUONG_BAN[o.chu] !== undefined ? tenNgan(TRUONG_BAN[o.chu]) : `Số tính lúc in số ${o.chu}`;
  if (o.loai === '3') {
    const chu = docChu(cot[cotChu(o.chu)]);
    return chu ? `Chữ "${chu}"` : 'Chữ (đang trống)';
  }
  if (o.loai === '4') return `Khung viền (dày ${o.chu} chấm)`;
  if (o.loai === '5') return 'Phân vùng';
  if (o.loai === '6') return `Hình số ${o.chu}`;
  if (o.loai === '7') return 'In riêng của hãng';
  return `Ô loại ${o.loai}`;
}

/**
 * Khung thật trên giấy của một ô (x, y, rộng, cao — chấm), tính cả góc xoay như
 * phần mềm của hãng: xoay quanh góc (x, y) theo chiều kim đồng hồ.
 */
export function khungThat(x: number, y: number, w: number, h: number, xoay: number): { x: number; y: number; w: number; h: number } {
  switch (((xoay % 4) + 4) % 4) {
    case 1: return { x: x - h, y, w: h, h: w };
    case 2: return { x: x - w, y: y - h, w, h };
    case 3: return { x, y: y - w, w: h, h: w };
    default: return { x, y, w, h };
  }
}

// -----------------------------------------------------------------------------
// Ô ĐÃ TẮT (nhớ để bật lại)
// -----------------------------------------------------------------------------
export interface ODaTat { tho: string; viTri: number }
export type DaTat = Record<string, ODaTat[]>;   // số mẫu tem → các ô đã tắt

/** Ô đã tắt còn thật sự vắng trên tem (ví dụ file USB chưa nạp thì dòng vẫn còn). */
export function daTatHopLe(mau: MauTem, daTat: DaTat): ODaTat[] {
  const con = new Map<string, number>();
  for (const o of mau.o) con.set(o.tho, (con.get(o.tho) ?? 0) + 1);
  const ra: ODaTat[] = [];
  for (const x of daTat[mau.id] ?? []) {
    const n = con.get(x.tho) ?? 0;
    if (n > 0) { con.set(x.tho, n - 1); continue; }
    ra.push(x);
  }
  return ra;
}

// -----------------------------------------------------------------------------
// XEM (gửi cho giao diện)
// -----------------------------------------------------------------------------
export interface OTemXem {
  khoa: string;          // "o:3" ô đang in thứ 3 · "t:1" ô đã tắt thứ 1
  bat: boolean;
  ten: string;
  loai: string; chu: number; duLieu: number; dieuKien: string;
  x: number; y: number; w: number; h: number;
  subId: number; font: number; canh: number; xoay: number; inKhi: number;
  cot?: number;          // ô chữ: cột trên dòng LAB
}
export interface TemXem {
  id: string; ten: string; rong: number; cao: number;
  o: OTemXem[];
  chu: Record<number, string>;
  soMau: number;
  phanVung: boolean;         // mẫu có ô Phân vùng
  chanSua: string | null;    // lý do không sửa / thêm ô được (null = được)
}

export const CAU_PHAN_VUNG = 'Mẫu tem này có ô Phân vùng (dùng cho phiếu dài hoặc tem cộng dồn): thứ tự ô quyết định vùng in, '
  + 'nên chương trình không di chuyển, sửa hay thêm ô trên mẫu này. Vẫn sửa chữ và tắt / bật ô được; muốn sửa bố cục thì dùng phần mềm của hãng.';

export function xemTem(file: FileCan, daTat: DaTat): TemXem | null {
  const { cacMau, dangDung: m } = docTem(file);
  if (!m) return null;
  const chu: Record<number, string> = {};
  const ra = (o: OTem, khoa: string, bat: boolean): OTemXem => {
    const x: OTemXem = { khoa, bat, ten: tenO(o, m.cot), loai: o.loai, chu: o.chu, duLieu: o.duLieu, dieuKien: o.dieuKien,
      x: o.x, y: o.y, w: o.w, h: o.h, subId: o.subId, font: o.font, canh: o.canh, xoay: o.xoay, inKhi: o.inKhi };
    if (o.loai === '3') { x.cot = cotChu(o.chu); chu[x.cot] = docChu(m.cot[x.cot]); }
    return x;
  };
  const hopLe = daTatHopLe(m, daTat);
  const o = [
    ...m.o.map((x, i) => ra(x, `o:${i}`, true)),
    ...hopLe.map((x, i) => ra(docO(x.tho), `t:${i}`, false)),
  ];
  const phanVung = m.phanVung || hopLe.some(x => laPhanVung(docO(x.tho)));
  return { id: m.id, ten: m.ten, rong: m.rong, cao: m.cao, o, chu, soMau: cacMau.length, phanVung, chanSua: phanVung ? CAU_PHAN_VUNG : null };
}

/** Chữ "HSD" / "Hạn dùng" / "Hạn sử dụng" … trên tem (có thể có dấu hai chấm). */
const CHU_HSD = /^(hsd|hạn dùng|hạn sử dụng|han dung|han su dung|ngày hết hạn|ngay het han|hết hạn|het han)\s*:?$/iu;

/**
 * Gợi ý HSD: ô Hạn dùng hoặc chữ "HSD" trên tem đang dùng mà in "Luôn in" (1) —
 * nên đổi sang 9 "Chỉ khi hàng có hạn dùng", để hàng không đặt HSD không in ô
 * trống / chữ "HSD" lẻ loi. Trả khoá các ô ("o:i") cho nút "Chỉ in HSD khi hàng
 * có hạn dùng" (gửi { sua: [{ khoa, inKhi: 9 }] }). Mẫu có Phân vùng (kể cả ô
 * Phân vùng đang tắt): không gợi ý, vì không sửa được. Cân in gì với ô "Luôn in"
 * khi hàng không có HSD: chưa thử trên cân thật.
 */
export function goiYHsd(file: FileCan, daTat: DaTat = {}): string[] {
  const { dangDung: m } = docTem(file);
  if (!m || m.phanVung || daTatHopLe(m, daTat).some(x => laPhanVung(docO(x.tho)))) return [];
  const laHsd = (o: OTem) => (o.loai === '1' && o.duLieu === 15)
    || (o.loai === '3' && CHU_HSD.test(docChu(m.cot[cotChu(o.chu)]).trim().normalize('NFC')));
  return m.o.flatMap((o, i) => (o.inKhi === 1 && laHsd(o) ? [`o:${i}`] : []));
}

// -----------------------------------------------------------------------------
// SỬA
// -----------------------------------------------------------------------------
/** Sửa một ô đang in ("o:i"): chỉ những trường có mặt. */
export interface SuaO {
  khoa: string;
  x?: number; y?: number; w?: number; h?: number;   // chấm
  font?: number;        // cỡ chữ 0–9
  inKhi?: number;       // điều kiện in (DIEU_KIEN_IN)
  canh?: number;        // canh chữ 0–9 (bit cao của ô giữ nguyên)
  xoay?: number;        // 0–3
}
/** Thêm một ô theo mẫu trong O_THEM_DUOC. */
export interface ThemO {
  mau: string;          // khoa trong O_THEM_DUOC
  x: number; y: number;
  w?: number; h?: number; font?: number; inKhi?: number; canh?: number; xoay?: number;
  chu?: string;         // ô chữ cố định: chữ in ra (tối đa 40 ký tự)
}
export interface ThayDoiTem {
  /** cột dòng LAB → chữ mới. */
  chu?: Record<string, string>;
  /** Ô đang in cần tắt: khoa "o:i". */
  tat?: string[];
  /** Ô đã tắt cần bật lại: khoa "t:i". */
  bat?: string[];
  /** Ô đang in cần sửa (khoa "o:i"). Chưa thử trên cân thật. */
  sua?: SuaO[];
  /** Ô mới (thêm cuối mẫu tem, số thứ tự lớn nhất + 1). Chưa thử trên cân thật. */
  them?: ThemO[];
  /**
   * Dấu của mẫu tem lúc trang mở (dauTem, trả kèm tem()). Các khoá "o:i" / "t:i" chỉ đúng với mẫu tem đó:
   * mẫu đã đổi (bấm gửi hai lần, thẻ khác vừa gửi, vừa cập nhật file gốc) thì áp vào sẽ tắt / dời nhầm ô.
   */
  dau?: string;
}

export class LoiTem extends Error {}

export const CAU_DOI = 'Tem trên máy đã đổi. Mở lại thẻ Tem rồi sửa lại.';

/**
 * Dấu của mẫu tem đang dùng: SHA-1 của dòng LAB, các dòng LAS / LAE của nó và các ô đã tắt (tem-da-tat.json) —
 * đúng những thứ các khoá "o:i" / "t:i" dựa vào. Không có mẫu tem thì ''.
 */
export function dauTem(file: FileCan, daTat: DaTat): string {
  const { dangDung: m } = docTem(file);
  if (!m) return '';
  return createHash('sha1').update(file.dong.slice(m.dongLab, m.dongLae + 1).join('\n'), 'latin1')
    .update('\n' + JSON.stringify(daTat[m.id] ?? []), 'utf8').digest('hex');
}

/** Chữ người nhập: bỏ tab / xuống dòng, gọn, NFC, tối đa 40 ký tự. */
function sachChu(v: unknown): string {
  const moi = String(v ?? '').replace(/[\t\r\n]+/g, ' ').trim().normalize('NFC');
  if ([...moi].length > CHU_TEM_TOI_DA) throw new LoiTem(`Chữ trên tem dài quá ${CHU_TEM_TOI_DA} ký tự.`);
  return moi;
}

/** Số nguyên trong [tu, den]; bằng `giu` (giá trị đang có) thì luôn nhận. */
function soTrongKhoang(v: unknown, ten: string, tu: number, den: number, giu?: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\s*\d+\s*$/.test(v) ? Number(v) : NaN;
  if (giu !== undefined && n === giu) return n;
  if (!Number.isInteger(n) || n < tu || n > den) throw new LoiTem(`${ten} phải là số nguyên từ ${tu} đến ${den}.`);
  return n;
}

function dieuKienIn(v: unknown, giu?: number): number {
  const n = soTrongKhoang(v, 'Điều kiện in', 0, 99, giu);
  if (n !== giu && DIEU_KIEN_IN[n] === undefined) throw new LoiTem('Điều kiện in không có trong danh sách.');
  return n;
}

function mangThayDoi<T>(v: T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.some(x => !x || typeof x !== 'object')) throw new LoiTem('Thay đổi tem không đúng dạng. Mở lại thẻ Tem rồi sửa lại.');
  return v;
}

/** Ô nằm (một phần) ngoài tem → câu cảnh báo; không chặn. */
function ngoaiTem(o: OTem, cot: string[], rong: number, cao: number): string | null {
  const k = khungThat(o.x, o.y, o.w, o.h, o.xoay);
  const R = rong * CHAM_MOI_MM, C = cao * CHAM_MOI_MM;
  if (k.x >= 0 && k.y >= 0 && k.x + k.w <= R && k.y + k.h <= C) return null;
  return `Ô ${tenO(o, cot)} (số ${o.subId}) nằm một phần ngoài tem ${rong}×${cao} mm (${R}×${C} chấm): phần ra ngoài mép có thể không in ra.`;
}

/** Dòng LAS sau khi sửa: chỉ đổi đúng cột có giá trị mới, cột khác giữ nguyên từng byte. */
function suaDongLas(tho: string, s: SuaO): string {
  const f = tho.split('\t');
  if (f.length < 13) throw new LoiTem('Ô này có dòng lạ, chương trình không sửa được. Sửa tem trên cân hoặc phần mềm của hãng.');
  const o = docO(tho);
  const dat = (c: number, gt: number) => { if (soNguyen(f[c], NaN) !== gt) f[c] = String(gt); };
  if (s.x !== undefined) dat(9, soTrongKhoang(s.x, 'Vị trí ngang (x)', 0, CHAM_TOI_DA));
  if (s.y !== undefined) dat(10, soTrongKhoang(s.y, 'Vị trí dọc (y)', 0, CHAM_TOI_DA));
  if (s.w !== undefined) dat(11, soTrongKhoang(s.w, 'Chiều rộng', 1, CHAM_TOI_DA));
  if (s.h !== undefined) dat(12, soTrongKhoang(s.h, 'Chiều cao', 1, CHAM_TOI_DA));
  if (s.font !== undefined) dat(8, soTrongKhoang(s.font, 'Cỡ chữ', 0, CO_CHU.length - 1, o.font));
  if (s.inKhi !== undefined) dat(5, dieuKienIn(s.inKhi, o.inKhi));
  if (s.xoay !== undefined) dat(6, soTrongKhoang(s.xoay, 'Góc xoay', 0, 3, o.xoay));
  if (s.canh !== undefined) {
    const n = soTrongKhoang(s.canh, 'Canh chữ', 0, 9, o.canh);
    dat(7, n === o.canh ? n : (o.canh & ~0x0F) | n);   // giữ bit cao (chưa rõ nghĩa) của cân
  }
  return f.join('\t');
}

/** Ô chữ trống đầu tiên (không ô nào dùng, cột LAB trống); hết thì ô không ai dùng đầu tiên. */
function oChuTrong(cot: string[], dangDung: Set<number>): number {
  const chuaDung = Array.from({ length: SO_O_CHU }, (_, t) => t).filter(t => !dangDung.has(t));
  const t = chuaDung.find(t => docChu(cot[cotChu(t)]).trim() === '') ?? chuaDung[0];
  if (t === undefined) throw new LoiTem(`Mẫu tem đã dùng hết ${SO_O_CHU} ô chữ cố định.`);
  return t;
}

/** Ghi vào cột c của dòng LAB; dòng ngắn thì thêm cột trống, giữ tab cuối nếu dòng có. */
function datCot(cot: string[], c: number, v: string): void {
  const coTabCuoi = cot.length > 1 && cot[cot.length - 1] === '';
  const soCot = cot.length - (coTabCuoi ? 1 : 0);
  if (c < soCot) { cot[c] = v; return; }
  if (c > COT_KIEU_PHONG && soCot <= COT_KIEU_PHONG) {
    throw new LoiTem('Dòng mẫu tem thiếu cột, chương trình không thêm chữ được. Sửa tem trên cân hoặc phần mềm của hãng.');
  }
  if (coTabCuoi) cot.pop();
  while (cot.length < c) cot.push('');
  cot.push(v);
  if (coTabCuoi) cot.push('');
}

export interface KetQuaSuaTem {
  du: Uint8Array<ArrayBuffer>;
  daTat: DaTat;
  coDoi: boolean;
  /** Ô sửa / thêm nằm ngoài mép tem… (không chặn). */
  canhBao: string[];
}

/**
 * File mới với mẫu tem đang dùng đã sửa, và danh sách ô đã tắt sau khi sửa.
 * Phần khác của file (kể cả PLU, TIM) giữ nguyên từng byte.
 * Thứ tự: chữ LAB → sửa ô → tắt / bật → thêm ô.
 */
export function suaTem(du: Uint8Array, daTat: DaTat, thay: ThayDoiTem): KetQuaSuaTem {
  const file = docFileCan(du);
  const { dangDung: m } = docTem(file);
  if (!m) throw new LoiTem('File của cân không có mẫu tem (phần LAB).');
  const hopLe = daTatHopLe(m, daTat);
  const canhBao: string[] = [];

  // Dòng LAB: chữ cố định
  const cot = m.cot.slice();
  let coDoi = false;
  const cotChuDung = new Set([...m.o, ...hopLe.map(x => docO(x.tho))].filter(o => o.loai === '3').map(o => cotChu(o.chu)));
  for (const [k, v] of Object.entries(thay.chu ?? {})) {
    const c = Number(k);
    if (!cotChuDung.has(c)) throw new LoiTem('Ô chữ này không có trên tem.');
    const moi = sachChu(v);
    if (docChu(cot[c]) !== moi) { cot[c] = ghiChu(moi); coDoi = true; }
  }

  // Sửa / thêm ô: không làm trên mẫu có Phân vùng
  const cacSua = mangThayDoi(thay.sua), cacThem = mangThayDoi(thay.them);
  if ((cacSua.length || cacThem.length) && (m.phanVung || hopLe.some(x => laPhanVung(docO(x.tho))))) throw new LoiTem(CAU_PHAN_VUNG);

  const soI = (khoa: string, dau: string, toiDa: number) => {
    const mm = new RegExp(`^${dau}:(\\d+)$`).exec(khoa);
    const i = mm ? Number(mm[1]) : -1;
    if (i < 0 || i >= toiDa) throw new LoiTem(CAU_DOI);
    return i;
  };

  // Dòng LAS: sửa ô đang in
  const dangIn: string[] = m.o.map(x => x.tho);
  for (const s of cacSua) {
    if (typeof s.khoa === 'string' && s.khoa.startsWith('t:')) throw new LoiTem('Ô này đang tắt. Bật ô lên rồi mới sửa được.');
    const i = soI(String(s.khoa), 'o', m.o.length);
    const moi = suaDongLas(dangIn[i], s);
    if (moi === dangIn[i]) continue;
    dangIn[i] = moi;
    coDoi = true;
    const b = ngoaiTem(docO(moi), cot, m.rong, m.cao);
    if (b && !canhBao.includes(b)) canhBao.push(b);
  }

  // Dòng LAS: tắt / bật
  const tat = new Set((thay.tat ?? []).map(k => soI(k, 'o', m.o.length)));
  const bat = new Set((thay.bat ?? []).map(k => soI(k, 't', hopLe.length)));
  let o: string[] = dangIn.slice();
  const conTat: ODaTat[] = hopLe.filter((_, i) => !bat.has(i));
  const moiTat: ODaTat[] = [...tat].sort((a, b) => a - b).map(i => ({ tho: dangIn[i], viTri: i }));
  if (tat.size) { o = o.filter((_, i) => !tat.has(i)); coDoi = true; }
  for (const i of [...bat].sort((a, b) => hopLe[a].viTri - hopLe[b].viTri)) {
    o.splice(Math.min(hopLe[i].viTri, o.length), 0, hopLe[i].tho);
    coDoi = true;
  }

  // Dòng LAS: thêm ô. Số thứ tự tính cả ô đang tắt (bật lại sau không trùng số).
  if (cacThem.length) {
    const daCo = [...o, ...conTat.map(x => x.tho), ...moiTat.map(x => x.tho)].map(docO);
    let soLonNhat = Math.max(-1, ...daCo.map(x => x.subId));
    const oChuDung = new Set(daCo.filter(x => x.loai === '3').map(x => x.chu));
    for (const t of cacThem) {
      const mau = O_THEM_DUOC.find(x => x.khoa === t.mau);
      if (!mau) throw new LoiTem('Loại ô cần thêm không có trong danh sách. Mở lại thẻ Tem rồi thêm lại.');
      const so = soLonNhat + 1;
      if (so > SO_THU_TU_TOI_DA) {
        throw new LoiTem(`Mẫu tem đã dùng tới số thứ tự ô ${SO_THU_TU_TOI_DA}, không thêm được ô mới. Sửa tem bằng phần mềm của hãng.`);
      }
      const x = soTrongKhoang(t.x, 'Vị trí ngang (x)', 0, CHAM_TOI_DA);
      const y = soTrongKhoang(t.y, 'Vị trí dọc (y)', 0, CHAM_TOI_DA);
      const w = soTrongKhoang(t.w ?? mau.w, 'Chiều rộng', 1, CHAM_TOI_DA);
      const h = soTrongKhoang(t.h ?? mau.h, 'Chiều cao', 1, CHAM_TOI_DA);
      const font = soTrongKhoang(t.font ?? mau.font, 'Cỡ chữ', 0, CO_CHU.length - 1);
      const inKhi = dieuKienIn(t.inKhi ?? mau.inKhi);
      const canh = soTrongKhoang(t.canh ?? mau.canh, 'Canh chữ', 0, 9);
      const xoay = soTrongKhoang(t.xoay ?? 0, 'Góc xoay', 0, 3);
      let flag2 = mau.flag2;
      if (mau.flag1 === 3) {
        const chu = sachChu(t.chu ?? mau.chu ?? '');
        if (!chu) throw new LoiTem('Nhập chữ cho ô chữ mới.');
        flag2 = oChuTrong(cot, oChuDung);
        datCot(cot, cotChu(flag2), ghiChu(chu));
        oChuDung.add(flag2);
      }
      const dong = ['LAS', so, mau.flag1, flag2, mau.flag3, inKhi, xoay, canh, font, x, y, w, h, ''].join('\t');
      o.push(dong);
      soLonNhat = so;
      coDoi = true;
      const b = ngoaiTem(docO(dong), cot, m.rong, m.cao);
      if (b && !canhBao.includes(b)) canhBao.push(b);
    }
  }
  if (o.length === 0) throw new LoiTem('Tem phải còn ít nhất một ô được in.');
  // (chỉ chặn khi số ô tăng lên: file cân sẵn có quá 100 ô thì sửa chữ / tắt ô vẫn như cũ)
  if (o.length > O_TOI_DA && o.length > m.o.length) throw new LoiTem(`Mẫu tem có tối đa ${O_TOI_DA} ô. Tắt bớt ô rồi thêm lại.`);

  const dong = file.dong.slice();
  const dauLas = m.dongLab + 1;
  const cuLas = file.dong.slice(dauLas, m.dongLae).filter(d => d.startsWith('LAS\t')).length;
  const khac = file.dong.slice(dauLas, m.dongLae).filter(d => !d.startsWith('LAS\t'));
  if (khac.length) throw new LoiTem('Mẫu tem có dòng lạ, chương trình không sửa được. Sửa tem trên cân hoặc phần mềm của hãng.');
  dong.splice(dauLas, cuLas, ...o);
  dong[m.dongLab] = cot.join('\t');

  const than = tuChuoiByte(dong.join(file.xuongDong));
  let ra: Uint8Array<ArrayBuffer> = than;
  if (file.coBom) { ra = new Uint8Array(than.length + 3); ra.set([0xEF, 0xBB, 0xBF]); ra.set(than, 3); }
  return { du: ra, daTat: { ...daTat, [m.id]: [...conTat, ...moiTat] }, coDoi, canhBao };
}
