/**
 * KHO — BÁO CÁO
 *
 * Bốn báo cáo đều là hàm SECURITY INVOKER trong database (0024): người gọi
 * chỉ thấy số của chi nhánh mình, vai không xem giá nhận cột tiền bằng 0. File
 * này chỉ gọi hàm, khai báo cột để hiện bảng và xuất CSV.
 *
 * Bán hàng dùng kho_bao_cao_ban_thuc (0037): doanh thu thật từ iPOS, phần
 * trước khi nối iPOS vẫn là ước tính (cột "Nguồn").
 *
 * Xuất – nhập – tồn dùng kho_bao_cao_xnt_v2 (0032): thêm cột xuất khác và hao
 * hụt (mất khi mang ra quầy), tách khỏi kiểm kê. Hàm cũ vẫn còn trong database.
 *
 * CSV cho Excel tiếng Việt: UTF-8 có BOM (không thì Excel hiện "Tháº¥n"),
 * dấu chấm phẩy ngăn cột (Excel máy cài tiếng Việt coi dấu phẩy là dấu thập
 * phân), kg dùng dấu phẩy thập phân, tiền là số nguyên không dấu phân cách.
 * Dòng đầu ghi chi nhánh + tên báo cáo + kỳ (in ra hay gửi đi vẫn biết là số
 * của kỳ nào), dòng cuối là tổng — kế toán không phải cộng lại trong Excel.
 *
 * HAI THỨ TIẾNG (lib/ngon-ngu-noi-bo.ts)
 *
 * Mỗi định nghĩa báo cáo viết MỘT lần, chữ dạng { vi, en } (DinhNghiaHai);
 * dinhNghiaTheoTieng() dựng ra DinhNghiaBaoCao của một thứ tiếng — bảng trên
 * trang, dòng tổng và file CSV đều đọc bản đó. Bảng tên cũ (BAO_CAO,
 * DN_SO_THANH_TOAN, COT_CONG_NO, TEN_…) là bản tiếng Việt, dựng lại từ bản
 * `…_NB`; hàm có chữ nhận `nn` ở cuối, mặc định tiếng Việt như trước. File CSV
 * đổi tên cột / nhãn theo ngôn ngữ người tải, khuôn file giữ nguyên.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, congNgay, dinhDangNgay, docTungTrang, duoc, type ViecKho, type HaiThuTieng, type NgonNguNB } from './chung.ts';

export type KieuCot = 'chu' | 'kg' | 'tien' | 'so' | 'pt';
export interface CotBaoCao { khoa: string; ten: string; kieu: KieuCot; tienMat?: boolean }

export interface DinhNghiaBaoCao {
  ten: string;
  moTa: string;
  cot: CotBaoCao[];
  /** Cột được cộng ở dòng tổng cuối bảng (và cuối file Excel). */
  cong?: string[];
  /**
   * Cột không cộng thẳng được (tỉ lệ %) — dòng tổng tính lại từ tổng hai cột:
   * tổng(tử) ÷ tổng(mẫu) × nhân. Vd thu hồi chung = kg thịt ÷ kg vào × 100.
   */
  chiaTong?: Record<string, { tu: string; mau: string; nhan?: number }>;
  /**
   * Cộng RIÊNG theo từng giá trị của cột này, không gộp một tổng chung.
   * Báo cáo hủy / xuất bếp / chênh lệch: cộng "thừa" với "thiếu" hay "hủy" với
   * "trả nhà cung cấp" thành một số là sai nghĩa.
   */
  tongTheo?: string;
  /** Bảng trống: nói việc gì sinh ra số liệu và chỗ làm việc đó. */
  khiTrong: { cau: string; link: { ten: string; href: string }[] };
}

// -----------------------------------------------------------------------------
// ĐỊNH NGHĨA HAI THỨ TIẾNG → MỘT THỨ TIẾNG
// -----------------------------------------------------------------------------
/** Cột viết một lần, tên hai thứ tiếng. */
export interface CotHai { khoa: string; ten: HaiThuTieng; kieu: KieuCot; tienMat?: boolean }

/** Định nghĩa báo cáo viết một lần, chữ hai thứ tiếng (cùng khuôn DinhNghiaBaoCao). */
export interface DinhNghiaHai {
  ten: HaiThuTieng;
  moTa: HaiThuTieng;
  cot: CotHai[];
  cong?: string[];
  chiaTong?: DinhNghiaBaoCao['chiaTong'];
  tongTheo?: string;
  khiTrong: { cau: HaiThuTieng; link: { ten: HaiThuTieng; href: string }[] };
}

/** Cột hai thứ tiếng → cột của một thứ tiếng. */
export function cotTheoTieng(cot: CotHai[], nn: NgonNguNB = 'vi'): CotBaoCao[] {
  return cot.map(c => ({ ...c, ten: c.ten[nn] }));
}

/** Định nghĩa hai thứ tiếng → DinhNghiaBaoCao của một thứ tiếng (bảng, dòng tổng, CSV đọc bản này). */
export function dinhNghiaTheoTieng(d: DinhNghiaHai, nn: NgonNguNB = 'vi'): DinhNghiaBaoCao {
  return {
    ...d,
    ten: d.ten[nn],
    moTa: d.moTa[nn],
    cot: cotTheoTieng(d.cot, nn),
    khiTrong: { cau: d.khiTrong.cau[nn], link: d.khiTrong.link.map(l => ({ ...l, ten: l.ten[nn] })) },
  };
}

/** Cả hai bản của một định nghĩa — giá trị của các bảng `…_NB`. */
function haiBan(d: DinhNghiaHai): HaiThuTieng<DinhNghiaBaoCao> {
  return { vi: dinhNghiaTheoTieng(d, 'vi'), en: dinhNghiaTheoTieng(d, 'en') };
}

/** Bảng nhãn hai thứ tiếng → bảng chỉ tiếng Việt (tên cũ). */
function chiVi(bang: Record<string, HaiThuTieng>): Record<string, string> {
  return Object.fromEntries(Object.entries(bang).map(([k, v]) => [k, v.vi]));
}

/** Tên link tới trang làm việc sinh ra số liệu (bảng trống). */
const LINK = {
  nhap: { vi: 'Nhập hàng', en: 'Goods receipts' },
  phaLoc: { vi: 'Pha lóc', en: 'Butchery' },
  xuat: { vi: 'Chuyển · xuất · hủy', en: 'Transfer · issue · write-off' },
  kiemKe: { vi: 'Kiểm kê', en: 'Stocktake' },
  banIpos: { vi: 'Bán hàng iPOS', en: 'iPOS sales' },
  ton: { vi: 'Tồn kho', en: 'Stock on hand' },
  congNo: { vi: 'Công nợ', en: 'Payables' },
} satisfies Record<string, HaiThuTieng>;

