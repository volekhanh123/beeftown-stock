/**
 * KHO — NHẬN HÀNG 3 BƯỚC (thủ kho, GĐ5a)
 *
 * Thủ kho KHÔNG thấy tiền (migration 0031): chỉ chụp hóa đơn, cân, đếm. Kế
 * toán / quản lý đọc giá trên ảnh hóa đơn rồi điền khi duyệt (/noi-bo/kho/nhap).
 * File này chỉ gọi các hàm "_kg" của 0031 — không đọc bảng kho_phieu_nhap hay
 * kho_phieu_nhap_dong (có cột tiền, thủ kho đọc được 0 dòng).
 *
 *   Bước 1  /nhan-hang/moi        chụp ảnh hóa đơn TRƯỚC, chọn nhà cung cấp,
 *                                  nơi nhận, ngày → tạo phiếu nháp 0 dòng
 *   Bước 2  /nhan-hang/<id>       thêm từng dòng: món, kg, số tảng — mỗi lần
 *                                  "Thêm dòng" là lưu cả phiếu
 *   Bước 3  /nhan-hang/<id>?buoc=gui   xem lại gọn, 1 nút gửi → màn "Xong"
 *
 * LƯU CẢ PHIẾU MỖI LẦN: kho_luu_phieu_nhap_kg thay toàn bộ dòng, nên mỗi lệnh
 * (thêm / sửa / bỏ dòng, thêm ảnh, sửa đầu phiếu) gửi lại MỌI dòng đang có,
 * lấy từ kho_doc_phieu_nhap_kg, kèm phien_ban chống hai máy đè nhau. Đầu phiếu
 * (số hóa đơn, ngày hóa đơn, ghi chú…) cũng bị ghi đè bằng giá trị gửi lên, nên
 * luôn gửi lại đúng giá trị vừa đọc. Đơn giá kế toán đã điền thì database tự
 * mang theo mặt hàng sang dòng mới — ở đây không đụng tới.
 *
 * ẢNH: tải lên NGAY khi bấm (trước khi kiểm các ô), giữ đường dẫn trong ô ẩn
 * `anh_da_tai` cùng ma_gui của form — gõ sai một ô thì ảnh vẫn còn, không phải
 * chụp lại (dùng chung lib/kho/anh.ts với trang nhập cũ). Thủ kho không xem
 * được ảnh (chỉ vai xem giá — 0021), nên trang chỉ hiện "✓ Đã chụp N ảnh".
 *
 * HAI THỨ TIẾNG: lỗi đọc form trả loi (tiếng Việt) và loiEn song song; câu báo
 * KetQua có cauEn. Câu tiếng Anh ở đây cũng KHÔNG nói tới giá, tiền — thủ kho
 * không thấy tiền ở bất kỳ thứ tiếng nào.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  boDau, cauLoiKho, docKg, docNgay, docSoNguyen, kqHai, laUuid, type HaiThuTieng, type KetQua, type NgonNguNB,
} from './chung.ts';
import { docTruongThem, type DinhNghiaTruong, type GiaTriTruong } from './truong-them.ts';
import { docAnhDaTai, layTepAnh, soThuTuCuoi, taiAnh } from './anh.ts';
import { CO_TRANG, type TimDs } from './tim-ds.ts';
import { dichCau } from '../cau-noi-bo.ts';

// -----------------------------------------------------------------------------
// KIỂU — đúng các khóa hàm _kg trả về, không có trường tiền nào
// -----------------------------------------------------------------------------
export interface NccNhap { id: string; ten: string; lan_cuoi: string | null }

export interface PhieuNhanTom {
  id: string;
  so_phieu: string;
  loai: 'mua' | 'ton_dau';
  trang_thai: string;
  ten_nha_cung_cap: string | null;
  ten_vi_tri: string | null;
  ngay_nhap: string;
  so_hoa_don: string | null;
  so_dong: number;
  tong_kg: number;
  tong_goi: number;
  so_anh: number;
  ly_do: string | null;
  nguoi_tao: string | null;
  created_at: string;
}

export interface DongNhan {
  id: string;
  thu_tu: number;
  mat_hang_id: string;
  ten_mat_hang: string;
  dem_goi: boolean;
  don_vi_goi: string;
  so_goi: number;
  so_kg: number;
  so_lo_ncc: string | null;
  ngay_san_xuat: string | null;
  han_dung: string | null;
  truong_them: GiaTriTruong;
  lo_id: string | null;
  /** Món theo dõi theo tảng (0046): dòng là MỘT tảng, có ngày mổ; số tảng có khi đã duyệt. */
  theo_tang?: boolean;
  ngay_mo?: string | null;
  so_tang?: number | null;
  /** Kg sau repack (0048) — null = như so_kg. so_kg vẫn là kg nhà cung cấp (tính tiền). */
  so_kg_thuc?: number | null;
}

