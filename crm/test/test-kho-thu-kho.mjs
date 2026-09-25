/**
 * BEEFTOWN KHO — Kiểm thử "thủ kho không thấy tiền" (0031, GĐ5a)
 * ================================================================
 *
 *     node test/test-kho-thu-kho.mjs
 *
 * Chủ nhà hàng đã chốt: thủ kho chỉ CHỤP hóa đơn, CÂN, ĐẾM — không thấy giá
 * nhập, giá vốn, thành tiền, lãi. Kế toán hoặc quản lý điền giá khi duyệt;
 * kế toán duyệt được phiếu nhập. Giá nhập tăng quá ngưỡng thì cảnh báo.
 *
 * Bốn câu hỏi:
 *   1. Có bảng / view / cột tiền nào thủ kho hoặc NV quầy đọc được không?
 *      Quét information_schema chứ không liệt kê tay — thêm cột tiền mới mà
 *      quên chặn là test đỏ.
 *   2. Mọi hàm thủ kho gọi được có trả khóa tiền nào không? Quét ĐỆ QUY.
 *   3. Câu lỗi thủ kho gặp có lộ số tiền không?
 *   4. Luồng mới chạy đúng: nhận hàng kg + ảnh → gửi → kế toán điền giá →
 *      so giá → duyệt; thủ kho sửa kg sau khi đã có giá thì giá không mất.
 * Cuối cùng: kho_doi_soat_ton() rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — THỦ KHO KHÔNG THẤY TIỀN');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

// Tên cột / khóa được coi là TIỀN (đúng như đặc tả GĐ5a).
const LA_TIEN = /gia|tien|thanh_tien|gia_von|gia_tri|thue|chi_phi|phai_tra|con_no|da_tra|giam_tru/;

// Cột khớp mẫu trên nhưng KHÔNG phải số tiền nhập / vốn — liệt kê đích danh,
// kèm lý do. Thêm vào đây phải là quyết định có ý thức.
const KHONG_PHAI_TIEN = new Set([
  'kho_mat_hang.gia_ban_kg',          // giá BÁN công khai, in trên thực đơn
  'kho_phien_pha_ra.gia_ban_kg',      // cùng con số giá bán, chụp lúc chốt phiên
  'kho_cai_dat.phuong_phap_gia_von',  // chữ 'gia_tri' | 'khoi_luong' — cách chia, không phải số tiền
  'kho_cai_dat.chi_phi_vao_gia_von',  // cờ đúng/sai
  'kho_cai_dat.vat_vao_gia_von',      // cờ đúng/sai
  'kho_cai_dat.nguong_gia_mua_pt',    // ngưỡng %, không phải tiền
]);

/** Mọi khóa tiền trong một giá trị JSON, quét đệ quy. Trả danh sách "đường.dẫn". */
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

// Các đơn giá dùng trong file — đủ lạ để không trùng số kg hay số phiếu.
const GIA = { cu_than: 500000, cu_than_xa: 450000, cu_nac: 350000, my_than: 990000,
              moi_than: 540000, moi_nac: 360500, ton_dau: 412300, vun: 100000 };

/** Chuỗi có dáng số tiền: "480.000 đ", "5000000đ", hay đúng một đơn giá ở trên. */
function coTien(s) {
  if (!s) return false;
  if (/\d[\d.,]*\s*(đồng|₫|đ)(?![\p{L}])/u.test(s)) return true;
  return Object.values(GIA).some(g => s.includes(String(g)) || s.includes(g.toLocaleString('vi-VN')));
}

// Lỗi và câu trả về mà thủ kho nhìn thấy trong cả file — soát ở nhóm cuối.
const cauThuKhoThay = [];
async function tk(sql, params = []) {
  const r = await duoi(UID.thuKhoA, sql, params);
  if (r.loi) cauThuKhoThay.push(r.loi);
  for (const dong of r.rows ?? []) {
    for (const v of Object.values(dong)) if (typeof v === 'string') cauThuKhoThay.push(v);
  }
  return r;
}

const MH = {};
let viTri = {};
let viTriB;
let nccUc, nccMy, nccMoi;
let lyDoHuy;

/** Phiếu mua "cũ" qua luồng của quản lý (hàm có giá, 0020) — làm lịch sử giá. */
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

/** Thủ kho lưu phiếu nhận hàng chỉ kg (0031). */
function luuKg(uid, t) {
  const f = uid === UID.thuKhoA ? tk : (sql, p) => duoi(uid, sql, p);
  return f(`
    select * from kho_luu_phieu_nhap_kg(
      p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
      p_loai => $5, p_nha_cung_cap_id => $6, p_vi_tri_id => $7, p_ngay_nhap => $8::date,
      p_so_hoa_don => $9, p_ngay_hoa_don => $10::date, p_ghi_chu => $11,
      p_anh_them => $12::text[], p_truong_them => $13::jsonb, p_dong => $14::jsonb)`,
    [t.id ?? null, t.cn ?? cnA.id, t.maGui ?? maGui(), t.phienBan ?? null,
     t.loai ?? 'mua', t.ncc ?? null, t.viTri ?? viTri.kho, t.ngay ?? homNay,
     t.soHoaDon ?? null, t.ngayHoaDon ?? null, t.ghiChu ?? null,
     t.anh ?? [], JSON.stringify(t.truongThem ?? {}), JSON.stringify(t.dong ?? [])]);
}

const docKg = (uid, id) => duoi(uid, `select kho_doc_phieu_nhap_kg($1) as p`, [id]);

function dienGia(uid, t) {
  const f = uid === UID.thuKhoA ? tk : (sql, p) => duoi(uid, sql, p);
  return f(`
    select kho_dien_gia_phieu_nhap(
      p_id => $1, p_phien_ban => $2, p_so_hoa_don => $3, p_ngay_hoa_don => $4::date,
      p_han_thanh_toan => $5::date, p_tien_thue => $6, p_chi_phi_khac => $7, p_gia => $8::jsonb) as pb`,
    [t.id, t.phienBan, t.soHoaDon ?? null, t.ngayHoaDon ?? null, t.hanTT ?? null,
     t.thue ?? 0, t.chiPhi ?? 0, JSON.stringify(t.gia ?? [])]);
}

const phienBan = async id => (await db.query(`select phien_ban from kho_phieu_nhap where id = $1`, [id])).rows[0].phien_ban;
const anh = cn => `${cn}/nhap/${maGui()}/1.jpg`;