const BAO_CAO_HAI: Record<string, DinhNghiaHai> = {
  'xuat-nhap-ton': {
    ten: { vi: 'Xuất – nhập – tồn', en: 'Stock movement' },
    moTa: {
      vi: 'Theo mặt hàng, theo ngày chứng từ. Chuyển giữa kho và quầy không tính. Hao hụt = hàng mất khi mang ra quầy. Giá trị theo giá vốn từng lô.',
      en: 'By item, by document date. Transfers between the store and the counter are not counted. Loss = goods lost on the way to the counter. Values at the cost of each lot.',
    },
    cot: [
      { khoa: 'ten', ten: { vi: 'Mặt hàng', en: 'Item' }, kieu: 'chu' },
      { khoa: 'dau_kg', ten: { vi: 'Tồn đầu kg', en: 'Opening kg' }, kieu: 'kg' },
      { khoa: 'dau_gia_tri', ten: { vi: 'Tồn đầu tiền', en: 'Opening value' }, kieu: 'tien', tienMat: true },
      { khoa: 'nhap_kg', ten: { vi: 'Nhập kg', en: 'Received kg' }, kieu: 'kg' },
      { khoa: 'nhap_gia_tri', ten: { vi: 'Nhập tiền', en: 'Received value' }, kieu: 'tien', tienMat: true },
      { khoa: 'pha_ra_kg', ten: { vi: 'Pha lóc ra kg', en: 'From butchery kg' }, kieu: 'kg' },
      { khoa: 'pha_vao_kg', ten: { vi: 'Đem pha kg', en: 'Into butchery kg' }, kieu: 'kg' },
      { khoa: 'ban_kg', ten: { vi: 'Bán kg', en: 'Sold kg' }, kieu: 'kg' },
      { khoa: 'ban_gia_tri', ten: { vi: 'Bán giá vốn', en: 'Sold at cost' }, kieu: 'tien', tienMat: true },
      { khoa: 'xuat_bep_kg', ten: { vi: 'Xuất bếp kg', en: 'To kitchen kg' }, kieu: 'kg' },
      { khoa: 'xuat_bep_gia_tri', ten: { vi: 'Xuất bếp tiền', en: 'To kitchen value' }, kieu: 'tien', tienMat: true },
      { khoa: 'xuat_khac_kg', ten: { vi: 'Xuất khác kg', en: 'Other issue kg' }, kieu: 'kg' },
      { khoa: 'xuat_khac_gia_tri', ten: { vi: 'Xuất khác tiền', en: 'Other issue value' }, kieu: 'tien', tienMat: true },
      { khoa: 'huy_kg', ten: { vi: 'Hủy kg', en: 'Write-off kg' }, kieu: 'kg' },
      { khoa: 'huy_gia_tri', ten: { vi: 'Hủy tiền', en: 'Write-off value' }, kieu: 'tien', tienMat: true },
      { khoa: 'tra_ncc_kg', ten: { vi: 'Trả NCC kg', en: 'Supplier return kg' }, kieu: 'kg' },
      { khoa: 'kiem_ke_kg', ten: { vi: 'Kiểm kê ± kg', en: 'Stocktake ± kg' }, kieu: 'kg' },
      { khoa: 'kiem_ke_gia_tri', ten: { vi: 'Kiểm kê ± tiền', en: 'Stocktake ± value' }, kieu: 'tien', tienMat: true },
      { khoa: 'hao_hut_kg', ten: { vi: 'Hao hụt kg', en: 'Loss kg' }, kieu: 'kg' },
      { khoa: 'hao_hut_gia_tri', ten: { vi: 'Hao hụt tiền', en: 'Loss value' }, kieu: 'tien', tienMat: true },
      { khoa: 'cuoi_kg', ten: { vi: 'Tồn cuối kg', en: 'Closing kg' }, kieu: 'kg' },
      { khoa: 'cuoi_gia_tri', ten: { vi: 'Tồn cuối tiền', en: 'Closing value' }, kieu: 'tien', tienMat: true },
    ],
    cong: [
      'dau_kg', 'dau_gia_tri', 'nhap_kg', 'nhap_gia_tri', 'pha_ra_kg', 'pha_vao_kg',
      'ban_kg', 'ban_gia_tri', 'xuat_bep_kg', 'xuat_bep_gia_tri', 'xuat_khac_kg', 'xuat_khac_gia_tri',
      'huy_kg', 'huy_gia_tri', 'tra_ncc_kg', 'kiem_ke_kg', 'kiem_ke_gia_tri', 'hao_hut_kg', 'hao_hut_gia_tri',
      'cuoi_kg', 'cuoi_gia_tri',
    ],
    khiTrong: {
      cau: {
        vi: 'Kho chưa có hàng nào tính tới ngày cuối kỳ. Số liệu có khi phiếu nhập hàng được duyệt',
        en: 'There is no stock up to the last day of the period. Figures appear once goods receipts are approved',
      },
      link: [{ ten: LINK.nhap, href: '/noi-bo/kho/nhap' }],
    },
  },
  'thu-hoi': {
    ten: { vi: 'Thu hồi pha lóc', en: 'Butchery yield' },
    moTa: {
      vi: 'Theo loại tảng và nhà cung cấp. Thu hồi = kg thịt giữ lại ÷ kg tảng. Phiên dùng tảng của nhiều nhà cung cấp được chia theo kg từng lô.',
      en: 'By primal and supplier. Yield = kg of meat kept ÷ kg of primal. Sessions that used primals from several suppliers are split by the kg of each lot.',
    },
    cot: [
      { khoa: 'ten_mat_hang', ten: { vi: 'Tảng', en: 'Primal' }, kieu: 'chu' },
      { khoa: 'ten_nha_cung_cap', ten: { vi: 'Nhà cung cấp', en: 'Supplier' }, kieu: 'chu' },
      { khoa: 'so_phien', ten: { vi: 'Số phiên', en: 'Sessions' }, kieu: 'so' },
      { khoa: 'kg_vao', ten: { vi: 'Kg vào', en: 'Kg in' }, kieu: 'kg' },
      { khoa: 'kg_thit', ten: { vi: 'Kg thịt', en: 'Kg meat' }, kieu: 'kg' },
      { khoa: 'kg_phu_pham', ten: { vi: 'Kg phụ phẩm', en: 'Kg by-products' }, kieu: 'kg' },
      { khoa: 'kg_bo', ten: { vi: 'Kg bỏ', en: 'Kg discarded' }, kieu: 'kg' },
      { khoa: 'kg_hao_hut', ten: { vi: 'Kg hao hụt', en: 'Kg lost' }, kieu: 'kg' },
      { khoa: 'ty_le_thu_hoi', ten: { vi: 'Thu hồi %', en: 'Yield %' }, kieu: 'pt' },
      { khoa: 'gia_von_vao_kg', ten: { vi: 'Giá vốn tảng/kg', en: 'Primal cost/kg' }, kieu: 'tien', tienMat: true },
      { khoa: 'gia_von_thit_kg', ten: { vi: 'Giá vốn thịt/kg', en: 'Meat cost/kg' }, kieu: 'tien', tienMat: true },
    ],
    // Số phiên không cộng: phiên dùng tảng của hai nhà cung cấp nằm ở hai dòng.
    // Giá vốn / kg không cộng: mỗi loại tảng một giá.
    cong: ['kg_vao', 'kg_thit', 'kg_phu_pham', 'kg_bo', 'kg_hao_hut'],
    chiaTong: { ty_le_thu_hoi: { tu: 'kg_thit', mau: 'kg_vao', nhan: 100 } },
    khiTrong: {
      cau: { vi: 'Chưa có phiên pha lóc nào chốt trong kỳ', en: 'No butchery session was closed in this period' },
      link: [{ ten: LINK.phaLoc, href: '/noi-bo/kho/pha-loc' }],
    },
  },
  'hao-hut': {
    ten: { vi: 'Hủy, xuất bếp, chênh lệch', en: 'Write-offs, kitchen issues, differences' },
    moTa: {
      vi: 'Hàng rời kho không qua bán: hủy (theo lý do), xuất bếp, xuất khác (theo lý do), trả nhà cung cấp, thiếu / thừa khi kiểm kê, mất khi mang ra quầy.',
      en: 'Goods that left stock without being sold: write-offs (by reason), issues to the kitchen, other issues (by reason), returns to suppliers, stocktake shortages / surpluses, losses on the way to the counter.',
    },
    cot: [
      { khoa: 'loai_dong', ten: { vi: 'Loại', en: 'Type' }, kieu: 'chu' },
      { khoa: 'ten', ten: { vi: 'Mặt hàng', en: 'Item' }, kieu: 'chu' },
      { khoa: 'ly_do', ten: { vi: 'Lý do', en: 'Reason' }, kieu: 'chu' },
      { khoa: 'so_kg', ten: { vi: 'Kg', en: 'Kg' }, kieu: 'kg' },
      { khoa: 'so_goi', ten: { vi: 'Gói', en: 'Packs' }, kieu: 'so' },
      { khoa: 'gia_tri', ten: { vi: 'Giá vốn', en: 'Cost' }, kieu: 'tien', tienMat: true },
    ],
    cong: ['so_kg', 'so_goi', 'gia_tri'],
    tongTheo: 'loai_dong',
    khiTrong: {
      cau: {
        vi: 'Chưa có phiếu hủy, xuất bếp, xuất khác, trả nhà cung cấp hay kiểm kê lệch sổ nào được duyệt trong kỳ',
        en: 'No write-off, kitchen issue, other issue, supplier return or stocktake difference was approved in this period',
      },
      link: [{ ten: LINK.xuat, href: '/noi-bo/kho/xuat' }, { ten: LINK.kiemKe, href: '/noi-bo/kho/kiem-ke' }],
    },
  },
  // GĐ7a (0037): kho_bao_cao_ban_thuc — mỗi món tối đa hai dòng theo "Nguồn":
  // iPOS (doanh thu THẬT từ hóa đơn) và Ước tính (thiếu khi đếm quầy × giá bán
  // hiện tại, trước khi nối iPOS). Tổng cộng riêng từng nguồn — cộng số thật với
  // số ước tính thành một con số là sai nghĩa. Database chưa có 0037 thì đọc
  // hàm cũ kho_bao_cao_ban, mọi dòng là "Ước tính" (docBaoCao).
  ban: {
    ten: { vi: 'Bán hàng', en: 'Sales' },
    moTa: {
      vi: 'Nguồn iPOS: doanh thu thật từ hóa đơn iPOS đã trừ kho. Nguồn Ước tính: phần thiếu khi đếm quầy (trước khi nối iPOS), nhân giá bán HIỆN TẠI trong danh mục. Giá vốn theo lô.',
      en: 'Source iPOS: real revenue from iPOS invoices already deducted from stock. Source Estimated: what was missing in counter counts (before iPOS was connected), times the CURRENT sale price in the catalog. Cost by lot.',
    },
    cot: [
      { khoa: 'ten', ten: { vi: 'Mặt hàng', en: 'Item' }, kieu: 'chu' },
      { khoa: 'nguon', ten: { vi: 'Nguồn', en: 'Source' }, kieu: 'chu' },
      { khoa: 'so_goi', ten: { vi: 'Gói', en: 'Packs' }, kieu: 'so' },
      { khoa: 'so_kg', ten: { vi: 'Kg', en: 'Kg' }, kieu: 'kg' },
      { khoa: 'doanh_thu', ten: { vi: 'Doanh thu', en: 'Revenue' }, kieu: 'tien' },
      { khoa: 'gia_von', ten: { vi: 'Giá vốn', en: 'Cost' }, kieu: 'tien', tienMat: true },
      { khoa: 'lai_gop', ten: { vi: 'Lãi gộp', en: 'Gross profit' }, kieu: 'tien', tienMat: true },
    ],
    cong: ['so_goi', 'so_kg', 'doanh_thu', 'gia_von', 'lai_gop'],
    tongTheo: 'nguon',
    khiTrong: {
      cau: {
        vi: 'Chưa có số bán trong kỳ. Số bán có khi hóa đơn iPOS được trừ kho, hoặc (chưa nối iPOS) khi phiếu kiểm kê quầy được duyệt và quầy thiếu hàng so với sổ',
        en: 'No sales in this period yet. Sales appear when iPOS invoices are deducted from stock, or (before iPOS is connected) when a counter stocktake is approved and the counter is short against the books',
      },
      link: [{ ten: LINK.banIpos, href: '/noi-bo/kho/ban-ipos' }, { ten: LINK.kiemKe, href: '/noi-bo/kho/kiem-ke' }],
    },
  },
};

