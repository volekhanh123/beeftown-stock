/**
 * KIỂM THỬ Ô QUÉT NHÃN KHI MẤT MẠNG — Chromium thật, tắt mạng giữa chừng
 * ======================================================================
 *
 *     npm run thu-quet-luu-tam
 *
 * Phần chạy trong trình duyệt của "lưu tạm lượt quét" (src/lib/kho/quet-luu-tam-trinh-duyet.ts — ý tưởng ở đầu file
 * quet-luu-tam.ts) cần trình duyệt thật: localStorage, sự kiện online, requestSubmit, fetch theo chuyển hướng. Trang
 * kho thật cần đăng nhập và cả chục bảng database, nên file này dựng MÁY CHỦ GIẢ trên 127.0.0.1 đóng đúng vai hai
 * trang ghi sổ theo hợp đồng mà crm/test/test-kho-quet-luu-tam-web.mjs kiểm trên mã thật: lượt đã xử lý → 303 về chính
 * trang, câu báo trong [data-bao-ket-qua]; database lỗi → trang dựng lại (200), mã còn trong ô; cùng ma_gui gửi lại
 * → không cộng đôi. Markup của ô quét chép từ components/kho/QuetMa.astro (các thuộc tính phần gắn cần — bên dưới
 * kiểm chúng còn trong file đó). Thư viện thật được đóng gói bằng esbuild, nạp vào trang giả.
 *
 * Bất biến (đếm quầy, trừ khi ghi khác):
 *   1. Có mạng: hỏi mạng (HEAD file tĩnh) rồi gửi form như cũ — máy chủ nhận đúng một lượt, không gì nằm lại máy.
 *   2. Mất mạng thật (navigator.onLine = false): không có lượt gửi nào; lượt vào hàng chờ với đúng sáu ô (viec,
 *      ma_quet, vi_tri_id, kiem_ke_id, ma_gui, ma_gui_mo); ô quét trống; ma_gui của form đổi — lượt kế tiếp là lượt
 *      khác; câu nói "CHƯA vào sổ". Nút "Xong" của camera (requestSubmit) cũng vào hàng chờ.
 *   3. Còn lượt chờ: "Quét xong" (form POST khác của trang) bị chặn, không lượt gửi nào, câu giải thích hiện ra.
 *   4. Có mạng lại (sự kiện online): các lượt gửi theo thứ tự, mỗi ma_gui đúng một lần, máy chủ cộng đủ nhãn; câu
 *      "Kho đã nhận … : <câu của kho>" và nút tải lại; hàng chờ rỗng; "Quét xong" đi được.
 *   5. Gửi lại một lượt kho đã nhận (cùng ma_gui) → máy chủ không cộng đôi, lượt rời hàng.
 *   6. WiFi có mà không ra Internet (navigator.onLine vẫn true, kết nối bị cắt): hỏi mạng hỏng → lưu tạm; mạng về mà
 *      không có sự kiện online → nhịp hẹn giờ tự gửi.
 *   7. Database lỗi lúc gửi lại (200, không chuyển hướng) → giữ lượt, chưa thôi tự gửi; lần sau gửi được.
 *   8. Kho trả câu lỗi (303 + câu lỗi) → giữ lượt, thôi tự gửi, hiện NGUYÊN câu của kho; vẫn chặn Quét xong; "Bỏ các
 *      lượt chờ" hỏi lại rồi mới xóa, và chỉ xóa lượt của chính trang đó.
 *   9. Phiên hết (chuyển sang trang đăng nhập) → giữ lượt, câu "Cần đăng nhập lại".
 *  10. Lượt của tài khoản khác trên cùng máy: không gửi, chỉ báo.
 *  11. Pha lóc: gửi lại chỉ mang viec, ma_quet, ma_gui — không so_ra, phien_ban, ô gõ tay; còn kg gõ tay chưa lưu
 *      thì nút "Tải lại" hỏi trước.
 *  11b. Sóng yếu: lần gửi lại không có trả lời thì hết hạn chờ, lần sau gửi được (không treo cả hàng).
 *  12. Trang chỉ đọc mã (Quét nhãn, form GET): mất mạng thì không rời trang, mã còn trong ô, không vào hàng chờ; có
 *      mạng thì đi như cũ.
 *  13. Bản nháp: gõ mã chưa gửi rồi tải lại trang → mã được đưa lại vào ô, kèm câu báo.
 *  Không lỗi JavaScript nào trên trang.
 */

