/**
 * ĐĂNG XUẤT
 *
 * Chỉ nhận POST. Đăng xuất bằng GET nghĩa là bất kỳ ai cũng đá được người
 * khác ra khỏi phiên chỉ bằng một thẻ <img src="/noi-bo/dang-xuat">. Phiền,
 * không nguy hiểm — nhưng tránh được bằng một dòng thì tránh.
 *
 * Đăng xuất là THU HỒI PHIÊN Ở SUPABASE rồi mới xóa cookie (dangXuat trong
 * lib/phien.ts): chỉ xóa cookie thì bản cookie ai đó đã chép từ trước vẫn vào
 * được /noi-bo tới 7 ngày. Supabase bận hay mất mạng thì cookie vẫn bị xóa.
 *
 * Trả lời mang Clear-Site-Data: "cache" — bảo trình duyệt bỏ các bản trang nó
 * đang giữ của tên miền này. Không có nó thì người đến sau bấm nút Quay lại là
 * thấy lại trang cuối cùng của người vừa đăng xuất (danh sách khách, công nợ…)
 * mà không hỏi máy chủ. Thử trong Chromium 14/11/2026: có header thì Quay lại
 * về trang đăng nhập. Trình duyệt không hiểu header này thì như trước. Vì sao
 * không đặt no-store cho cả khu nội bộ: lib/header-noi-bo.ts.
 */
import type { APIRoute } from 'astro';
import { dangXuat } from '../../lib/phien.ts';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  await dangXuat(cookies);
  const traLoi = redirect('/noi-bo/dang-nhap', 302);
  traLoi.headers.set('Clear-Site-Data', '"cache"');
  return traLoi;
};

export const GET: APIRoute = ({ redirect }) => redirect('/noi-bo', 302);
