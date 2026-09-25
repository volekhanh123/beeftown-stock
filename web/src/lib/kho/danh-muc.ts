/**
 * KHO — DANH MỤC VÀ CÀI ĐẶT
 *
 * Mặt hàng, nhà cung cấp, vị trí, lý do, ô thông tin thêm, công thức pha lóc,
 * cài đặt chi nhánh. Chủ nhà hàng tự khai hết trên web — đúng yêu cầu "tôi tự
 * tạo được trường thông tin, tương tác trên web luôn".
 *
 * Quyền ở đây do database quyết định (policy của 0019). File này không kiểm
 * lại vai: một người không đủ quyền bấm được nút (nếu có) thì database từ
 * chối và câu lỗi hiện nguyên văn.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  cauLoiKho, docKg, docSoNguyen, docTien, goiYMa, laUuid, TEN_LOAI_MAT_HANG,
  type KetQua,
} from './chung.ts';
import { docTruongThem, taoKhoa, tachLuaChon, type DinhNghiaTruong, type GiaTriTruong } from './truong-them.ts';

// -----------------------------------------------------------------------------
// KIỂU
// -----------------------------------------------------------------------------
export interface MatHang {
  id: string;
  ma: string;
  ten: string;
  ten_phu: string | null;
  nhom: string | null;
  loai: 'tang' | 'phan_cat' | 'phu_pham';
  dem_goi: boolean;
  don_vi_goi: string;
  han_dung_ngay: number | null;
  canh_bao_truoc_ngay: number | null;
  gia_ban_kg: number | null;
  xu_ly_mac_dinh: 'nhap_kho' | 'chuyen_bep' | 'bo';
  ma_can: string | null;
  ton_toi_thieu_kg: number | null;
  truong_them: GiaTriTruong;
  dang_dung: boolean;
  thu_tu: number;
}

export interface NhaCungCap {
  id: string;
  ten: string;
  ma_so_thue: string | null;
  dien_thoai: string | null;
  email: string | null;
  dia_chi: string | null;
  nguoi_lien_he: string | null;
  so_ngay_no: number;
  ngan_hang: string | null;
  so_tai_khoan: string | null;
  ghi_chu: string | null;
  truong_them: GiaTriTruong;
  dang_dung: boolean;
}

export interface ViTri {
  id: string;
  chi_nhanh_id: string;
  ten: string;
  loai: 'kho' | 'quay' | 'cho_huy';
  dang_dung: boolean;
  thu_tu: number;
}

export interface LyDo {
  id: string;
  loai: 'huy' | 'xuat_bep' | 'dieu_chinh';
  ten: string;
  can_anh: boolean;
  dang_dung: boolean;
  thu_tu: number;
}

export interface CaiDat {
  chi_nhanh_id: string;
  vi_tri_nhan_hang_id: string | null;
  phuong_phap_gia_von: 'gia_tri' | 'khoi_luong';
  chi_phi_vao_gia_von: boolean;
  vat_vao_gia_von: boolean;
  nguon_so_ban: 'kiem_ke' | 'ipos';
  cho_tu_duyet: boolean;
  mau_ma_vach: string | null;
  so_le_kg: number;
  canh_bao_truoc_ngay: number;
}

export interface CongThuc {
  id: string;
  mat_hang_vao_id: string;
  ten: string;
  ghi_chu: string | null;
  dang_dung: boolean;
  dong: { id: string; mat_hang_ra_id: string; ty_le_du_kien: number | null; xu_ly: string | null; thu_tu: number }[];
}

/** Giá trị điền sẵn vào form mặt hàng: từ database khi sửa, hoặc chữ vừa gõ khi báo lỗi. */
export interface GiaTriFormMatHang {
  id?: string;
  ma: string; ten: string; ten_phu: string; nhom: string; loai: string;
  dem_goi: boolean; don_vi_goi: string; han_dung_ngay: string; canh_bao_truoc_ngay: string;
  gia_ban_kg: string; xu_ly_mac_dinh: string; ma_can: string; ton_toi_thieu_kg: string;
  thu_tu: string; dang_dung: boolean; truong_them: GiaTriTruong; gia_tri_thu_hoi_kg: string;
}

