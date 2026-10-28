/**
 * BEEFTOWN KHO — Bán qua iPOS: khay của tảng nào thì trừ đúng lô tảng đó, theo tem đã quét lúc cắt (0106)
 * ======================================================================================================
 *
 *     node test/test-kho-ipos-tem-tang.mjs
 *
 * Khánh chốt 28/10/2026 ("chủ yếu kiểm soát trên hệ thống"): nhiều tảng Ribeye cắt ra quầy cùng lúc, FABi chỉ gửi
 * "01011 + kg" — không biết khay của tảng nào. Trước 0106 kho trừ lô hạn gần nhất: khay cắt cùng ngày cùng hạn
 * → luôn trừ tảng cắt trước, dù khách cầm khay của tảng sau. Lúc cắt mỗi khay đã quét tem (kho_phien_pha_quet:
 * mã + kg từng khay), nên từ 0106:
 *   · kg bán trùng tem của một khay CHƯA BÁN (số tem kg đó của lô − số lần đã bán đúng 1 khay kg đó, không tính
 *     lần bán đã hủy) → trừ đúng lô có khay đó;
 *   · nhiều lô cùng có khay kg đó → lô hạn gần nhất TRONG các lô đó (không phải lô hạn gần nhất của cả quầy);
 *   · không lô nào → hạn gần nhất như cũ;
 *   · hủy hóa đơn → khay về lại lô của nó, tem kg đó lại là "chưa bán";
 *   · kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui, UID_MAY_IPOS, themMayIpos } from './kho-chung.mjs';
import { phanTichHoaDon } from '../../web/src/lib/kho/ipos.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — iPOS: KHAY CỦA TẢNG NÀO TRỪ LÔ TẢNG ĐÓ');
const { db, cnA, cnB, duoi } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
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

/** Một tảng thăn ngoại 2 kg, cắt ra quầy bằng cách quét tem từng khay. Trả lô khay (cắt sau thì tạo sau). */
async function catTang(khay) {
  const [tang] = await nhapTonDau([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 2, don_gia_kg: 600000 }], vt.kho);
  return phaLoc(tang, { nhanKhay: khay.map(kg => nhan(1011, kg)) });
}
const loCuaBan = b => [...new Set(b.ban.map(s => s.lo_id))];

// ===========================================================================
let A, B;
await nhom('2 · HAI TẢNG CẮT CÙNG NGÀY: BÁN KHAY CỦA TẢNG SAU → TRỪ ĐÚNG LÔ TẢNG SAU', async () => {
  A = await catTang([0.24, 0.31, 0.33]);
  B = await catTang([0.42, 0.29, 0.35]);
  const han = (await db.query(`select id, han_dung::text h from kho_lo where id = any($1::uuid[])`, [[A, B]])).rows;
  ok('Hai lô khay cùng hạn, lô tảng A tạo trước (bán theo hạn gần nhất sẽ lấy A)',
     han.length === 2 && han[0].h === han[1].h, JSON.stringify(han));

  const b1 = await ban(0.42);
  const [a1, bb1] = [await tonLo(A), await tonLo(B)];
  ok('Khay 0,42 kg (tem của tảng B) → trừ 1 khay 0,42 kg của lô B; lô A không đổi',
     b1.d.trang_thai === 'da_ghi' && loCuaBan(b1).length === 1 && loCuaBan(b1)[0] === B && tong(b1.ban, 'so_kg') === -0.42
     && tong(b1.ban, 'so_goi') === -1 && a1.goi === 3 && Math.abs(a1.kg - 0.88) < 1e-9 && bb1.goi === 2 && Math.abs(bb1.kg - 0.64) < 1e-9,
     JSON.stringify({ lo: loCuaBan(b1), A: a1, B: bb1 }));
  const b2 = await ban(0.31);
  ok('Khay 0,31 kg (tem của tảng A) → trừ lô A', loCuaBan(b2).length === 1 && loCuaBan(b2)[0] === A, JSON.stringify(loCuaBan(b2)));
  const b3 = await ban(0.35);
  ok('Khay 0,35 kg (tem của tảng B) → trừ lô B', loCuaBan(b3).length === 1 && loCuaBan(b3)[0] === B, JSON.stringify(loCuaBan(b3)));

  const noiBo = await duoi(UID.qlA, `select kho_ipos_lo_theo_tem($1, $2, 0.42)`, [vt.quay, MH['C-THANNGOAI'].id]);
  ok('kho_ipos_lo_theo_tem là hàm nội bộ — quản lý không gọi được', /permission denied/.test(noiBo.loi ?? ''), noiBo.loi ?? 'gọi được');
  await doiSoat('Hai tảng');
});

