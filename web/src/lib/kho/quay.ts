/**
 * KHO — QUẦY: YÊU CẦU → MANG RA → BẤM NHẬN (0032)
 *
 * Ba bước bổ sung hàng cho quầy:
 *   1. NV quầy YÊU CẦU (kho_tao_yeu_cau) — danh sách gợi ý từ
 *      kho_goi_y_ra_quay đã có sẵn số gói, sửa được, thêm món khác được.
 *   2. Thủ kho MANG RA (kho_chuyen_theo_yeu_cau) — lập phiếu chuyển. Cài đặt
 *      "Quầy phải bấm nhận hàng" bật thì hàng nằm ở "Đang mang ra quầy".
 *   3. NV quầy BẤM NHẬN (kho_nhan_hang_chuyen) — "Đã nhận đủ" một chạm, hoặc
 *      ghi số thực nhận. Thiếu thì database báo quản lý (chuyen_nhan_thieu).
 *
 * Mọi thứ ở đây không có tiền: NV quầy và thủ kho đọc được hết. Mặt hàng đọc
 * riêng (không lấy giá bán) thay vì dùng docMatHang của danh mục.
 *
 * FORM (không JavaScript):
 *   Yêu cầu:  g_<mặt hàng> = số của dòng gợi ý; t{i}_mat_hang + t{i}_so =
 *             dòng thêm tay. Số là số GÓI với món đếm gói, số KG với món cân ký.
 *   Mang ra:  m_<mặt hàng> = số mang ra thật (mặc định = số yêu cầu).
 *   Nhận:     n_<mặt hàng> = số thực nhận (chỉ khi bấm "Thiếu").
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, dinhDangKg, docKg, docSoNguyen, laUuid, type KetQua } from './chung.ts';

// -----------------------------------------------------------------------------
// KIỂU DỮ LIỆU
// -----------------------------------------------------------------------------
export interface MatHangQuay {
  id: string; ma: string; ten: string; nhom: string | null; loai: string;
  dem_goi: boolean; don_vi_goi: string; dang_dung: boolean;
}

/** Một dòng kho_goi_y_ra_quay: món ở quầy dưới mức. */
export interface GoiYRaQuay {
  mat_hang_id: string; ma: string; ten: string; nhom: string | null;
  dem_goi: boolean; don_vi_goi: string;
  quay_toi_thieu_goi: number | null; quay_toi_da_goi: number | null; ton_toi_thieu_kg: number | null;
  so_goi_quay: number; so_kg_quay: number;
  so_goi_dang_mang: number; so_kg_dang_mang: number;
  so_goi_kho: number; so_kg_kho: number;
  /** null với món cân ký. */
  so_goi_de_nghi: number | null;
  /** null với món đếm gói. */
  so_kg_de_nghi: number | null;
}

export type TrangThaiYeuCau = 'cho' | 'dang_lam' | 'xong' | 'huy';

export interface YeuCauQuay {
  id: string; so_phieu: string; vi_tri_id: string; ten_vi_tri: string;
  nguon: 'tay' | 'goi_y'; trang_thai: TrangThaiYeuCau; ghi_chu: string | null;
  nguoi_tao: string | null; created_at: string;
  nguoi_xu_ly: string | null; xu_ly_luc: string | null;
  ly_do_huy: string | null; huy_luc: string | null;
  so_mon: number; tong_goi: number;
  phieu_xuat_id: string | null; so_phieu_xuat: string | null; trang_thai_phieu_xuat: string | null;
}

export interface DongYeuCau {
  thu_tu: number; mat_hang_id: string; so_goi: number; so_kg: number | null; ghi_chu: string | null;
}

/** Phiếu chuyển đang mang ra quầy, gom theo mặt hàng. */
export interface HangDangMang {
  id: string; so_phieu: string;
  ten_vi_tri: string; vi_tri_den_id: string | null; ten_vi_tri_den: string | null;
  nguoi_tao: string | null; created_at: string;
  yeu_cau_id: string | null; so_yeu_cau: string | null;
  tong_goi: number; tong_kg: number;
  /** Quá gio_nhac_chuyen giờ mà quầy chưa bấm nhận. */
  qua_gio: boolean;
  mon: MonMangRa[];
}

export interface MonMangRa { mat_hang_id: string; so_goi: number; so_kg: number }

export interface CaiDatQuay { chuyen_quay_can_nhan: boolean; gio_nhac_chuyen: number }

