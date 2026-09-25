/**
 * BEEFTOWN KHO — Kiểm thử đọc mã vạch nhãn cân, đọc số, ô thông tin thêm
 * =====================================================================
 *
 *     node test/test-kho-ma-vach.mjs
 *
 * Kiểm các hàm thuần trong web/src/lib/kho — không cần database. Node 22 nạp
 * thẳng file .ts (bỏ phần kiểu), nên đây chính là mã chạy trên web.
 *
 * Mã vạch mẫu: cân Dahua TM-A kiểu 2+5+5+1. "2012345012509" nghĩa là: đầu
 * "20", mã hàng "12345", nặng "01250" gram = 1,25 kg, số kiểm tra "9".
 */

import { taoBoDem } from './kho-chung.mjs';
import {
  MAU_MAC_DINH, kiemTraMau, tinhSoKiemTra, laEan13HopLe, docMaVach,
  tachDanhSachMa, gomTheoMaCan,
} from '../../web/src/lib/kho/ma-vach.ts';
import {
  docKg, docTien, docSoNguyen, docNgay, dinhDangKg, dinhDangTien,
  dinhDangThoiDiem, goiYMa, duoc,
} from '../../web/src/lib/kho/chung.ts';
import { docTruongThem, taoKhoa, tachLuaChon, giaTriVaoO } from '../../web/src/lib/kho/truong-them.ts';
import { docFormPhienPha, thuHoiTheoTang } from '../../web/src/lib/kho/pha-loc.ts';
import { docFormPhieuXuat, dongTuQuet, gopDong, tomTatHang } from '../../web/src/lib/kho/xuat.ts';
import { docAnhDaTai, soThuTuCuoi } from '../../web/src/lib/kho/anh.ts';
import { docFormKiemKe, apDungQuet, gopKhiTrung, chuKyDong } from '../../web/src/lib/kho/kiem-ke.ts';
import { taoCsv, kyBaoCao, kyNhanh, tinhTong, tieuDeCsv, BAO_CAO } from '../../web/src/lib/kho/bao-cao.ts';
import { docFormThanhToan } from '../../web/src/lib/kho/cong-no.ts';
import { xemTruocDanMatHang, chuKyDan, dongGhiDan } from '../../web/src/lib/kho/danh-muc.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ MÃ VẠCH VÀ ĐỌC SỐ');

/** Dựng mã EAN-13 hợp lệ từ 12 số đầu. */
const ean = s12 => s12 + tinhSoKiemTra(s12);

// ===========================================================================
await nhom('1 · SỐ KIỂM TRA EAN-13', async () => {
  ok('4006381333931 là mã EAN-13 hợp lệ (mã chuẩn quốc tế)', laEan13HopLe('4006381333931'));
  ok('Sai một chữ số cuối → không hợp lệ', !laEan13HopLe('4006381333932'));
  ok('12 chữ số → không hợp lệ', !laEan13HopLe('400638133393'));
  ok('Có chữ cái → không hợp lệ', !laEan13HopLe('40063813339A1'));
  ok('Tính số kiểm tra của 201234501250 = 9', tinhSoKiemTra('201234501250') === 9);
});

// ===========================================================================
await nhom('2 · MẪU MÃ VẠCH', async () => {
  ok('Mẫu mặc định 2XCCCCCWWWWWK hợp lệ', kiemTraMau(MAU_MAC_DINH));
  ok('Mẫu in thành tiền 2XCCCCCPPPPPK hợp lệ', kiemTraMau('2XCCCCCPPPPPK'));
  ok('Mẫu 12 ký tự bị loại', !kiemTraMau('2XCCCCCWWWWW'));
  ok('Mẫu thiếu số kiểm tra K ở cuối bị loại', !kiemTraMau('2XCCCCCWWWWWW'));
  ok('Mẫu có cả W lẫn P bị loại', !kiemTraMau('2CCCCCWWWPPPK'));
  ok('Mẫu không có mã hàng C bị loại', !kiemTraMau('20XXXXXWWWWWK'));
});

// ===========================================================================
await nhom('3 · ĐỌC NHÃN CÂN', async () => {
  const kq = docMaVach('2012345012509');
  ok('Đọc được mã 2012345012509', kq.hopLe, kq.loi ?? '');
  ok('Mã hàng 12345', kq.maCan === '12345');
  ok('Nặng 1,25 kg', kq.soKg === 1.25, `${kq.soKg}`);

  const soKhong = docMaVach(ean('210001200350'));
  ok('Mã hàng "00012" đọc thành "12" (khớp ma_can lưu không số 0 đầu)', soKhong.hopLe && soKhong.maCan === '12');
  ok('Nặng 350 gram = 0,35 kg', soKhong.soKg === 0.35);

  ok('Quét sót một số (12 số) → báo lỗi', !docMaVach('201234501250').hopLe);
  ok('Sai số kiểm tra → báo "quét lại"', /quét lại/.test(docMaVach('2012345012504').loi ?? ''));
  const khongPhaiCan = docMaVach(ean('893456312345'));
  ok('Mã hàng siêu thị thường (đầu 8) → "không phải nhãn cân"',
     !khongPhaiCan.hopLe && /không phải nhãn cân/i.test(khongPhaiCan.loi), khongPhaiCan.loi);
  ok('Nhãn nặng 0 gram → báo lỗi', !docMaVach(ean('201234500000')).hopLe);
  ok('Mã hàng 00000 → báo lỗi', !docMaVach(ean('200000001250')).hopLe);

  const tien = docMaVach(ean('201234508750'), '2XCCCCCPPPPPK');
  ok('Mẫu in thành tiền: đọc được 8.750', tien.hopLe && tien.thanhTien === 8750 && tien.soKg === null);

  const hai = docMaVach(ean('201234501250'), '2XCCCCCWWWWWK', 2);
  ok('Cân cài 2 số lẻ: 01250 = 12,5 kg', hai.hopLe && hai.soKg === 12.5);
});

