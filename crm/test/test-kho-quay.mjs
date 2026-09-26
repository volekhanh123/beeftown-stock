/**
 * BEEFTOWN KHO — Kiểm thử quầy: yêu cầu → mang ra → nhận, đếm quầy cộng dồn, xuất khác (0032, GĐ5b)
 * ================================================================================================
 *
 *     node test/test-kho-quay.mjs
 *
 * Những điều phải đúng tuyệt đối:
 *   · cài đặt "quầy phải bấm nhận" TẮT thì chuyển quầy y như trước;
 *   · BẬT: thủ kho mang ra → hàng nằm ở "Đang mang ra quầy", chưa vào quầy;
 *     NV quầy bấm nhận mới vào; nhận lấy từ chính lô đi đường của phiếu, hạn
 *     gần trước; bấm hai lần không nhận hai lần;
 *   · nhận thiếu → báo quản lý → trả về kho hoặc ghi mất (hao hụt);
 *   · NV quầy tự lấy hàng thì vào thẳng quầy;
 *   · còn hàng đi đường thì không gửi / duyệt kiểm kê quầy được; "Đang mang ra
 *     quầy" không phải chỗ để hàng;
 *   · đếm quầy bằng máy quét: nhiều lượt cộng dồn, phát lại một lượt không cộng
 *     đôi, −1, bỏ lượt, "hết hàng" một chạm; duyệt vẫn ghi BÁN như cũ;
 *   · xuất khác bắt buộc lý do, vào báo cáo;
 *   · NV quầy và thủ kho không thấy tiền ở mọi thứ mới.
 * Cuối mỗi nhóm: kho_doi_soat_ton() phải rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ QUẦY: YÊU CẦU, MANG RA, NHẬN, ĐẾM CỘNG DỒN');
const { db, cnA, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// Khóa tiền — cùng mẫu với test-kho-thu-kho.mjs.
const LA_TIEN = /gia|tien|thanh_tien|gia_von|gia_tri|thue|chi_phi|phai_tra|con_no|da_tra|giam_tru/;
function khoaTien(v, duong = '') {
  const ra = [];
  if (Array.isArray(v)) v.forEach((x, i) => ra.push(...khoaTien(x, `${duong}[${i}]`)));
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (LA_TIEN.test(k)) ra.push(`${duong}.${k}`);
      ra.push(...khoaTien(x, `${duong}.${k}`));
    }
  }
  return ra;
}
// Mọi kết quả NV quầy / thủ kho nhận được từ hàm mới — soát tiền ở nhóm cuối.
const ketQuaNhanVien = [];
async function nv(uid, sql, params = []) {
  const r = await duoi(uid, sql, params);
  if ([UID.nvQuayA, UID.thuKhoA].includes(uid) && r.rows) ketQuaNhanVien.push(r.rows);
  return r;
}

const MH = {};
let viTri = {};
let ncc;
const lyDo = {};

/** Nhập hàng qua đúng luồng (quản lý lập có giá rồi duyệt). Trả các lô theo thứ tự dòng. */
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

function xuat(uid, t) {
  return nv(uid, `
    select * from kho_tao_phieu_xuat(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_loai => $3, p_vi_tri_id => $4, p_vi_tri_den_id => $5,
      p_ly_do_id => $6, p_ghi_chu => $7, p_anh => $8::text[], p_dong => $9::jsonb)`,
    [cnA.id, t.maGui ?? maGui(), t.loai, t.tu, t.den ?? null, t.lyDo ?? null,
     t.ghiChu ?? null, t.anh ?? [], JSON.stringify(t.dong ?? [])]);
}
const nhan = (uid, id, gui, dong = null) =>
  nv(uid, `select kho_nhan_hang_chuyen(p_id => $1, p_ma_gui => $2, p_dong => $3::jsonb) as cau`,
     [id, gui, dong === null ? null : JSON.stringify(dong)]);
const xuLyThieu = (uid, id, cach, lyDo) =>
  duoi(uid, `select kho_xu_ly_chuyen_thieu(p_id => $1, p_cach => $2, p_ly_do => $3) as cau`, [id, cach, lyDo]);
const taoYeuCau = (uid, t) => nv(uid, `
  select * from kho_tao_yeu_cau(p_chi_nhanh_id => $1, p_ma_gui => $2, p_vi_tri_id => $3, p_nguon => $4,
                                p_ghi_chu => $5, p_dong => $6::jsonb)`,
  [cnA.id, t.maGui ?? maGui(), t.viTri ?? null, t.nguon ?? 'tay', t.ghiChu ?? null, JSON.stringify(t.dong ?? [])]);
const chuyenTheoYC = (uid, id, gui, dong = null) => nv(uid, `
  select * from kho_chuyen_theo_yeu_cau(p_id => $1, p_ma_gui => $2, p_vi_tri_id => null, p_dong => $3::jsonb)`,
  [id, gui, dong === null ? null : JSON.stringify(dong)]);
const goiY = uid => nv(uid, `select * from kho_goi_y_ra_quay(p_chi_nhanh_id => $1, p_vi_tri_id => null)`, [cnA.id]);

const phieu = async id => (await db.query(`select * from kho_phieu_xuat where id = $1`, [id])).rows[0];
const yeuCau = async id => (await db.query(`select * from kho_yeu_cau_quay where id = $1`, [id])).rows[0];
const ton = async (loId, vt) => {
  const r = (await db.query(`select so_kg, so_goi from kho_ton where lo_id = $1 and vi_tri_id = $2`, [loId, vt])).rows[0];
  return r ? { kg: Number(r.so_kg), goi: r.so_goi } : { kg: 0, goi: 0 };
};
const tonHang = async (ma, vt) => {
  const r = (await db.query(`select coalesce(sum(so_goi), 0)::int as goi, coalesce(sum(so_kg), 0) as kg
    from kho_ton where mat_hang_id = $1 and vi_tri_id = $2`, [MH[ma].id, vt])).rows[0];
  return { goi: r.goi, kg: Number(r.kg) };
};
const demViec = async uid => (await duoi(uid, `select kho_dem_viec($1) as v`, [cnA.id])).rows?.[0]?.v ?? {};
const suKien = async (uid, khoa) =>
  ((await nv(uid, `select kho_thong_bao($1, 300) as v`, [cnA.id])).rows?.[0]?.v?.su_kien ?? [])
    .filter(e => e.khoa === khoa);

// Nhãn cân mẫu 2XCCCCCWWWWWK: "20" + mã cân 5 số + gram 5 số + số kiểm tra.
function nhanCan(maCan, gram) {
  const s = '20' + String(maCan).padStart(5, '0') + String(gram).padStart(5, '0');
  let t = 0;
  for (let i = 0; i < 12; i++) t += (s.charCodeAt(i) - 48) * (i % 2 === 0 ? 1 : 3);
  return s + ((10 - (t % 10)) % 10);
}

// Kiểm kê
const kk = async id => (await db.query(`select * from kho_kiem_ke where id = $1`, [id])).rows[0];
const dongKK = async id => (await db.query(`
  select d.*, m.ma from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
  where d.kiem_ke_id = $1 order by d.thu_tu`, [id])).rows;
const dongMon = async (id, ma) => (await dongKK(id)).find(d => d.ma === ma);
const quet = (uid, id, gui, ma) =>
  nv(uid, `select kho_quet_kiem_ke(p_id => $1, p_ma_gui => $2, p_ma => $3::jsonb) as kq`, [id, gui, JSON.stringify(ma)]);
const boQuet = (uid, id, gui, cach, ma = null) =>
  nv(uid, `select kho_bo_quet_kiem_ke(p_id => $1, p_ma_gui => $2, p_cach => $3, p_mat_hang_id => $4) as kq`,
     [id, gui, cach, ma ? MH[ma].id : null]);
