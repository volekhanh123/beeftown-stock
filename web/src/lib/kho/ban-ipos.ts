/**
 * KHO — BÁN HÀNG iPOS: TRẠNG THÁI, CẤU HÌNH, HÀNG CHỜ, GHÉP MÃ (GĐ7a 0037, GĐ7c 0042)
 *
 * Màn dùng file này:
 *   · /noi-bo/kho/cai-dat/ipos  — Kết nối iPOS: đèn trạng thái, "Cập nhật ngay"
 *     (lib/kho/ipos-dong-bo.ts), form cấu hình, chuyển sang / quay lại đếm quầy,
 *     nhật ký 10 lượt.
 *   · /noi-bo/kho/ban-ipos      — dòng bán chưa trừ được kho: thử lại, hàng
 *     ngoài sổ, bỏ qua.
 *   · /noi-bo/kho/ban-ipos/ghep — ghép mã món iPOS với món kho, chọn "bán theo"
 *     kg / gói / suất (kho_ipos_gan_ma_v2, 0042), thực đơn iPOS (kho_ipos_menu).
 *   · Trang chủ quản lý: thẻ nhỏ trạng thái iPOS.
 *
 * TOKEN iPOS KHÔNG ĐI QUA FILE NÀY. Nó là bí mật Worker IPOS_ACCESS_TOKEN,
 * chỉ lib/kho/ipos-dong-bo.ts đọc. Form cấu hình từ chối mọi ô có chữ "token"
 * trước khi gửi (database cũng từ chối — kho_ipos_luu_cau_hinh).
 *
 * Phần thuần (đọc form, gom mã chưa ghép, gợi ý món, câu chữ) không gọi
 * database — test bằng Node. Phần gọi database dùng client mang token của
 * người đang xem (RLS: dòng có tiền chỉ vai xem_gia thấy).
 *
 * HAI THỨ TIẾNG: bảng nhãn có bản `…_NB` ({ vi, en }; bảng tên cũ dựng lại từ
 * đó), đọc form trả thêm loiEn, câu báo KetQua mang cauEn. Câu của database
 * (TrangThaiIpos.cau, ly_do) đi nguyên văn — trang tra dichCau.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { boDau, cauLoiKho, docSoNguyen, kqHai, laUuid, type HaiThuTieng, type KetQua, type NgonNguNB } from './chung.ts';
import { dichCau } from '../cau-noi-bo.ts';
import { apDungTim, type TimDs } from './tim-ds.ts';
import { docGioVnDiaPhuong, gioVnTuMs } from '../gio-vn.ts';

// -----------------------------------------------------------------------------
// KIỂU
// -----------------------------------------------------------------------------
export type DenIpos = 'xanh' | 'vang' | 'do';

export interface LanChayIpos {
  id: string;
  nguon: 'cron' | 'tay' | 'callback';
  bat_dau_luc: string;
  ket_thuc_luc: string | null;
  so_hd: number;
  so_dong: number;
  so_da_ghi: number;
  loi: string | null;
}

/** Kết quả kho_ipos_trang_thai (0037, thêm trường 0042) — không tiền, không token. */
export interface TrangThaiIpos {
  co_cau_hinh: boolean;
  bat: boolean;
  cau_hinh_du: boolean;
  nguon_so_ban: 'kiem_ke' | 'ipos';
  api_url: string;
  pos_parent: string | null;
  pos_id: string | null;
  duong_dan_hoa_don: string | null;
  vi_tri_ban_id: string | null;
  gio_mo_cua: number;
  gio_dong_cua: number;
  /** Trong giờ mở cửa, quá bấy nhiêu giờ không nhận hóa đơn thì báo mất kết nối (0042). */
  gio_mat_ket_noi: number;
  ipos_tu_luc: string | null;
  dong_bo_den_luc: string | null;
  dang_chay: boolean;
  lan_cuoi_luc: string | null;
  lan_cuoi_loi: string | null;
  lan_ok_luc: string | null;
  /** Lần cuối nhận được hóa đơn iPOS (0042). */
  nhan_hd_luc: string | null;
  /** Lần cuối hộp thư được xử lý (callback / thử lại hàng chờ) (0042). */
  hop_thu_luc: string | null;
  /** Lần cuối đọc được thực đơn iPOS; iPOS báo thực đơn đổi (0042). */
  menu_luc: string | null;
  menu_can_lam_moi: boolean;
  so_mon_menu: number;
  mat_ket_noi: boolean;
  den: DenIpos;
  cau: string;
  cho_xu_ly: number;
  dem: { cho: number; chua_khop: number; thieu_hang: number; loi: number; het_han: number; da_ghi_hom_nay: number };
  lan_chay: LanChayIpos[];
}

export type TrangThaiDong = 'cho' | 'da_ghi' | 'chua_khop' | 'thieu_hang' | 'bo_qua' | 'da_huy' | 'loi';

