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
 * sang Google Fonts, và trong ảnh chụp màn hình khách gửi cho nhau. (Mã VỊ TRÍ
 * thì được: nó là dữ liệu công khai, và đưa người nộp hỏng về đúng vị trí đã chọn.)
 *
 * BA KIỂU KẾT QUẢ KHÔNG ĐƯỢC NÓI LẪN NHAU:
 *   · CHƯA được ghi nhận — database chưa hề nhận, hoặc đã từ chối (exception =
 *     cả giao dịch hủy). Gồm cả thân quá lớn / đọc không được: chưa gọi database.
 *   · KHÔNG CHẮC (khongChac) — đã gửi tới database mà không nghe được trả lời.
 *     Trang sau KHÔNG mời gửi lại (TrangDatBan, TrangTuyenDung đọc cờ này).
 *   · Đã nhận — database trả mã.
 *
 * Phần quyết định kết quả (luotUngTuyen, luotDatBan) không cần Astro: nhận
 * Request và client, trả về câu ghi vào cookie và đường chuyển hướng — kiểm
 * thử gọi thẳng (crm/test/test-cong-khai-gui-lai.mjs, test-cong-khai-mat-mang.mjs).
 */

import type { APIContext } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import { taoClient, type NgonNgu } from './noi-dung.ts';
import { ghiKetQua, docKetQua, layIp, type KetQua } from './phien.ts';
import type { BaThuTieng } from './chu';
import { nopHoSo, CAU_NOP, type KetQuaNop } from './nop-ho-so.ts';
import { guiYeuCauDatBan, CAU_DAT_BAN, type KetQuaDatBan } from './dat-ban.ts';
import { docFormGioiHan } from './than-gioi-han.ts';

/**
 * Ngưỡng thân POST. Ứng tuyển: CV tối đa 5 MB (nop-ho-so.ts, khớp kho 0014) cộng
 * các ô chữ và phần bao của multipart. Hỏi bàn chỉ có chữ — 256 KB là hàng chục
 * nghìn chữ có dấu đã mã hóa, dư cho mọi ghi chú thật.
 */
export const THAN_TOI_DA_UNG_TUYEN = 6 * 1024 * 1024;
export const THAN_TOI_DA_DAT_BAN = 256 * 1024;

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
      + 'Vui lòng nhắn cho Beeftown qua Facebook để kiểm tra — đừng gửi lại.',
    en: 'We did not get a response from the system. We are NOT SURE whether your application was recorded. '
      + 'Please message Beeftown on Facebook to check — please do not send it again.',
    ko: '시스템에서 응답을 받지 못했어요. 지원서가 접수되었는지 저희도 확실히 알 수 없어요. '
      + '다시 보내지 마시고, Facebook으로 Beeftown에 메시지를 보내 확인해 주세요.',
  },
  ungTuyenQuaLon: {
    vi: 'Hồ sơ gửi lên quá lớn nên CHƯA được ghi nhận — file CV tối đa 5MB. '
      + 'Vui lòng chọn file nhỏ hơn, hoặc bỏ file, rồi gửi lại.',
    en: 'Your application was too large, so it has NOT been recorded — the CV file can be up to 5MB. '
      + 'Please choose a smaller file, or leave it out, and send again.',
    ko: '지원서 용량이 너무 커서 접수되지 않았어요. 이력서 파일은 최대 5MB까지 올릴 수 있어요. '
      + '더 작은 파일을 고르거나 파일 없이 다시 보내 주세요.',
  },
  ungTuyenKhongDoc: {
    vi: 'Không đọc được hồ sơ gửi lên — mạng có thể đã đứt giữa chừng. Hồ sơ CHƯA được ghi nhận. Vui lòng gửi lại.',
    en: 'We could not read your application — the connection may have dropped. It has NOT been recorded. Please send it again.',
    ko: '보내신 지원서를 읽지 못했어요. 연결이 중간에 끊겼을 수 있어요. 지원서는 접수되지 않았어요. 다시 보내 주세요.',
  },
  ungTuyenLoi: {
    vi: 'Chưa gửi được hồ sơ.',
    en: 'Your application could not be sent.',
    ko: '지원서를 보내지 못했어요.',
  },
  datBanChuaSan: {
    vi: 'Hỏi bàn trực tuyến chưa sẵn sàng. Vui lòng nhắn cho Beeftown qua Facebook.',
    en: 'Online table requests are not open yet. Please message Beeftown on Facebook.',
    ko: '온라인 테이블 문의가 아직 준비되지 않았어요. Facebook으로 Beeftown에 메시지를 보내 주세요.',
  },
  datBanKhongChac: {
    vi: 'Không nhận được phản hồi. Chúng tôi KHÔNG CHẮC yêu cầu đã được ghi nhận hay chưa. '
      + 'Vui lòng nhắn cho Beeftown qua Facebook để kiểm tra — đừng gửi lại.',
    en: 'We did not get a response. We are NOT SURE whether your request was recorded. '
      + 'Please message Beeftown on Facebook to check — please do not send it again.',
    ko: '응답을 받지 못했어요. 테이블 문의가 접수되었는지 저희도 확실히 알 수 없어요. '
      + '다시 보내지 마시고, Facebook으로 Beeftown에 메시지를 보내 확인해 주세요.',
  },
  datBanQuaLon: {
    vi: 'Yêu cầu gửi lên quá dài nên CHƯA được ghi nhận. Vui lòng rút gọn phần ghi chú rồi gửi lại.',
    en: 'Your request was too long, so it has NOT been recorded. Please shorten the note and send again.',
    ko: '문의 내용이 너무 길어서 접수되지 않았어요. 메모를 줄여서 다시 보내 주세요.',
  },
  datBanKhongDoc: {
    vi: 'Không đọc được yêu cầu gửi lên — mạng có thể đã đứt giữa chừng. Yêu cầu CHƯA được ghi nhận. Vui lòng gửi lại.',
    en: 'We could not read your request — the connection may have dropped. It has NOT been recorded. Please send it again.',
    ko: '보내신 문의를 읽지 못했어요. 연결이 중간에 끊겼을 수 있어요. 문의는 접수되지 않았어요. 다시 보내 주세요.',
  },
  datBanLoi: {
    vi: 'Chưa gửi được yêu cầu.',
    en: 'Your request could not be sent.',
    ko: '요청을 보내지 못했어요.',
  },
} as const satisfies Record<string, BaThuTieng>;

