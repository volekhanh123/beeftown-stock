/**
 * BEEFTOWN KHO — Danh mục hàng của từng nhà cung cấp (0110, đợt 1: nhận hàng)
 * ===========================================================================
 *
 *     node test/test-kho-ncc-mat-hang.mjs
 *
 * Khánh chốt 29/10/2026: chọn nhà cung cấp rồi chọn món, hoặc chọn món rồi chọn nhà cung cấp; "NCC nào bán món
 * nào" máy tự học, quản lý sửa tay được; đợt 1 làm Nhận hàng.
 *
 *   1. quyền: đọc = nhap hoặc ncc của đúng chi nhánh; ghi = ncc. anon, nhân viên quầy, chi nhánh khác, đã nghỉ,
 *      không có nhan_su đều bị từ chối; bảng sửa tay không ghi thẳng được;
 *   2. tự học: chỉ phiếu MUA đã gửi / đã duyệt — nháp, bị trả về, đã hủy, tồn đầu kỳ không tính; phiếu hủy sau rơi
 *      khỏi danh sách; NCC hay món ngừng dùng không hiện;
 *   3. lần trước ở chi nhánh đang xem: số lần, ngày, kg (cộng các dòng cùng món trên phiếu gần nhất), số cái;
 *      chi nhánh khác thấy cặp nhưng không có số;
 *   4. sửa tay: thêm cặp chưa giao, bỏ (phiếu sau giao lại vẫn bỏ), thêm lại, NCC chính (mỗi món một — đặt NCC khác
 *      thì NCC cũ thôi), "thôi là chính" không thêm lại cặp đã bỏ (trang cũ), bấm hai lần cùng trạng thái, việc lạ /
 *      NCC ngừng dùng bị từ chối; lọc theo NCC / món;
 *   5. web (ncc-mat-hang.ts): xếp món của NCC, NCC của món, chữ "Lần trước" vi / en kiểu số Việt, ?mon= lạ; luuNccMon
 *      chạy thật trên PGlite qua client giả — câu "đã" chỉ khi database nhận, mất mạng không bao giờ thành "đã";
 *   6. mã nguồn trang: nhận hàng hai lối, cài đặt NCC; kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';
import {
  docNccMon, monCuaNcc, nccCuaMon, chuLanTruoc, chuNccCuaMon, chuChuaGiao, docMonChon, luuNccMon,
} from '../../web/src/lib/kho/ncc-mat-hang.ts';
import { dichCau } from '../../web/src/lib/cau-noi-bo.ts';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — DANH MỤC HÀNG CỦA TỪNG NHÀ CUNG CẤP');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });
const KHONG_NS = '00000000-0000-4000-8000-0000000000ee';

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const MH = {};
const NCC = {};
const viTri = { A: null, B: null };

const taoMon = async (ma, ten, loai, them = {}) => {
  const r = await duoi(UID.qlA, `
    insert into kho_mat_hang (ma, ten, loai, dem_goi, don_vi_goi, so_trong_thung, han_dung_ngay)
    values ($1, $2, $3, true, $4, $5, $6) returning *`,
    [ma, ten, loai, them.donVi ?? 'gói', them.thung ?? null, them.han ?? 5]);
  if (r.loi) throw new Error(r.loi);
  MH[ma] = r.rows[0];
};
const taoNcc = async ten => {
  const r = await duoi(UID.keToanA, `insert into kho_nha_cung_cap (ten) values ($1) returning id`, [ten]);
  if (r.loi) throw new Error(r.loi);
  NCC[ten] = r.rows[0].id;
};
/** Phiếu nhận hàng (chỉ kg) của thủ kho; trả id. */
async function nhan(uid, cn, vt, ncc, dong, t = {}) {
  const r = await duoi(uid, `
    select * from kho_luu_phieu_nhap_kg(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => $3, p_nha_cung_cap_id => $4, p_vi_tri_id => $5, p_ngay_nhap => $6::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_ghi_chu => null,
      p_anh_them => $7::text[], p_truong_them => '{}'::jsonb, p_dong => $8::jsonb)`,
    [cn.id, maGui(), t.loai ?? 'mua', t.loai === 'ton_dau' ? null : ncc, vt, t.ngay ?? homNay,
     t.loai === 'ton_dau' ? [] : [`${cn.id}/nhap/${maGui()}/1.jpg`], JSON.stringify(dong)]);
  if (r.loi) throw new Error(r.loi);
  return r.rows[0].phieu_id;
}
const phienBan = async id => (await db.query(`select phien_ban from kho_phieu_nhap where id = $1`, [id])).rows[0].phien_ban;
const gui = async (uid, id) => {
  const r = await duoi(uid, `select kho_gui_duyet_phieu_nhap($1, $2)`, [id, await phienBan(id)]);
  if (r.loi) throw new Error(r.loi);
};
/** Kế toán điền giá mọi dòng rồi duyệt. */
async function duyetDu(id, gia = { don_gia_kg: 400000 }) {
  const dong = (await db.query(`select id from kho_phieu_nhap_dong where phieu_nhap_id = $1`, [id])).rows;
  const dg = await duoi(UID.keToanA, `
    select kho_dien_gia_phieu_nhap(p_id => $1, p_phien_ban => $2, p_so_hoa_don => null, p_ngay_hoa_don => null,
      p_han_thanh_toan => null, p_tien_thue => 0, p_chi_phi_khac => 0, p_gia => $3::jsonb)`,
    [id, await phienBan(id), JSON.stringify(dong.map(d => ({ dong_id: d.id, ...gia })))]);
  if (dg.loi) throw new Error(dg.loi);
  const dy = await duoi(UID.keToanA, `select kho_duyet_phieu_nhap($1) as cau`, [id]);
  if (dy.loi) throw new Error(dy.loi);
}
// Ép kiểu như PostgREST trả cho web: ngày là chuỗi, numeric là số (PGlite đọc thẳng thì Date / chuỗi).
const ds = async (uid, cn = cnA) => duoi(uid, `
  select nha_cung_cap_id, mat_hang_id, la_chinh, da_bo, them_tay, da_giao, so_lan,
         lan_cuoi::text as lan_cuoi, kg_lan_cuoi::float8 as kg_lan_cuoi, goi_lan_cuoi
  from kho_ds_ncc_mat_hang($1)`, [cn.id]);
