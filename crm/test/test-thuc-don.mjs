/**
 * BEEFTOWN CRM — Kiểm thử thực đơn (0011)
 * =======================================
 * Điều cần chứng minh: một mức giá chưa được duyệt KHÔNG CÓ ĐƯỜNG NÀO ra tới
 * website, và bò thì không bao giờ niêm yết giá trên web.
 *
 *     node test/test-thuc-don.mjs
 *
 * Bảng nội dung menu gốc có cột "Giá duyệt" trống ở cả 31 dòng. Sáu mức giá
 * đang hiển thị trên website nháp không có nguồn nào cả. Bài test này là chỗ
 * ghi nhận sự thật đó thành một khẳng định chạy được.
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

console.log('\x1b[1m\nBEEFTOWN CRM — KIỂM THỬ THỰC ĐƠN\x1b[0m');
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

/** Bật một công tắc nội dung (chạy với quyền migration, không cần đăng nhập). */
async function batCongTac(khoa) {
  await db.query(
    `insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai)
     values ($1, 'bool', true, 'da_cong_bo')`, [khoa]);
}

// ===========================================================================
await nhom('1 · DỮ LIỆU SEED KHỚP BẢNG NỘI DUNG GỐC', async () => {
  const { rows: [{ n: soMon }] } = await db.query(`select count(*)::int as n from mon_an`);
  ok('Seed đủ 31 mục bán', soMon === 31, `${soMon} mục`);

  const { rows: [{ n: soAn }] } = await db.query(
    `select count(*)::int as n from mon_an where ma like 'F%'`);
  const { rows: [{ n: soUong }] } = await db.query(
    `select count(*)::int as n from mon_an where ma like 'D%'`);
  const { rows: [{ n: soSot }] } = await db.query(
    `select count(*)::int as n from mon_an where ma like 'S%'`);
  ok('18 món ăn + 12 đồ uống + 1 set sốt',
     soAn === 18 && soUong === 12 && soSot === 1, `${soAn}/${soUong}/${soSot}`);

  const { rows: [{ n: soNhom }] } = await db.query(`select count(*)::int as n from nhom_mon`);
  ok('13 nhóm (12 nhóm món + nhóm bò tại quầy)', soNhom === 13, `${soNhom} nhóm`);

  const { rows: [{ n: chuaNhap }] } = await db.query(
    `select count(*)::int as n from mon_an where trang_thai <> 'nhap'`);
  ok('MỌI món đều ở trạng thái nháp sau khi cài', chuaNhap === 0,
     `${chuaNhap} món không phải nháp`);

  // Khẳng định quan trọng nhất của cả file.
  const { rows: [{ n: coGia }] } = await db.query(
    `select count(*)::int as n from mon_an
     where gia is not null or gia_da_duyet or gia_de_xuat is not null`);
  ok('KHÔNG một mức giá nào được duyệt — đúng như bảng nội dung gốc',
     coGia === 0, `${coGia} món đã có giá`);

  const { rows: [{ n: coCon }] } = await db.query(
    `select count(*)::int as n from mon_an where co_con`);
  ok('8 đồ uống được đánh dấu có cồn', coCon === 8, `${coCon} món`);

  const { rows: song } = await db.query(`select ma from mon_an where la_mon_song`);
  ok('Đúng F03 Yukhoe được đánh dấu là món sống',
     song.length === 1 && song[0].ma === 'F03', song.map(r => r.ma).join(',') || '(không có)');

  const { rows: [{ n: coMoTa }] } = await db.query(
    `select count(*)::int as n from mon_an where mo_ta_vi is not null`);
  ok('Chưa món nào có mô tả chính thức (chờ biên tập)', coMoTa === 0);

  // Câu quảng cáo chưa kiểm chứng phải ở lại cột nội bộ.
  const { rows: [{ n: loMoTaEn }] } = await db.query(
    `select count(*)::int as n from mon_an where mo_ta_en is not null`);
  ok('Câu gốc tiếng Anh KHÔNG bị chép thành mô tả công khai', loMoTaEn === 0);
  const { rows: [{ nguon }] } = await db.query(
    `select nguyen_van_nguon as nguon from mon_an where ma = 'D09'`);
  ok('Câu "100% fresh orange" nằm ở cột nội bộ', /100% fresh orange/i.test(nguon));

  const { rows: [{ can }] } = await db.query(
    `select can_xac_nhan as can from mon_an where ma = 'F07'`);
  ok('Ghi chú "cần xác nhận" được giữ lại cho từng món', can && can.length > 20);
});

