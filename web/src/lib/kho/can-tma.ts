/**
 * KHO — ĐỒNG BỘ DANH MỤC SANG CÂN IN TEM (Dahua TM-A, dòng TM-xA)
 *
 * Kho là gốc: mã cân, tên, giá bán/kg chỉ sửa ở Cài đặt → Mặt hàng. Cân không
 * nối mạng với phần mềm kho, nên đi đường USB:
 *   1. Cân lưu dữ liệu ra USB: file JHSCALE/A_000.TMS
 *   2. Màn Đồng bộ cân nhận file đó, thay phần hàng hoá (PLU) bằng danh mục kho
 *   3. Trả lại file cùng tên để chép đè vào USB rồi nạp vào cân
 *
 * FILE .TMS — đã đối chiếu trên cân thật (firmware V3.14E8, 25/09/2026):
 *   - Văn bản tách cột bằng tab, xuống dòng CRLF. Mỗi phần mở bằng
 *     "DWL<tab>TÊN<tab>" và đóng bằng "END<tab>TÊN<tab>". "XD1" chỉ có trong
 *     một file mẫu tự dựng (không thấy ở cân thật hay phần mềm hãng) — vẫn đọc
 *     được. Dòng "CLR<tab>TÊN<tab>" + "CLR<tab>END<tab>" (lệnh xoá cả bảng mà
 *     phần mềm TM-xA của hãng ghi khi tích "Clear Data") KHÔNG mở phần nào.
 *     File có lệnh xoá bảng khác PLU (CLR TMS / TMT / LAB…) bị từ chối: gửi
 *     lại là xoá cả thông số, chữ cài đặt (có WiFi) của cân. Khi ghi file,
 *     mọi dòng CLR đều bị bỏ (ghiFileCan) — không đường gửi nào mang lệnh xoá.
 *   - File do phần mềm TM-xA tạo có dấu BOM và một dòng trống trước
 *     "ECS<tab>VER<tab>100<tab>"; file cân tự lưu thì dòng đầu là "ECS…". Dòng
 *     đầu tiên khác rỗng là dòng đầu file.
 *   - Dòng PLU: cột 1 số PLU · 2 mã hàng (= ma_can) · 4 cách bán (1 cân ký,
 *     2 theo gói) · 5 đơn giá · 15 tên · 64 mã tìm kiếm không dấu · 23–32 các
 *     ngày in trên tem (COT_NGAY; hạn dùng = cột 27 bật in + cột 32 số ngày,
 *     theo phần mềm TM-xA v3.10 của hãng). Cột khác giữ nguyên.
 *   - Giá ghi "mantissa,số-lẻ": "845,0" = 845; "1105,1" = 110,5. Cân hiện giá
 *     với Spec202 số lẻ; cân của quán để 3, nên 845 hiện "845.000" = 845.000đ.
 *     Cửa sổ đơn giá có 6 chữ số: tối đa 999.999đ/kg.
 *   - Phần TIM là giờ lúc lưu. Bỏ đi khi xuất để cân giữ nguyên đồng hồ.
 *   - Phần REP (nhật ký bán) và INF (thông tin máy) chỉ cân ghi ra; phần mềm
 *     của hãng không bao giờ gửi hai phần này xuống cân. Tuỳ chọn boPhanChiDoc
 *     bỏ chúng khi xuất (chưa thử trên cân thật).
 *
 * HẠN DÙNG (HSD) — chưa thử trên cân thật: lấy từ mã nguồn và sách hướng dẫn
 * của hãng. Cột 27 (PS_UD) = 1 thì cân in HSD = ngày in tem (đồng hồ cân) +
 * số ngày ở cột 32 (PC_UD, 0…999; 0 = hết hạn trong ngày); cột 27 = 0 thì
 * không in và cột 32 bị bỏ qua. Mẫu tem phải có ô "Hạn dùng" (tem 28 của quán
 * có). Không đụng cột 25/30 (ngày đóng gói): tem 28 in ngày đóng gói bằng ô
 * "Ngày in".
 *
 * QUA WIFI (thử trên cân thật 26/09/2026): gửi nguyên nội dung file này vào
 * cổng TCP 33571 của cân là cân nạp — nhưng chỉ THÊM và SỬA dòng PLU, không
 * xoá dòng vắng mặt (nạp USB thì thay cả danh sách). Chương trình gửi:
 * web/public/kho/can-wifi/Nap-Can-WiFi.ps1.
 *
 * NGUYÊN TẮC: dòng không đổi phải ghi lại y nguyên từng byte. File của một số
 * cân có byte không phải UTF-8, nên cả file được giữ dạng "chuỗi byte" (mỗi ký
 * tự = 1 byte); chỉ khi hiện tên lên màn hình hoặc ghi tên mới mới đổi qua lại
 * UTF-8.
 *
 * File thuần, không import gì lúc chạy (chỉ `import type`) — test Node nạp thẳng
 * được (xem test-kho-can.mjs), và bản HTML độc lập Beeftown_Can_TMA.html ở gốc
 * repo dùng đúng cách đọc này.
 *
 * Hai thứ tiếng: lỗi đọc file (LoiFileCan) mang thêm bản tiếng Anh (`en`); lý do
 * / cảnh báo trong kế hoạch theo tham số cuối `nn` của lapKeHoach (mặc định
 * tiếng Việt, như trước).
 */

