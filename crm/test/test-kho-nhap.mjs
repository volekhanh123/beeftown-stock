/**
 * BEEFTOWN KHO — Kiểm thử danh mục, ô thông tin thêm, phiếu nhập, sổ kho
 * =====================================================================
 *
 *     node test/test-kho-nhap.mjs
 *
 * Phần lõi của giai đoạn 1. Những điều phải đúng tuyệt đối:
 *   · tồn CHỈ cộng khi quản lý duyệt phiếu nhập;
 *   · tổng giá vốn các lô khớp ĐÚNG TỪNG ĐỒNG với phiếu (tiền hàng + chi phí);
 *   · sổ kho không sửa được, tồn không sửa tay được, không bao giờ âm;
 *   · nhân viên quầy đọc được tồn nhưng không đọc được một con số giá nào.
 * Cuối mỗi nhóm: kho_doi_soat_ton() phải rỗng — tồn luôn bằng tổng sổ.
 */

import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ DANH MỤC VÀ NHẬP HÀNG');
const { db, cnA, cnB, nsId, duoi, phaiLoi } = await dungDatabase();

const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;

async function doiSoat(ten) {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok(`${ten}: tồn khớp sổ kho`, rows.length === 0, JSON.stringify(rows));
}

async function mh(ma) {
  return (await db.query(`select * from kho_mat_hang where ma = $1`, [ma])).rows[0];
}

/** Gọi kho_luu_phieu_nhap với tham số mặc định hợp lý. */
async function luuPhieu(uid, t) {
  return duoi(uid, `
    select * from kho_luu_phieu_nhap(
      p_id => $1, p_chi_nhanh_id => $2, p_ma_gui => $3, p_phien_ban => $4,
      p_loai => $5, p_nha_cung_cap_id => $6, p_vi_tri_id => $7, p_ngay_nhap => $8::date,
      p_so_hoa_don => $9, p_ngay_hoa_don => $10::date, p_han_thanh_toan => null,
      p_tien_thue => $11, p_chi_phi_khac => $12, p_ghi_chu => null, p_anh => $13::text[],
      p_truong_them => $14::jsonb, p_dong => $15::jsonb)`,
    [t.id ?? null, t.cn ?? cnA.id, t.maGui ?? maGui(), t.phienBan ?? null,
     t.loai ?? 'mua', t.ncc ?? null, t.viTri, t.ngay ?? homNay,
     t.soHoaDon ?? null, t.ngayHoaDon ?? null, t.thue ?? 0, t.chiPhi ?? 0,
     t.anh ?? [], JSON.stringify(t.truongThem ?? {}), JSON.stringify(t.dong ?? [])]);
}

let viTri = {};   // loai → id, chi nhánh A
let ncc;

// ===========================================================================
await nhom('1 · BẮT ĐẦU DÙNG KHO', async () => {
  const tk = await duoi(UID.thuKhoA, `select kho_khoi_tao($1) as n`, [cnA.id]);
  ok('Thủ kho KHÔNG khởi tạo được kho (việc của quản lý)',
     tk.loi !== null && /không được khởi tạo/.test(tk.loi), tk.loi ?? '');

  const ql = await duoi(UID.qlA, `select kho_khoi_tao($1) as n`, [cnA.id]);
  ok('Quản lý khởi tạo được kho Q1', ql.loi === null && ql.rows[0].n > 0, ql.loi ?? '');

  const lai = await duoi(UID.qlA, `select kho_khoi_tao($1) as n`, [cnA.id]);
  ok('Gọi lại lần hai không tạo thêm gì', lai.rows?.[0]?.n === 0, `tạo thêm ${lai.rows?.[0]?.n}`);

  const qlB = await duoi(UID.qlB, `select kho_khoi_tao($1) as n`, [cnA.id]);
  ok('Quản lý Q7 KHÔNG khởi tạo được kho Q1', qlB.loi !== null);
  await duoi(UID.qlB, `select kho_khoi_tao($1) as n`, [cnB.id]);

  const { rows: vt } = await db.query(
    `select loai, id from kho_vi_tri where chi_nhanh_id = $1`, [cnA.id]);
  viTri = Object.fromEntries(vt.map(r => [r.loai, r.id]));
  ok('Có đủ ba vị trí: kho, quầy, chờ hủy', viTri.kho && viTri.quay && viTri.cho_huy);

  const { rows: [cd] } = await db.query(`select * from kho_cai_dat where chi_nhanh_id = $1`, [cnA.id]);
  ok('Cài đặt mặc định: mã vạch 2+5+5+1, giá vốn theo giá trị, số bán theo kiểm kê',
     cd.mau_ma_vach === '2XCCCCCWWWWWK' && cd.phuong_phap_gia_von === 'gia_tri'
       && cd.nguon_so_ban === 'kiem_ke' && cd.vi_tri_nhan_hang_id === viTri.kho);

  const { rows: [{ n: soLyDo }] } = await db.query(`select count(*)::int as n from kho_ly_do`);
  ok('Có lý do hủy / xuất bếp mặc định', soLyDo >= 10, `${soLyDo}`);

  const choHuy = await duoi(UID.qlA,
    `insert into kho_vi_tri (chi_nhanh_id, ten, loai) values ($1, 'Chờ hủy 2', 'cho_huy')`, [cnA.id]);
  ok('Không tự tạo thêm được vị trí chờ hủy', choHuy.loi !== null);

  const doiLoai = await duoi(UID.qlA, `update kho_vi_tri set loai = 'kho' where id = $1`, [viTri.cho_huy]);
  ok('Không đổi được loại của vị trí chờ hủy', doiLoai.loi !== null && /chờ hủy/.test(doiLoai.loi), doiLoai.loi ?? '');

  const tat = await duoi(UID.qlA, `update kho_vi_tri set dang_dung = false where id = $1`, [viTri.cho_huy]);
  ok('Không tắt được vị trí chờ hủy', tat.loi !== null);

  const them = await duoi(UID.qlA,
    `insert into kho_vi_tri (chi_nhanh_id, ten, loai, thu_tu) values ($1, 'Tủ mát 2', 'kho', 3) returning id`, [cnA.id]);
  ok('Quản lý thêm được một kho mới', them.loi === null, them.loi ?? '');

  const tkThem = await duoi(UID.thuKhoA,
    `insert into kho_vi_tri (chi_nhanh_id, ten, loai) values ($1, 'Tủ 3', 'kho')`, [cnA.id]);
  ok('Thủ kho KHÔNG thêm được vị trí', tkThem.loi !== null);

  const sai = await duoi(UID.qlA,
    `select kho_luu_cai_dat($1, null, '2XCCCCCWWWWW', 3, 1)`, [cnA.id]);
  ok('Mẫu mã vạch sai (12 ký tự) bị từ chối', sai.loi !== null);

  const goc = await duoi(UID.qlA,
    `select kho_luu_cai_dat_goc($1, 'khoi_luong', true, false, 'kiem_ke', true)`, [cnA.id]);
  ok('Quản lý KHÔNG đổi được cách tính giá vốn (chỉ chủ)',
     goc.loi !== null && /Chỉ chủ nhà hàng/.test(goc.loi), goc.loi ?? '');
});

