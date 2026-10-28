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
 * lấy từ kho_doc_phieu_nhap_kg, kèm phien_ban chống hai máy đè nhau. Số tảng
 * (0097) đi theo khóa so_tang của từng dòng: dòng gửi lại số database đã cấp
 * thì giữ số; không gửi thì database cấp số mới và ghi bỏ số cũ. Đầu phiếu
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
import { soTangChu } from './tang.ts';
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
  /** Món theo dõi theo tảng (0048): dòng là MỘT tảng, có ngày mổ. */
  theo_tang?: boolean;
  ngay_mo?: string | null;
  /** Số tảng: cấp lúc lưu dòng (0097); đã duyệt là số của lô. Viết lên túi tảng. */
  so_tang?: number | null;
  /** Số tảng của dòng do CHÍNH tài khoản đang đọc cấp (0097) — phân biệt lần bấm trước với tài khoản khác. */
  so_tang_toi_cap?: boolean;
  /** Kg sau repack (0050) — null = như so_kg. so_kg vẫn là kg nhà cung cấp (tính tiền). */
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
  /** Số tảng đã cấp cho phiếu mà không dùng nữa (0097): dòng bị bỏ, đổi sang món thường, phiếu đã hủy. */
  so_tang_bo?: number[];
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
  /** Ngày mổ — bắt buộc với món theo dõi theo tảng (0048). */
  ngay_mo?: string | null;
  /** Kg sau repack (0050) — món theo tảng phải có trước khi gửi duyệt. */
  so_kg_thuc?: number | null;
  /**
   * Số tảng (0097): chỉ gửi lại số database đã cấp cho dòng này — database kiểm số đúng là của
   * phiếu này. Không gửi thì database cấp số mới (và ghi bỏ số cũ của dòng, nếu có).
   */
  so_tang?: number | null;
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
      so_tang: d.so_tang === null || d.so_tang === undefined ? null : Number(d.so_tang),
      so_tang_toi_cap: d.so_tang_toi_cap === true,
    })),
    so_tang_bo: Array.isArray(p.so_tang_bo) ? p.so_tang_bo.map(Number) : [],
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
  /** Món đếm theo cái (0105): số lẻ (ngoài thùng) — hay số cái khi món không quy đổi thùng. Thịt: số tảng / gói. */
  so_goi: string;
  /** Món đếm theo cái có quy đổi thùng (0105): số thùng. */
  so_thung: string;
  han_dung: string;
  ngay_san_xuat: string;
  so_lo_ncc: string;
  truong_them: GiaTriTruong;
  ngay_mo: string;
  so_kg_thuc: string;
}

export function dongNhanTrong(): DongNhanForm {
  return { mat_hang_id: '', so_kg: '', so_goi: '', so_thung: '', han_dung: '', ngay_san_xuat: '', so_lo_ncc: '', truong_them: {}, ngay_mo: '', so_kg_thuc: '' };
}

/** Dòng đã lưu → chữ điền vào form sửa. Món đếm theo cái có quy đổi thùng: tách lại thùng + lẻ (0105). */
export function dongNhanVaoForm(d: DongNhan, m?: MonKiem): DongNhanForm {
  const n = m?.dem_cai && m.so_trong_thung && m.so_trong_thung >= 2 ? m.so_trong_thung : 0;
  const thung = n ? Math.floor(d.so_goi / n) : 0;
  const le = n ? d.so_goi - thung * n : d.so_goi;
  return {
    mat_hang_id: d.mat_hang_id,
    so_kg: m?.dem_cai ? '' : String(d.so_kg).replace('.', ','),
    so_goi: le ? String(le) : '',
    so_thung: thung ? String(thung) : '',
    han_dung: d.han_dung ?? '',
    ngay_san_xuat: d.ngay_san_xuat ?? '',
    so_lo_ncc: d.so_lo_ncc ?? '',
    truong_them: d.truong_them ?? {},
    ngay_mo: d.ngay_mo ?? '',
    so_kg_thuc: d.so_kg_thuc != null ? String(d.so_kg_thuc).replace('.', ',') : '',
  };
}

