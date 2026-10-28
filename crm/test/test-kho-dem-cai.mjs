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

import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';
import { luuMatHang, docMatHang, xemTruocDanMatHang, demMacDinh, laLoaiDemCai, LOAI_DEM_CAI } from '../../web/src/lib/kho/danh-muc.ts';
import { laDemCai, soCaiChu, TEN_LOAI_MAT_HANG_NB } from '../../web/src/lib/kho/chung.ts';
import { docFormDongNhan, dongNhanVaoForm } from '../../web/src/lib/kho/nhan-hang.ts';
import { docFormDienGia, dienGiaTuPhieu, thanhTienDong, xemTruocGiaVon, chuSoSanhGia } from '../../web/src/lib/kho/nhap.ts';
import { docDongTraHang } from '../../web/src/lib/kho/cong-no.ts';
import { docFormPhieuXuat } from '../../web/src/lib/kho/xuat.ts';
import { viecVoiLo } from '../../web/src/lib/kho/ton.ts';
import { BAO_CAO, docBaoCao, docMuaHang, dinhNghiaMuaHang, dinhNghiaTheoThang, tinhTong, tomTatXnt } from '../../web/src/lib/kho/bao-cao.ts';
import { docFormKiemKe, payloadTuDong, chuKyDong, daDemDong } from '../../web/src/lib/kho/kiem-ke.ts';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

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
    const cho = await duoi(UID.keToanA, `select * from kho_ds_tra_hang_cho_tien($1)`, [cnA.id]);
    const dongCho = (cho.rows ?? []).find(r => r.phieu_xuat_id === xId);
    ok('kho_ds_tra_hang_cho_tien: 24 lon không cộng vào tổng kg / tổng gói, vẫn đếm 1 lô, gợi ý 380.000 đ',
      dongCho && Number(dongCho.tong_kg) === 0 && Number(dongCho.tong_goi) === 0 && dongCho.so_dong === 1
        && Number(dongCho.so_tien_goi_y) === 380000, JSON.stringify(dongCho ?? cho.loi));
    const sk = await duoi(UID.keToanA, `select kho_thong_bao($1, 300) as v`, [cnA.id]);
    const skBia = (sk.rows?.[0]?.v?.su_kien ?? []).find(r => r.khoa === 'tra_hang_cho_tien' && r.ref_id === xId);
    ok('kho_su_kien "Trả hàng chờ xác nhận tiền": phiếu chỉ có lon → số kg để trống (không in "24 kg")',
      skBia && skBia.so === null, JSON.stringify(skBia ?? sk.loi));
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

  // --- Web: bảng báo cáo, dòng tổng, thẻ tóm tắt ---
  const qlWeb = (await taoClientPg({ db, duoi, duoiAnon }))(UID.qlA);
  const [tu, den] = [await ngay(-1), await ngay(1)];
  const xnt = await docBaoCao(qlWeb, 'xuat-nhap-ton', cnA.id, tu, den);
  const xBia = xnt.dong.find(d => d.ten === 'Bia Tiger lon');
  const xThit = xnt.dong.filter(d => !d.dem_cai);
  ok('Xuất – nhập – tồn (web): bia có ĐVT "lon", thịt "kg"; có cột ĐVT',
    xnt.loi === null && xBia?.don_vi_goi === 'lon' && xBia.dem_cai === true && xThit.length > 0 && xThit.every(d => d.don_vi_goi === 'kg')
    && BAO_CAO['xuat-nhap-ton'].cot[1].khoa === 'don_vi_goi', xnt.loi ?? JSON.stringify(xBia));
  const tongXnt = tinhTong(BAO_CAO['xuat-nhap-ton'], xnt.dong)[0];
  const cong = (ds, k) => Math.round(ds.reduce((a, d) => a + (Number(d[k]) || 0), 0) * 1000) / 1000;
  ok('Xuất – nhập – tồn: dòng tổng kg chỉ cộng hàng cân ký, tiền cộng mọi dòng',
    tongXnt.so.cuoi_kg === cong(xThit, 'cuoi_kg') && tongXnt.so.nhap_kg === cong(xThit, 'nhap_kg')
    && tongXnt.so.cuoi_gia_tri === cong(xnt.dong, 'cuoi_gia_tri') && cong(xnt.dong, 'cuoi_kg') > tongXnt.so.cuoi_kg,
    JSON.stringify(tongXnt.so));
  const tt = tomTatXnt(xnt.dong);
  ok('Thẻ tóm tắt kỳ: kg chỉ hàng cân ký, tiền gồm cả bia / sốt', tt.ton_cuoi_kg === cong(xThit, 'cuoi_kg')
    && tt.ton_cuoi_tien === cong(xnt.dong, 'cuoi_gia_tri'), JSON.stringify(tt));

  const hh = await docBaoCao(qlWeb, 'hao-hut', cnA.id, tu, den);
  const hBia = hh.dong.filter(d => d.dem_cai);
  ok('Hủy, xuất bếp (web): dòng bia / muối không kg, số cái ở cột "Gói / cái", tên kèm đơn vị',
    hh.loi === null && hBia.length > 0 && hBia.every(d => d.so_kg === null && Number.isInteger(d.so_goi) && / \((lon|gói|hộp)\)$/.test(d.ten)),
    hh.loi ?? JSON.stringify(hh.dong));
  const tongHh = tinhTong(BAO_CAO['hao-hut'], hh.dong);
  ok('Hủy, xuất bếp: "Cộng" gói chỉ cộng gói thịt, tiền cộng mọi dòng',
    tongHh.every(t => {
      const nhom = hh.dong.filter(d => `Cộng ${d.loai_dong}` === t.nhan);
      return (t.so.so_goi ?? 0) === cong(nhom.filter(d => !d.dem_cai), 'so_goi') && t.so.gia_tri === cong(nhom, 'gia_tri');
    }), JSON.stringify(tongHh));

  const muaMh = await docMuaHang(qlWeb, cnA.id, tu, den, 'mat_hang');
  const mBia = muaMh.dong.find(d => d.dem_cai);
  ok('Mua hàng theo mặt hàng (web): bia "Bia Tiger lon (lon)", 77 ở cột Gói / cái, không kg, giá một lon',
    muaMh.loi === null && mBia?.ten === 'Bia Tiger lon (lon)' && mBia.so_kg === null && mBia.so_goi === 77
    && mBia.gia_tb_kg === Math.round((839167 + 380000) / 77), muaMh.loi ?? JSON.stringify(mBia));
  const tongMh = tinhTong(dinhNghiaMuaHang('mat_hang'), muaMh.dong)[0];
  ok('Mua hàng theo mặt hàng: dòng tổng kg 50, giá TB/kg = tiền thịt ÷ kg thịt (380.000)',
    tongMh.so.so_kg === 50 && tongMh.so.gia_tb_kg === 380000, JSON.stringify(tongMh.so));
  const muaNcc = await docMuaHang(qlWeb, cnA.id, tu, den, 'ncc');
  const tongNcc = tinhTong(dinhNghiaMuaHang('ncc'), muaNcc.dong)[0];
  ok('Mua hàng theo NCC: dòng tổng giá TB/kg 380.000 (không chia tiền bia / sốt cho kg thịt)',
    muaNcc.loi === null && tongNcc.so.gia_tb_kg === 380000 && tongNcc.so.tien_hang > 19000000, JSON.stringify(tongNcc.so));
  ok('Nhãn: "Chi phí nguyên liệu" thay "Chi phí thịt" ở báo cáo tháng',
    dinhNghiaTheoThang(true).cot.find(c => c.khoa === 'chi_phi_thit')?.ten === 'Chi phí nguyên liệu');
});

