/**
 * BEEFTOWN KHO — Kiểm thử chuẩn bị chạy thật (0035, GĐ5e)
 * ========================================================
 *
 *     node test/test-kho-dau-ky.mjs
 *
 * Ba việc trước ngày chạy thật:
 *   1. NỢ ĐẦU KỲ — kế toán ghi số còn nợ từng nhà cung cấp một lần. Vào công
 *      nợ đúng số, thanh toán tự chia trả được, hủy được khi chưa trả và bị
 *      chặn khi đã trả, bấm hai lần vẫn một phiếu, thủ kho không thấy, không
 *      đụng tồn / báo cáo hàng.
 *   2. TỒN ĐẦU KỲ DẠNG LƯỚI — nhiều vị trí một lượt → mỗi vị trí một phiếu,
 *      tự duyệt theo cài đặt, tồn đúng, bấm hai lần vẫn một lượt, lỗi chỉ
 *      đúng dòng của lưới.
 *   3. TIẾN ĐỘ THIẾT LẬP — từng bước chuyển "xong" khi đủ điều kiện, bỏ qua
 *      được, con_lai đúng, không lộ tiền.
 * Cuối cùng: kho_doi_soat_ton() rỗng.
 */

import { readFileSync } from 'node:fs';
import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — NỢ ĐẦU KỲ · TỒN ĐẦU KỲ LƯỚI · THIẾT LẬP');
const { db, cnA, cnB, nsId, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// Cùng mẫu với test-kho-thu-kho.mjs: khóa JSON có dáng tiền.
const LA_TIEN = /gia|tien|thanh_tien|gia_von|gia_tri|thue|chi_phi|phai_tra|con_no|da_tra|giam_tru/;
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

const MH = {};
let vt = {};      // vị trí chi nhánh A: kho, quay, cho_huy, kho_mat
let vtB = {};
let nccUc, nccMy, nccNhat;

const ghiNo = (uid, maGuiLuot, dong, cn = cnA.id) => duoi(uid,
  `select kho_ghi_no_dau_ky(p_chi_nhanh_id => $1, p_ma_gui => $2, p_dong => $3::jsonb) as kq`,
  [cn, maGuiLuot, JSON.stringify(dong)]);

const luuTon = (uid, maGuiLuot, ngayTon, dong, cn = cnA.id) => duoi(uid,
  `select kho_luu_ton_dau_ky(p_chi_nhanh_id => $1, p_ma_gui => $2, p_ngay => $3::date, p_dong => $4::jsonb) as kq`,
  [cn, maGuiLuot, ngayTon, JSON.stringify(dong)]);

const tienDo = (uid, cn) => duoi(uid, `select kho_tien_do_thiet_lap(p_chi_nhanh_id => $1) as v`, [cn]);
const danhDau = (uid, cn, buoc, boQua) => duoi(uid,
  `select kho_danh_dau_thiet_lap(p_chi_nhanh_id => $1, p_buoc => $2, p_bo_qua => $3) as v`, [cn, buoc, boQua]);

const congNo = async id => (await db.query(`select * from kho_v_cong_no_phieu where id = $1`, [id])).rows[0];
const congNoNcc = async ncc => (await db.query(
  `select * from kho_v_cong_no_ncc where chi_nhanh_id = $1 and nha_cung_cap_id = $2`, [cnA.id, ncc])).rows[0];

/** Thanh toán NCC, tự chia (không chọn phiếu). */
const traTien = (ncc, soTien, maGuiLuot = maGui()) => duoi(UID.keToanA, `
  select * from kho_ghi_thanh_toan(
    p_chi_nhanh_id => $1, p_ma_gui => $2, p_nha_cung_cap_id => $3, p_loai => 'thanh_toan',
    p_hinh_thuc => 'chuyen_khoan', p_so_tien => $4, p_ngay => $5::date, p_ghi_chu => null,
    p_anh => '{}'::text[], p_phan_bo => '[]'::jsonb)`, [cnA.id, maGuiLuot, ncc, soTien, homNay]);

/** XNT hôm nay của chi nhánh A — để so trước / sau khi ghi nợ đầu kỳ. */
const xnt = async () => JSON.stringify((await duoi(UID.qlA,
  `select * from kho_bao_cao_xnt_v2($1, $2::date, $2::date) order by ma`, [cnA.id, homNay])).rows);

// ===========================================================================
await nhom('1 · CHUẨN BỊ: KHO HAI CHI NHÁNH, DANH MỤC, NHÀ CUNG CẤP', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  vt = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  vtB = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnB.id])).rows.map(r => [r.loai, r.id]));
  const km = await duoi(UID.qlA, `insert into kho_vi_tri (chi_nhanh_id, ten, loai) values ($1, 'Kho mát', 'kho') returning id`, [cnA.id]);
  ok('Quản lý thêm kho thứ hai "Kho mát"', km.loi === null, km.loi ?? '');
  vt.kho_mat = km.rows?.[0]?.id;

  const ncc = async (ten, soNgayNo) => (await duoi(UID.keToanA,
    `insert into kho_nha_cung_cap (ten, so_ngay_no) values ($1, $2) returning id`, [ten, soNgayNo])).rows[0].id;
  nccUc = await ncc('NCC Úc', 15);
  nccMy = await ncc('NCC Mỹ', 30);
  nccNhat = await ncc('NCC Nhật', 7);

  // Ô bắt buộc của dòng hàng — tồn đầu kỳ phải bỏ qua được.
  const o = await duoi(UID.chu, `
    insert into kho_truong_them (doi_tuong, khoa, nhan, kieu, lua_chon, bat_buoc)
    values ('lo_hang', 'nhiet_do', 'Nhiệt độ khi nhận (°C)', 'so', '{}', true)`);
  ok('Chủ tạo ô bắt buộc "Nhiệt độ khi nhận"', o.loi === null, o.loi ?? '');
  ok('Có đủ kho, quầy, kho mát, 3 nhà cung cấp', vt.kho && vt.quay && vt.kho_mat && nccUc && nccMy && nccNhat);
});

