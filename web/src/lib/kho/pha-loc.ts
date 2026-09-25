/**
 * KHO — PHA LÓC
 *
 * Một phiên: một loại tảng vào (một hoặc vài lô), các phần cắt ra. Tỉ lệ thu
 * hồi và giá vốn thật mỗi kg do database tính (kho_tinh_phien_pha, 0022) —
 * file này chỉ đọc form, gọi hàm, và đọc kết quả để hiện.
 *
 * THỦ KHO KHÔNG THẤY TIỀN (0031): thủ kho vẫn pha lóc nhưng xem thử bằng
 * kho_xem_thu_phien_pha_kg (chỉ kg và %). Bản có tiền kho_xem_thu_phien_pha
 * chỉ dành cho vai xem giá — trang chọn hàm theo k.duoc('xem_gia').
 *
 * PHA LÓC 3 BƯỚC (GĐ5c, migration 0033):
 *   1. /pha-loc/moi — nút lớn theo từng loại tảng đang có → tạo phiên nháp.
 *   2. /pha-loc/<id> "Cân & quét" — gói cắt ra nào cũng có nhãn cân: QUÉT
 *      NHÃN (kho_quet_phien_pha, mỗi lần gửi là một lượt, cùng ma_gui không
 *      cộng đôi — y như đếm quầy 0032). Mỗi món thành một dòng ra tu_quet:
 *      gói = số nhãn, kg = tổng kg, để ở kho lạnh hay quầy theo
 *      noi_de_sau_pha của món. Phụ phẩm, mỡ bỏ vẫn gõ kg (kho_luu_phien_pha
 *      chỉ thay dòng GÕ TAY, không đụng dòng quét).
 *   3. /pha-loc/<id>?buoc=ket-qua — thu hồi so với dự kiến và trung bình 30
 *      ngày; nút Chốt CHỈ ở đây. Chốt xong → ?buoc=xong "Chuyển N gói ra quầy".
 * Thu hồi thấp hơn dự kiến quá nguong_thu_hoi_diem thì database tự báo quản
 * lý (sự kiện thu_hoi_thap); quản lý bấm "Đã xem" (kho_xac_nhan_phien_pha).
 *
 * FORM LƯU (không JavaScript):
 *   Đầu vào — mỗi lô đang có của loại tảng đã chọn là một dòng:
 *     v{i}_lo, v{i}_vi_tri (ẩn) · v{i}_dung = "co" nếu đem pha
 *     v{i}_so_kg: bỏ trống = lấy hết lô · v{i}_so_goi
 *   Đầu ra GÕ TAY — r{i}_mat_hang, r{i}_so_kg, r{i}_so_goi, r{i}_xu_ly,
 *     r{i}_vi_tri, r{i}_hsd, r{i}_xoa. Dòng chưa chọn mặt hàng và chưa có kg
 *     là dòng trống. r{i}_vi_tri bỏ trống = để theo mặt hàng (kho lạnh / quầy).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, docKg, docNgay, docSoNguyen, homNayVn, laUuid, type KetQua } from './chung.ts';
import { apDungTim, type TimDs } from './tim-ds.ts';
import { maTuO, cauLoiNhan, TOI_DA_MOT_LUOT } from './dem-quay.ts';
import type { DongTon } from './ton.ts';
import type { CongThuc } from './danh-muc.ts';

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
  // 0033: báo thu hồi thấp
  ty_le_du_kien: number | null;
  thu_hoi_thap: boolean;
  da_xem_luc: string | null;
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
  // 0033: thu hồi dự kiến ghi lúc chốt, cờ thu hồi thấp, quản lý "Đã xem"
  ty_le_du_kien: number | null;
  nguon_du_kien: 'cong_thuc' | 'tb_30_ngay' | null;
  thu_hoi_thap: boolean;
  da_xem_boi: string | null;
  da_xem_luc: string | null;
  da_xem_ghi_chu: string | null;
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
  /** 0033: dòng dựng từ nhãn đã quét — không sửa bằng form gõ tay. */
  tu_quet: boolean;
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
    .select('id, so_phieu, trang_thai, mat_hang_vao_id, ten_mat_hang_vao, ngay_pha, tong_kg_vao, tong_kg_thit, ty_le_thu_hoi, so_dau_vao, so_dau_ra, kg_vao_nhap, kg_ra_nhap, nguoi_tao, created_at, ty_le_du_kien, thu_hoi_thap, da_xem_luc')
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
    ty_le_du_kien: so(r.ty_le_du_kien), thu_hoi_thap: !!r.thu_hoi_thap,
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
    .select('id, chi_nhanh_id, so_phieu, phien_ban, mat_hang_vao_id, cong_thuc_id, ngay_pha, ghi_chu, trang_thai, ly_do, tong_kg_vao, tong_kg_thit, tong_kg_phu_pham, tong_kg_bo, tong_kg_hao_hut, ty_le_thu_hoi, nguoi_tao, nguoi_chot, chot_luc, nguoi_huy, huy_luc, created_at, ty_le_du_kien, nguon_du_kien, thu_hoi_thap, da_xem_boi, da_xem_luc, da_xem_ghi_chu')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!phien) return null;

  const [{ data: vao, error: e1 }, { data: ra, error: e2 }] = await Promise.all([
    client.from('kho_phien_pha_vao').select('id, thu_tu, lo_id, vi_tri_id, so_kg, so_goi')
      .eq('phien_pha_id', id).order('thu_tu'),
    client.from('kho_phien_pha_ra').select('id, thu_tu, mat_hang_id, so_kg, so_goi, xu_ly, vi_tri_id, han_dung, gia_ban_kg, lo_id, tu_quet')
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
      ty_le_du_kien: so(phien.ty_le_du_kien), thu_hoi_thap: !!phien.thu_hoi_thap,
    } as PhienPha,
    vao: (vao ?? []).map(v => ({ ...v, so_kg: Number(v.so_kg) })) as DauVao[],
    ra: (ra ?? []).map(r => ({ ...r, so_kg: Number(r.so_kg), gia_ban_kg: so(r.gia_ban_kg), tu_quet: !!r.tu_quet })) as DauRa[],
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

/** Kết quả xem thử CHỈ KG — cùng dạng jsonb kho_xem_thu_phien_pha_kg() (0031). */
export interface KetQuaTinhKg {
  tong_kg_vao: number;
  kg_thit: number;
  kg_phu_pham: number;
  kg_bo: number;
  kg_hao_hut: number;
  ty_le_thu_hoi: number | null;
  canh_bao: string[];
  dong: {
    ra_id: string; mat_hang_id: string; ten: string; nhom: 'thit' | 'phu_pham' | 'bo'; so_kg: number; ty_le: number | null;
    // 0033
    so_goi: number; xu_ly: 'nhap_kho' | 'chuyen_bep' | 'bo'; tu_quet: boolean; vi_tri_id: string | null;
  }[];
  // 0033: thu hồi dự kiến (công thức / TB 30 ngày), ngưỡng báo, trạng thái báo
  ty_le_du_kien: number | null;
  nguon_du_kien: 'cong_thuc' | 'tb_30_ngay' | null;
  ty_le_tb_30_ngay: number | null;
  nguong_thu_hoi_diem: number | null;
  thu_hoi_thap: boolean;
  da_xem_luc: string | null;
}

/** Xem thử cho vai không xem giá (thủ kho): kg và %, không có tiền. */
export async function xemThuPhienKg(client: SupabaseClient, id: string): Promise<{ kq: KetQuaTinhKg | null; loi: string | null }> {
  const { data, error } = await client.rpc('kho_xem_thu_phien_pha_kg', { p_id: id });
  if (error) return { kq: null, loi: cauLoiKho(error) };
  const t = data as KetQuaTinhKg | null;
  if (!t) return { kq: null, loi: null };
  return {
    loi: null,
    kq: {
      tong_kg_vao: Number(t.tong_kg_vao), kg_thit: Number(t.kg_thit), kg_phu_pham: Number(t.kg_phu_pham),
      kg_bo: Number(t.kg_bo), kg_hao_hut: Number(t.kg_hao_hut), ty_le_thu_hoi: so(t.ty_le_thu_hoi),
      canh_bao: t.canh_bao ?? [],
      dong: (t.dong ?? []).map(d => ({
        ...d, so_kg: Number(d.so_kg), ty_le: so(d.ty_le), so_goi: Number(d.so_goi ?? 0), tu_quet: !!d.tu_quet,
        vi_tri_id: d.vi_tri_id ?? null,
      })),
      ty_le_du_kien: so(t.ty_le_du_kien), nguon_du_kien: t.nguon_du_kien ?? null,
      ty_le_tb_30_ngay: so(t.ty_le_tb_30_ngay), nguong_thu_hoi_diem: so(t.nguong_thu_hoi_diem),
      thu_hoi_thap: !!t.thu_hoi_thap, da_xem_luc: t.da_xem_luc ?? null,
    },
  };
}

/** Phần trăm của một phần so với kg tảng vào (null khi chưa có kg vào). */
export function phanTramCua(kg: number, tongVao: number): number | null {
  return tongVao > 0 ? (kg * 100) / tongVao : null;
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

/**
 * viTriTheoMon (0033): dòng gõ tay "Nhập kho / quầy" để trống ô "Để ở" thì
 * lấy nơi để sau pha của chính mặt hàng (viTriSauPha) — thợ không phải chọn
 * lại cho từng dòng. Không truyền thì như cũ: database báo "chọn nơi để".
 */
export function docFormPhienPha(
  form: FormData,
  viTriTheoMon?: (matHangId: string) => string | null,
): KetQuaDocPhien {
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
    // Không số kg, không số gói = dòng bỏ trống (GĐ5e). Dòng điền sẵn theo
    // công thức có sẵn mặt hàng nhưng chưa cân — trước đây bị báo "số kg chưa
    // đúng", nên bấm Lưu (và nay là mỗi lượt quét, vì quét lưu phần gõ tay
    // trước) hỏng chỉ vì một dòng gợi ý chưa dùng tới.
    if (!r.so_kg && !r.so_goi) continue;
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
    else if (viTriTheoMon && r.xu_ly !== 'bo' && r.xu_ly !== 'chuyen_bep') {
      const vt = viTriTheoMon(r.mat_hang_id);
      if (laUuid(vt)) p.vi_tri_id = vt;
    }
    if (hsd) p.han_dung = hsd;
    payloadRa.push(p);
  }

  return { dau, vao, ra, loi, payloadVao, payloadRa };
}

/**
 * Các nút ở bước Cân & quét mà máy chủ LƯU PHẦN GÕ TAY TRƯỚC rồi mới làm
 * (GĐ5e). Ô quét, −1, bỏ lượt, bỏ món nằm chung một form với các ô gõ kg
 * phụ phẩm: gõ kg rồi quét nhãn ngay (không bấm Lưu) thì số vừa gõ vẫn còn.
 * Trước đây ô quét là form riêng — quét trước khi Lưu là mất số vừa gõ.
 */
export const VIEC_LUU_GO_TAY_TRUOC: readonly string[] = ['quet', 'bo_luot', 'bot_mot', 'xoa_mon'];

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
  ctx: {
    id: string | null; phienBan: number | null; matHangVaoId: string;
    viTriTheoMon?: (matHangId: string) => string | null;
  },
): Promise<KetQuaLuuPhien> {
  const doc = docFormPhienPha(form, ctx.viTriTheoMon);
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
    cau: kq.da_co ? 'Phiên này đã được lưu từ lần bấm trước.' : 'Đã lưu.',
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
/** Quản lý bấm "Đã xem" kết quả phiên đã chốt (0033, quyền duyet) — hết báo thu hồi thấp. */
export function xacNhanPhien(client: SupabaseClient, id: string, ghiChu: string | null) {
  return cauTraVe(client.rpc('kho_xac_nhan_phien_pha', { p_id: id, p_ghi_chu: ghiChu }));
}

/**
 * Bước 1 (0033): bấm nút một loại tảng → tạo phiên nháp ngay, chưa có phần
 * ra. vao: lô đem pha điền sẵn (vaoMacDinh) — tảng chỉ có một lô thì khỏi
 * chọn. ma_gui cố định theo nút: bấm hai lần không mở hai phiên.
 */
export async function taoPhienPha(
  client: SupabaseClient, chiNhanhId: string, maGui: string,
  matHangVaoId: string, congThucId: string | null, vao: { lo_id: string; vi_tri_id: string }[],
): Promise<KetQua & { id?: string }> {
  if (!laUuid(maGui) || !laUuid(matHangVaoId)) return { ok: false, cau: 'Trang đã cũ — tải lại trang rồi chọn lại.' };
  const { data, error } = await client.rpc('kho_luu_phien_pha', {
    p_id: null,
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_phien_ban: null,
    p_mat_hang_vao_id: matHangVaoId,
    p_cong_thuc_id: laUuid(congThucId) ? congThucId : null,
    p_ngay_pha: homNayVn(),
    p_ghi_chu: null,
    p_vao: vao,
    p_ra: [],
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (Array.isArray(data) ? data[0] : data) as { phien_id: string; da_co: boolean } | undefined;
  if (!kq) return { ok: false, cau: 'Không chắc đã mở phiên hay chưa — xem danh sách phiên pha lóc.' };
  return {
    ok: true, id: kq.phien_id,
    cau: kq.da_co ? 'Phiên này đã mở từ lần bấm trước.' : 'Đã mở phiên. Quét nhãn từng gói cắt ra.',
  };
}

// -----------------------------------------------------------------------------
// QUÉT NHÃN KHI PHA (0033)
// -----------------------------------------------------------------------------
export interface KetQuaQuetPha extends KetQua {
  soNhan?: number;
  /** Câu cho các nhãn không cộng được (đã gom theo lỗi). */
  loiNhan?: string[];
}

interface TraVeQuetPha { da_co?: boolean; so_nhan?: number; loi?: { ma: string; loi: string }[] }

/** Một lượt quét: mọi mã trong ô quét, cộng vào phiên. Cùng ma_gui không cộng đôi. */
export async function quetPhienPha(
  client: SupabaseClient, id: string, maGui: string, noiDung: string,
): Promise<KetQuaQuetPha> {
  if (!laUuid(id) || !laUuid(maGui)) return { ok: false, cau: 'Trang đã cũ — tải lại trang rồi quét lại.' };
  const ma = maTuO(noiDung);
  if (ma.length === 0) return { ok: false, cau: 'Ô quét đang trống — chưa đọc nhãn nào.' };
  if (ma.length > TOI_DA_MOT_LUOT) {
    return { ok: false, cau: `Một lần gửi tối đa ${TOI_DA_MOT_LUOT} nhãn — đang có ${ma.length}. Xóa bớt, gửi, rồi quét tiếp.` };
  }
  const { data, error } = await client.rpc('kho_quet_phien_pha', { p_id: id, p_ma_gui: maGui, p_ma: ma });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (data ?? {}) as TraVeQuetPha;
  const soNhan = Number(kq.so_nhan ?? 0);
  return {
    ok: soNhan > 0 || !!kq.da_co,
    cau: cauDaQuet(soNhan, !!kq.da_co),
    soNhan,
    loiNhan: cauLoiNhan(kq.loi ?? []),
  };
}

/** "Bỏ lượt vừa quét" (lan_cuoi), "−1" (bot_mot), "Bỏ món này" (xoa_mon). */
export async function suaQuetPhienPha(
  client: SupabaseClient, id: string, maGui: string,
  cach: 'lan_cuoi' | 'bot_mot' | 'xoa_mon', matHangId: string | null,
): Promise<KetQua> {
  if (!laUuid(id) || !laUuid(maGui)) return { ok: false, cau: 'Trang đã cũ — tải lại trang.' };
  if (cach !== 'lan_cuoi' && !laUuid(matHangId)) return { ok: false, cau: 'Chưa chọn món.' };
  const { data, error } = await client.rpc('kho_bo_quet_phien_pha', {
    p_id: id, p_ma_gui: maGui, p_cach: cach, p_mat_hang_id: cach === 'lan_cuoi' ? null : matHangId,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (data ?? {}) as TraVeQuetPha;
  if (kq.da_co) return { ok: true, cau: 'Đã sửa từ trước — không sửa thêm lần nữa.' };
  const n = Number(kq.so_nhan ?? 0);
  return {
    ok: true,
    cau: cach === 'lan_cuoi' ? `Đã bỏ lượt vừa quét (${n} nhãn).`
      : cach === 'bot_mot' ? 'Đã bớt 1 gói.'
      : `Đã bỏ món này (${n} nhãn).`,
  };
}

/** Nhãn đã quét của phiên (chỉ món và thứ tự — để biết món nào vừa quét). */
export interface NhanQuet { mat_hang_id: string; thu_tu: number }

export async function docNhanQuet(client: SupabaseClient, id: string): Promise<NhanQuet[]> {
  if (!laUuid(id)) return [];
  const { data, error } = await client
    .from('kho_phien_pha_quet')
    .select('mat_hang_id, thu_tu')
    .eq('phien_pha_id', id)
    .limit(5000);
  if (error) throw error;
  return (data ?? []).map(q => ({ mat_hang_id: q.mat_hang_id, thu_tu: Number(q.thu_tu) }));
}

/** Nơi để sau pha của từng mặt hàng (kho_mat_hang.noi_de_sau_pha, 0033). */
export async function docNoiDeSauPha(client: SupabaseClient): Promise<Map<string, 'kho' | 'quay' | null>> {
  const ra = new Map<string, 'kho' | 'quay' | null>();
  const { data, error } = await client
    .from('kho_mat_hang')
    .select('id, noi_de_sau_pha');
  if (error) throw error;
  for (const m of data ?? []) ra.set(m.id, m.noi_de_sau_pha === 'quay' || m.noi_de_sau_pha === 'kho' ? m.noi_de_sau_pha : null);
  return ra;
}

// -----------------------------------------------------------------------------
// PHA LÓC 3 BƯỚC — HÀM THUẦN (0033, test-kho-pha-web.mjs)
// -----------------------------------------------------------------------------
/** "Đã cộng 12 nhãn." */
export function cauDaQuet(soNhan: number, daCo: boolean): string {
  if (daCo) return 'Lượt quét này đã được cộng từ trước — không cộng thêm lần nữa.';
  if (soNhan === 0) return 'Chưa cộng được nhãn nào.';
  return `Đã cộng ${soNhan} nhãn.`;
}

export type BuocPhien = 'can_quet' | 'ket_qua' | 'xong' | 'xem';

/**
 * Trang /pha-loc/<id> đang ở bước nào. Phiên nháp mà người xem ghi được:
 * "Cân & quét", hoặc "Kết quả" khi ?buoc=ket-qua. Phiên đã chốt + ?buoc=xong:
 * màn xong (chuyển ra quầy). Còn lại: xem.
 */
export function buocPhien(trangThai: string, soanDuoc: boolean, buoc: string | null): BuocPhien {
  if (trangThai === 'nhap' && soanDuoc) return buoc === 'ket-qua' ? 'ket_qua' : 'can_quet';
  if (trangThai === 'da_chot' && buoc === 'xong') return 'xong';
  return 'xem';
}

/** Vị trí đủ để so: như kho_vi_tri (danh-muc.ts ViTri). */
interface ViTriGon { id: string; ten: string; loai: string; dang_dung: boolean; thu_tu: number }

/**
 * Nơi để gói của một món sau pha — cùng luật kho_vi_tri_sau_pha (0033): vị trí
 * đang dùng đầu tiên đúng loại (null = kho lạnh); chi nhánh không có quầy thì
 * về kho lạnh. Không bao giờ là chỗ chờ hủy hay "Đang mang ra quầy".
 */
export function viTriSauPha(noi: 'kho' | 'quay' | null | undefined, viTri: ViTriGon[]): string | null {
  const muon = noi ?? 'kho';
  const ds = viTri
    .filter(v => v.dang_dung && (v.loai === 'kho' || v.loai === 'quay'))
    .sort((a, b) =>
      Number(b.loai === muon) - Number(a.loai === muon)
      || Number(b.loai === 'kho') - Number(a.loai === 'kho')
      || a.thu_tu - b.thu_tu
      || a.ten.localeCompare(b.ten));
  return ds[0]?.id ?? null;
}

/** Nút lớn ở bước 1: mỗi loại tảng đang có một nút, kèm tổng kg và số tảng. */
export interface TangCo {
  mat_hang_id: string;
  ten: string;
  loai: 'tang' | 'phan_cat';
  dem_goi: boolean;
  don_vi_goi: string;
  so_kg: number;
  so_goi: number;
  so_lo: number;
  han_gan: string;
}

const laChoPha = (t: Pick<DongTon, 'loai_vi_tri' | 'so_kg'>) =>
  t.loai_vi_tri !== 'cho_huy' && t.loai_vi_tri !== 'dang_chuyen' && t.so_kg > 0;

/**
 * Tồn → các loại tảng đem pha được (tảng nhập, phần cắt lớn), bỏ hàng chờ hủy
 * và hàng đang mang ra quầy. Tảng nhập lên trước, rồi nhiều kg lên trước.
 * Cộng kg theo gam để 0,1 + 0,2 không thành 0,30000000000000004.
 */
export function tomTatTang(ton: DongTon[]): TangCo[] {
  const g = new Map<string, TangCo & { gam: number; lo: Set<string> }>();
  for (const t of ton) {
    if (!laChoPha(t) || (t.loai_hang !== 'tang' && t.loai_hang !== 'phan_cat')) continue;
    const x = g.get(t.mat_hang_id) ?? {
      mat_hang_id: t.mat_hang_id, ten: t.ten_hang, loai: t.loai_hang, dem_goi: t.dem_goi, don_vi_goi: t.don_vi_goi,
      so_kg: 0, so_goi: 0, so_lo: 0, han_gan: t.han_dung, gam: 0, lo: new Set<string>(),
    };
    x.gam += Math.round(t.so_kg * 1000);
    x.so_goi += Number(t.so_goi) || 0;
    x.lo.add(t.lo_id);
    if (t.han_dung < x.han_gan) x.han_gan = t.han_dung;
    g.set(t.mat_hang_id, x);
  }
  return [...g.values()]
    .map(({ gam, lo, ...x }) => ({ ...x, so_kg: gam / 1000, so_lo: lo.size }))
    .sort((a, b) => Number(a.loai !== 'tang') - Number(b.loai !== 'tang') || b.so_kg - a.so_kg || a.ten.localeCompare(b.ten));
}

/**
 * Lô đem pha điền sẵn khi mở phiên: tảng chỉ nằm ở MỘT lô, một chỗ thì lấy
 * hết lô đó (khỏi chọn). Nhiều lô thì để thợ tích — không đoán thay.
 */
export function vaoMacDinh(ton: DongTon[], matHangVaoId: string): { lo_id: string; vi_tri_id: string }[] {
  const ds = ton.filter(t => t.mat_hang_id === matHangVaoId && laChoPha(t));
  return ds.length === 1 ? [{ lo_id: ds[0].lo_id, vi_tri_id: ds[0].vi_tri_id }] : [];
}

/** Một món đã quét nhãn trong phiên — danh sách chạy ở "Cân & quét". */
export interface MonQuet {
  mat_hang_id: string;
  ten: string;
  dem_goi: boolean;
  don_vi_goi: string;
  so_nhan: number;
  so_goi: number;
  so_kg: number;
  vi_tri_id: string | null;
}

/** Dòng ra tu_quet + nhãn → danh sách món, món vừa quét lên đầu (như kho_phien_pha_tra_quet). */
export function monDaQuet(
  ra: Pick<DauRa, 'mat_hang_id' | 'so_kg' | 'so_goi' | 'vi_tri_id' | 'tu_quet' | 'thu_tu'>[],
  nhan: NhanQuet[],
  mh: Map<string, { ten: string; dem_goi: boolean; don_vi_goi: string }>,
): MonQuet[] {
  const dem = new Map<string, { n: number; cuoi: number }>();
  for (const q of nhan) {
    const x = dem.get(q.mat_hang_id) ?? { n: 0, cuoi: 0 };
    x.n += 1;
    x.cuoi = Math.max(x.cuoi, q.thu_tu);
    dem.set(q.mat_hang_id, x);
  }
  return ra
    .filter(r => r.tu_quet)
    .sort((a, b) => (dem.get(b.mat_hang_id)?.cuoi ?? 0) - (dem.get(a.mat_hang_id)?.cuoi ?? 0) || a.thu_tu - b.thu_tu)
    .map(r => {
      const m = mh.get(r.mat_hang_id);
      return {
        mat_hang_id: r.mat_hang_id,
        ten: m?.ten ?? '—',
        dem_goi: m?.dem_goi ?? true,
        don_vi_goi: m?.don_vi_goi ?? 'gói',
        so_nhan: dem.get(r.mat_hang_id)?.n ?? 0,
        so_goi: Number(r.so_goi) || 0,
        so_kg: Number(r.so_kg),
        vi_tri_id: r.vi_tri_id,
      };
    });
}

/**
 * Dòng gõ tay điền sẵn theo công thức: chỉ PHỤ PHẨM và PHẦN BỎ (phần cắt có
 * nhãn thì quét). Món đã có dòng (gõ tay hay quét) thì thôi.
 */
export function dongGoTayTheoCongThuc(
  dong: CongThuc['dong'],
  mh: Map<string, { loai: string; xu_ly_mac_dinh: string }>,
  daCo: Set<string>,
): RaForm[] {
  return [...dong]
    .sort((a, b) => a.thu_tu - b.thu_tu)
    .filter(d => {
      const m = mh.get(d.mat_hang_ra_id);
      if (!m || daCo.has(d.mat_hang_ra_id)) return false;
      return m.loai === 'phu_pham' || (d.xu_ly ?? m.xu_ly_mac_dinh) === 'bo';
    })
    .map(d => ({ ...raTrong(''), mat_hang_id: d.mat_hang_ra_id, xu_ly: d.xu_ly ?? '' }));
}

export const TEN_NGUON_DU_KIEN: Record<string, string> = {
  cong_thuc: 'theo công thức',
  tb_30_ngay: 'trung bình 30 ngày',
};

/**
 * So thu hồi với dự kiến — cùng luật kho_chot_phien_pha (0033): THẤP khi
 * thu hồi < dự kiến − ngưỡng (điểm %, mặc định 3). Chưa có dự kiến hoặc chưa
 * có kg vào thì chưa so được.
 */
export function soSanhThuHoi(
  tyLe: number | null | undefined, duKien: number | null | undefined, nguong: number | null | undefined,
): { muc: 'thap' | 'dat' | 'chua_ro'; chenh: number | null } {
  if (tyLe === null || tyLe === undefined || duKien === null || duKien === undefined
      || !Number.isFinite(tyLe) || !Number.isFinite(duKien)) return { muc: 'chua_ro', chenh: null };
  const chenh = Math.round((tyLe - duKien) * 100) / 100;
  return { muc: tyLe < duKien - (nguong ?? 3) ? 'thap' : 'dat', chenh };
}

/** Một lô vừa pha còn nằm trong kho lạnh — nút "Ra quầy" ở màn xong. */
export interface GoiRaQuay {
  lo_id: string;
  vi_tri_id: string;
  ten: string;
  so_goi: number;
  so_kg: number;
  don_vi_goi: string;
  dem_goi: boolean;
  link: string;
}

/**
 * Màn xong: các lô phiên này sinh ra, còn tồn ở KHO (không tính quầy, chờ
 * hủy, đang mang ra quầy), kèm link mở sẵn phiếu chuyển ra quầy đúng lô đó.
 * daOQuay = số gói đã vào thẳng quầy (món để quầy sau pha).
 */
export function goiRaQuay(
  ra: Pick<DauRa, 'lo_id'>[], ton: DongTon[],
): { lo: GoiRaQuay[]; tongGoi: number; daOQuay: number } {
  const cuaPhien = new Set(ra.map(r => r.lo_id).filter((x): x is string => !!x));
  const lo: GoiRaQuay[] = [];
  let daOQuay = 0;
  for (const t of ton) {
    if (!cuaPhien.has(t.lo_id) || t.so_kg <= 0) continue;
    if (t.loai_vi_tri === 'quay') { daOQuay += Number(t.so_goi) || 0; continue; }
    if (t.loai_vi_tri !== 'kho') continue;
    lo.push({
      lo_id: t.lo_id, vi_tri_id: t.vi_tri_id, ten: t.ten_hang, so_goi: Number(t.so_goi) || 0, so_kg: t.so_kg,
      don_vi_goi: t.don_vi_goi, dem_goi: t.dem_goi,
      link: `/noi-bo/kho/xuat/moi?loai=chuyen&tu=${encodeURIComponent(t.vi_tri_id)}&lo=${encodeURIComponent(t.lo_id)}`,
    });
  }
  return { lo, tongGoi: lo.reduce((s, l) => s + l.so_goi, 0), daOQuay };
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
