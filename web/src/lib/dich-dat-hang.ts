/**
 * TRANG MUA THỊT VỀ MỞ HAY CHƯA — VÀ MẪU LINK ZALO OA
 * ==================================================
 * Tên file giữ từ PR 2 (26/10/2026), khi đơn đi qua chat Zalo OA và file này quyết định "đích đặt hàng". Từ 0113
 * (Khánh 03/11/2026: "đã lên website rồi thì cần gì Zalo OA") khách đặt thẳng trên website: đơn ghi vào database
 * (tao_don_mua_thit — lib/dat-hang-mua-thit.ts), nên đích đặt hàng chính là trang. File này còn hai việc:
 *
 *   · muaThitVeMo — trang Mua thịt về có mở không. Điều hướng (trang-cong-khai.ts), mô tả trang và trạng thái trang
 *     cùng đọc một giá trị: công tắc HIỆU LỰC của database (noi_dung_cong_khai, 0101/0113 — công tắc bật VÀ menu web
 *     có gói). Link Zalo không còn là điều kiện.
 *   · laLinkZaloOa — mẫu link chat Zalo OA, trùng từng ký tự la_link_zalo_oa() của database (0101). Khóa zalo_oa_url
 *     vẫn chỉ chủ, vẫn chỉ nhận mẫu này (crm/test/test-mua-thit-ve.mjs nhóm 9 so hai bên).
 *
 * File thuần (chỉ import type): không kéo supabase-js, không đồng hồ, không DOM, không mạng.
 */
import type { NoiDung } from './noi-dung.ts';

/**
 * Link chat của Zalo OA: trùng từng ký tự mẫu của la_link_zalo_oa() (0101) — kiểm thử test-mua-thit-ve.mjs nhóm 9
 * so hai bên trên một bảng mẫu. Chỉ https, chỉ máy chủ zalo.me, đúng một đoạn mã OA, không chuỗi truy vấn, không #.
 */
export const MAU_LINK_ZALO_OA = /^https:\/\/zalo\.me\/[0-9A-Za-z._-]+\/?$/;

/**
 * Link Zalo OA hợp lệ: bỏ khoảng trắng hai đầu rồi so mẫu. Khớp → chuỗi đã bỏ khoảng trắng; không khớp (http, máy
 * chủ khác, đường dẫn con, "javascript:…", không phải chuỗi) → null.
 *
 * Khác lienHe(nd).zalo (trang-cong-khai.ts): link liên hệ thường nhận mọi đường dẫn http(s).
 */
export function laLinkZaloOa(u: unknown): string | null {
  if (typeof u !== 'string') return null;
  const gon = u.trim();
  return MAU_LINK_ZALO_OA.test(gon) ? gon : null;
}

/**
 * Trang Mua thịt về mở: công tắc HIỆU LỰC của database (noi_dung_cong_khai đã gộp công tắc và "có gói trên menu
 * web"). Chỉ đúng boolean true: chưa nối database (null) hay giá trị lạ đều là chưa mở.
 */
export function muaThitVeMo(nd: Pick<NoiDung, 'hien_mua_thit_ve'>): boolean {
  return nd.hien_mua_thit_ve === true;
}