const cap = (rows, ncc, ma) => rows.find(r => r.nha_cung_cap_id === NCC[ncc] && r.mat_hang_id === MH[ma].id);
const luu = (uid, ncc, ma, viec) => duoi(uid, `select kho_luu_ncc_mat_hang($1, $2, $3)`, [NCC[ncc], MH[ma].id, viec]);

// ===========================================================================
await nhom('0 · DỰNG DỮ LIỆU', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  viTri.A = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho' limit 1`, [cnA.id])).rows[0].id;
  viTri.B = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho' limit 1`, [cnB.id])).rows[0].id;
  await taoMon('C-RIBEYE', 'Ribeye Úc', 'phan_cat');
  await taoMon('C-BACHI', 'Ba chỉ bò Mỹ', 'phan_cat');
  await taoMon('C-LUOI', 'Lưỡi bò', 'phan_cat');
  await taoMon('DU-COCA', 'Coca lon', 'do_uong', { donVi: 'lon', thung: 24, han: null });
  for (const ten of ['NCC Bò Úc', 'NCC Bò Mỹ', 'NCC Nước ngọt', 'NCC Chợ']) await taoNcc(ten);
  ok('Có 4 món, 4 nhà cung cấp, kho đã khởi tạo ở hai chi nhánh', Object.keys(MH).length === 4 && Object.keys(NCC).length === 4
    && viTri.A && viTri.B);
});

// ===========================================================================
await nhom('1 · QUYỀN', async () => {
  for (const [ten, uid] of [['Thủ kho Q1', UID.thuKhoA], ['Quản lý Q1', UID.qlA], ['Kế toán Q1', UID.keToanA], ['Chủ', UID.chu]]) {
    const r = await ds(uid);
    ok(`${ten} đọc được danh mục của Q1`, r.loi === null, r.loi ?? '');
  }
  for (const [ten, uid] of [['NV quầy Q1', UID.nvQuayA], ['Thủ kho Q7 đọc Q1', UID.thuKhoB], ['Đã nghỉ việc', UID.nghiViec],
    ['Thu ngân Q1', UID.thuNganA], ['Tài khoản không có nhan_su', KHONG_NS]]) {
    const r = await ds(uid);
    ok(`${ten} bị từ chối đọc`, /không được xem nhà cung cấp/.test(r.loi ?? ''), r.loi ?? 'đọc được');
  }
  const an = await duoiAnon(`select * from kho_ds_ncc_mat_hang($1)`, [cnA.id]);
  ok('anon không gọi được hàm đọc', an.loi !== null, 'gọi được');
  const anGhi = await duoiAnon(`select kho_luu_ncc_mat_hang($1, $2, 'them')`, [NCC['NCC Chợ'], MH['C-LUOI'].id]);
  ok('anon không gọi được hàm ghi', anGhi.loi !== null, 'gọi được');

  for (const [ten, uid] of [['Thủ kho Q1', UID.thuKhoA], ['NV quầy Q1', UID.nvQuayA], ['Đã nghỉ việc', UID.nghiViec],
    ['Tài khoản không có nhan_su', KHONG_NS]]) {
    const r = await luu(uid, 'NCC Chợ', 'C-LUOI', 'them');
    ok(`${ten} không sửa được danh mục`, /không được sửa nhà cung cấp/.test(r.loi ?? ''), r.loi ?? 'sửa được');
  }
  const ghiThang = await duoi(UID.qlA, `insert into kho_ncc_mat_hang (nha_cung_cap_id, mat_hang_id) values ($1, $2)`,
    [NCC['NCC Chợ'], MH['C-LUOI'].id]);
  ok('Quản lý không ghi thẳng bảng kho_ncc_mat_hang (chỉ qua hàm)', ghiThang.loi !== null, 'ghi được');
  const tkDocBang = await duoi(UID.thuKhoA, `select count(*)::int as n from kho_ncc_mat_hang`);
  ok('Thủ kho đọc thẳng bảng: 0 dòng (RLS vai ncc)', tkDocBang.loi !== null || tkDocBang.rows[0].n === 0, tkDocBang.loi ?? '');
  const r0 = (await ds(UID.thuKhoA)).rows;
  ok('Chưa có phiếu, chưa sửa tay → danh mục rỗng', r0.length === 0, JSON.stringify(r0));
  ok('Kết quả không có cột tiền nào', !Object.keys(r0[0] ?? { nha_cung_cap_id: 1 }).some(k => /gia|tien/.test(k)));
});