const s = (form: FormData, ten: string) => String(form.get(ten) ?? '').trim();
const sHoacNull = (form: FormData, ten: string) => s(form, ten) || null;
const co = (form: FormData, ten: string) => form.get(ten) === 'co';

// -----------------------------------------------------------------------------
// Ô THÔNG TIN THÊM
// -----------------------------------------------------------------------------
export async function docDinhNghia(client: SupabaseClient, doiTuong?: string): Promise<DinhNghiaTruong[]> {
  let q = client
    .from('kho_truong_them')
    .select('id, doi_tuong, khoa, nhan, kieu, lua_chon, bat_buoc, goi_y, dang_dung, thu_tu')
    .order('doi_tuong').order('thu_tu').order('nhan');
  if (doiTuong) q = q.eq('doi_tuong', doiTuong);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DinhNghiaTruong[];
}

export async function luuDinhNghia(client: SupabaseClient, form: FormData, daCo: DinhNghiaTruong[]): Promise<KetQua> {
  const id = s(form, 'id');
  const nhan = s(form, 'nhan');
  if (!nhan) return { ok: false, cau: 'Chưa đặt tên cho ô thông tin.' };
  if (nhan.length > 80) return { ok: false, cau: 'Tên ô dài quá 80 ký tự.' };
  const luaChon = tachLuaChon(s(form, 'lua_chon'));
  const thuTu = docSoNguyen(form.get('thu_tu'), 0, 9999) ?? 0;
  const chung = {
    nhan,
    lua_chon: luaChon,
    bat_buoc: co(form, 'bat_buoc'),
    goi_y: sHoacNull(form, 'goi_y'),
    thu_tu: Number.isNaN(thuTu) ? 0 : thuTu,
  };

  if (laUuid(id)) {
    const cu = daCo.find(d => d.id === id);
    if (cu?.kieu === 'chon' && luaChon.length === 0) {
      return { ok: false, cau: 'Ô kiểu "chọn" phải có ít nhất một lựa chọn.' };
    }
    const { data, error } = await client.from('kho_truong_them')
      .update({ ...chung, dang_dung: form.get('dang_dung') !== 'khong' })
      .eq('id', id).select('id');
    if (error) return { ok: false, cau: cauLoiKho(error) };
    if (!data?.length) return { ok: false, cau: 'Không sửa được — chỉ chủ nhà hàng sửa ô thông tin.' };
    return { ok: true, cau: `Đã lưu ô "${nhan}".` };
  }

  const doiTuong = s(form, 'doi_tuong');
  const kieu = s(form, 'kieu');
  if (!['mat_hang', 'nha_cung_cap', 'phieu_nhap', 'lo_hang'].includes(doiTuong)) {
    return { ok: false, cau: 'Chưa chọn ô này dùng cho đâu.' };
  }
  if (!['chu', 'so', 'ngay', 'chon', 'co_khong'].includes(kieu)) {
    return { ok: false, cau: 'Chưa chọn kiểu dữ liệu.' };
  }
  if (kieu === 'chon' && luaChon.length === 0) {
    return { ok: false, cau: 'Ô kiểu "chọn" cần danh sách lựa chọn — mỗi dòng một lựa chọn.' };
  }
  const khoa = taoKhoa(nhan, daCo.filter(d => d.doi_tuong === doiTuong).map(d => d.khoa));
  const { error } = await client.from('kho_truong_them')
    .insert({ ...chung, doi_tuong: doiTuong, khoa, kieu });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: `Đã tạo ô "${nhan}". Từ giờ ô này hiện trong form tương ứng.` };
}

// -----------------------------------------------------------------------------
// MẶT HÀNG
// -----------------------------------------------------------------------------
export async function docMatHang(client: SupabaseClient): Promise<MatHang[]> {
  const { data, error } = await client
    .from('kho_mat_hang')
    .select('id, ma, ten, ten_phu, nhom, loai, dem_goi, don_vi_goi, han_dung_ngay, canh_bao_truoc_ngay, gia_ban_kg, xu_ly_mac_dinh, ma_can, ton_toi_thieu_kg, truong_them, dang_dung, thu_tu')
    .order('loai').order('thu_tu').order('ten');
  if (error) throw error;
  return (data ?? []).map(r => ({
    ...r,
    gia_ban_kg: r.gia_ban_kg === null ? null : Number(r.gia_ban_kg),
    ton_toi_thieu_kg: r.ton_toi_thieu_kg === null ? null : Number(r.ton_toi_thieu_kg),
  })) as MatHang[];
}