/** Bốn báo cáo theo kỳ ở hai thứ tiếng: BAO_CAO_NB[ten][nn]. */
export const BAO_CAO_NB: Record<string, HaiThuTieng<DinhNghiaBaoCao>> = Object.fromEntries(
  Object.entries(BAO_CAO_HAI).map(([ten, d]) => [ten, haiBan(d)]),
);
export const BAO_CAO: Record<string, DinhNghiaBaoCao> = Object.fromEntries(
  Object.entries(BAO_CAO_NB).map(([ten, d]) => [ten, d.vi]),
);

/** Cột của file công nợ (từ view kho_v_cong_no_phieu). */
const COT_CONG_NO_HAI: CotHai[] = [
  { khoa: 'so_phieu', ten: { vi: 'Phiếu nhập', en: 'Goods receipt' }, kieu: 'chu' },
  // "Nhập mua" / "Nợ đầu kỳ" (0035) — file .csv.ts điền theo ngôn ngữ người tải.
  { khoa: 'loai_cong_no', ten: { vi: 'Loại', en: 'Type' }, kieu: 'chu' },
  { khoa: 'ten_nha_cung_cap', ten: { vi: 'Nhà cung cấp', en: 'Supplier' }, kieu: 'chu' },
  { khoa: 'ngay_nhap', ten: { vi: 'Ngày nhập', en: 'Receipt date' }, kieu: 'chu' },
  { khoa: 'so_hoa_don', ten: { vi: 'Số hóa đơn', en: 'Invoice no.' }, kieu: 'chu' },
  { khoa: 'ngay_hoa_don', ten: { vi: 'Ngày hóa đơn', en: 'Invoice date' }, kieu: 'chu' },
  { khoa: 'han_thanh_toan', ten: { vi: 'Hạn thanh toán', en: 'Due date' }, kieu: 'chu' },
  { khoa: 'tong_tien_phieu', ten: { vi: 'Tổng phiếu', en: 'Receipt total' }, kieu: 'tien' },
  { khoa: 'tien_hoa_don', ten: { vi: 'Tiền hóa đơn', en: 'Invoice amount' }, kieu: 'tien' },
  { khoa: 'phai_tra', ten: { vi: 'Phải trả', en: 'Payable' }, kieu: 'tien' },
  { khoa: 'da_tra', ten: { vi: 'Đã trả', en: 'Paid' }, kieu: 'tien' },
  { khoa: 'giam_tru', ten: { vi: 'Giảm trừ', en: 'Deductions' }, kieu: 'tien' },
  { khoa: 'con_no', ten: { vi: 'Còn nợ', en: 'Outstanding' }, kieu: 'tien' },
  { khoa: 'so_ngay_qua_han', ten: { vi: 'Số ngày quá hạn', en: 'Days overdue' }, kieu: 'so' },
];
export const COT_CONG_NO_NB: HaiThuTieng<CotBaoCao[]> = {
  vi: cotTheoTieng(COT_CONG_NO_HAI, 'vi'), en: cotTheoTieng(COT_CONG_NO_HAI, 'en'),
};
export const COT_CONG_NO: CotBaoCao[] = COT_CONG_NO_NB.vi;

/** Cột "Nguồn" của báo cáo bán (0037). */
export const TEN_NGUON_BAN_NB: Record<string, HaiThuTieng> = {
  ipos: { vi: 'iPOS', en: 'iPOS' },
  uoc_tinh: { vi: 'Ước tính', en: 'Estimated' },
};
export const TEN_NGUON_BAN: Record<string, string> = chiVi(TEN_NGUON_BAN_NB);

export const TEN_LOAI_DONG_HAO_HUT_NB: Record<string, HaiThuTieng> = {
  huy: { vi: 'Hủy', en: 'Write-off' },
  xuat_bep: { vi: 'Xuất bếp', en: 'To kitchen' },
  xuat_khac: { vi: 'Xuất khác', en: 'Other issue' },
  tra_ncc: { vi: 'Trả nhà cung cấp', en: 'Returned to supplier' },
  kiem_ke_thieu: { vi: 'Kiểm kê thiếu', en: 'Stocktake shortage' },
  kiem_ke_thua: { vi: 'Kiểm kê thừa', en: 'Stocktake surplus' },
  // 0032: hàng mất khi mang ra quầy (quản lý "ghi mất" phần quầy nhận thiếu).
  hao_hut: { vi: 'Hao hụt', en: 'Loss' },
};
export const TEN_LOAI_DONG_HAO_HUT: Record<string, string> = chiVi(TEN_LOAI_DONG_HAO_HUT_NB);

/** Câu của thư viện báo cáo (trả về trang / file). */
const CAU_BAO_CAO = {
  khongCo: { vi: 'Không có báo cáo này.', en: 'There is no such report.' },
  nccKhongRo: { vi: '(tồn đầu / không rõ)', en: '(opening stock / unknown)' },
  tong: { vi: 'Tổng', en: 'Total' },
} satisfies Record<string, HaiThuTieng>;

