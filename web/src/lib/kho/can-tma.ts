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
 *     "DWL<tab>TÊN<tab>" (đời V3.15 dùng "XD1") và đóng bằng "END<tab>TÊN<tab>".
 *   - Dòng PLU: cột 1 số PLU · 2 mã hàng (= ma_can) · 4 cách bán (1 cân ký,
 *     2 theo gói) · 5 đơn giá · 15 tên · 64 mã tìm kiếm không dấu. Cột khác
 *     chưa rõ nghĩa (trong đó có hạn dùng) — giữ nguyên.
 *   - Giá ghi "mantissa,số-lẻ": "845,0" = 845; "1105,1" = 110,5. Cân hiện giá
 *     với Spec202 số lẻ; cân của quán để 3, nên 845 hiện "845.000" = 845.000đ.
 *     Cửa sổ đơn giá có 6 chữ số: tối đa 999.999đ/kg.
 *   - Phần TIM là giờ lúc lưu. Bỏ đi khi xuất để cân giữ nguyên đồng hồ.
 *
 * NGUYÊN TẮC: dòng không đổi phải ghi lại y nguyên từng byte. File của một số
 * cân có byte không phải UTF-8, nên cả file được giữ dạng "chuỗi byte" (mỗi ký
 * tự = 1 byte); chỉ khi hiện tên lên màn hình hoặc ghi tên mới mới đổi qua lại
 * UTF-8.
 *
 * File thuần, không import gì — test Node nạp thẳng được (xem test-kho-can.mjs),
 * và bản HTML độc lập cong-cu/Beeftown_Can_TMA.html dùng đúng cách đọc này.
 */

export const GIA_TOI_DA = 999999;      // cửa sổ đơn giá trên cân có 6 chữ số
export const TEN_TOI_DA = 40;          // dài hơn thì cắt bớt khi đưa lên cân
export const TEN_DAI = 24;             // dài hơn dễ bị cắt khi in trên tem
export const CO_FILE_TOI_DA = 5_000_000;

const CAC_PHAN = ['DPT', 'CLS', 'PLU', 'UNT', 'BAR', 'LAB', 'SAL', 'REP', 'SCP', 'TMS', 'TMT', 'INF', 'TIM'];
const COT = { SO: 1, MA: 2, CACH_BAN: 4, GIA: 5, TEN: 15, TIM_KIEM: 64 };
// Dòng hàng 69 cột của firmware V3.14E8, rút từ file cân thật; {n} là các cột tự điền.
const KHUON_PLU = 'PLU\t{1}\t{2}\t\t{4}\t{5}\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t9\t{15}\t\t\t\t\t\t\t\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t127\t0,0\t0,0\t0,0\t0\t0\t0\t0\t0\t0\t0\t{64}\t0\t0\t0\t';

/** Lỗi đọc file có câu báo cho người dùng — trang hiện nguyên câu này. */
export class LoiFileCan extends Error {}

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
  try { return tuChuoiByte(atob(s)); } catch { throw new LoiFileCan('File gửi kèm bị hỏng. Tải file từ cân lên lại.'); }
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
  if (u8.length === 0) throw new LoiFileCan('File rỗng. Lưu lại dữ liệu từ cân ra USB rồi tải lên lại.');
  if (u8.length > CO_FILE_TOI_DA) throw new LoiFileCan('File quá lớn, không phải file dữ liệu của cân.');
  const coBom = u8[0] === 0xEF && u8[1] === 0xBB && u8[2] === 0xBF;
  const noiDung = sangChuoiByte(coBom ? u8.subarray(3) : u8);
  const xuongDong = noiDung.includes('\r\n') ? '\r\n' : '\n';
  const dong = noiDung.split(xuongDong);
  const dau = dong[0].split('\t');
  if (dau[0] !== 'ECS' || dau[1] !== 'VER') {
    throw new LoiFileCan('Đây không phải file dữ liệu của cân. Chọn file A_000.TMS trong thư mục JHSCALE của USB.');
  }

  const phan: Record<string, { dau: number; cuoi: number }> = {};
  let mo: { ten: string; dau: number } | null = null;
  for (let i = 1; i < dong.length; i++) {
    const c = dong[i].split('\t');
    if (c[0] === 'END') {
      if (mo && c[1] === mo.ten) { phan[mo.ten] = { dau: mo.dau, cuoi: i }; mo = null; }
    } else if (!mo && c.length === 3 && c[2] === '' && CAC_PHAN.includes(c[1]) && c[0] !== c[1]) {
      mo = { ten: c[1], dau: i };
    }
  }
  if (!phan.PLU) throw new LoiFileCan('File không có phần hàng hoá (PLU). Lưu lại dữ liệu từ cân ra USB rồi tải lên lại.');

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
    });
  }
  return { coBom, xuongDong, dong, phan, soLeGia, phienBan: dau[2] ?? '', plu };
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
}

