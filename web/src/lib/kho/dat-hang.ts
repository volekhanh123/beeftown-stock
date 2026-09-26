/**
 * KHO — ĐẶT HÀNG NHÀ CUNG CẤP · GỢI Ý · NHẬN THEO ĐƠN · ĐÁNH GIÁ NCC (GĐ8a, migration 0039)
 *
 *   /noi-bo/kho/dat-hang            danh sách đơn (tìm / ngày / của tôi / trang như GĐ4b)
 *   /noi-bo/kho/dat-hang/moi        chọn NCC → bảng gợi ý có sẵn số kg, sửa được, thêm món
 *   /noi-bo/kho/dat-hang/<id>       xem / sửa nháp, Gửi, Hủy, "Nhận hàng theo đơn này"
 *   /noi-bo/kho/dat-hang/<id>/in    bản in A4 · Lưu PDF · Chia sẻ (public/kho/js/in-an.js)
 *   /noi-bo/kho/bao-cao/ncc         đánh giá nhà cung cấp (+ CSV bao-cao/ncc.csv)
 *
 * AI LÀM GÌ (database mới là nơi chặn — xem đầu 0039):
 *   · lập / sửa đơn NHÁP: quyền nhap (chủ, quản lý, thủ kho);
 *   · điền giá dự kiến: nhap + xem_gia (thủ kho gửi ô giá là database từ chối —
 *     nên file này KHÔNG BAO GIỜ gửi khóa don_gia_du_kien khi không xem giá);
 *   · gửi đơn: nhap + duyet_nhap (chủ, quản lý); hủy đơn đã gửi: cùng quyền đó;
 *   · kế toán chỉ xem (có tiền).
 *
 * THỦ KHO KHÔNG THẤY TIỀN: danh sách, đơn, gợi ý đọc bằng các hàm "_kg" / không
 * tiền (kho_ds_don_dat_kg, kho_doc_don_dat_kg, kho_goi_y_dat_hang). Giá dự kiến
 * đọc thẳng bảng kho_don_dat_dong / view kho_v_don_dat — RLS chỉ cho vai xem giá,
 * và trang chỉ gọi khi k.duoc('xem_gia').
 *
 * Hàm thuần (đọc form, câu chữ, cột báo cáo) ở nửa đầu — test bằng Node trong
 * crm/test/test-kho-dat-hang-web.mjs.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  cauLoiKho, dinhDangKg, dinhDangNgay, docKg, docNgay, docSoNguyen, docTien, laUuid, type KetQua,
} from './chung.ts';
import type { CotBaoCao, DinhNghiaBaoCao } from './bao-cao.ts';
import { CO_TRANG, type TimDs } from './tim-ds.ts';

// -----------------------------------------------------------------------------
// KIỂU — đúng các khóa hàm 0039 trả về
// -----------------------------------------------------------------------------
export type TrangThaiDon = 'nhap' | 'da_gui' | 'nhan_mot_phan' | 'da_nhan' | 'huy';

export interface DonDatTom {
  id: string;
  so_phieu: string;
  trang_thai: TrangThaiDon;
  nha_cung_cap_id: string;
  ten_nha_cung_cap: string;
  ngay_dat: string;
  ngay_giao_du_kien: string;
  so_dong: number;
  tong_kg_dat: number;
  tong_kg_da_nhan: number;
  tre_hen: boolean;
  nguoi_lap: string | null;
  ten_nguoi_lap: string | null;
  gui_luc: string | null;
  created_at: string;
}

export interface DongDonDat {
  id: string;
  thu_tu: number;
  mat_hang_id: string;
  ma: string;
  ten_mat_hang: string;
  dem_goi: boolean;
  don_vi_goi: string;
  so_kg_dat: number;
  so_goi_dat: number | null;
  so_kg_da_nhan: number;
  so_kg_con_lai: number;
  /** Dòng đã đủ: nhận ≥ 95% kg đặt hoặc đủ số gói (0039). */
  du: boolean;
}

