/**
 * KHO — ĐỌC HÓA ĐƠN iPOS (GĐ7a, migration 0037)
 *
 * File THUẦN: không gọi mạng, không gọi database, chỉ import ma-vach.ts. Test
 * Node nạp thẳng được (crm/test/test-kho-ipos-web.mjs).
 *
 * VIỆC CỦA FILE NÀY: biến JSON iPOS trả về thành payload `p_hoa_don` của
 * `kho_ipos_nhan`:
 *   [{ ma_hd, thoi_diem_ban (ISO có múi giờ), da_huy, raw?, dong: [
 *       { khoa_dong?, ma_ipos?, ten_ipos?, ma_vach?, ma_can?, so_kg?, so_goi?, thanh_tien? }] }]
 *
 * ĐỊNH DẠNG JSON CỦA iPOS CHƯA BIẾT — lúc viết chưa đọc được tài liệu API.
 * Mọi giả định (tên trường, tham số URL, phân trang, định dạng giờ) gom vào
 * MỘT bảng `TRUONG_IPOS` ngay dưới đây. Có tài liệu thì chỉ sửa bảng đó
 * (và fixture trong test), không phải sửa logic.
 *
 * Mã cân và kg của NHÃN CÂN: database tự giải từ `ma_vach` bằng mẫu mã vạch
 * của đúng chi nhánh (`kho_doc_ma_vach`, 0037) — máy đồng bộ không đọc được
 * Cài đặt kho, nên mặc định web KHÔNG tự giải. Nơi gọi biết mẫu thì truyền
 * `{ mauMaVach, soLeKg }` và web gửi sẵn `ma_can` (database dùng giá trị đó
 * trước).
 *
 * KHÔNG BAO GIỜ đưa GIÁ TRỊ vào câu cảnh báo — chỉ tên khóa. JSON iPOS có thể
 * chứa số điện thoại khách.
 */

import { docMaVach, laEan13HopLe, MAU_MAC_DINH } from './ma-vach.ts';

// =============================================================================
// CHỈNH KHI CÓ TÀI LIỆU — mọi giả định về API iPOS nằm ở đây
// =============================================================================
export const TRUONG_IPOS = {
  /** Tên tham số URL của endpoint lấy hóa đơn. */
  thamSo: {
    token: 'access_token',
    posParent: 'pos_parent',
    posId: 'pos_id',
    tu: 'from',
    den: 'to',
    trang: 'page',
    coTrang: 'limit',
  },
  /**
   * Định dạng giờ gửi trong tham số tu / den:
   *   'ngay_gio_vn' = "YYYY-MM-DD HH:mm:ss" giờ Việt Nam · 'iso' · 'epoch_s' · 'epoch_ms'
   */
  dinhDangGioThamSo: 'ngay_gio_vn' as 'ngay_gio_vn' | 'iso' | 'epoch_s' | 'epoch_ms',
  /** Phân trang: trang đầu, số HĐ mỗi trang, tối đa bao nhiêu trang một lượt. */
  phanTrang: { trangDau: 1, coTrang: 100, toiDaTrang: 20 },
  /** Thời gian chờ một lần gọi iPOS (ms). */
  timeoutMs: 20_000,

  /** Khóa chứa mảng hóa đơn khi kết quả là object (thử lần lượt, sâu tối đa 2 tầng). */
  mangHoaDon: ['data', 'items', 'result', 'results', 'list', 'sales', 'orders', 'bills', 'trans'],
  /** Kết quả có báo còn trang sau không (nếu có). */
  conTrang: ['has_more', 'has_next', 'next_page'],
  tongTrang: ['total_page', 'total_pages', 'page_count', 'last_page'],

  // ---- Hóa đơn ---------------------------------------------------------------
  maHd: ['tran_id', 'sale_id', 'order_id', 'id', 'code'],
  thoiGian: ['tran_date', 'created_at', 'sale_date', 'time'],
  huy: ['is_cancel', 'status'],
  /** Giá trị (chữ thường) của trường huy nghĩa là "đã hủy" khi không phải true/false. */
  giaTriHuy: ['cancel', 'canceled', 'cancelled', 'void', 'voided', 'deleted', 'huy', 'da_huy', 'refund', 'refunded'],
  mangDong: ['sale_detail', 'details', 'items', 'order_details'],

  // ---- Dòng hóa đơn ----------------------------------------------------------
  khoaDong: ['detail_id', 'line_id', 'sale_detail_id', 'id'],
  maMon: ['item_id', 'product_id', 'item_code'],
  tenMon: ['item_name', 'product_name', 'name'],
  maVach: ['barcode', 'item_barcode', 'ean'],
  /** Số lượng: số nguyên = số gói / phần; số lẻ = kg. */
  soLuong: ['quantity', 'qty'],
  /** Trường chắc chắn là kg. */
  soKg: ['weight', 'kg'],
  /** Đơn vị của số lượng — chứa "kg" thì số lượng là kg. */
  donVi: ['unit', 'unit_name', 'uom'],
  tien: ['amount', 'total', 'thanh_tien'],

  /** Khóa bị bỏ khỏi `raw` lưu trong database (thông tin khách). */
  boKhoiRaw: /phone|mobile|email|address|customer|khach|member|card|token/i,
  /** raw lớn hơn chừng này (ký tự JSON) thì không lưu. */
  rawToiDa: 30_000,
} as const;

