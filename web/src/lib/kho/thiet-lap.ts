/**
 * KHO — THIẾT LẬP (GĐ5e, migration 0035)
 *
 * Màn "Thiết lập" (/noi-bo/kho/cai-dat) dẫn chủ / quản lý đi từng bước trước
 * ngày chạy thật, và trang tồn đầu kỳ dạng lưới (/noi-bo/kho/cai-dat/ton-dau).
 *
 *   · Tiến độ: kho_tien_do_thiet_lap — mỗi bước CHỈ SỐ ĐẾM, không tiền.
 *     Câu chữ và link "Làm bước này" của từng bước nằm ở đây (thuần, test được).
 *   · Bỏ qua bước: kho_danh_dau_thiet_lap (danh_muc; ncc_no_dau thêm kế toán;
 *     gia_von chỉ chủ). coTheBoQua() soi gương luật đó để ẩn nút.
 *   · Ngưỡng cảnh báo: form sửa 5 ngưỡng, lưu bằng luuNguong (thong-bao.ts).
 *   · Tồn đầu kỳ dạng lưới: bảng món của một vị trí, HOẶC dán Excel (Mã/Tên,
 *     Nơi, Gói, Kg, Đơn giá, HSD) → xem trước (hàm thuần) → xác nhận →
 *     kho_luu_ton_dau_ky (mỗi vị trí một phiếu TD-, chống trùng theo ma_gui).
 *     Khớp món theo Mã trước, rồi theo Tên bỏ dấu — như dán mặt hàng (GĐ4a).
 *     Thủ kho không có cột giá: hàm đọc bỏ qua cột Đơn giá khi không xem giá.
 *
 * Phần trên (tới "GỌI DATABASE") là hàm thuần — test ở
 * crm/test/test-kho-thiet-lap-web.mjs, không cần database.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  BUOC_THIET_LAP, boDau, cauLoiKho, congNgay, docKg, docNgay, docSoNguyen, docTien, duoc,
  laUuid, type KetQua, type ViecKho,
} from './chung.ts';

// =============================================================================
// TIẾN ĐỘ THIẾT LẬP
// =============================================================================

/** Một bước đã đọc từ kho_tien_do_thiet_lap, kèm tên hiển thị. */
export interface BuocThietLap {
  khoa: string;
  ten: string;
  xong: boolean;
  /** Số đếm của bước (vắng khi bước đó không đếm gì). */
  so: number | null;
  thieu: number | null;
  boQua: boolean;
  duocBoQua: boolean;
}

export interface TienDoThietLap {
  buoc: BuocThietLap[];
  conLai: number;
  tong: number;
  daKhoiTao: boolean;
}

const soHoacNull = (x: unknown): number | null =>
  x === null || x === undefined || !Number.isFinite(Number(x)) ? null : Number(x);

/**
 * Đọc kết quả thô của kho_tien_do_thiet_lap theo đúng thứ tự BUOC_THIET_LAP.
 * Bước vắng mặt (database cũ hơn web) coi như chưa xong, không bỏ qua được.
 */
export function docTienDoTho(raw: unknown): TienDoThietLap {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const buoc = BUOC_THIET_LAP.map(b => {
    const x = (d[b.khoa] && typeof d[b.khoa] === 'object' ? d[b.khoa] : {}) as Record<string, unknown>;
    return {
      khoa: b.khoa, ten: b.ten,
      xong: x.xong === true,
      so: soHoacNull(x.so), thieu: soHoacNull(x.thieu),
      boQua: x.bo_qua === true,
      duocBoQua: x.duoc_bo_qua === true && b.boQua,
    };
  });
  return {
    buoc,
    // con_lai của database là chuẩn; thiếu thì tự đếm.
    conLai: soHoacNull(d.con_lai) ?? buoc.filter(b => !b.xong).length,
    tong: soHoacNull(d.tong) ?? buoc.length,
    daKhoiTao: d.da_khoi_tao === true,
  };
}

/** "Còn 3 bước" · "Còn 1 bước" · "Đã xong cả 10 bước". */
export function cauConLai(td: Pick<TienDoThietLap, 'conLai' | 'tong'>): string {
  return td.conLai <= 0 ? `Đã xong cả ${td.tong} bước` : `Còn ${td.conLai} bước`;
}

/** Phần trăm đã xong (0–100, số nguyên) cho thanh tiến độ. */
export function phanTramXong(td: Pick<TienDoThietLap, 'conLai' | 'tong'>): number {
  if (td.tong <= 0) return 0;
  return Math.round(Math.max(0, Math.min(td.tong, td.tong - td.conLai)) * 100 / td.tong);
}

/**
 * Câu nói bước đang ở đâu — chỉ từ số đếm. Bước đã đánh dấu bỏ qua thì nói
 * rõ là bỏ qua (người sau đọc biết không phải đã làm).
 */