/** Thông tin mặt hàng cần để kiểm dòng: có đếm tảng/gói không, gọi là gì; món đếm theo cái và số cái một thùng (0105). */
export interface MonKiem {
  ten: string; dem_goi: boolean; don_vi_goi: string; theo_tang?: boolean;
  dem_cai?: boolean; so_trong_thung?: number | null;
}

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
  const mhId = s('mh_khac') || s('mh');
  const mCai = laUuid(mhId) ? mon.get(mhId) : undefined;
  const dong: DongNhanForm = {
    mat_hang_id: mhId,
    so_kg: s('so_kg'), so_goi: s('so_goi'), so_thung: s('so_thung'),
    // 0105: món đếm theo cái — ô hạn dùng của nó (ngày in trên sản phẩm) nằm ngoài mục gập.
    han_dung: mCai?.dem_cai ? (s('hsd_cai') || s('hsd')) : s('hsd'),
    ngay_san_xuat: s('nsx'), so_lo_ncc: s('so_lo_ncc').slice(0, 60),
    truong_them: tt.giaTri,
    ngay_mo: s('ngay_mo'),
    so_kg_thuc: s('kg_thuc'),
  };
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const m = mCai;
  if (!m) bao({ vi: 'Chọn món hàng', en: 'Choose an item' });
  if (m?.dem_cai) return docDongDemCai(dong, m, tt, loi, loiEn);
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
  // 0050: kg sau repack — tuỳ chọn khi lưu (chưa repack thì để trống), không
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

/**
 * Dòng của món đếm theo cái (0105): số thùng × số cái một thùng + số lẻ, không kg (database đặt so_kg = số cái),
 * PHẢI có hạn dùng (ngày in trên sản phẩm — không tự cộng ngày như thịt). Chai, lon nguyên: số nguyên.
 */
function docDongDemCai(
  dong: DongNhanForm, m: MonKiem, tt: { giaTri: GiaTriTruong; loi: string[]; loiEn: string[] }, loi: string[], loiEn: string[],
): { dong: DongNhanForm; loi: string[]; loiEn: string[]; luu: DongLuu | null } {
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const n = m.so_trong_thung && m.so_trong_thung >= 2 ? m.so_trong_thung : 0;
  const thung = n ? docSoNguyen(dong.so_thung, 0, 100000) : null;
  const le = docSoNguyen(dong.so_goi, 0, 1000000);
  if (Number.isNaN(thung)) bao({ vi: 'Số thùng là số nguyên (ví dụ 2)', en: 'The number of cases must be a whole number (for example 2)' });
  if (Number.isNaN(le)) {
    bao({ vi: `Số ${m.don_vi_goi} là số nguyên (ví dụ 5) — chai, lon nguyên`,
          en: `The number of ${m.don_vi_goi} must be a whole number (for example 5)` });
  }
  const tong = (Number.isNaN(thung) ? 0 : (thung ?? 0) * n) + (Number.isNaN(le) ? 0 : (le ?? 0));
  if (!Number.isNaN(thung) && !Number.isNaN(le) && tong <= 0) {
    bao(n ? { vi: `Nhập số thùng hoặc số ${m.don_vi_goi} lẻ của ${m.ten}`, en: `Enter the number of cases or loose ${m.don_vi_goi} for ${m.ten}` }
          : { vi: `Nhập số ${m.don_vi_goi} của ${m.ten}`, en: `Enter the number of ${m.don_vi_goi} for ${m.ten}` });
  } else if (tong >= 1000000) {
    bao({ vi: `Số ${m.don_vi_goi} quá lớn — kiểm tra lại`, en: `The number of ${m.don_vi_goi} is too large — check it again` });
  }
  const hsd = docNgay(dong.han_dung);
  const nsx = docNgay(dong.ngay_san_xuat);
  if (hsd === undefined) bao({ vi: 'Hạn dùng không phải ngày có thật', en: 'The use-by date is not a real date' });
  else if (!hsd) bao({ vi: `Ghi hạn dùng in trên ${m.ten}`, en: `Enter the use-by date printed on ${m.ten}` });
  if (nsx === undefined) bao({ vi: 'Ngày sản xuất không phải ngày có thật', en: 'The production date is not a real date' });
  loi.push(...tt.loi);
  loiEn.push(...tt.loiEn);
  const luu: DongLuu | null = loi.length ? null : {
    mat_hang_id: dong.mat_hang_id,
    so_kg: tong,
    so_goi: tong,
    so_lo_ncc: dong.so_lo_ncc || null,
    ngay_san_xuat: nsx || null,
    han_dung: hsd || null,
    truong_them: tt.giaTri,
  };
  return { dong, loi, loiEn, luu };
}

