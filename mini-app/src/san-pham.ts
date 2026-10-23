// 6 phần thịt bán trên Mini App. Tên, đặc điểm, cách nướng lấy theo file vận hành của Sang (02/09/2026).
// Bán theo khay, giá cố định (Khánh quyết 22/10/2026): không bán đúng số gam. Mỗi khay khoảng soGamKhay gam, giá
// giaMoiKhay đồng, không đổi theo số gam thật của khay. Để giaMoiKhay null thì app hiện "Báo giá khi xác nhận đơn".
// Số gam và giá đang điền là SỐ THỬ (Claude đặt 22/10/2026): Ribeye theo ví dụ của Khánh (~150 g, 300.000 đ), phần
// khác giữ tỷ lệ với giá thử theo 100 g trước đó. Chưa phải số của Sang.
// Có số thật thì thay số và đổi giaThu thành false trong cau-hinh.ts.
// Tạm ngưng bán 1 phần: đổi conHang thành false.

import type { BaoQuan, DongDon } from "./don";

export interface SanPham {
  ma: string;
  ten: string;
  /** "mat" = thịt mát, "dong-lanh" = thịt đông lạnh. Sang dặn không gọi chung cả tủ là thịt mát. */
  baoQuan: BaoQuan;
  /** Nhóm khẩu vị trên bảng chọn bò ở quầy. */
  goiY?: string;
  moTa: string;
  cachNuong?: string;
  /** Số gam khoảng của 1 khay, hiện là "~150 g". */
  soGamKhay: number;
  /** Giá cố định của 1 khay (đồng). */
  giaMoiKhay: number | null;
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
    soGamKhay: 150,
    giaMoiKhay: 300000,
    conHang: true,
  },
  {
    ma: "outside-skirt",
    ten: "Outside Skirt",
    baoQuan: "mat",
    goiY: "Đậm vị",
    moTa: "Vị đậm nhất trong 6 phần.",
    cachNuong: "Lửa cao, ăn ở độ chín vừa.",
    soGamKhay: 150,
    giaMoiKhay: 275000,
    conHang: true,
  },
  {
    ma: "chadolbagi",
    ten: "Chadolbagi",
    baoQuan: "dong-lanh",
    moTa: "Thái lát mỏng.",
    cachNuong: "Lửa cao, lát mỏng nên chín nhanh.",
    soGamKhay: 150,
    giaMoiKhay: 115000,
    conHang: true,
  },
  {
    ma: "top-blade",
    ten: "Top Blade",
    baoQuan: "mat",
    moTa: "Có 1 đường gân chạy giữa miếng. Quầy giữ lại có chủ ý, không phải lỗi cắt.",
    soGamKhay: 150,
    giaMoiKhay: 165000,
    conHang: true,
  },
  {
    ma: "galbisal",
    ten: "Galbisal",
    baoQuan: "mat",
    moTa: "Thịt sườn đã lóc xương.",
    cachNuong: "Lửa vừa đến cao, ăn ở độ chín vừa trở lên.",
    soGamKhay: 150,
    giaMoiKhay: 250000,
    conHang: true,
  },
  {
    ma: "la-galbi",
    ten: "LA Galbi",
    baoQuan: "dong-lanh",
    goiY: "Dễ ăn cả nhà",
    moTa: "Có xương, đã ướp sẵn.",
    cachNuong: "Lửa thấp.",
    soGamKhay: 150,
    giaMoiKhay: 150000,
    conHang: true,
  },
];

/** Các dòng đơn từ giỏ hàng (mã phần thịt → số khay), theo thứ tự của SAN_PHAM. */
export function dongTuGio(soKhay: Record<string, number>): DongDon[] {
  return SAN_PHAM.filter((sp) => (soKhay[sp.ma] ?? 0) > 0).map((sp) => ({
    ten: sp.ten,
    baoQuan: sp.baoQuan,
    soKhay: soKhay[sp.ma],
    soGamKhay: sp.soGamKhay,
    giaMoiKhay: sp.giaMoiKhay,
  }));
}
