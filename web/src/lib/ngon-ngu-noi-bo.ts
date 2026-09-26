/**
 * NGÔN NGỮ CỦA PHẦN MỀM NỘI BỘ — tiếng Việt (mặc định) và tiếng Anh
 * =================================================================
 *
 * Trang công khai có ba thứ tiếng, chọn bằng ĐƯỜNG DẪN (/en/…, /ko/…) vì
 * Google phải thấy từng bản. Trang nội bộ thì khác: không ai tìm nó trên
 * Google, và một đường dẫn /noi-bo/kho/nhap/123 phải mở đúng phiếu đó dù người
 * mở đọc tiếng gì. Nên ở đây ngôn ngữ là một LỰA CHỌN CỦA TRÌNH DUYỆT: cookie
 * nb_ngon_ngu, đặt bằng nút "English" / "Tiếng Việt" ở đầu mọi trang nội bộ.
 * Chưa chọn gì thì là tiếng Việt, như trước.
 *
 * Nút đó chỉ là một link thêm ?nn=en (hoặc ?nn=vi) vào đúng trang đang mở.
 * Middleware ghi cookie rồi chuyển về chính đường dẫn đó, bỏ ?nn= — không có
 * tham số "quay về đâu" nào để thành lỗ open-redirect.
 *
 * CÂU CHỮ: mỗi trang/component giữ câu của riêng mình dưới dạng { vi, en },
 * đọc qua dichNB() — cùng khuôn với dich() của trang công khai (lib/chu.ts).
 * Thiếu một thứ tiếng thì không biên dịch được. Bảng nhãn đã có sẵn ba thứ
 * tiếng (BO_PHAN, LOAI_HOP_DONG…) dùng thẳng được, vì có đủ vi và en.
 */

import type { AstroCookies } from 'astro';

export type NgonNguNB = 'vi' | 'en';

export const COOKIE_NGON_NGU_NB = 'nb_ngon_ngu';

/** Một câu ở hai thứ tiếng của phần mềm nội bộ. Giá trị có thể là hàm, cho câu có số. */
export type HaiThuTieng<T = string> = Readonly<Record<NgonNguNB, T>>;

export function laNgonNguNB(s: unknown): s is NgonNguNB {
  return s === 'vi' || s === 'en';
}

export function docNgonNguNB(cookies: AstroCookies): NgonNguNB {
  const v = cookies.get(COOKIE_NGON_NGU_NB)?.value;
  return laNgonNguNB(v) ? v : 'vi';
}

export function ghiNgonNguNB(cookies: AstroCookies, nn: NgonNguNB) {
  cookies.set(COOKIE_NGON_NGU_NB, nn, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/noi-bo',
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** Ngôn ngữ của lượt xem hiện tại. Middleware đặt locals.nn cho mọi đường dẫn /noi-bo. */
export function nnCua(ctx: { locals: App.Locals }): NgonNguNB {
  return ctx.locals.nn ?? 'vi';
}

/** { khoa: { vi, en } } → { khoa: bản của nn }. Nhận cả bảng ba thứ tiếng { vi, en, ko }. */
export function dichNB<B extends Record<string, HaiThuTieng<unknown>>>(
  nn: NgonNguNB, bang: B,
): { [K in keyof B]: B[K][NgonNguNB] } {
  const ra = {} as { [K in keyof B]: B[K][NgonNguNB] };
  for (const khoa in bang) ra[khoa] = bang[khoa][nn];
  return ra;
}

/** Nhãn của một mã enum; mã lạ thì trả nguyên mã, như nhanEnum(). */
export function nhanNB(bang: Record<string, HaiThuTieng>, ma: string | null | undefined, nn: NgonNguNB): string {
  if (!ma) return '';
  return bang[ma]?.[nn] ?? ma;
}

/** Link của nút đổi ngôn ngữ: chính trang đang mở, thêm ?nn=<thứ tiếng kia>. */
export function linkDoiNgonNgu(url: URL, nn: NgonNguNB): { link: string; nnKia: NgonNguNB; chu: string } {
  const nnKia: NgonNguNB = nn === 'en' ? 'vi' : 'en';
  const u = new URL(url);
  u.searchParams.set('nn', nnKia);
  return { link: u.pathname + u.search, nnKia, chu: nnKia === 'en' ? 'English' : 'Tiếng Việt' };
}
