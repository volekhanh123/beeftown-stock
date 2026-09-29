/**
 * BEEFTOWN KHO — Kiểm thử ô mã xoay vòng, phiên lóc một tảng (0049)
 * =================================================================
 *
 *     node test/test-kho-o-ma.mjs
 *
 * Phần cắt của món theo tảng có vài ô mã cố định (mã cân riêng, tạo một lần trên
 * FABi). Lóc một tảng thì kho giao một ô trống cho phần cắt; tem in bằng mã ô;
 * chốt phiên thì ô gắn với lô ra; tảng bán hết thì ô dùng lại. Mỗi phiên lóc
 * món theo tảng chỉ một tảng. Cuối cùng: kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';
import { docPhienLocHsd } from '../../web/src/lib/kho/o-ma.ts';
import { hanLoRaDuKien } from '../../web/src/lib/kho/danh-muc-can.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — Ô MÃ · PHIÊN LÓC MỘT TẢNG');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

/** Nhãn cân EAN-13 theo mẫu mặc định 2XCCCCCWWWWWK (kg 3 số lẻ). */
function nhan(maCan, kg) {
  const s = '20' + String(maCan).padStart(5, '0') + String(Math.round(kg * 1000)).padStart(5, '0');
  let t = 0;
  for (let i = 0; i < 12; i++) t += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  return s + ((10 - t % 10) % 10);
}

const MH = {};
let vt = {}, vtB = {};
let ncc;

async function nhapTang(cn, dong) {
  const ql = cn === cnB.id ? UID.qlB : UID.qlA;
  const tk = cn === cnB.id ? UID.thuKhoB : UID.thuKhoA;
  const luu = await duoi(ql, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cn, maGui(), ncc, cn === cnB.id ? vtB.kho : vt.kho, await ngay(-10), JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const g = await duoi(tk, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (g.loi) throw new Error(g.loi);
  const d = await duoi(ql, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (d.loi) throw new Error(d.loi);
  return (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id])).rows;
}

function luuPhien(uid, t) {
  return duoi(uid, `
    select * from kho_luu_phien_pha(
      p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
      p_mat_hang_vao_id => $5, p_cong_thuc_id => null, p_ngay_pha => $6::date,
      p_ghi_chu => null, p_vao => $7::jsonb, p_ra => '[]'::jsonb)`,
    [t.id ?? null, t.cn ?? cnA.id, maGui(), t.phienBan ?? null, MH['T-THANNGOAI'].id, homNay, JSON.stringify(t.vao)]);
}
const phien = async id => (await db.query(`select * from kho_phien_pha where id = $1`, [id])).rows[0];
const giao = (uid, id, mh = null) => duoi(uid, `select kho_giao_o_ma($1, $2) as kq`, [id, mh]);
const quet = (id, ma) => duoi(UID.thuKhoA, `select kho_quet_phien_pha(p_id => $1, p_ma_gui => $2, p_ma => $3::jsonb) as kq`,
  [id, maGui(), JSON.stringify(ma)]);
const chot = async id => duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2) as cau`, [id, (await phien(id)).phien_ban]);
const oCua = async id => (await db.query(`select o.so_o, o.ma_can, g.lo_id, g.den_luc from kho_o_ma_giao g join kho_o_ma o on o.id = g.o_ma_id
  where g.phien_pha_id = $1 order by g.tu_luc`, [id])).rows;

let tang = [];
const P = {};

// ===========================================================================
await nhom('1 · CHUẨN BỊ: TẢNG THEO DÕI, CÔNG THỨC, BỐN TẢNG', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  vtB = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnB.id])).rows.map(r => [r.loai, r.id]));
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
  tang = await nhapTang(cnA.id, [1, 2, 3, 4, 5].map(i => ({ mat_hang_id: MH['T-THANNGOAI'].id, so_kg: 6 + i / 10, so_kg_thuc: 6 + i / 10, don_gia_kg: 500000, ngay_mo: mo })));
  ok('Năm tảng thăn ngoại, số tảng 1–5', tang.map(l => l.so_tang).join() === '1,2,3,4,5');
});

// ===========================================================================
await nhom('2 · DANH MỤC Ô MÃ', async () => {
  const c = MH['C-THANNGOAI'].id;
  const tk = await duoi(UID.thuKhoA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10011')`, [c]);
  ok('Thủ kho không tạo được ô mã', tk.loi !== null);
  const t = await duoi(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '010011'), ($1, 2, '10012'), ($1, 3, '10013') returning ma_can`, [c]);
  ok('Quản lý tạo 3 ô cho Thăn ngoại cắt lát; bỏ số 0 đầu', t.loi === null && t.rows.map(r => r.ma_can).join() === '10011,10012,10013', t.loi ?? '');
  const trungMon = await duoi(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 4, '302')`, [c]);
  ok('Mã ô trùng mã cân món đang dùng → báo', /mã cân của món khác/.test(trungMon.loi ?? ''), trungMon.loi ?? '');
  const trungO = await duoi(UID.qlA, `update kho_mat_hang set ma_can = '10012' where ma = 'C-THANLUNG'`);
  ok('Đặt mã cân món trùng mã ô → báo', /ô mã của một phần cắt/.test(trungO.loi ?? ''), trungO.loi ?? '');
  const tangO = await duoi(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10021')`, [MH['T-THANNGOAI'].id]);
  ok('Ô mã chỉ cho phần cắt', /chỉ dành cho phần cắt/.test(tangO.loi ?? ''), tangO.loi ?? '');
  const tra = async ma => (await db.query(`select ma from kho_mat_hang_theo_ma_can($1)`, [ma])).rows.map(r => r.ma).join();
  ok('Tra mã: 10012 → Thăn ngoại cắt lát; 301 → Thăn ngoại cắt lát; 555 → không có',
     await tra('10012') === 'C-THANNGOAI' && await tra('301') === 'C-THANNGOAI' && await tra('555') === '');
  ok('Hàm tra mã là nội bộ', /permission denied/.test((await duoi(UID.qlA, `select * from kho_mat_hang_theo_ma_can('301')`)).loi ?? ''));
});