/**
 * Dòng đã lưu → dòng gửi lại khi lưu cả phiếu (không mang đơn giá — database tự giữ). Mang theo
 * số tảng (0097) — thiếu nó thì mỗi lần thêm ảnh hay sửa đầu phiếu, mọi tảng bị cấp số mới.
 */
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
    ...(d.so_tang != null ? { so_tang: d.so_tang } : {}),
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
 * Thay dòng: dòng mới mang số tảng của dòng cũ (0097) — sửa kg, ngày mổ, kg sau repack
 * không đổi số. Bỏ dòng: số không gửi nữa → database ghi bỏ.
 */
export function ghepDongNhan(
  dsCu: DongNhan[],
  lenh: { them: DongLuu } | { thay: string; dong: DongLuu } | { bo: string },
): DongLuu[] | null {
  if ('them' in lenh) return [...dsCu.map(dongLuuTuPhieu), lenh.them];
  const id = 'thay' in lenh ? lenh.thay : lenh.bo;
  if (!dsCu.some(d => d.id === id)) return null;
  if ('thay' in lenh) {
    // Dòng cũ không có số thì dùng nguyên dòng mới (cùng một đối tượng), không chép ra đối tượng khác.
    return dsCu.map(d => (d.id !== id ? dongLuuTuPhieu(d)
      : d.so_tang != null ? { ...lenh.dong, so_tang: d.so_tang } : lenh.dong));
  }
  return dsCu.filter(d => d.id !== id).map(dongLuuTuPhieu);
}

/**
 * Số tảng vừa cấp để hiện to trên màn nhận hàng (0097). Chỉ khi trang được chuyển về từ chính lần
 * lưu đó: `pb` là phien_ban lần lưu trả về và phiếu đọc lại vẫn đúng phiên bản ấy (không máy nào lưu
 * chen giữa), `vua` là chỉ số dòng vừa thêm / vừa sửa, dòng đó là tảng và có số. Còn lại → null.
 */
export function soTangVuaThem(
  p: Pick<PhieuNhan, 'phien_ban' | 'dong'>, vua: string | null | undefined, pb: string | null | undefined,
): number | null {
  if (!vua || !pb || !/^\d{1,4}$/.test(vua) || !/^\d{1,9}$/.test(pb)) return null;
  if (Number(pb) !== p.phien_ban) return null;
  const d = p.dong[Number(vua)];
  return d?.theo_tang && d.so_tang != null ? d.so_tang : null;
}

/** Câu báo khi một số tảng không dùng nữa (bỏ dòng tảng, đổi sang món thường) — 0097. */
export function cauSoTangBo(so: number): HaiThuTieng {
  const chu = soTangChu(so);
  return {
    vi: `Số tảng ${chu} bỏ trống — nếu đã viết lên túi thì gạch đi.`,
    en: `Primal number ${chu} is no longer used — if it is already on the bag, cross it out.`,
  };
}

/**
 * Số tảng vừa được cấp ở một lần lưu cho tảng ĐÃ có trên phiếu mà chưa có số (0097): tảng lưu trước khi
 * chạy 0097, món bật theo tảng sau khi lưu. Là số có ở `sau` mà `truoc` không có, trừ dòng `vua` (dòng
 * vừa thêm / vừa sửa — số của nó trang báo riêng). Bỏ dòng tảng chưa số thì không có số nào → [].
 */
