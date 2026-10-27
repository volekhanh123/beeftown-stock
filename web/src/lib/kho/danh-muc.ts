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
 *
 * Hai thứ tiếng: câu báo KetQua mang thêm cauEn; lỗi đọc ô dán trả loi và loiEn
 * song song. Đơn vị đếm mặc định ('tảng', 'gói', 'khay') là giá trị lưu vào
 * database — dữ liệu, không dịch. Ô dán nhận từ khóa tiếng Việt như cũ ("tảng",
 * "phần cắt", "kho lạnh"…) và thêm vài từ tiếng Anh cho màn tiếng Anh.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  boDau, cauLoiKho, docKg, docSoNguyen, docTien, goiYMa, kqHai, kqLoi, laUuid, TEN_LOAI_MAT_HANG_NB,
  type HaiThuTieng, type KetQua, type NgonNguNB,
} from './chung.ts';
import { dichCau } from '../cau-noi-bo.ts';
import { docTruongThem, taoKhoa, tachLuaChon, type DinhNghiaTruong, type GiaTriTruong } from './truong-them.ts';
import { docMaMisa } from './misa.ts';
import { docChuBangU, luuBangU } from './tang.ts';
import { docChuOMa, luuOMa } from './o-ma.ts';

// -----------------------------------------------------------------------------
// KIỂU
// -----------------------------------------------------------------------------
export interface MatHang {
  id: string;
  ma: string;
  ten: string;
  ten_phu: string | null;
  nhom: string | null;
  loai: LoaiMatHang;
  dem_goi: boolean;
  don_vi_goi: string;
  han_dung_ngay: number | null;
  canh_bao_truoc_ngay: number | null;
  gia_ban_kg: number | null;
  xu_ly_mac_dinh: 'nhap_kho' | 'chuyen_bep' | 'bo';
  ma_can: string | null;
  ton_toi_thieu_kg: number | null;
  /** Sau pha lóc, gói quét nhãn để ở đâu (0033): kho | quay; null = kho lạnh. */
  noi_de_sau_pha: 'kho' | 'quay' | null;
  /** Mức kho lạnh cho gợi ý đặt hàng (0039, kg); null = chưa cài. */
  kho_toi_thieu_kg: number | null;
  kho_toi_da_kg: number | null;
  /** Mã hàng bên MISA (0040); null = file MISA dùng mã nội bộ, cờ thiếu mã. */
  ma_misa?: string | null;
  /** Theo dõi theo tảng (0048): mỗi tảng nhận vào là một lô có ngày mổ, số tảng. Chỉ món loại tảng. */
  theo_tang?: boolean;
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
  /** Số ngày từ lúc đặt tới lúc hàng về (0039, mặc định 1). */
  so_ngay_giao: number;
  /** Thứ NCC giao (1 = Thứ Hai … 7 = Chủ nhật); null = ngày nào cũng giao (0039). */
  ngay_giao_trong_tuan: number[] | null;
  ngan_hang: string | null;
  so_tai_khoan: string | null;
  ghi_chu: string | null;
  truong_them: GiaTriTruong;
  dang_dung: boolean;
  /** Cách NCC xuất hóa đơn (0040): mỗi lần giao một hóa đơn, hay gộp nhiều lần giao. */
  kieu_hoa_don?: 'tung_lan' | 'gop';
  /** Mã NCC bên MISA (0040). */
  ma_misa?: string | null;
}

export interface ViTri {
  id: string;
  chi_nhanh_id: string;
  ten: string;
  loai: 'kho' | 'quay' | 'cho_huy' | 'dang_chuyen';
  dang_dung: boolean;
  thu_tu: number;
}

export interface LyDo {
  id: string;
  loai: 'huy' | 'xuat_bep' | 'dieu_chinh' | 'xuat_khac';
  ten: string;
  can_anh: boolean;
  dang_dung: boolean;
  thu_tu: number;
  /** Chỉ có nghĩa với lý do Xuất bếp (0044): false = phiếu xuất bếp lý do này KHÔNG tính vào định mức (vd Cơm nhân viên). */
  tinh_dinh_muc: boolean;
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

// -----------------------------------------------------------------------------
// Ô RIÊNG CỦA TỪNG LOẠI MẶT HÀNG
// -----------------------------------------------------------------------------
// Form mặt hàng hỏi loại trước, rồi chỉ hiện ô của loại đó (FormMatHang.astro, CSS :has()).
// Ô chung (tên, nhóm, hạn dùng) và mục gập "Thông tin thêm" không nằm trong bảng này.
// Ô của loại khác vẫn ở trong form (ẩn) và vẫn được gửi — kể cả số người dùng gõ rồi mới
// đổi loại — nên luuMatHang BỎ QUA chúng: giữ giá trị cũ khi sửa, mặc định khi thêm mới.
export const LOAI_MAT_HANG = ['tang', 'phan_cat', 'phu_pham'] as const;
export type LoaiMatHang = typeof LOAI_MAT_HANG[number];

export type ORiengLoai =
  | 'theo_tang' | 'bang_u' | 'muc_kho'
  | 'gia_ban_kg' | 'ma_can' | 'ton_toi_thieu_kg' | 'noi_de_sau_pha' | 'o_ma'
  | 'gia_tri_thu_hoi_kg' | 'xu_ly_mac_dinh';

/** Ô riêng của từng loại. 'muc_kho' = hai ô kho lạnh tối thiểu / tối đa (gợi ý đặt hàng). */
export const O_THEO_LOAI: Record<LoaiMatHang, readonly ORiengLoai[]> = {
  tang:     ['theo_tang', 'bang_u', 'muc_kho'],
  phan_cat: ['gia_ban_kg', 'ma_can', 'ton_toi_thieu_kg', 'muc_kho', 'noi_de_sau_pha', 'o_ma'],
  phu_pham: ['gia_tri_thu_hoi_kg', 'xu_ly_mac_dinh'],
};

export const laLoaiMatHang = (x: string): x is LoaiMatHang => (LOAI_MAT_HANG as readonly string[]).includes(x);

/** Ô `o` có thuộc loại `loai` không. Loại lạ → không ô riêng nào. */
export const oCuaLoai = (loai: string, o: ORiengLoai): boolean => laLoaiMatHang(loai) && O_THEO_LOAI[loai].includes(o);

/** Các loại có ô `o`, cách nhau dấu cách — giá trị thuộc tính data-loai của FormMatHang. */
export const loaiCoO = (o: ORiengLoai): string => LOAI_MAT_HANG.filter(l => O_THEO_LOAI[l].includes(o)).join(' ');

/**
 * Cách đếm mặc định theo loại: tảng đếm từng tảng, phần cắt đếm gói, phụ phẩm chỉ cân (đổ chung khay).
 * Dùng khi thêm mặt hàng mà ô "Đếm theo" để "Theo loại" và khi dán Excel.
 */
export function demMacDinh(loai: string): { dem_goi: boolean; don_vi_goi: string } {
  if (loai === 'tang') return { dem_goi: true, don_vi_goi: 'tảng' };
  if (loai === 'phu_pham') return { dem_goi: false, don_vi_goi: 'khay' };
  return { dem_goi: true, don_vi_goi: 'gói' };
}

/** Giá trị điền sẵn vào form mặt hàng: từ database khi sửa, hoặc chữ vừa gõ khi báo lỗi. */
export interface GiaTriFormMatHang {
  id?: string;
  /** loai '' = chưa chọn (form mới): form chỉ hiện ô chọn loại. */
  ma: string; ten: string; ten_phu: string; nhom: string; loai: string;
  /** null = "Theo loại" (chỉ form thêm mới): luuMatHang dùng demMacDinh(loai). */
  dem_goi: boolean | null;
  don_vi_goi: string; han_dung_ngay: string; canh_bao_truoc_ngay: string;
  gia_ban_kg: string; xu_ly_mac_dinh: string; ma_can: string; ton_toi_thieu_kg: string;
  /** '' = kho lạnh (mặc định), 'quay' = quầy. */
  noi_de_sau_pha: string;
  /** Mức kho lạnh cho gợi ý đặt hàng (0039). */
  kho_toi_thieu_kg: string; kho_toi_da_kg: string;
  /** Mã hàng bên MISA (0040). */
  ma_misa?: string;
  /** Theo dõi theo tảng và bảng ủ dạng chữ "5:18, 10:14, 10" (0048). */
  theo_tang?: boolean;
  bang_u?: string;
  /** Ô mã của phần cắt theo tảng, dạng "10011-10019" (0049). */
  o_ma?: string;
  thu_tu: string; dang_dung: boolean; truong_them: GiaTriTruong; gia_tri_thu_hoi_kg: string;
}

const s = (form: FormData, ten: string) => String(form.get(ten) ?? '').trim();
const sHoacNull = (form: FormData, ten: string) => s(form, ten) || null;
const co = (form: FormData, ten: string) => form.get(ten) === 'co';

/** Số ít / số nhiều cho câu tiếng Anh. */
const soIt = (n: number, mot: string, nhieu: string) => (n === 1 ? mot : nhieu);

/** Lỗi database / mạng ở hai thứ tiếng — để ghép vào câu báo của thư viện. */
function loiHai(e: unknown): HaiThuTieng {
  const vi = cauLoiKho(e);
  return { vi, en: dichCau('en', vi) };
}

/** Lỗi ô thông tin thêm (docTruongThem) → câu báo hai thứ tiếng. */
const kqLoiTruong = (loi: string[], loiEn: string[]): KetQua => kqHai(false, { vi: loi.join(' · '), en: loiEn.join(' · ') });

/** Câu báo dùng lại ở nhiều chỗ. */
const CAU = {
  maMisa: {
    vi: 'Mã MISA chỉ gồm chữ không dấu, số và các dấu _ . / - (tối đa 40 ký tự).',
    en: 'The MISA code can only contain unaccented letters, digits and the characters _ . / - (up to 40 characters).',
  },
} satisfies Record<string, HaiThuTieng>;

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
  if (!nhan) return kqHai(false, { vi: 'Chưa đặt tên cho ô thông tin.', en: 'Enter a name for the field.' });
  if (nhan.length > 80) return kqHai(false, { vi: 'Tên ô dài quá 80 ký tự.', en: 'The field name is longer than 80 characters.' });
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
      return kqHai(false, { vi: 'Ô kiểu "chọn" phải có ít nhất một lựa chọn.', en: 'A "Pick from a list" field needs at least one option.' });
    }
    const { data, error } = await client.from('kho_truong_them')
      .update({ ...chung, dang_dung: form.get('dang_dung') !== 'khong' })
      .eq('id', id).select('id');
    if (error) return { ok: false, cau: cauLoiKho(error) };
    if (!data?.length) return kqHai(false, { vi: 'Không sửa được — chỉ chủ nhà hàng sửa ô thông tin.', en: 'Not saved — only the owner can edit custom fields.' });
    return kqHai(true, { vi: `Đã lưu ô "${nhan}".`, en: `Saved the field "${nhan}".` });
  }

  const doiTuong = s(form, 'doi_tuong');
  const kieu = s(form, 'kieu');
  if (!['mat_hang', 'nha_cung_cap', 'phieu_nhap', 'lo_hang'].includes(doiTuong)) {
    return kqHai(false, { vi: 'Chưa chọn ô này dùng cho đâu.', en: 'Choose what this field is for.' });
  }
  if (!['chu', 'so', 'ngay', 'chon', 'co_khong'].includes(kieu)) {
    return kqHai(false, { vi: 'Chưa chọn kiểu dữ liệu.', en: 'Choose a data type.' });
  }
  if (kieu === 'chon' && luaChon.length === 0) {
    return kqHai(false, { vi: 'Ô kiểu "chọn" cần danh sách lựa chọn — mỗi dòng một lựa chọn.',
                          en: 'A "Pick from a list" field needs a list of options — one option per line.' });
  }
  const khoa = taoKhoa(nhan, daCo.filter(d => d.doi_tuong === doiTuong).map(d => d.khoa));
  const { error } = await client.from('kho_truong_them')
    .insert({ ...chung, doi_tuong: doiTuong, khoa, kieu });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, { vi: `Đã tạo ô "${nhan}". Từ giờ ô này hiện trong form tương ứng.`,
                       en: `Created the field "${nhan}". It now appears in the matching form.` });
}

