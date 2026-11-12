/**
 * VNPAY CHO MUA THỊT VỀ — CẤU HÌNH, KÝ ĐƯỜNG DẪN TRẢ TIỀN, KIỂM CHỮ KÝ VNPAY GỬI VỀ (0115)
 * =========================================================================================
 *
 * Khánh 12/11/2026: đặt hàng ở trang Mua thịt về xong thì mở cổng VNPay; giá gói đã gồm phí giao, khách trả đúng
 * tổng tiền gói. Website nối thẳng VNPay bằng Terminal riêng đã đăng ký cho beeftown.vn (Mini App đi qua Checkout SDK
 * của Zalo bằng Terminal khác — IPN của Terminal đó trỏ về Zalo, không dùng được ở đây).
 *
 * Đặc tả "Thanh toán PAY" 2.1.0 của VNPay: tham số vnp_* xếp khóa a→z, mã hóa kiểu form (dấu cách thành "+"), ký
 * HMAC-SHA512 bằng vnp_HashSecret, thêm vnp_SecureHash. Kiểm chữ ký VNPay gửi về (Return URL, IPN): bỏ vnp_SecureHash
 * và vnp_SecureHashType, ký lại, so khớp không phân biệt hoa thường. Nguồn: tài liệu VNPay đối chiếu qua thư viện mã
 * nguồn mở `vnpay` 2.4.1 trên npm (buildPaymentUrl, verifyReturnUrl, verifyIpnCall; mã RspCode của IPN), đọc
 * 12/11/2026 — cùng cách ký với trang thử của máy chủ đơn (may-chu-don/src/vnpay-thu.ts), đã qua kiểm thử tự động
 * của VNPay (6/6). Dải IP VNPay gửi IPN ở môi trường thử: VNPay báo Khánh 12/11/2026.
 *
 * Chỉ môi trường thử (sandbox): cổng ghi cứng là sandbox.vnpayment.vn, không biến nào đổi được sang cổng thật —
 * chuyển sang tiền thật là một PR riêng (Terminal thật, dải IP thật của VNPay).
 *
 * Bốn bí mật Worker (web/README.md, "VNPay cho Mua thịt về") — THIẾU MỘT là trang chạy như chưa có VNPay (quán gọi
 * xác nhận, website không thu tiền): không bao giờ thu tiền khi không ghi được kết quả về database.
 *   VNPAY_MA_TMN        vnp_TmnCode — mã Terminal của website.
 *   VNPAY_KHOA_BI_MAT   vnp_HashSecret của Terminal đó. Không bao giờ ra nhật ký, trang hay database.
 *   VNPAY_MAY_EMAIL, VNPAY_MAY_MAT_KHAU  tài khoản máy vai may_vnpay (0114) — ghi kết quả IPN.
 * Tùy chọn: VNPAY_IP_IPN — dải IP được gửi IPN (CIDR IPv4, cách nhau dấu phẩy); vắng thì dải của môi trường thử.
 *
 * File THUẦN (Web Crypto, không Supabase, không Astro) — kiểm thử: crm/test/test-mua-thit-vnpay-web.mjs.
 */

import { docChuoi, envNode, envWorker, type Env } from './bien-moi-truong.ts';
import { gioVnTuMs, isoGioVn } from './gio-vn.ts';
import type { NgonNgu } from './noi-dung.ts';

/** Cổng thanh toán VNPay — môi trường thử. */
export const CONG_VNPAY = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
/** Phút để khách trả trên trang VNPay (vnp_ExpireDate). */
export const PHUT_HET_HAN = 15;
/** Dải IP VNPay gửi IPN ở môi trường thử (VNPay báo Khánh 12/11/2026, "case 10 whitelist IP"). */
export const IP_IPN_THU: readonly string[] = ['113.20.124.24/29', '58.187.148.88/29'];

export const TEN_BI_MAT_VNPAY = {
  maTmn: 'VNPAY_MA_TMN', khoaBiMat: 'VNPAY_KHOA_BI_MAT', email: 'VNPAY_MAY_EMAIL', matKhau: 'VNPAY_MAY_MAT_KHAU',
  ipIpn: 'VNPAY_IP_IPN',
} as const;

export interface CauHinhVnpay {
  maTmn: string;
  khoaBiMat: string;
  email: string;
  matKhau: string;
  /** Dải IP được gửi IPN, đã kiểm dạng. */
  ipIpn: string[];
}

export type DocCauHinh =
  | { ok: true; cauHinh: CauHinhVnpay }
  /** chuaCai: chưa đặt bí mật nào — không phải lỗi. cau: lý do cho nhật ký (không chứa giá trị bí mật). */
  | { ok: false; chuaCai: boolean; cau: string };

const MAU_CIDR = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/;

