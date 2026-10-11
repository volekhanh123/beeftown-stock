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
 *      cao ≥ 44px; chữ trên nền màu đặc đủ tương phản (≥ 4,5:1, chữ lớn ≥ 3:1).
 *      Địa điểm (Khánh chốt 07/10 và 09/10/2026): chân trang có "63 Hồ Tùng Mậu";
 *      trang chủ, Đến Beeftown, Hỏi bàn in nguyên văn câu chỉ đường TRONG nội dung
 *      chính; JSON-LD ghi streetAddress "Tầng 3, 63 Hồ Tùng Mậu", không có tên phường;
 *      ngoài dòng pháp nhân, cả trang không còn địa chỉ nào khác; không còn chữ về
 *      cầu thang bộ.
 *   2. Trang đặt bàn / tuyển dụng chưa có database: KHÔNG có form nào, không có chữ
 *      "thành công" / "success" / "성공".
 *   3. Gửi thẳng form đặt bàn (không qua giao diện): trang quay về báo lỗi, không bao
 *      giờ báo thành công. Gửi từ trang web khác (Origin lạ) bị từ chối 403.
 *   4. /noi-bo chuyển sang trang đăng nhập; hook iPOS không lộ lỗi nội bộ.
 *   5. Menu gọn của màn hẹp (<details class="menu-gon">) mở / đóng được KHI TẮT
 *      JavaScript; có JavaScript thì Esc đóng nó và trả tiêu điểm về nút.
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
/** Chữ của một khối viết liền một dòng: innerText xuống dòng ở mỗi khối, câu dài thì ở đâu cũng một dấu cách. */
const motDong = chu => chu.replace(/\s+/g, ' ').trim();
/** Chữ của trang sau khi bỏ dòng địa chỉ pháp nhân — chỗ duy nhất được ghi địa chỉ trên giấy đăng ký. */
const boPhapNhan = (chu, dongDiaChi) => chu.split(dongDiaChi).join('');

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
const CHU_THANH_CONG = /thành công|\bsuccess|성공/i;
const CO_MAN_HINH = [
  { ten: 'điện thoại', width: 360, height: 740 },
  { ten: 'điện thoại lớn', width: 390, height: 844 },
  { ten: 'máy tính bảng dọc', width: 768, height: 1024 },
  { ten: 'máy tính bảng', width: 800, height: 1280 },
  { ten: 'máy tính bảng ngang', width: 1024, height: 768 },
  { ten: 'máy tính', width: 1366, height: 768 },
  { ten: 'màn rộng', width: 1440, height: 900 },
];

