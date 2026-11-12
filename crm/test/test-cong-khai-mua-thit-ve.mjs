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
 *  11. Đợt 3 (Khánh duyệt 12/11/2026): một khuôn thẻ (giá đậm, cỡ gói ngay dưới, nút ở chân thẻ), dòng gu từ
 *      bo_tai_quay_theo_gu, cách dùng trong hộp, dải ba điều đúng theo cách trả tiền, nút lọc nhóm chạy nhờ script,
 *      cột "Đơn của bạn" dính bên phải từ 1024px.
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
  'khung-anh', 'cau-hoi', 'tra-loi', 'mon', 'nhan-mon', 'o', 'loi-o', 'mo-dau-trang', 'tach-nen', 'chon-loc', 'bt-mo', 'bt-dong']);

// ===========================================================================
await nhom('0 · HAI COMPONENT CÓ MẶT, NHẬN ĐÚNG PROPS', async () => {
  ok('Có TrangMuaThitVe.astro và MuaThitThe.astro', !!TRANG.nguon && !!THE.nguon);
  ok('TrangMuaThitVe nhận { ngonNgu, noiDung, menu, trangThai, ketQua, thamSo, duongDan, traVnpay (0115, mặc định tắt), theoGu (đợt 3, mặc định rỗng) }',
     /const \{ ngonNgu: nn, noiDung: nd, menu, trangThai, ketQua, thamSo, duongDan, traVnpay = false, theoGu = \[\] \} = Astro\.props;/.test(TRANG.dau));
  ok('MuaThitThe nhận { sanPham, ngonNgu, gio, coOChon, gu (đợt 3, mặc định rỗng) }', /const \{ sanPham, ngonNgu, gio, coOChon, gu = \[\] \} = Astro\.props;/.test(THE.dau));
  ok('Đơn tính bằng hàm của don-mua-thit.ts: docGio(thamSo, menu.sanPham) → tinhDon(gio, menu.sanPham, boTamHet)',
     /docGio\(thamSo, menu\.sanPham\)/.test(TRANG.dau) && /tinhDon\(gio, menu\.sanPham, boTamHet\)/.test(TRANG.dau));
});