export function soTangMoiCap(
  truoc: ReadonlyArray<Pick<DongNhan, 'so_tang'>>, sau: ReadonlyArray<Pick<DongNhan, 'so_tang'>>, vua?: number | null,
): number[] {
  const cu = new Set(truoc.map(d => d.so_tang).filter((x): x is number => x != null));
  return sau.flatMap((d, i) => (i !== vua && d.so_tang != null && !cu.has(d.so_tang) ? [d.so_tang] : []));
}

/**
 * Câu nhắc viết số lên túi cho tảng cũ vừa có số (0097). Mảng rỗng = lưu xong mà không đọc lại được phiếu
 * (mất mạng, máy khác vừa lưu chen) — không khẳng định số nào, chỉ bảo tải lại trang xem.
 */
export function cauTangVuaCoSo(so: number[]): HaiThuTieng {
  if (!so.length) {
    return {
      vi: 'Tảng lưu trước đây chưa có số có thể vừa được cấp số — tải lại trang, xem số từng tảng trong danh sách rồi viết lên túi.',
      en: 'Primals saved earlier without a number may have just been numbered — reload the page, check each primal\'s number in the list and write it on its bag.',
    };
  }
  const ds = so.map(soTangChu).join(', ');
  return {
    vi: `Tảng lưu trước đây chưa có số vừa được cấp số ${ds} — tìm từng tảng trong danh sách (theo kg, ngày mổ) rồi viết số lên túi.`,
    en: `Primals saved earlier without a number have just been numbered ${ds} — find each one in the list (by kg and slaughter date) and write its number on its bag.`,
  };
}

/** Nối câu "tảng cũ vừa có số" (0097) sau câu báo đã lưu; lần lưu không cấp số cho tảng cũ thì giữ nguyên câu. */
export function noiCauTangMoi(c: HaiThuTieng, kq: Pick<KetQuaLuuNhan, 'tangVuaCoSo'>): HaiThuTieng {
  if (!kq.tangVuaCoSo) return c;
  const t = cauTangVuaCoSo(kq.tangVuaCoSo);
  return { vi: `${c.vi} ${t.vi}`, en: `${c.en} ${t.en}` };
}

/**
 * Câu báo và phần đuôi chuyển hướng sau khi SỬA một dòng đã lưu được (màn Nhận hàng, 0097). Trang chỉ gọi hàm
 * này — kiểm thử gọi đủ năm trường hợp:
 *   · tảng → món thường: số cũ bỏ trống (database đã ghi bỏ) — bảo gạch số trên túi.
 *   · món thường → tảng: database vừa cấp số — chuyển về ?vua=<dòng>&pb=<phiên bản của chính lần lưu> để hiện to.
 *   · tảng chưa số (lưu trước 0097, món bật theo tảng sau khi lưu) → tảng: dòng VỐN là tảng, database vừa cấp số —
 *     câu "Tảng này vừa được cấp số" (không nói "giờ là một tảng"), vẫn chuyển về ?vua để hiện to.
 *   · tảng → tảng (sửa kg, ngày mổ, đổi món tảng): số giữ nguyên (ghepDongNhan mang số cũ).
 *   · món thường → món thường: chỉ "Đã sửa dòng."
 * `soCu` là số tảng của dòng TRƯỚC khi sửa; `cuLaTang` là theo_tang của dòng TRƯỚC khi sửa; `chiSo` là vị trí dòng
 * (ghepDongNhan giữ vị trí); không có phienBan hay chiSo < 0 thì không chuyển về ?vua (không hiện to một số không chắc).
 */
