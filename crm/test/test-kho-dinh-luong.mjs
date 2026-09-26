/**
 * BEEFTOWN KHO — Kiểm thử định lượng món, đối chiếu định mức (0038, GĐ7b)
 * ======================================================================
 *
 *     node test/test-kho-dinh-luong.mjs
 *
 * Chủ đã chốt: định lượng món CHỈ để đối chiếu — bếp vẫn nhận thịt bằng Xuất
 * bếp, kho không tự trừ theo định lượng. Những điều phải đúng:
 *   · chỉ quản lý, chủ (danh_muc) sửa món / định lượng; chi nhánh nào của nấy;
 *   · dán Excel: xem trước từng dòng (lỗi nói rõ dòng nào, sai gì), còn lỗi thì
 *     không áp dụng, áp dụng lại không đổi gì, món chưa có được tạo khi áp dụng;
 *   · "Lấy món từ iPOS": mã ghép "không phải hàng kho" + mã bán chưa ghép, không
 *     lấy nhãn cân / hàng bán thẳng từ quầy, chạy lại không trùng;
 *   · báo cáo: xuất bếp 10 kg, bán 40 món × 200 g = 8 kg → lệch 25%; phần
 *     "chuyển bếp" khi pha lóc được tính (mở lại phiên thì trừ lại); HĐ hủy và
 *     dòng đã trừ kho không đếm; thủ kho / NV quầy không thấy tiền;
 *   · cảnh báo dinh_muc_lech khi vượt ngưỡng, không khi dưới / bằng ngưỡng;
 *   · kho không bị trừ theo định lượng — kho_doi_soat_ton() rỗng;
 *   · (0044) phiếu Xuất bếp lý do "Cơm nhân viên" KHÔNG tính vào bếp nhận; quản lý
 *     bật lại được (tinh_dinh_muc); lý do mới tên đó mặc định không tính.
 */

import { dungDatabase, taoBoDem, UID, maGui, UID_MAY_IPOS, themMayIpos } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ ĐỊNH LƯỢNG MÓN, ĐỐI CHIẾU ĐỊNH MỨC');
const { db, cnA, cnB, duoi } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const gioTruoc = n => new Date(Date.now() - n * 3600000).toISOString();

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// Nhãn cân mẫu 2XCCCCCWWWWWK (như test-kho-ipos).
function nhanCan(maCan, gram) {
  const s = '20' + String(maCan).padStart(5, '0') + String(gram).padStart(5, '0');
  let t = 0;
  for (let i = 0; i < 12; i++) t += (s.charCodeAt(i) - 48) * (i % 2 === 0 ? 1 : 3);
  return s + ((10 - (t % 10)) % 10);
}

const MH = {};
let viTri = {};
let ncc;

