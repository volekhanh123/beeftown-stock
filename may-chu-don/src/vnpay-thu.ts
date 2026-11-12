/**
 * TRANG THỬ VNPAY TRÊN WEB — chỉ môi trường thử (sandbox), chỉ để làm phiếu kiểm thử (SIT) của VNPay
 * ==================================================================================================
 *
 * Khánh 12/11/2026: phiếu kiểm thử thủ công của VNPay (vsm-sit-client) cho Terminal SLKGTE22 đòi "Return URL" — một
 * đường dẫn web khách được đưa về sau khi trả, kèm ảnh chụp trang đó khi giao dịch thành công và thất bại. Mini App
 * trả qua Checkout SDK của Zalo không có trang web nào như vậy (Zalo đưa khách về Mini App), nên Khánh quyết làm tạm
 * một trang web thử, chỉ tiếng Việt, để qua phiếu kiểm thử. Khách không bao giờ dùng trang này.
 *
 *   · GET /quay/vnpay-thu (đã đăng nhập quầy): chọn số tiền → máy chủ ký một đường dẫn tới cổng thử của VNPay.
 *   · GET /vnpay-thu/ket-qua (Return URL, công khai — VNPay đưa trình duyệt về đây): kiểm chữ ký, hiện kết quả.
 *     Trang này KHÔNG ghi gì vào sổ đơn, không đổi đơn nào: chỉ đọc và hiện.
 *
 * Nối thẳng cổng thanh toán của VNPay (không qua Zalo), theo đặc tả "Thanh toán PAY" phiên bản 2.1.0: tham số vnp_*
 * xếp khóa a→z, mã hóa kiểu form (dấu cách thành "+"), ký HMAC-SHA512 bằng vnp_HashSecret, thêm vnp_SecureHash.
 * Nguồn: tài liệu VNPay (sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html — máy đám mây không tải được vì VNPay
 * cắt kết nối) đối chiếu qua thư viện mã nguồn mở `vnpay` 2.4.1 trên npm (buildPaymentUrl, verifyReturnUrl), đọc
 * 12/11/2026. IPN của SLKGTE22 trỏ về Zalo (Checkout SDK): giao dịch tạo ở đây thì Zalo không biết đơn, trả VNPay
 * "không thấy đơn" — không sao với môi trường thử, và kết quả vẫn hiện đúng ở Return URL.
 *
 * Chỉ chạy sandbox: địa chỉ cổng ghi cứng là sandbox.vnpayment.vn, không có biến nào đổi được sang cổng thật.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { gioVnTuMs } from '../../web/src/lib/gio-vn.ts';
import { dinhDangTien } from '../../mini-app/src/don.ts';
import { khung, thoat } from './man-quay.ts';

export const CONG_THANH_TOAN_THU = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
/** Số tiền được chọn ở trang thử (đồng). */
export const SO_TIEN_THU = [10_000, 50_000, 300_000] as const;
/** Đường dẫn khách quay về đi kèm vnp_ReturnUrl — trang kết quả của máy chủ đơn. */
export const DUONG_KET_QUA = '/vnpay-thu/ket-qua';
/** Phút để khách trả trên trang VNPay (vnp_ExpireDate). */
export const PHUT_HET_HAN_THU = 15;

export interface CauHinhVnpayThu {
  /** vnp_TmnCode — Terminal VNPay cấp (Beeftown: SLKGTE22). */
  maTmn: string;
  /** vnp_HashSecret của Terminal đó (trong tệp .zip VNPay gửi). Không bao giờ ghi ra nhật ký hay trang. */
  khoaBiMat: string;
}

