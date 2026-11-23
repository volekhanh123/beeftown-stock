/**
 * GIỜ MỞ CỬA CHO DỮ LIỆU CÓ CẤU TRÚC (JSON-LD openingHoursSpecification)
 * ======================================================================
 * Google đưa giờ này lên kết quả tìm kiếm và Maps, nên khai sai là dẫn khách tới một cánh cửa đóng. Vì vậy giờ CHỈ
 * được khai khi cả hai nửa đã công bố:
 *   · khóa gio_phuc_vu_da_chot của cổng nội dung (nd.gio_phuc_vu_da_chot === true) — chủ đã chốt giờ;
 *   · chi_nhanh_cong_khai() trả gio_da_chot = true cho chi nhánh của trang, kèm bốn mốc trưa / tối
 *     (migration 0013: hàm này tự giấu bốn mốc khi công tắc tắt — bảng chi_nhanh có sẵn giờ mặc định 11:00–14:00,
 *     17:00–22:00 mà không ai chốt, nên đó là chốt chặn thứ hai, không phải thừa).
 * Chưa công bố → không đọc database lần thứ hai, trang không khai giờ (đúng như trước).
 *
 * GIẢ ĐỊNH CẦN KHÁNH XÁC NHẬN: chi_nhanh chỉ có hai khung trong ngày (trưa, tối), không có cột ngày nghỉ, nên mỗi khung
 * khai cho cả bảy ngày. Quán nghỉ một ngày cố định thì phải có nơi ghi ngày nghỉ trước khi bật gio_phuc_vu_da_chot.
 *
 * Không bao giờ ném lỗi (trang công khai đúng và đủ khi database chậm hay hỏng): lỗi → không có giờ, kèm đúng một
 * dòng log "[gio-mo-cua]". Hạn chờ 2 giây (Worker không có hạn mặc định) vì lời gọi này nằm trên đường dựng MỌI trang.
 * Trang dùng docGioMoCuaChoTrang: nhớ kết quả ĐÚNG 60 giây trong bộ nhớ của Worker (giờ đổi hiếm, lệch một phút ở dữ
 * liệu có cấu trúc không hại gì) để mỗi lượt xem trang không tốn thêm một lời gọi database; lỗi không được nhớ, và
 * công tắc gio_phuc_vu_da_chot tắt là hết giờ NGAY (nó nằm trong nd, đọc mỗi lượt, không qua bộ nhớ).
 * Kiểm thử: crm/test/test-cong-khai-seo.mjs.
 *
 * HIỆN GIỜ TRÊN TRANG (23/11/2026): JSON-LD khai giờ thì khách cũng phải đọc được giờ đó (hướng dẫn dữ liệu có cấu trúc của
 * Google: không đánh dấu thứ người đọc không thấy). Chân trang (ChanTrang.astro) và khối "Địa chỉ và lối lên" (LenTang3.astro,
 * trang chủ và trang Đến Beeftown) in cauGioMoCua(khung) — CÙNG khung giờ, CÙNG hai công tắc với JSON-LD, không giờ nào viết
 * tay, không giờ mặc định. Cả ba nơi lấy kết quả qua docGioMoCuaTrongLuot: một lượt xem trang một lần đọc (không thêm lời
 * gọi database; lỗi cũng chỉ thử một lần mỗi lượt, không ba lần).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { taoClient, maChiNhanh, type NgonNgu, type NoiDung } from './noi-dung.ts';

/** Một khung giờ trong ngày, "HH:MM" 24 giờ. */
export interface KhungGio { mo: string; dong: string }

/** Hạn chờ database (ms). */
export const HET_GIO_GIO_MO_CUA_MS = 2000;

const NGAY_TRONG_TUAN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

/** "11:00", "11:00:00", "9:30" → "HH:MM"; giờ ngoài 00–23, phút ngoài 00–59 hay thứ không phải chuỗi → null. */
function hhmm(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/.exec(v.trim());
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
}

interface DongChiNhanh {
  ma?: unknown; gio_da_chot?: unknown;
  trua_bat_dau?: unknown; trua_ket_thuc?: unknown; toi_bat_dau?: unknown; toi_ket_thuc?: unknown;
}

