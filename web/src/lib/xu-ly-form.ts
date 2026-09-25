/**
 * XỬ LÝ POST CHO CÁC TRANG CÔNG KHAI
 *
 * Gộp vào một chỗ vì trang tiếng Việt và trang tiếng Anh phải cư xử GIỐNG HỆT
 * nhau. Hai bản sao của cùng một đoạn logic là hai bản sẽ lệch nhau — và bản
 * lệch sẽ là bản tiếng Anh, vì nó ít người thử hơn.
 *
 * GỬI XONG THÌ CHUYỂN HƯỚNG (POST → redirect → GET). Khách dùng 4G chập chờn
 * rất hay bấm F5; không có bước này thì trình duyệt gửi lại hồ sơ lần hai.
 * Kết quả đi qua cookie dùng một lần chứ KHÔNG qua tham số URL: mã hồ sơ
 * trong URL là mã hồ sơ trong lịch sử trình duyệt, trong header Referer gửi
 * sang Google Fonts, và trong ảnh chụp màn hình khách gửi cho nhau.
 */

import type { APIContext } from 'astro';
import { taoClient } from './noi-dung';
import { ghiKetQua, docKetQua, layIp } from './phien';
import { nopHoSo, type KetQuaNop } from './nop-ho-so';
import { guiYeuCauDatBan, type KetQuaDatBan } from './dat-ban';

/**
 * Xử lý một lượt nộp hồ sơ.
 *
 * Trả về Response chuyển hướng khi đã xử lý xong, hoặc null khi request này
 * không phải POST và trang cứ dựng bình thường.
 */
export async function xuLyUngTuyen(ctx: APIContext, duongDan: string): Promise<Response | null> {
  if (ctx.request.method !== 'POST') return null;

  const client = taoClient();
  if (!client) {
    ghiKetQua(ctx.cookies, {
      ok: false,
      loi: 'Cổng nộp hồ sơ chưa sẵn sàng. Vui lòng nhắn cho Beeftown qua Facebook.',
    });
    return ctx.redirect(duongDan, 303);
  }

  let kq: KetQuaNop;
  try {
    kq = await nopHoSo(client, await ctx.request.formData(), layIp(ctx.request));
  } catch (e) {
    // Mạng đứt giữa chừng, Supabase đang ngủ, hết giờ chờ — ba tình huống
    // khác nhau nhưng cùng một điều cần nói: KHÔNG CHẮC đã ghi hay chưa.
    // Nói "thất bại" ở đây là nói sai nếu database đã ghi xong rồi mới đứt.
    ghiKetQua(ctx.cookies, {
      ok: false,
      loi: 'Không nhận được phản hồi từ hệ thống. Chúng tôi KHÔNG CHẮC hồ sơ đã được ghi nhận hay chưa. '
         + 'Vui lòng nhắn cho Beeftown qua Facebook để kiểm tra — đừng gửi lại nhiều lần.',
    });
    return ctx.redirect(duongDan, 303);
  }

  ghiKetQua(ctx.cookies, kq.ok
    ? { ok: true, ma: kq.ma, loi: kq.luuY }
    : { ok: false, loi: kq.cau });
  return ctx.redirect(duongDan, 303);
}

/** Đọc kết quả của lượt gửi vừa rồi (nếu có) và đổi về dạng component hiểu được. */
export function ketQuaUngTuyen(ctx: APIContext): KetQuaNop | null {
  const kq = docKetQua(ctx.cookies);
  if (!kq) return null;
  return kq.ok
    ? { ok: true, ma: kq.ma, cau: 'Beeftown đã nhận hồ sơ của bạn.', luuY: kq.loi }
    : { ok: false, cau: kq.loi ?? 'Chưa gửi được hồ sơ.' };
}

// -----------------------------------------------------------------------------
// ĐẶT BÀN — cùng khuôn với ứng tuyển, cùng lý do
// -----------------------------------------------------------------------------
export async function xuLyDatBan(ctx: APIContext, duongDan: string): Promise<Response | null> {
  if (ctx.request.method !== 'POST') return null;

  const client = taoClient();
  if (!client) {
    ghiKetQua(ctx.cookies, {
      ok: false,
      loi: 'Đặt bàn trực tuyến chưa sẵn sàng. Vui lòng nhắn cho Beeftown qua Facebook.',
    });
    return ctx.redirect(duongDan, 303);
  }

  let kq: KetQuaDatBan;
  try {
    kq = await guiYeuCauDatBan(client, await ctx.request.formData(), layIp(ctx.request));
  } catch {
    // Hết giờ chờ CÓ THỂ là đã ghi xong rồi mới đứt. Nói "thất bại" lúc này
    // là nói sai, và khách sẽ gửi lại lần hai. Nên nói đúng cái mình biết:
    // không chắc.
    ghiKetQua(ctx.cookies, {
      ok: false,
      loi: 'Không nhận được phản hồi. Chúng tôi KHÔNG CHẮC yêu cầu đã được ghi nhận hay chưa. '
         + 'Vui lòng nhắn cho Beeftown qua Facebook để kiểm tra — đừng gửi lại nhiều lần.',
    });
    return ctx.redirect(duongDan, 303);
  }

  ghiKetQua(ctx.cookies, kq.ok ? { ok: true, ma: kq.ma } : { ok: false, loi: kq.cau });
  return ctx.redirect(duongDan, 303);
}

export function ketQuaDatBan(ctx: APIContext): KetQuaDatBan | null {
  const kq = docKetQua(ctx.cookies);
  if (!kq) return null;
  return kq.ok
    ? { ok: true, ma: kq.ma, cau: 'Beeftown đã nhận yêu cầu đặt bàn của bạn.' }
    : { ok: false, cau: kq.loi ?? 'Chưa gửi được yêu cầu.' };
}
