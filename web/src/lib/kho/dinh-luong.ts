/**
 * KHO — ĐỊNH LƯỢNG MÓN, ĐỐI CHIẾU ĐỊNH MỨC (GĐ7b, migration 0038)
 *
 * Chủ quán đã chốt: định lượng món chỉ để ĐỐI CHIẾU. Bếp vẫn nhận thịt bằng
 * phiếu Xuất bếp; kho KHÔNG tự trừ theo định lượng. Báo cáo so:
 *   bếp đã nhận (Xuất bếp + phần "chuyển bếp" khi pha lóc)
 *   với lẽ ra dùng = số suất bán trên iPOS × gram mỗi suất.
 *
 * Hai màn:
 *   /noi-bo/kho/cai-dat/dinh-luong  (danh_muc) — món, gram từng mặt hàng,
 *        "Lấy món từ iPOS", dán Excel → xem trước → áp dụng.
 *   /noi-bo/kho/bao-cao/dinh-muc    (xem; tiền lệch chỉ xem_gia) — bảng lệch.
 *
 * Luật (khớp món / mặt hàng khi dán, cách đếm suất, ngưỡng) nằm trong database
 * (0038). File này: hàm thuần (tách bảng dán, đọc lưới gram, màu lệch, cột
 * CSV — test bằng Node) và các lời gọi RPC.
 *
 * Không cột tiền nào ở bảng món / định lượng. Báo cáo: tien_chenh do database
 * trả null với vai không xem giá; web cũng bỏ hẳn cột đó khỏi bảng và CSV.
 *
 * Hai thứ tiếng: câu báo KetQua mang cauEn; lỗi kiểm form trả loi (tiếng Việt)
 * và loiEn (tiếng Anh) song song; hàm có chữ nhận `nn` ở cuối, mặc định tiếng
 * Việt. Ô dán Excel hiểu cả tiêu đề tiếng Anh (Dish, Item, Gram).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { boDau, cauLoiKho, kqHai, kqLoi, type KetQua, type HaiThuTieng, type NgonNguNB } from './chung.ts';
import { cotTheoTieng, dinhNghiaTheoTieng, type CotBaoCao, type CotHai, type DinhNghiaBaoCao } from './bao-cao.ts';

const VUNG: Record<NgonNguNB, string> = { vi: 'vi-VN', en: 'en-US' };

// -----------------------------------------------------------------------------
// KIỂU
// -----------------------------------------------------------------------------
export interface Mon { id: string; ten: string; ma_ipos: string | null; dang_ban: boolean }
export interface DongDinhLuong { mon_id: string; mat_hang_id: string; gram: number }
export interface MatHangDl { id: string; ma: string; ten: string; nhom: string | null; loai: string; dang_dung: boolean; ma_can: string | null }

/** Món kèm số mặt hàng đã có gram (cho danh sách). */
export interface MonCoDinhLuong extends Mon { so_dong: number; tong_gram: number }

// -----------------------------------------------------------------------------
// DANH SÁCH MÓN — tìm, chip "Chưa có định lượng", "Ngừng bán"
// -----------------------------------------------------------------------------
export type LocMon = '' | 'chua' | 'ngung';

export function docLocMon(v: string | null): LocMon {
  return v === 'chua' || v === 'ngung' ? v : '';
}

export function ganDinhLuong(mon: Mon[], dl: DongDinhLuong[]): MonCoDinhLuong[] {
  const dem = new Map<string, { n: number; g: number }>();
  for (const d of dl) {
    const x = dem.get(d.mon_id) ?? { n: 0, g: 0 };
    x.n += 1; x.g += d.gram;
    dem.set(d.mon_id, x);
  }
  return mon.map(m => ({ ...m, so_dong: dem.get(m.id)?.n ?? 0, tong_gram: Math.round((dem.get(m.id)?.g ?? 0) * 100) / 100 }));
}

/**
 * Lọc món: mặc định món đang bán; "chua" = đang bán mà chưa có định lượng;
 * "ngung" = món đã tắt "đang bán". Tìm theo tên hoặc mã iPOS, không phân biệt
 * dấu ("pho bo" ra "Phở bò").
 */
export function locMon(ds: MonCoDinhLuong[], q: string, loc: LocMon): MonCoDinhLuong[] {
  const t = boDau(q.trim()).toLowerCase();
  return ds.filter(m =>
    (loc === 'ngung' ? !m.dang_ban : m.dang_ban)
    && (loc !== 'chua' || m.so_dong === 0)
    && (!t || boDau(`${m.ten} ${m.ma_ipos ?? ''}`).toLowerCase().includes(t)));
}

