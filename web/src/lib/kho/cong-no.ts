/**
 * KHO — CÔNG NỢ NHÀ CUNG CẤP, ĐỐI CHIẾU HÓA ĐƠN, TRẢ HÀNG
 *
 * Số liệu công nợ lấy từ view kho_v_cong_no_phieu / kho_v_cong_no_ncc
 * (0024) — phải trả, đã trả, giảm trừ, còn nợ, quá hạn đều do database tính.
 * File này đọc form, tải ảnh ủy nhiệm chi / biên bản, và gọi hàm.
 *
 * FORM THANH TOÁN: so_tien, hinh_thuc, ngay, ghi_chu, anh; phân bổ tùy chọn
 * pb{i}_phieu (ẩn) + pb{i}_tien — để trống hết thì database tự trả phiếu đến
 * hạn sớm nhất trước.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, docKg, docNgay, docSoNguyen, docTien, laUuid, type KetQua } from './chung.ts';
import { layTepAnh, taiAnh } from './anh.ts';

export interface CongNoNcc {
  nha_cung_cap_id: string;
  ten_nha_cung_cap: string;
  so_phieu: number;
  so_phieu_con_no: number;
  so_phieu_chua_doi_chieu: number;
  tong_phai_tra: number;
  da_tra: number;
  giam_tru: number;
  con_no: number;
  no_qua_han: number;
  han_gan_nhat: string | null;
}

export interface CongNoPhieu {
  id: string;
  so_phieu: string;
  nha_cung_cap_id: string;
  ten_nha_cung_cap: string;
  ngay_nhap: string;
  so_hoa_don: string | null;
  ngay_hoa_don: string | null;
  han_thanh_toan: string | null;
  tien_hoa_don: number | null;
  da_doi_chieu: boolean;
  ghi_chu_doi_chieu: string | null;
  tong_tien_phieu: number;
  phai_tra: number;
  da_tra: number;
  giam_tru: number;
  con_no: number;
  qua_han: boolean;
  so_ngay_qua_han: number;
}

export interface ThanhToan {
  id: string;
  so_phieu: string;
  loai: 'thanh_toan' | 'giam_tru';
  hinh_thuc: 'chuyen_khoan' | 'tien_mat' | 'khac' | null;
  so_tien: number;
  ngay: string;
  ghi_chu: string | null;
  anh: string[];
  phieu_xuat_id: string | null;
  trang_thai: 'hieu_luc' | 'da_huy';
  ly_do_huy: string | null;
  nguoi_tao: string | null;
  created_at: string;
  phan_bo: { phieu_nhap_id: string; so_tien: number }[];
}

export const TEN_HINH_THUC: Record<string, string> = {
  chuyen_khoan: 'Chuyển khoản',
  tien_mat: 'Tiền mặt',
  khac: 'Khác',
};

const so = (v: unknown) => Number(v ?? 0);

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export async function docCongNoNcc(client: SupabaseClient, chiNhanhId: string): Promise<CongNoNcc[]> {
  const { data, error } = await client
    .from('kho_v_cong_no_ncc')
    .select('nha_cung_cap_id, ten_nha_cung_cap, so_phieu, so_phieu_con_no, so_phieu_chua_doi_chieu, tong_phai_tra, da_tra, giam_tru, con_no, no_qua_han, han_gan_nhat')
    .eq('chi_nhanh_id', chiNhanhId);
  if (error) throw error;
  return (data ?? []).map(r => ({
    ...r, tong_phai_tra: so(r.tong_phai_tra), da_tra: so(r.da_tra), giam_tru: so(r.giam_tru),
    con_no: so(r.con_no), no_qua_han: so(r.no_qua_han),
  })) as CongNoNcc[];
}

export async function docCongNoPhieu(
  client: SupabaseClient, chiNhanhId: string, loc: { nccId?: string; chiQuaHan?: boolean; chuaDoiChieu?: boolean } = {},
): Promise<CongNoPhieu[]> {
  let q = client
    .from('kho_v_cong_no_phieu')
    .select('id, so_phieu, nha_cung_cap_id, ten_nha_cung_cap, ngay_nhap, so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_hoa_don, da_doi_chieu, ghi_chu_doi_chieu, tong_tien_phieu, phai_tra, da_tra, giam_tru, con_no, qua_han, so_ngay_qua_han')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('han_thanh_toan', { ascending: true, nullsFirst: false })
    .order('ngay_nhap')
    .limit(500);
  if (loc.nccId) q = q.eq('nha_cung_cap_id', loc.nccId);
  if (loc.chiQuaHan) q = q.eq('qua_han', true);
  if (loc.chuaDoiChieu) q = q.eq('da_doi_chieu', false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => ({
    ...r,
    tien_hoa_don: r.tien_hoa_don === null ? null : so(r.tien_hoa_don),
    tong_tien_phieu: so(r.tong_tien_phieu), phai_tra: so(r.phai_tra), da_tra: so(r.da_tra),
    giam_tru: so(r.giam_tru), con_no: so(r.con_no), so_ngay_qua_han: so(r.so_ngay_qua_han),
  })) as CongNoPhieu[];
}

/** Công nợ của một phiếu nhập (null nếu không phải phiếu mua đã duyệt, hoặc không xem được). */
export async function docCongNoMotPhieu(client: SupabaseClient, id: string): Promise<CongNoPhieu | null> {
  if (!laUuid(id)) return null;
  const { data } = await client
    .from('kho_v_cong_no_phieu')
    .select('id, so_phieu, nha_cung_cap_id, ten_nha_cung_cap, ngay_nhap, so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_hoa_don, da_doi_chieu, ghi_chu_doi_chieu, tong_tien_phieu, phai_tra, da_tra, giam_tru, con_no, qua_han, so_ngay_qua_han')
    .eq('id', id).maybeSingle();
  if (!data) return null;
  return {
    ...data,
    tien_hoa_don: data.tien_hoa_don === null ? null : so(data.tien_hoa_don),
    tong_tien_phieu: so(data.tong_tien_phieu), phai_tra: so(data.phai_tra), da_tra: so(data.da_tra),
    giam_tru: so(data.giam_tru), con_no: so(data.con_no), so_ngay_qua_han: so(data.so_ngay_qua_han),
  } as CongNoPhieu;
}

