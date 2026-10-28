/**
 * BEEFTOWN — MỞ RỘNG FABi: THỬ TRONG CHROMIUM THẬT
 * =================================================
 *
 *     node mo-rong-fabi/thu/thu-trinh-duyet.mjs        (từ gốc repo; CI: kiem-thu.yml, job database-va-can)
 *
 * Nạp extension thật (mo-rong-fabi/) vào Chromium, trỏ fabi.ipos.vn và beeftown.vn về một máy chủ HTTPS giả trên máy
 * (--host-resolver-rules, chứng chỉ tự ký tạo lúc chạy bằng openssl). Trang FABi giả dựng theo HTML Cowork chép ở
 * FABi CMS thật ngày 28/10/2026: bảng món có cột "Mã món", dòng "Tổng: … món", nút Tiện ích → "Thêm món từ file",
 * hộp thoại "Thêm món" (ba bước, <input type="file" class="excel-upload-input"> ẩn) cùng hai hộp thoại ẩn khác cũng
 * có ô excel-upload-input. Kho giả: đăng nhập bằng cookie (HttpOnly, Secure, SameSite=Lax, như kho thật), chưa đăng
 * nhập thì 302 về /noi-bo/dang-nhap như middleware.ts.
 *
 * Kiểm những điều đọc mã không bắt được: service worker gửi được cookie phiên kho; file vào đúng ô của hộp thoại
 * ĐANG HIỆN và trang nhận được (FileReader đọc ra "PK"); cuộn cho bảng tải hết rồi mới hỏi kho; mã có chữ không
 * gửi; bấm đúp chỉ hỏi kho một lần; mọi kiểu hỏng (chưa đăng nhập, 403, 500, đứt kết nối, không có món mới, bảng
 * đọc thiếu, ô tìm kiếm có chữ, bộ lọc khác, không thấy Tổng) báo đúng câu và KHÔNG đưa gì vào FABi; chỉ báo
 * "đã xong" khi trang FABi hiện "Tải lên thành công"; khung chỉ hiện ở trang danh sách, kể cả khi đổi trang kiểu
 * ứng dụng một trang; trình duyệt tiếng Anh thấy câu tiếng Anh.
 *
 * Chromium: Playwright của web/ (cd web && npm ci && npx playwright install chromium); không mở được thì bản
 * Playwright cài chung của máy. Không bản nào mở được → ĐỎ, không bỏ qua.
 */
import https from 'node:https';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoTepExcel, KIEU_XLSX } from '../../web/src/lib/kho/tep-excel.ts';

const THU_MUC = dirname(fileURLToPath(import.meta.url));
/** --chup <thư mục>: chụp khung extension ở từng trạng thái (để người xem bằng mắt; ảnh không vào git). */
const CHUP = process.argv.includes('--chup') ? process.argv[process.argv.indexOf('--chup') + 1] : null;
const chup = async (trang, ten) => { if (CHUP) await trang.screenshot({ path: join(CHUP, `${ten}.png`) }); };
const MO_RONG = join(THU_MUC, '..');
const GOC = join(MO_RONG, '..');

let dat = 0, hong = 0;
function ok(ten, dung, chiTiet = '') {
  if (dung) { dat += 1; console.log(`  \x1b[32m✓\x1b[0m ${ten}`); } else { hong += 1; console.log(`  \x1b[31m✗ ${ten}\x1b[0m${chiTiet ? `\n      ${chiTiet}` : ''}`); }
}
const nhom = ten => console.log(`\n\x1b[1m${ten}\x1b[0m`);

// ---------------------------------------------------------------------------
// MÁY CHỦ GIẢ: fabi.ipos.vn + beeftown.vn trên cùng một cổng HTTPS
// ---------------------------------------------------------------------------
const tam = mkdtempSync(join(tmpdir(), 'mo-rong-fabi-'));
execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(tam, 'khoa.pem'), '-out', join(tam, 'cc.pem'),
  '-days', '1', '-subj', '/CN=thu', '-addext', 'subjectAltName=DNS:fabi.ipos.vn,DNS:beeftown.vn'], { stdio: 'ignore' });

const MA_FABI = ['01011', '01012', 'ITEM-HJAE', '1013', '01019'];
const TEP = taoTepExcel([{ ten: 'Menu', hang: [['Thành phố', 'Tên', 'Giá', 'Mã món'], ['Hồ Chí Minh', 'Sườn bò', 700000, '01016'],
  ['Hồ Chí Minh', 'Gầu bò', 400000, '01018']] }]);