/** Nhãn dòng tổng của từng nhóm (tongTheo): "Cộng Hủy". */
const CONG_NHOM: HaiThuTieng<(nhom: string) => string> = {
  vi: (nhom: string) => `Cộng ${nhom}`,
  en: (nhom: string) => `Total: ${nhom}`,
};

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export async function docBaoCao(
  client: SupabaseClient, ten: string, chiNhanhId: string, tu: string, den: string, nn: NgonNguNB = 'vi',
): Promise<{ dong: Record<string, unknown>[]; loi: string | null }> {
  let kq: { data: unknown; error: { message: string } | null };
  if (ten === 'xuat-nhap-ton') kq = await client.rpc('kho_bao_cao_xnt_v2', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
  else if (ten === 'thu-hoi') kq = await client.rpc('kho_bao_cao_thu_hoi', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
  else if (ten === 'hao-hut') kq = await client.rpc('kho_bao_cao_hao_hut', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
  else if (ten === 'ban') {
    kq = await client.rpc('kho_bao_cao_ban_thuc', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
    // Database chưa chạy 0037: hàm cũ, mọi dòng là ước tính (đổi tên cột cho khớp bảng).
    if (kq.error && /kho_bao_cao_ban_thuc|could not find|does not exist/i.test(kq.error.message)) {
      const cu = await client.rpc('kho_bao_cao_ban', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
      kq = cu.error ? cu : {
        data: ((cu.data ?? []) as Record<string, unknown>[]).map(d => ({
          ...d, nguon: 'uoc_tinh', doanh_thu: d.doanh_thu_uoc_tinh, lai_gop: d.lai_gop_uoc_tinh,
        })),
        error: null,
      };
    }
  } else return { dong: [], loi: CAU_BAO_CAO.khongCo[nn] };
  if (kq.error) return { dong: [], loi: cauLoiKho(kq.error) };
  const dong = (kq.data ?? []) as Record<string, unknown>[];
  if (ten === 'hao-hut') for (const d of dong) d.loai_dong = TEN_LOAI_DONG_HAO_HUT_NB[String(d.loai_dong)]?.[nn] ?? d.loai_dong;
  if (ten === 'ban') for (const d of dong) d.nguon = TEN_NGUON_BAN_NB[String(d.nguon)]?.[nn] ?? d.nguon;
  if (ten === 'thu-hoi') for (const d of dong) d.ten_nha_cung_cap = d.ten_nha_cung_cap ?? CAU_BAO_CAO.nccKhongRo[nn];
  return { dong, loi: null };
}

// -----------------------------------------------------------------------------
// DÒNG TỔNG — hàm thuần, trang và file Excel dùng chung
// -----------------------------------------------------------------------------
export interface DongTong {
  /** Chữ ở cột đầu: "Tổng", hoặc "Cộng Hủy", "Cộng Xuất bếp"… */
  nhan: string;
  /** Số theo khóa cột. Cột không có ở đây thì để trống. */
  so: Record<string, number>;
}

/** Làm tròn như cách hiện ô: kg 3 số lẻ (bỏ lỗi cộng số thực 0,1 + 0,2), tiền số nguyên. */
function lamTron(x: number, kieu: KieuCot | undefined): number {
  if (kieu === 'kg') return Math.round(x * 1000) / 1000;
  if (kieu === 'pt') return Math.round(x * 100) / 100;
  return Math.round(x);
}

export function tinhTong(dn: DinhNghiaBaoCao, dong: Record<string, unknown>[], nn: NgonNguNB = 'vi'): DongTong[] {
  if (dong.length === 0 || (!dn.cong?.length && !dn.chiaTong)) return [];
  const kieu = new Map(dn.cot.map(c => [c.khoa, c.kieu]));
  const nhom = new Map<string, Record<string, unknown>[]>();
  for (const d of dong) {
    const khoaNhom = dn.tongTheo ? String(d[dn.tongTheo] ?? '') : '';
    const ds = nhom.get(khoaNhom);
    if (ds) ds.push(d); else nhom.set(khoaNhom, [d]);
  }
  return [...nhom].map(([khoaNhom, ds]) => {
    const cong = (khoa: string) => ds.reduce((s, d) => s + (Number(d[khoa]) || 0), 0);
    const so: Record<string, number> = {};
    for (const khoa of dn.cong ?? []) so[khoa] = lamTron(cong(khoa), kieu.get(khoa));
    for (const [khoa, { tu, mau, nhan = 1 }] of Object.entries(dn.chiaTong ?? {})) {
      const m = cong(mau);
      if (m !== 0) so[khoa] = lamTron(cong(tu) / m * nhan, kieu.get(khoa));
    }
    return { nhan: dn.tongTheo ? CONG_NHOM[nn](khoaNhom) : CAU_BAO_CAO.tong[nn], so };
  });
}

// -----------------------------------------------------------------------------
// CSV — hàm thuần
// -----------------------------------------------------------------------------
function oCsv(v: unknown, kieu: KieuCot): string {
  if (v === null || v === undefined || v === '') return '';
  let s: string;
  if (kieu === 'kg' || kieu === 'pt') s = String(Number(v)).replace('.', ',');
  else if (kieu === 'tien' || kieu === 'so') s = String(Math.round(Number(v)));
  else s = String(v);
  // Chặn "công thức" khi mở bằng Excel (=, +, -, @, tab, xuống dòng ở đầu ô chữ).
  if (kieu === 'chu' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface TuyChonCsv {
  /** Dòng đầu file, một ô (vd "Beeftown Quận 1 · Xuất – nhập – tồn · 01/09/2026–25/09/2026"). */
  tieuDe?: string;
  /** Dòng tổng ở cuối file (từ tinhTong). */
  tong?: DongTong[];
}

export function taoCsv(cot: CotBaoCao[], dong: Record<string, unknown>[], tuyChon: TuyChonCsv = {}): string {
  const tieuDe = tuyChon.tieuDe ? [oCsv(tuyChon.tieuDe, 'chu')] : [];
  const dau = cot.map(c => oCsv(c.ten, 'chu')).join(';');
  const than = dong.map(d => cot.map(c => oCsv(d[c.khoa], c.kieu)).join(';'));
  const tong = (tuyChon.tong ?? []).map(t =>
    cot.map((c, i) => (i === 0 ? oCsv(t.nhan, 'chu') : oCsv(t.so[c.khoa], c.kieu))).join(';'));
  return '﻿' + [...tieuDe, dau, ...than, ...tong].join('\r\n') + '\r\n';
}

/** Dòng đầu file báo cáo: "Beeftown Quận 1 · Xuất – nhập – tồn · 01/09/2026–25/09/2026". */
export function tieuDeCsv(tenChiNhanh: string, tenBaoCao: string, tu: string, den: string): string {
  const ky = tu === den ? dinhDangNgay(tu) : `${dinhDangNgay(tu)}–${dinhDangNgay(den)}`;
  return [tenChiNhanh, tenBaoCao, ky].filter(Boolean).join(' · ');
}

// -----------------------------------------------------------------------------
// KỲ BÁO CÁO — hàm thuần
// -----------------------------------------------------------------------------
/** Ngày YYYY-MM-DD có thật (không nhận 30/02, 31/04 — database sẽ báo lỗi). */
function ngayHopLe(s: string | null): s is string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Kỳ báo cáo từ tham số GET; mặc định từ đầu tháng tới hôm nay (giờ VN). */
export function kyBaoCao(q: URLSearchParams, homNay: string): { tu: string; den: string } {
  const qTu = q.get('tu');
  const qDen = q.get('den');
  let tu = ngayHopLe(qTu) ? qTu : `${homNay.slice(0, 8)}01`;
  let den = ngayHopLe(qDen) ? qDen : homNay;
  if (tu > den) [tu, den] = [den, tu];
  return { tu, den };
}

const TEN_KY_NHANH = {
  homNay: { vi: 'Hôm nay', en: 'Today' },
  bayNgay: { vi: '7 ngày', en: '7 days' },
  thangNay: { vi: 'Tháng này', en: 'This month' },
  thangTruoc: { vi: 'Tháng trước', en: 'Last month' },
  quyNay: { vi: 'Quý này', en: 'This quarter' },
  namNay: { vi: 'Năm nay', en: 'This year' },
} satisfies Record<string, HaiThuTieng>;

/** Nút chọn nhanh kỳ: Hôm nay · 7 ngày · Tháng này · Tháng trước · Quý này · Năm nay (GĐ8c). */
export function kyNhanh(homNay: string, nn: NgonNguNB = 'vi'): { ten: string; tu: string; den: string }[] {
  const dauThang = `${homNay.slice(0, 8)}01`;
  const cuoiThangTruoc = congNgay(dauThang, -1);
  const thang = Number(homNay.slice(5, 7));
  const thangDauQuy = String(Math.floor((thang - 1) / 3) * 3 + 1).padStart(2, '0');
  return [
    { ten: TEN_KY_NHANH.homNay[nn], tu: homNay, den: homNay },
    { ten: TEN_KY_NHANH.bayNgay[nn], tu: congNgay(homNay, -6), den: homNay },
    { ten: TEN_KY_NHANH.thangNay[nn], tu: dauThang, den: homNay },
    { ten: TEN_KY_NHANH.thangTruoc[nn], tu: `${cuoiThangTruoc.slice(0, 8)}01`, den: cuoiThangTruoc },
    { ten: TEN_KY_NHANH.quyNay[nn], tu: `${homNay.slice(0, 5)}${thangDauQuy}-01`, den: homNay },
    { ten: TEN_KY_NHANH.namNay[nn], tu: `${homNay.slice(0, 5)}01-01`, den: homNay },
  ];
}

// =============================================================================
// GĐ8c (0041) — BÁO CÁO THEO THÁNG · MUA HÀNG · SỔ THANH TOÁN · TRUNG TÂM BÁO CÁO
// =============================================================================
// Số do database tính (kho_bao_cao_theo_thang, kho_bao_cao_mua_hang,
// kho_so_thanh_toan — đều SECURITY DEFINER, kiểm quyền ở dòng đầu). Web chỉ
// khai cột, đọc và cộng dòng tổng bằng tinhTong như các báo cáo cũ.

/** Kỳ dài nhất của báo cáo có khoảng ngày (database cũng chặn 1 năm). */
export const NGAY_TOI_DA_KY = 366;

const MO_TA_THEO_THANG = {
  vi: 'Mỗi tháng một dòng, theo ngày chứng từ. Nhập gồm cả tồn đầu kỳ. Hao hụt = mất khi mang ra quầy + kiểm kê thiếu − kiểm kê thừa. Pha lóc mất = kg tảng đem pha − kg pha ra (phần bỏ, hao khi pha). Tồn cuối = tồn đầu + nhập − các loại xuất.',
  en: 'One row per month, by document date. Received includes opening stock. Loss = lost on the way to the counter + stocktake shortages − stocktake surpluses. Butchery loss = kg of primal into butchery − kg out of butchery (discarded, lost while cutting). Closing = opening + received − every kind of issue.',
};
const MO_TA_THEO_THANG_GIA = {
  vi: ' Chi phí thịt = bán + xuất bếp + xuất khác + hủy + hao hụt (giá vốn). Doanh thu = mọi dòng hóa đơn iPOS của tháng.',
  en: ' Meat cost = sold + to kitchen + other issues + write-offs + losses (at cost). Revenue = every iPOS invoice line of the month.',
};

/**
 * Báo cáo theo tháng: mỗi tháng một dòng. Vai không xem giá (thủ kho, NV quầy)
 * chỉ có cột kg — database trả null cho mọi cột tiền, web bỏ hẳn các cột đó.
 */
export function dinhNghiaTheoThang(coGia: boolean, nn: NgonNguNB = 'vi'): DinhNghiaBaoCao {
  const cap = (khoa: string, ten: HaiThuTieng): CotHai[] => [
    { khoa: `${khoa}_kg`, ten: { vi: `${ten.vi} kg`, en: `${ten.en} kg` }, kieu: 'kg' },
    ...(coGia ? [{ khoa: `${khoa}_tien`, ten: { vi: `${ten.vi} tiền`, en: `${ten.en} value` }, kieu: 'tien' as const, tienMat: true }] : []),
  ];
  const cot: CotHai[] = [
    { khoa: 'ten_thang', ten: { vi: 'Tháng', en: 'Month' }, kieu: 'chu' },
    ...cap('ton_dau', { vi: 'Tồn đầu', en: 'Opening' }),
    ...cap('nhap', { vi: 'Nhập', en: 'Received' }),
    ...cap('ban', { vi: 'Bán', en: 'Sold' }),
    ...cap('xuat_bep', { vi: 'Xuất bếp', en: 'To kitchen' }),
    ...cap('xuat_khac', { vi: 'Xuất khác', en: 'Other issue' }),
    ...cap('tra_ncc', { vi: 'Trả NCC', en: 'Supplier return' }),
    ...cap('huy', { vi: 'Hủy', en: 'Write-off' }),
    ...cap('hao_hut', { vi: 'Hao hụt', en: 'Loss' }),
    ...cap('pha_mat', { vi: 'Pha lóc mất', en: 'Butchery loss' }),
    ...cap('ton_cuoi', { vi: 'Tồn cuối', en: 'Closing' }),
    ...(coGia ? [
      { khoa: 'chi_phi_thit', ten: { vi: 'Chi phí thịt', en: 'Meat cost' }, kieu: 'tien' as const, tienMat: true },
      { khoa: 'doanh_thu', ten: { vi: 'Doanh thu iPOS', en: 'iPOS revenue' }, kieu: 'tien' as const, tienMat: true },
      { khoa: 'chi_phi_tren_doanh_thu_pt', ten: { vi: 'Chi phí / doanh thu %', en: 'Cost / revenue %' }, kieu: 'pt' as const },
    ] : []),
  ];
  // Tồn đầu / tồn cuối không cộng qua các tháng (tồn đầu năm, tồn cuối năm mới có nghĩa).
  const khongCong = new Set(['ten_thang', 'ton_dau_kg', 'ton_dau_tien', 'ton_cuoi_kg', 'ton_cuoi_tien', 'chi_phi_tren_doanh_thu_pt']);
  return dinhNghiaTheoTieng({
    ten: { vi: 'Theo tháng', en: 'By month' },
    moTa: {
      vi: MO_TA_THEO_THANG.vi + (coGia ? MO_TA_THEO_THANG_GIA.vi : ''),
      en: MO_TA_THEO_THANG.en + (coGia ? MO_TA_THEO_THANG_GIA.en : ''),
    },
    cot,
    cong: cot.map(c => c.khoa).filter(k => !khongCong.has(k)),
    // Tổng % chỉ lấy chi phí thịt của các tháng CÓ iPOS (chi_phi_thit_ipos — cột ẩn,
    // docTheoThang điền) — tháng chưa nối iPOS không có doanh thu để so.
    ...(coGia ? { chiaTong: { chi_phi_tren_doanh_thu_pt: { tu: 'chi_phi_thit_ipos', mau: 'doanh_thu', nhan: 100 } } } : {}),
    khiTrong: {
      cau: { vi: 'Năm này chưa có tháng nào — chọn năm khác', en: 'This year has no months yet — choose another year' },
      link: [{ ten: LINK.ton, href: '/noi-bo/kho/ton' }],
    },
  }, nn);
}

/** Năm của báo cáo theo tháng từ ?nam= (2020 … năm nay + 1); sai thì năm nay. */
export function namBaoCao(q: URLSearchParams, homNay: string): number {
  const nay = Number(homNay.slice(0, 4));
  const n = Number(q.get('nam'));
  return Number.isInteger(n) && n >= 2020 && n <= nay + 1 ? n : nay;
}

export const TEN_NHOM_MUA_NB: Record<string, HaiThuTieng> = {
  ncc: { vi: 'Theo nhà cung cấp', en: 'By supplier' },
  mat_hang: { vi: 'Theo mặt hàng', en: 'By item' },
};
export const TEN_NHOM_MUA: Record<string, string> = chiVi(TEN_NHOM_MUA_NB);

const MO_TA_MUA = {
  chung: {
    vi: 'Phiếu nhập mua đã duyệt có ngày nhập trong kỳ (không gồm tồn đầu kỳ, nợ đầu kỳ). Giá TB/kg = tiền hàng ÷ kg. Tỷ trọng = phần tiền hàng trong tổng tiền hàng của kỳ.',
    en: 'Approved purchase receipts with a receipt date in the period (opening stock and opening balances not included). Avg price/kg = goods value ÷ kg. Share = the row\'s part of the total goods value for the period.',
  },
  ncc: {
    vi: ' Phải trả = tiền hóa đơn nếu đã đối chiếu, chưa thì tổng phiếu.',
    en: ' Payable = the invoice amount if reconciled, otherwise the receipt total.',
  },
  matHang: {
    vi: ' Thuế và chi phí khác ghi theo phiếu nên không chia theo món.',
    en: ' Tax and other costs are recorded per receipt, so they are not split by item.',
  },
} satisfies Record<string, HaiThuTieng>;

/** Mua hàng: nhom 'ncc' có thuế, chi phí, phải trả; nhom 'mat_hang' có giá thấp / cao. */
export function dinhNghiaMuaHang(nhom: 'ncc' | 'mat_hang', nn: NgonNguNB = 'vi'): DinhNghiaBaoCao {
  const laNcc = nhom === 'ncc';
  const cot: CotHai[] = [
    { khoa: 'ten', ten: laNcc ? { vi: 'Nhà cung cấp', en: 'Supplier' } : { vi: 'Mặt hàng', en: 'Item' }, kieu: 'chu' },
    ...(laNcc ? [] : [{ khoa: 'ma', ten: { vi: 'Mã', en: 'Code' }, kieu: 'chu' as const }]),
    { khoa: 'so_phieu', ten: { vi: 'Số phiếu', en: 'Receipts' }, kieu: 'so' },
    laNcc
      ? { khoa: 'so_mat_hang', ten: { vi: 'Số mặt hàng', en: 'Items' }, kieu: 'so' }
      : { khoa: 'so_ncc', ten: { vi: 'Số NCC', en: 'Suppliers' }, kieu: 'so' },
    { khoa: 'so_kg', ten: { vi: 'Kg', en: 'Kg' }, kieu: 'kg' },
    { khoa: 'so_goi', ten: { vi: 'Gói', en: 'Packs' }, kieu: 'so' },
    { khoa: 'tien_hang', ten: { vi: 'Tiền hàng', en: 'Goods value' }, kieu: 'tien', tienMat: true },
    ...(laNcc ? [
      { khoa: 'tien_thue', ten: { vi: 'Thuế', en: 'Tax' }, kieu: 'tien' as const, tienMat: true },
      { khoa: 'chi_phi_khac', ten: { vi: 'Chi phí khác', en: 'Other costs' }, kieu: 'tien' as const, tienMat: true },
      { khoa: 'tong_tien', ten: { vi: 'Phải trả', en: 'Payable' }, kieu: 'tien' as const, tienMat: true },
    ] : []),
    { khoa: 'gia_tb_kg', ten: { vi: 'Giá TB/kg', en: 'Avg price/kg' }, kieu: 'tien', tienMat: true },
    ...(laNcc ? [] : [
      { khoa: 'gia_thap_kg', ten: { vi: 'Thấp nhất/kg', en: 'Lowest/kg' }, kieu: 'tien' as const, tienMat: true },
      { khoa: 'gia_cao_kg', ten: { vi: 'Cao nhất/kg', en: 'Highest/kg' }, kieu: 'tien' as const, tienMat: true },
    ]),
    { khoa: 'ty_trong_pt', ten: { vi: 'Tỷ trọng %', en: 'Share %' }, kieu: 'pt' },
  ];
  const tenNhom = TEN_NHOM_MUA_NB[nhom];
  const moTaThem = laNcc ? MO_TA_MUA.ncc : MO_TA_MUA.matHang;
  return dinhNghiaTheoTieng({
    ten: { vi: `Mua hàng ${tenNhom.vi.toLowerCase()}`, en: `Purchases ${tenNhom.en.toLowerCase()}` },
    moTa: { vi: MO_TA_MUA.chung.vi + moTaThem.vi, en: MO_TA_MUA.chung.en + moTaThem.en },
    cot,
    // Số phiếu không cộng: một phiếu có nhiều món / mỗi NCC đếm riêng.
    cong: ['so_kg', 'so_goi', 'tien_hang', ...(laNcc ? ['tien_thue', 'chi_phi_khac', 'tong_tien'] : [])],
    chiaTong: { gia_tb_kg: { tu: 'tien_hang', mau: 'so_kg' } },
    khiTrong: {
      cau: { vi: 'Chưa có phiếu nhập mua nào được duyệt trong kỳ', en: 'No purchase receipt was approved in this period' },
      link: [{ ten: LINK.nhap, href: '/noi-bo/kho/nhap' }],
    },
  }, nn);
}

/** Sổ thanh toán ở hai thứ tiếng: DN_SO_THANH_TOAN_NB[nn]. */
export const DN_SO_THANH_TOAN_NB: HaiThuTieng<DinhNghiaBaoCao> = haiBan({
  ten: { vi: 'Sổ thanh toán', en: 'Payments ledger' },
  moTa: {
    vi: 'Mọi khoản trả tiền, bù trừ, giảm trừ, NCC hoàn tiền trong kỳ, theo ngày. Tiền ra = tiền rời quán; tiền vào = NCC trả lại; giảm nợ = công nợ giảm bao nhiêu (NCC hoàn tiền làm nợ tăng lại nên là số âm). Khoản đã hủy vẫn hiện, tiền bằng 0.',
    en: 'Every payment, offset, deduction and supplier refund in the period, by date. Money out = money that left the restaurant; money in = money a supplier paid back; debt reduced = how much the payables went down (a supplier refund raises the debt again, so it is negative). Cancelled entries still show, with 0 amounts.',
  },
  cot: [
    { khoa: 'ngay', ten: { vi: 'Ngày', en: 'Date' }, kieu: 'chu' },
    { khoa: 'so_phieu', ten: { vi: 'Số chứng từ', en: 'Document no.' }, kieu: 'chu' },
    { khoa: 'ten_loai', ten: { vi: 'Loại', en: 'Type' }, kieu: 'chu' },
    { khoa: 'ten_hinh_thuc', ten: { vi: 'Cách trả', en: 'Method' }, kieu: 'chu' },
    { khoa: 'ten_nha_cung_cap', ten: { vi: 'Nhà cung cấp', en: 'Supplier' }, kieu: 'chu' },
    { khoa: 'phieu_nhap', ten: { vi: 'Cho phiếu nhập', en: 'For goods receipts' }, kieu: 'chu' },
    { khoa: 'tien_ra', ten: { vi: 'Tiền ra', en: 'Money out' }, kieu: 'tien' },
    { khoa: 'tien_vao', ten: { vi: 'Tiền vào', en: 'Money in' }, kieu: 'tien' },
    { khoa: 'giam_no', ten: { vi: 'Giảm nợ', en: 'Debt reduced' }, kieu: 'tien' },
    { khoa: 'ten_trang_thai', ten: { vi: 'Tình trạng', en: 'Status' }, kieu: 'chu' },
    { khoa: 'ghi_chu', ten: { vi: 'Ghi chú', en: 'Note' }, kieu: 'chu' },
    { khoa: 'nguoi_ghi', ten: { vi: 'Người ghi', en: 'Recorded by' }, kieu: 'chu' },
  ],
  cong: ['tien_ra', 'tien_vao', 'giam_no'],
  khiTrong: {
    cau: { vi: 'Chưa có khoản trả tiền nào trong kỳ', en: 'No payments in this period' },
    link: [{ ten: LINK.congNo, href: '/noi-bo/kho/cong-no' }],
  },
});
export const DN_SO_THANH_TOAN: DinhNghiaBaoCao = DN_SO_THANH_TOAN_NB.vi;

export interface DongTheoThang {
  thang: number; tu: string; den: string; ten_thang: string;
  co_ipos: boolean;
  [khoa: string]: number | string | boolean | null;
}

/** Số từ database (numeric về dạng chuỗi) → number; null giữ null. */
function soHoa(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const THANG_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Tên tháng ở cột đầu: "Tháng 9/2026" / "Sep 2026". */
const TEN_THANG: HaiThuTieng<(thang: number, nam: number) => string> = {
  vi: (thang: number, nam: number) => `Tháng ${thang}/${nam}`,
  en: (thang: number, nam: number) => `${THANG_EN[thang - 1] ?? thang} ${nam}`,
};

export async function docTheoThang(
  client: SupabaseClient, chiNhanhId: string, nam: number, nn: NgonNguNB = 'vi',
): Promise<{ dong: DongTheoThang[]; loi: string | null }> {
  const { data, error } = await client.rpc('kho_bao_cao_theo_thang', { p_chi_nhanh_id: chiNhanhId, p_nam: nam });
  if (error) return { dong: [], loi: cauLoiKho(error) };
  const dong = ((data ?? []) as Record<string, unknown>[]).map(r => {
    const d: DongTheoThang = {
      thang: Number(r.thang), tu: String(r.tu), den: String(r.den),
      ten_thang: TEN_THANG[nn](Number(r.thang), nam), co_ipos: r.co_ipos === true,
    };
    for (const [k, v] of Object.entries(r)) {
      if (!['thang', 'tu', 'den', 'co_ipos'].includes(k)) d[k] = soHoa(v);
    }
    // Cột ẩn cho dòng tổng "chi phí / doanh thu %": chỉ tháng có iPOS.
    d.chi_phi_thit_ipos = d.co_ipos ? (d.chi_phi_thit as number | null) : null;
    return d;
  });
  return { dong, loi: null };
}

export async function docMuaHang(
  client: SupabaseClient, chiNhanhId: string, tu: string, den: string, nhom: 'ncc' | 'mat_hang',
): Promise<{ dong: Record<string, unknown>[]; loi: string | null }> {
  const { data, error } = await client.rpc('kho_bao_cao_mua_hang', {
    p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den, p_nhom: nhom,
  });
  if (error) return { dong: [], loi: cauLoiKho(error) };
  const dong = ((data ?? []) as Record<string, unknown>[]).map(r => {
    const d: Record<string, unknown> = { ...r };
    for (const k of ['so_phieu', 'so_ncc', 'so_mat_hang', 'so_kg', 'so_goi', 'tien_hang', 'tien_thue', 'chi_phi_khac',
      'tong_tien', 'gia_tb_kg', 'gia_thap_kg', 'gia_cao_kg', 'ty_trong_pt']) d[k] = soHoa(r[k]);
    return d;
  });
  return { dong, loi: null };
}

export const TEN_TRANG_THAI_THANH_TOAN_NB: Record<string, HaiThuTieng> = {
  hieu_luc: { vi: 'Có hiệu lực', en: 'Valid' },
  da_huy: { vi: 'Đã hủy', en: 'Cancelled' },
};
export const TEN_TRANG_THAI_THANH_TOAN: Record<string, string> = chiVi(TEN_TRANG_THAI_THANH_TOAN_NB);

// Tên loại khoản / cách trả: database trả sẵn tên tiếng Việt (ten_loai,
// ten_hinh_thuc của kho_so_thanh_toan) — màn tiếng Anh tra theo mã.
const LOAI_KHOAN_EN: Record<string, string> = {
  thanh_toan: 'Payment', giam_tru: 'Deduction', bu_tru: 'Offset', hoan_tien: 'Supplier refund',
};
const HINH_THUC_EN: Record<string, string> = { chuyen_khoan: 'Bank transfer', tien_mat: 'Cash', khac: 'Other' };

export async function docSoThanhToan(
  client: SupabaseClient, chiNhanhId: string, tu: string, den: string, nn: NgonNguNB = 'vi',
): Promise<{ dong: Record<string, unknown>[]; loi: string | null }> {
  let data: Record<string, unknown>[];
  try {
    data = await docTungTrang((a, z) => client.rpc('kho_so_thanh_toan', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den })
      .range(a, z));
  } catch (e) {
    return { dong: [], loi: cauLoiKho(e) };
  }
  const dong = data.map(r => ({
    ...r,
    ...(nn === 'en' ? {
      ten_loai: LOAI_KHOAN_EN[String(r.loai)] ?? r.ten_loai,
      ten_hinh_thuc: HINH_THUC_EN[String(r.hinh_thuc)] ?? r.ten_hinh_thuc,
    } : {}),
    so_tien: soHoa(r.so_tien), tien_ra: soHoa(r.tien_ra), tien_vao: soHoa(r.tien_vao), giam_no: soHoa(r.giam_no),
    ten_trang_thai: TEN_TRANG_THAI_THANH_TOAN_NB[String(r.trang_thai)]?.[nn] ?? r.trang_thai,
    ngay: dinhDangNgay(String(r.ngay ?? '')),
  }));
  return { dong, loi: null };
}

// -----------------------------------------------------------------------------
// TÓM TẮT KỲ cho trang Báo cáo — hàm thuần
// -----------------------------------------------------------------------------
export interface TomTatKy {
  nhap_kg: number; nhap_tien: number;
  ban_kg: number; ban_tien: number;
  hao_hut_kg: number; hao_hut_tien: number;
  huy_kg: number; huy_tien: number;
  ton_cuoi_kg: number; ton_cuoi_tien: number;
  chi_phi_thit: number;
}

/**
 * Cộng các dòng xuất – nhập – tồn (kho_bao_cao_xnt_v2) thành thẻ tóm tắt.
 * Hao hụt = mất khi mang ra quầy + kiểm kê thiếu − kiểm kê thừa (kiem_ke_kg
 * mang dấu: + thừa, − thiếu). Chi phí thịt = bán + xuất bếp + xuất khác + hủy +
 * hao hụt — cùng định nghĩa với kho_bao_cao_theo_thang và kho_chi_so_quan_tri.
 */
export function tomTatXnt(dong: Record<string, unknown>[]): TomTatKy {
  const c = (k: string) => dong.reduce((s, d) => s + (Number(d[k]) || 0), 0);
  const kg = (x: number) => Math.round(x * 1000) / 1000;
  const hhKg = c('hao_hut_kg') - c('kiem_ke_kg');
  const hhTien = c('hao_hut_gia_tri') - c('kiem_ke_gia_tri');
  return {
    nhap_kg: kg(c('nhap_kg')), nhap_tien: Math.round(c('nhap_gia_tri')),
    ban_kg: kg(c('ban_kg')), ban_tien: Math.round(c('ban_gia_tri')),
    hao_hut_kg: kg(hhKg), hao_hut_tien: Math.round(hhTien),
    huy_kg: kg(c('huy_kg')), huy_tien: Math.round(c('huy_gia_tri')),
    ton_cuoi_kg: kg(c('cuoi_kg')), ton_cuoi_tien: Math.round(c('cuoi_gia_tri')),
    chi_phi_thit: Math.round(c('ban_gia_tri') + c('xuat_bep_gia_tri') + c('xuat_khac_gia_tri') + c('huy_gia_tri') + hhTien),
  };
}

/**
 * Doanh thu iPOS của kỳ, lấy từ các dòng theo tháng — chỉ khi kỳ trùng trọn
 * tháng (từ ngày 1, tới cuối tháng hoặc hôm nay). Kỳ lẻ ngày (7 ngày, tự chọn)
 * → null: báo cáo tháng không chia được theo ngày.
 * Database trả `den` = ngày cuối tháng kể cả tháng đang chạy — truyền `homNay`
 * để "Tháng này", "Quý này", "Năm nay" (tới hôm nay) vẫn khớp.
 * `duIpos` = mọi tháng trong kỳ đều có iPOS (chỉ khi đó mới so chi phí / doanh thu).
 */
export function doanhThuKy(
  dongThang: { tu: string; den: string; co_ipos: boolean; doanh_thu?: unknown }[], tu: string, den: string,
  homNay?: string,
): { doanhThu: number | null; coIpos: boolean; duIpos: boolean } | null {
  const ds = dongThang
    .map(d => ({ ...d, den: homNay && d.den > homNay && d.tu <= homNay ? homNay : d.den }))
    .sort((a, b) => a.tu.localeCompare(b.tu));
  const trong = ds.filter(d => d.tu >= tu && d.den <= den);
  const bia = ds.filter(d => !(d.den < tu || d.tu > den));
  if (trong.length === 0 || bia.length !== trong.length) return null;
  if (trong[0].tu !== tu || trong[trong.length - 1].den !== den) return null;
  const coIpos = trong.some(d => d.co_ipos);
  const doanhThu = coIpos ? trong.reduce((s, d) => s + (Number(d.doanh_thu) || 0), 0) : null;
  return { doanhThu, coIpos, duIpos: trong.every(d => d.co_ipos) };
}

// -----------------------------------------------------------------------------
// TRUNG TÂM BÁO CÁO — danh sách thẻ, mỗi thẻ ẩn theo quyền. Hàm thuần.
// -----------------------------------------------------------------------------
// `quyen`: cần MỘT trong các quyền — phải khớp dòng chặn đầu trang đích (test
// test-kho-giao-dien nhóm 16 so như menu). `ky`: link mang kỳ đang chọn
// (tu/den) hay năm (nam). `csv`: tên file bao-cao/<csv>.csv (cùng quyền).
export interface TheBaoCao {
  ma: string;
  nhom: string;
  ten: string;
  moTa: string;
  link: string;
  quyen: ViecKho[];
  ky: 'ngay' | 'nam' | 'khong';
  csv?: string;
}

/** Nhóm thẻ, đúng thứ tự hiện. Tên tiếng Việt cũng là khóa nhóm của thẻ (TheBaoCao.nhom). */
export const NHOM_BAO_CAO_NB: readonly HaiThuTieng[] = [
  { vi: 'Tồn kho & xuất – nhập – tồn', en: 'Stock & stock movement' },
  { vi: 'Mua hàng & công nợ', en: 'Purchases & payables' },
  { vi: 'Hao hụt & bếp', en: 'Losses & kitchen' },
  { vi: 'Bán hàng', en: 'Sales' },
];
export const NHOM_BAO_CAO: readonly string[] = NHOM_BAO_CAO_NB.map(n => n.vi);

/** Thẻ báo cáo với chữ hai thứ tiếng. */
export interface TheBaoCaoNB extends Omit<TheBaoCao, 'nhom' | 'ten' | 'moTa'> {
  nhom: HaiThuTieng;
  ten: HaiThuTieng;
  moTa: HaiThuTieng;
}

export const THE_BAO_CAO_NB: readonly TheBaoCaoNB[] = [
  { ma: 'xuat-nhap-ton', nhom: NHOM_BAO_CAO_NB[0], ten: { vi: 'Xuất – nhập – tồn', en: 'Stock movement' }, link: '/noi-bo/kho/bao-cao/xuat-nhap-ton',
    moTa: { vi: 'Từng mặt hàng: tồn đầu, nhập, bán, xuất, hủy, hao hụt, tồn cuối — kg và tiền.',
            en: 'Each item: opening stock, received, sold, issued, written off, losses, closing stock — kg and value.' },
    quyen: ['xem_gia'], ky: 'ngay', csv: 'xuat-nhap-ton' },
  { ma: 'theo-thang', nhom: NHOM_BAO_CAO_NB[0], ten: { vi: 'Theo tháng', en: 'By month' }, link: '/noi-bo/kho/bao-cao/theo-thang',
    moTa: { vi: 'Mỗi tháng một dòng: nhập, bán, hủy, hao hụt, tồn cuối; chi phí thịt so với doanh thu iPOS (tiền chỉ vai xem giá).',
            en: 'One row per month: received, sold, written off, losses, closing stock; meat cost against iPOS revenue (money only for roles that see prices).' },
    quyen: ['xem'], ky: 'nam', csv: 'theo-thang' },
  { ma: 'thu-hoi', nhom: NHOM_BAO_CAO_NB[0], ten: { vi: 'Thu hồi pha lóc', en: 'Butchery yield' }, link: '/noi-bo/kho/bao-cao/thu-hoi',
    moTa: { vi: 'Theo loại tảng và nhà cung cấp: kg vào, kg thịt, thu hồi %, giá vốn thịt.',
            en: 'By primal and supplier: kg in, kg of meat, yield %, meat cost.' },
    quyen: ['xem_gia'], ky: 'ngay', csv: 'thu-hoi' },
  { ma: 'theo-tang', nhom: NHOM_BAO_CAO_NB[0], ten: { vi: 'Theo tảng', en: 'By primal' }, link: '/noi-bo/kho/bao-cao/theo-tang',
    moTa: { vi: 'Mỗi tảng: kg nhà cung cấp → sau repack → lóc → bán / huỷ / còn, số ngày bán hết; giá vốn từng bước (tiền chỉ vai xem giá).',
            en: 'Each primal: supplier kg → after repack → cutting → sold / written off / left, days to sell out; cost at each step (money only for roles that see prices).' },
    quyen: ['xem'], ky: 'ngay', csv: 'theo-tang' },
  { ma: 'mua-ncc', nhom: NHOM_BAO_CAO_NB[1], ten: { vi: 'Mua hàng theo nhà cung cấp', en: 'Purchases by supplier' }, link: '/noi-bo/kho/bao-cao/mua-hang?nhom=ncc',
    moTa: { vi: 'Mỗi NCC: số phiếu, kg, tiền hàng, thuế, phải trả, giá TB/kg, tỷ trọng.',
            en: 'Each supplier: receipts, kg, goods value, tax, payable, avg price/kg, share.' },
    quyen: ['xem_gia'], ky: 'ngay', csv: 'mua-hang' },
  { ma: 'mua-mat-hang', nhom: NHOM_BAO_CAO_NB[1], ten: { vi: 'Mua hàng theo mặt hàng', en: 'Purchases by item' }, link: '/noi-bo/kho/bao-cao/mua-hang?nhom=mat_hang',
    moTa: { vi: 'Mỗi món: kg mua, tiền hàng, giá TB / thấp nhất / cao nhất một kg.',
            en: 'Each item: kg bought, goods value, average / lowest / highest price per kg.' },
    quyen: ['xem_gia'], ky: 'ngay', csv: 'mua-hang' },
  { ma: 'cong-no-ky', nhom: NHOM_BAO_CAO_NB[1], ten: { vi: 'Công nợ theo kỳ, biên bản đối chiếu', en: 'Payables by period, reconciliation statements' },
    link: '/noi-bo/kho/cong-no?tab=theo-doi',
    moTa: { vi: 'Nợ đầu kỳ, mua, đã trả, còn nợ của từng NCC. In biên bản đối chiếu ở trang từng nhà cung cấp.',
            en: 'Opening balance, purchases, paid and outstanding for each supplier. Print reconciliation statements from each supplier\'s page.' },
    quyen: ['ke_toan'], ky: 'ngay', csv: 'cong-no' },
  { ma: 'so-thanh-toan', nhom: NHOM_BAO_CAO_NB[1], ten: { vi: 'Sổ thanh toán', en: 'Payments ledger' }, link: '/noi-bo/kho/bao-cao/so-thanh-toan',
    moTa: { vi: 'Mọi khoản trả tiền, bù trừ, giảm trừ, NCC hoàn tiền theo ngày — tiền ra, tiền vào, giảm nợ.',
            en: 'Every payment, offset, deduction and supplier refund by date — money out, money in, debt reduced.' },
    quyen: ['ke_toan'], ky: 'ngay', csv: 'so-thanh-toan' },
  { ma: 'danh-gia-ncc', nhom: NHOM_BAO_CAO_NB[1], ten: { vi: 'Đánh giá nhà cung cấp', en: 'Supplier rating' }, link: '/noi-bo/kho/bao-cao/ncc',
    moTa: { vi: 'Lần giao, giao thiếu / trễ, thu hồi pha lóc, kg trả lại, điểm sao.',
            en: 'Deliveries, short / late deliveries, butchery yield, kg returned, star rating.' },
    quyen: ['nhap', 'xem_gia'], ky: 'ngay', csv: 'ncc' },
  { ma: 'hao-hut', nhom: NHOM_BAO_CAO_NB[2], ten: { vi: 'Hủy, xuất bếp, chênh lệch', en: 'Write-offs, kitchen issues, differences' }, link: '/noi-bo/kho/bao-cao/hao-hut',
    moTa: { vi: 'Hàng rời kho không qua bán: hủy theo lý do, xuất bếp, xuất khác, trả NCC, kiểm kê thiếu / thừa.',
            en: 'Goods that left stock without being sold: write-offs by reason, issues to the kitchen, other issues, supplier returns, stocktake shortages / surpluses.' },
    quyen: ['xem_gia'], ky: 'ngay', csv: 'hao-hut' },
  { ma: 'dinh-muc', nhom: NHOM_BAO_CAO_NB[2], ten: { vi: 'Định mức bếp', en: 'Kitchen usage' }, link: '/noi-bo/kho/bao-cao/dinh-muc',
    moTa: { vi: 'Thịt bếp nhận so với lẽ ra dùng theo định lượng món và số suất bán.',
            en: 'Meat the kitchen received compared with what it should have used, from dish recipes and portions sold.' },
    quyen: ['xem'], ky: 'ngay', csv: 'dinh-muc' },
  { ma: 'ban', nhom: NHOM_BAO_CAO_NB[3], ten: { vi: 'Bán hàng iPOS', en: 'iPOS sales' }, link: '/noi-bo/kho/bao-cao/ban',
    moTa: { vi: 'Từng món bán ở quầy: gói, kg, doanh thu, giá vốn, lãi gộp (iPOS và phần ước tính trước khi nối iPOS).',
            en: 'Each item sold at the counter: packs, kg, revenue, cost, gross profit (iPOS, plus estimates from before iPOS was connected).' },
    quyen: ['xem_gia'], ky: 'ngay', csv: 'ban' },
];

export const THE_BAO_CAO: readonly TheBaoCao[] = THE_BAO_CAO_NB.map(t => ({ ...t, nhom: t.nhom.vi, ten: t.ten.vi, moTa: t.moTa.vi }));

/** Thẻ báo cáo vai này mở được. */
export function theBaoCaoCuaVai(vai: string): TheBaoCao[] {
  return THE_BAO_CAO.filter(t => t.quyen.some(q => duoc(vai, q)));
}

/** Tên và mô tả của một thẻ theo ngôn ngữ đang xem (tra theo mã thẻ). */
export function chuTheBaoCao(ma: string, nn: NgonNguNB = 'vi'): { ten: string; moTa: string } {
  const t = THE_BAO_CAO_NB.find(x => x.ma === ma);
  return t ? { ten: t.ten[nn], moTa: t.moTa[nn] } : { ten: ma, moTa: '' };
}

/** Link của thẻ, mang kỳ đang chọn (hoặc năm của ngày cuối kỳ). */
export function linkTheBaoCao(t: TheBaoCao, tu: string, den: string): string {
  const [duong, q = ''] = t.link.split('?');
  const p = new URLSearchParams(q);
  if (t.ky === 'ngay') { p.set('tu', tu); p.set('den', den); }
  if (t.ky === 'nam') p.set('nam', den.slice(0, 4));
  const s = p.toString();
  return s ? `${duong}?${s}` : duong;
}
