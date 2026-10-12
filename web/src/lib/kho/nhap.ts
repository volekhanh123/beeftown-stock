/**
 * KHO — PHIẾU NHẬP
 *
 * Thủ kho lập phiếu trên điện thoại khi hàng về, chụp hóa đơn; quản lý duyệt
 * thì hàng mới vào tồn. Mọi lệnh ghi đi qua các hàm kho_*_phieu_nhap trong
 * migration 0020 — file này chỉ đọc form, tải ảnh và gọi hàm.
 *
 * TỪ 0031 thủ kho không thấy tiền: thủ kho nhận hàng ở /noi-bo/kho/nhan-hang
 * (chỉ kg, lib/kho/nhan-hang.ts). File này phục vụ vai XEM GIÁ: lập phiếu đủ
 * giá (quản lý, chủ) và màn DUYỆT CÓ ĐIỀN GIÁ (kế toán, quản lý — quyền
 * duyet_nhap): điền đơn giá từ ảnh hóa đơn, so với lần nhập trước, duyệt.
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
 *
 * HAI THỨ TIẾNG: lỗi đọc form trả loi (tiếng Việt) và loiEn song song; câu báo
 * KetQua có cauEn. Câu ghép với lỗi database thì phần database tra dichCau().
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  cauLoiKho, chiaSoDuLonNhat, dinhDangPhanTram, dinhDangTien, docKg, docNgay, docSoNguyen, docTien, kqHai, laUuid,
  type HaiThuTieng, type KetQua, type NgonNguNB,
} from './chung.ts';
import { docTruongThem, type DinhNghiaTruong, type GiaTriTruong } from './truong-them.ts';
import { docAnhDaTai, layTepAnh, soThuTuCuoi, taiAnh } from './anh.ts';
import { apDungTim, type TimDs } from './tim-ds.ts';
import { dichCau } from '../cau-noi-bo.ts';

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
  /** Ngày mổ của tảng (0048). */
  ngay_mo: string | null;
  /** Kg sau repack (0050) — null = như so_kg. so_kg là kg nhà cung cấp (tính tiền). */
  so_kg_thuc: number | null;
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
  /** 0048 / 0050: ngày mổ, kg sau repack — giữ lại khi lưu cả phiếu. */
  ngay_mo: string;
  so_kg_thuc: string;
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
): Promise<{ phieu: PhieuNhap; dong: DongPhieuNhap[]; maLo: Map<string, string>; soTang: Map<string, number> } | null> {
  if (!laUuid(id)) return null;
  const { data: phieu, error } = await client
    .from('kho_phieu_nhap')
    .select('id, chi_nhanh_id, so_phieu, ma_gui, phien_ban, loai, nha_cung_cap_id, vi_tri_id, ngay_nhap, so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_thue, chi_phi_khac, ghi_chu, anh, truong_them, trang_thai, ly_do, nguoi_tao, nguoi_gui, gui_luc, nguoi_duyet, duyet_luc, nguoi_huy, huy_luc, created_at')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!phieu) return null;

  const { data: dong, error: loiDong } = await client
    .from('kho_phieu_nhap_dong')
    .select('id, thu_tu, mat_hang_id, so_goi, so_kg, don_gia_kg, thanh_tien, so_lo_ncc, ngay_san_xuat, han_dung, truong_them, lo_id, ngay_mo, so_kg_thuc')
    .eq('phieu_nhap_id', id).order('thu_tu');
  if (loiDong) throw loiDong;

  const loIds = (dong ?? []).map(d => d.lo_id).filter(Boolean) as string[];
  const maLo = new Map<string, string>();
  // Số tảng của lô (món theo dõi theo tảng, 0048) — đọc cùng lượt với mã lô: đó là số ghi trên túi tảng.
  const soTang = new Map<string, number>();
  if (loIds.length) {
    const { data: lo } = await client.from('kho_lo').select('id, ma_lo, so_tang').in('id', loIds);
    for (const l of lo ?? []) {
      maLo.set(l.id, l.ma_lo);
      if (l.so_tang !== null && l.so_tang !== undefined) soTang.set(l.id, Number(l.so_tang));
    }
  }

  return {
    phieu: { ...phieu, tien_thue: Number(phieu.tien_thue), chi_phi_khac: Number(phieu.chi_phi_khac) } as PhieuNhap,
    dong: (dong ?? []).map(d => ({
      ...d, so_kg: Number(d.so_kg), don_gia_kg: Number(d.don_gia_kg), thanh_tien: Number(d.thanh_tien),
      so_kg_thuc: d.so_kg_thuc == null ? null : Number(d.so_kg_thuc),
    })) as DongPhieuNhap[],
    maLo,
    soTang,
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
    ngay_mo: d.ngay_mo ?? '',
    so_kg_thuc: d.so_kg_thuc != null ? String(d.so_kg_thuc).replace('.', ',') : '',
  }));
}

