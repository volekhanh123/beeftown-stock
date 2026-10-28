/**
 * KHO — THEO DÕI THEO TẢNG (0048): bảng ủ, số tảng, danh sách tảng đang ủ.
 *
 * Món bật "Theo dõi theo tảng" (kho_mat_hang.theo_tang): nhận hàng mỗi dòng một
 * tảng có ngày mổ; duyệt thì mỗi tảng thành một lô mang số tảng tăng dần theo
 * chi nhánh (in trên tem "#0142") và ngày ủ xong = ngày nhận + số ngày ủ tra từ
 * bảng ủ theo tuổi thịt lúc nhận (ngày nhận − ngày mổ).
 *
 * Bảng ủ gõ dạng chữ ngắn: "5:18, 10:14, 10" = tuổi ≤ 5 ngày ủ 18 ngày, ≤ 10
 * ủ 14, còn lại ủ 10. Các hàm đọc / viết / tra là hàm thuần — test bằng node.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, dinhDangNgay, kqHai, laUuid, type HaiThuTieng, type KetQua, type NgonNguNB } from './chung.ts';
import { laNgayCoThat } from '../gio-vn.ts';
import type { CotBaoCao, DinhNghiaBaoCao } from './bao-cao.ts';

// -----------------------------------------------------------------------------
// BẢNG Ủ
// -----------------------------------------------------------------------------
export interface DongBangU {
  /** Tuổi thịt tối đa (ngày) lúc nhận; null = "còn lại". */
  tuoi_den_ngay: number | null;
  so_ngay_u: number;
}

const soNguyenTrong = (s: string, min: number, max: number): number | null => {
  if (!/^\d{1,3}$/.test(s)) return null;
  const n = Number(s);
  return n >= min && n <= max ? n : null;
};

/**
 * "5:18, 10:14, 10" → các dòng bảng ủ. Trống → [] (xoá bảng). Tách bằng dấu
 * phẩy, chấm phẩy hoặc xuống dòng; mỗi mục "tuổi:số ngày" (nhận cả "→", "-",
 * "=") hoặc một số (= còn lại).
 */
export function docChuBangU(chu: string): { dong: DongBangU[]; loi: HaiThuTieng | null } {
  const muc = chu.split(/[,;\n]+/).map(x => x.trim()).filter(Boolean);
  const dong: DongBangU[] = [];
  for (const m of muc) {
    const p = m.split(/\s*(?::|→|->|=|-)\s*/);
    if (p.length === 1) {
      const n = soNguyenTrong(p[0], 0, 365);
      if (n === null) return { dong: [], loi: { vi: `Bảng ủ: "${m}" không phải số ngày (0–365).`, en: `Aging table: "${m}" is not a number of days (0–365).` } };
      if (dong.some(d => d.tuoi_den_ngay === null)) {
        return { dong: [], loi: { vi: 'Bảng ủ chỉ có một mục "còn lại" (một số đứng riêng).', en: 'The aging table can only have one "everything else" entry (a number on its own).' } };
      }
      dong.push({ tuoi_den_ngay: null, so_ngay_u: n });
    } else if (p.length === 2) {
      const tuoi = soNguyenTrong(p[0], 0, 365);
      const ngay = soNguyenTrong(p[1], 0, 365);
      if (tuoi === null || ngay === null) {
        return { dong: [], loi: { vi: `Bảng ủ: "${m}" phải là "tuổi:số ngày ủ", ví dụ 5:18.`, en: `Aging table: "${m}" must be "age:aging days", for example 5:18.` } };
      }
      if (dong.some(d => d.tuoi_den_ngay === tuoi)) {
        return { dong: [], loi: { vi: `Bảng ủ: tuổi ${tuoi} ngày ghi hai lần.`, en: `Aging table: age ${tuoi} days appears twice.` } };
      }
      dong.push({ tuoi_den_ngay: tuoi, so_ngay_u: ngay });
    } else {
      return { dong: [], loi: { vi: `Bảng ủ: không đọc được "${m}".`, en: `Aging table: could not read "${m}".` } };
    }
  }
  return { dong: sapBangU(dong), loi: null };
}

function sapBangU(dong: DongBangU[]): DongBangU[] {
  return [...dong].sort((a, b) => (a.tuoi_den_ngay ?? Infinity) - (b.tuoi_den_ngay ?? Infinity));
}

/** Các dòng bảng ủ → chữ ngắn để điền lại vào ô: "5:18, 10:14, 10". */
export function chuBangU(dong: DongBangU[]): string {
  return sapBangU(dong).map(d => (d.tuoi_den_ngay === null ? String(d.so_ngay_u) : `${d.tuoi_den_ngay}:${d.so_ngay_u}`)).join(', ');
}