/** Lưu số đếm: dem = { MA: {goi, kg, het, them} }; món khác giữ nguyên số đang có. */
async function luuDem(uid, id, dem) {
  const k = await kk(id);
  const dong = (await dongKK(id)).map(d => {
    const x = dem[d.ma] ?? {};
    const r = {
      mat_hang_id: d.mat_hang_id,
      so_goi_dem: x.goi !== undefined ? x.goi : d.so_goi_dem,
      so_kg_dem: x.kg !== undefined ? x.kg : (d.so_kg_dem === null ? null : Number(d.so_kg_dem)),
      xac_nhan_het: x.het ?? d.xac_nhan_het,
    };
    if (x.them !== undefined) r.so_goi_them = x.them;
    return r;
  });
  return duoi(uid, `select kho_luu_kiem_ke($1, $2, null, $3::jsonb) as pb`, [id, k.phien_ban, JSON.stringify(dong)]);
}

let A0, A1, A2, A3, N1, V1;

// ===========================================================================
await nhom('1 · CHUẨN BỊ: VỊ TRÍ ĐI ĐƯỜNG, LÝ DO XUẤT KHÁC, HÀNG Ở KHO', async () => {
  const kt = await duoi(UID.qlA, `select kho_khoi_tao($1) as n`, [cnA.id]);
  ok('Quản lý khởi tạo kho', kt.loi === null && kt.rows[0].n > 0, kt.loi ?? '');
  const lai = await duoi(UID.qlA, `select kho_khoi_tao($1) as n`, [cnA.id]);
  ok('Khởi tạo lại không tạo thêm gì', lai.rows?.[0]?.n === 0, `${lai.rows?.[0]?.n}`);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  ok('Có vị trí "Đang mang ra quầy" (1 cho mỗi chi nhánh)', !!viTri.dang_chuyen && viTri.kho && viTri.quay && viTri.cho_huy);
  const { rows: [{ ten }] } = await db.query(`select ten from kho_vi_tri where id = $1`, [viTri.dang_chuyen]);
  ok('Tên dễ hiểu: "Đang mang ra quầy"', ten === 'Đang mang ra quầy', ten);
  for (const r of (await db.query(`select * from kho_ly_do`)).rows) lyDo[`${r.loai}:${r.ten}`] = r.id;
  ok('Có 4 lý do xuất khác mặc định',
     ['Dùng nội bộ', 'Tặng khách', 'Hàng mẫu', 'Khác'].every(t => lyDo[`xuat_khac:${t}`]));
  const { rows: [cd] } = await db.query(`select chuyen_quay_can_nhan from kho_cai_dat where chi_nhanh_id = $1`, [cnA.id]);
  ok('Mặc định: quầy KHÔNG phải bấm nhận (như trước)', cd.chuyen_quay_can_nhan === false);

  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC A') returning id`)).rows[0].id;
  await db.query(`update kho_mat_hang set ma_can = '101', quay_toi_thieu_goi = 3, quay_toi_da_goi = 6 where ma = 'C-THANNGOAI'`);
  await db.query(`update kho_mat_hang set ma_can = '102', quay_toi_thieu_goi = 2 where ma = 'C-NACVAI'`);
  await db.query(`update kho_mat_hang set ma_can = '201', ton_toi_thieu_kg = 1 where ma = 'P-VUN'`);
  const sai = await duoi(UID.qlA, `update kho_mat_hang set quay_toi_thieu_goi = 5, quay_toi_da_goi = 2 where ma = 'C-GAU'`);
  ok('Tối đa ở quầy nhỏ hơn tối thiểu bị từ chối', sai.loi !== null);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;

  [A0, A1, A2, A3] = await nhapHang([
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2, so_kg: 1, don_gia_kg: 700000, han_dung: await ngaySau(-1) },
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4, so_kg: 2, don_gia_kg: 700000, han_dung: await ngaySau(1) },
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4, so_kg: 2.4, don_gia_kg: 700000, han_dung: await ngaySau(2) },
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 10, so_kg: 5, don_gia_kg: 700000, han_dung: await ngaySau(5) },
  ], viTri.kho);
  [N1] = await nhapHang([{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 6, so_kg: 3, don_gia_kg: 400000, han_dung: await ngaySau(2) }], viTri.kho);
  [V1] = await nhapHang([{ mat_hang_id: MH['P-VUN'].id, so_kg: 3, don_gia_kg: 80000, han_dung: await ngaySau(2) }], viTri.kho);
  ok('Có hàng ở kho: 4 lô thăn (1 lô hết hạn), nạc vai, thịt vụn', A0 && A1 && A2 && A3 && N1 && V1);
  await doiSoat('Sau chuẩn bị');
});

// ===========================================================================
await nhom('2 · CÀI ĐẶT TẮT → CHUYỂN QUẦY NHƯ CŨ', async () => {
  const c = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                       dong: [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 1 }] });
  const p = await phieu(c.rows?.[0]?.phieu_id);
  ok('Thủ kho chuyển ra quầy: ghi sổ ngay (da_ghi)', c.loi === null && p.trang_thai === 'da_ghi', c.loi ?? p?.trang_thai);
  ok('Hàng vào thẳng quầy, không qua "Đang mang ra quầy"',
     (await ton(N1.id, viTri.quay)).goi === 1 && (await ton(N1.id, viTri.dang_chuyen)).goi === 0);
  await doiSoat('Cài đặt tắt');
});

