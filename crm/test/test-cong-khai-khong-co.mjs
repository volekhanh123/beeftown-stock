/**
 * BEEFTOWN — TRANG KHÔNG CÓ (404) CỦA TRANG CÔNG KHAI
 * ===================================================
 *
 *     node test/test-cong-khai-khong-co.mjs
 *
 * Kiểm site thật 07/10/2026 (Worker d317445e): GET /khong-co-trang-nay, /en/khong-co, /ko/khong-co
 * trả đúng mã 404, nhưng HTML là mẫu mặc định của Astro (node_modules/astro/dist/template/4xx.js) —
 * lang="en", nền đen, logo Astro, không một link nào, không chữ Beeftown. Vì không có
 * web/src/pages/404.astro. Bất biến:
 *
 *   1. Thứ tiếng của trang 404 chọn theo tiền tố đường dẫn: /en, /en/… → en; /ko, /ko/… → ko (không
 *      phân biệt hoa thường); mọi đường dẫn khác → vi (/english, /kor không phải tiền tố).
 *   2. Câu của trang 404 nằm trong web/src/lib/chu.ts, đủ vi / en / ko (chữ cấm, chữ Việt lẫn trong
 *      en / ko: test-cong-khai-cau-chu.mjs nhóm 6 quét mọi khóa của chu.ts).
 *   3. web/src/pages/404.astro: dùng layout công khai Trang, chọn tiếng theo đường dẫn, giữ mã 404,
 *      KHÔNG gọi database (bot quét hàng loạt đường dẫn lạ — mỗi lượt một lần gọi Supabase), báo
 *      layout bỏ canonical / hreflang (noindex), và có link về trang chủ của cả ba thứ tiếng.
 *   4. /404 không nằm trong CAP_DUONG_DAN — không vào sitemap, không thành đích của nút đổi ngôn ngữ.
 *
 * Trang dựng thật (mã 404, lang, link, tràn ngang 360px) kiểm ở web/kiem-tra/trinh-duyet.mjs nhóm 6,
 * trên bản build chạy trong wrangler dev — cùng đường đi với Cloudflare.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const { chu, ngonNguTuDuongDan, CAP_DUONG_DAN, NGON_NGU } = await nap('chu.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRANG KHÔNG CÓ (404)');

const TRANG_404 = join(SRC, 'pages', '404.astro');
const nguon404 = existsSync(TRANG_404) ? readFileSync(TRANG_404, 'utf8') : '';
// Chỉ phần mã (frontmatter + template), bỏ chú thích — chú thích nhắc tên hàm thì không được tính là gọi hàm.
const ma404 = nguon404.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// ===========================================================================
await nhom('1 · THỨ TIẾNG THEO TIỀN TỐ ĐƯỜNG DẪN (ngonNguTuDuongDan, lib/chu.ts)', async () => {
  ok('chu.ts có hàm ngonNguTuDuongDan', typeof ngonNguTuDuongDan === 'function', typeof ngonNguTuDuongDan);
  if (typeof ngonNguTuDuongDan !== 'function') return;
  const CA = [
    ['/en', 'en'], ['/en/', 'en'], ['/en/khong-co', 'en'], ['/en/menu/khong-co', 'en'],
    ['/ko', 'ko'], ['/ko/', 'ko'], ['/ko/khong-co', 'ko'],
    ['/EN/menu', 'en'], ['/Ko', 'ko'], ['/KO/khong-co', 'ko'],
    ['/', 'vi'], ['', 'vi'], ['/khong-co-trang-nay', 'vi'], ['/english', 'vi'], ['/kor', 'vi'], ['/korea/x', 'vi'],
    ['/noi-bo/khong-co', 'vi'], ['/noi-bo/en', 'vi'], ['/vi/khong-co', 'vi'], ['/thuc-don/en', 'vi'],
  ];
  for (const [duong, nn] of CA) {
    const ra = ngonNguTuDuongDan(duong);
    ok(`"${duong}" → ${nn}`, ra === nn, `ra ${ra}`);
  }
});

// ===========================================================================
await nhom('2 · CÂU TRANG 404 Ở ĐỦ BA THỨ TIẾNG (lib/chu.ts)', async () => {
  const KHOA = ['khongCoTieuDeTrang', 'khongCoTieuDe', 'khongCoGiaiThich', 'khongCoVeTrangChu', 'khongCoTrangChuKhac'];
  for (const nn of NGON_NGU) {
    const t = chu(nn);
    const thieu = KHOA.filter(k => typeof t[k] !== 'string' || !t[k].trim());
    ok(`chu.ts [${nn}]: có đủ ${KHOA.length} câu của trang 404`, thieu.length === 0, `thiếu ${thieu.join(', ')}`);
    ok(`chu.ts [${nn}]: tiêu đề tab của trang 404 có chữ Beeftown`, /Beeftown/.test(t.khongCoTieuDeTrang ?? ''), t.khongCoTieuDeTrang);
  }
  const vi = chu('vi'), en = chu('en'), ko = chu('ko');
  ok('Câu 404 tiếng Anh, tiếng Hàn là bản dịch, không chép nguyên câu tiếng Việt',
     KHOA.every(k => vi[k] && en[k] !== vi[k] && ko[k] !== vi[k] && ko[k] !== en[k]),
     KHOA.filter(k => en[k] === vi[k] || ko[k] === vi[k]).join(', '));
});

// ===========================================================================
await nhom('3 · web/src/pages/404.astro', async () => {
  ok('Có file web/src/pages/404.astro (không có thì Astro trả mẫu 4xx mặc định: lang="en", không link)', !!nguon404);
  if (!nguon404) return;
  ok('Dùng layout công khai Trang', /import\s+Trang\s+from\s+['"]\.\.\/layouts\/Trang\.astro['"]/.test(ma404) && /<Trang\b/.test(ma404));
  ok('Chọn thứ tiếng theo đường dẫn khách mở: ngonNguTuDuongDan(Astro.url.pathname)',
     /ngonNguTuDuongDan\(\s*Astro\.url\.pathname\s*\)/.test(ma404));
  ok('Giữ mã HTTP 404: Astro.response.status = 404', /Astro\.response\.status\s*=\s*404\b/.test(ma404));
  const goiDoc = [...ma404.matchAll(/docNoiDung\(([^)]*)\)/g)].map(m => m[1]);
  ok('Không gọi database: mọi lần gọi docNoiDung đều truyền client null (bộ nội dung rỗng)',
     goiDoc.length > 0 && goiDoc.every(a => /,\s*null\s*$/.test(a)), goiDoc.join(' | ') || 'không gọi docNoiDung');
  ok('Không tự dựng client Supabase (taoClient)', !/taoClient/.test(ma404));
  ok('Báo layout bỏ canonical / hreflang: <Trang … khongLapChiMuc>', /<Trang\b[^>]*\bkhongLapChiMuc\b/.test(ma404));
  ok('Link trang chủ dựng bằng duongDanTuongUng(\'/\', …) cho mọi thứ tiếng (NGON_NGU), không chép tay đường dẫn',
     /duongDanTuongUng\(\s*'\/'\s*,/.test(ma404) && /\bNGON_NGU\b/.test(ma404) && !/href=["']\/(en|ko)?["']/.test(ma404));
  ok('Câu chữ lấy từ chu.ts, không viết thẳng trong file (không chuỗi tiếng Việt, tiếng Hàn trong template)',
     !/>[^<{]*[ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹđ가-힣][^<{]*</i.test(ma404));
});

// ===========================================================================
await nhom('4 · LAYOUT Trang: TRANG KHÔNG LẬP CHỈ MỤC', async () => {
  const layout = readFileSync(join(SRC, 'layouts', 'Trang.astro'), 'utf8');
  ok('Trang.astro nhận prop khongLapChiMuc?: boolean', /khongLapChiMuc\?\s*:\s*boolean/.test(layout));
  ok('Trang.astro in <meta name="robots" content="noindex"> khi khongLapChiMuc', /<meta name="robots" content="noindex"\s*\/>/.test(layout));
  // canonical và hreflang chỉ in ở nhánh trang bình thường — trang 404 không tự nhận mình là bản chính
  // của một đường dẫn không có, cũng không nói /en là bản tiếng Anh của nó.
  const iRobots = layout.indexOf('name="robots"');
  const iCanonical = layout.indexOf('rel="canonical"');
  const iHreflang = layout.indexOf('hreflang="x-default"');
  const doanNhanh = iRobots > -1 ? layout.slice(Math.max(0, iRobots - 200), Math.max(iCanonical, iHreflang) + 200) : '';
  ok('canonical và hreflang nằm trong nhánh "không phải khongLapChiMuc"',
     iRobots > -1 && iCanonical > -1 && iHreflang > -1 && /khongLapChiMuc\s*\?/.test(doanNhanh), doanNhanh.slice(0, 160));
  // Trang 404 dựng với bộ nội dung rỗng: JSON-LD của nó sẽ khai sai về nhà hàng thật (acceptsReservations,
  // điện thoại, mạng xã hội) — không in.
  ok('JSON-LD chỉ in khi KHÔNG khongLapChiMuc', /\{!khongLapChiMuc && <script type="application\/ld\+json"/.test(layout)
     && (layout.match(/application\/ld\+json/g) ?? []).length === 1);
});

// ===========================================================================
await nhom('5 · /404 KHÔNG VÀO BẢNG ĐƯỜNG DẪN (sitemap, nút đổi ngôn ngữ)', async () => {
  const tatCa = CAP_DUONG_DAN.flat();
  ok('CAP_DUONG_DAN không có /404, /en/404, /ko/404', !tatCa.some(d => /\/404$/.test(d)), tatCa.join(' '));
  const sitemap = readFileSync(join(SRC, 'pages', 'sitemap.xml.ts'), 'utf8');
  ok('sitemap.xml.ts dựng từ CAP_DUONG_DAN, không liệt kê thêm đường dẫn tay', /CAP_DUONG_DAN/.test(sitemap) && !/404/.test(sitemap));
});

process.exit(ketThuc('TRANG KHÔNG CÓ (404)'));
