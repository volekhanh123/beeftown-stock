/**
 * BEEFTOWN KHO — Kiểm thử cấp số tảng NGAY LÚC NHẬN HÀNG (0097)
 * ===========================================================
 *
 *     node test/test-kho-so-tang-luc-nhap.mjs
 *
 * Khánh chốt 25/10/2026: "cấp số tảng lúc nhập là cần thiết để kiểm soát". Trước 0097 số tảng chỉ
 * sinh lúc DUYỆT (0050) — tảng đã vào tủ ủ mà túi chưa có số, dòng bị bỏ thì không dấu vết.
 *
 * Bất biến:
 *   1. Dòng tảng có số ngay khi lưu (kho_ghi_dong_phieu_nhap cấp, sổ kho_so_tang_cap ghi số, phiếu,
 *      người cấp). Số giữ nguyên qua mọi lần lưu lại cả phiếu nếu dòng gửi lại khoá so_tang; dòng bị bỏ
 *      hay đổi sang món thường thì số ghi bỏ (bo_luc), không bao giờ cấp lại.
 *   2. Database không tin số máy gửi: số phải là số của chính phiếu này, chưa bỏ, không trùng dòng.
 *   3. Duyệt dùng đúng số của dòng; dòng chưa có số (tồn đầu kỳ dạng lưới, phiếu lưu trước 0097, món
 *      bật theo tảng sau khi lưu) thì sinh như cũ và ghi vào sổ.
 *   4. Sổ đủ: mọi số 1..so_cuoi có trong sổ; số chưa bỏ ↔ đúng một dòng; số đã bỏ không ở dòng hay lô;
 *      dòng đã duyệt mang đúng số của lô. kho_doi_soat_ton() rỗng.
 *   5. Web giữ số qua mọi lần gửi lại (thêm ảnh, sửa đầu phiếu, sửa dòng), chỉ hiện to số khi chính lần
 *      lưu đó được database xác nhận; mất mạng thì không bao giờ báo đã thêm.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  dungDatabase, taoBoDem, taoClientPg, UID, maGui, datGioDatabase, traGioDatabase, themMayIpos, UID_MAY_IPOS,
} from './kho-chung.mjs';
import { VIET } from './quet-chu-viet.mjs';
import * as NH from '../../web/src/lib/kho/nhan-hang.ts';
import * as NHAP from '../../web/src/lib/kho/nhap.ts';
import { MUC_HUONG_DAN } from '../../web/src/lib/kho/huong-dan.ts';
import { dichCau } from '../../web/src/lib/cau-noi-bo.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — SỐ TẢNG CẤP LÚC NHẬN HÀNG (0097)');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');
const co = (mod, ten) => typeof mod[ten] === 'function';

const { db, cnA, cnB, nsId, duoi, duoiAnon } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const clientCua = await taoClientPg({ db, duoi, duoiAnon });

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const MH = {};
let vtA, vtB, quayA, ncc;

// ---------------------------------------------------------------------------
// Khung
// ---------------------------------------------------------------------------
const anhMoi = cn => `${cn}/nhap/${maGui()}/1.jpg`;
/** Thủ kho lưu phiếu nhận hàng chỉ kg (kho_luu_phieu_nhap_kg). */
function luuKg(uid, t) {
  const cn = t.cn ?? cnA.id;
  return duoi(uid, `
    select * from kho_luu_phieu_nhap_kg(
      p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
      p_loai => 'mua', p_nha_cung_cap_id => $5, p_vi_tri_id => $6, p_ngay_nhap => $7::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_ghi_chu => null,
      p_anh_them => $8::text[], p_truong_them => '{}'::jsonb, p_dong => $9::jsonb)`,
    [t.id ?? null, cn, t.maGui ?? maGui(), t.phienBan ?? null, ncc, t.viTri ?? (cn === cnB.id ? vtB : vtA),
     t.ngay ?? homNay, t.id ? [] : [anhMoi(cn)], JSON.stringify(t.dong)]);
}
/** Quản lý lưu phiếu nhập đầy đủ (kho_luu_phieu_nhap — màn Phiếu nhập). */
function luuDu(uid, t) {
  return duoi(uid, `
    select * from kho_luu_phieu_nhap(
      p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4, p_loai => 'mua',
      p_nha_cung_cap_id => $5, p_vi_tri_id => $6, p_ngay_nhap => $7::date, p_so_hoa_don => null,
      p_ngay_hoa_don => null, p_han_thanh_toan => null, p_tien_thue => 0, p_chi_phi_khac => 0,
      p_ghi_chu => null, p_anh => $8::text[], p_truong_them => '{}'::jsonb, p_dong => $9::jsonb)`,
    [t.id ?? null, cnA.id, maGui(), t.phienBan ?? null, ncc, vtA, homNay, [], JSON.stringify(t.dong)]);
}
async function taoPhieu(uid, dong, t = {}) {
  const r = await luuKg(uid, { ...t, dong });
  if (r.loi) throw new Error(r.loi);
  return r.rows[0].phieu_id;
}
const pbCua = async id => (await db.query(`select phien_ban from kho_phieu_nhap where id = $1`, [id])).rows[0].phien_ban;
const luuLai = async (uid, id, dong, t = {}) => luuKg(uid, { ...t, id, phienBan: t.phienBan ?? await pbCua(id), dong });
const dongCua = async id => (await db.query(`
  select d.id, d.thu_tu, d.so_tang, d.so_kg::float8 as so_kg, d.ngay_mo::text as ngay_mo, d.so_kg_thuc::float8 as so_kg_thuc,
         d.so_goi, d.lo_id, d.don_gia_kg::float8 as don_gia_kg, m.ma
  from kho_phieu_nhap_dong d join kho_mat_hang m on m.id = d.mat_hang_id
  where d.phieu_nhap_id = $1 order by d.thu_tu`, [id])).rows;
/** "1,2,-,3": số tảng từng dòng theo thứ tự dòng ("-" = dòng không có số). */
const soCua = async id => (await dongCua(id)).map(d => d.so_tang ?? '-').join();
const soCuoi = async (cn = cnA.id) => Number((await db.query(`
  select coalesce((select so_cuoi from kho_so_thu_tu where chi_nhanh_id = $1 and loai = 'T' and ky = '-'), 0) as n`, [cn])).rows[0].n);
const soCap = async id => (await db.query(`select * from kho_so_tang_cap where phieu_nhap_id = $1 order by so_tang`, [id])).rows;
const docKg = (uid, id) => duoi(uid, `select kho_doc_phieu_nhap_kg($1) as p`, [id]);
const tang = (ma, kg, mo, x = {}) => ({ mat_hang_id: MH[ma].id, so_kg: kg, ngay_mo: mo, ...x });

/** Kế toán điền giá mọi dòng → thủ kho gửi → kế toán duyệt. Trả câu duyệt. */
async function guiVaDuyet(id, tk = UID.thuKhoA, kt = UID.keToanA) {
  const dong = await dongCua(id);
  const g = await duoi(kt, `select kho_dien_gia_phieu_nhap(p_id => $1, p_phien_ban => $2, p_so_hoa_don => null,
      p_ngay_hoa_don => null, p_han_thanh_toan => null, p_tien_thue => 0, p_chi_phi_khac => 0, p_gia => $3::jsonb) as pb`,
    [id, await pbCua(id), JSON.stringify(dong.map(d => ({ dong_id: d.id, don_gia_kg: 500000 })))]);
  if (g.loi) throw new Error(g.loi);
  const gui = await duoi(tk, `select kho_gui_duyet_phieu_nhap($1, $2)`, [id, g.rows[0].pb]);
  if (gui.loi) throw new Error(gui.loi);
  const d = await duoi(kt, `select kho_duyet_phieu_nhap($1) as cau`, [id]);
  if (d.loi) throw new Error(d.loi);
  return d.rows[0].cau;
}
const loCua = async id => (await db.query(`
  select l.id, l.so_tang, d.thu_tu, d.so_tang as so_dong from kho_lo l join kho_phieu_nhap_dong d on d.lo_id = l.id
  where d.phieu_nhap_id = $1 order by d.thu_tu`, [id])).rows;