// =============================================================================
// KIỂU
// =============================================================================
export interface DongIpos {
  khoa_dong?: string;
  ma_ipos?: string;
  ten_ipos?: string;
  ma_vach?: string;
  ma_can?: string;
  so_kg?: number;
  so_goi?: number;
  thanh_tien?: number;
}

export interface HoaDonIpos {
  ma_hd: string;
  /** ISO, luôn có múi giờ (giờ không ghi múi hiểu là +07:00). */
  thoi_diem_ban: string;
  da_huy: boolean;
  raw?: unknown;
  dong: DongIpos[];
}

export interface KetQuaPhanTich {
  hoaDon: HoaDonIpos[];
  /** Câu cảnh báo — chỉ tên khóa, không bao giờ có giá trị. */
  canhBao: string[];
  /** Số HĐ iPOS trả về ở trang này (kể cả HĐ bị bỏ) — để biết còn trang sau. */
  soGoc: number;
}

export interface TuyChonPhanTich {
  /** Mẫu mã vạch của chi nhánh — có thì web tự giải ma_can từ nhãn cân. */
  mauMaVach?: string;
  soLeKg?: number;
}

// =============================================================================
// TIỆN ÍCH
// =============================================================================
type Obj = Record<string, unknown>;
const laObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

/** Giá trị của khóa đầu tiên có mặt (không null / chuỗi rỗng). */
function lay(o: Obj, khoa: readonly string[]): { khoa: string; giaTri: unknown } | null {
  for (const k of khoa) {
    const v = o[k];
    if (v !== undefined && v !== null && !(typeof v === 'string' && v.trim() === '')) return { khoa: k, giaTri: v };
  }
  return null;
}

