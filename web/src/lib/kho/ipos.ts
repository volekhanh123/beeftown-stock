/**
 * KHO — ĐỌC DỮ LIỆU iPOS (GĐ7a; GĐ7c 0042; iPOS DW cho FABi, 27/10/2026)
 *
 * File THUẦN: không gọi mạng, không gọi database, chỉ import gio-vn.ts (cũng
 * thuần). Test Node nạp thẳng được (crm/test/test-kho-ipos-web.mjs).
 *
 * HAI THỨ TIẾNG: câu lỗi kéo hóa đơn và câu lỗi đọc một hóa đơn hiện trên màn
 * Kết nối iPOS (qua lượt kéo bù) nên có bản tiếng Anh (CAU_KEO_IPOS, CAU_HOA_DON;
 * phanTichKetQuaKeo trả thêm loiEn, phanTichHoaDon trả thêm cauEn). Cảnh báo
 * từng dòng (canhBao) chỉ vào log — tiếng Việt.
 *
 * NGUỒN: tài liệu Postman "iPOS DW - PARTNERS" (documenter.getpostman.com,
 * collection 4757280/TWDZJwQ1) — iPOS gửi kèm brand_id, mã cửa hàng và token
 * ngày 27/10/2026. Tài liệu cũ "IPOS HUB API" (Event 11 / 12, /v2/items) KHÔNG
 * dùng được với FABi: API đó đòi pos_id là số và chặn token này. Điều tài liệu nói:
 *   · Đồng bộ realtime: iPOS POST từng hóa đơn (JSON) tới webhook của mình —
 *     route /hook/ipos/<khóa>. Thành công = HTTP 200 / 201 kèm {"data": true};
 *     khác = thất bại, kèm {"error": {"code", "message"}}. Thất bại thì iPOS
 *     gửi lại tối đa 5 lần, cách nhau 30 giây. Hóa đơn cũ sửa / xóa cũng gửi lại.
 *   · Kéo chủ động: GET {goc}/api/v1/partners/get-sales?store_id&brand_id
 *     &from_update_time&to_update_time&page&page_size, token ở HEADER
 *     access_token. Khoảng cập nhật từ 15 phút đến 1 ngày; page_size ≤ 1000.
 *     Kết quả {"data": [hóa đơn]} — mỗi hóa đơn cùng cấu trúc với webhook.
 *   · Hóa đơn: sale_id (duy nhất trong một brand_id) → ma_hd; datastate 0 mới
 *     / 1 sửa / 2 xóa; sale.status là trạng thái THANH TOÁN, không phải hủy;
 *     giờ in = ngày date_last + hour_last:minute_last (giờ VN); sale_detail[]
 *     có sale_detail_id, item_id, description, quantity, amount — KHÔNG mã
 *     vạch, KHÔNG kg từng nhãn. Hai dòng cùng item_id là hai dòng.
 *   · origin_sale_id ("hóa đơn gốc khi sửa / xóa"): iPOS xác nhận 27/10/2026 —
 *     sửa hóa đơn đã in thì FABi tạo sale_id MỚI có origin_sale_id trỏ hóa đơn
 *     cũ, và gửi lại hóa đơn cũ với datastate = 2. Nên mỗi sale_id là một hóa
 *     đơn, mỗi lần gửi là trạng thái hiện tại của chính nó: hóa đơn mới được ghi,
 *     hóa đơn cũ bị đảo ngược; cùng sale_id gửi lại nội dung khác thì database
 *     đảo ngược rồi ghi lại (0037). origin_sale_id chỉ giữ trong raw để đối chiếu
 *     — KHÔNG khóa theo nó: khóa theo gốc thì bản xóa hóa đơn cũ đến sau sẽ đè mất
 *     hàng của hóa đơn mới.
 *   · sale.is_temp là cờ "đã in phiếu tạm tính trước khi thanh toán" của hóa đơn
 *     thật, không phải hóa đơn nháp — không lọc theo nó.
 *   · KHÔNG có API đọc thực đơn.
 *   · Khách (membership_*, vat_customer_*, address_delivery…), nhân viên,
 *     thanh toán: KHÔNG lưu — raw chỉ giữ các khóa trong TRUONG_IPOS.rawGiu.
 *
 * Payload gửi `kho_ipos_nhan_callback` / `kho_ipos_nhan` (0042):
 *   { ma_hd, thoi_diem_ban (ISO có múi giờ), da_huy, raw?, dong: [
 *       { khoa_dong, ma_ipos, ten_ipos?, so_luong?, thanh_tien? }] }
 * Đổi so_luong ra kg / gói là việc của DATABASE (theo "bán theo" ở Ghép món).
 *
 * KHÔNG BAO GIỜ đưa GIÁ TRỊ vào câu cảnh báo — chỉ tên khóa.
 */

