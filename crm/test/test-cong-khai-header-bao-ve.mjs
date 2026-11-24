/**
 * BEEFTOWN — Kiểm thử: header bảo vệ của trang công khai và 301 bỏ gạch cuối đường dẫn
 * ===================================================================================
 *
 *     node test/test-cong-khai-header-bao-ve.mjs
 *
 * Rà soát SEO 23/11/2026: trả lời chỉ có HSTS; /thuc-don/ và /en/ trả 200 như /thuc-don và /en.
 * Bản sửa: web/src/lib/header-https.ts (HEADER_BAO_VE, datHeaderBaoVe), web/src/lib/chuyen-huong-dau-gach.ts,
 * nối ở web/src/worker.ts, và cùng bốn header ở web/public/_headers cho file tĩnh.
 * (Khu /noi-bo có bộ riêng: test-noi-bo-header-bao-ve.mjs. Trên bản build thật: xem mô tả PR — curl vào wrangler dev.)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { HSTS, HEADER_BAO_VE, datHsts, datHeaderBaoVe } from '../../web/src/lib/header-https.ts';
import { chuyenHuongDauGach } from '../../web/src/lib/chuyen-huong-dau-gach.ts';
import { datHeaderNoiBo } from '../../web/src/lib/header-noi-bo.ts';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = (...p) => readFileSync(join(GOC, ...p), 'utf8');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — HEADER BẢO VỆ VÀ 301 GẠCH CUỐI');

function* duyetMa(thuMuc) {
  for (const ten of readdirSync(thuMuc)) {
    const p = join(thuMuc, ten);
    if (statSync(p).isDirectory()) yield* duyetMa(p);
    else if (/\.(astro|ts|js|mjs)$/.test(ten)) yield p;
  }
}

// ===========================================================================
await nhom('1 · datHeaderBaoVe: đủ bốn header, không ghi đè, header chỉ-đọc, thân nguyên vẹn', async () => {
  ok('bốn header đúng tên', Object.keys(HEADER_BAO_VE).join(',') ===
     'X-Content-Type-Options,Referrer-Policy,X-Frame-Options,Permissions-Policy');
  ok('nosniff', HEADER_BAO_VE['X-Content-Type-Options'] === 'nosniff');
  ok('Referrer-Policy strict-origin-when-cross-origin', HEADER_BAO_VE['Referrer-Policy'] === 'strict-origin-when-cross-origin');
  ok('X-Frame-Options SAMEORIGIN', HEADER_BAO_VE['X-Frame-Options'] === 'SAMEORIGIN');

  const kq = datHeaderBaoVe(new Response('<p>trang</p>', { status: 200, headers: { 'content-type': 'text/html' } }));
  for (const [ten, gt] of Object.entries(HEADER_BAO_VE)) ok(`trả lời thường có ${ten}`, kq.headers.get(ten) === gt, String(kq.headers.get(ten)));
  ok('thân không đổi', (await kq.text()) === '<p>trang</p>');

  const co = datHeaderBaoVe(new Response('x', { headers: { 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' } }));
  ok('header đã có thì GIỮ NGUYÊN (DENY của /noi-bo không bị SAMEORIGIN đè)', co.headers.get('x-frame-options') === 'DENY' && co.headers.get('referrer-policy') === 'no-referrer');
  ok('…các header còn thiếu vẫn được thêm', co.headers.get('x-content-type-options') === 'nosniff');

  const cd = datHeaderBaoVe(Response.redirect('https://beeftown.vn/x', 302));
  ok('Response.redirect (header chỉ-đọc) không ném lỗi, vẫn đủ header, giữ mã và Location',
     cd.status === 302 && cd.headers.get('location') === 'https://beeftown.vn/x' && cd.headers.get('x-frame-options') === 'SAMEORIGIN');

  const lai = datHeaderBaoVe(datHsts(new Response('a')));
  ok('HSTS đi cùng, đúng giá trị cũ, KHÔNG includeSubDomains / preload',
     lai.headers.get('strict-transport-security') === 'max-age=31536000' && HSTS === 'max-age=31536000');

  // /noi-bo: middleware đặt DENY trước, worker gắn sau — DENY phải còn.
  const nb = datHeaderBaoVe(datHsts(datHeaderNoiBo(new Response('bí mật', { headers: { 'cache-control': 'public' } }))));
  ok('trả lời /noi-bo qua cả hai lớp vẫn là X-Frame-Options: DENY', nb.headers.get('x-frame-options') === 'DENY');
});

// ===========================================================================
await nhom('2 · Permissions-Policy không tắt thứ mã đang dùng', async () => {
  const pp = HEADER_BAO_VE['Permissions-Policy'];
  const luat = Object.fromEntries(pp.split(',').map(s => s.trim()).map(s => { const [k, v] = s.split('='); return [k, v]; }));
  const tat = Object.keys(luat).filter(k => luat[k] === '()');
  ok(`tắt hẳn: ${tat.join(', ')}`, ['geolocation', 'microphone', 'payment', 'usb'].every(k => tat.includes(k)));
  ok('camera chỉ cho chính trang (kho quét mã vạch bằng camera)', luat.camera === '(self)');

  const nguon = [...duyetMa(join(GOC, 'web/src')), ...duyetMa(join(GOC, 'web/public'))];
  const dung = (re) => nguon.filter(p => re.test(readFileSync(p, 'utf8')) && !p.endsWith('header-https.ts')).map(p => relative(GOC, p));
  ok('không file nào dùng định vị (navigator.geolocation / getCurrentPosition)', dung(/navigator\.geolocation|getCurrentPosition|watchPosition/).length === 0, dung(/navigator\.geolocation|getCurrentPosition/).join(', '));
  ok('không file nào xin micro (getUserMedia có audio)', dung(/getUserMedia\(\s*\{[^}]*audio\s*:\s*(true|\{)/).length === 0);
  ok('không file nào dùng Payment Request API', dung(/new\s+PaymentRequest\b|canMakePayment/).length === 0);
  ok('không file nào dùng WebUSB', dung(/navigator\.usb\b/).length === 0);
  ok('camera CÓ dùng ở kho (nên không được tắt)', dung(/getUserMedia\(\s*\{[^}]*video/).length >= 1);
  // Khung nhúng xin tính năng bằng allow="…": header tắt tính năng nào thì khung đó mất nó.
  const allows = nguon.flatMap(p => [...readFileSync(p, 'utf8').matchAll(/\ballow="([^"]*)"/g)].map(m => m[1]));
  const xin = new Set(allows.flatMap(a => a.split(';').map(s => s.trim().split(/\s+/)[0]).filter(Boolean)));
  ok(`khung nhúng xin: ${[...xin].join(', ') || '(không)'} — không cái nào bị tắt`, [...xin].every(k => !tat.includes(k)), [...xin].filter(k => tat.includes(k)).join(', '));
  ok('chỉ một <iframe> trong mã (YouTube ở /noi-bo/dao-tao) — không trang công khai nào của ta nhúng trang khác của ta',
     dung(/<iframe\b/).filter(p => !p.endsWith('dao-tao.astro')).length === 0);
});

// ===========================================================================
await nhom('3 · _headers (file tĩnh) khớp HEADER_BAO_VE và HSTS', async () => {
  const h = doc('web/public/_headers').replace(/\r\n/g, '\n');
  const khoi = h.slice(h.lastIndexOf('\n/*\n'));
  ok('khối /* có HSTS đúng bản của Worker', khoi.includes(`Strict-Transport-Security: ${HSTS}`));
  for (const [ten, gt] of Object.entries(HEADER_BAO_VE)) ok(`_headers /* có "${ten}: ${gt}"`, khoi.includes(`\n  ${ten}: ${gt}\n`) || khoi.endsWith(`\n  ${ten}: ${gt}`), khoi);
  ok('không includeSubDomains / preload', !/includeSubDomains|preload/i.test(khoi.replace(/#.*$/gm, '')));
  ok('chưa có Content-Security-Policy (việc của PR riêng, đo Report-Only trước)', !/Content-Security-Policy/i.test(khoi.replace(/#.*$/gm, '')));
});

// ===========================================================================
await nhom('4 · chuyenHuongDauGach: 301 về bản không gạch', async () => {
  const r = (url, method = 'GET') => chuyenHuongDauGach(new Request(url, { method }));
  const a = r('https://beeftown.vn/thuc-don/');
  ok('/thuc-don/ → 301 /thuc-don (URL đầy đủ)', a?.status === 301 && a.headers.get('location') === 'https://beeftown.vn/thuc-don');
  const b = r('https://beeftown.vn/en/');
  ok('/en/ → 301 /en', b?.status === 301 && b.headers.get('location') === 'https://beeftown.vn/en');
  const c = r('https://beeftown.vn/ko/menu/?utm_source=fb&x=a%20b');
  ok('giữ nguyên query string', c?.headers.get('location') === 'https://beeftown.vn/ko/menu?utm_source=fb&x=a%20b', c?.headers.get('location'));
  ok('gạch dư gom về một lần: /thuc-don// → /thuc-don', r('https://beeftown.vn/thuc-don//')?.headers.get('location') === 'https://beeftown.vn/thuc-don');
  ok('HEAD cũng chuyển', r('https://beeftown.vn/thuc-don/', 'HEAD')?.status === 301);
  ok('trang chủ "/" không đổi', r('https://beeftown.vn/') === null);
  ok('đường dẫn không gạch cuối không đổi', r('https://beeftown.vn/thuc-don') === null && r('https://beeftown.vn/en?x=1') === null);
  ok('POST không bị chuyển (form gửi tới /tuyen-dung/ vẫn tới nơi)', r('https://beeftown.vn/tuyen-dung/', 'POST') === null);
  for (const d of ['/hook/vnpay-ipn/', '/hook/messenger/', '/hook/ipos/khoa-bi-mat/', '/hook/']) ok(`${d} KHÔNG bị chuyển`, r(`https://beeftown.vn${d}`) === null);
  for (const d of ['/noi-bo/', '/noi-bo/kho/', '/noi-bo/dang-nhap/']) ok(`${d} KHÔNG bị chuyển (middleware lo)`, r(`https://beeftown.vn${d}`) === null);
  ok('/hookah/ (chỉ giống tiền tố) vẫn được chuyển', r('https://beeftown.vn/hookah/')?.status === 301);
  // Open redirect: đường dẫn bắt đầu bằng "//" không được thành Location kiểu "//kẻ-lạ.com".
  const x = r('https://beeftown.vn//ke-la.com/');
  ok('"//ke-la.com/" → Location vẫn trên beeftown.vn (không open redirect)', x?.headers.get('location') === 'https://beeftown.vn//ke-la.com', x?.headers.get('location'));
  ok('mọi Location đều bắt đầu bằng origin của request, không phải "//"', [a, b, c, x].every(k => k.headers.get('location').startsWith('https://beeftown.vn/') && !k.headers.get('location').startsWith('//')));
});

// ===========================================================================
await nhom('5 · worker.ts nối đủ: 301 trước hook, header bảo vệ bọc mọi trả lời, HSTS vẫn nguyên', async () => {
  const w = doc('web/src/worker.ts').replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('fetch trả datHeaderBaoVe(datHsts(await xuLyYeuCau(…)))', /return datHeaderBaoVe\(datHsts\(await xuLyYeuCau\(request, env, ctx\)\)\);/.test(w));
  ok('xuLyYeuCau chạy chuyenHuongDauGach TRƯỚC khi rẽ hook', w.indexOf('chuyenHuongDauGach(request)') > 0 && w.indexOf('chuyenHuongDauGach(request)') < w.indexOf('DUONG_HOOK)'));
  ok('hai hàm được import', /import \{ datHsts, datHeaderBaoVe \} from '\.\/lib\/header-https\.ts'/.test(w) && /import \{ chuyenHuongDauGach \} from '\.\/lib\/chuyen-huong-dau-gach\.ts'/.test(w));
});

process.exit(ketThuc('header bảo vệ và 301 gạch cuối'));
