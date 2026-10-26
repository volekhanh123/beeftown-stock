/**
 * BEEFTOWN — BỘ QUÉT CHỮ CẤM MIỄN GIÁ ĐÃ CHỐT, CHỈ TRÊN TRANG MUA THỊT VỀ (web/kiem-tra/chu-hien-ra.mjs)
 * ===================================================================================================
 *
 *     node test/test-cong-khai-quet-gia.mjs
 *
 * Luật chữ cấm (web/src/lib/chuoi-cam.js) chặn MỌI số tiền trên trang công khai: chưa món nào của thực đơn có giá
 * duyệt. Trang Mua thịt về (PR 2, migration 0101) là trang đầu tiên in giá — giá gói chủ đã chốt ở /noi-bo/ban-le.
 * Luật đó KHÔNG đổi (sửa nó thì một giá lọt vào mô tả món, vào ô chữ công bố, cũng qua). Bộ quét chỉ miễn một chỗ
 * hẹp nhất: số tiền đúng dạng "400.000 đ" nằm trong phần tử có data-tien (span: chỉ số tiền; textarea tin đơn: bỏ số
 * tiền, phần chữ còn lại vẫn quét), và chỉ trên ba đường dẫn của trang Mua thịt về. Không miễn thì lượt quét đêm
 * (.github/workflows/kiem-thu.yml, job quet-trang-that) đỏ mãi từ ngày bật trang.
 *
 * quet-chuoi-cam.mjs tự chạy main() khi nạp, nên phần đọc HTML nằm riêng ở chu-hien-ra.mjs — file này nạp được.
 * Bất biến:
 *   1. Ba đường dẫn Mua thịt về: số tiền đúng dạng trong span data-tien không bị báo; mọi thứ khác vẫn bị báo —
 *      số tiền ngoài data-tien, data-tien bọc chữ, dạng tiền khác, phần tử khác span / textarea, trang khác.
 *   2. Textarea data-tien (tin đơn): bỏ số tiền, chữ còn lại vẫn quét.
 *   3. chuHienRa vẫn đọc title, meta content, JSON-LD và bỏ script, style, chú thích như trước.
 *   4. Ba đường dẫn miễn khớp đúng dòng /mua-thit-ve của CAP_DUONG_DAN (web/src/lib/chu.ts).
 *   5. quet-chuoi-cam.mjs, trinh-duyet.mjs, thu-day-du.mjs dùng đúng hàm này và có đủ trang của CAP_DUONG_DAN.
 *   6. Supabase giả (web/kiem-tra/gia-supabase.mjs): menu thử đúng hợp đồng 11 cột của mua_thit_ve_cong_khai,
 *      qua lớp chặn thứ hai của trang nguyên vẹn, và mỗi kịch bản mua-thit-* dẫn tới đúng trạng thái trang mà
 *      thu-day-du.mjs nhóm 12 mong — đọc bằng supabase-js thật và docMuaThitVe thật, không cần trình duyệt.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const napWeb = duong => import(pathToFileURL(join(WEB, ...duong.split('/'))).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — BỘ QUÉT CHỮ CẤM: MIỄN GIÁ ĐÃ CHỐT TRÊN TRANG MUA THỊT VỀ');

const { timChuoiCam } = await napWeb('src/lib/chuoi-cam.js');
const { CAP_DUONG_DAN } = await napWeb('src/lib/chu.ts');

let chuHienRa = null, boTienDaChot = null, DUONG_DAN_HIEN_GIA = null;
await nhom('0 · NẠP web/kiem-tra/chu-hien-ra.mjs', async () => {
  const m = await napWeb('kiem-tra/chu-hien-ra.mjs');
  ({ chuHienRa, boTienDaChot, DUONG_DAN_HIEN_GIA } = m);
  ok('chu-hien-ra.mjs export chuHienRa, boTienDaChot, DUONG_DAN_HIEN_GIA',
     typeof chuHienRa === 'function' && typeof boTienDaChot === 'function' && Array.isArray(DUONG_DAN_HIEN_GIA));
});
if (!chuHienRa) process.exit(ketThuc('BỘ QUÉT MIỄN GIÁ'));

/** Đúng phép quét của quet-chuoi-cam.mjs: chữ khách đọc, sau khi bỏ số tiền đã chốt, qua bộ lọc chữ cấm. */
const quet = (html, duong) => timChuoiCam(chuHienRa(boTienDaChot(html, duong)));
const sach = (html, duong) => quet(html, duong).length === 0;
const tomTat = (html, duong) => JSON.stringify(quet(html, duong).map(t => t.tim_thay));
/** Một trang tối thiểu như bản build: head có tiêu đề, mô tả; thân là `than`. */
const trang = (than, { tieuDe = 'Mua thịt về — Beeftown', moTa = 'Thịt bò của quầy Beeftown chia gói để mang về.' } = {}) =>
  `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>${tieuDe}</title>`
  + `<meta name="description" content="${moTa}"></head><body><main>${than}</main></body></html>`;
