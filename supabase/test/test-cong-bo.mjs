/**
 * BEEFTOWN CRM — Kiểm thử cổng nội dung (0009 + 0010)
 * ===================================================
 * Bất biến cần chứng minh: KHÔNG tồn tại đường nào để một dữ kiện chưa được
 * duyệt xuất hiện trên trang công khai.
 *
 *     node test/test-cong-bo.mjs
 *
 * Bài test quan trọng nhất là mục 2: trên một database vừa cài xong, hàm mà
 * website gọi phải trả về null cho MỌI dữ kiện — không ngày khai trương,
 * không hotline, không mạng xã hội. Đó là điều phân biệt hệ thống này với
 * website nháp, nơi hotline 0900 000 001 nằm sẵn trong HTML.
 */

import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

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

console.log('\x1b[1m\nBEEFTOWN CRM — KIỂM THỬ CỔNG NỘI DUNG\x1b[0m');
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
await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1,'B01',4)`, [cn.id]);

const uidChu = '33333333-3333-3333-3333-333333333333';
const uidQl  = '11111111-1111-1111-1111-111111111111';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,null,'Chủ sở hữu','chu_so_huu')`, [uidChu]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Quản lý Q1','quan_ly')`, [uidQl, cn.id]);

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

/** Soạn nháp → duyệt → công bố, dưới danh nghĩa một người cụ thể. */
async function congBo(uid, khoa, kieu, cot, giaTri) {
  const them = await duoiDanhNghia(uid,
    `insert into noi_dung_cong_bo (khoa, kieu, ${cot}) values ($1,$2,$3) returning id`,
    [khoa, kieu, giaTri]);
  if (them.loi) return them.loi;
  const id = them.rows[0].id;
  const duyet = await duoiDanhNghia(uid,
    `update noi_dung_cong_bo set trang_thai='da_duyet' where id=$1`, [id]);
  if (duyet.loi) return duyet.loi;
  const cong = await duoiDanhNghia(uid,
    `update noi_dung_cong_bo set trang_thai='da_cong_bo' where id=$1`, [id]);
  return cong.loi;
}

// ===========================================================================
await nhom('1 · ANON KHÔNG ĐỤNG ĐƯỢC BẢNG NÀO', async () => {
  for (const bang of ['khoa_cong_bo', 'noi_dung_cong_bo', 'tep_anh', 'khung_anh']) {
    const r = await duoiDanhNghiaAnon(`select * from ${bang}`);
    ok(`anon KHÔNG đọc được bảng ${bang}`, r.loi !== null);
  }
  const ghi = await duoiDanhNghiaAnon(
    `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text) values ('dong_trang_thai','van_ban','Bịa')`);
  ok('anon KHÔNG ghi được nội dung', ghi.loi !== null);
});

// ===========================================================================
await nhom('2 · DATABASE VỪA CÀI — KHÔNG DỮ KIỆN NÀO ĐƯỢC CÔNG BỐ', async () => {
  const { rows: [{ j }] } = await db.query(`select noi_dung_cong_khai() as j`);

  const { rows: [{ n: soKhoa }] } = await db.query(
    `select count(*)::int as n from khoa_cong_bo`);
  ok('Hàm công khai trả về ĐỦ mọi khóa trong sổ đăng ký',
     Object.keys(j).length === soKhoa,
     `${Object.keys(j).length}/${soKhoa} khóa`);

  // Đây là bất biến quan trọng nhất của cả migration.
  const coGiaTri = Object.entries(j).filter(([, v]) => v !== null).map(([k]) => k);
  ok('CHỈ công tắc đặt bàn có giá trị, mọi dữ kiện khác đều null',
     coGiaTri.length === 1 && coGiaTri[0] === 'form_dat_ban_dang_mo',
     `đang có giá trị: ${coGiaTri.join(', ') || '(không có)'}`);

  for (const khoa of ['ngay_khai_truong', 'hotline', 'facebook_url',
                      'dia_chi_hien_thi', 'anh_chia_se', 'hien_danh_gia']) {
    ok(`${khoa} chưa công bố → null`, j[khoa] === null);
  }

  // Phân biệt được "gõ sai tên khóa" với "chưa duyệt" — lý do hàm trả đủ khóa.
  ok('Khóa không tồn tại thì THIẾU HẲN thuộc tính (lỗi lập trình, không im lặng)',
     !('khoa_go_sai' in j));

  const { rows: thieu } = await db.query(`select khoa from v_cong_bo_con_thieu`);
  ok('Checklist khai trương liệt kê đúng các dữ kiện bắt buộc còn thiếu',
     thieu.length > 0 && thieu.some(r => r.khoa === 'ngay_khai_truong'),
     `còn thiếu ${thieu.length} mục`);
});

