// Cấu hình của quán. Sửa ở đây rồi chạy lại "npm run deploy:thu".
// Mỗi lần deploy là 1 phiên bản mới; phiên bản mới phải gửi Zalo duyệt lại mới tới tay khách.

import type { CauHinhGio, KhungGio } from "./don";

export const CAU_HINH = {
  /**
   * OA ID của OA "Nhà hàng Beeftown Hồ Tùng Mậu" (dãy số).
   * Lấy ở oa.zalo.me → chọn OA → mục Thông tin OA. Để trống thì nút "Gửi đơn qua Zalo" báo lỗi.
   */
  oaId: "3030027075662095415",

  /**
   * true khi giá trong san-pham.ts là giá thử: app ghi "Giá thử" cạnh từng giá, hiện 1 dòng báo ở trang chủ
   * và ghi vào tin đơn để nhân viên biết. Có giá thật của Sang thì đổi thành false.
   */
  giaThu: true,

  /** Ngày đầu tiên quán nhận hàng (yyyy-mm-dd). Trước ngày này, khách chỉ chọn được từ ngày này trở đi. */
  ngayBatDauNhanHang: "2026-11-13",

  /** Khung giờ khách được chọn để nhận hàng. Giờ mở cửa theo file vận hành của Sang 02/09: 10:00–14:00 và 16:00–22:00. */
  khungGioNhan: [
    { tu: "10:30", den: "13:30" },
    { tu: "16:30", den: "21:00" },
  ] as KhungGio[],

  /** Khoảng cách giữa 2 mốc giờ trong ô chọn giờ. */
  buocPhut: 30,

  /** Giờ nhận sớm nhất trong ngày = bây giờ + số phút này (thời gian soạn khay). */
  soPhutChuanBi: 60,

  /** Số ngày khách được chọn, tính từ ngày gần nhất còn giờ nhận. */
  soNgayChoChon: 7,

  /** Số khay tối đa mỗi phần thịt trong 1 đơn. */
  soKhayToiDa: 10,

  gioMoCua: "10:00–14:00 và 16:00–22:00, mỗi ngày",
  diaChi: "63 Hồ Tùng Mậu, phường Sài Gòn, TP.HCM",
  chiDuong: "Lối vào riêng ngay cạnh GS25, đi thang máy lên quán.",

  /** Để trống thì app không hiện số điện thoại. */
  hotline: "",
  website: "beeftown.vn",

  /**
   * Còn hàng ở quầy theo kho (website, migration 0093). Để trống thì app không hỏi và hiện mọi phần như cũ.
   * Tên miền phải khai ở Mini App Center → Cấu hình API Domains, không thì Zalo chặn và app cũng hiện như cũ.
   * Website chỉ trả trạng thái khi chủ bật công tắc "mini_app_hien_con_hang" ở /noi-bo.
   */
  diaChiConHang: "https://beeftown.vn/mini-app/con-hang.json",

  /** Thông tin người bán, ghi đúng giấy chứng nhận đăng ký địa điểm kinh doanh (thay đổi lần 2, 20/10/2026). */
  phapNhan: {
    ten: "Công ty TNHH SLK Group",
    maSoDoanhNghiep: "0319712805",
    diaDiemKinhDoanh: "Địa điểm kinh doanh Công ty TNHH SLK Group – Nhà hàng Beeftown",
    diaChiDiaDiem: "Tầng 4, Số 63 Hồ Tùng Mậu, Phường Sài Gòn, TP.HCM",
  },
};

export const CAU_HINH_GIO: CauHinhGio = {
  ngayBatDauNhanHang: CAU_HINH.ngayBatDauNhanHang,
  khungGioNhan: CAU_HINH.khungGioNhan,
  buocPhut: CAU_HINH.buocPhut,
  soPhutChuanBi: CAU_HINH.soPhutChuanBi,
  soNgayChoChon: CAU_HINH.soNgayChoChon,
};