// ===========================================================================
let P_GUI, P_HUY;
await nhom('2 · TỰ HỌC TỪ PHIẾU MUA ĐÃ GỬI / ĐÃ DUYỆT', async () => {
  const hsd = await ngay(5);
  // Nháp: chưa tính.
  const pNhap = await nhan(UID.thuKhoA, cnA, viTri.A, NCC['NCC Bò Úc'], [{ mat_hang_id: MH['C-RIBEYE'].id, so_kg: 4, so_goi: 2, han_dung: hsd }]);
  let r = (await ds(UID.thuKhoA)).rows;
  ok('Phiếu nháp chưa tính', !cap(r, 'NCC Bò Úc', 'C-RIBEYE'), JSON.stringify(r));

  // Gửi: tính.
  await gui(UID.thuKhoA, pNhap);
  P_GUI = pNhap;
  r = (await ds(UID.thuKhoA)).rows;
  const c = cap(r, 'NCC Bò Úc', 'C-RIBEYE');
  ok('Phiếu đã gửi (chờ duyệt) → cặp NCC Bò Úc · Ribeye xuất hiện, da_giao', c?.da_giao === true && c.them_tay === false && c.da_bo === false,
    JSON.stringify(c));

  // Bị trả về: không tính.
  const pTra = await nhan(UID.thuKhoA, cnA, viTri.A, NCC['NCC Bò Mỹ'], [{ mat_hang_id: MH['C-BACHI'].id, so_kg: 3, so_goi: 1, han_dung: hsd }]);
  await gui(UID.thuKhoA, pTra);
  const tc = await duoi(UID.qlA, `select kho_tu_choi_phieu_nhap($1, 'Sai món') as cau`, [pTra]);
  r = (await ds(UID.thuKhoA)).rows;
  ok('Phiếu bị trả về không tính', tc.loi === null && !cap(r, 'NCC Bò Mỹ', 'C-BACHI'), tc.loi ?? JSON.stringify(r));

  // Đã gửi rồi hủy: rơi khỏi danh sách (tính lúc đọc, không chép).
  P_HUY = await nhan(UID.thuKhoA, cnA, viTri.A, NCC['NCC Chợ'], [{ mat_hang_id: MH['C-LUOI'].id, so_kg: 2, so_goi: 1, han_dung: hsd }]);
  await gui(UID.thuKhoA, P_HUY);
  ok('Phiếu NCC Chợ · Lưỡi đã gửi → có cặp', !!cap((await ds(UID.thuKhoA)).rows, 'NCC Chợ', 'C-LUOI'));
  await duyetDu(P_HUY);
  const huy = await duoi(UID.qlA, `select kho_huy_phieu_nhap($1, 'Nhập nhầm') as cau`, [P_HUY]);
  ok('Duyệt rồi hủy phiếu đó → cặp rơi khỏi danh sách (tính lúc đọc, không chép)',
    huy.loi === null && !cap((await ds(UID.thuKhoA)).rows, 'NCC Chợ', 'C-LUOI'), huy.loi ?? '');

  // Tồn đầu kỳ: không có NCC, không tính.
  await nhan(UID.qlA, cnA, viTri.A, null, [{ mat_hang_id: MH['C-LUOI'].id, so_kg: 1, so_goi: 1, han_dung: hsd }], { loai: 'ton_dau' });
  r = (await ds(UID.thuKhoA)).rows;
  ok('Phiếu tồn đầu kỳ không thêm cặp nào', r.every(x => x.mat_hang_id !== MH['C-LUOI'].id), JSON.stringify(r));

  // Đã duyệt: tính (Coca của NCC Nước ngọt ở Q1, điền giá thùng rồi duyệt).
  const pCoca = await nhan(UID.thuKhoA, cnA, viTri.A, NCC['NCC Nước ngọt'],
    [{ mat_hang_id: MH['DU-COCA'].id, so_goi: 48, han_dung: await ngay(180) }], { ngay: await ngay(-3) });
  await gui(UID.thuKhoA, pCoca);
  await duyetDu(pCoca, { don_gia_thung: 200000 });
  r = (await ds(UID.thuKhoA)).rows;
  ok('Phiếu đã duyệt → cặp NCC Nước ngọt · Coca', !!cap(r, 'NCC Nước ngọt', 'DU-COCA'), JSON.stringify(r));
});

