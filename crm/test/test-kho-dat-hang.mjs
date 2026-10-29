/**
 * BEEFTOWN KHO — Kiểm thử đặt hàng nhà cung cấp, nhận hàng theo đơn, đánh giá NCC (0039, GĐ8a)
 * ============================================================================================
 *
 *     node test/test-kho-dat-hang.mjs
 *
 * Những điều phải đúng:
 *   · Gợi ý đặt hàng đúng công thức: cần (mức tối đa kho lạnh, hoặc dùng TB 28
 *     ngày × (số ngày giao + 3)) − (tồn kho + quầy + đang mang ra quầy + đã đặt
 *     chưa về). Dùng = bán + xuất bếp + hủy + xuất khác + pha lóc; chuyển quầy,
 *     trả NCC không tính. Món của NCC theo danh mục NCC – món (0111; trước đó: NCC mua gần nhất —
 *     các kiểm tra dưới vẫn đúng vì mỗi món ở đây chỉ một NCC giao). Đặt theo món: test-kho-dat-hang-theo-mon.mjs.
 *   · Thủ kho lập đơn NHÁP chỉ kg (gửi giá là bị từ chối; sửa lại đơn thì giá
 *     quản lý đã điền không mất); quản lý / chủ gửi; hủy nháp / hủy đơn đã gửi
 *     (bắt buộc lý do); ma_gui chống trùng; phien_ban chống ghi đè.
 *   · Nhận theo đơn: phiếu nháp điền sẵn món / kg còn thiếu; gửi / duyệt →
 *     nhan_mot_phan rồi da_nhan; hủy / từ chối phiếu → đơn quay lại.
 *   · Báo cáo NCC đúng số: giá TB, thu hồi, trả hàng, lệch hóa đơn, ngày trả,
 *     giao thiếu / trễ, điểm sao; thủ kho không thấy tiền.
 *   · Sự kiện don_dat_tre cho quản lý; kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';
import { cauSuKien, KHOA_SU_KIEN } from '../../web/src/lib/kho/viec.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ ĐẶT HÀNG NHÀ CUNG CẤP');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// Như test-kho-thu-kho: tên khóa có dáng tiền. "giao" (ngày giao) chứa "gia"
// nhưng là chữ — liệt kê đích danh.
const LA_TIEN = /gia|tien|thanh_tien|gia_von|gia_tri|thue|chi_phi|phai_tra|con_no|da_tra|giam_tru/;
const KHOA_CHU = new Set(['dien_giai', 'ngay_giao_du_kien', 'so_ngay_giao']);
function khoaTien(v, duong = '') {
  const ra = [];
  if (Array.isArray(v)) v.forEach((x, i) => ra.push(...khoaTien(x, `${duong}[${i}]`)));
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (LA_TIEN.test(k) && !KHOA_CHU.has(k)) ra.push(`${duong}.${k}`);
      ra.push(...khoaTien(x, `${duong}.${k}`));
    }
  }
  return ra;
}
const GIA = { than: 500000, nac: 350000, my: 700000, du_kien_than: 480000, du_kien_nac: 361700 };
const coTien = s => !!s && (/\d[\d.,]*\s*(đồng|₫|đ)(?![\p{L}])/u.test(s)
  || Object.values(GIA).some(g => s.includes(String(g)) || s.includes(g.toLocaleString('vi-VN'))));

const MH = {};
let viTri = {};
let nccUc, nccMy, nccB;
let pnUc, pnMy;          // phiếu mua lịch sử (quản lý, có giá)
let phienId;

/** Phiếu mua qua luồng có giá của quản lý (0020): lưu → gửi → duyệt. */
async function nhapCu({ ncc, ngayNhap, dong, vt = viTri.kho }) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null,
      p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), ncc, vt, ngayNhap, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const d = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (d.loi) throw new Error(d.loi);
  return p.phieu_id;
}

const loCua = async (phieuId, ma) => (await db.query(`
  select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
  join kho_mat_hang m on m.id = d.mat_hang_id where d.phieu_nhap_id = $1 and m.ma = $2`, [phieuId, ma])).rows[0];

const xuat = (uid, t) => duoi(uid, `
  select * from kho_tao_phieu_xuat(
    p_chi_nhanh_id => $1, p_ma_gui => $2, p_loai => $3, p_vi_tri_id => $4, p_vi_tri_den_id => $5,
    p_ly_do_id => null, p_ghi_chu => null, p_anh => '{}'::text[], p_dong => $6::jsonb)`,
  [cnA.id, maGui(), t.loai, t.tu, t.den ?? null, JSON.stringify(t.dong ?? [])]);

/** Lưu đơn đặt hàng. */
const luuDon = (uid, t) => duoi(uid, `
  select * from kho_luu_don_dat(
    p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
    p_ncc => $5, p_ngay_giao => $6::date, p_ghi_chu => $7, p_dong => $8::jsonb)`,
  [t.id ?? null, t.cn ?? cnA.id, t.maGui ?? maGui(), t.phienBan ?? null, t.ncc,
   t.ngayGiao ?? null, t.ghiChu ?? null, JSON.stringify(t.dong ?? [])]);
const guiDon = (uid, id, pb) => duoi(uid, `select kho_gui_don_dat($1, $2) as cau`, [id, pb]);
const huyDon = (uid, id, lyDo) => duoi(uid, `select kho_huy_don_dat($1, $2) as cau`, [id, lyDo]);
const don = async id => (await db.query(`select * from kho_don_dat where id = $1`, [id])).rows[0];
const dongDon = async id => Object.fromEntries((await db.query(`
  select m.ma, d.* from kho_don_dat_dong d join kho_mat_hang m on m.id = d.mat_hang_id
  where d.don_dat_id = $1`, [id])).rows.map(r => [r.ma, r]));
const docDon = (uid, id) => duoi(uid, `select kho_doc_don_dat_kg($1) as d`, [id]);
const goiY = (uid, ncc, cn = cnA.id) => duoi(uid, `select * from kho_goi_y_dat_hang($1, $2)`, [cn, ncc]);
const theoMa = rows => Object.fromEntries((rows ?? []).map(r => [r.ma, r]));
const tuDon = (uid, id, g = maGui()) => duoi(uid, `select kho_tao_phieu_nhap_tu_don($1, $2) as id`, [id, g]);
const phienBan = async id => (await db.query(`select phien_ban from kho_phieu_nhap where id = $1`, [id])).rows[0].phien_ban;
const anh = () => `${cnA.id}/nhap/${maGui()}/1.jpg`;

/** Thủ kho lưu phiếu nhận hàng chỉ kg (0031). */
const luuKg = (uid, t) => duoi(uid, `
  select * from kho_luu_phieu_nhap_kg(
    p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
    p_loai => 'mua', p_nha_cung_cap_id => $5, p_vi_tri_id => $6, p_ngay_nhap => $7::date,
    p_so_hoa_don => null, p_ngay_hoa_don => null, p_ghi_chu => null,
    p_anh_them => $8::text[], p_truong_them => '{}'::jsonb, p_dong => $9::jsonb)`,
  [t.id, cnA.id, maGui(), t.phienBan, t.ncc, viTri.kho, homNay, t.anh ?? [], JSON.stringify(t.dong)]);
const guiPhieu = async (uid, id) => duoi(uid, `select kho_gui_duyet_phieu_nhap($1, $2) as cau`, [id, await phienBan(id)]);