// ===========================================================================
await nhom('4 · QUÉT NHIỀU NHÃN MỘT LẦN', async () => {
  const dan = `${ean('201234500310')}\n${ean('201234500290')}\r\n  ${ean('200001200500')} ,${ean('201234500100')}\n\n12345`;
  const ds = tachDanhSachMa(dan);
  ok('Tách đúng 5 mã từ ô dán (xuống dòng, dấu phẩy, khoảng trắng)', ds.length === 5, ds.join(' | '));

  const { theoMa, loi } = gomTheoMaCan(ds);
  const g = theoMa.get('12345');
  ok('Gom 3 gói mã 12345', g?.soGoi === 3);
  ok('Tổng 0,31 + 0,29 + 0,1 = 0,7 kg đúng tuyệt đối (cộng theo gram)', g?.soKg === 0.7, `${g?.soKg}`);
  ok('Mã 12: 1 gói 0,5 kg', theoMa.get('12')?.soGoi === 1 && theoMa.get('12')?.soKg === 0.5);
  ok('Mã hỏng được liệt kê riêng, không làm hỏng cả mẻ', loi.length === 1 && loi[0].ma === '12345');
});

// ===========================================================================
await nhom('5 · ĐỌC SỐ KIỂU VIỆT', async () => {
  ok('"1,5" kg = 1,5', docKg('1,5') === 1.5);
  ok('"1.5" kg = 1,5', docKg('1.5') === 1.5);
  ok('"1.250" kg = 1,25 (không phải 1250)', docKg('1.250') === 1.25);
  ok('"12" kg = 12', docKg('12') === 12);
  ok('"0,35 kg" = 0,35', docKg('0,35 kg') === 0.35);
  ok('"1,2345" kg (4 số lẻ) → sai', Number.isNaN(docKg('1,2345')));
  ok('Ô trống → null', docKg('  ') === null);
  ok('"-2" kg → sai', Number.isNaN(docKg('-2')));

  ok('"450.000đ" = 450000', docTien('450.000đ') === 450000);
  ok('"450,000" = 450000', docTien('450,000') === 450000);
  ok('"1 250 000" = 1250000', docTien('1 250 000') === 1250000);
  ok('"12a" → sai', Number.isNaN(docTien('12a')));
  ok('Số nguyên trong khoảng', docSoNguyen('7', 0, 10) === 7 && Number.isNaN(docSoNguyen('11', 0, 10)));

  ok('Ngày 2026-02-28 hợp lệ', docNgay('2026-02-28') === '2026-02-28');
  ok('Ngày 2026-02-30 không có thật', docNgay('2026-02-30') === undefined);

  ok('Hiện kg: 1.25 → "1,25"', dinhDangKg(1.25) === '1,25');
  ok('Hiện tiền: 450000 → "450.000 đ"', dinhDangTien(450000) === '450.000 đ');
  ok('Thời điểm UTC 07:30 → 14:30 giờ Việt Nam', dinhDangThoiDiem('2026-09-25T07:30:00Z') === '25/09 14:30');
  ok('Gợi ý mã "Thăn ngoại cắt lát" → "THAN-NGOAI-CAT-LAT"', goiYMa('Thăn ngoại cắt lát') === 'THAN-NGOAI-CAT-LAT');
  ok('Gợi ý mã "Đùi bò" → "DUI-BO"', goiYMa('Đùi bò') === 'DUI-BO');
  ok('Gương quyền: NV quầy không có xem_gia', !duoc('nhan_vien_quay', 'xem_gia') && duoc('thu_kho', 'xem_gia'));
});

// ===========================================================================
await nhom('6 · Ô THÔNG TIN THÊM TỪ FORM', async () => {
  const dn = [
    { khoa: 'xuat_xu', nhan: 'Xuất xứ', kieu: 'chon', lua_chon: ['Úc', 'Mỹ'], dang_dung: true },
    { khoa: 'nhiet_do', nhan: 'Nhiệt độ', kieu: 'so', lua_chon: [], dang_dung: true },
    { khoa: 'ngay_giet_mo', nhan: 'Ngày giết mổ', kieu: 'ngay', lua_chon: [], dang_dung: true },
    { khoa: 'xe_lanh', nhan: 'Xe lạnh', kieu: 'co_khong', lua_chon: [], dang_dung: true },
    { khoa: 'ghi_chu_cu', nhan: 'Ô đã tắt', kieu: 'chu', lua_chon: [], dang_dung: false },
  ];
  const form = new Map([
    ['tt__xuat_xu__2', 'Úc'], ['tt__nhiet_do__2', '2,5'], ['tt__ngay_giet_mo__2', '2026-09-01'],
    ['tt__xe_lanh__2', 'khong'], ['tt__ghi_chu_cu__2', 'không được đọc'],
  ]);
  const { giaTri, loi } = docTruongThem(form, dn, 2, { ghi_chu_cu: 'giá trị cũ' });
  ok('Đọc đúng các ô của dòng 2', loi.length === 0 && giaTri.xuat_xu === 'Úc'
     && giaTri.nhiet_do === 2.5 && giaTri.ngay_giet_mo === '2026-09-01' && giaTri.xe_lanh === false,
     JSON.stringify({ giaTri, loi }));
  ok('Ô đã tắt giữ giá trị cũ, không đọc từ form', giaTri.ghi_chu_cu === 'giá trị cũ');

  const sai = docTruongThem(new Map([['tt__xuat_xu', 'Pháp'], ['tt__nhiet_do', 'lạnh']]), dn);
  ok('Giá trị sai được báo bằng tiếng Việt', sai.loi.length === 2, sai.loi.join(' · '));

  ok('Tên máy từ "Nhiệt độ khi nhận (°C)"', taoKhoa('Nhiệt độ khi nhận (°C)') === 'nhiet_do_khi_nhan_c');
  ok('Trùng tên máy thì thêm _2', taoKhoa('Grade', ['grade']) === 'grade_2');
  ok('Tên bắt đầu bằng số vẫn hợp lệ', /^[a-z]/.test(taoKhoa('3 sao')));
  ok('Tách lựa chọn theo dòng và dấu phẩy, bỏ trùng', tachLuaChon('Úc, Mỹ\nNhật\nÚc').join('|') === 'Úc|Mỹ|Nhật');
  ok('Có/không điền lại vào ô chọn', giaTriVaoO(dn[3], false) === 'khong' && giaTriVaoO(dn[3], undefined) === '');
});

