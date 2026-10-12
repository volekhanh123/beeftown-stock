/**
 * BEEFTOWN CRM — Kiểm thử: chỉ số CRM đếm ngày theo giờ Việt Nam (migration 0070)
 * ================================================================================
 *
 *     node test/test-chi-so-gio-vn.mjs
 *
 * chi_so_crm() (0008) lọc kỳ bằng `thoi_diem::date`, `lan_dau::date`, `created_at::date`. Trên
 * Supabase TimeZone của phiên là UTC, nên lượt ghé 00:30 giờ Việt Nam ngày 11 (17:30 UTC ngày 10)
 * bị đếm sang ngày 10 — và khung 0h–7h sáng của mọi ngày lệch theo. 0070 thêm ngay_vn(timestamptz)
 * và đổi ba chỗ đó.
 *
 * Kèm bộ dò ở gio-utc.mjs (kiem-migration.mjs dùng): regex cũ chỉ bắt current_date / now()::date,
 * không bắt `<cột timestamptz>::date` — đúng kiểu lỗi này.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';
import { tenTimestamptz, timNgayUtc } from './gio-utc.mjs';

const THU_MUC = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN CRM — CHỈ SỐ ĐẾM NGÀY THEO GIỜ VIỆT NAM (0070)');
const { db, cnA, duoi } = await dungDatabase();

// Supabase: phiên chạy UTC. Đặt tường minh — máy chạy test có thể đặt TZ khác (CI đêm: Asia/Ho_Chi_Minh).
await db.exec(`set timezone = 'UTC'`);
await db.query(`insert into cau_hinh_tich_diem (chi_nhanh_id, dang_bat) values ($1, true)`, [cnA.id]);

const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : 'CHẠY ĐƯỢC');
const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];

// ===========================================================================
await nhom('1 · ngay_vn() — ngày theo giờ Việt Nam, không theo TimeZone của phiên', async () => {
  const CA = [
    ['2026-10-10T16:50:00Z', '2026-10-10', '23:50 ngày 10 giờ VN'],
    ['2026-10-10T17:00:00Z', '2026-10-11', '00:00 ngày 11 giờ VN'],
    ['2026-10-10T17:10:00Z', '2026-10-11', '00:10 ngày 11 giờ VN'],
    ['2026-10-10T17:30:00Z', '2026-10-11', '00:30 ngày 11 giờ VN'],
    ['2026-12-31T17:05:00Z', '2027-01-01', '00:05 ngày 01/01/2027 giờ VN — sang năm'],
    ['2028-02-28T17:30:00Z', '2028-02-29', '00:30 ngày 29/02/2028 (năm nhuận)'],
  ];
  for (const tz of ['UTC', 'Asia/Ho_Chi_Minh', 'America/New_York']) {
    await db.exec(`set timezone = '${tz}'`);
    const sai = [];
    for (const [luc, ngay, ten] of CA) {
      const { d } = await mot(`select to_char(ngay_vn($1::timestamptz), 'YYYY-MM-DD') d`, [luc]);
      if (d !== ngay) sai.push(`${ten}: ${d}`);
    }
    ok(`Phiên ${tz}: 23:50 / 00:00 / 00:10 / 00:30 giờ VN ra đúng ngày VN, cả qua năm và 29/02`, sai.length === 0, sai.join(' · '));
  }
  await db.exec(`set timezone = 'UTC'`);
  const { v } = await mot(`select provolatile v from pg_proc where proname = 'ngay_vn'`);
  ok('ngay_vn() là immutable — dựng được chỉ mục theo ngày VN nếu cần', v === 'i', v);
  const { n } = await mot(`select ngay_vn(null) is null as n`);
  ok('ngay_vn(null) = null', n === true);
});

// ===========================================================================
await nhom('2 · chi_so_crm() — lượt ghé 0h–7h sáng giờ VN tính đúng ngày', async () => {
  const ghe = async (sdt, luc, tien = 500000) => {
    const { rows: [g] } = await db.query(`select * from ghi_luot_ghe($1, $2, $3::bigint)`, [cnA.id, sdt, tien]);
    await db.query(`update luot_ghe set thoi_diem = $2 where id = $1`, [g.luot_ghe_id, luc]);
    return g;
  };
  // Khách A: lần đầu 00:30 ngày 11 giờ VN (17:30 UTC ngày 10). Khách B: 23:50 ngày 10 giờ VN.
  // Khách C: 00:10 ngày 11 rồi quay lại 20:00 ngày 11 (khách mới VÀ quay lại trong ngày 11).
  await ghe('0901110001', '2026-10-10T17:30:00Z');
  await ghe('0901110002', '2026-10-10T16:50:00Z');
  await ghe('0901110003', '2026-10-10T17:10:00Z');
  await ghe('0901110003', '2026-10-11T13:00:00Z');

  const chiSo = async (tu, den) => Object.fromEntries((await db.query(
    `select chi_so, gia_tri from chi_so_crm($1, $2::date, $3::date)`, [cnA.id, tu, den])).rows.map(r => [r.chi_so, Number(r.gia_tri)]));
  const n11 = await chiSo('2026-10-11', '2026-10-11');
  const n10 = await chiSo('2026-10-10', '2026-10-10');
  ok('Ngày 11/10: 3 lượt ghé (00:10, 00:30, 20:00) — không phải 1', n11.so_luot_ghe === 3, `${n11.so_luot_ghe} lượt`);
  ok('Ngày 10/10: 1 lượt ghé (23:50) — lượt 0h–7h sáng ngày 11 không bị kéo về', n10.so_luot_ghe === 1, `${n10.so_luot_ghe} lượt`);
  ok('Tỷ lệ quay lại ngày 11: 1 trong 2 khách mới (khách C) = 50%', n11.ty_le_quay_lai_lan_2 === 50, `${n11.ty_le_quay_lai_lan_2}%`);

  // Điểm (sổ cái bất biến — ghi dòng mới, không sửa): phát 1.000 lúc 00:20 ngày 11 giờ VN, dùng 500 lúc 00:25.
  const { rows: [{ id: khA }] } = await db.query(`select id from khach_hang where sdt = '0901110001'`);
  await db.query(`insert into so_cai_diem (chi_nhanh_id, khach_hang_id, loai, so_diem, created_at)
                  values ($1, $2, 'tich', 1000, '2026-10-10T17:20:00Z'), ($1, $2, 'dung', -500, '2026-10-10T17:25:00Z')`, [cnA.id, khA]);
  const d11 = await chiSo('2026-10-11', '2026-10-11');
  const d10 = await chiSo('2026-10-10', '2026-10-10');
  ok('Điểm phát / dùng lúc 00:20 / 00:25 giờ VN tính vào ngày 11: tỷ lệ điểm được dùng ngày 11 = 50%, ngày 10 = 0%',
     d11.ty_le_diem_duoc_dung === 50 && d10.ty_le_diem_duoc_dung === 0,
     `ngày 11: ${d11.ty_le_diem_duoc_dung}% · ngày 10: ${d10.ty_le_diem_duoc_dung}%`);

  const ql = await duoi(UID.qlA, `select gia_tri from chi_so_crm(null, '2026-10-11', '2026-10-11') where chi_so = 'so_luot_ghe'`);
  ok('Quản lý gọi (RLS thu hẹp về chi nhánh mình) cũng ra 3 lượt ngày 11', ql.loi === null && Number(ql.rows?.[0]?.gia_tri) === 3, vi(ql));

  const sai = await duoi(UID.qlA, `select * from chi_so_crm(null, '2026-02-31'::date, '2026-03-01'::date)`);
  ok('Ngày không có thật (31/02) → báo lỗi, không lặng lẽ thành 03/03', sai.loi !== null && /out of range|date/i.test(sai.loi), vi(sai));
});

// ===========================================================================
await nhom('3 · BỘ DÒ (gio-utc.mjs, kiem-migration.mjs dùng) bắt <cột timestamptz>::date', async () => {
  const cacFile = readdirSync(THU_MUC).filter(f => f.endsWith('.sql')).sort();
  const vanBan = Object.fromEntries(cacFile.map(f => [f, readFileSync(join(THU_MUC, f), 'utf8')]));
  const ten = tenTimestamptz(Object.values(vanBan));
  ok('Nhận ra các cột timestamptz hay dùng (created_at, thoi_diem, gui_luc, bat_dau_luc)',
     ['created_at', 'thoi_diem', 'gui_luc', 'bat_dau_luc'].every(t => ten.has(t)));
  ok('Nhận ra bí danh min(thoi_diem) as lan_dau (chi_so_crm, 0008)', ten.has('lan_dau'));
  ok('Không coi cột date (ngay, ngay_hieu_luc, han_dung) là timestamptz',
     !['ngay', 'ngay_hieu_luc', 'han_dung'].some(t => ten.has(t)));

  const BAT = [
    'where thoi_diem::date between p_tu and p_den',
    'filter (where lan_dau::date = p_ngay)',
    'select lg.created_at :: date from luot_ghe lg',
    'group by date(created_at)',
    'where cast(gui_luc as date) = hom_nay_vn()',
    "date_trunc('day', bat_dau_luc)",
    'select current_date',
    'v := now()::date;',
    'select current_timestamp::date',
    'v := clock_timestamp()::date;',
    "group by date_trunc('month', created_at)",
    "where date_trunc('week', lg.thoi_diem) = v_tuan",
    "select to_char(created_at, 'YYYY-MM-DD')",
    "to_char(gui_luc, 'DD/MM/YYYY HH24:MI')",
  ];
  const sot = BAT.filter(c => timNgayUtc(c, ten).length === 0);
  ok(`Bắt đủ ${BAT.length} kiểu cắt ngày theo UTC`, sot.length === 0, sot.join(' | '));
  const BO_QUA = [
    'where ngay_vn(thoi_diem) between p_tu and p_den',
    "select ((created_at at time zone 'utc') + interval '7 hours')::date",
    'where ngay::date = p_ngay',
    "select '2026-01-01'::date",
    "(v_dong ->> 'han_dung')::date",
    '-- chú thích: thoi_diem::date là sai',
    'select update_at_date(x), to_date(created_at)',
    "to_char(d.ngay_giao_du_kien, 'YYYY-MM-DD')",
    "replace(to_char(v_tong, 'FM999G999G999G999'), ',', '.')",
    "date_trunc('month', (coalesce(p_luc, now()) at time zone 'utc') + interval '7 hours')",
    "to_char(ngay_vn(created_at), 'YYYY-MM-DD')",
  ];
  const nham = BO_QUA.filter(c => timNgayUtc(c, ten).length > 0);
  ok(`Không báo nhầm ${BO_QUA.length} kiểu đúng (ngay_vn, at time zone, cột date, hằng, chú thích)`, nham.length === 0, nham.join(' | '));

  const cu = timNgayUtc(vanBan['0008_siet_an_toan.sql'].slice(vanBan['0008_siet_an_toan.sql'].indexOf('create or replace function chi_so_crm')), ten);
  ok('Đọc chi_so_crm của 0008: bắt đủ ba chỗ (lan_dau, thoi_diem, created_at)',
     ['lan_dau', 'thoi_diem', 'created_at'].every(t => cu.some(c => c.startsWith(t))), cu.join(', '));
  const sau = cacFile.filter(f => Number(f.slice(0, 4)) > 8 && timNgayUtc(vanBan[f], ten).length > 0);
  ok('Mọi migration sau 0008 (kể cả 0070) sạch — kiem-migration không đỏ oan', sau.length === 0,
     sau.map(f => `${f}: ${timNgayUtc(vanBan[f], ten).join(', ')}`).join(' | '));
});

process.exit(ketThuc('CHỈ SỐ GIỜ VIỆT NAM'));
