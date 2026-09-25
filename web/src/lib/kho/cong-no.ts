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
import { boDau, cauLoiKho, docKg, docNgay, docSoNguyen, docTien, laUuid, type KetQua } from './chung.ts';
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
  phan_bo: { phieu_nhap_id: string; so_phieu: string | null; so_tien: number }[];
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
  throw new Error('Quá nhiều dòng công nợ để đọc một lần — báo người quản trị.');
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
    .select('nha_cung_cap_id, ten_nha_cung_cap, so_phieu, so_phieu_con_no, so_phieu_chua_doi_chieu, tong_phai_tra, da_tra, giam_tru, con_no, no_qua_han, han_gan_nhat')
    .eq('chi_nhanh_id', chiNhanhId);
  if (nccId) q = q.eq('nha_cung_cap_id', nccId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => ({
    ...r, so_phieu: so(r.so_phieu), so_phieu_con_no: so(r.so_phieu_con_no),
    so_phieu_chua_doi_chieu: so(r.so_phieu_chua_doi_chieu),
    tong_phai_tra: so(r.tong_phai_tra), da_tra: so(r.da_tra), giam_tru: so(r.giam_tru),
    con_no: so(r.con_no), no_qua_han: so(r.no_qua_han),
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
}

function chuanHoaPhieu(r: Dong): CongNoPhieu {
  return {
    ...r,
    tien_hoa_don: r.tien_hoa_don === null || r.tien_hoa_don === undefined ? null : so(r.tien_hoa_don),
    tong_tien_phieu: so(r.tong_tien_phieu), phai_tra: so(r.phai_tra), da_tra: so(r.da_tra),
    giam_tru: so(r.giam_tru), con_no: so(r.con_no), so_ngay_qua_han: so(r.so_ngay_qua_han),
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
      .select('id, so_phieu, nha_cung_cap_id, ten_nha_cung_cap, ngay_nhap, so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_hoa_don, da_doi_chieu, ghi_chu_doi_chieu, tong_tien_phieu, phai_tra, da_tra, giam_tru, con_no, qua_han, so_ngay_qua_han', { count: 'exact' })
      .eq('chi_nhanh_id', chiNhanhId);
    if (loc.nccId) q = q.eq('nha_cung_cap_id', loc.nccId);
    if (loc.chiQuaHan) q = q.eq('qua_han', true);
    if (loc.chuaDoiChieu) q = q.eq('da_doi_chieu', false);
    if (loc.hanTrong) q = q.gt('con_no', 0).gte('han_thanh_toan', loc.hanTrong.tu).lte('han_thanh_toan', loc.hanTrong.den);
    if (loc.conViec) q = q.or('con_no.neq.0,da_doi_chieu.eq.false');
    // Thứ tự cố định tới tận id — đọc từng trang mới không sót, không trùng.
    return q.order('han_thanh_toan', { ascending: true, nullsFirst: false }).order('ngay_nhap').order('id');
  };
  return (await docHetTrang((tu, den) => tao().range(tu, den))).map(chuanHoaPhieu);
}

/** Công nợ của một phiếu nhập (null nếu không phải phiếu mua đã duyệt, hoặc không xem được). */
export async function docCongNoMotPhieu(client: SupabaseClient, id: string): Promise<CongNoPhieu | null> {
  if (!laUuid(id)) return null;
  const { data } = await client
    .from('kho_v_cong_no_phieu')
    .select('id, so_phieu, nha_cung_cap_id, ten_nha_cung_cap, ngay_nhap, so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_hoa_don, da_doi_chieu, ghi_chu_doi_chieu, tong_tien_phieu, phai_tra, da_tra, giam_tru, con_no, qua_han, so_ngay_qua_han')
    .eq('id', id).maybeSingle();
  return data ? chuanHoaPhieu(data) : null;
}

/**
 * Tiền hóa đơn lệch tổng phiếu bao nhiêu (dương = hóa đơn cao hơn phiếu).
 * 0 khi chưa đối chiếu hoặc khớp.
 */
export function tienLech(p: Pick<CongNoPhieu, 'da_doi_chieu' | 'tien_hoa_don' | 'tong_tien_phieu'>): number {
  return p.da_doi_chieu && p.tien_hoa_don !== null ? p.tien_hoa_don - p.tong_tien_phieu : 0;
}

/** 50000 → "+50.000 đ", -50000 → "−50.000 đ". */
export function dinhDangLech(lech: number): string {
  return `${lech > 0 ? '+' : '−'}${Math.abs(lech).toLocaleString('vi-VN')} đ`;
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
  const loi = (cau: string) => ({ ok: false, cau, giaTri });

  if (!giaTri.so_hoa_don) return loi('Ghi số hóa đơn.');
  const tien = docTien(giaTri.tien_hoa_don);
  if (tien === null || Number.isNaN(tien)) return loi('Ghi tổng tiền in trên hóa đơn (ví dụ 5.450.000).');
  const ngayHd = docNgay(giaTri.ngay_hoa_don);
  const han = docNgay(giaTri.han_thanh_toan);
  if (ngayHd === undefined || han === undefined) return loi('Ngày không phải ngày có thật.');

  // Tổng phiếu đọc lại từ database, không tin số gửi lên từ form.
  const phieu = await docCongNoMotPhieu(client, id);
  if (!phieu) return loi('Không tìm thấy phiếu nhập này trong công nợ — tải lại trang.');
  const lech = tien - phieu.tong_tien_phieu;
  if (lech !== 0 && !giaTri.ghi_chu_doi_chieu) {
    return loi(`Hóa đơn ${tien.toLocaleString('vi-VN')} đ lệch phiếu ${phieu.tong_tien_phieu.toLocaleString('vi-VN')} đ (${dinhDangLech(lech)}). Ghi lý do vào ô "Ghi chú" (ví dụ: NCC tính thêm phí giao hàng) rồi lưu lại.`);
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
  // Câu báo luôn nói rõ công nợ giảm bao nhiêu — trang chuyển về công nợ của
  // nhà cung cấp, kế toán đọc số này để so với biên bản.
  const giam = Number(kq.so_tien_giam_tru) || 0;
  const cauTien = giam > 0
    ? `công nợ giảm ${giam.toLocaleString('vi-VN')} đ`
    : 'không giảm công nợ (0 đ — nhà cung cấp đổi hàng mới)';
  const cauAnh = tai.loi.length ? ` Lưu ý: ${tai.loi.join(' · ')}` : '';
  return {
    ok: true, id: kq.phieu_xuat_id,
    cau: (kq.da_co ? `Phiếu trả hàng ${kq.so_phieu} đã được ghi từ lần bấm trước: ${cauTien}.`
      : `Đã ghi phiếu trả hàng ${kq.so_phieu}: ${cauTien}.`) + cauAnh,
  };
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

/** Nhãn loại của một dòng công nợ: "Nợ đầu kỳ" hay "Nhập mua". */
export function tenLoaiCongNo(p: { so_phieu: string | null | undefined }): string {
  return laNoDau(p) ? 'Nợ đầu kỳ' : 'Nhập mua';
}

/**
 * Link của số phiếu trong màn công nợ. Phiếu nợ đầu kỳ không có trang phiếu
 * nhập (không hàng; kho_doc_phieu_nhap_kg từ chối) → về trang công nợ của
 * nhà cung cấp, đúng dòng đó.
 */
export function linkPhieuCongNo(p: { id: string; so_phieu: string; nha_cung_cap_id: string }): string {
  return laNoDau(p) ? `/noi-bo/kho/cong-no/${p.nha_cung_cap_id}#p-${p.id}` : `/noi-bo/kho/nhap/${p.id}`;
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
    .select('id, so_phieu, nha_cung_cap_id, ten_nha_cung_cap, ngay_nhap, so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_hoa_don, da_doi_chieu, ghi_chu_doi_chieu, tong_tien_phieu, phai_tra, da_tra, giam_tru, con_no, qua_han, so_ngay_qua_han', { count: 'exact' })
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
export interface XemTruocNoDau { dong: DongNoDau[]; loi: string[]; tong: number }

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
  const dong: DongNoDau[] = [];
  const theoId = new Map(ncc.map(n => [n.id, n]));
  // Theo thứ tự của danh sách nhà cung cấp (như lưới), rồi id lạ ở cuối.
  const ids = [...ncc.map(n => n.id).filter(id => id in giaTri), ...Object.keys(giaTri).filter(id => !theoId.has(id))];
  for (const id of ids) {
    const o = giaTri[id];
    const n = theoId.get(id);
    if (!n) { loi.push('Có dòng của nhà cung cấp không còn trong danh mục — tải lại trang.'); continue; }
    const ten = n.ten;
    const soPhieu = daGhi.get(id);
    if (soPhieu) { loi.push(`${ten}: đã ghi nợ đầu kỳ ở phiếu ${soPhieu} — hủy phiếu đó trước nếu muốn ghi lại.`); continue; }
    const tien = docTien(o.tien);
    if (tien === null) { loi.push(`${ten}: chưa ghi số tiền nợ.`); continue; }
    if (Number.isNaN(tien) || tien <= 0) { loi.push(`${ten}: số tiền "${o.tien}" phải là số đồng lớn hơn 0 (ví dụ 12.500.000).`); continue; }
    const han = docNgay(o.han);
    if (han === undefined) { loi.push(`${ten}: hạn trả "${o.han}" không phải ngày có thật.`); continue; }
    if (o.hd.length > 60) { loi.push(`${ten}: số hóa đơn tối đa 60 ký tự.`); continue; }
    if (o.gc.length > 500) { loi.push(`${ten}: ghi chú tối đa 500 ký tự.`); continue; }
    dong.push({ nha_cung_cap_id: id, ten, so_tien: tien, han_thanh_toan: han, so_hoa_don: o.hd || null, ghi_chu: o.gc || null });
  }
  if (dong.length > TOI_DA_DONG_NO_DAU) loi.push(`Mỗi lần ghi tối đa ${TOI_DA_DONG_NO_DAU} nhà cung cấp — chia làm nhiều lần.`);
  return { dong, loi, tong: dong.reduce((a, d) => a + d.so_tien, 0) };
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
): { giaTri: Record<string, ONoDau>; loi: string[]; boQua: string[] } {
  const giaTri: Record<string, ONoDau> = {};
  const loi: string[] = [];
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
  if (hang.length === 0) return { giaTri, loi, boQua };

  let cot: (CotNoDau | undefined)[] = [...COT_NO_DAU];
  const dau = hang[0].o.map(o => TIEU_DE_NO_DAU[chuanTenNcc(o).replace(/( (d|dong|vnd))+$/, '')]);
  const hieu = dau.filter((c): c is CotNoDau => !!c);
  if (hieu.length >= 2 || (hieu.includes('ncc') && docTien(hang[0].o[1] ?? '') === null)) {
    hang[0].o.forEach((o, i) => { if (o && !dau[i]) boQua.push(o); });
    for (const c of COT_NO_DAU) if (dau.filter(x => x === c).length > 1) loi.push('Dòng tiêu đề: có cột bị lặp — xóa bớt một cột.');
    if (!hieu.includes('ncc') || !hieu.includes('tien')) loi.push('Dòng tiêu đề cần có cột Nhà cung cấp và cột Số tiền.');
    if (loi.length) return { giaTri, loi, boQua };
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
    if (!chuNcc) { loi.push(`Dòng ${h.so}: thiếu tên nhà cung cấp.`); continue; }
    const mst = chuNcc.replace(/\s/g, '');
    const khop = /^\d{10}(-\d{3})?$/.test(mst) ? theoMst.get(mst) ?? [] : theoTen.get(chuanTenNcc(chuNcc)) ?? [];
    if (khop.length === 0) { loi.push(`Dòng ${h.so}: không thấy nhà cung cấp "${chuNcc}" — thêm ở Cài đặt › Nhà cung cấp trước, hoặc sửa tên cho giống.`); continue; }
    if (khop.length > 1) { loi.push(`Dòng ${h.so}: có ${khop.length} nhà cung cấp tên "${chuNcc}" — ghi mã số thuế thay cho tên.`); continue; }
    const n = khop[0];
    const truoc = daDan.get(n.id);
    if (truoc !== undefined) { loi.push(`Dòng ${h.so}: ${n.ten} đã có ở dòng ${truoc} — gộp thành một dòng.`); continue; }
    const han = docNgayDan(o.han ?? '');
    if (han === undefined) { loi.push(`Dòng ${h.so} (${n.ten}): hạn trả "${o.han}" không hiểu — ghi dạng 31/10/2026.`); continue; }
    daDan.set(n.id, h.so);
    giaTri[n.id] = { tien: (o.tien ?? '').trim(), han: han ?? '', hd: (o.hd ?? '').trim(), gc: (o.gc ?? '').trim() };
  }
  return { giaTri, loi, boQua };
}

/** Ghi nợ đầu kỳ: một phiếu ND- mỗi nhà cung cấp. Cùng ma_gui (bấm hai lần, F5) → trả lại đúng các phiếu cũ. */
export async function ghiNoDauKy(
  client: SupabaseClient, chiNhanhId: string, maGui: string, dong: DongNoDau[],
): Promise<KetQua> {
  if (!laUuid(maGui)) return { ok: false, cau: 'Form đã cũ — tải lại trang.' };
  if (dong.length === 0) return { ok: false, cau: 'Chưa có dòng nợ nào — ghi số tiền ở ít nhất một nhà cung cấp.' };
  const { data, error } = await client.rpc('kho_ghi_no_dau_ky', {
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_dong: dongGuiNoDau(dong),
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (data ?? {}) as { da_co?: boolean; tong_tien?: number; phieu?: { so_phieu: string }[] };
  const soPhieu = kq.phieu?.length ?? 0;
  const tien = so(kq.tong_tien).toLocaleString('vi-VN');
  return {
    ok: true,
    cau: kq.da_co
      ? `Nợ đầu kỳ đã được ghi từ lần bấm trước: ${soPhieu} nhà cung cấp, ${tien} đ.`
      : `Đã ghi nợ đầu kỳ ${soPhieu} nhà cung cấp, tổng ${tien} đ. Trả tiền ở trang công nợ của từng nhà cung cấp như phiếu nhập.`,
  };
}

/** Hủy một phiếu nợ đầu kỳ (ghi nhầm). Bắt buộc lý do; đã trả tiền / giảm trừ thì database chặn. */
export function huyNoDauKy(client: SupabaseClient, id: string, lyDo: string): Promise<KetQua> {
  if (!laUuid(id)) return Promise.resolve({ ok: false, cau: 'Phiếu không hợp lệ.' });
  if (!lyDo.trim()) return Promise.resolve({ ok: false, cau: 'Ghi lý do hủy (ví dụ: ghi nhầm số tiền).' });
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
  return {
    ok: true,
    cau: boQua ? 'Đã đánh dấu: không có nợ đầu kỳ. Bước này trong Thiết lập đã xong.'
      : 'Đã bỏ đánh dấu "không có nợ đầu kỳ".',
  };
}