export function dongTrong(): DongForm {
  return { mat_hang_id: '', so_goi: '', so_kg: '', don_gia_kg: '', so_lo_ncc: '',
           ngay_san_xuat: '', han_dung: '', truong_them: {}, ngay_mo: '', so_kg_thuc: '' };
}

/** Lỗi ô ngày / ô tiền của đầu phiếu — form lập phiếu và form điền giá dùng chung. */
const LOI_DAU = {
  ngayNhap: { vi: 'Ngày nhập không phải ngày có thật', en: 'The receipt date is not a real date' },
  ngayHoaDon: { vi: 'Ngày hóa đơn không phải ngày có thật', en: 'The invoice date is not a real date' },
  hanTra: { vi: 'Hạn thanh toán không phải ngày có thật', en: 'The payment due date is not a real date' },
  thue: { vi: 'Tiền thuế là số đồng', en: 'The tax must be an amount in VND' },
  chiPhi: { vi: 'Chi phí khác là số đồng', en: 'Other costs must be an amount in VND' },
} satisfies Record<string, HaiThuTieng>;

export interface KetQuaDocForm {
  dau: DauForm;
  dong: DongForm[];
  loi: string[];
  /** Cùng các lỗi của loi, cùng thứ tự, bằng tiếng Anh. */
  loiEn: string[];
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
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };

  const tt = docTruongThem(form, dinhNghiaPhieu, undefined, cu?.phieu ?? {});
  loi.push(...tt.loi);
  loiEn.push(...tt.loiEn);
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
      ngay_mo: g('ngay_mo'), so_kg_thuc: g('kg_thuc'),
    };
    if (form.get(`d${i}_xoa`) === 'co') continue;
    if (!d.mat_hang_id && !d.so_kg && !d.so_goi) continue;   // dòng trống
    dong.push(d);

    const so = dong.length;
    if (!laUuid(d.mat_hang_id)) { bao({ vi: `Dòng ${so}: chưa chọn mặt hàng`, en: `Line ${so}: no item chosen` }); continue; }
    const kg = docKg(d.so_kg);
    const goi = docSoNguyen(d.so_goi, 0, 100000);
    const gia = docTien(d.don_gia_kg);
    const hsd = docNgay(d.han_dung);
    const nsx = docNgay(d.ngay_san_xuat);
    if (kg === null || Number.isNaN(kg) || kg <= 0) {
      bao({ vi: `Dòng ${so}: số kg chưa đúng (ví dụ 12,5)`, en: `Line ${so}: the kg is not valid (for example 12.5)` });
    }
    if (Number.isNaN(goi)) bao({ vi: `Dòng ${so}: số gói/tảng là số nguyên`, en: `Line ${so}: the number of packs/pieces must be a whole number` });
    if (Number.isNaN(gia)) {
      bao({ vi: `Dòng ${so}: đơn giá là số đồng mỗi kg (ví dụ 480.000)`, en: `Line ${so}: the unit price is VND per kg (for example 480,000)` });
    }
    if (hsd === undefined) bao({ vi: `Dòng ${so}: hạn dùng không phải ngày có thật`, en: `Line ${so}: the use-by date is not a real date` });
    if (nsx === undefined) bao({ vi: `Dòng ${so}: ngày sản xuất không phải ngày có thật`, en: `Line ${so}: the production date is not a real date` });
    const mo = docNgay(d.ngay_mo);
    if (mo === undefined) bao({ vi: `Dòng ${so}: ngày mổ không phải ngày có thật`, en: `Line ${so}: the slaughter date is not a real date` });
    const thuc = docKg(d.so_kg_thuc);
    if (thuc !== null && (Number.isNaN(thuc) || thuc <= 0)) {
      bao({ vi: `Dòng ${so}: kg sau repack chưa đúng (ví dụ 11,8)`, en: `Line ${so}: the weight after repack is not valid (for example 11.8)` });
    }
    ttDong.loi.forEach((x, j) => bao({ vi: `Dòng ${so}: ${x}`, en: `Line ${so}: ${ttDong.loiEn[j] ?? x}` }));

    payload.push({
      mat_hang_id: d.mat_hang_id,
      so_kg: kg,
      so_goi: goi,
      don_gia_kg: gia,
      so_lo_ncc: d.so_lo_ncc || null,
      ngay_san_xuat: nsx || null,
      han_dung: hsd || null,
      truong_them: ttDong.giaTri,
      ...(mo ? { ngay_mo: mo } : {}),
      ...(thuc !== null && !Number.isNaN(thuc) ? { so_kg_thuc: thuc } : {}),
    });
  }

  if (dau.ngay_nhap && docNgay(dau.ngay_nhap) === undefined) bao(LOI_DAU.ngayNhap);
  if (dau.ngay_hoa_don && docNgay(dau.ngay_hoa_don) === undefined) bao(LOI_DAU.ngayHoaDon);
  if (dau.han_thanh_toan && docNgay(dau.han_thanh_toan) === undefined) bao(LOI_DAU.hanTra);
  if (Number.isNaN(docTien(dau.tien_thue))) bao(LOI_DAU.thue);
  if (Number.isNaN(docTien(dau.chi_phi_khac))) bao(LOI_DAU.chiPhi);

  return { dau, dong, loi, loiEn, payload };
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
  if (!laUuid(maGui)) {
    return {
      ...kqHai(false, { vi: 'Form đã cũ — tải lại trang rồi nhập lại.', en: 'This form is out of date — reload the page and enter it again.' }),
      dau: doc.dau, dong: doc.dong,
    };
  }

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
  const cauAnh = cauLoiAnh(tai);
  // Chưa lưu được: trả lại đủ để trang hiện lại form cùng ma_gui và ảnh đã lên.
  const conAnh = cauAnhVanCon(anh.length);
  const chuaLuu = (c: HaiThuTieng): KetQuaLuu => ({
    ok: false,
    cau: c.vi + conAnh.vi + cauAnh.vi,
    cauEn: c.en + conAnh.en + cauAnh.en,
    dau: doc.dau, dong: doc.dong,
    maGui, anhDaTai: [...daTaiTruoc, ...tai.duongDan], anhGiu: anh,
  });

  if (doc.loi.length) return chuaLuu({ vi: doc.loi.join(' · '), en: doc.loiEn.join(' · ') });

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
  if (error) return chuaLuu(hai(cauLoiKho(error)));

  const kq = (Array.isArray(data) ? data[0] : data) as { phieu_id: string; phien_ban_moi: number; da_co: boolean } | undefined;
  if (!kq) {
    return chuaLuu({ vi: 'Không chắc đã lưu hay chưa — tải lại trang để kiểm tra.', en: 'Not sure whether it was saved — reload the page to check.' });
  }

  const xong: HaiThuTieng = kq.da_co
    ? { vi: 'Phiếu này đã được lưu từ lần bấm trước.', en: 'This receipt was already saved the first time you pressed.' }
    : { vi: 'Đã lưu nháp.', en: 'Draft saved.' };
  return {
    ok: true,
    id: kq.phieu_id,
    phienBan: kq.phien_ban_moi,
    soDong: doc.payload.length,
    cau: xong.vi + cauAnh.vi,
    cauEn: xong.en + cauAnh.en,
  };
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
// ĐIỀN GIÁ KHI DUYỆT (0031) — kế toán / quản lý, quyền duyet_nhap
// -----------------------------------------------------------------------------
// Thủ kho gửi phiếu chỉ có kg và ảnh hóa đơn. Người duyệt nhìn ảnh, gõ đơn
// giá từng dòng và thông tin hóa đơn, rồi "Lưu giá" hoặc "Duyệt" (= lưu giá
// rồi duyệt ngay). Ô đơn giá tên gia_<id dòng> — chỉ nhận id của đúng phiếu
// đang mở, id lạ bị bỏ qua (database cũng chặn lần nữa).
// -----------------------------------------------------------------------------