export interface PhieuNhan {
  id: string;
  so_phieu: string;
  loai: 'mua' | 'ton_dau';
  trang_thai: 'nhap' | 'cho_duyet' | 'da_duyet' | 'tu_choi' | 'da_huy';
  nha_cung_cap_id: string | null;
  ten_nha_cung_cap: string | null;
  vi_tri_id: string;
  ten_vi_tri: string | null;
  ngay_nhap: string;
  so_hoa_don: string | null;
  ngay_hoa_don: string | null;
  ghi_chu: string | null;
  so_anh: number;
  truong_them: GiaTriTruong;
  ly_do: string | null;
  phien_ban: number;
  nguoi_tao: string | null;
  nguoi_gui: string | null;
  gui_luc: string | null;
  nguoi_duyet: string | null;
  duyet_luc: string | null;
  created_at: string;
  dong: DongNhan[];
  /** Đơn đặt hàng của phiếu (0039) — null khi nhận lẻ, không theo đơn. Không tiền. */
  don_dat: DonDatCuaPhieu | null;
}

/** kho_doc_phieu_nhap_kg → don_dat (0039). so_kg_da_nhan gồm cả phiếu này nếu phiếu đã gửi / đã duyệt. */
export interface DonDatCuaPhieu {
  id: string;
  so_phieu: string;
  trang_thai: string;
  ngay_giao_du_kien: string;
  dong: { mat_hang_id: string; ten_mat_hang: string; so_kg_dat: number; so_goi_dat: number | null; so_kg_da_nhan: number }[];
}

/** Một dòng gửi vào p_dong — KHÔNG có don_gia_kg (có là database báo lỗi). */
export interface DongLuu {
  mat_hang_id: string;
  so_kg: number;
  so_goi: number | null;
  so_lo_ncc: string | null;
  ngay_san_xuat: string | null;
  han_dung: string | null;
  truong_them: GiaTriTruong;
  /** Ngày mổ — bắt buộc với món theo dõi theo tảng (0046). */
  ngay_mo?: string | null;
  /** Kg sau repack (0048) — món theo tảng phải có trước khi gửi duyệt. */
  so_kg_thuc?: number | null;
}

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
/** Nhà cung cấp để chọn — người giao gần nhất ở chi nhánh này đứng đầu. */
export async function docNccNhap(client: SupabaseClient, chiNhanhId: string): Promise<NccNhap[]> {
  const { data, error } = await client.rpc('kho_ds_ncc_nhap', { p_chi_nhanh_id: chiNhanhId });
  if (error) throw error;
  return (data ?? []) as NccNhap[];
}

/**
 * Danh sách phiếu nhận hàng, chỉ kg. Đọc CO_TRANG + 1 dòng (catTrang cắt lại
 * và biết còn trang sau) — cùng cách chia trang với lib/kho/tim-ds.ts.
 */
export async function docDsPhieuNhan(
  client: SupabaseClient, chiNhanhId: string, trangThai: string | null, tim: TimDs,
): Promise<PhieuNhanTom[]> {
  const { data, error } = await client.rpc('kho_ds_phieu_nhap_kg', {
    p_chi_nhanh_id: chiNhanhId,
    p_trang_thai: trangThai,
    p_q: tim.q || null,
    p_tu: tim.tu,
    p_den: tim.den,
    p_cua_toi: tim.cuaToi,
    p_gioi_han: CO_TRANG + 1,
    p_bo_qua: (tim.trang - 1) * CO_TRANG,
  });
  if (error) throw error;
  return ((data ?? []) as PhieuNhanTom[]).map(r => ({
    ...r, so_dong: Number(r.so_dong), tong_kg: Number(r.tong_kg), tong_goi: Number(r.tong_goi), so_anh: Number(r.so_anh),
  }));
}

/** Một phiếu, chỉ kg. Không có / không được xem → null. */
export async function docPhieuNhan(client: SupabaseClient, id: string): Promise<PhieuNhan | null> {
  if (!laUuid(id)) return null;
  const { data, error } = await client.rpc('kho_doc_phieu_nhap_kg', { p_id: id });
  if (error) {
    // Hàm báo "không tìm thấy, hoặc không được xem" bằng lỗi quyền — trang coi là không có.
    // So câu database "Không tìm thấy phiếu nhập…" trên chữ đã bỏ dấu (boDau): file thư
    // viện không giữ câu tiếng Việt nào ngoài cặp { vi, en } (test-kho-tieng-anh.mjs).
    if (/Khong tim thay phieu nhap/.test(boDau(error.message ?? ''))) return null;
    throw error;
  }
  if (!data || typeof data !== 'object') return null;
  const p = data as PhieuNhan;
  return {
    ...p,
    so_anh: Number(p.so_anh ?? 0),
    truong_them: p.truong_them ?? {},
    dong: (p.dong ?? []).map(d => ({
      ...d, so_kg: Number(d.so_kg), so_goi: Number(d.so_goi ?? 0), truong_them: d.truong_them ?? {},
    })),
    don_dat: p.don_dat && typeof p.don_dat === 'object' ? {
      ...p.don_dat,
      dong: (p.don_dat.dong ?? []).map(x => ({
        ...x, so_kg_dat: Number(x.so_kg_dat), so_kg_da_nhan: Number(x.so_kg_da_nhan ?? 0),
        so_goi_dat: x.so_goi_dat === null || x.so_goi_dat === undefined ? null : Number(x.so_goi_dat),
      })),
    } : null,
  };
}

