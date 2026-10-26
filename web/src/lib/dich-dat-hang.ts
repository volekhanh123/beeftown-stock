/**
 * ĐÍCH ĐẶT HÀNG CỦA TRANG MUA THỊT VỀ — MỘT CHỖ
 * ==============================================
 * Nút gửi đơn trỏ đâu và giỏ đi sang quán thế nào: chỉ file này quyết định. Component và script của trang không
 * tự viết link Zalo hay chữ của bước gửi — chúng gọi dichDatHang, linkGuiDon và đọc CHU_DICH.
 *
 * PR 2 (26/10/2026) — TẠM: khách chép tin đơn (tiếng Việt, don-mua-thit.ts), bấm link chat Zalo OA đã công bố
 * (zalo_oa_url, chỉ https://zalo.me/<mã> — trùng la_link_zalo_oa() của migration 0101), tự dán và bấm Gửi.
 * Web không điền sẵn được chữ vào chat Zalo: link zalo.me không có tham số chữ nào được tài liệu hóa.
 *
 * Khánh 26/10/2026: "Mốt đổi Mini App link trực tiếp đặt chứ không gửi tin nhắn nữa". PR sau (khi Mini App
 * 2858300068641327950 đã phát hành và đọc được giỏ bằng getRouteParams):
 *   · thêm cach 'mini_app' → url = https://zalo.me/s/2858300068641327950/…?gio=<khoaGoi>:<số>,… do linkGuiDon dựng
 *     từ giỏ; coBuocChep = false; CHU_DICH['mini_app'];
 *   · đổi dichDatHang() chọn 'mini_app'; giữ 'chep_tin_mo_chat_oa' làm đường lui nếu cần;
 *   · sửa kiểm thử của file này (crm/test/test-cong-khai-mua-thit-dieu-huong.mjs nhóm 1).
 * Chữ khác còn nhắc tới gửi tin qua Zalo, PR sau xem lại: chu.ts moTaMuaThit; TrangMuaThitVe.astro — hỏi đáp 2, 4,
 * 11 và chữ c.khungTin, c.tinTiengViet, c.buoc1 / buoc3; mục "Khi bạn gửi đơn mua thịt qua Zalo" của ba trang quyền
 * riêng tư và mục "Tin đơn mua thịt gửi qua Zalo" của ba trang xóa dữ liệu; hướng dẫn trực OA trong web/README.md.
 * Script của trang đọc đích từ data-dich (JSON của dichDatHang) — không tự đặt cach / coBuocChep / url.
 *
 * File thuần (chỉ import type): script của trang nạp được mà không kéo supabase-js vào trình duyệt. Không đọc đồng
 * hồ, không DOM, không mạng.
 */
import type { NoiDung } from './noi-dung.ts';
import type { BaThuTieng } from './chu.ts';

/**
 * Link chat của Zalo OA: trùng từng ký tự mẫu của la_link_zalo_oa() (0101) — kiểm thử test-mua-thit-ve.mjs nhóm 9
 * so hai bên trên một bảng mẫu. Chỉ https, chỉ máy chủ zalo.me, đúng một đoạn mã OA, không chuỗi truy vấn, không #.
 */
export const MAU_LINK_ZALO_OA = /^https:\/\/zalo\.me\/[0-9A-Za-z._-]+\/?$/;

/**
 * Link Zalo OA dùng được làm đích gửi đơn: bỏ khoảng trắng hai đầu rồi so mẫu. Khớp → chuỗi đã bỏ khoảng trắng;
 * không khớp (http, máy chủ khác, đường dẫn con, "javascript:…", không phải chuỗi) → null.
 *
 * Khác lienHe(nd).zalo (trang-cong-khai.ts): link liên hệ thường nhận mọi đường dẫn http(s); đích nhận đơn và mã QR
 * chuyển khoản thì chỉ được là link chat của OA.
 */
export function laLinkZaloOa(u: unknown): string | null {
  if (typeof u !== 'string') return null;
  const gon = u.trim();
  return MAU_LINK_ZALO_OA.test(gon) ? gon : null;
}

/** Cách giỏ đi sang quán. PR 2 chỉ có một cách; PR đổi sang Mini App thêm 'mini_app'. */
export type CachChuyenGio = 'chep_tin_mo_chat_oa';

export interface DichDatHang {
  cach: CachChuyenGio;
  /** Link mặc định của nút gửi (máy chủ in sẵn vào trang). */
  url: string;
  /** Trang có khung tin đơn và nút "Chép đơn" trước khi bấm link. */
  coBuocChep: boolean;
}

/** Đích đặt hàng của trang; chưa công bố link Zalo OA hợp lệ thì null (trang không mở — muaThitVeMo). */
export function dichDatHang(nd: Pick<NoiDung, 'zalo_oa_url'>): DichDatHang | null {
  const url = laLinkZaloOa(nd.zalo_oa_url);
  return url ? { cach: 'chep_tin_mo_chat_oa', url, coBuocChep: true } : null;
}