/** Một dòng kết quả kho_so_sanh_gia_nhap: giá dòng này so với lần nhập trước. */
export interface SoSanhGia {
  dong_id: string;
  mat_hang_id: string;
  don_gia_kg: number;
  /** Đơn giá lần trước — cùng mặt hàng, cùng nhà cung cấp. Chưa có lần trước: null. */
  gia_truoc: number | null;
  ngay_truoc: string | null;
  so_phieu_truoc: string | null;
  /** % chênh, 1 số lẻ. Dòng chưa có giá hoặc chưa có lần trước: null. */
  chenh_pt: number | null;
  vuot_nguong: boolean;
}

const soHoacNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/** So giá từng dòng với lần nhập trước. Vai không xem giá: Map rỗng. */
export async function docSoSanhGia(client: SupabaseClient, id: string): Promise<Map<string, SoSanhGia>> {
  const ra = new Map<string, SoSanhGia>();
  if (!laUuid(id)) return ra;
  const { data, error } = await client.rpc('kho_so_sanh_gia_nhap', { p_id: id });
  if (error) throw error;
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    ra.set(String(r.dong_id), {
      dong_id: String(r.dong_id),
      mat_hang_id: String(r.mat_hang_id),
      don_gia_kg: Number(r.don_gia_kg ?? 0),
      gia_truoc: soHoacNull(r.gia_truoc),
      ngay_truoc: (r.ngay_truoc as string | null) ?? null,
      so_phieu_truoc: (r.so_phieu_truoc as string | null) ?? null,
      chenh_pt: soHoacNull(r.chenh_pt),
      vuot_nguong: r.vuot_nguong === true,
    });
  }
  return ra;
}

