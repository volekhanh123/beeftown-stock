/**
 * BEEFTOWN KHO — Kiểm thử iPOS TỰ ĐẨY hóa đơn sang (callback) (0042, GĐ7c)
 * ========================================================================
 *
 *     node test/test-kho-ipos-callback.mjs
 *
 * PHẦN DATABASE. Hóa đơn mẫu dựng theo Event 11 "sale_manager" của tài liệu
 * iPOS Hub (tự dựng lại — không token, không thông tin khách thật), đã chuẩn
 * hóa như web gửi: ma_hd = "<pos_id>:<tran_id>", giờ +07:00, mỗi item một dòng
 * {khoa_dong: chỉ số, ma_ipos: item_id, ten_ipos, so_luong: quantity, thanh_tien}.
 * Phải đúng:
 *   · bắn trùng không trừ đôi; hai dòng cùng item_id là hai dòng;
 *   · bán theo kg / gói / suất; món đếm gói bán theo kg → gói nguyên FEFO +
 *     hao_hut lệch; gói lẻ → lỗi rõ ràng; món theo kg bán theo gói cần "mỗi gói = … kg";
 *   · thiếu hàng → hàng chờ → thử lại ([]) ghi được; chưa ghép → ghép v2 → ghi;
 *   · không lưu membership / địa chỉ / thanh toán (lưới database);
 *   · quán vắng khách không chặn đếm quầy; mất kết nối = lâu không nhận hóa
 *     đơn TRONG giờ mở cửa;
 *   · máy may_ipos chỉ gọi được hàm đồng bộ; kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui, UID_MAY_IPOS, themMayIpos } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ iPOS ĐẨY HÓA ĐƠN (CALLBACK)');
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
await themMayIpos(db, cnA, cnB);
const MAY = UID_MAY_IPOS.mayIposA;
const MAY_B = UID_MAY_IPOS.mayIposB;

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
const TU_LUC = new Date(Date.now() - 3 * 86400000).toISOString();

const LA_TIEN = /gia|tien|thanh_tien|gia_von|gia_tri|doanh_thu|lai_gop|price|amount/;
function khoaTien(v, duong = '') {
  const ra = [];
  if (Array.isArray(v)) v.forEach((x, i) => ra.push(...khoaTien(x, `${duong}[${i}]`)));
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (LA_TIEN.test(k)) ra.push(`${duong}.${k}`);
      ra.push(...khoaTien(x, `${duong}.${k}`));
    }
  }
  return ra;
}

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

const MH = {};
let viTri = {};
let ncc;

async function nhapHang(dong, vt) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt, homNay, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const duyet = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (duyet.loi) throw new Error(duyet.loi);
  const { rows } = await db.query(`
    select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id]);
  return rows;
}

const ton = async (loId, vt) => {
  const r = (await db.query(`select so_kg, so_goi from kho_ton where lo_id = $1 and vi_tri_id = $2`, [loId, vt])).rows[0];
  return r ? { kg: Number(r.so_kg), goi: r.so_goi } : { kg: 0, goi: 0 };
};
const tonHang = async (ma, vt) => {
  const r = (await db.query(`select coalesce(sum(so_goi), 0)::int as goi, coalesce(sum(so_kg), 0) as kg
    from kho_ton where mat_hang_id = $1 and vi_tri_id = $2`, [MH[ma].id, vt])).rows[0];
  return { goi: r.goi, kg: Number(r.kg) };
};
const soDongSo = async () => (await db.query(`select count(*)::int as n from kho_so_cai`)).rows[0].n;
const suKien = async (uid, khoa) =>
  ((await duoi(uid, `select kho_thong_bao($1, 300) as v`, [cnA.id])).rows?.[0]?.v?.su_kien ?? [])
    .filter(e => e.khoa === khoa);
const trangThai = async (uid = UID.qlA) => (await duoi(uid, `select kho_ipos_trang_thai($1) as v`, [cnA.id])).rows?.[0]?.v;
const cauHinh = async () => (await db.query(`select * from kho_ipos_cau_hinh where chi_nhanh_id = $1`, [cnA.id])).rows[0];

const dongHd = async ma => (await db.query(`
  select d.* from kho_ipos_dong d join kho_ipos_hoa_don h on h.id = d.hoa_don_id
  where h.chi_nhanh_id = $1 and h.ma_hd = $2 order by d.khoa_dong::int`, [cnA.id, ma])).rows;
const soCuaDong = async id => (await db.query(`
  select * from kho_so_cai where chung_tu_loai = 'ban_hang' and chung_tu_id = $1 order by created_at`, [id])).rows;

// ---- Event 11 mẫu (tự dựng) và bản chuẩn hóa như web gửi ---------------------
const POS_PARENT = 'BEEFTOWN';
const POS_ID = '5898';
/** Giờ VN "YYYY-MM-DD HH:mm:ss" n phút trước — tính từ MỘT mốc cố định lúc chạy test,
 *  để cùng một HĐ dựng lại (Hub bắn trùng) ra đúng cùng giờ bán, không lệch giây. */
const GOC_TEST = Date.now();
const gioVn = n => new Date(GOC_TEST + 7 * 3600000 - n * 60000).toISOString().slice(0, 19).replace('T', ' ');

