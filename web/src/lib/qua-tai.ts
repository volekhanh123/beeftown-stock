/**
 * SUPABASE BẬN KHÔNG PHẢI LÀ HẾT PHIÊN
 * ====================================
 *
 * Đăng nhập, gia hạn phiên mỗi giờ và mở máy tính bảng bằng PIN đều đi qua
 * MỘT cửa của Supabase Auth (/auth/v1/token). Cửa đó có hạn mức theo địa chỉ
 * IP: mặc định dồn được 30 lượt, rồi mỗi 2 giây thêm một lượt (150 lượt / 5
 * phút). Worker gọi Supabase từ máy chủ Cloudflare, nên với Supabase cả quán
 * là MỘT địa chỉ — đầu ca vài chục người mở máy cùng lúc là chạm trần.
 *
 * Bị từ chối vì bận (429), vì Supabase trục trặc (5xx) hay vì mất mạng thì
 * token VẪN CÒN NGUYÊN: Supabase từ chối trước khi đụng tới nó. Bản trước coi
 * mọi lỗi là "hết phiên": xóa cookie, xóa đăng nhập đã cất trên máy tính bảng,
 * bắt quản lý đăng ký lại máy giữa ca — và báo "sai mật khẩu" cho người gõ
 * đúng mật khẩu, nên họ gõ lại liên tục và càng nghẽn. File này tách hai loại:
 *
 *   tạm thời   qua_tai      429 — quá hạn mức
 *              mat_ket_noi  mất mạng, 5xx, trả lời không đọc được
 *              → GIỮ token, báo "đợi vài giây rồi thử lại".
 *   từ chối    tu_choi      4xx còn lại — token hết hạn / bị thu hồi, sai mật khẩu
 *              → như cũ: đăng xuất, báo sai mật khẩu.
 *
 * Không nhập lớp lỗi của supabase-js: chỉ đọc name / status / code, để file
 * chạy thẳng được trong kiểm thử Node (crm/test/test-qua-tai.mjs).
 *
 * Nâng hạn mức ở Supabase (Authentication → Rate Limits) là việc của người
 * quản trị — xem README, mục "Hạ tầng cho 100 người dùng cùng lúc".
 */

import type { HaiThuTieng, NgonNguNB } from './ngon-ngu-noi-bo';

export type LoaiLoiAuth = 'qua_tai' | 'mat_ket_noi' | 'tu_choi';

/**
 * layPhien() trả giá trị này khi không kiểm được phiên vì Supabase bận hoặc
 * mất mạng. Cookie còn nguyên; middleware trả trangQuaTai() thay vì đá người
 * dùng ra trang đăng nhập.
 */
export const QUA_TAI = 'qua_tai' as const;

/** Lỗi của supabase-js (auth) → loại lỗi. Hàm thuần. */
export function phanLoaiLoiAuth(e: unknown): LoaiLoiAuth {
  if (!e || typeof e !== 'object') return 'mat_ket_noi';
  const { name, status, code } = e as { name?: unknown; status?: unknown; code?: unknown };
  if (status === 429 || code === 'over_request_rate_limit') return 'qua_tai';
  // AuthRetryableFetchError: mất mạng (status 0), 5xx, 52x của Cloudflare.
  // AuthUnknownError: trả lời không phải JSON — trang lỗi của proxy, không phải
  // câu trả lời của Supabase về token này.
  if (name === 'AuthRetryableFetchError' || name === 'AuthUnknownError') return 'mat_ket_noi';
  if (typeof status !== 'number' || status === 0 || status === 408 || status >= 500) return 'mat_ket_noi';
  return 'tu_choi';
}

/**
 * Ghi MỘT dòng nhật ký khi gặp lỗi tạm thời — để biết nhân viên chạm hạn mức
 * bao nhiêu lần (Cloudflare → Workers → beeftown → Logs, tìm "[qua-tai]").
 * Chỉ ghi chỗ xảy ra, loại lỗi và mã HTTP: không token, không email, không URL.
 */
export function ghiQuaTai(cho: string, e: unknown): void {
  const status = e && typeof e === 'object' ? (e as { status?: unknown }).status : undefined;
  const loai = typeof e === 'number' ? (e === 429 ? 'qua_tai' : 'mat_ket_noi') : phanLoaiLoiAuth(e);
  try {
    console.warn(`[qua-tai] ${cho}: ${loai}${typeof e === 'number' ? ` ${e}` : typeof status === 'number' ? ` ${status}` : ''}`);
  } catch { /* nhật ký hỏng không làm hỏng trang */ }
}

/** Mã HTTP của một lần gọi database (PostgREST) có phải lỗi tạm thời không. */
export function laTraLoiTamThoi(status: number | null | undefined): boolean {
  return typeof status !== 'number' || status === 0 || status === 408 || status === 429 || status >= 500;
}

/**
 * Câu cho người đang ĐĂNG NHẬP bằng email / mật khẩu (trang đăng nhập, gắn
 * người vào máy, đăng ký máy). Nhấn mạnh "không phải do sai mật khẩu" — để
 * người ta không gõ lại mật khẩu liên tục.
 *
 * lib/phien.ts trả nguyên văn câu `vi`; cau-noi-bo.ts lấy bản tiếng Anh ở đây.
 */
