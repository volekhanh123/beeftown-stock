/**
 * BEEFTOWN KHO — Kiểm thử máy quầy (0054): mã giảm giá, bảng quầy, tảng & ô,
 * báo cáo bán theo giờ
 * ===========================================================================
 *
 *     node test/test-kho-may-quay.mjs
 *
 * Hai tảng thăn ngoại lóc ra hai lô ở quầy: tảng #1 → ô 1 (hạn xa), tảng #2 →
 * ô 2 (hạn gần). Phải đúng:
 *   · mã giảm: chỉ danh_muc tạo; tự lấy mã từ 90001; không trùng mã món / ô;
 *     giá giảm làm tròn 1.000 đ (giống ma-giam.ts); bật / tắt;
 *   · bán món iPOS mã = mã giảm → trừ đúng món theo hạn gần, ghi ma_giam_id;
 *     tắt mã rồi vẫn bán được tem cũ; quét nhãn mã giảm ra đúng món;
 *   · bảng quầy / tảng & ô: NV quầy đọc được (không có giá vốn), chi nhánh
 *     khác và thu ngân thì không;
 *   · báo cáo bán theo giờ: chỉ xem_gia; tiền đã giảm, giảm sớm, lệch ô;
 *   · tồn khớp sổ kho.
 */

import { dungDatabase, taoBoDem, UID, maGui, UID_MAY_IPOS, themMayIpos } from './kho-chung.mjs';
import { giaGiam } from '../../web/src/lib/kho/ma-giam.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — MÁY QUẦY (0054)');
const { db, cnA, cnB, duoi } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const TU_LUC = new Date(Date.now() - 3 * 86400000).toISOString();

const MH = {};
let vt = {}, ncc;
const O = {};
const LO = {};
let tang = [];

const gioVn = phut => new Date(Date.now() + 7 * 3600000 - phut * 60000).toISOString().slice(0, 19).replace('T', ' ');
let tran = 100;
function hd(items, phutTruoc = 20) {
  tran += 1;
  return {
    ma_hd: `5898:${tran}`,
    thoi_diem_ban: gioVn(phutTruoc).replace(' ', 'T') + '+07:00',
    da_huy: false,
    raw: { event_id: 11 },
    dong: items.map((it, i) => ({ khoa_dong: i, ma_ipos: it.ma, ten_ipos: it.ten ?? it.ma, so_luong: it.sl, thanh_tien: it.tien ?? 100000 })),
  };
}
async function ban(items) {
  const h = hd(items);
  const r = await duoi(MAY, `select kho_ipos_nhan_callback($1, $2::jsonb) as kq`, [cnA.id, JSON.stringify(h)]);
  if (r.loi) throw new Error(r.loi);
  return (await db.query(`select d.* from kho_ipos_dong d join kho_ipos_hoa_don h on h.id = d.hoa_don_id
    where h.ma_hd = $1 order by d.khoa_dong::int`, [h.ma_hd])).rows;
}
const loDaTru = async dongId => (await db.query(`select lo_id, -sum(so_goi)::int goi from kho_so_cai
  where chung_tu_loai = 'ban_hang' and chung_tu_id = $1 and loai = 'ban' group by lo_id`, [dongId])).rows;

