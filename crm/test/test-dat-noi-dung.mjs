/**
 * BEEFTOWN CRM — Kiểm thử dat_noi_dung() / thu_hoi_noi_dung() (0015)
 * ==================================================================
 * Hai hàm này tồn tại vì MỘT lý do: gộp bốn câu lệnh thành một giao dịch, để
 * một chiếc điện thoại mất sóng giữa chừng không bỏ trang chủ ở trạng thái
 * lưng chừng.
 *
 *     node test/test-dat-noi-dung.mjs
 *
 * Nên bài test quan trọng nhất ở đây là mục 3: người KHÔNG đủ quyền công bố
 * gọi hàm với p_cong_bo = true, và sau khi hàm ném lỗi thì giá trị ĐANG SỐNG
 * phải còn nguyên. Nếu giao dịch không cuốn ngược, câu lệnh thu hồi ở đầu
 * hàm đã kịp gỡ dữ kiện cũ xuống — và cả file này mất lý do tồn tại.
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

async function nhom(ten, fn) {
  console.log(`\n\x1b[1m${ten}\x1b[0m`);
  try { await fn(); }
  catch (e) { ok(`${ten} chạy được đến cuối`, false, e.message); }
}

const db = new PGlite();

console.log('\x1b[1m\nBEEFTOWN CRM — KIỂM THỬ ĐẶT NỘI DUNG\x1b[0m');
console.log('='.repeat(60));

await db.exec(`
  create schema if not exists auth;
  create table if not exists auth._phien (uid uuid);
  create or replace function auth.uid() returns uuid
    language sql stable as $$ select uid from auth._phien limit 1 $$;

  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public to anon, authenticated;

  alter default privileges in schema public grant all on tables    to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);

for (const f of readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(MIGRATIONS_DIR, f), 'utf8'));
}

const { rows: [cn] } = await db.query(
  `insert into chi_nhanh (ma, ten) values ('q1','Beeftown Quận 1') returning *`);

const uidChu = '33333333-3333-3333-3333-333333333333';
const uidQl  = '11111111-1111-1111-1111-111111111111';
const uidMkt = '22222222-2222-2222-2222-222222222222';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,null,'Chủ sở hữu','chu_so_huu')`, [uidChu]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Quản lý Q1','quan_ly')`, [uidQl, cn.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Bạn Marketing','marketing')`, [uidMkt, cn.id]);

await db.exec(`
  grant select, insert, update, delete on all tables in schema public to authenticated;
  grant execute on all functions in schema public to authenticated;
`);

async function duoiDanhNghia(uid, sql, params = []) {
  await db.query(`delete from auth._phien`);
  if (uid) await db.query(`insert into auth._phien (uid) values ($1)`, [uid]);
  await db.exec(`set role authenticated`);
  try { return { rows: (await db.query(sql, params)).rows, loi: null }; }
  catch (e) { return { rows: null, loi: e.message }; }
  finally { await db.exec(`reset role`); }
}

/** Giá trị đang được công bố cho một khóa, đọc qua đúng cửa mà website dùng. */
async function trenTrang(khoa) {
  const { rows: [r] } = await db.query(`select noi_dung_cong_khai('vi') -> $1 as v`, [khoa]);
  return r.v;
}

// ===========================================================================
await nhom('1 · ĐẶT MỘT DỮ KIỆN', async () => {
  const r = await duoiDanhNghia(uidChu,
    `select dat_noi_dung('dia_chi_hien_thi', p_text := $1, p_cong_bo := true) as id`,
    ['40–42 Nguyễn Thái Học']);
  ok('Chủ sở hữu công bố được địa chỉ trong một lần gọi', r.loi === null, r.loi ?? '');
  ok('Địa chỉ hiện ra trên trang công khai',
     (await trenTrang('dia_chi_hien_thi')) === '40–42 Nguyễn Thái Học');

  const { rows } = await db.query(
    `select trang_thai, nguoi_tao, nguoi_duyet, cong_bo_luc, duyet_luc
     from noi_dung_cong_bo where khoa='dia_chi_hien_thi'`);
  ok('Chỉ tạo đúng một dòng', rows.length === 1, `${rows.length} dòng`);
  ok('Dòng ở trạng thái da_cong_bo', rows[0]?.trang_thai === 'da_cong_bo');
  ok('Có ghi ai soạn và ai duyệt',
     rows[0]?.nguoi_tao !== null && rows[0]?.nguoi_duyet !== null);
  ok('Có đủ mốc thời gian duyệt và công bố',
     rows[0]?.duyet_luc !== null && rows[0]?.cong_bo_luc !== null);

  // Kiểu 'ngay' phải vào đúng cột ngày, không phải cột text.
  await duoiDanhNghia(uidChu,
    `select dat_noi_dung('ngay_khai_truong', p_ngay := $1::date, p_cong_bo := true)`,
    ['2026-12-01']);
  const { rows: [ng] } = await db.query(
    `select gia_tri_ngay, gia_tri_text from noi_dung_cong_bo
     where khoa='ngay_khai_truong' and trang_thai='da_cong_bo'`);
  ok('Khóa kiểu ngày lưu vào cột ngày, cột text để trống',
     ng?.gia_tri_ngay !== null && ng?.gia_tri_text === null);
});

