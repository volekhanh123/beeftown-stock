/**
 * XỬ LÝ POST CHO CÁC TRANG CÔNG KHAI
 *
 * Gộp vào một chỗ vì trang tiếng Việt, tiếng Anh và tiếng Hàn phải cư xử GIỐNG
 * HỆT nhau. Nhiều bản sao của cùng một đoạn logic là nhiều bản sẽ lệch nhau —
 * và bản lệch sẽ là bản ít người thử nhất.
 *
 * Chỉ CÂU CHỮ đổi theo ngonNgu. Trang gọi truyền ngôn ngữ của chính nó, và
 * gửi xong thì chuyển hướng về CHÍNH đường dẫn đó để đọc kết quả — nên câu
 * ghi vào cookie cùng thứ tiếng với trang đọc nó.
 *
 * GỬI XONG THÌ CHUYỂN HƯỚNG (POST → redirect → GET). Khách dùng 4G chập chờn
 * rất hay bấm F5; không có bước này thì trình duyệt gửi lại hồ sơ lần hai.
 * Kết quả đi qua cookie dùng một lần chứ KHÔNG qua tham số URL: mã hồ sơ
 * trong URL là mã hồ sơ trong lịch sử trình duyệt, trong header Referer gửi
 * sang Google Fonts, và trong ảnh chụp màn hình khách gửi cho nhau.
 */

import type { APIContext } from 'astro';
import { taoClient, type NgonNgu } from './noi-dung';
import { ghiKetQua, docKetQua, layIp } from './phien';
import type { BaThuTieng } from './chu';
import { nopHoSo, CAU_NOP, type KetQuaNop } from './nop-ho-so';
import { guiYeuCauDatBan, CAU_DAT_BAN, type KetQuaDatBan } from './dat-ban';

// Câu của riêng tầng này: khi chưa gọi được tới database, hoặc gọi rồi mà
// không nghe được trả lời.
const CAU = {
  ungTuyenChuaSan: {
    vi: 'Cổng nộp hồ sơ chưa sẵn sàng. Vui lòng nhắn cho Beeftown qua Facebook.',
    en: 'Online applications are not ready yet. Please message Beeftown on Facebook.',
    ko: '온라인 지원 창구가 아직 준비되지 않았어요. Facebook으로 Beeftown에 메시지를 보내 주세요.',
  },
  ungTuyenKhongChac: {
    vi: 'Không nhận được phản hồi từ hệ thống. Chúng tôi KHÔNG CHẮC hồ sơ đã được ghi nhận hay chưa. '
      + 'Vui lòng nhắn cho Beeftown qua Facebook để kiểm tra — đừng gửi lại nhiều lần.',
    en: 'We did not get a response from the system. We are NOT SURE whether your application was recorded. '
      + 'Please message Beeftown on Facebook to check — do not send it again several times.',
    ko: '시스템에서 응답을 받지 못했어요. 지원서가 접수되었는지 저희도 확실히 알 수 없어요. '
      + '여러 번 다시 보내지 마시고, Facebook으로 Beeftown에 메시지를 보내 확인해 주세요.',
  },
  ungTuyenLoi: {
    vi: 'Chưa gửi được hồ sơ.',
    en: 'Your application could not be sent.',
    ko: '지원서를 보내지 못했어요.',
  },
  datBanChuaSan: {
    vi: 'Đặt bàn trực tuyến chưa sẵn sàng. Vui lòng nhắn cho Beeftown qua Facebook.',
    en: 'Online booking is not ready yet. Please message Beeftown on Facebook.',
    ko: '온라인 예약이 아직 준비되지 않았어요. Facebook으로 Beeftown에 메시지를 보내 주세요.',
  },
  datBanKhongChac: {
    vi: 'Không nhận được phản hồi. Chúng tôi KHÔNG CHẮC yêu cầu đã được ghi nhận hay chưa. '
      + 'Vui lòng nhắn cho Beeftown qua Facebook để kiểm tra — đừng gửi lại nhiều lần.',
    en: 'We did not get a response. We are NOT SURE whether your request was recorded. '
      + 'Please message Beeftown on Facebook to check — do not send it again several times.',
    ko: '응답을 받지 못했어요. 예약 요청이 접수되었는지 저희도 확실히 알 수 없어요. '
      + '여러 번 다시 보내지 마시고, Facebook으로 Beeftown에 메시지를 보내 확인해 주세요.',
  },
  datBanLoi: {
    vi: 'Chưa gửi được yêu cầu.',
    en: 'Your request could not be sent.',
    ko: '요청을 보내지 못했어요.',
  },
} as const satisfies Record<string, BaThuTieng>;

