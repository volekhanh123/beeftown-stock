/**
 * KHO — CÂU BÁO SAU KHI CHUYỂN HƯỚNG
 *
 * Trang kho ghi dữ liệu rồi CHUYỂN HƯỚNG sang GET (303), để bấm F5 không gửi
 * lại lệnh "duyệt phiếu" hay "xuất bếp" lần nữa. Câu "Đã duyệt phiếu..." đi
 * theo qua một cookie dùng một lần.
 *
 * Cookie riêng của kho (bt_kho_bao, chỉ sống dưới /noi-bo/kho) — không đụng
 * vào cookie kết quả của form công khai trong lib/phien.ts.
 *
 * Câu báo mang cả bản tiếng Anh (cauEn) nếu thư viện có sẵn: người bấm có thể
 * đổi tiếng giữa lúc ghi và lúc đọc, nên giữ cả hai rồi để BaoKho chọn.
 */

import type { AstroCookies } from 'astro';
import { kqHai, type KetQua } from './chung.ts';
import { CAU_DOC_FORM_HONG } from '../gui-noi-bo.ts';

const COOKIE_BAO = 'bt_kho_bao';

/** Bản chạy thật (HTTPS) thì cookie chỉ đi qua HTTPS. Ngoài Astro (kiểm thử Node) import.meta.env không có. */
const banThat = () => (import.meta.env as Record<string, unknown> | undefined)?.PROD === true;

export function ghiBao(cookies: AstroCookies, bao: KetQua) {
  cookies.set(COOKIE_BAO, JSON.stringify(bao), {
    httpOnly: true,
    secure: banThat(),
    sameSite: 'lax',
    path: '/noi-bo/kho',
    maxAge: 120,
  });
}

// -----------------------------------------------------------------------------
// CHỮ ĐIỀN LẠI SAU MỘT LƯỢT GỬI KHÔNG THÀNH (issue #194, đợt 2 — máy dùng chung)
// -----------------------------------------------------------------------------
// Trang báo lỗi là một lượt GET (guiRoiChuyen, lib/kho/trang.ts), không còn dựng form ngay trong trả lời của lượt
// POST: mục lịch sử của trang như vậy giữ nguyên thân form, kể cả mật khẩu, PIN. Chữ cần điền lại đi theo cookie dùng
// một lần, chỉ của đúng trang (Path = đường dẫn trang), HttpOnly, sống 60 giây. Chỉ các ô trang liệt kê — và KHÔNG BAO
// GIỜ ô mật khẩu / PIN: tên ô có "mat_khau" hay "pin" bị bỏ cả lúc ghi lẫn lúc đọc, kể cả khi trang lỡ liệt kê. Ô dài
// hơn 254 ký tự (email dài nhất Supabase nhận) thì bỏ ô đó — cookie không phình quá cỡ trình duyệt nhận.
// Kiểm: crm/test/test-kho-may-lich-su.mjs.
// -----------------------------------------------------------------------------
const COOKIE_NHAP_LAI = 'bt_kho_nhap_lai';
const O_TOI_DA = 254;
const laOBiMat = (o: string) => /mat_khau|pin/i.test(o);

/** Các ô được giữ của `v`: có trong `cacO`, không phải ô bí mật, là chuỗi không quá dài. */
function oDuocGiu(cacO: readonly string[], v: Record<string, unknown>): Record<string, string> {
  const ra: Record<string, string> = {};
  for (const o of cacO) {
    if (laOBiMat(o) || !Object.prototype.hasOwnProperty.call(v, o)) continue;
    const g = v[o];
    if (typeof g === 'string' && g.length <= O_TOI_DA) ra[o] = g;
  }
  return ra;
}

/** Ghi chữ cần điền lại trên trang `duong` (lần GET kế tiếp của chính trang đó đọc). Không có ô nào để giữ thì thôi. */
export function ghiNhapLai(cookies: AstroCookies, duong: string, cacO: readonly string[], giaTri: Record<string, unknown>) {
  const giu = oDuocGiu(cacO, giaTri ?? {});
  if (Object.keys(giu).length === 0) return;
  try {
    cookies.set(COOKIE_NHAP_LAI, JSON.stringify(giu), { httpOnly: true, secure: banThat(), sameSite: 'lax', path: duong, maxAge: 60 });
  } catch { /* không ghi được thì form trống — vẫn không gửi lại gì */ }
}

/**
 * Chữ điền lại của lần gửi vừa rồi, CHỈ các ô `cacO`. Đọc một lần: đọc là xóa. null = không có, hoặc không đọc được.
 */
export function docNhapLai<O extends string>(
  cookies: AstroCookies, duong: string, cacO: readonly O[],
): Partial<Record<O, string>> | null {
  let tho: string | undefined;
  try { tho = cookies.get(COOKIE_NHAP_LAI)?.value; } catch { return null; }
  if (tho === undefined) return null;
  try { cookies.delete(COOKIE_NHAP_LAI, { path: duong }); } catch { /* tự hết hạn sau 60 giây */ }
  try {
    const v: unknown = JSON.parse(tho);
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
    return oDuocGiu(cacO, v as Record<string, unknown>) as Partial<Record<O, string>>;
  } catch { return null; }
}

/**
 * Lượt xem này không đọc được thân POST (docFormGui đã đánh dấu): câu báo lỗi hai thứ tiếng,
 * cùng câu với CRM. BaoKho hiện nó trên MỌI trang kho — không trang nào tự đặt câu này.
 */
export function baoDocFormHong(locals: { formGuiHong?: boolean } | undefined): KetQua | null {
  return locals?.formGuiHong ? kqHai(false, CAU_DOC_FORM_HONG) : null;
}

export function docBao(cookies: AstroCookies): KetQua | null {
  const raw = cookies.get(COOKIE_BAO)?.value;
  if (!raw) return null;
  cookies.delete(COOKIE_BAO, { path: '/noi-bo/kho' });
  try {
    const v = JSON.parse(raw);
    if (typeof v?.ok !== 'boolean' || typeof v?.cau !== 'string') return null;
    // cauEn: bản tiếng Anh do thư viện viết sẵn (KetQua.cauEn) — có thể vắng.
    return typeof v.cauEn === 'string' ? { ok: v.ok, cau: v.cau, cauEn: v.cauEn } : { ok: v.ok, cau: v.cau };
  } catch { return null; }
}
