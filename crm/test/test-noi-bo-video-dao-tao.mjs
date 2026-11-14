/**
 * BEEFTOWN — VIDEO ĐÀO TẠO (/noi-bo/dao-tao, migration 0117)
 * ==========================================================
 *
 *     node test/test-noi-bo-video-dao-tao.mjs
 *
 * Khánh chốt 14/11/2026: video training trên YouTube chế độ "Không công khai", nhúng vào một trang chỉ nhân viên đã
 * đăng nhập mới mở được. Repo công khai, nên mã video nằm trong database (bảng video_dao_tao), không trong mã nguồn.
 *
 * Bất biến:
 *   1. Quyền: bảy vai người đang làm đọc được; anon, nhân sự đã nghỉ, tài khoản không có dòng nhan_su, tài khoản máy
 *      không đọc được. Chỉ chủ, quản lý (mọi chi nhánh — video dùng chung) thêm / sửa / xóa. Không ai đổi được mã
 *      video của một dòng hay tự ghi người thêm. Hai danh sách vai của web khớp policy.
 *   2. Ràng buộc: mã video đúng 11 ký tự, không trùng; tên, mô tả không thừa khoảng trắng, đúng độ dài.
 *   3. layMaYoutube: mọi kiểu link YouTube người ta hay dán ra đúng mã; link khác (Drive, danh sách phát, tên miền
 *      giả) → null.
 *   4. Chữ có dấu: tên gõ dạng tách dấu (macOS) lưu thành dạng dựng sẵn; đếm độ dài như Postgres.
 *   5. Thêm / sửa / xóa qua thư viện web trên database thật: bấm đúp chỉ một dòng, câu lần hai vẫn đúng sự thật;
 *      người khác vừa sửa thì không ghi đè; vai không sửa được nhận câu "không có quyền".
 *   6. Mất mạng, lỗi máy chủ, ném lỗi giữa chừng: không bao giờ báo "đã …".
 *   7. Trang: không JavaScript, khung video tải lười, form gửi đúng tên ô thư viện đọc, không mã video nào trong mã
 *      nguồn web.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, taoClientPg, UID } from './kho-chung.mjs';
import { VIET } from './quet-chu-viet.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const doc = p => readFileSync(join(GOC, p), 'utf8');

const VD = await import(pathToFileURL(join(SRC, 'lib', 'video-dao-tao.ts')).href);
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — VIDEO ĐÀO TẠO (0117)');
const { db, cnA, nsId, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const UID_LA = '00000000-0000-4000-8000-0000000000aa';       // đăng nhập Supabase, không có dòng nhan_su
const UID_MAY_ZALO = '00000000-0000-4000-8000-0000000000e1';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values ($1, $2, 'Máy Zalo', 'may_zalo', true)`,
  [UID_MAY_ZALO, cnA.id]);

const NGUOI = [
  ['Chủ', UID.chu, true, true], ['Quản lý Q1', UID.qlA, true, true], ['Quản lý Q7', UID.qlB, true, true],
  ['Thu ngân', UID.thuNganA, true, false], ['Marketing', UID.mktA, true, false], ['Thủ kho', UID.thuKhoA, true, false],
  ['NV quầy', UID.nvQuayA, true, false], ['Kế toán', UID.keToanA, true, false],
  ['Thủ kho đã nghỉ', UID.nghiViec, false, false], ['Không có nhan_su', UID_LA, false, false],
  ['Máy Zalo', UID_MAY_ZALO, false, false],
];

/** Mã YouTube giả, 11 ký tự, khác nhau theo số. */
const ma = n => `vid${String(n).padStart(8, '0')}`;
const dem = async () => (await db.query(`select count(*)::int n from video_dao_tao`)).rows[0].n;
const formTu = o => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };

