/**
 * Kiểm thử máy chủ đơn — không Zalo, không mạng ngoài, sổ đơn SQLite trong bộ nhớ hoặc thư mục tạm:
 *
 *     cd may-chu-don && npx bun test/thu.ts
 *
 * Nhóm theo 9 mục "xong" của CLAUDE.md gốc: quyền (màn hình quầy), bấm hai lần (maGui, bước trạng thái), giờ
 * Việt Nam (23:50 / 00:10, ngày không có thật, máy chạy UTC hay múi khác), chữ có dấu, mất mạng / lỗi (không bao
 * giờ báo đã ghi), câu chữ (vi / en, chữ cấm). Phần cuối chạy src/main.ts thật và gọi máy chủ của nó.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { SAN_PHAM } from '../../mini-app/src/san-pham.ts';
import { CAU_HINH } from '../../mini-app/src/cau-hinh.ts';
import { timChuoiCam } from '../../web/src/lib/chuoi-cam.js';
import { dauNoiDungGui, dongHoVn, kiemDon, lamSachChu } from '../src/tao-don.ts';
import { SoDon, PHUT_CHO_THANH_TOAN, type DonDayDu } from '../src/so-don.ts';
import { BUOC_QUAY, NHAN, TRANG_THAI, duocBam } from '../src/trang-thai.ts';
import { CAU_BAO, CHU, ngayTheoTieng, thoat } from '../src/man-quay.ts';
import { GioiHan, TAI_KHOAN_DEMO, cungNguon, idTienVeDemo, ipKhach, taoXuLy } from '../src/may-chu.ts';
import { createHash, createHmac } from 'node:crypto';
import { chuoiVietQr, crc16, docTruong, laTaiKhoanNhan, noiDungChuyenKhoan } from '../src/viet-qr.ts';
import { DA_NHAN, docTinTienVe, kiemChuKy, timMaDon, type TinTienVe } from '../src/sepay.ts';
import { dauToken, docCauHinhZns, duLieuTin, giaiMaToken, maHoaToken, type CauHinhZns } from '../src/zns.ts';
import { guiZnsMotLuot, type HamFetchZalo } from '../src/gui-zns.ts';
import { SO_LAN_ZNS_TOI_DA } from '../src/so-don.ts';
import {
  baoMoVnpayLenMayChu, buocTraTien, docDonTuMayChu, guiDonLenMayChu, taoMaGui, taoThanDon, type HamFetchApi,
} from '../../mini-app/src/tra-truoc.ts';
import {
  IP_CHECKOUT_ZALO, chuoiKyTaoDon, diaChiIpnVnpay, docCallback, docCauHinhCheckout, docThanCallback, dongNhatKyIpnVnpay, thamSoTaoDon,
  type CauHinhCheckout,
} from '../src/checkout-zalo.ts';
import { PHUT_CHO_KET_QUA_ZALO, SO_LAN_MO_ZALO_TOI_DA } from '../src/so-don.ts';
import {
  CONG_THANH_TOAN_THU, PHUT_HET_HAN_THU, docCauHinhVnpayThu, docKetQuaVe, ngayVnpay, taoLinkThanhToanThu, taoMaGiaoDichThu,
} from '../src/vnpay-thu.ts';
import {
  DIA_CHI_QUAN_MINI_APP, DIEM_LAY, MS_CHO_KIEM_LAI, MS_GOI_LAU, MS_HOI_LAI, SO_LAN_TAO_TOI_DA, buocXe, diaChiGiaoAhamove,
  docCauHinhAhamove, docLoiAhamove, docMaTheoDoiXe, docTinChuyen, khoiLuongKg, thanTaoChuyen,
} from '../src/ahamove.ts';
import { goiXeMotLuot, taoPhienAhamove, type HamFetchAhamove } from '../src/goi-xe.ts';
import { LOI_XE, NHAN_XE } from '../src/man-quay.ts';

let dat = 0, hong = 0;
const ok = (ten: string, dieuKien: boolean, chiTiet = '') => {
  if (dieuKien) { dat++; console.log(`  ✓ ${ten}`); } else { hong++; console.log(`  ✗ ${ten} ${chiTiet}`); }
};
const nhom = (ten: string) => console.log(`\n${ten}`);

const msVn = (iso: string) => Date.parse(iso);   // iso có múi +07:00
const GIA = (ma: string) => SAN_PHAM.find(s => s.ma === ma)!.giaMoiKhay!;
const LUC_DAT = msVn('2026-11-13T09:00:00+07:00');   // ngày quán bắt đầu nhận hàng, trước giờ mở
let soGui = 0;
const donHopLe = (them: Record<string, unknown> = {}) => ({
  maGui: `thu-ma-gui-${String(++soGui).padStart(4, '0')}`,
  khay: { 'ribeye-with-cap': 2, 'la-galbi': 1 },
  cachNhan: 'giao-hang', diaChi: '12 Nguyễn Huệ, phường Sài Gòn', ngay: '2026-11-13', gio: '18:30',
  ten: 'Khánh', dienThoai: '0912 345 678', ghiChu: '',
  ...them,
});

// =====================================================================================================
nhom('1 · Kiểm đơn: giá do máy chủ tính, chỉ giao tận nơi');
{
  const k = kiemDon(donHopLe({ tongTien: 1, gia: { 'ribeye-with-cap': 1 } }), LUC_DAT);
  ok('Đơn hợp lệ được nhận', k.ok, JSON.stringify(k));
  if (k.ok) {
    ok('Tổng tiền máy chủ tự tính theo bảng giá của Mini App (bỏ qua giá, tổng khách gửi)',
      k.don.tongTien === 2 * GIA('ribeye-with-cap') + GIA('la-galbi'), String(k.don.tongTien));
    ok('Dòng đơn theo thứ tự của bảng phần thịt, mang giá và số gam của máy chủ',
      k.don.dong.map(d => d.maPhan).join() === 'ribeye-with-cap,la-galbi' && k.don.dong[1].baoQuan === 'dong-lanh');
    ok('Số điện thoại chuẩn hóa về 0xxxxxxxxx', k.don.dienThoai === '0912345678');
    ok('Cờ giá thử đi theo cấu hình của Mini App', k.don.giaThu === CAU_HINH.giaThu);
  }
  const loi = (than: unknown, ms = LUC_DAT) => { const r = kiemDon(than, ms); return r.ok ? [] : r.loi; };
  ok('Phần thịt lạ → từ chối cả đơn', loi(donHopLe({ khay: { 'wagyu-a5': 1 } })).some(l => l.includes('không bán')));
  ok('Hai mã lạ chỉ ra một câu', loi(donHopLe({ khay: { a: 1, b: 2 } })).length === 1);
  ok('Số khay 0 bỏ qua; đơn toàn 0 → "chưa chọn khay"', loi(donHopLe({ khay: { 'ribeye-with-cap': 0 } })).some(l => l.includes('chưa chọn')));
  ok(`Số khay ${CAU_HINH.soKhayToiDa + 1}, 1,5, "2", -1 → từ chối`,
    [CAU_HINH.soKhayToiDa + 1, 1.5, '2', -1].every(so => loi(donHopLe({ khay: { 'ribeye-with-cap': so } })).some(l => l.includes('Số khay'))));
  ok('Nhận tại quán, cách nhận lạ, thiếu cách nhận → từ chối (Khánh 09/11/2026: đơn trả trước chỉ giao tận nơi)',
    [{ cachNhan: 'tai-quan' }, { cachNhan: 'bay' }, { cachNhan: undefined }].every(t => loi(donHopLe(t)).some(l => l.includes('chỉ giao tận nơi'))));
  const kDiaChi = kiemDon(donHopLe({ diaChi: '  12  Nguyễn\u0007 Huệ,\n phường   Sài Gòn ' }), LUC_DAT);
  ok('Địa chỉ giao: làm sạch (gộp khoảng trắng, bỏ ký tự điều khiển), ghi vào đơn; tổng tiền chỉ là tiền khay (giá đã gồm phí giao)',
    kDiaChi.ok && kDiaChi.don.cachNhan === 'giao-hang' && kDiaChi.don.diaChi === '12 Nguyễn Huệ, phường Sài Gòn'
      && kDiaChi.don.tongTien === kDiaChi.don.dong.reduce((t, d) => t + d.soKhay * d.giaMoiKhay, 0),
    kDiaChi.ok ? JSON.stringify(kDiaChi.don.diaChi) : JSON.stringify(kDiaChi));
  ok('Địa chỉ giao trống, dưới 8 ký tự (sau khi làm sạch), quá 300 ký tự → từ chối với câu riêng',
    loi(donHopLe({ diaChi: '' })).includes('Nhập địa chỉ giao hàng (số nhà, đường, phường).') && loi(donHopLe({ diaChi: '  12   Hu ' })).some(l => l.includes('Nhập địa chỉ giao'))
      && loi(donHopLe({ diaChi: 'x'.repeat(301) })).some(l => l.includes('dài quá 300'))
      && kiemDon(donHopLe({ diaChi: '12 Lý Tự' }), LUC_DAT).ok && kiemDon(donHopLe({ diaChi: 'x'.repeat(300) }), LUC_DAT).ok);
  ok('Thiếu mã gửi / mã gửi lạ → từ chối', loi(donHopLe({ maGui: 'x' })).length === 1 && loi(donHopLe({ maGui: 'a b c d e f g h' })).length === 1);
  ok('Thân không phải đối tượng → từ chối, không ném lỗi', !kiemDon(null, LUC_DAT).ok && !kiemDon([1], LUC_DAT).ok && !kiemDon('x', LUC_DAT).ok);
}

nhom('2 · Kiểm đơn: tên, số điện thoại, chữ có dấu');
{
  const loi = (than: unknown) => { const r = kiemDon(than, LUC_DAT); return r.ok ? [] : r.loi; };
  ok('Thiếu số điện thoại → từ chối (quầy gọi, đợt 3 gửi ZNS)', loi(donHopLe({ dienThoai: '' })).some(l => l.includes('điện thoại')));
  ok('"+84 912 345 678" và "84912345678" nhận được', kiemDon(donHopLe({ dienThoai: '+84 912 345 678' }), LUC_DAT).ok
    && kiemDon(donHopLe({ dienThoai: '84912345678' }), LUC_DAT).ok);
  ok('"12345", "0912 345 67" → từ chối', loi(donHopLe({ dienThoai: '12345' })).length === 1 && loi(donHopLe({ dienThoai: '0912 345 67' })).length === 1);
  ok('Tên một chữ → từ chối; tên 61 chữ → từ chối', loi(donHopLe({ ten: 'K' })).length === 1 && loi(donHopLe({ ten: 'a'.repeat(61) })).length === 1);
  const nfd = 'Khánh'.normalize('NFD');
  const k = kiemDon(donHopLe({ ten: `  ${nfd}\u0007  \n Võ  ` }), LUC_DAT);
  ok('Tên gõ dấu rời (NFD), ký tự điều khiển, xuống dòng → "Khánh Võ" dạng NFC', k.ok && k.don.ten === 'Khánh Võ', k.ok ? JSON.stringify(k.don.ten) : '');
  ok('Ghi chú 301 chữ → từ chối', loi(donHopLe({ ghiChu: 'x'.repeat(301) })).length === 1);
  ok('lamSachChu: không phải chuỗi → ""', lamSachChu(42) === '' && lamSachChu(undefined) === '');
  const a = kiemDon(donHopLe({ maGui: 'cung-ma-gui-1' }), LUC_DAT), b = kiemDon(donHopLe({ maGui: 'cung-ma-gui-1' }), LUC_DAT);
  const c = kiemDon(donHopLe({ maGui: 'cung-ma-gui-1', ghiChu: 'gọi trước' }), LUC_DAT);
  ok('Dấu nội dung: cùng đơn → cùng dấu; khác ghi chú → khác dấu',
    a.ok && b.ok && c.ok && a.don.dauNoiDung === b.don.dauNoiDung && a.don.dauNoiDung !== c.don.dauNoiDung);
  const d = kiemDon(donHopLe({ maGui: 'cung-ma-gui-1', diaChi: '99 Lê Lợi, phường Bến Thành' }), LUC_DAT);
  ok('Dấu nội dung: khác địa chỉ giao → khác dấu (cùng mã gửi mà đổi địa chỉ thì không ghi đè đơn cũ)',
    a.ok && d.ok && a.don.dauNoiDung !== d.don.dauNoiDung);
  // Thân gửi trước 09/11 (không có diaChi) phải ra đúng dấu của công thức cũ: gửi lại sau khi nâng cấp không bị 409.
  const thanCu = { maGui: 'ma-gui-cu-0001', khay: { 'la-galbi': 1 }, cachNhan: 'tai-quan', ngay: '2026-11-13', gio: '18:30', ten: ' Khánh ', dienThoai: '0912 345 678', ghiChu: '' };
  const dauCu = createHash('sha256').update(JSON.stringify({ gio: [['la-galbi', 1]], cachNhan: 'tai-quan', ngay: '2026-11-13', gioNhan: '18:30',
    ten: 'Khánh', dienThoai: '0912345678', ghiChu: '' })).digest('hex');
  ok('Dấu nội dung: thân không có diaChi (gửi trước khi nâng cấp) ra đúng dấu của công thức cũ', dauNoiDungGui(thanCu) === dauCu);
}

nhom('3 · Giờ Việt Nam: 23:50 / 00:10, ngày không có thật, máy chạy UTC hay múi khác');
{
  const tzCu = process.env.TZ;
  for (const tz of ['UTC', 'Asia/Ho_Chi_Minh', 'America/New_York']) {
    process.env.TZ = tz;
    const d = dongHoVn(msVn('2026-11-12T23:50:00+07:00'));
    ok(`[${tz}] dongHoVn ra đúng 23:50 ngày 12/11 giờ VN`, d.getDate() === 12 && d.getHours() === 23 && d.getMinutes() === 50,
      d.toString());
    // 23:50 ngày 12/11 (UTC còn 16:50): 13/11 10:30 chọn được.
    ok(`[${tz}] 23:50 ngày 12/11 đặt được 10:30 ngày 13/11`, kiemDon(donHopLe({ gio: '10:30' }), msVn('2026-11-12T23:50:00+07:00')).ok);
    // 00:10 ngày 14/11 (UTC còn 17:10 ngày 13/11): ngày 13/11 đã qua.
    ok(`[${tz}] 00:10 ngày 14/11 không đặt được ngày 13/11 (UTC còn là 13/11)`,
      !kiemDon(donHopLe({ ngay: '2026-11-13', gio: '18:30' }), msVn('2026-11-14T00:10:00+07:00')).ok);
    ok(`[${tz}] 00:10 ngày 14/11 đặt được 10:30 ngày 14/11`,
      kiemDon(donHopLe({ ngay: '2026-11-14', gio: '10:30' }), msVn('2026-11-14T00:10:00+07:00')).ok);
  }
  process.env.TZ = tzCu;
  const loi = (them: Record<string, unknown>, ms = LUC_DAT) => { const r = kiemDon(donHopLe(them), ms); return r.ok ? [] : r.loi; };
  ok('Ngày 31/02, 2026-13-01, "13/11/2026" → từ chối',
    [{ ngay: '2027-02-31' }, { ngay: '2026-13-01' }, { ngay: '13/11/2026' }].every(t => loi(t).length === 1));
  ok('Trước ngày bắt đầu nhận hàng (12/11) → từ chối', loi({ ngay: '2026-11-12', gio: '18:30' }, msVn('2026-11-01T09:00:00+07:00')).length === 1);
  ok('Giờ ngoài khung (15:00, 21:30, 25:99) → từ chối', ['15:00', '21:30', '25:99'].every(g => loi({ gio: g }).length === 1));
  ok(`Hôm nay 10:00 giờ VN, đơn giao: 11:00 không còn chọn được (cần ${CAU_HINH.soPhutChuanBi} phút soạn + ${CAU_HINH.soPhutDiDuong} phút đi đường), 11:30 được`,
    CAU_HINH.soPhutChuanBi + CAU_HINH.soPhutDiDuong === 90
      && loi({ gio: '11:00' }, msVn('2026-11-13T10:00:00+07:00')).length === 1 && loi({ gio: '11:30' }, msVn('2026-11-13T10:00:00+07:00')).length === 0);
  ok(`Xa hơn ${CAU_HINH.soNgayChoChon} ngày → từ chối`, loi({ ngay: '2026-11-25' }).length === 1);
}

// =====================================================================================================
nhom('4 · Sổ đơn: gửi hai lần chỉ ra một đơn, số thứ tự trong ngày');
const donMoi = (so: SoDon, them: Record<string, unknown> = {}, ms = LUC_DAT): DonDayDu => {
  const k = kiemDon(donHopLe(them), ms);
  if (!k.ok) throw new Error(k.loi.join('; '));
  const r = so.taoDon(k.don, ms);
  if (!r.ok) throw new Error(r.ly_do);
  return r.don;
};
{
  const so = new SoDon(':memory:');
  const k = kiemDon(donHopLe({ maGui: 'bam-hai-lan-01' }), LUC_DAT);
  if (!k.ok) throw new Error('đơn mẫu hỏng');
  const r1 = so.taoDon(k.don, LUC_DAT), r2 = so.taoDon(k.don, LUC_DAT + 1000);
  ok('Lần đầu: đơn mới, số 1 trong ngày, chờ trả tiền', r1.ok && r1.moi && r1.don.soTrongNgay === 1 && r1.don.trangThai === 'cho_thanh_toan');
  ok('Gửi lại cùng maGui: trả đúng đơn cũ, không ra đơn thứ hai', r2.ok && !r2.moi && r1.ok && r2.don.ma === r1.don.ma);
  const k3 = kiemDon(donHopLe({ maGui: 'bam-hai-lan-01', ghiChu: 'khác' }), LUC_DAT);
  const r3 = k3.ok ? so.taoDon(k3.don, LUC_DAT) : null;
  ok('Cùng maGui mà khác nội dung → từ chối, đơn cũ không bị ghi đè', r3 !== null && !r3.ok && so.layDon(r1.ok ? r1.don.ma : '')!.ghiChu === '');
  const d2 = donMoi(so);
  ok('Đơn khác: số 2', d2.soTrongNgay === 2);
  const d3 = donMoi(so, { ngay: '2026-11-14' }, msVn('2026-11-14T00:10:00+07:00'));
  ok('00:10 giờ VN ngày hôm sau: số trong ngày quay về 1, ngày tạo theo giờ VN', d3.soTrongNgay === 1 && d3.ngayTao === '2026-11-14');
  ok('Mã đơn 8 ký tự không chữ dễ nhầm, khóa xem 32 ký tự hex', /^[ACDEFGHJKMNPQRTUVWXY34679]{8}$/.test(d2.ma) && /^[0-9a-f]{32}$/.test(d2.khoaXem));
  ok('Đọc bằng khóa: đúng khóa ra đơn; sai khóa, khóa rỗng, khóa dài khác → không ra',
    so.layTheoKhoa(d2.ma, d2.khoaXem)?.ma === d2.ma && !so.layTheoKhoa(d2.ma, 'x'.repeat(32)) && !so.layTheoKhoa(d2.ma, '') && !so.layTheoKhoa(d2.ma, d2.khoaXem + 'a'));
  const dem = (so.db.query('select count(*) as n from don').get() as { n: number }).n;
  ok('Sổ có đúng 3 đơn', dem === 3, String(dem));
  so.dong();
}

nhom('5 · Trạng thái: chỉ đi đúng một bước, kể cả bấm đúp và hai máy cùng bấm');
{
  const so = new SoDon(':memory:');
  const d = donMoi(so);
  ok('Quầy không được đẩy đơn chưa trả tiền đi soạn', so.doiTrangThai(d.ma, 'cho_thanh_toan', 'dang_soan', LUC_DAT) === 'khong_duoc');
  ok('Mọi bước của quầy nằm trong bảng bước, không bước nào từ chờ trả tiền hay hết hạn',
    BUOC_QUAY.every(b => duocBam(b.tu, b.den)) && !BUOC_QUAY.some(b => b.tu === 'cho_thanh_toan' || b.tu === 'het_han' || b.tu === 'da_giao'));
  ok('Zalo báo đã trả (đợt 2): chờ trả tiền → đã trả tiền', so.ghiDaThanhToan(d.ma, LUC_DAT + 1) === 'da_doi');
  ok('Zalo báo lần hai: không đổi gì thêm', so.ghiDaThanhToan(d.ma, LUC_DAT + 2) === 'da_o_buoc_moi');
  ok('Bắt đầu soạn: đổi được', so.doiTrangThai(d.ma, 'da_thanh_toan', 'dang_soan', LUC_DAT + 3) === 'da_doi');
  ok('Bấm đúp "Bắt đầu soạn": báo đã ở bước này, không lỗi', so.doiTrangThai(d.ma, 'da_thanh_toan', 'dang_soan', LUC_DAT + 4) === 'da_o_buoc_moi');
  ok('Máy khác bấm hủy từ trạng thái cũ (đã trả tiền) → lệch, không hủy',
    so.doiTrangThai(d.ma, 'da_thanh_toan', 'can_hoan_tien', LUC_DAT + 5) === 'lech' && so.layDon(d.ma)!.trangThai === 'dang_soan');
  ok('Đơn không có → khong_co', so.doiTrangThai('KHONGCO1', 'da_thanh_toan', 'dang_soan', LUC_DAT) === 'khong_co');
  const nk = so.db.query('select tu, den, ai from nhat_ky where ma_don = ? order by id').all(d.ma) as { tu: string | null; den: string; ai: string }[];
  ok('Nhật ký ghi đúng 3 lần đổi thật (tạo, tiền về qua SePay, quầy) — lần bấm đúp, lần lệch không ghi',
    nk.map(x => `${x.tu}>${x.den}@${x.ai}`).join() === 'null>cho_thanh_toan@khach,cho_thanh_toan>da_thanh_toan@sepay,da_thanh_toan>dang_soan@quay',
    JSON.stringify(nk));
  so.dong();

  // Hai máy tính bảng: hai kết nối tới cùng một file, cùng bấm một bước.
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'may-chu-don-'));
  const a = new SoDon(path.join(tam, 'don.sqlite')), b = new SoDon(path.join(tam, 'don.sqlite'));
  const d2 = donMoi(a);
  a.ghiDaThanhToan(d2.ma, LUC_DAT);
  const kq = [a.doiTrangThai(d2.ma, 'da_thanh_toan', 'dang_soan', LUC_DAT + 1), b.doiTrangThai(d2.ma, 'da_thanh_toan', 'dang_soan', LUC_DAT + 1)];
  ok('Hai kết nối cùng bấm: đúng một lần đổi, lần kia thấy đã ở bước mới', kq.sort().join() === 'da_doi,da_o_buoc_moi', kq.join());
  const k = kiemDon(donHopLe({ maGui: 'hai-may-cung-gui' }), LUC_DAT);
  if (k.ok) {
    const r = [a.taoDon(k.don, LUC_DAT), b.taoDon(k.don, LUC_DAT)];
    ok('Hai kết nối cùng gửi một maGui: một đơn', r.every(x => x.ok) && r[0].ok && r[1].ok && r[0].don.ma === r[1].don.ma
      && (a.db.query("select count(*) as n from don where ma_gui = 'hai-may-cung-gui'").get() as { n: number }).n === 1);
  }
  a.dong(); b.dong();
  fs.rmSync(tam, { recursive: true, force: true });
}

nhom('6 · Hết hạn trả tiền, danh sách quầy, số liệu sức khỏe');
{
  const so = new SoDon(':memory:');
  const chuaTra = donMoi(so);
  const daTra = donMoi(so, { gio: '17:00' });
  so.ghiDaThanhToan(daTra.ma, LUC_DAT);
  ok(`Chưa tới ${PHUT_CHO_THANH_TOAN} phút: chưa hết hạn`, so.datHetHan(LUC_DAT + (PHUT_CHO_THANH_TOAN - 1) * 60_000) === 0);
  ok(`Quá ${PHUT_CHO_THANH_TOAN} phút: đơn chưa trả hết hạn, đơn đã trả giữ nguyên`,
    so.datHetHan(LUC_DAT + (PHUT_CHO_THANH_TOAN + 1) * 60_000) === 1 && so.layDon(chuaTra.ma)!.trangThai === 'het_han'
    && so.layDon(daTra.ma)!.trangThai === 'da_thanh_toan');
  ok('Tiền về sau khi hết hạn: đơn thành đã trả tiền (tiền khách không bị bỏ quên)',
    so.ghiDaThanhToan(chuaTra.ma, LUC_DAT + 40 * 60_000) === 'da_doi' && so.layDon(chuaTra.ma)!.trangThai === 'da_thanh_toan');
  const conTra = donMoi(so, { gio: '19:00' });
  const ds = so.danhSachQuay(LUC_DAT);
  ok('Quầy không thấy đơn chưa trả tiền', !ds.conViec.some(d => d.ma === conTra.ma));
  ok('Quầy thấy đơn đã trả, xếp theo giờ nhận (17:00 trước 18:30)', ds.conViec.map(d => d.gioNhan).join() === '17:00,18:30', ds.conViec.map(d => d.gioNhan).join());
  so.doiTrangThai(daTra.ma, 'da_thanh_toan', 'dang_soan', LUC_DAT);
  so.doiTrangThai(daTra.ma, 'dang_soan', 'cho_lay', LUC_DAT);
  so.doiTrangThai(daTra.ma, 'cho_lay', 'da_giao', msVn('2026-11-13T23:55:00+07:00'));
  ok('Đơn giao lúc 23:55 nằm trong "đã xong hôm nay" của ngày đó', so.danhSachQuay(msVn('2026-11-13T23:58:00+07:00')).xongHomNay.some(d => d.ma === daTra.ma));
  ok('Sang 00:05 ngày hôm sau (giờ VN) thì không còn trong "đã xong hôm nay"', !so.danhSachQuay(msVn('2026-11-14T00:05:00+07:00')).xongHomNay.some(d => d.ma === daTra.ma));
  const sl = so.soLieu(LUC_DAT + 60 * 60_000);
  ok('Số liệu sức khỏe: một đơn chờ soạn, chờ lâu nhất tính bằng phút', sl.soChoSoan === 1 && sl.phutChoSoanLauNhat === 20, JSON.stringify(sl));
  const chuSl = JSON.stringify(sl);
  ok('Số liệu sức khỏe không có tên, số điện thoại', !chuSl.includes('Khánh') && !chuSl.includes('0912'));
  so.dong();
}

// =====================================================================================================
nhom('7 · API cho Mini App');
const MK = 'mat-khau-quay-thu';
const taoMay = (so: SoDon, them: Partial<Parameters<typeof taoXuLy>[0]> = {}) => {
  let ms = LUC_DAT;
  const xuLy = taoXuLy({ so, matKhauQuay: MK, bayGio: () => ms, cookieAnToan: true, ...them });
  return { xuLy, datGio: (m: number) => { ms = m; } };
};
const goi = (xuLy: ReturnType<typeof taoXuLy>, duong: string, init: RequestInit = {}, ip = '10.0.0.1') =>
  xuLy(new Request(`http://don.beeftown.test${duong}`, { ...init, headers: { host: 'don.beeftown.test', ...(init.headers ?? {}) } }), ip);
const guiDon = (xuLy: ReturnType<typeof taoXuLy>, than: unknown, ip = '10.0.0.1') =>
  goi(xuLy, '/api/don', { method: 'POST', body: typeof than === 'string' ? than : JSON.stringify(than), headers: { 'content-type': 'application/json' } }, ip);
{
  const so = new SoDon(':memory:');
  const { xuLy } = taoMay(so);
  const than = donHopLe();
  const r1 = await guiDon(xuLy, than);
  const j1 = await r1.json() as Record<string, unknown>;
  ok('Đơn hợp lệ → 201, có mã đơn, khóa xem, tổng tiền máy chủ tính', r1.status === 201 && j1.ok === true && typeof j1.ma === 'string'
    && typeof j1.khoa === 'string' && j1.tongTien === 2 * GIA('ribeye-with-cap') + GIA('la-galbi'), JSON.stringify(j1));
  ok('Câu trả lời nói đúng: "Chờ khách trả tiền", không có chữ "thành công"', j1.nhan === NHAN.cho_thanh_toan.vi && !JSON.stringify(j1).toLowerCase().includes('thành công'));
  ok('Có CORS cho Mini App, không cache', r1.headers.get('access-control-allow-origin') === '*' && r1.headers.get('cache-control') === 'no-store');
  const r2 = await guiDon(xuLy, than);
  const j2 = await r2.json() as Record<string, unknown>;
  ok('Gửi lại y hệt (mạng chập chờn, bấm đúp) → 200, cùng mã đơn', r2.status === 200 && j2.ma === j1.ma && j2.moi === false);
  const r3 = await guiDon(xuLy, { ...than, ghiChu: 'khác' });
  ok('Cùng maGui khác nội dung → 409', r3.status === 409);
  const r4 = await guiDon(xuLy, donHopLe({ gio: '15:00' }));
  const j4 = await r4.json() as { loi: string[] };
  ok('Đơn sai → 400 kèm câu tiếng Việt', r4.status === 400 && j4.loi.some(l => l.includes('Giờ nhận')));
  ok('Thân không phải JSON → 400', (await guiDon(xuLy, '{hỏng')).status === 400);
  ok('Thân quá 8 KB → 413', (await guiDon(xuLy, JSON.stringify({ ...donHopLe(), ghiChu: 'x'.repeat(9000) }))).status === 413);
  const op = await goi(xuLy, '/api/don', { method: 'OPTIONS' });
  ok('OPTIONS → 204 có CORS', op.status === 204 && op.headers.get('access-control-allow-methods')?.includes('POST') === true);
  const xem = await goi(xuLy, `/api/don/${j1.ma}?khoa=${j1.khoa}`);
  const jx = await xem.json() as Record<string, unknown>;
  ok('Xem đơn đúng khóa → trạng thái, dòng đơn', xem.status === 200 && jx.trangThai === 'cho_thanh_toan' && Array.isArray(jx.dong));
  ok('Xem đơn không trả tên, số điện thoại', !JSON.stringify(jx).includes('Khánh') && !JSON.stringify(jx).includes('0912'));
  ok('Sai khóa → 404 như không có đơn', (await goi(xuLy, `/api/don/${j1.ma}?khoa=${'0'.repeat(32)}`)).status === 404);
  let bi429 = false;
  for (let i = 0; i < 25 && !bi429; i++) bi429 = (await guiDon(xuLy, donHopLe(), '10.9.9.9')).status === 429;
  ok('Một IP gửi quá 20 đơn / phút → 429', bi429);
  ok('IP khác không bị chặn theo', (await guiDon(xuLy, donHopLe(), '10.9.9.8')).status === 201);
  ok('Đường lạ dưới /api → 404 JSON', (await goi(xuLy, '/api/la')).status === 404);
  so.dong();
}

nhom('8 · Mất kết nối sổ đơn / lỗi: không bao giờ báo đã ghi');
{
  const so = new SoDon(':memory:');
  const hong = Object.create(so) as SoDon;
  hong.taoDon = () => { throw new Error('disk I/O error'); };
  const { xuLy } = taoMay(hong);
  const r = await guiDon(xuLy, donHopLe());
  const chu = await r.text();
  ok('Ghi hỏng → 500, câu nói rõ đơn CHƯA được ghi, không có "ok":true', r.status === 500 && chu.includes('CHƯA được ghi') && !chu.includes('"ok":true'), chu);
  const so2 = new SoDon(':memory:');
  const { xuLy: xuLy2 } = taoMay(so2);
  so2.dong();
  const r2 = await guiDon(xuLy2, donHopLe());
  ok('Sổ đơn đã đóng (máy hỏng giữa chừng) → 500, không 201', r2.status === 500);
  const sk = await goi(xuLy2, '/suc-khoe');
  ok('Sức khỏe khi sổ hỏng → 500, không bao giờ "ok"', sk.status === 500 && !(await sk.text()).includes('"ok":true'));
}

// =====================================================================================================
nhom('9 · Màn hình quầy: đăng nhập, quyền, đổi trạng thái');
{
  const so = new SoDon(':memory:');
  const { xuLy, datGio } = taoMay(so);
  const daTra = donMoi(so, { ten: '<script>alert(1)</script> Lan', ghiChu: 'Lấy "2" túi', diaChi: '7 <b>Hàm</b> Nghi, phường "Sài Gòn"' });
  so.ghiDaThanhToan(daTra.ma, LUC_DAT);
  const chuaTra = donMoi(so, { ten: 'Chưa Trả Tiền', gio: '19:00' });

  const vao = await goi(xuLy, '/quay');
  const vaoChu = await vao.text();
  ok('Chưa đăng nhập: /quay là trang đăng nhập, không lộ đơn', vao.status === 200 && vaoChu.includes('name="mat_khau"') && !vaoChu.includes('Lan'));
  ok('Trang có CSP chặt, không cache, không index', (vao.headers.get('content-security-policy') ?? '').includes("default-src 'none'")
    && vao.headers.get('cache-control') === 'no-store' && vaoChu.includes('noindex'));
  const doiKhongPhien = await goi(xuLy, '/quay/doi', { method: 'POST', body: `ma=${daTra.ma}&tu=da_thanh_toan&den=dang_soan`,
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } });
  ok('Chưa đăng nhập: POST /quay/doi → về trang đăng nhập, đơn không đổi', doiKhongPhien.status === 303 && so.layDon(daTra.ma)!.trangThai === 'da_thanh_toan');
  ok('Chưa đăng nhập: /quay/huy không lộ đơn', !(await (await goi(xuLy, `/quay/huy?ma=${daTra.ma}`)).text()).includes('Lan'));

  const dangNhap = (mk: string, ip = '10.1.1.1') => goi(xuLy, '/quay/dang-nhap', { method: 'POST', body: `mat_khau=${encodeURIComponent(mk)}`,
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } }, ip);
  ok('Sai mật khẩu → 401, báo "Sai mật khẩu."', (await dangNhap('sai')).status === 401);
  for (let i = 0; i < 4; i++) await dangNhap('sai-nua', '10.2.2.2');
  const lanNam = await dangNhap('sai-nua', '10.2.2.2');
  ok('Lần sai thứ năm: đã báo chờ 10 phút', (await lanNam.text()).includes('Chờ 10 phút'));
  const doanTrung = await dangNhap(MK, '10.2.2.2');
  ok('Sai 5 lần rồi đoán trúng → vẫn 429, không cấp phiên', doanTrung.status === 429 && !doanTrung.headers.get('set-cookie'));
  const dung = await dangNhap(MK);
  const sc = dung.headers.get('set-cookie') ?? '';
  ok('Đúng mật khẩu → 303, cookie HttpOnly, SameSite=Strict, Secure, chỉ cho /quay',
    dung.status === 303 && /phien_quay=[0-9a-f]{64}/.test(sc) && sc.includes('HttpOnly') && sc.includes('SameSite=Strict') && sc.includes('Secure') && sc.includes('Path=/quay'), sc);
  const phien = sc.split(';')[0];
  const coPhien = (duong: string, init: RequestInit = {}) => goi(xuLy, duong, { ...init, headers: { cookie: phien, ...(init.headers ?? {}) } });

  const ds = await (await coPhien('/quay')).text();
  ok('Danh sách: thấy đơn đã trả (#số, tên đã thoát HTML, số điện thoại bấm gọi, tổng tiền dạng 000.000 đ)',
    ds.includes(`#${daTra.soTrongNgay}`) && ds.includes('&lt;script&gt;alert(1)&lt;/script&gt; Lan') && !ds.includes('<script>')
    && ds.includes('href="tel:0912345678"') && ds.includes('0912 345 678') && ds.includes(`${(2 * GIA('ribeye-with-cap') + GIA('la-galbi')).toLocaleString('vi-VN')} đ`));
  ok('Danh sách: ghi chú thoát dấu nháy', ds.includes('Lấy &quot;2&quot; túi'));
  ok('Danh sách: đơn giao ghi "Giao <giờ>" và dòng "Giao tới: <địa chỉ>" đã thoát HTML',
    ds.includes('Giao 18:30') && ds.includes('Giao tới: 7 &lt;b&gt;Hàm&lt;/b&gt; Nghi, phường &quot;Sài Gòn&quot;') && !ds.includes('<b>Hàm</b>'));
  ok('Danh sách: không thấy đơn chưa trả tiền', !ds.includes('Chưa Trả Tiền'));
  ok('Danh sách: nhãn "Đã trả tiền, chờ soạn" kiểu K1, nút chính "Bắt đầu soạn"', ds.includes('qd-nhan k1') && ds.includes('Bắt đầu soạn'));
  ok('Danh sách tự tải lại 20 giây, về /quay trơn (câu báo cũ không hiện lại mãi)', ds.includes('http-equiv="refresh" content="20; url=/quay"'));
  ok(`Giá thử: nhãn "Giá thử" khi cấu hình đang giaThu`, ds.includes('Giá thử') === CAU_HINH.giaThu);

  const doi = (tu: string, den: string, them: Record<string, string> = { 'sec-fetch-site': 'same-origin' }) =>
    coPhien('/quay/doi', { method: 'POST', body: `ma=${daTra.ma}&tu=${tu}&den=${den}`, headers: { 'content-type': 'application/x-www-form-urlencoded', ...them } });
  const khacTrang = await doi('da_thanh_toan', 'dang_soan', { 'sec-fetch-site': 'cross-site' });
  ok('Form gửi từ trang khác (Sec-Fetch-Site: cross-site) → 403, đơn không đổi', khacTrang.status === 403 && so.layDon(daTra.ma)!.trangThai === 'da_thanh_toan');
  const khacOrigin = await doi('da_thanh_toan', 'dang_soan', { origin: 'https://la.example' });
  ok('Origin lạ (trình duyệt không gửi Sec-Fetch-Site) → 403', khacOrigin.status === 403);
  const b1 = await doi('da_thanh_toan', 'dang_soan');
  ok('Bắt đầu soạn → 303 về danh sách, báo "da_doi"', b1.status === 303 && (b1.headers.get('location') ?? '').includes('bao=da_doi'));
  const b2 = await doi('da_thanh_toan', 'dang_soan');
  ok('Bấm đúp → báo "đã ở bước này", đơn chỉ đi một bước', (b2.headers.get('location') ?? '').includes('bao=da_o_buoc_moi') && so.layDon(daTra.ma)!.trangThai === 'dang_soan');
  const sau = await (await coPhien(b2.headers.get('location')!)).text();
  ok('Câu báo sau khi bấm đúp có số đơn và tên bước', sau.includes(`Đơn #${daTra.soTrongNgay} đã ở bước “Đang soạn” rồi.`));
  const theVuaBam = sau.slice(sau.indexOf(`id="don-${daTra.ma}"`));
  ok('Câu báo nằm trong thẻ đơn vừa bấm (trang cuộn tới thẻ đó), không ở đầu trang',
    theVuaBam.slice(0, theVuaBam.indexOf('</article>')).includes('qd-bao') && sau.indexOf('qd-bao') > sau.indexOf('<h2>'));
  const nhayCoc = await doi('dang_soan', 'da_giao');
  ok('Bước không có trong bảng (đang soạn → đã giao) → không đổi', (nhayCoc.headers.get('location') ?? '').includes('bao=khong_duoc') && so.layDon(daTra.ma)!.trangThai === 'dang_soan');
  const laTrangThaiLa = await coPhien('/quay/doi', { method: 'POST', body: `ma=${daTra.ma}&tu=x&den=y`, headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } });
  ok('Trạng thái lạ trong form → không đổi', (laTrangThaiLa.headers.get('location') ?? '').includes('khong_duoc'));

  const huy = await (await coPhien(`/quay/huy?ma=${daTra.ma}`)).text();
  ok('Hủy phải qua trang hỏi lại, nói rõ cần hoàn tiền', huy.includes('Hủy đơn này?') && huy.includes('cần hoàn tiền') && huy.includes('name="tu" value="dang_soan"'));
  await doi('dang_soan', 'can_hoan_tien');
  ok('Hủy → "Đã hủy, cần hoàn tiền" (K1), nút "Đã hoàn tiền cho khách"', so.layDon(daTra.ma)!.trangThai === 'can_hoan_tien'
    && (await (await coPhien('/quay')).text()).includes('Đã hoàn tiền cho khách'));
  await doi('can_hoan_tien', 'da_hoan_tien');
  const xong = await (await coPhien('/quay')).text();
  ok('Đã hoàn tiền: nằm trong "Đã xong hôm nay", không còn nút', xong.includes('Đã xong hôm nay (1)') && so.layDon(daTra.ma)!.trangThai === 'da_hoan_tien');

  const en = await coPhien('/quay/ngon-ngu', { method: 'POST', body: 'nn=en', headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } });
  const ckEn = (en.headers.get('set-cookie') ?? '').split(';')[0];
  const trangEn = await (await goi(xuLy, '/quay', { headers: { cookie: `${phien}; ${ckEn}` } })).text();
  ok('Đổi tiếng Anh: lang="en", "Mini App orders", nút về "Tiếng Việt"', trangEn.includes('lang="en"') && trangEn.includes('Mini App orders') && trangEn.includes('Tiếng Việt'));

  datGio(LUC_DAT + 13 * 60 * 60_000);
  ok('Phiên quá 12 giờ → về trang đăng nhập', (await (await coPhien('/quay')).text()).includes('name="mat_khau"'));
  datGio(LUC_DAT);
  const ra = await coPhien('/quay/dang-xuat', { method: 'POST', headers: { 'sec-fetch-site': 'same-origin' } });
  ok('Đăng xuất xóa phiên', ra.status === 303 && (await (await coPhien('/quay')).text()).includes('name="mat_khau"'));

  const css = await goi(xuLy, '/quay/quay.css');
  const cssChu = await css.text();
  ok('CSS có Montserrat (latin, latin-ext, vietnamese) trỏ về máy chủ, không tải phông từ ngoài',
    cssChu.includes("url(/quay/phong/montserrat-vietnamese-400-normal.woff2)") && !/https?:\/\//.test(cssChu));
  const phong = await goi(xuLy, '/quay/phong/montserrat-vietnamese-700-normal.woff2');
  ok('Tệp phông có thật, đúng kiểu', phong.status === 200 && phong.headers.get('content-type') === 'font/woff2' && (await phong.arrayBuffer()).byteLength > 1000);
  ok('Tệp phông ngoài danh sách → 404', (await goi(xuLy, '/quay/phong/montserrat-cyrillic-400-normal.woff2')).status === 404
    && (await goi(xuLy, '/quay/phong/..%2F..%2Fpackage.json')).status === 404);
  void chuaTra;
  so.dong();
}

nhom('10 · cungNguon, giới hạn lượt, sức khỏe có khóa');
{
  const r = (h: Record<string, string>) => new Request('http://don.beeftown.test/quay/doi', { method: 'POST', headers: { host: 'don.beeftown.test', ...h } });
  ok('same-origin → được; cross-site, same-site → không', cungNguon(r({ 'sec-fetch-site': 'same-origin' }))
    && !cungNguon(r({ 'sec-fetch-site': 'cross-site' })) && !cungNguon(r({ 'sec-fetch-site': 'same-site' })));
  ok('Origin trùng Host → được; Origin "null", Origin lạ → không', cungNguon(r({ origin: 'https://don.beeftown.test' }))
    && !cungNguon(r({ origin: 'null' })) && !cungNguon(r({ origin: 'https://la.example' })));
  const g = new GioiHan(2, 1000);
  ok('Giới hạn: 2 lượt / giây, lượt thứ 3 bị chặn, qua cửa sổ thì mở lại', g.thu('a', 0) && g.thu('a', 10) && !g.thu('a', 20) && g.dangChan('a', 20) && g.thu('a', 1100));
  const so = new SoDon(':memory:');
  const { xuLy } = taoMay(so, { khoaSucKhoe: 'khoa-suc-khoe-thu' });
  ok('/suc-khoe có khóa: thiếu / sai → 403; đúng → 200', (await goi(xuLy, '/suc-khoe')).status === 403
    && (await goi(xuLy, '/suc-khoe?khoa=sai')).status === 403 && (await goi(xuLy, '/suc-khoe?khoa=khoa-suc-khoe-thu')).status === 200);
  so.dong();
}

// =====================================================================================================
nhom('11 · Câu chữ: đủ vi / en, không chữ cấm, không "thành công"');
{
  const cap = [...Object.values(CHU), ...Object.values(NHAN), ...Object.values(CAU_BAO), ...BUOC_QUAY];
  ok('Mọi câu của màn quầy, nhãn, bước, câu báo đều có cả vi và en', cap.every(c => c.vi.trim() && c.en.trim()));
  ok('Đủ nhãn cho mọi trạng thái', TRANG_THAI.every(t => NHAN[t]?.vi && NHAN[t]?.en));
  const maNguon = ['tao-don.ts', 'may-chu.ts', 'man-quay.ts', 'trang-thai.ts', 'so-don.ts', 'ahamove.ts', 'goi-xe.ts']
    .map(f => fs.readFileSync(path.join(import.meta.dir, '../src', f), 'utf8')).join('\n');
  const chuoi = [...maNguon.matchAll(/'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g)].map(m => m[1] ?? m[2]).filter(s => /[À-ỹ]/.test(s));
  const cam = chuoi.flatMap(s => timChuoiCam(s).map(t => `${t.tim_thay} (${s.slice(0, 40)})`));
  ok('Câu trong mã của máy chủ không dính chữ cấm của repo', cam.length === 0, cam.join('; '));
  ok('Không câu nào nói "thành công"', !chuoi.some(s => /thành công/i.test(s)));
  ok('Ngày nhận: "Thứ Sáu 13/11" / "Fri 13/11"', ngayTheoTieng('2026-11-13', 'vi') === 'Thứ Sáu 13/11' && ngayTheoTieng('2026-11-13', 'en') === 'Fri 13/11');
  ok('thoat() thoát & < > " \'', thoat(`&<>"'`) === '&amp;&lt;&gt;&quot;&#39;');
}

// =====================================================================================================
nhom('12 · Rà soát 29/10: gửi lại sau khi giờ nhận qua, IP sau proxy, câu báo, trang hủy, Zalo báo lại');
{
  const so = new SoDon(':memory:');
  const { xuLy, datGio } = taoMay(so);
  // 08:59 đặt giao 10:30 (cần 60 phút soạn + 30 phút đi đường) được; 09:01 thì 10:30 không còn chọn được.
  datGio(msVn('2026-11-13T08:59:00+07:00'));
  const than = donHopLe({ gio: '10:30' });
  const r1 = await guiDon(xuLy, than);
  const j1 = await r1.json() as { ma: string };
  datGio(msVn('2026-11-13T09:01:00+07:00'));
  const r2 = await guiDon(xuLy, than);
  const j2 = await r2.json() as { ma: string };
  ok('HỒI QUY rà soát: đơn đã ghi, câu trả lời mất, gửi lại sau khi giờ nhận vừa qua → trả đúng đơn cũ, không bắt đặt lại',
    r1.status === 201 && r2.status === 200 && j2.ma === j1.ma, `${r1.status} ${r2.status}`);
  ok('Gửi lại cùng maGui mà khác nội dung (dù giờ đã qua) → vẫn 409', (await guiDon(xuLy, { ...than, ghiChu: 'khác' })).status === 409);
  ok('Đơn mới với giờ đã qua → 400 như cũ', (await guiDon(xuLy, donHopLe({ gio: '10:30' }))).status === 400);
  ok('Dấu nội dung không đổi khi chỉ khác cách viết số điện thoại hay khoảng trắng của tên',
    dauNoiDungGui({ ...than, dienThoai: '+84912345678', ten: '  Khánh ' }) === dauNoiDungGui(than));

  ok('HỒI QUY rà soát: sau proxy, IP lấy mục CUỐI của X-Forwarded-For (mục đầu khách tự ghi được)',
    ipKhach('1.2.3.4, 203.0.113.9', true, '127.0.0.1') === '203.0.113.9' && ipKhach('9.9.9.9', false, '10.0.0.5') === '10.0.0.5'
    && ipKhach(null, true, '10.0.0.5') === '10.0.0.5' && ipKhach(' , ', true, undefined) === '?');

  const d = donMoi(so, { maGui: 'ra-soat-trang-thai' }, msVn('2026-11-13T09:00:00+07:00'));
  so.ghiDaThanhToan(d.ma, LUC_DAT);
  so.doiTrangThai(d.ma, 'da_thanh_toan', 'dang_soan', LUC_DAT);
  ok('HỒI QUY rà soát: Zalo báo thanh toán lần nữa khi quầy đã soạn → "đã ở bước mới", không "lệch"',
    so.ghiDaThanhToan(d.ma, LUC_DAT) === 'da_o_buoc_moi' && so.layDon(d.ma)!.trangThai === 'dang_soan');

  const dn = await goi(xuLy, '/quay/dang-nhap', { method: 'POST', body: `mat_khau=${MK}`, headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } });
  const phien = (dn.headers.get('set-cookie') ?? '').split(';')[0];
  const xem = async (duong: string) => { const r = await goi(xuLy, duong, { headers: { cookie: phien } }); return { status: r.status, chu: await r.text() }; };
  const proto = await xem(`/quay?bao=constructor&ma=${d.ma}&den=dang_soan`);
  ok('HỒI QUY rà soát: ?bao=constructor / __proto__ / toString không làm sập màn quầy', proto.status === 200 && !proto.chu.includes('qd-bao')
    && (await xem('/quay?bao=__proto__')).status === 200 && (await xem('/quay?bao=toString')).status === 200);
  const khongDuoc = await xem('/quay?bao=khong_duoc');
  ok('HỒI QUY rà soát: "khong_duoc" không kèm mã đơn vẫn hiện câu báo', khongDuoc.chu.includes('Bước này không làm được'));
  ok('HỒI QUY rà soát: "khong_co" hiện câu báo', (await xem('/quay?bao=khong_co&ma=KHONGCO1')).chu.includes('Không thấy đơn này.'));
  ok('Câu cần số đơn mà không có đơn → không in câu có lỗ hổng "#null"', !(await xem('/quay?bao=da_doi&ma=KHONGCO1&den=dang_soan')).chu.includes('#null'));

  const chuaTra = donMoi(so, { maGui: 'ra-soat-chua-tra' });
  const huyChuaTra = await xem(`/quay/huy?ma=${chuaTra.ma}`);
  ok('HỒI QUY rà soát: trang hủy của đơn chưa trả tiền → "không hủy được", không nói khách đã trả tiền',
    huyChuaTra.chu.includes('không hủy được') && !huyChuaTra.chu.includes('đã chuyển khoản') && !huyChuaTra.chu.includes('name="den" value="can_hoan_tien"'));
  so.doiTrangThai(d.ma, 'dang_soan', 'cho_lay', LUC_DAT);
  so.doiTrangThai(d.ma, 'cho_lay', 'da_giao', LUC_DAT);
  ok('Trang hủy của đơn đã giao → "không hủy được"', (await xem(`/quay/huy?ma=${d.ma}`)).chu.includes('không hủy được'));
  ok('Trang hủy của mã không có → "Không thấy đơn này."', (await xem('/quay/huy?ma=KHONGCO1')).chu.includes('Không thấy đơn này.'));
  so.dong();
}

// =====================================================================================================
nhom('13 · VietQR: chuỗi chuẩn NAPAS, CRC16, tài khoản nhận');
const TK = { bin: '970415', soTaiKhoan: '113366668888', tenTaiKhoan: 'CONG TY TNHH SLK GROUP', tenNganHang: 'VietinBank' };
{
  ok('CRC16-CCITT của "123456789" là 29B1 (giá trị kiểm chuẩn)', crc16('123456789') === '29B1');
  const q = chuoiVietQr(TK, 750000, 'BTK7QX4M2A');
  // Cùng đầu vào, thư viện độc lập vietnam-qr-pay 1.5.1 dựng ra đúng chuỗi này (so tay 29/10/2026).
  ok('Chuỗi VietQR trùng từng ký tự với thư viện độc lập (vietnam-qr-pay)',
    q === '00020101021238560010A0000007270126000697041501121133666688880208QRIBFTTA530370454067500005802VN62140810BTK7QX4M2A63044BA7', q);
  const t = docTruong(q), nguoi = docTruong(t['38']), tk = docTruong(nguoi['01']);
  ok('Đọc lại: mã động, VND, VN, số tiền, nội dung, BIN, số tài khoản, CRC tính trên cả chuỗi',
    t['01'] === '12' && t['53'] === '704' && t['58'] === 'VN' && t['54'] === '750000' && docTruong(t['62'])['08'] === 'BTK7QX4M2A'
    && nguoi['00'] === 'A000000727' && nguoi['02'] === 'QRIBFTTA' && tk['00'] === '970415' && tk['01'] === '113366668888'
    && crc16(q.slice(0, -4)) === t['63']);
  const nem = (f: () => unknown) => { try { f(); return false; } catch { return true; } };
  ok('Số tiền 0, âm, lẻ; nội dung có dấu hay dài quá 25 ký tự → không dựng mã',
    nem(() => chuoiVietQr(TK, 0, 'BT1')) && nem(() => chuoiVietQr(TK, -5, 'BT1')) && nem(() => chuoiVietQr(TK, 1.5, 'BT1'))
    && nem(() => chuoiVietQr(TK, 1000, 'Thanh toán')) && nem(() => chuoiVietQr(TK, 1000, 'B'.repeat(26))));
  ok('Nội dung chuyển khoản là "BT" + mã đơn', noiDungChuyenKhoan('K7QX4M2A') === 'BTK7QX4M2A');
  ok('Tài khoản nhận: đủ 4 trường đúng dạng mới hợp lệ', laTaiKhoanNhan(TK) && !laTaiKhoanNhan({ ...TK, bin: '97041' })
    && !laTaiKhoanNhan({ ...TK, soTaiKhoan: '12ab' }) && !laTaiKhoanNhan({ ...TK, tenTaiKhoan: ' ' }) && !laTaiKhoanNhan({}));
}

nhom('14 · SePay: chữ ký HMAC, đọc tin tiền về, tìm mã đơn');
const KHOA_SEPAY = 'khoa-ky-sepay-thu-0123456789';
const kyThu = (than: string, giay: number, khoa = KHOA_SEPAY) =>
  'sha256=' + createHmac('sha256', khoa).update(`${giay}.${than}`).digest('hex');
{
  const than = '{"id":1,"transferType":"in"}', g = 1_800_000_000;
  ok('Chữ ký đúng → dung', kiemChuKy(than, kyThu(than, g), String(g), KHOA_SEPAY, g + 10) === 'dung');
  ok('Thân bị sửa một ký tự → sai_chu_ky', kiemChuKy(than.replace('1', '2'), kyThu(than, g), String(g), KHOA_SEPAY, g) === 'sai_chu_ky');
  ok('Ký bằng khóa khác → sai_chu_ky', kiemChuKy(than, kyThu(than, g, 'khoa-khac-0123456789'), String(g), KHOA_SEPAY, g) === 'sai_chu_ky');
  ok('Ký ở tương lai quá 5 phút, hay cũ quá 6 giờ → qua_han', kiemChuKy(than, kyThu(than, g), String(g), KHOA_SEPAY, g - 301) === 'qua_han'
    && kiemChuKy(than, kyThu(than, g), String(g), KHOA_SEPAY, g + 6 * 3600 + 1) === 'qua_han');
  ok('SePay gửi lại mang giờ ký cũ 33 phút, 5 giờ → vẫn dung (khoản tiền thật không bị từ chối mãi)',
    kiemChuKy(than, kyThu(than, g), String(g), KHOA_SEPAY, g + 33 * 60) === 'dung' && kiemChuKy(than, kyThu(than, g), String(g), KHOA_SEPAY, g + 5 * 3600) === 'dung');
  ok('Thiếu header, giờ không phải số, chữ ký sai độ dài, khóa rỗng → sai_chu_ky',
    kiemChuKy(than, null, String(g), KHOA_SEPAY, g) === 'sai_chu_ky' && kiemChuKy(than, kyThu(than, g), 'abc', KHOA_SEPAY, g) === 'sai_chu_ky'
    && kiemChuKy(than, 'sha256=00', String(g), KHOA_SEPAY, g) === 'sai_chu_ky' && kiemChuKy(than, kyThu(than, g, ''), String(g), '', g) === 'sai_chu_ky');
  ok('Thân trả về đúng y {"success": true} như SePay đòi', DA_NHAN === '{"success": true}' && JSON.parse(DA_NHAN).success === true);

  // Mẫu tin trong tài liệu SePay (developer.sepay.vn, Tích hợp webhook), đổi nội dung sang mã đơn của Beeftown.
  const mau = { id: 92704, gateway: 'VietinBank', transactionDate: '2026-11-13 09:12:33', accountNumber: '113366668888', subAccount: '',
    code: null, content: 'BTK7QX4M9A chuyen tien', transferType: 'in', description: 'NGUYEN VAN A chuyen tien',
    transferAmount: 750000, accumulated: 105000000, referenceCode: 'FT24012345678' };
  const tin = docTinTienVe(mau);
  ok('Đọc mẫu tin SePay: id, tiền vào, số tiền, tài khoản, giờ, mã tham chiếu, mã đơn từ nội dung',
    tin?.idSepay === 92704 && tin.vao && tin.soTien === 750000 && tin.soTaiKhoan === '113366668888' && tin.ngayGiaoDich === '2026-11-13 09:12:33'
    && tin.maThamChieu === 'FT24012345678' && tin.maDon === 'K7QX4M9A' && tin.taiKhoanPhu === '' && tin.coMaQuan, JSON.stringify(tin));
  ok('Đọc tài khoản ảo (VA) ở subAccount', docTinTienVe({ ...mau, subAccount: ' VQRK7QX ' })?.taiKhoanPhu === 'VQRK7QX'
    && docTinTienVe({ ...mau, subAccount: null })?.taiKhoanPhu === '');
  ok('"BT" + 8 ký tự gõ sai (có 2, O) → không ra mã đơn nhưng vẫn là mã của quán (phải có người xem)',
    [docTinTienVe({ ...mau, content: 'BTK7QX4M2A' }), docTinTienVe({ ...mau, content: 'bt K7QXOM9A' }), docTinTienVe({ ...mau, code: 'BTK7QX4M2A', content: '' })]
      .every(t => t?.maDon === null && t.coMaQuan) && docTinTienVe({ ...mau, content: 'Tien hang thang 11' })?.coMaQuan === false);
  ok('Tin đọc ra không mang nội dung, mô tả (có thể có tên người chuyển)', !JSON.stringify(tin).includes('NGUYEN') && !JSON.stringify(tin).includes('chuyen tien'));
  ok('Thiếu id, id âm, số tiền 0 hay lẻ, transferType lạ, không phải đối tượng → null',
    [{ ...mau, id: undefined }, { ...mau, id: -1 }, { ...mau, transferAmount: 0 }, { ...mau, transferAmount: 1.5 }, { ...mau, transferType: 'x' },
      { ...mau, accountNumber: 5 }, null, [], 'x'].every(b => docTinTienVe(b) === null));
  ok('Tìm mã: chữ thường, có dấu cách sau BT, giữa câu, mã SePay đã bóc (ưu tiên)',
    timMaDon(null, 'btk7qx4m9a ck') === 'K7QX4M9A' && timMaDon(null, 'BT K7QX4M9A') === 'K7QX4M9A'
    && timMaDon(null, 'NGUYEN VAN A CHUYEN TIEN BTK7QX4M9A FT123') === 'K7QX4M9A' && timMaDon('BTAAAAAAAA', 'BTK7QX4M9A') === 'AAAAAAAA');
  ok('Không nhận mã sai: 9 ký tự liền, chữ dễ nhầm (O, 0), thiếu tiền tố',
    timMaDon(null, 'BTK7QX4M9AB') === null && timMaDon(null, 'BTK7QX4MO0') === null && timMaDon(null, 'K7QX4M9A') === null && timMaDon(5, null) === null);
  ok('Không nhận "BT" dính sau chữ khác ("DEBTK7QX4M9A", "2BTK7QX4M9A")', timMaDon(null, 'DEBTK7QX4M9A') === null && timMaDon(null, '2BTK7QX4M9A') === null
    && timMaDon(null, 'CK.BTK7QX4M9A') === 'K7QX4M9A');
}

nhom('15 · Sổ đơn ghi tiền về: đúng một lần, đủ / thiếu / dư / không khớp');
{
  const so = new SoDon(':memory:');
  const d = donMoi(so, { maGui: 'tien-ve-du-0001' });
  const tinVe = (them: Partial<TinTienVe> = {}): TinTienVe => ({
    idSepay: 1, vao: true, soTien: d.tongTien, soTaiKhoan: TK.soTaiKhoan, taiKhoanPhu: '', coMaQuan: true, ngayGiaoDich: '2026-11-13 09:00:00',
    maThamChieu: 'FT1', maDon: d.ma, ...them,
  });
  const r1 = so.ghiTienVe(tinVe(), TK.soTaiKhoan, LUC_DAT);
  ok('Đủ tiền → "du", đơn sang "đã trả tiền", nhật ký ghi "sepay"', r1.moi && r1.ketQua === 'du' && so.layDon(d.ma)!.trangThai === 'da_thanh_toan'
    && (so.db.query("select ai from nhat_ky where ma_don = ? and den = 'da_thanh_toan'").get(d.ma) as { ai: string }).ai === 'sepay');
  const r2 = so.ghiTienVe(tinVe(), TK.soTaiKhoan, LUC_DAT + 60_000);
  ok('SePay gửi lại cùng id → không ghi lần hai, trả kết quả cũ', !r2.moi && r2.ketQua === 'du'
    && (so.db.query('select count(*) as n from giao_dich').get() as { n: number }).n === 1 && so.tienDaNhan(d.ma) === d.tongTien);
  const r3 = so.ghiTienVe(tinVe({ idSepay: 2, soTien: 50_000 }), TK.soTaiKhoan, LUC_DAT);
  ok('Tiền về thêm cho đơn đã trả → "thua", phải xem, đơn không đổi', r3.ketQua === 'thua' && so.layDon(d.ma)!.trangThai === 'da_thanh_toan'
    && so.tienVeCanXem().some(t => t.idSepay === 2 && t.ketQua === 'thua'));

  const hai = donMoi(so, { maGui: 'tien-ve-thieu-01' });
  const a = so.ghiTienVe(tinVe({ idSepay: 3, soTien: 100_000, maDon: hai.ma }), TK.soTaiKhoan, LUC_DAT);
  ok('Chuyển thiếu → "thieu", đơn vẫn chờ trả tiền, hiện trong "Tiền về cần xem"', a.ketQua === 'thieu' && so.layDon(hai.ma)!.trangThai === 'cho_thanh_toan'
    && so.tienVeCanXem().some(t => t.idSepay === 3 && t.tongDaNhan === 100_000 && t.tongTienDon === hai.tongTien));
  const b = so.ghiTienVe(tinVe({ idSepay: 4, soTien: hai.tongTien - 100_000, maDon: hai.ma }), TK.soTaiKhoan, LUC_DAT);
  ok('Chuyển nốt phần còn lại → "du", đơn đã trả, lần "thiếu" trước không còn phải xem', b.ketQua === 'du'
    && so.layDon(hai.ma)!.trangThai === 'da_thanh_toan' && !so.tienVeCanXem().some(t => t.idSepay === 3));

  const ba = donMoi(so, { maGui: 'tien-ve-du-tien-01' });
  const c = so.ghiTienVe(tinVe({ idSepay: 5, soTien: ba.tongTien + 20_000, maDon: ba.ma }), TK.soTaiKhoan, LUC_DAT);
  ok('Chuyển dư → "thua": đơn vẫn sang đã trả (soạn được), lần chuyển phải xem để hoàn phần dư',
    c.ketQua === 'thua' && so.layDon(ba.ma)!.trangThai === 'da_thanh_toan' && so.tienVeCanXem().some(t => t.idSepay === 5));

  const bon = donMoi(so, { maGui: 'tien-ve-het-han-1' });
  so.datHetHan(LUC_DAT + (PHUT_CHO_THANH_TOAN + 1) * 60_000);
  const e = so.ghiTienVe(tinVe({ idSepay: 6, soTien: bon.tongTien, maDon: bon.ma }), TK.soTaiKhoan, LUC_DAT + 40 * 60_000);
  ok('Đơn đã hết hạn mà tiền vẫn về đủ → đơn thành "đã trả tiền" (tiền khách không bị bỏ quên)', e.ketQua === 'du' && so.layDon(bon.ma)!.trangThai === 'da_thanh_toan');

  ok('Có mã BT… mà không có đơn → "khong_khop", phải xem', so.ghiTienVe(tinVe({ idSepay: 7, maDon: 'KHONGCO1' }), TK.soTaiKhoan, LUC_DAT).ketQua === 'khong_khop'
    && so.tienVeCanXem().some(t => t.idSepay === 7 && t.maDon === null));
  ok('Nội dung không có mã → "khong_ma", không phải xem (tiền khác của công ty)', so.ghiTienVe(tinVe({ idSepay: 8, maDon: null, coMaQuan: false }), TK.soTaiKhoan, LUC_DAT).ketQua === 'khong_ma'
    && !so.tienVeCanXem().some(t => t.idSepay === 8));
  ok('"BT" + mã gõ sai (không đọc ra đơn) → "khong_khop", phải xem — không lặng lẽ thành tiền khác của công ty',
    so.ghiTienVe(tinVe({ idSepay: 11, maDon: null, coMaQuan: true }), TK.soTaiKhoan, LUC_DAT).ketQua === 'khong_khop'
    && so.tienVeCanXem().some(t => t.idSepay === 11 && t.ketQua === 'khong_khop'));
  const nam = donMoi(so, { maGui: 'tien-ve-tk-khac-1' });
  ok('Tiền mang mã đơn vào tài khoản khác → "sai_tai_khoan", đơn không đổi, nhưng phải xem',
    so.ghiTienVe(tinVe({ idSepay: 9, soTaiKhoan: '999999999', maDon: nam.ma }), TK.soTaiKhoan, LUC_DAT).ketQua === 'sai_tai_khoan'
    && so.layDon(nam.ma)!.trangThai === 'cho_thanh_toan' && so.tienVeCanXem().some(t => t.idSepay === 9 && t.ketQua === 'sai_tai_khoan'));
  ok('Tiền không mã vào tài khoản khác → "sai_tai_khoan", không phải xem', so.ghiTienVe(tinVe({ idSepay: 12, soTaiKhoan: '999999999', maDon: null, coMaQuan: false }),
    TK.soTaiKhoan, LUC_DAT).ketQua === 'sai_tai_khoan' && !so.tienVeCanXem().some(t => t.idSepay === 12));
  ok('Chưa biết tài khoản của quán (rỗng) → không khớp tài khoản nào, kể cả tin có số tài khoản rỗng',
    so.ghiTienVe(tinVe({ idSepay: 13, soTaiKhoan: '', maDon: nam.ma }), '', LUC_DAT).ketQua === 'sai_tai_khoan' && so.layDon(nam.ma)!.trangThai === 'cho_thanh_toan');
  const va = donMoi(so, { maGui: 'tien-ve-tk-ao-001' });
  ok('Tiền vào tài khoản ảo (VA) của quán — số chính khác, subAccount đúng → "du", đơn đã trả',
    so.ghiTienVe(tinVe({ idSepay: 14, soTaiKhoan: '000111222333', taiKhoanPhu: TK.soTaiKhoan, soTien: va.tongTien, maDon: va.ma }), TK.soTaiKhoan, LUC_DAT).ketQua === 'du'
    && so.layDon(va.ma)!.trangThai === 'da_thanh_toan');
  ok('Tiền đã nhận theo đơn (một câu cho màn quầy) khớp từng đơn', [d, hai, ba, bon, nam, va].every(x => (so.tienDaNhanTheoDon().get(x.ma) ?? 0) === so.tienDaNhan(x.ma))
    && so.tienDaNhan(va.ma) === va.tongTien && so.tienDaNhan(nam.ma) === 0 && !so.tienDaNhanTheoDon().has('KHONGCO1'));
  ok('Tiền ra → "tien_ra", đơn không đổi', so.ghiTienVe(tinVe({ idSepay: 10, vao: false, maDon: nam.ma }), TK.soTaiKhoan, LUC_DAT).ketQua === 'tien_ra'
    && so.layDon(nam.ma)!.trangThai === 'cho_thanh_toan');
  ok('Đánh dấu đã xử lý: lần đầu da_doi, bấm đúp da_o_buoc_moi, id lạ khong_co', so.danhDauDaXem(7, LUC_DAT) === 'da_doi'
    && so.danhDauDaXem(7, LUC_DAT) === 'da_o_buoc_moi' && so.danhDauDaXem(999, LUC_DAT) === 'khong_co' && so.danhDauDaXem(8, LUC_DAT) === 'khong_co'
    && !so.tienVeCanXem().some(t => t.idSepay === 7));
  const cot = (so.db.query('pragma table_info(giao_dich)').all() as { name: string }[]).map(x => x.name);
  ok('Bảng giao_dich không có cột nội dung, mô tả, tên người chuyển', !cot.some(c => /noi_dung|mo_ta|ten|content|description/.test(c)), cot.join(','));
  const sl = so.soLieu(LUC_DAT);
  ok('Số liệu sức khỏe có giờ tiền về cuối và số lần cần xem', sl.lanTienVeCuoi !== null && sl.soTienVeCanXem === so.tienVeCanXem().length);
  so.dong();

  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'may-chu-don-sepay-'));
  const x = new SoDon(path.join(tam, 'don.sqlite')), y = new SoDon(path.join(tam, 'don.sqlite'));
  const sau = donMoi(x, { maGui: 'tien-ve-hai-may-1' });
  const tin: TinTienVe = { idSepay: 77, vao: true, soTien: sau.tongTien, soTaiKhoan: TK.soTaiKhoan, taiKhoanPhu: '', coMaQuan: true, ngayGiaoDich: '', maThamChieu: '', maDon: sau.ma };
  const kq = [x.ghiTienVe(tin, TK.soTaiKhoan, LUC_DAT), y.ghiTienVe(tin, TK.soTaiKhoan, LUC_DAT)];
  ok('Hai webhook cùng id tới hai kết nối cùng lúc → đúng một lần ghi, đơn đổi một lần',
    kq.filter(k => k.moi).length === 1 && (x.db.query("select count(*) as n from nhat_ky where ma_don = ? and den = 'da_thanh_toan'").get(sau.ma) as { n: number }).n === 1);
  x.dong(); y.dong();
  fs.rmSync(tam, { recursive: true, force: true });
}

nhom('16 · Đường /sepay/tien-ve và thông tin trả tiền trong /api/don');
{
  const so = new SoDon(':memory:');
  const { xuLy, datGio } = taoMay(so, { taiKhoan: TK, khoaSepay: KHOA_SEPAY, choTraGiaThu: true });
  const r = await guiDon(xuLy, donHopLe({ maGui: 'api-tra-tien-0001' }));
  const j = await r.json() as { ma: string; khoa: string; tongTien: number; thanhToan: { traDuoc: boolean; soTien: number; noiDung: string; chuoiQr: string; tenTaiKhoan: string; hetHanLuc: number } };
  ok('Đơn mới có thông tin trả tiền: đúng số tiền, nội dung BT+mã, tên chủ tài khoản, mã VietQR đúng CRC, hạn 30 phút',
    j.thanhToan.traDuoc && j.thanhToan.soTien === j.tongTien && j.thanhToan.noiDung === `BT${j.ma}` && j.thanhToan.tenTaiKhoan === TK.tenTaiKhoan
    && crc16(j.thanhToan.chuoiQr.slice(0, -4)) === j.thanhToan.chuoiQr.slice(-4) && docTruong(j.thanhToan.chuoiQr)['54'] === String(j.tongTien)
    && j.thanhToan.hetHanLuc === LUC_DAT + PHUT_CHO_THANH_TOAN * 60_000, JSON.stringify(j.thanhToan));
  const qr = await goi(xuLy, `/api/don/${j.ma}/qr.svg?khoa=${j.khoa}`);
  ok('Ảnh mã QR: SVG, không cache, có CORS cho Mini App', qr.status === 200 && qr.headers.get('content-type') === 'image/svg+xml'
    && (await qr.text()).startsWith('<svg') && qr.headers.get('cache-control') === 'no-store' && qr.headers.get('access-control-allow-origin') === '*');
  ok('Ảnh mã QR sai khóa → 404', (await goi(xuLy, `/api/don/${j.ma}/qr.svg?khoa=${'0'.repeat(32)}`)).status === 404);
  const khongCo = await goi(xuLy, `/api/don/${j.ma}?khoa=${'0'.repeat(32)}`), duongLa = await goi(xuLy, '/api/khong-co-duong');
  ok('Không có đơn → 404 kèm lyDo "khong_thay_don"; sai đường → 404 không có lyDo đó (Mini App không xóa đơn đã giữ)',
    khongCo.status === 404 && (await khongCo.json() as { lyDo?: string }).lyDo === 'khong_thay_don'
    && duongLa.status === 404 && (await duongLa.json() as { lyDo?: string }).lyDo === undefined);

  const gui = (than: unknown, them: Record<string, string> = {}, giay = Math.floor(LUC_DAT / 1000)) => {
    const chu = typeof than === 'string' ? than : JSON.stringify(than);
    return goi(xuLy, '/sepay/tien-ve', { method: 'POST', body: chu, headers: { 'content-type': 'application/json',
      'x-sepay-signature': kyThu(chu, giay), 'x-sepay-timestamp': String(giay), ...them } }, '171.244.35.2');
  };
  const tinSepay = (them: Record<string, unknown> = {}) => ({ id: 5001, gateway: 'VietinBank', transactionDate: '2026-11-13 09:05:00',
    accountNumber: TK.soTaiKhoan, subAccount: '', code: null, content: `${j.ma.toLowerCase()} bt${j.ma.toLowerCase()} NGUYEN VAN A`, transferType: 'in',
    description: 'NGUYEN VAN A 0123456789 chuyen tien', transferAmount: 200_000, accumulated: 0, referenceCode: 'FT26001', ...them });

  const saiKy = await gui(tinSepay(), { 'x-sepay-signature': 'sha256=' + '0'.repeat(64) });
  ok('Chữ ký sai → 401, không ghi gì', saiKy.status === 401 && (so.db.query('select count(*) as n from giao_dich').get() as { n: number }).n === 0);
  const cu = await gui(tinSepay(), {}, Math.floor(LUC_DAT / 1000) - 7 * 3600);
  ok('Tin ký 7 giờ trước → 401, không ghi gì', cu.status === 401 && (so.db.query('select count(*) as n from giao_dich').get() as { n: number }).n === 0);
  const r1 = await gui(tinSepay());
  ok('Tin đúng, chuyển thiếu → 200 {"success": true}, đơn vẫn chờ, còn thiếu đúng phần chưa chuyển',
    r1.status === 200 && (await r1.text()) === DA_NHAN && so.layDon(j.ma)!.trangThai === 'cho_thanh_toan');
  const xem = await (await goi(xuLy, `/api/don/${j.ma}?khoa=${j.khoa}`)).json() as { daNhan: number; thanhToan: { traDuoc: boolean; soTien: number } };
  ok('Khách xem đơn: đã nhận 200.000 đ, mã trả tiền mới cho đúng phần còn thiếu', xem.daNhan === 200_000 && xem.thanhToan.traDuoc
    && xem.thanhToan.soTien === j.tongTien - 200_000);
  const lai = await gui(tinSepay(), {}, Math.floor(LUC_DAT / 1000) - 33 * 60);
  ok('SePay gửi lại cùng id, giờ ký cũ 33 phút → 200, không ghi lần hai', lai.status === 200 && (await lai.text()) === DA_NHAN && so.tienDaNhan(j.ma) === 200_000);
  const r2 = await gui(tinSepay({ id: 5002, transferAmount: j.tongTien - 200_000, code: `BT${j.ma}` }));
  ok('Chuyển nốt → đơn "đã trả tiền"', r2.status === 200 && so.layDon(j.ma)!.trangThai === 'da_thanh_toan');
  const sau = await (await goi(xuLy, `/api/don/${j.ma}?khoa=${j.khoa}`)).json() as { thanhToan: { traDuoc: boolean }; trangThai: string };
  ok('Đơn đã trả: không còn mã trả tiền, ảnh QR 404', !sau.thanhToan.traDuoc && sau.trangThai === 'da_thanh_toan'
    && (await goi(xuLy, `/api/don/${j.ma}/qr.svg?khoa=${j.khoa}`)).status === 404);
  ok('Sổ đơn không giữ tên, số tài khoản người chuyển trong nội dung / mô tả',
    !JSON.stringify(so.db.query('select * from giao_dich').all()).includes('NGUYEN') && !JSON.stringify(so.db.query('select * from giao_dich').all()).includes('0123456789'));

  const khongJson = await gui('khong phai json');
  ok('Thân đã ký mà không phải JSON → 400, không phải "success"', khongJson.status === 400 && !(await khongJson.text()).includes('"success": true'));
  ok('Thân đã ký mà thiếu trường → 400', (await gui({ id: 'x' })).status === 400);

  const hong = Object.create(so) as SoDon;
  hong.ghiTienVe = () => { throw new Error('database is locked'); };
  const { xuLy: xuLyHong } = taoMay(hong, { taiKhoan: TK, khoaSepay: KHOA_SEPAY });
  const chu = JSON.stringify(tinSepay({ id: 5003 })), g = Math.floor(LUC_DAT / 1000);
  const rHong = await goi(xuLyHong, '/sepay/tien-ve', { method: 'POST', body: chu, headers: { 'content-type': 'application/json',
    'x-sepay-signature': kyThu(chu, g), 'x-sepay-timestamp': String(g) } });
  ok('Sổ đơn hỏng lúc ghi tiền về → 500, KHÔNG trả {"success": true} (SePay gửi lại)', rHong.status === 500 && !(await rHong.text()).includes('"success": true'));

  const { xuLy: chuaKhoa } = taoMay(new SoDon(':memory:'));
  ok('Chưa đặt khóa SePay → 503 (SePay gửi lại), chưa có tài khoản → đơn ghi nhưng không có mã trả tiền',
    (await goi(chuaKhoa, '/sepay/tien-ve', { method: 'POST', body: '{}' })).status === 503
    && ((await (await guiDon(chuaKhoa, donHopLe())).json()) as { thanhToan: { traDuoc: boolean; lyDo: string } }).thanhToan.lyDo === 'chua_co_tai_khoan');
  const soKhongTk = new SoDon(':memory:');
  const { xuLy: khongTk } = taoMay(soKhongTk, { khoaSepay: KHOA_SEPAY });
  const chuKtk = JSON.stringify(tinSepay({ id: 5010 }));
  const rKtk = await goi(khongTk, '/sepay/tien-ve', { method: 'POST', body: chuKtk, headers: { 'content-type': 'application/json',
    'x-sepay-signature': kyThu(chuKtk, g), 'x-sepay-timestamp': String(g) } });
  ok('Có khóa SePay mà chưa có tài khoản nhận → 503, không ghi vĩnh viễn là "sai tài khoản" (SePay gửi lại sau)',
    rKtk.status === 503 && (soKhongTk.db.query('select count(*) as n from giao_dich').get() as { n: number }).n === 0);
  soKhongTk.dong();

  // Đơn đã ghi rồi mà dựng phần trả tiền hỏng (sổ đơn bận): vẫn trả đơn, không nói "CHƯA được ghi".
  const soBan = new SoDon(':memory:');
  const ban = Object.create(soBan) as SoDon;
  ban.tienDaNhan = () => { throw new Error('database is locked'); };
  const { xuLy: xuLyBan } = taoMay(ban, { taiKhoan: TK, khoaSepay: KHOA_SEPAY, choTraGiaThu: true });
  const rBan = await guiDon(xuLyBan, donHopLe({ maGui: 'api-tra-tien-ban-1' }));
  const jBan = await rBan.text();
  ok('Phần trả tiền hỏng sau khi đơn đã ghi → vẫn trả mã đơn (lyDo "tam_loi"), không câu "CHƯA được ghi"',
    rBan.ok && JSON.parse(jBan).thanhToan.lyDo === 'tam_loi' && !jBan.includes('CHƯA') && soBan.layDon(JSON.parse(jBan).ma) !== null, jBan);
  soBan.dong();

  const { xuLy: giaThu } = taoMay(new SoDon(':memory:'), { taiKhoan: TK, khoaSepay: KHOA_SEPAY });
  const jg = await (await guiDon(giaThu, donHopLe())).json() as { thanhToan: { traDuoc: boolean; lyDo: string } };
  ok(`Bảng giá còn là giá thử (giaThu = ${CAU_HINH.giaThu}) và không bật CHO_TRA_GIA_THU → không có mã trả tiền`,
    !CAU_HINH.giaThu || (!jg.thanhToan.traDuoc && jg.thanhToan.lyDo === 'gia_thu'));
  datGio(LUC_DAT);

  // Màn hình quầy: mục "Tiền về cần xem" và nút "Đã xử lý xong".
  await gui(tinSepay({ id: 5004, transferAmount: 30_000, code: `BT${j.ma}` }));
  const dn = await goi(xuLy, '/quay/dang-nhap', { method: 'POST', body: `mat_khau=${MK}`, headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } });
  const phien = (dn.headers.get('set-cookie') ?? '').split(';')[0];
  const trang = await (await goi(xuLy, '/quay', { headers: { cookie: phien } })).text();
  ok('Màn quầy: mục "Tiền về cần xem" có lần chuyển dư 30.000 đ, giờ kiểu "09:05, 13/11/2026", mã giao dịch, câu "Hoàn phần dư"',
    trang.includes('Tiền về cần xem (1)') && trang.includes('30.000 đ') && trang.includes('09:05, 13/11/2026') && trang.includes('FT26001')
    && trang.includes('Hoàn phần dư'));
  ok('Thẻ đơn ghi số tiền đã nhận (chuyển khoản hay VNPay: "Đã nhận tiền")', trang.includes(`Đã nhận tiền: ${(j.tongTien + 30_000).toLocaleString('vi-VN')} đ`));
  const daXem = await goi(xuLy, '/quay/tien-ve/da-xem', { method: 'POST', body: 'id=5004',
    headers: { cookie: phien, 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } });
  ok('Bấm "Đã xử lý xong" → mục đó biến mất, có câu báo', daXem.status === 303 && (daXem.headers.get('location') ?? '').includes('tien_ve_da_xem')
    && !(await (await goi(xuLy, '/quay', { headers: { cookie: phien } })).text()).includes('Tiền về cần xem ('));
  const idLa = await goi(xuLy, '/quay/tien-ve/da-xem', { method: 'POST', body: 'id=424242',
    headers: { cookie: phien, 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } });
  const trangIdLa = await (await goi(xuLy, idLa.headers.get('location') ?? '/quay', { headers: { cookie: phien } })).text();
  ok('"Đã xử lý xong" cho lần chuyển không có → câu riêng của tiền về, không "Không thấy đơn này"',
    (idLa.headers.get('location') ?? '').includes('tien_ve_khong_co') && trangIdLa.includes('Không thấy lần chuyển này') && !trangIdLa.includes('Không thấy đơn này'));
  const khongPhien = await goi(xuLy, '/quay/tien-ve/da-xem', { method: 'POST', body: 'id=5004', headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } });
  ok('Chưa đăng nhập không bấm được "Đã xử lý xong"', khongPhien.status === 303 && (khongPhien.headers.get('location') ?? '') === '/quay');
  so.dong();
}

// =====================================================================================================
nhom('17 · Chạy src/main.ts thật');
{
  const thieu = Bun.spawnSync(['bun', 'src/main.ts'], { cwd: path.join(import.meta.dir, '..'), env: { ...process.env, MAT_KHAU_QUAY: 'ngan' } });
  ok('Mật khẩu quầy dưới 8 ký tự → không mở máy chủ, báo rõ', thieu.exitCode === 1 && thieu.stderr.toString().includes('MAT_KHAU_QUAY'));
  const chayThu = (them: Record<string, string>) => Bun.spawnSync(['bun', 'src/main.ts'], { cwd: path.join(import.meta.dir, '..'),
    env: { ...process.env, MAT_KHAU_QUAY: MK, CONG: '1', THU_MUC_DU_LIEU: path.join(os.tmpdir(), 'may-chu-don-khong-mo'), ...them } });
  const nuaVoi = chayThu({ SO_TAI_KHOAN: TK.soTaiKhoan });
  ok('Tài khoản nhận khai thiếu (chỉ có số tài khoản) → không mở máy chủ, kẻo khách chuyển vào đâu không rõ',
    nuaVoi.exitCode === 1 && nuaVoi.stderr.toString().includes('NGAN_HANG_BIN'));
  const khoaNgan = chayThu({ SEPAY_KHOA_KY: 'ngan' });
  ok('Khóa SePay dưới 16 ký tự → không mở máy chủ', khoaNgan.exitCode === 1 && khoaNgan.stderr.toString().includes('SEPAY_KHOA_KY'));
  const khoaKhongTk = chayThu({ SEPAY_KHOA_KY: KHOA_SEPAY });
  ok('Có khóa SePay mà chưa có tài khoản nhận → không mở máy chủ, báo rõ', khoaKhongTk.exitCode === 1
    && khoaKhongTk.stderr.toString().includes('SO_TAI_KHOAN'));
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'may-chu-don-main-'));
  const cong = 20000 + Math.floor(Math.random() * 20000);
  const p = Bun.spawn(['bun', 'src/main.ts'], {
    cwd: path.join(import.meta.dir, '..'),
    env: { ...process.env, MAT_KHAU_QUAY: MK, CONG: String(cong), THU_MUC_DU_LIEU: tam },
    stdout: 'pipe', stderr: 'pipe',
  });
  let sk: Response | null = null;
  for (let i = 0; i < 50 && !sk; i++) { await Bun.sleep(100); sk = await fetch(`http://127.0.0.1:${cong}/suc-khoe`).catch(() => null); }
  ok('main.ts mở cổng, /suc-khoe trả 200', sk?.status === 200);
  ok('Sổ đơn nằm trong THU_MUC_DU_LIEU', fs.existsSync(path.join(tam, 'don.sqlite')));
  p.kill('SIGTERM');
  ok('SIGTERM → tắt gọn', await Promise.race([p.exited.then(c => c === 0), Bun.sleep(5000).then(() => false)]));
  fs.rmSync(tam, { recursive: true, force: true });
}

// =====================================================================================================
nhom('18 · Mini App gọi máy chủ thật (mini-app/src/tra-truoc.ts): đặt, trả thiếu, trả nốt');
{
  const so = new SoDon(':memory:');
  const { xuLy } = taoMay(so, { taiKhoan: TK, khoaSepay: KHOA_SEPAY, choTraGiaThu: true });
  const GOC_MAY = 'http://don.beeftown.test';
  // fetch của Mini App đi thẳng vào taoXuLy: cùng Request, cùng thân, cùng mã trả lời như qua mạng.
  const quaMayChu: HamFetchApi = async (url, init) => {
    const tra = await xuLy(new Request(url, { method: init.method, headers: init.headers, body: init.body }), '10.0.0.9');
    return { status: tra.status, json: () => tra.json() };
  };
  const nhan = { cachNhan: 'giao-hang' as const, ngay: '2026-11-13', gio: '18:30', ten: ' Khánh ', dienThoai: '0912 345 678',
    diaChi: '12 Nguyễn Huệ, phường Sài Gòn', cachTra: 'chuyen-khoan' as const, ghiChu: '' };
  const than = taoThanDon(taoMaGui(), { 'ribeye-with-cap': 2, 'la-galbi': 1 }, nhan);
  const g1 = await guiDonLenMayChu(GOC_MAY, than, quaMayChu);
  ok('Thân đơn Mini App soạn được máy chủ nhận: đơn ghi, có khóa xem, có mã trả tiền đúng tổng tiền máy chủ tính',
    g1.loai === 'da-ghi' && g1.don.thanhToan.traDuoc && g1.don.thanhToan.soTien === g1.don.tongTien
    && g1.don.tongTien === so.layDon(g1.don.ma)!.tongTien, JSON.stringify(g1));
  const g2 = await guiDonLenMayChu(GOC_MAY, than, quaMayChu);
  ok('Mini App gửi lại cùng mã gửi (mất câu trả lời) → cùng đơn, không ra đơn thứ hai',
    g1.loai === 'da-ghi' && g2.loai === 'da-ghi' && g2.don.ma === g1.don.ma
    && (so.db.query('select count(*) as n from don').get() as { n: number }).n === 1);
  if (g1.loai === 'da-ghi') {
    const { ma } = g1.don, khoa = g1.khoa;
    const doc = () => docDonTuMayChu(GOC_MAY, ma, khoa, quaMayChu);
    const d0 = await doc();
    ok('Mini App đọc đơn: chờ trả tiền, hiện mã QR', d0.loai === 'co' && buocTraTien(d0.don).buoc === 'cho-tra'
      && d0.don.ngayNhan === '2026-11-13' && d0.don.gioNhan === '18:30');
    const tienVe = (id: number, soTien: number) => {
      const chu = JSON.stringify({ id, gateway: 'VietinBank', transactionDate: '2026-11-13 09:02:00', accountNumber: TK.soTaiKhoan,
        subAccount: '', code: null, content: `BT${ma} chuyen tien`, transferType: 'in', description: '', transferAmount: soTien,
        accumulated: 0, referenceCode: `FT${id}` });
      const giay = Math.floor(LUC_DAT / 1000);
      return goi(xuLy, '/sepay/tien-ve', { method: 'POST', body: chu, headers: { 'content-type': 'application/json',
        'x-sepay-signature': kyThu(chu, giay), 'x-sepay-timestamp': String(giay) } });
    };
    await tienVe(7001, 100_000);
    const d1 = await doc();
    const b1 = d1.loai === 'co' ? buocTraTien(d1.don) : null;
    ok('Chuyển thiếu → Mini App vẫn hiện mã, đúng phần còn thiếu, ghi đã nhận 100.000 đ',
      b1?.buoc === 'cho-tra' && b1.daNhan === 100_000 && b1.thanhToan.soTien === g1.don.tongTien - 100_000, JSON.stringify(b1));
    await tienVe(7002, g1.don.tongTien - 100_000);
    const d2 = await doc();
    const b2 = d2.loai === 'co' ? buocTraTien(d2.don) : null;
    ok('Chuyển nốt → Mini App hiện "đã nhận đủ" chỉ khi máy chủ đã ghi đơn sang đã trả tiền',
      b2?.buoc === 'da-nhan-du' && b2.thua === 0 && so.layDon(ma)!.trangThai === 'da_thanh_toan', JSON.stringify(b2));
    ok('Sai khóa xem → Mini App báo không thấy đơn',
      (await docDonTuMayChu(GOC_MAY, ma, '0'.repeat(32), quaMayChu)).loai === 'khong-thay');
    ok('Mini App sai đường (sai địa chỉ máy chủ) → "không rõ", không phải "không thấy đơn"',
      (await docDonTuMayChu(`${GOC_MAY}/sai`, ma, khoa, quaMayChu)).loai === 'khong-ro');
    let bi429 = 0;
    for (let i = 0; i < 160; i++) if ((await goi(xuLy, `/api/don/${ma}?khoa=${khoa}`, {}, '10.0.0.77')).status === 429) bi429++;
    ok('10 khách sau một IP nhà mạng hỏi 4 giây một lần (150 lượt / phút) → không ai bị 429', bi429 === 0, String(bi429));
  }
  const loiGio = await guiDonLenMayChu(GOC_MAY, taoThanDon(taoMaGui(), { 'la-galbi': 1 }, { ...nhan, gio: '03:00' }), quaMayChu);
  ok('Máy chủ từ chối (giờ nhận không chọn được) → Mini App hiện đúng câu của máy chủ, đơn chưa ghi',
    loiGio.loai === 'chua-ghi' && loiGio.loi.includes('Giờ nhận này không còn chọn được. Chọn lại giờ nhận.'), JSON.stringify(loiGio));
  const hong = Object.create(so) as SoDon;
  hong.taoDon = () => { throw new Error('database is locked'); };
  hong.layTheoMaGui = () => null;
  const { xuLy: xuLyHong } = taoMay(hong, { taiKhoan: TK, khoaSepay: KHOA_SEPAY, choTraGiaThu: true });
  const quaMayHong: HamFetchApi = async (url, init) => {
    const tra = await xuLyHong(new Request(url, { method: init.method, headers: init.headers, body: init.body }), '10.0.0.9');
    return { status: tra.status, json: () => tra.json() };
  };
  const gHong = await guiDonLenMayChu(GOC_MAY, taoThanDon(taoMaGui(), { 'la-galbi': 1 }, nhan), quaMayHong);
  ok('Sổ đơn hỏng lúc ghi → Mini App nhận "chưa ghi" kèm câu "đơn CHƯA được ghi", không bao giờ "đã ghi"',
    gHong.loai === 'chua-ghi' && gHong.loi.some(l => l.includes('CHƯA được ghi')), JSON.stringify(gHong));
  so.dong();
}

nhom('19 · Giao tận nơi (Khánh 09/11/2026): sổ đơn cũ chưa có cột địa chỉ, API của khách không trả địa chỉ');
{
  // Sổ đơn tạo trước 09/11 trên laptop thử: bảng don chưa có cột dia_chi, đơn 'tai-quan'. Mở bằng bản mới: tự thêm
  // cột, đơn cũ vẫn đọc được (địa chỉ trống), đơn mới ghi được địa chỉ.
  const thuMuc = fs.mkdtempSync(path.join(os.tmpdir(), 'may-chu-don-cu-'));
  const tep = path.join(thuMuc, 'don.sqlite');
  // Lược đồ bảng don đúng như trước 09/11/2026 (không cột dia_chi); các bảng khác bản mới tự tạo.
  const { Database } = await import('bun:sqlite');
  const cu = new Database(tep, { create: true, strict: true });
  cu.exec(`create table don (
    ma text primary key, khoa_xem text not null, ma_gui text not null unique, dau_noi_dung text not null,
    so_trong_ngay integer not null, ngay_tao text not null, trang_thai text not null, cach_nhan text not null,
    ngay_nhan text not null, gio_nhan text not null, ten text not null, dien_thoai text not null, ghi_chu text not null,
    tong_tien integer not null check (tong_tien >= 0), gia_thu integer not null, tao_luc integer not null,
    cap_nhat_luc integer not null, unique (ngay_tao, so_trong_ngay));
    insert into don values ('CUCUCUCU', 'khoa', 'ma-gui-cu-01', 'dau', 1, '2026-11-08', 'da_giao', 'tai-quan', '2026-11-08',
      '10:30', 'Khách Cũ', '0912345678', '', 120000, 1, 1, 1);`);
  const truoc = (cu.query("select name from pragma_table_info('don')").all() as { name: string }[]).map(c => c.name);
  cu.close();
  const moi = new SoDon(tep);
  const sau = (moi.db.query("select name from pragma_table_info('don')").all() as { name: string }[]).map(c => c.name);
  const donCu = moi.layDon('CUCUCUCU');
  const donGiao = donMoi(moi, { diaChi: '45 Pasteur, phường Sài Gòn' });
  ok('Sổ cũ chưa có cột dia_chi → mở bằng bản mới tự thêm cột; đơn cũ đọc được (nhận tại quán, địa chỉ trống)',
    !truoc.includes('dia_chi') && sau.includes('dia_chi') && donCu?.cachNhan === 'tai-quan' && donCu.diaChi === '', JSON.stringify(donCu));
  ok('Sổ cũ: đơn mới ghi và đọc lại đúng địa chỉ giao', moi.layDon(donGiao.ma)?.diaChi === '45 Pasteur, phường Sài Gòn' && moi.layDon(donGiao.ma)?.cachNhan === 'giao-hang');
  moi.dong();
  new SoDon(tep).dong();
  ok('Mở sổ lần nữa (cột đã có) → không lỗi, không thêm cột trùng', true);
  fs.rmSync(thuMuc, { recursive: true, force: true });

  // API khách xem đơn: không trả tên, số điện thoại, địa chỉ (khách đã biết; ai cầm khóa xem cũng không đọc được).
  const so = new SoDon(':memory:');
  const { xuLy } = taoMay(so);
  const don = donMoi(so, { diaChi: '88 Đồng Khởi, phường Sài Gòn', ten: 'Người Nhận Thử' });
  const than = await (await goi(xuLy, `/api/don/${don.ma}?khoa=${don.khoaXem}`)).text();
  ok('GET /api/don/<mã>: trả cách nhận "giao-hang" (để Mini App chọn chữ), không trả dữ liệu cá nhân', JSON.parse(than).cachNhan === 'giao-hang');
  ok('GET /api/don/<mã>: không có địa chỉ giao, tên, số điện thoại trong câu trả lời',
    !than.includes('Đồng Khởi') && !than.includes('Người Nhận Thử') && !than.includes('0912345678') && !/diaChi|dienThoai/.test(than), than.slice(0, 200));
  so.dong();
}

// =====================================================================================================
nhom('20 · ZNS (đợt 3): mỗi đơn mỗi loại một tin, token làm mới và lưu trước khi gửi, lỗi Zalo, không lộ số và token');
{
  const CH: CauHinhZns = { appId: '2513314422490328273', secretKey: 'secret-key-app-zalo-thu', mau: { da_nhan: '401001', dang_giao: '401002' }, cheDo: 'thu' };
  // --- cấu hình ---
  const env4 = { ZALO_APP_ID: CH.appId, ZALO_SECRET_KEY: CH.secretKey, ZNS_MAU_DA_NHAN: '401001', ZNS_MAU_DANG_GIAO: '401002' };
  const c0 = docCauHinhZns({}), c4 = docCauHinhZns(env4), cThat = docCauHinhZns({ ...env4, ZALO_CHE_DO: 'that' });
  const cThieu = docCauHinhZns({ ZALO_APP_ID: CH.appId }), cSai = docCauHinhZns({ ...env4, ZALO_CHE_DO: 'live' });
  ok('Cấu hình: không biến nào → chưa gửi ZNS; đủ bốn → chế độ thử mặc định; "that" → thật',
    c0.ok && c0.cauHinh === null && c4.ok && c4.cauHinh?.cheDo === 'thu' && c4.cauHinh.mau.dang_giao === '401002' && cThat.ok && cThat.cauHinh?.cheDo === 'that');
  ok('Cấu hình thiếu một nửa hay chế độ lạ → lỗi nêu đúng biến', !cThieu.ok && cThieu.loi.includes('ZALO_SECRET_KEY') && cThieu.loi.includes('ZNS_MAU_DA_NHAN')
    && !cSai.ok && cSai.loi.includes('ZALO_CHE_DO'));

  // --- dữ liệu mẫu tin ---
  const donTin = { ma: 'K7QX4M9A', soTrongNgay: 12, ten: 'Võ Lê Khánh', tongTien: 600_000, ngayNhan: '2026-11-13', gioNhan: '10:30', diaChi: '12 Nguyễn Huệ, phường Sài Gòn' };
  const dn = duLieuTin('da_nhan', donTin), dg = duLieuTin('dang_giao', donTin);
  ok('Mẫu "đã nhận đơn": tên, số đơn, mã đơn, tổng tiền dạng 600.000 đ, giờ "10:30 13/11/2026", địa chỉ',
    dn.ten_khach === 'Võ Lê Khánh' && dn.so_don === '12' && dn.ma_don === 'K7QX4M9A' && dn.tong_tien === '600.000 đ'
    && dn.thoi_gian_giao === '10:30 13/11/2026' && dn.dia_chi === donTin.diaChi, JSON.stringify(dn));
  ok('Mẫu "đang giao": không có tiền, không có địa chỉ', Object.keys(dg).sort().join(',') === 'ma_don,so_don,ten_khach,thoi_gian_giao');
  const dai = duLieuTin('da_nhan', { ...donTin, ten: 'Nguyễn Thị Hồng Nhung Phương Thảo Anh', diaChi: 'đ'.repeat(260) });
  ok('Tham số dài cắt theo ký tự (tên 30, địa chỉ 200), không vỡ chữ có dấu', Array.from(dai.ten_khach).length === 30 && dai.ten_khach.endsWith('…')
    && Array.from(dai.dia_chi).length === 200 && dai.dia_chi.normalize('NFC') === dai.dia_chi);

  // --- mã hóa token ---
  const ma = maHoaToken('refresh-tho-abc', CH.secretKey);
  ok('Token mã hóa: giải mã đúng khóa ra lại; sai khóa, sửa một ký tự → null; bản mã không chứa token',
    giaiMaToken(ma, CH.secretKey) === 'refresh-tho-abc' && giaiMaToken(ma, 'khoa-khac-0123456') === null
    && giaiMaToken((() => { const b = Buffer.from(ma.slice(3), 'base64'); b[b.length - 1] ^= 1; return 'v1.' + b.toString('base64'); })(), CH.secretKey) === null
    && !ma.includes('refresh-tho'));

  // --- hàng chờ ---
  const so = new SoDon(':memory:');
  let idSepay = 9000;
  const traTien = (d: DonDayDu, soTien = d.tongTien) => so.ghiTienVe({ idSepay: ++idSepay, vao: true, soTien, soTaiKhoan: TK.soTaiKhoan,
    taiKhoanPhu: '', coMaQuan: true, ngayGiaoDich: '2026-11-13 09:00:00', maThamChieu: 'FT', maDon: d.ma }, TK.soTaiKhoan, LUC_DAT);
  const demTin = (ma: string) => (so.db.query('select loai, trang_thai from zns_tin where ma_don = ? order by loai').all(ma) as
    { loai: string; trang_thai: string }[]).map(r => `${r.loai}:${r.trang_thai}`).join(' ');
  const a = donMoi(so, { maGui: 'zns-don-a-0001' });
  traTien(a, 100_000);
  ok('Tiền về thiếu → chưa có tin', demTin(a.ma) === '');
  traTien(a, a.tongTien - 100_000);
  traTien(a, 20_000);
  ok('Tiền về đủ → đúng một tin "đã nhận đơn" (tiền dư về sau không xếp thêm)', demTin(a.ma) === 'da_nhan:cho', demTin(a.ma));
  const mau = donMoi(so, { maGui: 'zns-don-mau-0001' });
  so.ghiDaThanhToan(mau.ma, LUC_DAT);
  so.doiTrangThai(mau.ma, 'da_thanh_toan', 'dang_soan', LUC_DAT);
  so.doiTrangThai(mau.ma, 'dang_soan', 'cho_lay', LUC_DAT);
  ok('Đơn đánh dấu đã trả bằng tay (đơn mẫu) → không tin nào, kể cả khi soạn xong', demTin(mau.ma) === '');
  const taiQuan = donMoi(so, { maGui: 'zns-tai-quan-cu1' });
  so.db.query("update don set cach_nhan = 'tai-quan', dia_chi = '' where ma = ?").run(taiQuan.ma);
  traTien(taiQuan);
  ok('HỒI QUY rà soát: đơn nhận tại quán cũ (không địa chỉ) → không xếp tin "đã nhận đơn" (mẫu ghi "Giao tới")', demTin(taiQuan.ma) === '');

  // --- Zalo giả ---
  type Goi = { url: string; headers: Record<string, string>; body: string };
  const goiZalo: Goi[] = [];
  let traToken: () => { status: number; json: unknown } = () => ({ status: 200, json: { access_token: 'access-1', refresh_token: 'refresh-2', expires_in: '90000' } });
  let traGui: (than: Record<string, unknown>) => { status: number; json: unknown } | 'nem' | 'treo' =
    () => ({ status: 200, json: { error: 0, message: 'Success', data: { msg_id: 'msg-1', sent_time: '1', quota: { dailyQuota: '500', remainingQuota: '499' } } } });
  const zaloGia: HamFetchZalo = async (url, init) => {
    goiZalo.push({ url, headers: init.headers, body: init.body });
    if (url.includes('oauth.zaloapp.com')) { const t = traToken(); return { status: t.status, text: async () => JSON.stringify(t.json) }; }
    const t = traGui(JSON.parse(init.body));
    if (t === 'nem') throw new TypeError('fetch failed');
    if (t === 'treo') return new Promise(() => {});
    return { status: t.status, text: async () => JSON.stringify(t.json) };
  };
  let gio = LUC_DAT;
  const nhatKy: string[] = [];
  const luot = () => guiZnsMotLuot({ so, cauHinh: CH, hamFetch: zaloGia, bayGio: () => gio, ghi: c => nhatKy.push(c), msHetGio: 50 });

  const r0 = await luot();
  ok('Chưa có refresh token → không gọi Zalo, tin còn chờ, lượt báo rõ', goiZalo.length === 0 && r0.dungVi?.includes('ZALO_REFRESH_TOKEN_MOI') === true
    && demTin(a.ma) === 'da_nhan:cho');
  ok('Gieo refresh token: lần đầu nhận; cùng token lần hai (máy chủ chạy lại, dòng cũ còn trong file) → không đè',
    so.gieoTokenZalo(maHoaToken('refresh-1', CH.secretKey), dauToken('refresh-1'), gio) && !so.gieoTokenZalo(maHoaToken('refresh-1', CH.secretKey), dauToken('refresh-1'), gio));

  const r1 = await luot();
  const lamMoi = goiZalo[0], gui1 = goiZalo[1];
  const than1 = JSON.parse(gui1?.body ?? '{}');
  ok('Lượt đầu: làm mới token (app_id, refresh token, secret_key ở header) rồi gửi một tin',
    goiZalo.length === 2 && lamMoi.headers.secret_key === CH.secretKey && lamMoi.body.includes('refresh_token=refresh-1') && lamMoi.body.includes(`app_id=${CH.appId}`)
    && gui1.headers.access_token === 'access-1' && r1.daGui === 1);
  ok('Tin gửi: số 84…, mã mẫu "đã nhận đơn", dữ liệu đơn, tracking id mã đơn + loại, chế độ thử "development"',
    than1.phone === '84912345678' && than1.template_id === '401001' && than1.template_data.so_don === String(a.soTrongNgay)
    && than1.template_data.tong_tien === `${a.tongTien.toLocaleString('vi-VN')} đ` && than1.tracking_id === `${a.ma}-da_nhan` && than1.mode === 'development', gui1?.body);
  const tk = so.docTokenZalo()!;
  ok('Refresh token mới (refresh-2) lưu mã hóa; sổ đơn không có token thô', giaiMaToken(tk.refreshMa, CH.secretKey) === 'refresh-2'
    && giaiMaToken(tk.accessMa, CH.secretKey) === 'access-1' && !JSON.stringify(so.db.query('select * from zalo_token').all()).match(/refresh-2|access-1/));
  ok('Tin ghi "đã gửi" kèm msg_id', so.trangThaiTinZns(a.ma, 'da_nhan')?.trangThai === 'da_gui' && so.trangThaiTinZns(a.ma, 'da_nhan')?.msgId === 'msg-1');
  goiZalo.length = 0;
  await luot();
  ok('Lượt sau không còn tin → không gọi Zalo (không làm mới token vô cớ)', goiZalo.length === 0);

  // Soạn xong → "đang giao"; bấm đúp không xếp hai tin.
  so.doiTrangThai(a.ma, 'da_thanh_toan', 'dang_soan', gio);
  so.doiTrangThai(a.ma, 'dang_soan', 'cho_lay', gio);
  so.doiTrangThai(a.ma, 'dang_soan', 'cho_lay', gio);
  ok('Quầy bấm "Soạn xong, chờ giao" (kể cả bấm đúp) → đúng một tin "đang giao"', demTin(a.ma) === 'da_nhan:da_gui dang_giao:cho');
  await luot();
  ok('"Đang giao" gửi bằng access token còn hạn (không làm mới), mã mẫu "đang giao"', goiZalo.length === 1
    && JSON.parse(goiZalo[0].body).template_id === '401002' && so.trangThaiTinZns(a.ma, 'dang_giao')?.trangThai === 'da_gui');

  // --- lỗi Zalo ---
  const donDaTra = (maGui: string, dienThoai = '0912 345 678') => { const d = donMoi(so, { maGui, dienThoai }); traTien(d); return d; };
  goiZalo.length = 0;
  const b = donDaTra('zns-loi-nguoi-nhan');
  traGui = () => ({ status: 200, json: { error: -108, message: 'Phone number is invalid' } });
  await luot();
  ok('Lỗi người nhận (-108) → "thất bại", không thử lại', so.trangThaiTinZns(b.ma, 'da_nhan')?.trangThai === 'that_bai');
  const c = donDaTra('zns-loi-tam-thoi');
  traGui = () => ({ status: 200, json: { error: -999, message: 'Unknown' } });
  await luot();
  const tc = so.db.query("select trang_thai, gui_sau, so_lan from zns_tin where ma_don = ?").get(c.ma) as { trang_thai: string; gui_sau: number; so_lan: number };
  ok('Mã lỗi lạ → về hàng chờ, gửi lại sau 5 phút', tc.trang_thai === 'cho' && tc.gui_sau === gio + 300_000 && tc.so_lan === 1);
  gio += 300_000;
  const c2 = donDaTra('zns-mat-mang-002');
  traGui = () => 'nem';
  goiZalo.length = 0;
  const rm = await luot();
  ok('HỒI QUY rà soát: mất mạng (fetch ném lỗi) → dừng cả lượt, tin về hàng chờ KHÔNG tính lần, tin sau chưa gọi Zalo',
    rm.dungVi !== null && so.trangThaiTinZns(c.ma, 'da_nhan')?.trangThai === 'cho' && so.trangThaiTinZns(c.ma, 'da_nhan')?.soLan === 1
    && so.trangThaiTinZns(c2.ma, 'da_nhan')?.soLan === 0 && goiZalo.filter(g => g.url.includes('message')).length === 1);
  traGui = () => 'treo';
  for (let i = 0; i < 10; i++) { gio += 300_000; await luot(); }
  ok('HỒI QUY rà soát: Zalo không trả lời 10 lượt liền (mạng hỏng lâu) → tin vẫn chờ, không thành "thất bại"',
    so.trangThaiTinZns(c.ma, 'da_nhan')?.trangThai === 'cho' && so.trangThaiTinZns(c.ma, 'da_nhan')?.soLan === 1
    && so.trangThaiTinZns(c2.ma, 'da_nhan')?.trangThai === 'cho');
  traGui = () => ({ status: 200, json: { error: 0, data: { msg_id: 'msg-c2' } } });
  gio += 300_000;
  await luot();
  ok('Mạng có lại → tin chờ gửi được', so.trangThaiTinZns(c2.ma, 'da_nhan')?.trangThai === 'da_gui');
  const c3 = donDaTra('zns-qua-so-lan-1');
  traGui = () => ({ status: 200, json: { error: -999, message: 'Unknown' } });
  for (let i = 0; i < SO_LAN_ZNS_TOI_DA; i++) { gio += 300_000; await luot(); }
  ok(`Quá ${SO_LAN_ZNS_TOI_DA} lần → "thất bại", thôi gửi`, so.trangThaiTinZns(c3.ma, 'da_nhan')?.trangThai === 'that_bai'
    && so.trangThaiTinZns(c3.ma, 'da_nhan')?.soLan === SO_LAN_ZNS_TOI_DA);

  const d1 = donDaTra('zns-het-quota-01'), d2 = donDaTra('zns-het-quota-02');
  traGui = () => ({ status: 200, json: { error: -115, message: 'Out of quota' } });
  goiZalo.length = 0;
  const rq = await luot();
  const q1 = so.db.query('select trang_thai, so_lan, gui_sau from zns_tin where ma_don = ?').get(d1.ma) as { trang_thai: string; so_lan: number; gui_sau: number };
  ok('Hết quota (-115) → dừng cả lượt, tin về hàng chờ không tính lần, tin sau chưa gọi Zalo', rq.dungVi !== null && q1.trang_thai === 'cho' && q1.so_lan === 0
    && q1.gui_sau === gio + 6 * 3600_000 && goiZalo.length === 1 && so.trangThaiTinZns(d2.ma, 'da_nhan')?.soLan === 0);

  // Token sai → làm mới một lần, gửi lại; refresh token bị từ chối → dừng, ghi lỗi token.
  gio += 6 * 3600_000;
  let lanGuiToken = 0;
  traGui = () => (++lanGuiToken === 1 ? { status: 200, json: { error: -124, message: 'Access token invalid' } }
    : { status: 200, json: { error: 0, data: { msg_id: 'msg-sau-lam-moi' } } });
  traToken = () => ({ status: 200, json: { access_token: 'access-3', refresh_token: 'refresh-4', expires_in: 90000 } });
  goiZalo.length = 0;
  await luot();
  ok('Zalo báo access token sai (-124) → làm mới một lần rồi gửi lại được', so.trangThaiTinZns(d1.ma, 'da_nhan')?.trangThai === 'da_gui'
    && so.trangThaiTinZns(d1.ma, 'da_nhan')?.soLan === 1 && goiZalo.filter(g => g.url.includes('oauth')).length === 1
    && giaiMaToken(so.docTokenZalo()!.refreshMa, CH.secretKey) === 'refresh-4');
  ok('Tin sau trong cùng lượt dùng access token mới', so.trangThaiTinZns(d2.ma, 'da_nhan')?.trangThai === 'da_gui');
  const d3 = donDaTra('zns-token-hong-01');
  so.db.query('update zalo_token set het_han_luc = ?').run(gio + 60_000);
  traToken = () => ({ status: 400, json: { error: -14014, error_name: 'invalid_grant', error_description: 'Refresh token refresh-4 is expired' } });
  const rt = await luot();
  ok('Refresh token bị từ chối → dừng lượt, token "bị từ chối", tin còn chờ; câu lỗi không có token',
    rt.dungVi !== null && so.docTokenZalo()?.trangThai === 'bi_tu_choi' && so.trangThaiTinZns(d3.ma, 'da_nhan')?.trangThai === 'cho'
    && !rt.dungVi.includes('refresh-4') && !String(so.docTokenZalo()?.loi).includes('refresh-4'), rt.dungVi ?? '');
  // Zalo đã trả refresh token mới mà sổ đơn không lưu được: báo rõ phải dán lại, không gửi tin bằng chuỗi đã mất.
  const soHong = Object.create(so) as SoDon;
  let lanLuu = 0;
  soHong.luuTokenZalo = () => { lanLuu++; throw new Error('database is locked'); };
  so.gieoTokenZalo(maHoaToken('refresh-luu-hong', CH.secretKey), dauToken('refresh-luu-hong'), gio);
  traToken = () => ({ status: 200, json: { access_token: 'access-lh', refresh_token: 'refresh-lh2', expires_in: 90000 } });
  goiZalo.length = 0;
  const rl = await guiZnsMotLuot({ so: soHong, cauHinh: CH, hamFetch: zaloGia, bayGio: () => gio, ghi: c => nhatKy.push(c), msHetGio: 50 });
  ok('HỒI QUY rà soát: lưu token mới hỏng → thử lưu 3 lần, dừng lượt, câu báo dán lại refresh token, không gửi tin',
    lanLuu === 3 && rl.dungVi?.includes('ZALO_REFRESH_TOKEN_MOI') === true && goiZalo.filter(g => g.url.includes('message')).length === 0
    && so.trangThaiTinZns(d3.ma, 'da_nhan')?.trangThai === 'cho', `${lanLuu} ${rl.dungVi} ${JSON.stringify(so.trangThaiTinZns(d3.ma, 'da_nhan'))} ${goiZalo.map(g => g.url).join(',')}`);
  so.gieoTokenZalo(maHoaToken('refresh-5', CH.secretKey), dauToken('refresh-5'), gio);
  traToken = () => ({ status: 200, json: { access_token: 'access-6', refresh_token: 'refresh-7', expires_in: 90000 } });
  traGui = () => ({ status: 200, json: { error: 0, data: { msg_id: 'msg-x' } } });
  await luot();
  ok('Dán refresh token mới (ZALO_REFRESH_TOKEN_MOI) → token "tốt" lại, tin gửi được', so.docTokenZalo()?.trangThai === 'tot'
    && so.trangThaiTinZns(d3.ma, 'da_nhan')?.trangThai === 'da_gui');

  // Số 10 chữ số không phải đầu số di động (máy chủ nhận, Zalo không gửi được) → thất bại, không gọi Zalo.
  goiZalo.length = 0;
  const e = donMoi(so, { maGui: 'zns-sdt-co-dinh', dienThoai: '0412 345 678' });
  traTien(e);
  await luot();
  ok('Số không phải di động (04…) → "thất bại", không gọi Zalo', so.trangThaiTinZns(e.ma, 'da_nhan')?.trangThai === 'that_bai' && goiZalo.length === 0);

  // Tin cũ, đơn đã sang bước khác, máy chủ tắt giữa chừng.
  const f = donDaTra('zns-qua-cu-00001');
  gio += 25 * 3600_000;
  goiZalo.length = 0;
  await luot();
  ok('"Đã nhận đơn" quá 24 giờ chưa gửi được → bỏ qua, không gửi', so.trangThaiTinZns(f.ma, 'da_nhan')?.trangThai === 'bo_qua' && goiZalo.length === 0);
  const g = donDaTra('zns-da-giao-0001');
  await luot();
  so.doiTrangThai(g.ma, 'da_thanh_toan', 'dang_soan', gio);
  so.doiTrangThai(g.ma, 'dang_soan', 'cho_lay', gio);
  so.doiTrangThai(g.ma, 'cho_lay', 'da_giao', gio);
  await luot();
  ok('"Đang giao" mà đơn đã giao xong trước khi gửi → bỏ qua', so.trangThaiTinZns(g.ma, 'dang_giao')?.trangThai === 'bo_qua');
  const h = donDaTra('zns-tat-giua-chung');
  so.batDauGuiZns(h.ma, 'da_nhan', gio);
  ok('Máy chủ tắt giữa lúc gọi Zalo → khởi động lại đánh dấu "không rõ", không gửi lại', so.datKhongRoTinZnsDangGui(gio) === 1
    && so.trangThaiTinZns(h.ma, 'da_nhan')?.trangThai === 'khong_ro' && so.tinZnsDenHan(gio, 50).every(t => t.maDon !== h.ma));

  const sl = so.soLieu(gio);
  ok('Số liệu sức khỏe: tin chờ, tin hỏng 24 giờ, lần gửi cuối, trạng thái token', sl.soTinZnsCho === 0 && sl.soTinZnsHong24Gio >= 1
    && sl.lanGuiZnsCuoi !== null && sl.tokenZalo === 'tot', JSON.stringify(sl));
  const tatCaChu = nhatKy.join('\n') + JSON.stringify(so.db.query('select loi from zns_tin').all());
  ok('Nhật ký và cột lỗi không có số điện thoại, tên khách, token', !/912345678|84912|Khánh|access-\d|refresh-\d|secret-key/.test(tatCaChu), tatCaChu.slice(0, 300));
  so.dong();

  // main.ts: cấu hình ZNS nửa vời, hay dán token mà chưa cấu hình → không mở máy chủ.
  const chay = (them: Record<string, string>) => Bun.spawnSync(['bun', 'src/main.ts'], { cwd: path.join(import.meta.dir, '..'),
    env: { ...process.env, MAT_KHAU_QUAY: MK, CONG: '1', THU_MUC_DU_LIEU: path.join(os.tmpdir(), 'may-chu-don-khong-mo'), ...them } });
  const nua = chay({ ZALO_APP_ID: CH.appId });
  ok('main.ts: ZNS khai thiếu → không mở máy chủ, nêu biến thiếu', nua.exitCode === 1 && nua.stderr.toString().includes('ZALO_SECRET_KEY'));
  const tokenLe = chay({ ZALO_REFRESH_TOKEN_MOI: 'abc' });
  ok('main.ts: có ZALO_REFRESH_TOKEN_MOI mà chưa cấu hình ZNS → không mở máy chủ', tokenLe.exitCode === 1
    && tokenLe.stderr.toString().includes('ZALO_APP_ID') && !tokenLe.stderr.toString().includes('abc'));
}

// =====================================================================================================
nhom('21 · Chế độ demo (Khánh 09/11/2026): QR tài khoản giả, quầy giả lập tiền về qua cùng đường ghiTienVe');
{
  const form = { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' };
  const vaoQuay = async (xuLy: ReturnType<typeof taoXuLy>) => ((await goi(xuLy, '/quay/dang-nhap', { method: 'POST',
    body: `mat_khau=${encodeURIComponent(MK)}`, headers: form })).headers.get('set-cookie') ?? '').split(';')[0];
  const bamGiaLap = (xuLy: ReturnType<typeof taoXuLy>, phien: string, ma: string, them: Record<string, string> = {}) =>
    goi(xuLy, '/quay/demo/tien-ve', { method: 'POST', body: `ma=${encodeURIComponent(ma)}`, headers: { ...form, cookie: phien, ...them } });
  const soGiaoDich = (so: SoDon) => (so.db.query('select count(*) as n from giao_dich').get() as { n: number }).n;

  // Tắt (mặc định): không có nút, đường giả lập là 404, đơn không đổi.
  const soThuong = new SoDon(':memory:');
  const { xuLy: thuong } = taoMay(soThuong);
  const donThuong = await (await guiDon(thuong, donHopLe())).json() as { ma: string; thanhToan: { lyDo?: string } };
  const phienThuong = await vaoQuay(thuong);
  ok('Tắt chế độ demo: đơn chưa có mã trả tiền như cũ', donThuong.thanhToan.lyDo === 'chua_co_tai_khoan');
  const rTat = await bamGiaLap(thuong, phienThuong, donThuong.ma);
  ok('Tắt chế độ demo: POST /quay/demo/tien-ve → 404, đơn vẫn chờ, không ghi tiền về',
    rTat.status === 404 && soThuong.layDon(donThuong.ma)!.trangThai === 'cho_thanh_toan' && soGiaoDich(soThuong) === 0);
  const trangThuong = await (await goi(thuong, '/quay', { headers: { cookie: phienThuong } })).text();
  ok('Tắt chế độ demo: màn quầy không có dòng demo, không có nút giả lập',
    !trangThuong.includes(CHU.demoDauTrang.vi) && !trangThuong.includes('/quay/demo/tien-ve'));
  ok('Tắt chế độ demo: /suc-khoe báo cheDoDemo false', (await (await goi(thuong, '/suc-khoe')).json() as { cheDoDemo: boolean }).cheDoDemo === false);
  soThuong.dong();

  // Bật: mã QR theo tài khoản giả, kể cả khi bảng giá còn là giá thử.
  const so = new SoDon(':memory:');
  const { xuLy, datGio } = taoMay(so, { demo: true, taiKhoan: TAI_KHOAN_DEMO });
  const j = await (await guiDon(xuLy, donHopLe())).json() as { ma: string; khoa: string; tongTien: number;
    thanhToan: { traDuoc: boolean; demo?: boolean; soTaiKhoan: string; tenTaiKhoan: string; chuoiQr: string; soTien: number } };
  ok('Bật demo: đơn có mã trả tiền đánh dấu demo, đúng số tiền, tài khoản giả toàn số 0, tên ghi "DUNG CHUYEN KHOAN"',
    j.thanhToan.traDuoc && j.thanhToan.demo === true && j.thanhToan.soTien === j.tongTien && /^0+$/.test(j.thanhToan.soTaiKhoan)
    && j.thanhToan.tenTaiKhoan.includes('DUNG CHUYEN KHOAN') && crc16(j.thanhToan.chuoiQr.slice(0, -4)) === j.thanhToan.chuoiQr.slice(-4), JSON.stringify(j.thanhToan));
  ok('Bật demo: vẫn hiện mã khi bảng giá còn là giá thử (không có tiền thật)', !CAU_HINH.giaThu || so.layDon(j.ma)!.giaThu);
  ok('Bật demo: /suc-khoe báo cheDoDemo true', (await (await goi(xuLy, '/suc-khoe')).json() as { cheDoDemo: boolean }).cheDoDemo === true);
  const xemMini = await docDonTuMayChu('http://don.beeftown.test', j.ma, j.khoa,
    ((url: string, init?: RequestInit) => goi(xuLy, url.replace('http://don.beeftown.test', ''), init)) as unknown as HamFetchApi);
  ok('Mini App đọc đơn của máy chủ demo: thanhToan.demo = true (app ghi "đừng chuyển khoản")',
    xemMini.loai === 'co' && xemMini.don.thanhToan.traDuoc && xemMini.don.thanhToan.kieu === 'viet_qr'
    && xemMini.don.thanhToan.demo === true, JSON.stringify(xemMini).slice(0, 200));

  // Quyền: chưa đăng nhập, khác nguồn → không ghi gì.
  const khongPhien = await goi(xuLy, '/quay/demo/tien-ve', { method: 'POST', body: `ma=${j.ma}`, headers: form });
  ok('Chưa đăng nhập quầy: giả lập → về trang đăng nhập, đơn vẫn chờ, không ghi tiền về',
    khongPhien.status === 303 && so.layDon(j.ma)!.trangThai === 'cho_thanh_toan' && soGiaoDich(so) === 0);
  const phien = await vaoQuay(xuLy);
  const khacNguon = await bamGiaLap(xuLy, phien, j.ma, { 'sec-fetch-site': 'cross-site' });
  ok('Form gửi từ trang khác → 403, không ghi', khacNguon.status === 403 && soGiaoDich(so) === 0);

  const trang = await (await goi(xuLy, '/quay', { headers: { cookie: phien } })).text();
  ok('Màn quầy demo: dòng cảnh báo đầu trang, mục đơn chờ chuyển khoản có đơn vừa đặt và nút giả lập',
    trang.includes(thoat(CHU.demoDauTrang.vi)) && trang.includes(thoat(CHU.demoChoChuyenKhoan.vi)) && trang.includes(`value="${j.ma}"`)
    && trang.includes('action="/quay/demo/tien-ve"'));

  // Bấm giả lập: cùng đường ghiTienVe — đơn sang "đã trả tiền", một dòng giao_dich id âm, tin ZNS "đã nhận đơn" được xếp.
  const r1 = await bamGiaLap(xuLy, phien, j.ma);
  const gd = so.db.query('select * from giao_dich').all() as { id_sepay: number; so_tien: number; ma_tham_chieu: string; ket_qua: string; ngay_giao_dich: string }[];
  ok('Bấm "Giả lập khách đã chuyển khoản" → 303 kèm câu demo_da_tra, đơn "đã trả tiền"',
    r1.status === 303 && (r1.headers.get('location') ?? '').includes('bao=demo_da_tra&') && so.layDon(j.ma)!.trangThai === 'da_thanh_toan');
  ok('Ghi đúng một lần tiền về: id âm cố định theo đơn, đủ số tiền, mã tham chiếu DEMO, kết quả "du"',
    gd.length === 1 && gd[0].id_sepay === idTienVeDemo(j.ma) && gd[0].id_sepay < 0 && gd[0].so_tien === j.tongTien
    && gd[0].ma_tham_chieu === 'DEMO' && gd[0].ket_qua === 'du', JSON.stringify(gd));
  ok('Giờ của lần tiền về giả lập là giờ Việt Nam ("2026-11-13 09:00:00")', gd[0]?.ngay_giao_dich === '2026-11-13 09:00:00', gd[0]?.ngay_giao_dich);
  ok('Tin ZNS "đã nhận đơn" được xếp như tiền thật (thử được ZNS ở chế độ thử)', so.trangThaiTinZns(j.ma, 'da_nhan')?.trangThai === 'cho');
  const r2 = await bamGiaLap(xuLy, phien, j.ma);
  ok('Bấm đúp → câu "đã có tiền giả lập từ trước", vẫn một dòng tiền về, tiền đã nhận đúng bằng tổng đơn',
    (r2.headers.get('location') ?? '').includes('bao=demo_da_tra_roi') && soGiaoDich(so) === 1 && so.tienDaNhan(j.ma) === j.tongTien);
  ok('Hai máy cùng ghi một id giả lập (gọi thẳng sổ đơn) → lần hai không ghi', !so.ghiTienVe({ idSepay: idTienVeDemo(j.ma), vao: true,
    soTien: 1, soTaiKhoan: TAI_KHOAN_DEMO.soTaiKhoan, taiKhoanPhu: '', coMaQuan: true, ngayGiaoDich: '2026-11-13 09:00:00', maThamChieu: 'DEMO', maDon: j.ma },
    TAI_KHOAN_DEMO.soTaiKhoan, LUC_DAT).moi && so.tienDaNhan(j.ma) === j.tongTien);
  const xemSau = await (await goi(xuLy, `/api/don/${j.ma}?khoa=${j.khoa}`)).json() as { trangThai: string; daNhan: number };
  ok('Khách xem đơn sau khi giả lập: "đã trả tiền", đã nhận đủ (Mini App chuyển sang "Quán đã nhận đủ tiền")',
    xemSau.trangThai === 'da_thanh_toan' && xemSau.daNhan === j.tongTien);
  const trangSau = await (await goi(xuLy, `/quay?bao=demo_da_tra&ma=${j.ma}`, { headers: { cookie: phien } })).text();
  ok('Màn quầy sau khi giả lập: đơn vào "Còn phải làm" có nhãn "Tiền giả lập (demo)" và câu báo; mục chờ chuyển khoản trống',
    trangSau.includes(thoat(CHU.demoTienGiaLap.vi)) && trangSau.includes(`#${so.layDon(j.ma)!.soTrongNgay}`)
    && trangSau.includes(CHU.demoKhongCoDonCho.vi) && trangSau.includes('Đã giả lập'));
  ok('Quầy làm tiếp như đơn thật: "Bắt đầu soạn" đi được', so.doiTrangThai(j.ma, 'da_thanh_toan', 'dang_soan', LUC_DAT) === 'da_doi');
  const { xuLy: daTat } = taoMay(so);
  const phienTat = await vaoQuay(daTat);
  const trangTat = await (await goi(daTat, '/quay', { headers: { cookie: phienTat } })).text();
  ok('Tắt demo mà sổ còn đơn có tiền giả: thẻ đơn vẫn mang nhãn "Tiền giả lập (demo)" (quầy không tưởng là tiền thật), không còn nút giả lập',
    trangTat.includes(thoat(CHU.demoTienGiaLap.vi)) && trangTat.includes(`#${so.layDon(j.ma)!.soTrongNgay}`) && !trangTat.includes('/quay/demo/tien-ve')
    && !trangTat.includes(thoat(CHU.demoDauTrang.vi)));

  // Đơn không còn chờ: hết hạn, không có → câu báo lỗi, không ghi gì.
  const het = await (await guiDon(xuLy, donHopLe())).json() as { ma: string };
  datGio(LUC_DAT + (PHUT_CHO_THANH_TOAN + 1) * 60_000);
  so.datHetHan(LUC_DAT + (PHUT_CHO_THANH_TOAN + 1) * 60_000);
  const rHet = await bamGiaLap(xuLy, phien, het.ma);
  ok('Đơn đã hết hạn → câu demo_khong_cho, không ghi tiền về, đơn vẫn hết hạn',
    (rHet.headers.get('location') ?? '').includes('bao=demo_khong_cho') && soGiaoDich(so) === 1 && so.layDon(het.ma)!.trangThai === 'het_han');
  const rKhong = await bamGiaLap(xuLy, phien, 'ZZZZZZZZ');
  ok('Mã đơn không có → câu demo_khong_cho, không ghi', (rKhong.headers.get('location') ?? '').includes('bao=demo_khong_cho') && soGiaoDich(so) === 1);
  so.dong();

  // main.ts: không bao giờ chạy demo cùng tài khoản thật hay khóa SePay; giá trị lạ thì báo.
  const chay = (them: Record<string, string>) => Bun.spawnSync(['bun', 'src/main.ts'], { cwd: path.join(import.meta.dir, '..'),
    env: { ...process.env, MAT_KHAU_QUAY: MK, CONG: '1', THU_MUC_DU_LIEU: path.join(os.tmpdir(), 'may-chu-don-khong-mo'), ...them } });
  const voiTk = chay({ CHE_DO_DEMO: '1', NGAN_HANG_BIN: TK.bin, TEN_NGAN_HANG: TK.tenNganHang, SO_TAI_KHOAN: TK.soTaiKhoan, TEN_TAI_KHOAN: TK.tenTaiKhoan });
  ok('main.ts: CHE_DO_DEMO=1 cùng tài khoản nhận thật → không mở máy chủ, báo rõ', voiTk.exitCode === 1 && voiTk.stderr.toString().includes('CHE_DO_DEMO'));
  const voiKhoa = chay({ CHE_DO_DEMO: '1', SEPAY_KHOA_KY: KHOA_SEPAY, NGAN_HANG_BIN: TK.bin, TEN_NGAN_HANG: TK.tenNganHang,
    SO_TAI_KHOAN: TK.soTaiKhoan, TEN_TAI_KHOAN: TK.tenTaiKhoan });
  ok('main.ts: CHE_DO_DEMO=1 cùng SePay thật → không mở máy chủ', voiKhoa.exitCode === 1 && voiKhoa.stderr.toString().includes('CHE_DO_DEMO'));
  const la = chay({ CHE_DO_DEMO: 'true' });
  ok('main.ts: CHE_DO_DEMO giá trị lạ ("true") → không mở máy chủ, nói cách bật / tắt', la.exitCode === 1 && la.stderr.toString().includes('chỉ nhận giá trị 1'));
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'may-chu-don-demo-'));
  const cong = 20000 + Math.floor(Math.random() * 20000);
  const p = Bun.spawn(['bun', 'src/main.ts'], { cwd: path.join(import.meta.dir, '..'),
    env: { ...process.env, MAT_KHAU_QUAY: MK, CONG: String(cong), THU_MUC_DU_LIEU: tam, CHE_DO_DEMO: '1' }, stdout: 'pipe', stderr: 'pipe' });
  let sk: Response | null = null;
  for (let i = 0; i < 50 && !sk; i++) { await Bun.sleep(100); sk = await fetch(`http://127.0.0.1:${cong}/suc-khoe`).catch(() => null); }
  ok('main.ts: CHE_DO_DEMO=1 một mình → máy chủ chạy, /suc-khoe báo chế độ demo',
    sk?.status === 200 && (await sk.json() as { cheDoDemo: boolean }).cheDoDemo === true);
  p.kill('SIGTERM');
  const ra = await new Response(p.stdout).text();
  ok('main.ts: nhật ký khởi động nói rõ CHẾ ĐỘ DEMO, không có tiền thật', ra.includes('CHẾ ĐỘ DEMO'), ra.slice(0, 300));
  fs.rmSync(tam, { recursive: true, force: true });
}

// =====================================================================================================
nhom('22 · VNPay qua Checkout SDK của Zalo (Khánh 11/11/2026): MAC tạo đơn, callback một lần, không tin gì chưa ký');
{
  const KHOA_ZALO = 'khoa-rieng-checkout-thu-0123456789abcdef';
  const MINI_APP = '2858300068641327950';
  const CH_THU: CauHinhCheckout = { maMiniApp: MINI_APP, khoaRieng: KHOA_ZALO, phuongThuc: 'VNPAY_SANDBOX' };
  const CH_THAT: CauHinhCheckout = { ...CH_THU, phuongThuc: 'VNPAY' };
  // Ký độc lập theo đúng chữ tài liệu Zalo (webhooks/callback) — không dùng lại hàm của máy chủ.
  const hm = (k: string, chu: string) => createHmac('sha256', k).update(chu).digest('hex');
  const kyCallback = (data: Record<string, unknown>, khoa = KHOA_ZALO) => ({
    data,
    mac: hm(khoa, `appId=${data.appId}&amount=${data.amount}&description=${data.description}&orderId=${data.orderId}`
      + `&message=${data.message}&resultCode=${data.resultCode}&transId=${data.transId}`),
    overallMac: hm(khoa, Object.keys(data).sort().map(k => `${k}=${data[k]}`).join('&')),
  });
  let soZalo = 0;
  const duLieu = (maDon: string, soTien: number, them: Record<string, unknown> = {}) => ({
    appId: MINI_APP, orderId: `ZMP${1000 + ++soZalo}`, transId: `1483${soZalo}`, method: 'VNPAY_SANDBOX',
    transTime: msVn('2026-11-13T09:05:00+07:00'), merchantTransId: `MT${soZalo}`, amount: soTien,
    description: `Beeftown don ${maDon}`, resultCode: 1, message: 'Payment_successful',
    extradata: encodeURIComponent(JSON.stringify({ maDon })), ...them,
  });
  const goiZalo = (xuLy: ReturnType<typeof taoXuLy>, than: unknown, duong = '/zalo/thanh-toan') =>
    goi(xuLy, duong, { method: 'POST', body: typeof than === 'string' ? than : JSON.stringify(than), headers: { 'content-type': 'application/json' } }, IP_CHECKOUT_ZALO[0]);
  const docTra = async (r: Response) => ({ status: r.status, ...(await r.json() as { returnCode: number; returnMessage: string }) });
  const soDong = (so: SoDon) => (so.db.query('select count(*) as n from thanh_toan_zalo').get() as { n: number }).n;

  // --- cấu hình ---
  ok('Cấu hình: không biến nào → chưa trả qua VNPay (null)', (() => { const c = docCauHinhCheckout({}); return c.ok && c.cauHinh === null; })());
  const thieu = docCauHinhCheckout({ ZALO_MINI_APP_ID: MINI_APP, ZALO_CHECKOUT_KHOA_RIENG: KHOA_ZALO });
  ok('Cấu hình: thiếu một trong ba biến → lỗi nói đủ ba tên', !thieu.ok && thieu.loi.includes('ZALO_CHECKOUT_PHUONG_THUC'));
  ok('Cấu hình: Mini App ID không phải số, Private key ngắn hay có dấu cách, phương thức lạ → lỗi',
    [{ ZALO_MINI_APP_ID: 'beeftown' }, { ZALO_CHECKOUT_KHOA_RIENG: 'ngan' }, { ZALO_CHECKOUT_KHOA_RIENG: 'khoa co dau cach 0123456789' },
      { ZALO_CHECKOUT_PHUONG_THUC: 'VNPAY_TEST' }, { ZALO_CHECKOUT_PHUONG_THUC: 'vnpay' }]
      .every(sai => !docCauHinhCheckout({ ZALO_MINI_APP_ID: MINI_APP, ZALO_CHECKOUT_KHOA_RIENG: KHOA_ZALO, ZALO_CHECKOUT_PHUONG_THUC: 'VNPAY_SANDBOX', ...sai }).ok));
  const du = docCauHinhCheckout({ ZALO_MINI_APP_ID: ` ${MINI_APP} `, ZALO_CHECKOUT_KHOA_RIENG: KHOA_ZALO, ZALO_CHECKOUT_PHUONG_THUC: 'VNPAY' });
  ok('Cấu hình: đủ ba biến (cắt khoảng trắng) → đúng Mini App, đúng phương thức', du.ok && du.cauHinh?.maMiniApp === MINI_APP && du.cauHinh.phuongThuc === 'VNPAY');
  ok('Địa chỉ IPN khai với VNPay là địa chỉ của Zalo theo Mini App ID (tài liệu cấu hình VNPay)',
    diaChiIpnVnpay(MINI_APP) === 'https://payment-mini.zalo.me/api/transaction/2858300068641327950/vnp-ipn');

  // --- ký createOrder ---
  const donMau = { ma: 'K7QX4M9A', tongTien: 750_000, dong: [{ maPhan: 'ribeye-with-cap', soKhay: 2, giaMoiKhay: 250_000 }, { maPhan: 'la-galbi', soKhay: 1, giaMoiKhay: 250_000 }] };
  const ts = thamSoTaoDon(donMau, 750_000, CH_THU);
  const chuoiTaiLieu = 'amount=750000&desc=Beeftown don K7QX4M9A&extradata={"maDon":"K7QX4M9A"}'
    + '&item=[{"id":"ribeye-with-cap","amount":500000},{"id":"la-galbi","amount":250000}]&method={"id":"VNPAY_SANDBOX","isCustom":false}';
  ok('MAC createOrder: chuỗi ký đúng dạng tài liệu (khóa a→z, extradata / method chuỗi JSON, item JSON)', chuoiKyTaoDon(ts) === chuoiTaiLieu, chuoiKyTaoDon(ts));
  ok('MAC createOrder = HMAC-SHA256(Private key, chuỗi ký) — tự tính độc lập ra cùng số', ts.mac === hm(KHOA_ZALO, chuoiTaiLieu));
  ok('Tham số: tổng món = số tiền, extradata mang mã đơn, phương thức ép VNPay sandbox (khách không chọn được cách khác)',
    ts.item.reduce((a, m) => a + m.amount, 0) === ts.amount && JSON.parse(ts.extradata).maDon === 'K7QX4M9A'
    && JSON.parse(ts.method).id === 'VNPAY_SANDBOX' && JSON.parse(ts.method).isCustom === false);
  ok('Mô tả không dấu, không ký tự đặc biệt (Zalo chuyển sang VNPay làm nội dung thanh toán)', /^[A-Za-z0-9 ]+$/.test(ts.desc), ts.desc);
  const conThieu = thamSoTaoDon(donMau, 250_000, CH_THU);
  ok('Còn thiếu một phần: một món "con-thieu" đúng bằng số tiền còn thiếu', conThieu.amount === 250_000
    && conThieu.item.length === 1 && conThieu.item[0].id === 'con-thieu' && conThieu.item[0].amount === 250_000);
  let nem = false; try { thamSoTaoDon(donMau, 0, CH_THU); } catch { nem = true; }
  ok('Số tiền 0 → không ký (ném lỗi)', nem);
  ok('Đổi một chữ của tham số là MAC khác (Zalo từ chối)', thamSoTaoDon({ ...donMau, ma: 'K7QX4M9C' }, 750_000, CH_THU).mac !== ts.mac
    && hm('khoa-khac-0123456789abcdef', chuoiTaiLieu) !== ts.mac);

  // --- API cho Mini App ---
  {
    const so = new SoDon(':memory:');
    const { xuLy } = taoMay(so, { checkout: CH_THU, taiKhoan: TK, khoaSepay: KHOA_SEPAY });
    const j = await (await guiDon(xuLy, donHopLe())).json() as { ma: string; khoa: string; tongTien: number; thanhToan: Record<string, unknown> };
    const tt = j.thanhToan as { traDuoc: boolean; kieu: string; soTien: number; thuNghiem: boolean; taoDon: { mac: string; amount: number } & Record<string, unknown> };
    ok('Đơn mới có thanhToan kiểu vnpay: đúng tổng tiền, cờ thử nghiệm, MAC tự tính độc lập khớp',
      tt.traDuoc && tt.kieu === 'vnpay' && tt.soTien === j.tongTien && tt.thuNghiem === true && tt.taoDon.amount === j.tongTien
      && tt.taoDon.mac === hm(KHOA_ZALO, chuoiKyTaoDon(tt.taoDon as never)), JSON.stringify(tt).slice(0, 300));
    ok('Có VNPay thì không còn mã VietQR (không lộ số tài khoản, không có chuoiQr), qr.svg → 404',
      !('soTaiKhoan' in tt) && !('chuoiQr' in tt) && (await goi(xuLy, `/api/don/${j.ma}/qr.svg?khoa=${j.khoa}`)).status === 404);
    ok('Private key không bao giờ có trong câu trả lời cho Mini App', !JSON.stringify(j).includes(KHOA_ZALO));
    const tGiaThu = (await (await guiDon(taoMay(so, { checkout: CH_THAT }).xuLy, donHopLe())).json() as { thanhToan: { traDuoc: boolean; lyDo?: string } }).thanhToan;
    ok('VNPay tiền thật mà bảng giá còn là giá thử → chưa cho trả (như chuyển khoản thật); sandbox thì vẫn thử được',
      !CAU_HINH.giaThu || (!tGiaThu.traDuoc && tGiaThu.lyDo === 'gia_thu'));
    const tCho = (await (await guiDon(taoMay(so, { checkout: CH_THAT, choTraGiaThu: true }).xuLy, donHopLe())).json() as { thanhToan: { kieu?: string } }).thanhToan;
    ok('VNPay tiền thật + CHO_TRA_GIA_THU=1 → cho trả (thử số nhỏ)', tCho.kieu === 'vnpay');
    so.dong();
  }

  // --- callback ---
  const so = new SoDon(':memory:');
  const { xuLy, datGio } = taoMay(so, { checkout: CH_THU });
  ok('Chưa cấu hình Checkout SDK → 503, returnCode 0 (không bao giờ 1)',
    await (async () => { const r = await docTra(await goiZalo(taoMay(new SoDon(':memory:')).xuLy, kyCallback(duLieu('K7QX4M9A', 1)))); return r.status === 503 && r.returnCode === 0; })());
  const d1 = await (await guiDon(xuLy, donHopLe())).json() as { ma: string; khoa: string; tongTien: number };
  const cb1 = duLieu(d1.ma, d1.tongTien);
  const r1 = await docTra(await goiZalo(xuLy, kyCallback(cb1)));
  ok('Callback đúng chữ ký, đủ tiền → returnCode 1, đơn "đã trả tiền", tiền đã nhận = tổng đơn',
    r1.status === 200 && r1.returnCode === 1 && so.layDon(d1.ma)!.trangThai === 'da_thanh_toan' && so.tienDaNhan(d1.ma) === d1.tongTien, JSON.stringify(r1));
  ok('Nhật ký đơn ghi bước do "vnpay"; tin ZNS "đã nhận đơn" được xếp (đơn giao tận nơi)',
    !!so.db.query("select 1 from nhat_ky where ma_don = ? and den = 'da_thanh_toan' and ai = 'vnpay'").get(d1.ma)
    && so.trangThaiTinZns(d1.ma, 'da_nhan')?.trangThai === 'cho');
  const r1b = await docTra(await goiZalo(xuLy, kyCallback(cb1)));
  ok('Zalo gửi lại cùng orderId → returnCode 2 (đã ghi từ trước), vẫn một dòng, tiền không cộng hai lần',
    r1b.returnCode === 2 && soDong(so) === 1 && so.tienDaNhan(d1.ma) === d1.tongTien);
  const kq2 = await Promise.all([goiZalo(xuLy, kyCallback(duLieu(d1.ma, 5, { orderId: 'ZMP-CUNG' }))), goiZalo(xuLy, kyCallback(duLieu(d1.ma, 5, { orderId: 'ZMP-CUNG' })))]);
  const ma2 = (await Promise.all(kq2.map(docTra))).map(x => x.returnCode).sort().join(',');
  ok('Hai lần gọi cùng lúc cùng orderId → một lần 1, một lần 2; một dòng', ma2 === '1,2'
    && (so.db.query("select count(*) as n from thanh_toan_zalo where ma_zalo = 'ZMP-CUNG'").get() as { n: number }).n === 1, ma2);

  const d2 = await (await guiDon(xuLy, donHopLe())).json() as { ma: string; tongTien: number };
  const truocDem = soDong(so);
  const suaTien = { ...kyCallback(duLieu(d2.ma, d2.tongTien)) }; suaTien.data = { ...suaTien.data, amount: 1 };
  const rSai = await docTra(await goiZalo(xuLy, suaTien));
  ok('Thân bị sửa số tiền sau khi ký → 401, returnCode 0, không ghi gì', rSai.status === 401 && rSai.returnCode === 0 && soDong(so) === truocDem);
  // mac không phủ extradata: đổi mã đơn trong extradata mà giữ mac → chỉ overallMac bắt được.
  const goc = kyCallback(duLieu(d2.ma, d2.tongTien));
  const doiDon = { ...goc, data: { ...goc.data, extradata: encodeURIComponent(JSON.stringify({ maDon: d1.ma })) } };
  const rDoi = await docTra(await goiZalo(xuLy, doiDon));
  ok('Đổi mã đơn trong extradata, giữ nguyên mac (mac không phủ extradata) → overallMac bắt, 401, không ghi', rDoi.status === 401 && soDong(so) === truocDem);
  ok('Ký bằng khóa khác → 401', (await goiZalo(xuLy, kyCallback(duLieu(d2.ma, d2.tongTien), 'khoa-cua-nguoi-khac-0123456789'))).status === 401 && soDong(so) === truocDem);
  ok('Ký đúng khóa mà của Mini App khác → 401 (sai_mini_app), không ghi',
    (await goiZalo(xuLy, kyCallback(duLieu(d2.ma, d2.tongTien, { appId: '1111111111111111111' })))).status === 401 && soDong(so) === truocDem);
  ok('Không phải JSON, thiếu data, thiếu mac → 400 / 401, returnCode 0',
    (await docTra(await goiZalo(xuLy, 'khong-phai-json'))).returnCode === 0 && (await goiZalo(xuLy, { mac: 'x' })).status === 400
    && (await goiZalo(xuLy, { data: duLieu(d2.ma, 1) })).status === 401 && soDong(so) === truocDem);
  ok('Số tiền, resultCode dạng chuỗi chữ số (Zalo đổi kiểu) vẫn đọc được — chữ ký trên đúng giá trị nhận',
    (() => { const k = docCallback(kyCallback(duLieu(d2.ma, String(d2.tongTien) as unknown as number, { resultCode: '1' })), CH_THU); return k.ok && k.tin.soTien === d2.tongTien && k.tin.thanhCong; })());
  ok('Thân quá 16 KB → 413', (await goiZalo(xuLy, 'x'.repeat(17 * 1024))).status === 413);
  {
    // Mini App ID 19 chữ số gửi dạng số JSON: chuỗi ký của Zalo mang đúng 19 chữ số đó.
    const d = duLieu(d2.ma, 1);
    const chuoiMac = `appId=${MINI_APP}&amount=1&description=${d.description}&orderId=${d.orderId}&message=${d.message}&resultCode=1&transId=${d.transId}`;
    const chuoiToan = Object.keys(d).sort().map(k => `${k}=${(d as Record<string, unknown>)[k]}`).join('&');
    const than = JSON.stringify({ data: d, mac: hm(KHOA_ZALO, chuoiMac), overallMac: hm(KHOA_ZALO, chuoiToan) })
      .replace(`"appId":"${MINI_APP}"`, `"appId":${MINI_APP}`);
    const k = docCallback(docThanCallback(than), CH_THU);
    ok('appId 19 chữ số gửi dạng số (quá số nguyên an toàn) vẫn khớp chữ ký, đúng Mini App', k.ok, JSON.stringify(k));
    const khongMethod: Record<string, unknown> = { ...duLieu(d2.ma, 1) }; delete khongMethod.method;
    const k2 = docCallback(kyCallback(khongMethod), CH_THU);
    ok('Callback không có method lẫn paymentChannel → phương thức là phương thức máy chủ đang ký (không bị coi là lệch)',
      k2.ok && k2.tin.phuongThuc === 'VNPAY_SANDBOX');
    const k3 = docCallback(kyCallback(duLieu(d2.ma, 1, { method: JSON.stringify({ id: 'VNPAY', isCustom: false }) })), CH_THU);
    ok('Callback mang method dạng chuỗi JSON của createOrder → đọc đúng mã phương thức (VNPAY)', k3.ok && k3.tin.phuongThuc === 'VNPAY');
  }
  const sucKhoeTuChoi = (await (await goi(xuLy, '/suc-khoe')).json() as { vnpay: { soCallbackBiTuChoi: number } }).vnpay.soCallbackBiTuChoi;
  ok('/suc-khoe đếm callback bị từ chối (sai MAC, sai Mini App, sai dạng)', sucKhoeTuChoi >= 6, String(sucKhoeTuChoi));

  // Thất bại rồi thành công cùng orderId (Zalo báo lại).
  const cbHong = duLieu(d2.ma, d2.tongTien, { resultCode: -1, message: 'Payment_failed', transId: '' });
  const rHong = await docTra(await goiZalo(xuLy, kyCallback(cbHong)));
  ok('resultCode -1 → returnCode 1 (đã nhận tin), ghi "that_bai", đơn vẫn chờ trả tiền, không tính tiền',
    rHong.returnCode === 1 && so.layDon(d2.ma)!.trangThai === 'cho_thanh_toan' && so.tienDaNhan(d2.ma) === 0
    && (so.db.query('select ket_qua from thanh_toan_zalo where ma_zalo = ?').get(cbHong.orderId) as { ket_qua: string }).ket_qua === 'that_bai');
  const rLai = await docTra(await goiZalo(xuLy, kyCallback({ ...cbHong, resultCode: 1, message: 'Payment_successful', transId: '99' })));
  ok('Cùng orderId sau đó báo đã trừ tiền → ghi lại theo lần này, đơn "đã trả tiền" (tiền khách không bị bỏ quên)',
    rLai.returnCode === 1 && so.layDon(d2.ma)!.trangThai === 'da_thanh_toan' && so.tienDaNhan(d2.ma) === d2.tongTien);

  // Khách trả hai lần (mở trang VNPay hai lần) → lần sau là tiền dư, phải hoàn.
  const rHai = await docTra(await goiZalo(xuLy, kyCallback(duLieu(d2.ma, d2.tongTien))));
  const canXem = so.tienVeCanXem();
  const cxHai = canXem.find(t => t.nguon === 'vnpay' && t.maDon === d2.ma && t.ketQua === 'thua');
  ok('Trả lần hai cho đơn đã trả → returnCode 1, ghi "thua", hiện ở "Tiền về cần xem" (nguồn vnpay, có mã Zalo, mã VNPay)',
    rHai.returnCode === 1 && !!cxHai && !!cxHai.maZalo && !!cxHai.maThamChieu && cxHai.tongDaNhan === 2 * d2.tongTien, JSON.stringify(canXem));
  const phien = ((await goi(xuLy, '/quay/dang-nhap', { method: 'POST', body: `mat_khau=${MK}`,
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } })).headers.get('set-cookie') ?? '').split(';')[0];
  const trang = await (await goi(xuLy, '/quay', { headers: { cookie: phien } })).text();
  ok('Màn quầy: thẻ tiền VNPay cần xem ghi mã giao dịch VNPay, mã thanh toán Zalo, nút "Đã xử lý xong" theo mã Zalo',
    trang.includes(CHU.maGiaoDichVnpay.vi) && trang.includes(CHU.maThanhToanZalo.vi) && trang.includes(`name="zalo" value="${thoat(cxHai!.maZalo!)}"`));
  const xem = (ma: string) => goi(xuLy, '/quay/tien-ve/da-xem', { method: 'POST', body: `zalo=${encodeURIComponent(ma)}`,
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin', cookie: phien } });
  const x1 = await xem(cxHai!.maZalo!), x2 = await xem(cxHai!.maZalo!), x3 = await xem('KHONG-CO');
  ok('Bấm "Đã xử lý xong" → khỏi danh sách; bấm đúp → "đã xử lý từ trước"; mã lạ → "không có"',
    (x1.headers.get('location') ?? '').includes('tien_ve_da_xem') && (x2.headers.get('location') ?? '').includes('tien_ve_xem_roi')
    && (x3.headers.get('location') ?? '').includes('tien_ve_khong_co') && !so.tienVeCanXem().some(t => t.maZalo === cxHai!.maZalo));
  const xKhac = await goi(xuLy, '/quay/tien-ve/da-xem', { method: 'POST', body: `zalo=${encodeURIComponent(cxHai!.maZalo!)}`,
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'cross-site', cookie: phien } });
  ok('"Đã xử lý xong" gửi từ trang khác → 403', xKhac.status === 403);

  // Không ra đơn, phương thức lệch.
  const rKhongDon = await docTra(await goiZalo(xuLy, kyCallback(duLieu('ZZZZZZZZ', 100_000))));
  const rHongExtra = await docTra(await goiZalo(xuLy, kyCallback(duLieu(d1.ma, 100_000, { extradata: '%E0%A4%A' }))));
  const kxs = so.tienVeCanXem().filter(t => t.nguon === 'vnpay' && t.ketQua === 'khong_khop');
  ok('extradata không ra đơn nào (mã lạ, chuỗi hỏng) → returnCode 1, "khong_khop", phải xem; câu VNPay riêng trên màn quầy',
    rKhongDon.returnCode === 1 && rHongExtra.returnCode === 1 && kxs.length === 2
    && (await (await goi(xuLy, '/quay', { headers: { cookie: phien } })).text()).includes(thoat(CHU.tienVeKhongKhopVnpay.vi)));
  const d3 = await (await guiDon(xuLy, donHopLe())).json() as { ma: string; tongTien: number };
  const rThat = await docTra(await goiZalo(xuLy, kyCallback(duLieu(d3.ma, d3.tongTien, { method: 'VNPAY' }))));
  ok('Tiền THẬT (VNPAY) tới khi máy chủ đang ở sandbox → không tính cho đơn, "sai_phuong_thuc", PHẢI xem',
    rThat.returnCode === 1 && so.layDon(d3.ma)!.trangThai === 'cho_thanh_toan'
    && so.tienVeCanXem().some(t => t.maDon === d3.ma && t.ketQua === 'sai_phuong_thuc'));
  {
    const soThat = new SoDon(':memory:');
    const { xuLy: mayThat } = taoMay(soThat, { checkout: CH_THAT, choTraGiaThu: true });
    const d = await (await guiDon(mayThat, donHopLe())).json() as { ma: string; tongTien: number };
    const r = await docTra(await goiZalo(mayThat, kyCallback(duLieu(d.ma, d.tongTien, { method: 'VNPAY_SANDBOX' }))));
    ok('Tiền thử (VNPAY_SANDBOX) tới khi máy chủ nhận tiền thật → không tính cho đơn, không phải xem (không có tiền thật)',
      r.returnCode === 1 && soThat.layDon(d.ma)!.trangThai === 'cho_thanh_toan' && soThat.tienVeCanXem().length === 0);
    const r2 = await docTra(await goiZalo(mayThat, kyCallback(duLieu(d.ma, d.tongTien, { method: 'VNPAY' }))));
    ok('Máy chủ tiền thật: VNPAY đủ tiền → "đã trả tiền"', r2.returnCode === 1 && soThat.layDon(d.ma)!.trangThai === 'da_thanh_toan');
    const pThat = ((await goi(mayThat, '/quay/dang-nhap', { method: 'POST', body: `mat_khau=${MK}`,
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } })).headers.get('set-cookie') ?? '').split(';')[0];
    const tThat = await (await goi(mayThat, '/quay', { headers: { cookie: pThat } })).text();
    ok('Màn quầy tiền thật: không dòng cảnh báo sandbox, đơn trả tiền thật không mang nhãn "Tiền thử VNPay"',
      !tThat.includes(thoat(CHU.vnpayThuNghiemDauTrang.vi)) && !tThat.includes(CHU.vnpayTienThu.vi));
    soThat.dong();
  }
  const trangThu = await (await goi(xuLy, '/quay', { headers: { cookie: phien } })).text();
  ok('Màn quầy sandbox: dòng cảnh báo "môi trường thử" đầu trang; đơn trả bằng tiền thử mang nhãn "Tiền thử VNPay (sandbox)"',
    trangThu.includes(thoat(CHU.vnpayThuNghiemDauTrang.vi)) && trangThu.includes(CHU.vnpayTienThu.vi)
    && so.donCoTienThuVnpay().has(d1.ma) && !so.donCoTienThuVnpay().has(d3.ma));

  // Hết hạn rồi tiền mới về (Khánh chốt 30/10/2026): vẫn tính là đã trả.
  const d4 = await (await guiDon(xuLy, donHopLe())).json() as { ma: string; tongTien: number };
  datGio(LUC_DAT + (PHUT_CHO_THANH_TOAN + 5) * 60_000);
  so.datHetHan(LUC_DAT + (PHUT_CHO_THANH_TOAN + 5) * 60_000);
  const rHetHan = await docTra(await goiZalo(xuLy, kyCallback(duLieu(d4.ma, d4.tongTien))));
  ok('Đơn đã hết hạn 30 phút, Zalo báo đã trừ tiền → "đã trả tiền" (không bỏ quên tiền khách)',
    rHetHan.returnCode === 1 && so.layDon(d4.ma)!.trangThai === 'da_thanh_toan');

  // Giờ Việt Nam của giao dịch: 23:50 và 00:10 giờ VN.
  for (const [iso, ngay] of [['2026-11-13T23:50:00+07:00', '2026-11-13 23:50:00'], ['2026-11-14T00:10:00+07:00', '2026-11-14 00:10:00']]) {
    const dg = await (await guiDon(xuLy, donHopLe())).json() as { ma: string; tongTien: number };
    const c = duLieu(dg.ma, dg.tongTien + 1, { transTime: msVn(iso) });
    await goiZalo(xuLy, kyCallback(c));
    const h = so.db.query('select ngay_giao_dich from thanh_toan_zalo where ma_zalo = ?').get(c.orderId) as { ngay_giao_dich: string };
    ok(`Giờ giao dịch ${iso.slice(11, 16)} giờ VN ghi đúng ngày giờ VN (${ngay}) — máy chạy UTC hay múi khác`, h?.ngay_giao_dich === ngay, h?.ngay_giao_dich);
  }

  // Sổ đơn hỏng giữa chừng: không bao giờ trả 1.
  {
    const soHong = new SoDon(':memory:');
    const { xuLy: mayHong } = taoMay(soHong, { checkout: CH_THU });
    const d = await (await guiDon(mayHong, donHopLe())).json() as { ma: string; tongTien: number };
    soHong.db.exec('drop table thanh_toan_zalo');
    const r = await docTra(await goiZalo(mayHong, kyCallback(duLieu(d.ma, d.tongTien))));
    ok('Sổ đơn lỗi khi ghi → 500, returnCode 0 (Zalo biết chưa ghi), đơn vẫn chờ trả tiền',
      r.status === 500 && r.returnCode === 0 && soHong.layDon(d.ma)!.trangThai === 'cho_thanh_toan');
    soHong.dong();
  }

  // --- Mini App báo đã mở trang VNPay; đèn đơn chờ kết quả quá lâu ---
  {
    const soMo = new SoDon(':memory:');
    const { xuLy: may, datGio: datGioMo } = taoMay(soMo, { checkout: CH_THU });
    const d = await (await guiDon(may, donHopLe())).json() as { ma: string; khoa: string; tongTien: number };
    const bao = (than: unknown, ma = d.ma) => goi(may, `/api/don/${ma}/vnpay`, { method: 'POST', body: JSON.stringify(than), headers: { 'content-type': 'application/json' } });
    ok('Báo mở VNPay: sai khóa xem → 404 như không có đơn', (await bao({ khoa: 'f'.repeat(32), maZalo: 'ZMP1' })).status === 404);
    ok('Báo mở VNPay: mã Zalo lạ → 400', (await bao({ khoa: d.khoa, maZalo: '<script>' })).status === 400);
    ok('Báo mở VNPay: máy chủ chưa cấu hình VNPay → 404',
      (await goi(taoMay(soMo).xuLy, `/api/don/${d.ma}/vnpay`, { method: 'POST', body: JSON.stringify({ khoa: d.khoa, maZalo: 'ZMP1' }) })).status === 404);
    const lan = [];
    for (let i = 0; i <= SO_LAN_MO_ZALO_TOI_DA; i++) lan.push((await (await bao({ khoa: d.khoa, maZalo: `ZMP-MO-${i}` })).json() as { ketQua: string }).ketQua);
    const lai = (await (await bao({ khoa: d.khoa, maZalo: 'ZMP-MO-0' })).json() as { ketQua: string }).ketQua;
    ok(`Báo mở VNPay: ghi tối đa ${SO_LAN_MO_ZALO_TOI_DA} lần mỗi đơn, báo lại cùng mã → "da_co"; đơn không đổi`,
      lan.slice(0, SO_LAN_MO_ZALO_TOI_DA).every(x => x === 'da_ghi') && lan[SO_LAN_MO_ZALO_TOI_DA] === 'qua_nhieu' && lai === 'da_co'
      && soMo.layDon(d.ma)!.trangThai === 'cho_thanh_toan' && soMo.tienDaNhan(d.ma) === 0, lan.join(','));
    const sk = async () => (await (await goi(may, '/suc-khoe')).json() as { soDonVnpayChoKetQua: number; vnpay: { phuongThuc: string } });
    ok('/suc-khoe: mới mở trang VNPay → chưa báo đơn chờ kết quả', (await sk()).soDonVnpayChoKetQua === 0);
    datGioMo(LUC_DAT + (PHUT_CHO_KET_QUA_ZALO + 1) * 60_000);
    ok(`/suc-khoe: quá ${PHUT_CHO_KET_QUA_ZALO} phút chưa có kết quả → 1 đơn chờ (callback có thể đã lạc), phương thức VNPAY_SANDBOX`,
      (await sk()).soDonVnpayChoKetQua === 1 && (await sk()).vnpay.phuongThuc === 'VNPAY_SANDBOX');
    await goiZalo(may, kyCallback(duLieu(d.ma, d.tongTien, { orderId: 'ZMP-MO-3' })));
    ok('/suc-khoe: Zalo báo kết quả cho một lần mở → hết chờ', (await sk()).soDonVnpayChoKetQua === 0 && soMo.layDon(d.ma)!.trangThai === 'da_thanh_toan');
    // Mini App (mini-app/src/tra-truoc.ts) gọi máy chủ thật.
    const quaMay: HamFetchApi = async (url, init) => {
      const tra = await may(new Request(url, { method: init.method, headers: init.headers, body: init.body }), '10.0.0.9');
      return { status: tra.status, json: () => tra.json() };
    };
    const d5 = await (await guiDon(may, donHopLe())).json() as { ma: string; khoa: string; tongTien: number };
    const xem = await docDonTuMayChu('http://don.beeftown.test', d5.ma, d5.khoa, quaMay);
    const tt = xem.loai === 'co' && xem.don.thanhToan.traDuoc && xem.don.thanhToan.kieu === 'vnpay' ? xem.don.thanhToan : null;
    ok('Mini App đọc đơn của máy chủ: kiểu vnpay, tham số qua JSON vẫn ra đúng MAC (Zalo nhận)',
      !!tt && tt.taoDon.mac === hm(KHOA_ZALO, chuoiKyTaoDon(tt.taoDon)) && tt.thuNghiem && buocTraTien(xem.loai === 'co' ? xem.don : null!).buoc === 'cho-tra');
    ok('Mini App báo mở trang VNPay qua baoMoVnpayLenMayChu → máy chủ ghi', await baoMoVnpayLenMayChu('http://don.beeftown.test', d5.ma, d5.khoa, 'ZMP-APP-1', quaMay)
      && !!soMo.db.query("select 1 from mo_thanh_toan_zalo where ma_zalo = 'ZMP-APP-1'").get());
    await goiZalo(may, kyCallback(duLieu(d5.ma, d5.tongTien, { orderId: 'ZMP-APP-1' })));
    const sau = await docDonTuMayChu('http://don.beeftown.test', d5.ma, d5.khoa, quaMay);
    ok('Sau callback: Mini App thấy "Quán đã nhận đủ tiền"', sau.loai === 'co' && buocTraTien(sau.don).buoc === 'da-nhan-du');
    soMo.dong();
  }

  // --- IPN sandbox chuyển tiếp: chỉ nhật ký ---
  {
    const tin = { ipnResponseData: { Message: 'Confirm Success', RspCode: '00' }, ipnRequestIP: '203.205.17.226',
      ipnReceivedData: { vnp_BankCode: 'NCB', vnp_PayDate: '20261113090500', vnp_TransactionNo: '14831393', vnp_TmnCode: 'SLKGTE22',
        vnp_SecureHash: 'ab'.repeat(64), vnp_OrderInfo: 'Beeftown don K7QX4M9A', vnp_TxnRef: '261113_0905', vnp_Amount: '75000000',
        vnp_CardType: 'ATM', vnp_TransactionStatus: '00', vnp_ResponseCode: '00' } };
    const dong = dongNhatKyIpnVnpay(tin) ?? '';
    ok('IPN sandbox: dòng nhật ký có RspCode, mã giao dịch, số tiền, mã phản hồi, IP — không checksum, không nội dung đơn',
      dong.includes('RspCode=00') && dong.includes('vnp_TxnRef=261113_0905') && dong.includes('vnp_Amount=75000000')
      && dong.includes('ip=203.205.17.226') && !dong.includes('ab'.repeat(8)) && !dong.includes('Beeftown don'), dong);
    ok('IPN sandbox: chữ lạ trong trường bị bỏ (không chèn được xuống dòng, ký tự điều khiển vào nhật ký)',
      !(dongNhatKyIpnVnpay({ ipnResponseData: { RspCode: '00\nGIA' }, ipnReceivedData: {} }) ?? '\n').includes('\n'));
    const truoc = so.tienVeCanXem().length, trangThai = so.layDon(d3.ma)!.trangThai;
    const r = await docTra(await goiZalo(xuLy, tin, '/zalo/vnpay-ipn'));
    ok('IPN sandbox: trả returnCode 1, KHÔNG đổi đơn nào, không ghi tiền (webhook này không có MAC)',
      r.returnCode === 1 && so.tienVeCanXem().length === truoc && so.layDon(d3.ma)!.trangThai === trangThai);
    const lanIpn = [];
    for (let i = 0; i < 61; i++) lanIpn.push((await goiZalo(xuLy, tin, '/zalo/vnpay-ipn')).status);
    ok('IPN sandbox: quá 60 lần một phút từ một IP → 429 (không ghi nhật ký dồn)', lanIpn.includes(429));
    ok('IPN sandbox khi chưa cấu hình VNPay → 404', (await goiZalo(taoMay(new SoDon(':memory:')).xuLy, tin, '/zalo/vnpay-ipn')).status === 404);
  }

  // --- chữ ---
  const khoaMoi = ['maGiaoDichVnpay', 'maThanhToanZalo', 'tienVeKhongKhopVnpay', 'tienVeSaiPhuongThuc', 'vnpayTienThu', 'vnpayThuNghiemDauTrang'] as const;
  ok('Chữ mới của màn quầy đủ vi / en, không chữ cấm, không "thành công"',
    khoaMoi.every(k => CHU[k].vi && CHU[k].en && !timChuoiCam(CHU[k].vi).length && !timChuoiCam(CHU[k].en).length && !/thành công/i.test(CHU[k].vi)));
  so.dong();

  // --- main.ts ---
  const chay = (them: Record<string, string>) => Bun.spawnSync(['bun', 'src/main.ts'], { cwd: path.join(import.meta.dir, '..'),
    env: { ...process.env, MAT_KHAU_QUAY: MK, CONG: '1', THU_MUC_DU_LIEU: path.join(os.tmpdir(), 'may-chu-don-khong-mo'), ...them } });
  const thieuBien = chay({ ZALO_MINI_APP_ID: MINI_APP, ZALO_CHECKOUT_KHOA_RIENG: KHOA_ZALO });
  ok('main.ts: thiếu một biến VNPay → không mở máy chủ, nói đủ ba tên', thieuBien.exitCode === 1 && thieuBien.stderr.toString().includes('ZALO_CHECKOUT_PHUONG_THUC'));
  const demoVnpay = chay({ CHE_DO_DEMO: '1', ZALO_MINI_APP_ID: MINI_APP, ZALO_CHECKOUT_KHOA_RIENG: KHOA_ZALO, ZALO_CHECKOUT_PHUONG_THUC: 'VNPAY_SANDBOX' });
  ok('main.ts: CHE_DO_DEMO=1 cùng VNPay → không mở máy chủ (quầy không phân biệt được tiền giả lập và tiền Zalo báo)',
    demoVnpay.exitCode === 1 && demoVnpay.stderr.toString().includes('CHE_DO_DEMO'));
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'may-chu-don-vnpay-'));
  const cong = 20000 + Math.floor(Math.random() * 20000);
  const p = Bun.spawn(['bun', 'src/main.ts'], { cwd: path.join(import.meta.dir, '..'), stdout: 'pipe', stderr: 'pipe',
    env: { ...process.env, MAT_KHAU_QUAY: MK, CONG: String(cong), THU_MUC_DU_LIEU: tam,
      ZALO_MINI_APP_ID: MINI_APP, ZALO_CHECKOUT_KHOA_RIENG: KHOA_ZALO, ZALO_CHECKOUT_PHUONG_THUC: 'VNPAY_SANDBOX' } });
  let sk: Response | null = null;
  for (let i = 0; i < 50 && !sk; i++) { await Bun.sleep(100); sk = await fetch(`http://127.0.0.1:${cong}/suc-khoe`).catch(() => null); }
  ok('main.ts: đủ ba biến → máy chủ chạy, /suc-khoe báo phương thức VNPAY_SANDBOX',
    sk?.status === 200 && (await sk.json() as { vnpay: { phuongThuc: string } }).vnpay?.phuongThuc === 'VNPAY_SANDBOX');
  p.kill('SIGTERM');
  const ra = await new Response(p.stdout).text();
  ok('main.ts: nhật ký khởi động nói rõ MÔI TRƯỜNG THỬ và địa chỉ IPN khai với VNPay; không in Private key',
    ra.includes('MÔI TRƯỜNG THỬ') && ra.includes(diaChiIpnVnpay(MINI_APP)) && !ra.includes(KHOA_ZALO), ra.slice(0, 400));
  fs.rmSync(tam, { recursive: true, force: true });
}

// =====================================================================================================
nhom('23 · Trang thử VNPay trên web (Khánh 12/11/2026): chỉ sandbox, ký đúng, Return URL kiểm chữ ký, không ghi sổ đơn');
{
  const KHOA = 'khoa-bi-mat-vnpay-thu-0123456789ABCDEF';
  const CH = { maTmn: 'SLKGTE22', khoaBiMat: KHOA };
  // Ký độc lập theo code mẫu NodeJS của VNPay: khóa a→z, encodeURIComponent, dấu cách thành "+", HMAC-SHA512.
  const maHoa = (v: string) => encodeURIComponent(v).replace(/%20/g, '+');
  const chuoiMau = (o: Record<string, string>) => Object.keys(o).sort().map(k => `${maHoa(k)}=${maHoa(o[k])}`).join('&');
  const kyMau = (o: Record<string, string>, khoa = KHOA) => createHmac('sha512', khoa).update(chuoiMau(o)).digest('hex');
  const veVnpay = (o: Record<string, string>, khoa = KHOA) => new URLSearchParams({ ...o, vnp_SecureHash: kyMau(o, khoa) });

  // --- cấu hình ---
  ok('Cấu hình: không biến nào → tắt (null)', (() => { const c = docCauHinhVnpayThu({}); return c.ok && c.cauHinh === null; })());
  ok('Cấu hình: thiếu một biến, mã Terminal sai dạng, khóa ngắn hay có dấu cách → lỗi',
    [{ VNPAY_THU_MA_TMN: 'SLKGTE22' }, { VNPAY_THU_KHOA_BI_MAT: KHOA }, { VNPAY_THU_MA_TMN: 'slkgte22', VNPAY_THU_KHOA_BI_MAT: KHOA },
      { VNPAY_THU_MA_TMN: 'SLKGTE22', VNPAY_THU_KHOA_BI_MAT: 'ngan' }, { VNPAY_THU_MA_TMN: 'SLKGTE22', VNPAY_THU_KHOA_BI_MAT: 'co dau cach 0123456789' }]
      .every(e => !docCauHinhVnpayThu(e).ok));
  ok('Cấu hình: đủ hai biến (cắt khoảng trắng) → đúng mã Terminal',
    (() => { const c = docCauHinhVnpayThu({ VNPAY_THU_MA_TMN: ' SLKGTE22 ', VNPAY_THU_KHOA_BI_MAT: KHOA }); return c.ok && c.cauHinh?.maTmn === 'SLKGTE22'; })());

  // --- giờ VN, mã giao dịch ---
  ok('Ngày kiểu VNPay theo giờ VN: 23:50 và 00:10 (máy chạy UTC hay múi khác)',
    ngayVnpay(msVn('2026-11-13T23:50:00+07:00')) === '20261113235000' && ngayVnpay(msVn('2026-11-14T00:10:05+07:00')) === '20261114001005');
  const cacMa = new Set(Array.from({ length: 50 }, () => taoMaGiaoDichThu(LUC_DAT)));
  ok('Mã giao dịch "BTTHU" + yyMMddHHmmss giờ VN + 4 ký tự, 50 lần trong cùng giây không trùng',
    cacMa.size === 50 && [...cacMa].every(m => /^BTTHU261113090000[A-Z2-9]{4}$/.test(m)), [...cacMa][0]);

  // --- đường dẫn tới cổng thử ---
  const { url, maGiaoDich } = taoLinkThanhToanThu({ ch: CH, soTien: 300_000, ip: '113.161.1.2', ms: msVn('2026-11-13T23:50:00+07:00'), goc: 'https://don.beeftown.vn' });
  const u = new URL(url);
  const tham = Object.fromEntries([...u.searchParams].filter(([k]) => k !== 'vnp_SecureHash'));
  ok('Chỉ cổng thử (sandbox) của VNPay — không có cách nào ra cổng thật', `${u.origin}${u.pathname}` === CONG_THANH_TOAN_THU
    && CONG_THANH_TOAN_THU.startsWith('https://sandbox.vnpayment.vn/'));
  ok('Tham số đúng đặc tả 2.1.0: pay, VND, số tiền × 100, Terminal, mã giao dịch, Return URL của máy chủ đơn, IP, locale vn',
    tham.vnp_Version === '2.1.0' && tham.vnp_Command === 'pay' && tham.vnp_CurrCode === 'VND' && tham.vnp_Amount === '30000000'
    && tham.vnp_TmnCode === 'SLKGTE22' && tham.vnp_TxnRef === maGiaoDich && tham.vnp_ReturnUrl === 'https://don.beeftown.vn/vnpay-thu/ket-qua'
    && tham.vnp_IpAddr === '113.161.1.2' && tham.vnp_Locale === 'vn' && tham.vnp_OrderType === 'other', JSON.stringify(tham));
  ok(`Ngày tạo theo giờ VN, hết hạn sau ${PHUT_HET_HAN_THU} phút (qua nửa đêm vẫn đúng ngày)`,
    tham.vnp_CreateDate === '20261113235000' && tham.vnp_ExpireDate === '20261114000500');
  ok('Nội dung thanh toán không dấu, không ký tự đặc biệt', /^[A-Za-z0-9 ]+$/.test(tham.vnp_OrderInfo), tham.vnp_OrderInfo);
  ok('Chữ ký vnp_SecureHash = HMAC-SHA512 theo cách ký của code mẫu VNPay (tự tính độc lập ra cùng số)',
    u.searchParams.get('vnp_SecureHash') === kyMau(tham));
  ok('Chuỗi trước vnp_SecureHash đúng y chuỗi đã ký (VNPay ký lại trên chính chuỗi nhận)',
    url.split('?')[1].split('&vnp_SecureHash=')[0] === chuoiMau(tham));
  let nem = 0;
  for (const t of [0, 4_000, 10_000_001, 1.5]) { try { taoLinkThanhToanThu({ ch: CH, soTien: t, ip: '1.1.1.1', ms: LUC_DAT, goc: 'https://x' }); } catch { nem++; } }
  ok('Số tiền ngoài 5.000–10.000.000 đ hay lẻ → không ký', nem === 4);
  ok('IP lạ thay bằng 127.0.0.1 (không đưa chữ lạ vào chuỗi ký)',
    new URL(taoLinkThanhToanThu({ ch: CH, soTien: 10_000, ip: '<x>', ms: LUC_DAT, goc: 'https://x' }).url).searchParams.get('vnp_IpAddr') === '127.0.0.1');

  // --- Return URL ---
  const ve = (them: Record<string, string> = {}) => ({
    vnp_Amount: '30000000', vnp_BankCode: 'NCB', vnp_BankTranNo: 'VNP15734226', vnp_CardType: 'ATM', vnp_OrderInfo: `Beeftown thu VNPay ${maGiaoDich}`,
    vnp_PayDate: '20261113235210', vnp_ResponseCode: '00', vnp_TmnCode: 'SLKGTE22', vnp_TransactionNo: '15734226',
    vnp_TransactionStatus: '00', vnp_TxnRef: maGiaoDich, ...them,
  });
  const k1 = docKetQuaVe(veVnpay(ve()), CH);
  ok('Return URL thành công (00 / 00) đúng chữ ký → đã trả, đúng mã giao dịch, số tiền 300.000, giờ VN',
    k1.chuKyDung && k1.daTra && k1.maGiaoDich === maGiaoDich && k1.soTien === 300_000 && k1.thoiGian === '13/11/2026 23:52:10', JSON.stringify(k1));
  const k2 = docKetQuaVe(veVnpay(ve({ vnp_ResponseCode: '24', vnp_TransactionStatus: '02', vnp_BankTranNo: '', vnp_TransactionNo: '0' })), CH);
  ok('Khách hủy (24 / 02) → chữ ký đúng, chưa trả', k2.chuKyDung && !k2.daTra && k2.maPhanHoi === '24');
  const khongTrangThai = ve(); delete (khongTrangThai as Record<string, string>).vnp_TransactionStatus;
  ok('Return URL không có vnp_TransactionStatus mà mã 00 → vẫn là đã trả', docKetQuaVe(veVnpay(khongTrangThai), CH).daTra);
  ok('Mã 00 mà trạng thái 02 → chưa trả', !docKetQuaVe(veVnpay(ve({ vnp_TransactionStatus: '02' })), CH).daTra);
  const thamTrong = ve({ vnp_BankTranNo: '' });
  const coRong = new URLSearchParams({ ...thamTrong, vnp_SecureHash: createHmac('sha512', KHOA).update(chuoiMau(thamTrong)).digest('hex') });
  ok('Tham số rỗng có trong chuỗi ký (cách của code mẫu PHP) hay không (thư viện vnpay): đều nhận', docKetQuaVe(coRong, CH).chuKyDung);
  const sua = veVnpay(ve()); sua.set('vnp_Amount', '100');
  ok('Sửa số tiền sau khi ký → chữ ký sai, không bao giờ "đã trả"', !docKetQuaVe(sua, CH).chuKyDung && !docKetQuaVe(sua, CH).daTra);
  ok('Ký bằng khóa khác → chữ ký sai', !docKetQuaVe(veVnpay(ve(), 'khoa-cua-nguoi-khac-0123456789'), CH).chuKyDung);
  const hoa = veVnpay(ve()); hoa.set('vnp_SecureHash', (hoa.get('vnp_SecureHash') ?? '').toUpperCase());
  ok('Chữ ký viết hoa vẫn nhận (VNPay có lúc trả hex hoa)', docKetQuaVe(hoa, CH).chuKyDung);
  ok('Không có chữ ký → sai, không ném lỗi', !docKetQuaVe(new URLSearchParams(ve()), CH).chuKyDung);

  // --- đường dẫn của máy chủ ---
  const so = new SoDon(':memory:');
  const { xuLy } = taoMay(so, { vnpayThu: CH });
  const { xuLy: tat } = taoMay(so);
  const phien = ((await goi(xuLy, '/quay/dang-nhap', { method: 'POST', body: `mat_khau=${MK}`,
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } })).headers.get('set-cookie') ?? '').split(';')[0];
  ok('Chưa đăng nhập quầy → /quay/vnpay-thu chuyển về trang đăng nhập', (await goi(xuLy, '/quay/vnpay-thu?so-tien=10000')).status === 303);
  ok('Trang thử tắt (không cấu hình) → /quay/vnpay-thu 404, /vnpay-thu/ket-qua 404',
    (await goi(tat, '/quay/vnpay-thu', { headers: { cookie: phien } })).status !== 200
    && (await goi(tat, `/vnpay-thu/ket-qua?${veVnpay(ve())}`)).status === 404);
  const trangChon = await (await goi(xuLy, '/quay/vnpay-thu', { headers: { cookie: phien } })).text();
  ok('Trang thử: dòng cảnh báo môi trường thử, ba số tiền để chọn, chưa có đường dẫn', trangChon.includes('môi trường thử (sandbox)')
    && trangChon.includes('/quay/vnpay-thu?so-tien=10000') && trangChon.includes('/quay/vnpay-thu?so-tien=300000') && !trangChon.includes('sandbox.vnpayment.vn'));
  const trangLink = await (await goi(xuLy, '/quay/vnpay-thu?so-tien=50000', { headers: { cookie: phien } })).text();
  const href = trangLink.match(/href="(https:\/\/sandbox\.vnpayment\.vn[^"]+)"/)?.[1]?.replace(/&amp;/g, '&') ?? '';
  const hu = href ? new URL(href) : null;
  ok('Chọn 50.000 đ → đường dẫn tới cổng thử, số tiền 5000000, Return URL theo tên miền đang mở (https)',
    !!hu && hu.searchParams.get('vnp_Amount') === '5000000' && hu.searchParams.get('vnp_ReturnUrl') === 'https://don.beeftown.test/vnpay-thu/ket-qua', href.slice(0, 200));
  ok('Đường dẫn trong trang ký đúng (tự tính lại) và hiện mã giao dịch; khóa bí mật không có trong trang',
    !!hu && hu.searchParams.get('vnp_SecureHash') === kyMau(Object.fromEntries([...hu.searchParams].filter(([k]) => k !== 'vnp_SecureHash')))
    && trangLink.includes(hu.searchParams.get('vnp_TxnRef') ?? '?') && !trangLink.includes(KHOA));
  ok('Số tiền lạ (?so-tien=12345) → không có đường dẫn', !(await (await goi(xuLy, '/quay/vnpay-thu?so-tien=12345', { headers: { cookie: phien } })).text()).includes('sandbox.vnpayment.vn'));
  const dem = () => ['don', 'giao_dich', 'thanh_toan_zalo', 'nhat_ky'].map(b => (so.db.query(`select count(*) as n from ${b}`).get() as { n: number }).n).join(',');
  const truoc = dem();
  const tKq = await (await goi(xuLy, `/vnpay-thu/ket-qua?${veVnpay(ve())}`)).text();
  ok('Return URL (không cần đăng nhập): "Thanh toán đã hoàn tất", mã giao dịch, 300.000 đ, chữ ký đúng',
    tKq.includes('Thanh toán đã hoàn tất') && tKq.includes(maGiaoDich) && tKq.includes('300.000 đ') && tKq.includes('Chữ ký VNPay: <b>đúng</b>'));
  const tHuy = await (await goi(xuLy, `/vnpay-thu/ket-qua?${veVnpay(ve({ vnp_ResponseCode: '24', vnp_TransactionStatus: '02' }))}`)).text();
  ok('Return URL khách hủy: "Giao dịch chưa hoàn tất", "Khách hủy giao dịch."', tHuy.includes('Giao dịch chưa hoàn tất') && tHuy.includes('Khách hủy giao dịch.'));
  const tSai = await (await goi(xuLy, `/vnpay-thu/ket-qua?${sua}`)).text();
  ok('Return URL bị sửa: "Không xác nhận được kết quả", không có chữ "đã hoàn tất"', tSai.includes('Không xác nhận được kết quả') && !tSai.includes('đã hoàn tất'));
  const doc = veVnpay(ve({ vnp_TxnRef: '<script>alert(1)</script>' }));
  const tXss = await (await goi(xuLy, `/vnpay-thu/ket-qua?${doc}`)).text();
  ok('Chữ lạ trong tham số được thoát (không chèn mã được vào trang)', !tXss.includes('<script>alert') && tXss.includes('&lt;script&gt;'));
  ok('Trang kết quả và trang thử không ghi gì vào sổ đơn (đơn, tiền về, VNPay, nhật ký)', dem() === truoc, `${truoc} → ${dem()}`);
  // Số tiền của giao dịch thử (10.000 đ…) không phải giá món: quét câu chữ, bỏ số tiền như màn quầy (nhóm 11 chỉ quét câu cố định).
  ok('Hai trang không có chữ "thành công", câu chữ không chữ cấm',
    ![trangChon, trangLink, tKq, tHuy, tSai].some(t => /thành công/i.test(t)
      || timChuoiCam(t.replace(/<[^>]+>/g, ' ').replace(/\d{1,3}(\.\d{3})+ đ/g, ' ')).length));
  so.dong();

  // --- main.ts ---
  const chay = (them: Record<string, string>) => Bun.spawnSync(['bun', 'src/main.ts'], { cwd: path.join(import.meta.dir, '..'),
    env: { ...process.env, MAT_KHAU_QUAY: MK, CONG: '1', THU_MUC_DU_LIEU: path.join(os.tmpdir(), 'may-chu-don-khong-mo'), ...them } });
  const mot = chay({ VNPAY_THU_MA_TMN: 'SLKGTE22' });
  ok('main.ts: chỉ một biến trang thử → không mở máy chủ, nói đủ hai tên', mot.exitCode === 1 && mot.stderr.toString().includes('VNPAY_THU_KHOA_BI_MAT'));
  const chayNghe = async (them: Record<string, string>) => {
    const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'may-chu-don-vnpay-thu-'));
    const cong = 20000 + Math.floor(Math.random() * 20000);
    const p = Bun.spawn(['bun', 'src/main.ts'], { cwd: path.join(import.meta.dir, '..'), stdout: 'pipe', stderr: 'pipe',
      env: { ...process.env, MAT_KHAU_QUAY: MK, CONG: String(cong), THU_MUC_DU_LIEU: tam, ...them } });
    let r: Response | null = null;
    for (let i = 0; i < 50 && !r; i++) { await Bun.sleep(100); r = await fetch(`http://127.0.0.1:${cong}/suc-khoe`).catch(() => null); }
    const ketQua = await fetch(`http://127.0.0.1:${cong}/vnpay-thu/ket-qua?${veVnpay(ve())}`).then(x => x.status).catch(() => 0);
    p.kill('SIGTERM');
    const ra = await new Response(p.stdout).text();
    fs.rmSync(tam, { recursive: true, force: true });
    return { ra, ketQua };
  };
  const bat = await chayNghe({ VNPAY_THU_MA_TMN: 'SLKGTE22', VNPAY_THU_KHOA_BI_MAT: KHOA });
  ok('main.ts: đủ hai biến → trang thử bật, nhật ký ghi đường dẫn, không in khóa bí mật',
    bat.ketQua === 200 && bat.ra.includes('Trang thử VNPay (sandbox, Terminal SLKGTE22)') && !bat.ra.includes(KHOA), bat.ra.slice(0, 300));
  const that = await chayNghe({ VNPAY_THU_MA_TMN: 'SLKGTE22', VNPAY_THU_KHOA_BI_MAT: KHOA,
    ZALO_MINI_APP_ID: '2858300068641327950', ZALO_CHECKOUT_KHOA_RIENG: 'khoa-rieng-checkout-thu-0123456789abcdef', ZALO_CHECKOUT_PHUONG_THUC: 'VNPAY' });
  ok('main.ts: máy chủ nhận tiền thật (VNPAY) → trang thử tự TẮT (404) nhưng máy chủ vẫn chạy, nhật ký báo',
    that.ketQua === 404 && that.ra.includes('Trang thử VNPay: TẮT'), that.ra.slice(0, 300));
}

// =====================================================================================================
nhom('24 · Xe Ahamove (Khánh 12/11/2026): một chuyến mỗi lần bấm, không gọi trùng xe khi mất mạng, webhook có khóa, không lộ khóa và số');
{
  const API_KEY = 'api-key-ahamove-thu-abcdef0123';
  const KHOA_WH = 'khoa-webhook-ahamove-thu-0123';
  const env3 = { AHAMOVE_API_KEY: API_KEY, AHAMOVE_SO_DIEN_THOAI: '0961 245 124', AHAMOVE_KHOA_WEBHOOK: KHOA_WH };

  // --- cấu hình ---
  const c0 = docCauHinhAhamove({}), c3 = docCauHinhAhamove(env3), cThat = docCauHinhAhamove({ ...env3, AHAMOVE_MOI_TRUONG: 'that', AHAMOVE_SDT_LAY_HANG: '0901 234 567' });
  ok('Cấu hình: không biến nào → không gọi xe; đủ ba → Staging, SGN-BIKE, số 84…, số lấy hàng là số tài khoản',
    c0.ok && c0.cauHinh === null && c3.ok && c3.cauHinh?.moiTruong === 'thu' && c3.cauHinh.goc === 'https://partner-apistg.ahamove.com'
    && c3.cauHinh.dichVu === 'SGN-BIKE' && c3.cauHinh.soDienThoai === '84961245124' && c3.cauHinh.sdtLayHang === '84961245124');
  ok('Cấu hình "that" → partner-api; số lấy hàng riêng được', cThat.ok && cThat.cauHinh?.goc === 'https://partner-api.ahamove.com' && cThat.cauHinh.sdtLayHang === '84901234567');
  const cThieu = docCauHinhAhamove({ AHAMOVE_API_KEY: API_KEY }), cPhu = docCauHinhAhamove({ AHAMOVE_MOI_TRUONG: 'that' });
  const cSai = docCauHinhAhamove({ ...env3, AHAMOVE_MOI_TRUONG: 'live', AHAMOVE_KHOA_WEBHOOK: 'ngan', AHAMOVE_DICH_VU: 'HAN-BIKE' });
  ok('Thiếu một nửa, khóa webhook ngắn, môi trường lạ, dịch vụ ngoài TP.HCM → lỗi nêu đúng biến; chỉ đặt biến phụ → lỗi',
    !cThieu.ok && cThieu.loi.includes('AHAMOVE_SO_DIEN_THOAI') && cThieu.loi.includes('AHAMOVE_KHOA_WEBHOOK') && !cPhu.ok
    && !cSai.ok && cSai.loi.includes('AHAMOVE_MOI_TRUONG') && cSai.loi.includes('AHAMOVE_KHOA_WEBHOOK') && cSai.loi.includes('AHAMOVE_DICH_VU'));
  if (!c3.ok || !c3.cauHinh) throw new Error('cấu hình Ahamove mẫu hỏng');
  const CH = c3.cauHinh;

  // --- thân Tạo đơn ---
  {
    const soT = new SoDon(':memory:');
    const d = donMoi(soT, { ghiChu: 'Gửi bảo vệ', diaChi: '12 Nguyễn Huệ, phường Sài Gòn' });
    const than = thanTaoChuyen(d, 1, CH) as { path: Record<string, unknown>[]; [k: string]: unknown };
    const lay = than.path[0], giao = than.path[1];
    ok('Tạo đơn: lấy ở 63 Hồ Tùng Mậu (cùng địa chỉ Mini App), ghi chú lấy hàng dùng câu chỉ đường, không ghi số tầng, có mã đơn',
      DIEM_LAY.diaChi.startsWith(DIA_CHI_QUAN_MINI_APP.split(',')[0]) && lay.address === DIEM_LAY.diaChi && lay.mobile === CH.sdtLayHang
      && String(lay.remarks).includes(CAU_HINH.chiDuong) && !/tầng\s*\d/i.test(String(lay.remarks)) && String(lay.remarks).includes(d.ma));
    ok('Tạo đơn: giao tới địa chỉ khách + thành phố, tên, số khách, mã theo dõi mã-1, ghi chú của khách, giá trị hàng = tổng đơn',
      giao.address === '12 Nguyễn Huệ, phường Sài Gòn, Thành phố Hồ Chí Minh, Việt Nam' && giao.mobile === '0912345678' && giao.name === 'Khánh'
      && giao.tracking_number === `${d.ma}-1` && String(giao.remarks).includes('Gửi bảo vệ') && giao.item_value === d.tongTien && !('cod' in giao), JSON.stringify(giao));
    const items = than.items as { price: number; num: number }[];
    ok('Tạo đơn: ví quán (BALANCE), giao ngay, SGN-BIKE, giá mỗi dòng = số khay × giá, khối lượng có túi lạnh',
      than.payment_method === 'BALANCE' && than.order_time === 0 && than.service_id === 'SGN-BIKE' && Array.isArray(than.requests)
      && items.reduce((t, x) => t + x.price, 0) === d.tongTien && khoiLuongKg(d) === Math.round((3 * 150 / 1000 + 0.5) * 10) / 10);
    ok('Địa chỉ đã có TP.HCM / Việt Nam thì không thêm lần hai', diaChiGiaoAhamove('5 Lê Lợi, phường Sài Gòn, TP.HCM') === '5 Lê Lợi, phường Sài Gòn, TP.HCM, Việt Nam'
      && diaChiGiaoAhamove('5 Lê Lợi, Hồ Chí Minh, Việt Nam') === '5 Lê Lợi, Hồ Chí Minh, Việt Nam');
    ok('Mã theo dõi: đọc lại mã đơn và lần; mã lạ → null', docMaTheoDoiXe(`${d.ma}-2`)?.lan === 2 && docMaTheoDoiXe(`${d.ma}-2`)?.maDon === d.ma
      && docMaTheoDoiXe('ABC-1') === null && docMaTheoDoiXe(42) === null);
    soT.dong();
  }

  // --- đọc trạng thái, lỗi ---
  const tinWh = docTinChuyen({ _id: '26ABCDEF-1', status: 'ACCEPTED', sub_status: 'ARRIVED', api_key: API_KEY, supplier_id: '84909561477', supplier_name: 'Hieu Nguyen',
    shared_link: 'https://expressstg.ahamove.com/s/241021HRHVJ4', total_price: 33000, path: [{ mobile: '84961245124' }, { tracking_number: 'K7QX4M9A-1', mobile: '0912345678' }] });
  ok('Đọc webhook: bỏ đuôi -1 của điểm giao, tài xế, link ahamove.com, phí, mã theo dõi; không giữ api_key, số khách',
    tinWh?.maAha === '26ABCDEF' && tinWh.trangThai === 'ACCEPTED' && tinWh.trangThaiPhu === 'ARRIVED' && tinWh.taiXeSdt === '84909561477' && tinWh.phi === 33000
    && tinWh.maTheoDoi === 'K7QX4M9A-1' && tinWh.link.startsWith('https://expressstg.ahamove.com/') && !JSON.stringify(tinWh).includes(API_KEY)
    && !JSON.stringify(tinWh).includes('0912345678'));
  ok('Link không phải ahamove.com → bỏ; thiếu mã đơn → null', docTinChuyen({ _id: 'XYZ1234', shared_link: 'https://evil.example/ahamove.com/x' })?.link === ''
    && docTinChuyen({ status: 'ASSIGNING' }) === null && docTinChuyen([1]) === null);
  ok('Lý do hủy: bỏ dãy số dài (số điện thoại)', docTinChuyen({ _id: 'XYZ1234', status: 'CANCELLED', cancel_comment: 'Gọi 0909 123 456 không nghe' })?.lyDo === 'Gọi … không nghe');
  ok('Lỗi Ahamove: mã lấy từ title / code…, không có mã → HTTP_<số>; câu bỏ dãy số',
    docLoiAhamove(406, { title: 'INVALID_DELIVERY_AREA', description: 'Khách 0912345678' }).ma === 'INVALID_DELIVERY_AREA'
    && docLoiAhamove(406, { title: 'INVALID_DELIVERY_AREA', description: 'Khách 0912345678' }).cau === 'Khách …' && docLoiAhamove(500, undefined).ma === 'HTTP_500');

  // --- sổ: xếp chuyến ---
  let gio = LUC_DAT;
  const soanXong = (so: SoDon, d: DonDayDu) => { so.doiTrangThai(d.ma, 'da_thanh_toan', 'dang_soan', gio); return so.doiTrangThai(d.ma, 'dang_soan', 'cho_lay', gio); };
  const demChuyen = (so: SoDon, ma: string) => (so.db.query('select count(*) as n from chuyen_xe where ma_don = ?').get(ma) as { n: number }).n;
  {
    const so = new SoDon(':memory:');
    const daTra = () => { const d = donMoi(so); so.ghiDaThanhToan(d.ma, gio); return d; };
    const tat = daTra(); soanXong(so, tat);
    ok('Chưa bật gọi xe → "Soạn xong" không xếp chuyến', demChuyen(so, tat.ma) === 0);
    so.goiXe = { chiTienThat: false };
    const a = daTra(); soanXong(so, a); so.doiTrangThai(a.ma, 'dang_soan', 'cho_lay', gio);
    ok('Bật gọi xe (Staging) → "Soạn xong", kể cả bấm đúp, xếp đúng một chuyến: lần 1, việc tạo', demChuyen(so, a.ma) === 1 && so.layChuyen(a.ma, 1)?.viec === 'tao');
    so.goiXe = { chiTienThat: true };
    const mau = daTra(); soanXong(so, mau);
    const tienVe = (d: DonDayDu, id: number) => so.ghiTienVe({ idSepay: id, vao: true, soTien: d.tongTien, soTaiKhoan: TK.soTaiKhoan, taiKhoanPhu: '',
      coMaQuan: true, ngayGiaoDich: '2026-11-13 09:00:00', maThamChieu: 'FT', maDon: d.ma }, TK.soTaiKhoan, gio);
    const demo = donMoi(so); tienVe(demo, -77); soanXong(so, demo);
    const sb = donMoi(so);
    so.db.query(`insert into thanh_toan_zalo (ma_zalo, ma_don, ma_giao_dich, phuong_thuc, so_tien, ngay_giao_dich, ket_qua, can_xem, nhan_luc)
      values ('z-sb-1', ?, 'g', 'VNPAY_SANDBOX', ?, '2026-11-13 09:00:00', 'du', 0, ?)`).run(sb.ma, sb.tongTien, gio);
    so.ghiDaThanhToan(sb.ma, gio, 'vnpay'); soanXong(so, sb);
    const that = donMoi(so); tienVe(that, 5551); soanXong(so, that);
    ok('Ahamove thật: đơn mẫu, tiền giả lập demo, tiền thử VNPay sandbox không gọi xe; tiền SePay thật đủ tổng đơn → gọi xe',
      demChuyen(so, mau.ma) === 0 && demChuyen(so, demo.ma) === 0 && demChuyen(so, sb.ma) === 0 && demChuyen(so, that.ma) === 1);
    so.dong();
  }

  // --- Ahamove giả ---
  type GoiAha = { method: string; duong: string; than: Record<string, unknown> | null; auth: string };
  const goiAha: GoiAha[] = [];
  let soAha = 0, soToken = 0;
  const donAha = new Map<string, Record<string, unknown>>();
  const theoMa = new Map<string, string>();
  type KichBan = 'nem' | 'treo' | 'tao_roi_nem' | { status: number; json: unknown };
  const kichBanTao = new Map<string, KichBan[]>();
  const kichBanHuy = new Map<string, { status: number; json: unknown }>();
  const tokenTot = new Set<string>();
  let tuChoiToken: { status: number; json: unknown } | null = null;
  const taoTrenAha = (ma: string) => {
    const id = `AH${String(++soAha).padStart(4, '0')}`;
    const o: Record<string, unknown> = { _id: id, status: 'ASSIGNING', shared_link: `https://expressstg.ahamove.com/s/${id}`, total_price: 30400,
      path: [{ address: DIEM_LAY.diaChi }, { tracking_number: ma }] };
    donAha.set(id, o); theoMa.set(ma, id);
    return o;
  };
  const tra = (status: number, json: unknown) => ({ status, text: async () => JSON.stringify(json) });
  const ahaGia: HamFetchAhamove = async (url, init) => {
    const u = new URL(url);
    const than = init.body ? JSON.parse(init.body) as Record<string, unknown> : null;
    goiAha.push({ method: init.method, duong: u.pathname, than, auth: init.headers.Authorization ?? '' });
    if (u.pathname === '/v3/accounts/token') {
      if (tuChoiToken) return tra(tuChoiToken.status, tuChoiToken.json);
      const t = `token-${++soToken}-abcdefghijkl`;
      tokenTot.clear(); tokenTot.add(t);   // tài liệu: token mới làm token cũ hết hạn
      return tra(200, { token: t, refresh_token: 'r' });
    }
    if (!tokenTot.has((init.headers.Authorization ?? '').replace('Bearer ', ''))) return tra(401, { title: 'NOT_AUTHORIZED' });
    if (init.method === 'POST' && u.pathname === '/v3/orders') {
      const ma = String((than!.path as Record<string, unknown>[])[1].tracking_number);
      const kb = kichBanTao.get(ma)?.shift();
      if (kb === 'nem') throw new TypeError('fetch failed');
      if (kb === 'treo') return new Promise(() => {});
      if (kb === 'tao_roi_nem') { taoTrenAha(ma); throw new TypeError('socket hang up'); }
      if (kb) return tra(kb.status, kb.json);
      const o = taoTrenAha(ma);
      return tra(200, { order_id: o._id, status: o.status, shared_link: o.shared_link, order: o });
    }
    if (init.method === 'GET' && u.pathname.startsWith('/v3/orders/tracks/')) {
      const id = theoMa.get(decodeURIComponent(u.pathname.split('/').pop()!));
      return id ? tra(200, [donAha.get(id)]) : tra(404, { title: 'ORDER_NOT_FOUND' });
    }
    if (init.method === 'DELETE') {
      const id = u.pathname === '/v3/orders/tracks' ? theoMa.get(String(than!.tracking_number)) : u.pathname.split('/').pop()!;
      if (!id || !donAha.has(id)) return tra(404, { title: 'ORDER_NOT_FOUND' });
      const kb = kichBanHuy.get(id);
      if (kb) return tra(kb.status, kb.json);
      donAha.get(id)!.status = 'CANCELLED'; donAha.get(id)!.cancel_by_user = true;
      return tra(200, {});
    }
    if (init.method === 'GET' && u.pathname.startsWith('/v3/orders/')) {
      const o = donAha.get(u.pathname.split('/').pop()!);
      return o ? tra(200, o) : tra(404, { title: 'ORDER_NOT_FOUND' });
    }
    return tra(404, {});
  };
  const so = new SoDon(':memory:');
  so.goiXe = { chiTienThat: false };
  const phien = taoPhienAhamove();
  const nhatKy: string[] = [];
  const luot = () => goiXeMotLuot({ so, cauHinh: CH, hamFetch: ahaGia, bayGio: () => gio, phien, ghi: c => nhatKy.push(c), msHetGio: 50 });
  const donChoGiao = (them: Record<string, unknown> = {}) => { const d = donMoi(so, them); so.ghiDaThanhToan(d.ma, gio); soanXong(so, d); return d; };
  const postCua = (d: DonDayDu, lan = 1) => goiAha.filter(g => g.method === 'POST' && g.duong === '/v3/orders'
    && (g.than!.path as Record<string, unknown>[])[1].tracking_number === `${d.ma}-${lan}`).length;
  const buoc = (d: DonDayDu) => { const c = so.chuyenMoiNhat(d.ma)!; return buocXe(c, gio); };

  const r0 = await luot();
  ok('Không chuyến nào → không gọi Ahamove, không lấy token vô cớ', goiAha.length === 0 && r0.daTao === 0);

  const a = donChoGiao();
  const r1 = await luot();
  const tk = goiAha[0], tao = goiAha[1];
  ok('Lượt đầu: lấy token (mobile 84…, api_key) rồi tạo đơn với Bearer token', tk?.duong === '/v3/accounts/token' && tk.than?.mobile === '84961245124'
    && tk.than?.api_key === API_KEY && tao?.duong === '/v3/orders' && tao.auth === 'Bearer token-1-abcdefghijkl' && r1.daTao === 1);
  const ca = so.chuyenMoiNhat(a.ma)!;
  ok('Tạo được: chuyến ghi mã Ahamove, link theo dõi, phí, hết việc; quầy thấy "Ahamove đang tìm tài xế"',
    ca.maAha === 'AH0001' && ca.link === 'https://expressstg.ahamove.com/s/AH0001' && ca.phi === 30400 && ca.viec === null && buoc(a).buoc === 'tim_tai_xe');
  goiAha.length = 0;
  await luot();
  ok('Lượt sau không còn việc, chuyến vừa có tin → không gọi Ahamove (không tạo lại, không hỏi)', goiAha.length === 0);

  // Token hết hạn: Ahamove báo 401 → lấy token mới một lần, tạo lại đúng đơn đó (Ahamove chưa nhận lần 401).
  tokenTot.clear();
  const b = donChoGiao();
  await luot();
  ok('Token hết hạn (401) → lấy token mới, gửi lại một lần; Ahamove có đúng một đơn', goiAha.filter(g => g.duong === '/v3/accounts/token').length === 1
    && postCua(b) === 2 && [...theoMa.keys()].filter(k => k === `${b.ma}-1`).length === 1 && so.chuyenMoiNhat(b.ma)?.maAha !== null);

  // Mất mạng lúc tạo mà Ahamove đã nhận: KHÔNG gửi lại mù — tra theo mã theo dõi, nhận lấy đơn đã có.
  const c = donChoGiao();
  kichBanTao.set(`${c.ma}-1`, ['tao_roi_nem']);
  const r2 = await luot();
  ok('Mất mạng giữa lúc tạo → chuyến "kiem_lai", lượt dừng, chưa gửi lại', so.chuyenMoiNhat(c.ma)?.viec === 'kiem_lai' && r2.dungVi !== null && postCua(c) === 1);
  goiAha.length = 0;
  await luot();
  ok('Chưa đủ 60 giây → không tra, không gửi', goiAha.length === 0);
  gio += MS_CHO_KIEM_LAI + 1000;
  await luot();
  ok('Sau 60 giây: tra theo mã theo dõi, thấy đơn Ahamove đã tạo → nhận lấy, KHÔNG tạo đơn thứ hai',
    goiAha.some(g => g.duong === `/v3/orders/tracks/${c.ma}-1`) && postCua(c) === 0
    && [...donAha.values()].filter(o => (o.path as Record<string, unknown>[])[1].tracking_number === `${c.ma}-1`).length === 1
    && so.chuyenMoiNhat(c.ma)?.maAha === theoMa.get(`${c.ma}-1`)
    && so.chuyenMoiNhat(c.ma)?.viec === null);

  // Hết giờ mà Ahamove chưa nhận: tra không thấy → gửi lại CÙNG mã theo dõi.
  const d = donChoGiao();
  kichBanTao.set(`${d.ma}-1`, ['treo']);
  await luot();
  gio += MS_CHO_KIEM_LAI + 1000;
  await luot();
  ok('Hết giờ, tra lại không thấy → về hàng tạo', so.chuyenMoiNhat(d.ma)?.viec === 'tao');
  await luot();
  ok('Gửi lại cùng mã theo dõi mã-1, được; đếm 2 lần', postCua(d) === 2 && so.chuyenMoiNhat(d.ma)?.maAha !== null && so.chuyenMoiNhat(d.ma)?.soLan === 2);

  // Ahamove không nhận (406): thôi, quầy thấy lý do; "Gọi lại xe" ra lần 2, bấm đúp vẫn một lần.
  const e = donChoGiao();
  kichBanTao.set(`${e.ma}-1`, [{ status: 406, json: { title: 'INVALID_DELIVERY_AREA', description: 'Khu vực không hỗ trợ' } }]);
  await luot();
  ok('406 → không gửi lại, quầy thấy "Chưa gọi được xe Ahamove", được gọi lại', postCua(e) === 1 && so.chuyenMoiNhat(e.ma)?.maLoi === 'INVALID_DELIVERY_AREA'
    && buoc(e).buoc === 'khong_goi_duoc' && buoc(e).canXem && buoc(e).choGoiLai);
  ok('Gọi lại xe: lần 2; bấm đúp → "đã ở bước mới", vẫn hai lần', so.goiLaiXe(e.ma, 1, gio) === 'da_doi' && so.goiLaiXe(e.ma, 1, gio) === 'da_o_buoc_moi' && demChuyen(so, e.ma) === 2);
  await luot();
  ok('Lần 2 gửi mã theo dõi mã-2', postCua(e, 2) === 1 && so.chuyenMoiNhat(e.ma)?.lan === 2 && so.chuyenMoiNhat(e.ma)?.maAha !== null);
  ok('Gọi lại khi chuyến đang chạy → "lech", không thêm lần', so.goiLaiXe(a.ma, 1, gio) === 'lech' && demChuyen(so, a.ma) === 1);

  // 503: chắc chưa tạo — không tra, gửi lại sau 2 phút. 500: không rõ — tra lại.
  const f = donChoGiao(), g5 = donChoGiao();
  kichBanTao.set(`${f.ma}-1`, [{ status: 503, json: { title: 'SERVICE_UNAVAILABLE' } }]);
  kichBanTao.set(`${g5.ma}-1`, [{ status: 500, json: { title: 'INTERNAL_SERVER_ERROR' } }]);
  goiAha.length = 0;
  await luot();
  ok('503 → về hàng tạo, không tra; 500 → "kiem_lai" (Ahamove có thể đã tạo)', so.chuyenMoiNhat(f.ma)?.viec === 'tao'
    && so.chuyenMoiNhat(g5.ma)?.viec === 'kiem_lai' && !goiAha.some(x => x.duong.startsWith('/v3/orders/tracks/')));
  gio += 2 * 60_000 + 1000;
  await luot(); await luot();
  ok('Sau đó: f gửi lại được; g tra không thấy rồi gửi lại được', so.chuyenMoiNhat(f.ma)?.maAha !== null && so.chuyenMoiNhat(g5.ma)?.maAha !== null && postCua(g5) === 2);

  // Mất mạng mãi: tới SO_LAN_TAO_TOI_DA lần thì thôi, báo quầy.
  const h = donChoGiao();
  kichBanTao.set(`${h.ma}-1`, Array(10).fill('nem'));
  for (let i = 0; i < SO_LAN_TAO_TOI_DA * 2; i++) { await luot(); gio += MS_CHO_KIEM_LAI + 1000; }
  ok(`Mất mạng mãi → gửi đúng ${SO_LAN_TAO_TOI_DA} lần rồi thôi, quầy thấy cần làm`, postCua(h) === SO_LAN_TAO_TOI_DA
    && so.chuyenMoiNhat(h.ma)?.maLoi === 'QUA_SO_LAN' && buoc(h).canXem, String(postCua(h)));

  // Máy chủ tắt ngay sau khi đánh dấu (trước khi biết kết quả): lượt sau tra lại chứ không gửi mù.
  const k = donChoGiao();
  so.batDauTaoChuyen(k.ma, 1, gio);
  gio += MS_CHO_KIEM_LAI + 1000;
  goiAha.length = 0;
  await luot();
  ok('Đã đánh dấu mà chưa gửi (máy chủ tắt giữa chừng) → tra lại trước, rồi mới gửi', goiAha[0]?.duong === `/v3/orders/tracks/${k.ma}-1`
    && so.chuyenMoiNhat(k.ma)?.viec === 'tao' && postCua(k) === 0);
  await luot();

  // Ahamove từ chối cấp token: không gửi đơn, chuyến chờ, /suc-khoe báo.
  phien.token = null;
  tuChoiToken = { status: 404, json: { title: 'PARTNER_NOT_FOUND' } };
  const m = donChoGiao();
  const r3 = await luot();
  ok('Ahamove từ chối cấp token → không gửi đơn, chuyến còn chờ (không đếm lần), lỗi nêu biến cần kiểm',
    postCua(m) === 0 && so.chuyenMoiNhat(m.ma)?.viec === 'tao' && so.chuyenMoiNhat(m.ma)?.soLan === 0 && r3.dungVi?.includes('AHAMOVE_API_KEY') === true
    && phien.loiToken?.includes('PARTNER_NOT_FOUND') === true);
  tuChoiToken = null;
  await luot();
  ok('Token được lại → chuyến đi', so.chuyenMoiNhat(m.ma)?.maAha !== null && phien.loiToken === null);

  // --- webhook ---
  const { xuLy } = taoMay(so, { bayGio: () => gio, ahamove: { cauHinh: CH, phien } });
  const wh = (than: unknown, khoa: string | null = KHOA_WH, kieu: 'apikey' | 'bearer' = 'apikey') => goi(xuLy, '/ahamove/trang-thai', {
    method: 'POST', body: typeof than === 'string' ? than : JSON.stringify(than),
    headers: { 'content-type': 'application/json', ...(khoa === null ? {} : kieu === 'apikey' ? { apikey: khoa } : { authorization: `Bearer ${khoa}` }) },
  }, '13.250.1.1');
  const maA = so.chuyenMoiNhat(a.ma)!.maAha!;
  const r401 = await wh({ _id: maA, status: 'ACCEPTED' }, null), rSai = await wh({ _id: maA, status: 'ACCEPTED' }, 'khoa-sai-khoa-sai-khoa-sai');
  ok('Webhook không khóa, sai khóa → 401, chuyến không đổi', r401.status === 401 && rSai.status === 401 && so.chuyenMoiNhat(a.ma)?.trangThaiAha === 'ASSIGNING');
  const rDung = await wh({ _id: maA, status: 'ACCEPTED', sub_status: 'ARRIVED', supplier_id: '84909561477', supplier_name: 'Hieu Nguyen', api_key: API_KEY,
    path: [{}, { tracking_number: `${a.ma}-1`, mobile: '0912345678' }] });
  ok('Webhook đúng khóa (header apikey) → 200 khi đã ghi; tài xế tới quán', rDung.status === 200 && (await rDung.json() as { ghi: string }).ghi === 'da_ghi'
    && buoc(a).buoc === 'tai_xe_toi' && so.chuyenMoiNhat(a.ma)?.taiXeTen === 'Hieu Nguyen' && so.chuyenMoiNhat(a.ma)?.trangThaiPhu === 'ARRIVED');
  ok('Webhook nhận cả "Authorization: Bearer <khóa>"', (await wh({ _id: maA, status: 'IN PROCESS' }, KHOA_WH, 'bearer')).status === 200 && buoc(a).buoc === 'dang_giao');
  ok('Webhook lặp lại → vẫn 200, vẫn một chuyến', (await wh({ _id: maA, status: 'IN PROCESS' })).status === 200 && demChuyen(so, a.ma) === 1);
  const rXong = await wh({ _id: maA, status: 'COMPLETED', path: [{}, { status: 'COMPLETED', tracking_number: `${a.ma}-1` }] });
  const ai = (so.db.query("select ai from nhat_ky where ma_don = ? and den = 'da_giao'").get(a.ma) as { ai: string } | null)?.ai;
  ok('Ahamove báo giao được → đơn tự sang "Đã giao tới khách", nhật ký ghi ai = ahamove', rXong.status === 200 && so.layDon(a.ma)?.trangThai === 'da_giao' && ai === 'ahamove'
    && buoc(a).buoc === 'da_giao');
  await wh({ _id: maA, status: 'IN PROCESS' });
  ok('Webhook tới trễ (IN PROCESS sau COMPLETED) không kéo lùi', so.chuyenMoiNhat(a.ma)?.trangThaiAha === 'COMPLETED');
  const maB = so.chuyenMoiNhat(b.ma)!.maAha!;
  await wh({ _id: maB, status: 'COMPLETED', sub_status: 'RETURNED', path: [{}, { status: 'FAILED', fail_comment: 'Recipient does not pickup phone call' }] });
  ok('Giao không được → đơn vẫn "chờ giao", quầy thấy cần làm, được gọi lại, có lý do', so.layDon(b.ma)?.trangThai === 'cho_lay' && buoc(b).buoc === 'giao_hong'
    && buoc(b).choGoiLai && so.chuyenMoiNhat(b.ma)?.lyDo === 'Recipient does not pickup phone call');
  const maC = so.chuyenMoiNhat(c.ma)!.maAha!;
  await wh({ _id: maC, status: 'CANCELLED', cancel_by_user: false, cancel_comment: 'Auto cancel, no driver accepted' });
  ok('Ahamove tự hủy (không có tài xế) → quầy thấy "Ahamove đã hủy chuyến" và lý do', buoc(c).buoc === 'aha_huy' && buoc(c).canXem);
  const n0 = (so.db.query('select count(*) as n from chuyen_xe').get() as { n: number }).n;
  const rLa = await wh({ _id: 'ZZZ99999', status: 'ACCEPTED', path: [{}, { tracking_number: 'KHONGCO1-1' }] });
  ok('Webhook của đơn lạ → 200 "khong_thay", không ghi gì', rLa.status === 200 && (await rLa.json() as { ghi: string }).ghi === 'khong_thay'
    && (so.db.query('select count(*) as n from chuyen_xe').get() as { n: number }).n === n0);
  ok('Webhook không phải JSON → 400; quá dài → 413', (await wh('{khong-json')).status === 400 && (await wh('x'.repeat(70 * 1024))).status === 413);
  // Webhook tới trước câu trả lời Tạo đơn: nhận theo mã theo dõi.
  const p1 = donChoGiao();
  so.batDauTaoChuyen(p1.ma, 1, gio);
  await wh({ _id: 'AHWEB001', status: 'ASSIGNING', path: [{}, { tracking_number: `${p1.ma}-1` }] });
  ok('Webhook tới trước câu trả lời Tạo đơn → nhận theo mã theo dõi, hết việc tra lại', so.chuyenMoiNhat(p1.ma)?.maAha === 'AHWEB001' && so.chuyenMoiNhat(p1.ma)?.viec === null);
  const { xuLy: khongAha } = taoMay(so);
  ok('Máy chủ chưa cấu hình Ahamove → /ahamove/trang-thai 404', (await goi(khongAha, '/ahamove/trang-thai', { method: 'POST', body: '{}', headers: { apikey: KHOA_WH } })).status === 404);
  const dumpXe = JSON.stringify(so.db.query('select * from chuyen_xe').all());
  ok('Sổ chuyến xe không có api_key, token, số điện thoại khách', !dumpXe.includes(API_KEY) && !dumpXe.includes('token-') && !dumpXe.includes('0912345678'));

  // --- hủy ---
  const q = donChoGiao();
  await luot();
  so.doiTrangThai(q.ma, 'cho_lay', 'can_hoan_tien', gio);
  ok('Quầy hủy đơn có chuyến đang chạy → chuyến chuyển sang hủy', so.chuyenMoiNhat(q.ma)?.viec === 'huy' && buoc(q).buoc === 'dang_huy');
  goiAha.length = 0;
  await luot();
  const del = goiAha.find(x => x.method === 'DELETE');
  ok('Lượt sau hủy theo mã Ahamove, có lý do; quầy thấy "Đã hủy chuyến", không cần làm gì', del?.duong === `/v3/orders/${so.chuyenMoiNhat(q.ma)!.maAha}`
    && del.than?.comment === 'Khách hàng muốn hủy đơn' && buoc(q).buoc === 'quan_huy' && !buoc(q).canXem);
  const r2t = donChoGiao();
  so.doiTrangThai(r2t.ma, 'cho_lay', 'can_hoan_tien', gio);
  goiAha.length = 0;
  await luot();
  ok('Hủy đơn khi chuyến chưa gửi Ahamove → khỏi gọi Ahamove', !goiAha.some(x => x.method === 'DELETE' || (x.method === 'POST' && postCua(r2t) > 0)) && buoc(r2t).buoc === 'quan_huy');
  const s2 = donChoGiao();
  await luot();
  const maS = so.chuyenMoiNhat(s2.ma)!.maAha!;
  donAha.get(maS)!.status = 'IN PROCESS';
  kichBanHuy.set(maS, { status: 406, json: { title: 'INVALID_ORDER_STATUS' } });
  so.doiTrangThai(s2.ma, 'cho_lay', 'can_hoan_tien', gio);
  await luot();
  ok('Tài xế đã lấy hàng (406, hỏi lại thấy IN PROCESS) → "Không hủy được", quầy cần làm', buoc(s2).buoc === 'huy_khong_duoc' && buoc(s2).canXem);
  // Quầy hủy giữa lúc đang tạo: Tạo đơn xong sau lệnh hủy → vẫn hủy.
  const t2 = donChoGiao();
  so.batDauTaoChuyen(t2.ma, 1, gio);
  so.doiTrangThai(t2.ma, 'cho_lay', 'can_hoan_tien', gio);
  const oT = taoTrenAha(`${t2.ma}-1`);
  so.ghiTinAhamove(docTinChuyen({ order_id: oT._id, status: 'ASSIGNING', order: oT })!, gio, { ma: t2.ma, lan: 1 });
  ok('Tạo đơn xong sau lệnh hủy → chuyến vẫn mang việc hủy', so.chuyenMoiNhat(t2.ma)?.viec === 'huy');
  await luot();
  ok('… và lượt sau hủy nó trên Ahamove', donAha.get(String(oT._id))?.status === 'CANCELLED' && buoc(t2).buoc === 'quan_huy');

  // --- tự hỏi khi webhook im ---
  const u = donChoGiao();
  await luot();
  const maU = so.chuyenMoiNhat(u.ma)!.maAha!;
  donAha.get(maU)!.status = 'ACCEPTED'; donAha.get(maU)!.supplier_name = 'Lan'; donAha.get(maU)!.supplier_id = '84901112233';
  goiAha.length = 0;
  await luot();
  ok('Webhook mới im chưa tới 3 phút → chưa hỏi', !goiAha.some(x => x.duong === `/v3/orders/${maU}`));
  gio += MS_HOI_LAI + 1000;
  await luot();
  ok('Im quá 3 phút → máy chủ tự hỏi trạng thái, thấy tài xế đã nhận', goiAha.some(x => x.method === 'GET' && x.duong === `/v3/orders/${maU}`) && buoc(u).buoc === 'tai_xe_toi'
    && so.chuyenMoiNhat(u.ma)?.taiXeTen === 'Lan');
  goiAha.length = 0;
  await luot();
  ok('Vừa hỏi xong → lượt kế không hỏi lại', !goiAha.some(x => x.duong === `/v3/orders/${maU}`));

  // --- màn quầy ---
  const dangNhap = await goi(xuLy, '/quay/dang-nhap', { method: 'POST', body: `mat_khau=${encodeURIComponent(MK)}`,
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } });
  const phienQuay = (dangNhap.headers.get('set-cookie') ?? '').split(';')[0];
  const quay = (duong: string, init: RequestInit = {}) => goi(xuLy, duong, { ...init, headers: { cookie: phienQuay, ...(init.headers ?? {}) } });
  const ds = await (await quay('/quay')).text();
  ok('Màn quầy: dòng cảnh báo Ahamove môi trường thử', ds.includes(thoat(CHU.xeThuDauTrang.vi)));
  ok('Màn quầy: thẻ đơn có bước chuyến, tài xế bấm gọi (0901 112 233), link Ahamove mở thẻ mới không gửi referrer',
    ds.includes(NHAN_XE.tai_xe_toi.vi) && ds.includes('href="tel:84901112233"') && ds.includes('0901 112 233')
    && ds.includes(`href="https://expressstg.ahamove.com/s/${maU}" target="_blank" rel="noopener noreferrer"`));
  ok('Màn quầy: chuyến Ahamove không nhận → lý do theo mã lỗi, nút "Gọi lại xe Ahamove" là nút chính duy nhất',
    ds.includes(NHAN_XE.aha_huy.vi) && ds.includes(thoat(LOI_XE.QUA_SO_LAN.vi)) && ds.includes(CHU.xeNutGoiLai.vi));
  const nutPost = (duong: string, ma: string, lan: number, cungNguon = true) => quay(duong, { method: 'POST', body: `ma=${ma}&lan=${lan}`,
    headers: { 'content-type': 'application/x-www-form-urlencoded', ...(cungNguon ? { 'sec-fetch-site': 'same-origin' } : { 'sec-fetch-site': 'cross-site' }) } });
  ok('Nút xe từ trang khác (cross-site) → 403', (await nutPost('/quay/xe/goi-lai', b.ma, 1, false)).status === 403 && demChuyen(so, b.ma) === 1);
  const gl = await nutPost('/quay/xe/goi-lai', b.ma, 1);
  ok('Quầy bấm "Gọi lại xe" cho chuyến giao không được → lần 2, câu báo nói đúng việc', gl.status === 303 && (gl.headers.get('location') ?? '').includes('bao=xe_da_goi_lai')
    && demChuyen(so, b.ma) === 2);
  const tg = await nutPost('/quay/xe/tu-goi', c.ma, 1), tg2 = await nutPost('/quay/xe/tu-goi', c.ma, 1);
  ok('Quầy bấm "Quầy tự xử lý" → thôi báo; bấm đúp → "đã xử lý từ trước"', (tg.headers.get('location') ?? '').includes('bao=xe_da_tu_goi')
    && (tg2.headers.get('location') ?? '').includes('bao=xe_lam_roi') && buoc(c).buoc === 'tu_goi' && !buoc(c).canXem);
  ok('"Quầy tự xử lý" cho chuyến đang chạy bình thường → "lech", không đổi', (await nutPost('/quay/xe/tu-goi', u.ma, 1)).headers.get('location')?.includes('bao=xe_lech') === true
    && buoc(u).buoc === 'tai_xe_toi');
  const { xuLy: chuaVao } = taoMay(so, { ahamove: { cauHinh: CH, phien } });
  const khongPhien = await goi(chuaVao, '/quay/xe/goi-lai', { method: 'POST', body: `ma=${h.ma}&lan=1`,
    headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin' } });
  ok('Chưa đăng nhập: nút xe → về trang đăng nhập, không thêm lần', khongPhien.status === 303 && demChuyen(so, h.ma) === 1);
  const goiLau = donChoGiao();
  gio += MS_GOI_LAU + 1000;
  ok('Gọi xe quá 5 phút chưa có đơn Ahamove → quầy thấy cần làm', buoc(goiLau).buoc === 'dang_goi' && buoc(goiLau).canXem);

  // --- sức khỏe, nhật ký ---
  const sk = await (await goi(xuLy, '/suc-khoe')).json() as Record<string, unknown>;
  ok('/suc-khoe: số chuyến cần quầy làm, môi trường thử, số webhook bị từ chối; không api_key, không khóa webhook',
    typeof sk.soXeCanXem === 'number' && (sk.soXeCanXem as number) >= 3 && (sk.ahamove as { moiTruong: string }).moiTruong === 'thu'
    && (sk.ahamove as { soWebhookBiTuChoi: number }).soWebhookBiTuChoi >= 4 && !JSON.stringify(sk).includes(API_KEY) && !JSON.stringify(sk).includes(KHOA_WH));
  const nk = nhatKy.join('\n');
  ok('Nhật ký gọi xe không có api_key, token, số khách, địa chỉ khách', nhatKy.length > 5 && !nk.includes(API_KEY) && !nk.includes('token-')
    && !nk.includes('0912345678') && !nk.includes('Nguyễn Huệ'));

  // --- chữ ---
  const capXe = [...Object.values(NHAN_XE), ...Object.values(LOI_XE)];
  ok('Mọi bước chuyến, mọi lý do lỗi đều có cả vi và en, không chữ "thành công"', capXe.every(x => x.vi.trim() && x.en.trim())
    && !capXe.some(x => /thành công/i.test(x.vi)));
  so.dong();

  // --- main.ts ---
  const chayAha = (them: Record<string, string>) => Bun.spawnSync(['bun', 'src/main.ts'], { cwd: path.join(import.meta.dir, '..'),
    env: { ...process.env, MAT_KHAU_QUAY: MK, CONG: '1', THU_MUC_DU_LIEU: path.join(os.tmpdir(), 'may-chu-don-khong-mo'), ...them } });
  const nua = chayAha({ AHAMOVE_API_KEY: API_KEY });
  ok('main.ts: Ahamove khai thiếu → không mở máy chủ, nói đủ biến thiếu', nua.exitCode === 1 && nua.stderr.toString().includes('AHAMOVE_SO_DIEN_THOAI')
    && nua.stderr.toString().includes('AHAMOVE_KHOA_WEBHOOK'));
  const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'may-chu-don-aha-'));
  const cong = 20000 + Math.floor(Math.random() * 20000);
  const pr = Bun.spawn(['bun', 'src/main.ts'], { cwd: path.join(import.meta.dir, '..'), stdout: 'pipe', stderr: 'pipe',
    env: { ...process.env, MAT_KHAU_QUAY: MK, CONG: String(cong), THU_MUC_DU_LIEU: tam, ...env3 } });
  let skr: Response | null = null;
  for (let i = 0; i < 50 && !skr; i++) { await Bun.sleep(100); skr = await fetch(`http://127.0.0.1:${cong}/suc-khoe`).catch(() => null); }
  pr.kill('SIGTERM');
  const raAha = await new Response(pr.stdout).text();
  fs.rmSync(tam, { recursive: true, force: true });
  ok('main.ts: đủ ba biến → chạy, nhật ký báo môi trường thử, không in api_key hay khóa webhook', skr?.status === 200 && raAha.includes('Ahamove: MÔI TRƯỜNG THỬ')
    && !raAha.includes(API_KEY) && !raAha.includes(KHOA_WH), raAha.slice(0, 400));
}

console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA MÁY CHỦ ĐƠN ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
process.exit(hong === 0 ? 0 : 1);