// ===========================================================================
await nhom('7 · DANH MỤC WEB: luuMatHang, DÁN EXCEL, HÀM THUẦN', async () => {
  ok('laDemCai: theo cột dem_theo_cai, không có thì theo loại', laDemCai({ dem_theo_cai: true }) && !laDemCai({ dem_theo_cai: false, loai: 'gia_vi' })
    && laDemCai({ loai: 'do_uong' }) && !laDemCai({ loai: 'phan_cat' }) && !laDemCai(null));
  ok('Hai loại đếm theo cái có tên vi / en', LOAI_DEM_CAI.every(l => TEN_LOAI_MAT_HANG_NB[l]?.vi && TEN_LOAI_MAT_HANG_NB[l]?.en)
    && laLoaiDemCai('gia_vi') && !laLoaiDemCai('tang'));
  ok('demMacDinh của món đếm theo cái: luôn đếm', demMacDinh('do_uong').dem_goi === true);

  const clientCua = await taoClientPg({ db, duoi, duoiAnon });
  const ql = clientCua(UID.qlA);
  const taoForm = o => { const f = new FormData(); for (const [k, v] of Object.entries({ viec: 'luu', ...o })) f.set(k, v); return f; };
  const mot = async ma => (await db.query(`select * from kho_mat_hang where ma = $1`, [ma])).rows[0];

  // Ô ẩn của thịt (hạn dùng, cách đếm, mã cân, giá bán) gửi kèm — bị bỏ qua.
  let kq = await luuMatHang(ql, taoForm({ ten: 'Nước tương Kikkoman', ma: 'GV-KIKKO', loai: 'gia_vi', don_vi_cai: 'chai',
    so_trong_thung: '12', han_dung_ngay: '3', dem_goi: 'khong', don_vi_goi: 'khay', ma_can: '555', gia_ban_kg: '1.000' }), []);
  let m = await mot('GV-KIKKO');
  ok('Thêm sốt qua form: đơn vị chai, 1 thùng = 12, luôn đếm; hạn dùng (ngày), mã cân, giá bán ẩn bị bỏ qua',
    kq.ok && m.dem_goi === true && m.don_vi_goi === 'chai' && m.so_trong_thung === 12 && m.han_dung_ngay === null
    && m.ma_can === null && m.gia_ban_kg === null && m.dem_theo_cai === true, kq.cau);
  kq = await luuMatHang(ql, taoForm({ ten: 'Soju', ma: 'DU-SOJU', loai: 'do_uong', so_trong_thung: '20' }), []);
  ok('Đồ uống thiếu đơn vị → "Nhập đơn vị" (vi / en)', !kq.ok && /Nhập đơn vị/.test(kq.cau) && !!kq.cauEn, kq.cau);
  kq = await luuMatHang(ql, taoForm({ ten: 'Soju', ma: 'DU-SOJU', loai: 'do_uong', don_vi_cai: 'chai', so_trong_thung: '1' }), []);
  ok('Số cái một thùng = 1 → báo (từ 2 đến 10.000)', !kq.ok && /từ 2 đến 10\.000/.test(kq.cau), kq.cau);
  kq = await luuMatHang(ql, taoForm({ ten: 'Soju', ma: 'DU-SOJU', loai: 'do_uong', don_vi_cai: 'chai', so_trong_thung: '' }), []);
  ok('Không quy đổi thùng (trống) lưu được', kq.ok && (await mot('DU-SOJU')).so_trong_thung === null, kq.cau);
  kq = await luuMatHang(ql, taoForm({ ten: 'Thăn cắt', ma: 'C-THU', loai: 'phan_cat', so_trong_thung: '24', don_vi_cai: 'lon' }), []);
  m = await mot('C-THU');
  ok('Phần cắt: ô "số cái một thùng", "đơn vị" ẩn bị bỏ qua — so_trong_thung trống, đơn vị gói',
    kq.ok && m.so_trong_thung === null && m.don_vi_goi === 'gói', kq.cau);

  // Sửa: món đã có sổ kho đổi loại → database chặn, câu đi lên trang.
  const bia = (await docMatHang(ql)).find(x => x.ma === 'DU-TIGER');
  kq = await luuMatHang(ql, taoForm({ id: bia.id, ten: bia.ten, ma: bia.ma, loai: 'phan_cat' }), [], bia);
  ok('Đổi đồ uống đã có sổ sang phần cắt qua form → báo, không đổi', !kq.ok && (await mot('DU-TIGER')).loai === 'do_uong', kq.cau);
  kq = await luuMatHang(ql, taoForm({ id: bia.id, ten: 'Bia Tiger lon 330ml', ma: bia.ma, loai: 'do_uong', don_vi_cai: 'lon', so_trong_thung: '24' }), [], bia);
  ok('Sửa tên đồ uống: lưu được, đơn vị và quy đổi giữ', kq.ok && (await mot('DU-TIGER')).ten === 'Bia Tiger lon 330ml', kq.cau);

  // Dán Excel.
  const daCo = (await docMatHang(ql)).map(x => ({ ...x }));
  let xt = xemTruocDanMatHang(daCo, 'Tên\tLoại\nNước mắm\tsốt');
  ok('Dán: sốt mới → báo thêm ở form (cần đơn vị, số cái một thùng)', xt.them.length === 0 && /thêm từng món/.test(xt.loi.join()), xt.loi.join());
  xt = xemTruocDanMatHang(daCo, 'Mã\tLoại\nT-THANLUNG\tđồ uống');
  ok('Dán: đổi tảng sang đồ uống → báo làm ở nút Sửa', xt.sua.length === 0 && /nút Sửa/.test(xt.loi.join()), xt.loi.join());
  xt = xemTruocDanMatHang(daCo, 'Mã\tMã cân\nGV-KIKKO\t777');
  ok('Dán: mã cân cho món đếm theo cái → báo', xt.sua.length === 0 && /không có mã cân/.test(xt.loi.join()), xt.loi.join());
  xt = xemTruocDanMatHang(daCo, 'Mã\tNhóm\nGV-KIKKO\tSốt Nhật');
  ok('Dán: đổi nhóm của sốt đã có → cập nhật được', xt.sua.length === 1 && xt.loi.length === 0, xt.loi.join());
});