// ===========================================================================
await nhom('1 · QUYỀN — ai đọc, ai ghi', async () => {
  await db.query(`insert into video_dao_tao (youtube_id, tieu_de) values ($1, 'Bài gốc')`, [ma(1)]);

  const anon = await duoiAnon(`select youtube_id from video_dao_tao`);
  ok('anon: không đọc được bảng (permission denied)', anon.loi !== null && /permission denied/.test(anon.loi), anon.loi ?? 'ĐỌC ĐƯỢC');
  const anonThem = await duoiAnon(`insert into video_dao_tao (youtube_id, tieu_de) values ('${ma(90)}', 'x')`);
  ok('anon: không thêm được', anonThem.loi !== null);

  for (const [ten, uid, docDuoc, ghiDuoc] of NGUOI) {
    // Người trước trong danh sách vừa thêm dòng của họ: so với số dòng thật lúc này.
    const tong = await dem();
    const r = await duoi(uid, `select youtube_id from video_dao_tao`);
    ok(`${ten}: ${docDuoc ? 'đọc được mọi mã video' : 'đọc 0 dòng'}`,
      r.loi === null && r.rows.length === (docDuoc ? tong : 0) && tong > 0, r.loi ?? `${r.rows.length}/${tong} dòng`);

    const so = String(100 + NGUOI.findIndex(n => n[1] === uid));
    const them = await duoi(uid, `insert into video_dao_tao (youtube_id, tieu_de) values ($1, 'Thử') returning tao_boi`, [ma(so)]);
    ok(`${ten}: ${ghiDuoc ? 'thêm được, người thêm tự điền là chính mình' : 'không thêm được (RLS)'}`,
      ghiDuoc ? them.loi === null && them.rows[0].tao_boi === nsId[uid] : them.loi !== null && them.ma === '42501',
      them.loi ?? JSON.stringify(them.rows));

    const sua = await duoi(uid, `update video_dao_tao set tieu_de = 'Đổi bởi ${ten}' where youtube_id = $1 returning id`, [ma(1)]);
    ok(`${ten}: ${ghiDuoc ? 'sửa được tên' : 'không sửa được tên (0 dòng)'}`,
      sua.loi === null && sua.rows.length === (ghiDuoc ? 1 : 0), sua.loi ?? `${sua.rows.length} dòng`);
  }

  const doiMa = await duoi(UID.chu, `update video_dao_tao set youtube_id = $1 where youtube_id = $2`, [ma(91), ma(1)]);
  ok('Chủ cũng không đổi được mã video của một dòng (quyền cột: chỉ tên, mô tả)', doiMa.loi !== null && doiMa.ma === '42501', doiMa.loi ?? 'ĐỔI ĐƯỢC');
  const giaNguoi = await duoi(UID.qlA, `insert into video_dao_tao (youtube_id, tieu_de, tao_boi) values ($1, 'x', $2)`, [ma(92), nsId[UID.chu]]);
  ok('Quản lý không tự ghi được ô người thêm (giả làm chủ)', giaNguoi.loi !== null && giaNguoi.ma === '42501', giaNguoi.loi ?? 'GHI ĐƯỢC');
  const catBang = await duoi(UID.chu, `truncate video_dao_tao`);
  ok('Không ai xóa sạch bảng bằng TRUNCATE (bỏ qua RLS)', catBang.loi !== null && catBang.ma === '42501', catBang.loi ?? 'XÓA ĐƯỢC');

  const truoc = await dem();
  const tnXoa = await duoi(UID.thuNganA, `delete from video_dao_tao where youtube_id = $1`, [ma(1)]);
  ok('Thu ngân xóa: 0 dòng, video còn nguyên', tnXoa.loi === null && (await dem()) === truoc, tnXoa.loi ?? '');
  const tkXoa = await duoi(UID.thuKhoA, `delete from video_dao_tao where youtube_id = $1`, [ma(1)]);
  ok('Thủ kho xóa: 0 dòng, video còn nguyên', tkXoa.loi === null && (await dem()) === truoc, tkXoa.loi ?? '');
  const qlbXoa = await duoi(UID.qlB, `delete from video_dao_tao where youtube_id = $1`, [ma(1)]);
  ok('Quản lý chi nhánh khác (Q7) xóa được — video dùng chung cho cả quán', qlbXoa.loi === null && (await dem()) === truoc - 1, qlbXoa.loi ?? '');

  // Hai danh sách vai của web khớp đúng policy trong database.
  const { rows: pl } = await db.query(`select policyname, cmd, coalesce(qual, with_check) as bt from pg_policies where tablename = 'video_dao_tao'`);
  const vaiCua = ten => [...(pl.find(p => p.policyname === ten)?.bt ?? '').matchAll(/'([a-z_]+)'::vai_tro/g)].map(m => m[1]).sort();
  const bang = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  ok('VAI_XEM_DAO_TAO = vai của policy video_dao_tao_doc (bảy vai người)',
    bang(VD.VAI_XEM_DAO_TAO, vaiCua('video_dao_tao_doc')) && VD.VAI_XEM_DAO_TAO.length === 7, vaiCua('video_dao_tao_doc').join(', '));
  for (const ten of ['video_dao_tao_them', 'video_dao_tao_sua', 'video_dao_tao_xoa']) {
    ok(`VAI_SUA_DAO_TAO = vai của policy ${ten} (chủ, quản lý)`, bang(VD.VAI_SUA_DAO_TAO, vaiCua(ten)), vaiCua(ten).join(', '));
  }
  ok('Bốn policy, đủ bốn lệnh (đọc, thêm, sửa, xóa)', pl.length === 4 && bang(pl.map(p => p.cmd), ['SELECT', 'INSERT', 'UPDATE', 'DELETE']),
    pl.map(p => `${p.policyname}:${p.cmd}`).join(', '));
  await db.query(`delete from video_dao_tao`);
});

