// 6 phần thịt bán trên Mini App. Tên, đặc điểm, cách nướng lấy theo file vận hành của Sang (02/09/2026).
// Giá: điền số đồng cho 100 g vào giaMoi100g (ví dụ 84500). Để null thì app hiện "Báo giá khi xác nhận đơn".
// Giá đang điền là GIÁ THỬ (Claude đặt 22/10/2026 để thử app), chưa phải giá của Sang.
// Có giá thật thì thay số và đổi giaThu thành false trong cau-hinh.ts.
// Tạm ngưng bán 1 phần: đổi conHang thành false.

import type { BaoQuan } from "./don";

export interface SanPham {
  ma: string;
  ten: string;
  /** "mat" = thịt mát, "dong-lanh" = thịt đông lạnh. Sang dặn không gọi chung cả tủ là thịt mát. */
  baoQuan: BaoQuan;
  /** Nhóm khẩu vị trên bảng chọn bò ở quầy. */
  goiY?: string;
  moTa: string;
  cachNuong?: string;
  giaMoi100g: number | null;
  conHang: boolean;
}

export const SAN_PHAM: SanPham[] = [
  {
    ma: "ribeye-with-cap",
    ten: "Ribeye with Cap",
    baoQuan: "mat",
    goiY: "Mềm mọng",
    moTa: "Mềm nhất trong 6 phần.",
    cachNuong: "Lửa vừa, ăn ở độ tái vừa đến chín vừa.",
    giaMoi100g: 120000,
    conHang: true,
  },
  {
    ma: "outside-skirt",
    ten: "Outside Skirt",
    baoQuan: "mat",
    goiY: "Đậm vị",
    moTa: "Vị đậm nhất trong 6 phần.",
    cachNuong: "Lửa cao, ăn ở độ chín vừa.",
    giaMoi100g: 110000,
    conHang: true,
  },
  {
    ma: "chadolbagi",
    ten: "Chadolbagi",
    baoQuan: "dong-lanh",
    moTa: "Thái lát mỏng.",
    cachNuong: "Lửa cao, lát mỏng nên chín nhanh.",
    giaMoi100g: 45000,
    conHang: true,
  },
  {
    ma: "top-blade",
    ten: "Top Blade",
    baoQuan: "mat",
    moTa: "Có 1 đường gân chạy giữa miếng. Quầy giữ lại có chủ ý, không phải lỗi cắt.",
    giaMoi100g: 65000,
    conHang: true,
  },
  {
    ma: "galbisal",
    ten: "Galbisal",
    baoQuan: "mat",
    moTa: "Thịt sườn đã lóc xương.",
    cachNuong: "Lửa vừa đến cao, ăn ở độ chín vừa trở lên.",
    giaMoi100g: 100000,
    conHang: true,
  },
  {
    ma: "la-galbi",
    ten: "LA Galbi",
    baoQuan: "dong-lanh",
    goiY: "Dễ ăn cả nhà",
    moTa: "Có xương, đã ướp sẵn.",
    cachNuong: "Lửa thấp.",
    giaMoi100g: 60000,
    conHang: true,
  },
];