import type { HaiThuTieng, NgonNguNB } from './chung.ts';

export const GIA_TOI_DA = 999999;      // cửa sổ đơn giá trên cân có 6 chữ số
export const TEN_TOI_DA = 40;          // dài hơn thì cắt bớt khi đưa lên cân
export const TEN_DAI = 24;             // dài hơn dễ bị cắt khi in trên tem
export const CO_FILE_TOI_DA = 5_000_000;

/** Hạn dùng tối đa cân nhận: cột 32 của dòng PLU là 0…999 ngày. */
export const HSD_TOI_DA = 999;

/**
 * Cột ngày của dòng PLU (chỉ số sau split('\t'), [0] = "PLU") — theo phần mềm
 * TM-xA của hãng. IN_* là công tắc in: ngày 0 không in / 1 in; giờ 0 không in /
 * 1 in giờ cố định / 2 in giờ lúc in. NGAY_* và SO_NGAY_HSD là số ngày cộng vào
 * ngày in tem (0…999); GIO_* là giờ cố định HHMM (0…2359).
 */
export const COT_NGAY = {
  IN_NGAY_BAN: 23, IN_GIO_BAN: 24, IN_NGAY_DONG_GOI: 25, IN_GIO_DONG_GOI: 26, IN_HSD: 27,
  NGAY_BAN: 28, GIO_BAN: 29, NGAY_DONG_GOI: 30, GIO_DONG_GOI: 31, SO_NGAY_HSD: 32,
} as const;

const CAC_PHAN = ['DPT', 'CLS', 'PLU', 'UNT', 'BAR', 'LAB', 'SAL', 'REP', 'SCP', 'TMS', 'TMT', 'INF', 'TIM'];
/** Chỉ hai dấu này mở một phần. CLR (xoá bảng), UPL (hỏi cân) thì không. */
const DAU_MO_PHAN = ['DWL', 'XD1'];
/** Phần chỉ cân ghi ra (nhật ký bán, thông tin máy) — bỏ khi boPhanChiDoc. */
const PHAN_CHI_DOC = ['REP', 'INF'];
const COT = { SO: 1, MA: 2, CACH_BAN: 4, GIA: 5, TEN: 15, TIM_KIEM: 64 };
// Dòng hàng 69 cột của firmware V3.14E8, rút từ file cân thật; {n} là các cột tự điền.
const KHUON_PLU = 'PLU\t{1}\t{2}\t\t{4}\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\t{64}\t0\t0\t0\t';

/**
 * Lỗi đọc file có câu báo cho người dùng — trang hiện nguyên câu này. message là
 * tiếng Việt (như trước), en là cùng câu bằng tiếng Anh.
 */
export class LoiFileCan extends Error {
  readonly en: string;
  constructor(vi: string, en: string = vi) {
    super(vi);
    this.en = en;
  }
}

/** LoiFileCan từ một câu hai thứ tiếng (để ném). */
function loiFile(c: HaiThuTieng): LoiFileCan {
  return new LoiFileCan(c.vi, c.en);
}

// -----------------------------------------------------------------------------
// CHUỖI BYTE
// -----------------------------------------------------------------------------
export function sangChuoiByte(u8: Uint8Array): string {
  let s = '';
  for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + 8192)));
  return s;
}

export function tuChuoiByte(s: string): Uint8Array<ArrayBuffer> {
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i) & 0xFF;
  return u8;
}

const UTF8 = new TextDecoder('utf-8');
const docChu = (s: string | undefined): string => UTF8.decode(tuChuoiByte(s ?? ''));
const ghiChu = (t: string): string => sangChuoiByte(new TextEncoder().encode(t));

/** File mang theo form xem trước dưới dạng base64 — không lưu lên máy chủ. */
export function sangBase64(u8: Uint8Array): string { return btoa(sangChuoiByte(u8)); }
export function tuBase64(s: string): Uint8Array<ArrayBuffer> {
  try { return tuChuoiByte(atob(s)); } catch {
    throw loiFile({ vi: 'File gửi kèm bị hỏng. Tải file từ cân lên lại.',
                en: 'The attached file is damaged. Upload the file from the scale again.' });
  }
}