// ===========================================================================
await nhom('2 · DANH MỤC MẶT HÀNG', async () => {
  const tk = await duoi(UID.thuKhoA, `select kho_tao_danh_muc_mau() as n`);
  ok('Thủ kho KHÔNG tạo được danh mục mẫu', tk.loi !== null);

  const mau = await duoi(UID.qlA, `select kho_tao_danh_muc_mau() as n`);
  ok('Quản lý tạo danh mục mẫu (19 mặt hàng, không có giá bán)',
     mau.rows?.[0]?.n === 19, mau.loi ?? `${mau.rows?.[0]?.n}`);
  const { rows: [{ n: coGia }] } = await db.query(
    `select count(*)::int as n from kho_mat_hang where gia_ban_kg is not null`);
  ok('Danh mục mẫu không tự đặt giá bán', coGia === 0);

  const lan2 = await duoi(UID.qlA, `select kho_tao_danh_muc_mau() as n`);
  ok('Danh mục mẫu chỉ chạy khi danh mục rỗng', lan2.loi !== null && /đã có mặt hàng/.test(lan2.loi));

  const moi = await duoi(UID.qlA, `
    insert into kho_mat_hang (ma, ten, loai, ma_can, gia_ban_kg, han_dung_ngay)
    values ('  c-lagu ', 'Bắp bò cắt lát', 'phan_cat', '00012', 650000, 3) returning ma, ma_can`);
  ok('Mã được chuẩn hóa viết hoa, mã cân bỏ số 0 đầu',
     moi.rows?.[0]?.ma === 'C-LAGU' && moi.rows?.[0]?.ma_can === '12', moi.loi ?? JSON.stringify(moi.rows));

  const trung = await duoi(UID.qlA, `
    insert into kho_mat_hang (ma, ten, loai) values ('c-lagu', 'Trùng mã', 'phan_cat')`);
  ok('Trùng mã mặt hàng bị từ chối', trung.loi !== null);

  const trungCan = await duoi(UID.qlA, `
    insert into kho_mat_hang (ma, ten, loai, ma_can) values ('C-KHAC', 'Trùng mã cân', 'phan_cat', '12')`);
  ok('Hai mặt hàng đang dùng không trùng mã cân được', trungCan.loi !== null);

  const tkThem = await duoi(UID.thuKhoA, `
    insert into kho_mat_hang (ma, ten, loai) values ('X-1', 'Thủ kho thêm', 'phan_cat')`);
  ok('Thủ kho KHÔNG thêm được mặt hàng', tkThem.loi !== null);

  const nv = await duoi(UID.nvQuayA, `select count(*)::int as n from kho_mat_hang`);
  ok('NV quầy đọc được danh mục', nv.rows?.[0]?.n === 20);

  await db.query(`insert into kho_mat_hang_gia (mat_hang_id, gia_tri_thu_hoi_kg)
                  select id, 80000 from kho_mat_hang where ma = 'P-VUN'`);
  const nvGia = await duoi(UID.nvQuayA, `select count(*)::int as n from kho_mat_hang_gia`);
  ok('NV quầy KHÔNG đọc được giá trị thu hồi phụ phẩm', nvGia.rows?.[0]?.n === 0);
  const tkGia = await duoi(UID.thuKhoA, `select count(*)::int as n from kho_mat_hang_gia`);
  ok('Thủ kho đọc được giá trị thu hồi phụ phẩm', tkGia.rows?.[0]?.n === 1);

  const ct = await duoi(UID.qlA, `
    insert into kho_cong_thuc_pha (mat_hang_vao_id, ten)
    select id, 'Thăn ngoại → cắt lát' from kho_mat_hang where ma = 'P-MO'`);
  ok('Phụ phẩm không làm đầu vào công thức pha lóc được', ct.loi !== null && /tảng hoặc phần cắt/.test(ct.loi), ct.loi ?? '');
});

