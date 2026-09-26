/**
 * BEEFTOWN KHO — Kiểm thử đối chiếu hóa đơn, công nợ, trả hàng, báo cáo
 * =====================================================================
 *
 *     node test/test-kho-cong-no.mjs
 *
 * Những điều phải đúng tuyệt đối:
 *   · công nợ = hóa đơn (khi đã đối chiếu) hoặc tổng phiếu − đã trả − giảm trừ;
 *   · không trả vượt số còn nợ; không chọn phiếu thì trả phiếu đến hạn trước;
 *   · trả hàng: tồn giảm đúng lô, công nợ giảm đúng tiền (kể cả phần thuế);
 *   · phiếu nhập đã có tiền trả thì không hủy được;
 *   · báo cáo xuất – nhập – tồn: tồn cuối = đầu + nhập ± mọi biến động, cho
 *     từng mặt hàng; tồn cuối khớp tồn kho thật;
 *   · nhân viên quầy không thấy một đồng công nợ, báo cáo trả giá trị 0.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ CÔNG NỢ VÀ BÁO CÁO');
const { db, cnA, cnB, duoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

const MH = {};
let viTri = {};
let nccA, nccB;
const lyDo = {};

/**
 * Nhập hàng qua đúng luồng; trả id phiếu và các lô. Phiếu có giá, thuế, chi
 * phí nên quản lý (vai xem giá) lưu — thủ kho không gửi được tiền (0031).
 */
async function nhapHang({ ncc = null, loai = 'mua', ngayNhap = homNay, vt = viTri.kho, thue = 0, chiPhi = 0, dong }) {
  const luu = await duoi(UID.qlA, `
    select * from kho_luu_phieu_nhap(
      p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
      p_loai => $3, p_nha_cung_cap_id => $4, p_vi_tri_id => $5, p_ngay_nhap => $6::date,
      p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
      p_tien_thue => $7, p_chi_phi_khac => $8, p_ghi_chu => null, p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
      p_truong_them => '{}'::jsonb, p_dong => $9::jsonb)`,
    [cnA.id, maGui(), loai, ncc, vt, ngayNhap, thue, chiPhi, JSON.stringify(dong)]);
  if (luu.loi) throw new Error(luu.loi);
  const p = luu.rows[0];
  const gui = await duoi(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
  if (gui.loi) throw new Error(gui.loi);
  const d = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
  if (d.loi) throw new Error(d.loi);
  const { rows: lo } = await db.query(`
    select l.* from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu`, [p.phieu_id]);
  const { rows: [pn] } = await db.query(`select * from kho_phieu_nhap where id = $1`, [p.phieu_id]);
  return { id: p.phieu_id, so: pn.so_phieu, lo };
}

const congNo = async id => (await db.query(`select * from kho_v_cong_no_phieu where id = $1`, [id])).rows[0];
const n = v => Number(v);

function traTien(uid, t) {
  return duoi(uid, `
    select * from kho_ghi_thanh_toan(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_nha_cung_cap_id => $3, p_loai => $4, p_hinh_thuc => $5,
      p_so_tien => $6, p_ngay => $7::date, p_ghi_chu => $8, p_anh => $9::text[], p_phan_bo => $10::jsonb)`,
    [t.cn ?? cnA.id, t.maGui ?? maGui(), t.ncc, t.loai ?? 'thanh_toan', t.hinhThuc === undefined ? 'chuyen_khoan' : t.hinhThuc,
     t.soTien, t.ngay ?? homNay, t.ghiChu ?? null, t.anh ?? [], JSON.stringify(t.phanBo ?? [])]);
}

function traHang(uid, t) {
  return duoi(uid, `
    select * from kho_tra_nha_cung_cap(
      p_chi_nhanh_id => $1, p_ma_gui => $2, p_phieu_nhap_id => $3, p_vi_tri_id => $4, p_ghi_chu => $5,
      p_anh => $6::text[], p_so_tien_giam_tru => $7, p_dong => $8::jsonb)`,
    [cnA.id, t.maGui ?? maGui(), t.phieu, t.viTri ?? viTri.kho, t.ghiChu ?? null, t.anh ?? [],
     t.soTien ?? null, JSON.stringify(t.dong ?? [])]);
}

const baoCao = (uid, ten, tu, den) =>
  duoi(uid, `select * from ${ten}($1, $2::date, $3::date)`, [cnA.id, tu, den]);

let PN1, PN2, PN3, TD;

// ===========================================================================
await nhom('1 · CHUẨN BỊ: HAI NHÀ CUNG CẤP, BA PHIẾU MUA, MỘT PHIẾU TỒN ĐẦU', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlB, `select kho_khoi_tao($1)`, [cnB.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  for (const r of (await db.query(`select * from kho_mat_hang`)).rows) MH[r.ma] = r;
  viTri = Object.fromEntries((await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id])).rows.map(r => [r.loai, r.id]));
  for (const r of (await db.query(`select * from kho_ly_do`)).rows) lyDo[`${r.loai}:${r.ten}`] = r.id;
  await duoi(UID.qlA, `update kho_mat_hang set gia_ban_kg = 900000 where ma = 'C-THANNGOAI'`);

  nccA = (await duoi(UID.keToanA, `insert into kho_nha_cung_cap (ten, so_ngay_no) values ('NCC Úc', 30) returning id`)).rows[0].id;
  nccB = (await duoi(UID.keToanA, `insert into kho_nha_cung_cap (ten, so_ngay_no) values ('NCC Mỹ', 7) returning id`)).rows[0].id;
  ok('Kế toán thêm được nhà cung cấp', nccA && nccB);

  PN1 = await nhapHang({ ncc: nccA, ngayNhap: await ngay(-40), thue: 400000, chiPhi: 100000,
    dong: [{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: 10, don_gia_kg: 500000 }] });
  PN2 = await nhapHang({ ncc: nccA, ngayNhap: await ngay(-5),
    dong: [{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 10, so_kg: 5, don_gia_kg: 700000, han_dung: await ngay(20) }] });
  PN3 = await nhapHang({ ncc: nccB,
    dong: [{ mat_hang_id: MH['T-NACVAI'].id, so_goi: 2, so_kg: 8, don_gia_kg: 350000 }] });
  TD = await nhapHang({ loai: 'ton_dau', vt: viTri.quay,
    dong: [{ mat_hang_id: MH['C-NACVAI'].id, so_goi: 4, so_kg: 2, don_gia_kg: 400000 }] });
  ok('Có ba phiếu mua và một phiếu tồn đầu', PN1 && PN2 && PN3 && TD);
});

