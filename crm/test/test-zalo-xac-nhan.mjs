/**
 * BEEFTOWN CRM — Kiểm thử: tin Zalo đặt bàn chỉ đi khi nhà hàng ĐÃ XÁC NHẬN (0063)
 * ===============================================================================
 *
 *     node test/test-zalo-xac-nhan.mjs
 *
 * Lỗi đã có (0047): trigger dat_ban_zalo xếp ZBS-01 "BEEFTOWN — XÁC NHẬN ĐẶT BÀN …
 * Bàn được giữ trong 15 phút" ngay khi khách gửi yêu cầu trên web / Messenger
 * (tao_dat_ban dưới vai anon), lúc chưa nhân viên nào gọi xác nhận. ZBS-02 ("bàn …
 * đã sẵn sàng. Bàn giữ 15 phút") cũng được hẹn ngay lúc đó. Hai tin nói bàn đã
 * được giữ — trái luật câu chữ: yêu cầu chỉ là "đã nhận" (web/src/lib/messenger.ts,
 * web/THIET-KE.md mục 5, CLAUDE.md mục 7).
 *
 * Khánh đã chốt (09/10/2026):
 *   · Lúc khách gửi: không gửi tin Zalo nào. Nhân viên bấm "Đã gọi xác nhận" ở
 *     /noi-bo/dat-ban → ZBS-01 ngay + ZBS-02 trước giờ hẹn 2 tiếng. Chữ hai mẫu
 *     giữ nguyên (đã nộp / đã duyệt với Zalo).
 *   · Tin đã nằm trong hàng chờ cho yêu cầu chưa xác nhận (xếp trước 0063): giữ
 *     lại, máy gửi không lấy cho tới khi đặt bàn được xác nhận.
 *
 * Kiểm: yêu cầu anon / Messenger / phiên đăng nhập / nhân viên chèn thẳng chưa xác
 * nhận → không tin nào; đổi giờ khi chưa xác nhận → vẫn không; xác nhận → đúng
 * một ZBS-01 + một ZBS-02, bấm đúp không thêm; giờ hẹn sau nửa đêm (giờ VN); xác
 * nhận sát giờ; tin cũ trong hàng chờ bị giữ rồi đi đúng một lần sau khi xác
 * nhận (ZBS-01 đi ngay lúc xác nhận, ZBS-02 đã quá giờ nhắc thì hủy); đèn sức
 * khỏe không coi tin đang giữ là "tin kẹt"; ai không được xác nhận thì không làm
 * nảy tin; trigger hỏng lúc xác nhận không làm hỏng việc xác nhận; câu trên màn
 * Cài đặt Zalo nói đúng lúc gửi.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — TIN ZALO ĐẶT BÀN CHỈ ĐI KHI ĐÃ XÁC NHẬN (0063)');
const { db, cnA, nsId, duoi, duoiAnon } = await dungDatabase();

const UID_MAY_ZALO = '00000000-0000-4000-8000-0000000000e1';
const UID_LA       = '00000000-0000-4000-8000-0000000000e3';   // đăng nhập được, không có dòng nhan_su

await db.query(`update chi_nhanh set dia_chi = '40–42 Đường Thử, Quận 1', dien_thoai = '0281234567' where id = $1`, [cnA.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Máy Zalo', 'may_zalo')`, [UID_MAY_ZALO, cnA.id]);
for (let i = 1; i <= 8; i++) {
  await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`, [cnA.id, `B0${i}`]);
}

const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const vi = r => (r.loi ? `${r.ma ?? ''}: ${r.loi}` : `CHẠY ĐƯỢC ${JSON.stringify(r.rows)?.slice(0, 200)}`);

const ngayCong = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const NGAY_KIA = ngayCong(2);

/** Mốc giờ VN (ngày yyyy-mm-dd, giờ HH:MM) → epoch ms. */
const epochVn = (ngay, gio) => {
  const [y, mo, d] = ngay.split('-').map(Number);
  const [h, mi] = gio.split(':').map(Number);
  return Date.UTC(y, mo - 1, d, h - 7, mi);
};

/** Khách gửi form đặt bàn trên website (và Messenger — cùng tao_dat_ban, cùng vai anon). */
async function datBanWeb(sdt, ten, ngay, gio, dongY = false) {
  const r = await duoiAnon(
    `select * from tao_dat_ban('q1', $1, $2, $3::date, $4::time, 2::smallint, p_dong_y => $5)`,
    [sdt, ten, ngay, gio, dongY]);
  return r.loi ? { loi: r.loi } : r.rows[0];
}

/**
 * Nhân viên bấm "Đã gọi xác nhận" — đúng câu của /noi-bo/dat-ban: chỉ đổi khi trạng thái
 * vẫn là cho_xac_nhan, ghi người xử lý, trả về các dòng đã đổi.
 */