/** Ngưỡng cảnh báo giá nhập (%) của chi nhánh — kho_cai_dat.nguong_gia_mua_pt, mặc định 5. */
export async function docNguongGiaMua(client: SupabaseClient, chiNhanhId: string): Promise<number> {
  const { data } = await client
    .from('kho_cai_dat').select('nguong_gia_mua_pt')
    .eq('chi_nhanh_id', chiNhanhId).maybeSingle();
  const n = Number(data?.nguong_gia_mua_pt);
  return Number.isFinite(n) && n > 0 ? n : 5;
}

/**
 * Chữ trên chip của một dòng: "Lần trước 480.000 đ · +8,3%" (tiếng Anh: "Last time
 * 480,000 ₫ · +8.3%"). Chưa có lần trước: null.
 */
export function chuSoSanhGia(s: SoSanhGia | undefined, nn: NgonNguNB = 'vi'): { chu: string; vuot: boolean } | null {
  if (!s || s.gia_truoc === null) return null;
  const pt = s.chenh_pt === null ? '' : ` · ${s.chenh_pt > 0 ? '+' : ''}${dinhDangPhanTram(s.chenh_pt, 1, nn)}`;
  const truoc = dinhDangTien(s.gia_truoc, nn);
  return { chu: { vi: `Lần trước ${truoc}${pt}`, en: `Last time ${truoc}${pt}` }[nn], vuot: s.vuot_nguong };
}

/**
 * Câu tóm tắt trong hộp vàng trên nút Duyệt:
 * "2 món giá tăng hơn 5% so với lần trước — kiểm lại hóa đơn". Không món nào vượt: null.
 */
export function cauCanhBaoGia(ds: Iterable<SoSanhGia>, nguong: number, nn: NgonNguNB = 'vi'): string | null {
  const vuot = [...ds].filter(s => s.vuot_nguong && s.chenh_pt !== null);
  if (vuot.length === 0) return null;
  const huong: HaiThuTieng = vuot.every(s => (s.chenh_pt ?? 0) > 0) ? { vi: 'tăng', en: 'up' }
    : vuot.every(s => (s.chenh_pt ?? 0) < 0) ? { vi: 'giảm', en: 'down' } : { vi: 'lệch', en: 'changed' };
  const n = vuot.length;
  return {
    vi: `${n} món giá ${huong.vi} hơn ${nguong.toLocaleString('vi-VN')}% so với lần trước — kiểm lại hóa đơn`,
    en: `Price ${huong.en} more than ${nguong.toLocaleString('en-US')}% on ${n} ${n === 1 ? 'item' : 'items'} since last time — check the invoice`,
  }[nn];
}

/** Chữ đang hiện trên form điền giá — giữ nguyên chữ người dùng gõ để điền lại khi báo lỗi. */
export interface DienGiaForm {
  so_hoa_don: string;
  ngay_hoa_don: string;
  han_thanh_toan: string;
  tien_thue: string;
  chi_phi_khac: string;
  /** Ô đơn giá theo id dòng. */
  gia: Record<string, string>;
}

export function dienGiaTuPhieu(p: PhieuNhap, dong: DongPhieuNhap[]): DienGiaForm {
  const tien = (n: number) => (n ? n.toLocaleString('vi-VN') : '');
  return {
    so_hoa_don: p.so_hoa_don ?? '',
    ngay_hoa_don: p.ngay_hoa_don ?? '',
    han_thanh_toan: p.han_thanh_toan ?? '',
    tien_thue: tien(p.tien_thue),
    chi_phi_khac: tien(p.chi_phi_khac),
    gia: Object.fromEntries(dong.map(d => [d.id, tien(d.don_gia_kg)])),
  };
}