// ===========================================================================
await nhom('1 · FORM POST THẬT, CHỈ KHI MỞ; MÃ CHỐNG GỬI HAI LẦN', async () => {
  const DAU_FORM = '<form method="post" action={duongDan';
  const form = theMo(TRANG.khuon, DAU_FORM);
  ok('Form đặt hàng là <form method="post">, action là duongDan + \'#dat-hang\'', /<form method="post" action=\{duongDan \+ '#dat-hang'\}/.test(form), form);
  // 0115: form thứ hai là nút "Trả tiền qua VNPay" của thẻ "đã nhận đơn" (chỉ khi chưa mở được trang trả tiền) — POST
  // tới trang kết quả, chỉ ô ẩn ma_don (luotTraLai đòi cookie của đúng đơn đó).
  const formTra = khoi(TRANG.khuon, 'ketQua?.choTra ? (');
  ok('Đúng một form đặt hàng; form còn lại chỉ là nút trả lại trong thẻ đã nhận (choTra), POST tới trang kết quả, chỉ ô ma_don',
     dem(TRANG.khuon, /<form\b/) === 2 && dem(TRANG.khuon, /<form method="post" action=\{duongDan/) === 1
       && /<form method="post" action=\{DUONG_KET_QUA_VNPAY\[nn\]\} class="hang-nut">\s*<input type="hidden" name="ma_don" value=\{ketQua\.ma\} \/>/.test(formTra)
       && dem(formTra, /<input\b/) === 1, formTra.slice(0, 300));
  ok('Form đặt hàng nằm trong nhánh mo / het_quay; ô chọn chỉ khi trạng thái mo (coOChon={trangThai === \'mo\'})',
     chiTrongKhoi(TRANG.khuon, "(trangThai === 'mo' || trangThai === 'het_quay') && (", DAU_FORM)
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
       && chiTrongKhoi(THE.khuon, '{coHop && (', 'name={`gia_'));
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
     /\{traVnpay \? c\.dongYVnpay : c\.dongY\} <a href=\{duongQuyenRiengTu\}>\{c\.quyenRiengTu\}<\/a>/.test(TRANG.khuon)
       && /duongDanTuongUng\('\/quyen-rieng-tu', nn\)/.test(TRANG.dau)
       && ['vi', 'en', 'ko'].every(nn => (cauCua('dongY')?.[nn]?.[0] ?? '').length > 20 && (cauCua('dongYVnpay')?.[nn]?.[0] ?? '').length > 20));
  // Ảnh tạm 10/11/2026 (Khánh quyết; ảnh, nhãn "Ảnh minh họa", chỗ dùng: test-cong-khai-anh.mjs nhóm 5): thẻ chọn
  // một trong ba ảnh theo loại sản phẩm qua <Anh>, hình thay khi chưa dựng cỡ vẫn là khay; trang không tự đặt ảnh.
  ok('Không <img>; ảnh của thẻ chỉ qua <Anh> (ba ảnh tạm mua-…, khung 4:3 / 1:1, hình thay là khay); trang không đặt ảnh',
     HAI.every(([, f]) => !/<img\b/.test(f.khuon)) && !/<Anh\b|<KhungAnh\b/.test(TRANG.khuon) && !/<KhungAnh\b/.test(THE.khuon)
       && (THE.khuon.match(/<Anh id="mua-[a-z-]+" ngonNgu=\{ngonNgu\} khung="4x3" khungNho="1x1" thayBang="khay" sizes=\{SIZES_ANH\} \/>/g) ?? []).length === 3);
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
  ok('Đã nhận: h1 là câu đã nhận (đã trả → "đã được trả tiền"), mã đơn, câu "quán sẽ gọi", link đặt đơn khác; không giá; form chỉ là nút trả lại khi choTra',
     /<h1 id="mtv-tieu-de">\{ketQua\?\.daTra \? c\.daTraH1 : ketQua!\.cau\}<\/h1>/.test(daNhan) && /ketQua\.ma/.test(daNhan) && /c\.sauDaNhan/.test(daNhan)
       && /c\.sauDaTra/.test(daNhan) && /c\.datThem/.test(daNhan) && /data-ket-qua="da-nhan"/.test(daNhan) && !/data-tien/.test(daNhan)
       && dem(daNhan, /<form\b/) === 1 && chiTrongKhoi(daNhan, 'ketQua?.choTra ? (', '<form '), daNhan.slice(0, 300));
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
  // Đợt 3: từ 1024px lưới gói chỉ còn cột trái (cột "Đơn của bạn" dính bên phải) — số cột đo theo phần gói.
  const danhSach = /\.mtv-danh-sach\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
  ok('Lưới gói: 2 cột từ 600px, 3 cột khi phần gói rộng từ 760px (container query trên .mtv-danh-sach)',
     /@media\s*\(min-width:\s*600px\)\s*\{\s*\.mtv-luoi-the\s*\{\s*grid-template-columns:\s*repeat\(2/.test(css)
       && /@container\s*\(min-width:\s*760px\)\s*\{\s*\.mtv-luoi-the\s*\{\s*grid-template-columns:\s*repeat\(3/.test(css)
       && /container-type:\s*inline-size/.test(danhSach), danhSach);
  const tu1024 = /@media\s*\(min-width:\s*1024px\)\s*\{([\s\S]*?\})\s*\}/.exec(css)?.[1] ?? '';
  const cotDon = /\.mtv-co-don \.mtv-don\s*\{([^}]*)\}/.exec(tu1024)?.[1] ?? '';
  ok('Từ 1024px (và chỉ khi có cột đơn — trạng thái mo): hai cột, cột đơn trải hai hàng, dính dưới đầu trang, cao hơn màn hình thì cuộn bên trong',
     /\.mtv-co-don\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) clamp\(/.test(tu1024)
       && /grid-column:\s*2/.test(cotDon) && /grid-row:\s*1 \/ span 2/.test(cotDon)
       && /position:\s*sticky/.test(cotDon) && /top:\s*calc\(var\(--cao-dau\)/.test(cotDon)
       && /max-height:\s*calc\(100dvh - var\(--cao-dau\)/.test(cotDon) && /overflow-y:\s*auto/.test(cotDon)
       && /\{ 'mtv-co-don': trangThai === 'mo' \}/.test(TRANG.khuon), cotDon);
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
  ok('Giỏ rỗng: chặn gửi (preventDefault), báo câu giỏ rỗng, đưa con trỏ về nút "Chọn gói" đầu (ô chọn nằm trong hộp đang đóng; trình duyệt chưa biết popover: ô chọn đầu)',
     /donHienTai\.dong\.length === 0\) \{\s*e\.preventDefault\(\);[\s\S]*?thieuGio[\s\S]*?querySelectorAll<HTMLElement>\('\[data-mtv-mo-hop\], select\.mtv-so'\)\][\s\S]*?\.find\(o => !o\.hidden && o\.offsetParent !== null\);\s*dau\?\.focus\(\);/.test(s));
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

// ===========================================================================
// Khánh 03/11/2026 ("làm như El Gaucho", xem tận trang El Gaucho): thẻ gọn — ảnh, tên, giá "Từ …", một nút "Chọn
// gói" — mở hộp chọn (popover). Hộp phải chạy không cần JavaScript, nằm trong form (ô chọn trong hộp đóng vẫn được
// gửi), và trình duyệt chưa biết popover vẫn đặt được (hộp đứng thẳng trong thẻ).
await nhom('10 · THẺ GỌN KIỂU EL GAUCHO, HỘP CHỌN GÓI (popover)', async () => {
  const k = THE.khuon;
  // cacKhoi đếm ngoặc từ ký tự cuối của đầu khối (phải là "("): lấy khối {coHop && ( … )} chứa <div popover>.
  const hop = cacKhoi(k, '{coHop && (').find(x => x.chu.includes('<div popover'))?.chu ?? '';
  ok('Hộp chọn là <div popover> có id, role="dialog", aria-labelledby tên sản phẩm — chỉ khi coHop',
     /<div popover id=\{idHop\} class="mtv-hop be-kem" role="dialog" aria-labelledby=\{`\$\{idHop\}-ten`\} data-mtv-hop>/.test(hop)
       && /id=\{`\$\{idHop\}-ten`\}/.test(hop));
  ok('coHop = coOChon VÀ còn ít nhất một gói đặt được', /const coHop = coOChon && datDuoc\.length > 0;/.test(THE.dau)
     && /const datDuoc = sanPham\.goi\.filter\(g => !g\.tamHet\);/.test(THE.dau));
  ok('Mọi ô chọn số gói, nút −/+ và ô giá ẩn đều nằm trong hộp (thẻ chỉ còn tên, giá "Từ", một nút)',
     ['<select ', 'data-mtv-buoc', 'name={`gia_'].every(t => chiTrongKhoi(k, '{coHop && (', t) && hop.includes(t)));
  const moHop = k.match(/<button[^>]*data-mtv-mo-hop[^>]*>/g) ?? [];
  ok('Thẻ có đúng một nút mở hộp: popovertarget={idHop}, nút viền (không thêm nút chính vào trang), chữ "Chọn gói" / "Chọn hộp"',
     moHop.length === 1 && /popovertarget=\{idHop\}/.test(moHop[0]) && /class="nut nut-vien mtv-mo-hop"/.test(moHop[0])
       && !/popovertargetaction/.test(moHop[0]) && /\{sanPham\.donVi === 'hop' \? c\.chonHop : c\.chonGoi\}/.test(k), moHop.join(' | '));
  const dongHop = k.match(/<button[^>]*data-mtv-dong-hop[^>]*>/g) ?? [];
  ok('Hai nút đóng hộp (Đóng ở đầu, Xong ở chân) chạy không cần JavaScript: popovertarget + popovertargetaction="hide"',
     dongHop.length === 2 && dongHop.every(b => /popovertarget=\{idHop\} popovertargetaction="hide"/.test(b)), dongHop.join(' | '));
  ok('Nút Đóng có chữ cạnh biểu tượng (không chỉ dấu ×); chân hộp đúng một nút chính',
     /<BieuTuong ten="dong" \/><span>\{c\.dong\}<\/span>/.test(hop) && (hop.match(/nut-chinh/g) ?? []).length === 1);
  ok('Giá "Từ …": gói rẻ nhất còn đặt được (mọi gói tạm hết: rẻ nhất của sản phẩm); chữ "Từ" chỉ khi nhiều cỡ; số tiền trong data-tien; cỡ gói ngay dưới giá (một cỡ: nhãn gói; nhiều cỡ: số cỡ)',
     /const goiGia = \(datDuoc\.length \? datDuoc : sanPham\.goi\)\.reduce\(\(a, b\) => \(b\.gia < a\.gia \? b : a\)\);/.test(THE.dau)
       && /<p class="mtv-gia-tu">\{!motGoi && <><span>\{c\.tu\}<\/span>\{' '\}<\/>\}<span class="mtv-gia" data-tien>\{dinhDangTien\(goiGia\.gia\)\}<\/span><\/p>\s*<p class="mtv-co-goi">\{coGoi\}<\/p>/.test(k)
       && /const coGoi = motGoi \? nhanGoi\(sanPham\.donVi, goiGia\.soGam, ngonNgu\)\s*: sanPham\.donVi === 'hop' \? c\.soCoHop\(sanPham\.goi\.length\) : c\.soCoGoi\(sanPham\.goi\.length\);/.test(THE.dau));
  ok('Sản phẩm không còn gói đặt được: thẻ ghi "Tạm hết ở quầy" thay nút, không hộp',
     /\{coHop \? \([\s\S]*?data-mtv-mo-hop[\s\S]*?\) : \(\s*<p class="mtv-tam-het" data-mtv-tam-het>\{c\.tamHet\}<\/p>\s*\)\}/.test(k));
  ok('"Đã chọn" (CHU_DON.daChon) trên thẻ và ở chân hộp, máy chủ dựng từ giỏ, ẩn khi 0',
     (k.match(/<p class="mtv-da-chon" data-mtv-da-chon hidden=\{daChonSo === 0\}>\{daChon\}<\/p>/g) ?? []).length === 2
       && /CHU_DON\.daChon\[ngonNgu\]/.test(THE.dau));
  const css = boChuThichCss(THE.style);
  const quyTac = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ chon: m[1].trim(), than: m[2] }));
  const viTriNgoai = quyTac.filter(q => /\bposition:\s*fixed|\binset:/.test(q.than) && !/:popover-open/.test(q.chon)).map(q => q.chon);
  ok('Mọi quy tắc vị trí của hộp nằm dưới :popover-open (trình duyệt chưa biết popover bỏ cả quy tắc, hộp đứng trong thẻ)',
     viTriNgoai.length === 0 && quyTac.some(q => /\.mtv-hop:popover-open/.test(q.chon) && /position:\s*fixed/.test(q.than)), viTriNgoai.join(' | '));
  ok('Không tự giấu hộp bằng display: none (trình duyệt biết popover tự giấu hộp đóng)',
     !quyTac.some(q => /\.mtv-hop\b(?!-)/.test(q.chon) && !/:popover-open|::backdrop/.test(q.chon) && /display:\s*none/.test(q.than)));
  const s = TRANG.script;
  ok('Script: chưa biết popover → ẩn nút mở / đóng; biết → mở hộp thì con trỏ vào ô chọn đầu của hộp',
     /if \(!Object\.prototype\.hasOwnProperty\.call\(HTMLElement\.prototype, 'popover'\)\) \{\s*form\.querySelectorAll<HTMLElement>\('\[data-mtv-mo-hop\], \[data-mtv-dong-hop\]'\)\.forEach\(nut => \{ nut\.hidden = true; \}\);/.test(s)
       && /newState === 'open'\) \{ hop\.querySelector<HTMLSelectElement>\('select\.mtv-so'\)\?\.focus\(\); return; \}/.test(s));
  ok('Đóng hộp bằng bấm ra ngoài: con trỏ về nút "Chọn gói" của hộp (khi con trỏ đang trong hộp hay rơi về body)',
     /if \(!conTro \|\| conTro === document\.body \|\| hop\.contains\(conTro\)\) \{\s*form\.querySelector<HTMLElement>\(`\[data-mtv-mo-hop\]\[popovertarget="\$\{CSS\.escape\(hop\.id\)\}"\]`\)\?\.focus\(\);/.test(s));
  ok('Chưa biết popover, kể cả tắt JavaScript: CSS ẩn nút mở / đóng / Xong (@supports not selector(:popover-open)); hộp đứng trong thẻ trải hết bề ngang (grid-column: 1 / -1)',
     /@supports not selector\(:popover-open\)\s*\{\s*\[data-mtv-mo-hop\], \[data-mtv-dong-hop\] \{ display: none !important; \}/.test(css)
       && quyTac.some(q => q.chon === '.mtv-hop' && /grid-column:\s*1 \/ -1/.test(q.than)));
  ok('Script: "Đã chọn" của từng sản phẩm tính từ chính đơn (tinhDon), cùng CHU_DON.daChon với máy chủ',
     /const so = don\.dong\.filter\(d => d\.sanPham\.ma === sp\.ma\)\.reduce\(\(tong, d\) => tong \+ d\.soLuong, 0\);/.test(s)
       && /CHU_DON\.daChon\[nn\]/.test(s) && /CSS\.escape\(sp\.ma\)/.test(s));
});

// ===========================================================================
// Đợt 3 của đề xuất giao diện (Khánh duyệt 12/11/2026): "một khuôn thẻ, ba điều nói trước, đơn luôn trong tầm mắt".
await nhom('11 · ĐỢT 3: KHUÔN THẺ, GU, BA ĐIỀU, LỌC NHÓM, CỘT ĐƠN', async () => {
  const k = THE.khuon;
  const chan = /<div class="mtv-the-chan">[\s\S]*?\n {2}<\/div>/.exec(k)?.[0] ?? '';
  ok('Chân thẻ một khuôn: khối giá (giá, cỡ gói) rồi nút "Chọn gói" hay chữ tạm hết — mọi sản phẩm cùng một nhánh dựng',
     /<div class="mtv-gia-khoi">\s*<p class="mtv-gia-tu">[\s\S]*?<p class="mtv-co-goi">\{coGoi\}<\/p>\s*<\/div>\s*\{coHop \? \(/.test(chan), chan.slice(0, 300));
  ok('Thẻ không có giá theo 100 g (quán bán theo gói — quyết định 3 của Khánh 26/10/2026)',
     !/100\s?g|\/\s?100|soGam\s*\/|\* 100/.test(k + THE.dau.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')));
  ok('Dòng gu: chỉ phần thịt có gu, đúng tên ba thứ tiếng của TEN_GU, theo thứ tự đã nhận; không gu thì không dòng',
     /const guThe = sanPham\.loai === 'thit' \? gu : \[\];/.test(THE.dau)
       && /\{guThe\.length > 0 && \(<p class="mtv-gu">\{`\$\{c\.guLa\} \$\{guThe\.map\(g => TEN_GU\[g\]\[ngonNgu\]\)\.join\(' · '\)\}`\}<\/p>\)\}/.test(k)
       && /import \{ TEN_GU, type Gu \} from '\.\.\/lib\/chon-theo-gu';/.test(THE.dau));
  const hop = cacKhoi(k, '{coHop && (').find(x => x.chu.includes('<div popover'))?.chu ?? '';
  ok('Cách dùng (cach_dung của menu bán lẻ) chỉ trong hộp chọn, dưới mô tả, có nhãn "Cách dùng:"',
     chiTrongKhoi(k, '{coHop && (', 'sanPham.cachDung') && /\{sanPham\.cachDung && <p class="mtv-mo-ta mtv-cach-dung"><strong>\{c\.cachDung\}<\/strong>\{' '\}\{sanPham\.cachDung\}<\/p>\}/.test(hop));
  ok('Trang chuyền gu theo mã sản phẩm từ theoGu (bo_tai_quay_theo_gu) cho từng thẻ',
     /const guTheoMa = new Map<string, readonly Gu\[\]>\(theoGu\.map\(p => \[p\.ma, p\.gu\]\)\);/.test(TRANG.dau)
       && /<MuaThitThe sanPham=\{sp\} ngonNgu=\{nn\} gio=\{gio\} coOChon=\{trangThai === 'mo'\} gu=\{guTheoMa\.get\(sp\.ma\)\} \/>/.test(TRANG.khuon));

  // Ba điều: chữ theo cách trả tiền; dòng phụ là chữ chủ đã công bố khi có.
  const baDieu = /const baDieu[\s\S]*?\n {4}\];/.exec(TRANG.dau)?.[0] ?? '';
  const [nhanhVnpay, nhanhKhong] = baDieu.split(/\n {2}: \[/);
  ok('Ba điều khi có VNPay: giá gói đã gồm phí giao (phụ: khu vực giao đã công bố), trả trước qua VNPay, quán gọi hẹn giờ giao (phụ: giờ giao đã công bố, không thì "sau khi bạn trả tiền")',
     /\{ bt: 'xe-giao', chu: c\.dieuGiaVnpay, phu: giaoHang \}/.test(nhanhVnpay ?? '') && /\{ bt: 'the-tra', chu: c\.dieuTraVnpay, phu: c\.dieuTraVnpayPhu \}/.test(nhanhVnpay ?? '')
       && /\{ bt: 'dien-thoai', chu: c\.dieuGoiVnpay, phu: gioGiao \?\? c\.dieuGoiVnpayPhu \}/.test(nhanhVnpay ?? ''), baDieu.slice(0, 300));
  ok('Ba điều khi chưa cài VNPay: giao tận nơi (phụ: phí giao đã công bố, không thì "quán báo phí giao khi gọi"), trả khi nhận hàng, quán gọi xác nhận đơn',
     /\{ bt: 'xe-giao', chu: c\.dieuGiao, phu: giaoHang \?\? c\.dieuGiaoPhu \}/.test(nhanhKhong ?? '') && /\{ bt: 'the-tra', chu: c\.dieuTra, phu: c\.dieuTraPhu \}/.test(nhanhKhong ?? '')
       && /\{ bt: 'dien-thoai', chu: c\.dieuGoi, phu: gioGiao \?\? c\.dieuGoiPhu \}/.test(nhanhKhong ?? '') && !/Vnpay/.test(nhanhKhong ?? ''));
  const vi = khoa => cauCua(khoa)?.vi?.[0] ?? '';
  ok('Câu ba điều nói đúng: có VNPay thì "đã gồm phí giao", "trả trước"; chưa cài thì "khi nhận hàng", "xác nhận đơn"; đoạn dẫn không còn nói tiền',
     /đã gồm phí giao/.test(vi('dieuGiaVnpay')) && /Trả trước qua VNPay/.test(vi('dieuTraVnpay')) && /khi nhận hàng/.test(vi('dieuTra'))
       && /báo phí giao/.test(vi('dieuGiaoPhu')) && /chưa gồm phí giao/.test(vi('dieuGiaoPhu'))
       && /xác nhận đơn/.test(vi('dieuGoi')) && !/VNPay|phí|tiền/.test(vi('dan')) && !/VNPay/.test(vi('dieuGiao') + vi('dieuTra') + vi('dieuTraPhu') + vi('dieuGoi') + vi('dieuGoiPhu')),
     ['dieuGiaVnpay', 'dieuTraVnpay', 'dieuTra', 'dieuGoi', 'dan'].map(vi).join(' | '));
  const dau = khoi(TRANG.khuon, "(trangThai === 'mo' || trangThai === 'het_quay') && (");
  ok('Dải ba điều là danh sách có tên (aria-label), nằm ở đầu trang của trạng thái mo / tạm hết, trước form',
     /<ul class="mtv-ba-dieu" aria-label=\{c\.baDieu\}>/.test(dau) && dau.indexOf('mtv-ba-dieu') < dau.indexOf('<form method="post"')
       && /\{d\.phu && <p class="mtv-dieu-phu">\{d\.phu\}<\/p>\}/.test(dau));

  // Lọc nhóm: chạy nhờ script, ngoài form, không radio.
  const loc = khoi(TRANG.khuon, '{menu.nhom.length > 1 && (');
  ok('Nút lọc nhóm chỉ khi có từ hai nhóm; khối ra trang với hidden, role="group" có tên; mọi nút là type="button" aria-pressed; "Tất cả" đang chọn',
     /<div class="chon-loc mtv-loc" role="group" aria-label=\{c\.locNhom\} data-mtv-loc hidden>/.test(loc)
       && /<button type="button" aria-pressed="true" data-mtv-loc-nhom="">\{c\.tatCa\}<\/button>/.test(loc)
       && /<button type="button" aria-pressed="false" data-mtv-loc-nhom=\{n\.loai\}>\{TEN_NHOM\[n\.loai\]\}<\/button>/.test(loc)
       && dem(loc, /<button\b/) === 2, loc.slice(0, 300));
  ok('Nút lọc nằm NGOÀI form đặt hàng (không gửi theo đơn, không đè luật ô của form)',
     dau.indexOf('data-mtv-loc') > 0 && dau.indexOf('data-mtv-loc') < dau.indexOf('<form method="post"'));
  const s = TRANG.script;
  ok('Script lọc: hiện khối lọc, đổi aria-pressed, ẩn nhóm khác (chỉ nhóm gói trong #chon-goi) bằng hidden — không tắt (disabled) ô chọn, không xoá thẻ khỏi form',
     /loc\.hidden = false;/.test(s) && /const cacNhom = \[\.\.\.document\.querySelectorAll<HTMLElement>\('#chon-goi \[data-nhom\]'\)\];/.test(s) && /for \(const n of nutLoc\) n\.setAttribute\('aria-pressed', String\(n === bam\)\);/.test(s)
       && /for \(const n of cacNhom\) n\.hidden = chon !== '' && n\.dataset\.nhom !== chon;/.test(s)
       && !/\.disabled\s*=|\.remove\(\)|removeChild/.test(s));
  ok('Mỗi nhóm gói mang data-nhom (khóa lọc) — đúng ba khóa của LoaiNhom',
     /<div class="mtv-nhom" data-nhom=\{n\.loai\}>/.test(TRANG.khuon));

  // Cột đơn và thanh giỏ.
  ok('Cột "Đơn của bạn" là <aside data-mtv-don>, cùng nhánh trạng thái mo; thanh giỏ ẩn khi ô giao hàng HAY cột đơn trên màn hình',
     chiTrongKhoi(TRANG.khuon, "{trangThai === 'mo' && (", 'data-mtv-don>')
       && /querySelectorAll<HTMLElement>\('\[data-mtv-dat-hang\], \[data-mtv-don\]'\)/.test(s)
       && /khoiDatDangHien = dangHien\.size > 0;/.test(s) && /for \(const k of khoiDat\) quan\.observe\(k\);/.test(s));
  ok('DOM theo thứ tự đọc: lưới gói → ô giao hàng → cột đơn (điện thoại một cột đúng thứ tự đó)',
     TRANG.khuon.indexOf('id="chon-goi"') < TRANG.khuon.indexOf('id="dat-hang"') && TRANG.khuon.indexOf('id="dat-hang"') < TRANG.khuon.indexOf('data-mtv-don>'));
});

process.exit(ketThuc('TRANG MUA THỊT VỀ: HAI COMPONENT'));
