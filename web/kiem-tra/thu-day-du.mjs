/**
 * KIỂM THỬ TRANG CÔNG KHAI KHI ĐÃ NỐI DATABASE — trạng thái "đầy đủ"
 * ==================================================================
 *
 *     npm run thu-day-du                 ← bật Supabase giả + astro dev, chạy thử
 *     npm run thu-day-du -- --chup       ← chụp thêm toàn trang mọi route × 5 cỡ × (rong, day-du)
 *                                          vào kiem-tra/anh-chup/<kịch bản>/ (không commit)
 *     npm run thu-day-du -- --chi 2,3    ← chỉ chạy nhóm 2 và 3 (sửa nhanh một chỗ)
 *
 * trinh-duyet.mjs chạy KHÔNG có database — trạng thái CI giữ đúng nhất. Nhưng phần
 * lớn chỗ hỏng thật nằm ở trạng thái còn lại: Facebook / Maps đã công bố, thực đơn
 * đã công bố, form hỏi bàn đang mở, database báo lỗi, mạng đứt giữa chừng. File này
 * dựng đủ các trạng thái đó bằng kiem-tra/gia-supabase.mjs (PostgREST giả, cổng
 * 54331) và astro dev (cổng 4353) với PUBLIC_SUPABASE_URL trỏ vào server giả.
 *
 * Bất biến:
 *   1. day-du: nút chính màn đầu là "Hỏi bàn" và dẫn tới /dat-ban đúng thứ tiếng; có
 *      link Facebook đã công bố, có nút Chỉ đường; thực đơn hiện món mẫu, nhãn Món
 *      sống kèm câu cảnh báo, nhãn Có cồn, KHÔNG một số tiền nào; /dat-ban có form và
 *      khung giờ.
 *   2. Bấm đúp "Gửi yêu cầu" → tao_dat_ban được gọi ĐÚNG MỘT lần; trang sau nói "đã
 *      nhận", không bao giờ "thành công".
 *   3. Database trả 500 hoặc mạng đứt giữa chừng → KHÔNG BAO GIỜ "đã nhận"; có khung
 *      lỗi; họ tên và số điện thoại khách đã gõ được điền lại. Database từ chối (hết
 *      bàn) → câu của database hiện ra, đúng thứ tiếng.
 *   4. rong (nối database, chưa công bố gì): không nút Facebook, không Chỉ đường; nút
 *      chính màn đầu là "Khám phá thực đơn".
 *   5. Mọi trang công khai × (rong, day-du, dat-ban-dong) ở 360 và 1440 px: HTTP 200,
 *      không tràn ngang, không lỗi JavaScript.
 *
 * Hỏng thì ảnh chụp nằm ở kiem-tra/anh-loi/day-du/ (CI tải lên cùng artifact của
 * trinh-duyet.mjs).
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as cho } from 'node:timers/promises';
import { batMayGia, LIEN_HE_THU, MON_MAU } from './gia-supabase.mjs';
import { timChuoiCam } from '../src/lib/chuoi-cam.js';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const ANH_LOI = join(WEB, 'kiem-tra', 'anh-loi', 'day-du');
const ANH_CHUP = join(WEB, 'kiem-tra', 'anh-chup');
const CONG_GIA = 54331;
const CONG_WEB = 4353;
const CHUP = process.argv.includes('--chup');

// Câu chữ đọc từ chính thư viện của trang (Node ≥ 22.18 đọc thẳng .ts) — đổi chữ ở lib
// thì phép thử đổi theo, không phải chép tay hai nơi.
const { CAP_DUONG_DAN, NGON_NGU, chu, duongDanTuongUng, cauLoiDatabase } =
  await import(pathToFileURL(join(WEB, 'src', 'lib', 'chu.ts')).href);
const { NHAN_MON } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'thuc-don.ts')).href);

/** Playwright của web/; máy không cài thì dùng bản cài chung của máy. */
function napPlaywright() {
  try { return createRequire(join(WEB, 'package.json'))('playwright'); }
  catch { return createRequire('/opt/node-tools/node_modules/')('playwright'); }
}
const { chromium } = napPlaywright();

