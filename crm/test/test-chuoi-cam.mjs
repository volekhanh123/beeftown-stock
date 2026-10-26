/**
 * BEEFTOWN — BỘ LỌC CHỮ CẤM (web/src/lib/chuoi-cam.js)
 * ====================================================
 *
 *     node test/test-chuoi-cam.mjs
 *
 * Bộ lọc này đứng giữa hai thứ lên trang mà không qua mắt người: nội dung bật từ
 * /noi-bo (máy quét `npm run quet`) và bản dịch máy (may-dich.ts). Trước đây nó chỉ
 * được thử gián tiếp. Bất biến:
 *
 *   1. Mỗi nhóm chữ cấm bắt được ở cả ba thứ tiếng.
 *   2. Chữ Việt dạng TỔ HỢP (NFD — Unikey chế độ "Unicode tổ hợp", chữ dán từ PDF) cũng
 *      bị bắt: "phòng riêng" gõ tổ hợp là "pho" + dấu huyền rời + "ng", trước đây lọt qua.
 *      Cả dấu cách không ngắt, ký tự vô hình, chữ số toàn khổ — dấu vết khác của chữ dán.
 *   3. Câu đúng giọng thương hiệu không bị bắt nhầm.
 */

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { timChuoiCam, CAM } = await import(join(GOC, 'web', 'src', 'lib', 'chuoi-cam.js'));

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — BỘ LỌC CHỮ CẤM');
const bat = s => timChuoiCam(s).length > 0;

const PHAI_BAT = [
  // [câu, nhóm]
  ['Ảnh: unsplash.com/photos/abc', 'ảnh kho'],
  ['Hotline 0900 000 001', 'hotline mẫu'],
  ['Địa chỉ: [số nhà], [tên đường]', 'chỗ trống'],
  ['Bò Wagyu A5 nhập khẩu', 'grade chưa xác nhận'], ['와규 스테이크', 'grade (ko)'],
  ['Combo chỉ 229.000đ', 'giá chiến dịch'],
  ['Thịt ủ 43 ngày', 'số ngày ủ'], ['Dry aged 43 days', 'số ngày ủ (en)'], ['43일 숙성', 'số ngày ủ (ko)'],
  ['Nướng than hoa', 'than'], ['Charcoal grill', 'than (en)'], ['숯불구이', 'than (ko)'],
  ['Có phòng riêng 10–30 khách', 'phòng riêng'], ['Private room for 30', 'phòng riêng (en)'], ['프라이빗 룸', 'phòng riêng (ko)'],
  ['Rẻ hơn 30% so với BBQ khác', 'giá làm hook'], ['Best value in town', 'giá làm hook (en)'], ['가성비 최고', 'giá làm hook (ko)'],
  ['Bò ngon nhất Sài Gòn', 'so sánh nhất'], ['The best beef', 'so sánh nhất (en)'],
  ['Đặt bàn thành công!', 'đặt bàn thành công'], ['Your table is booked', 'đặt bàn thành công (en)'], ['예약이 확정되었습니다', 'đặt bàn thành công (ko)'],
  ['Chỉ còn 2 bàn tối nay', 'khan hiếm'], ['Only 3 tables left', 'khan hiếm (en)'],
  ['Ba chỉ bò 450.000 đ/kg', 'giá tiền'],
];

const KHONG_BAT = [
  'Thịt chuẩn, giá thật',
  'Pick it, grill it, love it!',
  'Khách ra quầy tự chọn phần mình thích, rồi mang về bàn nướng.',
  'Beeftown đã nhận yêu cầu đặt bàn — nhân viên sẽ gọi lại để xác nhận.',
  'Mở cửa 16:00–22:00, 40–42 Nguyễn Thái Học, Quận 1',
  'Nướng bằng vỉ gas ngay tại bàn',
  'We have received your booking request — our staff will call you to confirm.',
  '예약 요청을 받았습니다. 직원이 전화로 확인해 드립니다.',
  'Than phiền, góp ý: nhắn tin cho trang Facebook',
];

// ===========================================================================
await nhom('1 · MỖI NHÓM CHỮ CẤM BẮT ĐƯỢC Ở CẢ BA THỨ TIẾNG', async () => {
  ok(`Danh sách có ${CAM.length} nhóm, mỗi nhóm có lý do`, CAM.length >= 13 && CAM.every(c => c.re instanceof RegExp && c.vi_sao.length > 10));
  for (const [cau, nhomCam] of PHAI_BAT) ok(`Bắt: "${cau}" (${nhomCam})`, bat(cau), JSON.stringify(timChuoiCam(cau)));
});

// ===========================================================================
await nhom('2 · CHỮ VIỆT DẠNG TỔ HỢP (NFD) CŨNG BỊ BẮT', async () => {
  for (const [cau, nhomCam] of PHAI_BAT) {
    const nfd = cau.normalize('NFD');
    if (nfd === cau) continue;   // câu không có dấu tổ hợp được — mục 1 đã thử
    ok(`Bắt dạng tổ hợp: "${cau}" (${nhomCam})`, bat(nfd), `NFD dài ${nfd.length} ký tự, NFC ${cau.length}`);
  }
  // Các dấu vết khác của chữ dán từ PDF / Word: dấu cách không ngắt, ký tự rộng, ký tự vô hình.
  for (const [cau, mo] of [
    ['Đặt bàn\u00a0thành công', 'dấu cách không ngắt (NBSP)'],
    ['Rẻ\u00a0hơn quán khác', 'NBSP giữa "rẻ hơn"'],
    ['Có phòng\u200briêng', 'ký tự rộng 0 (zero-width space)'],
    ['Đặt bàn thành\u00adcông', 'gạch nối mềm (soft hyphen)'],
    ['Combo ２２９.０００đ', 'chữ số toàn khổ (fullwidth)'],
  ]) ok(`Bắt được khi có ${mo}`, bat(cau), JSON.stringify(cau));

  const tim = timChuoiCam('Có phòng riêng'.normalize('NFD'));
  ok('Chỗ tìm thấy báo ra ở dạng dựng sẵn (NFC), đọc được', tim.length > 0 && tim[0].tim_thay === tim[0].tim_thay.normalize('NFC'),
     JSON.stringify(tim));
});

// ===========================================================================
await nhom('3 · CÂU ĐÚNG GIỌNG THƯƠNG HIỆU KHÔNG BỊ BẮT NHẦM', async () => {
  for (const cau of KHONG_BAT) {
    ok(`Không bắt: "${cau}"`, !bat(cau) && !bat(cau.normalize('NFD')), JSON.stringify(timChuoiCam(cau)));
  }
});

process.exit(ketThuc('BỘ LỌC CHỮ CẤM'));
