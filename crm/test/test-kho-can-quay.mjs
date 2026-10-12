/**
 * BEEFTOWN KHO — Kiểm thử Beeftown Cân báo về kho (0061, truy vết tảng GĐ3)
 * =========================================================================
 *
 *     node test/test-kho-can-quay.mjs
 *
 *   · kho_can_giao_o_ma: danh mục cân đọc ô đang giao bằng MỌI vai xem (NV quầy ở máy quầy đọc view
 *     thì rỗng) — đúng từng dòng của view.
 *   · kho_may_can_bao: máy quầy báo trạng thái — một dòng mỗi máy, chỉ giữ dòng mã ô trên cân, mốc giờ
 *     không lùi / không ở tương lai, lệch từ lúc nào; 0085: cờ "chưa xác nhận" (Beeftown Cân 2.9.3) và từ lúc nào.
 *   · kho_may_can_nhat_ky: tem cân in bằng mã ô — gửi lại không trùng, giờ đồng hồ cân là giờ VN
 *     (23:50 / 00:10), ngày không có thật bỏ qua.
 *   · kho_phien_pha_can: trang pha lóc — ô đã lên cân chưa, tem in / nhãn quét, nhãn mã thường; 0085: máy chưa
 *     xác nhận lần gửi gần nhất thì trang không nói "Cân sẵn sàng".
 *   · suc_khoe_so_lieu: ô `can` của đèn "Beeftown Cân".
 * Quyền: anon, vai khác, chi nhánh khác, người đã nghỉ, tài khoản không có dòng nhan_su đều bị từ chối.
 * Cuối cùng: kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';
import { tomTatCanPhien } from '../../web/src/lib/kho/danh-muc-can.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — BEEFTOWN CÂN BÁO VỀ KHO (0061)');
const { db, cnA, cnB, nsId, duoi, duoiAnon } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

/** Nhãn cân EAN-13 theo mẫu mặc định 2XCCCCCWWWWWK (kg 3 số lẻ). */
function nhan(maCan, kg) {
  const s = '20' + String(maCan).padStart(5, '0') + String(Math.round(kg * 1000)).padStart(5, '0');
  let t = 0;
  for (let i = 0; i < 12; i++) t += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  return s + ((10 - t % 10) % 10);
}

const MAY_1 = '11111111-1111-4111-8111-111111111111';
const MAY_2 = '22222222-2222-4222-8222-222222222222';
const MAC = 'A1B2C3D4E5F6';
const MH = {};
let vt = {};
let ncc;
let tang = [];
const P = {};

/** Mọi người KHÔNG được gọi hàm của chi nhánh A (dù có quyền ở chỗ khác): [tên, uid | 'anon']. */
const NGOAI = [
  ['Khách (anon)', 'anon'], ['Thu ngân Q1', UID.thuNganA], ['Marketing Q1', UID.mktA], ['Quản lý chi nhánh khác (Q7)', UID.qlB],
  ['Thủ kho chi nhánh khác (Q7)', UID.thuKhoB], ['Người đã nghỉ', UID.nghiViec], ['Tài khoản không có dòng nhan_su', null],
];
const goi = (uid, sql, params) => (uid === 'anon' ? duoiAnon(sql, params) : duoi(uid, sql, params));
async function tuChoiHet(ten, sql, params) {
  const lot = [];
  for (const [ai, uid] of NGOAI) if ((await goi(uid, sql, params)).loi === null) lot.push(ai);
  ok(`${ten}: ${NGOAI.map(n => n[0]).join(', ')} đều bị từ chối`, lot.length === 0, `lọt: ${lot.join(', ')}`);
}

async function nhapTang(dong) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt.kho, await ngay(-10), JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const g = await duoi(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (g.loi) throw new Error(g.loi);
  const d = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (d.loi) throw new Error(d.loi);
  return (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id])).rows;
}
async function phienMoi(lo) {
  const r = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date,
      p_ghi_chu => null, p_vao => $5::jsonb, p_ra => '[]'::jsonb)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay, JSON.stringify([{ lo_id: lo, vi_tri_id: vt.kho }])]);
  if (r.loi) throw new Error(r.loi);
  return r.rows[0].phien_id;
}
const phien = async id => (await db.query(`select * from kho_phien_pha where id = $1`, [id])).rows[0];
const quet = (id, ma) => duoi(UID.thuKhoA, `select kho_quet_phien_pha(p_id => $1, p_ma_gui => $2, p_ma => $3::jsonb) as kq`,
  [id, maGui(), JSON.stringify(ma)]);
const bao = (uid, cn, may, b) => duoi(uid, `select kho_may_can_bao($1, $2, $3::jsonb) as kq`, [cn, may, JSON.stringify(b)]);
const nhatKy = (uid, cn, may, d) => duoi(uid, `select kho_may_can_nhat_ky($1, $2, $3::jsonb) as kq`, [cn, may, JSON.stringify(d)]);
const doiChieu = (uid, id) => duoi(uid, `select kho_phien_pha_can($1) as kq`, [id]);
const dongMay = async may => (await db.query(`select * from kho_may_can where ma_may = $1`, [may])).rows[0];
/** Giờ VN "YYYY-MM-DD HH:MM:SS" của một mốc timestamptz (đồng hồ cân). */
const gioCan = async (sqlMoc, p = []) => (await db.query(
  `select to_char((${sqlMoc}) at time zone 'utc' + interval '7 hours', 'YYYY-MM-DD HH24:MI:SS') as g`, p)).rows[0].g;