// -----------------------------------------------------------------------------
// MẶT HÀNG
// -----------------------------------------------------------------------------
export async function docMatHang(client: SupabaseClient): Promise<MatHang[]> {
  const { data, error } = await client
    .from('kho_mat_hang')
    .select('id, ma, ten, ten_phu, nhom, loai, dem_goi, don_vi_goi, han_dung_ngay, canh_bao_truoc_ngay, gia_ban_kg, xu_ly_mac_dinh, ma_can, ton_toi_thieu_kg, noi_de_sau_pha, kho_toi_thieu_kg, kho_toi_da_kg, ma_misa, theo_tang, truong_them, dang_dung, thu_tu')
    .order('loai').order('thu_tu').order('ten');
  if (error) throw error;
  return (data ?? []).map(r => ({
    ...r,
    gia_ban_kg: r.gia_ban_kg === null ? null : Number(r.gia_ban_kg),
    ton_toi_thieu_kg: r.ton_toi_thieu_kg === null ? null : Number(r.ton_toi_thieu_kg),
    kho_toi_thieu_kg: r.kho_toi_thieu_kg === null || r.kho_toi_thieu_kg === undefined ? null : Number(r.kho_toi_thieu_kg),
    kho_toi_da_kg: r.kho_toi_da_kg === null || r.kho_toi_da_kg === undefined ? null : Number(r.kho_toi_da_kg),
    noi_de_sau_pha: r.noi_de_sau_pha === 'kho' || r.noi_de_sau_pha === 'quay' ? r.noi_de_sau_pha : null,
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
  if (!ten) return kqHai(false, { vi: 'Chưa nhập tên mặt hàng.', en: 'Enter the item name.' });
  const ma = (s(form, 'ma') || goiYMa(ten)).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_.-]{0,29}$/.test(ma)) {
    return kqHai(false, { vi: 'Mã chỉ gồm chữ không dấu, số và dấu gạch (tối đa 30 ký tự), ví dụ C-THANNGOAI.',
                          en: 'The code can only contain unaccented letters, digits and dashes (up to 30 characters), for example C-THANNGOAI.' });
  }
  const loai = s(form, 'loai');
  if (!laLoaiMatHang(loai)) return kqHai(false, { vi: 'Chưa chọn loại mặt hàng.', en: 'Choose the item type.' });
  // Ô của loại khác (ẩn trên form, vẫn gửi lên): bỏ qua chữ gửi lên — xem O_THEO_LOAI.
  //   · thêm mới: mặc định;
  //   · sửa, cùng loại: giữ giá trị cũ (món cũ có thể còn số từ form trước; sửa ở trang Sửa nhanh);
  //   · sửa, ĐỔI loại: bỏ — ô của loại cũ không còn nghĩa, và form không còn ô để xóa (vd phụ phẩm
  //     còn mã cân thì vẫn bị gửi xuống cân, vẫn giữ chỗ mã cân đó). Câu báo kể ra các ô đã bỏ.
  const coO = (o: ORiengLoai) => oCuaLoai(loai, o);
  const doiLoai = !!cu && cu.loai !== loai;
  const oCu = <T,>(x: T | null | undefined): T | null => (doiLoai ? null : (x ?? null));
  const daBo: HaiThuTieng[] = [];
  const ghiBo = (o: ORiengLoai, coGiaTri: boolean, ten: HaiThuTieng) => { if (doiLoai && !coO(o) && coGiaTri) daBo.push(ten); };
  ghiBo('ma_can', !!cu?.ma_can, { vi: `mã cân ${cu?.ma_can}`, en: `scale code ${cu?.ma_can}` });
  ghiBo('gia_ban_kg', cu?.gia_ban_kg != null, { vi: 'giá bán/kg', en: 'sale price/kg' });
  ghiBo('ton_toi_thieu_kg', cu?.ton_toi_thieu_kg != null, { vi: 'quầy tối thiểu', en: 'counter minimum' });
  ghiBo('muc_kho', cu?.kho_toi_thieu_kg != null || cu?.kho_toi_da_kg != null, { vi: 'mức kho lạnh', en: 'cold store levels' });
  ghiBo('noi_de_sau_pha', cu?.noi_de_sau_pha === 'quay', { vi: 'sau pha để ở quầy', en: 'after butchery to the counter' });
  ghiBo('xu_ly_mac_dinh', !!cu && cu.xu_ly_mac_dinh !== 'nhap_kho', { vi: 'xử lý sau pha', en: 'default butchery handling' });
  ghiBo('theo_tang', !!cu?.theo_tang, { vi: 'theo dõi theo tảng', en: 'per-primal tracking' });

  const han = docSoNguyen(form.get('han_dung_ngay'), 1, 3650);
  const canhBao = docSoNguyen(form.get('canh_bao_truoc_ngay'), 0, 365);
  const gia = coO('gia_ban_kg') ? docTien(form.get('gia_ban_kg')) : oCu(cu?.gia_ban_kg);
  const tonMin = coO('ton_toi_thieu_kg') ? docKg(form.get('ton_toi_thieu_kg')) : oCu(cu?.ton_toi_thieu_kg);
  const maCan = coO('ma_can') ? s(form, 'ma_can').replace(/^0+/, '') : (oCu(cu?.ma_can) ?? '');
  if (Number.isNaN(han)) return kqHai(false, { vi: 'Hạn dùng là số ngày, từ 1 đến 3650.', en: 'Use-by is a number of days, from 1 to 3650.' });
  if (Number.isNaN(canhBao)) return kqHai(false, { vi: 'Số ngày cảnh báo từ 0 đến 365.', en: 'Warning days must be from 0 to 365.' });
  if (Number.isNaN(gia)) return kqHai(false, { vi: 'Giá bán/kg phải là số đồng, ví dụ 650.000.', en: 'The sale price/kg must be an amount in VND, for example 650,000.' });
  if (Number.isNaN(tonMin)) return kqHai(false, { vi: 'Tồn tối thiểu là số kg, ví dụ 2,5.', en: 'The counter minimum must be a number of kg, for example 2.5.' });
  if (maCan && !/^[1-9]\d{0,5}$/.test(maCan)) {
    return kqHai(false, { vi: 'Mã cân là dãy số (tối đa 6 số), đúng như mã hàng cài trên cân.',
                          en: 'The scale code is a number of up to 6 digits, exactly as set up on the scale.' });
  }
  // Mức kho lạnh (0039) — chỉ khi form có hai ô này và loại có ô này; đổi sang loại không có ô này thì
  // xóa mức cũ (null). Ghi qua kho_luu_muc_dat_hang sau khi lưu mặt hàng.
  const coMucKho = (coO('muc_kho') && (form.has('kho_toi_da_kg') || form.has('kho_toi_thieu_kg')))
    || (doiLoai && !coO('muc_kho'));
  const khoMin = coMucKho && coO('muc_kho') ? docKg(form.get('kho_toi_thieu_kg')) : null;
  const khoMax = coMucKho && coO('muc_kho') ? docKg(form.get('kho_toi_da_kg')) : null;
  if (Number.isNaN(khoMin) || Number.isNaN(khoMax)) {
    return kqHai(false, { vi: 'Mức kho lạnh là số kg, ví dụ 20 hoặc 12,5.', en: 'Cold store levels are numbers of kg, for example 20 or 12.5.' });
  }
  if (khoMax === 0) {
    return kqHai(false, { vi: 'Mức tối đa kho lạnh phải lớn hơn 0 (bỏ trống nếu không dùng).',
                          en: 'The cold store maximum must be more than 0 (leave it empty if not used).' });
  }
  if (khoMin !== null && khoMax !== null && khoMin > khoMax) {
    return kqHai(false, { vi: 'Mức tối thiểu kho lạnh không được lớn hơn mức tối đa.',
                          en: 'The cold store minimum cannot be more than the maximum.' });
  }

  const { giaTri, loi, loiEn } = docTruongThem(form, dinhNghia, undefined, cu?.truong_them ?? {});
  if (loi.length) return kqLoiTruong(loi, loiEn);

  // Mã MISA (0040) — chỉ khi form có ô này; trống = xóa mã.
  const maMisa = form.has('ma_misa') ? docMaMisa(form.get('ma_misa')) : null;
  if (maMisa === undefined) return kqHai(false, CAU.maMisa);

  // Theo dõi theo tảng + bảng ủ (0048) — chỉ khi form có hai ô này. Đọc bảng ủ TRƯỚC khi ghi gì.
  // Món không phải tảng thì luôn tắt (ràng buộc của 0048), kể cả khi ô ẩn còn gửi "co". Bảng ủ chỉ
  // hiện khi theo dõi theo tảng là Có — tắt thì bỏ qua ô (giữ bảng cũ), không báo lỗi ô người dùng không thấy.
  const theoTang = form.has('theo_tang') ? loai === 'tang' && form.get('theo_tang') === 'co' : undefined;
  const bangU = form.has('bang_u') && coO('bang_u') && theoTang !== false ? docChuBangU(String(form.get('bang_u') ?? '')) : null;
  if (bangU?.loi) return kqHai(false, bangU.loi);
  // Ô mã (0049) — chỉ phần cắt; đọc TRƯỚC khi ghi gì. Không bỏ qua như các ô riêng khác: món đổi từ
  // phần cắt sang loại khác mà còn ô mã thì báo, không lặng lẽ để ô mã treo trên món không bán ở quầy.
  // Kiểm loại trước khi đọc chữ: ô đang ẩn thì báo cách làm, không báo lỗi định dạng của ô không thấy.
  const chuOMa = form.has('o_ma') ? String(form.get('o_ma') ?? '') : null;
  if (chuOMa?.trim() && loai !== 'phan_cat') {
    return kqHai(false, {
      vi: 'Ô mã chỉ dành cho phần cắt. Muốn đổi loại thì chọn lại Phần cắt, xóa hết ô mã, lưu, rồi mới đổi loại.',
      en: 'Rotating codes are only for cuts. To change the type, choose Cut again, clear the rotating codes, save, then change the type.',
    });
  }
  const oMa = chuOMa !== null ? docChuOMa(chuOMa) : null;
  if (oMa?.loi) return kqHai(false, oMa.loi);

  // Giá trị thu hồi (phụ phẩm) — đọc TRƯỚC khi ghi gì: chữ sai mà đã thêm mặt hàng thì gửi lại form
  // thêm mới sẽ vấp trùng mã.
  const coThuHoi = form.has('gia_tri_thu_hoi_kg') && coO('gia_tri_thu_hoi_kg');
  const thuHoi = coThuHoi ? docTien(form.get('gia_tri_thu_hoi_kg')) : null;
  if (Number.isNaN(thuHoi)) {
    return kqHai(false, { vi: 'Giá trị thu hồi/kg phải là số đồng, ví dụ 30.000.',
                          en: 'The recovery value/kg must be an amount in VND, for example 30,000.' });
  }

  const thuTu = docSoNguyen(form.get('thu_tu'), 0, 99999);
  const dong = {
    ...(form.has('ma_misa') ? { ma_misa: maMisa } : {}),
    ...(theoTang !== undefined ? { theo_tang: theoTang } : {}),
    ma, ten, loai,
    ten_phu: sHoacNull(form, 'ten_phu'),
    nhom: sHoacNull(form, 'nhom'),
    // "Đếm theo" để "Theo loại" (ô trống) và đơn vị trống: theo loại đang chọn — tảng → tảng, phần cắt → gói,
    // phụ phẩm → chỉ kg, khay. Form sửa để "Theo loại" khi món đang đếm đúng mặc định loại của nó, nên đổi
    // loại thì cách đếm đổi theo; món đã chọn cách đếm riêng thì giữ.
    dem_goi: s(form, 'dem_goi') === 'khong' ? false : s(form, 'dem_goi') === 'co' ? true : demMacDinh(loai).dem_goi,
    don_vi_goi: s(form, 'don_vi_goi') || demMacDinh(loai).don_vi_goi,
    han_dung_ngay: han,
    canh_bao_truoc_ngay: canhBao,
    gia_ban_kg: gia,
    xu_ly_mac_dinh: !coO('xu_ly_mac_dinh') ? (oCu(cu?.xu_ly_mac_dinh) ?? 'nhap_kho')
      : ['nhap_kho', 'chuyen_bep', 'bo'].includes(s(form, 'xu_ly_mac_dinh')) ? s(form, 'xu_ly_mac_dinh') : 'nhap_kho',
    ma_can: maCan || null,
    ton_toi_thieu_kg: tonMin,
    // Sau pha để ở: chỉ 'quay' là khác mặc định; còn lại (kể cả chữ lạ) = kho lạnh.
    noi_de_sau_pha: !coO('noi_de_sau_pha') ? oCu(cu?.noi_de_sau_pha)
      : s(form, 'noi_de_sau_pha') === 'quay' ? 'quay' : s(form, 'noi_de_sau_pha') === 'kho' ? 'kho' : null,
    truong_them: giaTri,
    thu_tu: thuTu === null || Number.isNaN(thuTu) ? (cu?.thu_tu ?? 0) : thuTu,
    dang_dung: form.get('dang_dung') !== 'khong',
  };

  let id = cu?.id;
  if (cu) {
    const { data, error } = await client.from('kho_mat_hang').update(dong).eq('id', cu.id).select('id');
    if (error) return { ok: false, cau: cauLoiKho(error) };
    if (!data?.length) {
      return kqHai(false, { vi: 'Không sửa được — tài khoản không có quyền sửa danh mục.', en: 'Not saved — your account cannot edit the catalog.' });
    }
  } else {
    const { data, error } = await client.from('kho_mat_hang').insert(dong).select('id').single();
    if (error) return { ok: false, cau: cauLoiKho(error) };
    id = data.id;
  }

  if (coMucKho && id && ((cu?.kho_toi_thieu_kg ?? null) !== khoMin || (cu?.kho_toi_da_kg ?? null) !== khoMax || !cu)) {
    const { error } = await client.rpc('kho_luu_muc_dat_hang', {
      p_mat_hang_id: id, p_kho_toi_thieu_kg: khoMin, p_kho_toi_da_kg: khoMax,
    });
    if (error) {
      const l = loiHai(error);
      return kqHai(false, { vi: `Đã lưu mặt hàng, nhưng chưa lưu được mức kho lạnh: ${l.vi}`,
                            en: `The item was saved, but the cold store levels were not: ${l.en}` });
    }
  }

  if (oMa && id && (oMa.ma.length || cu)) {
    const kq = await luuOMa(client, id, oMa.ma);
    if (!kq.ok) {
      return kqHai(false, { vi: `Đã lưu mặt hàng, nhưng chưa lưu được ô mã: ${kq.cau}`,
                            en: `The item was saved, but the rotating codes were not: ${kq.cauEn ?? dichCau('en', kq.cau)}` });
    }
  }

  if (bangU && id) {
    const kq = await luuBangU(client, id, bangU.dong);
    if (!kq.ok) {
      return kqHai(false, { vi: `Đã lưu mặt hàng, nhưng chưa lưu được bảng ủ: ${kq.cau}`,
                            en: `The item was saved, but the aging table was not: ${kq.cau}` });
    }
  }

  // Giá trị thu hồi phụ phẩm nằm ở bảng riêng (số liệu giá vốn). Đã đọc và kiểm ở trên.
  if (coThuHoi && id) {
    const { error } = await client.from('kho_mat_hang_gia')
      .upsert({ mat_hang_id: id, gia_tri_thu_hoi_kg: thuHoi }, { onConflict: 'mat_hang_id' });
    if (error) {
      const l = loiHai(error);
      return kqHai(false, { vi: `Đã lưu mặt hàng, nhưng chưa lưu được giá trị thu hồi: ${l.vi}`,
                            en: `The item was saved, but the recovery value was not: ${l.en}` });
    }
  }

  if (!cu) return kqHai(true, { vi: `Đã thêm "${ten}" (mã ${ma}).`, en: `Added "${ten}" (code ${ma}).` });
  if (daBo.length) {
    return kqHai(true, {
      vi: `Đã lưu "${ten}". Đổi loại nên đã bỏ ô của loại cũ: ${daBo.map(x => x.vi).join(', ')}.`,
      en: `Saved "${ten}". The type changed, so the old type's fields were cleared: ${daBo.map(x => x.en).join(', ')}.`,
    });
  }
  return kqHai(true, { vi: `Đã lưu "${ten}".`, en: `Saved "${ten}".` });
}

// -----------------------------------------------------------------------------
// DÁN DANH MỤC TỪ EXCEL — xem trước rồi mới ghi
// -----------------------------------------------------------------------------
// Bản cũ ghi thẳng: ô trống thành null và upsert theo mã ĐÈ MẤT giá bán, hạn
// dùng, mã cân đang có; dán không có cột Mã thì mã tự sinh từ tên không khớp
// mã cũ → thành mặt hàng TRÙNG. Giờ:
//   · ô trống = GIỮ giá trị cũ;
//   · khớp theo Mã (nếu có), không có Mã thì theo Tên (bỏ dấu, không phân biệt
//     hoa thường, gộp khoảng trắng);
//   · có dòng tiêu đề thì cột xếp thứ tự nào cũng được;
//   · mã tự sinh cho hàng mới không bao giờ trùng mã đã có;
//   · xem trước đủ "cũ → mới" rồi mới bấm Xác nhận. Không cần hàm database mới:
//     mỗi dòng gửi đi đã gộp đủ giá trị, một lần upsert theo mã.
// Các hàm dưới (trừ nhapCsvMatHang) là hàm thuần — kiểm thử bằng node, không
// cần database.

/** Các cột dán được. Đây cũng là thứ tự cột khi KHÔNG có dòng tiêu đề. */
export const COT_DAN = ['ten', 'loai', 'nhom', 'han_dung_ngay', 'gia_ban_kg', 'ma_can', 'ma', 'ton_toi_thieu_kg', 'noi_de_sau_pha'] as const;
export type CotDan = typeof COT_DAN[number];

export const TEN_COT_DAN_NB: Record<CotDan, HaiThuTieng> = {
  ten: { vi: 'Tên', en: 'Name' },
  loai: { vi: 'Loại', en: 'Type' },
  nhom: { vi: 'Nhóm', en: 'Category' },
  han_dung_ngay: { vi: 'Hạn dùng', en: 'Use-by days' },
  gia_ban_kg: { vi: 'Giá bán/kg', en: 'Sale price/kg' },
  ma_can: { vi: 'Mã cân', en: 'Scale code' },
  ma: { vi: 'Mã', en: 'Code' },
  ton_toi_thieu_kg: { vi: 'Quầy tối thiểu', en: 'Counter minimum' },
  noi_de_sau_pha: { vi: 'Sau pha để ở', en: 'After butchery goes to' },
};
/** Bản chỉ tiếng Việt (tên cũ, cho code và test cũ). */
export const TEN_COT_DAN: Record<CotDan, string> = Object.fromEntries(
  Object.entries(TEN_COT_DAN_NB).map(([k, v]) => [k, v.vi]),
) as Record<CotDan, string>;

/** Một dòng ghi vào kho_mat_hang. Mọi dòng có ĐÚNG bộ cột này — một lần upsert cho cả danh sách. */
export interface DongGhiMatHang {
  ma: string; ten: string; loai: MatHang['loai']; nhom: string | null;
  han_dung_ngay: number | null; gia_ban_kg: number | null; ma_can: string | null;
  ton_toi_thieu_kg: number | null; dem_goi: boolean; don_vi_goi: string;
  noi_de_sau_pha: 'kho' | 'quay' | null;
}

/** Một dòng đọc được từ ô dán. Ô trống thì KHÔNG có khóa đó — nghĩa là giữ giá trị cũ. */
export interface DongDan {
  /** Số dòng trong ô dán (tính cả dòng tiêu đề), để báo lỗi đúng chỗ. */
  so: number;
  ten?: string; loai?: MatHang['loai']; nhom?: string; han_dung_ngay?: number;
  gia_ban_kg?: number; ma_can?: string; ma?: string; ton_toi_thieu_kg?: number;
  noi_de_sau_pha?: 'kho' | 'quay';
}

export interface SuaDan {
  id: string; ma: string; ten: string; dang_dung: boolean;
  truoc: DongGhiMatHang; sau: DongGhiMatHang;
  /** Cột đổi giá trị — để trang tô "cũ → mới". */
  cot_doi: CotDan[];
}

export interface XemTruocDan {
  them: DongGhiMatHang[];
  sua: SuaDan[];
  /** Số dòng khớp mặt hàng cũ mà không đổi gì. */
  giu: number;
  loi: string[];
  /** loi bằng tiếng Anh, cùng thứ tự. */
  loiEn: string[];
  /** Tiêu đề cột không hiểu — bỏ qua cả cột. */
  boQua: string[];
}

/** Phần của mặt hàng đã có mà việc dán cần biết. */
export type MatHangDaCo = Pick<MatHang,
  'id' | 'ma' | 'ten' | 'loai' | 'nhom' | 'han_dung_ngay' | 'gia_ban_kg' | 'ma_can'
  | 'ton_toi_thieu_kg' | 'dem_goi' | 'don_vi_goi' | 'dang_dung'>
  // Danh mục đọc trước 0033 (hoặc dữ liệu test cũ) không có cột này = kho lạnh.
  & Partial<Pick<MatHang, 'noi_de_sau_pha'>>;

const TOI_DA_DONG_DAN = 500;

/** Tên để so khớp: bỏ dấu, chữ thường, gộp khoảng trắng. "Thăn  NGOẠI" = "than ngoai". */
export function chuanTenMatHang(ten: string): string {
  return boDau(ten).toLowerCase().replace(/\s+/g, ' ').trim();
}

const gonCach = (s: string) => s.replace(/\s+/g, ' ').trim();

// Ô "Sau pha để ở" khi dán: kho lạnh / quầy (bỏ dấu, không phân biệt hoa thường).
// Từ tiếng Việt như cũ, rồi vài từ tiếng Anh cho màn tiếng Anh.
const NOI_DE_DAN: Record<string, 'kho' | 'quay'> = {
  'kho': 'kho', 'kho lanh': 'kho', 'tu lanh': 'kho', 'tu dong': 'kho',
  'quay': 'quay', 'quay ban': 'quay', 'ra quay': 'quay',
  'cold store': 'kho', 'store': 'kho', 'chiller': 'kho', 'counter': 'quay',
};

const LOAI_DAN: Record<string, MatHang['loai']> = {
  'tang': 'tang', 'tang nhap': 'tang',
  'phan cat': 'phan_cat', 'cat': 'phan_cat',
  'phu pham': 'phu_pham',
  'primal': 'tang', 'cut': 'phan_cat', 'by product': 'phu_pham', 'byproduct': 'phu_pham',
};

// Tiêu đề cột → cột. So sau khi bỏ dấu, bỏ ký tự lạ và bỏ đơn vị ở cuối
// ("Giá bán/kg" → "gia ban", "Hạn dùng (ngày)" → "han dung"). Mỗi cột: từ tiếng
// Việt như cũ, rồi vài từ tiếng Anh (màn tiếng Anh ghi tiêu đề tiếng Anh).
const TIEU_DE_DAN: Record<string, CotDan> = Object.fromEntries(([
  ['ten', ['ten', 'ten mat hang', 'ten hang', 'mat hang', 'ten san pham', 'name', 'item', 'item name', 'product']],
  ['loai', ['loai', 'loai hang', 'loai mat hang', 'type', 'item type']],
  ['nhom', ['nhom', 'nhom hang', 'category', 'group']],
  ['han_dung_ngay', ['han dung', 'han su dung', 'hsd', 'han', 'use by', 'use by days', 'shelf life', 'shelf life days']],
  ['gia_ban_kg', ['gia ban', 'gia', 'gia ban quay', 'gia ban o quay', 'don gia', 'price', 'sale price', 'selling price']],
  ['ma_can', ['ma can', 'ma hang tren can', 'ma tren can', 'plu', 'ma plu', 'scale code']],
  ['ma', ['ma', 'ma hang', 'ma mat hang', 'code', 'item code', 'sku']],
  ['ton_toi_thieu_kg', ['quay toi thieu', 'ton toi thieu', 'toi thieu', 'ton quay toi thieu', 'muc toi thieu', 'dinh muc quay',
    'counter minimum', 'counter min']],
  ['noi_de_sau_pha', ['sau pha de o', 'sau pha de', 'noi de sau pha', 'de o', 'noi de', 'after butchery', 'after butchery goes to']],
] as [CotDan, string[]][]).flatMap(([cot, ds]) => ds.map(t => [t, cot])));

function cotCuaTieuDe(o: string): CotDan | undefined {
  const t = boDau(o).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    .replace(/( (kg|ngay|d|dong|vnd|moi))+$/, '');
  return TIEU_DE_DAN[t];
}

/** Bỏ ngoặc kép Excel bọc quanh ô ("Thăn ""A""" → Thăn "A"). */
function boNgoacKep(o: string): string {
  const t = o.trim();
  return t.length >= 2 && t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1).replace(/""/g, '"').trim() : t;
}

