// FILE SINH TỰ ĐỘNG bởi web/cong-cu/anh/tao-co-anh.py — đừng sửa tay.
// Mỗi ảnh: các khung đã cắt (vd. '4x3', '4x5'), cỡ lớn nhất của khung, các bề
// rộng đã xuất (avif + webp) và màu trung bình của ảnh (trang chưa dùng: nền chờ
// của khung ảnh lấy màu trong bảng màu — xem components/Anh.astro).
export interface CoAnh {
  rong: number;
  cao: number;
  cac: readonly number[];
  mau: string;
}

export const ANH_TAO_SAN: Readonly<Record<string, Readonly<Record<string, CoAnh>>>> = {
  'hero-vi-gas': {
    '4x3': { rong: 1254, cao: 940, cac: [640, 960, 1254], mau: '#A37D61' },
    '4x5': { rong: 1121, cao: 1401, cac: [480, 720, 1121], mau: '#997055' },
  },
  'bo-van-mo-can': {
    '4x5': { rong: 1121, cao: 1401, cac: [480, 800, 1121], mau: '#CB9886' },
    '1x1': { rong: 1122, cao: 1122, cac: [480, 800, 1122], mau: '#C89183' },
  },
  'bo-cat-lat': {
    '3x2': { rong: 1200, cao: 800, cac: [480, 800, 1200], mau: '#AF8264' },
  },
  'sot-cham': {
    '4x3': { rong: 1200, cao: 900, cac: [480, 800, 1200], mau: '#A5845F' },
  },
  'mon-an-chia-se': {
    '3x2': { rong: 1200, cao: 800, cac: [480, 800, 1200], mau: '#AE885F' },
    '4x3': { rong: 1200, cao: 900, cac: [480, 800, 1200], mau: '#AD875D' },
  },
  'bua-an-cung-ban': {
    '3x2': { rong: 1200, cao: 800, cac: [480, 800, 1200], mau: '#A27D5B' },
    '4x3': { rong: 1200, cao: 900, cac: [480, 800, 1200], mau: '#A37D59' },
  },
};
