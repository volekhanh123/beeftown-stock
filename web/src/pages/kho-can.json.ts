/**
 * CẤU HÌNH CHO CHƯƠNG TRÌNH "BEEFTOWN CÂN" (can-app/, file .exe ở máy quán)
 *
 * Chương trình chỉ cần biết địa chỉ trang web (mặc định beeftown.vn); từ đây
 * nó lấy địa chỉ Supabase và khóa anon để tự đăng nhập kho. Hai giá trị này
 * vốn CÔNG KHAI theo thiết kế (nằm sẵn trong mã trang web) — an toàn nằm ở
 * RLS và bảng nhan_su, không ở việc giấu chúng. Không trả gì khác.
 */
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const env = import.meta.env as Record<string, unknown>;
  const url = typeof env.PUBLIC_SUPABASE_URL === 'string' ? env.PUBLIC_SUPABASE_URL : '';
  const khoa = typeof env.PUBLIC_SUPABASE_ANON_KEY === 'string' ? env.PUBLIC_SUPABASE_ANON_KEY : '';
  if (!url || !khoa) {
    return new Response(JSON.stringify({ loi: 'Trang web chưa nối database.' }), {
      status: 404, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  return new Response(JSON.stringify({ supabaseUrl: url, anonKey: khoa }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