/** Một dòng của view kho_v_ipos_dong. */
export interface DongIpos {
  id: string;
  ma_hd: string;
  thoi_diem_ban: string;
  ngay_ban: string;
  ma_ipos: string | null;
  ten_ipos: string | null;
  ma_vach: string | null;
  ma_can: string | null;
  so_kg: number | null;
  so_goi: number | null;
  /** Số lượng gốc iPOS gửi (0042). */
  so_luong: number | null;
  thanh_tien: number | null;
  mat_hang_id: string | null;
  ten_mat_hang: string | null;
  trang_thai: TrangThaiDong;
  so_lan_thu: number;
  ly_do: string | null;
  lo_het_han: boolean;
  xu_ly_luc: string | null;
  /** 0051: ô mã của dòng, số tảng của lô ô lúc bán, có lệch ô (trừ theo hạn gần nhất). */
  so_o?: number | null;
  so_tang?: number | null;
  lech_o?: boolean;
}

export type DonViBan = 'kg' | 'goi' | 'suat';

export interface MaIposDaGhep {
  ma_ipos: string;
  ten_ipos: string | null;
  kieu: 'goi_can' | 'mon' | 'bo_qua';
  mat_hang_id: string | null;
  /** Ô mã (0051): bán món này trừ đúng lô của tảng đang giữ ô. */
  o_ma_id?: string | null;
  /** Bán theo (0042): null = theo món kho. */
  don_vi_ban: DonViBan | null;
  kg_moi_don_vi: number | null;
}

/** Một món trên thực đơn iPOS (kho_ipos_menu, 0042) — không giá. */
export interface MonMenuIpos {
  ma_ipos: string;
  ten_ipos: string | null;
  loai: string | null;
  dang_ban: boolean;
}

/** Lựa chọn "Bán theo" ở màn Ghép món. '' = theo món kho. Hai thứ tiếng. */
export const CHON_DON_VI_BAN_NB: readonly { ma: '' | DonViBan; ten: HaiThuTieng; giai: HaiThuTieng }[] = [
  { ma: '', ten: { vi: 'Theo món kho', en: 'As the stock item' },
    giai: { vi: 'Món đếm gói → mỗi số lượng là 1 gói; món theo kg → số lượng là kg.',
            en: 'Pack-counted item → each unit is 1 pack; kg item → the quantity is kg.' } },
  { ma: 'kg', ten: { vi: 'Theo kg', en: 'By kg' },
    giai: { vi: 'iPOS gõ số kg (vd 0,45). Món đếm gói thì lấy gói nguyên gần số kg nhất, lệch ghi hao hụt.',
            en: 'iPOS enters the kg (e.g. 0.45). For a pack-counted item, the whole pack closest to that weight is taken; the difference is recorded as weight loss.' } },
  { ma: 'goi', ten: { vi: 'Theo gói', en: 'By pack' },
    giai: { vi: 'Mỗi số lượng là 1 gói. Món kho tính theo kg thì điền "mỗi gói = … kg".',
            en: 'Each unit is 1 pack. If the stock item is tracked in kg, fill in "each pack = … kg".' } },
  { ma: 'suat', ten: { vi: 'Theo suất (món chế biến)', en: 'By portion (cooked dish)' },
    giai: { vi: 'Món bếp nấu (phở, lẩu…): kho không trừ, chỉ đếm suất để so định lượng.',
            en: 'Dishes the kitchen cooks (pho, hotpot…): no stock is deducted; portions are only counted to compare with recipes.' } },
];
/** Bản chỉ tiếng Việt (tên cũ, giữ cho code và test cũ). */
export const CHON_DON_VI_BAN: readonly { ma: '' | DonViBan; ten: string; giai: string }[] =
  CHON_DON_VI_BAN_NB.map(c => ({ ma: c.ma, ten: c.ten.vi, giai: c.giai.vi }));

export function tenDonViBan(v: string | null | undefined, nn: NgonNguNB = 'vi'): string {
  return (CHON_DON_VI_BAN_NB.find(c => c.ma === (v ?? '')) ?? CHON_DON_VI_BAN_NB[0]).ten[nn];
}

// -----------------------------------------------------------------------------
// CÂU CHỮ — thuần
// -----------------------------------------------------------------------------
export const TEN_TRANG_THAI_DONG_NB: Record<TrangThaiDong, [HaiThuTieng, string]> = {
  cho:        [{ vi: 'Chờ', en: 'Waiting' }, 'tat'],
  da_ghi:     [{ vi: 'Đã trừ kho', en: 'Deducted from stock' }, 'song'],
  chua_khop:  [{ vi: 'Chưa ghép món', en: 'Not matched' }, 'cho'],
  thieu_hang: [{ vi: 'Thiếu hàng trên sổ', en: 'Short on the books' }, 'cho'],
  bo_qua:     [{ vi: 'Bỏ qua', en: 'Skipped' }, 'tat'],
  da_huy:     [{ vi: 'Hóa đơn đã hủy', en: 'Invoice cancelled' }, 'tat'],
  loi:        [{ vi: 'Lỗi', en: 'Error' }, 'cho'],
};
/** Bản chỉ tiếng Việt (tên cũ, giữ cho code và test cũ). */
export const TEN_TRANG_THAI_DONG: Record<TrangThaiDong, [string, string]> = Object.fromEntries(
  Object.entries(TEN_TRANG_THAI_DONG_NB).map(([k, [ten, lop]]) => [k, [ten.vi, lop]]),
) as Record<TrangThaiDong, [string, string]>;

/** Nhãn và lớp CSS của trạng thái một dòng bán theo ngôn ngữ; trạng thái lạ → [mã, 'tat']. */
export function trangThaiDong(ma: string | null | undefined, nn: NgonNguNB = 'vi'): [string, string] {
  const x = ma ? TEN_TRANG_THAI_DONG_NB[ma as TrangThaiDong] : undefined;
  return x ? [x[0][nn], x[1]] : [ma ?? '', 'tat'];
}

