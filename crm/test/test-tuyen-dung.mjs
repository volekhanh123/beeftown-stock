/**
 * BEEFTOWN CRM — Kiểm thử tuyển dụng (0012)
 * =========================================
 * Bất biến quan trọng nhất: anon NỘP được hồ sơ và TUYỆT ĐỐI không ĐỌC được
 * hồ sơ nào — kể cả hồ sơ của chính mình, kể cả khi biết đúng mã.
 *
 *     node test/test-tuyen-dung.mjs
 *
 * Hồ sơ ứng tuyển là dữ liệu cá nhân của người CHƯA phải khách hàng. Nghị
 * định 13/2023 áp dụng đầy đủ, nên mục 5 kiểm cả phần lưu trữ và ẩn danh.
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

console.log('\x1b[1m\nBEEFTOWN CRM — KIỂM THỬ TUYỂN DỤNG\x1b[0m');
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

const { rows: [cnA] } = await db.query(
  `insert into chi_nhanh (ma, ten) values ('q1','Beeftown Quận 1') returning *`);
const { rows: [cnB] } = await db.query(
  `insert into chi_nhanh (ma, ten) values ('q7','Beeftown Quận 7') returning *`);

const uidChu = '33333333-3333-3333-3333-333333333333';
const uidQlA = '11111111-1111-1111-1111-111111111111';
const uidQlB = '22222222-2222-2222-2222-222222222222';
const uidThuNgan = '44444444-4444-4444-4444-444444444444';
const uidMkt = '55555555-5555-5555-5555-555555555555';

await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,null,'Chủ sở hữu','chu_so_huu')`, [uidChu]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Quản lý Q1','quan_ly')`, [uidQlA, cnA.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Quản lý Q7','quan_ly')`, [uidQlB, cnB.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Thu ngân Q1','thu_ngan')`, [uidThuNgan, cnA.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Marketing Q1','marketing')`, [uidMkt, cnA.id]);

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

async function duoiDanhNghiaAnon(sql, params = []) {
  await db.query(`delete from auth._phien`);
  await db.exec(`set role anon`);
  try { return { rows: (await db.query(sql, params)).rows, loi: null }; }
  catch (e) { return { rows: null, loi: e.message }; }
  finally { await db.exec(`reset role`); }
}

// Khởi tạo 8 tin mẫu cho chi nhánh Q1 — trong vận hành thật, đây là một bước
// trong danh sách cài đặt ban đầu.
await db.query(`select tao_tin_tuyen_dung_mau($1)`, [cnA.id]);

// Bật cổng tuyển dụng và đăng một tin đầy đủ.
await db.query(
  `insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai)
   values ('hien_tuyen_dung', 'bool', true, 'da_cong_bo')`);

await db.query(
  `update vi_tri_tuyen_dung
   set mo_ta_vi = 'Phục vụ khách tại sảnh, hướng dẫn khách nướng lượt đầu.',
       yeu_cau_vi = 'Chăm chỉ, giao tiếp tốt. Không cần kinh nghiệm.',
       ca_lam = 'Ca sáng 10:00–14:00 hoặc ca tối 16:00–22:00',
       trang_thai = 'da_cong_bo'
   where ma = 'nhan-vien-sanh'`);

/** Nộp hồ sơ dưới danh nghĩa anon, như website thật sẽ làm. */
async function nopHoSo(viTri, hoTen, sdt, thang = {}) {
  return duoiDanhNghiaAnon(
    `select nop_ho_so_ung_tuyen(
       $1, $2, $3, $4, $5::smallint, $6, $7, $8::text[],
       $9::uuid, $10, $11, $12, $13::int, $14, $15, $16::inet) as ma`,
    [viTri, hoTen, sdt, thang.email ?? null, thang.namSinh ?? null,
     thang.gioiThieu ?? null, thang.kinhNghiem ?? null, thang.caLam ?? null,
     thang.maVe ?? null, thang.tenTep ?? null, thang.dongY ?? true,
     thang.bay ?? null, thang.giay ?? 30,
     thang.utmSource ?? null, thang.utmCampaign ?? null, thang.ip ?? null]);
}

