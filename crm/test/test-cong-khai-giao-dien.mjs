/**
 * BEEFTOWN — GIAO DIỆN TRANG CÔNG KHAI: TRANG, CSS, TÀI SẢN THƯƠNG HIỆU, ẢNH
 * =========================================================================
 *
 *     node test/test-cong-khai-giao-dien.mjs
 *
 * Bộ giao diện "Quầy thịt ấm" (06/10/2026) thêm trang mới, một file CSS riêng cho trang công
 * khai và tài sản tách từ PDF nhận diện. Bất biến:
 *
 *   1. Mọi đường dẫn trong CAP_DUONG_DAN (web/src/lib/chu.ts) có file trang thật — nút đổi
 *      ngôn ngữ và sitemap không trỏ vào trang 404; và mọi trang .astro công khai đều nằm
 *      trong bảng đó.
 *   2. chung.css (cả /noi-bo và kho dùng) giữ NGUYÊN giá trị mọi biến cũ, mỗi biến khai một
 *      lần. cong-khai.css chỉ layouts/Trang.astro nạp, và mọi quy tắc của nó nằm dưới .ck /
 *      html:has(body.ck) — không lọt ra /noi-bo, kho.
 *   3. SVG thương hiệu (web/public/thuong-hieu, bieu-tuong.svg) sạch: có viewBox; không
 *      <script>, không thuộc tính on…=, không <text> (chữ là nét vẽ gốc của PDF), không
 *      <image>, không href ra ngoài; màu chỉ trong bảng màu thương hiệu (bất biến 6).
 *   4. Tên file tài sản là ASCII. Mỗi cỡ ảnh khai trong anh-tao-san.ts có đủ .avif + .webp,
 *      mỗi file ≤ 300 KB, tổng ≤ 8 MB, không file ảnh thừa.
 *   5. Mọi file trong web/public/thuong-hieu, web/public/anh, web/cong-cu được git thấy
 *      (.gitignore "chặn hết rồi mở từng cái"). Ảnh chia sẻ đúng 1200×630.
 *   6. Trang công khai dùng đúng bảng màu Khánh chốt ngày 09/10/2026 (THUONG-HIEU.md): mã khai
 *      một lần trong khối .ck đầu tiên của cong-khai.css; không file công khai nào còn mã của
 *      bảng cũ; các cặp chữ / nền của hệ bề mặt đủ tương phản (WCAG 2.2).
 *   7. Thành phần và khung trang của đợt redesign (PR 2): bảng màu không có trắng — không file
 *      công khai nào còn mã màu ngoài bảng; ô nhập nền Cream trong thẻ kem sau vẫn đủ tương phản
 *      viền; cỡ chữ, lưới, chiều cao đầu trang khai đúng; chân trang bỏ hoa văn chữ; biểu tượng
 *      một nét không co theo cỡ; bộ chọn ngôn ngữ in đủ ba thứ tiếng. (Số đo trên trang đã dựng:
 *      web/kiem-tra/do-giao-dien.mjs, chạy trong thu-trinh-duyet và thu-day-du.)
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const SRC = join(WEB, 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const { CAP_DUONG_DAN } = await nap('chu.ts');
const { ANH_TAO_SAN } = await nap('anh-tao-san.ts');
const { DANH_MUC_ANH, duongDanAnh } = await nap('anh.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — GIAO DIỆN TRANG CÔNG KHAI');

/** Mọi file dưới một thư mục (đường dẫn đầy đủ). Thư mục không có → []. */
function moiFile(thuMuc) {
  if (!existsSync(thuMuc)) return [];
  return readdirSync(thuMuc, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? moiFile(join(thuMuc, d.name)) : [join(thuMuc, d.name)]);
}
const tuGoc = p => relative(GOC, p).split(sep).join('/');

