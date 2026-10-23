/**
 * BEEFTOWN — MINI APP ZALO: CÒN HÀNG Ở QUẦY (0093)
 * ===============================================
 *
 *     node test/test-mini-app-con-hang.mjs
 *
 * mini_app_con_hang(chi nhánh) là hàm anon gọi được (qua website, /mini-app/con-hang.json). Bất biến:
 *
 *   1. Công tắc mini_app_hien_con_hang chưa công bố (mặc định), bị thu hồi, hay ô mini_app bị tắt → rỗng.
 *   2. Đếm khay (so_goi) ở vị trí QUẦY, lô CÒN HẠN theo giờ VN, đúng chi nhánh (chi nhánh khác, chi nhánh
 *      ngừng hoạt động, mã lạ → không lẫn); nhiều mặt hàng cùng phần thịt cộng khay; 0 → het, 1–2 → sap_het,
 *      từ 3 → con. Hàng trong kho, đang chuyển, chờ hủy, lô hết hạn không tính. Bán bớt thì trạng thái theo.
 *   3. Chỉ mặt hàng đang dùng, đếm theo khay, có ô mini_app. Ô chỉ nhận đúng 6 mã phần thịt.
 *   4. Chỉ trả hai cột ma, trang_thai — không số khay, số kg, tên hay mã mặt hàng trong kho.
 *   5. anon gọi được hàm nhưng vẫn không đọc thẳng được bảng kho.
 *   6. Mốc 23:50 và 00:10 giờ VN: lô hạn hôm nay còn tính tới hết ngày, sang ngày mới thì thôi.
 *   7. Cuối file: kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, datGioDatabase, traGioDatabase, UID } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MINI APP ZALO: CÒN HÀNG Ở QUẦY');
const { db, cnA, cnB, duoi, duoiAnon, phaiLoi } = await dungDatabase();
// Khởi tạo kho tạo ba vị trí mặc định của mỗi chi nhánh: kho, quầy, chờ hủy.
await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);

const viTri = async cn => Object.fromEntries((await db.query(
  `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cn.id])).rows.map(r => [r.loai, r.id]));
const vtA = await viTri(cnA);
const vtB = await viTri(cnB);

/** Mặt hàng phần cắt; mini app null = không gắn. */
async function matHang(ma, mini, { demGoi = true, dangDung = true } = {}) {
  const { rows: [r] } = await db.query(
    `insert into kho_mat_hang (ma, ten, loai, dem_goi, dang_dung, truong_them)
     values ($1, $1, 'phan_cat', $2, $3, $4) returning id`,
    [ma, demGoi, dangDung, JSON.stringify(mini ? { mini_app: mini } : {})]);
  return r.id;
}

let soLo = 0;
/** Một lô và một dòng sổ cái: so_khay khay vào vị trí, hạn hanDung (yyyy-mm-dd). Trả id lô. */
async function themKhay(cn, matHangId, viTriId, soKhay, hanDung) {
  soLo++;
  const { rows: [lo] } = await db.query(
    `insert into kho_lo (chi_nhanh_id, ma_lo, mat_hang_id, nguon, han_dung)
     values ($1, $2, $3, 'nhap', $4) returning id`, [cn.id, `MA-${soLo}`, matHangId, hanDung]);
  await db.query(
    `insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
     values ($1, $2, $3, $4, 'nhap', $5, $6, 'phieu_nhap', gen_random_uuid())`,
    [cn.id, lo.id, viTriId, matHangId, (soKhay * 0.15).toFixed(3), soKhay]);
  return lo.id;
}

/** Bớt khay của một lô ở một vị trí (bán ở quầy). */
async function banKhay(cn, loId, matHangId, viTriId, soKhay) {
  await db.query(
    `insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
     values ($1, $2, $3, $4, 'ban', $5, $6, 'ban_hang', gen_random_uuid())`,
    [cn.id, loId, viTriId, matHangId, (-soKhay * 0.15).toFixed(3), -soKhay]);
}

const conHang = async (ma = 'q1') => {
  const r = await duoiAnon(`select * from mini_app_con_hang($1)`, [ma]);
  return { loi: r.loi, rows: r.rows, map: Object.fromEntries((r.rows ?? []).map(x => [x.ma, x.trang_thai])) };
};
const batCongTac = () => db.query(
  `insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai) values ('mini_app_hien_con_hang', 'bool', true, 'da_cong_bo')`);

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const sau = n => (new Date(Date.parse(homNay + 'T00:00:00Z') + n * 86400000)).toISOString().slice(0, 10);

const id = {};