export function moTaBuoc(b: Pick<BuocThietLap, 'khoa' | 'xong' | 'so' | 'thieu' | 'boQua'>): string {
  const so = b.so ?? 0;
  const thieu = b.thieu ?? 0;
  if (b.boQua) {
    return b.khoa === 'ncc_no_dau' ? 'Đã đánh dấu: không có nợ đầu kỳ.' : 'Đã đánh dấu bỏ qua bước này.';
  }
  switch (b.khoa) {
    case 'chi_nhanh_nhan_vien':
      return so > 0 ? `${so} người (thủ kho, NV quầy) đang làm.` : 'Chưa có tài khoản thủ kho hay NV quầy nào.';
    case 'mat_hang':
      if (so === 0) return 'Chưa có mặt hàng nào.';
      return thieu > 0
        ? `${so} mặt hàng; ${thieu} món còn thiếu hạn dùng, hoặc (phần cắt) thiếu giá bán / mã cân.`
        : `${so} mặt hàng, đủ hạn dùng, giá bán, mã cân.`;
    case 'cong_thuc':
      if (so === 0) return 'Chưa có công thức pha lóc nào.';
      return thieu > 0 ? `${so} công thức; ${thieu} loại tảng chưa có công thức.` : `${so} công thức pha lóc.`;
    case 'ncc_no_dau':
      if (so === 0) return 'Chưa có nhà cung cấp nào.';
      return b.xong
        ? `${so} nhà cung cấp; đã ghi nợ đầu kỳ.`
        : `${so} nhà cung cấp; chưa ghi nợ đầu kỳ (không nợ ai thì bấm "Không có nợ đầu kỳ").`;
    case 'ton_dau':
      if (so + thieu === 0) return 'Chưa có kho hay quầy nào.';
      return thieu > 0
        ? `${so}/${so + thieu} kho, quầy đã có tồn đầu kỳ được duyệt; còn ${thieu} chỗ chưa có (hoặc đang chờ duyệt).`
        : `Mọi kho, quầy (${so}) đã có tồn đầu kỳ được duyệt.`;
    case 'gia_von':
      return b.xong ? 'Chủ đã xem và lưu cách tính giá vốn.' : 'Chủ chưa xem cách tính giá vốn — mở phần bên dưới, xem rồi bấm Lưu.';
    case 'dinh_muc':
      if (so === 0) return 'Chưa phần cắt nào có mức tối thiểu ở quầy.';
      return thieu > 0 ? `${so} phần cắt có mức tối thiểu; ${thieu} phần cắt chưa có.` : `Mọi phần cắt (${so}) có mức tối thiểu ở quầy.`;
    case 'vi_tri_ly_do_ma_vach':
      return thieu > 0
        ? `Còn thiếu ${thieu} trong 4 mục: có kho lạnh, có quầy, có lý do hủy / xuất, đã chọn mẫu mã vạch cân.`
        : `Đủ kho lạnh, quầy (${so} chỗ), lý do và mẫu mã vạch cân.`;
    case 'nguong':
      return b.xong ? 'Đã xem và lưu ngưỡng cảnh báo.' : 'Đang dùng ngưỡng mặc định — xem lại rồi bấm Lưu.';
    case 'may_chung':
      return so > 0 ? `${so} máy tính bảng dùng chung đang dùng.` : 'Chưa có máy tính bảng dùng chung nào.';
    default:
      return b.xong ? 'Đã xong.' : 'Chưa xong.';
  }
}

export interface LinkBuoc { ten: string; link: string; quyen: ViecKho[] }

/**
 * Nút "Làm bước này" của từng bước. quyen = quyền ở dòng chặn đầu trang đích
 * (người không vào được trang đó thì không thấy nút). Link "#…" là thẻ trên
 * chính màn Thiết lập.
 */
export const LINK_BUOC: Record<string, LinkBuoc[]> = {
  chi_nhanh_nhan_vien: [
    { ten: 'Tạo tài khoản nhân viên', link: '/noi-bo/kho/cai-dat/nhan-vien', quyen: ['cai_dat_goc'] },
  ],
  mat_hang: [{ ten: 'Mở Mặt hàng', link: '/noi-bo/kho/cai-dat/mat-hang', quyen: ['danh_muc'] }],
  cong_thuc: [{ ten: 'Mở Công thức pha lóc', link: '/noi-bo/kho/cai-dat/cong-thuc', quyen: ['danh_muc'] }],
  ncc_no_dau: [
    { ten: 'Mở Nhà cung cấp', link: '/noi-bo/kho/cai-dat/nha-cung-cap', quyen: ['ncc'] },
    { ten: 'Ghi nợ đầu kỳ', link: '/noi-bo/kho/cong-no/no-dau', quyen: ['ke_toan'] },
  ],
  ton_dau: [{ ten: 'Nhập tồn đầu kỳ', link: '/noi-bo/kho/cai-dat/ton-dau', quyen: ['nhap'] }],
  gia_von: [{ ten: 'Xem cách tính giá vốn', link: '#gia-von', quyen: ['danh_muc', 'ncc', 'cai_dat_goc'] }],
  dinh_muc: [{ ten: 'Mở Mặt hàng (phần cắt)', link: '/noi-bo/kho/cai-dat/mat-hang?loai=phan_cat', quyen: ['danh_muc'] }],
  vi_tri_ly_do_ma_vach: [
    { ten: 'Vị trí và lý do', link: '/noi-bo/kho/cai-dat/vi-tri-ly-do', quyen: ['danh_muc'] },
    { ten: 'Mã vạch cân', link: '/noi-bo/kho/cai-dat/ma-vach', quyen: ['danh_muc'] },
  ],
  nguong: [{ ten: 'Sửa ngưỡng cảnh báo', link: '#nguong', quyen: ['danh_muc'] }],
  may_chung: [{ ten: 'Máy dùng chung', link: '#may-chung', quyen: ['duyet'] }],
};

