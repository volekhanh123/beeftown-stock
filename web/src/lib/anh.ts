/**
 * ẢNH CỦA TRANG CÔNG KHAI
 * =======================
 * Hai loại ảnh, hai quy tắc:
 *
 *  · ẢNH MINH HỌA (minhHoa: true) — ảnh tạo bằng công cụ AI. Tám ảnh hiện có do ChatGPT
 *    tạo ngày 11/10/2026 (gọi qua Codex), Khánh cho đưa lên trang cùng ngày. CHỈ dùng
 *    cho không khí món và bữa ăn: bò trên vỉ gas, vân thịt, lát bò, sốt chấm, bàn ăn
 *    chung. Trên trang LUÔN có dòng "Ảnh minh họa" (component <Anh> tự gắn).
 *      - Bàn tay người trong ảnh thì được; MẶT NGƯỜI thì không.
 *      - Hai ảnh bữa ăn (mon-an-chia-se, bua-an-cung-ban) có kim chi và nhiều chén món
 *        phụ: đó là hình minh họa Khánh cho dùng, KHÔNG phải lời hứa quán dọn đúng các
 *        món đó — câu chữ và alt không kể tên, không hứa món phụ nào.
 *      - Không bao giờ dùng ảnh AI cho quầy, khay skin-pack, không gian quán, lối vào,
 *        thang máy hay mặt người — những chỗ đó dùng KhungAnh cho tới khi có ảnh chụp thật.
 *  · ẢNH THẬT (minhHoa: false) — ảnh chụp tại Beeftown. Chưa có tấm nào.
 *
 * ẢNH MÓN CỦA TRANG THỰC ĐƠN (26 id mon-…, uong-…) — lấy từ cuốn menu in "bản sáng"
 * (artifact "Beeftown — Menu", Cuốn C nền sáng, Version 45, Khánh chốt 11/10/2026). Vẫn là
 * ẢNH MINH HỌA, trang vẫn ghi "Ảnh minh họa":
 *  · 21 ảnh món ăn và ảnh ba ly không cồn: ảnh AI tạo qua cầu nối Codex ngày 09–11/10/2026
 *    rồi tách nền (tachNen: true — trang đặt thẳng lên nền kem như trong cuốn).
 *  · Ba ly signature (tách nền) và hai món tartare (ảnh có nền bàn): lấy từ menu chuẩn
 *    29/09 của quán; ghi chú dự án gọi là "ảnh đã duyệt" nhưng CHƯA rõ là ảnh chụp thật hay
 *    ảnh dựng — chưa rõ thì vẫn gắn nhãn minh họa. Có ảnh chụp thật thì đổi minhHoa và nguồn.
 *  Alt tả đúng thứ nhìn thấy, không đếm số món / số ly, không giá, không kể tên món phụ (kể cả
 *  khi món phụ là một phần của món chính: alt không viết chữ "kim chi").
 *
 * Cỡ ảnh do web/cong-cu/anh/tao-co-anh.py dựng sẵn vào public/anh/ (avif + webp,
 * nhiều bề rộng) và ghi danh sách vào anh-tao-san.ts. Id có trong DANH_MUC_ANH mà
 * chưa có trong anh-tao-san.ts thì component <Anh> hiện KhungAnh thay vào — trang
 * vẫn đủ, không có ảnh hỏng. (bo-xeo-vi đang ở trạng thái đó: ảnh dự phòng, chưa đặt
 * ở trang nào nên chưa dựng cỡ — web/cong-cu/anh/danh-sach.json, mục "du_phong".)
 */
import type { BaThuTieng } from './chu';
import type { NgonNgu } from './noi-dung';
import { ANH_TAO_SAN, type CoAnh } from './anh-tao-san.ts';