// Mã giả cho các nhóm dưới — đúng dạng uuid là đủ.
const U = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const MH_TEST = [
  { id: U(1), ten: 'Thăn cắt lát', dem_goi: true, ma_can: '101', dang_dung: true },
  { id: U(2), ten: 'Thịt vụn', dem_goi: false, ma_can: '201', dang_dung: true },
  { id: U(3), ten: 'Gầu cắt lát', dem_goi: true, ma_can: null, dang_dung: true },
];
const nhan = (maCan, gram) => ean(`20${String(maCan).padStart(5, '0')}${String(gram).padStart(5, '0')}`);

// ===========================================================================
await nhom('7 · FORM PHA LÓC', async () => {
  const f = new Map([
    ['ngay_pha', '2026-09-25'], ['so_vao', '3'], ['so_ra', '4'],
    // Lô 0: tích, bỏ trống kg = lấy hết. Lô 1: không tích, không gõ → bỏ qua.
    ['v0_lo', U(10)], ['v0_vi_tri', U(20)], ['v0_dung', 'co'],
    ['v1_lo', U(11)], ['v1_vi_tri', U(20)],
    // Lô 2: quên tích nhưng có gõ kg → coi như dùng.
    ['v2_lo', U(12)], ['v2_vi_tri', U(20)], ['v2_so_kg', '4,5'], ['v2_so_goi', '1'],
    ['r0_mat_hang', U(1)], ['r0_so_kg', '7,25'], ['r0_so_goi', '14'], ['r0_xu_ly', 'nhap_kho'], ['r0_vi_tri', U(21)],
    ['r1_mat_hang', U(2)], ['r1_so_kg', '1'], ['r1_xu_ly', ''],
    ['r2_mat_hang', U(3)], ['r2_so_kg', '2'], ['r2_xoa', 'co'],
  ]);
  const d = docFormPhienPha(f);
  ok('Không có lỗi', d.loi.length === 0, d.loi.join(' · '));
  ok('Hai lô đầu vào: lô tích (lấy hết, không gửi kg) và lô có gõ kg',
     d.payloadVao.length === 2 && !('so_kg' in d.payloadVao[0]) && d.payloadVao[1].so_kg === 4.5 && d.payloadVao[1].so_goi === 1,
     JSON.stringify(d.payloadVao));
  ok('Dòng "Bỏ dòng này" và dòng trống bị bỏ qua', d.payloadRa.length === 2);
  ok('Đọc kg có dấu phẩy, gói, xử lý, nơi để',
     d.payloadRa[0].so_kg === 7.25 && d.payloadRa[0].so_goi === 14 && d.payloadRa[0].xu_ly === 'nhap_kho' && d.payloadRa[0].vi_tri_id === U(21));
  ok('Xử lý bỏ trống → không gửi (database dùng mặc định của mặt hàng)', !('xu_ly' in d.payloadRa[1]));

  const sai = docFormPhienPha(new Map([['so_ra', '1'], ['r0_mat_hang', U(1)], ['r0_so_kg', 'bảy']]));
  ok('Kg gõ sai được báo, nêu số dòng', sai.loi.some(x => /Phần ra 1: số kg/.test(x)), sai.loi.join(' · '));
  const thieu = docFormPhienPha(new Map([['so_ra', '1'], ['r0_so_kg', '2']]));
  ok('Có kg mà chưa chọn mặt hàng → báo', thieu.loi.some(x => /chưa chọn mặt hàng/.test(x)));

  const tk = thuHoiTheoTang([
    { trang_thai: 'da_chot', mat_hang_vao_id: 'a', ten_mat_hang_vao: 'Thăn', tong_kg_vao: 10, tong_kg_thit: 7 },
    { trang_thai: 'da_chot', mat_hang_vao_id: 'a', ten_mat_hang_vao: 'Thăn', tong_kg_vao: 30, tong_kg_thit: 24 },
    { trang_thai: 'nhap', mat_hang_vao_id: 'a', ten_mat_hang_vao: 'Thăn', tong_kg_vao: null, tong_kg_thit: null },
  ]);
  ok('Thu hồi bình quân theo kg (31/40 = 77,5%), không phải trung bình cộng (75%)',
     tk.length === 1 && tk[0].so_phien === 2 && tk[0].ty_le === 77.5, JSON.stringify(tk));
});

