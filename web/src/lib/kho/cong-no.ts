/**
 * KHO — CÔNG NỢ NHÀ CUNG CẤP, ĐỐI CHIẾU HÓA ĐƠN, TRẢ HÀNG
 *
 * Số liệu công nợ lấy từ view kho_v_cong_no_phieu / kho_v_cong_no_ncc
 * (0024) — phải trả, đã trả, giảm trừ, còn nợ, quá hạn đều do database tính.
 * File này đọc form, tải ảnh ủy nhiệm chi / biên bản, và gọi hàm.
 *
 * FORM TRẢ TIỀN (GĐ8b, 0040): docFormTraTien + ghiThanhToanV2 — xem chú thích
 * ở đó. Hàm web v1 (ghiThanhToan / docFormThanhToan) đã xóa 12/10/2026; hàm
 * database kho_ghi_thanh_toan còn đó, không trang nào gọi.
 *
 * ĐỌC LỖI ≠ KHÔNG CÓ: hàm đọc một dòng (docCongNoMotPhieu, docTenNcc) ném lỗi
 * khi mạng / database hỏng, chỉ trả null khi thật sự không có (hoặc RLS lọc
 * mất). Trang dùng docTenNccTrang / docCanhBaoTaiKhoan — không ném, nói rõ
 * "không đọc được" / "chưa kiểm được".
 *
 * HAI THỨ TIẾNG: câu báo KetQua mang thêm cauEn; hàm kiểm form trả loi (tiếng
 * Việt) và loiEn (tiếng Anh) song song, cùng thứ tự; bảng nhãn là bản `…_NB`
 * ({ vi, en }). Câu tiếng Việt giữ nguyên từng chữ — test và code cũ đọc chúng.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  boDau, cauLoiKho, chiaSoDuLonNhat, docKg, docNgay, docSoNguyen, docTien, docTungTrang, homNayVn, laUuid, kqHai, nhanKho,
  TEN_LOAI_PHIEU_NHAP_NB, type HaiThuTieng, type KetQua, type NgonNguNB,
} from './chung.ts';
import { layTepAnh, taiAnh } from './anh.ts';
import { catTrang, khoangTrang, locTimNhieuCot, type TimDs } from './tim-ds.ts';
import type { DongMisa, LoaiMisa } from './misa.ts';

/** Số tiền trong câu báo: tiếng Việt "450.000 đ" như cũ, tiếng Anh "450,000 ₫". */
const TIEN: HaiThuTieng<(x: number) => string> = {
  vi: (x: number) => `${x.toLocaleString('vi-VN')} đ`,
  en: (x: number) => `${x.toLocaleString('en-US')} ₫`,
};

/** Câu dùng nhiều lần trong file. */
const CAU = {
  xong: { vi: 'Xong.', en: 'Done.' },
  formCu: { vi: 'Form đã cũ — tải lại trang.', en: 'This form is out of date — reload the page.' },
  phieuKhongHopLe: { vi: 'Phiếu không hợp lệ.', en: 'Invalid document.' },
  khongChac: {
    vi: 'Không chắc đã ghi hay chưa — xem danh sách phiếu để kiểm tra.',
    en: 'Not sure whether it was saved — check the list of documents.',
  },
  quaNhieuDong: {
    vi: 'Quá nhiều dòng công nợ để đọc một lần — báo người quản trị.',
    en: 'Too many payables rows to read at once — tell the administrator.',
  },
  khongThayNcc: { vi: 'Không tìm thấy nhà cung cấp này.', en: 'This supplier was not found.' },
  docNccLoi: {
    vi: 'Không đọc được nhà cung cấp này — mạng hoặc database đang trục trặc. Mở lại nhà cung cấp để thử lại.',
    en: 'Could not read this supplier — the connection or the database is having trouble. Open the supplier again to retry.',
  },
  docNccLoiGui: {
    vi: 'Không đọc được nhà cung cấp này — mạng hoặc database đang trục trặc. Chưa ghi gì; mở lại nhà cung cấp để thử lại.',
    en: 'Could not read this supplier — the connection or the database is having trouble. Nothing was saved; open the supplier again to retry.',
  },
  docPhieuLoi: {
    vi: 'Chưa ghi: không đọc được phiếu nhập này — mạng hoặc database đang trục trặc. Thử lưu lại.',
    en: 'Not saved: could not read this goods receipt — the connection or the database is having trouble. Try saving again.',
  },
} satisfies Record<string, HaiThuTieng>;

/** Lỗi dòng trả hàng — traHangNcc và docDongTraHang dùng chung. */
const CAU_TRA_HANG = {
  loSai: { vi: 'Lô không hợp lệ — tải lại trang', en: 'Invalid lot — reload the page' } as HaiThuTieng,
  kg: (i: number): HaiThuTieng => ({ vi: `Dòng ${i}: ghi số kg trả (ví dụ 4,5)`, en: `Line ${i}: enter the kg returned (for example 4.5)` }),
  goi: (i: number): HaiThuTieng => ({ vi: `Dòng ${i}: số tảng / gói là số nguyên`, en: `Line ${i}: the number of primals / packs must be a whole number` }),
  cai: (i: number): HaiThuTieng => ({ vi: `Dòng ${i}: ghi số chai / lon / hộp trả (số nguyên, ví dụ 3)`, en: `Line ${i}: enter the number of bottles / cans / boxes returned (a whole number, for example 3)` }),
};

/**
 * Một dòng trả hàng t{i}_*: null = dòng bỏ trống; lỗi thì báo qua `bao` và trả null.
 * Lô món đếm theo cái (t{i}_cai = 1, ẩn): chỉ ô số cái t{i}_goi, gửi so_kg = so_goi —
 * database (kho_so_cai_dem_cai_kiem) vẫn chặn nếu form bị sửa tay.
 */
function docMotDongTra(s: (t: string) => string, i: number, bao: (c: HaiThuTieng) => void): Record<string, unknown> | null {
  const lo = s(`t${i}_lo`);
  const kgChu = s(`t${i}_kg`);
  const goiChu = s(`t${i}_goi`);
  if (!kgChu && !goiChu) return null;
  if (!laUuid(lo)) { bao(CAU_TRA_HANG.loSai); return null; }
  const goi = docSoNguyen(goiChu, 0, 100000);
  if (s(`t${i}_cai`) === '1') {
    if (goi === null || Number.isNaN(goi) || goi <= 0) { bao(CAU_TRA_HANG.cai(i + 1)); return null; }
    return { lo_id: lo, so_kg: goi, so_goi: goi };
  }
  const kg = docKg(kgChu);
  if (kg === null || Number.isNaN(kg) || kg <= 0) { bao(CAU_TRA_HANG.kg(i + 1)); return null; }
  if (Number.isNaN(goi)) { bao(CAU_TRA_HANG.goi(i + 1)); return null; }
  return goi !== null ? { lo_id: lo, so_kg: kg, so_goi: goi } : { lo_id: lo, so_kg: kg };
}

/** " Lưu ý: <ảnh chưa tải được>" nối sau câu báo (rỗng khi mọi ảnh đều lên). */
function cauAnhLoi(tai: { loi: string[]; loiEn: string[] }): HaiThuTieng {
  return tai.loi.length
    ? { vi: ` Lưu ý: ${tai.loi.join(' · ')}`, en: ` Note: ${tai.loiEn.join(' · ')}` }
    : { vi: '', en: '' };
}

/**
 * Câu lỗi đọc công nợ để hiện trên trang: như cauLoiKho(e, macDinh); riêng câu
 * "quá nhiều dòng" của chính file này thì theo ngôn ngữ đang xem. Câu database
 * vẫn là tiếng Việt — BaoKho tra dichCau lúc hiện.
 */
export function cauLoiCongNo(e: unknown, macDinh: string, nn: NgonNguNB = 'vi'): string {
  const cau = cauLoiKho(e, macDinh);
  return cau === CAU.quaNhieuDong.vi ? CAU.quaNhieuDong[nn] : cau;
}

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
  // 0040: "đã trả" = tien_tra + bu_tru − hoan_tien (công thức còn nợ giữ nguyên).
  tien_tra: number;
  bu_tru: number;
  hoan_tien: number;
  so_phieu_hoa_don_gop: number;
  /** Còn nợ của các phiếu có hạn trả trong 7 ngày tới (kể cả hôm nay). */
  no_den_han_7_ngay: number;
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
  // 0040
  loai: 'mua' | 'no_dau';
  tien_tra: number;
  bu_tru: number;
  hoan_tien: number;
  /** Hóa đơn gộp đang chứa phiếu này (null = đối chiếu từng lần). */
  hoa_don_gop_id: string | null;
}

export interface ThanhToan {
  id: string;
  so_phieu: string;
  loai: 'thanh_toan' | 'giam_tru' | 'bu_tru' | 'hoan_tien';
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
  phan_bo: { phieu_nhap_id: string; so_phieu: string | null; so_tien: number }[];
}

export const TEN_HINH_THUC_NB: Record<string, HaiThuTieng> = {
  chuyen_khoan: { vi: 'Chuyển khoản', en: 'Bank transfer' },
  tien_mat: { vi: 'Tiền mặt', en: 'Cash' },
  khac: { vi: 'Khác', en: 'Other' },
};

const so = (v: unknown) => Number(v ?? 0);

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
// PostgREST trả tối đa một số dòng mỗi lần (Supabase mặc định 1000). Trước
// đây công nợ đọc .limit(500) theo hạn cũ nhất trước — quán có hơn 500 phiếu
// nhập mua thì phiếu MỚI NHẤT bị bỏ: tổng nợ, trang nhà cung cấp và file
// Excel thiếu mà không ai biết. Giờ đọc từng trang bằng .range() cho tới khi
// đủ số dòng database báo có (count), không bao giờ cắt cụt lặng lẽ.
const CO_TRANG = 1000;
const TOI_DA_TRANG = 500; // 500.000 dòng — vượt số này là có gì đó sai: báo lỗi chứ không cắt.

type Dong = Record<string, unknown>;
type DocTrang = (tu: number, den: number) => PromiseLike<{ data: unknown[] | null; error: unknown; count: number | null }>;

async function docHetTrang(trang: DocTrang): Promise<Dong[]> {
  const ra: Dong[] = [];
  for (let i = 0; i < TOI_DA_TRANG; i++) {
    const { data, error, count } = await trang(i * CO_TRANG, (i + 1) * CO_TRANG - 1);
    if (error) {
      // Có dòng bị xóa giữa hai lần đọc nên trang sau rỗng (PGRST103): đã đủ.
      if (i > 0 && (error as { code?: string }).code === 'PGRST103') return ra;
      throw error;
    }
    const ds = (data ?? []) as Dong[];
    ra.push(...ds);
    if (ds.length === 0 || (count !== null ? ra.length >= count : ds.length < CO_TRANG)) return ra;
  }
  // Trang hiện câu này qua cauLoiCongNo() — có bản tiếng Anh.
  throw new Error(CAU.quaNhieuDong.vi);
}

/** Chia mảng id thành từng phần — .in() với hàng nghìn id làm URL quá dài. */
function chiaPhan<T>(ds: T[], co: number): T[][] {
  const ra: T[][] = [];
  for (let i = 0; i < ds.length; i += co) ra.push(ds.slice(i, i + co));
  return ra;
}

/** Công nợ gom theo nhà cung cấp — view không giới hạn dòng, dùng cho các ô tổng. */
export async function docCongNoNcc(client: SupabaseClient, chiNhanhId: string, nccId?: string): Promise<CongNoNcc[]> {
  let q = client
    .from('kho_v_cong_no_ncc')
    .select('nha_cung_cap_id, ten_nha_cung_cap, so_phieu, so_phieu_con_no, so_phieu_chua_doi_chieu, tong_phai_tra, da_tra, giam_tru, con_no, no_qua_han, han_gan_nhat, tien_tra, bu_tru, hoan_tien, so_phieu_hoa_don_gop, no_den_han_7_ngay')
    .eq('chi_nhanh_id', chiNhanhId);
  if (nccId) q = q.eq('nha_cung_cap_id', nccId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => ({
    ...r, so_phieu: so(r.so_phieu), so_phieu_con_no: so(r.so_phieu_con_no),
    so_phieu_chua_doi_chieu: so(r.so_phieu_chua_doi_chieu),
    tong_phai_tra: so(r.tong_phai_tra), da_tra: so(r.da_tra), giam_tru: so(r.giam_tru),
    con_no: so(r.con_no), no_qua_han: so(r.no_qua_han),
    tien_tra: so(r.tien_tra), bu_tru: so(r.bu_tru), hoan_tien: so(r.hoan_tien),
    so_phieu_hoa_don_gop: so(r.so_phieu_hoa_don_gop), no_den_han_7_ngay: so(r.no_den_han_7_ngay),
  })) as CongNoNcc[];
}

