// TÁCH LOGO BEEFTOWN TỪ BRAND GUIDELINES 21/10/2026 (bộ logo mới, bảng đỏ – đen – trắng)
// ==========================================================================================
//
//   node tach-logo.mjs <BEEFTOWN_Brand_Guidelines.pdf> <web/public>
//
// PDF do designer gửi ngày 21/10/2026 (thư mục Drive "LOGO BEEFTOWN"); không vào repo. Cần
// `pdftocairo` (poppler) và Chromium của Playwright. Đọc trang 5 ("Logo variations") và trang 1
// (đầu bò lớn trên nền đỏ), ghi vào <web/public>/thuong-hieu/:
//
//   logo-ngang-{do,den,trang}.svg   — logo chính (lockup): chữ BEEFTOWN, đầu bò trong chữ O, dòng
//                                     "PICK IT, GRILL IT, LOVE IT!"
//   chu-beeftown-{do,den,trang}.svg — logo phụ: chữ BEEFTOWN, không dòng tagline
//   dau-bo-{do,den,trang}.svg       — brandmark: ô bo góc, đầu bò bên trong
//   net-dau-bo.svg                  — riêng đầu bò, một màu trắng (trang 1), dùng cho biểu tượng app
//
// Màu theo trang 4 ("Color usage") của guideline: bản đỏ và bản đen có đầu bò trắng trong ô; bản
// trắng (đặt trên nền đỏ hay đen) khoét đầu bò để lộ màu nền — trên nền đỏ guideline vẽ đúng như vậy.
// Khoét bằng fill-rule="evenodd" (ô + đầu bò chung một path), không dùng mask nên không có id.
//
// Không vẽ lại gì: mọi path là path gốc của PDF, chỉ dời gốc tọa độ (translate) và đổi màu tô.
// Khung (viewBox) sát hình đo bằng getBBox() của Chromium; khoảng trống quanh logo do CSS lo.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

const [pdf, congKhai] = process.argv.slice(2);
if (!pdf || !congKhai) {
  console.error('Cách dùng: node tach-logo.mjs <BEEFTOWN_Brand_Guidelines.pdf> <web/public>');
  process.exit(2);
}

const DO = '#BD0000';
const DEN = '#000000';
const TRANG = '#FFFFFF';
// Mã màu pdftocairo ghi cho hai màu của trang 5 (đỏ 189/255 = 74,118 %).
const MAU_PDF = { 'rgb(74.118042%, 0%, 0%)': 'do', 'rgb(100%, 100%, 100%)': 'trang' };

function docTrang(soTrang) {
  const thuMuc = mkdtempSync(join(tmpdir(), 'tach-logo-'));
  const ra = join(thuMuc, `trang-${soTrang}.svg`);
  execFileSync('pdftocairo', ['-svg', '-f', String(soTrang), '-l', String(soTrang), pdf, ra]);
  const svg = readFileSync(ra, 'utf8');
  const than = svg.slice(svg.indexOf('</defs>') + 7);
  const cacPath = [];
  for (const m of than.matchAll(/<path [^>]*?fill="(rgb\([^)]*\))"[^>]*?d="([^"]+)"/g)) {
    const mau = MAU_PDF[m[1]];
    if (!mau) continue;
    const so = m[2].match(/-?\d+(?:\.\d+)?/g).map(Number);
    const xs = so.filter((_, i) => i % 2 === 0);
    const ys = so.filter((_, i) => i % 2 === 1);
    cacPath.push({ mau, d: m[2].trim(), x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) });
  }
  return cacPath;
}

const trongVung = (p, [x0, y0, x1, y1]) => p.x0 >= x0 && p.x1 <= x1 && p.y0 >= y0 && p.y1 <= y1;
const dienTich = p => (p.x1 - p.x0) * (p.y1 - p.y0);

function nhom(cacPath, vung, ten, { soDo, soTrang }) {
  // Đầu bò trắng vẽ trước ô đỏ thì bị ô che (bản nháp còn sót trong file Illustrator) — bỏ.
  const trongKhung = cacPath.filter(p => trongVung(p, vung));
  const oDo = trongKhung.filter(p => p.mau === 'do').sort((a, b) => dienTich(b) - dienTich(a));
  const viTriO = (() => {
    // Ô chứa đầu bò: path đỏ một nét, gần vuông, chứa trọn các path trắng.
    const trang = trongKhung.filter(p => p.mau === 'trang');
    return oDo.find(o => trang.some(t => t.x0 > o.x0 && t.x1 < o.x1 && t.y0 > o.y0 && t.y1 < o.y1));
  })();
  if (!viTriO) throw new Error(`${ten}: không thấy ô chứa đầu bò`);
  const thuTuO = cacPath.indexOf(viTriO);
  const dauBo = trongKhung.filter(p => p.mau === 'trang' && cacPath.indexOf(p) > thuTuO
    && p.x0 > viTriO.x0 && p.x1 < viTriO.x1 && p.y0 > viTriO.y0 && p.y1 < viTriO.y1);
  const chu = trongKhung.filter(p => p.mau === 'do' && p !== viTriO);
  if (chu.length !== soDo || dauBo.length !== soTrang) {
    throw new Error(`${ten}: mong ${soDo} path chữ + ${soTrang} path đầu bò, thấy ${chu.length} + ${dauBo.length} — PDF đã đổi?`);
  }
  return { chu, o: viTriO, dauBo };
}