/** Giá trị thu hồi của phụ phẩm (đ/kg). Vai không xem giá: RLS trả rỗng. */
export async function docGiaTriThuHoi(client: SupabaseClient): Promise<Map<string, number | null>> {
  const { data } = await client.from('kho_mat_hang_gia').select('mat_hang_id, gia_tri_thu_hoi_kg');
  return new Map((data ?? []).map(r => [
    r.mat_hang_id as string,
    r.gia_tri_thu_hoi_kg === null ? null : Number(r.gia_tri_thu_hoi_kg),
  ]));
}

export async function luuMatHang(
  client: SupabaseClient, form: FormData, dinhNghia: DinhNghiaTruong[], cu?: MatHang,
): Promise<KetQua> {
  const ten = s(form, 'ten');
  if (!ten) return { ok: false, cau: 'Chưa nhập tên mặt hàng.' };
  const ma = (s(form, 'ma') || goiYMa(ten)).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_.-]{0,29}$/.test(ma)) {
    return { ok: false, cau: 'Mã chỉ gồm chữ không dấu, số và dấu gạch (tối đa 30 ký tự), ví dụ C-THANNGOAI.' };
  }
  const loai = s(form, 'loai');
  if (!['tang', 'phan_cat', 'phu_pham'].includes(loai)) return { ok: false, cau: 'Chưa chọn loại mặt hàng.' };

  const han = docSoNguyen(form.get('han_dung_ngay'), 1, 3650);
  const canhBao = docSoNguyen(form.get('canh_bao_truoc_ngay'), 0, 365);
  const gia = docTien(form.get('gia_ban_kg'));
  const tonMin = docKg(form.get('ton_toi_thieu_kg'));
  const maCan = s(form, 'ma_can').replace(/^0+/, '');
  if (Number.isNaN(han)) return { ok: false, cau: 'Hạn dùng là số ngày, từ 1 đến 3650.' };
  if (Number.isNaN(canhBao)) return { ok: false, cau: 'Số ngày cảnh báo từ 0 đến 365.' };
  if (Number.isNaN(gia)) return { ok: false, cau: 'Giá bán/kg phải là số đồng, ví dụ 650.000.' };
  if (Number.isNaN(tonMin)) return { ok: false, cau: 'Tồn tối thiểu là số kg, ví dụ 2,5.' };
  if (maCan && !/^[1-9]\d{0,5}$/.test(maCan)) return { ok: false, cau: 'Mã cân là dãy số (tối đa 6 số), đúng như mã hàng cài trên cân.' };

  const { giaTri, loi } = docTruongThem(form, dinhNghia, undefined, cu?.truong_them ?? {});
  if (loi.length) return { ok: false, cau: loi.join(' · ') };

  const thuTu = docSoNguyen(form.get('thu_tu'), 0, 99999);
  const dong = {
    ma, ten, loai,
    ten_phu: sHoacNull(form, 'ten_phu'),
    nhom: sHoacNull(form, 'nhom'),
    dem_goi: form.get('dem_goi') !== 'khong',
    don_vi_goi: s(form, 'don_vi_goi') || (loai === 'tang' ? 'tảng' : 'gói'),
    han_dung_ngay: han,
    canh_bao_truoc_ngay: canhBao,
    gia_ban_kg: gia,
    xu_ly_mac_dinh: ['nhap_kho', 'chuyen_bep', 'bo'].includes(s(form, 'xu_ly_mac_dinh'))
      ? s(form, 'xu_ly_mac_dinh') : 'nhap_kho',
    ma_can: maCan || null,
    ton_toi_thieu_kg: tonMin,
    truong_them: giaTri,
    thu_tu: thuTu === null || Number.isNaN(thuTu) ? (cu?.thu_tu ?? 0) : thuTu,
    dang_dung: form.get('dang_dung') !== 'khong',
  };

  let id = cu?.id;
  if (cu) {
    const { data, error } = await client.from('kho_mat_hang').update(dong).eq('id', cu.id).select('id');
    if (error) return { ok: false, cau: cauLoiKho(error) };
    if (!data?.length) return { ok: false, cau: 'Không sửa được — tài khoản không có quyền sửa danh mục.' };
  } else {
    const { data, error } = await client.from('kho_mat_hang').insert(dong).select('id').single();
    if (error) return { ok: false, cau: cauLoiKho(error) };
    id = data.id;
  }

  // Giá trị thu hồi phụ phẩm nằm ở bảng riêng (số liệu giá vốn).
  if (form.has('gia_tri_thu_hoi_kg') && id) {
    const thuHoi = docTien(form.get('gia_tri_thu_hoi_kg'));
    if (Number.isNaN(thuHoi)) return { ok: false, cau: 'Đã lưu mặt hàng, nhưng giá trị thu hồi phải là số đồng.' };
    const { error } = await client.from('kho_mat_hang_gia')
      .upsert({ mat_hang_id: id, gia_tri_thu_hoi_kg: thuHoi }, { onConflict: 'mat_hang_id' });
    if (error) return { ok: false, cau: `Đã lưu mặt hàng, nhưng chưa lưu được giá trị thu hồi: ${cauLoiKho(error)}` };
  }

  return { ok: true, cau: cu ? `Đã lưu "${ten}".` : `Đã thêm "${ten}" (mã ${ma}).` };
}

