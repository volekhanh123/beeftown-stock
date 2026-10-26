/**
 * BEEFTOWN — TRANG MUA THỊT VỀ: HAI COMPONENT, ĐỌC TỪ MÃ NGUỒN
 * ============================================================
 *
 *     node test/test-cong-khai-mua-thit-ve.mjs
 *
 * web/src/components/TrangMuaThitVe.astro và MuaThitThe.astro dựng trang /mua-thit-ve (en, ko: /buy-meat) ở bốn
 * trạng thái: chưa mở, lỗi đọc menu, mở (có form chọn gói), mọi gói tạm hết ở quầy. CI dựng trang KHÔNG có database
 * nên chỉ thấy "chưa mở" — ba trạng thái kia chỉ hiện khi có dữ liệu (web/kiem-tra/thu-day-du.mjs nhóm 12 chạy chúng
 * trên Supabase giả). File này là lớp chặn chạy trong npm test, không cần trình duyệt: đọc mã nguồn hai component và
 * giữ các luật của bản thiết kế PR 2 (mục 2.7 – 2.11, 3.3, 3.6, quyết định của Khánh 26/10/2026):
 *
 *   1. Form là form GET thật (chạy cả khi tắt JavaScript), chỉ có ở trạng thái "mở"; "chưa mở" chỉ có tiêu đề, một
 *      câu và link Thực đơn — không mời nhắn, không nút kênh.
 *   2. Thứ chỉ chạy nhờ JavaScript (nút Chép đơn, nút −/+, thanh dưới) ra trang với hidden, và mỗi component có
 *      [hidden] { display: none !important; } — không thì .ck .nut { display: inline-flex } đè lên hidden.
 *   3. Đích đặt hàng (link Zalo OA, chữ của bước gửi) chỉ đến từ web/src/lib/dich-dat-hang.ts: component không tự
 *      viết link Zalo, script nhận đích qua đúng một data-dich — PR sau đổi sang Mini App chỉ sửa file lib đó.
 *   4. Số tiền chỉ in qua dinhDangTien và chỉ trong phần tử có data-tien (bộ quét chữ cấm miễn đúng chỗ đó).
 *   5. Giá là giá quán đã công bố (giá chủ đã chốt); quán xác nhận tổng tiền khi liên hệ lại. Không giá theo kg hay
 *      100 g. Không chữ "Quán báo giá", "thành công", "mã đơn".
 *   6. Không ô nhập thông tin cá nhân, không <img>, đúng hai vùng thông báo, hỏi đáp đúng cấu trúc .cau-hoi.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { napBoDoc } from './dinh-chu.mjs';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const COMP = join(GOC, 'web', 'src', 'components');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRANG MUA THỊT VỀ: HAI COMPONENT (ĐỌC TỪ MÃ NGUỒN)');

const docFile = ten => (existsSync(join(COMP, ten)) ? readFileSync(join(COMP, ten), 'utf8').replace(/\r\n/g, '\n') : '');

/** Tách một file .astro thành phần đầu (frontmatter), khuôn trang, script và style. */
function tach(nguon) {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(nguon);
  const dau = m ? m[1] : '';
  const sau = m ? nguon.slice(m[0].length) : nguon;
  const script = (sau.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) ?? []).join('\n');
  const style = (sau.match(/<style\b[^>]*>[\s\S]*?<\/style>/g) ?? []).join('\n');
  const khuon = sau.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '');
  return { nguon, dau, khuon, script, style };
}

const TRANG = tach(docFile('TrangMuaThitVe.astro'));
const THE = tach(docFile('MuaThitThe.astro'));
const HAI = [['TrangMuaThitVe.astro', TRANG], ['MuaThitThe.astro', THE]];

/**
 * Khối JSX mở bằng `dau` (chuỗi kết bằng "(") tới ")" khớp với nó — nội dung một nhánh `{điều kiện && ( … )}` hay
 * `{điều kiện ? ( … ) : ( … )}`. Đếm ngoặc tròn; khuôn trang không viết ngoặc tròn trơn trong chữ (chữ đi qua {c.…}).
 * Trả mọi khối có cùng đầu.
 */