// ===========================================================================
let YC1;
await nhom('3 · GỢI Ý MANG RA, YÊU CẦU CỦA QUẦY, BẬT CÀI ĐẶT', async () => {
  const g = await goiY(UID.nvQuayA);
  const gy = Object.fromEntries((g.rows ?? []).map(r => [r.ma, r]));
  ok('NV quầy xem được gợi ý', g.loi === null, g.loi ?? '');
  ok('Thăn cắt lát: quầy 0 gói < 3 → đề nghị 6 (đủ tối đa)',
     gy['C-THANNGOAI']?.so_goi_quay === 0 && gy['C-THANNGOAI'].so_goi_de_nghi === 6, JSON.stringify(gy['C-THANNGOAI']));
  ok('Gợi ý chỉ đếm hàng còn hạn ở kho (lô hết hạn không tính)', gy['C-THANNGOAI']?.so_goi_kho === 18);
  ok('Nạc vai: quầy 1 < 2, không có tối đa → đề nghị 1', gy['C-NACVAI']?.so_goi_de_nghi === 1, JSON.stringify(gy['C-NACVAI']));
  ok('Thịt vụn (theo kg): dưới 1 kg → đề nghị 1 kg', Number(gy['P-VUN']?.so_kg_de_nghi) === 1 && gy['P-VUN'].so_goi_de_nghi === null,
     JSON.stringify(gy['P-VUN']));
  ok('Món không đặt mức thì không có trong gợi ý', !gy['C-GAU']);

  const kt = await taoYeuCau(UID.keToanA, { dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('Kế toán KHÔNG gửi yêu cầu được', kt.loi !== null);
  const rong = await taoYeuCau(UID.nvQuayA, { dong: [] });
  ok('Yêu cầu không có món bị từ chối', rong.loi !== null && /chưa có món/.test(rong.loi), rong.loi ?? '');
  const trung = await taoYeuCau(UID.nvQuayA, { dong: [
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }, { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2 }] });
  ok('Món nhập hai lần bị từ chối', trung.loi !== null && /hai lần/.test(trung.loi), trung.loi ?? '');
  const khongGoi = await taoYeuCau(UID.nvQuayA, { dong: [{ mat_hang_id: MH['C-THANNGOAI'].id }] });
  ok('Món đếm gói mà không ghi số gói bị từ chối', khongGoi.loi !== null && /chưa nhập số gói/.test(khongGoi.loi), khongGoi.loi ?? '');

  const gui = maGui();
  const t = { maGui: gui, nguon: 'goi_y', dong: [
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: gy['C-THANNGOAI'].so_goi_de_nghi },
    { mat_hang_id: MH['C-NACVAI'].id, so_goi: gy['C-NACVAI'].so_goi_de_nghi }] };
  const y = await taoYeuCau(UID.nvQuayA, t);
  ok('NV quầy gửi yêu cầu từ gợi ý', y.loi === null && /^YC-\d{4}-0001$/.test(y.rows[0].so_phieu) && !y.rows[0].da_co,
     y.loi ?? y.rows?.[0]?.so_phieu);
  YC1 = y.rows?.[0]?.yeu_cau_id;
  const lai = await taoYeuCau(UID.nvQuayA, t);
  ok('Bấm gửi hai lần (cùng ma_gui) → một yêu cầu', lai.rows?.[0]?.yeu_cau_id === YC1 && lai.rows[0].da_co);
  const yc = await yeuCau(YC1);
  ok('Yêu cầu chờ, nguồn gợi ý, đúng quầy', yc.trang_thai === 'cho' && yc.nguon === 'goi_y' && yc.vi_tri_id === viTri.quay);

  ok('Thủ kho có số đỏ "yêu cầu của quầy" = 1', (await demViec(UID.thuKhoA)).yeu_cau_quay === 1);
  ok('NV quầy không có số đỏ đó', !('yeu_cau_quay' in await demViec(UID.nvQuayA)));
  const ev = await suKien(UID.thuKhoA, 'yeu_cau_quay');
  ok('Thủ kho có việc "yêu cầu của quầy" (2 món)', ev.length === 1 && ev[0].ref_id === YC1 && Number(ev[0].so) === 2,
     JSON.stringify(ev));
  const v = await nv(UID.nvQuayA, `select * from kho_v_yeu_cau_quay where id = $1`, [YC1]);
  ok('NV quầy đọc được yêu cầu của quầy', v.rows?.[0]?.so_mon === 2 && v.rows[0].tong_goi === 7, v.loi ?? JSON.stringify(v.rows));

  const tkBat = await duoi(UID.thuKhoA, `select kho_luu_nguong($1, '{"chuyen_quay_can_nhan": true}'::jsonb)`, [cnA.id]);
  ok('Thủ kho KHÔNG bật được cài đặt', tkBat.loi !== null);
  const so = await duoi(UID.qlA, `select kho_luu_nguong($1, '{"chuyen_quay_can_nhan": 1}'::jsonb)`, [cnA.id]);
  ok('Công tắc nhận số thay vì bật/tắt bị từ chối', so.loi !== null && /bật hoặc tắt/.test(so.loi), so.loi ?? '');
  const bat = await duoi(UID.qlA, `select kho_luu_nguong($1, '{"chuyen_quay_can_nhan": true}'::jsonb)`, [cnA.id]);
  const { rows: [cd] } = await db.query(`select * from kho_cai_dat where chi_nhanh_id = $1`, [cnA.id]);
  ok('Quản lý bật "quầy phải bấm nhận"; ngưỡng khác giữ nguyên',
     bat.loi === null && cd.chuyen_quay_can_nhan === true && cd.gio_nhac_chuyen === 2, bat.loi ?? '');
});

// ===========================================================================
let P1;
await nhom('4 · MANG RA THEO YÊU CẦU → HÀNG ĐI ĐƯỜNG → QUẦY NHẬN ĐỦ', async () => {
  const gui = maGui();
  const c = await chuyenTheoYC(UID.thuKhoA, YC1, gui);
  ok('Thủ kho mang ra theo yêu cầu', c.loi === null && /^XC-/.test(c.rows[0].so_phieu), c.loi ?? '');
  P1 = c.rows?.[0]?.phieu_id;
  const p = await phieu(P1);
  ok('Phiếu ở trạng thái "đang mang ra", gắn với yêu cầu', p.trang_thai === 'dang_chuyen' && p.yeu_cau_id === YC1
     && p.vi_tri_den_id === viTri.quay);
  ok('Yêu cầu chuyển sang "đang làm"', (await yeuCau(YC1)).trang_thai === 'dang_lam');
  ok('Hạn gần trước: lô A1 đi hết 4 gói, lô A2 đi 2 gói, lô hết hạn A0 ở lại',
     (await ton(A1.id, viTri.dang_chuyen)).goi === 4 && (await ton(A2.id, viTri.dang_chuyen)).goi === 2
       && (await ton(A0.id, viTri.kho)).goi === 2);
  ok('Hàng CHƯA vào quầy', (await tonHang('C-THANNGOAI', viTri.quay)).goi === 0);
  ok('Nạc vai 1 gói cũng đang trên đường', (await ton(N1.id, viTri.dang_chuyen)).goi === 1);

  const lai = await chuyenTheoYC(UID.thuKhoA, YC1, gui);
  ok('Bấm lại cùng ma_gui → cùng phiếu, không mang ra lần nữa', lai.rows?.[0]?.phieu_id === P1 && lai.rows[0].da_co);
  const hai = await chuyenTheoYC(UID.thuKhoA, YC1, maGui());
  ok('Yêu cầu đã có người mang ra → lần khác bị từ chối', hai.loi !== null && /đã có người mang ra/.test(hai.loi), hai.loi ?? '');

  const g = Object.fromEntries(((await goiY(UID.nvQuayA)).rows ?? []).map(r => [r.ma, r]));
  ok('Gợi ý tính cả hàng đang mang ra: thăn không còn dưới mức', !g['C-THANNGOAI']);

  const dv = await demViec(UID.nvQuayA);
  ok('NV quầy có số đỏ "hàng đang mang ra" = 1, chưa quá giờ',
     dv.hang_dang_chuyen === 1 && dv.hang_chuyen_qua_gio === 0, JSON.stringify(dv));
  ok('Thủ kho không có số đỏ đó (việc của quầy)', !('hang_dang_chuyen' in await demViec(UID.thuKhoA)));
  let ev = await suKien(UID.nvQuayA, 'hang_dang_chuyen');
  ok('NV quầy có việc "hàng đang mang ra" (7 gói, chưa quá giờ)',
     ev.length === 1 && ev[0].ref_id === P1 && ev[0].phu === 'quay' && Number(ev[0].so) === 7, JSON.stringify(ev));
  await db.query(`update kho_phieu_xuat set created_at = now() - interval '3 hours' where id = $1`, [P1]);
  ev = await suKien(UID.nvQuayA, 'hang_dang_chuyen');
  ok('Quá 2 giờ chưa bấm nhận → mức đỏ (phu = qua_gio)', ev[0]?.phu === 'qua_gio' && (await demViec(UID.nvQuayA)).hang_chuyen_qua_gio === 1,
     JSON.stringify(ev));

  const tuNhan = await nhan(UID.thuKhoA, P1, maGui());
  ok('Người mang ra KHÔNG tự bấm nhận được', tuNhan.loi !== null && /không tự bấm nhận/.test(tuNhan.loi), tuNhan.loi ?? '');
  const kt = await nhan(UID.keToanA, P1, maGui());
  ok('Kế toán KHÔNG bấm nhận được', kt.loi !== null);

  // Còn hàng đi đường vào quầy → không gửi kiểm kê quầy được.
  const kid = (await duoi(UID.nvQuayA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_mat_hang', $3) as id`,
    [cnA.id, viTri.quay, maGui()])).rows[0].id;
  await luuDem(UID.nvQuayA, kid, { 'C-NACVAI': { goi: 1 } });
  const guiKK = await duoi(UID.nvQuayA, `select kho_gui_kiem_ke($1, $2)`, [kid, (await kk(kid)).phien_ban]);
  ok('Gửi kiểm kê quầy bị chặn khi còn hàng đang mang ra', guiKK.loi !== null && /đang mang ra chưa bấm nhận/.test(guiKK.loi),
     guiKK.loi ?? '');
  await duoi(UID.nvQuayA, `select kho_huy_kiem_ke($1, 'thử')`, [kid]);

  const gNhan = maGui();
  const n = await nhan(UID.nvQuayA, P1, gNhan);
  ok('NV quầy bấm "Đã nhận đủ"', n.loi === null && /Đã nhận đủ .*7 gói/.test(n.rows?.[0]?.cau), n.loi ?? n.rows?.[0]?.cau);
  const p2 = await phieu(P1);
  ok('Phiếu "đã nhận", ghi người nhận và lúc nhận', p2.trang_thai === 'da_nhan' && p2.nguoi_nhan && p2.nhan_luc);
  ok('Hàng vào quầy đúng lô: A1 4 gói, A2 2 gói, nạc vai thêm 1',
     (await ton(A1.id, viTri.quay)).goi === 4 && (await ton(A2.id, viTri.quay)).goi === 2 && (await ton(N1.id, viTri.quay)).goi === 2);
  ok('Không còn gì trên đường', (await db.query(`select * from kho_chuyen_tren_duong($1)`, [P1])).rows.length === 0);
  const { rows: d } = await db.query(`select so_goi, so_goi_nhan, so_kg, so_kg_nhan from kho_phieu_xuat_dong where phieu_xuat_id = $1 order by thu_tu`, [P1]);
  ok('Dòng phiếu ghi số thực nhận = số mang ra', d.every(x => x.so_goi === x.so_goi_nhan && Number(x.so_kg) === Number(x.so_kg_nhan)),
     JSON.stringify(d));
  ok('Yêu cầu xong', (await yeuCau(YC1)).trang_thai === 'xong');
  ok('Số đỏ "hàng đang mang ra" về 0', (await demViec(UID.nvQuayA)).hang_dang_chuyen === 0);

  const lai2 = await nhan(UID.nvQuayA, P1, gNhan);
  ok('Bấm nhận lại (cùng ma_gui) → không nhận thêm', lai2.loi === null && (await ton(A1.id, viTri.quay)).goi === 4, lai2.loi ?? '');
  const khac = await nhan(UID.qlA, P1, maGui());
  ok('Người khác bấm nhận lần nữa → báo đã có người nhận', khac.loi !== null && /đã có người bấm nhận/.test(khac.loi), khac.loi ?? '');
  const v = await nv(UID.nvQuayA, `select * from kho_v_phieu_xuat where id = $1`, [P1]);
  ok('Danh sách phiếu có số yêu cầu, số đã nhận', v.rows?.[0]?.so_yeu_cau === (await yeuCau(YC1)).so_phieu
     && v.rows[0].tong_goi_nhan === 7 && v.rows[0].nguoi_nhan !== null, JSON.stringify(v.rows?.[0]));
  await doiSoat('Sau nhận đủ');
});