// ===========================================================================
await nhom('1 · TIN TUYỂN DỤNG CÔNG KHAI', async () => {
  const { rows: [{ n: soTin }] } = await db.query(
    `select count(*)::int as n from vi_tri_tuyen_dung`);
  ok('Seed đủ 8 vị trí theo tài liệu vận hành', soTin === 8, `${soTin} vị trí`);

  // 0026: không phải vị trí nào cũng cần CV. Quản lý và marketing thì có;
  // phục vụ, phụ bếp nộp từ điện thoại và hầu như không có file CV.
  const { rows: coCv } = await db.query(
    `select ma from vi_tri_tuyen_dung where hoi_cv order by ma`);
  ok('Tin mẫu: chỉ quản lý, tổ trưởng và marketing hỏi CV',
     coCv.map(r => r.ma).join(',') ===
       'dau-moi-marketing,quan-ly-cua-hang,quan-ly-sanh,to-truong-sanh',
     coCv.map(r => r.ma).join(', '));

  const { rows: [{ n: tatBot }] } = await db.query(
    `select count(*)::int as n from vi_tri_tuyen_dung
     where not (hoi_email and hoi_nam_sinh and hoi_ca_lam and hoi_gioi_thieu and hoi_kinh_nghiem)`);
  ok('Tin mẫu: các trường khác vẫn hỏi như trước', tatBot === 0, `${tatBot} tin tắt bớt`);

  const { rows: [{ n: coLuong }] } = await db.query(
    `select count(*)::int as n from vi_tri_tuyen_dung
     where luong_tu is not null or luong_den is not null or luong_da_duyet`);
  ok('KHÔNG seed bảng lương (nằm trong tài liệu mật)', coLuong === 0, `${coLuong} vị trí có lương`);

  const { rows: cong } = await duoiDanhNghiaAnon(`select * from tin_tuyen_dung_cong_khai()`);
  ok('anon xem được tin đã đăng', cong.length === 1 && cong[0].ma === 'nhan-vien-sanh',
     `${cong.length} tin`);
  ok('Tin trả về mô tả và yêu cầu', cong[0].mo_ta?.length > 10 && cong[0].yeu_cau?.length > 10);
  ok('Lương trả về null khi chưa duyệt', cong[0].luong_tu === null);
  ok('Tin trả về công tắc từng trường cho form',
     cong[0].hoi_cv === false && cong[0].hoi_email === true,
     `hoi_cv=${cong[0].hoi_cv} · hoi_email=${cong[0].hoi_email}`);

  ok('Không đăng được tin thiếu mô tả',
     (await phaiLoi(db,
       `update vi_tri_tuyen_dung set trang_thai='da_cong_bo' where ma='nhan-vien-bep'`)) !== null);

  ok('Đặt lương mà quên bật cờ duyệt → bị chặn',
     (await phaiLoi(db,
       `update vi_tri_tuyen_dung set luong_tu = 6000000 where ma='nhan-vien-sanh'`)) !== null);

  ok('Đề xuất lương thì làm được bình thường',
     (await phaiLoi(db,
       `update vi_tri_tuyen_dung set luong_de_xuat_tu = 6000000, luong_de_xuat_den = 8000000
        where ma='nhan-vien-sanh'`)) === null);
});

// ===========================================================================
await nhom('2 · NỘP HỒ SƠ — CỬA DUY NHẤT CỦA ANON', async () => {
  const r = await nopHoSo('nhan-vien-sanh', 'Nguyễn Văn A', '0912345678',
                          { ip: '203.0.113.10', namSinh: 2000 });
  ok('anon nộp được hồ sơ', r.loi === null, r.loi || '');
  ok('Trả về mã hồ sơ đúng định dạng BT-UV-YYMM-xxxxx',
     /^BT-UV-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/.test(r.rows?.[0]?.ma),
     r.rows?.[0]?.ma);

  const r2 = await nopHoSo('nhan-vien-bep', 'Trần Thị B', '0912345679');
  ok('KHÔNG nộp được vào tin chưa đăng', r2.loi !== null);

  const r3 = await nopHoSo('nhan-vien-sanh', 'Lê Văn C', '0912345680', { dongY: false });
  ok('Chưa đồng ý xử lý dữ liệu → từ chối',
     r3.loi !== null && /đồng ý/i.test(r3.loi), r3.loi || 'NHẬN HỒ SƠ');

  const r4 = await nopHoSo('nhan-vien-sanh', 'Phạm Văn D', '123');
  ok('Số điện thoại sai định dạng → từ chối', r4.loi !== null && /điện thoại/i.test(r4.loi));

  const r5 = await nopHoSo('nhan-vien-sanh', '   ', '0912345681');
  ok('Thiếu họ tên → từ chối', r5.loi !== null && /họ tên/i.test(r5.loi));

  // Chuẩn hóa số điện thoại dùng chung hàm sẵn có từ 0001.
  await nopHoSo('nhan-vien-sanh', 'Hoàng Văn E', '+84912345690');
  const { rows: [{ sdt }] } = await db.query(
    `select sdt from ho_so_ung_tuyen where ho_ten = 'Hoàng Văn E'`);
  ok('Số +84 được chuẩn hóa về 0912345690', sdt === '0912345690', sdt);

  // Chống bấm hai lần.
  const trung = await nopHoSo('nhan-vien-sanh', 'Nguyễn Văn A', '0912345678');
  ok('Cùng số, cùng vị trí, cùng ngày → chặn trùng', trung.loi !== null);

  const khacViTri = await db.query(
    `update vi_tri_tuyen_dung
     set mo_ta_vi='Sơ chế và nấu theo tiêu chuẩn.', yeu_cau_vi='Có kinh nghiệm bếp.',
         trang_thai='da_cong_bo' where ma='nhan-vien-bep'`);
  const r6 = await nopHoSo('nhan-vien-bep', 'Nguyễn Văn A', '0912345678');
  ok('Cùng số nhưng khác vị trí thì vẫn nộp được', r6.loi === null, r6.loi || '');
});