// ===========================================================================
await nhom('2 · CÔNG NỢ BAN ĐẦU, QUÁ HẠN, AI THẤY', async () => {
  const { rows } = await db.query(`select * from kho_v_cong_no_phieu`);
  ok('Chỉ phiếu MUA đã duyệt vào công nợ (không có tồn đầu)', rows.length === 3 && !rows.some(r => r.id === TD.id));
  const c1 = await congNo(PN1.id);
  ok('PN1: phải trả = tiền hàng + thuế + chi phí = 5.500.000đ', n(c1.phai_tra) === 5500000 && n(c1.con_no) === 5500000, JSON.stringify(c1));
  ok('PN1 nhập 40 ngày trước, nợ 30 ngày → quá hạn 10 ngày', c1.qua_han === true && c1.so_ngay_qua_han === 10, `${c1.qua_han} ${c1.so_ngay_qua_han}`);
  const c2 = await congNo(PN2.id);
  ok('PN2 chưa đến hạn', c2.qua_han === false && c2.so_ngay_qua_han === 0);

  const { rows: ncc } = await db.query(`select * from kho_v_cong_no_ncc order by ten_nha_cung_cap`);
  const a = ncc.find(x => x.nha_cung_cap_id === nccA);
  ok('NCC Úc: còn nợ 9.000.000đ, quá hạn 5.500.000đ',
     n(a.con_no) === 9000000 && n(a.no_qua_han) === 5500000 && a.so_phieu_chua_doi_chieu === 2, JSON.stringify(a));

  const dem = async (uid, bang) => (await duoi(uid, `select count(*)::int as n from ${bang}`)).rows?.[0]?.n;
  ok('NV quầy KHÔNG thấy công nợ', await dem(UID.nvQuayA, 'kho_v_cong_no_phieu') === 0);
  ok('Kế toán thấy công nợ', await dem(UID.keToanA, 'kho_v_cong_no_phieu') === 3);
  ok('Thủ kho chi nhánh khác KHÔNG thấy', await dem(UID.thuKhoB, 'kho_v_cong_no_ncc') === 0);
});

// ===========================================================================
await nhom('3 · ĐỐI CHIẾU HÓA ĐƠN', async () => {
  const goi = (uid, id, so, ngayHd, tien, han = null) =>
    duoi(uid, `select kho_doi_chieu_hoa_don($1, $2, $3::date, $4, $5::date, null) as cau`, [id, so, ngayHd, tien, han]);

  const tk = await goi(UID.thuKhoA, PN1.id, 'HD-01', null, 5450000);
  ok('Thủ kho KHÔNG đối chiếu được (việc của kế toán)', tk.loi !== null);
  const khongSo = await goi(UID.keToanA, PN1.id, ' ', null, 5450000);
  ok('Thiếu số hóa đơn bị từ chối', khongSo.loi !== null && /số hóa đơn/.test(khongSo.loi));
  const am = await goi(UID.keToanA, PN1.id, 'HD-01', null, -1);
  ok('Tiền hóa đơn âm bị từ chối', am.loi !== null);
  const td = await goi(UID.keToanA, TD.id, 'HD-X', null, 1);
  ok('Phiếu tồn đầu không đối chiếu được', td.loi !== null && /phiếu nhập mua đã duyệt/.test(td.loi));

  const kt = await goi(UID.keToanA, PN1.id, 'HD-01', await ngay(-38), 5450000);
  ok('Kế toán đối chiếu: báo lệch −50.000đ', kt.loi === null && /LỆCH −50\.000 đ/.test(kt.rows?.[0]?.cau), kt.loi ?? kt.rows?.[0]?.cau);
  const c1 = await congNo(PN1.id);
  ok('Phải trả theo hóa đơn: 5.450.000đ', n(c1.phai_tra) === 5450000 && c1.da_doi_chieu && c1.so_hoa_don === 'HD-01');
  ok('Hạn thanh toán tính lại theo ngày hóa đơn (+30 → quá hạn 8 ngày)', c1.so_ngay_qua_han === 8, `${c1.so_ngay_qua_han}`);

  const khop = await goi(UID.keToanA, PN3.id, 'US-77', homNay, 2800000);
  ok('Hóa đơn khớp phiếu → báo "khớp"', /khớp phiếu/.test(khop.rows?.[0]?.cau ?? ''), khop.loi ?? '');
});