/** "a.b.c.d" hoặc "a.b.c.d/n" IPv4 hợp lệ. */
function laCidr(s: string): boolean {
  const m = s.match(MAU_CIDR);
  if (!m) return false;
  if (m.slice(1, 5).some(x => Number(x) > 255)) return false;
  return m[5] === undefined || Number(m[5]) <= 32;
}

/** Đọc cấu hình từ một nguồn env (test truyền thẳng). Không bao giờ ném lỗi. */
export function docCauHinhTu(...nguon: Env[]): DocCauHinh {
  const T = TEN_BI_MAT_VNPAY;
  const maTmn = docChuoi(T.maTmn, ...nguon), khoaBiMat = docChuoi(T.khoaBiMat, ...nguon);
  const email = docChuoi(T.email, ...nguon), matKhau = docChuoi(T.matKhau, ...nguon);
  const thieu = [[T.maTmn, maTmn], [T.khoaBiMat, khoaBiMat], [T.email, email], [T.matKhau, matKhau]]
    .filter(([, v]) => !v).map(([ten]) => ten);
  if (thieu.length === 4) return { ok: false, chuaCai: true, cau: 'chưa cài VNPay' };
  if (thieu.length) return { ok: false, chuaCai: false, cau: `thiếu bí mật ${thieu.join(', ')} — trang chạy như chưa có VNPay` };
  if (!/^[A-Z0-9]{8}$/.test(maTmn!)) return { ok: false, chuaCai: false, cau: `${T.maTmn} phải là mã Terminal 8 ký tự chữ hoa và số` };
  if (khoaBiMat!.length < 16 || /\s/.test(khoaBiMat!)) {
    return { ok: false, chuaCai: false, cau: `${T.khoaBiMat} phải là Secret Key chép nguyên từ VNPay (ít nhất 16 ký tự, không dấu cách)` };
  }
  const ipChu = docChuoi(T.ipIpn, ...nguon);
  const ipIpn = ipChu ? ipChu.split(/[\s,]+/).filter(Boolean) : [...IP_IPN_THU];
  if (!ipIpn.length || !ipIpn.every(laCidr)) {
    return { ok: false, chuaCai: false, cau: `${T.ipIpn} phải là danh sách dải IPv4, ví dụ 113.20.124.24/29, 58.187.148.88/29` };
  }
  return { ok: true, cauHinh: { maTmn: maTmn!, khoaBiMat: khoaBiMat!, email: email!, matKhau: matKhau!, ipIpn } };
}

/** Đọc cấu hình: env truyền vào → env Worker → process.env. */
export async function docCauHinhVnpay(env?: Env): Promise<DocCauHinh> {
  return docCauHinhTu(env, await envWorker(), envNode());
}

// -----------------------------------------------------------------------------
// IP
// -----------------------------------------------------------------------------
const soIp = (ip: string): number | null => {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const p = m.slice(1, 5).map(Number);
  if (p.some(x => x > 255)) return null;
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
};

/** IP (IPv4; IPv6 dạng ::ffff:a.b.c.d cũng nhận) có nằm trong một dải của danh sách không. */
export function ipTrongDanhSach(ip: string | null, danhSach: readonly string[]): boolean {
  const so = soIp(String(ip ?? '').replace(/^::ffff:/i, ''));
  if (so === null) return false;
  return danhSach.some(d => {
    const [goc, n] = d.split('/');
    const g = soIp(goc);
    if (g === null) return false;
    const bit = n === undefined ? 32 : Number(n);
    const mat = bit === 0 ? 0 : (0xffffffff << (32 - bit)) >>> 0;
    return ((so & mat) >>> 0) === ((g & mat) >>> 0);
  });
}

// -----------------------------------------------------------------------------
// KÝ
// -----------------------------------------------------------------------------
/** "yyyyMMddHHmmss" theo giờ Việt Nam (GMT+7) — định dạng ngày của VNPay. */
export const ngayVnpay = (ms: number) => gioVnTuMs(ms).replace(/\D/g, '').slice(0, 14);

/** Chuỗi ký: khóa xếp a→z, mã hóa kiểu form. `boRong`: bỏ tham số rỗng (cách của thư viện vnpay). */
export function chuoiKy(thamSo: Record<string, string>, boRong = true): string {
  const p = new URLSearchParams();
  for (const k of Object.keys(thamSo).sort()) if (!boRong || thamSo[k] !== '') p.append(k, thamSo[k]);
  return p.toString();
}

const ma = new TextEncoder();
/** HMAC-SHA512, chữ hex thường. */
export async function kyHmac(khoa: string, chuoi: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', ma.encode(khoa), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const ky = new Uint8Array(await crypto.subtle.sign('HMAC', k, ma.encode(chuoi)));
  return Array.from(ky, b => b.toString(16).padStart(2, '0')).join('');
}

