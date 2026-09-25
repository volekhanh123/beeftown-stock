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
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho } from './chung.ts';

export type KieuCot = 'chu' | 'kg' | 'tien' | 'so' | 'pt';
export interface CotBaoCao { khoa: string; ten: string; kieu: KieuCot; tienMat?: boolean }

export interface DinhNghiaBaoCao {
  ten: string;
  moTa: string;
  cot: CotBaoCao[];
  /** Tổng ở cuối bảng cho các cột này. */
  cong?: string[];
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
    cong: ['dau_gia_tri', 'nhap_gia_tri', 'ban_gia_tri', 'xuat_bep_gia_tri', 'huy_gia_tri', 'kiem_ke_gia_tri', 'cuoi_gia_tri'],
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
    cong: ['gia_tri'],
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
    cong: ['doanh_thu_uoc_tinh', 'gia_von', 'lai_gop_uoc_tinh'],
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
// CSV — hàm thuần
// -----------------------------------------------------------------------------
function oCsv(v: unknown, kieu: KieuCot): string {
  if (v === null || v === undefined || v === '') return '';
  let s: string;
  if (kieu === 'kg' || kieu === 'pt') s = String(Number(v)).replace('.', ',');
  else if (kieu === 'tien' || kieu === 'so') s = String(Math.round(Number(v)));
  else s = String(v);
  // Chặn "công thức" khi mở bằng Excel (=, +, -, @ ở đầu ô chữ).
  if (kieu === 'chu' && /^[=+\-@]/.test(s)) s = `'${s}`;
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function taoCsv(cot: CotBaoCao[], dong: Record<string, unknown>[]): string {
  const dau = cot.map(c => oCsv(c.ten, 'chu')).join(';');
  const than = dong.map(d => cot.map(c => oCsv(d[c.khoa], c.kieu)).join(';'));
  return '﻿' + [dau, ...than].join('\r\n') + '\r\n';
}

/** Kỳ báo cáo từ tham số GET; mặc định từ đầu tháng tới hôm nay (giờ VN). */
export function kyBaoCao(q: URLSearchParams, homNay: string): { tu: string; den: string } {
  const hopLe = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
  let tu = hopLe(q.get('tu')) ? q.get('tu')! : `${homNay.slice(0, 8)}01`;
  let den = hopLe(q.get('den')) ? q.get('den')! : homNay;
  if (tu > den) [tu, den] = [den, tu];
  return { tu, den };
}
