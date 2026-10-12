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
 *
 * HAI THỨ TIẾNG: bảng nhãn có bản `…_NB` ({ vi, en }), bảng tên cũ dựng lại từ
 * đó; hàm trả chữ có tham số cuối `nn` (mặc định tiếng Việt); lỗi đọc form trả
 * loi và loiEn song song; câu báo KetQua có cauEn.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  boDau, cauLoiKho, dinhDangKg, dinhDangNgay, docKg, docNgay, docSoNguyen, docTien, kqHai, laUuid,
  type HaiThuTieng, type KetQua, type NgonNguNB,
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
  /** 0050: hao repack — chỉ các dòng có ghi kg sau repack. null = chưa có dòng nào. */
  kg_repack_ncc: number | null;
  kg_repack_thuc: number | null;
  hao_repack_pt: number | null;
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
/** Trạng thái đơn → [nhãn hai thứ tiếng, lớp CSS của nb-nhan]. */
export const TRANG_THAI_DON_NB: Record<TrangThaiDon, [HaiThuTieng, string]> = {
  nhap: [{ vi: 'Nháp', en: 'Draft' }, 'nhap'],
  da_gui: [{ vi: 'Đã gửi, chờ hàng', en: 'Sent, awaiting goods' }, 'cho'],
  nhan_mot_phan: [{ vi: 'Nhận một phần', en: 'Partly received' }, 'cho'],
  da_nhan: [{ vi: 'Đã nhận đủ', en: 'Fully received' }, 'song'],
  huy: [{ vi: 'Đã hủy', en: 'Cancelled' }, 'tat'],
};
/** Trạng thái đơn → [nhãn tiếng Việt, lớp CSS] (tên cũ, giữ cho code và test cũ). */
export const TRANG_THAI_DON: Record<TrangThaiDon, [string, string]> = Object.fromEntries(
  Object.entries(TRANG_THAI_DON_NB).map(([k, [ten, lop]]) => [k, [ten.vi, lop]]),
) as Record<TrangThaiDon, [string, string]>;

export function nhanTrangThaiDon(tt: string, nn: NgonNguNB = 'vi'): [string, string] {
  const x = TRANG_THAI_DON_NB[tt as TrangThaiDon];
  return x ? [x[0][nn], x[1]] : [tt, 'tat'];
}

/** Chip lọc danh sách. 'dang_cho' = đã gửi hoặc nhận một phần (database hiểu khóa này). */
export const LOC_DON_NB: readonly (readonly [string, HaiThuTieng])[] = [
  ['', { vi: 'Tất cả', en: 'All' }],
  ['nhap', { vi: 'Nháp', en: 'Draft' }],
  ['dang_cho', { vi: 'Chờ hàng về', en: 'Awaiting goods' }],
  ['da_nhan', { vi: 'Đã nhận đủ', en: 'Fully received' }],
  ['huy', { vi: 'Đã hủy', en: 'Cancelled' }],
];
/** Chip lọc, nhãn tiếng Việt (tên cũ, giữ cho code và test cũ). */
export const LOC_DON: readonly (readonly [string, string])[] = LOC_DON_NB.map(([k, ten]) => [k, ten.vi] as const);

export function docLocDon(v: string | null | undefined): string {
  return LOC_DON.some(([k]) => k === v) ? String(v) : '';
}

/** Thứ giao hàng của NCC (isodow: 1 = Thứ Hai … 7 = Chủ nhật), hai thứ tiếng. */
export const THU_TRONG_TUAN_NB: readonly (readonly [number, HaiThuTieng])[] = [
  [1, { vi: 'T2', en: 'Mon' }], [2, { vi: 'T3', en: 'Tue' }], [3, { vi: 'T4', en: 'Wed' }], [4, { vi: 'T5', en: 'Thu' }],
  [5, { vi: 'T6', en: 'Fri' }], [6, { vi: 'T7', en: 'Sat' }], [7, { vi: 'CN', en: 'Sun' }],
];
/** Thứ giao hàng, chữ tiếng Việt (tên cũ, giữ cho code và test cũ). */
export const THU_TRONG_TUAN: readonly (readonly [number, string])[] = THU_TRONG_TUAN_NB.map(([n, t]) => [n, t.vi] as const);