/** Các nút "Làm bước này" mà vai này bấm được. */
export function linkBuocCuaVai(khoa: string, vai: string): LinkBuoc[] {
  return (LINK_BUOC[khoa] ?? []).filter(l => l.quyen.some(q => duoc(vai, q)));
}

/** Quyền đánh dấu bỏ qua — soi gương kho_danh_dau_thiet_lap (0035). */
export function quyenBoQua(khoa: string): ViecKho[] {
  if (khoa === 'ncc_no_dau') return ['danh_muc', 'ke_toan'];
  if (khoa === 'gia_von') return ['cai_dat_goc'];
  return ['danh_muc'];
}

/** Vai này có bấm được "Bỏ qua" / "Không bỏ qua nữa" ở bước này không. */
export function coTheBoQua(b: Pick<BuocThietLap, 'khoa' | 'duocBoQua'>, vai: string): boolean {
  return b.duocBoQua && quyenBoQua(b.khoa).some(q => duoc(vai, q));
}

/** Chữ trên nút bỏ qua. */
export function chuNutBoQua(khoa: string, dangBoQua: boolean): string {
  if (dangBoQua) return 'Không bỏ qua nữa';
  if (khoa === 'ncc_no_dau') return 'Không có nợ đầu kỳ';
  if (khoa === 'may_chung') return 'Không dùng máy chung';
  return 'Bỏ qua';
}

// =============================================================================
// NGƯỠNG CẢNH BÁO — giá trị đang dùng
// =============================================================================
export const KHOA_NGUONG = [
  'nguong_gia_mua_pt', 'nguong_thu_hoi_diem', 'gio_nhac_chuyen', 'gio_chot_ngay', 'nguong_dinh_muc_pt',
] as const;

/** Khoảng hợp lệ — soi gương CHECK của kho_cai_dat (0030). Để gợi ý trên ô. */
export const KHOANG_NGUONG: Record<string, [number, number]> = {
  nguong_gia_mua_pt: [0, 100],
  nguong_thu_hoi_diem: [0, 50],
  gio_nhac_chuyen: [1, 48],
  gio_chot_ngay: [0, 12],
  nguong_dinh_muc_pt: [0, 100],
};

export interface NguongDangDung {
  gia_tri: Record<string, number | null>;
  /** Lần cuối lưu ngưỡng (0035). null = đang dùng mặc định, chưa ai xem. */
  luu_luc: string | null;
}

/** 5 → "5" · 2.5 → "2,5" — hiện trong ô nhập (người Việt gõ dấu phẩy). */
export function hienSoNguong(n: number | null | undefined): string {
  return n === null || n === undefined ? '' : String(n).replace('.', ',');
}

// =============================================================================
// TỒN ĐẦU KỲ DẠNG LƯỚI — XEM TRƯỚC (thuần)
// =============================================================================

/** Phần của mặt hàng mà lưới tồn đầu kỳ cần. Không có cột tiền nào. */
export interface MonTonDau {
  id: string; ma: string; ten: string;
  loai: 'tang' | 'phan_cat' | 'phu_pham';
  dem_goi: boolean; don_vi_goi: string;
  han_dung_ngay: number | null;
  dang_dung: boolean;
}

export interface NoiTonDau {
  id: string; ten: string;
  loai: 'kho' | 'quay' | 'cho_huy' | 'dang_chuyen';
  dang_dung: boolean;
}

export interface NguCanhTonDau {
  matHang: MonTonDau[];
  viTri: NoiTonDau[];
  /** Nơi để khi dòng dán không ghi Nơi (và là nơi của cả bảng món). */
  viTriMacDinh: string | null;
  /** Người xem có quyền xem giá — không thì bỏ qua cột Đơn giá. */
  coGia: boolean;
  /** Ngày tồn đầu kỳ (YYYY-MM-DD) — để tính hạn mặc định. */
  ngay: string;
}

/** Một dòng đã hiểu, sẵn sàng gửi. */
export interface DongTonDau {
  /** Số thứ tự trong lần gửi (1, 2, …) — trùng "Dòng N" của câu lỗi database. */
  stt: number;
  /** Chỗ của dòng này trong ô dán / tên món trong bảng — để người dùng dò lại. */
  nguon: string;
  vi_tri_id: string; ten_vi_tri: string;
  mat_hang_id: string; ten_mat_hang: string; ma_mat_hang: string; don_vi_goi: string;
  so_goi: number; so_kg: number;
  don_gia_kg: number | null;
  /** Hạn ghi trong ô; null = theo hạn mặc định của mặt hàng. */
  han_dung: string | null;
  /** Hạn sẽ dùng (ghi trong ô, hoặc ngày + hạn mặc định). */
  han_se_dung: string | null;
}

export interface XemTruocTonDau {
  dong: DongTonDau[];
  loi: string[];
  /** Tiêu đề cột không hiểu, hoặc cột bị bỏ vì không có quyền. */
  boQua: string[];
}

export const TOI_DA_DONG_TON_DAU = 500;
const NGAY_LUI_TOI_DA = 90;