// ===========================================================================
await nhom('3 · LẦN TRƯỚC Ở CHI NHÁNH ĐANG XEM', async () => {
  const hsd = await ngay(5);
  // Hai phiếu Ribeye của NCC Bò Úc ở Q1: phiếu gần nhất có hai dòng Ribeye (4,5 + 3,25 kg).
  const p2 = await nhan(UID.thuKhoA, cnA, viTri.A, NCC['NCC Bò Úc'], [
    { mat_hang_id: MH['C-RIBEYE'].id, so_kg: 4.5, so_goi: 2, han_dung: hsd },
    { mat_hang_id: MH['C-RIBEYE'].id, so_kg: 3.25, so_goi: 1, han_dung: hsd },
    { mat_hang_id: MH['C-BACHI'].id, so_kg: 6, so_goi: 3, han_dung: hsd },
  ]);
  await gui(UID.thuKhoA, p2);
  const r = (await ds(UID.thuKhoA)).rows;
  const rb = cap(r, 'NCC Bò Úc', 'C-RIBEYE');
  ok('Ribeye: 2 lần ở Q1, lần cuối hôm nay, kg = 4,5 + 3,25 = 7,75 (cộng các dòng cùng món), 3 gói',
    rb?.so_lan === 2 && rb.lan_cuoi === homNay && Number(rb.kg_lan_cuoi) === 7.75 && rb.goi_lan_cuoi === 3, JSON.stringify(rb));
  const coca = cap(r, 'NCC Nước ngọt', 'DU-COCA');
  ok('Coca: 1 lần, 3 ngày trước, 48 lon', coca?.so_lan === 1 && coca.lan_cuoi === await ngay(-3) && coca.goi_lan_cuoi === 48,
    JSON.stringify(coca));
  ok('Ba chỉ thành món của NCC Bò Úc (cùng phiếu)', !!cap(r, 'NCC Bò Úc', 'C-BACHI'));

  // Q7: thấy cặp (NCC, món dùng chung) nhưng chưa giao ở Q7 → không có số.
  const r7 = (await ds(UID.thuKhoB, cnB)).rows;
  const rb7 = cap(r7, 'NCC Bò Úc', 'C-RIBEYE');
  ok('Thủ kho Q7 thấy cặp Ribeye (đã giao ở Q1) nhưng chưa có số ở Q7',
    rb7?.da_giao === true && rb7.so_lan === 0 && rb7.lan_cuoi === null && rb7.kg_lan_cuoi === null, JSON.stringify(rb7));

  // Phiếu Q7 không đổi số của Q1.
  const p7 = await nhan(UID.thuKhoB, cnB, viTri.B, NCC['NCC Bò Úc'], [{ mat_hang_id: MH['C-RIBEYE'].id, so_kg: 10, so_goi: 4, han_dung: hsd }]);
  await gui(UID.thuKhoB, p7);
  const rbA = cap((await ds(UID.thuKhoA)).rows, 'NCC Bò Úc', 'C-RIBEYE');
  const rbB = cap((await ds(UID.thuKhoB, cnB)).rows, 'NCC Bò Úc', 'C-RIBEYE');
  const theoNcc = (await duoi(UID.thuKhoA, `select * from kho_ds_ncc_mat_hang($1, $2)`, [cnA.id, NCC['NCC Bò Úc']])).rows;
  ok('Lọc theo NCC: chỉ cặp của NCC Bò Úc', theoNcc.length >= 2 && theoNcc.every(x => x.nha_cung_cap_id === NCC['NCC Bò Úc']),
    JSON.stringify(theoNcc.map(x => x.nha_cung_cap_id)));
  const theoMon = (await duoi(UID.thuKhoA, `select * from kho_ds_ncc_mat_hang($1, p_mat_hang_id => $2)`, [cnA.id, MH['C-RIBEYE'].id])).rows;
  ok('Lọc theo món: chỉ cặp của Ribeye, số lần trước giữ nguyên', theoMon.length >= 1 && theoMon.every(x => x.mat_hang_id === MH['C-RIBEYE'].id)
    && Number(theoMon.find(x => x.nha_cung_cap_id === NCC['NCC Bò Úc'])?.kg_lan_cuoi) === 7.75, JSON.stringify(theoMon));
  ok('Phiếu ở Q7 chỉ đổi số của Q7 (Q1 vẫn 7,75 kg, Q7 10 kg)',
    Number(rbA?.kg_lan_cuoi) === 7.75 && rbA.so_lan === 2 && Number(rbB?.kg_lan_cuoi) === 10 && rbB.so_lan === 1,
    JSON.stringify({ rbA, rbB }));
});

