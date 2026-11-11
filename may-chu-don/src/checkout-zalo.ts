/**
 * CHECKOUT SDK CỦA ZALO — KHÁCH TRẢ TIỀN QUA VNPAY TRONG MINI APP, phần thuần (không database, không mạng)
 * ========================================================================================================
 *
 * Khánh 11/11/2026: chuyển sang cổng thanh toán VNPay (VNPAY-QR PGW, môi trường TEST, Terminal Code SLKGTE22 của Công
 * ty TNHH SLK Group). Zalo bắt mọi Mini App có thanh toán phải đi qua Checkout SDK, và Checkout SDK có sẵn VNPay — nên
 * VNPay nối qua Zalo, không nối thẳng từ máy chủ đơn:
 *
 *   1. Mini App xin máy chủ tham số trả tiền của đơn (GET /api/don/:ma → thanhToan.taoDon): số tiền, mô tả, món,
 *      extradata {"maDon": …}, phương thức (VNPAY_SANDBOX / VNPAY) và MAC — máy chủ ký bằng Private key của Checkout
 *      SDK, khóa không bao giờ xuống Mini App. Mini App gọi CheckoutSDK.createOrder với đúng các tham số đó (sửa một
 *      chữ là MAC sai, Zalo từ chối).
 *   2. Zalo mở trang thanh toán VNPay. VNPay gửi IPN về Zalo (https://payment-mini.zalo.me/api/transaction/{Mini App
 *      ID}/vnp-ipn — Khánh khai với VNPay), Zalo kiểm checksum của VNPay bằng Secret Key (vnp_HashSecret) Khánh nhập
 *      ở Mini App Center. Máy chủ đơn không giữ vnp_HashSecret.
 *   3. Zalo POST kết quả về Callback URL (POST /zalo/thanh-toan) kèm mac và overallMac (HMAC-SHA256 bằng Private key).
 *      Máy chủ kiểm cả hai, kiểm Mini App ID, rồi SoDon.ghiThanhToanZalo ghi đúng một lần theo orderId của Zalo.
 *
 * Nguồn: docs.zaloplatforms.com/docs/MA/checkoutSdk, đọc 11/11/2026 (trang ghi cập nhật 9/11/2026) — intro (bắt buộc
 * Checkout SDK), integration-process/overview/setting (Callback URL, Private key, cấu hình VNPay, địa chỉ IPN),
 * method (VNPAY, VNPAY_SANDBOX: chỉ Admin / Developer / người thử thấy), apis/createOrder (MAC: khóa xếp a→z, giá trị
 * object JSON.stringify, extradata và method là chuỗi JSON; bắt buộc MAC từ ZMP SDK 2.45.0), webhooks/callback (chuỗi
 * mac, overallMac, IP 118.102.2.29 và 49.213.78.2, returnCode 1 / 2 / khác), webhooks/VNPayIPNProcessingNotification.
 *
 * Giả định chưa thử được với Zalo thật (README, "Cài VNPay qua Checkout SDK" — Khánh thử ở môi trường thử):
 *   · amount, resultCode trong callback là số (tài liệu: Long, Int); appId, orderId, transId là chuỗi. Chuỗi ký dùng
 *     đúng giá trị nhận được như mẫu NodeJS của Zalo (`${giá trị}`), nên số hay chuỗi đều ra cùng chuỗi Zalo ký.
 *   · returnCode khác 1 và 2 thì Zalo KHÔNG gửi lại. Sau 20 phút không có callback, tài liệu bảo gọi getOrderStatus —
 *     chưa làm (việc tiếp): đơn đã mở trang VNPay quá 20 phút chưa có kết quả hiện ở số liệu sức khỏe.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const PHUONG_THUC_CHECKOUT = ['VNPAY_SANDBOX', 'VNPAY'] as const;
export type PhuongThucCheckout = (typeof PHUONG_THUC_CHECKOUT)[number];

/** Máy chủ Checkout SDK gọi Callback URL từ hai IP này (tài liệu callback: "Đối tác cần whitelist") — Caddyfile.mau chặn IP khác. */
export const IP_CHECKOUT_ZALO = ['118.102.2.29', '49.213.78.2'] as const;

/** Địa chỉ IPN khai với VNPay cho Terminal của quán: VNPay báo Zalo, Zalo báo máy chủ đơn. */
export const diaChiIpnVnpay = (maMiniApp: string) => `https://payment-mini.zalo.me/api/transaction/${maMiniApp}/vnp-ipn`;

/** Phương thức sandbox: tiền thử của VNPay, không phải tiền thật. */
export const laThuNghiem = (p: string) => p.endsWith('_SANDBOX');