/**
 * Đọc ô dán. Cột cách nhau bằng Tab (dán từ Excel), hoặc dấu ; hoặc dấu phẩy —
 * chọn MỘT kiểu cho cả bảng. Dòng đầu là tiêu đề nếu có cột Tên / Mã (hoặc từ
 * hai tiêu đề hiểu được trở lên); không có tiêu đề thì theo thứ tự COT_DAN.
 * Ô trống → không đặt khóa (giữ giá trị cũ). Chưa so với danh mục ở bước này.
 * loi (tiếng Việt) và loiEn (tiếng Anh) song song, cùng thứ tự.
 */
export function docCsvMatHang(noiDung: string): { dong: DongDan[]; loi: string[]; loiEn: string[]; boQua: string[] } {
  const dong: DongDan[] = [];
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (x: HaiThuTieng) => { loi.push(x.vi); loiEn.push(x.en); };
  const boQua: string[] = [];
  const ngan = noiDung.includes('\t') ? '\t' : noiDung.includes(';') ? ';' : ',';
  const hang = noiDung.split(/\r?\n/)
    .map((raw, i) => ({ so: i + 1, o: raw.split(ngan).map(boNgoacKep) }))
    .filter(h => h.o.some(x => x !== ''));
  if (hang.length === 0) return { dong, loi, loiEn, boQua };

  // Dòng tiêu đề?
  let cot: (CotDan | undefined)[] = [...COT_DAN];
  const dau = hang[0].o.map(cotCuaTieuDe);
  const hieu = dau.filter((c): c is CotDan => !!c);
  if (hieu.includes('ten') || hieu.includes('ma') || hieu.length >= 2) {
    hang[0].o.forEach((o, i) => { if (o && !dau[i]) boQua.push(o); });
    for (const c of COT_DAN) {
      if (dau.filter(x => x === c).length > 1) {
        bao({ vi: `Dòng tiêu đề: cột "${TEN_COT_DAN_NB[c].vi}" có hai lần — xóa bớt một cột`,
              en: `Header row: the "${TEN_COT_DAN_NB[c].en}" column appears twice — delete one of them` });
      }
    }
    if (!hieu.includes('ten') && !hieu.includes('ma')) {
      bao({ vi: 'Dòng tiêu đề cần có cột Tên hoặc cột Mã để biết là mặt hàng nào',
            en: 'The header row needs a Name or Code column to know which item each row is' });
    }
    if (loi.length) return { dong, loi, loiEn, boQua };
    cot = dau;
    hang.shift();
  }

  for (const h of hang) {
    const d: DongDan = { so: h.so };
    const loiDong: string[] = [];
    const loiDongEn: string[] = [];
    const baoDong = (x: HaiThuTieng) => { loiDong.push(x.vi); loiDongEn.push(x.en); };
    cot.forEach((c, i) => {
      const o = h.o[i] ?? '';
      if (!c || o === '') return;
      switch (c) {
        case 'ten': {
          const ten = gonCach(o);
          if (ten.length > 120) baoDong({ vi: 'tên dài quá 120 chữ', en: 'name longer than 120 characters' });
          else d.ten = ten;
          break;
        }
        case 'loai': {
          const loai = LOAI_DAN[boDau(o).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()];
          if (!loai) {
            baoDong({ vi: `loại "${o}" không hiểu (ghi tảng, phần cắt hoặc phụ phẩm)`,
                      en: `type "${o}" not understood (write primal, cut or by-product)` });
          } else d.loai = loai;
          break;
        }
        case 'nhom': d.nhom = gonCach(o); break;
        case 'han_dung_ngay': {
          const n = docSoNguyen(o, 1, 3650);
          if (n === null || Number.isNaN(n)) {
            baoDong({ vi: `hạn dùng "${o}" phải là số ngày, từ 1 đến 3650`, en: `use-by "${o}" must be a number of days, from 1 to 3650` });
          } else d.han_dung_ngay = n;
          break;
        }
        case 'gia_ban_kg': {
          const n = docTien(o);
          if (n === null || Number.isNaN(n)) {
            baoDong({ vi: `giá "${o}" phải là số đồng, ví dụ 650000`, en: `price "${o}" must be an amount in VND, for example 650000` });
          } else d.gia_ban_kg = n;
          break;
        }
        case 'ma_can': {
          const m = o.replace(/\s/g, '').replace(/^0+/, '');
          if (!/^[1-9]\d{0,5}$/.test(m)) {
            baoDong({ vi: `mã cân "${o}" phải là dãy số (tối đa 6 số)`, en: `scale code "${o}" must be a number (up to 6 digits)` });
          } else d.ma_can = m;
          break;
        }
        case 'ma': {
          const m = o.toUpperCase();
          if (!/^[A-Z0-9][A-Z0-9_.-]{0,29}$/.test(m)) {
            baoDong({ vi: `mã "${o}" chỉ gồm chữ không dấu, số và dấu gạch (tối đa 30 ký tự)`,
                      en: `code "${o}" can only contain unaccented letters, digits and dashes (up to 30 characters)` });
          } else d.ma = m;
          break;
        }
        case 'noi_de_sau_pha': {
          const noi = NOI_DE_DAN[boDau(o).toLowerCase().replace(/\s+/g, ' ').trim()];
          if (!noi) {
            baoDong({ vi: `sau pha để ở "${o}" không hiểu (ghi kho lạnh hoặc quầy)`,
                      en: `after butchery "${o}" not understood (write cold store or counter)` });
          } else d.noi_de_sau_pha = noi;
          break;
        }
        case 'ton_toi_thieu_kg': {
          const n = docKg(o);
          if (n === null || Number.isNaN(n)) {
            baoDong({ vi: `quầy tối thiểu "${o}" phải là số kg, ví dụ 2,5`, en: `counter minimum "${o}" must be a number of kg, for example 2.5` });
          } else d.ton_toi_thieu_kg = n;
          break;
        }
      }
    });
    if (loiDong.length) {
      bao({ vi: `Dòng ${h.so}: ${loiDong.join('; ')}`, en: `Row ${h.so}: ${loiDongEn.join('; ')}` });
      continue;
    }
    if (d.ten === undefined && d.ma === undefined) { bao({ vi: `Dòng ${h.so}: thiếu tên mặt hàng`, en: `Row ${h.so}: item name missing` }); continue; }
    dong.push(d);
  }
  return { dong, loi, loiEn, boQua };
}

