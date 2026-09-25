/**
 * KHO — PHIẾU NHẬP
 *
 * Thủ kho lập phiếu trên điện thoại khi hàng về, chụp hóa đơn; quản lý duyệt
 * thì hàng mới vào tồn. Mọi lệnh ghi đi qua các hàm kho_*_phieu_nhap trong
 * migration 0020 — file này chỉ đọc form, tải ảnh và gọi hàm.
 *
 * FORM DÒNG HÀNG — không JavaScript, nên số dòng cố định theo mỗi lần hiện
 * form: các dòng đã có + vài dòng trống. Cần thêm thì bấm "Lưu và thêm dòng".
 * Tên ô của dòng thứ i: d{i}_mat_hang, d{i}_so_goi, d{i}_so_kg, d{i}_don_gia,
 * d{i}_hsd, d{i}_nsx, d{i}_so_lo_ncc, d{i}_xoa; ô thông tin thêm tt__<khoa>__{i}.
 * Dòng chưa chọn mặt hàng và chưa nhập kg thì bỏ qua — đó là dòng trống.
 *
 * ẢNH HÓA ĐƠN — tải lên TRƯỚC khi kiểm các ô khác. Ô chọn file không điền lại
 * được sau khi trang hiện lại vì gõ sai, nên ảnh đã lên được giữ bằng ô ẩn
 * `anh_da_tai` (đường dẫn trong kho file) cùng với ma_gui của form. Lần bấm
 * sau chỉ nhận đường dẫn nằm trong thư mục <chi nhánh>/nhap/<ma_gui này>/ —
 * form không gắn được ảnh của phiếu khác. Ảnh nào cũng có ô "Giữ" (anh_giu).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, chiaSoDuLonNhat, docKg, docNgay, docSoNguyen, docTien, laUuid, type KetQua } from './chung.ts';
import { docTruongThem, type DinhNghiaTruong, type GiaTriTruong } from './truong-them.ts';
import { docAnhDaTai, layTepAnh, soThuTuCuoi, taiAnh } from './anh.ts';
import { apDungTim, type TimDs } from './tim-ds.ts';

export interface PhieuNhapTom {
  id: string;
  so_phieu: string;
  loai: 'mua' | 'ton_dau';
  trang_thai: string;
  ten_nha_cung_cap: string | null;
  ten_vi_tri: string | null;
  ngay_nhap: string;
  so_hoa_don: string | null;
  han_thanh_toan: string | null;
  so_dong: number;
  tong_kg: number;
  tong_goi: number;
  tien_hang: number;
  tong_tien: number;
  nguoi_tao: string | null;
  created_at: string;
}

export interface PhieuNhap {
  id: string;
  chi_nhanh_id: string;
  so_phieu: string;
  ma_gui: string;
  phien_ban: number;
  loai: 'mua' | 'ton_dau';
  nha_cung_cap_id: string | null;
  vi_tri_id: string;
  ngay_nhap: string;
  so_hoa_don: string | null;
  ngay_hoa_don: string | null;
  han_thanh_toan: string | null;
  tien_thue: number;
  chi_phi_khac: number;
  ghi_chu: string | null;
  anh: string[];
  truong_them: GiaTriTruong;
  trang_thai: 'nhap' | 'cho_duyet' | 'da_duyet' | 'tu_choi' | 'da_huy';
  ly_do: string | null;
  nguoi_tao: string | null;
  nguoi_gui: string | null;
  gui_luc: string | null;
  nguoi_duyet: string | null;
  duyet_luc: string | null;
  nguoi_huy: string | null;
  huy_luc: string | null;
  created_at: string;
}

export interface DongPhieuNhap {
  id: string;
  thu_tu: number;
  mat_hang_id: string;
  so_goi: number;
  so_kg: number;
  don_gia_kg: number;
  thanh_tien: number;
  so_lo_ncc: string | null;
  ngay_san_xuat: string | null;
  han_dung: string;
  truong_them: GiaTriTruong;
  lo_id: string | null;
}

/** Một dòng như đang hiện trên form — giữ nguyên chữ người dùng gõ để điền lại khi báo lỗi. */
export interface DongForm {
  mat_hang_id: string;
  so_goi: string;
  so_kg: string;
  don_gia_kg: string;
  so_lo_ncc: string;
  ngay_san_xuat: string;
  han_dung: string;
  truong_them: GiaTriTruong;
}