export async function docThanhToan(client: SupabaseClient, chiNhanhId: string, nccId: string): Promise<ThanhToan[]> {
  const { data, error } = await client
    .from('kho_thanh_toan')
    .select('id, so_phieu, loai, hinh_thuc, so_tien, ngay, ghi_chu, anh, phieu_xuat_id, trang_thai, ly_do_huy, nguoi_tao, created_at')
    .eq('chi_nhanh_id', chiNhanhId).eq('nha_cung_cap_id', nccId)
    .order('ngay', { ascending: false }).order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  const ids = (data ?? []).map(t => t.id);
  const pb = new Map<string, { phieu_nhap_id: string; so_tien: number }[]>();
  if (ids.length) {
    const { data: ds, error: e2 } = await client
      .from('kho_thanh_toan_phan_bo').select('thanh_toan_id, phieu_nhap_id, so_tien').in('thanh_toan_id', ids);
    if (e2) throw e2;
    for (const x of ds ?? []) {
      pb.set(x.thanh_toan_id, [...(pb.get(x.thanh_toan_id) ?? []), { phieu_nhap_id: x.phieu_nhap_id, so_tien: so(x.so_tien) }]);
    }
  }
  return (data ?? []).map(t => ({ ...t, so_tien: so(t.so_tien), anh: t.anh ?? [], phan_bo: pb.get(t.id) ?? [] })) as ThanhToan[];
}

export async function docTenNcc(client: SupabaseClient, nccId: string): Promise<{ id: string; ten: string; so_ngay_no: number; ngan_hang: string | null; so_tai_khoan: string | null } | null> {
  if (!laUuid(nccId)) return null;
  const { data } = await client.from('kho_nha_cung_cap').select('id, ten, so_ngay_no, ngan_hang, so_tai_khoan').eq('id', nccId).maybeSingle();
  return data ?? null;
}

// -----------------------------------------------------------------------------
// FORM → DỮ LIỆU (thuần)
// -----------------------------------------------------------------------------
export interface KetQuaDocThanhToan {
  loi: string[];
  soTien: number | null;
  phanBo: { phieu_nhap_id: string; so_tien: number }[];
  giaTri: Record<string, string>;
}