export interface TuyChonDongBo {
  /** Hàng đang có trên cân nhưng không có trong kho: giữ lại thay vì xoá. */
  giuHangNgoaiKho: boolean;
  /** Bỏ phần giờ trong file để cân giữ nguyên đồng hồ khi nạp. */
  giuGioCan: boolean;
  /** Số chữ số mã hàng trong mẫu mã vạch (thường 5). */
  soChuSoMa: number;
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
  /** Dòng PLU gốc trên cân (khi có). */
  goc?: DongPlu;
}

export interface KeHoach {
  dong: DongKeHoach[];          // theo số PLU; hàng bỏ qua xếp cuối
  dem: Record<LoaiDong, number>;
  coThayDoi: boolean;
}

interface HangHopLe { hang: HangKho; ma: string; ten: string; gia: number; canhBao?: string }

function kiemHang(h: HangKho, soChuSo: number): { ok: true; v: HangHopLe } | { ok: false; lyDo: string } {
  const ma = chuanMa(h.ma_can);
  if (ma.length > soChuSo) return { ok: false, lyDo: `Mã cân ${ma} dài quá ${soChuSo} số — mã vạch trên tem không chứa hết.` };
  if (h.gia_ban_kg === null || h.gia_ban_kg === undefined) return { ok: false, lyDo: 'Chưa có giá bán/kg.' };
  if (!(h.gia_ban_kg > 0)) return { ok: false, lyDo: 'Giá bán/kg đang là 0 đ.' };
  if (h.gia_ban_kg > GIA_TOI_DA) return { ok: false, lyDo: `Giá ${h.gia_ban_kg.toLocaleString('vi-VN')} đ/kg vượt mức cân hiện được (999.999 đ).` };
  let ten = sachTen(h.ten);
  let canhBao: string | undefined;
  if ([...ten].length > TEN_TOI_DA) {
    ten = [...ten].slice(0, TEN_TOI_DA).join('').trim();
    canhBao = `Tên dài quá ${TEN_TOI_DA} ký tự, đã cắt còn "${ten}".`;
  } else if ([...ten].length > TEN_DAI) {
    canhBao = 'Tên dài, có thể bị cắt khi in trên tem.';
  }
  return { ok: true, v: { hang: h, ma, ten, gia: Math.round(h.gia_ban_kg), canhBao } };
}

/**
 * So danh mục kho với hàng đang có trên cân.
 *  - Khớp theo mã cân. Hàng khớp giữ nguyên số PLU (phím gọi hàng không đổi).
 *  - Hàng mới lấy số PLU trống nhỏ nhất, xếp theo mã cân — PLU 1–47 có phím tắt.
 *  - Hàng trên cân không có trong kho bị xoá (trừ khi chọn giữ lại).
 *  - Hàng kho thiếu giá, giá quá mức hay mã quá dài: không đưa lên cân; nếu
 *    đã có trên cân thì để nguyên dòng cũ và báo lý do.
 */