/**
 * Món hay giao của nhà cung cấp này — để hiện thành nút lớn ở bước 2. Thủ kho
 * không đọc được bảng dòng phiếu (có đơn giá), nên lấy qua các hàm _kg: tìm
 * vài phiếu gần nhất có tên NCC này, đọc dòng của 3 phiếu đầu. Lỗi thì trả
 * mảng rỗng — trang vẫn còn ô chọn mặt hàng.
 */
export async function docMonGanDay(
  client: SupabaseClient, chiNhanhId: string, tenNcc: string | null, boQuaId: string,
): Promise<string[][]> {
  if (!tenNcc) return [];
  try {
    const { data, error } = await client.rpc('kho_ds_phieu_nhap_kg', {
      p_chi_nhanh_id: chiNhanhId,
      p_trang_thai: null,
      p_q: tenNcc.slice(0, 60),
      p_tu: null,
      p_den: null,
      p_cua_toi: false,
      p_gioi_han: 8,
      p_bo_qua: 0,
    });
    if (error) return [];
    const ids = ((data ?? []) as PhieuNhanTom[])
      .filter(p => p.ten_nha_cung_cap === tenNcc && p.id !== boQuaId && p.trang_thai !== 'da_huy' && Number(p.so_dong) > 0)
      .slice(0, 3).map(p => p.id);
    const ds = await Promise.all(ids.map(id => docPhieuNhan(client, id).catch(() => null)));
    return ds.map(p => (p?.dong ?? []).map(d => d.mat_hang_id));
  } catch {
    return [];
  }
}

/** Gộp nhiều danh sách mặt hàng thành một, giữ thứ tự xuất hiện đầu tiên, bỏ trùng, tối đa `toiDa`. */
export function gopMonGanDay(ds: string[][], toiDa = 8): string[] {
  const ra: string[] = [];
  for (const nhom of ds) {
    for (const id of nhom) {
      if (!laUuid(id) || ra.includes(id)) continue;
      ra.push(id);
      if (ra.length >= toiDa) return ra;
    }
  }
  return ra;
}

// -----------------------------------------------------------------------------
// FORM → DỮ LIỆU (hàm thuần — test ở crm/test/test-kho-ma-vach.mjs)
// -----------------------------------------------------------------------------
/** Đầu phiếu như đang hiện trên form (bước 1, hoặc "Sửa thông tin phiếu" ở bước 2). */
export interface DauNhan {
  nha_cung_cap_id: string;
  vi_tri_id: string;
  ngay_nhap: string;
  so_hoa_don: string;
  truong_them: GiaTriTruong;
}

/**
 * Nhà cung cấp: nút lớn (radio `ncc`) cho người giao gần đây, ô chọn `ncc_khac`
 * cho những người còn lại. Ô chọn có giá trị thì thắng — người dùng đã chủ ý
 * chọn ở đó.
 */
export function docFormDauNhan(
  form: { get(ten: string): unknown },
  loai: 'mua' | 'ton_dau',
  dinhNghiaPhieu: DinhNghiaTruong[],
  cu: GiaTriTruong = {},
): { dau: DauNhan; loi: string[]; loiEn: string[] } {
  const s = (ten: string) => String(form.get(ten) ?? '').trim();
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const tt = docTruongThem(form, dinhNghiaPhieu, undefined, cu);
  loi.push(...tt.loi);
  loiEn.push(...tt.loiEn);
  const ncc = loai === 'mua' ? (s('ncc_khac') || s('ncc')) : '';
  const dau: DauNhan = {
    nha_cung_cap_id: ncc,
    vi_tri_id: s('vi_tri_id'),
    ngay_nhap: s('ngay_nhap'),
    so_hoa_don: loai === 'mua' ? s('so_hoa_don').slice(0, 60) : '',
    truong_them: tt.giaTri,
  };
  if (loai === 'mua' && !laUuid(dau.nha_cung_cap_id)) bao({ vi: 'Chọn nhà cung cấp (người giao hàng)', en: 'Choose the supplier (who delivered)' });
  if (!laUuid(dau.vi_tri_id)) bao({ vi: 'Chọn nơi nhận hàng', en: 'Choose where the goods are received' });
  const ngay = docNgay(dau.ngay_nhap);
  if (!ngay) {
    bao(ngay === null
      ? { vi: 'Chọn ngày nhận hàng', en: 'Choose the receiving date' }
      : { vi: 'Ngày nhận hàng không phải ngày có thật', en: 'The receiving date is not a real date' });
  }
  return { dau, loi, loiEn };
}