const xacNhan = (uid, id) => duoi(uid,
  `update dat_ban set trang_thai = 'da_xac_nhan', nguoi_xu_ly = $2
    where id = $1 and trang_thai = 'cho_xac_nhan' returning id`, [id, nsId[uid] ?? null]);

const tinCuaDatBan = id => q(
  `select n.*, m.ma as mau_ma from nhat_ky_tin n join mau_tin m on m.id = n.mau_tin_id
    where n.dat_ban_id = $1 order by m.ma`, [id]);

/** Tin nói bàn đã được giữ / đã xác nhận: đúng chữ của ZBS-01 và ZBS-02. */
const noiDaGiu = t => /XÁC NHẬN|giữ|sẵn sàng/i.test(t.noi_dung ?? '');

/** Xếp một tin như trigger 0047 từng làm lúc đặt bàn mới tạo — dựng lại hàng chờ cũ còn trên production. */
const xepKieuCu = (id, ma, guiSau) => db.query(
  `select zalo_xep_tin_mot(d, $2, ${guiSau}) from dat_ban d where d.id = $1`, [id, ma]);

/** Một lượt của máy Zalo: lấy lô rồi trả lại hàng chờ (không báo kết quả), nhả khóa. */
async function luotMay() {
  const r = await duoi(UID_MAY_ZALO, `select zalo_bat_dau_luot(200) as kq`);
  const kq = r.rows?.[0]?.kq ?? null;
  await duoi(UID_MAY_ZALO, `select zalo_ket_thuc_luot()`);
  return { loi: r.loi, lo: kq?.lo ?? null };
}

// Zalo sẵn sàng như ở production sau khi chủ nối: hai mẫu đã duyệt, tự động, đang bật.
for (const ma of ['ZBS-01', 'ZBS-02']) {
  await duoi(UID.chu, `select zalo_luu_mau($1, $2, true, true)`, [ma, `tpl_${ma.slice(-2)}`]);
}
await duoi(UID.chu, `select zalo_luu_refresh_token($1)`, ['v1.' + 'A'.repeat(40) + 'refresh1']);
const batZalo = await duoi(UID.chu, `select zalo_luu_cau_hinh(p_app_id => '123456', p_oa_id => '654321', p_dang_bat => true) as kq`);

// ===========================================================================
await nhom('0 · TIỀN ĐỀ', async () => {
  ok('Bật được Zalo, ZBS-01 và ZBS-02 đã duyệt + tự động', batZalo.loi === null && batZalo.rows[0].kq?.dang_bat === true
     && (await mot(`select count(*)::int as n from mau_tin where ma in ('ZBS-01','ZBS-02') and da_duyet and bat_tu_dong`)).n === 2,
     batZalo.loi ?? '');
  const { args } = await mot(`select pg_get_function_identity_arguments('zalo_xep_tin_dat_ban'::regproc) as args`);
  ok('zalo_xep_tin_dat_ban: tham số thứ hai là p_vua_xac_nhan (không còn p_moi — "mới tạo")',
     args === 'p_dat_ban_id uuid, p_vua_xac_nhan boolean, p_doi_gio boolean', args);
  const { n } = await mot(`select count(*)::int as n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                            where s.nspname = 'public' and p.proname = 'zalo_xep_tin_dat_ban'`);
  ok('zalo_xep_tin_dat_ban chỉ có MỘT bản (không đẻ overload)', n === 1, `${n} bản`);
  const quyen = await mot(`select has_function_privilege('authenticated', 'zalo_xep_tin_dat_ban(uuid,boolean,boolean)', 'execute') as a,
                                  has_function_privilege('anon', 'zalo_xep_tin_dat_ban(uuid,boolean,boolean)', 'execute') as b,
                                  prosecdef as d, proconfig::text as c
                           from pg_proc where proname = 'zalo_xep_tin_dat_ban'`);
  ok('…dựng lại vẫn là hàm nội bộ: authenticated và anon KHÔNG gọi được; definer, có search_path',
     quyen.a === false && quyen.b === false && quyen.d === true && /search_path=public/.test(quyen.c), JSON.stringify(quyen));
  // Máy gửi (zalo_bat_dau_luot) và đèn sức khỏe (suc_khoe_so_lieu) dùng CÙNG một luật "tin nào được đi".
  // Viết tay hai chỗ — lệch nhau là đèn đỏ giả ban đêm, hoặc che mất tin kẹt thật.
  const dieuKien = async (ham, b) => {
    const { src } = await mot(`select prosrc as src from pg_proc where proname = $1`, [ham]);
    const i = src.indexOf(`not exists (select 1 from dat_ban d where d.id = ${b}.dat_ban_id`), j = src.indexOf(`'cho_xac_nhan')`, i);
    return i < 0 || j < 0 ? null : src.slice(i, j + 15).replace(/\s+/g, ' ').replace(/\b[nt]\.dat_ban_id/g, 'X.dat_ban_id');
  };
  const dkMay = await dieuKien('zalo_bat_dau_luot', 'n'), dkDen = await dieuKien('suc_khoe_so_lieu', 't');
  ok('Máy gửi và đèn sức khỏe: điều kiện "giữ tin của đặt bàn chưa xác nhận" CHỮ Y HỆT nhau',
     dkMay !== null && dkMay === dkDen, `${dkMay} | ${dkDen}`);

  const goi = await duoi(UID.chu, `select zalo_xep_tin_dat_ban(gen_random_uuid(), true, true)`);
  ok('Chủ gọi thẳng zalo_xep_tin_dat_ban → permission denied', /permission denied/i.test(goi.loi ?? ''), vi(goi));
});