// ===========================================================================
await nhom('3 · CHỐNG BOT VÀ CHỐNG SPAM', async () => {
  const bay = await nopHoSo('nhan-vien-sanh', 'Bot X', '0912300001', { bay: 'http://spam' });
  ok('Điền vào ô bẫy → từ chối', bay.loi !== null);

  const nhanh = await nopHoSo('nhan-vien-sanh', 'Bot Y', '0912300002', { giay: 1 });
  ok('Gửi sau chưa tới 3 giây → từ chối', nhanh.loi !== null);

  // Câu báo lỗi phải GIỐNG HỆT nhau: nói rõ cái nào sai là dạy bot cách lách.
  ok('Hai kiểu chặn bot cho cùng một câu báo lỗi (không lộ cơ chế)',
     bay.loi === nhanh.loi, `"${bay.loi}" vs "${nhanh.loi}"`);

  const ip = '198.51.100.7';
  for (let i = 1; i <= 5; i++) {
    await nopHoSo('nhan-vien-sanh', `Ứng viên ${i}`, `09123100${i}0`, { ip });
  }
  const qua = await nopHoSo('nhan-vien-sanh', 'Ứng viên 6', '0912310060', { ip });
  ok('Quá 5 hồ sơ mỗi giờ từ một IP → chặn', qua.loi !== null && /quá nhiều/i.test(qua.loi));

  const ipKhac = await nopHoSo('nhan-vien-sanh', 'Ứng viên khác IP', '0912310070',
                               { ip: '198.51.100.8' });
  ok('IP khác vẫn nộp được bình thường', ipKhac.loi === null, ipKhac.loi || '');
});

// ===========================================================================
await nhom('4 · ANON KHÔNG ĐỌC ĐƯỢC HỒ SƠ NÀO', async () => {
  const doc = await duoiDanhNghiaAnon(`select * from ho_so_ung_tuyen`);
  ok('anon KHÔNG đọc được bảng hồ sơ', doc.loi !== null);

  const nhatKy = await duoiDanhNghiaAnon(`select * from nhat_ky_ho_so`);
  ok('anon KHÔNG đọc được nhật ký hồ sơ', nhatKy.loi !== null);

  const { rows: [{ ma }] } = await db.query(
    `select ma_ho_so as ma from ho_so_ung_tuyen limit 1`);
  const doanMa = await duoiDanhNghiaAnon(
    `select * from ho_so_ung_tuyen where ma_ho_so = $1`, [ma]);
  ok('Biết đúng mã hồ sơ cũng không đọc được', doanMa.loi !== null);

  // Không tồn tại hàm tra cứu hồ sơ — đây là quyết định thiết kế, không phải
  // thiếu sót, nên kiểm bằng một khẳng định rõ ràng.
  const { rows: ham } = await db.query(
    `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname='public' and p.proname ~ 'tra_cuu.*ho_so|ho_so.*tra_cuu'`);
  ok('KHÔNG tồn tại hàm tra cứu hồ sơ (có chủ ý)', ham.length === 0,
     ham.map(r => r.proname).join(','));

  const ghiThang = await duoiDanhNghiaAnon(
    `insert into ho_so_ung_tuyen (ma_ho_so, vi_tri_id, chi_nhanh_id, sdt, dong_y_noi_dung, luu_den)
     values ('BT-UV-9999-XXXXX',
             (select id from vi_tri_tuyen_dung limit 1), $1, '0900000000', 'x', current_date)`,
    [cnA.id]);
  ok('anon KHÔNG ghi thẳng vào bảng hồ sơ', ghiThang.loi !== null);
});

