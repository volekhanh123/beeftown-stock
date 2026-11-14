/**
 * ĐĂNG XUẤT
 *
 * Chỉ nhận POST. Đăng xuất bằng GET nghĩa là bất kỳ ai cũng đá được người
 * khác ra khỏi phiên chỉ bằng một thẻ <img src="/noi-bo/dang-xuat">. Phiền,
 * không nguy hiểm — nhưng tránh được bằng một dòng thì tránh.
 *
 * Đăng xuất là THU HỒI PHIÊN Ở SUPABASE rồi mới xóa cookie (dangXuat trong
 * lib/phien.ts): chỉ xóa cookie thì bản cookie ai đó đã chép từ trước vẫn vào
 * được /noi-bo (phiên ở Supabase không tự hết hạn). Supabase bận hay mất mạng
 * thì cookie vẫn bị xóa. Lượt thu hồi chậm hơn hạn đợi thì chạy tiếp sau khi
 * trang đã trả lời — vì vậy nó được giao cho waitUntil của Worker
 * (locals.cfContext); không giao thì Worker cắt nó ngay lúc trả lời.
 *
 * NÚT QUAY LẠI SAU KHI ĐĂNG XUẤT — hai lớp, thử bằng Chromium 156 và Chrome 153
 * bản đầy đủ có bfcache (14/11/2026, vòng hai của rà soát):
 *
 *   · Trả lời mang Clear-Site-Data: "cache" — trình duyệt bỏ bản lưu đệm HTTP
 *     và các trang ĐÃ nằm trong bộ nhớ quay lại (bfcache) của tên miền này.
 *     Không có nó thì bấm Quay lại là thấy lại trang cũ mà không hỏi máy chủ.
 *   · Lệnh đó KHÔNG gỡ được chính trang vừa bấm Đăng xuất (trang đó vào bộ nhớ
 *     quay lại sau khi lệnh đã được xử lý, và nằm đó khoảng 10 phút). Phần này
 *     do public/kho/js/sau-dang-xuat.js lo: trang hiện lại từ bộ nhớ sau một
 *     lần bấm Đăng xuất thì tự tải lại — máy chủ đưa về trang đăng nhập.
 *
 * Bản đầu của đợt vá ghi "có header thì Quay lại về trang đăng nhập": phép thử
 * đó chạy bằng bản Chromium rút gọn của Playwright, bản không có bfcache.
 * Trình duyệt tắt JavaScript và không hiểu header này thì như trước đợt vá. Vì
 * sao không đặt no-store cho cả khu nội bộ: lib/header-noi-bo.ts.
 */
import type { APIRoute } from 'astro';
import { dangXuat } from '../../lib/phien.ts';

export const POST: APIRoute = async ({ cookies, redirect, locals }) => {
  const nguCanh = (locals as { cfContext?: { waitUntil?(viec: Promise<unknown>): void } } | undefined)?.cfContext;
  await dangXuat(cookies, { chayNen: viec => nguCanh?.waitUntil?.(viec) });
  const traLoi = redirect('/noi-bo/dang-nhap', 302);
  traLoi.headers.set('Clear-Site-Data', '"cache"');
  return traLoi;
};

export const GET: APIRoute = ({ redirect }) => redirect('/noi-bo', 302);