/** Kế toán điền giá mọi dòng rồi duyệt. */
async function giaVaDuyet(id, giaTheoMa) {
  const { rows } = await db.query(`
    select d.id, m.ma from kho_phieu_nhap_dong d join kho_mat_hang m on m.id = d.mat_hang_id
    where d.phieu_nhap_id = $1`, [id]);
  const g = await duoi(UID.keToanA, `
    select kho_dien_gia_phieu_nhap(p_id => $1, p_phien_ban => $2, p_so_hoa_don => null, p_ngay_hoa_don => null,
      p_han_thanh_toan => null, p_tien_thue => 0, p_chi_phi_khac => 0, p_gia => $3::jsonb)`,
    [id, await phienBan(id), JSON.stringify(rows.map(r => ({ dong_id: r.id, don_gia_kg: giaTheoMa[r.ma] })))]);
  if (g.loi) return g;
  return duoi(UID.keToanA, `select kho_duyet_phieu_nhap($1) as cau`, [id]);
}

// ===========================================================================
await nhom('1 · CHUẨN BỊ: KHO, NCC, LỊCH SỬ MUA, DÙNG 28 NGÀY', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));

  const ncc = async ten => (await duoi(UID.keToanA,
    `insert into kho_nha_cung_cap (ten) values ($1) returning id, so_ngay_giao`, [ten])).rows[0];
  const uc = await ncc('NCC Úc');
  nccUc = uc.id;
  nccMy = (await ncc('NCC Mỹ')).id;
  nccB = (await ncc('NCC Chỉ Q7')).id;
  ok('NCC mới: số ngày giao mặc định 1', uc.so_ngay_giao === 1);
  const sua = await duoi(UID.keToanA, `update kho_nha_cung_cap set so_ngay_giao = 2 where id = $1 returning id`, [nccUc]);
  ok('Vai ncc sửa được số ngày giao (NCC Úc: 2 ngày)', sua.loi === null && sua.rows.length === 1, sua.loi ?? '');
  const am = await duoi(UID.keToanA, `update kho_nha_cung_cap set so_ngay_giao = -1 where id = $1`, [nccUc]);
  ok('Số ngày giao âm bị chặn', am.loi !== null);
  const thu = await duoi(UID.keToanA, `update kho_nha_cung_cap set ngay_giao_trong_tuan = '{0,8}' where id = $1`, [nccUc]);
  ok('Thứ giao ngoài 1–7 bị chặn', thu.loi !== null);

  // NCC Úc (10 ngày trước): thăn ngoại 4 tảng 56 kg, nạc vai 1 tảng 10 kg.
  pnUc = await nhapCu({ ncc: nccUc, ngayNhap: await ngay(-10), dong: [
    { mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 4, so_kg: 56, don_gia_kg: GIA.than },
    { mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 10, don_gia_kg: GIA.nac }] });
  // NCC Mỹ (5 ngày trước): thăn ngoại cắt lát 20 gói 10 kg.
  pnMy = await nhapCu({ ncc: nccMy, ngayNhap: await ngay(-5), dong: [
    { mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 20, so_kg: 10, don_gia_kg: GIA.my, han_dung: await ngay(5) }] });
  ok('Hai phiếu mua lịch sử đã duyệt', !!pnUc && !!pnMy);

  // Dùng: xuất bếp 2 tảng thăn ngoại (28 kg); pha lóc cả tảng nạc vai (10 kg);
  // xuất bếp 6 gói thăn cắt lát (3 kg).
  const xb = await xuat(UID.thuKhoA, { loai: 'xuat_bep', tu: viTri.kho,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 2 }] });
  ok('Xuất bếp 2 tảng thăn ngoại', xb.loi === null, xb.loi ?? '');
  const xb2 = await xuat(UID.thuKhoA, { loai: 'xuat_bep', tu: viTri.kho,
    dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 6 }] });
  ok('Xuất bếp 6 gói thăn cắt lát', xb2.loi === null, xb2.loi ?? '');

  const loNac = await loCua(pnUc, 'T-NACVAI');
  const p = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_mat_hang_vao_id => $3, p_cong_thuc_id => null, p_ngay_pha => $4::date,
      p_ghi_chu => null, p_vao => $5::jsonb, p_ra => $6::jsonb)`,
    [cnA.id, maGui(), MH['T-NACVAI'].id, homNay, JSON.stringify([{ lo_id: loNac.id, vi_tri_id: viTri.kho }]),
     JSON.stringify([{ mat_hang_id: MH['C-NACVAI'].id, so_kg: 8, so_goi: 16, xu_ly: 'nhap_kho', vi_tri_id: viTri.kho },
                     { mat_hang_id: MH['P-MO'].id, so_kg: 1.5, xu_ly: 'bo' }])]);
  phienId = p.rows?.[0]?.phieu_id ?? p.rows?.[0]?.phien_id ?? p.rows?.[0]?.id;
  const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, $2) as cau`, [phienId, p.rows?.[0]?.phien_ban_moi]);
  ok('Pha lóc cả tảng nạc vai, chốt', p.loi === null && c.loi === null, p.loi ?? c.loi ?? '');

  // Trả NCC Mỹ 2 gói (1 kg) — không tính là "dùng".
  const loMy = await loCua(pnMy, 'C-THANNGOAI');
  const tra = await duoi(UID.keToanA, `
    select * from kho_tra_nha_cung_cap(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_phieu_nhap_id => $3, p_vi_tri_id => $4, p_ghi_chu => 'Gói rách',
      p_anh => '{}'::text[], p_so_tien_giam_tru => null, p_dong => $5::jsonb)`,
    [cnA.id, maGui(), pnMy, viTri.kho, JSON.stringify([{ lo_id: loMy.id, so_kg: 1, so_goi: 2 }])]);
  ok('Kế toán trả NCC Mỹ 2 gói (1 kg)', tra.loi === null, tra.loi ?? '');

  // Hàng đi đường: bật "Quầy phải bấm nhận", thủ kho mang 4 gói (2 kg) ra quầy.
  await db.query(`update kho_cai_dat set chuyen_quay_can_nhan = true where chi_nhanh_id = $1`, [cnA.id]);
  const ch = await xuat(UID.thuKhoA, { loai: 'chuyen', tu: viTri.kho, den: viTri.quay,
    dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 4 }] });
  const { rows: [pc] } = await db.query(`select trang_thai from kho_phieu_xuat where id = $1`, [ch.rows?.[0]?.phieu_id]);
  ok('4 gói đang mang ra quầy (chưa bấm nhận)', ch.loi === null && pc?.trang_thai === 'dang_chuyen', ch.loi ?? pc?.trang_thai);
  await doiSoat('Sau chuẩn bị');
});

