/**
 * DẤU GẠCH CUỐI ĐƯỜNG DẪN — 301 về bản không gạch (rà soát SEO 23/11/2026)
 * =====================================================================
 * Trước đây /thuc-don/ và /en/ trả 200 như /thuc-don và /en (trang tự khai canonical bản không gạch). Google coi đó là
 * hai địa chỉ; một lượt 301 gọn hơn canonical và giữ mọi link cũ chảy về một URL.
 *
 * Chỉ ở lối vào Worker (src/worker.ts), TRƯỚC Astro, nên không đụng /noi-bo (middleware.ts đã tự bỏ gạch cuối khi so
 * đường dẫn) và không đụng /hook/* (webhook iPOS, Messenger, VNPay: máy gọi chỉ biết một địa chỉ, và 301 làm POST thành GET).
 *   · Chỉ GET và HEAD. POST tới /dat-ban/ vẫn đi như cũ (form của ta luôn gửi tới đường dẫn không gạch).
 *   · Giữ nguyên query string. Gạch dư ("/thuc-don//") gom hết về một.
 *   · Location là URL ĐẦY ĐỦ dựng từ origin của chính request — không bao giờ bắt đầu bằng "//", nên đường dẫn
 *     "//kẻ-lạ.com/" không thành chuyển hướng ra ngoài (open redirect).
 *   · Trang chủ "/" không đổi.
 * Hàm thuần — kiểm ở crm/test/test-cong-khai-trailing-slash.mjs.
 */

/** Đường dẫn của Worker mà máy hoặc /noi-bo tự xử lý: không bao giờ đổi. */
function duongKhongDong(duong: string): boolean {
  return duong === '/hook' || duong.startsWith('/hook/') || duong === '/noi-bo' || duong.startsWith('/noi-bo/');
}

/** 301 về bản không gạch cuối, hoặc null nếu request này không cần chuyển. */
export function chuyenHuongDauGach(request: Request): Response | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const url = new URL(request.url);
  if (url.pathname.length <= 1 || !url.pathname.endsWith('/')) return null;
  if (duongKhongDong(url.pathname)) return null;
  const khongGach = url.pathname.replace(/\/+$/, '');
  if (!khongGach) return null;
  return new Response(null, { status: 301, headers: { Location: `${url.origin}${khongGach}${url.search}` } });
}
