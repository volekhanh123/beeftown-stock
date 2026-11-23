/**
 * NỘI DUNG TRANG "CÁC PHẦN THỊT BÒ" — /phan-thit-bo, /en/beef-cuts, /ko/beef-cuts
 * ===============================================================================
 * Trang giải thích năm phần thịt bò nướng của Beeftown cho người đang tìm tên các phần thịt
 * ("đầu thăn ngoại", "dẻ sườn bò là phần nào", "diềm thăn bò"…). Tiếng Việt là bản gốc: viết
 * theo tên tiếng Việt của từng phần (Khánh quyết 23/11/2026); bản Anh và Hàn dịch theo.
 *
 * NGUỒN SỰ THẬT — chỉ hai thứ:
 *   1. Tài liệu đào tạo thịt bò (mục 05 và 06–10 của "Beef Training", bản VI 13/11/2026):
 *      cảm giác khi ăn, hợp với khách nào, mức chín gợi ý, cách nướng, việc nhân viên làm.
 *   2. Kiến thức pha lóc phổ thông: phần thịt nằm ở đâu trên con bò; tên tiếng Việt, Anh, Hàn
 *      của từng phần (tra 13/11/2026, nguồn từng tên ở ten-tieng-viet-phan-thit.md của thư mục
 *      video đào tạo thịt bò trên OneDrive — không nằm trong repo).
 *
 * KHÔNG viết, dù tài liệu có nhắc, vì chữ này bị chặn trên trang công khai hoặc chưa ai xác nhận
 * cho đúng sản phẩm bán trong ngày: giống bò, cấp hạng, xuất xứ, số ngày ủ, giá, khối lượng khay
 * (khay nào cũng ghi trên nhãn). Đường gân giữa của lõi vai: tài liệu mục 05 ghi "đã loại bỏ",
 * mục 09 ghi "vẫn ăn được sau khi ủ" — trang chỉ nói điều đúng với cả hai (khối nguyên có dải gân
 * giữa) rồi dặn hỏi nhân viên quầy. Phần Chimasal (thịt bò sống trộn gia vị) CHƯA có trong trang:
 * chưa chốt tên tiếng Việt.
 *
 * Không có chữ nào ở đây nói về than, củi, khói; bàn nướng là vỉ gas.
 */
import type { BaThuTieng } from './chu';

export type IdPhanBo = 'dau-than-ngoai' | 'de-suon' | 'diem-than' | 'nac-vai' | 'loi-vai';

export interface PhanBo {
  id: IdPhanBo;
  /** Tên theo từng thứ tiếng — tên chính ở trang của thứ tiếng đó, tên phụ ở hai trang còn lại. */
  ten: BaThuTieng;
  /** Phiên âm Latin của tên tiếng Hàn (tên Hàn đứng một mình khó tìm bằng bàn phím Việt). */
  hanLatin: string;
  /** Nằm ở đâu trên con bò. */
  noi: BaThuTieng;
  /** Ăn ra sao. */
  an: BaThuTieng;
  /** Nướng tại bàn. */
  nuong: BaThuTieng;
  /** Hợp với ai. */
  hop: BaThuTieng;
  /** Một ý riêng của phần này (nhãn + chữ), không phần nào bắt buộc có. */
  them?: { nhan: BaThuTieng; chu: BaThuTieng };
}

