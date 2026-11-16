/**
 * BEEFTOWN — TÁM TRANG CHÍNH SÁCH, CHÂN TRANG, CHỖ CÒN TRỐNG
 * ==========================================================
 *
 *     node test/test-cong-khai-chinh-sach.mjs
 *
 * Khánh giao 16/11/2026: beeftown.vn cho khách đặt và trả trước qua VNPay ở trang Mua thịt về, nên phải nộp
 * hồ sơ thông báo website thương mại điện tử (Luật Thương mại điện tử 122/2025/QH15, Nghị định 248/2026/NĐ-CP).
 * Hồ sơ chụp chân trang, các trang chính sách, trang sản phẩm, giỏ hàng. File này giữ:
 *
 *   1. Tám trang (Điều khoản, Chính sách giá, Thanh toán, Giao hàng, Đổi trả hoàn tiền, Khiếu nại, Điều kiện bán
 *      hàng, Hỗ trợ) có đúng đường dẫn vi / en / ko Khánh đề xuất, có file trang, đủ ba thứ tiếng, ngày cập nhật.
 *   2. Link trong câu: ba thứ tiếng trỏ cùng chỗ, đường dẫn nội bộ có thật, link ngoài chỉ tel / mailto / https.
 *   3. Chỗ trống (lib/cho-trong.ts): đúng 13 chỗ Khánh liệt kê, chỉ nằm ở một file, ba thứ tiếng cùng chỗ trống,
 *      mỗi chỗ có trang dùng — điền một chỗ là mọi trang đổi theo.
 *   4. Không deploy khi còn chỗ trống: kiem-tra/cho-con-trong.mjs bắt đúng dạng, gắn ở đầu cả hai lệnh deploy.
 *   5. Chân trang: email ngay dưới số điện thoại pháp nhân, nhóm CHÍNH SÁCH chín link, biểu tượng xác nhận ẩn.
 *   6. Trang Mua thịt về: câu cạnh nút Đặt hàng có ba link, dòng VAT, VNPay vẫn ở cổng thử.
 *   7. Quyền riêng tư: mục "Ai giữ thông tin của bạn", thời hạn giữ đơn; địa chỉ đăng ký chỉ ở chân trang.
 *
 * Chữ cấm, chữ ghi chú review, chữ Việt lẫn trong bản en / ko và luật địa điểm của chữ tám trang chạy ở
 * test-cong-khai-cau-chu.mjs (nó đọc cả lib/chinh-sach.ts); trang đã dựng ở web/kiem-tra/trinh-duyet.mjs.
 */

