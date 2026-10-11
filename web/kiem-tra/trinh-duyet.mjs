/**
 * KIỂM THỬ BẰNG TRÌNH DUYỆT THẬT — khách mở trang, bấm form
 * ==========================================================
 *
 *     npm run thu-trinh-duyet                    ← build lại, bật wrangler dev trên bản build, chạy thử
 *     npm run thu-trinh-duyet -- --khong-build   ← dùng dist/ có sẵn (CI: bước trước vừa build)
 *     npm run thu-trinh-duyet -- --url https://… ← chạy trên một trang đang chạy thật (chỉ phần xem trang)
 *
 * Các phép thử khác đọc mã hoặc HTML. File này mở trang trong Chromium thật, ở ba cỡ
 * màn hình, giống khách đứng trước bạt cầm điện thoại — và chạy trên BẢN BUILD qua
 * wrangler dev (cùng workerd với Cloudflare), không phải astro dev.
 *
 * Chạy KHÔNG có database (CI không có web/.env). Đó chính là trạng thái cần giữ đúng
 * nhất: README gốc — "form chưa sẵn sàng thì ẩn hẳn", "không bao giờ báo đã nhận khi
 * chưa ghi được". Bất biến:
 *
 *   1. Mọi trang công khai (sitemap + danh sách cố định) ở 360, 390, 768, 800, 1024,
 *      1366, 1440 px: trả 200, không lỗi JavaScript, không tải hỏng tài nguyên của chính
 *      trang, không tràn ngang, đúng thuộc tính lang; chân trang có pháp nhân (tên công
 *      ty, mã số thuế, địa chỉ) bằng chữ, ngay dưới dòng ©. Thêm (brief 06/10/2026):
 *      đúng một <h1>; mọi <img> có width, height, alt (alt="" cho ảnh trang trí); ảnh
 *      minh họa nằm dưới màn hình đầu thì loading="lazy"; nút, link điều hướng, summary
 *      cao ≥ 44px; chân trang có "11-21 Hàm Nghi"; trang chủ, Đến Beeftown, Hỏi bàn nói
 *      rõ cầu thang bộ TRONG nội dung chính; chữ trên nền màu đặc đủ tương phản
 *      (≥ 4,5:1, chữ lớn ≥ 3:1).
 *   2. Trang đặt bàn / tuyển dụng chưa có database: KHÔNG có form nào, không có chữ
 *      "thành công" / "success" / "성공". Trang hỏi bàn: meta description, og:description
 *      và đoạn mở đầu không hứa "gửi yêu cầu, nhà hàng gọi lại" khi form đóng.
 *   3. Gửi thẳng form đặt bàn (không qua giao diện): trang quay về báo lỗi, không bao
 *      giờ báo thành công. Gửi từ trang web khác (Origin lạ) bị từ chối 403.
 *   4. /noi-bo chuyển sang trang đăng nhập (cả đường dẫn lạ dưới /noi-bo — đã đăng nhập thì
 *      chúng hiện trang 404 NỘI BỘ, kiểm ở crm/test/test-noi-bo-khong-co.mjs vì cần database);
 *      hook iPOS không lộ lỗi nội bộ; khóa sai dạng vẫn là 404 chữ trơn của src/worker.ts.
 *   5. Menu gọn của màn hẹp (<details class="menu-gon">) mở / đóng được KHI TẮT
 *      JavaScript; có JavaScript thì Esc đóng nó và trả tiêu điểm về nút.
 *   6. Đường dẫn lạ (/…, /en/…, /ko/…) ở 360 và 1366 px: mã 404, trang 404 của Beeftown
 *      đúng thứ tiếng theo tiền tố, có link về /, /en, /ko, chân trang công khai, không
 *      tràn ngang, noindex và không canonical / hreflang / JSON-LD. Chạy cả với --url.
 *
 * Hỏng thì ảnh chụp màn hình nằm ở kiem-tra/anh-loi/ (CI tải lên thành artifact).
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as cho } from 'node:timers/promises';
import { chromium } from 'playwright';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const ANH_LOI = join(WEB, 'kiem-tra', 'anh-loi');
const CONG = 4330;

// ---------------------------------------------------------------------------
// Bộ đếm — cùng kiểu các file test của crm
// ---------------------------------------------------------------------------
let dat = 0, hong = 0;
const loi = [];
function ok(ten, dieuKien, chiTiet = '') {
  if (dieuKien) { dat++; console.log(`  \x1b[32m✓\x1b[0m ${ten}`); }
  else {
    hong++; loi.push(ten + (chiTiet ? ` — ${chiTiet}` : ''));
    console.log(`  \x1b[31m✗ ${ten}\x1b[0m${chiTiet ? ` — ${chiTiet}` : ''}`);
  }
  return dieuKien;
}
async function nhom(ten, fn) {
  console.log(`\n\x1b[1m${ten}\x1b[0m`);
  try { await fn(); } catch (e) { ok(`${ten} chạy được đến cuối`, false, e.stack || e.message); }
}

// ---------------------------------------------------------------------------
// Máy chủ: bản build chạy trong wrangler dev
// ---------------------------------------------------------------------------
async function song(goc) {
  try { return (await fetch(goc, { signal: AbortSignal.timeout(2000) })).ok; } catch { return false; }
}

async function batMayChu() {
  // Mặc định luôn build lại: thử trên dist/ cũ thì sửa mã rồi chạy vẫn xanh — lỗi vừa thêm không ai thấy.
  if (!process.argv.includes('--khong-build') || !existsSync(join(WEB, 'dist', 'server'))) {
    console.log('Build lại bản mới nhất (astro build)…');
    // Build KHÔNG database, kể cả khi máy đang chạy có sẵn PUBLIC_SUPABASE_* (biến môi trường của phiên,
    // hay web/.env): Vite nướng hai biến này vào bản build, và biến môi trường thắng .env — đặt rỗng là
    // trang chắc chắn ở trạng thái của CI. Không vậy thì mục 2–3 gửi form vào database THẬT.
    const b = spawnSync(process.execPath, [join(WEB, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build'],
      { cwd: WEB, stdio: 'inherit', env: { ...process.env, PUBLIC_SUPABASE_URL: '', PUBLIC_SUPABASE_ANON_KEY: '' } });
    if (b.status !== 0) throw new Error('astro build hỏng');
  }
  const goc = `http://127.0.0.1:${CONG}`;
  if (await song(goc)) throw new Error(`Cổng ${CONG} đang bận — tắt máy chủ cũ rồi chạy lại`);
  const p = spawn(process.execPath, [join(WEB, 'node_modules', 'wrangler', 'bin', 'wrangler.js'), 'dev',
    '--port', String(CONG), '--ip', '127.0.0.1', '--log-level', 'warn'],
    { cwd: WEB, stdio: 'ignore', detached: process.platform !== 'win32' });
  for (let i = 0; i < 60; i++) {
    if (await song(goc)) return { p, goc };
    await cho(1000);
  }
  tatMayChu(p);
  throw new Error(`wrangler dev không lên sau 60 giây ở cổng ${CONG}`);
}

function tatMayChu(p) {
  if (!p?.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(-p.pid, 'SIGTERM'); } catch { p.kill('SIGTERM'); } }
}

async function danhSachTrang(goc) {
  const bo = new Set(['/', '/thuc-don', '/den-beeftown', '/dat-ban', '/tuyen-dung', '/quyen-rieng-tu', '/xoa-du-lieu',
    '/en', '/en/menu', '/en/visit', '/en/book', '/en/jobs', '/en/privacy', '/en/data-deletion',
    '/ko', '/ko/menu', '/ko/visit', '/ko/book', '/ko/jobs', '/ko/privacy', '/ko/data-deletion']);
  try {
    const xml = await (await fetch(new URL('/sitemap.xml', goc))).text();
    for (const m of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) bo.add(new URL(m[1]).pathname);
  } catch { console.log('  (không đọc được sitemap.xml — dùng danh sách cố định)'); }
  return [...bo].sort();
}

const ngonNguCua = duong => (duong.startsWith('/en') ? 'en' : duong.startsWith('/ko') ? 'ko' : 'vi');

// Chân trang: ngay dưới dòng © là pháp nhân, bằng CHỮ trong HTML (không phải ảnh), tên công ty
// và địa chỉ đúng từng ký tự ở cả ba thứ tiếng. Chép tay ở đây, KHÔNG đọc PHAP_NHAN trong
// lib/chu.ts — sửa nhầm một ký tự ở đó thì phép thử này đỏ.
const DONG_BAN_QUYEN = /^© \d{4} Beeftown · Beef Specialty Restaurant$/;
const NHAN_MA_SO_THUE = { vi: 'Mã số thuế', en: 'Tax code', ko: '세금 코드' };
const dongPhapNhan = nn => [
  `CÔNG TY TNHH SLK GROUP · ${NHAN_MA_SO_THUE[nn]}: 0319712805`,
  'Tầng 3, 11-13-15-17-19-21 Hàm Nghi, Phường Sài Gòn, TP. Hồ Chí Minh',
];
const TRANG_FORM = ['/dat-ban', '/en/book', '/ko/book', '/tuyen-dung', '/en/jobs', '/ko/jobs'];
const TRANG_HOI_BAN = ['/dat-ban', '/en/book', '/ko/book'];
const CHU_THANH_CONG = /thành công|\bsuccess|성공/i;
// Lời hứa của form hỏi bàn: gửi yêu cầu trên trang, nhà hàng gọi lại. Form đóng thì mô tả và đoạn
// mở đầu không được nói câu này (kiểm site thật 07/10/2026) — chép tay, như crm/test/test-cong-khai-hoi-ban-dong.mjs.
const HUA_FORM = {
  vi: /gọi lại|gửi yêu cầu/i,
  en: /call you back|(?<!cannot )send (?:a|your)(?: table)? request/i,
  ko: /전화드려요|전화로 안내|문의를 보내 주세요/,
};
// Trang 404: một đường dẫn lạ cho mỗi thứ tiếng.
const TRANG_KHONG_CO = [['/khong-co-trang-nay', 'vi'], ['/en/khong-co', 'en'], ['/ko/khong-co', 'ko']];
const CO_MAN_HINH = [
  { ten: 'điện thoại', width: 360, height: 740 },
  { ten: 'điện thoại lớn', width: 390, height: 844 },
  { ten: 'máy tính bảng dọc', width: 768, height: 1024 },
  { ten: 'máy tính bảng', width: 800, height: 1280 },
  { ten: 'máy tính bảng ngang', width: 1024, height: 768 },
  { ten: 'máy tính', width: 1366, height: 768 },
  { ten: 'màn rộng', width: 1440, height: 900 },
];

// Trang nói về đường lên tầng 3 phải nói rõ cầu thang bộ ngay trong nội dung chính — chân
// trang cũng có câu đó trên mọi trang, nên đọc <main>, không đọc cả trang.
const TRANG_CAU_THANG = ['/', '/en', '/ko', '/den-beeftown', '/en/visit', '/ko/visit', '/dat-ban', '/en/book', '/ko/book'];
const CAU_THANG = { vi: /cầu thang bộ/i, en: /stairs/i, ko: /계단/ };

/**
 * Các phép đo thêm của một trang (chạy TRONG trang). Trả về danh sách chỗ sai của từng phép.
 * Tương phản: chỉ xét chữ mà mọi lớp nền phía sau là MÀU ĐẶC — gặp ảnh nền / gradient thì
 * bỏ qua (không tính được bằng màu); nền nửa trong suốt thì trộn dần với lớp bên dưới.
 */