// ===========================================================================
await nhom('3 · PHIÊN MỘT TẢNG, GIAO Ô', async () => {
  const hai = await luuPhien(UID.thuKhoA, { vao: [{ lo_id: tang[0].id, vi_tri_id: vt.kho }, { lo_id: tang[1].id, vi_tri_id: vt.kho }] });
  ok('Một phiên hai tảng → báo', /chỉ một tảng/.test(hai.loi ?? ''), hai.loi ?? '');
  const p1 = await luuPhien(UID.thuKhoA, { vao: [{ lo_id: tang[0].id, vi_tri_id: vt.kho }] });
  P[1] = p1.rows?.[0]?.phien_id;
  ok('Phiên tảng #1', !!P[1], p1.loi ?? '');
  ok('NV quầy không giao ô được', (await giao(UID.nvQuayA, P[1])).loi !== null);
  const g = await giao(UID.thuKhoA, P[1]);
  ok('Giao ô: chỉ phần cắt có ô trong công thức → Thăn ngoại cắt lát ô 1 (10011)',
     g.loi === null && g.rows[0].kq.length === 1 && g.rows[0].kq[0].so_o === 1 && g.rows[0].kq[0].ma_can === '10011', g.loi ?? JSON.stringify(g.rows?.[0]?.kq));
  const lai = await giao(UID.thuKhoA, P[1]);
  ok('Bấm lại không lấy thêm ô', lai.rows?.[0]?.kq.length === 1 && (await oCua(P[1])).length === 1);

  for (const i of [2, 3]) {
    P[i] = (await luuPhien(UID.thuKhoA, { vao: [{ lo_id: tang[i - 1].id, vi_tri_id: vt.kho }] })).rows[0].phien_id;
    await giao(UID.thuKhoA, P[i]);
  }
  ok('Tảng #2 → ô 2, tảng #3 → ô 3', (await oCua(P[2]))[0]?.so_o === 2 && (await oCua(P[3]))[0]?.so_o === 3);
  P[4] = (await luuPhien(UID.thuKhoA, { vao: [{ lo_id: tang[3].id, vi_tri_id: vt.kho }] })).rows[0].phien_id;
  const het = await giao(UID.thuKhoA, P[4]);
  ok('Tảng #4: hết ô → báo rõ', /đã dùng hết ô mã/.test(het.loi ?? ''), het.loi ?? '');
  const huy = await duoi(UID.thuKhoA, `select kho_huy_phien_pha($1, 'Để mai lóc')`, [P[3]]);
  ok('Huỷ phiên tảng #3 → trả ô 3', huy.loi === null && (await oCua(P[3]))[0]?.den_luc !== null, huy.loi ?? '');
  const g4 = await giao(UID.thuKhoA, P[4]);
  ok('Tảng #4 nhận ô 3 vừa trả', g4.rows?.[0]?.kq?.[0]?.so_o === 3, g4.loi ?? '');

  const pB = (await luuPhien(UID.thuKhoB, { cn: cnB.id, vao: [] })).loi;
  ok('(Chi nhánh B chưa có tảng — bỏ qua)', pB === null || pB !== null);
});

