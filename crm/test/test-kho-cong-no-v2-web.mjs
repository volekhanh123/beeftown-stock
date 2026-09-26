/**
 * BEEFTOWN KHO — Kiểm thử phần web của công nợ v2 (GĐ8b, migration 0040)
 * =====================================================================
 *
 *     node test/test-kho-cong-no-v2-web.mjs
 *
 *   · lib/kho/misa.ts (thuần): CSV có BOM, escape dấu ; và ", số tiền không
 *     phân cách nghìn, ô chữ bắt đầu bằng = không thành công thức, mã tài
 *     khoản, bộ lọc kỳ, chỗ thiếu mã.
 *   · lib/kho/cong-no.ts (thuần): form Trả tiền (không sửa phần chia gợi ý →
 *     database tự chia), công thức đầu trang, lọc / chia trang NCC, xem trước
 *     hóa đơn gộp khớp từng đồng, dòng trả hàng, tóm tắt kỳ, đổi tài khoản.
 *   · Vòng thật trên PGlite: bảng chia hóa đơn gộp của web = của database;
 *     dữ liệu MISA thật → CSV đủ cột; Trả đủ / xem trước → ghi v2 nhận được;
 *     sổ theo kỳ khớp view.
 *   · Mã nguồn trang: dòng chặn quyền, nút "?", ma_gui, thủ kho không thấy
 *     tiền ở màn ghi kg, menu có số đỏ tra_hang_cho_tien.
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dungDatabase, taoBoDem, UID, maGui } from './kho-chung.mjs';
import {
  COT_MISA, TEN_TK_MISA, oCsvMisa, taoCsvMisa, tomTatMisa, thieuMaMisa, docBoLocMisa, tenTepMisa,
  docFormMisaTk, docMaMisa, oXemMisa,
} from '../../web/src/lib/kho/misa.ts';
import {
  loaiTuKieu, docFormTraTien, congThucCongNo, locNccCongNo, catTrangBoNho, docChipCongNo, xemTruocHoaDonGop,
  docFormHoaDonGop, docDongTraHang, tomTatKy, doiTaiKhoanGanDay, tienGiamNo, docKyCongNo, tenKhoan, KIEU_TRA,
} from '../../web/src/lib/kho/cong-no.ts';
import { canhBaoDoiTaiKhoan } from '../../web/src/lib/kho/danh-muc.ts';
import { KHOA_CONG_NO, MUC_KHO, THAO_TAC_NHANH } from '../../web/src/lib/kho/dieu-huong.ts';
import { MUC_HUONG_DAN } from '../../web/src/lib/kho/huong-dan.ts';
import { CO_TRANG } from '../../web/src/lib/kho/tim-ds.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ WEB CÔNG NỢ V2 (GĐ8b)');

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const KHO = join(GOC, 'web', 'src', 'pages', 'noi-bo', 'kho');
const doc = f => readFileSync(join(KHO, f), 'utf8');
const U = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const form = obj => {
  const m = new Map(Object.entries(obj));
  return { get: k => (m.has(k) ? (Array.isArray(m.get(k)) ? m.get(k)[0] : m.get(k)) : null),
           getAll: k => (m.has(k) ? [].concat(m.get(k)) : []) };
};

const DONG_MAU = {
  thu_tu: 1, loai_chung_tu: 'mua_hang', ngay_chung_tu: '2026-09-05', so_chung_tu: 'PN-2609-0001', so_hoa_don: 'HD;01"A',
  ngay_hoa_don: '2026-09-06', ma_ncc: '0312345678', ten_ncc: 'Công ty "Bò Úc"; chi nhánh 1', ma_so_thue: '0312345678',
  ma_hang: 'T-THANNGOAI', ten_hang: 'Thăn ngoại', dvt: 'kg', so_luong: 3.333, don_gia: 300001, thanh_tien: 999903,
  thue_suat: 8, tien_thue: 79992, tk_no: '1561', tk_co: '331', tk_thue: '1331', hinh_thuc: null,
  dien_giai: '=SUM(A1)', thieu_ma: true, ref_id: U(9),
};

// ===========================================================================
await nhom('1 · misa.ts: CSV', async () => {
  const csv = taoCsvMisa('mua_hang', [DONG_MAU]);
  ok('Có BOM UTF-8 ở đầu', csv.charCodeAt(0) === 0xfeff);
  const [dau, dong1] = csv.slice(1).split('\r\n');
  ok('Dòng tiêu đề theo COT_MISA + cột "Thiếu mã MISA"', dau === [...COT_MISA.mua_hang.map(c => c.ten), 'Thiếu mã MISA'].join(';'), dau);
  ok('Xuống dòng CRLF, kết thúc bằng CRLF', csv.endsWith('\r\n') && !/[^\r]\n/.test(csv));
  ok('Chữ có dấu ; và " được bọc nháy, nháy viết đôi', dong1.includes('"HD;01""A"') && dong1.includes('"Công ty ""Bò Úc""; chi nhánh 1"'), dong1);
  ok('Số tiền không phân cách hàng nghìn', dong1.includes(';300001;999903;') && !/999\.903|999,903/.test(dong1), dong1);
  ok('Số lẻ dùng dấu phẩy khi ngăn bằng ;', dong1.includes(';3,333;'), dong1);
  ok('Ngày ghi dd/mm/yyyy', dong1.startsWith('05/09/2026;'), dong1);
  ok('Ô chữ bắt đầu bằng = không thành công thức Excel', dong1.includes(";'=SUM(A1);"), dong1);
  ok('Cột cuối đánh dấu thiếu mã "x"', dong1.endsWith(';x'));
  const phay = taoCsvMisa('mua_hang', [DONG_MAU], { ngan: ',' }).slice(1).split('\r\n')[1];
  ok('Ngăn bằng ",": số lẻ dùng dấu chấm, chữ có dấu phẩy được bọc', phay.includes(',3.333,') && phay.includes('"Thăn ngoại"') === false
     && phay.includes('"Công ty ""Bò Úc""; chi nhánh 1"'), phay);
  ok('oCsvMisa: trống / null → ô rỗng; xuống dòng được bọc', oCsvMisa(null, 'tien') === '' && oCsvMisa('a\nb', 'chu') === '"a\nb"');
  ok('oCsvMisa: tiền làm tròn đồng', oCsvMisa(1234.6, 'tien') === '1235');
  ok('Không cột thiếu mã khi tắt', !taoCsvMisa('thanh_toan', [], { cotThieuMa: false }).includes('Thiếu mã'));
  const tt = { ...DONG_MAU, loai_chung_tu: 'hoan_tien', hinh_thuc: 'chuyen_khoan', thieu_ma: false };
  const dongTt = taoCsvMisa('thanh_toan', [tt]).slice(1).split('\r\n')[1];
  ok('File thanh toán: tên loại và hình thức tiếng Việt', dongTt.includes(';NCC hoàn tiền;Chuyển khoản;'), dongTt);
  ok('oXemMisa: tiền có dấu chấm nghìn trên màn', oXemMisa(DONG_MAU, COT_MISA.mua_hang.find(c => c.khoa === 'thanh_tien')) === '999.903');
});

// ===========================================================================
await nhom('2 · misa.ts: TÓM TẮT, THIẾU MÃ, BỘ LỌC, MÃ TÀI KHOẢN', async () => {
  const ds = [DONG_MAU, { ...DONG_MAU, so_chung_tu: 'PN-2', thanh_tien: 100, tien_thue: 8, thieu_ma: false, ma_hang: 'X' }];
  const t = tomTatMisa(ds);
  ok('Tóm tắt: số dòng, chứng từ, tiền, thuế, thiếu mã', t.soDong === 2 && t.soChungTu === 2 && t.tongTien === 1000003
     && t.tongThue === 80000 && t.soThieuMa === 1, JSON.stringify(t));
  const th = thieuMaMisa(ds,
    [{ id: 'n1', ten: 'Công ty "Bò Úc"; chi nhánh 1', ma_misa: null }, { id: 'n2', ten: 'Khác', ma_misa: null }],
    [{ id: 'm1', ma: 'T-THANNGOAI', ten: 'Thăn', ma_misa: null }, { id: 'm2', ma: 'X', ten: 'X', ma_misa: null },
     { id: 'm3', ma: 'T-NAC', ten: 'Nạc', ma_misa: 'NAC01' }]);
  ok('Thiếu mã: chỉ NCC / mặt hàng chưa có mã và nằm trong dòng thiếu mã', th.ncc.map(x => x.id).join() === 'n1'
     && th.matHang.map(x => x.id).join() === 'm1', JSON.stringify(th));
  const l = docBoLocMisa(new URLSearchParams('tu=2026-09-30&den=2026-09-01&loai=thanh_toan&ngan=phay'), '2026-09-26');
  ok('Bộ lọc: ngày ngược tự đảo, loại, dấu phẩy', l.tu === '2026-09-01' && l.den === '2026-09-30' && l.loai === 'thanh_toan' && l.ngan === ',');
  const m = docBoLocMisa(new URLSearchParams('tu=xau&loai=la'), '2026-09-26');
  ok('Mặc định: đầu tháng → hôm nay, mua hàng, dấu ;', m.tu === '2026-09-01' && m.den === '2026-09-26' && m.loai === 'mua_hang' && m.ngan === ';');
  ok('Tên file an toàn', tenTepMisa('mua_hang', 'Q 1', '2026-09-01', '2026-09-30') === 'misa-mua-hang-Q_1-2026-09-01-2026-09-30.csv');
  const tk = docFormMisaTk(form({ tk_co_ncc: '331 1', tk_thue: '', tk_no_hang: '15a', la: '999' }));
  ok('Mã tài khoản: bỏ khoảng trắng, ô trống giữ cũ, chữ bị báo, khóa lạ bỏ qua',
     tk.tk.tk_co_ncc === '3311' && !('tk_thue' in tk.tk) && !('la' in tk.tk) && tk.loi.length === 1, JSON.stringify(tk));
  ok('Đủ 6 khóa như database (có tk_bu_tru)', TEN_TK_MISA.map(x => x[0]).join() === 'tk_no_hang,tk_thue,tk_co_ncc,tk_tien_mat,tk_ngan_hang,tk_bu_tru');
  ok('docMaMisa: trống = xóa, ký tự lạ = lỗi', docMaMisa('  ') === null && docMaMisa('NCC-01') === 'NCC-01' && docMaMisa('Bò Úc') === undefined);
});

// ===========================================================================
await nhom('3 · cong-no.ts: FORM TRẢ TIỀN', async () => {
  ok('Kiểu → loại + hình thức', JSON.stringify(loaiTuKieu('tien_mat')) === '{"loai":"thanh_toan","hinh_thuc":"tien_mat"}'
     && loaiTuKieu('bu_tru').hinh_thuc === null && loaiTuKieu('hoan_tien', 'tien_mat').hinh_thuc === 'tien_mat'
     && loaiTuKieu('hoan_tien').hinh_thuc === 'chuyen_khoan' && loaiTuKieu('xau') === null);
  ok('Năm cách trả', KIEU_TRA.map(k => k.ma).join() === 'chuyen_khoan,tien_mat,bu_tru,hoan_tien,giam_tru');
  const coBan = { kieu: 'chuyen_khoan', so_tien: '1.500.000', ngay: '2026-09-20', so_pb: '2',
    pb0_phieu: U(1), pb0_goi_y: '1000000', pb0_tien: '1.000.000', pb1_phieu: U(2), pb1_goi_y: '500000', pb1_tien: '500.000' };
  const a = docFormTraTien(form(coBan), true);
  ok('Không sửa phần chia gợi ý → phanBo rỗng (database tự chia)', a.loi.length === 0 && a.phanBo.length === 0 && a.soTien === 1500000
     && a.loai === 'thanh_toan' && a.hinhThuc === 'chuyen_khoan', JSON.stringify(a));
  const b = docFormTraTien(form({ ...coBan, pb0_tien: '700.000', pb1_tien: '800.000' }), true);
  ok('Sửa phần chia, tổng đúng → gửi phanBo', b.loi.length === 0 && b.phanBo.length === 2 && b.phanBo[1].so_tien === 800000, JSON.stringify(b));
  const c = docFormTraTien(form({ ...coBan, pb0_tien: '700.000' }), true);
  ok('Sửa phần chia mà tổng lệch → báo', c.loi.some(x => /phải bằng số tiền/.test(x)), c.loi.join());
  const d = docFormTraTien(form({ ...coBan, pb0_tien: '', pb1_tien: '1.500.000', pb1_goi_y: '500000' }), true);
  ok('Dồn hết vào một phiếu: phiếu để trống không gửi', d.loi.length === 0 && d.phanBo.length === 1 && d.phanBo[0].phieu_nhap_id === U(2));
  const e = docFormTraTien(form({ kieu: 'bu_tru', so_tien: '200000', ngay: '' }), true);
  ok('Bù trừ không ghi chú → báo (lúc ghi)', e.loi.some(x => /Bù trừ/.test(x)));
  ok('… lúc xem trước thì chưa đòi', docFormTraTien(form({ kieu: 'bu_tru', so_tien: '200000' }), false).loi.length === 0);
  ok('Số tiền 0 / chữ → báo', docFormTraTien(form({ kieu: 'tien_mat', so_tien: '0' }), false).loi.length === 1
     && docFormTraTien(form({ kieu: 'tien_mat', so_tien: 'abc' }), false).loi.length === 1);
  ok('Ghi mà chưa có số tiền → báo', docFormTraTien(form({ kieu: 'tien_mat' }), true).loi.some(x => /Trả đủ/.test(x)));
  ok('Cách trả lạ → báo', docFormTraTien(form({ kieu: 'the', so_tien: '1' }), false).loi.length === 1);
  ok('tenKhoan', tenKhoan({ loai: 'hoan_tien', hinh_thuc: 'tien_mat' }) === 'NCC hoàn tiền (Tiền mặt)'
     && tenKhoan({ loai: 'giam_tru', hinh_thuc: null, phieu_xuat_id: 'x' }) === 'Giảm trừ do trả hàng' && tenKhoan({ loai: 'bu_tru', hinh_thuc: null }) === 'Bù trừ');
  ok('tienGiamNo: hoàn tiền làm tăng nợ, khoản hủy = 0', tienGiamNo({ loai: 'hoan_tien', so_tien: 5, trang_thai: 'hieu_luc' }) === -5
     && tienGiamNo({ loai: 'thanh_toan', so_tien: 5, trang_thai: 'da_huy' }) === 0);
});

// ===========================================================================
await nhom('4 · cong-no.ts: CÔNG THỨC, LỌC NCC, CHIA TRANG, KỲ', async () => {
  const ncc = [
    { nha_cung_cap_id: 'a', ten_nha_cung_cap: 'Bò Úc', tong_phai_tra: 12000, da_tra: 5000, giam_tru: 500, con_no: 6500, no_qua_han: 0,
      so_phieu_chua_doi_chieu: 1, so_phieu_hoa_don_gop: 0, no_den_han_7_ngay: 6500 },
    { nha_cung_cap_id: 'b', ten_nha_cung_cap: 'Bò Mỹ', tong_phai_tra: 3000, da_tra: 3500, giam_tru: 0, con_no: -500, no_qua_han: 0,
      so_phieu_chua_doi_chieu: 0, so_phieu_hoa_don_gop: 2, no_den_han_7_ngay: 0 },
    { nha_cung_cap_id: 'c', ten_nha_cung_cap: 'Bò Nhật', tong_phai_tra: 1000, da_tra: 0, giam_tru: 0, con_no: 1000, no_qua_han: 1000,
      so_phieu_chua_doi_chieu: 0, so_phieu_hoa_don_gop: 0, no_den_han_7_ngay: 0 },
  ];
  const ct = congThucCongNo(ncc, [{ phai_tra: 2000 }]);
  ok('Công thức: đầu kỳ + mua − trả − giảm trừ = còn phải trả', ct.dauKy === 2000 && ct.mua === 14000 && ct.tra === 8500
     && ct.giamTru === 500 && ct.dauKy + ct.mua - ct.tra - ct.giamTru === ct.conPhaiTra && ct.conPhaiTra === 7000, JSON.stringify(ct));
  ok('Chip lạ bị bỏ', docChipCongNo('xau') === '' && docChipCongNo('gop') === 'gop');
  ok('Lọc quá hạn / đến hạn / chưa đối chiếu / gộp', locNccCongNo(ncc, 'qua_han', '').map(n => n.nha_cung_cap_id).join() === 'c'
     && locNccCongNo(ncc, 'den_han', '').map(n => n.nha_cung_cap_id).join() === 'a'
     && locNccCongNo(ncc, 'chua_doi_chieu', '').map(n => n.nha_cung_cap_id).join() === 'a'
     && locNccCongNo(ncc, 'gop', '').map(n => n.nha_cung_cap_id).join() === 'b');
  ok('Tìm không dấu, quá hạn lên trước', locNccCongNo(ncc, '', 'bo').map(n => n.nha_cung_cap_id).join() === 'c,a,b'
     && locNccCongNo(ncc, '', 'my').map(n => n.nha_cung_cap_id).join() === 'b');
  const nhieu = Array.from({ length: CO_TRANG * 2 + 3 }, (_, i) => i);
  const t2 = catTrangBoNho(nhieu, { trang: 2 });
  const t3 = catTrangBoNho(nhieu, { trang: 3 });
  ok('Chia trang trong bộ nhớ: trang 2 đủ, còn sau; trang 3 là 3 dòng cuối', t2.ds[0] === CO_TRANG && t2.ds.length === CO_TRANG && t2.coSau
     && t3.ds.length === 3 && !t3.coSau);
  const k1 = docKyCongNo(new URLSearchParams('tu=2026-09-20&den=2026-09-01'), '2026-09-26');
  const k2 = docKyCongNo(new URLSearchParams('tu=2026-02-30'), '2026-09-26');
  ok('Kỳ: đảo khi ngược, ngày không có thật → mặc định đầu tháng', k1.tu === '2026-09-01' && k1.den === '2026-09-20'
     && k2.tu === '2026-09-01' && k2.den === '2026-09-26');
  const so = [
    { loai: 'dau_ky', so_du: 1000, tang: null, giam: null },
    { loai: 'mua', so_du: 1500, tang: 500, giam: 0 },
    { loai: 'thanh_toan', so_du: 1200, tang: 0, giam: 300 },
    { loai: 'cuoi_ky', so_du: 1200, tang: 500, giam: 300 },
  ];
  const t = tomTatKy(so);
  ok('Tóm tắt kỳ: đầu + tăng − giảm = cuối, bỏ dòng đầu / cuối kỳ', t.dauKy === 1000 && t.tang === 500 && t.giam === 300
     && t.cuoiKy === 1200 && t.chungTu.length === 2);
});

// ===========================================================================
await nhom('5 · cong-no.ts: HÓA ĐƠN GỘP, TRẢ HÀNG, ĐỔI TÀI KHOẢN', async () => {
  const ph = [
    { id: U(3), so_phieu: 'PN-3', ngay_nhap: '2026-09-16', tong_tien_phieu: 308643 },
    { id: U(1), so_phieu: 'PN-1', ngay_nhap: '2026-09-06', tong_tien_phieu: 999903 },
    { id: U(2), so_phieu: 'PN-2', ngay_nhap: '2026-09-11', tong_tien_phieu: 855555 },
  ];
  const x = xemTruocHoaDonGop(ph, 2200000, 162963);
  ok('Xếp theo ngày nhập như database', x.phieu.map(p => p.so_phieu).join() === 'PN-1,PN-2,PN-3');
  ok('Tổng các phần = tổng hóa đơn đúng từng đồng', x.phieu.reduce((a, p) => a + p.so_tien, 0) === 2200000
     && x.phieu.reduce((a, p) => a + p.tien_thue, 0) === 162963);
  ok('Lệch = hóa đơn − tổng phiếu', x.tongPhieu === 2164101 && x.lech === 35899);
  const f = docFormHoaDonGop(form({ phieu: [U(1), U(1), 'xau'], so_hoa_don: '', ngay: '2026-02-30', tong_tien: '100', tien_thue: '200' }));
  ok('Form gộp: bỏ trùng / id lạ, cần 2 phiếu, số HĐ, ngày thật, thuế ≤ tổng', f.phieu.length === 1 && f.loi.length === 4, f.loi.join(' | '));
  const g = docFormHoaDonGop(form({ phieu: [U(1), U(2)], so_hoa_don: 'HD01', ngay: '2026-09-20', tong_tien: '1.855.458', tien_thue: '' }));
  ok('Form gộp hợp lệ: tiền có dấu chấm, thuế trống = 0', g.loi.length === 0 && g.tongTien === 1855458 && g.tienThue === 0);
  const dt = docDongTraHang(form({ so_dong: '2', t0_lo: U(5), t0_kg: '4,5', t0_goi: '1', t1_lo: U(6), t1_kg: '' }));
  ok('Dòng trả hàng: kg có dấu phẩy, dòng trống bỏ', dt.loi.length === 0 && dt.dong.length === 1 && dt.dong[0].so_kg === 4.5 && dt.dong[0].so_goi === 1);
  ok('Không dòng nào → báo', docDongTraHang(form({ so_dong: '1', t0_lo: U(5) })).loi.length === 1);
  ok('Dòng gửi chỉ có khóa hàm nhận (lo_id, so_kg, so_goi)', Object.keys(dt.dong[0]).every(k => ['lo_id', 'so_kg', 'so_goi'].includes(k)));
  const bay = Date.parse('2026-09-26T00:00:00Z');
  const nk = [
    { id: '1', so_tai_khoan_cu: null, so_tai_khoan_moi: '111', luc: '2026-09-25T00:00:00Z' },
    { id: '2', so_tai_khoan_cu: '111', so_tai_khoan_moi: '222', luc: '2026-08-01T00:00:00Z' },
  ];
  ok('Đổi tài khoản: điền lần đầu không tính, quá 30 ngày không tính', doiTaiKhoanGanDay(nk, bay) === null);
  ok('… đổi thật trong 30 ngày thì có', doiTaiKhoanGanDay([{ ...nk[1], luc: '2026-09-20T00:00:00Z' }], bay)?.id === '2');
  ok('Cảnh báo khi lưu NCC: chỉ khi đã có số cũ và số mới khác', canhBaoDoiTaiKhoan({ so_tai_khoan: '111' }, { so_tai_khoan: '222' })
     && !canhBaoDoiTaiKhoan({ so_tai_khoan: null }, { so_tai_khoan: '222' }) && !canhBaoDoiTaiKhoan({ so_tai_khoan: '1 11' }, { so_tai_khoan: '111' })
     && !canhBaoDoiTaiKhoan(undefined, { so_tai_khoan: '1' }));
  ok('… cùng số nhưng đổi ngân hàng thì cũng cảnh báo (như database)',
     canhBaoDoiTaiKhoan({ so_tai_khoan: '111', ngan_hang: 'VCB' }, { so_tai_khoan: '111', ngan_hang: 'ACB' })
     && !canhBaoDoiTaiKhoan({ so_tai_khoan: '111', ngan_hang: 'VCB' }, { so_tai_khoan: '111', ngan_hang: ' vcb ' }));
  ok('… gõ thêm dấu cách không tính; đổi ngân hàng trong 30 ngày thì có',
     doiTaiKhoanGanDay([{ id: '3', so_tai_khoan_cu: '1 11', so_tai_khoan_moi: '111', luc: '2026-09-25T00:00:00Z' }], bay) === null
     && doiTaiKhoanGanDay([{ id: '4', so_tai_khoan_cu: '111', so_tai_khoan_moi: '111', ngan_hang_cu: 'VCB', ngan_hang_moi: 'ACB', luc: '2026-09-25T00:00:00Z' }], bay)?.id === '4');
});

// ===========================================================================
await nhom('6 · VÒNG THẬT TRÊN DATABASE (PGlite)', async () => {
  const { db, cnA, duoi } = await dungDatabase();
  const homNay = (await db.query(`select hom_nay_vn()::text as d`)).rows[0].d;
  const ngay = async n => (await db.query(`select ($1::date + $2::int)::text as d`, [homNay, n])).rows[0].d;
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  await duoi(UID.qlA, `select kho_tao_danh_muc_mau()`);
  const MH = Object.fromEntries((await db.query(`select * from kho_mat_hang`)).rows.map(r => [r.ma, r]));
  const khoId = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'kho'`, [cnA.id])).rows[0].id;
  const ncc = (await duoi(UID.keToanA, `insert into kho_nha_cung_cap (ten, so_ngay_no, kieu_hoa_don) values ('NCC Úc', 30, 'gop') returning id`)).rows[0].id;
  const nhap = async (ngayNhap, kg, gia, thue = 0) => {
    const luu = await duoi(UID.qlA, `
      select * from kho_luu_phieu_nhap(
        p_id => null, p_chi_nhanh_id => $1, p_ma_gui => $2, p_phien_ban => null,
        p_loai => 'mua', p_nha_cung_cap_id => $3, p_vi_tri_id => $4, p_ngay_nhap => $5::date,
        p_so_hoa_don => null, p_ngay_hoa_don => null, p_han_thanh_toan => null,
        p_tien_thue => $6, p_chi_phi_khac => 0, p_ghi_chu => null,
        p_anh => array[$1::uuid::text || '/nhap/' || gen_random_uuid() || '/1.jpg'],
        p_truong_them => '{}'::jsonb, p_dong => $7::jsonb)`,
      [cnA.id, maGui(), ncc, khoId, ngayNhap, thue,
       JSON.stringify([{ mat_hang_id: MH['T-THANNGOAI'].id, so_goi: 1, so_kg: kg, don_gia_kg: gia }])]);
    if (luu.loi) throw new Error(luu.loi);
    const p = luu.rows[0];
    await duoi(UID.qlA, `select kho_gui_duyet_phieu_nhap($1, $2)`, [p.phieu_id, p.phien_ban_moi]);
    const d = await duoi(UID.qlA, `select kho_duyet_phieu_nhap($1)`, [p.phieu_id]);
    if (d.loi) throw new Error(d.loi);
    return (await db.query(`select id, so_phieu, ngay_nhap::text, tong_tien_phieu::bigint from kho_v_cong_no_phieu where id = $1`, [p.phieu_id])).rows[0];
  };
  const p1 = await nhap(await ngay(-20), 3.333, 300001);
  const p2 = await nhap(await ngay(-15), 1.1, 777777);
  const p3 = await nhap(await ngay(-10), 2.5, 123457, 24691);
  const ds = [p3, p1, p2].map(p => ({ ...p, tong_tien_phieu: Number(p.tong_tien_phieu) }));

  // Hóa đơn gộp: bảng xem trước của web = phần database ghi.
  const xem = xemTruocHoaDonGop(ds, 2200001, 162963);
  const f = docFormHoaDonGop(form({ phieu: ds.map(p => p.id), so_hoa_don: 'HD-GOP-1', ngay: homNay, tong_tien: '2.200.001', tien_thue: '162.963', ly_do_lech: 'phí giao' }));
  const r = await duoi(UID.keToanA, `
    select * from kho_doi_chieu_hoa_don_gop(p_chi_nhanh_id => $1, p_ma_gui => $2, p_ncc => $3, p_so_hoa_don => $4, p_ngay => $5::date,
      p_tong_tien => $6, p_tien_thue => $7, p_phieu => $8::uuid[], p_ly_do_lech => $9)`,
    [cnA.id, maGui(), ncc, f.soHoaDon, f.ngay, f.tongTien, f.tienThue, f.phieu, f.lyDo]);
  ok('Database nhận form hóa đơn gộp của web', r.loi === null && f.loi.length === 0, r.loi ?? f.loi.join());
  const db3 = (await db.query(`select p.so_phieu, hp.so_tien::bigint, hp.tien_thue::bigint from kho_hoa_don_phieu hp
    join kho_phieu_nhap p on p.id = hp.phieu_id where hp.hoa_don_id = $1 order by hp.thu_tu`, [r.rows?.[0]?.hoa_don_id])).rows;
  ok('Xem trước của web khớp từng đồng với database (tiền và thuế, cùng thứ tự)',
     JSON.stringify(db3.map(x => [x.so_phieu, Number(x.so_tien), Number(x.tien_thue)]))
       === JSON.stringify(xem.phieu.map(p => [p.so_phieu, p.so_tien, p.tien_thue])),
     `${JSON.stringify(db3)} vs ${JSON.stringify(xem.phieu)}`);
  ok('Lệch của web = lệch database', Number(r.rows?.[0]?.lech) === xem.lech);

  // Trả tiền: "Trả đủ" = xem trước với số tiền null → form web → ghi v2.
  const truoc = (await duoi(UID.keToanA, `select * from kho_xem_truoc_thanh_toan($1, $2, 'thanh_toan', null)`, [cnA.id, ncc])).rows;
  const traDu = truoc.reduce((a, x) => a + Number(x.so_tien), 0);
  ok('Trả đủ = tổng còn nợ (= tổng hóa đơn gộp)', traDu === 2200001, String(traDu));
  const nua = (await duoi(UID.keToanA, `select * from kho_xem_truoc_thanh_toan($1, $2, 'thanh_toan', 1000000)`, [cnA.id, ncc])).rows;
  const giaTri = { kieu: 'chuyen_khoan', so_tien: '1.000.000', ngay: homNay, so_pb: String(nua.length) };
  nua.forEach((x, i) => Object.assign(giaTri, { [`pb${i}_phieu`]: x.phieu_nhap_id, [`pb${i}_goi_y`]: String(x.so_tien), [`pb${i}_tien`]: Number(x.so_tien) ? Number(x.so_tien).toLocaleString('vi-VN') : '' }));
  const ft = docFormTraTien(form(giaTri), true);
  const ghi = await duoi(UID.keToanA, `
    select * from kho_ghi_thanh_toan_v2(p_chi_nhanh_id => $1, p_ma_gui => $2, p_nha_cung_cap_id => $3, p_loai => $4, p_hinh_thuc => $5,
      p_so_tien => $6, p_ngay => $7::date, p_ghi_chu => null, p_anh => '{}'::text[], p_phan_bo => $8::jsonb)`,
    [cnA.id, maGui(), ncc, ft.loai, ft.hinhThuc, ft.soTien, ft.ngay, JSON.stringify(ft.phanBo)]);
  ok('Form Trả tiền (không sửa chia) → v2 ghi được, tự chia', ft.loi.length === 0 && ft.phanBo.length === 0 && ghi.loi === null, ghi.loi ?? ft.loi.join());
  const pbDb = (await db.query(`select pb.phieu_nhap_id, pb.so_tien::bigint from kho_thanh_toan_phan_bo pb where pb.thanh_toan_id = $1`, [ghi.rows?.[0]?.thanh_toan_id])).rows;
  ok('Database chia đúng như bảng xem trước', nua.filter(x => Number(x.so_tien) > 0).every(x => pbDb.some(y => y.phieu_nhap_id === x.phieu_nhap_id && Number(y.so_tien) === Number(x.so_tien))));

  // Sổ theo kỳ: cuối kỳ tới hôm nay = tổng còn nợ của view.
  const so = (await duoi(UID.keToanA, `select * from kho_cong_no_theo_ky($1, $2, $3::date, $4::date)`, [cnA.id, ncc, await ngay(-12), homNay])).rows
    .map(d => ({ ...d, tang: d.tang === null ? null : Number(d.tang), giam: d.giam === null ? null : Number(d.giam), so_du: Number(d.so_du) }));
  const t = tomTatKy(so);
  const conNo = Number((await db.query(`select con_no from kho_v_cong_no_ncc where nha_cung_cap_id = $1`, [ncc])).rows[0].con_no);
  ok('Sổ theo kỳ: đầu kỳ + tăng − giảm = cuối kỳ = còn nợ của view', t.dauKy + t.tang - t.giam === t.cuoiKy && t.cuoiKy === conNo,
     JSON.stringify({ t: { ...t, chungTu: t.chungTu.length }, conNo }));

  // MISA: dữ liệu thật → CSV, đủ cột COT_MISA.
  const mua = (await duoi(UID.keToanA, `select * from kho_du_lieu_misa($1, $2::date, $3::date, 'mua_hang')`, [cnA.id, await ngay(-30), homNay])).rows;
  const cotDb = new Set(Object.keys(mua[0] ?? {}));
  const thieuCot = [...COT_MISA.mua_hang, ...COT_MISA.thanh_toan].map(c => c.khoa)
    .filter(k => !['ten_loai', 'ten_hinh_thuc'].includes(k) && !cotDb.has(k));
  ok('Mọi cột COT_MISA có trong dữ liệu kho_du_lieu_misa', mua.length === 3 && thieuCot.length === 0, thieuCot.join());
  const csv = taoCsvMisa('mua_hang', mua.map(d => ({ ...d, thanh_tien: Number(d.thanh_tien) })));
  ok('CSV mua hàng: 1 tiêu đề + 3 dòng, dòng thiếu mã đánh "x"', csv.slice(1).trim().split('\r\n').length === 4
     && csv.slice(1).trim().split('\r\n').slice(1).every(l => l.endsWith(';x')));
  ok('Tổng thành tiền trong CSV = tổng tiền hàng các phiếu', tomTatMisa(mua.map(d => ({ ...d, thanh_tien: Number(d.thanh_tien), tien_thue: Number(d.tien_thue) }))).tongTien
     === 999903 + 855555 + 308643);
  const tt = (await duoi(UID.keToanA, `select * from kho_du_lieu_misa($1, $2::date, $3::date, 'thanh_toan')`, [cnA.id, await ngay(-30), homNay])).rows;
  ok('Dữ liệu thanh toán: khoản vừa ghi, TK nợ 331 / có 1121', tt.length === 1 && tt[0].tk_no === '331' && tt[0].tk_co === '1121');
  const luuTk = await duoi(UID.keToanA, `select kho_luu_misa_tk($1, $2::jsonb) as v`, [cnA.id, JSON.stringify(docFormMisaTk(form({ tk_co_ncc: '3311' })).tk)]);
  ok('Form mã tài khoản của web → kho_luu_misa_tk nhận', luuTk.loi === null && luuTk.rows[0].v.tk_co_ncc === '3311', luuTk.loi ?? '');
  const tkTk = await duoi(UID.thuKhoA, `select * from kho_du_lieu_misa($1, $2::date, $3::date, 'mua_hang')`, [cnA.id, await ngay(-30), homNay]);
  ok('Thủ kho không lấy được dữ liệu MISA', tkTk.loi !== null);
  await db.close();
});

// ===========================================================================
await nhom('7 · MÃ NGUỒN TRANG, MENU, HƯỚNG DẪN', async () => {
  const trang = {
    ds: doc('cong-no/index.astro'), ncc: doc('cong-no/[id].astro'), tt: doc('cong-no/[id]/tra-tien.astro'),
    gop: doc('cong-no/[id]/hoa-don-gop.astro'), bb: doc('cong-no/[id]/doi-chieu.astro'), misa: doc('cong-no/misa.astro'),
    tra: doc('cong-no/tra-hang.astro'),
  };
  const moi = [trang.tt, trang.gop, trang.bb, trang.misa];
  ok('Trang mới: chặn ke_toan một dòng (test menu đọc được)', moi.every(s => /if \(!k\.duoc\('ke_toan'\)\) return Astro\.redirect\('\/noi-bo\/kho', 302\);/.test(s)));
  ok('Trả hàng: nhap HOẶC ke_toan', /if \(!k\.duoc\('nhap'\) && !k\.duoc\('ke_toan'\)\) return Astro\.redirect/.test(trang.tra));
  const idHd = new Set(MUC_HUONG_DAN.map(m => m.id));
  const neo = { tt: 'ghi-thanh-toan', gop: 'hoa-don-gop', bb: 'doi-chieu-cong-no', misa: 'misa' };
  ok('Nút "?" trỏ mục có thật', Object.entries(neo).every(([k, id]) => trang[k].includes(`huongDan="${id}"`) && idHd.has(id))
     && ['tra-hang', 'tra-ncc'].every(id => idHd.has(id) && trang.tra.includes(`'${id}'`)));
  ok('Form ghi tiền / hóa đơn gộp / ghi kg có ma_gui', /name="ma_gui" value=\{maGui\}/.test(trang.tt) && /name="ma_gui" value=\{maGui\}/.test(trang.gop)
     && /value="ghi_kg"/.test(trang.tra) && /name="ma_gui"/.test(trang.tra));
  ok('Trả tiền: nút Xem trước và Trả đủ, ô gợi ý ẩn', /value="xem_truoc"/.test(trang.tt) && /value="tra_du"/.test(trang.tt) && /_goi_y`\}/.test(trang.tt));
  ok('Công nợ: 4 thẻ, dải công thức, "Xem ví dụ", chip, tìm, phân trang', /'thanh-toan': 'Thanh toán', 'theo-doi': 'Theo dõi'/.test(trang.ds)
     && /Còn phải trả/.test(trang.ds) && /<details>/.test(trang.ds) && /Xem ví dụ/.test(trang.ds) && /CHIP_CONG_NO/.test(trang.ds)
     && /<PhanTrang/.test(trang.ds) && /<LocDanhSach/.test(trang.ds) && /<tfoot>/.test(trang.ds));
  ok('Link cũ ?loc=… không tab vẫn mở danh sách phiếu', /chip \? 'phieu' : 'ncc'/.test(trang.ds));
  ok('Trang NCC: Trả tiền, Đối chiếu hóa đơn gộp, In biên bản, cảnh báo đổi tài khoản', /const TT = `\/noi-bo\/kho\/cong-no\/\$\{ncc\.id\}\/tra-tien`/.test(trang.ncc) && /href=\{TT\}>Trả tiền</.test(trang.ncc)
     && /\/hoa-don-gop`\}>Đối chiếu hóa đơn gộp</.test(trang.ncc) && /\/doi-chieu`\}>In biên bản đối chiếu</.test(trang.ncc) && /doiTaiKhoanGanDay/.test(trang.ncc));
  ok('Phiếu trong hóa đơn gộp không có form đối chiếu lẻ', /p\.hoa_don_gop_id \? \(/.test(trang.ncc));
  ok('Biên bản in được: InDau, KyTen, NutIn', /<InDau /.test(trang.bb) && /<KyTen /.test(trang.bb) && /<NutIn /.test(trang.bb));
  ok('MISA: tải qua misa.csv, route có thật', /cong-no\/misa\.csv\?/.test(trang.misa) && existsSync(join(KHO, 'cong-no', 'misa.csv.ts')));
  // Thủ kho không thấy tiền: khối ghi kg và danh sách lô không in đồng nào.
  const khoiKg = trang.tra.slice(trang.tra.indexOf('HAI BƯỚC · BƯỚC 1'), trang.tra.indexOf('DANH SÁCH: HÀNG CHỜ TIỀN'));
  const khoiLo = trang.tra.slice(trang.tra.indexOf('{(thuKho || keToan) && ('));
  ok('Màn ghi kg và danh sách lô không có tiền', khoiKg.length > 100 && khoiLo.length > 100
     && ![khoiKg, khoiLo].some(s => /dinhDangTien|don_gia|so_tien|giảm trừ|công nợ/i.test(s)));
  ok('Hàng chờ xác nhận tiền chỉ kế toán', /\{keToan && \(\s*<section id="cho-tien"/.test(trang.tra) && /if \(!keToan\) bao/.test(trang.tra));
  ok('Tồn kho có link "Trả NCC" cho người nhận hàng', /cong-no\/tra-hang\?lo=/.test(doc('ton.astro')) && /k\.duoc\('nhap'\)/.test(doc('ton.astro')));
  ok('Không <script>, không bẫy "{x.length && …}"', !Object.values(trang).some(s => /<script/.test(s) || /\{[a-zA-Z.]+\.length && /.test(s)));
  ok('Ô Công nợ có số đỏ tra_hang_cho_tien', KHOA_CONG_NO.includes('tra_hang_cho_tien')
     && MUC_KHO.find(m => m.ma === 'cong_no')?.dem?.includes('tra_hang_cho_tien'));
  ok('Thao tác nhanh: thủ kho "Trả hàng NCC", kế toán "Xuất sang MISA"',
     THAO_TAC_NHANH.thu_kho.some(t => t.link === '/noi-bo/kho/cong-no/tra-hang' && t.quyen.join() === 'nhap')
     && THAO_TAC_NHANH.ke_toan.some(t => t.link === '/noi-bo/kho/cong-no/misa'));
  const nccTrang = doc('cai-dat/nha-cung-cap.astro');
  ok('Cài đặt NCC: kiểu hóa đơn, mã MISA, nhật ký đổi tài khoản', /name="kieu_hoa_don"/.test(nccTrang) && /name="ma_misa"/.test(nccTrang) && /docNhatKyTaiKhoan/.test(nccTrang));
  ok('Form mặt hàng có ô mã MISA', /name="ma_misa"/.test(readFileSync(join(GOC, 'web/src/components/kho/FormMatHang.astro'), 'utf8')));
  ok('misa.ts thuần: không import, không gọi database', !/^import /m.test(readFileSync(join(GOC, 'web/src/lib/kho/misa.ts'), 'utf8'))
     && !/\.rpc\(|\.from\(/.test(readFileSync(join(GOC, 'web/src/lib/kho/misa.ts'), 'utf8')));
  ok('misa.ts có hằng COT_MISA ghi "CHỈNH KHI CÓ FILE MẪU"', /CHỈNH KHI CÓ FILE MẪU/.test(readFileSync(join(GOC, 'web/src/lib/kho/misa.ts'), 'utf8')));
});

process.exit(ketThuc('WEB CÔNG NỢ V2'));