// ===========================================================================
await nhom('2 · MỨC KHO LẠNH CỦA MẶT HÀNG (kho_luu_muc_dat_hang)', async () => {
  const luu = (uid, ma, min, max) => duoi(uid, `select kho_luu_muc_dat_hang($1, $2, $3) as cau`, [MH[ma].id, min, max]);
  const a = await luu(UID.qlA, 'T-THANNGOAI', 20, 50);
  ok('Quản lý lưu mức 20–50 kg cho thăn ngoại tảng', a.loi === null, a.loi ?? '');
  const b = await luu(UID.qlA, 'C-THANNGOAI', null, 12);
  ok('Chỉ mức tối đa (12 kg) cho thăn cắt lát', b.loi === null, b.loi ?? '');
  const tk = await luu(UID.thuKhoA, 'T-NACVAI', 1, 5);
  ok('Thủ kho KHÔNG lưu được (danh_muc)', tk.loi !== null);
  const nguoc = await luu(UID.qlA, 'T-NACVAI', 9, 5);
  ok('Tối thiểu lớn hơn tối đa bị chặn', nguoc.loi !== null && /tối thiểu không được lớn hơn/.test(nguoc.loi), nguoc.loi ?? '');
  const khong = await luu(UID.qlA, 'T-NACVAI', null, 0);
  ok('Tối đa = 0 bị chặn', khong.loi !== null);
  const { rows: [m] } = await db.query(`select kho_toi_thieu_kg, kho_toi_da_kg from kho_mat_hang where id = $1`, [MH['T-THANNGOAI'].id]);
  ok('Đã ghi vào mặt hàng', Number(m.kho_toi_thieu_kg) === 20 && Number(m.kho_toi_da_kg) === 50);
  const tkDoc = await duoi(UID.thuKhoA, `select kho_toi_da_kg from kho_mat_hang where ma = 'T-THANNGOAI'`);
  ok('Thủ kho đọc được mức (không phải tiền)', Number(tkDoc.rows?.[0]?.kho_toi_da_kg) === 50);
});

// ===========================================================================
await nhom('3 · GỢI Ý ĐẶT HÀNG ĐÚNG CÔNG THỨC (chưa có đơn nào)', async () => {
  const r = await goiY(UID.thuKhoA, nccUc);
  ok('Thủ kho gọi được gợi ý', r.loi === null, r.loi ?? '');
  const g = theoMa(r.rows);
  ok('NCC Úc: đúng 2 món mua gần nhất của NCC này', Object.keys(g).sort().join() === 'T-NACVAI,T-THANNGOAI',
     Object.keys(g).join());

  const t = g['T-THANNGOAI'];
  ok('Thăn ngoại: tồn 28, dùng 28 ngày 28 kg, TB 1 kg/ngày',
     Number(t?.ton_kg) === 28 && Number(t.dung_28_ngay_kg) === 28 && Number(t.dung_tb_ngay_kg) === 1, JSON.stringify(t));
  ok('Thăn ngoại: có mức tối đa → cần 50, đề nghị 50 − 28 = 22 kg, 2 tảng (14 kg/tảng)',
     Number(t?.muc_can_kg) === 50 && Number(t.de_nghi_kg) === 22 && t.de_nghi_goi === 2 && t.so_ngay_giao === 2,
     JSON.stringify(t));
  ok('Thăn ngoại: không dưới tối thiểu (28 ≥ 20)', t?.duoi_toi_thieu === false);
  ok('Lý do bằng lời', /Cần 50 kg \(mức tối đa kho lạnh\); đang có 28 kg → nên đặt 22 kg/.test(t?.ly_do ?? ''), t?.ly_do);

  const n = g['T-NACVAI'];
  // TB = 10 / 28 = 0,357; cần = 0,357 × (2 + 3) = 1,785; đề nghị làm tròn lên 0,1 = 1,8
  ok('Nạc vai (pha lóc tính là dùng): TB 0,357 kg/ngày × 5 ngày = 1,785 kg → đặt 1,8 kg',
     Number(n?.dung_28_ngay_kg) === 10 && Number(n.dung_tb_ngay_kg) === 0.357 && Number(n.muc_can_kg) === 1.785
       && Number(n.de_nghi_kg) === 1.8 && n.de_nghi_goi === 1, JSON.stringify(n));
  ok('Lý do nêu cách tính TB', /dùng TB 0,4 kg\/ngày × 5 ngày: 2 ngày chờ hàng \+ 3 ngày dự phòng/.test(n?.ly_do ?? ''), n?.ly_do);

  const my = theoMa((await goiY(UID.qlA, nccMy)).rows)['C-THANNGOAI'];
  ok('Thăn cắt lát (NCC Mỹ): tồn kho 4 kg + đang mang ra quầy 2 kg; trả NCC, chuyển quầy KHÔNG tính là dùng',
     Number(my?.ton_kg) === 4 && Number(my.dang_chuyen_kg) === 2 && Number(my.dung_28_ngay_kg) === 3, JSON.stringify(my));
  ok('Thăn cắt lát: đề nghị 12 − 6 = 6 kg = 12 gói', Number(my?.de_nghi_kg) === 6 && my.de_nghi_goi === 12, JSON.stringify(my));
  ok('Lý do có "đang mang ra quầy"', /đang mang ra quầy 2 kg/.test(my?.ly_do ?? ''), my?.ly_do);

  const tat = await goiY(UID.qlA, null);
  ok('Không chọn NCC: mọi món đã từng mua, kèm NCC gần nhất',
     tat.rows?.length === 3 && theoMa(tat.rows)['C-THANNGOAI'].nha_cung_cap_id === nccMy, JSON.stringify(tat.rows?.map(x => x.ma)));
  ok('Món cần đặt lên đầu', tat.rows?.[0]?.de_nghi_kg > 0);

  ok('Không khóa tiền nào trong gợi ý', khoaTien(r.rows).length === 0, khoaTien(r.rows).join(', '));
  const nv = await goiY(UID.nvQuayA, nccUc);
  ok('NV quầy KHÔNG xem được gợi ý', nv.loi !== null);
  const b = await goiY(UID.thuKhoB, nccUc);
  ok('Thủ kho Q7 KHÔNG xem gợi ý Q1', b.loi !== null);
});