async function nhapHang(dong, vt) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt, homNay, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const duyet = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (duyet.loi) throw new Error(duyet.loi);
  const { rows } = await db.query(`
    select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id]);
  return rows;
}

const xuat = (uid, t) => duoi(uid, `
  select * from kho_tao_phieu_xuat(
    p_chi_nhanh_id => $1, p_ma_gui => $2, p_loai => $3, p_vi_tri_id => $4, p_vi_tri_den_id => $5,
    p_ly_do_id => null, p_ghi_chu => null, p_anh => '{}'::text[], p_dong => $6::jsonb)`,
  [cnA.id, maGui(), t.loai, t.tu, t.den ?? null, JSON.stringify(t.dong ?? [])]);

const luuPhien = (uid, t) => duoi(uid, `
  select * from kho_luu_phien_pha(
    p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
    p_mat_hang_vao_id => $5, p_cong_thuc_id => null, p_ngay_pha => $6::date,
    p_ghi_chu => null, p_vao => $7::jsonb, p_ra => $8::jsonb)`,
  [t.id ?? null, cnA.id, maGui(), t.phienBan ?? null, t.matHang, homNay,
   JSON.stringify(t.vao ?? []), JSON.stringify(t.ra ?? [])]);

const hd = (ma, luc, dong, huy = false) => ({ ma_hd: ma, thoi_diem_ban: luc, da_huy: huy, dong });

/** Một lượt đồng bộ iPOS trọn vẹn: bat_dau → nhan → ket_thuc. */
async function luot(hoaDon) {
  const b = await duoi(MAY, `select kho_ipos_bat_dau($1, 'cron') as kq`, [cnA.id]);
  if (b.loi) return { loi: b.loi };
  const bd = b.rows[0].kq;
  if (!bd.duoc) return { tuChoi: bd.ly_do };
  const n = await duoi(MAY, `select kho_ipos_nhan($1, $2, $3::jsonb, $4::timestamptz) as kq`,
    [cnA.id, bd.lan_id, JSON.stringify(hoaDon), new Date().toISOString()]);
  const k = await duoi(MAY, `select kho_ipos_ket_thuc($1, $2) as kq`, [bd.lan_id, n.loi]);
  return { kq: n.rows?.[0]?.kq, loi: n.loi ?? k.loi };
}

const luuMon = (uid, t, cn = cnA.id) => duoi(uid,
  `select kho_luu_mon(p_chi_nhanh_id => $1, p_id => $2, p_ten => $3, p_ma_ipos => $4, p_dang_ban => $5) as m`,
  [cn, t.id ?? null, t.ten ?? null, t.ma ?? null, t.dangBan ?? null]);
const luuDl = (uid, monId, dong) => duoi(uid, `select kho_luu_dinh_luong($1, $2::jsonb) as kq`, [monId, JSON.stringify(dong)]);
const nhapDl = (uid, dong, apDung, cn = cnA.id) => duoi(uid,
  `select kho_nhap_dinh_luong(p_chi_nhanh_id => $1, p_dong => $2::jsonb, p_ap_dung => $3) as kq`,
  [cn, JSON.stringify(dong), apDung]);
const baoCao = (uid, tu, den, cn = cnA.id) => duoi(uid,
  `select * from kho_bao_cao_dinh_muc(p_chi_nhanh_id => $1, p_tu => $2::date, p_den => $3::date)`, [cn, tu, den]);
const dongMh = (rows, ma) => rows?.find(r => r.ma === ma);
const monTheoTen = async ten => (await db.query(`select * from kho_mon where chi_nhanh_id = $1 and ten = $2`, [cnA.id, ten])).rows[0];
const dinhLuong = async monId => (await db.query(`
  select m.ma, d.gram::numeric as gram from kho_dinh_luong d join kho_mat_hang m on m.id = d.mat_hang_id
  where d.mon_id = $1 order by m.ma`, [monId])).rows.map(r => `${r.ma}:${Number(r.gram)}`).join(',');
const suKien = async (uid, khoa) =>
  ((await duoi(uid, `select kho_thong_bao($1, 300) as v`, [cnA.id])).rows?.[0]?.v?.su_kien ?? [])
    .filter(e => e.khoa === khoa);
const demViec = async uid => (await duoi(uid, `select kho_dem_viec($1) as v`, [cnA.id])).rows?.[0]?.v ?? {};

let loThan, loTang, phienId;

// ===========================================================================
await nhom('1 · CHUẨN BỊ: KHO, HÀNG, iPOS', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  await db.query(`update kho_mat_hang set ma_can = '101' where ma = 'C-THANNGOAI'`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC A') returning id`)).rows[0].id;

  [loThan] = await nhapHang([{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 20, so_kg: 10, don_gia_kg: 500000,
                               han_dung: await ngaySau(5) }], viTri.kho);
  [loTang] = await nhapHang([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 5, don_gia_kg: 400000,
                               han_dung: await ngaySau(10) }], viTri.kho);
  ok('Kho có 20 gói thăn ngoại (10 kg) và một tảng thăn 5 kg', !!loThan && !!loTang);

  const cfg = { bat: true, pos_parent: 'SPOLHCM4', pos_id: '5898', duong_dan_hoa_don: '/hoa-don', vi_tri_ban_id: viTri.quay };
  const chu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id, JSON.stringify(cfg)]);
  ok('Chủ bật kết nối iPOS (chưa chuyển nguồn số bán)', chu.loi === null && chu.rows[0].v.cau_hinh_du, chu.loi ?? '');
  // Hàng bán thẳng từ quầy: mã GOITHIT ghép kiểu 'mon' với nạc vai.
  const gm = await duoi(UID.qlA, `select kho_ipos_gan_ma($1, 'GOITHIT', 'mon', $2)`, [cnA.id, MH['C-NACVAI'].id]);
  ok('Ghép GOITHIT = nạc vai bán thẳng từ quầy (kiểu mon)', gm.loi === null, gm.loi ?? '');

  const l = await luot([
    hd('HD1', gioTruoc(1), [
      { khoa_dong: '1', ma_ipos: 'PHO01', ten_ipos: 'Phở bò tái', so_goi: 25, thanh_tien: 1500000 },
      { khoa_dong: '2', ma_ipos: 'PHO01', ten_ipos: 'Phở bò tái', so_goi: 15, thanh_tien: 900000 },
      { khoa_dong: '3', ma_ipos: 'NUOC', ten_ipos: 'Trà đá', so_goi: 5, thanh_tien: 25000 },
    ]),
    hd('HD2', gioTruoc(2), [{ khoa_dong: '1', ma_ipos: 'BOKHO', ten_ipos: 'Bò kho', so_goi: 8, thanh_tien: 600000 }]),
    hd('HD3', gioTruoc(2), [{ khoa_dong: '1', ma_ipos: 'PHO01', ten_ipos: 'Phở bò tái', so_goi: 100 }], true),
    hd('HD4', gioTruoc(1), [
      { khoa_dong: '1', ma_ipos: 'CAN', ten_ipos: 'Thịt cân', ma_vach: nhanCan(101, 520) },
      { khoa_dong: '2', ma_ipos: 'GOITHIT', ten_ipos: 'Gói thịt', so_goi: 1 },
    ]),
    hd('HD-CU', gioTruoc(24 * 10), [{ khoa_dong: '1', ma_ipos: 'PHO01', ten_ipos: 'Phở bò tái', so_goi: 50 }]),
  ]);
  ok('Máy iPOS gửi 5 hóa đơn (1 hủy, 1 từ 10 ngày trước)', !l.loi && !l.tuChoi && l.kq?.hd_moi === 5, JSON.stringify(l));
  const { rows: st } = await db.query(`select distinct trang_thai from kho_ipos_dong where chi_nhanh_id = $1`, [cnA.id]);
  ok('Chưa chuyển nguồn số bán: dòng bán nằm chờ, kho chưa bị trừ', st.every(r => r.trang_thai === 'cho'),
     JSON.stringify(st));
  // Món ăn không phải hàng kho: ghép PHO01 kiểu bo_qua (như quản lý làm ở Bán hàng iPOS).
  const bq = await duoi(UID.qlA, `select kho_ipos_gan_ma($1, 'PHO01', 'bo_qua', null)`, [cnA.id]);
  ok('Ghép PHO01 = "không phải hàng kho"', bq.loi === null, bq.loi ?? '');
  await doiSoat('Chuẩn bị');
});

// ===========================================================================
await nhom('2 · AI SỬA ĐƯỢC MÓN, ĐỊNH LƯỢNG', async () => {
  for (const [ten, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA], ['Kế toán', UID.keToanA]]) {
    const m = await luuMon(uid, { ten: 'Món thử' });
    ok(`${ten} KHÔNG thêm được món`, m.loi !== null && /không sửa được danh sách món/.test(m.loi), m.loi ?? 'GỌI ĐƯỢC');
    const n = await nhapDl(uid, [{ mon: 'X', mat_hang: 'C-GAU', gram: 100 }], false);
    ok(`${ten} KHÔNG dán được định lượng`, n.loi !== null, n.loi ?? 'GỌI ĐƯỢC');
    const t = await duoi(uid, `select kho_mon_tu_ipos($1)`, [cnA.id]);
    ok(`${ten} KHÔNG lấy được món từ iPOS`, t.loi !== null, t.loi ?? 'GỌI ĐƯỢC');
  }
  const b = await luuMon(UID.qlB, { ten: 'Món của Q1' });
  ok('Quản lý Q7 KHÔNG thêm được món cho Q1', b.loi !== null);
  const may = await duoi(MAY, `select kho_bao_cao_dinh_muc($1, $2::date, $2::date)`, [cnA.id, homNay]);
  ok('Máy iPOS KHÔNG xem được báo cáo định mức', may.loi !== null);
  const noiBo = await duoi(UID.chu, `select * from kho_dinh_muc_tinh($1, $2::date, $2::date)`, [cnA.id, homNay]);
  ok('Không ai gọi thẳng được hàm nội bộ kho_dinh_muc_tinh (có giá vốn)',
     noiBo.loi !== null && /permission denied/i.test(noiBo.loi), noiBo.loi ?? 'GỌI ĐƯỢC');
});