// ===========================================================================
await nhom('8 · NHẬN HÀNG, ĐIỀN GIÁ — HÀM THUẦN VÀ MÃ NGUỒN', async () => {
  const BIA = '00000000-0000-4000-8000-0000000000a1';
  const THIT = '00000000-0000-4000-8000-0000000000a2';
  const MUOI = '00000000-0000-4000-8000-0000000000a3';
  const mon = new Map([
    [BIA, { ten: 'Bia Tiger lon', dem_goi: true, don_vi_goi: 'lon', dem_cai: true, so_trong_thung: 24 }],
    [THIT, { ten: 'Thăn ngoại', dem_goi: true, don_vi_goi: 'gói' }],
    [MUOI, { ten: 'Muối', dem_goi: true, don_vi_goi: 'gói', dem_cai: true, so_trong_thung: null }],
  ]);
  const f = o => ({ get: k => o[k] ?? null });
  let r = docFormDongNhan(f({ mh: BIA, so_thung: '2', so_goi: '5', hsd_cai: '2027-04-30', so_kg: '12,5', hsd: '2026-01-01' }), [], mon);
  ok('Bia: 2 thùng + 5 lon = 53 lon, kg gõ (12,5) bỏ qua, hạn = ô hạn in trên sản phẩm',
    r.loi.length === 0 && r.luu?.so_goi === 53 && r.luu.so_kg === 53 && r.luu.han_dung === '2027-04-30', r.loi.join());
  r = docFormDongNhan(f({ mh: BIA, so_thung: '2', so_goi: '' }), [], mon);
  ok('Bia thiếu hạn dùng → "Ghi hạn dùng in trên Bia Tiger lon" (vi / en)',
    r.luu === null && /Ghi hạn dùng in trên Bia Tiger lon/.test(r.loi.join()) && /use-by date printed on/.test(r.loiEn.join()));
  r = docFormDongNhan(f({ mh: BIA, so_thung: '', so_goi: '', hsd_cai: '2027-04-30' }), [], mon);
  ok('Bia không số thùng, không số lẻ → "Nhập số thùng hoặc số lon lẻ"', /Nhập số thùng hoặc số lon lẻ/.test(r.loi.join()));
  r = docFormDongNhan(f({ mh: BIA, so_thung: '1,5', so_goi: '2', hsd_cai: '2027-04-30' }), [], mon);
  ok('Số thùng lẻ (1,5) → báo số nguyên', r.luu === null && /Số thùng là số nguyên/.test(r.loi.join()));
  r = docFormDongNhan(f({ mh: BIA, so_goi: '3', hsd_cai: '2027-02-31' }), [], mon);
  ok('Hạn 31/02 → "không phải ngày có thật"', /không phải ngày có thật/.test(r.loi.join()));
  r = docFormDongNhan(f({ mh: MUOI, so_thung: '9', so_goi: '10', hsd_cai: '2027-01-01' }), [], mon);
  ok('Muối không quy đổi thùng: ô thùng ẩn bỏ qua, 10 gói', r.luu?.so_goi === 10, r.loi.join());
  r = docFormDongNhan(f({ mh_khac: BIA, mh: THIT, so_goi: '24', hsd_cai: '2027-01-01' }), [], mon);
  ok('Ô "món khác" thắng thẻ món: chọn bia ở ô khác → đọc theo bia', r.luu?.so_goi === 24, r.loi.join());
  r = docFormDongNhan(f({ mh: THIT, so_kg: '12,5', so_goi: '2', hsd_cai: '2027-01-01' }), [], mon);
  ok('Thịt: vẫn đọc kg (12,5), hạn ô thịt (trống → mặc định), không lấy hạn của ô sốt',
    r.luu?.so_kg === 12.5 && r.luu.han_dung === null, r.loi.join());

  const vf = dongNhanVaoForm({ mat_hang_id: BIA, so_goi: 53, so_kg: 53 }, mon.get(BIA));
  ok('Sửa dòng 53 lon: form tách lại 2 thùng + 5 lon, ô kg trống', vf.so_thung === '2' && vf.so_goi === '5' && vf.so_kg === '');
  const vf2 = dongNhanVaoForm({ mat_hang_id: MUOI, so_goi: 10, so_kg: 10 }, mon.get(MUOI));
  ok('Sửa dòng muối (không thùng): 10 gói, không ô thùng', vf2.so_thung === '' && vf2.so_goi === '10');

  ok('soCaiChu: "2 thùng + 5 lon (53 lon)" · "2 thùng (48 lon)" · "10 lon" · tiếng Anh "2 cases + 5 lon (53 lon)"',
    soCaiChu(53, 'lon', 24) === '2 thùng + 5 lon (53 lon)' && soCaiChu(48, 'lon', 24) === '2 thùng (48 lon)'
    && soCaiChu(10, 'lon', 24) === '10 lon' && soCaiChu(10, 'gói') === '10 gói' && soCaiChu(53, 'lon', 24, 'en') === '2 cases + 5 lon (53 lon)'
    && soCaiChu(1200, 'lon', 24) === '50 thùng (1.200 lon)');

  // Điền giá
  const dong = [{ id: 'd1', so_trong_thung: 24 }, { id: 'd2', so_trong_thung: null }, { id: 'd3' }];
  const fd = new FormData();
  fd.set('gia_d1', '380.000'); fd.set('gia_d2', '7.000'); fd.set('gia_d3', '480.000');
  const g = docFormDienGia(fd, dong, 'mua', new Map([['d2', 'gói']]));
  ok('Điền giá: dòng thùng gửi don_gia_thung, dòng khác don_gia_kg ("380.000" = 380 nghìn)',
    JSON.stringify(g.payload) === JSON.stringify([{ dong_id: 'd1', don_gia_thung: 380000 }, { dong_id: 'd2', don_gia_kg: 7000 }, { dong_id: 'd3', don_gia_kg: 480000 }]));
  const fd2 = new FormData(); fd2.set('gia_d1', 'ba trăm'); fd2.set('gia_d2', 'x'); fd2.set('gia_d3', '1');
  const g2 = docFormDienGia(fd2, dong, 'mua', new Map([['d2', 'gói']]));
  ok('Điền giá sai chữ: câu nói đúng "một thùng" / "một gói" (vi / en)',
    /giá là số đồng một thùng/.test(g2.loi[0]) && /một gói/.test(g2.loi[1]) && /per case/.test(g2.loiEn[0]));
  const pf = dienGiaTuPhieu({ so_hoa_don: null, ngay_hoa_don: null, han_thanh_toan: null, tien_thue: 0, chi_phi_khac: 0 },
    [{ id: 'a', so_trong_thung: 24, don_gia_thung: 380000, don_gia_kg: 15833 }, { id: 'b', so_trong_thung: 24, don_gia_thung: null, don_gia_kg: 16000 },
     { id: 'c', so_trong_thung: null, don_gia_kg: 7000 }]);
  ok('Mở form điền giá: dòng thùng hiện giá thùng; dòng thùng chỉ có giá một lon → nhân 24 (lưu lại không đổi tiền)',
    pf.gia.a === '380.000' && pf.gia.b === '384.000' && pf.gia.c === '7.000', JSON.stringify(pf.gia));
  ok('thanhTienDong: 53 lon × 380.000 / 24 = 839.167; 10 gói × 7.000 = 70.000; chưa có giá → null',
    thanhTienDong({ so_kg: 53, so_trong_thung: 24 }, 380000) === 839167 && thanhTienDong({ so_kg: 10 }, 7000) === 70000
    && thanhTienDong({ so_kg: 10 }, null) === null);
  const gv = xemTruocGiaVon([{ so_kg: 10, thanh_tien: 5000000 }, { so_kg: 24, thanh_tien: 380000, cai: true }], 53800, 0,
    { chi_phi_vao_gia_von: true, vat_vao_gia_von: false });
  ok('Xem trước giá vốn: phiếu có bia chia chi phí theo tiền (50.000 / 3.800) — khớp hàm duyệt',
    gv[0].gia_tri === 5050000 && gv[1].gia_tri === 383800, JSON.stringify(gv));
  const gv2 = xemTruocGiaVon([{ so_kg: 10, thanh_tien: 5000000 }, { so_kg: 30, thanh_tien: 9000000 }], 40000, 0,
    { chi_phi_vao_gia_von: true, vat_vao_gia_von: false });
  ok('Xem trước giá vốn: chỉ thịt chia theo kg như cũ', gv2[0].gia_tri === 5010000 && gv2[1].gia_tri === 9030000);
  ok('Chip "Lần trước" của dòng thùng nhân số cái một thùng', chuSoSanhGia({ gia_truoc: 15833, chenh_pt: 0, vuot_nguong: false }, 'vi', 24)?.chu === 'Lần trước 379.992 đ · 0,0%');

  const nh = doc('web/src/pages/noi-bo/kho/nhan-hang/[id].astro');
  ok('Form nhận hàng: ô số thùng, ô hạn dùng in trên sản phẩm, ô "món khác" có món đếm theo cái',
    /name="so_thung"/.test(nh) && /name="hsd_cai"/.test(nh) && /<ChonMatHang name="mh_khac"[^>]*demCai/.test(nh)
    && /cai: m\.dem_theo_cai, thung: m\.so_trong_thung/.test(nh));
  ok('Form nhận hàng: CSS :has() giấu ô kg khi chọn món đếm theo cái, hiện ô thùng khi có quy đổi',
    nh.includes('.nh-them:has(:is(input, option)[data-cai]:checked) .nh-chi-thit')
    && nh.includes('.nh-them:not(:has(:is(input, option)[data-thung]:checked)) .nh-chi-thung'));
  const chon = doc('web/src/components/kho/ChonMatHang.astro');
  ok('ChonMatHang: món đếm theo cái chỉ hiện khi bật demCai; lựa chọn mang data-cai / data-thung',
    /demCai \? \['tang', 'phan_cat', 'phu_pham', 'gia_vi', 'do_uong'\] : \['tang', 'phan_cat', 'phu_pham'\]/.test(chon)
    && /data-cai=/.test(chon) && /data-thung=/.test(chon));
  for (const tr of ['pha-loc/[id].astro', 'cai-dat/cong-thuc.astro', 'quay/yeu-cau/index.astro', 'dat-hang/moi.astro', 'dat-hang/[id].astro']) {
    ok(`Màn ${tr}: không bật demCai (pha lóc, công thức, quầy, đặt hàng không có sốt / đồ uống ở đợt 1)`,
      !/demCai/.test(doc(`web/src/pages/noi-bo/kho/${tr}`)));
  }
  const np = doc('web/src/pages/noi-bo/kho/nhap/[id].astro');
  ok('Phiếu nhập: phiếu có dòng đếm theo cái không mở lưới soạn, có link sửa ở màn Nhận hàng',
    /const coTheSoan = k\.duoc\('nhap'\) && \(moi \|\| conNhap\) && !coDongCai;/.test(np) && /t\.suaDongNhanHang/.test(np));
});