const LY_DO_GIA = /Giá tiền/;
const coLyDoGia = (html, duong) => quet(html, duong).some(t => LY_DO_GIA.test(t.vi_sao));

const MUA = ['/mua-thit-ve', '/en/buy-meat', '/ko/buy-meat'];
const giaGoi = tien => `<div class="mtv-goi"><span class="mtv-nhan-goi">Gói khoảng 200 g</span><span class="mtv-gia" data-tien>${tien}</span></div>`;

// ===========================================================================
await nhom('1 · BA ĐƯỜNG DẪN MUA THỊT VỀ: CHỈ SỐ TIỀN ĐÚNG DẠNG TRONG data-tien ĐƯỢC MIỄN', async () => {
  for (const duong of MUA) {
    ok(`Trang Mua thịt về: "400.000 đ" trong <span data-tien> không bị báo (${duong})`,
       sach(trang(giaGoi('400.000 đ')), duong), tomTat(trang(giaGoi('400.000 đ')), duong));
    ok(`Trang Mua thịt về: "1.250.000 đ" (nhiều nhóm nghìn) trong data-tien không bị báo (${duong})`,
       sach(trang(`<p data-mtv-tam-tinh>Tạm tính: <span data-tien>1.250.000 đ</span></p>`), duong));
  }
  ok('Trang Mua thịt về có dấu / cuối ("/en/buy-meat/") vẫn là trang được miễn', sach(trang(giaGoi('400.000 đ')), '/en/buy-meat/'));
  ok('Trang Mua thịt về có chuỗi truy vấn ("/mua-thit-ve?ribeye-cap_200=2") vẫn là trang được miễn',
     sach(trang(giaGoi('800.000 đ')), '/mua-thit-ve?ribeye-cap_200=2'));
  ok('span data-tien có thêm thuộc tính khác (class, id, data-tien="") vẫn được miễn',
     sach(trang('<span id="g1" data-tien="" class="mtv-gia">90.000 đ</span><span class=\'a\' data-tien  >360.000 đ</span>'), '/mua-thit-ve'));
  ok('Khoảng trắng quanh số tiền trong data-tien (HTML không nén) vẫn được miễn',
     sach(trang('<span data-tien>\n  400.000 đ\n</span>'), '/mua-thit-ve'));

  ok('Trang Mua thịt về: "400.000 đ" ngoài data-tien vẫn bị báo (giá lọt vào mô tả, ô chữ công bố)',
     coLyDoGia(trang(`${giaGoi('400.000 đ')}<p class="mtv-mo-ta">Gói này 400.000 đ, mềm.</p>`), '/mua-thit-ve'));
  ok('Trang Mua thịt về: "400.000 đ" trong meta description vẫn bị báo',
     coLyDoGia(trang(giaGoi('400.000 đ'), { moTa: 'Ribeye chỉ 400.000 đ' }), '/mua-thit-ve'));
  ok('Trang Mua thịt về: "400.000 đ" trong tiêu đề trang vẫn bị báo',
     coLyDoGia(trang('', { tieuDe: 'Ribeye 400.000 đ — Beeftown' }), '/mua-thit-ve'));
  ok('Trang Mua thịt về: "400.000 đ" trong JSON-LD vẫn bị báo',
     coLyDoGia(trang('<script type="application/ld+json">{"description":"Ribeye 400.000 đ"}</script>'), '/mua-thit-ve'));

  for (const duong of ['/thuc-don', '/en/menu', '/', '/dat-ban', '/mua-thit-ve-cu', '/mua-thit-ve/them', '/en/buy-meat-2']) {
    ok(`Trang khác (${duong}): "400.000 đ" trong data-tien vẫn bị báo`, coLyDoGia(trang(giaGoi('400.000 đ')), duong));
  }

  ok('data-tien bọc chữ không phải số tiền ("rẻ hơn 30%") vẫn bị báo',
     quet(trang('<span data-tien>rẻ hơn 30%</span>'), '/mua-thit-ve').some(t => /lợi thế giá/.test(t.vi_sao)),
     tomTat(trang('<span data-tien>rẻ hơn 30%</span>'), '/mua-thit-ve'));
  ok('data-tien có chữ kèm số tiền ("Chỉ 400.000 đ") vẫn bị báo', coLyDoGia(trang('<span data-tien>Chỉ 400.000 đ</span>'), '/mua-thit-ve'));
  ok('data-tien bọc thẻ khác (<b>400.000 đ</b>) vẫn bị báo — chỉ miễn chữ trơn', coLyDoGia(trang('<span data-tien><b>400.000 đ</b></span>'), '/mua-thit-ve'));
  ok('Hai số tiền trong một data-tien ("400.000 đ 800.000 đ") vẫn bị báo', coLyDoGia(trang('<span data-tien>400.000 đ 800.000 đ</span>'), '/mua-thit-ve'));
  for (const [ten, the] of [
    ['thuộc tính data-tien-x', '<span data-tien-x>400.000 đ</span>'],
    ['thuộc tính data-tienx', '<span data-tienx>400.000 đ</span>'],
    ['chữ data-tien trong giá trị của thuộc tính khác', '<span class="data-tien">400.000 đ</span>'],
    ['chữ data-tien trong title', '<span title="x data-tien y">400.000 đ</span>'],
    ['thẻ <p data-tien>', '<p data-tien>400.000 đ</p>'],
    ['thẻ <div data-tien>', '<div data-tien>400.000 đ</div>'],
    ['thẻ <spanx data-tien>', '<spanx data-tien>400.000 đ</spanx>'],
  ]) {
    ok(`Không phải span / textarea có data-tien (${ten}) → vẫn bị báo`, coLyDoGia(trang(the), '/mua-thit-ve'));
  }

  for (const tien of ['400,000 ₫', '400.000đ', '400.000 VND', '400.000 ₫', '400.000 vnđ', '400.000 đồng', '400.000 원', '400.000 동', '1.250,000 đ', '4000.000 đ']) {
    ok(`Dạng "${tien}" trong data-tien vẫn bị báo — chỉ bỏ đúng dạng "400.000 đ"`,
       coLyDoGia(trang(`<span data-tien>${tien}</span>`), '/mua-thit-ve'), tomTat(trang(`<span data-tien>${tien}</span>`), '/mua-thit-ve'));
  }

  for (const [ten, tien] of [['U+00A0', '400.000 đ'], ['&nbsp;', '400.000&nbsp;đ'], ['&#160;', '400.000&#160;đ'], ['&#xA0;', '400.000&#xa0;đ']]) {
    ok(`Dấu cách không ngắt (${ten}) giữa số và "đ" trong data-tien cũng được bỏ`, sach(trang(`<span data-tien>${tien}</span>`), '/mua-thit-ve'),
       tomTat(trang(`<span data-tien>${tien}</span>`), '/mua-thit-ve'));
  }
});