// ===========================================================================
await nhom('5 · AI TRONG NHÀ ĐỌC ĐƯỢC GÌ', async () => {
  // Tạo một hồ sơ ở chi nhánh Q7 để kiểm tra tách dữ liệu.
  await db.query(
    `insert into vi_tri_tuyen_dung (chi_nhanh_id, ma, ten_vi, bo_phan, mo_ta_vi, yeu_cau_vi, trang_thai)
     values ($1, 'sanh-q7', 'Nhân viên sảnh Q7', 'sanh',
             'Phục vụ khách tại sảnh.', 'Chăm chỉ.', 'da_cong_bo')`, [cnB.id]);
  await nopHoSo('sanh-q7', 'Ứng viên Q7', '0933333333');

  const q1 = await duoiDanhNghia(uidQlA, `select ho_ten from ho_so_ung_tuyen`);
  ok('Quản lý Q1 chỉ thấy hồ sơ của Q1',
     q1.loi === null && q1.rows.length > 0 && !q1.rows.some(r => r.ho_ten === 'Ứng viên Q7'),
     q1.loi || `${q1.rows?.length} hồ sơ`);

  const chu = await duoiDanhNghia(uidChu, `select ho_ten from ho_so_ung_tuyen`);
  ok('Chủ sở hữu thấy hồ sơ của cả hai chi nhánh',
     chu.loi === null && chu.rows.some(r => r.ho_ten === 'Ứng viên Q7'));

  const tn = await duoiDanhNghia(uidThuNgan, `select ho_ten from ho_so_ung_tuyen`);
  ok('Thu ngân KHÔNG thấy hồ sơ nào', tn.loi === null && tn.rows.length === 0,
     `thấy ${tn.rows?.length}`);

  const mkt = await duoiDanhNghia(uidMkt, `select ho_ten from ho_so_ung_tuyen`);
  ok('Marketing KHÔNG thấy hồ sơ nào', mkt.loi === null && mkt.rows.length === 0,
     `thấy ${mkt.rows?.length}`);

  const mktSo = await duoiDanhNghia(uidMkt, `select * from thong_ke_tuyen_dung()`);
  ok('Marketing vẫn xem được SỐ qua thống kê',
     mktSo.loi === null && mktSo.rows.length > 0, mktSo.loi || '');
  ok('Thống kê chỉ trả về con số, không trả về tên ai',
     mktSo.rows && !Object.keys(mktSo.rows[0]).some(k => /ho_ten|sdt|email/.test(k)));

  const tnSo = await duoiDanhNghia(uidThuNgan, `select * from thong_ke_tuyen_dung()`);
  ok('Thu ngân KHÔNG xem được cả thống kê', tnSo.loi !== null);
});

// ===========================================================================
await nhom('6 · VÒNG ĐỜI HỒ SƠ VÀ NHẬT KÝ', async () => {
  const { rows: [hs] } = await db.query(
    `select id, ma_ho_so from ho_so_ung_tuyen where ho_ten = 'Nguyễn Văn A' limit 1`);

  const { rows: nk0 } = await db.query(
    `select den_trang_thai from nhat_ky_ho_so where ho_so_id = $1`, [hs.id]);
  ok('Nộp hồ sơ là đã ghi nhật ký ngay',
     nk0.length === 1 && nk0[0].den_trang_thai === 'moi');

  ok('Nhảy thẳng từ moi sang nhan_viec → bị chặn',
     (await phaiLoi(db,
       `update ho_so_ung_tuyen set trang_thai='nhan_viec' where id=$1`, [hs.id])) !== null);

  for (const tt of ['dang_xem', 'hen_phong_van', 'da_phong_van', 'nhan_viec']) {
    await db.query(`update ho_so_ung_tuyen set trang_thai=$1 where id=$2`, [tt, hs.id]);
  }
  const { rows: nk } = await db.query(
    `select count(*)::int as n from nhat_ky_ho_so where ho_so_id = $1`, [hs.id]);
  ok('Mỗi lần đổi trạng thái đều để lại một dòng nhật ký', nk[0].n === 5, `${nk[0].n} dòng`);

  ok('Nhật ký không sửa được',
     (await phaiLoi(db,
       `update nhat_ky_ho_so set ghi_chu='sửa lén' where ho_so_id=$1`, [hs.id])) !== null);
  ok('Nhật ký không xóa được',
     (await phaiLoi(db,
       `delete from nhat_ky_ho_so where ho_so_id=$1`, [hs.id])) !== null);

  ok('Ứng viên rút lui được từ bất cứ trạng thái nào',
     (await phaiLoi(db,
       `update ho_so_ung_tuyen set trang_thai='ung_vien_rut' where id=$1`, [hs.id])) === null);
});

