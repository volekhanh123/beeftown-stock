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

process.exit(ketThuc('MÃ VẠCH VÀ ĐỌC SỐ'));