// ===========================================================================
await nhom('2 · RÀNG BUỘC CỦA BẢNG', async () => {
  const thu = async (youtube, tieuDe, moTa = null) => {
    try { await db.query(`insert into video_dao_tao (youtube_id, tieu_de, mo_ta) values ($1, $2, $3)`, [youtube, tieuDe, moTa]); return null; }
    catch (e) { return e.code ?? e.message; }
  };
  ok('Mã 10 ký tự: từ chối', (await thu('abcdefghij', 'x')) === '23514');
  ok('Mã có dấu cách: từ chối', (await thu('abcde fghij', 'x')) === '23514');
  ok('Mã có ký tự lạ ("<"): từ chối', (await thu('abcdefghij<', 'x')) === '23514');
  ok('Tên có khoảng trắng đầu: từ chối (web đã cắt trước khi gửi)', (await thu(ma(201), ' Bài 1')) === '23514');
  ok('Tên rỗng: từ chối', (await thu(ma(202), '')) === '23514');
  ok('Tên 151 ký tự: từ chối', (await thu(ma(203), 'a'.repeat(151))) === '23514');
  ok('Tên đúng 150 ký tự: nhận', (await thu(ma(204), 'a'.repeat(150))) === null);
  ok('Mô tả là chuỗi rỗng: từ chối (không có thì để null)', (await thu(ma(205), 'x', '')) === '23514');
  ok('Mô tả 1.001 ký tự: từ chối', (await thu(ma(206), 'x', 'a'.repeat(1001))) === '23514');
  ok('Mã có gạch dưới, gạch nối: nhận', (await thu('a_b-c_d-e_f', 'x')) === null);
  ok('Cùng mã lần hai: trùng (23505)', (await thu('a_b-c_d-e_f', 'y')) === '23505');
  ok('Mã phân biệt hoa thường (YouTube cũng vậy): A_b-c_d-e_f là video khác', (await thu('A_b-c_d-e_f', 'z')) === null);
  await db.query(`delete from video_dao_tao`);
});