// -----------------------------------------------------------------------------
// LƯỚI GRAM CỦA MỘT MÓN — form không JavaScript
// -----------------------------------------------------------------------------
// Mỗi dòng: mh_<i> (mặt hàng), gram_<i>, bo_<i> (tích "Bỏ"). so_dong = số dòng
// của form. Dòng không chọn mặt hàng, hoặc tích Bỏ, là không có.
export const TOI_DA_DONG_MON = 100;
export const DONG_TRONG_THEM = 3;

/** "150" | "150,5" | "150.5" | "150g" → gram. Trống → null. Sai → NaN. */
export function docGram(v: unknown): number | null {
  const s = String(v ?? '').trim().replace(/\s+/g, '').replace(/(gr|g|gram)$/i, '');
  if (s === '') return null;
  if (!/^\d{1,5}([.,]\d{1,2})?$/.test(s)) return NaN;
  const n = Number(s.replace(',', '.'));
  return n > 0 && n <= 10000 ? n : NaN;
}

/** Giá trị form của một dòng (để hiện lại đúng chữ đã gõ khi có lỗi). */
export interface ODongLuoi { mat_hang_id: string; gram: string; bo: boolean }

export interface KetQuaLuoi {
  /** Dòng gửi database (đúng dạng kho_luu_dinh_luong: {mat_hang_id, gram}). */
  dong: { mat_hang_id: string; gram: number }[];
  loi: string[];
  /** loi ở tiếng Anh, cùng thứ tự. */
  loiEn: string[];
  /** Mọi dòng của form, kể cả dòng trống — để dựng lại lưới. */
  o: ODongLuoi[];
}

export function docLuoiDinhLuong(form: FormData, matHang: Pick<MatHangDl, 'id' | 'ten'>[]): KetQuaLuoi {
  const ten = new Map(matHang.map(m => [m.id, m.ten]));
  const n = Math.min(Math.max(Number.parseInt(String(form.get('so_dong') ?? '0'), 10) || 0, 0), TOI_DA_DONG_MON + 20);
  const o: ODongLuoi[] = [];
  const dong: { mat_hang_id: string; gram: number }[] = [];
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const da = new Set<string>();
  for (let i = 0; i < n; i++) {
    const mh = String(form.get(`mh_${i}`) ?? '').trim();
    const gT = String(form.get(`gram_${i}`) ?? '').trim();
    const bo = form.get(`bo_${i}`) === '1';
    o.push({ mat_hang_id: mh, gram: gT, bo });
    if (bo || (!mh && !gT)) continue;
    const stt = i + 1;
    if (!mh) { bao({ vi: `Dòng ${stt}: chọn mặt hàng (hoặc xóa số gram).`, en: `Row ${stt}: choose an item (or clear the grams).` }); continue; }
    if (!ten.has(mh)) {
      bao({ vi: `Dòng ${stt}: mặt hàng không còn trong danh mục — chọn lại.`, en: `Row ${stt}: this item is no longer in the catalog — choose again.` });
      continue;
    }
    const g = docGram(gT);
    if (g === null) { bao({ vi: `Dòng ${stt} (${ten.get(mh)}): nhập số gram một suất.`, en: `Row ${stt} (${ten.get(mh)}): enter the grams per portion.` }); continue; }
    if (Number.isNaN(g)) {
      bao({ vi: `Dòng ${stt} (${ten.get(mh)}): gram phải lớn hơn 0 và không quá 10.000 (vd 150 hoặc 150,5).`,
            en: `Row ${stt} (${ten.get(mh)}): grams must be more than 0 and at most 10,000 (e.g. 150 or 150.5).` });
      continue;
    }
    if (da.has(mh)) {
      bao({ vi: `Dòng ${stt}: "${ten.get(mh)}" có hai lần — gộp thành một dòng.`, en: `Row ${stt}: "${ten.get(mh)}" appears twice — merge it into one row.` });
      continue;
    }
    da.add(mh);
    dong.push({ mat_hang_id: mh, gram: g });
  }
  if (dong.length > TOI_DA_DONG_MON) {
    bao({ vi: `Một món tối đa ${TOI_DA_DONG_MON} mặt hàng.`, en: `A dish can have at most ${TOI_DA_DONG_MON} items.` });
  }
  return { dong, loi, loiEn, o };
}

