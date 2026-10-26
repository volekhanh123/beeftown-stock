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
 *      Món theo dõi theo tảng còn có đường MỘT CHẠM "Lóc #0142" (mục "Tảng lóc
 *      được" ở đây, nút "Lóc" dưới số tảng ở Tảng · ủ): locMotTang mở phiên với
 *      đúng lô đó và giao ô mã luôn — không migration, dùng lại kho_luu_phien_pha
 *      (cùng ma_gui trả phiên cũ) và kho_giao_o_ma (bấm lại không lấy thêm ô).
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
 *
 * Hai thứ tiếng: lỗi form có loiEn song song với loi, câu báo có cauEn (lỗi
 * từng nhãn: loiNhanEn), bảng tên có bản _NB. Câu database trả về (chốt, mở
 * lại…) thì trang tra dichCau lúc hiện.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, dinhDangKg, docKg, docNgay, docSoNguyen, docTungTrang, donViChung, homNayVn, kqHai, kqLoi, laUuid, LOI_KHO_CHUNG, type HaiThuTieng, type KetQua, type NgonNguNB } from './chung.ts';
import { apDungTim, type TimDs } from './tim-ds.ts';
import { maTuO, cauLoiNhan, cauQuaNhieuNhan, cauBoLuot, TOI_DA_MOT_LUOT } from './dem-quay.ts';
import type { DongTon } from './ton.ts';
import { docCongThuc, type CongThuc } from './danh-muc.ts';
// Một chiều: tang.ts và o-ma.ts không import file này.
import { cauConU, soTangChu, type TangTon } from './tang.ts';
import { docOMa, giaoOMa } from './o-ma.ts';
import { dichCau } from '../cau-noi-bo.ts';

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
  /** Số DÒNG vào (mỗi lô mỗi vị trí một dòng). Đếm lô thì dùng so_lo_vao. */
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
  // 0098: số LÔ khác nhau — Lóc một chạm đưa một lô vào thành hai dòng (kho lạnh + quầy), "N lô vào" in số này.
  so_lo_vao: number;
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
    .select('id, so_phieu, trang_thai, mat_hang_vao_id, ten_mat_hang_vao, ngay_pha, tong_kg_vao, tong_kg_thit, ty_le_thu_hoi, so_dau_vao, so_dau_ra, kg_vao_nhap, kg_ra_nhap, nguoi_tao, created_at, ty_le_du_kien, thu_hoi_thap, da_xem_luc, so_lo_vao')
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
  /** Các lỗi đó bằng tiếng Anh, cùng thứ tự. */
  loiEn: string[];
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
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const dau: DauPhienForm = { ngay_pha: s('ngay_pha'), ghi_chu: s('ghi_chu'), cong_thuc_id: s('cong_thuc_id') };
  if (dau.ngay_pha && docNgay(dau.ngay_pha) === undefined) {
    bao({ vi: 'Ngày pha không phải ngày có thật', en: 'The butchery date is not a real date' });
  }

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
    if (!laUuid(v.lo_id) || !laUuid(v.vi_tri_id)) {
      bao({ vi: `Lô đầu vào thứ ${i + 1} không hợp lệ — tải lại trang`, en: `Input lot ${i + 1} is not valid — reload the page` });
      continue;
    }
    const kg = docKg(v.so_kg);
    const goi = docSoNguyen(v.so_goi, 0, 100000);
    if (Number.isNaN(kg) || (kg !== null && kg <= 0)) {
      bao({ vi: `Lô đầu vào thứ ${i + 1}: số kg chưa đúng (ví dụ 9,3) — bỏ trống nếu lấy hết lô`,
            en: `Input lot ${i + 1}: the kg is not right (for example 9.3) — leave it empty to use the whole lot` });
    }
    if (Number.isNaN(goi)) bao({ vi: `Lô đầu vào thứ ${i + 1}: số tảng là số nguyên`, en: `Input lot ${i + 1}: the number of primals must be a whole number` });
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
    // công thức có sẵn mặt hàng nhưng chưa cân — trước đây bị báo
    // "số kg chưa đúng", nên bấm Lưu (và nay là mỗi lượt quét, vì quét lưu
    // phần gõ tay trước) hỏng chỉ vì một dòng gợi ý chưa dùng tới.
    if (!r.so_kg && !r.so_goi) continue;
    ra.push(r);
    const thu = ra.length;
    if (!laUuid(r.mat_hang_id)) { bao({ vi: `Phần ra ${thu}: chưa chọn mặt hàng`, en: `Output ${thu}: no item chosen` }); continue; }
    const kg = docKg(r.so_kg);
    const goi = docSoNguyen(r.so_goi, 0, 100000);
    const hsd = docNgay(r.han_dung);
    if (kg === null || Number.isNaN(kg) || kg <= 0) {
      bao({ vi: `Phần ra ${thu}: số kg chưa đúng (ví dụ 7,25)`, en: `Output ${thu}: the kg is not right (for example 7.25)` });
    }
    if (Number.isNaN(goi)) bao({ vi: `Phần ra ${thu}: số gói là số nguyên`, en: `Output ${thu}: the number of packs must be a whole number` });
    if (hsd === undefined) bao({ vi: `Phần ra ${thu}: hạn dùng không phải ngày có thật`, en: `Output ${thu}: the use-by date is not a real date` });
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

  return { dau, vao, ra, loi, loiEn, payloadVao, payloadRa };
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
  if (doc.loi.length) return { ...kqHai(false, { vi: doc.loi.join(' · '), en: doc.loiEn.join(' · ') }), doc };
  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) return { ...kqHai(false, CAU_PHA.formCu), doc };

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
  if (!kq) return { ...kqHai(false, CAU_PHA.khongChacLuu), doc };
  return { ...kqHai(true, kq.da_co ? CAU_PHA.daLuuTruoc : CAU_PHA.daLuu), id: kq.phien_id, phienBan: kq.phien_ban_moi };
}

