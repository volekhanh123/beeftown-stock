/**
 * BEEFTOWN CÂN — BỘ NHẬN DIỆN 21/10/2026 (THUONG-HIEU.md mục 0, việc 7)
 * ======================================================================
 *
 *     node test/test-can-nhan-dien.mjs
 *
 * Beeftown Cân (can-app/, chương trình Windows ở quầy) chạy không mạng, nên khai màu ngay trong hai trang của nó:
 * can-app/src/giao-dien.html (màn chính) và can-app/src/huong-dan.html (hướng dẫn). Bản 2.12 đổi cả hai sang bộ nhận
 * diện mà website đã dùng từ PR "Đổi nhận diện website": bảng 22/10/2026 (đỏ #BD0000, đen, trắng và năm màu pha cho màn
 * hình), không màu trạng thái (Khánh bỏ xanh / vàng / đỏ nhạt ngày 25/10/2026, câu 2), logo bộ 21/10/2026 thay chữ
 * BEEFTOWN gõ bằng phông. Web có kiểm thử riêng (test-noi-bo-bang-mau.mjs, test-noi-bo-trang-thai.mjs); file này gác
 * Beeftown Cân. Bất biến:
 *
 *   1. CÙNG BẢNG VỚI WEBSITE. Mỗi trang đúng một khối :root; mọi biến khai ở đó là biến của :root trong
 *      web/src/styles/chung.css, cùng giá trị — và cùng bảng chép tay ở đây (sửa nhầm một mã là đỏ). Không biến nào khác
 *      (bảng cũ: --trang, --mu-tat, --xanh*, --vang-nen, --do-nen, --chu-phu). Mọi var(--…) dùng trong trang có khai.
 *   2. KHÔNG MÃ CŨ, KHÔNG MÀU NGOÀI BẢNG. Không file nào của can-app/src còn mã hex hay bộ ba RGB của các bảng cũ, kể cả
 *      trong chú thích và JavaScript. Ngoài :root chỉ dùng biến — CSS (khối <style>, cả @media print; thuộc tính style) và
 *      màu JavaScript đặt vào style: không mã hex, rgb() / rgba() chỉ với bộ ba của bảng, không tên màu, không màu hệ thống
 *      ngoài chế độ tương phản cao.
 *   3. TRẠNG THÁI BẰNG CHỮ, DẤU, NÉT. Không lớp nào tên xanh / vang / do / xam. Nhãn .nhan-l chỉ có sáu kiểu của
 *      THUONG-HIEU.md mục 4 (K1 cho, K3 nhap, K4 song, K5 luu-y, K6 tat, K7 thong-tin), vẽ như .nb-nhan của web;
 *      JavaScript chỉ gán sáu tên đó. Khối báo .bao (xong ✓, lưu ý vòng "!", lỗi tam giác "!"), ô số .so-o .o (làm ngay,
 *      lưu ý), đèn .den (nối được, không nối được, chưa biết), nhãn và hộp của trang hướng dẫn: hai trạng thái không bao
 *      giờ chỉ khác nhau bằng màu. Dòng đã sửa chưa gửi có vạch, không chỉ đổi nền — và không nhảy chữ khi vạch hiện.
 *      Chế độ tương phản cao (Windows) giữ hình của dấu, đèn.
 *   4. TƯƠNG PHẢN (WCAG 2.2) tính ở đây; đầu trang đen chỉ có chữ trắng và chữ phụ --da.
 *   5. LOGO VÀ BIỂU TƯỢNG BỘ MỚI. Không gõ BEEFTOWN bằng phông ở đầu trang. may-chu.ts đóng gói logo phụ trắng
 *      (web/public/thuong-hieu/chu-beeftown-trang.svg) và biểu tượng cửa sổ (web/public/bieu-tuong.svg) vào .exe;
 *      ganNhanDien (src/nhan-dien.ts) đặt chúng vào trang: đầu trang có đúng path của file logo, chỉ màu trắng, rộng
 *      148 px; thẻ icon là brandmark đỏ. Bản in của hướng dẫn đổi logo trắng thành đen (giấy trắng); chế độ tương phản cao
 *      tô logo theo màu chữ. dong-goi-can.yml đóng gói thử khi PR đụng bất kỳ file nào ngoài can-app/ mà .exe nhúng.
 *   6. CÂU CHỮ không gọi trạng thái bằng xanh / vàng (hai trang, câu của src/*.ts), không gọi đèn, dòng bằng "đỏ" khi hình đã
 *      đổi (tam giác đỏ, khung viền đỏ). Có mẫu tự kiểm.
 *   7. PHIÊN BẢN MỚI: PHIEN_BAN 2.12.0; README có mục "Bản 2.12" (đổi gì, thử ở quán) đứng trên mục 2.11.
 *   8. TÀI LIỆU không còn nói Beeftown Cân "chưa đổi" / "còn bảng cũ".
 *
 * Mã chép tay ở đây, KHÔNG đọc từ file của Beeftown Cân: sửa nhầm một mã trong trang thì phép thử này đỏ.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { taoMauLaTrong } from './mau-css.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CAN = join(GOC, 'can-app');
const SRC_CAN = join(CAN, 'src');
const doc = p => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CÂN — BỘ NHẬN DIỆN 21/10/2026');

// ---------------------------------------------------------------------------
// Bảng màu — chép tay từ THUONG-HIEU.md (mục 1 và mục 4), như test-noi-bo-bang-mau.mjs. Tên biến giữ như web
// (--kem là trắng, --than là đen; đổi tên là việc 4 — khi đổi thì đổi cả hai trang của Beeftown Cân).
// ---------------------------------------------------------------------------
const BANG_MAU = {
  '--do': '#BD0000', '--kem': '#FFFFFF', '--than': '#000000', '--da': '#E2E2E2',
  '--do-dam': '#8F0000', '--do-sau': '#8F0000', '--kem-sau': '#F4F4F4', '--kem-dam': '#E2E2E2',
  '--vien-o': '#767676', '--muc-nhat': '#555555', '--vach': '#E2E2E2', '--vach-kem': 'rgba(255, 255, 255, .22)',
};
// Biến của bảng cũ của Beeftown Cân — không được khai, không được dùng.
const BIEN_CU = ['--trang', '--mu-tat', '--xanh', '--xanh-nen', '--vang-nen', '--do-nen', '--chu-phu', '--cuc-vang', '--mau-tat'];

// Mã của các bảng trước — bảng cũ của Beeftown Cân (kem, đỏ gạch, vàng Marigold, màu trạng thái, màn hình cân xanh lá,
// xám nâu), bảng 09/10/2026 và tám màu trạng thái của web, các bảng cũ hơn của web. Hex và bộ ba trong rgb() / rgba().
const HEX_CU = [
  'B23A2C', '8E2B20', 'FBF4E1', 'F3E8CC', 'F2A900', '1E160E', 'B8A98C', 'E4D8BC', '1F7A4C', 'E9F5EE', 'FDECEA', 'FFF5DC',   // Beeftown Cân 2.11
  '6A5D45', '7A6C52', '8A7C62', '3A2D20', '7A5200', 'F3C8C2', '6B4A00', '1F261E', 'A8EF9B', 'C9D7C5', 'B9B9B9',
  'A70C0C', '890607', 'F0E3D0', 'EBDCC6', 'E7D5BC', '151008', 'F5AA14', '7A7366', '211A10', 'FFFDF6',                       // bảng 09/10/2026
  '1A683F', 'D3E3C6', 'A3C597', 'F6DC9E', 'DDB65C', 'F2D6CE', 'DDA79C',                                                     // trạng thái tới 25/10/2026
  '8F2C21', '960F13', 'F5ECD7', 'F1E4C2', 'F5C211', '8C8577', 'A21E22', '2A2016', 'FFFCF6', 'EFE4D2', 'E0D2BB',             // bảng cũ hơn của web
  'CDE7D8', 'F3DDA5', 'FFFCF2', 'FFFBF1', 'F2C9C3', 'FFF8F7', '8A5A00', 'B07A00', '8A6D00', '9A6B00', '7A5A00',
];
const BO_BA_CU = ['30,22,14', '242,169,0', '251,244,225', '178,58,44', '21,16,8', '240,227,208', '167,12,12', '137,6,7',
  '245,170,20', '184,169,140'];
const MA_CU = new RegExp(
  `#(?:${HEX_CU.join('|')})\\b|rgba?\\(\\s*(?:${BO_BA_CU.map(b => b.split(',').join('(?:\\s*,\\s*|\\s+)')).join('|')})\\b`, 'gi');
const BO_BA_DUOC = new Set(['0,0,0', '255,255,255', '189,0,0', '143,0,0']);   // đen · trắng · đỏ · đỏ đậm
const mauLa = taoMauLaTrong(BO_BA_DUOC);

// ---------------------------------------------------------------------------
// Đọc CSS
// ---------------------------------------------------------------------------
const boChuThichCss = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
const chuan = v => (v ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const so = x => x.toFixed(2).replace('.', ',');
/** Tách danh sách bộ chọn theo dấu phẩy ở tầng ngoài (phẩy trong :is(…), :where(…) không tách). */
function tachDanhSach(boChon) {
  const ra = [];
  let sau = 0, dau = 0;
  for (let k = 0; k < boChon.length; k++) {
    if (boChon[k] === '(') sau++;
    else if (boChon[k] === ')') sau--;
    else if (boChon[k] === ',' && sau === 0) { ra.push(boChon.slice(dau, k)); dau = k + 1; }
  }
  ra.push(boChon.slice(dau));
  return ra.map(x => x.trim()).filter(Boolean);
}
/** CSS → danh sách quy tắc { boChon, trong } ở tầng ngoài cùng; khối @media giữ nguyên để người gọi tự đi vào. */
function docQuyTac(css) {
  const ra = [];
  let i = 0;
  while (i < css.length) {
    const mo = css.indexOf('{', i);
    if (mo < 0) break;
    const truoc = css.slice(i, mo).trim();
    let sau = mo + 1, muc = 1;
    for (; sau < css.length && muc > 0; sau++) {
      if (css[sau] === '{') muc++;
      else if (css[sau] === '}') muc--;
    }
    ra.push({ boChon: truoc.replace(/^[;\s]+/, ''), trong: css.slice(mo + 1, sau - 1) });
    i = sau;
  }
  return ra;
}
/** Mọi quy tắc thường (đi vào @media, @supports), kèm cờ "trong @media print", "trong @media (forced-colors: active)" và
    "trong một điều kiện bất kỳ" (@media theo bề rộng, @supports…: không phải lúc nào cũng áp). */
