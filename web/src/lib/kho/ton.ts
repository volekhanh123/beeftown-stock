/**
 * KHO — ĐỌC TỒN KHO
 *
 * Tồn theo lô × vị trí, lấy từ view kho_v_ton (0020): không có tiền, ai dùng
 * kho cũng đọc được. Giá trị tồn đọc riêng từ kho_v_ton_gia — nhân viên
 * quầy/bếp đọc view đó sẽ nhận về rỗng (RLS), đúng như chủ nhà hàng đã chốt.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { boDau } from './chung.ts';

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
  /** dang_chuyen (0032): hàng đang mang ra quầy, chưa bấm nhận. */
  loai_vi_tri: 'kho' | 'quay' | 'cho_huy' | 'dang_chuyen';
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

/**
 * Mặt hàng đang ở quầy dưới mức tồn tối thiểu (cần pha thêm / ra quầy thêm).
 *
 * Gói ĐÃ HẾT HẠN không tính là còn hàng: quầy chỉ còn thịt hết hạn thì vẫn
 * phải báo "sắp hết" — bán không được, chỉ chờ hủy. Cùng luật với số đỏ
 * "quay_duoi_muc" của kho_dem_viec (0030), để trang chủ và trang Tồn kho ra
 * cùng một con số.
 */
export function quaySapHet(
  ton: DongTon[],
  matHang: { id: string; ten: string; ton_toi_thieu_kg: number | null; don_vi_goi: string; dang_dung: boolean }[],
): { id: string; ten: string; con_kg: number; toi_thieu_kg: number }[] {
  const quay = new Map<string, number>();
  for (const t of ton) {
    if (t.loai_vi_tri !== 'quay' || t.tinh_trang_han === 'het_han') continue;
    quay.set(t.mat_hang_id, Math.round((quay.get(t.mat_hang_id) ?? 0) * 1000 + t.so_kg * 1000) / 1000);
  }
  return matHang
    .filter(m => m.dang_dung && m.ton_toi_thieu_kg !== null && (quay.get(m.id) ?? 0) < (m.ton_toi_thieu_kg ?? 0))
    .map(m => ({ id: m.id, ten: m.ten, con_kg: quay.get(m.id) ?? 0, toi_thieu_kg: m.ton_toi_thieu_kg ?? 0 }));
}

// -----------------------------------------------------------------------------
// BỘ LỌC TRANG TỒN KHO — hàm thuần, test bằng node được
// -----------------------------------------------------------------------------
// Link dùng chung cả app: /noi-bo/kho/ton?han=het_han|sap_het, ?duoi_muc=1,
// ?vi_tri=quay, ?loai=tang, ?q=<chữ>. Giá trị lạ thì coi như không lọc.

export interface BoLocTon {
  viTri: '' | 'kho' | 'quay' | 'cho_huy';
  /** Hai mức RIÊNG BIỆT: "sắp hết" không gồm lô đã hết hạn. */
  han: '' | 'het_han' | 'sap_het';
  loai: '' | 'tang' | 'phan_cat' | 'phu_pham';
  /** Chỉ món quầy dưới mức tối thiểu (xem quaySapHet). */
  duoiMuc: boolean;
  tim: string;
}

const chon = <T extends string>(v: string | null, ds: readonly T[]): T | '' =>
  (ds as readonly string[]).includes(v ?? '') ? (v as T) : '';

/** Đọc bộ lọc từ link. "?tim=" là tên cũ của "?q=" — vẫn nhận. */
export function docBoLocTon(q: URLSearchParams): BoLocTon {
  return {
    viTri: chon(q.get('vi_tri'), ['kho', 'quay', 'cho_huy'] as const),
    han: chon(q.get('han'), ['het_han', 'sap_het'] as const),
    loai: chon(q.get('loai'), ['tang', 'phan_cat', 'phu_pham'] as const),
    duoiMuc: q.get('duoi_muc') === '1',
    tim: (q.get('q') ?? q.get('tim') ?? '').trim().slice(0, 80),
  };
}

/** Link trang Tồn kho giữ các bộ lọc đang chọn, đổi vài cái trong `thay`. */
export function linkTon(b: BoLocTon, thay: Partial<Record<'vi_tri' | 'han' | 'loai' | 'duoi_muc' | 'q', string>> = {}): string {
  const p = new URLSearchParams({
    vi_tri: b.viTri, han: b.han, loai: b.loai, duoi_muc: b.duoiMuc ? '1' : '', q: b.tim, ...thay,
  });
  for (const [kk, v] of [...p.entries()]) if (!v) p.delete(kk);
  const s = p.toString();
  return `/noi-bo/kho/ton${s ? `?${s}` : ''}`;
}

/**
 * Lọc dòng tồn theo bộ lọc.
 *
 * Lọc theo hạn mà không chọn nơi thì bỏ hàng ở chỗ "Chờ hủy" — hàng đó đã có
 * phiếu hủy lo rồi, và số trên trang chủ (kho_dem_viec) cũng chỉ đếm kho +
 * quầy. Muốn xem thì chọn nơi "Chờ hủy".
 *
 * `chiMatHang`: chỉ giữ các mặt hàng này (vd. món quầy dưới mức); null = mọi món.
 */
export function locTon(ds: DongTon[], b: BoLocTon, chiMatHang: Set<string> | null = null): DongTon[] {
  const tim = boDau(b.tim).toLowerCase();
  return ds.filter(t =>
    (b.viTri ? t.loai_vi_tri === b.viTri : !b.han || t.loai_vi_tri !== 'cho_huy')
    && (!b.han || t.tinh_trang_han === b.han)
    && (!b.loai || t.loai_hang === b.loai)
    && (!chiMatHang || chiMatHang.has(t.mat_hang_id))
    && (!tim || boDau(`${t.ten_hang} ${t.ma_hang} ${t.ma_lo} ${t.nhom ?? ''}`).toLowerCase().includes(tim)));
}

/**
 * Việc làm nhanh với một lô (vai "van_hanh"): link mở sẵn phiếu với đúng nơi
 * lấy và đúng lô. Hết hạn → chỉ còn "Báo hủy". Hàng ở chỗ chờ hủy, hàng đang
 * mang ra quầy (0032 — chỉ nhận / hủy chuyến mới đụng được) → không có gì.
 */
export function viecVoiLo(t: DongTon): { ma: 'chuyen' | 'xuat_bep' | 'huy'; ten: string; link: string }[] {
  if (t.loai_vi_tri === 'cho_huy' || t.loai_vi_tri === 'dang_chuyen' || (t.so_kg <= 0 && t.so_goi <= 0)) return [];
  const link = (loai: 'chuyen' | 'xuat_bep' | 'huy') =>
    `/noi-bo/kho/xuat/moi?loai=${loai}&tu=${encodeURIComponent(t.vi_tri_id)}&lo=${encodeURIComponent(t.lo_id)}`;
  if (t.tinh_trang_han === 'het_han') return [{ ma: 'huy', ten: 'Báo hủy', link: link('huy') }];
  return [
    ...(t.loai_vi_tri === 'kho' ? [{ ma: 'chuyen' as const, ten: 'Ra quầy', link: link('chuyen') }] : []),
    { ma: 'xuat_bep', ten: 'Đưa bếp', link: link('xuat_bep') },
    { ma: 'huy', ten: 'Báo hủy', link: link('huy') },
  ];
}
