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
    '4x5': { rong: 320, cao: 400, cac: [200, 320], mau: '#985F4F' },
  },
  'mon-com-tron-tartare-bo-cay': {
    '1x1': { rong: 800, cao: 800, cac: [480, 800], mau: '#986C46' },
    '4x5': { rong: 320, cao: 400, cac: [200, 320], mau: '#7B5437' },
  },
  'mon-lau-kim-chi': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#D5B494' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#D6B595' },
  },
  'mon-lau-bo-bulgogi': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#CABAA0' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#CDBCA3' },
  },
  'mon-lau-nam': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C9B99C' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#CBBB9F' },
  },
  'mon-set-4-sot': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#A79878' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#BCAD91' },
  },
  'mon-salad-nam': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#D0BB9A' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#CDB796' },
  },
  'mon-caesar-salad': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#D5C9A4' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#D3C7A0' },
  },
  'mon-mien-tron-han': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#B1997E' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#B69F85' },
  },
  'mon-trung-hap-nui-lua': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#CFC0A2' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#CCBD9D' },
  },
  'mon-khoai-tay-chien-sot-bo': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#D6B99C' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#D4B597' },
  },
  'mon-banh-gao-chien-pho-mai': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C9B498' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#C5AF93' },
  },
  'mon-canh-kim-chi': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C1A68D' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#BDA087' },
  },
  'mon-dau-phu-ham': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C3A88F' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#BFA38A' },
  },
  'mon-canh-tuong-dau': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#BDAC93' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#B8A78E' },
  },
  'mon-com-kim-chi-bo': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#DBBE9E' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#DABB9A' },
  },
  'mon-com-tron-han': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C2AF96' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#BEAB91' },
  },
  'mon-com-tron-trung-ca': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#CBB698' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#C8B293' },
  },
  'mon-mi-lanh-cay': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#CEB69C' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#CCB298' },
  },
  'mon-mi-toowoomba': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C8B89E' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#C5B49A' },
  },
  'mon-mi-carbonara': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#C2AD91' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#C3AE91' },
  },
  'mon-mi-bo-sot-ca': {
    '4x3': { rong: 800, cao: 600, cac: [480, 800], mau: '#BAA088' },
    '1x1': { rong: 320, cao: 320, cac: [200, 320], mau: '#BBA28A' },
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