// ===========================================================================
await nhom('1 · HỒI QUY: YÊU CẦU CHƯA XÁC NHẬN KHÔNG NHẬN TIN NÓI BÀN ĐÃ ĐƯỢC GIỮ', async () => {
  const d = await datBanWeb('0905000001', 'Khách Web', NGAY_KIA, '18:00', true);
  ok('Khách gửi yêu cầu trên web (anon) — database ghi được', !d.loi && d.ma_dat_ban?.length === 6, d.loi ?? '');
  const { trang_thai } = await mot(`select trang_thai from dat_ban where id = $1`, [d.dat_ban_id]);
  ok('…yêu cầu đang ở cho_xac_nhan', trang_thai === 'cho_xac_nhan', trang_thai);
  const tin = await tinCuaDatBan(d.dat_ban_id);
  ok('HỒI QUY: yêu cầu anon chưa xác nhận KHÔNG được xếp tin "XÁC NHẬN" hay "giữ bàn" nào',
     !tin.some(noiDaGiu), tin.map(t => `${t.mau_ma}: ${t.noi_dung?.split('\n')[0]}`).join(' | '));
  ok('…và không xếp tin Zalo nào (Khánh chốt: lúc khách gửi không gửi gì)', tin.length === 0, tin.map(t => t.mau_ma).join());

  // Phiên đăng nhập (quản lý / thu ngân ghi hộ khách qua điện thoại) đi cùng tao_dat_ban → vẫn cho_xac_nhan.
  const ql = await duoi(UID.qlA, `select * from tao_dat_ban('q1', '0905000002', 'Khách Gọi Điện', $1::date, '18:30'::time, 4::smallint)`, [NGAY_KIA]);
  ok('Quản lý ghi yêu cầu qua tao_dat_ban — chưa xác nhận → không tin nào',
     ql.loi === null && (await tinCuaDatBan(ql.rows[0].dat_ban_id)).length === 0, vi(ql));

  // Nhân viên chèn thẳng một dòng (policy dat_ban_them cho phép) với trạng thái mặc định.
  const kh = await mot(`select * from tim_hoac_tao_khach('0905000003', 'Khách Chèn Thẳng', $1)`, [cnA.id]);
  const chen = await duoi(UID.qlA, `insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, ma_dat_ban)
                                    values ($1, $2, $3::date, '19:00', 2, sinh_ma_dat_ban()) returning id`, [cnA.id, kh.id, NGAY_KIA]);
  ok('Nhân viên chèn thẳng đặt bàn cho_xac_nhan → không tin nào',
     chen.loi === null && (await tinCuaDatBan(chen.rows[0].id)).length === 0, vi(chen));

  // Đổi giờ, đổi số khách khi chưa xác nhận: trước 0063 nhánh đổi giờ cũng tự hẹn ZBS-02.
  const doi = await duoi(UID.qlA, `update dat_ban set ngay = $2::date, gio = '20:00', so_khach = 3 where id = $1`,
                         [d.dat_ban_id, ngayCong(3)]);
  const sauDoi = await tinCuaDatBan(d.dat_ban_id);
  ok('Đổi giờ + số khách khi chưa xác nhận → vẫn không tin nào', doi.loi === null && sauDoi.length === 0,
     `${vi(doi)} · ${sauDoi.map(t => t.mau_ma).join()}`);

  const may = await luotMay();
  ok('Máy Zalo chạy một lượt → lô không có tin nào của yêu cầu chưa xác nhận',
     may.loi === null && Array.isArray(may.lo) && may.lo.length === 0, may.loi ?? JSON.stringify(may.lo));
});

