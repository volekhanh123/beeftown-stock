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
 *   1. Mọi trang công khai (sitemap + danh sách cố định) ở 320, 360, 390, 430, 768, 800, 1024,
 *      1366, 1440 px: trả 200, không lỗi JavaScript, không tải hỏng tài nguyên của chính
 *      trang, không tràn ngang, đúng thuộc tính lang; chân trang có pháp nhân (tên công
 *      ty, mã số thuế, địa chỉ) bằng chữ, ngay dưới dòng ©. Thêm (brief 06/10/2026):
 *      đúng một <h1>; mọi <img> có width, height, alt (alt="" cho ảnh trang trí); ảnh
 *      minh họa nằm dưới màn hình đầu thì loading="lazy"; nút, link điều hướng, summary
 *      cao ≥ 48px; chữ trên nền màu đặc đủ tương phản (≥ 4,5:1, chữ lớn ≥ 3:1).
 *      Thành phần và khung trang (đợt redesign, PR 2 — phép đo ở do-giao-dien.mjs): đầu
 *      trang 64 / 80px, bộ chọn ngôn ngữ đánh dấu thứ tiếng đang xem bằng chữ và nét,
 *      không nền trắng, nút và thẻ đúng quy tắc, hàng câu hỏi ≥ 56px, biểu tượng 24px,
 *      chữ chạy 16/24px và h1 32/38 → 48/56px, chân trang không hoa văn và chữ ≥ 14px.
 *      Địa điểm (Khánh quyết 07/10 và 09/10/2026: tầng 3, 63 Hồ Tùng Mậu, lối vào
 *      riêng ngay cạnh GS25; có thang máy: Khánh xác nhận 11/10/2026): chân trang có "63 Hồ Tùng
 *      Mậu"; trang chủ, Đến Beeftown, Hỏi bàn in đúng từng chữ câu chỉ đường đang
 *      dùng TRONG nội dung chính (chữ của câu là Claude đề xuất, chờ Khánh duyệt);
 *      JSON-LD ghi streetAddress "Tầng 3, 63 Hồ Tùng Mậu", không có tên phường; ngoài
 *      dòng pháp nhân, cả trang không còn địa chỉ nào khác và không ghi tên phường,
 *      quận nào; không còn chữ về cầu thang bộ. Mẫu tìm chữ sai: mau-dia-diem.mjs.
 *   2. Trang đặt bàn / tuyển dụng chưa có database: KHÔNG có form nào, không có chữ
 *      "thành công" / "success" / "성공". Trang hỏi bàn: meta description, og:description
 *      và đoạn mở đầu không hứa "gửi yêu cầu, nhà hàng gọi lại" khi form đóng.
 *   3. Gửi thẳng form đặt bàn (không qua giao diện): trang quay về báo lỗi, không bao
 *      giờ báo thành công. Gửi từ trang web khác (Origin lạ) bị từ chối 403.
 *   4. /noi-bo chuyển sang trang đăng nhập (cả đường dẫn lạ dưới /noi-bo — đã đăng nhập thì
 *      chúng hiện trang 404 NỘI BỘ, kiểm ở crm/test/test-noi-bo-khong-co.mjs vì cần database);
 *      hook iPOS không lộ lỗi nội bộ; khóa sai dạng vẫn là 404 chữ trơn của src/worker.ts.
 *   5. Menu gọn của màn hẹp (<details class="menu-gon">) mở / đóng được KHI TẮT
 *      JavaScript; có JavaScript thì Esc đóng nó và trả tiêu điểm về nút. Mở ra thì nút
 *      đổi thành nút đóng có nhãn chữ, có link "Hỏi bàn" là nút chính, có bộ chọn ngôn
 *      ngữ; Enter mở / đóng, Tab đi qua từng mục với vòng focus nhìn thấy, Tab ra khỏi
 *      mục cuối thì menu đóng. Có JavaScript: đang mở thì có lớp phủ tối và trang phía
 *      sau không cuộn; đóng bằng Esc, bằng nút đóng hay bằng cách bấm vào lớp phủ thì
 *      trang cuộn lại được. TẮT JavaScript: không lớp phủ, không khoá cuộn — bấm link
 *      neo trong bảng xong trang vẫn cuộn được.
 *   6. Câu hỏi thường gặp: Enter và phím cách mở / đóng từng câu, vòng focus nhìn thấy.
 *   7. Màn cảm ứng ((hover: none)): con trỏ ở trên nút, link, hàng câu hỏi mà kiểu không
 *      đổi — chạm xong không còn màu di chuột; máy có chuột vẫn đổi kiểu khi di chuột;
 *      cả hai loại máy đổi màu nền khi đang nhấn nút (:active).
 *   8. Thanh cuộn kiểu cổ điển (chiếm 15px): mở danh mục không xô lệch đầu trang và
 *      khung nội dung, không sinh cuộn ngang; ở 1440px khung nội dung vẫn cân giữa.
 *   9. Đường dẫn lạ (/…, /en/…, /ko/…) ở 360 và 1366 px: mã 404, trang 404 của Beeftown
 *      đúng thứ tiếng theo tiền tố, có link về /, /en, /ko, chân trang công khai, không
 *      tràn ngang, noindex và không canonical / hreflang / JSON-LD, cùng các phép đo
 *      thành phần của nhóm 1 (do-giao-dien.mjs). Chạy cả với --url.
 *  10. Ảnh (PR 3 của đợt redesign đưa ảnh lên trang chủ và trang Thực đơn): ảnh về chậm
 *      thì khung vẫn giữ sẵn đúng chỗ, đúng cỡ — ảnh về trang không xô lệch; mọi ảnh
 *      tải về được và dùng đúng khung của cỡ màn hình (điện thoại / màn rộng). Nhãn
 *      "Ảnh minh họa", thẻ đọc nhãn khay, bố cục màn đầu và các khối của trang chủ,
 *      trang Thực đơn: bốn phép đo anh, nhanKhay, trangChu, thucDon của do-giao-dien.mjs,
 *      chạy ở mục 1 trên mọi trang × chín cỡ màn hình.
 *  11. Trang Thực đơn chia ba phần thành tab: lúc tải trang chỉ phần đầu hiện, nên mục 1
 *      không bao giờ thấy ảnh và thành phần của hai phần còn lại. Bấm từng tab như khách
 *      (390 và 1440 px, ba thứ tiếng) rồi đo lại: phần vừa mở có đúng các ảnh của nó, ảnh
 *      tải về được, đủ nhãn "Ảnh minh họa", không gì đè lên ảnh, đúng khung — và giấu nhãn
 *      của ảnh trong phần vừa mở đi thì phép đo phải đỏ (phép đo thật sự nhìn thấy ảnh đó).
 *
 * Hỏng thì ảnh chụp màn hình nằm ở kiem-tra/anh-loi/ (CI tải lên thành artifact).
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as cho } from 'node:timers/promises';
import { chromium } from 'playwright';
import { TEN_DIA_CHI_KHAC, SO_NHA_KHAC, PHUONG_QUAN, CAU_THANG, boPhapNhan } from './mau-dia-diem.mjs';
import { doGiaoDien, PHEP_DO } from './do-giao-dien.mjs';
import { WEB, batMayChuBanBuild, tatMayChu } from './may-chu-ban-build.mjs';

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
// Máy chủ: bản build chạy trong wrangler dev (may-chu-ban-build.mjs, dùng chung với quet-chuoi-cam.mjs)
// ---------------------------------------------------------------------------
const batMayChu = () => batMayChuBanBuild({ cong: CONG, khongBuild: process.argv.includes('--khong-build') });

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
  // 320px: điện thoại nhỏ nhất, và cũng là máy tính 1280px phóng to 400 % (WCAG 1.4.10 — không cuộn ngang).
  { ten: 'điện thoại nhỏ', width: 320, height: 568 },
  { ten: 'điện thoại', width: 360, height: 740 },
  { ten: 'điện thoại lớn', width: 390, height: 844 },
  // 430px: điện thoại rộng nhất đang bán. Từ 400px lề hai bên không còn là 20px mà lớn dần theo 5 % bề rộng
  // (--le: clamp(20px, 5vw, 40px)) — cỡ này giữ cho phép đo và trang không lệch nhau ở khoảng 400–599px.
  { ten: 'điện thoại rộng', width: 430, height: 932 },
  { ten: 'máy tính bảng dọc', width: 768, height: 1024 },
  { ten: 'máy tính bảng', width: 800, height: 1280 },
  { ten: 'máy tính bảng ngang', width: 1024, height: 768 },
  { ten: 'máy tính', width: 1366, height: 768 },
  { ten: 'màn rộng', width: 1440, height: 900 },
];