/** Một dòng như đang hiện trên form thêm / sửa dòng — giữ chữ đã gõ để điền lại khi báo lỗi. */
export interface DongNhanForm {
  mat_hang_id: string;
  so_kg: string;
  so_goi: string;
  han_dung: string;
  ngay_san_xuat: string;
  so_lo_ncc: string;
  truong_them: GiaTriTruong;
  ngay_mo: string;
  so_kg_thuc: string;
}

export function dongNhanTrong(): DongNhanForm {
  return { mat_hang_id: '', so_kg: '', so_goi: '', han_dung: '', ngay_san_xuat: '', so_lo_ncc: '', truong_them: {}, ngay_mo: '', so_kg_thuc: '' };
}

/** Dòng đã lưu → chữ điền vào form sửa. */
export function dongNhanVaoForm(d: DongNhan): DongNhanForm {
  return {
    mat_hang_id: d.mat_hang_id,
    so_kg: String(d.so_kg).replace('.', ','),
    so_goi: d.so_goi ? String(d.so_goi) : '',
    han_dung: d.han_dung ?? '',
    ngay_san_xuat: d.ngay_san_xuat ?? '',
    so_lo_ncc: d.so_lo_ncc ?? '',
    truong_them: d.truong_them ?? {},
    ngay_mo: d.ngay_mo ?? '',
    so_kg_thuc: d.so_kg_thuc != null ? String(d.so_kg_thuc).replace('.', ',') : '',
  };
}

/** Thông tin mặt hàng cần để kiểm dòng: có đếm tảng/gói không, gọi là gì. */
export interface MonKiem { ten: string; dem_goi: boolean; don_vi_goi: string; theo_tang?: boolean }

/**
 * Đọc form MỘT dòng (bước 2). Mặt hàng: nút lớn (radio `mh`) hoặc ô chọn
 * `mh_khac` — ô chọn có giá trị thì thắng. Ô thông tin thêm của lô mang số
 * dòng 0 (`tt__<khoa>__0`) để không đụng ô của đầu phiếu.
 */
