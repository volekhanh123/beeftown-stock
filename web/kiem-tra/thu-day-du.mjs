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
 *      khung giờ, meta description / og:description là câu "gửi yêu cầu, nhà hàng gọi
 *      lại" (chu.ts moTaHoiBan) và đoạn mở đầu nói nhà hàng gọi lại.
 *   2. Bấm đúp "Gửi yêu cầu" → tao_dat_ban được gọi ĐÚNG MỘT lần; trang sau nói "đã
 *      nhận", không bao giờ "thành công".
 *   3. Database trả 500 hoặc mạng đứt giữa chừng → KHÔNG BAO GIỜ "đã nhận"; có khung
 *      lỗi; họ tên và số điện thoại khách đã gõ được điền lại. Database từ chối (hết
 *      bàn) → câu của database hiện ra, đúng thứ tiếng.
 *   4. rong (nối database, chưa công bố gì): không nút Facebook, không Chỉ đường; nút
 *      chính màn đầu là "Khám phá thực đơn". dat-ban-dong (form tắt): /dat-ban không có
 *      form; meta description / og:description là câu "chưa mở" (chu.ts moTaHoiBanChuaMo),
 *      cả mô tả lẫn đoạn mở đầu không hứa "gửi yêu cầu, nhà hàng gọi lại" (kiểm site thật
 *      07/10/2026). dat-ban-sap (database sập giữa lượt gửi, trang sau không dựng được form):
 *      khung "KHÔNG CHẮC đã ghi" hiện, và cả trang không nói "bạn chưa gửi được" hay "chưa mở hỏi
 *      bàn trực tuyến" — câu đó cãi khung lỗi, khách tin là chưa gửi và gửi lại thành hai bản.
 *   5. Mọi trang công khai × (rong, day-du, dat-ban-dong) ở 360 và 1440 px: HTTP 200,
 *      không tràn ngang, không lỗi JavaScript; thành phần và khung trang đúng quy tắc
 *      của đợt redesign (phép đo ở do-giao-dien.mjs — cùng bộ với trinh-duyet.mjs, nhưng
 *      ở đây trang có form, nút Chỉ đường, kênh liên hệ).
 *   7. dia-chi-cong-bo (khóa dia_chi_hien_thi đã công bố trong /noi-bo): bản công bố thay
 *      địa chỉ cố định trong mã ở MỌI chỗ in địa chỉ nhà hàng — khối địa chỉ, chân trang,
 *      câu hỏi thường gặp, bước 1 của trang Đến Beeftown, menu gọn, JSON-LD; màn đầu trang
 *      chủ in bản đó và bỏ vế phường; dòng pháp nhân không đổi. Về lại kịch bản chưa công
 *      bố địa chỉ thì trang in lại địa chỉ cố định.
 *   8. Form hỏi bàn (day-du) và form nộp hồ sơ (tuyen-dung-mo) ở 390 và 1440 px: ô một
 *      dòng (kể cả ô ngày) cao đúng 48px, ô nhiều dòng ≥ 48px, chữ 16px, nền trắng, viền
 *      #767676; nhãn 14–16px đặt trên ô, không placeholder; thẻ form nền xám nhạt #F4F4F4;
 *      ô giờ đang chọn nền đỏ chữ trắng; gửi thiếu thì có câu lỗi bằng chữ màu #8F0000 và
 *      tiêu điểm vào ô sai.
 *   9. Form nộp hồ sơ (tuyen-dung-mo / -dut / -loi): bấm đúp khi database chậm → nop_ho_so_ung_tuyen
 *      đúng một lần, nút khóa "Đang gửi…"; mạng đứt → khung "KHÔNG CHẮC", không form, không nút mời
 *      nộp; database từ chối → câu của database, quay về ?vi_tri=<mã>, chữ đã gõ được điền lại, ô đồng
 *      ý không tích sẵn; file CV quá 5MB → câu lỗi sát ô, không gửi.
 *  10. Màn đầu trang chủ ở ba trạng thái của khóa ngay_khai_truong — chưa có ngày (day-du), sắp
 *       mở (sap-mo: "Đón bạn từ …"), đã mở (da-mo: "Mở cửa từ …"), hai trạng thái sau kèm dòng
 *       trạng thái dài hai câu — × vi/en/ko × 390, 900, 1024, 1440 px: câu chỉ đường dính ngay
 *       dưới dòng địa chỉ, ngày nằm trên một dòng, không ô nào tràn khung, không cuộn ngang.
 *  11. Trang Thực đơn theo cuốn menu bản sáng (day-du = danh mục 11/10/2026 đã công bố) ở 320 → 1440 px
 *       (vi; en, ko ở 390 và 1440): bấm từng tab, mọi món của dữ liệu giả hiện đúng tên ở đúng phần;
 *       món có ảnh (ANH_CUA_MON) thì ảnh có alt đúng thứ tiếng và nhãn "Ảnh minh họa"; món sống kèm câu
 *       cảnh báo; câu dưới tên nhóm đúng chữ; không số tiền, không phần tử giá; không cuộn ngang; đủ mười
 *       bốn phép đo của do-giao-dien.mjs trên từng tab. khong-con-tat (công tắc đồ uống có cồn tắt): ba ly
 *       signature, nhãn Có cồn, dòng luật rượu đều không hiện. thuc-don-thu-suc: món không ảnh, tên và mô tả
 *       rất dài, nhóm lạ chưa có câu, nhóm đồ uống dạng danh sách — không tràn, vẫn đạt mọi phép đo.
 *       day-du chỉ có ba ly signature (có cồn) ở phần Đồ uống: tên ba nhóm không cồn phải đứng đầu cột
 *       thực đơn, cạnh ảnh ba ly không cồn; có món không cồn thì không có danh sách đó.
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
import { batMayGia, LIEN_HE_THU, MON_MAU, MON_THU_SUC, DIA_CHI_CONG_BO_THU, NGAY_DA_MO_THU, TRANG_THAI_THU, ngaySapMoThu } from './gia-supabase.mjs';
import { timChuoiCam } from '../src/lib/chuoi-cam.js';
import { doGiaoDien, PHEP_DO } from './do-giao-dien.mjs';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const ANH_LOI = join(WEB, 'kiem-tra', 'anh-loi', 'day-du');
const ANH_CHUP = join(WEB, 'kiem-tra', 'anh-chup');
const CONG_GIA = 54331;
const CONG_WEB = 4353;
const CHUP = process.argv.includes('--chup');

// Câu chữ đọc từ chính thư viện của trang (Node ≥ 22.18 đọc thẳng .ts) — đổi chữ ở lib
// thì phép thử đổi theo, không phải chép tay hai nơi.
const { CAP_DUONG_DAN, NGON_NGU, chu, duongDanTuongUng, cauLoiDatabase, DIA_CHI_NHA_HANG, PHAP_NHAN } =
  await import(pathToFileURL(join(WEB, 'src', 'lib', 'chu.ts')).href);