import { gioVnTuMs, isoGioVn } from '../gio-vn.ts';

/** Câu hai thứ tiếng — cùng khuôn HaiThuTieng (lib/ngon-ngu-noi-bo.ts); file này không import gì. */
type HaiThuTieng = { readonly vi: string; readonly en: string };

// =============================================================================
// MỌI ĐIỀU VỀ API iPOS NẰM Ở ĐÂY (theo tài liệu Postman nói trên)
// =============================================================================
export const TRUONG_IPOS = {
  nguon: 'Postman "iPOS DW - PARTNERS" (Kéo chủ động · Đồng bộ realtime)',
  /** Máy chủ API bản thật (tài liệu ghi bản thử dwapis-dev.ipos.vn). */
  goc: 'https://dwapis.ipos.vn',

  /** Body webhook tối đa (byte). */
  bodyToiDa: 256 * 1024,

  /** GET {goc}/api/v1/partners/get-sales — token ở header, không bao giờ trên URL. */
  keo: {
    duongDan: '/api/v1/partners/get-sales',
    thamSo: {
      cuaHang: 'store_id', thuongHieu: 'brand_id', tuLuc: 'from_update_time', denLuc: 'to_update_time',
      trang: 'page', coTrang: 'page_size',
    },
    tieuDeToken: 'access_token',
    /** from_update_time / to_update_time: khoảng từ 15 phút đến 1 ngày (giây). */
    cuaSoToiThieuGiay: 900,
    cuaSoToiDaGiay: 86_400,
    /** Hóa đơn mỗi trang (tối đa của iPOS). */
    coTrang: 1000,
    /** Số trang tối đa một cửa sổ — 50 000 hóa đơn một ngày là quá đủ cho một cửa hàng. */
    trangToiDa: 50,
  },
  /** Thời gian chờ một lần gọi iPOS (ms). */
  timeoutMs: 20_000,

  /** datastate: 0 mới, 1 sửa, 2 xóa. */
  datastateXoa: 2,
  /** Dòng tối đa một hóa đơn (database cũng chặn 500). */
  dongToiDa: 500,

  /** raw: CHỈ giữ các khóa này — thông tin khách, nhân viên, thanh toán không bao giờ vào database. */
  rawGiu: {
    hoaDon: ['sale_id', 'origin_sale_id', 'datastate', 'tran_date', 'brand_id', 'store_id', 'fb_store_id', 'pos_type',
      'amount', 'amount_org', 'created_at', 'updated_at'],
    sale: ['sale_id', 'origin_sale_id', 'store_id', 'tran_id', 'tran_no', 'tran_date', 'tran_date_orig', 'date_last',
      'hour_last', 'minute_last', 'status', 'is_temp', 'source_id', 'area_id', 'dinner_table_id', 'vat', 'discount_extra',
      'service_charge', 'shift_charge', 'coupon_amount', 'number_people'],
    dong: ['sale_detail_id', 'item_id', 'item_id_mapping', 'description', 'quantity', 'unit_id', 'price_org', 'price_sale', 'amount',
      'discount', 'discount_amount', 'is_gift', 'is_eat_with', 'parent_item_id', 'package_id', 'promotion_id'],
  },
  /** raw lớn hơn chừng này (ký tự JSON) thì không lưu. */
  rawToiDa: 30_000,
} as const;

