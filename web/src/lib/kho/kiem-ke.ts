/**
 * KHO — KIỂM KÊ
 *
 * Đếm một vị trí (quầy cuối ngày, kho lạnh), gửi quản lý duyệt. Duyệt thì
 * database ghi phần chênh so với sổ lúc gửi (kho_duyet_kiem_ke, 0023):
 * quầy đếm theo mặt hàng được DỰNG LẠI TỒN — lô mới nhất giữ lại, phần thiếu
 * ghi là bán (khi chưa nối iPOS).
 *
 * ĐẾM MÙ: lúc đang đếm, trang KHÔNG hiện số trên sổ — người đếm ghi đúng cái
 * mình thấy. Sổ và chênh lệch hiện khi phiếu đã gửi.
 *
 * FORM: k{i}_mh / k{i}_lo (ẩn), k{i}_goi, k{i}_kg, k{i}_het ("co").
 * Thêm mặt hàng tìm thấy ngoài danh sách: them_mat_hang, them_goi, them_kg.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, docKg, docSoNguyen, laUuid, type KetQua } from './chung.ts';
import { gomTheoMaCan, tachDanhSachMa } from './ma-vach.ts';

export interface KiemKeTom {
  id: string;
  so_phieu: string;
  vi_tri_id: string;
  ten_vi_tri: string;
  loai_vi_tri: string;
  kieu: 'theo_mat_hang' | 'theo_lo';
  ngay_kiem: string;
  trang_thai: 'dang_dem' | 'cho_duyet' | 'da_duyet' | 'da_huy';
  so_dong: number;
  so_dong_da_dem: number;
  nguoi_tao: string | null;
  created_at: string;
}

export interface KiemKe extends KiemKeTom {
  chi_nhanh_id: string;
  phien_ban: number;
  nguon_so_ban: 'kiem_ke' | 'ipos';
  ghi_chu: string | null;
  ly_do: string | null;
  nguoi_gui: string | null;
  gui_luc: string | null;
  nguoi_duyet: string | null;
  duyet_luc: string | null;
}

export interface DongKiemKe {
  id: string;
  thu_tu: number;
  mat_hang_id: string;
  lo_id: string | null;
  so_goi_dem: number | null;
  so_kg_dem: number | null;
  xac_nhan_het: boolean;
  so_goi_so: number | null;
  so_kg_so: number | null;
}

export interface LoKiemKe {
  kiem_ke_dong_id: string;
  lo_id: string;
  so_goi_so: number;
  so_kg_so: number;
  so_goi_moi: number | null;
  so_kg_moi: number | null;
}

const soHoacNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export async function docDanhSachKiemKe(client: SupabaseClient, chiNhanhId: string, trangThai: string | null): Promise<KiemKeTom[]> {
  let q = client
    .from('kho_v_kiem_ke')
    .select('id, so_phieu, vi_tri_id, ten_vi_tri, loai_vi_tri, kieu, ngay_kiem, trang_thai, so_dong, so_dong_da_dem, nguoi_tao, created_at')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('created_at', { ascending: false })
    .limit(120);
  if (trangThai) q = q.eq('trang_thai', trangThai);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as KiemKeTom[];
}

export async function demKiemKeCho(client: SupabaseClient, chiNhanhId: string): Promise<number | null> {
  const { count, error } = await client
    .from('kho_kiem_ke').select('id', { count: 'exact', head: true })
    .eq('chi_nhanh_id', chiNhanhId).eq('trang_thai', 'cho_duyet');
  return error ? null : (count ?? 0);
}

export async function docKiemKe(
  client: SupabaseClient, id: string,
): Promise<{ kk: KiemKe; dong: DongKiemKe[]; lo: LoKiemKe[] } | null> {
  if (!laUuid(id)) return null;
  const { data: kk, error } = await client
    .from('kho_v_kiem_ke')
    .select('id, chi_nhanh_id, so_phieu, phien_ban, vi_tri_id, ten_vi_tri, loai_vi_tri, kieu, nguon_so_ban, ngay_kiem, trang_thai, ghi_chu, ly_do, nguoi_tao, nguoi_gui, gui_luc, nguoi_duyet, duyet_luc, created_at, so_dong, so_dong_da_dem')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!kk) return null;

  const { data: dong, error: e1 } = await client
    .from('kho_kiem_ke_dong')
    .select('id, thu_tu, mat_hang_id, lo_id, so_goi_dem, so_kg_dem, xac_nhan_het, so_goi_so, so_kg_so')
    .eq('kiem_ke_id', id).order('thu_tu');
  if (e1) throw e1;
  const ids = (dong ?? []).map(d => d.id);
  let lo: LoKiemKe[] = [];
  if (ids.length && kk.trang_thai !== 'dang_dem') {
    const { data, error: e2 } = await client
      .from('kho_kiem_ke_lo')
      .select('kiem_ke_dong_id, lo_id, so_goi_so, so_kg_so, so_goi_moi, so_kg_moi')
      .in('kiem_ke_dong_id', ids);
    if (e2) throw e2;
    lo = (data ?? []).map(l => ({
      ...l, so_kg_so: Number(l.so_kg_so), so_kg_moi: soHoacNull(l.so_kg_moi),
    })) as LoKiemKe[];
  }
  return {
    kk: kk as KiemKe,
    dong: (dong ?? []).map(d => ({
      ...d, so_kg_dem: soHoacNull(d.so_kg_dem), so_kg_so: soHoacNull(d.so_kg_so),
    })) as DongKiemKe[],
    lo,
  };
}

// -----------------------------------------------------------------------------
// FORM → DỮ LIỆU (hàm thuần)
// -----------------------------------------------------------------------------
export interface DongDemForm {
  mat_hang_id: string;
  lo_id: string;
  goi: string;
  kg: string;
  het: boolean;
}

export function dongDemTuDb(ds: DongKiemKe[]): DongDemForm[] {
  return ds.map(d => ({
    mat_hang_id: d.mat_hang_id,
    lo_id: d.lo_id ?? '',
    goi: d.so_goi_dem === null ? '' : String(d.so_goi_dem),
    kg: d.so_kg_dem === null ? '' : String(d.so_kg_dem).replace('.', ','),
    het: d.xac_nhan_het,
  }));
}

export function docFormKiemKe(
  form: FormData,
  matHang: { id: string; ten: string; dem_goi: boolean }[],
): { dong: DongDemForm[]; loi: string[]; payload: Record<string, unknown>[] } {
  const dong: DongDemForm[] = [];
  const soDong = docSoNguyen(form.get('so_dong'), 0, 2000) ?? 0;
  for (let i = 0; i < (Number.isNaN(soDong) ? 0 : soDong); i++) {
    const g = (ten: string) => String(form.get(`k${i}_${ten}`) ?? '').trim();
    dong.push({ mat_hang_id: g('mh'), lo_id: g('lo'), goi: g('goi'), kg: g('kg'), het: form.get(`k${i}_het`) === 'co' });
  }
  const them = String(form.get('them_mat_hang') ?? '').trim();
  if (laUuid(them)) {
    const co = dong.find(d => d.mat_hang_id === them && !d.lo_id);
    const moi = { mat_hang_id: them, lo_id: '', goi: String(form.get('them_goi') ?? '').trim(), kg: String(form.get('them_kg') ?? '').trim(), het: false };
    if (co) { co.goi = moi.goi || co.goi; co.kg = moi.kg || co.kg; } else dong.push(moi);
  }
  return { dong, ...payloadTuDong(dong, matHang) };
}

/** Dòng đang hiện trên form → p_dong của kho_luu_kiem_ke, kèm lỗi gõ sai. */
export function payloadTuDong(
  dong: DongDemForm[],
  matHang: { id: string; ten: string; dem_goi: boolean }[],
): { loi: string[]; payload: Record<string, unknown>[] } {
  const loi: string[] = [];
  const mh = new Map(matHang.map(m => [m.id, m]));
  const payload: Record<string, unknown>[] = [];
  for (const d of dong) {
    const m = mh.get(d.mat_hang_id);
    const nhan = m ? `"${m.ten}"` : 'Một dòng';
    if (!m) { loi.push(`${nhan} không hợp lệ — tải lại trang`); continue; }
    const goi = docSoNguyen(d.goi, 0, 100000);
    const kg = docKg(d.kg);
    if (Number.isNaN(goi)) loi.push(`${nhan}: số ${m.dem_goi ? 'gói' : 'đếm'} là số nguyên`);
    if (Number.isNaN(kg)) loi.push(`${nhan}: số kg chưa đúng (ví dụ 1,25)`);
    const p: Record<string, unknown> = { mat_hang_id: d.mat_hang_id, xac_nhan_het: d.het };
    if (laUuid(d.lo_id)) p.lo_id = d.lo_id;
    if (goi !== null && !Number.isNaN(goi)) p.so_goi_dem = goi;
    if (kg !== null && !Number.isNaN(kg)) p.so_kg_dem = kg;
    payload.push(p);
  }
  return { loi, payload };
}

