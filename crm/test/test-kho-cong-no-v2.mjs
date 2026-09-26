/**
 * BEEFTOWN KHO — Kiểm thử công nợ v2 (0040, GĐ8b)
 * ================================================
 *
 *     node test/test-kho-cong-no-v2.mjs
 *
 * Những điều phải đúng tuyệt đối:
 *   · NCC hoàn tiền làm TĂNG còn nợ về 0, không bao giờ vượt 0; bù trừ làm
 *     giảm còn nợ như trả tiền; "đã trả" của view = trả + bù trừ − hoàn tiền;
 *   · hóa đơn gộp chia tổng tiền và tiền thuế vào từng phiếu KHỚP TỪNG ĐỒNG;
 *     lệch tổng phiếu phải có lý do; bỏ đối chiếu trả phiếu về như cũ, chỉ khi
 *     chưa có khoản tiền nào; phiếu trong hóa đơn gộp không hủy / sửa lẻ được;
 *   · trả hàng hai bước: thủ kho ghi kg (không thấy tiền), kế toán xác nhận
 *     tiền → giảm trừ đúng như công thức 0024;
 *   · công nợ theo kỳ: đầu kỳ + tăng − giảm = cuối kỳ = tổng còn nợ của view;
 *   · dữ liệu MISA đủ cột, tiền thuế chia khớp, cờ thiếu mã, TK từ cài đặt;
 *   · đổi số tài khoản NCC → nhật ký + cảnh báo cho chủ;
 *   · thủ kho / NV quầy không đọc được gì có tiền; cuối cùng tồn khớp sổ kho.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ CÔNG NỢ V2 (0040)');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const n = v => (v === null || v === undefined ? v : Number(v));

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

const MH = {};
let viTri = {};
let nccUc, nccMy, nccNhat;

async function nhapHang({ ncc, ngayNhap = homNay, thue = 0, chiPhi = 0, dong }) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => $6, p_chi_phi_khac => $7, p_ghi_chu => null,
      p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $8::jsonb)`,
    [cnA.id, maGui(), ncc, viTri.kho, ngayNhap, thue, chiPhi, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const d = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (d.loi) throw new Error(d.loi);
  const { rows: lo } = await db.query(`
    select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id]);
  const { rows: [pn] } = await db.query(`select * from kho_phieu_nhap where id = $1`, [p.phieu_id]);
  return { id: p.phieu_id, so: pn.so_phieu, lo };
}

const congNo = async id => (await db.query(`select * from kho_v_cong_no_phieu where id = $1`, [id])).rows[0];
const congNoNcc = async (ncc, cn = cnA.id) => (await db.query(
  `select * from kho_v_cong_no_ncc where chi_nhanh_id = $1 and nha_cung_cap_id = $2`, [cn, ncc])).rows[0];

function ghiV2(uid, t) {
  return duoi(uid, `
    select * from kho_ghi_thanh_toan_v2(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_nha_cung_cap_id => $3, p_loai => $4, p_hinh_thuc => $5,
      p_so_tien => $6, p_ngay => $7::date, p_ghi_chu => $8, p_anh => $9::text[], p_phan_bo => $10::jsonb)`,
    [cnA.id, t.maGui ?? maGui(), t.ncc, t.loai ?? 'thanh_toan',
     t.hinhThuc === undefined ? (['thanh_toan', 'hoan_tien'].includes(t.loai ?? 'thanh_toan') ? 'chuyen_khoan' : null) : t.hinhThuc,
     t.soTien, t.ngay ?? homNay, t.ghiChu ?? null, t.anh ?? [], JSON.stringify(t.phanBo ?? [])]);
}

function gop(uid, t) {
  return duoi(uid, `
    select * from kho_doi_chieu_hoa_don_gop(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_ncc => $3, p_so_hoa_don => $4, p_ngay => $5::date,
      p_tong_tien => $6, p_tien_thue => $7, p_phieu => $8::uuid[], p_ly_do_lech => $9)`,
    [t.cn ?? cnA.id, t.maGui ?? maGui(), t.ncc, t.so, t.ngay ?? homNay, t.tong, t.thue ?? 0, t.phieu, t.lyDo ?? null]);
}

const boGop = (uid, id, lyDo) => duoi(uid, `select kho_bo_doi_chieu_gop($1, $2) as cau`, [id, lyDo]);

function ghiKg(uid, t) {
  return duoi(uid, `
    select * from kho_tra_hang_ghi_kg(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_phieu_nhap_id => $3, p_vi_tri_id => $4,
      p_ghi_chu => $5, p_anh => $6::text[], p_dong => $7::jsonb)`,
    [cnA.id, t.maGui ?? maGui(), t.phieu ?? null, t.viTri ?? viTri.kho, t.ghiChu ?? null, t.anh ?? [], JSON.stringify(t.dong)]);
}

const xacNhan = (uid, id, soTien = null, ghiChu = null) =>
  duoi(uid, `select * from kho_xac_nhan_tien_tra_hang($1, $2, $3)`, [id, soTien, ghiChu]);

const theoKy = (uid, ncc, tu, den, cn = cnA.id) =>
  duoi(uid, `select * from kho_cong_no_theo_ky($1, $2, $3::date, $4::date)`, [cn, ncc, tu, den]);

const misa = (uid, tu, den, loai) =>
  duoi(uid, `select * from kho_du_lieu_misa($1, $2::date, $3::date, $4)`, [cnA.id, tu, den, loai]);

const thongBao = async uid => (await duoi(uid, `select kho_thong_bao($1, 300) as v`, [cnA.id])).rows?.[0]?.v?.su_kien ?? [];
const demViec = async uid => (await duoi(uid, `select kho_dem_viec($1) as v`, [cnA.id])).rows?.[0]?.v ?? {};

let P1, P2, P3, P4, PM;

// ===========================================================================
await nhom('1 · CHUẨN BỊ: BA NCC, PHIẾU MUA LẺ TIỀN, CỘT MỚI', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));

  const them = async (ten, noNgay, kieu = 'tung_lan') => (await duoi(UID.keToanA,
    `insert into kho_nha_cung_cap (ten, so_ngay_no, kieu_hoa_don) values ($1, $2, $3) returning id`, [ten, noNgay, kieu])).rows?.[0]?.id;
  nccUc = await them('NCC Úc', 30, 'gop');
  nccMy = await them('NCC Mỹ', 7);
  nccNhat = await them('NCC Nhật', 15);
  ok('Kế toán thêm NCC có kiểu hóa đơn (gộp / từng lần)', nccUc && nccMy && nccNhat);
  const sai = await duoi(UID.keToanA, `update kho_nha_cung_cap set kieu_hoa_don = 'thang' where id = $1`, [nccMy]);
  ok('Kiểu hóa đơn lạ bị từ chối', sai.loi !== null);
  const cd = (await db.query(`select misa_tk from kho_cai_dat where chi_nhanh_id = $1`, [cnA.id])).rows[0].misa_tk;
  ok('Cài đặt có mã tài khoản MISA mặc định 331 / 1561 / 1331 / 1111 / 1121',
     cd.tk_co_ncc === '331' && cd.tk_no_hang === '1561' && cd.tk_thue === '1331' && cd.tk_tien_mat === '1111' && cd.tk_ngan_hang === '1121',
     JSON.stringify(cd));

  // Ba phiếu Úc lẻ tiền: 3,333 × 300.001 = 999.903; 1,1 × 777.777 = 855.555; 2,5 × 123.457 = 308.643
  P1 = await nhapHang({ ncc: nccUc, ngayNhap: await ngay(-20),
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 3.333, don_gia_kg: 300001 }] });
  P2 = await nhapHang({ ncc: nccUc, ngayNhap: await ngay(-15),
    dong: [{ mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 1.1, don_gia_kg: 777777 }] });
  P3 = await nhapHang({ ncc: nccUc, ngayNhap: await ngay(-10),
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 2.5, don_gia_kg: 123457 }] });
  // Phiếu Úc thứ tư, có thuế — cho trả hàng hai bước.
  P4 = await nhapHang({ ncc: nccUc, ngayNhap: await ngay(-2), thue: 400000,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 2, so_kg: 10, don_gia_kg: 500000 }] });
  // Phiếu Mỹ có chi phí khác — cho MISA.
  PM = await nhapHang({ ncc: nccMy, ngayNhap: await ngay(-3), thue: 105001, chiPhi: 50000,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 1.5, don_gia_kg: 600000 },
           { mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 1.3, don_gia_kg: 700001 }] });
  const tong = [n((await congNo(P1.id)).tong_tien_phieu), n((await congNo(P2.id)).tong_tien_phieu), n((await congNo(P3.id)).tong_tien_phieu)];
  ok('Ba phiếu lẻ tiền: 999.903 + 855.555 + 308.643', tong.join() === '999903,855555,308643', tong.join());
  const c = await congNo(P1.id);
  ok('View công nợ có cột mới ở cuối (loai, tien_tra, bu_tru, hoan_tien, hoa_don_gop_id)',
     c.loai === 'mua' && n(c.tien_tra) === 0 && n(c.bu_tru) === 0 && n(c.hoan_tien) === 0 && c.hoa_don_gop_id === null);
});

// ===========================================================================
let HD;
await nhom('2 · HÓA ĐƠN GỘP: CHIA KHỚP TỪNG ĐỒNG, LỆCH CẦN LÝ DO', async () => {
  const ba = [P1.id, P2.id, P3.id];
  const tk = await gop(UID.thuKhoA, { ncc: nccUc, so: 'HD-G1', tong: 2164100, phieu: ba });
  ok('Thủ kho KHÔNG đối chiếu được hóa đơn gộp', tk.loi !== null);
  const mot = await gop(UID.keToanA, { ncc: nccUc, so: 'HD-G1', tong: 999903, phieu: [P1.id] });
  ok('Một phiếu → dùng đối chiếu thường', mot.loi !== null && /từ 2 phiếu/.test(mot.loi), mot.loi ?? '');
  const trung = await gop(UID.keToanA, { ncc: nccUc, so: 'HD-G1', tong: 2164101, phieu: [P1.id, P1.id] });
  ok('Chọn một phiếu hai lần bị chặn', trung.loi !== null && /hai lần/.test(trung.loi));
  const khacNcc = await gop(UID.keToanA, { ncc: nccUc, so: 'HD-G1', tong: 1, phieu: [P1.id, PM.id], lyDo: 'x' });
  ok('Phiếu của NCC khác bị chặn', khacNcc.loi !== null && /nhà cung cấp này/.test(khacNcc.loi), khacNcc.loi ?? '');
  const lech = await gop(UID.keToanA, { ncc: nccUc, so: 'HD-G1', tong: 2164100, thue: 160000, phieu: ba });
  ok('Lệch 1 đồng không có lý do → bị chặn, nêu số lệch', lech.loi !== null && /−1 đ/.test(lech.loi) && /lý do/.test(lech.loi), lech.loi ?? '');
  const thueVuot = await gop(UID.keToanA, { ncc: nccUc, so: 'HD-G1', tong: 100, thue: 200, phieu: ba, lyDo: 'x' });
  ok('Tiền thuế lớn hơn tổng hóa đơn bị chặn', thueVuot.loi !== null);

  const g = maGui();
  const r = await gop(UID.keToanA, { maGui: g, ncc: nccUc, so: 'HD-G1', ngay: await ngay(-1), tong: 2164100, thue: 160000,
    phieu: ba, lyDo: 'NCC làm tròn xuống' });
  ok('Kế toán đối chiếu hóa đơn gộp (có lý do lệch)', r.loi === null && n(r.rows[0].lech) === -1 && n(r.rows[0].tong_phieu) === 2164101,
     r.loi ?? JSON.stringify(r.rows));
  HD = r.rows?.[0]?.hoa_don_id;
  const lai = await gop(UID.keToanA, { maGui: g, ncc: nccUc, so: 'HD-G1', tong: 2164100, thue: 160000, phieu: ba, lyDo: 'x' });
  ok('Bấm lại cùng ma_gui → cùng hóa đơn, da_co', lai.rows?.[0]?.hoa_don_id === HD && lai.rows[0].da_co);

  const cs = await Promise.all(ba.map(congNo));
  const sum = cs.reduce((s, c) => s + n(c.phai_tra), 0);
  ok('Tổng phải trả của 3 phiếu = tổng hóa đơn, đúng từng đồng', sum === 2164100, `${sum}`);
  ok('Mỗi phiếu: đã đối chiếu, số HĐ, hóa đơn gộp', cs.every(c => c.da_doi_chieu && c.so_hoa_don === 'HD-G1' && c.hoa_don_gop_id === HD));
  ok('Chia theo tỉ lệ: mỗi phần lệch tỉ lệ đúng dưới 1 đồng',
     cs.every(c => Math.abs(n(c.phai_tra) - n(c.tong_tien_phieu) * 2164100 / 2164101) < 1), cs.map(c => c.phai_tra).join());
  const { rows: hp } = await db.query(`select * from kho_hoa_don_phieu where hoa_don_id = $1 order by thu_tu`, [HD]);
  ok('Tiền thuế chia vào từng phiếu, tổng = 160.000', hp.length === 3 && hp.reduce((s, x) => s + n(x.tien_thue), 0) === 160000,
     hp.map(x => x.tien_thue).join());
  const han = (await db.query(`select bool_and(han_thanh_toan = $1::date - 1 + 30) as d from kho_phieu_nhap where id = any($2::uuid[])`,
    [homNay, ba])).rows[0].d;
  ok('Hạn trả = ngày hóa đơn (hôm qua) + 30 ngày nợ của NCC', han === true);
  const v = await congNoNcc(nccUc);
  ok('View NCC: 3 phiếu có hóa đơn gộp', v.so_phieu_hoa_don_gop === 3, JSON.stringify(v));

  const lap = await gop(UID.keToanA, { ncc: nccUc, so: 'HD-G2', tong: 855555 + 5000000, phieu: [P2.id, P4.id], lyDo: 'x' });
  ok('Phiếu đã trong hóa đơn gộp không gộp lần nữa', lap.loi !== null && /HD-G1/.test(lap.loi), lap.loi ?? '');
  const trungSo = await gop(UID.keToanA, { ncc: nccUc, so: 'hd-g1', tong: 1, phieu: [P4.id, P4.id], lyDo: 'x' });
  ok('Số hóa đơn trùng (không phân biệt hoa thường) bị chặn', trungSo.loi !== null);
  const le = await duoi(UID.keToanA, `select kho_doi_chieu_hoa_don($1, 'HD-LE', null, 1000, null, null)`, [P1.id]);
  ok('Đối chiếu lẻ phiếu nằm trong hóa đơn gộp bị chặn', le.loi !== null && /hóa đơn gộp/.test(le.loi), le.loi ?? '');
  const huy = await duoi(UID.qlA, `select kho_huy_phieu_nhap($1, 'Thử hủy')`, [P2.id]);
  ok('Hủy phiếu nằm trong hóa đơn gộp bị chặn', huy.loi !== null && /hóa đơn gộp/.test(huy.loi), huy.loi ?? '');

  // Bỏ đối chiếu (chưa trả tiền) → phiếu về như cũ.
  const khongLyDo = await boGop(UID.keToanA, HD, ' ');
  ok('Bỏ đối chiếu phải có lý do', khongLyDo.loi !== null);
  const tkBo = await boGop(UID.thuKhoA, HD, 'x');
  ok('Thủ kho KHÔNG bỏ được', tkBo.loi !== null);
  const bo = await boGop(UID.keToanA, HD, 'Ghi nhầm số hóa đơn');
  ok('Kế toán bỏ đối chiếu khi chưa trả tiền', bo.loi === null && /3 phiếu/.test(bo.rows?.[0]?.cau ?? ''), bo.loi ?? bo.rows?.[0]?.cau);
  const cs2 = await Promise.all(ba.map(congNo));
  ok('Phiếu trở về chưa đối chiếu, phải trả = tổng phiếu, không còn hóa đơn gộp',
     cs2.every(c => !c.da_doi_chieu && c.tien_hoa_don === null && n(c.phai_tra) === n(c.tong_tien_phieu) && c.hoa_don_gop_id === null && c.so_hoa_don === null),
     JSON.stringify(cs2.map(c => [c.da_doi_chieu, c.tien_hoa_don, c.so_hoa_don])));
  const h = (await db.query(`select * from kho_hoa_don_ncc where id = $1`, [HD])).rows[0];
  ok('Hóa đơn giữ lại (da_bo) với danh sách phiếu cũ', h.trang_thai === 'da_bo' && h.ds_phieu_da_bo.length === 3);

  // Đối chiếu lại (số cũ dùng lại được vì đã bỏ), trả tiền, rồi bỏ → bị chặn.
  const r2 = await gop(UID.keToanA, { ncc: nccUc, so: 'HD-G1', tong: 2164101, thue: 160000, phieu: ba });
  ok('Đối chiếu lại, tổng khớp → không cần lý do', r2.loi === null && n(r2.rows[0].lech) === 0, r2.loi ?? '');
  HD = r2.rows?.[0]?.hoa_don_id;
  const tt = await ghiV2(UID.keToanA, { ncc: nccUc, soTien: 100000, phanBo: [{ phieu_nhap_id: P3.id, so_tien: 100000 }] });
  ok('Trả 100.000 đ cho phiếu P3', tt.loi === null, tt.loi ?? '');
  const bo2 = await boGop(UID.keToanA, HD, 'Thử');
  ok('Đã có khoản trả tiền → không bỏ đối chiếu được', bo2.loi !== null && /hủy các khoản đó trước/.test(bo2.loi), bo2.loi ?? '');
  await duoi(UID.keToanA, `select kho_huy_thanh_toan($1, 'Thử xong')`, [tt.rows?.[0]?.thanh_toan_id]);
});

// ===========================================================================
let XT, XT2;
await nhom('3 · TRẢ HÀNG HAI BƯỚC: THỦ KHO GHI KG, KẾ TOÁN XÁC NHẬN TIỀN', async () => {
  const lo = P4.lo[0];
  const tonTruoc = n((await db.query(`select so_kg from kho_ton where lo_id = $1 and vi_tri_id = $2`, [lo.id, viTri.kho])).rows[0].so_kg);

  const nv = await ghiKg(UID.nvQuayA, { dong: [{ lo_id: lo.id, so_kg: 1 }] });
  ok('NV quầy KHÔNG ghi được trả hàng', nv.loi !== null);
  const laLo = await ghiKg(UID.thuKhoA, { phieu: P1.id, dong: [{ lo_id: lo.id, so_kg: 1 }] });
  ok('Lô không thuộc lần nhập đã chọn bị chặn', laLo.loi !== null && /lô không thuộc/.test(laLo.loi), laLo.loi ?? '');
  const vuot = await ghiKg(UID.thuKhoA, { dong: [{ lo_id: lo.id, so_kg: 99 }] });
  ok('Trả quá số kg đang có bị chặn', vuot.loi !== null && /chỉ còn/.test(vuot.loi));

  const g = maGui();
  const a = await ghiKg(UID.thuKhoA, { maGui: g, ghiChu: 'Thịt bị dập', dong: [{ lo_id: lo.id, so_kg: 2.4, so_goi: 0 }],
    anh: [`${cnA.id}/huy/${maGui()}/1.jpg`] });
  ok('Thủ kho ghi kg trả (không chọn phiếu, lấy theo lô) + ảnh', a.loi === null && /^XT-/.test(a.rows?.[0]?.so_phieu), a.loi ?? '');
  XT = a.rows?.[0]?.phieu_xuat_id;
  ok('Kết quả trả về cho thủ kho không có khóa tiền', a.rows && Object.keys(a.rows[0]).every(k => !/tien|gia/.test(k)));
  const lai = await ghiKg(UID.thuKhoA, { maGui: g, dong: [{ lo_id: lo.id, so_kg: 2.4 }] });
  ok('Bấm lại cùng ma_gui → cùng phiếu', lai.rows?.[0]?.phieu_xuat_id === XT && lai.rows[0].da_co);
  const px = (await db.query(`select * from kho_phieu_xuat where id = $1`, [XT])).rows[0];
  ok('Phiếu trả ở trạng thái chờ xác nhận tiền, gắn đúng phiếu nhập', px.trang_thai === 'cho_xac_nhan_tien' && px.phieu_nhap_id === P4.id && px.loai === 'tra_ncc');
  const tonSau = n((await db.query(`select so_kg from kho_ton where lo_id = $1 and vi_tri_id = $2`, [lo.id, viTri.kho])).rows[0].so_kg);
  ok('Hàng rời kho ngay: tồn giảm 2,4 kg', Math.abs(tonTruoc - tonSau - 2.4) < 1e-9, `${tonTruoc} → ${tonSau}`);
  const gt = (await db.query(`select count(*)::int as n from kho_thanh_toan where phieu_xuat_id = $1`, [XT])).rows[0].n;
  ok('Chưa có giảm trừ công nợ nào', gt === 0 && n((await congNo(P4.id)).giam_tru) === 0);

  ok('Số đỏ kế toán: tra_hang_cho_tien = 1', (await demViec(UID.keToanA)).tra_hang_cho_tien === 1);
  ok('Số đỏ thủ kho KHÔNG có tra_hang_cho_tien', !('tra_hang_cho_tien' in (await demViec(UID.thuKhoA))));
  const ev = (await thongBao(UID.keToanA)).find(e => e.khoa === 'tra_hang_cho_tien');
  ok('Thông báo kế toán: tra_hang_cho_tien (ma = số XT, ten = NCC, so = kg)',
     ev && ev.ref_id === XT && ev.ref2 === nccUc && ev.ten === 'NCC Úc' && n(ev.so) === 2.4, JSON.stringify(ev));
  ok('Thủ kho không nhận thông báo này', !(await thongBao(UID.thuKhoA)).some(e => e.khoa === 'tra_hang_cho_tien'));

  const tkDs = await duoi(UID.thuKhoA, `select * from kho_ds_tra_hang_cho_tien($1)`, [cnA.id]);
  ok('Thủ kho KHÔNG xem được hàng chờ có tiền', tkDs.loi !== null);
  const ds = await duoi(UID.keToanA, `select * from kho_ds_tra_hang_cho_tien($1)`, [cnA.id]);
  // 2,4 × 500.000 = 1.200.000; thuế 400.000 × 1.200.000 / 5.000.000 = 96.000
  ok('Kế toán thấy hàng chờ, tiền tự tính = 1.296.000 đ (kg × giá + phần thuế)',
     ds.rows?.length === 1 && n(ds.rows[0].so_tien_goi_y) === 1296000 && n(ds.rows[0].tong_kg) === 2.4 && ds.rows[0].so_phieu_nhap === P4.so,
     ds.loi ?? JSON.stringify(ds.rows));

  const tkXn = await xacNhan(UID.thuKhoA, XT);
  ok('Thủ kho KHÔNG xác nhận tiền được', tkXn.loi !== null);
  const am = await xacNhan(UID.keToanA, XT, -1);
  ok('Tiền âm bị chặn', am.loi !== null);
  const xn = await xacNhan(UID.keToanA, XT, null, 'Theo biên bản');
  ok('Kế toán xác nhận (để trống = tự tính)', xn.loi === null && n(xn.rows[0].so_tien_giam_tru) === 1296000, xn.loi ?? '');
  const xn2 = await xacNhan(UID.keToanA, XT, 5);
  ok('Bấm lại → trả kết quả cũ, không ghi thêm', xn2.rows?.[0]?.da_co && n(xn2.rows[0].so_tien_giam_tru) === 1296000);
  const c4 = await congNo(P4.id);
  ok('Công nợ P4 giảm trừ 1.296.000 đ', n(c4.giam_tru) === 1296000 && n(c4.con_no) === 5400000 - 1296000, JSON.stringify(c4));
  ok('Phiếu trả thành da_ghi, có người xác nhận',
     (await db.query(`select trang_thai, nguoi_xac_nhan from kho_phieu_xuat where id = $1`, [XT])).rows[0].trang_thai === 'da_ghi');
  const huyGt = await duoi(UID.keToanA, `select kho_huy_thanh_toan(id, 'x') from kho_thanh_toan where phieu_xuat_id = $1`, [XT]);
  ok('Giảm trừ do trả hàng không hủy riêng được (như 0024)', huyGt.loi !== null);
  ok('Số đỏ kế toán về 0', (await demViec(UID.keToanA)).tra_hang_cho_tien === 0);

  // Lần hai: NCC không trừ tiền (0 đ).
  const b = await ghiKg(UID.thuKhoA, { phieu: P4.id, dong: [{ lo_id: lo.id, so_kg: 0.5 }] });
  XT2 = b.rows?.[0]?.phieu_xuat_id;
  const xn3 = await xacNhan(UID.keToanA, XT2, 0);
  ok('Xác nhận 0 đ: không sinh giảm trừ, phiếu da_ghi',
     xn3.loi === null && n(xn3.rows[0].so_tien_giam_tru) === 0
     && (await db.query(`select count(*)::int as n from kho_thanh_toan where phieu_xuat_id = $1`, [XT2])).rows[0].n === 0, xn3.loi ?? '');

  // Hủy phiếu còn chờ xác nhận tiền (ghi nhầm kg): hàng về lại đúng lô, đúng chỗ.
  const huy = (uid, id, lyDo) => duoi(uid, `select kho_huy_tra_hang_cho_tien($1, $2) as cau`, [id, lyDo]);
  const tonLo = async () => n((await db.query(`select so_kg from kho_ton where lo_id = $1 and vi_tri_id = $2`, [lo.id, viTri.kho])).rows[0].so_kg);
  const tonTruocHuy = await tonLo();
  const c = await ghiKg(UID.thuKhoA, { dong: [{ lo_id: lo.id, so_kg: 1.25 }] });
  const XT3 = c.rows?.[0]?.phieu_xuat_id;
  ok('Ghi thêm một phiếu trả để thử hủy', c.loi === null && Math.abs(tonTruocHuy - (await tonLo()) - 1.25) < 1e-9, c.loi ?? '');
  ok('NV quầy KHÔNG hủy được phiếu trả hàng', (await huy(UID.nvQuayA, XT3, 'x')).loi !== null);
  ok('Hủy phải có lý do', (await huy(UID.keToanA, XT3, '  ')).loi !== null);
  ok('Phiếu đã xác nhận tiền KHÔNG hủy được ở đây', /đã được kế toán xác nhận/.test((await huy(UID.keToanA, XT, 'x')).loi ?? ''));
  const h = await huy(UID.thuKhoA, XT3, 'Ghi nhầm số kg');
  ok('Người ghi phiếu (thủ kho) hủy được khi còn chờ xác nhận', h.loi === null && /về lại chỗ cũ/.test(h.rows?.[0]?.cau ?? ''), h.loi ?? '');
  ok('Hủy xong: tồn lô trở lại như trước', Math.abs((await tonLo()) - tonTruocHuy) < 1e-9);
  const px3 = (await db.query(`select trang_thai, ly_do_xu_ly from kho_phieu_xuat where id = $1`, [XT3])).rows[0];
  ok('Phiếu thành da_huy, giữ lý do', px3.trang_thai === 'da_huy' && px3.ly_do_xu_ly === 'Ghi nhầm số kg');
  ok('Hủy lại → báo đã hủy, không đảo sổ lần hai',
     /đã hủy trước đó/.test((await huy(UID.keToanA, XT3, 'x')).rows?.[0]?.cau ?? '') && Math.abs((await tonLo()) - tonTruocHuy) < 1e-9);
  ok('Phiếu đã hủy không xác nhận tiền được', (await xacNhan(UID.keToanA, XT3)).loi !== null);
  ok('Phiếu đã hủy không còn trong số đỏ kế toán', (await demViec(UID.keToanA)).tra_hang_cho_tien === 0);
  await doiSoat('Sau hủy phiếu trả hàng chờ tiền');

  // Hàm cũ một bước vẫn chạy như trước cho kế toán.
  const cu = await duoi(UID.keToanA, `
    select * from kho_tra_nha_cung_cap($1, $2, $3, $4, null, '{}'::text[], null, $5::jsonb)`,
    [cnA.id, maGui(), P4.id, viTri.kho, JSON.stringify([{ lo_id: lo.id, so_kg: 0.1 }])]);
  ok('kho_tra_nha_cung_cap (0024) vẫn một bước, có tiền: 0,1 × 500.000 + thuế = 54.000',
     cu.loi === null && n(cu.rows[0].so_tien_giam_tru) === 54000, cu.loi ?? JSON.stringify(cu.rows));
  await doiSoat('Sau trả hàng hai bước');
});

// ===========================================================================
await nhom('4 · BÙ TRỪ, NCC HOÀN TIỀN: ĐÚNG DẤU, KHÔNG VƯỢT 0', async () => {
  const cu = await duoi(UID.keToanA, `
    select * from kho_ghi_thanh_toan($1, $2, $3, 'bu_tru', null, 1000, $4::date, 'x', '{}'::text[], '[]'::jsonb)`,
    [cnA.id, maGui(), nccUc, homNay]);
  ok('Hàm cũ kho_ghi_thanh_toan giữ nguyên: không nhận bù trừ', cu.loi !== null);
  const tk = await ghiV2(UID.thuKhoA, { ncc: nccUc, soTien: 1000 });
  ok('Thủ kho KHÔNG ghi được thanh toán v2', tk.loi !== null);
  const btKhongGhiChu = await ghiV2(UID.keToanA, { ncc: nccUc, loai: 'bu_tru', soTien: 1000 });
  ok('Bù trừ phải ghi khoản gì', btKhongGhiChu.loi !== null && /Bù trừ/.test(btKhongGhiChu.loi));
  const htKhongHinhThuc = await ghiV2(UID.keToanA, { ncc: nccUc, loai: 'hoan_tien', hinhThuc: null, soTien: 1000 });
  ok('Hoàn tiền phải chọn hình thức', htKhongHinhThuc.loi !== null && /hình thức/.test(htKhongHinhThuc.loi));
  const htChuaAm = await ghiV2(UID.keToanA, { ncc: nccUc, loai: 'hoan_tien', soTien: 1000 });
  ok('NCC chưa nợ lại quán → hoàn tiền bị chặn', htChuaAm.loi !== null && /nợ lại quán \(0 đ\)/.test(htChuaAm.loi), htChuaAm.loi ?? '');

  const truoc = await congNoNcc(nccUc);
  const dauTien = (await db.query(`select id from kho_v_cong_no_phieu where nha_cung_cap_id = $1 and con_no > 0
    order by han_thanh_toan nulls last, ngay_nhap, so_phieu limit 1`, [nccUc])).rows[0].id;
  const bt = await ghiV2(UID.keToanA, { ncc: nccUc, loai: 'bu_tru', soTien: 300000, ghiChu: 'Tiền cọc thùng xốp NCC giữ' });
  ok('Bù trừ 300.000 đ: số BT-', bt.loi === null && /^BT-\d{4}-0001$/.test(bt.rows?.[0]?.so_phieu), bt.loi ?? '');
  const sau = await congNoNcc(nccUc);
  ok('Bù trừ làm GIẢM còn nợ đúng 300.000 đ; cột bu_tru, da_tra tăng',
     n(truoc.con_no) - n(sau.con_no) === 300000 && n(sau.bu_tru) === 300000 && n(sau.da_tra) - n(truoc.da_tra) === 300000);
  const bt1 = await congNo(dauTien);
  ok('Tự chia: phiếu hạn sớm nhất (P4: nhập 2 ngày trước + 30 < hóa đơn gộp hôm qua + 30) nhận bù trừ',
     dauTien === P4.id && n(bt1.bu_tru) === 300000, JSON.stringify(bt1));
  const tt = (await db.query(`select * from kho_thanh_toan where id = $1`, [bt.rows?.[0]?.thanh_toan_id])).rows[0];
  ok('Bù trừ không có hình thức (không qua tiền mặt / ngân hàng)', tt.hinh_thuc === null && tt.loai === 'bu_tru');

  // Xem trước "Trả đủ" P1..P4 của NCC Úc.
  const xt = await duoi(UID.keToanA, `select * from kho_xem_truoc_thanh_toan($1, $2, 'thanh_toan', null)`, [cnA.id, nccUc]);
  const du = xt.rows?.reduce((s, r) => s + n(r.so_tien), 0);
  ok('Xem trước "Trả đủ" = tổng còn nợ NCC, hạn sớm nhất trước',
     xt.loi === null && du === n(sau.con_no) && xt.rows[0].phieu_nhap_id === P4.id, xt.loi ?? `${du} / ${sau.con_no}`);
  const xt2 = await duoi(UID.keToanA, `select * from kho_xem_truoc_thanh_toan($1, $2, 'thanh_toan', 800000)`, [cnA.id, nccUc]);
  ok('Xem trước 800.000 đ: chia đúng số, phần sau bằng 0',
     xt2.rows?.reduce((s, r) => s + n(r.so_tien), 0) === 800000 && n(xt2.rows.at(-1).so_tien) === 0);
  const tkXt = await duoi(UID.thuKhoA, `select * from kho_xem_truoc_thanh_toan($1, $2, 'thanh_toan', null)`, [cnA.id, nccUc]);
  ok('Thủ kho KHÔNG xem trước được', tkXt.loi !== null);

  // Trả đủ P3 rồi trả hàng P3 → còn nợ âm → NCC hoàn tiền.
  const c3 = await congNo(P3.id);
  const tra3 = await ghiV2(UID.keToanA, { ncc: nccUc, soTien: n(c3.con_no), hinhThuc: 'tien_mat',
    phanBo: [{ phieu_nhap_id: P3.id, so_tien: n(c3.con_no) }] });
  ok('Trả đủ P3', tra3.loi === null && n((await congNo(P3.id)).con_no) === 0, tra3.loi ?? '');
  const xtP3 = await ghiKg(UID.thuKhoA, { dong: [{ lo_id: P3.lo[0].id, so_kg: 1 }] });
  const xn = await xacNhan(UID.keToanA, xtP3.rows?.[0]?.phieu_xuat_id, 123457);
  ok('Trả hàng P3 sau khi đã trả đủ: còn nợ âm −123.457 đ', xn.loi === null && n((await congNo(P3.id)).con_no) === -123457, xn.loi ?? '');

  const vuot = await ghiV2(UID.keToanA, { ncc: nccUc, loai: 'hoan_tien', soTien: 123458 });
  ok('Hoàn tiền vượt số NCC nợ lại bị chặn, nêu số', vuot.loi !== null && /123\.457 đ/.test(vuot.loi), vuot.loi ?? '');
  const vuotPhieu = await ghiV2(UID.keToanA, { ncc: nccUc, loai: 'hoan_tien', soTien: 1000, phanBo: [{ phieu_nhap_id: P2.id, so_tien: 1000 }] });
  ok('Hoàn tiền vào phiếu không âm bị chặn', vuotPhieu.loi !== null && /nợ lại quán 0 đ/.test(vuotPhieu.loi), vuotPhieu.loi ?? '');
  const ht = await ghiV2(UID.keToanA, { ncc: nccUc, loai: 'hoan_tien', soTien: 100000 });
  ok('NCC hoàn 100.000 đ chuyển khoản: số HT-', ht.loi === null && /^HT-/.test(ht.rows?.[0]?.so_phieu), ht.loi ?? '');
  const c3b = await congNo(P3.id);
  ok('Hoàn tiền làm TĂNG còn nợ về phía 0: −123.457 → −23.457', n(c3b.con_no) === -23457 && n(c3b.hoan_tien) === 100000, JSON.stringify(c3b));
  ok('"Đã trả" của view = tiền trả + bù trừ − hoàn tiền', n(c3b.da_tra) === n(c3b.tien_tra) + n(c3b.bu_tru) - n(c3b.hoan_tien));
  const ht2 = await ghiV2(UID.keToanA, { ncc: nccUc, loai: 'hoan_tien', soTien: 23457, hinhThuc: 'tien_mat' });
  ok('Hoàn nốt 23.457 đ → P3 về đúng 0, không vượt', ht2.loi === null && n((await congNo(P3.id)).con_no) === 0);
  const ht3 = await ghiV2(UID.keToanA, { ncc: nccUc, loai: 'hoan_tien', soTien: 1 });
  ok('Hết âm → hoàn thêm 1 đồng cũng bị chặn', ht3.loi !== null);
  const huy = await duoi(UID.keToanA, `select kho_huy_thanh_toan($1, 'Ghi nhầm') as cau`, [ht2.rows?.[0]?.thanh_toan_id]);
  ok('Hủy khoản hoàn tiền → P3 lại âm −23.457', huy.loi === null && n((await congNo(P3.id)).con_no) === -23457);
  await ghiV2(UID.keToanA, { ncc: nccUc, loai: 'hoan_tien', soTien: 23457, hinhThuc: 'tien_mat' });

  const thuongVuot = await ghiV2(UID.keToanA, { ncc: nccUc, soTien: 999999999 });
  ok('Trả tiền vượt công nợ vẫn bị chặn (v2)', thuongVuot.loi !== null && /công nợ còn lại/.test(thuongVuot.loi));
});

// ===========================================================================
await nhom('5 · CÔNG NỢ THEO KỲ: ĐẦU KỲ + PHÁT SINH = CUỐI KỲ = VIEW; NỢ ĐẦU KỲ', async () => {
  // Nợ đầu kỳ của NCC Nhật, rồi trả một phần (tự chia trả được nợ đầu kỳ).
  const nd = await duoi(UID.keToanA, `select kho_ghi_no_dau_ky(p_chi_nhanh_id => $1, p_ma_gui => $2, p_dong => $3::jsonb) as kq`,
    [cnA.id, maGui(), JSON.stringify([{ nha_cung_cap_id: nccNhat, so_tien: 7000000, so_hoa_don: 'CU-1' }])]);
  ok('Ghi nợ đầu kỳ NCC Nhật 7.000.000 đ', nd.loi === null, nd.loi ?? '');
  const tra = await ghiV2(UID.keToanA, { ncc: nccNhat, soTien: 2500000 });
  ok('Trả 2.500.000 đ (v2 tự chia vào nợ đầu kỳ)', tra.loi === null, tra.loi ?? '');
  const cn = await congNoNcc(nccNhat);
  ok('Nợ đầu kỳ vẫn đúng: còn 4.500.000 đ', n(cn.con_no) === 4500000, JSON.stringify(cn));

  for (const [ten, ncc] of [['NCC Úc', nccUc], ['NCC Mỹ', nccMy], ['NCC Nhật', nccNhat], ['mọi NCC', null]]) {
    const r = await theoKy(UID.keToanA, ncc, await ngay(-12), homNay);
    const dau = r.rows?.[0], cuoi = r.rows?.at(-1), giua = r.rows?.slice(1, -1) ?? [];
    const tang = giua.reduce((s, x) => s + n(x.tang), 0), giam = giua.reduce((s, x) => s + n(x.giam), 0);
    const view = ncc
      ? n((await congNoNcc(ncc))?.con_no ?? 0)
      : n((await db.query(`select coalesce(sum(con_no), 0) as s from kho_v_cong_no_phieu where chi_nhanh_id = $1`, [cnA.id])).rows[0].s);
    ok(`${ten}: đầu kỳ + tăng − giảm = cuối kỳ = còn nợ của view (${view})`,
       r.loi === null && dau.loai === 'dau_ky' && cuoi.loai === 'cuoi_ky'
       && n(dau.so_du) + tang - giam === n(cuoi.so_du) && n(cuoi.so_du) === view
       && n(cuoi.tang) === tang && n(cuoi.giam) === giam
       && (giua.length === 0 || n(giua.at(-1).so_du) === n(cuoi.so_du)),
       r.loi ?? JSON.stringify({ dau: dau?.so_du, tang, giam, cuoi: cuoi?.so_du, view }));
  }
  const uc = await theoKy(UID.keToanA, nccUc, await ngay(-12), homNay);
  ok('NCC Úc từ 12 ngày trước: đầu kỳ = hai phiếu cũ P1 + P2 (− bù trừ chưa có)',
     n(uc.rows[0].so_du) === n((await congNo(P1.id)).phai_tra) + n((await congNo(P2.id)).phai_tra), JSON.stringify(uc.rows[0]));
  const loai = new Set(uc.rows.map(x => x.loai));
  ok('Có đủ loại chứng từ: mua, thanh_toan, giam_tru, bu_tru, hoan_tien',
     ['mua', 'thanh_toan', 'giam_tru', 'bu_tru', 'hoan_tien'].every(l => loai.has(l)), [...loai].join(', '));
  ok('Hoàn tiền nằm ở cột TĂNG, giảm trừ ở cột GIẢM',
     uc.rows.filter(x => x.loai === 'hoan_tien').every(x => n(x.tang) > 0 && n(x.giam) === 0)
     && uc.rows.filter(x => x.loai === 'giam_tru').every(x => n(x.giam) > 0 && n(x.tang) === 0));
  ok('Chứng từ xếp theo ngày', uc.rows.slice(1, -1).every((x, i, a) => i === 0 || String(a[i - 1].ngay) <= String(x.ngay)
     || new Date(a[i - 1].ngay) <= new Date(x.ngay)));
  const nhat = await theoKy(UID.keToanA, nccNhat, await ngay(-30), homNay);
  ok('NCC Nhật: dòng nợ đầu kỳ (loai no_dau, số HĐ CU-1) và dòng trả tiền',
     nhat.rows.some(x => x.loai === 'no_dau' && n(x.tang) === 7000000 && x.so_hoa_don === 'CU-1')
     && nhat.rows.some(x => x.loai === 'thanh_toan' && n(x.giam) === 2500000), JSON.stringify(nhat.rows));
  const xa = await theoKy(UID.keToanA, nccUc, await ngay(-400), await ngay(-300));
  ok('Kỳ trước khi có chứng từ: đầu = cuối = 0, không dòng giữa', xa.rows.length === 2 && n(xa.rows[1].so_du) === 0);
  const nguoc = await theoKy(UID.keToanA, nccUc, homNay, await ngay(-1));
  ok('Từ ngày sau đến ngày bị chặn', nguoc.loi !== null);
  for (const [ai, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA]]) {
    const r = await theoKy(uid, nccUc, await ngay(-12), homNay);
    ok(`${ai} KHÔNG xem được công nợ theo kỳ`, r.loi !== null);
  }
  const khac = await theoKy(UID.qlB, nccUc, await ngay(-12), homNay);
  ok('Quản lý chi nhánh khác KHÔNG xem được chi nhánh A', khac.loi !== null);
});

// ===========================================================================
await nhom('6 · DỮ LIỆU MISA: ĐỦ CỘT, THUẾ CHIA KHỚP, CỜ THIẾU MÃ, TK TỪ CÀI ĐẶT', async () => {
  const COT = ['thu_tu', 'loai_chung_tu', 'ngay_chung_tu', 'so_chung_tu', 'so_hoa_don', 'ngay_hoa_don', 'ma_ncc', 'ten_ncc',
    'ma_so_thue', 'ma_hang', 'ten_hang', 'dvt', 'so_luong', 'don_gia', 'thanh_tien', 'thue_suat', 'tien_thue',
    'tk_no', 'tk_co', 'tk_thue', 'hinh_thuc', 'dien_giai', 'thieu_ma', 'ref_id'];
  const tu = await ngay(-30);
  const m = await misa(UID.keToanA, tu, homNay, 'mua_hang');
  ok('Kế toán lấy dữ liệu mua hàng', m.loi === null && m.rows.length > 0, m.loi ?? '');
  ok('Đủ cột MISA', COT.every(c => c in (m.rows?.[0] ?? {})), Object.keys(m.rows?.[0] ?? {}).join(', '));
  const my = m.rows.filter(r => r.ref_id === PM.id);
  ok('Phiếu Mỹ: 2 dòng hàng + 1 dòng chi phí khác', my.length === 3 && my[2].ten_hang === 'Chi phí mua hàng khác' && n(my[2].thanh_tien) === 50000,
     JSON.stringify(my.map(r => r.ten_hang)));
  const thue = my.reduce((s, r) => s + n(r.tien_thue), 0);
  ok('Tiền thuế chia vào dòng, tổng = 105.001 đ (khớp từng đồng)', thue === 105001, `${thue}`);
  ok('Dòng hàng: ĐVT kg, số lượng, đơn giá, thành tiền, thuế suất %',
     my[0].dvt === 'kg' && n(my[0].so_luong) === 1.5 && n(my[0].don_gia) === 600000 && n(my[0].thanh_tien) === 900000 && n(my[0].thue_suat) > 0);
  ok('TK mặc định: nợ 1561, có 331, thuế 1331', my.every(r => r.tk_no === '1561' && r.tk_co === '331' && r.tk_thue === '1331'));
  ok('Chưa có mã MISA → vẫn xuất, cờ thieu_ma, mã NCC tạm NCC-…',
     my.every(r => r.thieu_ma === true && /^NCC-[0-9A-F]{8}$/.test(r.ma_ncc)) && my[0].ma_hang === 'T-THANNGOAI', JSON.stringify(my[0]));
  ok('Nợ đầu kỳ không phải mua hàng — không xuất', !m.rows.some(r => /^ND-/.test(r.so_chung_tu)));

  // Điền mã MISA: NCC (ghi thẳng bảng, quyền ncc), mặt hàng (hàm riêng cho kế toán).
  const ncc = await duoi(UID.keToanA, `update kho_nha_cung_cap set ma_misa = 'NCC_MY01', ma_so_thue = '0312345678' where id = $1`, [nccMy]);
  ok('Kế toán điền mã MISA của NCC', ncc.loi === null, ncc.loi ?? '');
  const sai = await duoi(UID.keToanA, `update kho_nha_cung_cap set ma_misa = 'có dấu' where id = $1`, [nccUc]);
  ok('Mã MISA có dấu / khoảng trắng bị từ chối', sai.loi !== null);
  const suaBang = await duoi(UID.keToanA, `update kho_mat_hang set ma_misa = 'X' where id = $1 returning id`, [MH['T-THANNGOAI'].id]);
  ok('Kế toán KHÔNG sửa thẳng bảng mặt hàng (không có danh_muc)', suaBang.loi !== null || suaBang.rows.length === 0);
  const mh1 = await duoi(UID.keToanA, `select kho_luu_ma_misa_mat_hang($1, 'THAN_NGOAI')`, [MH['T-THANNGOAI'].id]);
  const mh2 = await duoi(UID.keToanA, `select kho_luu_ma_misa_mat_hang($1, ' nac_vai ')`, [MH['T-NACVAI'].id]);
  ok('Kế toán điền mã MISA mặt hàng qua hàm', mh1.loi === null && mh2.loi === null, mh1.loi ?? mh2.loi ?? '');
  const trung = await duoi(UID.keToanA, `select kho_luu_ma_misa_mat_hang($1, 'than_ngoai')`, [MH['T-NACVAI'].id]);
  ok('Mã MISA mặt hàng trùng bị chặn', trung.loi !== null && /đã dùng/.test(trung.loi));
  const tkMh = await duoi(UID.thuKhoA, `select kho_luu_ma_misa_mat_hang($1, 'ZZ')`, [MH['T-NACVAI'].id]);
  ok('Thủ kho KHÔNG sửa được mã MISA', tkMh.loi !== null);

  const tkSai = await duoi(UID.keToanA, `select kho_luu_misa_tk($1, '{"tk_co_ncc":"33a"}'::jsonb)`, [cnA.id]);
  const tkLa = await duoi(UID.keToanA, `select kho_luu_misa_tk($1, '{"tk_la":"331"}'::jsonb)`, [cnA.id]);
  ok('Mã tài khoản sai dạng / khóa lạ bị chặn', tkSai.loi !== null && tkLa.loi !== null);
  const tkTk = await duoi(UID.thuKhoA, `select kho_luu_misa_tk($1, '{"tk_co_ncc":"3311"}'::jsonb)`, [cnA.id]);
  ok('Thủ kho KHÔNG sửa được mã tài khoản', tkTk.loi !== null);
  const luu = await duoi(UID.keToanA, `select kho_luu_misa_tk($1, '{"tk_co_ncc":"3311"}'::jsonb) as v`, [cnA.id]);
  ok('Kế toán sửa TK có NCC thành 3311 (khóa khác giữ nguyên)', luu.loi === null && luu.rows[0].v.tk_co_ncc === '3311' && luu.rows[0].v.tk_no_hang === '1561',
     luu.loi ?? '');

  const m2 = await misa(UID.keToanA, tu, homNay, 'mua_hang');
  const my2 = m2.rows.filter(r => r.ref_id === PM.id);
  ok('Đủ mã → thieu_ma = false, mã NCC / mã hàng MISA', my2.slice(0, 2).every(r => r.thieu_ma === false && r.ma_ncc === 'NCC_MY01')
     && my2[0].ma_hang === 'THAN_NGOAI' && my2[1].ma_hang === 'nac_vai' && my2[0].ma_so_thue === '0312345678', JSON.stringify(my2[0]));
  ok('TK có đổi theo cài đặt (3311)', my2.every(r => r.tk_co === '3311'));
  const uc = m2.rows.filter(r => r.ref_id === P1.id);
  ok('NCC chưa có mã MISA: vẫn cờ thiếu mã', uc.length === 1 && uc[0].thieu_ma === true);

  const t = await misa(UID.keToanA, tu, homNay, 'thanh_toan');
  ok('Dữ liệu thanh toán: có trả tiền, giảm trừ, bù trừ, hoàn tiền',
     t.loi === null && ['thanh_toan', 'giam_tru', 'bu_tru', 'hoan_tien'].every(l => t.rows.some(r => r.loai_chung_tu === l)), t.loi ?? '');
  const tim = l => t.rows.find(r => r.loai_chung_tu === l);
  ok('Bù trừ: nợ 3311 / có 131', tim('bu_tru').tk_no === '3311' && tim('bu_tru').tk_co === '131', JSON.stringify(tim('bu_tru')));
  ok('Hoàn tiền chuyển khoản: nợ 1121 / có 3311',
     t.rows.some(r => r.loai_chung_tu === 'hoan_tien' && r.hinh_thuc === 'chuyen_khoan' && r.tk_no === '1121' && r.tk_co === '3311'));
  ok('Trả tiền mặt: nợ 3311 / có 1111',
     t.rows.some(r => r.loai_chung_tu === 'thanh_toan' && r.hinh_thuc === 'tien_mat' && r.tk_no === '3311' && r.tk_co === '1111'));
  ok('Giảm trừ: có 1561', tim('giam_tru').tk_co === '1561');
  const loai = await misa(UID.keToanA, tu, homNay, 'ban_hang');
  ok('Loại lạ bị chặn', loai.loi !== null);
  for (const [ai, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA]]) {
    ok(`${ai} KHÔNG lấy được dữ liệu MISA`, (await misa(uid, tu, homNay, 'mua_hang')).loi !== null);
  }
});

// ===========================================================================
await nhom('7 · ĐỔI SỐ TÀI KHOẢN NGÂN HÀNG NCC → NHẬT KÝ + CẢNH BÁO CHỦ', async () => {
  const dau = await duoi(UID.keToanA, `update kho_nha_cung_cap set ngan_hang = 'VCB', so_tai_khoan = '0011' where id = $1`, [nccUc]);
  ok('Kế toán điền tài khoản lần đầu', dau.loi === null);
  const nk1 = (await db.query(`select * from kho_ncc_tk_nhat_ky where nha_cung_cap_id = $1 order by luc`, [nccUc])).rows;
  ok('Nhật ký ghi cả lần điền đầu (cũ trống → mới)', nk1.length === 1 && nk1[0].so_tai_khoan_cu === null && nk1[0].so_tai_khoan_moi === '0011');
  ok('Điền lần đầu: chủ KHÔNG nhận cảnh báo', !(await thongBao(UID.chu)).some(e => e.khoa === 'ncc_doi_tai_khoan'));
  await duoi(UID.keToanA, `update kho_nha_cung_cap set ghi_chu = 'khác' where id = $1`, [nccUc]);
  ok('Sửa cột khác không ghi nhật ký',
     (await db.query(`select count(*)::int as n from kho_ncc_tk_nhat_ky where nha_cung_cap_id = $1`, [nccUc])).rows[0].n === 1);

  const doi = await duoi(UID.keToanA, `update kho_nha_cung_cap set so_tai_khoan = '9999' where id = $1`, [nccUc]);
  ok('Kế toán đổi số tài khoản', doi.loi === null);
  const nk2 = (await db.query(`select * from kho_ncc_tk_nhat_ky where nha_cung_cap_id = $1 order by luc desc limit 1`, [nccUc])).rows[0];
  const keToanId = (await db.query(`select id from nhan_su where auth_uid = $1`, [UID.keToanA])).rows[0].id;
  ok('Nhật ký: cũ → mới, ai đổi', nk2.so_tai_khoan_cu === '0011' && nk2.so_tai_khoan_moi === '9999' && nk2.ngan_hang_moi === 'VCB'
     && nk2.nguoi_doi === keToanId, JSON.stringify(nk2));
  const ev = (await thongBao(UID.chu)).find(e => e.khoa === 'ncc_doi_tai_khoan');
  ok('Chủ nhận cảnh báo ncc_doi_tai_khoan (ma = số mới, ten = NCC, phu = người đổi)',
     ev && ev.ma === '9999' && ev.ten === 'NCC Úc' && ev.phu === 'Kế toán Q1' && ev.ref2 === nccUc, JSON.stringify(ev));
  ok('Quản lý, kế toán KHÔNG nhận cảnh báo này (chỉ chủ)',
     !(await thongBao(UID.qlA)).some(e => e.khoa === 'ncc_doi_tai_khoan') && !(await thongBao(UID.keToanA)).some(e => e.khoa === 'ncc_doi_tai_khoan'));
  const docKt = await duoi(UID.keToanA, `select count(*)::int as n from kho_ncc_tk_nhat_ky`);
  ok('Kế toán đọc được nhật ký', docKt.rows?.[0]?.n === 2);
  for (const [ai, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA]]) {
    const r = await duoi(uid, `select count(*)::int as n from kho_ncc_tk_nhat_ky`);
    ok(`${ai} KHÔNG đọc được nhật ký tài khoản`, r.loi !== null || r.rows[0].n === 0);
  }
  const ghiTay = await duoi(UID.keToanA, `insert into kho_ncc_tk_nhat_ky (nha_cung_cap_id) values ($1)`, [nccUc]);
  ok('Không ai ghi tay vào nhật ký', ghiTay.loi !== null);

  // Gõ thêm dấu cách: vẫn ghi nhật ký nhưng KHÔNG báo chủ; đổi ngân hàng (cùng số) thì báo.
  const soCanhBao = async () => (await thongBao(UID.chu)).filter(e => e.khoa === 'ncc_doi_tai_khoan').length;
  const truoc = await soCanhBao();
  await duoi(UID.keToanA, `update kho_nha_cung_cap set so_tai_khoan = '99 99' where id = $1`, [nccUc]);
  ok('Chỉ thêm dấu cách vào số: không thêm cảnh báo cho chủ', (await soCanhBao()) === truoc);
  await duoi(UID.keToanA, `update kho_nha_cung_cap set ngan_hang = 'ACB' where id = $1`, [nccUc]);
  ok('Cùng số, đổi ngân hàng: chủ nhận thêm cảnh báo', (await soCanhBao()) === truoc + 1);
});

// ===========================================================================
await nhom('8 · THỦ KHO / NV QUẦY KHÔNG ĐỌC ĐƯỢC GÌ CÓ TIỀN', async () => {
  const bang = ['kho_hoa_don_ncc', 'kho_hoa_don_phieu', 'kho_v_cong_no_phieu', 'kho_v_cong_no_ncc', 'kho_thanh_toan', 'kho_thanh_toan_phan_bo'];
  const kt = await Promise.all(bang.map(b => duoi(UID.keToanA, `select count(*)::int as n from ${b}`)));
  ok('Đối chứng: kế toán đọc được mọi bảng trên', kt.every(r => r.rows?.[0]?.n > 0), kt.map(r => r.rows?.[0]?.n ?? r.loi).join());
  for (const [ai, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA]]) {
    const lo = [];
    for (const b of bang) {
      const r = await duoi(uid, `select count(*)::int as n from ${b}`);
      if (r.loi === null && r.rows[0].n > 0) lo.push(`${b}(${r.rows[0].n})`);
    }
    ok(`${ai} đọc ra 0 dòng ở mọi bảng / view có tiền`, lo.length === 0, lo.join(', '));
    const ham = [
      ['kho_ghi_thanh_toan_v2', ghiV2(uid, { ncc: nccUc, soTien: 1 })],
      ['kho_doi_chieu_hoa_don_gop', gop(uid, { ncc: nccUc, so: 'X', tong: 1, phieu: [P1.id, P2.id], lyDo: 'x' })],
      ['kho_bo_doi_chieu_gop', boGop(uid, HD, 'x')],
      ['kho_ds_tra_hang_cho_tien', duoi(uid, `select * from kho_ds_tra_hang_cho_tien($1)`, [cnA.id])],
      ['kho_xac_nhan_tien_tra_hang', xacNhan(uid, XT2)],
      ['kho_xem_truoc_thanh_toan', duoi(uid, `select * from kho_xem_truoc_thanh_toan($1, $2, 'thanh_toan', null)`, [cnA.id, nccUc])],
      ['kho_du_lieu_misa (thanh toán)', misa(uid, homNay, homNay, 'thanh_toan')],
      ['kho_luu_misa_tk', duoi(uid, `select kho_luu_misa_tk($1, '{}'::jsonb)`, [cnA.id])],
    ];
    const lot = [];
    for (const [ten, p] of ham) if ((await p).loi === null) lot.push(ten);
    ok(`${ai} bị từ chối mọi hàm có tiền của 0040`, lot.length === 0, lot.join(', '));
  }
  const nb = await duoi(UID.keToanA, `select * from kho_chia_thanh_toan($1, $2, 'thanh_toan', 1)`, [cnA.id, nccUc]);
  ok('Hàm nội bộ kho_chia_thanh_toan: người dùng không gọi thẳng được', nb.loi !== null && /permission denied/i.test(nb.loi));
});

// ===========================================================================
await nhom('9 · CHI NHÁNH KHÁC, ĐỐI SOÁT CUỐI', async () => {
  const b = await duoi(UID.qlB, `select * from kho_ds_tra_hang_cho_tien($1)`, [cnA.id]);
  ok('Quản lý Q7 KHÔNG xem hàng chờ của Q1', b.loi !== null);
  const bHd = await duoi(UID.qlB, `select count(*)::int as n from kho_hoa_don_ncc`);
  ok('Quản lý Q7 không thấy hóa đơn gộp của Q1', bHd.rows?.[0]?.n === 0);
  const bGop = await gop(UID.qlB, { cn: cnB.id, ncc: nccUc, so: 'B1', tong: 1, phieu: [P1.id, P2.id], lyDo: 'x' });
  ok('Gộp phiếu của chi nhánh khác bị chặn', bGop.loi !== null);
  await doiSoat('Cuối cùng');
});

process.exit(ketThuc('CÔNG NỢ V2'));