export interface PhieuCuaDon {
  id: string;
  so_phieu: string;
  trang_thai: string;
  ngay_nhap: string;
  tong_kg: number;
}

export interface DonDat {
  id: string;
  so_phieu: string;
  trang_thai: TrangThaiDon;
  phien_ban: number;
  nha_cung_cap_id: string;
  ten_nha_cung_cap: string | null;
  ngay_dat: string;
  ngay_giao_du_kien: string;
  tre_hen: boolean;
  ghi_chu: string | null;
  nguoi_lap: string | null;
  ten_nguoi_lap: string | null;
  gui_luc: string | null;
  gui_boi: string | null;
  ten_nguoi_gui: string | null;
  huy_luc: string | null;
  ly_do_huy: string | null;
  created_at: string;
  dong: DongDonDat[];
  phieu: PhieuCuaDon[];
}

/** Một dòng kho_goi_y_dat_hang — không có tiền. */
export interface GoiYDat {
  mat_hang_id: string;
  ma: string;
  ten: string;
  loai: string;
  dem_goi: boolean;
  don_vi_goi: string;
  nha_cung_cap_id: string | null;
  so_ngay_giao: number;
  ton_kg: number;
  dang_chuyen_kg: number;
  dang_dat_kg: number;
  dung_28_ngay_kg: number;
  dung_tb_ngay_kg: number;
  kho_toi_thieu_kg: number | null;
  kho_toi_da_kg: number | null;
  muc_can_kg: number;
  de_nghi_kg: number;
  de_nghi_goi: number | null;
  duoi_toi_thieu: boolean;
  ly_do: string;
}

/** Một dòng kho_bao_cao_ncc. Ba cột tiền / công nợ là null với vai không xem giá. */
export interface DongDanhGiaNcc {
  nha_cung_cap_id: string;
  ten: string;
  so_phieu: number;
  tong_kg: number;
  gia_tb_kg: number | null;
  thu_hoi_tb_pt: number | null;
  so_phien_pha: number;
  kg_tra: number;
  so_lan_lech_hoa_don: number | null;
  so_ngay_tra_tb: number | null;
  so_don: number;
  so_don_thieu: number;
  kg_thieu: number;
  so_don_tre: number;
  diem_sao: number | null;
}

/** Một dòng gửi vào p_dong của kho_luu_don_dat. */
export interface DongGuiDat {
  mat_hang_id: string;
  so_kg_dat: number;
  so_goi_dat: number | null;
  /** CHỈ có khi người lập xem được giá (không có khóa = giữ giá cũ). */
  don_gia_du_kien?: number | null;
}

// -----------------------------------------------------------------------------
// CHỮ HIỂN THỊ
// -----------------------------------------------------------------------------
/** Trạng thái đơn → [nhãn, lớp CSS của nb-nhan]. */
export const TRANG_THAI_DON: Record<TrangThaiDon, [string, string]> = {
  nhap: ['Nháp', 'nhap'],
  da_gui: ['Đã gửi, chờ hàng', 'cho'],
  nhan_mot_phan: ['Nhận một phần', 'cho'],
  da_nhan: ['Đã nhận đủ', 'song'],
  huy: ['Đã hủy', 'tat'],
};

export function nhanTrangThaiDon(tt: string): [string, string] {
  return TRANG_THAI_DON[tt as TrangThaiDon] ?? [tt, 'tat'];
}

/** Chip lọc danh sách. 'dang_cho' = đã gửi hoặc nhận một phần (database hiểu khóa này). */
export const LOC_DON: readonly (readonly [string, string])[] = [
  ['', 'Tất cả'], ['nhap', 'Nháp'], ['dang_cho', 'Chờ hàng về'], ['da_nhan', 'Đã nhận đủ'], ['huy', 'Đã hủy'],
];