/** Ngày tồn đầu kỳ: không trống, không sau hôm nay, không quá 90 ngày trước (như database). */
export function kiemNgayTonDau(ngay: string, homNay: string): string | null {
  const d = docNgay(ngay);
  if (!d) return 'Chọn ngày tồn đầu kỳ.';
  if (d > homNay) return 'Ngày tồn đầu kỳ không được sau hôm nay.';
  if (d < congNgay(homNay, -NGAY_LUI_TOI_DA)) return `Ngày tồn đầu kỳ quá ${NGAY_LUI_TOI_DA} ngày trước — kiểm tra lại ngày.`;
  return null;
}

/**
 * Hạn dùng gõ tay hoặc dán từ Excel: "2026-10-25", "25/10/2026", "25-10-2026",
 * "25.10.2026", "25/10/26". Trống → null. Sai → undefined.
 */
export function docHanDan(v: unknown): string | null | undefined {
  const s = String(v ?? '').trim();
  if (s === '') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return docNgay(s) ?? undefined;
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(s);
  if (!m) return undefined;
  const nam = m[3].length === 2 ? `20${m[3]}` : m[3];
  return docNgay(`${nam}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`) ?? undefined;
}

/** Tên để so khớp: bỏ dấu, chữ thường, gộp khoảng trắng (như chuanTenMatHang). */
export function chuanTen(s: string): string {
  return boDau(s).toLowerCase().replace(/\s+/g, ' ').trim();
}

type CotTonDau = 'ma_ten' | 'ma' | 'ten' | 'noi' | 'goi' | 'kg' | 'gia' | 'han';

/** Thứ tự cột khi KHÔNG có dòng tiêu đề. */
export const COT_TON_DAU: CotTonDau[] = ['ma_ten', 'noi', 'goi', 'kg', 'gia', 'han'];

const TEN_COT_TON_DAU: Record<CotTonDau, string> = {
  ma_ten: 'Mã/Tên', ma: 'Mã', ten: 'Tên', noi: 'Nơi', goi: 'Gói', kg: 'Kg', gia: 'Đơn giá', han: 'HSD',
};

// Tiêu đề cột → cột. So sau khi bỏ dấu, bỏ ký tự lạ, bỏ đơn vị ở cuối
// ("Đơn giá/kg" → "don gia", "Kg" giữ nguyên).
const TIEU_DE_TON_DAU: Record<string, CotTonDau> = Object.fromEntries(([
  ['ma_ten', ['ma ten', 'ma hoac ten', 'ten ma', 'ma ten hang']],
  ['ma', ['ma', 'ma hang', 'ma mat hang', 'ma mh']],
  ['ten', ['ten', 'ten hang', 'ten mat hang', 'mat hang', 'mon', 'ten mon', 'hang']],
  ['noi', ['noi', 'noi de', 'vi tri', 'kho', 'kho quay', 'o dau', 'de o']],
  ['goi', ['goi', 'so goi', 'so luong', 'sl', 'so goi khay', 'goi khay', 'so tang']],
  ['kg', ['kg', 'so kg', 'khoi luong', 'trong luong', 'can nang', 'can']],
  ['gia', ['gia', 'don gia', 'gia von', 'gia nhap', 'don gia kg', 'gia kg']],
  ['han', ['hsd', 'han', 'han dung', 'han su dung', 'ngay het han', 'het han']],
] as [CotTonDau, string[]][]).flatMap(([cot, ds]) => ds.map(t => [t, cot])));

function cotCuaTieuDe(o: string): CotTonDau | undefined {
  const t = boDau(o).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  return TIEU_DE_TON_DAU[t] ?? TIEU_DE_TON_DAU[t.replace(/( (kg|d|dong|vnd|ngay))+$/, '')];
}

function boNgoacKep(o: string): string {
  const t = o.trim();
  return t.length >= 2 && t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1).replace(/""/g, '"').trim() : t;
}

/** Chỗ để được hàng: kho / quầy đang dùng (không chờ hủy, không đang mang ra quầy). */
export function noiDeDuoc(viTri: NoiTonDau[]): NoiTonDau[] {
  return viTri.filter(v => v.dang_dung && (v.loai === 'kho' || v.loai === 'quay'));
}

/** Tìm mặt hàng đang dùng theo Mã, rồi theo Tên bỏ dấu. Trả câu lỗi khi không rõ. */
export function timMon(matHang: MonTonDau[], ma: string | null, ten: string | null): MonTonDau | string {
  const dang = matHang.filter(m => m.dang_dung);
  if (ma) {
    const theoMa = dang.find(m => m.ma.toUpperCase() === ma.trim().toUpperCase());
    if (theoMa) return theoMa;
    if (!ten) {
      // Cột "Mã/Tên" một ô: thử luôn như tên.
      return timMon(matHang, null, ma);
    }
  }
  if (ten) {
    const k = chuanTen(ten);
    const cungTen = dang.filter(m => chuanTen(m.ten) === k);
    if (cungTen.length === 1) return cungTen[0];
    if (cungTen.length > 1) {
      return `có ${cungTen.length} mặt hàng cùng tên "${ten}" (mã ${cungTen.map(m => m.ma).join(', ')}) — ghi Mã thay cho Tên`;
    }
    const ngung = matHang.some(m => !m.dang_dung && (chuanTen(m.ten) === k || m.ma.toUpperCase() === ten.trim().toUpperCase()));
    if (ngung) return `"${ten}" đã ngừng dùng — mở lại ở Mặt hàng hoặc bỏ dòng này`;
    return `không tìm thấy mặt hàng "${ma && ten ? `${ma} / ${ten}` : ten}"`;
  }
  if (ma) return `không tìm thấy mặt hàng mã "${ma}"`;
  return 'chưa ghi mặt hàng';
}

