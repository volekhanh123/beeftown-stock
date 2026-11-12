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
 *   CHE_DO_DEMO=1      chế độ demo: mã QR dùng tài khoản giả, quầy có nút giả lập tiền về. Không chạy cùng tài khoản
 *                      nhận thật hay SEPAY_KHOA_KY
 *   ZALO_APP_ID, ZALO_SECRET_KEY, ZNS_MAU_DA_NHAN, ZNS_MAU_DANG_GIAO
 *                      tin ZNS báo khách (đợt 3). Đặt đủ cả bốn, hoặc không đặt cái nào (chưa gửi ZNS)
 *   ZALO_CHE_DO        "thu" (mặc định: chỉ quản trị viên OA nhận) hoặc "that"
 *   ZALO_REFRESH_TOKEN_MOI  refresh token Zalo mới — máy chủ dùng một lần rồi tự làm mới (README, "Cài ZNS")
 *   ZALO_MINI_APP_ID, ZALO_CHECKOUT_KHOA_RIENG, ZALO_CHECKOUT_PHUONG_THUC
 *                      khách trả qua VNPay bằng Checkout SDK của Zalo (README, "Cài VNPay qua Checkout SDK"). Đặt đủ cả
 *                      ba, hoặc không đặt cái nào. Phương thức: VNPAY_SANDBOX (thử) hoặc VNPAY (tiền thật)
 *   VNPAY_THU_MA_TMN, VNPAY_THU_KHOA_BI_MAT
 *                      trang thử VNPay trên web, chỉ sandbox, cho phiếu kiểm thử của VNPay (README, "Trang thử VNPay
 *                      trên web"). Đủ cả hai hoặc không. Tự tắt khi ZALO_CHECKOUT_PHUONG_THUC=VNPAY (tiền thật)
 *   AHAMOVE_API_KEY, AHAMOVE_SO_DIEN_THOAI, AHAMOVE_KHOA_WEBHOOK
 *                      gọi xe Ahamove khi quầy bấm "Soạn xong, chờ giao" (README, "Cài Ahamove"). Đủ cả ba, hoặc không
 *   AHAMOVE_MOI_TRUONG "thu" (mặc định: Staging, không có tài xế thật) hoặc "that"
 *   AHAMOVE_SDT_LAY_HANG, AHAMOVE_DICH_VU  số tài xế gọi khi tới quán (mặc định số tài khoản), mã dịch vụ (SGN-BIKE)
 */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SoDon } from './so-don.ts';
import { TAI_KHOAN_DEMO, ipKhach, taoXuLy } from './may-chu.ts';
import { laTaiKhoanNhan } from './viet-qr.ts';
import { dauToken, docCauHinhZns, maHoaToken } from './zns.ts';
import { guiZnsMotLuot } from './gui-zns.ts';
import { diaChiIpnVnpay, docCauHinhCheckout, laThuNghiem } from './checkout-zalo.ts';
import { docCauHinhVnpayThu } from './vnpay-thu.ts';
import { docCauHinhAhamove } from './ahamove.ts';
import { goiXeMotLuot, taoPhienAhamove } from './goi-xe.ts';

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

// Chế độ demo (Khánh 09/11/2026: thử trọn luồng khi chưa có tài khoản ngân hàng): tiền về là giả lập, nên không bao
// giờ chạy cùng tài khoản nhận thật hay khóa SePay — kẻo khách chuyển tiền thật vào mà quầy lại bấm "giả lập".
const cheDoDemo = (env.CHE_DO_DEMO ?? '').trim();
if (cheDoDemo && cheDoDemo !== '1') {
  console.error('CHE_DO_DEMO chỉ nhận giá trị 1 (bật). Muốn tắt thì xóa dòng đó hoặc thêm # ở đầu dòng.');
  process.exit(1);
}
const demo = cheDoDemo === '1';
if (demo && (coTaiKhoan || khoaSepay)) {
  console.error('CHE_DO_DEMO=1 không chạy cùng tài khoản nhận thật (NGAN_HANG_BIN, TEN_NGAN_HANG, SO_TAI_KHOAN, TEN_TAI_KHOAN) hay SEPAY_KHOA_KY. '
    + 'Đã có tài khoản thật thì xóa dòng CHE_DO_DEMO.');
  process.exit(1);
}

// VNPay qua Checkout SDK: đủ ba biến hoặc không. Không chạy cùng chế độ demo — demo giả lập tiền về, còn VNPay (kể cả
// sandbox) là Zalo báo thật; trộn hai thứ thì quầy không biết đơn nào có tiền thật.
const checkout = docCauHinhCheckout({
  ZALO_MINI_APP_ID: env.ZALO_MINI_APP_ID, ZALO_CHECKOUT_KHOA_RIENG: env.ZALO_CHECKOUT_KHOA_RIENG,
  ZALO_CHECKOUT_PHUONG_THUC: env.ZALO_CHECKOUT_PHUONG_THUC,
});
if (!checkout.ok) { console.error(checkout.loi); process.exit(1); }
if (demo && checkout.cauHinh) {
  console.error('CHE_DO_DEMO=1 không chạy cùng VNPay (ZALO_MINI_APP_ID, ZALO_CHECKOUT_KHOA_RIENG, ZALO_CHECKOUT_PHUONG_THUC). '
    + 'Thử VNPay thì dùng ZALO_CHECKOUT_PHUONG_THUC=VNPAY_SANDBOX và xóa dòng CHE_DO_DEMO.');
  process.exit(1);
}