// =============================================================================
// KIỂU
// =============================================================================
export interface DongIpos {
  khoa_dong: string;
  ma_ipos?: string;
  ten_ipos?: string;
  /** quantity gốc — database đổi ra kg / gói. */
  so_luong?: number;
  thanh_tien?: number;
}

export interface HoaDonIpos {
  ma_hd: string;
  /** ISO, luôn có múi giờ. */
  thoi_diem_ban: string;
  da_huy: boolean;
  raw?: unknown;
  dong: DongIpos[];
}

export type KetQuaHoaDon =
  | { loai: 'hoa_don'; brandId?: string; storeId?: string; hoaDon: HoaDonIpos; canhBao: string[] }
  | { loai: 'loi'; cau: string; cauEn: string };

// =============================================================================
// TIỆN ÍCH
// =============================================================================
type Obj = Record<string, unknown>;
const laObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

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

/**
 * Đọc thời điểm bán → ISO có múi giờ, hoặc null.
 *  - "YYYY-MM-DD[T ]HH:mm[:ss[.sss]]" có hoặc không múi giờ (không múi → +07:00)
 *  - "DD/MM/YYYY HH:mm[:ss]" (giờ VN)
 *  - số / chuỗi toàn số: epoch giây (≤ 10^11) hoặc mili giây
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

  // Ngày giờ không có thật (31/02, 25:00) → null: JS tự "lăn" 31/02 sang 03/03, còn Postgres từ chối —
  // chuyển xuống database thì hook trả 500 và iPOS Hub gửi lại mãi đúng hóa đơn đó (test-gio-vn.mjs).
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,6})?)?\s*(Z|[+-]\d{2}:?\d{2}|[+-]\d{2})?$/i);
  if (m) {
    const [, y, mo, d, h, mi, se = '00', le = '', mui] = m;
    const vn = isoGioVn(+y, +mo, +d, +h, +mi, +se, le);
    if (!vn) return null;
    if (!mui) return vn;
    const dt = new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}${le}${mui.length === 3 ? mui + ':00' : mui}`);
    return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, d, mo, y, h, mi, se = '00'] = m;
    return isoGioVn(+y, +mo, +d, +h, +mi, +se);
  }
  return null;
}

/** Số nguyên trong [tu, den], hoặc undefined. */
function soNguyen(v: unknown, tu: number, den: number): number | undefined {
  const n = so(v);
  return n !== undefined && Number.isInteger(n) && n >= tu && n <= den ? n : undefined;
}

/** Epoch giây (≤ 10^11) hoặc mili giây → ms; không phải số dương → undefined. */
function epochMs(v: unknown): number | undefined {
  const n = so(v);
  if (n === undefined || n <= 0) return undefined;
  const ms = n < 1e11 ? n * 1000 : n;
  return Number.isNaN(new Date(ms).getTime()) ? undefined : ms;
}

/**
 * Giờ in hóa đơn (giờ VN, ISO có múi) hoặc null:
 *   1. ngày của date_last (thiếu thì tran_date) theo lịch VN + hour_last:minute_last;
 *   2. thiếu giờ / phút → created_at (mốc đầy đủ);
 *   3. vẫn thiếu → chính mốc date_last / tran_date.
 * date_last / tran_date trong tài liệu là 00:00 giờ VN của ngày bán (epoch giây) —
 * chỉ lấy NGÀY rồi ghép giờ, nên mốc có kèm giờ cũng không bị cộng đôi.
 */