export function docLocDon(v: string | null | undefined): string {
  return LOC_DON.some(([k]) => k === v) ? String(v) : '';
}

/** Thứ giao hàng của NCC (isodow: 1 = Thứ Hai … 7 = Chủ nhật). */
export const THU_TRONG_TUAN: readonly (readonly [number, string])[] = [
  [1, 'T2'], [2, 'T3'], [3, 'T4'], [4, 'T5'], [5, 'T6'], [6, 'T7'], [7, 'CN'],
];

/** "Giao T2, T5" / "Giao mọi ngày". */
export function chuThuGiao(ds: number[] | null | undefined): string {
  if (!ds || ds.length === 0) return 'Giao mọi ngày';
  const ten = THU_TRONG_TUAN.filter(([n]) => ds.includes(n)).map(([, t]) => t);
  return `Giao ${ten.join(', ')}`;
}

/** Số kg gợi ý điền sẵn vào ô: "12,5"; không cần đặt → ''. */
export function oKgGoiY(g: Pick<GoiYDat, 'de_nghi_kg'>): string {
  const n = Number(g.de_nghi_kg);
  return n > 0 ? String(Math.round(n * 1000) / 1000).replace('.', ',') : '';
}

/** Số gói gợi ý điền sẵn (chỉ món đếm gói và có số kg / gói). */
export function oGoiGoiY(g: Pick<GoiYDat, 'dem_goi' | 'de_nghi_goi'>): string {
  return g.dem_goi && g.de_nghi_goi && g.de_nghi_goi > 0 ? String(g.de_nghi_goi) : '';
}

/** Tiến độ nhận của một dòng đơn: "Đã nhận 11,6 / 12 kg" (không phần trăm — thịt cân lẻ). */
export function chuDaNhan(d: Pick<DongDonDat, 'so_kg_dat' | 'so_kg_da_nhan'>): string {
  return `${dinhDangKg(d.so_kg_da_nhan)} / ${dinhDangKg(d.so_kg_dat)} kg`;
}

/** Sao đánh giá: 4.5 → "★★★★½" (null → "chưa đủ số liệu"). */
export function chuSao(diem: number | null | undefined): string {
  if (diem === null || diem === undefined || !Number.isFinite(Number(diem))) return 'chưa đủ số liệu';
  const d = Math.max(0, Math.min(5, Math.round(Number(diem) * 2) / 2));
  return '★'.repeat(Math.floor(d)) + (d % 1 ? '½' : '') + '☆'.repeat(5 - Math.ceil(d));
}

/** Màu sao: ≥ 4 xanh, ≥ 3 vàng, còn lại đỏ. */
export function mucSao(diem: number | null | undefined): 'xanh' | 'vang' | 'do' | 'xam' {
  if (diem === null || diem === undefined) return 'xam';
  const d = Number(diem);
  return d >= 4 ? 'xanh' : d >= 3 ? 'vang' : 'do';
}

/**
 * Nội dung tin nhắn gửi NCC (Zalo): chép dán được, không cần mở PDF. Chỉ kèm
 * giá khi người xem được giá VÀ chọn "in kèm giá" (trang quyết định `gia`).
 */
export function tinNhanDon(
  don: Pick<DonDat, 'so_phieu' | 'ngay_giao_du_kien' | 'ghi_chu' | 'ten_nha_cung_cap' | 'dong'>,
  o: { chiNhanh?: string | null; gia?: Map<string, number | null> | null } = {},
): string {
  const dong = don.dong.map((d, i) => {
    const goi = d.so_goi_dat ? ` (${d.so_goi_dat} ${d.don_vi_goi || 'gói'})` : '';
    const g = o.gia?.get(d.mat_hang_id);
    const gia = o.gia && g !== null && g !== undefined ? ` · ${Math.round(g).toLocaleString('vi-VN')} đ/kg` : '';
    return `${i + 1}. ${d.ten_mat_hang}: ${dinhDangKg(d.so_kg_dat)} kg${goi}${gia}`;
  });
  return [
    `BEEFTOWN${o.chiNhanh ? ` ${o.chiNhanh}` : ''} đặt hàng — đơn ${don.so_phieu}`,
    don.ten_nha_cung_cap ? `Gửi: ${don.ten_nha_cung_cap}` : '',
    `Ngày giao: ${dinhDangNgay(don.ngay_giao_du_kien)}`,
    ...dong,
    don.ghi_chu ? `Ghi chú: ${don.ghi_chu}` : '',
    'Nhờ anh/chị xác nhận giúp. Cảm ơn!',
  ].filter(Boolean).join('\n');
}