// ===========================================================================
await nhom('3 · Ô THÔNG TIN THÊM', async () => {
  const ql = await duoi(UID.qlA, `
    insert into kho_truong_them (doi_tuong, khoa, nhan, kieu) values ('mat_hang', 'grade', 'Grade', 'chu')`);
  ok('Quản lý KHÔNG tạo được ô thông tin (chỉ chủ)', ql.loi !== null);

  const tao = await duoi(UID.chu, `
    insert into kho_truong_them (doi_tuong, khoa, nhan, kieu, lua_chon, bat_buoc) values
      ('mat_hang', 'xuat_xu', 'Xuất xứ', 'chon', array['Úc','Mỹ','Nhật'], true),
      ('lo_hang', 'nhiet_do', 'Nhiệt độ khi nhận (°C)', 'so', '{}', true),
      ('lo_hang', 'so_to_khai', 'Số tờ khai', 'chu', '{}', false),
      ('phieu_nhap', 'da_kiem_lanh', 'Xe lạnh đạt chuẩn', 'co_khong', '{}', false),
      ('nha_cung_cap', 'ngay_ky_hd', 'Ngày ký hợp đồng', 'ngay', '{}', false)`);
  ok('Chủ nhà hàng tạo được năm ô thông tin', tao.loi === null, tao.loi ?? '');

  const chonRong = await duoi(UID.chu, `
    insert into kho_truong_them (doi_tuong, khoa, nhan, kieu) values ('mat_hang', 'hang', 'Hạng', 'chon')`);
  ok('Ô "chọn" phải có ít nhất một lựa chọn', chonRong.loi !== null);

  const thieu = await duoi(UID.qlA, `
    insert into kho_mat_hang (ma, ten, loai) values ('C-MOI', 'Mặt hàng mới', 'phan_cat')`);
  ok('Mặt hàng mới thiếu ô bắt buộc "Xuất xứ" bị từ chối',
     thieu.loi !== null && /Chưa điền ô bắt buộc: Xuất xứ/.test(thieu.loi), thieu.loi ?? '');

  const dung = await duoi(UID.qlA, `
    insert into kho_mat_hang (ma, ten, loai, truong_them)
    values ('C-MOI', 'Mặt hàng mới', 'phan_cat', '{"xuat_xu": "Úc"}') returning truong_them`);
  ok('Có "Xuất xứ: Úc" thì lưu được', dung.loi === null, dung.loi ?? '');

  const saiChon = await duoi(UID.qlA, `
    update kho_mat_hang set truong_them = '{"xuat_xu": "Pháp"}' where ma = 'C-MOI'`);
  ok('Giá trị ngoài danh sách chọn bị từ chối', saiChon.loi !== null && /phải chọn một trong/.test(saiChon.loi));

  const khoaLa = await duoi(UID.qlA, `
    update kho_mat_hang set truong_them = '{"xuat_xu": "Úc", "bia": 1}' where ma = 'C-MOI'`);
  ok('Ô không có định nghĩa bị từ chối', khoaLa.loi !== null && /không tồn tại/.test(khoaLa.loi));

  // Mặt hàng tạo TRƯỚC khi có ô bắt buộc vẫn sửa tên được — chỉ khi đụng tới
  // ô thông tin thì mới phải điền đủ.
  const suaTen = await duoi(UID.qlA, `update kho_mat_hang set ten = 'Thịt vụn bò' where ma = 'P-VUN'`);
  ok('Mặt hàng cũ vẫn sửa tên được khi chưa điền ô bắt buộc mới', suaTen.loi === null, suaTen.loi ?? '');

  const doiKieu = await duoi(UID.chu, `update kho_truong_them set kieu = 'chu' where khoa = 'nhiet_do'`);
  ok('Không đổi được kiểu của ô đã tạo', doiKieu.loi !== null && /Không đổi được kiểu/.test(doiKieu.loi));

  const ngaySai = await duoi(UID.qlA, `
    insert into kho_nha_cung_cap (ten, truong_them) values ('NCC ngày sai', '{"ngay_ky_hd": "2026-02-30"}')`);
  ok('Ngày không có thật (30/2) bị từ chối', ngaySai.loi !== null && /không phải một ngày có thật/.test(ngaySai.loi), ngaySai.loi ?? '');

  const soChuoi = await db.query(
    `select kho_chuan_hoa_truong_them('lo_hang', '{"nhiet_do": "2"}', false) as v`).catch(e => ({ loi: e.message }));
  ok('Ô số không nhận chuỗi "2"', soChuoi.loi && /phải là số/.test(soChuoi.loi));

  const chuan = await db.query(
    `select kho_chuan_hoa_truong_them('lo_hang', '{"nhiet_do": 2.5, "so_to_khai": "  TK123  "}', true) as v`);
  ok('Chữ được cắt khoảng trắng, số giữ nguyên', chuan.rows[0].v.so_to_khai === 'TK123' && chuan.rows[0].v.nhiet_do === 2.5);

  const tao2 = await duoi(UID.chu, `
    insert into kho_nha_cung_cap (ten, so_ngay_no, ma_so_thue) values ('Công ty Thịt Nhập Khẩu ABC', 30, '0312345678') returning id`);
  ok('Chủ nhà hàng thêm được nhà cung cấp', tao2.loi === null, tao2.loi ?? '');
  ncc = tao2.rows?.[0]?.id;

  const nvNcc = await duoi(UID.nvQuayA, `select count(*)::int as n from kho_nha_cung_cap`);
  ok('NV quầy KHÔNG đọc được nhà cung cấp', nvNcc.rows?.[0]?.n === 0);
});

