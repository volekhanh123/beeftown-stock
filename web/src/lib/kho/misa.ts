/**
 * KHO — XUẤT DỮ LIỆU SANG MISA (GĐ8b, migration 0040)
 *
 * Database (kho_du_lieu_misa) trả DÒNG PHẲNG: ngày / số chứng từ, hóa đơn, mã
 * và tên NCC, mã và tên hàng, số lượng, đơn giá, thành tiền, thuế, tài khoản
 * nợ / có (lấy từ kho_cai_dat.misa_tk). File này chỉ SẮP CỘT và dựng CSV —
 * file thuần, không gọi database, test bằng Node (test-kho-cong-no-v2-web.mjs).
 *
 * LÚC VIẾT CHƯA CÓ FILE MẪU NHẬP KHẨU CỦA MISA. Mọi giả định về tên cột, thứ
 * tự cột, cách ghi ngày / số nằm trong bảng COT_MISA và DINH_DANG_MISA ngay
 * dưới đây. Có file mẫu (Excel mẫu "Nhập khẩu chứng từ mua hàng" / "Trả tiền
 * nhà cung cấp" của MISA) thì chỉ sửa hai hằng đó — không đoán thêm định dạng
 * nhị phân (.xlsx): Excel mở CSV này được, kế toán lưu lại thành .xlsx nếu MISA
 * đòi.
 */

export type LoaiMisa = 'mua_hang' | 'thanh_toan';
export type KieuCotMisa = 'chu' | 'ngay' | 'tien' | 'so' | 'phan_tram';

/** Một dòng kho_du_lieu_misa (cột không dùng thì null). */
export interface DongMisa {
  thu_tu: number;
  loai_chung_tu: string;
  ngay_chung_tu: string | null;
  so_chung_tu: string | null;
  so_hoa_don: string | null;
  ngay_hoa_don: string | null;
  ma_ncc: string | null;
  ten_ncc: string | null;
  ma_so_thue: string | null;
  ma_hang: string | null;
  ten_hang: string | null;
  dvt: string | null;
  so_luong: number | null;
  don_gia: number | null;
  thanh_tien: number | null;
  thue_suat: number | null;
  tien_thue: number | null;
  tk_no: string | null;
  tk_co: string | null;
  tk_thue: string | null;
  hinh_thuc: string | null;
  dien_giai: string | null;
  thieu_ma: boolean;
  ref_id: string | null;
}

export interface CotMisa { khoa: keyof DongMisa | 'ten_hinh_thuc' | 'ten_loai'; ten: string; kieu: KieuCotMisa }