// ===========================================================================
await nhom('3 · layMaYoutube — link người ta hay dán', async () => {
  const M = 'dQw4w9WgXcQ';
  const DUNG = [
    `https://youtu.be/${M}`, `https://youtu.be/${M}?si=AbCdEf123`, `youtu.be/${M}`, `http://youtu.be/${M}`,
    `https://www.youtube.com/watch?v=${M}`, `https://www.youtube.com/watch?v=${M}&t=30s`,
    `https://www.youtube.com/watch?feature=share&v=${M}`, `https://m.youtube.com/watch?v=${M}`, `youtube.com/watch?v=${M}`,
    `https://www.youtube.com/shorts/${M}`, `https://www.youtube.com/embed/${M}?rel=0`, `https://www.youtube.com/live/${M}?feature=share`,
    `https://www.youtube-nocookie.com/embed/${M}`, `https://studio.youtube.com/video/${M}/edit`, `https://WWW.YOUTUBE.COM/watch?v=${M}`,
    M, `  ${M}  `, `\n${`https://youtu.be/${M}`}\n`,
  ];
  for (const s of DUNG) ok(`"${s.trim()}" → ${M}`, VD.layMaYoutube(s) === M, String(VD.layMaYoutube(s)));
  const SAI = [
    '', '   ', null, undefined, 42, 'dQw4w9WgXc', 'dQw4w9WgXcQQ', `https://drive.google.com/file/d/${M}/view`,
    'https://www.youtube.com/playlist?list=PL1234567890', 'https://www.youtube.com/@beeftown', 'https://www.youtube.com/watch',
    `https://evil.example/watch?v=${M}`, `https://youtube.com.evil.example/watch?v=${M}`, `https://youtu.be.evil.example/${M}`,
    `javascript:alert('${M}')`, `ftp://youtu.be/${M}`, `https://www.youtube.com/watch?v=${M.slice(0, 10)}%22`,
    `https://studio.youtube.com/channel/${M}`, `https://youtu.be/${M}`.padEnd(600, 'x'),
  ];
  for (const s of SAI) ok(`${JSON.stringify(s)?.slice(0, 70)} → null`, VD.layMaYoutube(s) === null, String(VD.layMaYoutube(s)));
  ok('Link nhúng: tên miền không cookie, rel=0', VD.linkNhungYoutube(M) === `https://www.youtube-nocookie.com/embed/${M}?rel=0`);
});

// ===========================================================================
await nhom('4 · CHỮ CÓ DẤU — dạng dựng sẵn, đếm như Postgres', async () => {
  const tach = 'Bài 1 — Đón khách'.normalize('NFD');
  ok('Tên gõ dạng tách dấu (macOS) → dạng dựng sẵn', VD.lamSachTieuDe(tach) === 'Bài 1 — Đón khách'.normalize('NFC')
    && VD.lamSachTieuDe(tach) !== tach);
  ok('Tên: dấu cách thừa, xuống dòng gom lại thành một dấu cách', VD.lamSachTieuDe('  Bài 2\n\n  Cắt   thịt ') === 'Bài 2 Cắt thịt');
  ok('Mô tả: giữ xuống dòng, đổi \\r\\n thành \\n, cắt hai đầu', VD.lamSachMoTa(' Dòng một\r\nDòng hai \n') === 'Dòng một\nDòng hai');
  ok('Mô tả chỉ khoảng trắng → null', VD.lamSachMoTa('  \n ') === null && VD.lamSachMoTa(undefined) === null);

  const chu = clientCua(UID.chu);
  const bo150 = '🥩'.repeat(150);
  const r = await VD.themVideo(chu, formTu({ link: ma(301), tieu_de: bo150 }), 'vi');
  ok('150 ký tự emoji (300 đơn vị UTF-16) vẫn là 150 ký tự — web nhận, database nhận', r.ok, r.cau);
  const r2 = await VD.themVideo(chu, formTu({ link: ma(302), tieu_de: bo150 + '🥩' }), 'vi');
  ok('151 ký tự: web từ chối trước khi gửi, câu nói đúng giới hạn', !r2.ok && /150 ký tự/.test(r2.cau) && (await dem()) === 1, r2.cau);
  const ten = 'Bài 3 — Đặt bàn, gọi xác nhận "đúng giờ"';
  const r3 = await VD.themVideo(chu, formTu({ link: ma(303), tieu_de: ten.normalize('NFD') }), 'vi');
  const { rows: [luu] } = await db.query(`select tieu_de from video_dao_tao where youtube_id = $1`, [ma(303)]);
  ok('Tên có dấu và ngoặc kép lưu đúng từng chữ (dạng dựng sẵn)', r3.ok && luu?.tieu_de === ten.normalize('NFC'), luu?.tieu_de);
  await db.query(`delete from video_dao_tao`);
});

