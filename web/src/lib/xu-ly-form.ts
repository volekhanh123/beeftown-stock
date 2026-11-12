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

import type { APIContext, AstroCookies } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import { taoClient, type NgonNgu } from './noi-dung.ts';
import { ghiKetQua, docKetQua, layIp, type KetQua } from './phien.ts';
import type { BaThuTieng } from './chu';
import { nopHoSo, CAU_NOP, type KetQuaNop } from './nop-ho-so.ts';
import { guiYeuCauDatBan, CAU_DAT_BAN, type KetQuaDatBan } from './dat-ban.ts';
import { docDonGui, guiDonMuaThit, moTraTienVnpay, CAU_DAT_HANG, type KetQuaDatHang } from './dat-hang-mua-thit.ts';
import { docCauHinhVnpay, taoLinkVnpay, cauMaPhanHoi, type CauHinhVnpay } from './vnpay.ts';
import { docKetQuaVe } from './vnpay-hook.ts';
import { layBienCong } from './bien-moi-truong.ts';
import { gioThanhDiaChi } from './don-mua-thit.ts';
import { docFormGioiHan } from './than-gioi-han.ts';

/**
 * Ngưỡng thân POST. Ứng tuyển: CV tối đa 5 MB (nop-ho-so.ts, khớp kho 0014) cộng
 * các ô chữ và phần bao của multipart. Hỏi bàn chỉ có chữ — 256 KB là hàng chục
 * nghìn chữ có dấu đã mã hóa, dư cho mọi ghi chú thật.
 */
export const THAN_TOI_DA_UNG_TUYEN = 6 * 1024 * 1024;
export const THAN_TOI_DA_DAT_BAN = 256 * 1024;
/** Đơn mua thịt: tối đa 60 gói, mỗi gói hai ô ngắn, cộng ba ô liên hệ và ghi chú — 64 KB là quá đủ. */
export const THAN_TOI_DA_DAT_HANG = 64 * 1024;

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
  datHangChuaSan: {
    vi: 'Đặt hàng trên website chưa sẵn sàng. Đơn của bạn CHƯA được ghi nhận. Vui lòng gọi Beeftown.',
    en: 'Online orders are not ready yet. Your order has NOT been recorded. Please call Beeftown.',
    ko: '웹사이트 주문이 아직 준비되지 않았어요. 주문은 접수되지 않았어요. Beeftown에 전화해 주세요.',
  },
  datHangKhongChac: {
    vi: 'Không nhận được phản hồi. Chúng tôi KHÔNG CHẮC đơn đã được ghi nhận hay chưa. '
      + 'Vui lòng gọi Beeftown để kiểm tra — đừng đặt lại.',
    en: 'We did not get a response. We are NOT SURE whether your order was recorded. '
      + 'Please call Beeftown to check — please do not order again.',
    ko: '응답을 받지 못했어요. 주문이 접수되었는지 저희도 확실히 알 수 없어요. '
      + '다시 주문하지 마시고 Beeftown에 전화해 확인해 주세요.',
  },
  datHangQuaLon: {
    vi: 'Đơn gửi lên quá dài nên CHƯA được ghi nhận. Vui lòng rút gọn ghi chú rồi đặt lại.',
    en: 'Your order was too long, so it has NOT been recorded. Please shorten the note and order again.',
    ko: '주문 내용이 너무 길어서 접수되지 않았어요. 메모를 줄여서 다시 주문해 주세요.',
  },
  datHangKhongDoc: {
    vi: 'Không đọc được đơn gửi lên — mạng có thể đã đứt giữa chừng. Đơn CHƯA được ghi nhận. Vui lòng đặt lại.',
    en: 'We could not read your order — the connection may have dropped. It has NOT been recorded. Please order again.',
    ko: '보내신 주문을 읽지 못했어요. 연결이 중간에 끊겼을 수 있어요. 주문은 접수되지 않았어요. 다시 주문해 주세요.',
  },
  // 0115 · trả lại qua VNPay (thẻ "đã nhận đơn" hay trang kết quả)
  traLaiChuaSan: {
    vi: 'Trả tiền trên website chưa sẵn sàng. Vui lòng gọi Beeftown.',
    en: 'Paying on the website is not ready yet. Please call Beeftown.',
    ko: '웹사이트 결제가 아직 준비되지 않았어요. Beeftown에 전화해 주세요.',
  },
  traLaiKhongKhop: {
    vi: 'Không mở lại được trang trả tiền cho đơn này trên trình duyệt này. Vui lòng gọi Beeftown kèm mã đơn.',
    en: 'We cannot reopen the payment page for this order in this browser. Please call Beeftown with your order code.',
    ko: '이 브라우저에서는 이 주문의 결제 페이지를 다시 열 수 없어요. 주문 번호와 함께 Beeftown에 전화해 주세요.',
  },
  traLaiKhongChac: {
    vi: 'Không nhận được phản hồi khi mở trang trả tiền. Đơn của bạn vẫn được giữ. Vui lòng thử lại sau ít phút hoặc gọi Beeftown.',
    en: 'We got no response while opening the payment page. Your order is still held. Please try again in a few minutes or call Beeftown.',
    ko: '결제 페이지를 여는 중에 응답을 받지 못했어요. 주문은 그대로 있어요. 몇 분 뒤 다시 시도하시거나 Beeftown에 전화해 주세요.',
  },
} as const satisfies Record<string, BaThuTieng>;

