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
 *   1. Mọi trang công khai (sitemap + danh sách cố định) ở 360, 800, 1366 px: trả 200,
 *      không lỗi JavaScript, không tải hỏng tài nguyên của chính trang, không tràn
 *      ngang, đúng thuộc tính lang; chân trang có pháp nhân (tên công ty, mã số thuế,
 *      địa chỉ) bằng chữ, ngay dưới dòng ©.
 *   2. Trang đặt bàn / tuyển dụng chưa có database: KHÔNG có form nào, không có chữ
 *      "thành công" / "success" / "성공".
 *   3. Gửi thẳng form đặt bàn (không qua giao diện): trang quay về báo lỗi, không bao
 *      giờ báo thành công. Gửi từ trang web khác (Origin lạ) bị từ chối 403.
 *   4. /noi-bo chuyển sang trang đăng nhập; hook iPOS không lộ lỗi nội bộ.
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
    const b = spawnSync(process.execPath, [join(WEB, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build'], { cwd: WEB, stdio: 'inherit' });
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
  const bo = new Set(['/', '/dat-ban', '/tuyen-dung', '/quyen-rieng-tu', '/xoa-du-lieu',
    '/en', '/en/book', '/en/jobs', '/en/privacy', '/en/data-deletion',
    '/ko', '/ko/book', '/ko/jobs', '/ko/privacy', '/ko/data-deletion']);
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
const CHU_THANH_CONG = /thành công|\bsuccess|성공/i;
const CO_MAN_HINH = [
  { ten: 'điện thoại', width: 360, height: 740 },
  { ten: 'máy tính bảng', width: 800, height: 1280 },
  { ten: 'máy tính', width: 1366, height: 768 },
];

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