export function docFormDongNhan(
  form: { get(ten: string): unknown },
  dinhNghiaLo: DinhNghiaTruong[],
  mon: Map<string, MonKiem>,
  cu: GiaTriTruong = {},
): { dong: DongNhanForm; loi: string[]; loiEn: string[]; luu: DongLuu | null } {
  const s = (ten: string) => String(form.get(ten) ?? '').trim();
  const tt = docTruongThem(form, dinhNghiaLo, 0, cu);
  const dong: DongNhanForm = {
    mat_hang_id: s('mh_khac') || s('mh'),
    so_kg: s('so_kg'), so_goi: s('so_goi'),
    han_dung: s('hsd'), ngay_san_xuat: s('nsx'), so_lo_ncc: s('so_lo_ncc').slice(0, 60),
    truong_them: tt.giaTri,
    ngay_mo: s('ngay_mo'),
    so_kg_thuc: s('kg_thuc'),
  };
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const m = laUuid(dong.mat_hang_id) ? mon.get(dong.mat_hang_id) : undefined;
  if (!m) bao({ vi: 'Chọn món hàng', en: 'Choose an item' });
  const kg = docKg(dong.so_kg);
  if (kg === null) bao({ vi: 'Nhập số kg (ví dụ 12,5)', en: 'Enter the kg (for example 12.5)' });
  else if (Number.isNaN(kg) || kg <= 0) bao({ vi: 'Số kg chưa đúng (ví dụ 12,5)', en: 'The kg is not valid (for example 12.5)' });
  const goi = docSoNguyen(dong.so_goi, 0, 100000);
  if (Number.isNaN(goi)) {
    bao({ vi: `Số ${m?.don_vi_goi ?? 'tảng / gói'} là số nguyên (ví dụ 2)`,
          en: `The number of ${m?.don_vi_goi ?? 'pieces / packs'} must be a whole number (for example 2)` });
  } else if (m?.theo_tang && goi !== null && goi > 1) {
    bao({ vi: `${m.ten} theo dõi theo tảng: mỗi tảng một dòng, cân riêng`,
          en: `${m.ten} is tracked per primal: one line per primal, weighed on its own` });
  } else if (m?.dem_goi && !goi && !m.theo_tang) {
    bao({ vi: `Nhập số ${m.don_vi_goi} của ${m.ten}`, en: `Enter the number of ${m.don_vi_goi} for ${m.ten}` });
  }
  // 0048: kg sau repack — tuỳ chọn khi lưu (chưa repack thì để trống), không
  // lớn hơn kg nhà cung cấp quá 1% (sai số cân). Gửi duyệt mới bắt buộc với tảng.
  const thuc = docKg(dong.so_kg_thuc);
  if (thuc !== null && (Number.isNaN(thuc) || thuc <= 0)) {
    bao({ vi: 'Kg sau repack chưa đúng (ví dụ 11,8)', en: 'The weight after repack is not valid (for example 11.8)' });
  } else if (thuc !== null && typeof kg === 'number' && kg > 0 && thuc > kg * 1.01) {
    bao({ vi: 'Kg sau repack lớn hơn kg nhà cung cấp — kiểm tra lại cân', en: 'The weight after repack is more than the supplier weight — check the scale' });
  }
  const mo = docNgay(dong.ngay_mo);
  if (mo === undefined) bao({ vi: 'Ngày mổ không phải ngày có thật', en: 'The slaughter date is not a real date' });
  else if (m?.theo_tang && !mo) {
    bao({ vi: `Nhập ngày mổ của tảng ${m.ten} (xem nhãn thùng)`, en: `Enter the slaughter date of this ${m.ten} primal (see the box label)` });
  }
  const hsd = docNgay(dong.han_dung);
  const nsx = docNgay(dong.ngay_san_xuat);
  if (hsd === undefined) bao({ vi: 'Hạn dùng không phải ngày có thật', en: 'The use-by date is not a real date' });
  if (nsx === undefined) bao({ vi: 'Ngày sản xuất không phải ngày có thật', en: 'The production date is not a real date' });
  loi.push(...tt.loi);
  loiEn.push(...tt.loiEn);

  const luu: DongLuu | null = loi.length ? null : {
    mat_hang_id: dong.mat_hang_id,
    so_kg: kg as number,
    so_goi: goi,
    so_lo_ncc: dong.so_lo_ncc || null,
    ngay_san_xuat: nsx || null,
    han_dung: hsd || null,
    truong_them: tt.giaTri,
    ...(mo ? { ngay_mo: mo } : {}),
    ...(thuc !== null ? { so_kg_thuc: thuc } : {}),
  };
  if (luu && m?.theo_tang) luu.so_goi = 1;
  return { dong, loi, loiEn, luu };
}

/** Dòng đã lưu → dòng gửi lại khi lưu cả phiếu (không mang đơn giá — database tự giữ). */
export function dongLuuTuPhieu(d: DongNhan): DongLuu {
  return {
    mat_hang_id: d.mat_hang_id,
    so_kg: d.so_kg,
    so_goi: d.so_goi || null,
    so_lo_ncc: d.so_lo_ncc,
    ngay_san_xuat: d.ngay_san_xuat,
    han_dung: d.han_dung,
    truong_them: d.truong_them ?? {},
    ...(d.ngay_mo ? { ngay_mo: d.ngay_mo } : {}),
    ...(d.so_kg_thuc != null ? { so_kg_thuc: d.so_kg_thuc } : {}),
  };
}

/**
 * Hao hụt repack của một dòng: kg nhà cung cấp → kg sau repack. null khi dòng
 * chưa ghi kg sau repack. pt: % hao (2 số lẻ), có thể âm nếu cân lại nặng hơn chút.
 */
export function haoRepack(soKg: number, soKgThuc: number | null | undefined): { kg: number; pt: number } | null {
  if (soKgThuc == null || !(soKg > 0)) return null;
  const kg = Math.round((soKg - soKgThuc) * 1000) / 1000;
  return { kg, pt: Math.round(kg * 10000 / soKg) / 100 };
}

/** Tảng chưa có kg sau repack — chưa gửi duyệt được. */
export function tangChuaRepack(dong: DongNhan[]): DongNhan[] {
  return dong.filter(d => d.theo_tang && d.so_kg_thuc == null);
}

/**
 * Danh sách dòng sau một lệnh: thêm dòng mới ở cuối, thay dòng `thay`, hoặc
 * bỏ dòng `bo`. Dòng cần thay / bỏ không còn (máy khác vừa sửa) → null.
 */
export function ghepDongNhan(
  dsCu: DongNhan[],
  lenh: { them: DongLuu } | { thay: string; dong: DongLuu } | { bo: string },
): DongLuu[] | null {
  if ('them' in lenh) return [...dsCu.map(dongLuuTuPhieu), lenh.them];
  const id = 'thay' in lenh ? lenh.thay : lenh.bo;
  if (!dsCu.some(d => d.id === id)) return null;
  if ('thay' in lenh) return dsCu.map(d => (d.id === id ? lenh.dong : dongLuuTuPhieu(d)));
  return dsCu.filter(d => d.id !== id).map(dongLuuTuPhieu);
}

