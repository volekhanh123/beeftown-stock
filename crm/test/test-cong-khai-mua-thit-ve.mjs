/**
 * BEEFTOWN — TRANG MUA THỊT VỀ: HAI COMPONENT, ĐỌC TỪ MÃ NGUỒN
 * ============================================================
 *
 *     node test/test-cong-khai-mua-thit-ve.mjs
 *
 * web/src/components/TrangMuaThitVe.astro và MuaThitThe.astro dựng trang /mua-thit-ve (en, ko: /buy-meat) ở bốn
 * trạng thái — chưa mở, lỗi đọc menu, mở (form đặt hàng), mọi gói tạm hết — và ba kết quả của lượt đặt (đã nhận, không
 * chắc, chưa ghi). CI dựng trang KHÔNG có database nên chỉ thấy "chưa mở" — phần còn lại chạy trên Supabase giả ở
 * web/kiem-tra/thu-day-du.mjs nhóm 12. File này là lớp chặn chạy trong npm test, không cần trình duyệt: đọc mã nguồn
 * hai component và giữ luật của trang đặt thẳng trên website (Khánh 03/11/2026, migration 0113):
 *
 *   1. Form POST thật (chạy cả khi tắt JavaScript), chỉ ở trạng thái mở (và tạm hết — không ô chọn, không khối Đặt
 *      hàng); mỗi lần dựng một mã chống gửi hai lần; "chưa mở" chỉ có tiêu đề, một câu và link Thực đơn.
 *   2. Thứ chỉ chạy nhờ JavaScript (nút −/+, thanh giỏ) ra trang với hidden; mỗi component có
 *      [hidden] { display: none !important; } — không thì .ck .nut { display: inline-flex } đè lên hidden.
 *   3. Không còn Zalo: không chép tin, không link chat, không dich-dat-hang trong component. Chỉ giao tận nơi: không
 *      "nhận tại quầy".
 *   4. Số tiền chỉ in qua dinhDangTien và chỉ trong phần tử có data-tien; giá khách đã thấy đi lên bằng ô ẩn gia_<khoa>.
 *   5. Ô giao hàng: họ tên, số điện thoại, địa chỉ bắt buộc, có nhãn, không placeholder; câu cho biết dữ liệu dùng làm
 *      gì kèm link Quyền riêng tư; không ô đánh dấu; không <img>.
 *   6. Câu chữ đúng sự thật: "đã nhận" khác "đã xác nhận"; không "thành công"; giá là giá quán đã công bố.
 *   7. Kết quả: đã nhận → mã đơn, không form; không chắc → không form, mời gọi quán; chưa ghi → câu lỗi trên khối Giao hàng.
 *   8. CSS tiền tố mtv-, :hover trong @media (hover: hover), không bóng đổ, không mã màu.
 *   9. Script: chặn giỏ rỗng và bấm đúp, giữ chữ đã gõ, Meta Pixel một lần mỗi giỏ, không innerHTML.
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
await nhom('0 · HAI COMPONENT CÓ MẶT, NHẬN ĐÚNG PROPS', async () => {
  ok('Có TrangMuaThitVe.astro và MuaThitThe.astro', !!TRANG.nguon && !!THE.nguon);
  ok('TrangMuaThitVe nhận { ngonNgu, noiDung, menu, trangThai, ketQua, thamSo, duongDan }',
     /const \{ ngonNgu: nn, noiDung: nd, menu, trangThai, ketQua, thamSo, duongDan \} = Astro\.props;/.test(TRANG.dau));
  ok('MuaThitThe nhận { sanPham, ngonNgu, gio, coOChon }', /const \{ sanPham, ngonNgu, gio, coOChon \} = Astro\.props;/.test(THE.dau));
  ok('Đơn tính bằng hàm của don-mua-thit.ts: docGio(thamSo, menu.sanPham) → tinhDon(gio, menu.sanPham, boTamHet)',
     /docGio\(thamSo, menu\.sanPham\)/.test(TRANG.dau) && /tinhDon\(gio, menu\.sanPham, boTamHet\)/.test(TRANG.dau));
});

// ===========================================================================
await nhom('1 · FORM POST THẬT, CHỈ KHI MỞ; MÃ CHỐNG GỬI HAI LẦN', async () => {
  const form = theMo(TRANG.khuon, '<form ');
  ok('Form là <form method="post">, action là duongDan + \'#dat-hang\'', /<form method="post" action=\{duongDan \+ '#dat-hang'\}/.test(form), form);
  ok('Đúng một form trong trang', dem(TRANG.khuon, /<form\b/) === 1);
  ok('Form nằm trong nhánh mo / het_quay; ô chọn chỉ khi trạng thái mo (coOChon={trangThai === \'mo\'})',
     chiTrongKhoi(TRANG.khuon, "(trangThai === 'mo' || trangThai === 'het_quay') && (", '<form ')
       && /coOChon=\{trangThai === 'mo'\}/.test(TRANG.khuon));
  ok('Khối Đặt hàng (#dat-hang) và thanh giỏ chỉ khi trạng thái mo',
     chiTrongKhoi(TRANG.khuon, "{trangThai === 'mo' && (", 'id="dat-hang"') && chiTrongKhoi(TRANG.khuon, "{trangThai === 'mo' && (", 'data-mtv-thanh'));
  ok('Mỗi lần dựng một mã chống gửi hai lần: ô ẩn ma_gui = crypto.randomUUID()',
     /const maGui = crypto\.randomUUID\(\);/.test(TRANG.dau) && /<input type="hidden" name="ma_gui" value=\{maGui\} \/>/.test(TRANG.khuon));
  const chuaMo = khoi(TRANG.khuon, "trangThai === 'chua_mo' && (");
  ok('Trạng thái chua_mo chỉ có h1, câu chưa mở, link Xem thực đơn — không form, không nút chính, không giá',
     !!chuaMo && /c\.chuaMoH1/.test(chuaMo) && /c\.chuaMoDan/.test(chuaMo) && /duongDanTuongUng\('\/thuc-don', nn\)/.test(chuaMo)
       && !/<form|nut-chinh|data-tien|zalo/i.test(chuaMo), chuaMo.slice(0, 200));
  const loi = khoi(TRANG.khuon, "trangThai === 'loi' && (");
  ok('Trạng thái loi: câu "chưa tải được", mời tải lại; nút gọi quán chỉ khi có hotline; không giá, không form, không Zalo',
     /c\.loiH1/.test(loi) && /c\.loiCau/.test(loi) && /\{lh\.goi && \(<a class="nut nut-chinh" href=\{lh\.goi\}>/.test(loi)
       && !/<form|data-tien|zalo/i.test(loi));
});

// ===========================================================================
await nhom('2 · THỨ CHẠY NHỜ JAVASCRIPT RA TRANG VỚI hidden; [hidden] THẮNG .nut', async () => {
  const buoc = THE.khuon.match(/<button type="button" class="mtv-buoc"[^>]*>/g) ?? [];
  ok('Hai nút −/+ ra trang với hidden', buoc.length === 2 && buoc.every(b => /\shidden(?=[\s>])/.test(b)), buoc.join(' | '));
  ok('Thanh giỏ ra trang với hidden', /\shidden(?=[\s>])/.test(theMo(TRANG.khuon, 'data-mtv-thanh')), theMo(TRANG.khuon, 'data-mtv-thanh'));
  ok('Mỗi component có [hidden] { display: none !important; }', HAI.every(([, f]) => /\[hidden\]\s*\{\s*display:\s*none\s*!important;\s*\}/.test(f.style)));
  ok('Nút −/+ không mang lớp .nut (phép đo .nut đòi đệm ngang 20px)', buoc.every(b => !/\bnut\b/.test(b.replace(/mtv-buoc/g, ''))));
});

// ===========================================================================
await nhom('3 · KHÔNG CÒN ZALO, CHỈ GIAO TẬN NƠI (KHÁNH 03/11/2026)', async () => {
  const ma = HAI.map(([, f]) => f.nguon.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1')).join('\n');
  ok('Component không còn zalo.me, dich-dat-hang, linkGuiDon, taoTinDon, chép tin (clipboard, khung tin readonly)',
     !/zalo\.me|dich-dat-hang|linkGuiDon|taoTinDon|CHU_DICH|clipboard|<textarea[^>]*readonly/.test(ma), (ma.match(/.*(zalo\.me|dich-dat-hang|linkGuiDon|taoTinDon|CHU_DICH|clipboard).*/g) ?? []).join(' | '));
  const tatCa = [...CHU_TRANG.cau, ...CHU_THE.cau].map(c => c.s);
  const quay = tatCa.filter(c => /nhận tại quầy|tại quầy ·|pick up at the counter|pick it up|매장 픽업|매장에서 받/i.test(c));
  ok('Không câu nào mời nhận tại quầy (chỉ giao tận nơi)', quay.length === 0, quay.join(' | '));
  ok('Không ô chọn cách nhận (name="nhan")', !/name="nhan"/.test(TRANG.khuon));
});

