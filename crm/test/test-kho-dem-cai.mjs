/**
 * BEEFTOWN KHO — Sốt, gia vị, đồ khô và đồ uống: món đếm theo cái (0105, đợt 1)
 * ===============================================================================
 *
 *     node test/test-kho-dem-cai.mjs
 *
 * Khánh chốt 27–28/10/2026: kho quản lý thêm hai nhóm, đếm theo cái (chai, hộp, lon): gia_vi (sốt, gia vị,
 * đồ khô — xuất bếp bằng phiếu, chai nguyên) và do_uong (một chỗ để; tự trừ qua iPOS ở đợt 2). Nhập hàng và
 * kiểm kê theo thùng (1 thùng = N cái), kho giữ số cái. Hạn dùng là ngày in trên sản phẩm, ghi lúc nhận.
 * Thành tiền phiếu nhập khớp hóa đơn từng đồng khi nhập theo giá thùng.
 *
 * Cách lưu: món đếm theo cái dùng đường "đếm gói" (dem_goi, so_goi = số cái) và so_kg LUÔN BẰNG so_goi.
 *
 *   1. danh mục: loại mới, ràng buộc (luôn đếm, không mã cân, không theo tảng, quy đổi thùng 2–10000), quyền;
 *   2. nhận hàng (thủ kho, không kg) → kế toán điền giá thùng → duyệt: thành tiền khớp hóa đơn, lô, sổ kho;
 *      hạn dùng bắt buộc; bấm hai lần; mất mạng không có (hàm database — xem phần web);
 *   3. chi phí khác chia theo tiền khi phiếu có món đếm theo cái, theo kg khi chỉ có thịt (như cũ);
 *   4. xuất bếp, kiểm kê (thiếu / thừa), trả hàng NCC (tiền đúng phần giá thùng): sổ kho so_kg = so_goi;
 *   5. chốt bất biến: ghi sổ kg ≠ số cái bị từ chối (trigger kho_so_cai_dem_cai_kiem); món đã có sổ không đổi được
 *      giữa cân ký và đếm theo cái (trigger kho_mat_hang_doi_kieu_dem_kiem);
 *   6. MISA đơn vị theo món; báo cáo / view cộng kg không cộng món đếm theo cái, tiền vẫn cộng;
 *   7. giờ VN: hạn dùng ngày không có thật bị từ chối; kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — MÓN ĐẾM THEO CÁI (SỐT, ĐỒ UỐNG)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const MH = {};
let viTri = {};
let ncc;

const taoMon = (uid, cot) => duoi(uid, `
  insert into kho_mat_hang (ma, ten, loai, dem_goi, don_vi_goi, so_trong_thung, ma_can, nhom)
  values ($1, $2, $3, coalesce($4, true), $5, $6, $7, $8) returning *`,
  [cot.ma, cot.ten, cot.loai, cot.dem_goi ?? null, cot.don_vi_goi ?? 'chai', cot.so_trong_thung ?? null,
   cot.ma_can ?? null, cot.nhom ?? null]);

function luuKg(uid, t) {
  return duoi(uid, `
    select * from kho_luu_phieu_nhap_kg(
      p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
      p_loai => 'mua', p_nha_cung_cap_id => $5, p_vi_tri_id => $6, p_ngay_nhap => $7::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_ghi_chu => null,
      p_anh_them => $8::text[], p_truong_them => '{}'::jsonb, p_dong => $9::jsonb)`,
    [t.id ?? null, cnA.id, t.maGui ?? maGui(), t.phienBan ?? null, t.ncc ?? ncc, t.viTri ?? viTri.kho,
     t.ngay ?? homNay, [`${cnA.id}/nhap/${maGui()}/1.jpg`], JSON.stringify(t.dong)]);
}
const phienBan = async id => (await db.query(`select phien_ban from kho_phieu_nhap where id = $1`, [id])).rows[0].phien_ban;
const dongNhap = async id => (await db.query(`
  select d.*, m.ma from kho_phieu_nhap_dong d join kho_mat_hang m on m.id = d.mat_hang_id
  where d.phieu_nhap_id = $1 order by d.thu_tu`, [id])).rows;
const dienGia = async (uid, id, gia, t = {}) => duoi(uid, `
  select kho_dien_gia_phieu_nhap(
    p_id => $1, p_phien_ban => $2, p_so_hoa_don => null, p_ngay_hoa_don => null,
    p_han_thanh_toan => null, p_tien_thue => $3, p_chi_phi_khac => $4, p_gia => $5::jsonb) as pb`,
  [id, await phienBan(id), t.thue ?? 0, t.chiPhi ?? 0, JSON.stringify(gia)]);
const guiDuyet = async (uid, id) => duoi(uid, `select kho_gui_duyet_phieu_nhap($1, $2)`, [id, await phienBan(id)]);
const duyet = (uid, id) => duoi(uid, `select kho_duyet_phieu_nhap($1) as cau`, [id]);
const lo = async dongId => (await db.query(`
  select l.*, l.han_dung::text as han, g.gia_tri, g.so_kg_goc::numeric as kg_goc, g.gia_von_kg::numeric as gv
  from kho_lo l join kho_lo_gia g on g.lo_id = l.id where l.phieu_nhap_dong_id = $1`, [dongId])).rows[0];
const tonMon = async (ma, vt = viTri.kho) => {
  const r = (await db.query(`select coalesce(sum(so_kg), 0)::numeric as kg, coalesce(sum(so_goi), 0)::int as goi
                             from kho_ton where mat_hang_id = $1 and vi_tri_id = $2`, [MH[ma].id, vt])).rows[0];
  return { kg: Number(r.kg), goi: r.goi };
};
const soCaiLech = async () => (await db.query(`
  select s.loai, m.ma, s.so_kg, s.so_goi from kho_so_cai s join kho_mat_hang m on m.id = s.mat_hang_id
  where m.dem_theo_cai and s.so_kg <> s.so_goi`)).rows;
const xuat = (uid, t) => duoi(uid, `
  select * from kho_tao_phieu_xuat(
    p_chi_nhanh_id => $1, p_ma_gui => $2, p_loai => $3, p_vi_tri_id => $4, p_vi_tri_den_id => $5,
    p_ly_do_id => $6, p_ghi_chu => null, p_anh => '{}'::text[], p_dong => $7::jsonb)`,
  [cnA.id, t.maGui ?? maGui(), t.loai, t.tu ?? viTri.kho, t.den ?? null, t.lyDo ?? null, JSON.stringify(t.dong)]);

/** Nhận + điền giá + duyệt một phiếu; trả id phiếu. */
async function nhapDu(dong, gia, t = {}) {
  const r = await luuKg(UID.thuKhoA, { dong });
  if (r.loi) throw new Error(r.loi);
  const id = r.rows[0].phieu_id;
  const g = await guiDuyet(UID.thuKhoA, id);
  if (g.loi) throw new Error(g.loi);
  const ds = await dongNhap(id);
  const d = await dienGia(UID.keToanA, id, ds.map((x, i) => ({ dong_id: x.id, ...gia[i] })), t);
  if (d.loi) throw new Error(d.loi);
  const dy = await duyet(UID.keToanA, id);
  if (dy.loi) throw new Error(dy.loi);
  return id;
}

