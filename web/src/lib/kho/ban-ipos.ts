/**
 * KHO — BÁN HÀNG iPOS: TRẠNG THÁI, CẤU HÌNH, HÀNG CHỜ, GHÉP MÃ (GĐ7a, 0037)
 *
 * Màn dùng file này:
 *   · /noi-bo/kho/cai-dat/ipos  — Kết nối iPOS: đèn trạng thái, "Cập nhật ngay"
 *     (lib/kho/ipos-dong-bo.ts), form cấu hình, chuyển sang / quay lại đếm quầy,
 *     nhật ký 10 lượt.
 *   · /noi-bo/kho/ban-ipos      — dòng bán chưa trừ được kho: thử lại, hàng
 *     ngoài sổ, bỏ qua.
 *   · /noi-bo/kho/ban-ipos/ghep — ghép mã món iPOS với món kho.
 *   · Trang chủ quản lý: thẻ nhỏ trạng thái iPOS.
 *
 * TOKEN iPOS KHÔNG ĐI QUA FILE NÀY. Nó là bí mật Worker IPOS_ACCESS_TOKEN,
 * chỉ lib/kho/ipos-dong-bo.ts đọc. Form cấu hình từ chối mọi ô có chữ "token"
 * trước khi gửi (database cũng từ chối — kho_ipos_luu_cau_hinh).
 *
 * Phần thuần (đọc form, gom mã chưa ghép, gợi ý món, câu chữ) không gọi
 * database — test bằng Node. Phần gọi database dùng client mang token của
 * người đang xem (RLS: dòng có tiền chỉ vai xem_gia thấy).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { boDau, cauLoiKho, docSoNguyen, laUuid, type KetQua } from './chung.ts';
import { apDungTim, type TimDs } from './tim-ds.ts';

// -----------------------------------------------------------------------------
// KIỂU
// -----------------------------------------------------------------------------
export type DenIpos = 'xanh' | 'vang' | 'do';

export interface LanChayIpos {
  id: string;
  nguon: 'cron' | 'tay';
  bat_dau_luc: string;
  ket_thuc_luc: string | null;
  so_hd: number;
  so_dong: number;
  so_da_ghi: number;
  loi: string | null;
}

/** Kết quả kho_ipos_trang_thai (0037) — không tiền, không token. */
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
  ipos_tu_luc: string | null;
  dong_bo_den_luc: string | null;
  dang_chay: boolean;
  lan_cuoi_luc: string | null;
  lan_cuoi_loi: string | null;
  lan_ok_luc: string | null;
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
  thanh_tien: number | null;
  mat_hang_id: string | null;
  ten_mat_hang: string | null;
  trang_thai: TrangThaiDong;
  so_lan_thu: number;
  ly_do: string | null;
  lo_het_han: boolean;
  xu_ly_luc: string | null;
}

export interface MaIposDaGhep {
  ma_ipos: string;
  ten_ipos: string | null;
  kieu: 'goi_can' | 'mon' | 'bo_qua';
  mat_hang_id: string | null;
}

// -----------------------------------------------------------------------------
// CÂU CHỮ — thuần
// -----------------------------------------------------------------------------
export const TEN_TRANG_THAI_DONG: Record<TrangThaiDong, [string, string]> = {
  cho:        ['Chờ', 'tat'],
  da_ghi:     ['Đã trừ kho', 'song'],
  chua_khop:  ['Chưa ghép món', 'cho'],
  thieu_hang: ['Thiếu hàng trên sổ', 'cho'],
  bo_qua:     ['Bỏ qua', 'tat'],
  da_huy:     ['Hóa đơn đã hủy', 'tat'],
  loi:        ['Lỗi', 'cho'],
};

/** Thẻ lọc của màn Bán hàng iPOS. Thẻ đầu là mặc định. "Chưa khớp" gồm cả dòng lỗi. */
export const THE_DONG: readonly { ma: string; ten: string; trangThai: TrangThaiDong[] }[] = [
  { ma: 'chua_khop', ten: 'Chưa khớp', trangThai: ['chua_khop', 'loi'] },
  { ma: 'thieu_hang', ten: 'Thiếu hàng', trangThai: ['thieu_hang'] },
  { ma: 'da_ghi', ten: 'Đã ghi', trangThai: ['da_ghi'] },
  { ma: 'bo_qua', ten: 'Bỏ qua', trangThai: ['bo_qua', 'da_huy'] },
];

