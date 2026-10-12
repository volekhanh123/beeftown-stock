/**
 * BEEFTOWN CRM — Kiểm thử an toàn (migration 0008)
 * ================================================
 * Bốn lỗ hổng mà 0008 vá, và hai lỗi chỉ số. Mỗi mục ở đây tồn tại vì đã có
 * một lỗ hổng thật, không phải vì cho đủ bộ.
 *
 *     node test/test-an-toan.mjs
 *
 * ĐIỂM QUAN TRỌNG NHẤT — mục 1 kiểm bằng cách LIỆT KÊ pg_proc chứ không phải
 * thử từng hàm. Câu `alter default privileges` trong 0008 sẽ âm thầm vô hiệu
 * nếu sau này có ai tạo hàm dưới một role khác. Nghĩa là độ bền không nằm ở
 * câu DDL mà nằm ở chính bài test này: thêm hàm mới mà quên revoke thì danh
 * sách lệch, và npm test đỏ ngay.
 */

import { dungDatabaseTrong } from './kho-chung.mjs';

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

/** Chạy SQL và KỲ VỌNG nó lỗi. Trả về thông báo lỗi, hoặc null nếu nó lại chạy được. */
async function phaiLoi(db, sql, params = []) {
  try { await db.query(sql, params); return null; }
  catch (e) { return e.message; }
}

console.log('\x1b[1m\nBEEFTOWN CRM — KIỂM THỬ AN TOÀN\x1b[0m');
console.log('='.repeat(60));

// Mô phỏng Supabase (schema auth, ba vai, quyền mặc định đặt TRƯỚC khi nạp migration — thiếu nó thì mọi
// khẳng định "anon không làm được X" đều đúng một cách rỗng) rồi nạp migration: dungDatabaseTrong() của kho-chung.mjs.
const { db } = await dungDatabaseTrong();

// ---------------------------------------------------------------------------
// Dữ liệu mẫu: hai chi nhánh với tỷ lệ quay lại KHÁC NHAU, để mục 4 có thể
// phân biệt được số theo chi nhánh với số toàn thương hiệu.
//   Q1: một khách ghé 2 lần  → tỷ lệ quay lại 100%
//   Q7: một khách ghé 1 lần  → tỷ lệ quay lại 0%
//   Toàn thương hiệu: 2 khách mới, 1 quay lại → 50%
// Ba con số khác nhau, nên không thể nhầm lẫn cái nào đang được trả về.
// ---------------------------------------------------------------------------
const { rows: [cnA] } = await db.query(
  `insert into chi_nhanh (ma, ten) values ('q1','Beeftown Quận 1') returning *`);
const { rows: [cnB] } = await db.query(
  `insert into chi_nhanh (ma, ten) values ('q7','Beeftown Quận 7') returning *`);

for (const cn of [cnA, cnB]) {
  await db.query(
    `insert into cau_hinh_tich_diem (chi_nhanh_id, dang_bat) values ($1, true)`, [cn.id]);
  await db.query(
    `insert into ban_an (chi_nhanh_id, ten, so_cho) values ($1,'B01',4)`, [cn.id]);
}

const uidA   = '11111111-1111-1111-1111-111111111111';
const uidChu = '33333333-3333-3333-3333-333333333333';

await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,$2,'Quản lý Q1','quan_ly')`, [uidA, cnA.id]);
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro)
                values ($1,null,'Chủ sở hữu','chu_so_huu')`, [uidChu]);

await db.query(`select * from ghi_luot_ghe($1,$2,290000::bigint)`, [cnA.id, '0911111111']);
await db.query(`select * from ghi_luot_ghe($1,$2,310000::bigint)`, [cnA.id, '0911111111']);
await db.query(`select * from ghi_luot_ghe($1,$2,290000::bigint)`, [cnB.id, '0922222222']);

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