// ===========================================================================
let pn1;   // phiếu nhập chính
await nhom('4 · PHIẾU NHẬP — LƯU NHÁP, GỬI DUYỆT', async () => {
  const thanNgoai = await mh('T-THANNGOAI');
  const nacVai = await mh('T-NACVAI');
  const gui = maGui();

  const dong = [
    { mat_hang_id: thanNgoai.id, so_goi: 2, so_kg: 12.5, don_gia_kg: 480000,
      so_lo_ncc: 'AU-7781', han_dung: '2026-12-31', truong_them: { so_to_khai: 'TK-001' } },
    { mat_hang_id: nacVai.id, so_goi: 1, so_kg: 8.2, don_gia_kg: 350000,
      truong_them: {} },
  ];

  const nv = await luuPhieu(UID.nvQuayA, { viTri: viTri.kho, ncc, dong, maGui: gui });
  ok('NV quầy KHÔNG lập được phiếu nhập', nv.loi !== null);

  const tao = await luuPhieu(UID.thuKhoA, { viTri: viTri.kho, ncc, dong, maGui: gui, chiPhi: 150000, thue: 100000 });
  ok('Thủ kho lưu nháp được phiếu nhập', tao.loi === null && tao.rows[0].da_co === false, tao.loi ?? '');
  pn1 = tao.rows?.[0];

  const lai = await luuPhieu(UID.thuKhoA, { viTri: viTri.kho, ncc, dong, maGui: gui });
  ok('Bấm lưu lần hai với cùng ma_gui → cùng một phiếu, không tạo trùng',
     lai.rows?.[0]?.phieu_id === pn1.phieu_id && lai.rows?.[0]?.da_co === true);

  const { rows: [pn] } = await db.query(`select * from kho_phieu_nhap where id = $1`, [pn1.phieu_id]);
  ok('Số phiếu dạng PN-YYMM-0001', /^PN-\d{4}-0001$/.test(pn.so_phieu), pn.so_phieu);

  const { rows: dongs } = await db.query(
    `select *, han_dung::text as han, ($2::date + 30)::text as mong
     from kho_phieu_nhap_dong where phieu_nhap_id = $1 order by thu_tu`, [pn1.phieu_id, homNay]);
  ok('Dòng không ghi hạn dùng lấy ngày nhập + hạn mặc định (30 ngày)',
     dongs[1].han === dongs[1].mong, `${dongs[1].han} ≠ ${dongs[1].mong}`);
  ok('Thành tiền dòng = kg × đơn giá', Number(dongs[0].thanh_tien) === 6000000 && Number(dongs[1].thanh_tien) === 2870000);

  const { rows: [{ n: ton0 }] } = await db.query(`select count(*)::int as n from kho_ton`);
  ok('Lưu nháp KHÔNG chạm tồn kho', ton0 === 0);

  const cu = await luuPhieu(UID.thuKhoA, { id: pn1.phieu_id, phienBan: 99, viTri: viTri.kho, ncc, dong });
  ok('Lưu đè với phiên bản cũ bị từ chối', cu.loi !== null && /sửa ở máy khác/.test(cu.loi), cu.loi ?? '');

  const guiThieu = await duoi(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2) as cau`, [pn1.phieu_id, pn1.phien_ban_moi]);
  ok('Gửi duyệt khi dòng hàng thiếu ô bắt buộc "Nhiệt độ" bị chặn',
     guiThieu.loi !== null && /Nhiệt độ khi nhận/.test(guiThieu.loi), guiThieu.loi ?? '');

  dong[0].truong_them.nhiet_do = 2.1;
  dong[1].truong_them.nhiet_do = 3;
  const sua = await luuPhieu(UID.thuKhoA, {
    id: pn1.phieu_id, phienBan: pn1.phien_ban_moi, viTri: viTri.kho, ncc, dong,
    chiPhi: 150000, thue: 100000, soHoaDon: 'HD-555', truongThem: { da_kiem_lanh: true } });
  ok('Sửa nháp đúng phiên bản thì được', sua.loi === null, sua.loi ?? '');
  pn1 = sua.rows?.[0];

  const guiDung = await duoi(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2) as cau`, [pn1.phieu_id, pn1.phien_ban_moi]);
  ok('Gửi duyệt được khi đủ ô bắt buộc', guiDung.loi === null && /chờ quản lý duyệt/.test(guiDung.rows?.[0]?.cau), guiDung.loi ?? '');

  const suaKhiCho = await luuPhieu(UID.thuKhoA, { id: pn1.phieu_id, phienBan: pn1.phien_ban_moi + 1, viTri: viTri.kho, ncc, dong });
  ok('Phiếu đang chờ duyệt không sửa được', suaKhiCho.loi !== null && /rút về/.test(suaKhiCho.loi));

  const { rows: [{ n: ton1 }] } = await db.query(`select count(*)::int as n from kho_ton`);
  ok('Gửi duyệt vẫn KHÔNG chạm tồn kho', ton1 === 0);
});