function cacKhoi(nguon, dau) {
  const ra = [];
  let tu = 0;
  for (;;) {
    const i = nguon.indexOf(dau, tu);
    if (i < 0) return ra;
    let sau = 0;
    let j = i + dau.length - 1;
    for (; j < nguon.length; j++) {
      if (nguon[j] === '(') sau++;
      else if (nguon[j] === ')' && --sau === 0) break;
    }
    ra.push({ batDau: i, ketThuc: j, chu: nguon.slice(i, j + 1) });
    tu = i + dau.length;
  }
}
const khoi = (nguon, dau) => cacKhoi(nguon, dau)[0]?.chu ?? '';
/** Mọi chỗ `token` xuất hiện đều nằm trong một khối mở bằng `dau`. */
function chiTrongKhoi(nguon, dau, token) {
  const ds = cacKhoi(nguon, dau);
  const viTri = [];
  for (let i = nguon.indexOf(token); i >= 0; i = nguon.indexOf(token, i + 1)) viTri.push(i);
  return viTri.length > 0 && viTri.every(v => ds.some(k => v > k.batDau && v < k.ketThuc));
}
/** `token` có trong nguồn và không lần nào nằm trong một nhánh điều kiện `{… && ( … )}`. */
function ngoaiDieuKien(nguon, token) {
  const ds = cacKhoi(nguon, '&& (');
  const i = nguon.indexOf(token);
  return i >= 0 && !ds.some(k => i > k.batDau && i < k.ketThuc);
}
/** Thẻ mở (từ "<" tới ">") chứa `dau`. */
function theMo(nguon, dau) {
  const i = nguon.indexOf(dau);
  if (i < 0) return '';
  const a = nguon.lastIndexOf('<', i);
  const b = nguon.indexOf('>', i);
  return nguon.slice(a, b + 1);
}
const dem = (nguon, re) => (nguon.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')) ?? []).length;
/** Bỏ các khối @media (hover: hover) { … } khỏi CSS. */
function boKhoiDiChuot(css) {
  let ra = css;
  for (let i = ra.search(/@media\s*\(hover:\s*hover\)\s*\{/); i >= 0; i = ra.search(/@media\s*\(hover:\s*hover\)\s*\{/)) {
    let sau = 0, j = ra.indexOf('{', i);
    for (; j < ra.length; j++) {
      if (ra[j] === '{') sau++;
      else if (ra[j] === '}' && --sau === 0) break;
    }
    ra = ra.slice(0, i) + ra.slice(j + 1);
  }
  return ra;
}
const boChuThichCss = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Khối hỏi đáp: từ <div class="cau-hoi"> tới hết khuôn trang. */
const hoiDapCua = khuon => (khuon.includes('<div class="cau-hoi">') ? khuon.slice(khuon.indexOf('<div class="cau-hoi">')) : '');

// ---------------------------------------------------------------------------
// Chữ khách đọc: mọi câu { vi, en, ko } (bảng dich) và chữ viết thẳng trong khuôn trang — đọc bằng bộ đọc của Astro
// (chú thích không phải chữ khách đọc).
// ---------------------------------------------------------------------------
const parse = await napBoDoc();
function giaTri(n) {
  if (!n) return [];
  switch (n.type) {
    case 'Literal': return typeof n.value === 'string' ? [n.value] : [];
    case 'TemplateLiteral': return [n.quasis.map(q => q.value.cooked ?? q.value.raw).join('1')];
    case 'ArrowFunctionExpression': case 'FunctionExpression': return n.body?.type === 'BlockStatement' ? ['1'] : giaTri(n.body);
    case 'ConditionalExpression': return [...giaTri(n.consequent), ...giaTri(n.alternate)];
    case 'BinaryExpression': return [...giaTri(n.left), ...giaTri(n.right)];
    default: return [];
  }
}
/** { khóa: { vi, en, ko } } của file và chữ trong khuôn trang. */
function chuKhachDoc(nguon) {
  if (!nguon) return { bang: new Map(), cau: [] };
  const { ast } = parse(nguon);
  const bang = new Map();
  const cau = [];
  const laBaTieng = o => o?.type === 'ObjectExpression' && ['vi', 'en'].every(k => o.properties.some(p => (p.key?.name ?? p.key?.value) === k));
  const di = n => {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(di); return; }
    if (laBaTieng(n)) {
      const lay = k => n.properties.find(p => (p.key?.name ?? p.key?.value) === k)?.value;
      const [vi, en, ko] = ['vi', 'en', 'ko'].map(lay);
      for (const [nn, v] of [['vi', vi], ['en', en], ['ko', ko]]) for (const s of giaTri(v)) cau.push({ nn, s });
    }
    if (n.type === 'Property' && laBaTieng(n.value)) {
      const lay = k => n.value.properties.find(p => (p.key?.name ?? p.key?.value) === k)?.value;
      bang.set(n.key?.name ?? n.key?.value, { vi: giaTri(lay('vi')), en: giaTri(lay('en')), ko: lay('ko') ? giaTri(lay('ko')) : null });
    }
    if (n.type === 'JSXElement' && ['script', 'style'].includes(n.openingElement?.name?.name)) return;
    if (n.type === 'JSXText' && n.value.trim()) cau.push({ nn: 'khuon', s: n.value.trim() });
    for (const [k, v] of Object.entries(n)) if (k !== 'parent' && v && typeof v === 'object') di(v);
  };
  di(ast.frontmatter);
  di(ast.body ?? ast.children ?? []);
  return { bang, cau };
}
const CHU_TRANG = chuKhachDoc(TRANG.nguon);
const CHU_THE = chuKhachDoc(THE.nguon);
const cauCua = khoa => CHU_TRANG.bang.get(khoa) ?? CHU_THE.bang.get(khoa) ?? null;

// Lớp dùng chung của cong-khai.css (skill thiet-ke-beeftown, trang-cong-khai.md "Danh mục") và hai lớp biểu tượng của
// hỏi đáp. Lớp khác trong hai component phải mang tiền tố mtv-.
const LOP_CHUNG = new Set(['muc', 'khung', 'khung-hep', 'be-kem', 'be-kem-sau', 'be-kem-dam', 'be-toi', 'be-do', 'hieu', 'dan', 'nho',
  'an-chu', 'nut', 'nut-chinh', 'nut-vien', 'nut-nho', 'hang-nut', 'lien-ket', 'the', 'luoi', 'trang-thai', 'anh', 'chu-thich-anh',
  'khung-anh', 'cau-hoi', 'tra-loi', 'mon', 'nhan-mon', 'o', 'loi-o', 'mo-dau-trang', 'tach-nen', 'bt-mo', 'bt-dong']);

// ===========================================================================
await nhom('0 · HAI COMPONENT CÓ MẶT, NHẬN ĐÚNG PROPS CỦA HỢP ĐỒNG (MỤC 2.6, 2.8)', async () => {
  ok('TrangMuaThitVe.astro và MuaThitThe.astro có mặt', !!TRANG.nguon && !!THE.nguon);
  ok('TrangMuaThitVe nhận { ngonNgu, noiDung, menu, trangThai, thamSo, duongDan }',
     ['ngonNgu: NgonNgu', 'noiDung: NoiDung', 'menu: MenuMuaThit', 'trangThai: TrangThaiTrang', 'thamSo: [string, string][]', 'duongDan: string']
       .every(p => TRANG.dau.includes(p)));
  ok('MuaThitThe nhận { sanPham, ngonNgu, noiDung, gio, coOChon }',
     ['sanPham: SanPhamMua', 'ngonNgu: NgonNgu', 'noiDung: NoiDung', 'gio: Map<string, number>', 'coOChon: boolean'].every(p => THE.dau.includes(p)));
  ok('Đơn và tin đơn tính bằng hàm của don-mua-thit.ts: docGio(thamSo, menu.sanPham, choGiao) → tinhDon(…) → taoTinDon(don, nn, msSoan)',
     /docGio\(thamSo, menu\.sanPham, choGiao\)/.test(TRANG.dau) && /tinhDon\(gio, cachNhan, menu\.sanPham, boTamHet\)/.test(TRANG.dau)
       && /taoTinDon\(don, nn, msSoan\)/.test(TRANG.khuon) && /const msSoan = Date\.now\(\);/.test(TRANG.dau));
  ok('Trang nhận giao tận nơi theo coGiaoHang(nd) (mua-thit-ve.ts), đích đặt hàng theo dichDatHang(nd) (dich-dat-hang.ts)',
     /const choGiao = coGiaoHang\(nd\);/.test(TRANG.dau) && /const dich = dichDatHang\(nd\);/.test(TRANG.dau));
});

// ===========================================================================
await nhom('1 · FORM GET THẬT, CHỈ Ở TRẠNG THÁI MỞ; "CHƯA MỞ" KHÔNG MỜI NHẮN', async () => {
  const form = theMo(TRANG.khuon, '<form');
  ok('Form là <form method="get"> thật, action là duongDan + \'#xem-don\', autocomplete="off"',
     dem(TRANG.khuon, /<form\b/) === 1 && /\smethod="get"/.test(form) && /\saction=\{duongDan \+ '#xem-don'\}/.test(form)
       && /\sautocomplete="off"/.test(form) && /\sdata-mtv-form\b/.test(form), form || 'không thấy <form');
  const mo = khoi(TRANG.khuon, "{trangThai === 'mo' ? (");
  const chuaMo = khoi(TRANG.khuon, "{trangThai === 'chua_mo' && (");
  const loi = khoi(TRANG.khuon, "{trangThai === 'loi' && (");
  ok('Form chỉ dựng ở trạng thái mo; chua_mo, loi, het_quay không có form',
     /^\{trangThai === 'mo' \? \(\s*<form\b/.test(mo) && !/<form\b/.test(chuaMo) && !/<form\b/.test(loi)
       && !/<form\b/.test(TRANG.khuon.slice(TRANG.khuon.indexOf(mo) + mo.length)) && !/<form\b/.test(THE.khuon),
     `nhánh mo: ${mo.slice(0, 60)}…`);
  ok('Trạng thái chua_mo chỉ có h1, câu chưa mở, link Xem thực đơn — không câu mời nhắn, không nút kênh',
     !!chuaMo && /<h1\b[^>]*>\{c\.chuaMoH1\}<\/h1>/.test(chuaMo) && chuaMo.includes('{c.chuaMoDan}')
       && /href=\{duongDanTuongUng\('\/thuc-don', nn\)\}/.test(chuaMo) && dem(chuaMo, /<a\b/) === 1
       && !/\bnut\b|lh\.|zalo|data-tien|dinhDangTien|<form|mtv-ba-buoc|cau-hoi|<button/i.test(chuaMo), chuaMo.slice(0, 200));
  const cauChuaMo = ['chuaMoH1', 'chuaMoDan'].flatMap(k => ['vi', 'en', 'ko'].flatMap(nn => cauCua(k)?.[nn] ?? []));
  ok('…câu chưa mở không mời nhắn, không hứa liên hệ lại (không "Zalo", "nhắn", "liên hệ", "message", "contact", "메시지", "연락")',
     cauChuaMo.length === 6 && cauChuaMo.every(s => !/zalo|nhắn|liên hệ|message|contact|메시지|연락/i.test(s)), cauChuaMo.join(' | '));
  ok('Trạng thái loi: câu "chưa tải được", nút chính nhắn Zalo OA (lienHe), link Xem thực đơn; không giá, không form',
     !!loi && loi.includes('{c.loiH1}') && loi.includes('{c.loiCau}') && /class="nut nut-chinh" href=\{lh\.zalo\}/.test(loi)
       && loi.includes('{c.nutNhanZalo}') && loi.includes('{c.xemThucDon}') && !/data-tien|dinhDangTien/.test(loi), loi.slice(0, 200));
  const sauMo = TRANG.khuon.slice(TRANG.khuon.indexOf(mo) + mo.length);
  const hetQuay = /^\s*:\s*\(/.test(sauMo) ? khoi(sauMo, '(') : '';
  ok('Trạng thái het_quay: không form, thẻ gói không có ô chọn, thẻ "tạm hết" có câu tạm hết và nút nhắn Zalo OA, không thanh dưới',
     !!hetQuay && !/<form\b|data-mtv-thanh|data-mtv-xem-don/.test(hetQuay) && /coOChon=\{false\}/.test(hetQuay)
       && /data-mtv-het-quay/.test(hetQuay) && hetQuay.includes('{c.hetQuay}') && /href=\{lh\.zalo\}/.test(hetQuay), hetQuay.slice(0, 200));
  ok('Thẻ gói ở trạng thái mo có ô chọn: coOChon={true}', /coOChon=\{true\}/.test(mo));
});

// ===========================================================================
await nhom('2 · THỨ CHẠY NHỜ JAVASCRIPT RA TRANG VỚI hidden; [hidden] THẮNG .nut', async () => {
  const chep = theMo(TRANG.khuon, 'data-mtv-chep ');
  const thanh = theMo(TRANG.khuon, 'data-mtv-thanh');
  const thanhXem = theMo(TRANG.khuon, 'data-mtv-thanh-xem');
  const tru = theMo(THE.khuon, 'data-mtv-buoc="-1"');
  const cong = theMo(THE.khuon, 'data-mtv-buoc="1"');
  ok('Nút Chép đơn, nút −/+, thanh dưới ra trang với hidden; mỗi component có quy tắc [hidden] { display: none !important; }',
     [chep, thanh, thanhXem, tru, cong].every(t => /\shidden(?=[\s>])/.test(t))
       && HAI.every(([, f]) => /(^|[\s}])\[hidden\]\s*\{\s*display:\s*none\s*!important;?\s*\}/.test(boChuThichCss(f.style))),
     [chep, thanh, thanhXem, tru, cong].map(t => t.slice(0, 50)).join(' | '));
  ok('…quy tắc [hidden] viết trơn, không ".ck [hidden]" (Astro gắn phạm vi cho .ck, body.ck không mang dấu đó)',
     HAI.every(([, f]) => !/\.ck\s+\[hidden\]/.test(f.style)));
  ok('Nút −/+ là <button type="button">, không mang lớp .nut (phép đo .nut đòi đệm 20px)',
     [tru, cong].every(t => /^<button\b/.test(t) && /type="button"/.test(t) && !/\bnut\b/.test(t)) && /class="mtv-buoc"/.test(tru));
  ok('Không is:inline, define:vars, client: trong hai component', HAI.every(([, f]) => !/is:inline|define:vars|\sclient:/.test(f.nguon)));
});

// ===========================================================================
await nhom('3 · ĐÍCH ĐẶT HÀNG CHỈ TỪ dich-dat-hang.ts (QUYẾT ĐỊNH 4)', async () => {
  const gui = theMo(TRANG.khuon, 'data-mtv-gui');
  const chuGuiTuViet = ['Chép đơn', 'Mở chat Zalo', 'Copy the order', 'Open Zalo chat', '주문 복사', 'Dán tin vào khung chat', 'Xem đơn và gửi qua Zalo'];
  ok('Nút gửi đơn lấy href từ linkGuiDon; component không có chữ "zalo.me", không OA ID, không tự viết chữ của bước gửi (lấy CHU_DICH)',
     /^<a\b/.test(gui) && /href=\{linkGuiDon\(dich, gio, cachNhan\)\}/.test(gui) && /rel="noopener"/.test(gui)
       && HAI.every(([, f]) => !/zalo\.me/i.test(f.nguon) && !/\d{12,}/.test(f.nguon))
       && !chuGuiTuViet.some(s => CHU_TRANG.cau.some(c => c.s.includes(s)) || CHU_THE.cau.some(c => c.s.includes(s)))
       && ['buocGui', 'nutXemDon', 'buocSau', 'nutGui', 'nutChep', 'chepTay', 'sauNut'].every(k => TRANG.khuon.includes(`chuDich.${k}[nn]`))
       && /const chuDich = dich \? CHU_DICH\[dich\.cach\]/.test(TRANG.dau), gui);
  const dichAttr = TRANG.khuon.match(/data-dich[\w-]*=\{[^}]*\}+/g) ?? [];
  ok('Đích đặt hàng xuống script bằng đúng một data-dich={JSON.stringify(dich)}; script không có chữ "chep_tin_mo_chat_oa", không gán coBuocChep',
     dichAttr.length === 1 && dichAttr[0] === 'data-dich={JSON.stringify(dich)}' && /JSON\.parse\(form\.dataset\.dich/.test(TRANG.script)
       && !/chep_tin_mo_chat_oa/.test(TRANG.script) && !/coBuocChep\s*[:=]/.test(TRANG.script), dichAttr.join(' | '));
  ok('Bước chép (khung tin, câu chép tay, nút Chép đơn) chỉ dựng khi dich.coBuocChep',
     chiTrongKhoi(TRANG.khuon, '{dich.coBuocChep && (', 'id="mtv-tin"') && chiTrongKhoi(TRANG.khuon, '{dich.coBuocChep && (', 'data-mtv-chep-tay')
       && chiTrongKhoi(TRANG.khuon, '{dich.coBuocChep && (', 'data-mtv-chep '));
  ok('Script đổi href nút gửi qua linkGuiDon mỗi lần giỏ đổi, nạp linkGuiDon từ dich-dat-hang và hàm đơn từ don-mua-thit — không nạp file chạy máy chủ',
     /\.href = linkGuiDon\(dich, /.test(TRANG.script) && /from '\.\.\/lib\/dich-dat-hang'/.test(TRANG.script)
       && /from '\.\.\/lib\/don-mua-thit'/.test(TRANG.script)
       && !/lib\/(?:noi-dung|mua-thit-ve|trang-cong-khai|chu)['.]/.test(TRANG.script) && !/supabase/i.test(TRANG.script));
});

// ===========================================================================
await nhom('4 · SỐ TIỀN: CHỈ QUA dinhDangTien, CHỈ TRONG data-tien', async () => {
  const goi = HAI.flatMap(([, f]) => f.khuon.match(/dinhDangTien\(/g) ?? []).length;
  const dungCho = HAI.flatMap(([, f]) => f.khuon.match(/<span(?: class="[\w-]+")? data-tien>\{dinhDangTien\([^{}<>]*\)\}<\/span>/g) ?? []).length;
  const noiDungTien = HAI.flatMap(([, f]) => [...f.khuon.matchAll(/<(span|textarea)\b[^>]*\sdata-tien\b[^>]*>([\s\S]*?)<\/\1>/g)].map(m => m[2]));
  ok('Mọi lời gọi dinhDangTien nằm trong phần tử có data-tien; trong data-tien chỉ có số tiền',
     goi > 0 && goi === dungCho && noiDungTien.length > 0
       && noiDungTien.every(s => /^\{dinhDangTien\([^{}]*\)\}$/.test(s) || /^\{taoTinDon\(don, nn, msSoan\)\}$/.test(s)),
     `${goi} lời gọi, ${dungCho} đúng chỗ; nội dung data-tien: ${noiDungTien.join(' | ')}`);
  const tienScript = TRANG.script.match(/dinhDangTien\(/g) ?? [];
  const oTien = /function oTien\([^)]*\)[^{]*\{([\s\S]*?)\n  \}/.exec(TRANG.script)?.[1] ?? '';
  ok('Script: số tiền chỉ in qua một hàm oTien tạo <span data-tien> (dataset.tien), không chỗ nào khác gọi dinhDangTien',
     tienScript.length === 1 && /dinhDangTien\(/.test(oTien) && /dataset\.tien = ''/.test(oTien), `${tienScript.length} lời gọi`);
  ok('Textarea tin đơn: readonly, lang="vi", data-tien; h2 #xem-don có tabindex="-1"',
     (t => /\sreadonly(?=[\s>])/.test(t) && /\slang="vi"/.test(t) && /\sdata-tien(?=[\s>])/.test(t) && /\sid="mtv-tin"/.test(t)
       && /aria-describedby="mtv-chep-tay"/.test(t))(theMo(TRANG.khuon, 'id="mtv-tin"'))
       && /<h2 id="xem-don" tabindex="-1"/.test(TRANG.khuon), theMo(TRANG.khuon, 'id="mtv-tin"'));
  ok('Giá gói: span.mtv-gia[data-tien] = dinhDangTien(goi.gia)', /<span class="mtv-gia" data-tien>\{dinhDangTien\(goi\.gia\)\}<\/span>/.test(THE.khuon));
});

// ===========================================================================
await nhom('5 · KHÔNG HỎI THÔNG TIN CÁ NHÂN, KHÔNG <img>, HAI VÙNG THÔNG BÁO', async () => {
  ok('Không ô input chữ, điện thoại, email, radio, checkbox', HAI.every(([, f]) => !/<input\b/i.test(f.khuon) && !/createElement\('input'\)/.test(f.script)));
  ok('Ô số gói là <select name={goi.khoa}> 0–SO_GOI_TOI_DA, chọn sẵn theo giỏ; nhãn ẩn đọc tên gói và tên sản phẩm',
     /<select name=\{goi\.khoa\} id=\{[^}]+\} class="mtv-so">/.test(THE.khuon) && /SO_GOI_TOI_DA/.test(THE.dau)
       && /selected=\{so === \(gio\.get\(goi\.khoa\) \?\? 0\)\}/.test(THE.khuon) && /<label class="an-chu" for=\{/.test(THE.khuon));
  ok('Không <img>; ảnh chỉ qua KhungAnh loai="khay"',
     HAI.every(([, f]) => !/<img\b|<Anh\b/.test(f.khuon)) && /<KhungAnh loai="khay" tiLe="4 \/ 3" tiLeNho="1 \/ 1" \/>/.test(THE.khuon)
       && !/<KhungAnh\b/.test(TRANG.khuon));
  const live = HAI.reduce((s, [, f]) => s + dem(f.nguon, /aria-live/), 0);
  const status = HAI.reduce((s, [, f]) => s + dem(f.nguon, /role="status"|'status'/), 0);
  const tamTinh = theMo(TRANG.khuon, 'data-mtv-tam-tinh');
  ok('Đúng hai vùng thông báo: một aria-live (tạm tính) và một role="status" (câu chép)',
     live === 1 && status === 1 && /aria-live="polite"/.test(tamTinh) && /aria-atomic="true"/.test(tamTinh)
       && /role="status"/.test(theMo(TRANG.khuon, 'data-mtv-bao')), `aria-live ${live}, role=status ${status}`);
  ok('Vùng tạm tính có mẩu ẩn [data-mtv-vua-doi] đứng trước chữ "Tạm tính", trên một dòng mã',
     /<p class="mtv-tam-tinh"[^>]*data-mtv-tam-tinh[^>]*><span class="an-chu" data-mtv-vua-doi><\/span>\{CHU_DON\.tamTinh\[nn\]\}: <span data-tien>\{dinhDangTien\(don\.tamTinh\)\}<\/span><\/p>/.test(TRANG.khuon));
});

// ===========================================================================
await nhom('6 · CÂU CHỮ: ĐÚNG SỰ THẬT, KHÔNG CHỮ TẠM (QUYẾT ĐỊNH 1, 3)', async () => {
  const tatCa = [...CHU_TRANG.cau, ...CHU_THE.cau];
  ok(`Đọc được câu của hai component (${CHU_TRANG.cau.length} + ${CHU_THE.cau.length})`, CHU_TRANG.cau.length >= 120 && CHU_THE.cau.length >= 20);
  const CAM = /[[\]]|chờ chốt|chụp sau|giờ thử|giá thử|quán báo giá|báo giá|thành công|\bsuccess|성공|mã đơn|order (?:code|number)|주문 번호|đã đặt|đã gửi đơn|đã xác nhận/i;
  const sai = tatCa.filter(c => CAM.test(c.s));
  ok('Chữ không có ngoặc vuông, "chờ chốt", "chụp sau", "giờ thử", "giá thử", "Quán báo giá", "thành công", "mã đơn"', sai.length === 0,
     sai.slice(0, 4).map(c => `[${c.nn}] «${c.s.slice(0, 60)}»`).join(' | '));
  ok('Không ngonNgu === \'en\' ? … : … (thứ tiếng thứ ba rơi vào nhánh sai) — chữ đi qua dich()',
     HAI.every(([, f]) => !/===\s*'(?:en|ko|vi)'\s*\?/.test(f.nguon)));
  const giaCongBo = cauCua('giaCongBo');
  ok('Câu giaCongBo nói giá là giá quán đã công bố và quán xác nhận tổng tiền khi liên hệ lại (vi, en, ko)',
     !!giaCongBo && /giá quán đã công bố/.test(giaCongBo.vi[0]) && /xác nhận tổng tiền/.test(giaCongBo.vi[0])
       && /published/.test(giaCongBo.en[0]) && /total/.test(giaCongBo.en[0]) && /공지한 가격/.test(giaCongBo.ko?.[0] ?? '') && /총액/.test(giaCongBo.ko?.[0] ?? ''),
     JSON.stringify(giaCongBo));
  const mo = khoi(TRANG.khuon, "{trangThai === 'mo' ? (");
  const sauMo = TRANG.khuon.slice(TRANG.khuon.indexOf(mo) + mo.length);
  const hetQuay = /^\s*:\s*\(/.test(sauMo) ? khoi(sauMo, '(') : '';
  const nhanMo = mo.match(/<details class="the mtv-nhan"[\s\S]*?<\/details>/)?.[0] ?? '';
  const nhanHet = hetQuay.match(/<details class="the mtv-nhan"[\s\S]*?<\/details>/)?.[0] ?? '';
  const don = mo.match(/<div class="the mtv-don"[\s\S]*?<div class="hang-nut">/)?.[0] ?? '';
  ok('Giá đúng quyết định 1: câu giaCongBo có trong thẻ Nhận hàng và khối Đơn của bạn ở trạng thái mo, trong thẻ Nhận hàng ở het_quay; hỏi đáp 3 luôn dựng',
     nhanMo.includes('{c.giaCongBo}') && don.includes('{c.giaCongBo}') && nhanHet.includes('{c.giaCongBo}')
       && ngoaiDieuKien(hoiDapCua(TRANG.khuon), '<summary>{c.cauHoi3}'),
     `Nhận hàng (mo) ${nhanMo.includes('{c.giaCongBo}')}, Đơn ${don.includes('{c.giaCongBo}')}, Nhận hàng (het_quay) ${nhanHet.includes('{c.giaCongBo}')}`);
  // Hai trạng thái mo và het_quay chép cùng thẻ Nhận hàng và cùng vòng dựng nhóm (form bọc ngoài chỉ ở mo): sửa một
  // bản mà quên bản kia là trang hai trạng thái lệch nhau.
  const gonKhoi = x => x.replace(/\s+/g, ' ').trim();
  const dsMo = mo.match(/<div class="mtv-danh-sach">[\s\S]*?\)\)\}\s*<\/div>/)?.[0] ?? '';
  const dsHet = hetQuay.match(/<div class="mtv-danh-sach">[\s\S]*?\)\)\}\s*<\/div>/)?.[0] ?? '';
  ok('Thẻ Nhận hàng và vòng dựng nhóm của mo và het_quay giống hệt nhau (chỉ khác coOChon)',
     !!nhanMo && gonKhoi(nhanMo) === gonKhoi(nhanHet) && !!dsMo
       && gonKhoi(dsMo.replace('coOChon={true}', 'coOChon={?}')) === gonKhoi(dsHet.replace('coOChon={false}', 'coOChon={?}')),
     `${gonKhoi(nhanMo) === gonKhoi(nhanHet)} · ${gonKhoi(dsMo).slice(0, 80)} | ${gonKhoi(dsHet).slice(0, 80)}`);
  const LUON = [1, 2, 3, 4, 6, 9, 10, 11, 12];
  ok(`Hỏi đáp ${LUON.join(', ')} luôn dựng (không nằm trong điều kiện)`,
     LUON.every(i => ngoaiDieuKien(hoiDapCua(TRANG.khuon), `<summary>{c.cauHoi${i}}`)),
     LUON.filter(i => !ngoaiDieuKien(hoiDapCua(TRANG.khuon), `<summary>{c.cauHoi${i}}`)).join(', '));
  ok('Không giá theo kg hay theo 100 g (quyết định 3): hai component không khớp /\\bkg\\b/ (bắt cả "per kg", "mỗi kg", "kg당"; không bắt "background") hay /\\b100\\s?g\\b/',
     HAI.every(([, f]) => !/\bkg\b/i.test(f.nguon) && !/\b100\s?g\b/i.test(f.nguon)) && /\bkg\b/.test('per kg') && /\bkg\b/.test('kg당') && !/\bkg\b/.test('background'));
  const tinTiengViet = cauCua('tinTiengViet');
  ok('Câu tinTiengViet bản vi là chuỗi rỗng và chỉ dựng khi chuỗi khác rỗng (trang en / ko)',
     !!tinTiengViet && tinTiengViet.vi[0] === '' && !!tinTiengViet.en[0] && !!tinTiengViet.ko?.[0]
       && chiTrongKhoi(TRANG.khuon, '{c.tinTiengViet && (', '{c.tinTiengViet}'), JSON.stringify(tinTiengViet));
  ok('Nhãn gói "khoảng" (quyết định 2) lấy từ nhanGoi của don-mua-thit.ts — component không tự viết cỡ gói',
     /nhanGoi\(sanPham\.donVi, goi\.soGam, ngonNgu\)/.test(THE.khuon) && !tatCa.some(c => /khoảng \d|about \d|약 \d/.test(c.s)));
});

// ===========================================================================
await nhom('7 · HỎI ĐÁP, GIAO TẬN NƠI, KHÔNG DÙNG ZALO', async () => {
  const hoiDap = TRANG.khuon.slice(TRANG.khuon.indexOf('<div class="cau-hoi">'));
  const summary = hoiDap.match(/<summary>[\s\S]*?<\/summary>/g) ?? [];
  ok('Hỏi đáp: div.cau-hoi bọc details, mỗi summary có BieuTuong cong (bt-mo) và tru (bt-dong)',
     TRANG.khuon.includes('<div class="cau-hoi">') && !/<details class="cau-hoi"/.test(TRANG.khuon) && summary.length === 13
       && summary.every(s => /<BieuTuong ten="cong" class="bt-mo" \/><BieuTuong ten="tru" class="bt-dong" \/><\/summary>$/.test(s)),
     `${summary.length} câu hỏi`);
  ok('Lựa chọn Giao tận nơi, dòng Giao tận nơi và hỏi đáp 5 chỉ dựng khi coGiaoHang(nd)',
     ['name="nhan"', '{c.dtGiao}', '{c.cauHoi5}', '{c.chuaGomGiao}'].every(tk => chiTrongKhoi(TRANG.khuon, '{choGiao && (', tk)),
     ['name="nhan"', '{c.dtGiao}', '{c.cauHoi5}', '{c.chuaGomGiao}'].filter(tk => !chiTrongKhoi(TRANG.khuon, '{choGiao && (', tk)).join(', '));
  ok('Dòng "Không dùng Zalo?" và hỏi đáp 13 chỉ khi lienHe(nd).goi',
     /const lh = lienHe\(nd\);/.test(TRANG.dau) && chiTrongKhoi(TRANG.khuon, '{lh.goi && (', 'data-mtv-khong-zalo')
       && chiTrongKhoi(TRANG.khuon, '{lh.goi && (', '{c.cauHoi13}') && /<a href=\{lh\.goi\}>\{lh\.hotline\}<\/a>/.test(TRANG.khuon));
  ok('Hỏi đáp 12 dẫn tới trang Hỏi bàn đúng thứ tiếng, chữ "Hỏi bàn" của chu.ts',
     /href=\{duongDanTuongUng\('\/dat-ban', nn\)\}>\{t\.datBan\}/.test(TRANG.khuon));
  ok('Hỏi đáp 7 (bảo quản), 8 (cân lệch) chỉ khi khóa đã công bố; 9, 10 có câu mặc định',
     chiTrongKhoi(TRANG.khuon, '{(baoQuanMat || baoQuanDong) && (', '{c.cauHoi7}') && chiTrongKhoi(TRANG.khuon, '{canLech && (', '{c.cauHoi8}')
       && /\{hangLoi \?\? c\.hangLoiMacDinh\}/.test(TRANG.khuon) && /\{doiHuy \?\? c\.doiHuyMacDinh\}/.test(TRANG.khuon));
  ok('Thuế chỉ khi mua_thit_thue đã công bố; giờ nhận có câu mặc định', chiTrongKhoi(TRANG.khuon, '{thue && (', '{c.dtThue}')
     && /\{gioNhan \?\? c\.gioMacDinh\}/.test(TRANG.khuon));
  const mo = khoi(TRANG.khuon, "{trangThai === 'mo' ? (");
  const iNhan = mo.indexOf('mtv-nhan'), iDs = mo.indexOf('mtv-danh-sach'), iDon = mo.indexOf('mtv-don"');
  const iHetForm = TRANG.khuon.indexOf('</form>'), iXem = TRANG.khuon.indexOf('data-mtv-xem-don');
  ok('Thứ tự trong mã: Nhận hàng → danh sách → Đơn của bạn; khối Xem lại đơn nằm sau form',
     iNhan > 0 && iNhan < iDs && iDs < iDon && iHetForm > 0 && iXem > iHetForm && !/<\/section>/.test(TRANG.khuon.slice(iHetForm, iXem)),
     `${iNhan} < ${iDs} < ${iDon}; </form> ${iHetForm} < Xem lại đơn ${iXem}`);
  ok('Nhận hàng là details đóng sẵn (không open), summary có tên và dòng tóm tắt',
     /<details class="the mtv-nhan">\s*<summary><span class="mtv-nhan-ten">\{c\.nhanHang\}<\/span><span class="mtv-nhan-tom">/.test(TRANG.khuon)
       && !/<details class="the mtv-nhan"[^>]*\sopen/.test(TRANG.khuon));
  ok('Tên sản phẩm có lang="vi" khi trang không phải tiếng Việt mà tên chưa có bản dịch',
     /lang=\{ngonNgu !== 'vi' && sanPham\.ten === sanPham\.tenVi \? 'vi' : undefined\}/.test(THE.khuon));
  ok('Gói tạm hết: chữ "Tạm hết ở quầy" thay cụm chọn, giá vẫn hiện',
     /\{goi\.tamHet \? \(\s*<span class="mtv-tam-het" data-mtv-tam-het>\{c\.tamHet\}<\/span>/.test(THE.khuon));
});

// ===========================================================================
await nhom('8 · CSS: TIỀN TỐ mtv-, DI CHUỘT, THANH DƯỚI', async () => {
  const lopLa = HAI.flatMap(([ten, f]) => {
    const trongCss = [...boChuThichCss(f.style).matchAll(/\.(-?[a-z][\w-]*)/g)].map(m => m[1]).filter(l => !/^\d/.test(l));
    const trongThe = [...f.khuon.matchAll(/\sclass="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/));
    return [...trongCss, ...trongThe].filter(l => l && !l.startsWith('mtv-') && !LOP_CHUNG.has(l)).map(l => `${ten}: .${l}`);
  });
  const diChuotTran = HAI.filter(([, f]) => /:hover/.test(boKhoiDiChuot(boChuThichCss(f.style)))).map(([ten]) => ten);
  const gia = /\.mtv-gia\s*\{([^}]*)\}/.exec(boChuThichCss(THE.style))?.[1] ?? '';
  ok('Lớp CSS riêng mang tiền tố mtv-; :hover nằm trong @media (hover: hover); không scroll-padding trên form; .mtv-gia white-space: nowrap',
     lopLa.length === 0 && diChuotTran.length === 0 && HAI.every(([, f]) => !/scroll-padding/.test(f.style)) && /white-space:\s*nowrap/.test(gia),
     [...new Set(lopLa)].slice(0, 6).join(', ') + (diChuotTran.length ? ` · :hover trần ở ${diChuotTran.join(', ')}` : ''));
  const css = boChuThichCss(TRANG.style);
  const thanh = /\.mtv-thanh\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  const zIndex = Number(/z-index:\s*(\d+)/.exec(thanh)?.[1] ?? NaN);
  const thap = /@media\s*\(max-height:\s*500px\)\s*\{[^{}]*\.mtv-thanh\s*\{[^}]*display:\s*none/.test(css);
  ok('Thanh dưới: z-index dưới 40, ẩn ở @media (max-height: 500px), không env(safe-area-inset-bottom)',
     /position:\s*sticky/.test(thanh) && /bottom:\s*0/.test(thanh) && zIndex < 40 && thap && !/safe-area-inset/.test(TRANG.nguon), thanh);
  ok('Thanh dưới ẩn từ 1024px; "Đơn của bạn" chỉ dính khi màn từ 1024px và cao từ 760px',
     /@media\s*\(min-width:\s*1024px\)\s*\{[^{}]*\.mtv-thanh\s*\{[^}]*display:\s*none/.test(css)
       && /@media\s*\(min-width:\s*1024px\)\s*and\s*\(min-height:\s*760px\)\s*\{[^{}]*\.mtv-don\s*\{[^}]*position:\s*sticky/.test(css));
  ok('Ô chọn và nút −/+ không bị thanh dưới che khi Tab tới (scroll-margin-bottom dưới 1024px)',
     /scroll-margin-bottom:\s*calc\(64px \+ var\(--k-3\)\)/.test(boChuThichCss(THE.style)));
  ok('Hai component có @media (forced-colors: active) (viền nút −/+, thanh dưới)', HAI.every(([, f]) => /@media\s*\(forced-colors:\s*active\)/.test(f.style)));
  ok('Không box-shadow, không mã màu viết thẳng (chỉ token)', HAI.every(([, f]) => !/box-shadow/.test(boChuThichCss(f.style)) && !/#[0-9a-f]{3,8}\b|rgba?\(/i.test(boChuThichCss(f.style))));
});

// ===========================================================================
await nhom('9 · SCRIPT: CHẠY NGAY, Back / tải lại, CHÉP ĐƠN ĐÚNG SỰ THẬT', async () => {
  const s = TRANG.script;
  ok('Script: gọi capNhat ngay khi chạy và ở pageshow; dùng formdata, không disabled; setSelectionRange; không innerHTML; gán href qua linkGuiDon',
     /^\s{4}capNhat\(\);$/m.test(s) && /addEventListener\('pageshow', capNhat\)/.test(s) && /addEventListener\('formdata'/.test(s)
       && !/disabled/.test(s) && /setSelectionRange\(0, tin\.value\.length\)/.test(s) && !/innerHTML|outerHTML|insertAdjacentHTML/.test(s)
       && /\.href = linkGuiDon\(/.test(s));
  ok('formdata bỏ các ô bằng "0" (địa chỉ ngắn); giỏ rỗng thì chặn gửi và đưa con trỏ về ô chọn đầu',
     /=== '0'/.test(s) && /formData\.delete\(/.test(s) && /preventDefault\(\)/.test(s));
  const iAwait = s.indexOf('await navigator.clipboard.writeText(tin.value)');
  const iDaChep = s.indexOf('daChep', iAwait);
  const iCatch = s.indexOf('catch', iAwait);
  ok('"Đã chép đơn" chỉ ghi SAU khi await chép xong (cùng khối try); chép lỗi thì hiện câu chép tay và bôi đen khung đơn',
     iAwait > 0 && iDaChep > iAwait && iDaChep < iCatch && /try\s*\{\s*await navigator\.clipboard\.writeText\(tin\.value\);/.test(s)
       && /catch\s*\{[\s\S]*?chepLoi[\s\S]*?hidden = false[\s\S]*?tin\.focus\(\)/.test(s.slice(iCatch - 2)));
  ok('Nút Chép đơn chỉ hiện khi trình duyệt có navigator.clipboard.writeText; khi đó ẩn câu chép tay',
     /typeof navigator\.clipboard\?\.writeText === 'function'/.test(s));
  ok('data-menu dựng bằng rutGonMenu', /data-menu=\{JSON\.stringify\(rutGonMenu\(menu\.sanPham\)\)\}/.test(TRANG.khuon));
  ok('Nút −/+ đổi ô chọn trong 0…SO_GOI_TOI_DA rồi phát sự kiện change; ghi "{tên}, {gói}: {n}." vào vùng live',
     /SO_GOI_TOI_DA/.test(s) && /dispatchEvent\(new Event\('change', \{ bubbles: true \}\)\)/.test(s) && /CHU_DON\.vuaDoi\[nn\]/.test(s));
  ok('Nhận hàng mở sẵn từ 1024px (matchMedia, nghe change); không JavaScript thì đóng, khách bấm để mở',
     /matchMedia\('\(min-width: 1024px\)'\)/.test(s) && /\.open = true/.test(s) && /addEventListener\('change', moNhanHang\)/.test(s));
  ok('Mọi truy vấn phần tử trong script có kiểu và được kiểm null (querySelector<…>)',
     !/querySelector\((?!<)/.test(s.replace(/querySelector<[^>]+>\(/g, '')));
});

process.exit(ketThuc('TRANG MUA THỊT VỀ: HAI COMPONENT'));