export function thoiDiemBan(x: unknown): string | null {
  if (!laObj(x)) return null;
  const s = laObj(x.sale) ? x.sale : {};
  const ngayMs = epochMs(s.date_last) ?? epochMs(s.tran_date) ?? epochMs(x.tran_date);
  const gio = soNguyen(s.hour_last, 0, 23);
  const phut = soNguyen(s.minute_last, 0, 59);
  if (ngayMs !== undefined && gio !== undefined && phut !== undefined) {
    const [y, m, d] = gioVnTuMs(ngayMs).slice(0, 10).split('-').map(Number);
    const iso = isoGioVn(y, m, d, gio, phut);
    if (iso) return iso;
  }
  const tao = docThoiDiem(x.created_at);
  if (tao) return tao;
  return ngayMs !== undefined ? new Date(ngayMs).toISOString() : null;
}

/** Chỉ giữ các khóa cho phép (TRUONG_IPOS.rawGiu) — không bao giờ thông tin khách / nhân viên / thanh toán. */
function rawGon(x: Obj): unknown {
  const G = TRUONG_IPOS.rawGiu;
  const lay = (o: unknown, khoa: readonly string[]) => {
    const ra: Obj = {};
    if (!laObj(o)) return ra;
    for (const k of khoa) {
      const v = o[k];
      if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) ra[k] = v;
    }
    return ra;
  };
  const r: Obj = lay(x, G.hoaDon);
  if (laObj(x.sale)) r.sale = lay(x.sale, G.sale);
  if (Array.isArray(x.sale_detail)) r.sale_detail = x.sale_detail.map(d => lay(d, G.dong));
  try { return JSON.stringify(r).length <= TRUONG_IPOS.rawToiDa ? r : undefined; } catch { return undefined; }
}

// =============================================================================
// HÓA ĐƠN — webhook "Đồng bộ realtime" và từng phần tử của "Kéo chủ động"
// =============================================================================
/**
 * Câu lỗi khi đọc một hóa đơn, hai thứ tiếng. Bản tiếng Việt đi vào thân trả lời
 * HTTP cho iPOS, log, và nhật ký lượt kéo bù. Chỉ tên khóa, không giá trị.
 */
export const CAU_HOA_DON = {
  khongObject: { vi: 'Nội dung không phải một object JSON', en: 'The content is not a JSON object' },
  saleHong: { vi: 'Khóa "sale" không phải object', en: 'The "sale" key is not an object' },
  thieuMa: { vi: 'Hóa đơn thiếu "sale_id"', en: 'The invoice has no "sale_id"' },
  khongGio: {
    vi: 'Hóa đơn không đọc được giờ bán ở "date_last" / "tran_date" / "created_at"',
    en: 'The sale time in "date_last" / "tran_date" / "created_at" could not be read',
  },
  dongHong: { vi: 'Khóa "sale_detail" không phải danh sách', en: 'The "sale_detail" key is not a list' },
  quaDong: {
    vi: `Hóa đơn có hơn ${TRUONG_IPOS.dongToiDa} dòng`,
    en: `The invoice has more than ${TRUONG_IPOS.dongToiDa} lines`,
  },
} satisfies Record<string, HaiThuTieng>;

/**
 * Đọc MỘT hóa đơn iPOS DW. Không bao giờ ném lỗi.
 *   · { loai: 'hoa_don', brandId?, storeId?, hoaDon, canhBao } — brandId / storeId
 *     để hook tìm chi nhánh (kho_ipos_tim_chi_nhanh) và lượt kéo kiểm đúng cửa hàng.
 *   · hỏng → { loai: 'loi', cau, cauEn } (câu chỉ có tên khóa, không giá trị).
 */