export interface LocCongNo {
  nccId?: string;
  /** Chỉ phiếu quá hạn (còn nợ, hạn đã qua). */
  chiQuaHan?: boolean;
  /** Chỉ phiếu chưa đối chiếu hóa đơn. */
  chuaDoiChieu?: boolean;
  /** Còn nợ và hạn trả trong khoảng [tu, den] (YYYY-MM-DD) — "đến hạn trong 7 ngày". */
  hanTrong?: { tu: string; den: string };
  /** Chỉ phiếu còn việc: còn nợ (hoặc nhà cung cấp nợ lại) hoặc chưa đối chiếu. */
  conViec?: boolean;
  /** Chỉ phiếu thuộc một hóa đơn gộp (0040). */
  coHoaDonGop?: boolean;
}

function chuanHoaPhieu(r: Dong): CongNoPhieu {
  return {
    ...r,
    tien_hoa_don: r.tien_hoa_don === null || r.tien_hoa_don === undefined ? null : so(r.tien_hoa_don),
    tong_tien_phieu: so(r.tong_tien_phieu), phai_tra: so(r.phai_tra), da_tra: so(r.da_tra),
    giam_tru: so(r.giam_tru), con_no: so(r.con_no), so_ngay_qua_han: so(r.so_ngay_qua_han),
    tien_tra: so(r.tien_tra), bu_tru: so(r.bu_tru), hoan_tien: so(r.hoan_tien),
    hoa_don_gop_id: (r.hoa_don_gop_id as string | null | undefined) ?? null,
  } as CongNoPhieu;
}

/**
 * Công nợ từng phiếu. Không lọc gì thì đọc HẾT (file Excel); các trang làm
 * việc nên lọc (conViec, chiQuaHan...) để chỉ kéo về phiếu còn việc.
 */
export async function docCongNoPhieu(client: SupabaseClient, chiNhanhId: string, loc: LocCongNo = {}): Promise<CongNoPhieu[]> {
  const tao = () => {
    let q = client
      .from('kho_v_cong_no_phieu')
      .select('id, so_phieu, nha_cung_cap_id, ten_nha_cung_cap, ngay_nhap, so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_hoa_don, da_doi_chieu, ghi_chu_doi_chieu, tong_tien_phieu, phai_tra, da_tra, giam_tru, con_no, qua_han, so_ngay_qua_han, loai, tien_tra, bu_tru, hoan_tien, hoa_don_gop_id', { count: 'exact' })
      .eq('chi_nhanh_id', chiNhanhId);
    if (loc.nccId) q = q.eq('nha_cung_cap_id', loc.nccId);
    if (loc.chiQuaHan) q = q.eq('qua_han', true);
    if (loc.chuaDoiChieu) q = q.eq('da_doi_chieu', false);
    if (loc.hanTrong) q = q.gt('con_no', 0).gte('han_thanh_toan', loc.hanTrong.tu).lte('han_thanh_toan', loc.hanTrong.den);
    if (loc.conViec) q = q.or('con_no.neq.0,da_doi_chieu.eq.false');
    if (loc.coHoaDonGop) q = q.not('hoa_don_gop_id', 'is', null);
    // Thứ tự cố định tới tận id — đọc từng trang mới không sót, không trùng.
    return q.order('han_thanh_toan', { ascending: true, nullsFirst: false }).order('ngay_nhap').order('id');
  };
  return (await docHetTrang((tu, den) => tao().range(tu, den))).map(chuanHoaPhieu);
}

/**
 * Công nợ của một phiếu nhập (null nếu không phải phiếu mua đã duyệt, hoặc không xem được — RLS
 * lọc mất dòng, không báo lỗi). Đọc lỗi (mạng, hết giờ, database) thì NÉM: "không đọc được"
 * khác "không có phiếu".
 */
export async function docCongNoMotPhieu(client: SupabaseClient, id: string): Promise<CongNoPhieu | null> {
  if (!laUuid(id)) return null;
  const { data, error } = await client
    .from('kho_v_cong_no_phieu')
    .select('id, so_phieu, nha_cung_cap_id, ten_nha_cung_cap, ngay_nhap, so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_hoa_don, da_doi_chieu, ghi_chu_doi_chieu, tong_tien_phieu, phai_tra, da_tra, giam_tru, con_no, qua_han, so_ngay_qua_han, loai, tien_tra, bu_tru, hoan_tien, hoa_don_gop_id')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? chuanHoaPhieu(data) : null;
}

/**
 * Tiền hóa đơn lệch tổng phiếu bao nhiêu (dương = hóa đơn cao hơn phiếu).
 * 0 khi chưa đối chiếu hoặc khớp.
 */
export function tienLech(p: Pick<CongNoPhieu, 'da_doi_chieu' | 'tien_hoa_don' | 'tong_tien_phieu'>): number {
  return p.da_doi_chieu && p.tien_hoa_don !== null ? p.tien_hoa_don - p.tong_tien_phieu : 0;
}

/** 50000 → "+50.000 đ", -50000 → "−50.000 đ" (tiếng Anh: "+50,000 ₫"). */
export function dinhDangLech(lech: number, nn: NgonNguNB = 'vi'): string {
  return `${lech > 0 ? '+' : '−'}${TIEN[nn](Math.abs(lech))}`;
}

/**
 * Các khoản trả tiền / giảm trừ của một nhà cung cấp, mới nhất trước.
 * gioiHan = null: đọc hết (link "Xem thêm"); có số thì chỉ lấy chừng đó và
 * báo còn bao nhiêu khoản cũ hơn.
 */
export async function docThanhToan(
  client: SupabaseClient, chiNhanhId: string, nccId: string, gioiHan: number | null = 30,
): Promise<{ ds: ThanhToan[]; conNua: number }> {
  const tao = () => client
    .from('kho_thanh_toan')
    .select('id, so_phieu, loai, hinh_thuc, so_tien, ngay, ghi_chu, anh, phieu_xuat_id, trang_thai, ly_do_huy, nguoi_tao, created_at', { count: 'exact' })
    .eq('chi_nhanh_id', chiNhanhId).eq('nha_cung_cap_id', nccId)
    .order('ngay', { ascending: false }).order('created_at', { ascending: false }).order('id');
  let dong: Dong[];
  let conNua = 0;
  if (gioiHan === null) {
    dong = await docHetTrang((tu, den) => tao().range(tu, den));
  } else {
    const { data, error, count } = await tao().range(0, gioiHan - 1);
    if (error) throw error;
    dong = (data ?? []) as Dong[];
    conNua = Math.max((count ?? dong.length) - dong.length, 0);
  }

  // Khoản chia cho phiếu nào — kèm số phiếu, vì trang nhà cung cấp chỉ liệt
  // kê phiếu còn việc (phiếu đã trả đủ không có trong danh sách để tra số).
  const pb = new Map<string, ThanhToan['phan_bo']>();
  const phan = await Promise.all(chiaPhan(dong.map(t => String(t.id)), 100).map(ids => docHetTrang((tu, den) => client
    .from('kho_thanh_toan_phan_bo').select('id, thanh_toan_id, phieu_nhap_id, so_tien, kho_phieu_nhap(so_phieu)', { count: 'exact' })
    .in('thanh_toan_id', ids).order('id').range(tu, den))));
  for (const x of phan.flat()) {
    const id = String(x.thanh_toan_id);
    const pn = x.kho_phieu_nhap as { so_phieu?: string } | { so_phieu?: string }[] | null;
    const soPn = (Array.isArray(pn) ? pn[0]?.so_phieu : pn?.so_phieu) ?? null;
    pb.set(id, [...(pb.get(id) ?? []), { phieu_nhap_id: String(x.phieu_nhap_id), so_phieu: soPn, so_tien: so(x.so_tien) }]);
  }
  return {
    ds: dong.map(t => ({ ...t, so_tien: so(t.so_tien), anh: (t.anh as string[] | null) ?? [], phan_bo: pb.get(String(t.id)) ?? [] })) as ThanhToan[],
    conNua,
  };
}

export interface NccCongNo {
  id: string; ten: string; so_ngay_no: number; ngan_hang: string | null; so_tai_khoan: string | null;
  ma_so_thue: string | null; dia_chi: string | null; kieu_hoa_don: 'tung_lan' | 'gop';
}

/** Một nhà cung cấp. Không có / không xem được → null. Đọc lỗi (mạng, hết giờ) → NÉM. */
export async function docTenNcc(client: SupabaseClient, nccId: string): Promise<NccCongNo | null> {
  if (!laUuid(nccId)) return null;
  const { data, error } = await client.from('kho_nha_cung_cap').select('id, ten, so_ngay_no, ngan_hang, so_tai_khoan, ma_so_thue, dia_chi, kieu_hoa_don').eq('id', nccId).maybeSingle();
  if (error) throw error;
  return (data as NccCongNo | null) ?? null;
}

/**
 * Đầu các trang /cong-no/<ncc>: có NCC → { ncc }; không có → câu "Không tìm thấy…"; đọc lỗi →
 * câu "Không đọc được…" (trang chuyển về danh sách công nợ với câu đó). Đang nhận form
 * (dangGui) thì câu nói thêm "Chưa ghi gì" — form đó chưa được ghi. Không ném.
 */
export async function docTenNccTrang(
  client: SupabaseClient, nccId: string, o: { dangGui?: boolean } = {},
): Promise<{ ncc: NccCongNo; bao?: undefined } | { ncc: null; bao: KetQua }> {
  try {
    const ncc = await docTenNcc(client, nccId);
    return ncc ? { ncc } : { ncc: null, bao: kqHai(false, CAU.khongThayNcc) };
  } catch {
    return { ncc: null, bao: kqHai(false, o.dangGui ? CAU.docNccLoiGui : CAU.docNccLoi) };
  }
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  // Câu database trả về (tiếng Việt) — BaoKho tra dichCau lúc hiện.
  if (data === null || data === undefined) return kqHai(true, CAU.xong);
  return { ok: true, cau: String(data) };
}

/**
 * Đối chiếu hóa đơn: số, ngày, tiền trên hóa đơn, hạn trả; lệch tổng phiếu thì
 * BẮT BUỘC ghi lý do. Ô tiền để trống trên trang (không điền sẵn tổng phiếu)
 * để kế toán phải nhìn hóa đơn mà gõ — bấm "Lưu" không nhìn thì bị báo thiếu.
 * Lỗi thì trả lại giaTri để trang hiện lại đúng những gì vừa gõ.
 */
export async function doiChieuHoaDon(
  client: SupabaseClient, id: string, form: FormData,
): Promise<KetQua & { giaTri?: Record<string, string> }> {
  const s = (t: string) => String(form.get(t) ?? '').trim();
  const giaTri: Record<string, string> = {};
  for (const k of ['so_hoa_don', 'ngay_hoa_don', 'tien_hoa_don', 'han_thanh_toan', 'ghi_chu_doi_chieu']) giaTri[k] = s(k);
  const loi = (c: HaiThuTieng) => ({ ok: false, cau: c.vi, cauEn: c.en, giaTri });

  if (!giaTri.so_hoa_don) return loi({ vi: 'Ghi số hóa đơn.', en: 'Enter the invoice number.' });
  const tien = docTien(giaTri.tien_hoa_don);
  if (tien === null || Number.isNaN(tien)) {
    return loi({ vi: 'Ghi tổng tiền in trên hóa đơn (ví dụ 5.450.000).', en: 'Enter the total printed on the invoice (for example 5,450,000).' });
  }
  const ngayHd = docNgay(giaTri.ngay_hoa_don);
  const han = docNgay(giaTri.han_thanh_toan);
  if (ngayHd === undefined || han === undefined) return loi({ vi: 'Ngày không phải ngày có thật.', en: 'One of the dates is not a real date.' });

  // Tổng phiếu đọc lại từ database, không tin số gửi lên từ form. Đọc lỗi ≠ không có phiếu.
  let phieu: CongNoPhieu | null;
  try { phieu = await docCongNoMotPhieu(client, id); } catch { return loi(CAU.docPhieuLoi); }
  if (!phieu) {
    return loi({ vi: 'Không tìm thấy phiếu nhập này trong công nợ — tải lại trang.', en: 'This goods receipt is not in payables — reload the page.' });
  }
  const lech = tien - phieu.tong_tien_phieu;
  if (lech !== 0 && !giaTri.ghi_chu_doi_chieu) {
    return loi({
      vi: `Hóa đơn ${tien.toLocaleString('vi-VN')} đ lệch phiếu ${phieu.tong_tien_phieu.toLocaleString('vi-VN')} đ (${dinhDangLech(lech)}). Ghi lý do vào ô "Ghi chú" (ví dụ: NCC tính thêm phí giao hàng) rồi lưu lại.`,
      en: `The invoice (${TIEN.en(tien)}) differs from the receipt (${TIEN.en(phieu.tong_tien_phieu)}) by ${dinhDangLech(lech, 'en')}. Write the reason in "Note" (for example: the supplier added a delivery fee), then save again.`,
    });
  }

  const kq = await cauTraVe(client.rpc('kho_doi_chieu_hoa_don', {
    p_id: id,
    p_so_hoa_don: giaTri.so_hoa_don,
    p_ngay_hoa_don: ngayHd,
    p_tien_hoa_don: tien,
    p_han_thanh_toan: han,
    p_ghi_chu: giaTri.ghi_chu_doi_chieu || null,
  }));
  return kq.ok ? kq : { ...kq, giaTri };
}

export function huyThanhToan(client: SupabaseClient, id: string, lyDo: string): Promise<KetQua> {
  return cauTraVe(client.rpc('kho_huy_thanh_toan', { p_id: id, p_ly_do: lyDo }));
}

