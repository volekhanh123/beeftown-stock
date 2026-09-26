/**
 * BEEFTOWN — CHỮ DÍNH NHAU VÌ XUỐNG DÒNG TRONG TEMPLATE .astro
 * ============================================================
 * Astro 7 mặc định compressHTML: 'jsx': như JSX, khoảng trắng CÓ xuống dòng giữa
 * hai nút bị bỏ hẳn, đầu / cuối dòng của một đoạn chữ bị cắt. Câu viết liền
 * trong MỘT đoạn chữ thì xuống dòng thành dấu cách:
 *
 *     <p>Câu một.
 *       Câu hai.</p>                  → "Câu một. Câu hai."
 *
 * nhưng tách thành hai khóa từ điển trên hai dòng thì hai câu dính nhau:
 *
 *     <p>{t.cau1}
 *       {t.cau2}</p>                  → "Câu một.Câu hai."
 *
 * Hàm ở đây tìm những chỗ như vậy trong DÒNG CHỮ (p, li, small, dd, td…): hai
 * mẩu chữ hoặc thẻ chữ (strong, em, a, code…) cách nhau bằng xuống dòng mà chữ
 * hai bên cần một dấu cách — xét bằng giá trị { vi, en } trong từ điển của file,
 * cho từng thứ tiếng. Cặp nhãn <span>/<small> trong <label>, huy hiệu, nút cạnh
 * nút… không phải dòng chữ nên không xét.
 *
 * Sửa: viết hai mẩu trên cùng một dòng, cách một dấu cách (hoặc thêm {' '}).
 *
 *     node test/dinh-chu.mjs <file .astro>…
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB = join(__dirname, '..', '..', 'web');

let parse = null;
/** Bộ đọc cây của chính Astro (@astrojs/compiler-rs trong web/node_modules). */
async function napBoDoc() {
  if (parse) return parse;
  let duong;
  try { duong = createRequire(join(WEB, 'package.json')).resolve('@astrojs/compiler-rs'); }
  catch { throw new Error('thiếu @astrojs/compiler-rs — chạy `npm ci` trong web/ trước'); }
  ({ parse } = await import(pathToFileURL(duong).href));
  return parse;
}

