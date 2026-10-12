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

export function ghiBao(cookies: AstroCookies, bao: KetQua) {
  cookies.set(COOKIE_BAO, JSON.stringify(bao), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/noi-bo/kho',
    maxAge: 120,
  });
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