/** Trả hàng: dòng t{i}_lo (ẩn), t{i}_kg, t{i}_goi (t{i}_cai: lô món đếm theo cái); so_tien_giam_tru bỏ trống = tự tính. */
export async function traHangNcc(
  client: SupabaseClient, chiNhanhId: string, form: FormData, ctx: { phieuNhapId: string; viTriId: string },
): Promise<KetQua & { id?: string }> {
  const s = (t: string) => String(form.get(t) ?? '').trim();
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const dong: Record<string, unknown>[] = [];
  const soDong = docSoNguyen(form.get('so_dong'), 0, 200) ?? 0;
  for (let i = 0; i < (Number.isNaN(soDong) ? 0 : soDong); i++) {
    const d = docMotDongTra(s, i, bao);
    if (d) dong.push(d);
  }
  const tienChu = s('so_tien_giam_tru');
  const tien = tienChu ? docTien(tienChu) : null;
  if (tien !== null && Number.isNaN(tien)) {
    bao({ vi: 'Số tiền giảm trừ là số đồng (hoặc để trống để tự tính)', en: 'The deduction must be in VND (or leave it empty to have it calculated)' });
  }
  if (!dong.length && !loi.length) bao({ vi: 'Chưa ghi số trả ở lô nào.', en: 'No quantity entered for any lot.' });
  if (loi.length) return { ok: false, cau: loi.join(' · '), cauEn: loiEn.join(' · ') };
  const maGui = s('ma_gui');
  if (!laUuid(maGui)) return kqHai(false, CAU.formCu);

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
  if (!kq) return kqHai(false, CAU.khongChac);
  // Câu báo luôn nói rõ công nợ giảm bao nhiêu — trang chuyển về công nợ của
  // nhà cung cấp, kế toán đọc số này để so với biên bản.
  const giam = Number(kq.so_tien_giam_tru) || 0;
  const cauTien: HaiThuTieng = giam > 0
    ? { vi: `công nợ giảm ${giam.toLocaleString('vi-VN')} đ`, en: `payables down by ${TIEN.en(giam)}` }
    : { vi: 'không giảm công nợ (0 đ — nhà cung cấp đổi hàng mới)', en: 'payables unchanged (0 ₫ — the supplier replaces the goods)' };
  const cauAnh = cauAnhLoi(tai);
  const cau: HaiThuTieng = kq.da_co
    ? { vi: `Phiếu trả hàng ${kq.so_phieu} đã được ghi từ lần bấm trước: ${cauTien.vi}.`,
        en: `Return slip ${kq.so_phieu} was already saved on your earlier click: ${cauTien.en}.` }
    : { vi: `Đã ghi phiếu trả hàng ${kq.so_phieu}: ${cauTien.vi}.`, en: `Return slip ${kq.so_phieu} recorded: ${cauTien.en}.` };
  return { ...kqHai(true, { vi: cau.vi + cauAnh.vi, en: cau.en + cauAnh.en }), id: kq.phieu_xuat_id };
}

// -----------------------------------------------------------------------------
// NỢ ĐẦU KỲ (GĐ5e, migration 0035)
// -----------------------------------------------------------------------------
// Số tiền quán còn nợ từng nhà cung cấp lúc bắt đầu dùng phần mềm. Mỗi nhà
// cung cấp một phiếu ND- (kho_phieu_nhap loại no_dau): không hàng, không lô,
// không sổ kho — chỉ số tiền phải trả. Database tạo phiếu đã duyệt, đã đối
// chiếu (tien_hoa_don = số nợ), nên công nợ, thanh toán tự chia theo hạn,
// quá hạn đều tính như phiếu mua. Nhập ở /noi-bo/kho/cong-no/no-dau:
//   · lưới: mỗi nhà cung cấp đang dùng một dòng — ô Số tiền, Hạn trả, Số hóa
//     đơn, Ghi chú (n{i}_ncc ẩn, n{i}_tien, n{i}_han, n{i}_hd, n{i}_gc; so_dong);
//   · hoặc dán từ Excel (docDanNoDau) → điền vào lưới;
//   · "Xem trước" chỉ kiểm, "Ghi nợ đầu kỳ" gửi lại đúng các dòng đó kèm ma_gui.

/** Số phiếu nợ đầu kỳ bắt đầu bằng ND- (kho_sinh_so(…, 'ND')). View công nợ không có cột loại. */
export function laNoDau(p: { so_phieu: string | null | undefined }): boolean {
  return /^ND-/.test(p.so_phieu ?? '');
}

/** Nhãn loại của một dòng công nợ: "Nợ đầu kỳ" hay "Nhập mua" (tiếng Anh: "Opening balance" / "Purchase"). */
export function tenLoaiCongNo(p: { so_phieu: string | null | undefined }, nn: NgonNguNB = 'vi'): string {
  return nhanKho(TEN_LOAI_PHIEU_NHAP_NB, laNoDau(p) ? 'no_dau' : 'mua', nn);
}

/**
 * Link của số phiếu trong màn công nợ. Phiếu nợ đầu kỳ không có trang phiếu
 * nhập (không hàng; kho_doc_phieu_nhap_kg từ chối) → về trang công nợ của
 * nhà cung cấp, đúng dòng đó.
 */
export function linkPhieuCongNo(p: { id: string; so_phieu: string; nha_cung_cap_id: string }): string {
  return laNoDau(p) ? `/noi-bo/kho/cong-no/${p.nha_cung_cap_id}?mo=${p.id}#p-${p.id}` : `/noi-bo/kho/nhap/${p.id}`;
}

export interface NccNoDau {
  id: string;
  ten: string;
  ma_so_thue: string | null;
  so_ngay_no: number;
  dang_dung: boolean;
}

/** Nhà cung cấp (đang dùng trước) — cho lưới nợ đầu kỳ. */
export async function docNccNoDau(client: SupabaseClient): Promise<NccNoDau[]> {
  const { data, error } = await client
    .from('kho_nha_cung_cap')
    .select('id, ten, ma_so_thue, so_ngay_no, dang_dung')
    .order('dang_dung', { ascending: false }).order('ten');
  if (error) throw error;
  return (data ?? []).map(r => ({ ...r, so_ngay_no: so(r.so_ngay_no) })) as NccNoDau[];
}

/** Các phiếu nợ đầu kỳ còn hiệu lực của chi nhánh (kèm đã trả, còn nợ). */
export async function docNoDauKy(client: SupabaseClient, chiNhanhId: string): Promise<CongNoPhieu[]> {
  const ds = await docHetTrang((tu, den) => client
    .from('kho_v_cong_no_phieu')
    .select('id, so_phieu, nha_cung_cap_id, ten_nha_cung_cap, ngay_nhap, so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_hoa_don, da_doi_chieu, ghi_chu_doi_chieu, tong_tien_phieu, phai_tra, da_tra, giam_tru, con_no, qua_han, so_ngay_qua_han, loai, tien_tra, bu_tru, hoan_tien, hoa_don_gop_id', { count: 'exact' })
    .eq('chi_nhanh_id', chiNhanhId).like('so_phieu', 'ND-%')
    .order('ten_nha_cung_cap').order('id')
    .range(tu, den));
  return ds.map(chuanHoaPhieu);
}

/** Chữ gõ trong một dòng lưới (giữ nguyên để hiện lại khi có lỗi). */
export interface ONoDau { tien: string; han: string; hd: string; gc: string }
export interface DongNoDau {
  nha_cung_cap_id: string;
  ten: string;
  so_tien: number;
  /** null = để database tính: hôm nay + số ngày được nợ của nhà cung cấp. */
  han_thanh_toan: string | null;
  so_hoa_don: string | null;
  ghi_chu: string | null;
}
/** loiEn: cùng các lỗi ở tiếng Anh, cùng thứ tự với loi. */
export interface XemTruocNoDau { dong: DongNoDau[]; loi: string[]; loiEn: string[]; tong: number }

export const TOI_DA_DONG_NO_DAU = 300; // như kho_ghi_no_dau_ky

/** Đọc lưới: nhà cung cấp id → chữ đã gõ. Dòng không gõ gì thì bỏ. */
export function docFormNoDau(form: { get(ten: string): unknown }): Record<string, ONoDau> {
  const s = (t: string) => String(form.get(t) ?? '').trim();
  const ra: Record<string, ONoDau> = {};
  const soDong = docSoNguyen(form.get('so_dong'), 0, 2000) ?? 0;
  for (let i = 0; i < (Number.isNaN(soDong) ? 0 : soDong); i++) {
    const id = s(`n${i}_ncc`);
    const o: ONoDau = { tien: s(`n${i}_tien`), han: s(`n${i}_han`), hd: s(`n${i}_hd`), gc: s(`n${i}_gc`) };
    if (!laUuid(id) || (!o.tien && !o.han && !o.hd && !o.gc)) continue;
    ra[id] = o;
  }
  return ra;
}

/**
 * Kiểm các dòng trước khi ghi (hàm thuần — trang gọi lúc "Xem trước" và gọi
 * lại đúng hàm này lúc "Ghi"). daGhi: nhà cung cấp → số phiếu ND- còn hiệu
 * lực (database cũng chặn, báo trước cho dễ hiểu).
 */
export function xemTruocNoDau(
  ncc: NccNoDau[], giaTri: Record<string, ONoDau>, daGhi: Map<string, string> = new Map(),
): XemTruocNoDau {
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const dong: DongNoDau[] = [];
  const theoId = new Map(ncc.map(n => [n.id, n]));
  // Theo thứ tự của danh sách nhà cung cấp (như lưới), rồi id lạ ở cuối.
  const ids = [...ncc.map(n => n.id).filter(id => id in giaTri), ...Object.keys(giaTri).filter(id => !theoId.has(id))];
  for (const id of ids) {
    const o = giaTri[id];
    const n = theoId.get(id);
    if (!n) {
      bao({ vi: 'Có dòng của nhà cung cấp không còn trong danh mục — tải lại trang.', en: 'A line belongs to a supplier that is no longer in the catalog — reload the page.' });
      continue;
    }
    const ten = n.ten;
    const soPhieu = daGhi.get(id);
    if (soPhieu) {
      bao({ vi: `${ten}: đã ghi nợ đầu kỳ ở phiếu ${soPhieu} — hủy phiếu đó trước nếu muốn ghi lại.`,
            en: `${ten}: opening balance already recorded in ${soPhieu} — cancel that first if you want to record it again.` });
      continue;
    }
    const tien = docTien(o.tien);
    if (tien === null) { bao({ vi: `${ten}: chưa ghi số tiền nợ.`, en: `${ten}: no amount owed entered.` }); continue; }
    if (Number.isNaN(tien) || tien <= 0) {
      bao({ vi: `${ten}: số tiền "${o.tien}" phải là số đồng lớn hơn 0 (ví dụ 12.500.000).`,
            en: `${ten}: the amount "${o.tien}" must be in VND and more than 0 (for example 12,500,000).` });
      continue;
    }
    const han = docNgay(o.han);
    if (han === undefined) { bao({ vi: `${ten}: hạn trả "${o.han}" không phải ngày có thật.`, en: `${ten}: the due date "${o.han}" is not a real date.` }); continue; }
    if (o.hd.length > 60) { bao({ vi: `${ten}: số hóa đơn tối đa 60 ký tự.`, en: `${ten}: the invoice number can be at most 60 characters.` }); continue; }
    if (o.gc.length > 500) { bao({ vi: `${ten}: ghi chú tối đa 500 ký tự.`, en: `${ten}: the note can be at most 500 characters.` }); continue; }
    dong.push({ nha_cung_cap_id: id, ten, so_tien: tien, han_thanh_toan: han, so_hoa_don: o.hd || null, ghi_chu: o.gc || null });
  }
  if (dong.length > TOI_DA_DONG_NO_DAU) {
    bao({ vi: `Mỗi lần ghi tối đa ${TOI_DA_DONG_NO_DAU} nhà cung cấp — chia làm nhiều lần.`,
          en: `You can record at most ${TOI_DA_DONG_NO_DAU} suppliers at a time — split them into several goes.` });
  }
  return { dong, loi, loiEn, tong: dong.reduce((a, d) => a + d.so_tien, 0) };
}

/** Dòng gửi kho_ghi_no_dau_ky: chỉ đặt khóa có giá trị (hàm database từ chối khóa lạ). */
export function dongGuiNoDau(ds: DongNoDau[]): Record<string, unknown>[] {
  return ds.map(d => {
    const p: Record<string, unknown> = { nha_cung_cap_id: d.nha_cung_cap_id, so_tien: d.so_tien };
    if (d.han_thanh_toan) p.han_thanh_toan = d.han_thanh_toan;
    if (d.so_hoa_don) p.so_hoa_don = d.so_hoa_don;
    if (d.ghi_chu) p.ghi_chu = d.ghi_chu;
    return p;
  });
}

