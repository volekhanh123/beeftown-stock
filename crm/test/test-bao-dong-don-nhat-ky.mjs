/**
 * BEEFTOWN — Kiểm thử: lượt báo động 5 phút dọn bốn bảng nhật ký phình mãi (migration 0070)
 * ==========================================================================================
 *
 *     node test/test-bao-dong-don-nhat-ky.mjs
 *
 * Rà soát nợ kỹ thuật 11/10/2026: kho_ipos_lan_chay (mỗi chi nhánh 288 lượt cron mỗi ngày),
 * kho_may_nhat_ky (mỗi lần gõ PIN), nhat_ky_tra_cuu (IP người tra đặt bàn — dữ liệu cá nhân),
 * nhat_ky_tin (mọi tin Zalo, có SĐT và nội dung) không bao giờ được dọn. 0060 đã gắn việc dọn
 * bao_dong_su_co vào bao_dong_bat_dau_luot (mỗi 5 phút); 0070 gắn thêm don_nhat_ky_qua_han():
 *
 *   nhat_ky_tra_cuu    30 ngày   (giới hạn tra cứu theo IP chỉ nhìn 15 phút)
 *   kho_may_nhat_ky   180 ngày   (khóa PIN chỉ đếm 30 phút / 24 giờ)
 *   kho_ipos_lan_chay  90 ngày   — GIỮ 10 lượt mới nhất mỗi chi nhánh (màn Kết nối iPOS) và lượt cron
 *                                  tự chạy xong gần nhất (ô cron_cuoi của bảng sức khỏe, đèn iPOS)
 *   nhat_ky_tin       400 ngày   theo mốc coalesce(gui_luc, gui_sau, created_at); KHÔNG BAO GIỜ xóa tin
 *                                  còn cho_gui
 *
 * Mỗi bảng tối đa 5.000 dòng một lượt: lượt đầu sau khi chạy migration trên database lâu năm không
 * vượt statement_timeout (8 giây) — phần còn lại các lượt sau dọn tiếp.
 */

import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — LƯỢT BÁO ĐỘNG DỌN NHẬT KÝ QUÁ HẠN (0070)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();