// ===========================================================================
await nhom('2 · THỰC ĐƠN CÔNG KHAI — HAI LỚP CÔNG TẮC', async () => {
  const { rows: chuaBat } = await db.query(`select * from thuc_don_cong_khai()`);
  ok('Chưa bật công tắc → thực đơn công khai rỗng', chuaBat.length === 0);

  await batCongTac('hien_thuc_don');
  const { rows: batRoi } = await db.query(`select * from thuc_don_cong_khai()`);
  ok('Bật công tắc nhưng chưa duyệt món nào → vẫn rỗng', batRoi.length === 0,
     `${batRoi.length} món lọt ra`);

  await db.query(
    `update mon_an set mo_ta_vi = 'Xà lách romaine, sốt Caesar và phô mai Parmesan.',
                       mo_ta_en = 'Romaine, caesar dressing, parmesan.'
     where ma = 'F01'`);
  await db.query(`update mon_an set trang_thai = 'da_cong_bo' where ma = 'F01'`);

  const { rows: mot } = await db.query(`select * from thuc_don_cong_khai()`);
  ok('Món đã biên tập và công bố thì xuất hiện',
     mot.length === 1 && mot[0].mon_ma === 'F01', `${mot.length} món`);
  ok('Trả về kèm mã nhóm để giao diện gom nhóm được', mot[0].nhom_ma === 'salad');

  const cot = Object.keys(mot[0]);
  for (const noiBo of ['copy_nhap', 'nguyen_van_nguon', 'can_xac_nhan', 'shot_id', 'trang_in']) {
    ok(`Cột nội bộ ${noiBo} KHÔNG lọt ra ngoài`, !cot.includes(noiBo));
  }
});

// ===========================================================================
await nhom('3 · GIÁ CHƯA DUYỆT KHÔNG CÓ ĐƯỜNG RA', async () => {
  // Đề xuất giá là việc bình thường, làm được kể cả khi món đã lên web.
  ok('Đề xuất giá cho một món ĐÃ công bố vẫn làm được',
     (await phaiLoi(db,
       `update mon_an set gia_de_xuat = 159000 where ma = 'F01'`)) === null);

  const { rows: chua } = await db.query(
    `select gia from thuc_don_cong_khai() where mon_ma = 'F01'`);
  ok('Giá mới đề xuất, chưa duyệt → website không thấy gì',
     chua[0].gia === null, `nhận được ${chua[0].gia}`);

  ok('Bật cờ duyệt giá mà cột giá rỗng → bị chặn',
     (await phaiLoi(db,
       `update mon_an set gia_da_duyet = true where ma = 'F02'`)) !== null);

  ok('Đặt giá mà quên bật cờ duyệt → cũng bị chặn',
     (await phaiLoi(db,
       `update mon_an set gia = 159000 where ma = 'F02'`)) !== null);

  // Duyệt = chuyển đề xuất thành giá chính thức, làm một lượt.
  await db.query(
    `update mon_an set gia = gia_de_xuat, gia_da_duyet = true, gia_duyet_luc = now()
     where ma = 'F01'`);
  const { rows: roi } = await db.query(
    `select gia from thuc_don_cong_khai() where mon_ma = 'F01'`);
  ok('Duyệt xong thì website thấy giá', Number(roi[0].gia) === 159000);

  // Bò xem giá tại quầy — cưỡng chế ở database, không nhờ ai nhớ.
  const loiGiaBo = await phaiLoi(db,
    `insert into mon_an (ma, nhom_mon_id, ten_vi, gia)
     values ('B01', (select id from nhom_mon where ma = 'bo-tai-quay'), 'Ribeye', 259000)`);
  ok('KHÔNG gán được giá cho món thuộc nhóm bò tại quầy',
     loiGiaBo !== null && /tại quầy/i.test(loiGiaBo), loiGiaBo || 'GÁN ĐƯỢC — chốt chặn hỏng');

  ok('KHÔNG đề xuất được giá cho món bò',
     (await phaiLoi(db,
       `insert into mon_an (ma, nhom_mon_id, ten_vi, gia_de_xuat)
        values ('B03', (select id from nhom_mon where ma = 'bo-tai-quay'), 'Chadolbagi', 199000)`)) !== null);

  ok('Vẫn thêm được món bò nếu không kèm giá',
     (await phaiLoi(db,
       `insert into mon_an (ma, nhom_mon_id, ten_vi)
        values ('B02', (select id from nhom_mon where ma = 'bo-tai-quay'), 'Ribeye')`)) === null);

  const { rows: [{ xem }] } = await db.query(
    `select khong_niem_yet_gia as xem from nhom_mon where ma = 'bo-tai-quay'`);
  ok('Nhóm bò được đánh dấu xem giá tại quầy', xem === true);
});