export function docThe(v: string | null | undefined): (typeof THE_DONG)[number] {
  return THE_DONG.find(t => t.ma === v) ?? THE_DONG[0];
}

/** Lớp của khung báo theo màu đèn (nb-bao xong / luu-y / loi). */
export function lopDen(den: DenIpos | string | null | undefined): 'xong' | 'luu-y' | 'loi' {
  return den === 'xanh' ? 'xong' : den === 'do' ? 'loi' : 'luu-y';
}

export function chuDen(den: DenIpos | string | null | undefined): string {
  return den === 'xanh' ? 'Đang chạy tốt' : den === 'do' ? 'Mất kết nối' : 'Cần xem';
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
  duong_dan_hoa_don: string;
  vi_tri_ban_id: string;
  gio_mo_cua: number;
  gio_dong_cua: number;
}

const COT_CAU_HINH = ['api_url', 'pos_parent', 'pos_id', 'duong_dan_hoa_don'] as const;

/**
 * Form Kết nối iPOS → object gửi kho_ipos_luu_cau_hinh. Chỉ các khóa database
 * nhận; ô nào có chữ "token" bị từ chối NGAY (không gửi đi đâu cả) — token là
 * bí mật Worker, không bao giờ vào database.
 */
export function docFormCauHinhIpos(form: FormData): { cauHinh: CauHinhGui | null; loi: string | null } {
  const chu = (k: string) => String(form.get(k) ?? '').trim();
  for (const k of COT_CAU_HINH) {
    if (/token/i.test(chu(k))) {
      return { cauHinh: null, loi: 'Không dán token vào đây. Token iPOS là bí mật của máy chủ — người quản lý Cloudflare cài bằng lệnh npx wrangler secret put IPOS_ACCESS_TOKEN.' };
    }
  }
  const api = chu('api_url').replace(/\/+$/, '');
  if (api && !/^https:\/\/[A-Za-z0-9.-]+(:[0-9]{1,5})?(\/[A-Za-z0-9._~/-]*)?$/.test(api)) {
    return { cauHinh: null, loi: 'Địa chỉ iPOS phải bắt đầu bằng https:// và không có dấu ? hay tham số.' };
  }
  for (const [k, ten] of [['pos_parent', 'pos_parent'], ['pos_id', 'pos_id']] as const) {
    const v = chu(k);
    if (v && !/^[A-Za-z0-9_.-]{1,60}$/.test(v)) {
      return { cauHinh: null, loi: `${ten} chỉ gồm chữ không dấu, số, dấu chấm, gạch (tối đa 60 ký tự).` };
    }
  }
  const dd = chu('duong_dan_hoa_don');
  if (dd && !/^\/?[A-Za-z0-9._~/-]{1,200}$/.test(dd)) {
    return { cauHinh: null, loi: 'Đường dẫn lấy hóa đơn chỉ gồm chữ không dấu, số và dấu "/" — không có dấu ? hay tham số.' };
  }
  const vt = chu('vi_tri_ban_id');
  if (vt && !laUuid(vt)) return { cauHinh: null, loi: 'Chọn lại quầy bán.' };
  const mo = docSoNguyen(chu('gio_mo_cua') || '10', 0, 23);
  const dong = docSoNguyen(chu('gio_dong_cua') || '23', 1, 24);
  if (mo === null || dong === null || Number.isNaN(mo) || Number.isNaN(dong) || mo >= dong) {
    return { cauHinh: null, loi: 'Giờ mở cửa từ 0 đến 23, giờ đóng cửa từ 1 đến 24, và mở phải trước đóng.' };
  }
  return {
    cauHinh: {
      bat: form.get('bat') === 'co',
      api_url: api, pos_parent: chu('pos_parent'), pos_id: chu('pos_id'),
      duong_dan_hoa_don: dd, vi_tri_ban_id: vt, gio_mo_cua: mo, gio_dong_cua: dong,
    },
    loi: null,
  };
}