import { readFileSync, existsSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const SRC = join(WEB, 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const doc = (...p) => readFileSync(join(SRC, ...p), 'utf8');

const { CHINH_SACH, THU_TU_CHINH_SACH, NGAY_CAP_NHAT, CAU_CAP_NHAT, XAC_NHAN_CO_QUAN, tachLienKet, chuCuaCau } = await nap('chinh-sach.ts');
const { CHO_TRONG } = await nap('cho-trong.ts');
const { CAP_DUONG_DAN, PHAP_NHAN, chu, NGON_NGU } = await nap('chu.ts');
const { timChoTrong, MAU_CHO_TRONG } = await import(pathToFileURL(join(WEB, 'kiem-tra', 'cho-con-trong.mjs')).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TÁM TRANG CHÍNH SÁCH, CHÂN TRANG, CHỖ CÒN TRỐNG');

// Bảng của Khánh (16/11/2026), chép tay — KHÔNG đọc từ lib/chinh-sach.ts: gõ nhầm một đường dẫn ở đó thì đỏ.
const BANG = [
  ['dieuKhoan',    'Điều khoản',         '/dieu-khoan',         '/en/terms',      '/ko/terms'],
  ['chinhSachGia', 'Chính sách giá',     '/chinh-sach-gia',     '/en/pricing',    '/ko/pricing'],
  ['thanhToan',    'Thanh toán',         '/thanh-toan',         '/en/payment',    '/ko/payment'],
  ['giaoHang',     'Giao hàng',          '/giao-hang',          '/en/delivery',   '/ko/delivery'],
  ['doiTra',       'Đổi trả, hoàn tiền', '/doi-tra-hoan-tien',  '/en/returns',    '/ko/returns'],
  ['khieuNai',     'Khiếu nại',          '/khieu-nai',          '/en/complaints', '/ko/complaints'],
  ['dieuKienBan',  'Điều kiện bán hàng', '/dieu-kien-ban-hang', '/en/conditions', '/ko/conditions'],
  ['hoTro',        'Hỗ trợ',             '/ho-tro',             '/en/support',    '/ko/support'],
];
// 13 chỗ chờ trả lời Khánh liệt kê, chép tay.
const TEN_CHO_TRONG = ['EMAIL', 'VUNG_GIAO', 'GIO_GIAO', 'DON_VI_GIAO', 'GIU_LANH', 'CACH_TINH_GOI', 'VAT', 'GIAO_LAI',
  'GIO_BAO_LOI', 'NGAY_HOAN', 'GIO_TRA_LOI', 'GIO_HO_TRO', 'THOI_GIAN_GIU_DON'];
const MOT_CHUOI = ['EMAIL', 'GIO_BAO_LOI', 'NGAY_HOAN'];

const laCau = x => x && typeof x === 'object' && NGON_NGU.every(k => typeof x[k] === 'string');
/** Mọi câu { vi, en, ko } trong một trang (tên, tiêu đề, mô tả, tiêu đề mục, đoạn, dòng của danh sách). */
const cauCua = trang => {
  const ra = [];
  const di = (x, duong) => {
    if (laCau(x)) { ra.push({ duong, cau: x }); return; }
    if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) di(v, `${duong}.${k}`);
  };
  di(trang, '');
  return ra;
};
const chuTrang = (trang, nn) => cauCua(trang).map(c => chuCuaCau(c.cau[nn])).join('\n');
const choTrongTrong = s => [...String(s).matchAll(MAU_CHO_TRONG)].map(m => m[0]).sort();

// ===========================================================================
await nhom('1 · TÁM TRANG: ĐƯỜNG DẪN, FILE TRANG, ĐỦ BA THỨ TIẾNG, NGÀY CẬP NHẬT', async () => {
  ok('CHINH_SACH có đúng tám trang của bảng Khánh giao', JSON.stringify(Object.keys(CHINH_SACH).sort()) === JSON.stringify(BANG.map(b => b[0]).sort()),
     Object.keys(CHINH_SACH).join(', '));
  ok('Thứ tự link ở chân trang đúng thứ tự Khánh ghi (Điều khoản · Chính sách giá · … · Hỗ trợ)',
     JSON.stringify(THU_TU_CHINH_SACH) === JSON.stringify(BANG.map(b => b[0])), THU_TU_CHINH_SACH.join(', '));
  for (const [khoa, ten, vi, en, ko] of BANG) {
    const t = CHINH_SACH[khoa];
    ok(`${khoa}: tên "${ten}", đường dẫn ${vi}`, t?.ten.vi === ten && t?.duong === vi, `${t?.ten.vi} · ${t?.duong}`);
    ok(`${khoa}: CAP_DUONG_DAN có đúng dòng [${vi}, ${en}, ${ko}] (nút đổi ngôn ngữ, sitemap, hreflang)`,
       CAP_DUONG_DAN.some(d => d[0] === vi && d[1] === en && d[2] === ko));
    for (const [nn, duong] of [['vi', vi], ['en', en], ['ko', ko]]) {
      const f = join(SRC, 'pages', `${duong.slice(1)}.astro`);
      const nguon = existsSync(f) ? readFileSync(f, 'utf8') : '';
      ok(`${duong}: file trang gọi <TrangChinhSach ngonNgu="${nn}" khoa="${khoa}" />`,
         nguon.includes(`<TrangChinhSach ngonNgu="${nn}" khoa="${khoa}" />`), existsSync(f) ? nguon.slice(-120) : 'không có file');
    }
    const cau = cauCua(t);
    const rong = cau.filter(c => NGON_NGU.some(nn => !c.cau[nn].trim()));
    ok(`${khoa}: ${cau.length} câu, câu nào cũng đủ vi / en / ko, không bản nào rỗng`, cau.length >= 6 && rong.length === 0,
       rong.map(c => c.duong).join(', '));
    ok(`${khoa}: có ít nhất hai mục, mỗi mục có tiêu đề và nội dung`, t.muc.length >= 2 && t.muc.every(m => m.khoi.length > 0));
  }
  // Ngày cập nhật: dd/mm/yyyy, ngày có thật (không 31/02), in ở cả ba thứ tiếng.
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(NGAY_CAP_NHAT);
  const ngay = m && new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  ok(`NGAY_CAP_NHAT "${NGAY_CAP_NHAT}" là ngày có thật, dạng dd/mm/yyyy`,
     !!ngay && ngay.getUTCDate() === +m[1] && ngay.getUTCMonth() === +m[2] - 1 && +m[3] >= 2026);
  ok('Câu ngày cập nhật có ngày đó ở cả ba thứ tiếng', NGON_NGU.every(nn => CAU_CAP_NHAT[nn].includes(NGAY_CAP_NHAT)));
  const khung = doc('components', 'TrangChinhSach.astro');
  ok('TrangChinhSach.astro in ngày cập nhật ở cuối trang, dưới mọi mục', /\)\)\}\s*<p class="nho">\{CAU_CAP_NHAT\[nn\]\}<\/p>\s*<\/TrangVanBan>/.test(khung));
  ok('TrangChinhSach.astro dùng khung chữ TrangVanBan như Quyền riêng tư, tiêu đề trang "<tên> — Beeftown"',
     /<TrangVanBan hieu=\{trang\.ten\[nn\]\} tieuDe=\{trang\.tieuDe\[nn\]\}>/.test(khung) && /tieuDe=\{`\$\{trang\.ten\[nn\]\} — Beeftown`\}/.test(khung));
});

