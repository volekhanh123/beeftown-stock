/**
 * KHO — ĐỌC DỮ LIỆU iPOS (GĐ7a, sửa lại theo tài liệu thật ở GĐ7c, migration 0042)
 *
 * File THUẦN: không gọi mạng, không gọi database, không import gì. Test Node
 * nạp thẳng được (crm/test/test-kho-ipos-web.mjs).
 *
 * HAI THỨ TIẾNG: câu đọc thực đơn (lỗi, cảnh báo) hiện trên màn Kết nối iPOS
 * nên có bản tiếng Anh (CAU_MENU_IPOS; phanTichMenu trả thêm loiEn,
 * canhBaoEn). Câu của phanTichCallback thì chỉ iPOS Hub (thân trả lời HTTP) và
 * log đọc — giữ tiếng Việt như cũ.
 *
 * NGUỒN: tài liệu Postman "IPOS HUB API INTERGRATION FOR MERCHANT" của iPOS
 * (mục 1 "Lấy thông tin món ăn, nhà hàng" và mục 6.1 "Event 11: sale_manager").
 * Điều tài liệu nói:
 *   · KHÔNG có API kéo danh sách hóa đơn. Thu ngân in hóa đơn → iPOS Hub POST
 *     JSON thô tới callback_url HTTPS của mình (route /hook/ipos/<khóa>).
 *     Event 11 "sale_manager" = hóa đơn cuối. Hub có thể bắn trùng → chống trùng
 *     theo (pos_parent, pos_id, tran_id): ma_hd = "<pos_id>:<tran_id>" (chi nhánh
 *     đã xác định pos_parent), database bỏ HĐ cùng mã cùng nội dung.
 *   · Dòng hàng chỉ có item_id, item_name, price, quantity, amount,
 *     discount_amount — KHÔNG mã vạch, KHÔNG kg từng nhãn. Hai dòng cùng item_id
 *     là hai dòng riêng (khoa_dong = chỉ số dòng, đếm từ 0).
 *   · membership_id / membership_name (số điện thoại, tên khách), delivery_info
 *     (địa chỉ), payment_info, sale_note: KHÔNG lưu.
 *   · Event 12 "item_changed": thực đơn đổi → đọc lại GET {api_url}/v2/items.
 *   · Không thấy event hủy hóa đơn. Bộ đọc vẫn nhận mềm `is_cancel` / `status`
 *     nếu có (CHƯA XÁC NHẬN với iPOS). Sửa HĐ = bắn lại cùng tran_id, nội dung
 *     khác → database đảo ngược rồi ghi lại (0037).
 *
 * Payload gửi `kho_ipos_nhan_callback` (0042):
 *   { ma_hd, thoi_diem_ban (ISO có múi giờ), da_huy, raw?, dong: [
 *       { khoa_dong, ma_ipos, ten_ipos?, so_luong?, thanh_tien? }] }
 * Đổi so_luong ra kg / gói là việc của DATABASE (theo "bán theo" ở Ghép món).
 *
 * KHÔNG BAO GIỜ đưa GIÁ TRỊ vào câu cảnh báo — chỉ tên khóa.
 */

/** Câu hai thứ tiếng — cùng khuôn HaiThuTieng (lib/ngon-ngu-noi-bo.ts); file này không import gì. */
type HaiThuTieng = { readonly vi: string; readonly en: string };