// ===========================================================================
let ndUc, ndMy, maLuotNo;
await nhom('2 · NỢ ĐẦU KỲ: GHI, CHỐNG TRÙNG, VÀO CÔNG NỢ ĐÚNG SỐ', async () => {
  const truoc = await xnt();
  maLuotNo = maGui();

  const tk = await ghiNo(UID.thuKhoA, maLuotNo, [{ nha_cung_cap_id: nccUc, so_tien: 1000 }]);
  ok('Thủ kho KHÔNG ghi được nợ đầu kỳ', tk.loi !== null && /không được ghi nợ đầu kỳ/.test(tk.loi), tk.loi ?? 'GHI ĐƯỢC');
  const nv = await ghiNo(UID.nvQuayA, maLuotNo, [{ nha_cung_cap_id: nccUc, so_tien: 1000 }]);
  ok('NV quầy KHÔNG ghi được', nv.loi !== null);
  const b = await ghiNo(UID.qlB, maLuotNo, [{ nha_cung_cap_id: nccUc, so_tien: 1000 }]);
  ok('Quản lý Q7 KHÔNG ghi được vào Q1', b.loi !== null);

  const r = await ghiNo(UID.keToanA, maLuotNo, [
    { nha_cung_cap_id: nccUc, so_tien: 12345678, han_thanh_toan: await ngay(-5), so_hoa_don: 'HD-CU-01', ghi_chu: 'Số dư sổ tay' },
    { nha_cung_cap_id: nccMy, so_tien: 5000000 },
  ]);
  const kq = r.rows?.[0]?.kq;
  ok('Kế toán ghi nợ đầu kỳ 2 nhà cung cấp', r.loi === null && kq.phieu.length === 2 && kq.da_co === false,
     r.loi ?? JSON.stringify(kq));
  ok('Tổng tiền trả về đúng', kq?.tong_tien === 17345678, JSON.stringify(kq));
  ndUc = kq?.phieu.find(p => p.nha_cung_cap_id === nccUc);
  ndMy = kq?.phieu.find(p => p.nha_cung_cap_id === nccMy);
  ok('Số phiếu dạng ND-YYMM-NNNN', /^ND-\d{4}-\d{4}$/.test(ndUc?.so_phieu ?? '') && /^ND-\d{4}-\d{4}$/.test(ndMy?.so_phieu ?? ''),
     `${ndUc?.so_phieu} ${ndMy?.so_phieu}`);
  ok('Hạn bỏ trống = hôm nay + số ngày nợ của NCC (30)', ndMy?.han_thanh_toan === await ngay(30), ndMy?.han_thanh_toan);

  const { rows: [p] } = await db.query(`select * from kho_phieu_nhap where id = $1`, [ndUc.phieu_id]);
  ok('Phiếu: loại no_dau, đã duyệt, đã đối chiếu, không vị trí',
     p.loai === 'no_dau' && p.trang_thai === 'da_duyet' && p.da_doi_chieu && p.vi_tri_id === null
       && p.nguoi_duyet === nsId[UID.keToanA] && p.nguoi_doi_chieu === nsId[UID.keToanA]);
  ok('Số tiền nợ ở tien_no_dau, chép sang tien_hoa_don',
     Number(p.tien_no_dau) === 12345678 && Number(p.tien_hoa_don) === 12345678);
  ok('Giữ số hóa đơn, ghi chú', p.so_hoa_don === 'HD-CU-01' && p.ghi_chu === 'Số dư sổ tay');

  const lai = await ghiNo(UID.keToanA, maLuotNo, [
    { nha_cung_cap_id: nccUc, so_tien: 12345678 }, { nha_cung_cap_id: nccMy, so_tien: 5000000 }]);
  ok('Bấm "Ghi" hai lần: trả lại đúng 2 phiếu cũ, da_co = true',
     lai.loi === null && lai.rows[0].kq.da_co === true
       && lai.rows[0].kq.phieu.map(x => x.phieu_id).sort().join() === [ndUc.phieu_id, ndMy.phieu_id].sort().join(),
     lai.loi ?? JSON.stringify(lai.rows?.[0]?.kq));
  const { rows: [dem] } = await db.query(`select count(*)::int as n from kho_phieu_nhap where loai = 'no_dau'`);
  ok('Vẫn chỉ 2 phiếu nợ đầu kỳ', dem.n === 2);

  const cnUc = await congNo(ndUc.phieu_id);
  ok('Công nợ phiếu: phải trả = còn nợ = 12.345.678, tổng phiếu khớp (không LỆCH)',
     Number(cnUc.phai_tra) === 12345678 && Number(cnUc.con_no) === 12345678 && Number(cnUc.tong_tien_phieu) === 12345678,
     JSON.stringify(cnUc));
  ok('Hạn đã qua → quá hạn 5 ngày', cnUc.qua_han === true && cnUc.so_ngay_qua_han === 5);
  const nUc = await congNoNcc(nccUc);
  ok('Công nợ NCC Úc: 1 phiếu, không phiếu chưa đối chiếu, còn nợ đúng',
     nUc.so_phieu === 1 && nUc.so_phieu_chua_doi_chieu === 0 && Number(nUc.con_no) === 12345678 && Number(nUc.no_qua_han) === 12345678,
     JSON.stringify(nUc));

  const trung = await ghiNo(UID.keToanA, maGui(), [{ nha_cung_cap_id: nccUc, so_tien: 1 }]);
  ok('Ghi lại NCC đã có nợ đầu kỳ → báo phiếu cũ', trung.loi !== null && trung.loi.includes(ndUc.so_phieu), trung.loi ?? 'GHI ĐƯỢC');

  const loi = async (dong, mau, ten) => {
    const x = await ghiNo(UID.keToanA, maGui(), dong);
    ok(ten, x.loi !== null && mau.test(x.loi), x.loi ?? 'GHI ĐƯỢC');
  };
  await loi([{ nha_cung_cap_id: nccNhat, so_tien: 100 }, { nha_cung_cap_id: nccNhat, so_tien: 200 }],
            /Dòng 2 \(NCC Nhật\).*dòng trên/, 'Một NCC hai dòng → lỗi ở dòng 2');
  await loi([{ nha_cung_cap_id: nccNhat, so_tien: 0 }], /Dòng 1 \(NCC Nhật\): số tiền/, 'Số tiền 0 → lỗi');
  await loi([{ nha_cung_cap_id: nccNhat, so_tien: 10.5 }], /số tiền/, 'Số tiền lẻ đồng → lỗi');
  await loi([{ nha_cung_cap_id: nccNhat, so_tien: '100' }], /số tiền/, 'Số tiền dạng chữ → lỗi');
  await loi([{ nha_cung_cap_id: maGui(), so_tien: 100 }], /không tìm thấy nhà cung cấp/, 'NCC không có → lỗi');
  await loi([{ nha_cung_cap_id: nccNhat, so_tien: 100, vi_tri_id: vt.kho }], /"vi_tri_id" không được nhận/, 'Trường lạ → lỗi');
  await loi([{ nha_cung_cap_id: nccNhat, so_tien: 100, han_thanh_toan: '31/02/2026' }], /hạn thanh toán/, 'Hạn sai dạng → lỗi');
  await loi([], /Chưa có dòng nợ/, 'Lưới trống → lỗi');
  const { rows: [dem2] } = await db.query(`select count(*)::int as n from kho_phieu_nhap where loai = 'no_dau'`);
  ok('Các lần lỗi không để lại phiếu nào', dem2.n === 2);

  const dc = await duoi(UID.keToanA, `select kho_doi_chieu_hoa_don($1, 'X', null, 1, null, null)`, [ndUc.phieu_id]);
  ok('Không "đối chiếu lại" được phiếu nợ đầu kỳ (đổi được số nợ)', dc.loi !== null);

  // Không có hàng: không dòng, không lô, không sổ kho, không vào danh sách nhập, báo cáo không đổi.
  const { rows: [h] } = await db.query(`
    select (select count(*) from kho_phieu_nhap_dong d join kho_phieu_nhap p on p.id = d.phieu_nhap_id where p.loai = 'no_dau')::int as dong,
           (select count(*) from kho_so_cai s join kho_phieu_nhap p on p.id = s.chung_tu_id where p.loai = 'no_dau')::int as so`);
  ok('Nợ đầu kỳ: không dòng hàng, không dòng sổ kho', h.dong === 0 && h.so === 0);
  const ds = await duoi(UID.keToanA, `select count(*)::int as n from kho_v_phieu_nhap where loai = 'no_dau'`);
  ok('Danh sách phiếu nhập hàng (kho_v_phieu_nhap) không có nợ đầu kỳ', ds.rows?.[0]?.n === 0);
  ok('Báo cáo xuất nhập tồn không đổi', await xnt() === truoc);
  await doiSoat('Sau nợ đầu kỳ');
});

