/**
 * BEEFTOWN — NGÀY GIỜ VIỆT NAM Ở PHÍA WEB
 * =======================================
 *
 *     node test/test-gio-vn.mjs
 *
 * Việt Nam không đổi giờ mùa hè, nên "giờ VN = UTC + 7 tiếng" luôn đúng — cái khó là
 * phép cộng đó nằm rải rác nhiều chỗ, và chỉ lộ lỗi trong khung 0h–7h giờ VN, khi ngày
 * UTC còn là hôm qua. Bất biến:
 *
 *   1. Mọi hàm "hôm nay" phía web cho CÙNG ngày với hom_nay_vn() của database, ở đúng
 *      các mốc nguy hiểm (16:59:59Z / 17:00Z, giao thừa, 29/02) — dùng đồng hồ giả.
 *   2. Ô giờ người nhập / iPOS gửi mà là ngày KHÔNG CÓ THẬT (31/02, 31/04, 29/02 năm
 *      thường, 24:00, 25:99) bị từ chối ngay ở web. Trước đây JS tự "lăn" 31/02 thành
 *      03/03, hoặc chuyển nguyên chuỗi xuống database — hóa đơn iPOS giờ sai thành lỗi
 *      500 và iPOS Hub gửi lại mãi đúng hóa đơn đó.
 *   3. Năm (chân trang, "khác năm thì ghi năm") tính theo giờ VN, không theo UTC.
 *   4. Mã mới không tự cộng 7 tiếng hay lấy năm theo máy — dùng web/src/lib/gio-vn.ts.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem } from './kho-chung.mjs';
import { datGio, traGio } from './dong-ho-gia.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIB = join(GOC, 'web', 'src', 'lib');
const nap = f => import(join(LIB, f));

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — NGÀY GIỜ VIỆT NAM Ở PHÍA WEB');

// Các mốc: ngay trước / đúng lúc sang ngày mới giờ VN, giao thừa, 29/02 năm nhuận.
const MOC = [
  '2026-09-28T16:59:59.999Z', '2026-09-28T17:00:00.000Z',
  '2026-12-31T16:59:59.000Z', '2026-12-31T17:00:00.000Z',
  '2028-02-28T17:00:00.000Z', '2028-02-29T16:59:59.000Z', '2027-02-28T17:00:00.000Z',
];

// ===========================================================================
await nhom('1 · "HÔM NAY" PHÍA WEB KHỚP hom_nay_vn() CỦA DATABASE Ở MỌI MỐC', async () => {
  const { db } = await dungDatabase();
  // Lấy đúng thân hàm trong database, thay now() bằng thời điểm thử — không viết lại công thức.
  const { rows: [{ dn }] } = await db.query(`select pg_get_functiondef('hom_nay_vn()'::regprocedure) as dn`);
  const than = dn.match(/\$function\$([\s\S]*?)\$function\$/)?.[1]?.trim().replace(/;$/, '');
  ok('Đọc được thân hàm hom_nay_vn()', !!than && /now\(\)/.test(than), than);
  const ngayDb = async iso => (await db.query(
    `select (x.v)::text as d from (${than.replace(/now\(\)/g, '$1::timestamptz')}) x(v)`, [iso])).rows[0].d;

  const gioVn = await nap('gio-vn.ts');
  const cacHam = {
    'gio-vn.ts homNayVn': () => gioVn.homNayVn(),
    'noi-dung.ts homNayVn': async () => (await nap('noi-dung.ts')).homNayVn(),
    'kho/chung.ts homNayVn': async () => (await nap('kho/chung.ts')).homNayVn(),
    'messenger.ts ngayVn': async () => (await nap('messenger.ts')).ngayVn(Date.now()),
  };
  // tin-tuyen-dung.ts import kiểu Astro (không đuôi .ts) nên Node không nạp thẳng được — đọc mã: nó phải lấy lại của gio-vn.ts.
  ok('tin-tuyen-dung.ts lấy homNayVn từ gio-vn.ts',
     /export \{ homNayVn \} from '\.\/gio-vn(\.ts)?';/.test(readFileSync(join(LIB, 'tin-tuyen-dung.ts'), 'utf8')));
  for (const iso of MOC) {
    const dung = await ngayDb(iso);
    const sai = [];
    for (const [ten, ham] of Object.entries(cacHam)) {
      datGio(iso);
      try { const d = await ham(); if (d !== dung) sai.push(`${ten} = ${d}`); } finally { traGio(); }
    }
    ok(`${iso} → ${dung}: mọi hàm "hôm nay" khớp database`, sai.length === 0, sai.join(' · '));
  }
});

// ===========================================================================
await nhom('2 · NGÀY GIỜ KHÔNG CÓ THẬT BỊ TỪ CHỐI', async () => {
  const { docMocChuyen } = await nap('kho/ban-ipos.ts');
  const { gioHenSangIso } = await nap('zalo-trang.ts');
  const { docThoiDiem } = await nap('kho/ipos.ts');

  // Ô datetime-local của màn Bán hàng iPOS (mốc chuyển sang iPOS)
  for (const s of ['2026-02-31T10:00', '2026-04-31T08:30', '2025-02-29T08:00', '2026-09-28T24:00', '2026-09-28T23:60']) {
    ok(`docMocChuyen("${s}") bị từ chối`, docMocChuyen(s) === undefined, String(docMocChuyen(s)));
  }
  ok('docMocChuyen: 29/02 năm nhuận vẫn nhận', docMocChuyen('2028-02-29T08:30') === '2028-02-29T08:30:00+07:00');
  ok('docMocChuyen: 23:59:59 vẫn nhận', docMocChuyen('2026-09-28T23:59:59') === '2026-09-28T23:59:59+07:00');
  ok('docMocChuyen: trống vẫn là null', docMocChuyen('') === null);

  // Ô giờ hẹn của chiến dịch Zalo
  for (const s of ['2026-02-31T18:00', '2026-06-31T18:00', '2026-09-28T24:00']) {
    ok(`gioHenSangIso("${s}") bị từ chối`, gioHenSangIso(s) === null, String(gioHenSangIso(s)));
  }
  ok('gioHenSangIso: giờ hợp lệ vẫn nhận', gioHenSangIso('2026-09-30T18:00') === '2026-09-30T18:00:00+07:00');

  // Giờ bán iPOS gửi sang (callback) — giờ sai phải thành null để hook báo rõ lý do, không thành 500
  for (const s of ['31/02/2026 10:00', '28/09/2026 25:00', '28/09/2026 23:61', '28/13/2026 10:00',
                   '2026-02-31 10:00', '2026-02-31T10:00:00Z', '2026-02-30T10:00:00+07:00']) {
    ok(`docThoiDiem("${s}") → null`, docThoiDiem(s) === null, String(docThoiDiem(s)));
  }
  ok('docThoiDiem: DD/MM/YYYY hợp lệ', docThoiDiem('29/02/2028 23:59:59') === '2028-02-29T23:59:59+07:00');
  ok('docThoiDiem: ngày, giờ một chữ số', docThoiDiem('1/9/2026 8:05') === '2026-09-01T08:05:00+07:00');
  ok('docThoiDiem: ISO không múi giờ → +07:00', docThoiDiem('2026-09-28 10:00') === '2026-09-28T10:00:00+07:00');
  ok('docThoiDiem: ISO có múi giờ → UTC', docThoiDiem('2026-09-28T10:00:00+07:00') === '2026-09-28T03:00:00.000Z');
  ok('docThoiDiem: epoch giây', docThoiDiem(1790000000) === new Date(1790000000 * 1000).toISOString());

  // Và cả đường đi của hook: hóa đơn giờ sai → lỗi đọc rõ ràng, không phải hóa đơn
  const { phanTichHoaDon, thoiDiemBan } = await nap('kho/ipos.ts');
  const kq = phanTichHoaDon({ sale_id: 'T1', brand_id: 'BT', created_at: '2026-02-31 10:00', sale: { store_id: '1',
    date_last: '31/02/2026', hour_last: 10, minute_last: 0 }, sale_detail: [] });
  ok('Hóa đơn iPOS ngày 31/02, giờ tạo 31/02 → báo "không đọc được giờ bán", không chuyển xuống database',
     kq.loai === 'loi' && /giờ bán/.test(kq.cau), JSON.stringify(kq).slice(0, 200));
  ok('Giờ in 24:00 / phút 60 không có thật → không ghép thành giờ bán (dùng mốc khác)',
     thoiDiemBan({ sale: { date_last: 1793034000, hour_last: 24, minute_last: 0 } }) === new Date(1793034000 * 1000).toISOString()
     && thoiDiemBan({ sale: { date_last: 1793034000, hour_last: 10, minute_last: 60 } }) === new Date(1793034000 * 1000).toISOString());
});

// ===========================================================================
await nhom('3 · NĂM TÍNH THEO GIỜ VIỆT NAM', async () => {
  const { namVn, gioVnTuMs } = await nap('gio-vn.ts');
  ok('gioVnTuMs: 17:00Z là 00:00 ngày hôm sau giờ VN', gioVnTuMs(Date.parse('2026-12-31T17:00:00Z')) === '2027-01-01T00:00:00');
  ok('gioVnTuMs: mốc không hợp lệ → "" (không ném lỗi giữa lúc dựng trang)', gioVnTuMs(NaN) === '');
  const { thoiGianTruoc } = await nap('kho/viec.ts');
  ok('thoiGianTruoc: ngày cũ ghi theo ngày VN (17:30Z 30/09 → "01/10")',
     thoiGianTruoc('2026-09-30T17:30:00Z', new Date('2026-10-20T00:00:00Z')) === '01/10');
  ok('thoiGianTruoc: mốc hỏng → "—", không phải "NaN/NaN"', thoiGianTruoc('khong-phai-ngay') === '—');
  datGio('2026-12-31T17:30:00Z');   // 00:30 ngày 01/01/2027 giờ VN
  try { ok('00:30 ngày 01/01 giờ VN: năm là năm mới', namVn() === 2027, String(namVn())); } finally { traGio(); }

  const { gioVn } = await nap('zalo-trang.ts');
  // Bây giờ 08:00 01/01/2027 VN; tin lúc 03:00 cùng ngày VN (UTC còn là 2026) → cùng năm, không ghi năm
  datGio('2027-01-01T01:00:00Z');
  try {
    const s = gioVn('2026-12-31T20:00:00Z');
    ok('Tin cùng năm theo giờ VN không ghi năm (dù UTC khác năm)', !/202[67]/.test(s), s);
  } finally { traGio(); }
  // Bây giờ 00:30 01/01/2027 VN; tin lúc 20:00 31/12/2026 VN (UTC cùng năm 2026) → khác năm, phải ghi năm
  datGio('2026-12-31T17:30:00Z');
  try {
    const s = gioVn('2026-12-31T13:00:00Z');
    ok('Tin năm cũ theo giờ VN có ghi năm (dù UTC cùng năm)', /2026/.test(s), s);
  } finally { traGio(); }
});

// ===========================================================================
await nhom('4 · MÃ MỚI DÙNG gio-vn.ts, KHÔNG TỰ CỘNG 7 TIẾNG', async () => {
  const tep = [];
  const di = d => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? di(p) : /\.(ts|astro|js|mjs)$/.test(f) && tep.push(p); } };
  di(join(GOC, 'web', 'src'));
  const CAM = [
    // Mọi cách viết "+ 7 tiếng": 7 * 60 * 60 * 1000, 7 * 3600000, 7 * 3_600_000, 7 * 3600e3…
    [/\+\s*7\s*\*\s*(60\s*\*\s*60|3_?600)/, '+ 7 * 60 * 60… (tự cộng 7 tiếng) — dùng homNayVn() / gioVnTuMs() / congNgay() của gio-vn.ts'],
    [/\.get(UTC)?FullYear\(\)/, 'getFullYear() / getUTCFullYear() (năm theo máy hoặc UTC) — dùng namVn() của gio-vn.ts'],
  ];
  const sai = [];
  for (const p of tep) {
    if (p.endsWith(join('lib', 'gio-vn.ts'))) continue;
    const s = readFileSync(p, 'utf8');
    for (const [m, ly] of CAM) if (m.test(s)) sai.push(`${relative(GOC, p)}: ${ly}`);
  }
  ok(`${tep.length} file web/src không tự tính ngày / năm theo UTC`, sai.length === 0, sai.join(' | '));
});

process.exit(ketThuc('NGÀY GIỜ VIỆT NAM'));
