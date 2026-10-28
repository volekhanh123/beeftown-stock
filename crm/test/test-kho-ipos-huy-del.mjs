/**
 * BEEFTOWN KHO — Hủy hóa đơn trên FABi trả kho NGAY, qua bản "<sale_id>_DEL" (0108)
 * ================================================================================
 *
 *     node test/test-kho-ipos-huy-del.mjs
 *
 * Thử thật 28/10/2026 (Khánh): bán hóa đơn X hai khay Ribeye (1,2 + 0,69 kg) trên FABi, rồi hủy X. Webhook iPOS
 * DW KHÔNG gửi lại X với datastate 2 — nó gửi một hóa đơn MỚI sale_id "X_DEL": datastate 2, origin_sale_id = X,
 * cùng sale_detail_id với X nhưng quantity / amount ÂM. Kho cất "X_DEL" như một hóa đơn hủy rỗng; X vẫn còn trừ
 * kho cho tới lượt kéo bù kế tiếp (5 phút sau) mới đưa X datastate 2 về và trả kho. Khánh nhìn kho trong khoảng đó:
 * "hủy hóa đơn rồi nhưng món không được trả lại kho". Phải đúng:
 *   · nhận "X_DEL" → X đảo ngay trong cùng lời gọi: trả đúng khay, đúng kg; dòng X "Hóa đơn đã hủy trên iPOS";
 *   · lượt kéo đưa X datastate 2 về sau đó, iPOS gửi lại "X_DEL", hay gửi lại X cũ (datastate 0): không trả kho
 *     lần hai, không trừ lại;
 *   · hóa đơn sửa (sale_id mới, origin_sale_id = X, datastate 0) KHÔNG hủy X; hóa đơn hủy chỉ trỏ origin_sale_id
 *     mà sale_id không đúng mẫu "X_DEL" (tách, gộp, hóa đơn sửa bị hủy sau) cũng không — X có thể vẫn là hàng bán;
 *   · "X_DEL" đến TRƯỚC X (lần gửi X đầu lỗi, iPOS gửi lại sau): X tới sau vẫn là hủy, không trừ kho;
 *   · chi nhánh khác gửi "X_DEL" trỏ X của chi nhánh này: không đụng X;
 *   · kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui, UID_MAY_IPOS, themMayIpos } from './kho-chung.mjs';
import { phanTichHoaDon } from '../../web/src/lib/kho/ipos.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — HỦY HÓA ĐƠN FABi QUA "_DEL" TRẢ KHO NGAY');
const { db, cnA, cnB, duoi } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;
const MAY_B = UID_MAY_IPOS.mayIposB;

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

/** Cắt một tảng ra khay ở quầy, quét tem từng khay. Trả lô ra của món cut. */
async function catKhay(loTang, khay) {
  const luu = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date,
      p_ghi_chu => null, p_vao => $5::jsonb, p_ra => '[]'::jsonb)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay, JSON.stringify([{ lo_id: loTang.id, vi_tri_id: vt.kho }])]);
  if (luu.loi) throw new Error(luu.loi);
  const id = luu.rows[0].phien_id;
  const q = await duoi(UID.thuKhoA, `select kho_quet_phien_pha(p_id => $1, p_ma_gui => $2, p_ma => $3::jsonb) as kq`,
    [id, maGui(), JSON.stringify(khay.map(kg => nhan(1011, kg)))]);
  if (q.loi) throw new Error(q.loi);
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