// ===========================================================================
await nhom('5 · DUYỆT PHIẾU NHẬP — LÔ, SỔ, GIÁ VỐN', async () => {
  const tk = await duoi(UID.thuKhoA, `select kho_duyet_phieu_nhap($1) as cau`, [pn1.phieu_id]);
  ok('Thủ kho KHÔNG tự duyệt được phiếu nhập', tk.loi !== null);

  const qlB = await duoi(UID.qlB, `select kho_duyet_phieu_nhap($1) as cau`, [pn1.phieu_id]);
  ok('Quản lý chi nhánh khác KHÔNG duyệt được', qlB.loi !== null);

  const ql = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1) as cau`, [pn1.phieu_id]);
  ok('Quản lý duyệt được', ql.loi === null && /2 lô hàng đã vào kho/.test(ql.rows?.[0]?.cau), ql.loi ?? '');

  const lai = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1) as cau`, [pn1.phieu_id]);
  ok('Duyệt lần hai chỉ báo "đã duyệt", không sinh lô mới',
     lai.loi === null && /trước đó/.test(lai.rows?.[0]?.cau));

  const { rows: lo } = await db.query(`
    select l.ma_lo, l.nguon, l.truong_them, g.gia_tri, g.gia_von_kg, g.so_kg_goc
    from kho_lo l join kho_lo_gia g on g.lo_id = l.id order by l.ma_lo`);
  ok('Sinh đúng 2 lô, mã lô dạng LYYMMDD-001', lo.length === 2 && /^L\d{6}-001$/.test(lo[0].ma_lo), lo.map(x => x.ma_lo).join(','));

  // Tiền hàng 6.000.000 + 2.870.000 = 8.870.000; chi phí 150.000 chia theo kg
  // (12,5 : 8,2); thuế KHÔNG vào giá vốn theo cài đặt mặc định.
  const tong = lo.reduce((s, x) => s + Number(x.gia_tri), 0);
  ok('Tổng giá vốn các lô = tiền hàng + chi phí khác, đúng từng đồng', tong === 8870000 + 150000, `${tong}`);
  ok('Chi phí chia theo kg: lô 12,5 kg nhận 90.580đ', Number(lo[0].gia_tri) === 6000000 + 90580, `${lo[0].gia_tri}`);
  ok('Giá vốn/kg tính từ tổng giá trị', Math.abs(Number(lo[0].gia_von_kg) - 487246.4) < 0.01, `${lo[0].gia_von_kg}`);
  ok('Ô thông tin của dòng được chép sang lô', lo[0].truong_them?.so_to_khai === 'TK-001');

  const { rows: ton } = await db.query(`select * from kho_ton order by so_kg desc`);
  ok('Tồn kho lạnh: 12,5 kg / 2 tảng và 8,2 kg / 1 tảng',
     ton.length === 2 && Number(ton[0].so_kg) === 12.5 && ton[0].so_goi === 2 && ton[0].vi_tri_id === viTri.kho);

  const { rows: [pn] } = await db.query(`select * from kho_phieu_nhap where id = $1`, [pn1.phieu_id]);
  ok('Phiếu đã duyệt có người duyệt và hạn thanh toán (ngày nhập + 30)',
     pn.trang_thai === 'da_duyet' && pn.nguoi_duyet === nsId[UID.qlA] && pn.han_thanh_toan !== null);

  const { rows: sc } = await db.query(`select * from kho_so_cai where chung_tu_id = $1`, [pn1.phieu_id]);
  ok('Sổ kho có 2 dòng nhập, ghi đúng người duyệt',
     sc.length === 2 && sc.every(x => x.loai === 'nhap' && x.nguoi_ghi === nsId[UID.qlA]));

  await doiSoat('Sau khi duyệt phiếu nhập');
});