// Trang nói về đường lên tầng 3 phải in đúng từng chữ câu chỉ đường ngay trong nội dung chính — chân
// trang cũng có câu đó trên mọi trang, nên đọc <main>, không đọc cả trang. Chép tay ở đây, KHÔNG
// đọc lib/chu.ts — sửa nhầm một chữ ở đó thì phép thử này đỏ. Chữ của câu là Claude đề xuất, chờ
// Khánh duyệt: Khánh duyệt chữ khác thì sửa ở lib/chu.ts, ở đây và ở hai file test của crm cùng lúc.
const TRANG_LOI_LEN = ['/', '/en', '/ko', '/den-beeftown', '/en/visit', '/ko/visit', '/dat-ban', '/en/book', '/ko/book'];
const CAU_CHI_DUONG = {
  vi: 'Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3.',
  en: 'Use our own entrance, right next to GS25, and take the lift to Floor 3.',
  ko: 'GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요.',
};
const DUONG_NHA_HANG = '63 Hồ Tùng Mậu';
const DIA_CHI_JSON_LD = 'Tầng 3, 63 Hồ Tùng Mậu';
// Mẫu tìm chữ sai về địa điểm nằm ở mau-dia-diem.mjs (dùng chung với hai file test của crm, có bảng
// câu thử). Sau khi bỏ dòng pháp nhân ở trên, cả trang không được còn tên đường, tên phường của địa
// chỉ khác — kể cả trong thẻ mô tả, JSON-LD, alt ảnh — và chữ khách đọc không được có vế phường / quận
// nào. Chạy với --url trên trang thật thì đây cũng là chỗ lộ ra một bản công bố (dia_chi_hien_thi,
// mo_ta_og… trong /noi-bo) còn ghi địa chỉ khác. Số nhà "11-21" chỉ tìm trong chữ khách đọc: trong
// HTML thô, nét vẽ SVG cũng có dãy số kiểu đó.

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

  const anhThieu = [...document.images]
    .filter(i => !i.hasAttribute('width') || !i.hasAttribute('height') || !i.hasAttribute('alt'))
    .map(i => `${i.getAttribute('src') ?? i.currentSrc} (thiếu ${['width', 'height', 'alt'].filter(a => !i.hasAttribute(a)).join(', ')})`);
  const anhKhongLazy = [...document.querySelectorAll('figure.anh img')]
    .filter(i => i.getBoundingClientRect().top + scrollY >= innerHeight && i.getAttribute('loading') !== 'lazy')
    .map(i => i.getAttribute('src') ?? i.currentSrc);

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
    anhThieu, anhKhongLazy, tuongPhan,
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
// Ctrl+C giữa chừng: may-chu-ban-build.mjs tự tắt wrangler dev (nhóm tiến trình riêng) trước khi thoát.
console.log('\x1b[1m\nBEEFTOWN — KIỂM THỬ BẰNG TRÌNH DUYỆT THẬT\x1b[0m');
console.log('='.repeat(60));

