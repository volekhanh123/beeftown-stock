/**
 * BEEFTOWN — TRỢ LÝ TRANG: DATABASE (0126) VÀ EDGE FUNCTION CHẠY TRÊN DATABASE THẬT
 * ================================================================================
 *
 *     node test/test-tro-ly-trang.mjs
 *
 * Khánh 17–18/11/2026: khung chat tư vấn chọn bò ở trang Mua thịt về, trợ lý tên Trang (Claude Haiku 5.5 trong Edge
 * Function tro-ly-trang). Database giữ công tắc, giới hạn lượt, nhật ký đã che, sổ học. Theo 9 mục "xong":
 *
 *   1. quyen — hai hàm của Edge Function chỉ service_role gọi được (anon, chủ, nhân viên: không); sổ học: chủ, quản lý
 *      sửa, marketing chỉ xem, thu ngân, thủ kho, người đã nghỉ, tài khoản không có nhan_su, anon: không thấy gì; ô
 *      người duyệt, số lần hỏi chỉ database ghi; nhật ký: chủ, quản lý chỉ đọc, không ai ghi thẳng.
 *   2. bam-hai-lan — cùng (cuộc, ma_tin): một dòng, lần hai "đang trả lời" rồi "đã trả lời" kèm câu cũ; Edge Function
 *      gọi Claude đúng một lần; lỗi hay treo quá 90 giây thì thử lại trên chính dòng đó; hai tin khác nhau không trùng
 *      số lượt.
 *   3. gio-vn — nguồn câu sổ học ghi ngày theo giờ Việt Nam (hom_nay_vn): 23:50 và 00:10.
 *   4. chu-va-so — câu hỏi có dấu gộp đúng (khác dấu câu, khác hoa thường) và không gộp nhầm ("Đúng" ≠ "dừng"); che số
 *      điện thoại kiểu Việt, email, dãy 9 số; "1,5 gói", "225 gam" giữ nguyên.
 *   5. mat-mang — ở test-tro-ly-trang-ham.mjs (Edge Function với Claude và database giả hỏng từng kiểu).
 *   6. ton-kho — không áp dụng: không đụng kho.
 *   7. cau-chu — mô tả khóa công tắc có bản tiếng Anh (cau-noi-bo.ts); không câu raise mới.
 *   8. migration — 0126 chạy sau 0084, 0101, 0113, 0115.
 *   9. dich-vu-ngoai — đèn "Trợ lý Trang": số liệu suc_khoe_so_lieu() ở đây, màu và câu ở test-suc-khoe-web.mjs.
 */

import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dungDatabase, taoBoDem, maGui, UID, datGioDatabase, traGioDatabase } from './kho-chung.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOC = join(__dirname, '..', '..');
const nap = (...duong) => import(pathToFileURL(join(GOC, ...duong)).href);
const { xuLyYeuCau } = await nap('crm', 'supabase', 'functions', 'tro-ly-trang', 'xu-ly.ts');
const { MO_TA_KHOA_EN } = await nap('web', 'src', 'lib', 'cau-noi-bo.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRỢ LÝ TRANG: DATABASE (0126) VÀ EDGE FUNCTION');
const { db, cnA, duoi, duoiAnon } = await dungDatabase();

const UID_LA = '00000000-0000-4000-8000-0000000000aa';
const vi = r => (r.loi ? `${r.ma}: ${r.loi}` : JSON.stringify(r.kq ?? r.rows));
const goi = async (uid, sql, p = []) => {
  const r = await (uid === 'anon' ? duoiAnon(sql, p) : duoi(uid, sql, p));
  return { ...r, kq: r.rows?.[0]?.r };
};
const nghi = () => new Promise(xong => setTimeout(xong, 3));

/** Chạy dưới vai service_role — vai của Edge Function. */
async function dichVu(sql, p = []) {
  await db.exec('set role service_role');
  try { return { rows: (await db.query(sql, p)).rows, loi: null }; }
  catch (e) { return { rows: null, loi: e.message }; }
  finally { await db.exec('reset role'); }
}
const MO = `select tro_ly_mo_luot($1::uuid, $2::uuid, $3, $4::inet, $5) as r`;
const GHI = `select tro_ly_ghi_luot($1::uuid, $2::uuid, $3::jsonb) as r`;
const mo = async (cuoc, maTin, tin = 'nhà 4 người nên lấy gì', ip = '203.0.113.9') =>
  (await dichVu(MO, [cuoc, maTin, tin, ip, 'q1'])).rows?.[0]?.r;