export type IdAnh = 'hero-vi-gas' | 'bo-van-mo-can' | 'bo-cat-lat' | 'sot-cham' | 'mon-an-chia-se' | 'bua-an-cung-ban' | 'bo-xeo-vi'
  | 'mon-tartare-bo-hoa-tuyet' | 'mon-com-tron-tartare-bo-cay'
  | 'mon-lau-kim-chi' | 'mon-lau-bo-bulgogi' | 'mon-lau-nam' | 'mon-set-4-sot'
  | 'mon-salad-nam' | 'mon-caesar-salad' | 'mon-mien-tron-han'
  | 'mon-trung-hap-nui-lua' | 'mon-khoai-tay-chien-sot-bo' | 'mon-banh-gao-chien-pho-mai'
  | 'mon-canh-kim-chi' | 'mon-dau-phu-ham' | 'mon-canh-tuong-dau'
  | 'mon-com-kim-chi-bo' | 'mon-com-tron-han' | 'mon-com-tron-trung-ca'
  | 'mon-mi-lanh-cay' | 'mon-mi-toowoomba' | 'mon-mi-carbonara' | 'mon-mi-bo-sot-ca'
  | 'uong-milky-cloud-makgeolli' | 'uong-strawberry-crush' | 'uong-berry-rouge-highball' | 'uong-khong-con-ba-ly';

export interface MoTaAnh {
  /** Ảnh tạo bằng AI — trang phải ghi "Ảnh minh họa" ngay trên ảnh. */
  minhHoa: boolean;
  /**
   * Ảnh tách nền (kênh trong suốt, bóng đổ có sẵn trong ảnh): khung không có nền chờ, không bo góc;
   * tao-co-anh.py chừa sẵn một dải trống ở đáy khung — nhãn "Ảnh minh họa" nằm trong dải đó, ngay dưới
   * món, không đè lên món.
   */
  tachNen?: boolean;
  /** Mô tả cho trình đọc màn hình. Tả món, không nói đây là ảnh chụp tại quán. */
  alt: BaThuTieng;
}