// ===========================================================================
await nhom('1 · CHUẨN BỊ: HAI TẢNG, HAI Ô, HAI LÔ Ở QUẦY, iPOS', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Úc') returning id`)).rows[0].id;
  await duoi(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'T-THANNGOAI'`);
  await duoi(UID.qlA, `update kho_mat_hang set gia_ban_kg = 1150000, quay_toi_thieu_goi = 10, quay_toi_da_goi = 12 where ma = 'C-THANNGOAI'`);
  const ct = (await duoi(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Chuẩn') returning id`,
    [MH['T-THANNGOAI'].id])).rows[0].id;
  await duoi(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien) values ($1, $2, 60)`, [ct, MH['C-THANNGOAI'].id]);
  for (const r of (await duoi(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10011'), ($1, 2, '10012') returning id, so_o`,
    [MH['C-THANNGOAI'].id])).rows) O[r.so_o] = r.id;

  const mo = await ngay(-15);
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt.kho, await ngay(-10), JSON.stringify([1, 2].map(() =>
      ({ mat_hang_id: MH['T-THANNGOAI'].id, so_kg: 6, so_kg_thuc: 5.9, don_gia_kg: 450000, ngay_mo: mo })))]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  const d = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (d.loi) throw new Error(d.loi);
  tang = (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id])).rows;

  for (const [i, han] of [[0, 5], [1, 2]]) {
    const ph = await duoi(UID.thuKhoA, `
      select * from kho_luu_phien_pha(
        p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
        p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date,
        p_ghi_chu => null, p_vao => $5::jsonb, p_ra => $6::jsonb)`,
      [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay, JSON.stringify([{ lo_id: tang[i].id, vi_tri_id: vt.kho }]),
       JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 2, so_goi: 4, xu_ly: 'nhap_kho', vi_tri_id: vt.quay, han_dung: await ngay(han) }])]);
    if (ph.loi) throw new Error(ph.loi);
    const id = ph.rows[0].phien_id;
    const g = await duoi(UID.thuKhoA, `select kho_giao_o_ma($1, null) as kq`, [id]);
    if (g.loi) throw new Error(g.loi);
    const pb = (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [id])).rows[0].phien_ban;
    const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2)`, [id, pb]);
    if (c.loi) throw new Error(c.loi);
    LO[i + 1] = (await db.query(`select lo_id from kho_phien_pha_ra where phien_pha_id = $1`, [id])).rows[0].lo_id;
  }
  await db.query(`update kho_o_ma_giao set tu_luc = now() - interval '2 days'`);

  const chu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id,
    JSON.stringify({ bat: true, pos_parent: 'BEEFTOWN', pos_id: '5898', vi_tri_ban_id: vt.quay })]);
  const cs = await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, $2::timestamptz)`, [cnA.id, TU_LUC]);
  ok('Hai lô ở quầy (4 gói mỗi lô), iPOS bật', LO[1] && LO[2] && chu.loi === null && cs.loi === null, chu.loi ?? cs.loi ?? '');
});