/**
 * Kiểm trước khi gửi (bước 3) — cùng các điều database kiểm lúc gửi, nói
 * bằng câu cho thủ kho. Trả mảng rỗng = gửi được.
 */
export function kiemTruocKhiGui(
  p: Pick<PhieuNhan, 'loai' | 'nha_cung_cap_id' | 'so_anh' | 'truong_them' | 'dong'>,
  dinhNghiaPhieu: DinhNghiaTruong[],
  dinhNghiaLo: DinhNghiaTruong[],
  nn: NgonNguNB = 'vi',
): string[] {
  const loi: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c[nn]); };
  const thieu = (dn: DinhNghiaTruong[], gt: GiaTriTruong) =>
    dn.filter(x => x.dang_dung && x.bat_buoc && (gt?.[x.khoa] === undefined || gt[x.khoa] === null || gt[x.khoa] === ''))
      .map(x => x.nhan);
  if (p.loai === 'mua') {
    if (!p.nha_cung_cap_id) bao({ vi: 'Chưa chọn nhà cung cấp', en: 'No supplier chosen yet' });
    if (p.so_anh < 1) bao({ vi: 'Chưa chụp hóa đơn / phiếu giao hàng', en: 'No photo of the invoice / delivery note yet' });
    const o = thieu(dinhNghiaPhieu, p.truong_them);
    if (o.length) bao({ vi: `Chưa điền: ${o.join(', ')}`, en: `Not filled in yet: ${o.join(', ')}` });
  }
  if (p.dong.length === 0) bao({ vi: 'Chưa có món hàng nào', en: 'No items yet' });
  if (p.loai === 'mua') {
    p.dong.forEach((d, i) => {
      const o = thieu(dinhNghiaLo, d.truong_them);
      if (o.length) {
        bao({ vi: `Dòng ${i + 1} (${d.ten_mat_hang}): chưa điền ${o.join(', ')}`,
              en: `Line ${i + 1} (${d.ten_mat_hang}): ${o.join(', ')} not filled in yet` });
      }
    });
    // 0048: tảng phải có kg sau repack (database cũng chặn).
    p.dong.forEach((d, i) => {
      if (d.theo_tang && d.so_kg_thuc == null) {
        bao({ vi: `Dòng ${i + 1} (${d.ten_mat_hang}): chưa có kg sau repack — repack, cân rồi sửa dòng`,
              en: `Line ${i + 1} (${d.ten_mat_hang}): no weight after repack yet — repack, weigh, then edit the line` });
      }
    });
  }
  return loi;
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
export interface KetQuaTao extends KetQua {
  id?: string;
  /** Chưa tạo được: chữ đã gõ, ma_gui cũ và ảnh đã lên — trang hiện lại form. */
  dau?: DauNhan;
  maGui?: string;
  anhDaTai?: string[];
}

/**
 * Bước 1: tải ảnh TRƯỚC, rồi kiểm các ô, rồi tạo phiếu nháp 0 dòng. Hàng mua
 * bắt buộc có ảnh hóa đơn / phiếu giao hàng — kế toán điền giá từ ảnh này.
 */