// -----------------------------------------------------------------------------
// ĐỌC FORM ĐƠN (hàm thuần)
// -----------------------------------------------------------------------------
// Một form cho cả "Lập đơn" và "Sửa nháp":
//   · dòng có sẵn (gợi ý, hoặc dòng đang có của đơn): ô ẩn `mh` lặp lại theo thứ
//     tự, mỗi món ô `kg_<id>`, `goi_<id>`, `gia_<id>` (giá chỉ khi xem giá);
//   · dòng thêm: `t<i>_mh`, `t<i>_kg`, `t<i>_goi`, `t<i>_gia`, số dòng ở `so_dong`.
// Ô kg trống hoặc 0 = không đặt món đó. Giá trống = chưa có giá (null).

export interface MonDat { ten: string; dem_goi: boolean; don_vi_goi: string }

export interface DongDatForm { mh: string; kg: string; goi: string; gia: string }

export interface FormDonDat {
  /** Dòng có sẵn: chữ đã gõ theo mặt hàng (điền lại khi báo lỗi). */
  co: Map<string, DongDatForm>;
  /** Dòng thêm, đúng thứ tự trên form. */
  them: DongDatForm[];
  ngayGiao: string;
  ghiChu: string;
}

type Form = { get(ten: string): unknown; getAll?(ten: string): unknown[] };

export const TOI_DA_DONG_THEM = 30;

export function soDongThem(form: Form | null | undefined, macDinh = 3): number {
  const n = Number(form?.get('so_dong') ?? NaN);
  return Number.isInteger(n) && n >= 1 && n <= TOI_DA_DONG_THEM ? n : macDinh;
}

/** Chữ đã gõ trên form (để điền lại), không kiểm gì. */
export function chuFormDonDat(form: Form, soDong: number): FormDonDat {
  const s = (t: string) => String(form.get(t) ?? '').trim();
  const co = new Map<string, DongDatForm>();
  for (const mh of (form.getAll?.('mh') ?? []).map(String)) {
    if (!laUuid(mh) || co.has(mh)) continue;
    co.set(mh, { mh, kg: s(`kg_${mh}`), goi: s(`goi_${mh}`), gia: s(`gia_${mh}`) });
  }
  const them = Array.from({ length: soDong }, (_, i) => ({
    mh: s(`t${i}_mh`), kg: s(`t${i}_kg`), goi: s(`t${i}_goi`), gia: s(`t${i}_gia`),
  }));
  return { co, them, ngayGiao: s('ngay_giao'), ghiChu: s('ghi_chu').slice(0, 500) };
}

/**
 * Đọc form đơn thành p_dong. `coGia`: người lập xem được giá → mọi dòng có khóa
 * don_gia_du_kien (trống = null). Không xem giá → không dòng nào có khóa đó.
 */