function event11(tranId, items, { phutTruoc = 30 } = {}) {
  return {
    event_id: 11, event: 'sale_manager', timestamp: String(Date.now()),
    sale_manager: {
      pos_name: 'Beeftown thử', pos_type: 'ipos_pc', pos_parent: POS_PARENT, pos_id: Number(POS_ID),
      tran_id: String(tranId), tran_no: 'TA' + tranId, tran_date: gioVn(phutTruoc), created_at: gioVn(phutTruoc - 1),
      sale_type: 'TA', original_amount: 0, total_amount: 0, vat_amount: 0,
      membership_name: 'KHACH MAU', membership_id: '0900000000', sale_note: 'ghi chú của khách',
      items: items.map(it => ({ item_id: it.item_id, item_name: it.item_name ?? it.item_id, price: it.price ?? 100000,
                                quantity: it.quantity, amount: it.amount ?? 100000, discount_amount: 0 })),
      payment_info: [{ tran_id: 'PAY' + tranId, method_id: 'CASH', name: 'CASH', currency: 'VND', amount: 100000 }],
      delivery_info: { order_code: 'X1', address: '1 đường Mẫu, quận Thử', lng: 0, lat: 0 },
    },
  };
}
/** Chuẩn hóa như phanTichCallback của web — CỐ Ý để nguyên thông tin khách trong raw
 *  để kiểm lưới thứ hai của database. */
function chuanHoa(ev, { huy = false } = {}) {
  const s = ev.sale_manager;
  return {
    ma_hd: `${s.pos_id}:${s.tran_id}`,
    thoi_diem_ban: s.tran_date.replace(' ', 'T') + '+07:00',
    da_huy: huy,
    raw: ev,
    dong: s.items.map((it, i) => ({ khoa_dong: i, ma_ipos: it.item_id, ten_ipos: it.item_name,
                                    so_luong: it.quantity, thanh_tien: it.amount })),
  };
}
const hdMau = (tranId, items, tuyChon) => chuanHoa(event11(tranId, items, tuyChon));
const maHd = tranId => `${POS_ID}:${tranId}`;

async function cb(hoaDon, uid = MAY, cn = cnA.id) {
  const r = await duoi(uid, `select kho_ipos_nhan_callback($1, $2::jsonb) as kq`, [cn, JSON.stringify(hoaDon)]);
  return { kq: r.rows?.[0]?.kq, loi: r.loi };
}
const ganMa = (uid, ma, kieu, mh, dv, kg = null) => duoi(uid,
  `select kho_ipos_gan_ma_v2($1, $2, $3, $4, $5, $6) as v`, [cnA.id, ma, kieu, mh, dv, kg]);

let T1, T2, V1;