let mayChu = null;
let trinhDuyet = null;
try {
  const goc = URL_NGOAI ?? (mayChu = await batMayChu()).goc;
  console.log(`Trang: ${goc}`);
  trinhDuyet = await chromium.launch();
  const trang = await danhSachTrang(goc);
  const chupLoi = async (page, ten) => {
    mkdirSync(ANH_LOI, { recursive: true });
    await page.screenshot({ path: join(ANH_LOI, `${ten.replace(/[^a-z0-9-]+/gi, '_')}.png`), fullPage: true }).catch(() => {});
  };

  // =========================================================================
  await nhom(`1 · ${trang.length} TRANG CÔNG KHAI Ở ${CO_MAN_HINH.length} CỠ MÀN HÌNH`, async () => {
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
            // Có chữ trong HTML mà không đọc được thì cũng như không: bị ẩn, khung rỗng, chữ dưới 14px.
            chanAn: !!chan && [...chan.querySelectorAll('p')].some(p => {
              const k = p.getBoundingClientRect();
              return !p.checkVisibility({ opacityProperty: true, visibilityProperty: true })
                || k.width === 0 || k.height === 0 || parseFloat(getComputedStyle(p).fontSize) < 14;
            }),
          };
        });
        const nhan = `${duong} · ${co.ten} ${co.width}px`;
        const them = await page.evaluate(doTrang);
        const giaoDien = await page.evaluate(doGiaoDien);
        const iBanQuyen = kq.dongChan.findIndex(d => DONG_BAN_QUYEN.test(d));
        const phapNhan = dongPhapNhan(ngonNguCua(duong));
        // Chữ của trang sau khi bỏ dòng pháp nhân: tên đường / tên phường của địa chỉ khác tìm cả trong HTML thô,
        // số nhà và vế phường / quận chỉ tìm trong chữ khách đọc.
        const chuKhongPhapNhan = boPhapNhan(them.chuCaTrang, phapNhan[1]);
        const diaChiKhac = TEN_DIA_CHI_KHAC.tim(boPhapNhan(them.htmlTrang, phapNhan[1]))
          ?? TEN_DIA_CHI_KHAC.tim(chuKhongPhapNhan) ?? SO_NHA_KHAC.tim(chuKhongPhapNhan);
        const phuongQuan = PHUONG_QUAN.tim(chuKhongPhapNhan);
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
               : kq.chanAn ? 'một dòng chân trang bị ẩn hoặc chữ dưới 14px' : JSON.stringify(kq.dongChan)),
          ok(`${nhan}: đúng một <h1>`, them.soH1 === 1, `${them.soH1} thẻ h1`),
          ok(`${nhan}: mọi <img> có width, height, alt`, !them.anhThieu.length, them.anhThieu.slice(0, 3).join(' | ')),
          ok(`${nhan}: ảnh minh họa dưới màn hình đầu có loading="lazy"`, !them.anhKhongLazy.length, them.anhKhongLazy.slice(0, 3).join(' | ')),
          ...Object.entries(PHEP_DO).map(([khoa, ten]) =>
            ok(`${nhan}: ${ten}`, giaoDien[khoa]?.length === 0, (giaoDien[khoa] ?? ['không đo được']).slice(0, 4).join(' | '))),
          ok(`${nhan}: chân trang có địa chỉ "${DUONG_NHA_HANG}" kèm câu chỉ đường`,
             them.chuChan.includes(DUONG_NHA_HANG) && motDong(them.chuChan).includes(CAU_CHI_DUONG[ngonNguCua(duong)]),
             motDong(them.chuChan).slice(0, 200)),
          ...(TRANG_LOI_LEN.includes(duong)
            ? [ok(`${nhan}: nội dung chính in đúng từng chữ câu chỉ đường (lối vào riêng ngay cạnh GS25, thang máy lên tầng 3)`,
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
               && !TEN_DIA_CHI_KHAC.tim(JSON.stringify(them.diaChiJsonLd)) && !SO_NHA_KHAC.tim(JSON.stringify(them.diaChiJsonLd)),
             JSON.stringify(them.diaChiJsonLd)),
          ok(`${nhan}: ngoài dòng pháp nhân (có đúng một lần), cả trang không còn địa chỉ nào khác ${DUONG_NHA_HANG}`,
             them.htmlTrang.split(phapNhan[1]).length === 2 && !diaChiKhac,
             `dòng pháp nhân có ${them.htmlTrang.split(phapNhan[1]).length - 1} lần; thấy «${diaChiKhac ?? ''}»`),
          ok(`${nhan}: ngoài dòng pháp nhân, chữ khách đọc không ghi tên phường hay quận nào`, !phuongQuan, `thấy «${phuongQuan ?? ''}»`),
          ok(`${nhan}: không còn chữ về cầu thang bộ, không câu nào nói không có thang máy`, !CAU_THANG.tim(them.chuCaTrang),
             CAU_THANG.tim(them.chuCaTrang) ?? ''),
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
  // Nhãn của nút danh mục, nút Hỏi bàn và đường dẫn của nó — chép tay, KHÔNG đọc lib/chu.ts (cùng lý do
  // với CAU_CHI_DUONG ở trên).
  const NHAN_MENU = {
    vi: { mo: 'Danh mục', dong: 'Đóng', hoiBan: 'Hỏi bàn', duong: '/dat-ban' },
    en: { mo: 'Pages', dong: 'Close', hoiBan: 'Ask for a table', duong: '/en/book' },
    ko: { mo: '바로가기', dong: '닫기', hoiBan: '테이블 문의', duong: '/ko/book' },
  };
  const tieuDiem = page => page.evaluate(() => {
    const a = document.activeElement;
    const cs = a ? getComputedStyle(a) : null;
    return {
      trongBang: !!a?.closest('.mg-bang'), laCauHoi: !!a?.matches('.cau-hoi summary'),
      vong: !!cs && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2,
      moTa: a ? `<${a.tagName.toLowerCase()}> ${a.textContent.trim().slice(0, 30)}` : 'không có',
    };
  });

  /** Lớp phủ tối dưới bảng danh mục (phần tử giả ::before của <details>) và việc khoá cuộn trang. */
  const lopPhu = page => page.evaluate(() => {
    const phu = getComputedStyle(document.querySelector('details.menu-gon'), '::before');
    const co = phu.content !== 'none' && phu.content !== 'normal' && phu.display !== 'none';
    return {
      mau: co && phu.position === 'fixed' ? phu.backgroundColor : null,
      conTro: co ? phu.cursor : null,
      khoaCuon: getComputedStyle(document.documentElement).overflowY === 'hidden',
    };
  });
  /** Chờ tới khi trang cuộn khỏi vị trí `truoc` (tối đa 0,7 giây). Hỏi từ ngoài trang: tắt JavaScript vẫn chạy. */
  const choCuon = async (page, truoc, toiDa = 700) => {
    for (let t = 0; t < toiDa && await page.evaluate(() => scrollY) === truoc; t += 50) await cho(50);
  };
  /** Lăn chuột xuống ở gần đáy màn hình (chỗ của lớp phủ, ngoài bảng danh mục); trả số px trang đã cuộn. */
  const lanChuot = async page => {
    const { width, height } = page.viewportSize();
    const truoc = await page.evaluate(() => scrollY);
    await page.mouse.move(width / 2, height - 30);
    await page.mouse.wheel(0, 240);
    await choCuon(page, truoc);
    await cho(200);
    return (await page.evaluate(() => scrollY)) - truoc;
  };
  const veDau = page => page.evaluate(() => scrollTo(0, 0));

  await nhom('5 · MENU GỌN Ở 320, 360 VÀ 768 PX: MỞ / ĐÓNG KHI TẮT JAVASCRIPT; CÓ JAVASCRIPT: Esc, Enter, Tab, LỚP PHỦ, KHOÁ CUỘN', async () => {
    for (const rong of [320, 360, 768]) {
      for (const coJs of [false, true]) {
        const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: rong < 600 ? 740 : 1024 }, javaScriptEnabled: coJs });
        const page = await ctx.newPage();
        for (const duong of ['/', '/en', '/ko']) {
          await page.goto(goc + duong);
          const nn = ngonNguCua(duong);
          const nhan = `${duong} · ${rong}px · ${coJs ? 'có' : 'TẮT'} JavaScript`;
          const menu = page.locator('details.menu-gon');
          const nut = menu.locator('summary');
          const muc = menu.locator('a[href]');
          const mo = () => menu.evaluate(d => d.open).catch(() => null);
          const thayMuc = async () => (await muc.count()) > 0 && await muc.first().isVisible();
          const chuNut = async () => motDong(await nut.innerText());
          if (!ok(`${nhan}: có menu gọn, lúc đầu đóng, các mục chưa hiện, nút ghi "${NHAN_MENU[nn].mo}"`,
                  await menu.count() === 1 && await nut.isVisible() && await mo() === false && !(await thayMuc())
                    && await chuNut() === NHAN_MENU[nn].mo, await chuNut().catch(() => ''))) {
            await chupLoi(page, `menu-gon${duong}-${rong}-${coJs ? 'js' : 'khong-js'}`);
            continue;
          }
          await nut.click();
          await cho(300);   // nút đổi màu trong 180ms — đo sau khi chuyển màu xong
          const tot = [
            ok(`${nhan}: bấm nút danh mục → mở, thấy các mục`, await mo() === true && await thayMuc()),
            ok(`${nhan}: đang mở thì nút là nút đóng, ghi "${NHAN_MENU[nn].dong}"`, await chuNut() === NHAN_MENU[nn].dong, await chuNut()),
          ];
          const gd = await page.evaluate(doGiaoDien);
          for (const khoa of ['vungCham', 'ngonNgu', 'khongTrang', 'bieuTuong', 'the']) {
            tot.push(ok(`${nhan}: danh mục đang mở — ${PHEP_DO[khoa]}`, gd[khoa]?.length === 0, (gd[khoa] ?? ['không đo được']).slice(0, 4).join(' | ')));
          }
          tot.push(ok(`${nhan}: danh mục đang mở không làm trang tràn ngang`,
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)));
          const hoiBan = menu.locator(`.mg-bang a[href="${NHAN_MENU[nn].duong}"]`);
          const ngonNguTrongBang = menu.locator('.mg-bang .mg-ngon-ngu .doi-ngon-ngu');
          if (rong < 768) {
            // Điện thoại: thanh đầu trang chỉ có logo và nút danh mục — Hỏi bàn và ngôn ngữ nằm trong bảng.
            tot.push(ok(`${nhan}: trong danh mục có "${NHAN_MENU[nn].hoiBan}" là nút chính, dẫn tới ${NHAN_MENU[nn].duong}`,
              await hoiBan.count() === 1 && await hoiBan.isVisible() && motDong(await hoiBan.innerText()) === NHAN_MENU[nn].hoiBan
                && await hoiBan.evaluate(a => a.classList.contains('nut') && a.classList.contains('nut-chinh'))));
            tot.push(ok(`${nhan}: trong danh mục có bộ chọn 3 thứ tiếng`,
              await ngonNguTrongBang.count() === 3 && await ngonNguTrongBang.first().isVisible()));
          } else {
            // Từ 768px hai thứ đó đã ở ngay trên thanh (do-giao-dien.mjs kiểm) — bảng không lặp lại.
            tot.push(ok(`${nhan}: Hỏi bàn và ngôn ngữ đã ở trên thanh, bảng danh mục không lặp lại`,
              !(await hoiBan.first().isVisible().catch(() => false)) && !(await ngonNguTrongBang.first().isVisible().catch(() => false))));
          }
          const phu = await lopPhu(page);
          if (coJs) {
            // Có script: lớp phủ tối che phần trang dưới bảng, bấm vào là đóng; trang phía sau đứng yên.
            tot.push(ok(`${nhan}: đang mở — có lớp phủ tối (Charcoal 50 %) dưới bảng, con trỏ bàn tay`,
              phu.mau === 'rgba(21, 16, 8, 0.5)' && phu.conTro === 'pointer', JSON.stringify(phu)));
            const daCuon = await lanChuot(page);
            tot.push(ok(`${nhan}: đang mở — trang phía sau không cuộn`, phu.khoaCuon && daCuon === 0, `khoá ${phu.khoaCuon}, lăn chuột cuộn ${daCuon}px`));
            await page.keyboard.press('Escape');
            tot.push(ok(`${nhan}: Esc → đóng, tiêu điểm về nút danh mục`,
               await mo() === false && await nut.evaluate(s => document.activeElement === s)));
            const sauEsc = [await lopPhu(page), await lanChuot(page)];
            tot.push(ok(`${nhan}: đóng bằng Esc → hết lớp phủ, trang cuộn lại được`,
              sauEsc[0].mau === null && !sauEsc[0].khoaCuon && sauEsc[1] > 0, `${JSON.stringify(sauEsc[0])}, lăn chuột cuộn ${sauEsc[1]}px`));
            await veDau(page);
            await nut.focus();
            // Bàn phím từ đầu tới cuối: Enter mở, Tab đi qua từng mục, Tab ra khỏi mục cuối thì đóng.
            await page.keyboard.press('Enter');
            tot.push(ok(`${nhan}: Enter trên nút → mở`, await mo() === true && await thayMuc()));
            await page.keyboard.press('Tab');
            const dau = await tieuDiem(page);
            tot.push(ok(`${nhan}: Tab → mục đầu của danh mục, vòng focus nhìn thấy (≥ 2px)`, dau.trongBang && dau.vong, JSON.stringify(dau)));
            const soMuc = await menu.locator('.mg-bang a[href]').evaluateAll(as => as.filter(a => a.checkVisibility()).length);
            let conTrong = true, conVong = true;
            for (let i = 1; i < soMuc; i++) {
              await page.keyboard.press('Tab');
              const t = await tieuDiem(page);
              conTrong &&= t.trongBang; conVong &&= t.vong;
            }
            tot.push(ok(`${nhan}: Tab qua ${soMuc} mục — tiêu điểm ở trong danh mục, mục nào cũng có vòng focus, danh mục còn mở`,
               soMuc >= 3 && conTrong && conVong && await mo() === true));
            await page.keyboard.press('Tab');
            tot.push(ok(`${nhan}: Tab ra khỏi mục cuối → danh mục đóng`, await mo() === false));
            await nut.focus();
            await page.keyboard.press('Enter');
            await page.keyboard.press('Enter');
            tot.push(ok(`${nhan}: Enter hai lần trên nút → mở rồi đóng`, await mo() === false && !(await thayMuc())));
            // Đóng bằng nút đóng.
            await nut.click();
            const moLai = await mo();
            await nut.click();
            const sauNut = [await lopPhu(page), await lanChuot(page)];
            tot.push(ok(`${nhan}: mở rồi bấm nút đóng → đóng, hết lớp phủ, trang cuộn lại được`,
              moLai === true && await mo() === false && sauNut[0].mau === null && !sauNut[0].khoaCuon && sauNut[1] > 0,
              `${JSON.stringify(sauNut[0])}, lăn chuột cuộn ${sauNut[1]}px`));
            await veDau(page);
            // Đóng bằng cách bấm vào lớp phủ (gần đáy màn hình, ngoài bảng).
            await nut.click();
            const moLan3 = await mo();
            const { width, height } = page.viewportSize();
            const dich = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.className ?? '', [width / 2, height - 30]);
            await page.mouse.click(width / 2, height - 30);
            const sauPhu = [await lopPhu(page), await lanChuot(page)];
            tot.push(ok(`${nhan}: mở rồi bấm vào lớp phủ → đóng, trang cuộn lại được`,
              moLan3 === true && /\bmenu-gon\b/.test(dich) && await mo() === false && !sauPhu[0].khoaCuon && sauPhu[1] > 0,
              `chỗ bấm là «${dich}», ${JSON.stringify(sauPhu[0])}, lăn chuột cuộn ${sauPhu[1]}px`));
          } else {
            // Không có script: không gì đóng được menu khi khách bấm một link neo trong bảng. Vì vậy không
            // lớp phủ, không khoá cuộn — menu là một <details> thường, trang vẫn cuộn như trước đợt redesign.
            const daCuon = await lanChuot(page);
            tot.push(ok(`${nhan}: đang mở — không lớp phủ, không khoá cuộn, trang vẫn cuộn được`,
              phu.mau === null && !phu.khoaCuon && daCuon > 0, `${JSON.stringify(phu)}, lăn chuột cuộn ${daCuon}px`));
            await veDau(page);
            // Link neo "Trải nghiệm" dẫn tới #trai-nghiem của chính trang này: trang nhảy tới đó, menu còn mở
            // (không có script để đóng) — khách vẫn phải cuộn tiếp và tự đóng được.
            await muc.first().click();
            await choCuon(page, 0, 2000);
            const taiNeo = await page.evaluate(() => ({ neo: location.hash, y: scrollY }));
            const cuonTiep = await lanChuot(page);
            tot.push(ok(`${nhan}: bấm link neo trong danh mục → trang tới #trai-nghiem và cuộn tiếp được`,
              taiNeo.neo === '#trai-nghiem' && taiNeo.y > 0 && cuonTiep > 0, `${JSON.stringify(taiNeo)}, lăn chuột cuộn ${cuonTiep}px`));
            await nut.click();
            tot.push(ok(`${nhan}: bấm lần nữa → đóng`, await mo() === false && !(await thayMuc())));
          }
          if (tot.includes(false)) await chupLoi(page, `menu-gon${duong}-${rong}-${coJs ? 'js' : 'khong-js'}`);
        }
        await ctx.close();
      }
    }
  });

  // =========================================================================
  await nhom('6 · CÂU HỎI THƯỜNG GẶP Ở 390 VÀ 1440 PX: BÀN PHÍM MỞ / ĐÓNG, BẤM ĐƯỢC TRÊN TOÀN CHIỀU RỘNG', async () => {
    for (const rong of [390, 1440]) {
      const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: 900 } });
      const page = await ctx.newPage();
      for (const duong of ['/', '/en', '/ko']) {
        await page.goto(goc + duong);
        const nhan = `${duong} · ${rong}px`;
        const cau = page.locator('.cau-hoi details');
        const soCau = await cau.count();
        const dangMo = () => cau.first().evaluate(d => d.open);
        if (!ok(`${nhan}: có câu hỏi thường gặp, lúc đầu đều đóng`,
                soCau >= 4 && await cau.evaluateAll(ds => ds.every(d => !d.open)), `${soCau} câu`)) continue;
        const tom = cau.first().locator('summary');
        await tom.focus();
        await page.keyboard.press('Enter');
        const tot = [
          ok(`${nhan}: Enter trên câu đầu → mở, thấy câu trả lời`, await dangMo() === true && await cau.first().locator('.tra-loi').isVisible()),
        ];
        const gd = await page.evaluate(doGiaoDien);
        tot.push(ok(`${nhan}: câu đang mở — ${PHEP_DO.cauHoi}`, gd.cauHoi.length === 0, gd.cauHoi.slice(0, 3).join(' | ')));
        tot.push(ok(`${nhan}: câu đang mở — ${PHEP_DO.bieuTuong}`, gd.bieuTuong.length === 0, gd.bieuTuong.slice(0, 3).join(' | ')));
        await page.keyboard.press('Space');
        tot.push(ok(`${nhan}: phím cách → đóng`, await dangMo() === false));
        await page.keyboard.press('Tab');
        const ke = await tieuDiem(page);
        tot.push(ok(`${nhan}: Tab → câu kế tiếp, vòng focus nhìn thấy (≥ 2px)`, ke.laCauHoi && ke.vong, JSON.stringify(ke)));
        // Bấm ở hai mép của hàng, không phải lên chữ: cả chiều rộng là vùng bấm.
        const hop = await tom.boundingBox();
        await page.mouse.click(hop.x + hop.width - 5, hop.y + hop.height / 2);
        tot.push(ok(`${nhan}: bấm ở mép phải của hàng → mở`, await dangMo() === true));
        const hopMo = await tom.boundingBox();
        await page.mouse.click(hopMo.x + hopMo.width * 0.8, hopMo.y + hopMo.height / 2);
        tot.push(ok(`${nhan}: bấm vào khoảng trống giữa hàng → đóng`, await dangMo() === false));
        if (tot.includes(false)) await chupLoi(page, `cau-hoi${duong}-${rong}`);
      }
      await ctx.close();
    }
  });

  // =========================================================================
  // Màu "di chuột" (:hover) chỉ dành cho máy có chuột. Trên màn cảm ứng, chạm xong thì trình duyệt vẫn coi
  // ngón tay "đang ở trên" phần tử: nút giữ màu di chuột cho tới khi khách chạm chỗ khác — nút danh mục vừa
  // đóng mà trông như đang mở. Playwright giả màn cảm ứng bằng hasTouch: (hover: none), và locator.hover()
  // vẫn đặt được :hover — đúng tình huống đó.
  await nhom('7 · MÀN CẢM ỨNG: CHẠM XONG KHÔNG CÒN MÀU DI CHUỘT; MÁY CÓ CHUỘT VẪN ĐỔI MÀU KHI DI CHUỘT VÀ KHI NHẤN', async () => {
    const kieu = el => {
      const cs = getComputedStyle(el);
      const [svg, con] = [el.querySelector('svg'), el.querySelector(':scope > span')];
      return [cs.backgroundColor, cs.color, cs.borderTopColor, cs.borderBottomColor, cs.textDecorationLine, cs.textDecorationThickness,
        svg ? getComputedStyle(svg).transform : '', con ? getComputedStyle(con).textDecorationLine : ''].join(' | ');
    };
    // [tên, bộ chọn, bề rộng cần để phần tử hiện ra]
    const PHAN_TU = [
      ['nút danh mục', 'details.menu-gon summary', 390],
      ['nút chính', 'main .nut-chinh', 390],
      ['nút phụ', 'main .nut-vien', 390],
      ['liên kết có mũi tên', 'main .lien-ket', 390],
      ['hàng câu hỏi thường gặp', '.cau-hoi summary', 390],
      ['link chân trang', 'footer .ct-cot a', 390],
      ['dòng địa chỉ ở khối mở đầu', '.kmd-dia-chi', 390],
      ['link điều hướng trên thanh', '.dt-nav a:not([aria-current])', 1440],
      ['thứ tiếng khác trên thanh', '.dt-ngon-ngu a.doi-ngon-ngu', 1440],
    ];
    for (const camUng of [true, false]) {
      for (const rong of [390, 1440]) {
        const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: 800 }, hasTouch: camUng });
        const page = await ctx.newPage();
        await page.goto(goc + '/');
        const loai = camUng ? 'màn cảm ứng' : 'máy có chuột';
        const nhan = `/ · ${rong}px · ${loai}`;
        const khongDiChuot = await page.evaluate(() => matchMedia('(hover: none)').matches);
        if (!ok(`${nhan}: trình duyệt báo ${camUng ? 'không' : 'có'} di chuột được ((hover: ${camUng ? 'none' : 'hover'}))`, khongDiChuot === camUng)) { await ctx.close(); continue; }
        for (const [ten, chon] of PHAN_TU.filter(p => p[2] === rong)) {
          const el = page.locator(chon).first();
          if (!ok(`${nhan}: thấy ${ten} (${chon})`, await el.count() > 0 && await el.isVisible())) continue;
          await page.mouse.move(0, 0);
          await el.scrollIntoViewIfNeeded();
          await cho(250);
          const truoc = await el.evaluate(kieu);
          await el.hover();
          await cho(300);   // chuyển màu 180ms
          const [dangTren, sau] = [await el.evaluate(e => e.matches(':hover')), await el.evaluate(kieu)];
          if (camUng) {
            ok(`${nhan}: ${ten} — con trỏ đang ở trên (:hover) mà kiểu không đổi`, dangTren && sau === truoc, `:hover ${dangTren} · trước «${truoc}» · sau «${sau}»`);
          } else {
            ok(`${nhan}: ${ten} — di chuột lên thì đổi kiểu`, dangTren && sau !== truoc, `:hover ${dangTren} · «${sau}»`);
          }
        }
        if (camUng && rong === 390) {
          // Đúng lỗi được báo: chạm mở rồi chạm đóng nút danh mục, nút phải về màu lúc đóng.
          const nut = page.locator('details.menu-gon summary');
          await page.mouse.move(0, 0);
          await veDau(page);
          await cho(250);
          const truoc = await nut.evaluate(kieu);
          await nut.tap();
          await cho(300);
          const daMo = await nut.evaluate(s => s.parentElement.open);
          await nut.tap();
          await cho(400);
          const sau = await nut.evaluate(kieu);
          ok(`${nhan}: chạm mở rồi chạm đóng nút danh mục → nút về đúng kiểu lúc đóng`,
             daMo && await nut.evaluate(s => !s.parentElement.open) && sau === truoc, `trước «${truoc}» · sau «${sau}»`);
        }
        // Nhấn giữ (:active) phải có phản hồi ở cả hai loại máy — trên màn cảm ứng đó là phản hồi duy nhất.
        // Chặn mọi cú bấm từ đây: thả chuột trên nút không được chuyển trang hay mở danh mục.
        await page.evaluate(() => document.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }, true));
        for (const [ten, chon] of [['nút chính', 'main .nut-chinh'], ['nút phụ', 'main .nut-vien'], ['nút danh mục', 'details.menu-gon summary']]) {
          const el = page.locator(chon).first();
          if (!(await el.isVisible().catch(() => false))) continue;
          await page.mouse.move(0, 0);
          await el.scrollIntoViewIfNeeded();
          await cho(250);
          const truoc = await el.evaluate(e => getComputedStyle(e).backgroundColor);
          const hop = await el.boundingBox();
          await page.mouse.move(hop.x + hop.width / 2, hop.y + hop.height / 2);
          await page.mouse.down();
          await cho(300);
          const [dangNhan, luc] = [await el.evaluate(e => e.matches(':active')), await el.evaluate(e => getComputedStyle(e).backgroundColor)];
          await page.mouse.up();
          ok(`${nhan}: ${ten} — đang nhấn (:active) thì nền đổi màu`, dangNhan && luc !== truoc, `:active ${dangNhan} · trước ${truoc} · lúc nhấn ${luc}`);
        }
        await ctx.close();
      }
    }
  });

  // =========================================================================
  // Máy có thanh cuộn kiểu cổ điển (Windows, chuột cắm vào Mac): thanh cuộn chiếm 15px bề ngang. Khoá cuộn
  // khi mở danh mục làm thanh cuộn biến mất — không bù lại thì cả trang xô sang phải 15px rồi xô lại lúc đóng.
  // DauTrang.astro đo bề rộng thanh cuộn trước khi mở và bù bằng padding-right của <html>.
  // Playwright mặc định giấu thanh cuộn, nên nhóm này mở một Chromium riêng có thanh cuộn thật.
  await nhom('8 · THANH CUỘN KIỂU CỔ ĐIỂN: MỞ DANH MỤC KHÔNG XÔ LỆCH TRANG, KHÔNG CUỘN NGANG', async () => {
    const coThanhCuon = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
    try {
      const do_ = page => page.evaluate(() => {
        const trai = chon => document.querySelector(chon)?.getBoundingClientRect().left ?? null;
        const phai = chon => document.querySelector(chon)?.getBoundingClientRect().right ?? null;
        const khung = document.querySelector('main .khung')?.getBoundingClientRect();
        return {
          thanhCuon: innerWidth - document.documentElement.clientWidth,
          bu: parseFloat(getComputedStyle(document.documentElement).paddingRight),
          tranNgang: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          logo: trai('.dt-logo'), cumPhai: phai('.dt-phai'), khungTrai: khung?.left ?? null,
          leTrai: khung ? khung.left : null, lePhai: khung ? document.documentElement.clientWidth - khung.right : null,
        };
      });
      for (const [rong, cao] of [[800, 1280], [1024, 768], [1440, 900]]) {
        const ctx = await coThanhCuon.newContext({ viewport: { width: rong, height: cao } });
        const page = await ctx.newPage();
        for (const duong of ['/', '/ko/book']) {
          await page.goto(goc + duong);
          const nhan = `${duong} · ${rong}px · thanh cuộn cổ điển`;
          const truoc = await do_(page);
          const tot = [
            ok(`${nhan}: trình duyệt có thanh cuộn chiếm chỗ thật (≥ 10px)`, truoc.thanhCuon >= 10, `${truoc.thanhCuon}px`),
            ok(`${nhan}: không cuộn ngang; khung nội dung cân giữa (lề trái bằng lề phải)`,
               truoc.tranNgang <= 0 && truoc.leTrai !== null && Math.abs(truoc.leTrai - truoc.lePhai) <= 1, JSON.stringify(truoc)),
          ];
          if (rong < 1080) {
            await page.locator('details.menu-gon summary').click();
            await cho(300);
            const sau = await do_(page);
            const khoa = await page.evaluate(() => getComputedStyle(document.documentElement).overflowY === 'hidden');
            tot.push(ok(`${nhan}: mở danh mục (trang đã khoá cuộn) — logo, cụm nút bên phải và khung nội dung đứng nguyên chỗ`,
              khoa && sau.logo === truoc.logo && sau.cumPhai === truoc.cumPhai && sau.khungTrai === truoc.khungTrai,
              `khoá ${khoa} · trước ${JSON.stringify(truoc)} · sau ${JSON.stringify(sau)}`));
            tot.push(ok(`${nhan}: mở danh mục không sinh cuộn ngang; phần bù bằng đúng bề rộng thanh cuộn vừa mất (${truoc.thanhCuon}px)`,
              sau.tranNgang <= 0 && sau.bu === truoc.thanhCuon, `tràn ${sau.tranNgang}px, bù ${sau.bu}px`));
            await page.keyboard.press('Escape');
            await cho(200);
            const dongLai = await do_(page);
            tot.push(ok(`${nhan}: đóng danh mục — thanh cuộn trở lại, hết phần bù, mọi thứ vẫn đứng nguyên chỗ`,
              dongLai.thanhCuon === truoc.thanhCuon && dongLai.bu === 0 && dongLai.logo === truoc.logo && dongLai.cumPhai === truoc.cumPhai
                && dongLai.khungTrai === truoc.khungTrai, JSON.stringify(dongLai)));
          }
          if (tot.includes(false)) await chupLoi(page, `thanh-cuon${duong}-${rong}`);
        }
        await ctx.close();
      }
    } finally {
      await coThanhCuon.close().catch(() => {});
    }
  });

  // =========================================================================
  // Kiểm site thật 07/10/2026: đường dẫn lạ trả đúng mã 404 nhưng HTML là mẫu mặc định của Astro —
  // lang="en", nền đen, không một link, không chữ Beeftown. Chạy cả với --url (kiểm beeftown.vn sau deploy).
  await nhom('9 · TRANG KHÔNG CÓ (404): MÃ 404, ĐÚNG THỨ TIẾNG, CÓ ĐƯỜNG VỀ TRANG CHỦ', async () => {
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
        const giaoDien = await page.evaluate(doGiaoDien);
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
          // Cùng các phép đo thành phần và khung trang với 21 trang ở nhóm 1 (do-giao-dien.mjs).
          ...Object.entries(PHEP_DO).map(([khoa, ten]) =>
            ok(`${nhan}: ${ten}`, giaoDien[khoa]?.length === 0, (giaoDien[khoa] ?? ['không đo được']).slice(0, 4).join(' | '))),
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

  // =========================================================================
  // Ảnh về chậm (3G, máy yếu): khung ảnh phải giữ sẵn đúng chỗ của ảnh — không thì cả trang xô xuống khi ảnh
  // về, khách đang đọc bị trượt mất dòng. Giữ mọi file /anh/ lại ở máy chủ giả (chưa trả), đo từng khung; thả
  // ra, cuộn hết trang cho ảnh lazy về, đo lại: khung nào cũng phải đứng nguyên chỗ, nguyên cỡ.
  await nhom('10 · ẢNH VỀ CHẬM: KHUNG GIỮ SẴN CHỖ, TRANG KHÔNG XÔ LỆCH; ẢNH VỀ ĐỦ, ĐÚNG KHUNG TỪNG CỠ MÀN HÌNH', async () => {
    // Chờ phông chữ xong (tối đa 5 giây) rồi mới đo: phông về sau thì chữ xuống dòng khác đi, vị trí các khung
    // đổi mà không phải do ảnh. Không dùng document.fonts.ready: Chromium giữ lời hứa đó tới khi trang tải
    // xong, mà ở lần đo đầu ảnh màn đầu đang bị giữ lại — trang chưa bao giờ "tải xong".
    const doKhung = page => page.evaluate(async () => {
      for (let i = 0; i < 50 && document.fonts.status !== 'loaded'; i++) await new Promise(r => setTimeout(r, 100));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return {
        caoTrang: document.documentElement.scrollHeight,
        soPhong: [...document.fonts].filter(f => f.status === 'loaded').length,
        khung: [...document.querySelectorAll('figure.anh')].map(f => {
          const k = f.getBoundingClientRect();
          const a = f.querySelector('img');
          return {
            id: (a?.getAttribute('src') ?? '').replace(/^.*\/anh\//, '').replace(/-\d+x\d+-\d+\.\w+$/, ''),
            trai: Math.round(k.left * 2) / 2, tren: Math.round((k.top + scrollY) * 2) / 2, rong: Math.round(k.width * 2) / 2, cao: Math.round(k.height * 2) / 2,
            hien: f.checkVisibility(), daVe: !!a && a.complete && a.naturalWidth > 0,
            file: (a?.currentSrc ?? '').replace(/^.*\/anh\//, ''),
            tiLeFile: a && a.naturalHeight ? a.naturalWidth / a.naturalHeight : null,
          };
        }),
      };
    });
    // Khung của từng ảnh theo bề rộng màn hình: dưới 600px dùng khung điện thoại (khungNho), từ 600px khung chính.
    const KHUNG_MONG = {
      'hero-vi-gas': ['4x5', '4x3'], 'bo-van-mo-can': ['1x1', '4x5'], 'bo-cat-lat': ['3x2', '3x2'], 'sot-cham': ['4x3', '4x3'],
      'mon-an-chia-se': ['4x3', '3x2'], 'bua-an-cung-ban': ['4x3', '3x2'], 'uong-khong-con-ba-ly': ['3x2', '3x2'],
    };
    for (const [rong, cao] of [[390, 844], [768, 1024], [1440, 900]]) {
      for (const duong of ['/', '/ko', '/thuc-don']) {
        const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: cao } });
        const page = await ctx.newPage();
        const nhan = `${duong} · ${rong}px`;
        let tha;
        const giu = new Promise(xong => { tha = xong; });
        const hong = [];
        page.on('response', r => { if (/\/anh\//.test(r.url()) && r.status() >= 400) hong.push(`${r.url()} HTTP ${r.status()}`); });
        await page.route('**/anh/**', async r => { await giu; await r.continue().catch(() => {}); });
        try {
          await page.goto(goc + duong, { waitUntil: 'domcontentloaded', timeout: 30000 });
          const truoc = await doKhung(page);
          tha();
          await page.waitForLoadState('load');
          await page.evaluate(async () => {
            for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)); }
            scrollTo({ top: 0, behavior: 'instant' });
          });
          await page.waitForFunction(() => [...document.querySelectorAll('figure.anh img')].filter(a => a.checkVisibility()).every(a => a.complete && a.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {});
          const sau = await doKhung(page);
          const hienRa = sau.khung.filter(k => k.hien);
          const tot = [
            ok(`${nhan}: trang có ảnh (${hienRa.length} ảnh đang hiện), lúc ảnh chưa về chưa ảnh nào tải xong`,
               hienRa.length >= 1 && truoc.khung.length === sau.khung.length && truoc.khung.every(k => !k.daVe), JSON.stringify(truoc.khung.map(k => [k.id, k.daVe]))),
            // Vị trí theo chiều dọc và chiều cao trang chỉ so khi phông chữ không đổi giữa hai lần đo (phông về
            // muộn làm chữ xuống dòng khác — không phải lỗi của ảnh); bề rộng, chiều cao của khung thì luôn so.
            ok(`${nhan}: ảnh chưa về mà khung đã giữ sẵn đúng chỗ, đúng cỡ — ảnh về trang không xô lệch (cao trang ${truoc.caoTrang}px → ${sau.caoTrang}px)`,
               truoc.khung.every((k, i) => ['trai', 'rong', 'cao'].every(c => k[c] === sau.khung[i][c]))
                 && (truoc.soPhong !== sau.soPhong || (truoc.caoTrang === sau.caoTrang && truoc.khung.every((k, i) => k.tren === sau.khung[i].tren)))
                 && hienRa.every(k => k.rong > 100 && k.cao > 60),
               truoc.khung.map((k, i) => `${k.id} ${k.rong}×${k.cao}@${k.tren} → ${sau.khung[i]?.rong}×${sau.khung[i]?.cao}@${sau.khung[i]?.tren}`).join(' | ')),
            ok(`${nhan}: mọi ảnh đang hiện đều tải về được, không file nào hỏng`, hienRa.every(k => k.daVe) && hong.length === 0,
               [...hienRa.filter(k => !k.daVe).map(k => `${k.id} chưa về`), ...hong].join(' | ')),
            ok(`${nhan}: mỗi ảnh dùng đúng khung của cỡ màn hình này, khung hiện đúng tỷ lệ của file`,
               hienRa.every(k => k.file.startsWith(`${k.id}-${KHUNG_MONG[k.id]?.[rong < 600 ? 0 : 1]}-`) && Math.abs(k.rong / k.cao - k.tiLeFile) < 0.02),
               hienRa.map(k => `${k.file} trong khung ${k.rong}×${k.cao}`).join(' | ')),
          ];
          if (tot.includes(false)) await chupLoi(page, `anh-cham${duong}-${rong}`);
        } finally {
          tha();
          await ctx.close();
        }
      }
    }
  });

  // =========================================================================
  // Trang Thực đơn: ba phần (Bò tại quầy / Món ăn / Đồ uống) là ba tab. Lúc tải trang chỉ tab đầu hiện, và
  // do-giao-dien.mjs bỏ qua ảnh đang ẩn — nên ở mục 1 ảnh sot-cham của tab "Món ăn" chưa bao giờ được đo: giấu
  // nhãn "Ảnh minh họa" của nó, chèn chữ đè lên, bóp méo khung… phép đo vẫn đạt. Ở đây bấm từng tab như khách
  // rồi đo lại trên phần vừa mở.
  await nhom('11 · TRANG THỰC ĐƠN: BẤM TỪNG TAB RỒI ĐO LẠI ẢNH VÀ THÀNH PHẦN CỦA PHẦN VỪA MỞ Ở 390 VÀ 1440 PX', async () => {
    // Ảnh của từng phần lúc CHƯA công bố món (CI không có database) — chép tay theo TrangThucDon.astro; phần không
    // có ảnh thì để []. Ảnh món (đã công bố) đo ở thu-day-du.mjs nhóm 11.
    const ANH_CUA_PHAN = { 'bo-tai-quay': ['bo-cat-lat'], 'mon-an': ['sot-cham'], 'do-uong': ['uong-khong-con-ba-ly'] };
    for (const [rong, cao] of [[390, 844], [1440, 900]]) {
      const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: cao } });
      const page = await ctx.newPage();
      for (const duong of ['/thuc-don', '/en/menu', '/ko/menu']) {
        await page.goto(goc + duong, { waitUntil: 'load', timeout: 30000 });
        // Bấm theo thứ tự khách hay bấm: sang "Món ăn", sang "Đồ uống", rồi quay về "Bò tại quầy".
        for (const phan of ['mon-an', 'do-uong', 'bo-tai-quay']) {
          const anhMong = ANH_CUA_PHAN[phan];
          const nhan = `${duong} · ${rong}px · tab #${phan}`;
          await page.locator(`#td-tab-${phan}`).click();
          // Ảnh của phần vừa mở là ảnh lazy: cuộn tới từng ảnh cho nó tải, chờ tải xong, rồi về đầu trang.
          const thay = await page.evaluate(async phan => {
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const khoi = document.getElementById(phan);
            const anh = [...khoi.querySelectorAll('figure.anh')].filter(f => f.checkVisibility());
            for (const f of anh) {
              f.scrollIntoView({ block: 'center', behavior: 'instant' });
              const a = f.querySelector('img');
              for (let i = 0; i < 100 && !(a.complete && a.naturalWidth > 0); i++) await new Promise(r => setTimeout(r, 100));
            }
            scrollTo({ top: 0, behavior: 'instant' });
            return {
              tabDangChon: [...document.querySelectorAll('.td-tab a[aria-selected="true"]')].map(a => a.id),
              phanHien: [...document.querySelectorAll('.td-phan')].filter(p => p.checkVisibility()).map(p => p.id),
              anhHien: anh.map(f => (f.querySelector('img')?.getAttribute('src') ?? '').replace(/^.*\/anh\//, '').replace(/-\d+x\d+-\d+\.\w+$/, '')),
              anhVe: anh.every(f => { const a = f.querySelector('img'); return a.complete && a.naturalWidth > 0; }),
              nhanAnh: anh.map(f => f.querySelector('figcaption')?.checkVisibility() ? f.querySelector('figcaption').textContent.trim() : ''),
              hash: location.hash,
            };
          }, phan);
          const gd = await page.evaluate(doGiaoDien);
          const saiKhac = Object.keys(PHEP_DO).filter(k => k !== 'anh').flatMap(k => (gd[k] ?? ['không đo được']).map(c => `[${k}] ${c}`));
          const tot = [
            ok(`${nhan}: bấm tab → đúng phần này hiện (hai phần kia ẩn), tab được đánh dấu đang chọn, địa chỉ trang thành #${phan}`,
               thay.phanHien.join() === phan && thay.tabDangChon.join() === `td-tab-${phan}` && thay.hash === `#${phan}`,
               `hiện: ${thay.phanHien.join(', ') || 'không phần nào'} · tab: ${thay.tabDangChon.join(', ')} · ${thay.hash}`),
            ok(`${nhan}: phần vừa mở ${anhMong.length ? `có đúng ảnh ${anhMong.join(', ')}, ảnh tải về được, nhãn "Ảnh minh họa" đang hiện` : 'không có ảnh nào'}`,
               thay.anhHien.join() === anhMong.join() && thay.anhVe && thay.nhanAnh.every(n => n.length > 0),
               `ảnh: ${thay.anhHien.join(', ') || 'không'} · tải xong: ${thay.anhVe} · nhãn: ${JSON.stringify(thay.nhanAnh)}`),
            ok(`${nhan}: ${PHEP_DO.anh}`, gd.anh?.length === 0, (gd.anh ?? ['không đo được']).slice(0, 4).join(' | ')),
            ok(`${nhan}: ${Object.keys(PHEP_DO).length - 1} phép đo còn lại của do-giao-dien.mjs vẫn đạt trên phần vừa mở`, saiKhac.length === 0, saiKhac.slice(0, 5).join(' | ')),
          ];
          // Phép đo phải thật sự NHÌN THẤY ảnh của phần vừa mở: giấu nhãn của ảnh đó đi thì phải đỏ. Không có bước
          // này thì một lần sửa làm phép đo lại bỏ qua tab (hay bỏ qua cả ảnh) vẫn xanh.
          if (anhMong.length) {
            const kieuGiau = await page.addStyleTag({ content: `#${phan} figure.anh figcaption { display: none !important; }` });
            const gdGiau = await page.evaluate(doGiaoDien);
            await kieuGiau.evaluate(e => e.remove());
            tot.push(ok(`${nhan}: giấu nhãn "Ảnh minh họa" của ${anhMong.join(', ')} thì phép đo ảnh đỏ — phép đo có nhìn thấy ảnh của tab này`,
              (gdGiau.anh?.length ?? 0) > 0 && gdGiau.anh.some(c => anhMong.some(id => c.includes(id))), (gdGiau.anh ?? []).slice(0, 3).join(' | ') || 'phép đo vẫn đạt'));
          }
          if (tot.includes(false)) await chupLoi(page, `tab${duong}-${phan}-${rong}`);
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