const UID_MAY = '00000000-0000-4000-8000-0000000000f1';
const UID_MAY_CHUNG = '00000000-0000-4000-8000-0000000000f5';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam) values
                ($1, $2, 'Máy báo động', 'may_bao_dong', true), ($3, $2, 'Máy tính bảng', 'may_chung', true)`,
               [UID_MAY, cnA.id, UID_MAY_CHUNG]);

const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const dem = async (sql, p = []) => Number((await mot(sql, p)).n);
const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : 'CHẠY ĐƯỢC');
/** Một lượt báo động như Worker gọi; nhả khóa lượt ngay để lượt sau trong bài không bị "đang chạy". */
async function luot() {
  const r = await duoi(UID_MAY, `select bao_dong_bat_dau_luot('khong') as kq`);
  await db.query(`update bao_dong_trang_thai set dang_chay_tu = null where id = 1`);
  return r;
}

// ---------------------------------------------------------------------------
// Dữ liệu: mỗi bảng một dòng vừa quá hạn, một dòng vừa trong hạn
// ---------------------------------------------------------------------------
const { rows: [kh] } = await db.query(`select * from tim_hoac_tao_khach('0901000001', 'Khách')`);
const { rows: [{ id: nsMay }] } = await db.query(`select id from nhan_su where auth_uid = $1`, [UID_MAY_CHUNG]);
const { rows: [{ id: mayId }] } = await db.query(`insert into kho_may (chi_nhanh_id, nhan_su_id, ten) values ($1, $2, 'Bảng quầy') returning id`,
                                                 [cnA.id, nsMay]);

await db.query(`insert into nhat_ky_tra_cuu (ip, ma_thu, created_at) values
                ('1.1.1.1', 'CU', now() - interval '31 days'), ('1.1.1.2', 'MOI', now() - interval '29 days')`);
await db.query(`insert into kho_may_nhat_ky (may_id, chi_nhanh_id, su_kien, luc) values
                ($1, $2, 'pin_sai', now() - interval '181 days'), ($1, $2, 'pin_dung', now() - interval '179 days')`, [mayId, cnA.id]);
const tin = async (ketQua, tuoi, ghiChu) => (await mot(`
  insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, sdt_gui, noi_dung, ket_qua, created_at, gui_luc)
  values ($1, $2, '0901000001', $3, $4::text::ket_qua_gui, now() - $5::interval,
          case when $4::text = 'da_gui' then now() - $5::interval end)
  returning id`, [cnA.id, kh.id, ghiChu, ketQua, tuoi])).id;
const T = {
  cuGui: await tin('da_gui', '401 days', 'đã gửi 401 ngày'),
  cuHong: await tin('that_bai', '401 days', 'hỏng 401 ngày'),
  cuCho: await tin('cho_gui', '401 days', 'chờ gửi 401 ngày'),
  moi: await tin('da_gui', '399 days', 'đã gửi 399 ngày'),
};
// Tin nhắc lịch xếp từ lâu nhưng đến hạn gần đây: mốc là gui_sau, không phải created_at.
const { id: nhacGanDay } = await mot(`
  insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, sdt_gui, noi_dung, ket_qua, created_at, gui_sau)
  values ($1, $2, '0901000001', 'nhắc lịch', 'da_huy', now() - interval '500 days', now() - interval '10 days') returning id`, [cnA.id, kh.id]);

// iPOS: Q1 có 15 lượt cron 100 ngày trước (giữ 10 mới nhất); Q7 có MỘT lượt cron tự chạy xong 200 ngày
// trước (nhịp tim cuối cùng) và 12 lượt callback 95 ngày trước, và một lượt 89 ngày.
const ipos = (cn, nguon, tuoi, xong = true) => db.query(`
  insert into kho_ipos_lan_chay (chi_nhanh_id, nguon, bat_dau_luc, ket_thuc_luc)
  values ($1, $2, now() - $3::interval, case when $4 then now() - $3::interval + interval '1 minute' end)`, [cn.id, nguon, tuoi, xong]);
for (let i = 0; i < 15; i++) await ipos(cnA, 'cron', `${100 * 24 + i} hours`);
await ipos(cnB, 'cron', '200 days');
for (let i = 0; i < 12; i++) await ipos(cnB, 'callback', `${95 * 24 + i} hours`);
await ipos(cnB, 'cron', '89 days', false);

const soLieu = async () => (await mot(`select suc_khoe_so_lieu(array[$1, $2]::uuid[], '{}'::jsonb) s`, [cnA.id, cnB.id])).s;
const truoc = await soLieu();

// ===========================================================================
await nhom('1 · MỘT LƯỢT BÁO ĐỘNG DỌN ĐÚNG DÒNG QUÁ HẠN, GIỮ DÒNG TRONG HẠN', async () => {
  const r = await luot();
  ok('Lượt báo động chạy như cũ (bi_khoa false, có số liệu)', r.loi === null && r.rows?.[0]?.kq?.bi_khoa === false
     && r.rows[0].kq.so_lieu !== null, vi(r));

  ok('nhat_ky_tra_cuu: dòng 31 ngày bị xóa, dòng 29 ngày còn',
     (await dem(`select count(*) n from nhat_ky_tra_cuu where ma_thu = 'CU'`)) === 0
     && (await dem(`select count(*) n from nhat_ky_tra_cuu where ma_thu = 'MOI'`)) === 1);
  ok('kho_may_nhat_ky: dòng 181 ngày bị xóa, dòng 179 ngày còn',
     (await dem(`select count(*) n from kho_may_nhat_ky where su_kien = 'pin_sai'`)) === 0
     && (await dem(`select count(*) n from kho_may_nhat_ky where su_kien = 'pin_dung'`)) === 1);

  const con = async id => (await dem(`select count(*) n from nhat_ky_tin where id = $1`, [id])) === 1;
  ok('nhat_ky_tin: tin đã gửi / hỏng 401 ngày bị xóa', !(await con(T.cuGui)) && !(await con(T.cuHong)));
  ok('…tin CHỜ GỬI 401 ngày vẫn còn (không bao giờ xóa tin chưa gửi)', await con(T.cuCho));
  ok('…tin 399 ngày còn; tin xếp 500 ngày trước nhưng đến hạn 10 ngày trước còn (mốc là gui_sau)',
     (await con(T.moi)) && (await con(nhacGanDay)));

  ok('kho_ipos_lan_chay Q1: 15 lượt 100 ngày → còn đúng 10 lượt mới nhất (màn Kết nối iPOS)',
     (await dem(`select count(*) n from kho_ipos_lan_chay where chi_nhanh_id = $1`, [cnA.id])) === 10);
  ok('kho_ipos_lan_chay Q7: còn 10 lượt mới nhất (lượt 89 ngày + 9 callback) và lượt cron tự chạy xong cuối cùng (200 ngày — nhịp tim)',
     (await dem(`select count(*) n from kho_ipos_lan_chay where chi_nhanh_id = $1 and nguon = 'cron' and ket_thuc_luc is not null`, [cnB.id])) === 1
     && (await dem(`select count(*) n from kho_ipos_lan_chay where chi_nhanh_id = $1 and nguon = 'cron' and ket_thuc_luc is null`, [cnB.id])) === 1
     && (await dem(`select count(*) n from kho_ipos_lan_chay where chi_nhanh_id = $1 and nguon = 'callback'`, [cnB.id])) === 9,
     `${await dem(`select count(*) n from kho_ipos_lan_chay where chi_nhanh_id = $1`, [cnB.id])} lượt`);

  const sau = await soLieu();
  const cron = s => s.chi_nhanh.map(c => [c.ma, c.ipos.cron_cuoi]);
  ok('Đèn iPOS: ô cron_cuoi (nhịp tim) của từng chi nhánh y hệt trước khi dọn', JSON.stringify(cron(sau)) === JSON.stringify(cron(truoc)),
     `${JSON.stringify(cron(truoc))} → ${JSON.stringify(cron(sau))}`);
  const zalo = s => s.chi_nhanh.map(c => c.tin_zalo);
  ok('Đèn tin Zalo: số tin hỏng 24 giờ / chờ quá hạn y hệt', JSON.stringify(zalo(sau)) === JSON.stringify(zalo(truoc)),
     `${JSON.stringify(zalo(truoc))} → ${JSON.stringify(zalo(sau))}`);
});

// ===========================================================================
await nhom('2 · TỐI ĐA 5.000 DÒNG MỘT BẢNG MỖI LƯỢT — lượt sau dọn tiếp', async () => {
  await db.query(`insert into nhat_ky_tra_cuu (ip, ma_thu, created_at)
                  select '9.9.9.9', 'LO', now() - interval '40 days' - (i || ' seconds')::interval from generate_series(1, 6200) i`);
  await luot();
  const conLai = await dem(`select count(*) n from nhat_ky_tra_cuu where ma_thu = 'LO'`);
  ok('Lượt 1: xóa đúng 5.000 dòng, còn 1.200', conLai === 1200, `${conLai}`);
  await luot();
  ok('Lượt 2: xóa nốt', (await dem(`select count(*) n from nhat_ky_tra_cuu where ma_thu = 'LO'`)) === 0);

  await db.query(`update bao_dong_trang_thai set dang_chay_tu = now() where id = 1`);
  await db.query(`insert into nhat_ky_tra_cuu (ip, ma_thu, created_at) values ('8.8.8.8', 'KHOA', now() - interval '60 days')`);
  const khoa = await duoi(UID_MAY, `select bao_dong_bat_dau_luot('khong') as kq`);
  ok('Lượt bị khóa (lượt khác đang chạy) → không dọn gì, trả bi_khoa như cũ',
     khoa.rows?.[0]?.kq?.bi_khoa === true && (await dem(`select count(*) n from nhat_ky_tra_cuu where ma_thu = 'KHOA'`)) === 1, vi(khoa));
  await db.query(`update bao_dong_trang_thai set dang_chay_tu = null where id = 1`);
});

// ===========================================================================
await nhom('3 · QUYỀN — hàm dọn là nội bộ', async () => {
  for (const [ai, uid] of [['Chủ sở hữu', UID.chu], ['Quản lý Q1', UID.qlA], ['Máy báo động', UID_MAY]]) {
    const r = await duoi(uid, `select don_nhat_ky_qua_han()`);
    ok(`${ai} → không gọi thẳng được don_nhat_ky_qua_han()`, r.loi !== null && r.ma === '42501', vi(r));
  }
  const anon = await duoiAnon(`select don_nhat_ky_qua_han()`);
  ok('anon → không gọi được', anon.loi !== null, vi(anon));
  const { rows: [f] } = await db.query(`select prosecdef, array_to_string(proconfig, ',') cau_hinh from pg_proc where proname = 'don_nhat_ky_qua_han'`);
  ok('security definer, set search_path = public', f?.prosecdef === true && f.cau_hinh === 'search_path=public', JSON.stringify(f));
});

process.exit(ketThuc('DỌN NHẬT KÝ QUÁ HẠN'));
