/**
 * KHO — CÂU BÁO SAU KHI CHUYỂN HƯỚNG
 *
 * Trang kho ghi dữ liệu rồi CHUYỂN HƯỚNG sang GET (303), để bấm F5 không gửi
 * lại lệnh "duyệt phiếu" hay "xuất bếp" lần nữa. Câu "Đã duyệt phiếu..." đi
 * theo qua một cookie dùng một lần.
 *
 * Cookie riêng của kho (bt_kho_bao, chỉ sống dưới /noi-bo/kho) — không đụng
 * vào cookie kết quả của form công khai trong lib/phien.ts.
 */

import type { AstroCookies } from 'astro';
import type { KetQua } from './chung.ts';

const COOKIE_BAO = 'bt_kho_bao';

export function ghiBao(cookies: AstroCookies, bao: KetQua) {
  cookies.set(COOKIE_BAO, JSON.stringify(bao), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/noi-bo/kho',
    maxAge: 120,
  });
}

export function docBao(cookies: AstroCookies): KetQua | null {
  const raw = cookies.get(COOKIE_BAO)?.value;
  if (!raw) return null;
  cookies.delete(COOKIE_BAO, { path: '/noi-bo/kho' });
  try {
    const v = JSON.parse(raw);
    return typeof v?.ok === 'boolean' && typeof v?.cau === 'string' ? v : null;
  } catch { return null; }
}