// ===========================================================================
await nhom('2 · LƯU NHÁP KHÔNG LÊN TRANG', async () => {
  const r = await duoiDanhNghia(uidMkt,
    `select dat_noi_dung('dong_trang_thai', p_text := $1, p_text_en := $2) as id`,
    ['Beeftown sắp mở cửa', 'Beeftown is opening soon']);
  ok('Marketing lưu được bản nháp', r.loi === null, r.loi ?? '');
  ok('Bản nháp KHÔNG xuất hiện trên trang công khai',
     (await trenTrang('dong_trang_thai')) === null);

  const { rows: [d] } = await db.query(
    `select trang_thai, gia_tri_text_en from noi_dung_cong_bo where khoa='dong_trang_thai'`);
  ok('Trạng thái là nhap', d?.trang_thai === 'nhap');
  ok('Bản tiếng Anh được lưu kèm', d?.gia_tri_text_en === 'Beeftown is opening soon');
});

// ===========================================================================
await nhom('3 · GIAO DỊCH CUỐN NGƯỢC — lý do tồn tại của 0015', async () => {
  // Trước khi thử: địa chỉ đang sống và đang hiện trên trang.
  const truoc = await trenTrang('dia_chi_hien_thi');
  ok('Điểm xuất phát: địa chỉ đang hiện trên trang', truoc === '40–42 Nguyễn Thái Học');

  // Marketing KHÔNG có quyền công bố (trigger của 0010 chặn ở nấc
  // da_duyet → da_cong_bo). Hàm sẽ ném lỗi — nhưng trước đó nó đã chạy câu
  // lệnh thu hồi bản cũ. Không có giao dịch thì địa chỉ đã biến mất.
  const r = await duoiDanhNghia(uidMkt,
    `select dat_noi_dung('dia_chi_hien_thi', p_text := $1, p_cong_bo := true)`,
    ['Địa chỉ do marketing tự đổi']);
  ok('Marketing KHÔNG công bố được', r.loi !== null && /quyền/i.test(r.loi ?? ''),
     r.loi ?? 'không có lỗi');

  const sau = await trenTrang('dia_chi_hien_thi');
  ok('ĐỊA CHỈ CŨ CÒN NGUYÊN TRÊN TRANG sau khi hàm ném lỗi', sau === truoc,
     `trước: ${truoc} · sau: ${sau}`);

  const { rows } = await db.query(
    `select count(*) as n from noi_dung_cong_bo where khoa='dia_chi_hien_thi'`);
  ok('Không để lại dòng rác nào', Number(rows[0].n) === 1, `${rows[0].n} dòng`);

  // Khóa không có trong sổ đăng ký: lỗi ngay, không âm thầm bỏ qua.
  const rSai = await duoiDanhNghia(uidChu,
    `select dat_noi_dung('khoa_khong_ton_tai', p_text := 'x', p_cong_bo := true)`);
  ok('Gõ sai tên khóa là lỗi ngay lúc ghi',
     rSai.loi !== null && /không có khóa/i.test(rSai.loi ?? ''), rSai.loi ?? '');
});