/** Thẻ lọc của màn Bán hàng iPOS. Thẻ đầu là mặc định. "Chưa khớp" gồm cả dòng lỗi. */
export const THE_DONG_NB: readonly { ma: string; ten: HaiThuTieng; trangThai: TrangThaiDong[] }[] = [
  { ma: 'chua_khop', ten: { vi: 'Chưa khớp', en: 'Unmatched' }, trangThai: ['chua_khop', 'loi'] },
  { ma: 'thieu_hang', ten: { vi: 'Thiếu hàng', en: 'Short stock' }, trangThai: ['thieu_hang'] },
  { ma: 'da_ghi', ten: { vi: 'Đã ghi', en: 'Recorded' }, trangThai: ['da_ghi'] },
  { ma: 'bo_qua', ten: { vi: 'Bỏ qua', en: 'Skipped' }, trangThai: ['bo_qua', 'da_huy'] },
];
/** Bản chỉ tiếng Việt (tên cũ, giữ cho code và test cũ). */
export const THE_DONG: readonly { ma: string; ten: string; trangThai: TrangThaiDong[] }[] =
  THE_DONG_NB.map(t => ({ ...t, ten: t.ten.vi }));

export function docThe(v: string | null | undefined): (typeof THE_DONG)[number] {
  return THE_DONG.find(t => t.ma === v) ?? THE_DONG[0];
}

/** Lớp của khung báo theo màu đèn (nb-bao xong / luu-y / loi). */
export function lopDen(den: DenIpos | string | null | undefined): 'xong' | 'luu-y' | 'loi' {
  return den === 'xanh' ? 'xong' : den === 'do' ? 'loi' : 'luu-y';
}

export function chuDen(den: DenIpos | string | null | undefined, nn: NgonNguNB = 'vi'): string {
  const c = den === 'xanh' ? { vi: 'Đang chạy tốt', en: 'Running well' }
    : den === 'do' ? { vi: 'Mất kết nối', en: 'Disconnected' }
    : { vi: 'Cần xem', en: 'Needs attention' };
  return c[nn];
}

/** Cách xử lý dòng chờ mà database nhận. */
export const CACH_XU_LY = ['thu_lai', 'bo_qua', 'ngoai_so'] as const;
export type CachXuLy = (typeof CACH_XU_LY)[number];

// -----------------------------------------------------------------------------
// ĐỌC FORM — thuần
// -----------------------------------------------------------------------------
export interface CauHinhGui {
  bat: boolean;
  api_url: string;
  pos_parent: string;
  pos_id: string;
  vi_tri_ban_id: string;
  gio_mo_cua: number;
  gio_dong_cua: number;
  gio_mat_ket_noi: number;
}

// 0042: iPOS tự đẩy hóa đơn — không còn ô "đường dẫn lấy hóa đơn" (cột DB giữ nguyên, không gửi).
const COT_CAU_HINH = ['api_url', 'pos_parent', 'pos_id'] as const;

/**
 * Form Kết nối iPOS → object gửi kho_ipos_luu_cau_hinh. Chỉ các khóa database
 * nhận; ô nào có chữ "token" bị từ chối NGAY (không gửi đi đâu cả) — token là
 * bí mật Worker, không bao giờ vào database. loiEn: bản tiếng Anh của loi.
 */
export function docFormCauHinhIpos(form: FormData): { cauHinh: CauHinhGui | null; loi: string | null; loiEn: string | null } {
  const chu = (k: string) => String(form.get(k) ?? '').trim();
  const hong = (c: HaiThuTieng) => ({ cauHinh: null, loi: c.vi, loiEn: c.en });
  for (const k of COT_CAU_HINH) {
    if (/token/i.test(chu(k))) {
      return hong({
        vi: 'Không dán token vào đây. Token iPOS là bí mật của máy chủ — người quản lý Cloudflare cài bằng lệnh npx wrangler secret put IPOS_ACCESS_TOKEN.',
        en: 'Do not paste a token here. The iPOS token is a server secret — whoever manages Cloudflare sets it with the command npx wrangler secret put IPOS_ACCESS_TOKEN.',
      });
    }
  }
  const api = chu('api_url').replace(/\/+$/, '');
  if (api && !/^https:\/\/[A-Za-z0-9.-]+(:[0-9]{1,5})?(\/[A-Za-z0-9._~/-]*)?$/.test(api)) {
    return hong({
      vi: 'Địa chỉ iPOS phải bắt đầu bằng https:// và không có dấu ? hay tham số.',
      en: 'The iPOS address must start with https:// and have no ? or parameters.',
    });
  }
  for (const [k, ten] of [['pos_parent', 'pos_parent'], ['pos_id', 'pos_id']] as const) {
    const v = chu(k);
    if (v && !/^[A-Za-z0-9_.-]{1,60}$/.test(v)) {
      return hong({
        vi: `${ten} chỉ gồm chữ không dấu, số, dấu chấm, gạch (tối đa 60 ký tự).`,
        en: `${ten} may only contain plain letters (no accents), digits, dots and dashes (at most 60 characters).`,
      });
    }
  }
  const vt = chu('vi_tri_ban_id');
  if (vt && !laUuid(vt)) return hong({ vi: 'Chọn lại quầy bán.', en: 'Choose the sales counter again.' });
  const mo = docSoNguyen(chu('gio_mo_cua') || '10', 0, 23);
  const dong = docSoNguyen(chu('gio_dong_cua') || '23', 1, 24);
  if (mo === null || dong === null || Number.isNaN(mo) || Number.isNaN(dong) || mo >= dong) {
    return hong({
      vi: 'Giờ mở cửa từ 0 đến 23, giờ đóng cửa từ 1 đến 24, và mở phải trước đóng.',
      en: 'The opening hour is 0 to 23, the closing hour is 1 to 24, and opening must come before closing.',
    });
  }
  const mat = docSoNguyen(chu('gio_mat_ket_noi') || '3', 1, 12);
  if (mat === null || Number.isNaN(mat)) {
    return hong({
      vi: 'Báo mất kết nối sau từ 1 đến 12 giờ không nhận hóa đơn.',
      en: 'The disconnection alert must be after 1 to 12 hours without invoices.',
    });
  }
  return {
    cauHinh: {
      bat: form.get('bat') === 'co',
      api_url: api, pos_parent: chu('pos_parent'), pos_id: chu('pos_id'),
      vi_tri_ban_id: vt, gio_mo_cua: mo, gio_dong_cua: dong, gio_mat_ket_noi: mat,
    },
    loi: null,
    loiEn: null,
  };
}