/**
 * "Phiên bản" định lượng của một món: chuỗi mặt hàng:gram đã sắp xếp. Form
 * mang theo bản lúc mở; lưu mà database đã khác (người khác vừa sửa) thì
 * không đè — báo tải lại.
 */
export function phienBanDinhLuong(dong: { mat_hang_id: string; gram: number }[]): string {
  return dong.map(d => `${d.mat_hang_id}:${Number(d.gram)}`).sort().join('|');
}

/** Hiện gram: 150 → "150", 150.5 → "150,5" (tiếng Anh: "150.5"). */
export function hienGram(g: number | null | undefined, nn: NgonNguNB = 'vi'): string {
  if (g === null || g === undefined || !Number.isFinite(Number(g))) return '';
  // Không có dấu ngăn nghìn: số này điền lại vào ô gram, và docGram coi "1.000"
  // / "1,000" là sai (đọc như số lẻ) — suất 1 kg trở lên thì lưu lại bị từ chối.
  return Number(g).toLocaleString(VUNG[nn], { maximumFractionDigits: 2, useGrouping: false });
}

// -----------------------------------------------------------------------------
// DÁN EXCEL — Món | Mặt hàng | Gram
// -----------------------------------------------------------------------------
// Web chỉ tách bảng thành dòng; khớp món / mặt hàng, kiểm gram là việc của
// database (kho_nhap_dinh_luong) — một luật, một chỗ.
export interface DongDan { mon: string; mat_hang: string; gram: string; dong: number }
/** loi (tiếng Việt) và loiEn (tiếng Anh) cùng null hoặc cùng có. */
export interface KetQuaTach { dong: DongDan[]; loi: string | null; loiEn: string | null; coTieuDe: boolean }

export const TOI_DA_DONG_DAN = 2000;

type CotDl = 'mon' | 'mat_hang' | 'gram';

/** Tên cột của ô dán, dùng trong câu báo thiếu cột. */
const TEN_COT_DAN: Record<CotDl, HaiThuTieng> = {
  mon: { vi: 'Món', en: 'Dish' },
  mat_hang: { vi: 'Mặt hàng', en: 'Item' },
  gram: { vi: 'Gram', en: 'Gram' },
};

// Tiêu đề tiếng Anh (Dish, Item, Gram…) cũng hiểu — màn tiếng Anh hướng dẫn dán bằng các tên đó.
function cotTieuDe(o: string): CotDl | undefined {
  const s = boDau(o).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  if (/^(ma |ten )?mon( an)?( ipos)?$|^mon ma ten$|^ma ten mon$|^dish( name| code)?$/.test(s)) return 'mon';
  if (/^(ma |ten )?(mat hang|nguyen lieu|thit|hang)( kho)?$|^ma can$|^item( name| code)?$|^scale code$/.test(s)) return 'mat_hang';
  if (/^(so )?(gram|gam|g|gr)( mot suat| suat)?$|^dinh luong( g| gram)?$|^grams?( per portion)?$/.test(s)) return 'gram';
  return undefined;
}

/** Tách một dòng theo dấu ngăn; ô trong ngoặc kép (Excel) giữ nguyên dấu ngăn bên trong. */
function tachO(dong: string, ngan: string): string[] {
  const ra: string[] = [];
  let o = '';
  let trongNgoac = false;
  for (let i = 0; i < dong.length; i++) {
    const c = dong[i];
    if (trongNgoac) {
      if (c === '"' && dong[i + 1] === '"') { o += '"'; i++; }
      else if (c === '"') trongNgoac = false;
      else o += c;
    } else if (c === '"' && o.trim() === '') { o = ''; trongNgoac = true; }
    else if (c === ngan) { ra.push(o.trim()); o = ''; }
    else o += c;
  }
  ra.push(o.trim());
  return ra;
}

/**
 * Tách ô dán. Cột cách bằng Tab (chép thẳng từ Excel) hoặc ";" — một kiểu cho
 * cả bảng; KHÔNG tách bằng "," (150,5 gram sẽ bị cắt đôi). Dòng đầu có ít nhất
 * hai tiêu đề hiểu được (Món, Mặt hàng, Gram) là dòng tiêu đề → cột xếp tùy ý;
 * không thì theo thứ tự Món, Mặt hàng, Gram. `dong` = số dòng trong ô dán.
 */