// ===========================================================================
await nhom('1 · CHUẨN BỊ: KHO, DANH MỤC, NHÀ CUNG CẤP, LỊCH SỬ GIÁ', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  viTriB = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnB.id])).rows[0].id;
  lyDoHuy = (await db.query(`select id from kho_ly_do where loai = 'huy' order by thu_tu limit 1`)).rows[0].id;

  await duoi(UID.qlA, `update kho_mat_hang set gia_ban_kg = 900000 where ma = 'C-THANNGOAI'`);
  await duoi(UID.qlA, `insert into kho_mat_hang_gia (mat_hang_id, gia_tri_thu_hoi_kg) values ($1, $2)`,
             [MH['P-VUN'].id, GIA.vun]);

  // Ô bắt buộc của dòng hàng: nhiệt độ khi nhận. Phiếu tồn đầu kỳ được bỏ qua.
  const o = await duoi(UID.chu, `
    insert into kho_truong_them (doi_tuong, khoa, nhan, kieu, lua_chon, bat_buoc)
    values ('lo_hang', 'nhiet_do', 'Nhiệt độ khi nhận (°C)', 'so', '{}', true)`);
  ok('Chủ tạo ô bắt buộc "Nhiệt độ khi nhận"', o.loi === null, o.loi ?? '');

  const ncc = async ten => (await duoi(UID.keToanA,
    `insert into kho_nha_cung_cap (ten, so_ngay_no) values ($1, 15) returning id`, [ten])).rows[0].id;
  nccUc = await ncc('NCC Úc');
  nccMy = await ncc('NCC Mỹ');
  nccMoi = await ncc('NCC Mới');

  // Lịch sử giá NCC Úc: thăn ngoại 450.000 (20 ngày trước) rồi 500.000 (10
  // ngày trước — đây mới là "lần trước"); nạc vai 350.000. NCC Mỹ bán thăn
  // ngoại 990.000 — KHÔNG được đem ra so với hàng NCC Úc.
  const th = { truong_them: { nhiet_do: 2 } };
  await nhapCu({ ncc: nccUc, ngayNhap: await ngay(-20),
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 10, don_gia_kg: GIA.cu_than_xa, ...th }] });
  await nhapCu({ ncc: nccUc, ngayNhap: await ngay(-10), dong: [
    { mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 11, don_gia_kg: GIA.cu_than, ...th },
    { mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 9, don_gia_kg: GIA.cu_nac, ...th }] });
  await nhapCu({ ncc: nccMy, ngayNhap: await ngay(-5),
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 9.5, don_gia_kg: GIA.my_than, ...th }] });
  // Hàng ở quầy để NV quầy báo hủy.
  await nhapCu({ ncc: nccMy, ngayNhap: await ngay(-2), vt: viTri.quay,
    dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 6, so_kg: 3, don_gia_kg: 700000,
             han_dung: await ngay(3), ...th }] });

  // Công nợ đã có khoản trả — để lúc quét có đủ loại cột tiền có dữ liệu.
  const tt = await duoi(UID.keToanA, `
    select * from kho_ghi_thanh_toan(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_nha_cung_cap_id => $3, p_loai => 'thanh_toan',
      p_hinh_thuc => 'chuyen_khoan', p_so_tien => 1000000, p_ngay => $4::date, p_ghi_chu => null,
      p_anh => '{}'::text[], p_phan_bo => '[]'::jsonb)`, [cnA.id, maGui(), nccUc, homNay]);
  ok('Kế toán ghi được một khoản trả NCC Úc', tt.loi === null, tt.loi ?? '');
});

// ===========================================================================
await nhom('2 · QUYỀN MỚI: THỦ KHO MẤT xem_gia, KẾ TOÁN CÓ duyet_nhap', async () => {
  const q = async (uid, viec) => (await duoi(uid, `select kho_duoc($1, $2) as d`, [cnA.id, viec])).rows[0].d;
  ok('Thủ kho KHÔNG còn quyền xem giá', await q(UID.thuKhoA, 'xem_gia') === false);
  ok('Thủ kho vẫn nhận hàng, pha lóc được', await q(UID.thuKhoA, 'nhap') && await q(UID.thuKhoA, 'pha_loc'));
  ok('Thủ kho KHÔNG điền giá / duyệt phiếu nhập', await q(UID.thuKhoA, 'duyet_nhap') === false);
  ok('Kế toán điền giá, duyệt phiếu nhập được', await q(UID.keToanA, 'duyet_nhap') === true);
  ok('Kế toán KHÔNG có quyền duyệt hủy / kiểm kê', await q(UID.keToanA, 'duyet') === false);
  ok('Quản lý vẫn có cả hai', await q(UID.qlA, 'duyet') && await q(UID.qlA, 'duyet_nhap'));

  const dem = async (uid, bang) => (await duoi(uid, `select count(*)::int as n from ${bang}`)).rows?.[0]?.n;
  ok('Thủ kho không đọc được bảng phiếu nhập nữa', await dem(UID.thuKhoA, 'kho_phieu_nhap') === 0);
  ok('Thủ kho không đọc được nhà cung cấp', await dem(UID.thuKhoA, 'kho_nha_cung_cap') === 0);
  ok('Thủ kho không đọc được giá vốn lô', await dem(UID.thuKhoA, 'kho_lo_gia') === 0);
  ok('Thủ kho vẫn thấy tồn kho (kg)', await dem(UID.thuKhoA, 'kho_v_ton') > 0);
  ok('Kế toán đọc được phiếu nhập', await dem(UID.keToanA, 'kho_phieu_nhap') === 4);
});

// ===========================================================================
let P;   // phiếu nhận hàng chính của thủ kho
await nhom('3 · THỦ KHO NHẬN HÀNG: CHỌN NCC, CÂN, ĐẾM, CHỤP HÓA ĐƠN', async () => {
  const ds = await tk(`select * from kho_ds_ncc_nhap($1)`, [cnA.id]);
  ok('Thủ kho lấy được danh sách nhà cung cấp', ds.loi === null && ds.rows.length === 3, ds.loi ?? '');
  ok('NCC giao gần nhất đứng đầu, NCC chưa giao lần nào đứng cuối',
     ds.rows?.[0]?.id === nccMy && ds.rows?.[1]?.id === nccUc && ds.rows?.[2]?.id === nccMoi && ds.rows[2].lan_cuoi === null,
     JSON.stringify(ds.rows));
  ok('Danh sách NCC chỉ có id, tên, lần cuối', ds.rows?.every(r => Object.keys(r).sort().join() === 'id,lan_cuoi,ten'));
  const nvNcc = await duoi(UID.nvQuayA, `select * from kho_ds_ncc_nhap($1)`, [cnA.id]);
  ok('NV quầy KHÔNG lấy được danh sách NCC', nvNcc.loi !== null);
  const tkB = await duoi(UID.thuKhoB, `select * from kho_ds_ncc_nhap($1)`, [cnA.id]);
  ok('Thủ kho chi nhánh khác KHÔNG lấy được', tkB.loi !== null);

  const dong = [
    { mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 2, so_kg: 12.5, so_lo_ncc: 'AU-1', truong_them: { nhiet_do: 1.5 } },
    { mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 8, truong_them: { nhiet_do: 2 } },
  ];

  const coGia = await luuKg(UID.thuKhoA, { ncc: nccUc, dong: [{ ...dong[0], don_gia_kg: 1 }] });
  ok('Dòng có ô đơn giá bị từ chối (thủ kho không điền giá)',
     coGia.loi !== null && /không điền đơn giá/.test(coGia.loi), coGia.loi ?? '');

  const gui = maGui();
  const tao = await luuKg(UID.thuKhoA, { ncc: nccUc, dong, maGui: gui });
  ok('Thủ kho lưu phiếu chỉ kg', tao.loi === null && tao.rows[0].da_co === false, tao.loi ?? '');
  P = tao.rows?.[0];
  const lai = await luuKg(UID.thuKhoA, { ncc: nccUc, dong, maGui: gui });
  ok('Bấm lưu hai lần (cùng ma_gui) → một phiếu', lai.rows?.[0]?.phieu_id === P.phieu_id && lai.rows[0].da_co === true);

  const kt = await luuKg(UID.keToanA, { ncc: nccUc, dong });
  ok('Kế toán KHÔNG lập phiếu nhận hàng', kt.loi !== null);

  const { rows: [goc] } = await db.query(`select * from kho_phieu_nhap where id = $1`, [P.phieu_id]);
  ok('Phiếu mới: không tiền thuế, chi phí; mọi dòng đơn giá 0',
     Number(goc.tien_thue) === 0 && Number(goc.chi_phi_khac) === 0
       && (await db.query(`select count(*)::int as n from kho_phieu_nhap_dong where phieu_nhap_id = $1 and don_gia_kg <> 0`, [P.phieu_id])).rows[0].n === 0);

  const guiThieu = await tk(`select kho_gui_duyet_phieu_nhap($1, $2) as cau`, [P.phieu_id, P.phien_ban_moi]);
  ok('Gửi khi chưa chụp hóa đơn bị chặn',
     guiThieu.loi !== null && /Chưa chụp hóa đơn/.test(guiThieu.loi), guiThieu.loi ?? '');

  const a1 = anh(cnA.id), a2 = anh(cnA.id);
  const s1 = await luuKg(UID.thuKhoA, { id: P.phieu_id, phienBan: P.phien_ban_moi, ncc: nccUc, dong, anh: [a1] });
  ok('Thêm ảnh hóa đơn', s1.loi === null, s1.loi ?? '');
  const s2 = await luuKg(UID.thuKhoA, { id: P.phieu_id, phienBan: s1.rows?.[0]?.phien_ban_moi, ncc: nccUc, dong, anh: [a1, a2] });
  P = s2.rows?.[0];
  const { rows: [sauAnh] } = await db.query(`select anh from kho_phieu_nhap where id = $1`, [P.phieu_id]);
  ok('Ảnh được CỘNG thêm, bỏ trùng: 2 ảnh', sauAnh.anh.length === 2 && sauAnh.anh[0] === a1 && sauAnh.anh[1] === a2,
     JSON.stringify(sauAnh.anh));
  const s3 = await luuKg(UID.thuKhoA, { id: P.phieu_id, phienBan: P.phien_ban_moi, ncc: nccUc, dong, anh: [] });
  P = s3.rows?.[0];
  const { rows: [vanAnh] } = await db.query(`select cardinality(anh) as n from kho_phieu_nhap where id = $1`, [P.phieu_id]);
  ok('Lưu không kèm ảnh: ảnh cũ vẫn nguyên (thủ kho không xóa được ảnh)', vanAnh.n === 2);

  const anhB = await luuKg(UID.thuKhoA, { id: P.phieu_id, phienBan: P.phien_ban_moi, ncc: nccUc, dong, anh: [anh(cnB.id)] });
  ok('Ảnh của chi nhánh khác bị từ chối', anhB.loi !== null && /không thuộc chi nhánh/.test(anhB.loi));
  const tiem = await luuKg(UID.thuKhoA, { ncc: nccUc, dong, viTri: viTriB });
  ok('Không nhận hàng vào kho chi nhánh khác được', tiem.loi !== null);

  const doc = await docKg(UID.thuKhoA, P.phieu_id);
  const p = doc.rows?.[0]?.p;
  ok('Thủ kho đọc lại phiếu: 2 dòng, 2 ảnh, đúng NCC, đúng phiên bản',
     doc.loi === null && p.dong.length === 2 && p.so_anh === 2 && p.ten_nha_cung_cap === 'NCC Úc' && p.phien_ban === P.phien_ban_moi,
     doc.loi ?? JSON.stringify(p));
  ok('Phiếu đọc được KHÔNG có đường dẫn ảnh', !('anh' in (p ?? {})) && !JSON.stringify(p).includes('/nhap/'));
  ok('Dòng có tên món, đơn vị gói, số kg', p?.dong?.[0]?.ten_mat_hang === 'Thăn ngoại nguyên tảng'
     && p.dong[0].don_vi_goi === 'tảng' && Number(p.dong[0].so_kg) === 12.5);
  ok('NV quầy KHÔNG đọc được phiếu nhận hàng', (await docKg(UID.nvQuayA, P.phieu_id)).loi !== null);
  ok('Thủ kho chi nhánh khác KHÔNG đọc được', (await docKg(UID.thuKhoB, P.phieu_id)).loi !== null);

  const g = await tk(`select kho_gui_duyet_phieu_nhap($1, $2) as cau`, [P.phieu_id, P.phien_ban_moi]);
  ok('Có ảnh, đủ ô bắt buộc → gửi được', g.loi === null && /chờ duyệt/.test(g.rows?.[0]?.cau), g.loi ?? '');
});