// ===========================================================================
await nhom('5 · NHẬN THIẾU → QUẢN LÝ TRẢ VỀ KHO', async () => {
  const c = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                       dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 5 }] });
  const P2 = c.rows?.[0]?.phieu_id;
  ok('Thủ kho mang 5 gói thăn ra (không qua yêu cầu) → đang mang ra',
     c.loi === null && (await phieu(P2)).trang_thai === 'dang_chuyen', c.loi ?? '');
  ok('Lấy hạn gần trước: A2 2 gói cuối, A3 3 gói',
     (await ton(A2.id, viTri.dang_chuyen)).goi === 2 && (await ton(A3.id, viTri.dang_chuyen)).goi === 3);

  const qua = await nhan(UID.nvQuayA, P2, maGui(), [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 6 }]);
  ok('Nhận nhiều hơn số mang ra bị từ chối', qua.loi !== null && /chỉ mang ra 5/.test(qua.loi), qua.loi ?? '');
  const la = await nhan(UID.nvQuayA, P2, maGui(), [{ mat_hang_id: MH['C-GAU'].id, so_goi: 1 }]);
  ok('Món không có trong phiếu bị từ chối', la.loi !== null && /không có trong phiếu/.test(la.loi), la.loi ?? '');

  const n = await nhan(UID.nvQuayA, P2, maGui(), [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 3 }]);
  ok('NV quầy báo chỉ nhận 3 gói → thiếu 2, báo quản lý', n.loi === null && /Thiếu 2 gói/.test(n.rows?.[0]?.cau),
     n.loi ?? n.rows?.[0]?.cau);
  ok('Phiếu "nhận thiếu"', (await phieu(P2)).trang_thai === 'nhan_thieu');
  ok('Nhận lấy lô hạn gần trước: A2 2 gói + A3 1 gói vào quầy',
     (await ton(A2.id, viTri.quay)).goi === 4 && (await ton(A3.id, viTri.quay)).goi === 1);
  ok('Còn 2 gói lô A3 trên đường', (await ton(A3.id, viTri.dang_chuyen)).goi === 2);
  const { rows: [d] } = await db.query(`select so_goi_nhan from kho_phieu_xuat_dong where phieu_xuat_id = $1`, [P2]);
  ok('Dòng ghi thực nhận 3 gói', d.so_goi_nhan === 3);

  ok('Quản lý có số đỏ "nhận thiếu" = 1', (await demViec(UID.qlA)).chuyen_nhan_thieu === 1);
  const ev = await suKien(UID.qlA, 'chuyen_nhan_thieu');
  ok('Quản lý có việc "nhận thiếu" 2 gói', ev.length === 1 && ev[0].ref_id === P2 && Number(ev[0].so) === 2, JSON.stringify(ev));
  ok('NV quầy không có số đỏ "nhận thiếu"', !('chuyen_nhan_thieu' in await demViec(UID.nvQuayA)));

  const nvXl = await xuLyThieu(UID.nvQuayA, P2, 'tra_ve', null);
  ok('NV quầy KHÔNG xử lý hàng thiếu được', nvXl.loi !== null);
  const tkXl = await xuLyThieu(UID.thuKhoA, P2, 'tra_ve', null);
  ok('Thủ kho KHÔNG xử lý hàng thiếu được', tkXl.loi !== null);
  const sai = await xuLyThieu(UID.qlA, P2, 'bo_qua', null);
  ok('Cách xử lý lạ bị từ chối', sai.loi !== null);

  const kho0 = (await ton(A3.id, viTri.kho)).goi;
  const tv = await xuLyThieu(UID.qlA, P2, 'tra_ve', 'Thủ kho quên mang');
  ok('Quản lý trả phần thiếu về kho', tv.loi === null && /Đã trả 2 gói/.test(tv.rows?.[0]?.cau), tv.loi ?? '');
  const p = await phieu(P2);
  ok('Phiếu "đã trả về", ghi cách xử lý và người xử lý', p.trang_thai === 'da_tra_ve' && p.xu_ly_thieu === 'tra_ve' && p.nguoi_xu_ly);
  ok('2 gói A3 về lại kho, trên đường hết', (await ton(A3.id, viTri.kho)).goi === kho0 + 2 && (await ton(A3.id, viTri.dang_chuyen)).goi === 0);
  const lai = await xuLyThieu(UID.qlA, P2, 'tra_ve', null);
  ok('Bấm xử lý lại → báo đã xử lý, không làm gì thêm', lai.loi === null && /đã được xử lý/.test(lai.rows?.[0]?.cau));
  const mat = await xuLyThieu(UID.qlA, P2, 'mat', 'x');
  ok('Đã trả về thì không ghi mất được nữa', mat.loi !== null);
  ok('Số đỏ "nhận thiếu" về 0', (await demViec(UID.qlA)).chuyen_nhan_thieu === 0);
  await doiSoat('Sau trả về');
});