const U = '�';   // phần chữ không biết trước: dữ liệu, số, câu thư viện…
// Thẻ nằm TRONG dòng chữ. Thẻ khác (div, span, label, nút, thành phần…) coi là khối.
const THE_CHU = new Set(['a', 'abbr', 'b', 'cite', 'code', 'dfn', 'em', 'i', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'strong', 'sub', 'sup', 'time', 'u', 'var']);
// Cha có con là dòng chữ.
const CHA_DONG_CHU = new Set(['p', 'li', 'dd', 'dt', 'td', 'th', 'small', 'strong', 'em', 'b', 'i', 'summary', 'legend', 'caption', 'figcaption', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const BAM_TRAI = /[.,;:!?)\]}…%’”»]/;   // dấu bám vào chữ đứng trước — không cần cách trước nó
const DAU_MO = /[(\[{“‘«]/;            // dấu mở — không cần cách sau nó

/** Làm sạch một đoạn chữ như JSX (Babel cleanJSXElementLiteralChild). */
function lamSach(v) {
  const dong = v.split(/\r\n|\n|\r/);
  let cuoi = 0;
  dong.forEach((d, i) => { if (/[^ \t]/.test(d)) cuoi = i; });
  let s = '';
  dong.forEach((d, i) => {
    let t = d.replace(/\t/g, ' ');
    if (i !== 0) t = t.replace(/^[ ]+/, '');
    if (i !== dong.length - 1) t = t.replace(/[ ]+$/, '');
    if (t) s += i !== cuoi ? `${t} ` : t;
  });
  return s;
}

const tenThe = n => {
  const t = n.openingElement?.name;
  return t?.type === 'JSXIdentifier' ? t.name : '';
};
const laTheChu = (n, nguon) => {
  const ten = tenThe(n);
  if (!THE_CHU.has(ten)) return false;
  // <a class="nb-nut …"> là nút, không phải liên kết trong câu.
  return !(ten === 'a' && /class="[^"]*\bnb-nut\b/.test(nguon.slice(n.openingElement.start, n.openingElement.end)));
};

/**
 * Các khả năng một biểu thức hiện ra: [{ kieu: 'chu'|'the'|'khoi'|'rong', s }].
 * s là chữ mẫu (U ở chỗ không biết trước), đủ để xét chữ đầu / chữ cuối.
 */
function khaNang(n, bc) {
  const { tu, nn, nguon } = bc;
  if (!n) return [{ kieu: 'rong' }];
  switch (n.type) {
    case 'Literal':
      if (typeof n.value === 'string') return [n.value ? { kieu: 'chu', s: n.value } : { kieu: 'rong' }];
      return [typeof n.value === 'number' ? { kieu: 'chu', s: U } : { kieu: 'rong' }];
    case 'TemplateLiteral':
      return [{ kieu: 'chu', s: n.quasis.map(q => q.value.cooked ?? q.value.raw).join(U) || U }];
    case 'ConditionalExpression': return [...khaNang(n.consequent, bc), ...khaNang(n.alternate, bc)];
    case 'LogicalExpression':
      return n.operator === '&&' ? [...khaNang(n.right, bc), { kieu: 'rong' }] : [{ kieu: 'chu', s: U }, ...khaNang(n.right, bc)];
    case 'ParenthesizedExpression': case 'TSAsExpression': case 'TSNonNullExpression': case 'TSSatisfiesExpression':
      return khaNang(n.expression, bc);
    case 'MemberExpression': {
      const k = n.computed ? (n.property.type === 'Literal' ? n.property.value : null) : n.property.name;
      const muc = k == null ? null : tu.get(k);
      if (muc && !muc.ham) return khaNang(muc[nn], { ...bc, tu: new Map() });
      return [{ kieu: 'chu', s: U }];
    }
    case 'CallExpression': {
      const c = n.callee;
      if (c.type === 'MemberExpression' && !c.computed) {
        const muc = tu.get(c.property.name);
        if (muc?.ham) return khaNang(muc[nn], { ...bc, tu: new Map() });
        if (['map', 'flatMap', 'filter'].includes(c.property.name)) return [{ kieu: 'khoi' }];
      }
      return [{ kieu: 'chu', s: U }];
    }
    case 'ArrowFunctionExpression': case 'FunctionExpression':
      return n.body.type === 'BlockStatement' ? [{ kieu: 'chu', s: U }] : khaNang(n.body, bc);
    case 'JSXElement':
      return laTheChu(n, nguon) ? [{ kieu: 'the', s: chuTrongThe(n.children, bc) }] : [{ kieu: 'khoi' }];
    case 'JSXFragment': {
      const day = daySach(n.children, bc);
      if (!day.length) return [{ kieu: 'rong' }];
      if (day[0].kha.every(x => x.kieu === 'khoi') || day.at(-1).kha.every(x => x.kieu === 'khoi')) return [{ kieu: 'khoi' }];
      return [{ kieu: 'chu', s: chuTrongThe(n.children, bc) }];
    }
    case 'ArrayExpression': return [{ kieu: 'khoi' }];
    default: return [{ kieu: 'chu', s: U }];
  }
}

/** Chữ mẫu bên trong một thẻ chữ / mảnh: nối khả năng đầu tiên của từng con. */
function chuTrongThe(children, bc) {
  return daySach(children, bc).map(x => {
    const k = x.kha.find(y => y.kieu === 'chu' || y.kieu === 'the');
    return k ? k.s : '';
  }).join('') || U;
}

/**
 * Dãy con sau khi làm sạch như JSX: [{ kha, nut, dinh }] — dinh = ngay trước nút
 * này có khoảng trắng xuống dòng bị bỏ.
 */
function daySach(children, bc) {
  const ra = [];
  let dinh = false;
  for (const c of children ?? []) {
    if (c.type === 'JSXText') {
      if (!/\S/.test(c.value)) {
        if (/[\r\n]/.test(c.value)) dinh = true;
        else if (c.value) { ra.push({ kha: [{ kieu: 'chu', s: ' ' }], nut: c, dinh }); dinh = false; }
        continue;
      }
      ra.push({ kha: [{ kieu: 'chu', s: lamSach(c.value) }], nut: c, dinh: dinh || /^[ \t]*[\r\n]/.test(c.value) });
      dinh = /[\r\n][ \t]*$/.test(c.value);
      continue;
    }
    if (c.type === 'JSXExpressionContainer' && c.expression.type === 'JSXEmptyExpression') continue;   // {/* … */}
    if (/Comment/.test(c.type)) continue;
    let kha;
    if (c.type === 'JSXExpressionContainer') kha = khaNang(c.expression, bc);
    else if (c.type === 'JSXElement' || c.type === 'JSXFragment') kha = khaNang(c, bc);
    else kha = [{ kieu: 'khoi' }];
    ra.push({ kha, nut: c, dinh });
    dinh = false;
  }
  return ra;
}

/**
 * Chữ cuối bên trái và chữ đầu bên phải có cần một dấu cách không. Dữ liệu (U)
 * coi như chữ thường ("Còn" + số món → cần cách); hai phía đều là dữ liệu thì
 * không kết luận.
 */
function canCach(trai, phai) {
  const c = trai.at(-1), d = phai[0];
  if (c === undefined || d === undefined || (c === U && d === U)) return false;
  if (/\s/.test(c) || /\s/.test(d)) return false;
  return !(d !== U && BAM_TRAI.test(d)) && !(c !== U && DAU_MO.test(c));
}

/** Từ điển { khóa: { vi, en } } khai trong frontmatter (mọi object có đủ vi và en). */
function docTuDien(frontmatter) {
  const tu = new Map();
  const di = n => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(di); return; }
    if (n.type === 'Property' && n.value?.type === 'ObjectExpression') {
      const lay = ten => n.value.properties.find(p => p.key?.name === ten)?.value;
      const k = n.key?.name ?? n.key?.value;
      const vi = lay('vi'), en = lay('en');
      if (k != null && vi && en) tu.set(k, { vi, en, ham: /FunctionExpression$/.test(vi.type) });
    }
    for (const v of Object.values(n)) if (v && typeof v === 'object') di(v);
  };
  di(frontmatter);
  return tu;
}