// ===========================================================================
await nhom('1 · MỌI ĐƯỜNG DẪN CÓ FILE TRANG, MỌI TRANG CÔNG KHAI CÓ TRONG BẢNG', async () => {
  const PAGES = join(SRC, 'pages');
  const fileCua = duong => {
    const than = duong === '/' ? 'index' : duong.replace(/^\//, '');
    return [join(PAGES, `${than}.astro`), join(PAGES, than, 'index.astro')].find(existsSync) ?? null;
  };
  const tatCa = CAP_DUONG_DAN.flat();
  ok(`CAP_DUONG_DAN có ${CAP_DUONG_DAN.length} trang × 3 thứ tiếng, không đường dẫn trùng`,
     CAP_DUONG_DAN.every(c => c.length === 3) && new Set(tatCa).size === tatCa.length, tatCa.join(' '));
  for (const duong of tatCa) {
    const f = fileCua(duong);
    ok(`${duong} → có file trang${f ? ` (${tuGoc(f)})` : ''}`, !!f, 'không có file .astro nào cho đường dẫn này');
  }
  for (const [vi, en, ko] of CAP_DUONG_DAN) {
    ok(`${vi}: bản tiếng Anh nằm dưới /en, tiếng Hàn dưới /ko, cùng tên đường dẫn`,
       (en === '/en' && ko === '/ko' && vi === '/') || (en.startsWith('/en/') && ko === en.replace(/^\/en/, '/ko')), `${en} · ${ko}`);
  }
  // Ngược lại: trang công khai mà không có trong bảng thì nút đổi ngôn ngữ của nó về trang chủ.
  const trangCongKhai = ['', 'en', 'ko'].flatMap(d => existsSync(join(PAGES, d))
    ? readdirSync(join(PAGES, d)).filter(f => f.endsWith('.astro')).map(f => {
        const ten = f.replace(/\.astro$/, '');
        return ten === 'index' ? (d ? `/${d}` : '/') : `${d ? `/${d}` : ''}/${ten}`;
      })
    : []);
  const thieu = trangCongKhai.filter(d => !tatCa.includes(d));
  ok(`Mọi trang .astro công khai (${trangCongKhai.length} trang) đều có trong CAP_DUONG_DAN`, thieu.length === 0, thieu.join(', '));
});

// ===========================================================================
// Giá trị gốc của chung.css trước bộ giao diện mới — chép tay ở đây, KHÔNG đọc từ file:
// sửa nhầm một giá trị ở chung.css thì /noi-bo và kho đổi màu theo, và phép thử này đỏ.
const BIEN_CU = {
  '--do': '#B23A2C', '--do-dam': '#8F2C21', '--kem': '#FBF4E1', '--kem-sau': '#F5ECD7',
  '--mu-tat': '#F2A900', '--cuc-vang': '#F5C211', '--than': '#1E160E', '--da': '#B8A98C',
  '--muc-nhat': 'rgba(30, 22, 14, .68)', '--vach': 'rgba(30, 22, 14, .16)', '--vach-kem': 'rgba(251, 244, 225, .22)',
  '--vien-o': '#8C8577', '--rong': 'min(1120px, 90%)',
};
const boChuThich = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
const chuanHoa = v => v.trim().replace(/\s+/g, ' ').toLowerCase();

/**
 * Đọc CSS thành danh sách quy tắc { boChon, trong } ở tầng ngoài cùng; @media / @supports /
 * @keyframes giữ nguyên khối để người gọi tự đi vào. Đủ cho CSS viết tay của repo (không
 * chuỗi chứa ngoặc nhọn).
 */
function docQuyTac(css) {
  const ra = [];
  let i = 0;
  while (i < css.length) {
    const mo = css.indexOf('{', i);
    if (mo < 0) break;
    const truoc = css.slice(i, mo).trim();
    let sau = mo + 1, sau_ = 1;
    for (; sau < css.length && sau_ > 0; sau++) {
      if (css[sau] === '{') sau_++;
      else if (css[sau] === '}') sau_--;
    }
    ra.push({ boChon: truoc.replace(/^[;\s]+/, ''), trong: css.slice(mo + 1, sau - 1) });
    i = sau;
  }
  return ra;
}
/** Tách danh sách bộ chọn theo dấu phẩy ở tầng ngoài (phẩy trong :is(…) không tách). */
function tachBoChon(s) {
  const ra = [];
  let sau = 0, dau = 0;
  for (let k = 0; k < s.length; k++) {
    if (s[k] === '(') sau++;
    else if (s[k] === ')') sau--;
    else if (s[k] === ',' && sau === 0) { ra.push(s.slice(dau, k)); dau = k + 1; }
  }
  ra.push(s.slice(dau));
  return ra.map(x => x.trim()).filter(Boolean);
}

await nhom('2 · chung.css GIỮ NGUYÊN BIẾN CŨ; cong-khai.css CHỈ Ở TRANG CÔNG KHAI', async () => {
  const chung = boChuThich(readFileSync(join(SRC, 'styles', 'chung.css'), 'utf8'));
  const root = chung.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
  for (const [bien, giaTri] of Object.entries(BIEN_CU)) {
    const m = root.match(new RegExp(`(?:^|[;\\s])${bien.replace(/-/g, '\\-')}\\s*:\\s*([^;]+);`));
    const soLanKhai = (chung.match(new RegExp(`(?:^|[;{\\s])${bien.replace(/-/g, '\\-')}\\s*:`, 'g')) ?? []).length;
    ok(`chung.css: ${bien} vẫn là ${giaTri}, khai đúng một lần`, !!m && chuanHoa(m[1]) === chuanHoa(giaTri) && soLanKhai === 1,
       m ? `${m[1].trim()} · khai ${soLanKhai} lần` : 'không thấy trong khối :root đầu tiên');
  }

  // Ai nạp cong-khai.css: import trong .astro / .ts, @import trong CSS, <link href>.
  const NAP = /import\s+(?:[\w{}\s,*]+\s+from\s+)?['"][^'"]*cong-khai\.css(?:\?[^'"]*)?['"]|@import\s+(?:url\()?['"]?[^;]*cong-khai\.css|href=["'][^"']*cong-khai\.css/;
  const nguoiNap = moiFile(SRC).filter(f => /\.(astro|ts|tsx|js|mjs|css)$/.test(f) && NAP.test(readFileSync(f, 'utf8'))).map(tuGoc);
  ok('cong-khai.css chỉ được nạp ở web/src/layouts/Trang.astro', JSON.stringify(nguoiNap) === JSON.stringify(['web/src/layouts/Trang.astro']),
     nguoiNap.join(', ') || 'không file nào nạp');

  const ck = boChuThich(readFileSync(join(SRC, 'styles', 'cong-khai.css'), 'utf8'));
  const DUOI_CK = /^(\.ck(?![\w-])|html:has\(body\.ck\))/;
  const sai = [];
  let soQuyTac = 0;
  const xet = (quyTac, trongAt) => {
    for (const { boChon, trong } of quyTac) {
      if (/^@media\b/.test(boChon)) { xet(docQuyTac(trong), boChon); continue; }
      if (/^@keyframes\b/.test(boChon)) continue;
      if (boChon.startsWith('@')) { sai.push(`${boChon} (chỉ cho @media, @keyframes)`); continue; }
      soQuyTac++;
      for (const bc of tachBoChon(boChon)) if (!DUOI_CK.test(bc)) sai.push(trongAt ? `${trongAt} → ${bc}` : bc);
    }
  };
  xet(docQuyTac(ck), null);
  if (/@import/.test(ck)) sai.push('@import');
  ok(`cong-khai.css: mọi quy tắc (${soQuyTac}) bắt đầu bằng .ck hoặc html:has(body.ck), ngoài ra chỉ @media / @keyframes`,
     soQuyTac > 50 && sai.length === 0, sai.slice(0, 6).join(' | '));
});