export function docFormThanhToan(form: FormData): KetQuaDocThanhToan {
  const s = (t: string) => String(form.get(t) ?? '').trim();
  const loi: string[] = [];
  const giaTri: Record<string, string> = {};
  for (const k of ['so_tien', 'hinh_thuc', 'ngay', 'ghi_chu', 'loai']) giaTri[k] = s(k);
  const soTien = docTien(giaTri.so_tien);
  if (soTien === null || Number.isNaN(soTien) || soTien <= 0) loi.push('Số tiền là số đồng lớn hơn 0 (ví dụ 5.450.000)');
  if (giaTri.ngay && docNgay(giaTri.ngay) === undefined) loi.push('Ngày không phải ngày có thật');

  const phanBo: { phieu_nhap_id: string; so_tien: number }[] = [];
  const soPb = docSoNguyen(form.get('so_pb'), 0, 500) ?? 0;
  for (let i = 0; i < (Number.isNaN(soPb) ? 0 : soPb); i++) {
    const id = s(`pb${i}_phieu`);
    const chu = s(`pb${i}_tien`);
    giaTri[`pb${i}_tien`] = chu;
    if (!chu) continue;
    const t = docTien(chu);
    if (!laUuid(id) || t === null || Number.isNaN(t) || t <= 0) { loi.push(`Số tiền trả cho phiếu thứ ${i + 1} chưa đúng`); continue; }
    phanBo.push({ phieu_nhap_id: id, so_tien: t });
  }
  if (phanBo.length && soTien && !Number.isNaN(soTien)) {
    const tong = phanBo.reduce((a, b) => a + b.so_tien, 0);
    if (tong !== soTien) loi.push(`Tổng tiền chia cho các phiếu (${tong.toLocaleString('vi-VN')} đ) phải bằng số tiền trả (${soTien.toLocaleString('vi-VN')} đ) — hoặc để trống hết để tự chia theo hạn`);
  }
  return { loi, soTien: soTien !== null && !Number.isNaN(soTien) ? soTien : null, phanBo, giaTri };
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: String(data ?? 'Xong.') };
}

export function doiChieuHoaDon(client: SupabaseClient, id: string, form: FormData): Promise<KetQua> {
  const s = (t: string) => String(form.get(t) ?? '').trim();
  const tien = docTien(s('tien_hoa_don'));
  if (tien === null || Number.isNaN(tien)) return Promise.resolve({ ok: false, cau: 'Ghi tổng tiền trên hóa đơn (ví dụ 5.450.000).' });
  const ngayHd = docNgay(s('ngay_hoa_don'));
  const han = docNgay(s('han_thanh_toan'));
  if (ngayHd === undefined || han === undefined) return Promise.resolve({ ok: false, cau: 'Ngày không phải ngày có thật.' });
  return cauTraVe(client.rpc('kho_doi_chieu_hoa_don', {
    p_id: id,
    p_so_hoa_don: s('so_hoa_don'),
    p_ngay_hoa_don: ngayHd,
    p_tien_hoa_don: tien,
    p_han_thanh_toan: han,
    p_ghi_chu: s('ghi_chu_doi_chieu') || null,
  }));
}

export async function ghiThanhToan(
  client: SupabaseClient, chiNhanhId: string, nccId: string, form: FormData,
): Promise<KetQua & { giaTri?: Record<string, string> }> {
  const doc = docFormThanhToan(form);
  if (doc.loi.length) return { ok: false, cau: doc.loi.join(' · '), giaTri: doc.giaTri };
  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) return { ok: false, cau: 'Form đã cũ — tải lại trang.', giaTri: doc.giaTri };
  const loai = doc.giaTri.loai === 'giam_tru' ? 'giam_tru' : 'thanh_toan';

  const tai = await taiAnh(client, chiNhanhId, 'thanh_toan', maGui, layTepAnh(form));
  const { data, error } = await client.rpc('kho_ghi_thanh_toan', {
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_nha_cung_cap_id: nccId,
    p_loai: loai,
    p_hinh_thuc: loai === 'thanh_toan' ? (doc.giaTri.hinh_thuc || null) : null,
    p_so_tien: doc.soTien,
    p_ngay: doc.giaTri.ngay || null,
    p_ghi_chu: doc.giaTri.ghi_chu || null,
    p_anh: tai.duongDan,
    p_phan_bo: doc.phanBo,
  });
  if (error) return { ok: false, cau: cauLoiKho(error), giaTri: doc.giaTri };
  const kq = (Array.isArray(data) ? data[0] : data) as { so_phieu: string; da_co: boolean } | undefined;
  const cauAnh = tai.loi.length ? ` Lưu ý: ${tai.loi.join(' · ')}` : '';
  return {
    ok: true,
    cau: (kq?.da_co ? `Khoản ${kq.so_phieu} đã được ghi từ lần bấm trước.`
      : `Đã ghi ${kq?.so_phieu ?? ''}: ${(doc.soTien ?? 0).toLocaleString('vi-VN')} đ${doc.phanBo.length ? '' : ' — tự chia cho phiếu đến hạn sớm nhất'}.`) + cauAnh,
  };
}