export function phanTichHoaDon(x: unknown): KetQuaHoaDon {
  const C = CAU_HOA_DON;
  const hong = (c: HaiThuTieng): KetQuaHoaDon => ({ loai: 'loi', cau: c.vi, cauEn: c.en });
  if (!laObj(x)) return hong(C.khongObject);
  const s = laObj(x.sale) ? x.sale : null;
  if (x.sale !== undefined && x.sale !== null && !s) return hong(C.saleHong);
  const maHd = chu(x.sale_id) ?? chu(s?.sale_id);
  if (!maHd) return hong(C.thieuMa);
  const luc = thoiDiemBan(x);
  if (!luc) return hong(C.khongGio);
  if (x.sale_detail !== undefined && x.sale_detail !== null && !Array.isArray(x.sale_detail)) return hong(C.dongHong);
  const ds = (Array.isArray(x.sale_detail) ? x.sale_detail : []) as unknown[];
  if (ds.length > TRUONG_IPOS.dongToiDa) return hong(C.quaDong);

  // khoa_dong = sale_detail_id khi mọi dòng có mã riêng, không trùng; không thì chỉ số dòng (từ 0).
  const maDong = ds.map(d => (laObj(d) ? chu(d.sale_detail_id) : undefined));
  const theoMa = maDong.every(m => m !== undefined) && new Set(maDong).size === maDong.length;

  const canhBao: string[] = [];
  let khongMa = 0;
  let slHong = 0;
  const dong: DongIpos[] = ds.map((d, i) => {
    const r: DongIpos = { khoa_dong: theoMa ? maDong[i]! : String(i) };
    if (!laObj(d)) { khongMa++; return r; }
    const ma = chu(d.item_id);
    if (ma) r.ma_ipos = ma; else khongMa++;
    const ten = chu(d.description, 200);
    if (ten) r.ten_ipos = ten;
    const sl = so(d.quantity);
    if (sl !== undefined && sl >= 0 && sl <= 100000) r.so_luong = Math.round(sl * 1000) / 1000;
    else slHong++;
    const t = so(d.amount);
    if (t !== undefined && t >= 0) r.thanh_tien = Math.round(t);
    return r;
  });
  if (khongMa) canhBao.push(`${khongMa} dòng thiếu "item_id"`);
  if (slHong) canhBao.push(`${slHong} dòng thiếu hoặc sai "quantity"`);

  const hoaDon: HoaDonIpos = {
    ma_hd: maHd, thoi_diem_ban: luc, da_huy: so(x.datastate) === TRUONG_IPOS.datastateXoa, dong,
  };
  const raw = rawGon(x);
  if (raw !== undefined) hoaDon.raw = raw;
  const dong0 = ds.find(laObj);
  const brandId = chu(x.brand_id, 60) ?? chu(s?.brand_id, 60);
  const storeId = chu(x.store_id, 60) ?? chu(s?.store_id, 60) ?? chu(dong0?.store_id, 60);
  return { loai: 'hoa_don', ...(brandId ? { brandId } : {}), ...(storeId ? { storeId } : {}), hoaDon, canhBao };
}

// =============================================================================
// KÉO CHỦ ĐỘNG — GET /api/v1/partners/get-sales
// =============================================================================
/**
 * Câu lỗi khi kéo hóa đơn, hai thứ tiếng. Câu lỗi còn được ghi vào nhật ký lượt
 * (kho_ipos_lan_chay.loi, chỉ tiếng Việt) — dichLoiIpos() (ipos-dong-bo.ts) đọc
 * ngược cho màn tiếng Anh. Chỉ có mã lỗi, không giá trị nào.
 */
export const CAU_KEO_IPOS = {
  khongObject: { vi: 'iPOS trả về nội dung không phải object', en: 'iPOS returned something that is not an object' },
  baoLoi: {
    vi: (ma: string) => `iPOS báo lỗi khi kéo hóa đơn (mã ${ma}) — kiểm tra mã thương hiệu, mã cửa hàng và token`,
    en: (ma: string) => `iPOS reported an error while fetching invoices (code ${ma}) — check the brand code, store code and token`,
  },
  khongData: {
    vi: 'Không thấy danh sách hóa đơn (khóa "data") trong kết quả iPOS',
    en: 'No invoice list (key "data") in the iPOS result',
  },
};

/**
 * Đọc một trang kết quả kéo → danh sách hóa đơn THÔ (mỗi cái đọc tiếp bằng
 * phanTichHoaDon). loiEn: bản tiếng Anh của loi.
 */