/**
 * Link của nút gửi cho một giỏ. PR 2: link chat OA, không mang giỏ (giỏ đi bằng tin khách dán). Nhận giỏ và cách nhận
 * dù PR 2 không dùng, để chữ ký giữ nguyên khi đổi sang Mini App: component và script đã gọi hàm này mỗi lần giỏ đổi.
 */
export function linkGuiDon(dich: DichDatHang, _gio: ReadonlyMap<string, number>, _cachNhan: 'quay' | 'giao'): string {
  return dich.url;
}

/**
 * Trang Mua thịt về mở: công tắc HIỆU LỰC của database (noi_dung_cong_khai của 0101 đã gộp công tắc, link Zalo OA
 * hợp lệ và có gói trên menu web) và có đích đặt hàng. Điều hướng, mô tả trang và trạng thái trang cùng đọc hàm này.
 * Chỉ đúng boolean true: chưa nối database (null) hay giá trị lạ đều là chưa mở.
 */
export function muaThitVeMo(nd: Pick<NoiDung, 'hien_mua_thit_ve' | 'zalo_oa_url'>): boolean {
  return nd.hien_mua_thit_ve === true && dichDatHang(nd) !== null;
}

/** Khóa chữ của bước gửi — mỗi cách chuyển giỏ có đủ bộ khóa này. */
export type KhoaChuDich =
  | 'buocGui' | 'nutXemDon' | 'buocSau' | 'nutGui' | 'nutChep' | 'daChep' | 'chepLoi' | 'chepTay' | 'sauNut';

/**
 * Chữ của bước gửi, theo cách chuyển giỏ, đủ ba thứ tiếng. Không câu nào nói "đã đặt" hay "thành công": tin đơn là
 * yêu cầu của khách, quán chỉ nhận khi khách bấm Gửi trong Zalo rồi liên hệ lại để xác nhận.
 *   buocGui    bước 2 của dải "Mua thế nào"
 *   nutXemDon  nút gửi form (máy chủ dựng khung "Xem lại đơn")
 *   buocSau    câu dưới nút xem đơn
 *   nutGui     link mở chat Zalo OA
 *   nutChep    nút chép tin đơn (chỉ hiện khi trình duyệt cho chép)
 *   daChep     câu báo sau khi lệnh chép đã xong (await) — không bao giờ trước đó
 *   chepLoi    câu báo khi máy từ chối chép
 *   chepTay    câu chỉ cách chép bằng tay (không JavaScript, không chép tự động được)
 *   sauNut     câu dưới hai nút
 */
export const CHU_DICH: Readonly<Record<CachChuyenGio, Readonly<Record<KhoaChuDich, BaThuTieng>>>> = {
  chep_tin_mo_chat_oa: {
    buocGui: { vi: 'Gửi đơn qua Zalo', en: 'Send the order on Zalo', ko: 'Zalo로 주문 보내기' },
    nutXemDon: { vi: 'Xem đơn và gửi qua Zalo', en: 'Review and send on Zalo', ko: '주문 확인 후 Zalo로 보내기' },
    buocSau: {
      vi: 'Bước sau: xem lại đơn rồi gửi tin đơn trong Zalo.',
      en: 'Next: check your order, then send the order message on Zalo.',
      ko: '다음 단계: 주문을 확인한 뒤 Zalo로 주문 메시지를 보내 주세요.',
    },
    nutGui: { vi: 'Mở chat Zalo với Beeftown', en: 'Open Zalo chat with Beeftown', ko: 'Zalo에서 Beeftown 채팅 열기' },
    nutChep: { vi: 'Chép đơn', en: 'Copy the order', ko: '주문 복사' },
    daChep: { vi: 'Đã chép đơn.', en: 'Order copied.', ko: '주문을 복사했어요.' },
    chepLoi: {
      vi: 'Máy không cho chép tự động: giữ ngón tay lên khung đơn, chọn Chép.',
      en: 'Your device did not let us copy it: press and hold the message, then choose Copy.',
      ko: '자동 복사가 되지 않았어요. 메시지를 길게 눌러 복사를 선택해 주세요.',
    },
    chepTay: {
      vi: 'Chép tay: giữ ngón tay lên khung đơn (hoặc bôi đen), chọn Chép.',
      en: 'To copy it yourself, press and hold the message (or select it), then choose Copy.',
      ko: '직접 복사하려면 메시지를 길게 누르거나 드래그해서 선택한 뒤 복사를 눌러 주세요.',
    },
    sauNut: {
      vi: 'Dán tin vào khung chat và bấm Gửi. Quán chỉ nhận đơn khi bạn gửi tin, rồi liên hệ lại để xác nhận tổng tiền và giờ nhận.',
      en: 'Paste the message into the chat and tap Send. We only get your order once you send it, then we contact you to confirm the total and the time.',
      ko: '채팅창에 메시지를 붙여 넣고 보내기를 눌러 주세요. 메시지를 보내셔야 주문이 접수되고, 매장에서 연락드려 총액과 받으실 시간을 확인해 드려요.',
    },
  },
};