const dongCu = (m: MatHangDaCo): DongGhiMatHang => ({
  ma: m.ma, ten: m.ten, loai: m.loai, nhom: m.nhom,
  han_dung_ngay: m.han_dung_ngay, gia_ban_kg: m.gia_ban_kg, ma_can: m.ma_can,
  ton_toi_thieu_kg: m.ton_toi_thieu_kg, dem_goi: m.dem_goi, don_vi_goi: m.don_vi_goi,
  noi_de_sau_pha: m.noi_de_sau_pha ?? null,
});

/** "THAN" đã có → "THAN-2", "THAN-3"… (vẫn trong 30 ký tự). */
function maKhongTrung(goc: string, daDung: Set<string>): string {
  if (!daDung.has(goc)) return goc;
  for (let i = 2; ; i++) {
    const duoi = `-${i}`;
    const ma = goc.slice(0, 30 - duoi.length).replace(/-+$/, '') + duoi;
    if (!daDung.has(ma)) return ma;
  }
}

/**
 * So ô dán với danh mục đang có: dòng nào thêm mới, dòng nào sửa (cũ → mới),
 * dòng nào giữ nguyên, dòng nào lỗi. Hàm thuần — trang gọi để xem trước, và
 * nhapCsvMatHang gọi lại đúng hàm này lúc xác nhận.
 */