// ===========================================================================
await nhom('1 · DANH MỤC: LOẠI MỚI, RÀNG BUỘC, QUYỀN', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  ncc = (await duoi(UID.keToanA, `insert into kho_nha_cung_cap (ten, so_ngay_no) values ('NCC Bia', 15) returning id`)).rows[0].id;

  let r = await taoMon(UID.qlA, { ma: 'DU-TIGER', ten: 'Bia Tiger lon', loai: 'do_uong', don_vi_goi: 'lon', so_trong_thung: 24, nhom: 'Bia' });
  ok('Quản lý tạo đồ uống "Bia Tiger lon" (lon, 1 thùng = 24 lon)', r.loi === null && r.rows[0].dem_theo_cai === true, r.loi ?? '');
  r = await taoMon(UID.chu, { ma: 'GV-TUONG', ten: 'Tương ớt Hàn', loai: 'gia_vi', don_vi_goi: 'hộp', so_trong_thung: 12 });
  ok('Chủ tạo sốt "Tương ớt Hàn" (hộp, 1 thùng = 12 hộp)', r.loi === null && r.rows[0].dem_theo_cai === true, r.loi ?? '');
  r = await taoMon(UID.qlA, { ma: 'GV-MUOI', ten: 'Muối hột', loai: 'gia_vi', don_vi_goi: 'gói' });
  ok('Gia vị không quy đổi thùng (so_trong_thung trống) tạo được', r.loi === null, r.loi ?? '');
  for (const x of (await db.query(`select * from kho_mat_hang`)).rows) MH[x.ma] = x;
  ok('Món thịt cũ: dem_theo_cai = false', ['T-THANLUNG', 'C-THANNGOAI', 'P-MO'].every(m => MH[m].dem_theo_cai === false));

  const bi = [
    ['không đếm (dem_goi = false)', { ma: 'X1', ten: 'X1', loai: 'gia_vi', dem_goi: false }],
    ['có mã cân', { ma: 'X2', ten: 'X2', loai: 'do_uong', ma_can: '987' }],
    ['quy đổi 1 cái một thùng', { ma: 'X3', ten: 'X3', loai: 'do_uong', so_trong_thung: 1 }],
    ['quy đổi thùng cho món thịt', { ma: 'X4', ten: 'X4', loai: 'phan_cat', so_trong_thung: 24 }],
    ['loại lạ', { ma: 'X5', ten: 'X5', loai: 'rau' }],
  ];
  for (const [ten, cot] of bi) {
    const x = await taoMon(UID.qlA, cot);
    ok(`Ràng buộc chặn: ${ten}`, x.loi !== null && /violates check constraint/.test(x.loi), x.loi ?? 'lưu được');
  }
  const tg = await duoi(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'GV-MUOI'`);
  ok('Ràng buộc chặn: món đếm theo cái bật theo dõi theo tảng', tg.loi !== null, tg.loi ?? 'lưu được');

  for (const [ten, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA], ['Kế toán', UID.keToanA],
                            ['Nhân sự đã nghỉ', UID.nghiViec], ['Không phải nhân sự', null]]) {
    const x = await taoMon(uid, { ma: `Q-${ten.length}${uid ?? 'n'}`.slice(0, 20).toUpperCase().replace(/[^A-Z0-9-]/g, ''), ten, loai: 'do_uong' });
    ok(`${ten} không tạo được món đếm theo cái`, x.loi !== null, x.loi ?? 'tạo được');
  }
  const an = await duoiAnon(`insert into kho_mat_hang (ma, ten, loai) values ('Q-ANON', 'anon', 'do_uong')`);
  ok('Chưa đăng nhập không tạo được món', an.loi !== null);
});

// ===========================================================================
let P1;
await nhom('2 · NHẬN THEO THÙNG → GIÁ THÙNG → DUYỆT: THÀNH TIỀN KHỚP HÓA ĐƠN', async () => {
  const hsd = await ngay(180);
  // Thủ kho: 2 thùng + 5 lon = 53 lon bia (web tính số cái), 1 thùng tương ớt = 12 hộp, 10 gói muối. Không kg.
  let r = await luuKg(UID.thuKhoA, { dong: [
    { mat_hang_id: MH['DU-TIGER'].id, so_goi: 53, han_dung: hsd },
    { mat_hang_id: MH['GV-TUONG'].id, so_goi: 12, han_dung: hsd },
    { mat_hang_id: MH['GV-MUOI'].id, so_goi: 10, han_dung: hsd },
  ] });
  ok('Thủ kho lưu phiếu nhận món đếm theo cái — không gửi kg', r.loi === null, r.loi ?? '');
  P1 = r.rows[0].phieu_id;
  let ds = await dongNhap(P1);
  ok('Dòng: so_kg = số cái (53, 12, 10)', ds.map(d => `${Number(d.so_kg)}/${d.so_goi}`).join() === '53/53,12/12,10/10',
    ds.map(d => `${d.so_kg}/${d.so_goi}`).join());
  ok('Dòng chép số cái một thùng của món (24, 12, trống)', ds.map(d => d.so_trong_thung ?? '-').join() === '24,12,-');

  // Gửi kg sai cũng bị bỏ qua: so_kg luôn bằng số cái.
  r = await luuKg(UID.thuKhoA, { id: P1, phienBan: await phienBan(P1), dong: [
    { mat_hang_id: MH['DU-TIGER'].id, so_goi: 53, so_kg: 12.5, han_dung: hsd },
    { mat_hang_id: MH['GV-TUONG'].id, so_goi: 12, han_dung: hsd },
    { mat_hang_id: MH['GV-MUOI'].id, so_goi: 10, han_dung: hsd },
  ] });
  ds = await dongNhap(P1);
  ok('Kg gửi kèm (12,5) bị bỏ qua — so_kg vẫn = 53', r.loi === null && Number(ds[0].so_kg) === 53, r.loi ?? ds[0].so_kg);

  const thieuHan = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: MH['DU-TIGER'].id, so_goi: 24 }] });
  ok('Thiếu hạn dùng → "chưa ghi hạn dùng in trên sản phẩm"', /chưa ghi hạn dùng in trên sản phẩm/.test(thieuHan.loi ?? ''), thieuHan.loi ?? 'lưu được');
  const khongSo = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: MH['DU-TIGER'].id, han_dung: hsd }] });
  ok('Thiếu số lon → "chưa nhập số lon"', /chưa nhập số lon/.test(khongSo.loi ?? ''), khongSo.loi ?? 'lưu được');
  const ngayLa = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: MH['DU-TIGER'].id, so_goi: 1, han_dung: '2027-02-31' }] });
  ok('Hạn dùng 31/02 (ngày không có thật) bị từ chối', /hạn dùng không hợp lệ/.test(ngayLa.loi ?? ''), ngayLa.loi ?? 'lưu được');
  const leSo = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: MH['DU-TIGER'].id, so_goi: 1.5, han_dung: hsd }] });
  ok('Số lon lẻ (1,5) bị từ chối — chai, lon nguyên', /số nguyên/.test(leSo.loi ?? ''), leSo.loi ?? 'lưu được');

  // Thủ kho gửi giá thùng → database từ chối (thủ kho không có giá).
  const tkGia = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: MH['DU-TIGER'].id, so_goi: 24, han_dung: hsd, don_gia_thung: 380000 }] });
  ok('Thủ kho gửi giá thùng bị từ chối ("người nhận hàng không điền đơn giá")',
    /người nhận hàng không điền đơn giá/.test(tkGia.loi ?? ''), tkGia.loi ?? 'lưu được');
  const tkGia2 = await duoi(UID.thuKhoA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => '{}'::text[],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, viTri.kho, homNay, JSON.stringify([{ mat_hang_id: MH['DU-TIGER'].id, so_goi: 24, han_dung: hsd, don_gia_thung: 1 }])]);
  ok('Thủ kho gửi giá thùng qua hàm lưu có giá cũng bị từ chối', /không điền giá/.test(tkGia2.loi ?? ''), tkGia2.loi ?? 'lưu được');

  await guiDuyet(UID.thuKhoA, P1);
  ds = await dongNhap(P1);
  // Kế toán: bia 380.000 đ / thùng 24 lon, tương ớt 600.000 đ / thùng 12 hộp, muối 7.000 đ / gói.
  const dg = await dienGia(UID.keToanA, P1, [
    { dong_id: ds[0].id, don_gia_thung: 380000 },
    { dong_id: ds[1].id, don_gia_thung: 600000 },
    { dong_id: ds[2].id, don_gia_kg: 7000 },
  ]);
  ok('Kế toán điền giá thùng / giá một gói', dg.loi === null, dg.loi ?? '');
  ds = await dongNhap(P1);
  ok('Bia: 53 lon × 380.000 / 24 = 839.167 đ (làm tròn một lần ở thành tiền); giá một lon 15.833 đ để xem',
    Number(ds[0].thanh_tien) === 839167 && Number(ds[0].don_gia_kg) === 15833 && Number(ds[0].don_gia_thung) === 380000,
    `${ds[0].thanh_tien} · ${ds[0].don_gia_kg}`);
  ok('Tương ớt: đúng 1 thùng → 600.000 đ (khớp hóa đơn từng đồng)', Number(ds[1].thanh_tien) === 600000);
  ok('Muối: 10 gói × 7.000 = 70.000 đ (giá một gói như cũ)', Number(ds[2].thanh_tien) === 70000 && ds[2].don_gia_thung === null);

  const sai = await dienGia(UID.keToanA, P1, [{ dong_id: ds[2].id, don_gia_thung: 100000 }]);
  ok('Giá thùng cho món không quy đổi thùng → báo, không lưu', /không có quy đổi thùng/.test(sai.loi ?? ''), sai.loi ?? 'lưu được');
  const am = await dienGia(UID.keToanA, P1, [{ dong_id: ds[0].id, don_gia_thung: -1 }]);
  ok('Giá thùng âm bị từ chối', /số đồng nguyên, không âm/.test(am.loi ?? ''), am.loi ?? 'lưu được');
  const tk = await dienGia(UID.thuKhoA, P1, [{ dong_id: ds[0].id, don_gia_thung: 1 }]);
  ok('Thủ kho không điền giá được', tk.loi !== null);

  // Đổi lại giá một lon (bỏ giá thùng) rồi giá thùng lần nữa — giá thùng không còn treo.
  await dienGia(UID.keToanA, P1, [{ dong_id: ds[0].id, don_gia_kg: 16000 }]);
  let d0 = (await dongNhap(P1))[0];
  ok('Điền lại giá một lon: giá thùng xóa, thành tiền 53 × 16.000', d0.don_gia_thung === null && Number(d0.thanh_tien) === 848000);
  await dienGia(UID.keToanA, P1, [{ dong_id: ds[0].id, don_gia_thung: 380000 }]);
  d0 = (await dongNhap(P1))[0];
  ok('Giá thùng lần nữa: về 839.167 đ', Number(d0.thanh_tien) === 839167);

  // Phiếu khác: kế toán điền giá thùng rồi thủ kho rút về, sửa 24 → 48 lon — giá thùng đi theo món sang dòng mới.
  const p2 = (await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: MH['DU-TIGER'].id, so_goi: 24, han_dung: hsd }] })).rows[0].phieu_id;
  await guiDuyet(UID.thuKhoA, p2);
  await dienGia(UID.keToanA, p2, [{ dong_id: (await dongNhap(p2))[0].id, don_gia_thung: 380000 }]);
  await duoi(UID.thuKhoA, `select kho_rut_phieu_nhap($1)`, [p2]);
  const sua = await luuKg(UID.thuKhoA, { id: p2, phienBan: await phienBan(p2),
    dong: [{ mat_hang_id: MH['DU-TIGER'].id, so_goi: 48, han_dung: hsd }] });
  const d2 = (await dongNhap(p2))[0];
  ok('Thủ kho sửa 24 → 48 lon sau khi có giá thùng: giá thùng giữ, thành tiền đúng 2 thùng = 760.000 đ',
    sua.loi === null && Number(d2.don_gia_thung) === 380000 && Number(d2.thanh_tien) === 760000,
    sua.loi ?? `${d2.don_gia_thung} · ${d2.thanh_tien}`);
  await duoi(UID.thuKhoA, `select kho_huy_phieu_nhap($1, 'Phiếu thử')`, [p2]);

  const v = (await duoi(UID.keToanA, `select tong_kg, tong_goi, tien_hang from kho_v_phieu_nhap where id = $1`, [P1])).rows[0];
  ok('Danh sách phiếu: tổng kg 0 (không cộng lon, hộp, gói), tiền hàng đủ 1.509.167 đ',
    Number(v.tong_kg) === 0 && Number(v.tien_hang) === 839167 + 600000 + 70000, JSON.stringify(v));

  const lan1 = await duyet(UID.keToanA, P1);
  const lan2 = await duyet(UID.keToanA, P1);
  ok('Duyệt: 3 lô vào kho; bấm hai lần → "đã được duyệt trước đó", không thêm lô',
    /3 lô hàng đã vào kho/.test(lan1.rows?.[0]?.cau ?? '') && /đã được duyệt trước đó/.test(lan2.rows?.[0]?.cau ?? '')
    && Number((await db.query(`select count(*) from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
                               where d.phieu_nhap_id = $1`, [P1])).rows[0].count) === 3, lan1.loi ?? lan1.rows?.[0]?.cau);
  const lBia = await lo(ds[0].id);
  ok('Lô bia: giá trị 839.167 đ, 53 cái, giá vốn một lon 15.833,3396 đ, hạn = ngày ghi',
    Number(lBia.gia_tri) === 839167 && Number(lBia.kg_goc) === 53 && Math.abs(Number(lBia.gv) - 839167 / 53) < 0.0001
    && lBia.han === hsd, `${lBia.gia_tri} ${lBia.kg_goc} ${lBia.gv} ${lBia.han}`);
  ok('Tồn kho: 53 lon / 53 "kg"; 12 hộp; 10 gói',
    JSON.stringify(await tonMon('DU-TIGER')) === '{"kg":53,"goi":53}'
    && JSON.stringify(await tonMon('GV-TUONG')) === '{"kg":12,"goi":12}'
    && JSON.stringify(await tonMon('GV-MUOI')) === '{"kg":10,"goi":10}');
});

// ===========================================================================
await nhom('3 · CHI PHÍ KHÁC: THEO TIỀN KHI CÓ MÓN ĐẾM THEO CÁI, THEO KG KHI CHỈ THỊT', async () => {
  await duoi(UID.qlA, `update kho_cai_dat set chi_phi_vao_gia_von = true where chi_nhanh_id = $1`, [cnA.id]);
  const hsd = await ngay(90);
  // Thịt 10 kg × 500.000 = 5.000.000 và 24 lon bia 380.000 → tổng hàng 5.380.000; chi phí khác 53.800 chia theo tiền:
  // thịt 50.000, bia 3.800. (Theo kg cũ thì 24 "kg" bia ăn 70% chi phí — sai.)
  const id = await nhapDu([
    { mat_hang_id: MH['T-THANLUNG'].id, so_goi: 1, so_kg: 10, han_dung: hsd },
    { mat_hang_id: MH['DU-TIGER'].id, so_goi: 24, han_dung: hsd },
  ], [{ don_gia_kg: 500000 }, { don_gia_thung: 380000 }], { chiPhi: 53800 });
  const ds = await dongNhap(id);
  const lThit = await lo(ds[0].id);
  const lBia = await lo(ds[1].id);
  ok('Phiếu có bia: chi phí khác chia theo tiền — thịt 5.050.000, bia 383.800',
    Number(lThit.gia_tri) === 5050000 && Number(lBia.gia_tri) === 383800, `${lThit.gia_tri} · ${lBia.gia_tri}`);

  // Chỉ thịt: chia theo kg như cũ (10 kg và 30 kg, chi phí 40.000 → 10.000 và 30.000 dù giá khác nhau).
  const id2 = await nhapDu([
    { mat_hang_id: MH['T-THANLUNG'].id, so_goi: 1, so_kg: 10, han_dung: hsd },
    { mat_hang_id: MH['T-NACVAI'].id, so_goi: 2, so_kg: 30, han_dung: hsd },
  ], [{ don_gia_kg: 500000 }, { don_gia_kg: 300000 }], { chiPhi: 40000 });
  const ds2 = await dongNhap(id2);
  ok('Phiếu chỉ thịt: chi phí khác chia theo kg như cũ (10.000 / 30.000)',
    Number((await lo(ds2[0].id)).gia_tri) === 5010000 && Number((await lo(ds2[1].id)).gia_tri) === 9030000);
  await duoi(UID.qlA, `update kho_cai_dat set chi_phi_vao_gia_von = false where chi_nhanh_id = $1`, [cnA.id]);
});

// ===========================================================================
await nhom('4 · XUẤT BẾP, KIỂM KÊ, TRẢ HÀNG: SỔ KHO so_kg = SỐ CÁI', async () => {
  const lyDoBep = (await db.query(`select id from kho_ly_do where loai = 'xuat_bep' order by thu_tu limit 1`)).rows[0].id;
  const truoc = await tonMon('GV-TUONG');
  const g = maGui();
  const x1 = await xuat(UID.thuKhoA, { loai: 'xuat_bep', lyDo: lyDoBep, maGui: g, dong: [{ mat_hang_id: MH['GV-TUONG'].id, so_goi: 3 }] });
  const x2 = await xuat(UID.thuKhoA, { loai: 'xuat_bep', lyDo: lyDoBep, maGui: g, dong: [{ mat_hang_id: MH['GV-TUONG'].id, so_goi: 3 }] });
  const sau = await tonMon('GV-TUONG');
  ok('Xuất bếp 3 hộp tương ớt: tồn 12 → 9 hộp, kg = số hộp', x1.loi === null && truoc.goi === 12 && sau.goi === 9 && sau.kg === 9,
    x1.loi ?? JSON.stringify(sau));
  ok('Bấm hai lần (cùng mã gửi): một phiếu, không trừ hai lần', x2.loi === null && x2.rows[0].da_co === true
    && x2.rows[0].phieu_id === x1.rows[0].phieu_id);
  const vx = (await duoi(UID.qlA, `select tong_kg, tong_goi from kho_v_phieu_xuat where id = $1`, [x1.rows[0].phieu_id])).rows[0];
  ok('Danh sách phiếu xuất: tổng kg 0, tổng 3 cái', Number(vx.tong_kg) === 0 && vx.tong_goi === 3, JSON.stringify(vx));
  const quaTon = await xuat(UID.thuKhoA, { loai: 'xuat_bep', lyDo: lyDoBep, dong: [{ mat_hang_id: MH['GV-TUONG'].id, so_goi: 50 }] });
  ok('Xuất quá tồn (50 hộp) bị từ chối', quaTon.loi !== null);

  // Kiểm kê: đếm được 50 lon bia (sổ 53 + 24 = 77 → thiếu 27 lon), muối 11 gói (thừa 1).
  const kk = (await duoi(UID.thuKhoA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_mat_hang', $3) as id`,
    [cnA.id, viTri.kho, maGui()])).rows[0].id;
  const pb = (await db.query(`select phien_ban from kho_kiem_ke where id = $1`, [kk])).rows[0].phien_ban;
  // Món khác trong danh sách: đếm đúng như sổ (phải đếm hết mới gửi được).
  const dem = { [MH['DU-TIGER'].id]: 50, [MH['GV-MUOI'].id]: 11 };
  const dongKK = (await db.query(`select d.mat_hang_id, m.dem_goi,
      (select coalesce(sum(t.so_goi), 0)::int from kho_ton t where t.mat_hang_id = d.mat_hang_id and t.vi_tri_id = $2) as so_goi_so,
      (select coalesce(sum(t.so_kg), 0) from kho_ton t where t.mat_hang_id = d.mat_hang_id and t.vi_tri_id = $2) as so_kg_so
    from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id where d.kiem_ke_id = $1`, [kk, viTri.kho])).rows;
  const luu = await duoi(UID.thuKhoA, `select kho_luu_kiem_ke($1, $2, null, $3::jsonb)`, [kk, pb, JSON.stringify(
    dongKK.map(d => ({
      mat_hang_id: d.mat_hang_id,
      so_goi_dem: dem[d.mat_hang_id] ?? (d.dem_goi ? d.so_goi_so : null),
      so_kg_dem: dem[d.mat_hang_id] !== undefined || d.dem_goi ? null : Number(d.so_kg_so),
      xac_nhan_het: false,
    })))]);
  ok('Thủ kho lưu kiểm kê theo số cái', luu.loi === null, luu.loi ?? '');
  const pb2 = (await db.query(`select phien_ban from kho_kiem_ke where id = $1`, [kk])).rows[0].phien_ban;
  const gui = await duoi(UID.thuKhoA, `select kho_gui_kiem_ke($1, $2)`, [kk, pb2]);
  const dk = await duoi(UID.qlA, `select kho_duyet_kiem_ke($1) as cau`, [kk]);
  ok('Gửi và duyệt kiểm kê', gui.loi === null && dk.loi === null, gui.loi ?? dk.loi ?? '');
  ok('Sau kiểm kê: bia 50 lon / 50, muối 11 gói / 11',
    JSON.stringify(await tonMon('DU-TIGER')) === '{"kg":50,"goi":50}' && JSON.stringify(await tonMon('GV-MUOI')) === '{"kg":11,"goi":11}',
    JSON.stringify([await tonMon('DU-TIGER'), await tonMon('GV-MUOI')]));

  // Trả NCC 1 thùng (24 lon) của phiếu P1 → tiền tự tính đúng 380.000 đ (không 24 × 15.833 = 379.992).
  const loBia = (await db.query(`select l.id from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 and l.mat_hang_id = $2`, [P1, MH['DU-TIGER'].id])).rows[0].id;
  const conLo = (await db.query(`select so_goi from kho_ton where lo_id = $1 and vi_tri_id = $2`, [loBia, viTri.kho])).rows[0].so_goi;
  const tra = await duoi(UID.thuKhoA, `select * from kho_tra_hang_ghi_kg(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_phieu_nhap_id => $3, p_vi_tri_id => $4, p_ghi_chu => 'Lon móp',
      p_anh => '{}'::text[], p_dong => $5::jsonb)`,
    [cnA.id, maGui(), P1, viTri.kho, JSON.stringify([{ lo_id: loBia, so_kg: Math.min(24, conLo), so_goi: Math.min(24, conLo) }])]);
  ok('Thủ kho ghi trả 24 lon (số kg = số lon)', tra.loi === null, tra.loi ?? '');
  if (!tra.loi && conLo >= 24) {
    const xId = Object.values(tra.rows[0]).find(v => typeof v === 'string' && /^[0-9a-f-]{36}$/.test(v));
    const tien = (await db.query(`select kho_tien_tra_hang_goi_y($1) as t`, [xId])).rows[0].t;
    ok('Tiền trả hàng tự tính: 24 lon = đúng 380.000 đ (giá thùng)', Number(tien) === 380000, String(tien));
  }

  ok('Sổ kho: mọi dòng của món đếm theo cái có so_kg = so_goi', (await soCaiLech()).length === 0, JSON.stringify(await soCaiLech()));
});