// ===========================================================================
await nhom('2 · TEXTAREA data-tien (TIN ĐƠN): BỎ SỐ TIỀN, CHỮ CÒN LẠI VẪN QUÉT', async () => {
  const tin = dong => `<textarea id="mtv-tin" readonly rows="10" lang="vi" data-tien aria-describedby="mtv-chep-tay">${dong.join('\n')}</textarea>`;
  const TIN_THU = [
    'MUA THỊT VỀ – BEEFTOWN · beeftown.vn',
    'Soạn lúc 23:50 ngày 13/11/2026 (giờ Việt Nam)',
    '• Ribeye with Cap, gói khoảng 200 g: 2 × 400.000 đ = 800.000 đ',
    '• LA Galbi, gói khoảng 400 g (đông lạnh): 1 × 360.000 đ = 360.000 đ',
    '• Kim chi cải thảo, hộp 500 g: 1 × 90.000 đ = 90.000 đ',
    'Tạm tính theo giá trên web: 1.250.000 đ.',
    'Nhận: tại quầy Beeftown.',
    'Nhờ quán liên hệ lại xác nhận tổng tiền và giờ nhận giúp mình.',
  ];
  for (const duong of MUA) {
    ok(`Textarea data-tien: tin đơn mẫu (bảy số tiền, có "1.250.000 đ.") không bị báo (${duong})`, sach(trang(tin(TIN_THU)), duong),
       tomTat(trang(tin(TIN_THU)), duong));
  }
  ok('Textarea data-tien: số tiền dính dấu cách không ngắt (U+00A0, &nbsp;) cũng được bỏ',
     sach(trang(tin(['• A: 1 × 400.000 đ = 400.000&nbsp;đ'])), '/mua-thit-ve'));

  const coWagyu = tin([...TIN_THU.slice(0, 2), '• Wagyu, gói khoảng 200 g: 1 × 900.000 đ = 900.000 đ', ...TIN_THU.slice(5)]);
  const thay = quet(trang(coWagyu), '/mua-thit-ve');
  ok('Textarea data-tien: số tiền bị bỏ, chữ còn lại vẫn quét ("Wagyu" trong tin vẫn bị báo)',
     thay.some(t => /wagyu/i.test(t.tim_thay)) && !thay.some(t => LY_DO_GIA.test(t.vi_sao)), JSON.stringify(thay));
  ok('Textarea data-tien: dạng tiền khác ("400.000đ", "400,000 ₫") vẫn bị báo',
     coLyDoGia(trang(tin(['• A: 1 × 400.000đ'])), '/mua-thit-ve') && coLyDoGia(trang(tin(['• A: 1 × 400,000 ₫'])), '/mua-thit-ve'));
  ok('Textarea data-tien: số sai nhóm nghìn ("1400.000 đ") không bị cắt dở thành "400.000 đ" — vẫn bị báo',
     coLyDoGia(trang(tin(['Tạm tính: 1400.000 đ'])), '/mua-thit-ve'));
  ok('Textarea data-tien: "400.000 đồng" vẫn bị báo (sau "đ" còn chữ)', coLyDoGia(trang(tin(['Tạm tính: 400.000 đồng'])), '/mua-thit-ve'));
  ok('Textarea KHÔNG có data-tien: số tiền vẫn bị báo',
     coLyDoGia(trang(`<textarea readonly>${TIN_THU.join('\n')}</textarea>`), '/mua-thit-ve'));
  ok('Textarea data-tien trên trang khác (/thuc-don): số tiền vẫn bị báo', coLyDoGia(trang(tin(TIN_THU)), '/thuc-don'));
  ok('Số tiền ngay sau textarea (ngoài thẻ) vẫn bị báo',
     coLyDoGia(trang(`${tin(TIN_THU)}<p>Tổng 400.000 đ</p>`), '/mua-thit-ve'));
});