// -----------------------------------------------------------------------------
// HÀM THUẦN
// -----------------------------------------------------------------------------
/** "3 gói" · "1,5 kg" — món đếm gói nói bằng gói, món cân ký nói bằng kg. */
export function cauSoLuong(m: { dem_goi: boolean; don_vi_goi: string }, soGoi: number | null, soKg: number | null): string {
  if (m.dem_goi) return `${soGoi ?? 0} ${m.don_vi_goi || 'gói'}`;
  return `${dinhDangKg(soKg ?? 0)} kg`;
}

/** Số gợi ý mang ra của một dòng gợi ý (0 khi kho đã hết). */
export function soDeNghi(g: GoiYRaQuay): number {
  return g.dem_goi ? Math.max(0, g.so_goi_de_nghi ?? 0) : Math.max(0, g.so_kg_de_nghi ?? 0);
}

/** Đọc một ô số: gói (nguyên) với món đếm gói, kg với món cân ký. Trống = null, sai = NaN. */
export function docSoMon(m: { dem_goi: boolean }, v: unknown): number | null {
  return m.dem_goi ? docSoNguyen(v, 0, 100000) : docKg(v);
}

export interface DongGuiYeuCau { mat_hang_id: string; so_goi?: number; so_kg?: number }

/**
 * Form yêu cầu → p_dong của kho_tao_yeu_cau. Ô trống hoặc 0 thì bỏ qua; một
 * món ghi ở cả dòng gợi ý lẫn dòng thêm tay thì cộng lại (database không nhận
 * một món hai lần).
 */
export function docFormYeuCau(form: FormData, matHang: MatHangQuay[], soDongThem: number): {
  dong: DongGuiYeuCau[]; loi: string[]; nguon: 'tay' | 'goi_y';
} {
  const theoId = new Map(matHang.map(m => [m.id, m]));
  const cong = new Map<string, number>();
  const loi: string[] = [];
  let tuGoiY = false;
  const them = (m: MatHangQuay, v: unknown, noi: string) => {
    const n = docSoMon(m, v);
    if (n === null || n === 0) return false;
    if (Number.isNaN(n)) {
      loi.push(`${noi} "${m.ten}": ${m.dem_goi ? `số ${m.don_vi_goi || 'gói'} phải là số nguyên` : 'số kg không hợp lệ (vd. 1,5)'}.`);
      return false;
    }
    cong.set(m.id, Math.round(((cong.get(m.id) ?? 0) + n) * 1000) / 1000);
    return true;
  };
  for (const [khoa, v] of form.entries()) {
    const id = khoa.startsWith('g_') ? khoa.slice(2) : '';
    const m = laUuid(id) ? theoId.get(id) : undefined;
    if (m && them(m, v, 'Món')) tuGoiY = true;
  }
  for (let i = 0; i < soDongThem; i++) {
    const id = String(form.get(`t${i}_mat_hang`) ?? '');
    const so = String(form.get(`t${i}_so`) ?? '').trim();
    if (!id && !so) continue;
    const m = theoId.get(id);
    if (!m) { if (so) loi.push(`Dòng thêm ${i + 1}: chưa chọn món.`); continue; }
    if (so === '') { loi.push(`Dòng thêm ${i + 1} "${m.ten}": chưa ghi số lượng.`); continue; }
    them(m, so, `Dòng thêm ${i + 1}`);
  }
  const dong: DongGuiYeuCau[] = [];
  for (const [id, n] of cong) {
    const m = theoId.get(id)!;
    dong.push(m.dem_goi ? { mat_hang_id: id, so_goi: n } : { mat_hang_id: id, so_kg: n });
  }
  return { dong, loi, nguon: tuGoiY ? 'goi_y' : 'tay' };
}

/**
 * Form "Mang ra quầy" → p_dong của kho_chuyen_theo_yeu_cau. Mọi món đúng như
 * yêu cầu → null (database lấy nguyên yêu cầu). Món ghi 0 thì không mang.
 */
export function docFormMangRa(form: FormData, dong: DongYeuCau[], matHang: MatHangQuay[]): {
  pDong: DongGuiYeuCau[] | null; loi: string[];
} {
  const theoId = new Map(matHang.map(m => [m.id, m]));
  const loi: string[] = [];
  const ra: DongGuiYeuCau[] = [];
  let doi = false;
  for (const d of dong) {
    const m = theoId.get(d.mat_hang_id);
    if (!m) continue;
    const yc = m.dem_goi ? d.so_goi : (d.so_kg ?? 0);
    const o = form.get(`m_${d.mat_hang_id}`);
    const n = o === null ? yc : docSoMon(m, o);
    if (n === null) { doi = true; continue; }
    if (Number.isNaN(n)) { loi.push(`"${m.ten}": số mang ra không hợp lệ.`); continue; }
    if (n !== yc) doi = true;
    if (n > 0) ra.push(m.dem_goi ? { mat_hang_id: m.id, so_goi: n } : { mat_hang_id: m.id, so_kg: n });
  }
  if (loi.length === 0 && ra.length === 0) loi.push('Không có món nào để mang ra. Kho hết hàng thì bấm "Hủy yêu cầu" và báo quản lý.');
  return { pDong: doi ? ra : null, loi };
}