// ===========================================================================
await nhom('7 · VÉ TẢI CV — SERVER CẤP ĐƯỜNG DẪN', async () => {
  // Vé chỉ có nghĩa ở tin có hỏi CV (0026). Tin mẫu nhân viên sảnh không hỏi,
  // nên bật cho tin này trước khi thử vé.
  await db.query(`update vi_tri_tuyen_dung set hoi_cv = true where ma = 'nhan-vien-sanh'`);

  const ve = await duoiDanhNghiaAnon(`select xin_phieu_tai_cv($1::inet) as id`, ['203.0.113.50']);
  ok('anon xin được vé tải CV', ve.loi === null && ve.rows?.[0]?.id, ve.loi || '');
  const maVe = ve.rows[0].id;

  const r = await nopHoSo('nhan-vien-sanh', 'Có CV', '0944444444',
                          { maVe, tenTep: 'cv.pdf' });
  ok('Nộp hồ sơ kèm vé thì lưu được đường dẫn CV', r.loi === null, r.loi || '');

  const { rows: [{ duong_dan_cv }] } = await db.query(
    `select duong_dan_cv from ho_so_ung_tuyen where ho_ten = 'Có CV'`);
  ok('Đường dẫn CV theo MÃ VÉ, không theo id hồ sơ',
     duong_dan_cv === `ho-so-ung-tuyen/${maVe}/cv.pdf`, duong_dan_cv);

  const { rows: [{ id: idHoSo }] } = await db.query(
    `select id from ho_so_ung_tuyen where ho_ten = 'Có CV'`);
  ok('Id hồ sơ KHÔNG xuất hiện trong đường dẫn file',
     !duong_dan_cv.includes(idHoSo), 'id lọt vào đường dẫn');

  const dungLai = await nopHoSo('nhan-vien-sanh', 'Dùng lại vé', '0944444445',
                                { maVe, tenTep: 'cv.pdf' });
  ok('Vé chỉ dùng được một lần', dungLai.loi !== null && /hết hạn/i.test(dungLai.loi));

  const veCu = await db.query(
    `insert into phieu_tai_len (het_han) values (now() - interval '1 hour') returning id`);
  const hetHan = await nopHoSo('nhan-vien-sanh', 'Vé hết hạn', '0944444446',
                               { maVe: veCu.rows[0].id, tenTep: 'cv.pdf' });
  ok('Vé quá 15 phút thì không dùng được', hetHan.loi !== null);

  // CV là TÙY CHỌN: không có vé vẫn nộp được.
  const khongCv = await nopHoSo('nhan-vien-sanh', 'Không CV', '0944444447');
  ok('Không có CV vẫn nộp được hồ sơ (CV là tùy chọn)', khongCv.loi === null, khongCv.loi || '');
});

// ===========================================================================
await nhom('8 · NGHỊ ĐỊNH 13/2023 — ĐỒNG Ý VÀ THỜI HẠN LƯU', async () => {
  const { rows: [hs] } = await db.query(
    `select dong_y_noi_dung, dong_y_luc, luu_den, ngay_nop
     from ho_so_ung_tuyen where ho_ten = 'Không CV'`);
  ok('Lưu nguyên văn câu ứng viên đã đọc',
     hs.dong_y_noi_dung?.includes('6 tháng'), hs.dong_y_noi_dung?.slice(0, 40));
  ok('Có mốc thời gian đồng ý', hs.dong_y_luc != null);

  const soNgay = Math.round(
    (Date.parse(hs.luu_den) - Date.parse(hs.ngay_nop)) / 86400000);
  ok('Thời hạn lưu đúng 180 ngày kể từ ngày nộp', soNgay === 180, `${soNgay} ngày`);

  // Giả lập một hồ sơ đã quá hạn.
  await db.query(
    `update ho_so_ung_tuyen set luu_den = hom_nay_vn() - 1 where ho_ten = 'Không CV'`);
  const { rows: [{ n: daDon }] } = await db.query(
    `select don_dep_ho_so_het_han() as n`);
  ok('Dọn được hồ sơ quá hạn', Number(daDon) === 1, `${daDon} hồ sơ`);

  const { rows: [sau] } = await db.query(
    `select ho_ten, sdt, email, duong_dan_cv, da_an_danh, trang_thai, vi_tri_id
     from ho_so_ung_tuyen where ma_ho_so = (
       select ma_ho_so from ho_so_ung_tuyen where da_an_danh limit 1)`);
  ok('Đã xóa sạch thông tin nhận dạng',
     sau.ho_ten === null && sau.sdt === null && sau.email === null
     && sau.duong_dan_cv === null);
  ok('Vẫn GIỮ dòng để số liệu và vết kiểm toán còn nguyên',
     sau.da_an_danh === true && sau.vi_tri_id != null);
  ok('Trạng thái chuyển sang da_an_danh', sau.trang_thai === 'da_an_danh');

  const { rows: [{ n: conLai }] } = await db.query(
    `select count(*)::int as n from ho_so_ung_tuyen`);
  ok('Tổng số hồ sơ không đổi sau khi dọn', conLai > 0, `${conLai} hồ sơ`);

  const { rows: [{ n: nhatKyConNguyen }] } = await db.query(
    `select count(*)::int as n from nhat_ky_ho_so`);
  ok('Nhật ký xử lý vẫn còn nguyên', nhatKyConNguyen > 0, `${nhatKyConNguyen} dòng`);
});

// ===========================================================================
await nhom('9 · CÔNG TẮC CỔNG TUYỂN DỤNG', async () => {
  await db.query(
    `update noi_dung_cong_bo set trang_thai='da_thu_hoi'
     where khoa='hien_tuyen_dung' and trang_thai='da_cong_bo'`);

  const { rows: tin } = await duoiDanhNghiaAnon(`select * from tin_tuyen_dung_cong_khai()`);
  ok('Tắt công tắc thì không còn tin nào công khai', tin.length === 0);

  const nop = await nopHoSo('nhan-vien-sanh', 'Sau khi tắt', '0955555555');
  ok('Tắt công tắc thì RPC cũng không nhận hồ sơ',
     nop.loi !== null && /tạm đóng/i.test(nop.loi), nop.loi || 'VẪN NHẬN');

  const ve = await duoiDanhNghiaAnon(`select xin_phieu_tai_cv(null::inet) as id`);
  ok('Tắt công tắc thì cũng không cấp vé tải CV', ve.loi !== null);
});

