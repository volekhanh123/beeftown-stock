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