// --- Dán từ Excel -------------------------------------------------------------
type CotNoDau = 'ncc' | 'tien' | 'han' | 'hd' | 'gc';
const COT_NO_DAU: readonly CotNoDau[] = ['ncc', 'tien', 'han', 'hd', 'gc'];
const TIEU_DE_NO_DAU: Record<string, CotNoDau> = Object.fromEntries(([
  ['ncc', ['nha cung cap', 'ncc', 'ten', 'ten nha cung cap', 'ten ncc', 'ma so thue', 'mst']],
  ['tien', ['so tien', 'tien', 'so tien no', 'tien no', 'no', 'con no', 'cong no', 'so du', 'du no']],
  ['han', ['han', 'han tra', 'han thanh toan', 'ngay tra', 'ngay den han', 'den han']],
  ['hd', ['so hoa don', 'hoa don', 'so hd', 'hd']],
  ['gc', ['ghi chu', 'dien giai', 'noi dung']],
] as [CotNoDau, string[]][]).flatMap(([cot, ds]) => ds.map(t => [t, cot])));

/** Chữ so khớp: bỏ dấu, chữ thường, gọn khoảng trắng. */
export function chuanTenNcc(ten: string): string {
  return boDau(ten).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Ngày trong Excel: 31/10/2026, 31-10-2026, 31.10.2026 hoặc 2026-10-31 → YYYY-MM-DD. Trống → null, sai → undefined. */
export function docNgayDan(v: string): string | null | undefined {
  const s = v.trim();
  if (!s) return null;
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  return docNgay(m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : s);
}

/**
 * Đọc ô dán: cột Nhà cung cấp (tên hoặc mã số thuế), Số tiền, Hạn trả, Số
 * hóa đơn, Ghi chú — cách nhau bằng Tab (dán từ Excel) hoặc dấu ;. Có dòng
 * tiêu đề thì cột xếp thứ tự nào cũng được. Khớp nhà cung cấp theo mã số thuế,
 * rồi theo tên không dấu (đang dùng trước). Trả chữ cho lưới — kiểm số tiền,
 * hạn ở xemTruocNoDau như khi gõ tay.
 */
export function docDanNoDau(
  noiDung: string, ncc: NccNoDau[],
): { giaTri: Record<string, ONoDau>; loi: string[]; loiEn: string[]; boQua: string[] } {
  const giaTri: Record<string, ONoDau> = {};
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const boQua: string[] = [];
  // Không tách bằng dấu phẩy: số tiền "12,500,000" có dấu phẩy.
  const ngan = noiDung.includes('\t') ? '\t' : ';';
  const boNgoac = (o: string) => {
    const t = o.trim();
    return t.length >= 2 && t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1).replace(/""/g, '"').trim() : t;
  };
  const hang = noiDung.split(/\r?\n/)
    .map((raw, i) => ({ so: i + 1, o: raw.split(ngan).map(boNgoac) }))
    .filter(h => h.o.some(x => x !== ''));
  if (hang.length === 0) return { giaTri, loi, loiEn, boQua };

  let cot: (CotNoDau | undefined)[] = [...COT_NO_DAU];
  const dau = hang[0].o.map(o => TIEU_DE_NO_DAU[chuanTenNcc(o).replace(/( (d|dong|vnd))+$/, '')]);
  const hieu = dau.filter((c): c is CotNoDau => !!c);
  if (hieu.length >= 2 || (hieu.includes('ncc') && docTien(hang[0].o[1] ?? '') === null)) {
    hang[0].o.forEach((o, i) => { if (o && !dau[i]) boQua.push(o); });
    for (const c of COT_NO_DAU) {
      if (dau.filter(x => x === c).length > 1) {
        bao({ vi: 'Dòng tiêu đề: có cột bị lặp — xóa bớt một cột.', en: 'Header row: a column appears twice — delete one of them.' });
      }
    }
    if (!hieu.includes('ncc') || !hieu.includes('tien')) {
      // Tiêu đề máy hiểu là chữ Việt (có dấu hay không) — bản tiếng Anh ghi dạng không dấu.
      bao({ vi: 'Dòng tiêu đề cần có cột Nhà cung cấp và cột Số tiền.', en: 'The header row needs a supplier column (Nha cung cap) and an amount column (So tien).' });
    }
    if (loi.length) return { giaTri, loi, loiEn, boQua };
    cot = dau;
    hang.shift();
  }

  const dangDung = ncc.filter(n => n.dang_dung);
  const theoMst = new Map<string, NccNoDau[]>();
  for (const n of dangDung) if (n.ma_so_thue) theoMst.set(n.ma_so_thue.replace(/\s/g, ''), [...(theoMst.get(n.ma_so_thue.replace(/\s/g, '')) ?? []), n]);
  const theoTen = new Map<string, NccNoDau[]>();
  for (const n of dangDung) theoTen.set(chuanTenNcc(n.ten), [...(theoTen.get(chuanTenNcc(n.ten)) ?? []), n]);
  const daDan = new Map<string, number>();

  for (const h of hang) {
    const o: Partial<Record<CotNoDau, string>> = {};
    cot.forEach((c, i) => { if (c) o[c] = h.o[i] ?? ''; });
    const chuNcc = (o.ncc ?? '').trim();
    if (!chuNcc) { bao({ vi: `Dòng ${h.so}: thiếu tên nhà cung cấp.`, en: `Line ${h.so}: supplier name missing.` }); continue; }
    const mst = chuNcc.replace(/\s/g, '');
    const khop = /^\d{10}(-\d{3})?$/.test(mst) ? theoMst.get(mst) ?? [] : theoTen.get(chuanTenNcc(chuNcc)) ?? [];
    if (khop.length === 0) {
      bao({ vi: `Dòng ${h.so}: không thấy nhà cung cấp "${chuNcc}" — thêm ở Cài đặt › Nhà cung cấp trước, hoặc sửa tên cho giống.`,
            en: `Line ${h.so}: supplier "${chuNcc}" not found — add it in Setup › Suppliers first, or change the name to match.` });
      continue;
    }
    if (khop.length > 1) {
      bao({ vi: `Dòng ${h.so}: có ${khop.length} nhà cung cấp tên "${chuNcc}" — ghi mã số thuế thay cho tên.`,
            en: `Line ${h.so}: ${khop.length} suppliers are named "${chuNcc}" — use the tax code instead of the name.` });
      continue;
    }
    const n = khop[0];
    const truoc = daDan.get(n.id);
    if (truoc !== undefined) {
      bao({ vi: `Dòng ${h.so}: ${n.ten} đã có ở dòng ${truoc} — gộp thành một dòng.`, en: `Line ${h.so}: ${n.ten} is already on line ${truoc} — merge them into one line.` });
      continue;
    }
    const han = docNgayDan(o.han ?? '');
    if (han === undefined) {
      bao({ vi: `Dòng ${h.so} (${n.ten}): hạn trả "${o.han}" không hiểu — ghi dạng 31/10/2026.`,
            en: `Line ${h.so} (${n.ten}): due date "${o.han}" not understood — write it like 31/10/2026.` });
      continue;
    }
    daDan.set(n.id, h.so);
    giaTri[n.id] = { tien: (o.tien ?? '').trim(), han: han ?? '', hd: (o.hd ?? '').trim(), gc: (o.gc ?? '').trim() };
  }
  return { giaTri, loi, loiEn, boQua };
}