// ===========================================================================
await nhom('4 · SỬA TAY: THÊM, BỎ, NCC CHÍNH', async () => {
  // Thêm cặp chưa từng giao.
  let k = await luu(UID.qlA, 'NCC Chợ', 'C-LUOI', 'them');
  let r = (await ds(UID.thuKhoA)).rows;
  let c = cap(r, 'NCC Chợ', 'C-LUOI');
  ok('Quản lý thêm "NCC Chợ bán Lưỡi" (chưa giao) → có cặp, them_tay, chưa da_giao',
    k.loi === null && c?.them_tay === true && c.da_giao === false && c.so_lan === 0, k.loi ?? JSON.stringify(c));
  k = await luu(UID.keToanA, 'NCC Chợ', 'C-LUOI', 'them');
  ok('Kế toán thêm lại lần nữa (bấm hai lần) → vẫn một cặp', k.loi === null
    && (await db.query(`select count(*)::int as n from kho_ncc_mat_hang where mat_hang_id = $1`, [MH['C-LUOI'].id])).rows[0].n === 1,
    k.loi ?? '');

  // Bỏ cặp tự học: còn trong kết quả với da_bo (trang cài đặt hiện "Thêm lại"), web không hiện thành nút.
  k = await luu(UID.qlA, 'NCC Bò Úc', 'C-BACHI', 'bo');
  c = cap((await ds(UID.thuKhoA)).rows, 'NCC Bò Úc', 'C-BACHI');
  ok('Bỏ "NCC Bò Úc bán Ba chỉ" → da_bo', k.loi === null && c?.da_bo === true, k.loi ?? JSON.stringify(c));
  const pLai = await nhan(UID.thuKhoA, cnA, viTri.A, NCC['NCC Bò Úc'], [{ mat_hang_id: MH['C-BACHI'].id, so_kg: 2, so_goi: 1, han_dung: await ngay(5) }]);
  await gui(UID.thuKhoA, pLai);
  c = cap((await ds(UID.thuKhoA)).rows, 'NCC Bò Úc', 'C-BACHI');
  ok('Phiếu sau giao lại Ba chỉ → vẫn bỏ (không tự hiện lại)', c?.da_bo === true, JSON.stringify(c));
  k = await luu(UID.qlA, 'NCC Bò Úc', 'C-BACHI', 'them');
  c = cap((await ds(UID.thuKhoA)).rows, 'NCC Bò Úc', 'C-BACHI');
  ok('Thêm lại → hết bỏ', k.loi === null && c?.da_bo === false && c.them_tay === true, k.loi ?? JSON.stringify(c));

  // NCC chính: mỗi món một.
  k = await luu(UID.qlA, 'NCC Bò Úc', 'C-RIBEYE', 'chinh');
  ok('NCC Bò Úc là chính của Ribeye', k.loi === null && cap((await ds(UID.thuKhoA)).rows, 'NCC Bò Úc', 'C-RIBEYE')?.la_chinh === true,
    k.loi ?? '');
  k = await luu(UID.qlA, 'NCC Bò Mỹ', 'C-RIBEYE', 'chinh');
  r = (await ds(UID.thuKhoA)).rows;
  ok('Đặt NCC Bò Mỹ là chính của Ribeye → NCC Bò Úc thôi là chính (mỗi món một)',
    k.loi === null && cap(r, 'NCC Bò Mỹ', 'C-RIBEYE')?.la_chinh === true && cap(r, 'NCC Bò Úc', 'C-RIBEYE')?.la_chinh === false,
    k.loi ?? JSON.stringify(r.filter(x => x.mat_hang_id === MH['C-RIBEYE'].id)));
  k = await luu(UID.qlA, 'NCC Bò Mỹ', 'C-RIBEYE', 'chinh');
  ok('Bấm "chính" hai lần → vẫn đúng một NCC chính', k.loi === null
    && (await db.query(`select count(*)::int as n from kho_ncc_mat_hang where mat_hang_id = $1 and la_chinh`, [MH['C-RIBEYE'].id])).rows[0].n === 1,
    k.loi ?? '');
  k = await luu(UID.qlA, 'NCC Bò Mỹ', 'C-RIBEYE', 'them');
  ok('"Thêm" trên NCC chính giữ nguyên là chính', k.loi === null && cap((await ds(UID.thuKhoA)).rows, 'NCC Bò Mỹ', 'C-RIBEYE')?.la_chinh === true);
  k = await luu(UID.qlA, 'NCC Bò Mỹ', 'C-RIBEYE', 'bo_chinh');
  c = cap((await ds(UID.thuKhoA)).rows, 'NCC Bò Mỹ', 'C-RIBEYE');
  ok('Thôi là chính → cặp vẫn còn, không chính', k.loi === null && c?.la_chinh === false && c.da_bo === false, k.loi ?? JSON.stringify(c));
  await luu(UID.qlA, 'NCC Bò Mỹ', 'C-RIBEYE', 'chinh');
  k = await luu(UID.qlA, 'NCC Bò Mỹ', 'C-RIBEYE', 'bo');
  c = cap((await ds(UID.thuKhoA)).rows, 'NCC Bò Mỹ', 'C-RIBEYE');
  ok('Bỏ NCC chính → bỏ và thôi là chính', k.loi === null && c?.da_bo === true && c.la_chinh === false, k.loi ?? JSON.stringify(c));
  // Trang cũ: A còn thấy nút "Thôi là NCC chính" sau khi B vừa bỏ cặp → món vẫn bỏ.
  k = await luu(UID.keToanA, 'NCC Bò Mỹ', 'C-RIBEYE', 'bo_chinh');
  c = cap((await ds(UID.thuKhoA)).rows, 'NCC Bò Mỹ', 'C-RIBEYE');
  ok('"Thôi là chính" trên cặp vừa bị bỏ (trang cũ) → vẫn bỏ, không tự thêm lại', k.loi === null && c?.da_bo === true, k.loi ?? JSON.stringify(c));
  k = await luu(UID.qlA, 'NCC Chợ', 'C-BACHI', 'bo_chinh');
  const soDong = (await db.query(`select count(*)::int as n from kho_ncc_mat_hang where nha_cung_cap_id = $1 and mat_hang_id = $2`,
    [NCC['NCC Chợ'], MH['C-BACHI'].id])).rows[0].n;
  ok('"Thôi là chính" trên cặp chưa có → không thêm cặp nào', k.loi === null && soDong === 0
    && !cap((await ds(UID.thuKhoA)).rows, 'NCC Chợ', 'C-BACHI'), k.loi ?? String(soDong));

  // Việc lạ, NCC / món ngừng dùng.
  k = await luu(UID.qlA, 'NCC Chợ', 'C-LUOI', 'xoa');
  ok('Việc lạ bị từ chối', /không hợp lệ/.test(k.loi ?? ''), k.loi ?? 'nhận');
  await duoi(UID.keToanA, `update kho_nha_cung_cap set dang_dung = false where id = $1`, [NCC['NCC Chợ']]);
  k = await luu(UID.qlA, 'NCC Chợ', 'C-LUOI', 'chinh');
  ok('NCC ngừng dùng → "Chọn nhà cung cấp đang dùng"', /Chọn nhà cung cấp đang dùng/.test(k.loi ?? ''), k.loi ?? 'nhận');
  ok('NCC ngừng dùng không hiện trong danh mục', !(await ds(UID.thuKhoA)).rows.some(x => x.nha_cung_cap_id === NCC['NCC Chợ']));
  await duoi(UID.keToanA, `update kho_nha_cung_cap set dang_dung = true where id = $1`, [NCC['NCC Chợ']]);
  await duoi(UID.qlA, `update kho_mat_hang set dang_dung = false where id = $1`, [MH['C-LUOI'].id]);
  k = await luu(UID.qlA, 'NCC Chợ', 'C-LUOI', 'them');
  ok('Món ngừng dùng → "Chọn mặt hàng đang dùng"', /Chọn mặt hàng đang dùng/.test(k.loi ?? ''), k.loi ?? 'nhận');
  ok('Món ngừng dùng không hiện trong danh mục', !(await ds(UID.thuKhoA)).rows.some(x => x.mat_hang_id === MH['C-LUOI'].id));
  await duoi(UID.qlA, `update kho_mat_hang set dang_dung = true where id = $1`, [MH['C-LUOI'].id]);

  const en = ['Tài khoản của bạn không được xem nhà cung cấp ở chi nhánh này', 'Tài khoản của bạn không được sửa nhà cung cấp',
    'Việc với món của nhà cung cấp không hợp lệ', 'Chọn mặt hàng đang dùng', 'Chọn nhà cung cấp đang dùng'];
  ok('Mọi câu lỗi mới có bản tiếng Anh', en.every(c => dichCau(c, 'en') !== c), en.filter(c => dichCau(c, 'en') === c).join(' | '));
});