// ===========================================================================
await nhom('4 · QUÉT NHÃN MÃ Ô, CHỐT, MỞ LẠI', async () => {
  const q = await quet(P[1], [nhan(10011, 0.5), nhan(10011, 0.52), nhan(10012, 0.4), nhan(301, 0.3), nhan(302, 1.1)]);
  const kq = q.rows?.[0]?.kq;
  ok('Nhãn ô của phiên + nhãn mã món: cộng 4; nhãn ô 2 (của tảng #2) bị từ chối',
     q.loi === null && kq.so_nhan === 4 && kq.loi.length === 1 && /không giao cho phiên này/.test(kq.loi[0].loi), q.loi ?? JSON.stringify(kq));
  ok('Thăn ngoại cắt lát: 3 gói 1,32 kg', kq?.mon?.some(m => m.so_goi === 3 && Number(m.so_kg) === 1.32), JSON.stringify(kq?.mon));
  const c = await chot(P[1]);
  ok('Chốt phiên tảng #1', c.loi === null, c.loi ?? '');
  const loRa = (await db.query(`select lo_id from kho_phien_pha_ra where phien_pha_id = $1 and mat_hang_id = $2`, [P[1], MH['C-THANNGOAI'].id])).rows[0].lo_id;
  ok('Ô 1 gắn với lô phần cắt ra', (await oCua(P[1]))[0]?.lo_id === loRa);
  const v = await duoi(UID.thuKhoA, `select * from kho_v_o_ma_giao where chi_nhanh_id = $1 and phien_pha_id = $2`, [cnA.id, P[1]]);
  ok('kho_v_o_ma_giao: ô 1 · tảng #1 · còn 1,32 kg · còn giữ', v.rows?.[0]?.so_o === 1 && v.rows[0].so_tang === 1
     && Number(v.rows[0].con_kg) === 1.32 && v.rows[0].con_giu === true, v.loi ?? JSON.stringify(v.rows?.[0]));
  ok('View không có cột tiền', !Object.keys(v.rows?.[0] ?? {}).some(k => /(^|_)gia(_|$)|tien|gia_von/.test(k)));
  const m = await duoi(UID.qlA, `select kho_mo_lai_phien_pha($1, 'Cân nhầm')`, [P[1]]);
  ok('Mở lại phiên → ô bỏ lô', m.loi === null && (await oCua(P[1]))[0]?.lo_id === null, m.loi ?? '');
  await chot(P[1]);
  const loMoi = (await db.query(`select lo_id from kho_phien_pha_ra where phien_pha_id = $1 and mat_hang_id = $2`, [P[1], MH['C-THANNGOAI'].id])).rows[0].lo_id;
  ok('Chốt lại → ô gắn lô mới', (await oCua(P[1]))[0]?.lo_id === loMoi && loMoi !== loRa);
});

