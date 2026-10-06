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
 * mẩu chữ hoặc thẻ chữ (strong, em, a, code, span…) cách nhau bằng xuống dòng mà
 * chữ hai bên cần một dấu cách — cho từng thứ tiếng, xét bằng:
 *   · từ điển { vi, en } / { vi, en, ko } khai trong file (kể cả dich(nn, {…}));
 *   · câu của web/src/lib/chu.ts: biến gán bằng chu(ngonNgu) đọc đúng bản
 *     vi / en / ko, hằng như THUONG_HIEU đọc giá trị thật.
 * File có tiếng Hàn (chu(…) hoặc từ điển có ko) được xét cả ba thứ tiếng.
 *
 * <span> và <div> là dòng chữ khi chữ viết thẳng bên trong trộn với thẻ chữ —
 * chân trang cũ của mọi trang công khai:
 *
 *     <span>
 *       © {namVn()} {t.banQuyen} ·
 *       <span lang="en">{THUONG_HIEU.descriptor}</span>
 *     </span>                         → "© 2026 Beeftown ·Beef Specialty Restaurant"
 *
 * "Chữ" ở đây là chữ viết thẳng hoặc {…} ra câu đã biết ({t.banQuyen}); dữ liệu
 * chưa biết thì không tính. Cặp nhãn <span>/<small> trong <label>, huy hiệu cạnh
 * huy hiệu, nút cạnh nút… không phải dòng chữ nên không xét.
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
export async function napBoDoc() {
  if (parse) return parse;
  let duong;
  try { duong = createRequire(join(WEB, 'package.json')).resolve('@astrojs/compiler-rs'); }
  catch { throw new Error('thiếu @astrojs/compiler-rs — chạy `npm ci` trong web/ trước'); }
  ({ parse } = await import(pathToFileURL(duong).href));
  return parse;
}

let modChu = null;
/** web/src/lib/chu.ts — câu chung của trang công khai (Node ≥ 22.18 đọc thẳng .ts). */
async function napChu() {
  modChu ??= await import(pathToFileURL(join(WEB, 'src', 'lib', 'chu.ts')).href);
  return modChu;
}
// import { … } from '../lib/chu' (hay '../../lib/chu', '…/lib/chu.ts').
const LA_LIB_CHU = /(^|\/)lib\/chu(\.ts)?$/;