// ===========================================================================
await nhom('4 · KẾ TOÁN ĐIỀN GIÁ, SO GIÁ, DUYỆT', async () => {
  const tkDuyet = await tk(`select kho_duyet_phieu_nhap($1) as cau`, [P.phieu_id]);
  ok('Thủ kho KHÔNG duyệt được', tkDuyet.loi !== null);

  const thieu = await duoi(UID.keToanA, `select kho_duyet_phieu_nhap($1) as cau`, [P.phieu_id]);
  ok('Duyệt khi chưa có đơn giá bị chặn, nêu dòng và tên món',
     thieu.loi !== null && /Dòng 1 \(Thăn ngoại nguyên tảng\): chưa có đơn giá/.test(thieu.loi), thieu.loi ?? '');

  const { rows: dongs } = await db.query(
    `select id, mat_hang_id from kho_phieu_nhap_dong where phieu_nhap_id = $1 order by thu_tu`, [P.phieu_id]);
  const pb = await phienBan(P.phieu_id);
  const gia = [{ dong_id: dongs[0].id, don_gia_kg: GIA.moi_than }, { dong_id: dongs[1].id, don_gia_kg: GIA.moi_nac }];

  const tkGia = await dienGia(UID.thuKhoA, { id: P.phieu_id, phienBan: pb, gia });
  ok('Thủ kho KHÔNG điền giá được', tkGia.loi !== null);
  const nvGia = await dienGia(UID.nvQuayA, { id: P.phieu_id, phienBan: pb, gia });
  ok('NV quầy KHÔNG điền giá được', nvGia.loi !== null);
  const cu = await dienGia(UID.keToanA, { id: P.phieu_id, phienBan: pb - 1, gia });
  ok('Điền giá với phiên bản cũ bị từ chối', cu.loi !== null && /máy khác/.test(cu.loi));
  const { rows: [dongLa] } = await db.query(`select id from kho_phieu_nhap_dong where phieu_nhap_id <> $1 limit 1`, [P.phieu_id]);
  const la = await dienGia(UID.keToanA, { id: P.phieu_id, phienBan: pb, gia: [{ dong_id: dongLa.id, don_gia_kg: 1 }] });
  ok('Dòng của phiếu khác bị từ chối', la.loi !== null && /không thuộc phiếu/.test(la.loi));
  const am = await dienGia(UID.keToanA, { id: P.phieu_id, phienBan: pb, gia: [{ dong_id: dongs[0].id, don_gia_kg: -5 }] });
  ok('Đơn giá âm bị từ chối', am.loi !== null);

  const dg = await dienGia(UID.keToanA, { id: P.phieu_id, phienBan: pb, gia, soHoaDon: 'HD-9', thue: 100000, chiPhi: 50000 });
  ok('Kế toán điền giá được, phiên bản tăng', dg.loi === null && dg.rows[0].pb === pb + 1, dg.loi ?? '');
  const { rows: [sau] } = await db.query(`select * from kho_phieu_nhap where id = $1`, [P.phieu_id]);
  ok('Điền giá KHÔNG đổi trạng thái (vẫn chờ duyệt)', sau.trang_thai === 'cho_duyet');
  ok('Thuế, chi phí, số hóa đơn đã ghi', Number(sau.tien_thue) === 100000 && Number(sau.chi_phi_khac) === 50000 && sau.so_hoa_don === 'HD-9');

  const ss = await duoi(UID.keToanA, `select * from kho_so_sanh_gia_nhap($1)`, [P.phieu_id]);
  const [sThan, sNac] = ss.rows ?? [];
  ok('So giá: thăn ngoại so với lần trước CÙNG NCC gần nhất (500.000, không phải 450.000 hay giá NCC Mỹ)',
     ss.loi === null && Number(sThan?.gia_truoc) === GIA.cu_than, ss.loi ?? JSON.stringify(sThan));
  ok('Thăn ngoại +8,0% → vượt ngưỡng 5%', Number(sThan?.chenh_pt) === 8 && sThan.vuot_nguong === true, JSON.stringify(sThan));
  ok('Nạc vai +3,0% → không vượt', Number(sNac?.chenh_pt) === 3 && sNac.vuot_nguong === false, JSON.stringify(sNac));
  ok('Có số phiếu và ngày của lần trước', /^PN-/.test(sThan?.so_phieu_truoc ?? '') && sThan.ngay_truoc !== null);

  const tkSs = await tk(`select * from kho_so_sanh_gia_nhap($1)`, [P.phieu_id]);
  ok('Thủ kho gọi so giá: 0 dòng (RLS chặn)', tkSs.loi === null && tkSs.rows.length === 0, tkSs.loi ?? '');

  // Ngưỡng do quản lý chỉnh: nâng lên 10% thì +8% hết đỏ.
  await duoi(UID.qlA, `select kho_luu_nguong($1, '{"nguong_gia_mua_pt": 10}'::jsonb)`, [cnA.id]);
  const ss10 = await duoi(UID.keToanA, `select * from kho_so_sanh_gia_nhap($1)`, [P.phieu_id]);
  ok('Ngưỡng 10%: +8% không còn vượt', ss10.rows?.[0]?.vuot_nguong === false);
  await duoi(UID.qlA, `select kho_luu_nguong($1, '{"nguong_gia_mua_pt": 5}'::jsonb)`, [cnA.id]);

  // Thủ kho rút về, sửa kg — giá kế toán đã điền KHÔNG mất.
  const rut = await tk(`select kho_rut_phieu_nhap($1) as cau`, [P.phieu_id]);
  ok('Thủ kho rút phiếu về sửa', rut.loi === null, rut.loi ?? '');
  const p = (await docKg(UID.thuKhoA, P.phieu_id)).rows[0].p;
  const suaDong = p.dong.map(d => ({ mat_hang_id: d.mat_hang_id, so_goi: d.so_goi, so_kg: Number(d.so_kg),
    so_lo_ncc: d.so_lo_ncc, han_dung: d.han_dung, truong_them: d.truong_them }));
  suaDong[0].so_kg = 12.4;
  const sua = await luuKg(UID.thuKhoA, { id: P.phieu_id, phienBan: p.phien_ban, ncc: nccUc, dong: suaDong,
                                        soHoaDon: p.so_hoa_don });
  ok('Thủ kho sửa kg sau khi đã có giá', sua.loi === null, sua.loi ?? '');
  P = sua.rows?.[0] ?? P;
  const { rows: giaSau } = await db.query(
    `select so_kg, don_gia_kg from kho_phieu_nhap_dong where phieu_nhap_id = $1 order by thu_tu`, [P.phieu_id]);
  ok('Sửa kg xong, đơn giá vẫn nguyên theo từng món',
     Number(giaSau[0].so_kg) === 12.4 && Number(giaSau[0].don_gia_kg) === GIA.moi_than && Number(giaSau[1].don_gia_kg) === GIA.moi_nac,
     JSON.stringify(giaSau));
  const { rows: [pSau] } = await db.query(`select * from kho_phieu_nhap where id = $1`, [P.phieu_id]);
  ok('Thuế, chi phí, ảnh vẫn nguyên', Number(pSau.tien_thue) === 100000 && Number(pSau.chi_phi_khac) === 50000
     && pSau.anh.length === 2 && pSau.so_hoa_don === 'HD-9');

  const g = await tk(`select kho_gui_duyet_phieu_nhap($1, $2) as cau`, [P.phieu_id, P.phien_ban_moi]);
  ok('Gửi lại', g.loi === null, g.loi ?? '');
  const d = await duoi(UID.keToanA, `select kho_duyet_phieu_nhap($1) as cau`, [P.phieu_id]);
  ok('KẾ TOÁN duyệt được phiếu nhập', d.loi === null && /2 lô hàng đã vào kho/.test(d.rows?.[0]?.cau), d.loi ?? '');
  ok('Câu trả về khi duyệt không có số tiền', !coTien(d.rows?.[0]?.cau));
  const { rows: lo } = await db.query(`
    select g.gia_tri from kho_lo l join kho_lo_gia g on g.lo_id = l.id
    join kho_phieu_nhap_dong dd on dd.id = l.phieu_nhap_dong_id where dd.phieu_nhap_id = $1`, [P.phieu_id]);
  const tong = lo.reduce((s, x) => s + Number(x.gia_tri), 0);
  ok('Giá vốn lô = tiền hàng + chi phí (thuế không vào theo mặc định), không lô nào 0 đồng',
     lo.length === 2 && lo.every(x => Number(x.gia_tri) > 0)
       && tong === Math.round(12.4 * GIA.moi_than) + Math.round(8 * GIA.moi_nac) + 50000, `${tong}`);

  const dg2 = await dienGia(UID.keToanA, { id: P.phieu_id, phienBan: await phienBan(P.phieu_id), gia });
  ok('Phiếu đã duyệt KHÔNG điền giá lại được', dg2.loi !== null && /không điền giá được nữa/.test(dg2.loi));
  const huyKt = await duoi(UID.keToanA, `select kho_huy_phieu_nhap($1, 'thử') as cau`, [P.phieu_id]);
  ok('Kế toán KHÔNG hủy được phiếu đã duyệt (việc của quản lý)', huyKt.loi !== null);

  // Từ chối: kế toán làm được.
  const p2 = (await luuKg(UID.thuKhoA, { ncc: nccUc, anh: [anh(cnA.id)],
    dong: [{ mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 7, truong_them: { nhiet_do: 2 } }] })).rows[0];
  await tk(`select kho_gui_duyet_phieu_nhap($1, $2)`, [p2.phieu_id, p2.phien_ban_moi]);
  const tc = await duoi(UID.keToanA, `select kho_tu_choi_phieu_nhap($1, 'Ảnh hóa đơn mờ, chụp lại') as cau`, [p2.phieu_id]);
  ok('Kế toán từ chối được phiếu nhập', tc.loi === null, tc.loi ?? '');
  const tkTc = await tk(`select kho_tu_choi_phieu_nhap($1, 'x') as cau`, [p2.phieu_id]);
  ok('Thủ kho KHÔNG từ chối được', tkTc.loi !== null);
  await doiSoat('Sau luồng nhận hàng mới');
});