/** Bất biến của sổ số tảng — trả danh sách chỗ hỏng (rỗng = đủ). */
async function batBien() {
  const hong = [];
  const q = async (ten, sql) => { const r = (await db.query(sql)).rows; if (r.length) hong.push(`${ten}: ${JSON.stringify(r).slice(0, 300)}`); };
  await q('sổ không đủ 1..so_cuoi', `
    select t.chi_nhanh_id, t.so_cuoi, count(c.so_tang) as n, max(c.so_tang) as m
    from kho_so_thu_tu t left join kho_so_tang_cap c on c.chi_nhanh_id = t.chi_nhanh_id
    where t.loai = 'T' and t.ky = '-' group by t.chi_nhanh_id, t.so_cuoi
    having count(c.so_tang) <> t.so_cuoi or coalesce(max(c.so_tang), 0) <> t.so_cuoi`);
  await q('sổ có số ở chi nhánh chưa từng sinh số', `
    select c.* from kho_so_tang_cap c where not exists (
      select 1 from kho_so_thu_tu t where t.chi_nhanh_id = c.chi_nhanh_id and t.loai = 'T' and t.ky = '-')`);
  await q('số chưa bỏ không ứng đúng một dòng của đúng phiếu', `
    select c.* from kho_so_tang_cap c where c.bo_luc is null and (
      select count(*) from kho_phieu_nhap_dong d
      where d.chi_nhanh_id = c.chi_nhanh_id and d.so_tang = c.so_tang and d.phieu_nhap_id = c.phieu_nhap_id) <> 1`);
  await q('số đã bỏ còn ở dòng hay lô', `
    select c.* from kho_so_tang_cap c where c.bo_luc is not null and (
      exists (select 1 from kho_phieu_nhap_dong d where d.chi_nhanh_id = c.chi_nhanh_id and d.so_tang = c.so_tang)
      or exists (select 1 from kho_lo l where l.chi_nhanh_id = c.chi_nhanh_id and l.so_tang = c.so_tang))`);
  await q('dòng có số mà sổ không có (hoặc đã bỏ, hoặc của phiếu khác)', `
    select d.id, d.so_tang from kho_phieu_nhap_dong d where d.so_tang is not null and not exists (
      select 1 from kho_so_tang_cap c where c.chi_nhanh_id = d.chi_nhanh_id and c.so_tang = d.so_tang
        and c.phieu_nhap_id = d.phieu_nhap_id and c.bo_luc is null)`);
  await q('dòng đã duyệt lệch số với lô', `
    select d.id, d.so_tang, l.so_tang as so_lo from kho_phieu_nhap_dong d join kho_lo l on l.id = d.lo_id
    where d.so_tang is distinct from l.so_tang`);
  await q('lô có số mà không dòng nào mang số đó', `
    select l.id, l.so_tang from kho_lo l where l.so_tang is not null and not exists (
      select 1 from kho_phieu_nhap_dong d where d.lo_id = l.id and d.so_tang = l.so_tang)`);
  await q('một số ở hai lô', `
    select chi_nhanh_id, so_tang from kho_lo where so_tang is not null group by 1, 2 having count(*) > 1`);
  return hong;
}

// ===========================================================================
await nhom('1 · CHUẨN BỊ', async () => {
  const chay = async (uid, sql, gt = []) => { const r = await duoi(uid, sql, gt); if (r.loi) throw new Error(`${sql.slice(0, 60)}… → ${r.loi}`); return r.rows; };
  await chay(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await chay(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await chay(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vtA = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnA.id])).rows[0].id;
  vtB = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnB.id])).rows[0].id;
  quayA = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'quay'`, [cnA.id])).rows[0].id;
  ncc = (await chay(UID.keToanA, `insert into kho_nha_cung_cap (ten, so_ngay_no) values ('NCC Úc', 15) returning id`))[0].id;
  const bat = await chay(UID.qlA, `update kho_mat_hang set theo_tang = true where ma in ('T-THANLUNG', 'T-THANNGOAI') returning id`);
  await chay(UID.qlA, `update kho_mat_hang set gia_ban_kg = 900000 where ma = 'C-THANNGOAI'`);
  const ct = (await chay(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Chuẩn') returning id`,
    [MH['T-THANNGOAI'].id]))[0].id;
  await chay(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien) values ($1, $2, 60)`,
    [ct, MH['C-THANNGOAI'].id]);
  const o = await chay(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10011') returning id`, [MH['C-THANNGOAI'].id]);
  ok('Quản lý bật theo tảng (Thăn lưng, Thăn ngoại), có công thức và ô mã 10011 cho Thăn ngoại cắt lát',
     bat.length === 2 && !!ct && o.length === 1);
});

// ===========================================================================
let P1;
const mo = {};
await nhom('2 · CẤP SỐ LÚC LƯU', async () => {
  mo.a = await ngay(-5); mo.b = await ngay(-8); mo.c = await ngay(-10);
  ok('Trước khi nhận: chưa sinh số tảng nào', await soCuoi() === 0);
  P1 = await taoPhieu(UID.thuKhoA, [
    tang('T-THANLUNG', 6.2, mo.a), tang('T-THANLUNG', 5.9, mo.a),
    { mat_hang_id: MH['T-NACVAI'].id, so_goi: 2, so_kg: 9 },
    tang('T-THANLUNG', 6.4, mo.b),
  ]);
  const tt = (await db.query(`select trang_thai from kho_phieu_nhap where id = $1`, [P1])).rows[0].trang_thai;
  ok('Thủ kho lưu dòng tảng → dòng có số tảng ngay, phiếu vẫn nháp', (await dongCua(P1))[0].so_tang === 1 && tt === 'nhap', tt);
  ok('Ba tảng lưu một lần → #1, #2, #3 theo thứ tự dòng; món thường không có số', await soCua(P1) === '1,2,-,3', await soCua(P1));
  const cap = await soCap(P1);
  ok('kho_so_tang_cap ghi số, phiếu, người cấp; bo_luc trống',
     cap.map(c => c.so_tang).join() === '1,2,3' && cap.every(c => c.phieu_nhap_id === P1 && c.nguoi_cap === nsId[UID.thuKhoA]
       && c.bo_luc === null && c.nguoi_bo === null && c.chi_nhanh_id === cnA.id), JSON.stringify(cap));
  const d = await docKg(UID.thuKhoA, P1);
  const p = d.rows?.[0]?.p;
  ok('kho_doc_phieu_nhap_kg trả so_tang của dòng khi lô chưa có, so_tang_bo rỗng',
     p?.dong?.[0]?.so_tang === 1 && p.dong[3]?.so_tang === 3 && p.dong[2]?.so_tang === null
     && Array.isArray(p.so_tang_bo) && p.so_tang_bo.length === 0, d.loi ?? JSON.stringify(p?.so_tang_bo));
  ok('Khoá mới không có chữ tiền (so_tang, so_tang_bo)',
     !/gia|tien|thue|chi_phi/.test(Object.keys(p ?? {}).filter(k => k.startsWith('so_tang')).join()));
});