export interface DauForm {
  nha_cung_cap_id: string;
  vi_tri_id: string;
  ngay_nhap: string;
  so_hoa_don: string;
  ngay_hoa_don: string;
  han_thanh_toan: string;
  tien_thue: string;
  chi_phi_khac: string;
  ghi_chu: string;
  truong_them: GiaTriTruong;
}

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export async function docDanhSachPhieuNhap(
  client: SupabaseClient, chiNhanhId: string, trangThai: string | null,
  // Có tim: tìm / lọc ngày / của tôi / đọc đúng một trang (lib/kho/tim-ds.ts).
  tim?: { tim: TimDs; nhanSuId: string | null },
): Promise<PhieuNhapTom[]> {
  let q = client
    .from('kho_v_phieu_nhap')
    .select('id, so_phieu, loai, trang_thai, ten_nha_cung_cap, ten_vi_tri, ngay_nhap, so_hoa_don, han_thanh_toan, so_dong, tong_kg, tong_goi, tien_hang, tong_tien, nguoi_tao, created_at')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('created_at', { ascending: false });
  if (trangThai) q = q.eq('trang_thai', trangThai);
  q = tim
    ? apDungTim(q, tim.tim, { cotTim: ['so_phieu', 'ten_nha_cung_cap', 'so_hoa_don'], cotNgay: 'ngay_nhap', nhanSuId: tim.nhanSuId })
    : q.limit(100);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => ({
    ...r,
    tong_kg: Number(r.tong_kg), tong_goi: Number(r.tong_goi),
    tien_hang: Number(r.tien_hang), tong_tien: Number(r.tong_tien),
  })) as PhieuNhapTom[];
}

export async function demPhieuChoDuyet(client: SupabaseClient, chiNhanhId: string): Promise<number | null> {
  const { count, error } = await client
    .from('kho_phieu_nhap').select('id', { count: 'exact', head: true })
    .eq('chi_nhanh_id', chiNhanhId).eq('trang_thai', 'cho_duyet');
  return error ? null : (count ?? 0);
}

export async function docPhieuNhap(
  client: SupabaseClient, id: string,
): Promise<{ phieu: PhieuNhap; dong: DongPhieuNhap[]; maLo: Map<string, string> } | null> {
  if (!laUuid(id)) return null;
  const { data: phieu, error } = await client
    .from('kho_phieu_nhap')
    .select('id, chi_nhanh_id, so_phieu, ma_gui, phien_ban, loai, nha_cung_cap_id, vi_tri_id, ngay_nhap, so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_thue, chi_phi_khac, ghi_chu, anh, truong_them, trang_thai, ly_do, nguoi_tao, nguoi_gui, gui_luc, nguoi_duyet, duyet_luc, nguoi_huy, huy_luc, created_at')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!phieu) return null;

  const { data: dong, error: loiDong } = await client
    .from('kho_phieu_nhap_dong')
    .select('id, thu_tu, mat_hang_id, so_goi, so_kg, don_gia_kg, thanh_tien, so_lo_ncc, ngay_san_xuat, han_dung, truong_them, lo_id')
    .eq('phieu_nhap_id', id).order('thu_tu');
  if (loiDong) throw loiDong;

  const loIds = (dong ?? []).map(d => d.lo_id).filter(Boolean) as string[];
  const maLo = new Map<string, string>();
  if (loIds.length) {
    const { data: lo } = await client.from('kho_lo').select('id, ma_lo').in('id', loIds);
    for (const l of lo ?? []) maLo.set(l.id, l.ma_lo);
  }

  return {
    phieu: { ...phieu, tien_thue: Number(phieu.tien_thue), chi_phi_khac: Number(phieu.chi_phi_khac) } as PhieuNhap,
    dong: (dong ?? []).map(d => ({
      ...d, so_kg: Number(d.so_kg), don_gia_kg: Number(d.don_gia_kg), thanh_tien: Number(d.thanh_tien),
    })) as DongPhieuNhap[],
    maLo,
  };
}

// -----------------------------------------------------------------------------
// FORM → DỮ LIỆU
// -----------------------------------------------------------------------------
export function dauTuPhieu(p: PhieuNhap): DauForm {
  const tien = (n: number) => (n ? n.toLocaleString('vi-VN') : '');
  return {
    nha_cung_cap_id: p.nha_cung_cap_id ?? '',
    vi_tri_id: p.vi_tri_id,
    ngay_nhap: p.ngay_nhap,
    so_hoa_don: p.so_hoa_don ?? '',
    ngay_hoa_don: p.ngay_hoa_don ?? '',
    han_thanh_toan: p.han_thanh_toan ?? '',
    tien_thue: tien(p.tien_thue),
    chi_phi_khac: tien(p.chi_phi_khac),
    ghi_chu: p.ghi_chu ?? '',
    truong_them: p.truong_them ?? {},
  };
}