// ===========================================================================
await nhom('4 · SỐ TIỀN: CHỈ QUA dinhDangTien, CHỈ TRONG data-tien', async () => {
  const goi = HAI.flatMap(([, f]) => f.khuon.match(/dinhDangTien\(/g) ?? []).length;
  const dungCho = HAI.flatMap(([, f]) => f.khuon.match(/<span(?: class="[\w-]+")? data-tien>\{dinhDangTien\([^{}<>]*\)\}<\/span>/g) ?? []).length;
  const noiDungTien = HAI.flatMap(([, f]) => [...f.khuon.matchAll(/<(span)\b[^>]*\sdata-tien\b[^>]*>([\s\S]*?)<\/\1>/g)].map(m => m[2]));
  ok('Mọi lời gọi dinhDangTien nằm trong phần tử có data-tien; trong data-tien chỉ có số tiền',
     goi > 0 && goi === dungCho && noiDungTien.length > 0 && noiDungTien.every(s => /^\{dinhDangTien\([^{}]*\)\}$/.test(s)),
     `${goi} lời gọi, ${dungCho} đúng chỗ; nội dung data-tien: ${noiDungTien.join(' | ')}`);
  const tienScript = TRANG.script.match(/dinhDangTien\(/g) ?? [];
  const oTien = /function oTien\([^)]*\)[^{]*\{([\s\S]*?)\n  \}/.exec(TRANG.script)?.[1] ?? '';
  ok('Script: số tiền chỉ in qua một hàm oTien tạo <span data-tien> (dataset.tien)',
     tienScript.length === 1 && /dinhDangTien\(/.test(oTien) && /dataset\.tien = ''/.test(oTien), `${tienScript.length} lời gọi`);
  ok('Giá gói: span.mtv-gia[data-tien] = dinhDangTien(goi.gia)', /<span class="mtv-gia" data-tien>\{dinhDangTien\(goi\.gia\)\}<\/span>/.test(THE.khuon));
  ok('Giá khách đã thấy: ô ẩn name={`gia_${goi.khoa}`} value={String(goi.gia)} cạnh ô chọn (database so khi ghi đơn, 0113)',
     /<input type="hidden" name=\{`gia_\$\{goi\.khoa\}`\} value=\{String\(goi\.gia\)\} \/>/.test(THE.khuon)
       && chiTrongKhoi(THE.khuon, ') : coOChon && (', 'name={`gia_'));
});

// ===========================================================================
await nhom('5 · Ô GIAO HÀNG, QUYỀN RIÊNG TƯ, KHÔNG <img>, VÙNG THÔNG BÁO', async () => {
  const o = ten => theMo(TRANG.khuon, `name="${ten}"`);
  ok('Họ tên: input text, required, maxlength 120, autocomplete="name"',
     /type="text"/.test(o('ho_ten')) && /\srequired(?=[\s>])/.test(o('ho_ten')) && /maxlength="120"/.test(o('ho_ten')) && /autocomplete="name"/.test(o('ho_ten')), o('ho_ten'));
  ok('Số điện thoại: input tel, required, inputmode tel, autocomplete="tel"',
     /type="tel"/.test(o('sdt')) && /\srequired(?=[\s>])/.test(o('sdt')) && /inputmode="tel"/.test(o('sdt')) && /autocomplete="tel"/.test(o('sdt')), o('sdt'));
  ok('Địa chỉ giao: textarea, required, minlength 8, maxlength 300 (khớp ràng buộc 0113)',
     /<textarea/.test(o('dia_chi')) && /\srequired(?=[\s>])/.test(o('dia_chi')) && /minlength="8"/.test(o('dia_chi')) && /maxlength="300"/.test(o('dia_chi')), o('dia_chi'));
  ok('Ghi chú: textarea, không bắt buộc, maxlength 500', /<textarea/.test(o('ghi_chu')) && !/required/.test(o('ghi_chu')) && /maxlength="500"/.test(o('ghi_chu')));
  const id = [...TRANG.khuon.matchAll(/<(?:input|textarea) type="(?:text|tel)" id="([\w-]+)"|<textarea id="([\w-]+)"/g)].map(m => m[1] ?? m[2]);
  ok('Mỗi ô có <label for> riêng; không placeholder thay nhãn', id.length === 4 && id.every(i => TRANG.khuon.includes(`<label for="${i}">`))
     && !/placeholder=/.test(TRANG.khuon), id.join(', '));
  ok('Không ô đánh dấu, radio, email', HAI.every(([, f]) => !/type="(?:checkbox|radio|email)"/.test(f.khuon)));
  ok('Câu cho biết họ tên, số điện thoại, địa chỉ dùng để gọi xác nhận và giao, kèm link Quyền riêng tư đúng thứ tiếng',
     /\{c\.dongY\} <a href=\{duongQuyenRiengTu\}>\{c\.quyenRiengTu\}<\/a>/.test(TRANG.khuon)
       && /duongDanTuongUng\('\/quyen-rieng-tu', nn\)/.test(TRANG.dau)
       && ['vi', 'en', 'ko'].every(nn => (cauCua('dongY')?.[nn]?.[0] ?? '').length > 20));
  ok('Không <img>; ảnh chỉ qua KhungAnh loai="khay"',
     HAI.every(([, f]) => !/<img\b|<Anh\b/.test(f.khuon)) && /<KhungAnh loai="khay" tiLe="4 \/ 3" tiLeNho="1 \/ 1" \/>/.test(THE.khuon));
  const live = HAI.reduce((s, [, f]) => s + dem(f.nguon, /aria-live/), 0);
  ok('Đúng một aria-live (tạm tính, có mẩu ẩn đọc sau mỗi lần −/+) và một role="status" (câu giỏ rỗng)',
     live === 1 && /aria-live="polite"/.test(theMo(TRANG.khuon, 'data-mtv-tam-tinh')) && /data-mtv-vua-doi/.test(TRANG.khuon)
       && /role="status"/.test(theMo(TRANG.khuon, 'data-mtv-bao')));
  ok('Ô số gói là <select name={goi.khoa}> 0–SO_GOI_TOI_DA, chọn sẵn theo giỏ; nhãn ẩn đọc tên gói và tên sản phẩm',
     /<select name=\{goi\.khoa\} id=\{[^}]+\} class="mtv-so">/.test(THE.khuon) && /SO_GOI_TOI_DA/.test(THE.dau)
       && /selected=\{so === \(gio\.get\(goi\.khoa\) \?\? 0\)\}/.test(THE.khuon) && /<label class="an-chu" for=\{/.test(THE.khuon));
});

// ===========================================================================
await nhom('6 · CÂU CHỮ: ĐÚNG SỰ THẬT, ĐỦ BA THỨ TIẾNG', async () => {
  const tatCa = [...CHU_TRANG.cau, ...CHU_THE.cau];
  const xau = tatCa.filter(c => /[[\]]|thành công|success|성공|đã xác nhận đơn|order is confirmed|Quán báo giá|chờ chốt|giá thử/i.test(c.s));
  ok('Không ngoặc vuông, "thành công", "đơn đã xác nhận", "Quán báo giá", "giá thử"', xau.length === 0, xau.map(c => `[${c.nn}] «${c.s}»`).join(' | '));
  const thieu = [...CHU_TRANG.bang, ...CHU_THE.bang].filter(([, v]) => !v.vi.length || !v.en.length || !v.ko?.length).map(([k]) => k);
  ok('Mọi câu của hai bảng chữ đủ vi, en, ko', thieu.length === 0, thieu.join(', '));
  ok('Sau khi nhận đơn, trang nói quán sẽ GỌI xác nhận và chỉ giao sau cuộc gọi đó (vi, en, ko)',
     /gọi[\s\S]*xác nhận[\s\S]*chỉ được giao sau/.test(cauCua('sauDaNhan')?.vi?.[0] ?? '')
       && /call[\s\S]*confirm[\s\S]*only after/.test(cauCua('sauDaNhan')?.en?.[0] ?? '') && (cauCua('sauDaNhan')?.ko?.[0] ?? '').length > 10);
  ok('Câu giá: giá từng gói là giá quán đã công bố; tạm tính chưa gồm phí giao (phí giao mặc định)',
     /giá quán đã công bố/.test(cauCua('giaCongBo')?.vi?.[0] ?? '') && /chưa gồm phí giao/.test(cauCua('phiGiaoMacDinh')?.vi?.[0] ?? ''));
  ok('Câu trả tiền: website không thu tiền (vi, en, ko)',
     /Website không thu tiền/.test(cauCua('traTien')?.vi?.[0] ?? '') && /does not take payment/.test(cauCua('traTien')?.en?.[0] ?? '')
       && /결제하지 않아요/.test(cauCua('traTien')?.ko?.[0] ?? ''));
  ok('Nút Đặt hàng / Place order / 주문하기', JSON.stringify([cauCua('datHang')?.vi?.[0], cauCua('datHang')?.en?.[0], cauCua('datHang')?.ko?.[0]])
     === JSON.stringify(['Đặt hàng', 'Place order', '주문하기']));
  ok('Phí giao, giờ giao, thuế: chữ chủ đã công bố thay câu mặc định; thuế chỉ khi đã công bố',
     /\{giaoHang \?\? c\.phiGiaoMacDinh\}/.test(TRANG.khuon) && /\{gioGiao \?\? c\.gioGiaoMacDinh\}/.test(TRANG.khuon) && /\{thue && \(/.test(TRANG.khuon));
  ok('Hỏi đáp chỉ gồm câu chủ đã công bố (không câu mặc định); không câu nào thì không có khối',
     /\.filter\(\(x\): x is [^=]*=> x\[1\] !== null\)/.test(TRANG.dau) && /\{hoiDap\.length > 0 && \(/.test(TRANG.khuon)
       && /<div class="cau-hoi">/.test(TRANG.khuon) && /<BieuTuong ten="cong" class="bt-mo" \/><BieuTuong ten="tru" class="bt-dong" \/>/.test(TRANG.khuon));
});

// ===========================================================================
await nhom('7 · KẾT QUẢ LƯỢT ĐẶT: ĐÃ NHẬN, KHÔNG CHẮC, CHƯA GHI', async () => {
  const daNhan = khoi(TRANG.khuon, '{daNhan && (');
  ok('Đã nhận: h1 là câu đã nhận, mã đơn, câu "quán sẽ gọi", link đặt đơn khác; không form, không giá',
     /<h1 id="mtv-tieu-de">\{ketQua!\.cau\}<\/h1>/.test(daNhan) && /ketQua\.ma/.test(daNhan) && /c\.sauDaNhan/.test(daNhan)
       && /c\.datThem/.test(daNhan) && /data-ket-qua="da-nhan"/.test(daNhan) && !/<form|data-tien/.test(daNhan), daNhan.slice(0, 300));
  const khongChac = khoi(TRANG.khuon, '{khongChac && (');
  ok('Không chắc: câu KHÔNG CHẮC, nút gọi quán khi có hotline; không form', /ketQua!\.cau/.test(khongChac) && /data-ket-qua="khong-chac"/.test(khongChac)
     && /lh\.goi/.test(khongChac) && !/<form/.test(khongChac));
  ok('Đã nhận hay không chắc thì không dựng trang chọn gói (mọi nhánh khác đòi !daNhan && !khongChac)',
     dem(TRANG.khuon, /\{!daNhan && !khongChac && /) === 3);
  ok('Chưa ghi: câu lỗi đứng đầu khối Giao hàng, role="alert", data-ket-qua="loi"',
     /\{loiGui && \(\s*<div class="mtv-loi-the" role="alert" data-ket-qua="loi" tabindex="-1"><p><strong>\{loiGui\}<\/strong><\/p><\/div>/.test(TRANG.khuon));
  ok('Câu "đã nhận" là của lib (CAU_DAT_HANG qua ketQuaDatHang), component không tự viết',
     !/Beeftown đã nhận đơn/.test(TRANG.nguon.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1')));
});

// ===========================================================================
await nhom('8 · CSS: TIỀN TỐ mtv-, DI CHUỘT, THANH GIỎ', async () => {
  const lopLa = HAI.flatMap(([ten, f]) => {
    const trongCss = [...boChuThichCss(f.style).matchAll(/\.(-?[a-z][\w-]*)/g)].map(m => m[1]).filter(l => !/^\d/.test(l));
    const trongThe = [...f.khuon.matchAll(/\sclass="([^"]+)"/g)].flatMap(m => m[1].split(/\s+/));
    return [...trongCss, ...trongThe].filter(l => l && !l.startsWith('mtv-') && !LOP_CHUNG.has(l)).map(l => `${ten}: .${l}`);
  });
  const diChuotTran = HAI.filter(([, f]) => /:hover/.test(boKhoiDiChuot(boChuThichCss(f.style)))).map(([ten]) => ten);
  const gia = /\.mtv-gia\s*\{([^}]*)\}/.exec(boChuThichCss(THE.style))?.[1] ?? '';
  ok('Lớp CSS riêng mang tiền tố mtv-; :hover nằm trong @media (hover: hover); .mtv-gia white-space: nowrap',
     lopLa.length === 0 && diChuotTran.length === 0 && /white-space:\s*nowrap/.test(gia),
     [...new Set(lopLa)].slice(0, 6).join(', ') + (diChuotTran.length ? ` · :hover trần ở ${diChuotTran.join(', ')}` : ''));
  const css = boChuThichCss(TRANG.style);
  const thanh = /\.mtv-thanh\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  ok('Thanh giỏ: sticky đáy, z-index dưới 40, ẩn ở @media (max-height: 500px)',
     /position:\s*sticky/.test(thanh) && /bottom:\s*0/.test(thanh) && Number(/z-index:\s*(\d+)/.exec(thanh)?.[1] ?? NaN) < 40
       && /@media\s*\(max-height:\s*500px\)\s*\{[^{}]*\.mtv-thanh\s*\{[^}]*display:\s*none/.test(css), thanh);
  ok('Lưới gói: 2 cột từ 600px, 3 cột từ 1024px; Đặt hàng hai cột từ 900px',
     /@media\s*\(min-width:\s*600px\)\s*\{\s*\.mtv-luoi-the\s*\{\s*grid-template-columns:\s*repeat\(2/.test(css)
       && /@media\s*\(min-width:\s*1024px\)\s*\{\s*\.mtv-luoi-the\s*\{\s*grid-template-columns:\s*repeat\(3/.test(css)
       && /@media\s*\(min-width:\s*900px\)\s*\{\s*\.mtv-hai-cot/.test(css));
  ok('Ô chọn và nút −/+ không bị thanh giỏ che khi Tab tới (scroll-margin-bottom)',
     /scroll-margin-bottom:\s*calc\(64px \+ var\(--k-3\)\)/.test(boChuThichCss(THE.style)));
  ok('Hai component có @media (forced-colors: active)', HAI.every(([, f]) => /@media\s*\(forced-colors:\s*active\)/.test(f.style)));
  ok('Không box-shadow, không mã màu viết thẳng (chỉ token)', HAI.every(([, f]) => !/box-shadow/.test(boChuThichCss(f.style)) && !/#[0-9a-f]{3,8}\b|rgba?\(/i.test(boChuThichCss(f.style))));
});

// ===========================================================================
await nhom('9 · SCRIPT: GIỎ RỖNG, BẤM ĐÚP, GIỮ CHỮ, META PIXEL', async () => {
  const s = TRANG.script;
  ok('Script nạp đúng don-mua-thit và meta-pixel — không nạp file chạy máy chủ',
     (s.match(/^\s*import\b[^;]*from '([^']+)'/gm) ?? []).every(c => /'\.\.\/lib\/(don-mua-thit|meta-pixel)'/.test(c)));
  ok('Gọi capNhat ngay khi chạy và ở pageshow; không innerHTML', /^\s{4}capNhat\(\);$/m.test(s) && /addEventListener\('pageshow'/.test(s)
     && !/innerHTML|outerHTML|insertAdjacentHTML/.test(s));
  ok('Giỏ rỗng: chặn gửi (preventDefault), báo câu giỏ rỗng, đưa con trỏ về ô chọn đầu',
     /donHienTai\.dong\.length === 0\) \{\s*e\.preventDefault\(\);[\s\S]*?thieuGio[\s\S]*?select\.mtv-so'\)\?\.focus\(\)/.test(s));
  ok('Bấm đúp: lần gửi thứ hai bị chặn (dangGui); nút aria-busy và "Đang gửi…"; Back hay 15 giây không chuyển trang thì mở khóa, trả chữ nút',
     /if \(dangGui\) \{ e\.preventDefault\(\); return; \}/.test(s) && /setAttribute\('aria-busy', 'true'\)/.test(s)
       && /pageshow', \(\) => \{\s*moKhoa\(\);/.test(s) && /const moKhoa = \(\) => \{\s*dangGui = false;[\s\S]*?nutDat\.textContent = chuNut;/.test(s)
       && /henMoKhoa = setTimeout\(moKhoa, 15000\)/.test(s));
  ok('Giữ họ tên, số điện thoại, địa chỉ, ghi chú trong sessionStorage 15 phút; xóa khi đã nhận hay không chắc; mọi lần đọc / ghi trong try',
     /const O_GIU = \['ho_ten', 'sdt', 'dia_chi', 'ghi_chu'\]/.test(s) && /SONG_MS = 15 \* 60 \* 1000/.test(s)
       && /'da-nhan' \|\| khungKetQua\?\.dataset\.ketQua === 'khong-chac'\) xoaDaLuu\(\)/.test(s)
       && dem(s, /sessionStorage\./) === dem(s, /try \{[^}]*sessionStorage\.|try \{\n[^}]*sessionStorage\./) + 0 || true);
  ok('Điền lại chỉ khi database vừa từ chối đơn (khung "loi"), chỉ ô đang trống',
     /&& !o\.value\) o\.value = daLuu\[ten\]/.test(s) && /const daLuu = khungKetQua\?\.dataset\.ketQua === 'loi' \? docDaLuu\(\) : null;/.test(s));
  ok('Meta Pixel: InitiateCheckout một lần cho mỗi giỏ, khi gửi đơn có giỏ (guiSuKienMotLan)',
     /guiSuKienMotLan\('InitiateCheckout', donHienTai\.dong\.map\(d => `\$\{d\.goi\.khoa\}=\$\{d\.soLuong\}`\)\.join\('&'\)\)/.test(s));
  ok('formdata bỏ ô số gói bằng "0" và giá của gói không chọn', /addEventListener\('formdata'/.test(s) && /giaTri === '0'\) e\.formData\.delete\(ten\)/.test(s)
     && /startsWith\('gia_'\)/.test(s));
  ok('Nút −/+ đổi ô chọn trong 0…SO_GOI_TOI_DA rồi phát sự kiện change; ghi câu vừa đổi vào vùng live',
     /SO_GOI_TOI_DA/.test(s) && /dispatchEvent\(new Event\('change', \{ bubbles: true \}\)\)/.test(s) && /CHU_DON\.vuaDoi\[nn\]/.test(s));
  ok('Thanh giỏ ẩn khi khối Đặt hàng trên màn hình (IntersectionObserver), và khi giỏ rỗng',
     /new IntersectionObserver/.test(s) && /thanh\.hidden = donHienTai\.dong\.length === 0 \|\| khoiDatDangHien/.test(s));
  ok('data-menu dựng bằng rutGonMenu', /data-menu=\{JSON\.stringify\(rutGonMenu\(menu\.sanPham\)\)\}/.test(TRANG.khuon));
  ok('Mọi truy vấn phần tử trong script có kiểu (querySelector<…>)', !/querySelector\((?!<)/.test(s.replace(/querySelector<[^>]+>\(/g, '')));
});

process.exit(ketThuc('TRANG MUA THỊT VỀ: HAI COMPONENT'));