// ===========================================================================
let P2;
const L = {};
await nhom('3 · SỐ GIỮ NGUYÊN QUA MỌI LẦN LƯU', async () => {
  L.t1 = tang('T-THANLUNG', 6.2, mo.a);
  L.t2 = tang('T-THANLUNG', 5.9, mo.a);
  L.nac = { mat_hang_id: MH['T-NACVAI'].id, so_goi: 2, so_kg: 9 };
  L.t3 = tang('T-THANLUNG', 6.4, mo.b);
  const truoc = await soCuoi();
  const lai = await luuLai(UID.thuKhoA, P1, [{ ...L.t1, so_tang: 1 }, { ...L.t2, so_tang: 2 }, L.nac, { ...L.t3, so_tang: 3 }]);
  ok('Lưu lại cả phiếu kèm so_tang → số không đổi, bộ đếm kho_so_thu_tu loại T đứng yên',
     !lai.loi && await soCua(P1) === '1,2,-,3' && await soCuoi() === truoc, lai.loi ?? await soCua(P1));

  const bo = await luuLai(UID.thuKhoA, P1, [{ ...L.t1, so_tang: 1 }, L.nac, { ...L.t3, so_tang: 3 }]);
  const cap2 = (await soCap(P1)).find(c => c.so_tang === 2);
  const tb = (await docKg(UID.thuKhoA, P1)).rows?.[0]?.p?.so_tang_bo;
  ok('Bỏ dòng giữa (#2) → #1, #3 giữ nguyên; #2 có bo_luc, nguoi_bo; so_tang_bo = [2]',
     !bo.loi && await soCua(P1) === '1,-,3' && cap2?.bo_luc !== null && cap2?.nguoi_bo === nsId[UID.thuKhoA]
     && JSON.stringify(tb) === '[2]', bo.loi ?? JSON.stringify({ cap2, tb }));

  L.t3 = tang('T-THANLUNG', 6.5, mo.c, { so_kg_thuc: 6.3 });
  const sua = await luuLai(UID.thuKhoA, P1, [{ ...L.t1, so_tang: 1 }, L.nac, { ...L.t3, so_tang: 3 }]);
  const d3 = (await dongCua(P1))[2];
  ok('Sửa dòng #3 (kg, ngày mổ, kg sau repack) → vẫn #3',
     !sua.loi && d3.so_tang === 3 && d3.so_kg === 6.5 && d3.ngay_mo === mo.c && d3.so_kg_thuc === 6.3, sua.loi ?? JSON.stringify(d3));

  const dao = await luuLai(UID.thuKhoA, P1, [{ ...L.t3, so_tang: 3 }, { ...L.t1, so_tang: 1 }, L.nac]);
  const dd = await dongCua(P1);
  ok('Đổi thứ tự dòng → số đi theo dòng, không theo vị trí',
     !dao.loi && await soCua(P1) === '3,1,-' && dd[0].so_kg === 6.5 && dd[1].so_kg === 6.2, dao.loi ?? await soCua(P1));

  L.t4 = tang('T-THANLUNG', 6.0, mo.a);
  const them = await luuLai(UID.thuKhoA, P1, [{ ...L.t3, so_tang: 3 }, { ...L.t1, so_tang: 1 }, L.nac, L.t4]);
  ok('Thêm tảng sau khi bỏ #2 → #4, không dùng lại #2', !them.loi && await soCua(P1) === '3,1,-,4' && await soCuoi() === 4,
     them.loi ?? await soCua(P1));

  const doiMon = await luuLai(UID.thuKhoA, P1, [{ ...L.t3, so_tang: 3 }, { ...L.t1, so_tang: 1 }, L.nac,
    { ...L.t4, mat_hang_id: MH['T-THANNGOAI'].id, so_tang: 4 }]);
  ok('Đổi món tảng sang món tảng khác → giữ số', !doiMon.loi && await soCua(P1) === '3,1,-,4'
     && (await dongCua(P1))[3].ma === 'T-THANNGOAI', doiMon.loi ?? await soCua(P1));

  const thuong = await luuLai(UID.thuKhoA, P1, [{ ...L.t3, so_tang: 3 }, { ...L.t1, so_tang: 1 }, L.nac,
    { mat_hang_id: MH['T-LOIVAI'].id, so_goi: 2, so_kg: 8, so_tang: 4 }]);
  const cap4 = (await soCap(P1)).find(c => c.so_tang === 4);
  const tb2 = (await docKg(UID.thuKhoA, P1)).rows?.[0]?.p?.so_tang_bo;
  ok('Đổi dòng #4 sang món không theo tảng, 2 gói (vẫn gửi so_tang 4) → #4 bỏ, dòng không còn số',
     !thuong.loi && await soCua(P1) === '3,1,-,-' && cap4?.bo_luc !== null && JSON.stringify(tb2) === '[2,4]',
     thuong.loi ?? JSON.stringify({ so: await soCua(P1), cap4, tb2 }));

  const capTruoc = JSON.stringify(await soCap(P1));
  const dong = await dongCua(P1);
  const g = await duoi(UID.keToanA, `select kho_dien_gia_phieu_nhap(p_id => $1, p_phien_ban => $2, p_so_hoa_don => null,
      p_ngay_hoa_don => null, p_han_thanh_toan => null, p_tien_thue => 0, p_chi_phi_khac => 0, p_gia => $3::jsonb) as pb`,
    [P1, await pbCua(P1), JSON.stringify(dong.map(d => ({ dong_id: d.id, don_gia_kg: 480000 })))]);
  ok('Kế toán điền giá (kho_dien_gia_phieu_nhap) → số không đổi',
     !g.loi && await soCua(P1) === '3,1,-,-' && JSON.stringify(await soCap(P1)) === capTruoc, g.loi ?? '');
  const giuGia = await luuLai(UID.thuKhoA, P1, [{ ...L.t3, so_tang: 3 }, { ...L.t1, so_tang: 1 }, L.nac,
    { mat_hang_id: MH['T-LOIVAI'].id, so_goi: 2, so_kg: 8 }]);
  ok('Thủ kho lưu lại sau khi kế toán điền giá → số giữ, giá giữ theo món',
     !giuGia.loi && await soCua(P1) === '3,1,-,-' && (await dongCua(P1)).every(d => d.don_gia_kg === 480000), giuGia.loi ?? '');

  // Màn Phiếu nhập đầy đủ (quản lý) đi cùng đường kho_ghi_dong_phieu_nhap.
  const day = { mat_hang_id: MH['T-THANLUNG'].id, so_kg: 6.1, ngay_mo: mo.a, don_gia_kg: 500000 };
  const r = await luuDu(UID.qlA, { dong: [day, { ...day, so_kg: 6.3 }] });
  P2 = r.rows?.[0]?.phieu_id;
  const so1 = P2 ? await soCua(P2) : '';
  const r2 = P2 ? await luuDu(UID.qlA, { id: P2, phienBan: await pbCua(P2),
    dong: [{ ...day, so_tang: 5 }, { ...day, so_kg: 6.3, so_tang: 6 }, { ...day, so_kg: 5.8 }] }) : { loi: 'không có P2' };
  ok('Phiếu nhập đầy đủ (kho_luu_phieu_nhap, vai quản lý) cũng giữ và cấp số y như màn Nhận hàng',
     !r.loi && !r2.loi && so1 === '5,6' && await soCua(P2) === '5,6,7'
     && (await soCap(P2)).every(c => c.nguoi_cap === nsId[UID.qlA]), r.loi ?? r2.loi ?? `${so1} → ${await soCua(P2)}`);

  // Khoảng giữa "chạy migration" và "deploy web": web cũ không gửi so_tang.
  const cu = await luuDu(UID.qlA, { id: P2, phienBan: await pbCua(P2), dong: [day, { ...day, so_kg: 6.3 }, { ...day, so_kg: 5.8 }] });
  const capP2 = await soCap(P2);
  ok('Lưu không kèm so_tang (web cũ, giữa lúc chạy migration và deploy) → mọi tảng nhận số mới, số cũ ghi bỏ',
     !cu.loi && await soCua(P2) === '8,9,10'
     && capP2.filter(c => c.bo_luc !== null).map(c => c.so_tang).join() === '5,6,7', cu.loi ?? await soCua(P2));
});