// -----------------------------------------------------------------------------
// GIÁ, TÊN, MÃ
// -----------------------------------------------------------------------------
/** "845,0" với 3 số lẻ → 845000 đồng. Sai định dạng → null. */
export function giaTuFile(tho: string | undefined, soLe: number): number | null {
  const m = /^(-?\d+),(\d+)$/.exec(tho ?? '');
  if (!m) return null;
  const doi = soLe - parseInt(m[2], 10);
  const so = parseInt(m[1], 10);
  return doi >= 0 ? so * 10 ** doi : so / 10 ** -doi;
}

/** 845000 đồng với 3 số lẻ → "845,0" (dạng gọn như cân tự ghi). */
export function giaVaoFile(dong: number, soLe: number): string {
  let m = Math.round(dong), d = soLe;
  while (d > 0 && m % 10 === 0) { m /= 10; d--; }
  return `${m},${d}`;
}

/** "Sườn bò Hàn Quốc" → "suonbohanquoc" — cân dùng cột này để tìm hàng bằng phím chữ. */
export function maTimKiem(ten: string): string {
  return ten.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd')
    .toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
}

/** "012301" → "12301"; "0" hay rỗng → "" (không có mã). Khớp cách lưu kho_mat_hang.ma_can. */
export function chuanMa(ma: string | null | undefined): string {
  const s = String(ma ?? '').trim();
  return /^\d+$/.test(s) ? s.replace(/^0+/, '') : '';
}

/** Số chữ số mã hàng trong mẫu mã vạch (số chữ C). Mẫu trống → 5 (kiểu 2+5+5+1). */
export function soChuSoMa(mau: string | null | undefined): number {
  const n = (mau ?? '').split('').filter(c => c === 'C').length;
  return n > 0 ? n : 5;
}

/** Tên file trả về: giữ số A_xxx của file tải lên, còn lại là A_000.TMS. */
export function tenFileCan(ten: string | null | undefined): string {
  const m = /A_\d{3}/i.exec(ten ?? '');
  return (m ? m[0].toUpperCase() : 'A_000') + '.TMS';
}

const sachTen = (t: string): string => t.replace(/[\t\r\n]+/g, ' ').trim().normalize('NFC');

// -----------------------------------------------------------------------------
// HẠN DÙNG (chưa thử trên cân thật — xem đầu file)
// -----------------------------------------------------------------------------
/** Số nguyên kiểu phần mềm của hãng đọc: không phải số → 0. */
function soNguyenCan(s: string | undefined): number {
  const t = (s ?? '').trim();
  return /^[+-]?\d+$/.test(t) ? parseInt(t, 10) : 0;
}

/** Dòng đủ dài để có cột hạn dùng (dòng 69 cột của firmware luôn đủ). */
const coCotHsd = (cot: string[]): boolean => cot.length > COT_NGAY.SO_NGAY_HSD;

/** Số ngày hạn dùng cân nhận được: số nguyên 0…999. */
const hsdHopLe = (n: number): boolean => Number.isInteger(n) && n >= 0 && n <= HSD_TOI_DA;

/**
 * Hạn dùng đang ghi trên một dòng PLU (cột đã tách): cột 27 = 1 → số ngày ở
 * cột 32; cột 27 khác 1 (không in) hoặc dòng thiếu cột → null.
 */
export function dongHsd(cot: string[]): number | null {
  if (!coCotHsd(cot) || soNguyenCan(cot[COT_NGAY.IN_HSD]) !== 1) return null;
  return soNguyenCan(cot[COT_NGAY.SO_NGAY_HSD]);
}

/**
 * Ghi hạn dùng vào dòng PLU (sửa mảng cot tại chỗ). n = số ngày 0…999 → cột
 * 27 = 1, cột 32 = n (tem in HSD = ngày in + n). null → không in: 27 = 0,
 * 32 = 0. Số ngoài 0…999 (cân không nhận) cũng ghi là không in — lapKeHoach
 * báo cảnh báo trước khi tới đây. Dòng thiếu cột 32 thì để nguyên, không nối
 * thêm cột (nối thêm sẽ lệch cả dòng).
 */
export function datHsd(cot: string[], n: number | null): void {
  if (!coCotHsd(cot)) return;
  const inHsd = n !== null && hsdHopLe(n);
  cot[COT_NGAY.IN_HSD] = inHsd ? '1' : '0';
  cot[COT_NGAY.SO_NGAY_HSD] = inHsd ? String(n) : '0';
}

// -----------------------------------------------------------------------------
// ĐỌC FILE
// -----------------------------------------------------------------------------
export interface DongPlu {
  dong: number;          // vị trí trong file
  tho: string;           // nguyên dòng, dạng chuỗi byte
  cot: string[];
  so: number;
  ma: string;            // đã chuẩn hoá, "" nếu không có
  cachBan: string;
  gia: number | null;    // đồng
  ten: string;           // đã đổi sang chữ để hiện
  hsd: number | null;    // hạn dùng đang ghi (dongHsd): số ngày, null = không in
}