// ===========================================================================
await nhom('3 · DATABASE TỪ CHỐI GIỮ DỮ KIỆN SAI ĐỊNH DẠNG', async () => {
  ok('Khóa không có trong sổ đăng ký → lỗi khóa ngoại',
     (await phaiLoi(db,
       `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text)
        values ('khoa_bia_dat','van_ban','abc')`)) !== null);

  ok('Lưu ngày dưới một khóa kiểu URL → bị chặn',
     (await phaiLoi(db,
       `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_ngay)
        values ('facebook_url','url','2026-11-20')`)) !== null);

  ok('URL dùng http:// (không mã hóa) → bị chặn',
     (await phaiLoi(db,
       `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text)
        values ('facebook_url','url','http://facebook.com/beeftown')`)) !== null);

  ok('Số điện thoại sai định dạng → bị chặn',
     (await phaiLoi(db,
       `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text)
        values ('hotline','sdt','0900 000')`)) !== null);

  // Chính là hotline mẫu đang nằm trong website nháp. Nó ĐÚNG định dạng nên
  // database không chặn được — chốt chặn cho trường hợp này là con người duyệt.
  ok('Hotline đúng định dạng thì lưu được (chốt chặn ở đây là người duyệt)',
     (await phaiLoi(db,
       `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text)
        values ('hotline','sdt','0900000001')`)) === null);
  await db.query(`delete from noi_dung_cong_bo where khoa='hotline'`);

  ok('Văn bản còn dấu ngoặc vuông kiểu [chờ duyệt] → bị chặn',
     (await phaiLoi(db,
       `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text)
        values ('dong_trang_thai','van_ban','[Chờ Khánh duyệt câu này]')`)) !== null);

  ok('Văn bản rỗng → bị chặn',
     (await phaiLoi(db,
       `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text)
        values ('dong_trang_thai','van_ban','   ')`)) !== null);

  ok('Khoảng hiển thị kết thúc trước khi bắt đầu → bị chặn',
     (await phaiLoi(db,
       `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text,hien_tu,hien_den)
        values ('dong_trang_thai','van_ban','Đang chuẩn bị',
                now() + interval '2 days', now())`)) !== null);
});

// ===========================================================================
await nhom('4 · VÒNG ĐỜI CÔNG BỐ', async () => {
  const loiCongBo = await congBo(uidChu, 'dong_trang_thai', 'van_ban', 'gia_tri_text',
    'Beeftown đang chuẩn bị đón bạn. Lịch mở cửa sẽ được cập nhật tại đây.');
  ok('Chủ sở hữu soạn nháp → duyệt → công bố được', loiCongBo === null, loiCongBo || '');

  const { rows: [{ j }] } = await db.query(`select noi_dung_cong_khai() as j`);
  ok('Dữ kiện đã công bố xuất hiện trên đường đọc công khai',
     j.dong_trang_thai?.startsWith('Beeftown đang chuẩn bị'), JSON.stringify(j.dong_trang_thai));

  ok('KHÔNG sửa được giá trị của dòng đã công bố',
     (await phaiLoi(db,
       `update noi_dung_cong_bo set gia_tri_text = 'Câu khác hẳn'
        where khoa='dong_trang_thai' and trang_thai='da_cong_bo'`)) !== null);

  ok('KHÔNG quay ngược từ da_cong_bo về nhap',
     (await phaiLoi(db,
       `update noi_dung_cong_bo set trang_thai='nhap'
        where khoa='dong_trang_thai' and trang_thai='da_cong_bo'`)) !== null);

  const { rows: [nhapMoi] } = await db.query(
    `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text)
     values ('tieu_de_og','van_ban','Beeftown') returning id`);
  ok('KHÔNG nhảy thẳng từ nhap lên da_cong_bo',
     (await phaiLoi(db,
       `update noi_dung_cong_bo set trang_thai='da_cong_bo' where id=$1`,
       [nhapMoi.id])) !== null);
  await db.query(`delete from noi_dung_cong_bo where khoa='tieu_de_og'`);

  ok('Hai dòng cùng sống cho một khóa → lỗi trùng',
     (await phaiLoi(db,
       `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text,trang_thai)
        values ('dong_trang_thai','van_ban','Câu thứ hai','da_cong_bo')`)) !== null);

  // Thu hồi: đường thoát nhanh khi một dữ kiện hóa ra sai.
  await db.query(`update noi_dung_cong_bo set trang_thai='da_thu_hoi'
                  where khoa='dong_trang_thai' and trang_thai='da_cong_bo'`);
  const { rows: [{ j: j2 }] } = await db.query(`select noi_dung_cong_khai() as j`);
  ok('Thu hồi xong thì dữ kiện biến mất khỏi trang công khai',
     j2.dong_trang_thai === null);

  ok('da_thu_hoi là trạng thái cuối, không hồi sinh được',
     (await phaiLoi(db,
       `update noi_dung_cong_bo set trang_thai='da_cong_bo'
        where khoa='dong_trang_thai' and trang_thai='da_thu_hoi'`)) !== null);

  ok('Thu hồi xong thì công bố lại được bản mới',
     (await congBo(uidChu, 'dong_trang_thai', 'van_ban', 'gia_tri_text',
                   'Beeftown mở cửa từ tuần sau.')) === null);
});

