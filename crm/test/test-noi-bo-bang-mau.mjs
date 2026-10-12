/**
 * BEEFTOWN — BẢNG MÀU CỦA /noi-bo VÀ KHO
 * ======================================
 *
 *     node test/test-noi-bo-bang-mau.mjs
 *
 * Ngày 09/10/2026 Khánh chốt bảng màu thương hiệu (THUONG-HIEU.md): Beef Red, Cream, Charcoal, Marigold,
 * Warm Stone; ngày 10/10/2026 cho phép vài màu pha chỉ dùng trên màn hình. Trang công khai đổi trước
 * (test-cong-khai-giao-dien.mjs nhóm 6 gác). File này gác hai nơi nhân viên dùng trên web: /noi-bo và kho.
 * Beeftown Cân (chương trình Windows) có kiểm thử màu riêng, cùng PR đổi màu của nó. Bất biến:
 *
 *   1. MỘT BẢNG MÀU. Hai khối :root của web/src/styles/chung.css khai đúng 14 mã của bảng chốt, mỗi biến
 *      một lần, không thêm biến màu nào khác; khối .ck đầu tiên của cong-khai.css (trang công khai) cùng
 *      giá trị — hai nơi chưa gộp, nên đổi một mã mà quên nơi kia là đỏ.
 *   2. HAI BỀ MẶT VÀ MÀU TRẠNG THÁI khai một lần ở .nb-than của noi-bo.css: nền trang --nb-nen (kem sau),
 *      thẻ và mọi thứ nổi lên --nb-the (Cream); xanh = xong, vàng = lưu ý, đỏ = làm ngay. Token của kho
 *      (.kho-than) chỉ trỏ về biến của bảng, không viết mã màu. Mọi biến var(--…) dùng trong file nội bộ
 *      đều có khai — không còn biến mồ côi kèm mã dự phòng.
 *   3. KHÔNG MÃ CŨ, KHÔNG TRẮNG. Không file nội bộ nào (CSS, trang, component, layout, web/src/lib, manifest
 *      của kho) còn mã hex hay bộ ba số RGB của bảng cũ, kể cả trong chú thích. Màu viết cứng còn lại chỉ
 *      là mã của bảng mới — bảng màu thương hiệu không có trắng, như trang công khai. Trắng, đen, xám chỉ
 *      trong @media print (giấy).
 *   4. Ô CỦA TRÌNH DUYỆT KHÔNG TÔ TRẮNG: ô nhập không lớp riêng, ô tự điền, ô đánh dấu, ô chọn một, nút chọn
 *      tệp, hộp thoại đều có nền Cream; ô đánh dấu và ô chọn một tự vẽ, chế độ tương phản cao trả về ô của
 *      hệ thống.
 *   5. TƯƠNG PHẢN (WCAG 2.2, tính ở đây chứ không ước lượng): chữ thường ≥ 4,5 : 1; viền ô nhập và biểu
 *      tượng mang nghĩa ≥ 3 : 1. Marigold và Warm Stone không làm chữ trên nền sáng; chữ đỏ không đặt trên
 *      nền Charcoal. Vòng focus: Charcoal trên nền sáng, Marigold trên đầu trang tối. Ba nền nhạt của màu
 *      trạng thái không sáng hơn thẻ Cream.
 *   6. Thẻ theme-color, manifest của kho, trang báo quá tải dùng mã của bảng mới.
 *
 * Mã chép tay ở đây, KHÔNG đọc từ file CSS: sửa nhầm một mã trong mã nguồn thì phép thử này đỏ.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const SRC = join(WEB, 'src');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — BẢNG MÀU CỦA /noi-bo VÀ KHO');

// ---------------------------------------------------------------------------
// Bảng màu — chép tay từ THUONG-HIEU.md (mục 1 và mục 4)
// ---------------------------------------------------------------------------
const BANG_MAU = {
  '--do': '#A70C0C', '--kem': '#F0E3D0', '--than': '#151008', '--cuc-vang': '#F5AA14', '--da': '#B8A98C',   // năm màu thương hiệu
  '--mu-tat': '#F5AA14',                                   // guideline chỉ có một vàng: hai tên, một mã
  '--do-dam': '#890607', '--do-sau': '#890607',            // một đỏ đậm cho màn hình: hai tên, một mã
  '--kem-sau': '#EBDCC6', '--kem-dam': '#E7D5BC', '--vien-o': '#7A7366',
  '--muc-nhat': 'rgba(21, 16, 8, .68)', '--vach': 'rgba(21, 16, 8, .16)', '--vach-kem': 'rgba(240, 227, 208, .22)',
};
// Hai bề mặt của công cụ, khai ở .nb-than: nền trang và thẻ (cùng mọi thứ nổi lên: thanh điều hướng, thanh đáy,
// menu thả, ô nhập). Thẻ Cream trên nền kem sau — như khối thẻ đặt trên dải kem sau của trang công khai.
const BE_MAT = { '--nb-nen': 'var(--kem-sau)', '--nb-the': 'var(--kem)' };
const NEN = BANG_MAU['--kem-sau'], THE = BANG_MAU['--kem'];
// Màu trạng thái của công cụ: màu chức năng, không thuộc năm màu thương hiệu.
const TRANG_THAI = {
  '--xanh': '#1A683F', '--xanh-nen': '#D3E3C6', '--xanh-vien': '#A3C597',
  '--vang-chu': '#7A5200', '--vang-nen': '#F6DC9E', '--vang-vien': '#DDB65C',
  '--do-nen': '#F2D6CE', '--do-vien': '#DDA79C',
};
// Kho: token chỉ trỏ về biến — nền và thẻ của .nb-than, vạch của bảng, vạch đậm là Warm Stone.
const KHO = { '--kho-nen': 'var(--nb-nen)', '--kho-the': 'var(--nb-the)', '--kho-vach': 'var(--vach)', '--kho-vach-dam': 'var(--da)' };

// Mã của các bảng trước — hex (bảng cũ của web, màu trạng thái cũ, token cũ của kho và của Beeftown Cân, mã dự
// phòng lạc trong vài trang) và bộ ba số RGB trong rgb() / rgba(), có hay không có dấu cách.
const HEX_CU = [
  'B23A2C', '8F2C21', '960F13', 'FBF4E1', 'F5ECD7', 'F1E4C2', '1E160E', 'F2A900', 'F5C211', '8C8577', 'A21E22', '2A2016',   // bảng cũ
  'FFFCF6', 'EFE4D2', 'E0D2BB',                                                                                              // token cũ của kho
  '1F7A4C', 'E9F5EE', 'CDE7D8', 'FFF5DC', 'F3DDA5', 'FFFCF2', 'FFFBF1', 'FDECEA', 'F2C9C3', 'FFF8F7',                         // màu trạng thái cũ
  '8A5A00', 'B07A00', '8A6D00', '9A6B00', '7A5A00', '6B4A00',                                                                // năm sáu sắc "vàng đậm" cũ
  '8E2B20', 'F3E8CC', 'E4D8BC', '6A5D45', '7A6C52', '8A7C62', '3A2D20', 'F3C8C2',                                            // Beeftown Cân
  'B3261E', '2B1D14', 'FBF6EE', 'F3EEE6', 'FFF7E0',                                                                          // mã dự phòng lạc
];
const BO_BA_CU = ['30,22,14', '251,244,225', '178,58,44', '150,15,19', '143,44,33', '20,14,8', '242,169,0'];
const MA_CU = new RegExp(
  `#(?:${HEX_CU.join('|')})\\b|rgba?\\(\\s*(?:${BO_BA_CU.map(b => b.split(',').join('\\s*,\\s*')).join('|')})\\b`, 'gi');

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
/** Mọi quy tắc thường (đi vào trong @media, @container, @supports), kèm cờ "nằm trong @media print". */
function quyTacPhang(css, trongIn = false) {
  return docQuyTac(css).flatMap(q => {
    if (/^@(media|container|supports)\b/.test(q.boChon)) return quyTacPhang(q.trong, trongIn || /^@media[^{]*\bprint\b/.test(q.boChon));
    if (q.boChon.startsWith('@')) return [];
    return [{ boChon: q.boChon.replace(/\s+/g, ' '), trong: q.trong, trongIn }];
  });
}
/** Phần CSS của một file: cả file .css; với .astro / .html / .ts là các khối <style> cộng mọi thuộc tính style. */
function cssCua(tep) {
  const s = doc(tep);
  if (tep.endsWith('.css')) return { khoi: boChuThich(s), noiTuyen: '' };
  const khoi = [...s.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
  const noiTuyen = [...s.matchAll(/\bstyle=(?:"([^"]*)"|\{`([^`]*)`\}|\{[^}]*?'([^']*)'[^}]*\})/g)].map(m => m[1] ?? m[2] ?? m[3] ?? '').join(';\n');
  return { khoi: boChuThich(khoi), noiTuyen };
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
await nhom('1 · MỘT BẢNG MÀU: :root CỦA chung.css ĐÚNG BẢNG CHỐT 09/10/2026, CÙNG GIÁ TRỊ VỚI KHỐI .ck', async () => {
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
await nhom('2 · HAI BỀ MẶT VÀ MÀU TRẠNG THÁI Ở .nb-than, TOKEN CỦA KHO Ở .kho-than, KHÔNG BIẾN MỒ CÔI', async () => {
  const noiBo = boChuThich(doc(join(SRC, 'styles', 'noi-bo.css')));
  const nbThan = docQuyTac(noiBo).find(q => q.boChon === '.nb-than')?.trong ?? '';
  // Đếm khai báo ngoài @media print: bản in khai lại hai bề mặt thành trắng (nhóm 3 kiểm riêng).
  const ngoaiIn = css => docQuyTac(css).filter(q => !/^@media[^{]*\bprint\b/.test(q.boChon)).map(q => `${q.boChon}{${q.trong}}`).join('\n');
  const moiCssNoiBo = GIAO_DIEN_NOI_BO.map(f => { const c = cssCua(f); return ngoaiIn(c.khoi) + '\n' + c.noiTuyen; }).join('\n');
  for (const [bien, giaTri] of Object.entries({ ...BE_MAT, ...TRANG_THAI })) {
    const m = nbThan.match(new RegExp(`(?:^|[;\\s])${bien}\\s*:\\s*([^;]+);`));
    const soLanKhai = (moiCssNoiBo.match(new RegExp(`(?:^|[;{\\s"'\`])${bien}\\s*:`, 'g')) ?? []).length;
    ok(`noi-bo.css .nb-than: ${bien} là ${giaTri}, khai đúng một lần trong cả giao diện nội bộ (ngoài bản in)`,
       !!m && chuanHoa(m[1]) === chuanHoa(giaTri) && soLanKhai === 1, m ? `${m[1].trim()} · khai ${soLanKhai} lần` : 'không thấy trong khối .nb-than đầu tiên');
  }
  ok('noi-bo.css .nb-than: nền trang là --nb-nen (kem sau), chữ than', /(?:^|[;\s])background\s*:\s*var\(--nb-nen\)\s*;/.test(nbThan) && /(?:^|[;\s])color\s*:\s*var\(--than\)\s*;/.test(nbThan));
  ok('Thẻ Cream đặt trên nền kem sau — như khối thẻ trên dải kem sau của trang công khai (thẻ sáng hơn nền, không ngược lại)',
     BE_MAT['--nb-the'] === 'var(--kem)' && BE_MAT['--nb-nen'] === 'var(--kem-sau)' && doSang(THE) > doSang(NEN));

  const khung = boChuThich(doc(join(SRC, 'styles', 'kho-khung.css')));
  const khoThan = docQuyTac(khung).find(q => q.boChon === '.kho-than')?.trong ?? '';
  const khaiKho = new Map([...khoThan.matchAll(/(--kho-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  for (const [bien, giaTri] of Object.entries(KHO)) {
    ok(`kho-khung.css .kho-than: ${bien} là ${giaTri}`, chuanHoa(khaiKho.get(bien) ?? '') === chuanHoa(giaTri), khaiKho.get(bien) ?? 'không khai');
  }
  const mauKhoThua = [...khaiKho].filter(([b, v]) => (/^#/.test(v) || /^rgba?\(/i.test(v)) && !(b in KHO)).map(([b, v]) => `${b}: ${v}`);
  ok('.kho-than không viết mã màu nào: nền, thẻ, vạch của kho trỏ về biến của bảng và của .nb-than (màu trạng thái dùng chung --xanh, --vang-chu, --do-nen…)',
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
// Màu viết cứng được phép trong giao diện nội bộ: CHỈ mã của bảng (kể cả màu trạng thái) — không trắng, không đen.
const HEX_DUOC = new Set([...Object.values(BANG_MAU), ...Object.values(TRANG_THAI)]
  .filter(v => v.startsWith('#')).map(v => v.toUpperCase()));
const HEX_BAN_IN = new Set(['#FFF', '#FFFFFF', '#000', '#000000', '#999', '#EEE']);   // bản in: đen, trắng, xám
const BO_BA_DUOC = new Set(['21,16,8', '240,227,208', '167,12,12', '137,6,7']);        // Charcoal · Cream · Beef Red · đỏ đậm
/** Mọi mã hex màu trong một đoạn CSS (3, 4, 6 hoặc 8 chữ số; bỏ qua #id trong bộ chọn nhờ chỉ đọc phần khai báo). */
const hexTrong = css => [...css.matchAll(/#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi)].map(m => m[0].toUpperCase());
/** Từ khóa màu trắng / đen trong phần khai báo (white-space, black-translucent… không tính). */
const tuKhoaTrangDen = css => [...css.matchAll(/(?<![-\w])(white|black)(?![-\w])/gi)].map(m => m[1].toLowerCase());

await nhom('3 · KHÔNG MÃ CŨ, KHÔNG TRẮNG: MÀU VIẾT CỨNG CHỈ LÀ MÃ CỦA BẢNG MỚI (TRẮNG, ĐEN CHỈ KHI IN)', async () => {
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
  const MAU_THU = ['color: #B23A2C', 'background:#fbf4e1;', 'rgba(30, 22, 14, .68)', 'rgba(30,22,14,.12)', 'rgb(251 , 244,225)', 'var(--kho-xanh, #1f7a4c)', '#FFF5DC', 'rgba(242,169,0,.4)'];
  const lot = MAU_THU.filter(m => !m.match(MA_CU));
  ok(`Bộ lọc mã cũ bắt được ${MAU_THU.length} kiểu viết (hex hoa / thường, rgb() có và không có dấu cách)`, lot.length === 0, lot.join(' | '));
  const MAU_DUNG = ['#A70C0C', 'rgba(21, 16, 8, .16)', 'rgba(240, 227, 208, .22)', '#1A683F', '#F6DC9E', 'margin: 30px 22px 14px'];
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
      if (!q.trongIn) for (const k of tuKhoaTrangDen(q.trong)) tuKhoa.push(`${tuGoc(f)}: ${q.boChon.slice(0, 40)} ${k}`);
    }
    for (const h of hexTrong(c.noiTuyen)) if (!HEX_DUOC.has(h)) la.push(`${tuGoc(f)}: style="…${h}…"`);
    for (const k of tuKhoaTrangDen(c.noiTuyen)) tuKhoa.push(`${tuGoc(f)}: style="…${k}…"`);
    for (const m of (c.khoi + '\n' + c.noiTuyen).matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)) {
      if (!BO_BA_DUOC.has(m.slice(1).join(','))) boBaLa.push(`${tuGoc(f)}: ${m[0]}…)`);
    }
  }
  ok('Màu hex viết cứng trong giao diện nội bộ chỉ là mã của bảng mới và màu trạng thái — không #FFF, không #000 (ngoài bản in)', la.length === 0, la.slice(0, 8).join(' | '));
  ok('Không từ khóa white / black làm màu trong giao diện nội bộ (ngoài bản in)', tuKhoa.length === 0, tuKhoa.slice(0, 8).join(' | '));
  ok('Màu rgb() / rgba() trong giao diện nội bộ chỉ dùng số của Charcoal, Cream, Beef Red, đỏ đậm — không rgb(255, 255, 255)', boBaLa.length === 0, boBaLa.slice(0, 8).join(' | '));
  ok('Bản in (@media print) của nội bộ và kho chỉ đen, trắng, xám — không mã màu, không biến màu', inMau.length === 0, inMau.slice(0, 8).join(' | '));
  // Bộ lọc trắng / đen phải bắt được mọi kiểu viết, và không bắt nhầm white-space hay tên lớp.
  const THU_TRANG = ['background: #fff;', 'color:#FFFFFF', 'background: white;', 'box-shadow: 0 0 0 2px white', 'background:#000'];
  const lotTrang = THU_TRANG.filter(t => hexTrong(t).every(h => HEX_DUOC.has(h)) && tuKhoaTrangDen(t).length === 0);
  ok(`Bộ lọc trắng / đen bắt được ${THU_TRANG.length} kiểu viết; không bắt nhầm white-space, nowrap`,
     lotTrang.length === 0 && tuKhoaTrangDen('white-space: nowrap; content: "white-list"').length === 0, lotTrang.join(' | '));
  const khungIn = quyTacPhang(boChuThich(doc(join(SRC, 'styles', 'kho-khung.css')))).filter(q => q.trongIn);
  ok('kho-khung.css: khi in, nền trang kho là trắng (nền kem không lên giấy)',
     khungIn.some(q => q.boChon === '.kho-than' && /background\s*:\s*#fff\b/i.test(q.trong)));
  const noiBoIn = quyTacPhang(boChuThich(doc(join(SRC, 'styles', 'noi-bo.css')))).filter(q => q.trongIn && q.boChon === '.nb-than');
  ok('noi-bo.css: khi in, hai bề mặt về trắng (--nb-nen, --nb-the) — máy in bật "in nền" cũng không in thẻ, bảng thành mảng kem',
     noiBoIn.some(q => /--nb-nen\s*:\s*#fff\s*;/i.test(q.trong) && /--nb-the\s*:\s*#fff\s*;/i.test(q.trong)));
});

// ===========================================================================
await nhom('4 · Ô CỦA TRÌNH DUYỆT KHÔNG TÔ TRẮNG: Ô NHẬP, Ô TỰ ĐIỀN, Ô ĐÁNH DẤU, NÚT CHỌN TỆP, HỘP THOẠI', async () => {
  const css = boChuThich(doc(join(SRC, 'styles', 'noi-bo.css')));
  const qt = quyTacPhang(css).filter(q => !q.trongIn);
  const tim = (dk) => qt.find(q => dk(q.boChon));
  const coBien = (q, thuocTinh, gt) => !!q && new RegExp(`(?:^|[;\\s])${thuocTinh}\\s*:\\s*${gt.replace(/[()]/g, '\\$&')}\\s*;`).test(q.trong);

  const macDinh = tim(b => b.startsWith(':where(.nb-than) :where(input:not([type])'));
  const LOAI = ['text', 'search', 'tel', 'email', 'number', 'password', 'url', 'date', 'time', 'datetime-local', 'month'];
  ok(`Ô nhập không lớp riêng (bảng sửa nhanh, ô trong dòng…): nền Cream, độ ưu tiên 0 — đủ ${LOAI.length} kiểu ô chữ, select, textarea`,
     coBien(macDinh, 'background-color', 'var(--kem)') && LOAI.every(l => macDinh.boChon.includes(`input[type='${l}']`)) && /\bselect\b/.test(macDinh.boChon) && /\btextarea\b/.test(macDinh.boChon),
     macDinh ? macDinh.boChon.slice(0, 80) : 'không thấy quy tắc');
  const tuDien = tim(b => b.includes(':autofill') && b.includes(':-webkit-autofill') && !b.endsWith(':focus'));
  ok('Ô trình duyệt tự điền: phủ một lớp bóng trong màu Cream (Chrome, Safari không cho đổi nền ô tự điền)',
     !!tuDien && /box-shadow\s*:\s*inset 0 0 0 1000px var\(--kem\)/.test(tuDien.trong) && /-webkit-text-fill-color\s*:\s*var\(--than\)/.test(tuDien.trong));
  const danhDau = tim(b => b === ".nb-than input:is([type='checkbox'], [type='radio'])");
  ok('Ô đánh dấu và ô chọn một tự vẽ: appearance none, nền Cream, viền --vien-o',
     !!danhDau && /(?:^|[;\s])appearance\s*:\s*none/.test(danhDau.trong) && coBien(danhDau, 'background', 'var(--kem)') && /border\s*:\s*1px solid var\(--vien-o\)/.test(danhDau.trong));
  ok('Ô tự vẽ không đặt cỡ, lề ở quy tắc độ ưu tiên cao — cỡ do trang đặt; trang không đặt thì 20px ở quy tắc :where()',
     !!danhDau && !/(?:^|[;\s])(width|height|margin)\s*:/.test(danhDau.trong)
     && coBien(tim(b => b === ":where(.nb-than) input:where([type='checkbox'], [type='radio'])"), 'width', '20px'));
  ok('Ô đánh dấu đã chọn: nền Beef Red, dấu ✓ là nét Cream',
     coBien(tim(b => b === ".nb-than input[type='checkbox']:checked"), 'background', 'var(--do)')
     && /border\s*:\s*solid var\(--kem\)/.test(tim(b => b === ".nb-than input[type='checkbox']::before")?.trong ?? ''));
  ok('Ô chọn một đã chọn: viền đỏ, chấm đỏ', /border\s*:\s*2px solid var\(--do\)/.test(tim(b => b === ".nb-than input[type='radio']:checked")?.trong ?? '')
     && coBien(tim(b => b === ".nb-than input[type='radio']::before"), 'background', 'var(--do)'));
  const tuongPhanCao = docQuyTac(css).find(q => /^@media\s*\(forced-colors:\s*active\)/.test(q.boChon))?.trong ?? '';
  ok('Chế độ tương phản cao (Windows): trả về ô của hệ thống, bỏ dấu ✓ tự vẽ', /appearance\s*:\s*auto/.test(tuongPhanCao) && /content\s*:\s*none/.test(tuongPhanCao));
  ok('Nút "Chọn tệp" của ô tải ảnh: nền Cream, viền --vien-o', coBien(tim(b => b === ".nb-than input[type='file']::file-selector-button"), 'background', 'var(--kem)'));
  ok('Hộp thoại (<dialog>, quét nhãn bằng camera): nền Cream, chữ than', coBien(tim(b => b === '.nb-than dialog'), 'background', 'var(--kem)'));
  ok('Ô nhập không lớp riêng có viền --vien-o: đặt nền thì Chrome bỏ ô vẽ sẵn và rơi về viền 2px lõm sẫm',
     !!macDinh && /border\s*:\s*1px solid var\(--vien-o\)/.test(macDinh.trong));
  ok('Ô tự vẽ trong .nb-o không nhận cao 48px và đệm của ô chữ (thành hình bầu dục): min-height 0, padding 0',
     !!danhDau && /min-height\s*:\s*0\s*;/.test(danhDau.trong) && /(?:^|[;\s])padding\s*:\s*0\s*;/.test(danhDau.trong));
  const accent = GIAO_DIEN_NOI_BO.flatMap(f => { const c = cssCua(f); return /accent-color/.test(c.khoi + c.noiTuyen) ? [tuGoc(f)] : []; });
  ok('Không trang nội bộ nào đặt accent-color — ô đánh dấu tự vẽ không đọc nó', accent.length === 0, accent.join(' | '));

  // Ô nhập có lớp riêng: nền Cream (không phải --nb-the: ô luôn Cream, kể cả khi đặt thẳng trên nền trang).
  const moiQuyTac = GIAO_DIEN_NOI_BO.flatMap(f => quyTacPhang(cssCua(f).khoi).filter(q => !q.trongIn).map(q => ({ ...q, tep: tuGoc(f) })));
  for (const bc of ['.nb-o input, .nb-o select, .nb-o textarea', '.bd-tim input', '.kho-ben-tim', '.sn-bang input[type="text"], .sn-bang select', '.td-o']) {
    const q = moiQuyTac.find(x => x.boChon === bc);
    ok(`Ô nhập "${bc}" nền Cream`, coBien(q, 'background', 'var(--kem)'), q ? q.trong.match(/background\s*:[^;]+/)?.[0] ?? 'không khai nền' : 'không thấy quy tắc');
  }
});

// ===========================================================================
await nhom('5 · TƯƠNG PHẢN CỦA /noi-bo VÀ KHO (WCAG 2.2)', async () => {
  const M = BANG_MAU, T = TRANG_THAI;
  const mucNhat = nen => phaTren(M['--than'], nen, 0.68);
  const NEN_SANG = [['thẻ, ô nhập (Cream)', THE], ['nền trang, đầu bảng (kem sau)', NEN], ['di chuột, nhãn phụ (kem đậm)', M['--kem-dam']]];
  const NEN_NHAT = [['nền đỏ nhạt', T['--do-nen']], ['nền vàng nhạt', T['--vang-nen']], ['nền xanh nhạt', T['--xanh-nen']]];

  kiemCap([...NEN_SANG, ...NEN_NHAT].map(([ten, nen]) => [`chữ than trên ${ten}`, M['--than'], nen, 7]));
  kiemCap([...NEN_SANG, ...NEN_NHAT].map(([ten, nen]) => [`chữ phụ (than 68 %) trên ${ten}`, mucNhat(nen), nen, 4.5]));
  kiemCap([
    ['chữ đỏ trên thẻ Cream (số báo việc, mục đang chọn)', M['--do'], THE, 4.5],
    ['chữ đỏ trên nền trang kem sau', M['--do'], NEN, 4.5],
    ['chữ đỏ trên kem đậm', M['--do'], M['--kem-dam'], 4.5],
    ['chữ đỏ trên nền đỏ nhạt (thẻ "làm ngay")', M['--do'], T['--do-nen'], 4.5],
    ['chữ kem trên đỏ (nút chính, số đỏ, nhãn "chờ")', M['--kem'], M['--do'], 4.5],
    ['chữ kem trên đỏ đậm (nút chính khi di chuột)', M['--kem'], M['--do-dam'], 4.5],
    ['chữ kem trên than (đầu trang, mục đang chọn)', M['--kem'], M['--than'], 7],
    ['chữ Warm Stone trên than (tên vai ở đầu trang)', M['--da'], M['--than'], 4.5],
    ['chữ Marigold trên than (chữ "nội bộ", tên chi nhánh)', M['--cuc-vang'], M['--than'], 4.5],
    ['chữ than trên Marigold (nhãn "nháp", "sắp hết hạn", "xem hôm nay")', M['--than'], M['--mu-tat'], 4.5],
    ['chữ than trên Warm Stone (số bước "không phải việc của mình")', M['--than'], M['--da'], 4.5],
    ['chữ xanh trên thẻ Cream', T['--xanh'], THE, 4.5],
    ['chữ xanh trên nền trang kem sau', T['--xanh'], NEN, 4.5],
    ['chữ xanh trên nền xanh nhạt (nhãn "còn hạn", "thêm")', T['--xanh'], T['--xanh-nen'], 4.5],
    ['chữ kem trên xanh (nhãn "đang chạy", bước đã xong)', M['--kem'], T['--xanh'], 4.5],
    ['chữ "lưu ý" (--vang-chu) trên thẻ Cream', T['--vang-chu'], THE, 4.5],
    ['chữ "lưu ý" trên nền trang kem sau', T['--vang-chu'], NEN, 4.5],
    ['chữ "lưu ý" trên nền vàng nhạt', T['--vang-chu'], T['--vang-nen'], 4.5],
    ['viền ô nhập (--vien-o) trên nền Cream của ô', M['--vien-o'], THE, 3],
    ['viền ô nhập, nút phụ đặt thẳng trên nền trang kem sau', M['--vien-o'], NEN, 3],
    ['viền nút phụ khi di chuột (nền kem đậm)', M['--vien-o'], M['--kem-dam'], 3],
    ['ô đánh dấu đã chọn (Beef Red) trên thẻ Cream', M['--do'], THE, 3],
    ['dấu ✓ Cream trên ô đánh dấu đỏ', M['--kem'], M['--do'], 3],
    ['đèn đỏ trên thẻ Cream', M['--do'], THE, 3],
    ['đèn xanh trên thẻ Cream', T['--xanh'], THE, 3],
    ['viền của đèn vàng và chấm "chưa đọc" (--vang-chu) trên thẻ Cream', T['--vang-chu'], THE, 3],
    ['vòng focus Charcoal trên thẻ Cream', M['--than'], THE, 3],
    ['vòng focus Charcoal trên nền trang kem sau', M['--than'], NEN, 3],
    ['vòng focus Marigold trên đầu trang tối', M['--cuc-vang'], M['--than'], 3],
  ]);
  // Nhãn "tắt" (.nb-nhan.tat): nền --vach (than 16 %), chữ --muc-nhat (than 68 %) — cả hai có độ trong, tính trên từng nền.
  for (const [ten, nen] of NEN_SANG.slice(0, 2)) {
    const nenNhan = phaTren(M['--than'], nen, 0.16);
    const r = tuongPhan(phaTren(M['--than'], nenNhan, 0.68), nenNhan);
    ok(`Tương phản nhãn "tắt" (chữ than 68 % trên nền than 16 %) đặt trên ${ten}: ${so(r)} : 1 (cần ≥ 4,5 : 1)`, r >= 4.5);
  }
  // Ba nền nhạt: sẫm ngang kem sau, không sáng hơn thẻ Cream — sáng hơn thì thành mảng gần trắng giữa thẻ kem.
  ok(`Ba nền nhạt của màu trạng thái không sáng hơn thẻ Cream (độ sáng ${so(doSang(THE))}) — ${NEN_NHAT.map(([t, n]) => `${t} ${so(doSang(n))}`).join(' · ')}`,
     NEN_NHAT.every(([, n]) => doSang(n) <= doSang(THE)));

  // Các cặp bị cấm — số ở đây là lý do của luật.
  const cam = [['Marigold trên thẻ Cream', M['--cuc-vang'], THE], ['Marigold trên nền kem sau', M['--cuc-vang'], NEN],
    ['Warm Stone trên thẻ Cream', M['--da'], THE], ['Warm Stone trên nền kem sau', M['--da'], NEN], ['đỏ trên than', M['--do'], M['--than']]];
  ok(`Các cặp không được dùng làm chữ đều dưới 3 : 1 — ${cam.map(([t, a, b]) => `${t} ${so(tuongPhan(a, b))}`).join(' · ')}`,
     cam.every(([, a, b]) => tuongPhan(a, b) < 3));

  // Luật ấy trong mã: màu chữ là Marigold / Warm Stone chỉ ở các chỗ nằm trên nền Charcoal.
  const NEN_TOI = /^(\.nb-hieu |\.nb-ten |\.kho-hieu |\.kho-nguoi-ten |\.kho-ben-muc\[aria-current='page'\] |\.nb-dau |\.kho-dau )/;
  const chuVang = [], chuDoTrenToi = [];
  let soChuVangTrenToi = 0;
  for (const f of GIAO_DIEN_NOI_BO) {
    const c = cssCua(f);
    for (const q of quyTacPhang(c.khoi)) {
      if (q.trongIn) continue;
      const mauChu = q.trong.match(/(?:^|[;\s])(?:color|fill|stroke)\s*:\s*var\(--(mu-tat|cuc-vang|da)\)/)?.[1];
      if (mauChu) {
        for (const bc of q.boChon.split(',').map(s => s.trim())) {
          if (NEN_TOI.test(bc + ' ')) soChuVangTrenToi++;
          else chuVang.push(`${tuGoc(f)}: ${bc} { color: var(--${mauChu}) }`);
        }
      }
      if (/(?:^|[;\s])color\s*:\s*var\(--do(?:-dam|-sau)?\)/.test(q.trong) && /background(?:-color)?\s*:\s*var\(--than\)/.test(q.trong)) chuDoTrenToi.push(`${tuGoc(f)}: ${q.boChon}`);
    }
    if (/(?:^|[;\s"'`])color\s*:\s*var\(--(mu-tat|cuc-vang|da)\)/.test(c.noiTuyen)) chuVang.push(`${tuGoc(f)}: style="color: var(--…)"`);
  }
  ok(`Marigold và Warm Stone chỉ làm màu chữ / biểu tượng ở chỗ nằm trên nền Charcoal (đầu trang, mục đang chọn của cột bên — ${soChuVangTrenToi} chỗ)`,
     soChuVangTrenToi >= 5 && chuVang.length === 0, chuVang.slice(0, 6).join(' | ') || `chỉ thấy ${soChuVangTrenToi} chỗ dùng — bộ đọc quy tắc có còn đọc được CSS không?`);
  ok('Không quy tắc nào đặt chữ đỏ trên nền Charcoal', chuDoTrenToi.length === 0, chuDoTrenToi.join(' | '));

  // Viền ô nhập: --vien-o. Không ô nào kẻ viền bằng vạch mờ (--vach 1,40 : 1 với Cream, --kho-vach cũng là --vach, Warm Stone 1,83).
  const moiQuyTac = GIAO_DIEN_NOI_BO.flatMap(f => quyTacPhang(cssCua(f).khoi).filter(q => !q.trongIn).map(q => ({ ...q, tep: tuGoc(f) })));
  const O_NHAP = ['.nb-o input, .nb-o select, .nb-o textarea', '.bd-tim input', '.kho-ben-tim', '.sn-bang input[type="text"], .sn-bang select', '.td-o'];
  for (const bc of O_NHAP) {
    const q = moiQuyTac.find(x => x.boChon === bc);
    ok(`Ô nhập "${bc}" kẻ viền bằng --vien-o`, !!q && /border\s*:\s*1px solid var\(--vien-o\)/.test(q.trong), q ? q.trong.match(/border\s*:[^;]+/)?.[0] ?? 'không khai viền' : 'không thấy quy tắc');
  }
  const vienMo = moiQuyTac.filter(q => /\b(input|select|textarea)\b/.test(q.boChon) && !/:checked|:focus|type=['"]?(checkbox|radio|file)/.test(q.boChon)
    && /border(?:-color)?\s*:[^;]*var\(--(vach|kho-vach|kho-vach-dam|da)\)/.test(q.trong)).map(q => `${q.tep}: ${q.boChon}`);
  ok('Không ô nhập nào kẻ viền bằng --vach, --kho-vach, --kho-vach-dam hay Warm Stone', vienMo.length === 0, vienMo.join(' | '));
  const nutPhu = moiQuyTac.filter(q => q.boChon === '.nb-nut.phu' || q.boChon === '.nb-nut-nho-sang');
  ok('Nút phụ (.nb-nut.phu, .nb-nut-nho-sang): nền Cream, viền --vien-o — viền Warm Stone chỉ 1,83 : 1 với thẻ Cream, nút kem trên thẻ kem chìm mất',
     nutPhu.length === 2 && nutPhu.every(q => /border\s*:\s*1px solid var\(--vien-o\)/.test(q.trong) && /background\s*:\s*var\(--(nb-the|kem)\)/.test(q.trong)),
     nutPhu.map(q => `${q.boChon}: ${q.trong.match(/border\s*:[^;]+/)?.[0]}`).join(' | '));

  const noiBo = quyTacPhang(boChuThich(doc(join(SRC, 'styles', 'noi-bo.css'))));
  ok('Vòng focus của nội bộ và kho: Charcoal trên nền sáng, Marigold trên đầu trang tối',
     noiBo.some(q => q.boChon === '.nb-than :focus-visible' && /outline-color\s*:\s*var\(--than\)/.test(q.trong))
     && noiBo.some(q => q.boChon === '.nb-dau :focus-visible, .kho-dau :focus-visible' && /outline-color\s*:\s*var\(--cuc-vang\)/.test(q.trong)));
});

// ===========================================================================
await nhom('6 · theme-color, MANIFEST CỦA KHO, TRANG BÁO QUÁ TẢI', async () => {
  for (const ten of ['NoiBo.astro', 'Kho.astro']) {
    const mau = doc(join(SRC, 'layouts', ten)).match(/<meta name="theme-color" content="([^"]+)"/)?.[1];
    ok(`layouts/${ten}: theme-color là Charcoal của bảng mới (màu đầu trang)`, mau?.toUpperCase() === BANG_MAU['--than'], mau ?? 'không thấy thẻ');
  }
  const mf = JSON.parse(doc(MANIFEST));
  ok('manifest.json của kho: theme_color là Charcoal, background_color là kem sau (màu nền trang kho)',
     mf.theme_color?.toUpperCase() === BANG_MAU['--than'] && mf.background_color?.toUpperCase() === NEN, `${mf.theme_color} · ${mf.background_color}`);

  // Trang 503 "Hệ thống đang bận" tự dựng HTML, không nạp file CSS nào: màu viết thẳng trong chuỗi.
  const quaTai = doc(QUA_TAI);
  const kieu = quaTai.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
  const hex = [...new Set(hexTrong(kieu))];
  ok('qua-tai.ts: trang báo quá tải dùng nền Cream, chữ Charcoal, nút Beef Red chữ Cream',
     /body\s*\{[^}]*background:\s*#F0E3D0;\s*color:\s*#151008/i.test(kieu) && /background:\s*#A70C0C;\s*color:\s*#F0E3D0/i.test(kieu), hex.join(' '));
  ok('qua-tai.ts: không mã màu nào ngoài ba màu đó; chữ phụ là Charcoal 68 %',
     hex.every(h => ['#F0E3D0', '#151008', '#A70C0C'].includes(h)) && /\.phu\s*\{\s*color:\s*rgba\(21, 16, 8, \.68\)/.test(kieu), hex.join(' '));
});

process.exit(ketThuc('BẢNG MÀU NỘI BỘ VÀ KHO'));