/**
 * Một dòng chi_nhanh_cong_khai() → các khung giờ đã công bố. Rỗng khi một trong hai công tắc chưa bật. Khung thiếu một
 * đầu, sai dạng, hoặc không có thời lượng dương (mở ≥ đóng — ca qua nửa đêm, mà schema.org phải khai bằng hai khung và
 * bảng chi_nhanh không có kiểu đó) thì KHÔNG khai giờ nào: khai nửa vời (chỉ ca trưa) là nói với Google rằng buổi tối
 * quán đóng cửa. Chỉ khung trống cả hai đầu (không có ca đó) mới được bỏ qua; trưa đứng trước tối.
 */
export function khungGioCongBo(nd: Pick<NoiDung, 'gio_phuc_vu_da_chot'>, dong: DongChiNhanh | null | undefined): KhungGio[] {
  if (nd.gio_phuc_vu_da_chot !== true || !dong || dong.gio_da_chot !== true) return [];
  const khung: KhungGio[] = [];
  for (const [d, k] of [[dong.trua_bat_dau, dong.trua_ket_thuc], [dong.toi_bat_dau, dong.toi_ket_thuc]] as const) {
    if ((d === null || d === undefined) && (k === null || k === undefined)) continue;
    const mo = hhmm(d), dong2 = hhmm(k);
    if (!mo || !dong2 || mo >= dong2) return [];
    khung.push({ mo, dong: dong2 });
  }
  return khung;
}

/** Các khung giờ → openingHoursSpecification của schema.org; không khung nào thì mảng rỗng (không khai gì). */
export function gioMoCuaJsonLd(khung: readonly KhungGio[]): Record<string, unknown>[] {
  return khung.map(k => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: [...NGAY_TRONG_TUAN],
    opens: k.mo,
    closes: k.dong,
  }));
}

/**
 * Giờ mở cửa đã công bố của chi nhánh. Chưa công bố gio_phuc_vu_da_chot (nd đã đọc sẵn) thì KHÔNG gọi database.
 * `hetGioMs` chỉ để kiểm thử đổi.
 */
export async function docGioMoCua(
  nd: Pick<NoiDung, 'gio_phuc_vu_da_chot'>,
  client: Pick<SupabaseClient, 'rpc'> | null = taoClient(),
  ma: string = maChiNhanh(),
  hetGioMs: number = HET_GIO_GIO_MO_CUA_MS,
): Promise<KhungGio[]> {
  return (await layGioMoCua(nd, client, ma, hetGioMs)).khung;
}

/** Kết quả một lần đọc: `loi` = true khi database lỗi / hết giờ (không được nhớ). */
interface KetQuaGio { khung: KhungGio[]; loi: boolean }

async function layGioMoCua(
  nd: Pick<NoiDung, 'gio_phuc_vu_da_chot'>,
  client: Pick<SupabaseClient, 'rpc'> | null,
  ma: string,
  hetGioMs: number,
): Promise<KetQuaGio> {
  if (nd.gio_phuc_vu_da_chot !== true || !client) return { khung: [], loi: false };
  const huy = new AbortController();
  let hen: ReturnType<typeof setTimeout> | undefined;
  try {
    const truyVan = client.rpc('chi_nhanh_cong_khai');
    // Builder của supabase-js có abortSignal(); client giả của kiểm thử có thể không có.
    const coHuy = truyVan as unknown as { abortSignal?: (s: AbortSignal) => unknown };
    if (typeof coHuy.abortSignal === 'function') coHuy.abortSignal(huy.signal);
    const hetGio = new Promise<'het_gio'>(xong => { hen = setTimeout(() => xong('het_gio'), hetGioMs); });
    const kq = await Promise.race([truyVan, hetGio]);
    if (kq === 'het_gio') {
      huy.abort();
      console.error(`[gio-mo-cua] hết giờ sau ${hetGioMs} ms`);
      return { khung: [], loi: true };
    }
    if (kq.error) {
      console.error('[gio-mo-cua] không đọc được giờ mở cửa:', kq.error.code ?? '', kq.error.message);
      return { khung: [], loi: true };
    }
    const ds = (Array.isArray(kq.data) ? kq.data : []) as DongChiNhanh[];
    const dong = ds.find(c => String(c?.ma ?? '').toLowerCase() === ma.toLowerCase()) ?? null;
    return { khung: khungGioCongBo(nd, dong), loi: false };
  } catch (e) {
    console.error('[gio-mo-cua] không gọi được database:', e instanceof Error ? e.message : String(e));
    return { khung: [], loi: true };
  } finally {
    clearTimeout(hen);
  }
}