const { NHAN_MON, CAU_NHOM } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'thuc-don.ts')).href);
const { ANH_CUA_MON, DANH_MUC_ANH } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'anh.ts')).href);
const { congNgay, homNayVn } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'gio-vn.ts')).href);
const { dinhDangNgay } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'noi-dung.ts')).href);

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
// "접수되었는지 … 알 수 없어요" (KHÔNG CHẮC đã nhận chưa — lib/xu-ly-form.ts) là câu đúng khi mạng đứt,
// không phải lời báo đã nhận: loại nó ra khỏi mẫu tiếng Hàn.
const CHU_DA_NHAN = { vi: /đã nhận/i, en: /\breceived\b/i, ko: /접수되었(?!는지)/ };
const BAT_KY_DA_NHAN = /đã nhận|\breceived\b|접수되었(?!는지)/i;
const CHU_THANH_CONG = /thành công|\bsuccess|성공/i;
// Lời hứa của form hỏi bàn: gửi yêu cầu trên trang, nhà hàng gọi lại — chép tay, như
// crm/test/test-cong-khai-hoi-ban-dong.mjs. Form đóng thì mô tả và đoạn mở đầu không được nói câu này.
const HUA_FORM = { vi: /gọi lại|gửi yêu cầu/i, en: /call you back|(?<!cannot )send (?:a|your)(?: table)? request/i, ko: /전화드려요|전화로 안내|문의를 보내 주세요/ };
const HUA_GOI_LAI = { vi: /gọi lại/i, en: /call you back/i, ko: /전화드려요|전화로 안내/ };
// "Bạn chưa gửi được yêu cầu", "chưa mở hỏi bàn trực tuyến" — đúng khi database đã từ chối, sai khi
// KHÔNG CHẮC đã ghi (nhóm 4). Gồm cả cách nói "không gửi được" khác của trang (CAU_DAT_BAN.chuaGhi…).
const CHUA_GUI_DUOC = {
  vi: /chưa gửi được|không gửi được|chưa mở hỏi bàn/i,
  en: /cannot send|could not (?:be )?sen[dt]|not open yet/i,
  ko: /보낼 수 없어요|보내지 못했어요|받지 않아요/,
};
const DANG_GUI = { vi: 'Đang gửi…', en: 'Sending…', ko: '보내는 중…' };
const KHOA_LUU = 'bt-hoi-ban';
const KHOA_NUT = 'thu-day-du-nut-gui';   // nhóm 2: trạng thái nút lúc vừa gửi, giữ qua lần chuyển trang
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
  const moTaTrang = () => page.evaluate(() => ({
    moTa: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    og: document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '',
    dan: document.querySelector('main p.dan')?.textContent?.trim() ?? '',
  }));
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
      const mt = await moTaTrang();
      ok(`${hoiBan}: form mở → meta description và og:description là câu "gửi yêu cầu, nhà hàng gọi lại" (moTaHoiBan)`,
         !!chu(nn).moTaHoiBan && mt.moTa === chu(nn).moTaHoiBan && mt.og === chu(nn).moTaHoiBan, `«${mt.moTa}»`);
      ok(`${hoiBan}: form mở → đoạn mở đầu nói nhà hàng gọi lại`, HUA_GOI_LAI[nn].test(mt.dan), `«${mt.dan}»`);
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
        // Trạng thái nút NGAY sau khi trang xử lý lượt submit đầu: một listener gắn SAU script của
        // trang (nên chạy sau nó, cùng nhịp) chép lại vào sessionStorage — còn nguyên qua lần chuyển
        // trang. Đọc bằng evaluate sau cú bấm thì đua với lần chuyển trang: Chromium giữ evaluate tới
        // khi trang mới tới, ngữ cảnh cũ mất, phép thử hỏng mà nút chẳng sai gì.
        await page.evaluate(k => {
          sessionStorage.removeItem(k);
          document.querySelector('form[data-hoi-ban]')?.addEventListener('submit', () => {
            if (sessionStorage.getItem(k)) return;   // chỉ lượt đầu
            const b = document.querySelector('form[data-hoi-ban] [type="submit"]');
            sessionStorage.setItem(k, JSON.stringify(b && { tat: b.disabled, ban: b.getAttribute('aria-busy'), chu: b.textContent.trim() }));
          });
        }, KHOA_NUT);
        const sau = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
        if (cach === 'bấm đúp') await page.mouse.dblclick(x, y);
        else { await page.mouse.click(x, y); await cho(300); await page.mouse.click(x, y); }
        await sau;
        const nut = await page.evaluate(k => {
          const v = sessionStorage.getItem(k);
          sessionStorage.removeItem(k);
          try { return JSON.parse(v ?? 'null'); } catch { return { loi: v }; }
        }, KHOA_NUT);
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
  await nhom('3 · DATABASE 500 / MẠNG ĐỨT: KHÔNG BAO GIỜ "ĐÃ NHẬN"; 500 ĐIỀN LẠI Ô, KHÔNG CHẮC THÌ KHÔNG', async () => {
    for (const kichBan of ['dat-ban-500', 'dat-ban-dut']) {
      // 500 có mã lỗi của database (XX000): giao dịch đã hủy, "chưa ghi" là đúng — điền lại ô để khách gửi lại.
      // Mạng đứt: KHÔNG CHẮC đã ghi chưa (lib/xu-ly-form.ts) — câu bảo khách nhắn hỏi, đừng gửi lại; điền sẵn
      // mọi ô (cả giờ) thì gửi lại chỉ còn một cú bấm và nhà hàng nhận hai bản. Nên xóa bản lưu, ô để trống.
      const khongChac = kichBan === 'dat-ban-dut';
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
          gio: document.querySelector('form[data-hoi-ban] input[name="gio"]:checked')?.value ?? null,
        }));
        const luu = await page.evaluate(k => { try { return JSON.parse(sessionStorage.getItem(k) ?? 'null'); } catch { return 'hỏng'; } }, KHOA_LUU);
        const nhan = `${kichBan} ${hoiBan}`;
        const tot = [
          ok(`${nhan}: KHÔNG có "đã nhận" / "received" / "접수되었"`,
             !BAT_KY_DA_NHAN.test(chu_) && await page.locator('[data-ket-qua="da-nhan"]').count() === 0,
             chu_.match(BAT_KY_DA_NHAN)?.[0]),
          ok(`${nhan}: không có chữ "thành công"/"success"/"성공"`, !CHU_THANH_CONG.test(chu_), chu_.match(CHU_THANH_CONG)?.[0]),
          ok(`${nhan}: có khung lỗi (role="alert", data-ket-qua="${khongChac ? 'khong-chac' : 'loi'}")`,
             await page.locator(`[role="alert"][data-ket-qua="${khongChac ? 'khong-chac' : 'loi'}"]`).count() === 1),
          ok(`${nhan}: tiêu điểm ở khung lỗi`,
             await page.evaluate(() => document.activeElement?.getAttribute('data-ket-qua')) === (khongChac ? 'khong-chac' : 'loi')),
          ...(khongChac ? [
            ok(`${nhan}: KHÔNG CHẮC đã ghi → không điền lại họ tên, số điện thoại, giờ (gửi lại không còn là một cú bấm)`,
               !o.ho_ten && !o.sdt && !o.gio, JSON.stringify(o)),
            ok(`${nhan}: KHÔNG CHẮC đã ghi → bản lưu tạm bị xóa`, luu === null, JSON.stringify(luu)),
          ] : [
            ok(`${nhan}: họ tên và số điện thoại đã gõ được điền lại`,
               o.ho_ten === KHACH.ho_ten && o.sdt === KHACH.sdt, JSON.stringify(o)),
            ok(`${nhan}: bản lưu tạm không giữ ô đồng ý nhận tin`,
               !!luu && typeof luu === 'object' && !Object.keys(luu).some(k => /dong_y/.test(k)), JSON.stringify(luu)),
          ]),
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

    // Đổi ngày: chữ đã gõ đi theo sang ngày mới, nhưng GIỜ thì không — giờ chọn cho ngày cũ mà hiện như đã
    // chọn ở ngày mới thì khách gửi một giờ mình chưa từng chọn cho ngày đó.
    mayGia.datKichBan('day-du');
    for (const nn of NGON_NGU) {
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      await dienForm();
      const homNay = await page.locator('form[data-doi-ngay] input[name="ngay"]').getAttribute('min');
      const ngayMoi = congNgay(homNay, 1);
      await page.fill('form[data-doi-ngay] input[name="ngay"]', ngayMoi);
      const sau = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
      await page.locator('form[data-doi-ngay] [type="submit"]').click();
      await sau;
      await cho(300);
      const o = await page.evaluate(() => ({
        ngay: document.querySelector('form[data-hoi-ban] input[type="hidden"][name="ngay"]')?.value ?? null,
        ho_ten: document.querySelector('form[data-hoi-ban] [name="ho_ten"]')?.value ?? null,
        gio: document.querySelector('form[data-hoi-ban] input[name="gio"]:checked')?.value ?? null,
      }));
      const tot = [
        ok(`đổi ngày ${hoiBan}: trang mới ở ngày ${ngayMoi}`, o.ngay === ngayMoi, JSON.stringify(o)),
        ok(`đổi ngày ${hoiBan}: họ tên đã gõ đi theo sang ngày mới`, o.ho_ten === KHACH.ho_ten, JSON.stringify(o)),
        ok(`đổi ngày ${hoiBan}: giờ chọn ở ngày cũ KHÔNG được chọn sẵn ở ngày mới`, o.gio === null, JSON.stringify(o)),
      ];
      if (tot.includes(false)) await chupLoi(`doi-ngay${hoiBan}`);
    }
  });

  // =========================================================================
  await nhom('4 · NỐI DATABASE NHƯNG CHƯA CÔNG BỐ GÌ (rong) · FORM ĐANG TẮT (dat-ban-dong) · SẬP GIỮA LƯỢT GỬI (dat-ban-sap)', async () => {
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
      const mt = await moTaTrang();
      tot.push(
        ok(`dat-ban-dong ${hoiBan}: meta description và og:description là câu "chưa mở" (moTaHoiBanChuaMo)`,
           !!t.moTaHoiBanChuaMo && mt.moTa === t.moTaHoiBanChuaMo && mt.og === t.moTaHoiBanChuaMo, `«${mt.moTa}»`),
        ok(`dat-ban-dong ${hoiBan}: mô tả không hứa gửi yêu cầu / gọi lại`,
           !HUA_FORM[nn].test(mt.moTa) && !HUA_FORM[nn].test(mt.og), mt.moTa.match(HUA_FORM[nn])?.[0]),
        ok(`dat-ban-dong ${hoiBan}: đoạn mở đầu không hứa gửi yêu cầu / gọi lại`,
           !!mt.dan && !HUA_FORM[nn].test(mt.dan), `«${mt.dan}»`),
      );
      const trangChu = duongDanTuongUng('/', nn);
      await page.goto(goc + trangChu, { waitUntil: 'load' });
      const nut = await nutChinhMoDau();
      tot.push(ok(`dat-ban-dong ${trangChu}: nút chính "${t.khamPhaThucDon}", "${t.datBan}" lùi xuống nút phụ (vẫn có kênh để hỏi)`,
        nut?.chu === t.khamPhaThucDon
          && await page.locator(`main a.nut.nut-vien[href="${duongDanTuongUng('/dat-ban', nn)}"]`).count() > 0,
        JSON.stringify(nut)));
      if (tot.includes(false)) await chupLoi(`dat-ban-dong${hoiBan}`);
    }

    // Form vừa đóng (hay đọc lịch hỏng) đúng lúc khách gửi: câu trả lời cho lượt gửi đó — kể cả "không chắc
    // đã ghi" — vẫn phải hiện, không bị thay im lặng bằng "chưa mở hỏi bàn trực tuyến".
    for (const nn of NGON_NGU) {
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      mayGia.datKichBan('day-du');
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      await dienForm();
      mayGia.datKichBan('dat-ban-dong');
      await gui();
      const { dan } = await moTaTrang();
      const tot = [
        ok(`dat-ban-dong (đóng giữa chừng) ${hoiBan}: khung lỗi của lượt gửi vẫn hiện`,
           await page.locator('[role="alert"][data-ket-qua]').count() === 1),
        ok(`dat-ban-dong (đóng giữa chừng) ${hoiBan}: KHÔNG có "đã nhận"`, !BAT_KY_DA_NHAN.test(await chuTrang())),
        // Database đã từ chối (form đóng) — chưa ghi gì, nên "bạn chưa gửi được", "chưa mở" là đúng.
        ok(`dat-ban-dong (đóng giữa chừng) ${hoiBan}: database đã từ chối → đoạn mở đầu vẫn nói chưa gửi được`,
           CHUA_GUI_DUOC[nn].test(dan), `«${dan}»`),
        ok(`dat-ban-dong (đóng giữa chừng) ${hoiBan}: database đã từ chối → thẻ vẫn có tiêu đề "chưa mở"`,
           await page.locator('.hb-chua-mo h2').count() === 1),
      ];
      if (tot.includes(false)) await chupLoi(`dat-ban-dong-giua-chung${hoiBan}`);
    }

    // Database sập đúng lúc khách gửi: tao_dat_ban không trả lời (KHÔNG CHẮC đã ghi — lib/xu-ly-form.ts),
    // và trang sau khi gửi cũng không đọc được lịch nên hiện thẻ "chưa mở" thay cho form. Khung lỗi bảo
    // "đừng gửi lại, nhắn Facebook để kiểm tra"; câu nào trên trang nói "bạn chưa gửi được" hay "chưa mở
    // hỏi bàn trực tuyến" cũng cãi khung lỗi — khách tin là chưa gửi và hỏi lại, nhà hàng nhận hai bản.
    // Câu đoạn mở đầu chép tay (chép từ code thì sửa code là kiểm thử đổi theo).
    const DAN_KHONG_CHAC = {
      vi: 'Cách liên hệ Beeftown lúc này ở ngay bên dưới.',
      en: 'Here is how to reach Beeftown for now.',
      ko: '지금 Beeftown에 연락하는 방법은 바로 아래에서 확인해 주세요.',
    };
    for (const nn of NGON_NGU) {
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      mayGia.datKichBan('day-du');
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      await dienForm();
      mayGia.datKichBan('dat-ban-sap');
      await gui();
      const { dan } = await moTaTrang();
      const chuMain = await chuTrang('main');
      const tot = [
        ok(`dat-ban-sap ${hoiBan}: trang sau khi gửi không có form (đúng trạng thái thẻ "chưa mở")`,
           await page.locator('form[data-hoi-ban]').count() === 0),
        ok(`dat-ban-sap ${hoiBan}: khung "KHÔNG CHẮC đã ghi" hiện (role="alert", data-ket-qua="khong-chac")`,
           await page.locator('[role="alert"][data-ket-qua="khong-chac"]').count() === 1),
        ok(`dat-ban-sap ${hoiBan}: đoạn mở đầu là câu trung tính «${DAN_KHONG_CHAC[nn]}»`, dan === DAN_KHONG_CHAC[nn], `«${dan}»`),
        ok(`dat-ban-sap ${hoiBan}: cả trang KHÔNG nói "chưa gửi được" / "chưa mở hỏi bàn" (cãi khung "không chắc, đừng gửi lại")`,
           !!chuMain && !CHUA_GUI_DUOC[nn].test(chuMain), chuMain.match(CHUA_GUI_DUOC[nn])?.[0]),
        ok(`dat-ban-sap ${hoiBan}: thẻ không có tiêu đề "chưa mở" (h2), vẫn có nút sang Facebook đã công bố để kiểm tra`,
           await page.locator('.hb-chua-mo h2').count() === 0
             && await page.locator(`.hb-chua-mo a[href="${LIEN_HE_THU.facebook_url}"]`).count() === 1),
        ok(`dat-ban-sap ${hoiBan}: KHÔNG có "đã nhận"`, !BAT_KY_DA_NHAN.test(await chuTrang())),
        ok(`dat-ban-sap ${hoiBan}: gửi một lần → tao_dat_ban một lần (không tự gửi lại)`, (mayGia.dem().tao_dat_ban ?? 0) === 1,
           `${mayGia.dem().tao_dat_ban ?? 0} lần`),
      ];
      if (tot.includes(false)) await chupLoi(`dat-ban-sap${hoiBan}`);
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
          const gd = await p.evaluate(doGiaoDien);
          const saiGd = Object.keys(PHEP_DO).flatMap(khoa => (gd[khoa] ?? ['không đo được']).map(c => `[${khoa}] ${c}`));
          const nhan = `${kichBan} ${duong} · ${rong}px`;
          const tot = [
            ok(`${nhan}: HTTP 200`, r?.status() === 200, `HTTP ${r?.status()}`),
            ok(`${nhan}: không tràn ngang`, kq.rong <= kq.khung + 1, `rộng ${kq.rong}px > khung ${kq.khung}px`),
            ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | ')),
            ok(`${nhan}: thành phần và khung trang đúng quy tắc (${Object.keys(PHEP_DO).length} phép đo của do-giao-dien.mjs)`,
               saiGd.length === 0, saiGd.slice(0, 5).join(' | ')),
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
  // Địa chỉ trên trang có hai nguồn: bản công bố trong /noi-bo và, khi chưa công bố, địa chỉ cố định
  // trong mã. Đổi địa chỉ trong /noi-bo mà một chỗ vẫn in bản trong mã thì một trang hiện hai địa chỉ.
  await nhom('7 · ĐỊA CHỈ ĐÃ CÔNG BỐ (dia-chi-cong-bo) TỚI ĐƯỢC MỌI CHỖ IN ĐỊA CHỈ; MÀN ĐẦU BỎ VẾ PHƯỜNG', async () => {
    const motDong = s => (s ?? '').replace(/\s+/g, ' ').trim();
    const chuCua = async chon => motDong(await page.locator(chon).first().innerText().catch(() => ''));
    const CONG_BO = DIA_CHI_CONG_BO_THU;
    const SAU_TANG = CONG_BO.replace(/^Tầng 3, /, '');                // menu gọn in sau chữ "Tầng 3" đậm
    const MAN_DAU = SAU_TANG.replace(', phường Thử', '');             // màn đầu: bản ngắn, bỏ vế phường
    ok(`Địa chỉ thử "${CONG_BO}" khác địa chỉ cố định trong mã "${DIA_CHI_NHA_HANG}", và có một vế phường để thử`,
       CONG_BO !== DIA_CHI_NHA_HANG && !CONG_BO.includes(DIA_CHI_NHA_HANG) && SAU_TANG !== CONG_BO && MAN_DAU !== SAU_TANG
         && MAN_DAU === '63 Hồ Tùng Mậu, TP. Hồ Chí Minh');
    const jsonLd = () => page.evaluate(() => {
      try { return JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent ?? 'null')?.address ?? null; }
      catch { return null; }
    });

    mayGia.datKichBan('dia-chi-cong-bo');
    for (const nn of NGON_NGU) {
      const t = chu(nn);
      const trangChu = duongDanTuongUng('/', nn);
      await page.goto(goc + trangChu, { waitUntil: 'load' });
      const manDau = await chuCua('main .kmd-dia-chi');
      const khoi = await chuCua('main .lt3 .lt3-dc');
      const chan = await chuCua('footer address p[lang="vi"]');
      const ld = await jsonLd();
      const chuChan = motDong(await chuTrang('footer'));
      const tot = [
        ok(`dia-chi-cong-bo ${trangChu}: màn đầu in "${t.tang3} · ${MAN_DAU}" — bản công bố, đã bỏ vế phường`,
           manDau === `${t.tang3} · ${MAN_DAU}`, manDau),
        ok(`dia-chi-cong-bo ${trangChu}: khối địa chỉ in nguyên bản công bố`, khoi === CONG_BO, khoi),
        ok(`dia-chi-cong-bo ${trangChu}: chân trang in nguyên bản công bố`, chan === CONG_BO, chan),
        ok(`dia-chi-cong-bo ${trangChu}: JSON-LD để cả bản công bố ở streetAddress, không thêm trường phường / thành phố`,
           JSON.stringify(ld) === JSON.stringify({ '@type': 'PostalAddress', streetAddress: CONG_BO, addressCountry: 'VN' }), JSON.stringify(ld)),
        ok(`dia-chi-cong-bo ${trangChu}: nút sao chép địa chỉ chép bản công bố`,
           await page.locator('main [data-sao-chep]').first().getAttribute('data-sao-chep') === CONG_BO),
        ok(`dia-chi-cong-bo ${trangChu}: cả trang không còn in địa chỉ cố định trong mã ("${DIA_CHI_NHA_HANG}")`,
           !motDong(await chuTrang()).includes(DIA_CHI_NHA_HANG)),
        ok(`dia-chi-cong-bo ${trangChu}: dòng địa chỉ pháp nhân không đổi theo bản công bố`, chuChan.includes(PHAP_NHAN.diaChi)),
        ok(`dia-chi-cong-bo ${trangChu}: câu chỉ đường vẫn đi kèm địa chỉ ở màn đầu và chân trang`,
           motDong(await chuTrang('main .kmd-loi-len')) === t.loiLen && chuChan.includes(t.loiLen)),
      ];
      // Câu hỏi thường gặp: mở câu "ở tầng mấy" rồi đọc.
      const cauHoi = page.locator('main details').filter({ hasText: CONG_BO }).first();
      tot.push(ok(`dia-chi-cong-bo ${trangChu}: câu hỏi thường gặp in bản công bố kèm câu chỉ đường`,
        await cauHoi.count() === 1 && motDong(await cauHoi.evaluate(el => { el.open = true; return el.innerText; })).includes(`${CONG_BO}. ${t.loiLen}`)));
      // Menu gọn (màn hẹp): sau chữ "Tầng 3" đậm là bản công bố, còn nguyên vế phường.
      const menu = page.locator('details.menu-gon').first();
      tot.push(ok(`dia-chi-cong-bo ${trangChu}: menu gọn in "${t.tang3} · ${SAU_TANG}"`,
        await menu.count() === 1
          && motDong(await menu.evaluate(el => { el.open = true; return el.querySelector('.mg-dia-chi')?.innerText ?? ''; })) === `${t.tang3} · ${SAU_TANG}`,
        await menu.count() ? motDong(await menu.evaluate(el => el.querySelector('.mg-dia-chi')?.innerText ?? '')) : 'không thấy menu gọn'));
      if (tot.includes(false)) await chupLoi(`dia-chi-cong-bo${trangChu}`);

      const denBeeftown = duongDanTuongUng('/den-beeftown', nn);
      await page.goto(goc + denBeeftown, { waitUntil: 'load' });
      const tot2 = [
        ok(`dia-chi-cong-bo ${denBeeftown}: khối "Địa chỉ và lối lên" in nguyên bản công bố`, await chuCua('main .lt3 .lt3-dc') === CONG_BO, await chuCua('main .lt3 .lt3-dc')),
        ok(`dia-chi-cong-bo ${denBeeftown}: bước 1 in nguyên bản công bố sau "Địa chỉ đầy đủ"`,
           (await chuCua('main .db-muc:nth-child(1) .db-chu p')).endsWith(CONG_BO), await chuCua('main .db-muc:nth-child(1) .db-chu p')),
        ok(`dia-chi-cong-bo ${denBeeftown}: JSON-LD để cả bản công bố ở streetAddress`, (await jsonLd())?.streetAddress === CONG_BO, JSON.stringify(await jsonLd())),
      ];
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      tot2.push(ok(`dia-chi-cong-bo ${hoiBan}: khối địa chỉ bản gọn in nguyên bản công bố`, await chuCua('main .lt3-gon .lt3-dc') === CONG_BO, await chuCua('main .lt3-gon .lt3-dc')));
      if (tot2.includes(false)) await chupLoi(`dia-chi-cong-bo${denBeeftown}`);
    }

    // Gỡ bản công bố (về day-du: dia_chi_hien_thi là null) → trang in lại địa chỉ cố định trong mã, ở cùng các chỗ đó.
    mayGia.datKichBan('day-du');
    await page.goto(goc + '/', { waitUntil: 'load' });
    ok(`day-du /: chưa công bố địa chỉ → màn đầu, khối địa chỉ, chân trang, JSON-LD in địa chỉ cố định "${DIA_CHI_NHA_HANG}"`,
       await chuCua('main .kmd-dia-chi') === `${chu('vi').tang3} · ${DIA_CHI_NHA_HANG.replace(/^Tầng 3, /, '')}`
         && await chuCua('main .lt3 .lt3-dc') === DIA_CHI_NHA_HANG && await chuCua('footer address p[lang="vi"]') === DIA_CHI_NHA_HANG
         && DIA_CHI_NHA_HANG.startsWith((await jsonLd())?.streetAddress ?? '?') && !motDong(await chuTrang()).includes('phường Thử'),
       [await chuCua('main .kmd-dia-chi'), await chuCua('main .lt3 .lt3-dc'), await chuCua('footer address p[lang="vi"]'), JSON.stringify(await jsonLd())].join(' | '));
  });

  // =========================================================================
  // Bảng màu chép tay (THUONG-HIEU.md mục 1 và 4) — phép thử không đọc CSS của trang.
  const MAU = { trang: 'rgb(255, 255, 255)', nenNhat: 'rgb(244, 244, 244)', do: 'rgb(189, 0, 0)', doDam: 'rgb(143, 0, 0)' };
  /** Đo ô nhập và nhãn của các form khớp `chon` (chạy TRONG trang). */
  const doO = chon => {
    const TRANG = 'rgb(255, 255, 255)', VIEN = 'rgb(118, 118, 118)';
    const hien = el => { const k = el.getBoundingClientRect(); return el.checkVisibility() && k.width > 0 && k.height > 0; };
    const o = [...document.querySelectorAll(chon)]
      .flatMap(f => [...f.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), select, textarea')])
      .filter(e => hien(e) && !e.closest('[aria-hidden="true"]'));
    const oSai = [], nhanSai = [];
    for (const e of o) {
      const cs = getComputedStyle(e), k = e.getBoundingClientRect(), ten = e.name || e.id;
      // Ô một dòng (chữ, số điện thoại, ngày, ô chọn) cao ĐÚNG 48px — ô ngày của Chromium tự cao thêm 2px nếu
      // không ghim chiều cao, đứng cạnh nút 48px thì lệch nhau. Ô nhiều dòng (textarea) thì từ 48px trở lên.
      if (e.tagName === 'TEXTAREA' ? k.height < 47.5 : Math.abs(k.height - 48) > 0.5) {
        oSai.push(`${ten} (${e.tagName.toLowerCase()}${e.type ? ` ${e.type}` : ''}) cao ${k.height.toFixed(1)}px`);
      }
      if (cs.fontSize !== '16px') oSai.push(`${ten} chữ ${cs.fontSize}`);
      if (cs.backgroundColor !== TRANG) oSai.push(`${ten} nền ${cs.backgroundColor}`);
      if (cs.borderTopColor !== VIEN || cs.borderTopWidth !== '1px') oSai.push(`${ten} viền ${cs.borderTopWidth} ${cs.borderTopColor}`);
      if (e.hasAttribute('placeholder')) nhanSai.push(`${ten} dùng placeholder`);
      // Nhãn: <label for>, hoặc <span> đầu của <label> bọc ngoài ô (form nộp hồ sơ).
      const nhan = (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) || e.closest('label')?.querySelector(':scope > span');
      if (!nhan || !hien(nhan)) { nhanSai.push(`${ten} không có nhãn nhìn thấy`); continue; }
      const co = parseFloat(getComputedStyle(nhan).fontSize);
      if (co < 14 || co > 16) nhanSai.push(`nhãn của ${ten} cỡ ${co}px`);
      if (nhan.getBoundingClientRect().bottom > k.top + 0.5) nhanSai.push(`nhãn của ${ten} không nằm trên ô`);
    }
    return { soO: o.length, coNgay: o.some(e => e.type === 'date'), oSai, nhanSai };
  };

  await nhom('8 · THÀNH PHẦN CỦA FORM Ở 390 VÀ 1440 PX: Ô NHẬP, Ô CHỌN GIỜ, THẺ, CÂU LỖI', async () => {
    for (const rong of [390, 1440]) {
      await page.setViewportSize({ width: rong, height: 900 });
      const doTheoQuyTac = async nhan => {
        // Con trỏ còn nằm ở chỗ vừa bấm trên trang trước: đưa nó ra góc và chờ hết chuyển màu (180ms),
        // không thì nút nằm dưới con trỏ đang ở màu "di chuột" và bị đo nhầm.
        await page.mouse.move(0, 0);
        await cho(300);
        const gd = await page.evaluate(doGiaoDien);
        return Object.entries(PHEP_DO).map(([khoa, ten]) =>
          ok(`${nhan}: ${ten}`, gd[khoa]?.length === 0, (gd[khoa] ?? ['không đo được']).slice(0, 4).join(' | ')));
      };

      mayGia.datKichBan('day-du');
      for (const nn of NGON_NGU) {
        const hoiBan = duongDanTuongUng('/dat-ban', nn);
        // Bản nháp các nhóm trước để lại (họ tên, giờ đã chọn — giữ 15 phút) sẽ điền sẵn form: xóa rồi mới mở
        // trang, để form ở đúng trạng thái của một khách vừa tới.
        await page.goto(goc + hoiBan, { waitUntil: 'load' });
        await page.evaluate(k => sessionStorage.removeItem(k), KHOA_LUU);
        await page.goto(goc + hoiBan, { waitUntil: 'load' });
        const nhan = `${hoiBan} · ${rong}px`;
        const tot = await doTheoQuyTac(nhan);
        const o = await page.evaluate(doO, 'form[data-hoi-ban], form[data-doi-ngay]');
        tot.push(ok(`${nhan}: ${o.soO} ô nhập, ô chọn — ô một dòng (kể cả ô ngày) cao đúng 48px, chữ 16px, nền trắng, viền 1px #767676`,
          o.soO >= 5 && o.coNgay && o.oSai.length === 0, `${o.coNgay ? '' : 'không thấy ô ngày · '}${o.oSai.slice(0, 4).join(' | ')}`));
        tot.push(ok(`${nhan}: mỗi ô có nhãn 14–16px đặt trên ô, không ô nào dùng placeholder thay nhãn`,
          o.nhanSai.length === 0, o.nhanSai.slice(0, 4).join(' | ')));
        const nenThe = await page.locator('.hb-the').first().evaluate(el => getComputedStyle(el).backgroundColor);
        tot.push(ok(`${nhan}: thẻ form nền xám nhạt #F4F4F4`, nenThe === MAU.nenNhat, nenThe));

        const chip = page.locator('form[data-hoi-ban] .hb-chip-o:has(input:not([disabled]))').first();
        const doChip = () => chip.locator('span').evaluate(sp => {
          const cs = getComputedStyle(sp);
          return { nen: cs.backgroundColor, chu: cs.color, cao: sp.getBoundingClientRect().height, co: cs.fontSize };
        });
        const truoc = await doChip();
        await chip.click();
        await cho(300);   // chuyển màu 180ms
        const sau = await doChip();
        tot.push(ok(`${nhan}: ô giờ cao ≥ 48px, chữ 16px; chưa chọn nền trắng, đang chọn nền đỏ chữ trắng`,
          truoc.cao >= 47.5 && truoc.co === '16px' && truoc.nen === MAU.trang && sau.nen === MAU.do && sau.chu === MAU.trang,
          JSON.stringify({ truoc, sau })));

        // Gửi khi họ tên và số điện thoại còn trống: lỗi bằng chữ, sát ô, màu #8F0000.
        await nutGui().click();
        await cho(300);
        const loi = await page.evaluate(() => ({
          cau: [...document.querySelectorAll('form[data-hoi-ban] .loi-o')].filter(p => !p.hidden)
            .map(p => ({ chu: p.textContent.trim(), mau: getComputedStyle(p).color })),
          vien: [...document.querySelectorAll('form[data-hoi-ban] :is(input, select, textarea)[aria-invalid="true"]')]
            .map(e => getComputedStyle(e).borderTopColor),
          tieuDiem: (() => {
            const a = document.activeElement, cs = getComputedStyle(a);
            return { ten: a.getAttribute('name'), vong: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 };
          })(),
        }));
        tot.push(ok(`${nhan}: gửi thiếu họ tên và số điện thoại → 2 câu lỗi bằng chữ màu #8F0000, 2 ô sai viền #8F0000`,
          loi.cau.length === 2 && loi.cau.every(c => c.chu.length > 5 && c.mau === MAU.doDam)
            && loi.vien.length === 2 && loi.vien.every(v => v === MAU.doDam), JSON.stringify(loi)));
        tot.push(ok(`${nhan}: tiêu điểm vào ô sai đầu tiên (họ tên), vòng focus nhìn thấy (≥ 2px)`,
          loi.tieuDiem.ten === 'ho_ten' && loi.tieuDiem.vong, JSON.stringify(loi.tieuDiem)));
        tot.push(ok(`${nhan}: form báo lỗi vẫn giữ màu nền trong bảng 22/10/2026, không tràn ngang`,
          (await page.evaluate(doGiaoDien)).nenTrongBang.length === 0
            && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)));
        if (tot.includes(false)) await chupLoi(`thanh-phan${hoiBan}-${rong}`);
      }

      mayGia.datKichBan('tuyen-dung-mo');
      for (const nn of NGON_NGU) {
        const tuyenDung = duongDanTuongUng('/tuyen-dung', nn);
        await page.goto(goc + tuyenDung, { waitUntil: 'load' });
        const nhan = `tuyen-dung-mo ${tuyenDung} · ${rong}px`;
        if (!ok(`${nhan}: có thẻ vị trí thật và form nộp hồ sơ`,
                await page.locator('form.form-nop').count() === 1 && await page.locator('.the.vi-tri').count() === 2)) {
          await chupLoi(`thanh-phan${tuyenDung}-${rong}`);
          continue;
        }
        const tot = await doTheoQuyTac(nhan);
        const o = await page.evaluate(doO, 'form.form-nop');
        tot.push(ok(`${nhan}: ${o.soO} ô nhập, ô chọn — ô một dòng cao đúng 48px, chữ 16px, nền trắng, viền 1px #767676`,
          o.soO >= 6 && o.oSai.length === 0, o.oSai.slice(0, 4).join(' | ')));
        tot.push(ok(`${nhan}: mỗi ô có nhãn 14–16px đặt trên ô, không ô nào dùng placeholder thay nhãn`,
          o.nhanSai.length === 0, o.nhanSai.slice(0, 4).join(' | ')));
        if (tot.includes(false)) await chupLoi(`thanh-phan${tuyenDung}-${rong}`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  // Form nộp hồ sơ cùng khuôn với form hỏi bàn (rà soát nợ kỹ thuật 11/10/2026): chặn bấm đúp, lượt gửi
  // KHÔNG CHẮC không mời gửi lại (không dựng form dưới câu "đừng gửi lại"), database từ chối thì quay về
  // đúng vị trí đã chọn và điền lại chữ đã gõ, file CV quá 5MB báo sát ô trước khi gửi.
  await nhom('9 · FORM NỘP HỒ SƠ: BẤM ĐÚP, MẤT MẠNG, DATABASE TỪ CHỐI, CV QUÁ 5MB', async () => {
    const UNG_VIEN = { ho_ten: 'Ứng Viên Thử', sdt: '0912345680', vi_tri: 'SANH-THU' };
    const KHOA_UT = 'bt-ung-tuyen';
    const nutNop = () => page.locator('form.form-nop [type="submit"]').first();
    async function dienHoSo() {
      await page.selectOption('form.form-nop select[name="vi_tri"]', UNG_VIEN.vi_tri);
      await page.fill('form.form-nop [name="ho_ten"]', UNG_VIEN.ho_ten);
      await page.fill('form.form-nop [name="sdt"]', UNG_VIEN.sdt);
      await page.locator('form.form-nop input[name="dong_y"]').check({ force: true });
    }
    async function moTrang(duong) {
      await page.goto(goc + duong, { waitUntil: 'load' });
      await page.evaluate(k => sessionStorage.removeItem(k), KHOA_UT);
      await page.goto(goc + duong, { waitUntil: 'load' });
    }
    async function guiHoSo() {
      const sau = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
      await nutNop().click();
      await sau;
      await page.waitForLoadState('networkidle').catch(() => {});
      await cho(300);
    }

    for (const nn of NGON_NGU) {
      const tuyenDung = duongDanTuongUng('/tuyen-dung', nn);

      // --- Bấm đúp khi database trả lời chậm: đúng một lượt nộp ---------------------------------
      for (const cach of ['bấm đúp', 'bấm lần hai sau 0,3 giây']) {
        mayGia.datKichBan('tuyen-dung-mo', { cham: 1500 });
        await moTrang(tuyenDung);
        await dienHoSo();
        await nutNop().scrollIntoViewIfNeeded();
        const hop = await nutNop().boundingBox();
        const [x, y] = [hop.x + hop.width / 2, hop.y + hop.height / 2];
        await page.evaluate(k => {
          sessionStorage.removeItem(k);
          document.querySelector('form.form-nop')?.addEventListener('submit', () => {
            if (sessionStorage.getItem(k)) return;
            const b = document.querySelector('form.form-nop [type="submit"]');
            sessionStorage.setItem(k, JSON.stringify(b && { tat: b.disabled, ban: b.getAttribute('aria-busy'), chu: b.textContent.trim() }));
          });
        }, KHOA_NUT);
        // Không có gì chặn lần bấm thứ hai thì trình duyệt hủy lượt chuyển trang đầu (ERR_ABORTED):
        // bắt lại để phép thử báo đỏ ở các kiểm tra dưới, không làm sập cả lượt chạy.
        const sau = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 })
          .catch(() => page.waitForLoadState('load'));
        if (cach === 'bấm đúp') await page.mouse.dblclick(x, y);
        else { await page.mouse.click(x, y); await cho(300); await page.mouse.click(x, y); }
        await sau;
        await page.waitForLoadState('networkidle').catch(() => {});
        const nut = await page.evaluate(k => {
          const v = sessionStorage.getItem(k);
          sessionStorage.removeItem(k);
          try { return JSON.parse(v ?? 'null'); } catch { return { loi: v }; }
        }, KHOA_NUT).catch(e => ({ loi: e.message }));
        await cho(1000);
        const dem = mayGia.dem().nop_ho_so_ung_tuyen ?? 0;
        const chu_ = await chuTrang();
        const nhan = `${tuyenDung} nộp hồ sơ (${cach})`;
        const tot = [
          ok(`${nhan}: đang gửi thì nút bị khóa, aria-busy="true", chữ "${DANG_GUI[nn]}"`,
             nut?.tat === true && nut?.ban === 'true' && nut?.chu.includes(DANG_GUI[nn]), JSON.stringify(nut)),
          ok(`${nhan}: nop_ho_so_ung_tuyen được gọi ĐÚNG MỘT lần`, dem === 1, `${dem} lần`),
          ok(`${nhan}: trang sau có thẻ "đã nhận" kèm mã hồ sơ`,
             await page.locator('[data-ket-qua="da-nhan"]').count() === 1 && /BT-UV-2610-/.test(chu_) && CHU_DA_NHAN[nn].test(chu_), chu_.slice(0, 200)),
          ok(`${nhan}: không có chữ "thành công"/"success"/"성공", không chữ cấm`,
             !CHU_THANH_CONG.test(chu_) && timChuoiCam(chu_).length === 0, chu_.match(CHU_THANH_CONG)?.[0]),
          ok(`${nhan}: tiêu điểm ở thẻ "đã nhận"; bản giữ tạm bị xóa`,
             await page.evaluate(() => document.activeElement?.getAttribute('data-ket-qua')) === 'da-nhan'
               && await page.evaluate(k => sessionStorage.getItem(k), KHOA_UT) === null),
        ];
        if (tot.includes(false)) await chupLoi(`ho-so-bam-hai-lan${tuyenDung}-${cach === 'bấm đúp' ? 'dup' : 'cach'}`);
      }

      // --- Mạng đứt giữa lượt gửi: KHÔNG CHẮC — không dựng lại form, không mời nộp -------------
      mayGia.datKichBan('tuyen-dung-dut');
      await moTrang(tuyenDung);
      await dienHoSo();
      await guiHoSo();
      {
        const chuMain = await chuTrang('main');
        const nhan = `tuyen-dung-dut ${tuyenDung}`;
        const tot = [
          ok(`${nhan}: khung "KHÔNG CHẮC đã ghi" hiện (role="alert", data-ket-qua="khong-chac")`,
             await page.locator('[role="alert"][data-ket-qua="khong-chac"]').count() === 1),
          ok(`${nhan}: KHÔNG dựng form nộp hồ sơ dưới câu "đừng gửi lại"`, await page.locator('form.form-nop').count() === 0),
          ok(`${nhan}: không nút "Nộp hồ sơ" ở đầu trang, không nút "Ứng tuyển vị trí này" trên thẻ`,
             await page.locator('main a.nut[href="#nop-ho-so"]').count() === 0 && await page.locator('.td-nut-the').count() === 0),
          ok(`${nhan}: vẫn có nút sang Facebook đã công bố để kiểm tra`,
             await page.locator(`#nop-ho-so a[href="${LIEN_HE_THU.facebook_url}"]`).count() === 1),
          ok(`${nhan}: KHÔNG có "đã nhận" / "received" / "접수되었"`, !BAT_KY_DA_NHAN.test(chuMain), chuMain.match(BAT_KY_DA_NHAN)?.[0]),
          ok(`${nhan}: tiêu điểm ở khung "không chắc"; bản giữ tạm bị xóa (gửi lại không còn là một cú bấm)`,
             await page.evaluate(() => document.activeElement?.getAttribute('data-ket-qua')) === 'khong-chac'
               && await page.evaluate(k => sessionStorage.getItem(k), KHOA_UT) === null),
          ok(`${nhan}: gửi một lần → nop_ho_so_ung_tuyen một lần (không tự gửi lại)`, (mayGia.dem().nop_ho_so_ung_tuyen ?? 0) === 1,
             `${mayGia.dem().nop_ho_so_ung_tuyen ?? 0} lần`),
        ];
        if (tot.includes(false)) await chupLoi(`tuyen-dung-dut${tuyenDung}`);
      }

      // --- Database từ chối (chưa ghi gì): quay về đúng vị trí, điền lại chữ đã gõ ---------------
      mayGia.datKichBan('tuyen-dung-loi');
      await moTrang(tuyenDung);
      await dienHoSo();
      await guiHoSo();
      {
        const o = await page.evaluate(() => ({
          vi_tri: document.querySelector('form.form-nop select[name="vi_tri"]')?.value ?? null,
          ho_ten: document.querySelector('form.form-nop [name="ho_ten"]')?.value ?? null,
          sdt: document.querySelector('form.form-nop [name="sdt"]')?.value ?? null,
          dong_y: document.querySelector('form.form-nop input[name="dong_y"]')?.checked ?? null,
        }));
        const khung = await chuTrang('[data-ket-qua="loi"]');
        const cau = nn === 'vi' ? 'Vị trí này đã hết hạn nhận hồ sơ' : cauLoiDatabase('Vị trí này đã hết hạn nhận hồ sơ', nn, '(câu chung)');
        const nhan = `tuyen-dung-loi ${tuyenDung}`;
        const tot = [
          ok(`${nhan}: câu từ chối của database hiện trong khung lỗi, đúng thứ tiếng ("${cau}")`, khung.includes(cau), khung.slice(0, 200)),
          ok(`${nhan}: URL quay về ?vi_tri=${UNG_VIEN.vi_tri}#nop-ho-so`,
             new URL(page.url()).searchParams.get('vi_tri') === UNG_VIEN.vi_tri && new URL(page.url()).hash === '#nop-ho-so', page.url()),
          ok(`${nhan}: vị trí, họ tên, số điện thoại đã chọn / đã gõ được điền lại; ô đồng ý KHÔNG tích sẵn`,
             o.vi_tri === UNG_VIEN.vi_tri && o.ho_ten === UNG_VIEN.ho_ten && o.sdt === UNG_VIEN.sdt && o.dong_y === false, JSON.stringify(o)),
          ok(`${nhan}: KHÔNG có "đã nhận"`, !BAT_KY_DA_NHAN.test(await chuTrang('main'))),
        ];
        if (tot.includes(false)) await chupLoi(`tuyen-dung-loi${tuyenDung}`);
      }

      // --- File CV lớn hơn 5MB: báo sát ô, không gửi ------------------------------------------
      mayGia.datKichBan('tuyen-dung-mo');
      await moTrang(tuyenDung);
      await dienHoSo();
      await page.setInputFiles('form.form-nop input[name="cv"]', {
        name: 'CV-qua-lon.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(5 * 1024 * 1024 + 1024, 0x25),
      });
      await nutNop().click();
      await cho(800);
      {
        const loiCv = await page.evaluate(() => {
          const p = document.querySelector('form.form-nop [data-loi="cv"]');
          const o = document.querySelector('form.form-nop input[name="cv"]');
          return { hien: !!p && !p.hidden, chu: p?.textContent?.trim() ?? '', mau: p ? getComputedStyle(p).color : '',
                   sai: o?.getAttribute('aria-invalid'), tieuDiem: document.activeElement?.getAttribute('name') };
        });
        const nhan = `CV quá 5MB ${tuyenDung}`;
        const tot = [
          ok(`${nhan}: không gửi (nop_ho_so_ung_tuyen 0 lần, vẫn ở trang form)`,
             (mayGia.dem().nop_ho_so_ung_tuyen ?? 0) === 0 && await page.locator('form.form-nop').count() === 1),
          ok(`${nhan}: câu lỗi sát ô CV, màu #8F0000, nói 5MB; ô CV aria-invalid, tiêu điểm vào ô CV`,
             loiCv.hien && /5MB/.test(loiCv.chu) && loiCv.mau === MAU.doDam && loiCv.sai === 'true' && loiCv.tieuDiem === 'cv',
             JSON.stringify(loiCv)),
          ok(`${nhan}: nút gửi không bị khóa (gửi được sau khi chọn file khác)`,
             await nutNop().evaluate(b => !b.disabled && b.getAttribute('aria-busy') !== 'true')),
        ];
        if (tot.includes(false)) await chupLoi(`cv-qua-lon${tuyenDung}`);
      }
    }
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  // Màn đầu trang chủ có ba trạng thái theo khóa ngay_khai_truong: chưa có ngày, sắp mở ("Đón bạn từ …"),
  // đã mở ("Mở cửa từ …"). CI không có database nên trinh-duyet.mjs chỉ thấy trạng thái đầu; hai trạng thái
  // sau là thứ khách thấy thật quanh ngày mở. Dòng trạng thái thử dài hai câu: ô trạng thái cao hơn cặp
  // địa chỉ + câu chỉ đường — đúng lúc hàng thông tin dễ lệch nhất.
  await nhom('10 · MÀN ĐẦU TRANG CHỦ THEO NGÀY KHAI TRƯƠNG: CHƯA CÓ NGÀY, SẮP MỞ (sap-mo), ĐÃ MỞ (da-mo) Ở 390, 900, 1024, 1440 PX', async () => {
    const motDong = s => (s ?? '').replace(/\s+/g, ' ').trim();
    const homNay = homNayVn();
    const TRANG_THAI = [['day-du', null], ['sap-mo', ngaySapMoThu()], ['da-mo', NGAY_DA_MO_THU]];
    ok(`Ngày thử: sap-mo ${ngaySapMoThu()} sau hôm nay ${homNay} (giờ Việt Nam), da-mo ${NGAY_DA_MO_THU} đã qua; dòng trạng thái thử dài hai câu`,
       ngaySapMoThu() > homNay && NGAY_DA_MO_THU <= homNay
         && Object.values(TRANG_THAI_THU).every(c => (c.match(/[.!?](\s|$)/g) ?? []).length === 2 && timChuoiCam(c).length === 0));
    for (const rong of [390, 900, 1024, 1440]) {
      await page.setViewportSize({ width: rong, height: rong < 600 ? 844 : 900 });
      for (const [kichBan, ngay] of TRANG_THAI) {
        mayGia.datKichBan(kichBan);
        for (const nn of NGON_NGU) {
          const t = chu(nn);
          const duong = duongDanTuongUng('/', nn);
          const nhan = `${kichBan} ${duong} · ${rong}px`;
          const r = await page.goto(goc + duong, { waitUntil: 'load' });
          await page.evaluate(() => document.fonts.ready);
          const kq = await page.evaluate(() => {
            const chon = c => document.querySelector(`main .kmd ${c}`);
            const [tin, dc, loiLen, ngayMo, trangThai] = ['.kmd-thong-tin', '.kmd-dia-chi', '.kmd-loi-len', '.kmd-ngay', '.kmd-trang-thai'].map(chon);
            const chu = e => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
            const soDong = el => {
              if (!el) return 0;
              const vung = document.createRange(); vung.selectNodeContents(el);
              const dinh = [];
              for (const o of vung.getClientRects()) if (o.width >= 1 && !dinh.some(d => Math.abs(d - o.top) < 6)) dinh.push(o.top);
              return dinh.length;
            };
            const khop = tin?.getBoundingClientRect();
            return {
              khe: dc && loiLen ? loiLen.getBoundingClientRect().top - dc.getBoundingClientRect().bottom : null,
              loiLen: chu(loiLen), ngay: ngayMo ? chu(ngayMo) : null, trangThai: chu(trangThai),
              dongNgay: soDong(ngayMo?.querySelector('strong')), dongCaNgay: soDong(ngayMo),
              tran: tin ? [...tin.children].filter(e => { const k = e.getBoundingClientRect(); return k.left < khop.left - 1 || k.right > khop.right + 1 || k.right > innerWidth; }).map(e => e.className) : ['không thấy hàng thông tin'],
              rongTrang: document.documentElement.scrollWidth, khung: innerWidth,
            };
          });
          // Như nhóm 8: con trỏ còn nằm ở chỗ nhóm trước vừa bấm — đưa ra góc, chờ hết chuyển màu (180ms),
          // không thì nút nằm dưới con trỏ bị đo ở màu "di chuột" (đo được màu giữa chừng, ngoài bảng).
          await page.mouse.move(0, 0);
          await cho(300);
          const gd = await page.evaluate(doGiaoDien);
          const saiGd = Object.keys(PHEP_DO).flatMap(khoa => (gd[khoa] ?? ['không đo được']).map(c => `[${khoa}] ${c}`));
          const ngayMong = ngay ? `${ngay <= homNay ? t.moCuaTu : t.donBanTu} ${dinhDangNgay(ngay, nn)}` : null;
          const tot = [
            ok(`${nhan}: HTTP 200, không cuộn ngang, không ô nào của hàng thông tin tràn khung`,
               r?.status() === 200 && kq.rongTrang <= kq.khung + 1 && kq.tran.length === 0,
               `HTTP ${r?.status()}, rộng ${kq.rongTrang}px / khung ${kq.khung}px, tràn: ${kq.tran.join(', ') || 'không'}`),
            ok(ngayMong ? `${nhan}: dòng ngày ghi "${ngayMong}"` : `${nhan}: chưa công bố ngày → không có dòng ngày`, kq.ngay === ngayMong, String(kq.ngay)),
            ok(`${nhan}: dòng trạng thái ${kichBan === 'day-du' ? 'là câu dự phòng trong mã' : 'là câu hai câu đã công bố'}`,
               kq.trangThai === (TRANG_THAI_THU[kichBan] ?? t.trangThaiMacDinh), kq.trangThai),
            ok(`${nhan}: câu chỉ đường nguyên văn, dính ngay dưới dòng địa chỉ (cách đáy địa chỉ −10 đến 8px)`,
               kq.loiLen === t.loiLen && kq.khe !== null && kq.khe >= -10 && kq.khe <= 8, `cách ${kq.khe?.toFixed(1)}px · «${kq.loiLen}»`),
            ok(`${nhan}: thành phần và khung trang đúng quy tắc (${Object.keys(PHEP_DO).length} phép đo của do-giao-dien.mjs)`,
               saiGd.length === 0, saiGd.slice(0, 5).join(' | ')),
          ];
          if (ngay) {
            tot.push(ok(`${nhan}: ngày nằm trên một dòng${rong >= 900 ? ', cả dòng "… từ <ngày>" cũng một dòng' : ''}`,
              kq.dongNgay === 1 && (rong < 900 || kq.dongCaNgay === 1), `ngày ${kq.dongNgay} dòng, cả dòng ${kq.dongCaNgay} dòng`));
          }
          if (tot.includes(false)) await chupLoi(`man-dau-${kichBan}-${tenTep(duong)}-${rong}`);
        }
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  // Trang Thực đơn sau khi Khánh công bố danh mục của cuốn menu bản sáng. Ba phần là ba tab: bấm từng tab như
  // khách, cuộn cho ảnh lazy của phần vừa mở tải xong, rồi đo.
  await nhom('11 · THỰC ĐƠN BẢN SÁNG ĐÃ CÔNG BỐ: TỪNG MÓN, ẢNH VÀ NHÃN, CẢNH BÁO MÓN SỐNG, CÔNG TẮC ĐỒ UỐNG CÓ CỒN, MỌI BỀ RỘNG', async () => {
    // Phần của từng nhóm trên trang — theo loai của nhóm (lib/thuc-don.ts → VE_PHAN): gọi thêm và bò tại quầy
    // ở dải "Bò tại quầy", đồ uống ở "Đồ uống", còn lại ở "Món ăn".
    const PHAN_CUA_NHOM = { 'goi-them': 'bo-tai-quay', 'bo-tai-quay': 'bo-tai-quay', highball: 'do-uong', 'khong-con': 'do-uong', 'do-uong-signature': 'do-uong' };
    const phanCua = m => PHAN_CUA_NHOM[m.nhom] ?? 'mon-an';
    const NHAN_ANH = { vi: 'Ảnh minh họa', en: 'Illustrative image', ko: '연출 이미지' };
    /** Bấm tab, cuộn hết phần vừa mở cho ảnh lazy tải xong, về đầu trang; trả về các thẻ món đang hiện. */
    const moTab = async (p, phan) => {
      await p.locator(`#td-tab-${phan}`).click();
      // Chuột rời khỏi trang trước khi cuộn: chuột đứng yên ở chỗ tab trong lúc trang cuộn bên dưới thì "di chuột"
      // lên nút Hỏi bàn của dải đỏ — phép đo màu nút bắt đúng lúc nút đang đổi màu (180ms), không phải lỗi giao diện.
      await p.mouse.move(0, 0);
      return p.evaluate(async phan => {
        const khoi = document.getElementById(phan);
        const dau = khoi.getBoundingClientRect().top + scrollY;
        for (let y = dau; y < dau + khoi.offsetHeight; y += 500) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)); }
        for (let i = 0; i < 100; i++) {
          const cho = [...khoi.querySelectorAll('figure.anh img')].filter(a => a.checkVisibility() && !(a.complete && a.naturalWidth > 0));
          if (!cho.length) break;
          await new Promise(r => setTimeout(r, 100));
        }
        scrollTo({ top: 0, behavior: 'instant' });
        await new Promise(r => setTimeout(r, 250));   // hết chuyển màu (--nhanh 180ms) của phần tử vừa đi qua
        const anhCua = f => f && {
          src: f.querySelector('img')?.getAttribute('src') ?? '', alt: f.querySelector('img')?.getAttribute('alt') ?? '',
          nhan: f.querySelector('figcaption')?.checkVisibility() ? f.querySelector('figcaption').textContent.trim() : '',
          daVe: !!f.querySelector('img')?.complete && (f.querySelector('img')?.naturalWidth ?? 0) > 0,
        };
        return {
          hien: [...document.querySelectorAll('.td-phan')].filter(x => x.checkVisibility()).map(x => x.id),
          mon: [...khoi.querySelectorAll('.tdn-mon, .td-nhom .mon')].filter(x => x.checkVisibility()).map(x => {
            const anh = x.classList.contains('tdn-lon') ? x.closest('.tdn-mo')?.querySelector('.tdn-lon-anh figure.anh') : x.querySelector('figure.anh');
            return {
              ten: (x.querySelector('.tdm-ten, .mon-ten')?.textContent ?? '').trim(),
              chu: x.innerText,
              anh: anhCua(anh),
            };
          }),
          cau: Object.fromEntries([...khoi.querySelectorAll('.tdn')].map(n => [n.querySelector('.tdn-ten')?.id ?? '', n.querySelector('.tdn-cau')?.textContent.trim() ?? null])),
          giaPhanTu: document.querySelectorAll('.mon-gia').length,
        };
      }, phan);
    };

    // Chữ đang hiện của một trang (chuTrang() ở trên đọc trang chung `page`; ở đây mỗi bề rộng một context riêng).
    const chuTrangCua = async (p, chon) => (await p.locator(chon).first().innerText().catch(() => '')) ?? '';
    const thu = async ({ kichBan, nn, rong, monMong, kiemThem = () => [] }) => {
      mayGia.datKichBan(kichBan);
      const c = await trinhDuyet.newContext({ viewport: { width: rong, height: rong < 600 ? 800 : 900 } });
      const p = await c.newPage();
      const loiJs = [];
      p.on('pageerror', e => loiJs.push(e.message));
      const duong = duongDanTuongUng('/thuc-don', nn);
      const nhan = `${kichBan} ${duong} · ${rong}px`;
      try {
        await p.goto(goc + duong, { waitUntil: 'load', timeout: 60000 });
        const tot = [];
        let thay = [];
        let chuCaTrang = '';
        for (const phan of ['mon-an', 'do-uong', 'bo-tai-quay']) {
          const kq = await moTab(p, phan);
          const gd = await p.evaluate(doGiaoDien);
          const saiGd = Object.keys(PHEP_DO).flatMap(khoa => (gd[khoa] ?? ['không đo được']).map(x => `[${khoa}] ${x}`));
          const tran = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          tot.push(
            ok(`${nhan} · tab #${phan}: đúng phần này hiện, không cuộn ngang, đủ ${Object.keys(PHEP_DO).length} phép đo của do-giao-dien.mjs`,
               kq.hien.join() === phan && tran <= 1 && saiGd.length === 0, [`hiện: ${kq.hien.join(', ')}`, tran > 1 ? `tràn ${tran}px` : '', ...saiGd.slice(0, 4)].filter(Boolean).join(' | ')),
          );
          // Mỗi món mong đợi của phần này hiện đúng tên; có ảnh thì ảnh đúng, alt đúng thứ tiếng, nhãn đang hiện.
          for (const m of monMong.filter(x => phanCua(x) === phan)) {
            const the = kq.mon.find(x => x.ten === m.ten[nn]);
            const a = ANH_CUA_MON[m.ma];
            const sai = !the ? ['không thấy thẻ món'] : [
              ...(a ? [!the.anh ? 'thiếu ảnh' : !the.anh.src.includes(`/anh/${a.id}-${a.khung}-`) ? `ảnh ${the.anh.src}` : '',
                the.anh && the.anh.alt !== DANH_MUC_ANH[a.id].alt[nn] ? 'alt sai thứ tiếng / sai ảnh' : '',
                the.anh && the.anh.nhan !== NHAN_ANH[nn] ? `nhãn «${the.anh.nhan}»` : '', the.anh && !the.anh.daVe ? 'ảnh chưa tải về' : '']
                : [the.anh ? 'món không có trong ANH_CUA_MON mà có ảnh' : '']),
              m.moTa && !the.chu.includes(m.moTa[nn]) ? 'thiếu mô tả' : '',
              m.laMonSong && !(thuong(the.chu).includes(thuong(NHAN_MON.monSong[nn])) && the.chu.includes(m.canhBao[nn])) ? 'món sống thiếu nhãn hoặc câu cảnh báo' : '',
            ].filter(Boolean);
            thay.push(m.ma);
            tot.push(ok(`${nhan} · ${m.ma} «${m.ten[nn]}»: hiện đúng tên${a ? ', ảnh, alt, nhãn' : ''}${m.laMonSong ? ', nhãn Món sống và câu cảnh báo' : ''}`, sai.length === 0, sai.join(' · ')));
          }
          // Câu dưới tên nhóm: đúng chữ CAU_NHOM; nhóm không có trong CAU_NHOM thì không in câu nào.
          for (const [idNhom, cau] of Object.entries(kq.cau)) {
            const ma = idNhom.replace(/^tdn-/, '');
            const mong = CAU_NHOM[ma]?.[nn] ?? null;
            tot.push(ok(`${nhan} · nhóm ${ma}: ${mong ? `câu dưới tên nhóm «${mong}»` : 'không có câu dưới tên nhóm'}`, cau === mong, `thấy «${cau}»`));
          }
          tot.push(ok(`${nhan} · tab #${phan}: không phần tử giá (.mon-gia)`, kq.giaPhanTu === 0, `${kq.giaPhanTu} phần tử`));
          if (phan === 'do-uong') {
            // Đã công bố đồ uống mà chưa có món không cồn nào (day-du: chỉ ba ly signature, đều có cồn): cột thực đơn
            // mở đầu bằng tên các nhóm không cồn, đứng trước nhóm đầu tiên — cạnh ảnh ba ly không cồn. Có món không
            // cồn (thuc-don-thu-suc) hay chưa công bố đồ uống nào (khong-con-tat) thì không có danh sách này.
            const uong = monMong.filter(m => phanCua(m) === 'do-uong');
            const tChu = chu(nn);
            const mong = uong.length && !uong.some(m => !m.coCon) ? [tChu.nhomNuocEp, tChu.nhomNuocNgot, tChu.nhomNuocSuoi] : [];
            const thayDs = await p.evaluate(() => {
              const ds = document.querySelector('#do-uong .td-uong-khong-con');
              const nhomDau = document.querySelector('#do-uong .td-chinh .tdn, #do-uong .td-chinh .td-nhom');
              return {
                ten: [...(ds?.querySelectorAll('.td-dm-ten') ?? [])].map(e => e.textContent.trim()),
                hien: !!ds?.checkVisibility(),
                truoc: !ds || !nhomDau || ds.getBoundingClientRect().bottom <= nhomDau.getBoundingClientRect().top + 0.5,
              };
            });
            tot.push(ok(mong.length
              ? `${nhan} · tab #do-uong: chưa có đồ uống không cồn nào công bố → tên ba nhóm không cồn (${mong.join(', ')}) hiện trước nhóm đầu tiên`
              : `${nhan} · tab #do-uong: không có danh sách nhóm không cồn chen trước đồ uống đã công bố`,
              JSON.stringify(thayDs.ten) === JSON.stringify(mong) && (!mong.length || (thayDs.hien && thayDs.truoc)),
              `thấy ${JSON.stringify(thayDs.ten)}, hiện ${thayDs.hien}, đứng trước ${thayDs.truoc}`));
          }
          chuCaTrang += '\n' + await chuTrangCua(p, 'main');
        }
        const cam = timChuoiCam(chuCaTrang);
        tot.push(
          ok(`${nhan}: KHÔNG một số tiền nào, không chữ cấm trên cả ba tab`, cam.length === 0, cam.map(x => x.tim_thay).join(' · ')),
          ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | ')),
          ...kiemThem(chuCaTrang),
        );
        if ((await Promise.all(tot)).includes(false)) {
          mkdirSync(ANH_LOI, { recursive: true });
          await p.screenshot({ path: join(ANH_LOI, `thuc-don-${kichBan}-${nn}-${rong}.png`), fullPage: true }).catch(() => {});
        }
      } finally {
        await c.close();
      }
    };
    const CO_DAY_DU = [[320, 'vi'], [360, 'vi'], [390, 'vi'], [430, 'vi'], [768, 'vi'], [1024, 'vi'], [1440, 'vi'],
      [390, 'en'], [1440, 'en'], [390, 'ko'], [1440, 'ko']];
    for (const [rong, nn] of CO_DAY_DU) {
      // Dữ liệu giả day-du: 22 món ăn và ba ly signature — mọi món phải hiện ở đúng phần.
      await thu({ kichBan: 'day-du', nn, rong, monMong: MON_MAU });
    }
    for (const [rong, nn] of [[390, 'vi'], [1440, 'vi'], [390, 'en'], [1440, 'ko']]) {
      const coCon = MON_MAU.filter(m => m.coCon);
      await thu({
        kichBan: 'khong-con-tat', nn, rong, monMong: MON_MAU.filter(m => !m.coCon),
        kiemThem: chuDoc => [
          ok(`khong-con-tat ${duongDanTuongUng('/thuc-don', nn)} · ${rong}px: công tắc đồ uống có cồn tắt → không ly signature nào, không nhãn "${NHAN_MON.coCon[nn]}", không dòng luật rượu`,
             !coCon.some(m => chuDoc.includes(m.ten[nn])) && !thuong(chuDoc).includes(thuong(NHAN_MON.coCon[nn])) && !chuDoc.includes(chu(nn).luatRuou),
             coCon.filter(m => chuDoc.includes(m.ten[nn])).map(m => m.ten[nn]).join(', ')),
        ],
      });
    }
    for (const [rong, nn] of [[320, 'vi'], [360, 'vi'], [390, 'vi'], [768, 'vi'], [1024, 'vi'], [1440, 'vi'], [390, 'ko'], [1440, 'ko'], [390, 'en']]) {
      await thu({ kichBan: 'thuc-don-thu-suc', nn, rong, monMong: [...MON_MAU, ...MON_THU_SUC] });
    }
    mayGia.datKichBan('day-du');
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
