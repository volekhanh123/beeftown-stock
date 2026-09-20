import type { APIRoute } from 'astro';

const TRANG = ['/', '/tuyen-dung', '/quyen-rieng-tu',
               '/en', '/en/jobs', '/en/privacy'];

export const GET: APIRoute = ({ site }) => {
  const goc = site?.origin ?? '';
  const url = TRANG.map((p) => `  <url><loc>${goc}${p}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${url}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