export function xemTruocDanMatHang(daCo: MatHangDaCo[], noiDung: string): XemTruocDan {
  const doc = docCsvMatHang(noiDung);
  const kq: XemTruocDan = { them: [], sua: [], giu: 0, loi: [...doc.loi], loiEn: [...doc.loiEn], boQua: doc.boQua };
  const bao = (x: HaiThuTieng) => { kq.loi.push(x.vi); kq.loiEn.push(x.en); };
  if (doc.dong.length > TOI_DA_DONG_DAN) {
    bao({ vi: `Mỗi lần dán tối đa ${TOI_DA_DONG_DAN} dòng — chia làm nhiều lần.`,
          en: `Paste at most ${TOI_DA_DONG_DAN} rows at a time — split it into several pastes.` });
    return kq;
  }

  const theoMa = new Map(daCo.map(m => [m.ma, m]));
  const theoTen = new Map<string, MatHangDaCo[]>();
  for (const m of daCo) {
    const k = chuanTenMatHang(m.ten);
    theoTen.set(k, [...(theoTen.get(k) ?? []), m]);
  }
  const hangCuDaDan = new Map<string, number>();   // id mặt hàng cũ → dòng dán
  const tenMoi = new Map<string, number>();        // tên (đã chuẩn) của hàng mới → dòng
  const maMoi = new Map<string, number>();         // mã ghi sẵn của hàng mới → dòng
  const moi: DongDan[] = [];

  for (const d of doc.dong) {
    let cu: MatHangDaCo | undefined;
    if (d.ma !== undefined) {
      cu = theoMa.get(d.ma);
      const cungTen = !cu && d.ten !== undefined ? theoTen.get(chuanTenMatHang(d.ten)) ?? [] : [];
      if (cungTen.length) {
        const dsMa = cungTen.map(m => m.ma).join(', ');
        bao({ vi: `Dòng ${d.so}: "${d.ten}" đã có với mã ${dsMa}, khác mã ${d.ma} đang ghi — sửa ô Mã cho đúng, hoặc để trống ô Mã`,
              en: `Row ${d.so}: "${d.ten}" already exists with code ${dsMa}, not the code ${d.ma} written here — fix the Code cell, or leave it empty` });
        continue;
      }
    } else if (d.ten !== undefined) {
      const cungTen = theoTen.get(chuanTenMatHang(d.ten)) ?? [];
      const dangDung = cungTen.filter(m => m.dang_dung);
      if (cungTen.length === 1) cu = cungTen[0];
      else if (dangDung.length === 1) cu = dangDung[0];
      else if (cungTen.length > 1) {
        const dsMa = cungTen.map(m => m.ma).join(', ');
        bao({ vi: `Dòng ${d.so}: có ${cungTen.length} mặt hàng cùng tên "${d.ten}" (mã ${dsMa}) — thêm cột Mã để biết sửa mặt hàng nào`,
              en: `Row ${d.so}: ${cungTen.length} items share the name "${d.ten}" (codes ${dsMa}) — add a Code column to say which one to update` });
        continue;
      }
    }

    if (cu) {
      const dongTruoc = hangCuDaDan.get(cu.id);
      if (dongTruoc !== undefined) {
        bao({ vi: `Dòng ${d.so}: "${cu.ten}" đã có ở dòng ${dongTruoc} — mỗi mặt hàng chỉ ghi một dòng`,
              en: `Row ${d.so}: "${cu.ten}" is already on row ${dongTruoc} — one row per item` });
        continue;
      }
      hangCuDaDan.set(cu.id, d.so);
      const truoc = dongCu(cu);
      // Ô trống giữ nguyên. Tên chỉ đổi khi khớp theo MÃ — khớp theo tên thì
      // tên dán (có thể không dấu) không được đè tên đang có.
      const sau: DongGhiMatHang = { ...truoc };
      if (d.ma !== undefined && d.ten !== undefined) sau.ten = d.ten;
      if (d.loai !== undefined) sau.loai = d.loai;
      if (d.nhom !== undefined) sau.nhom = d.nhom;
      if (d.han_dung_ngay !== undefined) sau.han_dung_ngay = d.han_dung_ngay;
      if (d.gia_ban_kg !== undefined) sau.gia_ban_kg = d.gia_ban_kg;
      if (d.ma_can !== undefined) sau.ma_can = d.ma_can;
      if (d.ton_toi_thieu_kg !== undefined) sau.ton_toi_thieu_kg = d.ton_toi_thieu_kg;
      // Ghi "kho lạnh" cho món đang để trống (= kho lạnh) thì không tính là đổi.
      if (d.noi_de_sau_pha !== undefined && d.noi_de_sau_pha !== (truoc.noi_de_sau_pha ?? 'kho')) sau.noi_de_sau_pha = d.noi_de_sau_pha;
      const cotDoi = COT_DAN.filter(c => c !== 'ma' && sau[c] !== truoc[c]);
      if (cotDoi.length) {
        kq.sua.push({ id: cu.id, ma: cu.ma, ten: cu.ten, dang_dung: cu.dang_dung, truoc, sau, cot_doi: cotDoi });
      } else kq.giu++;
      continue;
    }

    // Mặt hàng mới.
    if (d.ten === undefined) {
      bao({ vi: `Dòng ${d.so}: mã ${d.ma} chưa có trong danh mục — mặt hàng mới cần có Tên`,
            en: `Row ${d.so}: code ${d.ma} is not in the catalog — a new item needs a Name` });
      continue;
    }
    const k = chuanTenMatHang(d.ten);
    if (tenMoi.has(k)) {
      bao({ vi: `Dòng ${d.so}: "${d.ten}" bị lặp với dòng ${tenMoi.get(k)}`, en: `Row ${d.so}: "${d.ten}" repeats row ${tenMoi.get(k)}` });
      continue;
    }
    if (d.ma !== undefined && maMoi.has(d.ma)) {
      bao({ vi: `Dòng ${d.so}: mã ${d.ma} bị lặp với dòng ${maMoi.get(d.ma)}`, en: `Row ${d.so}: code ${d.ma} repeats row ${maMoi.get(d.ma)}` });
      continue;
    }
    tenMoi.set(k, d.so);
    if (d.ma !== undefined) maMoi.set(d.ma, d.so);
    moi.push(d);
  }

  // Mã cho hàng mới chưa ghi mã: gợi ý từ tên, KHÔNG trùng mã nào đang có hay
  // vừa ghi trong bảng — trùng thì upsert theo mã sẽ đè lên mặt hàng khác.
  const maDaDung = new Set([...theoMa.keys(), ...maMoi.keys()]);
  for (const d of moi) {
    const ma = d.ma ?? maKhongTrung(goiYMa(d.ten!), maDaDung);
    maDaDung.add(ma);
    const loai = d.loai ?? 'phan_cat';
    kq.them.push({
      ma, ten: d.ten!, loai,
      nhom: d.nhom ?? null,
      han_dung_ngay: d.han_dung_ngay ?? null,
      gia_ban_kg: d.gia_ban_kg ?? null,
      ma_can: d.ma_can ?? null,
      ton_toi_thieu_kg: d.ton_toi_thieu_kg ?? null,
      ...demMacDinh(loai),
      noi_de_sau_pha: d.noi_de_sau_pha ?? null,
    });
  }

  // Mã cân: mỗi mã chỉ một mặt hàng ĐANG DÙNG (unique index của 0019). Báo
  // trước ở đây thay vì để database từ chối cả lần nhập bằng một câu khó hiểu.
  const suaTheoId = new Map(kq.sua.map(x => [x.id, x]));
  const theoMaCan = new Map<string, { ten: string; dan: boolean }[]>();
  const ghiMaCan = (maCan: string | null, ten: string, dan: boolean) => {
    if (maCan) theoMaCan.set(maCan, [...(theoMaCan.get(maCan) ?? []), { ten, dan }]);
  };
  for (const m of daCo) {
    if (!m.dang_dung) continue;
    const x = suaTheoId.get(m.id);
    ghiMaCan(x ? x.sau.ma_can : m.ma_can, x ? x.sau.ten : m.ten, !!x?.cot_doi.includes('ma_can'));
  }
  for (const t of kq.them) ghiMaCan(t.ma_can, t.ten, true);
  for (const [maCan, ds] of theoMaCan) {
    if (ds.length > 1 && ds.some(x => x.dan)) {
      const ten = ds.map(x => `"${x.ten}"`);
      bao({ vi: `Mã cân ${maCan} bị trùng: ${ten.join(' và ')} — mỗi mã cân chỉ cho một mặt hàng`,
            en: `Scale code ${maCan} is used more than once: ${ten.join(' and ')} — each scale code is for one item only` });
    }
  }
  return kq;
}