function chu(v: unknown, toiDa = 100): string | undefined {
  if (typeof v === 'string') { const s = v.trim(); return s ? s.slice(0, toiDa) : undefined; }
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

function so(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const s = v.trim().replace(/\s/g, '');
    if (!/^-?\d+([.,]\d+)?$/.test(s)) return undefined;
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

const hai = (n: number) => String(n).padStart(2, '0');

/**
 * Đọc thời điểm bán → ISO có múi giờ, hoặc null.
 *  - số / chuỗi toàn số: epoch giây (≤ 10^11) hoặc mili giây
 *  - "YYYY-MM-DD[T ]HH:mm[:ss[.sss]]" có hoặc không múi giờ (không múi → +07:00)
 *  - "DD/MM/YYYY HH:mm[:ss]" (giờ VN)
 */
export function docThoiDiem(v: unknown): string | null {
  if (typeof v === 'number' || (typeof v === 'string' && /^\d{9,13}$/.test(v.trim()))) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return null;
    const d = new Date(n < 1e11 ? n * 1000 : n);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof v !== 'string') return null;
  const s = v.trim();

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,6})?)?\s*(Z|[+-]\d{2}:?\d{2}|[+-]\d{2})?$/i);
  if (m) {
    const [, y, mo, d, h, mi, se = '00', le = '', mui] = m;
    if (!mui) return `${y}-${mo}-${d}T${h}:${mi}:${se}${le}+07:00`;
    const dt = new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}${le}${mui.length === 3 ? mui + ':00' : mui}`);
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, d, mo, y, h, mi, se = '00'] = m;
    return `${y}-${hai(+mo)}-${hai(+d)}T${hai(+h)}:${mi}:${se}+07:00`;
  }
  return null;
}

function docHuy(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true' || s === '1') return true;
    return (TRUONG_IPOS.giaTriHuy as readonly string[]).includes(s);
  }
  return false;
}

/** Nhãn cân (EAN-13 hợp lệ, đầu "2" — dải mã nội bộ cửa hàng). */
export function laNhanCan(ma: string | undefined): boolean {
  return !!ma && laEan13HopLe(ma) && ma.startsWith('2');
}

/** Giải một mã vạch nhãn cân bằng ma-vach.ts. Không phải nhãn cân / sai → null. */
export function giaiMaVach(ma: string, mau: string = MAU_MAC_DINH, soLeKg = 3): { maCan: string; soKg: number | null } | null {
  const kq = docMaVach(ma, mau, soLeKg);
  return kq.hopLe ? { maCan: kq.maCan, soKg: kq.soKg } : null;
}

/** Bỏ khóa có thông tin khách khỏi raw; quá lớn thì không giữ. */
function lamSachRaw(v: unknown, sau = 0): unknown {
  if (sau > 6) return undefined;
  if (Array.isArray(v)) return v.map(x => lamSachRaw(x, sau + 1));
  if (laObj(v)) {
    const ra: Obj = {};
    for (const [k, x] of Object.entries(v)) if (!TRUONG_IPOS.boKhoiRaw.test(k)) ra[k] = lamSachRaw(x, sau + 1);
    return ra;
  }
  return v;
}

function rawGon(v: unknown): unknown {
  const r = lamSachRaw(v);
  try { return JSON.stringify(r).length <= TRUONG_IPOS.rawToiDa ? r : undefined; } catch { return undefined; }
}

/** Tìm mảng hóa đơn trong kết quả iPOS. */
export function timMangHoaDon(json: unknown, sau = 0): unknown[] | null {
  if (Array.isArray(json)) return json;
  if (!laObj(json) || sau > 2) return null;
  for (const k of TRUONG_IPOS.mangHoaDon) {
    const v = json[k];
    if (Array.isArray(v)) return v;
    if (laObj(v)) { const t = timMangHoaDon(v, sau + 1); if (t) return t; }
  }
  return null;
}

// =============================================================================
// ĐỌC MỘT DÒNG
// =============================================================================
function docDong(e: Obj, tuyChon: TuyChonPhanTich): DongIpos {
  const d: DongIpos = {};
  const khoa = lay(e, TRUONG_IPOS.khoaDong);
  if (khoa) d.khoa_dong = chu(khoa.giaTri);
  const ma = lay(e, TRUONG_IPOS.maMon);
  if (ma) d.ma_ipos = chu(ma.giaTri);
  const ten = lay(e, TRUONG_IPOS.tenMon);
  if (ten) d.ten_ipos = chu(ten.giaTri, 200);
  const vach = lay(e, TRUONG_IPOS.maVach);
  if (vach) d.ma_vach = chu(vach.giaTri, 40);

  const tien = lay(e, TRUONG_IPOS.tien);
  const t = tien ? so(tien.giaTri) : undefined;
  if (t !== undefined && t >= 0) d.thanh_tien = Math.round(t);

  const sl = lay(e, TRUONG_IPOS.soLuong);
  const soLuong = sl ? so(sl.giaTri) : undefined;
  const kgR = lay(e, TRUONG_IPOS.soKg);
  const kg = kgR ? so(kgR.giaTri) : undefined;
  const dv = lay(e, TRUONG_IPOS.donVi);
  const soLuongLaKg = !!dv && /kg|kilo/i.test(String(dv.giaTri));
  const laSoNguyen = soLuong !== undefined && Number.isInteger(soLuong) && soLuong >= 1 && !soLuongLaKg;

  if (laNhanCan(d.ma_vach)) {
    // Nhãn cân: kg lấy từ nhãn (database giải) — số lượng chỉ là số gói.
    d.so_goi = laSoNguyen ? soLuong : 1;
    if (tuyChon.mauMaVach) {
      const g = giaiMaVach(d.ma_vach!, tuyChon.mauMaVach, tuyChon.soLeKg ?? 3);
      if (g) d.ma_can = g.maCan;
    }
  } else {
    if (laSoNguyen) d.so_goi = soLuong;
    const k = kg ?? (soLuong !== undefined && !laSoNguyen ? soLuong : undefined);
    if (k !== undefined && k > 0) d.so_kg = Math.round(k * 1000) / 1000;
  }
  return d;
}

// =============================================================================
// ĐỌC KẾT QUẢ MỘT TRANG
// =============================================================================
export function phanTichHoaDon(json: unknown, tuyChon: TuyChonPhanTich = {}): KetQuaPhanTich {
  const canhBao: string[] = [];
  const mang = timMangHoaDon(json);
  if (!mang) {
    const khoa = laObj(json) ? Object.keys(json).slice(0, 15).join(', ') : typeof json;
    return {
      hoaDon: [], soGoc: 0,
      canhBao: [`Không thấy danh sách hóa đơn trong kết quả iPOS (các khóa có: ${khoa || 'không có'}) — chỉnh TRUONG_IPOS.mangHoaDon`],
    };
  }

  const hoaDon: HoaDonIpos[] = [];
  const boVi = new Map<string, number>();
  const bo = (lyDo: string) => boVi.set(lyDo, (boVi.get(lyDo) ?? 0) + 1);
  let dongKhongMa = 0;

  for (const x of mang) {
    if (!laObj(x)) { bo('không phải object'); continue; }
    const maR = lay(x, TRUONG_IPOS.maHd);
    const ma = maR ? chu(maR.giaTri) : undefined;
    if (!ma) { bo(`thiếu mã hóa đơn (đã thử ${TRUONG_IPOS.maHd.join(', ')})`); continue; }
    const tgR = lay(x, TRUONG_IPOS.thoiGian);
    const luc = tgR ? docThoiDiem(tgR.giaTri) : null;
    if (!luc) {
      bo(tgR ? `không đọc được giờ bán ở khóa "${tgR.khoa}"` : `thiếu giờ bán (đã thử ${TRUONG_IPOS.thoiGian.join(', ')})`);
      continue;
    }
    const huyR = lay(x, TRUONG_IPOS.huy);
    const dongR = lay(x, TRUONG_IPOS.mangDong);
    if (dongR && !Array.isArray(dongR.giaTri)) { bo(`khóa "${dongR.khoa}" không phải danh sách dòng`); continue; }
    const dong = ((dongR?.giaTri as unknown[] | undefined) ?? []).filter(laObj).map(e => docDong(e, tuyChon));
    dongKhongMa += dong.filter(d => !d.ma_ipos && !d.ma_vach).length;

    const hd: HoaDonIpos = { ma_hd: ma, thoi_diem_ban: luc, da_huy: huyR ? docHuy(huyR.giaTri) : false, dong };
    const raw = rawGon(x);
    if (raw !== undefined) hd.raw = raw;
    hoaDon.push(hd);
  }

  for (const [lyDo, n] of boVi) canhBao.push(`Bỏ ${n} hóa đơn: ${lyDo}`);
  if (dongKhongMa > 0) canhBao.push(`${dongKhongMa} dòng không có mã món lẫn mã vạch — chỉnh TRUONG_IPOS.maMon / maVach`);
  return { hoaDon, canhBao, soGoc: mang.length };
}

/** Gộp HĐ trùng mã (giữ bản sau cùng — iPOS trả trùng khi phân trang lệch). */
export function gopTrungMa(ds: HoaDonIpos[]): HoaDonIpos[] {
  const m = new Map<string, HoaDonIpos>();
  for (const h of ds) { m.delete(h.ma_hd); m.set(h.ma_hd, h); }
  return [...m.values()];
}

/** Chia lô ≤ n HĐ (kho_ipos_nhan nhận tối đa 200). */
export function chiaLo<T>(ds: T[], n = 200): T[][] {
  const ra: T[][] = [];
  for (let i = 0; i < ds.length; i += n) ra.push(ds.slice(i, i + n));
  return ra;
}

/** Còn trang sau không: theo cờ trong kết quả nếu có, không thì theo trang đầy. */
export function conTrangSau(json: unknown, trang: number, soGoc: number): boolean {
  if (laObj(json)) {
    const noi = laObj(json.data) ? [json, json.data] : [json];
    for (const o of noi) {
      const c = lay(o, TRUONG_IPOS.conTrang);
      if (c) {
        if (typeof c.giaTri === 'boolean') return c.giaTri;
        const n = so(c.giaTri);
        if (n !== undefined) return n > trang;
      }
      const t = lay(o, TRUONG_IPOS.tongTrang);
      if (t) { const n = so(t.giaTri); if (n !== undefined) return trang < n; }
    }
  }
  return soGoc >= TRUONG_IPOS.phanTrang.coTrang;
}

/** Giờ cho tham số tu / den theo TRUONG_IPOS.dinhDangGioThamSo. */
export function gioThamSo(iso: string): string {
  const d = new Date(iso);
  switch (TRUONG_IPOS.dinhDangGioThamSo) {
    case 'iso': return d.toISOString();
    case 'epoch_s': return String(Math.floor(d.getTime() / 1000));
    case 'epoch_ms': return String(d.getTime());
    default: {
      const v = new Date(d.getTime() + 7 * 3600_000);
      return `${v.getUTCFullYear()}-${hai(v.getUTCMonth() + 1)}-${hai(v.getUTCDate())} `
        + `${hai(v.getUTCHours())}:${hai(v.getUTCMinutes())}:${hai(v.getUTCSeconds())}`;
    }
  }
}

export interface CuaSoIpos {
  api_url: string;
  duong_dan_hoa_don: string;
  pos_parent: string;
  pos_id: string;
  tu_luc: string;
  den_luc: string;
}

/**
 * URL lấy một trang hóa đơn. CÓ TOKEN — không bao giờ ghi URL này ra log /
 * câu lỗi / database. Dùng `xoaToken` trước khi in bất cứ gì có thể chứa nó.
 */
export function taoUrlHoaDon(c: CuaSoIpos, token: string, trang: number): string {
  const goc = c.api_url.replace(/\/+$/, '');
  const duong = c.duong_dan_hoa_don.startsWith('/') ? c.duong_dan_hoa_don : '/' + c.duong_dan_hoa_don;
  const u = new URL(goc + duong);
  const t = TRUONG_IPOS.thamSo;
  u.searchParams.set(t.token, token);
  u.searchParams.set(t.posParent, c.pos_parent);
  u.searchParams.set(t.posId, c.pos_id);
  u.searchParams.set(t.tu, gioThamSo(c.tu_luc));
  u.searchParams.set(t.den, gioThamSo(c.den_luc));
  u.searchParams.set(t.trang, String(trang));
  u.searchParams.set(t.coTrang, String(TRUONG_IPOS.phanTrang.coTrang));
  return u.toString();
}

/**
 * Xóa token khỏi một câu (lỗi, log): thay đúng chuỗi token (cả dạng mã hóa
 * URL) và mọi "access_token=…" / "token: …" bằng ***.
 */
export function xoaToken(cau: string, token?: string): string {
  let s = String(cau ?? '');
  if (token && token.length >= 4) {
    for (const t of new Set([token, encodeURIComponent(token)])) s = s.split(t).join('***');
  }
  return s.replace(/(access_token|token)(["']?\s*[=:]\s*["']?)[^&\s"',;]+/gi, '$1$2***');
}
