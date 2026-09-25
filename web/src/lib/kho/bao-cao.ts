/**
 * KHO — BÁO CÁO
 *
 * Bốn báo cáo đều là hàm SECURITY INVOKER trong database (0024): người gọi
 * chỉ thấy số của chi nhánh mình, vai không xem giá nhận cột tiền bằng 0. File
 * này chỉ gọi hàm, khai báo cột để hiện bảng và xuất CSV.
 *
 * CSV cho Excel tiếng Việt: UTF-8 có BOM (không thì Excel hiện "Tháº¥n"),
 * dấu chấm phẩy ngăn cột (Excel máy cài tiếng Việt coi dấu phẩy là dấu thập
 * phân), kg dùng dấu phẩy thập phân, tiền là số nguyên không dấu phân cách.
 * Dòng đầu ghi chi nhánh + tên báo cáo + kỳ (in ra hay gửi đi vẫn biết là số
 * của kỳ nào), dòng cuối là tổng — kế toán không phải cộng lại trong Excel.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, congNgay, dinhDangNgay } from './chung.ts';

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

export const BAO_CAO: Record<string, DinhNghiaBaoCao> = {
  'xuat-nhap-ton': {
    ten: 'Xuất – nhập – tồn',
    moTa: 'Theo mặt hàng, theo ngày chứng từ. Chuyển giữa kho và quầy không tính. Giá trị theo giá vốn từng lô.',
    cot: [
      { khoa: 'ten', ten: 'Mặt hàng', kieu: 'chu' },
      { khoa: 'dau_kg', ten: 'Tồn đầu kg', kieu: 'kg' },
      { khoa: 'dau_gia_tri', ten: 'Tồn đầu tiền', kieu: 'tien', tienMat: true },
      { khoa: 'nhap_kg', ten: 'Nhập kg', kieu: 'kg' },
      { khoa: 'nhap_gia_tri', ten: 'Nhập tiền', kieu: 'tien', tienMat: true },
      { khoa: 'pha_ra_kg', ten: 'Pha lóc ra kg', kieu: 'kg' },
      { khoa: 'pha_vao_kg', ten: 'Đem pha kg', kieu: 'kg' },
      { khoa: 'ban_kg', ten: 'Bán kg', kieu: 'kg' },
      { khoa: 'ban_gia_tri', ten: 'Bán giá vốn', kieu: 'tien', tienMat: true },
      { khoa: 'xuat_bep_kg', ten: 'Xuất bếp kg', kieu: 'kg' },
      { khoa: 'xuat_bep_gia_tri', ten: 'Xuất bếp tiền', kieu: 'tien', tienMat: true },
      { khoa: 'huy_kg', ten: 'Hủy kg', kieu: 'kg' },
      { khoa: 'huy_gia_tri', ten: 'Hủy tiền', kieu: 'tien', tienMat: true },
      { khoa: 'tra_ncc_kg', ten: 'Trả NCC kg', kieu: 'kg' },
      { khoa: 'kiem_ke_kg', ten: 'Kiểm kê ± kg', kieu: 'kg' },
      { khoa: 'kiem_ke_gia_tri', ten: 'Kiểm kê ± tiền', kieu: 'tien', tienMat: true },
      { khoa: 'cuoi_kg', ten: 'Tồn cuối kg', kieu: 'kg' },
      { khoa: 'cuoi_gia_tri', ten: 'Tồn cuối tiền', kieu: 'tien', tienMat: true },
    ],
    cong: [
      'dau_kg', 'dau_gia_tri', 'nhap_kg', 'nhap_gia_tri', 'pha_ra_kg', 'pha_vao_kg',
      'ban_kg', 'ban_gia_tri', 'xuat_bep_kg', 'xuat_bep_gia_tri', 'huy_kg', 'huy_gia_tri',
      'tra_ncc_kg', 'kiem_ke_kg', 'kiem_ke_gia_tri', 'cuoi_kg', 'cuoi_gia_tri',
    ],
    khiTrong: {
      cau: 'Kho chưa có hàng nào tính tới ngày cuối kỳ. Số liệu có khi phiếu nhập hàng được duyệt',
      link: [{ ten: 'Nhập hàng', href: '/noi-bo/kho/nhap' }],
    },
  },
  'thu-hoi': {
    ten: 'Thu hồi pha lóc',
    moTa: 'Theo loại tảng và nhà cung cấp. Thu hồi = kg thịt giữ lại ÷ kg tảng. Phiên dùng tảng của nhiều nhà cung cấp được chia theo kg từng lô.',
    cot: [
      { khoa: 'ten_mat_hang', ten: 'Tảng', kieu: 'chu' },
      { khoa: 'ten_nha_cung_cap', ten: 'Nhà cung cấp', kieu: 'chu' },
      { khoa: 'so_phien', ten: 'Số phiên', kieu: 'so' },
      { khoa: 'kg_vao', ten: 'Kg vào', kieu: 'kg' },
      { khoa: 'kg_thit', ten: 'Kg thịt', kieu: 'kg' },
      { khoa: 'kg_phu_pham', ten: 'Kg phụ phẩm', kieu: 'kg' },
      { khoa: 'kg_bo', ten: 'Kg bỏ', kieu: 'kg' },
      { khoa: 'kg_hao_hut', ten: 'Kg hao hụt', kieu: 'kg' },
      { khoa: 'ty_le_thu_hoi', ten: 'Thu hồi %', kieu: 'pt' },
      { khoa: 'gia_von_vao_kg', ten: 'Giá vốn tảng/kg', kieu: 'tien', tienMat: true },
      { khoa: 'gia_von_thit_kg', ten: 'Giá vốn thịt/kg', kieu: 'tien', tienMat: true },
    ],
    // Số phiên không cộng: phiên dùng tảng của hai nhà cung cấp nằm ở hai dòng.
    // Giá vốn / kg không cộng: mỗi loại tảng một giá.
    cong: ['kg_vao', 'kg_thit', 'kg_phu_pham', 'kg_bo', 'kg_hao_hut'],
    chiaTong: { ty_le_thu_hoi: { tu: 'kg_thit', mau: 'kg_vao', nhan: 100 } },
    khiTrong: {
      cau: 'Chưa có phiên pha lóc nào chốt trong kỳ',
      link: [{ ten: 'Pha lóc', href: '/noi-bo/kho/pha-loc' }],
    },
  },
  'hao-hut': {
    ten: 'Hủy, xuất bếp, chênh lệch',
    moTa: 'Hàng rời kho không qua bán: hủy (theo lý do), xuất bếp, trả nhà cung cấp, thiếu / thừa khi kiểm kê.',
    cot: [
      { khoa: 'loai_dong', ten: 'Loại', kieu: 'chu' },
      { khoa: 'ten', ten: 'Mặt hàng', kieu: 'chu' },
      { khoa: 'ly_do', ten: 'Lý do', kieu: 'chu' },
      { khoa: 'so_kg', ten: 'Kg', kieu: 'kg' },
      { khoa: 'so_goi', ten: 'Gói', kieu: 'so' },
      { khoa: 'gia_tri', ten: 'Giá vốn', kieu: 'tien', tienMat: true },
    ],
    cong: ['so_kg', 'so_goi', 'gia_tri'],
    tongTheo: 'loai_dong',
    khiTrong: {
      cau: 'Chưa có phiếu hủy, xuất bếp, trả nhà cung cấp hay kiểm kê lệch sổ nào được duyệt trong kỳ',
      link: [{ ten: 'Chuyển · xuất · hủy', href: '/noi-bo/kho/xuat' }, { ten: 'Kiểm kê', href: '/noi-bo/kho/kiem-ke' }],
    },
  },
  ban: {
    ten: 'Bán (ước tính)',
    moTa: 'Chưa nối iPOS: số bán lấy từ phần thiếu khi kiểm kê quầy. Doanh thu ước tính theo giá bán HIỆN TẠI trong danh mục.',
    cot: [
      { khoa: 'ten', ten: 'Mặt hàng', kieu: 'chu' },
      { khoa: 'so_goi', ten: 'Gói', kieu: 'so' },
      { khoa: 'so_kg', ten: 'Kg', kieu: 'kg' },
      { khoa: 'gia_ban_kg', ten: 'Giá bán/kg', kieu: 'tien' },
      { khoa: 'doanh_thu_uoc_tinh', ten: 'Doanh thu ước tính', kieu: 'tien' },
      { khoa: 'gia_von', ten: 'Giá vốn', kieu: 'tien', tienMat: true },
      { khoa: 'lai_gop_uoc_tinh', ten: 'Lãi gộp ước tính', kieu: 'tien', tienMat: true },
    ],
    cong: ['so_goi', 'so_kg', 'doanh_thu_uoc_tinh', 'gia_von', 'lai_gop_uoc_tinh'],
    khiTrong: {
      cau: 'Chưa có số bán trong kỳ. Số bán có khi phiếu kiểm kê quầy được duyệt và quầy thiếu hàng so với sổ',
      link: [{ ten: 'Kiểm kê', href: '/noi-bo/kho/kiem-ke' }],
    },
  },
};

/** Cột của file công nợ (từ view kho_v_cong_no_phieu). */
export const COT_CONG_NO: CotBaoCao[] = [
  { khoa: 'so_phieu', ten: 'Phiếu nhập', kieu: 'chu' },
  { khoa: 'ten_nha_cung_cap', ten: 'Nhà cung cấp', kieu: 'chu' },
  { khoa: 'ngay_nhap', ten: 'Ngày nhập', kieu: 'chu' },
  { khoa: 'so_hoa_don', ten: 'Số hóa đơn', kieu: 'chu' },
  { khoa: 'ngay_hoa_don', ten: 'Ngày hóa đơn', kieu: 'chu' },
  { khoa: 'han_thanh_toan', ten: 'Hạn thanh toán', kieu: 'chu' },
  { khoa: 'tong_tien_phieu', ten: 'Tổng phiếu', kieu: 'tien' },
  { khoa: 'tien_hoa_don', ten: 'Tiền hóa đơn', kieu: 'tien' },
  { khoa: 'phai_tra', ten: 'Phải trả', kieu: 'tien' },
  { khoa: 'da_tra', ten: 'Đã trả', kieu: 'tien' },
  { khoa: 'giam_tru', ten: 'Giảm trừ', kieu: 'tien' },
  { khoa: 'con_no', ten: 'Còn nợ', kieu: 'tien' },
  { khoa: 'so_ngay_qua_han', ten: 'Số ngày quá hạn', kieu: 'so' },
];