/** Bảng ủ đọc cho người: "≤ 5 ngày tuổi → ủ 18 ngày · ≤ 10 → 14 · còn lại → 10". */
const CHU_BANG_U = {
  trong: { vi: 'chưa có bảng ủ', en: 'no aging table' },
  conLai: { vi: (n: number) => `còn lại → ${n} ngày`, en: (n: number) => `older → ${n} days` },
  dau: { vi: (tuoi: number, n: number) => `≤ ${tuoi} ngày tuổi → ủ ${n} ngày`, en: (tuoi: number, n: number) => `up to ${tuoi} days old → age ${n} days` },
} as const;

export function moTaBangU(dong: DongBangU[], nn: NgonNguNB = 'vi'): string {
  if (!dong.length) return CHU_BANG_U.trong[nn];
  return sapBangU(dong).map((d, i) => {
    if (d.tuoi_den_ngay === null) return CHU_BANG_U.conLai[nn](d.so_ngay_u);
    return i === 0 ? CHU_BANG_U.dau[nn](d.tuoi_den_ngay, d.so_ngay_u) : `≤ ${d.tuoi_den_ngay} → ${d.so_ngay_u}`;
  }).join(' · ');
}

/** Tra số ngày ủ — cùng luật với kho_so_ngay_u (0048). null = món chưa có bảng. */
export function soNgayU(dong: DongBangU[], tuoi: number): number | null {
  const moc = sapBangU(dong).find(d => d.tuoi_den_ngay !== null && d.tuoi_den_ngay >= Math.max(tuoi, 0));
  if (moc) return moc.so_ngay_u;
  return dong.find(d => d.tuoi_den_ngay === null)?.so_ngay_u ?? null;
}

/** Bảng ủ mọi món: mat_hang_id → các dòng. */
export async function docBangU(client: SupabaseClient): Promise<Map<string, DongBangU[]>> {
  const { data, error } = await client.from('kho_bang_u').select('mat_hang_id, tuoi_den_ngay, so_ngay_u');
  if (error) throw error;
  const ra = new Map<string, DongBangU[]>();
  for (const r of data ?? []) {
    const ds = ra.get(r.mat_hang_id) ?? [];
    ds.push({ tuoi_den_ngay: r.tuoi_den_ngay === null ? null : Number(r.tuoi_den_ngay), so_ngay_u: Number(r.so_ngay_u) });
    ra.set(r.mat_hang_id, ds);
  }
  return ra;
}

/** Thay bảng ủ của một món (quyền danh mục — policy kho_bang_u_sua). */
export async function luuBangU(client: SupabaseClient, matHangId: string, dong: DongBangU[]): Promise<KetQua> {
  const xoa = await client.from('kho_bang_u').delete().eq('mat_hang_id', matHangId);
  if (xoa.error) return { ok: false, cau: cauLoiKho(xoa.error) };
  if (dong.length) {
    const { error } = await client.from('kho_bang_u').insert(dong.map(d => ({ mat_hang_id: matHangId, ...d })));
    if (error) return { ok: false, cau: cauLoiKho(error) };
  }
  return kqHai(true, { vi: 'Đã lưu bảng ủ.', en: 'Aging table saved.' });
}

// -----------------------------------------------------------------------------
// SỐ TẢNG, TẢNG CÒN TRONG KHO
// -----------------------------------------------------------------------------
/** 142 → "#0142" (in trên tem, ghi lên túi tảng). */
export function soTangChu(so: number | null | undefined): string {
  return so === null || so === undefined ? '' : `#${String(so).padStart(4, '0')}`;
}

/**
 * Chữ đặt cạnh mã lô ở mọi danh sách: "tảng #0142" / "primal #0142". Số tảng là thứ duy nhất ghi trên túi
 * tảng và in trên tem khay — mã lô (L261011-001) không có ở đâu ngoài đời. Lô không thuộc tảng nào → ''.
 */
export function chuTang(soTang: number | null | undefined, nn: NgonNguNB = 'vi'): string {
  const so = soTangChu(soTang);
  return so ? `${{ vi: 'tảng', en: 'primal' }[nn]} ${so}` : '';
}

export type TinhTrangU = 'dang_u' | 'san_sang' | 'chua_co_bang_u';

export const TINH_TRANG_U_NB: Record<TinhTrangU, HaiThuTieng> = {
  dang_u: { vi: 'Đang ủ', en: 'Aging' },
  san_sang: { vi: 'Sẵn sàng lóc', en: 'Ready to cut' },
  chua_co_bang_u: { vi: 'Chưa có bảng ủ', en: 'No aging table' },
};