/**
 * Form "Thiếu — ghi số thực nhận" → p_dong của kho_nhan_hang_chuyen: chỉ những
 * món nhận ÍT hơn số mang ra. Không món nào thiếu → null (= nhận đủ).
 */
export function docFormNhan(form: FormData, mon: MonMangRa[], matHang: MatHangQuay[]): {
  pDong: DongGuiYeuCau[] | null; loi: string[];
} {
  const theoId = new Map(matHang.map(m => [m.id, m]));
  const loi: string[] = [];
  const thieu: DongGuiYeuCau[] = [];
  for (const d of mon) {
    const m = theoId.get(d.mat_hang_id) ?? { id: d.mat_hang_id, ten: 'Món', dem_goi: d.so_goi > 0, don_vi_goi: 'gói' };
    const gui = m.dem_goi ? d.so_goi : d.so_kg;
    const n = docSoMon(m, form.get(`n_${d.mat_hang_id}`));
    if (n === null) { loi.push(`"${m.ten}": ghi số thực nhận (không nhận được gì thì ghi 0).`); continue; }
    if (Number.isNaN(n)) { loi.push(`"${m.ten}": số nhận không hợp lệ.`); continue; }
    if (n > gui) { loi.push(`"${m.ten}": nhận ${n} nhưng chỉ mang ra ${m.dem_goi ? gui : dinhDangKg(gui)}.`); continue; }
    if (n < gui) thieu.push(m.dem_goi ? { mat_hang_id: d.mat_hang_id, so_goi: n } : { mat_hang_id: d.mat_hang_id, so_kg: n });
  }
  return { pDong: thieu.length > 0 ? thieu : null, loi };
}

/** Gom dòng phiếu (một món có thể nằm ở nhiều dòng / nhiều lô) theo mặt hàng. */
export function gomMon(dong: { mat_hang_id: string; so_goi: number; so_kg: number }[]): MonMangRa[] {
  const ra = new Map<string, MonMangRa>();
  for (const d of dong) {
    const c = ra.get(d.mat_hang_id) ?? { mat_hang_id: d.mat_hang_id, so_goi: 0, so_kg: 0 };
    c.so_goi += Number(d.so_goi) || 0;
    c.so_kg = Math.round((c.so_kg + (Number(d.so_kg) || 0)) * 1000) / 1000;
    ra.set(d.mat_hang_id, c);
  }
  return [...ra.values()];
}

/** Đã quá số giờ nhắc mà chưa bấm nhận chưa. */
export function quaGio(createdAt: string, gio: number, bayGio = new Date()): boolean {
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) && bayGio.getTime() - t >= gio * 3600000;
}

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
/** Mặt hàng cho quầy — không lấy giá bán. */
export async function docMatHangQuay(client: SupabaseClient): Promise<MatHangQuay[]> {
  const { data, error } = await client
    .from('kho_mat_hang')
    .select('id, ma, ten, nhom, loai, dem_goi, don_vi_goi, dang_dung, thu_tu')
    .order('loai').order('thu_tu').order('ten');
  if (error) throw error;
  return (data ?? []) as MatHangQuay[];
}

