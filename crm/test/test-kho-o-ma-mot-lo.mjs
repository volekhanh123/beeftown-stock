/**
 * BEEFTOWN KHO — Kiểm thử: một ô mã chỉ về MỘT lô, đúng lô có khay mang nhãn
 * ==========================================================================
 *
 *     node test/test-kho-o-ma-mot-lo.mjs
 *
 * LỖI ĐÃ XẢY RA (rà soát độc lập 12/10/2026, trước khi mở PR soát luồng 6 bước): phiên lóc một
 * tảng gõ tay HAI dòng ra cho cùng một phần cắt đang giữ ô mã — "4 khay → Quầy" và "0,5 kg →
 * chuyển thẳng bếp" — thì chốt phiên sinh HAI lô, mà ô chỉ nhớ được một lô: lô của dòng chốt
 * sau cùng (trigger kho_phien_pha_ra_o_ma, 0049). Ô rơi vào lô chuyển bếp (đã xuất hết ngay) →
 * sổ coi ô "trống" trong khi 4 khay dán nhãn mã ô đó còn nằm ở quầy → tảng sau lấy lại đúng ô
 * đó → quét khay của tảng #1 thì phiếu (và hóa đơn iPOS) trừ nhầm lô của tảng #2.
 *
 * Bất biến:
 *   1. Ô theo lô NHẬP KHO của phần cắt (lô có khay mang nhãn), không theo lô chuyển thẳng bếp —
 *      dù dòng nào chốt trước.
 *   2. Ô còn khay trên sổ thì không bị giao lại cho tảng sau.
 *   3. Quét nhãn mã ô ở quầy → phiếu trừ đúng lô của tảng đó; hóa đơn iPOS cũng tìm đúng lô đó.
 *   4. Hai dòng NHẬP KHO của cùng một phần cắt đang giữ ô (hai lô, một ô) → chốt bị từ chối, câu
 *      nói rõ phải làm gì, không ghi gì vào sổ. Gộp thành một dòng thì chốt được.
 *   5. Phiên không giao ô mã: hai dòng nhập kho vẫn chốt được như trước.
 *   6. Mở lại phiên → ô bỏ lô; chốt lại → ô về lô mới. Chốt hai lần không đổi gì.
 *   7. kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, taoClientPg, UID, maGui } from './kho-chung.mjs';
import { tinhSoKiemTra } from '../../web/src/lib/kho/ma-vach.ts';
import * as XUAT from '../../web/src/lib/kho/xuat.ts';
import * as O_MA from '../../web/src/lib/kho/o-ma.ts';
import { docCaiDat, docMatHang } from '../../web/src/lib/kho/danh-muc.ts';
import { docTon } from '../../web/src/lib/kho/ton.ts';
import { dichCau } from '../../web/src/lib/cau-noi-bo.ts';
import { VIET } from './quet-chu-viet.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — MỘT Ô MÃ, MỘT LÔ CÓ KHAY MANG NHÃN');

/** Nhãn cân EAN-13 theo mẫu mặc định 2XCCCCCWWWWWK (gram). */
const nhan = (maCan, gram) => {
  const s12 = `20${String(maCan).padStart(5, '0')}${String(gram).padStart(5, '0')}`;
  return s12 + tinhSoKiemTra(s12);
};

const { db, cnA, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });
const chay = async (uid, sql, gt = []) => { const r = await duoi(uid, sql, gt); if (r.loi) throw new Error(`${sql.slice(0, 70)}… → ${r.loi}`); return r.rows; };
const thu = async (uid, sql, gt = []) => { const r = await duoi(uid, sql, gt); return r.loi ?? null; };

const MH = {};
let vt = {};
let homNay = '';
let tang = [];

/** Dòng kho_v_o_ma_giao của một mã ô (ô đang giao) — null khi ô đang trống. */
const oDangGiao = async maCan => (await db.query(
  `select v.*, o.id as o_id from kho_v_o_ma_giao v join kho_o_ma o on o.id = v.o_ma_id where v.ma_can = $1 and v.chi_nhanh_id = $2`,
  [maCan, cnA.id])).rows[0] ?? null;
