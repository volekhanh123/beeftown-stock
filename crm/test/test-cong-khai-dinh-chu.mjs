/**
 * BEEFTOWN — Chữ dính nhau vì xuống dòng trên TRANG CÔNG KHAI
 * ===========================================================
 *     node test/test-cong-khai-dinh-chu.mjs
 *
 * Astro 7 (compressHTML 'jsx') bỏ hẳn khoảng trắng có xuống dòng giữa hai nút.
 * Chân trang của mọi trang công khai từng viết
 *
 *     <span>
 *       © {namVn()} {t.banQuyen} ·
 *       <span lang="en">{THUONG_HIEU.descriptor}</span>
 *     </span>
 *
 * và beeftown.vn hiện "© 2026 Beeftown ·Beef Specialty Restaurant". Bộ dò
 * dinh-chu.mjs có sẵn nhưng bỏ sót vì hai lẽ:
 *   1. <span> / <div> có chữ trộn với thẻ chữ không được coi là dòng chữ, và
 *      <span> bên trong không được coi là thẻ chữ.
 *   2. Chỉ test kho và nội bộ chạy bộ dò; không gì quét trang công khai.
 *
 * Hai nhóm kiểm:
 *   1. Bộ dò bắt đúng mẫu chân trang cũ, đọc được từ điển vi/en/ko của
 *      web/src/lib/chu.ts (chu(ngonNgu), THUONG_HIEU) và dich(ngonNgu, {…}),
 *      và KHÔNG báo nhầm cặp nhãn / huy hiệu / nút mà đầu dinh-chu.mjs nói bỏ qua.
 *   2. Mọi file .astro của trang công khai — tự tìm, trang mới tự được quét —
 *      không có chỗ dính nào, ở cả ba thứ tiếng.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { timChoDinh } from './dinh-chu.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB = join(__dirname, '..', '..', 'web', 'src');

const { chu, THUONG_HIEU, PHAP_NHAN } = await import(pathToFileURL(join(WEB, 'lib', 'chu.ts')).href);

let dat = 0, hong = 0;
const loi = [];

function ok(ten, dieuKien, chiTiet = '') {
  if (dieuKien) { dat++; console.log(`  \x1b[32m✓\x1b[0m ${ten}`); }
  else {
    hong++; loi.push(ten + (chiTiet ? ` — ${chiTiet}` : ''));
    console.log(`  \x1b[31m✗ ${ten}\x1b[0m${chiTiet ? ` — ${chiTiet}` : ''}`);
  }
}

async function nhom(ten, fn) {
  console.log(`\n\x1b[1m${ten}\x1b[0m`);
  try { await fn(); }
  catch (e) { ok(`${ten} chạy được đến cuối`, false, e.message); }
}

const inRa = ds => ds.map(x => `${x.dong} [${x.nn}] «${x.mau.replace(/\s+/g, ' ')}»`).join(' | ') || 'không báo chỗ nào';
const theoTieng = ds => Object.fromEntries(['vi', 'en', 'ko'].map(nn => [nn, ds.filter(x => x.nn === nn)]));
/** Mẫu bộ dò in ra cho hai mẩu a | b (30 ký tự mỗi bên). */
const mauCua = (a, b) => `${a.slice(-30)}|${b.slice(0, 30)}`;

console.log('\x1b[1m\nBEEFTOWN — CHỮ DÍNH NHAU VÌ XUỐNG DÒNG TRÊN TRANG CÔNG KHAI\x1b[0m');
console.log('='.repeat(60));