// Trang thử VNPay (chỉ sandbox): đủ hai biến hoặc không. Khi máy chủ đã nhận tiền thật qua VNPay thì trang thử tự tắt —
// không chặn máy chủ chạy (quên xóa hai dòng thì quầy vẫn bán được), chỉ ghi nhật ký.
const vnpayThu = docCauHinhVnpayThu({ VNPAY_THU_MA_TMN: env.VNPAY_THU_MA_TMN, VNPAY_THU_KHOA_BI_MAT: env.VNPAY_THU_KHOA_BI_MAT });
if (!vnpayThu.ok) { console.error(vnpayThu.loi); process.exit(1); }
const batTrangThu = !!vnpayThu.cauHinh && !(checkout.cauHinh && !laThuNghiem(checkout.cauHinh.phuongThuc));

const zns = docCauHinhZns({
  ZALO_APP_ID: env.ZALO_APP_ID, ZALO_SECRET_KEY: env.ZALO_SECRET_KEY, ZNS_MAU_DA_NHAN: env.ZNS_MAU_DA_NHAN,
  ZNS_MAU_DANG_GIAO: env.ZNS_MAU_DANG_GIAO, ZALO_CHE_DO: env.ZALO_CHE_DO,
});
if (!zns.ok) { console.error(zns.loi); process.exit(1); }
const tokenMoi = (env.ZALO_REFRESH_TOKEN_MOI ?? '').trim();
if (tokenMoi && !zns.cauHinh) {
  console.error('Đã đặt ZALO_REFRESH_TOKEN_MOI mà chưa đặt ZALO_APP_ID, ZALO_SECRET_KEY, ZNS_MAU_DA_NHAN, ZNS_MAU_DANG_GIAO.');
  process.exit(1);
}

// Ahamove: đủ ba biến hoặc không. Môi trường thật thì chỉ đơn có tiền thật mới gọi xe (SoDon.goiXe).
const ahamove = docCauHinhAhamove({
  AHAMOVE_API_KEY: env.AHAMOVE_API_KEY, AHAMOVE_SO_DIEN_THOAI: env.AHAMOVE_SO_DIEN_THOAI, AHAMOVE_KHOA_WEBHOOK: env.AHAMOVE_KHOA_WEBHOOK,
  AHAMOVE_MOI_TRUONG: env.AHAMOVE_MOI_TRUONG, AHAMOVE_SDT_LAY_HANG: env.AHAMOVE_SDT_LAY_HANG, AHAMOVE_DICH_VU: env.AHAMOVE_DICH_VU,
});
if (!ahamove.ok) { console.error(ahamove.loi); process.exit(1); }
const phienAhamove = taoPhienAhamove();