export function dongTuPhieu(ds: DongPhieuNhap[]): DongForm[] {
  return ds.map(d => ({
    mat_hang_id: d.mat_hang_id,
    so_goi: d.so_goi ? String(d.so_goi) : '',
    so_kg: String(d.so_kg).replace('.', ','),
    don_gia_kg: d.don_gia_kg ? d.don_gia_kg.toLocaleString('vi-VN') : '',
    so_lo_ncc: d.so_lo_ncc ?? '',
    ngay_san_xuat: d.ngay_san_xuat ?? '',
    han_dung: d.han_dung ?? '',
    truong_them: d.truong_them ?? {},
  }));
}

export function dongTrong(): DongForm {
  return { mat_hang_id: '', so_goi: '', so_kg: '', don_gia_kg: '', so_lo_ncc: '',
           ngay_san_xuat: '', han_dung: '', truong_them: {} };
}

export interface KetQuaDocForm {
  dau: DauForm;
  dong: DongForm[];
  loi: string[];
  /** Gửi thẳng vào p_dong của kho_luu_phieu_nhap. */
  payload: Record<string, unknown>[];
}

/**
 * Đọc form phiếu nhập. Hàm thuần — không gọi database — để test được.
 * Không kiểm những gì database kiểm tốt hơn (mặt hàng còn dùng không, ô bắt
 * buộc): chỉ đọc cho đúng kiểu và báo lỗi gõ sai sớm.
 */