// ===========================================================================
let DH1, DH3;
await nhom('4 · LẬP, SỬA, GỬI ĐƠN — THỦ KHO LẬP NHÁP KHÔNG GIÁ', async () => {
  const g1 = maGui();
  const coGia = await luuDon(UID.thuKhoA, { maGui: g1, ncc: nccUc,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 10, don_gia_du_kien: GIA.du_kien_than }] });
  ok('Thủ kho gửi kèm đơn giá → bị từ chối, câu dễ hiểu',
     coGia.loi !== null && /thủ kho không điền giá/.test(coGia.loi) && !coTien(coGia.loi), coGia.loi ?? 'LƯU ĐƯỢC');
  const giaNull = await luuDon(UID.thuKhoA, { maGui: g1, ncc: nccUc,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 10, don_gia_du_kien: null }] });
  ok('Kể cả khóa giá để trống cũng bị từ chối', giaNull.loi !== null);

  const a = await luuDon(UID.thuKhoA, { maGui: g1, ncc: nccUc, ghiChu: 'Giao sáng sớm',
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 10 }] });
  ok('Thủ kho lập đơn nháp chỉ kg', a.loi === null && a.rows[0].da_co === false, a.loi ?? '');
  DH1 = a.rows?.[0]?.don_id;
  const d1 = await don(DH1);
  ok('Số đơn DH-…, trạng thái nháp, người lập là thủ kho',
     /^DH-\d{4}-\d{4}$/.test(d1.so_phieu) && d1.trang_thai === 'nhap', d1.so_phieu);
  ok('Ngày giao mặc định = hôm nay + 2 ngày giao của NCC Úc', d1.ngay_giao_du_kien.toISOString?.().slice(0, 10) === await ngay(2)
     || String(d1.ngay_giao_du_kien) === await ngay(2), String(d1.ngay_giao_du_kien));

  const lai = await luuDon(UID.thuKhoA, { maGui: g1, ncc: nccUc, dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 99 }] });
  ok('Bấm Lưu lần hai (cùng ma_gui) → trả đơn cũ, không tạo đơn mới',
     lai.loi === null && lai.rows[0].da_co === true && lai.rows[0].don_id === DH1);
  const { rows: [{ n }] } = await db.query(`select count(*)::int as n from kho_don_dat`);
  ok('Chỉ có 1 đơn', n === 1);

  // Quản lý thêm nạc vai và điền giá dự kiến.
  const pb = d1.phien_ban;
  const ql = await luuDon(UID.qlA, { id: DH1, phienBan: pb, ncc: nccUc, dong: [
    { mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 12, don_gia_du_kien: GIA.du_kien_than },
    { mat_hang_id: MH['T-NACVAI'].id, so_kg_dat: 5, so_goi_dat: 1, don_gia_du_kien: GIA.du_kien_nac }] });
  ok('Quản lý sửa nháp, điền giá dự kiến', ql.loi === null && ql.rows[0].phien_ban_moi === pb + 1, ql.loi ?? '');
  const cu = await luuDon(UID.thuKhoA, { id: DH1, phienBan: pb, ncc: nccUc,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 1 }] });
  ok('Lưu bằng phiên bản cũ bị từ chối (hai máy)', cu.loi !== null && /máy khác/.test(cu.loi), cu.loi ?? '');

  // Thủ kho sửa kg (không gửi giá) → giá quản lý đã điền không mất.
  const tk = await luuDon(UID.thuKhoA, { id: DH1, phienBan: pb + 1, ncc: nccUc, dong: [
    { mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 14 },
    { mat_hang_id: MH['T-NACVAI'].id, so_kg_dat: 5, so_goi_dat: 1 }] });
  ok('Thủ kho sửa kg đơn đã có giá', tk.loi === null, tk.loi ?? '');
  const dd = await dongDon(DH1);
  ok('Giá dự kiến giữ nguyên theo mặt hàng',
     Number(dd['T-THANNGOAI']?.don_gia_du_kien) === GIA.du_kien_than && Number(dd['T-NACVAI']?.don_gia_du_kien) === GIA.du_kien_nac
       && Number(dd['T-THANNGOAI'].so_kg_dat) === 14, JSON.stringify(dd));

  const trung = await luuDon(UID.qlA, { ncc: nccUc, dong: [
    { mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 1 }, { mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 2 }] });
  ok('Một món ghi hai dòng bị chặn', trung.loi !== null && /đã có ở dòng trên/.test(trung.loi), trung.loi ?? '');
  const rong = await luuDon(UID.qlA, { ncc: nccUc, dong: [] });
  ok('Đơn không có món bị chặn', rong.loi !== null && /chưa có món/.test(rong.loi));
  const qua = await luuDon(UID.qlA, { ncc: nccUc, ngayGiao: await ngay(-1), dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 1 }] });
  ok('Ngày giao trước hôm nay bị chặn', qua.loi !== null && /trước hôm nay/.test(qua.loi));
  const kg0 = await luuDon(UID.qlA, { ncc: nccUc, dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 0 }] });
  ok('Số kg 0 bị chặn', kg0.loi !== null);
  const la = await luuDon(UID.qlA, { ncc: nccUc, dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 1, gia: 5 }] });
  ok('Khóa lạ bị chặn', la.loi !== null && /không được nhận/.test(la.loi));
  const nv = await luuDon(UID.nvQuayA, { ncc: nccUc, dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 1 }] });
  ok('NV quầy KHÔNG lập được đơn', nv.loi !== null);
  const kt = await luuDon(UID.keToanA, { ncc: nccUc, dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 1 }] });
  ok('Kế toán KHÔNG lập được đơn (không có quyền nhập)', kt.loi !== null);
  const tkB = await luuDon(UID.thuKhoB, { ncc: nccUc, dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 1 }] });
  ok('Thủ kho Q7 KHÔNG lập đơn cho Q1', tkB.loi !== null);

  // Đọc: thủ kho không đọc được bảng, đọc qua hàm chỉ kg.
  const bang = await duoi(UID.thuKhoA, `select count(*)::int as n from kho_don_dat_dong`);
  ok('Thủ kho KHÔNG đọc được bảng dòng đơn (có giá)', bang.rows?.[0]?.n === 0);
  const view = await duoi(UID.thuKhoA, `select count(*)::int as n from kho_v_don_dat`);
  ok('Thủ kho KHÔNG đọc được view đơn có tiền', view.rows?.[0]?.n === 0);
  const ktv = await duoi(UID.keToanA, `select * from kho_v_don_dat where id = $1`, [DH1]);
  ok('Kế toán xem đơn có tiền: 14 × 480.000 + 5 × 361.700',
     Number(ktv.rows?.[0]?.tong_tien_du_kien) === 14 * GIA.du_kien_than + 5 * GIA.du_kien_nac
       && Number(ktv.rows[0].tong_kg_dat) === 19, ktv.loi ?? JSON.stringify(ktv.rows));
  const doc = await docDon(UID.thuKhoA, DH1);
  ok('Thủ kho đọc đơn chỉ kg: 2 dòng, không khóa tiền, không số tiền',
     doc.loi === null && doc.rows[0].d.dong.length === 2 && khoaTien(doc.rows[0].d).length === 0
       && !coTien(JSON.stringify(doc.rows[0].d)), doc.loi ?? khoaTien(doc.rows?.[0]?.d).join(', '));

  // Gửi.
  const pb2 = (await don(DH1)).phien_ban;
  const tkGui = await guiDon(UID.thuKhoA, DH1, pb2);
  ok('Thủ kho KHÔNG gửi được đơn', tkGui.loi !== null);
  const ktGui = await guiDon(UID.keToanA, DH1, pb2);
  ok('Kế toán KHÔNG gửi được đơn', ktGui.loi !== null);
  const cuGui = await guiDon(UID.qlA, DH1, pb2 - 1);
  ok('Gửi bằng phiên bản cũ bị từ chối', cuGui.loi !== null && /máy khác/.test(cuGui.loi));
  const gui = await guiDon(UID.qlA, DH1, pb2);
  const sau = await don(DH1);
  ok('Quản lý gửi đơn → da_gui, ghi người gửi, giờ gửi',
     gui.loi === null && sau.trang_thai === 'da_gui' && sau.gui_luc && sau.gui_boi, gui.loi ?? sau.trang_thai);
  const lai2 = await guiDon(UID.qlA, DH1, sau.phien_ban);
  ok('Gửi lại → báo đã gửi, không lỗi', lai2.loi === null && /đã được gửi/.test(lai2.rows[0].cau));
  const suaSau = await luuDon(UID.qlA, { id: DH1, phienBan: sau.phien_ban, ncc: nccUc,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 1 }] });
  ok('Đơn đã gửi KHÔNG sửa được', suaSau.loi !== null && /không sửa được nữa/.test(suaSau.loi), suaSau.loi ?? '');

  // Thứ giao trong tuần: NCC Mỹ chỉ giao đúng thứ của ngày (hôm nay + 3).
  const { rows: [{ thu }] } = await db.query(`select extract(isodow from $1::date)::int as thu`, [await ngay(3)]);
  await duoi(UID.keToanA, `update kho_nha_cung_cap set ngay_giao_trong_tuan = $2 where id = $1`, [nccMy, [thu]]);
  const my = await luuDon(UID.qlA, { ncc: nccMy, dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg_dat: 1 }] });
  const dmy = await don(my.rows?.[0]?.don_id);
  ok('NCC chỉ giao vài thứ: ngày giao mặc định rơi đúng thứ đó (hôm nay + 3)',
     my.loi === null && String(dmy.ngay_giao_du_kien.toISOString?.().slice(0, 10) ?? dmy.ngay_giao_du_kien) === await ngay(3),
     my.loi ?? String(dmy?.ngay_giao_du_kien));
  await duoi(UID.keToanA, `update kho_nha_cung_cap set ngay_giao_trong_tuan = null where id = $1`, [nccMy]);

  // Hủy: nháp thì người lập hủy được, không cần lý do.
  const tkHuy = await huyDon(UID.thuKhoA, my.rows[0].don_id, null);
  ok('Thủ kho hủy được đơn NHÁP, không cần lý do', tkHuy.loi === null && (await don(my.rows[0].don_id)).trang_thai === 'huy',
     tkHuy.loi ?? '');
  const huyLai = await huyDon(UID.thuKhoA, my.rows[0].don_id, null);
  ok('Hủy lại → báo đã hủy', huyLai.loi === null && /đã hủy/.test(huyLai.rows[0].cau));

  // Đơn 3 (NCC Úc) đã gửi rồi hủy.
  const d3 = await luuDon(UID.qlA, { ncc: nccUc, dong: [{ mat_hang_id: MH['T-NACVAI'].id, so_kg_dat: 20 }] });
  DH3 = d3.rows?.[0]?.don_id;
  await guiDon(UID.qlA, DH3, (await don(DH3)).phien_ban);
  const tkHuy3 = await huyDon(UID.thuKhoA, DH3, 'Không cần nữa');
  ok('Thủ kho KHÔNG hủy được đơn đã gửi', tkHuy3.loi !== null && /nhờ quản lý/.test(tkHuy3.loi), tkHuy3.loi ?? '');
  const khongLyDo = await huyDon(UID.qlA, DH3, '  ');
  ok('Hủy đơn đã gửi phải có lý do', khongLyDo.loi !== null && /lý do/.test(khongLyDo.loi));
  const h3 = await huyDon(UID.qlA, DH3, 'NCC hết nạc vai');
  const d3s = await don(DH3);
  ok('Quản lý hủy đơn đã gửi, ghi lý do', h3.loi === null && d3s.trang_thai === 'huy' && d3s.ly_do_huy === 'NCC hết nạc vai');
  const tuHuy = await tuDon(UID.thuKhoA, DH3);
  ok('Đơn đã hủy KHÔNG nhận hàng theo được', tuHuy.loi !== null && /đã bị hủy/.test(tuHuy.loi), tuHuy.loi ?? '');

  // Danh sách chỉ kg.
  const ds = await duoi(UID.thuKhoA, `select * from kho_ds_don_dat_kg($1, null, null, null, null, null, false, 30, 0)`, [cnA.id]);
  ok('Danh sách: 3 đơn, không khóa tiền', ds.loi === null && ds.rows.length === 3 && khoaTien(ds.rows).length === 0,
     ds.loi ?? khoaTien(ds.rows).join(', '));
  const cho = await duoi(UID.thuKhoA, `select * from kho_ds_don_dat_kg($1, 'dang_cho', $2, null, null, null, false, 30, 0)`, [cnA.id, nccUc]);
  ok('Lọc "đang chờ hàng" của NCC Úc: chỉ đơn 1', cho.rows?.length === 1 && cho.rows[0].id === DH1);
  const tim = await duoi(UID.thuKhoA, `select * from kho_ds_don_dat_kg($1, null, null, $2, null, null, false, 30, 0)`, [cnA.id, d1.so_phieu]);
  ok('Tìm theo số đơn', tim.rows?.length === 1 && tim.rows[0].id === DH1);
  const cuaToi = await duoi(UID.thuKhoA, `select * from kho_ds_don_dat_kg($1, null, null, null, null, null, true, 30, 0)`, [cnA.id]);
  ok('"Của tôi": đơn thủ kho lập', cuaToi.rows?.length === 1 && cuaToi.rows[0].id === DH1 && cuaToi.rows[0].ten_nguoi_lap === 'Thủ kho Q1');
  const phanTram = await duoi(UID.thuKhoA, `select * from kho_ds_don_dat_kg($1, null, null, '%', null, null, false, 30, 0)`, [cnA.id]);
  ok('Gõ "%" là chữ', phanTram.loi === null && phanTram.rows.length === 0);
  const nvDs = await duoi(UID.nvQuayA, `select * from kho_ds_don_dat_kg($1, null, null, null, null, null, false, 30, 0)`, [cnA.id]);
  ok('NV quầy KHÔNG xem được danh sách đơn', nvDs.loi !== null);
  const bDoc = await docDon(UID.thuKhoB, DH1);
  ok('Thủ kho Q7 KHÔNG đọc được đơn Q1', bDoc.loi !== null);
});

