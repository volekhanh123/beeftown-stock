/**
 * KHO — ĐỌC TỒN KHO
 *
 * Tồn theo lô × vị trí, lấy từ view kho_v_ton (0020): không có tiền, ai dùng
 * kho cũng đọc được. Giá trị tồn đọc riêng từ kho_v_ton_gia — nhân viên
 * quầy/bếp đọc view đó sẽ nhận về rỗng (RLS), đúng như chủ nhà hàng đã chốt.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface DongTon {
  lo_id: string;
  ma_lo: string;
  mat_hang_id: string;
  ma_hang: string;
  ten_hang: string;
  nhom: string | null;
  loai_hang: 'tang' | 'phan_cat' | 'phu_pham';
  dem_goi: boolean;
  don_vi_goi: string;
  vi_tri_id: string;
  ten_vi_tri: string;
  loai_vi_tri: 'kho' | 'quay' | 'cho_huy';
  so_kg: number;
  so_goi: number;
  nguon: string;
  ngay_dong_goi: string;
  han_dung: string;
  so_ngay_con: number;
  tinh_trang_han: 'het_han' | 'sap_het' | 'con_han';
}

export async function docTon(client: SupabaseClient, chiNhanhId: string): Promise<DongTon[]> {
  const { data, error } = await client
    .from('kho_v_ton')
    .select('lo_id, ma_lo, mat_hang_id, ma_hang, ten_hang, nhom, loai_hang, dem_goi, don_vi_goi, vi_tri_id, ten_vi_tri, loai_vi_tri, so_kg, so_goi, nguon, ngay_dong_goi, han_dung, so_ngay_con, tinh_trang_han')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('han_dung')
    .order('ma_lo')
    .limit(2000);
  if (error) throw error;
  return (data ?? []).map(r => ({ ...r, so_kg: Number(r.so_kg), so_ngay_con: Number(r.so_ngay_con) })) as DongTon[];
}

/** Giá trị tồn theo "lo_id|vi_tri_id". Vai không xem giá: Map rỗng. */
export async function docGiaTon(client: SupabaseClient, chiNhanhId: string): Promise<Map<string, { gia_von_kg: number; gia_tri: number }>> {
  const ra = new Map<string, { gia_von_kg: number; gia_tri: number }>();
  const { data } = await client
    .from('kho_v_ton_gia')
    .select('lo_id, vi_tri_id, gia_von_kg, gia_tri')
    .eq('chi_nhanh_id', chiNhanhId)
    .limit(2000);
  for (const r of data ?? []) {
    ra.set(`${r.lo_id}|${r.vi_tri_id}`, { gia_von_kg: Number(r.gia_von_kg), gia_tri: Number(r.gia_tri) });
  }
  return ra;
}

export interface TonMatHang {
  mat_hang_id: string;
  ma_hang: string;
  ten_hang: string;
  nhom: string | null;
  loai_hang: string;
  dem_goi: boolean;
  don_vi_goi: string;
  so_kg: number;
  so_goi: number;
  so_lo: number;
  han_som_nhat: string;
  tinh_trang_xau_nhat: 'het_han' | 'sap_het' | 'con_han';
  lo: DongTon[];
}

const MUC_HAN = { het_han: 0, sap_het: 1, con_han: 2 } as const;

/** Gom tồn theo mặt hàng; lô trong mỗi mặt hàng xếp hết hạn trước (FEFO). */
export function gomTheoMatHang(ds: DongTon[]): TonMatHang[] {
  const theo = new Map<string, TonMatHang>();
  for (const d of ds) {
    let g = theo.get(d.mat_hang_id);
    if (!g) {
      g = {
        mat_hang_id: d.mat_hang_id, ma_hang: d.ma_hang, ten_hang: d.ten_hang, nhom: d.nhom,
        loai_hang: d.loai_hang, dem_goi: d.dem_goi, don_vi_goi: d.don_vi_goi,
        so_kg: 0, so_goi: 0, so_lo: 0, han_som_nhat: d.han_dung,
        tinh_trang_xau_nhat: d.tinh_trang_han, lo: [],
      };
      theo.set(d.mat_hang_id, g);
    }
    // Cộng theo gram để 0,1 + 0,2 không thành 0,30000000000000004.
    g.so_kg = Math.round(g.so_kg * 1000 + d.so_kg * 1000) / 1000;
    g.so_goi += d.so_goi;
    g.lo.push(d);
    if (d.han_dung < g.han_som_nhat) g.han_som_nhat = d.han_dung;
    if (MUC_HAN[d.tinh_trang_han] < MUC_HAN[g.tinh_trang_xau_nhat]) g.tinh_trang_xau_nhat = d.tinh_trang_han;
  }
  for (const g of theo.values()) {
    g.so_lo = new Set(g.lo.map(l => l.lo_id)).size;
    g.lo.sort((a, b) => a.han_dung.localeCompare(b.han_dung) || a.ma_lo.localeCompare(b.ma_lo));
  }
  return [...theo.values()].sort((a, b) =>
    MUC_HAN[a.tinh_trang_xau_nhat] - MUC_HAN[b.tinh_trang_xau_nhat]
    || a.loai_hang.localeCompare(b.loai_hang)
    || a.ten_hang.localeCompare(b.ten_hang, 'vi'));
}

/** Mặt hàng đang ở quầy dưới mức tồn tối thiểu (cần pha thêm / ra quầy thêm). */
export function quaySapHet(
  ton: DongTon[],
  matHang: { id: string; ten: string; ton_toi_thieu_kg: number | null; don_vi_goi: string; dang_dung: boolean }[],
): { id: string; ten: string; con_kg: number; toi_thieu_kg: number }[] {
  const quay = new Map<string, number>();
  for (const t of ton) {
    if (t.loai_vi_tri !== 'quay') continue;
    quay.set(t.mat_hang_id, Math.round((quay.get(t.mat_hang_id) ?? 0) * 1000 + t.so_kg * 1000) / 1000);
  }
  return matHang
    .filter(m => m.dang_dung && m.ton_toi_thieu_kg !== null && (quay.get(m.id) ?? 0) < (m.ton_toi_thieu_kg ?? 0))
    .map(m => ({ id: m.id, ten: m.ten, con_kg: quay.get(m.id) ?? 0, toi_thieu_kg: m.ton_toi_thieu_kg ?? 0 }));
}