// ===========================================================================
await nhom('MỘT BƯỚC CHUYỂN — MỘT DÒNG NHẬT KÝ (0016 mục 3)', async () => {
  // Trigger ho_so_kiem_tra_vong_doi() đã tự ghi nhật ký khi trạng thái đổi.
  // Giao diện /noi-bo/tuyen-dung từng ghi THÊM một dòng nữa cho cùng bước
  // chuyển, vì nó cần chỗ lưu ghi chú. Nhật ký là bảng bất biến nên dòng
  // thừa không dọn được — một vết kiểm toán nói sai về số lần xảy ra.
  await db.query(
    `update noi_dung_cong_bo set trang_thai = 'da_thu_hoi'
     where khoa = 'hien_tuyen_dung' and trang_thai = 'da_cong_bo'`);
  await db.query(
    `insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai, cong_bo_luc)
     values ('hien_tuyen_dung', 'bool', true, 'da_cong_bo', now())`);

  const nop = await nopHoSo('nhan-vien-sanh', 'Đỗ Thị Nhật Ký', '0913000111');
  const ma = nop.rows?.[0]?.ma;
  ok('Nộp được hồ sơ để thử nhật ký', typeof ma === 'string', nop.loi ?? '');

  const { rows: [hs] } = await db.query(
    `select id from ho_so_ung_tuyen where ma_ho_so = $1`, [ma]);

  const { rows: [{ n: truoc }] } = await db.query(
    `select count(*)::int as n from nhat_ky_ho_so where ho_so_id = $1`, [hs.id]);
  ok('Lúc nộp có đúng một dòng nhật ký', truoc === 1, `${truoc} dòng`);

  // Đúng khuôn mà giao diện dùng: ghi chú đi trong CÙNG câu UPDATE.
  const doi = await duoiDanhNghia(uidQlA,
    `update ho_so_ung_tuyen
     set trang_thai = 'dang_xem', ghi_chu_buoc = 'Đã gọi, hẹn gặp thứ Năm'
     where id = $1`, [hs.id]);
  ok('Quản lý đổi được trạng thái kèm ghi chú', doi.loi === null, doi.loi ?? '');

  const { rows: nk } = await db.query(
    `select tu_trang_thai, den_trang_thai, ghi_chu, nguoi_thuc_hien
     from nhat_ky_ho_so where ho_so_id = $1 order by created_at`, [hs.id]);
  ok('Một bước chuyển sinh ĐÚNG MỘT dòng nhật ký', nk.length === 2,
     `${nk.length} dòng, đáng ra 2 (nộp + chuyển)`);
  ok('Ghi chú đi được vào nhật ký qua trigger',
     nk[1]?.ghi_chu === 'Đã gọi, hẹn gặp thứ Năm', `ghi_chu = ${nk[1]?.ghi_chu}`);
  ok('Nhật ký vẫn ghi đúng người thực hiện', nk[1]?.nguoi_thuc_hien !== null);

  // Không ai chèn tay vào nhật ký được nữa — kể cả nhân sự đã đăng nhập.
  const chenTay = await duoiDanhNghia(uidQlA,
    `insert into nhat_ky_ho_so (ho_so_id, den_trang_thai, ghi_chu)
     values ($1, 'tu_choi', 'dòng bịa')`, [hs.id]);
  ok('Nhân sự KHÔNG chèn tay được một dòng kiểm toán', chenTay.loi !== null,
     chenTay.loi ?? 'chèn được — nhật ký không còn đáng tin');

  const { rows: [{ n: sau }] } = await db.query(
    `select count(*)::int as n from nhat_ky_ho_so where ho_so_id = $1`, [hs.id]);
  ok('Số dòng nhật ký không đổi sau khi bị từ chối', sau === 2, `${sau} dòng`);
});