// ===========================================================================
await nhom('3 · chuHienRa ĐỌC NHƯ TRƯỚC: TITLE, META, JSON-LD; BỎ SCRIPT, STYLE, CHÚ THÍCH', async () => {
  ok('chuHienRa vẫn đọc title, meta content và JSON-LD như trước',
     /Wagyu/i.test(chuHienRa('<html><head><title>Bò Wagyu</title></head><body></body></html>'))
       && /Wagyu/i.test(chuHienRa('<html><head><meta property="og:description" content="Bò Wagyu"></head></html>'))
       && /Wagyu/i.test(chuHienRa('<script type="application/ld+json">{"name":"Bò Wagyu"}</script>')));
  const html = '<p>Thịt chuẩn</p><script>const x = "Wagyu"</script><style>.wagyu{}</style><!-- Wagyu -->';
  ok('chuHienRa bỏ script thường, style, chú thích HTML (có trong file nhưng không hiện thành chữ)', !/wagyu/i.test(chuHienRa(html)), chuHienRa(html));
  ok('chuHienRa giải mã &amp; &lt; &gt; &quot; &#39; &nbsp; — "rẻ&nbsp;hơn" vẫn bị bắt',
     chuHienRa('<p>A &amp; B &lt;C&gt; &quot;D&quot; &#39;E&#39;</p>').includes(`A & B <C> "D" 'E'`)
       && timChuoiCam(chuHienRa('<p>rẻ&nbsp;hơn 30%</p>')).length > 0);
  ok('chuHienRa: chữ của hai khối liền nhau không dính vào nhau', /Một\s+Hai/.test(chuHienRa('<p>Một</p><p>Hai</p>')));
  ok('boTienDaChot không đổi HTML của trang khác', boTienDaChot(trang(giaGoi('400.000 đ')), '/thuc-don') === trang(giaGoi('400.000 đ')));
  ok('boTienDaChot không đổi chữ ngoài phần tử data-tien', boTienDaChot('<p>Giá 400.000 đ</p><span data-tien>1.000 đ</span>', '/mua-thit-ve').startsWith('<p>Giá 400.000 đ</p>'));
  ok('boTienDaChot nhận chuỗi lạ (null, số) không ném lỗi', (() => { try { boTienDaChot(null, '/mua-thit-ve'); boTienDaChot('<p></p>', null); return true; } catch { return false; } })());
});

