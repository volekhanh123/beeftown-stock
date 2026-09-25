/**
 * KHO — PHA LÓC
 *
 * Một phiên: một loại tảng vào (một hoặc vài lô), các phần cắt ra. Tỉ lệ thu
 * hồi và giá vốn thật mỗi kg do database tính (kho_tinh_phien_pha, 0022) —
 * file này chỉ đọc form, gọi hàm, và đọc kết quả để hiện.
 *
 * FORM (không JavaScript):
 *   Đầu vào — mỗi lô đang có của loại tảng đã chọn là một dòng:
 *     v{i}_lo, v{i}_vi_tri (ẩn) · v{i}_dung = "co" nếu đem pha
 *     v{i}_so_kg: bỏ trống = lấy hết lô · v{i}_so_goi
 *   Đầu ra — r{i}_mat_hang, r{i}_so_kg, r{i}_so_goi, r{i}_xu_ly, r{i}_vi_tri,
 *     r{i}_hsd, r{i}_xoa. Dòng chưa chọn mặt hàng và chưa có kg là dòng trống.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, docKg, docNgay, docSoNguyen, laUuid, type KetQua } from './chung.ts';
import { apDungTim, type TimDs } from './tim-ds.ts';

export interface PhienPhaTom {
  id: string;
  so_phieu: string;
  trang_thai: 'nhap' | 'da_chot' | 'da_huy';
  mat_hang_vao_id: string;
  ten_mat_hang_vao: string;
  ngay_pha: string;
  tong_kg_vao: number | null;
  tong_kg_thit: number | null;
  ty_le_thu_hoi: number | null;
  so_dau_vao: number;
  so_dau_ra: number;
  kg_vao_nhap: number;
  kg_ra_nhap: number;
  nguoi_tao: string | null;
  created_at: string;
}

export interface PhienPha {
  id: string;
  chi_nhanh_id: string;
  so_phieu: string;
  phien_ban: number;
  mat_hang_vao_id: string;
  cong_thuc_id: string | null;
  ngay_pha: string;
  ghi_chu: string | null;
  trang_thai: 'nhap' | 'da_chot' | 'da_huy';
  ly_do: string | null;
  tong_kg_vao: number | null;
  tong_kg_thit: number | null;
  tong_kg_phu_pham: number | null;
  tong_kg_bo: number | null;
  tong_kg_hao_hut: number | null;
  ty_le_thu_hoi: number | null;
  nguoi_tao: string | null;
  nguoi_chot: string | null;
  chot_luc: string | null;
  nguoi_huy: string | null;
  huy_luc: string | null;
  created_at: string;
}

export interface DauVao {
  id: string;
  thu_tu: number;
  lo_id: string;
  vi_tri_id: string;
  so_kg: number;
  so_goi: number;
}

export interface DauRa {
  id: string;
  thu_tu: number;
  mat_hang_id: string;
  so_kg: number;
  so_goi: number;
  xu_ly: 'nhap_kho' | 'chuyen_bep' | 'bo';
  vi_tri_id: string | null;
  han_dung: string | null;
  gia_ban_kg: number | null;
  lo_id: string | null;
}

/** Kết quả xem thử — cùng dạng jsonb kho_tinh_phien_pha() trả về. */
export interface KetQuaTinh {
  tong_kg_vao: number;
  tong_kg_thit: number;
  tong_kg_phu_pham: number;
  tong_kg_bo: number;
  tong_kg_hao_hut: number;
  ty_le_thu_hoi: number | null;
  ty_le_phu_pham: number | null;
  ty_le_bo: number | null;
  ty_le_hao_hut: number | null;
  gia_tri_vao: number;
  gia_von_vao_kg: number | null;
  gia_tri_phu_pham: number;
  han_som_nhat_vao: string | null;
  chia_theo: 'gia_tri' | 'khoi_luong';
  canh_bao: string[];
  dong: { ra_id: string; nhom: 'thit' | 'phu_pham' | 'bo'; so_kg: number; gia_tri: number; gia_von_kg: number; ty_le: number | null }[];
}

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
const so = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export async function docDanhSachPhienPha(
  client: SupabaseClient, chiNhanhId: string, trangThai: string | null,
  // Có tim: tìm / lọc ngày / của tôi / đọc đúng một trang (lib/kho/tim-ds.ts).
  tim?: { tim: TimDs; nhanSuId: string | null },
): Promise<PhienPhaTom[]> {
  let q = client
    .from('kho_v_phien_pha')
    .select('id, so_phieu, trang_thai, mat_hang_vao_id, ten_mat_hang_vao, ngay_pha, tong_kg_vao, tong_kg_thit, ty_le_thu_hoi, so_dau_vao, so_dau_ra, kg_vao_nhap, kg_ra_nhap, nguoi_tao, created_at')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('ngay_pha', { ascending: false })
    .order('created_at', { ascending: false });
  if (trangThai) q = q.eq('trang_thai', trangThai);
  q = tim
    ? apDungTim(q, tim.tim, { cotTim: ['so_phieu', 'ten_mat_hang_vao'], cotNgay: 'ngay_pha', nhanSuId: tim.nhanSuId })
    : q.limit(200);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => ({
    ...r,
    tong_kg_vao: so(r.tong_kg_vao), tong_kg_thit: so(r.tong_kg_thit), ty_le_thu_hoi: so(r.ty_le_thu_hoi),
    kg_vao_nhap: Number(r.kg_vao_nhap), kg_ra_nhap: Number(r.kg_ra_nhap),
  })) as PhienPhaTom[];
}

