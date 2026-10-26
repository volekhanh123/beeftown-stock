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
 *  12. Trang Mua thịt về (PR 2, migration 0101; kịch bản mua-thit-* của gia-supabase.mjs, menu thử MENU_THU — giá
 *       THỬ). Mở (mua-thit-mo, vi/en/ko × 390, 1440 px): đủ gói đúng nhóm, mỗi gói đúng giá trong [data-tien], câu
 *       "giá quán đã công bố" ở Nhận hàng, Đơn của bạn, hỏi đáp; không giá theo kg / 100 g; nhãn "Gói khoảng 200 g";
 *       gói tạm hết có giá, không ô chọn; không giao hàng khi chưa công bố. Chọn gói (nút + đọc lên vùng
 *       aria-live), tạm tính, đếm, tin đơn đúng từng dòng của taoTinDon (dòng giờ soạn lệch ≤ 2 phút); mọi số tiền
 *       nằm trong [data-tien]; không chữ cấm ngoài số tiền đã chốt (chu-hien-ra.mjs). Chép đơn: "Đã chép" chỉ sau
 *       khi lệnh chép xong; bị từ chối → câu chép tay, chữ được chọn hết; không có clipboard → không nút Chép. Nút
 *       gửi là <a> tới đúng link Zalo OA đã công bố; dòng "Không dùng Zalo?" chỉ khi có hotline. Tắt JavaScript →
 *       form GET dựng "Xem lại đơn" có cùng tin; số gói sai kiểu trên địa chỉ bị bỏ; Back và tải lại vẫn khớp. Bề rộng
 *       320 → 1440 px, thanh dưới (390px) không che ô chọn, dừng trước "Xem lại đơn", không có khi xoay ngang;
 *       1080 / 1279 px đầu trang đủ năm mục một hàng. mua-thit-giao, mua-thit-het-quay, mua-thit-loi / -dut / -treo
 *       (trả lời trong 6 giây), và trạng thái chưa mở (rong, day-du, mua-thit-rong, -khong-zalo, -zalo-la, -lech):
 *       không form, không giá, không mời nhắn, điều hướng bốn mục, mô tả "chưa mở". Đo "hiện" bằng isVisible().
 *  13. Meta Pixel (src/lib/meta-pixel.ts; Meta bị chặn ở mọi context — chan-meta.mjs). Hỏi bàn: Lead đúng một lần,
 *       chỉ sau khi database trả mã (cả khi bấm đúp), chỉ kèm content_name và language — không họ tên, số điện thoại,
 *       mã; tải lại thẻ "đã nhận" không thành Lead thứ hai; database 500, mạng đứt, database từ chối → không Lead;
 *       địa chỉ trang sau khi gửi không mang họ tên hay số điện thoại. Bấm số điện thoại, link Zalo đã công bố →
 *       Contact. Back về thẻ "đã nhận" lấy từ bộ nhớ đệm → không Lead thứ hai. Mua thịt về: "Xem đơn" có giỏ → một
 *       InitiateCheckout cho mỗi giỏ (bấm thanh dưới ở trang xem đơn không thêm; đổi giỏ thì thêm), giỏ rỗng thì không;
 *       địa chỉ sau "Xem đơn" chỉ mang mã gói, số gói, cách nhận.
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
import { batMayGia, LIEN_HE_THU, MON_MAU, MON_THU_SUC, DIA_CHI_CONG_BO_THU, NGAY_DA_MO_THU, TRANG_THAI_THU, ngaySapMoThu,
  ZALO_OA_THU, menuMuaThitVe } from './gia-supabase.mjs';
import { timChuoiCam } from '../src/lib/chuoi-cam.js';
import { chuHienRa, boTienDaChot } from './chu-hien-ra.mjs';
import { doGiaoDien, PHEP_DO } from './do-giao-dien.mjs';
import { moChromium, ghiPixel, docHangDoi, suKienTrong } from './chan-meta.mjs';

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
// Trang Mua thịt về (nhóm 12): đơn và tin đơn mong đợi tính bằng chính lib của trang từ dữ liệu giả.
const { nhomMuaThitVe, chiaNhom } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'mua-thit-ve.ts')).href);
const { CHU_DON, dinhDangTien, gioSoanVn, khoaGoi, nhanGoi, taoTinDon, tinhDon } =
  await import(pathToFileURL(join(WEB, 'src', 'lib', 'don-mua-thit.ts')).href);
