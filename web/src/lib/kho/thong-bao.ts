/**
 * KHO — ĐỌC THÔNG BÁO, CHỈ SỐ QUẢN TRỊ, LƯU NGƯỠNG (0030)
 *
 * Câu chữ của từng sự kiện ở lib/kho/viec.ts (thuần). File này chỉ gọi database.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, kqHai, kqLoi, type KetQua, type HaiThuTieng, type NgonNguNB } from './chung.ts';
import type { SuKien } from './viec.ts';

export async function docThongBao(
  client: SupabaseClient, chiNhanhId: string, gioiHan = 100, nn: NgonNguNB = 'vi',
): Promise<{ suKien: SuKien[]; xemLuc: string | null; loi: string | null }> {
  try {
    const { data, error } = await client.rpc('kho_thong_bao', { p_chi_nhanh_id: chiNhanhId, p_gioi_han: gioiHan });
    if (error) throw error;
    const d = (data ?? {}) as { su_kien?: SuKien[]; xem_luc?: string | null };
    return { suKien: d.su_kien ?? [], xemLuc: d.xem_luc ?? null, loi: null };
  } catch (e) {
    return { suKien: [], xemLuc: null, loi: cauLoiKho(e, { vi: 'Không đọc được thông báo.', en: 'Could not read the notifications.' }[nn]) };
  }
}

/** Mở trang chuông = đã đọc mọi thứ tới lúc này. Lỗi thì thôi — lần sau đọc lại. */
export async function daXemThongBao(client: SupabaseClient, chiNhanhId: string): Promise<void> {
  try { await client.rpc('kho_da_xem_thong_bao', { p_chi_nhanh_id: chiNhanhId }); } catch { /* bỏ qua */ }
}

export interface ChiSoQuanTri {
  tu: string; den: string;
  gia_tri_ton_kho: number; gia_tri_ton_quay: number;
  mh_het_quay: number; mh_duoi_muc: number;
  so_phien_pha: number;
  thu_hoi_pt: number | null; thu_hoi_pt_truoc: number | null;
  gia_von_kg: number | null; gia_von_kg_truoc: number | null;
  chi_phi_thit: number; chi_phi_thit_truoc: number;
  huy: number; kiem_ke_thieu: number; kiem_ke_thua: number; xuat_bep: number;
  ban_gia_von: number; ban_kg: number; doanh_thu_uoc_tinh: number;
}