export async function demPhienNhap(client: SupabaseClient, chiNhanhId: string): Promise<number | null> {
  const { count, error } = await client
    .from('kho_phien_pha').select('id', { count: 'exact', head: true })
    .eq('chi_nhanh_id', chiNhanhId).eq('trang_thai', 'nhap');
  return error ? null : (count ?? 0);
}

export async function docPhienPha(
  client: SupabaseClient, id: string,
): Promise<{ phien: PhienPha; vao: DauVao[]; ra: DauRa[] } | null> {
  if (!laUuid(id)) return null;
  const { data: phien, error } = await client
    .from('kho_phien_pha')
    .select('id, chi_nhanh_id, so_phieu, phien_ban, mat_hang_vao_id, cong_thuc_id, ngay_pha, ghi_chu, trang_thai, ly_do, tong_kg_vao, tong_kg_thit, tong_kg_phu_pham, tong_kg_bo, tong_kg_hao_hut, ty_le_thu_hoi, nguoi_tao, nguoi_chot, chot_luc, nguoi_huy, huy_luc, created_at')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!phien) return null;

  const [{ data: vao, error: e1 }, { data: ra, error: e2 }] = await Promise.all([
    client.from('kho_phien_pha_vao').select('id, thu_tu, lo_id, vi_tri_id, so_kg, so_goi')
      .eq('phien_pha_id', id).order('thu_tu'),
    client.from('kho_phien_pha_ra').select('id, thu_tu, mat_hang_id, so_kg, so_goi, xu_ly, vi_tri_id, han_dung, gia_ban_kg, lo_id')
      .eq('phien_pha_id', id).order('thu_tu'),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;

  return {
    phien: {
      ...phien,
      tong_kg_vao: so(phien.tong_kg_vao), tong_kg_thit: so(phien.tong_kg_thit),
      tong_kg_phu_pham: so(phien.tong_kg_phu_pham), tong_kg_bo: so(phien.tong_kg_bo),
      tong_kg_hao_hut: so(phien.tong_kg_hao_hut), ty_le_thu_hoi: so(phien.ty_le_thu_hoi),
    } as PhienPha,
    vao: (vao ?? []).map(v => ({ ...v, so_kg: Number(v.so_kg) })) as DauVao[],
    ra: (ra ?? []).map(r => ({ ...r, so_kg: Number(r.so_kg), gia_ban_kg: so(r.gia_ban_kg) })) as DauRa[],
  };
}

/** Thông tin lô (mã, hạn) cho các lô đang hiện trên trang. */
export async function docThongTinLo(
  client: SupabaseClient, ids: string[],
): Promise<Map<string, { ma_lo: string; han_dung: string }>> {
  const ra = new Map<string, { ma_lo: string; han_dung: string }>();
  const ds = [...new Set(ids.filter(laUuid))];
  if (ds.length === 0) return ra;
  const { data } = await client.from('kho_lo').select('id, ma_lo, han_dung').in('id', ds);
  for (const l of data ?? []) ra.set(l.id, { ma_lo: l.ma_lo, han_dung: l.han_dung });
  return ra;
}

/** Giá vốn/kg của các lô. Vai không xem giá: Map rỗng (RLS). */
export async function docGiaVonLo(client: SupabaseClient, ids: string[]): Promise<Map<string, { gia_von_kg: number; gia_tri: number }>> {
  const ra = new Map<string, { gia_von_kg: number; gia_tri: number }>();
  const ds = [...new Set(ids.filter(laUuid))];
  if (ds.length === 0) return ra;
  const { data } = await client.from('kho_lo_gia').select('lo_id, gia_von_kg, gia_tri').in('lo_id', ds);
  for (const g of data ?? []) ra.set(g.lo_id, { gia_von_kg: Number(g.gia_von_kg), gia_tri: Number(g.gia_tri) });
  return ra;
}

export async function xemThuPhien(client: SupabaseClient, id: string): Promise<{ kq: KetQuaTinh | null; loi: string | null }> {
  const { data, error } = await client.rpc('kho_xem_thu_phien_pha', { p_id: id });
  if (error) return { kq: null, loi: cauLoiKho(error) };
  const t = data as KetQuaTinh | null;
  if (!t) return { kq: null, loi: null };
  return {
    loi: null,
    kq: {
      ...t,
      tong_kg_vao: Number(t.tong_kg_vao), tong_kg_thit: Number(t.tong_kg_thit),
      tong_kg_phu_pham: Number(t.tong_kg_phu_pham), tong_kg_bo: Number(t.tong_kg_bo),
      tong_kg_hao_hut: Number(t.tong_kg_hao_hut),
      ty_le_thu_hoi: so(t.ty_le_thu_hoi), ty_le_phu_pham: so(t.ty_le_phu_pham),
      ty_le_bo: so(t.ty_le_bo), ty_le_hao_hut: so(t.ty_le_hao_hut),
      gia_tri_vao: Number(t.gia_tri_vao), gia_von_vao_kg: so(t.gia_von_vao_kg),
      gia_tri_phu_pham: Number(t.gia_tri_phu_pham),
      canh_bao: t.canh_bao ?? [],
      dong: (t.dong ?? []).map(d => ({
        ...d, so_kg: Number(d.so_kg), gia_tri: Number(d.gia_tri), gia_von_kg: Number(d.gia_von_kg), ty_le: so(d.ty_le),
      })),
    },
  };
}

// -----------------------------------------------------------------------------
// FORM → DỮ LIỆU (hàm thuần, test được)
// -----------------------------------------------------------------------------
export interface VaoForm { lo_id: string; vi_tri_id: string; dung: boolean; so_kg: string; so_goi: string }
export interface RaForm { mat_hang_id: string; so_kg: string; so_goi: string; xu_ly: string; vi_tri_id: string; han_dung: string }
export interface DauPhienForm { ngay_pha: string; ghi_chu: string; cong_thuc_id: string }

export interface KetQuaDocPhien {
  dau: DauPhienForm;
  vao: VaoForm[];
  ra: RaForm[];
  loi: string[];
  payloadVao: Record<string, unknown>[];
  payloadRa: Record<string, unknown>[];
}

export function raTrong(viTriMacDinh = ''): RaForm {
  return { mat_hang_id: '', so_kg: '', so_goi: '', xu_ly: '', vi_tri_id: viTriMacDinh, han_dung: '' };
}

export function docFormPhienPha(form: FormData): KetQuaDocPhien {
  const s = (ten: string) => String(form.get(ten) ?? '').trim();
  const loi: string[] = [];
  const dau: DauPhienForm = { ngay_pha: s('ngay_pha'), ghi_chu: s('ghi_chu'), cong_thuc_id: s('cong_thuc_id') };
  if (dau.ngay_pha && docNgay(dau.ngay_pha) === undefined) loi.push('Ngày pha không phải ngày có thật');

  const vao: VaoForm[] = [];
  const payloadVao: Record<string, unknown>[] = [];
  const soVao = docSoNguyen(form.get('so_vao'), 0, 200) ?? 0;
  for (let i = 0; i < (Number.isNaN(soVao) ? 0 : soVao); i++) {
    const g = (ten: string) => String(form.get(`v${i}_${ten}`) ?? '').trim();
    const v: VaoForm = {
      lo_id: g('lo'), vi_tri_id: g('vi_tri'), dung: form.get(`v${i}_dung`) === 'co',
      so_kg: g('so_kg'), so_goi: g('so_goi'),
    };
    vao.push(v);
    // Gõ số kg / số tảng mà quên tích "dùng" → coi như có dùng.
    if (!v.dung && !v.so_kg && !v.so_goi) continue;
    v.dung = true;
    if (!laUuid(v.lo_id) || !laUuid(v.vi_tri_id)) { loi.push(`Lô đầu vào thứ ${i + 1} không hợp lệ — tải lại trang`); continue; }
    const kg = docKg(v.so_kg);
    const goi = docSoNguyen(v.so_goi, 0, 100000);
    if (Number.isNaN(kg) || (kg !== null && kg <= 0)) loi.push(`Lô đầu vào thứ ${i + 1}: số kg chưa đúng (ví dụ 9,3) — bỏ trống nếu lấy hết lô`);
    if (Number.isNaN(goi)) loi.push(`Lô đầu vào thứ ${i + 1}: số tảng là số nguyên`);
    const p: Record<string, unknown> = { lo_id: v.lo_id, vi_tri_id: v.vi_tri_id };
    if (kg !== null && !Number.isNaN(kg)) p.so_kg = kg;
    if (goi !== null && !Number.isNaN(goi)) p.so_goi = goi;
    payloadVao.push(p);
  }

  const ra: RaForm[] = [];
  const payloadRa: Record<string, unknown>[] = [];
  const soRa = docSoNguyen(form.get('so_ra'), 0, 200) ?? 0;
  for (let i = 0; i < (Number.isNaN(soRa) ? 0 : soRa); i++) {
    const g = (ten: string) => String(form.get(`r${i}_${ten}`) ?? '').trim();
    const r: RaForm = {
      mat_hang_id: g('mat_hang'), so_kg: g('so_kg'), so_goi: g('so_goi'),
      xu_ly: g('xu_ly'), vi_tri_id: g('vi_tri'), han_dung: g('hsd'),
    };
    if (form.get(`r${i}_xoa`) === 'co') continue;
    if (!r.mat_hang_id && !r.so_kg && !r.so_goi) continue;
    ra.push(r);
    const thu = ra.length;
    if (!laUuid(r.mat_hang_id)) { loi.push(`Phần ra ${thu}: chưa chọn mặt hàng`); continue; }
    const kg = docKg(r.so_kg);
    const goi = docSoNguyen(r.so_goi, 0, 100000);
    const hsd = docNgay(r.han_dung);
    if (kg === null || Number.isNaN(kg) || kg <= 0) loi.push(`Phần ra ${thu}: số kg chưa đúng (ví dụ 7,25)`);
    if (Number.isNaN(goi)) loi.push(`Phần ra ${thu}: số gói là số nguyên`);
    if (hsd === undefined) loi.push(`Phần ra ${thu}: hạn dùng không phải ngày có thật`);
    const p: Record<string, unknown> = { mat_hang_id: r.mat_hang_id, so_kg: kg };
    if (goi !== null && !Number.isNaN(goi)) p.so_goi = goi;
    if (['nhap_kho', 'chuyen_bep', 'bo'].includes(r.xu_ly)) p.xu_ly = r.xu_ly;
    if (laUuid(r.vi_tri_id)) p.vi_tri_id = r.vi_tri_id;
    if (hsd) p.han_dung = hsd;
    payloadRa.push(p);
  }

  return { dau, vao, ra, loi, payloadVao, payloadRa };
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
export interface KetQuaLuuPhien extends KetQua {
  id?: string;
  phienBan?: number;
  doc?: KetQuaDocPhien;
}

export async function luuPhienPha(
  client: SupabaseClient, chiNhanhId: string, form: FormData,
  ctx: { id: string | null; phienBan: number | null; matHangVaoId: string },
): Promise<KetQuaLuuPhien> {
  const doc = docFormPhienPha(form);
  if (doc.loi.length) return { ok: false, cau: doc.loi.join(' · '), doc };
  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) return { ok: false, cau: 'Form đã cũ — tải lại trang rồi nhập lại.', doc };

  const { data, error } = await client.rpc('kho_luu_phien_pha', {
    p_id: ctx.id,
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_phien_ban: ctx.phienBan,
    p_mat_hang_vao_id: ctx.matHangVaoId,
    p_cong_thuc_id: laUuid(doc.dau.cong_thuc_id) ? doc.dau.cong_thuc_id : null,
    p_ngay_pha: doc.dau.ngay_pha || null,
    p_ghi_chu: doc.dau.ghi_chu || null,
    p_vao: doc.payloadVao,
    p_ra: doc.payloadRa,
  });
  if (error) return { ok: false, cau: cauLoiKho(error), doc };
  const kq = (Array.isArray(data) ? data[0] : data) as { phien_id: string; phien_ban_moi: number; da_co: boolean } | undefined;
  if (!kq) return { ok: false, cau: 'Không chắc đã lưu hay chưa — tải lại trang để kiểm tra.', doc };
  return {
    ok: true, id: kq.phien_id, phienBan: kq.phien_ban_moi,
    cau: kq.da_co ? 'Phiên này đã được lưu từ lần bấm trước.' : 'Đã lưu nháp. Xem thu hồi và giá vốn ở cuối trang trước khi chốt.',
  };
}

async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: String(data ?? 'Xong.') };
}