// ===========================================================================
await nhom('1 · BỘ DÒ BẮT ĐÚNG MẪU LỖI, KHÔNG BÁO NHẦM', async () => {
  const DAU = `---
import { THUONG_HIEU, chu, dich } from '../lib/chu';
import { namVn } from '../lib/gio-vn';
const { ngonNgu } = Astro.props;
const t = chu(ngonNgu);
---
`;

  // Đúng đoạn chân trang của web/src/layouts/Trang.astro trước khi sửa.
  const chanTrangCu = await timChoDinh(`${DAU}<footer class="chan-trang">
  <div class="khung chan-hang">
    <span>
      © {namVn()} {t.banQuyen} ·
      <span lang="en">{THUONG_HIEU.descriptor}</span>
    </span>
    <a href="/quyen-rieng-tu">{t.quyenRiengTu}</a>
  </div>
</footer>
`);
  const tt = theoTieng(chanTrangCu);
  ok('Chân trang cũ "© … Beeftown ·⏎<span>Beef Specialty Restaurant</span>" bị báo ở cả vi, en và ko',
     ['vi', 'en', 'ko'].every(nn => tt[nn].length === 1 && tt[nn][0].mau.endsWith(`·|${THUONG_HIEU.descriptor}`))
       && chanTrangCu.length === 3,
     inRa(chanTrangCu));
  ok('Chỗ báo của chân trang cũ là dòng có <span lang="en">',
     chanTrangCu.length > 0 && chanTrangCu.every(x => x.dong === DAU.split('\n').length + 4), inRa(chanTrangCu));

  const chanTrangMoi = await timChoDinh(`${DAU}<footer class="chan-trang">
  <div class="khung chan-hang">
    <span>© {namVn()} {t.banQuyen} · <span lang="en">{THUONG_HIEU.descriptor}</span></span>
    <a href="/quyen-rieng-tu">{t.quyenRiengTu}</a>
  </div>
</footer>
`);
  ok('Chân trang viết trên một dòng: không báo', chanTrangMoi.length === 0, inRa(chanTrangMoi));

  // Dòng pháp nhân của chân trang hiện nay: <span class="lien"> chỉ giữ chữ không gãy, vẫn là chữ.
  const phapNhan = await timChoDinh(`---
import { PHAP_NHAN, chu } from '../lib/chu';
const t = chu(ngonNgu);
---
<p class="chan-dong"><span class="lien" lang="vi">{PHAP_NHAN.ten}</span> ·
  <span class="lien">{t.maSoThue}: {PHAP_NHAN.maSoThue}</span></p>
`);
  const pn = theoTieng(phapNhan);
  ok('Dòng pháp nhân tách "·⏎<span class="lien">": bị báo ở vi, en, ko, đọc đúng nhãn mã số thuế',
     ['vi', 'en', 'ko'].every(nn => pn[nn].length === 1
       && pn[nn][0].mau === mauCua(' ·', `${chu(nn).maSoThue}: ${PHAP_NHAN.maSoThue}`)),
     inRa(phapNhan));

  // <div> cũng là dòng chữ khi chữ trộn với thẻ chữ.
  const divTron = await timChoDinh(`${DAU}<div class="ghi-chu">
  Mở cửa
  <strong>{t.moCuaTu}</strong>
</div>
`);
  ok('<div> có chữ trộn với <strong> ở dòng dưới: bị báo', divTron.length === 3, inRa(divTron));

  // <span> trơn ngay sau chữ trong <p> — như trang xóa dữ liệu tiếng Hàn từng viết.
  const spanSauChu = await timChoDinh(`${DAU}<p>Messenger에서 Beeftown 페이지로
  <span lang="vi">xóa dữ liệu</span>(데이터 삭제)라고 보내 주세요.</p>
`);
  ok('<p> có chữ rồi <span lang="vi"> ở dòng dưới: bị báo',
     spanSauChu.length === 3 && spanSauChu.every(x => x.mau === mauCua('Messenger에서 Beeftown 페이지로', 'xóa dữ liệu')),
     inRa(spanSauChu));

  // Câu của lib/chu.ts: đọc đúng giá trị từng thứ tiếng, kể cả tiếng Hàn.
  const haiCau = await timChoDinh(`${DAU}<p>{t.datBanChuaMo}
  {t.datBanChuaMoGiaiThich}</p>
`);
  const hc = theoTieng(haiCau);
  ok('{t.a}⏎{t.b} với t = chu(ngonNgu): đọc câu thật của lib/chu.ts ở vi, en, ko',
     ['vi', 'en', 'ko'].every(nn => hc[nn].length === 1
       && hc[nn][0].mau === mauCua(chu(nn).datBanChuaMo, chu(nn).datBanChuaMoGiaiThich)),
     inRa(haiCau));

  // Cùng tên khóa ở hai từ điển: t.datBan đọc từ dich() trong file, tChung.datBan từ lib/chu.ts.
  const haiTuDien = await timChoDinh(`---
import { chu, dich } from '../lib/chu';
const tChung = chu(ngonNgu);
const t = dich(ngonNgu, { datBan: { vi: '(một)', en: '(one)', ko: '(하나)' } });
---
<p>{tChung.datBan}
  {t.datBan}</p>
`);
  const htd = theoTieng(haiTuDien);
  ok('tChung = chu(…) và t = dich(…) cùng khóa datBan: mỗi biến đọc đúng từ điển của nó',
     htd.vi.length === 1 && htd.vi[0].mau === mauCua(chu('vi').datBan, '(một)')
       && htd.ko.length === 1 && htd.ko[0].mau === mauCua(chu('ko').datBan, '(하나)'),
     inRa(haiTuDien));

  const dichBaTieng = await timChoDinh(`---
import { dich } from '../lib/chu';
const t = dich(ngonNgu, {
  a: { vi: 'Câu một.', en: 'One.', ko: '하나.' },
  b: { vi: 'Câu hai.', en: 'Two.', ko: '둘.' },
});
---
<p>{t.a}
  {t.b}</p>
`);
  const dbt = theoTieng(dichBaTieng);
  ok('Từ điển dich(ngonNgu, { vi, en, ko }) trong file: xét cả bản tiếng Hàn',
     dbt.vi[0]?.mau === 'Câu một.|Câu hai.' && dbt.en[0]?.mau === 'One.|Two.' && dbt.ko[0]?.mau === '하나.|둘.'
       && dichBaTieng.length === 3,
     inRa(dichBaTieng));

  // Từ điển chỉ có { vi, en } (kho, nội bộ): không chạy thêm lượt tiếng Hàn.
  const haiTieng = await timChoDinh(`---
const t = { a: { vi: 'Một.', en: 'One.' }, b: { vi: 'Hai.', en: 'Two.' } };
---
<p>{t.a}
  {t.b}</p>
`);
  ok('Từ điển { vi, en } của kho / nội bộ: chỉ báo vi và en, như trước',
     haiTieng.length === 2 && haiTieng.every(x => x.nn !== 'ko'), inRa(haiTieng));

  // Những cặp đầu dinh-chu.mjs nói KHÔNG phải dòng chữ.
  const KHONG_BAO = {
    'Cặp nhãn <span>/<small> trong <label>': `<label>
  <span>{t.hoTen}</span>
  <small>{t.goiY}</small>
  <input name="ho_ten" />
</label>`,
    'Nhãn chữ trong <label> rồi <small> ở dòng dưới': `<label>Họ tên
  <small>(không bắt buộc)</small>
  <input name="ho_ten" />
</label>`,
    'Hai huy hiệu cạnh nhau trong <div>': `<div class="hang">
  <span class="huy-hieu">Mới</span>
  <span class="huy-hieu">Đã duyệt</span>
</div>`,
    'Hai nút cạnh nhau': `<div class="nut-hang">
  <button type="submit">Lưu</button>
  <button type="button">Hủy</button>
</div>`,
    '<div> flex: chữ và <span> là hai ô riêng': `<div style="display:flex; gap:8px">
  Tổng
  <span>{tong}</span>
</div>`,
    '<div> có chữ rồi một khối <p>': `<div>
  Ghi chú
  <p>{t.ghiChu}</p>
</div>`,
    '<span> trơn làm ô bố cục trong hàng <li> (không có chữ bên cạnh)': `<li>
  <span>
    <strong>{t.ten}</strong>
    <small>{t.chiTiet}</small>
  </span>
  <a class="nb-nut phu" href="/xem">Xem</a>
</li>`,
    'Huy hiệu <span class style> sau chữ trong <strong>': `<strong>
  Bắt buộc nhập
  {batBuoc && <span class="nb-nhan cho" style="margin-left:.5rem">Chủ nhà hàng</span>}
</strong>`,
    'Hai liên kết dạng nút <a class="nb-nut"> trong <p>': `<p>
  <a class="nb-nut" href="/a">Một</a>
  <a class="nb-nut" href="/b">Hai</a>
</p>`,
  };
  for (const [ten, mau] of Object.entries(KHONG_BAO)) {
    const ra = await timChoDinh(`${DAU}${mau}\n`);
    ok(`Không báo nhầm: ${ten}`, ra.length === 0, inRa(ra));
  }
});