// ===========================================================================
await nhom('5 · GỢI Ý SAU KHI ĐẶT: TRỪ HÀNG ĐÃ ĐẶT CHƯA VỀ', async () => {
  const g = theoMa((await goiY(UID.thuKhoA, nccUc)).rows);
  ok('Thăn ngoại: đã đặt 14 kg → đề nghị 50 − 28 − 14 = 8 kg',
     Number(g['T-THANNGOAI']?.dang_dat_kg) === 14 && Number(g['T-THANNGOAI'].de_nghi_kg) === 8, JSON.stringify(g['T-THANNGOAI']));
  ok('Nạc vai: đã đặt 5 kg (đơn hủy không tính) → chưa cần đặt',
     Number(g['T-NACVAI']?.dang_dat_kg) === 5 && Number(g['T-NACVAI'].de_nghi_kg) === 0 && /chưa cần đặt/.test(g['T-NACVAI'].ly_do),
     JSON.stringify(g['T-NACVAI']));
});

// ===========================================================================
let PN1, PN2, PN3;
await nhom('6 · NHẬN HÀNG THEO ĐƠN: ĐIỀN SẴN, NHẬN MỘT PHẦN, NHẬN ĐỦ, HỦY / TỪ CHỐI PHIẾU', async () => {
  const g = maGui();
  const t = await tuDon(UID.thuKhoA, DH1, g);
  PN1 = t.rows?.[0]?.id;
  ok('Thủ kho bấm "Nhận hàng theo đơn này" → phiếu nháp', t.loi === null && !!PN1, t.loi ?? '');
  const lai = await tuDon(UID.thuKhoA, DH1, g);
  ok('Cùng ma_gui → cùng phiếu', lai.rows?.[0]?.id === PN1);
  const khac = await tuDon(UID.thuKhoA, DH1);
  ok('Bấm lại (ma_gui khác) khi đang có phiếu nháp → mở lại phiếu đó', khac.rows?.[0]?.id === PN1);
  const nv = await tuDon(UID.nvQuayA, DH1);
  ok('NV quầy KHÔNG nhận hàng theo đơn được', nv.loi !== null);

  const doc = (await duoi(UID.thuKhoA, `select kho_doc_phieu_nhap_kg($1) as p`, [PN1])).rows[0].p;
  const d = Object.fromEntries(doc.dong.map(x => [x.mat_hang_id, x]));
  ok('Phiếu điền sẵn: thăn ngoại 14 kg, nạc vai 5 kg 1 tảng, NCC Úc, kho lạnh',
     Number(d[MH['T-THANNGOAI'].id]?.so_kg) === 14 && Number(d[MH['T-NACVAI'].id]?.so_kg) === 5
       && d[MH['T-NACVAI'].id].so_goi === 1 && doc.nha_cung_cap_id === nccUc && doc.vi_tri_id === viTri.kho, JSON.stringify(doc.dong));
  ok('Ghi chú phiếu nêu số đơn', doc.ghi_chu?.includes((await don(DH1)).so_phieu), doc.ghi_chu);
  ok('Màn nhận hàng có cột "Đặt" (khóa don_dat)', doc.don_dat?.id === DH1 && doc.don_dat.dong.length === 2
     && Number(doc.don_dat.dong.find(x => x.mat_hang_id === MH['T-THANNGOAI'].id).so_kg_dat) === 14, JSON.stringify(doc.don_dat));
  ok('Phiếu theo đơn: không khóa tiền, không số tiền (không chép giá dự kiến)',
     khoaTien(doc).length === 0 && !coTien(JSON.stringify(doc)), khoaTien(doc).join(', '));
  const { rows: [{ n: coGia }] } = await db.query(`select count(*)::int as n from kho_phieu_nhap_dong where phieu_nhap_id = $1 and don_gia_kg > 0`, [PN1]);
  ok('Dòng phiếu chưa có đơn giá (kế toán điền từ hóa đơn)', coGia === 0);

  const doiNcc = await luuKg(UID.thuKhoA, { id: PN1, phienBan: await phienBan(PN1), ncc: nccMy,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 7 }] });
  ok('Đổi nhà cung cấp của phiếu theo đơn bị chặn', doiNcc.loi !== null && /nhà cung cấp phải đúng/.test(doiNcc.loi), doiNcc.loi ?? '');

  // Lần 1: thăn ngoại về 7 kg (thiếu), nạc vai đủ 1 tảng 5,1 kg.
  const l1 = await luuKg(UID.thuKhoA, { id: PN1, phienBan: await phienBan(PN1), ncc: nccUc, anh: [anh()], dong: [
    { mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 7 },
    { mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 5.1 }] });
  ok('Thủ kho cân, lưu phiếu', l1.loi === null, l1.loi ?? '');
  ok('Phiếu còn nháp: đơn vẫn da_gui, chưa tính đã nhận',
     (await don(DH1)).trang_thai === 'da_gui' && Number((await dongDon(DH1))['T-THANNGOAI'].so_kg_da_nhan) === 0);
  const gui1 = await guiPhieu(UID.thuKhoA, PN1);
  let dd = await dongDon(DH1);
  ok('Gửi phiếu → đơn nhan_mot_phan; đã nhận thăn 7, nạc 5,1',
     gui1.loi === null && (await don(DH1)).trang_thai === 'nhan_mot_phan'
       && Number(dd['T-THANNGOAI'].so_kg_da_nhan) === 7 && Number(dd['T-NACVAI'].so_kg_da_nhan) === 5.1, gui1.loi ?? '');
  const rut = await duoi(UID.thuKhoA, `select kho_rut_phieu_nhap($1) as cau`, [PN1]);
  ok('Rút phiếu về sửa → đơn quay lại da_gui', rut.loi === null && (await don(DH1)).trang_thai === 'da_gui', rut.loi ?? '');
  await guiPhieu(UID.thuKhoA, PN1);
  const dy1 = await giaVaDuyet(PN1, { 'T-THANNGOAI': 510000, 'T-NACVAI': 355000 });
  ok('Kế toán điền giá, duyệt → vẫn nhan_mot_phan', dy1.loi === null && (await don(DH1)).trang_thai === 'nhan_mot_phan',
     dy1.loi ?? '');

  const g2 = theoMa((await goiY(UID.thuKhoA, nccUc)).rows);
  ok('Gợi ý: thăn ngoại tồn 35, còn đặt chưa về 7 → đề nghị 50 − 42 = 8',
     Number(g2['T-THANNGOAI'].ton_kg) === 35 && Number(g2['T-THANNGOAI'].dang_dat_kg) === 7 && Number(g2['T-THANNGOAI'].de_nghi_kg) === 8,
     JSON.stringify(g2['T-THANNGOAI']));

  // Lần 2: phần còn lại.
  PN2 = (await tuDon(UID.thuKhoA, DH1)).rows?.[0]?.id;
  const doc2 = (await duoi(UID.thuKhoA, `select kho_doc_phieu_nhap_kg($1) as p`, [PN2])).rows[0].p;
  ok('Phiếu lần 2 chỉ còn thăn ngoại 7 kg (nạc vai đã đủ)',
     PN2 && PN2 !== PN1 && doc2.dong.length === 1 && Number(doc2.dong[0].so_kg) === 7, JSON.stringify(doc2.dong));
  await luuKg(UID.thuKhoA, { id: PN2, phienBan: await phienBan(PN2), ncc: nccUc, anh: [anh()],
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 6.8 }] });
  await guiPhieu(UID.thuKhoA, PN2);
  ok('Nhận 13,8 / 14 kg (≥ 95%) → đơn da_nhan', (await don(DH1)).trang_thai === 'da_nhan');
  const dy2 = await giaVaDuyet(PN2, { 'T-THANNGOAI': 510000 });
  ok('Duyệt phiếu lần 2 → vẫn da_nhan', dy2.loi === null && (await don(DH1)).trang_thai === 'da_nhan', dy2.loi ?? '');
  const du = await tuDon(UID.thuKhoA, DH1);
  ok('Đơn đã nhận đủ: không tạo phiếu nhận thêm', du.loi !== null && /nhận đủ/.test(du.loi), du.loi ?? '');
  const huyDu = await huyDon(UID.qlA, DH1, 'thử');
  ok('Đơn đã nhận đủ KHÔNG hủy được', huyDu.loi !== null);

  // Hủy phiếu lần 2 (lô chưa dùng) → đơn quay lại nhận một phần.
  const hp = await duoi(UID.qlA, `select kho_huy_phieu_nhap($1, 'Nhập nhầm') as cau`, [PN2]);
  dd = await dongDon(DH1);
  ok('Hủy phiếu nhập → đơn quay lại nhan_mot_phan, đã nhận thăn về 7',
     hp.loi === null && (await don(DH1)).trang_thai === 'nhan_mot_phan' && Number(dd['T-THANNGOAI'].so_kg_da_nhan) === 7, hp.loi ?? '');

  // Lần 3: gửi → đủ; kế toán từ chối → quay lại; gửi lại, duyệt → đủ.
  PN3 = (await tuDon(UID.thuKhoA, DH1)).rows?.[0]?.id;
  await luuKg(UID.thuKhoA, { id: PN3, phienBan: await phienBan(PN3), ncc: nccUc, anh: [anh()],
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 6.9 }] });
  await guiPhieu(UID.thuKhoA, PN3);
  ok('Lần 3 gửi → da_nhan', (await don(DH1)).trang_thai === 'da_nhan');
  const tc = await duoi(UID.keToanA, `select kho_tu_choi_phieu_nhap($1, 'Ảnh mờ') as cau`, [PN3]);
  ok('Kế toán trả phiếu về → đơn quay lại nhan_mot_phan', tc.loi === null && (await don(DH1)).trang_thai === 'nhan_mot_phan');
  await guiPhieu(UID.thuKhoA, PN3);
  const dy3 = await giaVaDuyet(PN3, { 'T-THANNGOAI': 505000 });
  ok('Gửi lại, duyệt → da_nhan', dy3.loi === null && (await don(DH1)).trang_thai === 'da_nhan', dy3.loi ?? '');

  const docDon1 = (await docDon(UID.thuKhoA, DH1)).rows[0].d;
  ok('Đọc đơn: 3 phiếu gắn (1 đã hủy), đã nhận thăn 13,9 kg, còn lại 0,1',
     docDon1.phieu.length === 3 && Number(docDon1.dong.find(x => x.ma === 'T-THANNGOAI').so_kg_da_nhan) === 13.9
       && Number(docDon1.dong.find(x => x.ma === 'T-THANNGOAI').so_kg_con_lai) === 0.1, JSON.stringify(docDon1.dong));
  const vp = await duoi(UID.keToanA, `select don_dat_id from kho_v_phieu_nhap where id = $1`, [PN3]);
  ok('kho_v_phieu_nhap có cột don_dat_id', vp.rows?.[0]?.don_dat_id === DH1);
  await doiSoat('Sau nhận hàng theo đơn');
});