export function ketQuaSauSuaDong(
  soCu: number | null | undefined, moiLaTang: boolean, kq: Pick<KetQuaLuuNhan, 'phienBan' | 'tangVuaCoSo'>, chiSo: number,
  cuLaTang = false,
): { bao: HaiThuTieng; them: string } {
  let bao: HaiThuTieng;
  let them = '';
  if (soCu != null && !moiLaTang) {
    const b = cauSoTangBo(soCu);
    bao = { vi: `Đã sửa dòng. ${b.vi}`, en: `Line updated. ${b.en}` };
  } else if (soCu == null && moiLaTang) {
    bao = cuLaTang
      ? { vi: 'Đã sửa dòng. Tảng này vừa được cấp số — viết số lên túi.',
          en: 'Line updated. This primal has just been given a number — write it on the bag.' }
      : { vi: 'Đã sửa dòng. Dòng này giờ là một tảng — viết số lên túi.',
          en: 'Line updated. This line is now a primal — write the number on the bag.' };
    if (kq.phienBan && chiSo >= 0) them = `?vua=${chiSo}&pb=${kq.phienBan}#them`;
  } else if (soCu != null) {
    bao = { vi: `Đã sửa dòng — số tảng giữ nguyên ${soTangChu(soCu)}.`, en: `Line updated — the primal number stays ${soTangChu(soCu)}.` };
  } else {
    bao = { vi: 'Đã sửa dòng.', en: 'Line updated.' };
  }
  return { bao: noiCauTangMoi(bao, kq), them };
}

/**
 * Câu khi dòng đang sửa không còn trên phiếu (dong_id cũ). Database xoá hết dòng rồi ghi lại ở mỗi lần lưu (0031),
 * nên id dòng đổi: bấm đúp "Lưu dòng này" thì lần sau không còn dong_id. Phiếu hơn form đúng một phiên bản → nhiều
 * khả năng chính lần bấm trước đã lưu (không đổ cho người khác); hơn nữa → có người vừa sửa. Cả hai đều ok false
 * (lần này không lưu gì) và trang chuyển về danh sách với form thêm TRỐNG — hiện lại chữ đã gõ thì form thành form
 * THÊM điền sẵn, bấm nữa là thêm một dòng thừa (dòng tảng: database cấp thêm một số, 0097).
 */
export function ketQuaDongSuaKhongCon(phienBanPhieu: number, phienBanForm: number): KetQua {
  return kqHai(false, phienBanPhieu === phienBanForm + 1
    ? { vi: 'Dòng này có thể đã được lưu ở lần bấm trước — xem lại dòng trong danh sách; cần sửa nữa thì bấm "Sửa" ở dòng đó.',
        en: 'This line may already have been saved by your previous press — check it in the list; to change it again, press "Edit" on that line.' }
    : { vi: 'Dòng này không còn trên phiếu (có người vừa sửa) — xem lại danh sách.',
        en: 'This line is no longer on the note (someone just edited it) — check the list again.' });
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
    // 0050: tảng phải có kg sau repack (database cũng chặn).
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
  /**
   * Đã lưu: phien_ban database trả về cho CHÍNH lần lưu này (0097). Trang chỉ hiện to số tảng khi có
   * nó — không có (lỗi, mất mạng, "có thể đã thêm từ lần bấm trước") thì không hiện.
   */
  phienBan?: number;
  /**
   * Đã lưu, và phiếu trước đó có tảng chưa số (0097): số vừa cấp cho các tảng đó (soTangMoiCap) — [] khi
   * không đọc lại được phiếu. Không có = lần lưu không cấp số cho tảng cũ. Câu: noiCauTangMoi.
   */
  tangVuaCoSo?: number[];
}

/**
 * Lưu cả phiếu với danh sách dòng mới và ảnh thêm. Đầu phiếu lấy nguyên từ
 * lần đọc (hoặc `dau` khi đang sửa đầu phiếu) — hàm database ghi đè các ô đó.
 * Chỉ báo đã lưu khi database trả dòng (phieu_id, phien_ban_moi) — cùng một lần await.
 * Phiếu có tảng chưa số (lưu trước 0097, món bật theo tảng sau khi lưu): lần lưu này cấp số cho chúng —
 * đọc lại phiếu để báo số (tangVuaCoSo), trừ dòng `vua` (dòng vừa thêm / vừa sửa, trang báo riêng). Đọc
 * lại hỏng thì vẫn là đã lưu (database đã xác nhận), tangVuaCoSo = [].
 */