export function docFormDonDat(
  form: Form, mon: Map<string, MonDat>, o: { coGia: boolean; soDong: number },
): { chu: FormDonDat; dong: DongGuiDat[]; ngayGiao: string | null; loi: string[] } {
  const chu = chuFormDonDat(form, o.soDong);
  const loi: string[] = [];
  const dong: DongGuiDat[] = [];
  const daCo = new Set<string>();
  const doc = (d: DongDatForm, nhan: string | null) => {
    if (!d.mh && !d.kg && !d.goi && !d.gia) return;
    const m = laUuid(d.mh) ? mon.get(d.mh) : undefined;
    if (!m) {
      if (d.kg || d.goi) loi.push(nhan ? `${nhan}: chọn món` : 'Có món đã ngừng dùng — bỏ số kg của món đó');
      return;
    }
    const ten = nhan ? `${nhan} (${m.ten})` : m.ten;
    const kg = docKg(d.kg);
    const goi = docSoNguyen(d.goi, 1, 100000);
    if (kg === null || kg === 0) {
      if (d.goi && d.goi !== '0') loi.push(`${ten}: ghi số kg đặt`);
      return;   // không đặt món này
    }
    if (Number.isNaN(kg) || kg < 0) { loi.push(`${ten}: số kg chưa đúng (ví dụ 12,5)`); return; }
    if (Number.isNaN(goi)) { loi.push(`${ten}: số ${m.don_vi_goi || 'gói'} là số nguyên lớn hơn 0`); return; }
    if (daCo.has(d.mh)) { loi.push(`${ten}: món này đã có ở dòng trên — gộp lại một dòng`); return; }
    const ra: DongGuiDat = { mat_hang_id: d.mh, so_kg_dat: kg, so_goi_dat: goi };
    if (o.coGia) {
      const gia = docTien(d.gia);
      if (Number.isNaN(gia)) { loi.push(`${ten}: giá dự kiến là số đồng, ví dụ 480.000`); return; }
      ra.don_gia_du_kien = gia;
    }
    daCo.add(d.mh);
    dong.push(ra);
  };
  for (const d of chu.co.values()) doc(d, null);
  chu.them.forEach((d, i) => doc(d, `Dòng thêm ${i + 1}`));

  const ngay = docNgay(chu.ngayGiao);
  if (ngay === undefined) loi.push('Ngày giao không phải ngày có thật');
  if (dong.length === 0 && loi.length === 0) loi.push('Đơn chưa có món nào — ghi số kg cho ít nhất một món');
  return { chu, dong, ngayGiao: ngay ?? null, loi };
}

/** Dòng đơn đang có → chữ điền vào form sửa (giá lấy từ bảng giá riêng, chỉ vai xem giá). */
export function formTuDon(
  d: Pick<DongDonDat, 'mat_hang_id' | 'so_kg_dat' | 'so_goi_dat'>, gia?: number | null,
): DongDatForm {
  return {
    mh: d.mat_hang_id,
    kg: String(d.so_kg_dat).replace('.', ','),
    goi: d.so_goi_dat ? String(d.so_goi_dat) : '',
    gia: gia !== null && gia !== undefined ? Math.round(gia).toLocaleString('vi-VN') : '',
  };
}

// -----------------------------------------------------------------------------
// ĐÁNH GIÁ NCC — cột bảng và CSV (hàm thuần)
// -----------------------------------------------------------------------------
export function cotDanhGiaNcc(coGia: boolean): CotBaoCao[] {
  return [
    { khoa: 'ten', ten: 'Nhà cung cấp', kieu: 'chu' },
    { khoa: 'diem_sao', ten: 'Điểm (1–5 sao)', kieu: 'pt' },
    { khoa: 'so_phieu', ten: 'Số lần giao', kieu: 'so' },
    { khoa: 'tong_kg', ten: 'Kg nhận', kieu: 'kg' },
    ...(coGia ? [{ khoa: 'gia_tb_kg', ten: 'Giá TB/kg', kieu: 'tien' as const, tienMat: true }] : []),
    { khoa: 'so_don', ten: 'Số đơn đặt', kieu: 'so' },
    { khoa: 'so_don_thieu', ten: 'Đơn giao thiếu', kieu: 'so' },
    { khoa: 'kg_thieu', ten: 'Kg thiếu', kieu: 'kg' },
    { khoa: 'so_don_tre', ten: 'Đơn giao trễ', kieu: 'so' },
    { khoa: 'thu_hoi_tb_pt', ten: 'Thu hồi pha lóc TB %', kieu: 'pt' },
    { khoa: 'so_phien_pha', ten: 'Số phiên pha', kieu: 'so' },
    { khoa: 'kg_tra', ten: 'Kg trả lại', kieu: 'kg' },
    ...(coGia ? [
      { khoa: 'so_lan_lech_hoa_don', ten: 'Lần lệch hóa đơn', kieu: 'so' as const, tienMat: true },
      { khoa: 'so_ngay_tra_tb', ten: 'Ngày trả tiền TB', kieu: 'pt' as const, tienMat: true },
    ] : []),
  ];
}