export function tachDanDinhLuong(noiDung: string): KetQuaTach {
  const hong = (c: HaiThuTieng, coTieuDe: boolean): KetQuaTach => ({ dong: [], loi: c.vi, loiEn: c.en, coTieuDe });
  const dongTho = noiDung.replace(/^﻿/, '').split(/\r\n|\r|\n/);
  const coNoiDung = dongTho.map((s, i) => ({ s, i })).filter(x => x.s.trim() !== '');
  if (coNoiDung.length === 0) {
    return hong({ vi: 'Ô dán đang trống — chọn các ô trong Excel, sao chép rồi dán vào.',
                  en: 'The paste box is empty — select the cells in Excel, copy them, then paste here.' }, false);
  }
  const tach = coNoiDung.some(x => x.s.includes('\t')) ? '\t' : coNoiDung.some(x => x.s.includes(';')) ? ';' : null;
  if (!tach) {
    return hong({ vi: 'Không thấy các cột. Chép thẳng từ Excel (ba cột Món, Mặt hàng, Gram), hoặc ngăn cột bằng dấu ;',
                  en: 'No columns found. Copy straight from Excel (three columns: Dish, Item, Gram), or separate the columns with ;' }, false);
  }
  const o = (s: string) => tachO(s, tach);
  let thuTu: Partial<Record<CotDl, number>> = { mon: 0, mat_hang: 1, gram: 2 };
  let coTieuDe = false;
  const dau = o(coNoiDung[0].s);
  const hieu = dau.map(cotTieuDe);
  if (hieu.filter(Boolean).length >= 2) {
    coTieuDe = true;
    thuTu = {};
    hieu.forEach((c, i) => { if (c && thuTu[c] === undefined) thuTu[c] = i; });
    const thieu = (['mon', 'mat_hang', 'gram'] as CotDl[]).filter(c => thuTu[c] === undefined);
    if (thieu.length > 0) {
      const ten = (nn: NgonNguNB) => thieu.map(c => TEN_COT_DAN[c][nn]).join(', ');
      return hong({ vi: `Dòng tiêu đề thiếu cột ${ten('vi')}.`,
                    en: `The header row has no ${ten('en')} ${thieu.length === 1 ? 'column' : 'columns'}.` }, coTieuDe);
    }
  }
  const than = coTieuDe ? coNoiDung.slice(1) : coNoiDung;
  if (than.length === 0) return hong({ vi: 'Chỉ có dòng tiêu đề — dán thêm các dòng món.', en: 'There is only a header row — paste the dish rows too.' }, coTieuDe);
  if (than.length > TOI_DA_DONG_DAN) {
    return hong({ vi: `Tối đa ${TOI_DA_DONG_DAN.toLocaleString('vi-VN')} dòng một lần dán — chia bảng làm nhiều lần.`,
                  en: `At most ${TOI_DA_DONG_DAN.toLocaleString('en-US')} rows per paste — split the table into several pastes.` }, coTieuDe);
  }
  const lay = (cs: string[], c: CotDl) => (cs[thuTu[c] as number] ?? '').trim();
  return {
    dong: than.map(x => {
      const cs = o(x.s);
      return { mon: lay(cs, 'mon'), mat_hang: lay(cs, 'mat_hang'), gram: lay(cs, 'gram'), dong: x.i + 1 };
    }),
    loi: null,
    loiEn: null,
    coTieuDe,
  };
}

/** Kết quả xem trước / áp dụng của kho_nhap_dinh_luong. */
export interface DongXemTruocDl {
  stt: number;
  ok: boolean;
  loi: string | null;
  mon: { id: string | null; ten: string; ma_ipos: string | null } | null;
  mat_hang: { id: string; ma: string; ten: string } | null;
  gram: number | null;
  gram_cu: number | null;
  tao_mon_moi: boolean;
  thay_doi?: 'them' | 'sua' | 'giu' | null;
}
export interface XemTruocDl {
  dong: DongXemTruocDl[];
  so_dong: number; so_loi: number; so_mon_moi: number;
  them: number; sua: number; giu: number;
  da_ap_dung: boolean; da_tao_mon: number;
}