/**
 * Nhập hàng loạt: dán từ Excel. Mỗi dòng: Tên | Loại | Nhóm | Hạn dùng (ngày)
 * | Giá bán/kg | Mã cân | Mã. Cột cách nhau bằng Tab (dán từ Excel), dấu ; hoặc
 * dấu phẩy. Chỉ cột Tên là bắt buộc. Trùng mã thì CẬP NHẬT mặt hàng cũ.
 */
export function docCsvMatHang(noiDung: string): { dong: Record<string, unknown>[]; loi: string[] } {
  const dong: Record<string, unknown>[] = [];
  const loi: string[] = [];
  const daThay = new Set<string>();
  const LOAI: Record<string, string> = {
    'tang': 'tang', 'tảng': 'tang', 'tang nhap': 'tang', 'tảng nhập': 'tang',
    'phan cat': 'phan_cat', 'phần cắt': 'phan_cat', 'cat': 'phan_cat', 'cắt': 'phan_cat', 'phan_cat': 'phan_cat',
    'phu pham': 'phu_pham', 'phụ phẩm': 'phu_pham', 'phu_pham': 'phu_pham',
  };

  noiDung.split(/\r?\n/).forEach((raw, i) => {
    const hang = raw.trim();
    if (!hang) return;
    const cot = (hang.includes('\t') ? hang.split('\t') : hang.split(/[;,]/)).map(x => x.trim());
    const [ten, loaiRaw, nhom, hanRaw, giaRaw, maCanRaw, maRaw] = cot;
    if (!ten || /^tên$/i.test(ten)) return;   // dòng tiêu đề
    const loai = LOAI[(loaiRaw ?? '').toLowerCase()] ?? (loaiRaw ? '' : 'phan_cat');
    if (!loai) { loi.push(`Dòng ${i + 1}: loại "${loaiRaw}" không hiểu (tảng / phần cắt / phụ phẩm)`); return; }
    const han = docSoNguyen(hanRaw, 1, 3650);
    const gia = docTien(giaRaw);
    const maCan = (maCanRaw ?? '').replace(/^0+/, '');
    const ma = (maRaw || goiYMa(ten)).toUpperCase();
    if (Number.isNaN(han)) { loi.push(`Dòng ${i + 1}: hạn dùng "${hanRaw}" không phải số ngày`); return; }
    if (Number.isNaN(gia)) { loi.push(`Dòng ${i + 1}: giá "${giaRaw}" không phải số đồng`); return; }
    if (maCan && !/^[1-9]\d{0,5}$/.test(maCan)) { loi.push(`Dòng ${i + 1}: mã cân "${maCanRaw}" phải là dãy số`); return; }
    if (!/^[A-Z0-9][A-Z0-9_.-]{0,29}$/.test(ma)) { loi.push(`Dòng ${i + 1}: mã "${ma}" không hợp lệ`); return; }
    if (daThay.has(ma)) { loi.push(`Dòng ${i + 1}: mã ${ma} bị lặp trong danh sách dán`); return; }
    daThay.add(ma);
    dong.push({
      ma, ten, loai,
      nhom: nhom || null,
      han_dung_ngay: han,
      gia_ban_kg: gia,
      ma_can: maCan || null,
      dem_goi: loai !== 'phu_pham',
      don_vi_goi: loai === 'tang' ? 'tảng' : loai === 'phu_pham' ? 'khay' : 'gói',
    });
  });
  return { dong, loi };
}

