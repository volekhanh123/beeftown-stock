/**
 * BEEFTOWN — Kiểm thử: mọi trả lời của /noi-bo không được lưu đệm và không cho nhúng vào khung
 * ====================================================================================
 *
 *     node test/test-noi-bo-header-bao-ve.mjs
 *
 * Rà soát bảo mật 14/11/2026. Trang nội bộ (danh sách khách, công nợ, hồ sơ ứng viên…) trả về không kèm
 * Cache-Control, nên trình duyệt được phép giữ bản sao: trên máy dùng chung, người đến sau bấm nút Quay lại là
 * thấy trang của người trước dù người đó đã đăng xuất. Và không header nào cấm trang khác nhúng /noi-bo vào một
 * khung ẩn để lừa bấm (clickjacking). Trước bản sửa chỉ vài trang tự đặt no-store (màn Nhân viên, chế độ máy).
 *
 * Bản sửa: middleware.ts — chỗ DUY NHẤT canh /noi-bo — gắn cho mọi trả lời dưới /noi-bo:
 *     Cache-Control: no-store
 *     Content-Security-Policy: frame-ancestors 'none'
 *     X-Frame-Options: DENY            (trình duyệt cũ chưa hiểu frame-ancestors)
 * bằng datHeaderNoiBo (web/src/lib/header-noi-bo.ts — hàm thuần, kiểm ở đây). Trang công khai không bị đụng.
 * Kiểm trên bản build thật, qua trình duyệt: web/kiem-tra/trinh-duyet.mjs nhóm 4.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { datHeaderNoiBo } from '../../web/src/lib/header-noi-bo.ts';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — HEADER BẢO VỆ CỦA KHU NỘI BỘ');

const dau = tl => Object.fromEntries([...tl.headers.entries()]);
const duBaoVe = tl => /(^|,\s*)no-store\b/.test(tl.headers.get('cache-control') ?? '')
  && /(^|;\s*)frame-ancestors 'none'/.test(tl.headers.get('content-security-policy') ?? '')
  && tl.headers.get('x-frame-options') === 'DENY';

// ===========================================================================
await nhom('1 · Trả lời nào của /noi-bo cũng ra khỏi middleware kèm đủ ba header', async () => {
  const trang = datHeaderNoiBo(new Response('<html>danh sách khách</html>', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }));
  ok('RÀ SOÁT 14/11: trang HTML không đặt gì → no-store, frame-ancestors \'none\', X-Frame-Options DENY', duBaoVe(trang), JSON.stringify(dau(trang)));
  ok('…thân, mã trạng thái và content-type giữ nguyên',
     trang.status === 200 && trang.headers.get('content-type') === 'text/html; charset=utf-8' && await trang.text() === '<html>danh sách khách</html>');

  const chuyen = datHeaderNoiBo(new Response(null, { status: 302, headers: { location: '/noi-bo/dang-nhap' } }));
  ok('RÀ SOÁT 14/11: lệnh chuyển hướng về trang đăng nhập cũng không lưu đệm', duBaoVe(chuyen) && chuyen.status === 302 && chuyen.headers.get('location') === '/noi-bo/dang-nhap', JSON.stringify(dau(chuyen)));

  const loi = datHeaderNoiBo(new Response('đang bận', { status: 503, headers: { 'cache-control': 'no-store', 'retry-after': '7' } }));
  ok('Trang "đang bận" (đã tự đặt no-store): giữ nguyên, thêm hai header chống nhúng', duBaoVe(loi) && loi.headers.get('cache-control') === 'no-store' && loi.headers.get('retry-after') === '7', JSON.stringify(dau(loi)));
});

// ===========================================================================
await nhom('2 · Không nới thứ trang đã đặt chặt, không giữ thứ trang đặt lỏng', async () => {
  const tep = datHeaderNoiBo(new Response('a,b', { headers: { 'cache-control': 'private, no-store', 'content-disposition': 'attachment; filename="bao-cao.csv"' } }));
  ok('File tải về đặt "private, no-store": giữ nguyên văn', tep.headers.get('cache-control') === 'private, no-store' && duBaoVe(tep)
     && tep.headers.get('content-disposition') === 'attachment; filename="bao-cao.csv"', tep.headers.get('cache-control'));

  for (const cu of ['public, max-age=3600', 'private, max-age=60', 'max-age=0', 'no-cache']) {
    const tl = datHeaderNoiBo(new Response('x', { headers: { 'cache-control': cu } }));
    ok(`RÀ SOÁT 14/11: trang nội bộ lỡ đặt "${cu}" → bị ép về no-store`, tl.headers.get('cache-control') === 'no-store' && duBaoVe(tl), tl.headers.get('cache-control'));
  }

  const coCsp = datHeaderNoiBo(new Response('x', { headers: { 'content-security-policy': "default-src 'self'" } }));
  ok('Trang đã có Content-Security-Policy riêng: giữ luật cũ, nối thêm frame-ancestors \'none\'',
     coCsp.headers.get('content-security-policy') === "default-src 'self'; frame-ancestors 'none'", coCsp.headers.get('content-security-policy'));
  const coKhung = datHeaderNoiBo(new Response('x', { headers: { 'content-security-policy': "frame-ancestors 'self'; default-src 'self'" } }));
  ok('RÀ SOÁT 14/11: trang lỡ đặt frame-ancestors lỏng hơn (\'self\') → bị ép về \'none\'',
     /(^|;\s*)frame-ancestors 'none'/.test(coKhung.headers.get('content-security-policy') ?? '')
     && !/frame-ancestors 'self'/.test(coKhung.headers.get('content-security-policy') ?? '')
     && /default-src 'self'/.test(coKhung.headers.get('content-security-policy') ?? ''), coKhung.headers.get('content-security-policy'));
});

// ===========================================================================
await nhom('3 · Trả lời có header bị khóa (không sửa được) → dựng lại, không ném lỗi', async () => {
  const khoa = Response.redirect('https://beeftown.vn/noi-bo/dang-nhap', 302);   // header của Response.redirect là bất biến
  let tl = null, loi = null;
  try { tl = datHeaderNoiBo(khoa); } catch (e) { loi = String(e?.message ?? e); }
  ok('Không ném lỗi, vẫn đủ ba header, vẫn là lệnh chuyển hướng cũ',
     loi === null && !!tl && duBaoVe(tl) && tl.status === 302 && tl.headers.get('location') === 'https://beeftown.vn/noi-bo/dang-nhap', loi ?? JSON.stringify(tl ? dau(tl) : null));
});

// ===========================================================================
await nhom('4 · middleware.ts: mọi lối ra của /noi-bo đều qua datHeaderNoiBo; trang công khai đi thẳng', async () => {
  const mw = readFileSync(join(GOC, 'web/src/middleware.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const cua = mw.slice(mw.indexOf('export const onRequest'));
  const than = cua.slice(0, cua.indexOf('\n});') + 4);
  ok('RÀ SOÁT 14/11: onRequest — ngoài /noi-bo thì return next(); còn lại trả datHeaderNoiBo(await canhNoiBo(…))',
     /if\s*\(\s*!\s*duong\.startsWith\('\/noi-bo'\)\s*\)\s*return\s+next\(\);\s*return\s+datHeaderNoiBo\(\s*await\s+canhNoiBo\(context,\s*next,\s*duong\)\s*\);\s*\}\);/.test(than), than.slice(0, 400));
  ok('…onRequest không còn lối ra nào khác (đúng hai câu return)', (than.match(/\breturn\b/g) ?? []).length === 2, `${(than.match(/\breturn\b/g) ?? []).length} câu return`);
  ok('…canhNoiBo là hàm riêng trong cùng file, không export (không ai gọi tắt qua nó)',
     /\nasync function canhNoiBo\(/.test(mw) && !/export\s+(async\s+)?function\s+canhNoiBo/.test(mw));
  ok('…datHeaderNoiBo lấy từ lib/header-noi-bo', /import \{ datHeaderNoiBo \} from '\.\/lib\/header-noi-bo'/.test(mw));
});

process.exit(ketThuc('header bảo vệ của khu nội bộ'));