export function docXemTruocDl(raw: unknown): XemTruocDl {
  const r = (raw ?? {}) as Record<string, unknown>;
  const so = (k: string) => Number(r[k]) || 0;
  const dong = (Array.isArray(r.dong) ? r.dong : []) as Record<string, unknown>[];
  return {
    dong: dong.map(d => ({
      stt: Number(d.stt) || 0,
      ok: d.ok === true,
      loi: typeof d.loi === 'string' ? d.loi : null,
      mon: d.mon && typeof d.mon === 'object' ? d.mon as DongXemTruocDl['mon'] : null,
      mat_hang: d.mat_hang && typeof d.mat_hang === 'object' ? d.mat_hang as DongXemTruocDl['mat_hang'] : null,
      gram: d.gram === null || d.gram === undefined ? null : Number(d.gram),
      gram_cu: d.gram_cu === null || d.gram_cu === undefined ? null : Number(d.gram_cu),
      tao_mon_moi: d.tao_mon_moi === true,
      thay_doi: d.thay_doi === 'them' || d.thay_doi === 'sua' || d.thay_doi === 'giu' ? d.thay_doi : null,
    })),
    so_dong: so('so_dong'), so_loi: so('so_loi'), so_mon_moi: so('so_mon_moi'),
    them: so('them'), sua: so('sua'), giu: so('giu'),
    da_ap_dung: r.da_ap_dung === true, da_tao_mon: so('da_tao_mon'),
  };
}

/** "1 dish" / "2 dishes" — số ít, số nhiều của câu tiếng Anh. */
const dem = (n: number, mot: string, nhieu: string) => `${n} ${n === 1 ? mot : nhieu}`;

/** Câu báo sau khi áp dụng bảng dán. */
export function cauApDungDl(x: Pick<XemTruocDl, 'them' | 'sua' | 'giu' | 'da_tao_mon'>, nn: NgonNguNB = 'vi'): string {
  const c = (h: HaiThuTieng) => h[nn];
  const phan = [
    x.da_tao_mon > 0 ? c({ vi: `tạo ${x.da_tao_mon} món mới`, en: `created ${dem(x.da_tao_mon, 'new dish', 'new dishes')}` }) : '',
    x.them > 0 ? c({ vi: `thêm ${x.them} dòng gram`, en: `added ${dem(x.them, 'gram row', 'gram rows')}` }) : '',
    x.sua > 0 ? c({ vi: `sửa ${x.sua} dòng gram`, en: `changed ${dem(x.sua, 'gram row', 'gram rows')}` }) : '',
  ].filter(Boolean);
  if (phan.length === 0) {
    return c({ vi: 'Không có gì thay đổi — định lượng đã đúng như bảng dán.', en: 'Nothing changed — the recipes already match the pasted table.' });
  }
  const giu = x.giu > 0 ? c({ vi: ` (${x.giu} dòng giữ nguyên)`, en: ` (${dem(x.giu, 'row', 'rows')} unchanged)` }) : '';
  const ds = phan.join(', ');
  return c({ vi: `Đã ${ds}${giu}.`, en: `${ds.charAt(0).toUpperCase()}${ds.slice(1)}${giu}.` });
}

/** Câu báo sau khi áp dụng bảng dán, dạng KetQua (hai thứ tiếng). */
export function kqApDungDl(x: Pick<XemTruocDl, 'them' | 'sua' | 'giu' | 'da_tao_mon'>): KetQua {
  return kqHai(true, { vi: cauApDungDl(x, 'vi'), en: cauApDungDl(x, 'en') });
}

/** Câu báo sau "Lấy món từ iPOS". */
export function cauMonTuIpos(taoMoi: number, ganMa: number, nn: NgonNguNB = 'vi'): string {
  const c = (h: HaiThuTieng) => h[nn];
  if (taoMoi === 0 && ganMa === 0) {
    return c({
      vi: 'Không có món mới từ iPOS. Món chỉ hiện ở đây sau khi đã bán trên iPOS, hoặc đã đánh dấu "không phải hàng kho" ở Bán hàng iPOS.',
      en: 'No new dishes from iPOS. A dish only shows up here after it has been sold on iPOS, or marked "not a stock item" in iPOS sales.',
    });
  }
  return c({
    vi: `Đã lấy từ iPOS: ${[taoMoi > 0 ? `${taoMoi} món mới` : '', ganMa > 0 ? `gắn mã iPOS cho ${ganMa} món đã có` : ''].filter(Boolean).join(', ')}. Nhập gram cho từng món.`,
    en: `From iPOS: ${[taoMoi > 0 ? dem(taoMoi, 'new dish', 'new dishes') : '', ganMa > 0 ? `iPOS code added to ${dem(ganMa, 'existing dish', 'existing dishes')}` : ''].filter(Boolean).join(', ')}. Enter the grams for each dish.`,
  });
}