const ghi = async (cuoc, maTin, ketQua) => (await dichVu(GHI, [cuoc, maTin, JSON.stringify(ketQua)])).rows?.[0]?.r;
const TRA_LOI = { tin: ['Dạ nhà mình 4 người ạ.'], the: [], don: [], chot: false, chuyen_nguoi: false, cau_chua_biet: '' };

// ---------------------------------------------------------------------------
// Menu bán lẻ — khuôn test-mua-thit-dat-hang.mjs
// ---------------------------------------------------------------------------
async function matHang(ma, gia) {
  const { rows: [r] } = await db.query(
    `insert into kho_mat_hang (ma, ten, loai, dem_goi, gia_ban_kg) values ($1, $1, 'phan_cat', false, $2) returning id`, [ma, gia]);
  return r.id;
}
const doc = async id => (await goi(UID.chu, `select ban_le_danh_sach(null, $1) as r`, [id])).kq?.[0];
async function luu(id, duLieu) {
  await nghi();
  const sp = await doc(id);
  const r = await goi(UID.chu, `select ban_le_luu_san_pham($1, $2::timestamptz, $3::jsonb) as r`, [id, sp.updated_at, JSON.stringify(duLieu)]);
  if (r.loi || r.kq?.ok !== true) throw new Error(`không lưu được: ${vi(r)}`);
}
async function chot(id) {
  await nghi();
  const sp = await doc(id);
  const r = await goi(UID.chu, `select ban_le_chot_gia($1, $2::timestamptz, $3::jsonb) as r`, [id, sp.updated_at, JSON.stringify(sp.gia_de_chot)]);
  if (r.loi || r.kq?.ok !== true) throw new Error(`không chốt được giá: ${vi(r)}`);
}
async function tao(ma, ten, loai = 'thit', cach = 'theo_can') {
  const r = await goi(UID.chu, `select ban_le_tao_san_pham($1, $2, $3, $4, $5) as r`, [maGui(), ma, ten, loai, cach]);
  if (r.loi || !r.kq?.id) throw new Error(`không tạo được ${ma}: ${vi(r)}`);
  return r.kq.id;
}
const congBo = (khoa, giaTri, uid = UID.chu) => goi(uid, `select dat_noi_dung($1, p_bool := $2::boolean, p_cong_bo := true) as r`, [khoa, giaTri]);
const thuHoi = khoa => goi(UID.chu, `select thu_hoi_noi_dung($1) as r`, [khoa]);

// ===========================================================================
await nhom('0 · DỰNG MENU: một phần thịt đã chốt giá, trang Mua thịt về mở', async () => {
  const mh = await matHang('RIBEYE-CAP', 2000000);
  const id = await tao('ribeye-with-cap', 'Ribeye with Cap');
  await luu(id, { mat_hang_id: mh, trang_thai: 'dang_ban', thu_tu: 1, bao_quan: 'mat' });
  await chot(id);
  const r = await congBo('hien_mua_thit_ve', true);
  ok('Công bố hien_mua_thit_ve', r.loi === null, vi(r));
  const { rows } = await duoiAnon(`select * from mua_thit_ve_cong_khai('vi', 'q1')`);
  ok('Menu công khai có gói của ribeye-with-cap', rows?.some(d => d.san_pham_ma === 'ribeye-with-cap'), JSON.stringify(rows));
});

