/**
 * HEADER BẢO VỆ CHO MỌI TRẢ LỜI CỦA /noi-bo (rà soát bảo mật 14/11/2026)
 * =====================================================================
 *
 * Trang nội bộ chứa danh sách khách, công nợ, hồ sơ ứng viên. middleware.ts — chỗ duy nhất canh /noi-bo — gọi hàm
 * này cho MỌI lối ra của nó, nên trang mới tự được bảo vệ. Trang công khai không đi qua đây.
 *
 *   · KHÔNG CHO TRANG KHÁC NHÚNG VÀO KHUNG. Một trang lạ nhúng /noi-bo vào khung ẩn rồi lừa người đang đăng nhập
 *     bấm vào nút họ không nhìn thấy (clickjacking).
 *       → Content-Security-Policy: thêm MỘT CHÍNH SÁCH RIÊNG "frame-ancestors 'none'". Trình duyệt chỉ cho nhúng
 *         khi MỌI chính sách cho phép, nên chính sách này luôn thắng — kể cả khi trang tự đặt CSP lỏng hơn. Không
 *         sửa chính sách của trang: trong một chính sách luật trùng tên đứng trước mới có hiệu lực, và hai header
 *         CSP ra khỏi Headers.get() thành một chuỗi cách nhau bằng dấu phẩy — vá vào giữa rất dễ sai.
 *       → X-Frame-Options: DENY (trình duyệt cũ chưa hiểu frame-ancestors).
 *   · KHÔNG VÀO BỘ ĐỆM DÙNG CHUNG. Trang của một người đăng nhập không được nằm ở proxy hay CDN.
 *       → Cache-Control: private khi trang chưa tự đặt; trang lỡ đặt "public" / "s-maxage" thì bỏ hai thứ đó và
 *         thêm private. Trang đã có private hoặc no-store thì giữ nguyên văn.
 *
 * KHÔNG ép "no-store" cho cả khu — cố ý. Trang "hệ thống đang bận" (lib/qua-tai.ts) bảo người vừa gửi form hỏng
 * "bấm nút Quay lại của trình duyệt rồi gửi lại". Thử trong Chromium 14/11/2026: không có no-store thì bấm Quay
 * lại hiện lại đúng form với chữ đang gõ, không hỏi máy chủ; có no-store thì trình duyệt xin lại trang từ máy chủ
 * đang bận, nhận trang "đang bận", form biến mất. Việc "người đến sau không thấy trang của người trước" làm ở đúng
 * lúc cần: Đăng xuất gửi Clear-Site-Data: "cache" (pages/noi-bo/dang-xuat.ts), và chế độ máy dùng chung tự đặt
 * no-store cho từng trang (lib/kho/may-chung.ts).
 *
 * Hàm thuần — kiểm ở crm/test/test-noi-bo-header-bao-ve.mjs; trên bản build thật: kiem-tra/trinh-duyet.mjs nhóm 4.
 */

const CHONG_NHUNG = "frame-ancestors 'none'";

/** Một trong các chính sách CSP đang có đã cấm hẳn việc nhúng chưa (luật frame-ancestors đầu tiên của nó là 'none'). */
function daCamNhung(csp: string | null): boolean {
  return (csp ?? '').split(',').some(chinhSach => {
    const luat = chinhSach.split(';').map(l => l.trim()).find(l => /^frame-ancestors(\s|$)/i.test(l));
    return luat !== undefined && /^frame-ancestors\s+'none'$/i.test(luat);
  });
}

function ganHeader(dau: Headers): void {
  const dem = dau.get('cache-control');
  if (!dem) {
    dau.set('cache-control', 'private');
  } else {
    const phan = dem.split(',').map(p => p.trim()).filter(Boolean);
    if (!phan.some(p => /^(private|no-store)$/i.test(p))) {
      dau.set('cache-control', ['private', ...phan.filter(p => !/^(public|s-maxage=.*)$/i.test(p))].join(', '));
    }
  }

  if (!daCamNhung(dau.get('content-security-policy'))) dau.append('content-security-policy', CHONG_NHUNG);
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