export async function nhapCsvMatHang(client: SupabaseClient, noiDung: string): Promise<KetQua> {
  const { dong, loi } = docCsvMatHang(noiDung);
  if (loi.length) return { ok: false, cau: `Chưa nhập gì cả. ${loi.slice(0, 5).join(' · ')}${loi.length > 5 ? ` · và ${loi.length - 5} lỗi khác` : ''}` };
  if (dong.length === 0) return { ok: false, cau: 'Không có dòng nào để nhập.' };
  if (dong.length > 500) return { ok: false, cau: 'Mỗi lần nhập tối đa 500 dòng.' };
  const { error } = await client.from('kho_mat_hang').upsert(dong, { onConflict: 'ma' });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: `Đã nhập ${dong.length} mặt hàng (mã trùng thì cập nhật).` };
}

export async function taoDanhMucMau(client: SupabaseClient): Promise<KetQua> {
  const { data, error } = await client.rpc('kho_tao_danh_muc_mau', {});
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: `Đã tạo ${data} mặt hàng mẫu. Sửa tên, hạn dùng, và NHẬP GIÁ BÁN cho từng phần cắt.` };
}

// -----------------------------------------------------------------------------
// NHÀ CUNG CẤP
// -----------------------------------------------------------------------------
export async function docNhaCungCap(client: SupabaseClient): Promise<NhaCungCap[]> {
  const { data, error } = await client
    .from('kho_nha_cung_cap')
    .select('id, ten, ma_so_thue, dien_thoai, email, dia_chi, nguoi_lien_he, so_ngay_no, ngan_hang, so_tai_khoan, ghi_chu, truong_them, dang_dung')
    .order('dang_dung', { ascending: false }).order('ten');
  if (error) throw error;
  return (data ?? []) as NhaCungCap[];
}

export async function luuNhaCungCap(
  client: SupabaseClient, form: FormData, dinhNghia: DinhNghiaTruong[], cu?: NhaCungCap,
): Promise<KetQua> {
  const ten = s(form, 'ten');
  if (!ten) return { ok: false, cau: 'Chưa nhập tên nhà cung cấp.' };
  const mst = s(form, 'ma_so_thue').replace(/\s/g, '');
  if (mst && !/^\d{10}(-\d{3})?$/.test(mst)) return { ok: false, cau: 'Mã số thuế là 10 số (hoặc 10 số-3 số).' };
  const soNgayNo = docSoNguyen(form.get('so_ngay_no'), 0, 365);
  if (Number.isNaN(soNgayNo)) return { ok: false, cau: 'Số ngày nợ từ 0 đến 365.' };

  const { giaTri, loi } = docTruongThem(form, dinhNghia, undefined, cu?.truong_them ?? {});
  if (loi.length) return { ok: false, cau: loi.join(' · ') };

  const dong = {
    ten,
    ma_so_thue: mst || null,
    dien_thoai: sHoacNull(form, 'dien_thoai'),
    email: sHoacNull(form, 'email'),
    dia_chi: sHoacNull(form, 'dia_chi'),
    nguoi_lien_he: sHoacNull(form, 'nguoi_lien_he'),
    so_ngay_no: soNgayNo ?? 0,
    ngan_hang: sHoacNull(form, 'ngan_hang'),
    so_tai_khoan: sHoacNull(form, 'so_tai_khoan'),
    ghi_chu: sHoacNull(form, 'ghi_chu'),
    truong_them: giaTri,
    dang_dung: form.get('dang_dung') !== 'khong',
  };

  if (cu) {
    const { data, error } = await client.from('kho_nha_cung_cap').update(dong).eq('id', cu.id).select('id');
    if (error) return { ok: false, cau: cauLoiKho(error) };
    if (!data?.length) return { ok: false, cau: 'Không sửa được — tài khoản không có quyền sửa nhà cung cấp.' };
    return { ok: true, cau: `Đã lưu "${ten}".` };
  }
  const { error } = await client.from('kho_nha_cung_cap').insert(dong);
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: `Đã thêm nhà cung cấp "${ten}".` };
}