// ===========================================================================
await nhom('5 · WEB: XẾP, CHỮ, LƯU QUA CLIENT GIẢ', async () => {
  const tk = clientCua(UID.thuKhoA);
  const dsW = await docNccMon(tk, cnA.id);
  ok('docNccMon (thủ kho) đọc được, số là số', dsW.length > 0 && dsW.every(x => typeof x.so_lan === 'number'), JSON.stringify(dsW[0]));

  const monUc = monCuaNcc(dsW, NCC['NCC Bò Úc']).map(x => x.mat_hang_id);
  ok('Món của NCC Bò Úc: Ribeye và Ba chỉ', monUc.length === 2 && monUc.includes(MH['C-RIBEYE'].id) && monUc.includes(MH['C-BACHI'].id),
    JSON.stringify(monUc));
  const gia = (id, t) => ({ nha_cung_cap_id: 'n', mat_hang_id: id, la_chinh: false, da_bo: false, them_tay: false, da_giao: true,
    so_lan: 1, lan_cuoi: null, kg_lan_cuoi: null, goi_lan_cuoi: null, ...t });
  const xep = monCuaNcc([gia('cu', { lan_cuoi: '2026-10-20', so_lan: 9 }), gia('it', { lan_cuoi: '2026-10-25', so_lan: 1 }),
    gia('nhieu', { lan_cuoi: '2026-10-25', so_lan: 4 }), gia('chua', {}), gia('chinh', { la_chinh: true }), gia('bo', { da_bo: true })], 'n')
    .map(x => x.mat_hang_id).join();
  ok('Xếp: NCC chính → giao gần nhất → cùng ngày thì giao nhiều lần hơn → chưa giao ở chi nhánh này; bỏ cặp đã bỏ',
    xep === 'chinh,nhieu,it,cu,chua', xep);
  ok('Món của NCC Bò Mỹ: không có Ribeye (đã bỏ)', !monCuaNcc(dsW, NCC['NCC Bò Mỹ']).some(x => x.mat_hang_id === MH['C-RIBEYE'].id));
  ok('Không chọn NCC → không có món', monCuaNcc(dsW, '').length === 0 && monCuaNcc(dsW, null).length === 0);

  // NCC chính lên đầu dù giao cũ hơn.
  await luu(UID.qlA, 'NCC Nước ngọt', 'C-RIBEYE', 'chinh');
  const ds2 = await docNccMon(tk, cnA.id);
  const nccRb = nccCuaMon(ds2, MH['C-RIBEYE'].id).map(x => x.nha_cung_cap_id);
  ok('NCC bán Ribeye: NCC chính (thêm tay, chưa giao) đứng đầu, rồi NCC Bò Úc', nccRb[0] === NCC['NCC Nước ngọt'] && nccRb[1] === NCC['NCC Bò Úc']
    && !nccRb.includes(NCC['NCC Bò Mỹ']), JSON.stringify(nccRb));
  await luu(UID.qlA, 'NCC Nước ngọt', 'C-RIBEYE', 'bo');

  const rb = ds2.find(x => x.nha_cung_cap_id === NCC['NCC Bò Úc'] && x.mat_hang_id === MH['C-RIBEYE'].id);
  const ngayNgan = `${homNay.slice(8, 10)}/${homNay.slice(5, 7)}`;
  ok('Chữ "Lần trước" của thịt: số kiểu Việt "7,75 kg"', chuLanTruoc(rb, MH['C-RIBEYE'], 'vi') === `Lần trước 7,75 kg · ${ngayNgan}`,
    chuLanTruoc(rb, MH['C-RIBEYE'], 'vi'));
  ok('Tiếng Anh: "Last time 7.75 kg"', chuLanTruoc(rb, MH['C-RIBEYE'], 'en') === `Last time 7.75 kg · ${ngayNgan}`,
    chuLanTruoc(rb, MH['C-RIBEYE'], 'en'));
  const coca = ds2.find(x => x.mat_hang_id === MH['DU-COCA'].id);
  ok('Coca (đếm theo cái, 24 lon/thùng): "Lần trước 2 thùng (48 lon)"', /^Lần trước 2 thùng \(48 lon\) · /.test(chuLanTruoc(coca, { ...MH['DU-COCA'], dem_theo_cai: true }, 'vi') ?? ''),
    chuLanTruoc(coca, { ...MH['DU-COCA'], dem_theo_cai: true }, 'vi'));
  ok('Chưa giao ở chi nhánh này → không có chữ "Lần trước"', chuLanTruoc({ ...rb, lan_cuoi: null }, MH['C-RIBEYE']) === null);
  const cocaMon = { ...MH['DU-COCA'], dem_theo_cai: true };
  ok('Món đếm theo cái, phiếu không có số gói → lấy số kg (0105: bằng số cái); không số nào → không chữ (không "0 lon")',
    /^Lần trước 7 lon · /.test(chuLanTruoc({ ...coca, goi_lan_cuoi: null, kg_lan_cuoi: 7 }, cocaMon) ?? '')
    && chuLanTruoc({ ...coca, goi_lan_cuoi: null, kg_lan_cuoi: null }, cocaMon) === null
    && chuLanTruoc({ ...rb, kg_lan_cuoi: null }, MH['C-RIBEYE']) === null,
    chuLanTruoc({ ...coca, goi_lan_cuoi: null, kg_lan_cuoi: 7 }, cocaMon));
  ok('Dòng phụ NCC: "NCC chính · giao 25/10" / "thêm tay, chưa giao" / "chưa giao ở chi nhánh này" (giống trang cài đặt)',
    chuNccCuaMon({ ...rb, la_chinh: true, lan_cuoi: '2026-10-25' }) === 'NCC chính · giao 25/10'
    && chuNccCuaMon({ ...rb, la_chinh: false, lan_cuoi: null, da_giao: false }) === 'thêm tay, chưa giao'
    && chuNccCuaMon({ ...rb, la_chinh: false, lan_cuoi: null, da_giao: true }) === 'chưa giao ở chi nhánh này'
    && chuChuaGiao({ ...rb, da_giao: true }, 'en') === 'not delivered at this branch yet');
  ok('?mon= lạ (không phải uuid) coi như không chọn', docMonChon('abc') === '' && docMonChon(null) === ''
    && docMonChon(` ${MH['C-RIBEYE'].id} `) === MH['C-RIBEYE'].id);

  // Lưu qua client giả: câu "đã" chỉ khi database nhận.
  const ql = clientCua(UID.qlA);
  let kq = await luuNccMon(ql, NCC['NCC Chợ'], MH['C-RIBEYE'].id, 'them', { ncc: 'NCC Chợ', mon: 'Ribeye Úc' });
  ok('luuNccMon (quản lý): ok, câu "Đã thêm …"', kq.ok && kq.cau === 'Đã thêm "Ribeye Úc" vào món của "NCC Chợ".' && !!kq.cauEn, kq.cau);
  kq = await luuNccMon(ql, NCC['NCC Chợ'], MH['C-RIBEYE'].id, 'chinh', { ncc: '', mon: '' });
  ok('Không đọc được tên (trang lỗi đọc danh mục) → câu chung, không có ngoặc rỗng ""',
    kq.ok && kq.cau === 'Đã đặt nhà cung cấp này là nhà cung cấp chính của món.' && !kq.cau.includes('""'), kq.cau);
  await luu(UID.qlA, 'NCC Chợ', 'C-RIBEYE', 'bo_chinh');
  kq = await luuNccMon(ql, '', MH['C-RIBEYE'].id, 'them', { ncc: '', mon: 'Ribeye Úc' });
  ok('NCC trống / lạ → "Chưa chọn nhà cung cấp." (không đổ cho món)', !kq.ok && kq.cau === 'Chưa chọn nhà cung cấp.', kq.cau);
  kq = await luuNccMon(tk, NCC['NCC Chợ'], MH['C-RIBEYE'].id, 'bo', { ncc: 'NCC Chợ', mon: 'Ribeye Úc' });
  ok('luuNccMon (thủ kho): không ok, không có chữ "Đã"', !kq.ok && !/^Đã/.test(kq.cau), kq.cau);
  kq = await luuNccMon(ql, NCC['NCC Chợ'], MH['C-RIBEYE'].id, 'xoa', { ncc: 'NCC Chợ', mon: 'Ribeye Úc' });
  ok('luuNccMon việc lạ: không gọi database, không ok', !kq.ok, kq.cau);
  const matMang = { rpc: () => Promise.reject(new TypeError('fetch failed')) };
  kq = await luuNccMon(matMang, NCC['NCC Chợ'], MH['C-RIBEYE'].id, 'chinh', { ncc: 'NCC Chợ', mon: 'Ribeye Úc' });
  ok('Mất mạng (fetch ném lỗi) → không ok, không có chữ "Đã"', !kq.ok && !/^Đã|là nhà cung cấp chính/.test(kq.cau), kq.cau);
  const loi500 = { rpc: async () => ({ data: null, error: { message: 'upstream 500', code: '500' } }) };
  kq = await luuNccMon(loi500, NCC['NCC Chợ'], MH['C-RIBEYE'].id, 'chinh', { ncc: 'NCC Chợ', mon: 'Ribeye Úc' });
  ok('Dịch vụ trả 500 → không ok', !kq.ok, kq.cau);
  let nem = null;
  try { await docNccMon(matMang, cnA.id); } catch (e) { nem = e; }
  ok('docNccMon mất mạng → ném lỗi (trang tự quyết), không trả rỗng như thể không có', nem !== null);
});