// ===========================================================================
await nhom('1 · CHUẨN BỊ: TẢNG, Ô MÃ 10011 / 10012, PHIÊN TẢNG #1 GIỮ Ô 1', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  await duoi(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'T-THANNGOAI'`);
  await duoi(UID.qlA, `update kho_mat_hang set ma_can = case ma when 'C-THANNGOAI' then '301' when 'C-THANNOI' then '302' end,
    gia_ban_kg = case ma when 'C-THANNGOAI' then 900000 when 'C-THANNOI' then 1200000 end where ma in ('C-THANNGOAI', 'C-THANNOI')`);
  const ct = (await duoi(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Thăn ngoại chuẩn') returning id`,
    [MH['T-THANNGOAI'].id])).rows[0].id;
  for (const [ma, tl, xl] of [['C-THANNGOAI', 60, null], ['C-THANNOI', 15, null], ['P-MO', 12, 'bo']]) {
    await duoi(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien, xu_ly) values ($1, $2, $3, $4)`,
      [ct, MH[ma].id, tl, xl]);
  }
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Úc') returning id`)).rows[0].id;
  const mo = await ngay(-14);
  tang = await nhapTang([1, 2].map(i => ({ mat_hang_id: MH['T-THANNGOAI'].id, so_kg: 6 + i / 10, so_kg_thuc: 6 + i / 10, don_gia_kg: 500000, ngay_mo: mo })));
  const o = await duoi(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10011'), ($1, 2, '10012')`, [MH['C-THANNGOAI'].id]);
  P[1] = await phienMoi(tang[0].id);
  const g = await duoi(UID.thuKhoA, `select kho_giao_o_ma($1, null) as kq`, [P[1]]);
  ok('Tảng #1, ô 10011 giao cho phiên', o.loi === null && g.rows?.[0]?.kq?.[0]?.ma_can === '10011', o.loi ?? g.loi ?? '');
});

// ===========================================================================
await nhom('2 · DANH MỤC CÂN ĐỌC Ô ĐANG GIAO BẰNG MỌI VAI XEM (kho_can_giao_o_ma)', async () => {
  const view = await duoi(UID.nvQuayA, `select count(*)::int as n from kho_v_o_ma_giao where chi_nhanh_id = $1`, [cnA.id]);
  ok('(Vì sao cần hàm: NV quầy đọc view kho_v_o_ma_giao thì rỗng, không báo lỗi)', view.loi === null && view.rows[0].n === 0, view.loi ?? '');
  const nv = await duoi(UID.nvQuayA, `select kho_can_giao_o_ma($1) as kq`, [cnA.id]);
  const d = nv.rows?.[0]?.kq;
  ok('NV quầy đọc được: ô 1 · 10011 · tảng #1 · còn giữ', nv.loi === null && d?.length === 1 && d[0].ma_can === '10011'
     && d[0].so_tang === 1 && d[0].con_giu === true && d[0].ten_hang === MH['C-THANNGOAI'].ten, nv.loi ?? JSON.stringify(d));
  const ql = await duoi(UID.qlA, `select kho_can_giao_o_ma($1) as kq`, [cnA.id]);
  const v = await duoi(UID.qlA, `select * from kho_v_o_ma_giao where chi_nhanh_id = $1 order by ten_hang, so_o`, [cnA.id]);
  // So từng ô theo GIÁ TRỊ (jsonb đổi thứ tự khóa, số numeric thành số, giờ in dạng khác).
  const chuan = r => Object.fromEntries(Object.keys(r).filter(x => x !== 'chi_nhanh_id').sort().map(x => [x,
    r[x] === null ? null : x === 'tu_luc' ? new Date(r[x]).toISOString() : /^(con_kg|con_goi|so_o|so_tang)$/.test(x) ? Number(r[x]) : String(r[x])]));
  const tuHam = JSON.stringify((ql.rows?.[0]?.kq ?? []).map(chuan)), tuView = JSON.stringify(v.rows.map(chuan));
  ok('Quản lý: hàm trả ĐÚNG từng dòng, từng cột của view (trừ chi_nhanh_id)', ql.loi === null && v.rows.length === 1 && tuHam === tuView,
     `${tuHam} / ${tuView}`);
  for (const [ten, uid] of [['Thủ kho', UID.thuKhoA], ['Kế toán', UID.keToanA]]) {
    const r = await duoi(uid, `select jsonb_array_length(kho_can_giao_o_ma($1)) as n`, [cnA.id]);
    ok(`${ten} Q1 đọc được`, r.loi === null && r.rows[0].n === 1, r.loi ?? '');
  }
  ok('Không cột tiền', !Object.keys(d?.[0] ?? {}).some(k => /(^|_)gia(_|$)|tien|gia_von/.test(k)), Object.keys(d?.[0] ?? {}).join());
  await tuChoiHet('kho_can_giao_o_ma', `select kho_can_giao_o_ma($1)`, [cnA.id]);
  const chu = await duoi(UID.chu, `select jsonb_array_length(kho_can_giao_o_ma($1)) as n`, [cnB.id]);
  ok('Chủ đọc được chi nhánh B (chưa có ô nào → rỗng)', chu.loi === null && chu.rows[0].n === 0, chu.loi ?? '');
});