/** Một dòng kho_v_tang — không có tiền. */
export interface TangTon {
  lo_id: string;
  ma_lo: string;
  so_tang: number | null;
  mat_hang_id: string;
  ma_hang: string;
  ten_hang: string;
  ngay_mo: string | null;
  ngay_nhan: string;
  ngay_u_xong: string | null;
  han_dung: string;
  tuoi_ngay: number | null;
  con_ngay_u: number | null;
  tinh_trang_u: TinhTrangU;
  so_kg: number;
  so_goi: number;
  vi_tri: string | null;
  /** 0107: 'nguyen' = nguyên tảng (lô nhận hàng); 'u' = tảng ủ sau trim (lô pha lóc, số tảng của tảng gốc). */
  loai_tang: 'nguyen' | 'u';
  /** 0107: tảng ủ — ngày trim (bắt đầu ủ) và số ngày đã ủ (giờ VN); nguyên tảng → null. */
  ngay_bat_dau_u: string | null;
  so_ngay_u: number | null;
}

/**
 * 0107: món có công thức Trim đang dùng — công thức ra một món loại tảng (tảng ủ). Màn Tảng · ủ ghi nút "Trim" và
 * mục "Nguyên tảng — chờ trim" cho các món này; món khác giữ nút "Lóc", nhãn tình trạng ủ như cũ.
 */
export function monCoTrim(
  congThuc: readonly { id: string; mat_hang_vao_id: string }[],
  dong: readonly { cong_thuc_id: string; mat_hang_ra_id: string }[],
  monTang: ReadonlySet<string>,
): Set<string> {
  const ctTrim = new Set(dong.filter(d => monTang.has(d.mat_hang_ra_id)).map(d => d.cong_thuc_id));
  return new Set(congThuc.filter(c => ctTrim.has(c.id)).map(c => c.mat_hang_vao_id));
}

export async function docMonTrim(client: SupabaseClient): Promise<Set<string>> {
  const [ct, dong, tang] = await Promise.all([
    client.from('kho_cong_thuc_pha').select('id, mat_hang_vao_id').eq('dang_dung', true),
    client.from('kho_cong_thuc_pha_dong').select('cong_thuc_id, mat_hang_ra_id'),
    client.from('kho_mat_hang').select('id').eq('loai', 'tang'),
  ]);
  if (ct.error) throw ct.error;
  if (dong.error) throw dong.error;
  if (tang.error) throw tang.error;
  return monCoTrim(ct.data ?? [], dong.data ?? [], new Set((tang.data ?? []).map(r => r.id as string)));
}

/**
 * Tảng còn trong kho của chi nhánh. Xếp: sẵn sàng lóc trước (ủ xong sớm nhất
 * trước), rồi đang ủ (sắp xong trước), rồi chưa có bảng ủ.
 */
export async function docTangTon(client: SupabaseClient, chiNhanhId: string): Promise<TangTon[]> {
  const { data, error } = await client.from('kho_v_tang')
    .select('lo_id, ma_lo, so_tang, mat_hang_id, ma_hang, ten_hang, ngay_mo, ngay_nhan, ngay_u_xong, han_dung, tuoi_ngay, con_ngay_u, tinh_trang_u, so_kg, so_goi, vi_tri, loai_tang, ngay_bat_dau_u, so_ngay_u')
    .eq('chi_nhanh_id', chiNhanhId);
  if (error) throw error;
  return sapTang((data ?? []).map(r => ({
    ...r,
    so_kg: Number(r.so_kg),
    so_goi: Number(r.so_goi ?? 0),
    tuoi_ngay: r.tuoi_ngay === null ? null : Number(r.tuoi_ngay),
    con_ngay_u: r.con_ngay_u === null ? null : Number(r.con_ngay_u),
    loai_tang: r.loai_tang === 'u' ? 'u' : 'nguyen',
    ngay_bat_dau_u: r.ngay_bat_dau_u ?? null,
    so_ngay_u: r.so_ngay_u === null || r.so_ngay_u === undefined ? null : Number(r.so_ngay_u),
  })) as TangTon[]);
}

const THU_TU_U: Record<TinhTrangU, number> = { san_sang: 0, dang_u: 1, chua_co_bang_u: 2 };

export function sapTang(ds: TangTon[]): TangTon[] {
  return [...ds].sort((a, b) => THU_TU_U[a.tinh_trang_u] - THU_TU_U[b.tinh_trang_u]
    || (a.con_ngay_u ?? 0) - (b.con_ngay_u ?? 0)
    || a.han_dung.localeCompare(b.han_dung)
    || (a.so_tang ?? 0) - (b.so_tang ?? 0));
}

/** Câu ngắn cho một tảng: "còn 5 ngày" · "ủ xong 2 ngày trước" · "ủ xong hôm nay". */
const CHU_CON_U = {
  con: { vi: (n: number) => `còn ${n} ngày`, en: (n: number) => `${n} ${n === 1 ? 'day' : 'days'} left` },
  homNay: { vi: 'ủ xong hôm nay', en: 'ready today' },
  truoc: { vi: (n: number) => `ủ xong ${n} ngày trước`, en: (n: number) => `ready ${n} ${n === 1 ? 'day' : 'days'} ago` },
} as const;

