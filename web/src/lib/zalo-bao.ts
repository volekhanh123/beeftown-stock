/**
 * ZALO — CÂU BÁO SAU KHI CHUYỂN HƯỚNG
 *
 * Trang Zalo ghi rồi CHUYỂN HƯỚNG sang GET (303), để F5 không gửi lại lệnh
 * "tạo chiến dịch" hay "dừng chiến dịch". Câu báo đi theo qua một cookie dùng
 * một lần, chỉ sống dưới /noi-bo/zalo — cùng cách của lib/kho/bao.ts, cookie riêng.
 *
 * Giữ cả bản tiếng Anh (cauEn) nếu có: người bấm có thể đổi tiếng giữa lúc
 * ghi và lúc đọc. Câu của database không có cauEn — trang tra dichCau.
 */

import type { AstroCookies } from 'astro';

const COOKIE_BAO = 'bt_zalo_bao';
const DUONG = '/noi-bo/zalo';

export interface BaoZalo { ok: boolean; cau: string; cauEn?: string }

export function ghiBaoZalo(cookies: AstroCookies, bao: BaoZalo) {
  cookies.set(COOKIE_BAO, JSON.stringify(bao), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: DUONG,
    maxAge: 120,
  });
}

export function docBaoZalo(cookies: AstroCookies): BaoZalo | null {
  const raw = cookies.get(COOKIE_BAO)?.value;
  if (!raw) return null;
  cookies.delete(COOKIE_BAO, { path: DUONG });
  try {
    const v = JSON.parse(raw);
    if (typeof v?.ok !== 'boolean' || typeof v?.cau !== 'string') return null;
    return typeof v.cauEn === 'string' ? { ok: v.ok, cau: v.cau, cauEn: v.cauEn } : { ok: v.ok, cau: v.cau };
  } catch { return null; }
}