/** Lỗi rút gọn cho log: cổng 502 trả nguyên trang HTML vào message. */
const loiNgan = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 300);

/** Một lượt gửi đã xử lý xong: câu ghi vào cookie, và đường chuyển hướng 303. */
export interface LuotGui {
  ketQua: KetQua;
  ve: string;
  /** Đơn mua thịt có VNPay (0115): "<mã đơn>.<ma_gui>" cho cookie trả lại (ghiCookieTraVnpay). */
  traVnpay?: string;
  /** Đã chuyển sang trang VNPay (ve là đường dẫn của VNPay): không ghi cookie kết quả. */
  sangVnpay?: boolean;
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

// -----------------------------------------------------------------------------
// ĐƠN MUA THỊT VỀ (0113) — cùng khuôn, cùng lý do
// -----------------------------------------------------------------------------
/** VNPay của trang: cấu hình đủ bốn bí mật và đường dẫn đầy đủ VNPay đưa khách về. null = trang chạy như chưa có VNPay. */
export interface VnpayTrang {
  cauHinh: Pick<CauHinhVnpay, 'maTmn' | 'khoaBiMat'>;
  duongVe: string;
}

/** Trang kết quả trả tiền của mỗi thứ tiếng (Return URL của VNPay). */
export const DUONG_KET_QUA_VNPAY: Record<NgonNgu, string> = {
  vi: '/mua-thit-ve/ket-qua', en: '/en/buy-meat/result', ko: '/ko/buy-meat/result',
};

/**
 * Đọc VNPay cho trang đang dựng. Thiếu bí mật nào → null (trang như 0113: quán gọi xác nhận, website không thu tiền);
 * thiếu một phần thì ghi một dòng log nêu tên bí mật thiếu. Gốc đường về: SITE_URL, không có thì gốc của request.
 */
export async function vnpayChoTrang(ctx: Pick<APIContext, 'url'>, ngonNgu: NgonNgu, env?: Record<string, unknown>): Promise<VnpayTrang | null> {
  const doc = await docCauHinhVnpay(env);
  if (!doc.ok) {
    if (!doc.chuaCai) console.error(`[vnpay] ${doc.cau}`);
    return null;
  }
  const goc = (layBienCong('SITE_URL', env) ?? ctx.url.origin).replace(/\/$/, '');
  return { cauHinh: doc.cauHinh, duongVe: `${goc}${DUONG_KET_QUA_VNPAY[ngonNgu]}` };
}

/**
 * Một lượt đặt hàng, không cần Astro.
 *
 * Đã nhận → về #da-nhan (trang dựng thẻ "đã nhận đơn", không dựng lại form). Không chắc → về #dat-hang, không mang
 * giỏ (đặt lại chỉ còn một cú bấm thì quán nhận hai đơn). Chưa ghi (chặn sớm hay database từ chối) → về #dat-hang
 * KÈM giỏ trên địa chỉ (gioThanhDiaChi: chỉ khóa gói và số gói) để khách không phải chọn lại; họ tên, số điện thoại,
 * địa chỉ thì script của trang điền lại từ sessionStorage — không bao giờ đi qua địa chỉ trang.
 *
 * Có VNPay (0115): đã nhận → mở một lần trả (mua_thit_mo_vnpay) → chuyển thẳng sang trang VNPay. Mở không được (database
 * từ chối, không nghe trả lời) → thẻ "đã nhận đơn" nói đơn CHƯA trả tiền, kèm nút trả lại. Đơn đã trả đủ (gửi lại
 * form cũ) → thẻ "đã trả".
 */
export async function luotDatHang(
  request: Request, client: Pick<SupabaseClient, 'rpc'> | null, duongDan: string, ngonNgu: NgonNgu,
  vnpay: VnpayTrang | null = null, bayGio: () => number = Date.now,
): Promise<LuotGui> {
  const veForm = `${duongDan}#dat-hang`;
  const kq = await luotDatHangTho(request, client, ngonNgu, vnpay, bayGio);
  const ve = kq.sangVnpay ? kq.ve! : kq.ve === null ? veForm : kq.ve === 'da_nhan' ? `${duongDan}#da-nhan` : `${duongDan}?${kq.ve}#dat-hang`;
  return { ketQua: { ...kq.ketQua, loai: 'dat_hang' }, ve, traVnpay: kq.traVnpay, sangVnpay: kq.sangVnpay };
}

/** Phần quyết định của luotDatHang. ve: null → #dat-hang; 'da_nhan' → #da-nhan; chuỗi khác → giỏ trên địa chỉ trang. */
async function luotDatHangTho(
  request: Request, client: Pick<SupabaseClient, 'rpc'> | null, ngonNgu: NgonNgu, vnpay: VnpayTrang | null,
  bayGio: () => number,
): Promise<{ ketQua: KetQua; ve: string | null; traVnpay?: string; sangVnpay?: boolean }> {
  const veForm = null;
  if (!client) return { ketQua: { ok: false, loi: CAU.datHangChuaSan[ngonNgu] }, ve: veForm };

  const doc = await docFormGioiHan(request, THAN_TOI_DA_DAT_HANG);
  if (doc.loi) {
    const loi = doc.loi === 'qua_lon' ? CAU.datHangQuaLon[ngonNgu] : CAU.datHangKhongDoc[ngonNgu];
    return { ketQua: { ok: false, loi }, ve: veForm };
  }

  const don = docDonGui(doc.form);
  let kq: KetQuaDatHang;
  try {
    kq = await guiDonMuaThit(client, don, layIp(request), ngonNgu);
  } catch (e) {
    console.error('[dat-hang] không chắc đã ghi:', loiNgan(e));
    return { ketQua: { ok: false, loi: CAU.datHangKhongChac[ngonNgu], khongChac: true }, ve: veForm };
  }

  if (!kq.ok) {
    const gio = gioThanhDiaChi(don.gio);
    return { ketQua: { ok: false, loi: kq.cau }, ve: gio || veForm };
  }
  // Đơn ghi được thì mã chống gửi hai lần đúng dạng (database từ chối khi thiếu).
  if (!vnpay || !don.maGui) return { ketQua: { ok: true, ma: kq.ma }, ve: 'da_nhan' };
  return moVnpay(request, client, kq.ma!, don.maGui, ngonNgu, vnpay, bayGio());
}

/** Mở một lần trả và dựng đường dẫn VNPay — chung cho lượt đặt hàng và nút "Trả lại". */
async function moVnpay(
  request: Request, client: Pick<SupabaseClient, 'rpc'>, maDon: string, maGui: string, ngonNgu: NgonNgu,
  vnpay: VnpayTrang, ms: number,
): Promise<{ ketQua: KetQua; ve: string | null; traVnpay?: string; sangVnpay?: boolean }> {
  const traVnpay = `${maDon}.${maGui}`;
  let mo;
  try {
    mo = await moTraTienVnpay(client, maGui, ngonNgu);
  } catch (e) {
    console.error('[dat-hang] không mở được lần trả VNPay:', loiNgan(e));
    return { ketQua: { ok: true, ma: maDon, choTra: true, loi: CAU.traLaiKhongChac[ngonNgu] }, ve: 'da_nhan', traVnpay };
  }
  if (!mo.ok) return { ketQua: { ok: true, ma: maDon, choTra: true, loi: mo.cau }, ve: 'da_nhan', traVnpay };
  if (mo.daTra) return { ketQua: { ok: true, ma: mo.maDon, daTra: true }, ve: 'da_nhan' };
  const url = await taoLinkVnpay(vnpay.cauHinh, {
    maGiaoDich: mo.maGiaoDich, maDon: mo.maDon, soTien: mo.soTien, ngonNgu, ip: layIp(request), duongVe: vnpay.duongVe, ms,
  });
  return { ketQua: { ok: true, ma: mo.maDon }, ve: url, traVnpay, sangVnpay: true };
}

export async function xuLyDatHang(
  ctx: APIContext, duongDan: string, ngonNgu: NgonNgu,
): Promise<Response | null> {
  if (ctx.request.method !== 'POST') return null;
  const l = await luotDatHang(ctx.request, taoClient(), duongDan, ngonNgu, await vnpayChoTrang(ctx, ngonNgu));
  if (!l.sangVnpay) ghiKetQua(ctx.cookies, l.ketQua);
  if (l.traVnpay) ghiCookieTraVnpay(ctx.cookies, l.traVnpay);
  return ctx.redirect(l.ve, 303);
}

export function ketQuaDatHang(ctx: Pick<APIContext, 'cookies'>, ngonNgu: NgonNgu): KetQuaDatHang | null {
  const kq = docKetQua(ctx.cookies);
  // Cookie kết quả dùng chung với Hỏi bàn, Tuyển dụng: kết quả của form khác (lượt chuyển hướng bị bỏ dở) không bao giờ
  // thành thẻ "đã nhận đơn" với mã đặt bàn.
  if (!kq || kq.loai !== 'dat_hang') return null;
  return kq.ok
    ? { ok: true, ma: kq.ma, cau: CAU_DAT_HANG.daNhan[ngonNgu], choTra: kq.choTra === true, loiTra: kq.choTra ? kq.loi : undefined,
        daTra: kq.daTra === true }
    : { ok: false, cau: kq.loi ?? CAU_DAT_HANG.chuaGhi[ngonNgu], khongChac: kq.khongChac === true };
}

// -----------------------------------------------------------------------------
// TRẢ LẠI QUA VNPAY (0115) — nút ở thẻ "đã nhận đơn" và trang kết quả
// -----------------------------------------------------------------------------
/**
 * Cookie "<mã đơn>.<ma_gui>": chỉ trình duyệt đã đặt đơn mới mở lại được lần trả cho đơn đó (ma_gui là thứ
 * mua_thit_mo_vnpay đòi). httpOnly, SameSite=Lax (VNPay đưa khách về bằng một lần mở trang GET — cookie vẫn đi kèm),
 * 2 giờ. Không bao giờ vào HTML hay địa chỉ trang.
 */
export const COOKIE_TRA_VNPAY = 'bt_tra_vnpay';
const MAU_TRA_VNPAY = /^([0-9A-Z]{6})\.([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export function ghiCookieTraVnpay(cookies: AstroCookies, giaTri: string) {
  cookies.set(COOKIE_TRA_VNPAY, giaTri, {
    httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax', path: '/', maxAge: 2 * 3600,
  });
}

/** Mã đơn của cookie trả lại (để trang biết có nên hiện nút "Trả lại" không), hoặc null. */
export function maDonTraVnpay(cookies: Pick<AstroCookies, 'get'>): string | null {
  return MAU_TRA_VNPAY.exec(cookies.get(COOKIE_TRA_VNPAY)?.value ?? '')?.[1] ?? null;
}

export type LuotTraLai =
  | { loai: 'sang_vnpay'; url: string }
  | { loai: 'da_tra'; maDon: string }
  | { loai: 'loi'; cau: string; maDon: string | null };

/**
 * Một lần bấm "Trả lại qua VNPay". Thân form chỉ có ma_don (đơn của nút); cookie phải là của đúng đơn đó — nút của một
 * đơn không bao giờ mở lần trả cho đơn khác vừa đặt trong cùng trình duyệt.
 */
export async function luotTraLai(
  request: Request, cookieTra: string | null | undefined, client: Pick<SupabaseClient, 'rpc'> | null, ngonNgu: NgonNgu,
  vnpay: VnpayTrang | null, bayGio: () => number = Date.now,
): Promise<LuotTraLai> {
  const doc = await docFormGioiHan(request, 4 * 1024);
  const maDon = doc.loi ? null : String(doc.form.get('ma_don') ?? '').trim();
  const m = MAU_TRA_VNPAY.exec(cookieTra ?? '');
  const maHop = maDon && /^[0-9A-Z]{6}$/.test(maDon) ? maDon : null;
  if (!vnpay || !client) return { loai: 'loi', cau: CAU.traLaiChuaSan[ngonNgu], maDon: maHop };
  if (!m || !maHop || m[1] !== maHop) return { loai: 'loi', cau: CAU.traLaiKhongKhop[ngonNgu], maDon: maHop };
  const kq = await moVnpay(request, client, m[1], m[2], ngonNgu, vnpay, bayGio());
  if (kq.sangVnpay) return { loai: 'sang_vnpay', url: kq.ve! };
  if (kq.ketQua.daTra) return { loai: 'da_tra', maDon: m[1] };
  return { loai: 'loi', cau: kq.ketQua.loi ?? CAU.traLaiKhongChac[ngonNgu], maDon: m[1] };
}

// -----------------------------------------------------------------------------
// TRANG KẾT QUẢ TRẢ TIỀN (Return URL — /mua-thit-ve/ket-qua, /en/buy-meat/result, /ko/buy-meat/result)
// -----------------------------------------------------------------------------
export type ManKetQuaVnpay =
  | { loai: 'chua_cai' }
  | { loai: 'sai_chu_ky' }
  /** Database đã ghi đơn ĐÃ TRẢ (IPN đã tới). */
  | { loai: 'da_nhan_tien'; maDon: string; soTien: number | null }
  /** Chữ ký đúng, VNPay báo mã 00, database chưa ghi (IPN chưa tới / không hỏi được). Không bao giờ nói "đã nhận tiền". */
  | { loai: 'vnpay_bao_da_tra'; maDon: string; soTien: number | null }
  | { loai: 'chua_tra'; maDon: string; soTien: number | null; cau: string; coTraLai: boolean }
  /** Bấm "Trả tiền" mà không mở được. */
  | { loai: 'loi_tra_lai'; maDon: string | null; cau: string; coTraLai: boolean };

/**
 * GET: đọc kết quả VNPay gửi kèm (docKetQuaVe — kiểm chữ ký, ghi dấu khách về). POST: nút "Trả tiền qua VNPay"
 * (luotTraLai) → chuyển sang VNPay (Response 303) hoặc một màn lỗi.
 */
export async function xuLyKetQuaVnpay(ctx: APIContext, ngonNgu: NgonNgu): Promise<Response | ManKetQuaVnpay> {
  const vnpay = await vnpayChoTrang(ctx, ngonNgu);
  const maDonCookie = maDonTraVnpay(ctx.cookies);
  if (ctx.request.method === 'POST') {
    const r = await luotTraLai(ctx.request, ctx.cookies.get(COOKIE_TRA_VNPAY)?.value, taoClient(), ngonNgu, vnpay);
    if (r.loai === 'sang_vnpay') return ctx.redirect(r.url, 303);
    if (r.loai === 'da_tra') return { loai: 'da_nhan_tien', maDon: r.maDon, soTien: null };
    return { loai: 'loi_tra_lai', maDon: r.maDon, cau: r.cau, coTraLai: !!vnpay && !!r.maDon && r.maDon === maDonCookie };
  }
  const kq = await docKetQuaVe(ctx.url);
  if (kq.loai !== 'co_ket_qua') return kq;
  if (kq.daGhi === true) return { loai: 'da_nhan_tien', maDon: kq.maDon, soTien: kq.soTien };
  if (kq.daTra) return { loai: 'vnpay_bao_da_tra', maDon: kq.maDon, soTien: kq.soTien };
  return { loai: 'chua_tra', maDon: kq.maDon, soTien: kq.soTien, cau: cauMaPhanHoi(kq.maPhanHoi, ngonNgu),
           coTraLai: !!vnpay && kq.maDon === maDonCookie };
}