// ===========================================================================
await nhom('5 · THÊM, SỬA, XÓA QUA THƯ VIỆN WEB — bấm đúp, người khác sửa, không quyền', async () => {
  const chu = clientCua(UID.chu), ql = clientCua(UID.qlA), tn = clientCua(UID.thuNganA), tk = clientCua(UID.thuKhoA);
  const LINK = 'https://youtu.be/AbCdEfGhIjK?si=x';

  const a = await VD.themVideo(chu, formTu({ link: LINK, tieu_de: 'Bài 1', mo_ta: 'Xem trước ca đầu.' }), 'vi');
  ok('Chủ thêm: "Đã thêm …" chỉ sau khi database trả id', a.ok && a.cau === 'Đã thêm "Bài 1" vào danh sách.', a.cau);
  const b = await VD.themVideo(chu, formTu({ link: LINK, tieu_de: 'Bài 1', mo_ta: 'Xem trước ca đầu.' }), 'vi');
  ok('Bấm đúp nút Thêm: lần hai nói "đã có trong danh sách", vẫn đúng MỘT dòng',
    !b.ok && b.cau === 'Video này đã có trong danh sách.' && (await dem()) === 1, `${b.cau} · ${await dem()} dòng`);
  const bEn = await VD.themVideo(chu, formTu({ link: LINK, tieu_de: 'Lesson 1' }), 'en');
  ok('…bản tiếng Anh', bEn.cau === 'This video is already in the list.', bEn.cau);

  const c = await VD.themVideo(tn, formTu({ link: 'https://youtu.be/ZZZZZZZZZZZ', tieu_de: 'Bài thu ngân' }), 'vi');
  ok('Thu ngân thêm: "chỉ chủ và quản lý", không dòng nào', !c.ok && /Chỉ chủ nhà hàng và quản lý/.test(c.cau) && (await dem()) === 1, c.cau);
  const d = await VD.themVideo(chu, formTu({ link: 'https://drive.google.com/file/d/abc/view', tieu_de: 'Bài Drive' }), 'vi');
  ok('Link Google Drive: câu chỉ cách dán link YouTube, không dòng nào', !d.ok && /youtu\.be/.test(d.cau) && (await dem()) === 1, d.cau);
  const e = await VD.themVideo(chu, formTu({ link: 'https://youtu.be/YYYYYYYYYYY', tieu_de: '   ' }), 'vi');
  ok('Tên chỉ khoảng trắng: "Ghi tên video."', !e.ok && e.cau === 'Ghi tên video.', e.cau);

  const [v] = await VD.docDanhSachVideo(chu);
  ok('docDanhSachVideo: đọc lại đúng mã, tên, mô tả, có phiên bản',
    v?.youtube_id === 'AbCdEfGhIjK' && v.tieu_de === 'Bài 1' && v.mo_ta === 'Xem trước ca đầu.' && !!v.updated_at, JSON.stringify(v));
  const dsKho = await VD.docDanhSachVideo(tk);
  ok('Thủ kho đọc được danh sách qua thư viện web', dsKho.length === 1);

  // Sửa: phiên bản đúng → lưu; bấm đúp (phiên bản cũ, cùng chữ) → "đã lưu"; người khác vừa sửa → không ghi đè.
  const s1 = await VD.suaVideo(ql, formTu({ id: v.id, phien_ban: v.updated_at, tieu_de: 'Bài 1 — Đón khách', mo_ta: '' }), 'vi');
  const sau1 = (await VD.docDanhSachVideo(chu))[0];
  ok('Quản lý sửa tên, xóa mô tả: lưu, mô tả thành null', s1.ok && sau1.tieu_de === 'Bài 1 — Đón khách' && sau1.mo_ta === null
    && sau1.updated_at !== v.updated_at, `${s1.cau} · ${JSON.stringify(sau1)}`);
  const s2 = await VD.suaVideo(ql, formTu({ id: v.id, phien_ban: v.updated_at, tieu_de: 'Bài 1 — Đón khách', mo_ta: '' }), 'vi');
  ok('Bấm đúp nút Lưu (phiên bản cũ, cùng chữ): "Đã lưu …" — đúng sự thật, không "người khác sửa"', s2.ok && /^Đã lưu/.test(s2.cau), s2.cau);
  const s3 = await VD.suaVideo(chu, formTu({ id: v.id, phien_ban: v.updated_at, tieu_de: 'Bài 1 — Chủ sửa', mo_ta: 'Khác' }), 'vi');
  const sau3 = (await VD.docDanhSachVideo(chu))[0];
  ok('Chủ sửa từ trang mở trước khi quản lý lưu: KHÔNG ghi đè, câu nói người khác vừa sửa, trang hiện bản mới',
    !s3.ok && /Người khác vừa sửa/.test(s3.cau) && s3.banMoi === true && sau3.tieu_de === 'Bài 1 — Đón khách', s3.cau);
  const s4 = await VD.suaVideo(tn, formTu({ id: v.id, phien_ban: sau3.updated_at, tieu_de: 'Thu ngân đổi', mo_ta: '' }), 'vi');
  ok('Thu ngân sửa (RLS: 0 dòng): "chỉ chủ và quản lý" — không nói nhầm là người khác sửa',
    !s4.ok && /Chỉ chủ nhà hàng và quản lý/.test(s4.cau) && (await VD.docDanhSachVideo(chu))[0].tieu_de === 'Bài 1 — Đón khách', s4.cau);
  const s5 = await VD.suaVideo(ql, formTu({ id: v.id, phien_ban: 'không phải ngày', tieu_de: 'x' }), 'vi');
  ok('Phiên bản hỏng: "Việc không hợp lệ.", không ghi', !s5.ok && s5.cau === 'Việc không hợp lệ.', s5.cau);
  const s6 = await VD.suaVideo(ql, formTu({ id: 'abc', phien_ban: sau3.updated_at, tieu_de: 'x' }), 'vi');
  ok('Mã dòng không phải UUID: "Việc không hợp lệ."', !s6.ok && s6.cau === 'Việc không hợp lệ.', s6.cau);

  // Xóa: thu ngân không xóa được; quản lý xóa; bấm đúp → vẫn "đã xóa" (đúng: dòng không còn); sửa dòng đã xóa → nói đã bị xóa.
  const x1 = await VD.xoaVideo(tn, formTu({ id: v.id, tieu_de: 'Bài 1 — Đón khách' }), 'vi');
  ok('Thu ngân xóa: "Chưa xóa được", video còn', !x1.ok && x1.cau === 'Chưa xóa được video này.' && (await dem()) === 1, x1.cau);
  const x2 = await VD.xoaVideo(ql, formTu({ id: v.id, tieu_de: 'Bài 1 — Đón khách' }), 'vi');
  ok('Quản lý xóa: "Đã xóa …" chỉ khi đọc lại thấy dòng không còn', x2.ok && /^Đã xóa video "Bài 1 — Đón khách"/.test(x2.cau) && (await dem()) === 0, x2.cau);
  const x3 = await VD.xoaVideo(ql, formTu({ id: v.id, tieu_de: 'Bài 1 — Đón khách' }), 'vi');
  ok('Bấm đúp nút Xóa: lần hai vẫn "đã xóa" — dòng thật sự không còn', x3.ok, x3.cau);
  const s7 = await VD.suaVideo(ql, formTu({ id: v.id, phien_ban: sau3.updated_at, tieu_de: 'x' }), 'vi');
  ok('Sửa video vừa bị xóa: "đã bị xóa khỏi danh sách", trang không điền lại chữ cũ',
    !s7.ok && /đã bị xóa/.test(s7.cau) && s7.banMoi === true, s7.cau);
});

