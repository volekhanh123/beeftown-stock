/**
 * BEEFTOWN — Kiểm thử: header bảo vệ của khu nội bộ — không cho nhúng vào khung, không vào bộ đệm dùng chung
 * ===================================================================================================
 *
 *     node test/test-noi-bo-header-bao-ve.mjs
 *
 * Rà soát bảo mật 14/11/2026. Trang nội bộ (danh sách khách, công nợ, hồ sơ ứng viên…) trả về không kèm header
 * bảo vệ nào: trang khác nhúng được /noi-bo vào một khung ẩn để lừa người đang đăng nhập bấm (clickjacking), và
 * không gì nói với bộ đệm dùng chung rằng trang này là của riêng một người.
 *
 * Bản sửa: middleware.ts — chỗ DUY NHẤT canh /noi-bo — gắn cho mọi trả lời dưới /noi-bo
 * (datHeaderNoiBo, web/src/lib/header-noi-bo.ts — hàm thuần, kiểm ở đây):
 *     Content-Security-Policy: … , frame-ancestors 'none'     (thêm MỘT CHÍNH SÁCH RIÊNG — luôn thắng)
 *     X-Frame-Options: DENY                                    (trình duyệt cũ chưa hiểu frame-ancestors)
 *     Cache-Control: private                                   (khi trang chưa tự đặt; không bao giờ để "public")
 *
 * KHÔNG ép "no-store" cho cả khu, và đó là cố ý (rà soát mã 14/11, đã thử trong Chromium): trang "hệ thống đang
 * bận" bảo người vừa gửi form hỏng "bấm Quay lại rồi gửi lại" — với no-store, bấm Quay lại là xin lại trang từ máy
 * chủ đang bận, và form đang gõ biến mất. Chỗ cần "người sau không thấy trang của người trước" được làm đúng lúc:
 * Đăng xuất gửi Clear-Site-Data: "cache" (test-noi-bo-dang-xuat.mjs); máy dùng chung đã tự đặt no-store từ trước.
 *
 * Trang công khai không bị đụng. Kiểm trên bản build thật, qua trình duyệt: web/kiem-tra/trinh-duyet.mjs nhóm 4.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { datHeaderNoiBo } from '../../web/src/lib/header-noi-bo.ts';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — HEADER BẢO VỆ CỦA KHU NỘI BỘ');

const dau = tl => Object.fromEntries([...tl.headers.entries()]);
/**
 * Trình duyệt có cấm MỌI trang nhúng trả lời này vào khung không. Header CSP có thể mang nhiều chính sách (cách nhau
 * bằng dấu phẩy); trang chỉ được nhúng khi MỌI chính sách cho phép. Trong một chính sách, luật frame-ancestors ĐẦU
 * TIÊN có hiệu lực, các luật trùng tên phía sau bị bỏ qua.
 */
function camNhung(csp) {
  return (csp ?? '').split(',').some(chinhSach => {
    const luat = chinhSach.split(';').map(l => l.trim()).find(l => /^frame-ancestors(\s|$)/i.test(l));
    return luat !== undefined && /^frame-ancestors\s+'none'$/i.test(luat);
  });
}
const duChongNhung = tl => camNhung(tl.headers.get('content-security-policy')) && tl.headers.get('x-frame-options') === 'DENY';
const dem = tl => tl.headers.get('cache-control');

// ===========================================================================
await nhom('1 · Trả lời nào của /noi-bo cũng ra khỏi middleware kèm header chống nhúng', async () => {
  const trang = datHeaderNoiBo(new Response('<html>danh sách khách</html>', { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } }));
  ok('RÀ SOÁT 14/11: trang HTML không đặt gì → cấm nhúng vào khung (CSP frame-ancestors \'none\' + X-Frame-Options DENY)', duChongNhung(trang), JSON.stringify(dau(trang)));
  ok('RÀ SOÁT 14/11: …và Cache-Control: private — không bộ đệm dùng chung nào được giữ', dem(trang) === 'private', dem(trang));
  ok('…thân, mã trạng thái và content-type giữ nguyên',
     trang.status === 200 && trang.headers.get('content-type') === 'text/html; charset=utf-8' && await trang.text() === '<html>danh sách khách</html>');

  const chuyen = datHeaderNoiBo(new Response(null, { status: 302, headers: { location: '/noi-bo/dang-nhap' } }));
  ok('RÀ SOÁT 14/11: lệnh chuyển hướng về trang đăng nhập cũng mang đủ header', duChongNhung(chuyen) && dem(chuyen) === 'private'
     && chuyen.status === 302 && chuyen.headers.get('location') === '/noi-bo/dang-nhap', JSON.stringify(dau(chuyen)));
});