export function lapKeHoach(file: FileCan, danhMuc: HangKho[], tuy: TuyChonDongBo): KeHoach {
  const hopLe = new Map<string, HangHopLe>();
  const loiTheoMa = new Map<string, { hang: HangKho; lyDo: string }>();
  for (const h of danhMuc) {
    if (!h.dang_dung) continue;
    const ma = chuanMa(h.ma_can);
    if (!ma) continue;
    const kq = kiemHang(h, tuy.soChuSoMa);
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
      const doi = p.ten !== hang.ten || p.gia !== hang.gia || p.cachBan !== '1';
      ra.push({ loai: doi ? 'sua' : 'giu', so: p.so, maCan: p.ma, ten: hang.ten, gia: hang.gia, maKho: hang.hang.ma,
        tenCu: p.ten, giaCu: p.gia, canhBao: hang.canhBao, goc: p });
    } else if (loi && !daKhop.has(p.ma)) {
      daKhop.add(p.ma);
      soDaDung.add(p.so);
      ra.push({ loai: 'giu', so: p.so, maCan: p.ma, ten: p.ten, gia: p.gia, maKho: loi.hang.ma,
        lyDo: `Để nguyên trên cân: ${loi.lyDo}`, goc: p });
    } else if (p.ma && daKhop.has(p.ma)) {
      ra.push({ loai: 'xoa', so: p.so, maCan: p.ma, ten: p.ten, gia: p.gia, lyDo: 'Trùng mã cân với một dòng khác trên cân.', goc: p });
    } else if (tuy.giuHangNgoaiKho) {
      soDaDung.add(p.so);
      ra.push({ loai: 'ngoai_kho', so: p.so, maCan: p.ma, ten: p.ten, gia: p.gia, lyDo: 'Không có trong kho — giữ lại theo lựa chọn.', goc: p });
    } else {
      ra.push({ loai: 'xoa', so: p.so, maCan: p.ma, ten: p.ten, gia: p.gia,
        lyDo: p.ma ? 'Không có mặt hàng nào đang dùng mang mã cân này trong kho.' : 'Không có mã cân.', goc: p });
    }
  }

  const moi = [...hopLe.values()].filter(h => !daKhop.has(h.ma)).sort((a, b) => Number(a.ma) - Number(b.ma));
  let soKe = 1;
  for (const h of moi) {
    while (soDaDung.has(soKe)) soKe++;
    soDaDung.add(soKe);
    ra.push({ loai: 'them', so: soKe, maCan: h.ma, ten: h.ten, gia: h.gia, maKho: h.hang.ma, canhBao: h.canhBao });
  }

  for (const [ma, loi] of loiTheoMa) {
    if (daKhop.has(ma)) continue;
    ra.push({ loai: 'bo_qua', so: null, maCan: ma, ten: sachTen(loi.hang.ten), gia: loi.hang.gia_ban_kg, maKho: loi.hang.ma,
      lyDo: `Không đưa lên cân: ${loi.lyDo}` });
  }

  ra.sort((a, b) => (a.so ?? Infinity) - (b.so ?? Infinity) || Number(a.maCan) - Number(b.maCan));
  const dem: Record<LoaiDong, number> = { them: 0, sua: 0, giu: 0, xoa: 0, ngoai_kho: 0, bo_qua: 0 };
  for (const d of ra) dem[d.loai]++;
  return { dong: ra, dem, coThayDoi: dem.them + dem.sua + dem.xoa > 0 };
}

// -----------------------------------------------------------------------------
// GHI FILE
// -----------------------------------------------------------------------------
function cotMoi(file: FileCan): string[] {
  const co69 = file.plu.length === 0 || file.plu.some(p => p.cot.length === 69);
  return co69 ? KHUON_PLU.split('\t') : file.plu[0].cot.slice();
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
  return c.join('\t');
}

/** Dựng file .TMS mới theo kế hoạch. Không có thay đổi thì phần PLU giữ y thứ tự cũ. */
export function ghiFileCan(file: FileCan, kh: KeHoach, tuy: Pick<TuyChonDongBo, 'giuGioCan'>): Uint8Array<ArrayBuffer> {
  const dongPluMoi = kh.coThayDoi
    ? kh.dong.map(d => dongPlu(d, file)).filter((x): x is string => x !== null)
    : file.plu.map(p => p.tho);

  const L = file.dong, P = file.phan.PLU, T = tuy.giuGioCan ? file.phan.TIM : undefined;
  const ra: string[] = [];
  for (let i = 0; i < L.length; i++) {
    if (T && i >= T.dau && i <= T.cuoi) continue;
    if (T && i === T.cuoi + 1 && L[i] === '' && i !== L.length - 1) continue;
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