// ===========================================================================
await nhom('3 · TRÙNG KG Ở HAI TẢNG: LÔ HẠN GẦN NHẤT TRONG CÁC LÔ CÓ KHAY ĐÓ · TEM ĐÃ BÁN KHÔNG TÍNH LẠI · HỦY THÌ TÍNH LẠI', async () => {
  const C = await catTang([0.25, 0.28]);
  const D = await catTang([0.25, 0.37]);
  // A còn 0,24 · 0,33 (hạn như C, D, tạo trước) — không có khay 0,25: không được lấy A.
  const c1 = await ban(0.25);
  ok('0,25 kg có ở cả C và D → lô hạn gần nhất trong hai lô đó (C, cắt trước) — không lấy A dù A tạo trước nữa',
     loCuaBan(c1).length === 1 && loCuaBan(c1)[0] === C, JSON.stringify({ lo: loCuaBan(c1), A, C, D }));
  const c2 = await ban(0.25, { saleId: 'SALE-TEM-HUY' });
  ok('Bán thêm một khay 0,25 → tem 0,25 của C đã bán rồi → trừ D',
     loCuaBan(c2).length === 1 && loCuaBan(c2)[0] === D, JSON.stringify({ lo: loCuaBan(c2), C, D }));

  const huy = phanTichHoaDon(hoaDonFabi(0.25, { saleId: 'SALE-TEM-HUY', datastate: 2 }));
  const r = await duoi(MAY, `select kho_ipos_nhan_callback($1, $2::jsonb)`, [cnA.id, JSON.stringify(huy.hoaDon)]);
  const d0 = await tonLo(D);
  ok('Hủy hóa đơn đó trên FABi → khay 0,25 về lại lô D (2 khay 0,62 kg)',
     r.loi === null && d0.goi === 2 && Math.abs(d0.kg - 0.62) < 1e-9, r.loi ?? JSON.stringify(d0));
  const c3 = await ban(0.25);
  ok('…bán lại khay 0,25 → lần bán đã hủy không tính, tem 0,25 của D lại là "chưa bán" → trừ D',
     loCuaBan(c3).length === 1 && loCuaBan(c3)[0] === D, JSON.stringify({ lo: loCuaBan(c3), D }));
  await doiSoat('Trùng kg');
});

// ===========================================================================
await nhom('4 · KHÔNG TEM NÀO KHỚP → HẠN GẦN NHẤT NHƯ CŨ', async () => {
  // Quầy còn: A 0,24 · 0,33 — C 0,28 — D 0,37 (cùng hạn, A tạo trước nhất).
  const k = await ban(0.3);
  ok('0,3 kg không trùng tem khay nào → 1 khay, lô hạn gần nhất (A) như trước 0106',
     k.d.trang_thai === 'da_ghi' && k.d.so_goi === 1 && loCuaBan(k).length === 1 && loCuaBan(k)[0] === A,
     JSON.stringify({ lo: loCuaBan(k), A }));
  await doiSoat('Không khớp tem');
});

process.exit(ketThuc('iPOS: KHAY CỦA TẢNG NÀO TRỪ LÔ TẢNG ĐÓ'));