// ===========================================================================
await nhom('2 · LINK TRONG CÂU: CÙNG ĐÍCH Ở BA THỨ TIẾNG, ĐƯỜNG DẪN CÓ THẬT', async () => {
  const tach = s => JSON.stringify(tachLienKet(s));
  ok('tachLienKet: câu không link giữ nguyên một mẩu', tach('Giữ lại gói, chưa dùng.') === JSON.stringify([{ chu: 'Giữ lại gói, chưa dùng.' }]));
  ok('tachLienKet: link giữa câu tách đúng ba mẩu',
     tach('Xem trang [Giao hàng](/giao-hang).') === JSON.stringify([{ chu: 'Xem trang ' }, { chu: 'Giao hàng', dich: '/giao-hang' }, { chu: '.' }]));
  ok('tachLienKet: tel:, mailto:, https: là link; javascript: và ngoặc vuông trơn là chữ thường',
     tachLienKet('[a](tel:0961245124) [b](mailto:x@y.vn) [c](https://online.gov.vn) [d](javascript:alert(1)) [e] (f)')
       .filter(m => m.dich).map(m => m.dich).join(' ') === 'tel:0961245124 mailto:x@y.vn https://online.gov.vn');
  const viCuaBang = new Set(CAP_DUONG_DAN.map(d => d[0]));
  for (const [khoa] of BANG) {
    const sai = [];
    for (const { duong, cau } of cauCua(CHINH_SACH[khoa])) {
      const dich = nn => tachLienKet(cau[nn]).filter(m => m.dich).map(m => m.dich).sort().join(' ');
      if (dich('vi') !== dich('en') || dich('vi') !== dich('ko')) sai.push(`${duong}: vi «${dich('vi')}» en «${dich('en')}» ko «${dich('ko')}»`);
      for (const d of dich('vi').split(' ').filter(Boolean)) {
        if (d.startsWith('/') && !viCuaBang.has(d)) sai.push(`${duong}: ${d} không có trong CAP_DUONG_DAN`);
      }
      for (const nn of NGON_NGU) if (/\]\(|\[[^\]]*\]\s+\(/.test(chuCuaCau(cau[nn]))) sai.push(`${duong} [${nn}]: cú pháp link gõ sai`);
    }
    ok(`${khoa}: mọi link trỏ cùng đích ở vi / en / ko, đường dẫn nội bộ có trong CAP_DUONG_DAN, không cú pháp link gõ sai`,
       sai.length === 0, sai.slice(0, 3).join(' | '));
  }
  const khung = doc('components', 'TrangChinhSach.astro');
  ok('TrangChinhSach.astro: link nội bộ đổi sang đúng thứ tiếng (duongDanTuongUng), link https có rel="noopener"',
     /m\.dich\.startsWith\('\/'\) \? duongDanTuongUng\(m\.dich, nn\) : m\.dich/.test(khung) && /rel=\{m\.ngoai \? 'noopener' : undefined\}/.test(khung));
  // Số điện thoại: chữ "0961 245 124" như chân trang, link gọi không dấu cách.
  const tt = chuTrang(CHINH_SACH.thanhToan, 'vi');
  ok('Số điện thoại pháp nhân in "0961 245 124", link gọi tel:0961245124',
     tt.includes('0961 245 124') && cauCua(CHINH_SACH.thanhToan).some(c => c.cau.vi.includes('[0961 245 124](tel:0961245124)')));
});

