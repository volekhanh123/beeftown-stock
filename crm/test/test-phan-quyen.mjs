/**
 * BEEFTOWN CRM — Kiểm thử phân quyền (RLS)
 * ========================================
 * Đây là bài test QUAN TRỌNG NHẤT về bảo mật: chứng minh nhân sự chi nhánh A
 * KHÔNG đọc được dữ liệu chi nhánh B.
 *
 *     node test/test-phan-quyen.mjs
 *
 * Lưu ý kỹ thuật: superuser BỎ QUA mọi chính sách RLS, nên phải tạo một vai
 * trò thường rồi `set role` sang đó. Nếu chỉ test bằng superuser thì mọi
 * chính sách đều "đạt" một cách giả tạo.
 */

import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

let dat = 0, hong = 0;
const loi = [];

function ok(ten, dieuKien, chiTiet = '') {
  if (dieuKien) { dat++; console.log(`  \x1b[32m✓\x1b[0m ${ten}`); }
  else {
    hong++; loi.push(ten + (chiTiet ? ` — ${chiTiet}` : ''));
    console.log(`  \x1b[31m✗ ${ten}\x1b[0m${chiTiet ? ` — ${chiTiet}` : ''}`);
  }
}

const db = new PGlite();

console.log('\x1b[1m\nBEEFTOWN CRM — KIỂM THỬ PHÂN QUYỀN (RLS)\x1b[0m');
console.log('='.repeat(60));

// ---------------------------------------------------------------------------
// Mô phỏng môi trường Supabase: schema auth + vai trò anon/authenticated
// ---------------------------------------------------------------------------
await db.exec(`
  create schema if not exists auth;
  create table if not exists auth._phien (uid uuid);
  create or replace function auth.uid() returns uuid
    language sql stable as $$ select uid from auth._phien limit 1 $$;

  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin;
  grant usage on schema public to anon, authenticated, service_role;

  -- QUAN TRỌNG: mô phỏng QUYỀN MẶC ĐỊNH của Supabase.
  -- Supabase cấp sẵn mọi bảng/hàm/sequence mới cho anon và authenticated.
  -- PGlite thì không cấp gì cả — nên nếu thiếu khối này, MỌI khẳng định
  -- "anon không làm được X" trong file này đều đúng một cách RỖNG: đúng vì
  -- PGlite keo kiệt, không phải vì schema an toàn. Lỗ hổng quyền thực thi hàm
  -- (0008 mục 1) không thể tái hiện nếu thiếu mấy dòng này.
  --
  -- Phải đặt TRƯỚC vòng chạy migration thì default privileges mới áp lên các
  -- đối tượng do migration tạo ra.
  alter default privileges in schema public grant all on tables    to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
`);

for (const f of readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(MIGRATIONS_DIR, f), 'utf8'));
}
console.log('\n\x1b[1m1 · CHUẨN BỊ\x1b[0m');
ok('Nạp xong toàn bộ migration', true);

// ---------------------------------------------------------------------------
// Hai chi nhánh, mỗi bên một nhân sự và một khách riêng
// ---------------------------------------------------------------------------
const { rows: [cnA] } = await db.query(
  `insert into chi_nhanh (ma, ten) values ('q1','Beeftown Quận 1') returning *`);
const { rows: [cnB] } = await db.query(
  `insert into chi_nhanh (ma, ten) values ('q7','Beeftown Quận 7') returning *`);

for (const cn of [cnA, cnB]) {
  await db.query(
    `insert into cau_hinh_tich_diem (chi_nhanh_id, dang_bat) values ($1, true)`, [cn.id]);
}

const uidA = '11111111-1111-1111-1111-111111111111';
const uidB = '22222222-2222-2222-2222-222222222222';
const uidChu = '33333333-3333-3333-3333-333333333333';

await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Quản lý Q1','quan_ly')`, [uidA, cnA.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Quản lý Q7','quan_ly')`, [uidB, cnB.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,null,'Chủ sở hữu','chu_so_huu')`, [uidChu]);

// Mỗi chi nhánh một khách đã ăn
const { rows: [khA] } = await db.query(
  `select * from tim_hoac_tao_khach('0911111111','Khách của Q1')`);
const { rows: [khB] } = await db.query(
  `select * from tim_hoac_tao_khach('0922222222','Khách của Q7')`);
await db.query(`select * from ghi_luot_ghe($1,$2,290000::bigint)`, [cnA.id, '0911111111']);
await db.query(`select * from ghi_luot_ghe($1,$2,290000::bigint)`, [cnB.id, '0922222222']);

ok('Dựng 2 chi nhánh, 3 nhân sự, 2 khách', true);

// Cấp quyền bảng cho `authenticated` — RLS mới là lớp lọc, không phải GRANT
await db.exec(`
  grant usage on schema public to authenticated;
  grant select, insert, update on all tables in schema public to authenticated;
  grant execute on all functions in schema public to authenticated;
`);