function quyTacPhang(css, trongIn = false, tuongPhanCao = false, dieuKien = false) {
  return docQuyTac(css).flatMap(q => {
    if (/^@(media|container|supports)\b/.test(q.boChon)) {
      return quyTacPhang(q.trong, trongIn || /^@media[^{]*\bprint\b/.test(q.boChon), tuongPhanCao || /forced-colors:\s*active/.test(q.boChon), true);
    }
    if (q.boChon.startsWith('@')) return [];
    return [{ boChon: q.boChon.replace(/\s+/g, ' '), trong: q.trong, trongIn, tuongPhanCao, dieuKien }];
  });
}
/** Thân quy tắc → [[thuộc tính, giá trị], …] theo thứ tự (content: '…;…' không có trong CSS của hai trang). */
const khaiBaoCua = trong => trong.split(';').map(d => d.trim()).filter(Boolean).flatMap(d => {
  const k = d.indexOf(':');
  return k < 0 ? [] : [[d.slice(0, k).trim().toLowerCase(), d.slice(k + 1).trim()]];
});
/** Khai báo của đúng một bộ chọn, chỉ từ quy tắc luôn áp (ngoài mọi @media, @supports — một kiểu chỉ khai trong
    @media theo bề rộng thì không tính), gộp theo thứ tự — khai sau thắng. */
function kieu(css, boChon) {
  const can = boChon.replace(/\s+/g, ' ').trim();
  const khai = quyTacPhang(css).filter(q => !q.dieuKien)
    .filter(q => tachDanhSach(q.boChon).some(x => x.replace(/\s+/g, ' ').trim() === can))
    .flatMap(q => khaiBaoCua(q.trong));
  return Object.fromEntries(khai.map(([p, v]) => [p, chuan(v)]));
}
/** Nét viền (bề rộng, kiểu, màu) của cạnh trái sau khi gộp các khai báo border*: đủ cho nhãn, khối, ô. */
function vienCua(k) {
  let v = { rong: 'medium', kieu: 'none', mau: '' };
  const tach = s => {
    const t = s.split(/\s+(?![^(]*\))/).filter(Boolean);
    return {
      rong: t.find(x => /^(?:\d*\.?\d+(?:px|rem|em)|0)$/.test(x)),
      kieu: t.find(x => /^(?:none|dotted|dashed|solid|double)$/.test(x)),
      mau: t.find(x => !/^(?:\d*\.?\d+(?:px|rem|em)|0)$/.test(x) && !/^(?:none|dotted|dashed|solid|double)$/.test(x)),
    };
  };
  for (const [p, gt] of Object.entries(k)) {
    if (p === 'border' || p === 'border-left') { const t = tach(gt); v = { rong: t.rong ?? 'medium', kieu: t.kieu ?? 'none', mau: t.mau ?? '' }; }
    else if (p === 'border-color' || p === 'border-left-color') v.mau = gt.split(/\s+(?![^(]*\))/).at(-1);
    else if (p === 'border-style') v.kieu = gt.split(/\s+/).at(-1);
    else if (p === 'border-width' || p === 'border-left-width') v.rong = gt.split(/\s+/).at(-1);
  }
  return v.kieu === 'none' || v.mau === 'transparent' ? { rong: '0', kieu: 'none', mau: '' } : v;
}
/** Dấu của ::before / ::after: chữ của dấu (dòng content đầu) và hình (clip-path / border-radius / viền). */
function dauCua(k) {
  if (!k.content || /^(?:none|normal)$/.test(k.content)) return null;
  const chu = k.content.match(/^(["'])(.*?)\1/)?.[2]?.trim() ?? k.content;
  const v = vienCua(k);
  return `«${chu}» ${k['clip-path'] ? 'tam giác' : k['border-radius'] === '50%' ? 'tròn' : 'vuông'}${v.kieu !== 'none' ? ` viền ${v.kieu}` : ''}`
    + `${k.background && k.background !== 'transparent' ? ' đặc' : ' rỗng'}`;
}
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

// ---------------------------------------------------------------------------
// Hai trang
// ---------------------------------------------------------------------------
const TEN_TRANG = ['giao-dien.html', 'huong-dan.html'];
const TRANG = Object.fromEntries(TEN_TRANG.map(f => [f, doc(join(SRC_CAN, f))]));
const khoiStyle = html => [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
const kichBan = html => [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
const CSS = Object.fromEntries(TEN_TRANG.map(f => [f, boChuThichCss(khoiStyle(TRANG[f]))]));
/** Mọi giá trị thuộc tính style="…" của trang — cả trong chuỗi JavaScript dựng markup. */
const styleNoiTuyen = html => [...html.matchAll(/\bstyle="([^"]*)"/g)].map(m => m[1]);
/** Phần chữ của trang: bỏ khối <style>, chú thích HTML và chú thích JavaScript (khối và dòng). */
function chuCuaTrang(html) {
  return html.replace(/<style\b[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*$/gm, '$1');
}
const GD = TRANG['giao-dien.html'], HD = TRANG['huong-dan.html'];
const JS_GD = kichBan(GD).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*$/gm, '$1');

// ===========================================================================
await nhom('1 · CÙNG BẢNG VỚI WEBSITE: :root CỦA HAI TRANG ĐÚNG BẢNG 22/10/2026 VÀ CÙNG GIÁ TRỊ VỚI chung.css', async () => {
  const chung = boChuThichCss(doc(join(GOC, 'web', 'src', 'styles', 'chung.css')));
  const rootWeb = Object.fromEntries(docQuyTac(chung).filter(q => q.boChon.trim() === ':root')
    .flatMap(q => khaiBaoCua(q.trong)).filter(([p]) => p.startsWith('--')).map(([p, v]) => [p, chuan(v)]));
  ok('chung.css: đọc được 12 biến màu của bảng (đúng bảng chép tay)',
     Object.entries(BANG_MAU).every(([p, v]) => rootWeb[p] === chuan(v)),
     Object.entries(BANG_MAU).filter(([p, v]) => rootWeb[p] !== chuan(v)).map(([p, v]) => `${p}: ${rootWeb[p]} ≠ ${v}`).join(' · '));
  for (const f of TEN_TRANG) {
    const css = CSS[f];
    const khoi = docQuyTac(css).filter(q => q.boChon.trim() === ':root');
    ok(`${f}: đúng một khối :root`, khoi.length === 1, `${khoi.length} khối`);
    const khai = khoi.flatMap(q => khaiBaoCua(q.trong)).filter(([p]) => p.startsWith('--'));
    const ten = khai.map(([p]) => p);
    const sai = khai.filter(([p, v]) => !(p in BANG_MAU) || chuan(BANG_MAU[p]) !== chuan(v)).map(([p, v]) => `${p}: ${v}`);
    ok(`${f}: :root chỉ khai biến của bảng 22/10/2026, đúng mã chép tay (${khai.length} biến)`, khai.length >= 8 && sai.length === 0, sai.join(' · '));
    ok(`${f}: mỗi biến khai đúng một lần`, new Set(ten).size === ten.length, ten.filter((t, i) => ten.indexOf(t) !== i).join(', '));
    const khacWeb = khai.filter(([p, v]) => rootWeb[p] !== chuan(v)).map(([p, v]) => `${p}: ${v} ≠ chung.css ${rootWeb[p] ?? '(không có)'}`);
    ok(`${f}: mỗi biến cùng tên, cùng giá trị với :root của web/src/styles/chung.css`, khacWeb.length === 0, khacWeb.join(' · '));
    const ngoaiRoot = quyTacPhang(css).filter(q => q.boChon.trim() !== ':root')
      .flatMap(q => khaiBaoCua(q.trong).filter(([p]) => p.startsWith('--')).map(([p]) => `${q.boChon} ${p}`));
    ok(`${f}: không khai biến nào ngoài :root`, ngoaiRoot.length === 0, ngoaiRoot.join(' · '));
    const cu = BIEN_CU.filter(b => new RegExp(`(?<![\\w-])${b}(?![\\w-])`).test(TRANG[f]));
    ok(`${f}: không còn biến của bảng cũ (${BIEN_CU.join(', ')})`, cu.length === 0, cu.join(', '));
    const dung = new Set([...TRANG[f].matchAll(/var\(\s*(--[a-z0-9-]+)/g)].map(m => m[1]));
    const moCoi = [...dung].filter(b => !ten.includes(b));
    ok(`${f}: mọi var(--…) dùng trong trang (CSS, thuộc tính style, JavaScript) đều có khai ở :root (${dung.size} biến)`,
       dung.size >= 6 && moCoi.length === 0, moCoi.join(', '));
  }
});

// ===========================================================================
await nhom('2 · KHÔNG MÃ CŨ, KHÔNG MÀU NGOÀI BẢNG (ngoài :root chỉ có biến — cả giấy in, cả màu JavaScript đặt vào style)', async () => {
  const tepSrc = readdirSync(SRC_CAN).filter(f => /\.(?:html|ts)$/.test(f));
  const conCu = tepSrc.flatMap(f => {
    const thay = [...new Set(doc(join(SRC_CAN, f)).match(MA_CU) ?? [])];
    return thay.length ? [`${f}: ${thay.slice(0, 5).join(' ')}`] : [];
  });
  ok(`${tepSrc.length} file của can-app/src (trang, mã .ts — cả chú thích, JavaScript) không còn mã hex hay bộ ba RGB của bảng cũ`,
     tepSrc.length >= 10 && tepSrc.includes('giao-dien.html') && conCu.length === 0, conCu.slice(0, 6).join(' | '));
  ok('…phép quét màu JavaScript bắt `#111 0%`, \'#BD0000\', rgba(; không bắt bộ chọn #giay, #bao-chung, #o-kho',
     ['d.push(`#111 ${a}%`)', "x.style.color = '#BD0000'", "el.style.background = 'rgba(0, 0, 0, .1)'"].every(m => /#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?(?![\w-])|\b(?:rgba?|hsla?)\(/i.test(m))
       && ["$('#giay .el')", "document.querySelector('#bao-chung')", "'#o-kho'", "'#dem'"].every(m => !/#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?(?![\w-])|\b(?:rgba?|hsla?)\(/i.test(m)));
  ok('…bộ lọc mã cũ bắt được mã cũ của Beeftown Cân (hex, rgba phẩy / cách), không bắt mã của bảng mới',
     ['#B23A2C', '#fbf4e1', 'rgba(242,169,0,.4)', 'rgba(30, 22, 14, .12)', 'rgb(240 227 208 / .2)', 'background: #1f261e'].every(m => (m.match(MA_CU) ?? []).length > 0)
       && ['#BD0000', '#8F0000', '#F4F4F4', 'rgba(0, 0, 0, .18)', 'rgba(255, 255, 255, .1)', '#555555'].every(m => !m.match(MA_CU)));
  for (const f of TEN_TRANG) {
    const quyTac = quyTacPhang(CSS[f]).filter(q => q.boChon.trim() !== ':root');
    const hexNgoai = quyTac.flatMap(q => khaiBaoCua(q.trong)
      .filter(([, v]) => /#[0-9a-f]{3,8}\b/i.test(v)).map(([p, v]) => `${q.boChon} { ${p}: ${v} }`));
    ok(`${f}: ngoài :root, CSS không viết mã hex (chỉ var(--…)) — cả @media print`, hexNgoai.length === 0, hexNgoai.slice(0, 5).join(' | '));
    const js = kichBan(TRANG[f]).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*$/gm, '$1');
    const mauJs = [...js.matchAll(/#[0-9a-f]{3}(?:[0-9a-f]{3})?(?:[0-9a-f]{2})?(?![\w-])|\b(?:rgba?|hsla?)\(/gi)].map(m => js.slice(Math.max(0, m.index - 30), m.index + 12).replace(/\s+/g, ' '));
    ok(`${f}: JavaScript không viết màu thẳng (mã hex, rgb(), hsl()) — màu đặt vào style bằng JavaScript cũng là var(--…)`, mauJs.length === 0, mauJs.slice(0, 4).join(' | '));
    const la = quyTac.flatMap(q => khaiBaoCua(q.trong).flatMap(([p, v]) => mauLa(v, q.tuongPhanCao).map(x => `${q.boChon} { ${p}: ${x} }`)));
    const laNoiTuyen = styleNoiTuyen(TRANG[f]).flatMap(s => [...mauLa(s, false), ...(s.match(/#[0-9a-f]{3,8}\b/gi) ?? [])].map(x => `style="${s}": ${x}`));
    ok(`${f}: rgb() / rgba() chỉ với bộ ba của bảng; không hsl(), tên màu, màu hệ thống ngoài forced-colors — khối <style> và thuộc tính style`,
       la.length === 0 && laNoiTuyen.length === 0, [...la, ...laNoiTuyen].slice(0, 6).join(' | '));
  }
});

// ===========================================================================
const K_NHAN = ['cho', 'nhap', 'song', 'luu-y', 'tat', 'thong-tin'];
// Cách vẽ của từng kiểu (THUONG-HIEU.md mục 4; .nb-nhan của web/src/styles/noi-bo.css): nền, chữ, nét viền, dấu.
const K_VE = {
  cho:         { nen: 'var(--do)', chu: 'var(--kem)', net: 'none', dau: '!' },                         // K1 làm ngay
  nhap:        { nen: 'var(--than)', chu: 'var(--kem)', net: 'none', dau: null },                      // K3 nháp, đang làm dở
  song:        { nen: 'transparent', chu: 'var(--than)', net: 'solid var(--than)', dau: '✓' },         // K4 xong, đúng, đang bật
  'luu-y':     { nen: 'var(--kem-dam)', chu: 'var(--than)', net: 'none', dau: null },                  // K5 lưu ý
  tat:         { nen: 'transparent', chu: 'var(--muc-nhat)', net: 'dashed var(--vien-o)', dau: null }, // K6 tắt, chưa, bỏ qua
  'thong-tin': { nen: 'transparent', chu: 'var(--than)', net: 'solid var(--vien-o)', dau: null },      // K7 thuộc tính
};
/** Một nhãn (lớp gốc + một kiểu): nền, chữ, nét, dấu, rộng của nét — gộp lớp gốc trước, kiểu sau. */
function veNhan(css, goc, k) {
  const tu = { ...kieu(css, goc), ...kieu(css, `${goc}.${k}`) };
  const v = vienCua(tu);
  const dau = kieu(css, `${goc}.${k}::before`).content?.match(/^(["'])(.*?)\1/)?.[2]?.trim() || null;
  return { nen: tu.background ?? tu['background-color'] ?? null, chu: tu.color ?? null, net: v.kieu === 'none' ? 'none' : `${v.kieu} ${v.mau}`, rong: v.rong, dau };
}
/** Kênh không phải màu khác nhau giữa hai nhãn (rỗng = chỉ khác bằng màu, hoặc giống hệt). */
function kenhKhacNhan(a, b) {
  const nenDac = x => !!x.nen && x.nen !== 'transparent';
  const chuSang = x => x.chu === 'var(--kem)';
  const ra = [];
  if (a.dau !== b.dau) ra.push('dấu');
  if (a.net.split(' ')[0] !== b.net.split(' ')[0] || a.rong !== b.rong) ra.push('nét');
  if (nenDac(a) !== nenDac(b)) ra.push('nền đặc / rỗng');
  if (chuSang(a) !== chuSang(b)) ra.push('đảo chữ');
  return ra;
}
const giongHet = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Mọi tên lớp JavaScript gán cho nhãn .nhan-l: chữ viết thẳng (class="nhan-l x"), kết quả của ${a ? 'x' : 'y'} ngay sau
    "nhan-l ", và cặp [nhãn, lớp] của các bảng nhãn (NHAN, TINH_TRANG, TT, KQ_BUOC…) — nhãn mở đầu bằng chữ hoa. */
function lopNhanTrongJs(js) {
  const ra = [];
  for (const m of js.matchAll(/class=\\?["']nhan-l ([a-z- ]+)\\?["']/g)) ra.push(...m[1].trim().split(/\s+/));
  for (const m of js.matchAll(/nhan-l \$\{([^}]*)\}/g)) for (const k of m[1].matchAll(/[?:]\s*'([a-z-]*)'/g)) ra.push(k[1]);
  for (const m of js.matchAll(/\[\s*'(\p{Lu}[^'\n]*)'\s*,\s*'([a-z-]+)'\s*\]/gu)) ra.push(m[2]);
  return ra.filter(Boolean);
}

await nhom('3 · TRẠNG THÁI BẰNG CHỮ, DẤU, NÉT — KHÔNG LỚP MANG TÊN MÀU, NHÃN K1–K7, KHỐI BÁO, Ô SỐ, ĐÈN', async () => {
  const LOP_MAU = /\.(?:xanh|vang|do|xam)(?![\w-])/;
  for (const f of TEN_TRANG) {
    const sai = quyTacPhang(CSS[f]).filter(q => LOP_MAU.test(q.boChon)).map(q => q.boChon);
    ok(`${f}: không bộ chọn CSS nào dùng lớp xanh / vang / do / xam`, sai.length === 0, sai.join(' | '));
    const lopMarkup = [...TRANG[f].matchAll(/\bclass=\\?["']([^"'\\]*)\\?["']/g)].flatMap(m => m[1].split(/\s+/))
      .filter(l => /^(?:xanh|vang|do|xam)$/.test(l));
    ok(`${f}: không markup nào (cả chuỗi JavaScript dựng markup) gắn lớp xanh / vang / do / xam`, lopMarkup.length === 0, lopMarkup.join(', '));
  }
  const chuoiMau = [...JS_GD.matchAll(/(['"`])(xanh|vang|do|xam)\1/g)].map(m => m[0]);
  ok('giao-dien.html: JavaScript không còn chuỗi \'xanh\' / \'vang\' / \'do\' / \'xam\' (tên lớp theo màu ở bảng nhãn, đèn, ô số)',
     chuoiMau.length === 0, chuoiMau.join(', '));

  // --- Nhãn .nhan-l (giao-dien.html) ------------------------------------------------------------------------------
  const cssGd = CSS['giao-dien.html'];
  const kieuNhan = [...new Set(quyTacPhang(cssGd).flatMap(q => tachDanhSach(q.boChon))
    .flatMap(bc => [...bc.matchAll(/\.nhan-l\.([\w-]+)/g)].map(m => m[1])))];
  ok(`giao-dien.html: .nhan-l chỉ có sáu kiểu ${K_NHAN.join(', ')}`,
     kieuNhan.length === K_NHAN.length && K_NHAN.every(k => kieuNhan.includes(k)), kieuNhan.join(', '));
  ok('giao-dien.html: lớp gốc .nhan-l có viền trong suốt 1,5px (nhãn nền đặc cùng cỡ nhãn viền; tương phản cao vẽ thành khung)',
     /^1\.5px solid transparent$/.test(kieu(cssGd, '.nhan-l').border ?? ''), kieu(cssGd, '.nhan-l').border);
  const ve = Object.fromEntries(K_NHAN.map(k => [k, veNhan(cssGd, '.nhan-l', k)]));
  for (const k of K_NHAN) {
    const mong = K_VE[k], co = ve[k];
    ok(`giao-dien.html: .nhan-l.${k} vẽ như K${{ cho: 1, nhap: 3, song: 4, 'luu-y': 5, tat: 6, 'thong-tin': 7 }[k]} — nền ${mong.nen}, chữ ${mong.chu}, nét ${mong.net}, dấu ${mong.dau ?? 'không'}`,
       co.nen === mong.nen && co.chu === mong.chu && co.net === mong.net && co.dau === mong.dau, JSON.stringify(co));
  }
  const capNhan = K_NHAN.flatMap((a, i) => K_NHAN.slice(i + 1).map(b => [a, b]))
    .filter(([a, b]) => !giongHet(ve[a], ve[b]) && kenhKhacNhan(ve[a], ve[b]).length === 0).map(([a, b]) => `${a} / ${b}`);
  ok('giao-dien.html: hai kiểu nhãn bất kỳ khác nhau ở một kênh không phải màu (dấu, nét, nền đặc / rỗng, đảo chữ)', capNhan.length === 0, capNhan.join(' · '));
  const lopJs = lopNhanTrongJs(JS_GD);
  const lopLa = [...new Set(lopJs.filter(l => !K_NHAN.includes(l)))];
  ok(`giao-dien.html: JavaScript chỉ gán sáu kiểu nhãn (${lopJs.length} chỗ, đủ cả sáu kiểu)`,
     lopJs.length >= 30 && lopLa.length === 0 && K_NHAN.every(k => lopJs.includes(k)), `lạ: ${lopLa.join(', ')} · dùng: ${[...new Set(lopJs)].join(', ')}`);
  ok('…phép đọc lớp nhãn bắt được chữ viết thẳng, nhánh ${a ? \'x\' : \'y\'} và bảng [nhãn, lớp]; không bắt bảng canh chữ, chuỗi dữ liệu',
     JSON.stringify(lopNhanTrongJs(`'<span class="nhan-l luu-y">Cận date</span>' + \`<span class="nhan-l \${y.trang_thai === 'cho' ? 'luu-y' : 'nhap'}">\``
       + ` const NHAN = { them: ['Thêm', 'nhap'], giu: ['Giữ nguyên', 'song'] }; const CANH = { 1: ['flex-start', 'center'] };`
       + ` const DEM = [['them', 'thêm'], ['sua', 'sửa']]; x = ['Đủ', 'song'];`)) === JSON.stringify(['luu-y', 'luu-y', 'nhap', 'nhap', 'song', 'song']));

  // --- Khối báo .bao (giao-dien.html) ----------------------------------------------------------------------------
  const bao = Object.fromEntries(['xong', 'luu-y', 'loi'].map(t => [t, dauCua(kieu(cssGd, `.bao.${t}::before`))]));
  ok('giao-dien.html: khối .bao nền thẻ trắng, vạch trái 6px --vien-o (khối thông tin, không dấu)',
     kieu(cssGd, '.bao').background === 'var(--kem)' && /^6px solid var\(--vien-o\)$/.test(kieu(cssGd, '.bao')['border-left'] ?? ''), JSON.stringify(kieu(cssGd, '.bao')));
  ok('giao-dien.html: .bao.xong dấu ✓ trong vòng đen; .bao.luu-y dấu "!" trong vòng viền --muc-nhat; .bao.loi tam giác đỏ "!" và viền đỏ 2px',
     bao.xong === '«✓» tròn đặc' && bao['luu-y'] === '«!» tròn viền solid đặc' && bao.loi === '«!» tam giác đặc'
       && kieu(cssGd, '.bao.loi::before').background === 'var(--do)' && kieu(cssGd, '.bao.xong::before').background === 'var(--than)'
       && /^2px solid var\(--muc-nhat\)$/.test(kieu(cssGd, '.bao.luu-y::before').border ?? '') && /^2px solid var\(--do\)$/.test(kieu(cssGd, '.bao.loi').border ?? ''),
     JSON.stringify(bao));
  ok('giao-dien.html: ba khối báo khác nhau ở dấu (chữ hay hình), không chỉ ở màu', new Set(Object.values(bao)).size === 3 && Object.values(bao).every(Boolean));
  // Lớp của khối báo do người gọi bao(nơi, loại, câu) / baoChung(loại, câu) truyền vào: mọi chuỗi trong đối số "loại".
  const loaiBao = [...JS_GD.matchAll(/\bbao\(\s*[^,()]+(?:\([^()]*\))?\s*,\s*([^,]+),/g), ...JS_GD.matchAll(/\bbaoChung\(\s*([^,]+),/g)]
    .flatMap(m => [...m[1].matchAll(/'([a-z-]*)'/g)].map(k => k[1]));
  // '' = khối thông tin không dấu (.bao: "Đang lấy danh mục…") hay xoá khối (câu rỗng).
  const loaiLa = [...new Set(loaiBao.filter(l => !['', 'xong', 'luu-y', 'loi'].includes(l)))];
  ok(`giao-dien.html: JavaScript gọi khối báo chỉ với "xong", "luu-y", "loi" hay '' (khối thông tin, xoá khối) — ${loaiBao.length} chuỗi`,
     loaiBao.length >= 40 && loaiLa.length === 0 && ['xong', 'luu-y', 'loi'].every(l => loaiBao.includes(l)), `lạ: ${loaiLa.join(', ')}`);
  ok('…phép đọc loại khối báo bắt được bao($(\'x\'), \'loi\', …), bao(noi, r.ok ? \'xong\' : \'luu-y\', …), baoChung(\'xong\', …)',
     JSON.stringify([...`bao($('x'), 'loi', 'a'); bao(noi, r.ok ? 'xong' : 'luu-y', h); baoChung('xong', c);`.matchAll(/\bbao\(\s*[^,()]+(?:\([^()]*\))?\s*,\s*([^,]+),/g),
       ...`baoChung('xong', c);`.matchAll(/\bbaoChung\(\s*([^,]+),/g)].flatMap(m => [...m[1].matchAll(/'([a-z-]*)'/g)].map(k => k[1]))) === JSON.stringify(['loi', 'xong', 'luu-y', 'xong']));

  // --- Ô số .so-o .o (Quầy, Báo cáo, Nhật ký) ----------------------------------------------------------------------
  const oGap = dauCua(kieu(cssGd, '.so-o .o.gap::after')), oLuuY = dauCua(kieu(cssGd, '.so-o .o.luu-y::after'));
  ok('giao-dien.html: ô số "làm ngay" (.so-o .o.gap) viền đỏ 2px, số đỏ, tam giác "!"; ô "lưu ý" (.luu-y) viền --muc-nhat 2px, vòng "!"',
     /^2px solid var\(--do\)$/.test(kieu(cssGd, '.so-o .o.gap').border ?? '') && kieu(cssGd, '.so-o .o.gap .gt').color === 'var(--do)'
       && oGap === '«!» tam giác đặc' && /^2px solid var\(--muc-nhat\)$/.test(kieu(cssGd, '.so-o .o.luu-y').border ?? '') && oLuuY === '«!» tròn viền solid đặc',
     `${oGap} · ${oLuuY}`);
  const lopO = [...JS_GD.matchAll(/class="o \$\{([^}]*)\}"/g)].flatMap(m => [...m[1].matchAll(/[?:]\s*'([a-z-]*)'/g)].map(k => k[1])).filter(Boolean);
  ok(`giao-dien.html: JavaScript gán ô số chỉ "gap" và "luu-y" (${lopO.length} chỗ)`, lopO.length >= 6 && lopO.every(l => l === 'gap' || l === 'luu-y'), lopO.join(', '));

  // --- Đèn ô Cân .den ------------------------------------------------------------------------------------------------
  const den = { goc: kieu(cssGd, '.den'), noi: { ...kieu(cssGd, '.den'), ...kieu(cssGd, '.den.noi') }, loi: { ...kieu(cssGd, '.den'), ...kieu(cssGd, '.den.loi') } };
  ok('giao-dien.html: đèn ô Cân — chưa biết: vòng rỗng viền --vien-o; nối được (.noi): chấm đen; không nối được (.loi): tam giác đỏ',
     den.goc.background === 'transparent' && /2px solid var\(--vien-o\)/.test(den.goc.border ?? '') && den.goc['border-radius'] === '50%'
       && den.noi.background === 'var(--than)' && !den.noi['clip-path'] && den.loi.background === 'var(--do)' && /^polygon\(/.test(den.loi['clip-path'] ?? ''),
     JSON.stringify(den));
  const lopDen = [...JS_GD.matchAll(/className = '(den(?: [a-z-]+)?)'/g)].map(m => m[1])
    .concat([...JS_GD.matchAll(/className = 'den ' \+ \(([^)]*)\)/g)].flatMap(m => [...m[1].matchAll(/[?:]\s*'([a-z-]*)'/g)].map(k => `den ${k[1]}`)));
  ok(`giao-dien.html: JavaScript chỉ đặt đèn "den", "den noi", "den loi" (${lopDen.length} chỗ)`,
     lopDen.length >= 5 && lopDen.every(l => ['den', 'den noi', 'den loi'].includes(l)) && lopDen.includes('den noi') && lopDen.includes('den loi'), lopDen.join(', '));
  // Tương phản cao: .den.noi (0,2,0) thắng .den (0,1,0) — nên chính nó phải đặt viền màu hệ thống, không thì vòng đen #000 của
  // kiểu thường còn đó, trên nền tối chấm co lại 6px.
  const tpc = quyTacPhang(cssGd).filter(q => q.tuongPhanCao);
  const denTpc = sel => tpc.filter(q => tachDanhSach(q.boChon).includes(sel)).flatMap(q => khaiBaoCua(q.trong));
  ok('giao-dien.html: tương phản cao — đèn giữ hình bằng màu hệ thống: vòng CanvasText; chấm .noi và tam giác .loi nền CanvasText, chấm có viền CanvasText',
     denTpc('.den').some(([p, v]) => p === 'border-color' && v === 'CanvasText') && denTpc('.den').some(([p, v]) => p === 'forced-color-adjust' && v === 'none')
       && ['.den.noi', '.den.loi'].every(sel => denTpc(sel).some(([p, v]) => p === 'background' && v === 'CanvasText'))
       && denTpc('.den.noi').some(([p, v]) => p === 'border-color' && v === 'CanvasText'), JSON.stringify({ noi: denTpc('.den.noi'), loi: denTpc('.den.loi') }));

  // --- Dòng đã sửa, chưa gửi: có vạch đen, không chỉ đổi nền ---------------------------------------------------------
  const coVach = k => /inset\s+[3-9]px\s+0\s+0\s+var\(--than\)/.test(k['box-shadow'] ?? '') || /^[3-9]px solid var\(--than\)$/.test(k['border-left'] ?? '');
  const doi = { '.ts.doi': kieu(cssGd, '.ts.doi'), 'tr.doi-phim td:first-child': kieu(cssGd, 'tr.doi-phim td:first-child'), '.o-tem.doi': kieu(cssGd, '.o-tem.doi') };
  const thieuVach = Object.entries(doi).filter(([, k]) => !coVach(k)).map(([bc, k]) => `${bc} ${JSON.stringify(k)}`);
  ok('giao-dien.html: dòng đã sửa chưa gửi (thông số, chữ cài đặt, phím, ô tem) có vạch đen 3–9px ở đầu dòng — không chỉ đổi nền',
     thieuVach.length === 0, thieuVach.join(' | '));
  // Vạch hiện ngay lúc gõ (JavaScript bật / tắt lớp theo từng phím): đệm trái của dòng đã sửa bớt đúng phần vạch dày thêm,
  // chữ và ô nhập không nhảy. Bảng gộp viền (border-collapse) thì nửa vạch nằm trong ô.
  const deTrai = k => {
    const pad = k['padding-left'] ?? (() => { const t = (k.padding ?? '0').split(/\s+/); return t[t.length === 4 ? 3 : t.length === 1 ? 0 : 1]; })();
    const v = vienCua(k);
    return { pad: parseFloat(pad) || 0, vien: v.kieu === 'none' ? 0 : parseFloat(v.rong) || 0 };
  };
  const leChu = (k, gopVien) => { const d = deTrai(k); return d.pad + (gopVien ? d.vien / 2 : d.vien); };
  const nhay = [
    ['.ts.doi', kieu(cssGd, '.ts'), { ...kieu(cssGd, '.ts'), ...kieu(cssGd, '.ts.doi') }, false],
    ['.o-tem.doi', kieu(cssGd, '.o-tem'), { ...kieu(cssGd, '.o-tem'), ...kieu(cssGd, '.o-tem.doi') }, false],
    ['tr.doi-phim td:first-child', kieu(cssGd, 'td'), { ...kieu(cssGd, 'td'), ...kieu(cssGd, 'tr.doi-phim td'), ...kieu(cssGd, 'tr.doi-phim td:first-child') },
      chuan(kieu(cssGd, 'table')['border-collapse']) === 'collapse'],
  ].filter(([, goc, doi, gop]) => leChu(goc, gop) !== leChu(doi, gop)).map(([bc, goc, doi, gop]) => `${bc}: chữ cách mép ${leChu(goc, gop)}px → ${leChu(doi, gop)}px`);
  ok('giao-dien.html: dòng đã sửa (thông số, ô tem, phím) giữ chữ đúng chỗ khi vạch hiện — đệm trái bớt đúng phần vạch', nhay.length === 0, nhay.join(' · '));
  ok('giao-dien.html: ô tem đang chọn (.o-tem.chon: viền đỏ quanh ô) khác ô đã sửa (vạch đen đầu dòng) ở hình, không chỉ ở màu',
     /0 0 0 1px var\(--do\)/.test(kieu(cssGd, '.o-tem.chon')['box-shadow'] ?? '') && coVach(doi['.o-tem.doi']));
  const giay = { chon: kieu(cssGd, '.giay .el.chon').outline, moi: kieu(cssGd, '.giay .el.moi').outline, ngoai: kieu(cssGd, '.giay .el.ngoai').outline, trong: kieu(cssGd, '.giay .el.trong').outline };
  const netGiay = Object.values(giay).map(o => (o ?? '').replace(/var\([^)]*\)/, '').trim());
  ok('giao-dien.html: ô trên tem xem trước (đang chọn, mới thêm, ra ngoài tem, ô trống) khác nhau ở nét (rộng, liền / đứt / chấm), không chỉ ở màu',
     netGiay.every(Boolean) && new Set(netGiay).size === 4, JSON.stringify(giay));

  // --- Trang hướng dẫn: nhãn và hộp ----------------------------------------------------------------------------------
  const cssHd = CSS['huong-dan.html'];
  const NHAN_HD = { moi: 'nhap', da: 'song', chua: 'tat', sach: 'thong-tin', ql: 'thong-tin', nv: 'thong-tin' };
  const kieuHd = [...new Set(quyTacPhang(cssHd).flatMap(q => tachDanhSach(q.boChon)).flatMap(bc => [...bc.matchAll(/\.nhan\.([\w-]+)/g)].map(m => m[1])))];
  ok(`huong-dan.html: .nhan chỉ có ${Object.keys(NHAN_HD).join(', ')}`, kieuHd.length === 6 && Object.keys(NHAN_HD).every(k => kieuHd.includes(k)), kieuHd.join(', '));
  for (const [n, k] of Object.entries(NHAN_HD)) {
    const co = veNhan(cssHd, '.nhan', n), mong = K_VE[k];
    ok(`huong-dan.html: .nhan.${n} vẽ như .nhan-l.${k} (nền ${mong.nen}, chữ ${mong.chu}, nét ${mong.net}, dấu ${mong.dau ?? 'không'})`,
       co.nen === mong.nen && co.chu === mong.chu && co.net === mong.net && co.dau === mong.dau, JSON.stringify(co));
  }
  const hop = { cam: kieu(cssHd, '.hop.cam'), luuY: dauCua(kieu(cssHd, '.hop.luu-y::before')), chuaThu: kieu(cssHd, '.hop.chua-thu') };
  ok('huong-dan.html: hộp "Không bao giờ bấm" (.hop.cam) viền đỏ 2px, dòng có dấu ✕; hộp lưu ý vòng "!"; hộp "chưa thử" nét đứt --vien-o',
     /2px solid var\(--do\)/.test(hop.cam.border ?? '') && /«✕»/.test(dauCua(kieu(cssHd, '.hop.cam li::before')) ?? '') && hop.luuY === '«!» tròn viền solid đặc'
       && /^2px dashed var\(--vien-o\)$/.test(hop.chuaThu.border ?? '') && kieu(cssHd, '.hop').background === 'var(--kem)',
     JSON.stringify(hop));
});

// ===========================================================================
await nhom('4 · TƯƠNG PHẢN (WCAG 2.2) VÀ CHỮ TRÊN ĐẦU TRANG ĐEN', async () => {
  const m = k => BANG_MAU[k];
  const CAP = [
    ['chữ đen trên thẻ trắng', '--than', '--kem', 4.5], ['chữ đen trên nền trang F4', '--than', '--kem-sau', 4.5],
    ['chữ phụ #555 trên thẻ trắng', '--muc-nhat', '--kem', 4.5], ['chữ phụ #555 trên dòng đã sửa (F4)', '--muc-nhat', '--kem-sau', 4.5],
    ['chữ đen trên nhãn lưu ý (E2)', '--than', '--kem-dam', 4.5], ['chữ trắng trên nút, nhãn đỏ (K1)', '--kem', '--do', 4.5],
    ['chữ trắng trên nhãn đen (K3), đầu trang đen', '--kem', '--than', 4.5], ['số đỏ của ô "làm ngay" trên thẻ trắng', '--do', '--kem', 4.5],
    ['link, câu lỗi đỏ đậm trên thẻ trắng', '--do-dam', '--kem', 4.5], ['chữ phụ --da trên đầu trang đen', '--da', '--than', 4.5],
    ['viền ô nhập, nút phụ #767676 trên ô trắng', '--vien-o', '--kem', 3], ['viền ô nhập #767676 trên nền F4', '--vien-o', '--kem-sau', 3],
    ['viền nút #767676 trên đầu trang đen', '--vien-o', '--than', 3], ['mép nút đỏ "Có bản mới" trên đầu trang đen', '--do', '--than', 3],
    ['vạch đen của dòng đã sửa trên nền F4', '--than', '--kem-sau', 3], ['nét đứt (K6) #767676 trên thẻ trắng', '--vien-o', '--kem', 3],
  ];
  for (const [ten, a, b, can] of CAP) {
    const r = tuongPhan(m(a), m(b));
    ok(`Tương phản ${ten}: ${so(r)} : 1 (cần ≥ ${String(can).replace('.', ',')} : 1)`, r >= can);
  }
  // Đầu trang đen (giao-dien: header; hướng dẫn: header.dau, khối .phan): chữ chỉ trắng hay --da — đỏ (3,16), #555 (2,82)
  // trên nền đen không đọc được.
  const DAU = { 'giao-dien.html': /^header\b/, 'huong-dan.html': /^(?:header\.dau|\.phan)\b/ };
  for (const [f, re] of Object.entries(DAU)) {
    const sai = quyTacPhang(CSS[f]).filter(q => !q.trongIn).flatMap(q => tachDanhSach(q.boChon).filter(bc => re.test(bc))
      .flatMap(bc => khaiBaoCua(q.trong).filter(([p, v]) => p === 'color' && !['var(--kem)', 'var(--da)', 'inherit'].includes(chuan(v))).map(([, v]) => `${bc} { color: ${v} }`)));
    ok(`${f}: chữ trên nền đen chỉ trắng (--kem) hay chữ phụ --da`, sai.length === 0, sai.join(' | '));
  }
  ok('giao-dien.html: nút "Có bản mới" trên đầu trang đen là nút đỏ chữ trắng (như nút chính trên dải đen của trang công khai)',
     kieu(CSS['giao-dien.html'], 'header .nut-dau.ban-moi').background === 'var(--do)' && kieu(CSS['giao-dien.html'], 'header .nut-dau.ban-moi').color === 'var(--kem)');
  for (const f of TEN_TRANG) {
    const quyTac = quyTacPhang(CSS[f]).filter(q => !q.trongIn);
    const vongDau = quyTac.some(q => tachDanhSach(q.boChon).some(bc => /^:focus-visible$/.test(bc)) && /outline:\s*3px solid var\(--than\)/.test(q.trong));
    const vongTrang = quyTac.some(q => tachDanhSach(q.boChon).some(bc => /^header\S* :focus-visible$/.test(bc)) && /outline-color:\s*var\(--kem\)/.test(q.trong));
    ok(`${f}: vòng focus đen 3px trên nền sáng, trắng trên đầu trang đen`, vongDau && vongTrang);
  }
});

// ===========================================================================
await nhom('5 · LOGO VÀ BIỂU TƯỢNG BỘ 21/10/2026: KHÔNG GÕ CHỮ BEEFTOWN, ĐÓNG GÓI FILE CỦA web/public', async () => {
  const CHO_LOGO = '<span class="logo" role="img" aria-label="Beeftown"><!--logo-phu-trang--></span>';
  const markup = html => html.replace(/<style\b[\s\S]*?<\/style>/g, '').replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const f of TEN_TRANG) {
    const dau = TRANG[f].match(/<header\b[^>]*>[\s\S]*?<\/header>/)?.[0] ?? '';
    ok(`${f}: đầu trang không gõ chữ BEEFTOWN bằng phông — có đúng một chỗ cho logo phụ trắng (${CHO_LOGO.replace(/<!--.*-->/, '…')})`,
       !/>[^<]*\bBEEFTOWN\b/.test(markup(TRANG[f])) && dau.split(CHO_LOGO).length === 2 && TRANG[f].split('<!--logo-phu-trang-->').length === 2, dau.slice(0, 160));
    ok(`${f}: thẻ biểu tượng cửa sổ còn chỗ cho brandmark (href="data:,")`, TRANG[f].split('<link rel="icon" href="data:,">').length === 2);
  }
  ok('…phép quét chữ gõ bắt được <b>BEEFTOWN</b>, không bắt chữ trong chú thích hay alt',
     />[^<]*\bBEEFTOWN\b/.test(markup('<header><b>BEEFTOWN</b></header>')) && !/>[^<]*\bBEEFTOWN\b/.test(markup('<!-- <b>BEEFTOWN</b> --><img alt="BEEFTOWN">')));

  const mc = doc(join(SRC_CAN, 'may-chu.ts'));
  const nhapLogo = mc.match(/import (\w+) from '\.\.\/\.\.\/web\/public\/thuong-hieu\/chu-beeftown-trang\.svg' with \{ type: 'text' \};/)?.[1];
  const nhapBieuTuong = mc.match(/import (\w+) from '\.\.\/\.\.\/web\/public\/bieu-tuong\.svg' with \{ type: 'text' \};/)?.[1];
  ok('may-chu.ts: nhập logo phụ trắng (web/public/thuong-hieu/chu-beeftown-trang.svg) và biểu tượng cửa sổ (web/public/bieu-tuong.svg) thành chuỗi — đóng gói vào .exe, máy quầy không mạng',
     !!nhapLogo && !!nhapBieuTuong);
  ok('may-chu.ts: cả hai trang đi qua ganNhanDien trước khi phục vụ (GET / và GET /huong-dan)',
     /const GIAO_DIEN = ganNhanDien\(GIAO_DIEN_FILE as unknown as string,/.test(mc) && /const HUONG_DAN = ganNhanDien\(HUONG_DAN_FILE as unknown as string,/.test(mc)
       && mc.includes("if (req.method === 'GET' && p === '/') return html(GIAO_DIEN);") && mc.includes("if (req.method === 'GET' && p === '/huong-dan') return html(HUONG_DAN);"));

  let nd = null;
  try { nd = await import(pathToFileURL(join(SRC_CAN, 'nhan-dien.ts')).href); } catch (e) { nd = { loi: e.message }; }
  ok('src/nhan-dien.ts có ganNhanDien (hàm thuần, không phụ thuộc Bun)', typeof nd?.ganNhanDien === 'function', nd?.loi ?? '');
  if (typeof nd?.ganNhanDien !== 'function') return;
  const svgLogo = doc(join(GOC, 'web', 'public', 'thuong-hieu', 'chu-beeftown-trang.svg'));
  const svgBieuTuong = doc(join(GOC, 'web', 'public', 'bieu-tuong.svg'));
  const duongCua = s => [...s.matchAll(/\sd="([^"]+)"/g)].map(m => m[1]);
  for (const f of TEN_TRANG) {
    const ra = nd.ganNhanDien(TRANG[f], svgLogo, svgBieuTuong);
    const dau = ra.match(/<header\b[^>]*>[\s\S]*?<\/header>/)?.[0] ?? '';
    const svg = dau.match(/<svg\b[\s\S]*?<\/svg>/)?.[0] ?? '';
    const to = [...svg.matchAll(/\bfill="([^"]+)"/g)].map(m => m[1].toUpperCase());
    ok(`${f} sau ganNhanDien: đầu trang có logo phụ — đúng path của chu-beeftown-trang.svg (${duongCua(svgLogo).length} path), chỉ tô #FFFFFF, viewBox 430 × 61`,
       !ra.includes('<!--logo-phu-trang-->') && /viewBox="0 0 430 61"/.test(svg) && to.length >= 1 && to.every(t => t === '#FFFFFF')
         && JSON.stringify(duongCua(svg)) === JSON.stringify(duongCua(svgLogo)) && duongCua(svgLogo).length >= 5, `${to.join(',')} · ${svg.slice(0, 120)}`);
    const href = ra.match(/<link rel="icon" href="data:image\/svg\+xml,([^"]+)">/)?.[1];
    let bieuTuong = '';
    try { bieuTuong = decodeURIComponent(href ?? ''); } catch { bieuTuong = ''; }
    ok(`${f} sau ganNhanDien: biểu tượng cửa sổ là brandmark của web/public/bieu-tuong.svg (đỏ #BD0000), không còn href="data:,"`,
       !ra.includes('href="data:,"') && /fill="#BD0000"/.test(bieuTuong) && JSON.stringify(duongCua(bieuTuong)) === JSON.stringify(duongCua(svgBieuTuong)), (href ?? '').slice(0, 80));
    ok(`${f} sau ganNhanDien: không mang theo chú thích của file SVG; phần còn lại của trang giữ nguyên`,
       !/<!--[^>]*BEEFTOWN_Brand_Guidelines/.test(ra)
         && ra.replace(/<svg\b[\s\S]*?<\/svg>/, '').replace(/<link rel="icon" href="[^"]*">/, '') === TRANG[f].replace(CHO_LOGO, CHO_LOGO.replace('<!--logo-phu-trang-->', '')).replace(/<link rel="icon" href="[^"]*">/, ''));
  }
  ok('giao-dien.html: logo phụ trên đầu trang rộng 148px (cỡ tối thiểu của logo phụ trên đầu trang, THUONG-HIEU.md mục 2)',
     kieu(CSS['giao-dien.html'], 'header .logo svg').width === '148px');
  ok('huong-dan.html: logo phụ trên đầu trang rộng 148px', kieu(CSS['huong-dan.html'], 'header.dau .logo svg').width === '148px');
  for (const f of TEN_TRANG) {
    const logoTpc = quyTacPhang(CSS[f]).filter(q => q.tuongPhanCao && tachDanhSach(q.boChon).some(bc => /^header\S* \.logo svg path$/.test(bc))).flatMap(q => khaiBaoCua(q.trong));
    ok(`${f}: tương phản cao (Windows) — logo tô theo màu chữ (fill: CanvasText): nền đầu trang bị ép thành màu trang, logo trắng không mất`,
       logoTpc.some(([p, v]) => p === 'fill' && v === 'CanvasText'), JSON.stringify(logoTpc));
  }
  // .exe nhúng file ngoài can-app/ (mã dùng chung của web/src/lib, logo và biểu tượng của web/public): PR đụng chúng phải
  // được đóng gói thử, main nhận chúng phải ra bản — paths của push và pull_request trong dong-goi-can.yml phủ mọi file đó.
  const nhungNgoai = new Set();
  const tham = new Set();
  const di = tep => {
    if (tham.has(tep)) return;
    tham.add(tep);
    if (!/\.(?:ts|mjs|js)$/.test(tep) || !existsSync(tep)) return;
    for (const m of doc(tep).matchAll(/(?:^|\n)\s*(?:import|export)\b[^'"\n]*?from\s*'(\.{1,2}\/[^']+)'/g)) {
      const dich = join(dirname(tep), m[1]);
      const tuGoc = dich.slice(GOC.length + 1).split('\\').join('/');
      if (!tuGoc.startsWith('can-app/')) nhungNgoai.add(tuGoc);
      di(dich);
    }
  };
  for (const f of readdirSync(SRC_CAN).filter(f => f.endsWith('.ts'))) di(join(SRC_CAN, f));
  const yml = doc(join(GOC, '.github', 'workflows', 'dong-goi-can.yml'));
  const dsPaths = khoa => (yml.match(new RegExp(`\\n  ${khoa}:\\n(?:    [^\\n]*\\n)*?    paths:[^\\n]*\\n((?:      - [^\\n]+\\n)+)`))?.[1] ?? '')
    .split('\n').map(d => d.match(/- '([^']+)'/)?.[1]).filter(Boolean);
  const phu = (mau, tep) => new RegExp('^' + mau.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').split('\u0000').join('.*') + '$').test(tep);
  const pushP = dsPaths('push'), prP = dsPaths('pull_request');
  const thieu = [...nhungNgoai].filter(t => !pushP.some(m => phu(m, t)) || !prP.some(m => phu(m, t)));
  ok(`dong-goi-can.yml: paths của push và pull_request phủ mọi file ngoài can-app/ mà .exe nhúng (${nhungNgoai.size} file, cả nhập lồng: logo, biểu tượng, mã dùng chung)`,
     nhungNgoai.size >= 10 && [...nhungNgoai].includes('web/public/thuong-hieu/chu-beeftown-trang.svg') && [...nhungNgoai].includes('web/public/bieu-tuong.svg')
       && pushP.length >= 3 && prP.length >= 3 && thieu.length === 0, `thiếu: ${thieu.join(', ')} · push ${pushP.length} · PR ${prP.length}`);
  ok('…phép so đường dẫn: \'web/src/lib/**\' phủ web/src/lib/kho/can-tma.ts; \'web/public/bieu-tuong.svg\' không phủ web/public/thuong-hieu/x.svg',
     phu('web/src/lib/**', 'web/src/lib/kho/can-tma.ts') && phu('web/public/bieu-tuong.svg', 'web/public/bieu-tuong.svg') && !phu('web/public/bieu-tuong.svg', 'web/public/thuong-hieu/x.svg')
       && !phu('web/src/lib/*', 'web/src/lib/kho/can-tma.ts'));
  const inLogo = quyTacPhang(CSS['huong-dan.html']).filter(q => q.trongIn && /\.logo svg/.test(q.boChon)).flatMap(q => khaiBaoCua(q.trong));
  ok('huong-dan.html: bản in đổi logo trắng thành đen (filter: brightness(0)) — đầu trang in trên giấy trắng, đầu bò khoét lộ giấy như logo đen của guideline',
     inLogo.some(([p, v]) => p === 'filter' && /^brightness\(0\)$/.test(v.trim())), JSON.stringify(inLogo));
});

// ===========================================================================
const MAU_DA_BO = /(?<![\p{L}])(xanh|vàng|green|yellow)(?![\p{L}])/iu;
/** Chữ có thể hiện ra của một file mã .ts: bỏ chú thích khối và dòng. */
const chuCuaTs = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/[^\n]*$/gm, '$1');
const doanQuanh = (s, re) => { const m = s.match(re); return m ? s.slice(Math.max(0, m.index - 40), m.index + 30).replace(/\s+/g, ' ') : ''; };

await nhom('6 · CÂU CHỮ KHÔNG GỌI TRẠNG THÁI BẰNG XANH / VÀNG, KHÔNG TẢ HÌNH CŨ (hai trang, câu báo của src/*.ts)', async () => {
  for (const f of TEN_TRANG) {
    const chu = chuCuaTrang(TRANG[f]);
    ok(`${f}: không câu nào gọi trạng thái bằng xanh / vàng ("khung xanh", "nút vàng", "chấm xanh"…) — nói bằng chữ của nhãn, dấu ✓ / "!"`,
       !MAU_DA_BO.test(chu), doanQuanh(chu, MAU_DA_BO));
  }
  // Đèn ô Cân lỗi là tam giác đỏ, câu lỗi là khung viền đỏ có tam giác "!" — "chấm đỏ", "dòng đỏ", "Ô Cân đỏ" tả hình đã bỏ.
  const GOI_DO_CU = /(?<![\p{L}])(?:chấm|dòng|đèn|ô Cân)\s+đỏ(?![\p{L}])/iu;
  for (const f of TEN_TRANG) {
    const chu = chuCuaTrang(TRANG[f]);
    ok(`${f}: không tả đèn, câu lỗi bằng hình cũ ("chấm đỏ", "dòng đỏ", "Ô Cân đỏ") — tam giác đỏ, khung viền đỏ`, !GOI_DO_CU.test(chu), doanQuanh(chu, GOI_DO_CU));
  }
  ok('…mẫu tự kiểm: bắt "Chấm đỏ ở ô Cân", "hiện dòng đỏ", "Ô Cân đỏ mãi"; không bắt "tam giác đỏ", "khung viền đỏ", "nút đỏ", "Ô Cân có tam giác đỏ"',
     ['Chấm đỏ ở ô Cân', 'hiện dòng đỏ;', 'Ô Cân đỏ mãi dù cân bật'].every(m => GOI_DO_CU.test(m))
       && ['tam giác đỏ', 'khung viền đỏ', 'hiện nút đỏ', 'Ô Cân có tam giác đỏ mãi'].every(m => !GOI_DO_CU.test(m)));
  const tepTs = readdirSync(SRC_CAN).filter(f => f.endsWith('.ts'));
  const sai = tepTs.filter(f => MAU_DA_BO.test(chuCuaTs(doc(join(SRC_CAN, f))))).map(f => `${f}: «${doanQuanh(chuCuaTs(doc(join(SRC_CAN, f))), MAU_DA_BO)}»`);
  ok(`${tepTs.length} file .ts của can-app/src: không câu nào (ngoài chú thích) gọi trạng thái bằng xanh / vàng`, tepTs.length >= 10 && sai.length === 0, sai.join(' | '));
  const BAT = ['<li>Khung xanh <b>"Cân đã nhận."</b></li>', "bao(noi, 'xong', 'Dòng vàng là thiếu mã')", '<p>Chấm <b>xanh</b> = nối được</p>', "const c = 'Bấm nút Vàng';"];
  const KHONG_BAT = ['<!-- nút vàng của 2.11 -->', '/* khung xanh cũ */', '  // đèn vàng của /noi-bo', 'Khung có dấu ✓ "Cân đã nhận."', "class=\"nhan-l song\""];
  ok('…phép quét bắt được câu gọi màu trong markup và chuỗi JavaScript, không bắt chú thích (HTML, khối, dòng) hay chữ của nhãn mới',
     BAT.every(m => MAU_DA_BO.test(chuCuaTrang(m))) && KHONG_BAT.every(m => !MAU_DA_BO.test(chuCuaTrang(m))));
});

// ===========================================================================
await nhom('7 · PHIÊN BẢN MỚI: PHIEN_BAN 2.12.0, README CÓ MỤC "Bản 2.12"', async () => {
  const mn = doc(join(SRC_CAN, 'main.ts'));
  const pb = mn.match(/const PHIEN_BAN = '(\d+\.\d+\.\d+)';/)?.[1];
  ok('main.ts: PHIEN_BAN = 2.12.0 — máy quầy chỉ thấy bản mới (nút Cập nhật) khi số tăng', pb === '2.12.0', pb ?? 'không đọc được');
  const rd = doc(join(CAN, 'README.md'));
  const i212 = rd.indexOf('\n## Bản 2.12 '), i211 = rd.indexOf('\n## Bản 2.11 ');
  const muc = i212 > 0 && i211 > i212 ? rd.slice(i212, i211) : '';
  ok('README: mục "Bản 2.12" đứng ngay trên mục 2.11, nói bộ nhận diện 21/10/2026, có "Thử ở quán (2.12)"',
     !!muc && /nhận diện/.test(muc) && muc.includes('Thử ở quán (2.12)') && rd.lastIndexOf('\n## ', i211 - 1) === i212, muc.slice(0, 120));
  // Mục 2.12 được nhắc màu đã bỏ ("Khánh bỏ xanh, vàng…", "chỗ nào còn màu cũ"), nhưng không gọi khung, nút, chấm… bằng màu.
  const GOI_BANG_MAU = /(?<![\p{L}])(?:khung|nút|chấm|đèn|dòng|nhãn|ô)\s+(?:xanh|vàng)(?![\p{L}])/iu;
  ok('README mục 2.12: nói trạng thái bằng dấu (✓, "!") và đổi logo; không gọi khung, nút, chấm bằng xanh / vàng',
     /dấu ✓/.test(muc) && /logo/i.test(muc) && !GOI_BANG_MAU.test(muc), doanQuanh(muc, GOI_BANG_MAU));
  ok('…mẫu tự kiểm: bắt "khung xanh", "Nút vàng", "chấm xanh"; không bắt "Khánh bỏ xanh, vàng", "màu cũ (vàng, xanh lá)"',
     ['khung xanh "Cân đã nhận"', 'Nút vàng ở đầu trang', 'chấm xanh = nối được'].every(m => GOI_BANG_MAU.test(m))
       && ['Khánh bỏ xanh, vàng, đỏ nhạt', 'Chỗ nào còn màu cũ (vàng, xanh lá, nền kem)'].every(m => !GOI_BANG_MAU.test(m)));
});

// ===========================================================================
await nhom('8 · TÀI LIỆU KHÔNG CÒN NÓI BEEFTOWN CÂN "CHƯA ĐỔI" / "CÒN BẢNG CŨ"', async () => {
  // Hai cách viết: "Beeftown Cân … chưa đổi / còn bảng … cũ" và danh sách "Còn màu cũ: Beeftown Cân …".
  const CU = /Beeftown Cân[^.\n|]{0,40}(?:chưa đổi|còn (?:bảng|màu|nhận diện|thẻ)[^.\n|]{0,40}cũ)|Màu của Beeftown Cân còn nhận diện cũ|còn (?:mang )?(?:màu|nhận diện) cũ[:*\s]{0,6}\(?Beeftown Cân/i;
  const TAI_LIEU = ['AGENTS.md', 'CLAUDE.md', 'README.md', 'can-app/CLAUDE.md', 'web/THIET-KE.md', '.claude/skills/thiet-ke-beeftown/SKILL.md',
    '.claude/skills/thiet-ke-beeftown/tham-khao/noi-bo-va-kho.md', 'crm/test/test-noi-bo-bang-mau.mjs', 'crm/test/test-cong-khai-nhan-dien.mjs'];
  const sai = TAI_LIEU.filter(f => existsSync(join(GOC, f)) && CU.test(doc(join(GOC, f)))).map(f => `${f}: «${doanQuanh(doc(join(GOC, f)), CU)}»`);
  ok(`${TAI_LIEU.length} tài liệu (AGENTS.md, CLAUDE.md, README.md, can-app/CLAUDE.md, web/THIET-KE.md, skill thiết kế, chú thích kiểm thử) không còn nói Beeftown Cân chưa đổi / còn bảng cũ`,
     sai.length === 0, sai.join(' | '));
  const th = doc(join(GOC, 'THUONG-HIEU.md'));
  const viec7 = th.split('\n').find(d => /^\| 7 \| Beeftown Cân/.test(d)) ?? '';
  ok('THUONG-HIEU.md: việc 7 (Beeftown Cân) ghi đã làm ở bản 2.12; đầu file không còn "Beeftown Cân chưa đổi"',
     /2\.12/.test(viec7) && !/\*\*Beeftown Cân chưa đổi\*\*/.test(th.slice(0, 1500)), viec7.slice(0, 200));
  ok('…mẫu tự kiểm: bắt "Beeftown Cân chưa đổi", "Beeftown Cân còn bảng cũ", "Còn màu cũ: Beeftown Cân", "còn mang nhận diện cũ (Beeftown Cân"; không bắt "Beeftown Cân đổi ở bản 2.12", "Còn màu cũ: 15 ảnh"',
     CU.test('**Beeftown Cân chưa đổi** (việc 7)') && CU.test('Beeftown Cân còn bảng cũ (mục 5).') && CU.test('Màu của Beeftown Cân còn nhận diện cũ: chỉ đổi')
       && CU.test('- **Còn màu cũ:** Beeftown Cân (`can-app/src/giao-dien.html`') && CU.test('thứ còn mang nhận diện cũ (Beeftown Cân, ảnh hướng dẫn kho')
       && CU.test('Còn màu cũ: Beeftown Cân (PR riêng') && !CU.test('Beeftown Cân đổi ở bản 2.12 (PR riêng).') && !CU.test('Còn màu cũ: 15 ảnh chụp trong trang hướng dẫn'));
});

process.exit(ketThuc('BEEFTOWN CÂN — BỘ NHẬN DIỆN'));