/**
 * Dấu vân tay của bản xem trước. Trang gửi kèm khi bấm Xác nhận; lúc ghi tính
 * lại từ danh mục mới nhất — khác nhau nghĩa là có người vừa sửa danh mục, phải
 * xem lại chứ không ghi mù.
 */
export function chuKyDan(xt: XemTruocDan): string {
  const s = JSON.stringify([xt.them, xt.sua.map(x => [x.id, x.truoc, x.sau])]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return `${s.length.toString(36)}-${h.toString(36)}`;
}

/** Các dòng gửi database: hàng mới + hàng sửa đã gộp đủ. Cùng một bộ cột, không có id. */
export function dongGhiDan(xt: XemTruocDan): DongGhiMatHang[] {
  return [...xt.them, ...xt.sua.map(x => x.sau)];
}

/**
 * Bấm "Xác nhận nhập": đọc lại danh mục MỚI NHẤT, so lại đúng như lúc xem
 * trước, rồi ghi MỘT lần upsert theo mã. Danh mục vừa đổi (chữ ký khác) thì
 * không ghi — trả bản xem trước mới để người dùng xem lại.
 */
export async function nhapCsvMatHang(
  client: SupabaseClient, noiDung: string, chuKy: string,
): Promise<KetQua & { xemTruoc?: XemTruocDan }> {
  let daCo: MatHang[];
  try { daCo = await docMatHang(client); }
  catch (e) {
    return kqLoi(e, { vi: 'Không đọc được danh mục hiện tại — chưa nhập gì, thử lại.',
                      en: 'Could not read the current catalog — nothing was imported, try again.' });
  }

  const xt = xemTruocDanMatHang(daCo, noiDung);
  if (xt.loi.length) {
    const n = xt.loi.length;
    return { xemTruoc: xt, ...kqHai(false, { vi: `Chưa nhập gì cả — còn ${n} lỗi, xem bên dưới.`,
                                             en: `Nothing imported yet — ${n} ${soIt(n, 'error', 'errors')} to fix, see below.` }) };
  }
  const ghi = dongGhiDan(xt);
  if (ghi.length === 0) {
    return xt.giu > 0
      ? kqHai(true, { vi: 'Danh mục đã đúng như bảng dán — không có gì phải đổi.', en: 'The catalog already matches the pasted table — nothing to change.' })
      : kqHai(false, { vi: 'Không có dòng nào để nhập.', en: 'There are no rows to import.' });
  }
  if (chuKy !== chuKyDan(xt)) {
    return { xemTruoc: xt, ...kqHai(false, {
      vi: 'Danh mục vừa có người sửa, nên thay đổi đã khác lúc xem trước. Xem lại bảng bên dưới rồi bấm "Xác nhận nhập" lần nữa.',
      en: 'Someone just edited the catalog, so the changes differ from the preview. Check the table below, then press "Confirm import" again.',
    }) };
  }

  const { error } = await client.from('kho_mat_hang').upsert(ghi, { onConflict: 'ma' });
  if (error) return { ok: false, cau: cauLoiKho(error), xemTruoc: xt };
  const phan: HaiThuTieng[] = [];
  const mon = (n: number) => soIt(n, 'item', 'items');
  if (xt.them.length) phan.push({ vi: `thêm ${xt.them.length} mặt hàng mới`, en: `added ${xt.them.length} new ${mon(xt.them.length)}` });
  if (xt.sua.length) phan.push({ vi: `cập nhật ${xt.sua.length} mặt hàng`, en: `updated ${xt.sua.length} ${mon(xt.sua.length)}` });
  if (xt.giu) phan.push({ vi: `${xt.giu} mặt hàng giữ nguyên`, en: `${xt.giu} ${mon(xt.giu)} unchanged` });
  const en = phan.map(p => p.en).join(', ');
  return kqHai(true, { vi: `Đã ${phan.map(p => p.vi).join(', ')}.`, en: `${en.charAt(0).toUpperCase()}${en.slice(1)}.` });
}

export async function taoDanhMucMau(client: SupabaseClient): Promise<KetQua> {
  const { data, error } = await client.rpc('kho_tao_danh_muc_mau', {});
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, { vi: `Đã tạo ${data} mặt hàng mẫu. Sửa tên, hạn dùng, và NHẬP GIÁ BÁN cho từng phần cắt.`,
                       en: `Created ${data} sample ${soIt(Number(data), 'item', 'items')}. Edit the names and use-by days, and ENTER A SALE PRICE for each cut.` });
}