// ===========================================================================
await nhom('5 · LÊN SÓNG THEO LỊCH', async () => {
  const them = await duoiDanhNghia(uidChu,
    `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text,hien_tu)
     values ('mo_ta_og','van_ban','Chọn bò tại quầy.', now() + interval '2 days')
     returning id`);
  const id = them.rows[0].id;
  await duoiDanhNghia(uidChu, `update noi_dung_cong_bo set trang_thai='da_duyet' where id=$1`, [id]);
  await duoiDanhNghia(uidChu, `update noi_dung_cong_bo set trang_thai='da_cong_bo' where id=$1`, [id]);

  const { rows: [{ j }] } = await db.query(`select noi_dung_cong_khai() as j`);
  ok('Đã công bố nhưng chưa tới giờ lên sóng → vẫn null', j.mo_ta_og === null);

  await db.query(`update noi_dung_cong_bo set hien_tu = now() - interval '1 hour' where id=$1`, [id]);
  const { rows: [{ j: j2 }] } = await db.query(`select noi_dung_cong_khai() as j`);
  ok('Tới giờ thì tự lên sóng, không cần ai bấm lại', j2.mo_ta_og === 'Chọn bò tại quầy.');
});

// ===========================================================================
await nhom('6 · AI ĐƯỢC CÔNG BỐ CÁI GÌ', async () => {
  const loiQl = await congBo(uidQl, 'ngay_khai_truong', 'ngay', 'gia_tri_ngay', '2026-12-01');
  ok('Quản lý KHÔNG công bố được ngày khai trương',
     loiQl !== null && /chủ sở hữu/i.test(loiQl), loiQl || 'CÔNG BỐ ĐƯỢC');
  await db.query(`delete from noi_dung_cong_bo where khoa='ngay_khai_truong'`);

  ok('Chủ sở hữu công bố được ngày khai trương',
     (await congBo(uidChu, 'ngay_khai_truong', 'ngay', 'gia_tri_ngay', '2026-12-01')) === null);

  ok('Quản lý công bố được dữ kiện thường',
     (await congBo(uidQl, 'facebook_url', 'url', 'gia_tri_text',
                   'https://facebook.com/beeftown.vn')) === null);

  const { rows: [{ j }] } = await db.query(`select noi_dung_cong_khai() as j`);
  ok('Ngày khai trương trả về đúng kiểu ngày', j.ngay_khai_truong === '2026-12-01');
  ok('Facebook trả về đúng đường dẫn', j.facebook_url === 'https://facebook.com/beeftown.vn');
});

// ===========================================================================
await nhom('7 · SONG NGỮ VIỆT – ANH', async () => {
  const them = await duoiDanhNghia(uidChu,
    `insert into noi_dung_cong_bo (khoa,kieu,gia_tri_text,gia_tri_text_en)
     values ('tieu_de_og','van_ban','Beeftown — Nhà hàng chuyên bò',
             'Beeftown — Beef Specialty Restaurant') returning id`);
  const id = them.rows[0].id;
  await duoiDanhNghia(uidChu, `update noi_dung_cong_bo set trang_thai='da_duyet' where id=$1`, [id]);
  await duoiDanhNghia(uidChu, `update noi_dung_cong_bo set trang_thai='da_cong_bo' where id=$1`, [id]);

  const { rows: [{ vi }] } = await db.query(`select noi_dung_cong_khai('vi') as vi`);
  const { rows: [{ en }] } = await db.query(`select noi_dung_cong_khai('en') as en`);
  ok('Bản tiếng Việt trả về câu tiếng Việt', vi.tieu_de_og.includes('chuyên bò'));
  ok('Bản tiếng Anh trả về câu tiếng Anh', en.tieu_de_og.includes('Beef Specialty'));
  // Thiếu bản tiếng Anh thì quay về tiếng Việt, tốt hơn là để trống.
  ok('Chưa dịch thì bản tiếng Anh dùng tạm câu tiếng Việt',
     en.facebook_url === 'https://facebook.com/beeftown.vn');
});