// ===========================================================================
await nhom('1 · CHUẨN BỊ: HÀNG Ở QUẦY, KẾT NỐI (KHÔNG ĐƯỜNG DẪN HÓA ĐƠN), TÌM CHI NHÁNH', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  ncc = (await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC A') returning id`)).rows[0].id;
  ok('Thăn cắt lát đếm gói, thịt vụn tính kg', MH['C-THANNGOAI'].dem_goi === true && MH['P-VUN'].dem_goi === false);

  [T1, T2] = await nhapHang([
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4, so_kg: 2, don_gia_kg: 700000, han_dung: await ngaySau(1) },
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4, so_kg: 2.4, don_gia_kg: 700000, han_dung: await ngaySau(3) },
  ], viTri.quay);
  [V1] = await nhapHang([{ mat_hang_id: MH['P-VUN'].id, so_kg: 3, don_gia_kg: 80000, han_dung: await ngaySau(2) }], viTri.quay);
  ok('Quầy: thăn lô T1 (4 gói × 0,5 kg), lô T2 (4 gói × 0,6 kg); thịt vụn 3 kg', T1 && T2 && V1);

  const khongCh = await cb(hdMau(1, [{ item_id: 'X', quantity: 1 }]));
  ok('Chưa có kết nối iPOS → callback báo lỗi rõ (web trả 500, Hub bắn lại)',
     khongCh.loi !== null && /chưa có kết nối iPOS/.test(khongCh.loi), khongCh.loi ?? '');

  const chu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id,
    JSON.stringify({ bat: true, pos_parent: POS_PARENT, pos_id: POS_ID, vi_tri_ban_id: viTri.quay })]);
  ok('Chủ bật kết nối — không cần đường dẫn hóa đơn: cấu hình đủ', chu.rows?.[0]?.v?.cau_hinh_du === true,
     chu.loi ?? JSON.stringify(chu.rows?.[0]?.v));
  const gio13 = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, '{"gio_mat_ket_noi": 13}'::jsonb)`, [cnA.id]);
  ok('Báo mất kết nối sau 13 giờ → từ chối (1–12)', gio13.loi !== null && /1 đến 12/.test(gio13.loi), gio13.loi ?? '');

  // Chưa chuyển sang trừ kho theo iPOS: dòng nằm chờ, callback sau KHÔNG quét lại nó.
  const c90 = await cb(hdMau(90, [{ item_id: 'X-CHO', quantity: 1 }], { phutTruoc: 5 * 24 * 60 }));
  const [d90] = await dongHd(maHd(90));
  ok('Chưa chuyển sang iPOS → dòng chờ, nói rõ lý do', c90.loi === null && d90?.trang_thai === 'cho'
     && /Chưa chuyển sang trừ kho/.test(d90.ly_do ?? ''), c90.loi ?? JSON.stringify(d90));
  const c91 = await cb(hdMau(91, [{ item_id: 'X-CHO', quantity: 1 }], { phutTruoc: 5 * 24 * 60 }));
  const [d90b] = await dongHd(maHd(90));
  ok('Callback sau không quét lại dòng chờ cũ (chỉ xử lý dòng mới)', c91.loi === null && c91.kq.dong.cho === 1
     && d90b.updated_at.getTime() === d90.updated_at.getTime(), JSON.stringify(c91.kq?.dong));
  const cs =await duoi(UID.chu, `select kho_ipos_chuyen_sang($1, $2::timestamptz)`, [cnA.id, TU_LUC]);
  ok('Chủ chuyển sang trừ kho theo iPOS', cs.loi === null, cs.loi ?? '');

  const tim = await duoi(MAY, `select kho_ipos_tim_chi_nhanh($1, $2) as id`, ['beeftown', ' 5898 ']);
  ok('Máy tìm được chi nhánh theo (pos_parent không phân biệt hoa thường, pos_id)', tim.rows?.[0]?.id === cnA.id,
     tim.loi ?? JSON.stringify(tim.rows));
  const lech = await duoi(MAY, `select kho_ipos_tim_chi_nhanh($1, $2) as id`, [POS_PARENT, '9999']);
  ok('pos_id không khớp → null (web trả 202, không lỗi)', lech.loi === null && lech.rows[0].id === null);
  const timB = await duoi(MAY_B, `select kho_ipos_tim_chi_nhanh($1, $2) as id`, [POS_PARENT, POS_ID]);
  ok('Máy Q7 không thấy kết nối của Q1', timB.loi === null && timB.rows[0].id === null);
  const timTk = await duoi(UID.thuKhoA, `select kho_ipos_tim_chi_nhanh($1, $2) as id`, [POS_PARENT, POS_ID]);
  ok('Thủ kho (không đồng bộ) → null', timTk.rows?.[0]?.id == null);
  await doiSoat('Chuẩn bị');
});

// ===========================================================================
await nhom('2 · CHƯA GHÉP → CHỜ; GHÉP v2 "BÁN THEO KG" CHO MÓN ĐẾM GÓI → GÓI NGUYÊN FEFO', async () => {
  const r = await cb(hdMau(101, [{ item_id: 'THAN-KG', item_name: 'Thăn bò cân', quantity: 1.05, amount: 735000 }]));
  const [d0] = await dongHd(maHd(101));
  ok('Callback vào hộp thư: 1 HĐ mới, mã HĐ = pos_id:tran_id', r.loi === null && r.kq.hd_moi === 1 && d0,
     r.loi ?? JSON.stringify(r.kq));
  ok('Dòng giữ số lượng gốc 1,05; chưa ghép → chua_khop', Number(d0.so_luong) === 1.05 && d0.trang_thai === 'chua_khop'
     && d0.khoa_dong === '0', JSON.stringify(d0));
  const cf = await cauHinh();
  ok('Ghi lần nhận hóa đơn và lần xử lý hộp thư', cf.nhan_hd_luc !== null && cf.hop_thu_luc !== null);

  const tk = await ganMa(UID.thuKhoA, 'THAN-KG', 'mon', MH['C-THANNGOAI'].id, 'kg');
  ok('Thủ kho KHÔNG ghép được', tk.loi !== null);
  const sai = await ganMa(UID.qlA, 'THAN-KG', 'mon', MH['C-THANNGOAI'].id, 'lit');
  ok('"Bán theo" lạ → từ chối', sai.loi !== null && /kg, gói hoặc suất/.test(sai.loi), sai.loi ?? '');
  const g = await ganMa(UID.qlA, 'THAN-KG', 'mon', MH['C-THANNGOAI'].id, 'kg');
  const [d] = await dongHd(maHd(101));
  ok('Ghép v2 (bán theo kg) → xử lý lại ngay: da_ghi', g.loi === null && g.rows[0].v.don_vi_ban === 'kg'
     && d.trang_thai === 'da_ghi', g.loi ?? JSON.stringify({ v: g.rows[0].v, d }));
  const so = await soCuaDong(d.id);
  const tT1 = await ton(T1.id, viTri.quay);
  // 0104: trừ ĐÚNG 1,05 kg, không hao hụt theo kg trung bình của gói — T1 giữ phần kg còn lại.
  ok('1,05 kg → 2 gói nguyên lô T1 (1,0 kg sổ, gần nhất), bán đúng 1,05 kg, KHÔNG dòng hao hụt; T1 còn 2 gói 0,95 kg',
     d.so_goi === 2 && Number(d.so_kg) === 1.05 && so.length === 1 && so[0].lo_id === T1.id && so[0].loai === 'ban'
       && Number(so[0].so_kg) === -1.05 && so[0].so_goi === -2 && tT1.goi === 2 && Math.abs(tT1.kg - 0.95) < 1e-9,
     JSON.stringify({ d: { so_goi: d.so_goi, so_kg: d.so_kg }, so, tT1 }));
  const { rows: [mp] } = await db.query(`select * from kho_ipos_ma_hang where ma_ipos = 'THAN-KG'`);
  ok('Bảng ghép nhớ tên iPOS và "bán theo"', mp.ten_ipos === 'Thăn bò cân' && mp.don_vi_ban === 'kg');
  await doiSoat('Bán theo kg');
});

// ===========================================================================
await nhom('3 · HUB BẮN TRÙNG → KHÔNG TRỪ ĐÔI; HAI DÒNG CÙNG item_id', async () => {
  const truoc = await soDongSo();
  const lai = await cb(hdMau(101, [{ item_id: 'THAN-KG', item_name: 'Thăn bò cân', quantity: 1.05, amount: 735000 }]));
  ok('Hub bắn lại đúng HĐ đó → trùng, không thêm dòng sổ nào',
     lai.kq?.hd_trung === 1 && lai.kq.hd_moi === 0 && await soDongSo() === truoc, JSON.stringify(lai.kq));

  await ganMa(UID.qlA, 'THAN-GOI', 'mon', MH['C-THANNGOAI'].id, 'goi');
  const t0 = await tonHang('C-THANNGOAI', viTri.quay);
  const r = await cb(hdMau(102, [
    { item_id: 'THAN-GOI', quantity: 1, amount: 350000 },
    { item_id: 'THAN-GOI', quantity: 1, amount: 350000 },
  ]));
  const ds = await dongHd(maHd(102));
  ok('Hai dòng cùng item_id → hai dòng riêng (khóa 0, 1), đều đã ghi 1 gói',
     r.kq?.so_dong === 2 && ds.length === 2 && ds.every(x => x.trang_thai === 'da_ghi' && x.so_goi === 1),
     JSON.stringify(ds.map(x => [x.khoa_dong, x.trang_thai, x.so_goi])));
  const t1 = await tonHang('C-THANNGOAI', viTri.quay);
  ok('Quầy bớt đúng 2 gói, kg theo sổ (không hao_hut)', t0.goi - t1.goi === 2
     && !(await soCuaDong(ds[0].id)).some(s => s.loai === 'hao_hut'), `${JSON.stringify(t0)} → ${JSON.stringify(t1)}`);
  ok('Gói bán theo gói lấy hết lô T1 trước (FEFO)', (await ton(T1.id, viTri.quay)).goi === 0);

  const le = await cb(hdMau(103, [{ item_id: 'THAN-GOI', quantity: 1.5 }]));
  const [dle] = await dongHd(maHd(103));
  ok('Món đếm gói mà iPOS báo 1,5 gói → loi, câu nói rõ (không hỏng lượt)', le.loi === null && dle.trang_thai === 'loi'
     && /số nguyên/.test(dle.ly_do), JSON.stringify(dle));
  await duoi(UID.qlA, `select kho_ipos_xu_ly_dong($1, 'bo_qua', 'Nhập nhầm')`, [dle.id]);
  await doiSoat('Bắn trùng');
});

// ===========================================================================
await nhom('4 · MÓN THEO KG BÁN THEO GÓI; SUẤT (MÓN CHẾ BIẾN); KHÔNG PHẢI HÀNG KHO', async () => {
  await ganMa(UID.qlA, 'VUN-GOI', 'mon', MH['P-VUN'].id, 'goi');
  await cb(hdMau(201, [{ item_id: 'VUN-GOI', quantity: 2 }]));
  const [a] = await dongHd(maHd(201));
  ok('Thịt vụn (kg) bán theo gói mà chưa điền "mỗi gói = … kg" → loi, nhắc điền',
     a.trang_thai === 'loi' && /mỗi gói/.test(a.ly_do), JSON.stringify(a));
  const kgSai = await ganMa(UID.qlA, 'VUN-GOI', 'mon', MH['P-VUN'].id, 'goi', 0);
  ok('Mỗi gói 0 kg → từ chối', kgSai.loi !== null);
  const v0 = await tonHang('P-VUN', viTri.quay);
  const g = await ganMa(UID.qlA, 'VUN-GOI', 'mon', MH['P-VUN'].id, 'goi', 0.25);
  const [a2] = await dongHd(maHd(201));
  ok('Điền mỗi gói = 0,25 kg → dòng lỗi được ghi lại: 2 gói = 0,5 kg', g.loi === null && a2.trang_thai === 'da_ghi'
     && Number(a2.so_kg) === 0.5 && Math.abs(v0.kg - (await tonHang('P-VUN', viTri.quay)).kg - 0.5) < 1e-9,
     g.loi ?? JSON.stringify(a2));

  const bo = await ganMa(UID.qlA, 'BO-NUONG', 'mon', MH['P-VUN'].id, 'suat');
  ok('Chọn "suất" → lưu kiểu bo_qua, không món kho', bo.rows?.[0]?.v?.kieu === 'bo_qua' && bo.rows[0].v.mat_hang_id === null
     && bo.rows[0].v.don_vi_ban === 'suat', bo.loi ?? JSON.stringify(bo.rows?.[0]?.v));
  const mon = await duoi(UID.qlA, `select kho_luu_mon($1, null, 'Bò nướng', 'BO-NUONG', true) as v`, [cnA.id]);
  ok('Món chế biến lập được định lượng (GĐ7b)', mon.loi === null, mon.loi ?? '');
  await ganMa(UID.qlA, 'NUOC', 'bo_qua', null, null);
  const truoc = await soDongSo();
  await cb(hdMau(202, [{ item_id: 'BO-NUONG', quantity: 3 }, { item_id: 'NUOC', quantity: 2 }]));
  const [s, n] = await dongHd(maHd(202));
  ok('Suất → bo_qua "Món chế biến", nước → bo_qua "Không phải hàng kho"; không ghi sổ',
     s.trang_thai === 'bo_qua' && /Món chế biến/.test(s.ly_do) && n.trang_thai === 'bo_qua' && /Không phải hàng kho/.test(n.ly_do)
       && await soDongSo() === truoc, JSON.stringify([s.ly_do, n.ly_do]));
  const { rows: dm } = await db.query(`select * from kho_dinh_muc_ban($1, $2::date, $3::date)`,
    [cnA.id, await ngaySau(-1), homNay]);
  ok('Định mức GĐ7b đếm đúng 3 suất Bò nướng (từ so_luong)', dm.length === 1 && Number(dm[0].so_suat) === 3,
     JSON.stringify(dm));

  const cu = await duoi(UID.qlA, `select kho_ipos_gan_ma($1, 'BO-NUONG', 'bo_qua', null) as v`, [cnA.id]);
  const { rows: [mp] } = await db.query(`select * from kho_ipos_ma_hang where ma_ipos = 'BO-NUONG'`);
  ok('Hàm ghép cũ cùng kiểu → giữ "suất"', cu.loi === null && mp.don_vi_ban === 'suat', cu.loi ?? JSON.stringify(mp));
  await doiSoat('Gói / suất');
});

// ===========================================================================
await nhom('5 · THIẾU HÀNG → HÀNG CHỜ → THỬ LẠI (DANH SÁCH RỖNG) → GHI', async () => {
  await ganMa(UID.qlA, 'VUN-KG', 'mon', MH['P-VUN'].id, null);
  const r = await cb(hdMau(301, [{ item_id: 'VUN-KG', quantity: 5 }]));
  const [d] = await dongHd(maHd(301));
  ok('Quầy không đủ 5 kg thịt vụn → thieu_hang, callback vẫn ok', r.loi === null && d.trang_thai === 'thieu_hang'
     && /cần 5 kg/.test(d.ly_do), r.loi ?? JSON.stringify(d));
  await nhapHang([{ mat_hang_id: MH['P-VUN'].id, so_kg: 5, don_gia_kg: 80000, han_dung: await ngaySau(4) }], viTri.quay);
  const lai = await cb([]);
  const [d2] = await dongHd(maHd(301));
  ok('Thử lại hàng chờ (cron gửi []) → da_ghi', lai.loi === null && lai.kq.dong.da_ghi >= 1 && d2.trang_thai === 'da_ghi',
     lai.loi ?? JSON.stringify(lai.kq));

  // Món đếm gói bán theo kg khi quầy thiếu: báo cả số gói và kg.
  const r2 = await cb(hdMau(302, [{ item_id: 'THAN-KG', quantity: 9 }]));
  const [t] = await dongHd(maHd(302));
  ok('Thăn bán 9 kg khi quầy chỉ còn ~2 kg → thieu_hang, nói số gói và kg', r2.loi === null && t.trang_thai === 'thieu_hang'
     && /gói \(9 kg\)/.test(t.ly_do), JSON.stringify(t));
  await duoi(UID.qlA, `select kho_ipos_xu_ly_dong($1, 'bo_qua', 'Thử nghiệm')`, [t.id]);
  await doiSoat('Hàng chờ');
});

// ===========================================================================
await nhom('6 · KHÔNG LƯU THÔNG TIN KHÁCH; HĐ SỬA / HỦY', async () => {
  const { rows: [h] } = await db.query(`select raw::text as t, raw from kho_ipos_hoa_don where ma_hd = $1`, [maHd(101)]);
  ok('raw không còn membership, ghi chú, thanh toán, địa chỉ giao hàng',
     !/membership|KHACH MAU|0900000000|payment|delivery|address|đường Mẫu|ghi chú của khách/.test(h.t), h.t);
  ok('raw vẫn giữ mã món, số lượng, giờ bán', h.raw?.sale_manager?.items?.[0]?.item_id === 'THAN-KG'
     && h.raw.sale_manager.tran_date);

  const vun0 = await tonHang('P-VUN', viTri.quay);
  const sua = await cb(hdMau(301, [{ item_id: 'VUN-KG', quantity: 4 }]));
  ok('Cùng mã HĐ, nội dung khác → sửa: đảo ngược rồi ghi lại 4 kg', sua.kq?.hd_sua === 1
     && Math.abs((await tonHang('P-VUN', viTri.quay)).kg - vun0.kg - 1) < 1e-9, JSON.stringify(sua.kq));
  const huy = await duoi(MAY, `select kho_ipos_nhan_callback($1, $2::jsonb) as kq`,
    [cnA.id, JSON.stringify(chuanHoa(event11(301, [{ item_id: 'VUN-KG', quantity: 4 }]), { huy: true }))]);
  const [d] = await dongHd(maHd(301));
  ok('HĐ hủy → dòng da_huy, tồn về như trước khi bán', huy.rows?.[0]?.kq?.hd_huy === 1 && d.trang_thai === 'da_huy'
     && Math.abs((await tonHang('P-VUN', viTri.quay)).kg - vun0.kg - 5) < 1e-9, huy.loi ?? JSON.stringify(d));
  await doiSoat('Sửa / hủy');
});

// ===========================================================================
await nhom('7 · ĐẾM QUẦY KHÔNG BỊ CHẶN KHI QUÁN VẮNG KHÁCH', async () => {
  const kid = (await duoi(UID.nvQuayA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_mat_hang', $3) as id`,
    [cnA.id, viTri.quay, maGui()])).rows?.[0]?.id;
  const { rows: [k0] } = await db.query(`select * from kho_kiem_ke where id = $1`, [kid]);
  const { rows: dong } = await db.query(`
    select d.mat_hang_id, m.dem_goi, coalesce(sum(t.so_goi), 0)::int as goi, coalesce(sum(t.so_kg), 0) as kg
    from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
    left join kho_ton t on t.mat_hang_id = d.mat_hang_id and t.vi_tri_id = $2
    where d.kiem_ke_id = $1 group by d.mat_hang_id, m.dem_goi`, [kid, viTri.quay]);
  await duoi(UID.nvQuayA, `select kho_luu_kiem_ke($1, $2, null, $3::jsonb)`, [kid, k0.phien_ban,
    JSON.stringify(dong.map(d => ({ mat_hang_id: d.mat_hang_id, so_goi_dem: d.dem_goi ? d.goi : null,
      so_kg_dem: d.dem_goi ? null : Number(d.kg), xac_nhan_het: true })))]);
  const pb = async () => (await db.query(`select phien_ban from kho_kiem_ke where id = $1`, [kid])).rows[0].phien_ban;

  // 5 giờ không có hóa đơn nào, watermark cũ — nhưng cron vẫn thử lại hàng chờ.
  await db.query(`update kho_ipos_cau_hinh set nhan_hd_luc = now() - interval '5 hours', dong_bo_den_luc = null,
    hop_thu_luc = now() - interval '20 minutes' where chi_nhanh_id = $1`, [cnA.id]);
  const g1 = await duoi(UID.nvQuayA, `select kho_gui_kiem_ke($1, $2)`, [kid, await pb()]);
  ok('Hộp thư chưa được xử lý 20 phút (cron dừng) → chưa gửi được', g1.loi !== null && /hơn 10 phút/.test(g1.loi), g1.loi ?? '');
  await cb([]);
  const g2 = await duoi(UID.nvQuayA, `select kho_gui_kiem_ke($1, $2)`, [kid, await pb()]);
  ok('Thử lại hàng chờ vừa chạy, 5 giờ không có hóa đơn → vẫn gửi được', g2.loi === null, g2.loi ?? '');
  const d = await duoi(UID.qlA, `select kho_duyet_kiem_ke($1)`, [kid]);
  ok('Duyệt được', d.loi === null, d.loi ?? '');
  await doiSoat('Đếm quầy');
});

