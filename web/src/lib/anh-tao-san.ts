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
    '4x5': { rong: 1121, cao: 1401, cac: [480, 720, 1121], mau: '#98725B' },
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
  'mon-tartare-bo-hoa-tuyet': {
    '1x1': { rong: 800, cao: 800, cac: [480, 800], mau: '#B67562' },
  },
  'mon-com-tron-tartare-bo-cay': {
    '1x1': { rong: 800, cao: 800, cac: [480, 800], mau: '#986C46' },
  },
  'mon-lau-kim-chi': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#D5B494' },
  },
  'mon-lau-bo-bulgogi': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#CABAA0' },
  },
  'mon-lau-nam': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C9B99C' },
  },
  'mon-set-4-sot': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#A79878' },
  },
  'mon-salad-nam': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#D0BB9A' },
  },
  'mon-caesar-salad': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#D5C9A4' },
  },
  'mon-mien-tron-han': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#B1997E' },
  },
  'mon-trung-hap-nui-lua': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#CFC0A2' },
  },
  'mon-khoai-tay-chien-sot-bo': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#D6B99C' },
  },
  'mon-banh-gao-chien-pho-mai': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C9B498' },
  },
  'mon-canh-kim-chi': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C1A68D' },
  },
  'mon-dau-phu-ham': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C3A88F' },
  },
  'mon-canh-tuong-dau': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#BDAC93' },
  },
  'mon-com-kim-chi-bo': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#DBBE9E' },
  },
  'mon-com-tron-han': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C2AF96' },
  },
  'mon-com-tron-trung-ca': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#CBB698' },
  },
  'mon-mi-lanh-cay': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#CEB69C' },
  },
  'mon-mi-toowoomba': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C8B89E' },
  },
  'mon-mi-carbonara': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C2AD91' },
  },
  'mon-mi-bo-sot-ca': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#BAA088' },
  },
  'uong-milky-cloud-makgeolli': {
    '4x5': { rong: 640, cao: 800, cac: [400, 640], mau: '#DEC9B0' },
  },
  'uong-strawberry-crush': {
    '4x5': { rong: 640, cao: 800, cac: [400, 640], mau: '#E3BCA7' },
  },
  'uong-berry-rouge-highball': {
    '4x5': { rong: 640, cao: 800, cac: [400, 640], mau: '#C49D8D' },
  },
  'uong-khong-con-ba-ly': {
    '3x2': { rong: 800, cao: 533, cac: [480, 800], mau: '#EED098' },
  },
};