// ===========================================================================
await nhom('4 · ĐỔI GIÁ TRỊ — bản cũ tự thu hồi', async () => {
  const r = await duoiDanhNghia(uidChu,
    `select dat_noi_dung('ngay_khai_truong', p_ngay := $1::date, p_ly_do := $2, p_cong_bo := true)`,
    ['2026-12-15', 'Nội thất chậm hai tuần']);
  ok('Đổi được ngày khai trương', r.loi === null, r.loi ?? '');
  ok('Trang hiện ngày MỚI', (await trenTrang('ngay_khai_truong')) === '2026-12-15');

  const { rows } = await db.query(
    `select trang_thai, gia_tri_ngay, ly_do from noi_dung_cong_bo
     where khoa='ngay_khai_truong' order by created_at`);
  ok('Có hai dòng — bản cũ vẫn còn để đối chiếu', rows.length === 2, `${rows.length} dòng`);
  ok('Bản cũ chuyển sang da_thu_hoi', rows[0]?.trang_thai === 'da_thu_hoi');
  ok('Chỉ một bản đang sống',
     rows.filter(x => x.trang_thai === 'da_cong_bo').length === 1);
  ok('Lý do đổi được lưu lại', rows[1]?.ly_do === 'Nội thất chậm hai tuần');
});

// ===========================================================================
await nhom('5 · THU HỒI — một nút khi có sự cố', async () => {
  const r = await duoiDanhNghia(uidChu,
    `select thu_hoi_noi_dung('ngay_khai_truong', 'Chưa có giấy ATTP') as xong`);
  ok('Thu hồi chạy được', r.loi === null, r.loi ?? '');
  ok('Trả về true vì có bản đang sống để gỡ', r.rows?.[0]?.xong === true);
  ok('NGÀY BIẾN MẤT KHỎI TRANG ngay lập tức',
     (await trenTrang('ngay_khai_truong')) === null);

  const r2 = await duoiDanhNghia(uidChu,
    `select thu_hoi_noi_dung('ngay_khai_truong') as xong`);
  ok('Thu hồi lần hai trả về false, không ném lỗi',
     r2.loi === null && r2.rows?.[0]?.xong === false);

  // Thu hồi rồi vẫn công bố lại được — đây là đường quay lui khi báo động nhầm.
  const r3 = await duoiDanhNghia(uidChu,
    `select dat_noi_dung('ngay_khai_truong', p_ngay := $1::date, p_cong_bo := true)`,
    ['2026-12-15']);
  ok('Công bố lại được sau khi thu hồi', r3.loi === null, r3.loi ?? '');
  ok('Ngày quay lại trên trang', (await trenTrang('ngay_khai_truong')) === '2026-12-15');
});

// ===========================================================================
await nhom('6 · VIEW BẢNG CÔNG TẮC', async () => {
  const r = await duoiDanhNghia(uidChu, `select * from v_bang_cong_tac order by thu_tu`);
  ok('Quản trị đọc được bảng công tắc', r.loi === null, r.loi ?? '');
  ok('Trả về ĐỦ mọi khóa trong sổ đăng ký, kể cả khóa chưa công bố',
     (r.rows?.length ?? 0) >= 20, `${r.rows?.length} khóa`);

  const diaChi = r.rows?.find(x => x.khoa === 'dia_chi_hien_thi');
  ok('Khóa đã công bố có dang_song = true và kèm giá trị',
     diaChi?.dang_song === true && diaChi?.gia_tri_text === '40–42 Nguyễn Thái Học');

  const chuaCo = r.rows?.find(x => x.khoa === 'hotline');
  ok('Khóa chưa công bố có dang_song = false', chuaCo?.dang_song === false);
  ok('Mỗi khóa kèm mô tả cho người không rành kỹ thuật',
     r.rows?.every(x => typeof x.mo_ta === 'string' && x.mo_ta.length > 0));

  // View phải chạy dưới quyền người gọi, nếu không nó là một đường vòng qua RLS.
  const { rows: [v] } = await db.query(`
    select coalesce((select option_value from pg_options_to_table(c.reloptions)
                     where option_name = 'security_invoker'), 'false') as si
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='v_bang_cong_tac'`);
  ok('v_bang_cong_tac chạy dưới quyền người gọi', v?.si === 'true', `security_invoker=${v?.si}`);
});

// ===========================================================================
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA ĐẶT NỘI DUNG ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
await db.close();
process.exit(hong === 0 ? 0 : 1);