// ===========================================================================
await nhom('8 · FORM CHUYỂN / XUẤT / HỦY VÀ QUÉT NHÃN', async () => {
  const f = new Map([
    ['so_dong', '3'], ['so_lo', '2'],
    ['d0_mat_hang', U(1)], ['d0_so_goi', '3'], ['d0_so_kg', '1,52'],
    ['d1_mat_hang', U(2)], ['d1_so_kg', '0,8'],
    ['l0_lo', U(30)], ['l0_mat_hang', U(3)], ['l0_so_goi', '2'],
    ['l1_lo', U(31)], ['l1_mat_hang', U(1)],
  ]);
  const d = docFormPhieuXuat(f, MH_TEST);
  ok('Không có lỗi', d.loi.length === 0, d.loi.join(' · '));
  ok('Ba dòng gửi đi: 2 theo mặt hàng + 1 theo lô (lô để trống bị bỏ qua)', d.payload.length === 3, JSON.stringify(d.payload));
  ok('Hàng đếm gói: gửi số gói và kg quét được', d.payload[0].so_goi === 3 && d.payload[0].so_kg === 1.52);
  ok('Hàng theo kg: chỉ gửi kg', d.payload[1].so_kg === 0.8 && !('so_goi' in d.payload[1]));
  ok('Dòng theo lô mang lo_id', d.payload[2].lo_id === U(30) && d.payload[2].so_goi === 2);

  const haiCho = docFormPhieuXuat(new Map([
    ['so_dong', '1'], ['so_lo', '1'],
    ['d0_mat_hang', U(1)], ['d0_so_goi', '2'],
    ['l0_lo', U(30)], ['l0_mat_hang', U(1)], ['l0_so_goi', '2'],
  ]), MH_TEST);
  ok('Cùng một món ghi ở cả hai phần → chặn (không trừ kho hai lần)',
     haiCho.loi.some(x => x === 'Thăn cắt lát được ghi ở cả hai phần — chỉ ghi một chỗ'), haiCho.loi.join(' · '));

  const thieuGoi = docFormPhieuXuat(new Map([['so_dong', '1'], ['d0_mat_hang', U(1)], ['d0_so_kg', '1']]), MH_TEST);
  ok('Hàng đếm gói mà chỉ ghi kg → báo thiếu số gói', thieuGoi.loi.some(x => /chưa nhập số gói/.test(x)));

  const ma = [nhan(101, 512), nhan(101, 498), nhan(201, 1250), nhan(999, 300), '2012345012500'].join('\n');
  const q = dongTuQuet(ma, MH_TEST);
  ok('Đọc 5 mã', q.soMa === 5);
  const than = q.dong.find(x => x.mat_hang_id === U(1));
  ok('Hai nhãn thăn → 2 gói, 1,01 kg (cộng theo gram)', than?.so_goi === '2' && than?.so_kg === '1,01', JSON.stringify(than));
  ok('Nhãn thịt vụn → 1,25 kg', q.dong.find(x => x.mat_hang_id === U(2))?.so_kg === '1,25');
  ok('Mã cân chưa gắn mặt hàng → báo bằng chữ thường, không đoán',
     q.soGoiLa === 1 && q.maCanLa.includes('999') && q.loi.includes('1 gói không nhận ra món — để riêng, báo quản lý'), q.loi.join(' · '));
  ok('Mã sai số kiểm tra → "1 nhãn không đọc được"', q.soNhanHong === 1 && q.loi.includes('1 nhãn không đọc được — quét lại gói đó'));
  ok('Câu cho nhân viên không nhắc Cài đặt', q.loi.every(x => !/Cài đặt/.test(x)));
  ok('Đọc được 3 nhãn thành dòng hàng', q.soDoc === 3);
  ok('Tóm tắt bằng chữ: số gói + tên + kg', tomTatHang(q.dong, MH_TEST) === '2 gói Thăn cắt lát (1,01 kg), 1,25 kg Thịt vụn', tomTatHang(q.dong, MH_TEST));

  const cnA = U(50), guiA = U(51);
  const fa = new FormData();
  for (const v of [`${cnA}/huy/${guiA}/1.jpg`, `${cnA}/huy/${guiA}/1.jpg`, `${cnA}/huy/${U(52)}/1.jpg`,
                   `${U(53)}/huy/${guiA}/2.jpg`, `${cnA}/nhap/${guiA}/3.jpg`, `${cnA}/huy/${guiA}/../x.jpg`, `${cnA}/huy/${guiA}/2.png`]) {
    fa.append('anh_da_tai', v);
  }
  const giu = docAnhDaTai(fa, cnA, 'huy', guiA, 8);
  ok('Ảnh báo hủy giữ qua lần gửi: chỉ nhận ảnh đúng chi nhánh, đúng lần gửi, không trùng',
     giu.length === 2 && giu[0] === `${cnA}/huy/${guiA}/1.jpg` && giu[1] === `${cnA}/huy/${guiA}/2.png`, JSON.stringify(giu));
  const giuNhap = docAnhDaTai(fa, cnA, 'nhap', guiA, 24);
  ok('Phiếu nhập dùng chung hàm: chỉ nhận ảnh thư mục nhap/ của đúng lần gửi', giuNhap.length === 1 && giuNhap[0] === `${cnA}/nhap/${guiA}/3.jpg`, JSON.stringify(giuNhap));
  ok('Ảnh mới đánh số tiếp sau ảnh đã tải (không đè)', soThuTuCuoi(giu) === 2 && soThuTuCuoi([]) === 0);

  const gop = gopDong([{ mat_hang_id: U(1), so_goi: '1', so_kg: '0,5' }, { mat_hang_id: '', so_goi: '', so_kg: '' }], q.dong);
  const g1 = gop.find(x => x.mat_hang_id === U(1));
  ok('Quét thêm vào dòng đang có: cộng dồn gói và kg', g1?.so_goi === '3' && g1?.so_kg === '1,51', JSON.stringify(g1));
  ok('Dòng trống bị bỏ khi gộp', gop.every(x => x.mat_hang_id));
});

