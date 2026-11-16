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
import { dichCau } from '../cau-noi-bo.ts';

const COOKIE_BAO = 'bt_kho_bao';

/** Bản chạy thật (HTTPS) thì cookie chỉ đi qua HTTPS. Ngoài Astro (kiểm thử Node) import.meta.env không có. */
const banThat = () => (import.meta.env as Record<string, unknown> | undefined)?.PROD === true;

// Câu báo dài — câu lỗi ghép từng dòng của một phiếu, bản tiếng Anh đi kèm — có thể làm cookie quá cỡ: trình duyệt BỎ
// cả cookie (tên + giá trị + thuộc tính quá 4 KB), trang sau chuyển hướng không báo gì và người bấm tưởng đã lưu. Từ đợt 5
// của #194 cả câu lỗi cũng đi qua đây. Astro mã hóa giá trị bằng encodeURIComponent (một chữ có dấu thành tới 9 byte),
// nên cắt theo SỐ BYTE SAU MÃ HÓA, từng ký tự trọn vẹn, có dấu "…": tiếng Việt tối đa 2.400 byte, tiếng Anh 1.100 byte
// — cả cookie dưới 3.800 byte. Kiểm: crm/test/test-kho-loi-chuyen-huong.mjs nhóm 1.
const BYTE_CAU_VI = 2400;
const BYTE_CAU_EN = 1100;
/** Số byte của chuỗi trong giá trị cookie (một chuỗi JSON, sau encodeURIComponent) — gồm hai dấu ngoặc kép (6 byte). */
const soByte = (s: string) => encodeURIComponent(JSON.stringify(s)).length;
function catTheoByte(s: string, toiDa: number): string {
  if (soByte(s) <= toiDa) return s;
  const DAU_CAT = '…';
  let ra = '';
  let dem = soByte(DAU_CAT);   // hai dấu ngoặc kép và dấu "…"
  for (const kyTu of s) {      // từng ký tự trọn vẹn (kể cả ký tự ngoài BMP); JSON thoát từng ký tự riêng nên cộng dồn được
    const b = soByte(kyTu) - 6;
    if (dem + b > toiDa) break;
    ra += kyTu;
    dem += b;
  }
  return `${ra.trimEnd()}${DAU_CAT}`;
}

export function ghiBao(cookies: AstroCookies, bao: KetQua) {
  const gon: KetQua = { ok: bao.ok, cau: catTheoByte(bao.cau, BYTE_CAU_VI) };
  if (typeof bao.cauEn === 'string') gon.cauEn = catTheoByte(bao.cauEn, BYTE_CAU_EN);
  else if (gon.cau !== bao.cau) {
    // Câu database chưa có bản tiếng Anh: BaoKho tra dichCau theo NGUYÊN câu lúc hiện — câu đã cắt thì không khớp, màn
    // tiếng Anh hiện tiếng Việt cụt. Dịch bản đầy đủ trước khi cắt (dịch không được thì để BaoKho tra như cũ).
    const en = dichCau('en', bao.cau);
    if (en !== bao.cau) gon.cauEn = catTheoByte(en, BYTE_CAU_EN);
  }
  cookies.set(COOKIE_BAO, JSON.stringify(gon), {
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
// GIỜ ô bí mật: tên ô mà một PHẦN (tách theo dấu _) là "mat_khau", "pin" hay "token" (mat_khau_ql, pin_lai,
// refresh_token) bị bỏ cả lúc ghi lẫn lúc đọc, kể cả khi trang lỡ liệt kê. So theo phần chứ không theo chuỗi con: ô
// thường như phi_shipping vẫn được giữ. Ô dài
// hơn 254 ký tự (email dài nhất Supabase nhận) thì bỏ ô đó — cookie không phình quá cỡ trình duyệt nhận.
// Kiểm: crm/test/test-kho-may-lich-su.mjs.
// -----------------------------------------------------------------------------
const COOKIE_NHAP_LAI = 'bt_kho_nhap_lai';
const O_TOI_DA = 254;
const laOBiMat = (o: string) => /(?:^|_)(?:mat_khau|pin|token)(?:_|$)/i.test(o);

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