function doTrang() {
  const hien = el => {
    const k = el.getBoundingClientRect();
    return el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && k.width > 0 && k.height > 0;
  };
  const moTa = el => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('src') || el.outerHTML).trim().replace(/\s+/g, ' ').slice(0, 50);

  const anhThieu = [...document.images]
    .filter(i => !i.hasAttribute('width') || !i.hasAttribute('height') || !i.hasAttribute('alt'))
    .map(i => `${i.getAttribute('src') ?? i.currentSrc} (thiếu ${['width', 'height', 'alt'].filter(a => !i.hasAttribute(a)).join(', ')})`);
  const anhKhongLazy = [...document.querySelectorAll('figure.anh img')]
    .filter(i => i.getBoundingClientRect().top + scrollY >= innerHeight && i.getAttribute('loading') !== 'lazy')
    .map(i => i.getAttribute('src') ?? i.currentSrc);
  const vungCham = [...document.querySelectorAll('.nut, nav a, .doi-ngon-ngu, summary')]
    .filter(el => hien(el) && el.getBoundingClientRect().height < 43.5)
    .map(el => `«${moTa(el)}» cao ${el.getBoundingClientRect().height.toFixed(1)}px`);

  // --- Tương phản (WCAG 2.2) ---
  const mau = s => {
    const m = /^rgba?\(([^)]+)\)$/.exec(String(s).trim());
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    const [r, g, b] = p.slice(0, 3).map(Number);
    const a = p[3] === undefined ? 1 : p[3].endsWith('%') ? parseFloat(p[3]) / 100 : Number(p[3]);
    return [r, g, b, a].some(Number.isNaN) ? null : { r, g, b, a };
  };
  const tron = (tren, duoi) => ({
    r: tren.r * tren.a + duoi.r * (1 - tren.a), g: tren.g * tren.a + duoi.g * (1 - tren.a),
    b: tren.b * tren.a + duoi.b * (1 - tren.a), a: 1,
  });
  const doSang = c => {
    const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const tiLe = (x, y) => { const [s, t] = [doSang(x), doSang(y)].sort((m, n) => n - m); return (s + 0.05) / (t + 0.05); };
  const nenCua = el => {
    const lop = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none') return null;
      const c = mau(cs.backgroundColor);
      if (!c) return null;
      if (c.a > 0) { lop.push(c); if (c.a >= 1) break; }
    }
    return lop.reverse().reduce((nen, c) => tron(c, nen), { r: 255, g: 255, b: 255, a: 1 });
  };
  const tuongPhan = [];
  const daXet = new Set();
  const di = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = di.nextNode(); n; n = di.nextNode()) {
    const el = n.parentElement;
    if (!n.nodeValue.trim() || !el || daXet.has(el)) continue;
    daXet.add(el);
    if (el.closest('[aria-hidden="true"], script, style, noscript, template, .an-chu') || !hien(el)) continue;
    const cs = getComputedStyle(el);
    const chu = mau(cs.color);
    if (!chu || chu.a === 0) continue;
    const nen = nenCua(el);
    if (!nen) continue;
    let mo = 1;
    for (let e = el; e; e = e.parentElement) mo *= Number(getComputedStyle(e).opacity);
    const r = tiLe(tron({ ...chu, a: chu.a * mo }, nen), nen);
    const co = parseFloat(cs.fontSize);
    const can = co >= 24 || (co >= 18.66 && Number(cs.fontWeight) >= 700) ? 3 : 4.5;
    if (r + 0.005 < can) {
      tuongPhan.push(`«${n.nodeValue.trim().replace(/\s+/g, ' ').slice(0, 40)}» ${r.toFixed(2)}:1 < ${can}:1 (${cs.color} trên rgb(${[nen.r, nen.g, nen.b].map(Math.round).join(', ')}), ${co}px)`);
    }
  }

  return {
    soH1: document.querySelectorAll('h1').length,
    anhThieu, anhKhongLazy, vungCham, tuongPhan,
    chanCoDiaChi: (document.querySelector('footer')?.innerText ?? '').includes('11-21 Hàm Nghi'),
    chuChinh: document.querySelector('main')?.innerText ?? '',
  };
}

