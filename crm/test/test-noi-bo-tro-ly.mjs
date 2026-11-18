/**
 * BEEFTOWN — /noi-bo/tro-ly: SỔ HỌC CỦA TRANG (lib/tro-ly-noi-bo.ts trên database thật, 0126)
 * ===========================================================================================
 *
 *     node test/test-noi-bo-tro-ly.mjs
 *
 * Màn duyệt sổ học: câu Trang chưa biết, chủ / quản lý viết câu trả lời và duyệt; marketing chỉ xem. Theo 9 mục "xong":
 *   1. quyen — danh sách vai của trang khớp policy tro_ly_so_hoc_*; marketing, thu ngân bấm duyệt / xóa / thêm: không đổi
 *      gì và câu báo nói đúng "chỉ xem"; mục menu chỉ ba vai.
 *   2. bam-hai-lan — duyệt hai lần cùng phiên bản: lần hai báo "đã lưu" (đúng sự thật); thêm câu hai lần: "đã có".
 *   4. chu-va-so — câu trả lời còn chữ tiếng Anh, chữ cấm, số tiền thì không lưu (máy kiểm của Trang); chữ có dấu nguyên vẹn.
 *   5. mat-mang — client ném lỗi giữa chừng: không bao giờ "đã …".
 *   7. cau-chu — mọi câu báo đủ vi / en, bản tiếng Anh không lẫn chữ Việt.
 *   3, 6, 8, 9 — không áp dụng (không giờ, không kho, migration ở test-tro-ly-trang.mjs, không dịch vụ ngoài).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, taoClientPg, UID } from './kho-chung.mjs';
import { VIET } from './quet-chu-viet.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nap = (...p) => import(pathToFileURL(join(GOC, ...p)).href);
const TL = await nap('web', 'src', 'lib', 'tro-ly-noi-bo.ts');
const { MUC_NOI_BO } = await nap('web', 'src', 'lib', 'dieu-huong-noi-bo.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — /noi-bo/tro-ly: SỔ HỌC CỦA TRANG');
const { db, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });
const form = o => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
const cau = async hoi => (await db.query(`select * from tro_ly_so_hoc where hoi = $1`, [hoi])).rows[0];
const gio = async hoi => {
  const r = await cau(hoi);
  return r ? new Date(r.updated_at).toISOString() : '';
};

await nhom('1 · QUYỀN: vai của trang khớp policy, menu chỉ ba vai', async () => {
  const pl = Object.fromEntries((await db.query(`select policyname, qual, with_check from pg_policies where tablename = 'tro_ly_so_hoc'`)).rows
    .map(r => [r.policyname, `${r.qual ?? ''} ${r.with_check ?? ''}`]));
  const vaiTrong = s => [...String(s).matchAll(/'([a-z_]+)'::vai_tro/g)].map(m => m[1]).sort();
  ok('VAI_XEM_SO_HOC = policy tro_ly_so_hoc_doc', JSON.stringify([...TL.VAI_XEM_SO_HOC].sort()) === JSON.stringify(vaiTrong(pl.tro_ly_so_hoc_doc)), pl.tro_ly_so_hoc_doc);
  for (const p of ['tro_ly_so_hoc_them', 'tro_ly_so_hoc_sua', 'tro_ly_so_hoc_xoa']) {
    ok(`VAI_SUA_SO_HOC = policy ${p}`, JSON.stringify([...TL.VAI_SUA_SO_HOC].sort()) === JSON.stringify([...new Set(vaiTrong(pl[p]))].sort()), pl[p]);
  }
  const muc = MUC_NOI_BO.find(m => m.ma === 'tro_ly');
  ok('Menu nội bộ: mục "Trợ lý Trang" → /noi-bo/tro-ly, đúng ba vai xem', muc?.link === '/noi-bo/tro-ly'
    && JSON.stringify([...muc.vai].sort()) === JSON.stringify([...TL.VAI_XEM_SO_HOC].sort()));
  const trang = readFileSync(join(GOC, 'web', 'src', 'pages', 'noi-bo', 'tro-ly.astro'), 'utf8');
  ok('Trang đưa vai khác về /noi-bo và chỉ dựng ô sửa cho VAI_SUA_SO_HOC', /VAI_XEM_SO_HOC\.includes\(nhanSu\.vai_tro\)\) return Astro\.redirect\('\/noi-bo'/.test(trang)
    && /const duocSua = VAI_SUA_SO_HOC\.includes/.test(trang) && /\{duocSua && /.test(trang));
});

await nhom('2 · ĐỌC SỔ HỌC: câu ghi sẵn, ba nhóm, marketing đọc được, thu ngân không', async () => {
  const ds = await TL.docSoHoc(clientCua(UID.chu));
  ok('Chủ đọc 6 câu ghi sẵn: 5 đã học, 1 chờ trả lời', ds.length === 6 && ds.filter(x => x.trang_thai === 'da_duyet').length === 5
    && ds.filter(x => x.trang_thai === 'cho_tra_loi').length === 1, JSON.stringify(ds.map(x => x.trang_thai)));
  ok('Marketing đọc được', (await TL.docSoHoc(clientCua(UID.mktA))).length === 6);
  ok('Thu ngân: 0 câu (RLS)', (await TL.docSoHoc(clientCua(UID.thuNganA))).length === 0);
});

await nhom('3 · VIẾT VÀ DUYỆT: máy kiểm của Trang chặn chữ nước ngoài, chữ cấm, số tiền', async () => {
  const hoi = 'Quán mở cửa mấy giờ?';
  const id = (await cau(hoi)).id;
  for (const [ten, dap, mau] of [
    ['chữ tiếng Anh', 'Dạ quán mở từ 11h, ok anh', /ok/],
    ['số tiền', 'Dạ phí giao 30.000đ ạ', /Số tiền|Giá tiền/],
    ['chữ "rẻ"', 'Dạ giờ này quán bán rẻ ạ', /rẻ/],
    ['trống', '   ', /Viết câu trả lời/],
  ]) {
    const kq = await TL.suaCau(clientCua(UID.chu), form({ viec: 'duyet', id, phien_ban: await gio(hoi), dap }), 'vi');
    ok(`Câu trả lời có ${ten} → không lưu, nói lý do`, kq.ok === false && mau.test(kq.cau) && (await cau(hoi)).trang_thai === 'cho_tra_loi', kq.cau);
  }
  const phien = await gio(hoi);
  const dap = 'Dạ quán mở cửa từ 11 giờ trưa đến 23 giờ ạ.';
  const kq = await TL.suaCau(clientCua(UID.qlA), form({ viec: 'duyet', id, phien_ban: phien, dap }), 'vi');
  ok('Quản lý duyệt → "đã lưu và duyệt", dòng thành da_duyet, chữ có dấu nguyên vẹn', kq.ok && /Đã lưu và duyệt/.test(kq.cau)
    && (await cau(hoi)).trang_thai === 'da_duyet' && (await cau(hoi)).dap === dap, kq.cau);
  const lan2 = await TL.suaCau(clientCua(UID.qlA), form({ viec: 'duyet', id, phien_ban: phien, dap }), 'vi');
  ok('Bấm đúp (cùng phiên bản cũ, cùng chữ) → vẫn "đã lưu", không báo người khác sửa', lan2.ok && /Đã lưu và duyệt/.test(lan2.cau), lan2.cau);
  const khac = await TL.suaCau(clientCua(UID.chu), form({ viec: 'duyet', id, phien_ban: phien, dap: 'Dạ khác ạ.' }), 'vi');
  ok('Phiên bản cũ, chữ khác → "người khác vừa sửa", không ghi đè', !khac.ok && khac.banMoi === true && (await cau(hoi)).dap === dap, khac.cau);
  const boHoc = await TL.suaCau(clientCua(UID.chu), form({ viec: 'bo_hoc', id, phien_ban: await gio(hoi) }), 'vi');
  ok('Bỏ học → về chờ duyệt, giữ câu trả lời', boHoc.ok && (await cau(hoi)).trang_thai === 'cho_duyet' && (await cau(hoi)).dap === dap, boHoc.cau);
  const nhap = await TL.suaCau(clientCua(UID.chu), form({ viec: 'nhap', id, phien_ban: await gio(hoi), dap: 'Dạ quán mở cửa từ 11 giờ ạ.' }), 'vi');
  ok('Lưu nháp → chờ duyệt, Trang chưa dùng', nhap.ok && /Chờ duyệt/.test(nhap.cau) && (await cau(hoi)).trang_thai === 'cho_duyet', nhap.cau);
});

await nhom('4 · MARKETING CHỈ XEM: bấm gì cũng không đổi, câu báo nói đúng', async () => {
  const hoi = 'Quán mở cửa mấy giờ?';
  const truoc = await cau(hoi);
  const kq = await TL.suaCau(clientCua(UID.mktA), form({ viec: 'duyet', id: truoc.id, phien_ban: await gio(hoi), dap: 'Dạ quán mở cửa từ 10 giờ ạ.' }), 'vi');
  ok('Marketing duyệt → "chỉ xem", không đổi', !kq.ok && kq.cau === TL.CAU.khongQuyen.vi && (await cau(hoi)).dap === truoc.dap, kq.cau);
  const xoa = await TL.xoaCau(clientCua(UID.mktA), form({ id: truoc.id }), 'vi');
  ok('Marketing xóa → không xóa, câu nói chỉ xem', !xoa.ok && !!(await cau(hoi)), xoa.cau);
  const them = await TL.themCau(clientCua(UID.mktA), form({ hoi: 'Có giao tỉnh không?', dap: '' }), 'vi');
  ok('Marketing thêm → không thêm', !them.ok && !(await cau('Có giao tỉnh không?')), them.cau);
});

await nhom('5 · THÊM, XÓA; BẤM ĐÚP NÚT THÊM', async () => {
  const chu = clientCua(UID.chu);
  const t1 = await TL.themCau(chu, form({ hoi: '  Có túi giữ lạnh không?  ', dap: 'Dạ có túi giữ lạnh ạ.' }), 'vi');
  const r = await cau('Có túi giữ lạnh không?');
  ok('Thêm câu có câu trả lời → vào thẳng "Đã học", bỏ khoảng trắng thừa', t1.ok && r?.trang_thai === 'da_duyet' && r?.nguon === 'Thêm tay ở Nội bộ', JSON.stringify(r));
  const t2 = await TL.themCau(chu, form({ hoi: 'có túi giữ lạnh không', dap: '' }), 'vi');
  ok('Thêm lần hai (khác hoa thường, dấu câu) → "đã có", không thêm', !t2.ok && t2.cau === TL.CAU.daCo.vi, t2.cau);
  const t3 = await TL.themCau(chu, form({ hoi: 'Có giao Bình Dương không?', dap: '' }), 'vi');
  ok('Thêm câu không có câu trả lời → "Chờ trả lời"', t3.ok && (await cau('Có giao Bình Dương không?'))?.trang_thai === 'cho_tra_loi');
  const x = await TL.xoaCau(chu, form({ id: r.id }), 'vi');
  ok('Chủ xóa → "đã xóa" và dòng không còn', x.ok && !(await cau('Có túi giữ lạnh không?')), x.cau);
});

await nhom('6 · MẤT MẠNG GIỮA CHỪNG: không bao giờ "đã …"', async () => {
  const hong = { from() { throw new TypeError('fetch failed'); } };
  const id = (await cau('Quán mở cửa mấy giờ?')).id;
  const a = await TL.suaCau(hong, form({ viec: 'duyet', id, phien_ban: new Date().toISOString(), dap: 'Dạ được ạ.' }), 'vi');
  const b = await TL.xoaCau(hong, form({ id }), 'vi');
  const c = await TL.themCau(hong, form({ hoi: 'Câu thử?', dap: '' }), 'vi');
  ok('Sửa, xóa, thêm khi mạng đứt → ok: false, câu "chưa lưu được"', [a, b, c].every(k => !k.ok && /Chưa lưu được/.test(k.cau)), JSON.stringify([a, b, c]));
  let ném = false;
  try { await TL.docSoHoc(hong); } catch { ném = true; }
  ok('Đọc sổ học khi mạng đứt → ném (trang báo "chưa đọc được", không hiện danh sách rỗng giả)', ném);
  const sai = await TL.suaCau(clientCua(UID.chu), form({ viec: 'xoa_het', id, phien_ban: 'x' }), 'vi');
  ok('Việc lạ, phiên bản sai → "không hiểu yêu cầu"', !sai.ok && sai.cau === TL.CAU.viecSai.vi);
});

await nhom('7 · CÂU BÁO ĐỦ vi / en, tiếng Anh không lẫn chữ Việt', async () => {
  const thieu = [], lan = [];
  for (const [k, v] of Object.entries(TL.CAU)) {
    const en = typeof v.en === 'function' ? v.en('x') : v.en;
    const vi = typeof v.vi === 'function' ? v.vi('x') : v.vi;
    if (!en || !vi) thieu.push(k);
    if (VIET.test(en)) lan.push(k);
  }
  ok('Mọi câu có vi và en', thieu.length === 0, thieu.join(', '));
  ok('Bản tiếng Anh không lẫn chữ Việt', lan.length === 0, lan.join(', '));
  const kq = await TL.suaCau(clientCua(UID.chu), form({ viec: 'duyet', id: (await cau('Quán mở cửa mấy giờ?')).id, phien_ban: await gio('Quán mở cửa mấy giờ?'), dap: 'ok' }), 'en');
  ok('Câu từ chối bằng tiếng Anh khi màn đang tiếng Anh', !kq.ok && /non-Vietnamese words: ok/.test(kq.cau), kq.cau);
});

process.exit(ketThuc('/noi-bo/tro-ly — SỔ HỌC CỦA TRANG'));