import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const NGUOI = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const NGUOI_KHAC = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const MA_GUI_MO = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const DEM = '/noi-bo/kho/quay/dem';
const PHA = '/noi-bo/kho/pha-loc/dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const QUET = '/noi-bo/kho/quet';
const nhan = (ma, g) => `20${String(ma).padStart(5, '0')}${String(g).padStart(5, '0')}`;   // không cần số kiểm: máy chủ giả không đọc

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
// Markup của ô quét: các thuộc tính phần gắn cần phải còn trong QuetMa.astro
// ---------------------------------------------------------------------------
const quetMa = readFileSync(join(WEB, 'src/components/kho/QuetMa.astro'), 'utf8');
const CAN = ['data-quet-ma', '<textarea name="ma_quet"', 'data-quet-gui', 'data-nguoi=', 'data-nn=', 'data-gui-lai='];
const thieuMarkup = CAN.filter(c => !quetMa.includes(c));

const oQuet = ({ guiLai = '', giaTri = '', nhanNut = 'Cộng vào số đếm', nguoi = NGUOI } = {}) => `
  <div class="kho-quet" data-quet-ma data-nn="vi" data-nguoi="${nguoi}"${guiLai ? ` data-gui-lai="${guiLai}"` : ''} data-hen-gui-ms="300" data-cho-gui-lai-ms="1500">
    <label class="nb-o"><span>Quét nhãn cân</span><textarea name="ma_quet" rows="3">${giaTri}</textarea></label>
    <div class="kho-thanh-nut"><button type="submit" name="viec" value="quet" class="nb-nut phu" formnovalidate data-quet-gui>${nhanNut}</button></div>
  </div>`;

// ---------------------------------------------------------------------------
// Máy chủ giả
// ---------------------------------------------------------------------------
const { outputFiles } = await build({
  stdin: {
    contents: "import { ganQuetLuuTam } from './src/lib/kho/quet-luu-tam-trinh-duyet.ts'; window.ganQuetLuuTam = ganQuetLuuTam;",
    resolveDir: WEB, loader: 'ts', sourcefile: 'thu-quet-luu-tam-vao.ts',
  },
  bundle: true, format: 'iife', write: false, target: 'es2022',
});
const GOI_JS = outputFiles[0].text;

const may = {
  cheDo: 'thuong',       // thuong | db-loi | tu-choi | dang-nhap | treo (không bao giờ trả lời)
  cat: false,            // true: cắt mọi kết nối (WiFi có, Internet không)
  luot: new Map(),       // ma_gui → số nhãn đã cộng (đếm quầy)
  xong: 0, bao: null, gui: [], hoi: 0, pha: [], treo: [],
};
const datLai = () => Object.assign(may, { cheDo: 'thuong', cat: false, luot: new Map(), xong: 0, bao: null, gui: [], hoi: 0, pha: [] });
const tongNhan = () => [...may.luot.values()].reduce((s, n) => s + n, 0);

const trang = (than) => `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Kho thử</title></head><body><main>
${may.bao ? `<div class="nb-bao ${may.bao.kieu}" role="${may.bao.kieu === 'xong' ? 'status' : 'alert'}" data-bao-ket-qua="${may.bao.kieu}"><p>${may.bao.cau}</p></div>` : ''}
${than}</main>
<script src="/thu/quet-luu-tam.js"></script>
<script>document.querySelectorAll('[data-quet-ma]').forEach(g => window.ganQuetLuuTam(g));</script>
</body></html>`;
const trangDem = (giaTri = '') => trang(`
  <h1>Đếm quầy</h1><p id="tong">${tongNhan()}</p>
  <form method="POST" action="${DEM}" class="nb-the">
    <input type="hidden" name="vi_tri_id" value="q1" />
    <input type="hidden" name="kiem_ke_id" value="" />
    <input type="hidden" name="ma_gui" value="${randomUUID()}" />
    <input type="hidden" name="ma_gui_mo" value="${MA_GUI_MO}" />
    ${oQuet({ guiLai: 'ma_gui ma_gui_mo kiem_ke_id vi_tri_id', giaTri })}
  </form>
  <form method="POST" action="${DEM}"><input type="hidden" name="vi_tri_id" value="q1" />
    <button type="submit" name="viec" value="xong" id="quet-xong">Quét xong</button></form>`);