export interface FileCan {
  coBom: boolean;
  xuongDong: string;
  dong: string[];
  phan: Record<string, { dau: number; cuoi: number }>;
  soLeGia: number;
  phienBan: string;
  plu: DongPlu[];
}

export function docFileCan(u8: Uint8Array): FileCan {
  if (u8.length === 0) {
    throw loiFile({ vi: 'File rỗng. Lưu lại dữ liệu từ cân ra USB rồi tải lên lại.',
                en: 'The file is empty. Save the data from the scale to the USB stick again, then upload it.' });
  }
  if (u8.length > CO_FILE_TOI_DA) {
    throw loiFile({ vi: 'File quá lớn, không phải file dữ liệu của cân.',
                en: 'The file is too large — it is not a scale data file.' });
  }
  const coBom = u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF;
  const noiDung = sangChuoiByte(coBom ? u8.subarray(3) : u8);
  const xuongDong = noiDung.includes('\r\n') ? '\r\n' : '\n';
  const dong = noiDung.split(xuongDong);
  // File của phần mềm TM-xA: BOM + dòng trống rồi mới tới "ECS VER" — dòng
  // đầu tiên khác rỗng mới là dòng đầu file.
  const viTriDau = dong.findIndex(d => d !== '');
  const dau = viTriDau < 0 ? [] : dong[viTriDau].split('\t');
  if (dau[0] !== 'ECS' || dau[1] !== 'VER') {
    throw loiFile({ vi: 'Đây không phải file dữ liệu của cân. Chọn file A_000.TMS trong thư mục JHSCALE của USB.',
                en: 'This is not a scale data file. Choose the A_000.TMS file in the JHSCALE folder on the USB stick.' });
  }

  // Lệnh xoá cả bảng khác PLU (phần mềm TM-xA tích "Clear Data"): CLR TMS / TMT đặt lại cả thông số và chữ
  // cài đặt của cân, kể cả WiFi — file như vậy không dùng làm file gốc, không đưa xuống cân.
  for (let i = viTriDau + 1; i < dong.length; i++) {
    const c = dong[i].split('\t');
    if (c[0] === 'CLR' && c[1] !== 'PLU' && c[1] !== 'END') {
      throw loiFile({ vi: 'File này do phần mềm của hãng (TM-xA) tạo với lệnh xoá dữ liệu ("Clear Data") — gửi xuống cân sẽ xoá cả thông số, chữ cài đặt (có WiFi) của cân, nên không dùng được. Trên cân lưu dữ liệu ra USB (Amend) rồi chọn file A_000.TMS trong thư mục JHSCALE.',
                      en: 'This file was made by the vendor software (TM-xA) with "Clear Data" — sending it would wipe the scale\'s settings and texts (including WiFi), so it cannot be used. Save the data from the scale to the USB stick (Amend) and choose the A_000.TMS file in the JHSCALE folder.' });
    }
  }

  // Phần xuất hiện nhiều lần thì lấy lần sau cùng (như trước).
  const phan: Record<string, { dau: number; cuoi: number }> = {};
  for (const k of quetPhan(dong, viTriDau + 1)) phan[k.ten] = { dau: k.dau, cuoi: k.cuoi };
  if (!phan.PLU) {
    throw loiFile({ vi: 'File không có phần hàng hoá (PLU). Lưu lại dữ liệu từ cân ra USB rồi tải lên lại.',
                en: 'The file has no items section (PLU). Save the data from the scale to the USB stick again, then upload it.' });
  }

  const spec: Record<number, string> = {};
  if (phan.TMS) {
    for (let i = phan.TMS.dau + 1; i < phan.TMS.cuoi; i++) {
      const c = dong[i].split('\t');
      if (c[0] === 'TMS') spec[parseInt(c[1], 10)] = c[2];
    }
  }
  const soLe = (v: string | undefined) => (v !== undefined && /^\d$/.test(v) ? parseInt(v, 10) : null);
  const soLeGia = soLe(spec[202]) ?? soLe(spec[203]) ?? 3;

  const plu: DongPlu[] = [];
  for (let i = phan.PLU.dau + 1; i < phan.PLU.cuoi; i++) {
    if (!dong[i].startsWith('PLU\t')) continue;
    const cot = dong[i].split('\t');
    plu.push({
      dong: i, tho: dong[i], cot,
      so: parseInt(cot[COT.SO], 10) || 0,
      ma: chuanMa(cot[COT.MA]),
      cachBan: cot[COT.CACH_BAN] ?? '1',
      gia: giaTuFile(cot[COT.GIA], soLeGia),
      ten: docChu(cot[COT.TEN]),
      hsd: dongHsd(cot),
    });
  }
  return { coBom, xuongDong, dong, phan, soLeGia, phienBan: dau[2] ?? '', plu };
}