// ===========================================================================
await nhom('6 · NHẬN THIẾU → QUẢN LÝ GHI MẤT (HAO HỤT)', async () => {
  const c = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                       dong: [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 2 }] });
  const P3 = c.rows?.[0]?.phieu_id;
  const n = await nhan(UID.nvQuayA, P3, maGui(), [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 1 }]);
  ok('Nạc vai mang 2, nhận 1', n.loi === null && (await phieu(P3)).trang_thai === 'nhan_thieu', n.loi ?? '');
  const khongLyDo = await xuLyThieu(UID.qlA, P3, 'mat', '  ');
  ok('Ghi mất mà không có lý do bị từ chối', khongLyDo.loi !== null && /lý do/.test(khongLyDo.loi), khongLyDo.loi ?? '');
  const m = await xuLyThieu(UID.qlA, P3, 'mat', 'Rơi vỡ khi bê');
  ok('Quản lý ghi mất 1 gói', m.loi === null && /Đã ghi mất 1 gói \(0,500 kg\)/.test(m.rows?.[0]?.cau), m.loi ?? m.rows?.[0]?.cau);
  const p = await phieu(P3);
  ok('Phiếu đóng lại (đã nhận), ghi "mất" và lý do', p.trang_thai === 'da_nhan' && p.xu_ly_thieu === 'mat' && p.ly_do_xu_ly === 'Rơi vỡ khi bê');
  const { rows: sc } = await db.query(`select loai, so_goi, so_kg, vi_tri_id from kho_so_cai
    where chung_tu_id = $1 and loai = 'hao_hut'`, [P3]);
  ok('Sổ kho: một dòng hao hụt −1 gói ở "Đang mang ra quầy"',
     sc.length === 1 && sc[0].so_goi === -1 && Number(sc[0].so_kg) === -0.5 && sc[0].vi_tri_id === viTri.dang_chuyen, JSON.stringify(sc));

  const hh = await duoi(UID.qlA, `select * from kho_bao_cao_hao_hut($1, $2::date, $2::date)`, [cnA.id, homNay]);
  const dm = hh.rows?.find(r => r.loai_dong === 'hao_hut');
  ok('Báo cáo hao hụt có nhóm "hao_hut": mất khi mang ra quầy, 1 gói, có giá trị',
     dm && dm.ly_do === 'Mất khi mang ra quầy' && dm.so_goi === 1 && Number(dm.gia_tri) === 200000, JSON.stringify(hh.rows));
  ok('Mất khi mang ra KHÔNG bị tính là chênh lệch kiểm kê', !hh.rows?.some(r => r.loai_dong.startsWith('kiem_ke')));
  const x = await duoi(UID.qlA, `select * from kho_bao_cao_xnt_v2($1, $2::date, $2::date)`, [cnA.id, homNay]);
  const nac = x.rows?.find(r => r.ma === 'C-NACVAI');
  ok('XNT mới: cột hao hụt 0,5 kg, kiểm kê 0', Number(nac?.hao_hut_kg) === 0.5 && Number(nac.kiem_ke_kg) === 0, JSON.stringify(nac));
  await doiSoat('Sau ghi mất');
});

// ===========================================================================
await nhom('7 · HỦY CHUYẾN KHI QUẦY CHƯA NHẬN', async () => {
  const y = await taoYeuCau(UID.nvQuayA, { dong: [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 1 }] });
  const YC2 = y.rows?.[0]?.yeu_cau_id;
  const c = await chuyenTheoYC(UID.thuKhoA, YC2, maGui(), [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 1 }]);
  const P4 = c.rows?.[0]?.phieu_id;
  ok('Mang ra theo yêu cầu (thủ kho sửa số)', c.loi === null && (await phieu(P4)).trang_thai === 'dang_chuyen', c.loi ?? '');
  const khoTruoc = (await ton(N1.id, viTri.kho)).goi;

  const nvHuy = await nv(UID.nvQuayA, `select kho_huy_chuyen(p_id => $1, p_ly_do => null) as cau`, [P4]);
  ok('NV quầy (không phải người mang ra) KHÔNG hủy được', nvHuy.loi !== null && /Chỉ người mang hàng ra/.test(nvHuy.loi), nvHuy.loi ?? '');
  const huy = await nv(UID.thuKhoA, `select kho_huy_chuyen(p_id => $1, p_ly_do => $2) as cau`, [P4, 'Lấy nhầm']);
  ok('Người mang ra hủy chuyến', huy.loi === null && /1 gói đã về lại chỗ cũ/.test(huy.rows?.[0]?.cau), huy.loi ?? '');
  ok('Phiếu "đã hủy", hàng về kho', (await phieu(P4)).trang_thai === 'da_huy' && (await ton(N1.id, viTri.kho)).goi === khoTruoc + 1
     && (await ton(N1.id, viTri.dang_chuyen)).goi === 0);
  ok('Yêu cầu của quầy quay về "chờ"', (await yeuCau(YC2)).trang_thai === 'cho');
  const lai = await nv(UID.thuKhoA, `select kho_huy_chuyen(p_id => $1, p_ly_do => null) as cau`, [P4]);
  ok('Hủy lần nữa → báo đã hủy', lai.loi === null && /đã hủy trước đó/.test(lai.rows?.[0]?.cau));
  const n = await nhan(UID.nvQuayA, P4, maGui());
  ok('Không bấm nhận phiếu đã hủy được', n.loi !== null && /đã hủy/.test(n.loi), n.loi ?? '');

  const hy = await nv(UID.nvQuayA, `select kho_huy_yeu_cau(p_id => $1, p_ly_do => $2) as cau`, [YC2, 'Không cần nữa']);
  ok('NV quầy hủy yêu cầu đang chờ', hy.loi === null && (await yeuCau(YC2)).trang_thai === 'huy', hy.loi ?? '');
  const hy2 = await nv(UID.nvQuayA, `select kho_huy_yeu_cau(p_id => $1, p_ly_do => null) as cau`, [YC2]);
  ok('Hủy lại → báo đã hủy', hy2.loi === null && /đã hủy trước đó/.test(hy2.rows?.[0]?.cau));
  const hyXong = await nv(UID.nvQuayA, `select kho_huy_yeu_cau(p_id => $1, p_ly_do => null) as cau`, [YC1]);
  ok('Yêu cầu đã xong không hủy được', hyXong.loi !== null && /không hủy được/.test(hyXong.loi), hyXong.loi ?? '');
  const mangHuy = await chuyenTheoYC(UID.thuKhoA, YC2, maGui());
  ok('Yêu cầu đã hủy không mang ra được', mangHuy.loi !== null && /đã hủy/.test(mangHuy.loi), mangHuy.loi ?? '');
  await doiSoat('Sau hủy chuyến');
});