// ===========================================================================
await nhom('3b · WEB: GIỮ SỐ KHI GỬI LẠI CẢ PHIẾU (nhan-hang.ts, nhap.ts trên PGlite)', async () => {
  const U = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
  const dongDb = { id: U(1), thu_tu: 1, mat_hang_id: U(9), ten_mat_hang: 'Thăn lưng', dem_goi: true, don_vi_goi: 'tảng',
    so_goi: 1, so_kg: 6.2, so_lo_ncc: null, ngay_san_xuat: null, han_dung: '2026-11-20', truong_them: {}, lo_id: null,
    theo_tang: true, ngay_mo: '2026-10-20', so_tang: 142, so_kg_thuc: null };
  ok('HỒI QUY: dongLuuTuPhieu mang so_tang; dòng không có số thì không gửi khoá',
     NH.dongLuuTuPhieu(dongDb).so_tang === 142 && !('so_tang' in NH.dongLuuTuPhieu({ ...dongDb, so_tang: null }))
     && !('so_tang' in NH.dongLuuTuPhieu({ ...dongDb, so_tang: undefined })));

  const ds = [dongDb, { ...dongDb, id: U(2), thu_tu: 2, so_tang: null, theo_tang: false }];
  const moi = { mat_hang_id: U(9), so_kg: 6.5, so_goi: 1, so_lo_ncc: null, ngay_san_xuat: null, han_dung: null, truong_them: {}, ngay_mo: '2026-10-19' };
  const thay = NH.ghepDongNhan(ds, { thay: U(1), dong: moi });
  const thay2 = NH.ghepDongNhan(ds, { thay: U(2), dong: moi });
  const bo = NH.ghepDongNhan(ds, { bo: U(1) });
  ok('HỒI QUY: ghepDongNhan thay dòng giữ so_tang của dòng cũ; bỏ dòng thì số không còn trong danh sách gửi',
     thay?.[0]?.so_tang === 142 && thay[0].so_kg === 6.5 && thay[0].ngay_mo === '2026-10-19' && !('so_tang' in moi)
     && thay2?.[1] === moi && thay2[0].so_tang === 142
     && bo?.length === 1 && bo.every(d => d.so_tang !== 142), JSON.stringify({ thay, bo }));

  // Thêm tảng, thêm ảnh, sửa đầu phiếu bằng chính hàm của web, trên database thật.
  const tk = clientCua(UID.thuKhoA);
  const P4 = await taoPhieu(UID.thuKhoA, [tang('T-THANLUNG', 6.1, mo.a)]);
  const so0 = (await dongCua(P4))[0].so_tang;
  ok('HỒI QUY: nhan-hang.ts có soTangVuaThem và cauSoTangBo', co(NH, 'soTangVuaThem') && co(NH, 'cauSoTangBo'));
  let p = await NH.docPhieuNhan(tk, P4);
  const kq = await NH.themDongNhan(tk, cnA.id, p, p.phien_ban, maGui(), { ...NH.dongLuuTuPhieu(p.dong[0]), so_kg: 5.7, so_tang: undefined });
  const sauThem = await NH.docPhieuNhan(tk, P4);
  const vua = String(p.dong.length);
  ok('themDongNhan trả phienBan của chính lần lưu; soTangVuaThem đọc đúng số của dòng vừa thêm',
     kq.ok && kq.phienBan === sauThem.phien_ban && co(NH, 'soTangVuaThem')
     && NH.soTangVuaThem(sauThem, vua, String(kq.phienBan)) === so0 + 1, JSON.stringify(kq));
  const truoc = await soCua(P4);
  const g = maGui();
  const f = new FormData();
  f.set('ma_gui', g);
  f.append('anh_da_tai', `${cnA.id}/nhap/${g}/1.jpg`);
  const anh = await NH.themAnhNhan(tk, cnA.id, sauThem, sauThem.phien_ban, f);
  p = await NH.docPhieuNhan(tk, P4);
  const dau = await NH.luuPhieuNhan(tk, cnA.id, p, p.phien_ban, maGui(), p.dong.map(NH.dongLuuTuPhieu), {
    dau: { nha_cung_cap_id: p.nha_cung_cap_id, vi_tri_id: p.vi_tri_id, ngay_nhap: p.ngay_nhap, so_hoa_don: 'HD-9', truong_them: {} },
  });
  ok('themDongNhan rồi themAnhNhan và luuPhieuNhan sửa đầu phiếu → số mọi tảng không đổi',
     anh.ok && dau.ok && truoc === `${so0},${so0 + 1}` && await soCua(P4) === truoc && (await soCap(P4)).every(c => c.bo_luc === null),
     `${anh.cau} · ${dau.cau} · ${truoc} → ${await soCua(P4)}`);
  ok('luuPhieuNhan trả phienBan mới', dau.phienBan === await pbCua(P4), String(dau.phienBan));

  const fd = o => { const x = new FormData(); for (const [k, v] of Object.entries(o)) x.set(k, v); return x; };
  const mot = { so_dong: '1', d0_mat_hang: MH['T-THANLUNG'].id, d0_so_kg: '6,2', d0_ngay_mo: '2026-10-20' };
  const a = NHAP.docFormPhieuNhap(fd({ ...mot, d0_so_tang: '142' }), [], []);
  const b = NHAP.docFormPhieuNhap(fd({ ...mot, d0_so_tang: 'abc' }), [], []);
  const c = NHAP.docFormPhieuNhap(fd(mot), [], []);
  const x = NHAP.docFormPhieuNhap(fd({ ...mot, d0_so_tang: '142', d0_xoa: 'co' }), [], []);
  ok('docFormPhieuNhap: d0_so_tang "142" → payload so_tang 142; chữ hỏng → báo lỗi hai thứ tiếng, không gửi',
     a.loi.length === 0 && a.payload[0]?.so_tang === 142 && a.dong[0]?.so_tang === '142'
     && b.loi.some(l => /Dòng 1: số tảng hỏng/.test(l)) && b.loiEn.some(l => /Line 1: the primal number is damaged/.test(l))
     && !b.loiEn.some(l => VIET.test(l))
     && c.loi.length === 0 && !('so_tang' in (c.payload[0] ?? {})) && x.payload.length === 0,
     JSON.stringify({ a: a.payload, b: b.loi, c: c.payload }));
  ok('Phiếu nhập: dòng từ database → form mang so_tang (chuỗi), dòng trống không có số',
     NHAP.dongTuPhieu([{ ...dongDb, don_gia_kg: 0, thanh_tien: 0, so_tang: 7 }])[0].so_tang === '7' && NHAP.dongTrong().so_tang === '');

  const ph = { phien_ban: 9, dong: [{ ...dongDb, so_tang: 5 }, { ...dongDb, so_tang: null, theo_tang: false }, { ...dongDb, so_tang: 6 }] };
  const sv = co(NH, 'soTangVuaThem') ? NH.soTangVuaThem : () => 'thiếu hàm';
  ok('soTangVuaThem: đúng pb và đúng dòng → số; pb lệch, dòng không phải tảng, vua sai → null',
     sv(ph, '2', '9') === 6 && sv(ph, '0', '9') === 5 && sv(ph, '2', '8') === null && sv(ph, '1', '9') === null
     && sv(ph, '3', '9') === null && sv(ph, 'x', '9') === null && sv(ph, null, '9') === null && sv(ph, '2', null) === null
     && sv(ph, '2', '') === null && sv(ph, '-1', '9') === null);
  const cb = co(NH, 'cauSoTangBo') ? NH.cauSoTangBo(142) : { vi: '', en: '' };
  ok('cauSoTangBo: "Số tảng #0142 bỏ trống — gạch đi" hai thứ tiếng, tiếng Anh không lẫn chữ Việt',
     /#0142/.test(cb.vi) && /gạch/.test(cb.vi) && /#0142/.test(cb.en) && /cross it out/.test(cb.en) && !VIET.test(cb.en), JSON.stringify(cb));
});

// ===========================================================================
let P3;
await nhom('4 · DATABASE KHÔNG TIN SỐ MÁY GỬI', async () => {
  P3 = await taoPhieu(UID.thuKhoA, [tang('T-THANLUNG', 6, mo.a), tang('T-THANLUNG', 6.6, mo.a)]);
  const [x, y] = (await dongCua(P3)).map(d => d.so_tang);
  const a = tang('T-THANLUNG', 6, mo.a);
  const b = tang('T-THANLUNG', 6.6, mo.a);
  // Chi nhánh A — phép thử chi nhánh khác ở dưới tạo một phiếu (và một số) ở chi nhánh B.
  const chup = async () => JSON.stringify({ so: await soCuoi(), cap: (await db.query(`select * from kho_so_tang_cap where chi_nhanh_id = $1 order by so_tang`, [cnA.id])).rows,
    dong: await dongCua(P3), pb: await pbCua(P3) });
  const goc = await chup();
  const thu = async (dong, id = P3, uid = UID.thuKhoA, cn) => luuKg(uid, { id, phienBan: await pbCua(id), dong, cn });

  const r1 = await thu([{ ...a, so_tang: 9999 }, { ...b, so_tang: y }]);
  ok('Số chưa từng cấp (#9999) → báo "không phải số của phiếu này", sổ và bộ đếm không đổi',
     /Dòng 1 \(Thăn lưng nguyên tảng\): số tảng #9999 không phải số của phiếu này \(hoặc đã bỏ\) — tải lại trang/.test(r1.loi ?? '')
     && await chup() === goc, r1.loi ?? 'không báo');
  const en = dichCau('en', r1.loi ?? '');
  ok('Câu báo có bản tiếng Anh (cau-kho-en.ts), giữ số tảng', /primal #9999/.test(en) && !VIET.test(en.replace(/\(.*?\)/, '')), en);
  const r1b = await thu([{ ...a, so_tang: 123456 }, { ...b, so_tang: y }]);
  ok('Số lớn (#123456) → câu báo in đủ số, không cắt thành #1234', /số tảng #123456 không phải/.test(r1b.loi ?? ''), r1b.loi ?? '');
  const r2 = await thu([{ ...a, so_tang: 1 }, { ...b, so_tang: y }]);
  ok('Số của phiếu khác cùng chi nhánh (#1 của phiếu đầu) → báo', /số tảng #0001 không phải số của phiếu này/.test(r2.loi ?? ''), r2.loi ?? '');
  const PB = await taoPhieu(UID.thuKhoB, [tang('T-THANLUNG', 6, mo.a)], { cn: cnB.id });
  const soB = (await dongCua(PB))[0].so_tang;
  const r3 = await thu([{ ...a, so_tang: x }], PB, UID.thuKhoB, cnB.id);
  ok('Số của chi nhánh khác (số của phiếu chi nhánh A gửi vào phiếu chi nhánh B) → báo; chi nhánh B đếm riêng từ 1',
     soB === 1 && /không phải số của phiếu này/.test(r3.loi ?? '') && await soCuoi(cnB.id) === 1, r3.loi ?? '');
  const r4 = await luuKg(UID.thuKhoA, { id: P1, phienBan: await pbCua(P1), dong: [{ ...L.t3, so_tang: 3 }, { ...L.t1, so_tang: 2 }] });
  ok('Số đã bỏ của chính phiếu (#2) → báo (không dùng lại)', /số tảng #0002 không phải số của phiếu này \(hoặc đã bỏ\)/.test(r4.loi ?? ''), r4.loi ?? '');
  const r5 = await thu([{ ...a, so_tang: x }, { ...b, so_tang: x }]);
  ok('Hai dòng cùng một số → báo "đã có ở dòng khác"', new RegExp(`Dòng 2 \\(Thăn lưng nguyên tảng\\): số tảng #${String(x).padStart(4, '0')} đã có ở dòng khác của phiếu`).test(r5.loi ?? ''), r5.loi ?? '');
  const hong = [];
  for (const v of ['5', 1.5, -3, 0, true, { so: 1 }]) {
    const r = await thu([{ ...a, so_tang: v }, { ...b, so_tang: y }]);
    if (!/Dòng 1 \(Thăn lưng nguyên tảng\): số tảng không hợp lệ/.test(r.loi ?? '')) hong.push(`${JSON.stringify(v)} → ${r.loi}`);
  }
  ok('so_tang là chữ, số lẻ, số âm, số 0, true, object → báo "số tảng không hợp lệ"', hong.length === 0, hong.join(' | '));
  ok('Sau mọi lần bị từ chối: sổ, bộ đếm, dòng, phiên bản phiếu không đổi', await chup() === goc);

  const thuong = await thu([{ ...a, so_tang: x }, { ...b, so_tang: y }, { mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 3, so_tang: 9999 }]);
  ok('Gửi so_tang cho món không theo tảng → bỏ qua, dòng không có số, không thêm gì vào sổ',
     !thuong.loi && await soCua(P3) === `${x},${y},-`
     && !(await db.query(`select 1 from kho_so_tang_cap where so_tang = 9999`)).rows.length, thuong.loi ?? await soCua(P3));

  const truoc = await chup();
  const r6 = await thu([{ ...a, so_tang: x }, { ...b, so_tang: y }, tang('T-THANLUNG', 6.2, mo.a), tang('T-THANLUNG', -1, mo.a)]);
  ok('Lỗi ở dòng 4 sau một dòng tảng mới → cả lần lưu không ghi gì: dòng cũ còn nguyên số, sổ và bộ đếm không đổi (mat-mang phía database)',
     /Dòng 4/.test(r6.loi ?? '') && await chup() === truoc, r6.loi ?? 'không báo');
});

// ===========================================================================
await nhom('5 · BẤM HAI LẦN, GỬI LẠI', async () => {
  const g = maGui();
  const s0 = await soCuoi();
  const r1 = await luuKg(UID.thuKhoA, { maGui: g, dong: [tang('T-THANLUNG', 6, mo.a)] });
  const r2 = await luuKg(UID.thuKhoA, { maGui: g, dong: [tang('T-THANLUNG', 6, mo.a)] });
  const id = r1.rows?.[0]?.phieu_id;
  ok('Tạo phiếu kèm dòng tảng hai lần cùng ma_gui → một phiếu, da_co = true, một số',
     !r1.loi && !r2.loi && r2.rows[0].da_co === true && r2.rows[0].phieu_id === id && await soCuoi() === s0 + 1
     && (await soCap(id)).length === 1, r1.loi ?? r2.loi ?? '');

  const pb = await pbCua(id);
  const dong = [{ ...tang('T-THANLUNG', 6, mo.a), so_tang: s0 + 1 }, tang('T-THANLUNG', 6.3, mo.a)];
  const a = await luuKg(UID.thuKhoA, { id, phienBan: pb, dong });
  const b = await luuKg(UID.thuKhoA, { id, phienBan: pb, dong });
  ok('Hai lần lưu cùng phien_ban (bấm đúp "Thêm dòng") → lần sau báo máy khác, chỉ một số mới',
     !a.loi && /máy khác/.test(b.loi ?? '') && await soCuoi() === s0 + 2 && await soCua(id) === `${s0 + 1},${s0 + 2}`, a.loi ?? b.loi ?? '');

  // Web: bấm đúp "+ Thêm dòng" — lần sau vấp phien_ban cũ, đọc lại phiếu.
  const tk = clientCua(UID.thuKhoA);
  const P6 = await taoPhieu(UID.thuKhoA, [tang('T-THANLUNG', 6, mo.a)]);
  const p = await NH.docPhieuNhan(tk, P6);
  const moi = { mat_hang_id: MH['T-THANLUNG'].id, so_kg: 5.8, so_goi: 1, so_lo_ncc: null, ngay_san_xuat: null, han_dung: null,
                truong_them: {}, ngay_mo: mo.a };
  const s1 = await soCuoi();
  const k1 = await NH.themDongNhan(tk, cnA.id, p, p.phien_ban, maGui(), moi);
  const k2 = await NH.themDongNhan(tk, cnA.id, p, p.phien_ban, maGui(), moi);
  const lai = await NH.docPhieuNhan(tk, P6);
  ok('themDongNhan bấm đúp → lần sau "có thể đã thêm từ lần bấm trước", không cấp số thứ hai',
     k1.ok && typeof k1.phienBan === 'number' && k2.ok && await soCuoi() === s1 + 1 && lai.dong.length === 2
     && /lần bấm trước/.test(k2.cau) && /lần bấm trước|first time/.test(k2.cauEn ?? ''), JSON.stringify({ k1, k2 }));
  ok('Hai máy cùng món, cùng kg, cùng ngày mổ → máy sau KHÔNG được trang hiện to số (không phienBan), câu bảo đối chiếu',
     k2.phienBan === undefined && /[Đđ]ối chiếu/.test(k2.cau) && (!co(NH, 'soTangVuaThem') || NH.soTangVuaThem(lai, String(p.dong.length), String(k2.phienBan ?? '')) === null),
     JSON.stringify(k2));
  const k3 = await NH.themDongNhan(tk, cnA.id, p, p.phien_ban, maGui(), { ...moi, ngay_mo: mo.b });
  const k4 = await NH.themDongNhan(tk, cnA.id, p, p.phien_ban, maGui(), { ...moi, so_kg_thuc: 5.6 });
  ok('Dòng của máy khác cùng món, cùng kg nhưng khác ngày mổ (hay khác kg sau repack) → không bị nhận là lần bấm trước',
     !k3.ok && !k4.ok && /máy khác/.test(k3.cau) && await soCuoi() === s1 + 1, JSON.stringify({ k3, k4 }));
});

// ===========================================================================
await nhom('6 · DUYỆT DÙNG SỐ CỦA DÒNG', async () => {
  // P1: [#3 (đã có kg sau repack), #1, nạc vai 2 tảng, lõi vai 2 tảng] — thêm kg sau repack cho #1 rồi gửi, duyệt.
  const giu = await luuLai(UID.thuKhoA, P1, [{ ...L.t3, so_tang: 3 }, { ...L.t1, so_kg_thuc: 6.0, so_tang: 1 }, L.nac,
    { mat_hang_id: MH['T-LOIVAI'].id, so_goi: 2, so_kg: 8 }]);
  if (giu.loi) throw new Error(giu.loi);
  const s0 = await soCuoi();
  const cau = await guiVaDuyet(P1);
  const lo = await loCua(P1);
  ok('Lô tảng mang đúng số của dòng (#3, #1), bộ đếm không tăng lúc duyệt',
     /Đã duyệt phiếu/.test(cau) && lo.map(l => l.so_tang ?? '-').join() === '3,1,-,-' && await soCuoi() === s0, lo.map(l => l.so_tang).join());
  ok('Dòng đã duyệt: so_tang của dòng = so_tang của lô', lo.every(l => (l.so_dong ?? null) === (l.so_tang ?? null)));
  const lai = await duoi(UID.keToanA, `select kho_duyet_phieu_nhap($1) as cau`, [P1]);
  ok('Duyệt hai lần → "đã được duyệt trước đó", không thêm lô',
     /đã được duyệt trước đó/.test(lai.rows?.[0]?.cau ?? '') && (await loCua(P1)).length === 4 && await soCuoi() === s0, lai.loi ?? '');
  const docLai = (await docKg(UID.thuKhoA, P1)).rows?.[0]?.p;
  ok('kho_doc_phieu_nhap_kg sau duyệt: số của dòng = số của lô; so_tang_bo vẫn [2, 4]',
     docLai?.dong?.map(d => d.so_tang ?? '-').join() === '3,1,-,-' && JSON.stringify(docLai.so_tang_bo) === '[2,4]', JSON.stringify(docLai?.so_tang_bo));

  // Phiếu từ đơn đặt hàng: dòng tảng đặt 2 tảng một dòng, chưa ngày mổ — thủ kho sửa thành từng tảng (lưu) → có số ngay.
  const luuDon = await duoi(UID.qlA, `select * from kho_luu_don_dat(p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_ncc => $3, p_ngay_giao => $4::date, p_ghi_chu => null, p_dong => $5::jsonb)`,
    [cnA.id, maGui(), ncc, await ngay(1), JSON.stringify([{ mat_hang_id: MH['T-THANLUNG'].id, so_kg_dat: 12, so_goi_dat: 2 }])]);
  if (luuDon.loi) throw new Error(luuDon.loi);
  const don = luuDon.rows[0];
  const gd = await duoi(UID.qlA, `select kho_gui_don_dat($1, $2)`, [don.don_id, don.phien_ban_moi]);
  if (gd.loi) throw new Error(gd.loi);
  const td = await duoi(UID.thuKhoA, `select kho_tao_phieu_nhap_tu_don($1, $2) as id`, [don.don_id, maGui()]);
  if (td.loi) throw new Error(td.loi);
  const PD = td.rows[0].id;
  const truocSua = await dongCua(PD);
  const s1 = await soCuoi();
  const sua = await luuKg(UID.thuKhoA, { id: PD, phienBan: await pbCua(PD), dong: [
    tang('T-THANLUNG', 6, mo.a, { so_kg_thuc: 5.9 }), tang('T-THANLUNG', 5.9, mo.a, { so_kg_thuc: 5.8 })] });
  await db.query(`update kho_phieu_nhap set anh = array[$2] where id = $1`, [PD, anhMoi(cnA.id)]);
  const soSua = await soCua(PD);
  const s2 = await soCuoi();
  await guiVaDuyet(PD);
  ok('Phiếu từ đơn đặt hàng: thủ kho sửa dòng tảng (lưu) → có số ngay; duyệt dùng đúng số đó, bộ đếm không tăng',
     truocSua.length === 1 && truocSua[0].so_tang === null && !sua.loi && soSua === `${s1 + 1},${s1 + 2}`
     && (await loCua(PD)).map(l => l.so_tang).join() === `${s1 + 1},${s1 + 2}` && await soCuoi() === s2 && s2 === s1 + 2,
     sua.loi ?? `${soSua} · ${(await loCua(PD)).map(l => l.so_tang).join()}`);

  // Món bật theo tảng SAU khi lưu: dòng món thường đã có ngày mổ, kg sau repack, 1 tảng — chưa có số.
  const PN = await taoPhieu(UID.thuKhoA, [{ mat_hang_id: MH['T-THANNOI'].id, so_goi: 1, so_kg: 3.1, so_kg_thuc: 3.0, ngay_mo: mo.a }]);
  const chuaSo = await soCua(PN);
  const bat = await duoi(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'T-THANNOI'`);
  const s3 = await soCuoi();
  await guiVaDuyet(PN);
  const loN = await loCua(PN);
  const capN = await soCap(PN);
  ok('Món bật theo tảng sau khi lưu (dòng đã có ngày mổ, kg sau repack, 1 tảng) → duyệt sinh số, ghi vào sổ',
     chuaSo === '-' && !bat.loi && loN[0]?.so_tang === s3 + 1 && loN[0].so_dong === s3 + 1 && await soCuoi() === s3 + 1
     && capN.length === 1 && capN[0].so_tang === s3 + 1 && capN[0].nguoi_cap === nsId[UID.keToanA] && capN[0].bo_luc === null,
     JSON.stringify({ chuaSo, loN, capN }));

  // Tồn đầu kỳ dạng lưới: chèn thẳng dòng, tự duyệt (quản lý có duyet_nhap, cài đặt cho tự duyệt).
  const s4 = await soCuoi();
  const td2 = await duoi(UID.qlA, `select kho_luu_ton_dau_ky($1, $2, $3::date, $4::jsonb) as kq`, [cnA.id, maGui(), homNay,
    JSON.stringify([{ vi_tri_id: vtA, mat_hang_id: MH['T-THANLUNG'].id, so_goi: 1, so_kg: 5.5 }])]);
  const ptd = td2.rows?.[0]?.kq?.phieu?.[0];
  const loTd = ptd ? await loCua(ptd.phieu_id) : [];
  const capTd = ptd ? await soCap(ptd.phieu_id) : [];
  ok('Tồn đầu kỳ dạng lưới (kho_luu_ton_dau_ky) → duyệt sinh số như cũ, ghi vào sổ cùng phiếu, dòng mang số của lô',
     !td2.loi && ptd?.trang_thai === 'da_duyet' && loTd[0]?.so_tang === s4 + 1 && loTd[0].so_dong === s4 + 1
     && capTd.length === 1 && capTd[0].nguoi_cap === nsId[UID.qlA], td2.loi ?? JSON.stringify({ ptd, loTd, capTd }));

  // Dòng có số mà món bị tắt theo tảng trước khi duyệt.
  await duoi(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'T-LOIVAI'`);
  const PL = await taoPhieu(UID.thuKhoA, [tang('T-LOIVAI', 4.2, mo.a, { so_kg_thuc: 4.1, so_goi: 1 })]);
  const soL = (await dongCua(PL))[0].so_tang;
  const tat = await duoi(UID.qlA, `update kho_mat_hang set theo_tang = false where ma = 'T-LOIVAI'`);
  const s5 = await soCuoi();
  await guiVaDuyet(PL);
  const loL = await loCua(PL);
  const capL = (await soCap(PL))[0];
  ok('Dòng có số mà món đã tắt theo tảng trước khi duyệt → lô không số, số ghi bỏ, dòng không còn số',
     soL === s5 && !tat.loi && loL[0]?.so_tang === null && loL[0].so_dong === null && capL?.bo_luc !== null
     && capL.nguoi_bo === nsId[UID.keToanA] && await soCuoi() === s5, JSON.stringify({ soL, loL, capL }));

  // Hủy phiếu nháp đã có số: số chết theo phiếu, không cấp lại.
  const PH = await taoPhieu(UID.thuKhoA, [tang('T-THANLUNG', 6, mo.a)]);
  const soH = (await dongCua(PH))[0].so_tang;
  const huy = await duoi(UID.thuKhoA, `select kho_huy_phieu_nhap($1, null) as cau`, [PH]);
  const tbH = (await docKg(UID.thuKhoA, PH)).rows?.[0]?.p?.so_tang_bo;
  const PH2 = await taoPhieu(UID.thuKhoA, [tang('T-THANLUNG', 6, mo.a)]);
  ok(`Hủy phiếu nháp có tảng #${soH} → so_tang_bo của phiếu có số đó, số không cấp lại`,
     !huy.loi && JSON.stringify(tbH) === JSON.stringify([soH]) && (await dongCua(PH2))[0].so_tang === soH + 1,
     huy.loi ?? JSON.stringify(tbH));

  const bb = await batBien();
  ok('Bất biến: mọi số 1..so_cuoi đều có trong sổ; số chưa bỏ ↔ đúng một dòng phiếu; số đã bỏ không ở dòng, lô; dòng đã duyệt = số của lô; không số nào ở hai lô',
     bb.length === 0, bb.join(' | '));
});

// ===========================================================================
await nhom('7 · QUYỀN', async () => {
  const anon1 = await duoiAnon(`select * from kho_luu_phieu_nhap_kg(p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date, p_so_hoa_don => null, p_ngay_hoa_don => null,
      p_ghi_chu => null, p_anh_them => '{}'::text[], p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vtA, homNay, JSON.stringify([tang('T-THANLUNG', 6, mo.a)])]);
  const anon2 = await duoiAnon(`select kho_doc_phieu_nhap_kg($1)`, [P1]);
  ok('Chưa đăng nhập (duoiAnon): không gọi được kho_luu_phieu_nhap_kg, kho_doc_phieu_nhap_kg',
     /permission denied/.test(anon1.loi ?? '') && /permission denied/.test(anon2.loi ?? ''), `${anon1.loi} | ${anon2.loi}`);

  const s0 = await soCuoi();
  const bLuu = await luuKg(UID.thuKhoB, { id: P3, phienBan: await pbCua(P3), dong: [tang('T-THANLUNG', 6, mo.a)], cn: cnA.id });
  const bLuu2 = await luuKg(UID.thuKhoB, { id: P3, phienBan: await pbCua(P3), dong: [tang('T-THANLUNG', 6, mo.a)], cn: cnB.id });
  const bDoc = await docKg(UID.thuKhoB, P1);
  ok('Thủ kho chi nhánh B không lưu được phiếu chi nhánh A, không đọc được số tảng của A',
     !!bLuu.loi && !!bLuu2.loi && /Không tìm thấy phiếu nhập/.test(bDoc.loi ?? '') && await soCuoi() === s0,
     `${bLuu.loi} | ${bLuu2.loi} | ${bDoc.loi}`);

  const hong = [];
  for (const [ten, uid] of [['Nhân sự đã nghỉ', UID.nghiViec], ['Tài khoản không có nhan_su', null],
                            ['NV quầy', UID.nvQuayA], ['Kế toán', UID.keToanA]]) {
    const moi = await luuKg(uid, { dong: [tang('T-THANLUNG', 6, mo.a)] });
    const cu = await luuKg(uid, { id: P3, phienBan: await pbCua(P3), dong: [tang('T-THANLUNG', 6, mo.a)] });
    if (!/không được lập phiếu nhập/.test(moi.loi ?? '') || !/không được lập phiếu nhập/.test(cu.loi ?? '')) hong.push(`${ten}: ${moi.loi} | ${cu.loi}`);
  }
  ok('Nhân sự đã nghỉ, tài khoản không có nhan_su (duoi(null)), NV quầy, kế toán: không lưu được dòng tảng, không tốn số',
     hong.length === 0 && await soCuoi() === s0, hong.join(' | '));

  const hongBang = [];
  for (const [ten, uid] of [['Chủ', UID.chu], ['Quản lý', UID.qlA], ['Thủ kho', UID.thuKhoA], ['Kế toán', UID.keToanA]]) {
    const doc1 = await duoi(uid, `select count(*)::int as n from kho_so_tang_cap`);
    const ghi = await duoi(uid, `insert into kho_so_tang_cap (chi_nhanh_id, so_tang, phieu_nhap_id) values ($1, 99999, $2)`, [cnA.id, P3]);
    const sua = await duoi(uid, `update kho_so_tang_cap set bo_luc = null`);
    if (!doc1.loi || !ghi.loi || !sua.loi) hongBang.push(`${ten}: ${doc1.loi ?? JSON.stringify(doc1.rows)} | ${ghi.loi} | ${sua.loi}`);
  }
  const an = await duoiAnon(`select count(*) from kho_so_tang_cap`);
  ok('Không ai đọc hay ghi thẳng kho_so_tang_cap (RLS, không policy, thu quyền bảng) — kể cả chủ; anon cũng không',
     hongBang.length === 0 && !!an.loi && (await db.query(`select relrowsecurity from pg_class where relname = 'kho_so_tang_cap'`)).rows[0]?.relrowsecurity === true,
     hongBang.join(' | ') || an.loi || 'RLS chưa bật');

  const ghiDong = await duoi(UID.qlA, `select kho_ghi_dong_phieu_nhap($1, $2, $3::date, '[]'::jsonb)`, [P3, cnA.id, homNay]);
  const sinh = await duoi(UID.qlA, `select kho_sinh_so_tang($1)`, [cnA.id]);
  ok('kho_ghi_dong_phieu_nhap và kho_sinh_so_tang gọi thẳng → permission denied, không tốn số',
     /permission denied/.test(ghiDong.loi ?? '') && /permission denied/.test(sinh.loi ?? '') && await soCuoi() === s0,
     `${ghiDong.loi} | ${sinh.loi}`);
});

// ===========================================================================
await nhom('8 · GIỜ VIỆT NAM', async () => {
  const s0 = await soCuoi();
  let a, sai, b;
  try {
    await datGioDatabase(db, '2026-10-31T16:50:00Z');   // 23:50 giờ VN ngày 31/10
    a = await luuKg(UID.thuKhoA, { ngay: '2026-10-31', dong: [tang('T-THANLUNG', 6, '2026-10-20')] });
    sai = await luuKg(UID.thuKhoA, { ngay: '2026-11-01', dong: [tang('T-THANLUNG', 6, '2026-10-20')] });
    await datGioDatabase(db, '2026-10-31T17:10:00Z');   // 00:10 giờ VN ngày 01/11 — UTC vẫn là 31/10
    b = await luuKg(UID.thuKhoA, { ngay: '2026-11-01', dong: [tang('T-THANLUNG', 6, '2026-10-20')] });
  } finally {
    await traGioDatabase(db);
  }
  const soA = a.rows ? (await dongCua(a.rows[0].phieu_id))[0].so_tang : null;
  const soB = b.rows ? (await dongCua(b.rows[0].phieu_id))[0].so_tang : null;
  ok('23:50 giờ VN 31/10 (16:50Z) và 00:10 giờ VN 01/11 (17:10Z, UTC còn 31/10): số tảng nối tiếp, không đặt lại theo ngày hay tháng; ngày nhận 01/11 nhận được lúc 00:10, chưa nhận được lúc 23:50',
     !a.loi && !b.loi && soA === s0 + 1 && soB === s0 + 2 && /Ngày nhập không được sau hôm nay/.test(sai.loi ?? ''),
     `${a.loi ?? soA} | ${sai.loi} | ${b.loi ?? soB}`);

  const s1 = await soCuoi();
  const r = await luuKg(UID.thuKhoA, { dong: [tang('T-THANLUNG', 6, '2026-02-31')] });
  const truoc = await soCua(P3);
  const r2 = await luuLai(UID.thuKhoA, P3, [...(await dongCua(P3)).filter(d => d.so_tang).map(d => tang('T-THANLUNG', d.so_kg, mo.a, { so_tang: d.so_tang })),
    tang('T-THANLUNG', 6, '2026-02-31')]);
  ok('Ngày mổ 31/02 → báo "ngày mổ không hợp lệ", không tốn số, phiếu đang có giữ nguyên số',
     /ngày mổ không hợp lệ/.test(r.loi ?? '') && /ngày mổ không hợp lệ/.test(r2.loi ?? '') && await soCuoi() === s1 && await soCua(P3) === truoc,
     `${r.loi} | ${r2.loi}`);
});

// ===========================================================================
await nhom('9 · CHUỖI NHẬN → DUYỆT → LÓC → BÁN', async () => {
  const chay = async (uid, sql, gt = []) => { const r = await duoi(uid, sql, gt); if (r.loi) throw new Error(`${sql.slice(0, 60)}… → ${r.loi}`); return r.rows; };
  const P9 = await taoPhieu(UID.thuKhoA, [tang('T-THANNGOAI', 6, await ngay(-15), { so_kg_thuc: 5.9 })]);
  const soNhan = (await dongCua(P9))[0].so_tang;
  await guiVaDuyet(P9);
  const loTang = (await loCua(P9))[0];
  ok(`Nhận tảng thăn ngoại → #${soNhan} lúc lưu; duyệt → lô mang đúng số đó`, soNhan > 0 && loTang.so_tang === soNhan);

  const ph = (await chay(UID.thuKhoA, `
    select * from kho_luu_phien_pha(p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date, p_ghi_chu => null, p_vao => $5::jsonb, p_ra => $6::jsonb)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay, JSON.stringify([{ lo_id: loTang.id, vi_tri_id: vtA }]),
     JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 2, so_goi: 4, xu_ly: 'nhap_kho', vi_tri_id: quayA, han_dung: await ngay(5) }])]))[0].phien_id;
  await chay(UID.thuKhoA, `select kho_giao_o_ma($1, null)`, [ph]);
  await chay(UID.thuKhoA, `select kho_chot_phien_pha($1, $2)`, [ph, (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [ph])).rows[0].phien_ban]);
  const loRa = (await db.query(`select lo_id from kho_phien_pha_ra where phien_pha_id = $1`, [ph])).rows[0].lo_id;
  const vl = (await db.query(`select so_tang, tang_id from kho_v_lo_tang where lo_id = $1`, [loRa])).rows[0];
  ok(`Lóc tảng #${soNhan}, giao ô 10011, chốt → lô phần cắt mang tảng gốc #${soNhan} (kho_v_lo_tang)`,
     vl?.so_tang === soNhan && vl.tang_id === loTang.id, JSON.stringify(vl));

  await chay(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb)`, [cnA.id,
    JSON.stringify({ bat: true, pos_parent: 'BEEFTOWN', pos_id: '5898', vi_tri_ban_id: quayA })]);
  await chay(UID.chu, `select kho_ipos_chuyen_sang($1, $2::timestamptz)`, [cnA.id, new Date(Date.now() - 3 * 86400000).toISOString()]);
  await db.query(`update kho_o_ma_giao set tu_luc = now() - interval '2 days'`);
  const luc = new Date(Date.now() + 7 * 3600000 - 20 * 60000).toISOString().slice(0, 19) + '+07:00';
  const hd = { ma_hd: '5898:9001', thoi_diem_ban: luc, da_huy: false, raw: { event_id: 11 },
               dong: [{ khoa_dong: 0, ma_ipos: '10011', ten_ipos: 'Thăn ngoại ô 1', so_luong: 0.5, thanh_tien: 450000 }] };
  await chay(UID_MAY_IPOS.mayIposA, `select kho_ipos_nhan_callback($1, $2::jsonb)`, [cnA.id, JSON.stringify(hd)]);
  const d = (await db.query(`select d.* from kho_ipos_dong d join kho_ipos_hoa_don h on h.id = d.hoa_don_id where h.ma_hd = '5898:9001'`)).rows[0];
  const tru = (await db.query(`select lo_id, -sum(so_goi)::int as goi from kho_so_cai where chung_tu_loai = 'ban_hang' and chung_tu_id = $1
    and loai = 'ban' group by lo_id`, [d?.id])).rows;
  const v = await duoi(UID.qlA, `select so_tang from kho_v_ipos_dong where id = $1`, [d?.id]);
  ok(`Bán ô 10011 qua kho_ipos_nhan_callback → trừ lô phần cắt của tảng #${soNhan}; kho_v_ipos_dong.so_tang = ${soNhan}`,
     d?.trang_thai === 'da_ghi' && tru.length === 1 && tru[0].lo_id === loRa && tru[0].goi === 1 && v.rows?.[0]?.so_tang === soNhan,
     v.loi ?? JSON.stringify({ d: d && { trang_thai: d.trang_thai, ly_do: d.ly_do }, tru, v: v.rows }));

  const ds = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
  ok('kho_doi_soat_ton() rỗng', ds.length === 0, JSON.stringify(ds));
  const bb = await batBien();
  ok('Bất biến của sổ số tảng vẫn đủ ở cuối chuỗi', bb.length === 0, bb.join(' | '));
});

// ===========================================================================
await nhom('10 · TRANG, CÂU CHỮ, MẤT MẠNG', async () => {
  const nh = doc('web/src/pages/noi-bo/kho/nhan-hang/[id].astro');
  ok('HỒI QUY: nhận hàng hiện to số tảng (soTangVuaThem, soTangChu) kèm "viết số này lên túi" vi/en',
     /soTangVuaThem\(/.test(nh) && /soTangChu\(soTangVua\)/.test(nh) && /class="nh-so-tang-so"/.test(nh)
     // Lệnh gửi lên bị lỗi (trang hiện lại form, URL còn ?vua=&pb= của lần trước) → không hiện lại số cũ.
     && /const soTangVua = phieu && soanDuoc && !form/.test(nh)
     && /vietLenTui: \{ vi: 'Viết số này lên túi[^']*', en: 'Write this number on the bag[^']*' \}/.test(nh) && /t\.vietLenTui/.test(nh));
  ok('Chuyển hướng sau thêm tảng giữ ?tiep=…&mo= và thêm vua, pb (chỉ khi chính lần lưu trả phienBan)',
     /\?tiep=\$\{r\.luu\.mat_hang_id\}&mo=/.test(nh) && /&vua=\$\{p\.dong\.length\}&pb=\$\{kq\.phienBan\}/.test(nh) && /kq\.phienBan/.test(nh));
  ok('Bỏ dòng tảng, sửa dòng tảng sang món thường: câu báo dùng cauSoTangBo; dưới "Hàng đã cân" có số tảng đã bỏ',
     (nh.match(/cauSoTangBo\(/g) ?? []).length >= 2 && /so_tang_bo/.test(nh) && /soTangBo:/.test(nh));
  ok('Màn nhận hàng chỉ dùng lớp có sẵn (.nb-bao.xong role="status"), không mã màu mới', /class="nb-bao xong nh-so-tang" role="status"/.test(nh)
     && !/#[0-9a-fA-F]{3,6}\b/.test(nh.slice(nh.indexOf('<style>'))));
  const nhap = doc('web/src/pages/noi-bo/kho/nhap/[id].astro');
  ok('Phiếu nhập đầy đủ: ô ẩn d${i}_so_tang, bản in lấy d.so_tang khi chưa có lô',
     /type="hidden" name=\{`d\$\{i\}_so_tang`\}/.test(nhap) && /chuTang\(d\.lo_id \? soTang\.get\(d\.lo_id\) \?\? d\.so_tang : d\.so_tang, nn\)/.test(nhap));
  const m = MUC_HUONG_DAN.find(x => x.id === 'theo-tang');
  const vi = m?.buoc.map(b => b.vi).join(' | ') ?? '';
  const en = m?.buoc.map(b => b.en).join(' | ') ?? '';
  const iNhan = m?.buoc.findIndex(b => /^Nhận hàng/.test(b.vi)) ?? -1;
  const iSo = m?.buoc.findIndex(b => /số tảng/.test(b.vi) && /lên túi/.test(b.vi)) ?? -1;
  const iRepack = m?.buoc.findIndex(b => /^\*\*Repack\*\*/.test(b.vi)) ?? -1;
  ok('Hướng dẫn theo-tang không còn "Duyệt xong, mỗi tảng có số tảng", có câu viết số lúc nhận (ngay sau bước Nhận hàng)',
     !/Duyệt xong, mỗi tảng có/.test(vi) && !/Once approved, each primal gets/.test(en) && iSo === iNhan + 1 && iSo >= 0
     && (iRepack < 0 || iSo < iRepack) && /primal number/.test(m?.buoc[iSo]?.en ?? ''), vi);
  const nhc = MUC_HUONG_DAN.find(x => x.id === 'nhan-hang-can');
  ok('Hướng dẫn nhận hàng: mẹo về số tảng hiện sau khi thêm tảng (hai thứ tiếng)',
     (nhc?.meo ?? []).some(x => /số tảng/.test(x.vi) && /primal number/.test(x.en)));

  for (const c of [
    'Dòng 3 (Thăn lưng nguyên tảng): số tảng không hợp lệ',
    'Dòng 3 (Thăn lưng nguyên tảng): số tảng #0142 không phải số của phiếu này (hoặc đã bỏ) — tải lại trang',
    'Dòng 3 (Thăn lưng nguyên tảng): số tảng #0142 đã có ở dòng khác của phiếu',
  ]) {
    const e = dichCau('en', c);
    ok(`Câu database mới có bản tiếng Anh: "${c.slice(25, 60)}…"`, e !== c && /^Line 3 \(/.test(e) && !VIET.test(e.replace(/\(Thăn lưng nguyên tảng\)/, ''))
       && !/\b(price|cost|amount)s?\b/i.test(e), e);
  }

  // Mất mạng: không bao giờ ok, không bao giờ có phienBan (trang không hiện to số).
  const p = { id: '00000000-0000-4000-8000-000000000999', loai: 'mua', nha_cung_cap_id: null, vi_tri_id: vtA, ngay_nhap: homNay,
              so_hoa_don: null, ngay_hoa_don: null, ghi_chu: null, truong_them: {}, phien_ban: 3, dong: [] };
  const moi = { mat_hang_id: MH['T-THANLUNG'].id, so_kg: 6, so_goi: 1, so_lo_ncc: null, ngay_san_xuat: null, han_dung: null, truong_them: {}, ngay_mo: mo.a };
  const gia = {
    'trả 500': { rpc: async () => ({ data: null, error: { message: 'Internal Server Error', code: '500' } }) },
    'ném lỗi fetch': { rpc: async () => { throw new TypeError('fetch failed'); } },
    'hết giờ': { rpc: async () => ({ data: null, error: { message: 'canceling statement due to statement timeout', code: '57014' } }) },
    'trả rỗng': { rpc: async () => ({ data: [], error: null }) },
    'máy khác rồi mất mạng khi đọc lại': {
      lan: 0,
      async rpc(ten) {
        if (ten === 'kho_luu_phieu_nhap_kg') return { data: null, error: { message: 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.', code: '23514' } };
        throw new TypeError('fetch failed');
      },
    },
  };
  const hong = [];
  for (const [ten, c] of Object.entries(gia)) {
    const l = await NH.luuPhieuNhan(c, cnA.id, p, 3, maGui(), [moi]).then(k => k, e => ({ ok: false, nem: String(e) }));
    const t = await NH.themDongNhan(c, cnA.id, p, 3, maGui(), moi).then(k => k, e => ({ ok: false, nem: String(e) }));
    if (l.ok || l.phienBan !== undefined || t.ok || t.phienBan !== undefined) hong.push(`${ten}: ${JSON.stringify({ l, t })}`);
  }
  ok('Mất mạng: luuPhieuNhan / themDongNhan với client giả trả 500, hết giờ, rỗng hoặc ném lỗi → không bao giờ ok, không có phienBan',
     hong.length === 0, hong.join(' | '));
});

process.exit(ketThuc('SỐ TẢNG CẤP LÚC NHẬN HÀNG'));