// ===========================================================================
await nhom('3 · MÓN LÀM TAY', async () => {
  const m = await luuMon(UID.qlA, { ten: '  Bò   kho ' });
  ok('Quản lý thêm món "Bò kho" (gộp khoảng trắng)', m.loi === null && m.rows[0].m.ten === 'Bò kho'
     && m.rows[0].m.ten_khong_dau === 'bo kho' && m.rows[0].m.ma_ipos === null && m.rows[0].m.dang_ban === true, m.loi ?? '');
  const trung = await luuMon(UID.qlA, { ten: 'BÒ KHO' });
  ok('Trùng tên (khác hoa thường / dấu) bị từ chối', trung.loi !== null && /Đã có món "Bò kho"/.test(trung.loi), trung.loi ?? '');
  const rong = await luuMon(UID.qlA, { ten: '   ' });
  ok('Tên trống bị từ chối', rong.loi !== null && /Nhập tên món/.test(rong.loi));
  const le = await luuMon(UID.qlA, { ten: 'Gói nạc vai', ma: 'GOITHIT' });
  ok('Mã iPOS của hàng bán thẳng từ quầy (kiểu mon) bị từ chối',
     le.loi !== null && /bán thẳng từ quầy/.test(le.loi), le.loi ?? '');
  const tam = await luuMon(UID.qlA, { ten: 'Món tạm' });
  const sua = await luuMon(UID.qlA, { id: tam.rows[0].m.id, ten: 'Món tạm', dangBan: false });
  ok('Sửa món: tắt "đang bán"', sua.loi === null && sua.rows[0].m.dang_ban === false, sua.loi ?? '');
  const khac = await luuMon(UID.qlB, { id: tam.rows[0].m.id, ten: 'Đổi tên' }, cnB.id);
  ok('Sửa món của chi nhánh khác (đổi p_chi_nhanh_id) bị từ chối', khac.loi !== null);
  const tkB = await duoi(UID.thuKhoB, `select count(*)::int as n from kho_mon where chi_nhanh_id = $1`, [cnA.id]);
  ok('Thủ kho Q7 không đọc được món của Q1', tkB.rows?.[0]?.n === 0);
  const tkA = await duoi(UID.thuKhoA, `select count(*)::int as n from kho_mon where chi_nhanh_id = $1`, [cnA.id]);
  ok('Thủ kho Q1 đọc được danh sách món (không có tiền)', tkA.rows?.[0]?.n === 2);
  const ghi = await duoi(UID.qlA, `insert into kho_mon (chi_nhanh_id, ten) values ($1, 'Ghi thẳng')`, [cnA.id]);
  ok('Không ghi thẳng vào bảng kho_mon được (chỉ qua hàm)', ghi.loi !== null);
});

// ===========================================================================
await nhom('4 · LẤY MÓN TỪ iPOS', async () => {
  const r = await duoi(UID.qlA, `select kho_mon_tu_ipos($1) as kq`, [cnA.id]);
  const kq = r.rows?.[0]?.kq;
  ok('Lấy được: 2 món mới + gắn mã vào "Bò kho" đã có', r.loi === null && kq.tao_moi === 2 && kq.gan_ma === 1,
     r.loi ?? JSON.stringify(kq));
  const { rows } = await db.query(`select ten, ma_ipos from kho_mon where chi_nhanh_id = $1 order by ten`, [cnA.id]);
  const ds = rows.map(x => `${x.ten}=${x.ma_ipos}`).join(', ');
  ok('PHO01 (ghép "không phải hàng kho") → "Phở bò tái"', rows.some(x => x.ten === 'Phở bò tái' && x.ma_ipos === 'PHO01'), ds);
  ok('BOKHO gắn vào món "Bò kho" làm tay (không tạo trùng)', rows.some(x => x.ten === 'Bò kho' && x.ma_ipos === 'BOKHO'), ds);
  ok('NUOC (bán mà chưa ghép) → "Trà đá"', rows.some(x => x.ten === 'Trà đá' && x.ma_ipos === 'NUOC'), ds);
  ok('KHÔNG lấy dòng nhãn cân (CAN) và hàng bán thẳng từ quầy (GOITHIT)',
     !rows.some(x => ['CAN', 'GOITHIT'].includes(x.ma_ipos)), ds);
  const lai = await duoi(UID.qlA, `select kho_mon_tu_ipos($1) as kq`, [cnA.id]);
  ok('Bấm lại: không tạo trùng', lai.rows?.[0]?.kq?.tao_moi === 0 && lai.rows[0].kq.gan_ma === 0, JSON.stringify(lai.rows?.[0]?.kq));
  const b = await duoi(UID.qlB, `select kho_mon_tu_ipos($1) as kq`, [cnB.id]);
  ok('Chi nhánh Q7 (chưa có iPOS) không có món nào', b.loi === null && b.rows[0].kq.tao_moi === 0);
  const trungMa = await luuMon(UID.qlA, { ten: 'Phở đặc biệt', ma: 'PHO01' });
  ok('Mã iPOS đã dùng cho món khác bị từ chối', trungMa.loi !== null && /đã dùng cho món "Phở bò tái"/.test(trungMa.loi), trungMa.loi ?? '');
});