// ---------------------------------------------------------------------------
// Bộ đếm — cùng kiểu trinh-duyet.mjs và các file test của crm
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
// --chi 1,3: chỉ chạy các nhóm này (nhóm 0 luôn chạy) — để sửa nhanh một chỗ; CI chạy hết.
const iChi = process.argv.indexOf('--chi');
const CHI = iChi > -1 ? new Set(process.argv[iChi + 1].split(',').map(s => s.trim())) : null;
async function nhom(ten, fn) {
  const so = ten.match(/^(\d+)/)?.[1];
  if (CHI && so !== '0' && !CHI.has(so)) return;
  console.log(`\n\x1b[1m${ten}\x1b[0m`);
  try { await fn(); } catch (e) { ok(`${ten} chạy được đến cuối`, false, e.stack || e.message); }
}

// ---------------------------------------------------------------------------
// astro dev với biến môi trường trỏ vào Supabase giả
// ---------------------------------------------------------------------------
async function song(goc) {
  try { return (await fetch(goc, { signal: AbortSignal.timeout(5000) })).ok; } catch { return false; }
}

/**
 * Cấu hình tạm: y hệt astro.config.mjs, cộng hai điều — thư mục cache Vite riêng (không
 * giành node_modules/.vite với một astro dev khác đang chạy trên máy) và tắt thanh công
 * cụ dev (nó không có trên trang thật, chỉ thêm lỗi console không liên quan).
 */
function taoCauHinhTam() {
  const thuMuc = mkdtempSync(join(tmpdir(), 'beeftown-thu-day-du-'));
  const tep = join(thuMuc, 'astro.config.mjs');
  writeFileSync(tep, `import goc from ${JSON.stringify(pathToFileURL(join(WEB, 'astro.config.mjs')).href)};
export default { ...goc, devToolbar: { enabled: false }, vite: { ...(goc.vite ?? {}), cacheDir: ${JSON.stringify(join(thuMuc, 'vite'))} } };
`);
  return { thuMuc, tep };
}

/** File .env nào trong web/ có khai PUBLIC_SUPABASE_URL — để báo khi biến môi trường không thắng. */
function envCoSupabase() {
  return ['.env', '.env.local', '.env.development', '.env.development.local']
    .filter(f => existsSync(join(WEB, f)) && /^\s*PUBLIC_SUPABASE_URL\s*=/m.test(readFileSync(join(WEB, f), 'utf8')));
}

