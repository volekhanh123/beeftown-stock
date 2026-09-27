/**
 * BEEFTOWN CÂN — MẪU TEM VÀ PHÍM TẮT TRONG FILE .TMS
 *
 * Cách đọc giống bản HTML độc lập Beeftown_Can_TMA.html (đã đối chiếu file cân
 * thật, firmware V3.14E8):
 *   - Phần LAB có nhiều mẫu tem. Mỗi mẫu: một dòng LAB, các dòng LAS (mỗi dòng
 *     là một ô in trên tem), rồi dòng LAE.
 *   - Dòng LAB: cột 1 số mẫu · 2 tên · 3 "1" = dùng được · 4 rộng mm · 5 cao mm ·
 *     từ cột 6 là các chữ cố định in trên tem (cột 22 là cờ, không phải chữ).
 *   - Dòng LAS: cột 2 loại ô (0 mã vạch, 1 dữ liệu của hàng, 2 số tính lúc in,
 *     3 chữ cố định) · 3 số thứ tự chữ / loại số tính · 4 loại dữ liệu ·
 *     5 điều kiện (2 chỉ hàng cân ký, 3 chỉ hàng theo gói) · 9–12 vị trí x, y,
 *     rộng, cao tính bằng chấm (8 chấm/mm).
 *   - Phần TMS dòng số 0 cho biết cân đang in bằng mẫu số mấy.
 *   - Phần SCP: phím tắt tầng 1 — phím số k gọi PLU nào.
 *
 * Chỉnh tem ở đây gồm hai việc: sửa chữ cố định trên dòng LAB, và tắt / bật ô
 * (bỏ / trả lại dòng LAS). Dòng LAS bị tắt được nhớ trong tem-da-tat.json để
 * bật lại được. Dòng nào không đổi thì giữ y nguyên từng byte.
 */
import { docFileCan, sangChuoiByte, tuChuoiByte, type FileCan } from '../../web/src/lib/kho/can-tma.ts';

const UTF8 = new TextDecoder('utf-8');
const docChu = (s: string | undefined) => UTF8.decode(tuChuoiByte(s ?? ''));
const ghiChu = (t: string) => sangChuoiByte(new TextEncoder().encode(t));
const soNguyen = (v: string | undefined, macDinh: number) => { const n = parseInt(v ?? '', 10); return Number.isFinite(n) ? n : macDinh; };

export const CHU_TEM_TOI_DA = 40;

/** Ô chữ số t trên tem nằm ở cột nào của dòng LAB (cột 22 là cờ, không phải chữ). */
export const cotChu = (t: number) => (t < 16 ? 6 + t : 7 + t);

export interface OTem {
  tho: string;          // nguyên dòng LAS, dạng chuỗi byte
  loai: string;         // '0' mã vạch · '1' dữ liệu hàng · '2' số tính lúc in · '3' chữ cố định
  chu: number;
  duLieu: number;
  dieuKien: string;
  x: number; y: number; w: number; h: number;
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
}

function docO(tho: string): OTem {
  const f = tho.split('\t');
  return { tho, loai: f[2] ?? '', chu: soNguyen(f[3], -1), duLieu: soNguyen(f[4], -1), dieuKien: f[5] ?? '',
    x: soNguyen(f[9], 0), y: soNguyen(f[10], 0), w: soNguyen(f[11], 0), h: soNguyen(f[12], 0) };
}

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
        dang = { id: f[1] ?? '', ten: docChu(f[2]), rong: soNguyen(f[4], 58), cao: soNguyen(f[5], 40), dongLab: i, dongLae: L.cuoi, cot: f, o: [] };
        cacMau.push(dang);
      } else if (f[0] === 'LAS' && dang) dang.o.push(docO(d));
      else if (f[0] === 'LAE' && dang) { dang.dongLae = i; dang = null; }
    }
  }
  const so0 = thongSo(file)[0];
  const dangDung = cacMau.find(m => m.id === so0 && m.cot[3] === '1') ?? cacMau.find(m => m.cot[3] === '1') ?? null;
  return { cacMau, dangDung };
}

/** Tên dễ hiểu của một ô trên tem. */
export function tenO(o: OTem, cot: string[]): string {
  if (o.loai === '0') return 'Mã vạch';
  if (o.loai === '1') {
    return ({ 0: 'Tên hàng', 1: 'Trọng lượng', 4: 'Đơn giá', 6: 'Số PLU', 15: 'Hạn dùng' } as Record<number, string>)[o.duLieu]
      ?? `Dữ liệu hàng số ${o.duLieu}`;
  }
  if (o.loai === '2') {
    return ({ 3: 'Ngày đóng gói', 4: 'Giờ đóng gói', 27: 'Thành tiền' } as Record<number, string>)[o.chu] ?? `Số tính lúc in số ${o.chu}`;
  }
  if (o.loai === '3') {
    const chu = docChu(cot[cotChu(o.chu)]);
    return chu ? `Chữ "${chu}"` : 'Chữ (đang trống)';
  }
  return `Ô loại ${o.loai}`;
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
  cot?: number;          // ô chữ: cột trên dòng LAB
}
export interface TemXem {
  id: string; ten: string; rong: number; cao: number;
  o: OTemXem[];
  chu: Record<number, string>;
  soMau: number;
}