/**
 * Mọi phần trong file, theo thứ tự, từ dòng `tu`: mở bằng "DWL<tab>TÊN<tab>"
 * (hay "XD1"), đóng bằng "END<tab>TÊN<tab>" cùng tên. Đang mở một phần thì
 * dòng mở khác bị bỏ qua; phần không có dòng END thì không tính.
 */
function quetPhan(dong: string[], tu: number): { ten: string; dau: number; cuoi: number }[] {
  const ra: { ten: string; dau: number; cuoi: number }[] = [];
  let mo: { ten: string; dau: number } | null = null;
  for (let i = tu; i < dong.length; i++) {
    const c = dong[i].split('\t');
    if (c[0] === 'END') {
      if (mo && c[1] === mo.ten) { ra.push({ ten: mo.ten, dau: mo.dau, cuoi: i }); mo = null; }
    } else if (!mo && c.length === 3 && c[2] === '' && DAU_MO_PHAN.includes(c[0]) && CAC_PHAN.includes(c[1])) {
      mo = { ten: c[1], dau: i };
    }
  }
  return ra;
}

// -----------------------------------------------------------------------------
// LẬP KẾ HOẠCH ĐỒNG BỘ
// -----------------------------------------------------------------------------
/** Phần của kho_mat_hang cần cho cân (MatHang ở danh-muc.ts có đủ các cột này). */
export interface HangKho {
  ma: string;
  ma_can: string | null;
  ten: string;
  gia_ban_kg: number | null;
  dang_dung: boolean;
  /**
   * Hạn dùng in trên tem, số ngày tính từ ngày in (kho_mat_hang.han_dung_ngay).
   *   undefined (không có khoá) — không quản HSD: cột ngày trên cân giữ nguyên, như cũ;
   *   null — không in HSD (cột 27 = 0, cột 32 = 0);
   *   n — in HSD = ngày in + n (cột 27 = 1, cột 32 = n); n > 999 thì không in, kèm cảnh báo.
   * Chưa thử trên cân thật.
   */
  han_dung_ngay?: number | null;
}

export interface TuyChonDongBo {
  /** Hàng đang có trên cân nhưng không có trong kho: giữ lại thay vì xoá. */
  giuHangNgoaiKho: boolean;
  /** Bỏ phần giờ trong file để cân giữ nguyên đồng hồ khi nạp. */
  giuGioCan: boolean;
  /** Số chữ số mã hàng trong mẫu mã vạch (thường 5). */
  soChuSoMa: number;
  /**
   * Bỏ hẳn phần REP (nhật ký bán) và INF (thông tin máy) khi ghi file — từ
   * dòng DWL tới dòng END và dòng trống ngay sau, như cách bỏ phần giờ. Phần
   * mềm TM-xA của hãng không bao giờ ghi hai phần này vào file gửi cân, và gửi
   * lại nhật ký bán cũ có thể đè nhật ký mới trên cân. Mặc định false: file ra
   * y như cũ. Chưa thử trên cân thật.
   */
  boPhanChiDoc?: boolean;
}

export type LoaiDong = 'them' | 'sua' | 'giu' | 'xoa' | 'ngoai_kho' | 'bo_qua';

export interface DongKeHoach {
  loai: LoaiDong;
  so: number | null;            // số PLU trên cân sau khi nạp (null: không có trên cân)
  maCan: string;
  ten: string;
  gia: number | null;
  maKho?: string;               // kho_mat_hang.ma
  tenCu?: string;
  giaCu?: number | null;
  lyDo?: string;                // vì sao bỏ qua / giữ nguyên / xoá
  canhBao?: string;
  /**
   * Chỉ có khi hàng kho quản HSD (han_dung_ngay khác undefined): hạn dùng sau
   * khi nạp (số ngày, null = không in) và hạn dùng đang ghi trên cân (hsdCu,
   * chỉ khi hàng đã có trên cân).
   */
  hsd?: number | null;
  hsdCu?: number | null;
  /** Dòng PLU gốc trên cân (khi có). */
  goc?: DongPlu;
}

export interface KeHoach {
  dong: DongKeHoach[];          // theo số PLU; hàng bỏ qua xếp cuối
  dem: Record<LoaiDong, number>;
  coThayDoi: boolean;
}

/** hsd: undefined = không quản HSD; null = không in; số = số ngày. */
interface HangHopLe { hang: HangKho; ma: string; ten: string; gia: number; hsd?: number | null; canhBao?: string }