// ===========================================================================
await nhom('9 · FORM KIỂM KÊ VÀ QUÉT HẾT GÓI Ở QUẦY', async () => {
  const f = new Map([
    ['so_dong', '2'],
    ['k0_mh', U(1)], ['k0_goi', '4'],
    ['k1_mh', U(2)], ['k1_kg', '0'], ['k1_het', 'co'],
    ['them_mat_hang', U(3)], ['them_goi', '2'],
  ]);
  const d = docFormKiemKe(f, MH_TEST);
  ok('Không có lỗi', d.loi.length === 0, d.loi.join(' · '));
  ok('Ba dòng: hai dòng có sẵn + dòng thêm tay', d.payload.length === 3);
  ok('Đếm 0 kg kèm xác nhận hết', d.payload[1].so_kg_dem === 0 && d.payload[1].xac_nhan_het === true);
  ok('Dòng thêm tay: 2 gói gầu', d.payload[2].mat_hang_id === U(3) && d.payload[2].so_goi_dem === 2);
  ok('Ô bỏ trống không gửi số (khác với 0)', !('so_kg_dem' in d.payload[0]));

  const q = apDungQuet(d.dong, [nhan(101, 500), nhan(101, 520), nhan(101, 480)].join(','), MH_TEST);
  const than = q.dong.find(x => x.mat_hang_id === U(1));
  ok('Quét 3 nhãn thăn → ĐÈ số đếm: 3 gói, 1,5 kg', than?.goi === '3' && than?.kg === '1,5', JSON.stringify(than));
  ok('Mặt hàng không quét giữ nguyên số đã ghi', q.dong.find(x => x.mat_hang_id === U(2))?.het === true);
  ok('Đếm được 1 mặt hàng từ 3 mã', q.soMa === 3 && q.soHang === 1);

  // Tích "Đã hết thật", ô để trống = 0 (một lần chạm). Tích mà vẫn ghi số → báo, không đoán.
  const het = docFormKiemKe(new Map([
    ['so_dong', '3'], ['k0_mh', U(1)], ['k0_het', 'co'], ['k1_mh', U(2)], ['k1_het', 'co'],
    ['k2_mh', U(3)], ['k2_goi', '2'], ['k2_het', 'co'],
  ]), MH_TEST);
  ok('Tích hết, ô gói trống → gửi 0 gói', het.payload[0].so_goi_dem === 0 && !('so_kg_dem' in het.payload[0]), JSON.stringify(het.payload[0]));
  ok('Tích hết, món cân kg, ô trống → gửi 0 kg', het.payload[1].so_kg_dem === 0);
  ok('Tích hết mà vẫn ghi 2 gói → báo lỗi', het.loi.length === 1 && /Gầu cắt lát/.test(het.loi[0]), het.loi.join(' · '));

  // Quét: chữ thường cho nhân viên, bỏ tích "hết" khi quét thấy gói.
  const q2 = apDungQuet([{ mat_hang_id: U(1), lo_id: '', goi: '0', kg: '', het: true }],
    [nhan(101, 500), nhan(999, 300), '2012345012500'].join('\n'), MH_TEST);
  const than2 = q2.dong.find(x => x.mat_hang_id === U(1));
  ok('Quét thấy gói → bỏ tích "Đã hết thật"', than2?.goi === '1' && than2?.het === false, JSON.stringify(than2));
  ok('Đếm nhãn đọc được / hỏng / lạ', q2.soDoc === 1 && q2.soNhanHong === 1 && q2.soGoiLa === 1);
  ok('Câu báo không có mã số, không bảo vào Cài đặt',
     q2.loi.length === 2 && q2.loi.every(x => !/\d{3,}|Cài đặt|Mã cân/.test(x)), q2.loi.join(' · '));
  ok('Tóm tắt nhãn đọc được bằng tên món', /1 gói Thăn cắt lát/.test(q2.tomTat), q2.tomTat);

  // Hai người cùng đếm: máy kia lưu trước. Dòng mình không sửa lấy số mới,
  // dòng mình sửa giữ lại, cùng sửa khác nhau thì lấy số máy kia.
  const goc = (goi, kg = '', het = false) => chuKyDong({ goi, kg, het });
  const cuaToi = [
    { mat_hang_id: U(1), lo_id: '', goi: '', kg: '', het: false, goc: goc('') },    // mình không đụng
    { mat_hang_id: U(2), lo_id: '', goi: '', kg: '1,2', het: false, goc: goc('') }, // mình ghi 1,2 kg
    { mat_hang_id: U(3), lo_id: '', goi: '4', kg: '', het: false, goc: goc('') },   // cả hai cùng ghi
  ];
  const moiNhat = [
    { mat_hang_id: U(1), lo_id: '', goi: '5', kg: '', het: false },                 // máy kia ghi 5
    { mat_hang_id: U(2), lo_id: '', goi: '', kg: '', het: false },
    { mat_hang_id: U(3), lo_id: '', goi: '6', kg: '', het: false },
  ];
  const g = gopKhiTrung(cuaToi, moiNhat);
  ok('Dòng mình không sửa → lấy số máy kia (không đè về trống)', g.dong[0].goi === '5');
  ok('Dòng mình sửa, máy kia không → giữ số của mình', g.dong[1].kg === '1,2' && g.giu === 1);
  ok('Cùng sửa khác nhau → lấy số máy kia, báo dòng đó', g.dong[2].goi === '6' && g.trung.length === 1);
  ok('Dòng sau khi gộp mang số gốc mới (lần lưu sau so đúng bản mới)', g.dong.every(d => d.goc === chuKyDong(moiNhat.find(m => m.mat_hang_id === d.mat_hang_id))));
});