// ===========================================================================
await nhom('1 · QUYỀN THỰC THI HÀM (lỗ hổng 1 và 4)', async () => {
  // Danh sách hàm anon ĐƯỢC PHÉP gọi. 0013 sẽ mở rộng danh sách này.
  // Sửa danh sách ở đây là một hành vi CÓ Ý THỨC, phải giải thích được.
  const DUOC_PHEP = [
    'chi_nhanh_cong_khai',
    // ghi_nhat_ky_tra_cuu RA KHỎI danh sách từ 0079: nó chèn một dòng mỗi lần gọi, không giới
    // hạn, và ghi được lần "sai" giả để khoá tra cứu của người khác. tra_cuu_dat_ban và
    // huy_dat_ban tự ghi nhật ký. Danh sách ngắn đi = chặt hơn.
    'ghi_su_kien_web',
    'huy_dat_ban',
    'lich_trong_theo_ma',
    'noi_dung_cong_khai',
    'nop_ho_so_ung_tuyen',
    'tao_dat_ban',
    'thuc_don_cong_khai',
    'tin_tuyen_dung_cong_khai',
    // tra_cuu_mot_dat_ban THAY tra_cuu_dat_ban từ 0079: hàm trả bảng cho người gọi PostgREST hủy
    // giao dịch của lần tra sai (406 vnd.pgrst.object+json) — khoá dò mã không bao giờ đếm. Hàm
    // mới trả jsonb, cùng khoá, cùng nhật ký.
    'tra_cuu_mot_dat_ban',
    // Không phải để website gọi: policy tải CV trên storage.objects gọi nó
    // dưới vai anon. Thiếu thì mọi lượt tải CV lỗi quyền — xem 0025.
    've_con_hieu_luc',
    'xin_phieu_tai_cv',
  ].sort();

  const { rows } = await db.query(`
    select distinct p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'execute')
    order by 1`);
  const thucTe = rows.map(r => r.proname).sort();

  const thua = thucTe.filter(x => !DUOC_PHEP.includes(x));
  const thieu = DUOC_PHEP.filter(x => !thucTe.includes(x));

  ok('anon chỉ gọi được đúng những hàm đã duyệt',
     thua.length === 0 && thieu.length === 0,
     [thua.length ? `THỪA: ${thua.join(', ')}` : '',
      thieu.length ? `THIẾU: ${thieu.join(', ')}` : ''].filter(Boolean).join(' · '));

  // Những hàm TUYỆT ĐỐI không được lọt ra ngoài, nêu đích danh để khi hỏng thì
  // thông báo lỗi nói thẳng cái gì đang hở.
  for (const ten of ['tim_hoac_tao_khach', 'ghi_luot_ghe', 'xep_hang_gui_tin',
                     'duoc_phep_gui', 'chi_so_crm', 'so_du_diem', 'tinh_diem_tich']) {
    ok(`anon KHÔNG gọi được ${ten}()`, !thucTe.includes(ten));
  }

  // Kiểm tra bằng hành vi thật, không chỉ bằng bảng quyền: đây chính là cuộc
  // tấn công "người lạ tự phát điểm tích lũy cho mình".
  const tanCong = await duoiDanhNghiaAnon(
    `select * from ghi_luot_ghe($1,$2,500000::bigint)`, [cnA.id, '0999999999']);
  ok('anon KHÔNG tự phát được điểm tích lũy (tấn công thật)',
     tanCong.loi !== null && /permission denied|quyền/i.test(tanCong.loi),
     tanCong.loi ? '' : 'GỌI ĐƯỢC — điểm là tiền!');

  const taoKhach = await duoiDanhNghiaAnon(
    `select * from tim_hoac_tao_khach('0988888888','Kẻ lạ')`);
  ok('anon KHÔNG tự tạo được hồ sơ khách', taoKhach.loi !== null);

  // Mặt còn lại: ba hàm website cần thì phải gọi được thật.
  const lich = await duoiDanhNghiaAnon(
    `select * from lich_trong_theo_ma($1, $2::date)`,
    [cnA.ma, new Date(Date.now() + 86400000).toISOString().slice(0, 10)]);
  ok('anon VẪN xem được lịch trống', lich.loi === null && lich.rows.length > 0);
});