export interface CauHinhCheckout {
  /** Mini App ID (Beeftown: 2858300068641327950) — callback mang appId khác thì từ chối. */
  maMiniApp: string;
  /** Private key ở Mini App Center → Checkout SDK → Cấu hình chung. Không bao giờ ghi ra nhật ký, không xuống Mini App. */
  khoaRieng: string;
  phuongThuc: PhuongThucCheckout;
}

/**
 * Cấu hình từ biến môi trường. ZALO_MINI_APP_ID, ZALO_CHECKOUT_KHOA_RIENG, ZALO_CHECKOUT_PHUONG_THUC: đủ cả ba hoặc
 * không biến nào (chưa trả qua VNPay). Thiếu một biến là gõ sai — không mở máy chủ với cấu hình nửa vời.
 */
export function docCauHinhCheckout(env: Record<string, string | undefined>):
  { ok: true; cauHinh: CauHinhCheckout | null } | { ok: false; loi: string } {
  const g = (k: string) => (env[k] ?? '').trim();
  const maMiniApp = g('ZALO_MINI_APP_ID'), khoaRieng = g('ZALO_CHECKOUT_KHOA_RIENG'), phuongThuc = g('ZALO_CHECKOUT_PHUONG_THUC');
  if (!maMiniApp && !khoaRieng && !phuongThuc) return { ok: true, cauHinh: null };
  if (!maMiniApp || !khoaRieng || !phuongThuc) {
    return { ok: false, loi: 'Trả qua VNPay cần đủ ba biến: ZALO_MINI_APP_ID, ZALO_CHECKOUT_KHOA_RIENG, ZALO_CHECKOUT_PHUONG_THUC (hoặc xóa cả ba).' };
  }
  if (!/^\d{6,25}$/.test(maMiniApp)) return { ok: false, loi: 'ZALO_MINI_APP_ID phải là dãy số (Mini App ID của Beeftown: 2858300068641327950).' };
  if (khoaRieng.length < 16 || /\s/.test(khoaRieng)) {
    return { ok: false, loi: 'ZALO_CHECKOUT_KHOA_RIENG phải là Private key chép nguyên ở Mini App Center → Checkout SDK → Cấu hình chung (ít nhất 16 ký tự, không dấu cách).' };
  }
  if (!(PHUONG_THUC_CHECKOUT as readonly string[]).includes(phuongThuc)) {
    return { ok: false, loi: 'ZALO_CHECKOUT_PHUONG_THUC chỉ nhận VNPAY_SANDBOX (môi trường thử) hoặc VNPAY (tiền thật).' };
  }
  return { ok: true, cauHinh: { maMiniApp, khoaRieng, phuongThuc: phuongThuc as PhuongThucCheckout } };
}

export const macHmac = (khoa: string, chuoi: string) => createHmac('sha256', khoa).update(chuoi, 'utf8').digest('hex');