await nhom('1 · CÔNG TẮC hien_tro_ly_trang: mặc định tắt, chỉ chủ bật', async () => {
  const k = (await db.query(`select * from khoa_cong_bo where khoa = 'hien_tro_ly_trang'`)).rows[0];
  ok('Khóa có trong sổ đăng ký, kiểu bool, nhóm mua_thit, chỉ chủ', k?.kieu === 'bool' && k?.nhom === 'mua_thit' && k?.chi_chu_so_huu === true, JSON.stringify(k));
  ok('Mô tả khóa có bản tiếng Anh (cau-noi-bo.ts)', typeof MO_TA_KHOA_EN?.hien_tro_ly_trang === 'string' && MO_TA_KHOA_EN.hien_tro_ly_trang.length > 40);
  const nd = (await duoiAnon(`select noi_dung_cong_khai('vi') as r`)).rows?.[0]?.r;
  ok('noi_dung_cong_khai(): khóa có mặt, chưa công bố = null', nd && 'hien_tro_ly_trang' in nd && nd.hien_tro_ly_trang === null);
  const kq = await mo(crypto.randomUUID(), crypto.randomUUID());
  ok('Chưa công bố → tro_ly_mo_luot từ chối "tat", không ghi dòng nào', kq?.duoc === false && kq?.ly_do === 'tat', JSON.stringify(kq));
  ok('…và không tốn lượt giới hạn IP', Number((await db.query(`select count(*) n from gioi_han_luot where viec = 'tro_ly_trang'`)).rows[0].n) === 0);
  const ql = await congBo('hien_tro_ly_trang', true, UID.qlA);
  ok('Quản lý không công bố được công tắc (chỉ chủ)', ql.loi !== null, vi(ql));
  const chu = await congBo('hien_tro_ly_trang', true);
  ok('Chủ công bố được', chu.loi === null, vi(chu));
  const nd2 = (await duoiAnon(`select noi_dung_cong_khai('vi') as r`)).rows?.[0]?.r;
  ok('noi_dung_cong_khai().hien_tro_ly_trang = true', nd2?.hien_tro_ly_trang === true);
});

await nhom('2 · QUYỀN: hai hàm của Edge Function chỉ service_role', async () => {
  const cuoc = crypto.randomUUID(), tin = crypto.randomUUID();
  for (const [ten, uid] of [['anon', 'anon'], ['chủ', UID.chu], ['quản lý', UID.qlA], ['marketing', UID.mktA]]) {
    const r = await goi(uid, `select tro_ly_mo_luot($1::uuid, $2::uuid, 'x', null, null) as r`, [cuoc, tin]);
    ok(`${ten} không gọi được tro_ly_mo_luot`, r.loi !== null && /permission denied/.test(r.loi), vi(r));
    const g = await goi(uid, `select tro_ly_ghi_luot($1::uuid, $2::uuid, '{}'::jsonb) as r`, [cuoc, tin]);
    ok(`${ten} không gọi được tro_ly_ghi_luot`, g.loi !== null && /permission denied/.test(g.loi), vi(g));
    const c = await goi(uid, `select tro_ly_che_so('0912345678') as r`);
    ok(`${ten} không gọi được tro_ly_che_so`, c.loi !== null, vi(c));
  }
  const dv = await mo(cuoc, tin);
  ok('service_role gọi được (công tắc bật → được)', dv?.duoc === true, JSON.stringify(dv));
  await ghi(cuoc, tin, { tra_loi: TRA_LOI });
});