// =============================================================================
// CHỈNH KHI CÓ FILE MẪU — thứ tự và tên cột của file MISA
// =============================================================================
export const COT_MISA: Record<LoaiMisa, readonly CotMisa[]> = {
  mua_hang: [
    { khoa: 'ngay_chung_tu', ten: 'Ngày chứng từ', kieu: 'ngay' },
    { khoa: 'so_chung_tu', ten: 'Số chứng từ', kieu: 'chu' },
    { khoa: 'so_hoa_don', ten: 'Số hóa đơn', kieu: 'chu' },
    { khoa: 'ngay_hoa_don', ten: 'Ngày hóa đơn', kieu: 'ngay' },
    { khoa: 'ma_ncc', ten: 'Mã nhà cung cấp', kieu: 'chu' },
    { khoa: 'ten_ncc', ten: 'Tên nhà cung cấp', kieu: 'chu' },
    { khoa: 'ma_so_thue', ten: 'Mã số thuế', kieu: 'chu' },
    { khoa: 'dien_giai', ten: 'Diễn giải', kieu: 'chu' },
    { khoa: 'ma_hang', ten: 'Mã hàng', kieu: 'chu' },
    { khoa: 'ten_hang', ten: 'Tên hàng', kieu: 'chu' },
    { khoa: 'dvt', ten: 'ĐVT', kieu: 'chu' },
    { khoa: 'so_luong', ten: 'Số lượng', kieu: 'so' },
    { khoa: 'don_gia', ten: 'Đơn giá', kieu: 'tien' },
    { khoa: 'thanh_tien', ten: 'Thành tiền', kieu: 'tien' },
    { khoa: 'thue_suat', ten: '% thuế GTGT', kieu: 'phan_tram' },
    { khoa: 'tien_thue', ten: 'Tiền thuế GTGT', kieu: 'tien' },
    { khoa: 'tk_no', ten: 'TK Nợ', kieu: 'chu' },
    { khoa: 'tk_co', ten: 'TK Có', kieu: 'chu' },
    { khoa: 'tk_thue', ten: 'TK thuế GTGT', kieu: 'chu' },
  ],
  thanh_toan: [
    { khoa: 'ngay_chung_tu', ten: 'Ngày chứng từ', kieu: 'ngay' },
    { khoa: 'so_chung_tu', ten: 'Số chứng từ', kieu: 'chu' },
    { khoa: 'ten_loai', ten: 'Loại', kieu: 'chu' },
    { khoa: 'ten_hinh_thuc', ten: 'Hình thức', kieu: 'chu' },
    { khoa: 'ma_ncc', ten: 'Mã nhà cung cấp', kieu: 'chu' },
    { khoa: 'ten_ncc', ten: 'Tên nhà cung cấp', kieu: 'chu' },
    { khoa: 'ma_so_thue', ten: 'Mã số thuế', kieu: 'chu' },
    { khoa: 'so_hoa_don', ten: 'Số hóa đơn', kieu: 'chu' },
    { khoa: 'dien_giai', ten: 'Diễn giải', kieu: 'chu' },
    { khoa: 'thanh_tien', ten: 'Số tiền', kieu: 'tien' },
    { khoa: 'tk_no', ten: 'TK Nợ', kieu: 'chu' },
    { khoa: 'tk_co', ten: 'TK Có', kieu: 'chu' },
  ],
};