// =============================================================================
// MỌI ĐIỀU VỀ API iPOS NẰM Ở ĐÂY (theo tài liệu Postman nói trên)
// =============================================================================
export const TRUONG_IPOS = {
  nguon: 'Postman "IPOS HUB API INTERGRATION FOR MERCHANT" (mục 1 và 6.1)',
  /** Địa chỉ máy thử của iPOS (bản thật do iPOS cấp khi ký). */
  apiThu: 'https://apitest.foodbook.vn/ipos/ws/xpartner',

  /** Callback iPOS Hub bắn sang. */
  suKien: { hoaDon: 11, menuDoi: 12 },
  /** Body callback tối đa (byte). */
  bodyToiDa: 256 * 1024,

  /** GET {api_url}/v2/items?access_token&pos_parent&pos_id&menu_type=DELI */
  menu: {
    duongDan: '/v2/items',
    thamSo: { token: 'access_token', posParent: 'pos_parent', posId: 'pos_id', loaiMenu: 'menu_type' },
    loaiMenu: 'DELI',
    /** status nghĩa là "không bán nữa". ACTIVE | OUT_OF_STOCK | ONLY_ONLINE | ONLY_OFFLINE vẫn là món đang có. */
    ngungBan: ['DEACTIVE', 'INACTIVE', 'DELETED'],
    toiDaMon: 5000,
  },
  /** Thời gian chờ một lần gọi iPOS (ms). */
  timeoutMs: 20_000,

  /** Cờ hủy — tài liệu KHÔNG có; đọc mềm nếu iPOS gửi (chưa xác nhận). */
  huy: ['is_cancel', 'status'],
  giaTriHuy: ['cancel', 'canceled', 'cancelled', 'void', 'voided', 'deleted', 'huy', 'da_huy', 'refund', 'refunded'],

  /** Khóa bị bỏ khỏi `raw` (thông tin khách, thanh toán, token) ở mọi tầng. */
  boKhoiRaw: /^(membership|member_|customer|khach|delivery|payment|sale_note|note|phone|mobile|tel|email|address|dia_chi|user_|card|token|access_token)|phone|email|address|token/i,
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
  /** ISO, luôn có múi giờ (tran_date là giờ Việt Nam → +07:00). */
  thoi_diem_ban: string;
  da_huy: boolean;
  raw?: unknown;
  dong: DongIpos[];
}

export type KetQuaCallback =
  | { loai: 'hoa_don'; posParent: string; posId: string; hoaDon: HoaDonIpos; canhBao: string[] }
  | { loai: 'menu_doi'; posParent: string; posId: string }
  | { loai: 'khac'; eventId: number | null }
  | { loai: 'loi'; cau: string };

export interface MonIpos {
  ma_ipos: string;
  ten_ipos?: string;
  loai?: string;
  dang_ban: boolean;
}

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

