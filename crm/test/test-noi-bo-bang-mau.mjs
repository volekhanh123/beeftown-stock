/**
 * BEEFTOWN — BẢNG MÀU CỦA /noi-bo VÀ KHO
 * ======================================
 *
 *     node test/test-noi-bo-bang-mau.mjs
 *
 * Ngày 22/10/2026 Khánh chốt bảng màu thương hiệu mới (THUONG-HIEU.md mục 0): đỏ #BD0000, đen, trắng; ngày
 * 25/10/2026 duyệt các màu pha chỉ dùng trên màn hình (đỏ đậm #8F0000, xám #767676, #555555, #F4F4F4, #E2E2E2)
 * và bỏ màu trạng thái xanh / vàng / đỏ nhạt ở /noi-bo và kho. Trang công khai: test-cong-khai-giao-dien.mjs
 * nhóm 6. File này gác hai nơi nhân viên dùng trên web: /noi-bo và kho. Beeftown Cân (chương trình Windows)
 * có kiểm thử màu riêng, cùng PR đổi màu của nó. Bất biến:
 *
 *   1. MỘT BẢNG MÀU. Hai khối :root của web/src/styles/chung.css khai đúng 12 mã của bảng 22/10/2026, mỗi
 *      biến một lần, không thêm biến màu nào khác; khối .ck đầu tiên của cong-khai.css (trang công khai) cùng
 *      giá trị — hai nơi chưa gộp, nên đổi một mã mà quên nơi kia là đỏ.
 *   2. HAI BỀ MẶT, KHÔNG MÀU TRẠNG THÁI. .nb-than của noi-bo.css khai hai bề mặt: nền trang --nb-nen (xám
 *      nhạt F4), thẻ và mọi thứ nổi lên --nb-the (trắng); .nb-than không khai mã màu nào. Tám biến trạng thái
 *      cũ (--xanh*, --vang*, --do-nen, --do-vien) và hai biến vàng không còn khai, không còn được dùng. Token
 *      của kho (.kho-than) chỉ trỏ về biến của bảng. Mọi biến var(--…) dùng trong file nội bộ đều có khai —
 *      không còn biến mồ côi kèm mã dự phòng.
 *   3. KHÔNG MÃ CŨ. Không file nội bộ nào (CSS, trang, component, layout, web/src/lib, manifest của kho) còn
 *      mã hex hay bộ ba số RGB của các bảng cũ — kể cả bảng 09/10/2026 và tám màu trạng thái — kể cả trong
 *      chú thích. Màu viết cứng còn lại chỉ là mã 6 chữ số của bảng 22/10/2026; viết tắt #FFF / #000, tên màu
 *      CSS, màu hệ thống chỉ trong @media print (giấy) hay chế độ tương phản cao.
 *   4. Ô CỦA TRÌNH DUYỆT DÙNG TOKEN (không để trình duyệt tự vẽ): ô nhập không lớp riêng, ô tự điền, ô đánh dấu,
 *      ô chọn một, nút chọn tệp, hộp thoại đều có nền trắng --kem, viền --vien-o; ô đánh dấu và ô chọn một tự
 *      vẽ, chế độ tương phản cao trả về ô của hệ thống; thanh tiến độ rãnh E2, phần xong đen.
 *   5. TƯƠNG PHẢN (WCAG 2.2, tính ở đây chứ không ước lượng): chữ thường ≥ 4,5 : 1; viền ô nhập và biểu
 *      tượng mang nghĩa ≥ 3 : 1. Xám E2 (--da) chỉ làm chữ trên nền đen; #555 không bao giờ trên nền đen;
 *      chữ đỏ không đặt trên nền đen. Vòng focus: đen trên nền sáng, trắng trên đầu trang đen.
 *   6. Thẻ theme-color, manifest của kho, trang báo quá tải dùng mã của bảng mới.
 *   7. TRẠNG THÁI KHÔNG CHỈ KHÁC BẰNG MÀU (QĐ2, kế hoạch mục 2a luật 1): hai trạng thái của cùng một họ lớp
 *      khác nhau ở ít nhất một kênh không phải màu — dấu (::before / ::after có content), nét viền (rộng /
 *      kiểu), hình (clip-path / transform / border-radius), nền đặc / rỗng, hoặc đảo chữ (chữ trắng trên nền
 *      tối ↔ chữ đen trên nền sáng, chênh ≥ 7 : 1). Có mẫu tự kiểm.
 *
 * Mã chép tay ở đây, KHÔNG đọc từ file CSS: sửa nhầm một mã trong mã nguồn thì phép thử này đỏ.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { taoMauLaTrong } from './mau-css.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const SRC = join(WEB, 'src');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — BẢNG MÀU CỦA /noi-bo VÀ KHO');

// ---------------------------------------------------------------------------
// Bảng màu — chép tay từ THUONG-HIEU.md (mục 1 và mục 4): bảng 22/10/2026 cùng màu pha màn hình 25/10/2026.
// Tên biến giữ (--kem là trắng, --than là đen); đổi tên là PR sau.
// ---------------------------------------------------------------------------
const BANG_MAU = {
  '--do': '#BD0000', '--kem': '#FFFFFF', '--than': '#000000',   // ba màu thương hiệu: đỏ, trắng, đen
  '--da': '#E2E2E2',                                       // CHỈ chữ phụ trên nền đen
  '--do-dam': '#8F0000', '--do-sau': '#8F0000',            // một đỏ đậm cho màn hình: hai tên, một mã
  '--kem-sau': '#F4F4F4', '--kem-dam': '#E2E2E2', '--vien-o': '#767676',
  '--muc-nhat': '#555555', '--vach': '#E2E2E2', '--vach-kem': 'rgba(255, 255, 255, .22)',
};
// Hai bề mặt của công cụ, khai ở .nb-than: nền trang và thẻ (cùng mọi thứ nổi lên: thanh điều hướng, thanh đáy,
// menu thả, ô nhập). Thẻ trắng trên nền xám nhạt F4.
const BE_MAT = { '--nb-nen': 'var(--kem-sau)', '--nb-the': 'var(--kem)' };
const NEN = BANG_MAU['--kem-sau'], THE = BANG_MAU['--kem'];
// Biến đã bỏ: tám màu trạng thái (25/10/2026, câu 2 — trạng thái phân biệt bằng chữ, dấu, nét) và hai biến vàng
// của bảng 09/10/2026. Không được khai lại, không được dùng ở đâu trong web/src — một ok mỗi biến.
const BIEN_BO = ['--xanh', '--xanh-nen', '--xanh-vien', '--vang-chu', '--vang-nen', '--vang-vien', '--do-nen', '--do-vien', '--mu-tat', '--cuc-vang'];
// Kho: token chỉ trỏ về biến — nền và thẻ của .nb-than, vạch của bảng, vạch đậm là xám viền ô #767676.
const KHO = { '--kho-nen': 'var(--nb-nen)', '--kho-the': 'var(--nb-the)', '--kho-vach': 'var(--vach)', '--kho-vach-dam': 'var(--vien-o)' };

// Mã của các bảng trước — hex (bảng cũ của web, màu trạng thái cũ, token cũ của kho và của Beeftown Cân, mã dự
// phòng lạc trong vài trang, bảng 09/10/2026 và tám màu trạng thái bỏ ngày 25/10/2026) và bộ ba số RGB trong
// rgb() / rgba(), nối bằng dấu phẩy hay dấu cách (rgb(21 16 8 / .16) cũng là màu cũ).
const HEX_CU = [
  'B23A2C', '8F2C21', '960F13', 'FBF4E1', 'F5ECD7', 'F1E4C2', '1E160E', 'F2A900', 'F5C211', '8C8577', 'A21E22', '2A2016',   // bảng cũ
  'FFFCF6', 'EFE4D2', 'E0D2BB',                                                                                              // token cũ của kho
  '1F7A4C', 'E9F5EE', 'CDE7D8', 'FFF5DC', 'F3DDA5', 'FFFCF2', 'FFFBF1', 'FDECEA', 'F2C9C3', 'FFF8F7',                         // màu trạng thái cũ
  '8A5A00', 'B07A00', '8A6D00', '9A6B00', '7A5A00', '6B4A00',                                                                // năm sáu sắc "vàng đậm" cũ
  '8E2B20', 'F3E8CC', 'E4D8BC', '6A5D45', '7A6C52', '8A7C62', '3A2D20', 'F3C8C2',                                            // Beeftown Cân
  'B3261E', '2B1D14', 'FBF6EE', 'F3EEE6', 'FFF7E0',                                                                          // mã dự phòng lạc
  'A70C0C', '890607', 'F0E3D0', 'EBDCC6', 'E7D5BC', '151008', 'F5AA14', 'B8A98C', '7A7366', '211A10', 'FFFDF6',             // bảng 09/10/2026
  '1A683F', 'D3E3C6', 'A3C597', '7A5200', 'F6DC9E', 'DDB65C', 'F2D6CE', 'DDA79C',                                            // trạng thái tới 25/10/2026
];
const BO_BA_CU = ['30,22,14', '251,244,225', '178,58,44', '150,15,19', '143,44,33', '20,14,8', '242,169,0',
  '21,16,8', '240,227,208', '167,12,12', '137,6,7', '245,170,20', '184,169,140'];                                           // bảng 09/10/2026
const MA_CU = new RegExp(
  `#(?:${HEX_CU.join('|')})\\b|rgba?\\(\\s*(?:${BO_BA_CU.map(b => b.split(',').join('(?:\\s*,\\s*|\\s+)')).join('|')})\\b`, 'gi');

// ---------------------------------------------------------------------------
// Tiện ích
// ---------------------------------------------------------------------------
function moiFile(thuMuc) {
  if (!existsSync(thuMuc)) return [];
  return readdirSync(thuMuc, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? moiFile(join(thuMuc, d.name)) : [join(thuMuc, d.name)]);
}
const tuGoc = p => relative(GOC, p).split(sep).join('/');
const doc = p => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const boChuThich = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
const chuanHoa = v => v.trim().replace(/\s+/g, '').toLowerCase();
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
/** Mọi quy tắc thường (đi vào trong @media, @container, @supports), kèm cờ "nằm trong @media print" và
    "nằm trong @media (forced-colors: active)" (chế độ tương phản cao — ở đó màu hệ thống là đúng). */
