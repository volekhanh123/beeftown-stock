/**
 * BEEFTOWN CÂN — LOGO VÀ BIỂU TƯỢNG CỦA TRANG (bộ nhận diện 21/10/2026, THUONG-HIEU.md mục 0, việc 7)
 *
 * Máy quầy không mạng: trang không tải được /thuong-hieu/… của beeftown.vn. may-chu.ts nhập hai file của web/public thành
 * chuỗi (đóng gói vào .exe): logo phụ trắng chu-beeftown-trang.svg (path gốc của Brand Guidelines 21/10/2026, tách bằng
 * web/cong-cu/thuong-hieu/tach-logo.mjs — không vẽ lại) và biểu tượng cửa sổ bieu-tuong.svg (brandmark đỏ). Hàm này đặt
 * chúng vào trang:
 *   - logo vào chỗ đánh dấu CHO_LOGO ở đầu trang đen — không gõ lại chữ BEEFTOWN bằng phông;
 *   - biểu tượng thay href="data:," (biểu tượng rỗng, để trình duyệt khỏi hỏi /favicon.ico) của thẻ <link rel="icon">.
 * Bỏ chú thích của file SVG (nguồn gốc của path — đã ghi trong file ở web/public). Hàm thuần: kiểm thử Node
 * (crm/test/test-can-nhan-dien.mjs) gọi thẳng với file đọc từ đĩa.
 */

/** Chỗ đánh dấu cho logo phụ trắng trong đầu trang của giao-dien.html và huong-dan.html. */
export const CHO_LOGO = '<!--logo-phu-trang-->';
/** Thẻ biểu tượng cửa sổ của hai trang trước khi gắn brandmark. */
export const THE_BIEU_TUONG_RONG = '<link rel="icon" href="data:,">';

const boChuThich = (svg: string): string => svg.replace(/<!--[\s\S]*?-->/g, '').trim();

/** Trang (giao-dien.html / huong-dan.html) → trang có logo phụ trắng ở đầu trang và brandmark làm biểu tượng cửa sổ. */
export function ganNhanDien(trang: string, logoPhuTrang: string, bieuTuong: string): string {
  const logo = boChuThich(logoPhuTrang);
  const icon = `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(boChuThich(bieuTuong))}">`;
  // split / join và hàm thay: chuỗi SVG có "$" cũng không bị String.replace hiểu thành mẫu thay.
  return trang.split(CHO_LOGO).join(logo).replace(THE_BIEU_TUONG_RONG, () => icon);
}