// ===========================================================================
await nhom('0 · DỰNG MẶT HÀNG VÀ KHAY Ở QUẦY', async () => {
  const dn = (await db.query(
    `select kieu, lua_chon, bat_buoc, dang_dung from kho_truong_them where doi_tuong = 'mat_hang' and khoa = 'mini_app'`)).rows[0];
  ok('0093 tạo ô "Phần thịt trên Mini App Zalo": kiểu chọn, 6 mã phần thịt, không bắt buộc, đang dùng',
     dn?.kieu === 'chon' && dn.lua_chon.length === 6 && dn.lua_chon.includes('ribeye-with-cap')
     && dn.bat_buoc === false && dn.dang_dung === true, JSON.stringify(dn));

  id.ribeye = await matHang('RIBEYE', 'ribeye-with-cap');
  id.ribeye2 = await matHang('RIBEYE-B', 'ribeye-with-cap');   // cùng phần thịt, cộng khay
  id.skirt = await matHang('SKIRT', 'outside-skirt');
  id.galbi = await matHang('LA-GALBI', 'la-galbi');
  id.chadol = await matHang('CHADOL', 'chadolbagi');
  id.chiCan = await matHang('TOP-BLADE', 'top-blade', { demGoi: false });
  id.ngung = await matHang('GALBISAL', 'galbisal', { dangDung: false });
  id.khongGan = await matHang('BAP-BO', null);

  // Ribeye: 2 khay quầy + 1 khay quầy của mặt hàng thứ hai = 3 → con. 5 khay trong kho không tính.
  id.loRibeye = await themKhay(cnA, id.ribeye, vtA.quay, 2, sau(2));
  await themKhay(cnA, id.ribeye2, vtA.quay, 1, sau(2));
  await themKhay(cnA, id.ribeye, vtA.kho, 5, sau(2));
  // Skirt: 2 khay quầy → sap_het; 4 khay quầy đã hết hạn hôm qua không tính.
  await themKhay(cnA, id.skirt, vtA.quay, 2, sau(1));
  await themKhay(cnA, id.skirt, vtA.quay, 4, sau(-1));
  // LA Galbi: chỉ có ở kho, chờ hủy, đang chuyển → het.
  await themKhay(cnA, id.galbi, vtA.kho, 6, sau(3));
  await themKhay(cnA, id.galbi, vtA.cho_huy, 2, sau(3));
  if (vtA.dang_chuyen) await themKhay(cnA, id.galbi, vtA.dang_chuyen, 3, sau(3));
  // Chadolbagi: 9 khay ở quầy chi nhánh B, không có ở A → het ở A, con ở B.
  await themKhay(cnB, id.chadol, vtB.quay, 9, sau(5));
  // Mặt hàng chỉ cân kg, mặt hàng ngừng dùng, mặt hàng không gắn: không có dòng.
  await themKhay(cnA, id.chiCan, vtA.quay, 4, sau(2));
  await themKhay(cnA, id.ngung, vtA.quay, 4, sau(2));
  await themKhay(cnA, id.khongGan, vtA.quay, 4, sau(2));
  ok('Dựng đủ vị trí quầy, kho, chờ hủy của hai chi nhánh', !!(vtA.quay && vtA.kho && vtA.cho_huy && vtB.quay),
     JSON.stringify(vtA));
});

// ===========================================================================
await nhom('1 · CÔNG TẮC MẶC ĐỊNH TẮT', async () => {
  const r = await conHang();
  ok('Công tắc mini_app_hien_con_hang chưa công bố → anon gọi được, trả rỗng', r.loi === null && r.rows.length === 0,
     r.loi ?? JSON.stringify(r.rows));
  const khoa = (await db.query(
    `select kieu::text, nhom, chi_chu_so_huu, bat_buoc from khoa_cong_bo where khoa = 'mini_app_hien_con_hang'`)).rows[0];
  ok('Công tắc nằm trong sổ đăng ký: bool, nhóm trạng thái, chỉ chủ công bố, không bắt buộc để khai trương',
     khoa?.kieu === 'bool' && khoa.nhom === 'trang_thai' && khoa.chi_chu_so_huu === true && khoa.bat_buoc === false,
     JSON.stringify(khoa));
});

