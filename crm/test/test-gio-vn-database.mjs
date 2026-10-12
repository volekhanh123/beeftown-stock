/**
 * BEEFTOWN — ĐỒNG HỒ GIẢ PHÍA DATABASE (datGioDatabase / traGioDatabase trong kho-chung.mjs)
 * ==========================================================================================
 *
 *     node test/test-gio-vn-database.mjs
 *
 * hom_nay_vn(), bay_gio_vn(), gio_vn() đọc now() thẳng, nên trước đây kiểm thử chỉ thử được mốc
 * 23:50 / 00:10 giờ VN ở phía web (dong-ho-gia.mjs) — phía SQL luôn chạy theo giờ thật của máy.
 * File này kiểm chính đồng hồ giả: ba hàm trả đúng giờ VN ở hai bên nửa đêm, nghiệp vụ gọi qua
 * chúng (lich_trong_theo_ngay — khung giờ đã qua) đổi theo, và trả giờ thật đặt lại y nguyên.
 */

import { dungDatabase, taoBoDem, datGioDatabase, traGioDatabase } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — ĐỒNG HỒ GIẢ PHÍA DATABASE');
const { db, cnA, duoiAnon } = await dungDatabase();

const motDong = async sql => (await db.query(sql)).rows[0];
const gioVn = async () => motDong(`select hom_nay_vn()::text as ngay, gio_vn()::text as gio, bay_gio_vn()::text as luc`);
/** Khung giờ của chi nhánh A trong ngày p_ngay: Map 'HH:MM' → da_qua. */
async function daQua(ngay) {
  const { rows } = await db.query(`select gio::text, da_qua from lich_trong_theo_ngay($1, $2)`, [cnA.id, ngay]);
  return new Map(rows.map(r => [r.gio.slice(0, 5), r.da_qua]));
}
const dinhNghia = async () => (await db.query(
  `select string_agg(pg_get_functiondef(p.oid), E'\n' order by p.proname) as dn from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('bay_gio_vn', 'hom_nay_vn', 'gio_vn')`)).rows[0].dn;

const dinhNghiaThat = await dinhNghia();

await nhom('1 · 23:50 GIỜ VN (16:50 UTC) — VẪN LÀ HÔM NAY', async () => {
  await datGioDatabase(db, '2026-10-12T16:50:00Z');
  const g = await gioVn();
  ok('hom_nay_vn() = 2026-10-12', g.ngay === '2026-10-12', g.ngay);
  ok('gio_vn() = 23:50:00', g.gio === '23:50:00', g.gio);
  ok('bay_gio_vn() = 2026-10-12 23:50:00', g.luc === '2026-10-12 23:50:00', g.luc);
  const homNay = await daQua('2026-10-12'), maiKia = await daQua('2026-10-13');
  ok(`Mọi khung giờ hôm nay (${homNay.size}) đã qua`, homNay.size > 0 && [...homNay.values()].every(Boolean));
  ok('Không khung giờ nào của ngày mai đã qua', maiKia.size > 0 && [...maiKia.values()].every(v => !v));
});

await nhom('2 · 00:10 GIỜ VN (17:10 UTC) — ĐÃ SANG NGÀY MỚI DÙ NGÀY UTC CÒN LÀ HÔM QUA', async () => {
  await datGioDatabase(db, '2026-10-12T17:10:00Z');
  const g = await gioVn();
  ok('hom_nay_vn() = 2026-10-13', g.ngay === '2026-10-13', g.ngay);
  ok('gio_vn() = 00:10:00', g.gio === '00:10:00', g.gio);
  const homQua = await daQua('2026-10-12'), homNay = await daQua('2026-10-13');
  // Theo ngày UTC (12/10, 17:10) thì khung 18:00 ngày 12/10 còn chưa tới — lỗi múi giờ lộ ra đúng ở đây.
  ok('Khung 18:00 ngày 12/10 đã qua (theo ngày UTC thì chưa)', homQua.get('18:00') === true, String(homQua.get('18:00')));
  ok('Mọi khung giờ ngày 12/10 đã qua', homQua.size > 0 && [...homQua.values()].every(Boolean));
  ok('Không khung giờ nào hôm nay (13/10) đã qua lúc 00:10', homNay.size > 0 && [...homNay.values()].every(v => !v));
});

await nhom('3 · GIỮA BUỔI TRƯA — CHỈ KHUNG ĐÃ QUA BỊ ĐÁNH DẤU', async () => {
  await datGioDatabase(db, Date.parse('2026-10-12T04:30:00Z'));   // 11:30 giờ VN, truyền dạng số mili-giây
  const hom = await daQua('2026-10-12');
  ok('11:00 và 11:30 đã qua, 12:00 chưa', hom.get('11:00') === true && hom.get('11:30') === true && hom.get('12:00') === false,
     JSON.stringify(Object.fromEntries([...hom].slice(0, 3))));
  // Trang công khai hỏi lịch theo mã chi nhánh dưới vai anon (lich_trong_theo_ma, security definer): đồng hồ giả
  // nằm trong thân hàm nên áp cho mọi vai, mọi đường gọi.
  const { rows, loi } = await duoiAnon(`select gio::text, da_qua from lich_trong_theo_ma('q1', '2026-10-12')`);
  ok('Dưới vai anon (lich_trong_theo_ma) cũng thấy 11:30 đã qua', !loi && rows?.find(r => r.gio.startsWith('11:30'))?.da_qua === true, loi ?? '');
});

await nhom('4 · TRẢ GIỜ THẬT', async () => {
  await traGioDatabase(db);
  ok('Định nghĩa ba hàm y nguyên như trước khi giả', (await dinhNghia()) === dinhNghiaThat);
  // Ngày VN tính ở Node trước và sau câu hỏi — lượt chạy vắt qua nửa đêm VN thì chấp nhận cả hai.
  const vnJs = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const truoc = vnJs(), g = await gioVn(), sau = vnJs();
  ok('hom_nay_vn() lại là ngày VN thật', g.ngay === truoc || g.ngay === sau, `${g.ngay} — Node: ${truoc}`);
  await traGioDatabase(db);
  ok('Trả giờ hai lần không hỏng gì', (await dinhNghia()) === dinhNghiaThat);
  let loi = null;
  try { await datGioDatabase(db, 'không phải thời điểm'); } catch (e) { loi = e.message; }
  ok('Thời điểm không đọc được → báo lỗi, không đặt bừa', /không hợp lệ/.test(loi ?? ''), loi ?? 'không báo lỗi');
  ok('…và không đổi định nghĩa nào', (await dinhNghia()) === dinhNghiaThat);
});

process.exit(ketThuc('ĐỒNG HỒ GIẢ PHÍA DATABASE'));