// ===========================================================================
await nhom('4 · BA ĐƯỜNG DẪN MIỄN KHỚP CAP_DUONG_DAN', async () => {
  const dong = CAP_DUONG_DAN.find(d => d[0] === '/mua-thit-ve');
  ok('Ba đường dẫn miễn khớp dòng /mua-thit-ve của CAP_DUONG_DAN',
     !!dong && JSON.stringify([...DUONG_DAN_HIEN_GIA]) === JSON.stringify([...dong]),
     `DUONG_DAN_HIEN_GIA ${JSON.stringify(DUONG_DAN_HIEN_GIA)} · CAP_DUONG_DAN ${JSON.stringify(dong ?? null)}`);
  ok('Chỉ ba đường dẫn được miễn, không trang nào khác', DUONG_DAN_HIEN_GIA.length === 3);
  ok('DUONG_DAN_HIEN_GIA không sửa được lúc chạy (đóng băng)', Object.isFrozen(DUONG_DAN_HIEN_GIA));
});

// ===========================================================================
await nhom('5 · BỘ QUÉT, TRÌNH DUYỆT, THU-DAY-DU DÙNG ĐÚNG HÀM VÀ ĐỦ TRANG', async () => {
  const doc = f => readFileSync(join(WEB, 'kiem-tra', f), 'utf8');
  const quetMa = doc('quet-chuoi-cam.mjs');
  ok('quet-chuoi-cam.mjs nạp chuHienRa, boTienDaChot từ ./chu-hien-ra.mjs, không tự định nghĩa chuHienRa',
     /import\s*\{[^}]*\bchuHienRa\b[^}]*\bboTienDaChot\b[^}]*\}\s*from\s*'\.\/chu-hien-ra\.mjs'/.test(quetMa)
       || /import\s*\{[^}]*\bboTienDaChot\b[^}]*\bchuHienRa\b[^}]*\}\s*from\s*'\.\/chu-hien-ra\.mjs'/.test(quetMa));
  ok('quet-chuoi-cam.mjs không còn hàm chuHienRa riêng (một bản, không hai bản lệch nhau)', !/function\s+chuHienRa\b/.test(quetMa));
  ok('quet-chuoi-cam.mjs quét timChuoiCam(chuHienRa(boTienDaChot(html, duong)))',
     /timChuoiCam\(\s*chuHienRa\(\s*boTienDaChot\(\s*html\s*,\s*duong\s*\)\s*\)\s*\)/.test(quetMa));
  const luonCo = quetMa.match(/const luon_co = \[([\s\S]*?)\];/)?.[1] ?? '';
  const thieuQuet = CAP_DUONG_DAN.flat().filter(d => !luonCo.includes(`'${d}'`));
  ok(`quet-chuoi-cam.mjs: danh sách cố định có đủ ${CAP_DUONG_DAN.flat().length} trang của CAP_DUONG_DAN (sitemap hỏng vẫn quét hết)`,
     thieuQuet.length === 0, `thiếu ${thieuQuet.join(', ')}`);

  const tdMa = doc('trinh-duyet.mjs');
  const coDinh = tdMa.match(/async function danhSachTrang\(goc\) \{\s*const bo = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? '';
  const thieuTd = CAP_DUONG_DAN.flat().filter(d => !coDinh.includes(`'${d}'`));
  ok(`trinh-duyet.mjs: danh sách cố định có đủ ${CAP_DUONG_DAN.flat().length} trang của CAP_DUONG_DAN`, thieuTd.length === 0, `thiếu ${thieuTd.join(', ')}`);
  const trangForm = tdMa.match(/const TRANG_FORM = \[([^\]]*)\]/)?.[1] ?? '';
  ok('trinh-duyet.mjs: ba đường dẫn Mua thịt về nằm trong TRANG_FORM (chưa có database → không form nào, không "thành công")',
     MUA.every(d => trangForm.includes(`'${d}'`)), trangForm);
  const loiLen = tdMa.match(/const TRANG_LOI_LEN = \[([^\]]*)\]/)?.[1] ?? '';
  ok('trinh-duyet.mjs: ba đường dẫn Mua thịt về KHÔNG nằm trong TRANG_LOI_LEN (trang không in câu chỉ đường trong nội dung chính khi chưa mở)',
     !!loiLen && MUA.every(d => !loiLen.includes(`'${d}'`)));

  const dayDuMa = doc('thu-day-du.mjs');
  ok('thu-day-du.mjs nhóm 12 quét chữ cấm bằng chuHienRa + boTienDaChot của chu-hien-ra.mjs',
     /from '\.\/chu-hien-ra\.mjs'/.test(dayDuMa) && /timChuoiCam\(\s*chuHienRa\(\s*boTienDaChot\(/.test(dayDuMa));
  ok('thu-day-du.mjs có nhóm 12 · MUA THỊT VỀ', /nhom\('12 · MUA THỊT VỀ/.test(dayDuMa));
});

// ===========================================================================
// Supabase giả: kịch bản → trạng thái. Đọc qua HTTP bằng supabase-js thật (bản của web/), như trang đọc.
await nhom('6 · SUPABASE GIẢ: MENU THỬ ĐÚNG HỢP ĐỒNG 11 CỘT, MỖI KỊCH BẢN ĐÚNG TRẠNG THÁI TRANG', async () => {
  const gia = await napWeb('kiem-tra/gia-supabase.mjs');
  const { nhomMuaThitVe, docMuaThitVe, trangThaiMuaThit, coGiaoHang } = await napWeb('src/lib/mua-thit-ve.ts');
  const { muaThitVeMo, laLinkZaloOa } = await napWeb('src/lib/dich-dat-hang.ts');
  const requireWeb = createRequire(join(WEB, 'package.json'));
  const { createClient } = await import(pathToFileURL(requireWeb.resolve('@supabase/supabase-js')).href);

  const COT = ['san_pham_ma', 'loai', 'don_vi', 'bao_quan', 'ten', 'ten_vi', 'mo_ta', 'cach_dung', 'so_gam', 'gia', 'tam_het'];
  const MOI = ['mua-thit-mo', 'mua-thit-giao', 'mua-thit-het-quay', 'mua-thit-rong', 'mua-thit-khong-zalo', 'mua-thit-zalo-la',
    'mua-thit-lech', 'mua-thit-loi', 'mua-thit-dut', 'mua-thit-treo'];
  ok('KICH_BAN có đủ mười kịch bản mua-thit-*', MOI.every(k => gia.KICH_BAN.includes(k)), MOI.filter(k => !gia.KICH_BAN.includes(k)).join(', '));
  ok('MENU_THU export cho thu-day-du.mjs, có Ribeye with Cap, Thăn ngoại, Ba chỉ bò Mỹ, LA Galbi, Kim chi cải thảo và một sản phẩm tên dài',
     Array.isArray(gia.MENU_THU) && ['ribeye-cap', 'than-ngoai', 'ba-chi-bo-my', 'la-galbi', 'kim-chi-cai-thao'].every(ma => gia.MENU_THU.some(s => s.ma === ma))
       && gia.MENU_THU.length === 6);
  ok('ZALO_OA_THU là link Zalo OA hợp lệ (laLinkZaloOa của trang)', laLinkZaloOa(gia.ZALO_OA_THU) === gia.ZALO_OA_THU);

  for (const nn of ['vi', 'en', 'ko']) {
    const dong = gia.menuMuaThitVe('mua-thit-mo', nn);
    ok(`[${nn}] mỗi dòng đúng 11 cột, đúng thứ tự của mua_thit_ve_cong_khai (0101)`,
       dong.length > 0 && dong.every(d => JSON.stringify(Object.keys(d)) === JSON.stringify(COT)));
    const sp = nhomMuaThitVe(dong);
    const soGoi = gia.MENU_THU.reduce((n, s) => n + s.goi.length, 0);
    ok(`[${nn}] menu thử qua lớp chặn thứ hai của trang (nhomMuaThitVe) nguyên vẹn: đủ ${gia.MENU_THU.length} sản phẩm, ${soGoi} gói, mô tả còn nguyên`,
       sp.length === gia.MENU_THU.length && sp.reduce((n, s) => n + s.goi.length, 0) === soGoi && sp.every(s => s.moTa),
       `${sp.length} sản phẩm, ${sp.reduce((n, s) => n + s.goi.length, 0)} gói`);
    ok(`[${nn}] tên theo thứ tiếng; ten_vi luôn tiếng Việt; LA Galbi tên en / ko giống ten_vi (để thử lang="vi")`,
       dong.every(d => d.ten_vi === gia.MENU_THU.find(s => s.ma === d.san_pham_ma).ten.vi)
         && dong.filter(d => d.san_pham_ma === 'la-galbi').every(d => d.ten === d.ten_vi)
         && (nn === 'vi' || dong.some(d => d.ten !== d.ten_vi)));
    ok(`[${nn}] chữ của menu thử không dính chữ cấm`, dong.every(d => [d.ten, d.ten_vi, d.mo_ta, d.cach_dung].every(s => !s || timChuoiCam(s).length === 0)));
  }
  const dongVi = gia.menuMuaThitVe('mua-thit-mo', 'vi');
  ok('Giá thử: số nguyên dương, chia hết cho 1.000 (ràng buộc giá của 0099); thịt trước kim chi; gói theo số gam tăng dần',
     dongVi.every(d => Number.isSafeInteger(d.gia) && d.gia > 0 && d.gia % 1000 === 0)
       && dongVi.findIndex(d => d.loai === 'kim_chi') === dongVi.length - 1
       && gia.MENU_THU.every(s => s.goi.every((g, i, a) => i === 0 || a[i - 1].soGam < g.soGam)));
  const dai = gia.MENU_THU.find(s => !['ribeye-cap', 'than-ngoai', 'ba-chi-bo-my', 'la-galbi', 'kim-chi-cai-thao'].includes(s.ma));
  ok('Sản phẩm tên dài: tên tiếng Việt đúng 120 ký tự, mô tả tiếng Việt đúng 500 ký tự (giới hạn của 0099), mã ≤ 40 ký tự',
     dai?.ten.vi.length === 120 && dai?.moTa.vi.length === 500 && dai.ma.length <= 40 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(dai.ma),
     `tên ${dai?.ten.vi.length}, mô tả ${dai?.moTa.vi.length}, mã ${dai?.ma}`);
  ok('mua-thit-mo: đúng một gói tạm hết (Ba chỉ bò Mỹ 400 g); mua-thit-het-quay: mọi gói tạm hết',
     JSON.stringify(dongVi.filter(d => d.tam_het).map(d => `${d.san_pham_ma}_${d.so_gam}`)) === '["ba-chi-bo-my_400"]'
       && gia.menuMuaThitVe('mua-thit-het-quay', 'vi').every(d => d.tam_het));
  ok('Kịch bản cũ (rong, day-du, dat-ban-dong): hàm trả [], hien_mua_thit_ve null',
     ['rong', 'day-du', 'dat-ban-dong'].every(k => gia.menuMuaThitVe(k, 'vi').length === 0 && gia.noiDung(k, 'vi').hien_mua_thit_ve === null));

  // Khóa của NoiDung (bản RONG trong noi-dung.ts) — database trả ĐỦ mọi khóa, server giả cũng vậy.
  const rong = readFileSync(join(WEB, 'src', 'lib', 'noi-dung.ts'), 'utf8').match(/const RONG: NoiDung = \{([\s\S]*?)\};/)?.[1] ?? '';
  const khoaNoiDung = [...rong.matchAll(/(\w+):\s*null/g)].map(m => m[1]);
  const khoaGia = Object.keys(gia.noiDung('rong', 'vi'));
  ok(`noi_dung_cong_khai giả trả đủ ${khoaNoiDung.length} khóa của NoiDung (như database), không thừa khóa nào`,
     khoaNoiDung.length > 30 && khoaNoiDung.every(k => khoaGia.includes(k)) && khoaGia.every(k => khoaNoiDung.includes(k)),
     `thiếu ${khoaNoiDung.filter(k => !khoaGia.includes(k)).join(', ')} · thừa ${khoaGia.filter(k => !khoaNoiDung.includes(k)).join(', ')}`);

  // ---- Qua HTTP, như trang thật -------------------------------------------------------------------------------
  const may = await gia.batMayGia({ cong: 0, im: true });
  try {
    const client = createClient(may.goc, 'khoa-thu', { auth: { persistSession: false, autoRefreshToken: false } });
    ok('Server giả nghe ở cổng hệ điều hành chọn (cong: 0) và báo đúng địa chỉ', may.cong > 0 && may.goc.endsWith(`:${may.cong}`), may.goc);
    may.datKichBan('mua-thit-mo');
    const dung = await client.rpc('mua_thit_ve_cong_khai', { p_ngon_ngu: 'en', p_chi_nhanh_ma: 'q1' });
    const sai = await client.rpc('mua_thit_ve_cong_khai', { p_lang: 'en' });
    ok('mua_thit_ve_cong_khai(p_ngon_ngu, p_chi_nhanh_ma) trả 200; tên tham số lạ → 404 PGRST202 (như PostgREST)',
       !dung.error && Array.isArray(dung.data) && dung.data.length > 0 && dung.data.every(d => d.ten_vi) && sai.error?.code === 'PGRST202',
       JSON.stringify(dung.error ?? sai.error ?? null));

    // [kịch bản, trang mở (muaThitVeMo), trạng thái trang, nhận giao, có hotline]
    const BANG = [
      ['rong', false, 'chua_mo', false, false],
      ['day-du', false, 'chua_mo', false, true],
      ['dat-ban-dong', false, 'chua_mo', false, true],
      ['mua-thit-mo', true, 'mo', false, true],
      ['mua-thit-giao', true, 'mo', true, false],
      ['mua-thit-het-quay', true, 'het_quay', false, true],
      ['mua-thit-rong', false, 'chua_mo', false, true],
      ['mua-thit-khong-zalo', false, 'chua_mo', false, true],
      ['mua-thit-zalo-la', false, 'chua_mo', false, true],
      ['mua-thit-lech', true, 'chua_mo', false, true],
      ['mua-thit-loi', true, 'loi', false, true],
      ['mua-thit-dut', true, 'loi', false, true],
      ['mua-thit-treo', true, 'loi', false, true],
    ];
    const loiCu = console.error;
    const nhatKy = [];
    console.error = (...x) => nhatKy.push(x.join(' '));
    try {
      for (const [kb, mo, trangThai, giao, coHotline] of BANG) {
        may.datKichBan(kb);
        const nd = (await client.rpc('noi_dung_cong_khai', { p_ngon_ngu: 'vi' })).data;
        const batDau = Date.now();
        const menu = await docMuaThitVe('vi', client, kb === 'mua-thit-treo' ? 300 : 4000);
        const thoiGian = Date.now() - batDau;
        const thay = [muaThitVeMo(nd), trangThaiMuaThit(muaThitVeMo(nd), menu), coGiaoHang(nd), !!nd?.hotline];
        ok(`${kb}: muaThitVeMo ${mo}, trạng thái ${trangThai}, nhận giao ${giao}, hotline ${coHotline ? 'có' : 'không'}`,
           JSON.stringify(thay) === JSON.stringify([mo, trangThai, giao, coHotline]), JSON.stringify(thay));
        if (kb === 'mua-thit-treo') ok('mua-thit-treo: database không trả lời — trang thôi chờ đúng hạn (300 ms ở đây), không treo theo', thoiGian < 2000, `${thoiGian} ms`);
      }
    } finally {
      console.error = loiCu;
    }
    ok('Ba kịch bản lỗi (loi, dut, treo) mỗi kịch bản đúng một dòng log [mua-thit-ve]', nhatKy.filter(d => d.includes('[mua-thit-ve]')).length === 3, nhatKy.join(' | '));
    may.datKichBan('mua-thit-giao');
    const ndGiao = (await client.rpc('noi_dung_cong_khai', { p_ngon_ngu: 'ko' })).data;
    ok('mua-thit-giao: chữ giao hàng và giờ nhận theo thứ tiếng, không số tiền, không chữ cấm',
       /배달/.test(ndGiao.mua_thit_giao_hang) && !!ndGiao.mua_thit_gio_nhan
         && timChuoiCam(`${ndGiao.mua_thit_giao_hang} ${ndGiao.mua_thit_gio_nhan}`).length === 0, JSON.stringify([ndGiao.mua_thit_giao_hang, ndGiao.mua_thit_gio_nhan]));
  } finally {
    await may.dong();
  }
});

process.exit(ketThuc('BỘ QUÉT MIỄN GIÁ'));
