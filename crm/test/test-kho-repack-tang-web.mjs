/**
 * BEEFTOWN KHO — Kiểm thử web repack, truy vết tảng, báo cáo theo tảng (0048)
 * ==========================================================================
 *
 *     node test/test-kho-repack-tang-web.mjs
 *
 * Hàm thuần: ô "Kg sau repack" ở form nhận hàng và form phiếu nhập đầy đủ,
 * xem trước giá vốn theo kg sau repack (12 kg × 450.000 → 11,8 kg), gợi ý xếp
 * quầy có số tảng, cột báo cáo theo tảng, tìm tảng theo số. Không cần database.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import {
  docFormDongNhan, dongLuuTuPhieu, dongNhanVaoForm, haoRepack, kiemTruocKhiGui, tangChuaRepack,
} from '../../web/src/lib/kho/nhan-hang.ts';
import { docFormPhieuNhap, dongTuPhieu, xemTruocGiaVon } from '../../web/src/lib/kho/nhap.ts';
import { goiYXepQuay } from '../../web/src/lib/kho/trang-chu.ts';
import {
  chuanTruyVet, dinhNghiaTheoTang, dongBangTheoTang, timTangTheoSo,
} from '../../web/src/lib/kho/tang.ts';
import { THE_BAO_CAO_NB } from '../../web/src/lib/kho/bao-cao.ts';
import { MUC_HUONG_DAN as HUONG_DAN } from '../../web/src/lib/kho/huong-dan.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — WEB REPACK · TRUY VẾT TẢNG');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

const TN = '11111111-1111-4111-8111-111111111111';
const NV = '22222222-2222-4222-8222-222222222222';
const mon = new Map([
  [TN, { ten: 'Thăn ngoại nguyên tảng', dem_goi: true, don_vi_goi: 'tảng', theo_tang: true }],
  [NV, { ten: 'Nạc vai', dem_goi: false, don_vi_goi: 'gói' }],
]);
const form = o => ({ get: k => o[k] ?? null });

// ===========================================================================
await nhom('1 · FORM NHẬN HÀNG: KG SAU REPACK', async () => {
  const a = docFormDongNhan(form({ mh: TN, so_kg: '12', kg_thuc: '11,8', ngay_mo: '2026-09-20' }), [], mon);
  ok('12 kg NCC + 11,8 sau repack → lưu so_kg 12, so_kg_thuc 11,8, 1 tảng',
     a.loi.length === 0 && a.luu?.so_kg === 12 && a.luu?.so_kg_thuc === 11.8 && a.luu?.so_goi === 1, JSON.stringify(a));
  const trong = docFormDongNhan(form({ mh: TN, so_kg: '12', ngay_mo: '2026-09-20' }), [], mon);
  ok('Chưa repack (để trống): vẫn lưu nháp được, không có khóa so_kg_thuc',
     trong.loi.length === 0 && !('so_kg_thuc' in (trong.luu ?? {})));
  const vuot = docFormDongNhan(form({ mh: TN, so_kg: '12', kg_thuc: '12,5', ngay_mo: '2026-09-20' }), [], mon);
  ok('Kg sau repack lớn hơn kg NCC quá 1% → báo, có tiếng Anh',
     vuot.luu === null && /lớn hơn kg nhà cung cấp/.test(vuot.loi.join()) && /more than the supplier/.test(vuot.loiEn.join()));
  ok('Sai số cân ≤ 1% được nhận', docFormDongNhan(form({ mh: TN, so_kg: '12', kg_thuc: '12,1', ngay_mo: '2026-09-20' }), [], mon).loi.length === 0);
  ok('Chữ lạ → báo', docFormDongNhan(form({ mh: TN, so_kg: '12', kg_thuc: 'abc', ngay_mo: '2026-09-20' }), [], mon).luu === null);
  ok('Món thường cũng ghi được kg sau repack', docFormDongNhan(form({ mh_khac: NV, so_kg: '5', kg_thuc: '4,9' }), [], mon).luu?.so_kg_thuc === 4.9);

  const dong = { id: 'd1', thu_tu: 1, mat_hang_id: TN, ten_mat_hang: 'Thăn ngoại nguyên tảng', dem_goi: true, don_vi_goi: 'tảng',
    so_goi: 1, so_kg: 12, so_lo_ncc: null, ngay_san_xuat: null, han_dung: null, truong_them: {}, lo_id: null,
    theo_tang: true, ngay_mo: '2026-09-20', so_tang: null, so_kg_thuc: 11.8 };
  ok('Lưu lại cả phiếu giữ kg sau repack', dongLuuTuPhieu(dong).so_kg_thuc === 11.8);
  ok('Sửa dòng: ô điền "11,8"', dongNhanVaoForm(dong).so_kg_thuc === '11,8');
  const h = haoRepack(12, 11.8);
  ok('Hao repack 12 → 11,8: 0,2 kg · 1,67%', h?.kg === 0.2 && h?.pt === 1.67, JSON.stringify(h));
  ok('Chưa ghi kg sau repack → không có hao', haoRepack(12, null) === null);

  const p = { loai: 'mua', nha_cung_cap_id: 'x', so_anh: 1, truong_them: {}, dong: [{ ...dong, so_kg_thuc: null }] };
  const loi = kiemTruocKhiGui(p, [], [], 'vi');
  ok('Xem lại trước khi gửi: nhắc tảng chưa repack', loi.some(x => /chưa có kg sau repack/.test(x)), loi.join());
  ok('Bản tiếng Anh', kiemTruocKhiGui(p, [], [], 'en').some(x => /no weight after repack/.test(x)));
  ok('Đã repack → không nhắc', kiemTruocKhiGui({ ...p, dong: [dong] }, [], [], 'vi').length === 0);
  ok('tangChuaRepack chỉ đếm món theo tảng', tangChuaRepack([{ ...dong, so_kg_thuc: null }, { ...dong, theo_tang: false, so_kg_thuc: null }]).length === 1);
});

// ===========================================================================
await nhom('2 · PHIẾU NHẬP ĐẦY ĐỦ, XEM TRƯỚC GIÁ VỐN', async () => {
  const fd = new FormData();
  fd.set('so_dong', '1');
  fd.set('d0_mat_hang', TN); fd.set('d0_so_kg', '12'); fd.set('d0_so_goi', '1'); fd.set('d0_don_gia', '450.000');
  fd.set('d0_ngay_mo', '2026-09-20'); fd.set('d0_kg_thuc', '11,8');
  const kq = docFormPhieuNhap(fd, [], []);
  ok('Form đầy đủ giữ ngày mổ và kg sau repack (lưu lại không mất)',
     kq.loi.length === 0 && kq.payload[0].ngay_mo === '2026-09-20' && kq.payload[0].so_kg_thuc === 11.8, JSON.stringify(kq));
  const lai = dongTuPhieu([{ id: 'x', thu_tu: 1, mat_hang_id: TN, so_goi: 1, so_kg: 12, don_gia_kg: 450000, thanh_tien: 5400000,
    so_lo_ncc: null, ngay_san_xuat: null, han_dung: '2026-10-20', truong_them: {}, lo_id: null, ngay_mo: '2026-09-20', so_kg_thuc: 11.8 }]);
  ok('Mở lại phiếu: ô ngày mổ, kg sau repack điền sẵn', lai[0].ngay_mo === '2026-09-20' && lai[0].so_kg_thuc === '11,8');

  const gv = xemTruocGiaVon([{ so_kg: 12, thanh_tien: 5400000, so_kg_thuc: 11.8 }, { so_kg: 5, thanh_tien: 1500000, so_kg_thuc: null }], 0, 0, null);
  ok('Giá vốn dự kiến: 5.400.000 / 11,8 = 457.627 đ/kg; dòng không repack giữ 300.000',
     Math.round(gv[0].gia_von_kg) === 457627 && gv[0].gia_tri === 5400000 && gv[1].gia_von_kg === 300000, JSON.stringify(gv));
});

// ===========================================================================
await nhom('3 · GỢI Ý XẾP QUẦY CÓ SỐ TẢNG', async () => {
  const lo = (id, han, con, tt = 'con_han') => ({
    lo_id: id, ma_lo: id, mat_hang_id: 'c', ma_hang: 'C', ten_hang: 'Thăn ngoại cắt lát', nhom: null, loai_hang: 'phan_cat',
    dem_goi: true, don_vi_goi: 'gói', vi_tri_id: 'q', ten_vi_tri: 'Quầy', loai_vi_tri: 'quay', so_kg: 1, so_goi: 2,
    nguon: 'pha_loc', ngay_dong_goi: '2026-09-25', han_dung: han, so_ngay_con: con, tinh_trang_han: tt,
  });
  const ton = [lo('L2', '2026-10-02', 5), lo('L1', '2026-09-29', 2, 'sap_het')];
  const co = goiYXepQuay(ton, 'vi', new Map([['L1', 142], ['L2', 150]]));
  ok('Lô hạn gần (tảng #0142) lên trước, câu dặn có số tảng', co[0]?.truoc.lo_id === 'L1' && co[0].so_tang === 142 && /#0142/.test(co[0].cau), co[0]?.cau);
  ok('Tiếng Anh cũng có số tảng', /primal #0142/.test(goiYXepQuay(ton, 'en', new Map([['L1', 142]]))[0]?.cau ?? ''));
  const khong = goiYXepQuay(ton, 'vi');
  ok('Không có bản đồ số tảng: câu cũ', khong[0]?.so_tang === null && /đóng ngày/.test(khong[0].cau));
});

// ===========================================================================
await nhom('4 · BÁO CÁO THEO TẢNG, TRUY VẾT', async () => {
  const r = {
    lo_id: 'T1', so_tang: 142, ma_lo: 'L-1', mat_hang_id: 'm', ten_hang: 'Thăn ngoại', ten_ncc: 'NCC Úc',
    phieu_nhap_id: null, so_phieu_nhap: 'PN-1', ngay_mo: '2026-09-20', ngay_nhan: '2026-09-26', ngay_u_xong: null,
    han_dung: '2026-10-26', ngay_loc: '2026-09-27', ngay_het: null, kg_ncc: '12.000', kg_repack: '11.800', hao_repack_pt: '1.67',
    kg_vao_loc: '11.800', kg_thit: '9.000', kg_phu_pham: '0', kg_bo: '1.500', kg_hao_hut: '1.300', thu_hoi_pt: '76.27',
    kg_ban: '1', kg_bep: '0', kg_huy: '0', kg_con: '8', ban_pt: '11.1', so_ngay_ban: null, tinh_trang: 'dang_ban',
    don_gia_ncc: null, gia_von_repack_kg: null, gia_von_thit_kg: null,
  };
  const tv = chuanTruyVet({ co_gia: false, tang: r, ton_tang: [], phien: [], lo_ra: [], phieu_huy: [] });
  ok('Số từ database thành number, null giữ null', tv.tang.kg_repack === 11.8 && tv.tang.thu_hoi_pt === 76.27 && tv.tang.don_gia_ncc === null);
  const b = dongBangTheoTang([tv.tang], 'vi')[0];
  ok('Dòng bảng: "#0142", hao repack 0,2 kg, "Đang bán"', b.so_tang_chu === '#0142' && b.kg_hao_repack === 0.2 && b.tinh_trang_chu === 'Đang bán', JSON.stringify(b));
  ok('Tiếng Anh: "Selling"', dongBangTheoTang([tv.tang], 'en')[0].tinh_trang_chu === 'Selling');
  const kg = dinhNghiaTheoTang(false, 'vi').cot;
  const tien = dinhNghiaTheoTang(true, 'vi').cot;
  ok('Vai không xem giá: không có cột tiền; vai xem giá: 3 cột tiền',
     !kg.some(c => c.tienMat) && tien.filter(c => c.tienMat).length === 3);
  ok('Tìm tảng: "142", "#0142", " 0142 " → T1; "abc" → null',
     ['142', '#0142', ' 0142 '].every(x => timTangTheoSo([tv.tang], x) === 'T1') && timTangTheoSo([tv.tang], 'abc') === null);
});

// ===========================================================================
await nhom('5 · TRANG, MENU, HƯỚNG DẪN', async () => {
  ok('Thẻ báo cáo "Theo tảng" mở cho vai xem kho, có CSV', THE_BAO_CAO_NB.some(t => t.ma === 'theo-tang' && t.quyen.includes('xem') && t.csv === 'theo-tang'));
  ok('Hướng dẫn "truy-vet-tang" có', HUONG_DAN.some(h => h.id === 'truy-vet-tang'));
  const trang = doc('web/src/pages/noi-bo/kho/tang/[lo_id].astro');
  ok('Trang tảng dùng huongDan truy-vet-tang, huỷ cả tảng qua huyCaTang, kiểm van_hanh',
     /huongDan="truy-vet-tang"/.test(trang) && /huyCaTang\(/.test(trang) && /duoc\('van_hanh'\)/.test(trang));
  ok('File CSV nhận theo-tang', /ten === 'theo-tang'/.test(doc('web/src/pages/noi-bo/kho/bao-cao/[ten].csv.ts')));
  ok('Form nhận hàng có ô kg_thuc', /name="kg_thuc"/.test(doc('web/src/pages/noi-bo/kho/nhan-hang/[id].astro')));
  ok('Form phiếu nhập đầy đủ có ô ngày mổ, kg sau repack',
     /d\$\{i\}_ngay_mo/.test(doc('web/src/pages/noi-bo/kho/nhap/[id].astro')) && /d\$\{i\}_kg_thuc/.test(doc('web/src/pages/noi-bo/kho/nhap/[id].astro')));
});

process.exit(ketThuc('WEB REPACK · TRUY VẾT TẢNG'));