// ===========================================================================
await nhom('8 · CÔNG TẮC ĐẶT BÀN CÓ HIỆU LỰC THẬT', async () => {
  const ngayMai = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  ok('Công tắc đang bật thì đặt bàn được',
     (await phaiLoi(db,
       `select * from tao_dat_ban($1,$2,$3,$4::date,$5::time,$6::smallint)`,
       [cn.ma, '0912345678', 'Khách A', ngayMai, '18:00', 2])) === null);

  await db.query(`update noi_dung_cong_bo set trang_thai='da_thu_hoi'
                  where khoa='form_dat_ban_dang_mo' and trang_thai='da_cong_bo'`);

  const loiTat = await phaiLoi(db,
    `select * from tao_dat_ban($1,$2,$3,$4::date,$5::time,$6::smallint)`,
    [cn.ma, '0912345679', 'Khách B', ngayMai, '19:00', 2]);
  ok('Tắt công tắc thì RPC cũng không ghi được đặt bàn',
     loiTat !== null && /tạm đóng/i.test(loiTat),
     loiTat === null ? 'VẪN ĐẶT ĐƯỢC — công tắc chỉ là trang trí' : '');

  ok('Chưa công bố công tắc thì mặc định là TẮT',
     (await db.query(`select cong_tac_bat('hien_thuc_don') as b`)).rows[0].b === false);
});

// ===========================================================================
await nhom('9 · ẢNH — CHỐT CHẶN CHỐNG ẢNH MINH HỌA', async () => {
  ok('Ảnh không phải ảnh thật mà thiếu chú thích → bị chặn',
     (await phaiLoi(db,
       `insert into tep_anh (bucket,duong_dan,loai,nguon_that,alt_vi)
        values ('cong-khai','unsplash-1.jpg','khong_gian','anh_minh_hoa','Phòng ăn')`)) !== null);

  ok('Ảnh minh họa có chú thích rõ ràng thì lưu được',
     (await phaiLoi(db,
       `insert into tep_anh (bucket,duong_dan,loai,nguon_that,alt_vi,chu_thich)
        values ('cong-khai','minh-hoa-1.jpg','khong_gian','anh_minh_hoa','Phòng ăn',
                'Ảnh minh họa, không phải không gian Beeftown')`)) === null);

  ok('Công bố ảnh mà thiếu mô tả thay thế → bị chặn',
     (await phaiLoi(db,
       `insert into tep_anh (bucket,duong_dan,loai,nguon_that,trang_thai)
        values ('cong-khai','khong-alt.jpg','mat_tien','anh_that','da_cong_bo')`)) !== null);

  ok('Ảnh chia sẻ nhỏ hơn 1200×630 → bị chặn khi công bố',
     (await phaiLoi(db,
       `insert into tep_anh (bucket,duong_dan,khung_ma,loai,nguon_that,alt_vi,rong,cao,trang_thai)
        values ('cong-khai','og-nho.png','og-chia-se','chia_se','anh_that',
                'Thẻ chia sẻ Beeftown',800,418,'da_cong_bo')`)) !== null);

  ok('Ảnh chia sẻ đúng 1200×630 thì công bố được',
     (await phaiLoi(db,
       `insert into tep_anh (bucket,duong_dan,khung_ma,loai,nguon_that,alt_vi,rong,cao,trang_thai)
        values ('cong-khai','og.png','og-chia-se','chia_se','anh_that',
                'Thẻ chia sẻ Beeftown',1200,630,'da_cong_bo')`)) === null);

  const { rows: truoc } = await db.query(`select ma from v_anh_con_thieu`);
  ok('Danh sách ảnh còn thiếu không còn ô đã có ảnh thật',
     !truoc.some(r => r.ma === 'og-chia-se'), `còn thiếu ${truoc.length} ô`);

  const { rows: [{ n }] } = await db.query(
    `select count(*)::int as n from v_anh_con_thieu where bat_buoc`);
  ok('Vẫn còn các ô ảnh bắt buộc chưa chụp (cần phòng đã hoàn thiện)', n > 0, `${n} ô`);

  // Ảnh minh họa KHÔNG được tính là đã có ảnh cho ô đó.
  await db.query(
    `insert into tep_anh (bucket,duong_dan,khung_ma,loai,nguon_that,alt_vi,chu_thich,rong,cao,trang_thai)
     values ('cong-khai','mat-tien-stock.jpg','mat-tien-ngay','mat_tien','anh_minh_hoa',
             'Mặt tiền minh họa','Ảnh kho, chưa phải mặt tiền Beeftown',1600,1200,'da_cong_bo')`);
  const { rows: sau } = await db.query(`select ma from v_anh_con_thieu`);
  ok('Ảnh minh họa KHÔNG làm ô ảnh biến khỏi danh sách còn thiếu',
     sau.some(r => r.ma === 'mat-tien-ngay'));
});

// ===========================================================================
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA CỔNG NỘI DUNG ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
process.exit(hong === 0 ? 0 : 1);
