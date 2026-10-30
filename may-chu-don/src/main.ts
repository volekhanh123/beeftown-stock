/**
 * Khởi động máy chủ đơn:  bun src/main.ts   (cd may-chu-don && npm run chay)
 *
 * Biến môi trường (README.md, "Biến môi trường"):
 *   MAT_KHAU_QUAY      bắt buộc, ít nhất 8 ký tự — mật khẩu màn hình quầy
 *   CONG               cổng nghe, mặc định 8787
 *   DIA_CHI_NGHE       mặc định 127.0.0.1 (sau proxy HTTPS); thử từ máy tính bảng trong LAN thì 0.0.0.0
 *   THU_MUC_DU_LIEU    nơi để don.sqlite, mặc định ./du-lieu — nằm trên máy ở Việt Nam, không bao giờ vào git
 *   KHOA_SUC_KHOE      có thì /suc-khoe đòi ?khoa=
 *   KHONG_HTTPS=1      bỏ cờ Secure của cookie (chỉ khi thử trong LAN bằng http)
 *   TIN_PROXY=1        lấy IP khách từ mục cuối của X-Forwarded-For (chỉ khi đứng sau proxy của mình)
 *   NGAN_HANG_BIN, TEN_NGAN_HANG, SO_TAI_KHOAN, TEN_TAI_KHOAN
 *                      tài khoản nhận chuyển khoản (VietinBank: BIN 970415). Đặt đủ cả bốn, hoặc không đặt cái nào
 *   SEPAY_KHOA_KY      khóa HMAC-SHA256 của webhook SePay (ít nhất 16 ký tự)
 *   CHO_TRA_GIA_THU=1  cho hiện mã trả tiền khi bảng giá còn là giá thử (chỉ để thử chuyển khoản thật số nhỏ)
 */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SoDon } from './so-don.ts';
import { ipKhach, taoXuLy } from './may-chu.ts';
import { laTaiKhoanNhan } from './viet-qr.ts';

const env = process.env;
const matKhauQuay = env.MAT_KHAU_QUAY ?? '';
if (matKhauQuay.length < 8) {
  console.error('Thiếu MAT_KHAU_QUAY (ít nhất 8 ký tự). Đặt rồi chạy lại — xem README.md, "Biến môi trường".');
  process.exit(1);
}
const cong = Number(env.CONG ?? 8787);
const diaChi = env.DIA_CHI_NGHE ?? '127.0.0.1';
const thuMuc = resolve(env.THU_MUC_DU_LIEU ?? './du-lieu');
mkdirSync(thuMuc, { recursive: true });

// Tài khoản nhận: đủ cả bốn biến, hoặc không biến nào (chưa nhận trả trước). Thiếu một biến là gõ sai — không mở máy chủ
// với tài khoản nửa vời, kẻo khách chuyển tiền vào đâu không rõ.
const taiKhoan = { bin: env.NGAN_HANG_BIN ?? '', tenNganHang: env.TEN_NGAN_HANG ?? '', soTaiKhoan: env.SO_TAI_KHOAN ?? '', tenTaiKhoan: env.TEN_TAI_KHOAN ?? '' };
const coTaiKhoan = Object.values(taiKhoan).some(v => v !== '');
if (coTaiKhoan && !laTaiKhoanNhan(taiKhoan)) {
  console.error('Tài khoản nhận chưa đủ hoặc sai: cần NGAN_HANG_BIN (6 số), TEN_NGAN_HANG, SO_TAI_KHOAN (6–19 số), TEN_TAI_KHOAN.');
  process.exit(1);
}
const khoaSepay = env.SEPAY_KHOA_KY ?? '';
if (khoaSepay && khoaSepay.length < 16) {
  console.error('SEPAY_KHOA_KY phải có ít nhất 16 ký tự — tạo khóa ở SePay → Webhooks → Bảo mật → HMAC-SHA256.');
  process.exit(1);
}
// Có khóa SePay mà chưa có tài khoản: máy chủ không biết tiền nào là của quán — mọi lần tiền về sẽ bị từ chối (503).
if (khoaSepay && !coTaiKhoan) {
  console.error('Đã đặt SEPAY_KHOA_KY mà chưa đặt tài khoản nhận (NGAN_HANG_BIN, TEN_NGAN_HANG, SO_TAI_KHOAN, TEN_TAI_KHOAN).');
  process.exit(1);
}

const so = new SoDon(join(thuMuc, 'don.sqlite'));
const xuLy = taoXuLy({
  so, matKhauQuay, khoaSucKhoe: env.KHOA_SUC_KHOE || undefined, cookieAnToan: env.KHONG_HTTPS !== '1',
  taiKhoan: coTaiKhoan ? taiKhoan : undefined, khoaSepay: khoaSepay || undefined, choTraGiaThu: env.CHO_TRA_GIA_THU === '1',
});
const tinProxy = env.TIN_PROXY === '1';

const mayChu = Bun.serve({
  port: cong,
  hostname: diaChi,
  maxRequestBodySize: 64 * 1024,
  async fetch(req, server) {
    const ip = ipKhach(req.headers.get('x-forwarded-for'), tinProxy, server.requestIP(req)?.address);
    try { return await xuLy(req, ip); }
    catch (e) {
      console.error('Lỗi không lường trước:', e);
      return new Response('Máy chủ đang lỗi.', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  },
});

// Đơn chờ trả tiền quá 30 phút → hết hạn. Lỗi một lượt thì ghi nhật ký, lượt sau chạy lại.
const hetHan = setInterval(() => {
  try { const n = so.datHetHan(Date.now()); if (n) console.log(`Hết hạn ${n} đơn chưa trả tiền.`); }
  catch (e) { console.error('Đặt hết hạn hỏng:', e); }
}, 60_000);

console.log(`Máy chủ đơn đang nghe http://${diaChi}:${mayChu.port} · sổ đơn ${join(thuMuc, 'don.sqlite')}`);
console.log(coTaiKhoan ? `Nhận chuyển khoản vào ${taiKhoan.tenNganHang} …${taiKhoan.soTaiKhoan.slice(-4)}` : 'Chưa có tài khoản nhận: đơn chưa có mã trả tiền.');
console.log(khoaSepay ? 'SePay: đã có khóa ký.' : 'SePay: chưa có khóa ký — /sepay/tien-ve trả 503.');

for (const tin of ['SIGINT', 'SIGTERM'] as const) {
  process.on(tin, () => { clearInterval(hetHan); mayChu.stop(); so.dong(); process.exit(0); });
}