// ===========================================================================
await nhom('10 · CSV CHO EXCEL TIẾNG VIỆT, KỲ BÁO CÁO, FORM THANH TOÁN', async () => {
  const csv = taoCsv(
    [{ khoa: 'ten', ten: 'Mặt hàng', kieu: 'chu' }, { khoa: 'kg', ten: 'Kg', kieu: 'kg' }, { khoa: 'tien', ten: 'Tiền', kieu: 'tien' }],
    [{ ten: 'Thăn; loại "A"', kg: 1.25, tien: 450000.4 }, { ten: '=HYPERLINK("x")', kg: 0, tien: null }]);
  ok('CSV mở đầu bằng BOM (Excel đọc đúng tiếng Việt)', csv.charCodeAt(0) === 0xFEFF);
  const dong = csv.slice(1).split('\r\n');
  ok('Dấu chấm phẩy ngăn cột, dòng CRLF', dong[0] === 'Mặt hàng;Kg;Tiền', dong[0]);
  ok('Ô có ; và " được bọc ngoặc kép; kg dùng dấu phẩy; tiền là số nguyên',
     dong[1] === '"Thăn; loại ""A""";1,25;450000', dong[1]);
  ok('Ô chữ bắt đầu bằng = bị vô hiệu (chống chèn công thức)', dong[2].startsWith("'=HYPERLINK") || dong[2].startsWith(`"'=HYPERLINK`), dong[2]);
  ok('Ô trống để trống', dong[2].endsWith(';0;'), dong[2]);

  const ky = kyBaoCao(new URLSearchParams(''), '2026-09-25');
  ok('Kỳ mặc định: đầu tháng tới hôm nay', ky.tu === '2026-09-01' && ky.den === '2026-09-25');
  const nguoc = kyBaoCao(new URLSearchParams('tu=2026-09-20&den=2026-09-01'), '2026-09-25');
  ok('Gõ ngược từ/đến thì tự đổi chỗ', nguoc.tu === '2026-09-01' && nguoc.den === '2026-09-20');
  const sai = kyBaoCao(new URLSearchParams('tu=hom-qua&den=2026-02-30x'), '2026-09-25');
  ok('Ngày sai dạng → dùng mặc định', sai.tu === '2026-09-01' && sai.den === '2026-09-25');
  const khongCo = kyBaoCao(new URLSearchParams('tu=2026-02-30&den=2026-04-31'), '2026-09-25');
  ok('Ngày không có thật (30/02, 31/04) → dùng mặc định, không gửi database', khongCo.tu === '2026-09-01' && khongCo.den === '2026-09-25', JSON.stringify(khongCo));
  ok('Có đủ bốn báo cáo', ['xuat-nhap-ton', 'thu-hoi', 'hao-hut', 'ban'].every(t => BAO_CAO[t]));
  ok('Báo cáo trống nói việc gì sinh ra số liệu, có link tới chỗ làm',
     Object.values(BAO_CAO).every(b => b.khiTrong.cau && b.khiTrong.link.length > 0 && b.khiTrong.link.every(l => l.href.startsWith('/noi-bo/kho/'))));

  // Chọn nhanh kỳ: Hôm nay · 7 ngày · Tháng này · Tháng trước.
  const nhanh = Object.fromEntries(kyNhanh('2026-09-25').map(x => [x.ten, `${x.tu}..${x.den}`]));
  ok('Chọn nhanh kỳ (25/09)', nhanh['Hôm nay'] === '2026-09-25..2026-09-25' && nhanh['7 ngày'] === '2026-09-19..2026-09-25'
     && nhanh['Tháng này'] === '2026-09-01..2026-09-25' && nhanh['Tháng trước'] === '2026-08-01..2026-08-31', JSON.stringify(nhanh));
  const dauNam = Object.fromEntries(kyNhanh('2026-01-03').map(x => [x.ten, `${x.tu}..${x.den}`]));
  ok('Tháng trước của tháng 1 là tháng 12 năm trước; 7 ngày lùi qua năm cũ',
     dauNam['Tháng trước'] === '2025-12-01..2025-12-31' && dauNam['7 ngày'] === '2025-12-28..2026-01-03', JSON.stringify(dauNam));
  ok('Tháng trước của tháng 3 kết thúc 28/02', kyNhanh('2026-03-10').find(x => x.ten === 'Tháng trước')?.den === '2026-02-28');
  ok('Link chọn nhanh đọc lại đúng kỳ', kyNhanh('2026-09-25').every(x => {
    const k2 = kyBaoCao(new URLSearchParams({ tu: x.tu, den: x.den }), '2026-09-25');
    return k2.tu === x.tu && k2.den === x.den;
  }));

  // Dòng tổng: trang và file Excel dùng chung tinhTong.
  const xnt = tinhTong(BAO_CAO['xuat-nhap-ton'], [
    { ten: 'Thăn', dau_kg: 0.1, dau_gia_tri: 100000, cuoi_kg: 1.2, cuoi_gia_tri: 300000 },
    { ten: 'Gầu', dau_kg: 0.2, dau_gia_tri: 50000, cuoi_kg: null, cuoi_gia_tri: 200000 },
  ]);
  ok('Tổng cộng cả kg và tiền, kg làm tròn (0,1 + 0,2 = 0,3)', xnt.length === 1 && xnt[0].nhan === 'Tổng'
     && xnt[0].so.dau_kg === 0.3 && xnt[0].so.dau_gia_tri === 150000 && xnt[0].so.cuoi_kg === 1.2 && xnt[0].so.cuoi_gia_tri === 500000, JSON.stringify(xnt));
  ok('Không có dòng thì không có dòng tổng', tinhTong(BAO_CAO['xuat-nhap-ton'], []).length === 0);
  const th = tinhTong(BAO_CAO['thu-hoi'], [
    { ten_mat_hang: 'Thăn ngoại', kg_vao: 10, kg_thit: 7, ty_le_thu_hoi: 70, so_phien: 2, gia_von_vao_kg: 300000 },
    { ten_mat_hang: 'Nạm', kg_vao: 30, kg_thit: 15, ty_le_thu_hoi: 50, so_phien: 1, gia_von_vao_kg: 200000 },
  ]);
  ok('Thu hồi chung tính lại theo kg (22 ÷ 40 = 55%), không cộng %; số phiên và giá/kg để trống',
     th[0].so.ty_le_thu_hoi === 55 && th[0].so.kg_vao === 40 && !('so_phien' in th[0].so) && !('gia_von_vao_kg' in th[0].so), JSON.stringify(th));
  const hh = tinhTong(BAO_CAO['hao-hut'], [
    { loai_dong: 'Hủy', ten: 'Thăn', so_kg: 1.5, so_goi: 3, gia_tri: 450000 },
    { loai_dong: 'Hủy', ten: 'Gầu', so_kg: 0.5, so_goi: 0, gia_tri: 100000 },
    { loai_dong: 'Kiểm kê thừa', ten: 'Gầu', so_kg: 0.2, so_goi: 0, gia_tri: 40000 },
  ]);
  ok('Hủy / xuất bếp / chênh lệch: cộng riêng từng loại, thừa không cộng lẫn với hủy',
     hh.length === 2 && hh[0].nhan === 'Cộng Hủy' && hh[0].so.gia_tri === 550000 && hh[0].so.so_kg === 2
     && hh[1].nhan === 'Cộng Kiểm kê thừa' && hh[1].so.gia_tri === 40000, JSON.stringify(hh));

  // File báo cáo: dòng đầu chi nhánh + kỳ, dòng cuối tổng; vẫn BOM, ;, CRLF, dấu phẩy thập phân.
  const tieuDe = tieuDeCsv('Beeftown Quận 1', 'Xuất – nhập – tồn', '2026-09-01', '2026-09-25');
  ok('Dòng đầu: chi nhánh · báo cáo · kỳ', tieuDe === 'Beeftown Quận 1 · Xuất – nhập – tồn · 01/09/2026–25/09/2026', tieuDe);
  ok('Kỳ một ngày ghi một ngày', tieuDeCsv('Beeftown Quận 1', 'Bán (ước tính)', '2026-09-25', '2026-09-25').endsWith('· 25/09/2026'));
  const cotT = [{ khoa: 'ten', ten: 'Mặt hàng', kieu: 'chu' }, { khoa: 'kg', ten: 'Kg', kieu: 'kg' },
                { khoa: 'gia', ten: 'Giá/kg', kieu: 'tien' }, { khoa: 'tien', ten: 'Tiền', kieu: 'tien' }];
  const csvT = taoCsv(cotT, [{ ten: 'Thăn', kg: 1.25, gia: 360000, tien: 450000 }, { ten: 'Gầu', kg: 0.5, gia: 200000, tien: 100000 }],
    { tieuDe: '=Beeftown; Q1', tong: [{ nhan: 'Tổng', so: { kg: 1.75, tien: 550000 } }] });
  const dongT = csvT.slice(1).split('\r\n');
  ok('File có BOM và kết thúc bằng CRLF', csvT.charCodeAt(0) === 0xFEFF && csvT.endsWith('\r\n'));
  ok('Dòng 1 là tiêu đề (vẫn chặn công thức, vẫn bọc ô có ;)', dongT[0] === `"'=Beeftown; Q1"`, dongT[0]);
  ok('Dòng 2 là tên cột', dongT[1] === 'Mặt hàng;Kg;Giá/kg;Tiền', dongT[1]);
  ok('Dòng cuối là tổng: kg dấu phẩy, cột không cộng để trống', dongT[4] === 'Tổng;1,75;;550000' && dongT[5] === '', dongT[4]);
  ok('Không truyền tiêu đề / tổng → file như cũ (dòng 1 là tên cột)', csv.slice(1).split('\r\n')[0] === 'Mặt hàng;Kg;Tiền');

  const f = new Map([
    ['so_tien', '5.450.000'], ['hinh_thuc', 'chuyen_khoan'], ['ngay', '2026-09-25'], ['so_pb', '2'],
    ['pb0_phieu', U(40)], ['pb0_tien', '5.000.000'], ['pb1_phieu', U(41)], ['pb1_tien', '450.000'],
  ]);
  const t = docFormThanhToan(f);
  ok('Đọc số tiền "5.450.000" và hai dòng chia', t.loi.length === 0 && t.soTien === 5450000 && t.phanBo.length === 2, t.loi.join(' · '));
  const lech = docFormThanhToan(new Map([['so_tien', '1.000.000'], ['so_pb', '1'], ['pb0_phieu', U(40)], ['pb0_tien', '900.000']]));
  ok('Tổng chia khác số tiền → báo ngay, không gửi', lech.loi.some(x => /phải bằng số tiền trả/.test(x)), lech.loi.join(' · '));
  const trong = docFormThanhToan(new Map([['so_tien', '1.000.000'], ['so_pb', '2'], ['pb0_phieu', U(40)], ['pb1_phieu', U(41)]]));
  ok('Để trống phần chia → không gửi phân bổ (database tự chia theo hạn)', trong.loi.length === 0 && trong.phanBo.length === 0);
  const am = docFormThanhToan(new Map([['so_tien', '-5']]));
  ok('Số tiền không hợp lệ → báo', am.loi.length > 0);
});