// ===========================================================================
await nhom('8 · NV QUẦY TỰ LẤY → VÀO THẲNG QUẦY; QUẢN LÝ MANG RA → ĐI ĐƯỜNG', async () => {
  const truoc = await tonHang('C-THANNGOAI', viTri.quay);
  const c = await xuat(UID.nvQuayA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                       dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('NV quầy tự lấy 1 gói: ghi sổ ngay, không qua đi đường',
     c.loi === null && (await phieu(c.rows[0].phieu_id)).trang_thai === 'da_ghi'
       && (await tonHang('C-THANNGOAI', viTri.quay)).goi === truoc.goi + 1, c.loi ?? '');
  const ql = await xuat(UID.qlA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                    dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('Quản lý mang ra → đi đường (chỉ NV quầy tự lấy mới vào thẳng)',
     ql.loi === null && (await phieu(ql.rows[0].phieu_id)).trang_thai === 'dang_chuyen', ql.loi ?? '');
  const n = await nhan(UID.nvQuayA, ql.rows[0].phieu_id, maGui());
  ok('NV quầy nhận', n.loi === null, n.loi ?? '');
  const veKho = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.quay, den: viTri.kho,
                                           dong: [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 1 }] });
  ok('Quầy → kho: không qua đi đường', veKho.loi === null && (await phieu(veKho.rows[0].phieu_id)).trang_thai === 'da_ghi', veKho.loi ?? '');
  await doiSoat('Sau tự lấy');
});

// ===========================================================================
await nhom('9 · "ĐANG MANG RA QUẦY" KHÔNG PHẢI CHỖ ĐỂ HÀNG; CHẶN DUYỆT KIỂM KÊ', async () => {
  const tu = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.dang_chuyen, den: viTri.quay,
                                        dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('Không chọn làm nơi lấy hàng', tu.loi !== null && /kho hoặc quầy đang dùng/.test(tu.loi), tu.loi ?? '');
  const den = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.dang_chuyen,
                                         dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('Không chọn làm nơi nhận', den.loi !== null, den.loi ?? '');
  const huy = await xuat(UID.nvQuayA, { loai: 'huy', tu: viTri.dang_chuyen, lyDo: lyDo['huy:Khác'],
    anh: [`${cnA.id}/huy/${maGui()}/1.jpg`], dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  ok('Không báo hủy từ đó', huy.loi !== null);
  const kkDc = await duoi(UID.thuKhoA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_lo', $3)`, [cnA.id, viTri.dang_chuyen, maGui()]);
  ok('Không kiểm kê "Đang mang ra quầy"', kkDc.loi !== null && /không phải chỗ để hàng/.test(kkDc.loi), kkDc.loi ?? '');
  const { rows: [pn] } = await db.query(`select id from kho_phieu_nhap where chi_nhanh_id = $1 and loai = 'mua' limit 1`, [cnA.id]);
  const tra = await duoi(UID.keToanA, `
    select * from kho_tra_nha_cung_cap($1, $2, $3, $4, null, '{}'::text[], null, $5::jsonb)`,
    [cnA.id, maGui(), pn.id, viTri.dang_chuyen, JSON.stringify([{ lo_id: A0.id, so_kg: 0.1 }])]);
  ok('Không trả nhà cung cấp từ đó', tra.loi !== null, tra.loi ?? '');

  const them = await duoi(UID.qlA, `insert into kho_vi_tri (chi_nhanh_id, ten, loai) values ($1, 'Xe đẩy', 'dang_chuyen')`, [cnA.id]);
  ok('Không tự tạo thêm vị trí đi đường', them.loi !== null);
  const doi = await duoi(UID.qlA, `update kho_vi_tri set loai = 'kho' where id = $1`, [viTri.dang_chuyen]);
  ok('Không đổi loại vị trí đi đường', doi.loi !== null && /Đang mang ra quầy/.test(doi.loi), doi.loi ?? '');
  const tat = await duoi(UID.qlA, `update kho_vi_tri set dang_dung = false where id = $1`, [viTri.dang_chuyen]);
  ok('Không tắt vị trí đi đường', tat.loi !== null);
  const doiTen = await duoi(UID.qlA, `update kho_vi_tri set ten = 'Đang bê ra quầy' where id = $1`, [viTri.dang_chuyen]);
  ok('Đổi tên thì được', doiTen.loi === null, doiTen.loi ?? '');

  // Gửi kiểm kê khi chưa có hàng đi đường → được; rồi có hàng đi đường → không duyệt được.
  const kid = (await duoi(UID.nvQuayA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_mat_hang', $3) as id`,
    [cnA.id, viTri.quay, maGui()])).rows[0].id;
  const dem = {};
  for (const d of await dongKK(kid)) {
    const t = await tonHang(d.ma, viTri.quay);
    dem[d.ma] = MH[d.ma].dem_goi ? { goi: t.goi } : { kg: t.kg };
  }
  await luuDem(UID.nvQuayA, kid, dem);
  const g = await duoi(UID.nvQuayA, `select kho_gui_kiem_ke($1, $2) as cau`, [kid, (await kk(kid)).phien_ban]);
  ok('Gửi kiểm kê quầy (không có hàng đi đường)', g.loi === null && /0 dòng lệch/.test(g.rows?.[0]?.cau), g.loi ?? g.rows?.[0]?.cau);
  const c = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
                                       dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }] });
  const d1 = await duoi(UID.qlA, `select kho_duyet_kiem_ke($1) as cau`, [kid]);
  ok('Có hàng đang mang ra quầy → quản lý chưa duyệt được kiểm kê quầy',
     d1.loi !== null && /đang mang ra chưa bấm nhận/.test(d1.loi) && d1.loi.includes(c.rows[0].so_phieu), d1.loi ?? '');
  await nhan(UID.nvQuayA, c.rows[0].phieu_id, maGui());
  const d2 = await duoi(UID.qlA, `select kho_duyet_kiem_ke($1) as cau`, [kid]);
  ok('Quầy nhận xong → duyệt được; hàng nhận sau khi gửi không bị xóa',
     d2.loi === null && (await tonHang('C-THANNGOAI', viTri.quay)).goi === dem['C-THANNGOAI'].goi + 1, d2.loi ?? '');
  await doiSoat('Sau chặn');
});