// ===========================================================================
await nhom('8 · MẤT KẾT NỐI = LÂU KHÔNG NHẬN HÓA ĐƠN TRONG GIỜ MỞ CỬA', async () => {
  const { rows: [{ h }] } = await db.query(
    `select extract(epoch from bay_gio_vn() - date_trunc('day', bay_gio_vn())) / 3600 as h`);
  const gio = Number(h);
  await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, '{"gio_mo_cua": 0, "gio_dong_cua": 24, "gio_mat_ket_noi": 1}'::jsonb)`, [cnA.id]);
  await db.query(`update kho_ipos_cau_hinh set nhan_hd_luc = now() - interval '3 hours', bat_luc = now() - interval '2 days',
    loi_tu_luc = null where chi_nhanh_id = $1`, [cnA.id]);
  const tt = await trangThai();
  if (gio >= 1.05) {
    ok('Mở cửa cả ngày, 3 giờ không nhận hóa đơn (ngưỡng 1 giờ) → đèn đỏ, nói rõ',
       tt.den === 'do' && tt.mat_ket_noi && /không nhận được hóa đơn/.test(tt.cau), JSON.stringify({ den: tt.den, cau: tt.cau }));
    const ev = await suKien(UID.qlA, 'ipos_mat_ket_noi');
    ok('Quản lý có thông báo mất kết nối (phu = cham), mốc đã tới', ev.length === 1 && ev[0].phu === 'cham'
       && new Date(ev[0].luc) <= new Date(), JSON.stringify(ev));
  } else if (gio < 0.95) {
    ok('(Vừa qua nửa đêm VN — mốc tính từ giờ mở cửa hôm nay nên chưa báo)', tt.mat_ket_noi === false);
  } else {
    // 00:57–01:03 giờ VN: mở cửa từ 0h đúng ~1 giờ = đúng ngưỡng — báo hay chưa tùy vài giây, không khẳng định.
    // (Trước đây nhánh trên ôm cả 01:00–01:03 và đòi "chưa báo" — sai, lượt chạy lúc 01:01 VN đỏ oan.)
    ok('(Sát mốc 1 giờ sau nửa đêm VN — bỏ qua khẳng định)', true);
  }
  // Quán đóng cửa lúc này → không báo dù lâu không có hóa đơn.
  const hh = Math.floor(gio);
  const dong = hh <= 21 ? { gio_mo_cua: hh + 1, gio_dong_cua: hh + 2 } : { gio_mo_cua: 0, gio_dong_cua: hh };
  await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb)`, [cnA.id, JSON.stringify(dong)]);
  ok('Ngoài giờ mở cửa → không báo mất kết nối', (await trangThai()).mat_ket_noi === false);
  ok('Thủ kho không có thông báo mất kết nối', (await suKien(UID.thuKhoA, 'ipos_mat_ket_noi')).length === 0);

  await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, '{"gio_mo_cua": 0, "gio_dong_cua": 24}'::jsonb)`, [cnA.id]);
  await cb(hdMau(401, [{ item_id: 'NUOC', quantity: 1 }]));
  ok('Nhận hóa đơn mới → hết mất kết nối', (await trangThai()).mat_ket_noi === false
     && (await suKien(UID.qlA, 'ipos_mat_ket_noi')).length === 0);

  // Lượt cron lỗi (vd. đọc thực đơn lỗi) → báo "loi"; lượt sau tốt → hết.
  const b = (await duoi(MAY, `select kho_ipos_bat_dau($1, 'cron') as kq`, [cnA.id])).rows[0].kq;
  await duoi(MAY, `select kho_ipos_ket_thuc($1, 'Không đọc được thực đơn iPOS (HTTP 401)')`, [b.lan_id]);
  const ev2 = await suKien(UID.qlA, 'ipos_mat_ket_noi');
  ok('Lượt cron lỗi → thông báo phu = loi', ev2.length === 1 && ev2[0].phu === 'loi', JSON.stringify(ev2));
  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '2 minutes'`);
  const b2 = (await duoi(MAY, `select kho_ipos_bat_dau($1, 'cron') as kq`, [cnA.id])).rows[0].kq;
  await duoi(MAY, `select kho_ipos_ket_thuc($1, null)`, [b2.lan_id]);
  ok('Lượt sau tốt → hết thông báo', (await suKien(UID.qlA, 'ipos_mat_ket_noi')).length === 0);
});