export async function luuPhieuNhan(
  client: SupabaseClient,
  chiNhanhId: string,
  p: PhieuNhan,
  phienBan: number,
  maGui: string,
  dong: DongLuu[],
  them: { anh?: string[]; dau?: DauNhan; vua?: number } = {},
): Promise<KetQuaLuuNhan> {
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
  const hang = (Array.isArray(data) ? data[0] : data) as { phieu_id: string; phien_ban_moi: number } | null | undefined;
  if (!hang || typeof hang !== 'object' || !Number.isFinite(Number(hang.phien_ban_moi))) {
    return kqHai(false, { vi: 'Không chắc đã lưu hay chưa — tải lại trang để kiểm tra.',
                          en: 'Not sure whether it was saved — reload the page to check.' });
  }
  const pbMoi = Number(hang.phien_ban_moi);
  const kq: KetQuaLuuNhan = { ...kqHai(true, { vi: 'Đã lưu.', en: 'Saved.' }), phienBan: pbMoi };
  if (!p.dong.some(d => d.theo_tang && d.so_tang == null)) return kq;
  // Đọc lại để biết số vừa cấp; máy khác lưu chen (phiên bản khác) thì không đoán số nào là của lần lưu này.
  const lai = await docPhieuNhan(client, p.id).catch(() => null);
  if (!lai || lai.phien_ban !== pbMoi) return { ...kq, tangVuaCoSo: [] };
  const moi = soTangMoiCap(p.dong, lai.dong, them.vua);
  return moi.length ? { ...kq, tangVuaCoSo: moi } : kq;
}

/**
 * Ô ẩn so_dong của form THÊM dòng (màn Nhận hàng): số dòng của phiếu lúc form hiện — themDongNhan dùng để nhận ra
 * lần bấm trước. Chỉ nhận số nguyên không âm viết bằng chữ số; thiếu ô, rỗng hay hỏng → null (themDongNhan dùng luật cũ).
 */
export function docSoDongForm(form: FormData): number | null {
  const x = form.get('so_dong');
  return typeof x === 'string' && /^\d{1,6}$/.test(x) ? Number(x) : null;
}

/**
 * Thêm dòng. Bấm hai lần (mạng chậm): lần sau vấp phien_ban cũ — đọc lại
 * phiếu, nếu dòng cuối đúng là dòng này (món, kg, gói, ngày mổ, kg sau repack)
 * thì coi như đã thêm, không báo lỗi. Dòng tảng (0097) còn phải do CHÍNH tài
 * khoản này cấp số (so_tang_toi_cap): tảng giống hệt mà tài khoản khác vừa thêm
 * không phải lần bấm trước — trả nguyên câu "máy khác" (ok false). Nhánh lần bấm
 * trước KHÔNG trả phienBan: trang không hiện to số, câu chỉ số ở dòng cuối.
 *
 * Nhận ra lần bấm trước theo FORM (`phienBan`, `soDongForm`), không theo `p`: lần
 * bấm sau có thể đọc phiếu SAU khi lần trước đã ghi (máy chủ ghi xong, trả lời về
 * chậm) — khi đó `p` đã có sẵn dòng mới. Điều kiện: phiếu đọc lại đúng một lần lưu
 * kể từ form (phien_ban = phienBan + 1) và có đúng một dòng hơn lúc form hiện.
 * Số dòng lúc form hiện lấy từ ô ẩn so_dong của form (`soDongForm`, docSoDongForm),
 * KHÔNG suy ra từ `p`: máy khác lưu chen mà không thêm dòng (sửa đầu phiếu, thêm ảnh,
 * sửa hay bỏ dòng khác) cũng làm phiếu lên đúng một phiên bản. Thiếu ô hay ô hỏng
 * (form mở trước khi có ô) → luật cũ: chỉ khi `p` đọc cùng phiên bản form, số dòng
 * lúc form hiện là p.dong.length; `p` đọc sau một lần lưu thì không đoán ("máy khác").
 */