export interface KetQuaDocDienGia {
  giaTri: DienGiaForm;
  loi: string[];
  /** Cùng các lỗi của loi, cùng thứ tự, bằng tiếng Anh. */
  loiEn: string[];
  /** Gửi thẳng vào p_gia của kho_dien_gia_phieu_nhap. */
  payload: { dong_id: string; don_gia_kg: number }[];
}

/**
 * Đọc form điền giá. Hàm thuần — test được. Ô đơn giá bỏ trống = 0 (chưa có
 * giá): trang hiện đúng thứ đã lưu, và nút Duyệt sẽ báo dòng nào còn thiếu.
 * Phiếu tồn đầu kỳ không có thuế, chi phí — luôn gửi 0.
 */
export function docFormDienGia(
  form: FormData,
  dong: { id: string; thu_tu?: number }[],
  loai: 'mua' | 'ton_dau',
): KetQuaDocDienGia {
  const s = (ten: string) => String(form.get(ten) ?? '').trim();
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const giaTri: DienGiaForm = {
    so_hoa_don: s('so_hoa_don'),
    ngay_hoa_don: s('ngay_hoa_don'),
    han_thanh_toan: s('han_thanh_toan'),
    tien_thue: loai === 'mua' ? s('tien_thue') : '',
    chi_phi_khac: loai === 'mua' ? s('chi_phi_khac') : '',
    gia: {},
  };
  const payload: { dong_id: string; don_gia_kg: number }[] = [];
  dong.forEach((d, i) => {
    const chu = s(`gia_${d.id}`);
    giaTri.gia[d.id] = chu;
    const gia = docTien(chu);
    if (Number.isNaN(gia)) {
      bao({ vi: `Dòng ${i + 1}: đơn giá là số đồng mỗi kg (ví dụ 480.000)`, en: `Line ${i + 1}: the unit price is VND per kg (for example 480,000)` });
      return;
    }
    payload.push({ dong_id: d.id, don_gia_kg: gia ?? 0 });
  });
  if (giaTri.ngay_hoa_don && docNgay(giaTri.ngay_hoa_don) === undefined) bao(LOI_DAU.ngayHoaDon);
  if (giaTri.han_thanh_toan && docNgay(giaTri.han_thanh_toan) === undefined) bao(LOI_DAU.hanTra);
  if (Number.isNaN(docTien(giaTri.tien_thue))) bao(LOI_DAU.thue);
  if (Number.isNaN(docTien(giaTri.chi_phi_khac))) bao(LOI_DAU.chiPhi);
  return { giaTri, loi, loiEn, payload };
}

/** Lưu giá (không đổi trạng thái). Thành công: trả phiên bản mới để duyệt tiếp. */
export async function dienGiaPhieu(
  client: SupabaseClient, id: string, phienBan: number | null, doc: KetQuaDocDienGia,
): Promise<KetQua & { phienBan?: number }> {
  if (doc.loi.length) return { ok: false, cau: doc.loi.join(' · '), cauEn: doc.loiEn.join(' · ') };
  const g = doc.giaTri;
  const { data, error } = await client.rpc('kho_dien_gia_phieu_nhap', {
    p_id: id,
    p_phien_ban: phienBan,
    p_so_hoa_don: g.so_hoa_don || null,
    p_ngay_hoa_don: g.ngay_hoa_don || null,
    p_han_thanh_toan: g.han_thanh_toan || null,
    p_tien_thue: docTien(g.tien_thue) ?? 0,
    p_chi_phi_khac: docTien(g.chi_phi_khac) ?? 0,
    p_gia: doc.payload,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ...kqHai(true, { vi: 'Đã lưu giá.', en: 'Prices saved.' }), phienBan: Number(data) };
}

// -----------------------------------------------------------------------------
// XEM TRƯỚC GIÁ VỐN — cho quản lý trước khi bấm duyệt
// -----------------------------------------------------------------------------
/**
 * Cùng công thức với kho_duyet_phieu_nhap(): tiền hàng + chi phí khác chia
 * theo kg + thuế chia theo tiền hàng (mỗi khoản khi cài đặt bật).
 */
export function xemTruocGiaVon(
  dong: { so_kg: number; thanh_tien: number; so_kg_thuc?: number | null }[],
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
    // 0050: kho nhập theo kg sau repack — tổng tiền giữ nguyên, chia cho kg còn lại.
    const kgVao = d.so_kg_thuc ?? d.so_kg;
    return { gia_tri: giaTri, gia_von_kg: kgVao > 0 ? giaTri / kgVao : 0 };
  });
}