// ===========================================================================
await nhom('11 · DÁN DANH MỤC MẶT HÀNG TỪ EXCEL (XEM TRƯỚC)', async () => {
  const mh = (id, ma, ten, loai, them = {}) => ({
    id: U(id), ma, ten, loai, nhom: null, han_dung_ngay: null, gia_ban_kg: null, ma_can: null,
    ton_toi_thieu_kg: null, dem_goi: true, don_vi_goi: loai === 'tang' ? 'tảng' : 'gói', dang_dung: true, ...them,
  });
  const DA_CO = [
    mh(1, 'C-THANNGOAI', 'Thăn ngoại cắt lát', 'phan_cat',
       { nhom: 'Thăn', han_dung_ngay: 3, gia_ban_kg: 650000, ma_can: '101', ton_toi_thieu_kg: 2, don_vi_goi: 'khay' }),
    mh(2, 'T-NACVAI', 'Nạc vai nguyên tảng', 'tang', { nhom: 'Vai', han_dung_ngay: 30 }),
    mh(3, 'THAN', 'Thăn bò Úc', 'tang'),
    mh(4, 'C-GAU-1', 'Gầu cắt lát', 'phan_cat', { dang_dung: false }),
    mh(5, 'C-GAU-2', 'Gầu cắt lát', 'phan_cat', { ma_can: '105' }),
  ];

  // Ô trống = giữ giá trị cũ (bản cũ gửi null và đè mất giá, hạn, mã cân).
  const giu = xemTruocDanMatHang(DA_CO, 'Thăn ngoại cắt lát\t\t\t\t700.000');
  const s1 = giu.sua[0];
  ok('Chỉ ghi giá → 1 cập nhật, không thêm mới', giu.loi.length === 0 && giu.sua.length === 1 && giu.them.length === 0, giu.loi.join(' · '));
  ok('Chỉ cột giá đổi', s1?.cot_doi.join() === 'gia_ban_kg' && s1.sau.gia_ban_kg === 700000, JSON.stringify(s1?.cot_doi));
  ok('Ô trống giữ hạn dùng, mã cân, nhóm, quầy tối thiểu',
     s1?.sau.han_dung_ngay === 3 && s1.sau.ma_can === '101' && s1.sau.nhom === 'Thăn' && s1.sau.ton_toi_thieu_kg === 2);
  ok('Không đụng cách đếm và đơn vị đếm', s1?.sau.dem_goi === true && s1.sau.don_vi_goi === 'khay');

  // Khớp theo tên khi không có cột Mã: bỏ dấu, hoa thường, khoảng trắng.
  const ten = xemTruocDanMatHang(DA_CO, 'THAN NGOAI   cat LAT\tphần cắt\tThăn\t3');
  ok('Tên không dấu / viết hoa vẫn khớp mặt hàng cũ, không sinh hàng trùng',
     ten.them.length === 0 && ten.sua.length === 0 && ten.giu === 1, JSON.stringify(ten));
  const ten2 = xemTruocDanMatHang(DA_CO, 'nac vai nguyen tang\t\t\t45');
  ok('Khớp theo tên thì không đè tên đang có bằng tên không dấu',
     ten2.sua[0]?.sau.ten === 'Nạc vai nguyên tảng' && ten2.sua[0].cot_doi.join() === 'han_dung_ngay', JSON.stringify(ten2.sua[0]?.cot_doi));
  const gau = xemTruocDanMatHang(DA_CO, 'Gầu cắt lát\t\t\t\t480000');
  ok('Hai mặt hàng cùng tên, chỉ một đang dùng → khớp mặt hàng đang dùng', gau.sua[0]?.id === U(5), gau.loi.join(' · '));

  // Không sinh mặt hàng trùng; mã tự sinh không trùng mã đã có.
  const moi = xemTruocDanMatHang(DA_CO, 'Thăn\nBắp hoa\tphụ phẩm\nBắp hoa');
  ok('Tên mới "Thăn" → mã THAN-2 (THAN đã là mã của Thăn bò Úc)', moi.them[0]?.ma === 'THAN-2', JSON.stringify(moi.them[0]));
  ok('Tên mới lặp hai lần trong bảng → báo lỗi, không thêm hai lần',
     moi.loi.some(l => /Dòng 3: .*lặp với dòng 2/.test(l)), moi.loi.join(' · '));
  ok('Hàng mới: phụ phẩm đếm theo kg, đơn vị khay',
     moi.them[1]?.loai === 'phu_pham' && moi.them[1].dem_goi === false && moi.them[1].don_vi_goi === 'khay');
  const maDaCo = new Set(DA_CO.map(m => m.ma));
  ok('Không mã tự sinh nào trùng mã đang có', moi.them.every(t => !maDaCo.has(t.ma)));

  // Dòng tiêu đề: cột theo thứ tự bất kỳ, cột lạ bỏ qua.
  const td = xemTruocDanMatHang(DA_CO, [
    'Quầy tối thiểu (kg)\tGhi chú\tMã\tGiá bán/kg\tTên',
    '3,5\tabc\tc-thanngoai\t\tThăn ngoại loại 1',
    '\t\t\t320000\tDẻ sườn',
  ].join('\n'));
  const s2 = td.sua[0];
  ok('Tiêu đề xếp lộn xộn vẫn đọc đúng cột', td.loi.length === 0 && s2?.id === U(1) && s2.sau.ton_toi_thieu_kg === 3.5, td.loi.join(' · '));
  ok('Khớp theo Mã (không phân biệt hoa thường) thì đổi được tên', s2?.sau.ten === 'Thăn ngoại loại 1' && s2.cot_doi.includes('ten'));
  ok('Ô giá trống dưới tiêu đề vẫn giữ giá cũ', s2?.sau.gia_ban_kg === 650000);
  ok('Dòng không ghi Mã → thêm mới, mã sinh từ tên', td.them[0]?.ma === 'DE-SUON' && td.them[0].gia_ban_kg === 320000, JSON.stringify(td.them[0]));
  ok('Cột "Ghi chú" không hiểu → bỏ qua, có báo', td.boQua.join() === 'Ghi chú');

  // Lỗi — chưa ghi gì.
  const loi = xemTruocDanMatHang(DA_CO, [
    'Tên\tLoại\tHạn dùng\tGiá bán\tMã cân\tMã',
    'Ba chỉ\tthịt\t\t\t\t',
    'Lõi vai\t\tba ngày\t\t\t',
    'Nạm\t\t\t12a\t\t',
    'Diềm thăn\t\t\t\t12b\t',
    'Thăn ngoại cắt lát\t\t\t\t\tC-KHAC',
    '\t\t\t\t\tC-MOI',
    'Bắp bò\t\t\t\t101\t',
    'Nạc vai nguyên tảng',
    'nac vai nguyen tang\t\t20',
  ].join('\n'));
  const co = re => loi.loi.some(l => re.test(l));
  ok('Loại lạ → lỗi', co(/Dòng 2: loại "thịt"/), loi.loi.join(' · '));
  ok('Hạn dùng chữ → lỗi', co(/Dòng 3: hạn dùng "ba ngày"/));
  ok('Giá sai → lỗi', co(/Dòng 4: giá "12a"/));
  ok('Mã cân không phải số → lỗi', co(/Dòng 5: mã cân "12b"/));
  ok('Tên đã có với mã khác mã ghi → lỗi (không tạo hàng trùng tên)', co(/Dòng 6: .*C-THANNGOAI.*C-KHAC/));
  ok('Mã mới mà không có tên → lỗi', co(/Dòng 7: mã C-MOI .*cần có Tên/));
  ok('Mã cân đã thuộc mặt hàng khác → lỗi', co(/Mã cân 101 bị trùng/));
  ok('Một mặt hàng ghi hai dòng → lỗi', co(/Dòng 10: .*đã có ở dòng 9/));
  const haiTen = xemTruocDanMatHang([...DA_CO, mh(6, 'C-GAU-3', 'Gầu cắt lát', 'phan_cat')], 'Gầu cắt lát\t\t\t\t1');
  ok('Hai mặt hàng đang dùng cùng tên, không có Mã → lỗi, bảo thêm cột Mã', haiTen.loi.some(l => /thêm cột Mã/.test(l)), haiTen.loi.join(' · '));
  ok('Tiêu đề không có Tên lẫn Mã → lỗi', xemTruocDanMatHang(DA_CO, 'Giá bán\tHạn dùng\n1\t2').loi.length === 1);

  // Dòng ghi database: cùng một bộ cột, không có id; chữ ký đổi khi danh mục đổi.
  const ghi = dongGhiDan(td);
  const khoa = r => Object.keys(r).sort().join();
  ok('Mọi dòng upsert cùng bộ cột, không gửi id', ghi.length === 2 && ghi.every(r => khoa(r) === khoa(ghi[0]) && !('id' in r)));
  ok('Chữ ký ổn định với cùng dữ liệu', chuKyDan(td) === chuKyDan(xemTruocDanMatHang(DA_CO, [
    'Quầy tối thiểu (kg)\tGhi chú\tMã\tGiá bán/kg\tTên', '3,5\tabc\tc-thanngoai\t\tThăn ngoại loại 1', '\t\t\t320000\tDẻ sườn',
  ].join('\n'))));
  const daDoi = DA_CO.map(m => m.id === U(1) ? { ...m, gia_ban_kg: 690000 } : m);
  ok('Có người sửa danh mục giữa chừng → chữ ký khác', chuKyDan(td) !== chuKyDan(xemTruocDanMatHang(daDoi, [
    'Quầy tối thiểu (kg)\tGhi chú\tMã\tGiá bán/kg\tTên', '3,5\tabc\tc-thanngoai\t\tThăn ngoại loại 1', '\t\t\t320000\tDẻ sườn',
  ].join('\n'))));

  // Không tiêu đề: vẫn theo thứ tự cũ, cột thứ 8 là Quầy tối thiểu.
  const cu = xemTruocDanMatHang(DA_CO, 'Lõi vai;tảng;Vai;20;;;T-LOIVAI;1,5');
  ok('Không tiêu đề, ngăn bằng dấu ; → đúng thứ tự cũ + Quầy tối thiểu',
     cu.them[0]?.ma === 'T-LOIVAI' && cu.them[0].loai === 'tang' && cu.them[0].han_dung_ngay === 20 && cu.them[0].ton_toi_thieu_kg === 1.5,
     JSON.stringify(cu));
});

process.exit(ketThuc('MÃ VẠCH VÀ ĐỌC SỐ'));