/** Câu database (màn tiếng Anh tra dichCau lúc hiện); database không trả câu nào thì "Xong.". */
async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return data === null || data === undefined ? kqHai(true, CAU_PHA.xong) : { ok: true, cau: String(data) };
}

const CAU_PHA = {
  formCu: { vi: 'Form đã cũ — tải lại trang rồi nhập lại.', en: 'This form is out of date — reload the page and enter it again.' },
  khongChacLuu: { vi: 'Không chắc đã lưu hay chưa — tải lại trang để kiểm tra.', en: 'Not sure whether it was saved — reload the page to check.' },
  daLuuTruoc: { vi: 'Phiên này đã được lưu từ lần bấm trước.', en: 'This session was already saved by the previous press.' },
  daLuu: { vi: 'Đã lưu.', en: 'Saved.' },
  xong: { vi: 'Xong.', en: 'Done.' },
  trangCuChon: { vi: 'Trang đã cũ — tải lại trang rồi chọn lại.', en: 'This page is out of date — reload it and choose again.' },
  khongChacMo: {
    vi: 'Không chắc đã mở phiên hay chưa — xem danh sách phiên pha lóc.',
    en: 'Not sure whether the session was opened — check the list of butchery sessions.',
  },
  daMoTruoc: { vi: 'Phiên này đã mở từ lần bấm trước.', en: 'This session was already opened by the previous press.' },
  daMo: { vi: 'Đã mở phiên. Quét nhãn từng gói cắt ra.', en: 'Session opened. Scan the label of each pack you cut.' },
  trangCuQuet: { vi: 'Trang đã cũ — tải lại trang rồi quét lại.', en: 'This page is out of date — reload it and scan again.' },
  oTrong: { vi: 'Ô quét đang trống — chưa đọc nhãn nào.', en: 'The scan box is empty — no labels read yet.' },
  trangCu: { vi: 'Trang đã cũ — tải lại trang.', en: 'This page is out of date — reload it.' },
  chuaChonMon: { vi: 'Chưa chọn món.', en: 'No item chosen.' },
  daSua: { vi: 'Đã sửa từ trước — không sửa thêm lần nữa.', en: 'Already changed — not changed again.' },
  botMot: { vi: 'Đã bớt 1 gói.', en: 'Removed 1 pack.' },
  daCong: { vi: 'Lượt quét này đã được cộng từ trước — không cộng thêm lần nữa.', en: 'This scan was already added — it is not added again.' },
  chuaCong: { vi: 'Chưa cộng được nhãn nào.', en: 'No labels were added.' },
} satisfies Record<string, HaiThuTieng>;

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
 * chọn. ma_gui cố định theo nút: bấm hai lần không mở hai phiên. daCo: phiên
 * này đã có từ lần bấm trước cùng ma_gui (database không ghi gì thêm).
 */
export async function taoPhienPha(
  client: SupabaseClient, chiNhanhId: string, maGui: string,
  matHangVaoId: string, congThucId: string | null, vao: { lo_id: string; vi_tri_id: string }[],
): Promise<KetQua & { id?: string; daCo?: boolean }> {
  if (!laUuid(maGui) || !laUuid(matHangVaoId)) return kqHai(false, CAU_PHA.trangCuChon);
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
  if (!kq) return kqHai(false, CAU_PHA.khongChacMo);
  return { ...kqHai(true, kq.da_co ? CAU_PHA.daMoTruoc : CAU_PHA.daMo), id: kq.phien_id, daCo: !!kq.da_co };
}

// -----------------------------------------------------------------------------
// QUÉT NHÃN KHI PHA (0033)
// -----------------------------------------------------------------------------
export interface KetQuaQuetPha extends KetQua {
  soNhan?: number;
  /** Câu cho các nhãn không cộng được (đã gom theo lỗi). */
  loiNhan?: string[];
  /** Các câu đó bằng tiếng Anh, cùng thứ tự. */
  loiNhanEn?: string[];
}

interface TraVeQuetPha { da_co?: boolean; so_nhan?: number; loi?: { ma: string; loi: string }[] }