// ===========================================================================
await nhom('5 · DÁN EXCEL ĐỊNH LƯỢNG: XEM TRƯỚC, LỖI TỪNG DÒNG, ÁP DỤNG, CHẠY LẠI', async () => {
  const dung = [
    { dong: 2, mon: 'pho01', mat_hang: 'C-THANNGOAI', gram: '200' },         // mã iPOS, hoa thường khác
    { dong: 3, mon: 'bo kho', mat_hang: 'thit vun', gram: 100 },              // tên không dấu cả hai
    { dong: 4, mon: 'Cơm bò lúc lắc', mat_hang: 'c-nacvai', gram: '150,5' },  // món mới, dấu phẩy
    { dong: 5, mon: 'Cơm  bò lúc lắc', mat_hang: '00101', gram: '20' },       // mã cân 101 = thăn ngoại
  ];
  const sai = [
    { dong: 6, mon: 'Phở bò tái', mat_hang: 'Thịt heo', gram: '100' },
    { dong: 7, mon: 'PHO01', mat_hang: 'C-THANNGOAI', gram: '150' },
    { dong: 8, mon: '', mat_hang: 'C-GAU', gram: '10' },
    { dong: 9, mon: 'Bò kho', mat_hang: 'C-GAU', gram: 'một trăm' },
    { dong: 10, mon: 'Bò kho', mat_hang: 'C-GAU', gram: '0' },
  ];
  const xt = await nhapDl(UID.qlA, [...dung, ...sai], false);
  const kq = xt.rows?.[0]?.kq;
  ok('Xem trước chạy được: 9 dòng, 5 lỗi, 1 món mới', xt.loi === null && kq.so_dong === 9 && kq.so_loi === 5
     && kq.so_mon_moi === 1 && kq.da_ap_dung === false, xt.loi ?? JSON.stringify(kq));
  const d = Object.fromEntries((kq?.dong ?? []).map(x => [x.stt, x]));
  ok('Dòng 2: khớp món theo mã iPOS, mặt hàng theo mã', d[2]?.ok && d[2].mon.ten === 'Phở bò tái'
     && d[2].mat_hang.ma === 'C-THANNGOAI' && Number(d[2].gram) === 200 && d[2].thay_doi === 'them', JSON.stringify(d[2]));
  ok('Dòng 3: khớp món và mặt hàng theo tên không dấu', d[3]?.ok && d[3].mon.ten === 'Bò kho' && d[3].mat_hang.ma === 'P-VUN');
  ok('Dòng 4: món chưa có → tạo món mới khi áp dụng; "150,5" → 150,5 g',
     d[4]?.ok && d[4].tao_mon_moi === true && d[4].mon.id === null && Number(d[4].gram) === 150.5, JSON.stringify(d[4]));
  ok('Dòng 5: mã cân "00101" → thăn ngoại; cùng món mới (khác khoảng trắng)',
     d[5]?.ok && d[5].mat_hang.ma === 'C-THANNGOAI' && d[5].tao_mon_moi, JSON.stringify(d[5]));
  ok('Dòng 6: mặt hàng không có → câu lỗi ghi rõ dòng, món, mặt hàng',
     !d[6]?.ok && d[6].loi === 'Dòng 6 (Phở bò tái): không tìm thấy mặt hàng "Thịt heo" — ghi đúng mã, mã cân hoặc tên', d[6]?.loi);
  ok('Dòng 7: trùng dòng 2 (cùng món, cùng mặt hàng)', !d[7]?.ok && /trùng với dòng 2/.test(d[7].loi), d[7]?.loi);
  ok('Dòng 8: thiếu món', !d[8]?.ok && /Dòng 8: thiếu tên hoặc mã món/.test(d[8].loi), d[8]?.loi);
  ok('Dòng 9: gram không phải số', !d[9]?.ok && /gram "một trăm" không phải số/.test(d[9].loi), d[9]?.loi);
  ok('Dòng 10: gram 0', !d[10]?.ok && /lớn hơn 0/.test(d[10].loi), d[10]?.loi);
  const { rows: [{ n: dl0 }] } = await db.query(`select count(*)::int as n from kho_dinh_luong`);
  ok('Xem trước KHÔNG ghi gì', dl0 === 0 && !(await monTheoTen('Cơm bò lúc lắc')));

  const loi = await nhapDl(UID.qlA, [...dung, ...sai], true);
  ok('Áp dụng khi còn lỗi → từ chối cả bảng, nói số dòng lỗi', loi.loi !== null && /Còn 5 dòng lỗi/.test(loi.loi), loi.loi ?? '');
  const { rows: [{ n: dl1 }] } = await db.query(`select count(*)::int as n from kho_dinh_luong`);
  ok('…và không ghi dòng nào', dl1 === 0);

  const ap = await nhapDl(UID.qlA, dung, true);
  const a = ap.rows?.[0]?.kq;
  ok('Áp dụng bảng đúng: 4 dòng thêm, tạo 1 món', ap.loi === null && a.them === 4 && a.da_tao_mon === 1 && a.da_ap_dung,
     ap.loi ?? JSON.stringify(a));
  const com = await monTheoTen('Cơm bò lúc lắc');
  ok('Món mới "Cơm bò lúc lắc" có 2 mặt hàng', com && await dinhLuong(com.id) === 'C-NACVAI:150.5,C-THANNGOAI:20');
  ok('Phở bò tái: thăn ngoại 200 g', await dinhLuong((await monTheoTen('Phở bò tái')).id) === 'C-THANNGOAI:200');

  const lai = await nhapDl(UID.qlA, dung, true);
  const b = lai.rows?.[0]?.kq;
  ok('Áp dụng lại cùng bảng: không đổi gì, không tạo món', lai.loi === null && b.giu === 4 && b.them === 0
     && b.sua === 0 && b.da_tao_mon === 0 && b.so_mon_moi === 0, lai.loi ?? JSON.stringify(b));
  const { rows: [{ n: soMon }] } = await db.query(`select count(*)::int as n from kho_mon where chi_nhanh_id = $1`, [cnA.id]);
  ok('Vẫn 5 món (không trùng)', soMon === 5, `${soMon}`);

  const doi = await nhapDl(UID.qlA, [{ mon: 'Cơm bò lúc lắc', mat_hang: 'C-THANNGOAI', gram: 25 }], true);
  ok('Dán lại một dòng đổi gram → sửa, dòng khác của món giữ nguyên',
     doi.rows?.[0]?.kq?.sua === 1 && await dinhLuong(com.id) === 'C-NACVAI:150.5,C-THANNGOAI:25', doi.loi ?? '');

  // Hai mặt hàng đang dùng cùng tên → phải ghi mã.
  await db.query(`insert into kho_mat_hang (ma, ten, loai, dem_goi) values ('P-VUN2', 'Thịt vụn', 'phu_pham', false)`);
  const mo = await nhapDl(UID.qlA, [{ mon: 'Bò kho', mat_hang: 'Thịt Vụn', gram: 100 }], false);
  ok('Hai mặt hàng cùng tên → lỗi, bảo ghi mã', /có 2 mặt hàng tên "Thịt Vụn" — ghi mã mặt hàng/.test(mo.rows?.[0]?.kq?.dong?.[0]?.loi ?? ''),
     JSON.stringify(mo.rows?.[0]?.kq?.dong));
  await db.query(`delete from kho_mat_hang where ma = 'P-VUN2'`);

  const b2 = await nhapDl(UID.qlB, dung, false, cnA.id);
  ok('Quản lý Q7 KHÔNG dán vào Q1', b2.loi !== null);
  const rongDl = await nhapDl(UID.qlA, [], false);
  ok('Bảng trống → câu nhắc dán', rongDl.loi !== null && /dán bảng/.test(rongDl.loi));
});

