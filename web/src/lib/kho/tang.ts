/**
 * KHO — THEO DÕI THEO TẢNG (0046): bảng ủ, số tảng, danh sách tảng đang ủ.
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
import { cauLoiKho, kqHai, type HaiThuTieng, type KetQua, type NgonNguNB } from './chung.ts';

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

/** Tra số ngày ủ — cùng luật với kho_so_ngay_u (0046). null = món chưa có bảng. */
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
