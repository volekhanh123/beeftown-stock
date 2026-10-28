/**
 * KHO — CHUYỂN QUẦY, XUẤT BẾP, XUẤT KHÁC, BÁO HỦY
 *
 * Một phiếu ghi sổ ngay (chuyển, xuất bếp, xuất khác) hoặc chờ quản lý duyệt
 * (hủy). Xuất khác (0032): dùng nội bộ, tặng khách, hàng mẫu... — bắt buộc lý
 * do, chỉ hàng còn hạn, không kèm ảnh. Lô
 * nào bị lấy do database chọn theo FEFO (kho_phan_bo, 0023) — trừ khi người
 * dùng chọn đích danh một lô. Với nhân viên thì gọi là "tự lấy hàng hạn gần
 * trước", không dùng chữ FEFO.
 *
 * FORM (không JavaScript) — hai kiểu dòng, gửi chung:
 *   Theo mặt hàng: d{i}_mat_hang, d{i}_so_goi, d{i}_so_kg   (FEFO)
 *   Theo lô:       l{i}_lo, l{i}_mat_hang (ẩn), l{i}_so_goi, l{i}_so_kg
 *   Quét nhãn: ô "ma_quet" — mỗi mã một dòng; gom thành dòng theo mặt hàng. Nhãn in bằng Ô MÃ của một tảng
 *   (0049) mà lô của tảng đó còn đủ ở nơi lấy hàng thì thành dòng theo LÔ của đúng tảng đó (dongTuQuet).
 * Một món KHÔNG được ghi ở cả hai kiểu dòng: kho sẽ bị trừ hai lần.
 *
 * ẢNH BÁO HỦY: tải lên MỘT lần, ngay lần gửi đầu tiên có chọn ảnh (kể cả bấm
 * "Đọc mã" hay gửi bị lỗi). Đường dẫn giữ trong ô ẩn "anh_da_tai" và ma_gui
 * giữ nguyên qua các lần gửi lại — nên ảnh không mất, không phải chụp lại, và
 * không nằm mồ côi trong kho file khi database từ chối phiếu.
 *
 * BÁO HỦY 3 BƯỚC (GĐ5b): Hàng → lý do (nút lớn) → ảnh rồi gửi. Vẫn MỘT form:
 * sang bước sau thì hàng đã ghi và ảnh đã tải đi theo dưới dạng ô ẩn, ma_gui
 * giữ nguyên — bấm lui bấm tới không mất gì, gửi hai lần vẫn một phiếu.
 * Bước nào hiện là do buocHuySau() quyết (hàm thuần, có test).
 *
 * HÀNG ĐI ĐƯỜNG (0032): khi cài đặt "quầy phải bấm nhận" bật, phiếu chuyển
 * kho → quầy do thủ kho lập nằm ở trạng thái dang_chuyen tới khi quầy bấm
 * nhận (lib/kho/quay.ts). Quầy nhận thiếu → nhan_thieu → quản lý trả về kho
 * (da_tra_ve) hoặc ghi mất (da_nhan). Người lập hủy được chuyến khi quầy chưa
 * nhận (da_huy, hàng về lại kho).
 *
 * Hai thứ tiếng: lỗi form có loiEn song song với loi, câu báo có cauEn,
 * tomTatHang nhận thêm nn, tên loại phiếu có bản _NB. Câu database trả về
 * (duyệt, trả về…) thì trang tra dichCau lúc hiện.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, dinhDangKg, dinhDangNgay, docKg, docSoNguyen, donViChung, kqHai, laUuid, type HaiThuTieng, type KetQua, type NgonNguNB } from './chung.ts';
import { gomTheoMaCan, tachDanhSachMa } from './ma-vach.ts';
import { oDangGiao, taoBangTraMaCan, traMaCan, type KhopMaCan, type MaGiamDeTra, type OMaDeTra } from './tra-ma-can.ts';
import { chuTang } from './tang.ts';
import { docAnhDaTai, layTepAnh, soThuTuCuoi, taiAnh } from './anh.ts';
import { apDungTim, type TimDs } from './tim-ds.ts';
import { dichCau } from '../cau-noi-bo.ts';

/** tra_ncc chỉ lập từ trang Công nợ (kho_tra_nha_cung_cap), không lập ở đây. */
export type LoaiXuat = 'chuyen' | 'xuat_bep' | 'huy' | 'tra_ncc' | 'xuat_khac';

export const TEN_LOAI_XUAT_NB: Record<LoaiXuat, HaiThuTieng> = {
  chuyen: { vi: 'Chuyển hàng', en: 'Transfer' },
  xuat_bep: { vi: 'Xuất bếp', en: 'Issue to kitchen' },
  huy: { vi: 'Báo hủy', en: 'Write-off' },
  tra_ncc: { vi: 'Trả nhà cung cấp', en: 'Return to supplier' },
  xuat_khac: { vi: 'Xuất khác', en: 'Other issue' },
};
/** Bảng tên cũ (chỉ tiếng Việt), dựng từ bản hai thứ tiếng. */
export const TEN_LOAI_XUAT: Record<LoaiXuat, string> = Object.fromEntries(
  Object.entries(TEN_LOAI_XUAT_NB).map(([k, v]) => [k, v.vi]),
) as Record<LoaiXuat, string>;

/** Đơn vị gói mặc định của cột kho_mat_hang.don_vi_goi (0019) — khi món không mang đơn vị. */
const GOI_MAC_DINH: HaiThuTieng = { vi: 'gói', en: 'packs' };

/** Các loại phiếu lập được ở /noi-bo/kho/xuat/moi?loai=… (theo thứ tự trên thanh chọn). */
export const LOAI_LAP_DUOC = ['chuyen', 'xuat_bep', 'xuat_khac', 'huy'] as const;

export type TrangThaiXuat =
  | 'da_ghi' | 'cho_duyet' | 'da_duyet' | 'tu_choi'
  // Hàng đi đường (0032) — chỉ phiếu chuyển
  | 'dang_chuyen' | 'da_nhan' | 'nhan_thieu' | 'da_tra_ve' | 'da_huy'
  // Trả hàng NCC hai bước (0040): thủ kho đã ghi kg, chờ kế toán xác nhận tiền
  // (hủy được khi còn chờ → da_huy).
  | 'cho_xac_nhan_tien';

/**
 * Vị trí chọn được làm nơi lấy / nơi nhận: kho hoặc quầy đang dùng. "Hàng chờ
 * hủy" và "Đang mang ra quầy" là một phần của quy trình, không phải chỗ để
 * hàng — database cũng từ chối (0032).
 */
export function laNoiDeHang(v: { loai: string; dang_dung: boolean }): boolean {
  return v.dang_dung && v.loai !== 'cho_huy' && v.loai !== 'dang_chuyen';
}

export interface PhieuXuatTom {
  id: string;
  so_phieu: string;
  loai: LoaiXuat;
  trang_thai: TrangThaiXuat;
  ngay: string;
  ten_vi_tri: string;
  ten_vi_tri_den: string | null;
  ten_ly_do: string | null;
  so_dong: number;
  tong_goi: number;
  tong_kg: number;
  nguoi_tao: string | null;
  created_at: string;
}

export interface PhieuXuat extends PhieuXuatTom {
  chi_nhanh_id: string;
  vi_tri_id: string;
  loai_vi_tri: string;
  vi_tri_den_id: string | null;
  ly_do_id: string | null;
  ghi_chu: string | null;
  anh: string[];
  ly_do_tu_choi: string | null;
  nguoi_duyet: string | null;
  duyet_luc: string | null;
  /** Phiếu trả hàng: phiếu nhập của lô được trả. */
  phieu_nhap_id: string | null;
  // Hàng đi đường (0032)
  yeu_cau_id: string | null;
  so_yeu_cau: string | null;
  nguoi_nhan: string | null;
  nhan_luc: string | null;
  tong_goi_nhan: number | null;
  tong_kg_nhan: number | null;
  xu_ly_thieu: 'tra_ve' | 'mat' | null;
  ly_do_xu_ly: string | null;
  nguoi_xu_ly: string | null;
  xu_ly_luc: string | null;
}

export interface DongXuat {
  thu_tu: number;
  mat_hang_id: string;
  lo_id: string | null;
  so_goi: number;
  so_kg: number;
  so_kg_do: number | null;
  /** Hàng đi đường: số quầy xác nhận đã nhận. null = chưa nhận / không đi đường. */
  so_goi_nhan: number | null;
  so_kg_nhan: number | null;
}