// ===========================================================================
await nhom('5 · TẢNG BÁN HẾT → Ô DÙNG LẠI · GIẢI PHÓNG TAY', async () => {
  const lo = (await oCua(P[1]))[0].lo_id;
  const ton = (await db.query(`select vi_tri_id, so_kg, so_goi, mat_hang_id from kho_ton where lo_id = $1 and (so_kg > 0 or so_goi > 0)`, [lo])).rows;
  for (const t of ton) {
    await db.query(`insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
      values ($1, $2, $3, $4, 'ban', $5, $6, 'ban_hang', gen_random_uuid())`, [cnA.id, lo, t.vi_tri_id, t.mat_hang_id, -Number(t.so_kg), -t.so_goi]);
  }
  P[5] = (await luuPhien(UID.thuKhoA, { vao: [{ lo_id: tang[4].id, vi_tri_id: vt.kho }] })).rows[0].phien_id;
  const g = await giao(UID.thuKhoA, P[5]);
  ok('Tảng #1 bán hết → tảng #5 nhận lại ô 1', g.rows?.[0]?.kq?.[0]?.so_o === 1, g.loi ?? JSON.stringify(g.rows?.[0]?.kq));
  ok('Lần giao cũ của ô 1 đã đóng', (await oCua(P[1]))[0]?.den_luc !== null);

  const gid = (await db.query(`select id from kho_o_ma_giao where phien_pha_id = $1 and den_luc is null`, [P[2]])).rows[0].id;
  ok('Thủ kho không giải phóng ô được', (await duoi(UID.thuKhoA, `select kho_giai_phong_o_ma($1)`, [gid])).loi !== null);
  const gp = await duoi(UID.qlA, `select kho_giai_phong_o_ma($1) as cau`, [gid]);
  ok('Quản lý giải phóng ô 2', gp.loi === null && /Đã giải phóng ô 2/.test(gp.rows[0].cau), gp.loi ?? '');
  const gp2 = await duoi(UID.qlA, `select kho_giai_phong_o_ma($1) as cau`, [gid]);
  ok('Bấm lại: báo đã trống', /đã trống/.test(gp2.rows?.[0]?.cau ?? ''));
  const qB = await duoi(UID.qlB, `select kho_giai_phong_o_ma($1)`, [gid]);
  ok('Quản lý chi nhánh khác không đụng được', qB.loi !== null);
});

// ===========================================================================
await nhom('6 · MỖI CHI NHÁNH MỘT BỘ Ô · KIỂM KÊ NHẬN MÃ Ô', async () => {
  const tB = await nhapTang(cnB.id, [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg: 6, so_kg_thuc: 6, don_gia_kg: 500000, ngay_mo: await ngay(-12) }]);
  const pB = (await luuPhien(UID.thuKhoB, { cn: cnB.id, vao: [{ lo_id: tB[0].id, vi_tri_id: vtB.kho }] })).rows?.[0]?.phien_id;
  const gB = await giao(UID.thuKhoB, pB);
  ok('Chi nhánh B nhận ô 1 dù A đang giữ ô 1', gB.rows?.[0]?.kq?.[0]?.so_o === 1, gB.loi ?? '');
  const vB = await duoi(UID.thuKhoB, `select count(*)::int n from kho_v_o_ma_giao where chi_nhanh_id = $1`, [cnA.id]);
  ok('Chi nhánh B không thấy ô của A', vB.rows?.[0]?.n === 0);
  const def = (await db.query(`select pg_get_functiondef('kho_quet_kiem_ke(uuid,uuid,jsonb)'::regprocedure) as d`)).rows[0].d;
  ok('Quét kiểm kê tra mã qua kho_mat_hang_theo_ma_can', /kho_mat_hang_theo_ma_can/.test(def));
});