export async function docChiSoQuanTri(
  client: SupabaseClient, chiNhanhId: string, tu: string, den: string,
): Promise<ChiSoQuanTri | null> {
  try {
    const { data, error } = await client.rpc('kho_chi_so_quan_tri', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
    if (error) throw error;
    const d = (data ?? {}) as Record<string, unknown>;
    const so = (k: string) => (d[k] === null || d[k] === undefined ? null : Number(d[k]));
    return {
      tu: String(d.tu ?? tu), den: String(d.den ?? den),
      gia_tri_ton_kho: so('gia_tri_ton_kho') ?? 0, gia_tri_ton_quay: so('gia_tri_ton_quay') ?? 0,
      mh_het_quay: so('mh_het_quay') ?? 0, mh_duoi_muc: so('mh_duoi_muc') ?? 0,
      so_phien_pha: so('so_phien_pha') ?? 0,
      thu_hoi_pt: so('thu_hoi_pt'), thu_hoi_pt_truoc: so('thu_hoi_pt_truoc'),
      gia_von_kg: so('gia_von_kg'), gia_von_kg_truoc: so('gia_von_kg_truoc'),
      chi_phi_thit: so('chi_phi_thit') ?? 0, chi_phi_thit_truoc: so('chi_phi_thit_truoc') ?? 0,
      huy: so('huy') ?? 0, kiem_ke_thieu: so('kiem_ke_thieu') ?? 0, kiem_ke_thua: so('kiem_ke_thua') ?? 0,
      xuat_bep: so('xuat_bep') ?? 0, ban_gia_von: so('ban_gia_von') ?? 0, ban_kg: so('ban_kg') ?? 0,
      doanh_thu_uoc_tinh: so('doanh_thu_uoc_tinh') ?? 0,
    };
  } catch {
    return null;
  }
}

export const TEN_NGUONG_NB: Record<string, { ten: HaiThuTieng; don_vi: HaiThuTieng; goi_y: HaiThuTieng }> = {
  nguong_gia_mua_pt: {
    ten: { vi: 'Giá nhập tăng quá', en: 'Purchase price rises by more than' },
    don_vi: { vi: '%', en: '%' },
    goi_y: { vi: 'So với lần nhập trước, cùng mặt hàng, cùng nhà cung cấp. Chỉ cảnh báo.',
             en: 'Compared with the previous receipt of the same item from the same supplier. Warning only.' },
  },
  nguong_thu_hoi_diem: {
    ten: { vi: 'Thu hồi pha lóc thấp hơn dự kiến quá', en: 'Butchery yield below expected by more than' },
    don_vi: { vi: 'điểm %', en: 'percentage points' },
    goi_y: { vi: 'Ví dụ dự kiến 72%, ngưỡng 3 → dưới 69% thì báo quản lý.',
             en: 'For example, expected 72% with threshold 3 → below 69% alerts the manager.' },
  },
  gio_nhac_chuyen: {
    ten: { vi: 'Hàng mang ra quầy chưa xác nhận sau', en: 'Goods brought to the counter not confirmed after' },
    don_vi: { vi: 'giờ', en: 'hours' },
    goi_y: { vi: 'Quá giờ này mà quầy chưa bấm "Đã nhận" thì báo.',
             en: 'Alert if the counter has not pressed "Received" by then.' },
  },
  gio_chot_ngay: {
    ten: { vi: 'Giờ chốt ngày (sáng)', en: 'Day close time (morning)' },
    don_vi: { vi: 'giờ', en: 'o\'clock' },
    goi_y: { vi: 'Sau giờ này mà quầy chưa đếm ngày hôm qua thì báo.',
             en: 'Alert if the counter has not counted yesterday by this time.' },
  },
  nguong_dinh_muc_pt: {
    ten: { vi: 'Thịt xuất bếp lệch định lượng quá', en: 'Kitchen meat differs from recipes by more than' },
    don_vi: { vi: '%', en: '%' },
    goi_y: { vi: 'Dùng khi đã nối iPOS và khai định lượng món.',
             en: 'Used once iPOS is connected and dish recipes are entered.' },
  },
};
export const TEN_NGUONG: Record<string, { ten: string; don_vi: string; goi_y: string }> = Object.fromEntries(
  Object.entries(TEN_NGUONG_NB).map(([k, v]) => [k, { ten: v.ten.vi, don_vi: v.don_vi.vi, goi_y: v.goi_y.vi }]),
);

export async function luuNguong(client: SupabaseClient, chiNhanhId: string, form: FormData): Promise<KetQua> {
  const nguong: Record<string, number> = {};
  for (const khoa of Object.keys(TEN_NGUONG)) {
    const v = String(form.get(khoa) ?? '').trim().replace(',', '.');
    if (v === '') continue;
    const n = Number(v);
    if (!Number.isFinite(n)) {
      const ten = TEN_NGUONG_NB[khoa].ten;
      return kqHai(false, { vi: `"${ten.vi}" phải là một con số.`, en: `"${ten.en}" must be a number.` });
    }
    nguong[khoa] = n;
  }
  const { error } = await client.rpc('kho_luu_nguong', { p_chi_nhanh_id: chiNhanhId, p_nguong: nguong });
  if (error) return kqLoi(error);
  return kqHai(true, { vi: 'Đã lưu các ngưỡng cảnh báo.', en: 'Alert thresholds saved.' });
}