// -----------------------------------------------------------------------------
// VỊ TRÍ VÀ LÝ DO
// -----------------------------------------------------------------------------
export async function docViTri(client: SupabaseClient, chiNhanhId: string): Promise<ViTri[]> {
  const { data, error } = await client
    .from('kho_vi_tri')
    .select('id, chi_nhanh_id, ten, loai, dang_dung, thu_tu')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('thu_tu').order('ten');
  if (error) throw error;
  return (data ?? []) as ViTri[];
}

export async function luuViTri(client: SupabaseClient, form: FormData, chiNhanhId: string): Promise<KetQua> {
  const id = s(form, 'id');
  const ten = s(form, 'ten');
  const loai = s(form, 'loai');
  if (!ten) return { ok: false, cau: 'Chưa nhập tên vị trí.' };
  const thuTu = docSoNguyen(form.get('thu_tu'), 0, 999);
  const dong: Record<string, unknown> = {
    ten,
    thu_tu: thuTu === null || Number.isNaN(thuTu) ? 0 : thuTu,
    dang_dung: form.get('dang_dung') !== 'khong',
  };
  if (loai === 'kho' || loai === 'quay') dong.loai = loai;

  if (laUuid(id)) {
    const { data, error } = await client.from('kho_vi_tri').update(dong).eq('id', id).select('id');
    if (error) return { ok: false, cau: cauLoiKho(error) };
    if (!data?.length) return { ok: false, cau: 'Không sửa được vị trí này.' };
    return { ok: true, cau: `Đã lưu vị trí "${ten}".` };
  }
  if (!dong.loai) return { ok: false, cau: 'Chọn loại vị trí: kho hoặc quầy.' };
  const { error } = await client.from('kho_vi_tri').insert({ ...dong, chi_nhanh_id: chiNhanhId });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: `Đã thêm vị trí "${ten}".` };
}

export async function docLyDo(client: SupabaseClient): Promise<LyDo[]> {
  const { data, error } = await client
    .from('kho_ly_do').select('id, loai, ten, can_anh, dang_dung, thu_tu')
    .order('loai').order('thu_tu').order('ten');
  if (error) throw error;
  return (data ?? []) as LyDo[];
}

export async function luuLyDo(client: SupabaseClient, form: FormData): Promise<KetQua> {
  const id = s(form, 'id');
  const ten = s(form, 'ten');
  if (!ten) return { ok: false, cau: 'Chưa nhập lý do.' };
  const thuTu = docSoNguyen(form.get('thu_tu'), 0, 999);
  const dong: Record<string, unknown> = {
    ten,
    can_anh: co(form, 'can_anh'),
    thu_tu: thuTu === null || Number.isNaN(thuTu) ? 0 : thuTu,
    dang_dung: form.get('dang_dung') !== 'khong',
  };
  if (laUuid(id)) {
    const { data, error } = await client.from('kho_ly_do').update(dong).eq('id', id).select('id');
    if (error) return { ok: false, cau: cauLoiKho(error) };
    if (!data?.length) return { ok: false, cau: 'Không sửa được lý do này.' };
    return { ok: true, cau: `Đã lưu lý do "${ten}".` };
  }
  const loai = s(form, 'loai');
  if (!['huy', 'xuat_bep', 'dieu_chinh'].includes(loai)) return { ok: false, cau: 'Chọn lý do này dùng cho việc gì.' };
  const { error } = await client.from('kho_ly_do').insert({ ...dong, loai });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: `Đã thêm lý do "${ten}".` };
}

