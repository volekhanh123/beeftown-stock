/**
 * BEEFTOWN KHO — Kiểm thử repack, truy vết tảng, huỷ cả tảng, báo cáo (0048)
 * =========================================================================
 *
 *     node test/test-kho-repack-tang.mjs
 *
 * Nhập → repack (bỏ nước rỉ) → cân → ủ → lóc. Tổng tiền mua giữ nguyên, chia
 * cho số kg còn lại: 12 kg × 450.000 = 5.400.000 đ; repack còn 11,8 kg → giá
 * vốn 457.627 đ/kg. Sau đó lóc, ra quầy, bán, truy vết một tảng, huỷ cả tảng.
 * Cuối cùng: kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — REPACK · TRUY VẾT TẢNG · HUỶ CẢ TẢNG');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

const MH = {};
let vt = {}, ncc, lyDoHuy;

function luuKg(uid, t) {
  return duoi(uid, `
    select * from kho_luu_phieu_nhap_kg(
      p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
      p_loai => 'mua', p_nha_cung_cap_id => $5, p_vi_tri_id => $6, p_ngay_nhap => $7::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_ghi_chu => null,
      p_anh_them => $8::text[], p_truong_them => '{}'::jsonb, p_dong => $9::jsonb)`,
    [t.id ?? null, cnA.id, maGui(), t.phienBan ?? null, ncc, vt.kho,
     homNay, [`${cnA.id}/nhap/${maGui()}/1.jpg`], JSON.stringify(t.dong)]);
}
const phienBan = async id => (await db.query(`select phien_ban from kho_phieu_nhap where id = $1`, [id])).rows[0].phien_ban;
const guiDuyet = async id => duoi(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [id, await phienBan(id)]);
async function dienGia(id, gia) {
  const dong = (await db.query(`select id from kho_phieu_nhap_dong where phieu_nhap_id = $1 order by thu_tu`, [id])).rows;
  return duoi(UID.keToanA, `select kho_dien_gia_phieu_nhap(p_id => $1, p_phien_ban => $2, p_so_hoa_don => null,
      p_ngay_hoa_don => null, p_han_thanh_toan => null, p_tien_thue => 0, p_chi_phi_khac => 0, p_gia => $3::jsonb) as pb`,
    [id, await phienBan(id), JSON.stringify(dong.map((d, i) => ({ dong_id: d.id, don_gia_kg: gia[i] })))]);
}
const truyVet = (uid, lo) => duoi(uid, `select kho_truy_vet_tang($1) as kq`, [lo]);
const anh = () => [`${cnA.id}/huy/${maGui()}.jpg`];
const huyTang = (uid, lo, ma, lyDo = lyDoHuy, a = anh()) => duoi(uid,
  `select kho_huy_ca_tang(p_lo_id => $1, p_ma_gui => $2, p_ly_do_id => $3, p_ghi_chu => 'Nhiệt độ tủ ủ lỗi', p_anh => $4::text[]) as kq`,
  [lo, ma, lyDo, a]);
const baoCao = async uid => (await duoi(uid, `select * from kho_bao_cao_tang($1, $2::date, $3::date)`, [cnA.id, await ngay(-30), homNay]));

let pn, tang, lo = {}, phien;

// ===========================================================================
await nhom('1 · CHUẨN BỊ', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  lyDoHuy = (await db.query(`select id from kho_ly_do where loai = 'huy' and ten = 'Khác'`)).rows[0]?.id;
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Úc') returning id`)).rows[0].id;
  await duoi(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'T-THANNGOAI'`);
  await duoi(UID.qlA, `update kho_mat_hang set gia_ban_kg = case ma when 'C-THANNGOAI' then 900000 else 1200000 end
    where ma in ('C-THANNGOAI', 'C-THANNOI')`);
  const ct = (await duoi(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Thăn ngoại chuẩn') returning id`,
    [MH['T-THANNGOAI'].id])).rows[0].id;
  for (const [ma, tl] of [['C-THANNGOAI', 60], ['C-THANNOI', 15]]) {
    await duoi(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien) values ($1, $2, $3)`, [ct, MH[ma].id, tl]);
  }
  await duoi(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10011'), ($1, 2, '10012')`, [MH['C-THANNGOAI'].id]);
  ok('Chuẩn bị xong', !!lyDoHuy && !!ncc);
});

// ===========================================================================
await nhom('2 · NHẬN TẢNG: KG NHÀ CUNG CẤP + KG SAU REPACK', async () => {
  const tn = MH['T-THANNGOAI'].id, nv = MH['T-NACVAI'].id;
  const vuot = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: tn, so_kg: 12, so_kg_thuc: 12.2, ngay_mo: await ngay(-6) }] });
  ok('Kg sau repack lớn hơn kg NCC quá 1% → báo', /lớn hơn kg nhà cung cấp/.test(vuot.loi ?? ''), vuot.loi ?? '');
  const am = await luuKg(UID.thuKhoA, { dong: [{ mat_hang_id: tn, so_kg: 12, so_kg_thuc: 0, ngay_mo: await ngay(-6) }] });
  ok('Kg sau repack 0 → báo', /kg sau repack phải lớn hơn 0/.test(am.loi ?? ''), am.loi ?? '');

  const l = await luuKg(UID.thuKhoA, { dong: [
    { mat_hang_id: tn, so_kg: 12, ngay_mo: await ngay(-6) },
    { mat_hang_id: nv, so_goi: 2, so_kg: 10 },
  ] });
  ok('Lưu nháp tảng chưa có kg sau repack: được', l.loi === null, l.loi ?? '');
  pn = l.rows[0].phieu_id;
  const g0 = await guiDuyet(pn);
  ok('Gửi duyệt khi tảng chưa có kg sau repack → báo đúng dòng', /Dòng 1 \(Thăn ngoại nguyên tảng\): tảng chưa có kg sau repack/.test(g0.loi ?? ''), g0.loi ?? '');

  const l2 = await luuKg(UID.thuKhoA, { id: pn, phienBan: await phienBan(pn), dong: [
    { mat_hang_id: tn, so_kg: 12, so_kg_thuc: 11.8, ngay_mo: await ngay(-6) },
    { mat_hang_id: nv, so_goi: 2, so_kg: 10 },
  ] });
  ok('Repack xong: ghi 11,8 kg', l2.loi === null, l2.loi ?? '');
  const doc = (await duoi(UID.thuKhoA, `select kho_doc_phieu_nhap_kg($1) as p`, [pn])).rows[0].p;
  ok('Đọc phiếu: so_kg 12 · so_kg_thuc 11,8; món thường so_kg_thuc null',
     Number(doc.dong[0].so_kg) === 12 && Number(doc.dong[0].so_kg_thuc) === 11.8 && doc.dong[1].so_kg_thuc === null, JSON.stringify(doc.dong));

  const g = await dienGia(pn, [450000, 300000]);
  ok('Kế toán điền giá NCC 450.000 đ/kg', g.loi === null, g.loi ?? '');
  const tt = (await db.query(`select thanh_tien from kho_phieu_nhap_dong where phieu_nhap_id = $1 order by thu_tu`, [pn])).rows;
  ok('Tiền hàng tảng = 12 × 450.000 = 5.400.000 (theo kg NCC)', Number(tt[0].thanh_tien) === 5400000);
  ok('Gửi duyệt được', (await guiDuyet(pn)).loi === null);

  // Duyệt vẫn chặn nếu kg sau repack bị xoá sau khi gửi (phòng hờ).
  await db.query(`update kho_phieu_nhap_dong set so_kg_thuc = null where phieu_nhap_id = $1 and thu_tu = 1`, [pn]);
  const d0 = await duoi(UID.keToanA, `select kho_duyet_phieu_nhap($1)`, [pn]);
  ok('Duyệt chặn tảng thiếu kg sau repack', /tảng chưa có kg sau repack/.test(d0.loi ?? ''), d0.loi ?? '');
  await db.query(`update kho_phieu_nhap_dong set so_kg_thuc = 11.8 where phieu_nhap_id = $1 and thu_tu = 1`, [pn]);
  const d = await duoi(UID.keToanA, `select kho_duyet_phieu_nhap($1)`, [pn]);
  ok('Duyệt', d.loi === null, d.loi ?? '');

  tang = (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.lo_id = l.id where d.phieu_nhap_id = $1 and d.thu_tu = 1`, [pn])).rows[0];
  const ton = (await db.query(`select sum(so_kg)::numeric kg from kho_ton where lo_id = $1`, [tang.id])).rows[0].kg;
  ok('Tồn tảng = 11,8 kg (kg sau repack)', Number(ton) === 11.8, ton);
  const lg = (await db.query(`select gia_tri, so_kg_goc, gia_von_kg from kho_lo_gia where lo_id = $1`, [tang.id])).rows[0];
  ok('Giá trị lô 5.400.000 · giá vốn 5.400.000 / 11,8 = 457.627,1186 đ/kg',
     Number(lg.gia_tri) === 5400000 && Number(lg.so_kg_goc) === 11.8 && Number(lg.gia_von_kg) === 457627.1186, JSON.stringify(lg));
  const nhap = (await db.query(`select so_kg from kho_so_cai where lo_id = $1 and loai = 'nhap'`, [tang.id])).rows[0].so_kg;
  ok('Sổ kho dòng nhập 11,8 kg', Number(nhap) === 11.8);
  const vpn = (await duoi(UID.keToanA, `select tien_hang, tong_kg from kho_v_phieu_nhap where id = $1`, [pn])).rows[0];
  ok('Phiếu (công nợ): tiền hàng 8.400.000 — không bị giảm vì repack', Number(vpn.tien_hang) === 5400000 + 3000000, JSON.stringify(vpn));
  const thuong = (await db.query(`select lg.so_kg_goc from kho_lo_gia lg join kho_phieu_nhap_dong d on d.lo_id = lg.lo_id
    where d.phieu_nhap_id = $1 and d.thu_tu = 2`, [pn])).rows[0].so_kg_goc;
  ok('Món thường không ghi kg repack: lô 10 kg như cũ', Number(thuong) === 10);
  ok('kg TB mỗi tảng theo kg sau repack', Number((await db.query(`select kho_kg_tb_goi($1) as k`, [tang.id])).rows[0].k) === 11.8);
});

// ===========================================================================
await nhom('3 · HAO REPACK THEO NHÀ CUNG CẤP', async () => {
  const r = await duoi(UID.keToanA, `select * from kho_bao_cao_ncc($1, $2::date, $3::date)`, [cnA.id, await ngay(-30), homNay]);
  const n = r.rows?.find(x => x.nha_cung_cap_id === ncc);
  ok('Đánh giá NCC: 12 kg → 11,8 kg, hao 1,67% (chỉ dòng có kg repack)',
     Number(n?.kg_repack_ncc) === 12 && Number(n?.kg_repack_thuc) === 11.8 && Number(n?.hao_repack_pt) === 1.67, r.loi ?? JSON.stringify(n));
  ok('Tổng kg nhập của NCC vẫn theo kg NCC (22)', Number(n?.tong_kg) === 22);
  const tk = await duoi(UID.thuKhoA, `select * from kho_bao_cao_ncc($1, $2::date, $3::date)`, [cnA.id, await ngay(-30), homNay]);
  ok('Thủ kho xem được hao repack (không phải tiền)', Number(tk.rows?.find(x => x.nha_cung_cap_id === ncc)?.hao_repack_pt) === 1.67, tk.loi ?? '');
});

// ===========================================================================
await nhom('4 · LÓC TẢNG → LÔ RA NHỚ TẢNG GỐC', async () => {
  const p = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date,
      p_ghi_chu => null, p_vao => $5::jsonb, p_ra => $6::jsonb)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay, JSON.stringify([{ lo_id: tang.id, vi_tri_id: vt.kho }]),
     JSON.stringify([
       { mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 7, so_goi: 14, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
       { mat_hang_id: MH['C-THANNOI'].id, so_kg: 2, so_goi: 4, xu_ly: 'nhap_kho', vi_tri_id: vt.kho },
       { mat_hang_id: MH['P-MO'].id, so_kg: 1.5, xu_ly: 'bo' },
     ])]);
  ok('Phiên lóc tảng', p.loi === null, p.loi ?? '');
  phien = p.rows[0].phien_id;
  const g = await duoi(UID.thuKhoA, `select kho_giao_o_ma($1, null) as kq`, [phien]);
  ok('Giao ô 1', g.rows?.[0]?.kq?.[0]?.so_o === 1, g.loi ?? '');
  const pb = (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [phien])).rows[0].phien_ban;
  const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2)`, [phien, pb]);
  ok('Chốt', c.loi === null, c.loi ?? '');
  const ra = (await db.query(`select l.*, m.ma from kho_lo l join kho_mat_hang m on m.id = l.mat_hang_id where l.phien_pha_id = $1`, [phien])).rows;
  for (const r of ra) lo[r.ma] = r;
  ok('Hai lô ra, cả hai tang_goc_id = tảng', ra.length === 2 && ra.every(r => r.tang_goc_id === tang.id));
  const tong = (await db.query(`select sum(gia_tri)::bigint s from kho_lo_gia where lo_id = any($1::uuid[])`, [ra.map(r => r.id)])).rows[0].s;
  ok('Giá trị ra = 5.400.000 (hao ủ + phần bỏ dồn vào thịt)', Number(tong) === 5400000, tong);
  const v = await duoi(UID.nvQuayA, `select lo_id, so_tang from kho_v_lo_tang where chi_nhanh_id = $1 order by so_tang`, [cnA.id]);
  ok('kho_v_lo_tang: NV quầy đọc được, 3 lô cùng số tảng', v.rows?.length === 3 && v.rows.every(r => r.so_tang === tang.so_tang), v.loi ?? JSON.stringify(v.rows));
  ok('kho_v_lo_tang không có cột tiền', !Object.keys(v.rows?.[0] ?? {}).some(k => /gia|tien/.test(k)));

  await db.query(`update kho_cai_dat set chuyen_quay_can_nhan = false where chi_nhanh_id = $1`, [cnA.id]);
  const x = await duoi(UID.thuKhoA, `select * from kho_tao_phieu_xuat($1, $2, 'chuyen', $3, $4, null, null, null, $5::jsonb)`,
    [cnA.id, maGui(), vt.kho, vt.quay, JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, lo_id: lo['C-THANNGOAI'].id, so_goi: 6 }])]);
  ok('Đưa 6 gói ra quầy', x.loi === null, x.loi ?? '');
  const q = (await db.query(`select so_kg, so_goi from kho_ton where lo_id = $1 and vi_tri_id = $2`, [lo['C-THANNGOAI'].id, vt.quay])).rows[0];
  await db.query(`insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
    values ($1, $2, $3, $4, 'ban', -1, -2, 'ban_hang', gen_random_uuid())`, [cnA.id, lo['C-THANNGOAI'].id, vt.quay, MH['C-THANNGOAI'].id]);
  ok('Quầy bán 2 gói (1 kg)', Number(q?.so_goi) === 6);
});

// ===========================================================================
await nhom('5 · TRUY VẾT MỘT TẢNG', async () => {
  const r = await truyVet(UID.qlA, tang.id);
  const k = r.rows?.[0]?.kq;
  ok('Quản lý đọc được', r.loi === null && k?.co_gia === true, r.loi ?? '');
  const t = k?.tang;
  ok('Chuỗi cân: 12 → 11,8 (hao 1,67%) → vào lóc 11,8 → thịt 9 · bỏ 1,5 · hao 1,3',
     Number(t?.kg_ncc) === 12 && Number(t?.kg_repack) === 11.8 && Number(t?.hao_repack_pt) === 1.67
     && Number(t?.kg_vao_loc) === 11.8 && Number(t?.kg_thit) === 9 && Number(t?.kg_bo) === 1.5 && Number(t?.kg_hao_hut) === 1.3,
     JSON.stringify(t));
  ok('Thu hồi 76,27% · đã bán 1 kg · còn 8 kg · đang bán',
     Number(t?.thu_hoi_pt) === 76.27 && Number(t?.kg_ban) === 1 && Number(t?.kg_con) === 8 && t?.tinh_trang === 'dang_ban', JSON.stringify(t));
  ok('Chuỗi giá: NCC 450.000 → sau repack 457.627 → thịt 600.000 đ/kg',
     Number(t?.don_gia_ncc) === 450000 && Number(t?.gia_von_repack_kg) === 457627 && Number(t?.gia_von_thit_kg) === 600000, JSON.stringify(t));
  ok('Một phiên lóc', k?.phien?.length === 1 && k.phien[0].id === phien);
  const cn = k?.lo_ra?.find(x => x.lo_id === lo['C-THANNGOAI'].id);
  ok('Lô thăn ngoại cắt: ô 1 (10011) · bán 1 kg · còn ở kho và quầy',
     cn?.o_ma?.so_o === 1 && cn?.o_ma?.ma_can === '10011' && Number(cn?.kg_ban) === 1 && cn?.con?.length === 2, JSON.stringify(cn));
  const tuLoRa = await truyVet(UID.qlA, lo['C-THANNOI'].id);
  ok('Mở từ lô cắt ra → cùng tảng', tuLoRa.rows?.[0]?.kq?.tang?.lo_id === tang.id);
  const tk = (await truyVet(UID.thuKhoA, tang.id)).rows?.[0]?.kq;
  ok('Thủ kho: đủ kg, không có tiền', tk?.co_gia === false && Number(tk?.tang?.kg_repack) === 11.8
     && tk?.tang?.don_gia_ncc === null && tk?.tang?.gia_von_repack_kg === null && tk?.tang?.phieu_nhap_id === null
     && tk?.lo_ra?.every(x => x.gia_von_kg === null), JSON.stringify(tk?.tang));
  ok('NV quầy xem được', (await truyVet(UID.nvQuayA, tang.id)).loi === null);
  ok('Chi nhánh B không xem được', (await truyVet(UID.qlB, tang.id)).loi !== null);
  const thuong = (await db.query(`select lo_id from kho_phieu_nhap_dong where phieu_nhap_id = $1 and thu_tu = 2`, [pn])).rows[0].lo_id;
  const kt = await truyVet(UID.qlA, thuong);
  ok('Lô món thường → báo không thuộc tảng', /không thuộc tảng nào/.test(kt.loi ?? ''), kt.loi ?? '');

  const b = await baoCao(UID.qlA);
  ok('Báo cáo theo tảng: 1 dòng (món thường không vào)', b.rows?.length === 1 && b.rows[0].lo_id === tang.id, b.loi ?? '');
  const bTk = await baoCao(UID.thuKhoA);
  ok('Thủ kho xem báo cáo: cột tiền null', bTk.rows?.[0]?.gia_von_thit_kg === null && Number(bTk.rows?.[0]?.kg_con) === 8);
  ok('Chi nhánh B không đọc báo cáo của A', (await duoi(UID.qlB, `select * from kho_bao_cao_tang($1, $2::date, $3::date)`,
     [cnA.id, await ngay(-30), homNay])).loi !== null);
});

// ===========================================================================
await nhom('6 · HUỶ CẢ TẢNG', async () => {
  const ma = maGui();
  const khongLyDo = await huyTang(UID.thuKhoA, tang.id, ma, null);
  ok('Thiếu lý do → báo, không để lại gì', /chọn lý do/.test(khongLyDo.loi ?? '')
     && (await db.query(`select count(*)::int n from kho_huy_tang`)).rows[0].n === 0, khongLyDo.loi ?? '');
  const khongAnh = await huyTang(UID.thuKhoA, tang.id, ma, lyDoHuy, null);
  ok('Lý do cần ảnh mà không có ảnh → báo', /cần ít nhất một ảnh/.test(khongAnh.loi ?? ''), khongAnh.loi ?? '');
  ok('Chi nhánh B không huỷ được', (await huyTang(UID.qlB, tang.id, maGui())).loi !== null);
  const h = await huyTang(UID.thuKhoA, lo['C-THANNGOAI'].id, ma);
  const k = h.rows?.[0]?.kq;
  ok('Huỷ cả tảng (bấm từ lô cắt): 2 phiếu XH — kho và quầy', h.loi === null && k?.phieu?.length === 2 && k.phieu.every(p => /^XH/.test(p.so_phieu)),
     h.loi ?? JSON.stringify(k));
  const lai = (await huyTang(UID.thuKhoA, tang.id, ma)).rows?.[0]?.kq;
  ok('Bấm lại cùng mã gửi: không tạo thêm phiếu', lai?.da_co === true && lai.phieu.length === 2
     && (await db.query(`select count(*)::int n from kho_phieu_xuat where huy_tang_id is not null`)).rows[0].n === 2);
  const ton = (await db.query(`select v.loai, sum(t.so_kg)::numeric kg from kho_ton t join kho_vi_tri v on v.id = t.vi_tri_id
    join kho_lo l on l.id = t.lo_id where l.tang_goc_id = $1 and t.so_kg > 0 group by v.loai`, [tang.id])).rows;
  ok('Hàng của tảng nằm ở "Chờ huỷ" (8 kg)', ton.length === 1 && ton[0].loai === 'cho_huy' && Number(ton[0].kg) === 8, JSON.stringify(ton));
  const ghiChu = (await db.query(`select ghi_chu from kho_phieu_xuat where huy_tang_id is not null limit 1`)).rows[0].ghi_chu;
  ok('Ghi chú phiếu có số tảng', ghiChu.startsWith(`Huỷ cả tảng #${String(tang.so_tang).padStart(4, '0')}: Nhiệt độ`), ghiChu);
  const nua = await huyTang(UID.thuKhoA, tang.id, maGui());
  ok('Bấm lần hai (mã mới) khi mọi thứ đã chờ huỷ → báo hết hàng', /không còn hàng/.test(nua.loi ?? ''), nua.loi ?? '');

  for (const p of k.phieu) {
    const d = await duoi(UID.qlA, `select kho_duyet_phieu_huy($1)`, [p.id]);
    ok(`Quản lý duyệt ${p.so_phieu}`, d.loi === null, d.loi ?? '');
  }
  const b = (await baoCao(UID.qlA)).rows?.[0];
  ok('Báo cáo: huỷ 8 kg · còn 0 · hết · có ngày hết',
     Number(b?.kg_huy) === 8 && Number(b?.kg_con) === 0 && b?.tinh_trang === 'het' && b?.ngay_het !== null && b?.so_ngay_ban === 0, JSON.stringify(b));
  const o = (await db.query(`select con_giu from kho_v_o_ma_giao where phien_pha_id = $1`, [phien])).rows[0];
  ok('Ô 1 tự trống', o?.con_giu === false);
  const tv = (await truyVet(UID.qlA, tang.id)).rows?.[0]?.kq;
  ok('Truy vết liệt kê 2 phiếu huỷ đã duyệt', tv?.phieu_huy?.length === 2 && tv.phieu_huy.every(p => p.trang_thai === 'da_duyet'), JSON.stringify(tv?.phieu_huy));
});

// ===========================================================================
await nhom('7 · ĐỐI SOÁT', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('Tồn khớp sổ kho', rows.length === 0, JSON.stringify(rows));
});

process.exit(ketThuc('REPACK · TRUY VẾT TẢNG · HUỶ CẢ TẢNG'));