export function phanTichKetQuaKeo(json: unknown): { hoaDon: unknown[]; loi: string | null; loiEn: string | null } {
  const C = CAU_KEO_IPOS;
  const hong = (c: HaiThuTieng) => ({ hoaDon: [], loi: c.vi, loiEn: c.en });
  if (!laObj(json)) return hong(C.khongObject);
  if (json.error !== undefined && json.error !== null && json.error !== false) {
    const ma = (laObj(json.error) ? chu(json.error.code, 20) : undefined) ?? '?';
    return hong({ vi: C.baoLoi.vi(ma), en: C.baoLoi.en(ma) });
  }
  if (!Array.isArray(json.data)) return hong(C.khongData);
  return { hoaDon: json.data, loi: null, loiEn: null };
}

export interface CuaHangIpos {
  /** brand_id — lưu ở cột pos_parent của kho_ipos_cau_hinh. */
  brandId: string;
  /** store_id (mã cửa hàng) — lưu ở cột pos_id. */
  storeId: string;
}

/**
 * URL kéo một trang hóa đơn theo khoảng giờ CẬP NHẬT (epoch giây). KHÔNG có
 * token — token đi ở header `access_token` (TRUONG_IPOS.keo.tieuDeToken).
 */
export function taoUrlKeo(c: CuaHangIpos, tuGiay: number, denGiay: number, trang: number, goc: string = TRUONG_IPOS.goc): string {
  const k = TRUONG_IPOS.keo;
  const u = new URL(goc.replace(/\/+$/, '') + k.duongDan);
  u.searchParams.set(k.thamSo.cuaHang, c.storeId);
  u.searchParams.set(k.thamSo.thuongHieu, c.brandId);
  u.searchParams.set(k.thamSo.tuLuc, String(tuGiay));
  u.searchParams.set(k.thamSo.denLuc, String(denGiay));
  u.searchParams.set(k.thamSo.trang, String(trang));
  u.searchParams.set(k.thamSo.coTrang, String(k.coTrang));
  return u.toString();
}

/**
 * Chia [tuMs, denMs] thành các cửa sổ iPOS nhận (epoch giây, mỗi cửa sổ từ 15
 * phút đến 1 ngày), theo thứ tự thời gian, tối đa `toiDa` cửa sổ. Cửa sổ ngắn
 * hơn 15 phút thì lùi đầu cửa sổ lại (đọc trùng không sao — database bỏ hóa
 * đơn trùng). Mốc hỏng hoặc đầu sau cuối → [].
 */
export function chiaCuaSo(tuMs: number, denMs: number, toiDa: number): Array<[number, number]> {
  const { cuaSoToiThieuGiay: ngan, cuaSoToiDaGiay: dai } = TRUONG_IPOS.keo;
  if (!Number.isFinite(tuMs) || !Number.isFinite(denMs) || tuMs > denMs) return [];
  const cuoi = Math.floor(denMs / 1000);
  let dau = Math.min(Math.floor(tuMs / 1000), cuoi - ngan);
  const ra: Array<[number, number]> = [];
  while (dau < cuoi && ra.length < toiDa) {
    const het = Math.min(dau + dai, cuoi);
    ra.push([Math.min(dau, het - ngan), het]);
    dau = het;
  }
  return ra;
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

/**
 * So sánh hai chuỗi trong thời gian không phụ thuộc chỗ khác nhau đầu tiên
 * (khóa callback). Độ dài khác nhau vẫn chạy hết vòng.
 */
export function bangNhauHang(a: string, b: string): boolean {
  const x = new TextEncoder().encode(String(a ?? ''));
  const y = new TextEncoder().encode(String(b ?? ''));
  const n = Math.max(x.length, y.length);
  let khac = x.length ^ y.length;
  for (let i = 0; i < n; i++) khac |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return khac === 0;
}

/** Che khóa callback cho người không phải chủ: không lộ ký tự nào. */
export function cheKhoa(khoa: string | undefined): string {
  return khoa ? '••••••••' : '';
}