/** Hạn dùng của hàng kho → giá trị ghi lên cân, kèm cảnh báo khi cân không nhận được. */
function kiemHsd(h: HangKho, nn: NgonNguNB): { hsd?: number | null; canhBao?: string } {
  const c = (x: HaiThuTieng) => x[nn];
  const n = h.han_dung_ngay;
  if (n === undefined) return {};
  if (n === null || hsdHopLe(n)) return { hsd: n };
  if (Number.isInteger(n) && n > HSD_TOI_DA) {
    return { hsd: null, canhBao: c({
      vi: `Hạn dùng ${n.toLocaleString('vi-VN')} ngày vượt mức cân nhận (${HSD_TOI_DA} ngày) — tem sẽ không in HSD.`,
      en: `A use-by of ${n.toLocaleString('en-US')} days is more than the scale accepts (${HSD_TOI_DA} days) — the label will not print a use-by date.` }) };
  }
  return { hsd: null, canhBao: c({ vi: `Hạn dùng "${n}" không hợp lệ — tem sẽ không in HSD.`,
                                   en: `The use-by "${n}" is not valid — the label will not print a use-by date.` }) };
}

function kiemHang(h: HangKho, soChuSo: number, nn: NgonNguNB): { ok: true; v: HangHopLe } | { ok: false; lyDo: string } {
  const c = (x: HaiThuTieng) => x[nn];
  const ma = chuanMa(h.ma_can);
  if (ma.length > soChuSo) {
    return { ok: false, lyDo: c({ vi: `Mã cân ${ma} dài quá ${soChuSo} số — mã vạch trên tem không chứa hết.`,
                                   en: `Scale code ${ma} is longer than ${soChuSo} digits — the barcode on the label cannot hold it.` }) };
  }
  if (h.gia_ban_kg === null || h.gia_ban_kg === undefined) return { ok: false, lyDo: c({ vi: 'Chưa có giá bán/kg.', en: 'No sale price/kg yet.' }) };
  if (!(h.gia_ban_kg > 0)) return { ok: false, lyDo: c({ vi: 'Giá bán/kg đang là 0 đ.', en: 'The sale price/kg is 0 ₫.' }) };
  if (h.gia_ban_kg > GIA_TOI_DA) {
    return { ok: false, lyDo: c({ vi: `Giá ${h.gia_ban_kg.toLocaleString('vi-VN')} đ/kg vượt mức cân hiện được (999.999 đ).`,
                                   en: `The price ${h.gia_ban_kg.toLocaleString('en-US')} ₫/kg is more than the scale can show (999,999 ₫).` }) };
  }
  let ten = sachTen(h.ten);
  let canhBao: string | undefined;
  if ([...ten].length > TEN_TOI_DA) {
    ten = [...ten].slice(0, TEN_TOI_DA).join('').trim();
    canhBao = c({ vi: `Tên dài quá ${TEN_TOI_DA} ký tự, đã cắt còn "${ten}".`,
                  en: `Name longer than ${TEN_TOI_DA} characters, shortened to "${ten}".` });
  } else if ([...ten].length > TEN_DAI) {
    canhBao = c({ vi: 'Tên dài, có thể bị cắt khi in trên tem.', en: 'Long name — it may be cut off when printed on the label.' });
  }
  const hsd = kiemHsd(h, nn);
  if (hsd.canhBao) canhBao = canhBao ? `${canhBao} ${hsd.canhBao}` : hsd.canhBao;
  const v: HangHopLe = { hang: h, ma, ten, gia: Math.round(h.gia_ban_kg), canhBao };
  if (hsd.hsd !== undefined) v.hsd = hsd.hsd;
  return { ok: true, v };
}

/**
 * So danh mục kho với hàng đang có trên cân.
 *  - Khớp theo mã cân. Hàng khớp giữ nguyên số PLU (phím gọi hàng không đổi).
 *  - Hàng mới lấy số PLU trống nhỏ nhất, xếp theo mã cân — PLU 1–47 có phím tắt.
 *  - Hàng trên cân không có trong kho bị xoá (trừ khi chọn giữ lại).
 *  - Hàng kho thiếu giá, giá quá mức hay mã quá dài: không đưa lên cân; nếu
 *    đã có trên cân thì để nguyên dòng cũ và báo lý do.
 *  - Hạn dùng: chỉ hàng kho có khoá han_dung_ngay mới được so và ghi; đổi HSD
 *    là "sua". Hàng không có khoá đó: cột ngày trên cân giữ nguyên như cũ.
 * nn chỉ đổi câu lý do / cảnh báo; số PLU, tên, giá ghi vào file không đổi.
 */