// ===========================================================================
await nhom('10 · MỖI TIN HỎI NHỮNG GÌ (0026)', async () => {
  // Tin bếp tắt hết trường tùy chọn. Ứng viên — hoặc trình duyệt cũ không ẩn
  // được ô — vẫn gửi đủ; database phải bỏ hết, kể cả vé tải CV.
  await db.query(
    `update vi_tri_tuyen_dung
     set hoi_email = false, hoi_nam_sinh = false, hoi_ca_lam = false,
         hoi_gioi_thieu = false, hoi_kinh_nghiem = false, hoi_cv = false
     where ma = 'nhan-vien-bep'`);

  const ve = await duoiDanhNghiaAnon(`select xin_phieu_tai_cv(null::inet) as id`);
  const maVe = ve.rows?.[0]?.id;
  const guiDu = {
    email: 'ung.vien@example.com', namSinh: 1999, gioiThieu: 'Chăm chỉ, vui vẻ.',
    kinhNghiem: 'Hai năm phụ bếp.', caLam: ['sang', 'toi'], maVe, tenTep: 'cv.pdf',
  };

  const r = await nopHoSo('nhan-vien-bep', 'Gửi Thừa', '0966000001', guiDu);
  ok('Tin tắt hết trường tùy chọn vẫn nhận hồ sơ', r.loi === null, r.loi ?? '');

  const cot = 'email, nam_sinh, gioi_thieu, kinh_nghiem, ca_lam_duoc, duong_dan_cv';
  const { rows: [thua] } = await db.query(
    `select ${cot} from ho_so_ung_tuyen where ho_ten = 'Gửi Thừa'`);
  ok('Trường tin không hỏi thì KHÔNG được lưu, dù có gửi lên',
     thua && Object.values(thua).every(x => x === null), JSON.stringify(thua));

  const { rows: [phieu] } = await db.query(
    `select da_dung from phieu_tai_len where id = $1`, [maVe]);
  ok('Tin không hỏi CV: vé tải CV bị bỏ qua, không bị đánh dấu đã dùng',
     phieu?.da_dung === false);

  // Bật lại thì lưu đủ — công tắc không được làm hỏng đường bình thường.
  await db.query(
    `update vi_tri_tuyen_dung
     set hoi_email = true, hoi_nam_sinh = true, hoi_ca_lam = true,
         hoi_gioi_thieu = true, hoi_kinh_nghiem = true, hoi_cv = true
     where ma = 'nhan-vien-bep'`);
  const { rows: tin } = await duoiDanhNghiaAnon(
    `select hoi_cv from tin_tuyen_dung_cong_khai() where ma = 'nhan-vien-bep'`);
  ok('Bật lại thì trang công khai thấy ngay', tin?.[0]?.hoi_cv === true);

  const r2 = await nopHoSo('nhan-vien-bep', 'Gửi Đủ', '0966000002', guiDu);
  const { rows: [du] } = await db.query(
    `select ${cot} from ho_so_ung_tuyen where ho_ten = 'Gửi Đủ'`);
  ok('Tin hỏi đủ thì lưu đủ, kể cả CV bằng đúng vé lúc nãy',
     r2.loi === null && du?.email === 'ung.vien@example.com' && du?.nam_sinh === 1999
       && du?.ca_lam_duoc?.join(',') === 'sang,toi'
       && du?.duong_dan_cv === `ho-so-ung-tuyen/${maVe}/cv.pdf`,
     r2.loi ?? JSON.stringify(du));

  // Ai bật/tắt được: đúng những vai soạn được tin — policy vi_tri_sua của 0012.
  const sua = `update vi_tri_tuyen_dung set hoi_cv = not hoi_cv
               where ma = 'quan-ly-sanh' returning ma`;
  const mkt = await duoiDanhNghia(uidMkt, sua);
  ok('Marketing bật/tắt được trường của tin',
     mkt.loi === null && mkt.rows?.length === 1, mkt.loi ?? `${mkt.rows?.length} dòng`);

  const tn = await duoiDanhNghia(uidThuNgan, sua);
  ok('Thu ngân KHÔNG bật/tắt được',
     tn.loi !== null || tn.rows?.length === 0, `${tn.rows?.length} dòng bị sửa`);

  const qlKhac = await duoiDanhNghia(uidQlB, sua);
  ok('Quản lý chi nhánh khác KHÔNG sửa được tin của Q1',
     qlKhac.loi !== null || qlKhac.rows?.length === 0, `${qlKhac.rows?.length} dòng bị sửa`);

  const anon = await duoiDanhNghiaAnon(sua);
  ok('anon KHÔNG sửa được tin', anon.loi !== null || anon.rows?.length === 0);
});