// ===========================================================================
let datChinh;
await nhom('2 · BẤM "ĐÃ GỌI XÁC NHẬN" → ZBS-01 NGAY + ZBS-02 LÚC HẸN − 2 TIẾNG', async () => {
  const d = await datBanWeb('0905000010', 'Nguyễn Thị Xác Nhận', NGAY_KIA, '18:00', true);
  datChinh = d;
  ok('(trước khi xác nhận: không tin nào)', (await tinCuaDatBan(d.dat_ban_id)).length === 0);

  const xn = await xacNhan(UID.qlA, d.dat_ban_id);
  ok('Quản lý bấm "Đã gọi xác nhận" → đổi được đúng một dòng', xn.loi === null && xn.rows.length === 1, vi(xn));
  const tin = await tinCuaDatBan(d.dat_ban_id);
  ok('Đúng hai tin: ZBS-01 và ZBS-02', tin.map(t => t.mau_ma).join() === 'ZBS-01,ZBS-02', tin.map(t => t.mau_ma).join());
  const [t1, t2] = tin;
  ok('ZBS-01: cho_gui, giao_dich, khoa_gui ZBS-01:dat_ban:<id>, gửi ngay',
     t1?.ket_qua === 'cho_gui' && t1.loai_tin === 'giao_dich' && t1.khoa_gui === `ZBS-01:dat_ban:${d.dat_ban_id}`
     && Math.abs(new Date(t1.gui_sau).getTime() - Date.now()) < 60_000, JSON.stringify(t1)?.slice(0, 200));
  ok('ZBS-01 điền đủ: tên có dấu, mã đặt bàn, không còn <...>',
     t1?.noi_dung.includes('Nguyễn Thị Xác Nhận') && t1.noi_dung.includes(d.ma_dat_ban) && !/<[a-z_]+>/.test(t1.noi_dung));
  ok('ZBS-02 hẹn đúng giờ đặt (giờ VN) − 2 tiếng', new Date(t2?.gui_sau).getTime() === epochVn(NGAY_KIA, '18:00') - 7200_000,
     String(t2?.gui_sau));

  // Bấm đúp / hai người cùng bấm: câu .eq('trang_thai', 'cho_xac_nhan') của lượt sau không khớp dòng nào.
  const lan2 = await xacNhan(UID.qlA, d.dat_ban_id);
  ok('Bấm lần hai → không dòng nào đổi (trang hiện "người khác đã xử lý")', lan2.loi === null && lan2.rows.length === 0, vi(lan2));
  await duoi(UID.qlA, `update dat_ban set trang_thai = 'da_xac_nhan' where id = $1`, [d.dat_ban_id]);
  await db.query(`select zalo_xep_tin_dat_ban($1, true, true)`, [d.dat_ban_id]);
  await duoi(UID.qlA, `update dat_ban set so_khach = 2 where id = $1`, [d.dat_ban_id]);
  ok('Ghi lại da_xac_nhan, gọi lại hàm xếp, sửa số khách → vẫn đúng hai tin, một ZBS-01',
     (await tinCuaDatBan(d.dat_ban_id)).map(t => t.mau_ma).join() === 'ZBS-01,ZBS-02');

  const may = await luotMay();
  const cua = (may.lo ?? []).filter(t => t.sdt === '0905000010');
  ok('Máy Zalo lấy đúng MỘT tin của đặt bàn đã xác nhận: ZBS-01 (ZBS-02 chưa tới giờ)',
     cua.length === 1 && cua[0].mau_ma === 'ZBS-01' && cua[0].du_lieu.booking_code === d.ma_dat_ban, JSON.stringify(cua));

  // Nhân viên ghi đặt bàn qua điện thoại đã gọi xác nhận luôn: chèn thẳng da_xac_nhan.
  const kh = await mot(`select * from tim_hoac_tao_khach('0905000011', 'Khách Đã Xác Nhận', $1)`, [cnA.id]);
  const chen = await duoi(UID.qlA, `insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, ma_dat_ban, trang_thai)
                                    values ($1, $2, $3::date, '19:00', 2, sinh_ma_dat_ban(), 'da_xac_nhan') returning id`,
                          [cnA.id, kh.id, NGAY_KIA]);
  ok('Chèn thẳng một đặt bàn ĐÃ xác nhận → có ZBS-01 + ZBS-02',
     chen.loi === null && (await tinCuaDatBan(chen.rows[0].id)).map(t => t.mau_ma).join() === 'ZBS-01,ZBS-02', vi(chen));
});