// Thứ tự trang: ba phần hay được tìm bằng tên tiếng Việt nhất trước, rồi hai phần ở vai.
export const PHAN_BO: readonly PhanBo[] = [
  {
    id: 'dau-than-ngoai',
    ten: { vi: 'Đầu thăn ngoại', en: 'Ribeye', ko: '꽃등심' },
    hanLatin: 'kkotdeungsim',
    noi: {
      vi: 'Lấy từ phần sườn dọc theo lưng con bò. Trong một khay, bạn có thể phân biệt hai nhóm cơ khác nhau: phần lõi ở giữa và phần nắp bao quanh bên ngoài.',
      en: 'Cut from the rib section along the animal’s back. In one tray, you may see two different muscles: the eye in the middle and the cap around the outside.',
      ko: '소의 등을 따라 이어지는 갈비 쪽 부위에서 나와요. 한 트레이 안에서도 가운데의 알등심과 바깥을 감싸는 새우살, 서로 다른 두 근육을 볼 수 있어요.',
    },
    an: {
      vi: 'Vị béo thơm đậm đà, thịt mọng nước. Phần nắp đặc biệt mềm; phần lõi ở giữa có độ dai khi nhai rõ hơn một chút. Vì là hai nhóm cơ khác nhau, hai phần có thể khác nhau về kết cấu và vị béo dù cùng độ chín.',
      en: 'A rich, savoury fat flavour and a juicy bite. The cap is especially tender; the eye in the centre has a little more chew. As they are different muscles, their texture and fat flavour can differ even at the same doneness.',
      ko: '고소하고 진한 지방의 맛과 촉촉한 육즙이 특징이에요. 새우살은 특히 부드럽고, 가운데 알등심은 조금 더 씹는 맛이 있어요. 서로 다른 근육이라 같은 굽기에서도 식감과 고소함이 달라요.',
    },
    nuong: {
      vi: 'Gợi ý medium rare, hoặc medium nếu bạn thích chín hơn. Nếu bạn đồng ý, nhân viên có thể nướng giúp những miếng đầu tiên và chỉ cho bạn đâu là phần nắp, đâu là phần lõi. Nếm một miếng nguyên vị trước, rồi thử cùng sốt chimichurri.',
      en: 'We suggest medium rare, or medium if you like your beef cooked a little more. If you wish, our staff can grill the first pieces for you and point out which part is the cap and which is the eye. Try a piece on its own first, then with chimichurri.',
      ko: '미디엄 레어를 추천드리고, 더 익히고 싶다면 미디엄도 좋아요. 원하시면 직원이 처음 몇 점을 대신 구워 드리고 새우살과 알등심이 어디인지도 알려 드려요. 먼저 아무것도 찍지 않고 한 점 맛본 뒤 치미추리 소스와 함께 드셔 보세요.',
    },
    hop: {
      vi: 'Bạn thích thịt bò mềm, béo thơm.',
      en: 'You like tender, rich beef.',
      ko: '부드럽고 고소한 소고기를 좋아하신다면 잘 맞아요.',
    },
  },
  {
    id: 'de-suon',
    ten: { vi: 'Dẻ sườn bò', en: 'Rib finger', ko: '갈비살' },
    hanLatin: 'galbisal',
    noi: {
      vi: 'Là phần thịt nằm giữa và xung quanh các xương sườn. Thớ thịt tương đối rõ; cách phân bố mỡ và kết cấu có thể thay đổi tùy vị trí cắt, nên hãy quan sát thớ thịt và mỡ ngay trên khay bạn chọn.',
      en: 'The meat between and around the ribs. The grain is fairly pronounced; fat distribution and texture can vary depending on where the meat is cut, so look at the grain and fat distribution in the tray you choose.',
      ko: '갈비뼈 사이와 그 주변에 붙은 살코기예요. 결이 비교적 뚜렷하고, 자른 위치에 따라 지방 분포와 식감이 달라질 수 있어서 고르시는 트레이의 고기 결과 지방 분포를 직접 살펴보시면 좋아요.',
    },
    an: {
      vi: 'Có độ dai khi nhai khá rõ; càng nhai, hương thịt bò và vị béo thơm càng nổi bật. Phần này không mềm tan như phần nắp của đầu thăn ngoại. Độ dai tự nhiên của thớ thịt khác với cảm giác dai do nướng quá chín.',
      en: 'A satisfying chew; the more you chew, the more the beef flavour and richness come through. It does not have the melting tenderness of the ribeye cap. This natural chew is different from toughness caused by overcooking.',
      ko: '씹는 맛이 꽤 뚜렷하고, 씹을수록 소고기 향과 고소한 맛이 더 살아나요. 꽃등심의 새우살처럼 부드럽게 풀어지는 식감과는 달라요. 결에서 오는 자연스러운 씹는 맛과 너무 익혀서 질겨진 식감은 달라요.',
    },
    nuong: {
      vi: 'Gợi ý medium, hoặc medium well nếu bạn thích. Nướng lâu có thể làm thịt săn chắc hơn, nên hãy nói trước mức chín bạn muốn. Nhờ nhân viên hướng dẫn cách chỉnh lửa và lật thịt, tránh để một mặt trên vỉ quá lâu đến mức cháy đen.',
      en: 'We suggest medium, or medium well if you prefer. The meat can become firmer as it cooks, so tell us how you like it before the first piece goes on. Ask our staff for guidance on heat and turning, and avoid leaving one side on the grill long enough to burn.',
      ko: '미디엄을 추천드리고, 원하시면 미디엄 웰도 괜찮아요. 오래 구우면 살이 더 단단해질 수 있으니 첫 점을 올리기 전에 원하는 굽기를 말씀해 주세요. 불 조절과 뒤집는 방법은 직원에게 물어보고, 한쪽 면이 오래 닿아 까맣게 타지 않도록 해 주세요.',
    },
    hop: {
      vi: 'Bạn thích cảm giác nhai rõ cùng vị béo thơm. Nếu bạn chỉ tìm thịt thật mềm, hãy so sánh với đầu thăn ngoại trước khi chọn.',
      en: 'You enjoy a good chew along with richness. If you only want really tender meat, compare it with the ribeye before you choose.',
      ko: '씹는 맛과 고소한 맛을 함께 즐기고 싶으시다면 잘 맞아요. 아주 부드러운 고기만 찾으신다면 꽃등심과 먼저 비교해 보세요.',
    },
    them: {
      nhan: { vi: 'Nguyên vị hay tẩm ướp', en: 'Plain or marinated', ko: '생갈비살 또는 양념갈비살' },
      chu: {
        vi: 'Dẻ sườn bò nguyên vị làm nổi bật hương thịt bò. Nếu bạn thích vị ngọt mặn để ăn cùng cơm, có thể nhờ tẩm ướp phần dẻ sườn bò bạn chọn ngay khi gọi món. Đây là dịch vụ có tính phí; hãy hỏi nhân viên xem hiện có phục vụ không và giá bao nhiêu.',
        en: 'Plain rib fingers highlight the beef’s natural flavour. If you like a sweet-savoury flavour with rice, you can ask us to marinate the meat you choose when you order. This is a paid service, so check availability and the current price with our staff.',
        ko: '양념하지 않은 갈비살은 소고기 본연의 향을 그대로 느낄 수 있어요. 밥과 함께 달콤짭짤한 맛을 원하시면 주문하실 때 고르신 갈비살에 양념을 해 달라고 하실 수 있어요. 유료 서비스이니 현재 주문 가능한지와 가격은 직원에게 문의해 주세요.',
      },
    },
  },
  {
    id: 'diem-than',
    ten: { vi: 'Diềm thăn bò', en: 'Outside skirt', ko: '안창살' },
    hanLatin: 'anchangsal',
    noi: {
      vi: 'Là phần cơ phía sườn của cơ hoành, nằm bên trong lồng ngực, giữa ngực và bụng. Đây là thịt cơ chứ không phải nội tạng.',
      en: 'The rib-side part of the diaphragm muscle, inside the rib cage between the chest and abdomen. It is muscle meat, not an internal organ.',
      ko: '가슴과 배 사이, 갈비뼈 안쪽에 있는 횡격막 근육 중 갈비 쪽 부분이에요. 내장이 아니라 근육 부위예요.',
    },
    an: {
      vi: 'Thớ thịt thô và dễ nhìn thấy, tạo cảm giác dai giòn, đàn hồi và dễ nhai. Hương thịt bò đậm và càng nhai càng rõ. Dù đã được loại bỏ màng bề mặt và cắt ngược thớ, thịt vẫn giữ kết cấu và hương thịt bò đặc trưng.',
      en: 'A coarse, clearly visible grain gives a springy, satisfying bite that is still easy to chew. The beef flavour is bold and becomes more pronounced as you chew. Even after the surface membrane is removed and the meat is cut against the grain, it retains its distinctive texture and beefy flavour.',
      ko: '결이 굵고 눈에 잘 보여서 쫄깃하고 탄력 있는 식감이 나고, 씹기에도 편해요. 소고기 향이 진하고 씹을수록 더 또렷해져요. 겉의 막을 제거하고 결을 끊는 방향으로 썰어도 고유의 식감과 소고기 향은 그대로예요.',
    },
    nuong: {
      vi: 'Gợi ý medium rare hoặc medium. Áp chảo bề mặt miếng thịt và chú ý đừng nướng quá lâu. Nếm một miếng nguyên vị trước, sau đó thử cùng sốt chimichurri để cảm nhận sự khác biệt về hương vị.',
      en: 'We suggest medium rare or medium. Sear the surface of the meat and take care not to grill it for too long. Try a piece on its own first, then with chimichurri to see how the flavour changes.',
      ko: '미디엄 레어나 미디엄을 추천드려요. 고기 겉면을 지지듯 구워 주시고 너무 오래 굽지 않도록 주의해 주세요. 먼저 아무것도 찍지 않고 한 점 맛본 뒤 치미추리 소스와 함께 드셔 보시면 맛이 어떻게 달라지는지 느낄 수 있어요.',
    },
    hop: {
      vi: 'Bạn mê vị thịt bò và muốn thử một phần thịt đặc biệt. Nếu bạn tìm thịt thật mềm, hãy nghĩ xem mình có thích độ dai chắc khi nhai không rồi mới chọn phần này.',
      en: 'You love the taste of beef and want to try something special. If you are after very tender meat, first ask yourself whether you enjoy a firm chew before choosing this one.',
      ko: '소고기 맛 자체를 좋아하고 특별한 부위를 먹어 보고 싶으시다면 잘 맞아요. 아주 부드러운 고기를 찾으신다면, 탄력 있는 씹는 맛도 괜찮은지 먼저 생각해 보고 고르세요.',
    },
  },
  {
    id: 'nac-vai',
    ten: { vi: 'Nạc vai bò', en: 'Chuck eye roll', ko: '윗등심' },
    hanLatin: 'witdeungsim',
    noi: {
      vi: 'Nằm ở phần vai, giáp phần đầu thăn ngoại. Bạn có thể quan sát phần chuck flap rộng trên khay.',
      en: 'Comes from the shoulder, next to the ribeye. Look for the generous chuck flap section in the tray.',
      ko: '어깨 쪽에서 꽃등심과 이어지는 부위예요. 트레이에서 넓게 들어 있는 살치살 부분을 살펴보세요.',
    },
    an: {
      vi: 'Hương thịt bò đậm, mọng nước, có vân mỡ. So với đầu thăn ngoại vốn nổi bật ở vị béo thơm, nạc vai bò thiên về hương thịt bò đặc trưng và có phần chuck flap rộng. Đây là hai phần thịt khác nhau; phần chuck flap của nạc vai bò không phải phần nắp của đầu thăn ngoại.',
      en: 'Bold beef flavour, a juicy bite and marbling. While ribeye stands out for its rich fat flavour, chuck eye roll offers a distinctive beef flavour and a generous chuck flap section. These are different cuts; the chuck flap in chuck eye roll is not the ribeye cap.',
      ko: '소고기 향이 진하고 육즙이 풍부하며 마블링이 있어요. 꽃등심이 고소한 지방의 맛으로 돋보인다면, 윗등심은 소고기 특유의 향과 넓게 들어 있는 살치살 부분이 특징이에요. 두 부위는 서로 다르고, 윗등심의 살치살은 꽃등심의 새우살과 다른 부위예요.',
    },
    nuong: {
      vi: 'Gợi ý medium rare, hoặc medium. Khi thịt đã chín, chuyển ra rìa vỉ thay vì để ở giữa, nơi thịt vẫn tiếp tục chín.',
      en: 'We suggest medium rare, or medium. Once the meat is done, move it to the edge of the grill instead of leaving it in the middle, where it keeps cooking.',
      ko: '미디엄 레어를 추천드리고, 원하시면 미디엄도 좋아요. 다 익은 고기는 가운데에 두지 말고 그릴 가장자리로 옮겨 주세요. 가운데에 두면 계속 익어요.',
    },
    hop: {
      vi: 'Bạn thích hương thịt bò rõ nét và độ mọng nước.',
      en: 'You want pronounced beef flavour and juiciness.',
      ko: '소고기 향이 또렷하고 육즙 많은 고기를 좋아하신다면 잘 맞아요.',
    },
  },
  {
    id: 'loi-vai',
    ten: { vi: 'Lõi vai bò', en: 'Top blade (oyster blade)', ko: '부채살' },
    hanLatin: 'buchaesal',
    noi: {
      vi: 'Là cơ nằm gần xương bả vai ở chân trước. Trên khối thịt nguyên, có một dải mô liên kết dày chạy qua giữa, thường gọi là đường gân trung tâm. Hãy hỏi nhân viên quầy để biết khay bạn chọn đang ở tình trạng sơ chế nào.',
      en: 'A muscle near the shoulder blade of the front leg. On the whole muscle, a thick band of connective tissue runs through the middle, often called the centre seam. Ask the counter staff how the tray you choose has been prepared.',
      ko: '앞다리의 어깨뼈 가까이에 있는 근육이에요. 통째로 있을 때는 가운데를 가로지르는 두꺼운 결합조직이 있고, 흔히 가운데 힘줄이라고 불러요. 고르신 트레이가 어떤 상태로 손질되었는지는 정육 코너 직원에게 물어보세요.',
    },
    an: {
      vi: 'Phần thịt tương đối ít béo. Vị béo không đậm như đầu thăn ngoại, phù hợp với người thích thịt bò ít béo. Nếu bạn muốn hương thịt bò đậm hơn, hãy so sánh với diềm thăn bò.',
      en: 'A relatively lean cut. It suits people who prefer less fatty beef to the richness of ribeye. If you want a deeper beef flavour, compare it with the outside skirt.',
      ko: '지방이 비교적 적은 부위예요. 꽃등심의 진한 지방 풍미보다 담백한 맛을 좋아하시는 분께 어울려요. 소고기 향이 더 진한 쪽을 원하시면 안창살과 비교해 보세요.',
    },
    nuong: {
      vi: 'Nướng quá chín thịt dễ khô, nên hãy nói trước mức chín bạn thích. Thịt đã chín thì chuyển ra rìa vỉ thay vì để ở giữa.',
      en: 'It can dry out if overcooked, so tell us how you like it before grilling. Once it is done, move it to the edge of the grill instead of the middle.',
      ko: '너무 익히면 퍽퍽해지기 쉬우니 굽기 전에 원하시는 굽기를 말씀해 주세요. 다 익은 고기는 가운데가 아니라 그릴 가장자리로 옮겨 주세요.',
    },
    hop: {
      vi: 'Bạn không thích thịt bò quá béo.',
      en: 'You don’t like beef that is too fatty.',
      ko: '너무 기름진 소고기를 좋아하지 않으신다면 잘 맞아요.',
    },
  },
];