export function xemTem(file: FileCan, daTat: DaTat): TemXem | null {
  const { cacMau, dangDung: m } = docTem(file);
  if (!m) return null;
  const chu: Record<number, string> = {};
  const ra = (o: OTem, khoa: string, bat: boolean): OTemXem => {
    const x: OTemXem = { khoa, bat, ten: tenO(o, m.cot), loai: o.loai, chu: o.chu, duLieu: o.duLieu, dieuKien: o.dieuKien,
      x: o.x, y: o.y, w: o.w, h: o.h };
    if (o.loai === '3') { x.cot = cotChu(o.chu); chu[x.cot] = docChu(m.cot[x.cot]); }
    return x;
  };
  const o = [
    ...m.o.map((x, i) => ra(x, `o:${i}`, true)),
    ...daTatHopLe(m, daTat).map((x, i) => ra(docO(x.tho), `t:${i}`, false)),
  ];
  return { id: m.id, ten: m.ten, rong: m.rong, cao: m.cao, o, chu, soMau: cacMau.length };
}

// -----------------------------------------------------------------------------
// SỬA
// -----------------------------------------------------------------------------
export interface ThayDoiTem {
  /** cột dòng LAB → chữ mới. */
  chu?: Record<string, string>;
  /** Ô đang in cần tắt: khoa "o:i". */
  tat?: string[];
  /** Ô đã tắt cần bật lại: khoa "t:i". */
  bat?: string[];
}

export class LoiTem extends Error {}

/**
 * File mới với mẫu tem đang dùng đã sửa, và danh sách ô đã tắt sau khi sửa.
 * Phần khác của file (kể cả PLU, TIM) giữ nguyên từng byte.
 */
export function suaTem(du: Uint8Array, daTat: DaTat, thay: ThayDoiTem): { du: Uint8Array<ArrayBuffer>; daTat: DaTat; coDoi: boolean } {
  const file = docFileCan(du);
  const { dangDung: m } = docTem(file);
  if (!m) throw new LoiTem('File của cân không có mẫu tem (phần LAB).');
  const hopLe = daTatHopLe(m, daTat);

  // Dòng LAB: chữ cố định
  const cot = m.cot.slice();
  let coDoi = false;
  const cotChuDung = new Set([...m.o, ...hopLe.map(x => docO(x.tho))].filter(o => o.loai === '3').map(o => cotChu(o.chu)));
  for (const [k, v] of Object.entries(thay.chu ?? {})) {
    const c = Number(k);
    if (!cotChuDung.has(c)) throw new LoiTem('Ô chữ này không có trên tem.');
    const moi = String(v).replace(/[\t\r\n]+/g, ' ').trim().normalize('NFC');
    if ([...moi].length > CHU_TEM_TOI_DA) throw new LoiTem(`Chữ trên tem dài quá ${CHU_TEM_TOI_DA} ký tự.`);
    if (docChu(cot[c]) !== moi) { cot[c] = ghiChu(moi); coDoi = true; }
  }

  // Dòng LAS: tắt / bật
  const soI = (khoa: string, dau: string, toiDa: number) => {
    const mm = new RegExp(`^${dau}:(\\d+)$`).exec(khoa);
    const i = mm ? Number(mm[1]) : -1;
    if (i < 0 || i >= toiDa) throw new LoiTem('Tem trên máy đã đổi. Mở lại thẻ Tem rồi sửa lại.');
    return i;
  };
  const tat = new Set((thay.tat ?? []).map(k => soI(k, 'o', m.o.length)));
  const bat = new Set((thay.bat ?? []).map(k => soI(k, 't', hopLe.length)));
  let o: string[] = m.o.map(x => x.tho);
  const conTat: ODaTat[] = hopLe.filter((_, i) => !bat.has(i));
  const moiTat: ODaTat[] = [...tat].sort((a, b) => a - b).map(i => ({ tho: m.o[i].tho, viTri: i }));
  if (tat.size) { o = o.filter((_, i) => !tat.has(i)); coDoi = true; }
  for (const i of [...bat].sort((a, b) => hopLe[a].viTri - hopLe[b].viTri)) {
    o.splice(Math.min(hopLe[i].viTri, o.length), 0, hopLe[i].tho);
    coDoi = true;
  }
  if (o.length === 0) throw new LoiTem('Tem phải còn ít nhất một ô được in.');

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
  return { du: ra, daTat: { ...daTat, [m.id]: [...conTat, ...moiTat] }, coDoi };
}

// -----------------------------------------------------------------------------
// PHÍM TẮT
// -----------------------------------------------------------------------------
// Chữ trên các phím của bàn phím cân, theo số nhỏ in trên phím (1–63).
const TEN_PHIM = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'SP', '<', '=', '>', '!', '?', '.', ',', ';', '+', '−', '*', '/', '(', ')', '{', '}', '[', ']', '‘', '“', '@', '#', '&', '$', '%', '^', '`', ':', '|', '\\', '—', '~', 'End', 'Del', 'Ins', 'IME'];

/** Số PLU → chữ trên phím tắt tầng 1 gọi nó. */
export function phimTat(file: FileCan): Map<number, string> {
  const ra = new Map<number, string>();
  const S = file.phan.SCP;
  if (!S) return ra;
  for (let i = S.dau + 1; i < S.cuoi; i++) {
    const f = file.dong[i].split('\t');
    if (f[0] !== 'SCP' || f[1] !== '0') continue;
    const phim = soNguyen(f[2], 0), so = soNguyen(f[3], 0);
    if (so > 0 && phim > 0 && TEN_PHIM[phim] && !ra.has(so)) ra.set(so, TEN_PHIM[phim]);
  }
  return ra;
}