/** Chạy truy vấn dưới danh nghĩa một nhân sự cụ thể (không phải superuser) */
async function duoiDanhNghia(uid, sql, params = []) {
  await db.query(`delete from auth._phien`);
  if (uid) await db.query(`insert into auth._phien (uid) values ($1)`, [uid]);
  await db.exec(`set role authenticated`);
  try {
    return { rows: (await db.query(sql, params)).rows, loi: null };
  } catch (e) {
    return { rows: null, loi: e.message };
  } finally {
    await db.exec(`reset role`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n\x1b[1m2 · RLS CÓ THỰC SỰ ĐANG BẬT KHÔNG\x1b[0m');
// ---------------------------------------------------------------------------
const { rows: rlsRows } = await db.query(`
  select tablename, rowsecurity from pg_tables
  where schemaname = 'public' order by tablename`);
const tatRls = rlsRows.filter(r => !r.rowsecurity).map(r => r.tablename);
ok('Mọi bảng đều bật RLS', tatRls.length === 0,
   tatRls.length ? `chưa bật: ${tatRls.join(', ')}` : '');

// Chốt chặn: nếu `set role` không có tác dụng thì mọi test sau đều vô nghĩa
const thu = await duoiDanhNghia(uidA, `select current_user as u`);
ok('Chuyển được sang vai trò thường (không còn superuser)',
   thu.rows?.[0]?.u === 'authenticated', `current_user = ${thu.rows?.[0]?.u}`);

// ---------------------------------------------------------------------------
console.log('\n\x1b[1m3 · TÁCH DỮ LIỆU GIỮA HAI CHI NHÁNH\x1b[0m');
// ---------------------------------------------------------------------------
const ghéA = await duoiDanhNghia(uidA, `select chi_nhanh_id from luot_ghe`);
ok('Q1 chỉ thấy lượt ghé của Q1',
   ghéA.rows?.length === 1 && ghéA.rows[0].chi_nhanh_id === cnA.id,
   `thấy ${ghéA.rows?.length} dòng`);

const ghéB = await duoiDanhNghia(uidB, `select chi_nhanh_id from luot_ghe`);
ok('Q7 chỉ thấy lượt ghé của Q7',
   ghéB.rows?.length === 1 && ghéB.rows[0].chi_nhanh_id === cnB.id,
   `thấy ${ghéB.rows?.length} dòng`);

const ghéChu = await duoiDanhNghia(uidChu, `select chi_nhanh_id from luot_ghe`);
ok('Chủ sở hữu thấy cả hai chi nhánh', ghéChu.rows?.length === 2,
   `thấy ${ghéChu.rows?.length} dòng`);

// Khách hàng
const khachA = await duoiDanhNghia(uidA, `select sdt from khach_hang order by sdt`);
ok('Q1 chỉ thấy khách từng tới Q1',
   khachA.rows?.length === 1 && khachA.rows[0].sdt === '0911111111',
   `thấy: ${khachA.rows?.map(r => r.sdt).join(', ')}`);

const khachChu = await duoiDanhNghia(uidChu, `select sdt from khach_hang`);
ok('Chủ sở hữu thấy toàn bộ tệp khách', khachChu.rows?.length === 2,
   `thấy ${khachChu.rows?.length} khách`);

// Sổ cái điểm
const diemA = await duoiDanhNghia(uidA, `select chi_nhanh_id from so_cai_diem`);
ok('Q1 chỉ thấy sổ cái điểm của Q1',
   diemA.rows?.every(r => r.chi_nhanh_id === cnA.id),
   `thấy ${diemA.rows?.length} dòng`);

// Nhắm thẳng vào dữ liệu chi nhánh kia
const nhamB = await duoiDanhNghia(uidA,
  `select count(*)::int as n from luot_ghe where chi_nhanh_id = $1`, [cnB.id]);
ok('Q1 cố truy vấn thẳng dữ liệu Q7 → trả về rỗng',
   Number(nhamB.rows?.[0]?.n) === 0, `đếm được ${nhamB.rows?.[0]?.n}`);

// ---------------------------------------------------------------------------
console.log('\n\x1b[1m4 · PHÂN QUYỀN THEO VAI TRÒ\x1b[0m');
// ---------------------------------------------------------------------------
const uidMkt = '44444444-4444-4444-4444-444444444444';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Marketing Q1','marketing')`, [uidMkt, cnA.id]);

const mktGhiDiem = await duoiDanhNghia(uidMkt,
  `insert into so_cai_diem (chi_nhanh_id, khach_hang_id, loai, so_diem)
   values ($1,$2,'dieu_chinh',100000)`, [cnA.id, khA.id]);
ok('Marketing KHÔNG ghi được sổ cái điểm', mktGhiDiem.loi !== null,
   mktGhiDiem.loi ? '' : 'đã ghi được — chính sách hở!');

const mktDocKhach = await duoiDanhNghia(uidMkt, `select sdt from khach_hang`);
ok('Marketing vẫn đọc được khách của chi nhánh mình',
   mktDocKhach.rows?.length === 1);

// Quản lý chi nhánh không được đổi tỷ lệ tích điểm (ảnh hưởng biên lợi nhuận)
const qlSuaTyLe = await duoiDanhNghia(uidA,
  `update cau_hinh_tich_diem set ty_le_tich = 0.10 where chi_nhanh_id = $1`, [cnA.id]);
const { rows: [tyLeSau] } = await db.query(
  `select ty_le_tich from cau_hinh_tich_diem where chi_nhanh_id = $1`, [cnA.id]);
ok('Quản lý chi nhánh KHÔNG đổi được tỷ lệ tích điểm',
   Number(tyLeSau.ty_le_tich) === 0.03,
   `tỷ lệ hiện tại: ${tyLeSau.ty_le_tich}`);

// ---------------------------------------------------------------------------
console.log('\n\x1b[1m5 · NGƯỜI CHƯA ĐĂNG NHẬP\x1b[0m');
// ---------------------------------------------------------------------------
const khongDangNhap = await duoiDanhNghia(null, `select count(*)::int as n from khach_hang`);
ok('Không đăng nhập → không đọc được khách hàng',
   Number(khongDangNhap.rows?.[0]?.n ?? 0) === 0,
   `đọc được ${khongDangNhap.rows?.[0]?.n} khách`);

const khongDangNhapDiem = await duoiDanhNghia(null, `select count(*)::int as n from so_cai_diem`);
ok('Không đăng nhập → không đọc được sổ cái điểm',
   Number(khongDangNhapDiem.rows?.[0]?.n ?? 0) === 0);

// Nhân sự đã nghỉ việc
const uidNghi = '55555555-5555-5555-5555-555555555555';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
                values ($1,$2,'Đã nghỉ việc','quan_ly',false)`, [uidNghi, cnA.id]);
const daNghi = await duoiDanhNghia(uidNghi, `select count(*)::int as n from khach_hang`);
ok('Nhân sự đã nghỉ việc → mất sạch quyền',
   Number(daNghi.rows?.[0]?.n ?? 0) === 0,
   `đọc được ${daNghi.rows?.[0]?.n} khách`);

// ---------------------------------------------------------------------------
console.log('\n\x1b[1m6 · WEBSITE CÔNG KHAI (anon)\x1b[0m');
// ---------------------------------------------------------------------------
async function duoiDanhNghiaAnon(sql, params = []) {
  await db.query(`delete from auth._phien`);
  await db.exec(`set role anon`);
  try { return { rows: (await db.query(sql, params)).rows, loi: null }; }
  catch (e) { return { rows: null, loi: e.message }; }
  finally { await db.exec(`reset role`); }
}

const anonDocKhach = await duoiDanhNghiaAnon(`select * from khach_hang`);
ok('anon KHÔNG đọc được bảng khách hàng', anonDocKhach.loi !== null,
   anonDocKhach.loi ? '' : 'đọc được — nguy hiểm!');

const anonDocDiem = await duoiDanhNghiaAnon(`select * from so_cai_diem`);
ok('anon KHÔNG đọc được sổ cái điểm', anonDocDiem.loi !== null);

await db.query(`insert into ban_an (chi_nhanh_id, ten) values ($1,'B01')`, [cnA.id]);
const ngayMai = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

// 0013 gỡ hai hàm nhận uuid khỏi danh sách công khai:
//   · anon không có cách nào lấy được uuid chi nhánh (không đọc được bảng);
//   · so_ban_con_trong() trả về SỐ bàn còn trống, là một oracle sức chứa —
//     một script tầm thường có thể dò để biết nhà hàng còn bao nhiêu chỗ.
// Website dùng lich_trong_theo_ma(), chỉ trả về CÓ/KHÔNG còn chỗ.
const anonXemLich = await duoiDanhNghiaAnon(
  `select * from lich_trong_theo_ma($1,$2::date)`, ['q1', ngayMai]);
ok('anon xem được lịch trống (hàm công khai)',
   anonXemLich.loi === null && anonXemLich.rows.length > 0,
   anonXemLich.loi ?? '');
ok('Lịch công khai KHÔNG trả về số bàn còn trống',
   anonXemLich.rows != null
   && !Object.keys(anonXemLich.rows[0] ?? {}).includes('con_trong'),
   Object.keys(anonXemLich.rows?.[0] ?? {}).join(', '));

const anonDoSucChua = await duoiDanhNghiaAnon(
  `select so_ban_con_trong($1,$2::date,'18:00'::time) as n`, [cnA.id, ngayMai]);
ok('anon KHÔNG đếm được số bàn còn trống', anonDoSucChua.loi !== null);

const anonDatBan = await duoiDanhNghiaAnon(
  `select * from tao_dat_ban($1,$2,$3,$4::date,$5::time,$6::smallint,null,null,true)`,
  ['q1', '0933333333', 'Khách Web', ngayMai, '18:00', 2]);
ok('anon đặt được bàn qua hàm công khai',
   anonDatBan.loi === null && anonDatBan.rows?.[0]?.dat_ban_id != null,
   anonDatBan.loi ?? '');

// ---------------------------------------------------------------------------
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA PHÂN QUYỀN ĐỀU ĐẠT\x1b[0m\n`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} KIỂM TRA HỎNG\x1b[0m (đạt ${dat})\n`);
  loi.forEach(l => console.log(`  · ${l}`));
  console.log('');
}
await db.close();
process.exit(hong === 0 ? 0 : 1);