const trang5 = docTrang(5);
// Ba vùng của trang 5 (đơn vị điểm PDF, trang 1080 × 1080): logo chính ở trên, logo phụ dưới
// bên trái, brandmark dưới bên phải. Số path phải đúng — PDF khác thì dừng, không đoán.
const LOGO_CHINH = nhom(trang5, [240, 280, 850, 430], 'logo chính', { soDo: 29, soTrang: 2 });
const LOGO_PHU = nhom(trang5, [150, 660, 600, 735], 'logo phụ', { soDo: 7, soTrang: 2 });
const BRANDMARK = nhom(trang5, [700, 600, 900, 800], 'brandmark', { soDo: 0, soTrang: 2 });
const trang1 = docTrang(1);
const NET_DAU_BO = trang1.filter(p => p.mau === 'trang');
if (NET_DAU_BO.length !== 2) throw new Error(`trang 1: mong 2 path đầu bò, thấy ${NET_DAU_BO.length}`);

// Khung thật của từng nhóm: getBBox của Chromium (đường cong không vượt điểm điều khiển, nên
// khung tính từ số trong `d` có thể rộng hơn hình thật).
const trinhDuyet = await playwright.chromium.launch();
const trangWeb = await trinhDuyet.newPage();
async function khung(cacD) {
  return trangWeb.evaluate(ds => {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    document.body.append(svg);
    const g = document.createElementNS(ns, 'g');
    for (const d of ds) { const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); g.append(p); }
    svg.append(g);
    const b = g.getBBox();
    svg.remove();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  }, cacD);
}

const so = v => String(Math.round(v * 1000) / 1000);

function viet(ten, moTa, k, phan) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${so(k.w)} ${so(k.h)}" width="${so(k.w)}" height="${so(k.h)}">`
    + `<!-- ${moTa} — path gốc của BEEFTOWN_Brand_Guidelines.pdf (21/10/2026), tách bằng web/cong-cu/thuong-hieu/tach-logo.mjs -->`
    + `<g transform="translate(${so(-k.x)} ${so(-k.y)})">${phan}</g></svg>\n`;
  writeFileSync(join(congKhai, 'thuong-hieu', `${ten}.svg`), svg);
  console.log(`thuong-hieu/${ten}.svg  ${so(k.w)} × ${so(k.h)}`);
}

// mau: màu của chữ và ô; dauBo: màu đầu bò, hoặc null = khoét (lộ nền).
function phanLogo({ chu, o, dauBo }, mau, mauDauBo) {
  const chuPath = chu.map(p => `<path fill="${mau}" d="${p.d}"/>`).join('');
  const oVaDauBo = mauDauBo
    ? `<path fill="${mau}" d="${o.d}"/>` + dauBo.map(p => `<path fill="${mauDauBo}" d="${p.d}"/>`).join('')
    : `<path fill="${mau}" fill-rule="evenodd" d="${[o.d, ...dauBo.map(p => p.d)].join(' ')}"/>`;
  return chuPath + oVaDauBo;
}

const BAN = [
  ['do', DO, TRANG, 'chữ đỏ, đầu bò trắng — trên nền trắng, nền xám nhạt'],
  ['den', DEN, TRANG, 'chữ đen, đầu bò trắng — trên nền trắng, nền xám nhạt'],
  ['trang', TRANG, null, 'chữ trắng, đầu bò khoét lộ nền — trên nền đỏ, nền đen'],
];
for (const [nhomLogo, tenFile, tenMoTa] of [
  [LOGO_CHINH, 'logo-ngang', 'Logo chính Beeftown (lockup có tagline)'],
  [LOGO_PHU, 'chu-beeftown', 'Logo phụ Beeftown (chữ BEEFTOWN, không tagline)'],
  [BRANDMARK, 'dau-bo', 'Brandmark Beeftown (ô bo góc, đầu bò)'],
]) {
  const k = await khung([...nhomLogo.chu, nhomLogo.o].map(p => p.d));
  for (const [hauTo, mau, mauDauBo, moTa] of BAN) {
    viet(`${tenFile}-${hauTo}`, `${tenMoTa}, ${moTa}`, k, phanLogo(nhomLogo, mau, mauDauBo));
  }
}
{
  const k = await khung(NET_DAU_BO.map(p => p.d));
  viet('net-dau-bo', 'Nét đầu bò Beeftown, một màu trắng (trang 1) — đặt trên nền đỏ', k,
    NET_DAU_BO.map(p => `<path fill="${TRANG}" d="${p.d}"/>`).join(''));
}
await trinhDuyet.close();