const kho = { cheDo: 'tep', yeuCau: [] };

const CAU_KHO = {
  khong_co: 'Không có món mới nào cần thêm trên FABi — mọi món cân, ô mã, mã giảm đang dùng đã có trên FABi, đã bán qua FABi, đã ghép, hoặc chưa có giá.',
  loi500: 'Không đọc được danh sách món cho FABi — chưa tạo file. Thử lại sau ít phút.',
  cam: 'Tài khoản không tải được danh sách món cho FABi (cần quyền danh mục).',
};

function traKho(yeu, tra) {
  const url = new URL(yeu.url, 'https://beeftown.vn');
  if (url.pathname === '/noi-bo/dang-nhap') {
    tra.writeHead(200, { 'set-cookie': 'phien-kho=thu; Path=/; HttpOnly; Secure; SameSite=Lax', 'content-type': 'text/html; charset=utf-8' });
    return tra.end('<p>Đã đăng nhập kho (giả)</p>');
  }
  if (url.pathname === '/noi-bo/kho/may') {
    tra.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return tra.end('<p>Màn máy (giả)</p>');
  }
  if (url.pathname !== '/noi-bo/kho/ban-ipos/mon-fabi.xlsx') { tra.writeHead(404); return tra.end(); }
  const coPhien = /(?:^|;\s*)phien-kho=thu(?:;|$)/.test(yeu.headers.cookie ?? '');
  kho.yeuCau.push({ daCo: url.searchParams.get('da_co'), coPhien });
  if (!coPhien) { tra.writeHead(302, { location: '/noi-bo/dang-nhap' }); return tra.end(); }
  const chu = (status, cau, them = {}) => { tra.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', ...them }); tra.end(cau); };
  switch (kho.cheDo) {
    case 'tep':
      tra.writeHead(200, { 'content-type': KIEU_XLSX, 'content-disposition': 'attachment; filename="them-mon-fabi-cn1-20261028-1200.xlsx"',
        'x-so-mon': '2', 'x-so-da-co': '1', 'x-chi-nhanh': 'CN1' });
      return tra.end(Buffer.from(TEP));
    case 'khong_co': return chu(200, CAU_KHO.khong_co, { 'x-so-mon': '0', 'x-so-da-co': '4' });
    case 'loi500': return chu(500, CAU_KHO.loi500);
    case 'cam': return chu(403, CAU_KHO.cam);
    case 'cat': return yeu.socket.destroy();
    // Tài khoản máy / máy dùng chung đã khóa: moKhoTai chuyển sang màn máy (DUONG_MAY), dù đã đăng nhập.
    case 'may': tra.writeHead(302, { location: '/noi-bo/kho/may' }); return tra.end();
    default: return chu(500, 'chế độ lạ');
  }
}

/** Trang "Món ăn tại thành phố" giả. Tham số: tong, dau (số dòng tải lần đầu), ket (không tải thêm), khongTong,
 *  locKhac (bộ lọc thành phố đang chọn một thành phố), khongTienIch (không có nút Tiện ích), tim (ô tìm kiếm có chữ). */
function trangDanhSach(q) {
  const tong = Number(q.get('tong') ?? 5), dau = Number(q.get('dau') ?? tong);
  const ma = MA_FABI.slice(0, tong);
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>FABi giả</title><style>
    body { font-family: sans-serif; margin: 0; } .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.2); }
    .modal.dang-mo { display: block; } .modal-dialog { background: #FFFFFF; margin: 40px auto; width: 480px; padding: 16px; }
    .dropdown-menu { display: none; } .dropdown-menu.show { display: block; } .khung-bang { height: 90px; overflow: auto; }
    td, th { height: 40px; } .excel-upload-input { display: none; }
  </style></head><body><div id="app">
    <div class="loc"><input placeholder="Nhập tên hoặc mã món" id="tim" value="${q.has('tim') ? '01011' : ''}">
      <div class="kit-select__container"><p class="text-selected">${q.has('locKhac') ? 'Hồ Chí Minh' : 'Tất cả thành phố'}</p></div>
      <div class="kit-select__container"><p class="text-selected">Tất cả nhóm món</p></div>
      <button class="btn">Thêm món nhanh</button>
      ${q.has('khongTienIch') ? '' : `<div class="dropdown"><button class="btn dropdown-toggle" id="tien-ich">Tiện ích <i class="fas fa-caret-down"></i></button>
        <ul class="dropdown-menu" id="menu"><li><a class="dropdown-item" href="#">Xuất, sửa thực đơn</a></li>
          <li><a class="dropdown-item" href="#" id="mo-nhap">Thêm món từ file</a></li><li><a class="dropdown-item" href="#">Thêm món nhanh</a></li></ul></div>`}
    </div>
    <div class="khung-bang" id="khung"><table class="table list-view__table"><thead><tr><th><input type="checkbox"></th><th>#</th><th>Mã món</th>
      <th>Tên món</th><th>Giá</th></tr></thead><tbody id="than"></tbody></table></div>
    ${q.has('khongTong') ? '' : `<p>Tổng: ${tong} món</p>`}
  </div>
  <div class="modal fade show kit-modal__container" id="xuat"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h3>Xuất, sửa thực đơn</h3></div>
    <div class="modal-body"><input type="file" accept=".xlsx, .xls" class="excel-upload-input"></div></div></div></div>
  <div class="modal fade show kit-modal__container" id="nguon"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h3>Cấu hình giá theo nguồn</h3></div>
    <div class="modal-body">Tải file thực đơn lên <input type="file" accept=".xlsx, .xls" class="excel-upload-input"></div></div></div></div>
  <div tabindex="-1" role="dialog" class="modal fade show kit-modal__container" id="nhap"><div class="fade show modal-backdrop"></div><div role="document" class="modal-dialog modal-md"><div class="modal-content">
    <div class="modal-header"><h5 class="text-heading--medium mb-0 text-center mx-auto"><h3 class="mb-0">Thêm món</h3></h5>
      <button type="button" data-dismiss="modal" aria-label="Close" class="close ml-0 close__btn"><span aria-hidden="true">×</span></button></div>
    <div class="modal-body overflow-auto"><div class="overflow-auto import-guideline">
      <div class="step-container"><div class="step-content"><h2>Bước 1. Tải file mẫu</h2></div><button class="btn btn-outline-blue">Tải xuống</button></div>
      <div class="step-container"><div class="step-content"><h2 class="mb-2">Bước 2. Thêm món vào file</h2><p class="mb-2">Không được để trống các cột <code>Tên, Thành phố</code>.</p></div></div>
      <div class="step-container"><div class="step-content"><h2 class="mb-2">Bước 3. Tải file thực đơn lên</h2><p class="mb-2">Sau khi đã điền đầy đủ thực đơn bạn có thể tải file lên</p></div>
        <div><input type="file" accept=".xlsx, .xls" class="excel-upload-input"><button class="btn btn-outline-blue"><font class="text-link-blue">Tải file lên</font></button></div></div>
    </div></div></div></div></div>
  <script>
    const MA = ${JSON.stringify(ma)}; let daTai = 0;
    const than = document.getElementById('than');
    function taiThem(n) {
      for (const m of MA.slice(daTai, daTai + n)) {
        daTai += 1;
        const tr = document.createElement('tr'); tr.className = 'tr-content';
        // 01012: ô có thêm chữ quanh mã (như nhãn, nút sao chép) — vẫn phải đọc ra 01012. ?oTrong: một ô Mã món trống.
        const o = ${q.has('oTrong') ? "daTai === 2 ? '' : " : ''}(m === '01012' ? m + ' <small>KG</small>' : m);
        tr.innerHTML = '<td><input type="checkbox"></td><td>' + daTai + '</td><td>' + o + '</td><td>Món ' + daTai + '</td><td>950,000 ₫</td>';
        than.append(tr);
      }
    }
    taiThem(${dau});
    document.getElementById('khung').addEventListener('scroll', e => {
      const k = e.target;
      if (${q.has('ket') ? 'false' : 'true'} && k.scrollTop + k.clientHeight >= k.scrollHeight - 5 && daTai < MA.length) setTimeout(() => taiThem(2), 150);
    });
    const menu = document.getElementById('menu'), nhap = document.getElementById('nhap');
    document.getElementById('tien-ich')?.addEventListener('click', () => menu.classList.toggle('show'));
    document.getElementById('mo-nhap')?.addEventListener('click', e => { e.preventDefault(); menu.classList.remove('show'); nhap.classList.add('dang-mo'); });
    for (const o of document.querySelectorAll('#xuat .excel-upload-input, #nguon .excel-upload-input')) o.addEventListener('change', () => { document.body.dataset.tepSai = '1'; });
    nhap.querySelector('.excel-upload-input').addEventListener('change', e => {
      const f = e.target.files[0], doc = new FileReader();
      doc.onload = () => {
        const b = new Uint8Array(doc.result);
        document.body.dataset.tep = f.name + '|' + b.length + '|' + String.fromCharCode(b[0], b[1]);
        nhap.querySelector('.modal-body').innerHTML = '<table><thead><tr><th>Tên</th></tr></thead><tbody><tr><td>Sườn bò</td></tr><tr><td>Gầu bò</td></tr></tbody></table>'
          + '<button class="btn">Đóng</button><button class="btn btn-primary" id="luu">Lưu</button>';
        document.getElementById('luu').addEventListener('click', () => setTimeout(() => {
          const t = document.createElement('div'); t.className = 'toast'; t.textContent = 'Tải lên thành công'; document.body.append(t);
        }, 300));
      };
      doc.readAsArrayBuffer(f);
    });
  </script></body></html>`;
}

function traFabi(yeu, tra) {
  const url = new URL(yeu.url, 'https://fabi.ipos.vn');
  tra.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  if (url.pathname === '/menu/items/items-in-city') return tra.end(trangDanhSach(url.searchParams));
  // Trang khác của FABi (form Tạo món): không có khung extension. Nút giả đổi đường dẫn kiểu vue-router (không tải lại).
  return tra.end(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Tạo món</title></head><body><h3>Tạo món</h3>
    <script>window.veDanhSach = () => history.pushState({}, '', '/menu/items/items-in-city');</script></body></html>`);
}