// ===========================================================================
await nhom('3 · GIỜ VIỆT NAM — hẹn sau nửa đêm; xác nhận sát giờ', async () => {
  // Hẹn 00:30 ngày kia (giờ VN): nhắc lúc 22:30 HÔM TRƯỚC giờ VN — qua ranh ngày.
  const kh = await mot(`select * from tim_hoac_tao_khach('0905000020', 'Khách Nửa Đêm', $1)`, [cnA.id]);
  const { id } = await mot(`insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, ma_dat_ban)
                            values ($1, $2, $3::date, '00:30', 2, sinh_ma_dat_ban()) returning id`, [cnA.id, kh.id, NGAY_KIA]);
  ok('(chưa xác nhận: không tin nào)', (await tinCuaDatBan(id)).length === 0);
  ok('(quản lý xác nhận được)', (await xacNhan(UID.qlA, id)).rows?.length === 1);
  const [t1, t2] = await tinCuaDatBan(id);
  const muon = epochVn(NGAY_KIA, '00:30') - 7200_000;
  ok('Xác nhận hẹn 00:30 → ZBS-02 lúc 22:30 hôm trước (giờ VN), không lệch 7 tiếng',
     t2?.mau_ma === 'ZBS-02' && new Date(t2.gui_sau).getTime() === muon, `${t2?.gui_sau} ≠ ${new Date(muon).toISOString()}`);
  const [y, m, dd] = NGAY_KIA.split('-');
  ok('…ZBS-01 ghi ngày dd/mm/yyyy, giờ 00:30', t1?.du_lieu.date === `${dd}/${m}/${y}` && t1.du_lieu.time === '00:30',
     JSON.stringify(t1?.du_lieu));

  // Hẹn 1 tiếng nữa: giờ nhắc (−2 tiếng) đã qua → chỉ ZBS-01.
  const kh2 = await mot(`select * from tim_hoac_tao_khach('0905000021', 'Khách Sát Giờ', $1)`, [cnA.id]);
  const { id: id2 } = await mot(`insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, ma_dat_ban)
                                 values ($1, $2, (bay_gio_vn() + interval '1 hour')::date, (bay_gio_vn() + interval '1 hour')::time,
                                         2, sinh_ma_dat_ban()) returning id`, [cnA.id, kh2.id]);
  ok('(quản lý xác nhận được đặt bàn sát giờ)', (await xacNhan(UID.qlA, id2)).rows?.length === 1);
  const sat = await tinCuaDatBan(id2);
  ok('Xác nhận khi chỉ còn 1 tiếng → có ZBS-01, KHÔNG có ZBS-02', sat.map(t => t.mau_ma).join() === 'ZBS-01', sat.map(t => t.mau_ma).join());
});