/** Lỗi rút gọn cho log: cổng 502 trả nguyên trang HTML vào message. */
const loiNgan = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 300);

/** Một lượt gửi đã xử lý xong: câu ghi vào cookie, và đường chuyển hướng 303. */
export interface LuotGui {
  ketQua: KetQua;
  ve: string;
}

/**
 * Một lượt nộp hồ sơ, không cần Astro.
 *
 * Quay về ĐÚNG chỗ thẻ kết quả (#nop-ho-so), không phải đầu trang: thẻ nằm
 * dưới danh sách vị trí, và trên điện thoại người nộp xong thấy lại đầu trang
 * y như lúc chưa bấm — tưởng chưa gửi được, rồi gửi lần hai (26/09/2026).
 *
 * Database từ chối (chưa ghi gì) thì quay về kèm ?vi_tri=<mã vừa chọn>: form
 * chọn sẵn đúng vị trí đó (TrangTuyenDung đọc tham số này). Đã nhận hay KHÔNG
 * CHẮC thì không kèm — F5 trang sau không dựng sẵn một hồ sơ thứ hai.
 */
export async function luotUngTuyen(
  request: Request, client: SupabaseClient | null, duongDan: string, ngonNgu: NgonNgu,
): Promise<LuotGui> {
  const ve = `${duongDan}#nop-ho-so`;
  if (!client) return { ketQua: { ok: false, loi: CAU.ungTuyenChuaSan[ngonNgu] }, ve };

  // Đọc thân TRƯỚC, có giới hạn, và tách khỏi lời gọi database: đọc hỏng là
  // database chưa được gọi — "CHƯA được ghi nhận", không phải "KHÔNG CHẮC".
  const doc = await docFormGioiHan(request, THAN_TOI_DA_UNG_TUYEN);
  if (doc.loi) {
    const loi = doc.loi === 'qua_lon' ? CAU.ungTuyenQuaLon[ngonNgu] : CAU.ungTuyenKhongDoc[ngonNgu];
    return { ketQua: { ok: false, loi }, ve };
  }

  let kq: KetQuaNop;
  try {
    kq = await nopHoSo(client, doc.form, layIp(request), ngonNgu);
  } catch (e) {
    // Mạng đứt giữa chừng, Supabase đang ngủ, hết giờ chờ — ba tình huống
    // khác nhau nhưng cùng một điều cần nói: KHÔNG CHẮC đã ghi hay chưa.
    // Nói "thất bại" ở đây là nói sai nếu database đã ghi xong rồi mới đứt.
    // Cờ khongChac: trang tuyển dụng không dựng lại form dưới câu "đừng gửi lại".
    // Ghi lại để Workers Logs thấy sự cố — không đợi ứng viên nhắn Facebook.
    console.error('[ung-tuyen] không chắc đã ghi:', loiNgan(e));
    return { ketQua: { ok: false, loi: CAU.ungTuyenKhongChac[ngonNgu], khongChac: true }, ve };
  }

  if (kq.ok) return { ketQua: { ok: true, ma: kq.ma, loi: kq.luuY }, ve };
  const viTri = String(doc.form.get('vi_tri') ?? '').trim();
  return {
    ketQua: { ok: false, loi: kq.cau },
    ve: viTri && viTri.length <= 64 ? `${duongDan}?vi_tri=${encodeURIComponent(viTri)}#nop-ho-so` : ve,
  };
}

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
  const { ketQua, ve } = await luotUngTuyen(ctx.request, taoClient(), duongDan, ngonNgu);
  ghiKetQua(ctx.cookies, ketQua);
  return ctx.redirect(ve, 303);
}