/**
 * Ô "datetime-local" (giờ Việt Nam, "2026-09-25T08:30") → ISO có múi +07:00.
 * Trống → null (database lấy lúc gửi của lần đếm quầy đã duyệt gần nhất).
 * Sai dạng, hoặc ngày giờ không có thật (31/02, 24:00) → undefined.
 */
export function docMocChuyen(v: unknown): string | null | undefined {
  const s = String(v ?? '').trim();
  if (s === '') return null;
  return docGioVnDiaPhuong(s) ?? undefined;
}

/** timestamptz → giá trị cho ô datetime-local giờ Việt Nam ("2026-09-25T08:30"). */
export function oMocChuyen(ts: string | null | undefined): string {
  if (!ts) return '';
  const t = new Date(ts);
  if (Number.isNaN(t.getTime())) return '';
  return gioVnTuMs(t.getTime()).slice(0, 16);
}

// -----------------------------------------------------------------------------
// GOM MÃ CHƯA GHÉP, GỢI Ý MÓN — thuần
// -----------------------------------------------------------------------------
export interface MaChuaGhep {
  ma_ipos: string;
  ten_ipos: string | null;
  so_dong: number;
  /** Mã cân đọc được trên nhãn (nếu dòng có mã vạch cân). */
  ma_can: string | null;
  lan_cuoi: string;
}

/** Gom các dòng chưa ghép theo mã iPOS; nhiều dòng nhất lên trước. Dòng không có mã iPOS bị bỏ. */
export function gomMaChuaGhep(
  dong: { ma_ipos: string | null; ten_ipos: string | null; ma_can: string | null; thoi_diem_ban: string }[],
): MaChuaGhep[] {
  const gom = new Map<string, MaChuaGhep>();
  for (const d of dong) {
    const ma = (d.ma_ipos ?? '').trim();
    if (!ma) continue;
    const c = gom.get(ma);
    if (!c) {
      gom.set(ma, { ma_ipos: ma, ten_ipos: d.ten_ipos, so_dong: 1, ma_can: d.ma_can, lan_cuoi: d.thoi_diem_ban });
    } else {
      c.so_dong++;
      if (!c.ten_ipos && d.ten_ipos) c.ten_ipos = d.ten_ipos;
      if (!c.ma_can && d.ma_can) c.ma_can = d.ma_can;
      if (d.thoi_diem_ban > c.lan_cuoi) c.lan_cuoi = d.thoi_diem_ban;
    }
  }
  return [...gom.values()].sort((a, b) => b.so_dong - a.so_dong || a.ma_ipos.localeCompare(b.ma_ipos));
}

const chuanTen = (s: string | null | undefined) =>
  boDau(String(s ?? '')).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Gợi ý món kho cho một mã iPOS: trùng mã cân trước, rồi tên không dấu giống
 * hệt, rồi tên này chứa tên kia. Tối đa `toiDa` món, không trùng.
 */
export function goiYMatHang<T extends { id: string; ten: string; ma: string; ma_can: string | null; dang_dung?: boolean }>(
  ma: { ma_ipos: string; ten_ipos: string | null; ma_can: string | null }, ds: T[], toiDa = 3,
): T[] {
  const dung = ds.filter(m => m.dang_dung !== false);
  const ra: T[] = [];
  const them = (m: T | undefined) => { if (m && !ra.includes(m) && ra.length < toiDa) ra.push(m); };
  if (ma.ma_can) for (const m of dung) if (m.ma_can && m.ma_can === ma.ma_can) them(m);
  for (const m of dung) if (m.ma_can && m.ma_can === ma.ma_ipos) them(m);
  for (const m of dung) if (m.ma.toUpperCase() === ma.ma_ipos.toUpperCase()) them(m);
  const ten = chuanTen(ma.ten_ipos);
  if (ten) {
    for (const m of dung) if (chuanTen(m.ten) === ten) them(m);
    for (const m of dung) {
      const t = chuanTen(m.ten);
      if (t.length >= 3 && (ten.includes(t) || t.includes(ten))) them(m);
    }
  }
  return ra;
}