// ---- Hóa đơn iPOS DW đúng dạng FABi gửi thật (28/10/2026), qua bộ đọc của web ------------------------------
const g = (() => {
  const vn = new Date(Date.now() - 10 * 60000 + 7 * 3600000);
  return { ngay: Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) / 1000 - 7 * 3600,
           gio: vn.getUTCHours(), phut: vn.getUTCMinutes() };
})();
/** Hóa đơn FABi: mỗi phần tử của khay là một dòng 01011 theo kg. goc = origin_sale_id (FABi gửi "" khi không có). */
function hoaDonFabi(saleId, khay, { datastate = 0, goc = '' } = {}) {
  return {
    sale_id: saleId, origin_sale_id: goc, brand_id: 'BRAND-THU', store_id: 'STORE-THU', pos_type: 'POS_FABI', datastate,
    amount: khay.reduce((a, kg) => a + Math.round(kg * 950000), 0),
    sale: { sale_id: saleId, origin_sale_id: goc, date_last: g.ngay, hour_last: g.gio, minute_last: g.phut, status: 1 },
    sale_detail: khay.map((kg, i) => ({
      sale_detail_id: `SD_${saleId}_${i}`, item_id: '01011', item_id_mapping: '01011', description: 'Steak Ribeye Úc',
      unit_id: 'KG', quantity: kg, price_sale: 950000, amount: Math.round(kg * 950000),
    })),
  };
}
/** Bản FABi gửi khi hủy hóa đơn x: sale_id "x_DEL", datastate 2, origin_sale_id = x, quantity / amount ÂM. */
function banDel(x) {
  const goc = x.sale_id;
  const id = `${goc}_DEL`;
  return {
    ...x, sale_id: id, origin_sale_id: goc, datastate: 2, amount: -x.amount,
    sale: { ...x.sale, sale_id: id, origin_sale_id: goc },
    sale_detail: x.sale_detail.map(d => ({ ...d, quantity: -d.quantity, amount: -d.amount })),
  };
}
async function gui(hd, may = MAY, cn = cnA) {
  const kq = phanTichHoaDon(hd);
  if (kq.loai !== 'hoa_don') throw new Error(kq.cau);
  const r = await duoi(may, `select kho_ipos_nhan_callback($1, $2::jsonb) as kq`, [cn.id, JSON.stringify(kq.hoaDon)]);
  return { loi: r.loi, kq: r.rows?.[0]?.kq, hoaDon: kq.hoaDon };
}
const hoaDon = async ma => (await db.query(`select * from kho_ipos_hoa_don where ma_hd = $1`, [ma])).rows[0];
const dongHd = async ma => (await db.query(`select d.* from kho_ipos_dong d join kho_ipos_hoa_don h on h.id = d.hoa_don_id
  where h.ma_hd = $1 order by d.khoa_dong`, [ma])).rows;
const soCaiHd = async ma => (await db.query(`select s.loai, s.so_goi, s.so_kg from kho_so_cai s
  join kho_ipos_dong d on d.id = s.chung_tu_id join kho_ipos_hoa_don h on h.id = d.hoa_don_id
  where s.chung_tu_loai = 'ban_hang' and h.ma_hd = $1 order by s.created_at`, [ma])).rows;
