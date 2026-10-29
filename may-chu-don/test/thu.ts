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
import { GioiHan, cungNguon, ipKhach, taoXuLy } from '../src/may-chu.ts';
import { createHmac } from 'node:crypto';
import { chuoiVietQr, crc16, docTruong, laTaiKhoanNhan, noiDungChuyenKhoan } from '../src/viet-qr.ts';
import { DA_NHAN, docTinTienVe, kiemChuKy, timMaDon, type TinTienVe } from '../src/sepay.ts';

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
  cachNhan: 'tai-quan', ngay: '2026-11-13', gio: '18:30',
  ten: 'Khánh', dienThoai: '0912 345 678', ghiChu: '',
  ...them,
});

// =====================================================================================================
nhom('1 · Kiểm đơn: giá do máy chủ tính, chỉ nhận tại quán');
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
  ok('Giao tận nơi → từ chối (đợt đầu đơn trả trước chỉ nhận tại quán)', loi(donHopLe({ cachNhan: 'giao-hang' })).some(l => l.includes('tại quán')));
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
  ok(`Hôm nay 10:00 giờ VN: 10:30 không còn chọn được (cần ${CAU_HINH.soPhutChuanBi} phút soạn), 11:00 được`,
    loi({ gio: '10:30' }, msVn('2026-11-13T10:00:00+07:00')).length === 1 && loi({ gio: '11:00' }, msVn('2026-11-13T10:00:00+07:00')).length === 0);
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
  const daTra = donMoi(so, { ten: '<script>alert(1)</script> Lan', ghiChu: 'Lấy "2" túi' });
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
  const maNguon = ['tao-don.ts', 'may-chu.ts', 'man-quay.ts', 'trang-thai.ts', 'so-don.ts']
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
  // 09:29 đặt 10:30 (cần 60 phút soạn) được; 09:31 thì 10:30 không còn chọn được.
  datGio(msVn('2026-11-13T09:29:00+07:00'));
  const than = donHopLe({ gio: '10:30' });
  const r1 = await guiDon(xuLy, than);
  const j1 = await r1.json() as { ma: string };
  datGio(msVn('2026-11-13T09:31:00+07:00'));
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
  ok('Thẻ đơn ghi số tiền đã nhận chuyển khoản', trang.includes(`Đã nhận chuyển khoản: ${(j.tongTien + 30_000).toLocaleString('vi-VN')} đ`));
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

console.log(hong === 0 ? `\nTẤT CẢ ${dat} KIỂM TRA MÁY CHỦ ĐƠN ĐỀU ĐẠT` : `\n${hong} KIỂM TRA HỎNG / ${dat + hong}`);
process.exit(hong === 0 ? 0 : 1);