function quyTacPhang(css, trongIn = false, tuongPhanCao = false) {
  return docQuyTac(css).flatMap(q => {
    if (/^@(media|container|supports)\b/.test(q.boChon)) {
      return quyTacPhang(q.trong, trongIn || /^@media[^{]*\bprint\b/.test(q.boChon), tuongPhanCao || /forced-colors:\s*active/.test(q.boChon));
    }
    if (q.boChon.startsWith('@')) return [];
    return [{ boChon: q.boChon.replace(/\s+/g, ' '), trong: q.trong, trongIn, tuongPhanCao }];
  });
}
/** Phần CSS của một file: cả file .css; với .astro / .html / .ts là các khối <style> cộng mọi thuộc tính style. */
function cssCua(tep) {
  const s = doc(tep);
  if (tep.endsWith('.css')) return { khoi: boChuThich(s), noiTuyen: '' };
  const khoi = [...s.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  return { khoi: boChuThich(khoi), noiTuyen: thuocTinhStyle(s) };
}
/** Mọi giá trị của thuộc tính style trong một trang: style="…", và style={…} — với biểu thức thì lấy MỌI chuỗi
    bên trong (cả hai nhánh của x ? '…' : '…', chuỗi trong "…", `…`). Ngoặc {…} đếm lồng nhau: ${…} trong `…`
    không làm cắt biểu thức giữa chừng. */
function thuocTinhStyle(s) {
  const ra = [...s.matchAll(/\bstyle="([^"]*)"/g)].map(m => m[1]);
  for (const m of s.matchAll(/\bstyle=\{/g)) {
    let i = m.index + m[0].length, muc = 1;
    for (; i < s.length && muc > 0; i++) {
      if (s[i] === '{') muc++;
      else if (s[i] === '}') muc--;
    }
    const bieuThuc = s.slice(m.index + m[0].length, i - 1);
    for (const c of bieuThuc.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)) ra.push(c[1] ?? c[2] ?? c[3]);
  }
  return ra.join(';\n');
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
/** Màu có độ trong (rgba … alpha) đặt trên một nền đặc → màu đặc mắt thấy. */
function phaTren(chu, nen, alpha) {
  const kenh = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [c, n] = [kenh(chu), kenh(nen)];
  return '#' + c.map((v, i) => Math.round(v * alpha + n[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}
const kiemCap = (cap) => {
  for (const [ten, chu, nen, can] of cap) {
    const r = tuongPhan(chu, nen);
    ok(`Tương phản ${ten}: ${so(r)} : 1 (cần ≥ ${String(can).replace('.', ',')} : 1)`, r >= can);
  }
};

// ---------------------------------------------------------------------------
// Danh sách file nội bộ
// ---------------------------------------------------------------------------
const CSS_NOI_BO = ['chung.css', 'noi-bo.css', 'kho.css', 'kho-khung.css'].map(f => join(SRC, 'styles', f));
const ASTRO_NOI_BO = [
  ...moiFile(join(SRC, 'pages', 'noi-bo')), ...moiFile(join(SRC, 'components', 'kho')),
  ...['SucKhoeHeThong.astro', 'BanDoChucNang.astro', 'OTimChucNang.astro'].map(f => join(SRC, 'components', f)),
  join(SRC, 'layouts', 'NoiBo.astro'), join(SRC, 'layouts', 'Kho.astro'),
].filter(f => f.endsWith('.astro'));
const QUA_TAI = join(SRC, 'lib', 'qua-tai.ts');
const GIAO_DIEN_NOI_BO = [...CSS_NOI_BO, ...ASTRO_NOI_BO];
const MANIFEST = join(WEB, 'public', 'kho', 'manifest.json');

// ===========================================================================
await nhom('1 · MỘT BẢNG MÀU: :root CỦA chung.css ĐÚNG BẢNG 22/10/2026, CÙNG GIÁ TRỊ VỚI KHỐI .ck', async () => {
  const chung = boChuThich(doc(join(SRC, 'styles', 'chung.css')));
  // Chỉ khối `:root { … }` trơn — `:root:lang(ko)` đặt phông, không khai màu.
  const khoiRoot = [...chung.matchAll(/(?<=^|\})\s*:root\s*\{([^{}]*)\}/g)].map(m => m[1]).join('\n');
  const khai = khoi => new Map([...khoi.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  const root = khai(khoiRoot);
  ok('chung.css có hai khối :root trơn', [...chung.matchAll(/(?<=^|\})\s*:root\s*\{/g)].length === 2);
  for (const [bien, giaTri] of Object.entries(BANG_MAU)) {
    const soLanKhai = (chung.match(new RegExp(`(?:^|[;{\\s])${bien}\\s*:`, 'g')) ?? []).length;
    ok(`chung.css :root: ${bien} là ${giaTri}, khai đúng một lần`,
       root.has(bien) && chuanHoa(root.get(bien)) === chuanHoa(giaTri) && soLanKhai === 1,
       root.has(bien) ? `${root.get(bien)} · khai ${soLanKhai} lần` : 'không thấy trong các khối :root');
  }
  const laMau = v => /^#[0-9a-f]{3,8}$/i.test(v) || /^rgba?\(/i.test(v);
  const thua = [...root].filter(([b, v]) => laMau(v) && !(b in BANG_MAU)).map(([b, v]) => `${b}: ${v}`);
  ok(`:root không khai biến màu nào ngoài ${Object.keys(BANG_MAU).length} biến của bảng (thêm màu thì thêm vào THUONG-HIEU.md và bảng chép tay ở đầu file này)`,
     thua.length === 0, thua.join(' · '));

  const ck = boChuThich(doc(join(SRC, 'styles', 'cong-khai.css')));
  const khoiCk = khai(docQuyTac(ck).find(q => q.boChon === '.ck')?.trong ?? '');
  const lech = Object.keys(BANG_MAU).filter(b => !khoiCk.has(b) || chuanHoa(khoiCk.get(b)) !== chuanHoa(root.get(b) ?? ''));
  ok(`Khối .ck đầu tiên của cong-khai.css và :root của chung.css cùng giá trị cho cả ${Object.keys(BANG_MAU).length} biến — một bảng màu cho trang công khai, /noi-bo và kho`,
     khoiCk.size > 0 && lech.length === 0, lech.map(b => `${b}: :root ${root.get(b)} · .ck ${khoiCk.get(b)}`).join(' | '));
});

// ===========================================================================
await nhom('2 · HAI BỀ MẶT Ở .nb-than, KHÔNG MÀU TRẠNG THÁI, TOKEN CỦA KHO Ở .kho-than, KHÔNG BIẾN MỒ CÔI', async () => {
  const noiBo = boChuThich(doc(join(SRC, 'styles', 'noi-bo.css')));
  const nbThan = docQuyTac(noiBo).find(q => q.boChon === '.nb-than')?.trong ?? '';
  // Đếm khai báo ngoài @media print: bản in khai lại hai bề mặt thành trắng (nhóm 3 kiểm riêng).
  const ngoaiIn = css => docQuyTac(css).filter(q => !/^@media[^{]*\bprint\b/.test(q.boChon)).map(q => `${q.boChon}{${q.trong}}`).join('\n');
  const moiCssNoiBo = GIAO_DIEN_NOI_BO.map(f => { const c = cssCua(f); return ngoaiIn(c.khoi) + '\n' + c.noiTuyen; }).join('\n');
  for (const [bien, giaTri] of Object.entries(BE_MAT)) {
    const m = nbThan.match(new RegExp(`(?:^|[;\\s])${bien}\\s*:\\s*([^;]+);`));
    const soLanKhai = (moiCssNoiBo.match(new RegExp(`(?:^|[;{\\s"'\`])${bien}\\s*:`, 'g')) ?? []).length;
    ok(`noi-bo.css .nb-than: ${bien} là ${giaTri}, khai đúng một lần trong cả giao diện nội bộ (ngoài bản in)`,
       !!m && chuanHoa(m[1]) === chuanHoa(giaTri) && soLanKhai === 1, m ? `${m[1].trim()} · khai ${soLanKhai} lần` : 'không thấy trong khối .nb-than đầu tiên');
  }
  // Mười biến đã bỏ: không khai lại, không var() ở đâu trong web/src (CSS, trang, component, lib) — kể cả kèm mã dự
  // phòng. Biến mồ côi thì trình duyệt lặng lẽ bỏ khai báo, trạng thái mất cách vẽ mà không ai hay.
  const maWeb = moiFile(SRC).filter(f => /\.(css|astro|ts|tsx|js|mjs)$/.test(f)).map(f => [tuGoc(f), f.endsWith('.css') ? boChuThich(doc(f)) : doc(f)]);
  for (const bien of BIEN_BO) {
    const khai = new RegExp(`(?:^|[;{\\s"'\`])${bien}\\s*:`, 'm'), dung = new RegExp(`var\\(\\s*${bien}(?![\\w-])`);
    const noi = maWeb.filter(([, s]) => khai.test(s) || dung.test(s)).map(([t]) => t);
    ok(`${bien} không còn khai và không còn var(${bien}) ở đâu trong web/src (bỏ theo bảng 22/10/2026)`, noi.length === 0, noi.slice(0, 6).join(', '));
  }
  const maTrongNbThan = [...nbThan.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].filter(([, , v]) => /#[0-9a-f]{3,8}\b|rgba?\(/i.test(v)).map(([, b, v]) => `${b}: ${v.trim()}`);
  ok('.nb-than không khai mã màu nào (chỉ --nb-nen, --nb-the trỏ về biến của bảng), như .kho-than',
     nbThan.length > 0 && maTrongNbThan.length === 0, maTrongNbThan.join(' · '));
  ok('noi-bo.css .nb-than: nền trang là --nb-nen (F4), chữ đen', /(?:^|[;\s])background\s*:\s*var\(--nb-nen\)\s*;/.test(nbThan) && /(?:^|[;\s])color\s*:\s*var\(--than\)\s*;/.test(nbThan));
  // Giá trị thật của hai bề mặt: biến trong .nb-than trỏ tới biến nào của :root (chung.css), mã của biến đó.
  const chung = boChuThich(doc(join(SRC, 'styles', 'chung.css')));
  const rootKhai = new Map([...[...chung.matchAll(/(?<=^|\})\s*:root\s*\{([^{}]*)\}/g)].map(m => m[1]).join('\n')
    .matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  const giaiMa = bien => rootKhai.get(nbThan.match(new RegExp(`(?:^|[;\\s])${bien}\\s*:\\s*var\\((--[a-z0-9-]+)\\)`))?.[1] ?? '') ?? '';
  const [maThe, maNen] = [giaiMa('--nb-the'), giaiMa('--nb-nen')];
  ok(`Thẻ sáng hơn nền trang (đọc từ CSS: thẻ ${maThe}, nền ${maNen}) — thẻ trắng trên nền F4`,
     /^#[0-9a-f]{6}$/i.test(maThe) && /^#[0-9a-f]{6}$/i.test(maNen) && doSang(maThe) > doSang(maNen), `${maThe} · ${maNen}`);

  const khung = boChuThich(doc(join(SRC, 'styles', 'kho-khung.css')));
  const khoThan = docQuyTac(khung).find(q => q.boChon === '.kho-than')?.trong ?? '';
  const khaiKho = new Map([...khoThan.matchAll(/(--kho-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  for (const [bien, giaTri] of Object.entries(KHO)) {
    ok(`kho-khung.css .kho-than: ${bien} là ${giaTri}`, chuanHoa(khaiKho.get(bien) ?? '') === chuanHoa(giaTri), khaiKho.get(bien) ?? 'không khai');
  }
  const mauKhoThua = [...khaiKho].filter(([b, v]) => (/^#/.test(v) || /^rgba?\(/i.test(v)) && !(b in KHO)).map(([b, v]) => `${b}: ${v}`);
  ok('.kho-than không viết mã màu nào: nền, thẻ, vạch của kho trỏ về biến của bảng và của .nb-than',
     mauKhoThua.length === 0 && [...khaiKho.values()].every(v => !/^#|^rgba?\(/i.test(v)), mauKhoThua.join(' · '));

  // Biến dùng mà không khai: trình duyệt lặng lẽ rơi về mã dự phòng (hoặc bỏ cả khai báo). Bản trước có
  // var(--kho-vang-nhat, #fff7e0) — biến chưa từng được khai, màu thật là mã dự phòng viết cứng.
  const daKhai = new Set([...[...moiFile(join(SRC, 'styles')), ...ASTRO_NOI_BO].map(f => (f.endsWith('.css') ? boChuThich(doc(f)) : doc(f))).join('\n')
    .matchAll(/(?:^|[;{\s"'`])(--[a-z0-9-]+)\s*:/g)].map(m => m[1]));
  const moCoi = [];
  for (const f of GIAO_DIEN_NOI_BO) {
    const c = cssCua(f);
    for (const [, bien] of (c.khoi + '\n' + c.noiTuyen).matchAll(/var\(\s*(--[a-z0-9-]+)/g)) if (!daKhai.has(bien)) moCoi.push(`${tuGoc(f)}: ${bien}`);
  }
  ok(`Mọi biến var(--…) dùng trong ${GIAO_DIEN_NOI_BO.length} file giao diện nội bộ đều có khai trong web/src`, moCoi.length === 0, [...new Set(moCoi)].slice(0, 8).join(' | '));
  const duPhongMau = GIAO_DIEN_NOI_BO.flatMap(f => { const c = cssCua(f); return [...(c.khoi + '\n' + c.noiTuyen).matchAll(/var\(\s*--[a-z0-9-]+\s*,\s*#[0-9a-f]{3,8}\s*\)/gi)].map(m => `${tuGoc(f)}: ${m[0]}`); });
  ok('Không var(--biến, #mã-dự-phòng) trong giao diện nội bộ — biến luôn có, mã dự phòng chỉ là chỗ màu cũ nằm lại',
     duPhongMau.length === 0, duPhongMau.slice(0, 6).join(' | '));
});

// ===========================================================================
// Màu viết cứng được phép trong giao diện nội bộ: CHỈ mã 6 chữ số của bảng 22/10/2026 (#BD0000 #8F0000 #FFFFFF
// #F4F4F4 #E2E2E2 #000000 #555555 #767676). Viết tắt #FFF / #000, xám khác chỉ trong bản in.
const HEX_DUOC = new Set(Object.values(BANG_MAU).filter(v => /^#[0-9a-f]{6}$/i.test(v)).map(v => v.toUpperCase()));
const HEX_BAN_IN = new Set(['#FFF', '#FFFFFF', '#000', '#000000', '#999', '#EEE']);   // bản in: đen, trắng, xám
const BO_BA_DUOC = new Set(['0,0,0', '255,255,255', '189,0,0', '143,0,0']);            // đen · trắng · đỏ · đỏ đậm
/** Mọi mã hex màu trong một đoạn CSS (3, 4, 6 hoặc 8 chữ số; bỏ qua #id trong bộ chọn nhờ chỉ đọc phần khai báo). */
const hexTrong = css => [...css.matchAll(/#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi)].map(m => m[0].toUpperCase());
/** Bộ quét cách viết màu (mau-css.mjs, dùng chung với trang công khai): rgb() lạ, hsl(), oklch(), color()…, tên màu
    CSS (white, ivory, snow, black…), màu hệ thống ngoài forced-colors (Canvas, Field là trắng). */
const mauLaTrong = taoMauLaTrong(BO_BA_DUOC);
/** Phần giá trị của từng khai báo trong một khối CSS (bỏ tên thuộc tính: white-space, …). */
const giaTriKhaiBao = trong => trong.split(';').map(d => d.slice(d.indexOf(':') + 1)).filter(v => v.trim());

await nhom('3 · KHÔNG MÃ CŨ: MÀU VIẾT CỨNG CHỈ LÀ MÃ 6 CHỮ SỐ CỦA BẢNG 22/10/2026 (VIẾT TẮT, XÁM KHÁC CHỈ KHI IN)', async () => {
  // Quét cả chú thích: chú thích ghi mã cũ là chỗ người sau chép lại. web/src/lib quét trọn (qua-tai.ts dựng HTML có màu).
  const quet = [...GIAO_DIEN_NOI_BO, ...moiFile(join(SRC, 'lib')).filter(f => /\.(ts|js|mjs)$/.test(f)), MANIFEST, ...moiFile(join(WEB, 'public', 'kho', 'js'))];
  ok(`Danh sách quét có CSS, trang, component, layout nội bộ, web/src/lib và manifest của kho (${quet.length} file)`,
     quet.length > 150 && quet.includes(QUA_TAI) && quet.some(f => f.endsWith('Kho.astro')) && quet.some(f => f.endsWith(`kho${sep}index.astro`))
     && !quet.some(f => f.endsWith('cong-khai.css') || f.endsWith(`layouts${sep}Trang.astro`)));
  const conCu = quet.flatMap(f => {
    const thay = [...new Set(doc(f).match(MA_CU) ?? [])];
    return thay.length ? [`${tuGoc(f)}: ${thay.join(' ')}`] : [];
  });
  ok('Không file nội bộ nào còn mã màu của bảng cũ (hex hoặc bộ ba RGB), kể cả trong chú thích', conCu.length === 0, conCu.slice(0, 8).join(' | '));
  // Bộ lọc phải bắt được mã cũ ở mọi kiểu viết — để phép kiểm trên không đạt suông.
  const MAU_THU = ['color: #B23A2C', 'background:#fbf4e1;', 'rgba(30, 22, 14, .68)', 'rgba(30,22,14,.12)', 'rgb(251 , 244,225)', 'var(--kho-xanh, #1f7a4c)', '#FFF5DC', 'rgba(242,169,0,.4)',
    'color: #A70C0C', 'rgba(21, 16, 8, .68)', 'rgba(240,227,208,.22)', 'var(--x, #F5AA14)', '#1A683F', 'rgb(21 16 8 / .16)'];
  const lot = MAU_THU.filter(m => !m.match(MA_CU));
  ok(`Bộ lọc mã cũ bắt được ${MAU_THU.length} kiểu viết (hex hoa / thường, bảng 09/10/2026, màu trạng thái, rgb() có và không có dấu phẩy)`, lot.length === 0, lot.join(' | '));
  const MAU_DUNG = ['#BD0000', '#8F0000', 'rgba(0, 0, 0, .16)', 'rgba(255, 255, 255, .22)', '#767676', 'margin: 30px 22px 14px', 'margin: 21px 16px 8px'];
  const batNham = MAU_DUNG.filter(m => m.match(MA_CU));
  ok('Bộ lọc mã cũ không bắt nhầm mã của bảng mới hay số đo', batNham.length === 0, batNham.join(' | '));

  // Màu viết cứng: ngoài @media print chỉ mã của bảng; trong @media print chỉ đen, trắng, xám.
  const la = [], inMau = [], boBaLa = [], tuKhoa = [];
  for (const f of GIAO_DIEN_NOI_BO) {
    const c = cssCua(f);
    for (const q of quyTacPhang(c.khoi)) {
      const duoc = q.trongIn ? HEX_BAN_IN : HEX_DUOC;
      for (const h of hexTrong(q.trong)) if (!duoc.has(h)) (q.trongIn ? inMau : la).push(`${tuGoc(f)}: ${q.boChon.slice(0, 40)} ${h}`);
      if (q.trongIn && /var\(--(do|do-dam|do-sau|mu-tat|cuc-vang|xanh|vang-chu|kem|kem-sau|kem-dam|kho-nen|kho-the|nb-nen|nb-the)\)/.test(q.trong)) inMau.push(`${tuGoc(f)}: ${q.boChon.slice(0, 40)} dùng biến màu`);
      if (!q.trongIn) for (const v of giaTriKhaiBao(q.trong)) for (const k of mauLaTrong(v, q.tuongPhanCao)) tuKhoa.push(`${tuGoc(f)}: ${q.boChon.slice(0, 40)} ${k}`);
    }
    for (const h of hexTrong(c.noiTuyen)) if (!HEX_DUOC.has(h)) la.push(`${tuGoc(f)}: style="…${h}…"`);
    for (const v of giaTriKhaiBao(c.noiTuyen)) for (const k of mauLaTrong(v, false)) tuKhoa.push(`${tuGoc(f)}: style="…${k}…"`);
    for (const m of (c.khoi + '\n' + c.noiTuyen).matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)) {
      if (!BO_BA_DUOC.has(m.slice(1).join(','))) boBaLa.push(`${tuGoc(f)}: ${m[0]}…)`);
    }
  }
  ok('Màu hex viết cứng trong giao diện nội bộ chỉ là mã 6 chữ số của bảng 22/10/2026 — viết tắt #FFF / #000 chỉ trong bản in', la.length === 0, la.slice(0, 8).join(' | '));
  ok('Không tên màu CSS (white, ivory, snow, black…), không hsl() / oklch() / color()…, không rgb() lạ, không màu hệ thống ngoài tương phản cao (Canvas, Field là trắng) — ngoài bản in',
     tuKhoa.length === 0, tuKhoa.slice(0, 8).join(' | '));
  ok('Màu rgb() / rgba() trong giao diện nội bộ chỉ dùng số của đen, trắng, đỏ, đỏ đậm', boBaLa.length === 0, boBaLa.slice(0, 8).join(' | '));
  ok('Bản in (@media print) của nội bộ và kho chỉ đen, trắng, xám — không mã màu, không biến màu', inMau.length === 0, inMau.slice(0, 8).join(' | '));
  // Bộ lọc màu ngoài bảng phải bắt được mọi kiểu viết (viết tắt, tên màu, hàm màu khác, màu hệ thống, mã của bảng
  // 09/10/2026, trắng ngà, xám lạ), và không bắt nhầm white-space, nowrap hay tên lớp.
  const bat = t => hexTrong(t).some(h => !HEX_DUOC.has(h)) || giaTriKhaiBao(t).some(v => mauLaTrong(v, false).length > 0);
  const THU_NGOAI_BANG = ['background: #fff;', 'background: white;', 'box-shadow: 0 0 0 2px white', 'background:#000',
    'color: hsl(0 0% 100%)', 'background: whitesmoke', 'background: ivory',
    'background: snow', 'background: Canvas', 'background-color: Field', 'background: oklch(1 0 0)', 'background: color(srgb 1 1 1)',
    'background: linear-gradient(white, var(--kem))',
    'background: #F0E3D0', 'background: rgb(240 227 208)', 'color: #A70C0C', 'background: #FFFDF6', 'color: #1A683F', 'background: #EEE'];
  const lotTrang = THU_NGOAI_BANG.filter(t => !bat(t));
  ok(`Bộ lọc màu ngoài bảng bắt được ${THU_NGOAI_BANG.length} cách viết`, lotTrang.length === 0, lotTrang.join(' | '));
  const THU_DUNG = ['white-space: nowrap', 'background: var(--kem)', 'color: currentColor', 'border-color: transparent', 'background: rgba(0, 0, 0, .16)',
    'background: url("/kho/white.svg") no-repeat', 'content: "white-list"',
    'color:#FFFFFF', 'background: rgb(255 255 255)', 'background: rgba(255,255,255,.5)'];
  const batNhamTrang = THU_DUNG.filter(bat);
  ok(`…và không bắt nhầm ${THU_DUNG.length} cách viết hợp lệ (white-space, url có chữ white, chuỗi, transparent…)`, batNhamTrang.length === 0, batNhamTrang.join(' | '));
  ok('…màu hệ thống trong @media (forced-colors: active) thì được', mauLaTrong('Canvas', true).length === 0);
  const khungIn = quyTacPhang(boChuThich(doc(join(SRC, 'styles', 'kho-khung.css')))).filter(q => q.trongIn);
  ok('kho-khung.css: khi in, nền trang kho là trắng (nền xám F4 không lên giấy)',
     khungIn.some(q => q.boChon === '.kho-than' && /background\s*:\s*#fff\b/i.test(q.trong)));
  const noiBoIn = quyTacPhang(boChuThich(doc(join(SRC, 'styles', 'noi-bo.css')))).filter(q => q.trongIn);
  const HO_NEN = ['--nb-nen', '--nb-the', '--kem', '--kem-sau', '--kem-dam'];
  ok(`noi-bo.css: khi in, cả họ nền về trắng (${HO_NEN.join(', ')}) — máy in bật "in nền" cũng không in thẻ, bảng, ô nhập thành mảng xám F4 / E2`,
     noiBoIn.some(q => q.boChon === '.nb-than' && HO_NEN.every(b => new RegExp(`(?:^|[;\\s])${b}\\s*:\\s*#fff\\s*;`, 'i').test(q.trong))));
  ok('noi-bo.css: khi in, ô đánh dấu và ô chọn một trả về ô của hệ thống, màu đen — in tắt nền thì nền đỏ, dấu ✓ trắng của ô tự vẽ không lên giấy',
     noiBoIn.some(q => q.boChon === ".nb-than input:is([type='checkbox'], [type='radio'])" && /appearance\s*:\s*auto/.test(q.trong) && /accent-color\s*:\s*#000\b/.test(q.trong))
     && noiBoIn.some(q => q.boChon === ".nb-than input:is([type='checkbox'], [type='radio'])::before" && /content\s*:\s*none/.test(q.trong)));
});

// ===========================================================================
await nhom('4 · Ô CỦA TRÌNH DUYỆT DÙNG TOKEN (không để trình duyệt tự vẽ): Ô NHẬP, Ô TỰ ĐIỀN, Ô ĐÁNH DẤU, NÚT CHỌN TỆP, HỘP THOẠI, THANH TIẾN ĐỘ', async () => {
  const css = boChuThich(doc(join(SRC, 'styles', 'noi-bo.css')));
  const qt = quyTacPhang(css).filter(q => !q.trongIn);
  const tim = (dk) => qt.find(q => dk(q.boChon));
  const coBien = (q, thuocTinh, gt) => !!q && new RegExp(`(?:^|[;\\s])${thuocTinh}\\s*:\\s*${gt.replace(/[()]/g, '\\$&')}\\s*;`).test(q.trong);

  const macDinh = tim(b => b.startsWith(':where(.nb-than) :where(input:not([type])'));
  const LOAI = ['text', 'search', 'tel', 'email', 'number', 'password', 'url', 'date', 'time', 'datetime-local', 'month'];
  ok(`Ô nhập không lớp riêng (bảng sửa nhanh, ô trong dòng…): nền trắng var(--kem), độ ưu tiên 0 — đủ ${LOAI.length} kiểu ô chữ, select, textarea`,
     coBien(macDinh, 'background-color', 'var(--kem)') && LOAI.every(l => macDinh.boChon.includes(`input[type='${l}']`)) && /\bselect\b/.test(macDinh.boChon) && /\btextarea\b/.test(macDinh.boChon),
     macDinh ? macDinh.boChon.slice(0, 80) : 'không thấy quy tắc');
  const tuDien = tim(b => b.includes(':autofill') && b.includes(':-webkit-autofill') && !b.endsWith(':focus'));
  ok('Ô trình duyệt tự điền: phủ một lớp bóng trong màu trắng var(--kem) (Chrome, Safari không cho đổi nền ô tự điền)',
     !!tuDien && /box-shadow\s*:\s*inset 0 0 0 1000px var\(--kem\)/.test(tuDien.trong) && /-webkit-text-fill-color\s*:\s*var\(--than\)/.test(tuDien.trong));
  const danhDau = tim(b => b === ".nb-than input:is([type='checkbox'], [type='radio'])");
  ok('Ô đánh dấu và ô chọn một tự vẽ: appearance none, nền trắng var(--kem), viền --vien-o',
     !!danhDau && /(?:^|[;\s])appearance\s*:\s*none/.test(danhDau.trong) && coBien(danhDau, 'background', 'var(--kem)') && /border\s*:\s*1px solid var\(--vien-o\)/.test(danhDau.trong));
  ok('Ô tự vẽ không đặt cỡ, lề ở quy tắc độ ưu tiên cao — cỡ do trang đặt; trang không đặt thì 20px ở quy tắc :where()',
     !!danhDau && !/(?:^|[;\s])(width|height|margin)\s*:/.test(danhDau.trong)
     && coBien(tim(b => b === ":where(.nb-than) input:where([type='checkbox'], [type='radio'])"), 'width', '20px'));
  ok('Ô đánh dấu đã chọn: nền đỏ, dấu ✓ là nét trắng',
     coBien(tim(b => b === ".nb-than input[type='checkbox']:checked"), 'background', 'var(--do)')
     && /border\s*:\s*solid var\(--kem\)/.test(tim(b => b === ".nb-than input[type='checkbox']::before")?.trong ?? ''));
  ok('Ô chọn một đã chọn: viền đỏ, chấm đỏ', /border\s*:\s*2px solid var\(--do\)/.test(tim(b => b === ".nb-than input[type='radio']:checked")?.trong ?? '')
     && coBien(tim(b => b === ".nb-than input[type='radio']::before"), 'background', 'var(--do)'));
  const tuongPhanCao = docQuyTac(css).find(q => /^@media\s*\(forced-colors:\s*active\)/.test(q.boChon))?.trong ?? '';
  ok('Chế độ tương phản cao (Windows): trả về ô của hệ thống, bỏ dấu ✓ tự vẽ', /appearance\s*:\s*auto/.test(tuongPhanCao) && /content\s*:\s*none/.test(tuongPhanCao));
  ok('Nút "Chọn tệp" của ô tải ảnh: nền trắng var(--kem), viền --vien-o', coBien(tim(b => b === ".nb-than input[type='file']::file-selector-button"), 'background', 'var(--kem)'));
  ok('Hộp thoại (<dialog>, quét nhãn bằng camera): nền trắng var(--kem), chữ đen', coBien(tim(b => b === '.nb-than dialog'), 'background', 'var(--kem)'));
  ok('Ô nhập không lớp riêng có viền --vien-o: đặt nền thì Chrome bỏ ô vẽ sẵn và rơi về viền 2px lõm sẫm',
     !!macDinh && /border\s*:\s*1px solid var\(--vien-o\)/.test(macDinh.trong));
  ok('Ô tự vẽ trong .nb-o không nhận cao 48px và đệm của ô chữ (thành hình bầu dục): min-height 0, padding 0',
     !!danhDau && /min-height\s*:\s*0\s*;/.test(danhDau.trong) && /(?:^|[;\s])padding\s*:\s*0\s*;/.test(danhDau.trong));
  // accent-color chỉ có nghĩa với ô của hệ thống — tức là khi in (noi-bo.css đặt đen) và ở chế độ tương phản cao.
  const accent = GIAO_DIEN_NOI_BO.flatMap(f => { const c = cssCua(f);
    return quyTacPhang(c.khoi).some(q => !q.trongIn && /accent-color/.test(q.trong)) || /accent-color/.test(c.noiTuyen) ? [tuGoc(f)] : []; });
  ok('Không trang nội bộ nào đặt accent-color ngoài bản in — ô đánh dấu tự vẽ không đọc nó', accent.length === 0, accent.join(' | '));
  ok('Chữ gợi ý (placeholder) là --muc-nhat (#555, 7,46 : 1 trên ô trắng), không mờ thêm — xám mặc định của Chrome chỉ 4,61 : 1, sát ngưỡng',
     /color\s*:\s*var\(--muc-nhat\)/.test(tim(b => b === '.nb-than ::placeholder')?.trong ?? '') && /opacity\s*:\s*1\b/.test(tim(b => b === '.nb-than ::placeholder')?.trong ?? ''));
  ok('Khung nhóm ô (fieldset) không lớp riêng: vạch --vach thay cho viền lõm mặc định (có một nét gần trắng)',
     /border\s*:\s*1px solid var\(--vach\)/.test(tim(b => b === ':where(.nb-than) fieldset')?.trong ?? ''));
  const thanh = tim(b => b === '.nb-than progress');
  ok('Thanh tiến độ (<progress>) tự tô: rãnh xám E2 (--kem-dam), phần xong đen (--than, 16,21 : 1 với rãnh) — của trình duyệt là rãnh xám trắng, phần xong xanh dương',
     !!thanh && /appearance\s*:\s*none/.test(thanh.trong) && coBien(thanh, 'background', 'var(--kem-dam)')
     && /background\s*:\s*var\(--kem-dam\)/.test(tim(b => b === '.nb-than progress::-webkit-progress-bar')?.trong ?? '')
     && /background\s*:\s*var\(--than\)/.test(tim(b => b === '.nb-than progress::-webkit-progress-value')?.trong ?? '')
     && /background\s*:\s*var\(--than\)/.test(tim(b => b === '.nb-than progress::-moz-progress-bar')?.trong ?? '')
     && /progress/.test(tuongPhanCao));

  // Ô nhập có lớp riêng: nền trắng --kem (không phải --nb-the: ô luôn trắng, kể cả khi đặt thẳng trên nền trang F4).
  const moiQuyTac = GIAO_DIEN_NOI_BO.flatMap(f => quyTacPhang(cssCua(f).khoi).filter(q => !q.trongIn).map(q => ({ ...q, tep: tuGoc(f) })));
  for (const bc of ['.nb-o input, .nb-o select, .nb-o textarea', '.bd-tim input', '.kho-ben-tim', '.sn-bang input[type="text"], .sn-bang select', '.td-o']) {
    const q = moiQuyTac.find(x => x.boChon === bc);
    ok(`Ô nhập "${bc}" nền trắng var(--kem)`, coBien(q, 'background', 'var(--kem)'), q ? q.trong.match(/background\s*:[^;]+/)?.[0] ?? 'không khai nền' : 'không thấy quy tắc');
  }
});

// ===========================================================================
await nhom('5 · TƯƠNG PHẢN CỦA /noi-bo VÀ KHO (WCAG 2.2)', async () => {
  const M = BANG_MAU;
  const E2 = M['--kem-dam'];
  const NEN_SANG = [['thẻ, ô nhập (trắng)', THE], ['nền trang, đầu bảng (F4)', NEN], ['di chuột, nhãn "Sắp hết" (E2)', E2]];

  // Bốn màu chữ của nền sáng, trên cả ba nền sáng (12 phép).
  kiemCap(NEN_SANG.map(([ten, nen]) => [`chữ đen trên ${ten}`, M['--than'], nen, 7]));
  kiemCap(NEN_SANG.map(([ten, nen]) => [`chữ phụ #555 (--muc-nhat) trên ${ten}`, M['--muc-nhat'], nen, 4.5]));
  kiemCap(NEN_SANG.map(([ten, nen]) => [`chữ đỏ trên ${ten}`, M['--do'], nen, 4.5]));
  kiemCap(NEN_SANG.map(([ten, nen]) => [`chữ đỏ đậm (câu lỗi) trên ${ten}`, M['--do-dam'], nen, 4.5]));
  // Từng cặp của bảy kiểu vẽ trạng thái (K1–K7, kế hoạch mục 2a), đèn sức khỏe, vòng focus, ô của trình duyệt.
  kiemCap([
    ['chữ trắng trên đỏ (nút chính, số đỏ, nhãn "chờ" K1)', M['--kem'], M['--do'], 4.5],
    ['chữ trắng trên đỏ đậm (nút chính khi di chuột)', M['--kem'], M['--do-dam'], 4.5],
    ['chữ trắng trên đen (đầu trang, nhãn "nháp" / "giá thử" K3)', M['--kem'], M['--than'], 7],
    ['chữ phụ E2 (--da) trên đen (tên vai ở đầu trang)', M['--da'], M['--than'], 4.5],
    ['chữ trắng trên đen (chữ "nội bộ", tên chi nhánh)', M['--kem'], M['--than'], 4.5],
    ['chữ đen trên E2 (nhãn "Sắp hết", "lưu ý" K5)', M['--than'], E2, 4.5],
    ['chữ #555 trên trắng (nhãn "tắt" K6)', M['--muc-nhat'], THE, 4.5],
    ['chữ #555 trên F4 (nhãn "tắt" K6 đặt trên nền trang)', M['--muc-nhat'], NEN, 4.5],
    ['chữ đen trên trắng (nhãn "xong" K4, nhãn thuộc tính K7)', M['--than'], THE, 4.5],
    ['viền liền của nhãn K4 (đen) trên trắng', M['--than'], THE, 3],
    ['nét đứt của nhãn K6 (#767676) trên trắng', M['--vien-o'], THE, 3],
    ['nét đứt của nhãn K6 (#767676) trên F4', M['--vien-o'], NEN, 3],
    ['viền nút phụ khi di chuột (#767676 trên E2)', M['--vien-o'], E2, 3],
    ['viền ô nhập (--vien-o) trên nền trắng của ô', M['--vien-o'], THE, 3],
    ['viền ô nhập, nút phụ đặt thẳng trên nền trang F4', M['--vien-o'], NEN, 3],
    ['viền nút trên đầu trang đen (#767676 trên đen)', M['--vien-o'], M['--than'], 3],
    ['ô đánh dấu đã chọn (đỏ) trên thẻ trắng', M['--do'], THE, 3],
    ['dấu ✓ trắng trên ô đánh dấu đỏ', M['--kem'], M['--do'], 3],
    ['đèn "Xử lý ngay" (tam giác đỏ) trên thẻ trắng', M['--do'], THE, 3],
    ['đèn "Ổn" (chấm đen) trên thẻ trắng', M['--than'], THE, 3],
    ['đèn "Xem hôm nay" (hình thoi #555) trên thẻ trắng', M['--muc-nhat'], THE, 3],
    ['đèn "Chưa bật" (vòng rỗng #767676) trên thẻ trắng', M['--vien-o'], THE, 3],
    ['chấm "chưa đọc" (đen) trên thẻ trắng', M['--than'], THE, 3],
    ['viền 2px của khối "làm ngay" K2 (đỏ) trên thẻ trắng', M['--do'], THE, 3],
    ['vạch và vòng "!" của khối "lưu ý" K5 (#555) trên thẻ trắng', M['--muc-nhat'], THE, 3],
    ['vòng focus đen trên thẻ trắng', M['--than'], THE, 3],
    ['vòng focus đen trên nền trang F4', M['--than'], NEN, 3],
    ['vòng focus đen trên E2 (dòng đang di chuột)', M['--than'], E2, 3],
    ['vòng focus trắng trên đầu trang đen', M['--kem'], M['--than'], 3],
    ['phần đã xong của thanh tiến độ (đen) trên rãnh E2', M['--than'], E2, 3],
    ['chữ đỏ cỡ lớn (≥ 24px) trên đen', M['--do'], M['--than'], 3],
    ['nét đỏ 3px của mục đang chọn ở thanh đáy kho trên thẻ trắng', M['--do'], THE, 3],
  ]);
  // Chữ gợi ý (placeholder) --muc-nhat trong ô nhập trắng.
  kiemCap([['chữ gợi ý (--muc-nhat #555) trong ô nhập trắng', M['--muc-nhat'], THE, 4.5]]);
  const xamChrome = '#757575';
  ok(`…xám mặc định của chữ gợi ý (Chrome ${xamChrome}) trên nền F4 chỉ ${so(tuongPhan(xamChrome, NEN))} : 1 — ô nào quên nền trắng thì chữ gợi ý không đạt`,
     tuongPhan(xamChrome, NEN) < 4.5);
  ok(`…và trên ô trắng ${so(tuongPhan(xamChrome, THE))} : 1, sát ngưỡng — --muc-nhat (${so(tuongPhan(M['--muc-nhat'], THE))} : 1) rõ hơn: lý do của quy tắc ::placeholder`,
     tuongPhan(M['--muc-nhat'], THE) > tuongPhan(xamChrome, THE));
  // Nhãn "tắt" (.nb-nhan.tat, K6): nền trong, chữ --muc-nhat, nét đứt — chữ đọc trên nền phía sau nhãn.
  for (const [ten, nen] of NEN_SANG.slice(0, 2)) {
    const r = tuongPhan(M['--muc-nhat'], nen);
    ok(`Tương phản nhãn "tắt" K6 (chữ #555, nền trong) đặt trên ${ten}: ${so(r)} : 1 (cần ≥ 4,5 : 1)`, r >= 4.5);
  }
  // Nhãn xám K5 (nền E2 đặc) phải thấy được trên cả thẻ trắng lẫn nền trang F4: nền nhãn tối hơn cả hai.
  ok(`Nền nhãn xám E2 tối hơn nền trang F4 và thẻ trắng (${[E2, NEN, THE].map(m => doSang(m).toFixed(3).replace('.', ',')).join(' < ')})`,
     doSang(E2) < doSang(NEN) && doSang(NEN) < doSang(THE));

  // Các cặp bị cấm — số ở đây là lý do của luật.
  const camChuThuong = [['chữ đỏ trên đen', M['--do'], M['--than']]];
  ok(`Không làm chữ thường (dưới 4,5 : 1): ${camChuThuong.map(([t, a, b]) => `${t} ${so(tuongPhan(a, b))}`).join(' · ')}`,
     camChuThuong.every(([, a, b]) => tuongPhan(a, b) < 4.5));
  const cam = [['đỏ đậm trên đen', M['--do-dam'], M['--than']], ['#555 trên đen', M['--muc-nhat'], M['--than']],
    ['E2 trên thẻ trắng', E2, THE], ['F4 trên thẻ trắng', NEN, THE], ['E2 trên nền F4', E2, NEN]];
  ok(`Các cặp không được dùng làm chữ hay nét mang nghĩa đều dưới 3 : 1 — ${cam.map(([t, a, b]) => `${t} ${so(tuongPhan(a, b))}`).join(' · ')}`,
     cam.every(([, a, b]) => tuongPhan(a, b) < 3));
  // Luật 2 của kế hoạch 2a: đỏ và các xám gần cùng độ sáng — không bao giờ là khác biệt DUY NHẤT giữa hai trạng thái.
  const camKhacBiet = [['đỏ với #555', M['--do'], M['--muc-nhat']], ['đỏ với #767676', M['--do'], M['--vien-o']]];
  ok(`Đỏ và xám không bao giờ là khác biệt duy nhất (dưới 3 : 1 với nhau): ${camKhacBiet.map(([t, a, b]) => `${t} ${so(tuongPhan(a, b))}`).join(' · ')} — nhóm 7 gác kênh không phải màu`,
     camKhacBiet.every(([, a, b]) => tuongPhan(a, b) < 3));

  // Luật ấy trong mã, hai chiều theo bề mặt:
  //   · xám E2 (--da) làm màu chữ / biểu tượng CHỈ ở chỗ nằm trên nền đen (đầu trang, mục đang chọn của cột bên);
  //   · #555 (--muc-nhat) KHÔNG BAO GIỜ ở chỗ nằm trên nền đen (2,82 : 1);
  //   · ba xám trang trí (--kem-sau, --kem-dam, --vach) không làm màu chữ / nét / tô ở đâu cả;
  //   · chữ trên nền đen là trắng (--kem) hoặc E2 — đếm để biết bộ đọc quy tắc còn đọc được CSS.
  const NEN_TOI = /^(\.nb-hieu |\.nb-ten |\.kho-hieu |\.kho-nguoi-ten |\.kho-ben-muc\[aria-current='page'\] |\.nb-dau |\.kho-dau )/;
  const chuDaNgoaiToi = [], chuPhuTrenToi = [], xamLamChu = [], chuDoTrenToi = [];
  let soChuSangTrenToi = 0;
  for (const f of GIAO_DIEN_NOI_BO) {
    const c = cssCua(f);
    for (const q of quyTacPhang(c.khoi)) {
      if (q.trongIn) continue;
      const mauChu = [...q.trong.matchAll(/(?:^|[;\s])(?:color|fill|stroke)\s*:\s*var\(--([a-z0-9-]+)\)/g)].map(m => m[1]);
      for (const bc of tachDanhSach(q.boChon)) {
        const trenToi = NEN_TOI.test(bc + ' ');
        for (const bien of mauChu) {
          if (trenToi && (bien === 'kem' || bien === 'da')) soChuSangTrenToi++;
          if (bien === 'da' && !trenToi) chuDaNgoaiToi.push(`${tuGoc(f)}: ${bc} { color: var(--da) }`);
          if (bien === 'muc-nhat' && trenToi) chuPhuTrenToi.push(`${tuGoc(f)}: ${bc} { color: var(--muc-nhat) }`);
          if (['kem-sau', 'kem-dam', 'vach', 'kho-vach'].includes(bien)) xamLamChu.push(`${tuGoc(f)}: ${bc} { color: var(--${bien}) }`);
        }
      }
      if (/(?:^|[;\s])color\s*:\s*var\(--do(?:-dam|-sau)?\)/.test(q.trong) && /background(?:-color)?\s*:\s*var\(--than\)/.test(q.trong)) chuDoTrenToi.push(`${tuGoc(f)}: ${q.boChon}`);
    }
    if (/(?:^|[;\s"'`])color\s*:\s*var\(--da\)/.test(c.noiTuyen)) chuDaNgoaiToi.push(`${tuGoc(f)}: style="color: var(--da)"`);
    if (/(?:^|[;\s"'`])(?:color|fill|stroke)\s*:\s*var\(--(?:kem-sau|kem-dam|vach)\)/.test(c.noiTuyen)) xamLamChu.push(`${tuGoc(f)}: style="color: var(--…)"`);
  }
  ok(`Xám E2 (--da) chỉ làm màu chữ / biểu tượng ở chỗ nằm trên nền đen; chữ trên nền đen là trắng hoặc E2 (${soChuSangTrenToi} chỗ)`,
     soChuSangTrenToi >= 5 && chuDaNgoaiToi.length === 0, chuDaNgoaiToi.slice(0, 6).join(' | ') || `chỉ thấy ${soChuSangTrenToi} chỗ dùng — bộ đọc quy tắc có còn đọc được CSS không?`);
  ok('#555 (--muc-nhat) không bao giờ làm chữ ở chỗ nằm trên nền đen (đầu trang, mục đang chọn của cột bên)', chuPhuTrenToi.length === 0, chuPhuTrenToi.join(' | '));
  ok('--kem-sau, --kem-dam, --vach không làm color / fill / stroke ở đâu (chỉ nền và vạch trang trí)', xamLamChu.length === 0, xamLamChu.slice(0, 6).join(' | '));
  ok('Không quy tắc nào đặt chữ đỏ trên nền đen', chuDoTrenToi.length === 0, chuDoTrenToi.join(' | '));
  // Mẫu tự kiểm cho phép đọc bộ chọn trên đầu trang đen.
  ok('…bộ chọn trên đầu trang đen (.nb-ten em, .kho-hieu small) được nhận ra; .nb-dong dt (thẻ trắng) thì không',
     NEN_TOI.test('.nb-ten em ') && NEN_TOI.test('.kho-hieu small ') && !NEN_TOI.test('.nb-dong dt '));

  // Viền ô nhập: --vien-o. Không ô nào kẻ viền bằng vạch mờ (--vach / --kem-dam E2 chỉ 1,30 : 1 với ô trắng, --kho-vach
  // cũng là --vach).
  const moiQuyTac = GIAO_DIEN_NOI_BO.flatMap(f => quyTacPhang(cssCua(f).khoi).filter(q => !q.trongIn).map(q => ({ ...q, tep: tuGoc(f) })));
  const O_NHAP = ['.nb-o input, .nb-o select, .nb-o textarea', '.bd-tim input', '.kho-ben-tim', '.sn-bang input[type="text"], .sn-bang select', '.td-o'];
  for (const bc of O_NHAP) {
    const q = moiQuyTac.find(x => x.boChon === bc);
    ok(`Ô nhập "${bc}" kẻ viền bằng --vien-o`, !!q && /border\s*:\s*1px solid var\(--vien-o\)/.test(q.trong), q ? q.trong.match(/border\s*:[^;]+/)?.[0] ?? 'không khai viền' : 'không thấy quy tắc');
  }
  const vienMo = moiQuyTac.filter(q => /\b(input|select|textarea)\b/.test(q.boChon) && !/:checked|:focus|type=['"]?(checkbox|radio|file)/.test(q.boChon)
    && /border(?:-color)?\s*:[^;]*var\(--(vach|kho-vach|kho-vach-dam|da|kem-dam)\)/.test(q.trong)).map(q => `${q.tep}: ${q.boChon}`);
  ok(`Không ô nhập nào kẻ viền bằng --vach, --kho-vach, --kho-vach-dam, --da hay --kem-dam (vạch E2 chỉ ${so(tuongPhan(E2, THE))} : 1 với ô trắng)`, vienMo.length === 0, vienMo.join(' | '));
  const nutPhu = moiQuyTac.filter(q => q.boChon === '.nb-nut.phu' || q.boChon === '.nb-nut-nho-sang');
  ok(`Nút phụ (.nb-nut.phu, .nb-nut-nho-sang): nền trắng, viền --vien-o — vạch E2 chỉ ${so(tuongPhan(E2, THE))} : 1 với thẻ trắng, nút trắng trên thẻ trắng chìm mất`,
     nutPhu.length === 2 && nutPhu.every(q => /border\s*:\s*1px solid var\(--vien-o\)/.test(q.trong) && /background\s*:\s*var\(--(nb-the|kem)\)/.test(q.trong)),
     nutPhu.map(q => `${q.boChon}: ${q.trong.match(/border\s*:[^;]+/)?.[0]}`).join(' | '));

  const noiBo = quyTacPhang(boChuThich(doc(join(SRC, 'styles', 'noi-bo.css'))));
  ok('Vòng focus của nội bộ và kho: đen trên nền sáng, trắng (--kem) trên đầu trang đen',
     noiBo.some(q => q.boChon === '.nb-than :focus-visible' && /outline-color\s*:\s*var\(--than\)/.test(q.trong))
     && noiBo.some(q => q.boChon === '.nb-dau :focus-visible, .kho-dau :focus-visible' && /outline-color\s*:\s*var\(--kem\)/.test(q.trong)));
  // Link "Bỏ qua menu" của kho nằm ngoài .kho-dau mà nền đen, hiện đè lên đầu trang đen: vòng đen thì không thấy.
  const khoKhung = quyTacPhang(boChuThich(doc(join(SRC, 'styles', 'kho-khung.css'))));
  ok('Link "Bỏ qua menu" của kho (nền đen, ngoài .kho-dau): vòng focus trắng',
     khoKhung.some(q => q.boChon === '.kho-bo-qua:focus-visible' && /outline-color\s*:\s*var\(--kem\)/.test(q.trong)));
  // Mục đang chọn của cột bên kho nền đen: vòng focus vẽ vào trong dòng, phải trắng.
  ok("Mục đang chọn của cột bên kho (.kho-ben-muc[aria-current='page'], nền đen): vòng focus trắng",
     khoKhung.some(q => q.boChon === ".kho-ben-muc[aria-current='page']:focus-visible" && /outline-color\s*:\s*var\(--kem\)/.test(q.trong)));
});

// ===========================================================================
await nhom('6 · theme-color, MANIFEST CỦA KHO, TRANG BÁO QUÁ TẢI', async () => {
  for (const ten of ['NoiBo.astro', 'Kho.astro']) {
    const mau = doc(join(SRC, 'layouts', ten)).match(/<meta name="theme-color" content="([^"]+)"/)?.[1];
    ok(`layouts/${ten}: theme-color là đen #000000 của bảng 22/10/2026 (màu đầu trang)`, mau?.toUpperCase() === BANG_MAU['--than'], mau ?? 'không thấy thẻ');
  }
  const mf = JSON.parse(doc(MANIFEST));
  ok('manifest.json của kho: theme_color là đen #000000, background_color là xám nhạt #F4F4F4 (màu nền trang kho)',
     mf.theme_color?.toUpperCase() === BANG_MAU['--than'] && mf.background_color?.toUpperCase() === NEN, `${mf.theme_color} · ${mf.background_color}`);

  // Trang 503 "Hệ thống đang bận" tự dựng HTML, không nạp file CSS nào: màu viết thẳng trong chuỗi.
  const quaTai = doc(QUA_TAI);
  const kieu = quaTai.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
  const hex = [...new Set(hexTrong(kieu))];
  ok('qua-tai.ts: trang báo quá tải dùng nền trắng #FFFFFF, chữ đen #000000, nút đỏ #BD0000 chữ trắng',
     /body\s*\{[^}]*background:\s*#FFFFFF;\s*color:\s*#000000/i.test(kieu) && /background:\s*#BD0000;\s*color:\s*#FFFFFF/i.test(kieu), hex.join(' '));
  ok('qua-tai.ts: không mã màu nào ngoài bốn màu đó; chữ phụ là #555555',
     hex.length > 0 && hex.every(h => ['#FFFFFF', '#000000', '#BD0000', '#555555'].includes(h)) && /\.phu\s*\{\s*color:\s*#555555/i.test(kieu), hex.join(' '));
});

// ===========================================================================
// Trạng thái không chỉ khác bằng màu (QĐ2 ngày 25/10/2026; kế hoạch mục 2a luật 1, chốt M15). Bỏ xanh / vàng / đỏ
// nhạt thì hai trạng thái đứng cạnh nhau phải khác nhau ở ít nhất một kênh KHÔNG phải màu, đọc ngay từ CSS:
//   · dấu: phần tử giả ::before / ::after có content (của chính lớp hoặc của phần tử con) — chữ "!", "✓", "+",
//     tam giác (clip-path), vòng tròn (border-radius);
//   · nét: bề rộng / kiểu viền (liền, đứt), vạch box-shadow inset;
//   · hình: clip-path, transform, border-radius;
//   · nền đặc / rỗng;
//   · đảo chữ: chữ sáng trên nền tối ↔ chữ tối trên nền sáng — hai màu chữ chênh ≥ 7 : 1, mỗi màu chữ đọc được
//     trên nền của nó (≥ 4,5 : 1);
//   · biểu tượng trong markup (riêng dòng sự kiện của kho: DongSuKien.astro chọn biểu tượng theo mức).
// Đỏ #BD0000 với #555 chỉ chênh 1,12 : 1, với #767676 là 1,46 : 1 — đổi màu không thôi thì người mù màu đỏ – xanh
// và người in đen trắng không phân biệt được.

/** Màu của một biến (đi qua bí danh của bề mặt nội bộ và kho) → '#RRGGBB'; không biết → null. */
const BI_DANH = { '--nb-the': '--kem', '--nb-nen': '--kem-sau', '--kho-the': '--kem', '--kho-nen': '--kem-sau', '--kho-vach': '--vach', '--kho-vach-dam': '--vien-o' };
function giaiMau(giaTri) {
  const v = (giaTri ?? '').trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
  const bien = v.match(/^var\(\s*(--[a-z0-9-]+)/)?.[1];
  if (!bien) return null;
  const goc = BI_DANH[bien] ?? bien;
  return /^#[0-9a-f]{6}$/i.test(BANG_MAU[goc] ?? '') ? BANG_MAU[goc] : null;
}
/** Thân quy tắc → [[thuộc tính, giá trị], …] theo thứ tự (chuỗi '…;…' trong content không có trong CSS của repo). */
const khaiBaoCua = trong => trong.split(';').map(d => d.trim()).filter(Boolean).flatMap(d => {
  const k = d.indexOf(':');
  return k < 0 ? [] : [[d.slice(0, k).trim().toLowerCase(), d.slice(k + 1).trim()]];
});
/** Một bộ chọn (đã tách dấu phẩy) → các cụm ghép (compound) theo thứ tự, tách ở dấu cách, >, +, ~ ngoài ngoặc. */
function tachCum(bc) {
  const sach = bc.replace(/:global\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, '$1').trim();
  const ra = [];
  let sau = 0, cum = '';
  for (const k of sach) {
    if (k === '(' || k === '[') sau++;
    else if (k === ')' || k === ']') sau--;
    if (sau === 0 && /[\s>+~]/.test(k)) { if (cum) ra.push(cum); cum = ''; continue; }
    cum += k;
  }
  if (cum) ra.push(cum);
  return ra;
}
const LA_DO_RONG = t => /^(?:\d*\.?\d+(?:px|rem|em)|0|thin|medium|thick)$/.test(t);
const LA_KIEU_NET = t => /^(?:none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/.test(t);
const tachGiaTri = v => v.split(/\s+(?![^(]*\))/).filter(Boolean);
/** Chữ ký nét viền (bề rộng + kiểu, bỏ màu) của bốn cạnh, sau khi áp lần lượt các khai báo; viền trong suốt = không viền. */
function chuKyVien(khai) {
  const CANH = ['top', 'right', 'bottom', 'left'];
  const vien = Object.fromEntries(CANH.map(c => [c, { rong: 'medium', kieu: 'none', mau: '' }]));
  const apTat = (cac, v) => {
    const t = tachGiaTri(v);
    for (const c of cac) vien[c] = { rong: t.find(LA_DO_RONG) ?? 'medium', kieu: t.find(LA_KIEU_NET) ?? 'none', mau: t.find(x => !LA_DO_RONG(x) && !LA_KIEU_NET(x)) ?? '' };
  };
  const apBon = (thuocTinh, v) => {
    const t = tachGiaTri(v);
    const theo = [t[0], t[1] ?? t[0], t[2] ?? t[0], t[3] ?? t[1] ?? t[0]];
    CANH.forEach((c, i) => { vien[c][thuocTinh] = theo[i]; });
  };
  for (const [p, v] of khai) {
    let m;
    if (p === 'border') apTat(CANH, v);
    else if ((m = p.match(/^border-(top|right|bottom|left)$/))) apTat([m[1]], v);
    else if (p === 'border-width') apBon('rong', v);
    else if (p === 'border-style') apBon('kieu', v);
    else if (p === 'border-color') apBon('mau', v);
    else if ((m = p.match(/^border-(top|right|bottom|left)-(width|style|color)$/))) vien[m[1]][{ width: 'rong', style: 'kieu', color: 'mau' }[m[2]]] = v;
  }
  const net = CANH.map(c => {
    const { rong, kieu, mau } = vien[c];
    return kieu === 'none' || kieu === 'hidden' || /^0(?:px)?$/.test(rong) || mau === 'transparent' ? '-' : `${rong} ${kieu}`;
  }).join('|');
  // Vạch vẽ bằng box-shadow inset (ô đầu dòng lệch ngưỡng, mục đang chọn của thanh đáy): giữ phần số, bỏ màu.
  const bong = khai.filter(([p]) => p === 'box-shadow').map(([, v]) => v.replace(/var\([^)]*\)|rgba?\([^)]*\)|#[0-9a-f]{3,8}\b|\b[a-z]+\b(?<!inset)/gi, '').replace(/\s+/g, ' ').trim()).at(-1) ?? '';
  return `${net}${bong ? ` · bóng ${bong}` : ''}`;
}
/** Giá trị cuối cùng của một trong các thuộc tính (theo thứ tự khai). */
const giaTriCuoi = (khai, ...ten) => khai.filter(([p]) => ten.includes(p)).at(-1)?.[1] ?? null;
const chuKyHinh = khai => ['clip-path', 'transform', 'rotate', 'border-radius', 'mask', '-webkit-mask']
  .map(p => `${p}:${giaTriCuoi(khai, p) ?? ''}`).join(';');
const laNenDac = khai => {
  const v = giaTriCuoi(khai, 'background', 'background-color');
  return !!v && !/^(?:transparent|none|initial|unset|inherit)$/.test(v.trim());
};
/** Dấu của một phần tử giả: null nếu không sinh ra (content none / normal / không khai); không thì chữ + hình của dấu. */
function chuKyDau(khai) {
  const noiDung = giaTriCuoi(khai, 'content');
  if (!noiDung || /^(?:none|normal)$/.test(noiDung.trim())) return null;
  const chu = noiDung.split(/\s\/\s/)[0].trim().replace(/^(['"])(.*)\1$/, '$2');
  return `«${chu.trim()}» ${chuKyHinh(khai)} ${chuKyVien(khai)} ${laNenDac(khai) ? 'đặc' : 'rỗng'}`;
}

/**
 * Đọc một họ lớp trạng thái từ danh sách quy tắc { boChon, trong }. Trả về { [trạng thái]: { tu, gia: { before, after,
 * con } } } — 'goc' là lớp gốc không kèm trạng thái. Chỉ nhận cụm ghép đúng [lớp gốc] hoặc [lớp gốc, một trạng thái]
 * (cụm có lớp lạ như .chua-doc, hay có giả-lớp như :hover, không thuộc họ).
 */
function docHo(lopGoc, trangThai, quyTac) {
  const ho = Object.fromEntries(['goc', ...trangThai].map(t => [t, { tu: [], gia: { before: [], after: [], con: [] }, coQuyTac: false }]));
  for (const q of quyTac) {
    for (const bc of tachDanhSach(q.boChon)) {
      const cum = tachCum(bc);
      const cuoi = cum.at(-1) ?? '';
      const gia = cuoi.match(/::(before|after)$/)?.[1] ?? null;
      for (let i = 0; i < cum.length; i++) {
        const thanCum = cum[i].replace(/::(?:before|after)$/, '');
        const lop = [...thanCum.matchAll(/\.([\w-]+)/g)].map(m => m[1]);
        if (!lop.includes(lopGoc)) continue;
        if (/:(?!:)/.test(thanCum.replace(/\[[^\]]*\]/g, ''))) break;                 // :hover, :focus, :not(…)…
        const khac = lop.filter(l => l !== lopGoc);
        if (khac.length > 1 || (khac.length === 1 && !trangThai.includes(khac[0]))) break;
        const muc = ho[khac[0] ?? 'goc'];
        const khai = khaiBaoCua(q.trong);
        if (i === cum.length - 1) {
          if (gia) muc.gia[gia].push(...khai); else muc.tu.push(...khai);
          muc.coQuyTac = true;
        } else if (gia) {
          muc.gia.con.push(...khai);   // dấu đặt trên phần tử con (.kho-the-so.vang .kho-the-so-dau::after)
          muc.coQuyTac = true;
        }
        break;
      }
    }
  }
  return ho;
}
/** Các kênh không phải màu của một trạng thái (đã gộp khai báo của lớp gốc trước, trạng thái sau). */
function kenhCua(ho, t) {
  const goc = ho.goc, rieng = ho[t];
  const tu = t === 'goc' ? goc.tu : [...goc.tu, ...rieng.tu];
  const gia = ten => (t === 'goc' ? goc.gia[ten] : [...goc.gia[ten], ...rieng.gia[ten]]);
  const dau = ['before', 'after', 'con'].map(ten => [ten, chuKyDau(gia(ten))]).filter(([, d]) => d).map(([ten, d]) => `${ten}: ${d}`).join(' | ');
  const nen = giaTriCuoi(tu, 'background', 'background-color');
  return {
    dau, net: chuKyVien(tu), hinh: chuKyHinh(tu), nen: laNenDac(tu) ? 'đặc' : 'rỗng',
    chu: giaiMau(giaTriCuoi(tu, 'color')) ?? BANG_MAU['--than'],
    mauNen: laNenDac(tu) ? (giaiMau(nen) ?? null) : THE,
  };
}
/** Kênh không phải màu khác nhau giữa hai trạng thái (rỗng = chỉ khác bằng màu). */
function kenhKhac(a, b, bieuTuong) {
  const ra = [];
  if (a.dau !== b.dau) ra.push('dấu');
  if (a.net !== b.net) ra.push('nét');
  if (a.hinh !== b.hinh) ra.push('hình');
  if (a.nen !== b.nen) ra.push('nền đặc / rỗng');
  if (a.mauNen && b.mauNen && tuongPhan(a.chu, b.chu) >= 7 && tuongPhan(a.chu, a.mauNen) >= 4.5 && tuongPhan(b.chu, b.mauNen) >= 4.5) ra.push('đảo chữ');
  if (bieuTuong && bieuTuong[0] !== bieuTuong[1]) ra.push('biểu tượng');
  return ra;
}

await nhom('7 · TRẠNG THÁI KHÔNG CHỈ KHÁC BẰNG MÀU: DẤU, NÉT, HÌNH, NỀN ĐẶC / RỖNG, ĐẢO CHỮ', async () => {
  const quyTac = GIAO_DIEN_NOI_BO.flatMap(f => quyTacPhang(cssCua(f).khoi).filter(q => !q.trongIn && !q.tuongPhanCao));
  // Biểu tượng của dòng sự kiện (DongSuKien.astro): mức → tên biểu tượng, đọc từ markup.
  const dongSuKien = doc(join(SRC, 'components', 'kho', 'DongSuKien.astro'));
  const bt = dongSuKien.match(/ten=\{c\.muc === 'do' \? '([\w-]+)' : c\.muc === 'vang' \? '([\w-]+)' : '([\w-]+)'\}/);
  const BIEU_TUONG_SU_KIEN = bt ? { do: bt[1], vang: bt[2], xam: bt[3] } : null;
  ok('DongSuKien.astro: mỗi mức của dòng sự kiện một biểu tượng riêng (đỏ / vàng / xám là mã dữ liệu, không phải màu trên màn hình)',
     !!BIEU_TUONG_SU_KIEN && new Set(Object.values(BIEU_TUONG_SU_KIEN)).size === 3, bt ? Object.entries(BIEU_TUONG_SU_KIEN).map(([m, b]) => `${m} → ${b}`).join(' · ') : 'không đọc được biểu tượng theo mức');

  // [tên, lớp gốc, trạng thái, gốc cũng là một trạng thái (dùng không kèm lớp)]
  const HO = [
    ['nhãn .nb-nhan', 'nb-nhan', ['song', 'nhap', 'cho', 'tat', 'thong-tin', 'luu-y'], false],
    ['khối báo .nb-bao (gốc là khung thông tin)', 'nb-bao', ['xong', 'luu-y', 'loi'], true],
    ['nhãn hạn .kho-han', 'kho-han', ['het_han', 'sap_het', 'con_han'], false],
    ['đèn sức khỏe .sk-den', 'sk-den', ['do', 'vang', 'xanh', 'tat'], false],
    ['nhãn đèn .sk-nhan', 'sk-nhan', ['do', 'vang'], false],
    ['dòng sự kiện .kho-sk', 'kho-sk', ['do', 'vang', 'xam'], false],
    ['ô số .kho-o-so', 'kho-o-so', ['gap', 'luu-y'], true],
    ['thẻ số .kho-the-so', 'kho-the-so', ['do', 'vang'], true],
    ['dải báo .kho-dai', 'kho-dai', ['do'], true],
    ['nhãn nhập file .dan-nhan (mặt hàng)', 'dan-nhan', ['them', 'sua', 'giu', 'loi'], false],
    ['nhãn nhập file .dl-nhan (định lượng)', 'dl-nhan', ['them', 'sua', 'giu', 'loi'], false],
    ['nhãn đồng bộ cân .dong-bo-nhan', 'dong-bo-nhan', ['them', 'sua', 'xoa', 'giu', 'khong-len'], false],
    ['chip định mức .dm-chip', 'dm-chip', ['do', 'vang', 'xanh', 'xam'], false],
    ['câu cảnh báo giá bán lẻ .bl-canh', 'bl-canh', ['nang'], true],
  ];
  for (const [ten, lopGoc, trangThai, gocLaTrangThai] of HO) {
    const ho = docHo(lopGoc, trangThai, quyTac);
    const thieu = trangThai.filter(t => !ho[t].coQuyTac);
    const cac = [...(gocLaTrangThai ? ['goc'] : []), ...trangThai.filter(t => ho[t].coQuyTac)];
    const kenh = Object.fromEntries(cac.map(t => [t, kenhCua(ho, t)]));
    const chiMau = [];
    for (let i = 0; i < cac.length; i++) for (let j = i + 1; j < cac.length; j++) {
      const bieuTuong = lopGoc === 'kho-sk' && BIEU_TUONG_SU_KIEN ? [BIEU_TUONG_SU_KIEN[cac[i]], BIEU_TUONG_SU_KIEN[cac[j]]] : null;
      if (kenhKhac(kenh[cac[i]], kenh[cac[j]], bieuTuong).length === 0) chiMau.push(`.${cac[i] === 'goc' ? lopGoc : `${lopGoc}.${cac[i]}`} ↔ .${cac[j] === 'goc' ? lopGoc : `${lopGoc}.${cac[j]}`}`);
    }
    ok(`Trạng thái không chỉ khác bằng màu: ${ten} — từng cặp (${cac.length} trạng thái) khác nhau ở dấu, nét, hình, nền đặc / rỗng, đảo chữ${lopGoc === 'kho-sk' ? ' hoặc biểu tượng' : ''}`,
       !ho.goc.coQuyTac ? false : thieu.length === 0 && chiMau.length === 0,
       [!ho.goc.coQuyTac && `không thấy quy tắc của .${lopGoc}`, thieu.length && `không thấy quy tắc của ${thieu.map(t => `.${lopGoc}.${t}`).join(', ')}`,
        chiMau.length && `chỉ khác màu: ${chiMau.join(' · ')}`].filter(Boolean).join(' — '));
  }

  // Mẫu tự kiểm: phép so phải bắt được hai lớp chỉ khác màu, và nhận đủ từng kênh (kể cả ::after — M12 — và đảo chữ — M15).
  const MAU = docQuyTac(`
    .thu { padding: 2px; border: 1.5px solid transparent; }
    .thu.a { background: var(--do); color: var(--kem); }
    .thu.b { background: var(--than); color: var(--kem); }
    .thu.c { background: var(--kem-dam); color: var(--than); }
    .thu.d { background: var(--do); color: var(--kem); }
    .thu.d::after { content: '!'; content: '!' / ''; position: absolute; }
    .thu.e { background: transparent; border: 1.5px dashed var(--vien-o); }
    .thu.f { background: transparent; border-color: var(--vien-o); }
    .thu.g { background: var(--than); color: var(--kem); clip-path: polygon(50% 0, 100% 100%, 0 100%); }
    .thu.h { background: var(--kem-sau); color: var(--muc-nhat); }
    .thu.k { background: var(--kem-dam); color: var(--than); }
    .thu.chua-doc::after { content: '!'; }
    .thu.k:hover::before { content: '✓'; }
  `).map(q => ({ boChon: q.boChon.replace(/\s+/g, ' '), trong: q.trong }));
  const hoThu = docHo('thu', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'k'], MAU);
  const kt = t => kenhCua(hoThu, t);
  const khac = (x, y) => kenhKhac(kt(x), kt(y), null);
  ok('…phép so bắt được hai lớp chỉ khác màu (nền đỏ ↔ nền đen, cùng chữ trắng; nền E2 ↔ nền F4; lớp lạ .chua-doc và :hover không tính là dấu)',
     khac('a', 'b').length === 0 && khac('h', 'k').length === 0 && khac('c', 'k').length === 0,
     `a↔b: ${khac('a', 'b').join(', ') || '—'} · h↔k: ${khac('h', 'k').join(', ') || '—'} · c↔k: ${khac('c', 'k').join(', ') || '—'}`);
  ok('…và nhận đủ kênh: đảo chữ (đen đặc chữ trắng ↔ E2 chữ đen), dấu ::after, kiểu nét (đứt ↔ liền), hình (clip-path)',
     khac('b', 'c').includes('đảo chữ') && khac('a', 'd').includes('dấu') && khac('e', 'f').includes('nét') && khac('b', 'g').includes('hình'),
     `b↔c: ${khac('b', 'c').join(', ')} · a↔d: ${khac('a', 'd').join(', ')} · e↔f: ${khac('e', 'f').join(', ')} · b↔g: ${khac('b', 'g').join(', ')}`);

  // Hai mức cùng xám — "lưu ý" (K5, nền E2 đặc) và "tắt" (K6, nét đứt #767676, nền trong) — khác nhau ở cả nền lẫn nét,
  // không chỉ một kênh: hai mức này hay đứng cạnh nhau trong cùng một bảng.
  const nbNhan = docHo('nb-nhan', ['luu-y', 'tat'], quyTac);
  const xam = nbNhan['luu-y'].coQuyTac && nbNhan.tat.coQuyTac ? kenhKhac(kenhCua(nbNhan, 'luu-y'), kenhCua(nbNhan, 'tat'), null) : [];
  ok('Hai mức cùng xám (.nb-nhan.luu-y "lưu ý" và .nb-nhan.tat "tắt") khác nhau cả nền đặc / rỗng lẫn nét', xam.includes('nền đặc / rỗng') && xam.includes('nét'), xam.join(', ') || 'không đọc được');

  // Dấu theo kiểu (kế hoạch 2a; bản đồ trạng thái mục 2): nhãn K1 "làm ngay" có "!", nhãn K4 "xong / còn" có "✓",
  // nhãn "thêm" có "+", câu cảnh báo nặng của giá bán lẻ có "!".
  const DAU_THEO_LOP = [
    ['nb-nhan', 'cho', '!'], ['kho-han', 'het_han', '!'], ['sk-nhan', 'do', '!'], ['dm-chip', 'do', '!'], ['bl-canh', 'nang', '!'],
    ['nb-nhan', 'song', '✓'], ['kho-han', 'con_han', '✓'], ['dm-chip', 'xanh', '✓'],
    ['dan-nhan', 'them', '+'], ['dl-nhan', 'them', '+'], ['dong-bo-nhan', 'them', '+'],
  ];
  const thieuDau = DAU_THEO_LOP.filter(([lop, t, dau]) => {
    const ho = docHo(lop, [t], quyTac);
    return !(kenhCua(ho, t).dau.includes(`«${dau}`));
  }).map(([lop, t, dau]) => `.${lop}.${t} thiếu «${dau}»`);
  ok(`Nhãn "làm ngay" (K1) có dấu "!", nhãn "xong / còn hạn" (K4) có "✓", nhãn "thêm" có "+" — ${DAU_THEO_LOP.length} lớp`, thieuDau.length === 0, thieuDau.join(' · '));

  // Dấu viết hai khai báo content: Safari cũ đọc dòng đầu, trình duyệt mới đọc dòng sau (chữ thay thế rỗng, trình đọc màn
  // hình không đọc "chấm than"); không ⚠ (iPhone vẽ thành emoji), không emoji.
  const quyTacDau = quyTac.filter(q => /::(?:before|after)/.test(q.boChon) && HO.some(([, lop, tt]) => tt.some(t => new RegExp(`\\.${lop}\\.${t}(?![\\w-])`).test(q.boChon))));
  const kiemContent = trong => {
    const noiDung = khaiBaoCua(trong).filter(([p]) => p === 'content').map(([, v]) => v);
    const chu = noiDung[0]?.match(/^(['"])(.*)\1$/)?.[2];
    if (!noiDung.length || chu === '' || /^(?:none|normal)$/.test(noiDung[0])) return null;             // không có chữ: hình vẽ, không cần chữ thay thế
    const loi = [];
    if (noiDung.length !== 2 || !new RegExp(`^(['"])${(chu ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1\\s*/\\s*(['"])\\2$`).test(noiDung[1])) loi.push('cần hai khai báo: content: \'X\'; content: \'X\' / \'\'');
    if (/[⚠️]|[\u{1F000}-\u{1FFFF}]/u.test(noiDung.join(' '))) loi.push('có ⚠ hoặc emoji');
    return loi.length ? loi.join(', ') : null;
  };
  const saiContent = quyTacDau.flatMap(q => { const l = kiemContent(q.trong); return l ? [`${q.boChon}: ${l}`] : []; });
  ok(`Dấu vẽ bằng CSS (${quyTacDau.length} quy tắc của các họ trạng thái) có hai khai báo content: 'X' và 'X' / '' (Safari cũ); không ⚠, không emoji`,
     quyTacDau.length >= 5 && saiContent.length === 0, saiContent.slice(0, 6).join(' | '));
  ok('…phép đọc content bắt được dấu chỉ một khai báo, dấu ⚠, và nhận đúng hai khai báo',
     !!kiemContent("content: '!'") && !!kiemContent("content: '⚠ '; content: '⚠ ' / ''") && !kiemContent("content: '! '; content: '! ' / ''; font-weight: 800")
     && !kiemContent("content: ''; position: absolute"));

  // Khối .nb-bao: gốc trung tính (vạch --vien-o, không dấu); dấu của .xong / .luu-y / .loi đặt tuyệt đối — một khối
  // là flex (.nb-bao.xong.nh-so-tang, nhan-hang/[id].astro) thì dấu tĩnh sẽ thành một ô flex.
  const nbBao = docHo('nb-bao', ['xong', 'luu-y', 'loi'], quyTac);
  const vachGoc = giaTriCuoi(nbBao.goc.tu, 'border-left');
  const tuyetDoi = t => giaTriCuoi([...nbBao.goc.gia.before, ...nbBao[t].gia.before], 'position') === 'absolute';
  ok('.nb-bao gốc: vạch trái trung tính var(--vien-o), không dấu (khung không lớp là "thông tin", không giống "xong")',
     !!vachGoc && /var\(--vien-o\)/.test(vachGoc) && !chuKyDau(nbBao.goc.gia.before), vachGoc ?? 'không khai border-left');
  ok('.nb-bao.xong / .luu-y / .loi: mỗi lớp một dấu ::before đặt position: absolute',
     ['xong', 'luu-y', 'loi'].every(t => chuKyDau([...nbBao.goc.gia.before, ...nbBao[t].gia.before]) && tuyetDoi(t)),
     ['xong', 'luu-y', 'loi'].filter(t => !chuKyDau([...nbBao.goc.gia.before, ...nbBao[t].gia.before]) || !tuyetDoi(t)).map(t => `.nb-bao.${t}`).join(', '));
  const hoThuBao = docHo('nb-bao', ['xong'], docQuyTac(".nb-bao { border-left: 6px solid var(--vien-o); } .nb-bao.xong::before { content: '✓'; content: '✓' / ''; }").map(q => ({ boChon: q.boChon.trim(), trong: q.trong })));
  ok('…phép này bắt được dấu ::before không đặt tuyệt đối',
     !(giaTriCuoi([...hoThuBao.goc.gia.before, ...hoThuBao.xong.gia.before], 'position') === 'absolute'));
  // Ô số, thẻ số của kho: dấu ::after đặt tuyệt đối ở góc, lớp gốc position: relative (ô có 2–3 span, một ô là <form>).
  for (const [lop, tt] of [['kho-o-so', ['gap', 'luu-y']], ['kho-the-so', ['do', 'vang']]]) {
    const ho = docHo(lop, tt, quyTac);
    const coDau = t => ['after', 'con'].some(g => chuKyDau([...(g === 'con' ? [] : ho.goc.gia[g]), ...ho[t].gia[g]]));
    const viTri = t => [...ho.goc.gia.after, ...ho[t].gia.after, ...ho[t].gia.con].some(([p, v]) => p === 'position' && v === 'absolute');
    ok(`.${lop}: lớp gốc position: relative; ${tt.map(t => `.${t}`).join(', ')} có dấu ::after đặt tuyệt đối (một lần mỗi ô)`,
       giaTriCuoi(ho.goc.tu, 'position') === 'relative' && tt.every(t => coDau(t) && viTri(t)),
       `gốc position ${giaTriCuoi(ho.goc.tu, 'position') ?? 'không khai'} · ${tt.filter(t => !coDau(t) || !viTri(t)).map(t => `.${lop}.${t}`).join(', ') || 'đủ dấu'}`);
  }

  // Mục đang chọn của thanh đáy kho: chữ đỏ với chữ #555 của mục khác chỉ chênh 1,12 : 1 — thêm đậm 700 và vạch 3px.
  const dangChon = quyTac.filter(q => tachDanhSach(q.boChon).includes(".kho-day-nut[aria-current='page']"));
  const khaiDangChon = dangChon.flatMap(q => khaiBaoCua(q.trong));
  const vach3 = khaiDangChon.some(([p, v]) => (p === 'box-shadow' && /inset\s+0\s+3px\s+0/.test(v)) || (/^border-(?:top|bottom)$/.test(p) && /^3px\s+solid/.test(v)));
  ok("Mục đang chọn của thanh đáy kho (.kho-day-nut[aria-current='page']) không chỉ đổi màu chữ: đậm 700 và vạch 3px",
     Number(giaTriCuoi(khaiDangChon, 'font-weight')) >= 700 && vach3, khaiDangChon.map(([p, v]) => `${p}: ${v}`).join('; ') || 'không thấy quy tắc');
});

process.exit(ketThuc('BẢNG MÀU NỘI BỘ VÀ KHO'));