const hai = (n: number) => String(n).padStart(2, '0');

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

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,6})?)?\s*(Z|[+-]\d{2}:?\d{2}|[+-]\d{2})?$/i);
  if (m) {
    const [, y, mo, d, h, mi, se = '00', le = '', mui] = m;
    if (!mui) {
      const iso = `${y}-${mo}-${d}T${h}:${mi}:${se}${le}+07:00`;
      return Number.isNaN(new Date(iso).getTime()) ? null : iso;
    }
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

/** Bỏ khóa có thông tin khách / thanh toán / token khỏi raw, ở mọi tầng. */
export function boThongTinKhach(v: unknown, sau = 0): unknown {
  if (sau > 8) return undefined;
  if (Array.isArray(v)) return v.map(x => boThongTinKhach(x, sau + 1));
  if (laObj(v)) {
    const ra: Obj = {};
    for (const [k, x] of Object.entries(v)) if (!TRUONG_IPOS.boKhoiRaw.test(k)) ra[k] = boThongTinKhach(x, sau + 1);
    return ra;
  }
  return v;
}

function rawGon(v: unknown): unknown {
  const r = boThongTinKhach(v);
  try { return JSON.stringify(r).length <= TRUONG_IPOS.rawToiDa ? r : undefined; } catch { return undefined; }
}

// =============================================================================
// CALLBACK — Event 11 sale_manager, Event 12 item_changed
// =============================================================================
/**
 * Đọc body callback của iPOS Hub. Không bao giờ ném lỗi.
 *   · event_id 11 → { loai: 'hoa_don', posParent, posId, hoaDon }
 *   · event_id 12 → { loai: 'menu_doi', posParent, posId }
 *   · event khác → { loai: 'khac' } (route trả 200, bỏ qua)
 *   · hỏng → { loai: 'loi', cau } (câu chỉ có tên khóa, không giá trị)
 */
export function phanTichCallback(json: unknown): KetQuaCallback {
  if (!laObj(json)) return { loai: 'loi', cau: 'Nội dung không phải một object JSON' };
  const ev = so(json.event_id);
  const eventId = ev !== undefined && Number.isInteger(ev) ? ev : null;

  if (eventId === TRUONG_IPOS.suKien.menuDoi) {
    const ic = json.item_changed;
    if (!laObj(ic)) return { loai: 'loi', cau: 'Event 12 thiếu khóa "item_changed"' };
    const posParent = chu(ic.pos_parent, 60);
    const posId = chu(ic.pos_id, 60);
    if (!posParent || !posId) return { loai: 'loi', cau: 'Event 12 thiếu pos_parent hoặc pos_id' };
    return { loai: 'menu_doi', posParent, posId };
  }
  if (eventId !== TRUONG_IPOS.suKien.hoaDon) return { loai: 'khac', eventId };

  const s = json.sale_manager;
  if (!laObj(s)) return { loai: 'loi', cau: 'Event 11 thiếu khóa "sale_manager"' };
  const posParent = chu(s.pos_parent, 60);
  const posId = chu(s.pos_id, 60);
  const tranId = chu(s.tran_id, 80);
  const thieu = [!posParent && 'pos_parent', !posId && 'pos_id', !tranId && 'tran_id'].filter(Boolean);
  if (thieu.length) return { loai: 'loi', cau: `Event 11 thiếu ${thieu.join(', ')}` };

  const luc = docThoiDiem(s.tran_date) ?? docThoiDiem(s.created_at);
  if (!luc) return { loai: 'loi', cau: 'Event 11 không đọc được giờ bán ở khóa "tran_date" / "created_at"' };

  if (s.items !== undefined && s.items !== null && !Array.isArray(s.items)) {
    return { loai: 'loi', cau: 'Event 11: khóa "items" không phải danh sách' };
  }
  const items = (Array.isArray(s.items) ? s.items : []) as unknown[];
  if (items.length > 500) return { loai: 'loi', cau: 'Event 11 có hơn 500 dòng' };

  const canhBao: string[] = [];
  let khongMa = 0;
  let slHong = 0;
  const dong: DongIpos[] = items.map((x, i) => {
    const d: DongIpos = { khoa_dong: String(i) };
    if (!laObj(x)) { khongMa++; return d; }
    const ma = chu(x.item_id);
    if (ma) d.ma_ipos = ma; else khongMa++;
    const ten = chu(x.item_name, 200);
    if (ten) d.ten_ipos = ten;
    const sl = so(x.quantity);
    if (sl !== undefined && sl >= 0 && sl <= 100000) d.so_luong = Math.round(sl * 1000) / 1000;
    else slHong++;
    const t = so(x.amount);
    if (t !== undefined && t >= 0) d.thanh_tien = Math.round(t);
    return d;
  });
  if (khongMa) canhBao.push(`${khongMa} dòng thiếu "item_id"`);
  if (slHong) canhBao.push(`${slHong} dòng thiếu hoặc sai "quantity"`);

  let daHuy = false;
  for (const k of TRUONG_IPOS.huy) if (s[k] !== undefined && s[k] !== null && docHuy(s[k])) daHuy = true;

  const hoaDon: HoaDonIpos = { ma_hd: `${posId}:${tranId}`, thoi_diem_ban: luc, da_huy: daHuy, dong };
  const raw = rawGon(s);
  if (raw !== undefined) hoaDon.raw = raw;
  return { loai: 'hoa_don', posParent: posParent!, posId: posId!, hoaDon, canhBao };
}

// =============================================================================
// THỰC ĐƠN — GET /v2/items
// =============================================================================
/**
 * Câu lỗi / cảnh báo khi đọc thực đơn, hai thứ tiếng. Câu lỗi còn được ghi vào
 * nhật ký lượt (kho_ipos_lan_chay.loi, chỉ tiếng Việt) — dichLoiIpos()
 * (ipos-dong-bo.ts) đọc ngược cho màn tiếng Anh. Chỉ có mã lỗi, không giá trị nào.
 */
export const CAU_MENU_IPOS = {
  khongObject: { vi: 'iPOS trả về nội dung không phải object', en: 'iPOS returned something that is not an object' },
  baoLoi: {
    vi: (ma: string) => `iPOS báo lỗi khi đọc thực đơn (mã ${ma}) — kiểm tra pos_parent, pos_id và token`,
    en: (ma: string) => `iPOS reported an error while reading the menu (code ${ma}) — check pos_parent, pos_id and the token`,
  },
  khongItems: { vi: 'Không thấy danh sách món (khóa "items") trong kết quả iPOS', en: 'No item list (key "items") in the iPOS result' },
  thieuMa: {
    vi: (n: number) => `${n} món thiếu "store_item_id" / "item_id" — bỏ qua`,
    en: (n: number) => `${n} ${n === 1 ? 'item is' : 'items are'} missing "store_item_id" / "item_id" — skipped`,
  },
};

/**
 * Đọc danh mục món iPOS → [{ma_ipos, ten_ipos, loai, dang_ban}] cho
 * kho_ipos_luu_menu. KHÔNG lấy giá (ta_price / ots_price bị bỏ).
 * ma_ipos = store_item_id (= item_id dưới máy POS, là mã callback gửi), thiếu
 * thì item_id. Món con (childs — size) cũng là món, có mã riêng.
 * loiEn / canhBaoEn: bản tiếng Anh của loi / canhBao, cùng thứ tự.
 */
export function phanTichMenu(json: unknown): {
  mon: MonIpos[]; loi: string | null; canhBao: string[]; loiEn: string | null; canhBaoEn: string[];
} {
  const C = CAU_MENU_IPOS;
  const hong = (loi: HaiThuTieng) => ({ mon: [], loi: loi.vi, canhBao: [], loiEn: loi.en, canhBaoEn: [] });
  if (!laObj(json)) return hong(C.khongObject);
  if (laObj(json.error)) {
    const ma = chu(json.error.code) ?? '?';
    return hong({ vi: C.baoLoi.vi(ma), en: C.baoLoi.en(ma) });
  }
  const data = laObj(json.data) ? json.data : json;
  if (!Array.isArray(data.items)) return hong(C.khongItems);
  const nhom = new Map<string, string>();
  if (Array.isArray(data.item_types)) {
    for (const t of data.item_types) {
      if (!laObj(t)) continue;
      const id = chu(t.id) ?? chu(t.type_id) ?? chu(t.item_type_id);
      const ten = chu(t.name, 100) ?? chu(t.item_type_name, 100);
      if (id && ten) nhom.set(id, ten);
    }
  }
  const ngung = TRUONG_IPOS.menu.ngungBan as readonly string[];
  const ra = new Map<string, MonIpos>();
  let khongMa = 0;
  const them = (x: unknown, sau: number) => {
    if (!laObj(x) || sau > 2) return;
    const ma = chu(x.store_item_id) ?? chu(x.item_id);
    if (!ma) khongMa++;
    else if (!ra.has(ma) && ra.size < TRUONG_IPOS.menu.toiDaMon) {
      const m: MonIpos = { ma_ipos: ma, dang_ban: !ngung.includes(String(x.status ?? '').trim().toUpperCase()) };
      const ten = chu(x.name, 200) ?? chu(x.item_name, 200);
      if (ten) m.ten_ipos = ten;
      const loaiMa = chu(x.type_id) ?? chu(x.item_type_id);
      const loai = (loaiMa && nhom.get(loaiMa)) ?? loaiMa;
      if (loai) m.loai = loai.slice(0, 100);
      ra.set(ma, m);
    }
    if (Array.isArray(x.childs)) for (const c of x.childs) them(c, sau + 1);
  };
  for (const x of data.items) them(x, 0);
  const canhBao = khongMa ? [C.thieuMa.vi(khongMa)] : [];
  const canhBaoEn = khongMa ? [C.thieuMa.en(khongMa)] : [];
  return { mon: [...ra.values()], loi: null, canhBao, loiEn: null, canhBaoEn };
}

export interface NoiIpos {
  api_url: string;
  pos_parent: string;
  pos_id: string;
}

/**
 * URL đọc thực đơn. CÓ TOKEN — không bao giờ ghi URL này ra log / câu lỗi /
 * database. Dùng `xoaToken` trước khi in bất cứ gì có thể chứa nó.
 */
export function taoUrlMenu(c: NoiIpos, token: string): string {
  const goc = (c.api_url || TRUONG_IPOS.apiThu).replace(/\/+$/, '');
  const u = new URL(goc + TRUONG_IPOS.menu.duongDan);
  const t = TRUONG_IPOS.menu.thamSo;
  u.searchParams.set(t.token, token);
  u.searchParams.set(t.posParent, c.pos_parent);
  u.searchParams.set(t.posId, c.pos_id);
  u.searchParams.set(t.loaiMenu, TRUONG_IPOS.menu.loaiMenu);
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
