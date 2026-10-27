/**
 * BEEFTOWN KHO — Bán qua iPOS trừ ĐÚNG kg trên tem, không hao hụt theo kg trung bình (0104)
 * ========================================================================================
 *
 *     node test/test-kho-ipos-tru-kg.mjs
 *
 * Khánh chốt 27/10/2026: hao hụt ghi ở lúc nhập / trim / pha lóc — không ở lúc bán. Khi cắt, mỗi khay đặt
 * lên cân, in tem, quét tem vào phiên pha lóc (từng khay một dòng kho_phien_pha_quet). Bán khay đó trên FABi
 * (webhook iPOS DW: quantity = kg trên tem) thì kho trừ 1 khay và ĐÚNG kg đó. Trước 0104 kho trừ theo kg trung
 * bình của gói trong lô và ghi phần chênh vào hao hụt ở MỖI lần bán (thử thật: tem 0,24 kg, lô 0,5 kg/gói →
 * "hao hụt" 0,26 kg). Phải đúng:
 *   · khay quét lúc cắt = tem lúc bán → không một dòng hao hụt nào, lô về đúng 0 gói 0 kg;
 *   · kg bán đúng bằng tem một khay đã quét → đúng 1 khay, kể cả khay nặng gấp rưỡi trung bình
 *     (kho_ipos_mot_khay_quet); FABi gộp hai tem một dòng → số khay có tổng kg gần nhất như cũ;
 *   · lô gõ tay tổng kg (không quét từng khay): các lần bán giữa chừng không hao hụt; chỉ gói CUỐI của lô ghi
 *     một dòng "chênh lệch cân" để lô về đúng 0;
 *   · kg bán vượt kg còn lại của lô → một dòng chênh lệch, không âm kho, gói còn lại không thành 0 kg;
 *   · hủy hóa đơn → trả lại đúng khay và đúng kg đã trừ, kể cả hóa đơn có dòng chênh lệch;
 *   · báo cáo hao hụt tách "Chênh lệch cân lúc bán (iPOS) — thiếu" / "— thừa" theo dấu dòng gốc;
 *   · kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui, UID_MAY_IPOS, themMayIpos } from './kho-chung.mjs';
import { phanTichHoaDon } from '../../web/src/lib/kho/ipos.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — iPOS TRỪ ĐÚNG KG TRÊN TEM');
const { db, cnA, cnB, duoi } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const TU_LUC = new Date(Date.now() - 3 * 86400000).toISOString();

const MH = {};
let vt = {};

/** Nhãn cân EAN-13 theo mẫu mặc định 2XCCCCCWWWWWK. */
function nhan(maCan, kg) {
  const s = '20' + String(maCan).padStart(5, '0') + String(Math.round(kg * 1000)).padStart(5, '0');
  let t = 0;
  for (let i = 0; i < 12; i++) t += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  return s + ((10 - t % 10) % 10);
}

async function nhapTonDau(dong, viTri) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'ton_dau', p_nha_cung_cap_id => null, p_vi_tri_id => $3, p_ngay_nhap => $4::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => '{}'::text[],
      p_truong_them => '{}'::jsonb, p_dong => $5::jsonb)`,
    [cnA.id, maGui(), viTri, homNay, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  for (const [sql, ts] of [[`select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]],
                           [`select kho_duyet_phieu_nhap($1)`, [p.phieu_id]]]) {
    const r = await duoi(UID.qlA, sql, ts);
    if (r.loi) throw new Error(r.loi);
  }
  return (await db.query(`select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id])).rows;
}

/** Pha lóc một tảng: đầu ra quét nhãn từng khay (nhan) hoặc gõ tay (ra). Trả lô ra của món cut. */
async function phaLoc(loTang, { nhanKhay = [], ra = [] }) {
  const luu = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date,
      p_ghi_chu => null, p_vao => $5::jsonb, p_ra => $6::jsonb)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay, JSON.stringify([{ lo_id: loTang.id, vi_tri_id: vt.kho }]),
     JSON.stringify(ra)]);
  if (luu.loi) throw new Error(luu.loi);
  const id = luu.rows[0].phien_id;
  if (nhanKhay.length) {
    const q = await duoi(UID.thuKhoA, `select kho_quet_phien_pha(p_id => $1, p_ma_gui => $2, p_ma => $3::jsonb) as kq`,
      [id, maGui(), JSON.stringify(nhanKhay)]);
    if (q.loi) throw new Error(q.loi);
  }
  const pb = (await db.query(`select phien_ban from kho_phien_pha where id = $1`, [id])).rows[0].phien_ban;
  const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2)`, [id, pb]);
  if (c.loi) throw new Error(c.loi);
  return (await db.query(`select r.lo_id from kho_phien_pha_ra r where r.phien_pha_id = $1 and r.mat_hang_id = $2`,
    [id, MH['C-THANNGOAI'].id])).rows[0].lo_id;
}