// -----------------------------------------------------------------------------
// BÁO CÁO ĐỐI CHIẾU ĐỊNH MỨC
// -----------------------------------------------------------------------------
export interface DongDinhMuc {
  mat_hang_id: string; ma: string; ten: string; loai: string;
  kg_xuat_bep: number; kg_ly_thuyet: number; chenh_kg: number; chenh_pt: number | null;
  so_suat: number; nguong_pt: number; vuot_nguong: boolean;
  so_mon_chua_dinh_luong: number; chua_co_ban: boolean;
  tien_chenh: number | null;
}

export function docDongDinhMuc(raw: unknown): DongDinhMuc[] {
  const so = (v: unknown) => (v === null || v === undefined ? 0 : Number(v) || 0);
  return ((Array.isArray(raw) ? raw : []) as Record<string, unknown>[]).map(r => ({
    mat_hang_id: String(r.mat_hang_id ?? ''), ma: String(r.ma ?? ''), ten: String(r.ten ?? ''), loai: String(r.loai ?? ''),
    kg_xuat_bep: so(r.kg_xuat_bep), kg_ly_thuyet: so(r.kg_ly_thuyet), chenh_kg: so(r.chenh_kg),
    chenh_pt: r.chenh_pt === null || r.chenh_pt === undefined ? null : Number(r.chenh_pt),
    so_suat: so(r.so_suat), nguong_pt: so(r.nguong_pt), vuot_nguong: r.vuot_nguong === true,
    so_mon_chua_dinh_luong: so(r.so_mon_chua_dinh_luong), chua_co_ban: r.chua_co_ban === true,
    tien_chenh: r.tien_chenh === null || r.tien_chenh === undefined ? null : Number(r.tien_chenh),
  }));
}

/**
 * Màu một dòng:
 *   do   — lệch vượt ngưỡng (database quyết: vuot_nguong)
 *   vang — lệch quá nửa ngưỡng, chưa vượt
 *   xanh — trong ngưỡng
 *   xam  — không có số "lẽ ra dùng" (chưa có món bán dùng mặt hàng này, hoặc
 *          chưa có định lượng) → không đánh giá được
 */
export type MucLech = 'do' | 'vang' | 'xanh' | 'xam';
export function mucLech(d: Pick<DongDinhMuc, 'kg_ly_thuyet' | 'chenh_pt' | 'nguong_pt' | 'vuot_nguong' | 'chua_co_ban'>): MucLech {
  if (d.chua_co_ban || !(d.kg_ly_thuyet > 0) || d.chenh_pt === null) return 'xam';
  if (d.vuot_nguong) return 'do';
  return Math.abs(d.chenh_pt) > d.nguong_pt / 2 ? 'vang' : 'xanh';
}

export const TEN_MUC_LECH_NB: Record<MucLech, HaiThuTieng> = {
  do: { vi: 'Vượt ngưỡng', en: 'Over threshold' },
  vang: { vi: 'Gần ngưỡng', en: 'Near threshold' },
  xanh: { vi: 'Trong ngưỡng', en: 'Within threshold' },
  xam: { vi: 'Chưa so được', en: 'Not comparable yet' },
};
export const TEN_MUC_LECH: Record<MucLech, string> = {
  do: TEN_MUC_LECH_NB.do.vi, vang: TEN_MUC_LECH_NB.vang.vi, xanh: TEN_MUC_LECH_NB.xanh.vi, xam: TEN_MUC_LECH_NB.xam.vi,
};

/** "+25%" / "−3,5%" / "—" (tiếng Anh: "−3.5%"). */
export function hienLechPt(pt: number | null, nn: NgonNguNB = 'vi'): string {
  if (pt === null || !Number.isFinite(pt)) return '—';
  const s = Math.abs(pt).toLocaleString(VUNG[nn], { maximumFractionDigits: 1 });
  return pt > 0 ? `+${s}%` : pt < 0 ? `−${s}%` : '0%';
}

