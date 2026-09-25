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
import { docFormPhieuXuat, dongTuQuet, gopDong } from '../../web/src/lib/kho/xuat.ts';
import { docFormKiemKe, apDungQuet } from '../../web/src/lib/kho/kiem-ke.ts';
import { taoCsv, kyBaoCao, BAO_CAO } from '../../web/src/lib/kho/bao-cao.ts';
import { docFormThanhToan } from '../../web/src/lib/kho/cong-no.ts';

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
    ['l0_lo', U(30)], ['l0_mat_hang', U(1)], ['l0_so_goi', '2'],
    ['l1_lo', U(31)], ['l1_mat_hang', U(1)],
  ]);
  const d = docFormPhieuXuat(f, MH_TEST);
  ok('Không có lỗi', d.loi.length === 0, d.loi.join(' · '));
  ok('Ba dòng gửi đi: 2 theo mặt hàng + 1 theo lô (lô để trống bị bỏ qua)', d.payload.length === 3, JSON.stringify(d.payload));
  ok('Hàng đếm gói: gửi số gói và kg quét được', d.payload[0].so_goi === 3 && d.payload[0].so_kg === 1.52);
  ok('Hàng theo kg: chỉ gửi kg', d.payload[1].so_kg === 0.8 && !('so_goi' in d.payload[1]));
  ok('Dòng theo lô mang lo_id', d.payload[2].lo_id === U(30) && d.payload[2].so_goi === 2);

  const thieuGoi = docFormPhieuXuat(new Map([['so_dong', '1'], ['d0_mat_hang', U(1)], ['d0_so_kg', '1']]), MH_TEST);
  ok('Hàng đếm gói mà chỉ ghi kg → báo thiếu số gói', thieuGoi.loi.some(x => /chưa nhập số gói/.test(x)));

  const ma = [nhan(101, 512), nhan(101, 498), nhan(201, 1250), nhan(999, 300), '2012345012500'].join('\n');
  const q = dongTuQuet(ma, MH_TEST);
  ok('Đọc 5 mã', q.soMa === 5);
  const than = q.dong.find(x => x.mat_hang_id === U(1));
  ok('Hai nhãn thăn → 2 gói, 1,01 kg (cộng theo gram)', than?.so_goi === '2' && than?.so_kg === '1,01', JSON.stringify(than));
  ok('Nhãn thịt vụn → 1,25 kg', q.dong.find(x => x.mat_hang_id === U(2))?.so_kg === '1,25');
  ok('Mã cân chưa gắn mặt hàng → báo, không đoán', q.loi.some(x => /Mã cân 999/.test(x)), q.loi.join(' · '));
  ok('Mã sai số kiểm tra → báo', q.loi.some(x => /Sai số kiểm tra/.test(x)));

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
  ok('Có đủ bốn báo cáo', ['xuat-nhap-ton', 'thu-hoi', 'hao-hut', 'ban'].every(t => BAO_CAO[t]));

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

process.exit(ketThuc('MÃ VẠCH VÀ ĐỌC SỐ'));
