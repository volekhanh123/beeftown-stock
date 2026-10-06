/**
 * BEEFTOWN — CÂU CHỮ CỦA TRANG CÔNG KHAI, ĐỌC TỪ MÃ NGUỒN
 * ======================================================
 *
 *     node test/test-cong-khai-cau-chu.mjs
 *
 * quet-chuoi-cam.mjs và trinh-duyet.mjs đọc trang ĐANG dựng ra — nên chỉ thấy trạng thái
 * CI dựng được: chưa nối database, thực đơn rỗng, form hỏi bàn đóng. Câu của những trạng
 * thái còn lại (thực đơn đầy đủ, form mở, đã nhận yêu cầu, lỗi máy chủ) nằm sẵn trong mã
 * nhưng không bao giờ hiện ra lúc CI chạy. File này là lớp chặn cho chúng: đọc MỌI câu
 * { vi, en, ko } khai trong các file .astro công khai (web/src/components/*.astro trừ file chỉ
 * dùng cho /noi-bo và kho, web/src/pages/*.astro, en/, ko/, layouts/Trang.astro), cùng chữ
 * viết thẳng trong template, và câu chung của web/src/lib/chu.ts. Bất biến:
 *
 *   1. Câu có vi và en thì có cả ko (trang tiếng Hàn không rơi về chữ Việt).
 *   2. Không câu nào dính chữ cấm (web/src/lib/chuoi-cam.js) — giá, so sánh nhất, than hoa,
 *      phòng riêng, "đặt bàn thành công", còn N bàn…
 *   3. Không chữ ghi chú cho người duyệt lọt lên trang: chờ duyệt, đang cập nhật, placeholder,
 *      TBD, coming soon, lorem, 승인 대기…
 *   4. Trang hỏi bàn, form ứng tuyển, trang tuyển dụng không có "thành công" / "success" / "성공"
 *      — gửi yêu cầu là "đã nhận", không phải "xong".
 *   5. Bản tiếng Anh và tiếng Hàn không lẫn chữ Việt, trừ tên riêng (Hàm Nghi, Sài Gòn…).
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { napBoDoc } from './dinh-chu.mjs';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const { timChuoiCam } = await import(pathToFileURL(join(SRC, 'lib', 'chuoi-cam.js')).href);
const modChu = await import(pathToFileURL(join(SRC, 'lib', 'chu.ts')).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — CÂU CHỮ CỦA TRANG CÔNG KHAI (ĐỌC TỪ MÃ NGUỒN)');

const tuGoc = p => relative(GOC, p).split(sep).join('/');
const moiFile = d => !existsSync(d) ? [] : readdirSync(d, { withFileTypes: true })
  .flatMap(x => x.isDirectory() ? moiFile(join(d, x.name)) : [join(d, x.name)]);

// Chữ ghi chú cho người duyệt / lập trình — không bao giờ được thành chữ trên trang.
// Cả lời hứa "sẽ đăng / sẽ cập nhật" và câu kể tình trạng dựng quán: trang khách không nói chuyện sản xuất
// (QA 06/10/2026: "Danh sách từng món sẽ được đăng…", "Nhà hàng đang hoàn thiện…", "Trong lúc chờ…").
const CHU_REVIEW = /chờ duyệt|đang chờ duyệt|đang cập nhật|sắp ra mắt|placeholder|\bTBD\b|\bTODO\b|\bFIXME\b|coming soon|pending approval|lorem|승인\s?대기|업데이트\s?예정|준비\s?중인\s?이미지|sẽ được (đăng|cập nhật|công bố)|đang hoàn thiện|trong lúc chờ|will be (posted|published|updated)|being fitted out|올려 드릴게요|이곳에서 알려 드릴게요|이 페이지에 안내해 드릴게요|매장 준비를 마무리/i;
const CHU_THANH_CONG = /thành công|\bsuccess|성공/i;
const CHU_VIET = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
// Tên riêng giữ chữ Việt ở mọi bản: địa chỉ (khách đưa tài xế, gõ vào bản đồ), pháp nhân.
const TEN_RIENG = [/Hàm Nghi/g, /(phường|Phường) Sài Gòn/g, /Sài Gòn/g, /TP\. Hồ Chí Minh/g, /Hồ Chí Minh/g, /Tầng 3, 11-21/g,
  /CÔNG TY TNHH SLK GROUP/g, /Tiếng Việt/g];
const boTenRieng = s => TEN_RIENG.reduce((x, re) => x.replace(re, ''), s);
const FILE_FORM = ['TrangDatBan.astro', 'FormUngTuyen.astro', 'TrangTuyenDung.astro'];

// ---------------------------------------------------------------------------
// File công khai: tìm theo đồ thị import, không liệt kê tay — component mới tự được quét.
// ---------------------------------------------------------------------------
const IMPORT_ASTRO = /import\s+\w+\s+from\s+['"](\.{1,2}\/[^'"]+\.astro)['"]/g;
const tatCaAstro = moiFile(SRC).filter(f => f.endsWith('.astro'));
const conCua = new Map(tatCaAstro.map(f => [f, [...readFileSync(f, 'utf8').matchAll(IMPORT_ASTRO)].map(m => resolve(dirname(f), m[1]))]));
function toiDuoc(goc) {
  const thay = new Set();
  const di = f => { if (thay.has(f)) return; thay.add(f); for (const c of conCua.get(f) ?? []) di(c); };
  goc.forEach(di);
  return thay;
}
const PAGES = join(SRC, 'pages');
const trangCongKhai = ['', 'en', 'ko'].flatMap(d => existsSync(join(PAGES, d))
  ? readdirSync(join(PAGES, d)).filter(f => f.endsWith('.astro')).map(f => join(PAGES, d, f)) : []);
const tuCongKhai = toiDuoc([...trangCongKhai, join(SRC, 'layouts', 'Trang.astro')]);
const tuNoiBo = toiDuoc(tatCaAstro.filter(f => f.startsWith(join(PAGES, 'noi-bo') + sep) || f.startsWith(join(SRC, 'components', 'kho') + sep)
  || /layouts[\\/](NoiBo|Kho)\.astro$/.test(f)));
const compCongKhai = readdirSync(join(SRC, 'components')).filter(f => f.endsWith('.astro')).map(f => join(SRC, 'components', f));
const chiNoiBo = compCongKhai.filter(f => tuNoiBo.has(f) && !tuCongKhai.has(f));
const FILE = [...new Set([...trangCongKhai, join(SRC, 'layouts', 'Trang.astro'), ...compCongKhai.filter(f => !chiNoiBo.includes(f))])].sort();

// ---------------------------------------------------------------------------
// Đọc câu từ cây cú pháp của chính Astro (bộ đọc dùng chung với dinh-chu.mjs).
// ---------------------------------------------------------------------------
const parse = await napBoDoc();

/** Các chuỗi một biểu thức có thể ra. Phần không biết trước (biến, lời gọi) thành '1' — đủ để mẫu "còn 1 bàn" vẫn bị bắt. */
function giaTri(n) {
  if (!n) return [];
  switch (n.type) {
    case 'Literal': return typeof n.value === 'string' ? [n.value] : typeof n.value === 'number' ? [String(n.value)] : [];
    case 'TemplateLiteral': return [n.quasis.map(q => q.value.cooked ?? q.value.raw).join('1')];
    case 'BinaryExpression': {
      if (n.operator !== '+') return ['1'];
      const t = giaTri(n.left), p = giaTri(n.right);
      return (t.length ? t : ['1']).flatMap(a => (p.length ? p : ['1']).map(b => a + b)).slice(0, 16);
    }
    case 'ConditionalExpression': return [...giaTri(n.consequent), ...giaTri(n.alternate)];
    case 'LogicalExpression': return [...giaTri(n.left), ...giaTri(n.right)];
    case 'ParenthesizedExpression': case 'TSAsExpression': case 'TSSatisfiesExpression': case 'TSNonNullExpression':
      return giaTri(n.expression);
    case 'ArrowFunctionExpression': case 'FunctionExpression': {
      if (n.body?.type !== 'BlockStatement') return giaTri(n.body);
      const tra = [];
      const di = x => { if (!x || typeof x !== 'object') return; if (x.type === 'ReturnStatement') tra.push(...giaTri(x.argument)); for (const [k, v] of Object.entries(x)) if (k !== 'parent' && v && typeof v === 'object') di(v); };
      di(n.body);
      return tra;
    }
    case 'ArrayExpression': return n.elements.flatMap(giaTri);
    case 'ObjectExpression': return n.properties.flatMap(p => giaTri(p.value));
    default: return ['1'];
  }
}