export function chotPhien(client: SupabaseClient, id: string, phienBan: number | null) {
  return cauTraVe(client.rpc('kho_chot_phien_pha', { p_id: id, p_phien_ban: phienBan }));
}
export function moLaiPhien(client: SupabaseClient, id: string, lyDo: string) {
  return cauTraVe(client.rpc('kho_mo_lai_phien_pha', { p_id: id, p_ly_do: lyDo }));
}
export function huyPhien(client: SupabaseClient, id: string, lyDo: string | null) {
  return cauTraVe(client.rpc('kho_huy_phien_pha', { p_id: id, p_ly_do: lyDo }));
}

// -----------------------------------------------------------------------------
// THỐNG KÊ NHANH
// -----------------------------------------------------------------------------
/**
 * Thu hồi bình quân theo loại tảng (có trọng số theo kg — không lấy trung
 * bình cộng các %), chỉ tính phiên đã chốt.
 */
export function thuHoiTheoTang(ds: PhienPhaTom[]): { ten: string; so_phien: number; kg_vao: number; kg_thit: number; ty_le: number }[] {
  const g = new Map<string, { ten: string; so_phien: number; vao: number; thit: number }>();
  for (const p of ds) {
    if (p.trang_thai !== 'da_chot' || !p.tong_kg_vao) continue;
    const x = g.get(p.mat_hang_vao_id) ?? { ten: p.ten_mat_hang_vao, so_phien: 0, vao: 0, thit: 0 };
    x.so_phien += 1;
    x.vao += Math.round(p.tong_kg_vao * 1000);
    x.thit += Math.round((p.tong_kg_thit ?? 0) * 1000);
    g.set(p.mat_hang_vao_id, x);
  }
  return [...g.values()]
    .map(x => ({ ten: x.ten, so_phien: x.so_phien, kg_vao: x.vao / 1000, kg_thit: x.thit / 1000, ty_le: x.vao ? (x.thit * 100) / x.vao : 0 }))
    .sort((a, b) => b.kg_vao - a.kg_vao);
}