// ===========================================================================
await nhom('2 · Bộ đệm: không ép no-store, không bao giờ để "public"', async () => {
  // Cố ý: xem đầu file. Kiểm tra này đỏ nghĩa là ai đó vừa ép no-store cho cả khu — đọc lại lý do trước khi sửa.
  const thuong = datHeaderNoiBo(new Response('<form>…</form>', { headers: { 'content-type': 'text/html' } }));
  ok('Trang thường KHÔNG bị ép no-store (bấm Quay lại sau trang "đang bận" còn nguyên form đang gõ)', !/no-store/i.test(dem(thuong) ?? ''), dem(thuong));

  for (const cu of ['no-store', 'private, no-store', 'private, max-age=60']) {
    const tl = datHeaderNoiBo(new Response('x', { headers: { 'cache-control': cu } }));
    ok(`Trang tự đặt "${cu}" (màn Nhân viên, máy dùng chung, file tải về): giữ nguyên văn`, dem(tl) === cu, dem(tl));
  }
  for (const [cu, moi] of [['public, max-age=3600', 'private, max-age=3600'], ['max-age=0', 'private, max-age=0'], ['no-cache', 'private, no-cache'],
                           ['public, s-maxage=600, max-age=60', 'private, max-age=60']]) {
    const tl = datHeaderNoiBo(new Response('x', { headers: { 'cache-control': cu } }));
    ok(`RÀ SOÁT 14/11: trang nội bộ lỡ đặt "${cu}" → thành "${moi}" (bỏ public / s-maxage, thêm private)`, dem(tl) === moi, dem(tl));
  }
});

// ===========================================================================
await nhom('3 · Chống nhúng luôn thắng, kể cả khi trang tự đặt Content-Security-Policy', async () => {
  const coCsp = datHeaderNoiBo(new Response('x', { headers: { 'content-security-policy': "default-src 'self'" } }));
  ok('Trang có chính sách riêng: giữ nguyên, thêm một chính sách cấm nhúng',
     coCsp.headers.get('content-security-policy') === "default-src 'self', frame-ancestors 'none'", coCsp.headers.get('content-security-policy'));

  const long1 = datHeaderNoiBo(new Response('x', { headers: { 'content-security-policy': "frame-ancestors 'self'; default-src 'self'" } }));
  ok('RÀ SOÁT 14/11: trang lỡ cho phép nhúng cùng tên miền (frame-ancestors \'self\') → vẫn bị cấm hẳn',
     camNhung(long1.headers.get('content-security-policy')) && /default-src 'self'/.test(long1.headers.get('content-security-policy')), long1.headers.get('content-security-policy'));

  // Rà soát mã 14/11: hai header CSP ra khỏi Headers.get() thành một chuỗi cách nhau bằng dấu phẩy. Bản đầu chỉ tách
  // theo dấu chấm phẩy nên luật 'self' đứng trước vẫn có hiệu lực.
  const h = new Headers();
  h.append('content-security-policy', "default-src 'self'");
  h.append('content-security-policy', "frame-ancestors 'self'; img-src *");
  const haiDau = datHeaderNoiBo(new Response('x', { headers: h }));
  ok('RÀ SOÁT 14/11: trang đặt HAI header CSP, cái sau cho nhúng cùng tên miền → vẫn bị cấm hẳn',
     camNhung(haiDau.headers.get('content-security-policy')) && /img-src \*/.test(haiDau.headers.get('content-security-policy')), haiDau.headers.get('content-security-policy'));

  const daCam = datHeaderNoiBo(new Response('x', { headers: { 'content-security-policy': "frame-ancestors 'none'" } }));
  ok('Trang đã tự cấm nhúng: không thêm lần hai', daCam.headers.get('content-security-policy') === "frame-ancestors 'none'", daCam.headers.get('content-security-policy'));
  const haiLan = datHeaderNoiBo(datHeaderNoiBo(new Response('x')));
  ok('Gắn hai lần cho cùng một trả lời: kết quả như gắn một lần',
     haiLan.headers.get('content-security-policy') === "frame-ancestors 'none'" && dem(haiLan) === 'private' && haiLan.headers.get('x-frame-options') === 'DENY', JSON.stringify(dau(haiLan)));
});

// ===========================================================================
await nhom('4 · Trả lời có header bị khóa (không sửa được) → dựng lại, không ném lỗi', async () => {
  const khoa = Response.redirect('https://beeftown.vn/noi-bo/dang-nhap', 302);   // header của Response.redirect là bất biến
  let tl = null, loi = null;
  try { tl = datHeaderNoiBo(khoa); } catch (e) { loi = String(e?.message ?? e); }
  ok('Không ném lỗi, vẫn đủ header, vẫn là lệnh chuyển hướng cũ',
     loi === null && !!tl && duChongNhung(tl) && dem(tl) === 'private' && tl.status === 302 && tl.headers.get('location') === 'https://beeftown.vn/noi-bo/dang-nhap',
     loi ?? JSON.stringify(tl ? dau(tl) : null));
});

// ===========================================================================
await nhom('5 · middleware.ts: mọi lối ra của /noi-bo đều qua datHeaderNoiBo; trang công khai đi thẳng', async () => {
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