// ===========================================================================
// Bảng màu thương hiệu Khánh chốt ngày 09/10/2026 (THUONG-HIEU.md mục 1) cùng các màu pha của trang
// công khai (BANG_MAU_CHOT ở nhóm 6). Hình vẫn là nét gốc của PDF nhận diện; tao-bieu-tuong.py đổi mã
// màu của PDF sang bảng này khi chép SVG. Thêm màu vào đây chỉ khi THUONG-HIEU.md đã có nó.
const BANG_MAU = new Set(['#A70C0C', '#890607', '#F0E3D0', '#EBDCC6', '#E7D5BC', '#151008',
  '#000', '#000000', '#FFF', '#FFFFFF', 'NONE', 'CURRENTCOLOR', 'TRANSPARENT']);
const SVG = [...moiFile(join(WEB, 'public', 'thuong-hieu')).filter(f => f.endsWith('.svg')), join(WEB, 'public', 'bieu-tuong.svg')];

await nhom(`3 · ${SVG.length} SVG THƯƠNG HIỆU SẠCH, MÀU TRONG BẢNG MÀU THƯƠNG HIỆU`, async () => {
  ok('Có tài sản SVG thương hiệu (logo, đầu bò, rosemary, tem…)', SVG.length >= 10, `${SVG.length} file`);
  for (const f of SVG) {
    const s = readFileSync(f, 'utf8');
    const ten = tuGoc(f);
    const loi = [];
    if (!/<svg\b[^>]*\sviewBox\s*=\s*["'][^"']+["']/.test(s)) loi.push('thiếu viewBox');
    if (/<script\b/i.test(s)) loi.push('<script>');
    if (/\son[a-z]+\s*=/i.test(s)) loi.push('thuộc tính on…=');
    if (/<text\b|<tspan\b/i.test(s)) loi.push('<text> (chữ phải là nét vẽ)');
    if (/<image\b/i.test(s)) loi.push('<image>');
    if (/<foreignObject\b/i.test(s)) loi.push('<foreignObject>');
    if (/(?:xlink:)?href\s*=\s*["']\s*(?:https?:|\/\/|javascript:|data:)/i.test(s)) loi.push('href ra ngoài');
    ok(`${ten}: có viewBox, không script / on… / text / image / href ra ngoài`, loi.length === 0, loi.join(', '));

    const mau = [
      ...[...s.matchAll(/\b(?:fill|stroke|stop-color|flood-color|lighting-color|color)\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]),
      ...[...s.matchAll(/\b(?:fill|stroke|stop-color|flood-color|color)\s*:\s*([^;"'}]+)/gi)].map(m => m[1]),
    ].map(m => m.trim().toUpperCase()).filter(m => !/^URL\(#/.test(m));
    const la = [...new Set(mau.filter(m => !BANG_MAU.has(m)))];
    ok(`${ten}: màu chỉ trong bảng màu thương hiệu (${[...new Set(mau)].join(' ') || 'không khai màu'})`, la.length === 0, la.join(', '));
  }
});

// ===========================================================================
const THU_MUC_TAI_SAN = ['public/thuong-hieu', 'public/anh', 'cong-cu'].map(d => join(WEB, d));
const BO_QUA = f => /(^|[\\/])(__pycache__|\.DS_Store)([\\/]|$)|\.pyc$/.test(f);

await nhom('4 · TÊN FILE ASCII; ẢNH ĐỦ CỠ, ĐỦ ĐỊNH DẠNG, KHÔNG QUÁ NẶNG', async () => {
  const tep = [...THU_MUC_TAI_SAN.flatMap(moiFile), join(WEB, 'public', 'bieu-tuong.svg'), join(WEB, 'public', 'favicon.ico')]
    .filter(f => existsSync(f) && !BO_QUA(f));
  const khongAscii = tep.filter(f => !/^[A-Za-z0-9._-]+$/.test(f.split(/[\\/]/).pop()));
  ok(`${tep.length} file tài sản: tên chỉ gồm chữ ASCII, số, . _ - (không dấu, không cách)`, khongAscii.length === 0,
     khongAscii.map(tuGoc).join(', '));

  const THU_MUC_ANH = join(WEB, 'public', 'anh');
  const GIOI_HAN = 300 * 1024;
  const can = [];
  const loi = [];
  for (const [id, cacKhung] of Object.entries(ANH_TAO_SAN)) {
    if (!Object.hasOwn(DANH_MUC_ANH, id)) loi.push(`${id}: không có trong DANH_MUC_ANH (lib/anh.ts)`);
    for (const [khung, co] of Object.entries(cacKhung)) {
      if (!(co.rong > 0 && co.cao > 0 && Array.isArray(co.cac) && co.cac.length && /^#[0-9a-f]{6}$/i.test(co.mau))) {
        loi.push(`${id} ${khung}: thiếu rộng / cao / các cỡ / màu nền`);
      }
      for (const r of co.cac ?? []) for (const duoi of ['avif', 'webp']) can.push(duongDanAnh(id, khung, r, duoi));
    }
  }
  const thieu = can.filter(d => !existsSync(join(WEB, 'public', d)));
  const nang = can.filter(d => existsSync(join(WEB, 'public', d)) && statSync(join(WEB, 'public', d)).size > GIOI_HAN);
  const tong = can.filter(d => existsSync(join(WEB, 'public', d))).reduce((s, d) => s + statSync(join(WEB, 'public', d)).size, 0);
  const coSan = moiFile(THU_MUC_ANH).filter(f => !BO_QUA(f)).map(f => `/${tuGoc(f).replace(/^web\/public\//, '')}`);
  const thua = coSan.filter(d => !can.includes(d));
  ok(`anh-tao-san.ts: ${Object.keys(ANH_TAO_SAN).length} ảnh khai đúng (id có trong danh mục, đủ thông số)`, loi.length === 0, loi.join(' | '));
  ok(`Mỗi cỡ ảnh khai trong anh-tao-san.ts có đủ .avif và .webp trong web/public/anh (${can.length} file)`, thieu.length === 0,
     thieu.slice(0, 5).join(', '));
  ok('Mỗi file ảnh ≤ 300 KB', nang.length === 0, nang.map(d => `${d} ${(statSync(join(WEB, 'public', d)).size / 1024).toFixed(0)} KB`).join(', '));
  ok('Tổng dung lượng ảnh ≤ 8 MB', tong <= 8 * 1024 * 1024, `${(tong / 1024 / 1024).toFixed(1)} MB`);
  ok('Không file ảnh nào trong web/public/anh mà anh-tao-san.ts không khai (ảnh thừa, ảnh gốc lọt vào)', thua.length === 0,
     thua.slice(0, 5).join(', '));
});

// ===========================================================================
/** Bề rộng × cao của một PNG, đọc khối IHDR (ngay sau chữ ký 8 byte). */
function coPng(f) {
  const b = readFileSync(f);
  const chuKy = b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!chuKy || b.subarray(12, 16).toString('latin1') !== 'IHDR') return null;
  return { rong: b.readUInt32BE(16), cao: b.readUInt32BE(20) };
}

await nhom('5 · GIT THẤY MỌI FILE TÀI SẢN; ẢNH CHIA SẺ ĐÚNG CỠ', async () => {
  const tep = THU_MUC_TAI_SAN.flatMap(moiFile).filter(f => !BO_QUA(f)).map(tuGoc);
  const gitThay = new Set(execFileSync('git', ['ls-files', '-co', '--exclude-standard', ...THU_MUC_TAI_SAN.map(tuGoc)],
    { cwd: GOC, encoding: 'utf8' }).split('\n').filter(Boolean));
  const biChan = tep.filter(f => !gitThay.has(f));
  ok(`${tep.length} file trong web/public/thuong-hieu, web/public/anh, web/cong-cu đều được git thấy`,
     tep.length > 0 && biChan.length === 0,
     biChan.length ? `${biChan.slice(0, 6).join(', ')} — thêm dòng !đường-dẫn vào mục ĐƯỢC PHÉP của .gitignore` : '');
  for (const f of ['web/public/bieu-tuong.svg', 'web/public/favicon.ico', 'web/THUC-DON.md']) {
    const thay = execFileSync('git', ['ls-files', '-co', '--exclude-standard', f], { cwd: GOC, encoding: 'utf8' }).trim() === f;
    ok(`${f} có mặt và được git thấy`, existsSync(join(GOC, f)) && thay);
  }
  // Ảnh chụp màn hình của thu-day-du.mjs không bao giờ vào git.
  let anhChupBiChan = false;
  try { execFileSync('git', ['check-ignore', '-q', 'web/kiem-tra/anh-chup/rong/goc-360.png'], { cwd: GOC }); anhChupBiChan = true; } catch { /* mã 1 = không bị chặn */ }
  ok('web/kiem-tra/anh-chup/ (ảnh chụp của thu-day-du --chup) bị .gitignore chặn', anhChupBiChan);

  const chiaSe = coPng(join(WEB, 'public', 'thuong-hieu', 'chia-se-1200x630.png'));
  ok('chia-se-1200x630.png là PNG đúng 1200 × 630 (thẻ og:image khai đúng cỡ này)', chiaSe?.rong === 1200 && chiaSe?.cao === 630,
     JSON.stringify(chiaSe));
  const bieuTuong = coPng(join(WEB, 'public', 'thuong-hieu', 'bieu-tuong-180.png'));
  ok('bieu-tuong-180.png là PNG 180 × 180 (apple-touch-icon)', bieuTuong?.rong === 180 && bieuTuong?.cao === 180, JSON.stringify(bieuTuong));
  const layout = readFileSync(join(SRC, 'layouts', 'Trang.astro'), 'utf8');
  ok('Trang.astro khai og:image dự phòng 1200 × 630 đúng file này',
     layout.includes('/thuong-hieu/chia-se-1200x630.png') && /rong: 1200, cao: 630/.test(layout));
});

// ===========================================================================
// Bảng màu Khánh chốt ngày 09/10/2026 và các màu pha cho màn hình Khánh cho phép ngày 10/10/2026
// (THUONG-HIEU.md mục 1 và 4). Chép tay ở đây, KHÔNG đọc từ file: sửa nhầm một mã ở cong-khai.css
// thì phép thử này đỏ. /noi-bo và kho chưa đổi: chúng đọc :root của chung.css (nhóm 2 giữ nguyên).
const BANG_MAU_CHOT = {
  '--do': '#A70C0C', '--kem': '#F0E3D0', '--than': '#151008', '--cuc-vang': '#F5AA14', '--da': '#B8A98C',
  '--mu-tat': '#F5AA14',                                  // guideline chỉ có một vàng: hai tên, một mã
  '--do-dam': '#890607', '--do-sau': '#890607',           // một đỏ đậm cho nút khi di chuột và chữ nhỏ
  '--kem-sau': '#EBDCC6', '--kem-dam': '#E7D5BC', '--vien-o': '#7A7366',
  '--muc-nhat': 'rgba(21, 16, 8, .68)', '--vach': 'rgba(21, 16, 8, .16)', '--vach-kem': 'rgba(240, 227, 208, .22)',
};
// Mã của các bảng trước (PDF nhận diện, guideline tới bản 15), viết kiểu hex hoặc bộ ba số RGB.
const MA_CU = /#(?:B23A2C|8F2C21|960F13|FBF4E1|F5ECD7|F1E4C2|1E160E|F2A900|F5C211|8C8577|A21E22|2A2016)\b|\b(?:30, ?22, ?14|251, ?244, ?225|178, ?58, ?44|150, ?15, ?19|143, ?44, ?33)\b/gi;
// Khu nội bộ — cùng danh sách với test-cong-khai-dinh-chu.mjs. Khu này chưa đổi bảng màu.
const NOI_BO = ['pages/noi-bo/', 'components/kho/', 'layouts/Kho.astro', 'layouts/NoiBo.astro',
  'components/SucKhoeHeThong.astro', 'components/BanDoChucNang.astro', 'components/OTimChucNang.astro'];

/** Độ sáng tương đối và tỷ lệ tương phản theo WCAG 2.2. Màu là '#RRGGBB'. */
function doSang(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function tuongPhan(a, b) {
  const [sang, toi] = [doSang(a), doSang(b)].sort((x, y) => y - x);
  return (sang + 0.05) / (toi + 0.05);
}
/** Màu chữ có độ trong (rgba … alpha) đặt trên một nền đặc → màu đặc mắt thấy. */
function phaTren(chu, nen, alpha) {
  const kenh = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [c, n] = [kenh(chu), kenh(nen)];
  return '#' + c.map((v, i) => Math.round(v * alpha + n[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}

await nhom('6 · BẢNG MÀU THƯƠNG HIỆU CHỐT 09/10/2026 — CHỈ Ở TRANG CÔNG KHAI', async () => {
  const ck = boChuThich(readFileSync(join(SRC, 'styles', 'cong-khai.css'), 'utf8'));
  const khoi = docQuyTac(ck).find(q => q.boChon === '.ck')?.trong ?? '';
  for (const [bien, giaTri] of Object.entries(BANG_MAU_CHOT)) {
    const m = khoi.match(new RegExp(`(?:^|[;\\s])${bien}\\s*:\\s*([^;]+);`));
    const soLanKhai = (ck.match(new RegExp(`(?:^|[;{\\s])${bien}\\s*:`, 'g')) ?? []).length;
    ok(`cong-khai.css: ${bien} là ${giaTri}, khai đúng một lần trong khối .ck đầu tiên`,
       !!m && chuanHoa(m[1]) === chuanHoa(giaTri) && soLanKhai === 1,
       m ? `${m[1].trim()} · khai ${soLanKhai} lần` : 'không thấy trong khối .ck đầu tiên');
  }

  // Không file công khai nào còn mã của bảng cũ — kể cả trong chú thích: chú thích ghi mã cũ là
  // chỗ người sau chép lại.
  const moiAstro = thu => readdirSync(join(SRC, thu), { withFileTypes: true }).flatMap(d => {
    const duong = thu ? `${thu}/${d.name}` : d.name;
    return d.isDirectory() ? moiAstro(duong) : d.name.endsWith('.astro') ? [duong] : [];
  });
  const congKhai = [
    ...moiAstro('').filter(f => !NOI_BO.some(n => f.startsWith(n))).map(f => join(SRC, f)),
    join(SRC, 'styles', 'cong-khai.css'), ...SVG,
  ];
  ok(`Danh sách file công khai có khung trang, component và SVG (${congKhai.length} file), không có file nội bộ`,
     congKhai.length > 40 && congKhai.some(f => f.endsWith('Trang.astro')) && !congKhai.some(f => /NoiBo\.astro|[\\/]kho[\\/]/.test(f)));
  const conCu = congKhai.flatMap(f => {
    const thay = [...new Set(readFileSync(f, 'utf8').match(MA_CU) ?? [])];
    return thay.length ? [`${tuGoc(f)}: ${thay.join(' ')}`] : [];
  });
  ok('Không file công khai nào còn mã màu của bảng cũ (hex hoặc bộ ba RGB)', conCu.length === 0, conCu.slice(0, 8).join(' | '));

  const layout = readFileSync(join(SRC, 'layouts', 'Trang.astro'), 'utf8');
  const mauThanh = layout.match(/<meta name="theme-color" content="([^"]+)"/)?.[1];
  ok('Trang.astro: theme-color là màu kem của bảng màu chốt', mauThanh?.toUpperCase() === BANG_MAU_CHOT['--kem'], mauThanh ?? 'không thấy thẻ');

  // Tương phản của hệ bề mặt (THIET-KE.md mục 2). Chữ thường cần 4,5 : 1; viền ô nhập cần 3 : 1.
  const M = BANG_MAU_CHOT;
  const mucNhat = nen => phaTren(M['--than'], nen, 0.68);
  const CAP = [
    ['chữ than trên kem', M['--than'], M['--kem'], 7],
    ['chữ than trên kem đậm', M['--than'], M['--kem-dam'], 7],
    ['chữ phụ (than 68 %) trên kem', mucNhat(M['--kem']), M['--kem'], 4.5],
    ['chữ phụ (than 68 %) trên kem đậm', mucNhat(M['--kem-dam']), M['--kem-dam'], 4.5],
    ['chữ đỏ trên kem', M['--do'], M['--kem'], 4.5],
    ['chữ đỏ trên kem sau', M['--do'], M['--kem-sau'], 4.5],
    ['chữ đỏ trên kem đậm', M['--do'], M['--kem-dam'], 4.5],
    ['chữ đỏ đậm trên kem đậm', M['--do-sau'], M['--kem-dam'], 4.5],
    ['chữ kem trên đỏ (nút chính, dải đỏ)', M['--kem'], M['--do'], 4.5],
    ['chữ kem trên đỏ đậm (nút khi di chuột)', M['--kem'], M['--do-dam'], 4.5],
    ['chữ đỏ đậm trên kem (nút trên dải đỏ)', M['--do-sau'], M['--kem'], 4.5],
    ['chữ kem trên than', M['--kem'], M['--than'], 7],
    ['chữ Warm Stone trên than', M['--da'], M['--than'], 4.5],
    ['chữ vàng trên than', M['--mu-tat'], M['--than'], 4.5],
    ['viền ô nhập trên kem', M['--vien-o'], M['--kem'], 3],
    // Trang công khai không còn nền trắng (nhóm 7): ô nhập nền kem, đứng trong thẻ form nền kem sau.
    ['viền ô nhập trên kem sau (thẻ form)', M['--vien-o'], M['--kem-sau'], 3],
  ];
  for (const [ten, chu, nen, can] of CAP) {
    const r = tuongPhan(chu, nen);
    ok(`Tương phản ${ten}: ${r.toFixed(2).replace('.', ',')} : 1 (cần ≥ ${String(can).replace('.', ',')} : 1)`, r >= can);
  }
  // Vàng và Warm Stone không bao giờ làm chữ trên nền sáng: bề mặt sáng không được trỏ biến chữ vào chúng.
  const beSang = docQuyTac(ck).filter(q => /\.be-kem/.test(q.boChon) && !/\.be-(toi|do)/.test(q.boChon)).map(q => q.trong).join(';');
  ok('Bề mặt sáng (.be-kem…) không dùng vàng hay Warm Stone làm màu chữ', !/--(chu-chinh|chu-phu|nhan|nhan-nho)\s*:\s*var\(--(mu-tat|cuc-vang|da)\)/.test(beSang));
  ok(`Vàng trên kem chỉ ${tuongPhan(M['--cuc-vang'], M['--kem']).toFixed(2).replace('.', ',')} : 1, Warm Stone trên kem chỉ ${tuongPhan(M['--da'], M['--kem']).toFixed(2).replace('.', ',')} : 1 — đúng lý do của luật trên`,
     tuongPhan(M['--cuc-vang'], M['--kem']) < 3 && tuongPhan(M['--da'], M['--kem']) < 3);
});

// ===========================================================================
// Quy tắc thành phần của đợt redesign (plan 11/10/2026, mục 4). Số đo trên trang đã dựng nằm ở
// web/kiem-tra/do-giao-dien.mjs; ở đây là phần đọc được từ mã — chạy trong npm test, không cần trình duyệt.
await nhom('7 · THÀNH PHẦN VÀ KHUNG TRANG: KHÔNG NỀN TRẮNG, TƯƠNG PHẢN Ô NHẬP, CỠ CHỮ VÀ LƯỚI', async () => {
  const M = BANG_MAU_CHOT;
  const moiAstro = thu => readdirSync(join(SRC, thu), { withFileTypes: true }).flatMap(d => {
    const duong = thu ? `${thu}/${d.name}` : d.name;
    return d.isDirectory() ? moiAstro(duong) : d.name.endsWith('.astro') ? [duong] : [];
  });
  const congKhai = [
    ...moiAstro('').filter(f => !NOI_BO.some(n => f.startsWith(n))).map(f => join(SRC, f)),
    join(SRC, 'styles', 'cong-khai.css'),
  ];

  // --- Không nền trắng: mã màu viết thẳng trong file công khai chỉ được là mã của bảng ---------
  // Bảng màu thương hiệu không có trắng. Mã được phép: 14 token của khối .ck và #211A10 (nền khung
  // ảnh trên dải tối, THIET-KE.md mục 2). Ngoại lệ ghi từng cái, kèm lý do:
  const MA_DUOC_PHEP = new Set([...Object.values(M).filter(v => v.startsWith('#')), '#211A10'].map(v => v.toUpperCase()));
  const NGOAI_LE = {
    // Bản in: giấy trắng, chữ đen — không phải màu trên màn hình.
    'web/src/styles/cong-khai.css': ['#FFF', '#000'],
    // Mặt nạ CSS (mask): #000 là "đục hoàn toàn" của mặt nạ, không phải màu vẽ ra.
    'web/src/components/DiCungNhom.astro': ['#000'],
    // Thẻ "Đọc nhãn khay": giấy nhãn trắng ngà, nghiêng, có bóng — PR 3 dựng lại thẻ này thì gỡ dòng này.
    'web/src/components/NhanKhay.astro': ['#FFFDF6'],
  };
  const maLa = congKhai.flatMap(f => {
    const ten = tuGoc(f);
    const la = [...new Set((readFileSync(f, 'utf8').match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? []).map(m => m.toUpperCase()))]
      .filter(m => !MA_DUOC_PHEP.has(m) && !(NGOAI_LE[ten] ?? []).includes(m));
    return la.length ? [`${ten}: ${la.join(' ')}`] : [];
  });
  ok(`${congKhai.length} file công khai: mã màu viết thẳng chỉ là mã của bảng màu (không trắng, không trắng ngà)`,
     congKhai.length > 30 && maLa.length === 0, maLa.join(' | '));
  const css = congKhai.map(f => [tuGoc(f), boChuThich(f.endsWith('.css') ? readFileSync(f, 'utf8')
    : (readFileSync(f, 'utf8').match(/<style[^>]*>([\s\S]*?)<\/style>/g) ?? []).join('\n'))]);
  const tuKhoaTrang = css.filter(([, c]) => /(?:background|color|border|fill|stroke)[a-z-]*\s*:[^;{}]*\b(?:white|ivory|snow)\b/i.test(c)
    || /color-mix\([^)]*(?:#fff|white)/i.test(c)).map(([ten]) => ten);
  ok('CSS của trang công khai không dùng từ khóa white / ivory / snow, không pha với trắng (color-mix)', tuKhoaTrang.length === 0, tuKhoaTrang.join(', '));
  const inRa = boChuThich(readFileSync(join(SRC, 'styles', 'cong-khai.css'), 'utf8'));
  const ngoaiIn = inRa.replace(/@media print\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, '');
  ok('cong-khai.css: #fff và #000 chỉ nằm trong khối @media print', !/#(?:fff|000)\b/i.test(ngoaiIn) && /@media print/.test(inRa));
  const nenO = inRa.match(/input\[type='text'\][^{]*\{([^}]*)\}/)?.[1] ?? '';
  ok('cong-khai.css: ô nhập nền var(--kem), viền var(--vien-o), chữ 16px, cao tối thiểu 48px',
     /background:\s*var\(--kem\)/.test(nenO) && /border:\s*1px solid var\(--vien-o\)/.test(nenO)
       && /font-size:\s*16px/.test(nenO) && /min-height:\s*48px/.test(nenO), nenO.trim().replace(/\s+/g, ' '));

  // --- Tương phản của các cặp mới (tính lại theo công thức WCAG 2.2, không chép số) ---------------
  const mucNhat = nen => phaTren(M['--than'], nen, 0.68);
  const CAP = [
    // [tên, màu chữ / viền, màu nền, ngưỡng, con số tài liệu ghi (THIET-KE.md mục 2)]
    ['viền ô nhập trên Cream (nền của ô)', M['--vien-o'], M['--kem'], 3, '3,71'],
    ['viền ô nhập trên kem sau (thẻ form quanh ô)', M['--vien-o'], M['--kem-sau'], 3, '3,49'],
    ['chữ gõ trong ô (than) trên Cream', M['--than'], M['--kem'], 7, '14,96'],
    ['câu lỗi (đỏ đậm) trên kem sau', M['--do-dam'], M['--kem-sau'], 4.5, '7,45'],
    ['gợi ý dưới nhãn (than 68 %) trên kem sau', mucNhat(M['--kem-sau']), M['--kem-sau'], 4.5, '5,80'],
    ['nút phụ: chữ đỏ trên Cream', M['--do'], M['--kem'], 4.5, '6,15'],
    ['nút phụ khi di chuột: chữ đỏ đậm trên kem đậm', M['--do-dam'], M['--kem-dam'], 4.5, '7,00'],
    ['nút phụ trên dải đỏ khi di chuột: chữ Cream trên đỏ pha 12 % Cream', M['--kem'], phaTren(M['--kem'], M['--do'], 0.12), 4.5, '5,27'],
    ['ô giờ đang chọn: chữ Cream trên Beef Red', M['--kem'], M['--do'], 4.5, '6,15'],
    ['dòng pháp nhân: Warm Stone trên Charcoal', M['--da'], M['--than'], 4.5, '8,19'],
  ];
  for (const [ten, chu, nen, can, ghi] of CAP) {
    const r = tuongPhan(chu, nen);
    const so = r.toFixed(2).replace('.', ',');
    ok(`Tương phản ${ten}: ${so} : 1 (cần ≥ ${String(can).replace('.', ',')} : 1; tài liệu ghi ${ghi})`, r >= can && so === ghi, `tính ra ${so}`);
  }

  // --- Cỡ chữ, lưới, đầu trang: giá trị khai trong cong-khai.css ----------------------------------
  const ck = boChuThich(readFileSync(join(SRC, 'styles', 'cong-khai.css'), 'utf8'));
  const khoi = docQuyTac(ck).find(q => q.boChon === '.ck')?.trong ?? '';
  const bien = ten => khoi.match(new RegExp(`(?:^|[;\\s])${ten}\\s*:\\s*([^;]+);`))?.[1].trim() ?? null;
  const soLanKhai = ten => (ck.match(new RegExp(`(?:^|[;{\\s])${ten}\\s*:`, 'g')) ?? []).length;
  ok('cong-khai.css: chữ chạy --co-than 16px ở mọi bề rộng (khai đúng một lần)', bien('--co-than') === '16px' && soLanKhai('--co-than') === 1,
     `${bien('--co-than')} · khai ${soLanKhai('--co-than')} lần`);
  ok('cong-khai.css: .ck đặt line-height 1.5 (16/24px)', /(?:^|[;\s])line-height\s*:\s*1\.5\s*;/.test(khoi));
  ok('cong-khai.css: khung nội dung --rong-ck 1200px', bien('--rong-ck') === '1200px', bien('--rong-ck') ?? 'không thấy');
  ok('cong-khai.css: lề --le nhỏ nhất 20px', /^clamp\(20px,/.test(bien('--le') ?? ''), bien('--le') ?? 'không thấy');
  const kep = ten => (bien(ten) ?? '').match(/^clamp\((\d+)px,.*,\s*(\d+)px\)$/)?.slice(1).map(Number) ?? [];
  ok('cong-khai.css: --co-h1 chạy từ 32px tới 48px', kep('--co-h1').join('→') === '32→48', bien('--co-h1') ?? 'không thấy');
  ok('cong-khai.css: --co-h2 nhỏ hơn --co-h1 ở cả hai đầu', kep('--co-h2').length === 2 && kep('--co-h2')[0] < 32 && kep('--co-h2')[1] < 48, bien('--co-h2') ?? 'không thấy');
  ok('cong-khai.css: khoảng cách khối --muc-dem trong 48–64px (điện thoại) tới 72–96px (máy tính)',
     kep('--muc-dem').length === 2 && kep('--muc-dem')[0] >= 48 && kep('--muc-dem')[0] <= 64 && kep('--muc-dem')[1] >= 72 && kep('--muc-dem')[1] <= 96,
     bien('--muc-dem') ?? 'không thấy');
  const caoDau = [...ck.matchAll(/--cao-dau\s*:\s*(\d+)px/g)].map(m => Number(m[1]));
  ok('cong-khai.css: đầu trang --cao-dau 64px, từ 1080px là 80px',
     JSON.stringify(caoDau) === '[64,80]' && /@media \(min-width: 1080px\)\s*\{\s*html:has\(body\.ck\)\s*\{\s*--cao-dau:\s*80px/.test(ck), JSON.stringify(caoDau));
  const nut = docQuyTac(ck).find(q => q.boChon === '.ck .nut')?.trong ?? '';
  ok('cong-khai.css: .nut cao tối thiểu 48px, đệm ngang 20px, bo góc var(--bo) = 4px',
     /min-height:\s*48px/.test(nut) && /padding:\s*\d+px 20px/.test(nut) && /border-radius:\s*var\(--bo\)/.test(nut) && bien('--bo') === '4px',
     nut.trim().replace(/\s+/g, ' ').slice(0, 160));

  // --- Chân trang, biểu tượng, ngôn ngữ ---------------------------------------------------------
  const chan = readFileSync(join(SRC, 'components', 'ChanTrang.astro'), 'utf8');
  ok('ChanTrang.astro: không còn hoa văn chữ BEEFTOWN (hoa-van-chu) sau chữ', !/hoa-van/.test(chan));
  ok('cong-khai.css: không còn lớp .hoa-van-chu (không trang nào dùng)', !/\.hoa-van-chu/.test(ck));
  ok('ChanTrang.astro: logo Cream là file vector gốc, khai đúng cỡ 446 × 124',
     chan.includes('<img src="/thuong-hieu/logo-ngang-kem.svg" width="446" height="124"'));
  const bieuTuong = readFileSync(join(SRC, 'components', 'BieuTuong.astro'), 'utf8');
  ok('BieuTuong.astro: lưới 24, nét 1,5, nét không co theo cỡ hiển thị (vector-effect="non-scaling-stroke")',
     /viewBox="0 0 24 24"/.test(bieuTuong) && /stroke-width="1\.5"/.test(bieuTuong) && /vector-effect="non-scaling-stroke"/.test(bieuTuong));
  const layout = readFileSync(join(SRC, 'layouts', 'Trang.astro'), 'utf8');
  const dauTrang = readFileSync(join(SRC, 'components', 'DauTrang.astro'), 'utf8');
  ok('Trang.astro đưa đủ ba thứ tiếng cho bộ chọn ngôn ngữ (không lọc bỏ thứ tiếng đang xem)',
     /doiNgonNgu=\{NGON_NGU\.map\(/.test(layout) && !/ngonNguKhac/.test(layout));
  ok('DauTrang.astro: thứ tiếng đang xem mang aria-current="true"; thứ tiếng khác là link có hreflang',
     /aria-current="true"/.test(dauTrang) && /hreflang=\{n\.nn\}/.test(dauTrang));
  const { chu } = await nap('chu.ts');
  ok('Nút đóng danh mục có nhãn chữ ở ba thứ tiếng (chu.ts: dong)',
     chu('vi').dong === 'Đóng' && chu('en').dong === 'Close' && chu('ko').dong === '닫기',
     [chu('vi').dong, chu('en').dong, chu('ko').dong].join(' · '));
});

process.exit(ketThuc('GIAO DIỆN TRANG CÔNG KHAI'));