// -----------------------------------------------------------------------------
// NHÀ CUNG CẤP
// -----------------------------------------------------------------------------
export async function docNhaCungCap(client: SupabaseClient): Promise<NhaCungCap[]> {
  const { data, error } = await client
    .from('kho_nha_cung_cap')
    .select('id, ten, ma_so_thue, dien_thoai, email, dia_chi, nguoi_lien_he, so_ngay_no, so_ngay_giao, ngay_giao_trong_tuan, ngan_hang, so_tai_khoan, ghi_chu, truong_them, dang_dung, kieu_hoa_don, ma_misa')
    .order('dang_dung', { ascending: false }).order('ten');
  if (error) throw error;
  return (data ?? []) as NhaCungCap[];
}

export async function luuNhaCungCap(
  client: SupabaseClient, form: FormData, dinhNghia: DinhNghiaTruong[], cu?: NhaCungCap,
): Promise<KetQua> {
  const ten = s(form, 'ten');
  if (!ten) return kqHai(false, { vi: 'Chưa nhập tên nhà cung cấp.', en: 'Enter the supplier name.' });
  const mst = s(form, 'ma_so_thue').replace(/\s/g, '');
  if (mst && !/^\d{10}(-\d{3})?$/.test(mst)) {
    return kqHai(false, { vi: 'Mã số thuế là 10 số (hoặc 10 số-3 số).', en: 'The tax code is 10 digits (or 10 digits-3 digits).' });
  }
  const soNgayNo = docSoNguyen(form.get('so_ngay_no'), 0, 365);
  if (Number.isNaN(soNgayNo)) return kqHai(false, { vi: 'Số ngày nợ từ 0 đến 365.', en: 'Credit days must be from 0 to 365.' });
  // Đặt hàng (0039): số ngày giao 0–60 (trống = 1), thứ giao là các ô tích `thu_giao`.
  const soNgayGiao = docSoNguyen(form.get('so_ngay_giao'), 0, 60);
  if (Number.isNaN(soNgayGiao)) return kqHai(false, { vi: 'Số ngày giao hàng từ 0 đến 60.', en: 'Delivery days must be from 0 to 60.' });
  const thuGiao = [...new Set(form.getAll('thu_giao').map(v => Number(v)))]
    .filter(n => Number.isInteger(n) && n >= 1 && n <= 7).sort((a, b) => a - b);

  // Hóa đơn và MISA (0040) — chỉ khi form có ô đó.
  const maMisa = form.has('ma_misa') ? docMaMisa(form.get('ma_misa')) : null;
  if (maMisa === undefined) return kqHai(false, CAU.maMisa);

  const { giaTri, loi, loiEn } = docTruongThem(form, dinhNghia, undefined, cu?.truong_them ?? {});
  if (loi.length) return kqLoiTruong(loi, loiEn);

  const dong = {
    ...(form.has('kieu_hoa_don') ? { kieu_hoa_don: s(form, 'kieu_hoa_don') === 'gop' ? 'gop' : 'tung_lan' } : {}),
    ...(form.has('ma_misa') ? { ma_misa: maMisa } : {}),
    ten,
    ma_so_thue: mst || null,
    dien_thoai: sHoacNull(form, 'dien_thoai'),
    email: sHoacNull(form, 'email'),
    dia_chi: sHoacNull(form, 'dia_chi'),
    nguoi_lien_he: sHoacNull(form, 'nguoi_lien_he'),
    so_ngay_no: soNgayNo ?? 0,
    so_ngay_giao: soNgayGiao ?? 1,
    // Tích đủ 7 ngày hoặc không tích ngày nào = ngày nào cũng giao.
    ngay_giao_trong_tuan: thuGiao.length === 0 || thuGiao.length === 7 ? null : thuGiao,
    ngan_hang: sHoacNull(form, 'ngan_hang'),
    so_tai_khoan: sHoacNull(form, 'so_tai_khoan'),
    ghi_chu: sHoacNull(form, 'ghi_chu'),
    truong_them: giaTri,
    dang_dung: form.get('dang_dung') !== 'khong',
  };

  if (cu) {
    const { data, error } = await client.from('kho_nha_cung_cap').update(dong).eq('id', cu.id).select('id');
    if (error) return { ok: false, cau: cauLoiKho(error) };
    if (!data?.length) {
      return kqHai(false, { vi: 'Không sửa được — tài khoản không có quyền sửa nhà cung cấp.', en: 'Not saved — your account cannot edit suppliers.' });
    }
    // 0040: đổi số tài khoản đã có → database ghi nhật ký và báo chủ quán.
    if (canhBaoDoiTaiKhoan(cu, dong)) {
      const truoc = `${cu.so_tai_khoan}${cu.ngan_hang ? ` (${cu.ngan_hang})` : ''}`;
      const nh = dong.ngan_hang ? ` (${dong.ngan_hang})` : '';
      const sau: HaiThuTieng = { vi: `${dong.so_tai_khoan ?? '(trống)'}${nh}`, en: `${dong.so_tai_khoan ?? '(empty)'}${nh}` };
      return kqHai(true, {
        vi: `Đã lưu "${ten}". Tài khoản ngân hàng vừa đổi từ ${truoc} sang ${sau.vi} — đã ghi lại và báo chủ quán. Gọi điện hỏi lại nhà cung cấp trước khi chuyển tiền.`,
        en: `Saved "${ten}". The bank account just changed from ${truoc} to ${sau.en} — this was recorded and the owner was notified. Call the supplier to double-check before sending money.`,
      });
    }
    return kqHai(true, { vi: `Đã lưu "${ten}".`, en: `Saved "${ten}".` });
  }
  const { error } = await client.from('kho_nha_cung_cap').insert(dong);
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, { vi: `Đã thêm nhà cung cấp "${ten}".`, en: `Added the supplier "${ten}".` });
}

/**
 * Có phải đổi tài khoản THẬT không (đã có số cũ; số mới khác, bỏ dấu cách,
 * hoặc ngân hàng khác) — khớp sự kiện ncc_doi_tai_khoan của database: điền lần
 * đầu thì không cảnh báo.
 */