// ===========================================================================
await nhom('6 · MÃ NGUỒN TRANG', async () => {
  const b1 = doc('web/src/pages/noi-bo/kho/nhan-hang/moi.astro');
  const getMo = b1.indexOf('<form method="get" id="tim-theo-mon">');
  const getDong = b1.indexOf('</form>', getMo);
  ok('Bước 1: form "chọn món trước" là GET riêng, đóng TRƯỚC form ảnh (không lồng, chọn món không mất ảnh)',
    getMo > 0 && getDong > getMo && getDong < b1.indexOf('<form method="POST" enctype="multipart/form-data">'));
  ok('Bước 1: ?mon= đọc bằng docMonChon, NCC bán món đó bằng nccCuaMon, đọc lọc theo món', /docMonChon\(/.test(b1) && /nccCuaMon\(/.test(b1)
    && /docNccMon\(k\.client, cn\.id, \{ mon: monChon\.id \}\)/.test(b1));
  ok('Bước 1: đọc NCC của món SAU phần gửi form (bấm "Tiếp" thành công không đọc thừa)',
    b1.indexOf('docNccMon(k.client') > b1.indexOf('const form = await docFormGui(Astro);'));
  const getForm = b1.slice(getMo, getDong);
  ok('Bước 1: form "chọn món trước" mang theo ảnh đã tải (ma_gui + anh_da_tai), trang đọc lại bằng docAnhDaTai',
    /name="anh_da_tai"/.test(getForm) && /name="ma_gui"/.test(getForm)
    && /docAnhDaTai\(fd, cn\.id, 'nhap', maGuiUrl, 24\)/.test(b1));
  ok('Bước 1: món đã chọn đi theo sang bước 2 (?tiep=), một NCC bán món thì chọn sẵn', /name="mon"/.test(b1) && /\?tiep=\$\{monChon\.id\}/.test(b1)
    && /nccBanMon\.length === 1 \? nccBanMon\[0\]\.n\.id/.test(b1));
  const b2 = doc('web/src/pages/noi-bo/kho/nhan-hang/[id].astro');
  ok('Bước 2: nút món theo danh mục NCC (monCuaNcc, đọc lọc theo NCC của phiếu), không đoán bằng tên NCC nữa',
    /monCuaNcc\(/.test(b2) && /docNccMon\(k\.client, cn\.id, \{ ncc: phieu\.nha_cung_cap_id \}\)/.test(b2) && !/docMonGanDay/.test(b2));
  ok('Bước 2: dòng phụ của nút món là "Lần trước …" (chuLanTruoc)', /chuLanTruoc\(/.test(b2));
  ok('nhan-hang.ts: bỏ docMonGanDay (tìm phiếu theo chữ tên NCC)', !/docMonGanDay/.test(doc('web/src/lib/kho/nhan-hang.ts')));
  const ncc = doc('web/src/pages/noi-bo/kho/cai-dat/nha-cung-cap.astro');
  ok('Cài đặt NCC: mục món của NCC — thêm, bỏ, chính qua luuNccMon', /luuNccMon\(/.test(ncc) && /value="ncc_mon"/.test(ncc)
    && /value="chinh"/.test(ncc) && /value="bo"/.test(ncc) && /value="them"/.test(ncc));
});

const dsTon = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
ok('kho_doi_soat_ton() rỗng', dsTon.length === 0, JSON.stringify(dsTon));

process.exit(ketThuc('DANH MỤC HÀNG CỦA TỪNG NHÀ CUNG CẤP'));