// ===========================================================================
await nhom('5 · CHỐT BẤT BIẾN', async () => {
  const loMuoi = (await db.query(`select lo_id from kho_ton where mat_hang_id = $1 and so_goi > 0 limit 1`, [MH['GV-MUOI'].id])).rows[0].lo_id;
  let loi = null;
  try {
    await db.query(`insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id, ngay)
                    values ($1, $2, $3, $4, 'kiem_ke', -0.5, -1, 'kiem_ke', gen_random_uuid(), hom_nay_vn())`,
      [cnA.id, loMuoi, viTri.kho, MH['GV-MUOI'].id]);
  } catch (e) { loi = e.message; }
  ok('Ghi sổ kg (−0,5) ≠ số gói (−1) cho món đếm theo cái bị chặn', /số kg phải bằng số gói/.test(loi ?? ''), loi ?? 'ghi được');

  const doi = await duoi(UID.qlA, `update kho_mat_hang set loai = 'phan_cat' where id = $1`, [MH['DU-TIGER'].id]);
  ok('Đồ uống đã có sổ kho không đổi được sang phần cắt', /không đổi được giữa hàng cân ký và hàng đếm theo cái/.test(doi.loi ?? ''), doi.loi ?? 'đổi được');
  const doi2 = await duoi(UID.qlB, `update kho_mat_hang set loai = 'gia_vi', dem_goi = true where ma = 'C-THANNGOAI'`);
  // Thăn ngoại cắt lát của danh mục mẫu chưa có sổ ở chi nhánh nào trong file này → đổi được về mặt sổ;
  // nhưng nếu có sổ ở chi nhánh A thì quản lý chi nhánh B cũng bị chặn (trigger đọc sổ mọi chi nhánh).
  await db.query(`update kho_mat_hang set loai = 'phan_cat' where ma = 'C-THANNGOAI'`);
  const coSoA = Number((await db.query(`select count(*) from kho_so_cai where mat_hang_id = $1`, [MH['T-THANLUNG'].id])).rows[0].count) > 0;
  const doi3 = await duoi(UID.qlB, `update kho_mat_hang set loai = 'gia_vi', dem_goi = true where ma = 'T-THANLUNG'`);
  ok('Quản lý chi nhánh B không đổi được món có sổ ở chi nhánh A sang đếm theo cái', coSoA && doi3.loi !== null, doi3.loi ?? 'đổi được');
  ok('Món chưa có phiếu / sổ thì đổi loại được', doi2.loi === null, doi2.loi ?? '');
});

