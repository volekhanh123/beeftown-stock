/**
 * CÂU CHỮ CỐ ĐỊNH — phần NỀN của trang
 * ====================================
 * Mọi câu trong file này đều là dữ kiện ĐÃ ĐƯỢC XÁC NHẬN, đối chiếu với
 * 02_Brand/Beeftown_Brand_Overview.md v0.10 (20/09/2026) và
 * deliverables/Beeftown_IMC_Plan_v4_2026-09-19.md.
 *
 * Không có công tắc nào tắt được phần này, và cũng không cần — vì không câu
 * nào ở đây phụ thuộc vào một thứ chưa chốt.
 *
 * ĐIỀU KHÔNG ĐƯỢC XUẤT HIỆN Ở ĐÂY:
 *   · giá, ngày mở, giờ phục vụ, số điện thoại — chưa chốt, thuộc cổng nội dung
 *   · "rẻ", lợi thế giá, "best beef in town", "số một", "duy nhất"
 *   · Wagyu, MB9, số ngày ủ, nguồn gốc hay grade thịt
 *   · phòng riêng, chỗ gửi xe — chưa xác nhận
 *   · kinh nghiệm 25 năm của John và Sang gán cho Khánh
 */

import type { NgonNgu } from './noi-dung';

export const THUONG_HIEU = {
  ten: 'Beeftown',
  // Khẩu hiệu tiếng Anh, giữ nguyên ở cả hai bản ngôn ngữ.
  khauHieu: 'Pick it, Grill it, Love it',
  // "Tên ngành hàng đã chốt" — Brand Overview mục 2.
  descriptor: 'Beef Specialty Restaurant',
} as const;

type Bo = Record<string, string>;

const VI: Bo = {
  // --- Phần nền, luôn hiện --------------------------------------------------
  diaChiNgan: 'Quận 1, TP.HCM',
  moTaNgan: 'Nhà hàng chuyên bò tại Quận 1, TP.HCM.',
  gioiThieu:
    'Beeftown đang chuẩn bị tại khu Cầu Ông Lãnh. Chọn bò tại quầy, nói khẩu vị ' +
    'để nhân viên tư vấn, rồi cùng cả bàn thưởng thức. Tụi mình sẽ kể dần câu ' +
    'chuyện trong bếp và cập nhật lịch mở tại đây.',

  // Bản dự phòng khi khóa dong_trang_thai chưa được công bố.
  trangThaiMacDinh:
    'Beeftown đang chuẩn bị đón bạn. Lịch mở cửa sẽ được cập nhật tại đây.',

  theoDoi: 'Theo dõi Beeftown',
  theoDoiPhu: 'Tin mới về bếp, quầy bò và lịch mở cửa',
  nhanTin: 'Nhắn Beeftown',
  chiDuong: 'Chỉ đường',
  goiNhaHang: 'Gọi nhà hàng',
  xemMenu: 'Xem thực đơn',
  datBan: 'Đặt bàn',

  // --- Tuyển dụng -----------------------------------------------------------
  tuyenDungTieuDe: 'Beeftown đang tìm người',
  tuyenDungDan:
    'Nhà hàng đang tuyển cho ngày mở cửa: nhân viên sảnh, bếp, bộ phận thịt và ' +
    'quầy tư vấn. Phần lớn vị trí làm theo ca, nhận cả người chưa có kinh nghiệm.',
  tuyenDungCachNop:
    'Gửi cho Beeftown họ tên, vị trí muốn ứng tuyển và số điện thoại. ' +
    'Nhà hàng sẽ gọi lại để hẹn gặp.',
  tuyenDungXem: 'Xem vị trí đang tuyển',
  tuyenDungChuaMo:
    'Cổng nộp hồ sơ trực tuyến chưa mở. Trong lúc chờ, bạn nhắn trực tiếp cho ' +
    'Beeftown qua Facebook là nhanh nhất.',

  // --- Đặt bàn --------------------------------------------------------------
  datBanChuaMo: 'Beeftown chưa mở đặt bàn trực tuyến',
  datBanChuaMoGiaiThich:
    'Nhà hàng đang hoàn thiện và giờ phục vụ chưa được chốt. Để giữ chỗ, bạn ' +
    'nhắn cho Beeftown qua Facebook — nhà hàng trả lời trong ngày.',

  // --- Chung ----------------------------------------------------------------
  quyenRiengTu: 'Quyền riêng tư',
  doiNgonNgu: 'English',
  banQuyen: 'Beeftown',
  boQuaToiNoiDung: 'Bỏ qua, tới nội dung chính',
};