// ===========================================================================
await nhom('5 · TỒN ĐẦU KỲ: KHÔNG CẦN ẢNH, KHÔNG KIỂM Ô BẮT BUỘC', async () => {
  const td = await luuKg(UID.thuKhoA, { loai: 'ton_dau', viTri: viTri.quay,
    dong: [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 4, so_kg: 2, han_dung: await ngay(2) }] });
  ok('Thủ kho lập phiếu tồn đầu kỳ (không NCC, không ảnh, không nhiệt độ)', td.loi === null, td.loi ?? '');
  const coNcc = await luuKg(UID.thuKhoA, { loai: 'ton_dau', ncc: nccUc, viTri: viTri.quay,
    dong: [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 1, so_kg: 1 }] });
  ok('Tồn đầu kỳ không nhận nhà cung cấp', coNcc.loi !== null && /tồn đầu kỳ/.test(coNcc.loi));
  const g = await tk(`select kho_gui_duyet_phieu_nhap($1, $2) as cau`, [td.rows[0].phieu_id, td.rows[0].phien_ban_moi]);
  ok('Gửi được: tồn đầu kỳ bỏ kiểm ô bắt buộc và ảnh', g.loi === null, g.loi ?? '');

  const pb = await phienBan(td.rows[0].phieu_id);
  const { rows: [dong] } = await db.query(`select id from kho_phieu_nhap_dong where phieu_nhap_id = $1`, [td.rows[0].phieu_id]);
  const thue = await dienGia(UID.keToanA, { id: td.rows[0].phieu_id, phienBan: pb, thue: 1000,
                                            gia: [{ dong_id: dong.id, don_gia_kg: GIA.ton_dau }] });
  ok('Tồn đầu kỳ không nhận tiền thuế', thue.loi !== null && /tồn đầu kỳ/.test(thue.loi));
  const dg = await dienGia(UID.keToanA, { id: td.rows[0].phieu_id, phienBan: pb, gia: [{ dong_id: dong.id, don_gia_kg: GIA.ton_dau }] });
  const d = await duoi(UID.keToanA, `select kho_duyet_phieu_nhap($1) as cau`, [td.rows[0].phieu_id]);
  ok('Kế toán điền giá và duyệt tồn đầu kỳ', dg.loi === null && d.loi === null, dg.loi ?? d.loi ?? '');
  await doiSoat('Sau tồn đầu kỳ');
});