// ===========================================================================
await nhom('6 · TỪ CHỐI, RÚT VỀ, HỦY', async () => {
  const bap = await mh('C-LAGU');
  const dong = [{ mat_hang_id: bap.id, so_goi: 10, so_kg: 3.25, don_gia_kg: 400000, truong_them: { nhiet_do: 2 } }];

  const p = (await luuPhieu(UID.thuKhoA, { viTri: viTri.quay, ncc, dong })).rows[0];
  await duoi(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);

  const khongLyDo = await duoi(UID.qlA, `select kho_tu_choi_phieu_nhap($1, '  ') as cau`, [p.phieu_id]);
  ok('Từ chối phải có lý do', khongLyDo.loi !== null && /lý do/.test(khongLyDo.loi));

  const tc = await duoi(UID.qlA, `select kho_tu_choi_phieu_nhap($1, 'Sai đơn giá, xem lại hóa đơn') as cau`, [p.phieu_id]);
  ok('Quản lý từ chối được, có lý do', tc.loi === null, tc.loi ?? '');

  const { rows: [sau] } = await db.query(`select trang_thai, ly_do, phien_ban from kho_phieu_nhap where id = $1`, [p.phieu_id]);
  ok('Phiếu bị từ chối lưu lý do', sau.trang_thai === 'tu_choi' && /đơn giá/.test(sau.ly_do));

  const sua = await luuPhieu(UID.thuKhoA, { id: p.phieu_id, phienBan: sau.phien_ban, viTri: viTri.quay, ncc, dong });
  const { rows: [sau2] } = await db.query(`select trang_thai from kho_phieu_nhap where id = $1`, [p.phieu_id]);
  ok('Sửa phiếu bị từ chối → trở lại nháp', sua.loi === null && sau2.trang_thai === 'nhap', sua.loi ?? '');

  const guiLai = await duoi(UID.thuKhoA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, sua.rows[0].phien_ban_moi]);
  const rut = await duoi(UID.thuKhoA, `select kho_rut_phieu_nhap($1) as cau`, [p.phieu_id]);
  ok('Rút phiếu đang chờ duyệt về nháp', guiLai.loi === null && rut.loi === null && /rút phiếu/.test(rut.rows?.[0]?.cau));

  const huyNhap = await duoi(UID.thuKhoA, `select kho_huy_phieu_nhap($1, null) as cau`, [p.phieu_id]);
  ok('Thủ kho hủy được phiếu nháp', huyNhap.loi === null && /hủy phiếu nháp/.test(huyNhap.rows?.[0]?.cau), huyNhap.loi ?? '');

  // Phiếu đã duyệt, lô chưa dùng → hủy được, tồn trả về 0 bằng dòng đảo ngược.
  const p2 = (await luuPhieu(UID.qlA, { viTri: viTri.quay, ncc, dong })).rows[0];
  await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p2.phieu_id, p2.phien_ban_moi]);
  await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p2.phieu_id]);

  const tkHuy = await duoi(UID.thuKhoA, `select kho_huy_phieu_nhap($1, 'nhập nhầm') as cau`, [p2.phieu_id]);
  ok('Thủ kho KHÔNG hủy được phiếu ĐÃ DUYỆT (cùng cửa với duyệt)', tkHuy.loi !== null);

  const khongLy = await duoi(UID.qlA, `select kho_huy_phieu_nhap($1, '') as cau`, [p2.phieu_id]);
  ok('Hủy phiếu đã duyệt phải có lý do', khongLy.loi !== null && /lý do/.test(khongLy.loi));

  const huy = await duoi(UID.qlA, `select kho_huy_phieu_nhap($1, 'Nhập nhầm, hàng chưa về') as cau`, [p2.phieu_id]);
  ok('Quản lý hủy được phiếu đã duyệt khi lô chưa dùng', huy.loi === null, huy.loi ?? '');

  const { rows: [{ kg }] } = await db.query(`
    select coalesce(sum(t.so_kg), 0)::numeric as kg from kho_ton t
    join kho_lo l on l.id = t.lo_id join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1`, [p2.phieu_id]);
  ok('Hủy xong, tồn của phiếu về 0', Number(kg) === 0);

  const { rows: dn } = await db.query(
    `select * from kho_so_cai where chung_tu_id = $1 and loai = 'dao_nguoc'`, [p2.phieu_id]);
  ok('Hủy bằng dòng đảo ngược, dòng nhập cũ vẫn nguyên', dn.length === 1 && dn[0].dao_cua !== null);

  const huyLai = await duoi(UID.qlA, `select kho_huy_phieu_nhap($1, 'lần hai') as cau`, [p2.phieu_id]);
  ok('Hủy lần hai chỉ báo "đã hủy"', huyLai.loi === null && /trước đó/.test(huyLai.rows?.[0]?.cau));

  // Lô đã được dùng → không hủy được.
  const lo = (await db.query(`
    select l.id from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1 order by d.thu_tu limit 1`, [pn1.phieu_id])).rows[0];
  await db.query(`
    insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
    select chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, 'kiem_ke', -0.1, 0, 'kiem_ke', gen_random_uuid()
    from kho_ton where lo_id = $1`, [lo.id]);
  const dungRoi = await duoi(UID.qlA, `select kho_huy_phieu_nhap($1, 'thử') as cau`, [pn1.phieu_id]);
  ok('Phiếu có lô đã dùng KHÔNG hủy được', dungRoi.loi !== null && /đã được dùng/.test(dungRoi.loi), dungRoi.loi ?? '');

  await doiSoat('Sau từ chối, rút, hủy');
});