export function canhBaoDoiTaiKhoan(
  cu: (Pick<NhaCungCap, 'so_tai_khoan'> & { ngan_hang?: string | null }) | undefined,
  moi: { so_tai_khoan: string | null; ngan_hang?: string | null },
): boolean {
  const truoc = (cu?.so_tai_khoan ?? '').replace(/\s/g, '');
  const nh = (v: string | null | undefined) => (v ?? '').trim().toLowerCase();
  return !!truoc && (truoc !== (moi.so_tai_khoan ?? '').replace(/\s/g, '')
    || ('ngan_hang' in moi && nh(cu?.ngan_hang) !== nh(moi.ngan_hang)));
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
  if (!ten) return kqHai(false, { vi: 'Chưa nhập tên vị trí.', en: 'Enter the location name.' });
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
    if (!data?.length) return kqHai(false, { vi: 'Không sửa được vị trí này.', en: 'Could not update this location.' });
    return kqHai(true, { vi: `Đã lưu vị trí "${ten}".`, en: `Saved the location "${ten}".` });
  }
  if (!dong.loai) return kqHai(false, { vi: 'Chọn loại vị trí: kho hoặc quầy.', en: 'Choose the location type: store or counter.' });
  const { error } = await client.from('kho_vi_tri').insert({ ...dong, chi_nhanh_id: chiNhanhId });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, { vi: `Đã thêm vị trí "${ten}".`, en: `Added the location "${ten}".` });
}

export async function docLyDo(client: SupabaseClient): Promise<LyDo[]> {
  const { data, error } = await client
    .from('kho_ly_do').select('id, loai, ten, can_anh, dang_dung, thu_tu, tinh_dinh_muc')
    .order('loai').order('thu_tu').order('ten');
  if (error) throw error;
  return (data ?? []) as LyDo[];
}

export async function luuLyDo(client: SupabaseClient, form: FormData): Promise<KetQua> {
  const id = s(form, 'id');
  const ten = s(form, 'ten');
  if (!ten) return kqHai(false, { vi: 'Chưa nhập lý do.', en: 'Enter the reason.' });
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
    if (!data?.length) return kqHai(false, { vi: 'Không sửa được lý do này.', en: 'Could not update this reason.' });
    return kqHai(true, { vi: `Đã lưu lý do "${ten}".`, en: `Saved the reason "${ten}".` });
  }
  const loai = s(form, 'loai');
  if (!['huy', 'xuat_bep', 'dieu_chinh', 'xuat_khac'].includes(loai)) {
    return kqHai(false, { vi: 'Chọn lý do này dùng cho việc gì.', en: 'Choose what this reason is used for.' });
  }
  const { error } = await client.from('kho_ly_do').insert({ ...dong, loai });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, { vi: `Đã thêm lý do "${ten}".`, en: `Added the reason "${ten}".` });
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
  if (!ten) return kqHai(false, { vi: 'Chưa đặt tên công thức.', en: 'Enter a recipe name.' });
  if (laUuid(id)) {
    const { data, error } = await client.from('kho_cong_thuc_pha')
      .update({ ten, ghi_chu: sHoacNull(form, 'ghi_chu'), dang_dung: form.get('dang_dung') !== 'khong' })
      .eq('id', id).select('id');
    if (error) return { ok: false, cau: cauLoiKho(error) };
    if (!data?.length) return kqHai(false, { vi: 'Không sửa được công thức này.', en: 'Could not update this recipe.' });
    return kqHai(true, { vi: `Đã lưu công thức "${ten}".`, en: `Saved the recipe "${ten}".` });
  }
  const vao = s(form, 'mat_hang_vao_id');
  if (!laUuid(vao)) return kqHai(false, { vi: 'Chọn tảng / phần cắt đầu vào.', en: 'Choose the input primal / cut.' });
  const { error } = await client.from('kho_cong_thuc_pha')
    .insert({ ten, mat_hang_vao_id: vao, ghi_chu: sHoacNull(form, 'ghi_chu') });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, { vi: `Đã tạo công thức "${ten}". Thêm các phần ra ở bên dưới.`,
                       en: `Created the recipe "${ten}". Add the output cuts below.` });
}

export async function themDongCongThuc(client: SupabaseClient, form: FormData): Promise<KetQua> {
  const congThuc = s(form, 'cong_thuc_id');
  const ra = s(form, 'mat_hang_ra_id');
  if (!laUuid(congThuc) || !laUuid(ra)) return kqHai(false, { vi: 'Chọn mặt hàng ra.', en: 'Choose the output item.' });
  const tyLe = docKg(form.get('ty_le_du_kien'));
  if (Number.isNaN(tyLe) || (tyLe !== null && tyLe > 100)) {
    return kqHai(false, { vi: 'Tỉ lệ dự kiến là % từ 0 đến 100, ví dụ 72,5.', en: 'The expected yield is a % from 0 to 100, for example 72.5.' });
  }
  const xuLy = s(form, 'xu_ly');
  const thuTu = docSoNguyen(form.get('thu_tu'), 0, 999);
  const { error } = await client.from('kho_cong_thuc_pha_dong').upsert({
    cong_thuc_id: congThuc, mat_hang_ra_id: ra, ty_le_du_kien: tyLe,
    xu_ly: ['nhap_kho', 'chuyen_bep', 'bo'].includes(xuLy) ? xuLy : null,
    thu_tu: thuTu === null || Number.isNaN(thuTu) ? 0 : thuTu,
  }, { onConflict: 'cong_thuc_id,mat_hang_ra_id' });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, { vi: 'Đã lưu dòng công thức.', en: 'Recipe line saved.' });
}

export async function xoaDongCongThuc(client: SupabaseClient, form: FormData): Promise<KetQua> {
  const id = s(form, 'id');
  if (!laUuid(id)) return kqHai(false, { vi: 'Dòng không hợp lệ.', en: 'Invalid line.' });
  const { data, error } = await client.from('kho_cong_thuc_pha_dong').delete().eq('id', id).select('id');
  if (error) return { ok: false, cau: cauLoiKho(error) };
  if (!data?.length) return kqHai(false, { vi: 'Không xóa được dòng này.', en: 'Could not delete this line.' });
  return kqHai(true, { vi: 'Đã bỏ dòng khỏi công thức.', en: 'Line removed from the recipe.' });
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
  if (soLe === null || Number.isNaN(soLe)) return kqHai(false, { vi: 'Số lẻ của trọng lượng từ 0 đến 3.', en: 'Weight decimals must be from 0 to 3.' });
  if (canhBao === null || Number.isNaN(canhBao)) return kqHai(false, { vi: 'Số ngày cảnh báo từ 0 đến 60.', en: 'Warning days must be from 0 to 60.' });
  if (mau && !(mau.length === 13 && /^[0-9X]*C{1,6}[0-9X]*(W{3,6}|P{3,7})[0-9X]*K$/.test(mau))) {
    return kqHai(false, { vi: 'Mẫu mã vạch phải đủ 13 ký tự, gồm C (mã hàng), W hoặc P (trọng lượng hoặc tiền) và kết thúc bằng K.',
                          en: 'The barcode pattern must be exactly 13 characters: C (item code), W or P (weight or price), ending with K.' });
  }
  const { error } = await client.rpc('kho_luu_cai_dat', {
    p_chi_nhanh_id: chiNhanhId,
    p_vi_tri_nhan_hang_id: laUuid(viTri) ? viTri : null,
    p_mau_ma_vach: mau || null,
    p_so_le_kg: soLe,
    p_canh_bao_truoc_ngay: canhBao,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, { vi: 'Đã lưu cài đặt kho.', en: 'Inventory settings saved.' });
}

export async function luuCaiDatGoc(client: SupabaseClient, form: FormData, chiNhanhId: string): Promise<KetQua> {
  const phuongPhap = s(form, 'phuong_phap_gia_von');
  const nguon = s(form, 'nguon_so_ban');
  if (!['gia_tri', 'khoi_luong'].includes(phuongPhap)) {
    return kqHai(false, { vi: 'Chọn cách chia giá vốn khi pha lóc.', en: 'Choose how cost is split in butchery.' });
  }
  if (!['kiem_ke', 'ipos'].includes(nguon)) return kqHai(false, { vi: 'Chọn nguồn số bán.', en: 'Choose the source of sales figures.' });
  const { error } = await client.rpc('kho_luu_cai_dat_goc', {
    p_chi_nhanh_id: chiNhanhId,
    p_phuong_phap_gia_von: phuongPhap,
    p_chi_phi_vao_gia_von: co(form, 'chi_phi_vao_gia_von'),
    p_vat_vao_gia_von: co(form, 'vat_vao_gia_von'),
    p_nguon_so_ban: nguon,
    p_cho_tu_duyet: co(form, 'cho_tu_duyet'),
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, { vi: 'Đã lưu cách tính giá vốn và nguồn số bán.', en: 'Costing method and sales source saved.' });
}

/** Danh sách mặt hàng gom theo loại, để dựng ô chọn có nhóm. nn: ngôn ngữ của tên loại. */
export function nhomTheoLoai(ds: MatHang[], nn: NgonNguNB = 'vi'): { loai: string; ten: string; hang: MatHang[] }[] {
  return LOAI_MAT_HANG
    .map(loai => ({ loai, ten: TEN_LOAI_MAT_HANG_NB[loai][nn], hang: ds.filter(m => m.loai === loai) }))
    .filter(n => n.hang.length > 0);
}