export function cauConU(t: Pick<TangTon, 'tinh_trang_u' | 'con_ngay_u'>, nn: NgonNguNB = 'vi'): string {
  if (t.tinh_trang_u === 'chua_co_bang_u' || t.con_ngay_u === null) return '';
  const n = t.con_ngay_u;
  if (n > 0) return CHU_CON_U.con[nn](n);
  if (n === 0) return CHU_CON_U.homNay[nn];
  return CHU_CON_U.truoc[nn](-n);
}

/** "2026-10-18" → mốc của ngày lịch đó. Ngày không có thật (31/02), chuỗi không phải ngày → NaN. */
function mocNgay(iso: unknown): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''));
  if (!m) return NaN;
  const [nam, thang, ngay] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return laNgayCoThat(nam, thang, ngay) ? Date.UTC(nam, thang - 1, ngay) : NaN;
}

/** Số ngày lịch từ `tu` tới `den` (âm khi `den` trước `tu`). Một trong hai không phải ngày có thật → NaN. */
export function soNgayGiua(tu: string, den: string): number {
  return Math.round((mocNgay(den) - mocNgay(tu)) / 86_400_000);
}

/**
 * Tình trạng ủ của một tảng theo ngày ủ xong — giống hệt view kho_v_tang (ủ xong SAU hôm nay = đang ủ;
 * hôm nay hoặc trước đó = sẵn sàng lóc; chưa có ngày ủ xong = chưa có bảng ủ). Tính ở web cho những chỗ
 * view không có: tảng đã vào phiên lóc (hết tồn nên không còn trong view). `homNay` lấy từ homNayVn().
 */
export function tinhTrangU(ngayUXong: string | null | undefined, homNay: string): Pick<TangTon, 'tinh_trang_u' | 'con_ngay_u'> {
  const con = ngayUXong ? soNgayGiua(homNay, ngayUXong) : NaN;
  if (Number.isNaN(con)) return { tinh_trang_u: 'chua_co_bang_u', con_ngay_u: null };
  return { tinh_trang_u: con > 0 ? 'dang_u' : 'san_sang', con_ngay_u: con };
}

/**
 * Câu nhắc khi lóc một tảng còn đang ủ: "Tảng #0001 còn đang ủ — ủ xong ngày 18/10/2026 (còn 7 ngày)."
 * Chỉ nhắc, không chặn (có lúc phải lóc sớm). Đã ủ xong, ủ xong hôm nay, chưa có bảng ủ → null.
 */
export function cauTangConU(
  t: { so_tang: number | null | undefined; ngay_u_xong: string | null | undefined } | null | undefined,
  homNay: string, nn: NgonNguNB = 'vi',
): string | null {
  if (!t) return null;
  const tt = tinhTrangU(t.ngay_u_xong, homNay);
  if (tt.tinh_trang_u !== 'dang_u') return null;
  const so = soTangChu(t.so_tang);
  const [ngay, con] = [dinhDangNgay(t.ngay_u_xong), cauConU(tt, nn)];
  return {
    vi: `Tảng${so ? ` ${so}` : ''} còn đang ủ — ủ xong ngày ${ngay} (${con}).`,
    en: `Primal${so ? ` ${so}` : ''} is still aging — aging ends on ${ngay} (${con}).`,
  }[nn];
}

// -----------------------------------------------------------------------------
// TRUY VẾT, BÁO CÁO, HUỶ CẢ TẢNG (0050)
// -----------------------------------------------------------------------------
export type TinhTrangBan = 'chua_loc' | 'dang_ban' | 'het';

export const TINH_TRANG_BAN_NB: Record<TinhTrangBan, HaiThuTieng> = {
  chua_loc: { vi: 'Chưa lóc', en: 'Not cut yet' },
  dang_ban: { vi: 'Đang bán', en: 'Selling' },
  het: { vi: 'Đã hết', en: 'Sold out' },
};

/**
 * Một dòng kho_bao_cao_tang — cũng là đầu trang truy vết. Cột tiền (don_gia_ncc,
 * gia_von_*) và phieu_nhap_id là null khi vai không xem giá.
 */
export interface DongTang {
  lo_id: string;
  so_tang: number;
  ma_lo: string;
  mat_hang_id: string;
  ten_hang: string;
  ten_ncc: string | null;
  phieu_nhap_id: string | null;
  so_phieu_nhap: string | null;
  ngay_mo: string | null;
  ngay_nhan: string;
  ngay_u_xong: string | null;
  han_dung: string;
  ngay_loc: string | null;
  ngay_het: string | null;
  kg_ncc: number | null;
  kg_repack: number | null;
  hao_repack_pt: number | null;
  kg_vao_loc: number | null;
  kg_thit: number | null;
  kg_phu_pham: number | null;
  kg_bo: number | null;
  kg_hao_hut: number | null;
  thu_hoi_pt: number | null;
  kg_ban: number;
  kg_bep: number;
  kg_huy: number;
  kg_con: number;
  ban_pt: number | null;
  so_ngay_ban: number | null;
  tinh_trang: TinhTrangBan;
  don_gia_ncc: number | null;
  gia_von_repack_kg: number | null;
  gia_von_thit_kg: number | null;
}