/** Mọi cặp { vi, en[, ko] } trong file và chữ viết thẳng trong template (ngoài <script>, <style>). */
function docFile(f) {
  const nguon = readFileSync(f, 'utf8');
  const { ast } = parse(nguon);
  const dongCua = vt => nguon.slice(0, vt ?? 0).split('\n').length;
  const cap = [];
  const chuTemplate = [];
  const THUOC_TINH_CHU = new Set(['alt', 'title', 'aria-label', 'placeholder', 'content', 'tieuDe', 'moTa', 'label']);
  const di = (n, trongTemplate) => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(x => di(x, trongTemplate)); return; }
    if (n.type === 'ObjectExpression') {
      const lay = k => n.properties.find(p => (p.key?.name ?? p.key?.value) === k)?.value;
      const [vi, en, ko] = ['vi', 'en', 'ko'].map(lay);
      if (vi && en) cap.push({ dong: dongCua(n.start), vi: giaTri(vi), en: giaTri(en), ko: ko ? giaTri(ko) : null });
    }
    if (n.type === 'JSXElement') {
      const ten = n.openingElement?.name?.name;
      if (ten === 'style') return;
      if (ten === 'script') { di(n.children, false); return; }
      for (const a of n.openingElement?.attributes ?? []) {
        if (a.type === 'JSXAttribute' && THUOC_TINH_CHU.has(a.name?.name) && a.value?.type === 'Literal' && typeof a.value.value === 'string') {
          chuTemplate.push({ dong: dongCua(a.start), s: a.value.value });
        }
      }
    }
    if (n.type === 'JSXText' && trongTemplate && n.value.trim()) chuTemplate.push({ dong: dongCua(n.start), s: n.value.trim().replace(/\s+/g, ' ') });
    for (const [k, v] of Object.entries(n)) {
      if (k === 'parent' || !v || typeof v !== 'object') continue;
      di(v, trongTemplate && n.type !== 'AstroScript');
    }
  };
  di(ast.frontmatter, false);
  di(ast.body ?? ast.children ?? [], true);
  return { cap, chuTemplate };
}