export function dinhNghiaDanhGiaNcc(coGia: boolean): DinhNghiaBaoCao {
  return {
    ten: 'Đánh giá nhà cung cấp',
    moTa: 'Theo phiếu nhận hàng đã duyệt trong kỳ và đơn đặt có ngày giao trong kỳ.',
    cot: cotDanhGiaNcc(coGia),
    cong: ['so_phieu', 'tong_kg', 'so_don', 'so_don_thieu', 'kg_thieu', 'so_don_tre', 'kg_tra'],
    khiTrong: {
      cau: 'Kỳ này chưa có phiếu nhận hàng đã duyệt hay đơn đặt hàng nào',
      link: [{ ten: 'Đặt hàng', href: '/noi-bo/kho/dat-hang' }],
    },
  };
}

/** Công thức điểm sao, nói bằng lời (khớp comment kho_bao_cao_ncc, 0039). */
export const CONG_THUC_SAO =
  'Bắt đầu 5 sao, trừ: 2 × tỉ lệ đơn giao thiếu, 1 × tỉ lệ đơn giao trễ, 1 × tỉ lệ phiếu lệch hóa đơn, '
  + 'và tối đa 1 sao theo kg trả lại (trả 10% số kg nhận là trừ đủ 1 sao). Thấp nhất 1 sao, làm tròn nửa sao.';

// -----------------------------------------------------------------------------
// ĐỌC DATABASE
// -----------------------------------------------------------------------------
const so = (v: unknown) => Number(v ?? 0);
const soHoacNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** Danh sách đơn, chỉ kg. Đọc CO_TRANG + 1 dòng (catTrang cắt lại, biết còn trang sau). */
export async function docDsDonDat(
  client: SupabaseClient, chiNhanhId: string, trangThai: string | null, tim: TimDs,
  o: { nccId?: string | null; gioiHan?: number } = {},
): Promise<DonDatTom[]> {
  const { data, error } = await client.rpc('kho_ds_don_dat_kg', {
    p_chi_nhanh_id: chiNhanhId,
    p_trang_thai: trangThai,
    p_nha_cung_cap_id: o.nccId ?? null,
    p_q: tim.q || null,
    p_tu: tim.tu,
    p_den: tim.den,
    p_cua_toi: tim.cuaToi,
    p_gioi_han: o.gioiHan ?? CO_TRANG + 1,
    p_bo_qua: (tim.trang - 1) * CO_TRANG,
  });
  if (error) throw error;
  return ((data ?? []) as DonDatTom[]).map(r => ({
    ...r, so_dong: so(r.so_dong), tong_kg_dat: so(r.tong_kg_dat), tong_kg_da_nhan: so(r.tong_kg_da_nhan),
  }));
}

/** Đơn đang chờ hàng về (đã gửi / nhận một phần) — cho màn nhận hàng. Lỗi → rỗng. */
export async function docDonChoNhan(client: SupabaseClient, chiNhanhId: string): Promise<DonDatTom[]> {
  try {
    return await docDsDonDat(client, chiNhanhId, 'dang_cho',
      { q: '', tu: null, den: null, cuaToi: false, trang: 1 }, { gioiHan: 30 });
  } catch {
    return [];
  }
}