// ===========================================================================
await nhom('6 · MISA, BÁO CÁO', async () => {
  const misa = (await duoi(UID.keToanA, `select * from kho_du_lieu_misa($1, $2::date, $3::date, 'mua_hang')`,
    [cnA.id, await ngay(-1), await ngay(1)])).rows ?? [];
  const bia = misa.find(r => r.ten_hang === 'Bia Tiger lon' && r.so_chung_tu);
  const thit = misa.find(r => r.ten_hang === 'Thăn lưng nguyên tảng');
  ok('MISA: bia đơn vị "lon", số lượng 53, thành tiền 839.167', bia?.dvt === 'lon' && Number(bia.so_luong) === 53
    && Number(bia.thanh_tien) === 839167, JSON.stringify(bia));
  ok('MISA: thịt vẫn "kg"', thit?.dvt === 'kg');
  ok('MISA: tổng thành tiền dòng hàng của phiếu đầu = 1.509.167 đ (khớp hóa đơn)',
    misa.filter(r => r.ref_id === P1 && r.ma_hang).reduce((a, r) => a + Number(r.thanh_tien), 0) === 1509167);

  const thang = (await duoi(UID.qlA, `select * from kho_bao_cao_theo_thang($1, extract(year from hom_nay_vn())::int)`, [cnA.id])).rows;
  const t = thang[thang.length - 1];
  ok('Báo cáo tháng: nhập kg chỉ tính thịt (10 + 10 + 30 = 50 kg), tiền nhập gồm cả bia, sốt',
    Number(t.nhap_kg) === 50 && Number(t.nhap_tien) > 5050000 + 5010000 + 9030000, `${t.nhap_kg} · ${t.nhap_tien}`);
  const ncc1 = (await duoi(UID.qlA, `select * from kho_bao_cao_mua_hang($1, $2::date, $3::date, 'ncc')`,
    [cnA.id, await ngay(-1), await ngay(1)])).rows[0];
  ok('Mua hàng theo NCC: kg 50 (thịt), giá TB/kg tính trên tiền thịt (19.000.000 / 50 = 380.000)',
    Number(ncc1.so_kg) === 50 && Number(ncc1.gia_tb_kg) === Math.round((5000000 + 5000000 + 9000000) / 50), JSON.stringify(ncc1));
  const mh = (await duoi(UID.qlA, `select * from kho_bao_cao_mua_hang($1, $2::date, $3::date, 'mat_hang')`,
    [cnA.id, await ngay(-1), await ngay(1)])).rows.find(r => r.ten === 'Bia Tiger lon');
  ok('Mua hàng theo mặt hàng: bia 77 lon, giá TB một lon = tiền / số lon', Number(mh?.so_kg) === 77
    && Number(mh.gia_tb_kg) === Math.round((839167 + 380000) / 77), JSON.stringify(mh));
  const ncc2 = (await duoi(UID.qlA, `select * from kho_bao_cao_ncc($1, $2::date, $3::date)`,
    [cnA.id, await ngay(-1), await ngay(1)])).rows[0];
  ok('Đánh giá NCC: tổng kg 50 (thịt), giá TB/kg 380.000', Number(ncc2.tong_kg) === 50 && Number(ncc2.gia_tb_kg) === 380000,
    JSON.stringify(ncc2));
});

const ds = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
ok('kho_doi_soat_ton() rỗng', ds.length === 0, JSON.stringify(ds));

process.exit(ketThuc('MÓN ĐẾM THEO CÁI'));