export async function taoPhieuNhan(
  client: SupabaseClient,
  chiNhanhId: string,
  form: FormData,
  ctx: { loai: 'mua' | 'ton_dau'; dinhNghiaPhieu: DinhNghiaTruong[] },
): Promise<KetQuaTao> {
  const doc = docFormDauNhan(form, ctx.loai, ctx.dinhNghiaPhieu);
  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) {
    return {
      ...kqHai(false, { vi: 'Form đã cũ — tải lại trang rồi làm lại.', en: 'This form is out of date — reload the page and start again.' }),
      dau: doc.dau,
    };
  }

  const daTaiTruoc = docAnhDaTai(form, chiNhanhId, 'nhap', maGui, 24);
  const tai = await taiAnh(client, chiNhanhId, 'nhap', maGui, layTepAnh(form), soThuTuCuoi(daTaiTruoc) + 1);
  const anh = [...daTaiTruoc, ...tai.duongDan];
  const cauAnh = cauLoiAnh(tai);
  const conAnh = cauAnhVanCon(anh.length);
  const chuaTao = (c: HaiThuTieng): KetQuaTao => ({
    ok: false,
    cau: c.vi + conAnh.vi + cauAnh.vi,
    cauEn: c.en + conAnh.en + cauAnh.en,
    dau: doc.dau, maGui, anhDaTai: anh,
  });

  const loi = [...doc.loi];
  const loiEn = [...doc.loiEn];
  if (ctx.loai === 'mua' && anh.length === 0) {
    const c = { vi: 'Chụp hoặc chọn ảnh hóa đơn / phiếu giao hàng trước', en: 'Take or choose a photo of the invoice / delivery note first' };
    loi.unshift(c.vi);
    loiEn.unshift(c.en);
  }
  if (loi.length) return chuaTao({ vi: loi.join(' · '), en: loiEn.join(' · ') });

  const { data, error } = await client.rpc('kho_luu_phieu_nhap_kg', {
    p_id: null,
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_phien_ban: null,
    p_loai: ctx.loai,
    p_nha_cung_cap_id: ctx.loai === 'mua' ? doc.dau.nha_cung_cap_id : null,
    p_vi_tri_id: doc.dau.vi_tri_id,
    p_ngay_nhap: doc.dau.ngay_nhap,
    p_so_hoa_don: doc.dau.so_hoa_don || null,
    p_ngay_hoa_don: null,
    p_ghi_chu: null,
    p_anh_them: anh,
    p_truong_them: doc.dau.truong_them,
    p_dong: [],
  });
  if (error) return chuaTao(hai(cauLoiKho(error)));
  const kq = (Array.isArray(data) ? data[0] : data) as { phieu_id: string; phien_ban_moi: number; da_co: boolean } | undefined;
  if (!kq) {
    return chuaTao({ vi: 'Không chắc đã lưu hay chưa — mở danh sách Nhận hàng để kiểm tra.',
                     en: 'Not sure whether it was saved — open the Receive goods list to check.' });
  }
  const xong: HaiThuTieng = kq.da_co
    ? { vi: 'Phiếu này đã được tạo từ lần bấm trước.', en: 'This note was already created the first time you pressed.' }
    : { vi: 'Đã tạo phiếu. Giờ thêm từng món hàng.', en: 'Note created. Now add each item.' };
  return { ok: true, id: kq.phieu_id, cau: xong.vi + cauAnh.vi, cauEn: xong.en + cauAnh.en };
}

export interface KetQuaLuuNhan extends KetQua {
  /** Chưa lưu được: ảnh vừa tải (ô ẩn anh_da_tai) và ma_gui để giữ lại. */
  maGui?: string;
  anhDaTai?: string[];
}

/**
 * Lưu cả phiếu với danh sách dòng mới và ảnh thêm. Đầu phiếu lấy nguyên từ
 * lần đọc (hoặc `dau` khi đang sửa đầu phiếu) — hàm database ghi đè các ô đó.
 */