/** Các chỗ dính trong một file .astro: [{ dong, nn, mau }], mau = "…đuôi trái|đầu phải…". */
export async function timChoDinh(nguon) {
  const doc = await napBoDoc();
  const { ast } = doc(nguon);
  const tu = docTuDien(ast.frontmatter);
  const ra = [];
  const dongCua = vt => nguon.slice(0, vt).split('\n').length;
  for (const nn of ['vi', 'en']) {
    const bc = { tu, nn, nguon };
    const xetDay = (children, trongDong) => {
      const day = daySach(children, bc);
      for (let i = 1; i < day.length && trongDong; i++) {
        if (!day[i].dinh) continue;
        let mau = null;
        for (const a of day[i - 1].kha) for (const b of day[i].kha) {
          if (mau || !['chu', 'the'].includes(a.kieu) || !['chu', 'the'].includes(b.kieu)) continue;
          if (canCach(a.s, b.s)) mau = `${a.s.slice(-30)}|${b.s.slice(0, 30)}`;
        }
        if (mau) ra.push({ dong: dongCua(day[i].nut.start), nn, mau });
      }
    };
    // Đi khắp cây, kể cả JSX nằm trong biểu thức; trongDong = đang ở trong dòng chữ.
    const di = (n, trongDong) => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) { n.forEach(x => di(x, trongDong)); return; }
      if (n.type === 'JSXElement') {
        const ten = tenThe(n);
        // Hộp flex / grid: các con là ô riêng, khoảng trắng giữa chúng không hiện.
        const hop = /style="[^"]*display:\s*(inline-)?(flex|grid)/.test(nguon.slice(n.openingElement.start, n.openingElement.end));
        const trong = !hop && (CHA_DONG_CHU.has(ten) || (THE_CHU.has(ten) && trongDong));
        xetDay(n.children, trong);
        n.children.forEach(x => di(x, trong));
        return;
      }
      if (n.type === 'JSXFragment') { xetDay(n.children, trongDong); n.children.forEach(x => di(x, trongDong)); return; }
      for (const [k, v] of Object.entries(n)) if (k !== 'frontmatter' && v && typeof v === 'object') di(v, trongDong);
    };
    di(ast.body ?? ast.children ?? [], false);
  }
  return ra.sort((a, b) => a.dong - b.dong);
}

// --- Chạy tay: node test/dinh-chu.mjs <file .astro>… -----------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let tong = 0;
  for (const f of process.argv.slice(2)) {
    for (const { dong, nn, mau } of await timChoDinh(readFileSync(f, 'utf8'))) {
      tong++;
      console.log(`${f}:${dong} [${nn}] «${mau.replace(/\s+/g, ' ')}»`);
    }
  }
  console.error(`-- ${tong} chỗ chữ dính vì xuống dòng`);
}
