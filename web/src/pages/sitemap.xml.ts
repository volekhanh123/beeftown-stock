/**
 * SITEMAP
 *
 * Đọc từ CAP_DUONG_DAN trong lib/chu.ts, không chép tay danh sách lần hai.
 * Hai danh sách đường dẫn là hai danh sách sẽ lệch nhau, và bản lệch sẽ là
 * bản này — vì không ai mở sitemap.xml ra xem.
 *
 * /noi-bo KHÔNG có ở đây và sẽ không bao giờ có.
 */
import type { APIRoute } from 'astro';
import { CAP_DUONG_DAN, NGON_NGU, duongDanTuongUng } from '../lib/chu';

export const GET: APIRoute = ({ site }) => {
  const goc = site?.origin ?? '';

  // Mỗi trang khai đủ mọi bản ngôn ngữ, kể cả chính nó, cộng x-default về bản
  // tiếng Việt — đúng bộ thẻ hreflang trong layouts/Trang.astro, để hai nơi
  // không nói hai điều khác nhau. Google dùng hreflang để hiểu ba đường dẫn
  // là một trang chứ không phải nội dung trùng lặp.
  const url = CAP_DUONG_DAN.flatMap(([vi]) => {
    const ban = NGON_NGU.map(ng => ({ ng, d: duongDanTuongUng(vi, ng) }));
    const lienKet = [
      ...ban.map(({ ng, d }) => `    <xhtml:link rel="alternate" hreflang="${ng}" href="${goc}${d}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${goc}${vi}"/>`,
    ].join('\n');
    return ban.map(({ d }) =>
      `  <url>\n` +
      `    <loc>${goc}${d}</loc>\n` +
      `${lienKet}\n` +
      `  </url>`,
    );
  }).join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${url}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
