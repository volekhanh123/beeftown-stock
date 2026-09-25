/**
 * KHO — CHUYỂN QUẦY, XUẤT BẾP, BÁO HỦY
 *
 * Một phiếu ghi sổ ngay (chuyển, xuất bếp) hoặc chờ quản lý duyệt (hủy). Lô
 * nào bị lấy do database chọn theo FEFO (kho_phan_bo, 0023) — trừ khi người
 * dùng chọn đích danh một lô.
 *
 * FORM (không JavaScript) — hai kiểu dòng, gửi chung:
 *   Theo mặt hàng: d{i}_mat_hang, d{i}_so_goi, d{i}_so_kg   (FEFO)
 *   Theo lô:       l{i}_lo, l{i}_mat_hang (ẩn), l{i}_so_goi, l{i}_so_kg
 *   Quét nhãn: ô "ma_quet" — mỗi mã một dòng; gom thành dòng theo mặt hàng.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, docKg, docSoNguyen, laUuid, type KetQua } from './chung.ts';
import { gomTheoMaCan, tachDanhSachMa } from './ma-vach.ts';
import { layTepAnh, taiAnh } from './anh.ts';

export type LoaiXuat = 'chuyen' | 'xuat_bep' | 'huy';

export const TEN_LOAI_XUAT: Record<LoaiXuat, string> = {
  chuyen: 'Chuyển hàng',
  xuat_bep: 'Xuất bếp',
  huy: 'Báo hủy',
};

export interface PhieuXuatTom {
  id: string;
  so_phieu: string;
  loai: LoaiXuat;
  trang_thai: 'da_ghi' | 'cho_duyet' | 'da_duyet' | 'tu_choi';
  ngay: string;
  ten_vi_tri: string;
  ten_vi_tri_den: string | null;
  ten_ly_do: string | null;
  so_dong: number;
  tong_goi: number;
  tong_kg: number;
  nguoi_tao: string | null;
  created_at: string;
}

export interface PhieuXuat extends PhieuXuatTom {
  chi_nhanh_id: string;
  vi_tri_id: string;
  loai_vi_tri: string;
  vi_tri_den_id: string | null;
  ly_do_id: string | null;
  ghi_chu: string | null;
  anh: string[];
  ly_do_tu_choi: string | null;
  nguoi_duyet: string | null;
  duyet_luc: string | null;
}

export interface DongXuat {
  thu_tu: number;
  mat_hang_id: string;
  lo_id: string | null;
  so_goi: number;
  so_kg: number;
  so_kg_do: number | null;
}

export interface DongSoCai {
  loai: string;
  lo_id: string;
  vi_tri_id: string;
  so_kg: number;
  so_goi: number;
  created_at: string;
}

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export async function docDanhSachPhieuXuat(
  client: SupabaseClient, chiNhanhId: string, loc: { loai?: string | null; trangThai?: string | null },
): Promise<PhieuXuatTom[]> {
  let q = client
    .from('kho_v_phieu_xuat')
    .select('id, so_phieu, loai, trang_thai, ngay, ten_vi_tri, ten_vi_tri_den, ten_ly_do, so_dong, tong_goi, tong_kg, nguoi_tao, created_at')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('created_at', { ascending: false })
    .limit(150);
  if (loc.loai) q = q.eq('loai', loc.loai);
  if (loc.trangThai) q = q.eq('trang_thai', loc.trangThai);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => ({ ...r, tong_kg: Number(r.tong_kg) })) as PhieuXuatTom[];
}

export async function demPhieuHuyCho(client: SupabaseClient, chiNhanhId: string): Promise<number | null> {
  const { count, error } = await client
    .from('kho_phieu_xuat').select('id', { count: 'exact', head: true })
    .eq('chi_nhanh_id', chiNhanhId).eq('trang_thai', 'cho_duyet');
  return error ? null : (count ?? 0);
}

export async function docPhieuXuat(
  client: SupabaseClient, id: string,
): Promise<{ phieu: PhieuXuat; dong: DongXuat[]; soCai: DongSoCai[] } | null> {
  if (!laUuid(id)) return null;
  const { data: phieu, error } = await client
    .from('kho_v_phieu_xuat')
    .select('id, chi_nhanh_id, so_phieu, loai, trang_thai, ngay, vi_tri_id, ten_vi_tri, loai_vi_tri, vi_tri_den_id, ten_vi_tri_den, ly_do_id, ten_ly_do, ghi_chu, anh, ly_do_tu_choi, nguoi_tao, nguoi_duyet, duyet_luc, created_at, so_dong, tong_goi, tong_kg')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!phieu) return null;

  const [{ data: dong, error: e1 }, { data: soCai, error: e2 }] = await Promise.all([
    client.from('kho_phieu_xuat_dong').select('thu_tu, mat_hang_id, lo_id, so_goi, so_kg, so_kg_do')
      .eq('phieu_xuat_id', id).order('thu_tu'),
    client.from('kho_so_cai').select('loai, lo_id, vi_tri_id, so_kg, so_goi, created_at')
      .eq('chung_tu_id', id).order('created_at'),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return {
    phieu: { ...phieu, tong_kg: Number(phieu.tong_kg), anh: phieu.anh ?? [] } as PhieuXuat,
    dong: (dong ?? []).map(d => ({ ...d, so_kg: Number(d.so_kg), so_kg_do: d.so_kg_do === null ? null : Number(d.so_kg_do) })) as DongXuat[],
    soCai: (soCai ?? []).map(s => ({ ...s, so_kg: Number(s.so_kg) })) as DongSoCai[],
  };
}

// -----------------------------------------------------------------------------
// FORM → DỮ LIỆU (hàm thuần)
// -----------------------------------------------------------------------------
export interface DongXuatForm { mat_hang_id: string; so_goi: string; so_kg: string }
export interface DongLoForm { lo_id: string; mat_hang_id: string; so_goi: string; so_kg: string }

export interface KetQuaDocXuat {
  dong: DongXuatForm[];
  theoLo: DongLoForm[];
  loi: string[];
  payload: Record<string, unknown>[];
}

export function docFormPhieuXuat(form: FormData, matHang: { id: string; ten: string; dem_goi: boolean }[]): KetQuaDocXuat {
  const loi: string[] = [];
  const payload: Record<string, unknown>[] = [];
  const mh = new Map(matHang.map(m => [m.id, m]));

  const dong: DongXuatForm[] = [];
  const soDong = docSoNguyen(form.get('so_dong'), 0, 200) ?? 0;
  for (let i = 0; i < (Number.isNaN(soDong) ? 0 : soDong); i++) {
    const g = (ten: string) => String(form.get(`d${i}_${ten}`) ?? '').trim();
    const d: DongXuatForm = { mat_hang_id: g('mat_hang'), so_goi: g('so_goi'), so_kg: g('so_kg') };
    if (!d.mat_hang_id && !d.so_goi && !d.so_kg) continue;
    dong.push(d);
    const thu = dong.length;
    const m = mh.get(d.mat_hang_id);
    if (!laUuid(d.mat_hang_id) || !m) { loi.push(`Dòng ${thu}: chưa chọn mặt hàng`); continue; }
    const p = docDong(m, d.so_goi, d.so_kg, `Dòng ${thu} (${m.ten})`, loi);
    if (p) payload.push({ mat_hang_id: d.mat_hang_id, ...p });
  }

  const theoLo: DongLoForm[] = [];
  const soLo = docSoNguyen(form.get('so_lo'), 0, 500) ?? 0;
  for (let i = 0; i < (Number.isNaN(soLo) ? 0 : soLo); i++) {
    const g = (ten: string) => String(form.get(`l${i}_${ten}`) ?? '').trim();
    const l: DongLoForm = { lo_id: g('lo'), mat_hang_id: g('mat_hang'), so_goi: g('so_goi'), so_kg: g('so_kg') };
    theoLo.push(l);
    if (!l.so_goi && !l.so_kg) continue;
    const m = mh.get(l.mat_hang_id);
    if (!laUuid(l.lo_id) || !m) { loi.push('Một dòng lô không hợp lệ — tải lại trang'); continue; }
    const p = docDong(m, l.so_goi, l.so_kg, `Lô của "${m.ten}"`, loi);
    if (p) payload.push({ mat_hang_id: l.mat_hang_id, lo_id: l.lo_id, ...p });
  }

  return { dong, theoLo, loi, payload };
}

function docDong(
  m: { dem_goi: boolean }, goiChu: string, kgChu: string, nhan: string, loi: string[],
): Record<string, unknown> | null {
  const goi = docSoNguyen(goiChu, 0, 100000);
  const kg = docKg(kgChu);
  if (Number.isNaN(goi)) { loi.push(`${nhan}: số gói là số nguyên`); return null; }
  if (Number.isNaN(kg) || (kg !== null && kg <= 0)) { loi.push(`${nhan}: số kg chưa đúng (ví dụ 1,25)`); return null; }
  if (m.dem_goi) {
    if (!goi) { loi.push(`${nhan}: chưa nhập số gói`); return null; }
    return kg !== null ? { so_goi: goi, so_kg: kg } : { so_goi: goi };
  }
  if (kg === null) { loi.push(`${nhan}: chưa nhập số kg`); return null; }
  return { so_kg: kg };
}

/**
 * Đọc ô dán mã vạch → dòng theo mặt hàng (số gói, tổng kg). Mã cân không
 * khớp mặt hàng nào, mã hỏng → báo lỗi, không đoán.
 */