// ===========================================================================
await nhom('7 · TỒN ĐẦU KỲ VÀ CÁC CHẶN NHẬP LIỆU', async () => {
  const cat = await mh('C-THANNGOAI');
  const dong = [{ mat_hang_id: cat.id, so_goi: 6, so_kg: 1.84, don_gia_kg: 700000, han_dung: homNay, truong_them: { nhiet_do: 1 } }];

  const coNcc = await luuPhieu(UID.qlA, { loai: 'ton_dau', ncc, viTri: viTri.quay, dong });
  ok('Tồn đầu kỳ không nhận nhà cung cấp', coNcc.loi !== null && /tồn đầu kỳ/.test(coNcc.loi));

  const td = await luuPhieu(UID.qlA, { loai: 'ton_dau', viTri: viTri.quay, dong });
  ok('Lập phiếu tồn đầu kỳ ở quầy', td.loi === null, td.loi ?? '');
  const { rows: [pTd] } = await db.query(`select so_phieu from kho_phieu_nhap where id = $1`, [td.rows?.[0]?.phieu_id]);
  ok('Số phiếu tồn đầu dạng TD-YYMM-0001', /^TD-\d{4}-0001$/.test(pTd?.so_phieu ?? ''), pTd?.so_phieu);

  await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [td.rows[0].phieu_id, td.rows[0].phien_ban_moi]);
  const duyet = await duoi(UID.chu, `select kho_duyet_phieu_nhap($1) as cau`, [td.rows[0].phieu_id]);
  ok('Chủ nhà hàng duyệt tồn đầu kỳ', duyet.loi === null, duyet.loi ?? '');
  const { rows: [lo] } = await db.query(`
    select l.nguon from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where d.phieu_nhap_id = $1`, [td.rows[0].phieu_id]);
  ok('Lô tồn đầu có nguồn "ton_dau"', lo?.nguon === 'ton_dau');

  const choHuy = await luuPhieu(UID.qlA, { ncc, viTri: viTri.cho_huy, dong });
  ok('Không nhập hàng vào vị trí chờ hủy', choHuy.loi !== null && /kho hoặc quầy/.test(choHuy.loi));

  const tuongLai = await luuPhieu(UID.qlA, { ncc, viTri: viTri.kho, dong, ngay: '2099-01-01' });
  ok('Không nhập hàng cho ngày tương lai', tuongLai.loi !== null && /sau hôm nay/.test(tuongLai.loi));

  const khongGoi = await luuPhieu(UID.qlA, { ncc, viTri: viTri.kho,
    dong: [{ mat_hang_id: cat.id, so_kg: 1, truong_them: {} }] });
  ok('Mặt hàng đếm theo gói phải có số gói', khongGoi.loi !== null && /chưa nhập số gói/.test(khongGoi.loi), khongGoi.loi ?? '');

  const kgAm = await luuPhieu(UID.qlA, { ncc, viTri: viTri.kho,
    dong: [{ mat_hang_id: cat.id, so_goi: 1, so_kg: -1, truong_them: {} }] });
  ok('Số kg phải lớn hơn 0', kgAm.loi !== null && /lớn hơn 0/.test(kgAm.loi));

  const khoaLa = await luuPhieu(UID.qlA, { ncc, viTri: viTri.kho,
    dong: [{ mat_hang_id: cat.id, so_goi: 1, so_kg: 1, gia_von: 1, truong_them: {} }] });
  ok('Dòng hàng có trường lạ bị từ chối', khoaLa.loi !== null && /không được nhận/.test(khoaLa.loi));

  const matHangSai = await luuPhieu(UID.qlA, { ncc, viTri: viTri.kho,
    dong: [{ mat_hang_id: 'khong-phai-uuid', so_goi: 1, so_kg: 1 }] });
  ok('Mặt hàng không hợp lệ báo lỗi tiếng Việt', matHangSai.loi !== null && /chưa chọn mặt hàng/.test(matHangSai.loi), matHangSai.loi ?? '');

  const anhLa = await luuPhieu(UID.qlA, { ncc, viTri: viTri.kho, dong, anh: [`${cnB.id}/nhap/x/1.jpg`] });
  ok('Ảnh của chi nhánh khác bị từ chối', anhLa.loi !== null && /không thuộc chi nhánh/.test(anhLa.loi));

  const viTriB = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnB.id])).rows[0].id;
  const tiem = await luuPhieu(UID.thuKhoA, { ncc, viTri: viTriB, dong });
  ok('Thủ kho Q1 không nhập được vào kho Q7 (tiêm id)', tiem.loi !== null);

  await doiSoat('Sau tồn đầu kỳ');
});