async function batAstro(gocGia) {
  const goc = `http://127.0.0.1:${CONG_WEB}`;
  if (await song(goc)) throw new Error(`Cổng ${CONG_WEB} đang bận — tắt máy chủ cũ rồi chạy lại`);
  const cauHinh = taoCauHinhTam();
  const nhatKy = [];
  // --ignore-lock: chạy tiền cảnh, không đụng khóa .astro/dev.json của astro dev khác trên máy
  // (Astro 7 tự chuyển sang chạy ngầm khi đoán là bị máy gọi, và lúc đó không tắt được bằng kill).
  // --config: Astro ghép đường dẫn này vào sau thư mục gốc (path.join), nên phải là đường dẫn tương đối.
  const p = spawn(process.execPath, [join(WEB, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'dev',
    '--port', String(CONG_WEB), '--host', '127.0.0.1', '--ignore-lock', '--config', relative(WEB, cauHinh.tep)], {
    cwd: WEB,
    env: { ...process.env, PUBLIC_SUPABASE_URL: gocGia, PUBLIC_SUPABASE_ANON_KEY: 'khoa-thu' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  for (const s of [p.stdout, p.stderr]) s.on('data', d => { nhatKy.push(String(d)); if (nhatKy.length > 80) nhatKy.shift(); });
  for (let i = 0; i < 120; i++) {
    if (await song(goc)) return { p, goc, cauHinh, nhatKy };
    if (p.exitCode !== null) break;
    await cho(1000);
  }
  tatAstro({ p, cauHinh });
  throw new Error(`astro dev không lên ở cổng ${CONG_WEB}. Nhật ký cuối:\n${nhatKy.join('').slice(-3000)}`);
}

function tatAstro(may) {
  const p = may?.p;
  if (p?.pid && p.exitCode === null) {
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' });
    else { try { process.kill(-p.pid, 'SIGTERM'); } catch { p.kill('SIGTERM'); } }
  }
  if (may?.cauHinh) rmSync(may.cauHinh.thuMuc, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
const TRANG = CAP_DUONG_DAN.flat();
const ngonNguCua = duong => (duong.startsWith('/en') ? 'en' : duong.startsWith('/ko') ? 'ko' : 'vi');
const CHU_DA_NHAN = { vi: /đã nhận/i, en: /received/i, ko: /접수되었/ };
const BAT_KY_DA_NHAN = /đã nhận|received|접수되었/i;
const CHU_THANH_CONG = /thành công|\bsuccess|성공/i;
const DANG_GUI = { vi: 'Đang gửi…', en: 'Sending…', ko: '보내는 중…' };
const KHOA_LUU = 'bt-hoi-ban';
const KHACH = { ho_ten: 'Khách Thử', sdt: '0912345678' };
const thuong = s => s.toLocaleLowerCase('vi');
const tenTep = duong => duong.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'goc';

let mayGia = null;
let mayWeb = null;
let trinhDuyet = null;
for (const tin of ['SIGINT', 'SIGTERM']) {
  process.on(tin, async () => { tatAstro(mayWeb); await mayGia?.dong(); process.exit(130); });
}

console.log('\x1b[1m\nBEEFTOWN — TRANG CÔNG KHAI KHI ĐÃ NỐI DATABASE (Supabase giả)\x1b[0m');
console.log('='.repeat(60));
rmSync(ANH_LOI, { recursive: true, force: true });

try {
  mayGia = await batMayGia({ cong: CONG_GIA, kichBan: 'day-du' });
  const coEnv = envCoSupabase();
  if (coEnv.length) console.log(`  (web/${coEnv.join(', web/')} có PUBLIC_SUPABASE_URL — biến môi trường phải thắng; kiểm ngay dưới đây)`);
  console.log('Bật astro dev…');
  mayWeb = await batAstro(mayGia.goc);
  const goc = mayWeb.goc;
  console.log(`Trang: ${goc}`);

  // Lần tải đầu của mỗi trang, Vite còn tối ưu thư viện và có thể trả lỗi giữa chừng:
  // tải mỗi trang tới khi được 200 rồi mới bắt đầu đếm.
  for (const duong of TRANG) {
    for (let lan = 0; lan < 5 && !(await song(goc + duong)); lan++) await cho(1500);
  }

  // =========================================================================
  await nhom('0 · BIẾN MÔI TRƯỜNG TỚI ĐƯỢC TRANG', async () => {
    mayGia.datKichBan('day-du');
    await fetch(goc + '/');
    const dem = mayGia.dem();
    if (!ok('PUBLIC_SUPABASE_URL của lệnh chạy thắng web/.env: trang chủ gọi noi_dung_cong_khai của Supabase giả',
            (dem.noi_dung_cong_khai ?? 0) >= 1,
            `server giả không nhận lượt gọi nào${coEnv.length ? ` — web/${coEnv.join(', web/')} đang thắng biến môi trường` : ''}`)) {
      throw new Error('Trang không nói chuyện với Supabase giả — mọi kiểm tra sau đều vô nghĩa');
    }
  });
  if (hong) throw new Error('dừng');

  trinhDuyet = await chromium.launch();
  const ctx = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const chupLoi = async ten => {
    mkdirSync(ANH_LOI, { recursive: true });
    await page.screenshot({ path: join(ANH_LOI, `${ten.replace(/[^a-z0-9-]+/gi, '_')}.png`), fullPage: true }).catch(() => {});
  };
  const chuTrang = async (chon = 'body') => (await page.locator(chon).first().innerText().catch(() => '')) ?? '';
  const nutChinhMoDau = () => page.evaluate(() => {
    const a = document.querySelector('main a.nut.nut-chinh');
    return a ? { chu: a.textContent.trim().replace(/\s+/g, ' '), duong: new URL(a.href).pathname } : null;
  });

  /** Điền form hỏi bàn như khách: bấm chọn giờ, chọn số người, gõ họ tên và số điện thoại. */
  async function dienForm() {
    const nhan = page.locator('form[data-hoi-ban] label:has(input[name="gio"]:not([disabled]))').first();
    if (await nhan.count()) await nhan.click();
    else await page.locator('form[data-hoi-ban] input[name="gio"]:not([disabled])').first().check({ force: true });
    const soKhach = page.locator('form[data-hoi-ban] select[name="so_khach"]');
    if (await soKhach.count()) await soKhach.selectOption('2');
    await page.fill('form[data-hoi-ban] [name="ho_ten"]', KHACH.ho_ten);
    await page.fill('form[data-hoi-ban] [name="sdt"]', KHACH.sdt);
  }
  const nutGui = () => page.locator('form[data-hoi-ban] [type="submit"]').first();

  /** Gửi form (bấm một lần hoặc bấm đúp) và chờ trang sau khi gửi tải xong. */
  async function gui({ dup = false } = {}) {
    const sau = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
    if (dup) await nutGui().dblclick();
    else await nutGui().click();
    await sau;
    await page.waitForLoadState('networkidle').catch(() => {});
    await cho(300);
  }

  // =========================================================================
  await nhom('1 · ĐÃ CÔNG BỐ ĐỦ (day-du): NÚT, LIÊN KẾT, THỰC ĐƠN, FORM', async () => {
    mayGia.datKichBan('day-du');
    for (const nn of NGON_NGU) {
      const t = chu(nn);
      const trangChu = duongDanTuongUng('/', nn);
      await page.goto(goc + trangChu, { waitUntil: 'load' });
      const nut = await nutChinhMoDau();
      const tot = [
        ok(`${trangChu}: nút chính màn đầu là "${t.datBan}" và dẫn tới ${duongDanTuongUng('/dat-ban', nn)}`,
           nut?.chu === t.datBan && nut?.duong === duongDanTuongUng('/dat-ban', nn), JSON.stringify(nut)),
        ok(`${trangChu}: có link Facebook đã công bố`,
           await page.locator(`a[href="${LIEN_HE_THU.facebook_url}"]`).count() > 0),
        ok(`${trangChu}: có nút "${t.chiDuong}" dẫn tới Maps đã công bố`,
           await page.locator(`a[href="${LIEN_HE_THU.google_maps_url}"]`).filter({ hasText: t.chiDuong }).count() > 0),
      ];
      if (tot.includes(false)) await chupLoi(`day-du${trangChu}`);

      const thucDon = duongDanTuongUng('/thuc-don', nn);
      await page.goto(goc + thucDon, { waitUntil: 'load' });
      // Có JavaScript thì ba phần là ba tab — chữ của tab chưa mở không hiện (innerText không
      // có). Bấm lần lượt từng tab như khách rồi gom chữ đã hiện.
      let chu_ = await chuTrang();
      const soTab = await page.locator('main [role="tab"]').count();
      for (let i = 0; i < soTab; i++) {
        await page.locator('main [role="tab"]').nth(i).click();
        chu_ += '\n' + await chuTrang('main');
      }
      // Chữ ẩn cũng không được có số tiền: đọc cả DOM (bỏ script, style).
      const chuDom = await page.evaluate(() => {
        const b = document.body.cloneNode(true);
        b.querySelectorAll('script, style, template').forEach(x => x.remove());
        return b.textContent;
      });
      const thieuMon = MON_MAU.filter(m => !chu_.includes(m.ten[nn])).map(m => m.ten[nn]);
      const f03 = MON_MAU.find(m => m.laMonSong);
      const cam = timChuoiCam(chu_ + '\n' + chuDom);
      const tot2 = [
        ok(`${thucDon}: hiện đủ tên món mẫu (bấm qua ${soTab} tab)`, thieuMon.length === 0, `thiếu: ${thieuMon.join(', ')}`),
        // innerText trả chữ ĐÃ qua text-transform (nhãn in hoa) — so không phân biệt hoa thường.
        ok(`${thucDon}: nhãn "${NHAN_MON.monSong[nn]}" kèm câu cảnh báo của món sống`,
           thuong(chu_).includes(thuong(NHAN_MON.monSong[nn])) && chu_.includes(f03.canhBao[nn])),
        ok(`${thucDon}: nhãn "${NHAN_MON.coCon[nn]}"`, thuong(chu_).includes(thuong(NHAN_MON.coCon[nn]))),
        ok(`${thucDon}: KHÔNG một số tiền nào, không chữ cấm (timChuoiCam)`, cam.length === 0,
           cam.map(c => c.tim_thay).join(' · ')),
        ok(`${thucDon}: không có phần tử giá (.mon-gia) — mọi món đều chưa duyệt giá`,
           await page.locator('.mon-gia').count() === 0),
        ok(`${thucDon}: không có chữ "chờ duyệt"`, !/chờ duyệt|pending approval|승인\s?대기/i.test(chu_ + chuDom)),
      ];
      if (tot2.includes(false)) await chupLoi(`day-du${thucDon}`);

      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      const soGio = await page.locator('form[data-hoi-ban] input[type="radio"][name="gio"]').count();
      if (!ok(`${hoiBan}: có form hỏi bàn với khung giờ để chọn`,
              await page.locator('form[data-hoi-ban]').count() === 1 && soGio > 0, `${soGio} khung giờ`)) {
        await chupLoi(`day-du${hoiBan}`);
      }
    }
  });

  // =========================================================================
  await nhom('2 · BẤM HAI LẦN "GỬI YÊU CẦU" → ĐÚNG MỘT YÊU CẦU, TRANG SAU NÓI "ĐÃ NHẬN"', async () => {
    // Database trả lời chậm (1,5 giây — như mạng 4G): lượt gửi đầu còn đang chạy ở máy chủ thì
    // khách bấm lần nữa. Không có gì chặn thì trình duyệt bỏ lượt đầu, gửi lượt hai — và máy chủ
    // nhận CẢ HAI. Bấm bằng chuột thật tại chỗ cái nút (không qua locator), nên nút đã khóa
    // hay chưa thì cú bấm vẫn tới — đúng như ngón tay khách.
    for (const nn of NGON_NGU) {
      for (const cach of ['bấm đúp', 'bấm lần hai sau 0,3 giây']) {
        const hoiBan = duongDanTuongUng('/dat-ban', nn);
        mayGia.datKichBan('day-du', { cham: 1500 });
        await page.goto(goc + hoiBan, { waitUntil: 'load' });
        await dienForm();
        await nutGui().scrollIntoViewIfNeeded();
        const hop = await nutGui().boundingBox();
        const [x, y] = [hop.x + hop.width / 2, hop.y + hop.height / 2];
        const sau = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
        if (cach === 'bấm đúp') await page.mouse.dblclick(x, y);
        else await page.mouse.click(x, y);
        // Đọc nút NGAY: khi lượt gửi đã lên đường, Chromium giữ mọi evaluate tới lúc trang mới tới.
        const nut = await page.evaluate(() => {
          const b = document.querySelector('form[data-hoi-ban] [type="submit"]');
          return b && { tat: b.disabled, ban: b.getAttribute('aria-busy'), chu: b.textContent.trim() };
        }).catch(e => ({ loi: e.message.slice(0, 160) }));
        if (cach !== 'bấm đúp') { await cho(300); await page.mouse.click(x, y); }
        await sau;
        await page.waitForLoadState('networkidle').catch(() => {});
        await cho(1000);   // lượt thứ hai (nếu lọt) cần thêm chừng ấy để tới database

        const dem = mayGia.dem().tao_dat_ban ?? 0;
        const chu_ = await chuTrang();
        const nhan = `${hoiBan} (${cach})`;
        const tot = [
          ok(`${nhan}: đang gửi thì nút bị khóa, aria-busy="true", chữ "${DANG_GUI[nn]}"`,
             nut?.tat === true && nut?.ban === 'true' && nut?.chu.includes(DANG_GUI[nn]), JSON.stringify(nut)),
          ok(`${nhan}: tao_dat_ban được gọi ĐÚNG MỘT lần`, dem === 1, `${dem} lần`),
          ok(`${nhan}: trang sau khi gửi có khung "đã nhận"`,
             await page.locator('[data-ket-qua="da-nhan"]').count() === 1 && CHU_DA_NHAN[nn].test(chu_), chu_.slice(0, 200)),
          ok(`${nhan}: không có chữ "thành công"/"success"/"성공", không chữ cấm`,
             !CHU_THANH_CONG.test(chu_) && timChuoiCam(chu_).length === 0, chu_.match(CHU_THANH_CONG)?.[0]),
          ok(`${nhan}: tiêu điểm ở khung "đã nhận"`,
             await page.evaluate(() => document.activeElement?.getAttribute('data-ket-qua')) === 'da-nhan'),
          ok(`${nhan}: đã nhận thì bản lưu tạm (sessionStorage) bị xóa`,
             await page.evaluate(k => sessionStorage.getItem(k), KHOA_LUU) === null),
        ];
        if (tot.includes(false)) await chupLoi(`bam-hai-lan${hoiBan}-${cach === 'bấm đúp' ? 'dup' : 'cach'}`);
      }
    }
  });

  // =========================================================================
  await nhom('3 · DATABASE 500 / MẠNG ĐỨT: KHÔNG BAO GIỜ "ĐÃ NHẬN", Ô ĐÃ GÕ ĐƯỢC ĐIỀN LẠI', async () => {
    for (const kichBan of ['dat-ban-500', 'dat-ban-dut']) {
      for (const nn of NGON_NGU) {
        const hoiBan = duongDanTuongUng('/dat-ban', nn);
        mayGia.datKichBan(kichBan);
        await page.goto(goc + hoiBan, { waitUntil: 'load' });
        await dienForm();
        await gui();
        const chu_ = await chuTrang();
        const o = await page.evaluate(() => ({
          ho_ten: document.querySelector('form[data-hoi-ban] [name="ho_ten"]')?.value ?? null,
          sdt: document.querySelector('form[data-hoi-ban] [name="sdt"]')?.value ?? null,
        }));
        const luu = await page.evaluate(k => { try { return JSON.parse(sessionStorage.getItem(k) ?? 'null'); } catch { return 'hỏng'; } }, KHOA_LUU);
        const nhan = `${kichBan} ${hoiBan}`;
        const tot = [
          ok(`${nhan}: KHÔNG có "đã nhận" / "received" / "접수되었"`,
             !BAT_KY_DA_NHAN.test(chu_) && await page.locator('[data-ket-qua="da-nhan"]').count() === 0,
             chu_.match(BAT_KY_DA_NHAN)?.[0]),
          ok(`${nhan}: không có chữ "thành công"/"success"/"성공"`, !CHU_THANH_CONG.test(chu_), chu_.match(CHU_THANH_CONG)?.[0]),
          ok(`${nhan}: có khung lỗi (role="alert")`, await page.locator('[role="alert"][data-ket-qua="loi"]').count() === 1),
          ok(`${nhan}: tiêu điểm ở khung lỗi`,
             await page.evaluate(() => document.activeElement?.getAttribute('data-ket-qua')) === 'loi'),
          ok(`${nhan}: họ tên và số điện thoại đã gõ được điền lại`,
             o.ho_ten === KHACH.ho_ten && o.sdt === KHACH.sdt, JSON.stringify(o)),
          ok(`${nhan}: bản lưu tạm không giữ ô đồng ý nhận tin`,
             !!luu && typeof luu === 'object' && !Object.keys(luu).some(k => /dong_y/.test(k)), JSON.stringify(luu)),
          ok(`${nhan}: gửi một lần → tao_dat_ban một lần (không tự gửi lại)`, (mayGia.dem().tao_dat_ban ?? 0) === 1,
             `${mayGia.dem().tao_dat_ban ?? 0} lần`),
        ];
        if (tot.includes(false)) await chupLoi(`${kichBan}${hoiBan}`);
      }
    }

    for (const nn of NGON_NGU) {
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      mayGia.datKichBan('dat-ban-loi');
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      await dienForm();
      await gui();
      const khung = await chuTrang('[data-ket-qua="loi"]');
      const cau = nn === 'vi' ? 'đã hết bàn'
        : cauLoiDatabase('Khung giờ 18:00:00 ngày 2030-01-01 đã hết bàn', nn, '(câu chung)');
      const tot = [
        ok(`dat-ban-loi ${hoiBan}: câu từ chối của database hiện trong khung lỗi, đúng thứ tiếng ("${cau}")`,
           khung.includes(cau), khung.slice(0, 200)),
        ok(`dat-ban-loi ${hoiBan}: KHÔNG có "đã nhận"`, !BAT_KY_DA_NHAN.test(await chuTrang())),
      ];
      if (tot.includes(false)) await chupLoi(`dat-ban-loi${hoiBan}`);
    }
  });

  // =========================================================================
  await nhom('4 · NỐI DATABASE NHƯNG CHƯA CÔNG BỐ GÌ (rong) · FORM ĐANG TẮT (dat-ban-dong)', async () => {
    mayGia.datKichBan('rong');
    for (const nn of NGON_NGU) {
      const t = chu(nn);
      const trangChu = duongDanTuongUng('/', nn);
      await page.goto(goc + trangChu, { waitUntil: 'load' });
      const nut = await nutChinhMoDau();
      const tot = [
        ok(`rong ${trangChu}: nút chính màn đầu là "${t.khamPhaThucDon}"`,
           nut?.chu === t.khamPhaThucDon && nut?.duong === duongDanTuongUng('/thuc-don', nn), JSON.stringify(nut)),
        ok(`rong ${trangChu}: không có nút / link Facebook`, await page.locator('a[href*="facebook.com"]').count() === 0),
        ok(`rong ${trangChu}: không có nút "${t.chiDuong}"`,
           await page.locator('a').filter({ hasText: new RegExp(`^\\s*${t.chiDuong}\\s*$`) }).count() === 0
             && await page.locator('a[href*="maps."]').count() === 0),
      ];
      if (tot.includes(false)) await chupLoi(`rong${trangChu}`);
    }

    mayGia.datKichBan('dat-ban-dong');
    for (const nn of NGON_NGU) {
      const t = chu(nn);
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      const chu_ = await chuTrang();
      const tot = [
        ok(`dat-ban-dong ${hoiBan}: không có form hỏi bàn`, await page.locator('form[data-hoi-ban]').count() === 0),
        ok(`dat-ban-dong ${hoiBan}: chỉ sang Facebook đã công bố`,
           /facebook/i.test(chu_) && await page.locator(`main a[href="${LIEN_HE_THU.facebook_url}"]`).count() > 0),
      ];
      const trangChu = duongDanTuongUng('/', nn);
      await page.goto(goc + trangChu, { waitUntil: 'load' });
      const nut = await nutChinhMoDau();
      tot.push(ok(`dat-ban-dong ${trangChu}: nút chính "${t.khamPhaThucDon}", "${t.datBan}" lùi xuống nút phụ (vẫn có kênh để hỏi)`,
        nut?.chu === t.khamPhaThucDon
          && await page.locator(`main a.nut.nut-vien[href="${duongDanTuongUng('/dat-ban', nn)}"]`).count() > 0,
        JSON.stringify(nut)));
      if (tot.includes(false)) await chupLoi(`dat-ban-dong${hoiBan}`);
    }
  });

  // =========================================================================
  await nhom(`5 · ${TRANG.length} TRANG × 3 KỊCH BẢN Ở 360 VÀ 1440 PX`, async () => {
    for (const kichBan of ['rong', 'day-du', 'dat-ban-dong']) {
      mayGia.datKichBan(kichBan);
      for (const rong of [360, 1440]) {
        const c = await trinhDuyet.newContext({ viewport: { width: rong, height: rong < 600 ? 740 : 900 } });
        for (const duong of TRANG) {
          const p = await c.newPage();
          const loiJs = [];
          p.on('pageerror', e => loiJs.push(e.message));
          p.on('console', m => { if (m.type() === 'error' && (m.location().url || goc).startsWith(goc)) loiJs.push(m.text()); });
          const r = await p.goto(goc + duong, { waitUntil: 'load', timeout: 60000 });
          const kq = await p.evaluate(() => ({ rong: document.documentElement.scrollWidth, khung: innerWidth }));
          const nhan = `${kichBan} ${duong} · ${rong}px`;
          const tot = [
            ok(`${nhan}: HTTP 200`, r?.status() === 200, `HTTP ${r?.status()}`),
            ok(`${nhan}: không tràn ngang`, kq.rong <= kq.khung + 1, `rộng ${kq.rong}px > khung ${kq.khung}px`),
            ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | ')),
          ];
          if (tot.includes(false)) {
            mkdirSync(ANH_LOI, { recursive: true });
            await p.screenshot({ path: join(ANH_LOI, `${kichBan}-${tenTep(duong)}-${rong}.png`), fullPage: true }).catch(() => {});
          }
          await p.close();
        }
        await c.close();
      }
    }
  });

  // =========================================================================
  if (CHUP) {
    await nhom('6 · CHỤP ẢNH TOÀN TRANG (--chup) → kiem-tra/anh-chup/', async () => {
      const CO = [360, 390, 768, 1024, 1440];
      let so = 0;
      const chupToanTrang = async (p, tep) => {
        // Cuộn hết trang cho ảnh lazy tải, rồi về đầu trang mới chụp.
        await p.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
          scrollTo(0, 0);
        });
        await p.waitForLoadState('networkidle').catch(() => {});
        await p.screenshot({ path: tep, fullPage: true });
        so++;
      };
      for (const kichBan of ['rong', 'day-du']) {
        const thuMuc = join(ANH_CHUP, kichBan);
        rmSync(thuMuc, { recursive: true, force: true });
        mkdirSync(thuMuc, { recursive: true });
        for (const rong of CO) {
          const c = await trinhDuyet.newContext({ viewport: { width: rong, height: rong < 600 ? 800 : 900 } });
          const p = await c.newPage();
          for (const duong of TRANG) {
            mayGia.datKichBan(kichBan);
            await p.goto(goc + duong, { waitUntil: 'load', timeout: 60000 });
            await chupToanTrang(p, join(thuMuc, `${tenTep(duong)}-${rong}.png`));
          }
          await c.close();
          // Hai trạng thái chỉ có sau khi gửi form: đã nhận, và máy chủ lỗi. dienForm / gui
          // làm việc trên trang chính, nên đổi cỡ trang chính rồi chụp trên đó.
          if (kichBan === 'day-du') {
            await page.setViewportSize({ width: rong, height: rong < 600 ? 800 : 900 });
            for (const [kb, duoi] of [['day-du', 'da-nhan'], ['dat-ban-500', 'loi-may-chu']]) {
              for (const nn of NGON_NGU) {
                const hoiBan = duongDanTuongUng('/dat-ban', nn);
                mayGia.datKichBan(kb);
                await page.goto(goc + hoiBan, { waitUntil: 'load' });
                await dienForm();
                await gui();
                await chupToanTrang(page, join(thuMuc, `${tenTep(hoiBan)}-${duoi}-${rong}.png`));
              }
            }
          }
        }
      }
      ok(`Đã chụp ${so} ảnh vào ${ANH_CHUP}`, so > 0);
    });
  }

  await ctx.close();
} catch (e) {
  if (e.message !== 'dừng') ok('Chạy được đến cuối', false, e.stack || e.message);
} finally {
  await trinhDuyet?.close().catch(() => {});
  tatAstro(mayWeb);
  await mayGia?.dong();
}

console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA TRẠNG THÁI ĐẦY ĐỦ ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  for (const l of loi) console.log(`  \x1b[31m· ${l}\x1b[0m`);
  if (existsSync(ANH_LOI)) console.log(`Ảnh chụp lúc hỏng: ${ANH_LOI}`);
  if (mayWeb?.nhatKy?.length) console.log(`\nNhật ký astro dev (cuối):\n${mayWeb.nhatKy.join('').slice(-2000)}`);
}
process.exit(hong === 0 ? 0 : 1);