// ---------------------------------------------------------------------------
const i = process.argv.indexOf('--url');
const URL_NGOAI = i > -1 ? process.argv[i + 1] : null;

rmSync(ANH_LOI, { recursive: true, force: true });
// wrangler dev chạy ở nhóm tiến trình riêng nên không nhận Ctrl+C — tự tắt nó trước khi thoát, kẻo nó giữ cổng.
let mayChuDangChay = null;
for (const tin of ['SIGINT', 'SIGTERM']) process.on(tin, () => { tatMayChu(mayChuDangChay); process.exit(130); });
console.log('\x1b[1m\nBEEFTOWN — KIỂM THỬ BẰNG TRÌNH DUYỆT THẬT\x1b[0m');
console.log('='.repeat(60));

let mayChu = null;
let trinhDuyet = null;
try {
  const goc = URL_NGOAI ?? (mayChu = await batMayChu()).goc;
  mayChuDangChay = mayChu?.p ?? null;
  console.log(`Trang: ${goc}`);
  trinhDuyet = await chromium.launch();
  const trang = await danhSachTrang(goc);
  const chupLoi = async (page, ten) => {
    mkdirSync(ANH_LOI, { recursive: true });
    await page.screenshot({ path: join(ANH_LOI, `${ten.replace(/[^a-z0-9-]+/gi, '_')}.png`), fullPage: true }).catch(() => {});
  };

  // =========================================================================
  await nhom(`1 · ${trang.length} TRANG CÔNG KHAI Ở 3 CỠ MÀN HÌNH`, async () => {
    for (const co of CO_MAN_HINH) {
      const ctx = await trinhDuyet.newContext({ viewport: { width: co.width, height: co.height } });
      for (const duong of trang) {
        const page = await ctx.newPage();
        const loiJs = [], taiHong = [];
        const cuaTrang = u => u.startsWith(goc);
        page.on('pageerror', e => loiJs.push(e.message));
        page.on('console', m => { if (m.type() === 'error' && cuaTrang(m.location().url || goc)) loiJs.push(m.text()); });
        page.on('requestfailed', r => { if (cuaTrang(r.url())) taiHong.push(`${r.url()} (${r.failure()?.errorText})`); });
        page.on('response', r => { if (cuaTrang(r.url()) && r.status() >= 400) taiHong.push(`${r.url()} HTTP ${r.status()}`); });

        const r = await page.goto(goc + duong, { waitUntil: 'load', timeout: 30000 });
        const kq = await page.evaluate(() => {
          const chan = document.querySelector('footer');
          return {
            lang: document.documentElement.lang,
            rong: document.documentElement.scrollWidth,
            khung: window.innerWidth,
            // innerText: chỉ chữ thật sự hiện ra (ảnh, chữ bị ẩn không có ở đây), mỗi khối một dòng.
            dongChan: (chan?.innerText ?? '').split('\n').map(s => s.trim()).filter(Boolean),
            coChan: !!chan,
            // Có chữ trong HTML mà không đọc được thì cũng như không: bị ẩn, khung rỗng, chữ dưới 12px.
            chanAn: !!chan && [...chan.querySelectorAll('p')].some(p => {
              const k = p.getBoundingClientRect();
              return !p.checkVisibility({ opacityProperty: true, visibilityProperty: true })
                || k.width === 0 || k.height === 0 || parseFloat(getComputedStyle(p).fontSize) < 12;
            }),
          };
        });
        const nhan = `${duong} · ${co.ten} ${co.width}px`;
        const them = await page.evaluate(doTrang);
        const iBanQuyen = kq.dongChan.findIndex(d => DONG_BAN_QUYEN.test(d));
        const phapNhan = dongPhapNhan(ngonNguCua(duong));
        const tot = [
          ok(`${nhan}: HTTP 200, đúng lang="${ngonNguCua(duong)}"`, r?.status() === 200 && kq.lang === ngonNguCua(duong),
             `HTTP ${r?.status()}, lang="${kq.lang}"`),
          ok(`${nhan}: không lỗi JavaScript, không tải hỏng`, !loiJs.length && !taiHong.length,
             [...loiJs, ...taiHong].slice(0, 3).join(' | ')),
          ok(`${nhan}: không tràn ngang`, kq.rong <= kq.khung + 1, `rộng ${kq.rong}px > khung ${kq.khung}px`),
          ok(`${nhan}: chân trang — ngay dưới dòng "© … Beeftown · Beef Specialty Restaurant" là pháp nhân SLK GROUP, chữ HTML đúng từng ký tự, hiện trên màn hình`,
             kq.coChan && !kq.chanAn && iBanQuyen > -1
               && kq.dongChan[iBanQuyen + 1] === phapNhan[0] && kq.dongChan[iBanQuyen + 2] === phapNhan[1],
             !kq.coChan ? 'trang không có <footer>'
               : kq.chanAn ? 'một dòng chân trang bị ẩn hoặc chữ dưới 12px' : JSON.stringify(kq.dongChan)),
          ok(`${nhan}: đúng một <h1>`, them.soH1 === 1, `${them.soH1} thẻ h1`),
          ok(`${nhan}: mọi <img> có width, height, alt`, !them.anhThieu.length, them.anhThieu.slice(0, 3).join(' | ')),
          ok(`${nhan}: ảnh minh họa dưới màn hình đầu có loading="lazy"`, !them.anhKhongLazy.length, them.anhKhongLazy.slice(0, 3).join(' | ')),
          ok(`${nhan}: nút, link điều hướng, summary cao ≥ 44px`, !them.vungCham.length, them.vungCham.slice(0, 4).join(' | ')),
          ok(`${nhan}: chân trang có địa chỉ "11-21 Hàm Nghi"`, them.chanCoDiaChi),
          ...(TRANG_CAU_THANG.includes(duong)
            ? [ok(`${nhan}: nội dung chính nói rõ lên tầng 3 bằng cầu thang bộ`, CAU_THANG[ngonNguCua(duong)].test(them.chuChinh))]
            : []),
          ok(`${nhan}: tương phản chữ ≥ 4,5:1 (chữ lớn ≥ 3:1) trên nền màu đặc`, !them.tuongPhan.length,
             them.tuongPhan.slice(0, 3).join(' | ')),
        ];
        if (tot.includes(false)) await chupLoi(page, `${duong}-${co.width}`);
        await page.close();
      }
      await ctx.close();
    }
  });

  // =========================================================================
  if (URL_NGOAI) {
    console.log('\n(Trang thật: bỏ qua mục 2–4 — chúng giả định chưa có database và gửi form thử.)');
  } else {
    const ctx = await trinhDuyet.newContext({ viewport: { width: 360, height: 740 } });
    const page = await ctx.newPage();

    await nhom('2 · CHƯA CÓ DATABASE: FORM ẨN HẲN, KHÔNG BÁO THÀNH CÔNG', async () => {
      for (const duong of TRANG_FORM) {
        await page.goto(goc + duong);
        const soForm = await page.locator('form').count();
        const chu = await page.locator('body').innerText();
        ok(`${duong}: không có form nào (form chưa sẵn sàng thì ẩn hẳn)`, soForm === 0, `${soForm} form`);
        ok(`${duong}: không có chữ "thành công"/"success"/"성공"`, !CHU_THANH_CONG.test(chu), chu.match(CHU_THANH_CONG)?.[0]);
        if (TRANG_HOI_BAN.includes(duong)) {
          const hua = HUA_FORM[ngonNguCua(duong)];
          const moTa = await page.locator('meta[name="description"]').getAttribute('content') ?? '';
          const moTaOg = await page.locator('meta[property="og:description"]').getAttribute('content') ?? '';
          const dan = await page.locator('main p.dan').first().innerText().catch(() => '');
          ok(`${duong}: form đóng → meta description và og:description không hứa gửi yêu cầu / gọi lại`,
             !hua.test(moTa) && !hua.test(moTaOg), `«${moTa}»`);
          ok(`${duong}: form đóng → đoạn mở đầu không hứa gửi yêu cầu / gọi lại`, !!dan && !hua.test(dan), `«${dan}»`);
        }
      }
    });

    await nhom('3 · GỬI THẲNG FORM ĐẶT BÀN: BÁO LỖI, KHÔNG BAO GIỜ BÁO THÀNH CÔNG', async () => {
      for (const duong of ['/dat-ban', '/en/book', '/ko/book']) {
        await page.goto(goc + duong);
        const truoc = await page.locator('body').innerText();
        // Dựng form ngay trên trang rồi bấm gửi — giống kẻ gửi thẳng, hoặc trang cũ còn trong bộ nhớ đệm.
        await Promise.all([
          page.waitForNavigation(),
          page.evaluate(() => {
            const f = document.createElement('form');
            f.method = 'post'; f.action = location.pathname;
            for (const [k, v] of Object.entries({ ho_ten: 'Khách Thử', sdt: '0912345678', ngay: '2030-10-01', gio: '18:00', so_khach: '2' })) {
              const o = document.createElement('input'); o.name = k; o.value = v; f.appendChild(o);
            }
            document.body.appendChild(f); f.submit();
          }),
        ]);
        const sau = await page.locator('body').innerText();
        ok(`${duong}: gửi xong quay về đúng trang`, new URL(page.url()).pathname === duong, page.url());
        ok(`${duong}: không bao giờ báo thành công`, !CHU_THANH_CONG.test(sau), sau.match(CHU_THANH_CONG)?.[0]);
        // Đặt bàn đang đóng thì trang CỐ Ý bỏ câu lỗi của lần gửi và hiện khung "chưa mở đặt bàn" — cũng là
        // sự thật, và cũng chỉ đường sang Facebook. Không được là trang khác, trang trống hay form.
        if (!ok(`${duong}: trang sau khi gửi nói rõ chưa đặt được và chỉ đường sang Facebook`,
                /facebook/i.test(sau) && (sau === truoc || sau.length > truoc.length) && await page.locator('form').count() === 0,
                sau.slice(0, 160))) await chupLoi(page, `gui-thang${duong}`);
      }

      const r = await page.request.post(goc + '/dat-ban', {
        headers: { Origin: 'https://ke-la.example', 'Content-Type': 'application/x-www-form-urlencoded' },
        data: 'ho_ten=x&sdt=0912345678', maxRedirects: 0,
      });
      ok('Gửi từ trang web khác (Origin lạ) → 403', r.status() === 403, `HTTP ${r.status()}`);
    });

    await nhom('4 · KHU NỘI BỘ VÀ HOOK', async () => {
      const r = await page.goto(goc + '/noi-bo');
      ok('/noi-bo → trang đăng nhập (200)', r?.status() === 200 && new URL(page.url()).pathname === '/noi-bo/dang-nhap', page.url());
      for (const [cach, duong] of [['GET', '/hook/ipos/khong-dung'], ['POST', '/hook/ipos/khong-dung'], ['POST', '/hook/messenger']]) {
        const h = await page.request.fetch(goc + duong, { method: cach, data: cach === 'POST' ? '{}' : undefined, maxRedirects: 0 });
        const than = await h.text();
        ok(`${cach} ${duong}: từ chối (4xx/503), không lộ lỗi nội bộ`,
           (h.status() >= 400 && h.status() < 500) || h.status() === 503,
           `HTTP ${h.status()}`);
        ok(`${cach} ${duong}: thân trả lời không có dấu vết lỗi (stack, đường dẫn file)`,
           !/\bat [\w.<>]+ \(|node_modules|\.ts:\d+|Error:/.test(than), than.slice(0, 160));
      }
      // Nhánh riêng của src/worker.ts: khóa sai dạng → 404 chữ trơn, chặn TRƯỚC Astro. Trang 404 của
      // web không được thay câu trả lời này bằng HTML.
      const h = await page.request.get(goc + '/hook/ipos/a/b', { maxRedirects: 0 });
      const thanHook = await h.text();
      ok('GET /hook/ipos/a/b: vẫn là 404 chữ trơn "Không tìm thấy" của src/worker.ts, không phải trang 404 HTML',
         h.status() === 404 && thanHook === 'Không tìm thấy' && !/text\/html/i.test(h.headers()['content-type'] ?? ''),
         `HTTP ${h.status()}, ${h.headers()['content-type']}, «${thanHook.slice(0, 60)}»`);
      // Đường dẫn lạ dưới /noi-bo vẫn đi qua middleware: chưa đăng nhập thì về trang đăng nhập — trang 404
      // không mở ra cho người lạ biết đường dẫn nào có, đường dẫn nào không. Đủ các dạng middleware canh:
      // trong khu nội bộ, sâu trong kho, có / cuối, và tiền tố không có / (/noi-bo-…). Đã đăng nhập thì
      // /noi-bo/… hiện bản 404 NỘI BỘ — phần đó cần database, kiểm ở crm/test/test-noi-bo-khong-co.mjs.
      for (const duong of ['/noi-bo/khong-co-trang-nay', '/noi-bo/kho/khong-co-trang-nay/', '/noi-bo-khong-co-trang-nay']) {
        const nb = await page.request.get(goc + duong, { maxRedirects: 0 });
        ok(`GET ${duong} chưa đăng nhập → chuyển về /noi-bo/dang-nhap, không phải trang 404`,
           nb.status() === 302 && new URL(nb.headers().location ?? '', goc).pathname === '/noi-bo/dang-nhap',
           `HTTP ${nb.status()} → ${nb.headers().location}`);
      }
    });
    await ctx.close();
  }

  // =========================================================================
  await nhom('5 · MENU GỌN Ở 360 PX: MỞ / ĐÓNG KHI TẮT JAVASCRIPT, Esc ĐÓNG KHI CÓ JAVASCRIPT', async () => {
    for (const coJs of [false, true]) {
      const ctx = await trinhDuyet.newContext({ viewport: { width: 360, height: 740 }, javaScriptEnabled: coJs });
      const page = await ctx.newPage();
      for (const duong of ['/', '/en', '/ko']) {
        await page.goto(goc + duong);
        const nhan = `${duong} · ${coJs ? 'có' : 'TẮT'} JavaScript`;
        const menu = page.locator('details.menu-gon');
        const nut = menu.locator('summary');
        const muc = menu.locator('a[href]');
        const mo = () => menu.evaluate(d => d.open).catch(() => null);
        const thayMuc = async () => (await muc.count()) > 0 && await muc.first().isVisible();
        if (!ok(`${nhan}: có menu gọn, lúc đầu đóng, các mục chưa hiện`,
                await menu.count() === 1 && await nut.isVisible() && await mo() === false && !(await thayMuc()))) {
          await chupLoi(page, `menu-gon${duong}-${coJs ? 'js' : 'khong-js'}`);
          continue;
        }
        await nut.click();
        ok(`${nhan}: bấm nút danh mục → mở, thấy các mục`, await mo() === true && await thayMuc());
        if (coJs) {
          await page.keyboard.press('Escape');
          ok(`${nhan}: Esc → đóng, tiêu điểm về nút danh mục`,
             await mo() === false && await nut.evaluate(s => document.activeElement === s));
        } else {
          await nut.click();
          ok(`${nhan}: bấm lần nữa → đóng`, await mo() === false && !(await thayMuc()));
        }
      }
      await ctx.close();
    }
  });

  // =========================================================================
  // Kiểm site thật 07/10/2026: đường dẫn lạ trả đúng mã 404 nhưng HTML là mẫu mặc định của Astro —
  // lang="en", nền đen, không một link, không chữ Beeftown. Chạy cả với --url (kiểm beeftown.vn sau deploy).
  await nhom('6 · TRANG KHÔNG CÓ (404): MÃ 404, ĐÚNG THỨ TIẾNG, CÓ ĐƯỜNG VỀ TRANG CHỦ', async () => {
    for (const co of CO_MAN_HINH.filter(c => c.width === 360 || c.width === 1366)) {
      const ctx = await trinhDuyet.newContext({ viewport: { width: co.width, height: co.height } });
      for (const [duong, nn] of TRANG_KHONG_CO) {
        const page = await ctx.newPage();
        const loiJs = [], taiHong = [];
        // Chính tài liệu trả 404 (đó là điều cần kiểm) — chỉ tài nguyên KHÁC của trang mới tính là tải hỏng.
        const taiNguyenCuaTrang = u => u.startsWith(goc) && new URL(u).pathname !== duong;
        page.on('pageerror', e => loiJs.push(e.message));
        page.on('requestfailed', r => { if (taiNguyenCuaTrang(r.url())) taiHong.push(`${r.url()} (${r.failure()?.errorText})`); });
        page.on('response', r => { if (taiNguyenCuaTrang(r.url()) && r.status() >= 400) taiHong.push(`${r.url()} HTTP ${r.status()}`); });

        const r = await page.goto(goc + duong, { waitUntil: 'load', timeout: 30000 });
        const kq = await page.evaluate(() => {
          const chan = document.querySelector('footer');
          return {
            lang: document.documentElement.lang,
            tieuDe: document.title,
            rong: document.documentElement.scrollWidth,
            khung: window.innerWidth,
            linkChinh: [...document.querySelectorAll('main a[href]')].map(a => a.getAttribute('href')),
            robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
            soCanonical: document.querySelectorAll('link[rel="canonical"]').length,
            soHreflang: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
            soJsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
            dongChan: (chan?.innerText ?? '').split('\n').map(s => s.trim()).filter(Boolean),
          };
        });
        const them = await page.evaluate(doTrang);
        const nhan = `${duong} · ${co.ten} ${co.width}px`;
        const iBanQuyen = kq.dongChan.findIndex(d => DONG_BAN_QUYEN.test(d));
        const phapNhan = dongPhapNhan(nn);
        const thieuLink = ['/', '/en', '/ko'].filter(d => !kq.linkChinh.includes(d));
        const tot = [
          ok(`${nhan}: HTTP 404 (không đổi thành 200)`, r?.status() === 404, `HTTP ${r?.status()}`),
          ok(`${nhan}: lang="${nn}" theo tiền tố đường dẫn`, kq.lang === nn, `lang="${kq.lang}"`),
          ok(`${nhan}: trang của Beeftown (tiêu đề có chữ Beeftown, đúng một <h1>)`,
             /Beeftown/.test(kq.tieuDe) && them.soH1 === 1, `«${kq.tieuDe}», ${them.soH1} thẻ h1`),
          ok(`${nhan}: nội dung chính có link về trang chủ của cả ba thứ tiếng (/, /en, /ko)`, thieuLink.length === 0,
             `thiếu ${thieuLink.join(', ')} — có ${JSON.stringify(kq.linkChinh)}`),
          ok(`${nhan}: chân trang công khai có pháp nhân SLK GROUP`,
             iBanQuyen > -1 && kq.dongChan[iBanQuyen + 1] === phapNhan[0] && kq.dongChan[iBanQuyen + 2] === phapNhan[1],
             JSON.stringify(kq.dongChan).slice(0, 200)),
          ok(`${nhan}: không tràn ngang`, kq.rong <= kq.khung + 1, `rộng ${kq.rong}px > khung ${kq.khung}px`),
          ok(`${nhan}: noindex, không canonical, không hreflang, không JSON-LD (dựng không database — sẽ khai sai)`,
             /noindex/.test(kq.robots) && kq.soCanonical === 0 && kq.soHreflang === 0 && kq.soJsonLd === 0,
             `robots «${kq.robots}», ${kq.soCanonical} canonical, ${kq.soHreflang} hreflang, ${kq.soJsonLd} JSON-LD`),
          ok(`${nhan}: nút, link điều hướng cao ≥ 44px`, !them.vungCham.length, them.vungCham.slice(0, 4).join(' | ')),
          ok(`${nhan}: tương phản chữ ≥ 4,5:1 (chữ lớn ≥ 3:1)`, !them.tuongPhan.length, them.tuongPhan.slice(0, 3).join(' | ')),
          ok(`${nhan}: không lỗi JavaScript, không tải hỏng`, !loiJs.length && !taiHong.length,
             [...loiJs, ...taiHong].slice(0, 3).join(' | ')),
        ];
        if (tot.includes(false)) await chupLoi(page, `khong-co${duong}-${co.width}`);
        await page.close();
      }
      await ctx.close();
    }
    // Prop khongLapChiMuc chỉ dành cho trang 404: trang thường vẫn giữ canonical và hreflang.
    const ctx = await trinhDuyet.newContext();
    const page = await ctx.newPage();
    await page.goto(goc + '/en/book', { waitUntil: 'load' });
    const thuong = await page.evaluate(() => ({
      robots: document.querySelectorAll('meta[name="robots"]').length,
      soCanonical: document.querySelectorAll('link[rel="canonical"]').length,
      soHreflang: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
      soJsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    }));
    ok('/en/book (trang thường): vẫn có canonical, đủ 4 hreflang, JSON-LD, không noindex',
       thuong.robots === 0 && thuong.soCanonical === 1 && thuong.soHreflang === 4 && thuong.soJsonLd === 1, JSON.stringify(thuong));
    await ctx.close();
  });
} catch (e) {
  ok('Chạy được đến cuối', false, e.stack || e.message);
} finally {
  await trinhDuyet?.close().catch(() => {});
  tatMayChu(mayChu?.p);
}

console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA TRÌNH DUYỆT ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  for (const l of loi) console.log(`  \x1b[31m· ${l}\x1b[0m`);
  if (existsSync(ANH_LOI)) console.log(`Ảnh chụp lúc hỏng: ${ANH_LOI}`);
}
process.exit(hong === 0 ? 0 : 1);
