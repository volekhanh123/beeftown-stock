/**
 * BEEFTOWN CRM — Kiểm thử schema database
 * =======================================
 * Chạy Postgres thật (PGlite/WASM) trong Node, nạp toàn bộ migration rồi
 * kiểm tra các quy tắc nghiệp vụ quan trọng. Không cần Docker, không cần
 * cài Postgres.
 *
 *     npm run test:db
 *
 * Danh mục kiểm tra bám theo phần Verification trong kế hoạch:
 *   1. Migration chạy sạch trên database trống
 *   2. Chuẩn hóa SĐT — 4 định dạng phải ra cùng một khách
 *   3. Sổ cái điểm — số dư = tổng sổ cái, chặn âm, chặn sửa/xóa
 *   4. Ba luật tính điểm (mục D3)
 *   5. Đặt bàn — số bàn trống giảm đúng, hết bàn thì từ chối
 *   6. Phân nhóm khách & chỉ số
 */

import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

// ---------------------------------------------------------------------------
// Khung test tối giản
// ---------------------------------------------------------------------------
let dat = 0, hong = 0;
const loi = [];

function ok(ten, dieuKien, chiTiet = '') {
  if (dieuKien) {
    dat++;
    console.log(`  \x1b[32m✓\x1b[0m ${ten}`);
  } else {
    hong++;
    loi.push(ten + (chiTiet ? ` — ${chiTiet}` : ''));
    console.log(`  \x1b[31m✗ ${ten}\x1b[0m${chiTiet ? ` — ${chiTiet}` : ''}`);
  }
}

/** Một nhóm kiểm tra. Lỗi bất ngờ tính là hỏng nhưng không làm sập cả lần chạy. */
async function nhom(ten, fn) {
  console.log(`\n\x1b[1m${ten}\x1b[0m`);
  try {
    await fn();
  } catch (e) {
    hong++;
    loi.push(`${ten} — lỗi bất ngờ: ${e.message}`);
    console.log(`  \x1b[31m✗ lỗi bất ngờ: ${e.message}\x1b[0m`);
  }
}

/** Chạy câu SQL và kỳ vọng nó THẤT BẠI. Trả về thông báo lỗi, hoặc null nếu nó chạy được. */
async function phaiLoi(db, sql, params = []) {
  try {
    await db.query(sql, params);
    return null;
  } catch (e) {
    return e.message;
  }
}

// ---------------------------------------------------------------------------
const db = new PGlite();

console.log('\x1b[1m\nBEEFTOWN CRM — KIỂM THỬ DATABASE\x1b[0m');
console.log('='.repeat(60));

// Supabase có sẵn schema `auth` và hàm auth.uid(). PGlite thì không,
// nên tạo bản mô phỏng để migration chạy được.
await db.exec(`
  create schema if not exists auth;
  create table if not exists auth._phien (uid uuid);
  create or replace function auth.uid() returns uuid
    language sql stable as $$ select uid from auth._phien limit 1 $$;
`);