/** Một lượt quét: mọi mã trong ô quét, cộng vào phiên. Cùng ma_gui không cộng đôi. */
export async function quetPhienPha(
  client: SupabaseClient, id: string, maGui: string, noiDung: string,
): Promise<KetQuaQuetPha> {
  if (!laUuid(id) || !laUuid(maGui)) return kqHai(false, CAU_PHA.trangCuQuet);
  const ma = maTuO(noiDung);
  if (ma.length === 0) return kqHai(false, CAU_PHA.oTrong);
  if (ma.length > TOI_DA_MOT_LUOT) return kqHai(false, cauQuaNhieuNhan(ma.length));
  const { data, error } = await client.rpc('kho_quet_phien_pha', { p_id: id, p_ma_gui: maGui, p_ma: ma });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (data ?? {}) as TraVeQuetPha;
  const soNhan = Number(kq.so_nhan ?? 0);
  return {
    ok: soNhan > 0 || !!kq.da_co,
    cau: cauDaQuet(soNhan, !!kq.da_co),
    cauEn: cauDaQuet(soNhan, !!kq.da_co, 'en'),
    soNhan,
    loiNhan: cauLoiNhan(kq.loi ?? []),
    loiNhanEn: cauLoiNhan(kq.loi ?? [], 'en'),
  };
}