// ===========================================================================
await nhom('6 · SỬA ĐỊNH LƯỢNG MỘT MÓN (THAY TOÀN BỘ)', async () => {
  const bo = await monTheoTen('Bò kho');
  const trung = await luuDl(UID.qlA, bo.id, [{ mat_hang_id: MH['P-VUN'].id, gram: 100 }, { mat_hang_id: MH['P-VUN'].id, gram: 5 }]);
  ok('Một mặt hàng hai lần bị từ chối', trung.loi !== null && /có hai lần/.test(trung.loi), trung.loi ?? '');
  const khong = await luuDl(UID.qlA, bo.id, [{ mat_hang_id: MH['P-VUN'].id, gram: 0 }]);
  ok('Gram 0 bị từ chối', khong.loi !== null && /gram phải lớn hơn 0/.test(khong.loi));
  const chu = await luuDl(UID.qlA, bo.id, [{ mat_hang_id: MH['P-VUN'].id, gram: '100' }]);
  ok('Gram dạng chữ bị từ chối', chu.loi !== null);
  const la = await luuDl(UID.qlA, bo.id, [{ mat_hang_id: MH['P-VUN'].id, gram: 100, gia_von_kg: 1 }]);
  ok('Trường lạ bị từ chối', la.loi !== null && /không được nhận/.test(la.loi));
  const tk = await luuDl(UID.thuKhoA, bo.id, [{ mat_hang_id: MH['P-VUN'].id, gram: 90 }]);
  ok('Thủ kho KHÔNG sửa được định lượng', tk.loi !== null);
  const hai = await luuDl(UID.qlA, bo.id, [{ mat_hang_id: MH['P-VUN'].id, gram: 90 }, { mat_hang_id: MH['P-MO'].id, gram: 10.5 }]);
  ok('Lưu 2 dòng', hai.loi === null && hai.rows[0].kq.so_dong === 2 && await dinhLuong(bo.id) === 'P-MO:10.5,P-VUN:90', hai.loi ?? '');
  const xoa = await luuDl(UID.qlA, bo.id, []);
  ok('Mảng rỗng = xóa hết', xoa.loi === null && await dinhLuong(bo.id) === '');
  const lai = await luuDl(UID.qlA, bo.id, [{ mat_hang_id: MH['P-VUN'].id, gram: 100 }]);
  ok('Đặt lại Bò kho: thịt vụn 100 g', lai.loi === null && await dinhLuong(bo.id) === 'P-VUN:100');
});