const so = new SoDon(join(thuMuc, 'don.sqlite'));
if (ahamove.cauHinh) so.goiXe = { chiTienThat: ahamove.cauHinh.moiTruong === 'that' };
// Tin đang gửi dở khi máy chủ tắt: Zalo có thể đã nhận — không gửi lại (SoDon.datKhongRoTinZnsDangGui).
const khongRo = so.datKhongRoTinZnsDangGui(Date.now());
if (khongRo) console.log(`ZNS: ${khongRo} tin đang gửi dở khi máy chủ tắt — không gửi lại.`);
if (zns.cauHinh && tokenMoi && so.gieoTokenZalo(maHoaToken(tokenMoi, zns.cauHinh.secretKey), dauToken(tokenMoi), Date.now())) {
  console.log('ZNS: đã nhận refresh token mới từ ZALO_REFRESH_TOKEN_MOI (máy chủ tự làm mới từ giờ).');
}
const xuLy = taoXuLy({
  so, matKhauQuay, khoaSucKhoe: env.KHOA_SUC_KHOE || undefined, cookieAnToan: env.KHONG_HTTPS !== '1',
  taiKhoan: demo ? TAI_KHOAN_DEMO : coTaiKhoan ? taiKhoan : undefined, khoaSepay: khoaSepay || undefined,
  choTraGiaThu: env.CHO_TRA_GIA_THU === '1', demo, checkout: checkout.cauHinh ?? undefined,
  vnpayThu: batTrangThu ? vnpayThu.cauHinh! : undefined,
  ahamove: ahamove.cauHinh ? { cauHinh: ahamove.cauHinh, phien: phienAhamove } : undefined,
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

// Tin ZNS mỗi phút; lượt trước chưa xong thì bỏ lượt này (không hai lượt chồng nhau).
let dangGuiZns = false;
const guiZns = zns.cauHinh ? setInterval(async () => {
  if (dangGuiZns) return;
  dangGuiZns = true;
  try { await guiZnsMotLuot({ so, cauHinh: zns.cauHinh!, hamFetch: (url, init) => fetch(url, init), bayGio: Date.now }); }
  catch (e) { console.error('ZNS: lượt gửi hỏng:', e instanceof Error ? e.message : e); }
  finally { dangGuiZns = false; }
}, 60_000) : undefined;

// Xe Ahamove 15 giây một lần (quầy bấm "Soạn xong" thì chuyến đi trong khoảng đó); lượt trước chưa xong thì bỏ lượt này.
let dangGoiXe = false;
const goiXe = ahamove.cauHinh ? setInterval(async () => {
  if (dangGoiXe) return;
  dangGoiXe = true;
  try { await goiXeMotLuot({ so, cauHinh: ahamove.cauHinh!, hamFetch: (url, init) => fetch(url, init), bayGio: Date.now, phien: phienAhamove }); }
  catch (e) { console.error('Ahamove: lượt gọi xe hỏng:', e instanceof Error ? e.message : e); }
  finally { dangGoiXe = false; }
}, 15_000) : undefined;

// Đơn chờ trả tiền quá 30 phút → hết hạn. Lỗi một lượt thì ghi nhật ký, lượt sau chạy lại.
const hetHan = setInterval(() => {
  try { const n = so.datHetHan(Date.now()); if (n) console.log(`Hết hạn ${n} đơn chưa trả tiền.`); }
  catch (e) { console.error('Đặt hết hạn hỏng:', e); }
}, 60_000);

console.log(`Máy chủ đơn đang nghe http://${diaChi}:${mayChu.port} · sổ đơn ${join(thuMuc, 'don.sqlite')}`);
console.log(demo ? 'CHẾ ĐỘ DEMO: mã QR dùng tài khoản giả, quầy có nút giả lập tiền về — không có tiền thật. Tắt trước khi mở bán.'
  : coTaiKhoan ? `Nhận chuyển khoản vào ${taiKhoan.tenNganHang} …${taiKhoan.soTaiKhoan.slice(-4)}`
  : checkout.cauHinh ? 'Chuyển khoản VietQR: tắt (chưa có tài khoản nhận) — khách trả qua VNPay.' : 'Chưa có tài khoản nhận: đơn chưa có mã trả tiền.');
console.log(khoaSepay ? 'SePay: đã có khóa ký.' : 'SePay: chưa có khóa ký — /sepay/tien-ve trả 503.');
if (vnpayThu.cauHinh) console.log(batTrangThu
  ? `Trang thử VNPay (sandbox, Terminal ${vnpayThu.cauHinh.maTmn}): /quay/vnpay-thu — chỉ để làm phiếu kiểm thử của VNPay.`
  : 'Trang thử VNPay: TẮT vì máy chủ đang nhận tiền thật (ZALO_CHECKOUT_PHUONG_THUC=VNPAY). Xóa hai dòng VNPAY_THU_… cho gọn.');
console.log(!checkout.cauHinh ? 'VNPay: chưa cấu hình Checkout SDK — đơn trả bằng VietQR (nếu có tài khoản nhận).'
  : `VNPay qua Checkout SDK: ${laThuNghiem(checkout.cauHinh.phuongThuc) ? 'MÔI TRƯỜNG THỬ (VNPAY_SANDBOX) — tiền thử, không phải tiền thật' : 'tiền thật (VNPAY)'}`
    + `, Mini App ${checkout.cauHinh.maMiniApp}. IPN khai với VNPay: ${diaChiIpnVnpay(checkout.cauHinh.maMiniApp)}`);
console.log(!zns.cauHinh ? 'ZNS: chưa cấu hình — không gửi tin Zalo.'
  : `ZNS: chế độ ${zns.cauHinh.cheDo === 'thu' ? 'thử (chỉ quản trị viên OA nhận)' : 'thật'}, token ${so.docTokenZalo()?.refreshMa ? 'đã có' : 'CHƯA có — đặt ZALO_REFRESH_TOKEN_MOI'}.`);
console.log(!ahamove.cauHinh ? 'Ahamove: chưa cấu hình — quầy tự gọi xe.'
  : `Ahamove: ${ahamove.cauHinh.moiTruong === 'thu' ? 'MÔI TRƯỜNG THỬ (Staging) — không có tài xế thật' : 'thật — chỉ đơn có tiền thật mới gọi xe'}`
    + `, dịch vụ ${ahamove.cauHinh.dichVu}. Webhook khai ở Partner Portal: https://<tên miền>/ahamove/trang-thai, header apikey = AHAMOVE_KHOA_WEBHOOK.`);

for (const tin of ['SIGINT', 'SIGTERM'] as const) {
  process.on(tin, () => { clearInterval(hetHan); clearInterval(guiZns); clearInterval(goiXe); mayChu.stop(); so.dong(); process.exit(0); });
}