// ===========================================================================
let pnUc;
await nhom('3 · NỢ ĐẦU KỲ: THANH TOÁN TỰ CHIA, HỦY', async () => {
  // Một phiếu mua mới của NCC Úc, hạn 15 ngày — xếp sau nợ đầu kỳ (đã quá hạn).
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => 0, p_chi_phi_khac => 0, p_ghi_chu => null,
      p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $6::jsonb)`,
    [cnA.id, maGui(), nccUc, vt.kho, homNay,
     JSON.stringify([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 10, don_gia_kg: 500000, truong_them: { nhiet_do: 2 } }])]);
  pnUc = luu.rows?.[0]?.phieu_id;
  await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [pnUc, luu.rows[0].phien_ban_moi]);
  const d = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [pnUc]);
  ok('Có thêm phiếu mua 5.000.000 của NCC Úc', d.loi === null && Number((await congNo(pnUc)).con_no) === 5000000, d.loi ?? '');

  const t1 = await traTien(nccUc, 10000000);
  ok('Trả 10.000.000 không chọn phiếu: ghi được', t1.loi === null, t1.loi ?? '');
  const pb1 = (await db.query(`select phieu_nhap_id, so_tien from kho_thanh_toan_phan_bo where thanh_toan_id = $1`,
    [t1.rows?.[0]?.thanh_toan_id])).rows;
  ok('Tự chia: trả hết vào nợ đầu kỳ (hạn sớm nhất) trước',
     pb1.length === 1 && pb1[0].phieu_nhap_id === ndUc.phieu_id && Number(pb1[0].so_tien) === 10000000, JSON.stringify(pb1));
  const t2 = await traTien(nccUc, 3000000);
  const pb2 = (await db.query(`select phieu_nhap_id, so_tien from kho_thanh_toan_phan_bo where thanh_toan_id = $1`,
    [t2.rows?.[0]?.thanh_toan_id])).rows;
  const tien = id => Number(pb2.find(x => x.phieu_nhap_id === id)?.so_tien);
  ok('Trả tiếp 3.000.000: 2.345.678 hết nợ đầu kỳ, 654.322 sang phiếu mua',
     t2.loi === null && tien(ndUc.phieu_id) === 2345678 && tien(pnUc) === 654322, t2.loi ?? JSON.stringify(pb2));
  ok('Nợ đầu kỳ NCC Úc đã hết', Number((await congNo(ndUc.phieu_id)).con_no) === 0);
  const vuot = await traTien(nccUc, 5000000);
  ok('Trả vượt số còn nợ → bị chặn như cũ', vuot.loi !== null && /lớn hơn công nợ/.test(vuot.loi), vuot.loi ?? '');

  const h1 = await duoi(UID.keToanA, `select kho_huy_phieu_nhap($1, 'Ghi nhầm') as cau`, [ndUc.phieu_id]);
  ok('Hủy nợ đầu kỳ đã trả tiền → bị chặn', h1.loi !== null && /đã có thanh toán/.test(h1.loi), h1.loi ?? 'HỦY ĐƯỢC');

  const tk = await duoi(UID.thuKhoA, `select kho_huy_phieu_nhap($1, 'x')`, [ndMy.phieu_id]);
  ok('Thủ kho KHÔNG hủy được nợ đầu kỳ', tk.loi !== null && /kế toán/.test(tk.loi), tk.loi ?? 'HỦY ĐƯỢC');
  const kLyDo = await duoi(UID.keToanA, `select kho_huy_phieu_nhap($1, '  ')`, [ndMy.phieu_id]);
  ok('Hủy phải có lý do', kLyDo.loi !== null && /lý do/.test(kLyDo.loi));
  const h2 = await duoi(UID.keToanA, `select kho_huy_phieu_nhap($1, 'Ghi sai số') as cau`, [ndMy.phieu_id]);
  ok('Kế toán hủy được nợ đầu kỳ chưa trả', h2.loi === null && /Đã hủy nợ đầu kỳ/.test(h2.rows[0].cau), h2.loi ?? '');
  ok('NCC Mỹ biến khỏi công nợ', (await congNoNcc(nccMy)) === undefined);
  const h3 = await duoi(UID.keToanA, `select kho_huy_phieu_nhap($1, 'Lần nữa') as cau`, [ndMy.phieu_id]);
  ok('Hủy lần hai: báo đã hủy, không lỗi', h3.loi === null && /đã bị hủy trước đó/.test(h3.rows[0].cau));
  const lai = await ghiNo(UID.keToanA, maGui(), [{ nha_cung_cap_id: nccMy, so_tien: 4800000 }]);
  ok('Hủy xong ghi lại được đúng số', lai.loi === null && Number((await congNoNcc(nccMy)).con_no) === 4800000, lai.loi ?? '');

  // Gỡ tiền rồi mới hủy được.
  for (const t of [t1, t2]) await duoi(UID.keToanA, `select kho_huy_thanh_toan($1, 'Gỡ để hủy nợ đầu kỳ')`, [t.rows[0].thanh_toan_id]);
  const h4 = await duoi(UID.qlA, `select kho_huy_phieu_nhap($1, 'Làm lại') as cau`, [ndUc.phieu_id]);
  ok('Gỡ hết thanh toán → quản lý hủy được nợ đầu kỳ NCC Úc', h4.loi === null, h4.loi ?? '');
  ok('Công nợ NCC Úc chỉ còn phiếu mua', (await congNoNcc(nccUc))?.so_phieu === 1
     && Number((await congNoNcc(nccUc)).con_no) === 5000000);
  await doiSoat('Sau thanh toán và hủy nợ đầu kỳ');
});

// ===========================================================================
await nhom('4 · NỢ ĐẦU KỲ: THỦ KHO VÀ NV QUẦY KHÔNG THẤY', async () => {
  const idsNd = (await db.query(`select id from kho_phieu_nhap where loai = 'no_dau'`)).rows.map(r => r.id);
  for (const [uid, ai] of [[UID.thuKhoA, 'Thủ kho'], [UID.nvQuayA, 'NV quầy']]) {
    const bang = await duoi(uid, `select count(*)::int as n from kho_phieu_nhap where loai = 'no_dau'`);
    const cn = await duoi(uid, `select count(*)::int as n from kho_v_cong_no_phieu`);
    ok(`${ai} không đọc được phiếu nợ đầu kỳ, công nợ`, bang.rows?.[0]?.n === 0 && cn.rows?.[0]?.n === 0);
  }
  const ds = await duoi(UID.thuKhoA, `select * from kho_ds_phieu_nhap_kg($1, null, null, null, null, false, 200, 0)`, [cnA.id]);
  ok('Danh sách nhận hàng của thủ kho không có phiếu ND-',
     ds.loi === null && ds.rows.length >= 1 && ds.rows.every(r => r.loai !== 'no_dau' && !r.so_phieu.startsWith('ND-')),
     ds.loi ?? JSON.stringify(ds.rows.map(r => r.so_phieu)));
  const tim = await duoi(UID.thuKhoA, `select * from kho_ds_phieu_nhap_kg($1, null, 'ND-', null, null, false, 200, 0)`, [cnA.id]);
  ok('Tìm "ND-" cũng không ra', tim.loi === null && tim.rows.length === 0);
  let docDuoc = 0;
  for (const id of idsNd) if ((await duoi(UID.thuKhoA, `select kho_doc_phieu_nhap_kg($1)`, [id])).loi === null) docDuoc++;
  ok('Thủ kho mở thẳng phiếu ND- bằng id → bị từ chối', docDuoc === 0);
  const ql = await duoi(UID.qlA, `select kho_doc_phieu_nhap_kg($1)`, [idsNd[0]]);
  ok('(Quản lý cũng không mở phiếu ND- bằng hàm chỉ kg — xem ở Công nợ)', ql.loi !== null);
  const ncc = await duoi(UID.thuKhoA, `select * from kho_ds_ncc_nhap($1)`, [cnA.id]);
  ok('Danh sách NCC khi nhận hàng: NCC Mỹ (chỉ có nợ đầu kỳ) chưa có "lần nhập cuối"',
     ncc.rows?.find(r => r.id === nccMy)?.lan_cuoi === null, JSON.stringify(ncc.rows));
});

// ===========================================================================
let luotQl;
await nhom('5 · TỒN ĐẦU KỲ LƯỚI: NHIỀU VỊ TRÍ → NHIỀU PHIẾU, TỰ DUYỆT', async () => {
  const tonTruoc = async (v, ma) => Number((await db.query(
    `select coalesce(sum(so_kg), 0) as kg from kho_ton where vi_tri_id = $1 and mat_hang_id = $2`, [v, MH[ma].id])).rows[0].kg);
  const truocKho = await tonTruoc(vt.kho, 'T-NACVAI');

  luotQl = maGui();
  const ngayTon = await ngay(-1);
  const luoi = [
    { vi_tri_id: vt.kho, mat_hang_id: MH['T-NACVAI'].id, so_goi: 2, so_kg: 20.5, don_gia_kg: 300000, han_dung: await ngay(20) },
    { vi_tri_id: vt.quay, mat_hang_id: MH['C-NACVAI'].id, so_goi: 8, so_kg: 4.2, don_gia_kg: 420000 },
    { vi_tri_id: vt.kho, mat_hang_id: MH['P-MO'].id, so_kg: 3.25 },
    { vi_tri_id: vt.kho_mat, mat_hang_id: MH['T-GAU'].id, so_goi: 1, so_kg: 9.9, don_gia_kg: null },
  ];
  const r = await luuTon(UID.qlA, luotQl, ngayTon, luoi);
  const kq = r.rows?.[0]?.kq;
  ok('Quản lý lưu lưới 4 dòng, 3 vị trí → 3 phiếu', r.loi === null && kq.phieu.length === 3 && kq.da_co === false,
     r.loi ?? JSON.stringify(kq));
  ok('Cài đặt cho tự duyệt + quản lý → cả 3 phiếu đã duyệt', kq?.phieu.every(p => p.trang_thai === 'da_duyet'), JSON.stringify(kq));
  const theo = Object.fromEntries((kq?.phieu ?? []).map(p => [p.vi_tri_id, p]));
  ok('Số dòng từng phiếu đúng (kho 2, quầy 1, kho mát 1)',
     theo[vt.kho]?.so_dong === 2 && theo[vt.quay]?.so_dong === 1 && theo[vt.kho_mat]?.so_dong === 1);
  ok('Số phiếu dạng TD-', kq?.phieu.every(p => /^TD-\d{4}-\d{4}$/.test(p.so_phieu)));
  ok('Phiếu theo thứ tự vị trí xuất hiện trong lưới',
     kq?.phieu.map(p => p.vi_tri_id).join() === [vt.kho, vt.quay, vt.kho_mat].join());

  ok('Tồn kho lạnh tăng đúng 20,5 kg nạc vai', await tonTruoc(vt.kho, 'T-NACVAI') - truocKho === 20.5);
  ok('Tồn quầy 4,2 kg nạc vai cắt', await tonTruoc(vt.quay, 'C-NACVAI') === 4.2);
  ok('Tồn kho mát 9,9 kg gầu', await tonTruoc(vt.kho_mat, 'T-GAU') === 9.9);
  const { rows: lo } = await db.query(`
    select m.ma, l.nguon, l.han_dung::text as han, g.gia_tri, g.so_kg_goc
    from kho_phieu_nhap_dong d join kho_lo l on l.id = d.lo_id join kho_mat_hang m on m.id = l.mat_hang_id
    join kho_lo_gia g on g.lo_id = l.id
    join kho_phieu_nhap p on p.id = d.phieu_nhap_id where p.ma_gui_chung = $1`, [luotQl]);
  const loTheo = Object.fromEntries(lo.map(x => [x.ma, x]));
  ok('Lô nguồn "ton_dau"', lo.length === 4 && lo.every(x => x.nguon === 'ton_dau'));
  ok('Giá vốn lô = kg × đơn giá (20,5 × 300.000)', Number(loTheo['T-NACVAI'].gia_tri) === 6150000);
  ok('Hạn trống = ngày tồn + hạn mặc định (C-NACVAI 3 ngày)', loTheo['C-NACVAI'].han === await ngay(2), loTheo['C-NACVAI'].han);
  ok('Hạn gõ tay được giữ', loTheo['T-NACVAI'].han === await ngay(20));
  ok('Món không đếm gói (mỡ) không cần số gói; đơn giá null = 0', Number(loTheo['P-MO'].gia_tri) === 0 && Number(loTheo['T-GAU'].gia_tri) === 0);
  const { rows: [pn] } = await db.query(`select ngay_nhap::text as d, nguoi_tao, nguoi_duyet from kho_phieu_nhap where id = $1`, [theo[vt.kho].phieu_id]);
  ok('Ngày nhập = ngày tồn đầu kỳ, người lập = người duyệt = quản lý',
     pn.d === ngayTon && pn.nguoi_tao === nsId[UID.qlA] && pn.nguoi_duyet === nsId[UID.qlA]);

  const lai = await luuTon(UID.qlA, luotQl, ngayTon, luoi);
  ok('Bấm "Xác nhận" hai lần: trả lại đúng 3 phiếu cũ, da_co = true',
     lai.loi === null && lai.rows[0].kq.da_co === true
       && lai.rows[0].kq.phieu.map(p => p.phieu_id).join() === kq.phieu.map(p => p.phieu_id).join(),
     lai.loi ?? JSON.stringify(lai.rows?.[0]?.kq));
  ok('Tồn không cộng lần hai', await tonTruoc(vt.kho, 'T-NACVAI') - truocKho === 20.5);
  await doiSoat('Sau tồn đầu kỳ lưới');
});

// ===========================================================================
await nhom('6 · TỒN ĐẦU KỲ LƯỚI: THỦ KHO, CHỜ DUYỆT, QUYỀN', async () => {
  const tk = await luuTon(UID.thuKhoA, maGui(), homNay, [
    { vi_tri_id: vt.kho, mat_hang_id: MH['T-SUON'].id, so_goi: 1, so_kg: 7 },
    { vi_tri_id: vt.quay, mat_hang_id: MH['C-SUON'].id, so_goi: 3, so_kg: 1.5 }]);
  ok('Thủ kho lưu lưới không giá → 2 phiếu CHỜ DUYỆT (thủ kho không duyệt được)',
     tk.loi === null && tk.rows[0].kq.phieu.length === 2 && tk.rows[0].kq.phieu.every(p => p.trang_thai === 'cho_duyet'),
     tk.loi ?? JSON.stringify(tk.rows?.[0]?.kq));
  ok('Kết quả trả thủ kho không có khóa tiền', khoaTien(tk.rows?.[0]?.kq).length === 0);
  const tkGia = await luuTon(UID.thuKhoA, maGui(), homNay, [
    { vi_tri_id: vt.kho, mat_hang_id: MH['T-SUON'].id, so_goi: 1, so_kg: 7, don_gia_kg: 280000 }]);
  ok('Thủ kho gửi đơn giá → từ chối, câu lỗi không có số tiền',
     tkGia.loi !== null && /không điền giá/.test(tkGia.loi) && !tkGia.loi.includes('280'), tkGia.loi ?? 'GHI ĐƯỢC');
  const tkNull = await luuTon(UID.thuKhoA, maGui(), homNay, [
    { vi_tri_id: vt.kho, mat_hang_id: MH['T-SUON'].id, so_goi: 1, so_kg: 1, don_gia_kg: null }]);
  ok('Thủ kho để ô đơn giá null → được (như để trống)', tkNull.loi === null, tkNull.loi ?? '');

  // Kế toán duyệt phiếu chờ của thủ kho như thường lệ.
  const cho = tk.rows[0].kq.phieu[0].phieu_id;
  const d = await duoi(UID.keToanA, `select kho_duyet_phieu_nhap($1)`, [cho]);
  ok('Kế toán duyệt được phiếu tồn đầu kỳ thủ kho lập', d.loi === null, d.loi ?? '');

  const nv = await luuTon(UID.nvQuayA, maGui(), homNay, [{ vi_tri_id: vt.quay, mat_hang_id: MH['C-SUON'].id, so_goi: 1, so_kg: 1 }]);
  ok('NV quầy KHÔNG lưu được tồn đầu kỳ', nv.loi !== null && /không được nhập tồn đầu kỳ/.test(nv.loi), nv.loi ?? '');
  const kt = await luuTon(UID.keToanA, maGui(), homNay, [{ vi_tri_id: vt.kho, mat_hang_id: MH['T-SUON'].id, so_goi: 1, so_kg: 1 }]);
  ok('Kế toán (không có quyền nhập) KHÔNG lưu được', kt.loi !== null);

  // Chủ tắt tự duyệt → quản lý lưu cũng để chờ duyệt.
  const goc = await duoi(UID.chu, `select kho_luu_cai_dat_goc($1, 'gia_tri', true, false, 'kiem_ke', false)`, [cnA.id]);
  ok('Chủ tắt "cho tự duyệt"', goc.loi === null, goc.loi ?? '');
  const ql = await luuTon(UID.qlA, maGui(), homNay, [{ vi_tri_id: vt.kho_mat, mat_hang_id: MH['T-BACHI'].id, so_goi: 1, so_kg: 5, don_gia_kg: 250000 }]);
  ok('Tự duyệt tắt → phiếu của quản lý để CHỜ DUYỆT', ql.loi === null && ql.rows[0].kq.phieu[0].trang_thai === 'cho_duyet',
     ql.loi ?? JSON.stringify(ql.rows?.[0]?.kq));
  const tuDuyet = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [ql.rows[0].kq.phieu[0].phieu_id]);
  ok('…và quản lý đó không tự duyệt được', tuDuyet.loi !== null && /tự duyệt/.test(tuDuyet.loi));
  await duoi(UID.chu, `select kho_luu_cai_dat_goc($1, 'gia_tri', true, false, 'kiem_ke', true)`, [cnA.id]);
  await doiSoat('Sau tồn đầu kỳ chờ duyệt');
});

// ===========================================================================
await nhom('7 · TỒN ĐẦU KỲ LƯỚI: LỖI CHỈ ĐÚNG DÒNG, KHÔNG GHI GÌ', async () => {
  const demPhieu = async () => Number((await db.query(`select count(*) as n from kho_phieu_nhap where loai = 'ton_dau'`)).rows[0].n);
  const truoc = await demPhieu();
  const tot = { vi_tri_id: vt.kho, mat_hang_id: MH['T-SUON'].id, so_goi: 1, so_kg: 2 };
  const loi = async (dong, mau, ten, ngayTon = homNay) => {
    const x = await luuTon(UID.qlA, maGui(), ngayTon, dong);
    ok(ten, x.loi !== null && mau.test(x.loi), x.loi ?? 'GHI ĐƯỢC');
  };
  await loi([tot, tot, { vi_tri_id: vt.kho, mat_hang_id: MH['T-SUON'].id, so_goi: 1 }],
            /^Dòng 3 \(Sườn[^)]*\): chưa nhập số kg/, 'Dòng 3 thiếu kg → "Dòng 3 (tên món)"');
  await loi([tot, { vi_tri_id: vt.quay, mat_hang_id: MH['C-SUON'].id, so_kg: 1 }],
            /^Dòng 2 .*chưa nhập số/, 'Món đếm gói mà không có số gói → lỗi dòng 2');
  await loi([{ ...tot, vi_tri_id: vt.cho_huy }], /^Dòng 1: chọn nơi để/, 'Vị trí "chờ hủy" → lỗi');
  await loi([{ ...tot, vi_tri_id: vtB.kho }], /^Dòng 1: chọn nơi để/, 'Vị trí của chi nhánh khác → lỗi');
  await loi([{ ...tot, mat_hang_id: maGui() }], /^Dòng 1: mặt hàng không có/, 'Mặt hàng không có → lỗi');
  await loi([{ ...tot, so_kg: 1.2345 }], /tối đa 3 số lẻ/, 'Kg 4 số lẻ → lỗi');
  await loi([{ ...tot, han_dung: 'mai' }], /hạn dùng không hợp lệ/, 'Hạn sai dạng → lỗi');
  await loi([{ ...tot, nha_cung_cap_id: nccUc }], /"nha_cung_cap_id" không được nhận/, 'Trường lạ (NCC) → lỗi');
  await loi([{ ...tot, don_gia_kg: -1 }], /đơn giá/, 'Đơn giá âm → lỗi');
  await loi([tot], /sau hôm nay/, 'Ngày tồn đầu kỳ ở tương lai → lỗi', await ngay(1));
  await loi([tot], /quá 90 ngày/, 'Ngày quá 90 ngày trước → lỗi', await ngay(-91));
  await loi([], /Chưa có dòng hàng/, 'Lưới trống → lỗi');
  const nhieu = Array.from({ length: 501 }, () => tot);
  await loi(nhieu, /Tối đa 500 dòng/, '501 dòng → lỗi');
  ok('Các lần lỗi không để lại phiếu nào', await demPhieu() === truoc);
  await doiSoat('Sau các lần lỗi');
});

// ===========================================================================
await nhom('8 · TIẾN ĐỘ THIẾT LẬP: TỪNG BƯỚC, BỎ QUA, CON_LAI', async () => {
  // Chi nhánh mới tinh C: chưa có ai, chưa khởi tạo kho.
  const { rows: [cnC] } = await db.query(`insert into chi_nhanh (ma, ten) values ('q3', 'Beeftown Quận 3') returning *`);
  const c0 = await tienDo(UID.chu, cnC.id);
  ok('Chi nhánh chưa khởi tạo: vẫn trả tiến độ, da_khoi_tao = false', c0.loi === null && c0.rows[0].v.da_khoi_tao === false, c0.loi ?? '');
  ok('Chưa có thủ kho / NV quầy → bước nhân viên chưa xong',
     c0.rows[0].v.chi_nhanh_nhan_vien.xong === false && c0.rows[0].v.chi_nhanh_nhan_vien.so === 0);
  ok('Chưa có kho / quầy → bước vị trí thiếu', c0.rows[0].v.vi_tri_ly_do_ma_vach.xong === false);

  const v = async () => (await tienDo(UID.qlB, cnB.id)).rows[0].v;
  const BUOC = ['chi_nhanh_nhan_vien', 'mat_hang', 'cong_thuc', 'ncc_no_dau', 'ton_dau',
                'gia_von', 'dinh_muc', 'vi_tri_ly_do_ma_vach', 'nguong', 'may_chung'];
  let t = await v();
  ok('Đủ 10 bước + con_lai + tong', BUOC.every(b => typeof t[b]?.xong === 'boolean') && t.tong === 10);
  const conLai = x => BUOC.filter(b => !x[b].xong).length;
  ok('con_lai = số bước chưa xong', t.con_lai === conLai(t), `${t.con_lai} vs ${conLai(t)}`);
  ok('Q7 lúc đầu: nhân viên xong (có thủ kho), vị trí/lý do/mã vạch xong (mặc định)',
     t.chi_nhanh_nhan_vien.xong && t.chi_nhanh_nhan_vien.so === 1 && t.vi_tri_ly_do_ma_vach.xong);
  ok('Q7 lúc đầu: giá vốn, ngưỡng, máy chung, tồn đầu kỳ, nợ đầu kỳ chưa xong',
     !t.gia_von.xong && !t.nguong.xong && !t.may_chung.xong && !t.ton_dau.xong && !t.ncc_no_dau.xong);
  ok('Bước nhân viên, mặt hàng không bỏ qua được; bước khác được',
     !t.chi_nhanh_nhan_vien.duoc_bo_qua && !t.mat_hang.duoc_bo_qua && t.may_chung.duoc_bo_qua && t.ncc_no_dau.duoc_bo_qua);
  const batDau = t.con_lai;

  // Mặt hàng: phần cắt thiếu giá bán / mã cân.
  ok('Mặt hàng: 8 phần cắt thiếu giá bán / mã cân', t.mat_hang.xong === false && t.mat_hang.thieu === 8 && t.mat_hang.so === 19,
     JSON.stringify(t.mat_hang));
  let i = 100;
  for (const m of Object.values(MH).filter(m => m.loai === 'phan_cat')) {
    await db.query(`update kho_mat_hang set gia_ban_kg = 900000, ma_can = $2 where id = $1`, [m.id, String(i++)]);
  }
  t = await v();
  ok('Điền đủ giá bán, mã cân → mặt hàng xong', t.mat_hang.xong && t.mat_hang.thieu === 0);

  // Công thức.
  await db.query(`insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Thăn ngoại chuẩn')`, [MH['T-THANNGOAI'].id]);
  t = await v();
  ok('Có 1 công thức → xong; còn 7 tảng chưa có', t.cong_thuc.xong && t.cong_thuc.so === 1 && t.cong_thuc.thieu === 7);

  // Nợ đầu kỳ: Q7 chưa ghi. Kế toán Q1 không đánh dấu hộ Q7; quản lý Q7 đánh dấu "không có nợ".
  ok('NCC & nợ đầu kỳ Q7: có 3 NCC, chưa ghi', t.ncc_no_dau.so === 3 && t.ncc_no_dau.thieu === 3 && !t.ncc_no_dau.xong);
  const ktB = await danhDau(UID.keToanA, cnB.id, 'ncc_no_dau', true);
  ok('Kế toán Q1 KHÔNG đánh dấu được cho Q7', ktB.loi !== null);
  const dd = await danhDau(UID.qlB, cnB.id, 'ncc_no_dau', true);
  ok('Quản lý Q7 bấm "Không có nợ đầu kỳ" → xong, bo_qua = true',
     dd.loi === null && dd.rows[0].v.ncc_no_dau.xong && dd.rows[0].v.ncc_no_dau.bo_qua, dd.loi ?? '');
  const hai = await danhDau(UID.qlB, cnB.id, 'ncc_no_dau', true);
  ok('Bấm lần hai không lỗi', hai.loi === null);
  const bo = await danhDau(UID.qlB, cnB.id, 'ncc_no_dau', false);
  ok('Bỏ đánh dấu → chưa xong lại', bo.loi === null && !bo.rows[0].v.ncc_no_dau.xong && !bo.rows[0].v.ncc_no_dau.bo_qua);
  // Ở Q1: kế toán đánh dấu được (có quyền ke_toan ở Q1); đã có phiếu nợ đầu kỳ thì xong sẵn.
  const tA = (await tienDo(UID.keToanA, cnA.id)).rows[0].v;
  ok('Q1 đã ghi nợ đầu kỳ → bước NCC & nợ đầu kỳ xong (NCC Nhật còn thiếu)',
     tA.ncc_no_dau.xong && tA.ncc_no_dau.thieu === 2, JSON.stringify(tA.ncc_no_dau));
  const ktA = await danhDau(UID.keToanA, cnA.id, 'ncc_no_dau', true);
  ok('Kế toán Q1 bấm "Không có nợ đầu kỳ" ở Q1 được', ktA.loi === null, ktA.loi ?? '');
  const ktKhac = await danhDau(UID.keToanA, cnA.id, 'may_chung', true);
  ok('Kế toán KHÔNG đánh dấu được bước khác', ktKhac.loi !== null);
  // Ghi nợ đầu kỳ ở Q7 bằng quản lý Q7 (ke_toan có quản lý).
  const noB = await ghiNo(UID.qlB, maGui(), [{ nha_cung_cap_id: nccUc, so_tien: 2000000 }], cnB.id);
  t = await v();
  ok('Quản lý Q7 ghi nợ đầu kỳ 1 NCC → bước xong, còn 2 NCC chưa ghi',
     noB.loi === null && t.ncc_no_dau.xong && !t.ncc_no_dau.bo_qua && t.ncc_no_dau.thieu === 2, noB.loi ?? JSON.stringify(t.ncc_no_dau));

  // Tồn đầu kỳ: kho + quầy Q7.
  ok('Tồn đầu kỳ Q7: 2 vị trí chưa có', t.ton_dau.thieu === 2 && t.ton_dau.so === 0);
  await luuTon(UID.qlB, maGui(), homNay, [{ vi_tri_id: vtB.kho, mat_hang_id: MH['T-SUON'].id, so_goi: 1, so_kg: 8 }], cnB.id);
  t = await v();
  ok('Mới có kho → còn thiếu quầy', !t.ton_dau.xong && t.ton_dau.so === 1 && t.ton_dau.thieu === 1);
  await luuTon(UID.qlB, maGui(), homNay, [{ vi_tri_id: vtB.quay, mat_hang_id: MH['C-SUON'].id, so_goi: 2, so_kg: 1 }], cnB.id);
  t = await v();
  ok('Đủ kho và quầy → tồn đầu kỳ xong', t.ton_dau.xong && t.ton_dau.thieu === 0);

  // Giá vốn: chỉ chủ; quản lý không đánh dấu bỏ qua được.
  const qlGv = await danhDau(UID.qlB, cnB.id, 'gia_von', true);
  ok('Quản lý KHÔNG bỏ qua được bước giá vốn (việc của chủ)', qlGv.loi !== null);
  await duoi(UID.chu, `select kho_luu_cai_dat_goc($1, 'gia_tri', true, false, 'kiem_ke', true)`, [cnB.id]);
  t = await v();
  ok('Chủ bấm Lưu cài đặt gốc (không đổi gì) → giá vốn xong', t.gia_von.xong && !t.gia_von.bo_qua);

  // Định mức tồn quầy.
  await db.query(`update kho_mat_hang set quay_toi_thieu_goi = 5 where id = $1`, [MH['C-THANNGOAI'].id]);
  t = await v();
  ok('1 món quầy có tồn tối thiểu → định mức xong', t.dinh_muc.xong && t.dinh_muc.so === 1 && t.dinh_muc.thieu === 7);

  // Vị trí / lý do / mã vạch: tắt mẫu mã vạch → thiếu 1.
  await duoi(UID.qlB, `select kho_luu_cai_dat($1, $2, null, 3, 1)`, [cnB.id, vtB.kho]);
  t = await v();
  ok('Tắt mẫu mã vạch → bước vị trí/lý do/mã vạch thiếu 1', !t.vi_tri_ly_do_ma_vach.xong && t.vi_tri_ly_do_ma_vach.thieu === 1);
  await duoi(UID.qlB, `select kho_luu_cai_dat($1, $2, '2XCCCCCWWWWWK', 3, 1)`, [cnB.id, vtB.kho]);
  t = await v();
  ok('Bật lại → xong', t.vi_tri_ly_do_ma_vach.xong);

  // Ngưỡng. Gạt công tắc "Quầy phải bấm nhận" cũng đi qua kho_luu_nguong —
  // không được tính là đã xem ngưỡng.
  ok('Trước khi lưu ngưỡng: bước ngưỡng chưa xong', !t.nguong.xong);
  const cq = await duoi(UID.qlB, `select kho_luu_nguong($1, '{"chuyen_quay_can_nhan": true}'::jsonb)`, [cnB.id]);
  t = await v();
  ok('Chỉ gạt công tắc quầy → bước ngưỡng vẫn chưa xong', cq.loi === null && !t.nguong.xong, cq.loi ?? '');
  const ng = await duoi(UID.qlB, `select kho_luu_nguong($1, '{"nguong_gia_mua_pt": 5}'::jsonb)`, [cnB.id]);
  t = await v();
  ok('Lưu ngưỡng → xong', ng.loi === null && t.nguong.xong, ng.loi ?? '');

  // Máy dùng chung: bỏ qua, rồi có máy thật.
  const tkDd = await danhDau(UID.thuKhoB, cnB.id, 'may_chung', true);
  ok('Thủ kho KHÔNG đánh dấu được', tkDd.loi !== null);
  const sai = await danhDau(UID.qlB, cnB.id, 'mat_hang', true);
  ok('Bước mặt hàng không bỏ qua được', sai.loi !== null && /không bỏ qua được/.test(sai.loi));
  const la = await danhDau(UID.qlB, cnB.id, 'khong_co', true);
  ok('Bước không có thật → lỗi', la.loi !== null);
  const mc = await danhDau(UID.qlB, cnB.id, 'may_chung', true);
  ok('Quản lý bỏ qua "Máy dùng chung" → xong', mc.loi === null && mc.rows[0].v.may_chung.xong && mc.rows[0].v.may_chung.bo_qua);
  await danhDau(UID.qlB, cnB.id, 'may_chung', false);
  const { rows: [nsMay] } = await db.query(
    `insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro, dang_lam)
     values (gen_random_uuid(), $1, 'Máy quầy Q7', 'may_chung', true) returning id`, [cnB.id]);
  await db.query(`insert into kho_may (chi_nhanh_id, nhan_su_id, ten) values ($1, $2, 'Tablet quầy')`, [cnB.id, nsMay.id]);
  t = await v();
  ok('Có 1 máy đang dùng → xong, không cần bỏ qua', t.may_chung.xong && !t.may_chung.bo_qua && t.may_chung.so === 1);

  // web/src/lib/kho/chung.ts (BUOC_THIET_LAP) soi gương: đủ bước, đúng nút "Bỏ qua".
  const chung = readFileSync(new URL('../../web/src/lib/kho/chung.ts', import.meta.url), 'utf8');
  // Tên bước hai thứ tiếng: ten: { vi: '…', en: '…' } (BUOC_THIET_LAP_NB).
  const web = [...chung.matchAll(/\{ khoa: '(\w+)', ten: \{ vi: '[^']+', en: '[^']+' \}, boQua: (true|false) \}/g)].map(m => [m[1], m[2] === 'true']);
  ok('BUOC_THIET_LAP trong chung.ts khớp 10 bước của database, cùng thứ tự đã định',
     web.map(x => x[0]).join() === BUOC.join(), web.map(x => x[0]).join());
  ok('BUOC_THIET_LAP.boQua khớp duoc_bo_qua', web.every(([k, b]) => t[k]?.duoc_bo_qua === b));

  ok('Q7: mọi bước xong, con_lai = 0', t.con_lai === 0 && conLai(t) === 0, JSON.stringify(t));
  ok('con_lai giảm dần từ lúc đầu', batDau > 0 && t.con_lai < batDau, `${batDau} → ${t.con_lai}`);

  // Ai gọi được, và kết quả không có tiền.
  for (const [uid, ai] of [[UID.thuKhoB, 'Thủ kho'], [UID.qlB, 'Quản lý']]) {
    const r = await tienDo(uid, cnB.id);
    // Tên bước "gia_von" khớp mẫu tiền nhưng giá trị chỉ là cờ đúng/sai.
    const coGiaVon = r.rows?.[0]?.v?.gia_von;
    ok(`${ai}: bước "gia_von" chỉ có cờ đúng/sai`,
       coGiaVon && Object.values(coGiaVon).every(x => typeof x === 'boolean'), JSON.stringify(coGiaVon));
    const { gia_von, ...conLaiKhoa } = r.rows?.[0]?.v ?? {};
    ok(`${ai}: không khóa tiền nào khác`, r.loi === null && khoaTien(conLaiKhoa).length === 0,
       r.loi ?? khoaTien(conLaiKhoa).join(', '));
    ok(`${ai}: mọi giá trị là số đếm hoặc đúng/sai`,
       Object.values(conLaiKhoa).every(x => typeof x !== 'object' || Object.values(x).every(y => typeof y === 'number' || typeof y === 'boolean')));
  }
  const nvA = await tienDo(UID.nvQuayA, cnA.id);
  ok('NV quầy xem được tiến độ chi nhánh mình', nvA.loi === null);
  const tkKhac = await tienDo(UID.thuKhoA, cnB.id);
  ok('Thủ kho Q1 KHÔNG xem được tiến độ Q7', tkKhac.loi !== null);
  const mkt = await tienDo(UID.mktA, cnA.id);
  ok('Marketing KHÔNG xem được', mkt.loi !== null);
  const bang = await duoi(UID.thuKhoB, `select count(*)::int as n from kho_thiet_lap_bo_qua`);
  const ghiThang = await duoi(UID.qlB, `insert into kho_thiet_lap_bo_qua (chi_nhanh_id, buoc) values ($1, 'nguong')`, [cnB.id]);
  ok('Bảng đánh dấu đọc được, KHÔNG ghi thẳng được (chỉ qua hàm)', bang.loi === null && ghiThang.loi !== null, ghiThang.loi ?? 'GHI ĐƯỢC');
});

// ===========================================================================
await nhom('9 · CUỐI CÙNG', async () => {
  await doiSoat('Cuối cùng');
});

process.exit(ketThuc('NỢ ĐẦU KỲ · TỒN ĐẦU KỲ LƯỚI · THIẾT LẬP'));