export async function docCaiDatQuay(client: SupabaseClient, chiNhanhId: string): Promise<CaiDatQuay | null> {
  const { data, error } = await client
    .from('kho_cai_dat')
    .select('chuyen_quay_can_nhan, gio_nhac_chuyen')
    .eq('chi_nhanh_id', chiNhanhId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { chuyen_quay_can_nhan: !!data.chuyen_quay_can_nhan, gio_nhac_chuyen: Number(data.gio_nhac_chuyen) || 2 };
}

const soHoa = (x: unknown) => (x === null || x === undefined ? null : Number(x));

export async function docGoiYRaQuay(client: SupabaseClient, chiNhanhId: string, viTriId: string | null): Promise<GoiYRaQuay[]> {
  const { data, error } = await client.rpc('kho_goi_y_ra_quay', { p_chi_nhanh_id: chiNhanhId, p_vi_tri_id: viTriId });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(r => ({
    ...(r as unknown as GoiYRaQuay),
    quay_toi_thieu_goi: soHoa(r.quay_toi_thieu_goi), quay_toi_da_goi: soHoa(r.quay_toi_da_goi),
    ton_toi_thieu_kg: soHoa(r.ton_toi_thieu_kg),
    so_goi_quay: Number(r.so_goi_quay) || 0, so_kg_quay: Number(r.so_kg_quay) || 0,
    so_goi_dang_mang: Number(r.so_goi_dang_mang) || 0, so_kg_dang_mang: Number(r.so_kg_dang_mang) || 0,
    so_goi_kho: Number(r.so_goi_kho) || 0, so_kg_kho: Number(r.so_kg_kho) || 0,
    so_goi_de_nghi: soHoa(r.so_goi_de_nghi), so_kg_de_nghi: soHoa(r.so_kg_de_nghi),
  }));
}

/** Yêu cầu gần đây của chi nhánh (mới trước). chiCho = chỉ yêu cầu đang chờ (cũ trước). */
export async function docDanhSachYeuCau(
  client: SupabaseClient, chiNhanhId: string, tuy: { chiCho?: boolean; gioiHan?: number } = {},
): Promise<YeuCauQuay[]> {
  let q = client.from('kho_v_yeu_cau_quay').select('id, so_phieu, vi_tri_id, ten_vi_tri, nguon, trang_thai, ghi_chu, nguoi_tao, created_at, nguoi_xu_ly, xu_ly_luc, ly_do_huy, huy_luc, so_mon, tong_goi, phieu_xuat_id, so_phieu_xuat, trang_thai_phieu_xuat').eq('chi_nhanh_id', chiNhanhId);
  q = tuy.chiCho ? q.eq('trang_thai', 'cho').order('created_at') : q.order('created_at', { ascending: false });
  const { data, error } = await q.limit(tuy.gioiHan ?? 30);
  if (error) throw error;
  return (data ?? []) as YeuCauQuay[];
}

export async function docYeuCau(client: SupabaseClient, id: string): Promise<{ yc: YeuCauQuay; dong: DongYeuCau[] } | null> {
  if (!laUuid(id)) return null;
  const [a, b] = await Promise.all([
    client.from('kho_v_yeu_cau_quay').select('id, so_phieu, vi_tri_id, ten_vi_tri, nguon, trang_thai, ghi_chu, nguoi_tao, created_at, nguoi_xu_ly, xu_ly_luc, ly_do_huy, huy_luc, so_mon, tong_goi, phieu_xuat_id, so_phieu_xuat, trang_thai_phieu_xuat').eq('id', id).maybeSingle(),
    client.from('kho_yeu_cau_quay_dong').select('thu_tu, mat_hang_id, so_goi, so_kg, ghi_chu')
      .eq('yeu_cau_id', id).order('thu_tu'),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  if (!a.data) return null;
  const dong = ((b.data ?? []) as DongYeuCau[]).map(d => ({ ...d, so_goi: Number(d.so_goi) || 0, so_kg: soHoa(d.so_kg) }));
  return { yc: a.data as YeuCauQuay, dong };
}

/** Phiếu chuyển đang mang ra (chờ quầy bấm nhận), cũ trước. */
export async function docHangDangMang(
  client: SupabaseClient, chiNhanhId: string, gioNhac: number,
): Promise<HangDangMang[]> {
  const { data, error } = await client
    .from('kho_v_phieu_xuat')
    .select('id, so_phieu, ten_vi_tri, vi_tri_den_id, ten_vi_tri_den, nguoi_tao, created_at, yeu_cau_id, so_yeu_cau, tong_goi, tong_kg')
    .eq('chi_nhanh_id', chiNhanhId).eq('loai', 'chuyen').eq('trang_thai', 'dang_chuyen')
    .order('created_at').limit(50);
  if (error) throw error;
  const phieu = (data ?? []) as Omit<HangDangMang, 'mon' | 'qua_gio'>[];
  if (phieu.length === 0) return [];
  const { data: dd, error: e2 } = await client
    .from('kho_phieu_xuat_dong')
    .select('phieu_xuat_id, thu_tu, mat_hang_id, so_goi, so_kg')
    .in('phieu_xuat_id', phieu.map(p => p.id))
    .order('thu_tu');
  if (e2) throw e2;
  const dong = (dd ?? []) as { phieu_xuat_id: string; mat_hang_id: string; so_goi: number; so_kg: number }[];
  return phieu.map(p => ({
    ...p, tong_goi: Number(p.tong_goi) || 0, tong_kg: Number(p.tong_kg) || 0,
    qua_gio: quaGio(p.created_at, gioNhac),
    mon: gomMon(dong.filter(d => d.phieu_xuat_id === p.id)),
  }));
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
export async function taoYeuCau(
  client: SupabaseClient, chiNhanhId: string, maGui: string, viTriId: string | null,
  nguon: 'tay' | 'goi_y', ghiChu: string, dong: DongGuiYeuCau[],
): Promise<KetQua & { id?: string }> {
  if (!laUuid(maGui)) return { ok: false, cau: 'Trang đã cũ — tải lại rồi gửi lại.' };
  if (dong.length === 0) return { ok: false, cau: 'Chưa có món nào — ghi số gói (hoặc kg) cho món quầy cần.' };
  const { data, error } = await client.rpc('kho_tao_yeu_cau', {
    p_chi_nhanh_id: chiNhanhId, p_ma_gui: maGui, p_vi_tri_id: viTriId,
    p_nguon: nguon, p_ghi_chu: ghiChu || null, p_dong: dong,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const r = (Array.isArray(data) ? data[0] : data) as { yeu_cau_id: string; so_phieu: string; da_co: boolean } | undefined;
  if (!r) return { ok: false, cau: 'Chưa ghi được. Tải lại trang để kiểm tra.' };
  return { ok: true, id: r.yeu_cau_id,
    cau: r.da_co ? `Yêu cầu ${r.so_phieu} đã gửi từ trước.` : `Đã gửi yêu cầu ${r.so_phieu}. Thủ kho sẽ mang hàng ra.` };
}

export async function huyYeuCau(client: SupabaseClient, id: string, lyDo: string): Promise<KetQua> {
  const { data, error } = await client.rpc('kho_huy_yeu_cau', { p_id: id, p_ly_do: lyDo || null });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: String(data ?? 'Đã hủy yêu cầu.') };
}

export async function chuyenTheoYeuCau(
  client: SupabaseClient, id: string, maGui: string, tuViTriId: string | null, dong: DongGuiYeuCau[] | null,
): Promise<KetQua & { phieuId?: string }> {
  if (!laUuid(maGui)) return { ok: false, cau: 'Trang đã cũ — tải lại rồi gửi lại.' };
  const { data, error } = await client.rpc('kho_chuyen_theo_yeu_cau', {
    p_id: id, p_ma_gui: maGui, p_vi_tri_id: tuViTriId, p_dong: dong,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const r = (Array.isArray(data) ? data[0] : data) as { phieu_id: string; so_phieu: string; da_co: boolean } | undefined;
  if (!r) return { ok: false, cau: 'Chưa ghi được. Tải lại trang để kiểm tra.' };
  return { ok: true, phieuId: r.phieu_id,
    cau: r.da_co ? `Phiếu ${r.so_phieu} đã lập từ trước.` : `Đã lập phiếu ${r.so_phieu} — mang hàng ra quầy.` };
}

export async function nhanHangChuyen(
  client: SupabaseClient, id: string, maGui: string, dong: DongGuiYeuCau[] | null,
): Promise<KetQua> {
  if (!laUuid(maGui)) return { ok: false, cau: 'Trang đã cũ — tải lại rồi bấm lại.' };
  const { data, error } = await client.rpc('kho_nhan_hang_chuyen', { p_id: id, p_ma_gui: maGui, p_dong: dong });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: String(data ?? 'Đã nhận hàng.') };
}

export async function huyChuyen(client: SupabaseClient, id: string, lyDo: string): Promise<KetQua> {
  const { data, error } = await client.rpc('kho_huy_chuyen', { p_id: id, p_ly_do: lyDo || null });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: String(data ?? 'Đã hủy chuyến — hàng về lại kho.') };
}

/** Công tắc "Quầy phải bấm nhận hàng" — lưu qua kho_luu_nguong (0032), quyền danh_muc. */
export async function luuCongTacNhan(client: SupabaseClient, chiNhanhId: string, bat: boolean): Promise<KetQua> {
  const { error } = await client.rpc('kho_luu_nguong', {
    p_chi_nhanh_id: chiNhanhId, p_nguong: { chuyen_quay_can_nhan: bat },
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: bat
    ? 'Đã bật: hàng thủ kho mang ra chỉ vào quầy khi nhân viên quầy bấm "Đã nhận".'
    : 'Đã tắt: hàng mang ra vào thẳng quầy, không cần bấm nhận.' };
}