// ===========================================================================
await nhom('8 · SỔ KHO BẤT BIẾN, TỒN KHÔNG SỬA TAY, KHÔNG ÂM', async () => {
  const sua = await phaiLoi(`update kho_so_cai set so_kg = 999`);
  ok('Không sửa được sổ kho (kể cả superuser)', sua !== null && /bất biến/.test(sua), sua ?? '');

  const xoa = await phaiLoi(`delete from kho_so_cai`);
  ok('Không xóa được sổ kho', xoa !== null && /bất biến/.test(xoa));

  const tay = await phaiLoi(`update kho_ton set so_kg = so_kg + 5`);
  ok('Không sửa tay được tồn kho (kể cả superuser)', tay !== null && /chỉ thay đổi qua sổ kho/.test(tay), tay ?? '');

  const loSua = await phaiLoi(`update kho_lo set han_dung = han_dung + 30`);
  ok('Không sửa được hạn dùng của lô đã tạo', loSua !== null && /bất biến/.test(loSua));

  const giaSua = await phaiLoi(`update kho_lo_gia set gia_tri = 1`);
  ok('Không sửa được giá vốn của lô', giaSua !== null && /bất biến/.test(giaSua));

  const { rows: [t] } = await db.query(`select * from kho_ton where so_kg > 0 order by so_kg limit 1`);
  const am = await phaiLoi(`
    insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
    values ($1, $2, $3, $4, 'xuat_bep', $5, 0, 'phieu_xuat', gen_random_uuid())`,
    [t.chi_nhanh_id, t.lo_id, t.vi_tri_id, t.mat_hang_id, -(Number(t.so_kg) + 1)]);
  ok('Xuất quá tồn bị chặn bằng câu tiếng Việt', am !== null && /Không đủ tồn/.test(am), am ?? '');

  const viTriB = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnB.id])).rows[0].id;
  const chiNhanhKhac = await phaiLoi(`
    insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
    values ($1, $2, $3, $4, 'chuyen_den', 1, 0, 'phieu_xuat', gen_random_uuid())`,
    [cnB.id, t.lo_id, viTriB, t.mat_hang_id]);
  ok('Không ghi được lô Q1 vào vị trí Q7', chiNhanhKhac !== null && /không thuộc chi nhánh/.test(chiNhanhKhac));

  const sai = await phaiLoi(`
    insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
    values ($1, $2, $3, $4, 'nhap', -1, 0, 'phieu_nhap', gen_random_uuid())`,
    [t.chi_nhanh_id, t.lo_id, t.vi_tri_id, t.mat_hang_id]);
  ok('Dòng "nhập" mang số âm bị chặn (sai dấu)', sai !== null);

  const qlGhi = await duoi(UID.qlA, `
    insert into kho_so_cai (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi, chung_tu_loai, chung_tu_id)
    values ($1, $2, $3, $4, 'nhap', 100, 0, 'phieu_nhap', gen_random_uuid())`,
    [t.chi_nhanh_id, t.lo_id, t.vi_tri_id, t.mat_hang_id]);
  ok('Quản lý KHÔNG ghi thẳng được vào sổ kho qua API', qlGhi.loi !== null);

  // RLS chặn UPDATE một cách im lặng (0 dòng) — nên kiểm bằng kết quả.
  await duoi(UID.qlA, `update kho_ton set so_kg = 999`);
  const { rows: [{ n: bi999 }] } = await db.query(`select count(*)::int as n from kho_ton where so_kg = 999`);
  ok('Quản lý KHÔNG sửa thẳng được tồn qua API', bi999 === 0);

  await doiSoat('Sau các phép thử phá');
});

// ===========================================================================
await nhom('9 · AI THẤY GÌ', async () => {
  const nvTon = await duoi(UID.nvQuayA, `select count(*)::int as n from kho_v_ton`);
  ok('NV quầy xem được tồn kho', nvTon.rows?.[0]?.n > 0, nvTon.loi ?? '');

  const nvHan = await duoi(UID.nvQuayA, `select tinh_trang_han from kho_v_ton where han_dung = $1::date`, [homNay]);
  ok('Hàng hết hạn hôm nay được đánh dấu sắp hết', nvHan.rows?.[0]?.tinh_trang_han === 'sap_het',
     nvHan.loi ?? JSON.stringify(nvHan.rows));

  for (const [ten, sql] of [
    ['kho_lo_gia', 'select count(*)::int as n from kho_lo_gia'],
    ['kho_v_ton_gia', 'select count(*)::int as n from kho_v_ton_gia'],
    ['kho_phieu_nhap', 'select count(*)::int as n from kho_phieu_nhap'],
    ['kho_phieu_nhap_dong', 'select count(*)::int as n from kho_phieu_nhap_dong'],
    ['kho_v_phieu_nhap', 'select count(*)::int as n from kho_v_phieu_nhap'],
  ]) {
    const r = await duoi(UID.nvQuayA, sql);
    ok(`NV quầy không thấy dòng nào của ${ten}`, r.rows?.[0]?.n === 0, r.loi ?? `thấy ${r.rows?.[0]?.n}`);
  }

  // Quét mọi bảng và view kho: dưới vai NV quầy, không một cột SỐ nào có tên
  // mang nghĩa tiền được trả về có dữ liệu.
  const { rows: cot } = await db.query(`
    select c.table_name, c.column_name
    from information_schema.columns c
    where c.table_schema = 'public' and c.table_name like 'kho\\_%'
      and c.data_type in ('bigint', 'numeric', 'integer')
      and c.column_name ~ '(gia_von|gia_tri|thanh_tien|don_gia|so_tien|tien_|chi_phi|phai_tra|da_tra|con_no)'`);
  const lo = [];
  for (const { table_name, column_name } of cot) {
    const r = await duoi(UID.nvQuayA,
      `select count(*)::int as n from ${table_name} where ${column_name} is not null`);
    if (r.loi === null && r.rows[0].n > 0) lo.push(`${table_name}.${column_name}`);
  }
  ok(`NV quầy không đọc được cột tiền nào (${cot.length} cột được soát)`, lo.length === 0, lo.join(', '));

  const kt = await duoi(UID.keToanA, `select count(*)::int as n from kho_v_phieu_nhap`);
  ok('Kế toán đọc được phiếu nhập', kt.rows?.[0]?.n >= 3, kt.loi ?? '');

  const tkB = await duoi(UID.thuKhoB, `select count(*)::int as n from kho_v_ton`);
  ok('Thủ kho Q7 không thấy tồn của Q1', tkB.rows?.[0]?.n === 0);

  const chu = await duoi(UID.chu, `select count(distinct chi_nhanh_id)::int as n from kho_vi_tri`);
  ok('Chủ nhà hàng thấy vị trí kho của cả hai chi nhánh', chu.rows?.[0]?.n === 2);

  const tn = await duoi(UID.thuNganA, `select count(*)::int as n from kho_v_ton`);
  ok('Thu ngân (vai CRM) không thấy tồn kho', tn.rows?.[0]?.n === 0);
});

process.exit(ketThuc('NHẬP HÀNG'));