// ===========================================================================
let G30;
await nhom('2 · MÃ GIẢM GIÁ', async () => {
  const luu = (uid, pt, ma = null, mh = MH['C-THANNGOAI'].id) => duoi(uid, `select kho_luu_ma_giam($1, $2, $3) as v`, [mh, pt, ma]);
  ok('Thủ kho không tạo được', /quản lý hoặc chủ/.test((await luu(UID.thuKhoA, 30)).loi ?? ''));
  ok('NV quầy không tạo được', (await luu(UID.nvQuayA, 30)).loi !== null);
  ok('Mức 3% → báo', /5% đến 90%/.test((await luu(UID.qlA, 3)).loi ?? ''), (await luu(UID.qlA, 3)).loi ?? '');

  const a = await luu(UID.qlA, 30);
  G30 = a.rows?.[0]?.v;
  ok('Quản lý tạo -30%: mã 90001, giá 1.150.000 → 805.000', a.loi === null && G30.ma_can === '90001' && G30.gia_giam_kg === 805000,
     a.loi ?? JSON.stringify(G30));
  ok('Giá giảm SQL = ma-giam.ts giaGiam', giaGiam(1150000, 30) === 805000 && giaGiam(1150000, 25) === 863000
     && Number((await db.query(`select kho_gia_giam(1150000, 25) g`)).rows[0].g) === 863000);
  const b = await luu(UID.qlA, 30);
  ok('Tạo lại cùng mức → cùng mã, không thêm dòng', b.rows?.[0]?.v?.id === G30.id
     && Number((await db.query(`select count(*) n from kho_ma_giam`)).rows[0].n) === 1);
  const c = await luu(UID.qlA, 50);
  ok('Mức -50% lấy mã trống kế tiếp 90002', c.rows?.[0]?.v?.ma_can === '90002', c.loi ?? '');

  ok('Mã trùng ô mã → báo', /ô mã/.test((await luu(UID.qlA, 40, '10011')).loi ?? ''));
  const maMon = (await db.query(`select ma_can from kho_mat_hang where ma_can is not null and dang_dung limit 1`)).rows[0]?.ma_can;
  ok('Mã trùng mã cân của món → báo', !maMon || /mã cân của một món/.test((await luu(UID.qlA, 40, maMon)).loi ?? ''));
  ok('Đặt mã cân món = mã giảm → báo',
     /mã giảm giá/.test((await duoi(UID.qlA, `update kho_mat_hang set ma_can = '90001' where ma = 'T-THANNGOAI'`)).loi ?? ''));
  ok('Thêm ô mã trùng mã giảm → báo',
     /mã giảm giá/.test((await duoi(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 3, '90002')`, [MH['C-THANNGOAI'].id])).loi ?? ''));
  const tang0 = await luu(UID.qlA, 30, null, MH['T-THANNGOAI'].id);
  ok('Món không bán qua cân (tảng, chưa mã cân) → báo', /không bán qua cân|chưa có giá/.test(tang0.loi ?? ''), tang0.loi ?? '');

  const tat = await duoi(UID.qlA, `select kho_bat_ma_giam($1, false) as v`, [c.rows[0].v.id]);
  ok('Tắt mã -50%', /Đã tắt mã 90002/.test(tat.rows?.[0]?.v ?? ''), tat.loi ?? '');
  const doc = await duoi(UID.nvQuayA, `select ma_can, dang_dung from kho_ma_giam order by ma_can`);
  ok('NV quầy đọc được mã giảm (RLS xem)', doc.rows?.length === 2 && doc.rows[1].dang_dung === false, doc.loi ?? '');
  ok('Thu ngân không đọc được', ((await duoi(UID.thuNganA, `select * from kho_ma_giam`)).rows ?? []).length === 0);
  ok('Hàm nội bộ không gọi được', /permission denied/.test((await duoi(UID.qlA, `select * from kho_mat_hang_theo_ma_can('90001')`)).loi ?? ''));
  const q = (await db.query(`select ma from kho_mat_hang_theo_ma_can('90001')`)).rows[0];
  ok('Quét nhãn mã giảm 90001 → đúng món', q?.ma === 'C-THANNGOAI');
});

// ===========================================================================
let dGiam;
await nhom('3 · BÁN BẰNG MÃ GIẢM', async () => {
  [dGiam] = await ban([{ ma: '90001', sl: 0.5, tien: 402500 }]);
  const t = await loDaTru(dGiam.id);
  ok('Món iPOS "90001" (chưa ghép) → món C-THANNGOAI, mã giảm, không ô, theo hạn gần (lô tảng #2)',
     dGiam.trang_thai === 'da_ghi' && dGiam.mat_hang_id === MH['C-THANNGOAI'].id && dGiam.ma_giam_id === G30.id
     && dGiam.o_ma_id === null && t[0]?.lo_id === LO[2], JSON.stringify({ dGiam, t }));
  const v = await duoi(UID.qlA, `select giam_pt, ma_can_giam from kho_v_ipos_dong where id = $1`, [dGiam.id]);
  ok('View: giảm 30%, mã 90001', v.rows?.[0]?.giam_pt === 30 && v.rows[0].ma_can_giam === '90001', v.loi ?? '');

  const [d2] = await ban([{ ma: '090002', sl: 0.5 }]);
  ok('Mã giảm đã tắt vẫn bán được (tem in trước)', d2.trang_thai === 'da_ghi' && d2.ma_giam_id !== null, JSON.stringify(d2));

  const [d3] = await ban([{ ma: 'RIB-O1', sl: 0.5 }]);
  await duoi(UID.qlA, `select kho_ipos_gan_o_ma($1, 'RIB-O1', $2, 'kg')`, [cnA.id, O[1]]);
  const [d4] = await ban([{ ma: 'RIB-O1', sl: 0.5 }]);
  ok('Bán theo ô vẫn như cũ (không mã giảm)', d4.trang_thai === 'da_ghi' && d4.o_ma_id === O[1] && d4.ma_giam_id === null,
     JSON.stringify({ d3, d4 }));
  const [d5] = await ban([{ ma: 'RIB-O1', sl: 1.5 }]);
  ok('Bán quá lô của ô → lệch ô', d5.lech_o === true, JSON.stringify(d5));
});

// ===========================================================================
await nhom('4 · BẢNG QUẦY', async () => {
  const r = await duoi(UID.nvQuayA, `select kho_bang_quay($1) as v`, [cnA.id]);
  const b = r.rows?.[0]?.v;
  ok('NV quầy đọc được bảng quầy', r.loi === null && b && Array.isArray(b.lo), r.loi ?? '');
  const lo1 = b?.lo?.find(x => x.lo_id === LO[1]);
  ok('Lô ở quầy có số tảng, hạn, tình trạng', lo1 && lo1.so_tang === tang[0].so_tang && lo1.han_dung && lo1.tinh_trang === 'con_han',
     JSON.stringify(lo1));
  const lo2 = b?.lo?.find(x => x.lo_id === LO[2]);
  ok('Lô tảng #2 đã bán hết → không còn ở bảng quầy', lo2 === undefined, JSON.stringify(lo2));
  ok('Mã giảm đang bật (chỉ -30%) kèm giá đã giảm', b?.ma_giam?.length === 1 && b.ma_giam[0].ma_can === '90001' && b.ma_giam[0].gia_giam_kg === 805000);
  ok('Món có mức tối thiểu + gợi ý mang ra', b?.mon?.some(m => m.ma === 'C-THANNGOAI' && m.quay_toi_thieu_goi === 10)
     && b.goi_y.some(g => g.mat_hang_id === MH['C-THANNGOAI'].id), JSON.stringify(b?.goi_y));
  ok('Lý do huỷ kèm cần ảnh', b?.ly_do_huy?.length > 0 && b.ly_do_huy.every(l => typeof l.can_anh === 'boolean'));
  ok('Không lộ giá vốn', !JSON.stringify(b).includes('gia_von'));

  const yc = await duoi(UID.nvQuayA, `select * from kho_tao_yeu_cau($1, $2, $3, 'tay', 'Ca tối', $4::jsonb)`,
    [cnA.id, maGui(), vt.quay, JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 6 }])]);
  const b2 = (await duoi(UID.nvQuayA, `select kho_bang_quay($1) as v`, [cnA.id])).rows?.[0]?.v;
  ok('Yêu cầu vừa tạo hiện trong bảng quầy (kèm món)', yc.loi === null && b2?.yeu_cau?.[0]?.dong?.[0]?.so_goi === 6, yc.loi ?? '');

  ok('Quản lý chi nhánh khác → không được', /không xem được kho/.test((await duoi(UID.qlB, `select kho_bang_quay($1)`, [cnA.id])).loi ?? ''));
  ok('Thu ngân → không được', (await duoi(UID.thuNganA, `select kho_bang_quay($1)`, [cnA.id])).loi !== null);
});

// ===========================================================================
await nhom('5 · TẢNG & Ô MÃ', async () => {
  const r = await duoi(UID.nvQuayA, `select kho_can_o_ma($1) as v`, [cnA.id]);
  const ds = r.rows?.[0]?.v ?? [];
  ok('NV quầy đọc được (không cần quyền phiên lóc)', r.loi === null && ds.length === 2, r.loi ?? JSON.stringify(ds));
  const o1 = ds.find(x => x.so_o === 1), o2 = ds.find(x => x.so_o === 2);
  ok('Ô 1: tảng #1, lô ra, lóc 2 kg / 4 gói, còn giữ', o1?.so_tang === tang[0].so_tang && o1.lo_id === LO[1]
     && Number(o1.kg_ra) === 2 && o1.goi_ra === 4 && o1.con_giu === true, JSON.stringify(o1));
  ok('Ô 1: đã bán > 0, bán đúng ô ≥ 1, lệch ô 1', Number(o1?.kg_ban) > 0 && o1.so_ban_dung_o >= 1 && o1.so_lech_o === 1, JSON.stringify(o1));
  ok('Ô 2: tảng #2', o2?.so_tang === tang[1].so_tang, JSON.stringify(o2));
  ok('Chi nhánh khác → không được', (await duoi(UID.thuKhoB, `select kho_can_o_ma($1)`, [cnA.id])).loi !== null);
});

// ===========================================================================
await nhom('6 · BÁO CÁO BÁN THEO GIỜ', async () => {
  ok('NV quầy không xem được (có doanh thu)', /chỉ chủ, quản lý, kế toán/.test(
    (await duoi(UID.nvQuayA, `select * from kho_bao_cao_ban_gio($1, $2::date, $2::date)`, [cnA.id, homNay])).loi ?? ''));
  const r = await duoi(UID.keToanA, `select * from kho_bao_cao_ban_gio($1, ($2::date - 1), $2::date)`, [cnA.id, homNay]);
  const rows = r.rows ?? [];
  const cong = k => rows.reduce((s, x) => s + Number(x[k]), 0);
  ok('Kế toán xem được, có dòng', r.loi === null && rows.length > 0, r.loi ?? '');
  ok('Số dòng bán = số dòng đã ghi', cong('so_dong') === Number((await db.query(
    `select count(*) n from kho_ipos_dong where trang_thai = 'da_ghi'`)).rows[0].n));
  ok('2 dòng giảm giá, 1 kg', cong('so_dong_giam') === 2 && cong('so_kg_giam') === 1, JSON.stringify(rows));
  // 0,5 kg × 1.150.000 − 402.500 = 172.500; 0,5 kg × 1.150.000 − 100.000 = 475.000
  ok('Tiền đã giảm ước tính 647.500', cong('tien_giam') === 647500, String(cong('tien_giam')));
  ok('Giảm sớm: lô còn 2 ngày > cảnh báo 1 ngày → 2 dòng', cong('so_dong_giam_som') === 2, String(cong('so_dong_giam_som')));
  ok('Lệch ô: 1 dòng', cong('so_dong_lech_o') === 1);
  ok('Giờ trong 0–23', rows.every(x => x.gio >= 0 && x.gio <= 23));
  ok('Khoảng ngày ngược → báo', (await duoi(UID.qlA, `select * from kho_bao_cao_ban_gio($1, $2::date, ($2::date - 1))`, [cnA.id, homNay])).loi !== null);

  await db.query(`update kho_cai_dat set canh_bao_truoc_ngay = 3 where chi_nhanh_id = $1`, [cnA.id]);
  await db.query(`update kho_mat_hang set canh_bao_truoc_ngay = null where ma = 'C-THANNGOAI'`);
  const r2 = (await duoi(UID.qlA, `select * from kho_bao_cao_ban_gio($1, $2::date, $2::date)`, [cnA.id, homNay])).rows ?? [];
  ok('Cảnh báo 3 ngày → không còn giảm sớm', r2.reduce((s, x) => s + x.so_dong_giam_som, 0) === 0);
});

// ===========================================================================
await nhom('7 · ĐỐI SOÁT', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('Tồn khớp sổ kho', rows.length === 0, JSON.stringify(rows));
});

process.exit(ketThuc('MÁY QUẦY'));