// ===========================================================================
await nhom('3 · MÁY QUẦY BÁO TRẠNG THÁI (kho_may_can_bao)', async () => {
  const tren = [
    { plu: 23, ma_can: '10011', ten: 'Thăn ngoại cắt #0001', phim: ['F5', 'A1'] },
    { plu: 24, ma_can: '010012', ten: 'Thăn ngoại cắt lát\u0007', phim: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'] },
    { plu: 5, ma_can: '301', ten: 'Thăn ngoại cắt lát', phim: [] },        // mã thường → bỏ
    { plu: 6, ma_can: '999', ten: 'Hàng ngoài kho', phim: [] },            // không phải ô → bỏ
    { plu: 'x', ma_can: '10011', ten: 'Sai PLU' },                          // sai kiểu → bỏ
    { plu: 9999999, ma_can: '10011', ten: 'PLU hệ thống' },                 // PLU hệ thống → bỏ
    'không phải đối tượng',
  ];
  const r = await bao(UID.nvQuayA, cnA.id, MAY_1, {
    phien_ban: '2.9.0', mac_can: MAC.toLowerCase(), giu_ket_noi: true, can_tra_loi_giay: 60,
    tu_gui: true, lech_so: 0, gui_loi: false, gui_giay: 60, tren_can: tren });
  const gan = (luc, giay) => Math.abs(new Date(luc).getTime() - (Date.now() - giay * 1000)) < 15_000;
  ok('NV quầy báo được — trả số ô trên cân', r.loi === null && r.rows[0].kq.so_o_tren_can === 2, r.loi ?? JSON.stringify(r.rows?.[0]?.kq));
  let m = await dongMay(MAY_1);
  ok('Một dòng: chi nhánh A, người = NV quầy, MAC viết hoa, phiên bản; cân trả lời / gửi được = giờ database − 60 giây',
     m?.chi_nhanh_id === cnA.id && m.nguoi === nsId[UID.nvQuayA] && m.mac_can === MAC && m.phien_ban === '2.9.0' && m.giu_ket_noi === true
     && m.tu_gui === true && gan(m.can_tra_loi_luc, 60) && gan(m.gui_luc, 60), JSON.stringify(m));
  const traLoi1 = new Date(m.can_tra_loi_luc).getTime();
  ok('Trên cân chỉ giữ dòng mã Ô (bỏ mã thường, hàng ngoài kho, PLU sai / hệ thống), bỏ số 0 đầu mã',
     JSON.stringify(m.tren_can.map(x => [x.plu, x.ma_can])) === JSON.stringify([[23, '10011'], [24, '10012']]), JSON.stringify(m.tren_can));
  ok('Tên bỏ ký tự điều khiển; tối đa 8 phím', m.tren_can[1].ten === 'Thăn ngoại cắt lát' && m.tren_can[1].phim.length === 8
     && JSON.stringify(m.tren_can[0].phim) === '["F5","A1"]', JSON.stringify(m.tren_can));

  // Gửi hai lần (hai cửa sổ, mạng chậm gửi lại) → vẫn một dòng.
  await Promise.all([bao(UID.nvQuayA, cnA.id, MAY_1, { tu_gui: true }), bao(UID.nvQuayA, cnA.id, MAY_1, { tu_gui: true })]);
  ok('Báo nhiều lần → vẫn một dòng mỗi máy', (await db.query(`select count(*)::int n from kho_may_can where ma_may = $1`, [MAY_1])).rows[0].n === 1);
  m = await dongMay(MAY_1);
  ok('Không gửi tren_can → giữ dòng trên cân cũ; không gửi số giây cân trả lời → giữ mốc cũ (không lùi, không thành "vừa xong")',
     m.tren_can.length === 2 && new Date(m.can_tra_loi_luc).getTime() === traLoi1 && m.mac_can === MAC && m.phien_ban === '2.9.0',
     JSON.stringify(m));
  await bao(UID.nvQuayA, cnA.id, MAY_1, { can_tra_loi_giay: 3600 });
  ok('Lần báo cũ hơn đến sau (cân trả lời 1 giờ trước) → mốc không lùi', new Date((await dongMay(MAY_1)).can_tra_loi_luc).getTime() === traLoi1);
  // Máy chỉ gửi số giây — đồng hồ máy quầy sai không đổi gì. Số âm, quá 30 ngày, chuỗi → bỏ qua (giữ mốc cũ), không lỗi.
  for (const sai of [-5, 2_592_001, '60', 1.5, null]) {
    const r2 = await bao(UID.nvQuayA, cnA.id, MAY_1, { can_tra_loi_giay: sai, gui_giay: sai });
    if (r2.loi || new Date((await dongMay(MAY_1)).can_tra_loi_luc).getTime() !== traLoi1) { ok(`Số giây sai (${sai}) → bỏ qua`, false, r2.loi ?? ''); }
  }
  ok('Số giây âm / quá 30 ngày / chuỗi / số lẻ / null → bỏ qua, không lỗi, mốc giữ nguyên', new Date((await dongMay(MAY_1)).can_tra_loi_luc).getTime() === traLoi1);
  await bao(UID.nvQuayA, cnA.id, MAY_1, { can_tra_loi_giay: 0 });
  ok('Cân vừa trả lời (0 giây) → mốc = giờ database', gan((await dongMay(MAY_1)).can_tra_loi_luc, 0));

  // Lệch từ lúc nào: database ghi lần đầu thấy lệch, giữ qua các lần báo, hết lệch thì xóa.
  await bao(UID.nvQuayA, cnA.id, MAY_1, { lech_so: 3 });
  const lt1 = (await dongMay(MAY_1)).lech_tu;
  await db.query(`update kho_may_can set lech_tu = lech_tu - interval '20 minutes' where ma_may = $1`, [MAY_1]);
  await bao(UID.nvQuayA, cnA.id, MAY_1, { lech_so: 5 });
  const m2 = await dongMay(MAY_1);
  ok('Lệch: lech_tu ghi lần đầu, giữ nguyên khi vẫn lệch', lt1 !== null && m2.lech_so === 5
     && new Date(m2.lech_tu).getTime() === new Date(lt1).getTime() - 20 * 60_000, `${lt1} / ${m2.lech_tu}`);
  await bao(UID.nvQuayA, cnA.id, MAY_1, { lech_so: 0 });
  ok('Hết lệch → xóa lech_tu', (await dongMay(MAY_1)).lech_tu === null);
  await bao(UID.nvQuayA, cnA.id, MAY_1, { lech_so: '7' });
  ok('lech_so không phải số → chưa biết (null)', (await dongMay(MAY_1)).lech_so === null);

  // 0085 (Beeftown Cân 2.9.3): lần gửi gần nhất cân chưa xác nhận — cờ và từ lúc nào (như lech_tu).
  const x0 = await dongMay(MAY_1);
  ok('0085: máy quầy trước 2.9.3 (không gửi cờ) → chua_xac_nhan false, không mốc', x0.chua_xac_nhan === false && x0.chua_xac_nhan_tu === null,
     JSON.stringify(x0));
  await bao(UID.nvQuayA, cnA.id, MAY_1, { chua_xac_nhan: true });
  const x1 = await dongMay(MAY_1);
  await db.query(`update kho_may_can set chua_xac_nhan_tu = chua_xac_nhan_tu - interval '20 minutes' where ma_may = $1`, [MAY_1]);
  await Promise.all([bao(UID.nvQuayA, cnA.id, MAY_1, { chua_xac_nhan: true }), bao(UID.nvQuayA, cnA.id, MAY_1, { chua_xac_nhan: true })]);
  const x2 = await dongMay(MAY_1);
  ok('0085: chưa xác nhận → ghi mốc lần đầu; báo lại (cả hai lần cùng lúc) vẫn giữ mốc đầu, vẫn một dòng',
     x1.chua_xac_nhan === true && gan(x1.chua_xac_nhan_tu, 0) && x2.chua_xac_nhan === true
     && new Date(x2.chua_xac_nhan_tu).getTime() === new Date(x1.chua_xac_nhan_tu).getTime() - 20 * 60_000
     && (await db.query(`select count(*)::int n from kho_may_can where ma_may = $1`, [MAY_1])).rows[0].n === 1, `${x1.chua_xac_nhan_tu} / ${x2.chua_xac_nhan_tu}`);
  await bao(UID.nvQuayA, cnA.id, MAY_1, { chua_xac_nhan: 'true' });
  const x3 = await dongMay(MAY_1);
  ok('0085: cờ không phải boolean ("true" là chữ) → coi như false, xoá mốc', x3.chua_xac_nhan === false && x3.chua_xac_nhan_tu === null, JSON.stringify(x3));
  await bao(UID.nvQuayA, cnA.id, MAY_1, { chua_xac_nhan: true });
  await bao(UID.nvQuayA, cnA.id, MAY_1, { chua_xac_nhan: false });
  const x4 = await dongMay(MAY_1);
  ok('0085: lần báo sau đã xác nhận (đọc lại khớp) → hết cờ, xoá mốc', x4.chua_xac_nhan === false && x4.chua_xac_nhan_tu === null, JSON.stringify(x4));
  await bao(UID.nvQuayA, cnA.id, MAY_1, { lech_so: 2, tu_gui: true, gui_loi: true });

  const sai = await duoi(UID.nvQuayA, `select kho_may_can_bao($1, $2, '[1,2]'::jsonb)`, [cnA.id, MAY_1]);
  ok('Báo không phải đối tượng → từ chối, câu rõ', /không đúng dạng/.test(sai.loi ?? ''), sai.loi ?? '');
  const khongMa = await duoi(UID.nvQuayA, `select kho_may_can_bao($1, null, '{}'::jsonb)`, [cnA.id]);
  ok('Thiếu mã máy → từ chối', /Thiếu mã máy quầy/.test(khongMa.loi ?? ''), khongMa.loi ?? '');
  const nhieu = await bao(UID.nvQuayA, cnA.id, MAY_1, { tren_can: Array.from({ length: 4001 }, (_, i) => ({ plu: i + 1, ma_can: '1' })) });
  ok('Hơn 4000 dòng trên cân → từ chối', /Tối đa 4000 dòng/.test(nhieu.loi ?? ''), nhieu.loi ?? '');
  await tuChoiHet('kho_may_can_bao', `select kho_may_can_bao($1, $2, '{}'::jsonb)`, [cnA.id, MAY_2]);
  ok('…không ai bị từ chối mà vẫn ghi được dòng', !(await dongMay(MAY_2)));
  for (const [ten, uid] of [['NV quầy', UID.nvQuayA], ['Quản lý', UID.qlA]]) {
    const d = await duoi(uid, `select * from kho_may_can`);
    const g = await duoi(uid, `update kho_may_can set lech_so = 0`);
    ok(`${ten} không đọc / sửa thẳng bảng kho_may_can (chỉ qua RPC)`, /permission denied/.test(d.loi ?? '') && /permission denied/.test(g.loi ?? ''),
       `${d.loi} / ${g.loi}`);
  }
  const chuB = await bao(UID.chu, cnB.id, MAY_2, { phien_ban: '2.8.0', tu_gui: false });
  ok('Chủ báo được cho chi nhánh B (máy thứ hai, dòng riêng)', chuB.loi === null && (await dongMay(MAY_2))?.chi_nhanh_id === cnB.id, chuB.loi ?? '');
});

// ===========================================================================
await nhom('4 · GIỜ ĐỒNG HỒ CÂN LÀ GIỜ VIỆT NAM (kho_luc_can_vn) · 23:50 VÀ 00:10', async () => {
  const doi = async g => (await db.query(`select to_char(kho_luc_can_vn($1) at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as t`, [g])).rows[0].t;
  ok('23:50 ngày 03/10 giờ VN = 16:50Z ngày 03/10', await doi('2026-10-03 23:50:00') === '2026-10-03T16:50:00Z');
  ok('00:10 ngày 04/10 giờ VN = 17:10Z ngày 03/10 (vẫn là "hôm trước" theo UTC)', await doi('2026-10-04 00:10:00') === '2026-10-03T17:10:00Z');
  ok('31/02 (ngày không có thật) → null', await doi('2026-02-31 10:00:00') === null);
  ok('Sai dạng ("04/10/2026 10:00") → null', await doi('04/10/2026 10:00') === null);
  ok('kho_luc_can_vn là hàm nội bộ', /permission denied/.test((await duoi(UID.qlA, `select kho_luc_can_vn('2026-10-04 00:10:00')`)).loi ?? ''));
});

// ===========================================================================
await nhom('5 · NHẬT KÝ CÂN: TEM IN BẰNG MÃ Ô (kho_may_can_nhat_ky)', async () => {
  // Phiên giữ ô từ 23:40 giờ VN hai hôm trước: tem 23:50 và 00:10 hôm sau (qua nửa đêm) thuộc phiên, tem 23:30 thì
  // không. Lùi hai ngày để mọi tem đều ở quá khứ dù test chạy lúc 00:05.
  const homKia = await ngay(-2), homQua = await ngay(-1);
  await db.query(`update kho_o_ma_giao set tu_luc = kho_luc_can_vn($1) where phien_pha_id = $2`, [`${homKia} 23:40:00`, P[1]]);
  const dong = (fid, luc, maCan = '10011', kg = 0.5, loai = 0, stt = 1) =>
    ({ mac: MAC, fid, stt, luc, plu: 23, ma_can: maCan, so_kg: kg, loai });
  const ds = [
    dong(101, `${homKia} 23:30:00`),                  // trước lúc giao ô
    dong(102, `${homKia} 23:50:00`, '10011', 0.5),
    dong(103, `${homQua} 00:10:00`, '10011', 0.52),
    dong(104, `${homQua} 00:12:00`, '10011', 0.3, 2), // loại 2: cân xong không in tem
    dong(105, `${homQua} 00:13:00`, '301', 0.4),      // mã thường → bỏ
    dong(106, `${homQua} 00:14:00`, '10012', 0.45),   // ô khác (chưa giao) → giữ, không thuộc phiên
    dong(107, '2026-02-31 10:00:00'),                  // ngày không có thật
    dong(108, `${await ngay(3)} 10:00:00`),            // tương lai quá 1 ngày (đồng hồ cân sai)
    dong(109, `${homQua} 00:15:00`, '10011', 0),      // 0 kg
    { mac: 'zz', fid: 110, stt: 1, luc: `${homQua} 00:15:00`, plu: 23, ma_can: '10011', so_kg: 0.5, loai: 0 },   // MAC sai
    { fid: '111', stt: 1, luc: `${homQua} 00:15:00`, plu: 23, ma_can: '10011', so_kg: 0.5, loai: 0 },            // FID là chữ
    'không phải đối tượng',
  ];
  const r = await nhatKy(UID.nvQuayA, cnA.id, MAY_1, ds);
  ok('Gửi 12 dòng → nhận 4 (ô 10011 ×3, ô 10012 ×1), bỏ loại 2, mã thường, ngày sai, tương lai, 0 kg, MAC / FID sai',
     r.loi === null && r.rows[0].kq.tong === 12 && r.rows[0].kq.moi === 4, r.loi ?? JSON.stringify(r.rows?.[0]?.kq));
  const lai = await nhatKy(UID.nvQuayA, cnA.id, MAY_1, ds);
  ok('Gửi lại y hệt (mạng chậm, bấm lại) → 0 dòng mới', lai.rows?.[0]?.kq?.moi === 0, lai.loi ?? '');
  await Promise.all([nhatKy(UID.nvQuayA, cnA.id, MAY_1, [dong(120, `${homQua} 00:20:00`)]),
                     nhatKy(UID.nvQuayA, cnA.id, MAY_1, [dong(120, `${homQua} 00:20:00`)])]);
  ok('Hai lần gửi cùng lúc → một tem', (await db.query(`select count(*)::int n from kho_can_tem where fid = 120`)).rows[0].n === 1);
  const fidMoi = await gioCan(`now() - interval '2 minutes'`);
  await nhatKy(UID.nvQuayA, cnA.id, MAY_1, [{ ...dong(121, fidMoi, '10011', 0.6), mac: '' }]);
  ok('Nhật ký không biết MAC (đọc từ USB) vẫn nhận', (await db.query(`select count(*)::int n from kho_can_tem where fid = 121 and mac_can = ''`)).rows[0].n === 1);
  ok('nhat_ky_luc của máy được ghi', (await dongMay(MAY_1)).nhat_ky_luc !== null);
  const vat = await duoi(UID.nvQuayA, `select kho_may_can_nhat_ky($1, $2, '{}'::jsonb)`, [cnA.id, MAY_1]);
  ok('Không phải danh sách → từ chối', /phải là một danh sách/.test(vat.loi ?? ''), vat.loi ?? '');
  const lon = await nhatKy(UID.nvQuayA, cnA.id, MAY_1, Array.from({ length: 2001 }, (_, i) => dong(1000 + i, `${homNay} 00:10:00`)));
  ok('Hơn 2000 dòng một lần → từ chối, không ghi dòng nào', /Tối đa 2000 dòng/.test(lon.loi ?? '')
     && (await db.query(`select count(*)::int n from kho_can_tem where fid >= 1000`)).rows[0].n === 0, lon.loi ?? '');
  await tuChoiHet('kho_may_can_nhat_ky', `select kho_may_can_nhat_ky($1, $2, $3::jsonb)`,
    [cnA.id, MAY_1, JSON.stringify([dong(130, `${homNay} 00:30:00`)])]);
  ok('…không ai bị từ chối mà vẫn ghi được tem', (await db.query(`select count(*)::int n from kho_can_tem where fid = 130`)).rows[0].n === 0);
  ok('Không ai đọc thẳng bảng kho_can_tem', /permission denied/.test((await duoi(UID.qlA, `select * from kho_can_tem`)).loi ?? ''));
  // Dọn tem quá 90 ngày khi nhận nhật ký.
  await db.query(`insert into kho_can_tem (chi_nhanh_id, mac_can, fid, stt, in_luc, plu, ma_can, so_kg)
    values ($1, $2, 1, 1, now() - interval '91 days', 23, '10011', 0.5)`, [cnA.id, MAC]);
  await nhatKy(UID.nvQuayA, cnA.id, MAY_1, []);
  ok('Tem quá 90 ngày tự dọn', (await db.query(`select count(*)::int n from kho_can_tem where in_luc < now() - interval '90 days'`)).rows[0].n === 0);
});

// ===========================================================================
await nhom('6 · TRANG PHA LÓC: Ô ĐÃ LÊN CÂN CHƯA, TEM IN / NHÃN QUÉT, NHÃN MÃ THƯỜNG (kho_phien_pha_can)', async () => {
  const q = await quet(P[1], [nhan(10011, 0.5), nhan(10011, 0.52), nhan(301, 0.3), nhan(301, 0.31), nhan(302, 1.1)]);
  ok('Quét: 2 nhãn ô 10011, 2 nhãn mã thường 301 (Thăn ngoại cắt lát — có ô), 1 nhãn 302 (Thăn nội — không có ô)',
     q.loi === null && q.rows[0].kq.so_nhan === 5, q.loi ?? JSON.stringify(q.rows?.[0]?.kq));
  const r = await doiChieu(UID.thuKhoA, P[1]);
  const k = r.rows?.[0]?.kq;
  const o = k?.o?.[0];
  ok('Phiên theo tảng; một ô: 10011 · tảng #1 · đang giữ', r.loi === null && k.theo_tang === true && k.co_mau_ma_vach === true
     && k.o.length === 1 && o.ma_can === '10011' && o.so_tang === 1 && o.dang_giu === true, r.loi ?? JSON.stringify(k));
  ok('Trên cân: PLU 23 · tên · phím F5 (theo máy quầy đã báo)', o?.tren_can?.length === 1 && o.tren_can[0].plu === 23
     && o.tren_can[0].ten === 'Thăn ngoại cắt #0001' && o.tren_can[0].phim[0] === 'F5', JSON.stringify(o?.tren_can));
  // Database thật → câu trang pha lóc (web/src/lib/kho/danh-muc-can.ts).
  ok('Trang: cân còn tên "Thăn ngoại cắt #0001" ≠ tên mới "Thăn ngoại cắt lát #0001" → "còn tên cũ", không sẵn sàng',
     tomTatCanPhien(k).dong[0]?.muc === 'ten_cu', JSON.stringify(tomTatCanPhien(k).dong[0]));
  await bao(UID.nvQuayA, cnA.id, MAY_1, { tren_can: [{ plu: 23, ma_can: '10011', ten: 'Thăn ngoại cắt lát #0001', phim: ['F5'] }] });
  const k2 = (await doiChieu(UID.thuKhoA, P[1])).rows?.[0]?.kq;
  ok('Máy quầy báo đúng tên mới → trang "Cân sẵn sàng: Thăn ngoại cắt lát #0001 = PLU 23 · phím F5"',
     tomTatCanPhien(k2).dong[0]?.cau?.vi === 'Cân sẵn sàng: Thăn ngoại cắt lát #0001 = PLU 23 · phím F5', JSON.stringify(tomTatCanPhien(k2).dong[0]));
  ok('Trang: nhãn mã thường 301 → cảnh báo in lại bằng phím ô của phiên', /in bằng mã thường 301/.test(tomTatCanPhien(k2).nhanThuong[0]?.vi ?? ''));
  // 0085 — rà soát 11/10/2026: Beeftown Cân báo tên ô mới khi lần gửi gần nhất chưa đọc lại được cân → trang không được xanh.
  const tenMoi = [{ plu: 23, ma_can: '10011', ten: 'Thăn ngoại cắt lát #0001', phim: ['F5'] }];
  await bao(UID.nvQuayA, cnA.id, MAY_1, { chua_xac_nhan: true, tren_can: [{ ...tenMoi[0], chua_xac_nhan: true }] });
  const k3 = (await doiChieu(UID.thuKhoA, P[1])).rows?.[0]?.kq;
  ok('HỒI QUY 11/10 (0085): máy quầy báo dòng ô cân có thể đang khác (lần gửi chưa xác nhận) → kho_phien_pha_can kèm cờ ở dòng và ở máy; trang "chưa chắc", không "Cân sẵn sàng"',
     k3?.o?.[0]?.tren_can?.[0]?.chua_xac_nhan === true && k3.may?.[0]?.chua_xac_nhan === true && k3.may[0].chua_xac_nhan_tu !== null
     && tomTatCanPhien(k3).dong[0]?.muc === 'chua_xac_nhan' && !/sẵn sàng/.test(tomTatCanPhien(k3).dong[0]?.cau?.vi ?? ''),
     JSON.stringify([k3?.o?.[0]?.tren_can, tomTatCanPhien(k3).dong[0]?.cau]));
  const luuDong = (await dongMay(MAY_1)).tren_can;
  ok('0085: kho giữ cờ của từng dòng tren_can (chỉ đúng true là bật)', luuDong.length === 1 && luuDong[0].chua_xac_nhan === true, JSON.stringify(luuDong));
  await bao(UID.nvQuayA, cnA.id, MAY_1, { chua_xac_nhan: true, tren_can: [{ ...tenMoi[0], chua_xac_nhan: 'true' }] });
  const k3b = (await doiChieu(UID.thuKhoA, P[1])).rows?.[0]?.kq;
  ok('0085: máy chưa xác nhận lần gửi khác (dòng ô này không đổi — cờ dòng không phải true) → dòng không cờ, trang vẫn "Cân sẵn sàng" (không chặn mọi ô)',
     k3b?.o?.[0]?.tren_can?.[0]?.chua_xac_nhan === false && k3b.may[0].chua_xac_nhan === true && tomTatCanPhien(k3b).dong[0]?.muc === 'san_sang'
     && /chưa được cân xác nhận/.test(tomTatCanPhien(k3b).may?.vi ?? ''), JSON.stringify([k3b?.o?.[0]?.tren_can, tomTatCanPhien(k3b).may]));
  await bao(UID.nvQuayA, cnA.id, MAY_1, { tren_can: tenMoi });
  const k4 = (await doiChieu(UID.thuKhoA, P[1])).rows?.[0]?.kq;
  ok('0085: lần báo sau cân đã xác nhận → hết cờ, mốc xoá; trang "Cân sẵn sàng"', k4?.o?.[0]?.tren_can?.[0]?.chua_xac_nhan === false
     && k4.may[0].chua_xac_nhan === false && k4.may[0].chua_xac_nhan_tu === null && tomTatCanPhien(k4).dong[0]?.muc === 'san_sang',
     JSON.stringify(k4?.o?.[0]?.tren_can));
  ok('Nhãn quét bằng mã ô: 2 nhãn · 1,02 kg', Number(o?.quet) === 2 && Number(o?.quet_kg) === 1.02, `${o?.quet} · ${o?.quet_kg}`);
  ok('Tem cân in bằng mã ô từ lúc giao: 4 (23:50, 00:10 và 00:20 qua nửa đêm, vừa xong) — không tính 23:30 trước lúc giao, ô khác, loại 2',
     Number(o?.in) === 4 && Number(o?.in_kg) === 2.12, `${o?.in} · ${o?.in_kg}`);
  ok('Nhãn mã thường: chỉ 301 của phần cắt có ô (2 nhãn · 0,61 kg); 302 của Thăn nội (không ô) không cảnh báo',
     k?.nhan_thuong?.length === 1 && k.nhan_thuong[0].ma_can === '301' && k.nhan_thuong[0].so_nhan === 2
     && Number(k.nhan_thuong[0].so_kg) === 0.61, JSON.stringify(k?.nhan_thuong));
  ok('Máy quầy của chi nhánh: 1 máy (máy ở Q7 không lẫn), tự gửi bật, lệch 2, tự gửi hỏng',
     k?.may?.length === 1 && k.may[0].tu_gui === true && k.may[0].lech_so === 2 && k.may[0].gui_loi === true && k.may[0].nhat_ky_luc !== null,
     JSON.stringify(k?.may));
  ok('Không lộ người đăng nhập máy quầy, không tiền', !/nguoi|ho_ten|gia_von|tien/.test(JSON.stringify(k)));
  ok('Kế toán (xem_gia) đọc được', (await doiChieu(UID.keToanA, P[1])).loi === null);
  ok('Quản lý đọc được', (await doiChieu(UID.qlA, P[1])).loi === null);
  const nv = await doiChieu(UID.nvQuayA, P[1]);
  ok('NV quầy (không pha_loc, không xem_gia) → từ chối như đọc phiên', /không được xem/.test(nv.loi ?? ''), nv.loi ?? '');
  await tuChoiHet('kho_phien_pha_can', `select kho_phien_pha_can($1)`, [P[1]]);

  // Chốt: tem in SAU lúc chốt (bán ở quầy) không còn tính vào phiên.
  const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2) as cau`, [P[1], (await phien(P[1])).phien_ban]);
  ok('Chốt phiên', c.loi === null, c.loi ?? '');
  await db.query(`update kho_phien_pha set chot_luc = now() - interval '1 minute' where id = $1`, [P[1]]);
  await nhatKy(UID.nvQuayA, cnA.id, MAY_1, [{ mac: MAC, fid: 140, stt: 1, luc: await gioCan(`now()`), plu: 23, ma_can: '10011', so_kg: 0.7, loai: 0 }]);
  const sau = (await doiChieu(UID.thuKhoA, P[1])).rows?.[0]?.kq?.o?.[0];
  ok('Sau chốt: tem in sau lúc chốt không tính (vẫn 4), ô vẫn giữ (lô còn hàng)', Number(sau?.in) === 4 && sau?.dang_giu === true,
     JSON.stringify(sau));

  // Máy quầy im hơn 14 ngày: coi như đã thôi dùng.
  await db.query(`update kho_may_can set bao_luc = now() - interval '15 days' where ma_may = $1`, [MAY_1]);
  const cu = (await doiChieu(UID.thuKhoA, P[1])).rows?.[0]?.kq;
  ok('Máy im quá 14 ngày → không còn trong danh sách, không còn "trên cân"', cu?.may?.length === 0 && cu?.o?.[0]?.tren_can?.length === 0,
     JSON.stringify(cu?.may));
  await db.query(`update kho_may_can set bao_luc = now() where ma_may = $1`, [MAY_1]);

  // Phiên khác (tảng #2, chưa giao ô): không ô nào, không nhãn mã thường.
  P[2] = await phienMoi(tang[1].id);
  const p2 = (await doiChieu(UID.thuKhoA, P[2])).rows?.[0]?.kq;
  ok('Phiên chưa giao ô: o rỗng, nhan_thuong rỗng', p2?.o?.length === 0 && p2?.nhan_thuong?.length === 0, JSON.stringify(p2));

  // Ô trả sớm (quản lý giải phóng) rồi giao phiên khác: tem in SAU lúc trả không tính vào phiên cũ.
  const g2 = await duoi(UID.thuKhoA, `select kho_giao_o_ma($1, null) as kq`, [P[2]]);
  const giao2 = g2.rows?.[0]?.kq?.[0];
  await db.query(`update kho_o_ma_giao set tu_luc = now() - interval '10 minutes' where id = $1`, [giao2?.giao_id]);
  await nhatKy(UID.nvQuayA, cnA.id, MAY_1, [{ mac: MAC, fid: 150, stt: 1, luc: await gioCan(`now() - interval '5 minutes'`), plu: 24,
    ma_can: giao2?.ma_can, so_kg: 0.5, loai: 0 }]);
  const tra = await duoi(UID.qlA, `select kho_giai_phong_o_ma($1) as cau`, [giao2?.giao_id]);
  await nhatKy(UID.nvQuayA, cnA.id, MAY_1, [{ mac: MAC, fid: 151, stt: 1, luc: await gioCan(`now() + interval '2 minutes'`), plu: 24,
    ma_can: giao2?.ma_can, so_kg: 0.6, loai: 0 }]);
  // Phiên cũ chốt SAU lúc trả ô (giả lập mốc chốt): cửa sổ dừng ở lúc trả, không kéo tới lúc chốt.
  await db.query(`update kho_phien_pha set chot_luc = now() + interval '5 minutes' where id = $1`, [P[2]]);
  const o2 = (await doiChieu(UID.thuKhoA, P[2])).rows?.[0]?.kq?.o?.[0];
  await db.query(`update kho_phien_pha set chot_luc = null where id = $1`, [P[2]]);
  ok('Ô trả sớm rồi phiên mới chốt: chỉ tính tem trong lúc phiên còn giữ ô (1) — tem sau lúc trả (của phiên sau) không tính',
     tra.loi === null && Number(o2?.in) === 1 && o2?.dang_giu === false && o2?.den_luc !== null, tra.loi ?? JSON.stringify(o2));
});

// ===========================================================================
await nhom('7 · ĐÈN "BEEFTOWN CÂN": Ô `can` CỦA suc_khoe_he_thong', async () => {
  const k = (await duoi(UID.chu, `select suc_khoe_he_thong() as k`)).rows?.[0]?.k;
  const a = k?.chi_nhanh?.find(c => c.id === cnA.id)?.can, b = k?.chi_nhanh?.find(c => c.id === cnB.id)?.can;
  ok('Q1: giờ mở cửa mặc định 10–23, 1 máy với đủ ô (0085: thêm chua_xac_nhan, chua_xac_nhan_tu)', a?.gio_mo_cua === 10 && a?.gio_dong_cua === 23 && a?.may?.length === 1
     && JSON.stringify(Object.keys(a.may[0]).sort()) === JSON.stringify(['bao_luc', 'can_tra_loi_luc', 'chua_xac_nhan', 'chua_xac_nhan_tu', 'giu_ket_noi', 'gui_loi', 'lech_so', 'lech_tu', 'tu_gui']),
     JSON.stringify(a));
  ok('Q7: 1 máy của chủ báo', b?.may?.length === 1 && b.may[0].tu_gui === false, JSON.stringify(b));
  await bao(UID.nvQuayA, cnA.id, MAY_1, { chua_xac_nhan: true });
  const kx = (await duoi(UID.chu, `select suc_khoe_he_thong() as k`)).rows?.[0]?.k;
  const mx = kx?.chi_nhanh?.find(c => c.id === cnA.id)?.can?.may?.[0];
  ok('0085: máy chưa xác nhận → ô can của bảng sức khỏe trả chua_xac_nhan và từ lúc nào (đèn vàng sau 15 phút — test-suc-khoe-web)',
     mx?.chua_xac_nhan === true && mx.chua_xac_nhan_tu !== null, JSON.stringify(mx));
  await bao(UID.nvQuayA, cnA.id, MAY_1, {});
  await db.query(`insert into kho_ipos_cau_hinh (chi_nhanh_id, gio_mo_cua, gio_dong_cua) values ($1, 8, 22)
    on conflict (chi_nhanh_id) do update set gio_mo_cua = 8, gio_dong_cua = 22`, [cnA.id]);
  await db.query(`update kho_may_can set bao_luc = now() - interval '15 days' where ma_may = $1`, [MAY_2]);
  const k2 = (await duoi(UID.chu, `select suc_khoe_he_thong() as k`)).rows?.[0]?.k;
  ok('Giờ mở cửa theo cài đặt chi nhánh (8–22); máy im quá 14 ngày không còn tính',
     k2?.chi_nhanh?.find(c => c.id === cnA.id)?.can?.gio_mo_cua === 8 && k2?.chi_nhanh?.find(c => c.id === cnB.id)?.can?.may?.length === 0,
     JSON.stringify(k2?.chi_nhanh?.map(c => c.can)));
  ok('Quản lý Q1 chỉ thấy chi nhánh mình', ((await duoi(UID.qlA, `select suc_khoe_he_thong() as k`)).rows?.[0]?.k?.chi_nhanh ?? []).length === 1);
});

// ===========================================================================
await nhom('8 · ĐỐI SOÁT', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('Tồn khớp sổ kho', rows.length === 0, JSON.stringify(rows.slice(0, 3)));
});

process.exit(ketThuc('BEEFTOWN CÂN BÁO VỀ KHO'));