// ---------------------------------------------------------------------------
console.log('\n\x1b[1m1 · NẠP MIGRATION\x1b[0m');
// ---------------------------------------------------------------------------
const files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
for (const f of files) {
  const sql = readFileSync(join(MIGRATIONS_DIR, f), 'utf8');
  try {
    await db.exec(sql);
    ok(`${f} chạy sạch`, true);
  } catch (e) {
    ok(`${f} chạy sạch`, false, e.message);
    console.log('\n\x1b[31mDừng: migration lỗi thì không test tiếp được.\x1b[0m\n');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Dữ liệu nền
// ---------------------------------------------------------------------------
const { rows: [cn] } = await db.query(`
  insert into chi_nhanh (ma, ten, khu_vuc, dia_chi)
  values ('q1', 'Beeftown Quận 1', 'Cầu Ông Lãnh', 'Quận 1, TP.HCM')
  returning *
`);
await db.query(
  `insert into cau_hinh_tich_diem (chi_nhanh_id, ty_le_tich, nguong_dung_toi_thieu, dang_bat)
   values ($1, 0.03, 50000, true)`, [cn.id]);
for (let i = 1; i <= 5; i++) {
  await db.query(`insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1, $2, 4)`,
    [cn.id, `B0${i}`]);
}

let khachId = null;

// ---------------------------------------------------------------------------
await nhom('2 · CHUẨN HÓA SỐ ĐIỆN THOẠI', async () => {
  const dinhDang = ['+84912345678', '0912 345 678', '84912345678', '912345678'];
  const ids = new Set();
  for (const sdt of dinhDang) {
    const { rows: [k] } = await db.query(`select * from tim_hoac_tao_khach($1, $2)`,
      [sdt, 'Nguyễn Văn A']);
    ids.add(k.id);
  }
  khachId = [...ids][0];

  ok('4 định dạng SĐT → cùng 1 hồ sơ khách', ids.size === 1, `tạo ra ${ids.size} hồ sơ`);

  const { rows: [k1] } = await db.query(`select sdt from khach_hang where id = $1`, [khachId]);
  ok('SĐT lưu ở dạng 0912345678', k1.sdt === '0912345678', `thực tế: ${k1.sdt}`);

  ok('SĐT sai định dạng bị từ chối',
     (await phaiLoi(db, `select tim_hoac_tao_khach('123', 'Sai')`)) !== null);
  ok('Chèn thẳng SĐT rác vào bảng cũng bị chặn',
     (await phaiLoi(db, `insert into khach_hang (sdt) values ('abc')`)) !== null);
});

// ---------------------------------------------------------------------------
await nhom('3 · SỔ CÁI ĐIỂM', async () => {
  // Hóa đơn 290.000đ (mức trung bình trong mô hình tài chính) → 3% = 8.700đ
  const { rows: [g1] } = await db.query(
    `select * from ghi_luot_ghe($1, $2, $3::bigint, $4, $5::smallint)`,
    [cn.id, '0912345678', 290000, 'Nguyễn Văn A', 2]);
  ok('Hóa đơn 290.000đ tích đúng 8.700đ (3%)', Number(g1.diem_tich_duoc) === 8700,
     `thực tế: ${g1.diem_tich_duoc}`);
  ok('Số dư sau lượt 1 = 8.700đ', Number(g1.so_du_moi) === 8700);

  for (let i = 0; i < 5; i++) {
    await db.query(`select * from ghi_luot_ghe($1, $2, $3::bigint)`,
      [cn.id, '0912345678', 290000]);
  }
  const { rows: [{ so_du }] } = await db.query(`select so_du_diem($1) as so_du`, [khachId]);
  ok('Sau 6 lượt: số dư = 52.200đ', Number(so_du) === 52200, `thực tế: ${so_du}`);

  const { rows: [k] } = await db.query(`
    select so_du_diem($1) as tu_ham,
           (select coalesce(sum(so_diem),0) from so_cai_diem where khach_hang_id = $1) as tu_so_cai,
           (select so_du_sau from so_cai_diem where khach_hang_id = $1
            order by created_at desc, id desc limit 1) as so_du_sau_cuoi`, [khachId]);
  ok('Số dư = tổng sổ cái', Number(k.tu_ham) === Number(k.tu_so_cai));
  ok('Cột so_du_sau khớp số dư thực', Number(k.so_du_sau_cuoi) === Number(k.tu_ham),
     `so_du_sau=${k.so_du_sau_cuoi}, thực=${k.tu_ham}`);

  const loiAm = await phaiLoi(db,
    `insert into so_cai_diem (chi_nhanh_id, khach_hang_id, loai, so_diem)
     values ($1, $2, 'dung', -999999999)`, [cn.id, khachId]);
  ok('Trừ quá số dư bị chặn', loiAm !== null && /Không đủ điểm/.test(loiAm));

  const loiSua = await phaiLoi(db,
    `update so_cai_diem set so_diem = 999 where khach_hang_id = $1`, [khachId]);
  ok('UPDATE sổ cái bị chặn', loiSua !== null && /bất biến/i.test(loiSua));

  const loiXoa = await phaiLoi(db,
    `delete from so_cai_diem where khach_hang_id = $1`, [khachId]);
  ok('DELETE sổ cái bị chặn', loiXoa !== null && /bất biến/i.test(loiXoa));
});

// ---------------------------------------------------------------------------
await nhom('4 · BA LUẬT TÍNH ĐIỂM (mục D3)', async () => {
  // Luật 1 — ngưỡng dùng tối thiểu 50.000đ
  await db.query(`select * from tim_hoac_tao_khach('0900000111', 'Khách Ít Điểm')`);
  await db.query(`select * from ghi_luot_ghe($1, $2, $3::bigint)`,
    [cn.id, '0900000111', 100000]);              // tích 3.000đ — dưới ngưỡng
  const loiNguong = await phaiLoi(db,
    `select * from ghi_luot_ghe($1, $2, $3::bigint, null, null, $4::bigint)`,
    [cn.id, '0900000111', 200000, 1000]);
  ok('Luật 1 — dưới ngưỡng 50.000đ không được dùng điểm',
     loiNguong !== null && /ngưỡng/i.test(loiNguong));

  // Luật 2 — không tích trên phần đã trừ bằng điểm
  // Khách có 52.200đ, dùng 50.000đ cho hóa đơn 290.000đ → tích trên 240.000đ = 7.200đ
  const { rows: [g2] } = await db.query(
    `select * from ghi_luot_ghe($1, $2, $3::bigint, null, null, $4::bigint)`,
    [cn.id, '0912345678', 290000, 50000]);
  ok('Luật 2 — tích trên 240.000đ (đã trừ 50k điểm) = 7.200đ',
     Number(g2.diem_tich_duoc) === 7200, `thực tế: ${g2.diem_tich_duoc}`);
  ok('Điểm đã dùng được ghi nhận đúng', Number(g2.diem_da_dung) === 50000);

  const { rows: [{ so_du: sd2 }] } = await db.query(`select so_du_diem($1) as so_du`, [khachId]);
  ok('Số dư sau khi dùng 50k và tích 7.2k = 9.400đ', Number(sd2) === 9400, `thực tế: ${sd2}`);

  // Luật 3 — hóa đơn khuyến mãi không tích điểm
  const { rows: [g3] } = await db.query(
    `select * from ghi_luot_ghe($1, $2, $3::bigint, null, null, 0::bigint, true)`,
    [cn.id, '0912345678', 500000]);
  ok('Luật 3 — hóa đơn khuyến mãi không tích điểm',
     Number(g3.diem_tich_duoc) === 0, `thực tế: ${g3.diem_tich_duoc}`);

  const { rows: [tt] } = await db.query(`
    select tinh_diem_tich(290000, 0, false, 0.03)     as binh_thuong,
           tinh_diem_tich(290000, 50000, false, 0.03) as co_tru_diem,
           tinh_diem_tich(290000, 0, true, 0.03)      as khuyen_mai,
           tinh_diem_tich(0, 0, false, 0.03)          as hoa_don_khong`);
  ok('tinh_diem_tich: 290k → 8.700đ', Number(tt.binh_thuong) === 8700);
  ok('tinh_diem_tich: 290k trừ 50k điểm → 7.200đ', Number(tt.co_tru_diem) === 7200);
  ok('tinh_diem_tich: khuyến mãi → 0đ', Number(tt.khuyen_mai) === 0);
  ok('tinh_diem_tich: hóa đơn 0đ → 0đ', Number(tt.hoa_don_khong) === 0);

  ok('Không đặt được tỷ lệ tích 50% (trần an toàn 20%)',
     (await phaiLoi(db,
       `update cau_hinh_tich_diem set ty_le_tich = 0.50 where chi_nhanh_id = $1`,
       [cn.id])) !== null);
});

// ---------------------------------------------------------------------------
await nhom('5 · ĐẶT BÀN', async () => {
  const ngayMai = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const { rows: khungGio } = await db.query(
    `select * from lich_trong_theo_ngay($1, $2::date)`, [cn.id, ngayMai]);
  ok('Sinh được khung giờ cả ngày', khungGio.length > 0, `${khungGio.length} khung`);
  ok('Có cả buổi trưa và buổi tối',
     khungGio.some(k => k.buoi === 'trua') && khungGio.some(k => k.buoi === 'toi'));

  const { rows: [truoc] } = await db.query(
    `select so_ban_con_trong($1, $2::date, '18:00'::time) as n`, [cn.id, ngayMai]);
  ok('Ban đầu còn đủ 5 bàn lúc 18:00', Number(truoc.n) === 5, `thực tế: ${truoc.n}`);

  const { rows: [dat1] } = await db.query(
    `select * from tao_dat_ban($1, $2, $3, $4::date, $5::time, $6::smallint, null, null, true)`,
    [cn.ma, '0987654321', 'Trần Thị B', ngayMai, '18:00', 4]);
  ok('Tạo được đặt bàn', dat1.dat_ban_id != null);
  ok('Có mã đặt bàn ngắn để đọc qua điện thoại',
     typeof dat1.ma_dat_ban === 'string' && dat1.ma_dat_ban.length === 6);
  ok('Sau 1 lượt đặt, còn 4 bàn', Number(dat1.con_trong) === 4, `thực tế: ${dat1.con_trong}`);

  const { rows: [{ n: soDongY }] } = await db.query(
    `select count(*) as n from nhat_ky_dong_y where dong_y = true`);
  ok('Đồng ý nhận tin được ghi nhật ký', Number(soDongY) >= 1);

  const { rows: [ke] } = await db.query(
    `select so_ban_con_trong($1, $2::date, '19:00'::time) as n`, [cn.id, ngayMai]);
  ok('Lượt ngồi 120 phút chặn cả khung 19:00', Number(ke.n) === 4, `thực tế: ${ke.n}`);

  const { rows: [xa] } = await db.query(
    `select so_ban_con_trong($1, $2::date, '21:00'::time) as n`, [cn.id, ngayMai]);
  ok('Khung 21:00 không bị ảnh hưởng', Number(xa.n) === 5, `thực tế: ${xa.n}`);

  for (let i = 2; i <= 5; i++) {
    await db.query(
      `select * from tao_dat_ban($1, $2, $3, $4::date, $5::time, $6::smallint)`,
      [cn.ma, `090000022${i}`, `Khách ${i}`, ngayMai, '18:00', 2]);
  }
  const loiHetBan = await phaiLoi(db,
    `select * from tao_dat_ban($1, $2, $3, $4::date, $5::time, $6::smallint)`,
    [cn.ma, '0900000999', 'Khách Thừa', ngayMai, '18:00', 2]);
  ok('Hết bàn thì từ chối đặt', loiHetBan !== null && /hết bàn/i.test(loiHetBan));

  const homQua = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const loiQuaKhu = await phaiLoi(db,
    `select * from tao_dat_ban($1, $2, $3, $4::date, $5::time, $6::smallint)`,
    [cn.ma, '0900000888', 'Khách Quá Khứ', homQua, '18:00', 2]);
  ok('Không đặt được ngày quá khứ', loiQuaKhu !== null && /quá khứ/i.test(loiQuaKhu));

  ok('Mã chi nhánh không phân biệt hoa thường',
     (await phaiLoi(db,
       `select * from tao_dat_ban($1, $2, $3, $4::date, $5::time, $6::smallint)`,
       ['Q1', '0900000777', 'Khách Hoa Thường', ngayMai, '12:00', 2])) === null);
});

// ---------------------------------------------------------------------------
await nhom('6 · PHÂN NHÓM KHÁCH & CHỈ SỐ', async () => {
  const { rows: n1 } = await db.query(
    `select nhom, so_lan_ghe from v_phan_nhom_khach where khach_hang_id = $1`, [khachId]);
  ok('Khách nhiều lượt ghé được xếp nhóm thân thiết', n1[0]?.nhom === 'than_thiet',
     `nhóm: ${n1[0]?.nhom}, lượt: ${n1[0]?.so_lan_ghe}`);

  // Khách ngủ đông: 2 lượt, gần nhất 90 ngày trước
  const { rows: [kNgu] } = await db.query(
    `select * from tim_hoac_tao_khach('0911222333', 'Khách Ngủ Đông')`);
  for (let i = 0; i < 2; i++) {
    await db.query(
      `insert into luot_ghe (chi_nhanh_id, khach_hang_id, tong_hoa_don, thoi_diem)
       values ($1, $2, 250000, now() - interval '90 days')`, [cn.id, kNgu.id]);
  }
  const { rows: [ngu] } = await db.query(
    `select nhom from v_phan_nhom_khach where khach_hang_id = $1`, [kNgu.id]);
  ok('Khách 90 ngày không quay lại → nhóm ngủ đông', ngu.nhom === 'ngu_dong',
     `nhóm: ${ngu.nhom}`);

  await db.query(`update khach_hang set la_khach_b2b = true, ten_cong_ty = 'Công ty ABC'
                  where sdt = '0987654321'`);
  const { rows: [b2b] } = await db.query(
    `select nhom from v_phan_nhom_khach where sdt = '0987654321'`);
  ok('Khách B2B được tách riêng', b2b.nhom === 'b2b', `nhóm: ${b2b.nhom}`);

  const { rows: guiTin } = await db.query(`select * from v_duoc_gui_tin`);
  const { rows: [{ n: tong }] } = await db.query(`select count(*) as n from khach_hang`);
  ok('Danh sách gửi tin ít hơn tổng khách (đã lọc đồng ý + đã giao dịch)',
     guiTin.length < Number(tong), `gửi được ${guiTin.length}/${tong}`);
  ok('Mọi khách trong danh sách gửi tin đều đã đồng ý',
     guiTin.every(k => k.dang_dong_y_nhan_tin === true));
  ok('Mọi khách trong danh sách gửi tin đều đã từng giao dịch',
     guiTin.every(k => Number(k.so_lan_ghe) > 0));

  const { rows: chiSo } = await db.query(`select * from chi_so_crm($1)`, [cn.id]);
  ok('Hàm chỉ số trả về đủ 6 dòng', chiSo.length === 6, `${chiSo.length} dòng`);
  ok('Có chỉ số tỷ lệ quay lại lần 2',
     chiSo.some(c => c.chi_so === 'ty_le_quay_lai_lan_2'));

  // Đường lui: phải xuất được toàn bộ dữ liệu bất cứ lúc nào
  const { rows: xuat } = await db.query(`
    select sdt, ho_ten, so_lan_ghe, tong_chi_tieu, diem_hien_co
    from v_khach_tong_hop order by tong_chi_tieu desc`);
  ok('Xuất được toàn bộ khách (đường lui khỏi hệ thống)', xuat.length > 0,
     `${xuat.length} khách`);
});

// ---------------------------------------------------------------------------
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA ĐỀU ĐẠT\x1b[0m\n`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} KIỂM TRA HỎNG\x1b[0m (đạt ${dat})\n`);
  loi.forEach(l => console.log(`  · ${l}`));
  console.log('');
}
await db.close();
process.exit(hong === 0 ? 0 : 1);