/** VNPAY_THU_MA_TMN, VNPAY_THU_KHOA_BI_MAT: đủ cả hai hoặc không (trang thử tắt). */
export function docCauHinhVnpayThu(env: Record<string, string | undefined>):
  { ok: true; cauHinh: CauHinhVnpayThu | null } | { ok: false; loi: string } {
  const maTmn = (env.VNPAY_THU_MA_TMN ?? '').trim(), khoaBiMat = (env.VNPAY_THU_KHOA_BI_MAT ?? '').trim();
  if (!maTmn && !khoaBiMat) return { ok: true, cauHinh: null };
  if (!maTmn || !khoaBiMat) return { ok: false, loi: 'Trang thử VNPay cần đủ hai biến: VNPAY_THU_MA_TMN và VNPAY_THU_KHOA_BI_MAT (hoặc xóa cả hai).' };
  if (!/^[A-Z0-9]{8}$/.test(maTmn)) return { ok: false, loi: 'VNPAY_THU_MA_TMN là mã Terminal 8 ký tự chữ hoa và số, ví dụ SLKGTE22.' };
  if (khoaBiMat.length < 16 || /\s/.test(khoaBiMat)) {
    return { ok: false, loi: 'VNPAY_THU_KHOA_BI_MAT phải là Secret Key (vnp_HashSecret) chép nguyên từ tệp của VNPay (ít nhất 16 ký tự, không dấu cách).' };
  }
  return { ok: true, cauHinh: { maTmn, khoaBiMat } };
}

/** "yyyyMMddHHmmss" theo giờ Việt Nam (GMT+7) — định dạng ngày của VNPay. */
export const ngayVnpay = (ms: number) => gioVnTuMs(ms).replace(/\D/g, '').slice(0, 14);

const CHU_MA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** Mã giao dịch phía quán (vnp_TxnRef): "BTTHU" + yyMMddHHmmss giờ VN + 4 ký tự ngẫu nhiên — không trùng trong ngày. */
export function taoMaGiaoDichThu(ms: number): string {
  const b = randomBytes(4);
  return `BTTHU${ngayVnpay(ms).slice(2)}${Array.from(b, x => CHU_MA[x % CHU_MA.length]).join('')}`;
}

/** Chuỗi ký: khóa xếp a→z, mã hóa kiểu form. `boRong`: bỏ tham số rỗng (cách của thư viện vnpay). */
export function chuoiKy(thamSo: Record<string, string>, boRong = true): string {
  const p = new URLSearchParams();
  for (const k of Object.keys(thamSo).sort()) if (!boRong || thamSo[k] !== '') p.append(k, thamSo[k]);
  return p.toString();
}

const ky = (khoa: string, chuoi: string) => createHmac('sha512', khoa).update(Buffer.from(chuoi, 'utf8')).digest('hex');

/** Đường dẫn tới cổng thử của VNPay cho một lần trả `soTien` đồng. `goc`: https://don.beeftown.vn. */
export function taoLinkThanhToanThu(o: { ch: CauHinhVnpayThu; soTien: number; ip: string; ms: number; goc: string }):
  { url: string; maGiaoDich: string } {
  if (!Number.isSafeInteger(o.soTien) || o.soTien < 5_000 || o.soTien > 10_000_000) throw new Error('Số tiền thử không hợp lệ');
  const maGiaoDich = taoMaGiaoDichThu(o.ms);
  const ip = /^[0-9a-fA-F:.]{3,45}$/.test(o.ip) ? o.ip : '127.0.0.1';
  const thamSo: Record<string, string> = {
    vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: o.ch.maTmn, vnp_Amount: String(o.soTien * 100),
    vnp_CurrCode: 'VND', vnp_TxnRef: maGiaoDich, vnp_OrderInfo: `Beeftown thu VNPay ${maGiaoDich}`, vnp_OrderType: 'other',
    vnp_Locale: 'vn', vnp_ReturnUrl: `${o.goc}${DUONG_KET_QUA}`, vnp_IpAddr: ip, vnp_CreateDate: ngayVnpay(o.ms),
    vnp_ExpireDate: ngayVnpay(o.ms + PHUT_HET_HAN_THU * 60_000),
  };
  const chuoi = chuoiKy(thamSo);
  return { url: `${CONG_THANH_TOAN_THU}?${chuoi}&vnp_SecureHash=${ky(o.ch.khoaBiMat, chuoi)}`, maGiaoDich };
}