/** Đọc kết quả của lượt gửi vừa rồi (nếu có) và đổi về dạng component hiểu được. */
export function ketQuaUngTuyen(ctx: Pick<APIContext, 'cookies'>, ngonNgu: NgonNgu): KetQuaNop | null {
  const kq = docKetQua(ctx.cookies);
  if (!kq) return null;
  return kq.ok
    ? { ok: true, ma: kq.ma, cau: CAU_NOP.daNhan[ngonNgu], luuY: kq.loi }
    : { ok: false, cau: kq.loi ?? CAU.ungTuyenLoi[ngonNgu], khongChac: kq.khongChac === true };
}

// -----------------------------------------------------------------------------
// ĐẶT BÀN — cùng khuôn với ứng tuyển, cùng lý do
// -----------------------------------------------------------------------------
export async function luotDatBan(
  request: Request, client: SupabaseClient | null, duongDan: string, ngonNgu: NgonNgu,
): Promise<LuotGui> {
  const ve = duongDan;
  if (!client) return { ketQua: { ok: false, loi: CAU.datBanChuaSan[ngonNgu] }, ve };

  const doc = await docFormGioiHan(request, THAN_TOI_DA_DAT_BAN);
  if (doc.loi) {
    const loi = doc.loi === 'qua_lon' ? CAU.datBanQuaLon[ngonNgu] : CAU.datBanKhongDoc[ngonNgu];
    return { ketQua: { ok: false, loi }, ve };
  }

  let kq: KetQuaDatBan;
  try {
    kq = await guiYeuCauDatBan(client, doc.form, layIp(request), ngonNgu);
  } catch (e) {
    // Hết giờ chờ CÓ THỂ là đã ghi xong rồi mới đứt. Nói "thất bại" lúc này
    // là nói sai, và khách sẽ gửi lại lần hai. Nên nói đúng cái mình biết:
    // không chắc.
    console.error('[dat-ban] không chắc đã ghi:', loiNgan(e));
    return { ketQua: { ok: false, loi: CAU.datBanKhongChac[ngonNgu], khongChac: true }, ve };
  }

  return { ketQua: kq.ok ? { ok: true, ma: kq.ma } : { ok: false, loi: kq.cau }, ve };
}

export async function xuLyDatBan(
  ctx: APIContext, duongDan: string, ngonNgu: NgonNgu,
): Promise<Response | null> {
  if (ctx.request.method !== 'POST') return null;
  const { ketQua, ve } = await luotDatBan(ctx.request, taoClient(), duongDan, ngonNgu);
  ghiKetQua(ctx.cookies, ketQua);
  return ctx.redirect(ve, 303);
}

export function ketQuaDatBan(ctx: Pick<APIContext, 'cookies'>, ngonNgu: NgonNgu): KetQuaDatBan | null {
  const kq = docKetQua(ctx.cookies);
  if (!kq) return null;
  return kq.ok
    ? { ok: true, ma: kq.ma, cau: CAU_DAT_BAN.daNhan[ngonNgu] }
    : { ok: false, cau: kq.loi ?? CAU.datBanLoi[ngonNgu], khongChac: kq.khongChac === true };
}