/** Câu báo sau khi ghép: "Đã ghép … 5 dòng: 4 đã trừ kho, 1 thiếu hàng trên sổ." */
export function cauKetQuaGhep(
  ma: string, kq: { so_dong?: number; dong?: Record<string, number> } | null, boGhep = false, nn: NgonNguNB = 'vi',
): string {
  const c = (x: HaiThuTieng) => x[nn];
  if (boGhep) {
    return c({ vi: `Đã bỏ ghép mã "${ma}". Dòng bán mới của mã này sẽ nằm ở Chưa khớp.`,
               en: `Removed the match for code "${ma}". New sale lines with this code will show under Unmatched.` });
  }
  const n = Number(kq?.so_dong ?? 0);
  if (!n) {
    return c({ vi: `Đã ghép mã "${ma}". Dòng bán sau này của mã này sẽ tự trừ kho.`,
               en: `Matched code "${ma}". Future sale lines with this code will be deducted from stock automatically.` });
  }
  const phan = Object.entries(kq?.dong ?? {})
    .filter(([, so]) => Number(so) > 0)
    .map(([tt, so]) => `${so} ${(TEN_TRANG_THAI_DONG_NB[tt as TrangThaiDong]?.[0]?.[nn] ?? tt).toLowerCase()}`);
  return c({ vi: `Đã ghép mã "${ma}" và xử lý lại ${n} dòng${phan.length ? `: ${phan.join(', ')}` : ''}.`,
             en: `Matched code "${ma}" and reprocessed ${n} ${n === 1 ? 'line' : 'lines'}${phan.length ? `: ${phan.join(', ')}` : ''}.` });
}

// -----------------------------------------------------------------------------
// ĐỌC DATABASE
// -----------------------------------------------------------------------------
const so = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));

export async function docTrangThaiIpos(client: SupabaseClient, chiNhanhId: string): Promise<TrangThaiIpos> {
  const { data, error } = await client.rpc('kho_ipos_trang_thai', { p_chi_nhanh_id: chiNhanhId });
  if (error) throw error;
  const d = (data ?? {}) as Record<string, unknown>;
  const dem = (d.dem ?? {}) as Record<string, unknown>;
  const n = (k: string) => Number(dem[k] ?? 0) || 0;
  return {
    ...(d as unknown as TrangThaiIpos),
    gio_mo_cua: Number(d.gio_mo_cua ?? 10),
    gio_dong_cua: Number(d.gio_dong_cua ?? 23),
    gio_mat_ket_noi: Number(d.gio_mat_ket_noi ?? 3),
    nhan_hd_luc: (d.nhan_hd_luc as string | null) ?? null,
    hop_thu_luc: (d.hop_thu_luc as string | null) ?? null,
    menu_luc: (d.menu_luc as string | null) ?? null,
    menu_can_lam_moi: d.menu_can_lam_moi === true,
    so_mon_menu: Number(d.so_mon_menu ?? 0) || 0,
    cho_xu_ly: Number(d.cho_xu_ly ?? 0) || 0,
    den: d.den === 'xanh' || d.den === 'do' ? d.den : 'vang',
    cau: String(d.cau ?? ''),
    dem: {
      cho: n('cho'), chua_khop: n('chua_khop'), thieu_hang: n('thieu_hang'), loi: n('loi'),
      het_han: n('het_han'), da_ghi_hom_nay: n('da_ghi_hom_nay'),
    },
    lan_chay: Array.isArray(d.lan_chay) ? (d.lan_chay as LanChayIpos[]) : [],
  };
}

/** Trạng thái cho thẻ nhỏ trang chủ — lỗi (database chưa có 0037…) thì null, không hỏng trang. */
export async function docTrangThaiIposNhe(client: SupabaseClient, chiNhanhId: string): Promise<TrangThaiIpos | null> {
  try { return await docTrangThaiIpos(client, chiNhanhId); } catch { return null; }
}

/**
 * Dòng bán iPOS theo trạng thái, mới nhất trước. Tìm theo mã HĐ, mã / tên iPOS;
 * lọc ngày theo ngày bán (giờ VN); một trang CO_TRANG dòng (+1 để biết còn trang sau).
 */
export async function docDongIpos(
  client: SupabaseClient, chiNhanhId: string, trangThai: TrangThaiDong[], tim: TimDs,
): Promise<DongIpos[]> {
  const q = client.from('kho_v_ipos_dong')
    .select('id, ma_hd, thoi_diem_ban, ngay_ban, ma_ipos, ten_ipos, ma_vach, ma_can, so_kg, so_goi, so_luong, thanh_tien, mat_hang_id, ten_mat_hang, trang_thai, so_lan_thu, ly_do, lo_het_han, xu_ly_luc, so_o, so_tang, lech_o')
    .eq('chi_nhanh_id', chiNhanhId)
    .in('trang_thai', trangThai)
    .order('thoi_diem_ban', { ascending: false })
    .order('id');
  const { data, error } = await apDungTim(q, { ...tim, cuaToi: false },
    { cotTim: ['ma_hd', 'ma_ipos', 'ten_ipos', 'ten_mat_hang'], cotNgay: 'ngay_ban', nhanSuId: null });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(r => ({
    ...(r as unknown as DongIpos),
    so_kg: so(r.so_kg), so_goi: so(r.so_goi), so_luong: so(r.so_luong), thanh_tien: so(r.thanh_tien),
    so_lan_thu: Number(r.so_lan_thu ?? 0),
  }));
}

