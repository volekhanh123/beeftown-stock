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
 */
import type { APIRoute } from 'astro';
import { dangXuat } from '../../lib/phien.ts';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  await dangXuat(cookies);
  return redirect('/noi-bo/dang-nhap', 302);
};

export const GET: APIRoute = ({ redirect }) => redirect('/noi-bo', 302);