/** CHỈNH KHI CÓ FILE MẪU — cách ghi ngày và số trong file. */
export const DINH_DANG_MISA = {
  /** dd/MM/yyyy như màn nhập của MISA. */
  ngay: (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`,
  /** Excel tiếng Việt ngăn cột bằng ";" và ghi số lẻ bằng ","; ngăn bằng "," thì số lẻ bằng ".". */
  dauThapPhan: (ngan: NganMisa) => (ngan === ';' ? ',' : '.'),
} as const;
// =============================================================================

export type NganMisa = ';' | ',';

export const TEN_LOAI_MISA: Record<LoaiMisa, string> = {
  mua_hang: 'Mua hàng (phiếu nhập)',
  thanh_toan: 'Trả tiền, giảm trừ, bù trừ, hoàn tiền',
};

export const TEN_LOAI_CHUNG_TU_MISA: Record<string, string> = {
  mua_hang: 'Mua hàng',
  thanh_toan: 'Trả tiền',
  giam_tru: 'Giảm trừ',
  bu_tru: 'Bù trừ',
  hoan_tien: 'NCC hoàn tiền',
};

const TEN_HINH_THUC_MISA: Record<string, string> = {
  chuyen_khoan: 'Chuyển khoản',
  tien_mat: 'Tiền mặt',
  khac: 'Khác',
};

/** Tên các mã tài khoản trong kho_cai_dat.misa_tk (0040) — thứ tự hiện trên màn. */
export const TEN_TK_MISA: readonly [string, string, string][] = [
  ['tk_no_hang', 'TK hàng hóa (Nợ khi mua)', '1561'],
  ['tk_thue', 'TK thuế GTGT được khấu trừ', '1331'],
  ['tk_co_ncc', 'TK phải trả nhà cung cấp', '331'],
  ['tk_tien_mat', 'TK tiền mặt', '1111'],
  ['tk_ngan_hang', 'TK tiền gửi ngân hàng', '1121'],
  ['tk_bu_tru', 'TK bù trừ (khoản NCC nợ lại quán)', '131'],
];

/** Một ô CSV. Chữ có dấu ngăn, nháy kép hay xuống dòng thì bọc "…" (nháy trong chữ viết đôi). */
export function oCsvMisa(v: unknown, kieu: KieuCotMisa, ngan: NganMisa = ';'): string {
  if (v === null || v === undefined || v === '') return '';
  let s: string;
  if (kieu === 'tien') {
    // Số đồng nguyên, KHÔNG phân cách hàng nghìn — MISA / Excel đọc thẳng thành số.
    const n = Number(v);
    s = Number.isFinite(n) ? String(Math.round(n)) : '';
  } else if (kieu === 'so' || kieu === 'phan_tram') {
    const n = Number(v);
    if (!Number.isFinite(n)) return '';
    s = String(Math.round(n * 1000) / 1000).replace('.', DINH_DANG_MISA.dauThapPhan(ngan));
  } else if (kieu === 'ngay') {
    const t = String(v);
    s = /^\d{4}-\d{2}-\d{2}/.test(t) ? DINH_DANG_MISA.ngay(t) : t;
  } else {
    s = String(v);
  }
  // Ô bắt đầu bằng = + - @ bị Excel hiểu là công thức — thêm nháy đơn cho ô chữ.
  if (kieu === 'chu' && /^[=+\-@]/.test(s)) s = `'${s}`;
  return /["\r\n]/.test(s) || s.includes(ngan) ? `"${s.replace(/"/g, '""')}"` : s;
}

function giaTriCot(d: DongMisa, c: CotMisa): unknown {
  if (c.khoa === 'ten_hinh_thuc') return d.hinh_thuc ? TEN_HINH_THUC_MISA[d.hinh_thuc] ?? d.hinh_thuc : '';
  if (c.khoa === 'ten_loai') return TEN_LOAI_CHUNG_TU_MISA[d.loai_chung_tu] ?? d.loai_chung_tu;
  return d[c.khoa];
}

/** Giá trị hiển thị trên bảng xem trước (cùng cột với file). */
export function oXemMisa(d: DongMisa, c: CotMisa): string {
  const v = giaTriCot(d, c);
  if (v === null || v === undefined || v === '') return '';
  if (c.kieu === 'tien') return Math.round(Number(v)).toLocaleString('vi-VN');
  if (c.kieu === 'so' || c.kieu === 'phan_tram') return String(Math.round(Number(v) * 1000) / 1000).replace('.', ',');
  if (c.kieu === 'ngay') return DINH_DANG_MISA.ngay(String(v));
  return String(v);
}

/**
 * File CSV: BOM UTF-8 (Excel đọc đúng tiếng Việt), dòng tiêu đề theo COT_MISA,
 * mỗi dòng dữ liệu một dòng, xuống dòng CRLF. Cột "Thiếu mã MISA" ở cuối để kế
 * toán lọc — bỏ bằng tuyChon.cotThieuMa = false.
 */
export function taoCsvMisa(
  loai: LoaiMisa, dong: DongMisa[], tuyChon: { ngan?: NganMisa; cotThieuMa?: boolean } = {},
): string {
  const ngan = tuyChon.ngan ?? ';';
  const cot = COT_MISA[loai];
  const coThieu = tuyChon.cotThieuMa ?? true;
  const dau = [...cot.map(c => oCsvMisa(c.ten, 'chu', ngan)), ...(coThieu ? [oCsvMisa('Thiếu mã MISA', 'chu', ngan)] : [])];
  const than = dong.map(d => [
    ...cot.map(c => oCsvMisa(giaTriCot(d, c), c.kieu, ngan)),
    ...(coThieu ? [d.thieu_ma ? 'x' : ''] : []),
  ].join(ngan));
  return '﻿' + [dau.join(ngan), ...than].join('\r\n') + '\r\n';
}

export interface TomTatMisa { soDong: number; soThieuMa: number; soChungTu: number; tongTien: number; tongThue: number }

export function tomTatMisa(dong: DongMisa[]): TomTatMisa {
  return {
    soDong: dong.length,
    soThieuMa: dong.filter(d => d.thieu_ma).length,
    soChungTu: new Set(dong.map(d => d.so_chung_tu)).size,
    tongTien: dong.reduce((s, d) => s + (Number(d.thanh_tien) || 0), 0),
    tongThue: dong.reduce((s, d) => s + (Number(d.tien_thue) || 0), 0),
  };
}

/**
 * Nhà cung cấp / mặt hàng chưa có mã MISA mà xuất hiện trong dữ liệu — để trang
 * hiện link sửa. Dòng MISA không ghi id nên khớp theo tên NCC và mã hàng (mã
 * nội bộ được dùng thay khi thiếu mã MISA).
 */
export function thieuMaMisa(
  dong: DongMisa[],
  ncc: { id: string; ten: string; ma_misa: string | null }[],
  matHang: { id: string; ma: string; ten: string; ma_misa: string | null }[],
): { ncc: { id: string; ten: string }[]; matHang: { id: string; ma: string; ten: string }[] } {
  const tenNcc = new Set(dong.filter(d => d.thieu_ma).map(d => d.ten_ncc));
  const maHang = new Set(dong.filter(d => d.thieu_ma && d.ma_hang).map(d => d.ma_hang));
  return {
    ncc: ncc.filter(n => !n.ma_misa && tenNcc.has(n.ten)).map(n => ({ id: n.id, ten: n.ten })),
    matHang: matHang.filter(m => !m.ma_misa && maHang.has(m.ma)).map(m => ({ id: m.id, ma: m.ma, ten: m.ten })),
  };
}

/** Kỳ + loại + dấu ngăn từ URL. Mặc định: tháng này, mua hàng, dấu ";". */
export function docBoLocMisa(sp: URLSearchParams, homNay: string): { tu: string; den: string; loai: LoaiMisa; ngan: NganMisa } {
  const ngay = (k: string) => { const v = sp.get(k) ?? ''; return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null; };
  let tu = ngay('tu') ?? `${homNay.slice(0, 8)}01`;
  let den = ngay('den') ?? homNay;
  if (tu > den) [tu, den] = [den, tu];
  const loai: LoaiMisa = sp.get('loai') === 'thanh_toan' ? 'thanh_toan' : 'mua_hang';
  const ngan: NganMisa = sp.get('ngan') === 'phay' ? ',' : ';';
  return { tu, den, loai, ngan };
}

/** Tên file: misa-mua-hang-Q1-2026-09-01-2026-09-30.csv (chỉ ký tự an toàn). */
export function tenTepMisa(loai: LoaiMisa, maCn: string, tu: string, den: string): string {
  return `misa-${loai.replace('_', '-')}-${maCn}-${tu}-${den}.csv`.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Form sửa mã tài khoản: ô tk_<tên>. Trả object chỉ gồm các ô đã gõ (ô trống
 * = giữ mã cũ), hoặc câu lỗi. Database kiểm lại đúng luật này.
 */
export function docFormMisaTk(form: { get(ten: string): unknown }): { tk: Record<string, string>; loi: string[] } {
  const tk: Record<string, string> = {};
  const loi: string[] = [];
  for (const [khoa, ten] of TEN_TK_MISA) {
    const v = String(form.get(khoa) ?? '').replace(/\s/g, '');
    if (!v) continue;
    if (!/^\d{3,10}$/.test(v)) { loi.push(`${ten}: mã tài khoản là 3 đến 10 chữ số (ví dụ 331)`); continue; }
    tk[khoa] = v;
  }
  return { tk, loi };
}

/** Mã MISA của NCC / mặt hàng: chữ không dấu, số, _ . / - (tối đa 40). Trống = xóa mã. */
export function docMaMisa(v: unknown): string | null | undefined {
  const s = String(v ?? '').trim();
  if (!s) return null;
  return /^[A-Za-z0-9_./-]{1,40}$/.test(s) ? s : undefined;
}