export const CAU_DANG_NHAP_TAM: Readonly<Record<Exclude<LoaiLoiAuth, 'tu_choi'>, HaiThuTieng>> = {
  qua_tai: {
    vi: 'Đang có nhiều người đăng nhập cùng lúc. Đợi khoảng một phút rồi thử lại — không phải do sai mật khẩu.',
    en: 'Many people are logging in at the same time. Wait about a minute, then try again — your password is not the problem.',
  },
  mat_ket_noi: {
    vi: 'Chưa kết nối được máy chủ đăng nhập. Đợi vài phút rồi thử lại — không phải do sai mật khẩu.',
    en: 'Could not reach the login server. Wait a few minutes, then try again — your password is not the problem.',
  },
};

/**
 * Câu lỗi của một lần gọi database có phải MẤT MẠNG / HẾT GIỜ không. supabase-js không ném mà trả error.message
 * của fetch, mỗi nơi chạy một kiểu: Node / Workers "TypeError: fetch failed", Bun (Beeftown Cân) "Unable to connect.
 * Is the computer able to access the url?", trình duyệt "Failed to fetch" / "NetworkError…" / Safari "Load failed",
 * DNS "getaddrinfo ENOTFOUND", hết giờ. Trước đây mỗi file chép một regex, sót Bun và DNS — người dùng thấy nguyên
 * câu tiếng Anh kỹ thuật thay vì "chưa chắc đã ghi".
 */
export function laLoiMang(m: string): boolean {
  return /fetch failed|failed to fetch|network|load failed|unable to connect|ENOTFOUND|EAI_AGAIN|ECONN|ETIMEDOUT|timeout|timed out/i.test(m);
}

/** Lần GHI mà mạng đứt giữa chừng: không biết database đã nhận hay chưa — nói đúng như thế. */
export const CAU_MAT_MANG_GHI: HaiThuTieng = {
  vi: 'Không kết nối được database. Chưa chắc đã ghi hay chưa — tải lại trang để kiểm tra.',
  en: 'Could not reach the database. It may or may not have been saved — reload the page to check.',
};

const CAU_TRANG = {
  tieuDe: { vi: 'Hệ thống đang bận', en: 'The system is busy' },
  lyDo: {
    vi: 'Máy chủ đăng nhập đang quá tải hoặc tạm mất kết nối.',
    en: 'The login server is overloaded or briefly unreachable.',
  },
  khongDangXuat: { vi: 'Bạn KHÔNG bị đăng xuất.', en: 'You have NOT been logged out.' },
  tuTaiLai: { vi: 'Trang sẽ tự tải lại sau vài giây.', en: 'This page reloads itself in a few seconds.' },
  chuaGhi: { vi: 'Thao tác vừa gửi CHƯA được ghi.', en: 'What you just sent was NOT saved.' },
  guiLai: {
    vi: 'Đợi vài giây, bấm nút Quay lại của trình duyệt rồi gửi lại.',
    en: 'Wait a few seconds, press the browser Back button, then send it again.',
  },
  taiLai: { vi: 'Tải lại trang', en: 'Reload the page' },
  keoDai: {
    vi: 'Nếu vẫn thế sau vài phút, báo quản lý.',
    en: 'If this still happens after a few minutes, tell a manager.',
  },
} satisfies Record<string, HaiThuTieng>;

function thoatHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Trang 503 "hệ thống đang bận". GET: tự tải lại sau 5–10 giây — NGẪU NHIÊN,
 * để mấy chục máy gặp bận cùng lúc không thử lại cùng một giây (đúng lúc hạn
 * mức đang cạn). POST: nói thẳng thao tác CHƯA được ghi (trang chưa chạy) —
 * không tự gửi lại gì.
 *
 * Không dùng khung NoiBo: trang này phải hiện được cả khi chính việc dựng
 * trang đang là thứ có vấn đề. Không JavaScript, không tài nguyên ngoài.
 */
export function trangQuaTai(nn: NgonNguNB, laPost: boolean, url: URL): Response {
  const c = (x: HaiThuTieng) => thoatHtml(x[nn]);
  const taiLai = thoatHtml(url.pathname + url.search);
  const giay = 5 + Math.floor(Math.random() * 6);
  const than = laPost
    ? `<p><strong>${c(CAU_TRANG.chuaGhi)}</strong> ${c(CAU_TRANG.lyDo)}</p>
<p>${c(CAU_TRANG.khongDangXuat)} ${c(CAU_TRANG.guiLai)}</p>`
    : `<p>${c(CAU_TRANG.lyDo)} <strong>${c(CAU_TRANG.khongDangXuat)}</strong></p>
<p>${c(CAU_TRANG.tuTaiLai)}</p>`;
  const html = `<!doctype html>
<html lang="${nn}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
${laPost ? '' : `<meta http-equiv="refresh" content="${giay}">`}
<title>${c(CAU_TRANG.tieuDe)} · Beeftown</title>
<style>
  body { margin: 0; background: #FBF4E1; color: #1E160E; font: 16px/1.55 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  main { width: min(560px, 100% - 32px); margin: 12vh auto; }
  h1 { font-size: 1.5rem; margin: 0 0 1rem; }
  a { display: inline-block; margin-top: .5rem; padding: .75rem 1.25rem; min-height: 48px; box-sizing: border-box;
      background: #B23A2C; color: #FBF4E1; border-radius: 8px; text-decoration: none; font-weight: 600; }
  .phu { color: rgba(30, 22, 14, .68); font-size: .9rem; margin-top: 1.5rem; }
</style>
</head>
<body>
<main>
<h1>${c(CAU_TRANG.tieuDe)}</h1>
${than}
<p><a href="${taiLai}">${c(CAU_TRANG.taiLai)}</a></p>
<p class="phu">${c(CAU_TRANG.keoDai)}</p>
</main>
</body>
</html>`;
  return new Response(html, {
    status: 503,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'retry-after': String(giay),
    },
  });
}