// ===========================================================================
let DH2;
await nhom('7 · ĐƠN QUÁ NGÀY GIAO: SỰ KIỆN don_dat_tre', async () => {
  const a = await luuDon(UID.qlA, { ncc: nccMy, dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg_dat: 6, so_goi_dat: 12 }] });
  DH2 = a.rows?.[0]?.don_id;
  await guiDon(UID.qlA, DH2, (await don(DH2)).phien_ban);
  const suKien = async uid => ((await duoi(uid, `select kho_thong_bao($1, 300) as v`, [cnA.id])).rows?.[0]?.v?.su_kien ?? [])
    .filter(e => e.khoa === 'don_dat_tre');
  const dem = async uid => (await duoi(uid, `select kho_dem_viec($1) as v`, [cnA.id])).rows?.[0]?.v ?? {};
  ok('Chưa tới ngày giao: không báo', (await suKien(UID.qlA)).length === 0 && (await dem(UID.qlA)).don_dat_tre === 0);

  // Giả lập thời gian: hẹn giao là hôm qua.
  await db.query(`update kho_don_dat set ngay_giao_du_kien = $2::date where id = $1`, [DH2, await ngay(-1)]);
  const e = await suKien(UID.qlA);
  ok('Quản lý thấy don_dat_tre: số đơn, NCC, trễ 1 ngày', e.length === 1 && e[0].ref_id === DH2 && e[0].ten === 'NCC Mỹ'
     && Number(e[0].so) === 1 && e[0].phu === await ngay(-1), JSON.stringify(e));
  ok('Số đỏ don_dat_tre = 1', (await dem(UID.qlA)).don_dat_tre === 1);
  ok('Chủ cũng thấy', (await suKien(UID.chu)).length === 1);
  ok('Thủ kho, kế toán không có khóa don_dat_tre',
     !('don_dat_tre' in await dem(UID.thuKhoA)) && !('don_dat_tre' in await dem(UID.keToanA)));
  const cau = cauSuKien(e[0]);
  ok('Câu chữ: tiêu đề có số đơn, chi tiết có NCC và ngày hẹn, nút mở đơn',
     cau.tieuDe.includes(e[0].ma) && /NCC Mỹ — hẹn giao \d\d\/\d\d\/\d{4} — trễ 1 ngày/.test(cau.chiTiet ?? '')
       && cau.link === `/noi-bo/kho/dat-hang/${DH2}` && cau.muc === 'vang', JSON.stringify(cau));
  ok('viec.ts có khóa don_dat_tre', KHOA_SU_KIEN.includes('don_dat_tre'));
  const ds = await duoi(UID.thuKhoA, `select * from kho_ds_don_dat_kg($1, 'dang_cho', null, null, null, null, false, 30, 0)`, [cnA.id]);
  ok('Danh sách đánh dấu đơn trễ hẹn', ds.rows?.find(r => r.id === DH2)?.tre_hen === true);

  // Hàng về một nửa (hôm nay, sau ngày hẹn).
  const p = (await tuDon(UID.thuKhoA, DH2)).rows?.[0]?.id;
  const doc = (await duoi(UID.thuKhoA, `select kho_doc_phieu_nhap_kg($1) as p`, [p])).rows[0].p;
  ok('Điền sẵn 6 kg, 12 gói', Number(doc.dong[0].so_kg) === 6 && doc.dong[0].so_goi === 12, JSON.stringify(doc.dong));
  await luuKg(UID.thuKhoA, { id: p, phienBan: await phienBan(p), ncc: nccMy, anh: [anh()],
    dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 6, so_kg: 3, han_dung: await ngay(3) }] });
  await guiPhieu(UID.thuKhoA, p);
  const dy = await giaVaDuyet(p, { 'C-THANNGOAI': 700000 });
  ok('Nhận 3 / 6 kg → nhan_mot_phan', dy.loi === null && (await don(DH2)).trang_thai === 'nhan_mot_phan', dy.loi ?? '');
  ok('Đã có hàng về: hết báo don_dat_tre', (await suKien(UID.qlA)).length === 0 && (await dem(UID.qlA)).don_dat_tre === 0);
});