// ===========================================================================
await nhom('4 · NỘI DUNG NHÁP KHÔNG CÔNG BỐ ĐƯỢC', async () => {
  // Bốn món trong bảng gốc còn mô tả dạng [chờ duyệt].
  const { rows: nhapCon } = await db.query(
    `select ma from mon_an where copy_nhap ~ '\\[.*\\]' order by ma`);
  ok('Bốn món còn mô tả dạng nháp trong dữ liệu gốc',
     nhapCon.length === 4, nhapCon.map(r => r.ma).join(', '));

  await db.query(`update mon_an set mo_ta_vi = copy_nhap where ma = 'F07'`);
  ok('Mô tả còn dấu ngoặc vuông → không công bố được',
     (await phaiLoi(db,
       `update mon_an set trang_thai = 'da_cong_bo' where ma = 'F07'`)) !== null);

  await db.query(`update mon_an set mo_ta_vi = null where ma = 'F07'`);
  ok('Chưa có mô tả → cũng không công bố được',
     (await phaiLoi(db,
       `update mon_an set trang_thai = 'da_cong_bo' where ma = 'F07'`)) !== null);

  // Món sống bắt buộc có cảnh báo.
  await db.query(`update mon_an set mo_ta_vi = 'Bò sống trộn kiểu Hàn.' where ma = 'F03'`);
  ok('Món sống chưa có cảnh báo → không công bố được',
     (await phaiLoi(db,
       `update mon_an set trang_thai = 'da_cong_bo' where ma = 'F03'`)) !== null);

  await db.query(
    `update mon_an set canh_bao = 'Món dùng bò sống. Hỏi nhân viên về thành phần.'
     where ma = 'F03'`);
  ok('Có cảnh báo rồi thì công bố được',
     (await phaiLoi(db,
       `update mon_an set trang_thai = 'da_cong_bo' where ma = 'F03'`)) === null);

  const { rows: [f03] } = await db.query(
    `select canh_bao, la_mon_song from thuc_don_cong_khai() where mon_ma = 'F03'`);
  ok('Cảnh báo món sống đi kèm ra tới website', f03.la_mon_song && f03.canh_bao?.length > 10);
});

// ===========================================================================
await nhom('5 · ĐỒ UỐNG CÓ CỒN CÓ CÔNG TẮC RIÊNG', async () => {
  await db.query(`update mon_an set mo_ta_vi = 'Whisky, soda và chanh.' where ma = 'D02'`);
  await db.query(`update mon_an set trang_thai = 'da_cong_bo' where ma = 'D02'`);

  const { rows: an } = await db.query(
    `select * from thuc_don_cong_khai() where mon_ma = 'D02'`);
  ok('Đã công bố nhưng công tắc rượu bia chưa bật → vẫn ẩn', an.length === 0);

  await batCongTac('hien_do_uong_co_con');
  const { rows: hien } = await db.query(
    `select * from thuc_don_cong_khai() where mon_ma = 'D02'`);
  ok('Bật công tắc thì đồ uống có cồn hiện ra', hien.length === 1);
  ok('Đồ uống có cồn được đánh dấu rõ', hien[0].co_con === true);
});

