/**
 * BEEFTOWN KHO — Kiểm thử WEB của GĐ8c: sửa nhanh mặt hàng, công thức dạng
 *                lưới, vị trí + lý do một form, trung tâm báo cáo (0041)
 * =========================================================================
 *
 *     node test/test-kho-sua-nhanh-web.mjs
 *
 *   · hàm thuần: đọc form sửa nhanh (ô trống = giữ, "-" = xóa, chỉ gửi ô đổi,
 *     "650.000" = "650000"), đọc form vị trí + lý do, lưới công thức (tổng chạy,
 *     màu, phiên bản, gợi ý thực tế), kỳ nhanh Quý / Năm, tóm tắt kỳ, doanh thu
 *     kỳ trọn tháng, link thẻ báo cáo;
 *   · cột web của báo cáo tháng / mua hàng / sổ thanh toán có trong hàm database;
 *   · vòng thật trên PGlite qua client giả: form trang → suaNhanhMatHang →
 *     kho_sua_nhanh_mat_hang (lưu, xung đột phiên bản, lỗi ô, tất cả hoặc không,
 *     thủ kho bị từ chối); docTheoThang / docMuaHang / docSoThanhToan đúng quyền,
 *     tiền null cho thủ kho;
 *   · mã nguồn trang: quyền, form POST không JavaScript, phien_ban.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID } from './kho-chung.mjs';
import {
  CHU_XOA, docFormSuaNhanh, giaTriO, loiTheoMon, laLoiPhienBan, locMonSuaNhanh, suaNhanhMatHang,
  docFormViTriLyDo, phienBanViTriLyDo, soThayDoi, tinhDinhMuc,
} from '../../web/src/lib/kho/sua-nhanh.ts';
import {
  docLuoiCongThuc, tongChu, tongTyLe, mauTong, cauTong, phienBanCongThuc, tinhGoiY, themDongTrong, chuTuCongThuc,
} from '../../web/src/lib/kho/cong-thuc.ts';
import {
  kyNhanh, kyBaoCao, tomTatXnt, doanhThuKy, linkTheBaoCao, namBaoCao, THE_BAO_CAO, tinhTong, taoCsv,
  dinhNghiaTheoThang, dinhNghiaMuaHang, DN_SO_THANH_TOAN, docTheoThang, docMuaHang, docSoThanhToan,
} from '../../web/src/lib/kho/bao-cao.ts';
import { boDau } from '../../web/src/lib/kho/chung.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — WEB SỬA NHANH · CÔNG THỨC LƯỚI · TRUNG TÂM BÁO CÁO (GĐ8c)');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TRANG = join(GOC, 'web/src/pages/noi-bo/kho');
const doc = p => readFileSync(p, 'utf8');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function taoForm(o) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) {
    if (Array.isArray(v)) for (const x of v) f.append(k, x); else f.set(k, v);
  }
  return f;
}

// ===========================================================================
await nhom('1 · FORM SỬA NHANH — HÀM THUẦN', async () => {
  const m = {
    id: id(1), ma: 'C-THAN', ten: 'Thăn', nhom: 'Nướng', loai: 'phan_cat', dem_goi: true, don_vi_goi: 'gói', thu_tu: 1,
    gia_ban_kg: 650000, han_dung_ngay: 5, ma_can: '101', quay_toi_thieu_goi: 3, quay_toi_da_goi: 10,
    ton_toi_thieu_kg: 1.5, kho_toi_thieu_kg: null, kho_toi_da_kg: 20, noi_de_sau_pha: null, dang_dung: true,
    phien_ban: '2026-09-26 03:00:00.123456+00',
  };
  ok('giaTriO: tiền có dấu chấm, kg dấu phẩy, trống là ""', giaTriO(m, 'gia_ban_kg') === '650.000'
    && giaTriO(m, 'ton_toi_thieu_kg') === '1,5' && giaTriO(m, 'kho_toi_thieu_kg') === '');
  ok('giaTriO: sau pha để ở trống = "kho", đang dùng = "co"', giaTriO(m, 'noi_de_sau_pha') === 'kho' && giaTriO(m, 'dang_dung') === 'co');

  // Form như trang in ra: mọi ô = giá trị cũ, rồi người dùng sửa vài ô.
  const oCu = Object.fromEntries(['gia_ban_kg', 'han_dung_ngay', 'ma_can', 'quay_toi_thieu_goi', 'quay_toi_da_goi',
    'ton_toi_thieu_kg', 'kho_toi_thieu_kg', 'kho_toi_da_kg', 'noi_de_sau_pha', 'dang_dung']
    .flatMap(k => [[`${k}_${m.id}`, giaTriO(m, k)], [`cu_${k}_${m.id}`, giaTriO(m, k)]]));
  const khongDoi = docFormSuaNhanh(taoForm({ id: [m.id], [`pb_${m.id}`]: m.phien_ban, ...oCu }));
  ok('Không đổi ô nào → không gửi dòng nào', khongDoi.dong.length === 0 && khongDoi.soDong === 1);
  const f = taoForm({
    id: [m.id, id(2), 'khong-phai-uuid'], [`pb_${m.id}`]: m.phien_ban, ...oCu,
    [`gia_ban_kg_${m.id}`]: '650000',          // cùng số, khác cách viết → không đổi
    [`han_dung_ngay_${m.id}`]: '',             // trống = giữ
    [`ma_can_${m.id}`]: CHU_XOA,               // "-" = xóa
    [`ton_toi_thieu_kg_${m.id}`]: '2.5',       // đổi, dấu chấm
    [`kho_toi_thieu_kg_${m.id}`]: CHU_XOA,     // xóa ô vốn trống → không gửi
    [`quay_toi_da_goi_${m.id}`]: 'mười',       // sai → gửi nguyên chữ, database báo đúng ô
    [`noi_de_sau_pha_${m.id}`]: 'quay',
    [`pb_${id(2)}`]: 'x', [`gia_ban_kg_${id(2)}`]: '', [`cu_gia_ban_kg_${id(2)}`]: '120.000',
  });
  const d = docFormSuaNhanh(f);
  const d1 = d.dong[0];
  ok('Chỉ gửi dòng có ô đổi (bỏ id lạ, bỏ dòng chỉ có ô trống)', d.dong.length === 1 && d1.id === m.id && d.soDong === 2,
    JSON.stringify(d.dong));
  ok('Dòng mang phiên bản lúc mở trang', d1.phien_ban === m.phien_ban);
  ok('Chỉ gửi ô đổi: mã cân xóa (null), kg 2.5, số gói sai giữ chữ, sau pha quầy',
    JSON.stringify(Object.keys(d1).sort()) === JSON.stringify(['id', 'ma_can', 'noi_de_sau_pha', 'phien_ban', 'quay_toi_da_goi', 'ton_toi_thieu_kg'])
    && d1.ma_can === null && d1.ton_toi_thieu_kg === 2.5 && d1.quay_toi_da_goi === 'mười' && d1.noi_de_sau_pha === 'quay',
    JSON.stringify(d1));
  ok('Giữ chữ đã gõ của mọi dòng để hiện lại khi lỗi', d.chuGo.get(m.id)?.quay_toi_da_goi === 'mười' && d.chuGo.has(id(2)));
  const gia = docFormSuaNhanh(taoForm({ id: [m.id], [`pb_${m.id}`]: 'p', [`gia_ban_kg_${m.id}`]: '700.000đ', [`cu_gia_ban_kg_${m.id}`]: '650.000' }));
  ok('Giá "700.000đ" gửi số 700000', gia.dong[0]?.gia_ban_kg === 700000, JSON.stringify(gia.dong));
  const maCan = docFormSuaNhanh(taoForm({ id: [m.id], [`pb_${m.id}`]: 'p', [`ma_can_${m.id}`]: '0101', [`cu_ma_can_${m.id}`]: '101' }));
  ok('Mã cân "0101" = "101" (bỏ số 0 đầu) → không đổi', maCan.dong.length === 0);

  const loi = [
    { dong: 1, id: m.id, ten: 'Thăn', truong: 'quay_toi_da_goi', cau: 'Thăn: số gói…' },
    { dong: 1, id: m.id, ten: 'Thăn', truong: null, cau: 'Thăn: vừa được người khác sửa lúc 10:00 26/09 — tải lại trang' },
    { dong: 3, id: null, ten: null, truong: null, cau: 'Dòng 3 không đúng dạng.' },
  ];
  const theo = loiTheoMon(loi);
  ok('Gom lỗi theo món: câu và ô sai', theo.get(m.id)?.cau.length === 2 && theo.get(m.id)?.o.has('quay_toi_da_goi') && theo.size === 1);
  ok('Nhận ra lỗi "người khác vừa sửa"', laLoiPhienBan(loi[1]) && !laLoiPhienBan(loi[0]));
  const ds = [m, { ...m, id: id(2), ten: 'Bắp bò', nhom: null, loai: 'tang', ma: 'T-BAP' }];
  ok('Lọc: tìm không dấu, theo loại, theo nhóm, "chưa có nhóm"',
    locMonSuaNhanh(ds, { tim: 'bap' }, boDau).length === 1 && locMonSuaNhanh(ds, { loai: 'tang' }, boDau)[0].id === id(2)
    && locMonSuaNhanh(ds, { nhom: 'Nướng' }, boDau).length === 1 && locMonSuaNhanh(ds, { nhom: '(chưa có)' }, boDau)[0].id === id(2)
    && locMonSuaNhanh(ds, { tim: '101' }, boDau).length === 2);
});

// ===========================================================================
await nhom('2 · VỊ TRÍ + LÝ DO MỘT FORM — HÀM THUẦN', async () => {
  const vt = [
    { id: id(11), chi_nhanh_id: id(9), ten: 'Kho lạnh', loai: 'kho', dang_dung: true, thu_tu: 1 },
    { id: id(12), chi_nhanh_id: id(9), ten: 'Hàng chờ hủy', loai: 'cho_huy', dang_dung: true, thu_tu: 9 },
  ];
  const ld = [
    { id: id(21), loai: 'huy', ten: 'Hết hạn', can_anh: true, dang_dung: true, thu_tu: 1 },
    { id: id(22), loai: 'xuat_bep', ten: 'Cơm nhân viên', can_anh: false, dang_dung: true, thu_tu: 1 },
  ];
  const nguyen = {
    [`vt_ten_${id(11)}`]: 'Kho lạnh', [`vt_loai_${id(11)}`]: 'kho', [`vt_thu_tu_${id(11)}`]: '1', [`vt_dang_dung_${id(11)}`]: 'co',
    [`vt_ten_${id(12)}`]: 'Hàng chờ hủy', [`vt_thu_tu_${id(12)}`]: '9',
    [`ld_ten_${id(21)}`]: 'Hết hạn', [`ld_thu_tu_${id(21)}`]: '1', [`ld_dang_dung_${id(21)}`]: 'co', [`ld_co_anh_${id(21)}`]: '1', [`ld_can_anh_${id(21)}`]: 'co',
    [`ld_ten_${id(22)}`]: 'Cơm nhân viên', [`ld_thu_tu_${id(22)}`]: '1', [`ld_dang_dung_${id(22)}`]: 'co',
    vt_moi_ten_0: '', vt_moi_loai_0: 'kho', ld_moi_ten_huy_0: '', ld_moi_can_anh_huy_0: 'co',
  };
  ok('Không đổi gì → không ghi gì', soThayDoi(docFormViTriLyDo(taoForm(nguyen), vt, ld)) === 0);
  const kh = docFormViTriLyDo(taoForm({
    ...nguyen,
    [`vt_ten_${id(11)}`]: 'Kho lạnh 1', [`vt_dang_dung_${id(11)}`]: 'khong',
    [`vt_ten_${id(12)}`]: 'Chờ hủy', [`vt_loai_${id(12)}`]: 'quay',           // hệ thống: bỏ qua loại
    [`ld_can_anh_${id(21)}`]: '',                                               // bỏ tích ảnh
    vt_moi_ten_0: 'Tủ mát 2', vt_moi_loai_0: 'quay', vt_moi_thu_tu_0: '3',
    ld_moi_ten_xuat_khac_1: 'Tặng khách',
  }), vt, ld);
  ok('Sửa vị trí: đổi tên + ngừng dùng', kh.viTriSua.find(v => v.id === id(11))?.dong.dang_dung === false
    && kh.viTriSua.find(v => v.id === id(11))?.dong.ten === 'Kho lạnh 1');
  ok('Vị trí hệ thống: đổi tên được, không đổi loại', JSON.stringify(kh.viTriSua.find(v => v.id === id(12))?.dong) === '{"ten":"Chờ hủy"}');
  ok('Bỏ tích "phải chụp ảnh" → can_anh false', kh.lyDoSua.length === 1 && kh.lyDoSua[0].dong.can_anh === false);
  ok('Thêm vị trí mới và lý do mới', kh.viTriMoi[0]?.ten === 'Tủ mát 2' && kh.viTriMoi[0].loai === 'quay' && kh.viTriMoi[0].thu_tu === 3
    && kh.lyDoMoi.length === 1 && kh.lyDoMoi[0].loai === 'xuat_khac' && kh.lyDoMoi[0].can_anh === false);
  const xoaTen = docFormViTriLyDo(taoForm({ ...nguyen, [`ld_ten_${id(22)}`]: '  ' }), vt, ld);
  ok('Xóa trắng tên dòng có sẵn → lỗi, nhắc chọn Ngừng dùng', xoaTen.loi.length === 1 && /Ngừng dùng/.test(xoaTen.loi[0]));
  const pb = phienBanViTriLyDo(vt, ld);
  ok('Phiên bản đổi khi có người sửa một chữ', pb !== phienBanViTriLyDo([{ ...vt[0], ten: 'Kho lạnh 1' }, vt[1]], ld)
    && pb === phienBanViTriLyDo([...vt].reverse(), ld));

  // Ô tích "Tính vào định mức bếp" (0044) — chỉ lý do Xuất bếp.
  const ldDm = [
    { id: id(21), loai: 'huy', ten: 'Hết hạn', can_anh: true, dang_dung: true, thu_tu: 1, tinh_dinh_muc: true },
    { id: id(22), loai: 'xuat_bep', ten: 'Cơm nhân viên', can_anh: false, dang_dung: true, thu_tu: 1, tinh_dinh_muc: false },
    { id: id(23), loai: 'xuat_bep', ten: 'Làm món ở bếp', can_anh: false, dang_dung: true, thu_tu: 2, tinh_dinh_muc: true },
  ];
  const nguyenDm = {
    ...nguyen,
    [`ld_co_dm_${id(22)}`]: '1',                                                 // không tích = không tính
    [`ld_ten_${id(23)}`]: 'Làm món ở bếp', [`ld_thu_tu_${id(23)}`]: '2', [`ld_dang_dung_${id(23)}`]: 'co',
    [`ld_co_dm_${id(23)}`]: '1', [`ld_tinh_dm_${id(23)}`]: 'co',
    ld_moi_ten_xuat_bep_0: '', ld_moi_co_dm_xuat_bep_0: '1', ld_moi_tinh_dm_xuat_bep_0: 'co',
  };
  ok('Định mức: không đổi ô tích → không ghi gì', soThayDoi(docFormViTriLyDo(taoForm(nguyenDm), vt, ldDm)) === 0);
  const dm = docFormViTriLyDo(taoForm({
    ...nguyenDm,
    [`ld_tinh_dm_${id(22)}`]: 'co',                                              // bật lại Cơm nhân viên
    [`ld_tinh_dm_${id(23)}`]: '',                                                // bỏ tích Làm món
  }), vt, ldDm);
  ok('Định mức: tích / bỏ tích → ghi đúng tinh_dinh_muc',
    dm.lyDoSua.length === 2
    && JSON.stringify(dm.lyDoSua.find(l => l.id === id(22))?.dong) === '{"tinh_dinh_muc":true}'
    && JSON.stringify(dm.lyDoSua.find(l => l.id === id(23))?.dong) === '{"tinh_dinh_muc":false}');
  const boOAn = { ...nguyenDm };
  delete boOAn[`ld_co_dm_${id(22)}`];
  const khongO = docFormViTriLyDo(taoForm(boOAn), vt, ldDm);
  ok('Định mức: form không có ô (thiếu ô ẩn) → không đổi cột', soThayDoi(khongO) === 0);
  const huyCoDm = docFormViTriLyDo(taoForm({ ...nguyenDm, [`ld_co_dm_${id(21)}`]: '1' }), vt, ldDm);
  ok('Định mức: lý do Hủy không có cột này dù form gửi ô ẩn', soThayDoi(huyCoDm) === 0);
  const moi = docFormViTriLyDo(taoForm({
    ...nguyenDm,
    ld_moi_ten_xuat_bep_0: 'Nếm thử món mới', ld_moi_tinh_dm_xuat_bep_0: '',
    ld_moi_ten_xuat_bep_1: 'Làm món đặt', ld_moi_co_dm_xuat_bep_1: '1', ld_moi_tinh_dm_xuat_bep_1: 'co',
    ld_moi_ten_huy_1: 'Rơi vỡ', ld_moi_can_anh_huy_1: 'co',
  }), vt, ldDm);
  const m0 = moi.lyDoMoi.find(l => l.ten === 'Nếm thử món mới');
  const m1 = moi.lyDoMoi.find(l => l.ten === 'Làm món đặt');
  const mh = moi.lyDoMoi.find(l => l.ten === 'Rơi vỡ');
  ok('Định mức: lý do Xuất bếp mới mang ô tích, lý do Hủy mới không',
    m0?.tinh_dinh_muc === false && m1?.tinh_dinh_muc === true && mh !== undefined && !('tinh_dinh_muc' in mh));
  ok('Định mức: thiếu cột (database cũ) coi như tính', tinhDinhMuc({}) && !tinhDinhMuc({ tinh_dinh_muc: false }));
  ok('Định mức: phiên bản đổi khi đổi ô tích',
    phienBanViTriLyDo(vt, ldDm) !== phienBanViTriLyDo(vt, ldDm.map(l => (l.id === id(22) ? { ...l, tinh_dinh_muc: true } : l))));
});

// ===========================================================================
await nhom('3 · CÔNG THỨC DẠNG LƯỚI — HÀM THUẦN', async () => {
  const f = taoForm({
    so_dong: '5',
    mh_0: id(1), tl_0: '72,5', xl_0: 'nhap_kho', tt_0: '1',
    mh_1: id(2), tl_1: '15', xl_1: 'bo', tt_1: '',
    mh_2: id(3), tl_2: '9', bo_2: 'co',
    mh_3: '', tl_3: '50',
    mh_4: id(1), tl_4: '3',
  });
  const l = docLuoiCongThuc(f);
  ok('Đọc lưới: bỏ dòng tích Bỏ / trống, báo phần ra trùng', l.dong.length === 2 && l.loi.length === 1 && /đã có ở dòng trên/.test(l.loi[0]),
    JSON.stringify(l));
  ok('Tỷ lệ "72,5" → 72.5, xử lý và thứ tự', l.dong[0].ty_le_du_kien === 72.5 && l.dong[0].xu_ly === 'nhap_kho' && l.dong[1].thu_tu === 2);
  ok('Giữ chữ đã gõ của cả 5 dòng', l.chu.length === 5 && l.chu[2].bo && l.chu[3].tl === '50');
  ok('Tỷ lệ > 100 → lỗi', docLuoiCongThuc(taoForm({ so_dong: '1', mh_0: id(1), tl_0: '120' })).loi.length === 1);
  ok('Tổng chạy từ chữ trên lưới (bỏ dòng Bỏ, dòng chưa chọn phần ra)', tongChu(l.chu) === 90.5, String(tongChu(l.chu)));
  ok('Màu: đỏ khi vượt 100, xanh 95–100, vàng dưới 95', mauTong(100.5) === 'do' && mauTong(100) === 'xanh'
    && mauTong(96.2) === 'xanh' && mauTong(90.5) === 'vang');
  ok('Câu tổng nói phần còn lại là hao hụt', /còn 9,5% coi là hao hụt/.test(cauTong(90.5)) && /vượt 100%/.test(cauTong(101))
    && /đủ 100%/.test(cauTong(100)));
  ok('tongTyLe làm tròn 2 số lẻ (0,1 + 0,2)', tongTyLe([{ ty_le_du_kien: 0.1 }, { ty_le_du_kien: 0.2 }]) === 0.3);
  const ct = { id: id(50), ten: 'Thăn', mat_hang_vao_id: id(9), ghi_chu: null, dang_dung: true,
    dong: [{ id: id(51), mat_hang_ra_id: id(1), ty_le_du_kien: 72.5, xu_ly: null, thu_tu: 2 },
      { id: id(52), mat_hang_ra_id: id(2), ty_le_du_kien: null, xu_ly: 'bo', thu_tu: 1 }] };
  ok('Phiên bản công thức đổi khi đổi một tỷ lệ', phienBanCongThuc(ct) !== phienBanCongThuc({ dong: [{ ...ct.dong[0], ty_le_du_kien: 70 }, ct.dong[1]] }));
  const chu = chuTuCongThuc(ct);
  ok('Lưới từ công thức: theo thứ tự, "72,5"', chu[0].mh === id(2) && chu[1].tl === '72,5' && themDongTrong(chu).length === 5);
  const g = tinhGoiY(
    [{ id: 'p1', tong_kg_vao: 10 }, { id: 'p2', tong_kg_vao: 30 }, { id: 'p3', tong_kg_vao: null }],
    [{ phien_pha_id: 'p1', mat_hang_id: 'A', so_kg: 7 }, { phien_pha_id: 'p2', mat_hang_id: 'A', so_kg: 22 },
      { phien_pha_id: 'p2', mat_hang_id: 'B', so_kg: 3 }, { phien_pha_id: 'p3', mat_hang_id: 'A', so_kg: 99 }],
  );
  ok('Gợi ý thực tế: cộng kg các phiên rồi chia (29 / 40 = 72,5%), bỏ phiên thiếu kg vào',
    g.soPhien === 2 && g.kgVao === 40 && g.tyLe.get('A') === 72.5 && g.tyLe.get('B') === 7.5, JSON.stringify([...g.tyLe]));
});

// ===========================================================================
await nhom('4 · TRUNG TÂM BÁO CÁO — HÀM THUẦN', async () => {
  const nhanh = Object.fromEntries(kyNhanh('2026-08-15').map(x => [x.ten, `${x.tu}..${x.den}`]));
  ok('Quý này (15/08) = 01/07 → hôm nay; Năm nay = 01/01 → hôm nay',
    nhanh['Quý này'] === '2026-07-01..2026-08-15' && nhanh['Năm nay'] === '2026-01-01..2026-08-15', JSON.stringify(nhanh));
  ok('Quý của tháng 12 bắt đầu 01/10', kyNhanh('2026-12-31').find(x => x.ten === 'Quý này')?.tu === '2026-10-01');
  ok('Mốc nhanh mới đọc lại đúng kỳ', kyNhanh('2026-03-31').every(x => {
    const k = kyBaoCao(new URLSearchParams({ tu: x.tu, den: x.den }), '2026-03-31');
    return k.tu === x.tu && k.den === x.den;
  }));
  ok('Năm báo cáo: sai / quá xa → năm nay', namBaoCao(new URLSearchParams('nam=2025'), '2026-09-26') === 2025
    && namBaoCao(new URLSearchParams('nam=1999'), '2026-09-26') === 2026 && namBaoCao(new URLSearchParams(''), '2026-09-26') === 2026);

  const tt = tomTatXnt([
    { nhap_kg: 10, nhap_gia_tri: 5000000, ban_kg: 2, ban_gia_tri: 1000000, xuat_bep_gia_tri: 300000, xuat_khac_gia_tri: 0,
      huy_kg: 0.5, huy_gia_tri: 200000, hao_hut_kg: 0.1, hao_hut_gia_tri: 50000, kiem_ke_kg: -0.2, kiem_ke_gia_tri: -100000,
      cuoi_kg: 7.2, cuoi_gia_tri: 3350000 },
    { nhap_kg: 0.1, nhap_gia_tri: 1, kiem_ke_kg: 0.05, kiem_ke_gia_tri: 20000, cuoi_kg: 0.2, cuoi_gia_tri: 2 },
  ]);
  ok('Tóm tắt: hao hụt = mất khi ra quầy + kiểm kê thiếu − thừa', tt.hao_hut_kg === 0.25 && tt.hao_hut_tien === 130000, JSON.stringify(tt));
  ok('Tóm tắt: chi phí thịt = bán + bếp + khác + hủy + hao hụt', tt.chi_phi_thit === 1000000 + 300000 + 200000 + 130000);
  ok('Tóm tắt: kg làm tròn (10 + 0,1)', tt.nhap_kg === 10.1 && tt.ton_cuoi_kg === 7.4);

  const thang = [
    { tu: '2026-07-01', den: '2026-07-31', co_ipos: false, doanh_thu: null },
    { tu: '2026-08-01', den: '2026-08-31', co_ipos: true, doanh_thu: 1000000 },
    { tu: '2026-09-01', den: '2026-09-26', co_ipos: true, doanh_thu: 500000 },
  ];
  ok('Doanh thu kỳ trọn tháng (Quý này tới hôm nay)', doanhThuKy(thang, '2026-07-01', '2026-09-26')?.doanhThu === 1500000);
  ok('Kỳ lẻ ngày → không tính doanh thu', doanhThuKy(thang, '2026-08-05', '2026-09-26') === null
    && doanhThuKy(thang, '2026-09-20', '2026-09-26') === null);
  ok('Tháng không có iPOS → doanh thu null, coIpos false', JSON.stringify(doanhThuKy(thang, '2026-07-01', '2026-07-31')) === '{"doanhThu":null,"coIpos":false,"duIpos":false}');
  ok('Kỳ có tháng chưa nối iPOS → duIpos false (không so chi phí / doanh thu)', doanhThuKy(thang, '2026-07-01', '2026-09-26')?.duIpos === false
    && doanhThuKy(thang, '2026-08-01', '2026-09-26')?.duIpos === true);
  // Database trả den = ngày cuối tháng kể cả tháng đang chạy.
  const thangDb = thang.map(d => (d.tu === '2026-09-01' ? { ...d, den: '2026-09-30' } : d));
  ok('Tháng đang chạy (den = cuối tháng từ database) + homNay → Tháng này / Quý này vẫn có doanh thu',
    doanhThuKy(thangDb, '2026-09-01', '2026-09-26', '2026-09-26')?.doanhThu === 500000
    && doanhThuKy(thangDb, '2026-07-01', '2026-09-26', '2026-09-26')?.doanhThu === 1500000
    && doanhThuKy(thangDb, '2026-09-01', '2026-09-26') === null);

  const tMua = THE_BAO_CAO.find(t => t.ma === 'mua-mat-hang');
  ok('Link thẻ mang kỳ và giữ tham số riêng', linkTheBaoCao(tMua, '2026-09-01', '2026-09-26')
    === '/noi-bo/kho/bao-cao/mua-hang?nhom=mat_hang&tu=2026-09-01&den=2026-09-26');
  ok('Link thẻ Theo tháng mang năm', linkTheBaoCao(THE_BAO_CAO.find(t => t.ma === 'theo-thang'), '2025-12-01', '2026-01-31')
    === '/noi-bo/kho/bao-cao/theo-thang?nam=2026');

  const kg = dinhNghiaTheoThang(false);
  ok('Theo tháng cho thủ kho: không cột tiền nào', !kg.cot.some(c => c.kieu === 'tien' || c.tienMat) && !kg.chiaTong);
  const tien = dinhNghiaTheoThang(true);
  ok('Theo tháng cho vai xem giá: có chi phí thịt, doanh thu, %', ['chi_phi_thit', 'doanh_thu', 'chi_phi_tren_doanh_thu_pt'].every(k => tien.cot.some(c => c.khoa === k)));
  const tong = tinhTong(tien, [
    { ten_thang: 'T1', ton_dau_kg: 5, ton_cuoi_kg: 6, nhap_kg: 3, chi_phi_thit: 100, chi_phi_thit_ipos: 100, doanh_thu: 1000 },
    { ten_thang: 'T2', ton_dau_kg: 6, ton_cuoi_kg: 4, nhap_kg: 2, chi_phi_thit: 300, chi_phi_thit_ipos: 300, doanh_thu: 1000 },
    // Tháng chưa nối iPOS: chi phí thịt vẫn cộng, nhưng không vào tỷ lệ chi phí / doanh thu.
    { ten_thang: 'T3', ton_dau_kg: 4, ton_cuoi_kg: 4, nhap_kg: 0, chi_phi_thit: 5000, chi_phi_thit_ipos: null, doanh_thu: null },
  ]);
  ok('Dòng tổng năm: cộng nhập, không cộng tồn đầu / tồn cuối, % tính lại', tong[0].so.nhap_kg === 5 && !('ton_dau_kg' in tong[0].so)
    && !('ton_cuoi_kg' in tong[0].so) && tong[0].so.chi_phi_tren_doanh_thu_pt === 20 && tong[0].so.chi_phi_thit === 5400, JSON.stringify(tong));
  const csv = taoCsv(dinhNghiaMuaHang('mat_hang').cot, [{ ten: 'Thăn', ma: 'C-THAN', so_kg: 1.5, tien_hang: 750000 }]);
  ok('CSV mua hàng theo mặt hàng: BOM, chấm phẩy, kg dấu phẩy', csv.charCodeAt(0) === 0xFEFF && csv.includes('Thăn;C-THAN;;;1,5;;750000'), csv);
});

// ===========================================================================
await nhom('5 · CỘT WEB CÓ TRONG HÀM DATABASE (0041)', async () => {
  const MIG = join(GOC, 'crm/supabase/migrations');
  const sql = readdirSync(MIG).filter(f => f.endsWith('.sql')).sort().map(f => doc(join(MIG, f))).join('\n');
  const cotHam = ten => {
    const i = sql.lastIndexOf(`create or replace function ${ten}(`);
    const tra = i >= 0 ? sql.slice(sql.indexOf('returns table', i), sql.indexOf('language', i)) : '';
    return [...tra.matchAll(/([a-z_]+)\s+(?:uuid|text|boolean|numeric|bigint|int|date|timestamptz)\b/g)].map(x => x[1]);
  };
  const thang = cotHam('kho_bao_cao_theo_thang');
  const la1 = dinhNghiaTheoThang(true).cot.map(c => c.khoa).filter(k => k !== 'ten_thang' && !thang.includes(k));
  ok('Theo tháng: mọi cột web có trong hàm', thang.length > 20 && la1.length === 0, la1.join());
  const mua = cotHam('kho_bao_cao_mua_hang');
  const la2 = [...dinhNghiaMuaHang('ncc').cot, ...dinhNghiaMuaHang('mat_hang').cot].map(c => c.khoa).filter(k => !mua.includes(k));
  ok('Mua hàng: mọi cột web có trong hàm', mua.length > 10 && la2.length === 0, la2.join());
  const so = cotHam('kho_so_thanh_toan');
  const la3 = DN_SO_THANH_TOAN.cot.map(c => c.khoa).filter(k => k !== 'ten_trang_thai' && !so.includes(k));
  ok('Sổ thanh toán: mọi cột web có trong hàm', so.length > 10 && la3.length === 0, la3.join());
});

// ===========================================================================
const { db, cnA, duoi } = await dungDatabase();
const traVeBang = new Map((await db.query(
  `select proname, proretset from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and proname like 'kho_%'`)).rows.map(r => [r.proname, r.proretset]));
function clientCua(uid) {
  return {
    // Như supabase-js: rpc() trả builder chờ được (await), có .range() cho hàm trả nhiều dòng (docTungTrang).
    rpc(ten, thamSo) {
      let khoang = null;
      const chay = async () => {
        const ds = Object.entries(thamSo);
        const doi = ds.map(([k, v], i) => `${k} => $${i + 1}${v !== null && typeof v === 'object' ? '::jsonb' : ''}`).join(', ');
        const gt = ds.map(([, v]) => (v !== null && typeof v === 'object' ? JSON.stringify(v) : v));
        const sql = traVeBang.get(ten) ? `select * from ${ten}(${doi})` : `select ${ten}(${doi}) as r`;
        const kq = await duoi(uid, sql, gt);
        if (kq.loi) return { data: null, error: { message: kq.loi } };
        if (!traVeBang.get(ten)) return { data: kq.rows[0]?.r ?? null, error: null };
        return { data: khoang ? kq.rows.slice(khoang[0], khoang[1] + 1) : kq.rows, error: null };
      };
      const b = {
        range(a, z) { khoang = [a, z]; return b; },
        then(xong, hong) { return chay().then(xong, hong); },
      };
      return b;
    },
  };
}
const ql = clientCua(UID.qlA);
const tk = clientCua(UID.thuKhoA);
const kt = clientCua(UID.keToanA);

await nhom('6 · VÒNG THẬT: FORM TRANG → kho_sua_nhanh_mat_hang (PGlite)', async () => {
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  const docMon = async ma => (await db.query(
    `select id, ten, gia_ban_kg, han_dung_ngay, ma_can, quay_toi_da_goi, ton_toi_thieu_kg, noi_de_sau_pha, dang_dung,
            updated_at::text as phien_ban from kho_mat_hang where ma = $1`, [ma])).rows[0];
  const mau = (await db.query(`select ma from kho_mat_hang where loai = 'phan_cat' order by ma limit 2`)).rows.map(r => r.ma);
  const a = await docMon(mau[0]);
  const b = await docMon(mau[1]);
  const moTrang = m => ({
    [`pb_${m.id}`]: m.phien_ban,
    [`gia_ban_kg_${m.id}`]: m.gia_ban_kg === null ? '' : Number(m.gia_ban_kg).toLocaleString('vi-VN'),
    [`cu_gia_ban_kg_${m.id}`]: m.gia_ban_kg === null ? '' : Number(m.gia_ban_kg).toLocaleString('vi-VN'),
    [`han_dung_ngay_${m.id}`]: m.han_dung_ngay === null ? '' : String(m.han_dung_ngay),
    [`cu_han_dung_ngay_${m.id}`]: m.han_dung_ngay === null ? '' : String(m.han_dung_ngay),
  });

  const f1 = taoForm({ id: [a.id, b.id], ...moTrang(a), ...moTrang(b),
    [`gia_ban_kg_${a.id}`]: '650.000', [`ma_can_${a.id}`]: '0777', [`cu_ma_can_${a.id}`]: a.ma_can ?? '',
    [`ton_toi_thieu_kg_${b.id}`]: '1,5', [`cu_ton_toi_thieu_kg_${b.id}`]: '' });
  const kq1 = await suaNhanhMatHang(ql, cnA.id, docFormSuaNhanh(f1).dong);
  const a1 = await docMon(mau[0]);
  const b1 = await docMon(mau[1]);
  ok('Quản lý lưu 2 món một lần', kq1.ok && kq1.soLuu === 2, kq1.cau);
  ok('Giá "650.000" → 650000, mã cân "0777" → "777", kg "1,5" → 1.5, ô không đổi giữ nguyên',
    Number(a1.gia_ban_kg) === 650000 && a1.ma_can === '777' && Number(b1.ton_toi_thieu_kg) === 1.5
    && a1.han_dung_ngay === a.han_dung_ngay, JSON.stringify([a1, b1]));

  // Hai máy: máy 2 mở trang trước khi máy 1 lưu → dòng A bị từ chối; dòng B đúng nhưng cũng không lưu.
  const f2 = taoForm({ id: [a.id, b.id], ...moTrang(a), ...moTrang(b1),
    [`gia_ban_kg_${a.id}`]: '999000', [`han_dung_ngay_${b.id}`]: '9' });
  const kq2 = await suaNhanhMatHang(ql, cnA.id, docFormSuaNhanh(f2).dong);
  const theo2 = loiTheoMon(kq2.loi);
  ok('Phiên bản cũ → lỗi đúng dòng "người khác sửa", không đè', !kq2.ok && theo2.has(a.id) && kq2.loi.some(laLoiPhienBan)
    && Number((await docMon(mau[0])).gia_ban_kg) === 650000, JSON.stringify(kq2.loi));
  ok('Tất cả hoặc không: dòng đúng cũng chưa lưu', (await docMon(mau[1])).han_dung_ngay === b1.han_dung_ngay);

  const f3 = taoForm({ id: [b.id], ...moTrang(b1), [`quay_toi_da_goi_${b.id}`]: 'mười', [`cu_quay_toi_da_goi_${b.id}`]: '' });
  const kq3 = await suaNhanhMatHang(ql, cnA.id, docFormSuaNhanh(f3).dong);
  ok('Ô sai → lỗi đúng ô quay_toi_da_goi', !kq3.ok && loiTheoMon(kq3.loi).get(b.id)?.o.has('quay_toi_da_goi'), JSON.stringify(kq3.loi));

  const f4 = taoForm({ id: [a.id], ...moTrang(a1), [`ma_can_${a.id}`]: CHU_XOA, [`cu_ma_can_${a.id}`]: '777' });
  const kq4 = await suaNhanhMatHang(ql, cnA.id, docFormSuaNhanh(f4).dong);
  ok('Gõ "-" xóa mã cân', kq4.ok && (await docMon(mau[0])).ma_can === null, kq4.cau);

  const kq5 = await suaNhanhMatHang(tk, cnA.id, [{ id: a.id, phien_ban: (await docMon(mau[0])).phien_ban, gia_ban_kg: 1 }]);
  ok('Thủ kho không sửa được (database từ chối, câu tiếng Việt)', !kq5.ok && /không sửa được danh mục|không có quyền/.test(kq5.cau), kq5.cau);
  const kq6 = await suaNhanhMatHang(ql, cnA.id, []);
  ok('Không đổi ô nào → báo, không gọi database', kq6.ok && kq6.soLuu === 0 && /Chưa đổi ô nào/.test(kq6.cau));
});

await nhom('7 · VÒNG THẬT: BÁO CÁO THÁNG / MUA HÀNG / SỔ THANH TOÁN THEO QUYỀN', async () => {
  const nam = Number((await db.query(`select extract(year from hom_nay_vn())::int as n`)).rows[0].n);
  const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
  const t1 = await docTheoThang(tk, cnA.id, nam);
  ok('Theo tháng (thủ kho): đọc được, mỗi tháng một dòng, tiền null', t1.loi === null && t1.dong.length === Number(homNay.slice(5, 7))
    && t1.dong.every(d => d.ton_cuoi_tien === null && d.chi_phi_thit === null && typeof d.ton_cuoi_kg === 'number')
    && t1.dong[0].ten_thang === `Tháng 1/${nam}`, t1.loi ?? JSON.stringify(t1.dong[0]));
  const t2 = await docTheoThang(ql, cnA.id, nam);
  ok('Theo tháng (quản lý): cột tiền là số', t2.loi === null && t2.dong.every(d => typeof d.ton_cuoi_tien === 'number'), t2.loi ?? '');
  const t3 = await docTheoThang(ql, cnA.id, nam + 1);
  ok('Năm sau → không dòng nào', t3.loi === null && t3.dong.length === 0);

  const m1 = await docMuaHang(tk, cnA.id, `${nam}-01-01`, homNay, 'ncc');
  ok('Mua hàng: thủ kho bị từ chối (câu tiếng Việt)', !!m1.loi && m1.dong.length === 0, m1.loi ?? '');
  const m2 = await docMuaHang(kt, cnA.id, `${nam}-01-01`, homNay, 'mat_hang');
  ok('Mua hàng: kế toán đọc được', m2.loi === null, m2.loi ?? '');
  const s1 = await docSoThanhToan(tk, cnA.id, `${nam}-01-01`, homNay);
  ok('Sổ thanh toán: thủ kho bị từ chối', !!s1.loi);
  const s2 = await docSoThanhToan(kt, cnA.id, `${nam}-01-01`, homNay);
  ok('Sổ thanh toán: kế toán đọc được (chưa có khoản nào)', s2.loi === null && s2.dong.length === 0, s2.loi ?? '');
});

// ===========================================================================
await nhom('8 · MÃ NGUỒN TRANG', async () => {
  const chan = s => s.split('\n').find(l => /!k\.duoc\(/.test(l) && /return Astro\.redirect/.test(l)) ?? '';
  const sn = doc(join(TRANG, 'cai-dat/mat-hang/sua-nhanh.astro'));
  ok('Sửa nhanh: chặn bằng danh_muc', /!k\.duoc\('danh_muc'\)/.test(chan(sn)));
  ok('Sửa nhanh: form POST mang id, phiên bản, ô ẩn giá trị cũ', /method="POST"/.test(sn) && /name="id"/.test(sn)
    && /name=\{`pb_\$\{m\.id\}`\}/.test(sn) && /name=\{`cu_\$\{ten\}`\}/.test(sn) && /Lưu tất cả/.test(sn));
  ok('Sửa nhanh: cột tên món dính khi cuộn ngang', /position: sticky/.test(sn) && /overflow-x: auto/.test(sn));
  ok('Sửa nhanh: huongDan="sua-nhanh"', /huongDan="sua-nhanh"/.test(sn));
  const mh = doc(join(TRANG, 'cai-dat/mat-hang.astro'));
  ok('Trang Mặt hàng có link Sửa nhanh', /\/noi-bo\/kho\/cai-dat\/mat-hang\/sua-nhanh/.test(mh));

  const vl = doc(join(TRANG, 'cai-dat/vi-tri-ly-do.astro'));
  ok('Vị trí + lý do: MỘT form POST, có phien_ban, nút Lưu tất cả', (vl.match(/<form method="POST"/g) ?? []).length === 1
    && /name="phien_ban"/.test(vl) && /Lưu tất cả/.test(vl) && /docFormViTriLyDo/.test(vl));
  ok('Vị trí + lý do: ô tích "Tính vào định mức bếp" chỉ ở bảng Xuất bếp, cả dòng cũ lẫn dòng mới',
    /Tính vào định mức bếp/.test(vl) && /ld_co_dm_\$\{l\.id\}/.test(vl) && /ld_tinh_dm_\$\{l\.id\}/.test(vl)
    && /ld_moi_co_dm_/.test(vl) && /ld_moi_tinh_dm_/.test(vl)
    && (vl.match(/loai === 'xuat_bep' && \(/g) ?? []).length === 2);
  const dmTrang = doc(join(TRANG, 'bao-cao/dinh-muc.astro'));
  ok('Định mức bếp: câu "không tính … Cơm nhân viên" + link Vị trí và lý do chỉ cho danh_muc',
    /không tính định mức \(mặc định: Cơm nhân viên\)/.test(dmTrang)
    && /k\.duoc\('danh_muc'\) \? <>\{t\.doiO\} <a href="\/noi-bo\/kho\/cai-dat\/vi-tri-ly-do"/.test(dmTrang)
    && /doiO: \{ vi: 'Đổi ở'/.test(dmTrang));
  ok('Danh mục đọc cột tinh_dinh_muc của lý do', /select\('id, loai, ten, can_anh, dang_dung, thu_tu, tinh_dinh_muc'\)/.test(doc(join(GOC, 'web/src/lib/kho/danh-muc.ts'))));

  const ct = doc(join(TRANG, 'cai-dat/cong-thuc.astro'));
  ok('Công thức: lưới có Tính lại, Thêm dòng, Lưu công thức, phiên bản', ['tinh_lai', 'them_dong', 'luu_luoi'].every(v => ct.includes(`value="${v}"`))
    && /name="phien_ban"/.test(ct) && /mauTong\(tongLuoi\)/.test(ct));
  ok('Công thức: nút Enter (đầu form) là Tính lại, không lưu', ct.indexOf('value="tinh_lai"') < ct.indexOf('value="luu_luoi"'));
  ok('Công thức: Nhân bản và Gợi ý từ thực tế', /value="nhan_ban"/.test(ct) && /goi_y=1/.test(ct) && /docGoiYThucTe/.test(ct));

  const q = doc(join(TRANG, 'cai-dat/quyen.astro'));
  ok('Trang quyền: huongDan="quyen", không gọi database', /huongDan="quyen"/.test(q) && !/\.rpc\(|\.from\(/.test(q));

  for (const [ten, s] of [['sua-nhanh', sn], ['vi-tri-ly-do', vl], ['cong-thuc', ct], ['quyen', q]]) {
    ok(`${ten}: không <script>, không onclick`, !/<script|onclick=/i.test(s));
  }
  const lib = doc(join(GOC, 'web/src/lib/kho/sua-nhanh.ts'));
  ok('Bảng sửa nhanh không đọc cột giá vốn', !/gia_von|kho_mat_hang_gia|gia_tri_thu_hoi/.test(lib.slice(lib.indexOf('export async function docMonSuaNhanh'))));
});

process.exit(ketThuc('WEB SỬA NHANH · CÔNG THỨC · BÁO CÁO'));