const mayChu = https.createServer({ key: readFileSync(join(tam, 'khoa.pem')), cert: readFileSync(join(tam, 'cc.pem')) }, (yeu, tra) => {
  const host = String(yeu.headers.host ?? '').split(':')[0];
  if (host === 'beeftown.vn') return traKho(yeu, tra);
  if (host === 'fabi.ipos.vn') return traFabi(yeu, tra);
  tra.writeHead(404); tra.end();
});
await new Promise(xong => mayChu.listen(0, '127.0.0.1', xong));
const CONG = mayChu.address().port;

// ---------------------------------------------------------------------------
// CHROMIUM CÓ EXTENSION
// ---------------------------------------------------------------------------
async function moChromium(locale) {
  const noi = [join(GOC, 'web', 'package.json'), fileURLToPath(import.meta.url)];
  const loi = [];
  for (const f of noi) {
    let pw;
    try { pw = createRequire(f)('playwright'); } catch (e) { loi.push(`${f}: ${String(e).split('\n')[0]}`); continue; }
    try {
      const ctx = await pw.chromium.launchPersistentContext(mkdtempSync(join(tam, 'nguoi-dung-')), {
        channel: 'chromium', headless: true, locale,
        args: [`--disable-extensions-except=${MO_RONG}`, `--load-extension=${MO_RONG}`,
          `--host-resolver-rules=MAP fabi.ipos.vn 127.0.0.1:${CONG}, MAP beeftown.vn 127.0.0.1:${CONG}`,
          '--ignore-certificate-errors', '--no-proxy-server'],
      });
      // In ra bản đã dùng: máy làm việc có thể rơi về bản cài chung (web/ chưa tải Chromium cho bản của nó).
      console.log(`      Chromium qua playwright ${createRequire(f)('playwright/package.json').version} (${f === noi[0] ? 'của web/' : 'cài chung của máy'})`);
      return ctx;
    } catch (e) { loi.push(`${f}: ${String(e).split('\n')[0]}`); }
  }
  throw new Error('Không mở được Chromium — cd web && npm ci && npx playwright install chromium. ' + loi.join(' · '));
}