await nhom('2b · QUYỀN SỔ HỌC VÀ NHẬT KÝ', async () => {
  const xem = async uid => goi(uid, `select count(*)::int as r from tro_ly_so_hoc`);
  ok('Chủ thấy 6 câu ghi sẵn', (await xem(UID.chu)).kq === 6, vi(await xem(UID.chu)));
  ok('Quản lý thấy', (await xem(UID.qlA)).kq === 6);
  ok('Marketing thấy', (await xem(UID.mktA)).kq === 6);
  for (const [ten, uid] of [['thu ngân', UID.thuNganA], ['thủ kho', UID.thuKhoA], ['người đã nghỉ', UID.nghiViec], ['tài khoản không có nhan_su', UID_LA]]) {
    const r = await xem(uid);
    ok(`${ten} không thấy câu nào`, r.kq === 0 || r.loi !== null, vi(r));
  }
  const anon = await goi('anon', `select count(*)::int as r from tro_ly_so_hoc`);
  ok('anon không đọc được sổ học', anon.loi !== null, vi(anon));

  const them = (uid, hoi) => goi(uid, `insert into tro_ly_so_hoc (hoi, dap, trang_thai, nguon) values ($1, 'Dạ có ạ.', 'cho_duyet', 'thử') returning id as r`, [hoi]);
  const tq = await them(UID.qlA, 'Có túi giữ lạnh không?');
  ok('Quản lý thêm được câu', tq.loi === null && tq.kq, vi(tq));
  const tm = await them(UID.mktA, 'Có giao tỉnh không?');
  ok('Marketing không thêm được', tm.loi !== null, vi(tm));
  const ttn = await them(UID.thuNganA, 'Có giao tỉnh không?');
  ok('Thu ngân không thêm được', ttn.loi !== null, vi(ttn));
  const sm = await goi(UID.mktA, `update tro_ly_so_hoc set trang_thai = 'da_duyet' where id = $1 returning id as r`, [tq.kq]);
  ok('Marketing không duyệt được (không dòng nào đổi)', sm.loi !== null || !sm.kq, vi(sm));
  const ghiDuyet = await goi(UID.chu, `update tro_ly_so_hoc set duyet_boi = null, so_lan_hoi = 99 where id = $1 returning id as r`, [tq.kq]);
  ok('Không ai tự ghi ô người duyệt, số lần hỏi (quyền cột)', ghiDuyet.loi !== null, vi(ghiDuyet));
  const xoaMkt = await goi(UID.mktA, `delete from tro_ly_so_hoc where id = $1 returning id as r`, [tq.kq]);
  ok('Marketing không xóa được', xoaMkt.loi !== null || !xoaMkt.kq, vi(xoaMkt));
  const xoaQl = await goi(UID.qlA, `delete from tro_ly_so_hoc where id = $1 returning id as r`, [tq.kq]);
  ok('Quản lý xóa được', xoaQl.loi === null && xoaQl.kq === tq.kq, vi(xoaQl));

  const nk = async uid => goi(uid, `select count(*)::int as r from tro_ly_luot`);
  ok('Chủ đọc được nhật ký', (await nk(UID.chu)).kq >= 1, vi(await nk(UID.chu)));
  ok('Quản lý đọc được nhật ký', (await nk(UID.qlA)).kq >= 1);
  ok('Marketing không thấy nhật ký', (await nk(UID.mktA)).kq === 0);
  ok('anon không đọc được nhật ký', (await nk('anon')).loi !== null);
  const ghiThang = await goi(UID.chu, `insert into tro_ly_luot (cuoc_id, ma_tin, luot, tin_khach) values (gen_random_uuid(), gen_random_uuid(), 1, 'x') returning id as r`);
  ok('Chủ cũng không ghi thẳng nhật ký', ghiThang.loi !== null, vi(ghiThang));
});

await nhom('3 · GỬI HAI LẦN: cùng (cuộc, ma_tin) một dòng, một câu trả lời', async () => {
  const cuoc = crypto.randomUUID(), tin = crypto.randomUUID();
  const lan1 = await mo(cuoc, tin);
  ok('Lần một: được, lượt 1', lan1?.duoc === true && lan1.luot === 1, JSON.stringify(lan1));
  const lan2 = await mo(cuoc, tin);
  ok('Lần hai lúc đang trả lời: "dang_tra_loi"', lan2?.duoc === false && lan2.ly_do === 'dang_tra_loi', JSON.stringify(lan2));
  ok('Ghi lượt: true', (await ghi(cuoc, tin, { tra_loi: TRA_LOI })) === true);
  ok('Ghi lại lượt đã đóng: false (không ghi đè)', (await ghi(cuoc, tin, { tra_loi: { ...TRA_LOI, tin: ['khác'] } })) === false);
  const lan3 = await mo(cuoc, tin);
  ok('Lần ba sau khi trả lời: "da_tra_loi" kèm đúng câu cũ', lan3?.ly_do === 'da_tra_loi' && lan3.tra_loi?.tin?.[0] === TRA_LOI.tin[0], JSON.stringify(lan3));
  ok('Chỉ một dòng nhật ký', Number((await db.query(`select count(*) n from tro_ly_luot where cuoc_id = $1`, [cuoc])).rows[0].n) === 1);

  const tinLoi = crypto.randomUUID();
  await mo(cuoc, tinLoi, 'tin thứ hai');
  ok('Lượt lỗi ghi trang_thai loi', (await ghi(cuoc, tinLoi, { loi: 'claude_529' })) === true
    && (await db.query(`select trang_thai, loi from tro_ly_luot where ma_tin = $1`, [tinLoi])).rows[0]?.loi === 'claude_529');
  const thuLai = await mo(cuoc, tinLoi, 'tin thứ hai');
  ok('Thử lại lượt lỗi: được, giữ số lượt 2, cùng dòng', thuLai?.duoc === true && thuLai.luot === 2
    && Number((await db.query(`select count(*) n from tro_ly_luot where ma_tin = $1`, [tinLoi])).rows[0].n) === 1, JSON.stringify(thuLai));
  await db.query(`update tro_ly_luot set created_at = now() - interval '2 minutes' where ma_tin = $1`, [tinLoi]);
  const treo = await mo(cuoc, tinLoi, 'tin thứ hai');
  ok('Lượt treo quá 90 giây: cho thử lại', treo?.duoc === true, JSON.stringify(treo));
  await ghi(cuoc, tinLoi, { tra_loi: TRA_LOI });

  const tin3 = crypto.randomUUID();
  const l3 = await mo(cuoc, tin3, 'tin thứ ba');
  ok('Tin khác cùng cuộc: lượt 3', l3?.luot === 3, JSON.stringify(l3));
  ok('Lịch sử của lượt 3: hai lượt đã trả lời, cũ trước', l3?.lich_su?.length === 2 && l3.lich_su[0].khach === 'nhà 4 người nên lấy gì', JSON.stringify(l3?.lich_su));
  ok('Lượt trả dữ liệu menu và 5 câu sổ học đã duyệt', Array.isArray(l3?.menu) && l3.menu.length >= 1 && l3?.so_hoc?.length === 5, JSON.stringify(l3?.so_hoc?.length));
  await ghi(cuoc, tin3, { tra_loi: TRA_LOI });

  await db.query(`insert into tro_ly_luot (cuoc_id, ma_tin, luot, tin_khach, trang_thai)
                  select $1, gen_random_uuid(), g, 'x', 'tra_loi' from generate_series(4, 30) g`, [cuoc]);
  const qua = await mo(cuoc, crypto.randomUUID(), 'tin 31');
  ok('Quá 30 lượt mỗi cuộc: "qua_luot_cuoc"', qua?.ly_do === 'qua_luot_cuoc', JSON.stringify(qua));
});

