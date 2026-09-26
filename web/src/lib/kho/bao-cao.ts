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
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, congNgay, dinhDangNgay, duoc, type ViecKho } from './chung.ts';

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
    moTa: 'Theo mặt hàng, theo ngày chứng từ. Chuyển giữa kho và quầy không tính. Hao hụt = hàng mất khi mang ra quầy. Giá trị theo giá vốn từng lô.',
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
      { khoa: 'xuat_khac_kg', ten: 'Xuất khác kg', kieu: 'kg' },
      { khoa: 'xuat_khac_gia_tri', ten: 'Xuất khác tiền', kieu: 'tien', tienMat: true },
      { khoa: 'huy_kg', ten: 'Hủy kg', kieu: 'kg' },
      { khoa: 'huy_gia_tri', ten: 'Hủy tiền', kieu: 'tien', tienMat: true },
      { khoa: 'tra_ncc_kg', ten: 'Trả NCC kg', kieu: 'kg' },
      { khoa: 'kiem_ke_kg', ten: 'Kiểm kê ± kg', kieu: 'kg' },
      { khoa: 'kiem_ke_gia_tri', ten: 'Kiểm kê ± tiền', kieu: 'tien', tienMat: true },
      { khoa: 'hao_hut_kg', ten: 'Hao hụt kg', kieu: 'kg' },
      { khoa: 'hao_hut_gia_tri', ten: 'Hao hụt tiền', kieu: 'tien', tienMat: true },
      { khoa: 'cuoi_kg', ten: 'Tồn cuối kg', kieu: 'kg' },
      { khoa: 'cuoi_gia_tri', ten: 'Tồn cuối tiền', kieu: 'tien', tienMat: true },
    ],
    cong: [
      'dau_kg', 'dau_gia_tri', 'nhap_kg', 'nhap_gia_tri', 'pha_ra_kg', 'pha_vao_kg',
      'ban_kg', 'ban_gia_tri', 'xuat_bep_kg', 'xuat_bep_gia_tri', 'xuat_khac_kg', 'xuat_khac_gia_tri',
      'huy_kg', 'huy_gia_tri', 'tra_ncc_kg', 'kiem_ke_kg', 'kiem_ke_gia_tri', 'hao_hut_kg', 'hao_hut_gia_tri',
      'cuoi_kg', 'cuoi_gia_tri',
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
    moTa: 'Hàng rời kho không qua bán: hủy (theo lý do), xuất bếp, xuất khác (theo lý do), trả nhà cung cấp, thiếu / thừa khi kiểm kê, mất khi mang ra quầy.',
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
      cau: 'Chưa có phiếu hủy, xuất bếp, xuất khác, trả nhà cung cấp hay kiểm kê lệch sổ nào được duyệt trong kỳ',
      link: [{ ten: 'Chuyển · xuất · hủy', href: '/noi-bo/kho/xuat' }, { ten: 'Kiểm kê', href: '/noi-bo/kho/kiem-ke' }],
    },
  },
  // GĐ7a (0037): kho_bao_cao_ban_thuc — mỗi món tối đa hai dòng theo "Nguồn":
  // iPOS (doanh thu THẬT từ hóa đơn) và Ước tính (thiếu khi đếm quầy × giá bán
  // hiện tại, trước khi nối iPOS). Tổng cộng riêng từng nguồn — cộng số thật với
  // số ước tính thành một con số là sai nghĩa. Database chưa có 0037 thì đọc
  // hàm cũ kho_bao_cao_ban, mọi dòng là "Ước tính" (docBaoCao).
  ban: {
    ten: 'Bán hàng',
    moTa: 'Nguồn iPOS: doanh thu thật từ hóa đơn iPOS đã trừ kho. Nguồn Ước tính: phần thiếu khi đếm quầy (trước khi nối iPOS), nhân giá bán HIỆN TẠI trong danh mục. Giá vốn theo lô.',
    cot: [
      { khoa: 'ten', ten: 'Mặt hàng', kieu: 'chu' },
      { khoa: 'nguon', ten: 'Nguồn', kieu: 'chu' },
      { khoa: 'so_goi', ten: 'Gói', kieu: 'so' },
      { khoa: 'so_kg', ten: 'Kg', kieu: 'kg' },
      { khoa: 'doanh_thu', ten: 'Doanh thu', kieu: 'tien' },
      { khoa: 'gia_von', ten: 'Giá vốn', kieu: 'tien', tienMat: true },
      { khoa: 'lai_gop', ten: 'Lãi gộp', kieu: 'tien', tienMat: true },
    ],
    cong: ['so_goi', 'so_kg', 'doanh_thu', 'gia_von', 'lai_gop'],
    tongTheo: 'nguon',
    khiTrong: {
      cau: 'Chưa có số bán trong kỳ. Số bán có khi hóa đơn iPOS được trừ kho, hoặc (chưa nối iPOS) khi phiếu kiểm kê quầy được duyệt và quầy thiếu hàng so với sổ',
      link: [{ ten: 'Bán hàng iPOS', href: '/noi-bo/kho/ban-ipos' }, { ten: 'Kiểm kê', href: '/noi-bo/kho/kiem-ke' }],
    },
  },
};