// ===========================================================================
await nhom('7 · XUẤT BẾP + CHUYỂN BẾP KHI PHA LÓC', async () => {
  const xb = await xuat(UID.thuKhoA, { loai: 'xuat_bep', tu: viTri.kho,
    dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, lo_id: loThan.id, so_goi: 20 }] });
  ok('Thủ kho xuất bếp 20 gói thăn ngoại (10 kg)', xb.loi === null, xb.loi ?? '');

  const p = await luuPhien(UID.thuKhoA, { matHang: MH['T-THANNGOAI'].id,
    vao: [{ lo_id: loTang.id, vi_tri_id: viTri.kho }],
    ra: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 3, so_goi: 6, xu_ly: 'nhap_kho', vi_tri_id: viTri.kho },
         { mat_hang_id: MH['P-VUN'].id, so_kg: 1, xu_ly: 'chuyen_bep' },
         { mat_hang_id: MH['P-MO'].id, so_kg: 0.5, xu_ly: 'bo' }] });
  ok('Lưu phiên pha: 1 kg thịt vụn chuyển thẳng bếp', p.loi === null, p.loi ?? '');
  phienId = p.rows?.[0]?.phien_id;
  const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2) as cau`, [phienId, p.rows?.[0]?.phien_ban_moi]);
  ok('Chốt phiên pha', c.loi === null, c.loi ?? '');
  const { rows: [{ n }] } = await db.query(`select count(*)::int as n from kho_so_cai
    where chung_tu_loai = 'phien_pha' and loai = 'xuat_bep' and mat_hang_id = $1`, [MH['P-VUN'].id]);
  ok('Sổ có dòng xuat_bep của phiên pha (chuyển bếp)', n === 1);
  await doiSoat('Sau xuất bếp, pha lóc');
});

// ===========================================================================
await nhom('8 · BÁO CÁO ĐỐI CHIẾU ĐỊNH MỨC', async () => {
  const tu = await ngaySau(-1);
  const r = await baoCao(UID.qlA, tu, homNay);
  ok('Quản lý xem được báo cáo', r.loi === null && r.rows.length >= 3, r.loi ?? JSON.stringify(r.rows));
  const than = dongMh(r.rows, 'C-THANNGOAI');
  ok('Thăn ngoại: bếp nhận 10 kg, bán 40 phở × 200 g = 8 kg lẽ ra dùng', Number(than?.kg_xuat_bep) === 10
     && Number(than.kg_ly_thuyet) === 8 && Number(than.so_suat) === 40, JSON.stringify(than));
  ok('…lệch +2 kg = +25%, vượt ngưỡng 10%', Number(than?.chenh_kg) === 2 && Number(than.chenh_pt) === 25
     && than.vuot_nguong === true && Number(than.nguong_pt) === 10, JSON.stringify(than));
  ok('…tiền lệch = 2 kg × 500.000 đ (giá vốn TB phần bếp nhận)', Number(than?.tien_chenh) === 1000000, `${than?.tien_chenh}`);
  const vun = dongMh(r.rows, 'P-VUN');
  ok('Thịt vụn: chuyển bếp khi pha 1 kg được tính; 8 bò kho × 100 g = 0,8 kg', Number(vun?.kg_xuat_bep) === 1
     && Number(vun.kg_ly_thuyet) === 0.8 && Number(vun.chenh_pt) === 25, JSON.stringify(vun));
  ok('Thịt vụn có tiền lệch (quản lý)', vun?.tien_chenh !== null && vun?.tien_chenh !== undefined);
  const nac = dongMh(r.rows, 'C-NACVAI');
  ok('Nạc vai (trong định lượng, chưa bán, bếp chưa nhận): 0 / 0, không đánh giá lệch',
     nac && Number(nac.kg_xuat_bep) === 0 && Number(nac.kg_ly_thuyet) === 0 && nac.chenh_pt === null && nac.vuot_nguong === false,
     JSON.stringify(nac));
  ok('Món có bán mà chưa định lượng: 1 (Trà đá); đã có bán', r.rows.every(x => x.so_mon_chua_dinh_luong === 1 && x.chua_co_ban === false),
     JSON.stringify(r.rows.map(x => [x.ma, x.so_mon_chua_dinh_luong, x.chua_co_ban])));
  ok('Lệch lớn nhất lên đầu', r.rows[0].ma === 'C-THANNGOAI');
  ok('HĐ hủy (100 phở) và dòng hàng bán thẳng không được đếm', Number(than?.so_suat) === 40);

  // Dòng đã trừ kho ở quầy (da_ghi) cùng mã món: không đếm — bếp không nhận nó.
  const { rows: [h] } = await db.query(`select id from kho_ipos_hoa_don where chi_nhanh_id = $1 and ma_hd = 'HD1'`, [cnA.id]);
  await db.query(`insert into kho_ipos_dong (hoa_don_id, chi_nhanh_id, khoa_dong, thoi_diem_ban, ma_ipos, so_goi, trang_thai)
                  values ($1, $2, '9', now() - interval '1 hour', 'PHO01', 1000, 'da_ghi')`, [h.id, cnA.id]);
  const r2 = await baoCao(UID.qlA, tu, homNay);
  ok('Dòng da_ghi cùng mã món không làm đổi số suất', Number(dongMh(r2.rows, 'C-THANNGOAI')?.so_suat) === 40);

  const dai = await baoCao(UID.qlA, await ngaySau(-12), homNay);
  ok('Kỳ 13 ngày: có cả HĐ 10 ngày trước → 90 phở × 200 g = 18 kg',
     Number(dongMh(dai.rows, 'C-THANNGOAI')?.kg_ly_thuyet) === 18, JSON.stringify(dongMh(dai.rows, 'C-THANNGOAI')));

  // Kỳ bếp KHÔNG nhận thăn ngoại mà vẫn bán 50 phở (10 ngày trước): lệch âm,
  // tiền lệch lấy giá vốn TB các lô của mặt hàng — không để trống.
  const truoc = await baoCao(UID.qlA, await ngaySau(-12), await ngaySau(-2));
  const thanTruoc = dongMh(truoc.rows, 'C-THANNGOAI');
  ok('Kỳ bếp không nhận: thăn ngoại 0 kg bếp nhận, 10 kg lẽ ra dùng, lệch −10 kg',
     Number(thanTruoc?.kg_xuat_bep) === 0 && Number(thanTruoc?.kg_ly_thuyet) === 10 && Number(thanTruoc?.chenh_kg) === -10,
     JSON.stringify(thanTruoc));
  ok('…tiền lệch vẫn có (giá vốn TB các lô), số âm', thanTruoc?.tien_chenh !== null && Number(thanTruoc?.tien_chenh) < 0,
     `${thanTruoc?.tien_chenh}`);
  const tkTruoc = await baoCao(UID.thuKhoA, await ngaySau(-12), await ngaySau(-2));
  ok('…thủ kho vẫn không thấy tiền ở kỳ đó', tkTruoc.loi === null && tkTruoc.rows.every(x => x.tien_chenh === null));

  const cu = await baoCao(UID.qlA, await ngaySau(-40), await ngaySau(-30));
  ok('Kỳ chưa có bán: chua_co_ban, kg lẽ ra dùng 0, không đánh giá lệch',
     cu.loi === null && cu.rows.length > 0 && cu.rows.every(x => x.chua_co_ban && Number(x.kg_ly_thuyet) === 0 && !x.vuot_nguong),
     cu.loi ?? JSON.stringify(cu.rows));

  for (const [ten, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA]]) {
    const t = await baoCao(uid, tu, homNay);
    ok(`${ten} xem được kg, không thấy tiền (tien_chenh null mọi dòng)`,
       t.loi === null && t.rows.length === r.rows.length && t.rows.every(x => x.tien_chenh === null)
       && Number(dongMh(t.rows, 'C-THANNGOAI')?.chenh_pt) === 25, t.loi ?? JSON.stringify(t.rows));
  }
  const kt = await baoCao(UID.keToanA, tu, homNay);
  ok('Kế toán (xem giá) thấy tiền lệch', Number(dongMh(kt.rows, 'C-THANNGOAI')?.tien_chenh) === 1000000);
  const tkB = await baoCao(UID.thuKhoB, tu, homNay);
  ok('Thủ kho Q7 KHÔNG xem được báo cáo Q1', tkB.loi !== null);
  const nguoc = await baoCao(UID.qlA, homNay, tu);
  ok('Từ ngày sau đến ngày → câu báo dễ hiểu', nguoc.loi !== null && /Chọn khoảng ngày/.test(nguoc.loi));
  const qua = await baoCao(UID.qlA, await ngaySau(-400), homNay);
  ok('Khoảng quá 1 năm bị từ chối', qua.loi !== null && /tối đa 1 năm/.test(qua.loi));
  const b = await baoCao(UID.qlB, tu, homNay, cnB.id);
  ok('Chi nhánh Q7 chưa có định lượng: không dòng nào', b.loi === null && b.rows.length === 0);
  await doiSoat('Sau báo cáo (không trừ kho theo định lượng)');
});

// ===========================================================================
await nhom('9 · MỞ LẠI PHIÊN PHA: PHẦN CHUYỂN BẾP BỊ TRỪ LẠI', async () => {
  const tu = await ngaySau(-1);
  const mo = await duoi(UID.thuKhoA, `select kho_mo_lai_phien_pha($1, 'Cân lại thịt vụn') as cau`, [phienId]);
  ok('Mở lại phiên pha', mo.loi === null, mo.loi ?? '');
  const r = await baoCao(UID.qlA, tu, homNay);
  ok('Thịt vụn: bếp nhận về 0 (dòng đảo ngược trừ lại)', Number(dongMh(r.rows, 'P-VUN')?.kg_xuat_bep) === 0,
     JSON.stringify(dongMh(r.rows, 'P-VUN')));
  const { rows: [ph] } = await db.query(`select phien_ban from kho_phien_pha where id = $1`, [phienId]);
  const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2) as cau`, [phienId, ph.phien_ban]);
  ok('Chốt lại', c.loi === null, c.loi ?? '');
  const r2 = await baoCao(UID.qlA, tu, homNay);
  ok('Thịt vụn: lại 1 kg', Number(dongMh(r2.rows, 'P-VUN')?.kg_xuat_bep) === 1);
  await doiSoat('Sau mở lại, chốt lại phiên pha');
});