await nhom('4 · GIỚI HẠN: 40 lượt mỗi giờ mỗi IP, 2.000 lượt mỗi ngày cả quán', async () => {
  await db.query(`delete from gioi_han_luot where viec = 'tro_ly_trang'`);
  let cuoi;
  for (let i = 0; i < 40; i++) { cuoi = await mo(crypto.randomUUID(), crypto.randomUUID(), 'chào em', '198.51.100.7'); }
  ok('Lượt thứ 40 của một IP: được', cuoi?.duoc === true, JSON.stringify(cuoi));
  const r41 = await mo(crypto.randomUUID(), crypto.randomUUID(), 'chào em', '198.51.100.7');
  ok('Lượt thứ 41: "qua_luot_ip"', r41?.ly_do === 'qua_luot_ip', JSON.stringify(r41));
  const ipKhac = await mo(crypto.randomUUID(), crypto.randomUUID(), 'chào em', '198.51.100.8');
  ok('IP khác vẫn được', ipKhac?.duoc === true, JSON.stringify(ipKhac));
  await db.query(`insert into gioi_han_luot (viec, khoa) select 'tro_ly_trang', 'ca_quan' from generate_series(1, 2000)`);
  const ngay = await mo(crypto.randomUUID(), crypto.randomUUID(), 'chào em', '198.51.100.9');
  ok('Đủ 2.000 lượt trong ngày: "qua_luot_ngay"', ngay?.ly_do === 'qua_luot_ngay', JSON.stringify(ngay));
  await db.query(`delete from gioi_han_luot where viec = 'tro_ly_trang'`);
  const sai = await mo(crypto.randomUUID(), crypto.randomUUID(), '   ');
  ok('Tin trống: "sai"', sai?.ly_do === 'sai', JSON.stringify(sai));
});