// Trang nói về đường lên tầng 3 phải in nguyên văn câu chỉ đường ngay trong nội dung chính — chân
// trang cũng có câu đó trên mọi trang, nên đọc <main>, không đọc cả trang. Chép tay ở đây, KHÔNG
// đọc lib/chu.ts — sửa nhầm một chữ ở đó thì phép thử này đỏ.
const TRANG_LOI_LEN = ['/', '/en', '/ko', '/den-beeftown', '/en/visit', '/ko/visit', '/dat-ban', '/en/book', '/ko/book'];
const CAU_CHI_DUONG = {
  vi: 'Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3.',
  en: 'Use our own entrance, right next to GS25, and take the lift to Floor 3.',
  ko: 'GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요.',
};
const DUONG_NHA_HANG = '63 Hồ Tùng Mậu';
const DIA_CHI_JSON_LD = 'Tầng 3, 63 Hồ Tùng Mậu';
// Địa chỉ khác 63 Hồ Tùng Mậu: sau khi bỏ dòng pháp nhân ở trên thì cả trang không được còn chữ nào
// trong này — kể cả trong thẻ mô tả, JSON-LD, alt ảnh. Chạy với --url trên trang thật thì đây cũng là
// chỗ lộ ra một bản công bố (dia_chi_hien_thi, mo_ta_og… trong /noi-bo) còn ghi địa chỉ khác.
const TEN_DUONG_KHAC = /Hàm\s*Nghi|Sài\s*Gòn|Nguyễn\s*Thái\s*Học/iu;
// Số nhà "11-21" chỉ tìm trong chữ khách đọc: trong HTML thô, nét vẽ SVG cũng có dãy số kiểu đó.
const DIA_CHI_KHAC = new RegExp(`${TEN_DUONG_KHAC.source}|(?<![\\d-])11[-–]21(?![\\d-])`, 'iu');
// Khách đi thang máy: chữ về cầu thang bộ, hay câu nói không có thang máy, đều sai.
const CHU_CAU_THANG = /cầu\s*thang|thang\s*bộ|\bstairs?\b|계단|không\s+có\s+thang\s*máy|no\s+(?:guest\s+)?(?:lift|elevator)|엘리베이터(?:는|가)?\s*없/iu;

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
    chuChan: document.querySelector('footer')?.innerText ?? '',
    chuChinh: document.querySelector('main')?.innerText ?? '',
    // Mọi chữ khách hoặc máy tìm kiếm đọc được: tiêu đề, thẻ meta, JSON-LD, chữ hiện trong <body>, alt / aria-label / title.
    chuCaTrang: [
      document.title,
      ...[...document.querySelectorAll('meta[content]')].map(m => m.getAttribute('content')),
      ...[...document.querySelectorAll('script[type="application/ld+json"]')].map(k => k.textContent),
      document.body.innerText,
      ...[...document.querySelectorAll('[alt], [aria-label], [title]')].flatMap(e => ['alt', 'aria-label', 'title'].map(a => e.getAttribute(a))),
    ].filter(Boolean).join('\n'),
    // Cả HTML của trang — để đếm dòng pháp nhân và tìm địa chỉ khác ở chỗ không hiện thành chữ.
    htmlTrang: document.documentElement.outerHTML,
    diaChiJsonLd: (() => {
      try { return JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent ?? 'null')?.address ?? null; }
      catch { return null; }
    })(),
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
          ok(`${nhan}: chân trang có địa chỉ "${DUONG_NHA_HANG}" kèm câu chỉ đường`,
             them.chuChan.includes(DUONG_NHA_HANG) && motDong(them.chuChan).includes(CAU_CHI_DUONG[ngonNguCua(duong)]),
             motDong(them.chuChan).slice(0, 200)),
          ...(TRANG_LOI_LEN.includes(duong)
            ? [ok(`${nhan}: nội dung chính in nguyên văn câu chỉ đường (lối vào riêng ngay cạnh GS25, thang máy lên tầng 3)`,
                  motDong(them.chuChinh).includes(CAU_CHI_DUONG[ngonNguCua(duong)]))]
            : []),
          // Trang thật (--url) có thể đang in bản công bố của /noi-bo: cả dòng đó nằm ở streetAddress, nên chỉ
          // đòi có "63 Hồ Tùng Mậu". Bản build không database thì phải đúng từng trường của địa chỉ cố định.
          ok(`${nhan}: JSON-LD ghi streetAddress "${DIA_CHI_JSON_LD}", không có tên phường`,
             typeof them.diaChiJsonLd?.streetAddress === 'string'
               && (URL_NGOAI
                 ? them.diaChiJsonLd.streetAddress.includes(DUONG_NHA_HANG)
                 : them.diaChiJsonLd.streetAddress === DIA_CHI_JSON_LD && !('addressLocality' in them.diaChiJsonLd)
                   && !/phường/iu.test(JSON.stringify(them.diaChiJsonLd)))
               && !DIA_CHI_KHAC.test(JSON.stringify(them.diaChiJsonLd)),
             JSON.stringify(them.diaChiJsonLd)),
          ok(`${nhan}: ngoài dòng pháp nhân (có đúng một lần), cả trang không còn địa chỉ nào khác ${DUONG_NHA_HANG}`,
             them.htmlTrang.split(phapNhan[1]).length === 2
               && !TEN_DUONG_KHAC.test(boPhapNhan(them.htmlTrang, phapNhan[1]))
               && !DIA_CHI_KHAC.test(boPhapNhan(them.chuCaTrang, phapNhan[1])),
             `dòng pháp nhân có ${them.htmlTrang.split(phapNhan[1]).length - 1} lần; thấy «${
               (boPhapNhan(them.htmlTrang, phapNhan[1]).match(TEN_DUONG_KHAC) ?? boPhapNhan(them.chuCaTrang, phapNhan[1]).match(DIA_CHI_KHAC) ?? [''])[0]}»`),
          ok(`${nhan}: không còn chữ về cầu thang bộ, không câu nào nói không có thang máy`, !CHU_CAU_THANG.test(them.chuCaTrang),
             them.chuCaTrang.match(CHU_CAU_THANG)?.[0]),
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