const tonLo = async lo => {
  const r = (await db.query(`select coalesce(sum(so_goi), 0)::int goi, coalesce(sum(so_kg), 0) kg from kho_ton
    where lo_id = $1 and vi_tri_id = $2`, [lo, vt.quay])).rows[0];
  return { goi: r.goi, kg: Number(r.kg) };
};

// ---- Hóa đơn iPOS DW đúng dạng FABi gửi thật, qua bộ đọc của web ------------------------------------------
let soHd = 0;
function gioFabi(phutTruoc) {
  const vn = new Date(Date.now() - phutTruoc * 60000 + 7 * 3600000);
  return { ngay: Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) / 1000 - 7 * 3600,
           gio: vn.getUTCHours(), phut: vn.getUTCMinutes() };
}
function hoaDonFabi(kg, { saleId, datastate = 0 } = {}) {
  soHd += 1;
  const id = saleId ?? `SALE-TRU-KG-${soHd}`;
  const g = gioFabi(10);
  return {
    sale_id: id, brand_id: 'BRAND-THU', store_id: 'STORE-THU', datastate,
    sale: { sale_id: id, date_last: g.ngay, hour_last: g.gio, minute_last: g.phut },
    sale_detail: [{ sale_detail_id: `SD_${id}`, item_id: '01011', description: 'Ribeye cut', unit_id: 'KG',
                    quantity: kg, amount: Math.round(kg * 950000) }],
  };
}
/** Bán một dòng 01011 theo kg. quetNhan: dòng mang mã vạch nhãn cân (máy quét đọc tem) thay vì số lượng —
 *  kho lấy đúng 1 khay, kg trên nhãn. */
async function ban(kg, tuyChon = {}) {
  const kq = phanTichHoaDon(hoaDonFabi(kg, tuyChon));
  if (kq.loai !== 'hoa_don') throw new Error(kq.cau);
  if (tuyChon.quetNhan) {
    for (const d of kq.hoaDon.dong) { delete d.so_luong; d.ma_vach = nhan(1011, kg); }
  }
  const r = await duoi(MAY, `select kho_ipos_nhan_callback($1, $2::jsonb) as kq`, [cnA.id, JSON.stringify(kq.hoaDon)]);
  if (r.loi) throw new Error(r.loi);
  const [d] = (await db.query(`select d.* from kho_ipos_dong d join kho_ipos_hoa_don h on h.id = d.hoa_don_id
    where h.ma_hd = $1`, [kq.hoaDon.ma_hd])).rows;
  const so = (await db.query(`select * from kho_so_cai where chung_tu_loai = 'ban_hang' and chung_tu_id = $1
    order by created_at`, [d.id])).rows;
  return { d, so, ban: so.filter(s => s.loai === 'ban'), lech: so.filter(s => s.loai === 'hao_hut'), saleId: kq.hoaDon.ma_hd };
}
const tong = (ds, k) => ds.reduce((a, s) => a + Number(s[k]), 0);
async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// ===========================================================================
await nhom('1 · CHUẨN BỊ: MÃ CÂN 1011, KHAY RA QUẦY, CHUYỂN SANG TRỪ THEO iPOS', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  await db.query(`update kho_mat_hang set ma_can = '1011', gia_ban_kg = 950000, noi_de_sau_pha = 'quay' where ma = 'C-THANNGOAI'`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  const chu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb)`, [cnA.id,
    JSON.stringify({ bat: true, pos_parent: 'BRAND-THU', pos_id: 'STORE-THU', vi_tri_ban_id: vt.quay })]);
  const cs = await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, $2::timestamptz)`, [cnA.id, TU_LUC]);
  ok('Bật iPOS, trừ kho theo iPOS', chu.loi === null && cs.loi === null, chu.loi ?? cs.loi ?? '');
});