// ===========================================================================
await nhom('3 · CHỖ CÒN TRỐNG: ĐÚNG 13 CHỖ, MỘT FILE, BA THỨ TIẾNG CÙNG CHỖ, CHỖ NÀO CŨNG CÓ TRANG DÙNG', async () => {
  ok('CHO_TRONG có đúng 13 khóa Khánh liệt kê', JSON.stringify(Object.keys(CHO_TRONG).sort()) === JSON.stringify([...TEN_CHO_TRONG].sort()),
     Object.keys(CHO_TRONG).join(', '));
  for (const k of TEN_CHO_TRONG) {
    const v = CHO_TRONG[k];
    if (MOT_CHUOI.includes(k)) {
      ok(`${k}: một chuỗi (email / con số, giống nhau ở ba thứ tiếng), chưa điền thì đúng là chỗ trống của chính nó`,
         typeof v === 'string' && v.trim() !== '' && (!v.includes('{{') || v === `{{${k}}}`), JSON.stringify(v));
    } else {
      const ban = laCau(v) ? NGON_NGU.map(nn => v[nn]) : [];
      const conTrong = ban.filter(s => s.includes('{{'));
      ok(`${k}: { vi, en, ko }; hoặc cả ba còn là chỗ trống của chính nó, hoặc cả ba đã điền — không điền dở một thứ tiếng`,
         ban.length === 3 && ban.every(s => s.trim() !== '') && (conTrong.length === 0 || ban.every(s => s === `{{${k}}}`)), JSON.stringify(v));
    }
  }
  // Ba thứ tiếng của một câu mang đúng cùng những chỗ trống.
  const lech = Object.entries(CHINH_SACH).flatMap(([khoa, t]) => cauCua(t)
    .filter(({ cau }) => NGON_NGU.some(nn => JSON.stringify(choTrongTrong(cau[nn])) !== JSON.stringify(choTrongTrong(cau.vi))))
    .map(c => `${khoa}${c.duong}`));
  ok('Mọi câu của tám trang: bản en, ko có đúng những chỗ trống của bản vi', lech.length === 0, lech.join(' | '));
  // Mỗi chỗ trống hiện ở trang Khánh định (theo giá trị, nên vẫn đúng sau khi điền).
  const DUNG_O = {
    giaoHang: ['VUNG_GIAO', 'GIO_GIAO', 'DON_VI_GIAO', 'GIU_LANH', 'GIAO_LAI'],
    chinhSachGia: ['VAT', 'CACH_TINH_GOI'],
    thanhToan: ['NGAY_HOAN'],
    doiTra: ['GIO_BAO_LOI', 'NGAY_HOAN'],
    khieuNai: ['GIO_TRA_LOI', 'EMAIL'],
    hoTro: ['GIO_HO_TRO', 'EMAIL'],
    dieuKhoan: ['EMAIL'],
  };
  for (const [khoa, ds] of Object.entries(DUNG_O)) {
    for (const nn of NGON_NGU) {
      const chuCua = chuTrang(CHINH_SACH[khoa], nn);
      const thieu = ds.filter(k => !chuCua.includes(typeof CHO_TRONG[k] === 'string' ? CHO_TRONG[k] : CHO_TRONG[k][nn]));
      ok(`${khoa} [${nn}]: in ${ds.join(', ')}`, thieu.length === 0, `thiếu ${thieu.join(', ')}`);
    }
  }
  const dungNgoai = [
    ['EMAIL', 'components/ChanTrang.astro', '{CHO_TRONG.EMAIL}'],
    ['VAT', 'components/TrangMuaThitVe.astro', '${CHO_TRONG.VAT.vi}'],
    ['THOI_GIAN_GIU_DON', 'pages/quyen-rieng-tu.astro', '{CHO_TRONG.THOI_GIAN_GIU_DON.vi}'],
    ['THOI_GIAN_GIU_DON', 'pages/en/privacy.astro', '{CHO_TRONG.THOI_GIAN_GIU_DON.en}'],
    ['THOI_GIAN_GIU_DON', 'pages/ko/privacy.astro', '{CHO_TRONG.THOI_GIAN_GIU_DON.ko}'],
    ['EMAIL', 'pages/quyen-rieng-tu.astro', '{CHO_TRONG.EMAIL}'],
    ['EMAIL', 'pages/en/privacy.astro', '{CHO_TRONG.EMAIL}'],
    ['EMAIL', 'pages/ko/privacy.astro', '{CHO_TRONG.EMAIL}'],
  ];
  for (const [k, f, chuoi] of dungNgoai) ok(`${f} in ${k} qua CHO_TRONG`, doc(...f.split('/')).includes(chuoi));
  const daDung = new Set([...Object.values(DUNG_O).flat(), ...dungNgoai.map(d => d[0])]);
  ok('Chỗ trống nào cũng có ít nhất một trang in nó', TEN_CHO_TRONG.every(k => daDung.has(k)), TEN_CHO_TRONG.filter(k => !daDung.has(k)).join(', '));
  // Chỗ trống chỉ nằm ở lib/cho-trong.ts: điền một chỗ là mọi trang đổi theo, không còn bản chép nằm ở trang nào.
  const thay = timChoTrong(SRC);
  const ngoai = thay.filter(t => t.file !== 'lib/cho-trong.ts');
  ok('Trong web/src, chỗ trống chỉ nằm ở lib/cho-trong.ts', ngoai.length === 0, ngoai.slice(0, 4).map(t => `${t.file}:${t.dong} ${t.cho}`).join(' | '));
  const conTrong = TEN_CHO_TRONG.filter(k => JSON.stringify(CHO_TRONG[k]).includes(`{{${k}}}`));
  ok(`Bộ quét trước deploy thấy đúng ${conTrong.length} chỗ còn trống của CHO_TRONG`,
     JSON.stringify([...new Set(thay.map(t => t.cho))].sort()) === JSON.stringify(conTrong.map(k => `{{${k}}}`).sort()),
     [...new Set(thay.map(t => t.cho))].join(', '));
});