/** "Giao T2, T5" / "Giao mọi ngày" (tiếng Anh: "Delivers Mon, Thu" / "Delivers every day"). */
export function chuThuGiao(ds: number[] | null | undefined, nn: NgonNguNB = 'vi'): string {
  if (!ds || ds.length === 0) return { vi: 'Giao mọi ngày', en: 'Delivers every day' }[nn];
  const ten = THU_TRONG_TUAN_NB.filter(([n]) => ds.includes(n)).map(([, t]) => t[nn]).join(', ');
  return { vi: `Giao ${ten}`, en: `Delivers ${ten}` }[nn];
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

/**
 * Câu giải thích dưới mỗi món gợi ý. Tiếng Việt: đúng câu ly_do database trả về
 * (kho_goi_y_dat_hang, 0039). Tiếng Anh: database không có bản dịch, nên dựng lại
 * từ các cột số của cùng dòng, đúng thứ tự và công thức của câu database.
 */
export function cauGoiYDat(g: GoiYDat, nn: NgonNguNB = 'vi'): string {
  if (nn === 'vi') return g.ly_do;
  // Như kho_so_chu (0039): một số lẻ, bỏ số 0 thừa — nhưng dấu chấm thập phân.
  const so = (x: number | null | undefined) => String(Math.round(Number(x ?? 0) * 10) / 10);
  const ngay = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;
  const con = g.ton_kg + g.dang_chuyen_kg + g.dang_dat_kg;
  const cau = g.kho_toi_da_kg === null && g.dung_28_ngay_kg === 0
    ? 'Not sold or used in the last 28 days and no cold-store maximum set — decide the amount yourself'
      + (con > 0 ? ` (${so(con)} kg available)` : '')
    : `Need ${so(g.muc_can_kg)} kg (`
      + (g.kho_toi_da_kg !== null ? 'cold-store maximum'
        : `average use ${so(g.dung_tb_ngay_kg)} kg/day × ${ngay(g.so_ngay_giao + 3)}: ${ngay(g.so_ngay_giao)} waiting for delivery + 3 days buffer`)
      + `); ${so(g.ton_kg)} kg in stock`
      + (g.dang_chuyen_kg > 0 ? `, ${so(g.dang_chuyen_kg)} kg on the way to the counter` : '')
      + (g.dang_dat_kg > 0 ? `, ${so(g.dang_dat_kg)} kg ordered, not yet arrived` : '')
      + (g.de_nghi_kg > 0 ? ` → order ${so(g.de_nghi_kg)} kg` : ' → no need to order yet');
  return cau + (g.duoi_toi_thieu ? `. Below the minimum of ${so(g.kho_toi_thieu_kg)} kg!` : '');
}

/** Tiến độ nhận của một dòng đơn: "Đã nhận 11,6 / 12 kg" (không phần trăm — thịt cân lẻ). */
export function chuDaNhan(d: Pick<DongDonDat, 'so_kg_dat' | 'so_kg_da_nhan'>, nn: NgonNguNB = 'vi'): string {
  return `${dinhDangKg(d.so_kg_da_nhan, nn)} / ${dinhDangKg(d.so_kg_dat, nn)} kg`;
}

/** Sao đánh giá: 4.5 → "★★★★½" (null → "chưa đủ số liệu" / "not enough data"). */
export function chuSao(diem: number | null | undefined, nn: NgonNguNB = 'vi'): string {
  if (diem === null || diem === undefined || !Number.isFinite(Number(diem))) return { vi: 'chưa đủ số liệu', en: 'not enough data' }[nn];
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
 * Viết theo ngôn ngữ của trang đang mở, như tờ in.
 */
export function tinNhanDon(
  don: Pick<DonDat, 'so_phieu' | 'ngay_giao_du_kien' | 'ghi_chu' | 'ten_nha_cung_cap' | 'dong'>,
  o: { chiNhanh?: string | null; gia?: Map<string, number | null> | null } = {},
  nn: NgonNguNB = 'vi',
): string {
  const c = (x: HaiThuTieng) => x[nn];
  const dong = don.dong.map((d, i) => {
    const goi = d.so_goi_dat ? ` (${d.so_goi_dat} ${d.don_vi_goi || c({ vi: 'gói', en: 'packs' })})` : '';
    const g = o.gia?.get(d.mat_hang_id);
    const gia = o.gia && g !== null && g !== undefined
      ? c({ vi: ` · ${Math.round(g).toLocaleString('vi-VN')} đ/kg`, en: ` · ${Math.round(g).toLocaleString('en-US')} VND/kg` })
      : '';
    return `${i + 1}. ${d.ten_mat_hang}: ${dinhDangKg(d.so_kg_dat, nn)} kg${goi}${gia}`;
  });
  const quan = `BEEFTOWN${o.chiNhanh ? ` ${o.chiNhanh}` : ''}`;
  const ngayGiao = dinhDangNgay(don.ngay_giao_du_kien);
  return [
    c({ vi: `${quan} đặt hàng — đơn ${don.so_phieu}`, en: `${quan} purchase order ${don.so_phieu}` }),
    don.ten_nha_cung_cap ? c({ vi: `Gửi: ${don.ten_nha_cung_cap}`, en: `To: ${don.ten_nha_cung_cap}` }) : '',
    c({ vi: `Ngày giao: ${ngayGiao}`, en: `Delivery date: ${ngayGiao}` }),
    ...dong,
    don.ghi_chu ? c({ vi: `Ghi chú: ${don.ghi_chu}`, en: `Note: ${don.ghi_chu}` }) : '',
    c({ vi: 'Nhờ anh/chị xác nhận giúp. Cảm ơn!', en: 'Please confirm this order. Thank you!' }),
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
): { chu: FormDonDat; dong: DongGuiDat[]; ngayGiao: string | null; loi: string[]; loiEn: string[] } {
  const chu = chuFormDonDat(form, o.soDong);
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const dong: DongGuiDat[] = [];
  const daCo = new Set<string>();
  const doc = (d: DongDatForm, nhan: HaiThuTieng | null) => {
    if (!d.mh && !d.kg && !d.goi && !d.gia) return;
    const m = laUuid(d.mh) ? mon.get(d.mh) : undefined;
    if (!m) {
      if (d.kg || d.goi) {
        bao(nhan ? { vi: `${nhan.vi}: chọn món`, en: `${nhan.en}: choose an item` }
          : { vi: 'Có món đã ngừng dùng — bỏ số kg của món đó', en: 'An item is no longer in use — clear its kg' });
      }
      return;
    }
    const ten = nhan ? `${nhan.vi} (${m.ten})` : m.ten;
    const tenEn = nhan ? `${nhan.en} (${m.ten})` : m.ten;
    const kg = docKg(d.kg);
    const goi = docSoNguyen(d.goi, 1, 100000);
    if (kg === null || kg === 0) {
      if (d.goi && d.goi !== '0') bao({ vi: `${ten}: ghi số kg đặt`, en: `${tenEn}: enter the kg to order` });
      return;   // không đặt món này
    }
    if (Number.isNaN(kg) || kg < 0) {
      bao({ vi: `${ten}: số kg chưa đúng (ví dụ 12,5)`, en: `${tenEn}: the kg is not valid (for example 12.5)` });
      return;
    }
    if (Number.isNaN(goi)) {
      bao({ vi: `${ten}: số ${m.don_vi_goi || 'gói'} là số nguyên lớn hơn 0`,
            en: `${tenEn}: the number of ${m.don_vi_goi || 'packs'} must be a whole number above 0` });
      return;
    }
    if (daCo.has(d.mh)) {
      bao({ vi: `${ten}: món này đã có ở dòng trên — gộp lại một dòng`,
            en: `${tenEn}: this item is already on a line above — combine them into one line` });
      return;
    }
    const ra: DongGuiDat = { mat_hang_id: d.mh, so_kg_dat: kg, so_goi_dat: goi };
    if (o.coGia) {
      const gia = docTien(d.gia);
      if (Number.isNaN(gia)) {
        bao({ vi: `${ten}: giá dự kiến là số đồng, ví dụ 480.000`, en: `${tenEn}: the expected price is in VND, for example 480,000` });
        return;
      }
      ra.don_gia_du_kien = gia;
    }
    daCo.add(d.mh);
    dong.push(ra);
  };
  for (const d of chu.co.values()) doc(d, null);
  chu.them.forEach((d, i) => doc(d, { vi: `Dòng thêm ${i + 1}`, en: `Extra line ${i + 1}` }));

  const ngay = docNgay(chu.ngayGiao);
  if (ngay === undefined) bao({ vi: 'Ngày giao không phải ngày có thật', en: 'The delivery date is not a real date' });
  if (dong.length === 0 && loi.length === 0) {
    bao({ vi: 'Đơn chưa có món nào — ghi số kg cho ít nhất một món', en: 'The order has no items yet — enter the kg for at least one item' });
  }
  return { chu, dong, ngayGiao: ngay ?? null, loi, loiEn };
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
export function cotDanhGiaNcc(coGia: boolean, nn: NgonNguNB = 'vi'): CotBaoCao[] {
  const c = (x: HaiThuTieng) => x[nn];
  return [
    { khoa: 'ten', ten: c({ vi: 'Nhà cung cấp', en: 'Supplier' }), kieu: 'chu' },
    { khoa: 'diem_sao', ten: c({ vi: 'Điểm (1–5 sao)', en: 'Score (1–5 stars)' }), kieu: 'pt' },
    { khoa: 'so_phieu', ten: c({ vi: 'Số lần giao', en: 'Deliveries' }), kieu: 'so' },
    { khoa: 'tong_kg', ten: c({ vi: 'Kg nhận', en: 'Kg received' }), kieu: 'kg' },
    ...(coGia ? [{ khoa: 'gia_tb_kg', ten: c({ vi: 'Giá TB/kg', en: 'Avg price/kg' }), kieu: 'tien' as const, tienMat: true }] : []),
    { khoa: 'so_don', ten: c({ vi: 'Số đơn đặt', en: 'Purchase orders' }), kieu: 'so' },
    { khoa: 'so_don_thieu', ten: c({ vi: 'Đơn giao thiếu', en: 'Orders delivered short' }), kieu: 'so' },
    { khoa: 'kg_thieu', ten: c({ vi: 'Kg thiếu', en: 'Kg short' }), kieu: 'kg' },
    { khoa: 'so_don_tre', ten: c({ vi: 'Đơn giao trễ', en: 'Orders delivered late' }), kieu: 'so' },
    { khoa: 'thu_hoi_tb_pt', ten: c({ vi: 'Thu hồi pha lóc TB %', en: 'Avg butchery yield %' }), kieu: 'pt' },
    { khoa: 'so_phien_pha', ten: c({ vi: 'Số phiên pha', en: 'Butchery sessions' }), kieu: 'so' },
    { khoa: 'kg_tra', ten: c({ vi: 'Kg trả lại', en: 'Kg returned' }), kieu: 'kg' },
    { khoa: 'kg_repack_ncc', ten: c({ vi: 'Kg NCC (có repack)', en: 'Supplier kg (repacked)' }), kieu: 'kg' },
    { khoa: 'kg_repack_thuc', ten: c({ vi: 'Kg sau repack', en: 'Kg after repack' }), kieu: 'kg' },
    { khoa: 'hao_repack_pt', ten: c({ vi: 'Hao repack %', en: 'Repack loss %' }), kieu: 'pt' },
    ...(coGia ? [
      { khoa: 'so_lan_lech_hoa_don', ten: c({ vi: 'Lần lệch hóa đơn', en: 'Invoice mismatches' }), kieu: 'so' as const, tienMat: true },
      { khoa: 'so_ngay_tra_tb', ten: c({ vi: 'Ngày trả tiền TB', en: 'Avg days to pay' }), kieu: 'pt' as const, tienMat: true },
    ] : []),
  ];
}

export function dinhNghiaDanhGiaNcc(coGia: boolean, nn: NgonNguNB = 'vi'): DinhNghiaBaoCao {
  const c = (x: HaiThuTieng) => x[nn];
  return {
    ten: c({ vi: 'Đánh giá nhà cung cấp', en: 'Supplier rating' }),
    moTa: c({
      vi: 'Theo phiếu nhận hàng đã duyệt trong kỳ và đơn đặt có ngày giao trong kỳ.',
      en: 'Based on receiving notes approved in the period and purchase orders due for delivery in the period.',
    }),
    cot: cotDanhGiaNcc(coGia, nn),
    cong: ['so_phieu', 'tong_kg', 'so_don', 'so_don_thieu', 'kg_thieu', 'so_don_tre', 'kg_tra'],
    khiTrong: {
      cau: c({
        vi: 'Kỳ này chưa có phiếu nhận hàng đã duyệt hay đơn đặt hàng nào',
        en: 'No approved receiving notes or purchase orders in this period yet',
      }),
      link: [{ ten: c({ vi: 'Đặt hàng', en: 'Purchase orders' }), href: '/noi-bo/kho/dat-hang' }],
    },
  };
}

/** Công thức điểm sao, nói bằng lời (khớp comment kho_bao_cao_ncc, 0039), hai thứ tiếng. */
export const CONG_THUC_SAO_NB: HaiThuTieng = {
  vi: 'Bắt đầu 5 sao, trừ: 2 × tỉ lệ đơn giao thiếu, 1 × tỉ lệ đơn giao trễ, 1 × tỉ lệ phiếu lệch hóa đơn, và tối đa 1 sao theo kg trả lại (trả 10% số kg nhận là trừ đủ 1 sao). Thấp nhất 1 sao, làm tròn nửa sao.',
  en: 'Starts at 5 stars, minus: 2 × the share of orders delivered short, 1 × the share of orders delivered late, 1 × the share of receipts that did not match the invoice, and up to 1 star for kg returned (returning 10% of the kg received takes off the full star). Lowest 1 star, rounded to the nearest half star.',
};
/** Công thức điểm sao, tiếng Việt (tên cũ, giữ cho code và test cũ). */
export const CONG_THUC_SAO: string = CONG_THUC_SAO_NB.vi;

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

/**
 * Đơn đang chờ hàng về (đã gửi / nhận một phần) — cho màn nhận hàng. Vai không xem được đơn
 * (database từ chối quyền, 42501) → rỗng: vai đó không nhận theo đơn. Lỗi khác (mạng, hết giờ,
 * database) → NÉM: "không đọc được" khác "không có đơn chờ" — trang phải nói ra, kẻo thủ kho
 * nhận hàng không gắn đơn.
 */
export async function docDonChoNhan(client: SupabaseClient, chiNhanhId: string): Promise<DonDatTom[]> {
  try {
    return await docDsDonDat(client, chiNhanhId, 'dang_cho',
      { q: '', tu: null, den: null, cuaToi: false, trang: 1 }, { gioiHan: 30 });
  } catch (e) {
    const loi = e as { code?: unknown; message?: unknown } | null;
    if (loi?.code === '42501' || /permission denied|insufficient_privilege/i.test(String(loi?.message ?? ''))) return [];
    throw e;
  }
}

/** Một đơn, chỉ kg. Không có / không được xem → null. */
export async function docDonDat(client: SupabaseClient, id: string): Promise<DonDat | null> {
  if (!laUuid(id)) return null;
  const { data, error } = await client.rpc('kho_doc_don_dat_kg', { p_id: id });
  if (error) {
    // Câu database "Không tìm thấy đơn đặt hàng…" — so trên chữ đã bỏ dấu (boDau): file thư
    // viện không giữ câu tiếng Việt nào ngoài cặp { vi, en } (test-kho-tieng-anh.mjs).
    if (/Khong tim thay don dat hang/.test(boDau(error.message ?? ''))) return null;
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
    kg_repack_ncc: soHoacNull(r.kg_repack_ncc), kg_repack_thuc: soHoacNull(r.kg_repack_thuc),
    hao_repack_pt: soHoacNull(r.hao_repack_pt),
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
  if (!kq) {
    return kqHai(false, { vi: 'Không chắc đã lưu hay chưa — mở danh sách Đặt hàng để kiểm tra.',
                          en: 'Not sure whether it was saved — open the Purchase orders list to check.' });
  }
  const cau: HaiThuTieng = kq.da_co ? { vi: 'Đơn này đã được lưu từ lần bấm trước.', en: 'This order was already saved the first time you pressed.' }
    : v.id ? { vi: 'Đã lưu đơn.', en: 'Order saved.' } : { vi: 'Đã lập đơn nháp.', en: 'Draft order created.' };
  return { ok: true, id: kq.don_id, phienBan: Number(kq.phien_ban_moi), cau: cau.vi, cauEn: cau.en };
}

/**
 * Các hàm đổi trạng thái trả về một câu tiếng Việt của database — hiện nguyên
 * văn (màn tiếng Anh tra dichCau lúc hiện, trong BaoKho).
 */
async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  if (data === null || data === undefined) return kqHai(true, { vi: 'Xong.', en: 'Done.' });
  return { ok: true, cau: String(data) };
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
  if (!laUuid(data)) {
    return kqHai(false, { vi: 'Không chắc đã tạo phiếu — mở danh sách Nhận hàng để kiểm tra.',
                          en: 'Not sure whether the note was created — open the Receive goods list to check.' });
  }
  const cau: HaiThuTieng = {
    vi: 'Phiếu nhận hàng đã điền sẵn món và số kg còn thiếu của đơn. Cân lại, sửa số cho đúng, chụp hóa đơn rồi gửi.',
    en: 'The receiving note is filled in with the items and kg still missing from the order. Weigh again, correct the numbers, photograph the invoice, then send.',
  };
  return { ok: true, id: data, cau: cau.vi, cauEn: cau.en };
}

/** Mức tối thiểu / tối đa ở kho lạnh (kg) của một mặt hàng (danh_muc). null = bỏ mức. */
export function luuMucDatHang(client: SupabaseClient, matHangId: string, toiThieu: number | null, toiDa: number | null) {
  return cauTraVe(client.rpc('kho_luu_muc_dat_hang', {
    p_mat_hang_id: matHangId, p_kho_toi_thieu_kg: toiThieu, p_kho_toi_da_kg: toiDa,
  }));
}