export function docFormPhieuNhap(
  form: FormData,
  dinhNghiaPhieu: DinhNghiaTruong[],
  dinhNghiaLo: DinhNghiaTruong[],
  cu?: { phieu?: GiaTriTruong; dong?: GiaTriTruong[] },
): KetQuaDocForm {
  const s = (ten: string) => String(form.get(ten) ?? '').trim();
  const loi: string[] = [];

  const tt = docTruongThem(form, dinhNghiaPhieu, undefined, cu?.phieu ?? {});
  loi.push(...tt.loi);
  const dau: DauForm = {
    nha_cung_cap_id: s('nha_cung_cap_id'),
    vi_tri_id: s('vi_tri_id'),
    ngay_nhap: s('ngay_nhap'),
    so_hoa_don: s('so_hoa_don'),
    ngay_hoa_don: s('ngay_hoa_don'),
    han_thanh_toan: s('han_thanh_toan'),
    tien_thue: s('tien_thue'),
    chi_phi_khac: s('chi_phi_khac'),
    ghi_chu: s('ghi_chu'),
    truong_them: tt.giaTri,
  };

  const soDong = docSoNguyen(form.get('so_dong'), 0, 200) ?? 0;
  const dong: DongForm[] = [];
  const payload: Record<string, unknown>[] = [];

  for (let i = 0; i < (Number.isNaN(soDong) ? 0 : soDong); i++) {
    const g = (ten: string) => String(form.get(`d${i}_${ten}`) ?? '').trim();
    const ttDong = docTruongThem(form, dinhNghiaLo, i, cu?.dong?.[i] ?? {});
    const d: DongForm = {
      mat_hang_id: g('mat_hang'), so_goi: g('so_goi'), so_kg: g('so_kg'),
      don_gia_kg: g('don_gia'), so_lo_ncc: g('so_lo_ncc'),
      ngay_san_xuat: g('nsx'), han_dung: g('hsd'), truong_them: ttDong.giaTri,
    };
    if (form.get(`d${i}_xoa`) === 'co') continue;
    if (!d.mat_hang_id && !d.so_kg && !d.so_goi) continue;   // dòng trống
    dong.push(d);

    const so = dong.length;
    if (!laUuid(d.mat_hang_id)) { loi.push(`Dòng ${so}: chưa chọn mặt hàng`); continue; }
    const kg = docKg(d.so_kg);
    const goi = docSoNguyen(d.so_goi, 0, 100000);
    const gia = docTien(d.don_gia_kg);
    const hsd = docNgay(d.han_dung);
    const nsx = docNgay(d.ngay_san_xuat);
    if (kg === null || Number.isNaN(kg) || kg <= 0) loi.push(`Dòng ${so}: số kg chưa đúng (ví dụ 12,5)`);
    if (Number.isNaN(goi)) loi.push(`Dòng ${so}: số gói/tảng là số nguyên`);
    if (Number.isNaN(gia)) loi.push(`Dòng ${so}: đơn giá là số đồng mỗi kg (ví dụ 480.000)`);
    if (hsd === undefined) loi.push(`Dòng ${so}: hạn dùng không phải ngày có thật`);
    if (nsx === undefined) loi.push(`Dòng ${so}: ngày sản xuất không phải ngày có thật`);
    loi.push(...ttDong.loi.map(x => `Dòng ${so}: ${x}`));

    payload.push({
      mat_hang_id: d.mat_hang_id,
      so_kg: kg,
      so_goi: goi,
      don_gia_kg: gia,
      so_lo_ncc: d.so_lo_ncc || null,
      ngay_san_xuat: nsx || null,
      han_dung: hsd || null,
      truong_them: ttDong.giaTri,
    });
  }

  if (dau.ngay_nhap && docNgay(dau.ngay_nhap) === undefined) loi.push('Ngày nhập không phải ngày có thật');
  if (dau.ngay_hoa_don && docNgay(dau.ngay_hoa_don) === undefined) loi.push('Ngày hóa đơn không phải ngày có thật');
  if (dau.han_thanh_toan && docNgay(dau.han_thanh_toan) === undefined) loi.push('Hạn thanh toán không phải ngày có thật');
  if (Number.isNaN(docTien(dau.tien_thue))) loi.push('Tiền thuế là số đồng');
  if (Number.isNaN(docTien(dau.chi_phi_khac))) loi.push('Chi phí khác là số đồng');

  return { dau, dong, loi, payload };
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
export interface KetQuaLuu extends KetQua {
  id?: string;
  phienBan?: number;
  /** Số dòng hàng đã lưu (không kể dòng trống). */
  soDong?: number;
  dau?: DauForm;
  dong?: DongForm[];
  /** Chưa lưu được: ma_gui của form — trang hiện lại form với đúng mã này. */
  maGui?: string;
  /** Chưa lưu được: mọi ảnh form này đã tải lên (kể cả ảnh bỏ tích) — ô ẩn anh_da_tai. */
  anhDaTai?: string[];
  /** Chưa lưu được: các ảnh đang tích "Giữ" — hiện lại đúng như người dùng để. */
  anhGiu?: string[];
}

/**
 * Lưu nháp (tạo mới khi id null). Tải ảnh hóa đơn TRƯỚC khi kiểm các ô —
 * gõ sai một ô thì ảnh vẫn còn, không phải chụp lại — rồi gọi hàm database.
 */
export async function luuPhieuNhap(
  client: SupabaseClient,
  chiNhanhId: string,
  form: FormData,
  ctx: {
    id: string | null;
    phienBan: number | null;
    loai: 'mua' | 'ton_dau';
    anhCu: string[];
    dinhNghiaPhieu: DinhNghiaTruong[];
    dinhNghiaLo: DinhNghiaTruong[];
    truongThemCu?: { phieu?: GiaTriTruong; dong?: GiaTriTruong[] };
  },
): Promise<KetQuaLuu> {
  const doc = docFormPhieuNhap(form, ctx.dinhNghiaPhieu, ctx.dinhNghiaLo, ctx.truongThemCu);

  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) return { ok: false, cau: 'Form đã cũ — tải lại trang rồi nhập lại.', dau: doc.dau, dong: doc.dong };

  // Ảnh — làm TRƯỚC khi báo lỗi gõ sai. Giữ ảnh cũ của phiếu và ảnh form này
  // đã tải ở lần bấm trước (nếu còn tích "Giữ"), rồi tải thêm ảnh vừa chọn.
  // Số thứ tự ảnh mới nối tiếp ảnh đã có trong cùng thư mục ma_gui: kho file
  // không cho ghi đè.
  const tich = new Set(form.getAll('anh_giu').map(String));
  const daTaiTruoc = docAnhDaTai(form, chiNhanhId, 'nhap', maGui, 24);
  const batDau = Math.max(ctx.anhCu.length, soThuTuCuoi(daTaiTruoc)) + 1;
  const tai = await taiAnh(client, chiNhanhId, 'nhap', maGui, layTepAnh(form), batDau);
  const anh = [
    ...ctx.anhCu.filter(a => tich.has(a)),
    ...daTaiTruoc.filter(a => tich.has(a)),
    ...tai.duongDan,
  ];
  const cauAnh = tai.loi.length ? ` Lưu ý: ${tai.loi.join(' · ')}` : '';
  // Chưa lưu được: trả lại đủ để trang hiện lại form cùng ma_gui và ảnh đã lên.
  const chuaLuu = (cau: string): KetQuaLuu => ({
    ok: false,
    cau: cau + (anh.length ? ` · Ảnh vẫn còn (${anh.length} ảnh), không cần chụp lại.` : '') + cauAnh,
    dau: doc.dau, dong: doc.dong,
    maGui, anhDaTai: [...daTaiTruoc, ...tai.duongDan], anhGiu: anh,
  });

  if (doc.loi.length) return chuaLuu(doc.loi.join(' · '));

  const { data, error } = await client.rpc('kho_luu_phieu_nhap', {
    p_id: ctx.id,
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_phien_ban: ctx.phienBan,
    p_loai: ctx.loai,
    p_nha_cung_cap_id: laUuid(doc.dau.nha_cung_cap_id) ? doc.dau.nha_cung_cap_id : null,
    p_vi_tri_id: laUuid(doc.dau.vi_tri_id) ? doc.dau.vi_tri_id : null,
    p_ngay_nhap: doc.dau.ngay_nhap || null,
    p_so_hoa_don: doc.dau.so_hoa_don || null,
    p_ngay_hoa_don: doc.dau.ngay_hoa_don || null,
    p_han_thanh_toan: doc.dau.han_thanh_toan || null,
    p_tien_thue: docTien(doc.dau.tien_thue) ?? 0,
    p_chi_phi_khac: docTien(doc.dau.chi_phi_khac) ?? 0,
    p_ghi_chu: doc.dau.ghi_chu || null,
    p_anh: anh,
    p_truong_them: doc.dau.truong_them,
    p_dong: doc.payload,
  });
  if (error) return chuaLuu(cauLoiKho(error));

  const kq = (Array.isArray(data) ? data[0] : data) as { phieu_id: string; phien_ban_moi: number; da_co: boolean } | undefined;
  if (!kq) return chuaLuu('Không chắc đã lưu hay chưa — tải lại trang để kiểm tra.');

  return {
    ok: true,
    id: kq.phieu_id,
    phienBan: kq.phien_ban_moi,
    soDong: doc.payload.length,
    cau: (kq.da_co ? 'Phiếu này đã được lưu từ lần bấm trước.' : 'Đã lưu nháp.') + cauAnh,
  };
}