export const DANH_MUC_ANH: Readonly<Record<IdAnh, MoTaAnh>> = {
  // Một alt cho cả hai khung. Bản ngang (màn rộng) và bản dọc (điện thoại) là hai file tạo riêng nhưng
  // cùng một cảnh: vỉ lưới thép, bàn tay cầm kẹp từ bên trái, đĩa bò sống, chén sốt, rau xà lách.
  'hero-vi-gas': {
    minhHoa: true,
    alt: {
      vi: 'Một bàn tay cầm kẹp đặt lát bò lên vỉ gas tròn giữa bàn gỗ sáng, cạnh đĩa bò sống, chén sốt và rau xà lách.',
      en: 'A hand with tongs lays a slice of beef on a round gas grill set into a light wood table, beside a plate of raw beef, a bowl of sauce and lettuce.',
      ko: '밝은 나무 테이블 가운데 둥근 가스 그릴 위에 집게로 소고기를 올리는 손, 옆에는 생고기 접시와 소스, 상추가 놓여 있어요.',
    },
  },
  'bo-van-mo-can': {
    minhHoa: true,
    alt: {
      vi: 'Cận cảnh một miếng bò sống dày, vân mỡ trắng xen giữa thớ thịt đỏ, đặt trên giấy lót màu kem.',
      en: 'Close-up of a thick cut of raw beef, white marbling running through the red meat, resting on cream paper.',
      ko: '크림색 종이 위에 놓인 두툼한 생 소고기 한 덩이, 붉은 살 사이로 하얀 마블링이 보여요.',
    },
  },
  'bo-cat-lat': {
    minhHoa: true,
    alt: {
      vi: 'Những lát bò sống có vân mỡ xếp trên đĩa sứ màu kem, bên cạnh là chiếc kẹp gắp.',
      en: 'Slices of marbled raw beef fanned out on a cream ceramic plate, with a pair of tongs beside it.',
      ko: '크림색 도자기 접시에 가지런히 놓인 마블링 생 소고기 슬라이스, 옆에는 집게가 있어요.',
    },
  },
  // Alt không đếm số chén sốt: set sốt thật chưa chốt số loại (test-cong-khai-anh.mjs chặn số lượng món ở mọi alt).
  'sot-cham': {
    minhHoa: true,
    alt: {
      vi: 'Mấy chén sốt chấm đặt trước đĩa bò nướng cắt lát và lá xà lách.',
      en: 'Small bowls of dipping sauce in front of a plate of sliced grilled beef and lettuce leaves.',
      ko: '얇게 썬 구운 소고기와 상추가 담긴 접시 앞에 소스 그릇들이 놓여 있어요.',
    },
  },
  // Hai ảnh bữa ăn: alt tả chung "các chén món phụ", không kể tên từng món — trang không hứa món phụ nào.
  'mon-an-chia-se': {
    minhHoa: true,
    alt: {
      vi: 'Đĩa bò nướng cắt lát đặt giữa bàn gỗ sáng, xung quanh là salad, cơm, canh và các chén món phụ.',
      en: 'A plate of sliced grilled beef in the middle of a light wood table, surrounded by salad, rice, soup and small side dishes.',
      ko: '밝은 나무 테이블 가운데 얇게 썬 구운 소고기 접시, 주위에 샐러드와 밥, 국, 작은 곁들임 그릇들이 놓여 있어요.',
    },
  },
  'bua-an-cung-ban': {
    minhHoa: true,
    alt: {
      vi: 'Nhiều bàn tay cùng gắp bò nướng trên vỉ gas tròn giữa bàn, xung quanh là cơm, rau cuốn và các chén món phụ.',
      en: 'Several hands share grilled beef from a round gas grill in the middle of the table, with rice, lettuce and small side dishes around it.',
      ko: '테이블 가운데 둥근 가스 그릴에서 여러 사람의 손이 구운 소고기를 함께 집고 있고, 주위에 밥과 쌈 채소, 곁들임 그릇들이 놓여 있어요.',
    },
  },
  // Ảnh dự phòng: chưa đặt ở trang nào, chưa dựng cỡ.
  'bo-xeo-vi': {
    minhHoa: true,
    alt: {
      vi: 'Những lát bò đang chín trên vỉ gas tròn viền thép, mặt thịt vàng nâu và một làn hơi nóng.',
      en: 'Slices of beef cooking on a round steel-rimmed gas grill, browned on top, with a wisp of steam.',
      ko: '둥근 가스 그릴 위에서 노릇하게 익어 가는 소고기, 김이 살짝 피어올라요.',
    },
  },

  // --- Ảnh món của trang Thực đơn (cuốn menu bản sáng) — xem đầu file --------------------------------
  // Hai món tartare: ảnh có nền bàn gỗ (không tách nền), cắt vuông quanh đĩa / bát.
  'mon-tartare-bo-hoa-tuyet': {
    minhHoa: true,
    alt: {
      vi: 'Những lát bò sống xếp như cánh hoa trên đĩa gốm màu kem, phủ phô mai bào mịn, lòng đỏ trứng ở giữa.',
      en: 'Slices of raw beef arranged like petals on a cream ceramic plate, under finely grated cheese, with an egg yolk in the centre.',
      ko: '크림색 접시에 꽃잎처럼 펼친 생소고기 위로 곱게 간 치즈를 뿌리고 가운데 노른자를 올렸어요.',
    },
  },
  'mon-com-tron-tartare-bo-cay': {
    minhHoa: true,
    alt: {
      vi: 'Bát gốm màu kem với cơm, bò sống băm sợi phủ lòng đỏ trứng, cà rốt, dưa leo thái sợi, rau xanh và sốt ớt đỏ.',
      en: 'A cream ceramic bowl of rice with shredded raw beef under an egg yolk, carrot, julienned cucumber, greens and red chili sauce.',
      ko: '크림색 그릇에 밥과 노른자를 올린 생소고기, 당근, 채 썬 오이, 채소와 빨간 고추 양념이 담겨 있어요.',
    },
  },
  // Từ đây là ảnh tách nền.
  'mon-lau-kim-chi': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Nồi lẩu inox nước dùng đỏ với thịt heo, đậu hũ, nấm kim châm, ớt và hành lá.',
      en: 'A steel hot pot of red broth with pork, tofu, enoki mushrooms, chili and spring onion.',
      ko: '스테인리스 냄비에 빨간 국물과 돼지고기, 두부, 팽이버섯, 고추, 파가 담겨 있어요.',
    },
  },
  'mon-lau-bo-bulgogi': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Nồi lẩu inox có quai với bò thái mỏng, miến, hành tây, nấm kim châm, nấm đông cô và đậu hũ trong nước dùng trong.',
      en: 'A steel hot pot of thin-sliced beef, glass noodles, onion, enoki, shiitake and tofu in a clear broth.',
      ko: '손잡이 달린 스테인리스 냄비에 얇게 썬 소고기, 당면, 양파, 팽이버섯, 표고버섯, 두부가 맑은 국물에 담겨 있어요.',
    },
  },
  'mon-lau-nam': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Nồi lẩu inox với nhiều loại nấm, đậu hũ, cải thảo và hành lá trong nước dùng trong.',
      en: 'A steel hot pot of assorted mushrooms, tofu, napa cabbage and spring onion in a clear broth.',
      ko: '스테인리스 냄비에 여러 가지 버섯과 두부, 배추, 파를 맑은 국물에 넣었어요.',
    },
  },
  // Alt không đếm số chén sốt (cùng luật với sot-cham) và không kể tên món phụ trên khay.
  'mon-set-4-sot': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Khay đen với các chén sốt màu vàng, nâu và đỏ, bên cạnh là xà lách, lá tía tô, dưa leo và cà rốt cắt que.',
      en: 'A black tray of small sauce bowls in yellow, brown and red, with lettuce, perilla leaves and cucumber and carrot sticks.',
      ko: '검은 트레이에 노란색, 갈색, 빨간색 소스 종지와 상추, 깻잎, 오이와 당근 스틱이 담겨 있어요.',
    },
  },
  'mon-salad-nam': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Bát màu kem đựng rau xanh, nấm nướng thái lát và cà chua bi, rưới sốt.',
      en: 'A cream bowl of mixed greens with sliced grilled mushrooms, cherry tomatoes and dressing.',
      ko: '크림색 볼에 채소와 구운 버섯 슬라이스, 방울토마토를 담고 드레싱을 뿌렸어요.',
    },
  },
  'mon-caesar-salad': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Bát màu kem đựng xà lách romaine, bánh mì nướng giòn, phô mai bào lát mỏng và sốt Caesar.',
      en: 'A cream bowl of romaine, crunchy croutons, shaved cheese and Caesar dressing.',
      ko: '크림색 볼에 로메인, 바삭한 크루통, 얇게 깎은 치즈와 시저 드레싱을 버무렸어요.',
    },
  },
  'mon-mien-tron-han': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Miến xào với bò, rau chân vịt, cà rốt, hành tây và nấm trên chảo đen đặt trên đế gỗ.',
      en: 'Glass noodles stir-fried with beef, spinach, carrot, onion and mushrooms on a black sizzling plate set on a wooden board.',
      ko: '나무 받침 위 검은 철판에 소고기, 시금치, 당근, 양파, 버섯과 함께 볶은 당면이 담겨 있어요.',
    },
  },
  'mon-trung-hap-nui-lua': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Trứng hấp phồng cao trong thố đá đen, rắc hành lá, cà rốt và mè.',
      en: 'Fluffy steamed egg puffed high in a black stone pot, sprinkled with spring onion, carrot and sesame.',
      ko: '검은 뚝배기에 봉긋하게 부풀어 오른 계란찜 위로 파, 당근, 참깨를 뿌렸어요.',
    },
  },
  'mon-khoai-tay-chien-sot-bo': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Đĩa khoai tây chiên phủ sốt bò bằm, bên cạnh là cốc nhỏ sốt phô mai màu vàng.',
      en: 'A plate of fries topped with minced beef sauce, with a small cup of yellow cheese sauce.',
      ko: '감자튀김 위에 다진 소고기 소스를 듬뿍 올린 접시, 옆에 노란 치즈 소스 컵이 놓여 있어요.',
    },
  },
  'mon-banh-gao-chien-pho-mai': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Những miếng bánh gạo chiên vàng giòn rắc bột đậu nành rang trên đĩa đen, một miếng tách đôi để lộ phô mai kéo sợi.',
      en: 'Golden fried rice cakes dusted with roasted soybean powder on a black plate, one pulled apart to show stretchy cheese.',
      ko: '검은 접시에 볶은 콩가루를 뿌린 노릇한 떡튀김이 담겨 있고, 하나는 갈라져 치즈가 쭉 늘어나요.',
    },
  },
  'mon-canh-kim-chi': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Canh nước đỏ trong thố đá đen với đậu hũ, thịt heo, hành lá và ớt cắt lát.',
      en: 'A red stew in a black stone pot with tofu, pork, spring onion and sliced chili.',
      ko: '검은 뚝배기에 두부, 돼지고기, 파, 고추를 넣고 끓인 빨간 찌개가 담겨 있어요.',
    },
  },
  'mon-dau-phu-ham': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Đậu hũ non trong nước dùng đỏ cay ở thố đá đen, có nghêu, lòng đỏ trứng, ớt và hành lá.',
      en: 'Soft tofu in a red, spicy broth in a black stone pot, with clams, an egg yolk, chili and spring onion.',
      ko: '검은 뚝배기에 빨갛고 매콤한 국물과 순두부, 조개, 계란 노른자, 고추, 파가 담겨 있어요.',
    },
  },
  'mon-canh-tuong-dau': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Canh tương đậu nâu vàng trong thố đá đen với đậu hũ, bí ngòi, nấm đông cô, ớt xanh và ớt đỏ.',
      en: 'Golden-brown soybean paste stew in a black stone pot with tofu, courgette, shiitake and green and red chili.',
      ko: '검은 뚝배기에 두부, 애호박, 표고버섯, 풋고추와 홍고추를 넣고 끓인 된장찌개가 담겨 있어요.',
    },
  },
  'mon-com-kim-chi-bo': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Đĩa cơm rang màu đỏ cam với bò và hành lá, trên cùng là quả trứng ốp la.',
      en: 'A plate of red-orange fried rice with beef and spring onion, topped with a sunny-side-up egg.',
      ko: '크림색 접시에 소고기와 파를 넣고 볶은 붉은 볶음밥, 그 위에 계란 프라이가 올라가 있어요.',
    },
  },
  'mon-com-tron-han': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Bát đá đen với cơm, bò, rau chân vịt, cà rốt, bí ngòi, nấm và trứng ốp la, bên cạnh là chén tương ớt nhỏ.',
      en: 'A black stone bowl of rice topped with beef, spinach, carrot, courgette, mushrooms and a fried egg, with a small dish of chili paste.',
      ko: '검은 돌솥에 밥과 소고기, 시금치, 당근, 애호박, 버섯, 계란 프라이를 올렸고, 옆에 고추장 종지가 놓여 있어요.',
    },
  },
  'mon-com-tron-trung-ca': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Bát đá đen với cơm phủ phô mai chảy, trứng cá màu cam, rong biển vụn và rau củ cắt hạt lựu.',
      en: 'A black stone bowl of rice under melted cheese, orange fish roe, shredded nori and diced crunchy vegetables.',
      ko: '검은 돌솥에 밥을 담고 녹은 치즈, 주황색 날치알, 김가루와 깍둑 썬 채소를 올렸어요.',
    },
  },
  'mon-mi-lanh-cay': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Bát inox đựng mì lạnh trộn sốt ớt đỏ với đá bào, dưa leo thái sợi và nửa quả trứng luộc.',
      en: 'Cold noodles in red chili sauce in a steel bowl, with shaved ice, cucumber strips and half a boiled egg.',
      ko: '스테인리스 그릇에 빨간 양념 냉면과 살얼음, 채 썬 오이, 삶은 계란 반쪽을 담았어요.',
    },
  },
  'mon-mi-toowoomba': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Đĩa đen với mì sốt kem, tôm, nấm, rau mùi tây và tiêu đen.',
      en: 'Creamy pasta with shrimp, mushrooms, parsley and black pepper on a black plate.',
      ko: '검은 접시에 새우와 버섯을 넣은 크림 파스타를 담고 파슬리와 후추를 뿌렸어요.',
    },
  },
  'mon-mi-carbonara': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Đĩa đen với mì spaghetti sốt trứng phô mai, thịt muối thái hạt lựu, tiêu đen và lòng đỏ trứng ở giữa.',
      en: 'Spaghetti in an egg and cheese sauce on a black plate, with diced bacon, black pepper and an egg yolk on top.',
      ko: '검은 접시에 계란과 치즈 소스 스파게티를 담고 베이컨, 후추, 노른자를 올렸어요.',
    },
  },
  'mon-mi-bo-sot-ca': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Đĩa đen với mì spaghetti sốt cà chua bò bằm, phô mai bào và lá húng quế.',
      en: 'Spaghetti in a tomato and minced beef sauce on a black plate, with grated cheese and basil.',
      ko: '검은 접시에 다진 소고기 토마토소스 스파게티를 담고 치즈 가루와 바질을 올렸어요.',
    },
  },
  'uong-milky-cloud-makgeolli': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Ly chân thấp đựng thức uống màu trắng sữa, rắc kẹo nghiền màu hổ phách và một nhánh bạc hà.',
      en: 'A stemmed glass of milky white drink topped with crushed amber candy and a sprig of mint.',
      ko: '굽 있는 잔에 우윳빛 음료를 담고 잘게 부순 호박색 사탕과 민트를 올렸어요.',
    },
  },
  'uong-strawberry-crush': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Ly cao đựng nước màu hồng đỏ có ga, đá viên, dâu sấy phía trên và nhánh bạc hà.',
      en: 'A tall glass of pink-red sparkling drink with ice, dried strawberry on top and a sprig of mint.',
      ko: '키 큰 잔에 얼음을 넣은 분홍빛 탄산 음료, 위에 건조 딸기와 민트를 올렸어요.',
    },
  },
  'uong-berry-rouge-highball': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Ly cao đựng nước màu đỏ đậm có ga, đá viên và nhánh bạc hà.',
      en: 'A tall glass of deep red sparkling drink with ice and a sprig of mint.',
      ko: '키 큰 잔에 얼음과 민트를 올린 진한 붉은색 탄산 음료가 담겨 있어요.',
    },
  },
  // Ảnh của cả phần Đồ uống (không gắn với một món): ade chanh dây, ade chanh, nước cam.
  'uong-khong-con-ba-ly': {
    minhHoa: true, tachNen: true,
    alt: {
      vi: 'Ly ade chanh dây, ly ade chanh có lát chanh vàng và ly nước cam đứng cạnh nhau.',
      en: 'A passion fruit ade, a lemon ade with lemon slices and a glass of orange juice, side by side.',
      ko: '패션프루트 에이드, 레몬 슬라이스를 넣은 레몬 에이드, 오렌지 주스가 나란히 놓여 있어요.',
    },
  },
};