const tonLo = async (lo, viTri) => (await db.query(
  `select coalesce(sum(so_goi), 0)::int as g from kho_ton where lo_id = $1 and vi_tri_id = $2`, [lo, viTri])).rows[0].g;
const loRa = async (phien, xuLy) => (await db.query(
  `select r.lo_id, r.vi_tri_id from kho_phien_pha_ra r where r.phien_pha_id = $1 and r.xu_ly = $2 order by r.thu_tu`, [phien, xuLy])).rows;

/** Mở phiên lóc một tảng (chưa có dòng ra). */
const moPhien = async (loTang, matHangVao = MH['T-THANNGOAI'].id) => (await chay(UID.thuKhoA, `
  select * from kho_luu_phien_pha(p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
    p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date, p_ghi_chu => null, p_vao => $5::jsonb, p_ra => '[]'::jsonb)`,
  [cnA.id, maGui(), matHangVao, homNay, JSON.stringify([{ lo_id: loTang.id, vi_tri_id: vt.kho }])]))[0].phien_id;
const phienBan = async phien => (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [phien])).rows[0].phien_ban;
/** Lưu các dòng ra gõ tay của phiên. Trả câu lỗi (null = lưu được). */
const luuRa = async (phien, loTang, ra, matHangVao = MH['T-THANNGOAI'].id) => thu(UID.thuKhoA, `
  select * from kho_luu_phien_pha(p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
    p_mat_hang_vao_id => $5, p_cong_thuc_id => null, p_ngay_pha => $6::date, p_ghi_chu => null, p_vao => $7::jsonb, p_ra => $8::jsonb)`,
  [phien, cnA.id, maGui(), await phienBan(phien), matHangVao, homNay,
   JSON.stringify([{ lo_id: loTang.id, vi_tri_id: vt.kho }]), JSON.stringify(ra)]);
const chot = async phien => thu(UID.thuKhoA, `select kho_chot_phien_pha($1, $2)`, [phien, await phienBan(phien)]);
const giaoO = async phien => (await chay(UID.thuKhoA, `select kho_giao_o_ma($1, null) as kq`, [phien]))[0].kq;

const raQuay = (khay, kg) => ({ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: kg, so_goi: khay, xu_ly: 'nhap_kho', vi_tri_id: vt.quay });
const raKho = (khay, kg) => ({ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: kg, so_goi: khay, xu_ly: 'nhap_kho', vi_tri_id: vt.kho });
const raBep = kg => ({ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: kg, xu_ly: 'chuyen_bep' });