// ===========================================================================
await nhom('11 · DUYỆT LƯƠNG VÀ ĐĂNG TIN (0027)', async () => {
  // Chủ nhà hàng chốt: đăng và gỡ tin thì cả marketing làm được; mức lương
  // chính thức thì chỉ chủ nhà hàng và quản lý.
  const idCua = async (uid) =>
    (await db.query(`select id from nhan_su where auth_uid = $1`, [uid])).rows[0].id;
  const luongBep = async () => (await db.query(
    `select luong_tu, luong_da_duyet, luong_nguoi_duyet, luong_duyet_luc
     from vi_tri_tuyen_dung where ma = 'nhan-vien-bep'`)).rows[0];

  const deXuat = await duoiDanhNghia(uidMkt,
    `update vi_tri_tuyen_dung set luong_de_xuat_tu = 6000000, luong_de_xuat_den = 8000000
     where ma = 'nhan-vien-bep' returning ma`);
  ok('Marketing ghi được mức lương đề xuất',
     deXuat.loi === null && deXuat.rows?.length === 1, deXuat.loi ?? '');

  const duyet = `update vi_tri_tuyen_dung
                 set luong_tu = luong_de_xuat_tu, luong_den = luong_de_xuat_den,
                     luong_da_duyet = true
                 where ma = 'nhan-vien-bep' returning ma`;
  const mktDuyet = await duoiDanhNghia(uidMkt, duyet);
  ok('Marketing KHÔNG tự duyệt được mức lương',
     mktDuyet.loi !== null && /chủ nhà hàng hoặc quản lý/i.test(mktDuyet.loi),
     mktDuyet.loi ?? 'DUYỆT ĐƯỢC');
  ok('Lần bị chặn không để lại gì', (await luongBep()).luong_da_duyet === false);

  const qlDuyet = await duoiDanhNghia(uidQlA, duyet);
  const sauDuyet = await luongBep();
  ok('Quản lý duyệt được mức lương',
     qlDuyet.loi === null && sauDuyet.luong_da_duyet && Number(sauDuyet.luong_tu) === 6000000,
     qlDuyet.loi ?? JSON.stringify(sauDuyet));
  ok('Ghi lại ai duyệt lương và lúc nào',
     sauDuyet.luong_nguoi_duyet === await idCua(uidQlA) && sauDuyet.luong_duyet_luc !== null);

  const { rows: tin } = await duoiDanhNghiaAnon(
    `select luong_tu from tin_tuyen_dung_cong_khai() where ma = 'nhan-vien-bep'`);
  ok('Mức đã duyệt hiện trên trang công khai', Number(tin?.[0]?.luong_tu) === 6000000);

  // Chặn đúng ba cột chính thức, không chặn cả dòng.
  const suaKhac = await duoiDanhNghia(uidMkt,
    `update vi_tri_tuyen_dung set ca_lam = 'Ca tối', luong_de_xuat_tu = 6500000
     where ma = 'nhan-vien-bep' returning ma`);
  ok('Marketing vẫn sửa được phần khác của tin đã duyệt lương, kể cả mức đề xuất',
     suaKhac.loi === null && suaKhac.rows?.length === 1, suaKhac.loi ?? '');
  ok('Sửa mức đề xuất không đụng tới mức đang hiện',
     Number((await luongBep()).luong_tu) === 6000000);

  const boDuyet = `update vi_tri_tuyen_dung
                   set luong_tu = null, luong_den = null, luong_da_duyet = false
                   where ma = 'nhan-vien-bep' returning ma`;
  const mktBo = await duoiDanhNghia(uidMkt, boDuyet);
  ok('Marketing KHÔNG gỡ được mức lương đã duyệt', mktBo.loi !== null, mktBo.loi ?? 'GỠ ĐƯỢC');

  const chuBo = await duoiDanhNghia(uidChu, boDuyet);
  const sauBo = await luongBep();
  ok('Chủ nhà hàng bỏ duyệt được, dấu người duyệt xóa theo',
     chuBo.loi === null && !sauBo.luong_da_duyet && sauBo.luong_nguoi_duyet === null,
     chuBo.loi ?? JSON.stringify(sauBo));

  const tao = await duoiDanhNghia(uidMkt,
    `insert into vi_tri_tuyen_dung (chi_nhanh_id, ma, ten_vi, bo_phan, luong_tu, luong_da_duyet)
     values ($1, 'thu-luong-mkt', 'Tin thử', 'sanh', 7000000, true) returning ma`, [cnA.id]);
  ok('Marketing KHÔNG lách được bằng cách tạo tin mới kèm lương đã duyệt',
     tao.loi !== null, tao.loi ?? 'TẠO ĐƯỢC');

  // Đăng và gỡ: marketing làm được, và trigger ghi ai đăng, lúc nào.
  const dang = await duoiDanhNghia(uidMkt,
    `update vi_tri_tuyen_dung
     set mo_ta_vi = 'Điều phối truyền thông cho nhà hàng.',
         yeu_cau_vi = 'Chụp ảnh và viết bài được.', trang_thai = 'da_cong_bo'
     where ma = 'dau-moi-marketing' returning cong_bo_luc, nguoi_duyet`);
  ok('Marketing đăng được tin', dang.loi === null && dang.rows?.length === 1, dang.loi ?? '');
  ok('Ghi lại ai đăng tin và lúc nào',
     dang.rows?.[0]?.cong_bo_luc != null && dang.rows?.[0]?.nguoi_duyet === await idCua(uidMkt));

  const go = await duoiDanhNghia(uidMkt,
    `update vi_tri_tuyen_dung set trang_thai = 'da_thu_hoi'
     where ma = 'dau-moi-marketing' returning ma`);
  ok('Marketing gỡ được tin', go.loi === null && go.rows?.length === 1, go.loi ?? '');
});

// ===========================================================================
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA TUYỂN DỤNG ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
process.exit(hong === 0 ? 0 : 1);