// ===========================================================================
await nhom('6 · SONG NGỮ VÀ PHIÊN BẢN', async () => {
  const { rows: [en] } = await db.query(
    `select ten, mo_ta from thuc_don_cong_khai('en') where mon_ma = 'F01'`);
  ok('Thực đơn tiếng Anh trả về tên gốc tiếng Anh', en.ten === 'Caesar Salad');
  ok('Mô tả tiếng Anh dùng bản đã biên tập', en.mo_ta === 'Romaine, caesar dressing, parmesan.');

  const { rows: [vi] } = await db.query(
    `select ten from thuc_don_cong_khai('vi') where mon_ma = 'D02'`);
  ok('Thực đơn tiếng Việt trả về tên tiếng Việt', vi.ten === 'Highball cổ điển');

  // Chuẩn hóa cách viết thương hiệu, giữ bản gốc ở cột nội bộ.
  const { rows: [{ ten_en, nguyen_van_nguon }] } = await db.query(
    `select ten_en, nguyen_van_nguon from mon_an where ma = 'D06'`);
  ok('Tên thương hiệu được chuẩn hóa thành Beeftown', ten_en === 'Beeftown Mule');
  ok('Bản gốc "BeefTown" vẫn lưu ở cột nội bộ để truy vết',
     /BeefTown Mule/.test(nguyen_van_nguon));

  const { rows: chuaCoPb } = await db.query(
    `select phien_ban from thuc_don_cong_khai() limit 1`);
  ok('Chưa có phiên bản nào đang dùng → trả về null', chuaCoPb[0].phien_ban === null);

  await db.query(
    `insert into phien_ban_thuc_don (ma, ngay_hieu_luc, dang_dung)
     values ('v1.0', hom_nay_vn(), true)`);
  const { rows: [pb] } = await db.query(
    `select phien_ban, cap_nhat_ngay from thuc_don_cong_khai() limit 1`);
  ok('Thực đơn kèm số phiên bản và ngày cập nhật (yêu cầu WEBP23)',
     pb.phien_ban === 'v1.0' && pb.cap_nhat_ngay != null);

  ok('Hai phiên bản cùng đang dùng → lỗi trùng',
     (await phaiLoi(db,
       `insert into phien_ban_thuc_don (ma, ngay_hieu_luc, dang_dung)
        values ('v2.0', hom_nay_vn(), true)`)) !== null);
});

// ===========================================================================
await nhom('7 · MÀN HÌNH QUẢN TRỊ TRẢ LỜI ĐƯỢC "VÌ SAO CHƯA LÊN"', async () => {
  const { rows: vuong } = await db.query(`select ma, vuong_gi from v_mon_con_vuong`);
  ok('Liệt kê được các món chưa công bố', vuong.length > 0, `${vuong.length} món`);
  ok('Chỉ ra được món chưa có mô tả',
     vuong.some(r => r.vuong_gi === 'Chưa có mô tả'));

  await db.query(
    `update mon_an set mo_ta_vi = 'Bò Bulgogi cùng rau củ.', gia_de_xuat = 189000
     where ma = 'F05'`);
  const { rows: sau } = await db.query(
    `select vuong_gi from v_mon_con_vuong where ma = 'F05'`);
  ok('Có giá nhưng chưa duyệt thì nói đúng lý do',
     sau[0]?.vuong_gi === 'Giá chưa được duyệt', sau[0]?.vuong_gi);

  await db.query(
    `update mon_an set gia = gia_de_xuat, gia_da_duyet = true where ma = 'F05'`);
  const { rows: xong } = await db.query(
    `select vuong_gi from v_mon_con_vuong where ma = 'F05'`);
  ok('Duyệt xong thì báo sẵn sàng công bố',
     xong[0]?.vuong_gi === 'Sẵn sàng công bố', xong[0]?.vuong_gi);
});

// ===========================================================================
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA THỰC ĐƠN ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
process.exit(hong === 0 ? 0 : 1);