/** So hai chuỗi trong thời gian không đổi (không lộ chữ ký đúng qua thời gian trả lời). */
function bangNhau(a: string, b: string): boolean {
  const x = ma.encode(a), y = ma.encode(b);
  let khac = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) khac |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return khac === 0;
}

export interface LanTra {
  /** vnp_TxnRef — mã đơn + số lần (mua_thit_mo_vnpay, 0115). */
  maGiaoDich: string;
  maDon: string;
  /** Đồng — số database đã chốt. */
  soTien: number;
  ngonNgu: NgonNgu;
  /** IP của khách (vnp_IpAddr). */
  ip: string | null;
  /** Đường dẫn đầy đủ VNPay đưa khách về (vnp_ReturnUrl). */
  duongVe: string;
  ms: number;
}

/** Đường dẫn tới cổng VNPay cho một lần trả. Ném khi số tiền hay mã không hợp lệ (lỗi lập trình, không phải của khách). */
export async function taoLinkVnpay(ch: Pick<CauHinhVnpay, 'maTmn' | 'khoaBiMat'>, l: LanTra): Promise<string> {
  if (!Number.isSafeInteger(l.soTien) || l.soTien < 5_000 || l.soTien >= 1_000_000_000) throw new Error('VNPay: số tiền không hợp lệ');
  if (!/^[0-9A-Z]{6}[0-9]{2}$/.test(l.maGiaoDich) || !/^[0-9A-Z]{6}$/.test(l.maDon)) throw new Error('VNPay: mã giao dịch không hợp lệ');
  const ip = l.ip && /^[0-9a-fA-F:.]{3,45}$/.test(l.ip) ? l.ip : '127.0.0.1';
  const thamSo: Record<string, string> = {
    vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: ch.maTmn, vnp_Amount: String(l.soTien * 100),
    vnp_CurrCode: 'VND', vnp_TxnRef: l.maGiaoDich,
    // Không dấu, không ký tự đặc biệt (đặc tả VNPay).
    vnp_OrderInfo: `Beeftown thanh toan don ${l.maDon}`, vnp_OrderType: 'other',
    vnp_Locale: l.ngonNgu === 'vi' ? 'vn' : 'en', vnp_ReturnUrl: l.duongVe, vnp_IpAddr: ip,
    vnp_CreateDate: ngayVnpay(l.ms), vnp_ExpireDate: ngayVnpay(l.ms + PHUT_HET_HAN * 60_000),
  };
  const chuoi = chuoiKy(thamSo);
  return `${CONG_VNPAY}?${chuoi}&vnp_SecureHash=${await kyHmac(ch.khoaBiMat, chuoi)}`;
}

// -----------------------------------------------------------------------------
// ĐỌC THAM SỐ VNPAY GỬI VỀ (Return URL, IPN — cùng bộ tham số, cùng cách ký)
// -----------------------------------------------------------------------------
export interface KetQuaVnpay {
  /** Chữ ký vnp_SecureHash đúng — chỉ khi đúng mới tin các trường còn lại. */
  chuKyDung: boolean;
  /** Đúng chữ ký, vnp_ResponseCode 00 và vnp_TransactionStatus 00 (thiếu thì theo mã phản hồi). */
  daTra: boolean;
  maTmn: string;
  maGiaoDich: string;
  /** 6 ký tự đầu của mã giao dịch khi đúng dạng, không thì ''. */
  maDon: string;
  /** Đồng; null khi vnp_Amount sai dạng. */
  soTien: number | null;
  maPhanHoi: string;
  trangThaiGd: string | null;
  maVnpay: string;
  nganHang: string;
  /** vnp_PayDate (giờ VN) thành ISO +07:00; sai dạng hay ngày không có thật → null. */
  traLuc: string | null;
}