export function lapKeHoach(file: FileCan, danhMuc: HangKho[], tuy: TuyChonDongBo, nn: NgonNguNB = 'vi'): KeHoach {
  const c = (x: HaiThuTieng) => x[nn];
  const hopLe = new Map<string, HangHopLe>();
  const loiTheoMa = new Map<string, { hang: HangKho; lyDo: string }>();
  for (const h of danhMuc) {
    if (!h.dang_dung) continue;
    const ma = chuanMa(h.ma_can);
    if (!ma) continue;
    const kq = kiemHang(h, tuy.soChuSoMa, nn);
    if (kq.ok) hopLe.set(ma, kq.v); else loiTheoMa.set(ma, { hang: h, lyDo: kq.lyDo });
  }

  const ra: DongKeHoach[] = [];
  const daKhop = new Set<string>();
  const soDaDung = new Set<number>();

  for (const p of file.plu) {
    const hang = p.ma ? hopLe.get(p.ma) : undefined;
    const loi = p.ma ? loiTheoMa.get(p.ma) : undefined;
    if (hang && !daKhop.has(p.ma)) {
      daKhop.add(p.ma);
      soDaDung.add(p.so);
      // Dòng thiếu cột 32 (không gặp ở firmware thật) thì không ghi được HSD — coi như không quản.
      const quanHsd = hang.hsd !== undefined && coCotHsd(p.cot);
      const doi = p.ten !== hang.ten || p.gia !== hang.gia || p.cachBan !== '1' || (quanHsd && p.hsd !== hang.hsd);
      const d: DongKeHoach = { loai: doi ? 'sua' : 'giu', so: p.so, maCan: p.ma, ten: hang.ten, gia: hang.gia, maKho: hang.hang.ma,
        tenCu: p.ten, giaCu: p.gia, canhBao: hang.canhBao, goc: p };
      if (quanHsd) { d.hsd = hang.hsd; d.hsdCu = p.hsd; }
      ra.push(d);
    } else if (loi && !daKhop.has(p.ma)) {
      daKhop.add(p.ma);
      soDaDung.add(p.so);
      ra.push({ loai: 'giu', so: p.so, maCan: p.ma, ten: p.ten, gia: p.gia, maKho: loi.hang.ma,
        lyDo: c({ vi: `Để nguyên trên cân: ${loi.lyDo}`, en: `Left as it is on the scale: ${loi.lyDo}` }), goc: p });
    } else if (p.ma && daKhop.has(p.ma)) {
      ra.push({ loai: 'xoa', so: p.so, maCan: p.ma, ten: p.ten, gia: p.gia,
        lyDo: c({ vi: 'Trùng mã cân với một dòng khác trên cân.', en: 'Same scale code as another line on the scale.' }), goc: p });
    } else if (tuy.giuHangNgoaiKho) {
      soDaDung.add(p.so);
      ra.push({ loai: 'ngoai_kho', so: p.so, maCan: p.ma, ten: p.ten, gia: p.gia,
        lyDo: c({ vi: 'Không có trong kho — giữ lại theo lựa chọn.', en: 'Not in inventory — kept, as you chose.' }), goc: p });
    } else {
      ra.push({ loai: 'xoa', so: p.so, maCan: p.ma, ten: p.ten, gia: p.gia,
        lyDo: p.ma
          ? c({ vi: 'Không có mặt hàng nào đang dùng mang mã cân này trong kho.', en: 'No active item in inventory has this scale code.' })
          : c({ vi: 'Không có mã cân.', en: 'No scale code.' }),
        goc: p });
    }
  }

  const moi = [...hopLe.values()].filter(h => !daKhop.has(h.ma)).sort((a, b) => Number(a.ma) - Number(b.ma));
  const khuonCoHsd = coCotHsd(cotMoi(file));
  let soKe = 1;
  for (const h of moi) {
    while (soDaDung.has(soKe)) soKe++;
    soDaDung.add(soKe);
    const d: DongKeHoach = { loai: 'them', so: soKe, maCan: h.ma, ten: h.ten, gia: h.gia, maKho: h.hang.ma, canhBao: h.canhBao };
    if (h.hsd !== undefined && khuonCoHsd) d.hsd = h.hsd;
    ra.push(d);
  }

  for (const [ma, loi] of loiTheoMa) {
    if (daKhop.has(ma)) continue;
    ra.push({ loai: 'bo_qua', so: null, maCan: ma, ten: sachTen(loi.hang.ten), gia: loi.hang.gia_ban_kg, maKho: loi.hang.ma,
      lyDo: c({ vi: `Không đưa lên cân: ${loi.lyDo}`, en: `Not sent to the scale: ${loi.lyDo}` }) });
  }

  ra.sort((a, b) => (a.so ?? Infinity) - (b.so ?? Infinity) || Number(a.maCan) - Number(b.maCan));
  const dem: Record<LoaiDong, number> = { them: 0, sua: 0, giu: 0, xoa: 0, ngoai_kho: 0, bo_qua: 0 };
  for (const d of ra) dem[d.loai]++;
  return { dong: ra, dem, coThayDoi: dem.them + dem.sua + dem.xoa > 0 };
}