// ===========================================================================
await nhom('8 · ĐÁNH GIÁ NHÀ CUNG CẤP (kho_bao_cao_ncc)', async () => {
  // Lệch hóa đơn: phiếu lịch sử NCC Úc, hóa đơn cao hơn phiếu 1.000 đ, ngày hóa đơn = ngày nhập.
  const { rows: [pn] } = await db.query(`select tong_tien from kho_v_phieu_nhap where id = $1`, [pnUc]);
  const dc = await duoi(UID.keToanA, `select kho_doi_chieu_hoa_don($1, 'HD-UC-1', $2::date, $3, null, 'Lệch 1.000đ phí giao') as cau`,
    [pnUc, await ngay(-10), Number(pn.tong_tien) + 1000]);
  ok('Kế toán đối chiếu hóa đơn lệch', dc.loi === null, dc.loi ?? '');
  // Trả tiền hôm nay cho phiếu đó (10 ngày sau ngày hóa đơn).
  const tt = await duoi(UID.keToanA, `
    select * from kho_ghi_thanh_toan(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_nha_cung_cap_id => $3, p_loai => 'thanh_toan',
      p_hinh_thuc => 'chuyen_khoan', p_so_tien => 1000000, p_ngay => $4::date, p_ghi_chu => null,
      p_anh => '{}'::text[], p_phan_bo => $5::jsonb)`,
    [cnA.id, maGui(), nccUc, homNay, JSON.stringify([{ phieu_nhap_id: pnUc, so_tien: 1000000 }])]);
  ok('Kế toán trả 1.000.000 cho phiếu đó', tt.loi === null, tt.loi ?? '');

  const tu = await ngay(-30), den = await ngay(30);
  const bc = uid => duoi(uid, `select * from kho_bao_cao_ncc($1, $2::date, $3::date)`, [cnA.id, tu, den]);
  const kt = await bc(UID.keToanA);
  ok('Kế toán xem được đánh giá', kt.loi === null, kt.loi ?? '');
  const r = Object.fromEntries((kt.rows ?? []).map(x => [x.ten, x]));
  ok('Chỉ NCC có hoạt động trong kỳ (không có "NCC Chỉ Q7")', !r['NCC Chỉ Q7'] && !!r['NCC Úc'] && !!r['NCC Mỹ']);

  const uc = r['NCC Úc'];
  // Phiếu đã duyệt: lịch sử (56 + 10), lần 1 (7 + 5,1), lần 3 (6,9). Lần 2 đã hủy.
  const { rows: [gUc] } = await db.query(`
    select round(sum(d.thanh_tien)::numeric / sum(d.so_kg))::bigint as g
    from kho_phieu_nhap_dong d join kho_phieu_nhap p on p.id = d.phieu_nhap_id
    where p.id = any($1::uuid[])`, [[pnUc, PN1, PN3]]);
  ok('NCC Úc: 3 phiếu, 85 kg, giá TB/kg = tiền hàng ÷ kg',
     uc?.so_phieu === 3 && Number(uc.tong_kg) === 85 && Number(uc.gia_tb_kg) === Number(gUc.g), JSON.stringify(uc));
  const { rows: [ph] } = await db.query(`select ty_le_thu_hoi from kho_phien_pha where id = $1`, [phienId]);
  ok('NCC Úc: thu hồi pha lóc TB = thu hồi phiên pha nạc vai', Number(uc?.thu_hoi_tb_pt) === Number(ph.ty_le_thu_hoi)
     && uc.so_phien_pha === 1, `${uc?.thu_hoi_tb_pt} / ${ph.ty_le_thu_hoi}`);
  ok('NCC Úc: 1 lần lệch hóa đơn, trả tiền sau 10 ngày', uc?.so_lan_lech_hoa_don === 1 && Number(uc.so_ngay_tra_tb) === 10,
     JSON.stringify(uc));
  ok('NCC Úc: 2 đơn (1 nhận đủ đúng hẹn, 1 đã hủy chưa giao) → không thiếu, không trễ',
     uc?.so_don === 2 && uc.so_don_thieu === 0 && uc.so_don_tre === 0 && Number(uc.kg_thieu) === 0, JSON.stringify(uc));
  // 5 − 1 × (1 lệch ÷ 3 phiếu) = 4,67 → làm tròn 0,5 = 4,5
  ok('NCC Úc: 4,5 sao', Number(uc?.diem_sao) === 4.5, String(uc?.diem_sao));

  const my = r['NCC Mỹ'];
  ok('NCC Mỹ: 2 phiếu 13 kg, trả 1 kg, không lệch hóa đơn',
     my?.so_phieu === 2 && Number(my.tong_kg) === 13 && Number(my.kg_tra) === 1 && my.so_lan_lech_hoa_don === 0, JSON.stringify(my));
  ok('NCC Mỹ: giá TB = (10 × 700.000 + 3 × 700.000) ÷ 13', Number(my?.gia_tb_kg) === 700000);
  ok('NCC Mỹ: 1 đơn (nháp đã hủy không tính), giao thiếu 3 kg, giao trễ',
     my?.so_don === 1 && my.so_don_thieu === 1 && Number(my.kg_thieu) === 3 && my.so_don_tre === 1, JSON.stringify(my));
  ok('NCC Mỹ: chưa trả tiền → số ngày trả trống', my?.so_ngay_tra_tb === null);
  // 5 − 2 × 1 − 1 × 1 − 0 − min(1, 10 × 1 ÷ 13) = 1,23 → 1 sao (thấp nhất)
  ok('NCC Mỹ: 1 sao', Number(my?.diem_sao) === 1, String(my?.diem_sao));

  // Thủ kho: thấy kg, thu hồi, giao thiếu / trễ, điểm; không thấy tiền, công nợ.
  const tk = await bc(UID.thuKhoA);
  const tuc = tk.rows?.find(x => x.ten === 'NCC Úc');
  ok('Thủ kho xem được: cùng kg, điểm sao', tk.loi === null && Number(tuc?.tong_kg) === 85 && Number(tuc.diem_sao) === 4.5, tk.loi ?? '');
  ok('Thủ kho: gia_tb_kg, lệch hóa đơn, số ngày trả đều trống',
     (tk.rows ?? []).every(x => x.gia_tb_kg === null && x.so_lan_lech_hoa_don === null && x.so_ngay_tra_tb === null));
  const conLai = (tk.rows ?? []).map(({ gia_tb_kg, ...x }) => x);
  ok('Thủ kho: ngoài gia_tb_kg (trống) không khóa tiền nào', khoaTien(conLai).length === 0, khoaTien(conLai).join(', '));
  ok('Thủ kho: không số tiền nào', !coTien(JSON.stringify(tk.rows)), JSON.stringify(tk.rows));
  const nv = await bc(UID.nvQuayA);
  ok('NV quầy KHÔNG xem được đánh giá NCC', nv.loi !== null);
  const sai = await duoi(UID.qlA, `select * from kho_bao_cao_ncc($1, $2::date, $3::date)`, [cnA.id, den, tu]);
  ok('Từ ngày sau đến ngày bị chặn', sai.loi !== null);
  const bB = await duoi(UID.qlB, `select * from kho_bao_cao_ncc($1, $2::date, $3::date)`, [cnB.id, tu, den]);
  ok('Chi nhánh Q7 (chưa mua gì): không dòng nào', bB.loi === null && bB.rows.length === 0, bB.loi ?? '');
});