export async function themDongNhan(
  client: SupabaseClient, chiNhanhId: string, p: PhieuNhan, phienBan: number, maGui: string, moi: DongLuu,
  soDongForm: number | null = null,
): Promise<KetQuaLuuNhan> {
  const kq = await luuPhieuNhan(client, chiNhanhId, p, phienBan, maGui, ghepDongNhan(p.dong, { them: moi })!,
    { vua: p.dong.length });
  if (kq.ok) {
    return {
      ...kqHai(true, noiCauTangMoi({ vi: 'Đã thêm. Còn món nào thì thêm tiếp, hết thì bấm "Xong, xem lại".',
                                     en: 'Added. Add the next item, or press "Done, review" when you have finished.' }, kq)),
      phienBan: kq.phienBan,
      tangVuaCoSo: kq.tangVuaCoSo,
    };
  }
  // Câu database "…đã được sửa ở máy khác…" — so trên chữ đã bỏ dấu (xem docPhieuNhan).
  if (/may khac/.test(boDau(kq.cau))) {
    const lai = await docPhieuNhan(client, p.id).catch(() => null);
    const cuoi = lai?.dong[lai.dong.length - 1];
    // Số dòng lúc form hiện: ô so_dong của form; thiếu ô hay ô hỏng → chỉ khi p đọc cùng phiên bản form (luật cũ),
    // không thì -1 (không bao giờ khớp). Không đoán từ p đọc sau một lần lưu: lần lưu đó có thể không thêm dòng nào.
    const soDongLucForm = soDongForm != null && Number.isInteger(soDongForm) && soDongForm >= 0 ? soDongForm
      : p.phien_ban === phienBan ? p.dong.length : -1;
    // Ngày mổ, kg sau repack: dòng đọc từ database trả null, dòng mới không có khóa là undefined.
    if (lai && soDongLucForm >= 0 && lai.phien_ban === phienBan + 1 && lai.dong.length === soDongLucForm + 1 && cuoi
        && cuoi.mat_hang_id === moi.mat_hang_id && cuoi.so_kg === moi.so_kg && (cuoi.so_goi || null) === (moi.so_goi || null)
        && (cuoi.ngay_mo ?? null) === (moi.ngay_mo ?? null)
        && (cuoi.so_kg_thuc == null ? null : Number(cuoi.so_kg_thuc)) === (moi.so_kg_thuc ?? null)) {
      if (cuoi.so_tang == null) {
        return kqHai(true, { vi: 'Dòng này đã được thêm từ lần bấm trước.', en: 'This line was already added the first time you pressed.' });
      }
      // 0097: tảng — chỉ là lần bấm trước khi số do chính tài khoản này cấp; không thì là tảng của người khác.
      if (cuoi.so_tang_toi_cap === true) {
        // Lần bấm trước cũng có thể vừa cấp số cho tảng cũ chưa số — kể ra như lúc lưu. Chỉ khi p là bản TRƯỚC lần
        // lưu đó: p đọc sau lần lưu thì tảng cũ đã có số, không phân biệt được số nào vừa cấp.
        const moiCap = p.phien_ban === phienBan && p.dong.some(d => d.theo_tang && d.so_tang == null)
          ? soTangMoiCap(p.dong, lai.dong, p.dong.length) : [];
        return kqHai(true, noiCauTangMoi({
          vi: 'Dòng này đã được thêm từ lần bấm trước: số tảng là số ở dòng cuối danh sách. Tài khoản này đang cân phiếu này ở máy khác nữa thì hỏi lại trước khi viết số lên túi.',
          en: 'This line was already added the first time you pressed: the primal number is the one on the last line of the list. If this account is also weighing this note on another device, check before writing the number on the bag.',
        }, moiCap.length ? { tangVuaCoSo: moiCap } : {}));
      }
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
  // 0097: phiếu có tảng chưa số → lần lưu này vừa cấp số cho chúng: kể ra để viết lên túi.
  return { ...kqHai(true, noiCauTangMoi({ vi: `Đã thêm ${n} ảnh.${cauAnh.vi}`, en: `Added ${n} ${anhChu}.${cauAnh.en}` }, kq)),
           phienBan: kq.phienBan, tangVuaCoSo: kq.tangVuaCoSo };
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