// ===========================================================================
let loQuet, loVuot, saleVuot;
await nhom('2 · CẮT CÓ QUÉT TEM TỪNG KHAY → BÁN ĐÚNG TEM ĐÓ: ĐÚNG 1 KHAY, KHÔNG HAO HỤT, LÔ VỀ ĐÚNG 0', async () => {
  const [tang] = await nhapTonDau([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 2, don_gia_kg: 600000 }], vt.kho);
  const khay = [0.24, 0.31, 0.33, 0.3];
  loQuet = await phaLoc(tang, { nhanKhay: khay.map(kg => nhan(1011, kg)),
    ra: [{ mat_hang_id: MH['P-VUN'].id, so_kg: 0.5, xu_ly: 'nhap_kho', vi_tri_id: vt.kho }] });
  const t0 = await tonLo(loQuet);
  ok('Pha lóc quét 4 tem → lô ở quầy 4 khay = 1,18 kg (tổng kg từng tem)', t0.goi === 4 && Math.abs(t0.kg - 1.18) < 1e-9, JSON.stringify(t0));

  const b1 = await ban(0.24);
  const t1 = await tonLo(loQuet);
  ok('Bán khay 0,24 kg → trừ 1 khay ĐÚNG 0,24 kg, KHÔNG dòng hao hụt; lô còn 3 khay 0,94 kg (đúng 3 khay chưa bán)',
     b1.d.trang_thai === 'da_ghi' && b1.lech.length === 0 && tong(b1.ban, 'so_kg') === -0.24 && tong(b1.ban, 'so_goi') === -1
     && t1.goi === 3 && Math.abs(t1.kg - 0.94) < 1e-9, JSON.stringify({ so: b1.so, t1 }));
  for (const kg of [0.31, 0.33]) await ban(kg);
  const b4 = await ban(0.3);
  const t4 = await tonLo(loQuet);
  ok('Bán nốt 3 khay đúng tem (khay cuối 0,30) → không một dòng hao hụt, lô về ĐÚNG 0 khay 0 kg',
     b4.lech.length === 0 && t4.goi === 0 && t4.kg === 0
     && Number((await db.query(`select count(*) n from kho_so_cai where loai = 'hao_hut' and chung_tu_loai = 'ban_hang'`)).rows[0].n) === 0,
     JSON.stringify({ so: b4.so, t4 }));
  await doiSoat('Quét tem');

  // Khay lệch nhiều: 0,15 · 0,15 · 0,45 (trung bình 0,25). Trước 0104 số khay chỉ suy từ trung bình: 0,45 kg là
  // 2 khay (0,5 gần hơn 0,25) — trừ dư một khay, khay cuối thành thiếu hàng.
  const [tang2] = await nhapTonDau([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 1, don_gia_kg: 600000 }], vt.kho);
  const loLech = await phaLoc(tang2, { nhanKhay: [0.15, 0.15, 0.45].map(kg => nhan(1011, kg)) });
  const n1 = await ban(0.45);
  const l1 = await tonLo(loLech);
  ok('Khay 0,45 kg (lô trung bình 0,25) trùng tem một khay đã quét → trừ ĐÚNG 1 khay 0,45 kg; lô còn 2 khay 0,3 kg',
     n1.d.trang_thai === 'da_ghi' && n1.d.so_goi === 1 && n1.so.length === 1 && tong(n1.ban, 'so_goi') === -1
     && tong(n1.ban, 'so_kg') === -0.45 && l1.goi === 2 && Math.abs(l1.kg - 0.3) < 1e-9, JSON.stringify({ so: n1.so, l1 }));
  await ban(0.15);
  const n3 = await ban(0.15);
  const l3 = await tonLo(loLech);
  ok('…bán hai khay 0,15 còn lại → không dòng hao hụt nào, lô về ĐÚNG 0/0',
     n3.lech.length === 0 && l3.goi === 0 && l3.kg === 0, JSON.stringify({ so: n3.so, l3 }));

  // FABi gộp hai tem cùng món vào một dòng (0,2 + 0,3 = 0,5): không trùng tem khay nào → số khay có tổng kg gần nhất.
  const [tang3] = await nhapTonDau([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 1, don_gia_kg: 600000 }], vt.kho);
  const loGop = await phaLoc(tang3, { nhanKhay: [0.2, 0.3, 0.4].map(kg => nhan(1011, kg)) });
  const g1 = await ban(0.5);
  const lg1 = await tonLo(loGop);
  ok('Một dòng 0,5 kg (hai tem gộp, không trùng khay nào) → 2 khay, đúng 0,5 kg, không hao hụt; còn 1 khay 0,4 kg',
     g1.d.so_goi === 2 && g1.lech.length === 0 && tong(g1.ban, 'so_kg') === -0.5 && lg1.goi === 1 && Math.abs(lg1.kg - 0.4) < 1e-9,
     JSON.stringify({ so: g1.so, lg1 }));
  const g2 = await ban(0.4);
  const lg2 = await tonLo(loGop);
  ok('…khay cuối 0,4 kg → lô về đúng 0/0, không dòng chênh lệch', g2.lech.length === 0 && lg2.goi === 0 && lg2.kg === 0,
     JSON.stringify({ so: g2.so, lg2 }));

  const noiBo = await duoi(UID.qlA, `select kho_ipos_mot_khay_quet($1, $2, null, 0.45)`, [vt.quay, MH['C-THANNGOAI'].id]);
  ok('kho_ipos_mot_khay_quet là hàm nội bộ — quản lý không gọi được', /permission denied/.test(noiBo.loi ?? ''), noiBo.loi ?? 'gọi được');
  await doiSoat('Khay lệch, tem gộp');
});