// -----------------------------------------------------------------------------
// GHI FILE
// -----------------------------------------------------------------------------
/**
 * Khuôn cho dòng hàng mới. File không phải 69 cột thì chép dòng PLU đầu, nhưng
 * bỏ các ngày in trên tem của món đó (cột 23–32 về 0, như khuôn 69 cột) — không
 * thì hàng mới in HSD / ngày đóng gói của món 1 mà xem trước báo "không in".
 */
function cotMoi(file: FileCan): string[] {
  const co69 = file.plu.length === 0 || file.plu.some(p => p.cot.length === 69);
  if (co69) return KHUON_PLU.split('\t');
  const c = file.plu[0].cot.slice();
  for (let i = COT_NGAY.IN_NGAY_BAN; i <= COT_NGAY.SO_NGAY_HSD && i < c.length; i++) c[i] = '0';
  return c;
}

function dongPlu(d: DongKeHoach, file: FileCan): string | null {
  if (d.loai === 'xoa' || d.loai === 'bo_qua') return null;
  if ((d.loai === 'giu' || d.loai === 'ngoai_kho') && d.goc) return d.goc.tho;
  const goc = d.goc;
  const c = goc ? goc.cot.slice() : cotMoi(file);
  c[COT.SO] = String(d.so);
  if (!goc || goc.ma !== d.maCan) c[COT.MA] = d.maCan;
  c[COT.CACH_BAN] = '1';
  if (!goc || goc.gia !== d.gia) c[COT.GIA] = giaVaoFile(d.gia ?? 0, file.soLeGia);
  if (!goc || goc.ten !== d.ten) {
    c[COT.TEN] = ghiChu(d.ten);
    if (c.length > COT.TIM_KIEM) c[COT.TIM_KIEM] = maTimKiem(d.ten);
  }
  // Hạn dùng: chỉ khi hàng kho quản HSD và giá trị khác trên cân. Cột 25/30
  // (ngày đóng gói) không đụng tới.
  if (d.hsd !== undefined && (!goc || goc.hsd !== d.hsd)) datHsd(c, d.hsd);
  return c.join('\t');
}

/**
 * Dựng file .TMS mới theo kế hoạch. Không có thay đổi thì phần PLU giữ y thứ tự cũ.
 * giuGioCan bỏ phần TIM; boPhanChiDoc bỏ mọi phần REP và INF. Dòng lệnh xoá
 * cả bảng ("CLR<tab>X<tab>", "CLR<tab>END<tab>" — phần mềm hãng ghi khi tích
 * "Clear Data") luôn bị bỏ: file này đi xuống cân qua 33571, USB, dây, trang
 * web, và gửi lại lệnh xoá là xoá bảng của cân mỗi lần gửi (CAN-TMA §2.5 quy
 * tắc 4). Mọi dòng khác (kể cả dòng trống đầu file) giữ y nguyên từng byte —
 * file cân tự lưu không có dòng CLR nên ra y như trước.
 */
export function ghiFileCan(file: FileCan, kh: KeHoach,
                           tuy: Pick<TuyChonDongBo, 'giuGioCan' | 'boPhanChiDoc'>): Uint8Array<ArrayBuffer> {
  const dongPluMoi = kh.coThayDoi
    ? kh.dong.map(d => dongPlu(d, file)).filter((x): x is string => x !== null)
    : file.plu.map(p => p.tho);

  const L = file.dong, P = file.phan.PLU;
  // Dòng bỏ đi: cả khối DWL…END và một dòng trống ngay sau (trừ dòng cuối file).
  const bo = new Set<number>();
  const boKhoi = (k: { dau: number; cuoi: number }) => {
    for (let i = k.dau; i <= k.cuoi; i++) bo.add(i);
    if (L[k.cuoi + 1] === '' && k.cuoi + 1 !== L.length - 1) bo.add(k.cuoi + 1);
  };
  // Mọi khối TIM, không chỉ khối cuối (file.phan giữ lần sau cùng): gửi lại một khối giờ cũ là lùi đồng hồ cân.
  for (const k of quetPhan(L, 0)) {
    if ((tuy.giuGioCan && k.ten === 'TIM') || (tuy.boPhanChiDoc && PHAN_CHI_DOC.includes(k.ten))) boKhoi(k);
  }

  const ra: string[] = [];
  for (let i = 0; i < L.length; i++) {
    if (bo.has(i)) continue;
    if (L[i].startsWith('CLR\t')) continue;   // CLR<tab>X<tab>, CLR<tab>END<tab>: không bao giờ gửi lại lệnh xoá bảng
    if (i > P.dau && i < P.cuoi && L[i].startsWith('PLU\t')) continue;
    ra.push(L[i]);
    if (i === P.dau) ra.push(...dongPluMoi);
  }
  const than = tuChuoiByte(ra.join(file.xuongDong));
  if (!file.coBom) return than;
  const coBom = new Uint8Array(than.length + 3);
  coBom.set([0xEF, 0xBB, 0xBF]);
  coBom.set(than, 3);
  return coBom;
}
