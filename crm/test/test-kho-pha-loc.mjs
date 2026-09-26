/**
 * BEEFTOWN KHO — Kiểm thử pha lóc
 * ===============================
 *
 *     node test/test-kho-pha-loc.mjs
 *
 * Những điều phải đúng tuyệt đối:
 *   · tổng giá vốn các lô ra = giá vốn phần tảng lấy vào, ĐÚNG TỪNG ĐỒNG;
 *   · phụ phẩm giữ lại được định giá trước, phần bỏ bằng 0, phần còn lại chia
 *     cho thịt theo giá trị bán (hoặc theo kg);
 *   · phiên nháp không chạm tồn; chốt thì trừ tảng, sinh lô; mở lại thì trả
 *     tồn về đúng như cũ;
 *   · nhân viên quầy không thấy phiên pha lóc (có giá bán dùng để chia giá vốn).
 * Cuối mỗi nhóm: kho_doi_soat_ton() phải rỗng.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ PHA LÓC');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngaySau = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

const MH = {};
async function napMatHang() {
  const { rows } = await db.query(`select * from kho_mat_hang`);
  for (const r of rows) MH[r.ma] = r;
}

let viTri = {};
let ncc;

/**
 * Nhập hàng qua đúng luồng: quản lý lưu phiếu có giá (thủ kho không gửi được
 * giá — 0031), thủ kho gửi; quản lý duyệt. Trả các lô sinh ra.
 */
async function nhapHang(dong, vt = viTri.kho) {
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
  const gui = await duoi(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const duyet = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (duyet.loi) throw new Error(duyet.loi);
  const { rows } = await db.query(`
    select l.*, g.gia_tri, g.gia_von_kg from kho_lo l
    join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    join kho_lo_gia g on g.lo_id = l.id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id]);
  return rows;
}

/** Gọi kho_luu_phien_pha. */
async function luuPhien(uid, t) {
  return duoi(uid, `
    select * from kho_luu_phien_pha(
      p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
      p_mat_hang_vao_id => $5, p_cong_thuc_id => $6, p_ngay_pha => $7::date,
      p_ghi_chu => $8, p_vao => $9::jsonb, p_ra => $10::jsonb)`,
    [t.id ?? null, t.cn ?? cnA.id, t.maGui ?? maGui(), t.phienBan ?? null,
     t.matHang, t.congThuc ?? null, t.ngay ?? homNay, t.ghiChu ?? null,
     JSON.stringify(t.vao ?? []), JSON.stringify(t.ra ?? [])]);
}

const xemThu = (uid, id) => duoi(uid, `select kho_xem_thu_phien_pha($1) as t`, [id]);
const chot = (uid, id, pb) => duoi(uid, `select kho_chot_phien_pha($1, $2) as cau`, [id, pb]);
const phien = async id => (await db.query(`select * from kho_phien_pha where id = $1`, [id])).rows[0];
const ton = async (loId, vt) => (await db.query(
  `select so_kg::numeric as kg, so_goi from kho_ton where lo_id = $1 and vi_tri_id = $2`, [loId, vt])).rows[0]
  ?? { kg: '0', so_goi: 0 };

let loA, loB, loNacVai;    // lô tảng
let ph1;                   // phiên chính

// ===========================================================================
await nhom('1 · CHUẨN BỊ: KHO, DANH MỤC, GIÁ, HÀNG TẢNG', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  const mau = await duoi(UID.qlA, `select kho_tao_danh_muc_mau() as n`);
  ok('Có danh mục mẫu', mau.rows?.[0]?.n === 19, mau.loi ?? '');
  await napMatHang();

  const { rows: vt } = await db.query(`select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id]);
  viTri = Object.fromEntries(vt.map(r => [r.loai, r.id]));

  const gia = await duoi(UID.qlA, `
    update kho_mat_hang set gia_ban_kg = case ma
      when 'C-THANNGOAI' then 900000 when 'C-THANNOI' then 1200000
      when 'C-NACVAI' then 600000 end
    where ma in ('C-THANNGOAI', 'C-THANNOI', 'C-NACVAI')`);
  ok('Quản lý đặt giá bán cho phần cắt', gia.loi === null, gia.loi ?? '');
  const thuHoi = await duoi(UID.qlA, `
    insert into kho_mat_hang_gia (mat_hang_id, gia_tri_thu_hoi_kg) values ($1, 100000)`, [MH['P-VUN'].id]);
  ok('Quản lý đặt giá trị thu hồi thịt vụn 100.000đ/kg', thuHoi.loi === null, thuHoi.loi ?? '');
  await napMatHang();

  const n = await duoi(UID.qlA, `insert into kho_nha_cung_cap (ten) values ('NCC Thịt Úc') returning id`);
  ncc = n.rows[0].id;

  [loA] = await nhapHang([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 10, don_gia_kg: 500000,
                            han_dung: await ngaySau(20) }]);
  [loB] = await nhapHang([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 2, so_kg: 20, don_gia_kg: 523457,
                            han_dung: await ngaySau(2) }]);
  [loNacVai] = await nhapHang([{ mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 8, don_gia_kg: 350000 }]);
  ok('Có ba lô tảng trong kho lạnh', loA && loB && loNacVai);
  ok('Lô A: 10 kg × 500.000đ = 5.000.000đ', Number(loA.gia_tri) === 5000000, `${loA.gia_tri}`);
  await doiSoat('Sau khi nhập tảng');
});