/** Cột của file công nợ (từ view kho_v_cong_no_phieu). */
export const COT_CONG_NO: CotBaoCao[] = [
  { khoa: 'so_phieu', ten: 'Phiếu nhập', kieu: 'chu' },
  // "Nhập mua" / "Nợ đầu kỳ" (0035) — file .csv.ts điền bằng tenLoaiCongNo.
  { khoa: 'loai_cong_no', ten: 'Loại', kieu: 'chu' },
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

/** Cột "Nguồn" của báo cáo bán (0037). */
export const TEN_NGUON_BAN: Record<string, string> = { ipos: 'iPOS', uoc_tinh: 'Ước tính' };

export const TEN_LOAI_DONG_HAO_HUT: Record<string, string> = {
  huy: 'Hủy',
  xuat_bep: 'Xuất bếp',
  xuat_khac: 'Xuất khác',
  tra_ncc: 'Trả nhà cung cấp',
  kiem_ke_thieu: 'Kiểm kê thiếu',
  kiem_ke_thua: 'Kiểm kê thừa',
  // 0032: hàng mất khi mang ra quầy (quản lý "ghi mất" phần quầy nhận thiếu).
  hao_hut: 'Hao hụt',
};

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export async function docBaoCao(
  client: SupabaseClient, ten: string, chiNhanhId: string, tu: string, den: string,
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
  } else return { dong: [], loi: 'Không có báo cáo này.' };
  if (kq.error) return { dong: [], loi: cauLoiKho(kq.error) };
  const dong = (kq.data ?? []) as Record<string, unknown>[];
  if (ten === 'hao-hut') for (const d of dong) d.loai_dong = TEN_LOAI_DONG_HAO_HUT[String(d.loai_dong)] ?? d.loai_dong;
  if (ten === 'ban') for (const d of dong) d.nguon = TEN_NGUON_BAN[String(d.nguon)] ?? d.nguon;
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

/** Nút chọn nhanh kỳ: Hôm nay · 7 ngày · Tháng này · Tháng trước · Quý này · Năm nay (GĐ8c). */
export function kyNhanh(homNay: string): { ten: string; tu: string; den: string }[] {
  const dauThang = `${homNay.slice(0, 8)}01`;
  const cuoiThangTruoc = congNgay(dauThang, -1);
  const thang = Number(homNay.slice(5, 7));
  const thangDauQuy = String(Math.floor((thang - 1) / 3) * 3 + 1).padStart(2, '0');
  return [
    { ten: 'Hôm nay', tu: homNay, den: homNay },
    { ten: '7 ngày', tu: congNgay(homNay, -6), den: homNay },
    { ten: 'Tháng này', tu: dauThang, den: homNay },
    { ten: 'Tháng trước', tu: `${cuoiThangTruoc.slice(0, 8)}01`, den: cuoiThangTruoc },
    { ten: 'Quý này', tu: `${homNay.slice(0, 5)}${thangDauQuy}-01`, den: homNay },
    { ten: 'Năm nay', tu: `${homNay.slice(0, 5)}01-01`, den: homNay },
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

/**
 * Báo cáo theo tháng: mỗi tháng một dòng. Vai không xem giá (thủ kho, NV quầy)
 * chỉ có cột kg — database trả null cho mọi cột tiền, web bỏ hẳn các cột đó.
 */
export function dinhNghiaTheoThang(coGia: boolean): DinhNghiaBaoCao {
  const cap = (khoa: string, ten: string): CotBaoCao[] => [
    { khoa: `${khoa}_kg`, ten: `${ten} kg`, kieu: 'kg' },
    ...(coGia ? [{ khoa: `${khoa}_tien`, ten: `${ten} tiền`, kieu: 'tien' as const, tienMat: true }] : []),
  ];
  const cot: CotBaoCao[] = [
    { khoa: 'ten_thang', ten: 'Tháng', kieu: 'chu' },
    ...cap('ton_dau', 'Tồn đầu'),
    ...cap('nhap', 'Nhập'),
    ...cap('ban', 'Bán'),
    ...cap('xuat_bep', 'Xuất bếp'),
    ...cap('xuat_khac', 'Xuất khác'),
    ...cap('tra_ncc', 'Trả NCC'),
    ...cap('huy', 'Hủy'),
    ...cap('hao_hut', 'Hao hụt'),
    ...cap('pha_mat', 'Pha lóc mất'),
    ...cap('ton_cuoi', 'Tồn cuối'),
    ...(coGia ? [
      { khoa: 'chi_phi_thit', ten: 'Chi phí thịt', kieu: 'tien' as const, tienMat: true },
      { khoa: 'doanh_thu', ten: 'Doanh thu iPOS', kieu: 'tien' as const, tienMat: true },
      { khoa: 'chi_phi_tren_doanh_thu_pt', ten: 'Chi phí / doanh thu %', kieu: 'pt' as const },
    ] : []),
  ];
  // Tồn đầu / tồn cuối không cộng qua các tháng (tồn đầu năm, tồn cuối năm mới có nghĩa).
  const khongCong = new Set(['ten_thang', 'ton_dau_kg', 'ton_dau_tien', 'ton_cuoi_kg', 'ton_cuoi_tien', 'chi_phi_tren_doanh_thu_pt']);
  return {
    ten: 'Theo tháng',
    moTa: 'Mỗi tháng một dòng, theo ngày chứng từ. Nhập gồm cả tồn đầu kỳ. Hao hụt = mất khi mang ra quầy + kiểm kê thiếu − kiểm kê thừa. '
      + 'Pha lóc mất = kg tảng đem pha − kg pha ra (phần bỏ, hao khi pha). Tồn cuối = tồn đầu + nhập − các loại xuất.'
      + (coGia ? ' Chi phí thịt = bán + xuất bếp + xuất khác + hủy + hao hụt (giá vốn). Doanh thu = mọi dòng hóa đơn iPOS của tháng.' : ''),
    cot,
    cong: cot.map(c => c.khoa).filter(k => !khongCong.has(k)),
    // Tổng % chỉ lấy chi phí thịt của các tháng CÓ iPOS (chi_phi_thit_ipos — cột ẩn,
    // docTheoThang điền) — tháng chưa nối iPOS không có doanh thu để so.
    ...(coGia ? { chiaTong: { chi_phi_tren_doanh_thu_pt: { tu: 'chi_phi_thit_ipos', mau: 'doanh_thu', nhan: 100 } } } : {}),
    khiTrong: {
      cau: 'Năm này chưa có tháng nào — chọn năm khác',
      link: [{ ten: 'Tồn kho', href: '/noi-bo/kho/ton' }],
    },
  };
}

/** Năm của báo cáo theo tháng từ ?nam= (2020 … năm nay + 1); sai thì năm nay. */
export function namBaoCao(q: URLSearchParams, homNay: string): number {
  const nay = Number(homNay.slice(0, 4));
  const n = Number(q.get('nam'));
  return Number.isInteger(n) && n >= 2020 && n <= nay + 1 ? n : nay;
}

export const TEN_NHOM_MUA: Record<string, string> = { ncc: 'Theo nhà cung cấp', mat_hang: 'Theo mặt hàng' };

/** Mua hàng: nhom 'ncc' có thuế, chi phí, phải trả; nhom 'mat_hang' có giá thấp / cao. */
export function dinhNghiaMuaHang(nhom: 'ncc' | 'mat_hang'): DinhNghiaBaoCao {
  const laNcc = nhom === 'ncc';
  const cot: CotBaoCao[] = [
    { khoa: 'ten', ten: laNcc ? 'Nhà cung cấp' : 'Mặt hàng', kieu: 'chu' },
    ...(laNcc ? [] : [{ khoa: 'ma', ten: 'Mã', kieu: 'chu' as const }]),
    { khoa: 'so_phieu', ten: 'Số phiếu', kieu: 'so' },
    laNcc ? { khoa: 'so_mat_hang', ten: 'Số mặt hàng', kieu: 'so' } : { khoa: 'so_ncc', ten: 'Số NCC', kieu: 'so' },
    { khoa: 'so_kg', ten: 'Kg', kieu: 'kg' },
    { khoa: 'so_goi', ten: 'Gói', kieu: 'so' },
    { khoa: 'tien_hang', ten: 'Tiền hàng', kieu: 'tien', tienMat: true },
    ...(laNcc ? [
      { khoa: 'tien_thue', ten: 'Thuế', kieu: 'tien' as const, tienMat: true },
      { khoa: 'chi_phi_khac', ten: 'Chi phí khác', kieu: 'tien' as const, tienMat: true },
      { khoa: 'tong_tien', ten: 'Phải trả', kieu: 'tien' as const, tienMat: true },
    ] : []),
    { khoa: 'gia_tb_kg', ten: 'Giá TB/kg', kieu: 'tien', tienMat: true },
    ...(laNcc ? [] : [
      { khoa: 'gia_thap_kg', ten: 'Thấp nhất/kg', kieu: 'tien' as const, tienMat: true },
      { khoa: 'gia_cao_kg', ten: 'Cao nhất/kg', kieu: 'tien' as const, tienMat: true },
    ]),
    { khoa: 'ty_trong_pt', ten: 'Tỷ trọng %', kieu: 'pt' },
  ];
  return {
    ten: `Mua hàng ${TEN_NHOM_MUA[nhom].toLowerCase()}`,
    moTa: 'Phiếu nhập mua đã duyệt có ngày nhập trong kỳ (không gồm tồn đầu kỳ, nợ đầu kỳ). Giá TB/kg = tiền hàng ÷ kg. Tỷ trọng = phần tiền hàng trong tổng tiền hàng của kỳ.'
      + (laNcc ? ' Phải trả = tiền hóa đơn nếu đã đối chiếu, chưa thì tổng phiếu.' : ' Thuế và chi phí khác ghi theo phiếu nên không chia theo món.'),
    cot,
    // Số phiếu không cộng: một phiếu có nhiều món / mỗi NCC đếm riêng.
    cong: ['so_kg', 'so_goi', 'tien_hang', ...(laNcc ? ['tien_thue', 'chi_phi_khac', 'tong_tien'] : [])],
    chiaTong: { gia_tb_kg: { tu: 'tien_hang', mau: 'so_kg' } },
    khiTrong: {
      cau: 'Chưa có phiếu nhập mua nào được duyệt trong kỳ',
      link: [{ ten: 'Nhập hàng', href: '/noi-bo/kho/nhap' }],
    },
  };
}

export const DN_SO_THANH_TOAN: DinhNghiaBaoCao = {
  ten: 'Sổ thanh toán',
  moTa: 'Mọi khoản trả tiền, bù trừ, giảm trừ, NCC hoàn tiền trong kỳ, theo ngày. Tiền ra = tiền rời quán; tiền vào = NCC trả lại; giảm nợ = công nợ giảm bao nhiêu (NCC hoàn tiền làm nợ tăng lại nên là số âm). Khoản đã hủy vẫn hiện, tiền bằng 0.',
  cot: [
    { khoa: 'ngay', ten: 'Ngày', kieu: 'chu' },
    { khoa: 'so_phieu', ten: 'Số chứng từ', kieu: 'chu' },
    { khoa: 'ten_loai', ten: 'Loại', kieu: 'chu' },
    { khoa: 'ten_hinh_thuc', ten: 'Cách trả', kieu: 'chu' },
    { khoa: 'ten_nha_cung_cap', ten: 'Nhà cung cấp', kieu: 'chu' },
    { khoa: 'phieu_nhap', ten: 'Cho phiếu nhập', kieu: 'chu' },
    { khoa: 'tien_ra', ten: 'Tiền ra', kieu: 'tien' },
    { khoa: 'tien_vao', ten: 'Tiền vào', kieu: 'tien' },
    { khoa: 'giam_no', ten: 'Giảm nợ', kieu: 'tien' },
    { khoa: 'ten_trang_thai', ten: 'Tình trạng', kieu: 'chu' },
    { khoa: 'ghi_chu', ten: 'Ghi chú', kieu: 'chu' },
    { khoa: 'nguoi_ghi', ten: 'Người ghi', kieu: 'chu' },
  ],
  cong: ['tien_ra', 'tien_vao', 'giam_no'],
  khiTrong: {
    cau: 'Chưa có khoản trả tiền nào trong kỳ',
    link: [{ ten: 'Công nợ', href: '/noi-bo/kho/cong-no' }],
  },
};

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

export async function docTheoThang(
  client: SupabaseClient, chiNhanhId: string, nam: number,
): Promise<{ dong: DongTheoThang[]; loi: string | null }> {
  const { data, error } = await client.rpc('kho_bao_cao_theo_thang', { p_chi_nhanh_id: chiNhanhId, p_nam: nam });
  if (error) return { dong: [], loi: cauLoiKho(error) };
  const dong = ((data ?? []) as Record<string, unknown>[]).map(r => {
    const d: DongTheoThang = {
      thang: Number(r.thang), tu: String(r.tu), den: String(r.den),
      ten_thang: `Tháng ${Number(r.thang)}/${nam}`, co_ipos: r.co_ipos === true,
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

export const TEN_TRANG_THAI_THANH_TOAN: Record<string, string> = { hieu_luc: 'Có hiệu lực', da_huy: 'Đã hủy' };

export async function docSoThanhToan(
  client: SupabaseClient, chiNhanhId: string, tu: string, den: string,
): Promise<{ dong: Record<string, unknown>[]; loi: string | null }> {
  const { data, error } = await client.rpc('kho_so_thanh_toan', { p_chi_nhanh_id: chiNhanhId, p_tu: tu, p_den: den });
  if (error) return { dong: [], loi: cauLoiKho(error) };
  const dong = ((data ?? []) as Record<string, unknown>[]).map(r => ({
    ...r,
    so_tien: soHoa(r.so_tien), tien_ra: soHoa(r.tien_ra), tien_vao: soHoa(r.tien_vao), giam_no: soHoa(r.giam_no),
    ten_trang_thai: TEN_TRANG_THAI_THANH_TOAN[String(r.trang_thai)] ?? r.trang_thai,
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

export const NHOM_BAO_CAO: readonly string[] = ['Tồn kho & xuất – nhập – tồn', 'Mua hàng & công nợ', 'Hao hụt & bếp', 'Bán hàng'];

export const THE_BAO_CAO: readonly TheBaoCao[] = [
  { ma: 'xuat-nhap-ton', nhom: NHOM_BAO_CAO[0], ten: 'Xuất – nhập – tồn', link: '/noi-bo/kho/bao-cao/xuat-nhap-ton',
    moTa: 'Từng mặt hàng: tồn đầu, nhập, bán, xuất, hủy, hao hụt, tồn cuối — kg và tiền.', quyen: ['xem_gia'], ky: 'ngay', csv: 'xuat-nhap-ton' },
  { ma: 'theo-thang', nhom: NHOM_BAO_CAO[0], ten: 'Theo tháng', link: '/noi-bo/kho/bao-cao/theo-thang',
    moTa: 'Mỗi tháng một dòng: nhập, bán, hủy, hao hụt, tồn cuối; chi phí thịt so với doanh thu iPOS (tiền chỉ vai xem giá).',
    quyen: ['xem'], ky: 'nam', csv: 'theo-thang' },
  { ma: 'thu-hoi', nhom: NHOM_BAO_CAO[0], ten: 'Thu hồi pha lóc', link: '/noi-bo/kho/bao-cao/thu-hoi',
    moTa: 'Theo loại tảng và nhà cung cấp: kg vào, kg thịt, thu hồi %, giá vốn thịt.', quyen: ['xem_gia'], ky: 'ngay', csv: 'thu-hoi' },
  { ma: 'mua-ncc', nhom: NHOM_BAO_CAO[1], ten: 'Mua hàng theo nhà cung cấp', link: '/noi-bo/kho/bao-cao/mua-hang?nhom=ncc',
    moTa: 'Mỗi NCC: số phiếu, kg, tiền hàng, thuế, phải trả, giá TB/kg, tỷ trọng.', quyen: ['xem_gia'], ky: 'ngay', csv: 'mua-hang' },
  { ma: 'mua-mat-hang', nhom: NHOM_BAO_CAO[1], ten: 'Mua hàng theo mặt hàng', link: '/noi-bo/kho/bao-cao/mua-hang?nhom=mat_hang',
    moTa: 'Mỗi món: kg mua, tiền hàng, giá TB / thấp nhất / cao nhất một kg.', quyen: ['xem_gia'], ky: 'ngay', csv: 'mua-hang' },
  { ma: 'cong-no-ky', nhom: NHOM_BAO_CAO[1], ten: 'Công nợ theo kỳ, biên bản đối chiếu', link: '/noi-bo/kho/cong-no?tab=theo-doi',
    moTa: 'Nợ đầu kỳ, mua, đã trả, còn nợ của từng NCC. In biên bản đối chiếu ở trang từng nhà cung cấp.',
    quyen: ['ke_toan'], ky: 'ngay', csv: 'cong-no' },
  { ma: 'so-thanh-toan', nhom: NHOM_BAO_CAO[1], ten: 'Sổ thanh toán', link: '/noi-bo/kho/bao-cao/so-thanh-toan',
    moTa: 'Mọi khoản trả tiền, bù trừ, giảm trừ, NCC hoàn tiền theo ngày — tiền ra, tiền vào, giảm nợ.',
    quyen: ['ke_toan'], ky: 'ngay', csv: 'so-thanh-toan' },
  { ma: 'danh-gia-ncc', nhom: NHOM_BAO_CAO[1], ten: 'Đánh giá nhà cung cấp', link: '/noi-bo/kho/bao-cao/ncc',
    moTa: 'Lần giao, giao thiếu / trễ, thu hồi pha lóc, kg trả lại, điểm sao.', quyen: ['nhap', 'xem_gia'], ky: 'ngay', csv: 'ncc' },
  { ma: 'hao-hut', nhom: NHOM_BAO_CAO[2], ten: 'Hủy, xuất bếp, chênh lệch', link: '/noi-bo/kho/bao-cao/hao-hut',
    moTa: 'Hàng rời kho không qua bán: hủy theo lý do, xuất bếp, xuất khác, trả NCC, kiểm kê thiếu / thừa.',
    quyen: ['xem_gia'], ky: 'ngay', csv: 'hao-hut' },
  { ma: 'dinh-muc', nhom: NHOM_BAO_CAO[2], ten: 'Định mức bếp', link: '/noi-bo/kho/bao-cao/dinh-muc',
    moTa: 'Thịt bếp nhận so với lẽ ra dùng theo định lượng món và số suất bán.', quyen: ['xem'], ky: 'ngay', csv: 'dinh-muc' },
  { ma: 'ban', nhom: NHOM_BAO_CAO[3], ten: 'Bán hàng iPOS', link: '/noi-bo/kho/bao-cao/ban',
    moTa: 'Từng món bán ở quầy: gói, kg, doanh thu, giá vốn, lãi gộp (iPOS và phần ước tính trước khi nối iPOS).',
    quyen: ['xem_gia'], ky: 'ngay', csv: 'ban' },
];

/** Thẻ báo cáo vai này mở được. */
export function theBaoCaoCuaVai(vai: string): TheBaoCao[] {
  return THE_BAO_CAO.filter(t => t.quyen.some(q => duoc(vai, q)));
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