// ===========================================================================
let tt1;
await nhom('4 · THANH TOÁN: TỰ CHIA THEO HẠN, CHỌN PHIẾU, CHẶN TRẢ VƯỢT', async () => {
  const tk = await traTien(UID.thuKhoA, { ncc: nccA, soTien: 1000000 });
  ok('Thủ kho KHÔNG ghi thanh toán được', tk.loi !== null);
  const khongHinhThuc = await traTien(UID.keToanA, { ncc: nccA, soTien: 1000000, hinhThuc: null });
  ok('Thanh toán phải chọn hình thức', khongHinhThuc.loi !== null && /hình thức/.test(khongHinhThuc.loi));

  const gui = maGui();
  const t = await traTien(UID.keToanA, { ncc: nccA, soTien: 6000000, maGui: gui });
  ok('Kế toán trả 6.000.000đ không chọn phiếu', t.loi === null && /^TT-\d{4}-0001$/.test(t.rows?.[0]?.so_phieu), t.loi ?? '');
  tt1 = t.rows?.[0]?.thanh_toan_id;
  const lai = await traTien(UID.keToanA, { ncc: nccA, soTien: 6000000, maGui: gui });
  ok('Bấm lại cùng ma_gui → cùng khoản, không trả hai lần', lai.rows?.[0]?.thanh_toan_id === tt1 && lai.rows[0].da_co);
  const c1 = await congNo(PN1.id), c2 = await congNo(PN2.id);
  ok('Phiếu đến hạn trước (PN1) được trả đủ 5.450.000đ', n(c1.da_tra) === 5450000 && n(c1.con_no) === 0 && c1.qua_han === false);
  ok('Phần còn lại 550.000đ vào PN2', n(c2.da_tra) === 550000 && n(c2.con_no) === 2950000);

  const vuot = await traTien(UID.keToanA, { ncc: nccA, soTien: 3000000 });
  ok('Trả vượt số còn nợ bị chặn, nêu số còn nợ', vuot.loi !== null && /2\.950\.000 đ/.test(vuot.loi), vuot.loi ?? '');

  const saiTong = await traTien(UID.keToanA, { ncc: nccA, soTien: 500000, phanBo: [{ phieu_nhap_id: PN2.id, so_tien: 400000 }] });
  ok('Tổng phân bổ khác số tiền bị chặn', saiTong.loi !== null && /Tổng phân bổ/.test(saiTong.loi));
  const khacNcc = await traTien(UID.keToanA, { ncc: nccA, soTien: 100000, phanBo: [{ phieu_nhap_id: PN3.id, so_tien: 100000 }] });
  ok('Chọn phiếu của nhà cung cấp khác bị chặn', khacNcc.loi !== null && /nhà cung cấp này/.test(khacNcc.loi));
  const quaPhieu = await traTien(UID.keToanA, { ncc: nccA, soTien: 3000000, phanBo: [{ phieu_nhap_id: PN2.id, so_tien: 3000000 }] });
  ok('Trả một phiếu quá số nó còn nợ bị chặn', quaPhieu.loi !== null && /chỉ còn nợ 2\.950\.000 đ/.test(quaPhieu.loi), quaPhieu.loi ?? '');
  const trung = await traTien(UID.keToanA, { ncc: nccA, soTien: 200000,
    phanBo: [{ phieu_nhap_id: PN2.id, so_tien: 100000 }, { phieu_nhap_id: PN2.id, so_tien: 100000 }] });
  ok('Chọn một phiếu hai lần bị chặn', trung.loi !== null && /hai lần/.test(trung.loi));

  const chon = await traTien(UID.keToanA, { ncc: nccA, soTien: 500000, hinhThuc: 'tien_mat',
    phanBo: [{ phieu_nhap_id: PN2.id, so_tien: 500000 }] });
  ok('Trả 500.000đ tiền mặt cho đúng PN2', chon.loi === null && n((await congNo(PN2.id)).con_no) === 2450000, chon.loi ?? '');

  const gt = await traTien(UID.keToanA, { ncc: nccA, loai: 'giam_tru', soTien: 100000, hinhThuc: null,
    ghiChu: 'Chiết khấu', phanBo: [{ phieu_nhap_id: PN2.id, so_tien: 100000 }] });
  ok('Giảm trừ (chiết khấu) 100.000đ', gt.loi === null && /^GT-/.test(gt.rows?.[0]?.so_phieu), gt.loi ?? '');
  const c2b = await congNo(PN2.id);
  ok('PN2: đã trả 1.050.000, giảm trừ 100.000, còn nợ 2.350.000', n(c2b.da_tra) === 1050000 && n(c2b.giam_tru) === 100000 && n(c2b.con_no) === 2350000);

  const anhLa = await traTien(UID.keToanA, { ncc: nccA, soTien: 1000, anh: [`${cnA.id}/nhap/${maGui()}/1.jpg`] });
  ok('Ảnh ủy nhiệm chi phải nằm trong thư mục thanh_toan', anhLa.loi !== null);
  const mai = await traTien(UID.keToanA, { ncc: nccA, soTien: 1000, ngay: await ngay(1) });
  ok('Ngày trả sau hôm nay bị chặn', mai.loi !== null);

  const truc = await duoi(UID.keToanA, `
    insert into kho_thanh_toan (chi_nhanh_id, so_phieu, ma_gui, nha_cung_cap_id, loai, hinh_thuc, so_tien)
    values ($1, 'X', $2, $3, 'thanh_toan', 'tien_mat', 1)`, [cnA.id, maGui(), nccA]);
  ok('Không ghi thẳng vào bảng thanh toán được (chỉ qua hàm)', truc.loi !== null);
});