// ===========================================================================
await nhom('10 · ĐẾM QUẦY CỘNG DỒN BẰNG MÁY QUÉT', async () => {
  const soThan = (await tonHang('C-THANNGOAI', viTri.quay)).goi;
  const soNac = (await tonHang('C-NACVAI', viTri.quay)).goi;
  ok(`Quầy đang có ${soThan} gói thăn, ${soNac} gói nạc vai`, soThan >= 8 && soNac >= 1);
  const kid = (await duoi(UID.nvQuayA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_mat_hang', $3) as id`,
    [cnA.id, viTri.quay, maGui()])).rows[0].id;

  const L1 = maGui();
  const ma1 = [nhanCan(101, 500), nhanCan(101, 500), nhanCan(101, 520), nhanCan(102, 480), '12345', nhanCan(999, 300)];
  const q1 = await quet(UID.nvQuayA, kid, L1, ma1);
  const k1 = q1.rows?.[0]?.kq;
  ok('Lượt 1 (máy quầy): 4 nhãn đọc được, 2 nhãn lỗi', q1.loi === null && k1.so_nhan === 4 && k1.loi.length === 2 && k1.da_co === false,
     q1.loi ?? JSON.stringify(k1));
  ok('Lỗi nói rõ: không phải mã 13 số / mã hàng chưa gán món',
     /13 số/.test(k1?.loi?.[0]?.loi) && /999 chưa gán/.test(k1?.loi?.[1]?.loi), JSON.stringify(k1?.loi));
  ok('Hai gói giống hệt (cùng mã) vẫn tính là hai', (await dongMon(kid, 'C-THANNGOAI')).so_goi_dem === 3);
  ok('Kg = tổng kg trên nhãn (1,52 kg)', Number((await dongMon(kid, 'C-THANNGOAI')).so_kg_dem) === 1.52);
  ok('Danh sách chạy: món vừa quét, số nhãn', k1?.mon?.some(m => m.ten === 'Thăn ngoại cắt lát' && m.so_nhan === 3), JSON.stringify(k1?.mon));
  ok('Phiên bản phiếu tăng sau mỗi lượt quét', k1?.phien_ban === (await kk(kid)).phien_ban);

  const phat = await quet(UID.nvQuayA, kid, L1, ma1);
  ok('Phát lại lượt 1 (cùng ma_gui) → không cộng đôi', phat.rows?.[0]?.kq?.da_co === true
     && (await dongMon(kid, 'C-THANNGOAI')).so_goi_dem === 3 && phat.rows[0].kq.so_nhan === 4, JSON.stringify(phat.rows?.[0]?.kq));

  const L2 = maGui();
  const q2 = await quet(UID.thuKhoA, kid, L2, [nhanCan(101, 500), nhanCan(101, 600)]);
  ok('Lượt 2 (máy khác, người khác) cộng dồn: 5 gói, 2,62 kg',
     q2.loi === null && (await dongMon(kid, 'C-THANNGOAI')).so_goi_dem === 5
       && Number((await dongMon(kid, 'C-THANNGOAI')).so_kg_dem) === 2.62, q2.loi ?? '');
  const { rows: [{ n: soNhan }] } = await db.query(`select count(*)::int as n from kho_kiem_ke_quet where kiem_ke_id = $1`, [kid]);
  ok('Mỗi nhãn một dòng (6 nhãn)', soNhan === 6);

  const b1 = maGui();
  const bot = await boQuet(UID.nvQuayA, kid, b1, 'bot_mot', 'C-THANNGOAI');
  ok('−1 gói thăn: bỏ nhãn quét sau cùng (0,6 kg) → 4 gói, 2,02 kg',
     bot.loi === null && (await dongMon(kid, 'C-THANNGOAI')).so_goi_dem === 4
       && Number((await dongMon(kid, 'C-THANNGOAI')).so_kg_dem) === 2.02, bot.loi ?? '');
  await boQuet(UID.nvQuayA, kid, b1, 'bot_mot', 'C-THANNGOAI');
  ok('Bấm −1 hai lần (cùng ma_gui) → chỉ trừ một', (await dongMon(kid, 'C-THANNGOAI')).so_goi_dem === 4);

  const bl = await boQuet(UID.thuKhoA, kid, maGui(), 'lan_cuoi');
  ok('Máy thứ hai bỏ lượt cuối CỦA MÌNH → còn đúng 3 gói của lượt 1',
     bl.loi === null && (await dongMon(kid, 'C-THANNGOAI')).so_goi_dem === 3, bl.loi ?? '');
  const bl2 = await boQuet(UID.thuKhoA, kid, maGui(), 'lan_cuoi');
  ok('Hết lượt để bỏ → báo rõ', bl2.loi !== null && /chưa có lượt quét nào/.test(bl2.loi), bl2.loi ?? '');

  const it = await luuDem(UID.nvQuayA, kid, { 'C-THANNGOAI': { goi: 2 } });
  ok('Gõ tay số đếm ít hơn số đã quét bị từ chối', it.loi !== null && /đã quét 3 gói/.test(it.loi), it.loi ?? '');
  const tong = await luuDem(UID.nvQuayA, kid, { 'C-THANNGOAI': { goi: soThan - 1 } });
  const dThan = await dongMon(kid, 'C-THANNGOAI');
  ok(`Gõ tổng ${soThan - 1} gói → 3 nhãn + ${soThan - 4} gói gõ tay; kg để trống (ước lúc duyệt)`,
     tong.loi === null && dThan.so_goi_dem === soThan - 1 && dThan.so_goi_them === soThan - 4 && dThan.so_kg_dem === null,
     tong.loi ?? JSON.stringify(dThan));
  const them = await luuDem(UID.nvQuayA, kid, { 'C-THANNGOAI': { them: 1 } });
  ok('Gửi riêng "số gói thêm" → 3 nhãn + 1', them.loi === null && (await dongMon(kid, 'C-THANNGOAI')).so_goi_dem === 4, them.loi ?? '');
  await luuDem(UID.nvQuayA, kid, { 'C-THANNGOAI': { them: soThan - 4 } });

  const xoa = await boQuet(UID.nvQuayA, kid, maGui(), 'xoa_mon', 'C-NACVAI');
  const dNac = await dongMon(kid, 'C-NACVAI');
  ok('Xóa món nạc vai → về "chưa đếm"', xoa.loi === null && dNac.so_goi_dem === null && !dNac.tu_quet, xoa.loi ?? JSON.stringify(dNac));

  const cu = await duoi(UID.nvQuayA, `select kho_het_hang_con_lai(p_id => $1, p_phien_ban => $2) as kq`, [kid, (await kk(kid)).phien_ban - 1]);
  ok('"Hết hàng" với phiên bản cũ bị từ chối (máy khác vừa sửa)', cu.loi !== null && /máy khác/.test(cu.loi), cu.loi ?? '');
  const het = await nv(UID.nvQuayA, `select kho_het_hang_con_lai(p_id => $1, p_phien_ban => $2) as kq`, [kid, (await kk(kid)).phien_ban]);
  const dNac2 = await dongMon(kid, 'C-NACVAI');
  ok('"Những món này đã bán hết" một chạm: nạc vai = 0, đã xác nhận hết',
     het.loi === null && het.rows[0].kq.so_mon >= 1 && dNac2.so_goi_dem === 0 && dNac2.xac_nhan_het, het.loi ?? JSON.stringify(het.rows));
  ok('Món đã đếm (thăn) không bị đụng tới', (await dongMon(kid, 'C-THANNGOAI')).so_goi_dem === soThan - 1);

  const g = await duoi(UID.nvQuayA, `select kho_gui_kiem_ke($1, $2) as cau`, [kid, (await kk(kid)).phien_ban]);
  ok('NV quầy gửi phiếu đếm', g.loi === null, g.loi ?? '');
  const d = await duoi(UID.qlA, `select kho_duyet_kiem_ke($1) as cau`, [kid]);
  ok('Quản lý duyệt: phần thiếu ở quầy ghi là BÁN như cũ', d.loi === null && /ghi bán/.test(d.rows?.[0]?.cau), d.loi ?? d.rows?.[0]?.cau);
  const { rows: ban } = await db.query(`select mat_hang_id, sum(so_goi)::int as g from kho_so_cai
    where chung_tu_id = $1 and loai = 'ban' group by mat_hang_id`, [kid]);
  const banThan = ban.find(r => r.mat_hang_id === MH['C-THANNGOAI'].id)?.g;
  const banNac = ban.find(r => r.mat_hang_id === MH['C-NACVAI'].id)?.g;
  ok(`Sổ: bán 1 gói thăn, ${soNac} gói nạc vai`, banThan === -1 && banNac === -soNac, JSON.stringify(ban));
  ok('Tồn quầy sau duyệt = số đếm', (await tonHang('C-THANNGOAI', viTri.quay)).goi === soThan - 1
     && (await tonHang('C-NACVAI', viTri.quay)).goi === 0);

  const sau = await quet(UID.nvQuayA, kid, maGui(), [nhanCan(101, 500)]);
  ok('Phiếu đã duyệt không quét thêm được', sau.loi !== null && /không còn ở bước đếm/.test(sau.loi), sau.loi ?? '');
  const kt = await quet(UID.keToanA, kid, maGui(), [nhanCan(101, 500)]);
  ok('Kế toán không quét kiểm kê được', kt.loi !== null);
  const kLo = (await duoi(UID.thuKhoA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_lo', $3) as id`, [cnA.id, viTri.kho, maGui()])).rows[0].id;
  const qLo = await quet(UID.thuKhoA, kLo, maGui(), [nhanCan(101, 500)]);
  ok('Phiếu đếm theo lô (kho lạnh) không quét nhãn', qLo.loi !== null && /theo lô/.test(qLo.loi), qLo.loi ?? '');
  await duoi(UID.thuKhoA, `select kho_huy_kiem_ke($1, null)`, [kLo]);
  const rong = await quet(UID.thuKhoA, kLo, maGui(), []);
  ok('Gửi lượt rỗng / phiếu đã hủy bị từ chối', rong.loi !== null);
  await doiSoat('Sau đếm quầy');
});

// ===========================================================================
await nhom('11 · XUẤT KHÁC: BẮT BUỘC LÝ DO, VÀO BÁO CÁO', async () => {
  const dong = [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }];
  const khong = await xuat(UID.thuKhoA, { loai: 'xuat_khac', tu: viTri.kho, dong });
  ok('Xuất khác không chọn lý do bị từ chối', khong.loi !== null && /phải chọn lý do/.test(khong.loi), khong.loi ?? '');
  const sai = await xuat(UID.thuKhoA, { loai: 'xuat_khac', tu: viTri.kho, lyDo: lyDo['xuat_bep:Khác'], dong });
  ok('Lý do của loại khác bị từ chối', sai.loi !== null && /Lý do không hợp lệ/.test(sai.loi), sai.loi ?? '');
  const hetHan = await xuat(UID.thuKhoA, { loai: 'xuat_khac', tu: viTri.kho, lyDo: lyDo['xuat_khac:Tặng khách'],
    dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, lo_id: A0.id, so_goi: 1 }] });
  ok('Hàng hết hạn không tặng / dùng được', hetHan.loi !== null && /đã hết hạn/.test(hetHan.loi), hetHan.loi ?? '');
  const anh = await xuat(UID.thuKhoA, { loai: 'xuat_khac', tu: viTri.kho, lyDo: lyDo['xuat_khac:Tặng khách'],
    anh: [`${cnA.id}/huy/${maGui()}/1.jpg`], dong });
  ok('Xuất khác không kèm ảnh', anh.loi !== null);

  const truoc = (await tonHang('C-THANNGOAI', viTri.kho)).goi;
  const x = await xuat(UID.thuKhoA, { loai: 'xuat_khac', tu: viTri.kho, lyDo: lyDo['xuat_khac:Tặng khách'], dong });
  const p = await phieu(x.rows?.[0]?.phieu_id);
  ok('Thủ kho xuất khác 1 gói (tặng khách): số XK-, ghi sổ ngay',
     x.loi === null && /^XK-\d{4}-0001$/.test(p.so_phieu) && p.trang_thai === 'da_ghi', x.loi ?? p?.so_phieu);
  const { rows: sc } = await db.query(`select loai, so_goi, lo_id from kho_so_cai where chung_tu_id = $1`, [p.id]);
  ok('Sổ kho: một dòng xuat_khac, lô còn hạn gần nhất', sc.length === 1 && sc[0].loai === 'xuat_khac' && sc[0].so_goi === -1
     && sc[0].lo_id === A3.id, JSON.stringify(sc));
  ok('Tồn kho giảm 1 gói', (await tonHang('C-THANNGOAI', viTri.kho)).goi === truoc - 1);

  const hh = await duoi(UID.qlA, `select * from kho_bao_cao_hao_hut($1, $2::date, $2::date)`, [cnA.id, homNay]);
  const r = hh.rows?.find(z => z.loai_dong === 'xuat_khac');
  ok('Báo cáo hao hụt có nhóm xuất khác, đúng lý do', r && r.ly_do === 'Tặng khách' && r.so_goi === 1 && Number(r.gia_tri) === 350000,
     JSON.stringify(hh.rows));
  const v2 = await duoi(UID.qlA, `select * from kho_bao_cao_xnt_v2($1, $2::date, $2::date)`, [cnA.id, homNay]);
  const than = v2.rows?.find(z => z.ma === 'C-THANNGOAI');
  ok('XNT mới có cột xuất khác (0,5 kg)', Number(than?.xuat_khac_kg) === 0.5 && Number(than.xuat_khac_gia_tri) === 350000,
     JSON.stringify(than));
  const lech = (v2.rows ?? []).filter(z => {
    const n = k => Number(z[k]);
    const tinh = n('dau_kg') + n('nhap_kg') + n('pha_ra_kg') - n('pha_vao_kg') - n('ban_kg') - n('xuat_bep_kg')
      - n('xuat_khac_kg') - n('huy_kg') - n('tra_ncc_kg') + n('kiem_ke_kg') - n('hao_hut_kg');
    return Math.abs(tinh - n('cuoi_kg')) > 1e-9;
  });
  ok('XNT mới: đầu + nhập − xuất ± kiểm kê − hao hụt = cuối, mọi món', v2.rows?.length > 0 && lech.length === 0,
     JSON.stringify(lech));
  const cu = await duoi(UID.qlA, `select * from kho_bao_cao_xuat_nhap_ton($1, $2::date, $2::date)`, [cnA.id, homNay]);
  ok('Hàm XNT cũ vẫn chạy như trước', cu.loi === null && cu.rows.length === v2.rows.length, cu.loi ?? '');
  const cs = await duoi(UID.qlA, `select kho_chi_so_quan_tri($1, $2::date, $2::date) as v`, [cnA.id, homNay]);
  ok('Chỉ số quản trị: chi phí thịt tính cả xuất khác', cs.loi === null && Number(cs.rows[0].v.chi_phi_thit) >= 350000, cs.loi ?? '');
  await doiSoat('Sau xuất khác');
});