const COT_SO: (keyof DongTang)[] = [
  'so_tang', 'kg_ncc', 'kg_repack', 'hao_repack_pt', 'kg_vao_loc', 'kg_thit', 'kg_phu_pham', 'kg_bo', 'kg_hao_hut',
  'thu_hoi_pt', 'kg_ban', 'kg_bep', 'kg_huy', 'kg_con', 'ban_pt', 'so_ngay_ban', 'don_gia_ncc', 'gia_von_repack_kg',
  'gia_von_thit_kg',
];

/** Số từ database (numeric về dạng chuỗi) → number; null giữ null. */
export function chuanDongTang(r: Record<string, unknown>): DongTang {
  const ra = { ...r } as Record<string, unknown>;
  for (const c of COT_SO) ra[c] = r[c] === null || r[c] === undefined ? null : Number(r[c]);
  for (const c of ['kg_ban', 'kg_bep', 'kg_huy', 'kg_con'] as const) ra[c] = Number(r[c] ?? 0);
  return ra as unknown as DongTang;
}

/** Báo cáo theo tảng — tảng nhận trong kỳ (kho_bao_cao_tang, quyền xem). */
export async function docBaoCaoTang(client: SupabaseClient, chiNhanhId: string, tu: string, den: string): Promise<DongTang[]> {
  const { data, error } = await client.rpc('kho_bao_cao_tang', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(chuanDongTang);
}

export interface ChoCon { vi_tri: string; loai_vi_tri: string; so_kg: number; so_goi: number }

export interface LoRaTang {
  lo_id: string;
  ma_lo: string;
  mat_hang_id: string;
  ten_hang: string;
  loai_hang: string;
  dem_goi: boolean;
  don_vi_goi: string;
  han_dung: string;
  ngay_loc: string;
  kg_ra: number | null;
  gia_von_kg: number | null;
  o_ma: { so_o: number; ma_can: string; dang_giu: boolean } | null;
  kg_ban: number;
  kg_bep: number;
  kg_huy: number;
  ngay_ban_cuoi: string | null;
  con: ChoCon[];
}

export interface PhienCuaTang {
  id: string;
  so_phieu: string;
  ngay_pha: string;
  trang_thai: string;
  kg_vao: number;
  kg_thit: number | null;
  kg_phu_pham: number | null;
  kg_bo: number | null;
  kg_hao_hut: number | null;
  ty_le_thu_hoi: number | null;
}

export interface PhieuHuyTang { id: string; so_phieu: string; trang_thai: string; ngay: string; so_kg: number | null }

export interface TruyVetTang {
  co_gia: boolean;
  tang: DongTang;
  ton_tang: ChoCon[];
  phien: PhienCuaTang[];
  lo_ra: LoRaTang[];
  phieu_huy: PhieuHuyTang[];
}

const so = (x: unknown) => (x === null || x === undefined ? null : Number(x));
const choCon = (ds: unknown): ChoCon[] =>
  ((ds ?? []) as ChoCon[]).map(c => ({ ...c, so_kg: Number(c.so_kg), so_goi: Number(c.so_goi) }));

/** kho_truy_vet_tang → kiểu gọn (hàm thuần — test bằng node). */
export function chuanTruyVet(kq: Record<string, unknown>): TruyVetTang {
  return {
    co_gia: !!kq.co_gia,
    tang: chuanDongTang(kq.tang as Record<string, unknown>),
    ton_tang: choCon(kq.ton_tang),
    phien: ((kq.phien ?? []) as PhienCuaTang[]).map(p => ({
      ...p, kg_vao: Number(p.kg_vao), kg_thit: so(p.kg_thit), kg_phu_pham: so(p.kg_phu_pham),
      kg_bo: so(p.kg_bo), kg_hao_hut: so(p.kg_hao_hut), ty_le_thu_hoi: so(p.ty_le_thu_hoi),
    })),
    lo_ra: ((kq.lo_ra ?? []) as LoRaTang[]).map(l => ({
      ...l, kg_ra: so(l.kg_ra), gia_von_kg: so(l.gia_von_kg), kg_ban: Number(l.kg_ban), kg_bep: Number(l.kg_bep),
      kg_huy: Number(l.kg_huy), con: choCon(l.con),
    })),
    phieu_huy: ((kq.phieu_huy ?? []) as PhieuHuyTang[]).map(p => ({ ...p, so_kg: so(p.so_kg) })),
  };
}

/** Truy vết một tảng — lo_id là tảng hoặc lô cắt ra từ nó. null = không đọc được / không phải tảng. */
export async function docTruyVetTang(client: SupabaseClient, loId: string): Promise<{ tv: TruyVetTang | null; cau?: string }> {
  const { data, error } = await client.rpc('kho_truy_vet_tang', { p_lo_id: loId });
  if (error) return { tv: null, cau: cauLoiKho(error) };
  return { tv: data ? chuanTruyVet(data as Record<string, unknown>) : null };
}

/** Lô → số tảng gốc (kho_v_lo_tang). Dùng cho gợi ý xếp quầy. */
export async function docSoTangCuaLo(client: SupabaseClient, chiNhanhId: string): Promise<Map<string, number>> {
  const { data, error } = await client.from('kho_v_lo_tang').select('lo_id, so_tang').eq('chi_nhanh_id', chiNhanhId);
  if (error) throw error;
  return new Map((data ?? []).filter(r => r.so_tang !== null).map(r => [r.lo_id as string, Number(r.so_tang)]));
}

/** Mỗi lượt đọc `.in(…)` không quá ngần này lô — 150 mã lô vào khoảng 5.500 ký tự trên đường dẫn, dưới mọi giới hạn. */
const LO_MOI_LUOT = 150;

function chiaLuot(loIds: readonly unknown[]): string[][] {
  const ids = [...new Set(loIds.filter(laUuid))];
  const luot: string[][] = [];
  for (let i = 0; i < ids.length; i += LO_MOI_LUOT) luot.push(ids.slice(i, i + LO_MOI_LUOT));
  return luot;
}

/**
 * Số tảng của ĐÚNG các lô đang hiện trên trang (kho_v_lo_tang): lô là một tảng → chính nó; lô cắt ra từ một
 * tảng → tảng gốc; lô khác vắng mặt. Không có tiền — vai không xem giá (thủ kho, NV quầy) đọc được như nhau.
 * Đọc theo danh sách lô chứ không cả chi nhánh (docSoTangCuaLo): chi nhánh quá 1.000 lô thì PostgREST cắt bớt
 * mà không báo. Nhiều lô → vài lượt song song, không mỗi lô một lượt. Đọc hỏng thì ném — trang tự bắt và
 * vẫn hiện mã lô như cũ.
 */
export async function docLoTang(
  client: SupabaseClient, loIds: readonly unknown[],
): Promise<Map<string, { tang_id: string; so_tang: number | null }>> {
  const ra = new Map<string, { tang_id: string; so_tang: number | null }>();
  const kq = await Promise.all(chiaLuot(loIds).map(ds =>
    client.from('kho_v_lo_tang').select('lo_id, tang_id, so_tang').in('lo_id', ds)));
  for (const { data, error } of kq) {
    if (error) throw error;
    for (const r of data ?? []) {
      ra.set(r.lo_id as string, { tang_id: r.tang_id as string, so_tang: r.so_tang === null || r.so_tang === undefined ? null : Number(r.so_tang) });
    }
  }
  return ra;
}

/** Ngày mổ, ngày ủ xong, số tảng của các lô tảng (kho_lo) — cho mục "Tảng đem pha" và câu nhắc tảng còn ủ. */
export async function docNgayUTang(
  client: SupabaseClient, loIds: readonly unknown[],
): Promise<Map<string, { so_tang: number | null; ngay_mo: string | null; ngay_u_xong: string | null }>> {
  const ra = new Map<string, { so_tang: number | null; ngay_mo: string | null; ngay_u_xong: string | null }>();
  const kq = await Promise.all(chiaLuot(loIds).map(ds =>
    client.from('kho_lo').select('id, so_tang, ngay_mo, ngay_u_xong').in('id', ds)));
  for (const { data, error } of kq) {
    if (error) throw error;
    for (const r of data ?? []) {
      ra.set(r.id as string, {
        so_tang: r.so_tang === null || r.so_tang === undefined ? null : Number(r.so_tang),
        ngay_mo: (r.ngay_mo as string | null) ?? null,
        ngay_u_xong: (r.ngay_u_xong as string | null) ?? null,
      });
    }
  }
  return ra;
}

/** Tìm tảng theo số ("142", "#0142") trong danh sách. */
export function timTangTheoSo(ds: { lo_id: string; so_tang: number | null }[], chu: string): string | null {
  const m = /^\s*#?\s*0*(\d{1,7})\s*$/.exec(chu);
  if (!m) return null;
  return ds.find(d => d.so_tang === Number(m[1]))?.lo_id ?? null;
}

/**
 * Câu khi ô tìm ở Tảng · ủ không thấy số tảng. Ô tìm chỉ tìm trong lô (kho_v_tang, kho_bao_cao_tang) mà lô chỉ có
 * sau khi DUYỆT phiếu nhận; từ 0097 số tảng đã cấp và viết lên túi ngay lúc nhận hàng. Nên "không thấy" chỉ đúng với
 * tảng đã duyệt — tảng ở phiếu nhận chưa duyệt có số thật mà chưa hiện ở đây. Không đọc bảng dòng phiếu để tìm thêm:
 * thủ kho, thợ lóc không đọc được dòng phiếu (có giá).
 * `coNhap`: người xem có quyền nhap. Tảng · ủ mở cho mọi vai xem (kế toán, nhân viên quầy…) mà màn Nhận hàng chuyển
 * hướng vai không có nhap — chỉ vai nhap mới được chỉ sang Nhận hàng; vai khác dừng ở câu về việc duyệt phiếu.
 */
export function cauKhongThayTang(x: string, coNhap: boolean): HaiThuTieng {
  const cau: HaiThuTieng = {
    vi: `Không thấy tảng "${x}" trong các tảng đã duyệt 90 ngày gần đây. Số tảng cấp lúc nhận hàng chỉ hiện ở đây (và mới lóc được) sau khi phiếu nhận được duyệt`,
    en: `No approved primal "${x}" in the last 90 days. A primal number given at receiving shows here (and can be cut) only after its receiving note is approved`,
  };
  const duoi: HaiThuTieng = coNhap
    ? { vi: ' — tảng vừa nhận thì xem ở Nhận hàng.', en: ' — for a primal just received, check Receive goods.' }
    : { vi: '.', en: '.' };
  return { vi: cau.vi + duoi.vi, en: cau.en + duoi.en };
}

/**
 * Huỷ cả tảng (quyền van_hanh): mỗi vị trí còn hàng một phiếu báo huỷ, chờ duyệt.
 * ma_gui: cùng lần bấm (F5 không tạo thêm phiếu).
 */
export async function huyCaTang(
  client: SupabaseClient,
  a: { loId: string; maGui: string; lyDoId: string | null; ghiChu: string; anh: string[] },
): Promise<KetQua & { phieu?: { id: string; so_phieu: string }[] }> {
  const { data, error } = await client.rpc('kho_huy_ca_tang', {
    p_lo_id: a.loId, p_ma_gui: a.maGui, p_ly_do_id: a.lyDoId, p_ghi_chu: a.ghiChu || null, p_anh: a.anh.length ? a.anh : null,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = data as { so_tang: number; kg_dang_chuyen: number; phieu: { id: string; so_phieu: string }[] };
  const sp = kq.phieu.map(p => p.so_phieu).join(', ');
  const dc = Number(kq.kg_dang_chuyen) > 0;
  return {
    ...kqHai(true, {
      vi: `Đã lập ${kq.phieu.length} phiếu báo huỷ tảng ${soTangChu(kq.so_tang)}: ${sp} — chờ quản lý duyệt. Nhặt mọi miếng có "${soTangChu(kq.so_tang)}" trên tem ở kho và quầy.${dc ? ' Còn hàng đang mang ra quầy — quầy nhận xong thì bấm huỷ lần nữa.' : ''}`,
      en: `Created ${kq.phieu.length} write-off note(s) for primal ${soTangChu(kq.so_tang)}: ${sp} — waiting for manager approval. Pick up every piece with "${soTangChu(kq.so_tang)}" on its label in the store and at the counter.${dc ? ' Some goods are still on the way to the counter — once the counter receives them, press write-off again.' : ''}`,
    }),
    phieu: kq.phieu,
  };
}

// -----------------------------------------------------------------------------
// BÁO CÁO THEO TẢNG — cột (trang bao-cao/theo-tang và file CSV dùng chung)
// -----------------------------------------------------------------------------
export function cotTheoTang(coGia: boolean, nn: NgonNguNB = 'vi'): CotBaoCao[] {
  const c = (x: HaiThuTieng) => x[nn];
  return [
    { khoa: 'so_tang_chu', ten: c({ vi: 'Số tảng', en: 'Primal no.' }), kieu: 'chu' },
    { khoa: 'ten_hang', ten: c({ vi: 'Món', en: 'Item' }), kieu: 'chu' },
    { khoa: 'ten_ncc', ten: c({ vi: 'Nhà cung cấp', en: 'Supplier' }), kieu: 'chu' },
    { khoa: 'ngay_nhan_chu', ten: c({ vi: 'Ngày nhận', en: 'Received' }), kieu: 'chu' },
    { khoa: 'ngay_loc_chu', ten: c({ vi: 'Ngày lóc', en: 'Cut on' }), kieu: 'chu' },
    { khoa: 'tinh_trang_chu', ten: c({ vi: 'Tình trạng', en: 'Status' }), kieu: 'chu' },
    { khoa: 'kg_ncc', ten: c({ vi: 'Kg NCC', en: 'Supplier kg' }), kieu: 'kg' },
    { khoa: 'kg_repack', ten: c({ vi: 'Kg sau repack', en: 'Kg after repack' }), kieu: 'kg' },
    { khoa: 'kg_hao_repack', ten: c({ vi: 'Hao repack kg', en: 'Repack loss kg' }), kieu: 'kg' },
    { khoa: 'hao_repack_pt', ten: c({ vi: 'Hao repack %', en: 'Repack loss %' }), kieu: 'pt' },
    { khoa: 'kg_vao_loc', ten: c({ vi: 'Kg vào lóc', en: 'Kg into cutting' }), kieu: 'kg' },
    { khoa: 'kg_thit', ten: c({ vi: 'Kg thịt', en: 'Meat kg' }), kieu: 'kg' },
    { khoa: 'thu_hoi_pt', ten: c({ vi: 'Thu hồi %', en: 'Yield %' }), kieu: 'pt' },
    { khoa: 'kg_bo', ten: c({ vi: 'Kg bỏ', en: 'Discarded kg' }), kieu: 'kg' },
    { khoa: 'kg_hao_hut', ten: c({ vi: 'Kg hao hụt', en: 'Loss kg' }), kieu: 'kg' },
    { khoa: 'kg_ban', ten: c({ vi: 'Kg bán', en: 'Kg sold' }), kieu: 'kg' },
    { khoa: 'kg_bep', ten: c({ vi: 'Kg xuất bếp', en: 'Kg to kitchen' }), kieu: 'kg' },
    { khoa: 'kg_huy', ten: c({ vi: 'Kg huỷ', en: 'Kg written off' }), kieu: 'kg' },
    { khoa: 'kg_con', ten: c({ vi: 'Kg còn', en: 'Kg left' }), kieu: 'kg' },
    { khoa: 'so_ngay_ban', ten: c({ vi: 'Ngày từ lóc tới hết', en: 'Days from cut to sold out' }), kieu: 'so' },
    ...(coGia ? [
      { khoa: 'don_gia_ncc', ten: c({ vi: 'Giá NCC/kg', en: 'Supplier price/kg' }), kieu: 'tien' as const, tienMat: true },
      { khoa: 'gia_von_repack_kg', ten: c({ vi: 'Giá vốn sau repack/kg', en: 'Cost after repack/kg' }), kieu: 'tien' as const, tienMat: true },
      { khoa: 'gia_von_thit_kg', ten: c({ vi: 'Giá vốn thịt/kg', en: 'Meat cost/kg' }), kieu: 'tien' as const, tienMat: true },
    ] : []),
  ];
}

export function dinhNghiaTheoTang(coGia: boolean, nn: NgonNguNB = 'vi'): DinhNghiaBaoCao {
  const c = (x: HaiThuTieng) => x[nn];
  return {
    ten: c({ vi: 'Theo tảng', en: 'By primal' }),
    moTa: c({
      vi: 'Mỗi tảng nhận trong kỳ: kg nhà cung cấp → sau repack → vào lóc → thịt, bỏ, hao hụt → bán, bếp, huỷ, còn.',
      en: 'Each primal received in the period: supplier kg → after repack → into cutting → meat, discarded, loss → sold, kitchen, written off, left.',
    }),
    cot: cotTheoTang(coGia, nn),
    cong: ['kg_ncc', 'kg_repack', 'kg_hao_repack', 'kg_vao_loc', 'kg_thit', 'kg_bo', 'kg_hao_hut', 'kg_ban', 'kg_bep', 'kg_huy', 'kg_con'],
    chiaTong: { thu_hoi_pt: { tu: 'kg_thit', mau: 'kg_vao_loc', nhan: 100 } },
    khiTrong: {
      cau: c({
        vi: 'Kỳ này chưa nhận tảng nào của món theo dõi theo tảng',
        en: 'No primals of items tracked per primal were received in this period',
      }),
      link: [
        { ten: c({ vi: 'Nhận hàng', en: 'Receive goods' }), href: '/noi-bo/kho/nhan-hang' },
        { ten: c({ vi: 'Thiết lập mặt hàng', en: 'Item setup' }), href: '/noi-bo/kho/cai-dat/mat-hang' },
      ],
    },
  };
}

/** Dòng báo cáo → dòng bảng / CSV: số tảng, ngày, tình trạng thành chữ. */
export function dongBangTheoTang(ds: DongTang[], nn: NgonNguNB = 'vi'): Record<string, unknown>[] {
  return ds.map(d => ({
    ...d,
    so_tang_chu: soTangChu(d.so_tang),
    ngay_nhan_chu: dinhDangNgay(d.ngay_nhan),
    ngay_loc_chu: d.ngay_loc ? dinhDangNgay(d.ngay_loc) : '',
    tinh_trang_chu: TINH_TRANG_BAN_NB[d.tinh_trang]?.[nn] ?? d.tinh_trang,
    kg_hao_repack: d.hao_repack_pt !== null && d.kg_ncc !== null && d.kg_repack !== null
      ? Math.round((d.kg_ncc - d.kg_repack) * 1000) / 1000 : null,
  }));
}