// ===========================================================================
await nhom('2 · VIEW CHẠY DƯỚI QUYỀN NGƯỜI GỌI (lỗ hổng 2)', async () => {
  const { rows: views } = await db.query(`
    select c.relname,
           coalesce(array_to_string(c.reloptions, ','), '') as opts
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v'
    order by 1`);

  const thieu = views.filter(v => !v.opts.includes('security_invoker=true'))
                     .map(v => v.relname);
  ok('MỌI view trong public đều là security_invoker', thieu.length === 0,
     thieu.length ? `còn thiếu: ${thieu.join(', ')}` : `${views.length} view`);

  // Kiểm tra bằng hành vi: trước 0008, quản lý Q1 đọc view sẽ thấy cả khách Q7.
  const q1 = await duoiDanhNghia(uidA, `select sdt from v_khach_tong_hop order by sdt`);
  ok('Quản lý Q1 chỉ thấy khách của Q1 qua view',
     q1.loi === null && q1.rows.length === 1 && q1.rows[0].sdt === '0911111111',
     q1.loi || `thấy ${q1.rows?.length} khách: ${q1.rows?.map(r => r.sdt).join(', ')}`);

  const chu = await duoiDanhNghia(uidChu, `select sdt from v_khach_tong_hop order by sdt`);
  ok('Chủ sở hữu vẫn thấy toàn bộ tệp khách qua view',
     chu.loi === null && chu.rows.length === 2, chu.loi || `thấy ${chu.rows?.length}`);

  const diem = await duoiDanhNghia(uidA, `select sdt from v_so_du_diem order by sdt`);
  ok('v_so_du_diem cũng bị giới hạn theo chi nhánh',
     diem.loi === null && diem.rows.length === 1, diem.loi || `thấy ${diem.rows?.length}`);

  const nhomQ1  = await duoiDanhNghia(uidA,  `select count(*)::int as n from v_thong_ke_nhom`);
  const nhomChu = await duoiDanhNghia(uidChu, `select count(*)::int as n from v_thong_ke_nhom`);
  ok('Thống kê nhóm khác nhau giữa quản lý chi nhánh và chủ sở hữu',
     nhomQ1.loi === null && nhomChu.loi === null);
});