// ===========================================================================
await nhom('6 · MẤT MẠNG, LỖI MÁY CHỦ — không bao giờ "đã …"', async () => {
  /** Client PostgREST giả: `tra(q)` trả { data, error } hoặc ném. q = { loai, cot, don }. */
  const clientGia = tra => ({
    from() {
      const q = { loai: 'select', cot: null, don: false };
      const b = {
        insert() { q.loai = 'insert'; return b; }, update() { q.loai = 'update'; return b; }, delete() { q.loai = 'delete'; return b; },
        select(c) { q.cot = c; return b; }, eq() { return b; }, order() { return b; },
        single() { q.don = true; return b; }, maybeSingle() { q.don = true; return b; },
        then(xong, hong) { return Promise.resolve().then(() => tra(q)).then(xong, hong); },
      };
      return b;
    },
  });
  const nem = () => { throw new TypeError('fetch failed'); };
  const loi500 = () => ({ data: null, error: { message: 'upstream connect error', code: '' } });
  const V = { id: '11111111-1111-4111-8111-111111111111', phien_ban: '2026-11-14T03:00:00.123456+00:00' };
  const themF = formTu({ link: 'https://youtu.be/AbCdEfGhIjK', tieu_de: 'Bài 1' });
  const suaF = formTu({ ...V, tieu_de: 'Bài 1', mo_ta: '' });
  const xoaF = formTu({ id: V.id, tieu_de: 'Bài 1' });
  const CA = [
    ['Thêm: fetch ném lỗi', () => VD.themVideo(clientGia(nem), themF, 'vi')],
    ['Thêm: máy chủ trả lỗi', () => VD.themVideo(clientGia(loi500), themF, 'vi')],
    ['Thêm: không lỗi mà không có id (trả lời cụt)', () => VD.themVideo(clientGia(() => ({ data: null, error: null })), themF, 'vi')],
    ['Sửa: fetch ném lỗi', () => VD.suaVideo(clientGia(nem), suaF, 'vi')],
    ['Sửa: máy chủ trả lỗi', () => VD.suaVideo(clientGia(loi500), suaF, 'vi')],
    ['Sửa: 0 dòng rồi đọc lại hỏng', () => VD.suaVideo(clientGia(q => (q.loai === 'update' ? { data: [], error: null } : loi500())), suaF, 'vi')],
    ['Sửa: 0 dòng rồi đọc lại ném', () => VD.suaVideo(clientGia(q => (q.loai === 'update' ? { data: [], error: null } : nem())), suaF, 'vi')],
    ['Xóa: fetch ném lỗi', () => VD.xoaVideo(clientGia(nem), xoaF, 'vi')],
    ['Xóa: máy chủ trả lỗi', () => VD.xoaVideo(clientGia(loi500), xoaF, 'vi')],
    ['Xóa: xóa xong, đọc lại hỏng', () => VD.xoaVideo(clientGia(q => (q.loai === 'delete' ? { data: null, error: null } : loi500())), xoaF, 'vi')],
    ['Xóa: xóa "xong" mà dòng vẫn còn', () => VD.xoaVideo(clientGia(q => (q.loai === 'delete' ? { data: null, error: null } : { data: { id: V.id }, error: null })), xoaF, 'vi')],
  ];
  for (const [ten, chay] of CA) {
    let kq;
    try { kq = await chay(); } catch (e) { kq = { ok: true, cau: `NÉM RA TRANG: ${e.message}` }; }
    ok(`${ten}: không ném, ok = false, câu không mở đầu bằng "Đã"`, kq.ok === false && !/^Đã/.test(kq.cau), kq.cau);
  }
  const xoaNua = await VD.xoaVideo(clientGia(q => (q.loai === 'delete' ? { data: null, error: null } : loi500())), xoaF, 'vi');
  ok('Xóa xong mà không đọc lại được: nói "chưa chắc", dặn tải lại trang', /Chưa chắc đã xóa/.test(xoaNua.cau) && /Tải lại trang/.test(xoaNua.cau), xoaNua.cau);
  let nemRa = false;
  try { await VD.docDanhSachVideo(clientGia(loi500)); } catch { nemRa = true; }
  ok('Đọc danh sách hỏng: ném — trang báo "chưa đọc được", không nói "chưa có video nào"', nemRa);

  // Câu tiếng Anh của mọi lỗi không còn chữ Việt.
  const en = [
    await VD.themVideo(clientGia(nem), themF, 'en'), await VD.suaVideo(clientGia(loi500), suaF, 'en'),
    await VD.xoaVideo(clientGia(loi500), xoaF, 'en'), await VD.themVideo(clientGia(nem), formTu({ link: 'x', tieu_de: 'a' }), 'en'),
    await VD.themVideo(clientGia(nem), formTu({ link: 'https://youtu.be/AbCdEfGhIjK', tieu_de: '' }), 'en'),
    await VD.suaVideo(clientGia(nem), formTu({ id: 'x' }), 'en'),
  ];
  ok('Màn tiếng Anh: câu lỗi không còn chữ Việt', en.every(k => !VIET.test(k.cau)), en.map(k => k.cau).filter(c => VIET.test(c)).join(' | '));
});