/** Một đơn, chỉ kg. Không có / không được xem → null. */
export async function docDonDat(client: SupabaseClient, id: string): Promise<DonDat | null> {
  if (!laUuid(id)) return null;
  const { data, error } = await client.rpc('kho_doc_don_dat_kg', { p_id: id });
  if (error) {
    if (/Không tìm thấy đơn đặt hàng/.test(error.message ?? '')) return null;
    throw error;
  }
  if (!data || typeof data !== 'object') return null;
  const d = data as DonDat;
  return {
    ...d,
    dong: (d.dong ?? []).map(x => ({
      ...x, so_kg_dat: so(x.so_kg_dat), so_goi_dat: soHoacNull(x.so_goi_dat),
      so_kg_da_nhan: so(x.so_kg_da_nhan), so_kg_con_lai: so(x.so_kg_con_lai), du: x.du === true,
    })),
    phieu: (d.phieu ?? []).map(p => ({ ...p, tong_kg: so(p.tong_kg) })),
  };
}

/** Đơn giá dự kiến theo mặt hàng — CHỈ gọi khi xem giá (RLS trả rỗng cho vai khác). */
export async function docGiaDonDat(client: SupabaseClient, donId: string): Promise<Map<string, number | null>> {
  const { data, error } = await client
    .from('kho_don_dat_dong').select('mat_hang_id, don_gia_du_kien').eq('don_dat_id', donId);
  if (error) throw error;
  return new Map((data ?? []).map(r => [String(r.mat_hang_id), soHoacNull(r.don_gia_du_kien)]));
}

/** Tổng tiền dự kiến của vài đơn (danh sách, vai xem giá). Lỗi → Map rỗng. */
export async function docTienDuKien(client: SupabaseClient, ids: string[]): Promise<Map<string, number | null>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await client.from('kho_v_don_dat').select('id, tong_tien_du_kien').in('id', ids);
  if (error) return new Map();
  return new Map((data ?? []).map(r => [String(r.id), soHoacNull(r.tong_tien_du_kien)]));
}

/** Gợi ý đặt hàng của một NCC (không tiền). */
export async function docGoiYDatHang(client: SupabaseClient, chiNhanhId: string, nccId: string): Promise<GoiYDat[]> {
  const { data, error } = await client.rpc('kho_goi_y_dat_hang', { p_chi_nhanh_id: chiNhanhId, p_ncc: nccId });
  if (error) throw error;
  return ((data ?? []) as GoiYDat[]).map(g => ({
    ...g,
    so_ngay_giao: so(g.so_ngay_giao), ton_kg: so(g.ton_kg), dang_chuyen_kg: so(g.dang_chuyen_kg),
    dang_dat_kg: so(g.dang_dat_kg), dung_28_ngay_kg: so(g.dung_28_ngay_kg), dung_tb_ngay_kg: so(g.dung_tb_ngay_kg),
    kho_toi_thieu_kg: soHoacNull(g.kho_toi_thieu_kg), kho_toi_da_kg: soHoacNull(g.kho_toi_da_kg),
    muc_can_kg: so(g.muc_can_kg), de_nghi_kg: so(g.de_nghi_kg), de_nghi_goi: soHoacNull(g.de_nghi_goi),
  }));
}