const { CHU_DICH } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'dich-dat-hang.ts')).href);

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

  trinhDuyet = await moChromium(chromium);
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
  // Trang Mua thịt về (PR 2, migration 0101) khi đã nối database. Supabase giả trả menu thử MENU_THU (giá THỬ) theo
  // kịch bản mua-thit-*. Mọi chỗ "hiện / không hiện" đo bằng isVisible() / checkVisibility() — đọc thuộc tính hidden
  // không đủ (display của .nut từng đè lên hidden). Đơn, tạm tính và tin đơn mong đợi tính bằng CHÍNH lib của trang
  // (don-mua-thit.ts) từ dữ liệu giả; dòng "Soạn lúc" (giờ soạn) kiểm riêng bằng gioSoanVn. Câu chữ của component
  // chép tay từ bản thiết kế PR 2 mục 3.3 (hợp đồng chữ) — sửa chữ ở component thì sửa ở đây cùng PR.
  await nhom('12 · MUA THỊT VỀ: CHỌN GÓI, TẠM TÍNH, TIN ĐƠN, CHÉP ĐƠN, MỞ ZALO, TẮT JAVASCRIPT, MẤT MẠNG, BỀ RỘNG', async () => {
    const ba = (vi, en, ko) => ({ vi, en, ko });
    // Quyết định 1 (Khánh 26/10/2026): giá trên trang là giá quán đã công bố — câu đầu của c.giaCongBo và hỏi đáp 3.
    const GIA_CONG_BO = ba('Giá từng gói là giá quán đã công bố.', "Each pack's price is the price we have published.", '팩별 가격은 매장에서 공지한 가격이에요.');
    const TAM_HET = ba('Tạm hết ở quầy', 'Sold out at the counter for now', '지금은 매장에 재고가 없어요');
    const LOI_H1 = ba('Chưa tải được danh sách gói', 'We could not load the packs right now', '지금은 팩 목록을 불러오지 못했어요');
    const HET_QUAY = ba('Các gói đang tạm hết ở quầy.', 'Every pack is sold out at the counter for now.', '지금은 모든 팩이 매장에 재고가 없어요.');
    const NHOM_TEN = { mat: ba('Thịt mát', 'Chilled beef', '냉장 소고기'), dong_lanh: ba('Thịt đông lạnh', 'Frozen beef', '냉동 소고기'), kim_chi: ba('Kim chi', 'Kimchi', '김치') };
    // Quyết định 2: gói thịt ghi "khoảng"; số gam không dấu ngăn ở mọi thứ tiếng. Chép tay — không đọc nhanGoi.
    const NHAN_THIT = ba(n => `Gói khoảng ${n} g`, n => `Pack of about ${n} g`, n => `약 ${n} g 팩`);
    const NHAN_HOP = ba(n => `Hộp ${n} g`, n => `${n} g box`, n => `${n} g 통`);
    const DEM_2_1 = ba('2 gói · 1 hộp', '2 packs · 1 box', '2팩 · 1통');
    const DT_GIAO = ba('Giao tận nơi', 'Delivery', '배달');
    const HOI_GIAO = ba('Giao tới đâu, phí bao nhiêu?', 'Where do you deliver, and what does it cost?', '어디까지 배달하고 배달비는 얼마인가요?');
    // Trạng thái chưa mở không mời nhắn, không đưa kênh (ĐS-N4).
    const MOI_NHAN = ba(/nhắn|zalo|gọi/i, /message|zalo|\bcall\b/i, /메시지|zalo|전화/i);
    // Quyết định 3: không giá theo kg hay theo 100 g.
    const GIA_THEO_CAN = /\/\s?kg\b|mỗi\s?kg|per\s?kg|kg\s?당|\b100\s?g\b/i;
    const CHU_DA_XONG = /thành công|đã đặt|đã gửi|\bsuccess|성공/i;
    const TIEN = /\d{1,3}(?:\.\d{3})+[  ]đ/g;
    const motDong = s => (s ?? '').replace(/\s+/g, ' ').trim();
    const boDongGio = tin => tin.split('\n').filter(d => !d.startsWith('Soạn lúc ')).join('\n');
    const duongMua = nn => duongDanTuongUng('/mua-thit-ve', nn);
    const menuCua = (kichBan, nn) => nhomMuaThitVe(menuMuaThitVe(kichBan, nn));
    const chuDich = CHU_DICH.chep_tin_mo_chat_oa;
    /** Dòng "Soạn lúc …" đúng dạng, lệch giờ Việt Nam lúc chạy không quá 2 phút. */
    const gioSoanDung = tin => {
      const dong = tin.split('\n').find(d => d.startsWith('Soạn lúc ')) ?? '';
      const bay = Date.now();
      const hopLe = new Set([-2, -1, 0, 1, 2].map(k => `Soạn lúc ${gioSoanVn(bay + k * 60000)} (giờ Việt Nam)`));
      return /^Soạn lúc \d{2}:\d{2} ngày \d{2}\/\d{2}\/\d{4} \(giờ Việt Nam\)$/.test(dong) && hopLe.has(dong);
    };
    /** Dòng của "Đơn của bạn" mong đợi: chữ của CHU_DON và thành tiền, như component ghép. */
    const dongMong = (don, nn) => don.dong.map(d =>
      motDong(CHU_DON.dongDau[nn](d.sanPham.ten, nhanGoi(d.sanPham.donVi, d.goi.soGam, nn), d.soLuong) + dinhDangTien(d.thanhTien)));

    /** Mở một trang trong context riêng: bề rộng, JavaScript, quyền, script chạy trước trang. */
    const mo = async (duong, { rong = 390, cao, js = true, quyen = [], truoc = null } = {}) => {
      const c = await trinhDuyet.newContext({ viewport: { width: rong, height: cao ?? (rong < 600 ? 844 : 900) }, javaScriptEnabled: js, permissions: quyen });
      if (truoc) await c.addInitScript(truoc);
      const p = await c.newPage();
      const loiJs = [];
      p.on('pageerror', e => loiJs.push(e.message));
      p.on('console', m => { if (m.type() === 'error' && (m.location().url || goc).startsWith(goc)) loiJs.push(m.text()); });
      const batDau = Date.now();
      const r = await p.goto(goc + duong, { waitUntil: 'load', timeout: 60000 });
      return { c, p, r, loiJs, thoiGian: Date.now() - batDau };
    };
    const chupP = async (p, ten) => {
      mkdirSync(ANH_LOI, { recursive: true });
      await p.screenshot({ path: join(ANH_LOI, `mua-thit-${ten.replace(/[^a-z0-9-]+/gi, '_')}.png`), fullPage: true }).catch(() => {});
    };
    /** Đầu trang: số mục của điều hướng (danh mục gọn có đủ, kể cả Hỏi bàn) và có mục Mua thịt về không. */
    const dieuHuong = async (p, nn) => ({
      so: await p.locator('header .mg-muc > li').count(),
      coMua: await p.locator(`header nav a[href="${duongMua(nn)}"]`).count() > 0,
    });
    /** Thẻ sản phẩm đang dựng — theo móc của bản thiết kế PR 2 mục 2.8, 2.9. */
    const docThe = p => p.evaluate(() => [...document.querySelectorAll('#chon-goi article')].map(a => ({
      ten: a.querySelector('h3')?.textContent.trim() ?? '',
      lang: a.querySelector('h3')?.getAttribute('lang') ?? null,
      nhan: [...a.querySelectorAll('.mtv-nhan-goi')].map(e => e.textContent.trim()),
      gia: [...a.querySelectorAll('.mtv-gia[data-tien]')].map(e => e.textContent.trim()),
      tamHet: [...a.querySelectorAll('[data-mtv-tam-het]')].map(e => e.textContent.trim()),
      o: [...a.querySelectorAll('select.mtv-so')].map(e => e.name),
    })));
    // Thứ tự trên trang: theo nhóm (Thịt mát → Thịt đông lạnh → Kim chi), trong nhóm theo database — chiaNhom của lib.
    const theMong = (menu, nn, coOChon) => chiaNhom(menu).flatMap(n => n.sanPham).map(sp => ({
      ten: sp.ten,
      lang: nn !== 'vi' && sp.ten === sp.tenVi ? 'vi' : null,
      nhan: sp.goi.map(g => nhanGoi(sp.donVi, g.soGam, nn)),
      gia: sp.goi.map(g => dinhDangTien(g.gia)),
      tamHet: sp.goi.filter(g => g.tamHet).map(() => TAM_HET[nn]),
      o: coOChon ? sp.goi.filter(g => !g.tamHet).map(g => g.khoa) : [],
    }));
    /** Chữ của cả trang (kể cả details đang đóng), bỏ script, style. */
    const chuDom = (p, chon = 'body') => p.evaluate(chon => {
      const b = document.querySelector(chon)?.cloneNode(true);
      if (!b) return '';
      b.querySelectorAll('script, style, template').forEach(x => x.remove());
      return b.textContent;
    }, chon);
    const moTaMeta = p => p.evaluate(() => document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '');

    // ---- mua-thit-mo: danh sách gói, giá, câu giá, nhãn gói, không giao hàng ----------------------------------
    mayGia.datKichBan('mua-thit-mo');
    for (const nn of NGON_NGU) {
      const duong = duongMua(nn);
      const menu = menuCua('mua-thit-mo', nn);
      const t = chu(nn);
      for (const rong of [390, 1440]) {
        const { c, p, r, loiJs } = await mo(duong, { rong });
        try {
          const nhan = `mua-thit-mo ${duong} · ${rong}px`;
          const the = await docThe(p);
          const tieuDe = await p.evaluate(() => [...document.querySelectorAll('#chon-goi h2, #chon-goi h3')].map(e => e.textContent.trim()));
          const nhomMong = chiaNhom(menu).flatMap(n => [NHOM_TEN[n.loai][nn], ...n.sanPham.map(s => s.ten)]);
          const caTrang = await chuDom(p);
          const nhanHang = await chuDom(p, 'details.mtv-nhan');
          const donCuaBan = await chuDom(p, '.mtv-don');
          const hoiDap = await p.evaluate(() => [...document.querySelectorAll('.cau-hoi details')].map(d => d.textContent));
          const dtNhan = await p.evaluate(() => [...document.querySelectorAll('details.mtv-nhan dt')].map(e => e.textContent.trim()));
          const sp = Object.fromEntries(the.map(x => [x.ten, x]));
          const ten = ma => menu.find(s => s.ma === ma)?.ten;
          const dh = await dieuHuong(p, nn);
          const tot = [
            ok(`${nhan}: HTTP 200, có form GET, đủ sản phẩm của MENU_THU đúng nhóm`,
               r?.status() === 200 && await p.locator('form[data-mtv-form][method="get"]').count() === 1
                 && the.length === menu.length && tieuDe.join('\n').includes(nhomMong.join('\n')),
               `HTTP ${r?.status()}, ${the.length}/${menu.length} thẻ, tiêu đề ${JSON.stringify(tieuDe)}`),
            ok(`${nhan}: mỗi gói hiện giá bằng giá của dữ liệu giả trong .mtv-gia[data-tien]; không chữ "Quán báo giá"`,
               JSON.stringify(the.map(x => x.gia)) === JSON.stringify(theMong(menu, nn, true).map(x => x.gia)) && !/quán báo giá/i.test(caTrang),
               JSON.stringify(the.map(x => x.gia))),
            ok(`${nhan}: có câu "${GIA_CONG_BO[nn]}" ở thẻ Nhận hàng, khối Đơn của bạn và hỏi đáp 3; không chữ "/kg", "mỗi kg", "per kg", "100 g" trên trang`,
               motDong(nhanHang).includes(GIA_CONG_BO[nn]) && motDong(donCuaBan).includes(GIA_CONG_BO[nn])
                 && hoiDap.some(h => motDong(h).includes(GIA_CONG_BO[nn])) && !GIA_THEO_CAN.test(caTrang),
               caTrang.match(GIA_THEO_CAN)?.[0] ?? `nhận hàng ${motDong(nhanHang).includes(GIA_CONG_BO[nn])}, đơn ${motDong(donCuaBan).includes(GIA_CONG_BO[nn])}`),
            ok(`${nhan}: gói tạm hết (Ba chỉ bò Mỹ 400 g): chữ "${TAM_HET[nn]}", vẫn có giá, không ô chọn số`,
               JSON.stringify(sp[ten('ba-chi-bo-my')]?.tamHet) === JSON.stringify([TAM_HET[nn]])
                 && sp[ten('ba-chi-bo-my')]?.gia.length === 2 && JSON.stringify(sp[ten('ba-chi-bo-my')]?.o) === '["ba-chi-bo-my_200"]',
               JSON.stringify(sp[ten('ba-chi-bo-my')])),
            ok(`${nhan}: nhãn gói thịt "${NHAN_THIT[nn](200)}", hộp "${NHAN_HOP[nn](500)}", gói 1000 g ghi "${NHAN_THIT[nn](1000)}"`,
               JSON.stringify(sp[ten('ribeye-cap')]?.nhan) === JSON.stringify([NHAN_THIT[nn](200), NHAN_THIT[nn](400)])
                 && JSON.stringify(sp[ten('kim-chi-cai-thao')]?.nhan) === JSON.stringify([NHAN_HOP[nn](500)])
                 && sp[ten('than-ngoai')]?.nhan.at(-1) === NHAN_THIT[nn](1000)
                 && JSON.stringify(the) === JSON.stringify(theMong(menu, nn, true)),
               JSON.stringify(the.map(x => [x.ten.slice(0, 20), x.nhan, x.o, x.lang]))),
            ok(`${nhan}: LA Galbi (tên ${nn} giống tên tiếng Việt) ${nn === 'vi' ? 'không cần' : 'có'} lang="vi" ở tên`,
               sp['LA Galbi']?.lang === (nn === 'vi' ? null : 'vi'), JSON.stringify(sp['LA Galbi']?.lang)),
            ok(`${nhan}: không ô chọn và không dòng "${DT_GIAO[nn]}" khi mua_thit_giao_hang chưa công bố`,
               await p.locator('select[name="nhan"]').count() === 0 && !dtNhan.includes(DT_GIAO[nn])
                 && !hoiDap.some(h => h.includes(HOI_GIAO[nn])), JSON.stringify(dtNhan)),
            ok(`${nhan}: điều hướng năm mục, có "${t.muaThitVe}"; meta description là câu "mở" (moTaMuaThit)`,
               dh.so === 5 && dh.coMua && await moTaMeta(p) === t.moTaMuaThit, `${dh.so} mục, «${await moTaMeta(p)}»`),
            ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | ')),
          ];
          // Nhận hàng: điện thoại đóng sẵn có dòng tóm tắt (món đầu lên sớm), màn rộng mở sẵn.
          const nhanHangMo = await p.evaluate(() => document.querySelector('details.mtv-nhan')?.open ?? null);
          tot.push(rong < 1024
            ? ok(`${nhan}: "Nhận hàng" đóng sẵn, có dòng tóm tắt`, nhanHangMo === false
                && await p.locator('details.mtv-nhan .mtv-nhan-tom').isVisible() && !!motDong(await p.locator('details.mtv-nhan .mtv-nhan-tom').textContent()))
            : ok(`${nhan}: "Nhận hàng" mở sẵn`, nhanHangMo === true));
          if (tot.includes(false)) await chupP(p, `mo-${nn}-${rong}`);
        } finally {
          await c.close();
        }
      }
    }

    // ---- mua-thit-mo: chọn gói, tạm tính, tin đơn, chép đơn, nút gửi, Back --------------------------------------
    for (const nn of NGON_NGU) {
      mayGia.datKichBan('mua-thit-mo');
      const duong = duongMua(nn);
      const menu = menuCua('mua-thit-mo', nn);
      const ribeye = menu.find(s => s.ma === 'ribeye-cap');
      const gio = new Map([[khoaGoi('ribeye-cap', 200), 2], [khoaGoi('kim-chi-cai-thao', 500), 1]]);
      const don = tinhDon(gio, 'quay', menu);
      const nhan = `mua-thit-mo ${duong}`;
      const { c, p, loiJs } = await mo(duong, { rong: 390, quyen: ['clipboard-read', 'clipboard-write'] });
      try {
        const cong = p.locator('select.mtv-so[name="ribeye-cap_200"]').locator('xpath=..').locator('button[data-mtv-buoc="1"]');
        await cong.click();
        const vuaDoi = CHU_DON.vuaDoi[nn](ribeye.ten, nhanGoi('goi', 200, nn), 1);
        const vung = motDong(await p.locator('[data-mtv-tam-tinh]').textContent());
        const tot = [
          ok(`${nhan}: bấm +: vùng aria-live có "${vuaDoi}" rồi tạm tính`,
             motDong(await p.locator('[data-mtv-vua-doi]').textContent()) === vuaDoi && vung.startsWith(vuaDoi)
               && vung.endsWith(`${CHU_DON.tamTinh[nn]}: ${dinhDangTien(400000)}`)
               && await p.locator('[data-mtv-tam-tinh]').getAttribute('aria-live') === 'polite', `«${vung}»`),
        ];
        await cong.click();
        await p.locator('select.mtv-so[name="kim-chi-cai-thao_500"]').selectOption('1');
        const kq = await p.evaluate(() => ({
          tamTinh: document.querySelector('[data-mtv-tam-tinh] [data-tien]')?.textContent.trim() ?? null,
          dem: document.querySelector('[data-mtv-dem]')?.textContent.trim() ?? null,
          dong: [...document.querySelectorAll('[data-mtv-dong-don] li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()),
          tin: document.querySelector('#mtv-tin')?.value ?? null,
        }));
        tot.push(
          ok(`${nhan}: chọn 2 gói Ribeye 200 g và 1 hộp kim chi: tạm tính 890.000 đ, đếm "${DEM_2_1[nn]}"`,
             kq.tamTinh === '890.000 đ' && dinhDangTien(don.tamTinh) === '890.000 đ' && kq.dem === DEM_2_1[nn]
               && JSON.stringify(kq.dong) === JSON.stringify(dongMong(don, nn)), JSON.stringify(kq)),
          ok(`${nhan}: tin đơn trong khung đúng từng dòng của taoTinDon; dòng "Soạn lúc" đúng dạng, lệch giờ Việt Nam lúc chạy không quá 2 phút`,
             !!kq.tin && boDongGio(kq.tin) === boDongGio(taoTinDon(don, nn, Date.now())) && gioSoanDung(kq.tin), kq.tin ?? 'không có khung tin'),
          ok(`${nhan}: thanh dưới hiện, có link "Xem đơn"`,
             await p.locator('[data-mtv-thanh]').isVisible() && await p.locator('[data-mtv-thanh-xem]').isVisible()),
        );

        // Mọi số tiền nằm trong [data-tien], và là giá gói, thành tiền hay tạm tính của dữ liệu giả.
        const tien = await p.evaluate(() => {
          const MAU = /\d{1,3}(?:\.\d{3})+[  ]?đ/;
          const ngoai = [];
          const di = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          for (let n = di.nextNode(); n; n = di.nextNode()) {
            if (n.parentElement?.closest('script, style, template, textarea')) continue;
            if (MAU.test(n.textContent) && !n.parentElement?.closest('[data-tien]')) ngoai.push(n.textContent.trim().slice(0, 80));
          }
          const trong = [...document.querySelectorAll('[data-tien]')].map(e => (e.tagName === 'TEXTAREA' ? e.value : e.textContent.trim()));
          return { ngoai, trong };
        });
        const duocPhep = new Set([...menu.flatMap(s => s.goi.map(g => g.gia)), ...don.dong.map(d => d.thanhTien), don.tamTinh, 0].map(dinhDangTien));
        const laTien = new Set(tien.trong.flatMap(x => x.match(TIEN) ?? (/^\d/.test(x) ? [x] : [])));
        const sai = [...laTien].filter(x => !duocPhep.has(x));
        tot.push(ok(`${nhan}: mọi số tiền trên trang nằm trong [data-tien] và bằng giá gói, thành tiền hoặc tạm tính của dữ liệu giả`,
          tien.ngoai.length === 0 && sai.length === 0 && laTien.size > 0, `ngoài data-tien: ${JSON.stringify(tien.ngoai)} · lạ: ${JSON.stringify(sai)}`));
        const ma = (s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;'))(kq.tin ?? '');
        const cam = timChuoiCam(chuHienRa(boTienDaChot(`${await p.content()}<textarea data-tien>${ma}</textarea>`, duong)));
        tot.push(ok(`${nhan}: không chữ cấm ngoài số tiền đã chốt (chuHienRa + boTienDaChot trên HTML của trang, cả tin đơn)`,
          cam.length === 0, cam.map(x => x.tim_thay).join(' · ')));

        // Chép đơn (đã cấp quyền clipboard). Lệnh chép giả chậm 400ms: câu "Đã chép" chỉ được hiện SAU khi lệnh xong.
        await p.evaluate(() => {
          const bao = document.querySelector('[data-mtv-bao]');
          window.__bao = [];
          if (bao) new MutationObserver(() => window.__bao.push({ chu: bao.textContent.trim(), luc: performance.now() }))
            .observe(bao, { childList: true, characterData: true, subtree: true });
          const goc = navigator.clipboard.writeText.bind(navigator.clipboard);
          navigator.clipboard.writeText = async chu => {
            window.__nhanChep = chu;
            await new Promise(x => setTimeout(x, 400));
            await goc(chu);
            window.__xongLuc = performance.now();
          };
        });
        await p.bringToFront();
        await p.locator('[data-mtv-chep]').click();
        await p.waitForFunction(t => document.querySelector('[data-mtv-bao]')?.textContent.trim() === t, chuDich.daChep[nn], { timeout: 5000 }).catch(() => {});
        const chep = await p.evaluate(async () => ({
          bao: window.__bao, xongLuc: window.__xongLuc ?? null, tin: document.querySelector('#mtv-tin')?.value ?? null,
          nhanChep: window.__nhanChep ?? null,
          boNho: await navigator.clipboard.readText().catch(e => `LỖI ${e.message}`),
        }));
        const lanDau = chep.bao.find(x => x.chu === chuDich.daChep[nn]);
        tot.push(ok(`${nhan}: bấm Chép đơn (đã cấp quyền clipboard): "${chuDich.daChep[nn]}" chỉ sau khi chép xong, bộ nhớ tạm bằng đúng khung đơn`,
          !!lanDau && chep.xongLuc !== null && lanDau.luc >= chep.xongLuc && chep.nhanChep === chep.tin && chep.boNho === chep.tin && !!chep.tin,
          JSON.stringify({ bao: chep.bao, xongLuc: chep.xongLuc, lenhChepNhanDungKhung: chep.nhanChep === chep.tin, boNho: chep.boNho.slice(0, 60) })));

        // Máy từ chối chép: không bao giờ "Đã chép", câu chép tay hiện, chữ trong khung được chọn hết.
        await p.evaluate(() => {
          window.__bao = [];
          navigator.clipboard.writeText = () => Promise.reject(new DOMException('Không cho chép', 'NotAllowedError'));
        });
        await p.locator('[data-mtv-chep]').click();
        await p.waitForFunction(t => document.querySelector('[data-mtv-bao]')?.textContent.trim() === t, chuDich.chepLoi[nn], { timeout: 5000 }).catch(() => {});
        const tuChoi = await p.evaluate(() => {
          const ta = document.querySelector('#mtv-tin');
          return {
            bao: window.__bao.map(x => x.chu),
            chonHet: !!ta && document.activeElement === ta && ta.selectionStart === 0 && ta.selectionEnd === ta.value.length && ta.value.length > 0,
          };
        });
        tot.push(ok(`${nhan}: clipboard bị từ chối (writeText reject): không "Đã chép", câu chép tay hiện, chữ trong khung được chọn hết`,
          !tuChoi.bao.includes(chuDich.daChep[nn]) && tuChoi.bao.includes(chuDich.chepLoi[nn])
            && await p.locator('[data-mtv-chep-tay]').isVisible() && tuChoi.chonHet, JSON.stringify(tuChoi)));

        // Nút gửi: <a> thật, tới đúng link Zalo OA đã công bố. Có hotline → dòng "Không dùng Zalo?" có link tel:.
        const gui = await p.evaluate(() => {
          const a = document.querySelector('[data-mtv-gui]');
          return a && { the: a.tagName, href: a.getAttribute('href') };
        });
        tot.push(
          ok(`${nhan}: nút gửi là <a> thật, href đúng zalo_oa_url đã công bố`,
             gui?.the === 'A' && gui.href === ZALO_OA_THU && await p.locator('a[data-mtv-gui]').isVisible(), JSON.stringify(gui)),
          ok(`${nhan}: có hotline: dòng "Không dùng Zalo?" có link tel:`,
             await p.locator('[data-mtv-khong-zalo]').isVisible() && await p.locator('[data-mtv-khong-zalo] a[href^="tel:"]').count() === 1),
          ok(`${nhan}: không "thành công", "đã đặt", "đã gửi" trên trang`, !CHU_DA_XONG.test(await chuDom(p, 'main')),
             (await chuDom(p, 'main')).match(CHU_DA_XONG)?.[0]),
        );

        // Gửi form (Xem đơn): địa chỉ mang giỏ, bỏ ô bằng 0; rồi bấm Back — ô chọn còn bấm được, "Đơn của bạn" khớp ô chọn.
        await Promise.all([
          p.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
          p.locator('form[data-mtv-form] button[type="submit"]').click(),
        ]);
        const diaChi = new URL(p.url());
        tot.push(ok(`${nhan}: "Xem đơn" là form GET — địa chỉ mang giỏ (ribeye-cap_200=2, kim-chi-cai-thao_500=1), không ô bằng 0, tới #xem-don; tin đơn của máy chủ đúng`,
          diaChi.pathname === duong && diaChi.searchParams.get('ribeye-cap_200') === '2' && diaChi.searchParams.get('kim-chi-cai-thao_500') === '1'
            && ![...diaChi.searchParams.values()].includes('0') && diaChi.hash === '#xem-don'
            && boDongGio(await p.locator('#mtv-tin').inputValue()) === boDongGio(taoTinDon(don, nn, Date.now())),
          p.url()));
        await p.goBack({ waitUntil: 'load' });
        await cho(300);
        const sau = await p.evaluate(() => ({
          o: [...document.querySelectorAll('select.mtv-so')].map(o => ({ ten: o.name, giaTri: o.value, tat: o.disabled })),
          dong: [...document.querySelectorAll('[data-mtv-dong-don] li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()),
          tamTinh: document.querySelector('[data-mtv-tam-tinh] [data-tien]')?.textContent.trim() ?? null,
        }));
        const donSau = tinhDon(new Map(sau.o.filter(o => o.giaTri !== '0').map(o => [o.ten, Number(o.giaTri)])), 'quay', menu);
        tot.push(ok(`${nhan}: gửi đơn rồi bấm Back: mọi ô chọn bấm được, "Đơn của bạn" khớp ô chọn`,
          sau.o.length > 0 && sau.o.every(o => !o.tat) && await p.locator('select.mtv-so').first().isEnabled()
            && JSON.stringify(sau.dong) === JSON.stringify(dongMong(donSau, nn)) && sau.tamTinh === dinhDangTien(donSau.tamTinh),
          JSON.stringify(sau)));
        tot.push(ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | ')));
        if (tot.includes(false)) await chupP(p, `chon-${nn}`);
      } finally {
        await c.close();
      }

      // Trình duyệt không có navigator.clipboard (xóa trước khi script chạy): không nút Chép, câu chép tay hiện.
      const khong = await mo(`${duong}?ribeye-cap_200=1`, {
        truoc: () => { try { Object.defineProperty(Navigator.prototype, 'clipboard', { configurable: true, get: () => undefined }); } catch { /* bỏ qua */ } },
      });
      try {
        ok(`${nhan}: trình duyệt không có navigator.clipboard: nút Chép đơn không hiện, câu chép tay hiện`,
           await khong.p.evaluate(() => navigator.clipboard === undefined)
             && !(await khong.p.locator('[data-mtv-chep]').isVisible()) && await khong.p.locator('[data-mtv-chep-tay]').isVisible()
             && khong.loiJs.length === 0, khong.loiJs.join(' | '));
      } finally {
        await khong.c.close();
      }

      // Tải lại trang có tham số: thanh dưới và tạm tính đúng ngay khi trang hiện.
      const lai = await mo(`${duong}?ribeye-cap_200=2`);
      try {
        await lai.p.reload({ waitUntil: 'load' });
        const thanh = motDong(await lai.p.locator('[data-mtv-thanh]').innerText().catch(() => ''));
        ok(`${nhan}: tải lại trang có ?ribeye-cap_200=2: thanh dưới và tạm tính đúng ngay khi trang hiện`,
           await lai.p.locator('[data-mtv-thanh]').isVisible() && thanh.includes(dinhDangTien(800000))
             && await lai.p.locator('[data-mtv-tam-tinh] [data-tien]').textContent() === dinhDangTien(800000), `«${thanh}»`);
      } finally {
        await lai.c.close();
      }

      // Số gói sai kiểu trên địa chỉ trang: không thành 1000 gói, không thành 1 gói.
      for (const giaTri of nn === 'vi' ? ['1.000', '1,5', '11', '01', '-1', 'abc'] : ['1.000']) {
        const x = await mo(`${duong}?ribeye-cap_200=${encodeURIComponent(giaTri)}`);
        try {
          ok(`${nhan}: địa chỉ "?ribeye-cap_200=${giaTri}" → không dòng đơn nào, không ${giaTri} gói`,
             await x.p.locator('[data-mtv-dong-don] li').count() === 0 && !(await x.p.locator('[data-mtv-xem-don]').isVisible())
               && await x.p.locator('select.mtv-so[name="ribeye-cap_200"]').inputValue() === '0');
        } finally {
          await x.c.close();
        }
      }

      // Gói vừa "Tạm hết ở quầy" giữa lúc khách chọn và lúc bấm Xem đơn (ba-chi-bo-my 400 g tạm hết trong MENU_THU):
      // giỏ chỉ có gói đó thì đơn trống — trang vẫn phải nói vì sao, ở #xem-don, có và không có JavaScript.
      const BO_TAM_HET = ba('Có gói vừa tạm hết ở quầy nên không có trong đơn.',
        'A pack you chose is sold out at the counter for now, so it is not in the order.',
        '고르신 팩 중 지금 매장에 재고가 없는 팩은 주문에서 빠졌어요.');
      for (const js of nn === 'vi' ? [true, false] : [true]) {
        const het = await mo(`${duong}?ba-chi-bo-my_400=2#xem-don`, { js });
        try {
          const xem = het.p.locator('#xem-don');
          const chu = motDong(await het.p.locator('[data-mtv-xem-don]').innerText().catch(() => ''));
          ok(`${nhan}${js ? '' : ' · tắt JavaScript'}: giỏ chỉ có gói vừa tạm hết → #xem-don hiện câu "${BO_TAM_HET[nn]}", không dòng đơn, không nút gửi`,
             await xem.isVisible() && chu.includes(BO_TAM_HET[nn])
               && await het.p.locator('[data-mtv-xem-dong] li').count() === 0
               && !(await het.p.locator('a[data-mtv-gui]').isVisible()) && !(await het.p.locator('#mtv-tin').isVisible())
               && het.loiJs.length === 0,
             `«${chu.slice(0, 160)}» · ${het.loiJs.join(' | ')}`);
        } finally {
          await het.c.close();
        }
      }
      const vaHet = await mo(`${duong}?ribeye-cap_200=1&ba-chi-bo-my_400=2#xem-don`);
      try {
        const chu = motDong(await vaHet.p.locator('[data-mtv-xem-don]').innerText().catch(() => ''));
        ok(`${nhan}: giỏ có một gói đặt được và một gói vừa tạm hết → đơn có gói đặt được, câu tạm hết hiện, nút gửi hiện`,
           chu.includes(BO_TAM_HET[nn]) && await vaHet.p.locator('[data-mtv-xem-dong] li').count() === 1
             && await vaHet.p.locator('a[data-mtv-gui]').isVisible() && vaHet.loiJs.length === 0, `«${chu.slice(0, 160)}»`);
      } finally {
        await vaHet.c.close();
      }

      // Tắt JavaScript: chọn số, bấm "Xem đơn" → máy chủ dựng #xem-don có tin đơn như bản có JavaScript (trừ dòng giờ).
      const tat = await mo(duong, { js: false });
      try {
        await tat.p.locator('select.mtv-so[name="ribeye-cap_200"]').selectOption('2');
        await tat.p.locator('select.mtv-so[name="kim-chi-cai-thao_500"]').selectOption('1');
        await Promise.all([
          tat.p.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
          tat.p.locator('form[data-mtv-form] button[type="submit"]').click(),
        ]);
        const tin = await tat.p.locator('#mtv-tin').inputValue().catch(() => '');
        const anCa = [];
        for (const chon of ['[data-mtv-chep]', 'button[data-mtv-buoc]', '[data-mtv-thanh]']) {
          const l = tat.p.locator(chon);
          for (let i = 0; i < await l.count(); i++) if (await l.nth(i).isVisible()) { anCa.push(chon); break; }
        }
        ok(`${nhan}: tắt JavaScript: chọn số, bấm Xem đơn → #xem-don có tin đơn giống bản có JavaScript (trừ dòng giờ); nút Chép, −/+, thanh dưới không hiện`,
           await tat.p.locator('#xem-don').isVisible() && boDongGio(tin) === boDongGio(taoTinDon(don, nn, Date.now())) && gioSoanDung(tin)
             && anCa.length === 0 && await tat.p.locator('a[data-mtv-gui]').getAttribute('href') === ZALO_OA_THU
             && await tat.p.locator('[data-mtv-chep-tay]').isVisible(),
           `hiện: ${anCa.join(', ') || 'không'} · tin «${tin.slice(0, 120)}»`);
        ok(`${nhan}: tắt JavaScript: "Nhận hàng" đóng, bấm để mở`,
           await tat.p.evaluate(() => document.querySelector('details.mtv-nhan')?.open) === false);
      } finally {
        await tat.c.close();
      }
    }

    // ---- mua-thit-giao: cách nhận, giao tận nơi, không hotline ---------------------------------------------------
    mayGia.datKichBan('mua-thit-giao');
    for (const nn of NGON_NGU) {
      const duong = duongMua(nn);
      const menu = menuCua('mua-thit-giao', nn);
      const nhan = `mua-thit-giao ${duong}`;
      const { c, p, loiJs } = await mo(duong);
      try {
        const dtNhan = await p.evaluate(() => [...document.querySelectorAll('details.mtv-nhan dt')].map(e => e.textContent.trim()));
        const hoiDap = await p.evaluate(() => [...document.querySelectorAll('.cau-hoi summary')].map(e => e.textContent.trim()));
        const tot = [
          ok(`${nhan}: có ô chọn cách nhận, dòng "${DT_GIAO[nn]}", hỏi đáp giao hàng`,
             await p.locator('select[name="nhan"]').isVisible() && dtNhan.includes(DT_GIAO[nn]) && hoiDap.some(h => h.includes(HOI_GIAO[nn])),
             JSON.stringify({ dtNhan, hoiDap: hoiDap.length })),
        ];
        await p.locator('select.mtv-so[name="ribeye-cap_200"]').selectOption('1');
        await p.locator('select[name="nhan"]').selectOption('giao');
        const tin = await p.locator('#mtv-tin').inputValue();
        const don = tinhDon(new Map([[khoaGoi('ribeye-cap', 200), 1]]), 'giao', menu);
        tot.push(
          ok(`${nhan}: chọn giao → tin đơn có dòng giao và "chưa gồm phí giao"`,
             tin.includes('Nhận: giao tận nơi') && tin.includes('chưa gồm phí giao') && boDongGio(tin) === boDongGio(taoTinDon(don, nn, Date.now())), tin),
          ok(`${nhan} (không hotline): không có dòng "Không dùng Zalo?"`, await p.locator('[data-mtv-khong-zalo]').count() === 0),
          ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | ')),
        );
        if (tot.includes(false)) await chupP(p, `giao-${nn}`);
      } finally {
        await c.close();
      }
    }

    // ---- Bề rộng: 320 (vi, ko), 360, 1440px; 390px thanh dưới; 844 × 390 điện thoại xoay ngang ----------------
    mayGia.datKichBan('mua-thit-mo');
    const doTrangMua = async (p, nhan) => {
      await p.mouse.move(0, 0);
      await cho(300);
      const gd = await p.evaluate(doGiaoDien);
      const saiGd = Object.keys(PHEP_DO).flatMap(khoa => (gd[khoa] ?? ['không đo được']).map(x => `[${khoa}] ${x}`));
      const kq = await p.evaluate(() => ({ rong: document.documentElement.scrollWidth, khung: innerWidth }));
      return [
        ok(`${nhan}: không tràn ngang`, kq.rong <= kq.khung + 1, `rộng ${kq.rong}px > khung ${kq.khung}px`),
        ok(`${nhan}: đủ ${Object.keys(PHEP_DO).length} phép đo của do-giao-dien.mjs`, saiGd.length === 0, saiGd.slice(0, 5).join(' | ')),
      ];
    };
    for (const [rong, nn] of [[320, 'vi'], [320, 'ko'], [360, 'vi'], [1440, 'vi']]) {
      for (const tham of ['', '?ribeye-cap_200=2&than-lung-cat-day_400=1&kim-chi-cai-thao_500=1']) {
        const duong = duongMua(nn) + tham;
        const { c, p, loiJs } = await mo(duong, { rong });
        try {
          const nhan = `mua-thit-mo ${duong} · ${rong}px`;
          const tot = [...await doTrangMua(p, nhan), ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | '))];
          if (tot.includes(false)) await chupP(p, `rong-${nn}-${rong}${tham ? '-gio' : ''}`);
        } finally {
          await c.close();
        }
      }
    }
    for (const nn of NGON_NGU) {
      const duong = duongMua(nn);
      const { c, p } = await mo(duong, { rong: 390 });
      try {
        const nhan = `mua-thit-mo ${duong} · 390px`;
        // innerText: chỉ chữ đang hiện — link "Xem đơn" (hidden khi giỏ rỗng) không tính.
        const chuThanh = motDong(await p.locator('[data-mtv-thanh]').innerText().catch(() => ''));
        const tot = [ok(`${nhan}: thanh dưới hiện, giỏ rỗng ghi "${CHU_DON.donTrong[nn]}", chưa có link "Xem đơn"`,
          await p.locator('[data-mtv-thanh]').isVisible() && chuThanh === CHU_DON.donTrong[nn]
            && !(await p.locator('[data-mtv-thanh-xem]').isVisible()), `«${chuThanh}»`)];
        // Tab tới ô chọn cuối danh sách: ô không bị thanh dưới che.
        const o = p.locator('select.mtv-so');
        const soO = await o.count();
        await o.nth(Math.max(0, soO - 2)).focus();
        const laOCuoi = () => p.evaluate(() => document.activeElement === [...document.querySelectorAll('select.mtv-so')].at(-1));
        for (let i = 0; i < 8 && !(await laOCuoi()); i++) await p.keyboard.press('Tab');
        await cho(200);
        const che = await p.evaluate(() => {
          const oCuoi = [...document.querySelectorAll('select.mtv-so')].at(-1);
          const thanh = document.querySelector('[data-mtv-thanh]');
          return { laOCuoi: document.activeElement === oCuoi, day: oCuoi?.getBoundingClientRect().bottom, dinhThanh: thanh?.getBoundingClientRect().top, cao: innerHeight };
        });
        tot.push(ok(`${nhan}: Tab tới ô chọn cuối danh sách → ô không bị thanh che`,
          che.laOCuoi && che.day <= che.dinhThanh + 0.5 && che.day <= che.cao, JSON.stringify(che)));
        // Có giỏ: cuộn hết trang — thanh dừng trước khối "Xem lại đơn" (thanh nằm trong form).
        await o.first().selectOption('1');
        await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        await cho(200);
        const dung = await p.evaluate(() => {
          const thanh = document.querySelector('[data-mtv-thanh]')?.getBoundingClientRect();
          const xem = document.querySelector('[data-mtv-xem-don]')?.getBoundingClientRect();
          return thanh && xem ? { dayThanh: thanh.bottom, dinhXem: xem.top } : null;
        });
        tot.push(ok(`${nhan}: thanh dừng trước khối Xem lại đơn`, !!dung && dung.dayThanh <= dung.dinhXem + 0.5
          && await p.locator('[data-mtv-xem-don]').isVisible(), JSON.stringify(dung)));
        if (tot.includes(false)) await chupP(p, `thanh-${nn}`);
      } finally {
        await c.close();
      }
    }
    {
      const duong = `${duongMua('vi')}?ribeye-cap_200=2`;
      const { c, p, loiJs } = await mo(duong, { rong: 844, cao: 390 });
      try {
        const nhan = `mua-thit-mo ${duong} · 844 × 390 (điện thoại xoay ngang)`;
        const tot = [
          ok(`${nhan}: không thanh dưới`, !(await p.locator('[data-mtv-thanh]').isVisible())),
          ...await doTrangMua(p, nhan),
          ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | ')),
        ];
        if (tot.includes(false)) await chupP(p, 'xoay-ngang');
      } finally {
        await c.close();
      }
    }

    // ---- 1080 và 1279px: đầu trang đủ năm mục trên một hàng -------------------------------------------------------
    for (const nn of NGON_NGU) {
      for (const duong of [duongDanTuongUng('/', nn), duongDanTuongUng('/thuc-don', nn), duongMua(nn)]) {
        for (const rong of [1080, 1279]) {
          const { c, p } = await mo(duong, { rong });
          try {
            const dau = await p.evaluate(() => {
              const k = e => e.getBoundingClientRect();
              const hien = e => !!e && e.checkVisibility() && k(e).width > 0;
              const muc = [...document.querySelectorAll('header .dt-nav a')].filter(hien);
              const hoiBan = document.querySelector('header .dt-hoi-ban');
              const ngonNgu = document.querySelector('header .dt-ngon-ngu');
              const logo = document.querySelector('header .dt-logo');
              const hang = [logo, ...muc, ngonNgu, hoiBan].filter(Boolean);
              const chong = [];
              for (let i = 1; i < hang.length; i++) if (k(hang[i - 1]).right > k(hang[i]).left + 0.5) chong.push(`${hang[i - 1].textContent.trim() || hang[i - 1].className} / ${hang[i].textContent.trim() || hang[i].className}`);
              const soDong = e => { const v = document.createRange(); v.selectNodeContents(e); return new Set([...v.getClientRects()].filter(x => x.width >= 1).map(x => Math.round(x.top))).size; };
              const dinh = muc.map(e => k(e).top);
              return {
                muc: muc.map(e => e.textContent.trim()), hoiBan: hien(hoiBan), ngonNgu: hien(ngonNgu),
                motHang: dinh.length > 0 && Math.max(...dinh) - Math.min(...dinh) < 2 && muc.every(e => soDong(e) === 1),
                chong, menuGon: hien(document.querySelector('header .menu-gon > summary')),
                tran: Math.max(...hang.map(e => k(e).right)) > innerWidth + 0.5 || document.documentElement.scrollWidth > innerWidth + 1,
              };
            });
            const nhan = `mua-thit-mo ${duong} · ${rong}px [${nn}]`;
            if (!ok(`${nhan}: thanh đầu trang đủ năm mục trên một hàng (có "${chu(nn).muaThitVe}"), không chồng lên bộ chọn ngôn ngữ và nút Hỏi bàn`,
                    dau.muc.length === 4 && dau.muc.includes(chu(nn).muaThitVe) && dau.hoiBan && dau.ngonNgu && dau.motHang
                      && dau.chong.length === 0 && !dau.menuGon && !dau.tran, JSON.stringify(dau))) await chupP(p, `dau-trang-${nn}-${rong}-${tenTep(duong)}`);
          } finally {
            await c.close();
          }
        }
      }
    }

    // ---- mua-thit-het-quay: liệt kê gói và giá, mọi gói tạm hết, không form ------------------------------------
    mayGia.datKichBan('mua-thit-het-quay');
    for (const nn of NGON_NGU) {
      const duong = duongMua(nn);
      const menu = menuCua('mua-thit-het-quay', nn);
      const { c, p, loiJs } = await mo(duong);
      try {
        const nhan = `mua-thit-het-quay ${duong}`;
        const the = await docThe(p);
        const dh = await dieuHuong(p, nn);
        const het = p.locator('[data-mtv-het-quay]');
        const tot = [
          ok(`${nhan}: năm mục điều hướng, có gói và giá, mọi gói "${TAM_HET[nn]}", không form, không thanh dưới, có câu tạm hết và nút Zalo`,
             dh.so === 5 && dh.coMua && JSON.stringify(the) === JSON.stringify(theMong(menu, nn, false))
               && the.every(x => x.gia.length > 0 && x.tamHet.length === x.gia.length)
               && await p.locator('form').count() === 0 && await p.locator('[data-mtv-thanh]').count() === 0
               && await het.isVisible() && motDong(await het.textContent()).includes(HET_QUAY[nn])
               && await het.locator(`a.nut[href="${ZALO_OA_THU}"]`).count() === 1,
             JSON.stringify({ dh, the: the.length, het: motDong(await het.textContent().catch(() => '')) })),
          ok(`${nhan}: meta description là câu "mở" (moTaMuaThit)`, await moTaMeta(p) === chu(nn).moTaMuaThit, await moTaMeta(p)),
          ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | ')),
        ];
        if (tot.includes(false)) await chupP(p, `het-quay-${nn}`);
      } finally {
        await c.close();
      }
    }

    // ---- mua-thit-loi / -dut / -treo: không giá, không form; "chưa tải được" và nút Zalo ----------------------
    for (const kichBan of ['mua-thit-loi', 'mua-thit-dut', 'mua-thit-treo']) {
      mayGia.datKichBan(kichBan);
      for (const nn of NGON_NGU) {
        const duong = duongMua(nn);
        const { c, p, r, loiJs, thoiGian } = await mo(duong);
        try {
          const nhan = `${kichBan} ${duong}`;
          const h1 = motDong(await p.locator('main h1').first().textContent().catch(() => ''));
          const tot = [
            ok(`${nhan}: không giá, không form, có câu "${LOI_H1[nn]}" và nút Zalo; meta description là câu chưa mở`,
               r?.status() === 200 && await p.locator('[data-tien]').count() === 0 && await p.locator('form').count() === 0
                 && h1 === LOI_H1[nn] && await p.locator(`main a.nut[href="${ZALO_OA_THU}"]`).count() === 1
                 && await moTaMeta(p) === chu(nn).moTaMuaThitChuaMo, `HTTP ${r?.status()}, h1 «${h1}», mô tả «${await moTaMeta(p)}»`),
            ok(`${nhan}: điều hướng năm mục (công tắc hiệu lực của database đang bật)`, (await dieuHuong(p, nn)).so === 5),
            ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | ')),
          ];
          if (kichBan === 'mua-thit-treo') tot.push(ok(`${nhan}: database không trả lời — trang trả lời trong 6 giây`, thoiGian < 6000, `${thoiGian} ms`));
          if (tot.includes(false)) await chupP(p, `${kichBan}-${nn}`);
        } finally {
          await c.close();
        }
      }
    }

    // ---- Chưa mở: chưa công bố, công tắc tắt, chưa có link Zalo, link lạ; và đua (menu rỗng) -------------------
    for (const kichBan of ['rong', 'day-du', 'mua-thit-rong', 'mua-thit-khong-zalo', 'mua-thit-zalo-la', 'mua-thit-lech']) {
      mayGia.datKichBan(kichBan);
      for (const nn of NGON_NGU) {
        const duong = duongMua(nn);
        const { c, p, r, loiJs } = await mo(duong);
        try {
          const nhan = `${kichBan} ${duong}`;
          const chuChinh = await p.locator('main').innerText().catch(() => '');
          const kenh = await p.locator('main a.nut, main a[href*="zalo.me"], main a[href^="tel:"], main a[href*="facebook.com"]').count();
          const dh = await dieuHuong(p, nn);
          const tot = [
            ok(`${nhan}: không form, không giá, không lỗi JavaScript`,
               r?.status() === 200 && await p.locator('form').count() === 0 && await p.locator('[data-tien]').count() === 0 && loiJs.length === 0,
               `HTTP ${r?.status()} ${loiJs.slice(0, 2).join(' | ')}`),
          ];
          // mua-thit-lech: database nói mở (năm mục) mà lời gọi menu song song trả rỗng — giới hạn chấp nhận (mục 2.5).
          if (kichBan !== 'mua-thit-lech') {
            tot.push(ok(`${nhan}: trạng thái chưa mở — không câu mời nhắn, không nút kênh; điều hướng bốn mục; meta description là câu chưa mở`,
              !MOI_NHAN[nn].test(chuChinh) && kenh === 0 && dh.so === 4 && !dh.coMua && await moTaMeta(p) === chu(nn).moTaMuaThitChuaMo,
              `${dh.so} mục, ${kenh} nút/link kênh, mô tả «${await moTaMeta(p)}», chữ «${motDong(chuChinh).slice(0, 160)}»`));
          }
          if (tot.includes(false)) await chupP(p, `${kichBan}-${nn}`);
        } finally {
          await c.close();
        }
      }
    }
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  await nhom('13 · META PIXEL KHI ĐÃ NỐI DATABASE: LEAD CHỈ SAU KHI DATABASE NHẬN, CONTACT, XEM ĐƠN, ĐỊA CHỈ TRANG KHÔNG MANG SỐ ĐIỆN THOẠI', async () => {
    const thamSo = duong => ({ content_name: duongDanTuongUng(duong, 'vi').replace(/^\//, '') || 'trang-chu', language: ngonNguCua(duong) });
    const tenSuKien = lenh => suKienTrong(lenh).map(l => l[1]);
    /** Một context mới (sessionStorage sạch), Meta bị chặn: lời gọi fbq nằm trong hàng đợi của trang. */
    const moTrang = async () => {
      const c = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
      const p = await c.newPage();
      const loiJs = [];
      p.on('pageerror', e => loiJs.push(e.message));
      return { c, p, loiJs };
    };
    const dienVaGui = async (p, { dup = false } = {}) => {
      const nhan = p.locator('form[data-hoi-ban] label:has(input[name="gio"]:not([disabled]))').first();
      if (await nhan.count()) await nhan.click();
      else await p.locator('form[data-hoi-ban] input[name="gio"]:not([disabled])').first().check({ force: true });
      await p.fill('form[data-hoi-ban] [name="ho_ten"]', KHACH.ho_ten);
      await p.fill('form[data-hoi-ban] [name="sdt"]', KHACH.sdt);
      const nut = p.locator('form[data-hoi-ban] [type="submit"]').first();
      await nut.scrollIntoViewIfNeeded();
      const hop = await nut.boundingBox();
      const sau = p.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
      if (dup) await p.mouse.dblclick(hop.x + hop.width / 2, hop.y + hop.height / 2);
      else await p.mouse.click(hop.x + hop.width / 2, hop.y + hop.height / 2);
      const traLoi = await sau;
      await p.waitForLoadState('networkidle').catch(() => {});
      await cho(dup ? 1000 : 300);
      return traLoi;
    };
    const coChuKhach = s => s.includes(KHACH.sdt) || s.includes(KHACH.sdt.slice(1)) || s.includes(KHACH.ho_ten);

    for (const nn of NGON_NGU) {
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      for (const dup of [false, true]) {
        mayGia.datKichBan('day-du', dup ? { cham: 1500 } : {});
        const { c, p, loiJs } = await moTrang();
        await p.goto(goc + hoiBan, { waitUntil: 'load' });
        const truoc = tenSuKien(await p.evaluate(docHangDoi));
        const traLoi = await dienVaGui(p, { dup });
        const htmlDaNhan = await traLoi?.text().catch(() => '') ?? '';
        const lenh = await p.evaluate(docHangDoi);
        const ma = (await p.locator('[data-ket-qua="da-nhan"]').getAttribute('data-ma').catch(() => null)) ?? '';
        const diaChi = p.url();
        await p.reload({ waitUntil: 'load' });
        const sauTaiLai = tenSuKien(await p.evaluate(docHangDoi));
        // Bấm Back về trang "đã nhận" mà trình duyệt lấy trang từ bộ nhớ đệm (không qua bfcache — hay gặp ở trình duyệt
        // trong app Facebook, Zalo): cùng HTML đó dựng lại, script chạy lại. Giả bằng route trả đúng HTML máy chủ đã trả.
        await c.route(goc + hoiBan, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: htmlDaNhan }), { times: 1 });
        await p.goto(goc + hoiBan, { waitUntil: 'load' });
        const veTuDem = { the: await p.locator(`[data-ket-qua="da-nhan"][data-ma="${ma}"]`).count(), ten: tenSuKien(await p.evaluate(docHangDoi)) };
        const nhan = `${hoiBan}${dup ? ' (bấm đúp, database chậm)' : ''}`;
        const tot = [
          ok(`${nhan}: trước khi gửi chỉ có PageView`, JSON.stringify(truoc) === '["PageView"]', JSON.stringify(truoc)),
          ok(`${nhan}: database trả mã → thẻ "đã nhận" và ĐÚNG MỘT Lead, chỉ kèm ${JSON.stringify(thamSo(hoiBan))}`,
             !!ma && (mayGia.dem().tao_dat_ban ?? 0) === 1
               && JSON.stringify(suKienTrong(lenh)) === JSON.stringify([['track', 'PageView'], ['track', 'Lead', thamSo(hoiBan)]]),
             `mã «${ma}», tao_dat_ban ${mayGia.dem().tao_dat_ban ?? 0} lần, ${JSON.stringify(suKienTrong(lenh))}`),
          ok(`${nhan}: không lời gọi fbq nào mang họ tên, số điện thoại, mã đặt bàn`,
             !coChuKhach(JSON.stringify(lenh)) && !(ma && JSON.stringify(lenh).includes(ma)), JSON.stringify(lenh)),
          ok(`${nhan}: địa chỉ trang sau khi gửi là đường dẫn trơn — không họ tên, không số điện thoại`,
             new URL(diaChi).pathname === hoiBan && new URL(diaChi).search === '' && !coChuKhach(decodeURIComponent(diaChi)), diaChi),
          ok(`${nhan}: tải lại trang (kết quả qua cookie dùng một lần) → không thẻ "đã nhận", không Lead thứ hai`,
             !sauTaiLai.includes('Lead'), JSON.stringify(sauTaiLai)),
          ok(`${nhan}: Back về trang "đã nhận" lấy từ bộ nhớ đệm (cùng HTML, script chạy lại) → thẻ hiện lại nhưng không Lead thứ hai`,
             !!ma && veTuDem.the === 1 && JSON.stringify(veTuDem.ten) === '["PageView"]', JSON.stringify(veTuDem)),
          ok(`${nhan}: không lỗi JavaScript`, !loiJs.length, loiJs.slice(0, 3).join(' | ')),
        ];
        if (tot.includes(false)) await p.screenshot({ path: join(ANH_LOI, `pixel-lead-${nn}${dup ? '-dup' : ''}.png`), fullPage: true }).catch(() => {});
        await c.close();
      }

      for (const kichBan of ['dat-ban-500', 'dat-ban-dut', 'dat-ban-loi']) {
        mayGia.datKichBan(kichBan);
        const { c, p } = await moTrang();
        await p.goto(goc + hoiBan, { waitUntil: 'load' });
        await dienVaGui(p);
        const ten = tenSuKien(await p.evaluate(docHangDoi));
        ok(`${kichBan} ${hoiBan}: database không xác nhận → không Lead, không thẻ "đã nhận"`,
           !ten.includes('Lead') && await p.locator('[data-ket-qua="da-nhan"]').count() === 0, JSON.stringify(ten));
        await c.close();
      }
    }

    // Contact với link ĐÃ CÔNG BỐ: số điện thoại (day-du) ở Đến Beeftown; link Zalo OA (mua-thit-mo) ở Mua thịt về.
    // Không rời trang khi bấm: chặn ở pha nổi bọt, sau listener pha capture của Trang.astro.
    const khongRoiTrang = p => p.evaluate(() => document.addEventListener('click', e => e.preventDefault()));
    for (const nn of NGON_NGU) {
      mayGia.datKichBan('day-du');
      const den = duongDanTuongUng('/den-beeftown', nn);
      const { c, p } = await moTrang();
      await p.goto(goc + den, { waitUntil: 'load' });
      await khongRoiTrang(p);
      await p.locator('main a[href^="tel:"]:visible').first().click();
      ok(`${den}: bấm số điện thoại đã công bố → Contact ${JSON.stringify(thamSo(den))}`,
         JSON.stringify(suKienTrong(await p.evaluate(docHangDoi)).at(-1)) === JSON.stringify(['track', 'Contact', thamSo(den)]),
         JSON.stringify(suKienTrong(await p.evaluate(docHangDoi))));
      await c.close();

      mayGia.datKichBan('mua-thit-mo');
      const mua = duongDanTuongUng('/mua-thit-ve', nn);
      const t2 = await moTrang();
      await t2.p.goto(goc + mua, { waitUntil: 'load' });
      await khongRoiTrang(t2.p);
      await t2.p.locator(`main a[href="${ZALO_OA_THU}"]:visible`).first().click();
      ok(`${mua}: bấm link Zalo OA đã công bố → Contact`,
         JSON.stringify(suKienTrong(await t2.p.evaluate(docHangDoi)).at(-1)) === JSON.stringify(['track', 'Contact', thamSo(mua)]),
         JSON.stringify(suKienTrong(await t2.p.evaluate(docHangDoi))));
      await t2.c.close();
    }

    // InitiateCheckout: "Xem đơn" là form GET (chuyển trang) — dùng fbevents.js giả báo từng lời gọi về đây.
    mayGia.datKichBan('mua-thit-mo');
    for (const nn of NGON_NGU) {
      const mua = duongDanTuongUng('/mua-thit-ve', nn);
      const c = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
      const lenh = await ghiPixel(c);
      const p = await c.newPage();
      const choThuVien = () => p.waitForFunction(() => typeof window.fbq?.callMethod === 'function', null, { timeout: 10000 }).catch(() => {});
      await p.goto(goc + mua, { waitUntil: 'load' });
      await choThuVien();
      // Giỏ rỗng: script giữ trang lại, không InitiateCheckout.
      await p.locator('form[data-mtv-form] button[type="submit"]').click();
      await cho(300);
      const sauRong = tenSuKien(lenh);
      await p.locator('select.mtv-so[name="ribeye-cap_200"]').selectOption('2');
      await Promise.all([
        p.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
        p.locator('form[data-mtv-form] button[type="submit"]').click(),
      ]);
      await choThuVien();
      const diaChi = new URL(p.url());
      const sauGui = tenSuKien(lenh);
      // Trang xem đơn (giỏ trên địa chỉ, ô chọn mang lại đúng giỏ): bấm "Xem đơn" của thanh dưới hai lần — cùng giỏ, không
      // thêm lần nào. Đổi giỏ rồi gửi lại: lần xem đơn mới.
      await p.evaluate(() => window.scrollTo(0, 0));
      const thanh = p.locator('[data-mtv-thanh-xem]');
      const coThanh = await thanh.isVisible();
      if (coThanh) { await thanh.click(); await thanh.click({ force: true }).catch(() => {}); }
      await cho(300);
      const sauThanh = tenSuKien(lenh);
      await p.locator('select.mtv-so[name="ribeye-cap_200"]').selectOption('3');
      await Promise.all([
        p.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
        p.locator('form[data-mtv-form] button[type="submit"]').click(),
      ]);
      await choThuVien();
      const sauDoiGio = tenSuKien(lenh);
      const goi = suKienTrong(lenh).filter(l => l[1] === 'InitiateCheckout');
      ok(`${mua}: giỏ rỗng bấm "Xem đơn" → không InitiateCheckout`, JSON.stringify(sauRong) === '["PageView"]', JSON.stringify(sauRong));
      ok(`${mua}: có giỏ bấm "Xem đơn" → đúng một InitiateCheckout trước khi chuyển trang, chỉ kèm ${JSON.stringify(thamSo(mua))}`,
         JSON.stringify(sauGui) === '["PageView","InitiateCheckout","PageView"]'
           && JSON.stringify(goi[0]) === JSON.stringify(['track', 'InitiateCheckout', thamSo(mua)]), JSON.stringify(suKienTrong(lenh)));
      ok(`${mua}: trang xem đơn, bấm "Xem đơn" của thanh dưới hai lần (cùng giỏ) → không thêm InitiateCheckout`,
         coThanh && JSON.stringify(sauThanh) === '["PageView","InitiateCheckout","PageView"]', `thanh dưới ${coThanh ? 'hiện' : 'không hiện'} · ${JSON.stringify(sauThanh)}`);
      ok(`${mua}: đổi giỏ rồi "Xem đơn" → thêm đúng một InitiateCheckout, chỉ kèm tên trang và thứ tiếng`,
         JSON.stringify(sauDoiGio) === '["PageView","InitiateCheckout","PageView","InitiateCheckout","PageView"]'
           && goi.every(l => JSON.stringify(l) === JSON.stringify(['track', 'InitiateCheckout', thamSo(mua)])), JSON.stringify(sauDoiGio));
      ok(`${mua}: địa chỉ sau "Xem đơn" chỉ mang mã gói, số gói, cách nhận`,
         [...diaChi.searchParams].every(([k, v]) => (/^[a-z0-9-]+_\d+$/.test(k) && /^\d+$/.test(v)) || (k === 'nhan' && /^(quay|giao)$/.test(v)))
           && diaChi.searchParams.get('ribeye-cap_200') === '2', diaChi.href);
      await c.close();
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