// ===========================================================================
await nhom('4 · KHÔNG DEPLOY KHI CÒN CHỖ TRỐNG (web/kiem-tra/cho-con-trong.mjs)', async () => {
  const thuMuc = mkdtempSync(join(tmpdir(), 'cho-trong-'));
  try {
    mkdirSync(join(thuMuc, 'lib'));
    writeFileSync(join(thuMuc, 'lib', 'a.ts'), "export const A = { EMAIL: '{{EMAIL}}' };\nconst b = 1;\nconst c = '{{GIO_BAO_LOI}} giờ {{NGAY_HOAN}}';\n");
    writeFileSync(join(thuMuc, 'B.astro'), '<span class:list={{ lien: cum.giu }}>x</span>\n<p style={{ color: "red" }}>{{ten}}</p>\n');
    const thay = timChoTrong(thuMuc);
    ok('Bắt chỗ trống trong chuỗi, đủ file và dòng', JSON.stringify(thay) === JSON.stringify([
      { file: 'lib/a.ts', dong: 1, cho: '{{EMAIL}}' }, { file: 'lib/a.ts', dong: 3, cho: '{{GIO_BAO_LOI}}' }, { file: 'lib/a.ts', dong: 3, cho: '{{NGAY_HOAN}}' },
    ]), JSON.stringify(thay));
    ok('Không bắt cú pháp Astro class:list={{ … }}, style={{ … }}, chữ thường {{ten}}', !thay.some(t => t.file === 'B.astro'));
    const chay = () => spawnSync(process.execPath, [join(WEB, 'kiem-tra', 'cho-con-trong.mjs'), '--thu-muc', thuMuc], { encoding: 'utf8' });
    const r1 = chay();
    ok('Còn chỗ trống: thoát mã 1, in "KHÔNG DEPLOY" và tên chỗ, file:dòng', r1.status === 1 && /KHÔNG DEPLOY/.test(r1.stdout)
       && r1.stdout.includes('{{EMAIL}}  lib/a.ts:1'), `mã ${r1.status}: ${r1.stdout.slice(0, 200)}`);
    writeFileSync(join(thuMuc, 'lib', 'a.ts'), "export const A = { EMAIL: 'lienhe@vidu.vn' };\n");
    const r2 = chay();
    ok('Điền xong: thoát mã 0', r2.status === 0 && /Không còn chỗ trống/.test(r2.stdout), `mã ${r2.status}: ${r2.stdout.slice(0, 200)}`);
  } finally {
    rmSync(thuMuc, { recursive: true, force: true });
  }
  const goi = JSON.parse(readFileSync(join(WEB, 'package.json'), 'utf8')).scripts;
  for (const lenh of ['deploy', 'deploy:khan-cap']) {
    const s = goi[lenh] ?? '';
    ok(`npm run ${lenh}: chạy cho-con-trong.mjs ĐẦU TIÊN, trước cổng CI, quét chữ cấm, build và wrangler deploy`,
       s.startsWith('node kiem-tra/cho-con-trong.mjs && ') && s.indexOf('wrangler deploy') > s.indexOf('cho-con-trong.mjs'), s);
  }
  ok('npm run quet không chạy cho-con-trong.mjs (CI chạy quet ở mọi PR — chặn ở đó thì che kiểm thử trình duyệt phía sau)',
     !/cho-con-trong/.test(goi.quet ?? ''));
});