// ===========================================================================
await nhom('2 · TRẠNG THÁI THEO SỐ KHAY Ở QUẦY', async () => {
  await batCongTac();
  const a = await conHang('q1');
  ok('Ribeye: 2 + 1 khay ở quầy của hai mặt hàng cùng phần thịt → con (kho 5 khay không tính)',
     a.map['ribeye-with-cap'] === 'con', JSON.stringify(a.map));
  ok('Outside Skirt: 2 khay còn hạn → sap_het (4 khay hết hạn hôm qua không tính)',
     a.map['outside-skirt'] === 'sap_het', JSON.stringify(a.map));
  ok('LA Galbi: chỉ có trong kho, chờ hủy, đang chuyển → het', a.map['la-galbi'] === 'het', JSON.stringify(a.map));
  ok('Chadolbagi: khay ở chi nhánh khác không lẫn → het ở q1', a.map.chadolbagi === 'het', JSON.stringify(a.map));
  ok('Mặt hàng chỉ cân kg, mặt hàng ngừng dùng, mặt hàng không gắn ô: không có dòng',
     !('top-blade' in a.map) && !('galbisal' in a.map) && Object.keys(a.map).length === 4, JSON.stringify(a.map));
  const b = await conHang('Q7');
  ok('Chi nhánh q7 (mã viết hoa vẫn khớp): Chadolbagi 9 khay → con, phần khác het',
     b.map.chadolbagi === 'con' && b.map['ribeye-with-cap'] === 'het', JSON.stringify(b.map));
  const la = await conHang('khong-co');
  ok('Mã chi nhánh lạ → rỗng', la.loi === null && la.rows.length === 0, JSON.stringify(la.rows));

  await banKhay(cnA, id.loRibeye, id.ribeye, vtA.quay, 1);
  ok('Bán 1 khay Ribeye ở quầy (còn 2) → sap_het', (await conHang()).map['ribeye-with-cap'] === 'sap_het');
  await banKhay(cnA, id.loRibeye, id.ribeye, vtA.quay, 1);
  const r1 = await db.query(`select id from kho_lo where mat_hang_id = $1`, [id.ribeye2]);
  await banKhay(cnA, r1.rows[0].id, id.ribeye2, vtA.quay, 1);
  ok('Bán hết 3 khay Ribeye ở quầy → het', (await conHang()).map['ribeye-with-cap'] === 'het');

  await db.query(`update chi_nhanh set dang_hoat_dong = false where id = $1`, [cnB.id]);
  ok('Chi nhánh ngừng hoạt động → rỗng', (await conHang('q7')).rows.length === 0);
  await db.query(`update chi_nhanh set dang_hoat_dong = true where id = $1`, [cnB.id]);
});

// ===========================================================================
await nhom('3 · KHÔNG TRẢ SỐ, KHÔNG TRẢ GÌ CỦA KHO', async () => {
  const r = await duoiAnon(`select * from mini_app_con_hang('q1') limit 1`);
  ok('Chỉ hai cột ma, trang_thai', r.loi === null && Object.keys(r.rows[0] ?? {}).sort().join(',') === 'ma,trang_thai',
     r.loi ?? JSON.stringify(r.rows));
  const giaTri = (await conHang()).rows.map(x => x.trang_thai);
  ok('Trạng thái chỉ là het / sap_het / con', giaTri.length > 0 && giaTri.every(x => ['het', 'sap_het', 'con'].includes(x)),
     giaTri.join(', '));
  for (const bang of ['kho_ton', 'kho_mat_hang', 'kho_lo']) {
    const t = await duoiAnon(`select count(*)::int as n from ${bang}`);
    ok(`anon vẫn không đọc được ${bang}`, t.loi !== null || t.rows[0].n === 0, t.loi ?? `đọc được ${t.rows[0].n} dòng`);
  }
});

// ===========================================================================
await nhom('4 · Ô MINI APP CHỈ NHẬN ĐÚNG MÃ, TẮT Ô HAY THU HỒI CÔNG TẮC THÌ RỖNG', async () => {
  const sai = await phaiLoi(`update kho_mat_hang set truong_them = '{"mini_app": "ribeye"}' where id = $1`, [id.khongGan]);
  ok('Mã phần thịt lạ trong ô mini_app bị từ chối', sai !== null && /phải chọn một trong/.test(sai), sai ?? 'lưu được');

  await db.query(`update kho_truong_them set dang_dung = false where doi_tuong = 'mat_hang' and khoa = 'mini_app'`);
  ok('Tắt ô mini_app → rỗng', (await conHang()).rows.length === 0);
  await db.query(`update kho_truong_them set dang_dung = true where doi_tuong = 'mat_hang' and khoa = 'mini_app'`);

  await db.query(`update noi_dung_cong_bo set trang_thai = 'da_thu_hoi' where khoa = 'mini_app_hien_con_hang'`);
  ok('Thu hồi công tắc → rỗng', (await conHang()).rows.length === 0);
  await batCongTac();
  ok('Công bố lại → có dòng', (await conHang()).rows.length === 4);
});

// ===========================================================================
await nhom('5 · GIỜ VIỆT NAM: LÔ HẠN HÔM NAY TÍNH TỚI 23:59', async () => {
  const ngay = '2026-11-13';
  const id13 = await matHang('GALBI-13', 'la-galbi');
  await datGioDatabase(db, `${ngay}T23:50:00+07:00`);
  try {
    await themKhay(cnA, id13, vtA.quay, 3, ngay);
    ok('23:50 giờ VN ngày 13/11: 3 khay hạn 13/11 vẫn tính → con', (await conHang()).map['la-galbi'] === 'con');
    await datGioDatabase(db, '2026-11-14T00:10:00+07:00');
    ok('00:10 giờ VN ngày 14/11 (UTC vẫn là 13/11): lô hạn 13/11 hết hạn → het',
       (await conHang()).map['la-galbi'] === 'het');
  } finally {
    await traGioDatabase(db);
  }
});

// ===========================================================================
await nhom('6 · SỔ KHO KHỚP', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows.slice(0, 3)));
});

process.exit(ketThuc('MINI APP CÒN HÀNG'));