const trangPha = () => trang(`
  <h1>Pha lóc</h1>
  <form method="POST" action="${PHA}">
    <input type="hidden" name="ma_gui" value="${randomUUID()}" />
    <input type="hidden" name="ma_gui_sua" value="${randomUUID()}" />
    <input type="hidden" name="phien_ban" value="7" />
    <input type="hidden" name="so_ra" value="3" />
    ${oQuet({ guiLai: 'ma_gui', nhanNut: 'Cộng nhãn' })}
    <input name="r0_so_kg" value="1,5" />
  </form>`);
const trangQuet = (ma) => trang(`
  <h1>Quét nhãn</h1>${ma ? `<p id="ket-qua">Món của ${ma}</p>` : ''}
  <form method="GET" class="nb-the">${oQuet({ nhanNut: 'Xem món này' })}</form>`);

const docThan = req => new Promise(xong => { let b = ''; req.on('data', c => { b += c; }); req.on('end', () => xong(b)); });
const tra = (res, status, than = '', dau = {}) => { res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', ...dau }); res.end(than); };

const mayChu = createServer(async (req, res) => {
  if (may.cat) { req.socket.destroy(); return; }
  const u = new URL(req.url, 'http://127.0.0.1');
  if (u.pathname === '/kho/js/ean13.js') { may.hoi++; return tra(res, 200, req.method === 'HEAD' ? '' : '/* */', { 'content-type': 'text/javascript' }); }
  if (u.pathname === '/thu/quet-luu-tam.js') return tra(res, 200, GOI_JS, { 'content-type': 'text/javascript' });
  if (u.pathname === '/noi-bo/dang-nhap') return tra(res, 200, '<!doctype html><title>Đăng nhập</title><h1>Đăng nhập</h1>');
  if (req.method === 'GET') {
    const bao = may.bao;
    let html;
    if (u.pathname === DEM) html = trangDem();
    else if (u.pathname === PHA) html = trangPha();
    else if (u.pathname === QUET) html = trangQuet(u.searchParams.get('ma_quet') ?? '');
    else return tra(res, 404, 'không có');
    if (bao) may.bao = null;   // câu báo dùng một lần, như cookie bt_kho_bao
    return tra(res, 200, html);
  }
  const p = new URLSearchParams(await docThan(req));
  const truong = [...p.entries()];
  if (u.pathname === PHA) {
    may.pha.push(truong);
    may.bao = { kieu: 'xong', cau: 'Đã cộng nhãn vào phiên.' };
    return tra(res, 303, '', { location: PHA });
  }
  if (u.pathname !== DEM) return tra(res, 404, 'không có');
  may.gui.push(truong);
  if (may.cheDo === 'treo') { may.treo.push(res); return; }
  if (may.cheDo === 'dang-nhap') return tra(res, 302, '', { location: '/noi-bo/dang-nhap' });
  if (may.cheDo === 'db-loi') {
    may.bao = { kieu: 'loi', cau: 'Không kết nối được database.' };
    const html = trangDem(p.get('ma_quet') ?? '');
    may.bao = null;
    return tra(res, 200, html);
  }
  if (may.cheDo === 'tu-choi') {
    may.bao = { kieu: 'loi', cau: '"Quầy thịt" đang có phiếu kiểm kê KK-0007 chưa xong' };
    return tra(res, 303, '', { location: `${DEM}?vi_tri=q1` });
  }
  if (p.get('viec') === 'xong') {
    may.xong++;
    may.bao = { kieu: 'xong', cau: 'Xem lại các món chưa thấy gói nào.' };
  } else {
    const maGui = p.get('ma_gui');
    const so = (p.get('ma_quet') ?? '').split(/[\s,;]+/).filter(Boolean).length;
    if (may.luot.has(maGui)) may.bao = { kieu: 'xong', cau: `Lượt này đã cộng rồi (${may.luot.get(maGui)} nhãn).` };
    else { may.luot.set(maGui, so); may.bao = { kieu: 'xong', cau: `Đã cộng ${so} nhãn.` }; }
  }
  return tra(res, 303, '', { location: `${DEM}?vi_tri=q1` });
});
await new Promise(xong => mayChu.listen(0, '127.0.0.1', xong));
const GOC = `http://127.0.0.1:${mayChu.address().port}`;

// ---------------------------------------------------------------------------
// Trình duyệt
// ---------------------------------------------------------------------------
const trinhDuyet = await chromium.launch();
const ngu = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
const page = await ngu.newPage();
const loiJs = [];
page.on('pageerror', e => loiJs.push(e.message));
let hoiBo = 0;
let dongYHoi = true;
page.on('dialog', d => { hoiBo++; void (dongYHoi ? d.accept() : d.dismiss()); });

const hang = () => page.evaluate(() => JSON.parse(localStorage.getItem('bt-kho-quet-cho') ?? '[]'));
const chuKhung = () => page.evaluate(() => document.querySelector('[data-quet-cho]')?.textContent ?? '');
const choKhung = (re, ms = 5000) => page.waitForFunction(
  s => new RegExp(s).test(document.querySelector('[data-quet-cho]')?.textContent ?? ''), re.source, { timeout: ms },
).then(() => true, () => false);
const quet = async (ma) => { await page.fill('textarea[name="ma_quet"]', ma); await page.click('button[data-quet-gui]'); };
const moTrang = async (duong) => { await page.goto(GOC + duong); await page.waitForFunction(() => !!document.querySelector('[data-quet-cho]')); };
const xoaMay = () => page.evaluate(() => localStorage.clear());

try {
  await nhom('0 · MARKUP CỦA Ô QUÉT KHỚP VỚI QuetMa.astro', async () => {
    ok('QuetMa.astro còn đủ thuộc tính mà phần gắn đọc', thieuMarkup.length === 0, thieuMarkup.join(', '));
  });

  await nhom('1 · CÓ MẠNG: HỎI MẠNG RỒI GỬI NHƯ CŨ', async () => {
    datLai();
    await moTrang(DEM);
    await xoaMay();
    await quet(`${nhan(10001, 215)}\n${nhan(10001, 70)}`);
    await page.waitForURL(`${GOC}${DEM}?vi_tri=q1`);
    await page.waitForFunction(() => !!document.querySelector('[data-quet-cho]'));
    ok('Máy chủ nhận đúng một lượt, 2 nhãn', may.gui.length === 1 && tongNhan() === 2, JSON.stringify(may.gui));
    ok('Hỏi mạng (HEAD file tĩnh) trước khi gửi', may.hoi >= 1);
    ok('Trang sau hiện câu của kho, hàng chờ rỗng', /Đã cộng 2 nhãn/.test(await page.textContent('main')) && (await hang()).length === 0);
  });

  await nhom('2 · MẤT MẠNG THẬT: LƯU TẠM, KHÔNG GỬI GÌ', async () => {
    const guiTruoc = may.gui.length;
    const maGuiForm = await page.inputValue('input[name="ma_gui"]');
    await ngu.setOffline(true);
    await quet(`${nhan(10002, 300)}\n${nhan(10002, 310)}\n${nhan(10003, 120)}`);
    ok('Câu "đã lưu tạm 3 nhãn … CHƯA vào sổ"', await choKhung(/đã lưu tạm 3 nhãn trên máy này, CHƯA vào sổ kho/), await chuKhung());
    const h = await hang();
    ok('Hàng chờ: một lượt, đúng sáu ô theo thứ tự',
      h.length === 1 && h[0].truong.map(([t]) => t).join() === 'viec,ma_quet,vi_tri_id,kiem_ke_id,ma_gui,ma_gui_mo'
      && h[0].ma_gui === maGuiForm && h[0].so_nhan === 3 && h[0].nguoi === NGUOI, JSON.stringify(h));
    ok('Không lượt gửi nào tới máy chủ', may.gui.length === guiTruoc);
    ok('Ô quét trống; ma_gui của form đã đổi', (await page.inputValue('textarea[name="ma_quet"]')) === ''
      && (await page.inputValue('input[name="ma_gui"]')) !== maGuiForm);
    // Nút "Xong" của camera gửi bằng requestSubmit(nút).
    await page.fill('textarea[name="ma_quet"]', nhan(10004, 500));
    await page.evaluate(() => { const n = document.querySelector('button[data-quet-gui]'); n.form.requestSubmit(n); });
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('bt-kho-quet-cho') ?? '[]').length === 2, null, { timeout: 5000 }).catch(() => {});
    const h2 = await hang();
    ok('Nút Xong của camera (requestSubmit) cũng vào hàng chờ, ma_gui khác lượt trước',
      h2.length === 2 && h2[0].ma_gui !== h2[1].ma_gui && h2[1].so_nhan === 1, JSON.stringify(h2.map(x => x.ma_gui)));
    ok('Khung tổng: 4 nhãn (2 lượt quét) đang lưu tạm', /4 nhãn \(2 lượt quét\) đang lưu tạm/.test(await chuKhung()), await chuKhung());
  });

  await nhom('3 · CÒN LƯỢT CHỜ: "QUÉT XONG" BỊ CHẶN', async () => {
    const guiTruoc = may.gui.length;
    await page.click('#quet-xong');
    ok('Câu giải thích hiện ra', await choKhung(/Còn 2 lượt quét \(4 nhãn\) chưa vào sổ/), await chuKhung());
    ok('Không lượt gửi nào, vẫn ở trang', may.gui.length === guiTruoc && may.xong === 0 && page.url().startsWith(GOC + DEM));
  });

  await nhom('4 · CÓ MẠNG LẠI: TỰ GỬI ĐÚNG THỨ TỰ, MỖI LƯỢT MỘT LẦN', async () => {
    const h = await hang();
    await ngu.setOffline(false);
    const xong = await page.waitForFunction(() => JSON.parse(localStorage.getItem('bt-kho-quet-cho') ?? '[]').length === 0, null, { timeout: 8000 })
      .then(() => true, () => false);
    ok('Hàng chờ rỗng sau khi có mạng', xong);
    const gui = may.gui.slice(-2).map(t => Object.fromEntries(t));
    ok('Máy chủ nhận hai lượt theo đúng thứ tự, đúng ma_gui', gui.length === 2 && gui[0].ma_gui === h[0].ma_gui && gui[1].ma_gui === h[1].ma_gui
      && gui.every(g => g.ma_gui_mo === MA_GUI_MO && g.vi_tri_id === 'q1' && g.viec === 'quet'), JSON.stringify(gui));
    ok('Máy chủ cộng đủ: 2 + 3 + 1 = 6 nhãn', tongNhan() === 6, String(tongNhan()));
    ok('Câu "Kho đã nhận lượt quét lúc … : Đã cộng 1 nhãn." và nút tải lại',
      await choKhung(/Kho đã nhận lượt quét lúc \d\d:\d\d \(1 nhãn\): Đã cộng 1 nhãn\./)
      && await page.isVisible('[data-quet-tai-lai]'), await chuKhung());
    await page.click('#quet-xong');
    await page.waitForURL(/vi_tri=q1/);
    ok('Hết lượt chờ: "Quét xong" đi được', may.xong === 1);
  });

  await nhom('5 · GỬI LẠI MỘT LƯỢT KHO ĐÃ NHẬN: KHÔNG CỘNG ĐÔI', async () => {
    await moTrang(DEM);
    const daNhan = Object.fromEntries(may.gui.find(t => Object.fromEntries(t).viec === 'quet' && may.luot.get(Object.fromEntries(t).ma_gui) === 3));
    const tongTruoc = tongNhan();
    await page.evaluate(([l, nguoi]) => {
      localStorage.setItem('bt-kho-quet-cho', JSON.stringify([{
        ma_gui: l.ma_gui, duong: '/noi-bo/kho/quay/dem', url: '/noi-bo/kho/quay/dem', truong: Object.entries(l),
        so_nhan: 3, luc: Date.now(), nguoi, lan_thu: 0, dung: false, cau_kho: '',
      }]));
    }, [daNhan, NGUOI]);
    // Mở lại trang khi máy còn lượt chờ (như người dùng quay lại trang hôm sau) — trang tự gửi.
    await page.reload();
    await page.waitForFunction(() => !localStorage.getItem('bt-kho-quet-cho'), null, { timeout: 8000 }).catch(() => {});
    ok('Lượt rời hàng, máy chủ không cộng thêm', (await hang()).length === 0 && tongNhan() === tongTruoc, `${tongNhan()} / ${tongTruoc}`);
    ok('Câu của kho được nói lại', await choKhung(/đã cộng rồi \(3 nhãn\)/), await chuKhung());
  });

  await nhom('6 · WIFI CÓ MÀ KHÔNG RA INTERNET: HỎI MẠNG HỎNG → LƯU TẠM; MẠNG VỀ → NHỊP TỰ GỬI', async () => {
    await moTrang(DEM);
    const guiTruoc = may.gui.length;
    const tongTruoc = tongNhan();
    may.cat = true;
    await quet(nhan(10005, 800));
    ok('Hỏi mạng hỏng → lưu tạm (navigator.onLine vẫn true)', await choKhung(/đã lưu tạm 1 nhãn/, 9000)
      && (await page.evaluate(() => navigator.onLine)) === true, await chuKhung());
    may.cat = false;
    const xong = await page.waitForFunction(() => !localStorage.getItem('bt-kho-quet-cho'), null, { timeout: 8000 }).then(() => true, () => false);
    ok('Không có sự kiện online vẫn tự gửi theo nhịp hẹn giờ', xong && may.gui.length === guiTruoc + 1 && tongNhan() === tongTruoc + 1);
  });

  await nhom('7 · DATABASE LỖI LÚC GỬI LẠI: GIỮ LƯỢT, GỬI LẠI SAU', async () => {
    await moTrang(DEM);
    await ngu.setOffline(true);
    await quet(nhan(10006, 900));
    await choKhung(/đã lưu tạm 1 nhãn/);
    may.cheDo = 'db-loi';
    const guiTruoc = may.gui.length;
    await ngu.setOffline(false);
    const toi = Date.now() + 5000;
    while (may.gui.length === guiTruoc && Date.now() < toi) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 200));
    const h = await hang();
    ok('Máy chủ trả 200 (dựng lại) → lượt còn, lan_thu tăng, chưa thôi tự gửi',
      may.gui.length > guiTruoc && h.length === 1 && h[0].lan_thu >= 1 && h[0].dung === false, JSON.stringify(h));
    may.cheDo = 'thuong';
    const tongTruoc = tongNhan();
    const xong = await page.waitForFunction(() => !localStorage.getItem('bt-kho-quet-cho'), null, { timeout: 8000 }).then(() => true, () => false);
    ok('Database hết lỗi → lượt được nhận, cộng đúng một lần', xong && tongNhan() === tongTruoc + 1);
  });

  await nhom('8 · KHO TRẢ CÂU LỖI: GIỮ, THÔI TỰ GỬI, NGUYÊN CÂU CỦA KHO; BỎ PHẢI HỎI LẠI', async () => {
    await moTrang(DEM);
    await ngu.setOffline(true);
    await quet(`${nhan(10007, 100)}\n${nhan(10007, 110)}`);
    await choKhung(/đã lưu tạm 2 nhãn/);
    may.cheDo = 'tu-choi';
    await ngu.setOffline(false);
    const dung = await page.waitForFunction(() => JSON.parse(localStorage.getItem('bt-kho-quet-cho') ?? '[]')[0]?.dung === true, null, { timeout: 8000 })
      .then(() => true, () => false);
    const h = await hang();
    ok('Lượt còn, thôi tự gửi, giữ câu của kho', dung && h.length === 1 && /KK-0007/.test(h[0].cau_kho), JSON.stringify(h));
    ok('Khung hiện nguyên câu của kho và cách làm tiếp',
      await choKhung(/kho trả lời: «"Quầy thịt" đang có phiếu kiểm kê KK-0007 chưa xong»/) && /Gửi ngay/.test(await chuKhung()), await chuKhung());
    const guiTruoc = may.gui.length;
    await new Promise(r => setTimeout(r, 900));
    ok('Đã thôi: nhịp hẹn giờ không gửi lại', may.gui.length === guiTruoc);
    await page.click('#quet-xong');
    ok('Vẫn chặn "Quét xong"', await choKhung(/Còn 1 lượt quét \(2 nhãn\) chưa vào sổ/) && may.xong === 1);
    may.cheDo = 'thuong';
    // Một lượt chờ của trang khác (pha lóc) cùng người: "Bỏ" ở trang này không được đụng tới nó.
    await page.evaluate(nguoi => {
      const ds = JSON.parse(localStorage.getItem('bt-kho-quet-cho') ?? '[]');
      ds.push({ ma_gui: 'ffffffff-ffff-4fff-8fff-ffffffffffff', duong: '/noi-bo/kho/pha-loc/x', url: '/noi-bo/kho/pha-loc/x',
        truong: [['viec', 'quet'], ['ma_quet', '1'], ['ma_gui', 'ffffffff-ffff-4fff-8fff-ffffffffffff']],
        so_nhan: 1, luc: Date.now(), nguoi, lan_thu: 0, dung: true, cau_kho: '' });
      localStorage.setItem('bt-kho-quet-cho', JSON.stringify(ds));
    }, NGUOI);
    const hoiTruoc = hoiBo;
    await page.click('[data-quet-cho] button[data-quet-bo]');
    const conLai = await hang();
    ok('Bỏ: hỏi lại trước khi xóa, chỉ bỏ lượt của CHÍNH trang này (lượt trang pha lóc còn nguyên)',
      hoiBo === hoiTruoc + 1 && conLai.length === 1 && conLai[0].duong === '/noi-bo/kho/pha-loc/x', JSON.stringify(conLai));
    await xoaMay();
  });

  await nhom('9 · PHIÊN HẾT: GIỮ LƯỢT, CẦN ĐĂNG NHẬP LẠI', async () => {
    await moTrang(DEM);
    await ngu.setOffline(true);
    await quet(nhan(10008, 100));
    await choKhung(/đã lưu tạm 1 nhãn/);
    may.cheDo = 'dang-nhap';
    await ngu.setOffline(false);
    ok('Câu "Cần đăng nhập lại để gửi 1 lượt quét"', await choKhung(/Cần đăng nhập lại để gửi 1 lượt quét/, 8000), await chuKhung());
    ok('Lượt vẫn còn, chưa thôi tự gửi', (await hang()).length === 1 && (await hang())[0].dung === false);
    may.cheDo = 'thuong';
    await xoaMay();
  });

  await nhom('10 · LƯỢT CỦA TÀI KHOẢN KHÁC TRÊN CÙNG MÁY: KHÔNG GỬI', async () => {
    await page.evaluate(nguoi => {
      localStorage.setItem('bt-kho-quet-cho', JSON.stringify([{
        ma_gui: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', duong: '/noi-bo/kho/quay/dem', url: '/noi-bo/kho/quay/dem',
        truong: [['viec', 'quet'], ['ma_quet', '2010009000100'], ['ma_gui', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee']],
        so_nhan: 1, luc: Date.now(), nguoi, lan_thu: 0, dung: false, cau_kho: '',
      }]));
    }, NGUOI_KHAC);
    const guiTruoc = may.gui.length;
    await moTrang(DEM);
    ok('Báo lượt của tài khoản khác', await choKhung(/còn 1 lượt quét của tài khoản khác chưa gửi/), await chuKhung());
    await new Promise(r => setTimeout(r, 1200));
    ok('Không gửi lượt đó, không chặn Quét xong của người này', may.gui.length === guiTruoc && (await hang()).length === 1);
    await xoaMay();
  });

  await nhom('11 · PHA LÓC: GỬI LẠI CHỈ MANG viec, ma_quet, ma_gui', async () => {
    await moTrang(PHA);
    await ngu.setOffline(true);
    await quet(nhan(10010, 450));
    await choKhung(/đã lưu tạm 1 nhãn/);
    await ngu.setOffline(false);
    await page.waitForFunction(() => !localStorage.getItem('bt-kho-quet-cho'), null, { timeout: 8000 }).catch(() => {});
    const t = may.pha.at(-1) ?? [];
    ok('Thân lượt gửi lại: viec, ma_quet, ma_gui — không so_ra, phien_ban, ô gõ tay',
      t.map(([k]) => k).join() === 'viec,ma_quet,ma_gui', JSON.stringify(t));
    // Kg gõ tay chưa lưu: nút "Tải lại" hỏi trước; bấm Hủy thì ở nguyên trang, số vẫn còn.
    await page.fill('input[name="r0_so_kg"]', '3,2');
    const hoiTruoc = hoiBo;
    dongYHoi = false;
    await page.click('[data-quet-cho] button[data-quet-tai-lai]');
    dongYHoi = true;
    ok('Tải lại khi còn kg gõ tay chưa lưu → hỏi trước; Hủy thì không rời trang, số còn nguyên',
      hoiBo === hoiTruoc + 1 && (await page.inputValue('input[name="r0_so_kg"]')) === '3,2');
  });

  await nhom('11b · SÓNG YẾU: GỬI LẠI KHÔNG CÓ TRẢ LỜI → HẾT HẠN, GỬI LẠI SAU', async () => {
    await moTrang(DEM);
    await ngu.setOffline(true);
    await quet(nhan(10013, 300));
    await choKhung(/đã lưu tạm 1 nhãn/);
    may.cheDo = 'treo';
    await ngu.setOffline(false);
    const toi = Date.now() + 5000;
    while (may.treo.length === 0 && Date.now() < toi) await new Promise(r => setTimeout(r, 100));
    ok('Lần gửi lại đầu treo (máy chủ không trả lời)', may.treo.length >= 1);
    may.cheDo = 'thuong';
    const tongTruoc = tongNhan();
    const xong = await page.waitForFunction(() => !localStorage.getItem('bt-kho-quet-cho'), null, { timeout: 10000 }).then(() => true, () => false);
    ok('Hết hạn chờ thì bỏ lần treo, lần sau gửi được, cộng đúng một lần', xong && tongNhan() === tongTruoc + 1, `${tongNhan()} / ${tongTruoc}`);
    for (const r of may.treo.splice(0)) r.destroy?.() ?? r.socket?.destroy();
  });

  await nhom('12 · TRANG CHỈ ĐỌC MÃ (form GET): MẤT MẠNG THÌ GIỮ MÃ TRONG Ô', async () => {
    await moTrang(QUET);
    await ngu.setOffline(true);
    await quet(nhan(10011, 200));
    ok('Câu "chưa đọc được các mã", vẫn ở trang', await choKhung(/chưa đọc được các mã/) && page.url() === GOC + QUET, await chuKhung());
    ok('Mã còn trong ô, không vào hàng chờ', (await page.inputValue('textarea[name="ma_quet"]')) === nhan(10011, 200) && (await hang()).length === 0);
    await ngu.setOffline(false);
    await page.click('button[data-quet-gui]');
    await page.waitForURL(/ma_quet=/);
    ok('Có mạng: đi như cũ (GET kèm mã)', /Món của 2010011/.test(await page.textContent('main')));
  });

  await nhom('13 · BẢN NHÁP: GÕ MÃ CHƯA GỬI, TẢI LẠI TRANG → MÃ ĐƯỢC ĐƯA LẠI', async () => {
    await moTrang(DEM);
    await page.fill('textarea[name="ma_quet"]', nhan(10012, 640));
    await page.reload();
    await page.waitForFunction(() => !!document.querySelector('[data-quet-cho]'));
    ok('Mã được đưa lại vào ô, kèm câu báo', (await page.inputValue('textarea[name="ma_quet"]')) === nhan(10012, 640)
      && await choKhung(/Đã đưa lại vào ô 1 nhãn quét lúc \d\d:\d\d mà chưa gửi/), await chuKhung());
    await page.click('button[data-quet-gui]');
    await page.waitForURL(/vi_tri=q1/);
    await page.waitForFunction(() => !!document.querySelector('[data-quet-cho]'));
    ok('Gửi xong thì bản nháp không đưa lại nữa', (await page.inputValue('textarea[name="ma_quet"]')) === '');
  });

  ok('Không lỗi JavaScript nào trên trang', loiJs.length === 0, loiJs.join(' | '));
} finally {
  await trinhDuyet.close();
  mayChu.close();
}

console.log('\n' + '='.repeat(60));
if (hong === 0) console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA Ô QUÉT KHI MẤT MẠNG ĐỀU ĐẠT\x1b[0m`);
else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  for (const l of loi) console.log(`  \x1b[31m· ${l}\x1b[0m`);
}
process.exit(hong === 0 ? 0 : 1);