/** "Bỏ lượt vừa quét" (lan_cuoi), "−1" (bot_mot), "Bỏ món này" (xoa_mon). */
export async function suaQuetPhienPha(
  client: SupabaseClient, id: string, maGui: string,
  cach: 'lan_cuoi' | 'bot_mot' | 'xoa_mon', matHangId: string | null,
): Promise<KetQua> {
  if (!laUuid(id) || !laUuid(maGui)) return kqHai(false, CAU_PHA.trangCu);
  if (cach !== 'lan_cuoi' && !laUuid(matHangId)) return kqHai(false, CAU_PHA.chuaChonMon);
  const { data, error } = await client.rpc('kho_bo_quet_phien_pha', {
    p_id: id, p_ma_gui: maGui, p_cach: cach, p_mat_hang_id: cach === 'lan_cuoi' ? null : matHangId,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (data ?? {}) as TraVeQuetPha;
  if (kq.da_co) return kqHai(true, CAU_PHA.daSua);
  const n = Number(kq.so_nhan ?? 0);
  return kqHai(true, cach === 'lan_cuoi' ? cauBoLuot(n)
    : cach === 'bot_mot' ? CAU_PHA.botMot
    : { vi: `Đã bỏ món này (${n} nhãn).`, en: `Removed this item (${n} ${n === 1 ? 'label' : 'labels'}).` });
}

/** Nhãn đã quét của phiên (chỉ món và thứ tự — để biết món nào vừa quét). */
export interface NhanQuet { mat_hang_id: string; thu_tu: number }

export async function docNhanQuet(client: SupabaseClient, id: string): Promise<NhanQuet[]> {
  if (!laUuid(id)) return [];
  const data = await docTungTrang((tu, den) => client
    .from('kho_phien_pha_quet')
    .select('mat_hang_id, thu_tu', { count: 'exact' })
    .eq('phien_pha_id', id)
    .order('thu_tu')
    .range(tu, den));
  return data.map(q => ({ mat_hang_id: q.mat_hang_id, thu_tu: Number(q.thu_tu) }));
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
export function cauDaQuet(soNhan: number, daCo: boolean, nn: NgonNguNB = 'vi'): string {
  if (daCo) return CAU_PHA.daCong[nn];
  if (soNhan === 0) return CAU_PHA.chuaCong[nn];
  return { vi: `Đã cộng ${soNhan} nhãn.`, en: `Added ${soNhan} ${soNhan === 1 ? 'label' : 'labels'}.` }[nn];
}

/** Đơn vị gói mặc định của cột kho_mat_hang.don_vi_goi (0019) — dữ liệu, chỉ dùng khi không đọc được món. */
const GOI_MAC_DINH: HaiThuTieng = { vi: 'gói', en: 'packs' };

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

// -----------------------------------------------------------------------------
// LÓC MỘT CHẠM — "Lóc #0142" (món theo dõi theo tảng; test-kho-loc-tang-web.mjs)
// -----------------------------------------------------------------------------
// Trước đây lóc một tảng phải: chọn loại tảng → sang bước 2 → mở "Tảng đem pha" → tích đúng lô trong nhiều lô →
// Lưu → bấm "Giao ô mã". Một chạm làm cả chuỗi đó cho ĐÚNG lô đã bấm. Không hàm database mới: kho_luu_phien_pha
// (cùng ma_gui trả phiên cũ — 0033) và kho_giao_o_ma (bấm lại không lấy thêm ô — 0049) đều gọi lại an toàn; sổ kho chỉ
// bị đụng lúc chốt, và chốt tự kiểm tồn. Tạo phiên rồi giao ô là hai lệnh: hỏng ở giữa thì còn một phiên nháp hợp lệ,
// bấm lại thì giao ô lần nữa (tự lành).

/** Một chỗ (lô × vị trí) của tảng đem lóc được. */
export interface ChoLoc { lo_id: string; vi_tri_id: string; so_kg: number }

/**
 * Tồn → các chỗ lóc được của từng lô — cùng luật laChoPha: bỏ chỗ chờ huỷ, hàng đang mang ra quầy, kg 0. Một lô có
 * thể nằm vài chỗ (kho lạnh và quầy — trigger kho_phien_pha_vao_mot_tang của 0049 cho phép, vẫn là một tảng).
 */
export function choLocTheoLo(ton: Pick<DongTon, 'lo_id' | 'vi_tri_id' | 'loai_vi_tri' | 'so_kg'>[]): Map<string, ChoLoc[]> {
  const ra = new Map<string, ChoLoc[]>();
  for (const t of ton) {
    if (!laChoPha(t)) continue;
    ra.set(t.lo_id, [...(ra.get(t.lo_id) ?? []), { lo_id: t.lo_id, vi_tri_id: t.vi_tri_id, so_kg: Number(t.so_kg) }]);
  }
  return ra;
}

/** Đầu vào của phiên một chạm: mọi chỗ lóc được của đúng lô đó, lấy hết (không gửi kg — database lấy cả lô ở chỗ đó). */
export function vaoCuaTang(cho: Map<string, ChoLoc[]>, loId: string): { lo_id: string; vi_tri_id: string }[] {
  return (cho.get(loId) ?? []).map(c => ({ lo_id: c.lo_id, vi_tri_id: c.vi_tri_id }));
}

/** Cộng kg theo gam: 0,1 + 0,2 = 0,3 chứ không 0,30000000000000004. */
const kgCong = (ds: readonly { so_kg: number }[]) => ds.reduce((s, c) => s + Math.round(c.so_kg * 1000), 0) / 1000;

/**
 * Tảng hiện nút "Lóc #0142" — MỘT luật cho Pha lóc mới và Tảng · ủ:
 *   · có số tảng (lô nhận nhiều tảng một dòng, lô nhận trước khi bật "Theo dõi theo tảng" thì không — đi nút loại tảng);
 *   · không còn đang ủ (sẵn sàng lóc hoặc chưa có bảng ủ; lóc sớm đi nút loại tảng, bước 2 có câu nhắc tảng còn ủ);
 *   · còn chỗ lóc được (tảng chỉ còn ở chỗ chờ huỷ thì không);
 *   · chưa nằm trong phiên nháp nào (phiên đó đã có ở "Phiên đang dở").
 * kg_loc: kg ở các chỗ lóc được, cộng theo gam.
 */
export function tangLocDuoc<T extends Pick<TangTon, 'lo_id' | 'so_tang' | 'tinh_trang_u'>>(
  tang: readonly T[], cho: Map<string, ChoLoc[]>, dangLoc: { has(loId: string): boolean },
): (T & { kg_loc: number })[] {
  return tang
    .filter(t => t.so_tang !== null && t.so_tang !== undefined && t.tinh_trang_u !== 'dang_u'
      && (cho.get(t.lo_id)?.length ?? 0) > 0 && !dangLoc.has(t.lo_id))
    .map(t => ({ ...t, kg_loc: kgCong(cho.get(t.lo_id) ?? []) }));
}

/** Loại tảng có ĐÚNG một công thức đang dùng → id công thức đó (gắn sẵn vào phiên); không có hoặc nhiều → null. */
export function congThucMot(congThuc: readonly Pick<CongThuc, 'id' | 'mat_hang_vao_id' | 'dang_dung'>[], matHangVaoId: string): string | null {
  const ds = congThuc.filter(c => c.mat_hang_vao_id === matHangVaoId && c.dang_dung);
  return ds.length === 1 ? ds[0].id : null;
}

/**
 * Công thức đang dùng của tảng (chỉ công thức congThucId khi có) có phần cắt nào mang ô mã không — cùng cách
 * kho_giao_o_ma (0049) chọn phần cắt: phần cắt có ô VÀ mặt hàng phần cắt còn dùng (m.dang_dung; ngungDung là các mặt
 * hàng đã ngừng dùng). Không có thì KHÔNG gọi giao ô: món theo tảng không dùng ô mã, hay phần cắt mang ô đã ngừng dùng
 * mà công thức chưa sửa, không phải nhận câu đỏ "Chưa có phần cắt nào có ô mã".
 */
export function coOMaTrongCongThuc(
  congThuc: readonly Pick<CongThuc, 'id' | 'mat_hang_vao_id' | 'dang_dung' | 'dong'>[], matHangVaoId: string,
  congThucId: string | null, oMa: Map<string, readonly unknown[]>, ngungDung: { has(matHangId: string): boolean },
): boolean {
  return congThuc.some(c => c.mat_hang_vao_id === matHangVaoId && c.dang_dung && (congThucId === null || c.id === congThucId)
    && c.dong.some(d => (oMa.get(d.mat_hang_ra_id)?.length ?? 0) > 0 && !ngungDung.has(d.mat_hang_ra_id)));
}

/** moi: vừa mở · da_co: cùng ma_gui đã mở từ lần bấm trước · dang_do: tảng đang nằm trong một phiên nháp. */
export type CachLoc = 'moi' | 'da_co' | 'dang_do';

const CAU_LOC = {
  khongDoc: {
    vi: 'Không đọc được tảng, công thức hoặc ô mã — chưa mở phiên nào. Tải lại trang rồi bấm lại.',
    en: 'Could not read the primal, recipes or rotating codes — no session was opened. Reload the page and press again.',
  },
  khongDocPhien: {
    vi: 'Không đọc được phiên của lần bấm trước — tải lại trang rồi bấm lại.',
    en: 'Could not read the session from the previous press — reload the page and press again.',
  },
  khongCon: { vi: 'Tảng này không còn trong kho — tải lại trang.', en: 'This primal is no longer in stock — reload the page.' },
  khongSo: {
    vi: 'Lô này không có số tảng — mở phiên bằng nút loại tảng ở Pha lóc mới.',
    en: 'This lot has no primal number — open the session with the primal type button in New butchery session.',
  },
  khongChacGiao: {
    vi: 'Không chắc đã giao ô mã hay chưa — xem khung "Ô mã của tảng này": còn "Chưa giao ô mã" thì bấm "Giao ô mã cho phần cắt"; chưa thấy ô thì chưa in tem bằng phím ô.',
    en: 'It is not certain whether the rotating codes were assigned — check the "Rotating codes for this primal" box: if it still says "No rotating code assigned yet", press "Assign rotating codes to the cuts"; do not print with the slot keys until the codes appear.',
  },
  chonCongThuc: {
    vi: 'Tảng này có nhiều công thức: chọn công thức ở mục "Thêm: ngày pha, ghi chú, công thức", bấm Lưu rồi bấm "Giao ô mã cho phần cắt" — chưa giao ô thì chưa in tem bằng phím ô.',
    en: 'This primal has several recipes: choose one under "More: butchery date, note, recipe", press Save, then press "Assign rotating codes to the cuts" — do not print with the slot keys until the codes are assigned.',
  },
} satisfies Record<string, HaiThuTieng>;

/**
 * Câu báo của "Lóc #0142" — nói đúng việc đã xảy ra, không có chữ "thành công". Giao ô hỏng → ok FALSE (câu đỏ):
 * database từ chối → phiên đã mở nhưng CHƯA giao được ô mã; mất mạng hay lệnh giao ném (giaoKhongChac) → database có
 * thể đã giao xong mà phản hồi không về: KHÔNG CHẮC, xem khung ô mã. Cả hai: chưa thấy ô thì chưa in tem bằng phím ô.
 * Số kiểu Việt ("6,2 kg"), tiếng Anh "6.2 kg".
 */
export function cauLocTang(a: {
  soTang: number | null; kg: number; cach: CachLoc; soPhieu?: string; giao: KetQua | null; giaoKhongChac?: boolean; nhacChon?: boolean;
}): KetQua {
  const so = soTangChu(a.soTang);
  const sp = a.soPhieu ?? '';
  const dau: HaiThuTieng = a.cach === 'dang_do'
    ? { vi: `Tảng ${so} đang lóc dở ở phiên ${sp} — làm tiếp phiên này.`,
        en: `Primal ${so} is already being cut in session ${sp} — carry on with that session.` }
    : a.cach === 'da_co'
      ? { vi: `Phiên lóc tảng ${so} đã mở từ lần bấm trước.`, en: `The session for primal ${so} was already opened by the previous press.` }
      : { vi: `Đã mở phiên lóc tảng ${so} — lấy cả tảng (${dinhDangKg(a.kg, 'vi')} kg); lấy một phần thì sửa số kg ở mục Tảng đem pha.`,
          en: `Butchery session opened for primal ${so} — the whole primal (${dinhDangKg(a.kg, 'en')} kg); to cut only part of it, change the kg under Primal to cut.` };
  const g = a.giao;
  if (g && !g.ok && (a.giaoKhongChac || g.cau === LOI_KHO_CHUNG.mang.vi)) {
    return kqHai(false, { vi: `${dau.vi} ${CAU_LOC.khongChacGiao.vi}`, en: `${dau.en} ${CAU_LOC.khongChacGiao.en}` });
  }
  if (g && !g.ok) {
    const bo = (s: string) => s.trim().replace(/[\s.]+$/, '');
    return kqHai(false, {
      vi: `${dau.vi} Nhưng chưa giao được ô mã: ${bo(g.cau)}. Sửa xong bấm "Giao ô mã cho phần cắt" — chưa in tem bằng phím ô.`,
      en: `${dau.en} But the rotating codes are not assigned yet: ${bo(g.cauEn ?? dichCau('en', g.cau))}. Once fixed, press "Assign rotating codes to the cuts" — do not print with the slot keys yet.`,
    });
  }
  if (g) return { ok: true, cau: `${dau.vi} ${g.cau}`, cauEn: `${dau.en} ${g.cauEn ?? dichCau('en', g.cau)}` };
  if (a.nhacChon) return { ok: true, cau: `${dau.vi} ${CAU_LOC.chonCongThuc.vi}`, cauEn: `${dau.en} ${CAU_LOC.chonCongThuc.en}` };
  return kqHai(true, dau);
}

/** Mỗi lượt `.in(…)` không quá ngần này mã — như tang.ts (150 mã ≈ 5.500 ký tự trên đường dẫn). */
const MA_MOI_LUOT = 150;
function chiaLuotMa(ma: readonly unknown[]): string[][] {
  const ids = [...new Set(ma.filter(laUuid))];
  const luot: string[][] = [];
  for (let i = 0; i < ids.length; i += MA_MOI_LUOT) luot.push(ids.slice(i, i + MA_MOI_LUOT));
  return luot;
}

/**
 * Lô nào đang nằm trong phiên nháp nào (kho_phien_pha_vao — RLS: pha_loc, xem_gia). `phien`: phiên nháp đã đọc
 * (docDanhSachPhienPha … 'nhap'); một lô ở hai phiên thì lấy phiên đứng trước trong danh sách. Không có phiên nào →
 * Map rỗng, không gọi database. Đọc hỏng thì ném — trang tự bắt và không hiện nút nào.
 */
export async function docLoCuaPhien(
  client: SupabaseClient, phien: readonly Pick<PhienPhaTom, 'id' | 'so_phieu'>[],
): Promise<Map<string, { id: string; so_phieu: string }>> {
  const ra = new Map<string, { id: string; so_phieu: string }>();
  const luot = chiaLuotMa(phien.map(p => p.id));
  if (luot.length === 0) return ra;
  const kq = await Promise.all(luot.map(ds => client.from('kho_phien_pha_vao').select('phien_pha_id, lo_id').in('phien_pha_id', ds)));
  const loCua = new Map<string, Set<string>>();
  for (const { data, error } of kq) {
    if (error) throw error;
    for (const r of data ?? []) loCua.set(r.phien_pha_id as string, (loCua.get(r.phien_pha_id as string) ?? new Set()).add(r.lo_id as string));
  }
  for (const p of phien) {
    for (const lo of loCua.get(p.id) ?? []) if (!ra.has(lo)) ra.set(lo, { id: p.id, so_phieu: p.so_phieu });
  }
  return ra;
}

/**
 * Chỗ lóc được của ĐÚNG các lô đang hiện (kho_v_ton lọc theo lô, không đọc cả tồn chi nhánh) — cho nút "Lóc" ở
 * Tảng · ủ và cho locMotTang. Nhiều lô → vài lượt song song. Đọc hỏng thì ném.
 */
export async function docChoLocTang(client: SupabaseClient, chiNhanhId: string, loIds: readonly unknown[]): Promise<Map<string, ChoLoc[]>> {
  const kq = await Promise.all(chiaLuotMa(loIds).map(ds => client.from('kho_v_ton')
    .select('lo_id, vi_tri_id, loai_vi_tri, so_kg').eq('chi_nhanh_id', chiNhanhId).in('lo_id', ds)));
  const dong: Pick<DongTon, 'lo_id' | 'vi_tri_id' | 'loai_vi_tri' | 'so_kg'>[] = [];
  for (const { data, error } of kq) {
    if (error) throw error;
    for (const r of data ?? []) dong.push({ lo_id: r.lo_id, vi_tri_id: r.vi_tri_id, loai_vi_tri: r.loai_vi_tri, so_kg: Number(r.so_kg) });
  }
  return choLocTheoLo(dong);
}

type TangLoc = Pick<TangTon, 'lo_id' | 'so_tang' | 'mat_hang_id' | 'tinh_trang_u' | 'con_ngay_u'>;

/** Một tảng còn tồn của chi nhánh (kho_v_tang) — null khi lô không còn tồn, không phải tảng, hay của chi nhánh khác. */
async function docMotTang(client: SupabaseClient, chiNhanhId: string, loId: string): Promise<TangLoc | null> {
  const { data, error } = await client.from('kho_v_tang')
    .select('lo_id, so_tang, mat_hang_id, tinh_trang_u, con_ngay_u').eq('chi_nhanh_id', chiNhanhId).eq('lo_id', loId);
  if (error) throw error;
  const r = (data ?? [])[0];
  if (!r) return null;
  return {
    lo_id: r.lo_id, mat_hang_id: r.mat_hang_id, tinh_trang_u: r.tinh_trang_u,
    so_tang: r.so_tang === null || r.so_tang === undefined ? null : Number(r.so_tang),
    con_ngay_u: r.con_ngay_u === null || r.con_ngay_u === undefined ? null : Number(r.con_ngay_u),
  };
}

/** Mặt hàng đã ngừng dùng (kho_mat_hang.dang_dung = false) — kho_giao_o_ma bỏ qua phần cắt này. Đọc hỏng thì ném. */
async function docMatHangNgung(client: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await client.from('kho_mat_hang').select('id').eq('dang_dung', false);
  if (error) throw error;
  return new Set((data ?? []).map(r => r.id as string));
}

interface PhienLoc { id: string; so_phieu: string; cong_thuc_id: string | null }

/** Phiên NHÁP của chi nhánh đang có lô này (cũ nhất trước). Hai bảng, không join — đọc hỏng thì ném. */
async function docPhienNhapCuaLo(client: SupabaseClient, chiNhanhId: string, loId: string): Promise<PhienLoc[]> {
  const { data: vao, error: e1 } = await client.from('kho_phien_pha_vao').select('phien_pha_id').eq('lo_id', loId);
  if (e1) throw e1;
  const ids = [...new Set((vao ?? []).map(v => v.phien_pha_id as string))];
  if (ids.length === 0) return [];
  const { data, error } = await client.from('kho_phien_pha').select('id, so_phieu, cong_thuc_id, created_at')
    .in('id', ids).eq('chi_nhanh_id', chiNhanhId).eq('trang_thai', 'nhap').order('created_at');
  if (error) throw error;
  return (data ?? []).map(p => ({ id: p.id, so_phieu: p.so_phieu, cong_thuc_id: p.cong_thuc_id ?? null }));
}

/**
 * "Lóc #0142": mở phiên nháp với đúng lô đã bấm (mọi chỗ lóc được: kho lạnh, quầy — lấy cả tảng), gắn công thức khi
 * loại tảng có đúng một công thức đang dùng, rồi giao ô mã khi công thức đó có phần cắt mang ô. Trả id phiên khi phiên
 * đã mở — KỂ CẢ khi giao ô hỏng (ok false, câu đỏ): trang vào thẳng bước 2, nơi có nút "Giao ô mã cho phần cắt".
 *
 * Tự đọc lại tảng, chỗ lóc được, công thức, ô mã, mặt hàng ngừng dùng và phiên nháp của lô NGAY LÚC BẤM — không tin
 * danh sách trang đã đọc trước đó. Đọc hỏng bất kỳ lượt nào → không gọi hàm ghi nào, câu "Không đọc được … tải lại trang rồi bấm lại"
 * (không đoán "không có ô" rồi báo "xong", không mở phiên trùng).
 *
 * Bấm lại:
 *   · tảng đang nằm trong phiên nháp (bấm đúp, máy khác, trang tải lại) → trả phiên đó và GỌI LẠI giao ô (gọi lại
 *     không lấy thêm ô; lần trước giao hỏng thì lần này tự lành);
 *   · cùng ma_gui mà lần đọc không thấy phiên (hai lần bấm song song: lần sau đọc trước khi lần đầu ghi xong) →
 *     database trả phiên cũ (da_co) → đọc lại ĐÚNG phiên đó: còn nháp và có lô này thì đi tiếp như trên; đã huỷ / đã
 *     chốt (form cũ) → "Trang đã cũ", không giao ô.
 *
 * Nhiều công thức đang dùng mà phiên chưa chọn: KHÔNG tự giao — kho_giao_o_ma sẽ giao ô cho phần cắt của mọi công
 * thức và giữ tới lúc chốt. Câu báo nhắc chọn công thức rồi bấm "Giao ô mã cho phần cắt".
 *
 * Quyền: trang chỉ cho vai pha_loc; database tự kiểm lần nữa (kho_luu_phien_pha, kho_giao_o_ma — pha_loc của đúng
 * chi nhánh). Người khác đọc không thấy tảng (RLS) hoặc bị hàm từ chối — không có phiên nào được mở.
 */
export async function locMotTang(
  client: SupabaseClient, chiNhanhId: string, a: { maGui: string; loId: string },
): Promise<KetQua & { id?: string }> {
  if (!laUuid(a.maGui) || !laUuid(a.loId) || !laUuid(chiNhanhId)) return kqHai(false, CAU_PHA.trangCuChon);
  let tang: TangLoc | null, cho: Map<string, ChoLoc[]>, congThuc: CongThuc[], oMa: Map<string, unknown[]>, ngung: Set<string>;
  let dangDo: PhienLoc[];
  try {
    [tang, cho, congThuc, oMa, ngung, dangDo] = await Promise.all([
      docMotTang(client, chiNhanhId, a.loId), docChoLocTang(client, chiNhanhId, [a.loId]), docCongThuc(client),
      docOMa(client), docMatHangNgung(client), docPhienNhapCuaLo(client, chiNhanhId, a.loId),
    ]);
  } catch {
    return kqHai(false, CAU_LOC.khongDoc);
  }
  if (!tang) return kqHai(false, CAU_LOC.khongCon);
  if (tang.so_tang === null) return kqHai(false, CAU_LOC.khongSo);
  const t = tang;
  const so = soTangChu(t.so_tang);

  /** Phiên đã có (mới mở, mở từ lần bấm trước, hay đang lóc dở) → giao ô khi nên giao, rồi câu báo. */
  const xong = async (phien: PhienLoc, cach: CachLoc, kg: number): Promise<KetQua & { id: string }> => {
    const ds = congThuc.filter(c => c.mat_hang_vao_id === t.mat_hang_id && c.dang_dung);
    // Phiên đã gắn công thức: giao cho phần cắt của công thức đó. Chưa gắn mà loại tảng chỉ có một công thức: database
    // giao theo công thức đó. Nhiều công thức mà chưa chọn: không tự giao (xem chú thích hàm).
    const theoCt = phien.cong_thuc_id ?? (ds.length === 1 ? ds[0].id : null);
    let giao: KetQua | null = null;
    let giaoKhongChac = false;
    if (theoCt && coOMaTrongCongThuc(congThuc, t.mat_hang_id, theoCt, oMa, ngung)) {
      // Ném (mạng đứt sau khi đã gửi): database có thể đã giao — câu "không chắc", không nói "chưa giao được".
      try { giao = await giaoOMa(client, phien.id); } catch (e) { giao = kqLoi(e); giaoKhongChac = true; }
    }
    const nhacChon = !theoCt && ds.length > 1 && coOMaTrongCongThuc(congThuc, t.mat_hang_id, null, oMa, ngung);
    return { ...cauLocTang({ soTang: t.so_tang, kg, cach, soPhieu: phien.so_phieu, giao, giaoKhongChac, nhacChon }), id: phien.id };
  };

  if (dangDo.length > 0) return xong(dangDo[0], 'dang_do', 0);
  if (t.tinh_trang_u === 'dang_u') {
    const [vi, en] = [cauConU(t, 'vi'), cauConU(t, 'en')];
    return kqHai(false, {
      vi: `Tảng ${so} còn đang ủ${vi ? ` (${vi})` : ''} — lóc sớm thì bấm loại tảng ở Pha lóc mới.`,
      en: `Primal ${so} is still aging${en ? ` (${en})` : ''} — to cut it early, press the primal type in New butchery session.`,
    });
  }
  const vao = vaoCuaTang(cho, a.loId);
  if (vao.length === 0) {
    return kqHai(false, {
      vi: `Tảng ${so} đang chờ huỷ hoặc đang mang ra quầy — không đem lóc được.`,
      en: `Primal ${so} is waiting for write-off or on its way to the counter — it cannot be cut.`,
    });
  }

  const ct = congThucMot(congThuc, t.mat_hang_id);
  let tao: Awaited<ReturnType<typeof taoPhienPha>>;
  try {
    tao = await taoPhienPha(client, chiNhanhId, a.maGui, t.mat_hang_id, ct, vao);
  } catch {
    // Mạng đứt sau khi đã gửi: database có thể đã ghi — không nói "chưa mở".
    return kqHai(false, CAU_PHA.khongChacMo);
  }
  if (!tao.ok || !tao.id) return tao;
  if (!tao.daCo) return xong({ id: tao.id, so_phieu: '', cong_thuc_id: ct }, 'moi', kgCong(cho.get(a.loId) ?? []));

  let doc: Awaited<ReturnType<typeof docPhienPha>>;
  try {
    doc = await docPhienPha(client, tao.id);
  } catch {
    return kqHai(false, CAU_LOC.khongDocPhien);
  }
  if (!doc || doc.phien.trang_thai !== 'nhap' || !doc.vao.some(v => v.lo_id === a.loId)) return kqHai(false, CAU_PHA.trangCuChon);
  return xong({ id: doc.phien.id, so_phieu: doc.phien.so_phieu, cong_thuc_id: doc.phien.cong_thuc_id }, 'da_co', 0);
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
        don_vi_goi: m?.don_vi_goi ?? GOI_MAC_DINH.vi,
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

export const TEN_NGUON_DU_KIEN_NB: Record<string, HaiThuTieng> = {
  cong_thuc: { vi: 'theo công thức', en: 'from the recipe' },
  tb_30_ngay: { vi: 'trung bình 30 ngày', en: '30-day average' },
};
/** Bảng tên cũ (chỉ tiếng Việt), dựng từ bản hai thứ tiếng. */
export const TEN_NGUON_DU_KIEN: Record<string, string> = Object.fromEntries(
  Object.entries(TEN_NGUON_DU_KIEN_NB).map(([k, v]) => [k, v.vi]),
);

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
 * donVi / donViQuay = đơn vị đếm chung của các lô đó ("khay") cho câu "Chuyển 18 khay ra quầy ngay" /
 * "5 khay đã để thẳng ở quầy"; các món khác đơn vị → null, câu dùng chữ chung "gói".
 */
export function goiRaQuay(
  ra: Pick<DauRa, 'lo_id'>[], ton: DongTon[],
): { lo: GoiRaQuay[]; tongGoi: number; daOQuay: number; donVi: string | null; donViQuay: string | null } {
  const cuaPhien = new Set(ra.map(r => r.lo_id).filter((x): x is string => !!x));
  const lo: GoiRaQuay[] = [];
  const oQuay: DongTon[] = [];
  let daOQuay = 0;
  for (const t of ton) {
    if (!cuaPhien.has(t.lo_id) || t.so_kg <= 0) continue;
    if (t.loai_vi_tri === 'quay') { daOQuay += Number(t.so_goi) || 0; oQuay.push(t); continue; }
    if (t.loai_vi_tri !== 'kho') continue;
    lo.push({
      lo_id: t.lo_id, vi_tri_id: t.vi_tri_id, ten: t.ten_hang, so_goi: Number(t.so_goi) || 0, so_kg: t.so_kg,
      don_vi_goi: t.don_vi_goi, dem_goi: t.dem_goi,
      link: `/noi-bo/kho/xuat/moi?loai=chuyen&tu=${encodeURIComponent(t.vi_tri_id)}&lo=${encodeURIComponent(t.lo_id)}`,
    });
  }
  return { lo, tongGoi: lo.reduce((s, l) => s + l.so_goi, 0), daOQuay, donVi: donViChung(lo), donViQuay: donViChung(oQuay) };
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