export const TEN_LOAI_DONG_HAO_HUT: Record<string, string> = {
  huy: 'Hủy',
  xuat_bep: 'Xuất bếp',
  tra_ncc: 'Trả nhà cung cấp',
  kiem_ke_thieu: 'Kiểm kê thiếu',
  kiem_ke_thua: 'Kiểm kê thừa',
};

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export async function docBaoCao(
  client: SupabaseClient, ten: string, chiNhanhId: string, tu: string, den: string,
): Promise<{ dong: Record<string, unknown>[]; loi: string | null }> {
  let kq: { data: unknown; error: { message: string } | null };
  if (ten === 'xuat-nhap-ton') kq = await client.rpc('kho_bao_cao_xuat_nhap_ton', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
  else if (ten === 'thu-hoi') kq = await client.rpc('kho_bao_cao_thu_hoi', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
  else if (ten === 'hao-hut') kq = await client.rpc('kho_bao_cao_hao_hut', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
  else if (ten === 'ban') kq = await client.rpc('kho_bao_cao_ban', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
  else return { dong: [], loi: 'Không có báo cáo này.' };
  if (kq.error) return { dong: [], loi: cauLoiKho(kq.error) };
  const dong = (kq.data ?? []) as Record<string, unknown>[];
  if (ten === 'hao-hut') for (const d of dong) d.loai_dong = TEN_LOAI_DONG_HAO_HUT[String(d.loai_dong)] ?? d.loai_dong;
  if (ten === 'thu-hoi') for (const d of dong) d.ten_nha_cung_cap = d.ten_nha_cung_cap ?? '(tồn đầu / không rõ)';
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

export function tinhTong(dn: DinhNghiaBaoCao, dong: Record<string, unknown>[]): DongTong[] {
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
    return { nhan: dn.tongTheo ? `Cộng ${khoaNhom}` : 'Tổng', so };
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
  return '\uFEFF' + [...tieuDe, dau, ...than, ...tong].join('\r\n') + '\r\n';
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

/** Nút chọn nhanh kỳ: Hôm nay · 7 ngày · Tháng này · Tháng trước. */
export function kyNhanh(homNay: string): { ten: string; tu: string; den: string }[] {
  const dauThang = `${homNay.slice(0, 8)}01`;
  const cuoiThangTruoc = congNgay(dauThang, -1);
  return [
    { ten: 'Hôm nay', tu: homNay, den: homNay },
    { ten: '7 ngày', tu: congNgay(homNay, -6), den: homNay },
    { ten: 'Tháng này', tu: dauThang, den: homNay },
    { ten: 'Tháng trước', tu: `${cuoiThangTruoc.slice(0, 8)}01`, den: cuoiThangTruoc },
  ];
}