// ===========================================================================
await nhom('9 · THỰC ĐƠN iPOS; bat_dau(callback) KHÔNG KHÓA LƯỢT', async () => {
  await db.query(`insert into kho_ipos_ma_hang (chi_nhanh_id, ma_ipos, kieu) values ($1, 'MOI-CHUA-TEN', 'bo_qua')`, [cnA.id]);
  const m = await duoi(MAY, `select kho_ipos_luu_menu($1, $2::jsonb) as v`, [cnA.id, JSON.stringify([
    { ma_ipos: 'THAN-KG', ten_ipos: 'Thăn bò cân', loai: 'Thịt', dang_ban: true },
    { ma_ipos: 'MOI-CHUA-TEN', ten_ipos: 'Món mới', loai: 'Món' },
    { ma_ipos: 'MOI-CHUA-TEN', ten_ipos: 'Trùng' },
    { ma_ipos: '  ' }, 'rác',
  ])]);
  ok('Máy lưu thực đơn: mã trùng / trống bị bỏ, mã đã ghép chưa có tên được đặt tên',
     m.loi === null && m.rows[0].v.so_mon === 2 && m.rows[0].v.dat_ten === 1, m.loi ?? JSON.stringify(m.rows?.[0]?.v));
  const tk = await duoi(UID.thuKhoA, `select * from kho_ipos_menu`);
  ok('Thủ kho đọc được thực đơn — không có cột tiền', tk.loi === null && tk.rows.length === 2
     && khoaTien(tk.rows).length === 0, tk.loi ?? JSON.stringify(tk.rows));
  const m2 = await duoi(MAY, `select kho_ipos_luu_menu($1, $2::jsonb) as v`, [cnA.id,
    JSON.stringify([{ ma_ipos: 'THAN-KG', ten_ipos: 'Thăn bò cân' }])]);
  ok('Món không còn trên iPOS → bỏ khỏi thực đơn', m2.rows?.[0]?.v?.bo === 1);

  const bao = await duoi(MAY, `select kho_ipos_bao_menu_doi($1)`, [cnA.id]);
  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '2 minutes'`);
  const b = (await duoi(MAY, `select kho_ipos_bat_dau($1, 'cron') as kq`, [cnA.id])).rows[0].kq;
  ok('iPOS báo thực đơn đổi → lượt cron thấy cờ làm mới', bao.loi === null && b.menu_can_lam_moi === true, JSON.stringify(b));

  const c = (await duoi(MAY, `select kho_ipos_bat_dau($1, 'callback') as kq`, [cnA.id])).rows[0].kq;
  ok('Đang có lượt cron giữ khóa mà bat_dau(callback) vẫn được', c.duoc === true, JSON.stringify(c));
  const n = await duoi(MAY, `select kho_ipos_nhan($1, $2, $3::jsonb, null) as kq`, [cnA.id, c.lan_id,
    JSON.stringify([hdMau(501, [{ item_id: 'NUOC', quantity: 1 }])])]);
  ok('… gửi hóa đơn bằng lượt callback đó được', n.loi === null && n.rows[0].kq.hd_moi === 1, n.loi ?? '');
  await duoi(MAY, `select kho_ipos_ket_thuc($1, null)`, [c.lan_id]);
  const n2 = await duoi(MAY, `select kho_ipos_nhan($1, $2, '[]'::jsonb, null)`, [cnA.id, c.lan_id]);
  ok('Lượt callback đã kết thúc → không gửi thêm được', n2.loi !== null);
  await duoi(MAY, `select kho_ipos_luu_menu($1, '[]'::jsonb)`, [cnA.id]);
  await duoi(MAY, `select kho_ipos_ket_thuc($1, null)`, [b.lan_id]);
  ok('Lưu thực đơn → tắt cờ làm mới', (await cauHinh()).menu_can_lam_moi === false);
});

// ===========================================================================
await nhom('10 · KẾT NỐI TẮT: VẪN CẤT HỘP THƯ, CHƯA TRỪ KHO', async () => {
  await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, '{"bat": false}'::jsonb)`, [cnA.id]);
  const truoc = await soDongSo();
  const r = await cb(hdMau(601, [{ item_id: 'VUN-KG', quantity: 0.2 }]));
  const [d] = await dongHd(maHd(601));
  ok('Tắt kết nối: hóa đơn vẫn vào hộp thư (không mất), dòng chờ, không ghi sổ',
     r.loi === null && r.kq.da_ghi_so === false && d.trang_thai === 'cho' && await soDongSo() === truoc,
     r.loi ?? JSON.stringify({ kq: r.kq, d }));
  await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, '{"bat": true}'::jsonb)`, [cnA.id]);
  await cb([]);
  ok('Bật lại → lượt thử lại ghi dòng đó', (await dongHd(maHd(601)))[0].trang_thai === 'da_ghi');
  await doiSoat('Tắt kết nối');
});

// ===========================================================================
await nhom('11 · MÁY may_ipos CHỈ GỌI ĐƯỢC HÀM ĐỒNG BỘ; AI KHÔNG ĐƯỢC NHẬN CALLBACK', async () => {
  for (const [ten, uid] of [['NV quầy', UID.nvQuayA], ['thủ kho', UID.thuKhoA], ['kế toán', UID.keToanA]]) {
    const r = await cb([], uid);
    ok(`${ten} KHÔNG gọi được kho_ipos_nhan_callback`, r.loi !== null && /không đồng bộ được/.test(r.loi), r.loi ?? 'GỌI ĐƯỢC');
    const m = await duoi(uid, `select kho_ipos_luu_menu($1, '[]'::jsonb)`, [cnA.id]);
    ok(`${ten} KHÔNG lưu được thực đơn`, m.loi !== null);
  }
  const anon = await duoiAnon(`select kho_ipos_nhan_callback($1, '[]'::jsonb)`, [cnA.id]);
  ok('anon KHÔNG gọi được', anon.loi !== null && /permission denied/i.test(anon.loi), anon.loi ?? '');
  const b = await cb(hdMau(701, [{ item_id: 'NUOC', quantity: 1 }]), MAY_B, cnA.id);
  ok('Máy Q7 KHÔNG gửi hóa đơn vào Q1', b.loi !== null);
  const ql = await cb([], UID.qlA);
  ok('Quản lý (có dong_bo_ban) gọi được — "Cập nhật ngay"', ql.loi === null, ql.loi ?? '');

  const khac = [
    ['kho_ipos_gan_ma_v2', `select kho_ipos_gan_ma_v2($1, 'X', 'bo_qua', null, null, null)`, [cnA.id]],
    ['kho_ipos_trang_thai', `select kho_ipos_trang_thai($1)`, [cnA.id]],
    ['kho_ipos_luu_cau_hinh', `select kho_ipos_luu_cau_hinh($1, '{"bat": false}'::jsonb)`, [cnA.id]],
    ['kho_ipos_xu_ly_dong', `select kho_ipos_xu_ly_dong(gen_random_uuid(), 'bo_qua', null)`, []],
    ['kho_dem_viec', `select kho_dem_viec($1)`, [cnA.id]],
  ];
  for (const [ham, sql, ts] of khac) {
    const r = await duoi(MAY, sql, ts);
    ok(`Máy iPOS KHÔNG gọi được ${ham}`, r.loi !== null, r.loi ?? 'GỌI ĐƯỢC');
  }
  for (const ham of ['kho_ipos_nhan_hd(gen_random_uuid(), null, \'[]\'::jsonb, true)', 'kho_ipos_bo_pii(\'{}\'::jsonb)',
                     'kho_ipos_goi_theo_kg(gen_random_uuid(), gen_random_uuid(), 1)']) {
    const r = await duoi(MAY, `select ${ham}`);
    ok(`Không ai gọi thẳng được hàm nội bộ ${ham.split('(')[0]}`, r.loi !== null && /permission denied/i.test(r.loi), r.loi ?? '');
  }
  const { rows: bang } = await db.query(
    `select tablename from pg_tables where schemaname = 'public' and tablename like 'kho\\_%' order by 1`);
  const lot = [];
  for (const { tablename } of bang) {
    const r = await duoi(MAY, `select count(*)::int as n from ${tablename}`);
    if (r.loi === null && r.rows[0].n > 0) lot.push(`${tablename}(${r.rows[0].n})`);
  }
  ok('Máy iPOS không đọc được dòng nào ở bảng kho (kể cả thực đơn)', lot.length === 0, lot.join(', '));
  for (const [ten, uid] of [['thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA]]) {
    const r = await duoi(uid, `select count(*)::int as n from kho_v_ipos_dong`);
    ok(`${ten} không đọc được dòng bán iPOS (có tiền)`, r.rows?.[0]?.n === 0, r.loi ?? `thấy ${r.rows?.[0]?.n}`);
  }
  const tt = await trangThai(UID.thuKhoA);
  ok('Trạng thái mới (lần nhận hóa đơn, thực đơn) — thủ kho không thấy khóa tiền', tt && 'nhan_hd_luc' in tt
     && 'menu_luc' in tt && khoaTien(tt).length === 0, JSON.stringify(tt));
  await doiSoat('Cuối');
});

process.exit(ketThuc('iPOS ĐẨY HÓA ĐƠN'));