/** So hai MAC hex, không lộ thời gian; hoa thường như nhau. */
function bangMac(dung: string, gui: unknown): boolean {
  if (typeof gui !== 'string') return false;
  const a = Buffer.from(dung.toLowerCase()), b = Buffer.from(gui.trim().toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface MonCheckout { id: string; amount: number }

/** Đúng các tham số Mini App truyền vào CheckoutSDK.createOrder — không đổi gì, kể cả thứ tự khóa trong item. */
export interface ThamSoTaoDon {
  amount: number;
  desc: string;
  item: MonCheckout[];
  /** Chuỗi JSON {"maDon": …}: callback trả lại (đã encodeURIComponent) để máy chủ biết tiền của đơn nào. */
  extradata: string;
  /** Chuỗi JSON {"id": phương thức, "isCustom": false}: Zalo mở thẳng VNPay, khách không chọn được phương thức khác. */
  method: string;
  mac: string;
}

/** Chuỗi ký của createOrder (tài liệu createOrder, "Cách tạo mac tại Merchant Server"). */
export function chuoiKyTaoDon(t: Omit<ThamSoTaoDon, 'mac'>): string {
  const tham: Record<string, unknown> = { amount: t.amount, desc: t.desc, extradata: t.extradata, item: t.item, method: t.method };
  return Object.keys(tham).sort()
    .map(k => `${k}=${typeof tham[k] === 'object' ? JSON.stringify(tham[k]) : tham[k]}`).join('&');
}

/** Mô tả giao dịch: không dấu, không ký tự đặc biệt — Zalo chuyển sang VNPay làm nội dung thanh toán. */
export const moTaThanhToan = (maDon: string) => `Beeftown don ${maDon}`;

/**
 * Tham số trả `soTien` cho một đơn. Trả đủ đơn: mỗi phần thịt một món (id mã phần thịt, amount tiền của phần đó). Còn
 * thiếu một phần (đã có tiền chuyển khoản trước khi đổi sang VNPay): một món "con-thieu" bằng đúng phần còn thiếu, để
 * tổng món luôn bằng số tiền.
 */
export function thamSoTaoDon(don: { ma: string; tongTien: number; dong: { maPhan: string; soKhay: number; giaMoiKhay: number }[] },
  soTien: number, ch: CauHinhCheckout): ThamSoTaoDon {
  if (!Number.isSafeInteger(soTien) || soTien <= 0) throw new Error('Số tiền trả qua VNPay phải là số nguyên dương');
  const theoPhan = don.dong.map(d => ({ id: d.maPhan, amount: d.soKhay * d.giaMoiKhay }));
  const tongPhan = theoPhan.reduce((s, m) => s + m.amount, 0);
  const item = soTien === don.tongTien && tongPhan === soTien ? theoPhan : [{ id: 'con-thieu', amount: soTien }];
  const t = {
    amount: soTien, desc: moTaThanhToan(don.ma), item,
    extradata: JSON.stringify({ maDon: don.ma }), method: JSON.stringify({ id: ch.phuongThuc, isCustom: false }),
  };
  return { ...t, mac: macHmac(ch.khoaRieng, chuoiKyTaoDon(t)) };
}

/** Một kết quả thanh toán Zalo báo, đã kiểm mac, overallMac và Mini App ID. */
export interface TinCheckout {
  /** orderId của Checkout SDK — mỗi lần khách bấm trả tiền một mã; khóa chống ghi hai lần. */
  maZalo: string;
  /** transId — mã giao dịch phía VNPay (quầy tra cứu khi cần hoàn tiền). */
  maGiaoDich: string;
  /** Mã đơn đọc từ extradata, hoặc null khi extradata không ra mã đơn hợp lệ. */
  maDon: string | null;
  soTien: number;
  /** resultCode 1: đã trừ tiền khách. -1: thất bại. */
  thanhCong: boolean;
  phuongThuc: string;
  /** transTime (ms) của VNPay, hoặc null. */
  luc: number | null;
}

const CHU_MA_DON = /^[ACDEFGHJKMNPQRTUVWXY34679]{8}$/;

function maDonTuExtradata(v: unknown): string | null {
  if (typeof v !== 'string' || !v || v.length > 2000) return null;
  for (const chu of [v, (() => { try { return decodeURIComponent(v); } catch { return ''; } })()]) {
    try {
      const ma = (JSON.parse(chu) as { maDon?: unknown } | null)?.maDon;
      if (typeof ma === 'string' && CHU_MA_DON.test(ma)) return ma;
    } catch { /* thử cách đọc kia */ }
  }
  return null;
}

/** Số nguyên từ số hay chuỗi chữ số ("-1", "10000"), hoặc null. */
function soNguyen(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^-?\d{1,15}$/.test(v) ? Number(v) : NaN;
  return Number.isSafeInteger(n) ? n : null;
}

const laChuHaySo = (v: unknown) => (typeof v === 'string' && v.length > 0 && v.length <= 64) || (typeof v === 'number' && Number.isSafeInteger(v));

/**
 * Thân JSON callback của Checkout SDK → TinCheckout. Không bao giờ ném lỗi. sai_dang: thiếu trường, sai kiểu.
 * sai_mac: mac hay overallMac không khớp (thân bị sửa, hay không phải Zalo). sai_mini_app: ký đúng mà của Mini App khác.
 */
export function docCallback(than: unknown, ch: CauHinhCheckout):
  { ok: true; tin: TinCheckout } | { ok: false; lyDo: 'sai_dang' | 'sai_mac' | 'sai_mini_app' } {
  if (!than || typeof than !== 'object' || Array.isArray(than)) return { ok: false, lyDo: 'sai_dang' };
  const b = than as Record<string, unknown>;
  const d = b.data as Record<string, unknown> | undefined;
  if (!d || typeof d !== 'object' || Array.isArray(d)) return { ok: false, lyDo: 'sai_dang' };
  if (!laChuHaySo(d.appId) || !laChuHaySo(d.orderId)) return { ok: false, lyDo: 'sai_dang' };
  // Tài liệu ghi amount Long, resultCode Int; nhận cả chuỗi chữ số cho chắc (chuỗi ký vẫn dùng đúng giá trị nhận được).
  const soTien = soNguyen(d.amount), maKetQua = soNguyen(d.resultCode);
  if (soTien === null || soTien < 0 || maKetQua === null) return { ok: false, lyDo: 'sai_dang' };
  if (typeof b.mac !== 'string' || typeof b.overallMac !== 'string') return { ok: false, lyDo: 'sai_mac' };
  const chuoiMac = `appId=${d.appId}&amount=${d.amount}&description=${d.description}&orderId=${d.orderId}`
    + `&message=${d.message}&resultCode=${d.resultCode}&transId=${d.transId}`;
  const chuoiToanBo = Object.keys(d).sort().map(k => `${k}=${d[k]}`).join('&');
  // Kiểm cả hai: mac không phủ extradata (mã đơn) và method — chỉ overallMac phủ.
  if (!bangMac(macHmac(ch.khoaRieng, chuoiMac), b.mac) || !bangMac(macHmac(ch.khoaRieng, chuoiToanBo), b.overallMac)) {
    return { ok: false, lyDo: 'sai_mac' };
  }
  if (String(d.appId) !== ch.maMiniApp) return { ok: false, lyDo: 'sai_mini_app' };
  // Không có method lẫn paymentChannel: giao dịch vẫn là của createOrder máy chủ đã ký (overallMac đúng) — phương thức
  // là phương thức máy chủ đang ký, không phải "lệch phương thức".
  const phuongThuc = typeof d.method === 'string' && d.method ? d.method
    : typeof d.paymentChannel === 'string' && d.paymentChannel ? d.paymentChannel : ch.phuongThuc;
  const luc = typeof d.transTime === 'number' ? d.transTime : typeof d.transTime === 'string' && /^\d{10,16}$/.test(d.transTime) ? Number(d.transTime) : null;
  return {
    ok: true,
    tin: {
      maZalo: String(d.orderId), maGiaoDich: d.transId === undefined || d.transId === null ? '' : String(d.transId).slice(0, 64),
      maDon: maDonTuExtradata(d.extradata), soTien, thanhCong: maKetQua === 1, phuongThuc: phuongThuc.slice(0, 40),
      luc: luc !== null && Number.isSafeInteger(luc) && luc > 0 ? luc : null,
    },
  };
}

/**
 * Đọc thân callback mà giữ nguyên chữ số của appId, orderId, transId: Mini App ID của Beeftown có 19 chữ số, quá số
 * nguyên an toàn của JavaScript — Zalo gửi dạng số thì JSON.parse làm tròn và chuỗi ký không còn khớp chuỗi Zalo ký.
 * Không phải JSON: ném lỗi như JSON.parse.
 */
export function docThanCallback(thanGoc: string): unknown {
  return JSON.parse(thanGoc.replace(/("(?:appId|orderId|transId)"\s*:\s*)(-?\d{16,})(?=\s*[,}])/g, '$1"$2"'));
}

/** Thân trả Zalo: 1 đã ghi, 2 đã ghi từ trước (trùng giao dịch), khác: chưa ghi (Zalo không gửi lại). */
export const traCheckout = (returnCode: number, returnMessage: string) => JSON.stringify({ returnCode, returnMessage });

/**
 * Webhook "VNPay IPN processing notification" (chỉ sandbox): Zalo chuyển tiếp IPN VNPay gửi và câu Zalo trả, để quán
 * điền hồ sơ kiểm thử (SIT) của VNPay. Webhook này không có MAC — chỉ ghi nhật ký, KHÔNG BAO GIỜ đổi đơn. Một dòng
 * chữ cho nhật ký, chỉ các trường của bảng kiểm thử (bỏ checksum, nội dung đơn); thân lạ thì null.
 */
export function dongNhatKyIpnVnpay(than: unknown): string | null {
  if (!than || typeof than !== 'object' || Array.isArray(than)) return null;
  const b = than as Record<string, unknown>;
  const tra = (b.ipnResponseData ?? {}) as Record<string, unknown>, nhan = (b.ipnReceivedData ?? {}) as Record<string, unknown>;
  if (typeof tra !== 'object' || typeof nhan !== 'object') return null;
  const g = (o: Record<string, unknown>, k: string) => {
    const v = o[k];
    return typeof v === 'string' || typeof v === 'number' ? String(v).replace(/[^\w.:+-]/g, '').slice(0, 40) : '-';
  };
  const truong = ['vnp_TxnRef', 'vnp_Amount', 'vnp_ResponseCode', 'vnp_TransactionStatus', 'vnp_TransactionNo', 'vnp_BankCode',
    'vnp_CardType', 'vnp_PayDate', 'vnp_TmnCode'].map(k => `${k}=${g(nhan, k)}`).join(' ');
  return `VNPay IPN (sandbox): Zalo trả RspCode=${g(tra, 'RspCode')} · ${truong} · ip=${g(b, 'ipnRequestIP')}`;
}