// ===========================================================================
await nhom('4 · TIN XẾP TRƯỚC 0063 CHO YÊU CẦU CHƯA XÁC NHẬN → GIỮ LẠI, ĐỢI XÁC NHẬN', async () => {
  // Dựng lại đúng hàng chờ mà bản 0047 để lại: yêu cầu cho_xac_nhan có sẵn ZBS-01 (gửi ngay) và ZBS-02.
  const d = await datBanWeb('0905000030', 'Khách Hàng Chờ Cũ', NGAY_KIA, '19:30');
  await xepKieuCu(d.dat_ban_id, 'ZBS-01', 'now()');
  await xepKieuCu(d.dat_ban_id, 'ZBS-02', `zalo_luc_hen(d.ngay, d.gio) - interval '2 hours'`);
  ok('(hàng chờ cũ: ZBS-01 + ZBS-02 cho_gui của yêu cầu chưa xác nhận)',
     (await tinCuaDatBan(d.dat_ban_id)).map(t => `${t.mau_ma}:${t.ket_qua}`).join() === 'ZBS-01:cho_gui,ZBS-02:cho_gui');

  const b1 = await luotMay();
  const zbs01 = await mot(`select ket_qua, lan_thu, dang_gui_tu from nhat_ky_tin where khoa_gui = $1`, [`ZBS-01:dat_ban:${d.dat_ban_id}`]);
  ok('Máy Zalo KHÔNG lấy ZBS-01 đã đến hạn của yêu cầu chưa xác nhận',
     b1.loi === null && !(b1.lo ?? []).some(t => t.sdt === '0905000030'), b1.loi ?? JSON.stringify(b1.lo));
  ok('…tin vẫn cho_gui, chưa tính lần thử nào (giữ lại, không hủy)',
     zbs01.ket_qua === 'cho_gui' && zbs01.lan_thu === 0 && zbs01.dang_gui_tu === null, JSON.stringify(zbs01));

  await duoi(UID.qlA, `update dat_ban set so_khach = 5 where id = $1`, [d.dat_ban_id]);
  ok('Sửa số khách khi đang giữ → tham số tin chờ cập nhật (5 khách)',
     (await tinCuaDatBan(d.dat_ban_id)).every(t => t.du_lieu.guests === '5'));

  // Khách gửi từ 3 tiếng trước, nhân viên gọi xác nhận bây giờ.
  await db.query(`update nhat_ky_tin set gui_sau = now() - interval '3 hours' where khoa_gui = $1`, [`ZBS-01:dat_ban:${d.dat_ban_id}`]);
  const xn = await xacNhan(UID.qlA, d.dat_ban_id);
  const sau = await tinCuaDatBan(d.dat_ban_id);
  ok('Xác nhận → không đẻ thêm tin (vẫn một ZBS-01, một ZBS-02)', xn.rows?.length === 1
     && sau.map(t => `${t.mau_ma}:${t.ket_qua}`).join() === 'ZBS-01:cho_gui,ZBS-02:cho_gui', sau.map(t => `${t.mau_ma}:${t.ket_qua}`).join());
  ok('…ZBS-01 đang giữ dời gui_sau về lúc xác nhận (không mang mốc 3 tiếng trước)',
     Math.abs(new Date(sau[0].gui_sau).getTime() - Date.now()) < 60_000, String(sau[0].gui_sau));
  ok('…ZBS-02 đang giữ vẫn hẹn giờ hẹn − 2 tiếng', new Date(sau[1].gui_sau).getTime() === epochVn(NGAY_KIA, '19:30') - 7200_000,
     String(sau[1].gui_sau));
  const b2 = await luotMay();
  const cua = (b2.lo ?? []).filter(t => t.sdt === '0905000030');
  ok('Lượt sau khi xác nhận → máy lấy ĐÚNG MỘT lần tin ZBS-01 đã giữ', cua.length === 1 && cua[0].mau_ma === 'ZBS-01'
     && cua[0].du_lieu.guests === '5', JSON.stringify(cua));

  // Yêu cầu hẹn 1 tiếng nữa, ZBS-02 cũ đang giữ đã quá giờ nhắc; xác nhận bây giờ.
  const khSat = await mot(`select * from tim_hoac_tao_khach('0905000033', 'Khách Giữ Sát Giờ', $1)`, [cnA.id]);
  const { id: dSat } = await mot(`insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, ma_dat_ban)
                                  values ($1, $2, (bay_gio_vn() + interval '1 hour')::date, (bay_gio_vn() + interval '1 hour')::time,
                                          2, sinh_ma_dat_ban()) returning id`, [cnA.id, khSat.id]);
  await xepKieuCu(dSat, 'ZBS-01', `now() - interval '2 hours'`);
  await xepKieuCu(dSat, 'ZBS-02', `zalo_luc_hen(d.ngay, d.gio) - interval '2 hours'`);
  ok('(quản lý xác nhận được)', (await xacNhan(UID.qlA, dSat)).rows?.length === 1);
  const [s1, s2] = await tinCuaDatBan(dSat);
  ok('Xác nhận khi ZBS-02 đang giữ đã quá giờ nhắc → ZBS-02 da_huy, có lý do; ZBS-01 đi ngay',
     s2?.mau_ma === 'ZBS-02' && s2.ket_qua === 'da_huy' && s2.loi === 'Xác nhận khi đã sát giờ hẹn — không còn nhắc trước 2 tiếng'
     && s1?.ket_qua === 'cho_gui' && Math.abs(new Date(s1.gui_sau).getTime() - Date.now()) < 60_000,
     `${s1?.ket_qua} ${s1?.gui_sau} · ${s2?.ket_qua} ${s2?.loi}`);

  // Yêu cầu chưa xác nhận bị khách hủy → tin đang giữ thành da_huy (đường cũ của 0047).
  const h = await datBanWeb('0905000031', 'Khách Hủy Khi Chờ', NGAY_KIA, '20:00');
  await xepKieuCu(h.dat_ban_id, 'ZBS-01', 'now()');
  const huy = await duoiAnon(`select huy_dat_ban($1, '0905000031', 'bận') as ok`, [h.ma_dat_ban]);
  const th = await tinCuaDatBan(h.dat_ban_id);
  ok('Khách tự hủy yêu cầu chưa xác nhận → tin đang giữ da_huy, không bao giờ gửi',
     huy.loi === null && th.length === 1 && th[0].ket_qua === 'da_huy' && th[0].loi === 'Khách đã hủy đặt bàn', vi(huy));

  // Yêu cầu chưa xác nhận mà giờ hẹn đã qua → lượt gửi dọn tin đang giữ (đường cũ của 0047).
  const kh = await mot(`select * from tim_hoac_tao_khach('0905000032', 'Khách Quá Giờ Khi Chờ', $1)`, [cnA.id]);
  const { id: dQua } = await mot(`insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, ma_dat_ban)
                                  values ($1, $2, (bay_gio_vn() + interval '1 hour')::date, (bay_gio_vn() + interval '1 hour')::time,
                                          2, sinh_ma_dat_ban()) returning id`, [cnA.id, kh.id]);
  await xepKieuCu(dQua, 'ZBS-01', 'now()');
  await db.query(`update dat_ban set ngay = (bay_gio_vn() - interval '1 hour')::date,
                                     gio = (bay_gio_vn() - interval '1 hour')::time where id = $1`, [dQua]);
  const b3 = await luotMay();
  const qua = await mot(`select ket_qua, loi from nhat_ky_tin where dat_ban_id = $1`, [dQua]);
  ok('Yêu cầu chưa xác nhận đã quá giờ hẹn → tin đang giữ da_huy, không vào lô',
     qua.ket_qua === 'da_huy' && /quá giờ hẹn/.test(qua.loi) && !(b3.lo ?? []).some(t => t.sdt === '0905000032'), JSON.stringify(qua));
});

