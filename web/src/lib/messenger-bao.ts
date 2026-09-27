/**
 * MESSENGER — CÂU BÁO SAU KHI CHUYỂN HƯỚNG
 *
 * Trang /noi-bo/messenger ghi rồi CHUYỂN HƯỚNG sang GET (303), để F5 không gửi
 * lại lệnh "lưu cài đặt" hay "cài menu". Câu báo đi theo qua một cookie dùng
 * một lần, chỉ sống dưới /noi-bo/messenger — cùng cách của lib/zalo-bao.ts.
 *
 * Giữ cả bản tiếng Anh (cauEn) nếu có. Câu của database không có cauEn — trang
 * tra dichCau.
 */

import type { AstroCookies } from 'astro';

const COOKIE_BAO = 'bt_mess_bao';
const DUONG = '/noi-bo/messenger';

export interface BaoMess { ok: boolean; cau: string; cauEn?: string }

export function ghiBaoMess(cookies: AstroCookies, bao: BaoMess) {
  cookies.set(COOKIE_BAO, JSON.stringify(bao), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: DUONG,
    maxAge: 120,
  });
}

export function docBaoMess(cookies: AstroCookies): BaoMess | null {
  const raw = cookies.get(COOKIE_BAO)?.value;
  if (!raw) return null;
  cookies.delete(COOKIE_BAO, { path: DUONG });
  try {
    const v = JSON.parse(raw);
    if (typeof v?.ok !== 'boolean' || typeof v?.cau !== 'string') return null;
    return typeof v.cauEn === 'string' ? { ok: v.ok, cau: v.cau, cauEn: v.cauEn } : { ok: v.ok, cau: v.cau };
  } catch { return null; }
}