// -----------------------------------------------------------------------------
// CÔNG THỨC PHA LÓC MẪU
// -----------------------------------------------------------------------------
export async function docCongThuc(client: SupabaseClient): Promise<CongThuc[]> {
  const { data, error } = await client
    .from('kho_cong_thuc_pha')
    .select('id, mat_hang_vao_id, ten, ghi_chu, dang_dung')
    .order('ten');
  if (error) throw error;
  const { data: dong, error: loiDong } = await client
    .from('kho_cong_thuc_pha_dong')
    .select('id, cong_thuc_id, mat_hang_ra_id, ty_le_du_kien, xu_ly, thu_tu')
    .order('thu_tu');
  if (loiDong) throw loiDong;
  return (data ?? []).map(ct => ({
    ...ct,
    dong: (dong ?? []).filter(d => d.cong_thuc_id === ct.id).map(d => ({
      ...d, ty_le_du_kien: d.ty_le_du_kien === null ? null : Number(d.ty_le_du_kien),
    })),
  })) as CongThuc[];
}

export async function luuCongThuc(client: SupabaseClient, form: FormData): Promise<KetQua> {
  const id = s(form, 'id');
  const ten = s(form, 'ten');
  if (!ten) return { ok: false, cau: 'Chưa đặt tên công thức.' };
  if (laUuid(id)) {
    const { data, error } = await client.from('kho_cong_thuc_pha')
      .update({ ten, ghi_chu: sHoacNull(form, 'ghi_chu'), dang_dung: form.get('dang_dung') !== 'khong' })
      .eq('id', id).select('id');
    if (error) return { ok: false, cau: cauLoiKho(error) };
    if (!data?.length) return { ok: false, cau: 'Không sửa được công thức này.' };
    return { ok: true, cau: `Đã lưu công thức "${ten}".` };
  }
  const vao = s(form, 'mat_hang_vao_id');
  if (!laUuid(vao)) return { ok: false, cau: 'Chọn tảng / phần cắt đầu vào.' };
  const { error } = await client.from('kho_cong_thuc_pha')
    .insert({ ten, mat_hang_vao_id: vao, ghi_chu: sHoacNull(form, 'ghi_chu') });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: `Đã tạo công thức "${ten}". Thêm các phần ra ở bên dưới.` };
}

export async function themDongCongThuc(client: SupabaseClient, form: FormData): Promise<KetQua> {
  const congThuc = s(form, 'cong_thuc_id');
  const ra = s(form, 'mat_hang_ra_id');
  if (!laUuid(congThuc) || !laUuid(ra)) return { ok: false, cau: 'Chọn mặt hàng ra.' };
  const tyLe = docKg(form.get('ty_le_du_kien'));
  if (Number.isNaN(tyLe) || (tyLe !== null && tyLe > 100)) return { ok: false, cau: 'Tỉ lệ dự kiến là % từ 0 đến 100, ví dụ 72,5.' };
  const xuLy = s(form, 'xu_ly');
  const thuTu = docSoNguyen(form.get('thu_tu'), 0, 999);
  const { error } = await client.from('kho_cong_thuc_pha_dong').upsert({
    cong_thuc_id: congThuc, mat_hang_ra_id: ra, ty_le_du_kien: tyLe,
    xu_ly: ['nhap_kho', 'chuyen_bep', 'bo'].includes(xuLy) ? xuLy : null,
    thu_tu: thuTu === null || Number.isNaN(thuTu) ? 0 : thuTu,
  }, { onConflict: 'cong_thuc_id,mat_hang_ra_id' });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: 'Đã lưu dòng công thức.' };
}

export async function xoaDongCongThuc(client: SupabaseClient, form: FormData): Promise<KetQua> {
  const id = s(form, 'id');
  if (!laUuid(id)) return { ok: false, cau: 'Dòng không hợp lệ.' };
  const { data, error } = await client.from('kho_cong_thuc_pha_dong').delete().eq('id', id).select('id');
  if (error) return { ok: false, cau: cauLoiKho(error) };
  if (!data?.length) return { ok: false, cau: 'Không xóa được dòng này.' };
  return { ok: true, cau: 'Đã bỏ dòng khỏi công thức.' };
}