await nhom('5 · CÂU CHƯA BIẾT VÀO SỔ HỌC — giờ Việt Nam, gộp câu trùng, che số', async () => {
  const hoi = async (cau, gio) => {
    if (gio) await datGioDatabase(db, gio);
    try {
      const cuoc = crypto.randomUUID(), tin = crypto.randomUUID();
      await mo(cuoc, tin, 'có khuyến mãi không');
      // await trong try: finally (trả đồng hồ thật) chỉ chạy khi lượt ghi đã xong — cùng một kết nối database.
      return await ghi(cuoc, tin, { tra_loi: { ...TRA_LOI, chuyen_nguoi: true, cau_chua_biet: cau } });
    } finally { if (gio) await traGioDatabase(db); }
  };
  await hoi('Quán có khuyến mãi gì không?', '2026-11-18T23:50:00+07:00');
  const r1 = (await db.query(`select * from tro_ly_so_hoc where hoi = 'Quán có khuyến mãi gì không?'`)).rows[0];
  ok('23:50 ngày 18/11 giờ VN → nguồn ghi 18/11/2026, chờ trả lời', r1?.nguon === 'Khách hỏi Trang ngày 18/11/2026' && r1?.trang_thai === 'cho_tra_loi', JSON.stringify(r1));
  await hoi('quán có khuyến mãi gì không', '2026-11-19T00:10:00+07:00');
  const r2 = (await db.query(`select so_lan_hoi, nguon from tro_ly_so_hoc where khoa_hoi = 'quán có khuyến mãi gì không'`)).rows;
  ok('Cùng câu khác hoa thường, dấu câu → một dòng, so_lan_hoi = 2', r2.length === 1 && r2[0].so_lan_hoi === 2, JSON.stringify(r2));
  await hoi('Đúng giờ giao không?');
  await hoi('Dừng giờ giao không?');
  ok('"Đúng giờ…" và "Dừng giờ…" là hai câu', Number((await db.query(`select count(*) n from tro_ly_so_hoc where hoi in ('Đúng giờ giao không?', 'Dừng giờ giao không?')`)).rows[0].n) === 2);
  await hoi('Giao tới số 0912 345 678 được không?');
  const che = (await db.query(`select hoi from tro_ly_so_hoc where hoi like 'Giao tới số%'`)).rows[0]?.hoi;
  ok('Số điện thoại trong câu bị che', che === 'Giao tới số [số điện thoại] được không?', che);
  const cuoc = crypto.randomUUID(), tin = crypto.randomUUID();
  await mo(cuoc, tin, 'x');
  await ghi(cuoc, tin, { loi: 'claude_500', tra_loi: { ...TRA_LOI, cau_chua_biet: 'Câu của lượt lỗi?' } });
  ok('Lượt lỗi không ghi câu vào sổ học', (await db.query(`select 1 from tro_ly_so_hoc where hoi = 'Câu của lượt lỗi?'`)).rows.length === 0);
});

await nhom('6 · CHE SỐ TRONG NHẬT KÝ — kiểu Việt', async () => {
  const che = async s => (await db.query(`select tro_ly_che_so($1) as r`, [s])).rows[0].r;
  ok('"0912 345 678" → che', await che('gọi 0912 345 678 nhé') === 'gọi [số điện thoại] nhé');
  ok('"+84 912 345 678" → che', await che('+84 912 345 678') === '[số điện thoại]');
  ok('"0912.345.678" → che', await che('0912.345.678') === '[số điện thoại]');
  ok('email → che', await che('mail lan.nguyen@gmail.com nha') === 'mail [email] nha');
  ok('dãy 12 chữ số → che', await che('stk 123456789012') === 'stk [số]');
  ok('"1,5 gói", "225 gam", "1.250.000" giữ nguyên', await che('1,5 gói, 225 gam, 1.250.000') === '1,5 gói, 225 gam, 1.250.000');
  const cuoc = crypto.randomUUID(), tin = crypto.randomUUID();
  await mo(cuoc, tin, 'số chị 0912345678, giao chiều nay');
  const dong = (await db.query(`select tin_khach from tro_ly_luot where ma_tin = $1`, [tin])).rows[0];
  ok('Nhật ký lưu tin đã che', dong?.tin_khach === 'số chị [số điện thoại], giao chiều nay', JSON.stringify(dong));
  await ghi(cuoc, tin, { tra_loi: TRA_LOI });
});