/** Mọi dòng chưa ghép (để gom theo mã). Tối đa 2000 dòng — đủ cho vài ngày chưa ai xử lý. */
export async function docMaChuaGhep(client: SupabaseClient, chiNhanhId: string): Promise<MaChuaGhep[]> {
  const { data, error } = await client.from('kho_v_ipos_dong')
    .select('ma_ipos, ten_ipos, ma_can, thoi_diem_ban')
    .eq('chi_nhanh_id', chiNhanhId)
    .eq('trang_thai', 'chua_khop')
    .order('thoi_diem_ban', { ascending: false })
    .limit(2000);
  if (error) throw error;
  return gomMaChuaGhep((data ?? []) as { ma_ipos: string | null; ten_ipos: string | null; ma_can: string | null; thoi_diem_ban: string }[]);
}

export async function docMaDaGhep(client: SupabaseClient, chiNhanhId: string): Promise<MaIposDaGhep[]> {
  const { data, error } = await client.from('kho_ipos_ma_hang')
    .select('ma_ipos, ten_ipos, kieu, mat_hang_id, don_vi_ban, kg_moi_don_vi, o_ma_id')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('ma_ipos');
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(r => ({
    ...(r as unknown as MaIposDaGhep),
    don_vi_ban: (r.don_vi_ban as DonViBan | null) ?? null,
    kg_moi_don_vi: so(r.kg_moi_don_vi),
  }));
}

/**
 * Thực đơn iPOS (kho_ipos_menu, 0042) — tìm theo mã / tên / nhóm, một trang
 * CO_TRANG món (+1 để biết còn trang sau). Không có cột giá.
 */
export async function docMenuIpos(client: SupabaseClient, chiNhanhId: string, tim: TimDs): Promise<MonMenuIpos[]> {
  const q = client.from('kho_ipos_menu')
    .select('ma_ipos, ten_ipos, loai, dang_ban')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('dang_ban', { ascending: false })
    .order('ten_ipos')
    .order('ma_ipos');
  const { data, error } = await apDungTim(q, { ...tim, tu: null, den: null, cuaToi: false },
    { cotTim: ['ma_ipos', 'ten_ipos', 'loai'], cotNgay: 'cap_nhat_luc', nhanSuId: null });
  if (error) throw error;
  return (data ?? []) as MonMenuIpos[];
}

/** Một món thực đơn theo mã (tên cho form ghép ?ma=). Không có → null. */
export async function docMonMenu(client: SupabaseClient, chiNhanhId: string, ma: string): Promise<MonMenuIpos | null> {
  const { data, error } = await client.from('kho_ipos_menu')
    .select('ma_ipos, ten_ipos, loai, dang_ban')
    .eq('chi_nhanh_id', chiNhanhId)
    .eq('ma_ipos', ma)
    .maybeSingle();
  if (error) throw error;
  return (data as MonMenuIpos | null) ?? null;
}

// -----------------------------------------------------------------------------
// GHI DATABASE
// -----------------------------------------------------------------------------
const YEU_CAU_HONG = { vi: 'Yêu cầu không hợp lệ — tải lại trang.', en: 'Invalid request — reload the page.' };

export async function luuCauHinhIpos(client: SupabaseClient, chiNhanhId: string, form: FormData): Promise<KetQua> {
  const { cauHinh, loi, loiEn } = docFormCauHinhIpos(form);
  if (!cauHinh) {
    const macDinh = { vi: 'Cấu hình chưa hợp lệ.', en: 'The settings are not valid.' };
    return { ok: false, cau: loi ?? macDinh.vi, cauEn: loiEn ?? macDinh.en };
  }
  const { error } = await client.rpc('kho_ipos_luu_cau_hinh', { p_chi_nhanh_id: chiNhanhId, p_cau_hinh: cauHinh });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, cauHinh.bat
    ? { vi: 'Đã lưu kết nối iPOS. Đồng bộ đang bật — hóa đơn iPOS gửi sang sẽ được ghi.',
        en: 'iPOS connection saved. Sync is on — invoices sent by iPOS will be recorded.' }
    : { vi: 'Đã lưu kết nối iPOS. Đồng bộ đang tắt — hóa đơn gửi sang chỉ được cất lại, chưa trừ kho.',
        en: 'iPOS connection saved. Sync is off — invoices sent over are only stored, not deducted from stock.' });
}

export async function chuyenSangIpos(client: SupabaseClient, chiNhanhId: string, form: FormData): Promise<KetQua> {
  if (form.get('xac_nhan') !== 'co') return kqHai(false, { vi: 'Tích ô "Tôi đã hiểu" trước khi chuyển.', en: 'Tick "I understand" before switching.' });
  const moc = docMocChuyen(form.get('tu_luc'));
  if (moc === undefined) return kqHai(false, { vi: 'Mốc chuyển chưa đúng dạng ngày giờ.', en: 'The switch time is not a valid date and time.' });
  const { data, error } = await client.rpc('kho_ipos_chuyen_sang', { p_chi_nhanh_id: chiNhanhId, p_tu_luc: moc });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const tu = (data as { ipos_tu_luc?: string } | null)?.ipos_tu_luc;
  const luc = tu ? gioVnTuMs(new Date(tu).getTime()).slice(0, 16).replace('T', ' ') : '';
  return kqHai(true, {
    vi: `Đã chuyển sang trừ kho theo iPOS${tu ? ` từ ${luc}` : ''}. Bán trước mốc này được bỏ qua (đã tính trong lần đếm quầy).`,
    en: `Switched to deducting stock from iPOS${tu ? ` from ${luc}` : ''}. Sales before this time are skipped (already covered by the counter count).`,
  });
}