// ===========================================================================
await nhom('3 · MÚI GIỜ VIỆT NAM (lỗ hổng 3)', async () => {
  const MUI_GIO = [`interval '-11:00' hour to minute`,
                   `interval '+00:00' hour to minute`,
                   `interval '+14:00' hour to minute`];

  const ngayVn = [], ngayHeThong = [];
  for (const tz of MUI_GIO) {
    await db.exec(`set time zone ${tz}`);
    const { rows: [r] } = await db.query(
      `select hom_nay_vn()::text as vn, current_date::text as ht`);
    ngayVn.push(r.vn); ngayHeThong.push(r.ht);
  }
  await db.exec(`set time zone interval '+00:00' hour to minute`);

  ok('hom_nay_vn() giống nhau ở mọi múi giờ phiên',
     new Set(ngayVn).size === 1, `nhận được: ${[...new Set(ngayVn)].join(' / ')}`);

  // Chứng minh lỗi CÓ THẬT: current_date lệch khỏi ngày Việt Nam ở ít nhất một
  // múi giờ. Với khoảng -11..+14 thì điều này luôn đúng, bất kể chạy lúc nào.
  ok('current_date THẬT SỰ lệch khỏi ngày Việt Nam (nên mới phải sửa)',
     ngayHeThong.some((d, i) => d !== ngayVn[i]),
     `vn=${ngayVn[0]} · hệ thống=${ngayHeThong.join(',')}`);

  const homNayVn = ngayVn[0];

  // Chốt chặn phía server: khung giờ hôm nay đã trôi qua thì không nhận nữa,
  // kể cả khi gọi thẳng RPC mà không đi qua giao diện.
  const loiDaQua = await phaiLoi(db,
    `select * from tao_dat_ban($1,$2,$3,$4::date,$5::time,$6::smallint)`,
    [cnA.ma, '0977777777', 'Khách Giờ Cũ', homNayVn, '00:00:01', 2]);
  ok('Không đặt được khung giờ hôm nay đã qua (gọi thẳng RPC)',
     loiDaQua !== null && /đã qua/i.test(loiDaQua),
     loiDaQua === null ? 'ĐẶT ĐƯỢC — chốt chặn phía server không có tác dụng' : '');

  // Câu chữ cũ phải giữ nguyên: chay-test.mjs khớp regex /quá khứ/i.
  const homQua = new Date(Date.parse(homNayVn) - 86400000).toISOString().slice(0, 10);
  const loiQuaKhu = await phaiLoi(db,
    `select * from tao_dat_ban($1,$2,$3,$4::date,$5::time,$6::smallint)`,
    [cnA.ma, '0977777776', 'Khách Hôm Qua', homQua, '18:00', 2]);
  ok('Câu báo lỗi ngày quá khứ giữ nguyên từng chữ',
     loiQuaKhu !== null && /quá khứ/i.test(loiQuaKhu));

  // lich_trong_theo_ngay phải đánh dấu da_qua theo giờ Việt Nam.
  const { rows: khung } = await db.query(
    `select gio::text, da_qua from lich_trong_theo_ngay($1,$2::date) order by gio`,
    [cnA.id, homNayVn]);
  const { rows: [{ g }] } = await db.query(`select gio_vn()::text as g`);
  const saiSot = khung.filter(k => k.da_qua !== (k.gio <= g));
  ok('Khung giờ hôm nay được đánh dấu đã qua theo giờ Việt Nam',
     saiSot.length === 0,
     saiSot.length ? `lệch ${saiSot.length}/${khung.length} khung (giờ VN ${g})` : `giờ VN ${g}`);
});

// ===========================================================================
await nhom('4 · CHỈ SỐ CRM (hai lỗi cũ)', async () => {
  async function tyLeQuayLai(chiNhanhId) {
    const { rows } = await db.query(
      `select gia_tri from chi_so_crm($1) where chi_so = 'ty_le_quay_lai_lan_2'`,
      [chiNhanhId]);
    return Number(rows[0].gia_tri);
  }

  const a = await tyLeQuayLai(cnA.id);
  const b = await tyLeQuayLai(cnB.id);
  const toanBo = await tyLeQuayLai(null);

  // Q1 có khách ghé 2 lần → 100%. Q7 có khách ghé 1 lần → 0%.
  // Trước khi sửa, CẢ HAI đều trả về 50% (số toàn thương hiệu).
  ok('Tỷ lệ quay lại của Q1 tính đúng theo chi nhánh', a === 100, `nhận được ${a}%`);
  ok('Tỷ lệ quay lại của Q7 tính đúng theo chi nhánh', b === 0, `nhận được ${b}%`);
  ok('Hai chi nhánh cho hai con số khác nhau (trước đây luôn bằng nhau)', a !== b);
  ok('Không truyền chi nhánh thì ra số toàn thương hiệu', toanBo === 50,
     `nhận được ${toanBo}%`);

  const { rows: [{ def }] } = await db.query(
    `select pg_get_functiondef('chi_so_crm(uuid,date,date)'::regprocedure) as def`);
  ok('Đã dọn biến chết v_hoa_don_co_sdt', !def.includes('v_hoa_don_co_sdt'));
  ok('chi_so_crm dùng hom_nay_vn() cho giá trị mặc định', def.includes('hom_nay_vn'));

  const { rows: sau } = await db.query(`select chi_so from chi_so_crm($1)`, [cnA.id]);
  ok('Vẫn trả về đủ sáu chỉ số', sau.length === 6, `nhận được ${sau.length}`);
});

// ===========================================================================
console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA AN TOÀN ĐỀU ĐẠT\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA\x1b[0m`);
  loi.forEach(l => console.log(`  \x1b[31m· ${l}\x1b[0m`));
}
process.exit(hong === 0 ? 0 : 1);