/** Ý nghĩa vnp_ResponseCode (bảng mã của VNPay, viết lại câu thường). */
export const CAU_MA_PHAN_HOI: Readonly<Record<string, string>> = {
  '00': 'Giao dịch thanh toán đã hoàn tất.',
  '07': 'Đã trừ tiền nhưng VNPay nghi ngờ giao dịch (cần quán xác nhận trên trang quản trị VNPay).',
  '09': 'Thẻ hoặc tài khoản chưa đăng ký Internet Banking.',
  '10': 'Nhập sai thông tin thẻ hoặc tài khoản quá 3 lần.',
  '11': 'Hết thời gian chờ thanh toán.',
  '12': 'Thẻ hoặc tài khoản bị khóa.',
  '13': 'Nhập sai mã OTP.',
  '24': 'Khách hủy giao dịch.',
  '51': 'Tài khoản không đủ số dư.',
  '65': 'Tài khoản vượt hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
  '99': 'Lỗi khác.',
};

export interface KetQuaVe {
  /** Chữ ký vnp_SecureHash đúng — chỉ khi đúng mới tin các trường còn lại. */
  chuKyDung: boolean;
  /** Đúng chữ ký, mã phản hồi 00 và trạng thái 00. */
  daTra: boolean;
  maGiaoDich: string;
  soTien: number | null;
  maPhanHoi: string;
  trangThai: string;
  nganHang: string;
  maGiaoDichVnpay: string;
  /** "dd/mm/yyyy HH:mm:ss" giờ VN, hoặc "". */
  thoiGian: string;
}