// ===========================================================================
await nhom('5 · HỦY THANH TOÁN, CHẶN HỦY PHIẾU NHẬP ĐÃ TRẢ TIỀN', async () => {
  const huyPn = await duoi(UID.qlA, `select kho_huy_phieu_nhap($1, 'Nhập nhầm')`, [PN1.id]);
  ok('Phiếu nhập đã có tiền trả không hủy được',
     huyPn.loi !== null && /đã có thanh toán hoặc giảm trừ/.test(huyPn.loi), huyPn.loi ?? '');

  const rong = await duoi(UID.keToanA, `select kho_huy_thanh_toan($1, '')`, [tt1]);
  ok('Hủy thanh toán phải có lý do', rong.loi !== null);
  const nv = await duoi(UID.nvQuayA, `select kho_huy_thanh_toan($1, 'x')`, [tt1]);
  ok('NV quầy KHÔNG hủy được', nv.loi !== null);
  const h = await duoi(UID.keToanA, `select kho_huy_thanh_toan($1, 'Ghi nhầm số tiền') as cau`, [tt1]);
  ok('Kế toán hủy khoản trả 6.000.000đ', h.loi === null && /Đã hủy TT-/.test(h.rows?.[0]?.cau), h.loi ?? '');
  const c1 = await congNo(PN1.id);
  ok('PN1 trở lại còn nợ 5.450.000đ và quá hạn', n(c1.con_no) === 5450000 && c1.qua_han === true);
  const lai = await duoi(UID.keToanA, `select kho_huy_thanh_toan($1, 'x') as cau`, [tt1]);
  ok('Hủy lần hai chỉ báo "đã hủy"', lai.loi === null && /trước đó/.test(lai.rows?.[0]?.cau));

  // Trả lại cho đúng: PN1 đủ.
  const t = await traTien(UID.keToanA, { ncc: nccA, soTien: 5450000, phanBo: [{ phieu_nhap_id: PN1.id, so_tien: 5450000 }] });
  ok('Trả lại đúng 5.450.000đ cho PN1', t.loi === null && n((await congNo(PN1.id)).con_no) === 0, t.loi ?? '');
});