// ===========================================================================
await nhom('9 · XUẤT BẾP, KIỂM KÊ, TRẢ HÀNG — HÀM THUẦN VÀ MÃ NGUỒN', async () => {
  const BIA = '00000000-0000-4000-8000-0000000000b1';
  const MUOI = '00000000-0000-4000-8000-0000000000b2';
  const THIT = '00000000-0000-4000-8000-0000000000b3';
  const LO1 = '00000000-0000-4000-8000-0000000000c1';
  const LO2 = '00000000-0000-4000-8000-0000000000c2';
  const mh = [
    { id: BIA, ten: 'Bia Tiger lon', dem_goi: true, don_vi_goi: 'lon', dem_theo_cai: true, so_trong_thung: 24 },
    { id: MUOI, ten: 'Muối', dem_goi: true, don_vi_goi: 'gói', dem_theo_cai: true, so_trong_thung: null },
    { id: THIT, ten: 'Thăn ngoại', dem_goi: true, don_vi_goi: 'gói', dem_theo_cai: false },
  ];
  const f = o => ({ get: k => o[k] ?? null });

  // Xuất bếp: món đếm theo cái chỉ gửi số cái; kg gõ nhầm (ô ẩn) bỏ qua.
  let x = docFormPhieuXuat(f({ so_dong: '2', d0_mat_hang: BIA, d0_so_goi: '6', d0_so_kg: '9,9', d1_mat_hang: THIT, d1_so_goi: '2', d1_so_kg: '1,5' }), mh);
  ok('Xuất bếp: 6 lon → chỉ so_goi (kg ô ẩn bỏ qua); thịt vẫn gửi cả kg',
    x.loi.length === 0 && JSON.stringify(x.payload) === JSON.stringify([{ mat_hang_id: BIA, so_goi: 6 }, { mat_hang_id: THIT, so_goi: 2, so_kg: 1.5 }]),
    JSON.stringify(x));
  x = docFormPhieuXuat(f({ so_dong: '1', d0_mat_hang: BIA, d0_so_goi: '', d0_so_kg: '2' }), mh);
  ok('Xuất bếp: món đếm theo cái chưa ghi số lon → báo "chưa nhập số lon"',
    x.payload.length === 0 && /chưa nhập số lon/.test(x.loi.join()) && /number of lon not entered/.test(x.loiEn.join()), x.loi.join());
  x = docFormPhieuXuat(f({ so_dong: '0', so_lo: '1', l0_lo: LO1, l0_mat_hang: BIA, l0_so_goi: '3', l0_so_kg: '' }), mh);
  ok('Xuất bếp theo lô: 3 lon của lô → { lo_id, so_goi: 3 }',
    x.loi.length === 0 && JSON.stringify(x.payload) === JSON.stringify([{ mat_hang_id: BIA, lo_id: LO1, so_goi: 3 }]), JSON.stringify(x));

  // Kiểm kê: thùng × số cái một thùng + số lẻ.
  let kk = payloadTuDong([{ mat_hang_id: BIA, lo_id: '', goi: '5', kg: '1,5', het: false, thung: '2' }], mh);
  ok('Kiểm kê: 2 thùng + 5 lon = 53 lon, kg gõ (1,5) bỏ qua',
    kk.loi.length === 0 && kk.payload[0].so_goi_dem === 53 && !('so_kg_dem' in kk.payload[0]), JSON.stringify(kk));
  kk = payloadTuDong([{ mat_hang_id: BIA, lo_id: '', goi: '', kg: '', het: false, thung: '3' }], mh);
  ok('Kiểm kê: chỉ ghi 3 thùng (ô lẻ trống) = 72 lon', kk.payload[0].so_goi_dem === 72, JSON.stringify(kk.payload));
  kk = payloadTuDong([{ mat_hang_id: MUOI, lo_id: '', goi: '11', kg: '', het: false, thung: '2' }], mh);
  ok('Kiểm kê: món không có quy đổi thùng — ô thùng (không có trên form) bỏ qua', kk.payload[0].so_goi_dem === 11, JSON.stringify(kk.payload));
  kk = payloadTuDong([{ mat_hang_id: BIA, lo_id: '', goi: '', kg: '', het: false, thung: '1,5' }], mh);
  ok('Kiểm kê: số thùng không nguyên → báo', /số thùng là số nguyên/.test(kk.loi.join()) && /number of cases/.test(kk.loiEn.join()), kk.loi.join());
  kk = payloadTuDong([{ mat_hang_id: BIA, lo_id: '', goi: '2,5', kg: '', het: false }], mh);
  ok('Kiểm kê: số lon không nguyên → câu nói "số lon"', /số lon là số nguyên/.test(kk.loi.join()) && /number of lon/.test(kk.loiEn.join()), kk.loi.join());
  kk = payloadTuDong([{ mat_hang_id: BIA, lo_id: '', goi: '', kg: '', het: true }], mh);
  ok('Kiểm kê: tích "Đã hết thật" ô trống → 0 lon', kk.loi.length === 0 && kk.payload[0].so_goi_dem === 0, JSON.stringify(kk.payload));
  const fk = docFormKiemKe(f({ so_dong: '1', k0_mh: BIA, k0_lo: '', k0_goi: '1', k0_kg: '', k0_thung: '1' }), mh);
  ok('docFormKiemKe đọc ô k{i}_thung: 1 thùng + 1 lon = 25', fk.loi.length === 0 && fk.payload[0].so_goi_dem === 25, JSON.stringify(fk));
  ok('Chữ ký dòng: dòng không thùng giữ chữ ký cũ; ghi thêm thùng là dòng đã sửa',
    chuKyDong({ goi: '5', kg: '', het: false }) === '5||0' && chuKyDong({ goi: '5', kg: '', het: false, thung: '2' }) === '5||0|t2');
  ok('Dòng chỉ ghi thùng là đã đếm', daDemDong({ goi: '', kg: '', het: false, thung: '2' }, true)
    && !daDemDong({ goi: '', kg: '', het: false, thung: '' }, true));

  // Trả hàng nhà cung cấp: lô đếm theo cái (t{i}_cai = 1) gửi so_kg = so_goi = số cái.
  let tr = docDongTraHang(f({ so_dong: '2', t0_lo: LO1, t0_cai: '1', t0_goi: '24', t0_kg: '99', t1_lo: LO2, t1_kg: '4,5', t1_goi: '1' }));
  ok('Trả hàng: 24 lon → { so_kg: 24, so_goi: 24 } (kg gõ nhầm bỏ qua); dòng thịt như cũ',
    tr.loi.length === 0 && JSON.stringify(tr.dong) === JSON.stringify([{ lo_id: LO1, so_kg: 24, so_goi: 24 }, { lo_id: LO2, so_kg: 4.5, so_goi: 1 }]),
    JSON.stringify(tr));
  tr = docDongTraHang(f({ so_dong: '1', t0_lo: LO1, t0_cai: '1', t0_goi: '', t0_kg: '3' }));
  ok('Trả hàng: lô đếm theo cái chỉ ghi kg → báo ghi số chai / lon', tr.dong.length === 0 && /ghi số chai \/ lon \/ hộp trả/.test(tr.loi.join())
    && /bottles \/ cans \/ boxes/.test(tr.loiEn.join()), tr.loi.join());
  tr = docDongTraHang(f({ so_dong: '1', t0_lo: LO1, t0_cai: '1', t0_goi: '2,5' }));
  ok('Trả hàng: số lon không nguyên → báo', tr.dong.length === 0 && tr.loi.length === 1, tr.loi.join());
  tr = docDongTraHang(f({ so_dong: '1', t0_lo: LO1, t0_cai: '1', t0_goi: '0' }));
  ok('Trả hàng: 0 lon → báo (không gửi dòng rỗng)', tr.dong.length === 0 && tr.loi.length === 1, tr.loi.join());

  const th = doc('web/src/pages/noi-bo/kho/cong-no/tra-hang.astro');
  ok('Màn trả hàng: lô đếm theo cái có ô ẩn t{i}_cai, không ô kg; đơn giá theo cái',
    /name=\{`t\$\{i\}_cai`\} value="1"/.test(th) && /name="t0_cai" value="1"/.test(th) && /t\.muaGiaCai\(/.test(th) && /laDemCai\(\{ loai: x\.loai_hang \}\)/.test(th));
  const tx = doc('web/src/pages/noi-bo/kho/xuat/[id].astro');
  ok('Màn phiếu xuất: chọn được món đếm theo cái (trừ phiếu mang ra quầy), CSS giấu ô kg khi chọn món đó',
    /<ChonMatHang name=\{`d\$\{i\}_mat_hang`\}.* demCai=\{loai !== 'chuyen'\} \/>/.test(tx) && /:has\(option\[data-cai\]:checked\)/.test(tx));
  const loBiaTon = { loai_vi_tri: 'kho', so_kg: 24, so_goi: 24, tinh_trang_han: 'con_han', vi_tri_id: LO2, lo_id: LO1, loai_hang: 'do_uong' };
  ok('Tồn kho: lô đồ uống ở kho không có "Lấy ra quầy" (để một chỗ), vẫn có xuất bếp / báo hủy; lô thịt vẫn có',
    JSON.stringify(viecVoiLo(loBiaTon).map(v => v.ma)) === '["xuat_bep","huy"]'
    && viecVoiLo({ ...loBiaTon, loai_hang: 'phan_cat' })[0].ma === 'chuyen');
  const sn = doc('web/src/pages/noi-bo/kho/cai-dat/mat-hang/sua-nhanh.astro');
  ok('Sửa nhanh: sốt, đồ uống chỉ có ô Tình trạng; có lọc hai loại mới',
    /laDemCai\(m\) \? khoa === 'dang_dung'/.test(sn) && /\['gia_vi', t\.giaVi\], \['do_uong', t\.doUong\]/.test(sn));
  const tkh = doc('web/src/pages/noi-bo/kho/the-kho/[mat_hang_id].astro');
  ok('Thẻ kho: món đếm theo cái không có cột kg', /const coKg = !laDemCai\(mh\);/.test(tkh) && /\{coKg && <th class="so">\{t\.cotKg\}<\/th>\}/.test(tkh));
  const tk = doc('web/src/pages/noi-bo/kho/kiem-ke/[id].astro');
  ok('Màn kiểm kê: ô số thùng k{i}_thung khi món có quy đổi; "thêm mặt hàng" có món đếm theo cái',
    /name=\{`k\$\{i\}_thung`\}/.test(tk) && /<ChonMatHang name="them_mat_hang"[^>]*demCai/.test(tk));
});

const ds = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
ok('kho_doi_soat_ton() rỗng', ds.length === 0, JSON.stringify(ds));

process.exit(ketThuc('MÓN ĐẾM THEO CÁI'));