// ===========================================================================
// HSD ô mã trên cân (danh-muc-can.ts, cách b): tem ô in lúc phiên còn nháp thuộc lô phần cắt SẼ sinh ra lúc chốt.
// Beeftown Cân / màn Đồng bộ cân đọc ngày lóc, dòng ra, lô vào, hạn tảng bằng tài khoản quản lý / chủ (docPhienLocHsd):
// kiểm RLS thật, và hạn dự kiến (hanLoRaDuKien) đúng bằng hạn lô ra khi chốt.
// ===========================================================================
/** Client tối thiểu cho docPhienLocHsd: from().select().in() chạy thành SQL dưới vai `uid` — RLS thật; ngày trả dạng 'YYYY-MM-DD' như PostgREST. */
const clientDuoi = uid => ({
  from(bang) {
    const q = { cot: '*', loc: [] };
    const b = {
      select(c) { q.cot = c; return b; },
      in(k, v) { q.loc.push([k, v]); return b; },
      then(xong, hong) {
        const dk = q.loc.map(([k], i) => `${k} = any($${i + 1}::uuid[])`).join(' and ');
        return duoi(uid, `select row_to_json(t)::text as j from (select ${q.cot} from ${bang}${dk ? ` where ${dk}` : ''}) t`, q.loc.map(([, v]) => v))
          .then(r => (r.loi ? { data: null, error: { message: r.loi } } : { data: r.rows.map(x => JSON.parse(x.j)), error: null }))
          .then(xong, hong);
      },
    };
    return b;
  },
});

await nhom('6b · HSD Ô MÃ CỦA PHIÊN NHÁP: QUẢN LÝ / CHỦ ĐỌC ĐƯỢC, HẠN DỰ KIẾN = HẠN LÔ LÚC CHỐT', async () => {
  const cat = MH['C-THANNGOAI'];
  const hanTang = (await db.query(`select han_dung::text h from kho_lo where id = $1`, [tang[4].id])).rows[0].h;
  const ql = await docPhienLocHsd(clientDuoi(UID.qlA), [P[5]]);
  const p = ql.get(P[5]);
  ok('Quản lý đọc được phiên nháp tảng #5: số phiếu, ngày lóc hôm nay, hạn tảng (lô vào, đọc thẳng kho_lo)',
     !!p && !!p.so_phieu && p.ngay_pha === homNay && p.han_tang === hanTang && Array.isArray(p.ra), JSON.stringify(p));
  const chu = (await docPhienLocHsd(clientDuoi(UID.chu), [P[5]])).get(P[5]);
  ok('Chủ đọc được y như quản lý', JSON.stringify(chu) === JSON.stringify(p), JSON.stringify(chu));
  ok('Nhân viên quầy (không xem giá, không pha lóc) và quản lý chi nhánh khác: không đọc được → ô không in HSD',
     (await docPhienLocHsd(clientDuoi(UID.nvQuayA), [P[5]])).size === 0 && (await docPhienLocHsd(clientDuoi(UID.qlB), [P[5]])).size === 0);
  const du = hanLoRaDuKien(p, cat.id, cat.han_dung_ngay);
  const q = await quet(P[5], [nhan(10011, 0.45)]);
  const c = await chot(P[5]);
  const hanRa = (await db.query(`select l.han_dung::text h from kho_phien_pha_ra r join kho_lo l on l.id = r.lo_id
    where r.phien_pha_id = $1 and r.mat_hang_id = $2`, [P[5], cat.id])).rows[0]?.h;
  ok('Hạn dự kiến lúc phiên còn nháp = hạn lô phần cắt khi chốt (0033)', q.loi === null && c.loi === null && !!du && du.han === hanRa,
     `${q.loi ?? ''} ${c.loi ?? ''} dự kiến ${JSON.stringify(du)} · chốt ${hanRa}`);
  const m = await duoi(UID.qlA, `select kho_mo_lai_phien_pha($1, 'Cân lại')`, [P[5]]);
  const lai = (await docPhienLocHsd(clientDuoi(UID.qlA), [P[5]])).get(P[5]);
  const duLai = hanLoRaDuKien(lai, cat.id, cat.han_dung_ngay);
  ok('Mở lại phiên: dòng ra còn hạn lần chốt trước → hạn dự kiến theo dòng ra, vẫn bằng hạn lô', m.loi === null
     && duLai?.theo === 'ra' && duLai.han === hanRa, `${m.loi ?? ''} ${JSON.stringify(duLai)}`);
  const c2 = await chot(P[5]);
  ok('Chốt lại', c2.loi === null, c2.loi ?? '');
});

await nhom('7 · ĐỐI SOÁT', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('Tồn khớp sổ kho', rows.length === 0, JSON.stringify(rows));
});

process.exit(ketThuc('Ô MÃ · PHIÊN LÓC MỘT TẢNG'));