export interface DongSoCai {
  loai: string;
  lo_id: string;
  vi_tri_id: string;
  so_kg: number;
  so_goi: number;
  created_at: string;
}

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export async function docDanhSachPhieuXuat(
  client: SupabaseClient, chiNhanhId: string,
  // trangThai nhiều giá trị: "Đang mang ra" gồm cả chuyến quầy nhận thiếu chờ quản lý xử lý.
  loc: { loai?: string | null; trangThai?: string | readonly string[] | null },
  // Có tim: tìm / lọc ngày / của tôi / đọc đúng một trang (lib/kho/tim-ds.ts).
  tim?: { tim: TimDs; nhanSuId: string | null },
): Promise<PhieuXuatTom[]> {
  let q = client
    .from('kho_v_phieu_xuat')
    .select('id, so_phieu, loai, trang_thai, ngay, ten_vi_tri, ten_vi_tri_den, ten_ly_do, so_dong, tong_goi, tong_kg, nguoi_tao, created_at')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('created_at', { ascending: false });
  if (loc.loai) q = q.eq('loai', loc.loai);
  if (typeof loc.trangThai === 'string') q = q.eq('trang_thai', loc.trangThai);
  else if (loc.trangThai?.length) q = q.in('trang_thai', [...loc.trangThai]);
  q = tim
    ? apDungTim(q, tim.tim, { cotTim: ['so_phieu', 'ten_vi_tri', 'ten_vi_tri_den', 'ten_ly_do'], cotNgay: 'ngay', nhanSuId: tim.nhanSuId })
    : q.limit(150);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(r => ({ ...r, tong_kg: Number(r.tong_kg) })) as PhieuXuatTom[];
}

export async function demPhieuHuyCho(client: SupabaseClient, chiNhanhId: string): Promise<number | null> {
  const { count, error } = await client
    .from('kho_phieu_xuat').select('id', { count: 'exact', head: true })
    .eq('chi_nhanh_id', chiNhanhId).eq('trang_thai', 'cho_duyet');
  return error ? null : (count ?? 0);
}

