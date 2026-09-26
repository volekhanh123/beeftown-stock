/**
 * BEEFTOWN KHO — Kiểm thử số đỏ trên menu, thông báo, ngưỡng, chỉ số quản trị
 * ==========================================================================
 *
 *     node test/test-kho-viec.mjs
 *
 * Những điều phải đúng:
 *   · kho_dem_viec trả ĐÚNG bộ khóa theo quyền của từng vai — khóa không có
 *     quyền thì vắng mặt, không phải bằng 0;
 *   · không có con số tiền nào trong kết quả của NV quầy và thủ kho;
 *   · NV quầy chỉ đếm hàng ở quầy; quầy dưới mức không tính gói hết hạn;
 *   · việc bị trả về chỉ báo cho đúng người lập;
 *   · chưa đọc → mở chuông → đã đọc → sự kiện mới lại thành chưa đọc;
 *   · ngưỡng chỉ nhận khóa đã biết, giá trị là số, trong khoảng cho phép;
 *   · chỉ số quản trị dưới quyền người gọi: không có quyền xem giá thì 0 đồng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ ĐẾM VIỆC VÀ THÔNG BÁO');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

const MH = {};
let viTri = {};
let ncc;
const lyDo = {};

async function luuPhieu(dong, vt, uid = UID.thuKhoA) {
  const luu = await duoi(uid, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt, homNay, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  return luu.rows[0];
}
async function guiPhieu(p, uid = UID.thuKhoA) {
  const gui = await duoi(uid, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  return p.phieu_id;
}
// Phiếu sẽ được duyệt nên phải có giá → quản lý lưu (thủ kho không gửi được
// giá — 0031); thủ kho vẫn gửi.
async function nhapHang(dong, vt) {
  const id = await guiPhieu(await luuPhieu(dong, vt, UID.qlA));
  const duyet = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [id]);
  if (duyet.loi) throw new Error(duyet.loi);
  return id;
}
const demViec = async (uid, cn = cnA.id) => {
  const r = await duoi(uid, `select kho_dem_viec($1) as v`, [cn]);
  return r.loi ? { loi: r.loi } : r.rows[0].v;
};
const thongBao = async uid => (await duoi(uid, `select kho_thong_bao($1, 100) as v`, [cnA.id])).rows?.[0]?.v;

// Tên khóa chứa tiền: nếu xuất hiện trong kết quả của NV quầy / thủ kho là lộ.
const KHOA_TIEN = /gia|tien|gia_tri|doanh_thu|von|lai|no_qua|thanh_toan/;
function quetTien(x, duong = '') {
  const lo = [];
  if (Array.isArray(x)) x.forEach((y, i) => lo.push(...quetTien(y, `${duong}[${i}]`)));
  else if (x && typeof x === 'object') {
    for (const [k, v] of Object.entries(x)) {
      if (KHOA_TIEN.test(k) && !/^cong_no_(qua_han|7_ngay)$/.test(k)) lo.push(`${duong}.${k}`);
      lo.push(...quetTien(v, `${duong}.${k}`));
    }
  }
  return lo;
}

// ===========================================================================
await nhom('1 · CHUẨN BỊ', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  for (const r of (await db.query(`select * from kho_ly_do`)).rows) lyDo[`${r.loai}:${r.ten}`] = r.id;
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC A') returning id`)).rows[0].id;

  // Kho lạnh: một lô hết hạn, một lô sắp hết, một lô còn hạn.
  await nhapHang([
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2, so_kg: 1, don_gia_kg: 700000, han_dung: await ngaySau(-1) },
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4, so_kg: 2, don_gia_kg: 700000, han_dung: await ngaySau(1) },
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 6, so_kg: 3, don_gia_kg: 700000, han_dung: await ngaySau(9) },
  ], viTri.kho);
  // Quầy: một lô ba chỉ hết hạn (nhận thẳng vào quầy) và một lô sắp hết.
  await nhapHang([
    { mat_hang_id: MH['C-BACHI'].id, so_goi: 3, so_kg: 1.5, don_gia_kg: 500000, han_dung: await ngaySau(-2) },
    { mat_hang_id: MH['C-BACHI'].id, so_goi: 2, so_kg: 1, don_gia_kg: 500000, han_dung: await ngaySau(1) },
  ], viTri.quay);

  // Ba chỉ ở quầy: mức tối thiểu 2 kg. Quầy có 2,5 kg nhưng 1,5 kg đã hết hạn
  // → thật ra chỉ còn 1 kg bán được → dưới mức.
  await db.query(`update kho_mat_hang set ton_toi_thieu_kg = 2 where ma = 'C-BACHI'`);
  ok('Chuẩn bị xong', Object.keys(MH).length > 5 && viTri.kho && viTri.quay);
});

// ===========================================================================
await nhom('2 · BỘ KHÓA ĐÚNG THEO QUYỀN TỪNG VAI', async () => {
  const CHUNG = ['khoi_tao', 'het_han', 'sap_het_han', 'quay_duoi_muc', 'chua_doc', 'thong_bao_xem_luc'];
  // 0032: mang hàng ra quầy — thủ kho thấy yêu cầu của quầy; NV quầy thấy hàng
  // đang mang ra chờ bấm nhận; quản lý thấy cả hai và phiếu nhận thiếu.
  const DI_DUONG = ['hang_dang_chuyen', 'hang_chuyen_qua_gio'];
  const mong = {
    'quản lý':  [...CHUNG, 'quay_chua_dem', 'nhap_bi_tra', 'nhap_nhap', 'huy_bi_tra', 'kiem_ke_tra_ve',
                 'pha_nhap', 'duyet_nhap', 'duyet_huy', 'duyet_kiem_ke',
                 'cong_no_qua_han', 'cong_no_7_ngay', 'chua_doi_chieu',
                 'yeu_cau_quay', ...DI_DUONG, 'chuyen_nhan_thieu',
                 'thu_hoi_thap',    // 0033: pha lóc thu hồi thấp, chưa bấm "Đã xem"
                 'ipos_cho_xu_ly',  // 0037: dòng bán iPOS chưa trừ được kho
                 'dinh_muc_lech'],  // 0038: mặt hàng bếp nhận lệch định mức 7 ngày
    'thủ kho':  [...CHUNG, 'quay_chua_dem', 'nhap_bi_tra', 'nhap_nhap', 'huy_bi_tra', 'kiem_ke_tra_ve', 'pha_nhap',
                 'yeu_cau_quay'],
    'NV quầy':  [...CHUNG, 'quay_chua_dem', 'huy_bi_tra', 'kiem_ke_tra_ve', ...DI_DUONG],
    // 0031: kế toán điền giá và duyệt phiếu nhập → có số đỏ duyet_nhap (không có hủy, kiểm kê)
    'kế toán':  [...CHUNG, 'duyet_nhap', 'cong_no_qua_han', 'cong_no_7_ngay', 'chua_doi_chieu'],
  };
  const uid = { 'quản lý': UID.qlA, 'thủ kho': UID.thuKhoA, 'NV quầy': UID.nvQuayA, 'kế toán': UID.keToanA };
  for (const [ten, khoa] of Object.entries(mong)) {
    const v = await demViec(uid[ten]);
    const co = Object.keys(v).sort().join(',');
    ok(`${ten}: đúng bộ khóa`, co === [...khoa].sort().join(','), `có ${co}`);
  }
  const chu = await demViec(UID.chu);
  ok('Chủ nhà hàng: có đủ khóa như quản lý', Object.keys(chu).length === mong['quản lý'].length);

  const tn = await demViec(UID.thuNganA);
  ok('Thu ngân (không dùng kho) bị từ chối', !!tn.loi && /không xem được kho/.test(tn.loi), tn.loi);
  const tkB = await demViec(UID.thuKhoB);
  ok('Thủ kho Q7 KHÔNG đếm được việc kho Q1', !!tkB.loi, JSON.stringify(tkB));
  const nghi = await demViec(UID.nghiViec);
  ok('Người đã nghỉ việc bị từ chối', !!nghi.loi);

  for (const [ten, u] of [['NV quầy', UID.nvQuayA], ['thủ kho', UID.thuKhoA]]) {
    const lo = quetTien(await demViec(u));
    ok(`${ten}: kết quả đếm việc không có khóa tiền`, lo.length === 0, lo.join(', '));
  }
});

// ===========================================================================
await nhom('3 · HẠN DÙNG VÀ QUẦY', async () => {
  const ql = await demViec(UID.qlA);
  const nv = await demViec(UID.nvQuayA);
  ok('Quản lý: 2 lô hết hạn (1 ở kho, 1 ở quầy)', ql.het_han === 2, `thấy ${ql.het_han}`);
  ok('Quản lý: 2 lô sắp hết hạn', ql.sap_het_han === 2, `thấy ${ql.sap_het_han}`);
  ok('NV quầy: chỉ đếm hàng ở quầy — 1 hết hạn, 1 sắp hết', nv.het_han === 1 && nv.sap_het_han === 1,
     `het ${nv.het_han} · sap ${nv.sap_het_han}`);
  ok('Quầy dưới mức: 1 món (gói hết hạn không được tính là còn)', ql.quay_duoi_muc === 1, `thấy ${ql.quay_duoi_muc}`);

  const tb = await thongBao(UID.nvQuayA);
  const hetHan = tb.su_kien.filter(e => e.khoa === 'het_han');
  ok('NV quầy: thông báo hết hạn chỉ có lô ở quầy', hetHan.length === 1 && /Quầy/i.test(hetHan[0].ten),
     JSON.stringify(hetHan));
  const duoiMuc = tb.su_kien.find(e => e.khoa === 'quay_duoi_muc');
  ok('Thông báo quầy dưới mức kèm số kg còn bán được (1 kg)', Number(duoiMuc?.so) === 1, JSON.stringify(duoiMuc));
});

// ===========================================================================
await nhom('4 · VIỆC BỊ TRẢ VỀ CHỈ BÁO ĐÚNG NGƯỜI LẬP', async () => {
  const p = await luuPhieu([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 12,
                              han_dung: await ngaySau(20) }], viTri.kho);
  let tk = await demViec(UID.thuKhoA);
  ok('Phiếu nháp của thủ kho → nhap_nhap = 1', tk.nhap_nhap === 1, `thấy ${tk.nhap_nhap}`);
  const id = await guiPhieu(p);
  let ql = await demViec(UID.qlA);
  ok('Gửi duyệt → quản lý thấy duyet_nhap = 1', ql.duyet_nhap === 1, `thấy ${ql.duyet_nhap}`);
  const kt = await demViec(UID.keToanA);
  ok('Gửi duyệt → kế toán cũng thấy duyet_nhap = 1 (0031)', kt.duyet_nhap === 1, `thấy ${kt.duyet_nhap}`);
  const evKt = (await thongBao(UID.keToanA)).su_kien.find(e => e.khoa === 'cho_duyet_nhap' && e.ref_id === id);
  ok('Kế toán có thông báo phiếu nhập chờ duyệt', !!evKt);

  const tc = await duoi(UID.qlA, `select kho_tu_choi_phieu_nhap($1, 'Sai số kg')`, [id]);
  ok('Quản lý từ chối được', tc.loi === null, tc.loi ?? '');
  tk = await demViec(UID.thuKhoA);
  ql = await demViec(UID.qlA);
  ok('Thủ kho (người lập) thấy nhap_bi_tra = 1', tk.nhap_bi_tra === 1, `thấy ${tk.nhap_bi_tra}`);
  ok('Quản lý KHÔNG thấy phiếu của người khác bị trả', ql.nhap_bi_tra === 0, `thấy ${ql.nhap_bi_tra}`);
  ok('Hết chờ duyệt sau khi từ chối', ql.duyet_nhap === 0);
  const ev = (await thongBao(UID.thuKhoA)).su_kien.find(e => e.khoa === 'nhap_bi_tu_choi');
  ok('Thông báo từ chối kèm lý do', ev?.ten === 'Sai số kg', JSON.stringify(ev));

  // Báo hủy của NV quầy bị từ chối
  const { lo_id: lo, mat_hang_id: mhLo } = (await db.query(
    `select lo_id, mat_hang_id from kho_ton where vi_tri_id = $1 and so_goi > 0 order by lo_id limit 1`,
    [viTri.quay])).rows[0];
  const huy = await duoi(UID.nvQuayA, `
    select * from kho_tao_phieu_xuat(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_loai => 'huy', p_vi_tri_id => $3, p_vi_tri_den_id => null,
      p_ly_do_id => $4, p_ghi_chu => null, p_anh => $5::text[], p_dong => $6::jsonb)`,
    [cnA.id, maGui(), viTri.quay, lyDo['huy:Hết hạn dùng'] ?? Object.entries(lyDo).find(([k]) => k.startsWith('huy:'))[1],
     [`${cnA.id}/huy/${maGui()}/1.jpg`], JSON.stringify([{ mat_hang_id: mhLo, lo_id: lo, so_goi: 1 }])]);
  ok('NV quầy báo hủy được', huy.loi === null, huy.loi ?? '');
  ql = await demViec(UID.qlA);
  ok('Quản lý thấy duyet_huy = 1', ql.duyet_huy === 1, `thấy ${ql.duyet_huy}`);
  await duoi(UID.qlA, `select kho_tu_choi_phieu_huy($1, 'Còn bán được')`, [huy.rows[0].phieu_id]);
  const nv = await demViec(UID.nvQuayA);
  ok('NV quầy (người lập) thấy huy_bi_tra = 1', nv.huy_bi_tra === 1, `thấy ${nv.huy_bi_tra}`);
  ok('Thủ kho không thấy báo hủy của NV quầy', (await demViec(UID.thuKhoA)).huy_bi_tra === 0);
});

// ===========================================================================
await nhom('5 · QUẦY CHƯA ĐẾM, KIỂM KÊ TRẢ VỀ, PHA LÓC NHÁP', async () => {
  // Giờ chốt ngày = 0h để phép thử không phụ thuộc giờ chạy.
  const n = await duoi(UID.qlA, `select kho_luu_nguong($1, '{"gio_chot_ngay": 0}'::jsonb)`, [cnA.id]);
  ok('Quản lý đặt giờ chốt ngày = 0h', n.loi === null, n.loi ?? '');

  let nv = await demViec(UID.nvQuayA);
  ok('Quầy còn hàng mà chưa đếm từ hôm qua → quay_chua_dem = 1', nv.quay_chua_dem === 1, `thấy ${nv.quay_chua_dem}`);
  ok('Kế toán không có khóa quay_chua_dem', !('quay_chua_dem' in await demViec(UID.keToanA)));

  const bd = await duoi(UID.nvQuayA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_mat_hang', $3) as id`,
    [cnA.id, viTri.quay, maGui()]);
  const kkId = bd.rows[0].id;
  const kk = (await db.query(`select * from kho_kiem_ke where id = $1`, [kkId])).rows[0];
  const dong = (await db.query(`select * from kho_kiem_ke_dong where kiem_ke_id = $1`, [kkId])).rows
    .map(d => ({ mat_hang_id: d.mat_hang_id, so_goi_dem: 1, so_kg_dem: null, xac_nhan_het: false }));
  const luu = await duoi(UID.nvQuayA, `select kho_luu_kiem_ke($1, $2, null, $3::jsonb)`,
    [kkId, kk.phien_ban, JSON.stringify(dong)]);
  ok('NV quầy lưu số đếm', luu.loi === null, luu.loi ?? '');
  const pb = (await db.query(`select phien_ban from kho_kiem_ke where id = $1`, [kkId])).rows[0].phien_ban;
  const gui = await duoi(UID.nvQuayA, `select kho_gui_kiem_ke($1, $2)`, [kkId, pb]);
  ok('NV quầy gửi kiểm kê', gui.loi === null, gui.loi ?? '');
  nv = await demViec(UID.nvQuayA);
  ok('Đã gửi đếm quầy → quay_chua_dem = 0', nv.quay_chua_dem === 0, `thấy ${nv.quay_chua_dem}`);
  ok('Quản lý thấy duyet_kiem_ke = 1', (await demViec(UID.qlA)).duyet_kiem_ke === 1);

  await duoi(UID.qlA, `select kho_tu_choi_kiem_ke($1, 'Đếm lại ba chỉ')`, [kkId]);
  nv = await demViec(UID.nvQuayA);
  ok('Kiểm kê bị trả về → kiem_ke_tra_ve = 1 cho NV quầy', nv.kiem_ke_tra_ve === 1, `thấy ${nv.kiem_ke_tra_ve}`);
  ok('Trả về rồi thì lại tính là chưa đếm', nv.quay_chua_dem === 1, `thấy ${nv.quay_chua_dem}`);
  const ev = (await thongBao(UID.nvQuayA)).su_kien.find(e => e.khoa === 'kiem_ke_tra_ve');
  ok('Thông báo trả về kèm lý do', ev?.ten === 'Đếm lại ba chỉ', JSON.stringify(ev));

  const pha = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(null, $1, $2, null, $3, null, $4::date, null, '[]'::jsonb, '[]'::jsonb)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay]);
  ok('Thủ kho mở phiên pha lóc nháp', pha.loi === null, pha.loi ?? '');
  ok('pha_nhap = 1', (await demViec(UID.thuKhoA)).pha_nhap === 1);
});

// ===========================================================================
await nhom('6 · CÔNG NỢ (SỐ PHIẾU, KHÔNG SỐ TIỀN)', async () => {
  // Các phiếu đã duyệt ở trên: đẩy hạn trả ra xa để chỉ còn hai phiếu dưới đây.
  await db.query(`update kho_phieu_nhap set han_thanh_toan = $1::date where trang_thai = 'da_duyet'`, [await ngaySau(60)]);
  const id = await nhapHang([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 10, don_gia_kg: 400000,
                               han_dung: await ngaySau(20) }], viTri.kho);
  await db.query(`update kho_phieu_nhap set han_thanh_toan = $2::date where id = $1`, [id, await ngaySau(-3)]);
  const id2 = await nhapHang([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 5, don_gia_kg: 400000,
                                han_dung: await ngaySau(20) }], viTri.kho);
  await db.query(`update kho_phieu_nhap set han_thanh_toan = $2::date where id = $1`, [id2, await ngaySau(4)]);
  const kt = await demViec(UID.keToanA);
  ok('Kế toán: 1 phiếu quá hạn', kt.cong_no_qua_han === 1, `thấy ${kt.cong_no_qua_han}`);
  ok('Kế toán: 1 phiếu đến hạn trong 7 ngày', kt.cong_no_7_ngay === 1, `thấy ${kt.cong_no_7_ngay}`);
  ok('Kế toán: số phiếu chưa đối chiếu ≥ 2', kt.chua_doi_chieu >= 2, `thấy ${kt.chua_doi_chieu}`);
  const tb = await thongBao(UID.keToanA);
  ok('Kế toán có thông báo quá hạn và đến hạn',
     tb.su_kien.some(e => e.khoa === 'cong_no_qua_han') && tb.su_kien.some(e => e.khoa === 'cong_no_den_han'));
  ok('NV quầy không có thông báo công nợ',
     !(await thongBao(UID.nvQuayA)).su_kien.some(e => e.khoa.startsWith('cong_no')));
});

// ===========================================================================
await nhom('7 · CHƯA ĐỌC / ĐÃ ĐỌC', async () => {
  let tk = await demViec(UID.thuKhoA);
  ok('Thủ kho có thông báo chưa đọc', tk.chua_doc > 0, `thấy ${tk.chua_doc}`);
  const tb = await thongBao(UID.thuKhoA);
  ok('Danh sách có cờ chưa đọc', tb.su_kien.some(e => e.chua_doc === true));
  ok('Mới nhất đứng trước', tb.su_kien.every((e, i, a) => i === 0 || a[i - 1].luc >= e.luc));

  const xem = await duoi(UID.thuKhoA, `select kho_da_xem_thong_bao($1)`, [cnA.id]);
  ok('Đánh dấu đã đọc được', xem.loi === null, xem.loi ?? '');
  tk = await demViec(UID.thuKhoA);
  ok('Sau khi mở chuông: chua_doc = 0', tk.chua_doc === 0, `thấy ${tk.chua_doc}`);
  ok('Mốc đã đọc được trả về', !!tk.thong_bao_xem_luc);
  ok('Đọc của thủ kho không làm mất chưa đọc của quản lý', (await demViec(UID.qlA)).chua_doc > 0);

  // Sự kiện mới sau khi đã đọc: phiếu nhập mới bị từ chối.
  const id = await guiPhieu(await luuPhieu([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 3,
                                              han_dung: await ngaySau(20) }], viTri.kho));
  await duoi(UID.qlA, `select kho_tu_choi_phieu_nhap($1, 'Thiếu ảnh')`, [id]);
  tk = await demViec(UID.thuKhoA);
  ok('Sự kiện mới sau khi đọc → chua_doc = 1', tk.chua_doc === 1, `thấy ${tk.chua_doc}`);

  const cua = await duoi(UID.nvQuayA, `select count(*)::int as n from kho_nguoi_xem`);
  ok('Mỗi người chỉ đọc được mốc của chính mình', cua.rows?.[0]?.n === 0, cua.loi ?? `thấy ${cua.rows?.[0]?.n}`);
  const ghi = await duoi(UID.nvQuayA, `insert into kho_nguoi_xem (nhan_su_id, chi_nhanh_id) select id, $1 from nhan_su limit 1`, [cnA.id]);
  ok('Không ai ghi thẳng vào bảng mốc đã đọc', ghi.loi !== null);

  for (const [ten, u] of [['NV quầy', UID.nvQuayA], ['thủ kho', UID.thuKhoA]]) {
    const lo = quetTien(await thongBao(u));
    ok(`${ten}: thông báo không có khóa tiền`, lo.length === 0, lo.join(', '));
  }
});

// ===========================================================================
await nhom('8 · NGƯỠNG CẢNH BÁO', async () => {
  const doc = async () => (await db.query(`select * from kho_cai_dat where chi_nhanh_id = $1`, [cnA.id])).rows[0];
  const r = await duoi(UID.qlA, `select kho_luu_nguong($1, '{"nguong_gia_mua_pt": 7.5, "gio_nhac_chuyen": 3}'::jsonb)`, [cnA.id]);
  const cd = await doc();
  ok('Quản lý lưu ngưỡng', r.loi === null && Number(cd.nguong_gia_mua_pt) === 7.5 && cd.gio_nhac_chuyen === 3, r.loi ?? '');
  ok('Ngưỡng không gửi thì giữ nguyên', Number(cd.nguong_thu_hoi_diem) === 3);

  const tk = await duoi(UID.thuKhoA, `select kho_luu_nguong($1, '{"nguong_gia_mua_pt": 1}'::jsonb)`, [cnA.id]);
  ok('Thủ kho KHÔNG sửa được ngưỡng', tk.loi !== null && /không được sửa/.test(tk.loi), tk.loi ?? '');
  const la = await duoi(UID.qlA, `select kho_luu_nguong($1, '{"nguong_la": 1}'::jsonb)`, [cnA.id]);
  ok('Khóa lạ bị từ chối', la.loi !== null && /Không có ngưỡng/.test(la.loi), la.loi ?? '');
  const chu = await duoi(UID.qlA, `select kho_luu_nguong($1, '{"nguong_gia_mua_pt": "5"}'::jsonb)`, [cnA.id]);
  ok('Giá trị chữ bị từ chối', chu.loi !== null && /con số/.test(chu.loi), chu.loi ?? '');
  const le = await duoi(UID.qlA, `select kho_luu_nguong($1, '{"gio_nhac_chuyen": 1.5}'::jsonb)`, [cnA.id]);
  ok('Giờ lẻ bị từ chối', le.loi !== null && /giờ nguyên/.test(le.loi), le.loi ?? '');
  const vuot = await duoi(UID.qlA, `select kho_luu_nguong($1, '{"nguong_gia_mua_pt": 150}'::jsonb)`, [cnA.id]);
  ok('Ngoài khoảng cho phép bị từ chối', vuot.loi !== null, vuot.loi ?? '');
  const b = await duoi(UID.qlA, `select kho_luu_nguong($1, '{"nguong_gia_mua_pt": 1}'::jsonb)`, [cnB.id]);
  ok('Quản lý Q1 không sửa được ngưỡng Q7', b.loi !== null);
});

// ===========================================================================
await nhom('9 · CHỈ SỐ QUẢN TRỊ', async () => {
  const cs = async uid => (await duoi(uid, `select kho_chi_so_quan_tri($1, $2::date, $2::date) as v`,
    [cnA.id, homNay])).rows?.[0]?.v;
  const ql = await cs(UID.qlA);
  const { rows: [{ kho, quay }] } = await db.query(`
    select coalesce(sum(g.gia_tri) filter (where v.loai = 'kho'), 0)::bigint as kho,
           coalesce(sum(g.gia_tri) filter (where v.loai = 'quay'), 0)::bigint as quay
    from kho_v_ton_gia g join kho_vi_tri v on v.id = g.vi_tri_id where g.chi_nhanh_id = $1`, [cnA.id]);
  ok('Giá trị tồn kho lạnh khớp kho_v_ton_gia', Number(ql.gia_tri_ton_kho) === Number(kho) && Number(kho) > 0,
     `${ql.gia_tri_ton_kho} vs ${kho}`);
  ok('Giá trị tồn quầy khớp', Number(ql.gia_tri_ton_quay) === Number(quay));
  ok('Món quầy dưới mức: 1', ql.mh_duoi_muc === 1, `thấy ${ql.mh_duoi_muc}`);
  const nv = await cs(UID.nvQuayA);
  ok('NV quầy gọi được nhưng mọi số tiền = 0 (RLS)', nv && Number(nv.gia_tri_ton_kho) === 0
     && Number(nv.gia_tri_ton_quay) === 0 && Number(nv.chi_phi_thit) === 0, JSON.stringify(nv));
  ok('Có đủ khóa so sánh kỳ trước', 'chi_phi_thit_truoc' in ql && 'thu_hoi_pt_truoc' in ql && 'gia_von_kg_truoc' in ql);
});

// ===========================================================================
await nhom('10 · HÀM NỘI BỘ', async () => {
  const sk = await duoi(UID.chu, `select * from kho_su_kien($1)`, [cnA.id]);
  ok('Gọi thẳng kho_su_kien() bị từ chối', sk.loi !== null && /permission denied/i.test(sk.loi), sk.loi ?? 'GỌI ĐƯỢC');
  const lv = await duoi(UID.chu, `select kho_luc_vn('2026-01-01', 7)`);
  ok('Gọi thẳng kho_luc_vn() bị từ chối', lv.loi !== null);
  const { rows: [{ t }] } = await db.query(`select kho_luc_vn('2026-01-01', 7)::text as t`);
  ok('7 giờ sáng giờ VN = 0 giờ UTC', /^2026-01-01 00:00:00(\+00)?/.test(t), t);
});

const { rows: doiSoat } = await db.query(`select * from kho_doi_soat_ton()`);
ok('Cuối cùng: tồn khớp sổ kho', doiSoat.length === 0, JSON.stringify(doiSoat));

process.exit(ketThuc('ĐẾM VIỆC VÀ THÔNG BÁO'));