const U = '�';   // phần chữ không biết trước: dữ liệu, số, câu thư viện…
// Thẻ nằm TRONG dòng chữ. Thẻ khác (div, label, nút, thành phần…) coi là khối; <span> xem laTheChu.
const THE_CHU = new Set(['a', 'abbr', 'b', 'cite', 'code', 'dfn', 'em', 'i', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'strong', 'sub', 'sup', 'time', 'u', 'var']);
// Cha có con là dòng chữ.
const CHA_DONG_CHU = new Set(['p', 'li', 'dd', 'dt', 'td', 'th', 'small', 'strong', 'em', 'b', 'i', 'summary', 'legend', 'caption', 'figcaption', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
// Cha chỉ là dòng chữ khi chữ viết thẳng bên trong trộn với thẻ chữ (traChuVaThe).
const CHA_KHI_TRON = new Set(['span', 'div']);
// Lớp chỉ đổi cách xuống dòng của chữ (chung.css) — <span> mang nó vẫn là chữ, không phải nhãn.
const LOP_CHU = new Set(['lien']);
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
/**
 * Thẻ nằm trong dòng chữ? canhChu = dãy con chứa thẻ này có chữ bên cạnh (coChuBenCanh).
 * <span> chỉ là chữ khi trơn (lang, aria…, hoặc lớp trong LOP_CHU) VÀ có chữ bên
 * cạnh — "Beeftown ·⏎<span lang="en">…</span>". <span class / style / {...thuộc tính}>
 * khác là nhãn, huy hiệu: CSS lo khoảng cách. <span> trơn không có chữ bên cạnh
 * là ô bố cục của hàng flex: <li><span><strong/>⏎<small/></span>⏎<a class="nb-nut"/></li>.
 */
const laTheChu = (n, nguon, canhChu) => {
  const ten = tenThe(n);
  const the = nguon.slice(n.openingElement.start, n.openingElement.end);
  if (ten === 'span') {
    if (!canhChu || /\s(class:list|style)=|\sclass=\{|\{\s*\.\.\./.test(the)) return false;
    const lop = the.match(/\sclass=(["'])(.*?)\1/)?.[2];
    return lop == null || lop.split(/\s+/).filter(Boolean).every(l => LOP_CHU.has(l));
  }
  if (!THE_CHU.has(ten)) return false;
  // <a class="nb-nut …"> là nút, không phải liên kết trong câu.
  return !(ten === 'a' && /class="[^"]*\bnb-nut\b/.test(the));
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
      // t.khoa với t = chu(ngonNgu), hoặc THUONG_HIEU.khoa — giá trị thật của lib/chu.ts.
      const goc = n.object.type === 'Identifier' ? n.object.name : null;
      const bo = goc == null ? null : bc.libChu.boChu.has(goc) ? bc.libChu.chu(nn) : bc.libChu.hang.get(goc);
      if (typeof bo?.[k] === 'string') return khaNang({ type: 'Literal', value: bo[k] }, bc);
      const muc = k == null ? null : tu.get(k);
      if (muc && !muc.ham) return muc[nn] ? khaNang(muc[nn], { ...bc, tu: new Map() }) : [{ kieu: 'chu', s: U }];
      return [{ kieu: 'chu', s: U }];
    }
    case 'CallExpression': {
      const c = n.callee;
      if (c.type === 'MemberExpression' && !c.computed) {
        const muc = tu.get(c.property.name);
        if (muc?.ham) return muc[nn] ? khaNang(muc[nn], { ...bc, tu: new Map() }) : [{ kieu: 'chu', s: U }];
        if (['map', 'flatMap', 'filter'].includes(c.property.name)) return [{ kieu: 'khoi' }];
      }
      return [{ kieu: 'chu', s: U }];
    }
    case 'ArrowFunctionExpression': case 'FunctionExpression':
      return n.body.type === 'BlockStatement' ? [{ kieu: 'chu', s: U }] : khaNang(n.body, bc);
    case 'JSXElement':
      return laTheChu(n, nguon, bc.canhChu) ? [{ kieu: 'the', s: chuTrongThe(n.children, bc) }] : [{ kieu: 'khoi' }];
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
function daySach(children, bcCha) {
  const bc = { ...bcCha, canhChu: coChuBenCanh(children, bcCha) };
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
 * Dãy con có chữ bên cạnh: chữ viết thẳng, hoặc {…} ra câu đã biết — câu từ điển,
 * câu của lib/chu.ts ({t.banQuyen}), chuỗi viết sẵn. Dữ liệu chưa biết (U) không
 * tính: <li>{x.ten}⏎<span>…</span></li> nhiều khả năng là hàng flex.
 */
function coChuBenCanh(children, bc) {
  return (children ?? []).some(c => c.type === 'JSXText'
    ? /\S/.test(c.value)
    : c.type === 'JSXExpressionContainer' && c.expression.type !== 'JSXEmptyExpression'
      && khaNang(c.expression, { ...bc, canhChu: false }).some(k => k.kieu === 'chu' && /[^\s\uFFFD]/.test(k.s)));
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

/** Từ điển { khóa: { vi, en } } hoặc { vi, en, ko } khai trong frontmatter (mọi object có đủ vi và en). */
function docTuDien(frontmatter) {
  const tu = new Map();
  const di = n => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(di); return; }
    if (n.type === 'Property' && n.value?.type === 'ObjectExpression') {
      const lay = ten => n.value.properties.find(p => p.key?.name === ten)?.value;
      const k = n.key?.name ?? n.key?.value;
      const vi = lay('vi'), en = lay('en'), ko = lay('ko');
      if (k != null && vi && en) tu.set(k, { vi, en, ko, ham: /FunctionExpression$/.test(vi.type) });
    }
    for (const v of Object.values(n)) if (v && typeof v === 'object') di(v);
  };
  di(frontmatter);
  return tu;
}

/**
 * Tên trong frontmatter đọc từ lib/chu.ts:
 *   boChu — biến gán bằng chu(ngonNgu): t.khoa là câu của từng thứ tiếng;
 *   hang  — object import thẳng (THUONG_HIEU…): X.khoa giống nhau ở mọi thứ tiếng.
 * dich(ngonNgu, { … }) thì từ điển nằm ngay trong file — docTuDien đã đọc.
 */
function docLibChu(frontmatter, mod) {
  const hamChu = new Set(), boChu = new Set(), hang = new Map();
  for (const n of frontmatter?.program?.body ?? []) {
    if (n.type !== 'ImportDeclaration' || !LA_LIB_CHU.test(n.source?.value ?? '')) continue;
    for (const s of n.specifiers) {
      if (s.type !== 'ImportSpecifier') continue;
      const ten = s.imported.name ?? s.imported.value, giaTri = mod[ten];
      if (ten === 'chu') hamChu.add(s.local.name);
      else if (giaTri && typeof giaTri === 'object' && !Array.isArray(giaTri)) hang.set(s.local.name, giaTri);
    }
  }
  const di = n => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(di); return; }
    if (n.type === 'VariableDeclarator' && n.id?.type === 'Identifier' && n.init?.type === 'CallExpression'
        && n.init.callee.type === 'Identifier' && hamChu.has(n.init.callee.name)) boChu.add(n.id.name);
    for (const v of Object.values(n)) if (v && typeof v === 'object') di(v);
  };
  if (hamChu.size) di(frontmatter);
  return { boChu, hang, chu: mod.chu };
}

/** <span> / <div>: chữ (viết thẳng hoặc câu đã biết) trộn với thẻ chữ (kể cả thẻ trong {…}) — là một dòng chữ. */
const traChuVaThe = (children, bc) =>
  coChuBenCanh(children, bc) && daySach(children, bc).some(x => x.kha.some(k => k.kieu === 'the'));

/** Các chỗ dính trong một file .astro: [{ dong, nn, mau }], mau = "…đuôi trái|đầu phải…". */
export async function timChoDinh(nguon) {
  const doc = await napBoDoc();
  const { ast } = doc(nguon);
  const tu = docTuDien(ast.frontmatter);
  const libChu = docLibChu(ast.frontmatter, await napChu());
  const coTiengHan = libChu.boChu.size > 0 || [...tu.values()].some(m => m.ko);
  const ra = [];
  const dongCua = vt => nguon.slice(0, vt).split('\n').length;
  for (const nn of coTiengHan ? ['vi', 'en', 'ko'] : ['vi', 'en']) {
    const bc = { tu, nn, nguon, libChu };
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
    // Đi khắp cây, kể cả JSX nằm trong biểu thức; trongDong = đang ở trong dòng chữ,
    // canhChu = dãy con đang đi có chữ bên cạnh (cho <span>, xem laTheChu).
    const di = (n, trongDong, canhChu) => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) { n.forEach(x => di(x, trongDong, canhChu)); return; }
      if (n.type === 'JSXElement') {
        const ten = tenThe(n);
        // Hộp flex / grid: các con là ô riêng, khoảng trắng giữa chúng không hiện.
        const hop = /style="[^"]*display:\s*(inline-)?(flex|grid)/.test(nguon.slice(n.openingElement.start, n.openingElement.end));
        const theChu = ten === 'span' ? laTheChu(n, nguon, canhChu) : THE_CHU.has(ten);
        const trong = !hop && (CHA_DONG_CHU.has(ten) || (theChu && trongDong)
          || (CHA_KHI_TRON.has(ten) && traChuVaThe(n.children, bc)));
        xetDay(n.children, trong);
        const canhChuCon = coChuBenCanh(n.children, bc);
        n.children.forEach(x => di(x, trong, canhChuCon));
        return;
      }
      if (n.type === 'JSXFragment') {
        xetDay(n.children, trongDong);
        const canhChuCon = coChuBenCanh(n.children, bc);
        n.children.forEach(x => di(x, trongDong, canhChuCon));
        return;
      }
      for (const [k, v] of Object.entries(n)) if (k !== 'frontmatter' && v && typeof v === 'object') di(v, trongDong, canhChu);
    };
    di(ast.body ?? ast.children ?? [], false, false);
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