export async function docPhieuXuat(
  client: SupabaseClient, id: string,
): Promise<{ phieu: PhieuXuat; dong: DongXuat[]; soCai: DongSoCai[] } | null> {
  if (!laUuid(id)) return null;
  const { data: phieu, error } = await client
    .from('kho_v_phieu_xuat')
    .select('id, chi_nhanh_id, so_phieu, loai, trang_thai, ngay, vi_tri_id, ten_vi_tri, loai_vi_tri, vi_tri_den_id, ten_vi_tri_den, ly_do_id, ten_ly_do, ghi_chu, anh, ly_do_tu_choi, nguoi_tao, nguoi_duyet, duyet_luc, created_at, so_dong, tong_goi, tong_kg, yeu_cau_id, so_yeu_cau, nguoi_nhan, nhan_luc, tong_goi_nhan, tong_kg_nhan, xu_ly_thieu, ly_do_xu_ly, nguoi_xu_ly, xu_ly_luc')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!phieu) return null;

  const [{ data: dong, error: e1 }, { data: soCai, error: e2 }, { data: goc }] = await Promise.all([
    client.from('kho_phieu_xuat_dong').select('thu_tu, mat_hang_id, lo_id, so_goi, so_kg, so_kg_do, so_goi_nhan, so_kg_nhan')
      .eq('phieu_xuat_id', id).order('thu_tu'),
    client.from('kho_so_cai').select('loai, lo_id, vi_tri_id, so_kg, so_goi, created_at')
      .eq('chung_tu_id', id).order('created_at'),
    client.from('kho_phieu_xuat').select('phieu_nhap_id').eq('id', id).maybeSingle(),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return {
    phieu: {
      ...phieu, tong_kg: Number(phieu.tong_kg), anh: phieu.anh ?? [], phieu_nhap_id: goc?.phieu_nhap_id ?? null,
      tong_kg_nhan: phieu.tong_kg_nhan === null ? null : Number(phieu.tong_kg_nhan),
    } as PhieuXuat,
    dong: (dong ?? []).map(d => ({
      ...d, so_kg: Number(d.so_kg), so_kg_do: d.so_kg_do === null ? null : Number(d.so_kg_do),
      so_kg_nhan: d.so_kg_nhan === null ? null : Number(d.so_kg_nhan),
    })) as DongXuat[],
    soCai: (soCai ?? []).map(s => ({ ...s, so_kg: Number(s.so_kg) })) as DongSoCai[],
  };
}

// -----------------------------------------------------------------------------
// FORM → DỮ LIỆU (hàm thuần)
// -----------------------------------------------------------------------------
export interface DongXuatForm { mat_hang_id: string; so_goi: string; so_kg: string }
export interface DongLoForm { lo_id: string; mat_hang_id: string; so_goi: string; so_kg: string }

export interface KetQuaDocXuat {
  dong: DongXuatForm[];
  theoLo: DongLoForm[];
  loi: string[];
  /** Các lỗi đó bằng tiếng Anh, cùng thứ tự. */
  loiEn: string[];
  payload: Record<string, unknown>[];
}

type BaoLoi = (c: HaiThuTieng) => void;

export function docFormPhieuXuat(
  form: FormData,
  matHang: { id: string; ten: string; dem_goi: boolean; don_vi_goi?: string | null; dem_theo_cai?: boolean }[],
): KetQuaDocXuat {
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao: BaoLoi = c => { loi.push(c.vi); loiEn.push(c.en); };
  const payload: Record<string, unknown>[] = [];
  const mh = new Map(matHang.map(m => [m.id, m]));

  const dong: DongXuatForm[] = [];
  const soDong = docSoNguyen(form.get('so_dong'), 0, 200) ?? 0;
  for (let i = 0; i < (Number.isNaN(soDong) ? 0 : soDong); i++) {
    const g = (ten: string) => String(form.get(`d${i}_${ten}`) ?? '').trim();
    const d: DongXuatForm = { mat_hang_id: g('mat_hang'), so_goi: g('so_goi'), so_kg: g('so_kg') };
    if (!d.mat_hang_id && !d.so_goi && !d.so_kg) continue;
    dong.push(d);
    const thu = dong.length;
    const m = mh.get(d.mat_hang_id);
    if (!laUuid(d.mat_hang_id) || !m) { bao({ vi: `Dòng ${thu}: chưa chọn mặt hàng`, en: `Line ${thu}: no item chosen` }); continue; }
    const p = docDong(m, d.so_goi, d.so_kg, { vi: `Dòng ${thu} (${m.ten})`, en: `Line ${thu} (${m.ten})` }, bao);
    if (p) payload.push({ mat_hang_id: d.mat_hang_id, ...p });
  }

  const theoLo: DongLoForm[] = [];
  const soLo = docSoNguyen(form.get('so_lo'), 0, 500) ?? 0;
  for (let i = 0; i < (Number.isNaN(soLo) ? 0 : soLo); i++) {
    const g = (ten: string) => String(form.get(`l${i}_${ten}`) ?? '').trim();
    const l: DongLoForm = { lo_id: g('lo'), mat_hang_id: g('mat_hang'), so_goi: g('so_goi'), so_kg: g('so_kg') };
    theoLo.push(l);
    if (!l.so_goi && !l.so_kg) continue;
    const m = mh.get(l.mat_hang_id);
    if (!laUuid(l.lo_id) || !m) { bao({ vi: 'Một dòng lô không hợp lệ — tải lại trang', en: 'A lot line is not valid — reload the page' }); continue; }
    const p = docDong(m, l.so_goi, l.so_kg, { vi: `Lô của "${m.ten}"`, en: `Lot of "${m.ten}"` }, bao);
    if (p) payload.push({ mat_hang_id: l.mat_hang_id, lo_id: l.lo_id, ...p });
  }

  // Cùng một món vừa ghi "theo mặt hàng" vừa ghi ở lô: database trừ CẢ HAI
  // (lô hạn gần nhất + lô đã chọn) — quét 2 gói rồi gõ thêm 2 ở lô là 4 gói
  // rời kho. Không đoán người dùng muốn chỗ nào: chặn và nói rõ.
  const coSo = (x: { so_goi: string; so_kg: string }) => !!(x.so_goi || x.so_kg);
  const theoMh = new Set(dong.filter(d => coSo(d) && mh.has(d.mat_hang_id)).map(d => d.mat_hang_id));
  const trung = new Set(theoLo.filter(l => coSo(l) && theoMh.has(l.mat_hang_id)).map(l => l.mat_hang_id));
  const cauTrung: HaiThuTieng[] = [...trung].map(id => mh.get(id)!.ten).map(ten => ({
    vi: `${ten} được ghi ở cả hai phần — chỉ ghi một chỗ`,
    en: `${ten} is entered in both sections — enter it in one place only`,
  }));
  loi.unshift(...cauTrung.map(c => c.vi));
  loiEn.unshift(...cauTrung.map(c => c.en));

  return { dong, theoLo, loi, loiEn, payload };
}

function docDong(
  m: { dem_goi: boolean; don_vi_goi?: string | null; dem_theo_cai?: boolean }, goiChu: string, kgChu: string, nhan: HaiThuTieng, bao: BaoLoi,
): Record<string, unknown> | null {
  const goi = docSoNguyen(goiChu, 0, 100000);
  // 0105: món đếm theo cái (sốt, đồ uống) không có kg — ô kg (ẩn trên form) bỏ qua, chỉ gửi số cái.
  const kg = m.dem_theo_cai ? null : docKg(kgChu);
  // Đơn vị đếm của chính món ("khay", "tảng"…) — món không mang đơn vị thì chữ chung.
  const dv = { vi: m.don_vi_goi || GOI_MAC_DINH.vi, en: m.don_vi_goi || GOI_MAC_DINH.en };
  if (Number.isNaN(goi)) { bao({ vi: `${nhan.vi}: số ${dv.vi} là số nguyên`, en: `${nhan.en}: the number of ${dv.en} must be a whole number` }); return null; }
  if (Number.isNaN(kg) || (kg !== null && kg <= 0)) {
    bao({ vi: `${nhan.vi}: số kg chưa đúng (ví dụ 1,25)`, en: `${nhan.en}: the kg is not right (for example 1.25)` });
    return null;
  }
  if (m.dem_goi) {
    if (!goi) { bao({ vi: `${nhan.vi}: chưa nhập số ${dv.vi}`, en: `${nhan.en}: number of ${dv.en} not entered` }); return null; }
    return kg !== null ? { so_goi: goi, so_kg: kg } : { so_goi: goi };
  }
  if (kg === null) { bao({ vi: `${nhan.vi}: chưa nhập số kg`, en: `${nhan.en}: kg not entered` }); return null; }
  return { so_kg: kg };
}

export interface KetQuaQuet {
  dong: DongXuatForm[];
  /**
   * Dòng theo LÔ cần cộng thêm vào form (gopDongLo): nhãn in bằng ô mã của một tảng mà lô của tảng đó còn đủ ở
   * nơi lấy hàng. Chỉ có khi trang truyền `datLo`. Một gói không bao giờ nằm ở cả `dong` lẫn `theoLo`.
   */
  theoLo: DongLoForm[];
  /** Câu nói các nhãn mã ô đã ghi vào lô của tảng nào — null khi không có dòng lô nào. */
  cauDatLo: HaiThuTieng | null;
  /** Câu cho nhân viên, chữ thường ngày — không có mã, không có "Cài đặt". */
  loi: string[];
  /** Các câu đó bằng tiếng Anh, cùng thứ tự. */
  loiEn: string[];
  /** Tổng số mã trong ô quét. */
  soMa: number;
  /** Số nhãn đã thành dòng hàng (theo món + theo lô). */
  soDoc: number;
  /** Nhãn không đọc được: mã hỏng, sai số kiểm tra, không phải nhãn cân. */
  soNhanHong: number;
  /** Gói đọc được mã nhưng mã cân chưa gắn với món nào. */
  soGoiLa: number;
  /** Các mã cân lạ — chỉ để hiện cho người sửa được danh mục. */
  maCanLa: string[];
  /** Nhãn của lô ĐÃ HẾT HẠN quét vào phiếu chỉ nhận hàng còn hạn — KHÔNG ghi vào đâu, có câu báo riêng. */
  soHetHan: number;
}

/** Ô mã và mã giảm giá của mọi món (o-ma.ts docMaTrenNhan) — để nhận nhãn không in bằng mã của chính món. */
export interface MaTrenNhan { oMa: readonly OMaDeTra[]; maGiam: readonly MaGiamDeTra[] }

/** Thứ cần để đặt nhãn mã ô vào ĐÚNG LÔ của tảng. Chỉ phiếu mới, lúc bấm "Đọc mã". */
export interface DatLoQuet {
  /** Ô đang giao ở chi nhánh (o-ma.ts docGiaoOMaCan). `han_dung`: hạn dùng của lô mà ô đang gắn (YYYY-MM-DD). */
  giao: readonly { ma_can: string; lo_id: string | null; so_tang: number | null; so_phieu?: string | null; han_dung?: string | null }[];
  /** Tồn theo lô ở NƠI LẤY HÀNG của phiếu (các dòng kho_v_ton của vị trí đó). */
  lo: readonly { lo_id: string; mat_hang_id: string; so_goi: number; so_kg: number; tinh_trang_han?: string | null; han_dung?: string | null }[];
  tenNoiLay: string;
  /** Phiếu chỉ nhận hàng còn hạn (chuyển, xuất bếp, xuất khác): lô hết hạn không ghi được. */
  chiConHan: boolean;
  /**
   * Hôm nay theo giờ Việt Nam (gio-vn.ts homNayVn, YYYY-MM-DD). Có thì khay của một lô đã hết hạn bị chặn cả khi sổ
   * không còn lô đó ở nơi lấy (so `giao.han_dung` với ngày này). Không truyền → chỉ biết hết hạn qua dòng tồn `lo`.
   */
  homNay?: string | null;
  /**
   * Tồn của MỌI nơi ở chi nhánh (ton.ts docTon, kể cả chờ hủy) — để câu báo nói sổ đang để lô của một khay hết hạn ở
   * đâu khi lô đó không ở nơi lấy. Không truyền → câu không nói được chỗ.
   */
  tonKhac?: readonly { lo_id: string; ten_vi_tri: string; loai_vi_tri: string; so_goi: number; so_kg: number }[];
  /** Dòng theo món và dòng theo lô đang có trên form, TRƯỚC lượt quét này. */
  dong: readonly DongXuatForm[];
  theoLo: readonly DongLoForm[];
}

/** Tảng nhận trước khi có số tảng (dữ liệu cũ) — câu vẫn phải gọi được nó. */
const TANG_CHUA_SO: HaiThuTieng = { vi: 'một tảng chưa có số', en: 'an unnumbered primal' };

interface MonQuet {
  id: string; ten: string; ma_can: string | null; dang_dung: boolean;
  dem_goi?: boolean; don_vi_goi?: string | null;
}

/**
 * Đọc ô dán mã vạch → dòng theo mặt hàng (số gói, tổng kg). Mã cân không
 * khớp mặt hàng nào, mã hỏng → báo, không đoán. Câu báo viết cho nhân viên
 * quầy: đếm số nhãn hỏng, số gói lạ, và nói phải làm gì với gói đó.
 *
 * Mã trên nhãn tra bằng bộ tra chung (tra-ma-can.ts): mã của món, ô mã, mã giảm giá. Mọi nhãn của cùng một món
 * cộng vào MỘT dòng (cộng theo gram). Trang không truyền `them.maNhan` → chỉ nhận mã của chính món.
 *
 * ĐẶT VÀO ĐÚNG LÔ CỦA TẢNG (`them.datLo`): nhãn mã ô mang theo tảng nó cắt ra. Một món được ghi theo LÔ khi MỌI
 * nhãn của món trong lượt quét đều là nhãn mã ô, ô nào cũng đang giao cho một tảng có lô ở nơi lấy hàng, lô đủ
 * tồn (tính cả số đã ghi ở dòng lô đó), và món chưa có số ở dòng theo món. Thiếu một điều → cả món ghi theo món,
 * database lấy hàng hạn gần trước như nhãn thường, kèm câu nói rõ vì sao (trừ khi chỉ vì trộn với nhãn mã món:
 * lúc đó không có gì sai để báo). Vì form không cho một món nằm ở cả hai phần nên không bao giờ tách một món
 * ra hai phần trong cùng một lượt quét. Riêng nhãn của lô ĐÃ HẾT HẠN trên phiếu chỉ nhận hàng còn hạn thì không
 * ghi vào đâu: ghi theo món là trừ nhầm một lô còn hạn trong khi khay cầm trên tay đã hết hạn. Lô đó không còn
 * trên sổ ở nơi lấy thì vẫn chặn được nhờ hạn dùng của lô mà ô đang gắn (`datLo.giao[].han_dung` so `datLo.homNay`).
 */
export function dongTuQuet(
  noiDung: string,
  matHang: MonQuet[],
  mau?: string | null,
  soLeKg = 3,
  them: { maNhan?: MaTrenNhan | null; datLo?: DatLoQuet | null } = {},
): KetQuaQuet {
  const ds = tachDanhSachMa(noiDung);
  const gom = gomTheoMaCan(ds, mau || undefined, soLeKg);
  const bang = taoBangTraMaCan(matHang, them.maNhan?.oMa ?? [], them.maNhan?.maGiam ?? []);
  const heSo = 10 ** soLeKg;
  const chuKg = (don: number) => String(don / heSo).replace('.', ',');
  const datLo = them.datLo ?? null;

  // Gom nhãn theo MÓN: mỗi mã (mã món, từng ô, từng mã giảm) là một phần của món đó.
  interface Phan { khop: KhopMaCan<MonQuet>; soGoi: number; don: number }
  const theoMon = new Map<string, { mon: MonQuet; phan: Phan[] }>();
  const maCanLa: string[] = [];
  let soGoiLa = 0;
  for (const [maCan, g] of gom.theoMa) {
    const khop = traMaCan(bang, maCan);
    if (!khop) { soGoiLa += g.soGoi; maCanLa.push(maCan); continue; }
    const n = theoMon.get(khop.matHang.id) ?? { mon: khop.matHang, phan: [] };
    n.phan.push({ khop, soGoi: g.soGoi, don: Math.round(g.soKg * heSo) });
    theoMon.set(khop.matHang.id, n);
  }

  const dong: DongXuatForm[] = [];
  const theoLo: DongLoForm[] = [];
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao: BaoLoi = c => { loi.push(c.vi); loiEn.push(c.en); };
  const daDat: HaiThuTieng[] = [];
  let soDoc = 0;
  let soHetHan = 0;
  const coSo = (x: { so_goi: string; so_kg: string }) => !!(x.so_goi || x.so_kg);

  for (const { mon, phan } of theoMon.values()) {
    const demGoi = mon.dem_goi !== false;
    const dv = { vi: mon.don_vi_goi || GOI_MAC_DINH.vi, en: mon.don_vi_goi || GOI_MAC_DINH.en };
    /** "2 khay" · món cân ký thì "1,55 kg". */
    const luong = (soGoi: number, don: number): HaiThuTieng => (demGoi
      ? { vi: `${soGoi} ${dv.vi}`, en: `${soGoi} ${dv.en}` }
      : { vi: `${dinhDangKg(don / heSo, 'vi')} kg`, en: `${dinhDangKg(don / heSo, 'en')} kg` });
    const tang = (soTang: number | null): HaiThuTieng => ({
      vi: chuTang(soTang, 'vi') || TANG_CHUA_SO.vi, en: chuTang(soTang, 'en') || TANG_CHUA_SO.en,
    });
    const theoHan: HaiThuTieng = { vi: 'máy lấy hàng hạn gần trước', en: 'nearest expiry first' };

    let conGhi = phan;                    // các phần còn được ghi vào phiếu
    const lyDo: HaiThuTieng[] = [];       // vì sao nhãn mã ô không vào được lô của tảng
    /** Lô đặt được: cộng mọi ô cùng trỏ về một lô. */
    const dat = new Map<string, { soTang: number | null; soGoi: number; don: number }>();
    let datHet = !!datLo && phan.every(p => p.khop.nguon === 'o_ma')
      && !datLo.dong.some(d => d.mat_hang_id === mon.id && coSo(d));

    if (datLo) {
      const ungVien = new Map<string, { soTang: number | null; lo: DatLoQuet['lo'][number]; soGoi: number; don: number }>();
      const hetHan: Phan[] = [];
      for (const p of phan) {
        if (p.khop.nguon !== 'o_ma') continue;
        const g = oDangGiao(p.khop, datLo.giao);
        const l = luong(p.soGoi, p.don);
        if (!g) {
          lyDo.push({
            vi: `Ô ${p.khop.soO} của ${mon.ten} hiện không còn gắn với tảng nào — ${l.vi} vừa quét ghi theo món, ${theoHan.vi}.`,
            en: `Slot ${p.khop.soO} of ${mon.ten} is not assigned to any primal right now — the ${l.en} just scanned go in by item, ${theoHan.en}.`,
          });
          continue;
        }
        const t = tang(g.so_tang);
        if (!g.lo_id) {
          const phien = g.so_phieu ? ` ${g.so_phieu}` : '';
          lyDo.push({
            vi: `${l.vi} ${mon.ten} thuộc ${t.vi}, phiên lóc${phien} chưa chốt nên chưa vào sổ — ghi theo món, ${theoHan.vi}. Chốt phiên lóc đó trước rồi quét lại thì phiếu mới trừ đúng tảng.`,
            en: `${l.en} of ${mon.ten} belong to ${t.en}; butchery session${phien} is not closed yet, so they are not on the books — entered by item, ${theoHan.en}. Close that session first, then scan again so the slip deducts the right primal.`,
          });
          continue;
        }
        const loTim = datLo.lo.find(x => x.lo_id === g.lo_id && x.mat_hang_id === mon.id);
        const lo = loTim && (Number(loTim.so_goi) > 0 || Number(loTim.so_kg) > 0) ? loTim : null;
        // Lô của tảng trên nhãn ĐÃ HẾT HẠN — xét trước mọi thứ khác. Sổ còn lô đó ở nơi lấy: theo dòng tồn. Sổ không
        // còn (sổ lệch với kệ, hoặc lô đã sang chờ hủy): theo hạn dùng của lô mà ô đang gắn so với hôm nay giờ Việt
        // Nam. Khay cầm trên tay đã hết hạn thì không được thành dòng theo món — database sẽ trừ một lô còn hạn. Lô
        // đó không ở nơi lấy thì chặn ở MỌI loại phiếu, kể cả báo hủy: hủy theo món là hủy nhầm một lô còn hạn, hoặc
        // hủy lần hai khay đã báo — câu nói sổ đang để lô đó ở đâu (datLo.tonKhac).
        const hanHet = lo
          ? (lo.tinh_trang_han === 'het_han' ? lo.han_dung ?? '' : null)
          : (g.han_dung && datLo.homNay && g.han_dung < datLo.homNay ? g.han_dung : null);
        if (hanHet !== null && (datLo.chiConHan || !lo)) {
          const han = hanHet ? dinhDangNgay(hanHet) : '';
          const mot = p.soGoi === 1;
          const daHet = {
            vi: `${l.vi} ${mon.ten} của ${t.vi} đã hết hạn${han ? ` (hạn dùng ${han})` : ''}`,
            en: `${l.en} of ${mon.ten} from ${t.en} ${mot ? 'has' : 'have'} expired${han ? ` (use-by ${han})` : ''}`,
          };
          const noiSo = (datLo.tonKhac ?? []).filter(x => x.lo_id === g.lo_id && (Number(x.so_goi) > 0 || Number(x.so_kg) > 0));
          const noiKhac = [...new Set(noiSo.filter(x => x.loai_vi_tri !== 'cho_huy').map(x => x.ten_vi_tri))];
          const choHuy = noiSo.find(x => x.loai_vi_tri === 'cho_huy');
          bao(lo ? {
            vi: `${daHet.vi} — chưa ghi vào phiếu này. Để riêng và báo hủy.`,
            en: `${daHet.en} — not added to this slip. Set ${mot ? 'it' : 'them'} aside and write ${mot ? 'it' : 'them'} off.`,
          } : noiKhac.length ? {
            vi: `${daHet.vi} — sổ ghi lô đó ở ${noiKhac.join(', ')}, không ở ${datLo.tenNoiLay}, nên chưa ghi vào phiếu này. Báo hủy từ ${noiKhac[0]}.`,
            en: `${daHet.en} — the books hold that lot at ${noiKhac.join(', ')}, not at ${datLo.tenNoiLay}, so ${mot ? 'it was' : 'they were'} not added to this slip. Write ${mot ? 'it' : 'them'} off from ${noiKhac[0]}.`,
          } : choHuy ? {
            vi: `${daHet.vi} — lô đó đang ở ${choHuy.ten_vi_tri} (đã báo hủy, chờ duyệt), nên chưa ghi vào phiếu này. Hỏi quản lý trước khi báo lại.`,
            en: `${daHet.en} — that lot is already in ${choHuy.ten_vi_tri} (reported, awaiting approval), so ${mot ? 'it was' : 'they were'} not added to this slip. Ask the manager before reporting ${mot ? 'it' : 'them'} again.`,
          } : {
            vi: `${daHet.vi} — sổ không còn khay nào của lô đó, nên chưa ghi vào phiếu này. Để riêng và báo quản lý.`,
            en: `${daHet.en} — the books show nothing left of that lot, so ${mot ? 'it was' : 'they were'} not added to this slip. Set ${mot ? 'it' : 'them'} aside and tell the manager.`,
          });
          hetHan.push(p);
          soHetHan += p.soGoi;
          continue;
        }
        if (!lo) {
          const gi = demGoi ? dv : { vi: 'kg', en: 'kg' };
          lyDo.push({
            vi: `Sổ không còn ${gi.vi} nào của ${t.vi} ở ${datLo.tenNoiLay} — ${l.vi} ${mon.ten} vừa quét ghi theo món, ${theoHan.vi}. Kiểm lại nơi lấy hàng của phiếu.`,
            en: `The books show no ${gi.en} of ${t.en} left at ${datLo.tenNoiLay} — the ${l.en} of ${mon.ten} just scanned go in by item, ${theoHan.en}. Check where this slip takes goods from.`,
          });
          continue;
        }
        const u = ungVien.get(lo.lo_id) ?? { soTang: g.so_tang, lo, soGoi: 0, don: 0 };
        u.soGoi += p.soGoi;
        u.don += p.don;
        ungVien.set(lo.lo_id, u);
      }
      conGhi = phan.filter(p => !hetHan.includes(p));

      // Lô của tảng có đủ trên sổ không — tính cả số đã ghi ở dòng lô đó từ lượt quét trước.
      for (const [loId, u] of ungVien) {
        const cu = datLo.theoLo.filter(x => x.lo_id === loId);
        const t = tang(u.soTang);
        if (demGoi) {
          const daGhi = cu.reduce((tong, x) => tong + (docSoNguyen(x.so_goi, 0, 100000) || 0), 0);
          const con = Number(u.lo.so_goi) || 0;
          if (daGhi + u.soGoi > con) {
            lyDo.push({
              vi: `Sổ chỉ còn ${con} ${dv.vi} ${mon.ten} của ${t.vi} ở ${datLo.tenNoiLay}${daGhi > 0 ? `, phiếu đã ghi ${daGhi}` : ''} mà vừa quét ${u.soGoi} — ${u.soGoi} ${dv.vi} này ghi theo món, ${theoHan.vi}. Kiểm lại xem có ${dv.vi} nào quét hai lần không.`,
              en: `The books show only ${con} ${dv.en} of ${mon.ten} from ${t.en} at ${datLo.tenNoiLay}${daGhi > 0 ? ` (the slip already has ${daGhi})` : ''} but ${u.soGoi} ${u.soGoi === 1 ? 'was' : 'were'} scanned — ${u.soGoi === 1 ? 'it goes' : 'these go'} in by item, ${theoHan.en}. Check whether a label was scanned twice.`,
            });
            continue;
          }
        } else {
          const daGhi = cu.reduce((tong, x) => { const k = docKg(x.so_kg); return tong + (k !== null && !Number.isNaN(k) ? Math.round(k * heSo) : 0); }, 0);
          const con = Math.round(Number(u.lo.so_kg) * heSo);
          // Nhãn không in cân nặng thì không có số kg để ghi vào lô — ghi theo món như trước, không có gì để báo.
          if (!(u.don > 0)) { datHet = false; continue; }
          if (daGhi + u.don > con) {
            lyDo.push({
              vi: `Sổ chỉ còn ${dinhDangKg(con / heSo, 'vi')} kg ${mon.ten} của ${t.vi} ở ${datLo.tenNoiLay}${daGhi > 0 ? `, phiếu đã ghi ${dinhDangKg(daGhi / heSo, 'vi')} kg` : ''} mà vừa quét ${dinhDangKg(u.don / heSo, 'vi')} kg — số vừa quét ghi theo món, ${theoHan.vi}. Kiểm lại xem có nhãn nào quét hai lần không.`,
              en: `The books show only ${dinhDangKg(con / heSo, 'en')} kg of ${mon.ten} from ${t.en} at ${datLo.tenNoiLay}${daGhi > 0 ? ` (the slip already has ${dinhDangKg(daGhi / heSo, 'en')} kg)` : ''} but ${dinhDangKg(u.don / heSo, 'en')} kg was scanned — it goes in by item, ${theoHan.en}. Check whether a label was scanned twice.`,
            });
            continue;
          }
        }
        dat.set(loId, { soTang: u.soTang, soGoi: u.soGoi, don: u.don });
      }
    }
    if (!conGhi.length) continue;

    const tongGoi = conGhi.reduce((t, p) => t + p.soGoi, 0);
    const tongDon = conGhi.reduce((t, p) => t + p.don, 0);
    soDoc += tongGoi;
    if (datLo && datHet && lyDo.length === 0 && dat.size > 0) {
      for (const [loId, d] of dat) {
        theoLo.push({ lo_id: loId, mat_hang_id: mon.id, so_goi: demGoi ? String(d.soGoi) : '', so_kg: d.don > 0 ? chuKg(d.don) : '' });
        const l = luong(d.soGoi, d.don), t = { vi: chuTang(d.soTang, 'vi'), en: chuTang(d.soTang, 'en') };
        daDat.push({ vi: `${l.vi} ${mon.ten}${t.vi ? ` ${t.vi}` : ''}`, en: `${l.en} ${mon.ten}${t.en ? ` ${t.en}` : ''}` });
      }
      continue;
    }
    dong.push({ mat_hang_id: mon.id, so_goi: String(tongGoi), so_kg: tongDon > 0 ? chuKg(tongDon) : '' });
    lyDo.forEach(bao);
  }

  const soNhanHong = gom.loi.length;
  const n = soNhanHong, g = soGoiLa;
  if (n > 0) {
    bao({ vi: `${n} nhãn không đọc được — quét lại ${n > 1 ? 'các gói' : 'gói'} đó`,
          en: `${n} ${n === 1 ? 'label' : 'labels'} could not be read — scan ${n > 1 ? 'those packs' : 'that pack'} again` });
  }
  if (g > 0) {
    bao({ vi: `${g} gói không nhận ra món — để riêng, báo quản lý`,
          en: `${g} ${g === 1 ? 'pack' : 'packs'} not recognised — set ${g === 1 ? 'it' : 'them'} aside and tell the manager` });
  }
  const cauDatLo: HaiThuTieng | null = daDat.length
    ? { vi: `Ghi vào đúng lô của tảng: ${daDat.map(c => c.vi).join(' · ')}.`, en: `Entered on the lot of its primal: ${daDat.map(c => c.en).join(' · ')}.` }
    : null;
  return { dong, theoLo, cauDatLo, loi, loiEn, soMa: ds.length, soDoc, soNhanHong, soGoiLa, maCanLa, soHetHan };
}

/**
 * Tóm tắt hàng bằng chữ thường: "3 gói Thăn ngoại cắt lát (1,52 kg), 0,8 kg
 * Thịt vụn". Dùng cho câu báo sau khi quét và sau khi ghi phiếu. Cùng món ở
 * nhiều dòng thì cộng lại. Nhiều món quá thì "… và N món khác".
 */
export function tomTatHang(
  dong: { mat_hang_id?: unknown; so_goi?: unknown; so_kg?: unknown }[],
  matHang: { id: string; ten: string; dem_goi: boolean; don_vi_goi?: string | null }[],
  toiDa = 3,
  nn: NgonNguNB = 'vi',
): string {
  const mh = new Map(matHang.map(m => [m.id, m]));
  const so = (v: unknown, kg: boolean) => {
    const n = typeof v === 'number' ? v : kg ? docKg(v) : docSoNguyen(v, 0, 100000);
    return n === null || Number.isNaN(n) ? 0 : n;
  };
  const cong = new Map<string, { goi: number; gram: number }>();
  for (const d of dong) {
    const id = String(d.mat_hang_id ?? '');
    if (!mh.has(id)) continue;
    const c = cong.get(id) ?? { goi: 0, gram: 0 };
    c.goi += so(d.so_goi, false);
    c.gram += Math.round(so(d.so_kg, true) * 1000);
    cong.set(id, c);
  }
  const cau = [...cong].map(([id, c]) => {
    const m = mh.get(id)!;
    const kg = c.gram / 1000;
    if (m.dem_goi) return `${c.goi} ${m.don_vi_goi || GOI_MAC_DINH[nn]} ${m.ten}${kg > 0 ? ` (${dinhDangKg(kg, nn)} kg)` : ''}`;
    return `${dinhDangKg(kg, nn)} kg ${m.ten}`;
  });
  if (cau.length <= toiDa) return cau.join(', ');
  const dau = cau.slice(0, toiDa).join(', ');
  const con = cau.length - toiDa;
  return { vi: `${dau} và ${con} món khác`, en: `${dau} and ${con} more ${con === 1 ? 'item' : 'items'}` }[nn];
}

/** Gộp dòng quét vào các dòng đang có: cùng mặt hàng thì cộng dồn. */
export function gopDong(cu: DongXuatForm[], moi: DongXuatForm[]): DongXuatForm[] {
  const ra = cu.filter(d => d.mat_hang_id || d.so_goi || d.so_kg).map(d => ({ ...d }));
  for (const d of moi) {
    const co = ra.find(x => x.mat_hang_id === d.mat_hang_id);
    if (!co) { ra.push({ ...d }); continue; }
    // Số gói đã gõ sai ("1.5"): giữ nguyên để form báo "số gói là số nguyên", không lặng lẽ thay bằng số quét.
    if (Number.isNaN(docSoNguyen(co.so_goi, 0, 100000))) continue;
    const goi = (docSoNguyen(co.so_goi, 0, 100000) || 0) + (docSoNguyen(d.so_goi, 0, 100000) || 0);
    const kgCu = docKg(co.so_kg), kgMoi = docKg(d.so_kg);
    co.so_goi = goi ? String(goi) : '';
    if (kgMoi !== null && !Number.isNaN(kgMoi)) {
      const tong = Math.round(((kgCu !== null && !Number.isNaN(kgCu) ? kgCu : 0) + kgMoi) * 1000) / 1000;
      co.so_kg = String(tong).replace('.', ',');
    }
  }
  return ra;
}

/**
 * Cộng các dòng LÔ vừa quét (dongTuQuet.theoLo) vào các dòng lô đang có trên form: cùng lô thì cộng số gói và kg,
 * dòng lô khác giữ nguyên. Dòng lô đang có số gói mà CHƯA có kg (gõ tay) thì để trống kg sau khi cộng — tổng kg
 * không biết đủ, database tự tính theo cân nặng của lô; cộng riêng kg của nhãn vừa quét sẽ thành kg của cả dòng.
 */
export function gopDongLo(cu: readonly DongLoForm[], moi: readonly DongLoForm[]): DongLoForm[] {
  const ra = cu.map(l => ({ ...l }));
  for (const m of moi) {
    const co = ra.find(x => x.lo_id === m.lo_id);
    if (!co) { ra.push({ ...m }); continue; }
    const goiCu = docSoNguyen(co.so_goi, 0, 100000) || 0, goiMoi = docSoNguyen(m.so_goi, 0, 100000) || 0;
    const kgCu = docKg(co.so_kg), kgMoi = docKg(m.so_kg);
    const coKg = (k: number | null): k is number => k !== null && !Number.isNaN(k);
    /** Phần này biết đủ kg: không có gói nào, hoặc có kg đi kèm. */
    const bietKg = (goi: number, kg: number | null) => goi === 0 || coKg(kg);
    co.so_goi = goiCu + goiMoi ? String(goiCu + goiMoi) : '';
    const tong = (coKg(kgCu) ? kgCu : 0) + (coKg(kgMoi) ? kgMoi : 0);
    co.so_kg = bietKg(goiCu, kgCu) && bietKg(goiMoi, kgMoi) && tong > 0 ? String(Math.round(tong * 1000) / 1000).replace('.', ',') : '';
  }
  return ra;
}

/**
 * Gộp kết quả một lượt "Đọc mã" vào các dòng đang có trên form: dòng theo món cộng vào dòng theo món (gopDong), dòng
 * theo lô cộng vào dòng lô (gopDongLo). Món vừa được đặt vào LÔ của tảng mà form còn một dòng theo món CHƯA CÓ SỐ của
 * chính món đó (phiếu mở từ "Lấy thêm" / "Lấy ra quầy" / món nhanh, hoặc chọn món trước rồi mới quét) thì bỏ dòng
 * trống đó: để lại thì "Ghi phiếu" bị chặn "chưa nhập số", gõ số vào thì lại bị chặn "ghi ở cả hai phần". Dòng đã
 * có số không bao giờ bị bỏ (lúc đó dongTuQuet cũng không đặt món ấy vào lô).
 */
export function gopKetQuaQuet(
  dong: readonly DongXuatForm[], theoLo: readonly DongLoForm[], quet: Pick<KetQuaQuet, 'dong' | 'theoLo'>,
): { dong: DongXuatForm[]; theoLo: DongLoForm[] } {
  const vuaVaoLo = new Set(quet.theoLo.map(l => l.mat_hang_id));
  const giu = dong.filter(d => d.so_goi || d.so_kg || !vuaVaoLo.has(d.mat_hang_id));
  return { dong: gopDong(giu, [...quet.dong]), theoLo: gopDongLo(theoLo, quet.theoLo) };
}

// -----------------------------------------------------------------------------
// ĐƠN VỊ ĐẾM CỦA MÓN TRONG CÂU ("10 khay", không phải "10 gói")
// -----------------------------------------------------------------------------
/**
 * Câu database trả về luôn viết "N gói" (kho_nhan_hang_chuyen, kho_xu_ly_chuyen_thieu, kho_huy_chuyen…). Khi
 * mọi món đếm của phiếu cùng một đơn vị khác "gói" (donViChung) thì đổi ở ĐÂY, cả bản tiếng Việt lẫn tiếng Anh —
 * không sửa chữ trong SQL (kiểm thử khác khớp theo chữ đó). Bản tiếng Anh dịch từ câu GỐC rồi mới đổi đơn vị, vì
 * bảng dịch khớp theo chữ "gói". Chỉ đổi "gói" đi liền sau một con số; câu báo lỗi, đơn vị không biết hoặc vốn là
 * "gói", câu không có số gói → trả nguyên đối tượng cũ.
 */
export function doiDonViCau<K extends KetQua>(kq: K, donVi: string | null | undefined): K {
  if (!kq.ok || !donVi || donVi === GOI_MAC_DINH.vi) return kq;
  // Chữ chung của database ngay sau một con số ("10 gói") — không đụng chữ đó ở chỗ khác trong câu.
  const vi = new RegExp(`(\\d+) ${GOI_MAC_DINH.vi}(?![\\p{L}])`, 'gu');
  if (!vi.test(kq.cau)) return kq;
  const en = (kq.cauEn ?? dichCau('en', kq.cau))
    .replace(/(\d+)( short)? pack(?:\(s\)|s)?(?![a-z])/g, `$1$2 ${donVi}`)
    .replace(vi, `$1 ${donVi}`);
  return { ...kq, cau: kq.cau.replace(vi, `$1 ${donVi}`), cauEn: en };
}

/**
 * Đơn vị đếm chung của TỪNG phiếu trong một danh sách (hộp Duyệt, danh sách phiếu): phieu_id → "khay". Phiếu
 * có món khác đơn vị, chỉ có món cân ký, hoặc không đọc được → vắng mặt, trang dùng chữ chung "gói". Hai lượt
 * đọc song song cho cả danh sách (dòng của mọi phiếu + đơn vị của danh mục), không mỗi phiếu một lượt. Đọc hỏng
 * không làm hỏng trang: trả Map rỗng.
 */
export async function docDonViPhieuXuat(client: SupabaseClient, phieuIds: readonly unknown[]): Promise<Map<string, string>> {
  const ra = new Map<string, string>();
  const ids = [...new Set(phieuIds.filter(laUuid))];
  if (!ids.length) return ra;
  try {
    const [d, m] = await Promise.all([
      client.from('kho_phieu_xuat_dong').select('phieu_xuat_id, mat_hang_id').in('phieu_xuat_id', ids),
      client.from('kho_mat_hang').select('id, dem_goi, don_vi_goi'),
    ]);
    // Đủ 1.000 dòng là mức PostgREST cắt bớt mà không báo: không chắc đã thấy hết món của phiếu → dùng chữ chung.
    if (d.error || m.error || (d.data ?? []).length >= 1000) return ra;
    const mon = new Map((m.data ?? []).map(r => [r.id as string, r as { dem_goi: boolean; don_vi_goi: string | null }]));
    const theoPhieu = new Map<string, string[]>();
    for (const r of d.data ?? []) {
      const id = r.phieu_xuat_id as string;
      theoPhieu.set(id, [...(theoPhieu.get(id) ?? []), r.mat_hang_id as string]);
    }
    for (const [id, cacMon] of theoPhieu) {
      // Một món của phiếu không có trong danh mục đọc được → không chắc đơn vị, bỏ qua phiếu đó.
      if (cacMon.some(x => !mon.has(x))) continue;
      const dv = donViChung(cacMon.map(x => mon.get(x)));
      if (dv) ra.set(id, dv);
    }
  } catch { return new Map(); }
  return ra;
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
export interface KetQuaXuat extends KetQua {
  id?: string;
  doc?: KetQuaDocXuat;
  /** Ảnh báo hủy đã lên kho file — trang giữ lại trong ô ẩn khi phải gửi lại. */
  anh?: string[];
}

// -----------------------------------------------------------------------------
// ẢNH BÁO HỦY — giữ qua các lần gửi
// -----------------------------------------------------------------------------
/** Phiếu báo hủy nhận tối đa 8 ảnh (kho_tao_phieu_xuat, 0023). */
const TOI_DA_ANH = 8;

/**
 * Ảnh cũ (ô ẩn) + tải ảnh vừa chọn. Gọi ở MỌI lần gửi của form báo hủy có
 * chọn ảnh — "Đọc mã", "Thêm dòng", ghi bị lỗi — vì ô chọn file không điền
 * lại được: không tải ngay thì ảnh mất. Số thứ tự nối tiếp ảnh cũ, không đè.
 */
export async function giuAnhHuy(
  client: SupabaseClient, chiNhanhId: string, form: FormData, maGui: string,
): Promise<{ duongDan: string[]; loi: string[]; loiEn: string[] }> {
  const cu = docAnhDaTai(form, chiNhanhId, 'huy', maGui, TOI_DA_ANH);
  const tep = layTepAnh(form);
  if (tep.length === 0 || !laUuid(maGui)) return { duongDan: cu, loi: [], loiEn: [] };
  const con = TOI_DA_ANH - cu.length;
  if (con <= 0) {
    const du = { vi: `Đã đủ ${TOI_DA_ANH} ảnh — ảnh mới không được thêm.`, en: `There are already ${TOI_DA_ANH} photos — new photos were not added.` };
    return { duongDan: cu, loi: [du.vi], loiEn: [du.en] };
  }
  const batDau = soThuTuCuoi(cu) + 1;
  const tai = await taiAnh(client, chiNhanhId, 'huy', maGui, tep.slice(0, con), batDau);
  const loi = [...tai.loi];
  const loiEn = [...tai.loiEn];
  if (tep.length > con) {
    const bo = tep.length - con;
    const cau: HaiThuTieng = {
      vi: `Mỗi phiếu tối đa ${TOI_DA_ANH} ảnh — ${bo} ảnh sau bị bỏ qua.`,
      en: `Each slip takes at most ${TOI_DA_ANH} photos — the last ${bo} ${bo === 1 ? 'photo was' : 'photos were'} skipped.`,
    };
    loi.push(cau.vi);
    loiEn.push(cau.en);
  }
  return { duongDan: [...cu, ...tai.duongDan], loi, loiEn };
}

export async function taoPhieuXuat(
  client: SupabaseClient, chiNhanhId: string, form: FormData,
  ctx: {
    loai: LoaiXuat;
    viTriId: string;
    matHang: { id: string; ten: string; dem_goi: boolean; don_vi_goi?: string | null }[];
    /** Lý do đang dùng — để biết lý do nào cần ảnh TRƯỚC khi tải ảnh, gọi database. */
    lyDo?: { id: string; ten: string; can_anh: boolean }[];
    /** Nơi nhận của phiếu chuyển — để câu báo nói "ra Quầy thịt". */
    den?: { ten: string; loai: string } | null;
  },
): Promise<KetQuaXuat> {
  const doc = docFormPhieuXuat(form, ctx.matHang);
  const maGui = String(form.get('ma_gui') ?? '');
  if (!laUuid(maGui)) return { ...kqHai(false, CAU_XUAT.formCu), doc };
  const den = String(form.get('vi_tri_den_id') ?? '');
  const lyDo = String(form.get('ly_do_id') ?? '');
  const loi = [...doc.loi];
  const loiEn = [...doc.loiEn];
  const bao: BaoLoi = c => { loi.push(c.vi); loiEn.push(c.en); };

  let anh: string[] = [];
  // Lưu ý về ảnh, nối vào cuối câu báo (hai thứ tiếng).
  let cauAnh: HaiThuTieng = { vi: '', en: '' };
  if (ctx.loai === 'huy') {
    // Kiểm lý do cần ảnh NGAY Ở ĐÂY, trước khi tải ảnh và gọi database: phiếu
    // chắc chắn bị từ chối thì báo luôn, bằng câu dễ hiểu.
    const ld = ctx.lyDo?.find(l => l.id === lyDo) ?? null;
    const coAnh = docAnhDaTai(form, chiNhanhId, 'huy', maGui, TOI_DA_ANH).length > 0 || layTepAnh(form).length > 0;
    if (!laUuid(lyDo)) bao(CAU_XUAT.chuaLyDoHuy);
    else if (ld?.can_anh && !coAnh) {
      bao({ vi: `Lý do "${ld.ten}" cần ảnh chụp hàng — chụp ít nhất một ảnh`,
            en: `The reason "${ld.ten}" needs a photo of the goods — take at least one photo` });
    }
    // Có ảnh thì tải và giữ luôn, kể cả khi form còn lỗi — sửa lỗi xong không phải chụp lại.
    const tai = await giuAnhHuy(client, chiNhanhId, form, maGui);
    anh = tai.duongDan;
    if (tai.loi.length) cauAnh = { vi: ` Lưu ý ảnh: ${tai.loi.join(' · ')}`, en: ` Photo note: ${tai.loiEn.join(' · ')}` };
    if (ld?.can_anh && coAnh && anh.length === 0) {
      bao({ vi: `Lý do "${ld.ten}" cần ảnh chụp hàng — ảnh chưa tải lên được, chụp lại`,
            en: `The reason "${ld.ten}" needs a photo of the goods — the photo could not be uploaded, take it again` });
    }
  }
  // Xuất khác: database bắt buộc lý do (0032) — báo trước bằng câu dễ hiểu.
  if (ctx.loai === 'xuat_khac' && !laUuid(lyDo)) bao(CAU_XUAT.chuaLyDoXuat);
  const noiAnh = (c: HaiThuTieng) => kqHai(false, { vi: c.vi + cauAnh.vi, en: c.en + cauAnh.en });
  if (loi.length) return { ...noiAnh({ vi: loi.join(' · '), en: loiEn.join(' · ') }), doc, anh };
  if (doc.payload.length === 0) return { ...noiAnh(CAU_XUAT.chuaCoDong), doc, anh };

  const { data, error } = await client.rpc('kho_tao_phieu_xuat', {
    p_chi_nhanh_id: chiNhanhId,
    p_ma_gui: maGui,
    p_loai: ctx.loai,
    p_vi_tri_id: ctx.viTriId,
    p_vi_tri_den_id: ctx.loai === 'chuyen' && laUuid(den) ? den : null,
    p_ly_do_id: laUuid(lyDo) ? lyDo : null,
    p_ghi_chu: String(form.get('ghi_chu') ?? '').trim() || null,
    p_anh: anh,
    p_dong: doc.payload,
  });
  if (error) {
    const loiDb = cauLoiKho(error);
    return { ...noiAnh({ vi: loiDb, en: dichCau('en', loiDb) }), doc, anh };
  }
  const kq = (Array.isArray(data) ? data[0] : data) as { phieu_id: string; so_phieu: string; da_co: boolean } | undefined;
  if (!kq) return { ...kqHai(false, CAU_XUAT.khongChac), doc, anh };
  const hang: HaiThuTieng = {
    vi: tomTatHang(doc.payload, ctx.matHang) || CAU_XUAT.hang.vi,
    en: tomTatHang(doc.payload, ctx.matHang, 3, 'en') || CAU_XUAT.hang.en,
  };
  // Phiếu chuyển ra quầy có thể thành hàng đi đường (cài đặt + vai người lập
  // do database quyết) — đọc lại trạng thái để câu báo nói đúng. Đọc lại lỗi
  // (mạng chập) thì KHÔNG đoán: diDuong = null → câu chỉ nói phiếu đã ghi.
  let diDuong: boolean | null = false;
  if (ctx.loai === 'chuyen' && !kq.da_co) {
    const { data: tt, error: eTt } = await client.from('kho_phieu_xuat').select('trang_thai').eq('id', kq.phieu_id).maybeSingle();
    diDuong = eTt || !tt ? null : tt.trang_thai === 'dang_chuyen';
  }
  const tenLyDo = ctx.lyDo?.find(l => l.id === lyDo)?.ten;
  const cau = cauDaGhi(kq.so_phieu, kq.da_co, ctx.loai, hang, { tenLyDo, diDuong, den: ctx.den ?? null });
  return { ...kqHai(true, { vi: cau.vi + cauAnh.vi, en: cau.en + cauAnh.en }), id: kq.phieu_id };
}

/** Câu báo sau khi ghi phiếu: đã ghi từ trước, đã báo hủy, đã đưa bếp, đang mang ra quầy… */
function cauDaGhi(
  soPhieu: string, daCo: boolean, loai: LoaiXuat, hang: HaiThuTieng,
  t: { tenLyDo: string | undefined; diDuong: boolean | null; den: { ten: string; loai: string } | null },
): HaiThuTieng {
  const { tenLyDo, diDuong, den } = t;
  if (daCo) return { vi: `Phiếu ${soPhieu} đã được ghi từ lần bấm trước.`, en: `Slip ${soPhieu} was already recorded by the previous press.` };
  if (loai === 'huy') {
    return { vi: `Đã báo hủy ${hang.vi} — hàng đã để riêng ở "Hàng chờ hủy", chờ quản lý duyệt.`,
             en: `Write-off reported for ${hang.en} — the goods are set aside in "Awaiting write-off" until a manager approves.` };
  }
  if (loai === 'xuat_bep') return { vi: `Đã đưa bếp ${hang.vi}.`, en: `Sent to the kitchen: ${hang.en}.` };
  if (loai === 'xuat_khac') {
    return { vi: `Đã xuất ${hang.vi}${tenLyDo ? ` (${tenLyDo})` : ''}.`, en: `Issued ${hang.en}${tenLyDo ? ` (${tenLyDo})` : ''}.` };
  }
  if (diDuong === null) {
    return { vi: `Đã ghi phiếu chuyển ${soPhieu} (${hang.vi}). Chưa đọc lại được trạng thái — mở phiếu để xem hàng đã vào ${den?.ten ?? 'nơi nhận'} hay đang mang đi.`,
             en: `Transfer slip ${soPhieu} recorded (${hang.en}). Its status could not be read back — open the slip to see whether the goods are already at ${den?.ten ?? 'the destination'} or still on the way.` };
  }
  if (diDuong) {
    return { vi: `Đang mang ${hang.vi} ra ${den?.ten ?? 'quầy'} — quầy kiểm hàng rồi bấm "Đã nhận" thì hàng mới vào quầy.`,
             en: `${hang.en} on the way to ${den?.ten ?? 'the counter'} — the goods only go into the counter once counter staff check them and press "Received".` };
  }
  if (den) {
    return { vi: `Đã chuyển ${hang.vi} ${den.loai === 'quay' ? 'ra' : 'về'} ${den.ten}.`, en: `Transferred ${hang.en} to ${den.ten}.` };
  }
  return { vi: `Đã chuyển ${hang.vi}.`, en: `Transferred ${hang.en}.` };
}

const CAU_XUAT = {
  formCu: { vi: 'Form đã cũ — tải lại trang rồi nhập lại.', en: 'This form is out of date — reload the page and enter it again.' },
  chuaLyDoHuy: { vi: 'Chưa chọn lý do hủy', en: 'No write-off reason chosen' },
  chuaLyDoXuat: { vi: 'Chưa chọn lý do xuất (dùng nội bộ, tặng khách…)', en: 'No issue reason chosen (staff use, gift to a guest…)' },
  chuaCoDong: {
    vi: 'Chưa có dòng hàng nào — chọn mặt hàng hoặc ghi số gói ở lô cần lấy.',
    en: 'No goods lines yet — choose an item, or enter the number of packs at the lot to take.',
  },
  khongChac: { vi: 'Không chắc đã ghi hay chưa — xem danh sách phiếu để kiểm tra.', en: 'Not sure whether it was saved — check the list of slips.' },
  hang: { vi: 'hàng', en: 'goods' },
  xong: { vi: 'Xong.', en: 'Done.' },
  ghiLyDo: { vi: 'Ghi lý do trước (vd. còn ở kho, rơi vỡ, thất lạc…)', en: 'Write a reason first (e.g. still in the store, dropped, lost…)' },
} satisfies Record<string, HaiThuTieng>;

/**
 * Phiếu trả nhà cung cấp: nhà cung cấp của phiếu nhập gốc — để nút quay lại
 * đưa về trang công nợ của đúng nhà cung cấp đó. Vai không xem giá không đọc
 * được phiếu nhập (RLS) → null.
 */
export async function docNhaCungCapCuaPhieuNhap(client: SupabaseClient, phieuNhapId: string | null): Promise<string | null> {
  if (!laUuid(phieuNhapId)) return null;
  try {
    const { data } = await client.from('kho_phieu_nhap').select('nha_cung_cap_id').eq('id', phieuNhapId).maybeSingle();
    return (data?.nha_cung_cap_id as string | null | undefined) ?? null;
  } catch {
    return null;
  }
}

/** Câu database (màn tiếng Anh tra dichCau lúc hiện); database không trả câu nào thì "Xong.". */
async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return data === null || data === undefined ? kqHai(true, CAU_XUAT.xong) : { ok: true, cau: String(data) };
}

export function duyetHuy(client: SupabaseClient, id: string) {
  return cauTraVe(client.rpc('kho_duyet_phieu_huy', { p_id: id }));
}
export function tuChoiHuy(client: SupabaseClient, id: string, lyDo: string) {
  return cauTraVe(client.rpc('kho_tu_choi_phieu_huy', { p_id: id, p_ly_do: lyDo }));
}

// -----------------------------------------------------------------------------
// HÀNG ĐI ĐƯỜNG — xử lý thiếu, hủy chuyến (0032)
// -----------------------------------------------------------------------------
/**
 * Quầy nhận thiếu → quản lý chọn: hàng còn ở kho thì trả về kho, rơi vỡ /
 * thất lạc thì ghi mất. Web bắt ghi lý do cả hai cách (database chỉ bắt khi
 * ghi mất) — sau này đọc lại còn biết vì sao.
 */
export function xuLyChuyenThieu(client: SupabaseClient, id: string, cach: 'tra_ve' | 'mat', lyDo: string) {
  if (!lyDo.trim()) return Promise.resolve<KetQua>(kqHai(false, CAU_XUAT.ghiLyDo));
  return cauTraVe(client.rpc('kho_xu_ly_chuyen_thieu', { p_id: id, p_cach: cach, p_ly_do: lyDo.trim() }));
}

/** Người lập (hoặc quản lý) hủy chuyến khi quầy chưa bấm nhận: hàng về lại chỗ cũ. */
export function huyChuyenDiDuong(client: SupabaseClient, id: string, lyDo: string) {
  return cauTraVe(client.rpc('kho_huy_chuyen', { p_id: id, p_ly_do: lyDo.trim() || null }));
}

/**
 * Nút nào hiện trên một phiếu chuyển đi đường (hàm thuần). Database vẫn kiểm
 * lại quyền — đây chỉ để không hiện nút mà bấm vào chắc chắn bị từ chối.
 *   · huyChuyen: phiếu đang mang ra, người xem là người lập hoặc có quyền duyệt.
 *   · xuLyThieu: phiếu nhận thiếu, người xem có quyền duyệt.
 *   · diNhan:    phiếu đang mang ra, người xem không phải người lập (thường là
 *                NV quầy) — chỉ đường sang màn Nhận hàng.
 */
export function nutPhieuChuyen(
  p: { loai: string; trang_thai: string; nguoi_tao: string | null },
  nguoiXem: { id: string | null; duyet: boolean; vanHanh: boolean },
): { huyChuyen: boolean; xuLyThieu: boolean; diNhan: boolean } {
  if (p.loai !== 'chuyen') return { huyChuyen: false, xuLyThieu: false, diNhan: false };
  const laNguoiLap = !!nguoiXem.id && nguoiXem.id === p.nguoi_tao;
  const dangMang = p.trang_thai === 'dang_chuyen';
  return {
    huyChuyen: dangMang && nguoiXem.vanHanh && (laNguoiLap || nguoiXem.duyet),
    xuLyThieu: p.trang_thai === 'nhan_thieu' && nguoiXem.duyet,
    diNhan: dangMang && nguoiXem.vanHanh && !laNguoiLap,
  };
}

// -----------------------------------------------------------------------------
// BÁO HỦY 3 BƯỚC — hàm thuần
// -----------------------------------------------------------------------------
export type BuocHuy = 'hang' | 'ly_do' | 'anh';

/**
 * Sau một lần gửi form báo hủy, hiện bước nào.
 *   viec: quet | them_dong | them_mh | buoc_hang   → ở lại / quay về bước Hàng
 *         buoc_ly_do                                → sang bước Lý do (nếu hàng ổn)
 *         chon_ly_do                                → sang bước Ảnh (nếu đã có lý do)
 *         ghi (bị từ chối)                          → về đúng bước còn thiếu
 * hangXong: đã có ít nhất một dòng hàng và không dòng nào lỗi.
 * Luôn lùi về bước sớm nhất còn thiếu — không để người dùng ở bước Ảnh khi
 * chưa có hàng.
 */
export function buocHuySau(viec: string, t: { hangXong: boolean; coLyDo: boolean }): BuocHuy {
  if (viec === 'quet' || viec === 'them_dong' || viec === 'them_mh' || viec === 'buoc_hang' || !t.hangXong) return 'hang';
  if (viec === 'buoc_ly_do' || !t.coLyDo) return 'ly_do';
  return 'anh';
}

// -----------------------------------------------------------------------------
// XUẤT BẾP NHANH — món hay dùng
// -----------------------------------------------------------------------------
/**
 * Các món hay đưa bếp nhất (hàm thuần): đếm số PHIẾU có món đó (một phiếu ghi
 * món hai dòng vẫn tính một), nhiều lần hơn đứng trước; bằng nhau thì món
 * dùng gần đây hơn đứng trước. dong: dòng của các phiếu, phiếu mới nhất trước.
 */
export function monHayDung(dong: { phieu_id: string; mat_hang_id: string }[], toiDa = 6): string[] {
  const dem = new Map<string, { lan: Set<string>; thuTu: number }>();
  dong.forEach((d, i) => {
    const c = dem.get(d.mat_hang_id) ?? { lan: new Set<string>(), thuTu: i };
    c.lan.add(d.phieu_id);
    dem.set(d.mat_hang_id, c);
  });
  return [...dem]
    .sort(([, a], [, b]) => b.lan.size - a.lan.size || a.thuTu - b.thuTu)
    .slice(0, toiDa)
    .map(([id]) => id);
}

/** 6 món hay đưa bếp nhất trong 40 phiếu xuất bếp gần đây của chi nhánh. Lỗi đọc → không có nút nhanh. */
export async function docMonHayDungBep(client: SupabaseClient, chiNhanhId: string, toiDa = 6): Promise<string[]> {
  try {
    const { data: phieu } = await client
      .from('kho_phieu_xuat').select('id')
      .eq('chi_nhanh_id', chiNhanhId).eq('loai', 'xuat_bep')
      .order('created_at', { ascending: false }).limit(40);
    const ids = (phieu ?? []).map(p => p.id as string);
    if (ids.length === 0) return [];
    const { data: dong } = await client
      .from('kho_phieu_xuat_dong').select('phieu_xuat_id, mat_hang_id')
      .in('phieu_xuat_id', ids);
    const thuTu = new Map(ids.map((id, i) => [id, i]));
    const ds = (dong ?? [])
      .map(d => ({ phieu_id: d.phieu_xuat_id as string, mat_hang_id: d.mat_hang_id as string }))
      .sort((a, b) => (thuTu.get(a.phieu_id) ?? 0) - (thuTu.get(b.phieu_id) ?? 0));
    return monHayDung(ds, toiDa);
  } catch {
    return [];
  }
}