// ===========================================================================
await nhom('10 · CẢNH BÁO dinh_muc_lech (7 NGÀY, NGƯỠNG nguong_dinh_muc_pt)', async () => {
  const e = await suKien(UID.qlA, 'dinh_muc_lech');
  const than = e.find(x => x.ma === 'C-THANNGOAI');
  ok('Quản lý: 2 mặt hàng lệch 25% > 10% (thăn ngoại, thịt vụn)', e.length === 2 && !!than, JSON.stringify(e));
  ok('Sự kiện mang lệch % và lệch kg, nhóm Nhắc nhở', Number(than?.so) === 25 && Number(than?.phu) === 2
     && than?.nhom === 'nhac_nho' && than?.ref_id === MH['C-THANNGOAI'].id, JSON.stringify(than));
  ok('Số đỏ quản lý: dinh_muc_lech = 2', (await demViec(UID.qlA)).dinh_muc_lech === 2);
  ok('Chủ cũng thấy', (await suKien(UID.chu, 'dinh_muc_lech')).length === 2);
  for (const [ten, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA], ['Kế toán', UID.keToanA]]) {
    ok(`${ten} không nhận cảnh báo, không có số đỏ`, (await suKien(uid, 'dinh_muc_lech')).length === 0
       && !('dinh_muc_lech' in await demViec(uid)));
  }

  const dat = async pt => duoi(UID.qlA, `select kho_luu_nguong($1, $2::jsonb)`, [cnA.id, JSON.stringify({ nguong_dinh_muc_pt: pt })]);
  await dat(30);
  ok('Ngưỡng 30% (lệch 25% dưới ngưỡng) → không cảnh báo', (await suKien(UID.qlA, 'dinh_muc_lech')).length === 0
     && (await demViec(UID.qlA)).dinh_muc_lech === 0);
  const bc = await baoCao(UID.qlA, await ngaySau(-1), homNay);
  ok('Báo cáo theo ngưỡng mới: không dòng nào vượt', bc.rows.every(x => x.vuot_nguong === false && Number(x.nguong_pt) === 30));
  await dat(25);
  ok('Ngưỡng 25% (bằng đúng) → không cảnh báo', (await suKien(UID.qlA, 'dinh_muc_lech')).length === 0);
  await dat(24.5);
  ok('Ngưỡng 24,5% → cảnh báo lại', (await suKien(UID.qlA, 'dinh_muc_lech')).length === 2);

  // Định lượng đúng thực tế: 40 phở × 250 g = 10 kg = bếp nhận → hết lệch.
  const pho = await monTheoTen('Phở bò tái');
  await luuDl(UID.qlA, pho.id, [{ mat_hang_id: MH['C-THANNGOAI'].id, gram: 250 }]);
  const e2 = await suKien(UID.qlA, 'dinh_muc_lech');
  ok('Sửa định lượng phở 250 g → 10 kg = bếp nhận: thăn ngoại hết lệch', !e2.some(x => x.ma === 'C-THANNGOAI') && e2.length === 1,
     JSON.stringify(e2));
  await luuDl(UID.qlA, pho.id, [{ mat_hang_id: MH['C-THANNGOAI'].id, gram: 200 }]);

  const b = await duoi(UID.qlB, `select kho_thong_bao($1, 300) as v`, [cnB.id]);
  ok('Chi nhánh Q7 không có cảnh báo định mức', !(b.rows?.[0]?.v?.su_kien ?? []).some(x => x.khoa === 'dinh_muc_lech'));
  await dat(10);
  await doiSoat('Cuối cùng');
});