const DOC = new Map(FILE.map(f => [f, docFile(f)]));
const ten = f => tuGoc(f).replace(/^web\/src\//, '');

// ===========================================================================
await nhom('1 · TÌM ĐỦ FILE CÔNG KHAI, ĐỌC ĐƯỢC CÂU', async () => {
  const soCap = [...DOC.values()].reduce((s, d) => s + d.cap.length, 0);
  ok(`${FILE.length} file .astro công khai (trang, layout Trang, component dùng ở trang công khai)`,
     FILE.length >= 30 && FILE.some(f => f.endsWith('TrangDatBan.astro')) && FILE.some(f => f.endsWith(join('pages', 'ko', 'menu.astro'))),
     FILE.map(ten).join(', '));
  ok(`Bỏ qua ${chiNoiBo.length} component chỉ dùng cho /noi-bo, kho: ${chiNoiBo.map(f => f.split(sep).pop()).join(', ') || '(không có)'}`,
     !chiNoiBo.some(f => tuCongKhai.has(f)));
  ok(`Đọc được ${soCap} câu { vi, en, ko } — bộ đọc không trượt`, soCap >= 150, `${soCap} câu`);
  for (const f of FILE_FORM) {
    const d = DOC.get(join(SRC, 'components', f));
    ok(`${f}: có trong danh sách quét và đọc được câu`, !!d && d.cap.length > 0, d ? `${d.cap.length} câu` : 'không thấy file');
  }
});

// ===========================================================================
await nhom('2 · CÂU CÓ vi VÀ en THÌ CÓ CẢ ko', async () => {
  for (const [f, { cap }] of DOC) {
    if (!cap.length) continue;
    // ko: '' vẫn là có — mẩu câu ghép quanh tên riêng đổi chỗ theo ngữ pháp tiếng Hàn
    // (b1Truoc: { vi: 'Tới tòa nhà số ', en: 'Come to ', ko: '' } + b1Sau: { …, ko: ' 건물로 오세요' }).
    const thieu = cap.filter(c => c.ko === null);
    ok(`${ten(f)}: ${cap.length} câu đủ ba thứ tiếng`, thieu.length === 0,
       thieu.slice(0, 4).map(c => `dòng ${c.dong} «${(c.vi[0] ?? '').slice(0, 40)}»`).join(' | '));
  }
});

// ===========================================================================
await nhom('3 · KHÔNG CHỮ CẤM, KHÔNG CHỮ GHI CHÚ REVIEW — KỂ CẢ Ở TRẠNG THÁI CI KHÔNG DỰNG ĐƯỢC', async () => {
  for (const [f, { cap, chuTemplate }] of DOC) {
    const cau = [
      ...cap.flatMap(c => ['vi', 'en', 'ko'].flatMap(nn => (c[nn] ?? []).map(s => ({ dong: c.dong, nn, s })))),
      ...chuTemplate.map(c => ({ ...c, nn: 'template' })),
    ];
    if (!cau.length) continue;
    const cam = cau.flatMap(c => timChuoiCam(c.s).map(t => `dòng ${c.dong} [${c.nn}] "${t.tim_thay}" — ${t.vi_sao}`));
    ok(`${ten(f)}: ${cau.length} câu không dính chữ cấm (chuoi-cam.js)`, cam.length === 0, cam.slice(0, 3).join(' | '));
    const review = cau.filter(c => CHU_REVIEW.test(c.s));
    ok(`${ten(f)}: không chữ ghi chú review (chờ duyệt, placeholder, TBD, coming soon, lorem, 승인 대기…)`, review.length === 0,
       review.slice(0, 3).map(c => `dòng ${c.dong} [${c.nn}] «${c.s.slice(0, 60)}»`).join(' | '));
  }
});

// ===========================================================================
await nhom('4 · HỎI BÀN, ỨNG TUYỂN, TUYỂN DỤNG: KHÔNG "THÀNH CÔNG" / "SUCCESS" / "성공"', async () => {
  for (const f of FILE_FORM) {
    const d = DOC.get(join(SRC, 'components', f));
    if (!d) { ok(`${f} có mặt`, false); continue; }
    const cau = [...d.cap.flatMap(c => ['vi', 'en', 'ko'].flatMap(nn => (c[nn] ?? []).map(s => ({ dong: c.dong, nn, s })))),
      ...d.chuTemplate.map(c => ({ ...c, nn: 'template' }))];
    const sai = cau.filter(c => CHU_THANH_CONG.test(c.s));
    ok(`${f}: không câu nào nói "thành công" / "success" / "성공" (gửi xong là "đã nhận")`, sai.length === 0,
       sai.slice(0, 3).map(c => `dòng ${c.dong} [${c.nn}] «${c.s.slice(0, 60)}»`).join(' | '));
  }
});

// ===========================================================================
await nhom('5 · BẢN TIẾNG ANH, TIẾNG HÀN KHÔNG LẪN CHỮ VIỆT (TRỪ TÊN RIÊNG)', async () => {
  for (const [f, { cap }] of DOC) {
    const lan = cap.flatMap(c => ['en', 'ko'].flatMap(nn => (c[nn] ?? []).filter(s => CHU_VIET.test(boTenRieng(s)))
      .map(s => `dòng ${c.dong} [${nn}] «${s.slice(0, 50)}»`)));
    if (!cap.length) continue;
    ok(`${ten(f)}: bản en / ko không có chữ Việt ngoài tên riêng`, lan.length === 0, lan.slice(0, 3).join(' | '));
  }
});

// ===========================================================================
await nhom('6 · CÂU CHUNG CỦA web/src/lib/chu.ts (VI / EN / KO)', async () => {
  const { chu, THUONG_HIEU, DIA_CHI_NHA_HANG, NGON_NGU } = modChu;
  for (const nn of NGON_NGU) {
    const bo = chu(nn);
    const cau = Object.entries(bo);
    const cam = cau.flatMap(([k, s]) => timChuoiCam(s).map(t => `${k}: "${t.tim_thay}" — ${t.vi_sao}`));
    ok(`chu.ts [${nn}]: ${cau.length} câu không dính chữ cấm`, cam.length === 0, cam.slice(0, 3).join(' | '));
    const review = cau.filter(([, s]) => CHU_REVIEW.test(s));
    ok(`chu.ts [${nn}]: không chữ ghi chú review`, review.length === 0, review.map(([k]) => k).join(', '));
    ok(`chu.ts [${nn}]: không câu nào nói "thành công" / "success" / "성공"`, !cau.some(([, s]) => CHU_THANH_CONG.test(s)),
       cau.filter(([, s]) => CHU_THANH_CONG.test(s)).map(([k]) => k).join(', '));
    if (nn !== 'vi') {
      const lan = cau.filter(([, s]) => CHU_VIET.test(boTenRieng(s)));
      ok(`chu.ts [${nn}]: không lẫn chữ Việt ngoài tên riêng`, lan.length === 0, lan.map(([k, s]) => `${k} «${s.slice(0, 40)}»`).join(' | '));
    }
    ok(`chu.ts [${nn}]: nút tới /dat-ban là "${{ vi: 'Hỏi bàn', en: 'Ask for a table', ko: '테이블 문의' }[nn]}"`,
       bo.datBan === { vi: 'Hỏi bàn', en: 'Ask for a table', ko: '테이블 문의' }[nn], bo.datBan);
    ok(`chu.ts [${nn}]: câu cầu thang nói rõ cầu thang bộ, không có thang máy cho khách`,
       { vi: /cầu thang bộ.*không có thang máy/i, en: /stairs.*no guest lift/i, ko: /계단.*엘리베이터는 없어요/ }[nn].test(bo.cauThangBo), bo.cauThangBo);
  }
  const hang = [...Object.values(THUONG_HIEU), DIA_CHI_NHA_HANG].join(' | ');
  ok('THUONG_HIEU và DIA_CHI_NHA_HANG không dính chữ cấm', timChuoiCam(hang).length === 0, hang);
});

process.exit(ketThuc('CÂU CHỮ CỦA TRANG CÔNG KHAI'));
