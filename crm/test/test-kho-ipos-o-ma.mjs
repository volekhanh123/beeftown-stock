/**
 * BEEFTOWN KHO — Kiểm thử bán qua iPOS theo ô mã → trừ đúng lô của tảng (0051)
 * ===========================================================================
 *
 *     node test/test-kho-ipos-o-ma.mjs
 *
 * Hai tảng thăn ngoại lóc ra hai lô phần cắt ở quầy: tảng #1 → ô 1 (lô L1, hạn
 * xa), tảng #2 → ô 2 (lô L2, hạn gần). Theo hạn gần nhất (FEFO) thì mọi lần
 * bán đều trừ L2 — nhưng bán món "ô 1" phải trừ L1. Phải đúng:
 *   · ghép món iPOS với ô (kho_ipos_gan_o_ma) → trừ lô của ô;
 *   · mã món iPOS trùng mã ô, chưa ghép → tự nhận ô;
 *   · món ghép thường (không ô) → FEFO như cũ;
 *   · lô của ô không đủ → FEFO + lech_o, câu lý do rõ;
 *   · ghép lại bằng v2 → bỏ ô; quyền; view có số ô, số tảng;
 *   · truy vết tảng thấy đúng kg bán; kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui, UID_MAY_IPOS, themMayIpos } from './kho-chung.mjs';
import { docFormGhep, goiYOMa } from '../../web/src/lib/kho/ban-ipos.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — iPOS THEO Ô MÃ');
const { db, cnA, cnB, duoi } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const TU_LUC = new Date(Date.now() - 3 * 86400000).toISOString();
const POS_PARENT = 'BEEFTOWN';
const POS_ID = '5898';

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
    ma_hd: `${POS_ID}:${tran}`,
    thoi_diem_ban: gioVn(phutTruoc).replace(' ', 'T') + '+07:00',
    da_huy: false,
    raw: { event_id: 11 },
    dong: items.map((it, i) => ({ khoa_dong: i, ma_ipos: it.ma, ten_ipos: it.ten ?? it.ma, so_luong: it.sl, thanh_tien: 100000 })),
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
const goiQuay = async lo => Number((await db.query(`select coalesce(sum(so_goi), 0) g from kho_ton where lo_id = $1 and vi_tri_id = $2`,
  [lo, vt.quay])).rows[0].g);
const ganO = (uid, ma, o, dv = 'kg') => duoi(uid, `select kho_ipos_gan_o_ma($1, $2, $3, $4) as v`, [cnA.id, ma, o, dv]);

// ===========================================================================
await nhom('1 · CHUẨN BỊ: HAI TẢNG, HAI Ô, HAI LÔ Ở QUẦY', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Úc') returning id`)).rows[0].id;
  await duoi(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'T-THANNGOAI'`);
  await duoi(UID.qlA, `update kho_mat_hang set gia_ban_kg = 900000 where ma = 'C-THANNGOAI'`);
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

  // Tảng #1 → ô 1, hạn xa; tảng #2 → ô 2, hạn gần.
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
  // Ô được giao từ trước giờ bán trong test.
  await db.query(`update kho_o_ma_giao set tu_luc = now() - interval '2 days'`);
  const oCua = (await db.query(`select o.so_o, g.lo_id from kho_o_ma_giao g join kho_o_ma o on o.id = g.o_ma_id order by o.so_o`)).rows;
  ok('Ô 1 ↔ lô tảng #1, ô 2 ↔ lô tảng #2; mỗi lô 4 gói ở quầy',
     oCua[0]?.lo_id === LO[1] && oCua[1]?.lo_id === LO[2] && await goiQuay(LO[1]) === 4 && await goiQuay(LO[2]) === 4, JSON.stringify(oCua));

  const chu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id,
    JSON.stringify({ bat: true, pos_parent: POS_PARENT, pos_id: POS_ID, vi_tri_ban_id: vt.quay })]);
  const cs = await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, $2::timestamptz)`, [cnA.id, TU_LUC]);
  ok('Bật iPOS, chuyển sang trừ kho theo iPOS', chu.loi === null && cs.loi === null, chu.loi ?? cs.loi ?? '');
});

// ===========================================================================
await nhom('2 · GHÉP MÓN iPOS VỚI Ô', async () => {
  ok('Thủ kho không ghép được (quyền danh mục)', (await ganO(UID.thuKhoA, 'RIB-O1', O[1])).loi !== null);
  const sai = await ganO(UID.qlA, 'RIB-O1', O[1], 'suat');
  ok('Bán theo suất → báo', /kg hoặc gói/.test(sai.loi ?? ''), sai.loi ?? '');
  const g = await ganO(UID.qlA, 'RIB-O1', O[1]);
  ok('Quản lý ghép "RIB-O1" ↔ ô 1 (10011), bán theo kg', g.loi === null && g.rows[0].v.so_o === 1 && g.rows[0].v.don_vi_ban === 'kg',
     g.loi ?? JSON.stringify(g.rows?.[0]?.v));
  const m = (await db.query(`select * from kho_ipos_ma_hang where ma_ipos = 'RIB-O1'`)).rows[0];
  ok('Dòng ghép: kiểu mon, món của ô, o_ma_id', m.kieu === 'mon' && m.mat_hang_id === MH['C-THANNGOAI'].id && m.o_ma_id === O[1]);
  ok('Hàm nội bộ không gọi được', /permission denied/.test((await duoi(UID.qlA, `select kho_ipos_lo_cua_o($1, $2, now())`, [cnA.id, O[1]])).loi ?? ''));
});

// ===========================================================================
await nhom('3 · BÁN THEO Ô → ĐÚNG LÔ', async () => {
  const [d1] = await ban([{ ma: 'RIB-O1', sl: 0.5 }]);
  const t1 = await loDaTru(d1.id);
  ok('Bán "RIB-O1" 0,5 kg → trừ 1 gói ở lô tảng #1 (dù lô tảng #2 hạn gần hơn)',
     d1.trang_thai === 'da_ghi' && t1.length === 1 && t1[0].lo_id === LO[1] && t1[0].goi === 1, JSON.stringify({ d1, t1 }));
  ok('Dòng ghi ô 1, lô của ô, không lệch', d1.o_ma_id === O[1] && d1.lo_o_id === LO[1] && d1.lech_o === false);

  const [d2] = await ban([{ ma: '10012', sl: 0.5 }]);
  const t2 = await loDaTru(d2.id);
  ok('Mã món iPOS "10012" trùng mã ô 2, chưa ghép → tự nhận ô 2, trừ lô tảng #2',
     d2.trang_thai === 'da_ghi' && d2.o_ma_id === O[2] && t2[0]?.lo_id === LO[2], JSON.stringify({ d2, t2 }));

  const v2 = await duoi(UID.qlA, `select kho_ipos_gan_ma_v2($1, 'THAN', 'mon', $2, 'goi', null)`, [cnA.id, MH['C-THANNGOAI'].id]);
  const [d3] = await ban([{ ma: 'THAN', sl: 1 }]);
  const t3 = await loDaTru(d3.id);
  ok('Món ghép thường (không ô) → FEFO: lô hạn gần (tảng #2)',
     v2.loi === null && d3.trang_thai === 'da_ghi' && d3.o_ma_id === null && t3[0]?.lo_id === LO[2], JSON.stringify({ d3, t3 }));
  ok('Quầy còn: lô #1 3 gói, lô #2 2 gói', await goiQuay(LO[1]) === 3 && await goiQuay(LO[2]) === 2);
});

// ===========================================================================
await nhom('4 · LÔ CỦA Ô KHÔNG ĐỦ → FEFO + LỆCH Ô', async () => {
  const [d] = await ban([{ ma: 'RIB-O1', sl: 2 }]);
  const t = await loDaTru(d.id);
  ok('Bán "RIB-O1" 2 kg (4 gói) khi lô ô 1 còn 3 gói → vẫn ghi được theo hạn gần, lech_o, câu rõ',
     d.trang_thai === 'da_ghi' && d.lech_o === true && /Ô 1 \(mã 10011\): lô của tảng không đủ/.test(d.ly_do ?? '')
     && t.reduce((s, x) => s + x.goi, 0) === 4, JSON.stringify({ d, t }));

  const v = await duoi(UID.qlA, `select so_o, ma_can_o, so_tang, lech_o from kho_v_ipos_dong where id = $1`, [d.id]);
  ok('View: số ô, mã ô, số tảng, lệch ô', v.rows?.[0]?.so_o === 1 && v.rows[0].ma_can_o === '10011'
     && v.rows[0].so_tang === tang[0].so_tang && v.rows[0].lech_o === true, v.loi ?? JSON.stringify(v.rows));
});

// ===========================================================================
await nhom('5 · GHÉP LẠI BẰNG v2 → BỎ Ô · TRUY VẾT · ĐỐI SOÁT', async () => {
  await duoi(UID.qlA, `select kho_ipos_gan_ma_v2($1, 'RIB-O1', 'mon', $2, 'kg', null)`, [cnA.id, MH['C-THANNGOAI'].id]);
  const m = (await db.query(`select o_ma_id from kho_ipos_ma_hang where ma_ipos = 'RIB-O1'`)).rows[0];
  ok('Ghép lại bằng v2: bỏ ô', m.o_ma_id === null);

  const tv = (await duoi(UID.qlA, `select kho_truy_vet_tang($1) as kq`, [tang[0].id])).rows?.[0]?.kq;
  const lo1 = tv?.lo_ra?.find(x => x.lo_id === LO[1]);
  ok('Truy vết tảng #1: lô cắt ra có kg bán > 0 (bán theo ô 1)', Number(lo1?.kg_ban) > 0, JSON.stringify(lo1));

  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('Tồn khớp sổ kho', rows.length === 0, JSON.stringify(rows));
});

// ===========================================================================
await nhom('6 · WEB: FORM GHÉP Ô, GỢI Ý Ô', async () => {
  const fd = o => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.set(k, v); return f; };
  const a = docFormGhep(fd({ ma_ipos: 'RIB-O1', mat_hang_id: `o:${O[1]}`, don_vi_ban: '' }));
  ok('Chọn "o:<id>" → ghép ô, mặc định bán theo kg', a.ghep?.oMa === O[1] && a.ghep.kieu === 'mon' && a.ghep.donVi === 'kg', JSON.stringify(a));
  ok('Ô mã bán theo suất → báo (có tiếng Anh)', !!docFormGhep(fd({ ma_ipos: 'X', mat_hang_id: `o:${O[1]}`, don_vi_ban: 'suat' })).loiEn);
  ok('"o:" không phải uuid → báo', docFormGhep(fd({ ma_ipos: 'X', mat_hang_id: 'o:abc' })).ghep === null);
  const cac = [{ id: 'o1', ma_can: '10011' }, { id: 'o2', ma_can: '10012' }];
  ok('Gợi ý ô: mã món "010012" hoặc mã cân nhãn 10011', goiYOMa({ ma_ipos: '010012', ma_can: null }, cac)?.id === 'o2'
     && goiYOMa({ ma_ipos: 'RIB', ma_can: '10011' }, cac)?.id === 'o1' && goiYOMa({ ma_ipos: 'RIB', ma_can: null }, cac) === null);
});

process.exit(ketThuc('iPOS THEO Ô MÃ'));