// ===========================================================================
await nhom('6 · TRẢ HÀNG NHÀ CUNG CẤP', async () => {
  const loNacVai = PN3.lo[0];
  const tk = await traHang(UID.thuKhoA, { phieu: PN3.id, dong: [{ lo_id: loNacVai.id, so_kg: 4, so_goi: 1 }] });
  ok('Thủ kho KHÔNG ghi trả hàng được (việc của kế toán / quản lý)', tk.loi !== null);
  const saiLo = await traHang(UID.keToanA, { phieu: PN3.id, dong: [{ lo_id: PN1.lo[0].id, so_kg: 1 }] });
  ok('Lô không thuộc phiếu nhập bị từ chối', saiLo.loi !== null && /không thuộc phiếu nhập/.test(saiLo.loi));
  const qua = await traHang(UID.keToanA, { phieu: PN3.id, dong: [{ lo_id: loNacVai.id, so_kg: 9 }] });
  ok('Trả quá số còn trong kho bị từ chối', qua.loi !== null && /chỉ còn 8/.test(qua.loi), qua.loi ?? '');
  const td = await traHang(UID.keToanA, { phieu: TD.id, viTri: viTri.quay, dong: [{ lo_id: TD.lo[0].id, so_kg: 1 }] });
  ok('Hàng tồn đầu (không có nhà cung cấp) không trả được', td.loi !== null);

  const gui = maGui();
  const t = await traHang(UID.keToanA, { phieu: PN3.id, maGui: gui, dong: [{ lo_id: loNacVai.id, so_kg: 4, so_goi: 1 }] });
  ok('Kế toán trả 4 kg / 1 tảng nạc vai', t.loi === null && /^XT-/.test(t.rows?.[0]?.so_phieu), t.loi ?? '');
  ok('Giảm trừ tự tính: 4 × 350.000 = 1.400.000đ', n(t.rows?.[0]?.so_tien_giam_tru) === 1400000, `${t.rows?.[0]?.so_tien_giam_tru}`);
  const lai = await traHang(UID.keToanA, { phieu: PN3.id, maGui: gui, dong: [{ lo_id: loNacVai.id, so_kg: 4, so_goi: 1 }] });
  ok('Bấm lại cùng ma_gui → cùng phiếu trả, không trừ hai lần', lai.rows?.[0]?.phieu_xuat_id === t.rows[0].phieu_xuat_id && lai.rows[0].da_co);
  const { rows: [ton] } = await db.query(`select so_kg, so_goi from kho_ton where lo_id = $1 and vi_tri_id = $2`, [loNacVai.id, viTri.kho]);
  ok('Tồn lô còn 4 kg / 1 tảng', n(ton.so_kg) === 4 && ton.so_goi === 1);
  const c3 = await congNo(PN3.id);
  ok('PN3 còn nợ 2.800.000 − 1.400.000 = 1.400.000đ', n(c3.giam_tru) === 1400000 && n(c3.con_no) === 1400000);
  const { rows: sc } = await db.query(`select loai, so_kg from kho_so_cai where chung_tu_id = $1`, [t.rows[0].phieu_xuat_id]);
  ok('Sổ kho ghi một dòng "tra_ncc" −4 kg', sc.length === 1 && sc[0].loai === 'tra_ncc' && n(sc[0].so_kg) === -4);

  // Có thuế: 1 kg thăn của PN1 → 500.000 + thuế 400.000 × 500.000 / 5.000.000 = 540.000.
  const t2 = await traHang(UID.keToanA, { phieu: PN1.id, dong: [{ lo_id: PN1.lo[0].id, so_kg: 1 }] });
  ok('Trả hàng phiếu có thuế: giảm trừ gồm phần thuế (540.000đ)', n(t2.rows?.[0]?.so_tien_giam_tru) === 540000, t2.loi ?? `${t2.rows?.[0]?.so_tien_giam_tru}`);
  const c1 = await congNo(PN1.id);
  ok('PN1 đã trả đủ mà trả hàng → nhà cung cấp nợ lại 540.000đ (còn nợ âm)', n(c1.con_no) === -540000, `${c1.con_no}`);

  const t3 = await traHang(UID.keToanA, { phieu: PN1.id, soTien: 0, dong: [{ lo_id: PN1.lo[0].id, so_kg: 0.5 }] });
  ok('Ghi giảm trừ 0đ (nhà cung cấp đổi hàng) → không sinh khoản giảm trừ',
     t3.loi === null && n(t3.rows[0].so_tien_giam_tru) === 0
       && (await db.query(`select count(*)::int as n from kho_thanh_toan where phieu_xuat_id = $1`, [t3.rows[0].phieu_xuat_id])).rows[0].n === 0);

  const { rows: [gt] } = await db.query(`select id from kho_thanh_toan where phieu_xuat_id = $1`, [t.rows[0].phieu_xuat_id]);
  const huyGt = await duoi(UID.keToanA, `select kho_huy_thanh_toan($1, 'thử')`, [gt.id]);
  ok('Giảm trừ do trả hàng không hủy riêng được', huyGt.loi !== null && /trả hàng/.test(huyGt.loi));
  const nvThay = await duoi(UID.nvQuayA, `select count(*)::int as n from kho_v_phieu_xuat where loai = 'tra_ncc'`);
  ok('NV quầy thấy ba phiếu trả hàng (không có tiền) trong danh sách phiếu', nvThay.rows?.[0]?.n === 3);
  await doiSoat('Sau trả hàng');
});