// ===========================================================================
await nhom('4b · ĐÈN SỨC KHỎE: TIN ĐANG GIỮ KHÔNG PHẢI "TIN KẸT"', async () => {
  // Ô tin_zalo.cho_qua_han > 0 là đèn đỏ ở /noi-bo (và báo động) — chỉ được đếm tin máy lẽ ra đã gửi.
  const choQuaHan = async () => {
    const { k } = await mot(`select suc_khoe_so_lieu(array[$1]::uuid[]) as k`, [cnA.id]);
    return k.chi_nhanh.find(c => c.id === cnA.id)?.tin_zalo?.cho_qua_han;
  };
  const truoc = await choQuaHan();
  ok('(trước: số tin kẹt đọc được)', Number.isInteger(truoc), String(truoc));

  const d = await datBanWeb('0905000035', 'Khách Đèn Sức Khỏe', NGAY_KIA, '21:00');
  await xepKieuCu(d.dat_ban_id, 'ZBS-01', `now() - interval '1 hour'`);
  ok('Tin cũ của yêu cầu chưa xác nhận, đến hạn 1 tiếng trước → KHÔNG tính là tin kẹt',
     (await choQuaHan()) === truoc, `${truoc} → ${await choQuaHan()}`);

  const xn = await xacNhan(UID.qlA, d.dat_ban_id);
  ok('Vừa xác nhận → tin đi trong lượt tới, chưa phải tin kẹt', xn.rows?.length === 1 && (await choQuaHan()) === truoc,
     `${truoc} → ${await choQuaHan()}`);

  // Đối chứng: đặt bàn ĐÃ xác nhận mà tin để quá 30 phút không gửi → vẫn đỏ như trước.
  await db.query(`update nhat_ky_tin set gui_sau = now() - interval '1 hour' where khoa_gui = $1`, [`ZBS-01:dat_ban:${d.dat_ban_id}`]);
  ok('Đối chứng: tin của đặt bàn đã xác nhận đến hạn quá 30 phút → vẫn tính là tin kẹt (+1)',
     (await choQuaHan()) === truoc + 1, `${truoc} → ${await choQuaHan()}`);
  await db.query(`update nhat_ky_tin set ket_qua = 'da_huy', loi = 'dọn sau đối chứng' where khoa_gui = $1`, [`ZBS-01:dat_ban:${d.dat_ban_id}`]);
});

// ===========================================================================
await nhom('5 · AI KHÔNG ĐƯỢC XÁC NHẬN THÌ KHÔNG LÀM NẢY TIN', async () => {
  const d = await datBanWeb('0905000040', 'Khách Thử Quyền', NGAY_KIA, '12:00');
  for (const [ai, uid] of [['Quản lý chi nhánh khác (Q7)', UID.qlB], ['Thủ kho Q1 (vai ngoài CRM)', UID.thuKhoA],
                           ['Nhân sự đã nghỉ', UID.nghiViec], ['Tài khoản không có dòng nhan_su', UID_LA]]) {
    const r = await xacNhan(uid, d.dat_ban_id);
    ok(`${ai} KHÔNG xác nhận được (lỗi hoặc không dòng nào đổi)`, r.loi !== null || r.rows.length === 0, vi(r));
  }
  const anon = await duoiAnon(`update dat_ban set trang_thai = 'da_xac_nhan' where id = $1 returning id`, [d.dat_ban_id]);
  ok('Khách vãng lai (anon) KHÔNG xác nhận được', anon.loi !== null || anon.rows.length === 0, vi(anon));
  const { trang_thai } = await mot(`select trang_thai from dat_ban where id = $1`, [d.dat_ban_id]);
  ok('…đặt bàn vẫn cho_xac_nhan, không tin nào được xếp',
     trang_thai === 'cho_xac_nhan' && (await tinCuaDatBan(d.dat_ban_id)).length === 0, trang_thai);

  const tn = await xacNhan(UID.thuNganA, d.dat_ban_id);
  ok('Thu ngân cùng chi nhánh xác nhận được (như màn hộp thư) → có ZBS-01',
     tn.loi === null && tn.rows.length === 1 && (await tinCuaDatBan(d.dat_ban_id)).some(t => t.mau_ma === 'ZBS-01'), vi(tn));
});

