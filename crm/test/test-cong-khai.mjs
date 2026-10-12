/**
 * BEEFTOWN CRM — Kiểm thử API công khai và đo lường (0013)
 * =======================================================
 *     node test/test-cong-khai.mjs
 *
 * Ba việc cần chứng minh:
 *   1. Mã đặt bàn THẬT SỰ duy nhất. Bản cũ lấy 6 ký tự đầu của uuid, không
 *      lưu, không ràng buộc — xác suất trùng đạt 50% ở khoảng 4.800 lượt đặt,
 *      tức là trong năm đầu tiên.
 *   2. Website không có cách nào đếm được số bàn còn trống.
 *   3. "Yêu cầu đã nhận", "nhà hàng đã xác nhận" và "khách thực đến" là ba
 *      con số riêng biệt, và hệ thống không cho phép trộn chúng.
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

async function phaiLoi(db, sql, params = []) {
  try { await db.query(sql, params); return null; }
  catch (e) { return e.message; }
}

const db = new PGlite();

console.log('\x1b[1m\nBEEFTOWN CRM — KIỂM THỬ API CÔNG KHAI VÀ ĐO LƯỜNG\x1b[0m');
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
  `insert into chi_nhanh (ma, ten, khu_vuc, dia_chi, toi_bat_dau)
   values ('q1','Beeftown Quận 1','Cầu Ông Lãnh','40–42 Nguyễn Thái Học','16:00')
   returning *`);
for (let i = 1; i <= 6; i++) {
  await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1,$2,4)`,
                 [cn.id, `B0${i}`]);
}

const uidChu = '33333333-3333-3333-3333-333333333333';
const uidMkt = '55555555-5555-5555-5555-555555555555';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,null,'Chủ sở hữu','chu_so_huu')`, [uidChu]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Marketing','marketing')`, [uidMkt, cn.id]);

// Quyền của authenticated đúng như Supabase: quyền mặc định đặt trước khi nạp migration, trừ những gì
// migration đã thu hồi. Không cấp hàng loạt ở đây — nó xoá trắng các revoke (test-quy-trinh.mjs, mục 6).

async function duoiDanhNghia(uid, sql, params = []) {
  await db.query(`delete from auth._phien`);
  if (uid) await db.query(`insert into auth._phien (uid) values ($1)`, [uid]);
  await db.exec(`set role authenticated`);
  try { return { rows: (await db.query(sql, params)).rows, loi: null }; }
  catch (e) { return { rows: null, loi: e.message }; }
  finally { await db.exec(`reset role`); }
}

async function duoiDanhNghiaAnon(sql, params = []) {
  await db.query(`delete from auth._phien`);
  await db.exec(`set role anon`);
  try { return { rows: (await db.query(sql, params)).rows, loi: null }; }
  catch (e) { return { rows: null, loi: e.message }; }
  finally { await db.exec(`reset role`); }
}

const ngayMai = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

// ===========================================================================
await nhom('1 · MÃ ĐẶT BÀN PHẢI DUY NHẤT', async () => {
  const { rows: [{ ma }] } = await db.query(`select sinh_ma_dat_ban() as ma`);
  ok('Mã dài 6 ký tự', ma.length === 6, ma);
  ok('Dùng bảng chữ dễ đọc qua điện thoại (không có 0, O, 1, I, L)',
     /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/.test(ma), ma);

  // Sinh 500 mã thật qua chỉ mục duy nhất. Bản cũ lấy tiền tố uuid nên chỉ
  // cần vài nghìn lượt là bắt đầu trùng.
  const { rows: [kh] } = await db.query(
    `select * from tim_hoac_tao_khach('0911111111','Khách kiểm thử')`);
  for (let i = 0; i < 500; i++) {
    await db.query(
      `insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, ma_dat_ban)
       values ($1,$2,$3::date,'18:00'::time,2,sinh_ma_dat_ban())`,
      [cn.id, kh.id, ngayMai]);
  }
  const { rows: [{ tong, rieng }] } = await db.query(
    `select count(*)::int as tong, count(distinct ma_dat_ban)::int as rieng
     from dat_ban where ma_dat_ban is not null`);
  ok('500 lượt đặt sinh ra 500 mã khác nhau', tong === rieng && tong >= 500,
     `${tong} lượt / ${rieng} mã`);

  ok('Chỉ mục duy nhất chặn được mã trùng',
     (await phaiLoi(db,
       `insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, ma_dat_ban)
        select chi_nhanh_id, khach_hang_id, ngay, gio, so_khach, ma_dat_ban
        from dat_ban limit 1`)) !== null);

  await db.query(`delete from dat_ban`);
});

// ===========================================================================
await nhom('2 · THÔNG TIN CHI NHÁNH — GIỜ PHẢI ĐƯỢC CHỐT MỚI CÔNG BỐ', async () => {
  const r = await duoiDanhNghiaAnon(`select * from chi_nhanh_cong_khai()`);
  ok('anon đọc được thông tin chi nhánh', r.loi === null && r.rows.length === 1, r.loi || '');

  ok('KHÔNG trả về id chi nhánh (mã mới là định danh công khai)',
     !Object.keys(r.rows[0]).includes('id'), Object.keys(r.rows[0]).join(', '));

  ok('Giờ phục vụ ẩn khi chưa chốt', r.rows[0].toi_bat_dau === null);
  ok('Có cờ báo giờ đã chốt hay chưa', r.rows[0].gio_da_chot === false);

  await db.query(
    `insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai)
     values ('gio_phuc_vu_da_chot','bool',true,'da_cong_bo')`);

  const r2 = await duoiDanhNghiaAnon(`select * from chi_nhanh_cong_khai()`);
  ok('Chốt giờ rồi thì mới hiện ra', r2.rows[0].toi_bat_dau === '16:00:00',
     r2.rows[0].toi_bat_dau);
  ok('Giờ trả về đúng giá trị đã nhập, không phải mặc định 17:00',
     r2.rows[0].toi_bat_dau !== '17:00:00');
});

// ===========================================================================
await nhom('3 · LỊCH TRỐNG KHÔNG TIẾT LỘ SỐ BÀN', async () => {
  const r = await duoiDanhNghiaAnon(
    `select * from lich_trong_theo_ma($1,$2::date)`, ['q1', ngayMai]);
  ok('anon xem được lịch theo MÃ chi nhánh', r.loi === null && r.rows.length > 0,
     r.loi || `${r.rows?.length} khung`);

  ok('KHÔNG có cột số bàn còn trống',
     !Object.keys(r.rows[0]).includes('con_trong'), Object.keys(r.rows[0]).join(', '));
  ok('Chỉ trả về CÓ/KHÔNG còn chỗ', typeof r.rows[0].con_cho === 'boolean');

  const hoaThuong = await duoiDanhNghiaAnon(
    `select * from lich_trong_theo_ma($1,$2::date)`, ['Q1', ngayMai]);
  ok('Mã chi nhánh không phân biệt hoa thường', hoaThuong.rows?.length === r.rows.length);

  // Hai hàm nhận uuid đã bị gỡ khỏi danh sách công khai.
  const demBan = await duoiDanhNghiaAnon(
    `select so_ban_con_trong($1,$2::date,'18:00'::time) as n`, [cn.id, ngayMai]);
  ok('anon KHÔNG đếm được số bàn còn trống', demBan.loi !== null);

  const theoUuid = await duoiDanhNghiaAnon(
    `select * from lich_trong_theo_ngay($1,$2::date)`, [cn.id, ngayMai]);
  ok('anon KHÔNG gọi được bản nhận uuid', theoUuid.loi !== null);

  const maLa = await duoiDanhNghiaAnon(
    `select * from lich_trong_theo_ma($1,$2::date)`, ['khong-co', ngayMai]);
  ok('Mã chi nhánh không tồn tại → trả về rỗng, không lộ lỗi',
     maLa.loi === null && maLa.rows.length === 0);
});

// ===========================================================================
await nhom('4 · TRA CỨU ĐẶT BÀN — MÃ KHÔNG BAO GIỜ ĐỦ', async () => {
  const dat = await duoiDanhNghiaAnon(
    `select * from tao_dat_ban($1,$2,$3,$4::date,$5::time,$6::smallint,null,null,true)`,
    ['q1', '0912345678', 'Nguyễn Văn An', ngayMai, '18:00', 4]);
  ok('anon đặt được bàn', dat.loi === null, dat.loi || '');
  const ma = dat.rows[0].ma_dat_ban;

  const { rows: [{ luu }] } = await db.query(
    `select ma_dat_ban as luu from dat_ban where id = $1`, [dat.rows[0].dat_ban_id]);
  ok('Mã được LƯU vào cột thật, không phải suy từ uuid', luu === ma, `${luu} vs ${ma}`);

  const saiSdt = await duoiDanhNghiaAnon(
    `select * from tra_cuu_dat_ban($1,$2,null::inet)`, [ma, '0999999999']);
  ok('Đúng mã nhưng sai số điện thoại → không trả về gì',
     saiSdt.loi === null && saiSdt.rows.length === 0);

  const dung = await duoiDanhNghiaAnon(
    `select * from tra_cuu_dat_ban($1,$2,null::inet)`, [ma, '0912345678']);
  ok('Đúng cả mã và số thì tra được', dung.rows.length === 1, `${dung.rows.length} kết quả`);

  ok('Tên trả về đã được rút gọn', dung.rows[0].ho_ten_che === 'Nguyễn V. A',
     dung.rows[0].ho_ten_che);
  ok('Số điện thoại trả về đã che giữa',
     /^\d{2}\*+\d{4}$/.test(dung.rows[0].sdt_che), dung.rows[0].sdt_che);
  ok('Không trả về số điện thoại đầy đủ',
     !Object.values(dung.rows[0]).includes('0912345678'));

  const thuongHoaThuong = await duoiDanhNghiaAnon(
    `select * from tra_cuu_dat_ban($1,$2,null::inet)`, [ma.toLowerCase(), '0912345678']);
  ok('Mã không phân biệt hoa thường', thuongHoaThuong.rows.length === 1);

  // Giới hạn dò mã.
  const ip = '203.0.113.99';
  for (let i = 0; i < 6; i++) {
    await duoiDanhNghiaAnon(`select ghi_nhat_ky_tra_cuu($1::inet,$2,false)`, [ip, 'XXXXXX']);
  }
  const bikhoa = await duoiDanhNghiaAnon(
    `select * from tra_cuu_dat_ban($1,$2,$3::inet)`, [ma, '0912345678', ip]);
  ok('Quá 6 lần thử sai từ một IP → tạm khoá',
     bikhoa.loi !== null && /tạm khoá/i.test(bikhoa.loi), bikhoa.loi || 'VẪN TRA ĐƯỢC');

  const ipKhac = await duoiDanhNghiaAnon(
    `select * from tra_cuu_dat_ban($1,$2,$3::inet)`, [ma, '0912345678', '203.0.113.100']);
  ok('IP khác không bị ảnh hưởng', ipKhac.loi === null && ipKhac.rows.length === 1);
});

// ===========================================================================
await nhom('5 · KHÁCH TỰ HỦY BÀN', async () => {
  const dat = await duoiDanhNghiaAnon(
    `select * from tao_dat_ban($1,$2,$3,$4::date,$5::time,$6::smallint)`,
    ['q1', '0922222222', 'Trần Thị Bình', ngayMai, '19:00', 2]);
  const ma = dat.rows[0].ma_dat_ban;

  const { rows: [{ n: truoc }] } = await db.query(
    `select so_ban_con_trong($1,$2::date,'19:00'::time) as n`, [cn.id, ngayMai]);

  const saiSdt = await duoiDanhNghiaAnon(
    `select huy_dat_ban($1,$2,null,null::inet) as ok`, [ma, '0999999999']);
  ok('Sai số điện thoại thì không hủy được', saiSdt.rows?.[0]?.ok === false);

  const huy = await duoiDanhNghiaAnon(
    `select huy_dat_ban($1,$2,$3,null::inet) as ok`, [ma, '0922222222', 'Bận việc']);
  ok('Đúng mã và số thì hủy được', huy.rows?.[0]?.ok === true, huy.loi || '');

  const { rows: [{ tt, ghi_chu }] } = await db.query(
    `select trang_thai as tt, ghi_chu from dat_ban where ma_dat_ban = $1`, [ma]);
  ok('Trạng thái chuyển sang da_huy', tt === 'da_huy');
  ok('Lý do hủy được ghi lại', /Bận việc/.test(ghi_chu), ghi_chu);

  const { rows: [{ n: sau }] } = await db.query(
    `select so_ban_con_trong($1,$2::date,'19:00'::time) as n`, [cn.id, ngayMai]);
  ok('Hủy xong thì trả lại chỗ trống', Number(sau) === Number(truoc) + 1,
     `${truoc} → ${sau}`);

  const huyLai = await duoiDanhNghiaAnon(
    `select huy_dat_ban($1,$2,null,null::inet) as ok`, [ma, '0922222222']);
  ok('Không hủy lại được lần hai', huyLai.loi !== null && /không huỷ được/i.test(huyLai.loi));

  // Khách đã tới thì không tự hủy được nữa.
  const dat2 = await duoiDanhNghiaAnon(
    `select * from tao_dat_ban($1,$2,$3,$4::date,$5::time,$6::smallint)`,
    ['q1', '0933333333', 'Lê Văn C', ngayMai, '20:00', 2]);
  await db.query(`update dat_ban set trang_thai='da_xac_nhan' where ma_dat_ban=$1`,
                 [dat2.rows[0].ma_dat_ban]);
  await db.query(`update dat_ban set trang_thai='da_den' where ma_dat_ban=$1`,
                 [dat2.rows[0].ma_dat_ban]);
  const huyDaDen = await duoiDanhNghiaAnon(
    `select huy_dat_ban($1,$2,null,null::inet) as ok`,
    [dat2.rows[0].ma_dat_ban, '0933333333']);
  ok('Khách đã tới rồi thì không tự hủy được', huyDaDen.loi !== null);
});

// ===========================================================================
await nhom('6 · ĐO LƯỜNG — BA CON SỐ KHÔNG ĐÁNH ĐỒNG', async () => {
  // Enum cố ý thiếu hai giá trị. Đây là chốt chặn ở tầng kiểu dữ liệu.
  const { rows: [{ cac_loai }] } = await db.query(
    `select enum_range(null::su_kien_web_loai)::text as cac_loai`);
  ok('Enum sự kiện web KHÔNG có da_xac_nhan', !cac_loai.includes('da_xac_nhan'));
  ok('Enum sự kiện web KHÔNG có da_den', !/\bda_den\b/.test(cac_loai));

  const ghi = await duoiDanhNghiaAnon(
    `select ghi_su_kien_web('xem_trang','/','11111111-1111-1111-1111-111111111111'::uuid,'q1','vi')`);
  ok('anon ghi được sự kiện', ghi.loi === null, ghi.loi || '');

  const doc = await duoiDanhNghiaAnon(`select * from su_kien_web`);
  ok('anon KHÔNG đọc được bảng sự kiện', doc.loi !== null);

  for (const l of ['mo_thuc_don', 'bam_chi_duong', 'bam_facebook', 'gui_ho_so']) {
    await duoiDanhNghiaAnon(
      `select ghi_su_kien_web($1,'/','22222222-2222-2222-2222-222222222222'::uuid,'q1','vi')`, [l]);
  }

  const loaiLa = await duoiDanhNghiaAnon(
    `select ghi_su_kien_web('loai_khong_ton_tai','/',null::uuid,'q1','vi')`);
  ok('Loại sự kiện lạ thì bỏ qua, không làm hỏng trang khách', loaiLa.loi === null);

  // Dựng phễu: 3 yêu cầu, 2 xác nhận, 1 thực đến.
  await db.query(`delete from dat_ban`);
  const { rows: [kh] } = await db.query(
    `select * from tim_hoac_tao_khach('0944444444','Khách phễu')`);
  for (const tt of ['cho_xac_nhan', 'da_xac_nhan', 'da_den']) {
    await db.query(
      `insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach,
                            ma_dat_ban, trang_thai)
       values ($1,$2,$3::date,'18:00'::time,2,sinh_ma_dat_ban(),$4)`,
      [cn.id, kh.id, ngayMai, tt]);
  }

  const phieu = await duoiDanhNghia(uidChu,
    `select chi_so, gia_tri, dien_giai from phieu_do_launch($1::date,$2::date)`,
    [ngayMai, ngayMai]);
  ok('Chủ sở hữu xem được phiếu đo', phieu.loi === null, phieu.loi || '');

  const m = Object.fromEntries(phieu.rows.map(r => [r.chi_so, Number(r.gia_tri)]));
  ok('Yêu cầu đã nhận = 3', m.yeu_cau_dat_ban === 3, String(m.yeu_cau_dat_ban));
  ok('Nhà hàng đã xác nhận = 2', m.da_xac_nhan === 2, String(m.da_xac_nhan));
  ok('Khách thực đến = 1', m.khach_da_den === 1, String(m.khach_da_den));
  ok('Ba con số KHÁC NHAU, không con số nào thay thế được con số nào',
     m.yeu_cau_dat_ban > m.da_xac_nhan && m.da_xac_nhan > m.khach_da_den);

  const giaiThich = phieu.rows.find(r => r.chi_so === 'yeu_cau_dat_ban').dien_giai;
  ok('Chú giải nói thẳng "đã nhận" không có nghĩa là đã có bàn',
     /KHÔNG có nghĩa là đã có bàn/i.test(giaiThich), giaiThich);

  const mkt = await duoiDanhNghia(uidMkt, `select * from phieu_do_launch()`);
  ok('Marketing xem được phiếu đo', mkt.loi === null);

  const khongQuyen = await duoiDanhNghiaAnon(`select * from phieu_do_launch()`);
  ok('anon KHÔNG xem được phiếu đo', khongQuyen.loi !== null);
});

// ===========================================================================
await nhom('7 · LƯU TRỮ DỮ LIỆU ĐO LƯỜNG', async () => {
  const { rows: cot } = await db.query(
    `select column_name from information_schema.columns
     where table_name = 'su_kien_web'`);
  const ten = cot.map(r => r.column_name);
  ok('Bảng sự kiện KHÔNG lưu địa chỉ IP', !ten.includes('ip'), ten.join(', '));
  ok('Chỉ lưu mã phiên ngẫu nhiên', ten.includes('phien_id'));

  await db.query(
    `insert into su_kien_web (loai, ngay) values ('xem_trang', hom_nay_vn() - 100)`);
  const { rows: [{ n }] } = await db.query(`select don_dep_su_kien_web() as n`);
  ok('Dọn được sự kiện quá 90 ngày', Number(n) === 1, `${n} dòng`);
});

// ===========================================================================
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA API CÔNG KHAI ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
process.exit(hong === 0 ? 0 : 1);