/** Lệch kg có dấu: "+2,5" / "−0,3" / "0" (tiếng Anh: "+2.5"). */
export function hienLechKg(kg: number, nn: NgonNguNB = 'vi'): string {
  const s = Math.abs(kg).toLocaleString(VUNG[nn], { maximumFractionDigits: 3 });
  return kg > 0 ? `+${s}` : kg < 0 ? `−${s}` : '0';
}

/** Cột viết một lần, tên hai thứ tiếng. */
function cotDinhMucHai(coGia: boolean): CotHai[] {
  return [
    { khoa: 'ten', ten: { vi: 'Mặt hàng', en: 'Item' }, kieu: 'chu' },
    { khoa: 'ma', ten: { vi: 'Mã', en: 'Code' }, kieu: 'chu' },
    { khoa: 'kg_xuat_bep', ten: { vi: 'Bếp nhận kg', en: 'Kitchen received kg' }, kieu: 'kg' },
    { khoa: 'kg_ly_thuyet', ten: { vi: 'Lẽ ra dùng kg', en: 'Should have used kg' }, kieu: 'kg' },
    { khoa: 'chenh_kg', ten: { vi: 'Lệch kg', en: 'Variance kg' }, kieu: 'kg' },
    { khoa: 'chenh_pt', ten: { vi: 'Lệch %', en: 'Variance %' }, kieu: 'pt' },
    { khoa: 'so_suat', ten: { vi: 'Số suất bán', en: 'Portions sold' }, kieu: 'so' },
    ...(coGia ? [{ khoa: 'tien_chenh', ten: { vi: 'Tiền lệch (giá vốn)', en: 'Variance value (cost)' }, kieu: 'tien' as const, tienMat: true }] : []),
  ];
}

/** Cột bảng / CSV. Cột tiền chỉ có khi người xem có quyền xem giá. */
export function cotDinhMuc(coGia: boolean, nn: NgonNguNB = 'vi'): CotBaoCao[] {
  return cotTheoTieng(cotDinhMucHai(coGia), nn);
}

/**
 * Định nghĩa cho taoCsv / tinhTong của bao-cao.ts. Dòng tổng chỉ cộng kg và
 * tiền — không tính % chung: mặt hàng chưa có định lượng (lẽ ra dùng = 0) làm
 * % chung sai nghĩa.
 */
export function dinhNghiaDinhMuc(coGia: boolean, nn: NgonNguNB = 'vi'): DinhNghiaBaoCao {
  return dinhNghiaTheoTieng({
    ten: { vi: 'Đối chiếu định mức bếp', en: 'Kitchen usage check' },
    moTa: {
      vi: 'Bếp nhận (Xuất bếp + phần chuyển bếp khi pha lóc) so với lẽ ra dùng (số suất bán trên iPOS × gram định lượng).',
      en: 'Kitchen received (issues to the kitchen + the part sent to the kitchen during butchery) compared with what it should have used (portions sold on iPOS × recipe grams).',
    },
    cot: cotDinhMucHai(coGia),
    cong: ['kg_xuat_bep', 'kg_ly_thuyet', 'chenh_kg', ...(coGia ? ['tien_chenh'] : [])],
    khiTrong: {
      cau: {
        vi: 'Kỳ này bếp chưa nhận thịt và chưa có món bán nào có định lượng',
        en: 'In this period the kitchen has received no meat and no dish with a recipe has been sold',
      },
      link: [{ ten: { vi: 'Định lượng món', en: 'Dish recipes' }, href: '/noi-bo/kho/cai-dat/dinh-luong' }],
    },
  }, nn);
}

/** Kỳ quá dài database từ chối — báo trước bằng lời dễ hiểu. */
export const NGAY_TOI_DA_DINH_MUC = 366;

// -----------------------------------------------------------------------------
// ĐỌC / GHI DATABASE
// -----------------------------------------------------------------------------
export async function docMon(client: SupabaseClient, chiNhanhId: string): Promise<Mon[]> {
  const { data, error } = await client
    .from('kho_mon')
    .select('id, ten, ma_ipos, dang_ban')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('ten');
  if (error) throw error;
  return (data ?? []) as Mon[];
}