// ===========================================================================
await nhom('6 · KẾ TOÁN KHÔNG DUYỆT ĐƯỢC BÁO HỦY, KIỂM KÊ', async () => {
  const h = await duoi(UID.nvQuayA, `
    select * from kho_tao_phieu_xuat($1, $2, 'huy', $3, null, $4, null, $5::text[], $6::jsonb)`,
    [cnA.id, maGui(), viTri.quay, lyDoHuy, [`${cnA.id}/huy/${maGui()}/1.jpg`],
     JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }])]);
  ok('NV quầy báo hủy 1 gói', h.loi === null, h.loi ?? '');
  const ktHuy = await duoi(UID.keToanA, `select kho_duyet_phieu_huy($1)`, [h.rows?.[0]?.phieu_id]);
  ok('Kế toán KHÔNG duyệt được báo hủy', ktHuy.loi !== null);
  const qlHuy = await duoi(UID.qlA, `select kho_duyet_phieu_huy($1)`, [h.rows?.[0]?.phieu_id]);
  ok('Quản lý duyệt được báo hủy', qlHuy.loi === null, qlHuy.loi ?? '');

  const kk = (await tk(`select kho_bat_dau_kiem_ke($1, $2, 'theo_lo', $3) as id`, [cnA.id, viTri.kho, maGui()])).rows[0].id;
  const { rows: dong } = await db.query(`
    select d.lo_id, d.mat_hang_id, t.so_kg, t.so_goi from kho_kiem_ke_dong d
    left join kho_ton t on t.lo_id = d.lo_id and t.vi_tri_id = $2 where d.kiem_ke_id = $1`, [kk, viTri.kho]);
  const dem = dong.map(x => ({ mat_hang_id: x.mat_hang_id, lo_id: x.lo_id, so_goi_dem: x.so_goi, so_kg_dem: Number(x.so_kg) }));
  const pb = async () => (await db.query(`select phien_ban from kho_kiem_ke where id = $1`, [kk])).rows[0].phien_ban;
  const l = await tk(`select kho_luu_kiem_ke($1, $2, null, $3::jsonb)`, [kk, await pb(), JSON.stringify(dem)]);
  const g = await tk(`select kho_gui_kiem_ke($1, $2) as cau`, [kk, await pb()]);
  ok('Thủ kho đếm và gửi kiểm kê kho', l.loi === null && g.loi === null, l.loi ?? g.loi ?? '');
  const ktKk = await duoi(UID.keToanA, `select kho_duyet_kiem_ke($1)`, [kk]);
  ok('Kế toán KHÔNG duyệt được kiểm kê', ktKk.loi !== null);
  const qlKk = await duoi(UID.qlA, `select kho_duyet_kiem_ke($1)`, [kk]);
  ok('Quản lý duyệt được kiểm kê', qlKk.loi === null, qlKk.loi ?? '');

  const v = (await duoi(UID.keToanA, `select kho_dem_viec($1) as v`, [cnA.id])).rows[0].v;
  ok('Số đỏ của kế toán: có duyet_nhap, KHÔNG có duyet_huy / duyet_kiem_ke',
     'duyet_nhap' in v && !('duyet_huy' in v) && !('duyet_kiem_ke' in v), JSON.stringify(v));
  await doiSoat('Sau hủy và kiểm kê');
});