// ===========================================================================
await nhom('6 · TRIGGER HỎNG LÚC XÁC NHẬN → XÁC NHẬN VẪN ĐƯỢC GHI, LỖI CÓ CHỖ XEM', async () => {
  const d = await datBanWeb('0905000050', 'Khách Lúc Lỗi', NGAY_KIA, '13:00');
  await db.exec(`alter table nhat_ky_tin add constraint thu_hong check (khoa_gui is null or khoa_gui not like 'ZBS-%') not valid`);
  try {
    const xn = await xacNhan(UID.qlA, d.dat_ban_id);
    const { trang_thai } = await mot(`select trang_thai from dat_ban where id = $1`, [d.dat_ban_id]);
    ok('Xếp tin lỗi mà bấm "Đã gọi xác nhận" VẪN ghi được da_xac_nhan', xn.loi === null && xn.rows.length === 1
       && trang_thai === 'da_xac_nhan', vi(xn));
    ok('…không tin nửa vời nào được xếp', (await tinCuaDatBan(d.dat_ban_id)).length === 0);
    const { loi_cuoi } = await mot(`select loi_cuoi from zalo_cau_hinh`);
    ok('…lỗi ghi vào zalo_cau_hinh.loi_cuoi, có mã đặt bàn (đèn Zalo ở /noi-bo thấy)',
       loi_cuoi?.startsWith('Xếp tin Zalo cho đặt bàn ' + d.ma_dat_ban), loi_cuoi ?? '(trống)');
  } finally {
    await db.exec(`alter table nhat_ky_tin drop constraint thu_hong`);
  }

  // Zalo tắt lúc xác nhận → không xếp gì; bật lại sau đó cũng không tự gửi bù (như 0047 với đặt bàn mới).
  await duoi(UID.chu, `select zalo_luu_cau_hinh(p_dang_bat => false)`);
  const d2 = await datBanWeb('0905000051', 'Khách Khi Tắt', NGAY_KIA, '13:30');
  const xn2 = await xacNhan(UID.qlA, d2.dat_ban_id);
  ok('Zalo tắt lúc xác nhận → xác nhận vẫn ghi được, không xếp tin',
     xn2.loi === null && xn2.rows.length === 1 && (await tinCuaDatBan(d2.dat_ban_id)).length === 0, vi(xn2));
  await duoi(UID.chu, `select zalo_luu_cau_hinh(p_dang_bat => true)`);
});

// ===========================================================================
await nhom('7 · CÂU CHỮ — mẫu đã duyệt giữ nguyên; màn Cài đặt nói đúng lúc gửi', async () => {
  const mau = Object.fromEntries((await q(`select ma, noi_dung, da_duyet from mau_tin where ma in ('ZBS-01','ZBS-02')`)).map(r => [r.ma, r]));
  ok('ZBS-01 giữ nguyên chữ đã nộp Zalo (vẫn "XÁC NHẬN ĐẶT BÀN … giữ trong 15 phút"), vẫn đã duyệt',
     mau['ZBS-01'].noi_dung.startsWith('BEEFTOWN — XÁC NHẬN ĐẶT BÀN') && mau['ZBS-01'].noi_dung.includes('Bàn được giữ trong 15 phút')
     && mau['ZBS-01'].da_duyet === true);
  const { cmt } = await mot(`select col_description('mau_tin'::regclass,
                               (select attnum from pg_attribute where attrelid = 'mau_tin'::regclass and attname = 'bat_tu_dong')) as cmt`);
  ok('Chú thích cột mau_tin.bat_tu_dong nói ZBS-01 đi khi nhân viên xác nhận', /xác nhận/.test(cmt ?? '') && !/ZBS-01 khi đặt bàn/.test(cmt ?? ''), cmt);

  const trang = readFileSync(join(GOC, 'web/src/pages/noi-bo/zalo/cai-dat.astro'), 'utf8');
  const dong = trang.split('\n').find(l => /^\s*tuDongGd:/.test(l)) ?? '';
  ok('Cài đặt Zalo (vi) không còn nói "ZBS-01 gửi ngay khi khách đặt bàn"', !trang.includes('ZBS-01 gửi ngay khi khách đặt bàn'));
  ok('…nói ZBS-01 gửi khi nhân viên bấm "Đã gọi xác nhận" (vi + en)',
     dong.includes('Đã gọi xác nhận') && dong.includes('Called and confirmed'), dong.trim());
  ok('…bản tiếng Anh không còn "as soon as a customer books"', !trang.includes('as soon as a customer books'));
});

process.exit(ketThuc('TIN ZALO ĐẶT BÀN'));