// ===========================================================================
await nhom('7 · PHA LÓC, BÁN, HỦY, KIỂM KÊ — ĐỂ CÓ SỐ CHO BÁO CÁO', async () => {
  // Pha 5 kg thăn của PN1 (còn 8,5 kg sau hai lần trả).
  const ph = await duoi(UID.thuKhoA, `
    select * from kho_luu_phien_pha(null, $1, $2, null, $3, null, $4::date, null, $5::jsonb, $6::jsonb)`,
    [cnA.id, maGui(), MH['T-THANNGOAI'].id, homNay,
     JSON.stringify([{ lo_id: PN1.lo[0].id, vi_tri_id: viTri.kho, so_kg: 5 }]),
     JSON.stringify([
       { mat_hang_id: MH['C-THANNGOAI'].id, so_kg: 3.5, so_goi: 7, xu_ly: 'nhap_kho', vi_tri_id: viTri.quay },
       { mat_hang_id: MH['P-MO'].id, so_kg: 1, xu_ly: 'bo' },
     ])]);
  ok('Lưu phiên pha', ph.loi === null, ph.loi ?? '');
  const c = await duoi(UID.thuKhoA, `select kho_chot_phien_pha($1, 1) as cau`, [ph.rows[0].phien_id]);
  ok('Chốt phiên: thu hồi 70%', c.loi === null && /70,00%/.test(c.rows?.[0]?.cau), c.loi ?? c.rows?.[0]?.cau);

  // Báo hủy 1 gói thăn cắt lát ở quầy, quản lý duyệt.
  const h = await duoi(UID.nvQuayA, `
    select * from kho_tao_phieu_xuat($1, $2, 'huy', $3, null, $4, null, $5::text[], $6::jsonb)`,
    [cnA.id, maGui(), viTri.quay, lyDo['huy:Rơi, dập, nhiễm bẩn'], [`${cnA.id}/huy/${maGui()}/1.jpg`],
     JSON.stringify([{ mat_hang_id: MH['C-THANNGOAI'].id, so_goi: 1 }])]);
  await duoi(UID.qlA, `select kho_duyet_phieu_huy($1)`, [h.rows[0].phieu_id]);
  ok('Báo hủy 1 gói, quản lý duyệt', h.loi === null, h.loi ?? '');

  // Kiểm kê quầy: thăn cắt lát còn 4 gói (6 − 4 = 2 gói bán), nạc vai đủ.
  const kk = (await duoi(UID.nvQuayA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_mat_hang', $3) as id`, [cnA.id, viTri.quay, maGui()])).rows[0].id;
  const { rows: dong } = await db.query(`select d.mat_hang_id, m.ma from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id where d.kiem_ke_id = $1`, [kk]);
  const pb = (await db.query(`select phien_ban from kho_kiem_ke where id = $1`, [kk])).rows[0].phien_ban;
  const dem = dong.map(d => ({ mat_hang_id: d.mat_hang_id, so_goi_dem: 4 }));
  await duoi(UID.nvQuayA, `select kho_luu_kiem_ke($1, $2, null, $3::jsonb)`, [kk, pb, JSON.stringify(dem)]);
  const pb2 = (await db.query(`select phien_ban from kho_kiem_ke where id = $1`, [kk])).rows[0].phien_ban;
  await duoi(UID.nvQuayA, `select kho_gui_kiem_ke($1, $2)`, [kk, pb2]);
  const d = await duoi(UID.qlA, `select kho_duyet_kiem_ke($1) as cau`, [kk]);
  ok('Kiểm kê quầy: ghi bán 2 gói', d.loi === null && /ghi bán 2 gói/.test(d.rows?.[0]?.cau), d.loi ?? d.rows?.[0]?.cau);

  // Kiểm kê kho theo lô: thăn ngoại nguyên tảng hụt 0,3 kg.
  const kk2 = (await duoi(UID.thuKhoA, `select kho_bat_dau_kiem_ke($1, $2, 'theo_lo', $3) as id`, [cnA.id, viTri.kho, maGui()])).rows[0].id;
  const { rows: dong2 } = await db.query(`
    select d.lo_id, d.mat_hang_id, t.so_kg, t.so_goi from kho_kiem_ke_dong d
    left join kho_ton t on t.lo_id = d.lo_id and t.vi_tri_id = $2 where d.kiem_ke_id = $1`, [kk2, viTri.kho]);
  const dem2 = dong2.map(x => ({ mat_hang_id: x.mat_hang_id, lo_id: x.lo_id, so_goi_dem: x.so_goi,
    so_kg_dem: x.lo_id === PN1.lo[0].id ? n(x.so_kg) - 0.3 : n(x.so_kg) }));
  const pb3 = (await db.query(`select phien_ban from kho_kiem_ke where id = $1`, [kk2])).rows[0].phien_ban;
  const l2 = await duoi(UID.thuKhoA, `select kho_luu_kiem_ke($1, $2, null, $3::jsonb)`, [kk2, pb3, JSON.stringify(dem2)]);
  const pb4 = (await db.query(`select phien_ban from kho_kiem_ke where id = $1`, [kk2])).rows[0].phien_ban;
  const g2 = await duoi(UID.thuKhoA, `select kho_gui_kiem_ke($1, $2)`, [kk2, pb4]);
  const d2 = await duoi(UID.qlA, `select kho_duyet_kiem_ke($1) as cau`, [kk2]);
  ok('Kiểm kê kho: hụt 0,3 kg thăn nguyên tảng', d2.loi === null, l2.loi ?? g2.loi ?? d2.loi ?? '');
  await doiSoat('Sau các biến động');
});

// ===========================================================================
await nhom('8 · BÁO CÁO XUẤT – NHẬP – TỒN', async () => {
  const tu = await ngay(-60);
  const r = await baoCao(UID.keToanA, 'kho_bao_cao_xuat_nhap_ton', tu, homNay);
  ok('Kế toán chạy được báo cáo', r.loi === null && r.rows.length > 0, r.loi ?? '');
  const theo = Object.fromEntries(r.rows.map(x => [x.ma, x]));

  let lech = [];
  for (const x of r.rows) {
    const tinh = n(x.dau_kg) + n(x.nhap_kg) + n(x.pha_ra_kg) - n(x.pha_vao_kg) - n(x.ban_kg)
      - n(x.xuat_bep_kg) - n(x.huy_kg) - n(x.tra_ncc_kg) + n(x.kiem_ke_kg);
    if (Math.abs(tinh - n(x.cuoi_kg)) > 0.0005) lech.push(`${x.ma}: ${tinh} ≠ ${x.cuoi_kg}`);
  }
  ok('Mọi mặt hàng: tồn cuối = đầu + nhập + pha ra − pha vào − bán − bếp − hủy − trả + kiểm kê', lech.length === 0, lech.join(' · '));

  const { rows: ton } = await db.query(`select mat_hang_id, sum(so_kg)::numeric as kg from kho_ton where chi_nhanh_id = $1 group by 1`, [cnA.id]);
  const lechTon = r.rows.filter(x => Math.abs(n(x.cuoi_kg) - n(ton.find(t => t.mat_hang_id === x.mat_hang_id)?.kg ?? 0)) > 0.0005);
  ok('Tồn cuối kỳ (đến hôm nay) = tồn kho thật', lechTon.length === 0, lechTon.map(x => x.ma).join(','));

  const tang = theo['T-THANNGOAI'];
  ok('Thăn nguyên tảng: nhập 10, trả NCC 1,5, pha 5, kiểm kê −0,3, còn 3,2 kg',
     n(tang.nhap_kg) === 10 && n(tang.tra_ncc_kg) === 1.5 && n(tang.pha_vao_kg) === 5
       && n(tang.kiem_ke_kg) === -0.3 && n(tang.cuoi_kg) === 3.2, JSON.stringify(tang));
  ok('Giá trị nhập = giá vốn nhập kho: tiền hàng + chi phí = 5.100.000đ (thuế không vào giá vốn)', n(tang.nhap_gia_tri) === 5100000, `${tang.nhap_gia_tri}`);
  const nac = theo['T-NACVAI'];
  ok('Nạc vai: nhập 8, trả NCC 4, còn 4 kg', n(nac.nhap_kg) === 8 && n(nac.tra_ncc_kg) === 4 && n(nac.cuoi_kg) === 4);
  const cat = theo['C-THANNGOAI'];
  ok('Thăn cắt lát: nhập 5 + pha ra 3,5; bán 1 kg; hủy 0,5 kg',
     n(cat.nhap_kg) === 5 && n(cat.pha_ra_kg) === 3.5 && n(cat.ban_kg) === 1 && n(cat.huy_kg) === 0.5, JSON.stringify(cat));

  // Tách kỳ: tồn cuối kỳ trước = tồn đầu kỳ sau.
  const truoc = await baoCao(UID.keToanA, 'kho_bao_cao_xuat_nhap_ton', tu, await ngay(-20));
  const sau = await baoCao(UID.keToanA, 'kho_bao_cao_xuat_nhap_ton', await ngay(-19), homNay);
  const t1 = truoc.rows.find(x => x.ma === 'T-THANNGOAI'), t2 = sau.rows.find(x => x.ma === 'T-THANNGOAI');
  ok('Tồn cuối kỳ trước = tồn đầu kỳ sau (kg và tiền)',
     t1 && t2 && n(t1.cuoi_kg) === n(t2.dau_kg) && n(t1.cuoi_gia_tri) === n(t2.dau_gia_tri) && n(t1.nhap_kg) === 10 && n(t2.nhap_kg) === 0,
     `${t1?.cuoi_kg}/${t2?.dau_kg}`);

  const nv = await baoCao(UID.nvQuayA, 'kho_bao_cao_xuat_nhap_ton', tu, homNay);
  ok('NV quầy chạy báo cáo: có kg, mọi cột tiền bằng 0 (không lộ giá vốn)',
     nv.loi === null && nv.rows.length > 0
       && nv.rows.every(x => Object.entries(x).filter(([k]) => k.endsWith('gia_tri')).every(([, v]) => n(v) === 0)),
     nv.loi ?? '');
  const tn = await baoCao(UID.thuNganA, 'kho_bao_cao_xuat_nhap_ton', tu, homNay);
  ok('Thu ngân (vai CRM) nhận báo cáo rỗng', tn.loi === null && tn.rows.length === 0);
});

// ===========================================================================
await nhom('9 · BÁO CÁO THU HỒI, HAO HỤT, BÁN', async () => {
  const tu = await ngay(-60);
  const th = await baoCao(UID.keToanA, 'kho_bao_cao_thu_hoi', tu, homNay);
  const dong = th.rows?.find(x => x.nha_cung_cap_id === nccA);
  ok('Thu hồi thăn ngoại của NCC Úc: 1 phiên, 5 kg vào, 3,5 kg thịt, 70%',
     dong && dong.so_phien === 1 && n(dong.kg_vao) === 5 && n(dong.kg_thit) === 3.5 && n(dong.ty_le_thu_hoi) === 70,
     th.loi ?? JSON.stringify(th.rows));
  ok('Giá vốn thịt ra/kg = giá vốn vào ÷ thu hồi', dong && Math.abs(n(dong.gia_von_thit_kg) - n(dong.gia_tri_vao) / 3.5) <= 1,
     `${dong?.gia_von_thit_kg} vs ${n(dong?.gia_tri_vao) / 3.5}`);

  const hh = await baoCao(UID.keToanA, 'kho_bao_cao_hao_hut', tu, homNay);
  const huy = hh.rows?.find(x => x.loai_dong === 'huy');
  ok('Hao hụt: hủy 1 gói thăn cắt lát, có lý do', huy && huy.so_goi === 1 && huy.ly_do === 'Rơi, dập, nhiễm bẩn', JSON.stringify(hh.rows));
  const thieu = hh.rows?.find(x => x.loai_dong === 'kiem_ke_thieu');
  ok('Hao hụt: kiểm kê kho thiếu 0,3 kg', thieu && n(thieu.so_kg) === 0.3);
  const tra = hh.rows?.filter(x => x.loai_dong === 'tra_ncc');
  ok('Hao hụt: có dòng trả nhà cung cấp', tra?.length === 2);
  ok('Bán ở quầy KHÔNG nằm trong hao hụt', !hh.rows?.some(x => x.loai_dong === 'ban'));

  const ban = await baoCao(UID.keToanA, 'kho_bao_cao_ban', tu, homNay);
  const b = ban.rows?.[0];
  ok('Bán: 2 gói thăn cắt lát, 1 kg, doanh thu ước tính 900.000đ',
     ban.rows?.length === 1 && b.so_goi === 2 && n(b.so_kg) === 1 && n(b.doanh_thu_uoc_tinh) === 900000, JSON.stringify(ban.rows));
  ok('Lãi gộp = doanh thu − giá vốn', n(b.lai_gop_uoc_tinh) === n(b.doanh_thu_uoc_tinh) - n(b.gia_von));
});

// ===========================================================================
await nhom('10 · AI THẤY GÌ', async () => {
  const dem = async (uid, bang) => (await duoi(uid, `select count(*)::int as n from ${bang}`)).rows?.[0]?.n;
  ok('NV quầy KHÔNG thấy khoản thanh toán', await dem(UID.nvQuayA, 'kho_thanh_toan') === 0);
  ok('NV quầy KHÔNG thấy phân bổ', await dem(UID.nvQuayA, 'kho_thanh_toan_phan_bo') === 0);
  ok('Kế toán thấy các khoản', await dem(UID.keToanA, 'kho_thanh_toan') > 0);
  ok('Thủ kho KHÔNG thấy khoản thanh toán (0031: thủ kho không thấy tiền)', await dem(UID.thuKhoA, 'kho_thanh_toan') === 0);
  ok('Thủ kho KHÔNG thấy công nợ', await dem(UID.thuKhoA, 'kho_v_cong_no_phieu') === 0);
  ok('Marketing KHÔNG thấy', await dem(UID.mktA, 'kho_thanh_toan') === 0);
  // Quét lại mọi bảng / view kho KHI ĐÃ CÓ tiền trả, giảm trừ, trả hàng.
  const { rows: cot } = await db.query(`
    select c.table_name, c.column_name
    from information_schema.columns c
    where c.table_schema = 'public' and c.table_name like 'kho\\_%'
      and c.data_type in ('bigint', 'numeric', 'integer')
      and c.column_name ~ '(gia_von|gia_tri|thanh_tien|don_gia|so_tien|tien_|chi_phi|phai_tra|da_tra|con_no|giam_tru|no_qua_han)'`);
  for (const [ten, uid] of [['NV quầy', UID.nvQuayA], ['Thủ kho', UID.thuKhoA]]) {
    const lo = [];
    for (const { table_name, column_name } of cot) {
      const r = await duoi(uid, `select count(*)::int as n from ${table_name} where ${column_name} is not null`);
      if (r.loi === null && r.rows[0].n > 0) lo.push(`${table_name}.${column_name}`);
    }
    ok(`${ten} không đọc được cột tiền nào khi đã có công nợ (${cot.length} cột được soát)`, lo.length === 0 && cot.length > 20, lo.join(', '));
  }
  const thNv = await baoCao(UID.nvQuayA, 'kho_bao_cao_thu_hoi', await ngay(-60), homNay);
  ok('NV quầy chạy báo cáo thu hồi: rỗng (không thấy phiên pha lóc)', thNv.loi === null && thNv.rows.length === 0);

  const sua = await duoi(UID.keToanA, `update kho_thanh_toan set so_tien = 1`);
  const { rows: [{ n: mot }] } = await db.query(`select count(*)::int as n from kho_thanh_toan where so_tien = 1`);
  ok('Kế toán KHÔNG sửa thẳng số tiền được', sua.loi !== null || mot === 0);
  await doiSoat('Cuối cùng');
});

process.exit(ketThuc('CÔNG NỢ VÀ BÁO CÁO'));