// ===========================================================================
let phienId;
await nhom('7 · THỦ KHO PHA LÓC: THẤY KG VÀ %, KHÔNG THẤY TIỀN', async () => {
  const { rows: [lo] } = await db.query(`
    select t.lo_id from kho_ton t join kho_lo l on l.id = t.lo_id
    where t.vi_tri_id = $1 and l.mat_hang_id = $2 and t.so_kg > 0 order by l.created_at desc limit 1`,
    [viTri.kho, MH['T-THANNGOAI'].id]);
  const ph = await tk(`
    select * from kho_luu_phien_pha(null, $1, $2, null, $3, null, $4::date, null, $5::jsonb, $6::jsonb)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay,
     JSON.stringify([{ lo_id: lo.lo_id, vi_tri_id: viTri.kho, so_kg: 5 }]),
     JSON.stringify([
       { mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 3.5, so_goi: 7, xu_ly: 'nhap_kho', vi_tri_id: viTri.quay },
       { mat_hang_id: MH['P-VUN'].id, so_kg: 0.5, xu_ly: 'chuyen_bep' },
       { mat_hang_id: MH['P-MO'].id, so_kg: 0.75, xu_ly: 'bo' },
     ])]);
  ok('Thủ kho lưu phiên pha lóc', ph.loi === null, ph.loi ?? '');
  phienId = ph.rows?.[0]?.phien_id;

  const tien = await tk(`select kho_xem_thu_phien_pha($1) as t`, [phienId]);
  ok('Thủ kho KHÔNG xem được bản xem thử có tiền', tien.loi !== null);
  const kg = await tk(`select kho_xem_thu_phien_pha_kg($1) as t`, [phienId]);
  const t = kg.rows?.[0]?.t;
  ok('Bản chỉ kg: vào 5, thịt 3,5 (70%), phụ phẩm 0,5, bỏ 0,75, hao hụt 0,25',
     kg.loi === null && Number(t.tong_kg_vao) === 5 && Number(t.kg_thit) === 3.5 && Number(t.ty_le_thu_hoi) === 70
       && Number(t.kg_phu_pham) === 0.5 && Number(t.kg_bo) === 0.75 && Number(t.kg_hao_hut) === 0.25,
     kg.loi ?? JSON.stringify(t));
  ok('Từng phần ra có nhóm và tỉ lệ', t?.dong?.map(d => d.nhom).join() === 'thit,phu_pham,bo' && Number(t.dong[0].ty_le) === 70);
  ok('Không có cảnh báo khi số cân hợp lý', t?.canh_bao?.length === 0, JSON.stringify(t?.canh_bao));
  ok('Quản lý cũng xem được bản chỉ kg', (await duoi(UID.qlA, `select kho_xem_thu_phien_pha_kg($1)`, [phienId])).loi === null);
  ok('NV quầy KHÔNG xem được', (await duoi(UID.nvQuayA, `select kho_xem_thu_phien_pha_kg($1)`, [phienId])).loi !== null);
  ok('Thủ kho chi nhánh khác KHÔNG xem được', (await duoi(UID.thuKhoB, `select kho_xem_thu_phien_pha_kg($1)`, [phienId])).loi !== null);

  const c = await tk(`select kho_chot_phien_pha($1, 1) as cau`, [phienId]);
  ok('Thủ kho chốt phiên', c.loi === null && /70,00%/.test(c.rows?.[0]?.cau), c.loi ?? c.rows?.[0]?.cau);
  const ds = await tk(`select * from kho_v_phien_pha where id = $1`, [phienId]);
  ok('Thủ kho đọc được danh sách phiên (kg)', ds.rows?.length === 1 && Number(ds.rows[0].ty_le_thu_hoi) === 70);
  const ra = await tk(`select count(*)::int as n from kho_phien_pha_ra where phien_pha_id = $1`, [phienId]);
  ok('Thủ kho đọc được các phần ra', ra.rows?.[0]?.n === 3);
  ok('NV quầy vẫn KHÔNG thấy phiên pha lóc',
     (await duoi(UID.nvQuayA, `select count(*)::int as n from kho_phien_pha`)).rows[0].n === 0);
  await doiSoat('Sau pha lóc');
});

// ===========================================================================
// 0032 (GĐ5b): chạy trọn luồng quầy để các bảng mới có dữ liệu cho nhóm 8 quét
// cột tiền, và để soát kết quả các hàm mới thủ kho / NV quầy gọi.
let yeuCauId, kiemKeQuay;
const ketQuaQuay = [];
await nhom('7b · QUẦY (0032): YÊU CẦU, MANG RA, NHẬN THIẾU, ĐẾM QUÉT, XUẤT KHÁC — KHÔNG TIỀN', async () => {
  const ghi = r => { if (r.rows) ketQuaQuay.push(r.rows); return r; };
  const nvq = (sql, p) => duoi(UID.nvQuayA, sql, p).then(ghi);
  const tkq = (sql, p) => tk(sql, p).then(ghi);
  await duoi(UID.qlA, `select kho_luu_nguong($1, '{"chuyen_quay_can_nhan": true}'::jsonb)`, [cnA.id]);
  await db.query(`update kho_mat_hang set ma_can = '301', quay_toi_thieu_goi = 50 where ma = 'C-THANNGOAI'`);
  await db.query(`update kho_mat_hang set quay_toi_thieu_goi = 1 where ma = 'T-NACVAI'`);

  const g = await nvq(`select * from kho_goi_y_ra_quay(p_chi_nhanh_id => $1, p_vi_tri_id => null)`, [cnA.id]);
  ok('NV quầy xem gợi ý mang ra quầy', g.loi === null && g.rows.length >= 1, g.loi ?? '');
  const y = await nvq(`select * from kho_tao_yeu_cau(p_chi_nhanh_id => $1, p_ma_gui => $2, p_vi_tri_id => null,
    p_nguon => 'tay', p_ghi_chu => null, p_dong => $3::jsonb)`,
    [cnA.id, maGui(), JSON.stringify([{ mat_hang_id: MH['T-NACVAI'].id, so_goi: 2 }])]);
  ok('NV quầy gửi yêu cầu 2 tảng nạc vai', y.loi === null, y.loi ?? '');
  yeuCauId = y.rows?.[0]?.yeu_cau_id;
  const c = await tkq(`select * from kho_chuyen_theo_yeu_cau(p_id => $1, p_ma_gui => $2, p_vi_tri_id => null, p_dong => null)`,
    [yeuCauId, maGui()]);
  ok('Thủ kho mang ra theo yêu cầu', c.loi === null, c.loi ?? '');
  const pid = c.rows?.[0]?.phieu_id;
  const n = await nvq(`select kho_nhan_hang_chuyen(p_id => $1, p_ma_gui => $2, p_dong => $3::jsonb) as cau`,
    [pid, maGui(), JSON.stringify([{ mat_hang_id: MH['T-NACVAI'].id, so_goi: 1 }])]);
  ok('NV quầy nhận thiếu 1 tảng', n.loi === null && /Thiếu 1 gói/.test(n.rows?.[0]?.cau), n.loi ?? n.rows?.[0]?.cau);
  const tkXl = await tk(`select kho_xu_ly_chuyen_thieu(p_id => $1, p_cach => 'mat', p_ly_do => 'Rơi') as cau`, [pid]);
  ok('Thủ kho KHÔNG xử lý hàng thiếu', tkXl.loi !== null);
  const xl = await duoi(UID.qlA, `select kho_xu_ly_chuyen_thieu(p_id => $1, p_cach => 'mat', p_ly_do => 'Rơi') as cau`, [pid]);
  ok('Quản lý ghi mất', xl.loi === null, xl.loi ?? '');

  const xk = (await db.query(`select id from kho_ly_do where loai = 'xuat_khac' order by thu_tu limit 1`)).rows[0].id;
  const x = await tkq(`select * from kho_tao_phieu_xuat($1, $2, 'xuat_khac', $3, null, $4, null, '{}'::text[], $5::jsonb)`,
    [cnA.id, maGui(), viTri.quay, xk, JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }])]);
  ok('Thủ kho xuất khác 1 gói', x.loi === null, x.loi ?? '');

  kiemKeQuay = (await nvq(`select kho_bat_dau_kiem_ke($1, $2, 'theo_mat_hang', $3) as id`, [cnA.id, viTri.quay, maGui()])).rows[0].id;
  const q = await nvq(`select kho_quet_kiem_ke(p_id => $1, p_ma_gui => $2, p_ma => $3::jsonb) as kq`,
    [kiemKeQuay, maGui(), JSON.stringify(['2000301005009', '2000301004804'])]);
  ok('NV quầy quét 2 nhãn khi đếm quầy', q.loi === null && q.rows[0].kq.so_nhan === 2, q.loi ?? JSON.stringify(q.rows?.[0]?.kq));
  const b = await tkq(`select kho_bo_quet_kiem_ke(p_id => $1, p_ma_gui => $2, p_cach => 'bot_mot', p_mat_hang_id => $3) as kq`,
    [kiemKeQuay, maGui(), MH['C-THANNGOAI'].id]);
  ok('Thủ kho bấm −1', b.loi === null, b.loi ?? '');
  const pb = (await db.query(`select phien_ban from kho_kiem_ke where id = $1`, [kiemKeQuay])).rows[0].phien_ban;
  const h = await nvq(`select kho_het_hang_con_lai(p_id => $1, p_phien_ban => $2) as kq`, [kiemKeQuay, pb]);
  ok('NV quầy bấm "đã bán hết" phần còn lại', h.loi === null, h.loi ?? '');

  const tim = ketQuaQuay.flatMap(r => khoaTien(r));
  ok(`${ketQuaQuay.length} kết quả hàm quầy: không khóa tiền nào`, ketQuaQuay.length >= 7 && tim.length === 0, tim.join(', '));
  ok('Không đơn giá nào lọt ra dưới dạng giá trị', !coTien(JSON.stringify(ketQuaQuay)));
  const k = await duoi(UID.thuKhoA, `select * from kho_bao_cao_xnt_v2($1, $2::date, $2::date)`, [cnA.id, homNay]);
  ok('Thủ kho gọi XNT mới: mọi cột giá trị = 0',
     k.loi === null && k.rows.length > 0 && k.rows.every(r => Object.entries(r).every(([c, v]) => !c.endsWith('_gia_tri') || Number(v) === 0)),
     k.loi ?? '');
  await doiSoat('Sau luồng quầy');
});

// ===========================================================================
await nhom('8 · QUÉT MỌI BẢNG / VIEW kho_%: CỘT TIỀN', async () => {
  const { rows: cot } = await db.query(`
    select c.table_name, c.column_name
    from information_schema.columns c
    where c.table_schema = 'public' and c.table_name like 'kho\\_%'
    order by 1, 2`);
  const tien = cot.filter(c => LA_TIEN.test(c.column_name) && !KHONG_PHAI_TIEN.has(`${c.table_name}.${c.column_name}`));
  ok(`Có đủ cột tiền để soát (${tien.length})`, tien.length >= 25);

  for (const [ten, uid] of [['Thủ kho', UID.thuKhoA], ['NV quầy', UID.nvQuayA]]) {
    const lo = [];
    for (const { table_name, column_name } of tien) {
      const r = await duoi(uid, `select count(*)::int as n from ${table_name} where ${column_name} is not null`);
      if (r.loi === null && r.rows[0].n > 0) lo.push(`${table_name}.${column_name}(${r.rows[0].n})`);
    }
    ok(`${ten} không đọc được giá trị nào ở cột tiền`, lo.length === 0, lo.join(', '));
  }

  // Đối chứng: kế toán thấy — nếu không, phép quét trên chẳng chứng minh gì.
  const kt = await duoi(UID.keToanA, `select count(*)::int as n from kho_phieu_nhap_dong where don_gia_kg > 0`);
  ok('Đối chứng: kế toán đọc được đơn giá', kt.rows?.[0]?.n > 0);
});

// ===========================================================================
await nhom('9 · QUÉT ĐỆ QUY KẾT QUẢ MỌI HÀM THỦ KHO GỌI', async () => {
  const { rows: ids } = await db.query(`select id from kho_phieu_nhap where chi_nhanh_id = $1`, [cnA.id]);
  const goi = [
    ['kho_ds_ncc_nhap', `select * from kho_ds_ncc_nhap($1)`, [cnA.id]],
    ['kho_ds_phieu_nhap_kg', `select * from kho_ds_phieu_nhap_kg($1, null, null, null, null, false, 200, 0)`, [cnA.id]],
    ...ids.map(r => ['kho_doc_phieu_nhap_kg', `select kho_doc_phieu_nhap_kg($1) as p`, [r.id]]),
    ['kho_xem_thu_phien_pha_kg', `select kho_xem_thu_phien_pha_kg($1) as t`, [phienId]],
    ['kho_dem_viec', `select kho_dem_viec($1) as v`, [cnA.id], true],
    ['kho_thong_bao', `select kho_thong_bao($1, 300) as v`, [cnA.id], true],
    // 0032 — NV quầy cũng gọi được (đánh dấu true)
    ['kho_goi_y_ra_quay', `select * from kho_goi_y_ra_quay($1, null)`, [cnA.id], true],
    ['kho_v_yeu_cau_quay', `select * from kho_v_yeu_cau_quay`, [], true],
    ['kho_yeu_cau_quay_dong', `select * from kho_yeu_cau_quay_dong`, [], true],
    ['kho_v_phieu_xuat', `select * from kho_v_phieu_xuat`, [], true],
    ['kho_v_kiem_ke', `select * from kho_v_kiem_ke`, [], true],
    ['kho_kiem_ke_quet', `select * from kho_kiem_ke_quet`, [], true],
  ];
  for (const [uid, ai] of [[UID.thuKhoA, 'thủ kho'], [UID.nvQuayA, 'NV quầy']]) {
    const tim = [];
    const lotSo = [];
    let chay = 0;
    for (const [ten, sql, p = []] of goi) {
      const r = await duoi(uid, sql, p);
      if (r.loi) continue;                 // NV quầy bị từ chối các hàm nhận hàng: đúng
      chay++;
      tim.push(...khoaTien(r.rows).map(k => `${ten}${k}`));
      if (coTien(JSON.stringify(r.rows))) lotSo.push(ten);
    }
    const mong = ai === 'thủ kho' ? goi.length : goi.filter(g => g[3]).length;
    ok(`${ai}: gọi được ${mong} hàm cần soát`, chay === mong, `${chay}`);
    ok(`${ai}: không khóa tiền nào trong kết quả`, tim.length === 0, [...new Set(tim)].slice(0, 10).join(', '));
    ok(`${ai}: không đơn giá nào lọt ra dưới dạng giá trị`, lotSo.length === 0, lotSo.join(', '));
  }

  const v = (await duoi(UID.thuKhoA, `select kho_dem_viec($1) as v`, [cnA.id])).rows[0].v;
  ok('Số đỏ của thủ kho KHÔNG có duyet_nhap', !('duyet_nhap' in v), JSON.stringify(v));

  // Lọc, tìm, chia trang của danh sách phiếu nhận hàng.
  const ds = (sql, p) => duoi(UID.thuKhoA, `select * from kho_ds_phieu_nhap_kg(${sql})`, p);
  const all = await ds(`$1, null, null, null, null, false, 200, 0`, [cnA.id]);
  ok('Danh sách: mọi phiếu của chi nhánh, mới nhất trước',
     all.loi === null && all.rows.length === ids.length && all.rows[0].ngay_nhap >= all.rows.at(-1).ngay_nhap, all.loi ?? '');
  const dd = await ds(`$1, 'da_duyet', null, null, null, false, 200, 0`, [cnA.id]);
  ok('Lọc đã duyệt', dd.rows?.every(r => r.trang_thai === 'da_duyet') && dd.rows.length >= 5);
  const hd = await ds(`$1, null, 'hd-9', null, null, false, 200, 0`, [cnA.id]);
  ok('Tìm theo số hóa đơn (không phân biệt hoa thường)', hd.rows?.length === 1 && hd.rows[0].so_anh === 2 && Number(hd.rows[0].tong_kg) === 20.4,
     JSON.stringify(hd.rows));
  const ncc = await ds(`$1, null, 'Mỹ', null, null, false, 200, 0`, [cnA.id]);
  ok('Tìm theo tên nhà cung cấp', ncc.rows?.length === 2);
  const phanTram = await ds(`$1, null, '%', null, null, false, 200, 0`, [cnA.id]);
  ok('Gõ "%" được hiểu là chữ, không phải "mọi thứ"', phanTram.loi === null && phanTram.rows.length === 0);
  const cuaToi = await ds(`$1, null, null, null, null, true, 200, 0`, [cnA.id]);
  ok('"Của tôi": chỉ phiếu thủ kho lập', cuaToi.rows?.length === 3);
  const ngayLoc = await ds(`$1, null, null, $2::date, $3::date, false, 200, 0`, [cnA.id, await ngay(-12), await ngay(-8)]);
  ok('Lọc theo ngày nhập', ngayLoc.rows?.length === 1);
  const trang = await ds(`$1, null, null, null, null, false, 2, 2`, [cnA.id]);
  ok('Chia trang: giới hạn và bỏ qua', trang.rows?.length === 2 && trang.rows[0].id === all.rows[2].id);
  const tran = await ds(`$1, null, null, null, null, false, 100000, -5`, [cnA.id]);
  ok('Giới hạn quá lớn / bỏ qua âm được kẹp lại, không lỗi', tran.loi === null && tran.rows.length === ids.length);
  const nv = await duoi(UID.nvQuayA, `select * from kho_ds_phieu_nhap_kg($1, null, null, null, null, false, 30, 0)`, [cnA.id]);
  ok('NV quầy KHÔNG lấy được danh sách phiếu nhận hàng', nv.loi !== null);
});

// ===========================================================================
// Đặt SAU nhóm 9 để không làm lệch các con số đếm phiếu ở đó; phiếu thử được
// hủy ở cuối nhóm.
await nhom('10 · HÀM CŨ kho_luu_phieu_nhap: THỦ KHO KHÔNG GHI ĐƯỢC TIỀN, KHÔNG XÓA ĐƯỢC ẢNH', async () => {
  /** Gọi hàm có giá (0020) — vai nào cũng gọi được vì chỉ cần quyền nhap. */
  const luuCu = (uid, t) => {
    const f = uid === UID.thuKhoA ? tk : (sql, p) => duoi(uid, sql, p);
    return f(`
      select * from kho_luu_phieu_nhap(
        p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
        p_loai => 'mua', p_nha_cung_cap_id => $5, p_vi_tri_id => $6, p_ngay_nhap => $7::date,
        p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => $8::date,
        p_tien_thue => $9, p_chi_phi_khac => $10, p_ghi_chu => null,
        p_anh => $11::text[], p_truong_them => '{}'::jsonb, p_dong => $12::jsonb)`,
      [t.id ?? null, cnA.id, t.maGui ?? maGui(), t.phienBan ?? null, nccUc, viTri.kho, homNay,
       t.hanTT ?? null, t.thue ?? 0, t.chiPhi ?? 0, t.anh ?? [], JSON.stringify(t.dong ?? [])]);
  };
  const KHONG_GIA = /không điền giá — dùng màn Nhận hàng/;
  const th = { truong_them: { nhiet_do: 2 } };
  const dongKg = kg => [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: kg, ...th },
                        { mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 5, ...th }];
  const soPhieu = async () => (await db.query(`select count(*)::int as n from kho_phieu_nhap`)).rows[0].n;
  const truoc = await soPhieu();

  // Phiếu mới: gửi tiền theo bất kỳ ngả nào đều bị chặn, không phiếu nào sinh ra.
  const coGia = await luuCu(UID.thuKhoA, { anh: [anh(cnA.id)],
    dong: [{ ...dongKg(10)[0], don_gia_kg: GIA.moi_than }] });
  ok('Thủ kho gọi hàm cũ kèm đơn giá → bị chặn', coGia.loi !== null && KHONG_GIA.test(coGia.loi), coGia.loi ?? '');
  const giaKhong = await luuCu(UID.thuKhoA, { anh: [anh(cnA.id)],
    dong: [{ ...dongKg(10)[0], don_gia_kg: 0 }] });
  ok('Đơn giá 0 cũng bị chặn (có khóa là có điền giá)', giaKhong.loi !== null && KHONG_GIA.test(giaKhong.loi), giaKhong.loi ?? '');
  const thue = await luuCu(UID.thuKhoA, { anh: [anh(cnA.id)], dong: dongKg(10), thue: 100000 });
  ok('Thủ kho gửi tiền thuế → bị chặn', thue.loi !== null && KHONG_GIA.test(thue.loi), thue.loi ?? '');
  const cp = await luuCu(UID.thuKhoA, { anh: [anh(cnA.id)], dong: dongKg(10), chiPhi: 50000 });
  ok('Thủ kho gửi chi phí khác → bị chặn', cp.loi !== null && KHONG_GIA.test(cp.loi), cp.loi ?? '');
  const han = await luuCu(UID.thuKhoA, { anh: [anh(cnA.id)], dong: dongKg(10), hanTT: await ngay(30) });
  ok('Thủ kho đặt hạn thanh toán → bị chặn', han.loi !== null && KHONG_GIA.test(han.loi), han.loi ?? '');
  ok('Các lần bị chặn không sinh phiếu nào', await soPhieu() === truoc);

  // Chỉ kg (không khóa don_gia_kg, hoặc don_gia_kg null) vẫn lưu được.
  const anh1 = anh(cnA.id);
  const kg = await luuCu(UID.thuKhoA, { anh: [anh1],
    dong: [dongKg(10)[0], { ...dongKg(10)[1], don_gia_kg: null }] });
  ok('Thủ kho vẫn lưu được phiếu chỉ kg qua hàm cũ', kg.loi === null && kg.rows[0].da_co === false, kg.loi ?? '');
  let P2 = kg.rows?.[0];

  // Kế toán điền giá, thuế, chi phí, hạn thanh toán lên nháp đó.
  const { rows: dongs } = await db.query(
    `select id from kho_phieu_nhap_dong where phieu_nhap_id = $1 order by thu_tu`, [P2.phieu_id]);
  const hanKt = await ngay(20);
  const dg = await dienGia(UID.keToanA, { id: P2.phieu_id, phienBan: P2.phien_ban_moi, thue: 100000, chiPhi: 50000,
    hanTT: hanKt, gia: [{ dong_id: dongs[0].id, don_gia_kg: GIA.moi_than }, { dong_id: dongs[1].id, don_gia_kg: GIA.moi_nac }] });
  ok('Kế toán điền giá lên nháp thủ kho lập', dg.loi === null, dg.loi ?? '');
  let pb = await phienBan(P2.phieu_id);

  const xoaAnh = await luuCu(UID.thuKhoA, { id: P2.phieu_id, phienBan: pb, anh: [], dong: dongKg(10) });
  ok('Thủ kho KHÔNG xóa được ảnh hóa đơn đã chụp (p_anh rỗng)',
     xoaAnh.loi !== null && /Không xóa được ảnh hóa đơn đã chụp/.test(xoaAnh.loi), xoaAnh.loi ?? '');
  const doiAnh = await luuCu(UID.thuKhoA, { id: P2.phieu_id, phienBan: pb, anh: [anh(cnA.id)], dong: dongKg(10) });
  ok('Thủ kho KHÔNG thay ảnh cũ bằng ảnh khác',
     doiAnh.loi !== null && /Không xóa được ảnh/.test(doiAnh.loi), doiAnh.loi ?? '');
  const suaGia = await luuCu(UID.thuKhoA, { id: P2.phieu_id, phienBan: pb, anh: [anh1],
    dong: [{ ...dongKg(10)[0], don_gia_kg: 1 }, dongKg(10)[1]] });
  ok('Thủ kho KHÔNG sửa được đơn giá đã điền', suaGia.loi !== null && KHONG_GIA.test(suaGia.loi), suaGia.loi ?? '');
  const suaHan = await luuCu(UID.thuKhoA, { id: P2.phieu_id, phienBan: pb, anh: [anh1], dong: dongKg(10),
                                            hanTT: await ngay(45) });
  ok('Thủ kho KHÔNG đổi được hạn thanh toán', suaHan.loi !== null && KHONG_GIA.test(suaHan.loi), suaHan.loi ?? '');

  // Sửa kg, thêm ảnh, gửi 0 / null cho ô tiền → được; tiền đang có giữ nguyên.
  const anh2 = anh(cnA.id);
  const sua = await luuCu(UID.thuKhoA, { id: P2.phieu_id, phienBan: pb, anh: [anh1, anh2], dong: dongKg(11.5),
                                         hanTT: hanKt });
  ok('Thủ kho sửa kg + thêm ảnh qua hàm cũ được', sua.loi === null, sua.loi ?? '');
  P2 = sua.rows?.[0] ?? P2;
  const { rows: giaSau } = await db.query(
    `select so_kg, don_gia_kg from kho_phieu_nhap_dong where phieu_nhap_id = $1 order by thu_tu`, [P2.phieu_id]);
  ok('Đơn giá kế toán điền đi theo mặt hàng sang dòng mới',
     Number(giaSau[0].so_kg) === 11.5 && Number(giaSau[0].don_gia_kg) === GIA.moi_than
       && Number(giaSau[1].don_gia_kg) === GIA.moi_nac, JSON.stringify(giaSau));
  const { rows: [pSau] } = await db.query(`select *, han_thanh_toan::text as han from kho_phieu_nhap where id = $1`, [P2.phieu_id]);
  ok('Thuế, chi phí, hạn thanh toán giữ nguyên; có đủ 2 ảnh',
     Number(pSau.tien_thue) === 100000 && Number(pSau.chi_phi_khac) === 50000 && pSau.han === hanKt
       && pSau.anh.length === 2, JSON.stringify({ t: pSau.tien_thue, c: pSau.chi_phi_khac, h: pSau.han, a: pSau.anh }));

  // Quản lý (xem_gia): y như trước — ghi giá, thuế, hạn, xóa ảnh được.
  pb = await phienBan(P2.phieu_id);
  const hanQl = await ngay(25);
  const ql = await luuCu(UID.qlA, { id: P2.phieu_id, phienBan: pb, anh: [anh2], thue: 7000, chiPhi: 3000, hanTT: hanQl,
    dong: [{ ...dongKg(11.5)[0], don_gia_kg: GIA.moi_than + 1000 }, { ...dongKg(11.5)[1], don_gia_kg: GIA.moi_nac }] });
  ok('Quản lý vẫn lưu được qua hàm cũ với giá, thuế, hạn, bớt ảnh', ql.loi === null, ql.loi ?? '');
  const { rows: [pQl] } = await db.query(`select *, han_thanh_toan::text as han from kho_phieu_nhap where id = $1`, [P2.phieu_id]);
  const { rows: gQl } = await db.query(
    `select don_gia_kg from kho_phieu_nhap_dong where phieu_nhap_id = $1 order by thu_tu`, [P2.phieu_id]);
  ok('Giá trị quản lý gửi được ghi đúng',
     Number(pQl.tien_thue) === 7000 && Number(pQl.chi_phi_khac) === 3000 && pQl.han === hanQl
       && pQl.anh.length === 1 && pQl.anh[0] === anh2 && Number(gQl[0].don_gia_kg) === GIA.moi_than + 1000,
     JSON.stringify({ pQl: [pQl.tien_thue, pQl.chi_phi_khac, pQl.han, pQl.anh], gQl }));
  const qlMoi = await luuCu(UID.qlA, { anh: [anh(cnA.id)], thue: 1000, hanTT: await ngay(15),
    dong: [{ ...dongKg(3)[0], don_gia_kg: GIA.moi_than }] });
  ok('Quản lý tạo phiếu mới có giá qua hàm cũ được', qlMoi.loi === null, qlMoi.loi ?? '');

  // Dọn: hủy hai phiếu nháp thử để nhóm sau không bị lệch.
  for (const id of [P2.phieu_id, qlMoi.rows?.[0]?.phieu_id].filter(Boolean)) {
    const h = await duoi(UID.qlA, `select kho_huy_phieu_nhap($1, null)`, [id]);
    if (h.loi) throw new Error(h.loi);
  }
  await doiSoat('Sau thử hàm cũ');
});

// ===========================================================================
await nhom('11 · CÂU LỖI VÀ CÂU TRẢ VỀ THỦ KHO THẤY: KHÔNG CÓ SỐ TIỀN', async () => {
  const tien = cauThuKhoThay.filter(coTien);
  ok(`${cauThuKhoThay.length} câu đã soát, không câu nào có số tiền`, cauThuKhoThay.length >= 15 && tien.length === 0,
     tien.join(' | '));
  await doiSoat('Cuối cùng');
});

process.exit(ketThuc('THỦ KHO KHÔNG THẤY TIỀN'));