export async function troVeDemQuay(client: SupabaseClient, chiNhanhId: string): Promise<KetQua> {
  const { error } = await client.rpc('kho_ipos_tro_ve', { p_chi_nhanh_id: chiNhanhId });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return kqHai(true, {
    vi: 'Đã quay lại lấy số bán từ đếm quầy. Dòng iPOS đã trừ kho giữ nguyên; dòng mới chỉ nằm chờ.',
    en: 'Back to taking sales from the counter count. iPOS lines already deducted stay as they are; new lines just wait.',
  });
}

export async function xuLyDongIpos(client: SupabaseClient, form: FormData): Promise<KetQua> {
  const id = String(form.get('dong_id') ?? '');
  const cach = String(form.get('cach') ?? '') as CachXuLy;
  const lyDo = String(form.get('ly_do') ?? '').trim().slice(0, 300);
  if (!laUuid(id) || !CACH_XU_LY.includes(cach)) return kqHai(false, YEU_CAU_HONG);
  if (cach === 'ngoai_so' && lyDo.length < 3) {
    return kqHai(false, {
      vi: 'Ghi lý do hàng ngoài sổ (vd "hàng tồn quầy chưa nhập sổ").',
      en: 'Enter a reason for the off-book stock (e.g. "counter stock not entered in the books yet").',
    });
  }
  const { data, error } = await client.rpc('kho_ipos_xu_ly_dong', { p_id: id, p_cach: cach, p_ly_do: lyDo || null });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (data ?? {}) as { trang_thai?: string; ly_do?: string | null };
  if (cach === 'bo_qua') return kqHai(true, { vi: 'Đã bỏ qua dòng này — kho không trừ.', en: 'Line skipped — no stock deducted.' });
  if (kq.trang_thai === 'da_ghi') {
    return kqHai(true, cach === 'ngoai_so'
      ? { vi: 'Đã ghi hàng ngoài sổ và trừ kho.', en: 'Off-book stock recorded and deducted.' }
      : { vi: 'Thử lại được — đã trừ kho.', en: 'Retry worked — deducted from stock.' });
  }
  const nhan = TEN_TRANG_THAI_DONG_NB[kq.trang_thai as TrangThaiDong]?.[0];
  const ten = (l: NgonNguNB) => nhan?.[l] ?? kq.trang_thai ?? '';
  // ly_do là câu của database — bản tiếng Anh tra dichCau.
  return kqHai(false, {
    vi: `Vẫn chưa trừ được kho (${ten('vi').toLowerCase()})${kq.ly_do ? `: ${kq.ly_do}` : ''}.`,
    en: `Still could not deduct from stock (${ten('en').toLowerCase()})${kq.ly_do ? `: ${dichCau('en', kq.ly_do)}` : ''}.`,
  });
}

export interface GhepGui {
  ma: string;
  kieu: 'mon' | 'goi_can' | 'bo_qua' | null;
  matHang: string | null;
  donVi: DonViBan | null;
  kgMoiDonVi: number | null;
  /** 0051: ghép với một ô mã (chọn "o:<id>") — món kho là món của ô. */
  oMa?: string | null;
}

/**
 * Form Ghép món → tham số kho_ipos_gan_ma_v2 (thuần). mat_hang_id: id món kho
 * | "goi_can" (hàng cân nhãn) | "bo_qua" (không phải hàng kho) | "bo_ghep"
 * | "o:<id ô mã>" (0051 — món ô trên FABi: bán theo kg hoặc gói, mặc định kg).
 * don_vi_ban: '' | kg | goi | suat — suất = món chế biến: không cần chọn món kho.
 * loiEn: bản tiếng Anh của loi.
 */