await nhom('7 · DUYỆT SỔ HỌC: database ghi người duyệt, giờ duyệt (trigger tro_ly_so_hoc_ghi_duyet)', async () => {
  const id = (await goi(UID.chu, `insert into tro_ly_so_hoc (hoi, trang_thai) values ('Có giao buổi tối không?', 'cho_tra_loi') returning id as r`)).kq;
  const thieu = await goi(UID.chu, `update tro_ly_so_hoc set trang_thai = 'da_duyet' where id = $1 returning id as r`, [id]);
  ok('Duyệt khi chưa có câu trả lời: bị chặn', thieu.loi !== null, vi(thieu));
  const duyet = await goi(UID.qlA, `update tro_ly_so_hoc set dap = 'Dạ có ạ.', trang_thai = 'da_duyet' where id = $1 returning duyet_boi as r`, [id]);
  const nsQl = (await db.query(`select id from nhan_su where auth_uid = $1`, [UID.qlA])).rows[0].id;
  ok('Quản lý duyệt: duyet_boi là quản lý, có giờ duyệt', duyet.kq === nsQl
    && (await db.query(`select duyet_luc from tro_ly_so_hoc where id = $1`, [id])).rows[0].duyet_luc !== null, vi(duyet));
  const sua = await goi(UID.chu, `update tro_ly_so_hoc set dap = 'Dạ có, tới 21 giờ ạ.' where id = $1 returning duyet_boi as r`, [id]);
  const nsChu = (await db.query(`select id from nhan_su where auth_uid = $1`, [UID.chu])).rows[0].id;
  ok('Chủ sửa câu đã duyệt: người duyệt đổi thành chủ', sua.kq === nsChu, vi(sua));
  const boHoc = await goi(UID.chu, `update tro_ly_so_hoc set trang_thai = 'cho_duyet' where id = $1 returning duyet_luc as r`, [id]);
  ok('Bỏ học: xóa người duyệt, giờ duyệt', boHoc.loi === null && boHoc.kq === null, vi(boHoc));
  const trung = await goi(UID.chu, `insert into tro_ly_so_hoc (hoi) values ('có giao buổi tối không') returning id as r`);
  ok('Thêm câu trùng (khác hoa thường, dấu câu): bị chặn', trung.loi !== null, vi(trung));
});

await nhom('8 · DỌN NHẬT KÝ QUÁ 180 NGÀY', async () => {
  await db.query(`insert into tro_ly_luot (cuoc_id, ma_tin, luot, tin_khach, trang_thai, created_at)
                  select gen_random_uuid(), gen_random_uuid(), 1, 'cũ', 'tra_loi', now() - interval '200 days' from generate_series(1, 60)`);
  const cuoc = crypto.randomUUID(), tin = crypto.randomUUID();
  await mo(cuoc, tin, 'x');
  await ghi(cuoc, tin, { tra_loi: TRA_LOI });
  const con = Number((await db.query(`select count(*) n from tro_ly_luot where created_at < now() - interval '180 days'`)).rows[0].n);
  ok('Mỗi lượt ghi dọn tối đa 50 dòng cũ (60 → 10)', con === 10, String(con));
});

await nhom('9 · ĐÈN "TRỢ LÝ TRANG": số liệu suc_khoe_so_lieu()', async () => {
  await db.query(`delete from tro_ly_luot`);
  const soLieu = async () => (await db.query(`select suc_khoe_so_lieu(array[]::uuid[]) -> 'tro_ly' as r`)).rows[0].r;
  let t = await soLieu();
  ok('Không lượt nào: 0 / 0, bật', t?.luot_24h === 0 && t?.loi_24h === 0 && t?.bat === true && t?.luot_cuoi === null, JSON.stringify(t));
  const c = crypto.randomUUID();
  const a = crypto.randomUUID(), b = crypto.randomUUID(), d = crypto.randomUUID();
  await mo(c, a, 'một'); await ghi(c, a, { tra_loi: TRA_LOI });
  await mo(c, b, 'hai'); await ghi(c, b, { loi: 'claude_529' });
  await mo(c, d, 'ba');
  await db.query(`update tro_ly_luot set created_at = now() - interval '6 minutes' where ma_tin = $1`, [d]);
  t = await soLieu();
  ok('Một trả lời, một lỗi, một treo quá 5 phút: luot_24h 3, loi_24h 2, có lượt cuối', t?.luot_24h === 3 && t?.loi_24h === 2 && t?.luot_cuoi !== null, JSON.stringify(t));
  await thuHoi('hien_tro_ly_trang');
  t = await soLieu();
  ok('Thu hồi công tắc: bat = false', t?.bat === false, JSON.stringify(t));
  await congBo('hien_tro_ly_trang', true);
});