// ===========================================================================
await nhom('7 · TRANG /noi-bo/dao-tao VÀ MÃ NGUỒN', async () => {
  const trang = doc('web/src/pages/noi-bo/dao-tao.astro');
  ok('Không JavaScript (không <script>, không onclick)', !/<script|onclick=/i.test(trang));
  ok('Khung video: <iframe> tải lười, link dựng bằng linkNhungYoutube, cho toàn màn hình',
    /<iframe[\s\S]*?src=\{linkNhungYoutube\(v\.youtube_id\)\}[\s\S]*?loading="lazy"[\s\S]*?allowfullscreen/.test(trang));
  ok('Khung 16:9 giữ chỗ trước khi YouTube tải (trang không nhảy)', /\.vd-khung \{[^}]*aspect-ratio: 16 \/ 9/.test(trang));
  for (const [viec, o] of [['them', ['link', 'tieu_de', 'mo_ta']], ['sua', ['id', 'phien_ban', 'tieu_de', 'mo_ta']], ['xoa', ['id', 'tieu_de']]]) {
    const khoi = trang.slice(trang.indexOf(`name="viec" value="${viec}"`));
    const form = khoi.slice(0, khoi.indexOf('</form>'));
    ok(`Form "${viec}": có đủ ô ${o.join(', ')} mà thư viện đọc`, trang.includes(`name="viec" value="${viec}"`)
      && o.every(t => form.includes(`name="${t}"`)), o.filter(t => !form.includes(`name="${t}"`)).join(', '));
  }
  ok('Sửa, xóa nằm trong mục gập đóng sẵn (<details>), không confirm()', /<details class="vd-sua" open=\{moSua\(v\)\}>/.test(trang) && !/confirm\(/.test(trang));
  ok('Form sửa gửi phiên bản đang thấy (updated_at)', /name="phien_ban" value=\{v\.updated_at\}/.test(trang));
  ok('Lỗi đọc danh sách và danh sách rỗng là hai câu khác nhau', /\{dsLoi && /.test(trang) && /!dsLoi && ds\.length === 0/.test(trang));
  ok('Trang dặn đừng gửi link ra ngoài, cả hai thứ tiếng',
    /đừng gửi link video ra ngoài/.test(trang) && /do not share the video links outside/.test(trang));

  // Mã video chỉ nằm trong database: không file nào của web/src chứa link YouTube có mã cụ thể.
  const moiFile = thuMuc => readdirSync(thuMuc).flatMap(t => {
    const p = join(thuMuc, t);
    return statSync(p).isDirectory() ? moiFile(p) : [p];
  });
  const lo = moiFile(SRC).filter(p => /\.(astro|ts|js|mjs|json)$/.test(p))
    .filter(p => /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)[A-Za-z0-9_-]{11}(?![A-Za-z0-9_-])/.test(readFileSync(p, 'utf8')))
    .map(p => p.slice(GOC.length + 1));
  ok('Không file nào trong web/src chứa mã video YouTube (repo công khai)', lo.length === 0, lo.join(', '));

  const menu = (await import(pathToFileURL(join(SRC, 'lib', 'dieu-huong-noi-bo.ts')).href)).MUC_NOI_BO.find(m => m.ma === 'dao_tao');
  ok('Menu: mục Video đào tạo trỏ đúng trang, tên ngắn ≤ 10 ký tự cả hai thứ tiếng, có biểu tượng video',
    menu?.link === VD.DUONG_DAO_TAO && menu.ngan.vi.length <= 10 && menu.ngan.en.length <= 10 && menu.bieuTuong === 'video', JSON.stringify(menu?.ngan));
});

process.exit(ketThuc('VIDEO ĐÀO TẠO'));