// ===========================================================================
await nhom('2 · LƯU NHÁP PHIÊN PHA LÓC', async () => {
  const gui = maGui();
  const t = {
    matHang: MH['T-THANNGOAI'].id, maGui: gui,
    vao: [{ lo_id: loA.id, vi_tri_id: viTri.kho }],        // bỏ trống kg = lấy hết
    ra: [
      { mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 7, so_goi: 14, xu_ly: 'nhap_kho', vi_tri_id: viTri.quay },
      { mat_hang_id: MH['P-VUN'].id, so_kg: 1, xu_ly: 'chuyen_bep' },
      { mat_hang_id: MH['P-MO'].id, so_kg: 1.5, xu_ly: 'bo' },
    ],
  };

  const nv = await luuPhien(UID.nvQuayA, t);
  ok('NV quầy KHÔNG ghi được pha lóc', nv.loi !== null && /không được ghi pha lóc/.test(nv.loi), nv.loi ?? '');
  const kt = await luuPhien(UID.keToanA, t);
  ok('Kế toán KHÔNG ghi được pha lóc', kt.loi !== null);
  const tkB = await luuPhien(UID.thuKhoB, t);
  ok('Thủ kho chi nhánh khác KHÔNG ghi được vào Q1', tkB.loi !== null);

  const tao = await luuPhien(UID.thuKhoA, t);
  ok('Thủ kho lưu nháp được', tao.loi === null && tao.rows[0].da_co === false, tao.loi ?? '');
  ph1 = tao.rows?.[0];

  const lai = await luuPhien(UID.thuKhoA, t);
  ok('Bấm lưu lần hai cùng ma_gui → cùng phiên', lai.rows?.[0]?.phien_id === ph1.phien_id && lai.rows[0].da_co);

  const p = await phien(ph1.phien_id);
  ok('Số phiên dạng PL-YYMM-0001', /^PL-\d{4}-0001$/.test(p.so_phieu), p.so_phieu);

  const { rows: [vao] } = await db.query(`select * from kho_phien_pha_vao where phien_pha_id = $1`, [ph1.phien_id]);
  ok('Bỏ trống kg = lấy hết lô: 10 kg, 1 tảng', Number(vao.so_kg) === 10 && vao.so_goi === 1, `${vao.so_kg} / ${vao.so_goi}`);

  const { rows: [{ n: soDong }] } = await db.query(
    `select count(*)::int as n from kho_so_cai where chung_tu_loai = 'phien_pha'`);
  ok('Lưu nháp KHÔNG ghi sổ kho', soDong === 0);
  const t0 = await ton(loA.id, viTri.kho);
  ok('Lưu nháp KHÔNG trừ tồn tảng', Number(t0.kg) === 10);

  const khacLoai = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(),
    vao: [{ lo_id: loA.id, vi_tri_id: viTri.kho }, { lo_id: loNacVai.id, vi_tri_id: viTri.kho }] });
  ok('Trộn hai loại tảng trong một phiên bị từ chối',
     khacLoai.loi !== null && /mỗi phiên chỉ pha một loại/.test(khacLoai.loi), khacLoai.loi ?? '');

  const qua = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(), vao: [{ lo_id: loA.id, vi_tri_id: viTri.kho, so_kg: 10.5 }] });
  ok('Lấy quá số kg còn trong lô bị từ chối', qua.loi !== null && /chỉ còn 10/.test(qua.loi), qua.loi ?? '');

  const quaGoi = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(), vao: [{ lo_id: loA.id, vi_tri_id: viTri.kho, so_kg: 5, so_goi: 2 }] });
  ok('Lấy quá số tảng còn trong lô bị từ chối', quaGoi.loi !== null && /chỉ còn 1 tảng/.test(quaGoi.loi), quaGoi.loi ?? '');

  const sai = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(), vao: [{ lo_id: loA.id, vi_tri_id: viTri.quay }] });
  ok('Lô không có ở vị trí đã chọn bị từ chối', sai.loi !== null && /đã hết/.test(sai.loi), sai.loi ?? '');

  const trung = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(),
    vao: [{ lo_id: loB.id, vi_tri_id: viTri.kho, so_kg: 5 }, { lo_id: loB.id, vi_tri_id: viTri.kho, so_kg: 3 }] });
  ok('Chọn một lô hai lần bị từ chối', trung.loi !== null && /bị chọn hai lần/.test(trung.loi), trung.loi ?? '');

  const khongNoiDe = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(),
    ra: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 7, so_goi: 14, xu_ly: 'nhap_kho' }] });
  ok('Phần nhập kho mà chưa chọn nơi để bị từ chối', khongNoiDe.loi !== null && /chọn nơi để/.test(khongNoiDe.loi));

  const choHuy = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(),
    ra: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 7, so_goi: 14, xu_ly: 'nhap_kho', vi_tri_id: viTri.cho_huy }] });
  ok('Không để phần cắt vào vị trí chờ hủy được', choHuy.loi !== null && /kho hoặc quầy/.test(choHuy.loi));

  const thieuGoi = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(),
    ra: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 7, xu_ly: 'nhap_kho', vi_tri_id: viTri.quay }] });
  ok('Phần cắt đếm gói mà chưa nhập số gói bị từ chối', thieuGoi.loi !== null && /chưa nhập số gói/.test(thieuGoi.loi), thieuGoi.loi ?? '');

  const leSo = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(),
    ra: [{ mat_hang_id: MH['P-VUN'].id, so_kg: 1.2345, xu_ly: 'chuyen_bep' }] });
  ok('Số kg quá 3 số lẻ bị từ chối', leSo.loi !== null && /tối đa 3 số lẻ/.test(leSo.loi));

  const khoaLa = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(),
    ra: [{ mat_hang_id: MH['P-VUN'].id, so_kg: 1, gia_von_kg: 1 }] });
  ok('Trường lạ (tự đặt giá vốn) bị từ chối', khoaLa.loi !== null && /không được nhận/.test(khoaLa.loi));

  const hanSai = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(),
    ra: [{ mat_hang_id: MH['P-VUN'].id, so_kg: 1, xu_ly: 'chuyen_bep', han_dung: '2020-01-01' }] });
  ok('Hạn dùng trước ngày pha bị từ chối', hanSai.loi !== null && /trước ngày pha/.test(hanSai.loi));

  const mai = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(), ngay: await ngaySau(1) });
  ok('Ngày pha sau hôm nay bị từ chối', mai.loi !== null && /sau hôm nay/.test(mai.loi));

  const phuPhamVao = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(), matHang: MH['P-VUN'].id });
  ok('Phụ phẩm không làm đầu vào được', phuPhamVao.loi !== null && /Chọn loại tảng/.test(phuPhamVao.loi));

  const ct = await duoi(UID.qlA, `insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values ($1, 'Nạc vai chuẩn') returning id`,
                        [MH['T-NACVAI'].id]);
  const saiCt = await luuPhien(UID.thuKhoA, { ...t, maGui: maGui(), congThuc: ct.rows[0].id });
  ok('Công thức của loại tảng khác bị từ chối', saiCt.loi !== null && /Công thức không dành/.test(saiCt.loi));

  const cu = await luuPhien(UID.thuKhoA, { ...t, id: ph1.phien_id, phienBan: 99 });
  ok('Lưu đè với phiên bản cũ bị từ chối', cu.loi !== null && /sửa ở máy khác/.test(cu.loi));

  const sua = await luuPhien(UID.thuKhoA, { ...t, id: ph1.phien_id, phienBan: ph1.phien_ban_moi, ghiChu: 'Tảng đẹp' });
  ok('Sửa nháp đúng phiên bản được', sua.loi === null, sua.loi ?? '');
  ph1 = sua.rows?.[0];

  const truc = await duoi(UID.thuKhoA, `
    insert into kho_phien_pha (chi_nhanh_id, so_phieu, ma_gui, mat_hang_vao_id) values ($1, 'X', $2, $3)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id]);
  ok('Không ghi thẳng vào bảng phiên pha được (chỉ qua hàm)', truc.loi !== null);
  await doiSoat('Sau khi lưu nháp');
});

// ===========================================================================
await nhom('3 · XEM THỬ — THU HỒI VÀ GIÁ VỐN TRƯỚC KHI CHỐT', async () => {
  // 0031: bản xem thử có tiền là của vai xem giá; thủ kho xem bản chỉ kg.
  const x = await xemThu(UID.qlA, ph1.phien_id);
  ok('Quản lý xem thử được', x.loi === null, x.loi ?? '');
  const tkTien = await xemThu(UID.thuKhoA, ph1.phien_id);
  ok('Thủ kho KHÔNG xem được bản xem thử có tiền (0031)', tkTien.loi !== null);
  const tkKg = await duoi(UID.thuKhoA, `select kho_xem_thu_phien_pha_kg($1) as t`, [ph1.phien_id]);
  const k = tkKg.rows?.[0]?.t;
  ok('Thủ kho xem thử bản chỉ kg: vào 10 kg, thu hồi 70%, hao hụt 0,5 kg',
     tkKg.loi === null && Number(k.tong_kg_vao) === 10 && Number(k.ty_le_thu_hoi) === 70 && Number(k.kg_hao_hut) === 0.5,
     tkKg.loi ?? JSON.stringify(k));
  const t = x.rows?.[0]?.t;
  ok('Vào 10 kg, giá trị 5.000.000đ', Number(t.tong_kg_vao) === 10 && Number(t.gia_tri_vao) === 5000000,
     `${t.tong_kg_vao} / ${t.gia_tri_vao}`);
  ok('Thu hồi 70%, phụ phẩm 10%, bỏ 15%, hao hụt 5%',
     Number(t.ty_le_thu_hoi) === 70 && Number(t.ty_le_phu_pham) === 10
       && Number(t.ty_le_bo) === 15 && Number(t.ty_le_hao_hut) === 5,
     `${t.ty_le_thu_hoi} / ${t.ty_le_phu_pham} / ${t.ty_le_bo} / ${t.ty_le_hao_hut}`);
  const [thit, vun, mo] = t.dong;
  ok('Thịt vụn định giá trước: 1 kg × 100.000đ', Number(vun.gia_tri) === 100000);
  ok('Mỡ bỏ: giá trị 0', Number(mo.gia_tri) === 0);
  ok('Thăn cắt lát gánh phần còn lại: 4.900.000đ = 700.000đ/kg',
     Number(thit.gia_tri) === 4900000 && Number(thit.gia_von_kg) === 700000, `${thit.gia_tri} / ${thit.gia_von_kg}`);
  ok('Không có cảnh báo khi đủ giá', t.canh_bao.length === 0, JSON.stringify(t.canh_bao));

  const kt = await xemThu(UID.keToanA, ph1.phien_id);
  ok('Kế toán xem thử được (xem giá)', kt.loi === null);
  const nv = await xemThu(UID.nvQuayA, ph1.phien_id);
  ok('NV quầy KHÔNG xem thử được', nv.loi !== null);
  const tkB = await xemThu(UID.thuKhoB, ph1.phien_id);
  ok('Thủ kho chi nhánh khác KHÔNG xem được', tkB.loi !== null);

  const noiBo = await duoi(UID.thuKhoA, `select kho_tinh_phien_pha($1)`, [ph1.phien_id]);
  ok('Hàm tính nội bộ không gọi thẳng được', noiBo.loi !== null && /permission denied/.test(noiBo.loi), noiBo.loi ?? '');
});

// ===========================================================================
await nhom('4 · CHỐT PHIÊN — TRỪ TẢNG, SINH LÔ', async () => {
  const kt = await chot(UID.keToanA, ph1.phien_id, ph1.phien_ban_moi);
  ok('Kế toán KHÔNG chốt được', kt.loi !== null);
  const cu = await chot(UID.thuKhoA, ph1.phien_id, 1);
  ok('Chốt với phiên bản cũ bị từ chối', cu.loi !== null && /sửa ở máy khác/.test(cu.loi));

  const c = await chot(UID.thuKhoA, ph1.phien_id, ph1.phien_ban_moi);
  ok('Thủ kho chốt được', c.loi === null && /thu hồi 70,00%, 2 lô mới/.test(c.rows?.[0]?.cau), c.loi ?? c.rows?.[0]?.cau);

  const tA = await ton(loA.id, viTri.kho);
  ok('Tảng A hết: 0 kg, 0 tảng', Number(tA.kg) === 0 && tA.so_goi === 0, JSON.stringify(tA));

  const { rows: loRa } = await db.query(`
    select l.*, g.gia_tri, g.gia_von_kg, m.ma, l.han_dung::text as han
    from kho_lo l join kho_lo_gia g on g.lo_id = l.id join kho_mat_hang m on m.id = l.mat_hang_id
    where l.phien_pha_id = $1 order by m.ma`, [ph1.phien_id]);
  ok('Sinh 2 lô (thăn cắt lát, thịt vụn) — mỡ bỏ không có lô',
     loRa.length === 2 && loRa.map(l => l.ma).join() === 'C-THANNGOAI,P-VUN', loRa.map(l => l.ma).join());
  const tong = loRa.reduce((s, l) => s + Number(l.gia_tri), 0);
  ok('Tổng giá vốn lô ra = 5.000.000đ, đúng từng đồng', tong === 5000000, `${tong}`);
  const [loThit, loVun] = loRa;
  ok('Lô thăn cắt lát: nguồn pha lóc, 700.000đ/kg', loThit.nguon === 'pha_loc' && Number(loThit.gia_von_kg) === 700000);

  const tThit = await ton(loThit.id, viTri.quay);
  ok('Thăn cắt lát lên quầy: 7 kg, 14 gói', Number(tThit.kg) === 7 && tThit.so_goi === 14, JSON.stringify(tThit));

  const tVun = await ton(loVun.id, viTri.kho);
  ok('Thịt vụn chuyển thẳng bếp: tồn 0', Number(tVun.kg) === 0);
  // Hai dòng ghi trong cùng một lệnh có thể trùng created_at — không so thứ tự.
  const { rows: scVun } = await db.query(
    `select loai, so_kg::numeric as kg from kho_so_cai where lo_id = $1`, [loVun.id]);
  const vunRa = scVun.find(r => r.loai === 'pha_loc_ra'), vunBep = scVun.find(r => r.loai === 'xuat_bep');
  ok('Sổ thịt vụn: pha lóc ra +1 kg rồi xuất bếp −1 kg',
     scVun.length === 2 && vunRa && Number(vunRa.kg) === 1 && vunBep && Number(vunBep.kg) === -1,
     JSON.stringify(scVun));

  ok('HSD thăn cắt lát = ngày pha + 3 ngày (sớm hơn HSD tảng)', loThit.han === await ngaySau(3), loThit.han);

  const p = await phien(ph1.phien_id);
  ok('Phiên lưu tổng kết: 10 kg vào, 70% thu hồi, 0,5 kg hao hụt',
     p.trang_thai === 'da_chot' && Number(p.tong_kg_vao) === 10 && Number(p.ty_le_thu_hoi) === 70
       && Number(p.tong_kg_hao_hut) === 0.5, JSON.stringify(p));
  const { rows: ra } = await db.query(`select gia_ban_kg from kho_phien_pha_ra where phien_pha_id = $1 order by thu_tu`, [ph1.phien_id]);
  ok('Giá bán lúc chốt được chụp lại', Number(ra[0].gia_ban_kg) === 900000);

  const lai = await chot(UID.thuKhoA, ph1.phien_id, p.phien_ban);
  ok('Chốt lần hai chỉ báo "đã chốt", không ghi thêm', lai.loi === null && /trước đó/.test(lai.rows?.[0]?.cau));
  const { rows: [{ n }] } = await db.query(`select count(*)::int as n from kho_lo where phien_pha_id = $1`, [ph1.phien_id]);
  ok('Vẫn đúng 2 lô', n === 2);

  const sua = await luuPhien(UID.thuKhoA, { id: ph1.phien_id, phienBan: p.phien_ban, matHang: MH['T-THANNGOAI'].id });
  ok('Phiên đã chốt không sửa được', sua.loi !== null && /mở lại/.test(sua.loi));
  await doiSoat('Sau khi chốt phiên');
});

// ===========================================================================
await nhom('5 · CHIA GIÁ VỐN SỐ LẺ — VẪN KHÔNG LỆCH MỘT ĐỒNG', async () => {
  // Lô B: 2 tảng, 20 kg × 523.457đ. Lấy 1 tảng, cân được 9,3 kg.
  const t = {
    matHang: MH['T-THANNGOAI'].id,
    vao: [{ lo_id: loB.id, vi_tri_id: viTri.kho, so_kg: 9.3, so_goi: 1 }],
    ra: [
      { mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 5.123, so_goi: 11, xu_ly: 'nhap_kho', vi_tri_id: viTri.quay },
      { mat_hang_id: MH['C-THANNOI'].id, so_kg: 1.777, so_goi: 3, xu_ly: 'nhap_kho', vi_tri_id: viTri.kho },
      { mat_hang_id: MH['P-VUN'].id, so_kg: 0.5, xu_ly: 'nhap_kho', vi_tri_id: viTri.kho },
      { mat_hang_id: MH['P-GAN'].id, so_kg: 0.3, xu_ly: 'chuyen_bep' },
      { mat_hang_id: MH['P-MO'].id, so_kg: 0.8, xu_ly: 'bo' },
    ],
  };
  const s = await luuPhien(UID.thuKhoA, t);
  ok('Lưu phiên số lẻ', s.loi === null, s.loi ?? '');
  const id = s.rows[0].phien_id;

  const x = (await xemThu(UID.qlA, id)).rows[0].t;
  const tongRa = x.dong.reduce((a, d) => a + Number(d.gia_tri), 0);
  ok('Tổng giá trị ra = giá trị vào (9,3 × 523.457 làm tròn)', tongRa === Number(x.gia_tri_vao)
     && Number(x.gia_tri_vao) === Math.round(9.3 * 523457), `${tongRa} vs ${x.gia_tri_vao}`);
  const [c1, c2, vun, gan, mo] = x.dong;
  ok('Thịt vụn 0,5 kg × 100.000 = 50.000đ; gân chưa định giá = 0; mỡ = 0',
     Number(vun.gia_tri) === 50000 && Number(gan.gia_tri) === 0 && Number(mo.gia_tri) === 0);
  const conLai = Number(x.gia_tri_vao) - 50000;
  const w1 = 5.123 * 900000, w2 = 1.777 * 1200000;
  ok('Phần thịt chia theo giá trị bán (lệch làm tròn ≤ 1đ)',
     Math.abs(Number(c1.gia_tri) - conLai * w1 / (w1 + w2)) <= 1 && Number(c1.gia_tri) + Number(c2.gia_tri) === conLai,
     `${c1.gia_tri} + ${c2.gia_tri}`);
  ok('Cảnh báo: gân chưa có giá trị thu hồi', x.canh_bao.some(c => /Gân/.test(c)), JSON.stringify(x.canh_bao));
  ok('Chia theo giá trị bán', x.chia_theo === 'gia_tri');

  // Thiếu giá bán một phần → cả phiên chia theo kg, có cảnh báo.
  await duoi(UID.qlA, `update kho_mat_hang set gia_ban_kg = null where ma = 'C-THANNOI'`);
  const y = (await xemThu(UID.qlA, id)).rows[0].t;
  ok('Thiếu giá bán → chia theo kg, cảnh báo nêu tên phần thiếu',
     y.chia_theo === 'khoi_luong' && y.canh_bao.some(c => /Thăn nội cắt miếng/.test(c)), JSON.stringify(y.canh_bao));
  ok('Chia theo kg: tỉ lệ đúng theo kg',
     Math.abs(Number(y.dong[0].gia_tri) - conLai * 5.123 / 6.9) <= 1
       && Number(y.dong[0].gia_tri) + Number(y.dong[1].gia_tri) === conLai);
  await duoi(UID.qlA, `update kho_mat_hang set gia_ban_kg = 1200000 where ma = 'C-THANNOI'`);

  // Chủ đổi cách tính sang theo kg — không còn cảnh báo thiếu giá.
  const doi = await duoi(UID.chu, `select kho_luu_cai_dat_goc($1, 'khoi_luong', true, false, 'kiem_ke', true)`, [cnA.id]);
  ok('Chủ đổi cách chia giá vốn sang theo kg', doi.loi === null, doi.loi ?? '');
  const z = (await xemThu(UID.qlA, id)).rows[0].t;
  ok('Cài đặt theo kg được áp dụng', z.chia_theo === 'khoi_luong' && !z.canh_bao.some(c => /giá bán/.test(c)));
  await duoi(UID.chu, `select kho_luu_cai_dat_goc($1, 'gia_tri', true, false, 'kiem_ke', true)`, [cnA.id]);

  // Giá trị thu hồi phụ phẩm vượt giá vốn đầu vào → chặn.
  await db.query(`update kho_mat_hang_gia set gia_tri_thu_hoi_kg = 99000000 where mat_hang_id = $1`, [MH['P-VUN'].id]);
  const vuot = await xemThu(UID.qlA, id);
  ok('Giá trị thu hồi phụ phẩm lớn hơn giá vốn vào bị chặn',
     vuot.loi !== null && /lớn hơn giá vốn đầu vào/.test(vuot.loi), vuot.loi ?? '');
  ok('Câu lỗi đó không in số tiền (thủ kho chốt cũng gặp — 0031)', !/\d/.test(vuot.loi ?? '0'), vuot.loi ?? '');
  const vuotChot = await chot(UID.thuKhoA, id, (await phien(id)).phien_ban);
  ok('Thủ kho chốt lúc đó: bị chặn, câu lỗi không có số tiền',
     vuotChot.loi !== null && !/\d/.test(vuotChot.loi), vuotChot.loi ?? '');
  await db.query(`update kho_mat_hang_gia set gia_tri_thu_hoi_kg = 100000 where mat_hang_id = $1`, [MH['P-VUN'].id]);

  const pb = (await phien(id)).phien_ban;
  const c = await chot(UID.thuKhoA, id, pb);
  ok('Chốt phiên số lẻ', c.loi === null, c.loi ?? '');
  const { rows: [{ tong }] } = await db.query(`
    select coalesce(sum(g.gia_tri), 0)::bigint as tong
    from kho_lo l join kho_lo_gia g on g.lo_id = l.id where l.phien_pha_id = $1`, [id]);
  ok('Tổng giá vốn 4 lô ra = giá trị vào, đúng từng đồng', Number(tong) === Math.round(9.3 * 523457), `${tong}`);

  const tB = await ton(loB.id, viTri.kho);
  ok('Lô B còn 1 tảng, 10,7 kg', Number(tB.kg) === 10.7 && tB.so_goi === 1, JSON.stringify(tB));

  // Lấy nốt tảng cuối, cân được 10,2 kg → sổ tính hết 10,7 kg (chênh vào hao hụt).
  const s2 = await luuPhien(UID.thuKhoA, {
    matHang: MH['T-THANNGOAI'].id,
    vao: [{ lo_id: loB.id, vi_tri_id: viTri.kho, so_kg: 10.2, so_goi: 1 }],
    ra: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 7.5, so_goi: 15, xu_ly: 'nhap_kho', vi_tri_id: viTri.kho }],
  });
  const { rows: [v2] } = await db.query(`select so_kg from kho_phien_pha_vao where phien_pha_id = $1`, [s2.rows[0].phien_id]);
  ok('Lấy hết số tảng → tính hết số kg trên sổ (10,7 kg), không để tồn ảo', Number(v2.so_kg) === 10.7, `${v2.so_kg}`);
  const x2 = (await xemThu(UID.qlA, s2.rows[0].phien_id)).rows[0].t;
  ok('Phần chênh 0,5 kg nằm trong hao hụt của phiên', Number(x2.tong_kg_hao_hut) === 3.2, `${x2.tong_kg_hao_hut}`);
  ok('HSD mặc định không vượt HSD tảng (tảng còn 2 ngày)', x2.han_som_nhat_vao === await ngaySau(2));
  const cNot = await chot(UID.thuKhoA, s2.rows[0].phien_id, (await phien(s2.rows[0].phien_id)).phien_ban);
  ok('Chốt phiên lấy nốt tảng', cNot.loi === null, cNot.loi ?? '');
  const { rows: [l2] } = await db.query(`select han_dung::text as han from kho_lo where phien_pha_id = $1`, [s2.rows[0].phien_id]);
  ok('Lô ra lấy HSD của tảng (2 ngày) thay vì ngày pha + 3', l2.han === await ngaySau(2), l2.han);
  const tB2 = await ton(loB.id, viTri.kho);
  ok('Lô B hết sạch: 0 kg, 0 tảng', Number(tB2.kg) === 0 && tB2.so_goi === 0, JSON.stringify(tB2));
  await doiSoat('Sau các phiên số lẻ');
});

// ===========================================================================
await nhom('6 · SAI SỐ CÂN, THIẾU TỒN LÚC CHỐT', async () => {
  const [loC] = await nhapHang([{ mat_hang_id: MH['T-NACVAI'].id, so_goi: 1, so_kg: 5, don_gia_kg: 300000 }]);
  const base = { matHang: MH['T-NACVAI'].id, vao: [{ lo_id: loC.id, vi_tri_id: viTri.kho }] };

  const vuot = await luuPhien(UID.thuKhoA, { ...base,
    ra: [{ mat_hang_id: MH['C-NACVAI'].id, so_kg: 5.051, so_goi: 10, xu_ly: 'nhap_kho', vi_tri_id: viTri.kho }] });
  const cv = await chot(UID.thuKhoA, vuot.rows[0].phien_id, 1);
  ok('Ra nhiều hơn vào quá 0,05 kg bị chặn', cv.loi !== null && /lớn hơn kg vào/.test(cv.loi), cv.loi ?? '');
  const { rows: [{ n: loVuot }] } = await db.query(`select count(*)::int as n from kho_lo where phien_pha_id = $1`, [vuot.rows[0].phien_id]);
  ok('Chốt hỏng không để lại lô nào', loVuot === 0);

  const trong = await luuPhien(UID.thuKhoA, { ...base,
    ra: [{ mat_hang_id: MH['C-NACVAI'].id, so_kg: 5.05, so_goi: 10, xu_ly: 'nhap_kho', vi_tri_id: viTri.kho }] });
  const hai = await luuPhien(UID.thuKhoA, { ...base,
    ra: [{ mat_hang_id: MH['C-NACVAI'].id, so_kg: 4, so_goi: 8, xu_ly: 'nhap_kho', vi_tri_id: viTri.kho }] });
  const ct = await chot(UID.thuKhoA, trong.rows[0].phien_id, 1);
  ok('Ra nhiều hơn vào đúng 0,05 kg vẫn chốt được (sai số cân)', ct.loi === null, ct.loi ?? '');

  const c2 = await chot(UID.thuKhoA, hai.rows[0].phien_id, 1);
  ok('Phiên nháp thứ hai dùng cùng lô: chốt bị chặn vì hết tồn',
     c2.loi !== null && /Không đủ tồn/.test(c2.loi), c2.loi ?? '');
  const p2 = await phien(hai.rows[0].phien_id);
  const { rows: [{ n: lo2 }] } = await db.query(`select count(*)::int as n from kho_lo where phien_pha_id = $1`, [p2.id]);
  ok('Phiên hỏng vẫn là nháp, không sinh lô', p2.trang_thai === 'nhap' && lo2 === 0);

  const rong = await luuPhien(UID.thuKhoA, { matHang: MH['T-NACVAI'].id });
  const cr = await chot(UID.thuKhoA, rong.rows[0].phien_id, 1);
  ok('Phiên chưa có tảng không chốt được', cr.loi !== null && /Chưa chọn tảng/.test(cr.loi));

  const huy = await duoi(UID.thuKhoA, `select kho_huy_phien_pha($1, 'Nhập nhầm') as cau`, [p2.id]);
  ok('Hủy phiên nháp được', huy.loi === null && /Đã hủy/.test(huy.rows?.[0]?.cau));
  const suaHuy = await luuPhien(UID.thuKhoA, { ...base, id: p2.id, phienBan: (await phien(p2.id)).phien_ban });
  ok('Phiên đã hủy không sửa được', suaHuy.loi !== null && /bị hủy/.test(suaHuy.loi));
  const huyChot = await duoi(UID.thuKhoA, `select kho_huy_phien_pha($1, 'x')`, [trong.rows[0].phien_id]);
  ok('Phiên đã chốt không hủy thẳng được', huyChot.loi !== null && /mở lại trước/.test(huyChot.loi));
  await doiSoat('Sau sai số và thiếu tồn');
});

// ===========================================================================
await nhom('7 · MỞ LẠI PHIÊN ĐÃ CHỐT', async () => {
  const [loD] = await nhapHang([{ mat_hang_id: MH['T-THANNOI'].id, so_goi: 1, so_kg: 4, don_gia_kg: 900000 }]);
  const s = await luuPhien(UID.thuKhoA, {
    matHang: MH['T-THANNOI'].id,
    vao: [{ lo_id: loD.id, vi_tri_id: viTri.kho }],
    ra: [
      { mat_hang_id: MH['C-THANNOI'].id, so_kg: 3, so_goi: 6, xu_ly: 'nhap_kho', vi_tri_id: viTri.quay },
      { mat_hang_id: MH['P-VUN'].id, so_kg: 0.6, xu_ly: 'chuyen_bep' },
    ],
  });
  const id = s.rows[0].phien_id;
  await chot(UID.thuKhoA, id, 1);

  const khongLyDo = await duoi(UID.thuKhoA, `select kho_mo_lai_phien_pha($1, '  ')`, [id]);
  ok('Mở lại phải có lý do', khongLyDo.loi !== null && /lý do/.test(khongLyDo.loi));
  const nv = await duoi(UID.nvQuayA, `select kho_mo_lai_phien_pha($1, 'x')`, [id]);
  ok('NV quầy KHÔNG mở lại được', nv.loi !== null);

  const mo = await duoi(UID.thuKhoA, `select kho_mo_lai_phien_pha($1, 'Cân sai phần thăn') as cau`, [id]);
  ok('Thủ kho mở lại được', mo.loi === null && /Đã mở lại/.test(mo.rows?.[0]?.cau), mo.loi ?? '');
  const tD = await ton(loD.id, viTri.kho);
  ok('Tảng trả về kho đủ 4 kg, 1 tảng', Number(tD.kg) === 4 && tD.so_goi === 1, JSON.stringify(tD));
  const { rows: loCu } = await db.query(`select id from kho_lo where phien_pha_id = $1`, [id]);
  const { rows: [{ tong }] } = await db.query(
    `select coalesce(sum(so_kg), 0)::numeric as tong from kho_ton where lo_id = any($1::uuid[])`, [loCu.map(l => l.id)]);
  ok('Các lô ra cũ về 0', Number(tong) === 0);
  const p = await phien(id);
  ok('Phiên về nháp, xóa tổng kết, ghi lý do', p.trang_thai === 'nhap' && p.ty_le_thu_hoi === null && p.ly_do === 'Cân sai phần thăn');
  await doiSoat('Sau khi mở lại');

  const sua = await luuPhien(UID.thuKhoA, {
    id, phienBan: p.phien_ban, matHang: MH['T-THANNOI'].id,
    vao: [{ lo_id: loD.id, vi_tri_id: viTri.kho }],
    ra: [
      { mat_hang_id: MH['C-THANNOI'].id, so_kg: 3.2, so_goi: 6, xu_ly: 'nhap_kho', vi_tri_id: viTri.quay },
      { mat_hang_id: MH['P-VUN'].id, so_kg: 0.6, xu_ly: 'chuyen_bep' },
    ],
  });
  const c = await chot(UID.thuKhoA, id, sua.rows[0].phien_ban_moi);
  ok('Sửa rồi chốt lại được', c.loi === null, c.loi ?? '');
  const { rows: [thit] } = await db.query(`
    select l.id, g.gia_tri from kho_lo l join kho_lo_gia g on g.lo_id = l.id
    join kho_ton t on t.lo_id = l.id
    where l.phien_pha_id = $1 and t.so_kg > 0`, [id]);
  ok('Lô mới: 3,2 kg thăn nội, tổng giá vốn vẫn khớp', thit && Number(thit.gia_tri) === 3600000 - 60000, `${thit?.gia_tri}`);

  // Bán 1 kg từ lô ra → không mở lại được nữa.
  await db.query(`
    insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
    values ($1, $2, $3, $4, 'ban', -1, -2, 'ban_hang', gen_random_uuid())`, [cnA.id, thit.id, viTri.quay, MH['C-THANNOI'].id]);
  const moLan2 = await duoi(UID.thuKhoA, `select kho_mo_lai_phien_pha($1, 'thử')`, [id]);
  ok('Lô ra đã bán bớt → không mở lại được', moLan2.loi !== null && /đã được dùng/.test(moLan2.loi), moLan2.loi ?? '');
  await doiSoat('Sau khi chốt lại');
});

// ===========================================================================
await nhom('8 · AI THẤY GÌ', async () => {
  const dem = async (uid, bang) => (await duoi(uid, `select count(*)::int as n from ${bang}`)).rows?.[0]?.n;

  ok('NV quầy KHÔNG thấy phiên pha lóc', await dem(UID.nvQuayA, 'kho_phien_pha') === 0);
  ok('NV quầy KHÔNG thấy đầu ra (có giá bán dùng chia giá vốn)', await dem(UID.nvQuayA, 'kho_phien_pha_ra') === 0);
  ok('NV quầy KHÔNG thấy danh sách phiên', await dem(UID.nvQuayA, 'kho_v_phien_pha') === 0);
  ok('NV quầy vẫn thấy lô phần cắt ở tồn kho',
     (await duoi(UID.nvQuayA, `select count(*)::int as n from kho_v_ton where nguon = 'pha_loc'`)).rows[0].n > 0);
  ok('NV quầy KHÔNG thấy giá vốn lô pha lóc', await dem(UID.nvQuayA, 'kho_lo_gia') === 0);

  const tong = await dem(UID.thuKhoA, 'kho_phien_pha');
  ok('Thủ kho thấy các phiên của chi nhánh mình', tong >= 7, `${tong}`);
  ok('Kế toán thấy phiên pha lóc', await dem(UID.keToanA, 'kho_phien_pha') === tong);
  ok('Thủ kho chi nhánh khác KHÔNG thấy', await dem(UID.thuKhoB, 'kho_phien_pha') === 0);
  ok('Thu ngân (vai CRM) KHÔNG thấy', await dem(UID.thuNganA, 'kho_phien_pha') === 0);

  const v = await duoi(UID.thuKhoA, `select * from kho_v_phien_pha where id = $1`, [ph1.phien_id]);
  ok('Danh sách phiên có tên tảng và tổng kết',
     v.rows?.[0]?.ten_mat_hang_vao === 'Thăn ngoại nguyên tảng' && Number(v.rows[0].ty_le_thu_hoi) === 70);

  const xoa = await duoi(UID.qlA, `delete from kho_phien_pha where id = $1`, [ph1.phien_id]);
  const conLai = await dem(UID.qlA, 'kho_phien_pha');
  ok('Quản lý KHÔNG xóa được phiên', xoa.loi !== null || conLai === tong);
  await doiSoat('Cuối cùng');
});

process.exit(ketThuc('PHA LÓC'));