/** Tìm nơi để theo tên (bỏ dấu), hoặc "kho" / "quầy" khi chi nhánh chỉ có một chỗ loại đó. */
export function timNoi(viTri: NoiTonDau[], o: string): NoiTonDau | string {
  const ds = noiDeDuoc(viTri);
  const k = chuanTen(o);
  const cungTen = ds.filter(v => chuanTen(v.ten) === k);
  if (cungTen.length === 1) return cungTen[0];
  if (cungTen.length > 1) return `có ${cungTen.length} chỗ cùng tên "${o}" — đổi tên cho khác nhau ở Vị trí và lý do`;
  const loai = k === 'kho' || k === 'kho lanh' ? 'kho' : k === 'quay' || k === 'quay thit' || k === 'quay ban' ? 'quay' : null;
  if (loai) {
    const theoLoai = ds.filter(v => v.loai === loai);
    if (theoLoai.length === 1) return theoLoai[0];
    if (theoLoai.length > 1) return `có ${theoLoai.length} ${loai === 'kho' ? 'kho' : 'quầy'} — ghi đúng tên (${theoLoai.map(v => v.ten).join(', ')})`;
  }
  return `không có kho / quầy nào tên "${o}" (có: ${ds.map(v => v.ten).join(', ') || 'chưa có'})`;
}

/** Ô thô của một dòng, trước khi kiểm. */
interface ODong {
  nguon: string;
  ma: string | null; ten: string | null;
  noi: string | null;
  goi: string; kg: string; gia: string; han: string;
}

/** Kiểm một dòng thô → DongTonDau hoặc danh sách lỗi. Dùng chung cho bảng món và ô dán. */
function kiemDong(o: ODong, ctx: NguCanhTonDau, mon: MonTonDau | null): DongTonDau | string[] {
  const loi: string[] = [];
  let m: MonTonDau | null = mon;
  if (!m) {
    const t = timMon(ctx.matHang, o.ma, o.ten);
    if (typeof t === 'string') loi.push(t);
    else m = t;
  }
  let noi: NoiTonDau | null = null;
  if (o.noi) {
    const t = timNoi(ctx.viTri, o.noi);
    if (typeof t === 'string') loi.push(t);
    else noi = t;
  } else {
    noi = noiDeDuoc(ctx.viTri).find(v => v.id === ctx.viTriMacDinh) ?? null;
    if (!noi) loi.push('chưa ghi Nơi, và chưa chọn "Nơi để khi dòng không ghi"');
  }

  const kg = docKg(o.kg);
  if (kg === null) loi.push('chưa ghi số kg');
  else if (Number.isNaN(kg) || kg <= 0) loi.push(`số kg "${o.kg}" phải lớn hơn 0, ví dụ 12,5`);

  const goi = docSoNguyen(o.goi, 0, 100000);
  if (goi !== null && Number.isNaN(goi)) loi.push(`số ${m?.don_vi_goi ?? 'gói'} "${o.goi}" phải là số nguyên`);
  else if (m && m.dem_goi && !goi) loi.push(`chưa ghi số ${m.don_vi_goi}`);

  let gia: number | null = null;
  if (ctx.coGia) {
    gia = docTien(o.gia);
    if (gia !== null && Number.isNaN(gia)) loi.push(`đơn giá "${o.gia}" phải là số đồng, ví dụ 450000`);
  }

  const han = docHanDan(o.han);
  if (han === undefined) loi.push(`hạn dùng "${o.han}" không hiểu — ghi dạng 25/10/2026`);
  let hanSeDung: string | null = han ?? null;
  if (han === null && m) {
    if (m.han_dung_ngay === null) loi.push('chưa có hạn dùng, và mặt hàng chưa cài hạn mặc định');
    else if (docNgay(ctx.ngay)) hanSeDung = congNgay(ctx.ngay, m.han_dung_ngay);
  }

  if (loi.length || !m || !noi || kg === null || Number.isNaN(kg)) return loi;
  return {
    stt: 0, nguon: o.nguon,
    vi_tri_id: noi.id, ten_vi_tri: noi.ten,
    mat_hang_id: m.id, ten_mat_hang: m.ten, ma_mat_hang: m.ma, don_vi_goi: m.don_vi_goi,
    so_goi: goi && !Number.isNaN(goi) ? goi : 0,
    so_kg: kg,
    don_gia_kg: gia === null || Number.isNaN(gia) ? null : gia,
    han_dung: han ?? null,
    han_se_dung: hanSeDung,
  };
}

function danhSo(xt: XemTruocTonDau): XemTruocTonDau {
  xt.dong.forEach((d, i) => { d.stt = i + 1; });
  if (xt.dong.length > TOI_DA_DONG_TON_DAU) {
    xt.loi.push(`Mỗi lần tối đa ${TOI_DA_DONG_TON_DAU} dòng — chia làm nhiều lần.`);
  }
  return xt;
}