await nhom('10 · EDGE FUNCTION TRÊN DATABASE THẬT (Claude giả)', async () => {
  // rpc như PostgREST với khóa service_role: gọi đúng hàm, tham số theo tên.
  const rpc = async (ten, thamSo) => {
    const khoa = Object.keys(thamSo);
    const goiHam = `${ten}(${khoa.map((k, i) => `${k} => $${i + 1}`).join(', ')})`;
    const sql = ten === 'mua_thit_ve_cong_khai'
      ? `select coalesce(json_agg(t), '[]'::json) as r from ${goiHam} t`
      : `select ${goiHam} as r`;
    const gt = khoa.map(k => (thamSo[k] !== null && typeof thamSo[k] === 'object' ? JSON.stringify(thamSo[k]) : thamSo[k]));
    const r = await dichVu(sql, gt);
    return r.loi ? { data: null, error: { message: r.loi } } : { data: r.rows[0].r, error: null };
  };
  let goiClaude = 0;
  const claude = async () => {
    goiClaude++;
    return {
      stop_reason: 'end_turn',
      usage: { input_tokens: 30, output_tokens: 80, cache_read_input_tokens: 7000, cache_creation_input_tokens: 0 },
      content: [{ type: 'text', text: JSON.stringify({
        tin: ['Dạ nhà mình 4 người thì em gợi ý đầu thăn ngoại còn nắp ạ.'], the: ['ribeye-with-cap'],
        don: [{ khoa: 'ribeye-with-cap_150', so_goi: 6 }, { khoa: 'ribeye-with-cap_200', so_goi: 4 }], chot: false, chuyen_nguoi: false, cau_chua_biet: '' }) }],
    };
  };
  const mt = { goiClaude: claude, rpc, nguonDuoc: ['https://beeftown.vn'], ghiLog: () => {} };
  const khoaGoi = (await duoiAnon(`select san_pham_ma || '_' || so_gam as k from mua_thit_ve_cong_khai('vi', 'q1') where san_pham_ma = 'ribeye-with-cap'`)).rows[0].k;
  const yc = (than) => new Request('https://x.supabase.co/functions/v1/tro-ly-trang', {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8', Origin: 'https://beeftown.vn', 'x-forwarded-for': '192.0.2.44' },
    body: JSON.stringify(than),
  });
  const cuoc = crypto.randomUUID(), maTin = crypto.randomUUID();
  const r1 = await xuLyYeuCau(yc({ cuoc, ma_tin: maTin, tin: 'nhà 4 người, số chị 0912 345 678' }), mt);
  const j1 = await r1.json();
  ok('Lượt đầu: 200, có tin, thẻ ribeye-with-cap', r1.status === 200 && j1.ok === true && j1.the?.[0]?.ma === 'ribeye-with-cap', JSON.stringify(j1));
  ok('Đơn chỉ giữ khóa gói có trên menu (' + khoaGoi + '), bỏ cỡ Claude ghi sai; dòng đơn kèm tên Trang nói',
    JSON.stringify(j1.don) === JSON.stringify([{ khoa: khoaGoi, so_goi: 4, ten: 'đầu thăn ngoại còn nắp' }]), JSON.stringify(j1.don));
  const dong = (await db.query(`select * from tro_ly_luot where ma_tin = $1`, [maTin])).rows[0];
  ok('Nhật ký: tra_loi, tin khách đã che, có token và mili giây', dong?.trang_thai === 'tra_loi' && dong.tin_khach === 'nhà 4 người, số chị [số điện thoại]'
    && dong.token_doc_dem === 7000 && dong.mili_giay !== null, JSON.stringify(dong));
  const r2 = await xuLyYeuCau(yc({ cuoc, ma_tin: maTin, tin: 'nhà 4 người, số chị 0912 345 678' }), mt);
  const j2 = await r2.json();
  ok('Gửi lại cùng ma_tin: 200, đúng câu cũ, Claude chỉ được gọi một lần', r2.status === 200 && j2.tin?.[0] === j1.tin[0] && goiClaude === 1, `${goiClaude} lần · ${JSON.stringify(j2)}`);
  await thuHoi('hien_tro_ly_trang');
  const r3 = await xuLyYeuCau(yc({ cuoc, ma_tin: crypto.randomUUID(), tin: 'còn không em' }), mt);
  ok('Công tắc tắt: 403 { loi: "tat" }, không gọi Claude', r3.status === 403 && (await r3.json()).loi === 'tat' && goiClaude === 1);
});

process.exit(ketThuc('TRỢ LÝ TRANG — DATABASE VÀ EDGE FUNCTION'));