/** Ghi nợ đầu kỳ: một phiếu ND- mỗi nhà cung cấp. Cùng ma_gui (bấm hai lần, F5) → trả lại đúng các phiếu cũ. */
export async function ghiNoDauKy(
  client: SupabaseClient, chiNhanhId: string, maGui: string, dong: DongNoDau[],
): Promise<KetQua> {
  if (!laUuid(maGui)) return kqHai(false, CAU.formCu);
  if (dong.length === 0) {
    return kqHai(false, { vi: 'Chưa có dòng nợ nào — ghi số tiền ở ít nhất một nhà cung cấp.', en: 'No balance lines yet — enter an amount for at least one supplier.' });
  }
  const { data, error } = await client.rpc('kho_ghi_no_dau_ky', {
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_dong: dongGuiNoDau(dong),
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (data ?? {}) as { da_co?: boolean; tong_tien?: number; phieu?: { so_phieu: string }[] };
  const soPhieu = kq.phieu?.length ?? 0;
  const tien = so(kq.tong_tien).toLocaleString('vi-VN');
  const tienEn = TIEN.en(so(kq.tong_tien));
  const nccEn = `${soPhieu} ${soPhieu === 1 ? 'supplier' : 'suppliers'}`;
  return kqHai(true, kq.da_co
    ? { vi: `Nợ đầu kỳ đã được ghi từ lần bấm trước: ${soPhieu} nhà cung cấp, ${tien} đ.`,
        en: `Opening balances were already saved on your earlier click: ${nccEn}, ${tienEn}.` }
    : { vi: `Đã ghi nợ đầu kỳ ${soPhieu} nhà cung cấp, tổng ${tien} đ. Trả tiền ở trang công nợ của từng nhà cung cấp như phiếu nhập.`,
        en: `Opening balances recorded for ${nccEn}, total ${tienEn}. Pay them on each supplier's payables page, like goods receipts.` });
}

/** Hủy một phiếu nợ đầu kỳ (ghi nhầm). Bắt buộc lý do; đã trả tiền / giảm trừ thì database chặn. */
export function huyNoDauKy(client: SupabaseClient, id: string, lyDo: string): Promise<KetQua> {
  if (!laUuid(id)) return Promise.resolve(kqHai(false, CAU.phieuKhongHopLe));
  if (!lyDo.trim()) {
    return Promise.resolve(kqHai(false, { vi: 'Ghi lý do hủy (ví dụ: ghi nhầm số tiền).', en: 'Enter a reason for cancelling (for example: wrong amount entered).' }));
  }
  return cauTraVe(client.rpc('kho_huy_phieu_nhap', { p_id: id, p_ly_do: lyDo.trim() }));
}

/** Bước "Nhà cung cấp & nợ đầu kỳ" của màn Thiết lập: đã ghi / đã bấm "Không có nợ đầu kỳ". */
export interface BuocNoDau { xong: boolean; bo_qua: boolean }

export async function docBuocNoDau(client: SupabaseClient, chiNhanhId: string): Promise<BuocNoDau | null> {
  const { data, error } = await client.rpc('kho_tien_do_thiet_lap', { p_chi_nhanh_id: chiNhanhId });
  if (error || !data) return null;
  const b = (data as Record<string, { xong?: boolean; bo_qua?: boolean } | undefined>).ncc_no_dau;
  return b ? { xong: !!b.xong, bo_qua: !!b.bo_qua } : null;
}

/** Nút "Không có nợ đầu kỳ" (bo_qua = true) và "Bỏ đánh dấu" (false) — kế toán bấm được (0035). */
export async function danhDauKhongNoDau(client: SupabaseClient, chiNhanhId: string, boQua: boolean): Promise<KetQua> {
  const { error } = await client.rpc('kho_danh_dau_thiet_lap', {
    p_chi_nhanh_id: chiNhanhId, p_buoc: 'ncc_no_dau', p_bo_qua: boQua,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, boQua
    ? { vi: 'Đã đánh dấu: không có nợ đầu kỳ. Bước này trong Thiết lập đã xong.', en: 'Marked: no opening balances. This Setup step is done.' }
    : { vi: 'Đã bỏ đánh dấu "không có nợ đầu kỳ".', en: 'Removed the "no opening balances" mark.' });
}

// =============================================================================
// GĐ8b (migration 0040) — CÔNG NỢ KIỂU iPOS · HÓA ĐƠN GỘP · BÙ TRỪ / HOÀN TIỀN
//                         · TRẢ HÀNG HAI BƯỚC · CÔNG NỢ THEO KỲ · MISA
// =============================================================================
// Mọi con số vẫn do database tính: view công nợ (0040 thêm cột cuối), hàm xem
// trước cách chia (kho_xem_truoc_thanh_toan), sổ theo kỳ (kho_cong_no_theo_ky).
// Ở đây chỉ đọc form, gọi hàm và vài hàm thuần để trang hiện số / lọc / chia trang.

export const TEN_LOAI_KHOAN_NB: Record<string, HaiThuTieng> = {
  thanh_toan: { vi: 'Trả tiền', en: 'Payment' },
  giam_tru: { vi: 'Giảm trừ', en: 'Deduction' },
  bu_tru: { vi: 'Bù trừ', en: 'Offset' },
  hoan_tien: { vi: 'NCC hoàn tiền', en: 'Supplier refund' },
};

const GIAM_TRU_TRA_HANG: HaiThuTieng = { vi: 'Giảm trừ do trả hàng', en: 'Deduction for returned goods' };

/** Tên một khoản trong lịch sử: "Trả tiền (Chuyển khoản)", "Giảm trừ do trả hàng", "Bù trừ"… */
export function tenKhoan(t: { loai: string; hinh_thuc: string | null; phieu_xuat_id?: string | null }, nn: NgonNguNB = 'vi'): string {
  const hinhThuc = () => TEN_HINH_THUC_NB[t.hinh_thuc ?? 'khac']?.[nn] ?? TEN_HINH_THUC_NB.khac[nn];
  if (t.loai === 'thanh_toan') return `${TEN_LOAI_KHOAN_NB.thanh_toan[nn]} (${hinhThuc()})`;
  if (t.loai === 'hoan_tien') return `${TEN_LOAI_KHOAN_NB.hoan_tien[nn]} (${hinhThuc()})`;
  if (t.loai === 'giam_tru') return t.phieu_xuat_id ? GIAM_TRU_TRA_HANG[nn] : TEN_LOAI_KHOAN_NB.giam_tru[nn];
  return TEN_LOAI_KHOAN_NB[t.loai]?.[nn] ?? t.loai;
}

// --- Chọn "loại" trên màn Trả tiền ------------------------------------------
export type KieuTra = 'chuyen_khoan' | 'tien_mat' | 'bu_tru' | 'hoan_tien' | 'giam_tru';
export const KIEU_TRA_NB: readonly { ma: KieuTra; ten: HaiThuTieng; moTa: HaiThuTieng }[] = [
  { ma: 'chuyen_khoan', ten: { vi: 'Chuyển khoản', en: 'Bank transfer' },
    moTa: { vi: 'Quán chuyển tiền cho nhà cung cấp', en: 'The restaurant transfers money to the supplier' } },
  { ma: 'tien_mat', ten: { vi: 'Tiền mặt', en: 'Cash' },
    moTa: { vi: 'Quán trả tiền mặt', en: 'The restaurant pays in cash' } },
  { ma: 'bu_tru', ten: { vi: 'Bù trừ', en: 'Offset' },
    moTa: { vi: 'Trừ vào khoản NCC đang nợ quán (tiền cọc, vỏ thùng…) — không chuyển tiền',
            en: 'Take it off money the supplier owes the restaurant (deposit, crates…) — no money changes hands' } },
  { ma: 'hoan_tien', ten: { vi: 'NCC hoàn tiền', en: 'Supplier refund' },
    moTa: { vi: 'Nhà cung cấp trả lại tiền cho quán (quán đã trả thừa, trả hàng sau khi trả đủ)',
            en: 'The supplier pays money back to the restaurant (overpaid, or goods returned after paying in full)' } },
  { ma: 'giam_tru', ten: { vi: 'Giảm trừ', en: 'Deduction' },
    moTa: { vi: 'Chiết khấu, hàng thiếu — NCC bớt tiền', en: 'Discount, short delivery — the supplier takes money off' } },
];
export const KIEU_TRA: readonly { ma: KieuTra; ten: string; moTa: string }[] =
  KIEU_TRA_NB.map(x => ({ ma: x.ma, ten: x.ten.vi, moTa: x.moTa.vi }));

/** Kiểu trên màn → loai + hinh_thuc của kho_ghi_thanh_toan_v2. null = kiểu lạ. */
export function loaiTuKieu(kieu: string, hinhThucHoan?: string | null): { loai: string; hinh_thuc: string | null } | null {
  switch (kieu) {
    case 'chuyen_khoan': case 'tien_mat': return { loai: 'thanh_toan', hinh_thuc: kieu };
    case 'bu_tru': return { loai: 'bu_tru', hinh_thuc: null };
    case 'giam_tru': return { loai: 'giam_tru', hinh_thuc: null };
    case 'hoan_tien': return { loai: 'hoan_tien', hinh_thuc: hinhThucHoan === 'tien_mat' ? 'tien_mat' : 'chuyen_khoan' };
    default: return null;
  }
}

export interface ChiaThanhToan {
  phieu_nhap_id: string;
  so_phieu: string;
  ngay_nhap: string;
  han_thanh_toan: string | null;
  /** Phần phiếu nhận được tối đa (còn nợ; với hoàn tiền là số NCC nợ lại). */
  con_lai: number;
  /** Phần của khoản này rơi vào phiếu (0 = tiền đã hết trước khi tới). */
  so_tien: number;
}

/**
 * Xem trước cách một khoản được chia vào các phiếu — đúng thứ tự database sẽ
 * chia (hạn sớm nhất trước; hoàn tiền: phiếu âm, ngày nhập cũ trước).
 * soTien null = "Trả đủ": mỗi phiếu nhận đúng số còn nợ.
 */
export async function xemTruocThanhToan(
  client: SupabaseClient, chiNhanhId: string, nccId: string, loai: string, soTien: number | null,
): Promise<{ dong: ChiaThanhToan[]; tongChia: number; tongConLai: number }> {
  const { data, error } = await client.rpc('kho_xem_truoc_thanh_toan', {
    p_chi_nhanh_id: chiNhanhId,
    p_nha_cung_cap_id: nccId,
    p_loai: loai,
    p_so_tien: soTien,
  });
  if (error) throw error;
  const dong = ((data ?? []) as Record<string, unknown>[]).map(r => ({
    phieu_nhap_id: String(r.phieu_nhap_id), so_phieu: String(r.so_phieu ?? ''), ngay_nhap: String(r.ngay_nhap ?? ''),
    han_thanh_toan: (r.han_thanh_toan as string | null) ?? null, con_lai: so(r.con_lai), so_tien: so(r.so_tien),
  }));
  return {
    dong,
    tongChia: dong.reduce((a, d) => a + d.so_tien, 0),
    tongConLai: dong.reduce((a, d) => a + d.con_lai, 0),
  };
}

export interface FormTraTien {
  kieu: KieuTra | '';
  loai: string | null;
  hinhThuc: string | null;
  /** null = chưa gõ (hoặc bấm "Trả đủ"). */
  soTien: number | null;
  ngay: string | null;
  ghiChu: string;
  /** Rỗng = để database tự chia (người dùng không sửa phần chia gợi ý). */
  phanBo: { phieu_nhap_id: string; so_tien: number }[];
  loi: string[];
  /** Cùng các lỗi ở tiếng Anh, cùng thứ tự với loi. */
  loiEn: string[];
  giaTri: Record<string, string>;
}

/**
 * Form màn Trả tiền (thuần). Bảng chia: pb{i}_phieu (ẩn), pb{i}_tien (sửa được),
 * pb{i}_goi_y (ẩn — số database gợi ý lúc xem trước). Không ô nào khác gợi ý
 * thì phanBo = [] để database tự chia lại lúc ghi (đúng như lúc xem trước).
 * `ghi` = kiểm đủ để ghi (ngày, ghi chú bù trừ); không thì chỉ kiểm để xem trước.
 */
export function docFormTraTien(form: { get(ten: string): unknown }, ghi: boolean): FormTraTien {
  const s = (t: string) => String(form.get(t) ?? '').trim();
  const giaTri: Record<string, string> = {};
  for (const k of ['kieu', 'so_tien', 'ngay', 'ghi_chu', 'hinh_thuc_hoan']) giaTri[k] = s(k);
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const kieu = (KIEU_TRA.some(x => x.ma === giaTri.kieu) ? giaTri.kieu : '') as KieuTra | '';
  const lh = kieu ? loaiTuKieu(kieu, giaTri.hinh_thuc_hoan) : null;
  if (!lh) {
    bao({ vi: 'Chọn cách trả: chuyển khoản, tiền mặt, bù trừ, NCC hoàn tiền hoặc giảm trừ',
          en: 'Choose how to pay: bank transfer, cash, offset, supplier refund or deduction' });
  }
  let soTien = docTien(giaTri.so_tien);
  if (soTien !== null && (Number.isNaN(soTien) || soTien <= 0)) {
    bao({ vi: 'Số tiền là số đồng lớn hơn 0 (ví dụ 5.450.000)', en: 'The amount must be in VND and more than 0 (for example 5,450,000)' });
    soTien = null;
  }
  if (ghi && soTien === null && !loi.length) bao({ vi: 'Ghi số tiền (hoặc bấm "Trả đủ")', en: 'Enter the amount (or press "Pay in full")' });
  const ngay = docNgay(giaTri.ngay);
  if (ngay === undefined) bao({ vi: 'Ngày không phải ngày có thật', en: 'The date is not a real date' });
  if (ghi && lh?.loai === 'bu_tru' && !giaTri.ghi_chu) {
    bao({ vi: 'Bù trừ: ghi rõ khoản nhà cung cấp nợ lại quán (ví dụ tiền cọc, vỏ thùng)',
          en: 'Offset: say what the supplier owes the restaurant (for example a deposit, crates)' });
  }

  const phanBo: { phieu_nhap_id: string; so_tien: number }[] = [];
  let khacGoiY = false;
  const soPb = docSoNguyen(form.get('so_pb'), 0, 500) ?? 0;
  for (let i = 0; i < (Number.isNaN(soPb) ? 0 : soPb); i++) {
    const id = s(`pb${i}_phieu`);
    const chu = s(`pb${i}_tien`);
    giaTri[`pb${i}_tien`] = chu;
    const goiY = docTien(s(`pb${i}_goi_y`)) ?? 0;
    const t = chu ? docTien(chu) : 0;
    if (t === null || Number.isNaN(t) || t < 0 || !laUuid(id)) {
      bao({ vi: `Số tiền cho phiếu thứ ${i + 1} chưa đúng`, en: `The amount for receipt no. ${i + 1} is not valid` });
      continue;
    }
    if (t !== (Number.isNaN(goiY) ? 0 : goiY)) khacGoiY = true;
    if (t > 0) phanBo.push({ phieu_nhap_id: id, so_tien: t });
  }
  if (!khacGoiY) phanBo.length = 0;
  else if (soTien !== null) {
    const tong = phanBo.reduce((a, b) => a + b.so_tien, 0);
    if (tong !== soTien) {
      bao({
        vi: `Tổng tiền chia cho các phiếu (${tong.toLocaleString('vi-VN')} đ) phải bằng số tiền (${soTien.toLocaleString('vi-VN')} đ) — hoặc bấm "Xem trước" để chia lại tự động`,
        en: `The amounts split across the receipts (${TIEN.en(tong)}) must add up to the amount (${TIEN.en(soTien)}) — or press "Preview the split" to split it again automatically`,
      });
    }
  }
  return {
    kieu, loai: lh?.loai ?? null, hinhThuc: lh?.hinh_thuc ?? null, soTien,
    ngay: ngay ?? null, ghiChu: giaTri.ghi_chu, phanBo, loi, loiEn, giaTri,
  };
}

/** Ghi một khoản (4 loại) qua kho_ghi_thanh_toan_v2. Ảnh ủy nhiệm chi tải vào thư mục thanh_toan. */
export async function ghiThanhToanV2(
  client: SupabaseClient, chiNhanhId: string, nccId: string, form: FormData,
): Promise<KetQua & { giaTri?: Record<string, string> }> {
  const doc = docFormTraTien(form, true);
  if (doc.loi.length) return { ok: false, cau: doc.loi.join(' · '), cauEn: doc.loiEn.join(' · '), giaTri: doc.giaTri };
  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) return { ...kqHai(false, CAU.formCu), giaTri: doc.giaTri };

  const tai = await taiAnh(client, chiNhanhId, 'thanh_toan', maGui, layTepAnh(form));
  const { data, error } = await client.rpc('kho_ghi_thanh_toan_v2', {
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_nha_cung_cap_id: nccId,
    p_loai: doc.loai,
    p_hinh_thuc: doc.hinhThuc,
    p_so_tien: doc.soTien,
    p_ngay: doc.ngay ?? homNayVn(),
    p_ghi_chu: doc.ghiChu || null,
    p_anh: tai.duongDan,
    p_phan_bo: doc.phanBo,
  });
  if (error) return { ok: false, cau: cauLoiKho(error), giaTri: doc.giaTri };
  const kq = (Array.isArray(data) ? data[0] : data) as { so_phieu: string; da_co: boolean } | undefined;
  const cauAnh = cauAnhLoi(tai);
  const ten = TEN_LOAI_KHOAN_NB[doc.loai ?? ''] ?? { vi: 'khoản', en: 'entry' };
  const cau: HaiThuTieng = kq?.da_co
    ? { vi: `Khoản ${kq.so_phieu} đã được ghi từ lần bấm trước.`, en: `Entry ${kq.so_phieu} was already saved on your earlier click.` }
    : { vi: `Đã ghi ${kq?.so_phieu ?? ''} (${ten.vi.toLowerCase()}): ${(doc.soTien ?? 0).toLocaleString('vi-VN')} đ.`,
        en: `Recorded ${kq?.so_phieu ?? ''} (${ten.en.toLowerCase()}): ${TIEN.en(doc.soTien ?? 0)}.` };
  return kqHai(true, { vi: cau.vi + cauAnh.vi, en: cau.en + cauAnh.en });
}

// --- Công thức trên đầu trang Công nợ ----------------------------------------
export interface CongThucCongNo { dauKy: number; mua: number; tra: number; giamTru: number; conPhaiTra: number }

/**
 * "Đầu kỳ + Mua − Trả − Giảm trừ = Còn phải trả" cho cả chi nhánh. Đầu kỳ =
 * phiếu nợ đầu kỳ (ND-); Trả = tiền trả + bù trừ − NCC hoàn tiền (cột da_tra
 * của view). Luôn khớp: còn phải trả = tổng còn nợ của view.
 */
export function congThucCongNo(ncc: Pick<CongNoNcc, 'tong_phai_tra' | 'da_tra' | 'giam_tru' | 'con_no'>[],
  noDau: Pick<CongNoPhieu, 'phai_tra'>[]): CongThucCongNo {
  const dauKy = noDau.reduce((a, p) => a + p.phai_tra, 0);
  const tongPhaiTra = ncc.reduce((a, n) => a + n.tong_phai_tra, 0);
  return {
    dauKy,
    mua: tongPhaiTra - dauKy,
    tra: ncc.reduce((a, n) => a + n.da_tra, 0),
    giamTru: ncc.reduce((a, n) => a + n.giam_tru, 0),
    conPhaiTra: ncc.reduce((a, n) => a + n.con_no, 0),
  };
}

// --- Thẻ "Theo NCC": chip lọc, tìm, chia trang trong bộ nhớ ------------------
export const CHIP_CONG_NO_NB = {
  qua_han: { vi: 'Quá hạn', en: 'Overdue' },
  den_han: { vi: 'Đến hạn 7 ngày', en: 'Due in 7 days' },
  chua_doi_chieu: { vi: 'Chưa đối chiếu', en: 'Not reconciled' },
  gop: { vi: 'Có hóa đơn gộp', en: 'Combined invoice' },
} as const satisfies Record<string, HaiThuTieng>;
/** Mã một chip lọc công nợ (khóa của CHIP_CONG_NO_NB). */
export type ChipCongNo = keyof typeof CHIP_CONG_NO_NB;

export function docChipCongNo(v: string | null): ChipCongNo | '' {
  return v && Object.hasOwn(CHIP_CONG_NO_NB, v) ? v as ChipCongNo : '';
}

/** Lọc danh sách NCC theo chip + chữ tìm (không dấu). Nợ nhiều / quá hạn lên trước. */
export function locNccCongNo(ds: CongNoNcc[], chip: ChipCongNo | '', q: string): CongNoNcc[] {
  const tim = chuanTenNcc(q);
  return ds
    .filter(n => chip === 'qua_han' ? n.no_qua_han > 0
      : chip === 'den_han' ? n.no_den_han_7_ngay > 0
      : chip === 'chua_doi_chieu' ? n.so_phieu_chua_doi_chieu > 0
      : chip === 'gop' ? n.so_phieu_hoa_don_gop > 0 : true)
    .filter(n => !tim || chuanTenNcc(n.ten_nha_cung_cap).includes(tim))
    .sort((a, b) => b.no_qua_han - a.no_qua_han || b.con_no - a.con_no || a.ten_nha_cung_cap.localeCompare(b.ten_nha_cung_cap, 'vi'));
}

/** Chia trang một mảng đã có sẵn (CO_TRANG dòng / trang, như GĐ4b). */
export function catTrangBoNho<T>(ds: T[], tim: Pick<TimDs, 'trang'>): { ds: T[]; coSau: boolean } {
  const [dau, cuoi] = khoangTrang({ q: '', tu: null, den: null, cuaToi: false, trang: tim.trang });
  return catTrang(ds.slice(dau, cuoi + 1));
}

// --- Trả hàng: chọn nhà cung cấp trước (0112) ------------------------------------
/** Một lô nhập mua (phiếu đã duyệt) còn ở kho / quầy và NCC của phiếu (kho_ncc_cua_lo). Không tiền. */
export interface NccCuaLo { nha_cung_cap_id: string | null; ten_nha_cung_cap: string | null }

/** Khóa nút "Không rõ nhà cung cấp" của màn trả hàng: lô của phiếu mua không ghi NCC. */
export const NCC_KHONG_RO = 'khong_ro';

/**
 * Lô → NCC của phiếu mua (kho_ncc_cua_lo, 0112; vai nhap hoặc ke_toan). Lô tồn đầu / pha lóc ra không có (không trả
 * được). Lỗi ném ra — trang bỏ bộ lọc, vẫn hiện mọi lô như trước 0112.
 */
export async function docNccCuaLo(client: SupabaseClient, chiNhanhId: string): Promise<Map<string, NccCuaLo>> {
  const { data, error } = await client.rpc('kho_ncc_cua_lo', { p_chi_nhanh_id: chiNhanhId });
  if (error) throw error;
  return new Map(((data ?? []) as ({ lo_id: string } & NccCuaLo)[])
    .map(r => [r.lo_id, { nha_cung_cap_id: r.nha_cung_cap_id, ten_nha_cung_cap: r.ten_nha_cung_cap }]));
}

/** Khóa lọc của một lô: id NCC, NCC_KHONG_RO (phiếu không ghi NCC), hoặc null — lô không phải hàng nhập mua. */
export function khoaNccLo(loId: string, nccCuaLo: ReadonlyMap<string, NccCuaLo>): string | null {
  const x = nccCuaLo.get(loId);
  return x ? x.nha_cung_cap_id ?? NCC_KHONG_RO : null;
}

/**
 * Nút "Nhà cung cấp" của màn trả hàng: mỗi NCC có hàng trả được một nút "tên" + số lô (lô khác nhau — một lô ở cả kho
 * lẫn quầy tính một), xếp theo tên (tiếng Việt); lô phiếu không ghi NCC gom nút "Không rõ nhà cung cấp" ở cuối. Lô không
 * có trong `nccCuaLo` (không phải hàng nhập mua) không tính.
 */
export function nutNccTraHang(
  loIds: string[], nccCuaLo: ReadonlyMap<string, NccCuaLo>, nn: NgonNguNB = 'vi',
): { id: string; ten: string; so: number }[] {
  const nut = new Map<string, { ten: string; lo: Set<string> }>();
  for (const id of loIds) {
    const khoa = khoaNccLo(id, nccCuaLo);
    if (!khoa) continue;
    const x = nut.get(khoa) ?? {
      ten: khoa === NCC_KHONG_RO ? { vi: 'Không rõ nhà cung cấp', en: 'Supplier not recorded' }[nn]
        : nccCuaLo.get(id)?.ten_nha_cung_cap ?? '—',
      lo: new Set<string>(),
    };
    x.lo.add(id);
    nut.set(khoa, x);
  }
  return [...nut].map(([id, x]) => ({ id, ten: x.ten, so: x.lo.size }))
    .sort((a, b) => Number(a.id === NCC_KHONG_RO) - Number(b.id === NCC_KHONG_RO) || a.ten.localeCompare(b.ten, 'vi'));
}

// --- Thẻ "Theo phiếu" ----------------------------------------------------------
/** Một trang phiếu công nợ: chip + tìm (số phiếu, NCC, số hóa đơn) + ngày nhập. */
export async function docCongNoPhieuTrang(
  client: SupabaseClient, chiNhanhId: string, chip: ChipCongNo | '', tim: TimDs, homNay: string,
): Promise<{ ds: CongNoPhieu[]; coSau: boolean }> {
  let q = client
    .from('kho_v_cong_no_phieu')
    .select('id, so_phieu, nha_cung_cap_id, ten_nha_cung_cap, ngay_nhap, so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_hoa_don, da_doi_chieu, ghi_chu_doi_chieu, tong_tien_phieu, phai_tra, da_tra, giam_tru, con_no, qua_han, so_ngay_qua_han, loai, tien_tra, bu_tru, hoan_tien, hoa_don_gop_id')
    .eq('chi_nhanh_id', chiNhanhId);
  if (chip === 'qua_han') q = q.eq('qua_han', true);
  if (chip === 'den_han') {
    const tuan = new Date(Date.parse(homNay) + 7 * 86400000).toISOString().slice(0, 10);
    q = q.gt('con_no', 0).gte('han_thanh_toan', homNay).lte('han_thanh_toan', tuan);
  }
  if (chip === 'chua_doi_chieu') q = q.eq('da_doi_chieu', false);
  if (chip === 'gop') q = q.not('hoa_don_gop_id', 'is', null);
  const hoac = locTimNhieuCot(['so_phieu', 'ten_nha_cung_cap', 'so_hoa_don'], tim.q);
  if (hoac) q = q.or(hoac);
  if (tim.tu) q = q.gte('ngay_nhap', tim.tu);
  if (tim.den) q = q.lte('ngay_nhap', tim.den);
  const [dau, cuoi] = khoangTrang(tim);
  const { data, error } = await q
    .order('han_thanh_toan', { ascending: true, nullsFirst: false }).order('ngay_nhap').order('id')
    .range(dau, cuoi);
  if (error) throw error;
  return catTrang(((data ?? []) as Dong[]).map(chuanHoaPhieu));
}

// --- Thẻ "Thanh toán" ----------------------------------------------------------
export interface KhoanThanhToan {
  id: string;
  so_phieu: string;
  loai: string;
  hinh_thuc: string | null;
  so_tien: number;
  ngay: string;
  ghi_chu: string | null;
  trang_thai: 'hieu_luc' | 'da_huy';
  nha_cung_cap_id: string;
  ten_nha_cung_cap: string;
  phieu_xuat_id: string | null;
}

/** Mọi khoản trả tiền / giảm trừ / bù trừ / hoàn tiền của chi nhánh, mới nhất trước. */
export async function docThanhToanTrang(
  client: SupabaseClient, chiNhanhId: string, tim: TimDs, loai: string | null,
): Promise<{ ds: KhoanThanhToan[]; coSau: boolean }> {
  let q = client
    .from('kho_thanh_toan')
    .select('id, so_phieu, loai, hinh_thuc, so_tien, ngay, ghi_chu, trang_thai, nha_cung_cap_id, phieu_xuat_id, kho_nha_cung_cap(ten)')
    .eq('chi_nhanh_id', chiNhanhId);
  if (loai && Object.hasOwn(TEN_LOAI_KHOAN_NB, loai)) q = q.eq('loai', loai);
  const hoac = locTimNhieuCot(['so_phieu', 'ghi_chu'], tim.q);
  if (hoac) q = q.or(hoac);
  if (tim.tu) q = q.gte('ngay', tim.tu);
  if (tim.den) q = q.lte('ngay', tim.den);
  const [dau, cuoi] = khoangTrang(tim);
  const { data, error } = await q
    .order('ngay', { ascending: false }).order('created_at', { ascending: false }).order('id')
    .range(dau, cuoi);
  if (error) throw error;
  return catTrang(((data ?? []) as Dong[]).map(r => {
    const n = r.kho_nha_cung_cap as { ten?: string } | { ten?: string }[] | null;
    return {
      ...r, so_tien: so(r.so_tien),
      ten_nha_cung_cap: (Array.isArray(n) ? n[0]?.ten : n?.ten) ?? '',
    } as unknown as KhoanThanhToan;
  }));
}

/** Tiền một khoản làm công nợ giảm (+) hay tăng (−, NCC hoàn tiền). Khoản đã hủy = 0. */
export function tienGiamNo(t: Pick<KhoanThanhToan, 'loai' | 'so_tien' | 'trang_thai'>): number {
  if (t.trang_thai !== 'hieu_luc') return 0;
  return t.loai === 'hoan_tien' ? -t.so_tien : t.so_tien;
}

// --- Thẻ "Theo dõi" và biên bản đối chiếu: công nợ theo kỳ --------------------
export interface DongSoCongNo {
  thu_tu: number;
  ngay: string;
  loai: string;
  ref_id: string | null;
  so_chung_tu: string | null;
  so_hoa_don: string | null;
  nha_cung_cap_id: string | null;
  ten_nha_cung_cap: string | null;
  dien_giai: string;
  tang: number | null;
  giam: number | null;
  so_du: number;
}

export async function docCongNoTheoKy(
  client: SupabaseClient, chiNhanhId: string, nccId: string | null, tu: string, den: string,
): Promise<DongSoCongNo[]> {
  const data = await docTungTrang((a, z) => client.rpc('kho_cong_no_theo_ky', {
    p_chi_nhanh_id: chiNhanhId,
    p_ncc: nccId,
    p_tu: tu,
    p_den: den,
  }, { count: 'exact' }).range(a, z));
  return (data as Dong[]).map(r => ({
    ...r,
    tang: r.tang === null || r.tang === undefined ? null : so(r.tang),
    giam: r.giam === null || r.giam === undefined ? null : so(r.giam),
    so_du: so(r.so_du), thu_tu: so(r.thu_tu),
  })) as DongSoCongNo[];
}

/** Tách dòng đầu kỳ / cuối kỳ khỏi các chứng từ; đầu kỳ + tăng − giảm = cuối kỳ. */
export function tomTatKy(dong: DongSoCongNo[]): { dauKy: number; tang: number; giam: number; cuoiKy: number; chungTu: DongSoCongNo[] } {
  const dau = dong.find(d => d.loai === 'dau_ky');
  const cuoi = dong.find(d => d.loai === 'cuoi_ky');
  const chungTu = dong.filter(d => d.loai !== 'dau_ky' && d.loai !== 'cuoi_ky');
  const tang = cuoi?.tang ?? chungTu.reduce((a, d) => a + (d.tang ?? 0), 0);
  const giam = cuoi?.giam ?? chungTu.reduce((a, d) => a + (d.giam ?? 0), 0);
  const dauKy = dau?.so_du ?? 0;
  return { dauKy, tang, giam, cuoiKy: cuoi?.so_du ?? dauKy + tang - giam, chungTu };
}

/** Kỳ từ URL (?tu=&den=), mặc định từ đầu tháng tới hôm nay; ngày sai bị bỏ, đảo nếu ngược. */
export function docKyCongNo(sp: URLSearchParams, homNay: string): { tu: string; den: string } {
  const ngay = (k: string) => { const v = sp.get(k) ?? ''; return docNgay(v) && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null; };
  let tu = ngay('tu') ?? `${homNay.slice(0, 8)}01`;
  let den = ngay('den') ?? homNay;
  if (tu > den) [tu, den] = [den, tu];
  return { tu, den };
}

export const TEN_LOAI_SO_CONG_NO_NB: Record<string, HaiThuTieng> = {
  mua: { vi: 'Nhập mua', en: 'Purchase' },
  no_dau: { vi: 'Nợ đầu kỳ', en: 'Opening balance' },
  thanh_toan: { vi: 'Trả tiền', en: 'Payment' },
  giam_tru: { vi: 'Giảm trừ', en: 'Deduction' },
  bu_tru: { vi: 'Bù trừ', en: 'Offset' },
  hoan_tien: { vi: 'NCC hoàn tiền', en: 'Supplier refund' },
};

// --- Hóa đơn gộp ---------------------------------------------------------------
export interface HoaDonGop {
  id: string;
  so_hoa_don: string;
  ngay: string;
  tong_tien: number;
  tien_thue: number;
  tong_phieu: number;
  so_phieu: number;
  ly_do_lech: string | null;
  trang_thai: 'hieu_luc' | 'da_bo';
  ly_do_bo: string | null;
  created_at: string;
  phieu: { phieu_id: string; so_phieu: string | null; tong_phieu: number; so_tien: number; tien_thue: number }[];
}

/** Hóa đơn gộp của một NCC (còn hiệu lực trước, mới nhất trước). */
export async function docHoaDonGop(client: SupabaseClient, chiNhanhId: string, nccId: string): Promise<HoaDonGop[]> {
  const { data, error } = await client
    .from('kho_hoa_don_ncc')
    .select('id, so_hoa_don, ngay, tong_tien, tien_thue, tong_phieu, so_phieu, ly_do_lech, trang_thai, ly_do_bo, created_at')
    .eq('chi_nhanh_id', chiNhanhId).eq('nha_cung_cap_id', nccId)
    .order('trang_thai', { ascending: false }).order('ngay', { ascending: false }).order('id')
    .limit(50);
  if (error) throw error;
  const hd = (data ?? []) as Dong[];
  const ids = hd.map(h => String(h.id));
  const phieu = new Map<string, HoaDonGop['phieu']>();
  if (ids.length) {
    const { data: ds, error: e2 } = await client
      .from('kho_hoa_don_phieu')
      .select('hoa_don_id, phieu_id, tong_phieu, so_tien, tien_thue, thu_tu, kho_phieu_nhap(so_phieu)')
      .in('hoa_don_id', ids).order('thu_tu');
    if (e2) throw e2;
    for (const x of (ds ?? []) as Dong[]) {
      const pn = x.kho_phieu_nhap as { so_phieu?: string } | { so_phieu?: string }[] | null;
      const id = String(x.hoa_don_id);
      phieu.set(id, [...(phieu.get(id) ?? []), {
        phieu_id: String(x.phieu_id), so_phieu: (Array.isArray(pn) ? pn[0]?.so_phieu : pn?.so_phieu) ?? null,
        tong_phieu: so(x.tong_phieu), so_tien: so(x.so_tien), tien_thue: so(x.tien_thue),
      }]);
    }
  }
  return hd.map(h => ({
    ...h, tong_tien: so(h.tong_tien), tien_thue: so(h.tien_thue), tong_phieu: so(h.tong_phieu), so_phieu: so(h.so_phieu),
    phieu: phieu.get(String(h.id)) ?? [],
  })) as unknown as HoaDonGop[];
}

export interface FormHoaDonGop {
  soHoaDon: string;
  ngay: string | null;
  tongTien: number | null;
  tienThue: number;
  lyDo: string;
  phieu: string[];
  loi: string[];
  /** Cùng các lỗi ở tiếng Anh, cùng thứ tự với loi. */
  loiEn: string[];
  giaTri: Record<string, string>;
}

/** Form đối chiếu hóa đơn gộp (thuần): ô tích `phieu` lặp lại, so_hoa_don, ngay, tong_tien, tien_thue, ly_do_lech. */
export function docFormHoaDonGop(form: { get(ten: string): unknown; getAll(ten: string): unknown[] }): FormHoaDonGop {
  const s = (t: string) => String(form.get(t) ?? '').trim();
  const giaTri: Record<string, string> = {};
  for (const k of ['so_hoa_don', 'ngay', 'tong_tien', 'tien_thue', 'ly_do_lech']) giaTri[k] = s(k);
  const phieu = [...new Set(form.getAll('phieu').map(v => String(v)).filter(laUuid))];
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  if (phieu.length < 2) {
    bao({ vi: 'Tích ít nhất 2 phiếu nằm trong hóa đơn này (một phiếu thì dùng "Đối chiếu hóa đơn" ở phiếu đó)',
          en: 'Tick at least 2 receipts that are on this invoice (for a single receipt, use "Reconcile invoice" on that receipt)' });
  }
  if (!giaTri.so_hoa_don) bao({ vi: 'Ghi số hóa đơn', en: 'Enter the invoice number' });
  else if (giaTri.so_hoa_don.length > 60) bao({ vi: 'Số hóa đơn tối đa 60 ký tự', en: 'The invoice number can be at most 60 characters' });
  const ngay = docNgay(giaTri.ngay);
  if (!ngay) {
    bao(ngay === undefined ? { vi: 'Ngày hóa đơn không phải ngày có thật', en: 'The invoice date is not a real date' }
      : { vi: 'Ghi ngày hóa đơn', en: 'Enter the invoice date' });
  }
  let tongTien = docTien(giaTri.tong_tien);
  if (tongTien === null) bao({ vi: 'Ghi tổng tiền in trên hóa đơn (ví dụ 25.450.000)', en: 'Enter the total printed on the invoice (for example 25,450,000)' });
  else if (Number.isNaN(tongTien) || tongTien < 0) {
    bao({ vi: 'Tổng tiền là số đồng (ví dụ 25.450.000)', en: 'The total must be in VND (for example 25,450,000)' });
    tongTien = null;
  }
  let tienThue = docTien(giaTri.tien_thue) ?? 0;
  if (Number.isNaN(tienThue) || tienThue < 0) {
    bao({ vi: 'Tiền thuế là số đồng (để trống nếu không có)', en: 'The tax must be in VND (leave it empty if there is none)' });
    tienThue = 0;
  }
  if (tongTien !== null && tienThue > tongTien) bao({ vi: 'Tiền thuế không lớn hơn tổng tiền hóa đơn', en: 'The tax cannot be more than the invoice total' });
  return { soHoaDon: giaTri.so_hoa_don, ngay: ngay ?? null, tongTien, tienThue, lyDo: giaTri.ly_do_lech, phieu, loi, loiEn, giaTri };
}

export interface ChiaHoaDonGop {
  phieu: { id: string; so_phieu: string; ngay_nhap: string; tong_tien_phieu: number; so_tien: number; tien_thue: number }[];
  tongPhieu: number;
  /** Tổng hóa đơn − tổng các phiếu (dương = hóa đơn cao hơn). */
  lech: number;
}

/**
 * Xem trước cách chia một hóa đơn gộp — soi gương kho_doi_chieu_hoa_don_gop:
 * phiếu xếp theo ngày nhập rồi số phiếu, chia theo tỉ lệ tổng phiếu, phần lẻ
 * theo số dư lớn nhất → tổng các phần đúng bằng tổng hóa đơn (từng đồng).
 */
export function xemTruocHoaDonGop(
  phieu: { id: string; so_phieu: string; ngay_nhap: string; tong_tien_phieu: number }[], tongTien: number, tienThue: number,
): ChiaHoaDonGop {
  const ds = [...phieu].sort((a, b) => (a.ngay_nhap < b.ngay_nhap ? -1 : a.ngay_nhap > b.ngay_nhap ? 1
    : a.so_phieu < b.so_phieu ? -1 : a.so_phieu > b.so_phieu ? 1 : 0));
  const ts = ds.map(p => p.tong_tien_phieu);
  const phan = chiaSoDuLonNhat(tongTien, ts);
  const thue = chiaSoDuLonNhat(tienThue, ts);
  const tongPhieu = ts.reduce((a, b) => a + b, 0);
  return {
    phieu: ds.map((p, i) => ({ ...p, so_tien: phan[i] ?? 0, tien_thue: thue[i] ?? 0 })),
    tongPhieu,
    lech: tongTien - tongPhieu,
  };
}

/** Lưu đối chiếu hóa đơn gộp. Lệch tổng phiếu mà chưa ghi lý do thì báo trước khi gửi. */
export async function doiChieuGop(
  client: SupabaseClient, chiNhanhId: string, nccId: string, form: FormData, tongPhieu: number,
): Promise<KetQua & { giaTri?: Record<string, string> }> {
  const f = docFormHoaDonGop(form);
  if (f.loi.length) return { ok: false, cau: f.loi.join(' · '), cauEn: f.loiEn.join(' · '), giaTri: f.giaTri };
  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) return { ...kqHai(false, CAU.formCu), giaTri: f.giaTri };
  const lech = (f.tongTien ?? 0) - tongPhieu;
  if (lech !== 0 && !f.lyDo) {
    return { giaTri: f.giaTri, ...kqHai(false, {
      vi: `Hóa đơn ${(f.tongTien ?? 0).toLocaleString('vi-VN')} đ lệch tổng các phiếu ${tongPhieu.toLocaleString('vi-VN')} đ (${dinhDangLech(lech)}). Ghi lý do lệch rồi lưu lại.`,
      en: `The invoice (${TIEN.en(f.tongTien ?? 0)}) differs from the receipts' total (${TIEN.en(tongPhieu)}) by ${dinhDangLech(lech, 'en')}. Enter the reason for the difference, then save again.`,
    }) };
  }
  const { data, error } = await client.rpc('kho_doi_chieu_hoa_don_gop', {
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_ncc: nccId,
    p_so_hoa_don: f.soHoaDon,
    p_ngay: f.ngay,
    p_tong_tien: f.tongTien,
    p_tien_thue: f.tienThue,
    p_phieu: f.phieu,
    p_ly_do_lech: f.lyDo || null,
  });
  if (error) return { ok: false, cau: cauLoiKho(error), giaTri: f.giaTri };
  const kq = (Array.isArray(data) ? data[0] : data) as { da_co?: boolean } | undefined;
  const soPhieuEn = `${f.phieu.length} ${f.phieu.length === 1 ? 'receipt' : 'receipts'}`;
  return kqHai(true, kq?.da_co
    ? { vi: `Hóa đơn ${f.soHoaDon} đã được đối chiếu từ lần bấm trước.`, en: `Invoice ${f.soHoaDon} was already reconciled on your earlier click.` }
    : { vi: `Đã đối chiếu hóa đơn gộp ${f.soHoaDon} cho ${f.phieu.length} phiếu — tổng ${(f.tongTien ?? 0).toLocaleString('vi-VN')} đ.`,
        en: `Combined invoice ${f.soHoaDon} reconciled for ${soPhieuEn} — total ${TIEN.en(f.tongTien ?? 0)}.` });
}

export function boDoiChieuGop(client: SupabaseClient, id: string, lyDo: string): Promise<KetQua> {
  if (!laUuid(id)) return Promise.resolve(kqHai(false, { vi: 'Hóa đơn không hợp lệ.', en: 'Invalid invoice.' }));
  if (!lyDo.trim()) {
    return Promise.resolve(kqHai(false, { vi: 'Ghi lý do bỏ đối chiếu (ví dụ: chọn nhầm phiếu).', en: 'Enter a reason for undoing it (for example: wrong receipts picked).' }));
  }
  return cauTraVe(client.rpc('kho_bo_doi_chieu_gop', { p_hoa_don_id: id, p_ly_do: lyDo.trim() }));
}

// --- Trả hàng hai bước -----------------------------------------------------------
/** Dòng trả hàng: t{i}_lo (ẩn), t{i}_kg, t{i}_goi (t{i}_cai: lô món đếm theo cái); dòng bỏ trống thì bỏ qua. */
export function docDongTraHang(form: { get(ten: string): unknown }): { dong: Record<string, unknown>[]; loi: string[]; loiEn: string[] } {
  const s = (t: string) => String(form.get(t) ?? '').trim();
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const dong: Record<string, unknown>[] = [];
  const soDong = docSoNguyen(form.get('so_dong'), 0, 200) ?? 0;
  for (let i = 0; i < (Number.isNaN(soDong) ? 0 : soDong); i++) {
    const d = docMotDongTra(s, i, bao);
    if (d) dong.push(d);
  }
  if (!dong.length && !loi.length) bao({ vi: 'Chưa ghi số trả.', en: 'No quantity entered.' });
  return { dong, loi, loiEn };
}

/**
 * Trả hàng bước 1 (thủ kho, chỉ kg — kho_tra_hang_ghi_kg): hàng rời kho ngay,
 * phiếu XT- chờ kế toán xác nhận tiền. phieuNhapId null = database lấy theo lô.
 * Ảnh biên bản vào thư mục "huy" (thủ kho tải được; hàm nhận /huy/ hoặc /thanh_toan/).
 */
export async function traHangGhiKg(
  client: SupabaseClient, chiNhanhId: string, form: FormData, ctx: { phieuNhapId: string | null; viTriId: string },
): Promise<KetQua & { id?: string }> {
  const { dong, loi, loiEn } = docDongTraHang(form);
  if (loi.length) return { ok: false, cau: loi.join(' · '), cauEn: loiEn.join(' · ') };
  const maGui = String(form.get('ma_gui') ?? '').trim();
  if (!laUuid(maGui)) return kqHai(false, CAU.formCu);
  const tai = await taiAnh(client, chiNhanhId, 'huy', maGui, layTepAnh(form));
  const { data, error } = await client.rpc('kho_tra_hang_ghi_kg', {
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_phieu_nhap_id: ctx.phieuNhapId,
    p_vi_tri_id: ctx.viTriId,
    p_ghi_chu: String(form.get('ghi_chu') ?? '').trim() || null,
    p_anh: tai.duongDan,
    p_dong: dong,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (Array.isArray(data) ? data[0] : data) as { phieu_xuat_id: string; so_phieu: string; da_co: boolean } | undefined;
  if (!kq) return kqHai(false, CAU.khongChac);
  const cauAnh = cauAnhLoi(tai);
  const cau: HaiThuTieng = kq.da_co
    ? { vi: `Phiếu trả hàng ${kq.so_phieu} đã được ghi từ lần bấm trước.`, en: `Return slip ${kq.so_phieu} was already saved on your earlier click.` }
    : { vi: `Đã ghi phiếu trả hàng ${kq.so_phieu}: hàng đã rời kho. Kế toán sẽ xác nhận với nhà cung cấp.`,
        en: `Return slip ${kq.so_phieu} recorded: the goods have left stock. The accountant will confirm with the supplier.` };
  return { ...kqHai(true, { vi: cau.vi + cauAnh.vi, en: cau.en + cauAnh.en }), id: kq.phieu_xuat_id };
}

export interface TraHangChoTien {
  phieu_xuat_id: string;
  so_phieu: string;
  ngay: string;
  phieu_nhap_id: string;
  so_phieu_nhap: string;
  nha_cung_cap_id: string | null;
  ten_nha_cung_cap: string | null;
  tong_kg: number;
  tong_goi: number;
  so_dong: number;
  so_tien_goi_y: number;
  nguoi_ghi: string | null;
  ghi_chu: string | null;
  so_anh: number;
  created_at: string;
}

/** Hàng chờ "Trả hàng chờ xác nhận tiền" (kế toán). */
export async function docTraHangChoTien(client: SupabaseClient, chiNhanhId: string): Promise<TraHangChoTien[]> {
  const { data, error } = await client.rpc('kho_ds_tra_hang_cho_tien', { p_chi_nhanh_id: chiNhanhId });
  if (error) throw error;
  return ((data ?? []) as Dong[]).map(r => ({
    ...r, tong_kg: so(r.tong_kg), tong_goi: so(r.tong_goi), so_dong: so(r.so_dong),
    so_tien_goi_y: so(r.so_tien_goi_y), so_anh: so(r.so_anh),
  })) as TraHangChoTien[];
}

/** Trả hàng bước 2 (kế toán): so_tien trống = tự tính, 0 = NCC không trừ tiền (đổi hàng mới). */
export async function xacNhanTienTraHang(client: SupabaseClient, form: FormData): Promise<KetQua> {
  const id = String(form.get('phieu_xuat_id') ?? '');
  if (!laUuid(id)) return kqHai(false, CAU.phieuKhongHopLe);
  const chu = String(form.get('so_tien') ?? '').trim();
  const tien = chu ? docTien(chu) : null;
  if (tien !== null && (Number.isNaN(tien) || tien < 0)) {
    return kqHai(false, { vi: 'Số tiền giảm trừ là số đồng (để trống = tự tính, 0 = không trừ).', en: 'The deduction must be in VND (empty = calculate it, 0 = no deduction).' });
  }
  const { data, error } = await client.rpc('kho_xac_nhan_tien_tra_hang', {
    p_phieu_xuat_id: id,
    p_so_tien: tien,
    p_ghi_chu: String(form.get('ghi_chu') ?? '').trim() || null,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (Array.isArray(data) ? data[0] : data) as { so_phieu: string; so_tien_giam_tru: number; da_co: boolean } | undefined;
  const giam = so(kq?.so_tien_giam_tru);
  const cauTien: HaiThuTieng = giam > 0
    ? { vi: `công nợ giảm ${giam.toLocaleString('vi-VN')} đ`, en: `payables down by ${TIEN.en(giam)}` }
    : { vi: 'không giảm công nợ (0 đ)', en: 'payables unchanged (0 ₫)' };
  return kqHai(true, kq?.da_co
    ? { vi: `Phiếu ${kq.so_phieu} đã được xác nhận từ trước: ${cauTien.vi}.`, en: `Slip ${kq.so_phieu} was already confirmed: ${cauTien.en}.` }
    : { vi: `Đã xác nhận phiếu ${kq?.so_phieu ?? ''}: ${cauTien.vi}.`, en: `Slip ${kq?.so_phieu ?? ''} confirmed: ${cauTien.en}.` });
}

/**
 * Hủy phiếu trả hàng CÒN CHỜ xác nhận tiền (ghi nhầm kg, NCC không nhận lại):
 * hàng về lại đúng lô, đúng chỗ (kho_huy_tra_hang_cho_tien). Người ghi phiếu,
 * kế toán hoặc quản lý. Không có tiền trong câu trả về.
 */
export function huyTraHangChoTien(client: SupabaseClient, id: string, lyDo: string): Promise<KetQua> {
  if (!laUuid(id)) return Promise.resolve(kqHai(false, CAU.phieuKhongHopLe));
  if (!lyDo.trim()) {
    return Promise.resolve(kqHai(false, {
      vi: 'Ghi lý do hủy (ví dụ: ghi nhầm số kg, nhà cung cấp không nhận lại).',
      en: 'Enter a reason for cancelling (for example: wrong kg entered, the supplier would not take it back).',
    }));
  }
  return cauTraVe(client.rpc('kho_huy_tra_hang_cho_tien', { p_phieu_xuat_id: id, p_ly_do: lyDo.trim() }));
}

// --- Nhật ký đổi tài khoản ngân hàng NCC --------------------------------------
export interface DoiTaiKhoan {
  id: string;
  ngan_hang_cu: string | null;
  so_tai_khoan_cu: string | null;
  ngan_hang_moi: string | null;
  so_tai_khoan_moi: string | null;
  nguoi_doi: string | null;
  luc: string;
}

export async function docNhatKyTaiKhoan(client: SupabaseClient, nccId: string, gioiHan = 10): Promise<DoiTaiKhoan[]> {
  if (!laUuid(nccId)) return [];
  const { data, error } = await client
    .from('kho_ncc_tk_nhat_ky')
    .select('id, ngan_hang_cu, so_tai_khoan_cu, ngan_hang_moi, so_tai_khoan_moi, nguoi_doi, luc')
    .eq('nha_cung_cap_id', nccId)
    .order('luc', { ascending: false })
    .limit(gioiHan);
  if (error) throw error;
  return (data ?? []) as DoiTaiKhoan[];
}

/**
 * Lần đổi tài khoản THẬT gần nhất trong `soNgay` ngày (đã có số cũ — điền lần
 * đầu không tính; số khác (bỏ dấu cách) hoặc ngân hàng khác), đúng như sự kiện
 * ncc_doi_tai_khoan của database. null = không có.
 */
export function doiTaiKhoanGanDay(nk: DoiTaiKhoan[], bayGio: number, soNgay = 30): DoiTaiKhoan | null {
  const so = (v: string | null) => (v ?? '').replace(/\s/g, '');
  const nh = (v: string | null) => (v ?? '').trim().toLowerCase();
  return nk.find(x => !!x.so_tai_khoan_cu
    && (so(x.so_tai_khoan_cu) !== so(x.so_tai_khoan_moi) || nh(x.ngan_hang_cu) !== nh(x.ngan_hang_moi))
    && bayGio - Date.parse(x.luc) <= soNgay * 86400000) ?? null;
}

/** Cảnh báo trước khi chuyển tiền: lần đổi tài khoản gần đây, hoặc chưa kiểm được. */
export interface CanhBaoDoiTk {
  /** Lần đổi tài khoản thật gần nhất trong 30 ngày (doiTaiKhoanGanDay); null = không có. */
  doi: DoiTaiKhoan | null;
  /** Đọc nhật ký lỗi — không biết tài khoản có vừa đổi không. */
  chuaKiem: boolean;
}

/**
 * Cho trang NCC và màn Trả tiền (khối CanhBaoTaiKhoan). Không bao giờ ném: nhật ký đọc lỗi thì
 * chuaKiem — trang nói "chưa kiểm được", KHÔNG im như thể tài khoản không đổi. Vai không xem được
 * nhật ký thì RLS lọc rỗng (không phải lỗi) → không cảnh báo.
 */
export async function docCanhBaoTaiKhoan(client: SupabaseClient, nccId: string, bayGio = Date.now()): Promise<CanhBaoDoiTk> {
  if (!laUuid(nccId)) return { doi: null, chuaKiem: false };
  try {
    return { doi: doiTaiKhoanGanDay(await docNhatKyTaiKhoan(client, nccId), bayGio), chuaKiem: false };
  } catch {
    return { doi: null, chuaKiem: true };
  }
}

// --- MISA ----------------------------------------------------------------------
export async function docDuLieuMisa(
  client: SupabaseClient, chiNhanhId: string, tu: string, den: string, loai: LoaiMisa,
): Promise<DongMisa[]> {
  // Một quý có thể quá 1.000 dòng chứng từ: đọc từng trang, không để file MISA thiếu lặng lẽ.
  const data = await docTungTrang((a, z) => client.rpc('kho_du_lieu_misa', {
    p_chi_nhanh_id: chiNhanhId,
    p_tu: tu,
    p_den: den,
    p_loai: loai,
  }, { count: 'exact' }).range(a, z));
  const soHoacNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return (data as Dong[]).map(r => ({
    ...r, thu_tu: so(r.thu_tu), so_luong: soHoacNull(r.so_luong), don_gia: soHoacNull(r.don_gia),
    thanh_tien: soHoacNull(r.thanh_tien), thue_suat: soHoacNull(r.thue_suat), tien_thue: soHoacNull(r.tien_thue),
    thieu_ma: !!r.thieu_ma,
  })) as DongMisa[];
}

/** Mã tài khoản MISA mặc định của chi nhánh (kho_cai_dat.misa_tk). */
export async function docMisaTk(client: SupabaseClient, chiNhanhId: string): Promise<Record<string, string>> {
  const { data, error } = await client.from('kho_cai_dat').select('misa_tk').eq('chi_nhanh_id', chiNhanhId).maybeSingle();
  if (error) throw error;
  return ((data?.misa_tk ?? {}) as Record<string, string>);
}

export async function luuMisaTk(client: SupabaseClient, chiNhanhId: string, tk: Record<string, string>): Promise<KetQua> {
  if (Object.keys(tk).length === 0) return kqHai(false, { vi: 'Chưa sửa mã tài khoản nào.', en: 'No account code was changed.' });
  const { error } = await client.rpc('kho_luu_misa_tk', { p_chi_nhanh_id: chiNhanhId, p_misa_tk: tk });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, { vi: 'Đã lưu mã tài khoản. File MISA từ giờ dùng các mã mới.', en: 'Account codes saved. The MISA file uses the new codes from now on.' });
}

/** Kế toán sửa mã MISA của một mặt hàng (bảng mặt hàng chỉ quản lý sửa được — đi qua hàm riêng). */
export async function luuMaMisaMatHang(client: SupabaseClient, matHangId: string, ma: string | null): Promise<KetQua> {
  if (!laUuid(matHangId)) return kqHai(false, { vi: 'Mặt hàng không hợp lệ.', en: 'Invalid item.' });
  const { error } = await client.rpc('kho_luu_ma_misa_mat_hang', { p_mat_hang_id: matHangId, p_ma_misa: ma });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, ma ? { vi: `Đã lưu mã MISA ${ma}.`, en: `MISA code ${ma} saved.` } : { vi: 'Đã xóa mã MISA.', en: 'MISA code removed.' });
}

/** NCC và mặt hàng kèm mã MISA — để tìm chỗ thiếu mã trên màn MISA. */
export async function docMaMisaDanhMuc(client: SupabaseClient): Promise<{
  ncc: { id: string; ten: string; ma_misa: string | null }[];
  matHang: { id: string; ma: string; ten: string; ma_misa: string | null }[];
}> {
  const [a, b] = await Promise.all([
    client.from('kho_nha_cung_cap').select('id, ten, ma_misa').order('ten'),
    client.from('kho_mat_hang').select('id, ma, ten, ma_misa').order('ma'),
  ]);
  if (a.error) throw a.error;
  if (b.error) throw b.error;
  return { ncc: (a.data ?? []) as { id: string; ten: string; ma_misa: string | null }[],
           matHang: (b.data ?? []) as { id: string; ma: string; ten: string; ma_misa: string | null }[] };
}