/**
 * Đọc ô dán từ Excel. Cột cách nhau bằng Tab (hoặc ; — một kiểu cho cả bảng;
 * không nhận dấu phẩy vì số kg viết "12,5"). Có dòng tiêu đề (từ hai tiêu đề hiểu được) thì cột xếp thứ tự
 * nào cũng được; không có thì theo COT_TON_DAU: Mã/Tên, Nơi, Gói, Kg, Đơn giá, HSD.
 * Dòng trống bị bỏ. "Dòng N" trong câu lỗi là số dòng trong ô dán.
 */
export function xemTruocDanTonDau(noiDung: string, ctx: NguCanhTonDau): XemTruocTonDau {
  const xt: XemTruocTonDau = { dong: [], loi: [], boQua: [] };
  // KHÔNG tách bằng dấu phẩy: "12,5" kg sẽ bị cắt thành 12 và 5 mà không ai biết.
  const ngan = noiDung.includes('\t') ? '\t' : ';';
  const hang = noiDung.split(/\r?\n/)
    .map((raw, i) => ({ so: i + 1, o: raw.split(ngan).map(boNgoacKep) }))
    .filter(h => h.o.some(x => x !== ''));
  if (hang.length === 0) return xt;

  let cot: (CotTonDau | undefined)[] = [...COT_TON_DAU];
  const dau = hang[0].o.map(cotCuaTieuDe);
  const hieu = dau.filter((c): c is CotTonDau => !!c);
  const coTieuDe = hieu.length >= 2;
  if (coTieuDe) {
    hang[0].o.forEach((o, i) => { if (o && !dau[i]) xt.boQua.push(o); });
    const lap = [...new Set(hieu.filter((c, i) => hieu.indexOf(c) !== i))];
    for (const c of lap) xt.loi.push(`Dòng tiêu đề: cột "${TEN_COT_TON_DAU[c]}" có hai lần — xóa bớt một cột`);
    if (!hieu.some(c => c === 'ma' || c === 'ten' || c === 'ma_ten')) xt.loi.push('Dòng tiêu đề cần có cột Mã hoặc Tên để biết là mặt hàng nào');
    if (!hieu.includes('kg')) xt.loi.push('Dòng tiêu đề cần có cột Kg');
    if (xt.loi.length) return xt;
    cot = dau;
    hang.shift();
  }
  if (!ctx.coGia && cot.includes('gia')) {
    xt.boQua.push('Đơn giá (tài khoản của bạn không điền giá — kế toán điền khi duyệt)');
  }

  for (const h of hang) {
    const lay = (c: CotTonDau) => { const i = cot.indexOf(c); return i < 0 ? '' : (h.o[i] ?? '').trim(); };
    const maTen = lay('ma_ten');
    let gia = lay('gia');
    let han = lay('han');
    // Không có dòng tiêu đề mà bảng bỏ cột Đơn giá (thủ kho hay làm vậy): HSD
    // rơi vào chỗ cột giá. Ngày có "/" hoặc "-" không thể là giá → coi là HSD,
    // đừng để thủ kho (cột giá bị bỏ qua) mất hạn dùng mà không biết.
    if (!coTieuDe && !han && /[/-]/.test(gia) && typeof docHanDan(gia) === 'string') { han = gia; gia = ''; }
    const o: ODong = {
      nguon: `dòng ${h.so} ô dán`,
      ma: lay('ma') || maTen || null,
      ten: lay('ten') || null,
      noi: lay('noi') || null,
      goi: lay('goi'), kg: lay('kg'), gia, han,
    };
    const kq = kiemDong(o, ctx, null);
    if (Array.isArray(kq)) {
      const tenMon = o.ten ?? o.ma;
      xt.loi.push(`Dòng ${h.so}${tenMon ? ` (${tenMon})` : ''}: ${kq.join('; ')}`);
    } else xt.dong.push(kq);
  }
  return danhSo(xt);
}

/** Tên ô của bảng món (form): mh_<i>, goi_<i>, kg_<i>, gia_<i>, han_<i>. */
export const O_LUOI = { mh: 'mh_', goi: 'goi_', kg: 'kg_', gia: 'gia_', han: 'han_' } as const;

/** Món hiện trong bảng của một vị trí: đang dùng, tảng → phần cắt → phụ phẩm (giữ thứ tự danh mục trong từng loại). */
export function monTrongLuoi(matHang: MonTonDau[]): MonTonDau[] {
  const thuTu = { tang: 0, phan_cat: 1, phu_pham: 2 } as const;
  return matHang
    .map((m, i) => ({ m, i }))
    .filter(x => x.m.dang_dung)
    .sort((a, b) => thuTu[a.m.loai] - thuTu[b.m.loai] || a.i - b.i)
    .map(x => x.m);
}

/**
 * Đọc bảng món của một vị trí (ctx.viTriMacDinh). Dòng để trống hết thì bỏ.
 * Id mặt hàng lấy từ ô ẩn mh_<i> và phải có trong danh mục đang dùng.
 */