export function dongTuQuet(
  noiDung: string,
  matHang: { id: string; ten: string; ma_can: string | null; dang_dung: boolean }[],
  mau?: string | null,
  soLeKg = 3,
): { dong: DongXuatForm[]; loi: string[]; soMa: number } {
  const ds = tachDanhSachMa(noiDung);
  const gom = gomTheoMaCan(ds, mau || undefined, soLeKg);
  const theoCan = new Map(matHang.filter(m => m.dang_dung && m.ma_can).map(m => [m.ma_can!, m]));
  const loi = gom.loi.map(x => `${x.ma}: ${x.loi}`);
  const dong: DongXuatForm[] = [];
  for (const [maCan, g] of gom.theoMa) {
    const m = theoCan.get(maCan);
    if (!m) { loi.push(`Mã cân ${maCan} (${g.soGoi} nhãn) chưa gắn với mặt hàng nào — thêm "Mã cân" trong Cài đặt mặt hàng`); continue; }
    dong.push({
      mat_hang_id: m.id,
      so_goi: String(g.soGoi),
      so_kg: g.soKg > 0 ? String(g.soKg).replace('.', ',') : '',
    });
  }
  return { dong, loi, soMa: ds.length };
}

/** Gộp dòng quét vào các dòng đang có: cùng mặt hàng thì cộng dồn. */
export function gopDong(cu: DongXuatForm[], moi: DongXuatForm[]): DongXuatForm[] {
  const ra = cu.filter(d => d.mat_hang_id || d.so_goi || d.so_kg).map(d => ({ ...d }));
  for (const d of moi) {
    const co = ra.find(x => x.mat_hang_id === d.mat_hang_id);
    if (!co) { ra.push({ ...d }); continue; }
    const goi = (docSoNguyen(co.so_goi, 0, 100000) || 0) + (docSoNguyen(d.so_goi, 0, 100000) || 0);
    const kgCu = docKg(co.so_kg), kgMoi = docKg(d.so_kg);
    co.so_goi = goi ? String(goi) : '';
    if (kgMoi !== null && !Number.isNaN(kgMoi)) {
      const tong = Math.round(((kgCu !== null && !Number.isNaN(kgCu) ? kgCu : 0) + kgMoi) * 1000) / 1000;
      co.so_kg = String(tong).replace('.', ',');
    }
  }
  return ra;
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
export interface KetQuaXuat extends KetQua {
  id?: string;
  doc?: KetQuaDocXuat;
}

export async function taoPhieuXuat(
  client: SupabaseClient, chiNhanhId: string, form: FormData,
  ctx: { loai: LoaiXuat; viTriId: string; matHang: { id: string; ten: string; dem_goi: boolean }[] },
): Promise<KetQuaXuat> {
  const doc = docFormPhieuXuat(form, ctx.matHang);
  if (doc.loi.length) return { ok: false, cau: doc.loi.join(' · '), doc };
  if (doc.payload.length === 0) return { ok: false, cau: 'Chưa có dòng hàng nào — chọn mặt hàng hoặc ghi số gói ở lô cần lấy.', doc };
  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) return { ok: false, cau: 'Form đã cũ — tải lại trang rồi nhập lại.', doc };
  const den = String(form.get('vi_tri_den_id') ?? '');
  const lyDo = String(form.get('ly_do_id') ?? '');

  let anh: string[] = [];
  let cauAnh = '';
  if (ctx.loai === 'huy') {
    const tai = await taiAnh(client, chiNhanhId, 'huy', maGui, layTepAnh(form));
    anh = tai.duongDan;
    if (tai.loi.length) cauAnh = ` Lưu ý: ${tai.loi.join(' · ')}`;
  }

  const { data, error } = await client.rpc('kho_tao_phieu_xuat', {
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_loai: ctx.loai,
    p_vi_tri_id: ctx.viTriId,
    p_vi_tri_den_id: ctx.loai === 'chuyen' && laUuid(den) ? den : null,
    p_ly_do_id: laUuid(lyDo) ? lyDo : null,
    p_ghi_chu: String(form.get('ghi_chu') ?? '').trim() || null,
    p_anh: anh,
    p_dong: doc.payload,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) + cauAnh, doc };
  const kq = (Array.isArray(data) ? data[0] : data) as { phieu_id: string; so_phieu: string; da_co: boolean } | undefined;
  if (!kq) return { ok: false, cau: 'Không chắc đã ghi hay chưa — xem danh sách phiếu để kiểm tra.', doc };
  const cau = kq.da_co
    ? `Phiếu ${kq.so_phieu} đã được ghi từ lần bấm trước.`
    : ctx.loai === 'huy'
      ? `Đã báo hủy ${kq.so_phieu} — hàng đã chuyển sang "Hàng chờ hủy", chờ quản lý duyệt.`
      : `Đã ghi ${kq.so_phieu}.`;
  return { ok: true, id: kq.phieu_id, cau: cau + cauAnh };
}

async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: String(data ?? 'Xong.') };
}

export function duyetHuy(client: SupabaseClient, id: string) {
  return cauTraVe(client.rpc('kho_duyet_phieu_huy', { p_id: id }));
}
export function tuChoiHuy(client: SupabaseClient, id: string, lyDo: string) {
  return cauTraVe(client.rpc('kho_tu_choi_phieu_huy', { p_id: id, p_ly_do: lyDo }));
}
