/**
 * BEEFTOWN — BẢNG MÀU CỦA /noi-bo, KHO VÀ BEEFTOWN CÂN
 * =====================================================
 *
 *     node test/test-noi-bo-bang-mau.mjs
 *
 * Ngày 09/10/2026 Khánh chốt bảng màu thương hiệu (THUONG-HIEU.md): Beef Red, Cream, Charcoal, Marigold,
 * Warm Stone; ngày 10/10/2026 cho phép vài màu pha chỉ dùng trên màn hình. Trang công khai đổi trước
 * (test-cong-khai-giao-dien.mjs nhóm 6 gác). File này gác ba nơi nhân viên dùng: /noi-bo, kho và chương
 * trình Windows Beeftown Cân. Bất biến:
 *
 *   1. MỘT BẢNG MÀU. Hai khối :root của web/src/styles/chung.css khai đúng 14 mã của bảng chốt, mỗi biến
 *      một lần, không thêm biến màu nào khác; khối .ck đầu tiên của cong-khai.css (trang công khai) cùng
 *      giá trị — hai nơi chưa gộp, nên đổi một mã mà quên nơi kia là đỏ.
 *   2. MÀU TRẠNG THÁI (xanh = xong, vàng = lưu ý, đỏ = làm ngay) khai một lần ở .nb-than của noi-bo.css;
 *      token nền, vạch, viền của kho (.kho-than) cùng mã với Cream, kem đậm, Warm Stone. Mọi biến var(--…)
 *      dùng trong file nội bộ đều có khai — không còn biến mồ côi kèm mã dự phòng.
 *   3. KHÔNG CÒN MÃ CŨ. Không file nội bộ nào (CSS, trang, component, layout, web/src/lib, manifest của
 *      kho) còn mã hex hay bộ ba số RGB của bảng cũ, kể cả trong chú thích. Màu viết cứng còn lại chỉ là
 *      mã của bảng mới, trắng, đen; trong @media print chỉ đen, trắng, xám.
 *   4. TƯƠNG PHẢN (WCAG 2.2, tính ở đây chứ không ước lượng): chữ thường ≥ 4,5 : 1; viền ô nhập và biểu
 *      tượng mang nghĩa ≥ 3 : 1. Marigold và Warm Stone không làm chữ trên nền sáng; chữ đỏ không đặt trên
 *      nền Charcoal. Vòng focus: Charcoal trên nền sáng, Marigold trên đầu trang tối.
 *   5. BEEFTOWN CÂN (can-app/src/giao-dien.html, huong-dan.html) khai cùng bảng, hai file giống nhau, không
 *      còn mã cũ, các cặp chữ / nền chính đủ tương phản.
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
const CAN = join(GOC, 'can-app', 'src');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — BẢNG MÀU CỦA /noi-bo, KHO VÀ BEEFTOWN CÂN');

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
// Màu trạng thái của công cụ: màu chức năng, không thuộc năm màu thương hiệu.
const TRANG_THAI = {
  '--xanh': '#1A683F', '--xanh-nen': '#E4F0E5', '--xanh-vien': '#B9D8C0',
  '--vang-chu': '#7A5200', '--vang-nen': '#FDE9B5', '--vang-vien': '#E8C36A',
  '--do-nen': '#FAE9E6', '--do-vien': '#E8BDB7',
};
// Kho: nền, vạch, viền thuộc họ Cream — mỗi biến cùng mã với một màu của bảng.
const KHO = { '--kho-nen': BANG_MAU['--kem'], '--kho-the': '#FFFFFF', '--kho-vach': BANG_MAU['--kem-dam'], '--kho-vach-dam': BANG_MAU['--da'] };

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
const CAN_HTML = ['giao-dien.html', 'huong-dan.html'].map(f => join(CAN, f));

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
await nhom('2 · MÀU TRẠNG THÁI Ở .nb-than, TOKEN CỦA KHO Ở .kho-than, KHÔNG BIẾN MỒ CÔI', async () => {
  const noiBo = boChuThich(doc(join(SRC, 'styles', 'noi-bo.css')));
  const nbThan = docQuyTac(noiBo).find(q => q.boChon === '.nb-than')?.trong ?? '';
  const moiCssNoiBo = GIAO_DIEN_NOI_BO.map(f => { const c = cssCua(f); return c.khoi + '\n' + c.noiTuyen; }).join('\n');
  for (const [bien, giaTri] of Object.entries(TRANG_THAI)) {
    const m = nbThan.match(new RegExp(`(?:^|[;\\s])${bien}\\s*:\\s*([^;]+);`));
    const soLanKhai = (moiCssNoiBo.match(new RegExp(`(?:^|[;{\\s"'\`])${bien}\\s*:`, 'g')) ?? []).length;
    ok(`noi-bo.css .nb-than: ${bien} là ${giaTri}, khai đúng một lần trong cả giao diện nội bộ`,
       !!m && chuanHoa(m[1]) === chuanHoa(giaTri) && soLanKhai === 1, m ? `${m[1].trim()} · khai ${soLanKhai} lần` : 'không thấy trong khối .nb-than đầu tiên');
  }

  const khung = boChuThich(doc(join(SRC, 'styles', 'kho-khung.css')));
  const khoThan = docQuyTac(khung).find(q => q.boChon === '.kho-than')?.trong ?? '';
  const khaiKho = new Map([...khoThan.matchAll(/(--kho-[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
  for (const [bien, giaTri] of Object.entries(KHO)) {
    ok(`kho-khung.css .kho-than: ${bien} là ${giaTri}`, chuanHoa(khaiKho.get(bien) ?? '') === chuanHoa(giaTri), khaiKho.get(bien) ?? 'không khai');
  }
  ok('Nền, vạch, viền của kho thuộc họ Cream: --kho-nen = Cream, --kho-vach = kem đậm, --kho-vach-dam = Warm Stone; thẻ trắng',
     KHO['--kho-nen'] === '#F0E3D0' && KHO['--kho-vach'] === '#E7D5BC' && KHO['--kho-vach-dam'] === '#B8A98C' && KHO['--kho-the'] === '#FFFFFF');
  const mauKhoThua = [...khaiKho].filter(([b, v]) => (/^#/.test(v) || /^rgba?\(/i.test(v)) && !(b in KHO)).map(([b, v]) => `${b}: ${v}`);
  ok('.kho-than không khai biến màu --kho-… nào khác (màu trạng thái dùng chung --xanh, --vang-chu, --do-nen… của .nb-than)',
     mauKhoThua.length === 0, mauKhoThua.join(' · '));

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
// Màu viết cứng được phép trong giao diện nội bộ: mã của bảng (kể cả màu trạng thái), trắng, đen.
const HEX_DUOC = new Set([...Object.values(BANG_MAU), ...Object.values(TRANG_THAI), ...Object.values(KHO)]
  .filter(v => v.startsWith('#')).map(v => v.toUpperCase()).concat(['#FFF', '#FFFFFF', '#000', '#000000']));
const HEX_BAN_IN = new Set(['#FFF', '#FFFFFF', '#000', '#000000', '#999', '#EEE']);   // bản in: đen, trắng, xám
const BO_BA_DUOC = new Set(['21,16,8', '240,227,208', '167,12,12', '137,6,7']);        // Charcoal · Cream · Beef Red · đỏ đậm
/** Mọi mã hex màu trong một đoạn CSS (3, 4, 6 hoặc 8 chữ số; bỏ qua #id trong bộ chọn nhờ chỉ đọc phần khai báo). */
const hexTrong = css => [...css.matchAll(/#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi)].map(m => m[0].toUpperCase());

await nhom('3 · KHÔNG FILE NỘI BỘ NÀO CÒN MÃ MÀU CỦA BẢNG CŨ; MÀU VIẾT CỨNG CHỈ LÀ MÃ CỦA BẢNG MỚI', async () => {
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
  const MAU_DUNG = ['#A70C0C', 'rgba(21, 16, 8, .16)', 'rgba(240, 227, 208, .22)', '#1A683F', '#FDE9B5', 'margin: 30px 22px 14px'];
  const batNham = MAU_DUNG.filter(m => m.match(MA_CU));
  ok('Bộ lọc mã cũ không bắt nhầm mã của bảng mới hay số đo', batNham.length === 0, batNham.join(' | '));

  // Màu viết cứng: ngoài @media print chỉ mã của bảng, trắng, đen; trong @media print chỉ đen, trắng, xám.
  const la = [], inMau = [], boBaLa = [];
  for (const f of GIAO_DIEN_NOI_BO) {
    const c = cssCua(f);
    for (const q of quyTacPhang(c.khoi)) {
      const duoc = q.trongIn ? HEX_BAN_IN : HEX_DUOC;
      for (const h of hexTrong(q.trong)) if (!duoc.has(h)) (q.trongIn ? inMau : la).push(`${tuGoc(f)}: ${q.boChon.slice(0, 40)} ${h}`);
      if (q.trongIn && /var\(--(do|do-dam|do-sau|mu-tat|cuc-vang|xanh|vang-chu|kem|kem-sau|kem-dam|kho-nen)\)/.test(q.trong)) inMau.push(`${tuGoc(f)}: ${q.boChon.slice(0, 40)} dùng biến màu`);
    }
    for (const h of hexTrong(c.noiTuyen)) if (!HEX_DUOC.has(h)) la.push(`${tuGoc(f)}: style="…${h}…"`);
    for (const m of (c.khoi + '\n' + c.noiTuyen).matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)) {
      if (!BO_BA_DUOC.has(m.slice(1).join(','))) boBaLa.push(`${tuGoc(f)}: ${m[0]}…)`);
    }
  }
  ok('Màu hex viết cứng trong giao diện nội bộ chỉ là mã của bảng mới, màu trạng thái, trắng, đen', la.length === 0, la.slice(0, 8).join(' | '));
  ok('Màu rgb() / rgba() trong giao diện nội bộ chỉ dùng số của Charcoal, Cream, Beef Red, đỏ đậm', boBaLa.length === 0, boBaLa.slice(0, 8).join(' | '));
  ok('Bản in (@media print) của nội bộ và kho chỉ đen, trắng, xám — không mã màu, không biến màu', inMau.length === 0, inMau.slice(0, 8).join(' | '));
  const khungIn = quyTacPhang(boChuThich(doc(join(SRC, 'styles', 'kho-khung.css')))).filter(q => q.trongIn);
  ok('kho-khung.css: khi in, nền trang kho là trắng (nền kem không lên giấy)',
     khungIn.some(q => q.boChon === '.kho-than' && /background\s*:\s*#fff\b/i.test(q.trong)));
});

// ===========================================================================
await nhom('4 · TƯƠNG PHẢN CỦA /noi-bo VÀ KHO (WCAG 2.2)', async () => {
  const M = BANG_MAU, T = TRANG_THAI, TRANG = '#FFFFFF';
  const mucNhat = nen => phaTren(M['--than'], nen, 0.68);
  const NEN_SANG = [['thẻ trắng', TRANG], ['nền kem', M['--kem']], ['kem sau (đầu bảng)', M['--kem-sau']], ['kem đậm', M['--kem-dam']]];
  const NEN_NHAT = [['nền đỏ nhạt', T['--do-nen']], ['nền vàng nhạt', T['--vang-nen']], ['nền xanh nhạt', T['--xanh-nen']]];

  kiemCap([...NEN_SANG, ...NEN_NHAT].map(([ten, nen]) => [`chữ than trên ${ten}`, M['--than'], nen, 7]));
  kiemCap([...NEN_SANG, ...NEN_NHAT].map(([ten, nen]) => [`chữ phụ (than 68 %) trên ${ten}`, mucNhat(nen), nen, 4.5]));
  kiemCap([
    ['chữ đỏ trên thẻ trắng (số báo việc, mục đang chọn)', M['--do'], TRANG, 4.5],
    ['chữ đỏ trên nền kem', M['--do'], M['--kem'], 4.5],
    ['chữ đỏ trên kem sau', M['--do'], M['--kem-sau'], 4.5],
    ['chữ đỏ trên nền đỏ nhạt (thẻ "làm ngay")', M['--do'], T['--do-nen'], 4.5],
    ['chữ trắng trên đỏ (nút chính, số đỏ, nhãn "chờ")', TRANG, M['--do'], 4.5],
    ['chữ trắng trên đỏ đậm (nút chính khi di chuột)', TRANG, M['--do-dam'], 4.5],
    ['chữ kem trên đỏ (nút của trang báo quá tải)', M['--kem'], M['--do'], 4.5],
    ['chữ kem trên than (đầu trang, mục đang chọn)', M['--kem'], M['--than'], 7],
    ['chữ Warm Stone trên than (tên vai ở đầu trang)', M['--da'], M['--than'], 4.5],
    ['chữ Marigold trên than (chữ "nội bộ", tên chi nhánh)', M['--cuc-vang'], M['--than'], 4.5],
    ['chữ than trên Marigold (nhãn "nháp", "sắp hết hạn", "xem hôm nay")', M['--than'], M['--mu-tat'], 4.5],
    ['chữ than trên Warm Stone (số bước "không phải việc của mình")', M['--than'], M['--da'], 4.5],
    ['chữ xanh trên thẻ trắng', T['--xanh'], TRANG, 4.5],
    ['chữ xanh trên nền kem', T['--xanh'], M['--kem'], 4.5],
    ['chữ xanh trên kem sau', T['--xanh'], M['--kem-sau'], 4.5],
    ['chữ xanh trên nền xanh nhạt (nhãn "còn hạn", "thêm")', T['--xanh'], T['--xanh-nen'], 4.5],
    ['chữ trắng trên xanh (nhãn "đang chạy", bước đã xong)', TRANG, T['--xanh'], 4.5],
    ['chữ "lưu ý" (--vang-chu) trên thẻ trắng', T['--vang-chu'], TRANG, 4.5],
    ['chữ "lưu ý" trên nền kem', T['--vang-chu'], M['--kem'], 4.5],
    ['chữ "lưu ý" trên kem sau', T['--vang-chu'], M['--kem-sau'], 4.5],
    ['chữ "lưu ý" trên nền vàng nhạt', T['--vang-chu'], T['--vang-nen'], 4.5],
    ['viền ô nhập trên nền trắng của ô', M['--vien-o'], TRANG, 3],
    ['viền ô nhập trên nền kem (đèn "chưa bật" ở dòng tóm tắt)', M['--vien-o'], M['--kem'], 3],
    ['đèn đỏ trên thẻ trắng', M['--do'], TRANG, 3],
    ['đèn xanh trên thẻ trắng', T['--xanh'], TRANG, 3],
    ['viền của đèn vàng và chấm "chưa đọc" (--vang-chu) trên thẻ trắng', T['--vang-chu'], TRANG, 3],
    ['vòng focus Charcoal trên nền kem', M['--than'], M['--kem'], 3],
    ['vòng focus Marigold trên đầu trang tối', M['--cuc-vang'], M['--than'], 3],
  ]);
  // Nhãn "tắt" (.nb-nhan.tat): nền --vach (than 16 %), chữ --muc-nhat (than 68 %) — cả hai có độ trong, tính trên từng nền.
  for (const [ten, nen] of NEN_SANG.slice(0, 2)) {
    const nenNhan = phaTren(M['--than'], nen, 0.16);
    const r = tuongPhan(phaTren(M['--than'], nenNhan, 0.68), nenNhan);
    ok(`Tương phản nhãn "tắt" (chữ than 68 % trên nền than 16 %) đặt trên ${ten}: ${so(r)} : 1 (cần ≥ 4,5 : 1)`, r >= 4.5);
  }

  // Ba cặp bị cấm — số ở đây là lý do của luật.
  const cam = [['Marigold trên thẻ trắng', M['--cuc-vang'], TRANG], ['Marigold trên nền kem', M['--cuc-vang'], M['--kem']],
    ['Warm Stone trên thẻ trắng', M['--da'], TRANG], ['Warm Stone trên nền kem', M['--da'], M['--kem']], ['đỏ trên than', M['--do'], M['--than']]];
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

  // Viền ô nhập: --vien-o. Không ô nào kẻ viền bằng vạch mờ (--vach 1,41 : 1, --kho-vach 1,43, Warm Stone 2,31).
  const moiQuyTac = GIAO_DIEN_NOI_BO.flatMap(f => quyTacPhang(cssCua(f).khoi).filter(q => !q.trongIn).map(q => ({ ...q, tep: tuGoc(f) })));
  const O_NHAP = ['.nb-o input, .nb-o select, .nb-o textarea', '.bd-tim input', '.kho-ben-tim', '.sn-bang input[type="text"], .sn-bang select', '.td-o'];
  for (const bc of O_NHAP) {
    const q = moiQuyTac.find(x => x.boChon === bc);
    ok(`Ô nhập "${bc}" kẻ viền bằng --vien-o`, !!q && /border\s*:\s*1px solid var\(--vien-o\)/.test(q.trong), q ? q.trong.match(/border\s*:[^;]+/)?.[0] ?? 'không khai viền' : 'không thấy quy tắc');
  }
  const vienMo = moiQuyTac.filter(q => /\b(input|select|textarea)\b/.test(q.boChon) && !/:checked|:focus|type=['"]?(checkbox|radio|file)/.test(q.boChon)
    && /border(?:-color)?\s*:[^;]*var\(--(vach|kho-vach|kho-vach-dam|da)\)/.test(q.trong)).map(q => `${q.tep}: ${q.boChon}`);
  ok('Không ô nhập nào kẻ viền bằng --vach, --kho-vach, --kho-vach-dam hay Warm Stone', vienMo.length === 0, vienMo.join(' | '));

  const noiBo = quyTacPhang(boChuThich(doc(join(SRC, 'styles', 'noi-bo.css'))));
  ok('Vòng focus của nội bộ và kho: Charcoal trên nền sáng, Marigold trên đầu trang tối',
     noiBo.some(q => q.boChon === '.nb-than :focus-visible' && /outline-color\s*:\s*var\(--than\)/.test(q.trong))
     && noiBo.some(q => q.boChon === '.nb-dau :focus-visible, .kho-dau :focus-visible' && /outline-color\s*:\s*var\(--cuc-vang\)/.test(q.trong)));
});

// ===========================================================================
// Beeftown Cân chạy không mạng nên khai lại bảng màu trong từng file HTML. Tên biến riêng của nó: --vach là kem
// đậm, --chu-phu là Charcoal 68 % (--muc-nhat của web), --trang là trắng.
const BANG_CAN = {
  '--do': BANG_MAU['--do'], '--do-dam': BANG_MAU['--do-dam'], '--kem': BANG_MAU['--kem'], '--kem-sau': BANG_MAU['--kem-sau'],
  '--mu-tat': BANG_MAU['--mu-tat'], '--than': BANG_MAU['--than'], '--da': BANG_MAU['--da'], '--vach': BANG_MAU['--kem-dam'], '--trang': '#FFFFFF',
  '--vien-o': BANG_MAU['--vien-o'], '--chu-phu': BANG_MAU['--muc-nhat'],
  '--xanh': TRANG_THAI['--xanh'], '--xanh-nen': TRANG_THAI['--xanh-nen'], '--do-nen': TRANG_THAI['--do-nen'],
  '--vang-nen': TRANG_THAI['--vang-nen'], '--vang-chu': TRANG_THAI['--vang-chu'],
};
// Màu viết cứng được phép ngoài khối :root của Beeftown Cân: trắng; mực và nét gạch của tờ tem vẽ thử (#111, #b9b9b9);
// màn hình tinh thể lỏng của cân vẽ trong hướng dẫn (#1f261e, #a8ef9b, #c9d7c5) — hình của vật thật, không phải màu giao diện.
const HEX_CAN_DUOC = new Set(['#FFF', '#FFFFFF', '#111', '#B9B9B9', '#1F261E', '#A8EF9B', '#C9D7C5']);
const BO_BA_CAN_DUOC = new Set(['21,16,8', '240,227,208', '167,12,12', '245,170,20', '0,0,0']);

await nhom('5 · BEEFTOWN CÂN: CÙNG BẢNG MÀU, HAI FILE GIỐNG NHAU, KHÔNG CÒN MÃ CŨ', async () => {
  const khaiCua = {};
  for (const f of CAN_HTML) {
    const ten = tuGoc(f);
    const s = doc(f);
    const css = boChuThich(s.match(/<style\b[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? '');
    const root = docQuyTac(css).find(q => q.boChon === ':root')?.trong ?? '';
    const khai = new Map([...root.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
    khaiCua[ten] = khai;
    for (const [bien, giaTri] of Object.entries(BANG_CAN)) {
      ok(`${ten} :root: ${bien} là ${giaTri}`, chuanHoa(khai.get(bien) ?? '') === chuanHoa(giaTri), khai.get(bien) ?? 'không khai');
    }
    const thua = [...khai.keys()].filter(b => !(b in BANG_CAN));
    ok(`${ten}: :root không khai biến nào ngoài ${Object.keys(BANG_CAN).length} biến của bảng`, thua.length === 0, thua.join(', '));
    ok(`${ten}: chỉ một khối :root`, docQuyTac(css).filter(q => q.boChon === ':root').length === 1);

    const conCu = [...new Set(s.match(MA_CU) ?? [])];
    ok(`${ten}: không còn mã màu của bảng cũ (hex hoặc bộ ba RGB), kể cả trong chú thích và trong mã JavaScript`, conCu.length === 0, conCu.join(' '));

    // Màu viết cứng ngoài khối :root: trong <style>, trong thuộc tính style và trong chuỗi của mã JavaScript dựng HTML.
    const ngoaiRoot = css.replace(/:root\s*\{[^{}]*\}/, '');
    const noiTuyen = [...s.replace(/<style\b[\s\S]*?<\/style>/, '').matchAll(/style="([^"]*)"|style=\\?'([^']*)'/g)].map(m => m[1] ?? m[2]).join(';');
    const la = [...new Set([...hexTrong(quyTacPhang(ngoaiRoot).map(q => q.trong).join(';')), ...hexTrong(noiTuyen)].filter(h => !HEX_CAN_DUOC.has(h)))];
    ok(`${ten}: ngoài khối :root không viết cứng mã màu nào (trừ trắng, mực của tờ tem vẽ thử, màn hình cân vẽ trong hướng dẫn)`, la.length === 0, la.join(' '));
    const boBaLa = [...(ngoaiRoot + ';' + noiTuyen).matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)].map(m => m.slice(1).join(',')).filter(b => !BO_BA_CAN_DUOC.has(b));
    ok(`${ten}: rgb() / rgba() chỉ dùng số của bảng mới (và đen cho bóng đổ)`, boBaLa.length === 0, boBaLa.join(' · '));
    const chuVang = quyTacPhang(ngoaiRoot).filter(q => !q.trongIn && /(?:^|[;\s])color\s*:\s*var\(--(mu-tat|da)\)/.test(q.trong)
      && !/^(header|header\.dau|\.phan)\b/.test(q.boChon)).map(q => q.boChon);
    ok(`${ten}: Marigold và Warm Stone chỉ làm chữ trên nền Charcoal (đầu trang, khối mở đầu từng phần)`, chuVang.length === 0, chuVang.join(' | '));
    const oNhap = quyTacPhang(ngoaiRoot).filter(q => /(^|[\s,])(input|textarea|select)\b/.test(q.boChon) && !/checkbox|radio/.test(q.boChon) && /border\s*:/.test(q.trong));
    const oMo = oNhap.filter(q => !/border\s*:\s*1px solid var\(--vien-o\)/.test(q.trong)).map(q => q.boChon);
    const canCo = ten.endsWith('giao-dien.html') ? 4 : 0;   // hướng dẫn không có ô nhập nào
    ok(`${ten}: mọi ô nhập kẻ viền bằng --vien-o (4,70 : 1 với nền trắng của ô) — ${oNhap.length} quy tắc`, oNhap.length >= canCo && oMo.length === 0,
       oMo.join(' | ') || `chỉ thấy ${oNhap.length} quy tắc ô nhập, cần ít nhất ${canCo}`);
  }
  const [a, b] = CAN_HTML.map(f => khaiCua[tuGoc(f)]);
  const lech = [...new Set([...a.keys(), ...b.keys()])].filter(k => chuanHoa(a.get(k) ?? '') !== chuanHoa(b.get(k) ?? ''));
  ok('giao-dien.html và huong-dan.html khai cùng bộ biến, cùng giá trị', a.size > 0 && lech.length === 0, lech.join(', '));

  const C = BANG_CAN, TRANG = '#FFFFFF';
  const chuPhu = nen => phaTren(C['--than'], nen, 0.68);
  kiemCap([
    ['Beeftown Cân — chữ than trên nền kem', C['--than'], C['--kem'], 7],
    ['Beeftown Cân — chữ than trên thẻ trắng', C['--than'], TRANG, 7],
    ['Beeftown Cân — chữ phụ (than 68 %) trên thẻ trắng', chuPhu(TRANG), TRANG, 4.5],
    ['Beeftown Cân — chữ phụ trên nền kem (tên thẻ chưa chọn)', chuPhu(C['--kem']), C['--kem'], 4.5],
    ['Beeftown Cân — chữ phụ trên kem sau (nhãn "giữ nguyên")', chuPhu(C['--kem-sau']), C['--kem-sau'], 4.5],
    ['Beeftown Cân — chữ trắng trên đỏ (nút chính)', TRANG, C['--do'], 4.5],
    ['Beeftown Cân — chữ trắng trên đỏ đậm (nút chính khi di chuột)', TRANG, C['--do-dam'], 4.5],
    ['Beeftown Cân — chữ BEEFTOWN (Marigold) trên đầu trang than', C['--mu-tat'], C['--than'], 4.5],
    ['Beeftown Cân — chữ Warm Stone trên đầu trang than', C['--da'], C['--than'], 4.5],
    ['Beeftown Cân — chữ kem trên than (thẻ lọc đang chọn)', C['--kem'], C['--than'], 7],
    ['Beeftown Cân — chữ than trên Marigold (nhãn "sửa", "cận date")', C['--than'], C['--mu-tat'], 4.5],
    ['Beeftown Cân — chữ xanh trên nền xanh nhạt (nhãn "thêm", "đủ")', C['--xanh'], C['--xanh-nen'], 4.5],
    ['Beeftown Cân — chữ cảnh báo (--vang-chu) trên thẻ trắng', C['--vang-chu'], TRANG, 4.5],
    ['Beeftown Cân — chữ cảnh báo trên nền vàng nhạt', C['--vang-chu'], C['--vang-nen'], 4.5],
    ['Beeftown Cân — chữ đỏ đậm trên nền vàng nhạt (cảnh báo ô thông số)', C['--do-dam'], C['--vang-nen'], 4.5],
    ['Beeftown Cân — chữ than trên nền đỏ nhạt (khung báo lỗi)', C['--than'], C['--do-nen'], 7],
    ['Beeftown Cân — viền ô nhập trên nền trắng của ô', C['--vien-o'], TRANG, 3],
    ['Beeftown Cân — đèn "chưa rõ" (--vien-o) trên thẻ trắng', C['--vien-o'], TRANG, 3],
  ]);
});

// ===========================================================================
await nhom('6 · theme-color, MANIFEST CỦA KHO, TRANG BÁO QUÁ TẢI', async () => {
  for (const ten of ['NoiBo.astro', 'Kho.astro']) {
    const mau = doc(join(SRC, 'layouts', ten)).match(/<meta name="theme-color" content="([^"]+)"/)?.[1];
    ok(`layouts/${ten}: theme-color là Charcoal của bảng mới (màu đầu trang)`, mau?.toUpperCase() === BANG_MAU['--than'], mau ?? 'không thấy thẻ');
  }
  const mf = JSON.parse(doc(MANIFEST));
  ok('manifest.json của kho: theme_color là Charcoal, background_color là Cream (màu nền trang kho)',
     mf.theme_color?.toUpperCase() === BANG_MAU['--than'] && mf.background_color?.toUpperCase() === KHO['--kho-nen'], `${mf.theme_color} · ${mf.background_color}`);

  // Trang 503 "Hệ thống đang bận" tự dựng HTML, không nạp file CSS nào: màu viết thẳng trong chuỗi.
  const quaTai = doc(QUA_TAI);
  const kieu = quaTai.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
  const hex = [...new Set(hexTrong(kieu))];
  ok('qua-tai.ts: trang báo quá tải dùng nền Cream, chữ Charcoal, nút Beef Red chữ Cream',
     /body\s*\{[^}]*background:\s*#F0E3D0;\s*color:\s*#151008/i.test(kieu) && /background:\s*#A70C0C;\s*color:\s*#F0E3D0/i.test(kieu), hex.join(' '));
  ok('qua-tai.ts: không mã màu nào ngoài ba màu đó; chữ phụ là Charcoal 68 %',
     hex.every(h => ['#F0E3D0', '#151008', '#A70C0C'].includes(h)) && /\.phu\s*\{\s*color:\s*rgba\(21, 16, 8, \.68\)/.test(kieu), hex.join(' '));
});

process.exit(ketThuc('BẢNG MÀU NỘI BỘ, KHO, BEEFTOWN CÂN'));