/** Đọc tham số VNPay gửi kèm khi đưa khách về Return URL. Không bao giờ ném lỗi. */
export function docKetQuaVe(query: URLSearchParams, ch: CauHinhVnpayThu): KetQuaVe {
  const thamSo: Record<string, string> = {};
  for (const [k, v] of query) if (k.startsWith('vnp_') && k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType') thamSo[k] = v;
  const nhan = (query.get('vnp_SecureHash') ?? '').trim().toLowerCase();
  // Tài liệu không nói rõ tham số rỗng có vào chuỗi ký không: chấp nhận cả hai cách (cả hai đều cần khóa bí mật).
  const dung = [chuoiKy(thamSo, true), chuoiKy(thamSo, false)].some(chuoi => {
    const a = Buffer.from(ky(ch.khoaBiMat, chuoi)), b = Buffer.from(nhan);
    return a.length === b.length && timingSafeEqual(a, b);
  });
  const g = (k: string, toiDa = 64) => (thamSo[k] ?? '').slice(0, toiDa);
  const tien = /^\d{1,15}$/.test(thamSo.vnp_Amount ?? '') && Number(thamSo.vnp_Amount) % 100 === 0 ? Number(thamSo.vnp_Amount) / 100 : null;
  const ngay = g('vnp_PayDate').match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  return {
    chuKyDung: dung,
    daTra: dung && thamSo.vnp_ResponseCode === '00' && thamSo.vnp_TransactionStatus === '00',
    maGiaoDich: g('vnp_TxnRef'), soTien: tien, maPhanHoi: g('vnp_ResponseCode', 4), trangThai: g('vnp_TransactionStatus', 4),
    nganHang: g('vnp_BankCode', 20), maGiaoDichVnpay: g('vnp_TransactionNo', 20),
    thoiGian: ngay ? `${ngay[3]}/${ngay[2]}/${ngay[1]} ${ngay[4]}:${ngay[5]}:${ngay[6]}` : '',
  };
}

// ---------- Hai trang (chỉ tiếng Việt — Khánh 12/11/2026: làm tiếng Việt trước) ----------

/** Trang chọn số tiền và mở cổng thử (đã đăng nhập quầy). `link`: đường dẫn đã ký cho số tiền đã chọn, nếu có. */
export function trangTaoThu(o: { soTien: number | null; link: { url: string; maGiaoDich: string } | null }): string {
  const chon = SO_TIEN_THU.map(t => `<a class="qd-nut ${t === o.soTien ? 'chinh' : 'phu'}" href="/quay/vnpay-thu?so-tien=${t}">${thoat(dinhDangTien(t))}</a>`).join('');
  const mo = !o.link || o.soTien === null ? `<p class="qd-trong">Chọn số tiền để tạo một giao dịch thử.</p>` : `<article class="qd-the">
  <p>Mã giao dịch (TxnRef): <b>${thoat(o.link.maGiaoDich)}</b> · Số tiền: <b>${thoat(dinhDangTien(o.soTien))}</b></p>
  <p>Đường dẫn dùng được ${PHUT_HET_HAN_THU} phút. Muốn giao dịch khác thì bấm lại số tiền ở trên.</p>
  <div class="qd-hang-nut"><a class="qd-nut chinh" href="${thoat(o.link.url)}">Mở trang thanh toán VNPay</a></div>
</article>`;
  return khung('vi', `<p class="qd-bao loi" role="note">Trang thử VNPay — môi trường thử (sandbox), tiền thử, không phải tiền thật. Chỉ để làm phiếu kiểm thử của VNPay; không tạo đơn, không đổi đơn nào.</p>
<h2>Giao dịch thử VNPay</h2>
<p>Giao dịch trả xong: trả bằng thẻ thử trong email VNPay. Giao dịch thất bại: trên trang VNPay bấm "Hủy" / "Quay lại".
Sau khi trả, VNPay đưa trình duyệt về trang kết quả của máy chủ này (Return URL) — chụp trang đó cho phiếu kiểm thử.</p>
<div class="qd-hang-nut">${chon}</div>
${mo}
<p><a href="/quay">Về màn hình đơn</a></p>`, { coDangXuat: true });
}

/** Trang kết quả (Return URL). `ch` null: trang thử đang tắt. */
export function trangKetQuaThu(kq: KetQuaVe | null): string {
  if (!kq) return khung('vi', `<p class="qd-bao loi">Trang thử VNPay đang tắt.</p>`);
  const tieuDe = !kq.chuKyDung ? 'Không xác nhận được kết quả'
    : kq.daTra ? 'Thanh toán đã hoàn tất' : 'Giao dịch chưa hoàn tất';
  const giaiThich = !kq.chuKyDung
    ? 'Chữ ký của VNPay không khớp: không tin kết quả trên đường dẫn này.'
    : CAU_MA_PHAN_HOI[kq.maPhanHoi] ?? `VNPay trả mã ${kq.maPhanHoi || '(trống)'}.`;
  const dong = (nhan: string, gt: string) => gt ? `<p>${thoat(nhan)}: <b>${thoat(gt)}</b></p>` : '';
  return khung('vi', `<p class="qd-bao loi" role="note">Trang thử VNPay — môi trường thử (sandbox), tiền thử, không phải tiền thật.</p>
<h2>${thoat(tieuDe)}</h2>
<article class="qd-the">
  <p>${thoat(giaiThich)}</p>
  ${dong('Mã giao dịch (TxnRef)', kq.maGiaoDich)}
  ${dong('Số tiền', kq.soTien === null ? '' : dinhDangTien(kq.soTien))}
  ${dong('Mã phản hồi (vnp_ResponseCode)', kq.maPhanHoi)}
  ${dong('Trạng thái giao dịch (vnp_TransactionStatus)', kq.trangThai)}
  ${dong('Ngân hàng', kq.nganHang)}
  ${dong('Mã giao dịch VNPay', kq.maGiaoDichVnpay)}
  ${dong('Thời gian (giờ Việt Nam)', kq.thoiGian)}
  ${dong('Chữ ký VNPay', kq.chuKyDung ? 'đúng' : 'sai')}
</article>`);
}