const EN: Bo = {
  diaChiNgan: 'District 1, Ho Chi Minh City',
  moTaNgan: 'A beef specialty restaurant in District 1, Ho Chi Minh City.',
  gioiThieu:
    'Beeftown is getting ready near Cau Ong Lanh. Pick your beef at the counter, ' +
    'tell us how you like it, and share the table. We will share what happens in ' +
    'the kitchen and post our opening schedule here.',

  trangThaiMacDinh:
    'Beeftown is getting ready to welcome you. Opening hours will be posted here.',

  theoDoi: 'Follow Beeftown',
  theoDoiPhu: 'Updates from the kitchen, the counter, and our opening date',
  nhanTin: 'Message Beeftown',
  chiDuong: 'Directions',
  goiNhaHang: 'Call the restaurant',
  xemMenu: 'View the menu',
  datBan: 'Book a table',

  tuyenDungTieuDe: 'Beeftown is hiring',
  tuyenDungDan:
    'We are hiring for opening day: floor staff, kitchen, meat department and the ' +
    'counter. Most roles are shift-based, and no experience is required for many of them.',
  tuyenDungCachNop:
    'Send us your name, the role you want, and your phone number. ' +
    'We will call you back to arrange a meeting.',
  tuyenDungXem: 'See open roles',
  tuyenDungChuaMo:
    'Online applications are not open yet. For now, the fastest way is to message ' +
    'Beeftown directly on Facebook.',

  datBanChuaMo: 'Online booking is not open yet',
  datBanChuaMoGiaiThich:
    'The restaurant is still being fitted out and our hours are not confirmed. ' +
    'To hold a table, message Beeftown on Facebook — we reply the same day.',

  quyenRiengTu: 'Privacy',
  doiNgonNgu: 'Tiếng Việt',
  banQuyen: 'Beeftown',
  boQuaToiNoiDung: 'Skip to main content',
};

export function chu(ngonNgu: NgonNgu): Bo {
  return ngonNgu === 'en' ? EN : VI;
}

/**
 * CẶP ĐƯỜNG DẪN VIỆT–ANH
 *
 * Phải liệt kê tay, không suy ra được. Đường dẫn tiếng Anh dùng TỪ TIẾNG ANH
 * — /en/jobs chứ không phải /en/tuyen-dung — vì người Anh gõ và đọc đường dẫn
 * đó, và vì Google xếp hạng theo từ khóa trong đường dẫn.
 *
 * Bản đầu tiên của hàm này chỉ ghép '/en' vào trước đường dẫn tiếng Việt.
 * Hệ quả: nút "English" trên trang tuyển dụng trỏ tới /en/tuyen-dung, và
 * trang đó KHÔNG TỒN TẠI — mỗi lượt bấm là một trang 404. Trang chủ thì đúng,
 * nên lỗi không lộ ra ở chỗ dễ thấy nhất.
 *
 * Bảng này là nguồn sự thật cho cả hai chiều và cho cả sitemap, nên thêm một
 * cặp trang mới là sửa đúng một chỗ.
 */
export const CAP_DUONG_DAN: ReadonlyArray<readonly [vi: string, en: string]> = [
  ['/',               '/en'],
  ['/tuyen-dung',     '/en/jobs'],
  ['/dat-ban',        '/en/book'],
  ['/quyen-rieng-tu', '/en/privacy'],
] as const;

/** Đường dẫn tương ứng ở ngôn ngữ kia. Không tìm thấy thì về trang chủ cùng ngôn ngữ. */
export function duongDanNgonNguKhac(duongDan: string, ngonNgu: NgonNgu): string {
  const sach = duongDan.length > 1 ? duongDan.replace(/\/$/, '') : duongDan;
  const cap = CAP_DUONG_DAN.find(([vi, en]) => (ngonNgu === 'en' ? en : vi) === sach);
  if (cap) return ngonNgu === 'en' ? cap[0] : cap[1];
  return ngonNgu === 'en' ? '/' : '/en';
}