// ===========================================================================
await nhom('3 · LÔ GÕ TAY TỔNG KG: GIỮA CHỪNG KHÔNG HAO HỤT, GÓI CUỐI MỚI GHI CHÊNH LỆCH CÂN', async () => {
  const [tang] = await nhapTonDau([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 1, don_gia_kg: 600000 }], vt.kho);
  const lo = await phaLoc(tang, { ra: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2, so_kg: 0.6, xu_ly: 'nhap_kho', vi_tri_id: vt.quay }] });
  const b1 = await ban(0.25);
  const t1 = await tonLo(lo);
  ok('Khay đầu 0,25 kg (trung bình 0,30) → trừ 0,25 kg, không hao hụt; lô còn 1 khay 0,35 kg',
     b1.lech.length === 0 && tong(b1.ban, 'so_kg') === -0.25 && t1.goi === 1 && Math.abs(t1.kg - 0.35) < 1e-9,
     JSON.stringify({ so: b1.so, t1 }));
  const b2 = await ban(0.33);
  const t2 = await tonLo(lo);
  ok('Khay cuối 0,33 kg mà lô còn 0,35 → bán 0,33 kg + MỘT dòng chênh lệch −0,02 kg ghi rõ, lô về đúng 0/0',
     b2.lech.length === 1 && Number(b2.lech[0].so_kg) === -0.02 && b2.lech[0].so_goi === 0
     && /^Chênh lệch cân khi bán hết lô ở quầy · iPOS /.test(b2.lech[0].ghi_chu) && tong(b2.ban, 'so_kg') === -0.33
     && t2.goi === 0 && t2.kg === 0, JSON.stringify({ so: b2.so, t2 }));
  await doiSoat('Gõ tay');

  // Nhãn cân vượt kg còn lại của lô (lô gõ tay thiếu kg): dòng có mã vạch nhãn → đúng 1 khay, kg trên nhãn.
  // (Bán theo số lượng không vượt được: kho chọn số khay có tổng kg gần nhất — 0,45 kg với lô 0,2 kg/khay là 2
  // khay, hết lô.) Không âm kho; khay còn lại giữ kg trung bình trước lần bán (0,2) — không thành khay 0 kg, để
  // dòng bán theo số lượng sau đó vẫn tính được số khay.
  const [tang2] = await nhapTonDau([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 1, don_gia_kg: 600000 }], vt.kho);
  loVuot = await phaLoc(tang2, { ra: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2, so_kg: 0.4, xu_ly: 'nhap_kho', vi_tri_id: vt.quay }] });
  const v1 = await ban(0.45, { quetNhan: true });
  saleVuot = v1.saleId;
  const u1 = await tonLo(loVuot);
  ok('Kg bán 0,45 vượt kg còn lại của lô (0,40) → bán 0,45 kg / 1 khay + chênh lệch +0,25 ghi rõ; khay còn lại giữ 0,2 kg',
     v1.d.trang_thai === 'da_ghi' && v1.lech.length === 1 && Number(v1.lech[0].so_kg) === 0.25
     && /^Kg bán vượt kg còn lại của lô · iPOS /.test(v1.lech[0].ghi_chu) && tong(v1.ban, 'so_kg') === -0.45
     && u1.goi === 1 && Math.abs(u1.kg - 0.2) < 1e-9, JSON.stringify({ so: v1.so, u1 }));
  const v2 = await ban(0.2);
  const u2 = await tonLo(loVuot);
  ok('…khay cuối bán theo số lượng FABi (0,2 kg) → 1 khay, không chênh lệch, lô về đúng 0/0',
     v2.d.trang_thai === 'da_ghi' && v2.d.so_goi === 1 && v2.lech.length === 0 && u2.goi === 0 && u2.kg === 0,
     JSON.stringify({ so: v2.so, u2 }));
  await doiSoat('Vượt kg');
});