// ===========================================================================
await nhom('11 · CƠM NHÂN VIÊN KHÔNG TÍNH VÀO ĐỊNH MỨC (0044)', async () => {
  const tu = await ngaySau(-1);
  const lyDo = async ten => (await db.query(
    `select id, tinh_dinh_muc from kho_ly_do where loai = 'xuat_bep' and ten = $1`, [ten])).rows[0];
  const comNv = await lyDo('Cơm nhân viên');
  const lamMon = await lyDo('Làm món ở bếp');
  ok('Lý do mặc định "Cơm nhân viên" (kho_khoi_tao): không tính định mức', comNv?.tinh_dinh_muc === false, JSON.stringify(comNv));
  ok('Lý do "Làm món ở bếp": tính định mức', lamMon?.tinh_dinh_muc === true);
  const { rows: khac } = await db.query(`select loai, ten from kho_ly_do where not tinh_dinh_muc`);
  ok('Chỉ đúng một lý do không tính (Cơm nhân viên)', khac.length === 1, JSON.stringify(khac));

  // Bò kho (8 suất) dùng thêm nạc vai 250 g → lẽ ra dùng 2 kg.
  const bo = await monTheoTen('Bò kho');
  const dl = await luuDl(UID.qlA, bo.id, [{ mat_hang_id: MH['P-VUN'].id, gram: 100 }, { mat_hang_id: MH['C-NACVAI'].id, gram: 250 }]);
  ok('Bò kho: thịt vụn 100 g + nạc vai 250 g', dl.loi === null, dl.loi ?? '');
  const [loNac] = await nhapHang([{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 10, so_kg: 5, don_gia_kg: 300000,
                                    han_dung: await ngaySau(5) }], viTri.kho);
  const xuatLd = (ldId, soGoi) => duoi(UID.thuKhoA, `
    select * from kho_tao_phieu_xuat(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_loai => 'xuat_bep', p_vi_tri_id => $3, p_vi_tri_den_id => null,
      p_ly_do_id => $4, p_ghi_chu => null, p_anh => '{}'::text[], p_dong => $5::jsonb)`,
    [cnA.id, maGui(), viTri.kho, ldId, JSON.stringify([{ mat_hang_id: MH['C-NACVAI'].id, lo_id: loNac.id, so_goi: soGoi }])]);
  const x1 = await xuatLd(lamMon.id, 4);
  ok('Thủ kho xuất bếp 4 gói nạc vai (2 kg), lý do "Làm món ở bếp"', x1.loi === null, x1.loi ?? '');
  const x2 = await xuatLd(comNv.id, 2);
  ok('Thủ kho xuất bếp 2 gói nạc vai (1 kg), lý do "Cơm nhân viên"', x2.loi === null, x2.loi ?? '');
  const { rows: [so] } = await db.query(`select -sum(so_kg)::numeric as kg from kho_so_cai
    where loai = 'xuat_bep' and mat_hang_id = $1 and chung_tu_loai = 'phieu_xuat'`, [MH['C-NACVAI'].id]);
  ok('Sổ kho vẫn trừ đủ 3 kg (cơm nhân viên vẫn là thịt ra khỏi kho)', Number(so.kg) === 3, `${so.kg}`);

  const r = await baoCao(UID.qlA, tu, homNay);
  const nac = dongMh(r.rows, 'C-NACVAI');
  ok('Báo cáo: nạc vai bếp nhận 2 kg (không tính 1 kg cơm nhân viên), lẽ ra dùng 2 kg, lệch 0%',
     Number(nac?.kg_xuat_bep) === 2 && Number(nac?.kg_ly_thuyet) === 2 && Number(nac?.chenh_pt) === 0 && nac?.vuot_nguong === false,
     JSON.stringify(nac));
  ok('Thăn ngoại (xuất bếp không lý do) vẫn 10 kg; thịt vụn chuyển bếp khi pha vẫn 1 kg',
     Number(dongMh(r.rows, 'C-THANNGOAI')?.kg_xuat_bep) === 10 && Number(dongMh(r.rows, 'P-VUN')?.kg_xuat_bep) === 1);
  ok('Cảnh báo dinh_muc_lech KHÔNG bắn cho nạc vai vì cơm nhân viên',
     !(await suKien(UID.qlA, 'dinh_muc_lech')).some(x => x.ma === 'C-NACVAI'));

  const tk = await duoi(UID.thuKhoA, `update kho_ly_do set tinh_dinh_muc = true where id = $1`, [comNv.id]);
  ok('Thủ kho KHÔNG bật lại được (không đổi dòng nào)', (tk.loi !== null || tk.rows?.length === 0)
     && (await lyDo('Cơm nhân viên')).tinh_dinh_muc === false, tk.loi ?? '');

  const bat = await duoi(UID.qlA, `update kho_ly_do set tinh_dinh_muc = true where id = $1`, [comNv.id]);
  ok('Quản lý bật lại "Tính vào định mức bếp" cho Cơm nhân viên', bat.loi === null && (await lyDo('Cơm nhân viên')).tinh_dinh_muc === true,
     bat.loi ?? '');
  const r2 = await baoCao(UID.qlA, tu, homNay);
  const nac2 = dongMh(r2.rows, 'C-NACVAI');
  ok('…bếp nhận nạc vai thành 3 kg, lệch +50%, vượt ngưỡng', Number(nac2?.kg_xuat_bep) === 3 && Number(nac2?.chenh_pt) === 50
     && nac2?.vuot_nguong === true, JSON.stringify(nac2));
  ok('…cảnh báo dinh_muc_lech có nạc vai', (await suKien(UID.qlA, 'dinh_muc_lech')).some(x => x.ma === 'C-NACVAI'));
  const tkr = await baoCao(UID.thuKhoA, tu, homNay);
  ok('…thủ kho vẫn không thấy tiền', tkr.loi === null && tkr.rows.every(x => x.tien_chenh === null));

  await duoi(UID.qlA, `update kho_ly_do set tinh_dinh_muc = false where id = $1`, [comNv.id]);
  ok('Tắt lại → 2 kg, hết cảnh báo nạc vai', Number(dongMh((await baoCao(UID.qlA, tu, homNay)).rows, 'C-NACVAI')?.kg_xuat_bep) === 2
     && !(await suKien(UID.qlA, 'dinh_muc_lech')).some(x => x.ma === 'C-NACVAI'));

  // Lý do dùng chung toàn thương hiệu. Quản lý chi nhánh khác thêm "Cơm nhân viên" gõ
  // trên máy Mac (chữ tổ hợp NFD, thừa khoảng trắng) và cố đặt tinh_dinh_muc = true.
  const tenMac = '  Cơm   nhân viên '.normalize('NFD');
  const moi = await duoi(UID.qlB, `insert into kho_ly_do (loai, ten, tinh_dinh_muc) values ('xuat_bep', $1, true)
    returning tinh_dinh_muc`, [tenMac]);
  ok('Thêm lý do Xuất bếp tên "Cơm nhân viên" (khác dạng chữ) → mặc định KHÔNG tính định mức',
     moi.loi === null && moi.rows[0].tinh_dinh_muc === false, moi.loi ?? JSON.stringify(moi.rows));
  const xk = await duoi(UID.qlB, `insert into kho_ly_do (loai, ten) values ('huy', 'Cơm nhân viên') returning tinh_dinh_muc`);
  ok('Lý do loại khác (Hủy) cùng tên → không bị đổi (vẫn true)', xk.loi === null && xk.rows[0].tinh_dinh_muc === true, xk.loi ?? '');
  const tc = await duoi(UID.qlB, `insert into kho_ly_do (loai, ten) values ('xuat_bep', 'Cơm nhân viên ca tối') returning tinh_dinh_muc`);
  ok('Tên chỉ gần giống ("Cơm nhân viên ca tối") → vẫn tính (quản lý tự bỏ tích nếu muốn)',
     tc.loi === null && tc.rows[0].tinh_dinh_muc === true, tc.loi ?? '');
  await doiSoat('Sau xuất bếp cơm nhân viên');
});

process.exit(ketThuc('ĐỊNH LƯỢNG MÓN'));