export function huyThanhToan(client: SupabaseClient, id: string, lyDo: string): Promise<KetQua> {
  return cauTraVe(client.rpc('kho_huy_thanh_toan', { p_id: id, p_ly_do: lyDo }));
}

/** Trả hàng: dòng t{i}_lo (ẩn), t{i}_kg, t{i}_goi; so_tien_giam_tru bỏ trống = tự tính. */
export async function traHangNcc(
  client: SupabaseClient, chiNhanhId: string, form: FormData, ctx: { phieuNhapId: string; viTriId: string },
): Promise<KetQua & { id?: string }> {
  const s = (t: string) => String(form.get(t) ?? '').trim();
  const loi: string[] = [];
  const dong: Record<string, unknown>[] = [];
  const soDong = docSoNguyen(form.get('so_dong'), 0, 200) ?? 0;
  for (let i = 0; i < (Number.isNaN(soDong) ? 0 : soDong); i++) {
    const lo = s(`t${i}_lo`);
    const kgChu = s(`t${i}_kg`);
    const goiChu = s(`t${i}_goi`);
    if (!kgChu && !goiChu) continue;
    const kg = docKg(kgChu);
    const goi = docSoNguyen(goiChu, 0, 100000);
    if (!laUuid(lo)) { loi.push('Lô không hợp lệ — tải lại trang'); continue; }
    if (kg === null || Number.isNaN(kg) || kg <= 0) { loi.push(`Dòng ${i + 1}: ghi số kg trả (ví dụ 4,5)`); continue; }
    if (Number.isNaN(goi)) { loi.push(`Dòng ${i + 1}: số tảng / gói là số nguyên`); continue; }
    dong.push(goi !== null ? { lo_id: lo, so_kg: kg, so_goi: goi } : { lo_id: lo, so_kg: kg });
  }
  const tienChu = s('so_tien_giam_tru');
  const tien = tienChu ? docTien(tienChu) : null;
  if (tien !== null && Number.isNaN(tien)) loi.push('Số tiền giảm trừ là số đồng (hoặc để trống để tự tính)');
  if (!dong.length && !loi.length) loi.push('Chưa ghi số kg trả ở lô nào.');
  if (loi.length) return { ok: false, cau: loi.join(' · ') };
  const maGui = s('ma_gui');
  if (!laUuid(maGui)) return { ok: false, cau: 'Form đã cũ — tải lại trang.' };

  const tai = await taiAnh(client, chiNhanhId, 'thanh_toan', maGui, layTepAnh(form));
  const { data, error } = await client.rpc('kho_tra_nha_cung_cap', {
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_phieu_nhap_id: ctx.phieuNhapId,
    p_vi_tri_id: ctx.viTriId,
    p_ghi_chu: s('ghi_chu') || null,
    p_anh: tai.duongDan,
    p_so_tien_giam_tru: tien,
    p_dong: dong,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (Array.isArray(data) ? data[0] : data) as { phieu_xuat_id: string; so_phieu: string; so_tien_giam_tru: number; da_co: boolean } | undefined;
  if (!kq) return { ok: false, cau: 'Không chắc đã ghi hay chưa — xem danh sách phiếu để kiểm tra.' };
  return {
    ok: true, id: kq.phieu_xuat_id,
    cau: kq.da_co ? `Phiếu trả hàng ${kq.so_phieu} đã được ghi từ lần bấm trước.`
      : `Đã ghi trả hàng ${kq.so_phieu}${Number(kq.so_tien_giam_tru) > 0 ? ` — giảm công nợ ${Number(kq.so_tien_giam_tru).toLocaleString('vi-VN')} đ` : ''}.`,
  };
}