/** Không bao giờ ném lỗi. Tham số không phải vnp_* bị bỏ qua (không vào chuỗi ký, không đọc). */
export async function docThamSoVnpay(query: URLSearchParams, ch: Pick<CauHinhVnpay, 'khoaBiMat'>): Promise<KetQuaVnpay> {
  const thamSo: Record<string, string> = {};
  for (const [k, v] of query) if (k.startsWith('vnp_') && k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType') thamSo[k] = v;
  const nhan = (query.get('vnp_SecureHash') ?? '').trim().toLowerCase();
  // Tài liệu không nói rõ tham số rỗng có vào chuỗi ký không: nhận cả hai cách (cả hai đều cần khóa bí mật).
  let dung = false;
  if (/^[0-9a-f]{128}$/.test(nhan)) {
    for (const chuoi of new Set([chuoiKy(thamSo, true), chuoiKy(thamSo, false)])) {
      if (bangNhau(await kyHmac(ch.khoaBiMat, chuoi), nhan)) dung = true;
    }
  }
  const g = (k: string, toiDa = 64) => (thamSo[k] ?? '').slice(0, toiDa);
  const tien = /^\d{1,15}$/.test(thamSo.vnp_Amount ?? '') && Number(thamSo.vnp_Amount) % 100 === 0 ? Number(thamSo.vnp_Amount) / 100 : null;
  const ngay = g('vnp_PayDate').match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  const maGiaoDich = g('vnp_TxnRef', 40);
  const trangThaiGd = thamSo.vnp_TransactionStatus === undefined ? null : g('vnp_TransactionStatus', 4);
  return {
    chuKyDung: dung,
    daTra: dung && thamSo.vnp_ResponseCode === '00' && (trangThaiGd ?? '00') === '00',
    maTmn: g('vnp_TmnCode', 16), maGiaoDich,
    maDon: /^[0-9A-Z]{6}[0-9]{2}$/.test(maGiaoDich) ? maGiaoDich.slice(0, 6) : '',
    soTien: tien, maPhanHoi: g('vnp_ResponseCode', 4), trangThaiGd,
    maVnpay: g('vnp_TransactionNo', 20), nganHang: g('vnp_BankCode', 20),
    traLuc: ngay ? isoGioVn(+ngay[1], +ngay[2], +ngay[3], +ngay[4], +ngay[5], +ngay[6]) : null,
  };
}

// -----------------------------------------------------------------------------
// Ý NGHĨA MÃ PHẢN HỒI — câu khách đọc ở trang kết quả (bảng mã của VNPay, viết lại câu thường)
// -----------------------------------------------------------------------------
type BaThu = Record<NgonNgu, string>;
export const CAU_MA_PHAN_HOI: Readonly<Record<string, BaThu>> = {
  '07': { vi: 'Ngân hàng đã trừ tiền nhưng VNPay đang kiểm tra lại giao dịch. Quán sẽ gọi bạn.',
          en: 'Your bank took the payment, but VNPay is checking the transaction. We will call you.',
          ko: '은행에서 결제는 되었지만 VNPay가 거래를 확인하고 있어요. 매장에서 연락드릴게요.' },
  '09': { vi: 'Thẻ hoặc tài khoản chưa đăng ký Internet Banking.', en: 'The card or account is not registered for Internet Banking.',
          ko: '카드나 계좌가 인터넷 뱅킹에 등록되어 있지 않아요.' },
  '10': { vi: 'Nhập sai thông tin thẻ hoặc tài khoản quá 3 lần.', en: 'The card or account details were entered wrongly more than 3 times.',
          ko: '카드나 계좌 정보를 3번 넘게 잘못 입력하셨어요.' },
  '11': { vi: 'Hết thời gian chờ trả tiền.', en: 'The payment time ran out.', ko: '결제 시간이 지났어요.' },
  '12': { vi: 'Thẻ hoặc tài khoản đang bị khóa.', en: 'The card or account is locked.', ko: '카드나 계좌가 잠겨 있어요.' },
  '13': { vi: 'Nhập sai mã OTP.', en: 'The OTP code was wrong.', ko: 'OTP 번호가 틀렸어요.' },
  '24': { vi: 'Bạn đã hủy trả tiền trên trang VNPay.', en: 'You cancelled the payment on the VNPay page.', ko: 'VNPay 페이지에서 결제를 취소하셨어요.' },
  '51': { vi: 'Tài khoản không đủ số dư.', en: 'The account does not have enough balance.', ko: '계좌 잔액이 부족해요.' },
  '65': { vi: 'Tài khoản đã vượt hạn mức giao dịch trong ngày.', en: 'The account has reached its daily limit.', ko: '계좌의 하루 거래 한도를 넘었어요.' },
  '75': { vi: 'Ngân hàng đang bảo trì.', en: 'The bank is under maintenance.', ko: '은행이 점검 중이에요.' },
  '79': { vi: 'Nhập sai mật khẩu thanh toán quá số lần cho phép.', en: 'The payment password was entered wrongly too many times.',
          ko: '결제 비밀번호를 허용된 횟수보다 많이 틀렸어요.' },
};

/** Câu cho mã phản hồi; mã lạ → câu chung. */
export function cauMaPhanHoi(maPhanHoi: string, nn: NgonNgu): string {
  return CAU_MA_PHAN_HOI[maPhanHoi]?.[nn] ?? {
    vi: 'VNPay chưa nhận được tiền cho lần này.',
    en: 'VNPay did not take the payment this time.',
    ko: '이번에는 VNPay 결제가 완료되지 않았어요.',
  }[nn];
}
