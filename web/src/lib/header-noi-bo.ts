/**
 * HEADER BẢO VỆ CHO MỌI TRẢ LỜI CỦA /noi-bo (rà soát bảo mật 14/11/2026)
 * =====================================================================
 *
 * Trang nội bộ chứa danh sách khách, công nợ, hồ sơ ứng viên. Hai việc trình duyệt làm mặc định mà ở đây
 * không được làm:
 *
 *   · GIỮ BẢN SAO. Không có Cache-Control thì trình duyệt được phép cất trang: trên máy dùng chung, người
 *     đến sau bấm nút Quay lại là thấy trang của người trước, dù người đó đã đăng xuất.
 *       → Cache-Control: no-store
 *   · CHO TRANG KHÁC NHÚNG VÀO KHUNG. Một trang lạ nhúng /noi-bo vào khung ẩn rồi lừa người đang đăng nhập bấm
 *     vào nút họ không nhìn thấy (clickjacking).
 *       → Content-Security-Policy: frame-ancestors 'none'
 *       → X-Frame-Options: DENY          (trình duyệt cũ chưa hiểu frame-ancestors)
 *
 * middleware.ts — chỗ duy nhất canh /noi-bo — gọi hàm này cho MỌI lối ra của nó, nên trang mới tự được bảo vệ.
 * Trang công khai không đi qua đây.
 *
 * Chỉ siết, không nới: trang đã đặt Cache-Control có no-store (ví dụ "private, no-store" của file tải về) thì
 * giữ nguyên văn; đặt thứ gì lỏng hơn thì bị ép về no-store. Content-Security-Policy riêng của trang được giữ,
 * riêng luật frame-ancestors luôn là 'none'.
 *
 * Hàm thuần — kiểm ở crm/test/test-noi-bo-header-bao-ve.mjs; trên bản build thật: kiem-tra/trinh-duyet.mjs nhóm 4.
 */

const CHONG_NHUNG = "frame-ancestors 'none'";

function ganHeader(dau: Headers): void {
  if (!/(^|,)\s*no-store\b/i.test(dau.get('cache-control') ?? '')) dau.set('cache-control', 'no-store');

  const luatCu = (dau.get('content-security-policy') ?? '')
    .split(';').map(l => l.trim()).filter(l => l && !/^frame-ancestors\b/i.test(l));
  dau.set('content-security-policy', [...luatCu, CHONG_NHUNG].join('; '));

  dau.set('x-frame-options', 'DENY');
}

export function datHeaderNoiBo(traLoi: Response): Response {
  try {
    ganHeader(traLoi.headers);
    return traLoi;
  } catch {
    // Header bị khóa (Response.redirect, trả lời lấy thẳng từ fetch): dựng lại với cùng thân, mã và header.
    const dau = new Headers(traLoi.headers);
    ganHeader(dau);
    return new Response(traLoi.body, { status: traLoi.status, statusText: traLoi.statusText, headers: dau });
  }
}