/**
 * Quét hết các gói ở vị trí → số gói và tổng kg theo mặt hàng, ĐÈ lên số
 * đang ghi của mặt hàng đó (quét là đếm lại từ đầu, không cộng dồn).
 */
export function apDungQuet(
  dong: DongDemForm[],
  noiDung: string,
  matHang: { id: string; ten: string; ma_can: string | null; dang_dung: boolean }[],
  mau?: string | null,
  soLeKg = 3,
): { dong: DongDemForm[]; loi: string[]; soMa: number; soHang: number } {
  const ds = tachDanhSachMa(noiDung);
  const gom = gomTheoMaCan(ds, mau || undefined, soLeKg);
  const theoCan = new Map(matHang.filter(m => m.dang_dung && m.ma_can).map(m => [m.ma_can!, m]));
  const loi = gom.loi.map(x => `${x.ma}: ${x.loi}`);
  const ra = dong.map(d => ({ ...d }));
  let soHang = 0;
  for (const [maCan, g] of gom.theoMa) {
    const m = theoCan.get(maCan);
    if (!m) { loi.push(`Mã cân ${maCan} (${g.soGoi} nhãn) chưa gắn với mặt hàng nào`); continue; }
    soHang += 1;
    const kg = g.soKg > 0 ? String(g.soKg).replace('.', ',') : '';
    const co = ra.find(d => d.mat_hang_id === m.id && !d.lo_id);
    if (co) { co.goi = String(g.soGoi); co.kg = kg; }
    else ra.push({ mat_hang_id: m.id, lo_id: '', goi: String(g.soGoi), kg, het: false });
  }
  return { dong: ra, loi, soMa: ds.length, soHang };
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
export async function batDauKiemKe(
  client: SupabaseClient, chiNhanhId: string, viTriId: string, kieu: string, maGui: string,
): Promise<KetQua & { id?: string }> {
  if (!laUuid(viTriId)) return { ok: false, cau: 'Chọn vị trí cần kiểm kê.' };
  if (!laUuid(maGui)) return { ok: false, cau: 'Form đã cũ — tải lại trang.' };
  const { data, error } = await client.rpc('kho_bat_dau_kiem_ke', {
    p_chi_nhanh_id: chiNhanhId, p_vi_tri_id: viTriId, p_kieu: kieu, p_ma_gui: maGui,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, id: String(data), cau: 'Đã mở phiếu kiểm kê. Đếm từng mặt hàng rồi bấm "Gửi duyệt".' };
}

export async function luuKiemKe(
  client: SupabaseClient, id: string, phienBan: number, ghiChu: string | null, payload: Record<string, unknown>[],
): Promise<KetQua & { phienBan?: number }> {
  const { data, error } = await client.rpc('kho_luu_kiem_ke', {
    p_id: id, p_phien_ban: phienBan, p_ghi_chu: ghiChu, p_dong: payload,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, phienBan: Number(data), cau: 'Đã lưu số đếm.' };
}

async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: String(data ?? 'Xong.') };
}

export function guiKiemKe(client: SupabaseClient, id: string, phienBan: number) {
  return cauTraVe(client.rpc('kho_gui_kiem_ke', { p_id: id, p_phien_ban: phienBan }));
}
export function duyetKiemKe(client: SupabaseClient, id: string) {
  return cauTraVe(client.rpc('kho_duyet_kiem_ke', { p_id: id }));
}
export function tuChoiKiemKe(client: SupabaseClient, id: string, lyDo: string) {
  return cauTraVe(client.rpc('kho_tu_choi_kiem_ke', { p_id: id, p_ly_do: lyDo }));
}
export function huyKiemKe(client: SupabaseClient, id: string, lyDo: string | null) {
  return cauTraVe(client.rpc('kho_huy_kiem_ke', { p_id: id, p_ly_do: lyDo }));
}