// -----------------------------------------------------------------------------
// CÀI ĐẶT CHI NHÁNH
// -----------------------------------------------------------------------------
export async function docCaiDat(client: SupabaseClient, chiNhanhId: string): Promise<CaiDat | null> {
  const { data, error } = await client
    .from('kho_cai_dat')
    .select('chi_nhanh_id, vi_tri_nhan_hang_id, phuong_phap_gia_von, chi_phi_vao_gia_von, vat_vao_gia_von, nguon_so_ban, cho_tu_duyet, mau_ma_vach, so_le_kg, canh_bao_truoc_ngay')
    .eq('chi_nhanh_id', chiNhanhId).maybeSingle();
  if (error) throw error;
  return (data ?? null) as CaiDat | null;
}

export async function luuCaiDat(client: SupabaseClient, form: FormData, chiNhanhId: string): Promise<KetQua> {
  const viTri = s(form, 'vi_tri_nhan_hang_id');
  const mau = s(form, 'mau_ma_vach').toUpperCase();
  const soLe = docSoNguyen(form.get('so_le_kg'), 0, 3);
  const canhBao = docSoNguyen(form.get('canh_bao_truoc_ngay'), 0, 60);
  if (soLe === null || Number.isNaN(soLe)) return { ok: false, cau: 'Số lẻ của trọng lượng từ 0 đến 3.' };
  if (canhBao === null || Number.isNaN(canhBao)) return { ok: false, cau: 'Số ngày cảnh báo từ 0 đến 60.' };
  if (mau && !(mau.length === 13 && /^[0-9X]*C{1,6}[0-9X]*(W{3,6}|P{3,7})[0-9X]*K$/.test(mau))) {
    return { ok: false, cau: 'Mẫu mã vạch phải đủ 13 ký tự, gồm C (mã hàng), W hoặc P (trọng lượng hoặc tiền) và kết thúc bằng K.' };
  }
  const { error } = await client.rpc('kho_luu_cai_dat', {
    p_chi_nhanh_id: chiNhanhId,
    p_vi_tri_nhan_hang_id: laUuid(viTri) ? viTri : null,
    p_mau_ma_vach: mau || null,
    p_so_le_kg: soLe,
    p_canh_bao_truoc_ngay: canhBao,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: 'Đã lưu cài đặt kho.' };
}

export async function luuCaiDatGoc(client: SupabaseClient, form: FormData, chiNhanhId: string): Promise<KetQua> {
  const phuongPhap = s(form, 'phuong_phap_gia_von');
  const nguon = s(form, 'nguon_so_ban');
  if (!['gia_tri', 'khoi_luong'].includes(phuongPhap)) return { ok: false, cau: 'Chọn cách chia giá vốn khi pha lóc.' };
  if (!['kiem_ke', 'ipos'].includes(nguon)) return { ok: false, cau: 'Chọn nguồn số bán.' };
  const { error } = await client.rpc('kho_luu_cai_dat_goc', {
    p_chi_nhanh_id: chiNhanhId,
    p_phuong_phap_gia_von: phuongPhap,
    p_chi_phi_vao_gia_von: co(form, 'chi_phi_vao_gia_von'),
    p_vat_vao_gia_von: co(form, 'vat_vao_gia_von'),
    p_nguon_so_ban: nguon,
    p_cho_tu_duyet: co(form, 'cho_tu_duyet'),
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: 'Đã lưu cách tính giá vốn và nguồn số bán.' };
}

/** Danh sách mặt hàng gom theo loại, để dựng ô chọn có nhóm. */
export function nhomTheoLoai(ds: MatHang[]): { loai: string; ten: string; hang: MatHang[] }[] {
  return (['tang', 'phan_cat', 'phu_pham'] as const)
    .map(loai => ({ loai, ten: TEN_LOAI_MAT_HANG[loai], hang: ds.filter(m => m.loai === loai) }))
    .filter(n => n.hang.length > 0);
}