/**
 * Xử lý một lượt nộp hồ sơ.
 *
 * Trả về Response chuyển hướng khi đã xử lý xong, hoặc null khi request này
 * không phải POST và trang cứ dựng bình thường.
 */
export async function xuLyUngTuyen(
  ctx: APIContext, duongDan: string, ngonNgu: NgonNgu,
): Promise<Response | null> {
  if (ctx.request.method !== 'POST') return null;

  // Quay về ĐÚNG chỗ thẻ kết quả (#nop-ho-so), không phải đầu trang: thẻ nằm
  // dưới danh sách vị trí, và trên điện thoại người nộp xong thấy lại đầu trang
  // y như lúc chưa bấm — tưởng chưa gửi được, rồi gửi lần hai (26/09/2026).
  const ve = `${duongDan}#nop-ho-so`;

  const client = taoClient();
  if (!client) {
    ghiKetQua(ctx.cookies, { ok: false, loi: CAU.ungTuyenChuaSan[ngonNgu] });
    return ctx.redirect(ve, 303);
  }

  let kq: KetQuaNop;
  try {
    kq = await nopHoSo(client, await ctx.request.formData(), layIp(ctx.request), ngonNgu);
  } catch (e) {
    // Mạng đứt giữa chừng, Supabase đang ngủ, hết giờ chờ — ba tình huống
    // khác nhau nhưng cùng một điều cần nói: KHÔNG CHẮC đã ghi hay chưa.
    // Nói "thất bại" ở đây là nói sai nếu database đã ghi xong rồi mới đứt.
    ghiKetQua(ctx.cookies, { ok: false, loi: CAU.ungTuyenKhongChac[ngonNgu] });
    return ctx.redirect(ve, 303);
  }

  ghiKetQua(ctx.cookies, kq.ok
    ? { ok: true, ma: kq.ma, loi: kq.luuY }
    : { ok: false, loi: kq.cau });
  return ctx.redirect(ve, 303);
}

/** Đọc kết quả của lượt gửi vừa rồi (nếu có) và đổi về dạng component hiểu được. */
export function ketQuaUngTuyen(ctx: APIContext, ngonNgu: NgonNgu): KetQuaNop | null {
  const kq = docKetQua(ctx.cookies);
  if (!kq) return null;
  return kq.ok
    ? { ok: true, ma: kq.ma, cau: CAU_NOP.daNhan[ngonNgu], luuY: kq.loi }
    : { ok: false, cau: kq.loi ?? CAU.ungTuyenLoi[ngonNgu] };
}

// -----------------------------------------------------------------------------
// ĐẶT BÀN — cùng khuôn với ứng tuyển, cùng lý do
// -----------------------------------------------------------------------------
export async function xuLyDatBan(
  ctx: APIContext, duongDan: string, ngonNgu: NgonNgu,
): Promise<Response | null> {
  if (ctx.request.method !== 'POST') return null;

  const client = taoClient();
  if (!client) {
    ghiKetQua(ctx.cookies, { ok: false, loi: CAU.datBanChuaSan[ngonNgu] });
    return ctx.redirect(duongDan, 303);
  }

  let kq: KetQuaDatBan;
  try {
    kq = await guiYeuCauDatBan(client, await ctx.request.formData(), layIp(ctx.request), ngonNgu);
  } catch {
    // Hết giờ chờ CÓ THỂ là đã ghi xong rồi mới đứt. Nói "thất bại" lúc này
    // là nói sai, và khách sẽ gửi lại lần hai. Nên nói đúng cái mình biết:
    // không chắc.
    ghiKetQua(ctx.cookies, { ok: false, loi: CAU.datBanKhongChac[ngonNgu] });
    return ctx.redirect(duongDan, 303);
  }

  ghiKetQua(ctx.cookies, kq.ok ? { ok: true, ma: kq.ma } : { ok: false, loi: kq.cau });
  return ctx.redirect(duongDan, 303);
}

export function ketQuaDatBan(ctx: APIContext, ngonNgu: NgonNgu): KetQuaDatBan | null {
  const kq = docKetQua(ctx.cookies);
  if (!kq) return null;
  return kq.ok
    ? { ok: true, ma: kq.ma, cau: CAU_DAT_BAN.daNhan[ngonNgu] }
    : { ok: false, cau: kq.loi ?? CAU.datBanLoi[ngonNgu] };
}