// ===========================================================================
await nhom('4 · HỦY HÓA ĐƠN TRẢ ĐÚNG KHAY VÀ KG (CẢ KHI CÓ DÒNG CHÊNH LỆCH) · BÁO CÁO TÁCH THIẾU / THỪA', async () => {
  const [tang] = await nhapTonDau([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 1, don_gia_kg: 600000 }], vt.kho);
  const lo = await phaLoc(tang, { nhanKhay: [0.27, 0.29].map(kg => nhan(1011, kg)) });
  const b = await ban(0.27, { saleId: 'SALE-HUY-1' });
  const truoc = await tonLo(lo);
  const kq = phanTichHoaDon(hoaDonFabi(0.27, { saleId: 'SALE-HUY-1', datastate: 2 }));
  const r = await duoi(MAY, `select kho_ipos_nhan_callback($1, $2::jsonb)`, [cnA.id, JSON.stringify(kq.hoaDon)]);
  const sau = await tonLo(lo);
  ok('Hủy hóa đơn trên FABi (datastate 2) → trả lại đúng 1 khay 0,27 kg (2 khay 0,56 kg như lúc cắt)',
     r.loi === null && b.lech.length === 0 && truoc.goi === 1 && sau.goi === 2 && Math.abs(sau.kg - 0.56) < 1e-9,
     r.loi ?? JSON.stringify({ truoc, sau }));

  await doiSoat('Hủy');

  // Bán nốt hai khay đã trả lại (đúng tem) để lô sau là lô duy nhất ở quầy (bán lấy lô hạn gần nhất trước).
  await ban(0.27);
  await ban(0.29);
  const het = await tonLo(lo);
  ok('Bán nốt hai khay đã trả lại → lô về đúng 0/0', het.goi === 0 && het.kg === 0, JSON.stringify(het));

  // Hủy hóa đơn mà lần bán đã ghi dòng chênh lệch +0,06 (khay cuối 0,26 kg, lô gõ tay còn 0,2): đảo dòng ban
  // trước, hao_hut sau — tồn không âm, khay về lại với đúng 0,2 kg của lô.
  const [tang2] = await nhapTonDau([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 1, don_gia_kg: 600000 }], vt.kho);
  const loGo = await phaLoc(tang2, { ra: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 2, so_kg: 0.5, xu_ly: 'nhap_kho', vi_tri_id: vt.quay }] });
  await ban(0.3);
  const cuoi = await ban(0.26, { saleId: 'SALE-HUY-2' });
  const hetLo = await tonLo(loGo);
  ok('Khay cuối 0,26 kg mà lô gõ tay chỉ còn 0,2 kg → không kẹt "thiếu hàng": bán 1 khay 0,26 kg + chênh lệch +0,06, lô về 0/0',
     cuoi.d.trang_thai === 'da_ghi' && cuoi.d.so_goi === 1 && tong(cuoi.ban, 'so_kg') === -0.26 && cuoi.lech.length === 1
     && Number(cuoi.lech[0].so_kg) === 0.06 && hetLo.goi === 0 && hetLo.kg === 0, JSON.stringify({ d: cuoi.d.ly_do, so: cuoi.so, hetLo }));
  const huy2 = phanTichHoaDon(hoaDonFabi(0.26, { saleId: 'SALE-HUY-2', datastate: 2 }));
  const r2 = await duoi(MAY, `select kho_ipos_nhan_callback($1, $2::jsonb)`, [cnA.id, JSON.stringify(huy2.hoaDon)]);
  const traLai = await tonLo(loGo);
  const dao2 = (await db.query(`select count(*)::int n from kho_so_cai where loai = 'dao_nguoc' and chung_tu_id = $1`, [cuoi.d.id])).rows[0].n;
  ok('Hủy hóa đơn có dòng chênh lệch cân (+0,06) → đảo cả hai dòng, trả lại 1 khay đúng 0,2 kg của lô',
     r2.loi === null && dao2 === 2 && traLai.goi === 1 && Math.abs(traLai.kg - 0.2) < 1e-9, r2.loi ?? JSON.stringify({ traLai, dao2 }));
  await doiSoat('Hủy có chênh lệch');

  // Báo cáo: −0,02 (nhóm 3) là "thiếu"; +0,25 (kg vượt, nhóm 3) là "thừa"; +0,06 đã đảo không còn — dòng đảo
  // (−0,06) xếp theo dấu dòng GỐC nên bù đúng dòng của nó, không lọt sang "thiếu".
  const baoCao = async () => {
    const bc = await duoi(UID.qlA, `select * from kho_bao_cao_hao_hut($1, $2::date, $3::date)`, [cnA.id, await ngay(-1), await ngay(1)]);
    if (bc.loi) throw new Error(bc.loi);
    return Object.fromEntries(bc.rows.filter(x => x.loai_dong === 'hao_hut' && x.mat_hang_id === MH['C-THANNGOAI'].id)
      .map(x => [x.ly_do, Number(x.so_kg)]));
  };
  const bc1 = await baoCao();
  ok('Báo cáo hao hụt tách "Chênh lệch cân lúc bán (iPOS) — thiếu" 0,02 kg và "— thừa" 0,25 kg; lần bán đã hủy không còn',
     Object.keys(bc1).length === 2 && bc1['Chênh lệch cân lúc bán (iPOS) — thiếu'] === 0.02
     && bc1['Chênh lệch cân lúc bán (iPOS) — thừa'] === 0.25, JSON.stringify(bc1));

  // Hủy lần bán vượt kg (lô đã bán hết): khay 0,45 kg về lại, dòng +0,25 đảo → lô 1 khay 0,2 kg; báo cáo hết "thừa".
  const huy3 = phanTichHoaDon(hoaDonFabi(0.45, { saleId: saleVuot, datastate: 2 }));
  const r3 = await duoi(MAY, `select kho_ipos_nhan_callback($1, $2::jsonb)`, [cnA.id, JSON.stringify(huy3.hoaDon)]);
  const lv = await tonLo(loVuot);
  const bc2 = await baoCao();
  ok('Hủy lần bán vượt kg → lô về 1 khay 0,2 kg; báo cáo chỉ còn "— thiếu" 0,02 kg',
     r3.loi === null && lv.goi === 1 && Math.abs(lv.kg - 0.2) < 1e-9 && Object.keys(bc2).length === 1
     && bc2['Chênh lệch cân lúc bán (iPOS) — thiếu'] === 0.02, r3.loi ?? JSON.stringify({ lv, bc2 }));
  await doiSoat('Hủy lần bán vượt kg');

  // Dư từ nửa gói trở lên so với mọi gói đang có (quầy còn 2 khay 0,2 kg; bán 0,55 kg) → vẫn "thiếu hàng" như cũ.
  const thieu = await ban(0.55);
  ok('Kg bán dư từ nửa gói trở lên so với mọi gói ở quầy (0,55 so với 0,4) → vẫn thiếu hàng, không trừ gì',
     thieu.d.trang_thai === 'thieu_hang' && thieu.so.length === 0, JSON.stringify(thieu.d));
  await doiSoat('Thiếu hàng');
});

process.exit(ketThuc('iPOS TRỪ ĐÚNG KG TRÊN TEM'));