/**
 * Khung đã dựng cho ảnh món (web/cong-cu/anh/danh-sach.json): món ăn tách nền 4:3, ly 4:5, ảnh tartare vuông.
 * gon: khung của ảnh nhỏ (128px) trong hàng món gọn trên điện thoại (dưới 600px, ThucDonNhomAnh) — món ăn
 * tách nền 1:1 có dải đáy 20 % cho nhãn, ảnh tartare 4:5 cắt sát đáy ảnh (nhãn trên mặt bàn). Ly signature
 * không có: nhóm ly luôn là thẻ ảnh trên chữ dưới.
 */
export type KhungAnhMon = '4x3' | '4x5' | '1x1';

/**
 * ẢNH CỦA TỪNG MÓN trên trang Thực đơn — khóa là MÃ MÓN (mon_an.ma, cột mon_ma của
 * thuc_don_cong_khai()), theo bảng danh mục cuốn bản sáng 11/10/2026. Món không có ở đây thì
 * thẻ món không có ảnh (không khung thay thế, không ô trống). Đổi ảnh của một món: sửa ở đây và
 * danh-sach.json, chạy lại tao-co-anh.py. Ảnh chỉ hiện khi món đã công bố — bảng này không đưa
 * món nào lên trang.
 */
export const ANH_CUA_MON: Readonly<Record<string, Readonly<{ id: IdAnh; khung: KhungAnhMon; gon?: KhungAnhMon }>>> = {
  F03: { id: 'mon-tartare-bo-hoa-tuyet', khung: '1x1', gon: '4x5' },
  F19: { id: 'mon-com-tron-tartare-bo-cay', khung: '1x1', gon: '4x5' },
  F15: { id: 'mon-lau-kim-chi', khung: '4x3', gon: '1x1' },
  F16: { id: 'mon-lau-bo-bulgogi', khung: '4x3', gon: '1x1' },
  F20: { id: 'mon-lau-nam', khung: '4x3', gon: '1x1' },
  S01: { id: 'mon-set-4-sot', khung: '4x3', gon: '1x1' },
  F21: { id: 'mon-salad-nam', khung: '4x3', gon: '1x1' },
  F01: { id: 'mon-caesar-salad', khung: '4x3', gon: '1x1' },
  F10: { id: 'mon-mien-tron-han', khung: '4x3', gon: '1x1' },
  F22: { id: 'mon-trung-hap-nui-lua', khung: '4x3', gon: '1x1' },
  F23: { id: 'mon-khoai-tay-chien-sot-bo', khung: '4x3', gon: '1x1' },
  F18: { id: 'mon-banh-gao-chien-pho-mai', khung: '4x3', gon: '1x1' },
  F12: { id: 'mon-canh-kim-chi', khung: '4x3', gon: '1x1' },
  F14: { id: 'mon-dau-phu-ham', khung: '4x3', gon: '1x1' },
  F13: { id: 'mon-canh-tuong-dau', khung: '4x3', gon: '1x1' },
  F06: { id: 'mon-com-kim-chi-bo', khung: '4x3', gon: '1x1' },
  F05: { id: 'mon-com-tron-han', khung: '4x3', gon: '1x1' },
  F04: { id: 'mon-com-tron-trung-ca', khung: '4x3', gon: '1x1' },
  F11: { id: 'mon-mi-lanh-cay', khung: '4x3', gon: '1x1' },
  F08: { id: 'mon-mi-toowoomba', khung: '4x3', gon: '1x1' },
  F07: { id: 'mon-mi-carbonara', khung: '4x3', gon: '1x1' },
  F09: { id: 'mon-mi-bo-sot-ca', khung: '4x3', gon: '1x1' },
  D13: { id: 'uong-milky-cloud-makgeolli', khung: '4x5' },
  D01: { id: 'uong-strawberry-crush', khung: '4x5' },
  D14: { id: 'uong-berry-rouge-highball', khung: '4x5' },
};

/** Cỡ đã dựng của một ảnh ở một khung (vd. '16x9'), hoặc null nếu chưa dựng. */
export function coAnh(id: IdAnh, khung: string): CoAnh | null {
  return (ANH_TAO_SAN as Readonly<Record<string, Readonly<Record<string, CoAnh>>>>)[id]?.[khung] ?? null;
}

export function duongDanAnh(id: IdAnh, khung: string, rong: number, duoi: 'avif' | 'webp'): string {
  return `/anh/${id}-${khung}-${rong}.${duoi}`;
}

export function srcsetAnh(id: IdAnh, khung: string, duoi: 'avif' | 'webp'): string {
  const co = coAnh(id, khung);
  return co ? co.cac.map(r => `${duongDanAnh(id, khung, r, duoi)} ${r}w`).join(', ') : '';
}

export function altAnh(id: IdAnh, ngonNgu: NgonNgu): string {
  return DANH_MUC_ANH[id].alt[ngonNgu];
}
