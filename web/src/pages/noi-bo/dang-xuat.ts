/**
 * ĐĂNG XUẤT
 *
 * Chỉ nhận POST. Đăng xuất bằng GET nghĩa là bất kỳ ai cũng đá được người
 * khác ra khỏi phiên chỉ bằng một thẻ <img src="/noi-bo/dang-xuat">. Phiền,
 * không nguy hiểm — nhưng tránh được bằng một dòng thì tránh.
 */
import type { APIRoute } from 'astro';
import { xoaToken } from '../../lib/phien';

export const POST: APIRoute = ({ cookies, redirect }) => {
  xoaToken(cookies);
  return redirect('/noi-bo/dang-nhap', 302);
};

export const GET: APIRoute = ({ redirect }) => redirect('/noi-bo', 302);
