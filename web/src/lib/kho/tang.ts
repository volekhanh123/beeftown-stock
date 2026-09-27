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
import { cauLoiKho, dinhDangNgay, kqHai, type HaiThuTieng, type KetQua, type NgonNguNB } from './chung.ts';
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
}

/**
 * Tảng còn trong kho của chi nhánh. Xếp: sẵn sàng lóc trước (ủ xong sớm nhất
 * trước), rồi đang ủ (sắp xong trước), rồi chưa có bảng ủ.
 */
export async function docTangTon(client: SupabaseClient, chiNhanhId: string): Promise<TangTon[]> {
  const { data, error } = await client.from('kho_v_tang')
    .select('lo_id, ma_lo, so_tang, mat_hang_id, ma_hang, ten_hang, ngay_mo, ngay_nhan, ngay_u_xong, han_dung, tuoi_ngay, con_ngay_u, tinh_trang_u, so_kg, so_goi, vi_tri')
    .eq('chi_nhanh_id', chiNhanhId);
  if (error) throw error;
  return sapTang((data ?? []).map(r => ({
    ...r,
    so_kg: Number(r.so_kg),
    so_goi: Number(r.so_goi ?? 0),
    tuoi_ngay: r.tuoi_ngay === null ? null : Number(r.tuoi_ngay),
    con_ngay_u: r.con_ngay_u === null ? null : Number(r.con_ngay_u),
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

/** Tìm tảng theo số ("142", "#0142") trong danh sách. */
export function timTangTheoSo(ds: { lo_id: string; so_tang: number | null }[], chu: string): string | null {
  const m = /^\s*#?\s*0*(\d{1,7})\s*$/.exec(chu);
  if (!m) return null;
  return ds.find(d => d.so_tang === Number(m[1]))?.lo_id ?? null;
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
