/**
 * CÒN HÀNG CHO MINI APP ZALO (mini-app/)
 *
 * { "phanThit": { "ribeye-with-cap": "con", "outside-skirt": "sap_het", "la-galbi": "het" } }
 * Phần thịt không có trong danh sách = không biết, Mini App hiện như cũ. Xem lib/mini-app.ts.
 *
 * Mini App chạy trên tên miền của Zalo nên cho mọi nơi đọc (Access-Control-Allow-Origin: *): dữ liệu công
 * khai, không cookie, không dữ liệu khách. Lưu đệm 60 giây: khay vừa bán thì chậm nhất 1 phút sau app mới
 * thấy, đổi lại mỗi lần khách mở app không phải hỏi database. Header đó chỉ giữ ở trình duyệt; phía Worker giữ
 * 30 giây bằng docConHangMiniAppCoDem.
 */
import type { APIRoute } from 'astro';
import { docConHangMiniAppCoDem } from '../../lib/mini-app';

export const GET: APIRoute = async () => {
  const phanThit = await docConHangMiniAppCoDem();
  return new Response(JSON.stringify({ phanThit }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
  });
};