// ===========================================================================
await nhom('0 · DỰNG: 5 tảng thăn ngoại theo tảng, phần cắt có 3 ô mã', async () => {
  await chay(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await chay(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
  const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

  await chay(UID.qlA, `update kho_mat_hang set theo_tang = true where ma = 'T-THANNGOAI'`);
  MH['T-THANNGOAI'].theo_tang = true;
  await chay(UID.qlA, `update kho_mat_hang set ma_can = '301', gia_ban_kg = 900000, don_vi_goi = 'khay' where ma = 'C-THANNGOAI'`);
  await chay(UID.qlA, `insert into kho_o_ma (mat_hang_id, so_o, ma_can) values ($1, 1, '10011'), ($1, 2, '10012'), ($1, 3, '10013')`, [MH['C-THANNGOAI'].id]);
  const ct = (await chay(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Thăn ngoại') returning id`, [MH['T-THANNGOAI'].id]))[0].id;
  await chay(UID.qlA, `insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien) values ($1, $2, 70)`, [ct, MH['C-THANNGOAI'].id]);
  const ncc = (await chay(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Úc') returning id`))[0].id;
  const ngayMo = await ngay(-14);
  const nhapHang = async (maMon, soDong) => {
    const pn = (await chay(UID.qlA, `
      select * from kho_luu_phieu_nhap(
        p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null, p_loai => 'mua', p_nha_cung_cap_id => $3,
        p_vi_tri_id => $4, p_ngay_nhap => $5::date, p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
        p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
        p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
      [cnA.id, maGui(), ncc, vt.kho, await ngay(-10), JSON.stringify(Array.from({ length: soDong }, (_, i) => (
        { mat_hang_id: MH[maMon].id, so_kg: 6 + i / 10, so_kg_thuc: 6 + i / 10, don_gia_kg: 500000,
          ...(MH[maMon].theo_tang ? { ngay_mo: ngayMo } : { so_goi: 1 }) })))]))[0];
    await chay(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [pn.phieu_id, pn.phien_ban_moi]);
    await chay(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [pn.phieu_id]);
    return (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
      where d.phieu_nhap_id = $1 order by d.thu_tu`, [pn.phieu_id])).rows;
  };
  tang = await nhapHang('T-THANNGOAI', 5);
  tang.thanNoi = (await nhapHang('T-THANNOI', 1))[0];
  ok('5 tảng thăn ngoại #1–#5 đã vào kho lạnh', tang.map(t => t.so_tang).join() === '1,2,3,4,5', tang.map(t => t.so_tang).join());
});

// ===========================================================================
let lo1Quay = null, lo2Quay = null, ph2 = null;
await nhom('1 · Ô THEO LÔ NHẬP KHO, KHÔNG THEO LÔ CHUYỂN THẲNG BẾP', async () => {
  // Tảng #1: dòng ra quầy TRƯỚC, dòng chuyển thẳng bếp SAU (bản cũ: ô về lô chuyển bếp).
  const ph1 = await moPhien(tang[0]);
  const o1 = await giaoO(ph1);
  ok('Tảng #1 nhận ô 1 (mã 10011)', o1.length === 1 && o1[0].ma_can === '10011', JSON.stringify(o1));
  const luu1 = await luuRa(ph1, tang[0], [raQuay(4, 1.2), raBep(0.5)]);
  ok('Lưu nháp hai dòng của cùng phần cắt (4 khay → Quầy · 0,5 kg → chuyển thẳng bếp): được', luu1 === null, luu1);
  const chot1 = await chot(ph1);
  ok('Chốt phiên tảng #1: được', chot1 === null, chot1);
  lo1Quay = (await loRa(ph1, 'nhap_kho'))[0]?.lo_id;
  const lo1Bep = (await loRa(ph1, 'chuyen_bep'))[0]?.lo_id;
  ok('Phiên sinh hai lô: lô ở quầy còn 4 khay, lô chuyển bếp đã xuất hết',
     !!lo1Quay && !!lo1Bep && lo1Quay !== lo1Bep && await tonLo(lo1Quay, vt.quay) === 4
     && (await db.query(`select count(*)::int as n from kho_ton where lo_id = $1 and (so_kg > 0 or so_goi > 0)`, [lo1Bep])).rows[0].n === 0);
  const g1 = await oDangGiao('10011');
  ok('HỒI QUY: ô 1 về lô Ở QUẦY của tảng #1 (không về lô chuyển bếp đã xuất hết)', g1?.lo_id === lo1Quay, JSON.stringify({ o: g1?.lo_id, quay: lo1Quay, bep: lo1Bep }));
  ok('HỒI QUY: ô 1 còn giữ, sổ ghi còn 4 khay của tảng #1', g1?.con_giu === true && Number(g1?.con_goi) === 4 && g1?.so_tang === 1, JSON.stringify(g1));
  const loIpos = (await db.query(`select kho_ipos_lo_cua_o($1, $2, now()) as lo`, [cnA.id, g1?.o_id])).rows[0].lo;
  ok('HỒI QUY: hóa đơn iPOS bán bằng mã ô 10011 lúc này tìm đúng lô ở quầy của tảng #1', loIpos === lo1Quay, String(loIpos));

  // Tảng #2: dòng chuyển thẳng bếp TRƯỚC, dòng ra quầy SAU — thứ tự không được đổi kết quả.
  ph2 = await moPhien(tang[1]);
  const o2 = await giaoO(ph2);
  ok('HỒI QUY: tảng #2 nhận ô 2 (10012) — ô 1 còn khay của tảng #1 nên không bị giao lại', o2.length === 1 && o2[0].ma_can === '10012', JSON.stringify(o2));
  ok('… và ô 1 vẫn là của tảng #1', (await oDangGiao('10011'))?.so_tang === 1);
  ok('Lưu nháp (0,4 kg → chuyển thẳng bếp · 8 khay → Quầy): được', await luuRa(ph2, tang[1], [raBep(0.4), raQuay(8, 2.4)]) === null);
  ok('Chốt phiên tảng #2: được', await chot(ph2) === null);
  lo2Quay = (await loRa(ph2, 'nhap_kho'))[0]?.lo_id;
  const g2 = await oDangGiao('10012');
  ok('Ô 2 về lô ở quầy của tảng #2, còn 8 khay — dòng chuyển bếp đứng trước hay sau cũng vậy',
     g2?.lo_id === lo2Quay && Number(g2?.con_goi) === 8 && g2?.con_giu === true && g2?.so_tang === 2, JSON.stringify(g2));

  // Phần cắt CHỈ chuyển thẳng bếp (không khay nào ra quầy): ô không gắn lô nào, tảng sau dùng lại được ô đó.
  const ph3 = await moPhien(tang[2]);
  const o3 = await giaoO(ph3);
  ok('Tảng #3 nhận ô 3 (10013)', o3[0]?.ma_can === '10013', JSON.stringify(o3));
  ok('Lưu và chốt phiên tảng #3 chỉ có dòng chuyển thẳng bếp: được', await luuRa(ph3, tang[2], [raBep(1.1)]) === null && await chot(ph3) === null);
  const g3 = await oDangGiao('10013');
  ok('Ô 3 không gắn lô nào và không còn giữ (không khay nào mang nhãn ô 3 ra quầy)', g3?.lo_id == null && g3?.con_giu === false, JSON.stringify(g3));
});

// ===========================================================================
await nhom('2 · QUÉT NHÃN MÃ Ô Ở QUẦY → PHIẾU TRỪ ĐÚNG LÔ CỦA TẢNG TRÊN NHÃN', async () => {
  const nv = clientCua(UID.nvQuayA);
  const [matHang, caiDat, ton, maNhan, giao] = await Promise.all([
    docMatHang(nv), docCaiDat(nv, cnA.id), docTon(nv, cnA.id), O_MA.docMaTrenNhan(nv), O_MA.docGiaoOMaCan(nv, cnA.id),
  ]);
  const q = XUAT.dongTuQuet(nhan(10011, 300), matHang, caiDat.mau_ma_vach, caiDat.so_le_kg,
    { maNhan, datLo: { giao, lo: ton.filter(t => t.vi_tri_id === vt.quay), tenNoiLay: 'Quầy thịt', chiConHan: true, dong: [], theoLo: [] } });
  ok('HỒI QUY: quét khay 10011 lấy từ Quầy → một dòng LÔ đúng lô ở quầy của tảng #1, không câu "sổ không còn khay nào"',
     q.dong.length === 0 && q.theoLo?.length === 1 && q.theoLo[0].lo_id === lo1Quay && q.loi.length === 0, JSON.stringify({ dong: q.dong, theoLo: q.theoLo, loi: q.loi }));
  ok('Câu báo gọi đúng tảng #0001', /#0001/.test(q.cauDatLo?.vi ?? '') && !/#0002/.test(q.cauDatLo?.vi ?? ''), q.cauDatLo?.vi);

  const f = new FormData();
  f.set('ma_gui', maGui());
  f.set('so_dong', String(q.dong.length));
  q.dong.forEach((d, i) => { f.set(`d${i}_mat_hang`, d.mat_hang_id); f.set(`d${i}_so_goi`, d.so_goi); f.set(`d${i}_so_kg`, d.so_kg); });
  f.set('so_lo', String((q.theoLo ?? []).length));
  (q.theoLo ?? []).forEach((l, i) => { f.set(`l${i}_lo`, l.lo_id); f.set(`l${i}_mat_hang`, l.mat_hang_id); f.set(`l${i}_so_goi`, l.so_goi); f.set(`l${i}_so_kg`, l.so_kg); });
  const kq = await XUAT.taoPhieuXuat(nv, cnA.id, f, { loai: 'xuat_bep', viTriId: vt.quay, matHang });
  const so = kq.id ? (await db.query(`select lo_id, so_goi from kho_so_cai where chung_tu_id = $1`, [kq.id])).rows : [];
  ok('HỒI QUY: phiếu xuất bếp trừ đúng lô của tảng #1 (4 → 3 khay); lô của tảng #2 còn nguyên 8 khay',
     kq.ok && so.length === 1 && so[0].lo_id === lo1Quay && await tonLo(lo1Quay, vt.quay) === 3 && await tonLo(lo2Quay, vt.quay) === 8,
     `${kq.cau} · ${JSON.stringify(so)}`);
});

// ===========================================================================
await nhom('3 · HAI DÒNG NHẬP KHO CỦA CÙNG PHẦN CẮT ĐANG GIỮ Ô → CHỐT BỊ TỪ CHỐI, KHÔNG GHI GÌ', async () => {
  const ph = await moPhien(tang[3]);
  const o = await giaoO(ph);
  ok('Tảng #4 nhận lại ô 3 (10013) — ô của tảng #3 không còn khay nào nên dùng lại được', o[0]?.ma_can === '10013', JSON.stringify(o));
  ok('Lưu nháp hai dòng nhập kho (4 khay → Quầy · 6 khay → Kho lạnh): được (chưa đụng sổ)', await luuRa(ph, tang[3], [raQuay(4, 1.2), raKho(6, 1.8)]) === null);
  const soTruoc = (await db.query(`select count(*)::int as n from kho_so_cai`)).rows[0].n;
  const loi = await chot(ph);
  ok('HỒI QUY: chốt bị từ chối — câu nói tên món, số ô và phải làm gì',
     /"Thăn ngoại cắt lát" đang giữ ô 3 \(mã 10013\)/.test(loi ?? '') && /một dòng nhập kho/.test(loi ?? '') && /gộp/.test(loi ?? ''), String(loi));
  const en = dichCau('en', loi ?? '');
  ok('Câu đó có bản tiếng Anh, không lẫn chữ Việt', en !== loi && /slot 3 \(code 10013\)/.test(en) && !VIET.test(en.replace(/Thăn ngoại cắt lát/g, '')), en);
  const sau = (await db.query(`select trang_thai from kho_phien_pha where id = $1`, [ph])).rows[0];
  ok('Không ghi gì: phiên vẫn nháp, sổ kho không thêm dòng nào, tảng #4 còn nguyên, ô 3 chưa gắn lô',
     sau.trang_thai === 'nhap' && (await db.query(`select count(*)::int as n from kho_so_cai`)).rows[0].n === soTruoc
     && (await db.query(`select so_kg from kho_ton where lo_id = $1`, [tang[3].id])).rows[0]?.so_kg == 6.3
     && (await oDangGiao('10013'))?.lo_id == null, JSON.stringify(sau));
  ok('Gộp thành một dòng (10 khay → Kho lạnh) rồi chốt: được', await luuRa(ph, tang[3], [raKho(10, 3)]) === null && await chot(ph) === null);
  const g = await oDangGiao('10013');
  const lo = (await loRa(ph, 'nhap_kho'))[0]?.lo_id;
  ok('Ô 3 về đúng lô đó, còn 10 khay của tảng #4', g?.lo_id === lo && Number(g?.con_goi) === 10 && g?.so_tang === 4, JSON.stringify(g));
  const lai = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2) as c`, [ph, await phienBan(ph)]);
  ok('Bấm chốt lần hai: báo đã chốt từ trước, ô và tồn không đổi',
     /đã được chốt trước đó/.test(lai.rows?.[0]?.c ?? '') && (await oDangGiao('10013'))?.lo_id === lo && await tonLo(lo, vt.kho) === 10, JSON.stringify(lai.rows ?? lai.loi));
});

// ===========================================================================
await nhom('4 · PHIÊN KHÔNG GIAO Ô MÃ: HAI DÒNG NHẬP KHO VẪN CHỐT ĐƯỢC NHƯ TRƯỚC', async () => {
  // Tảng theo dõi theo tảng nhưng phiên không bấm "Giao ô mã" (tem in bằng mã của món, hạn gần lấy trước).
  const ph = await moPhien(tang[4]);
  ok('Tảng #5 không giao ô: lưu và chốt hai dòng nhập kho (2 khay → Quầy · 3 khay → Kho lạnh) được',
     await luuRa(ph, tang[4], [raQuay(2, 0.6), raKho(3, 0.9)]) === null && await chot(ph) === null);
  ok('… sinh hai lô như trước', (await loRa(ph, 'nhap_kho')).filter(r => r.lo_id).length === 2);
  // Món không theo dõi theo tảng.
  const phN = await moPhien(tang.thanNoi, MH['T-THANNOI'].id);
  const raN = (khay, kg, viTri) => ({ mat_hang_id: MH['C-THANNOI'].id, so_kg: kg, so_goi: khay, xu_ly: 'nhap_kho', vi_tri_id: viTri });
  ok('Thăn nội (không theo tảng, không ô mã): hai dòng nhập kho chốt được',
     await luuRa(phN, tang.thanNoi, [raN(2, 0.5, vt.quay), raN(3, 0.8, vt.kho)], MH['T-THANNOI'].id) === null && await chot(phN) === null);
});

// ===========================================================================
await nhom('5 · MỞ LẠI PHIÊN → Ô BỎ LÔ · CHỐT LẠI → Ô VỀ LÔ MỚI', async () => {
  const mo = await thu(UID.thuKhoA, `select kho_mo_lai_phien_pha($1, 'gõ nhầm số khay')`, [ph2]);
  ok('Mở lại phiên tảng #2 (lô chưa dùng): được', mo === null, mo);
  const g = await oDangGiao('10012');
  ok('Ô 2 bỏ lô, vẫn giữ cho phiên đang mở lại', g?.lo_id == null && g?.con_giu === true && g?.so_tang === 2, JSON.stringify(g));
  ok('Sửa thành 7 khay → Quầy · 0,4 kg → chuyển thẳng bếp rồi chốt lại: được', await luuRa(ph2, tang[1], [raQuay(7, 2.1), raBep(0.4)]) === null && await chot(ph2) === null);
  const loMoi = (await loRa(ph2, 'nhap_kho'))[0]?.lo_id;
  const g2 = await oDangGiao('10012');
  ok('Ô 2 về lô MỚI ở quầy, còn 7 khay; lô cũ không còn tồn',
     !!loMoi && loMoi !== lo2Quay && g2?.lo_id === loMoi && Number(g2?.con_goi) === 7 && await tonLo(lo2Quay, vt.quay) === 0, JSON.stringify(g2));
});

// ===========================================================================
await nhom('6 · QUYỀN VÀ SỔ', async () => {
  const quyen = (await db.query(`select has_function_privilege('authenticated', 'kho_phien_pha_ra_o_ma()', 'execute') as a,
                                        has_function_privilege('anon', 'kho_phien_pha_ra_o_ma()', 'execute') as b`)).rows[0];
  ok('Hàm trigger kho_phien_pha_ra_o_ma vẫn là hàm nội bộ: authenticated và anon không gọi thẳng được', quyen.a === false && quyen.b === false, JSON.stringify(quyen));
  const dn = (await db.query(`select prosecdef, proconfig from pg_proc where proname = 'kho_phien_pha_ra_o_ma'`)).rows[0];
  ok('… vẫn security definer, có set search_path', dn.prosecdef === true && (dn.proconfig ?? []).some(c => /^search_path=/.test(c)), JSON.stringify(dn));
  const nvChot = await thu(UID.nvQuayA, `select kho_chot_phien_pha($1, 1)`, [ph2]);
  ok('NV quầy không chốt được phiên lóc (quyền không đổi)', /không được chốt/.test(nvChot ?? ''), String(nvChot));
  const ds = (await db.query(`select * from kho_doi_soat_ton()`)).rows;
  ok('kho_doi_soat_ton() rỗng sau mọi phiên', ds.length === 0, JSON.stringify(ds));
});

process.exit(ketThuc('MỘT Ô MÃ, MỘT LÔ CÓ KHAY MANG NHÃN'));