export function docFormGhep(form: FormData): { ghep: GhepGui | null; loi: string | null; loiEn: string | null } {
  const hong = (c: HaiThuTieng) => ({ ghep: null, loi: c.vi, loiEn: c.en });
  const ma = String(form.get('ma_ipos') ?? '').trim();
  const chon = String(form.get('mat_hang_id') ?? '').trim();
  const dvChu = String(form.get('don_vi_ban') ?? '').trim();
  if (!ma || ma.length > 100) return hong({ vi: 'Thiếu mã món iPOS.', en: 'The iPOS dish code is missing.' });
  if (dvChu && !['kg', 'goi', 'suat'].includes(dvChu)) return hong({ vi: 'Chọn lại "Bán theo".', en: 'Choose "Sold by" again.' });
  const donVi = (dvChu || null) as DonViBan | null;

  if (chon === 'bo_ghep') return { ghep: { ma, kieu: null, matHang: null, donVi: null, kgMoiDonVi: null }, loi: null, loiEn: null };
  if (chon.startsWith('o:')) {
    const oMa = chon.slice(2);
    if (!laUuid(oMa)) return hong({ vi: 'Chọn lại ô mã.', en: 'Choose the rotating code again.' });
    if (donVi === 'suat') return hong({ vi: 'Món ô mã bán theo kg hoặc gói.', en: 'A rotating-code dish is sold by kg or by pack.' });
    return { ghep: { ma, kieu: 'mon', matHang: null, donVi: donVi ?? 'kg', kgMoiDonVi: null, oMa }, loi: null, loiEn: null };
  }
  if (donVi === 'suat') return { ghep: { ma, kieu: 'bo_qua', matHang: null, donVi, kgMoiDonVi: null }, loi: null, loiEn: null };

  let kieu: GhepGui['kieu'];
  let matHang: string | null = null;
  if (chon === 'bo_qua') kieu = 'bo_qua';
  else if (chon === 'goi_can') kieu = 'goi_can';
  else if (laUuid(chon)) { kieu = 'mon'; matHang = chon; }
  else {
    return hong({
      vi: 'Chọn món trong kho, "Không phải hàng kho", hoặc Bán theo suất (món chế biến).',
      en: 'Choose a stock item, "Not a stock item", or Sold by portion (cooked dish).',
    });
  }

  let kg: number | null = null;
  const kgChu = String(form.get('kg_moi_don_vi') ?? '').trim().replace(',', '.');
  if (donVi === 'goi' && kgChu !== '') {
    kg = /^\d{1,4}(\.\d{1,3})?$/.test(kgChu) ? Number(kgChu) : NaN;
    if (!(kg > 0 && kg <= 1000)) {
      return hong({ vi: 'Mỗi gói phải nặng hơn 0 và không quá 1000 kg (vd 0,5).', en: 'Each pack must weigh more than 0 and at most 1000 kg (e.g. 0.5).' });
    }
  }
  return { ghep: { ma, kieu, matHang, donVi: kieu === 'bo_qua' ? null : donVi, kgMoiDonVi: kg }, loi: null, loiEn: null };
}

export async function ganMaIpos(client: SupabaseClient, chiNhanhId: string, form: FormData): Promise<KetQua> {
  const { ghep, loi, loiEn } = docFormGhep(form);
  if (!ghep) return { ok: false, cau: loi ?? YEU_CAU_HONG.vi, cauEn: loiEn ?? YEU_CAU_HONG.en };
  if (ghep.oMa) {
    const { data, error } = await client.rpc('kho_ipos_gan_o_ma', {
      p_chi_nhanh_id: chiNhanhId, p_ma_ipos: ghep.ma, p_o_ma_id: ghep.oMa, p_don_vi_ban: ghep.donVi,
    });
    if (error) return { ok: false, cau: cauLoiKho(error) };
    const kqO = data as { so_o: number; ma_can: string; so_dong?: number; dong?: Record<string, number> };
    const kem = { vi: ` Bán món này trừ đúng lô của tảng đang giữ ô ${kqO.so_o} (mã ${kqO.ma_can}).`,
                  en: ` Selling it deducts the exact lot of the primal holding slot ${kqO.so_o} (code ${kqO.ma_can}).` };
    return { ok: true, cau: cauKetQuaGhep(ghep.ma, kqO) + kem.vi, cauEn: cauKetQuaGhep(ghep.ma, kqO, false, 'en') + kem.en };
  }
  const { data, error } = await client.rpc('kho_ipos_gan_ma_v2', {
    p_chi_nhanh_id: chiNhanhId, p_ma_ipos: ghep.ma, p_kieu: ghep.kieu, p_mat_hang_id: ghep.matHang,
    p_don_vi_ban: ghep.donVi, p_kg_moi_don_vi: ghep.kgMoiDonVi,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  if (ghep.donVi === 'suat') {
    return kqHai(true, {
      vi: `Mã "${ghep.ma}" là món chế biến — kho không trừ, chỉ đếm suất để so định lượng.`,
      en: `Code "${ghep.ma}" is a cooked dish — no stock is deducted; portions are only counted to compare with recipes.`,
    });
  }
  if (ghep.kieu === 'bo_qua') {
    return kqHai(true, {
      vi: `Mã "${ghep.ma}" không phải hàng kho — bán món này kho không trừ.`,
      en: `Code "${ghep.ma}" is not a stock item — selling it does not deduct stock.`,
    });
  }
  const kqGhep = data as { so_dong?: number; dong?: Record<string, number> };
  const boGhep = ghep.kieu === null;
  return { ok: true, cau: cauKetQuaGhep(ghep.ma, kqGhep, boGhep), cauEn: cauKetQuaGhep(ghep.ma, kqGhep, boGhep, 'en') };
}

/**
 * 0051: ô mã gợi ý cho một mã iPOS — mã món iPOS (bỏ số 0 đầu) hoặc mã cân trên
 * nhãn trùng mã ô. Món ô trên FABi thường đặt mã = mã cân của ô.
 */
export function goiYOMa<T extends { id: string; ma_can: string }>(
  ma: { ma_ipos: string; ma_can: string | null }, oMa: T[],
): T | null {
  const bo0 = (x: string | null | undefined) => String(x ?? '').trim().replace(/^0+/, '');
  const a = bo0(ma.ma_ipos), b = bo0(ma.ma_can);
  return oMa.find(o => o.ma_can === a || (b !== '' && o.ma_can === b)) ?? null;
}