/**
 * Ô "datetime-local" (giờ Việt Nam, "2026-09-25T08:30") → ISO có múi +07:00.
 * Trống → null (database lấy lúc gửi của lần đếm quầy đã duyệt gần nhất).
 * Sai dạng → undefined.
 */
export function docMocChuyen(v: unknown): string | null | undefined {
  const s = String(v ?? '').trim();
  if (s === '') return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return undefined;
  const iso = `${m[1]}T${m[2]}:${m[3]}:${m[4] ?? '00'}+07:00`;
  return Number.isNaN(new Date(iso).getTime()) ? undefined : iso;
}

/** timestamptz → giá trị cho ô datetime-local giờ Việt Nam ("2026-09-25T08:30"). */
export function oMocChuyen(ts: string | null | undefined): string {
  if (!ts) return '';
  const t = new Date(ts);
  if (Number.isNaN(t.getTime())) return '';
  return new Date(t.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16);
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
export function cauKetQuaGhep(ma: string, kq: { so_dong?: number; dong?: Record<string, number> } | null, boGhep = false): string {
  if (boGhep) return `Đã bỏ ghép mã "${ma}". Dòng bán mới của mã này sẽ nằm ở Chưa khớp.`;
  const n = Number(kq?.so_dong ?? 0);
  if (!n) return `Đã ghép mã "${ma}". Dòng bán sau này của mã này sẽ tự trừ kho.`;
  const phan = Object.entries(kq?.dong ?? {})
    .filter(([, so]) => Number(so) > 0)
    .map(([tt, so]) => `${so} ${(TEN_TRANG_THAI_DONG[tt as TrangThaiDong]?.[0] ?? tt).toLowerCase()}`);
  return `Đã ghép mã "${ma}" và xử lý lại ${n} dòng${phan.length ? `: ${phan.join(', ')}` : ''}.`;
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
    .select('id, ma_hd, thoi_diem_ban, ngay_ban, ma_ipos, ten_ipos, ma_vach, ma_can, so_kg, so_goi, thanh_tien, mat_hang_id, ten_mat_hang, trang_thai, so_lan_thu, ly_do, lo_het_han, xu_ly_luc')
    .eq('chi_nhanh_id', chiNhanhId)
    .in('trang_thai', trangThai)
    .order('thoi_diem_ban', { ascending: false })
    .order('id');
  const { data, error } = await apDungTim(q, { ...tim, cuaToi: false },
    { cotTim: ['ma_hd', 'ma_ipos', 'ten_ipos', 'ten_mat_hang'], cotNgay: 'ngay_ban', nhanSuId: null });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(r => ({
    ...(r as unknown as DongIpos),
    so_kg: so(r.so_kg), so_goi: so(r.so_goi), thanh_tien: so(r.thanh_tien),
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
    .select('ma_ipos, ten_ipos, kieu, mat_hang_id')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('ma_ipos');
  if (error) throw error;
  return (data ?? []) as MaIposDaGhep[];
}

// -----------------------------------------------------------------------------
// GHI DATABASE
// -----------------------------------------------------------------------------
export async function luuCauHinhIpos(client: SupabaseClient, chiNhanhId: string, form: FormData): Promise<KetQua> {
  const { cauHinh, loi } = docFormCauHinhIpos(form);
  if (!cauHinh) return { ok: false, cau: loi ?? 'Cấu hình chưa hợp lệ.' };
  const { error } = await client.rpc('kho_ipos_luu_cau_hinh', { p_chi_nhanh_id: chiNhanhId, p_cau_hinh: cauHinh });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: cauHinh.bat ? 'Đã lưu kết nối iPOS. Đồng bộ đang bật — 5 phút một lượt.' : 'Đã lưu kết nối iPOS. Đồng bộ đang tắt.' };
}

export async function chuyenSangIpos(client: SupabaseClient, chiNhanhId: string, form: FormData): Promise<KetQua> {
  if (form.get('xac_nhan') !== 'co') return { ok: false, cau: 'Tích ô "Tôi đã hiểu" trước khi chuyển.' };
  const moc = docMocChuyen(form.get('tu_luc'));
  if (moc === undefined) return { ok: false, cau: 'Mốc chuyển chưa đúng dạng ngày giờ.' };
  const { data, error } = await client.rpc('kho_ipos_chuyen_sang', { p_chi_nhanh_id: chiNhanhId, p_tu_luc: moc });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const tu = (data as { ipos_tu_luc?: string } | null)?.ipos_tu_luc;
  return { ok: true, cau: `Đã chuyển sang trừ kho theo iPOS${tu ? ` từ ${new Date(new Date(tu).getTime() + 7 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')}` : ''}. Bán trước mốc này được bỏ qua (đã tính trong lần đếm quầy).` };
}

export async function troVeDemQuay(client: SupabaseClient, chiNhanhId: string): Promise<KetQua> {
  const { error } = await client.rpc('kho_ipos_tro_ve', { p_chi_nhanh_id: chiNhanhId });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ok: true, cau: 'Đã quay lại lấy số bán từ đếm quầy. Dòng iPOS đã trừ kho giữ nguyên; dòng mới chỉ nằm chờ.' };
}

export async function xuLyDongIpos(client: SupabaseClient, form: FormData): Promise<KetQua> {
  const id = String(form.get('dong_id') ?? '');
  const cach = String(form.get('cach') ?? '') as CachXuLy;
  const lyDo = String(form.get('ly_do') ?? '').trim().slice(0, 300);
  if (!laUuid(id) || !CACH_XU_LY.includes(cach)) return { ok: false, cau: 'Yêu cầu không hợp lệ — tải lại trang.' };
  if (cach === 'ngoai_so' && lyDo.length < 3) return { ok: false, cau: 'Ghi lý do hàng ngoài sổ (vd "hàng tồn quầy chưa nhập sổ").' };
  const { data, error } = await client.rpc('kho_ipos_xu_ly_dong', { p_id: id, p_cach: cach, p_ly_do: lyDo || null });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (data ?? {}) as { trang_thai?: string; ly_do?: string | null };
  if (cach === 'bo_qua') return { ok: true, cau: 'Đã bỏ qua dòng này — kho không trừ.' };
  if (kq.trang_thai === 'da_ghi') return { ok: true, cau: cach === 'ngoai_so' ? 'Đã ghi hàng ngoài sổ và trừ kho.' : 'Thử lại được — đã trừ kho.' };
  const ten = TEN_TRANG_THAI_DONG[kq.trang_thai as TrangThaiDong]?.[0] ?? kq.trang_thai ?? '';
  return { ok: false, cau: `Vẫn chưa trừ được kho (${ten.toLowerCase()})${kq.ly_do ? `: ${kq.ly_do}` : ''}.` };
}

export async function ganMaIpos(client: SupabaseClient, chiNhanhId: string, form: FormData): Promise<KetQua> {
  const ma = String(form.get('ma_ipos') ?? '').trim();
  const chon = String(form.get('mat_hang_id') ?? '').trim();
  if (!ma || ma.length > 100) return { ok: false, cau: 'Thiếu mã món iPOS.' };
  // "bo_qua" = không phải hàng kho; "goi_can" = hàng cân nhãn (món thật đọc trên nhãn);
  // "bo_ghep" = xóa ghép; còn lại là id món kho.
  let kieu: 'mon' | 'goi_can' | 'bo_qua' | null;
  let matHang: string | null = null;
  if (chon === 'bo_qua') kieu = 'bo_qua';
  else if (chon === 'goi_can') kieu = 'goi_can';
  else if (chon === 'bo_ghep') kieu = null;
  else if (laUuid(chon)) { kieu = 'mon'; matHang = chon; }
  else return { ok: false, cau: 'Chọn món trong kho, hoặc "Không phải hàng kho".' };
  const { data, error } = await client.rpc('kho_ipos_gan_ma', {
    p_chi_nhanh_id: chiNhanhId, p_ma_ipos: ma, p_kieu: kieu, p_mat_hang_id: matHang,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  if (kieu === 'bo_qua') return { ok: true, cau: `Mã "${ma}" không phải hàng kho — bán món này kho không trừ.` };
  return { ok: true, cau: cauKetQuaGhep(ma, data as { so_dong?: number; dong?: Record<string, number> }, kieu === null) };
}