/** Đánh giá NCC trong kỳ. */
export async function docDanhGiaNcc(
  client: SupabaseClient, chiNhanhId: string, tu: string, den: string,
): Promise<{ dong: DongDanhGiaNcc[]; loi: string | null }> {
  const { data, error } = await client.rpc('kho_bao_cao_ncc', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
  if (error) return { dong: [], loi: cauLoiKho(error) };
  const dong = ((data ?? []) as DongDanhGiaNcc[]).map(r => ({
    ...r,
    so_phieu: so(r.so_phieu), tong_kg: so(r.tong_kg), gia_tb_kg: soHoacNull(r.gia_tb_kg),
    thu_hoi_tb_pt: soHoacNull(r.thu_hoi_tb_pt), so_phien_pha: so(r.so_phien_pha), kg_tra: so(r.kg_tra),
    so_lan_lech_hoa_don: soHoacNull(r.so_lan_lech_hoa_don), so_ngay_tra_tb: soHoacNull(r.so_ngay_tra_tb),
    so_don: so(r.so_don), so_don_thieu: so(r.so_don_thieu), kg_thieu: so(r.kg_thieu), so_don_tre: so(r.so_don_tre),
    diem_sao: soHoacNull(r.diem_sao),
  }));
  return { dong, loi: null };
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
export interface KetQuaLuuDon extends KetQua { id?: string; phienBan?: number }

/** Lập (id null) hoặc sửa đơn nháp. */
export async function luuDonDat(
  client: SupabaseClient, chiNhanhId: string,
  v: { id: string | null; maGui: string; phienBan: number | null; nccId: string; ngayGiao: string | null;
       ghiChu: string; dong: DongGuiDat[] },
): Promise<KetQuaLuuDon> {
  const { data, error } = await client.rpc('kho_luu_don_dat', {
    p_id: v.id,
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: laUuid(v.maGui) ? v.maGui : crypto.randomUUID(),
    p_phien_ban: v.phienBan,
    p_ncc: v.nccId,
    p_ngay_giao: v.ngayGiao,
    p_ghi_chu: v.ghiChu || null,
    p_dong: v.dong,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (Array.isArray(data) ? data[0] : data) as { don_id: string; phien_ban_moi: number; da_co: boolean } | undefined;
  if (!kq) return { ok: false, cau: 'Không chắc đã lưu hay chưa — mở danh sách Đặt hàng để kiểm tra.' };
  return {
    ok: true, id: kq.don_id, phienBan: Number(kq.phien_ban_moi),
    cau: kq.da_co ? 'Đơn này đã được lưu từ lần bấm trước.' : v.id ? 'Đã lưu đơn.' : 'Đã lập đơn nháp.',
  };
}

async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: String(data ?? 'Xong.') };
}

export function guiDonDat(client: SupabaseClient, id: string, phienBan: number) {
  return cauTraVe(client.rpc('kho_gui_don_dat', { p_id: id, p_phien_ban: phienBan }));
}

export function huyDonDat(client: SupabaseClient, id: string, lyDo: string | null) {
  return cauTraVe(client.rpc('kho_huy_don_dat', { p_id: id, p_ly_do: lyDo }));
}

/** "Nhận hàng theo đơn này": phiếu nhận hàng nháp điền sẵn món / kg còn thiếu. */
export async function taoPhieuTuDon(client: SupabaseClient, donId: string, maGui: string): Promise<KetQuaLuuDon> {
  const { data, error } = await client.rpc('kho_tao_phieu_nhap_tu_don', {
    p_don_id: donId, p_ma_gui: laUuid(maGui) ? maGui : crypto.randomUUID(),
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  if (!laUuid(data)) return { ok: false, cau: 'Không chắc đã tạo phiếu — mở danh sách Nhận hàng để kiểm tra.' };
  return {
    ok: true, id: data,
    cau: 'Phiếu nhận hàng đã điền sẵn món và số kg còn thiếu của đơn. Cân lại, sửa số cho đúng, chụp hóa đơn rồi gửi.',
  };
}

/** Mức tối thiểu / tối đa ở kho lạnh (kg) của một mặt hàng (danh_muc). null = bỏ mức. */
export function luuMucDatHang(client: SupabaseClient, matHangId: string, toiThieu: number | null, toiDa: number | null) {
  return cauTraVe(client.rpc('kho_luu_muc_dat_hang', {
    p_mat_hang_id: matHangId, p_kho_toi_thieu_kg: toiThieu, p_kho_toi_da_kg: toiDa,
  }));
}
