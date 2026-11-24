/**
 * HSTS — bảo trình duyệt chỉ dùng HTTPS với beeftown.vn
 * =====================================================
 * Header `Strict-Transport-Security: max-age=31536000` (một năm) trên mọi trả lời của Worker (src/worker.ts:
 * trang dựng ở máy chủ, hook, trang /noi-bo, 404) và, qua web/public/_headers, trên file tĩnh — Cloudflare phát file
 * tĩnh thẳng từ lớp assets, không chạy Worker, nên `_headers` không phủ trả lời của Worker và ngược lại: hai nơi,
 * cùng một giá trị. Cloudflare "Always Use HTTPS" đã bật từ 25/09; HSTS làm cho trình duyệt nhớ điều đó và không còn
 * lần gõ http:// nào đi qua mạng.
 *
 * CỐ Ý KHÔNG có `includeSubDomains` và `preload`: includeSubDomains buộc MỌI tên miền con (mail của VinaHost và bất
 * kỳ tên miền con nào Khánh dựng sau này) phải có HTTPS hợp lệ trong một năm, preload đưa tên miền vào danh sách
 * cài sẵn trong trình duyệt và gần như không gỡ được. Thêm khi đã kiểm từng tên miền con. Trình duyệt bỏ qua header
 * này khi trang mở bằng http:// (chạy cục bộ không bị ảnh hưởng).
 */

export const HSTS = 'max-age=31536000';

/**
 * Gắn HSTS vào một trả lời. Trả lời có sẵn header đó (không phải của mình) thì giữ nguyên. Trả lời của
 * Response.redirect hay của fetch chuyển tiếp có header chỉ-đọc: header.set ném lỗi, thì dựng bản sao cùng thân,
 * cùng mã, cùng header (không đọc thân — luồng không bị cắt).
 */
export function datHsts(kq: Response): Response {
  if (kq.headers.has('strict-transport-security')) return kq;
  try {
    kq.headers.set('Strict-Transport-Security', HSTS);
    return kq;
  } catch {
    const ban = new Response(kq.body, kq);
    ban.headers.set('Strict-Transport-Security', HSTS);
    return ban;
  }
}

/**
 * HEADER BẢO VỆ CHO TRANG CÔNG KHAI (rà soát SEO 23/11/2026 — mức "trung bình": chỉ có HSTS)
 * ==========================================================================================
 * Cùng một bộ, cùng giá trị, ở hai nơi như HSTS: Worker (src/worker.ts → datHeaderBaoVe, cho trang, hook, /noi-bo, 404)
 * và web/public/_headers (file tĩnh do lớp assets phát). Đổi một nơi thì đổi nơi kia — crm/test/test-cong-khai-header-bao-ve.mjs
 * đọc cả hai và bắt lệch.
 *
 *   · X-Content-Type-Options: nosniff — trình duyệt không tự đoán lại kiểu file (một file ảnh/văn bản không thành script).
 *   · Referrer-Policy: strict-origin-when-cross-origin — trang khác chỉ thấy tên miền của ta, không thấy đường dẫn đầy đủ
 *     (đường dẫn có thể mang ?vi_tri=… hay mã đơn). Cũng là mặc định của trình duyệt mới; ghi ra để mọi trình duyệt như nhau.
 *   · X-Frame-Options: SAMEORIGIN — chỉ trang của chính beeftown.vn được nhúng trang của ta. Không trang nào của repo nhúng
 *     trang công khai khác (grep "<iframe": chỉ có khung YouTube ở /noi-bo/dao-tao, là ta nhúng người ta). /noi-bo đã tự đặt
 *     DENY ở middleware (lib/header-noi-bo.ts) — datHeaderBaoVe KHÔNG ghi đè header đã có, nên DENY còn nguyên.
 *   · Permissions-Policy — tắt những tính năng trình duyệt mà web này KHÔNG BAO GIỜ dùng: định vị (geolocation), micro
 *     (microphone), Payment Request API (payment — VNPay chỉ là chuyển hướng cả trang, không dùng API này), USB (usb).
 *     GIỮ camera=(self): màn quét mã vạch của kho (components/kho/QuetMa.astro) gọi getUserMedia. KHÔNG đụng accelerometer,
 *     gyroscope, encrypted-media, picture-in-picture, clipboard-write, web-share, fullscreen: khung YouTube ở
 *     /noi-bo/dao-tao xin chúng bằng allow="…", mà header chỉ cho phép ủy quyền những thứ nó không tắt; navigator.clipboard
 *     (LenTang3.astro) và navigator.share (public/kho/js/in-an.js) cũng cần. Thêm một tính năng vào danh sách tắt: grep mã
 *     trước (geolocation, getUserMedia, PaymentRequest, <iframe allow=…, navigator.*).
 *
 * CỐ Ý CHƯA CÓ Content-Security-Policy: Meta Pixel, VNPay, YouTube, Supabase, script nội tuyến của Astro — một CSP sai là
 * trang hỏng, phải đo ở chế độ chỉ báo (Report-Only) trước; việc của một PR riêng. HSTS giữ nguyên, không đổi (xem trên).
 */
export const HEADER_BAO_VE = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(), payment=(), usb=()',
} as const;

/**
 * Gắn bốn header bảo vệ vào một trả lời. Header đã có thì GIỮ NGUYÊN (/noi-bo tự đặt X-Frame-Options: DENY; một trả lời
 * có chủ ý đặt khác thì thắng). Header chỉ-đọc (Response.redirect, fetch chuyển tiếp) thì dựng bản sao cùng thân như datHsts.
 */
export function datHeaderBaoVe(kq: Response): Response {
  const thieu = Object.entries(HEADER_BAO_VE).filter(([ten]) => !kq.headers.has(ten));
  if (thieu.length === 0) return kq;
  try {
    for (const [ten, giaTri] of thieu) kq.headers.set(ten, giaTri);
    return kq;
  } catch {
    const ban = new Response(kq.body, kq);
    for (const [ten, giaTri] of thieu) ban.headers.set(ten, giaTri);
    return ban;
  }
}