const KHUNG = '#beeftown-mo-rong-fabi';
async function cauBao(trang) { return (await trang.locator(`${KHUNG} .bao .chu`).textContent().catch(() => '')) ?? ''; }
/** Chờ câu trong khung khớp mẫu (tối đa hetMs); trả câu cuối cùng thấy được. */
async function choCau(trang, mau, hetMs = 15_000) {
  const het = Date.now() + hetMs;
  let cau = '';
  while (Date.now() < het) {
    cau = await cauBao(trang);
    if (mau.test(cau)) return cau;
    await trang.waitForTimeout(150);
  }
  return cau;
}
const kieuBao = trang => trang.locator(`${KHUNG} .bao`).getAttribute('class');
const bam = trang => trang.locator(`${KHUNG} button.nut`).click();
async function moDanhSach(ctx, thamSo = '') {
  const trang = await ctx.newPage();
  await trang.goto(`https://fabi.ipos.vn/menu/items/items-in-city${thamSo}`);
  await trang.locator(`${KHUNG} button.nut`).waitFor({ state: 'visible', timeout: 10_000 });
  return trang;
}
const soYeuCau = () => kho.yeuCau.length;

let ctx;
try {
  ctx = await moChromium('vi-VN');
  console.log('BEEFTOWN — MỞ RỘNG FABi TRONG CHROMIUM THẬT');

  nhom('1 · KHUNG CHỈ HIỆN Ở TRANG DANH SÁCH MÓN (KỂ CẢ ĐỔI TRANG KIỂU ỨNG DỤNG MỘT TRANG)');
  {
    const t0 = await moDanhSach(ctx, '?tong=3');
    await chup(t0, '1-khung');
    await t0.close();
    const t = await ctx.newPage();
    await t.goto('https://fabi.ipos.vn/menu/item/detail');
    await t.waitForTimeout(1500);
    ok('Form Tạo món: không có khung extension', !(await t.locator(`${KHUNG} button.nut`).isVisible().catch(() => false)));
    await t.evaluate(() => window.veDanhSach());
    const hien = await t.locator(`${KHUNG} button.nut`).waitFor({ state: 'visible', timeout: 5000 }).then(() => true, () => false);
    ok('Đổi sang /menu/items/items-in-city không tải lại trang → khung hiện, nút "Đưa món mới sang FABi"', hien
       && (await t.locator(`${KHUNG} button.nut`).textContent()) === 'Đưa món mới sang FABi');
    await t.locator(`${KHUNG} button.nut-phu`).click();
    ok('Bấm Ẩn → khung ẩn', !(await t.locator(`${KHUNG} button.nut`).isVisible()));
    await t.close();
  }

  nhom('2 · CHƯA ĐĂNG NHẬP KHO → BÁO, CÓ LIÊN KẾT ĐĂNG NHẬP, KHÔNG ĐƯA GÌ VÀO FABi');
  {
    const t = await moDanhSach(ctx);
    const truoc = soYeuCau();
    await bam(t);
    const cau = await choCau(t, /chưa đăng nhập kho/);
    ok('Câu "chưa đăng nhập kho Beeftown" + "Chưa có gì được đưa vào FABi"', /chưa đăng nhập kho Beeftown/.test(cau) && /Chưa có gì được đưa vào FABi/.test(cau), cau);
    ok('Kiểu lỗi (viền đỏ, dấu !)', /\bloi\b/.test(await kieuBao(t) ?? ''));
    await chup(t, '2-chua-dang-nhap');
    ok('Liên kết mở trang đăng nhập kho', (await t.locator(`${KHUNG} .lien-ket`).getAttribute('href')) === 'https://beeftown.vn/noi-bo/dang-nhap');
    ok('Kho được hỏi đúng một lần, không có cookie phiên', soYeuCau() === truoc + 1 && kho.yeuCau.at(-1).coPhien === false);
    ok('Không file nào vào trang FABi', (await t.evaluate(() => document.body.dataset.tep ?? '')) === '');
    await t.close();
  }

  // Đăng nhập kho trong một tab khác — như Khánh mở beeftown.vn/noi-bo.
  { const k = await ctx.newPage(); await k.goto('https://beeftown.vn/noi-bo/dang-nhap'); await k.close(); }

  nhom('3 · KHÔNG ĐỌC ĐỦ DANH SÁCH FABi → DỪNG TRƯỚC KHI HỎI KHO');
  for (const [ten, thamSo, mau] of [
    ['Ô tìm kiếm có chữ', '?tim=1', /Ô tìm kiếm đang có chữ/],
    ['Bộ lọc thành phố không ở "Tất cả"', '?locKhac=1', /Tất cả thành phố/],
    ['Không thấy dòng "Tổng: … món"', '?khongTong=1', /Không thấy dòng "Tổng/],
    ['Bảng kẹt ở 2 / 5 món dù đã cuộn', '?tong=5&dau=2&ket=1', /Mới đọc được 2 \/ 5 món/],
    ['Ô "Mã món" ở dòng 2 trống', '?tong=3&oTrong=1', /Không đọc được mã món ở dòng 2/],
  ]) {
    const t = await moDanhSach(ctx, thamSo);
    const truoc = soYeuCau();
    await bam(t);
    const cau = await choCau(t, mau, 20_000);
    ok(`${ten} → báo, "Chưa có gì được đưa vào FABi", kho không bị hỏi`, mau.test(cau) && /Chưa có gì được đưa vào FABi/.test(cau)
       && soYeuCau() === truoc, `${cau} · hỏi kho ${soYeuCau() - truoc} lần`);
    await t.close();
  }

  nhom('4 · ĐƯỜNG ĐÚNG: CUỘN TẢI HẾT, GỬI MÃ SỐ, MỞ HỘP THOẠI, FILE VÀO ĐÚNG Ô, CHỈ "XONG" KHI FABi BÁO');
  {
    kho.cheDo = 'tep';
    const t = await moDanhSach(ctx, '?tong=5&dau=2');
    const truoc = soYeuCau();
    await t.locator(`${KHUNG} button.nut`).dblclick();
    const cau = await choCau(t, /bảng xem trước/, 30_000);
    ok('Bấm đúp → kho chỉ bị hỏi MỘT lần, có cookie phiên (service worker gửi kèm cookie SameSite=Lax)',
       soYeuCau() === truoc + 1 && kho.yeuCau.at(-1).coPhien === true, `${soYeuCau() - truoc} lần`);
    ok('Cuộn cho bảng tải hết 5 / 5 dòng; da_co chỉ gồm mã số, giữ nguyên số 0 đầu, bỏ ITEM-HJAE',
       kho.yeuCau.at(-1).daCo === '01011,01012,1013,01019', String(kho.yeuCau.at(-1).daCo));
    ok('Ô mã có chữ kèm ("01012 KG") vẫn đọc ra 01012', String(kho.yeuCau.at(-1).daCo).split(',').includes('01012'));
    ok('Đọc xong, khung bảng cuộn về chỗ cũ (đầu bảng)', (await t.evaluate(() => document.getElementById('khung').scrollTop)) === 0);
    const tep = await t.evaluate(() => document.body.dataset.tep ?? '');
    ok('File vào ô của hộp thoại "Thêm món" đang hiện: tên từ kho, đủ byte, đầu "PK"',
       tep === `them-mon-fabi-cn1-20261028-1200.xlsx|${TEP.length}|PK`, tep);
    ok('Hai ô excel-upload-input của hộp thoại ẩn không nhận gì', (await t.evaluate(() => document.body.dataset.tepSai ?? '')) === '');
    ok('Câu: bảng xem trước 2 món của chi nhánh CN1, kiểm rồi tự bấm Lưu; 1 món đã có trên FABi không đưa lại',
       /bảng xem trước 2 món mới của chi nhánh CN1 trong kho/.test(cau) && /bấm Lưu của FABi/.test(cau) && /1 món kho đã có trên FABi/.test(cau), cau);
    await chup(t, '4-xem-truoc');
    ok('Chưa bấm Lưu → chưa báo xong (kiểu "lưu ý")', /luu-y/.test(await kieuBao(t) ?? '') && !/Tải lên thành công/.test(cau));
    await t.locator('#luu').click();
    const xong = await choCau(t, /Tải lên thành công/, 5000);
    await chup(t, '4-fabi-da-luu');
    ok('Bấm Lưu của FABi, FABi hiện "Tải lên thành công" → khung báo xong, nhắc quét thử tem', /Tải lên thành công/.test(xong)
       && /quét thử 1 tem/.test(xong) && /\bxong\b/.test(await kieuBao(t) ?? ''), xong);
    await t.close();
  }

  nhom('5 · KHÔNG MỞ ĐƯỢC HỘP THOẠI TỰ ĐỘNG → CHỜ NGƯỜI MỞ, RỒI ĐƯA FILE VÀO');
  {
    const t = await moDanhSach(ctx, '?tong=3&khongTienIch=1');
    await bam(t);
    const cau = await choCau(t, /Bấm Tiện ích → Thêm món từ file/, 15_000);
    ok('Không thấy nút Tiện ích → nhờ người bấm Tiện ích → Thêm món từ file', /Bấm Tiện ích → Thêm món từ file/.test(cau), cau);
    await t.evaluate(() => document.getElementById('nhap').classList.add('dang-mo'));
    const sau = await choCau(t, /bảng xem trước/, 10_000);
    ok('Người mở hộp thoại → file vào, bảng xem trước hiện', /bảng xem trước/.test(sau)
       && /\|PK$/.test(await t.evaluate(() => document.body.dataset.tep ?? '')), sau);
    await t.close();
  }

  nhom('6 · KHO KHÔNG CÓ MÓN MỚI, KHO HỎNG, MẤT MẠNG → CÂU ĐÚNG, KHÔNG ĐƯA GÌ VÀO FABi');
  for (const [cheDo, mau, kieu, ten] of [
    ['khong_co', /Không có món mới nào cần thêm trên FABi/, 'xong', 'Kho không có món mới → câu của kho, kiểu xong'],
    ['loi500', /Không đọc được danh sách món cho FABi.*Chưa có gì được đưa vào FABi/, 'loi', 'Kho 500 → câu của kho + "Chưa có gì được đưa vào FABi"'],
    ['cam', /cần quyền danh mục.*Chưa có gì được đưa vào FABi/, 'loi', 'Kho 403 (tài khoản không đủ quyền) → câu của kho'],
    ['cat', /Không lấy được file từ kho Beeftown.*Chưa có gì được đưa vào FABi/, 'loi', 'Kho đứt kết nối giữa chừng → mất mạng, không báo xong'],
    ['may', /tài khoản máy.*Chưa có gì được đưa vào FABi/, 'loi', 'Đã đăng nhập nhưng kho chuyển sang màn máy → nói đúng lý do, không bảo "chưa đăng nhập"'],
  ]) {
    kho.cheDo = cheDo;
    const t = await moDanhSach(ctx, '?tong=3');
    await bam(t);
    const cau = await choCau(t, mau, 20_000);
    ok(ten, mau.test(cau) && new RegExp(`\\b${kieu}\\b`).test(await kieuBao(t) ?? '')
       && (await t.evaluate(() => document.body.dataset.tep ?? '')) === ''
       && !(await t.evaluate(() => document.getElementById('nhap').classList.contains('dang-mo'))), cau);
    await t.close();
  }
  await ctx.close();

  nhom('7 · TRÌNH DUYỆT TIẾNG ANH → CÂU TIẾNG ANH');
  ctx = await moChromium('en-US');
  {
    kho.cheDo = 'cat';
    const t = await moDanhSach(ctx, '?tong=3');
    ok('Nút "Bring new dishes into FABi"', (await t.locator(`${KHUNG} button.nut`).textContent()) === 'Bring new dishes into FABi');
    await bam(t);
    const cau = await choCau(t, /Could not get the file/, 20_000);
    ok('Mất mạng → câu tiếng Anh, "Nothing has been put into FABi"', /Nothing has been put into FABi/.test(cau), cau);
    kho.cheDo = 'loi500';
    await bam(t);
    const cauKho = await choCau(t, /Không đọc được danh sách món/, 20_000);
    ok('Câu của kho bằng tiếng Việt (ngôn ngữ chọn ở kho) → đuôi cũng tiếng Việt, không lẫn tiếng Anh',
       /Chưa có gì được đưa vào FABi\.$/.test(cauKho) && !/Nothing has been put/.test(cauKho), cauKho);
  }
} catch (e) {
  ok('Chạy hết các bước trong Chromium', false, e?.stack ?? String(e));
} finally {
  await ctx?.close().catch(() => {});
  mayChu.close();
  rmSync(tam, { recursive: true, force: true });
}

console.log(`\n${'='.repeat(60)}`);
if (hong === 0) console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA MỞ RỘNG FABi TRONG CHROMIUM ĐỀU ĐẠT\x1b[0m`);
else console.log(`\x1b[31m\x1b[1m${hong} / ${dat + hong} KIỂM TRA MỞ RỘNG FABi TRONG CHROMIUM HỎNG\x1b[0m`);
process.exit(hong === 0 ? 0 : 1);