/** Chữ của trang ngoài năm phần thịt. Đủ vi / en / ko. */
export const CHU_PHAN_BO = {
  // --- Mở đầu ---------------------------------------------------------------
  hieu: { vi: 'Các phần thịt bò', en: 'Beef cuts', ko: '소고기 부위' },
  tieuDe: { vi: 'Các phần thịt bò ở Beeftown', en: 'Beef cuts at Beeftown', ko: 'Beeftown의 소고기 부위' },
  dan: {
    vi: 'Đầu thăn ngoại, dẻ sườn bò, diềm thăn bò, nạc vai bò, lõi vai bò: mỗi phần nằm ở đâu trên con bò, ăn ra sao và nên nướng thế nào trên vỉ gas tại bàn.',
    en: 'Ribeye, rib finger, outside skirt, chuck eye roll and top blade: where each cut sits on the animal, how it tastes and feels, and how to grill it on the gas grill at your table.',
    ko: '꽃등심, 갈비살, 안창살, 윗등심, 부채살. 각 부위가 소의 어디에 있는지, 어떤 맛과 식감인지, 테이블 가스 그릴에서 어떻게 구우면 좋은지 알려 드릴게요.',
  },
  quay: {
    vi: 'Ở Beeftown, bạn chọn khay thịt đóng gói skin-pack tại quầy, đọc nhãn rồi cả bàn cùng nướng thịt trên vỉ gas. Trang này giúp bạn biết trước mỗi phần thịt khác nhau thế nào. Khối lượng và giá của từng khay được ghi trên nhãn.',
    en: 'At Beeftown, you pick a skin-packed tray at the counter, read the label, and grill the meat together on the gas grill at your table. This page helps you see how the cuts differ before you arrive. Each tray’s weight and price are shown on its label.',
    ko: 'Beeftown에서는 정육 코너에서 스킨팩 트레이를 고르고 라벨을 확인한 뒤, 테이블의 가스 그릴에서 고기를 함께 구워 드실 수 있어요. 이 페이지에서 부위마다 어떻게 다른지 미리 알아보세요. 고기의 중량과 가격은 트레이 라벨에 적혀 있어요.',
  },

  // --- Chọn theo khẩu vị -----------------------------------------------------
  chonHieu: { vi: 'Chọn nhanh', en: 'Quick picks', ko: '빠르게 고르기' },
  chonTieuDe: { vi: 'Chọn phần thịt theo khẩu vị', en: 'Choose a cut to suit your taste', ko: '입맛에 맞는 부위 고르기' },
  chonDan: {
    vi: 'Hãy tự hỏi hai điều: bạn thích thịt mềm hay có độ dai khi nhai, và thích vị béo đậm đà từ mỡ hay hương thịt bò rõ nét hơn. Nhân viên có thể dựa vào sở thích đó để so sánh hai phần thịt, giúp bạn dễ chọn.',
    en: 'Ask yourself two things: do you like tender meat or a firmer chew, and do you prefer the rich flavour of fat or a more pronounced beef flavour? Our staff can compare two cuts based on your preferences to help you decide.',
    ko: '두 가지를 생각해 보세요. 부드러운 고기가 좋은지 씹는 맛이 있는 고기가 좋은지, 그리고 지방의 진한 고소함이 좋은지 소고기 본연의 향이 또렷한 쪽이 좋은지요. 정육 코너 직원도 취향에 맞춰 두 부위를 비교해 선택을 도와드려요.',
  },
  bangTen: { vi: 'So sánh năm phần thịt', en: 'Five cuts compared', ko: '다섯 부위 비교' },
  cotPhan: { vi: 'Phần thịt', en: 'Cut', ko: '부위' },
  cotAn: { vi: 'Cảm giác khi ăn', en: 'Flavour and texture', ko: '먹었을 때 느낌' },
  cotHop: { vi: 'Hợp với ai', en: 'Who it suits', ko: '추천 대상' },
  // Hàng so sánh: một câu về cảm giác, theo thứ tự PHAN_BO.
  bang: {
    'dau-than-ngoai': {
      vi: 'Mềm, béo thơm, mọng nước; phần nắp đặc biệt mềm, phần lõi dai hơn một chút',
      en: 'Tender, rich and juicy; the cap is especially tender, the eye has a little more chew',
      ko: '부드럽고 고소하며 육즙이 풍부해요. 새우살은 특히 부드럽고 알등심은 조금 더 씹는 맛이 있어요',
    },
    'de-suon': {
      vi: 'Có độ dai rõ khi nhai; càng nhai, hương thịt bò và vị béo thơm càng nổi bật',
      en: 'A noticeable chew; beef flavour and richness build as you chew',
      ko: '씹는 맛이 뚜렷하고, 씹을수록 소고기 향과 고소함이 살아나요',
    },
    'diem-than': {
      vi: 'Dai giòn, đàn hồi; hương thịt bò đậm',
      en: 'A springy, satisfying chew; bold beef flavour',
      ko: '쫄깃하고 탄력이 있으며 소고기 향이 진해요',
    },
    'nac-vai': {
      vi: 'Hương thịt bò đậm, mọng nước, có vân mỡ',
      en: 'Deep beef flavour, juicy, with marbling',
      ko: '소고기 향이 진하고 육즙이 풍부하며 마블링이 있어요',
    },
    'loi-vai': {
      vi: 'Tương đối ít béo; nướng quá chín dễ khô',
      en: 'Relatively lean; can dry out if overcooked',
      ko: '지방이 비교적 적고, 너무 익히면 퍽퍽해져요',
    },
  } satisfies Record<IdPhanBo, BaThuTieng>,
  bangGhiChu: {
    vi: 'Độ mềm, độ mọng nước, hương thịt bò và vị béo là bốn cảm nhận khác nhau: một phần thịt có thể mạnh ở điều này, nhẹ ở điều kia. Kết cấu còn phụ thuộc cách sơ chế và cách nướng, nên “mềm và ngon” chưa nói được nhiều.',
    en: 'Tenderness, juiciness, beef flavour and richness are four different qualities: some may be more pronounced than others in a cut. Texture also depends on how the meat is trimmed and grilled, so “tender and tasty” doesn’t say much.',
    ko: '부드러움, 육즙, 소고기 향, 고소함은 서로 다른 네 가지 느낌이에요. 한 부위에서도 어떤 특성은 강하고 다른 특성은 약할 수 있어요. 식감은 손질과 굽는 방법에 따라서도 달라지니 “부드럽고 맛있다”는 말만으로는 부족해요.',
  },

  // --- Đọc khay -------------------------------------------------------------
  docHieu: { vi: 'Nhìn khay thịt', en: 'Looking at the tray', ko: '트레이 살펴보기' },
  docTieuDe: { vi: 'Hai thứ nên nhìn trên khay', en: 'Two things to look at on the tray', ko: '트레이에서 볼 두 가지' },
  vanMoTen: { vi: 'Vân mỡ', en: 'Marbling', ko: '마블링' },
  vanMo: {
    vi: 'Là những đường mỡ nhỏ nằm bên trong thớ thịt, khác với các khối mỡ lớn nằm giữa các nhóm cơ. Cắt bỏ mỡ thừa không có nghĩa là vân mỡ đã bị bỏ đi.',
    en: 'The fine lines of fat inside the muscle, different from the large deposits of fat between muscle groups. Trimming off excess fat does not mean the marbling has been removed.',
    ko: '근육 안에 퍼져 있는 가느다란 지방이에요. 근육 사이에 있는 큰 지방 덩어리와는 달라요. 여분의 지방을 잘라냈다고 마블링이 없어지는 것은 아니에요.',
  },
  thoTen: { vi: 'Thớ thịt', en: 'Grain', ko: '결' },
  tho: {
    vi: 'Là hướng chạy của các sợi cơ. Phần thịt có thớ càng rõ thì cảm giác khi nhai càng rõ.',
    en: 'The direction the muscle fibres run. Cuts with a pronounced grain have a more noticeable texture when chewed.',
    ko: '근섬유가 뻗어 있는 방향이에요. 결이 뚜렷한 부위일수록 씹을 때 식감도 뚜렷해요.',
  },

  // --- Từng phần: nhãn các dòng ----------------------------------------------
  nhanTenKhac: { vi: 'Tên gọi khác', en: 'Also called', ko: '다른 이름' },
  nhanNoi: { vi: 'Nằm ở đâu', en: 'Where it comes from', ko: '위치' },
  nhanAn: { vi: 'Ăn ra sao', en: 'Flavour and texture', ko: '맛과 식감' },
  nhanNuong: { vi: 'Nướng tại bàn', en: 'Grilling at the table', ko: '테이블에서 굽기' },
  nhanHop: { vi: 'Hợp với ai', en: 'Who it suits', ko: '추천 대상' },
  // Hình con bò nhỏ ở dòng "Nằm ở đâu" (lib/so-do-con-bo.ts). {ten} = tên phần thịt theo thứ tiếng của trang.
  hinhConBo: {
    vi: 'Con bò nhìn nghiêng, đầu bên phải. Vùng tô đỏ là vị trí tương đối của {ten}.',
    en: 'Side view of the animal, head on the right. The red area is the approximate position of the {ten}.',
    ko: '소의 옆모습으로 머리는 오른쪽이에요. 빨간 부분이 {ten}의 대략적인 위치예요.',
  },
  viTri: { vi: 'Vị trí tương đối trên con bò', en: 'Approximate position on the animal', ko: '소에서의 대략적인 위치' },
  // Chú thích thứ tiếng của tên khác: "ribeye (tiếng Anh)".
  ngonNguVi: { vi: 'tiếng Việt', en: 'Vietnamese', ko: '베트남어' },
  ngonNguEn: { vi: 'tiếng Anh', en: 'English', ko: '영어' },
  ngonNguKo: { vi: 'tiếng Hàn', en: 'Korean', ko: '한국어' },

  // --- Nướng chung ----------------------------------------------------------
  nuongHieu: { vi: 'Nướng tại bàn', en: 'Grilling at the table', ko: '테이블에서 굽기' },
  nuongTieuDe: { vi: 'Vài điều chung khi nướng trên vỉ gas', en: 'A few general grilling tips', ko: '고기를 구울 때 알아둘 몇 가지' },
  nuong: [
    {
      vi: 'Hãy nói trước độ chín bạn thích. Bạn có thể tham khảo gợi ý của nhà hàng và chọn nướng chín hơn nếu muốn.',
      en: 'Tell us how you like it cooked. Our suggestions are only a guide; if you’d like it more thoroughly cooked, let us know.',
      ko: '원하시는 굽기를 먼저 말씀해 주세요. 저희의 굽기 추천은 참고만 하시고, 더 익힌 고기를 원하시면 취향에 맞춰 드려요.',
    },
    {
      vi: 'Nướng những miếng đầu tiên rồi mời mỗi người nếm thử một miếng, để biết cả bàn thấy độ chín ổn chưa.',
      en: 'Grill the first pieces, then let everyone at the table taste one to check the doneness suits them.',
      ko: '처음 몇 점을 구운 뒤 테이블의 모든 분이 한 점씩 맛보고 굽기가 입맛에 맞는지 확인해 보세요.',
    },
    {
      vi: 'Thịt đã chín thì chuyển ra rìa vỉ, đừng để ở giữa, nơi thịt vẫn tiếp tục chín.',
      en: 'Move cooked meat to the edge of the grill, not the middle, where it keeps cooking.',
      ko: '다 익은 고기는 그릴 가운데가 아니라 가장자리로 옮겨 주세요. 가운데에 두면 계속 익어요.',
    },
    {
      vi: 'Khi nướng, đừng để một mặt thịt nằm quá lâu trên vỉ đến mức cháy đen.',
      en: 'Don’t leave one side of the meat on the grill long enough to blacken.',
      ko: '고기를 구울 때 한쪽 면이 그릴에 너무 오래 닿아 까맣게 타지 않도록 해 주세요.',
    },
    {
      vi: 'Chưa quen thì cứ nhờ nhân viên nướng giúp những miếng đầu tiên.',
      en: 'If you’re not sure, ask our staff to grill the first pieces for you.',
      ko: '처음이라 자신이 없으시면 직원에게 처음 몇 점을 대신 구워 달라고 부탁하세요.',
    },
  ] as readonly BaThuTieng[],

  // --- Hỏi đáp --------------------------------------------------------------
  hoiHieu: { vi: 'Câu hỏi thường gặp', en: 'Common questions', ko: '자주 묻는 질문' },
  hoiTieuDe: { vi: 'Tên các phần thịt, hỏi nhanh đáp gọn', en: 'Quick answers about beef cut names', ko: '소고기 부위 이름, 간단히 알아봐요' },
  hoi: [
    {
      h: {
        vi: 'Dẻ sườn bò là phần nào?',
        en: 'What is rib finger (galbisal)?',
        ko: '갈비살은 어느 부위인가요?',
      },
      d: {
        vi: 'Dẻ sườn bò (tiếng Hàn là galbisal, tiếng Anh là rib finger) là phần thịt nằm giữa và xung quanh các xương sườn. Thớ thịt khá rõ, có độ dai khi nhai; càng nhai, hương thịt bò và vị béo thơm càng rõ. Đây không phải sườn non (short rib), là một phần khác.',
        en: 'Rib finger (galbisal in Korean, dẻ sườn bò in Vietnamese) is the meat between and around the ribs. It has a pronounced grain and a satisfying chew, with beef flavour and richness that build as you chew. It is not short rib, which is a different cut.',
        ko: '갈비살은 베트남어로 dẻ sườn bò, 영어로 rib finger라고 하며, 갈비뼈 사이와 그 주변에 붙은 고기예요. 결이 뚜렷하고 씹는 맛이 있으며 씹을수록 소고기 향과 고소함이 살아나요. 숏립(short rib)과는 다른 부위예요.',
      },
    },
    {
      h: {
        vi: 'Đầu thăn ngoại có phải ribeye không? Khác gì thăn ngoại?',
        en: 'Is “đầu thăn ngoại” the same as ribeye? How is it different from “thăn ngoại”?',
        ko: '꽃등심(립아이)은 베트남어로 뭐라고 하나요? thăn ngoại와는 다른가요?',
      },
      d: {
        vi: 'Đầu thăn ngoại là tên tiếng Việt của ribeye, phần lấy từ sườn dọc theo lưng con bò. Chữ “đầu” rất quan trọng: “thăn ngoại” không có chữ “đầu” thường là striploin, một phần khác.',
        en: '“Đầu thăn ngoại” is the Vietnamese name for ribeye, cut from the rib section along the back. The word “đầu” matters: “thăn ngoại” without it usually means striploin, a different cut.',
        ko: '꽃등심(립아이)은 베트남어로 đầu thăn ngoại라고 하며, 등을 따라 이어지는 갈비 쪽 부위예요. “đầu”라는 글자가 중요해요. “đầu” 없이 thăn ngoại라고 하면 보통 채끝(스트립로인)으로, 다른 부위예요.',
      },
    },
    {
      h: {
        vi: 'Diềm thăn bò có phải nội tạng không?',
        en: 'Is outside skirt offal?',
        ko: '안창살은 내장인가요?',
      },
      d: {
        vi: 'Không. Diềm thăn bò (outside skirt, tiếng Hàn là anchangsal) là thịt cơ, lấy từ phần cơ phía sườn của cơ hoành. Đừng nhầm với “diềm bụng” (flap meat), một phần khác.',
        en: 'No. Outside skirt (anchangsal in Korean, diềm thăn bò in Vietnamese) is muscle meat from the rib-side part of the diaphragm. Don’t confuse it with flap meat, which is a different cut.',
        ko: '아니요. 안창살(영어로 outside skirt, 베트남어로 diềm thăn bò)은 횡격막 근육의 갈비 쪽 부분이에요. 플랩 미트(flap meat)와는 다른 부위예요.',
      },
    },
    {
      h: {
        vi: 'Vì sao cùng một khay mà chỗ mềm, chỗ dai?',
        en: 'Why is one tray tender in one spot and chewier in another?',
        ko: '같은 트레이인데 왜 어떤 곳은 부드럽고 어떤 곳은 쫄깃한가요?',
      },
      d: {
        vi: 'Có phần thịt gồm hai nhóm cơ khác nhau trong cùng một khay. Đầu thăn ngoại là ví dụ: phần nắp bao quanh bên ngoài đặc biệt mềm, phần lõi ở giữa dai hơn một chút.',
        en: 'Some cuts combine two different muscles in one tray. Ribeye is one example: the cap wrapped around the outside is especially tender, while the eye in the middle has a little more chew.',
        ko: '한 트레이에 서로 다른 두 근육이 함께 들어 있는 부위가 있어요. 꽃등심이 그 예로, 바깥을 감싼 새우살은 특히 부드럽고 가운데 알등심은 조금 더 씹는 맛이 있어요.',
      },
    },
    {
      h: {
        vi: 'Cùng một phần thịt, sao mỗi nơi gọi một tên?',
        en: 'Why do different places use different names for the same cut?',
        ko: '같은 부위인데 왜 파는 곳마다 이름이 다른가요?',
      },
      d: {
        vi: 'Tên tiếng Việt của các phần thịt bò thay đổi theo từng nhà bán, nên cùng một phần có thể có nhiều tên. Khi còn băn khoăn, hãy hỏi nhân viên quầy hoặc xem nhãn trên khay.',
        en: 'Vietnamese names for beef cuts vary from one seller to another, so the same cut can carry several names. If in doubt, ask the counter staff or check the label on the tray.',
        ko: '소고기 부위의 베트남어 이름은 판매처마다 달라서 같은 부위도 여러 이름으로 불릴 수 있어요. 헷갈리시면 정육 코너 직원에게 묻거나 트레이의 라벨을 확인해 보세요.',
      },
    },
  ] as ReadonlyArray<{ h: BaThuTieng; d: BaThuTieng }>,

  // --- Cuối trang -----------------------------------------------------------
  moiHieu: { vi: 'Đi cùng nhau', en: 'Coming as a group', ko: '함께 오실 때' },
  moiTieuDe1: { vi: 'Đã chọn được phần thịt?', en: 'Picked your cut?', ko: '마음에 드는 부위를 정하셨나요?' },
  moiTieuDe2: { vi: 'Đặt bàn trước nhé.', en: 'Book a table first.', ko: '테이블을 먼저 예약해 주세요.' },
  moiDan: {
    vi: 'Cho Beeftown biết ngày và số người. Nhà hàng kiểm tra rồi liên hệ để xác nhận với bạn.',
    en: 'Tell us the day and how many of you are coming. We will check and contact you to confirm.',
    ko: '날짜와 인원을 알려 주세요. 매장에서 확인한 뒤 연락드릴게요.',
  },
  moiTieuDeMenu1: { vi: 'Chọn xong rồi,', en: 'Once you’ve chosen your cut,', ko: '부위를 정하셨다면' },
  moiTieuDeMenu2: { vi: 'xem qua thực đơn', en: 'have a look at the menu', ko: '메뉴도 살펴보세요' },
  moiDanMenu: {
    vi: 'Bò chọn tại quầy, cùng món ăn và đồ uống cho cả bàn.',
    en: 'Beef you pick at the counter, plus dishes and drinks for the whole table.',
    ko: '정육 코너에서 고르는 소고기와 테이블에서 함께 나누는 요리, 음료가 있어요.',
  },

  // --- Nguồn ảnh -----------------------------------------------------------
  nguonTieuDe: { vi: 'Nguồn ảnh', en: 'Photo credits', ko: '사진 출처' },
  // Tên tác giả theo thứ tự trên trang. Chỉ tên người chụp: ảnh nào cũng giấy phép cho dùng lại;
  // riêng ảnh diềm thăn là CC BY 2.0, bắt buộc ghi tên, giấy phép và việc đã chỉnh.
  nguonDan: {
    vi: 'Ảnh các phần thịt do Tiago Morheto, BlackRiv và 홍대앞고깃집 chụp, dùng theo giấy phép của từng ảnh.',
    en: 'Photos of the cuts by Tiago Morheto, BlackRiv and 홍대앞고깃집, used under each photo’s licence.',
    ko: '부위 사진은 Tiago Morheto, BlackRiv, 홍대앞고깃집의 작품이며 각 사진의 라이선스에 따라 사용했어요.',
  },
  // Câu nguồn ảnh diềm thăn: [truoc] + link "Yazawa cut harami" + [giua] + link "CC BY 2.0" + [sau].
  nguonDiemThanTruoc: { vi: 'Ảnh diềm thăn bò: ', en: 'Outside skirt photo: ', ko: '안창살 사진: ' },
  nguonDiemThanGiua: { vi: ' của T.Tseng, giấy phép ', en: ' by T.Tseng, licence ', ko: ' (T.Tseng), 라이선스 ' },
  nguonDiemThanSau: {
    vi: ' (Wikimedia Commons), đã cắt khung và chỉnh sửa bằng AI (sửa màu, bỏ hơi nước trên vỉ).',
    en: ' (Wikimedia Commons), cropped and retouched with AI (colour corrected, steam haze removed).',
    ko: ' (Wikimedia Commons), 사진을 자르고 AI로 색 보정과 수증기 제거를 했어요.',
  },
  nguonConBo: {
    vi: 'Hình con bò: krypt (CC0, openclipart.org), đã đổi màu và bỏ chú thích.',
    en: 'Cow diagram: krypt (CC0, openclipart.org), recoloured, labels removed.',
    ko: '소 그림: krypt (CC0, openclipart.org), 색을 바꾸고 설명 글을 뺐어요.',
  },
} as const;

/** Trang gốc của ảnh diềm thăn (CC BY 2.0 — phải dẫn nguồn) và giấy phép của nó. */
export const NGUON_ANH_DIEM_THAN = {
  trang: 'https://commons.wikimedia.org/wiki/File:Yazawa_cut_harami_(sliced_outside_skirt)_(24034830974).jpg',
  giayPhep: 'https://creativecommons.org/licenses/by/2.0/',
} as const;