// ===========================================================================
await nhom('8b · DÒNG ĐÃ ĐỦ (≥ 95%) KHÔNG ĐIỀN LẠI VÀO PHIẾU NHẬN LẦN SAU', async () => {
  const a = await luuDon(UID.qlA, { ncc: nccUc, dong: [
    { mat_hang_id: MH['T-THANNGOAI'].id, so_kg_dat: 10 },
    { mat_hang_id: MH['T-NACVAI'].id, so_kg_dat: 4 }] });
  const id = a.rows?.[0]?.don_id;
  const g = await guiDon(UID.qlA, id, (await don(id)).phien_ban);
  ok('Lập và gửi đơn thăn 10 kg + nạc 4 kg', a.loi === null && g.loi === null, a.loi ?? g.loi ?? '');
  const p1 = (await tuDon(UID.thuKhoA, id)).rows?.[0]?.id;
  const l = await luuKg(UID.thuKhoA, { id: p1, phienBan: await phienBan(p1), ncc: nccUc, anh: [anh()], dong: [
    { mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 9.6 },
    { mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 1 }] });
  await guiPhieu(UID.thuKhoA, p1);
  ok('Thăn về 9,6 / 10 kg (đủ), nạc 1 / 4 kg → nhan_mot_phan', l.loi === null && (await don(id)).trang_thai === 'nhan_mot_phan',
     l.loi ?? '');
  const p2 = (await tuDon(UID.thuKhoA, id)).rows?.[0]?.id;
  const doc = (await duoi(UID.thuKhoA, `select kho_doc_phieu_nhap_kg($1) as p`, [p2])).rows[0].p;
  ok('Phiếu lần sau chỉ còn nạc vai 3 kg — không có dòng thăn 0,4 kg',
     p2 && p2 !== p1 && doc.dong.length === 1 && doc.dong[0].mat_hang_id === MH['T-NACVAI'].id && Number(doc.dong[0].so_kg) === 3,
     JSON.stringify(doc.dong));
  const d = (await docDon(UID.thuKhoA, id)).rows?.[0]?.d;
  const du = Object.fromEntries((d?.dong ?? []).map(x => [x.mat_hang_id, x.du]));
  ok('kho_doc_don_dat_kg: thăn du = true, nạc du = false',
     du[MH['T-THANNGOAI'].id] === true && du[MH['T-NACVAI'].id] === false, JSON.stringify(d?.dong));
});

// ===========================================================================
await nhom('9 · CUỐI CÙNG', async () => {
  const { rows: [{ n }] } = await db.query(`
    select count(*)::int as n from kho_don_dat_dong d
    where d.so_kg_da_nhan <> coalesce((
      select sum(pd.so_kg) from kho_phieu_nhap p join kho_phieu_nhap_dong pd on pd.phieu_nhap_id = p.id
      where p.don_dat_id = d.don_dat_id and p.trang_thai in ('cho_duyet', 'da_duyet') and pd.mat_hang_id = d.mat_hang_id), 0)`);
  ok('Mọi dòng đơn: kg đã nhận khớp phiếu nhận hàng', n === 0, `${n} dòng lệch`);
  await doiSoat('Cuối cùng');
});

process.exit(ketThuc('ĐẶT HÀNG NHÀ CUNG CẤP'));