async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// ===========================================================================
await nhom('1 · CHUẨN BỊ: MÃ CÂN 1011, TRỪ KHO THEO iPOS Ở CẢ HAI CHI NHÁNH', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  await db.query(`update kho_mat_hang set ma_can = '1011', gia_ban_kg = 950000, noi_de_sau_pha = 'quay' where ma = 'C-THANNGOAI'`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  const quayB = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'quay'`, [cnB.id])).rows[0].id;
  const loi = [];
  for (const [cn, ma, quay] of [[cnA, 'STORE-THU', vt.quay], [cnB, 'STORE-THU-B', quayB]]) {
    const c = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb)`, [cn.id,
      JSON.stringify({ bat: true, pos_parent: 'BRAND-THU', pos_id: ma, vi_tri_ban_id: quay })]);
    const s = await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, $2::timestamptz)`, [cn.id, TU_LUC]);
    loi.push(c.loi, s.loi);
  }
  ok('Bật iPOS, trừ kho theo iPOS ở chi nhánh A và B', loi.every(l => l === null), loi.filter(Boolean).join(' | '));
});

// ===========================================================================
let lo, X;
await nhom('2 · HỦY HÓA ĐƠN TRÊN FABi: "X_DEL" ĐẾN → X TRẢ KHO NGAY, ĐÚNG KHAY, ĐÚNG KG', async () => {
  const [tang] = await nhapTonDau([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 3, don_gia_kg: 600000 }], vt.kho);
  lo = await catKhay(tang, [1.08, 1.2, 0.69]);
  const t0 = await tonLo(lo);
  ok('Cắt 3 khay quét tem → quầy 3 khay 2,97 kg', t0.goi === 3 && Math.abs(t0.kg - 2.97) < 1e-9, JSON.stringify(t0));

  X = hoaDonFabi('WV-THU-HUY-1', [1.2, 0.69]);
  const b = await gui(X);
  const t1 = await tonLo(lo);
  ok('Bán X (khay 1,2 + 0,69) → trừ 2 khay đúng 1,89 kg, quầy còn 1 khay 1,08 kg',
     b.loi === null && t1.goi === 1 && Math.abs(t1.kg - 1.08) < 1e-9
     && (await dongHd(X.sale_id)).every(d => d.trang_thai === 'da_ghi'), b.loi ?? JSON.stringify(t1));

  const del = banDel(X);
  const r = await gui(del);
  const t2 = await tonLo(lo);
  const dX = await dongHd(X.sale_id);
  const hX = await hoaDon(X.sale_id);
  ok('Nhận "X_DEL" (datastate 2, origin_sale_id = X, số lượng âm) → X trả kho NGAY: quầy lại 3 khay 2,97 kg',
     r.loi === null && t2.goi === 3 && Math.abs(t2.kg - 2.97) < 1e-9, r.loi ?? JSON.stringify({ t2, kq: r.kq }));
  ok('…hóa đơn X đánh dấu hủy, mọi dòng X "Hóa đơn đã hủy trên iPOS"; kết quả đếm 1 hóa đơn hủy',
     hX.da_huy === true && dX.length === 2 && dX.every(d => d.trang_thai === 'da_huy' && d.ly_do === 'Hóa đơn đã hủy trên iPOS')
     && r.kq?.hd_huy === 1 && r.kq?.hd_loi === 0, JSON.stringify({ da_huy: hX.da_huy, dX: dX.map(d => [d.trang_thai, d.ly_do]), kq: r.kq }));
  const so = await soCaiHd(X.sale_id);
  ok('…sổ kho của X: 2 dòng bán + đúng 2 dòng đảo ngược (+1 khay 1,2 kg, +1 khay 0,69 kg)',
     so.filter(s => s.loai === 'ban').length === 2 && so.filter(s => s.loai === 'dao_nguoc').length === 2
     && so.filter(s => s.loai === 'dao_nguoc').reduce((a, s) => a + Number(s.so_kg), 0) === 1.89, JSON.stringify(so));
  const hDel = await hoaDon(del.sale_id);
  ok('…"X_DEL" vẫn cất làm hóa đơn hủy riêng, ma_hd_goc = X, không dòng nào (không trừ, không cộng kho)',
     hDel?.da_huy === true && hDel.ma_hd_goc === X.sale_id && (await dongHd(del.sale_id)).length === 0, JSON.stringify(hDel));
  await doiSoat('Nhận X_DEL');
});

// ===========================================================================
await nhom('3 · GỬI LẠI / KÉO BÙ SAU ĐÓ: KHÔNG TRẢ KHO LẦN HAI, KHÔNG TRỪ LẠI', async () => {
  // Thứ tự như thật: iPOS gửi lại "X_DEL" (không nhận được trả lời lần trước), bản X cũ gửi lại (datastate 0 —
  // iPOS gửi lại tối đa 5 lần, 30 giây một lần), rồi lượt kéo 5 phút đưa X datastate 2 về.
  const r1 = await gui(banDel(X));
  const r2 = await gui(X);
  const r3 = await gui(hoaDonFabi(X.sale_id, [1.2, 0.69], { datastate: 2 }));
  const t = await tonLo(lo);
  const so = await soCaiHd(X.sale_id);
  ok('iPOS gửi lại "X_DEL", gửi lại bản X cũ (datastate 0), rồi lượt kéo đưa X datastate 2 về → quầy vẫn 3 khay 2,97 kg',
     [r1, r2, r3].every(r => r.loi === null) && t.goi === 3 && Math.abs(t.kg - 2.97) < 1e-9, JSON.stringify({ t, l: [r1.loi, r2.loi, r3.loi] }));
  ok('…sổ kho X vẫn đúng 2 dòng bán + 2 dòng đảo ngược; X vẫn hủy',
     so.length === 4 && so.filter(s => s.loai === 'dao_nguoc').length === 2 && (await hoaDon(X.sale_id)).da_huy === true,
     JSON.stringify(so));
  await doiSoat('Gửi lại');
});

// ===========================================================================
await nhom('4 · HÓA ĐƠN SỬA, "_DEL" ĐẾN TRƯỚC, CHI NHÁNH KHÁC: KHÔNG HỦY NHẦM', async () => {
  // Quầy đang 3 khay 1,08 · 1,2 · 0,69. Bán Y = khay 1,08.
  const Y = hoaDonFabi('WV-THU-SUA-Y', [1.08]);
  await gui(Y);
  // Sửa Y trên FABi: hóa đơn MỚI Z, origin_sale_id = Y, datastate 0 → ghi Z, KHÔNG hủy Y (FABi gửi bản hủy Y riêng).
  const Z = hoaDonFabi('WV-THU-SUA-Z', [0.69], { goc: Y.sale_id });
  const rz = await gui(Z);
  const t = await tonLo(lo);
  ok('Hóa đơn sửa (sale_id mới, origin_sale_id = Y, datastate 0) → ghi Z, Y vẫn trừ kho: quầy còn 1 khay 1,2 kg',
     rz.loi === null && rz.hoaDon.ma_hd_goc === undefined && (await hoaDon(Y.sale_id)).da_huy === false
     && t.goi === 1 && Math.abs(t.kg - 1.2) < 1e-9, rz.loi ?? JSON.stringify(t));

  // Chi nhánh B gửi "Y_DEL": chỉ tìm Y trong chi nhánh B — Y của A không bị đảo.
  const yDel = banDel(Y);
  const rb = await gui({ ...yDel, store_id: 'STORE-THU-B' }, MAY_B, cnB);
  ok('Máy iPOS chi nhánh B gửi "Y_DEL" → Y của chi nhánh A KHÔNG bị hủy, quầy A vẫn 1 khay',
     rb.loi === null && (await hoaDon(Y.sale_id)).da_huy === false && (await tonLo(lo)).goi === 1, rb.loi ?? '');

  // Người không có quyền đồng bộ bán không gửi được "Y_DEL".
  const kq = phanTichHoaDon(yDel);
  const rn = await duoi(UID.nvQuayA, `select kho_ipos_nhan_callback($1, $2::jsonb)`, [cnA.id, JSON.stringify(kq.hoaDon)]);
  const ra = await duoi(UID.nghiViec, `select kho_ipos_nhan_callback($1, $2::jsonb)`, [cnA.id, JSON.stringify(kq.hoaDon)]);
  ok('Nhân viên quầy, nhân sự đã nghỉ gửi "Y_DEL" → bị từ chối, Y vẫn trừ kho',
     rn.loi !== null && ra.loi !== null && (await hoaDon(Y.sale_id)).da_huy === false, `${rn.loi} | ${ra.loi}`);

  // Hóa đơn hủy chỉ trỏ origin_sale_id = Y mà sale_id không đúng mẫu "Y_DEL" (tách / gộp, hóa đơn sửa bị hủy
  // sau): Y có thể vẫn là hàng đã bán → không hủy Y.
  const rk = await gui(hoaDonFabi('WV-THU-TACH', [0.2], { datastate: 2, goc: Y.sale_id }));
  ok('Hóa đơn hủy có origin_sale_id = Y nhưng sale_id không phải "Y_DEL" → KHÔNG hủy Y, quầy vẫn 1 khay',
     rk.loi === null && rk.hoaDon.ma_hd_goc === undefined && (await hoaDon(Y.sale_id)).da_huy === false
     && (await tonLo(lo)).goi === 1, rk.loi ?? '');

  // "W_DEL" đến TRƯỚC W: lần gửi W đầu lỗi (máy chủ trả 503), thu ngân hủy ngay, iPOS gửi lại W sau "W_DEL".
  const W = hoaDonFabi('WV-THU-CHUA-TOI', [1.2]);
  const rw = await gui(banDel(W));
  ok('"W_DEL" của hóa đơn kho chưa nhận → cất hóa đơn hủy rỗng (ma_hd_goc = W), không lỗi, không đụng kho',
     rw.loi === null && rw.kq?.hd_loi === 0 && (await hoaDon(W.sale_id)) === undefined
     && (await hoaDon(`${W.sale_id}_DEL`))?.ma_hd_goc === W.sale_id && (await tonLo(lo)).goi === 1, rw.loi ?? JSON.stringify(rw.kq));
  const rw2 = await gui(W);
  const hW = await hoaDon(W.sale_id);
  const dW = await dongHd(W.sale_id);
  ok('…iPOS gửi lại W (datastate 0) SAU "W_DEL" → W cất là hủy, không dòng nào trừ kho: quầy vẫn 1 khay 1,2 kg',
     rw2.loi === null && hW?.da_huy === true && dW.length === 0 && (await tonLo(lo)).goi === 1
     && Math.abs((await tonLo(lo)).kg - 1.2) < 1e-9, rw2.loi ?? JSON.stringify({ hW, dW }));
  const rw3 = await gui(hoaDonFabi(W.sale_id, [1.2], { datastate: 2 }));
  ok('…lượt kéo đưa W datastate 2 về sau đó → không lỗi, kho không đổi', rw3.loi === null && rw3.kq?.hd_loi === 0
     && (await tonLo(lo)).goi === 1, rw3.loi ?? JSON.stringify(rw3.kq));

  // Hủy Y qua "Y_DEL" ở đúng chi nhánh → trả khay 1,08.
  const ry = await gui(yDel);
  const t2 = await tonLo(lo);
  ok('Máy iPOS chi nhánh A gửi "Y_DEL" → Y trả kho: quầy 2 khay 2,28 kg',
     ry.loi === null && (await hoaDon(Y.sale_id)).da_huy === true && t2.goi === 2 && Math.abs(t2.kg - 2.28) < 1e-9,
     ry.loi ?? JSON.stringify(t2));
  await doiSoat('Sửa / chi nhánh khác');
});

process.exit(ketThuc('HỦY HÓA ĐƠN FABi QUA "_DEL"'));