/** Các hàm đổi trạng thái trả về một câu tiếng Việt — hiện nguyên văn. */
async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: String(data ?? 'Xong.') };
}

export function guiDuyet(client: SupabaseClient, id: string, phienBan: number | null) {
  return cauTraVe(client.rpc('kho_gui_duyet_phieu_nhap', { p_id: id, p_phien_ban: phienBan }));
}
export function rutPhieu(client: SupabaseClient, id: string) {
  return cauTraVe(client.rpc('kho_rut_phieu_nhap', { p_id: id }));
}
export function duyetPhieu(client: SupabaseClient, id: string) {
  return cauTraVe(client.rpc('kho_duyet_phieu_nhap', { p_id: id }));
}
export function tuChoiPhieu(client: SupabaseClient, id: string, lyDo: string) {
  return cauTraVe(client.rpc('kho_tu_choi_phieu_nhap', { p_id: id, p_ly_do: lyDo }));
}
export function huyPhieu(client: SupabaseClient, id: string, lyDo: string | null) {
  return cauTraVe(client.rpc('kho_huy_phieu_nhap', { p_id: id, p_ly_do: lyDo }));
}

// -----------------------------------------------------------------------------
// XEM TRƯỚC GIÁ VỐN — cho quản lý trước khi bấm duyệt
// -----------------------------------------------------------------------------
/**
 * Cùng công thức với kho_duyet_phieu_nhap(): tiền hàng + chi phí khác chia
 * theo kg + thuế chia theo tiền hàng (mỗi khoản khi cài đặt bật).
 */
export function xemTruocGiaVon(
  dong: { so_kg: number; thanh_tien: number }[],
  chiPhiKhac: number,
  tienThue: number,
  caiDat: { chi_phi_vao_gia_von: boolean; vat_vao_gia_von: boolean } | null,
): { gia_tri: number; gia_von_kg: number }[] {
  const kg = dong.map(d => d.so_kg);
  const hang = dong.map(d => d.thanh_tien);
  const tongHang = hang.reduce((a, b) => a + b, 0);
  const cp = chiaSoDuLonNhat(caiDat?.chi_phi_vao_gia_von ? chiPhiKhac : 0, kg);
  const vat = chiaSoDuLonNhat(caiDat?.vat_vao_gia_von ? tienThue : 0, tongHang > 0 ? hang : kg);
  return dong.map((d, i) => {
    const giaTri = d.thanh_tien + cp[i] + vat[i];
    return { gia_tri: giaTri, gia_von_kg: d.so_kg > 0 ? giaTri / d.so_kg : 0 };
  });
}