/**
 * Một lượt xem trang = một lần đọc: khung trang (JSON-LD), chân trang và khối "Địa chỉ và lối lên" cùng hỏi, cùng một Promise.
 * `luot` là Astro.request (một đối tượng cho cả lượt dựng trang). Không bao giờ ném lỗi (như docGioMoCuaChoTrang).
 */
const theoLuot = new WeakMap<object, Promise<KhungGio[]>>();
export function docGioMoCuaTrongLuot(
  luot: object,
  nd: Pick<NoiDung, 'gio_phuc_vu_da_chot'>,
  client: Pick<SupabaseClient, 'rpc'> | null = taoClient(),
  ma: string = maChiNhanh(),
  bayGio: number = Date.now(),
): Promise<KhungGio[]> {
  let p = theoLuot.get(luot);
  if (!p) { p = docGioMoCuaChoTrang(nd, client, ma, bayGio); theoLuot.set(luot, p); }
  return p;
}

const NHAN_GIO: Record<NgonNgu, { nhan: string; noi: string }> = {
  vi: { nhan: 'Mở cửa mỗi ngày', noi: ' và ' },
  en: { nhan: 'Open every day', noi: ' and ' },
  ko: { nhan: '매일 영업', noi: ', ' },
};

/**
 * Câu giờ mở cửa cho khách đọc, dựng từ khung đã công bố: "Mở cửa mỗi ngày: 11:00–14:00 và 17:00–23:00". Không khung → null
 * (không in gì, không giờ mặc định). "Mỗi ngày" là điều JSON-LD cũng khai (cả bảy ngày — xem GIẢ ĐỊNH ở đầu file).
 */
export function cauGioMoCua(khung: readonly KhungGio[], ngonNgu: NgonNgu): string | null {
  if (khung.length === 0) return null;
  const t = NHAN_GIO[ngonNgu];
  return `${t.nhan}: ${khung.map(k => `${k.mo}–${k.dong}`).join(t.noi)}`;
}

/** Thời gian nhớ kết quả của docGioMoCuaChoTrang (ms). */
export const NHO_GIO_MO_CUA_MS = 60_000;
let boNho: { ma: string; het: number; khung: KhungGio[] } | null = null;

/** Xóa bộ nhớ — chỉ để kiểm thử. */
export function xoaBoNhoGioMoCua(): void { boNho = null; }

/**
 * Giờ mở cửa cho trang (Trang.astro): như docGioMoCua nhưng nhớ kết quả NHO_GIO_MO_CUA_MS. Công tắc chưa bật → [] ngay,
 * không đụng bộ nhớ. Lỗi, hết giờ → [] và KHÔNG nhớ (lượt sau thử lại). `bayGio` chỉ để kiểm thử.
 */
export async function docGioMoCuaChoTrang(
  nd: Pick<NoiDung, 'gio_phuc_vu_da_chot'>,
  client: Pick<SupabaseClient, 'rpc'> | null = taoClient(),
  ma: string = maChiNhanh(),
  bayGio: number = Date.now(),
): Promise<KhungGio[]> {
  if (nd.gio_phuc_vu_da_chot !== true || !client) return [];
  if (boNho && boNho.ma === ma && boNho.het > bayGio) return boNho.khung;
  const kq = await layGioMoCua(nd, client, ma, HET_GIO_GIO_MO_CUA_MS);
  if (!kq.loi) boNho = { ma, het: bayGio + NHO_GIO_MO_CUA_MS, khung: kq.khung };
  return kq.khung;
}