// ===========================================================================
await nhom('2 · MỌI TRANG CÔNG KHAI KHÔNG CÓ CHỮ DÍNH (vi, en, ko)', async () => {
  // Tự tìm: thêm trang công khai mới là tự được quét. Kho và nội bộ có test riêng
  // (test-kho-tieng-anh.mjs nhóm 4, test-noi-bo-tieng-anh.mjs).
  const astroTrong = thu => readdirSync(join(WEB, thu))
    .filter(f => f.endsWith('.astro')).sort().map(f => `${thu}/${f}`);
  const TEP = [
    'layouts/Trang.astro',
    ...astroTrong('components'),
    ...astroTrong('pages'),
    ...astroTrong('pages/en'),
    ...astroTrong('pages/ko'),
  ];
  for (const [thu, toiThieu] of [['components/', 4], ['pages/', 5], ['pages/en/', 5], ['pages/ko/', 5]]) {
    const n = TEP.filter(f => f.startsWith(thu) && !f.slice(thu.length).includes('/')).length;
    ok(`Tìm thấy file .astro công khai trong ${thu} (${n})`, n >= toiThieu, `chỉ ${n} file — thư mục đổi chỗ?`);
  }

  for (const f of TEP) {
    const ra = await timChoDinh(readFileSync(join(WEB, f), 'utf8'));
    ok(`${f}: không có hai mẩu chữ dính nhau vì xuống dòng`, ra.length === 0,
       `${inRa(ra.slice(0, 4))} — viết hai mẩu trên cùng dòng, cách một dấu cách, hoặc thêm {' '}`);
  }
});

console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA CHỮ DÍNH TRÊN TRANG CÔNG KHAI ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
process.exit(hong === 0 ? 0 : 1);