export async function luuPhieuNhan(
  client: SupabaseClient,
  chiNhanhId: string,
  p: PhieuNhan,
  phienBan: number,
  maGui: string,
  dong: DongLuu[],
  them: { anh?: string[]; dau?: DauNhan } = {},
): Promise<KetQua> {
  const dau = them.dau;
  const { data, error } = await client.rpc('kho_luu_phieu_nhap_kg', {
    p_id: p.id,
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: laUuid(maGui) ? maGui : crypto.randomUUID(),
    p_phien_ban: phienBan,
    p_loai: p.loai,
    p_nha_cung_cap_id: dau ? (p.loai === 'mua' ? dau.nha_cung_cap_id : null) : p.nha_cung_cap_id,
    p_vi_tri_id: dau ? dau.vi_tri_id : p.vi_tri_id,
    p_ngay_nhap: dau ? dau.ngay_nhap : p.ngay_nhap,
    p_so_hoa_don: dau ? (dau.so_hoa_don || null) : p.so_hoa_don,
    p_ngay_hoa_don: p.ngay_hoa_don,
    p_ghi_chu: p.ghi_chu,
    p_anh_them: them.anh ?? [],
    p_truong_them: dau ? dau.truong_them : p.truong_them,
    p_dong: dong,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(!!data, { vi: 'Đã lưu.', en: 'Saved.' });
}

/**
 * Thêm dòng. Bấm hai lần (mạng chậm): lần sau vấp phien_ban cũ — đọc lại
 * phiếu, nếu dòng cuối đúng là dòng này thì coi như đã thêm, không báo lỗi.
 */
export async function themDongNhan(
  client: SupabaseClient, chiNhanhId: string, p: PhieuNhan, phienBan: number, maGui: string, moi: DongLuu,
): Promise<KetQua> {
  const kq = await luuPhieuNhan(client, chiNhanhId, p, phienBan, maGui, ghepDongNhan(p.dong, { them: moi })!);
  if (kq.ok) {
    return kqHai(true, { vi: 'Đã thêm. Còn món nào thì thêm tiếp, hết thì bấm "Xong, xem lại".',
                         en: 'Added. Add the next item, or press "Done, review" when you have finished.' });
  }
  // Câu database "…đã được sửa ở máy khác…" — so trên chữ đã bỏ dấu (xem docPhieuNhan).
  if (/may khac/.test(boDau(kq.cau))) {
    const lai = await docPhieuNhan(client, p.id).catch(() => null);
    const cuoi = lai?.dong[lai.dong.length - 1];
    if (lai && lai.dong.length === p.dong.length + 1 && cuoi
        && cuoi.mat_hang_id === moi.mat_hang_id && cuoi.so_kg === moi.so_kg && (cuoi.so_goi || null) === (moi.so_goi || null)) {
      return kqHai(true, { vi: 'Dòng này đã được thêm từ lần bấm trước.', en: 'This line was already added the first time you pressed.' });
    }
  }
  return kq;
}

/** Thêm ảnh vào phiếu đang có: tải lên thư mục của ma_gui form này, rồi lưu (dòng giữ nguyên). */
export async function themAnhNhan(
  client: SupabaseClient, chiNhanhId: string, p: PhieuNhan, phienBan: number, form: FormData,
): Promise<KetQuaLuuNhan> {
  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) {
    return kqHai(false, { vi: 'Form đã cũ — tải lại trang rồi chụp lại.', en: 'This form is out of date — reload the page and take the photo again.' });
  }
  const daTaiTruoc = docAnhDaTai(form, chiNhanhId, 'nhap', maGui, 24);
  const tai = await taiAnh(client, chiNhanhId, 'nhap', maGui, layTepAnh(form), soThuTuCuoi(daTaiTruoc) + 1);
  const anh = [...daTaiTruoc, ...tai.duongDan];
  const cauAnh = cauLoiAnh(tai);
  if (anh.length === 0) {
    return tai.loi.length
      ? { ok: false, cau: tai.loi.join(' · '), cauEn: tai.loiEn.join(' · ') }
      : kqHai(false, { vi: 'Chưa chọn ảnh nào.', en: 'No photo chosen.' });
  }
  const kq = await luuPhieuNhan(client, chiNhanhId, p, phienBan, maGui, p.dong.map(dongLuuTuPhieu), { anh });
  const n = anh.length;
  const anhChu = n === 1 ? 'photo' : 'photos';
  if (!kq.ok) {
    const c: HaiThuTieng = {
      vi: `${kq.cau} · Ảnh đã lên (${n} ảnh) — bấm "Thêm ảnh" lần nữa, không cần chụp lại.${cauAnh.vi}`,
      en: `${kq.cauEn ?? dichCau('en', kq.cau)} · ${n} ${anhChu} uploaded — press "Add photos" again, no need to take them again.${cauAnh.en}`,
    };
    return { ...kqHai(false, c), maGui, anhDaTai: anh };
  }
  return kqHai(true, { vi: `Đã thêm ${n} ảnh.${cauAnh.vi}`, en: `Added ${n} ${anhChu}.${cauAnh.en}` });
}

/** Câu tiếng Việt từ database / cauLoiKho → cặp hai thứ tiếng (tiếng Anh tra dichCau). */
function hai(vi: string): HaiThuTieng {
  return { vi, en: dichCau('en', vi) };
}

/** " Lưu ý: <lỗi tải ảnh>" nối sau câu báo; không có lỗi thì chuỗi rỗng. */
function cauLoiAnh(tai: { loi: string[]; loiEn: string[] }): HaiThuTieng {
  return tai.loi.length ? { vi: ` Lưu ý: ${tai.loi.join(' · ')}`, en: ` Note: ${tai.loiEn.join(' · ')}` } : { vi: '', en: '' };
}

/** Chưa lưu được mà ảnh đã lên: nhắc không phải chụp lại. */
function cauAnhVanCon(so: number): HaiThuTieng {
  return so > 0
    ? { vi: ` · Ảnh vẫn còn (${so} ảnh), không cần chụp lại.`,
        en: ` · The photos are kept (${so} ${so === 1 ? 'photo' : 'photos'}) — no need to take them again.` }
    : { vi: '', en: '' };
}

/**
 * Các hàm đổi trạng thái trả về một câu tiếng Việt của database — hiện nguyên
 * văn (màn tiếng Anh tra dichCau lúc hiện, trong BaoKho).
 */
async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  if (data === null || data === undefined) return kqHai(true, { vi: 'Xong.', en: 'Done.' });
  return { ok: true, cau: String(data) };
}

export function guiPhieuNhan(client: SupabaseClient, id: string, phienBan: number) {
  return cauTraVe(client.rpc('kho_gui_duyet_phieu_nhap', { p_id: id, p_phien_ban: phienBan }));
}
export function rutPhieuNhan(client: SupabaseClient, id: string) {
  return cauTraVe(client.rpc('kho_rut_phieu_nhap', { p_id: id }));
}
export function huyPhieuNhan(client: SupabaseClient, id: string, lyDo: string | null) {
  return cauTraVe(client.rpc('kho_huy_phieu_nhap', { p_id: id, p_ly_do: lyDo }));
}
