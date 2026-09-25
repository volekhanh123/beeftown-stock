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
import { CAP_DUONG_DAN } from '../lib/chu';

export const GET: APIRoute = ({ site }) => {
  const goc = site?.origin ?? '';

  // Mỗi trang khai luôn bản ngôn ngữ kia. Google dùng hreflang để hiểu hai
  // đường dẫn là một trang chứ không phải nội dung trùng lặp.
  const url = CAP_DUONG_DAN.flatMap(([vi, en]) =>
    [[vi, 'vi', en, 'en'], [en, 'en', vi, 'vi']].map(([d, ng, kia, ngKia]) =>
      `  <url>\n` +
      `    <loc>${goc}${d}</loc>\n` +
      `    <xhtml:link rel="alternate" hreflang="${ng}" href="${goc}${d}"/>\n` +
      `    <xhtml:link rel="alternate" hreflang="${ngKia}" href="${goc}${kia}"/>\n` +
      `  </url>`,
    ),
  ).join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${url}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