export function docLuoiTonDau(form: FormData, ctx: NguCanhTonDau): XemTruocTonDau {
  const xt: XemTruocTonDau = { dong: [], loi: [], boQua: [] };
  const theoId = new Map(ctx.matHang.filter(m => m.dang_dung).map(m => [m.id, m]));
  const g = (k: string) => String(form.get(k) ?? '').trim();
  for (let i = 0; i < 2000; i++) {
    const id = form.get(O_LUOI.mh + i);
    if (id === null) break;
    const o: ODong = {
      nguon: '', ma: null, ten: null, noi: null,
      goi: g(O_LUOI.goi + i), kg: g(O_LUOI.kg + i), gia: ctx.coGia ? g(O_LUOI.gia + i) : '', han: g(O_LUOI.han + i),
    };
    if (!o.goi && !o.kg && !o.gia && !o.han) continue;
    const m = theoId.get(String(id));
    if (!m) { xt.loi.push('Danh mục vừa đổi — tải lại trang rồi nhập lại.'); break; }
    o.nguon = m.ten;
    const kq = kiemDong(o, ctx, m);
    if (Array.isArray(kq)) xt.loi.push(`${m.ten}: ${kq.join('; ')}`);
    else xt.dong.push(kq);
  }
  return danhSo(xt);
}

/** Tóm tắt theo vị trí (mỗi vị trí sẽ là một phiếu TD-), theo thứ tự xuất hiện. */
export function tomTatTheoViTri(dong: DongTonDau[]): { vi_tri_id: string; ten: string; so_dong: number; tong_kg: number }[] {
  const ra = new Map<string, { vi_tri_id: string; ten: string; so_dong: number; tong_kg: number }>();
  for (const d of dong) {
    const x = ra.get(d.vi_tri_id) ?? { vi_tri_id: d.vi_tri_id, ten: d.ten_vi_tri, so_dong: 0, tong_kg: 0 };
    x.so_dong++;
    // Cộng theo gam để 0,1 + 0,2 không ra 0,30000000000000004.
    x.tong_kg = Math.round(x.tong_kg * 1000 + d.so_kg * 1000) / 1000;
    ra.set(d.vi_tri_id, x);
  }
  return [...ra.values()];
}

/** Dòng gửi kho_luu_ton_dau_ky: chỉ các khóa database nhận, ô trống thì vắng. */
export interface DongGuiTonDau {
  vi_tri_id: string; mat_hang_id: string; so_goi: number; so_kg: number;
  don_gia_kg?: number; han_dung?: string;
}

export function dongGuiTonDau(dong: DongTonDau[]): DongGuiTonDau[] {
  return dong.map(d => {
    const g: DongGuiTonDau = { vi_tri_id: d.vi_tri_id, mat_hang_id: d.mat_hang_id, so_goi: d.so_goi, so_kg: d.so_kg };
    if (d.don_gia_kg !== null) g.don_gia_kg = d.don_gia_kg;
    if (d.han_dung) g.han_dung = d.han_dung;
    return g;
  });
}

/**
 * Đọc lại các dòng từ ô ẩn của form xác nhận. Chỉ kiểm HÌNH DẠNG (id, số, ngày) —
 * database kiểm lại mọi luật lúc ghi. null = ô ẩn hỏng (trang cũ / bị sửa tay).
 */
export function docDongGuiTonDau(json: string, coGia: boolean): DongGuiTonDau[] | null {
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return null; }
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > TOI_DA_DONG_TON_DAU) return null;
  const ra: DongGuiTonDau[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object') return null;
    const r = x as Record<string, unknown>;
    if (!laUuid(r.vi_tri_id) || !laUuid(r.mat_hang_id)) return null;
    if (typeof r.so_kg !== 'number' || !(r.so_kg > 0)) return null;
    if (typeof r.so_goi !== 'number' || !Number.isInteger(r.so_goi) || r.so_goi < 0) return null;
    const g: DongGuiTonDau = { vi_tri_id: r.vi_tri_id, mat_hang_id: r.mat_hang_id, so_goi: r.so_goi, so_kg: r.so_kg };
    if (r.don_gia_kg !== undefined && r.don_gia_kg !== null) {
      if (!coGia || typeof r.don_gia_kg !== 'number' || !Number.isInteger(r.don_gia_kg) || r.don_gia_kg < 0) return null;
      g.don_gia_kg = r.don_gia_kg;
    }
    if (r.han_dung !== undefined && r.han_dung !== null) {
      if (typeof r.han_dung !== 'string' || !docNgay(r.han_dung)) return null;
      g.han_dung = r.han_dung;
    }
    ra.push(g);
  }
  return ra;
}

/**
 * Dựng lại bảng xem trước từ các dòng đã gửi (khi database từ chối lúc xác nhận,
 * trang hiện lại đúng bảng đó cùng ma_gui cũ). Id không còn trong danh mục thì
 * hiện "?" — database sẽ báo lỗi dòng đó.
 */
export function dongTuGui(gui: DongGuiTonDau[], ctx: Pick<NguCanhTonDau, 'matHang' | 'viTri' | 'ngay'>): DongTonDau[] {
  const mh = new Map(ctx.matHang.map(m => [m.id, m]));
  const vt = new Map(ctx.viTri.map(v => [v.id, v]));
  return gui.map((g, i) => {
    const m = mh.get(g.mat_hang_id);
    const hanMacDinh = m && m.han_dung_ngay !== null && docNgay(ctx.ngay) ? congNgay(ctx.ngay, m.han_dung_ngay) : null;
    return {
      stt: i + 1, nguon: m?.ten ?? '?',
      vi_tri_id: g.vi_tri_id, ten_vi_tri: vt.get(g.vi_tri_id)?.ten ?? '?',
      mat_hang_id: g.mat_hang_id, ten_mat_hang: m?.ten ?? '?', ma_mat_hang: m?.ma ?? '', don_vi_goi: m?.don_vi_goi ?? 'gói',
      so_goi: g.so_goi, so_kg: g.so_kg, don_gia_kg: g.don_gia_kg ?? null,
      han_dung: g.han_dung ?? null, han_se_dung: g.han_dung ?? hanMacDinh,
    };
  });
}