// ===========================================================================
await nhom('5 · CHÂN TRANG: EMAIL, NHÓM CHÍNH SÁCH, BIỂU TƯỢNG XÁC NHẬN ẨN', async () => {
  const chan = doc('components', 'ChanTrang.astro');
  ok('Dòng "Email: …" đứng ngay dưới dòng số điện thoại pháp nhân, cùng kiểu dòng',
     /<p class="chan-dong">\{t\.dienThoai\}: <span class="lien">\{PHAP_NHAN\.dienThoai\}<\/span><\/p>\s*<p class="chan-dong">\{t\.email\}: <span class="lien">\{CHO_TRONG\.EMAIL\}<\/span><\/p>/.test(chan));
  const NHAN = { email: { vi: 'Email', en: 'Email', ko: '이메일' }, chinhSach: { vi: 'Chính sách', en: 'Policies', ko: '정책' } };
  for (const nn of NGON_NGU) {
    ok(`chu.ts [${nn}]: nhãn "${NHAN.email[nn]}", tên nhóm "${NHAN.chinhSach[nn]}"`, chu(nn).email === NHAN.email[nn] && chu(nn).chinhSach === NHAN.chinhSach[nn],
       `${chu(nn).email} · ${chu(nn).chinhSach}`);
  }
  ok('Nhóm CHÍNH SÁCH: <nav> có tiêu đề {t.chinhSach}, link dựng từ danh sách chinhSach',
     /<nav class="ct-chinh-sach" aria-labelledby="ct-chinh-sach">\s*<h2 class="ct-tieu-de" id="ct-chinh-sach">\{t\.chinhSach\}<\/h2>\s*<ul>\s*\{chinhSach\.map\(m => <li><a href=\{m\.url\}>\{m\.chu\}<\/a><\/li>\)\}/.test(chan));
  ok('Danh sách chinhSach: tám trang theo THU_TU_CHINH_SACH (đường dẫn đúng thứ tiếng), Quyền riêng tư đứng cuối',
     /const chinhSach = \[\s*\.\.\.THU_TU_CHINH_SACH\.map\(k => \(\{ url: duongDanTuongUng\(CHINH_SACH\[k\]\.duong, ngonNgu\), chu: CHINH_SACH\[k\]\.ten\[ngonNgu\] \}\)\),\s*\{ url: duongDanTuongUng\('\/quyen-rieng-tu', ngonNgu\), chu: t\.quyenRiengTu \},\s*\];/.test(chan));
  const thongTin = /<nav class="ct-cot" aria-labelledby="ct-thong-tin">([\s\S]*?)<\/nav>/.exec(chan)?.[1] ?? '';
  ok('Nhóm Thông tin còn Tuyển dụng, Xóa dữ liệu; Quyền riêng tư chuyển sang nhóm CHÍNH SÁCH (một link một nhóm)',
     thongTin.includes("'/tuyen-dung'") && thongTin.includes("'/xoa-du-lieu'") && !thongTin.includes("'/quyen-rieng-tu'"), thongTin);
  ok('Link nhóm CHÍNH SÁCH cao 48px như mọi link chân trang (cùng quy tắc với .ct-cot a)', /\.ct-cot a, \.ct-chinh-sach a \{[^}]*min-height: var\(--cham\)/.test(chan));
  ok('Biểu tượng xác nhận của cơ quan quản lý: chưa có mã (XAC_NHAN_CO_QUAN = null), chân trang chỉ in khi đã có',
     XAC_NHAN_CO_QUAN === null && /\{XAC_NHAN_CO_QUAN && \(/.test(chan));
});

// ===========================================================================
await nhom('6 · MUA THỊT VỀ: BA LINK CẠNH NÚT ĐẶT HÀNG, DÒNG VAT, VNPAY VẪN Ở CỔNG THỬ', async () => {
  const mtv = doc('components', 'TrangMuaThitVe.astro');
  ok('Câu cạnh nút Đặt hàng: "Xem" + Quyền riêng tư, Điều khoản, Đổi trả và hoàn tiền, viết liền một dòng',
     /\{c\.xemChinhSach\} <a href=\{duongQuyenRiengTu\}>\{c\.quyenRiengTu\}<\/a>, <a href=\{duongDieuKhoan\}>\{c\.dieuKhoan\}<\/a>, <a href=\{duongDoiTra\}>\{c\.doiTraHoanTien\}<\/a>\.<\/p>/.test(mtv));
  ok('Chữ ba link đủ ba thứ tiếng',
     mtv.includes("xemChinhSach: { vi: 'Xem', en: 'See', ko: '자세한 내용:' }") && mtv.includes("dieuKhoan: { vi: 'Điều khoản', en: 'Terms', ko: '이용약관' }")
       && mtv.includes("doiTraHoanTien: { vi: 'Đổi trả và hoàn tiền', en: 'Returns and refunds', ko: '교환·환불' }"));
  ok('Dòng VAT ngay dưới "Giá gói đã gồm phí giao", cùng chữ với trang Chính sách giá',
     mtv.includes('vat: { vi: `VAT: ${CHO_TRONG.VAT.vi}.`, en: `VAT: ${CHO_TRONG.VAT.en}.`, ko: `VAT: ${CHO_TRONG.VAT.ko}.` }')
       && /\{d\.phu && <p class="mtv-dieu-phu">\{d\.phu\}<\/p>\}\{d\.them && <p class="mtv-dieu-phu" data-vat>\{d\.them\}<\/p>\}/.test(mtv)
       && NGON_NGU.every(nn => chuTrang(CHINH_SACH.chinhSachGia, nn).includes(`VAT: ${CHO_TRONG.VAT[nn]}.`)));
  ok('Dòng "Đang thử cổng VNPay" còn nguyên, hiện khi cổng là cổng thử',
     mtv.includes("vi: 'Đang thử cổng VNPay: chỉ thẻ thử trả được, không trừ tiền thật.'")
       && mtv.includes('{traVnpay && congThu && (<p class="mtv-ghi" data-cong-thu><strong>{c.congThu}</strong></p>)}'));
  ok('VNPay vẫn ở cổng thử (sandbox.vnpayment.vn trong lib/vnpay.ts) — sang tiền thật là PR riêng khi Khánh báo',
     /sandbox\.vnpayment\.vn/.test(doc('lib', 'vnpay.ts')));
});

// ===========================================================================
await nhom('7 · QUYỀN RIÊNG TƯ: AI GIỮ THÔNG TIN, THỜI HẠN GIỮ ĐƠN; ĐỊA CHỈ ĐĂNG KÝ CHỈ Ở CHÂN TRANG', async () => {
  const BAN = [
    ['vi', 'quyen-rieng-tu.astro', '<h2>Ai giữ thông tin của bạn</h2>', 'Đơn mua thịt được giữ {CHO_TRONG.THOI_GIAN_GIU_DON.vi} để quán đối chiếu đơn đã giao.', '<a href="/xoa-du-lieu">'],
    ['en', 'en/privacy.astro', '<h2>Who holds your information</h2>', 'Take-home orders are kept for {CHO_TRONG.THOI_GIAN_GIU_DON.en} so we can check orders we delivered.', '<a href="/en/data-deletion">'],
    ['ko', 'ko/privacy.astro', '<h2>개인정보를 보관하는 곳</h2>', '배달한 주문을 확인할 수 있도록 {CHO_TRONG.THOI_GIAN_GIU_DON.ko} 동안 보관해요.', '<a href="/ko/data-deletion">'],
  ];
  for (const [nn, f, tieuDe, giuDon, xoa] of BAN) {
    const s = doc('pages', ...f.split('/'));
    const muc = s.split(tieuDe)[1]?.split('<h2>')[0] ?? '';
    ok(`${f}: thêm mục "${tieuDe.replace(/<\/?h2>/g, '')}" — tên công ty, mã số thuế, số điện thoại (PHAP_NHAN), email (CHO_TRONG), link Xóa dữ liệu đúng thứ tiếng`,
       !!muc && ['{PHAP_NHAN.ten}', '{PHAP_NHAN.maSoThue}', '{PHAP_NHAN.dienThoai}', '{CHO_TRONG.EMAIL}', xoa].every(x => muc.includes(x)), muc.slice(0, 200));
    ok(`${f}: mục đó đứng trước "Quyền của bạn"`, s.indexOf(tieuDe) > -1 && s.indexOf(tieuDe) < s.indexOf({ vi: '<h2>Quyền của bạn</h2>', en: '<h2>Your rights</h2>', ko: '<h2>이용자의 권리</h2>' }[nn]));
    ok(`${f}: câu giữ đơn mua thịt có thời hạn THOI_GIAN_GIU_DON`, s.replace(/\s+/g, ' ').includes(giuDon));
    ok(`${f}: không in địa chỉ đăng ký (đúng một lần mỗi trang, ở chân trang)`, !s.includes(PHAP_NHAN.diaChi) && !s.includes('PHAP_NHAN.diaChi'));
  }
  const thanTrang = Object.values(CHINH_SACH).flatMap(t => NGON_NGU.map(nn => chuTrang(t, nn))).join('\n');
  ok('Tám trang chính sách không in địa chỉ đăng ký, mà nói "ghi ở cuối trang"', !thanTrang.includes(PHAP_NHAN.diaChi)
     && NGON_NGU.every(nn => chuTrang(CHINH_SACH.dieuKhoan, nn).includes(PHAP_NHAN.ten) && chuTrang(CHINH_SACH.dieuKhoan, nn).includes(PHAP_NHAN.maSoThue)));
  ok('Điều khoản ghi nhà hàng "63 Hồ Tùng Mậu", không số tầng (chưa chốt tầng 3 hay tầng 4)',
     chuTrang(CHINH_SACH.dieuKhoan, 'vi').includes('63 Hồ Tùng Mậu, TP.HCM') && !/tầng\s*\d|floor\s*\d|\d\s*층/iu.test(thanTrang));
});

process.exit(ketThuc('TÁM TRANG CHÍNH SÁCH, CHÂN TRANG, CHỖ CÒN TRỐNG'));