// ===========================================================================
await nhom('12 · NV QUẦY VÀ THỦ KHO KHÔNG THẤY TIỀN Ở MỌI THỨ MỚI', async () => {
  for (const [ai, uid] of [['NV quầy', UID.nvQuayA], ['Thủ kho', UID.thuKhoA]]) {
    for (const sql of [
      `select * from kho_v_yeu_cau_quay`, `select * from kho_yeu_cau_quay_dong`,
      `select * from kho_v_phieu_xuat`, `select * from kho_phieu_xuat_dong`, `select * from kho_v_kiem_ke`,
      `select * from kho_kiem_ke_lan_quet`, `select * from kho_kiem_ke_quet`,
    ]) await nv(uid, sql);
    await goiY(uid);
    await nv(uid, `select kho_dem_viec($1) as v`, [cnA.id]);
    await nv(uid, `select kho_thong_bao($1, 300) as v`, [cnA.id]);
    const v2 = await duoi(uid, `select * from kho_bao_cao_xnt_v2($1, $2::date, $2::date)`, [cnA.id, homNay]);
    const coTien = (v2.rows ?? []).filter(r => Object.entries(r).some(([k, x]) => k.endsWith('_gia_tri') && Number(x) !== 0));
    ok(`${ai}: XNT mới trả giá trị 0 đồng (không có quyền xem giá)`, v2.loi === null && v2.rows.length > 0 && coTien.length === 0,
       v2.loi ?? JSON.stringify(coTien[0]));
    const nhin = await duoi(uid, `select count(*)::int as n from kho_yeu_cau_quay`);
    ok(`${ai}: đọc được yêu cầu của quầy`, nhin.rows?.[0]?.n >= 2);
  }
  const tim = ketQuaNhanVien.flatMap(r => khoaTien(r));
  ok(`${ketQuaNhanVien.length} kết quả NV quầy / thủ kho đã soát: không khóa tiền nào`,
     ketQuaNhanVien.length >= 40 && tim.length === 0, [...new Set(tim)].slice(0, 10).join(', '));
  const may = await duoi(UID.thuKhoB, `select count(*)::int as n from kho_yeu_cau_quay`);
  ok('Thủ kho chi nhánh khác không thấy yêu cầu của Q1', may.rows?.[0]?.n === 0);
  await doiSoat('Cuối cùng');
});

process.exit(ketThuc('QUẦY'));