/** Mọi dòng định lượng của chi nhánh (đọc từng trang 1.000 dòng). */
export async function docDinhLuong(client: SupabaseClient, chiNhanhId: string, monId?: string): Promise<DongDinhLuong[]> {
  const ra: DongDinhLuong[] = [];
  for (let dau = 0; dau < 50000; dau += 1000) {
    let q = client.from('kho_dinh_luong').select('mon_id, mat_hang_id, gram').eq('chi_nhanh_id', chiNhanhId);
    if (monId) q = q.eq('mon_id', monId);
    const { data, error } = await q.order('mon_id').order('mat_hang_id').range(dau, dau + 999);
    if (error) throw error;
    const ds = (data ?? []) as { mon_id: string; mat_hang_id: string; gram: number | string }[];
    for (const d of ds) ra.push({ mon_id: d.mon_id, mat_hang_id: d.mat_hang_id, gram: Number(d.gram) });
    if (ds.length < 1000) break;
  }
  return ra;
}

/** Mặt hàng cho ô chọn — không cột tiền. */
export async function docMatHangDl(client: SupabaseClient): Promise<MatHangDl[]> {
  const { data, error } = await client
    .from('kho_mat_hang')
    .select('id, ma, ten, nhom, loai, dang_dung, ma_can')
    .order('loai').order('thu_tu').order('ten');
  if (error) throw error;
  return (data ?? []) as MatHangDl[];
}

export async function luuMon(
  client: SupabaseClient, chiNhanhId: string, id: string | null, ten: string, maIpos: string, dangBan: boolean,
): Promise<{ ok: boolean; cau: string; cauEn?: string; id?: string }> {
  const { data, error } = await client.rpc('kho_luu_mon', {
    p_chi_nhanh_id: chiNhanhId, p_id: id, p_ten: ten, p_ma_ipos: maIpos, p_dang_ban: dangBan,
  });
  if (error) return kqLoi(error);
  const m = (data ?? {}) as { id?: string; ten?: string };
  const tenMon = m.ten ?? ten;
  return {
    ...kqHai(true, id
      ? { vi: `Đã lưu món "${tenMon}".`, en: `Saved dish "${tenMon}".` }
      : { vi: `Đã thêm món "${tenMon}". Nhập gram từng mặt hàng bên dưới.`, en: `Added dish "${tenMon}". Enter the grams for each item below.` }),
    id: m.id,
  };
}

export async function luuDinhLuong(
  client: SupabaseClient, monId: string, dong: { mat_hang_id: string; gram: number }[],
): Promise<KetQua> {
  const { data, error } = await client.rpc('kho_luu_dinh_luong', { p_mon_id: monId, p_dong: dong });
  if (error) return kqLoi(error);
  const n = Number((data as { so_dong?: number } | null)?.so_dong ?? dong.length);
  return kqHai(true, n > 0
    ? { vi: `Đã lưu định lượng: ${n} mặt hàng.`, en: `Recipe saved: ${dem(n, 'item', 'items')}.` }
    : { vi: 'Đã xóa hết định lượng của món.', en: 'All grams were removed from this dish.' });
}

export async function layMonTuIpos(client: SupabaseClient, chiNhanhId: string): Promise<KetQua> {
  const { data, error } = await client.rpc('kho_mon_tu_ipos', { p_chi_nhanh_id: chiNhanhId });
  if (error) return kqLoi(error);
  const r = (data ?? {}) as { tao_moi?: number; gan_ma?: number };
  const taoMoi = Number(r.tao_moi) || 0;
  const ganMa = Number(r.gan_ma) || 0;
  return kqHai(true, { vi: cauMonTuIpos(taoMoi, ganMa, 'vi'), en: cauMonTuIpos(taoMoi, ganMa, 'en') });
}

export async function nhapDinhLuong(
  client: SupabaseClient, chiNhanhId: string, dong: DongDan[], apDung: boolean,
): Promise<{ ok: boolean; cau: string | null; kq: XemTruocDl | null }> {
  const { data, error } = await client.rpc('kho_nhap_dinh_luong', {
    p_chi_nhanh_id: chiNhanhId, p_dong: dong, p_ap_dung: apDung,
  });
  if (error) return { ok: false, cau: cauLoiKho(error), kq: null };
  return { ok: true, cau: null, kq: docXemTruocDl(data) };
}

export async function docBaoCaoDinhMuc(
  client: SupabaseClient, chiNhanhId: string, tu: string, den: string,
): Promise<{ dong: DongDinhMuc[]; loi: string | null }> {
  const { data, error } = await client.rpc('kho_bao_cao_dinh_muc', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
  if (error) return { dong: [], loi: cauLoiKho(error) };
  return { dong: docDongDinhMuc(data), loi: null };
}