/** Kết quả kho_luu_ton_dau_ky → câu báo. */
export interface PhieuTonDauMoi { vi_tri_id: string; phieu_id: string; so_phieu: string; trang_thai: string; so_dong: number }

export function cauDaLuuTonDau(phieu: PhieuTonDauMoi[], daCo: boolean, tenViTri: Map<string, string>): string {
  if (phieu.length === 0) return 'Chưa tạo phiếu nào.';
  const ds = phieu.map(p => {
    const noi = tenViTri.get(p.vi_tri_id);
    return `${p.so_phieu}${noi ? ` (${noi}, ${p.so_dong} dòng)` : ''}`;
  }).join(', ');
  const daDuyet = phieu.every(p => p.trang_thai === 'da_duyet');
  const choDuyet = phieu.every(p => p.trang_thai === 'cho_duyet');
  const duoi = daDuyet ? 'đã duyệt, hàng đã vào tồn kho.'
    : choDuyet ? 'đang chờ duyệt — quản lý / kế toán điền giá rồi duyệt ở màn Duyệt.'
      : 'xem trạng thái ở danh sách phiếu.';
  return `${daCo ? 'Lượt này đã ghi từ trước' : `Đã tạo ${phieu.length} phiếu tồn đầu kỳ`}: ${ds} — ${duoi}`;
}

// =============================================================================
// GỌI DATABASE
// =============================================================================

export async function docTienDo(client: SupabaseClient, chiNhanhId: string): Promise<TienDoThietLap> {
  const { data, error } = await client.rpc('kho_tien_do_thiet_lap', { p_chi_nhanh_id: chiNhanhId });
  if (error) throw error;
  return docTienDoTho(data);
}

/** Đánh dấu / bỏ đánh dấu "bỏ qua" một bước. */
export async function danhDauBuoc(
  client: SupabaseClient, chiNhanhId: string, buoc: string, boQua: boolean,
): Promise<KetQua> {
  const b = BUOC_THIET_LAP.find(x => x.khoa === buoc);
  if (!b || !b.boQua) return { ok: false, cau: 'Bước này không bỏ qua được.' };
  const { error } = await client.rpc('kho_danh_dau_thiet_lap', {
    p_chi_nhanh_id: chiNhanhId, p_buoc: buoc, p_bo_qua: boQua,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return {
    ok: true,
    cau: boQua ? `Đã đánh dấu bỏ qua bước "${b.ten}".` : `Bước "${b.ten}" lại tính là chưa xong cho tới khi làm.`,
  };
}

/** Giá trị 5 ngưỡng đang dùng và lần lưu cuối. null = chi nhánh chưa khởi tạo kho. */
export async function docNguong(client: SupabaseClient, chiNhanhId: string): Promise<NguongDangDung | null> {
  const { data, error } = await client
    .from('kho_cai_dat')
    .select('nguong_gia_mua_pt, nguong_thu_hoi_diem, gio_nhac_chuyen, gio_chot_ngay, nguong_dinh_muc_pt, nguong_luu_luc')
    .eq('chi_nhanh_id', chiNhanhId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as Record<string, unknown>;
  return {
    gia_tri: Object.fromEntries(KHOA_NGUONG.map(kh => [kh, soHoacNull(r[kh])])),
    luu_luc: typeof r.nguong_luu_luc === 'string' ? r.nguong_luu_luc : null,
  };
}

/** Mặt hàng cho lưới tồn đầu kỳ — chỉ cột không có tiền (thủ kho cũng mở trang này). */
export async function docMonTonDau(client: SupabaseClient): Promise<MonTonDau[]> {
  const { data, error } = await client
    .from('kho_mat_hang')
    .select('id, ma, ten, loai, dem_goi, don_vi_goi, han_dung_ngay, dang_dung')
    .order('loai').order('thu_tu').order('ten');
  if (error) throw error;
  return (data ?? []).map(r => ({ ...r, han_dung_ngay: r.han_dung_ngay === null ? null : Number(r.han_dung_ngay) })) as MonTonDau[];
}

/** Ghi tồn đầu kỳ: mỗi vị trí một phiếu TD-. Gửi lại cùng ma_gui → trả đúng các phiếu cũ. */
export async function luuTonDauKy(
  client: SupabaseClient, chiNhanhId: string, maGui: string, ngay: string, dong: DongGuiTonDau[],
): Promise<KetQua & { phieu?: PhieuTonDauMoi[]; daCo?: boolean }> {
  if (!laUuid(maGui)) return { ok: false, cau: 'Trang đã cũ — tải lại trang rồi làm lại.' };
  const { data, error } = await client.rpc('kho_luu_ton_dau_ky', {
    p_chi_nhanh_id: chiNhanhId, p_ma_gui: maGui, p_ngay: ngay, p_dong: dong,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const d = (data ?? {}) as { da_co?: boolean; phieu?: PhieuTonDauMoi[] };
  return { ok: true, cau: '', phieu: d.phieu ?? [], daCo: d.da_co === true };
}
