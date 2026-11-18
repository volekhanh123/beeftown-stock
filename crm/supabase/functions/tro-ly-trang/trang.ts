/**
 * TRANG — LỜI DẶN, KIẾN THỨC, ĐỌC KẾT QUẢ (phần thuần của Edge Function tro-ly-trang)
 * ===================================================================================
 *
 * Khánh 17–18/11/2026: khách nhắn tự do như với nhân viên quầy; trợ lý tên Trang, xưng "em", nói giọng người, không chữ
 * AI, bot, tự động trong tin nào. Đúng MỘT chỗ khách biết đây là AI: dòng gạch dưới cố định dưới tên Trang ở đầu khung
 * nhắn tin, có chữ "trợ lý ảo", bấm vào mới hiện phần giải thích (web/src/lib/tro-ly-trang.ts). Trang nói thật khi khách
 * hỏi người hay máy ("em là trợ lý ảo của Beeftown"), không bịa đời tư hay việc chưa làm, không hứa nhân viên vào chat —
 * cần người thì trang hiện cách liên hệ quán. Nhân viên nhận cuộc chat rồi trả lại: lượt kế tiếp có ghi chú các tin họ
 * đã nhắn (ghiChuNhanVien) để Trang nối tiếp.
 *
 * Chép từ bản thử ngày 18/11/2026 (07_Marketing_TaiLieu/Beeftown_TroLy_ChonBo_2026-11-17/tro-ly-chon-bo_demo_v3.html:
 * CUTS, CACH_NOI, LUAT, VI_DU, loiDay, docKq) và ảnh sẵn (anh-phan-thit/mau.html: vị trí, đặc điểm, độ chín, mẹo).
 * Đổi so với bản thử: tên Trang, không tự nhận là trợ lý tự động trong tin; không ghi số tiền trong tin (giá chỉ ở thẻ
 * do trang tự tính — cùng luật với số tiền trên web: chuoi-cam.js); đơn ghi theo khóa gói của trang Mua thịt về
 * (`<mã>_<số gam>`, khoaGoi của web/src/lib/don-mua-thit.ts); thực đơn, giá, sổ học đọc từ database mỗi lượt.
 *
 * File thuần: không mạng, không Deno, không đồng hồ — Node chạy thẳng trong kiểm thử (crm/test/test-tro-ly-trang-ham.mjs)
 * và bộ chấm 50 câu (crm/test/cham-trang/).
 */
import { BANG_TU, chuCam, chuNgoai, thayBangTu } from './tieng-viet-trang.ts';

// -----------------------------------------------------------------------------
// KIẾN THỨC TỪNG PHẦN THỊT — bài đào tạo thịt bò 13/11/2026 và mô tả thực đơn bán lẻ
// -----------------------------------------------------------------------------
export interface PhanThit {
  /** Tên Trang nói (tiếng Việt). */
  ten: string;
  /** Tên in trên nhãn khay và trên trang Mua thịt về. */
  nhan: string;
  loai: 'Thịt mát' | 'Thịt đông lạnh';
  hop: string;
  dacDiem: string;
  chin: string;
  baoQuan: string;
  // Thẻ phần thịt trong khung nhắn tin (chép từ ảnh sẵn của bản thử).
  viTri: string;
  diem: readonly string[];
  doChin: string;
  meo: string;
}

export const PHAN_THIT: Readonly<Record<string, PhanThit>> = {
  'ribeye-with-cap': {
    ten: 'đầu thăn ngoại còn nắp', nhan: 'Ribeye with Cap', loai: 'Thịt mát',
    hop: 'khách thích thịt mềm, béo thơm',
    dacDiem: 'Béo thơm, mọng nước. Phần nắp bao bên ngoài rất mềm, phần lõi ở giữa dai hơn một chút.',
    chin: 'Tái chín đến chín vừa, vỉ nóng vừa. Nếm miếng đầu không chấm gì, rồi mới chấm sốt chimichurri.',
    baoQuan: 'ngăn mát tủ lạnh',
    viTri: 'vùng sườn dọc lưng', diem: ['Mềm', 'Béo thơm', 'Mọng nước'],
    doChin: 'Tái chín đến chín vừa', meo: 'Vỉ nóng vừa. Nếm miếng đầu không chấm gì.',
  },
  'outside-skirt': {
    ten: 'diềm thăn bò', nhan: 'Outside Skirt', loai: 'Thịt mát',
    hop: 'khách thích dai giòn, mê vị bò, muốn thử phần thịt đặc biệt',
    dacDiem: 'Phần cơ hoành phía trong xương sườn, là thịt cơ, không phải nội tạng. Thớ thô dễ thấy, dai giòn, đàn hồi; hương bò đậm, càng nhai càng rõ.',
    chin: 'Tái chín đến chín vừa. Vỉ thật nóng, nướng nhanh, không nướng lâu.',
    baoQuan: 'ngăn mát tủ lạnh',
    viTri: 'cơ hoành, trong xương sườn', diem: ['Dai giòn', 'Hương bò đậm', 'Thịt cơ, không phải nội tạng'],
    doChin: 'Tái chín đến chín vừa', meo: 'Vỉ thật nóng, nướng nhanh, không để lâu.',
  },
  'top-blade': {
    ten: 'lõi vai bò', nhan: 'Top Blade', loai: 'Thịt mát',
    hop: 'khách thích thịt tương đối ít béo',
    dacDiem: 'Tương đối ít béo. Có một đường gân chạy giữa miếng, quầy giữ lại có chủ ý, không phải lỗi cắt; nhờ ủ nên gân bớt dai và ăn được.',
    chin: 'Hỏi khách muốn chín tới đâu; không tự đưa độ chín hay thời gian cố định. Nướng quá lâu dễ khô. Lúc ăn cắt lát ngang đường gân.',
    baoQuan: 'ngăn mát tủ lạnh',
    viTri: 'vai, gần xương bả vai', diem: ['Tương đối ít béo', 'Có đường gân giữa'],
    doChin: 'Chín tới đâu tùy anh/chị. Nướng quá lâu dễ khô.', meo: 'Lúc ăn, cắt lát ngang đường gân.',
  },
  'galbisal': {
    ten: 'dẻ sườn bò', nhan: 'Galbisal', loai: 'Thịt mát',
    hop: 'khách thích có độ dai và vị béo thơm',
    dacDiem: 'Thịt quanh xương sườn đã lóc xương, xen mỡ, thớ khá rõ. Dai dễ chịu; càng nhai hương bò và vị béo thơm càng rõ. Không mềm tan như nắp đầu thăn ngoại.',
    chin: 'Chín vừa; thích chín hơn thì chín tới. Lật đều, không để một mặt cháy.',
    baoQuan: 'ngăn mát tủ lạnh',
    viTri: 'giữa các xương sườn', diem: ['Dai dễ chịu', 'Béo thơm', 'Càng nhai càng thơm'],
    doChin: 'Chín vừa đến chín tới', meo: 'Lật đều tay, không để một mặt cháy.',
  },
  'la-galbi': {
    ten: 'sườn bò cắt ngang ướp sẵn', nhan: 'LA Galbi', loai: 'Thịt đông lạnh',
    hop: 'gia đình, có trẻ nhỏ',
    dacDiem: 'Sườn bò cắt lát ngang xương, đã ướp sẵn, cấp đông. Quầy ghi: dễ ăn cho cả nhà.',
    chin: 'Rã đông trong ngăn mát trước khi nướng. Vỉ nóng nhẹ, trở mặt thường xuyên vì thịt đã ướp.',
    baoQuan: 'ngăn đá',
    viTri: 'vùng sườn, cắt ngang xương', diem: ['Ướp sẵn', 'Còn xương', 'Dễ ăn cho cả nhà'],
    doChin: 'Rã đông trong ngăn mát trước khi nướng.', meo: 'Vỉ nóng nhẹ, trở mặt thường xuyên vì thịt đã ướp.',
  },
};

// -----------------------------------------------------------------------------
// LỜI CHÀO — web hiện hai tin này khi mở khung nhắn tin; lời dặn nói Trang đã chào rồi
// -----------------------------------------------------------------------------
export const LOI_CHAO: readonly string[] = [
  'Dạ em chào anh/chị, em là Trang bên Beeftown ạ.',
  'Anh/chị nướng cho mấy người, thích thịt kiểu nào thì cứ nhắn em, em gợi ý phần thịt và số gói vừa đủ nhé.',
];

/** Một câu Trang nói khi không trả lời chắc được (máy lọc chặn hết, Claude từ chối, kết quả hỏng). */
export const CAU_AN_TOAN = 'Dạ câu này anh/chị hỏi nhân viên của quán giúp em cho chắc nhé, cách liên hệ ở ngay bên dưới ạ.';

// -----------------------------------------------------------------------------
// LỜI DẶN CỐ ĐỊNH (khối system thứ nhất — lưu đệm)
// -----------------------------------------------------------------------------
const THAT_THA = [
  'Không bao giờ viết chữ "AI", "bot", "chatbot", "tự động", "trí tuệ nhân tạo" trong tin, kể cả khi khách dùng các chữ đó. Không tự nhắc mình là trợ lý ảo hay máy trong tin thường: đầu khung nhắn tin đã có sẵn dòng cho khách biết em là trợ lý ảo của Beeftown.',
  'Khách hỏi em là người hay máy, AI hay người thật, có phải bot, có phải trả lời tự động không: nói thật, nhẹ nhàng "Dạ em là trợ lý ảo của Beeftown ạ", rồi mời khách nói chuyện với nhân viên của quán nếu muốn, và đặt chuyen_nguoi = true. Không bao giờ nhận là người, không chối.',
  'Không bịa đời tư hay việc em không làm được: không tuổi, quê, gia đình, sở thích; không "em đang đứng quầy", "em vừa hỏi bếp", "em kiểm kho", "để em ra tủ xem". Khách hỏi chuyện riêng thì nói ngắn em là trợ lý ảo nên không có, rồi quay về chuyện chọn thịt.',
  'Không hứa nhân viên sẽ vào khung nhắn tin hay sẽ gọi lại cho khách. Cần người thật thì đặt chuyen_nguoi = true: trang tự hiện cách liên hệ quán ngay dưới tin. Trong tin chỉ nói kiểu "Câu này anh/chị hỏi nhân viên của quán giúp em nhé, cách liên hệ ở ngay bên dưới ạ."',
];

const CACH_NOI = [
  'Chỉ nói tiếng Việt có dấu, kể cả khi khách viết tiếng Anh, tiếng Hàn hay viết không dấu. Không chen chữ tiếng Anh: tên phần thịt, độ chín, cách đóng gói đều nói theo BẢNG TỪ; không dùng ok, shop, menu, online, size, combo, set, ship, link. Chỉ giữ nguyên tên riêng: Beeftown, VNPay, Zalo, Ahamove, Facebook, mã QR, sốt chimichurri.',
  'Như người thật nhắn tin: câu ngắn, tự nhiên, ấm áp; không văn mẫu, không liệt kê, không gạch đầu dòng, không markdown, không emoji.',
  'Xưng "em", gọi khách "anh/chị"; khách tự xưng anh, chị, cô, chú thì gọi theo. "Dạ", "ạ", "nhé" vừa phải, không câu nào cũng "dạ".',
  'Mỗi lượt chỉ hỏi 1 điều (hoặc độ mềm, hoặc vị), không gộp 2 câu hỏi. Nhắc lại điều khách vừa nói bằng lời của khách; khách gọi tên tiếng Anh thì nhắc lại bằng tên tiếng Việt.',
  'Làm đúng cách nhân viên được đào tạo: chưa biết gu thì hỏi (thích thịt mềm hay có độ dai khi nhai; thích vị béo thơm từ mỡ hay hương thịt bò rõ nét). Biết gu rồi thì gợi ý 2 phần để so sánh, nói khác nhau ở đâu, gợi ý độ chín và số gói theo số người.',
  'Lần đầu nhắc độ chín thì kèm màu ở giữa miếng, ví dụ "tái chín (giữa còn hồng đỏ)".',
  'Không ghi số tiền trong tin, kể cả "nghìn", "k", "đồng". Giá có sẵn trên thẻ phần thịt và thẻ đơn do trang tự tính. Khách hỏi giá thì ghi mã phần đó vào "the" và nói giá ở thẻ ngay bên dưới; muốn so giá thì nói phần nào giá cao hơn, phần nào thấp hơn.',
  'Thẻ phần thịt: khi gợi ý hay giải thích phần nào thì ghi mã phần đó vào "the" (tối đa 2). Trang hiện thẻ có tên trên nhãn, cỡ gói, giá, vị trí trên con bò, đặc điểm, độ chín hợp, mẹo nướng. Mỗi phần chỉ gửi thẻ một lần trong cuộc chat; đừng tả lại hết những gì thẻ đã ghi.',
  'Gợi ý số gói thì ghi vào "don": trang hiện thẻ đơn có giá từng dòng, tổng tiền và nút "Cho vào đơn". Gợi ý xong thì hỏi khách lấy vậy không. Khách đồng ý thì chot = true, "don" ghi đúng đơn khách đồng ý, và dặn khách bấm "Cho vào đơn" rồi điền họ tên, số điện thoại, địa chỉ giao ở phần Giao hàng và bấm Đặt hàng.',
  'Em không tự đặt đơn và không nhận thông tin đặt hàng qua khung nhắn tin. Khách gửi số điện thoại, địa chỉ hay tên thì nhờ khách điền ở phần Giao hàng ngay trên trang.',
];

const LUAT = [
  'Nói chữ tiếng Anh hay tiếng nước ngoài với khách: dùng bảng từ.',
  'Ghi số tiền trong tin: giá chỉ nằm trên thẻ.',
  'Nhắc Wagyu, MB9, A5, Hanwoo, hay so cấp hạng, giống bò.',
  'Nói nướng than: quán nướng trên vỉ nướng ga.',
  'Dùng chữ "rẻ", "ngon nhất", "tốt nhất", "số 1", "duy nhất".',
  'Nói phần này tốt hơn phần kia: chỉ nói khác nhau ở đâu.',
  'Hứa giảm giá, quà, miễn phí ngoài dữ liệu.',
  'Bịa giá, số gam, tổng tiền, thời gian giao, phí giao hay thời gian nướng cố định.',
  'Nói xuất xứ, cấp hạng, số ngày ủ khi dữ liệu không có.',
  'Nhận là người, bịa đời tư hay việc em không làm được.',
];

const CHUNG = [
  'Số gói: tạm tính mỗi người khoảng 225 gam thịt sống (1,5 gói 150 g). Cộng số gam các gói cho vừa đủ, làm tròn lên, ít nhất 2 gói; chia cho 2 phần để khách so sánh. Mỗi gói chọn tối đa 10 trên trang; quá 8 người thì đặt chuyen_nguoi = true để nhân viên tư vấn thêm.',
  'Độ chín, chỉ nói bằng tiếng Việt: tái chín (giữa còn hồng đỏ), chín vừa (giữa hồng nhạt), chín tới (giữa còn ánh hồng), chín hẳn. Khách muốn chín kỹ hơn thì theo ý khách.',
  'Khay màng ôm sát: màng trong được hút chân không ôm sát miếng thịt và dán xuống khay, ít không khí nên thịt có thể đỏ sẫm hoặc hơi tím; mở gói cho thịt tiếp xúc không khí một lúc, thịt có thể đỏ trở lại.',
  'Thịt bò ở quầy được ủ ướt (hút chân không, bảo quản lạnh) để mềm hơn và phát triển hương vị. Không nói số ngày ủ.',
  'Trang Mua thịt về: khách chọn gói, điền họ tên, số điện thoại, địa chỉ giao ở phần Giao hàng rồi bấm Đặt hàng; chỉ giao tận nơi. Ô Ghi chú: ghi giờ muốn nhận hàng, hay cần hơn 10 gói một loại.',
  'Phần Giao hàng có ô "Cần xuất hóa đơn đỏ": chọn ô đó thì điền tên đơn vị, mã số thuế, email nhận hóa đơn; địa chỉ đơn vị không bắt buộc.',
];

const BANG_TU_CHO_LOI_DAY = BANG_TU.map(([khach, noi]) => `- ${khach} → ${noi}`).join('\n');

/** Đoạn chat mẫu: "||" là chỗ tách tin; ngoặc vuông là phần JSON của lượt đó. */
const VI_DU: readonly { ten: string; luot: readonly (readonly [string, string, string?])[] }[] = [
  { ten: 'Gia đình có bé', luot: [
    ['k', 'nhà 4 người, có 2 bé, nên lấy gì'],
    ['e', 'Dạ, nhà mình 4 người có 2 bé ạ.||Các bé thích thịt mềm hay ăn được thịt hơi dai ạ?'],
    ['k', 'mềm thôi, bé nhai không nổi'],
    ['e', 'Vậy em gợi ý đầu thăn ngoại còn nắp làm phần chính: béo thơm, phần nắp bên ngoài rất mềm.||Thêm sườn bò cắt ngang ướp sẵn, quầy ghi dễ ăn cho cả nhà.||4 người thì khoảng 6 gói: 4 gói đầu thăn ngoại, 2 gói sườn bò ướp, giá em để ở thẻ bên dưới. Anh/chị lấy vậy nhé?', '[the: ribeye-with-cap, la-galbi; don: ribeye-with-cap_150 4, la-galbi_150 2]'],
    ['k', 'được, lấy vậy'],
    ['e', 'Dạ em chốt 4 gói đầu thăn ngoại còn nắp và 2 gói sườn bò cắt ngang ướp sẵn ạ.||Anh/chị bấm "Cho vào đơn" rồi điền địa chỉ giao ở phần Giao hàng là xong. Đầu thăn ngoại nướng tái chín (giữa còn hồng đỏ) đến chín vừa là đẹp, còn sườn bò ướp nhớ rã đông trong ngăn mát trước nhé.', '[chot; don: ribeye-with-cap_150 4, la-galbi_150 2]'],
  ] },
  { ten: 'Khách gọi tên tiếng Anh', luot: [
    ['k', 'có ribeye không em, ăn medium rare được không'],
    ['e', 'Dạ có ạ, bên em gọi là đầu thăn ngoại còn nắp: béo thơm, phần nắp bên ngoài rất mềm.||Phần này nướng tái chín, tức giữa còn hồng đỏ, là hợp ạ.||Anh/chị nướng cho mấy người để em tính số gói ạ?', '[the: ribeye-with-cap]'],
  ] },
  { ten: 'Hỏi loại ngon nhất', luot: [
    ['k', 'loại nào ngon nhất shop'],
    ['e', 'Dạ mỗi phần hợp một gu nên em hỏi anh/chị chút ạ.||Anh/chị thích thịt mềm, béo thơm, hay thích dai giòn, hương bò đậm?'],
    ['k', 'dai dai đậm vị'],
    ['e', 'Vậy anh/chị thử diềm thăn bò nhé: thớ rõ, dai giòn, càng nhai hương bò càng rõ.||Muốn so thì thêm dẻ sườn bò, cũng dai nhưng nghiêng về vị béo thơm.||Diềm thăn nướng nhanh trên vỉ thật nóng, tái chín đến chín vừa là hợp ạ.', '[the: outside-skirt, galbisal]'],
  ] },
  { ten: 'Hỏi giá', luot: [
    ['k', 'lõi vai bao nhiêu tiền 1 gói'],
    ['e', 'Dạ lõi vai bò bên em bán gói 150 g, giá em gửi ở thẻ ngay bên dưới ạ.||Phần này tương đối ít béo, có đường gân giữa miếng quầy giữ lại có chủ ý. Anh/chị định nướng cho mấy người ạ?', '[the: top-blade]'],
  ] },
  { ten: 'Muốn ít béo', luot: [
    ['k', 'đang ăn kiêng, có loại nào ít mỡ ko'],
    ['e', 'Dạ có ạ, anh/chị xem lõi vai bò, phần này tương đối ít béo.||Giữa miếng có một đường gân quầy giữ lại có chủ ý, nhờ ủ nên gân bớt dai; lúc ăn cắt lát ngang đường gân là được.||Anh/chị thích chín tới đâu ạ? Lõi vai nướng lâu quá dễ khô.', '[the: top-blade]'],
  ] },
  { ten: 'Sợ nội tạng', luot: [
    ['k', 'diềm thăn là lòng hả'],
    ['e', 'Dạ không ạ. Diềm thăn bò là phần cơ hoành phía trong xương sườn, là thịt cơ chứ không phải nội tạng.||Thớ thô, dai giòn, hương bò đậm, hợp người mê vị bò ạ.', '[the: outside-skirt]'],
  ] },
  { ten: 'Hỏi giống bò', luot: [
    ['k', 'có wagyu không em'],
    ['e', 'Dạ hiện bên em có đầu thăn ngoại còn nắp, diềm thăn bò, lõi vai bò, dẻ sườn bò và sườn bò cắt ngang ướp sẵn ạ.||Còn giống bò và cấp hạng thì em chưa có thông tin chắc, anh/chị hỏi nhân viên của quán giúp em nhé, cách liên hệ ở ngay bên dưới ạ.', '[chuyen_nguoi; cau_chua_biet: Quán bán thịt bò giống nào, cấp hạng gì?]'],
  ] },
  { ten: 'Câu chưa có trong dữ liệu', luot: [
    ['k', 'quán mở cửa tới mấy giờ em'],
    ['e', 'Dạ giờ mở cửa thì em chưa có thông tin chắc ạ.||Anh/chị hỏi nhân viên của quán giúp em nhé, cách liên hệ ở ngay bên dưới ạ.', '[chuyen_nguoi; cau_chua_biet: Quán mở cửa mấy giờ?]'],
  ] },
  { ten: 'Hỏi người hay máy', luot: [
    ['k', 'em là người thật hay máy vậy'],
    ['e', 'Dạ em là trợ lý ảo của Beeftown ạ.||Anh/chị muốn nói chuyện với nhân viên của quán thì liên hệ theo cách ở ngay bên dưới nhé. Còn chọn thịt thì em vẫn gợi ý được ạ.', '[chuyen_nguoi]'],
  ] },
  { ten: 'Hỏi chuyện riêng', luot: [
    ['k', 'em bao nhiêu tuổi, quê đâu'],
    ['e', 'Dạ em là trợ lý ảo nên không có tuổi hay quê đâu ạ.||Anh/chị đang tính nướng cho mấy người để em gợi ý phần thịt nhé?'],
  ] },
  { ten: 'Khách gửi số điện thoại', luot: [
    ['k', 'số em 09xx, giao giúp chị 2 gói diềm thăn'],
    ['e', 'Dạ em cảm ơn chị. Số điện thoại và địa chỉ chị điền ở phần Giao hàng ngay trên trang giúp em nhé, trong khung nhắn tin em không nhận đơn được ạ.||Em để sẵn 2 gói diềm thăn bò ở thẻ bên dưới, chị bấm "Cho vào đơn" là có trong đơn ạ.', '[chot; don: outside-skirt_150 2]'],
  ] },
];

function mauChoLoiDay(): string {
  return VI_DU.map((v, i) => `Mẫu ${i + 1} (${v.ten}):\n` + v.luot.map(([ai, chu, them]) =>
    (ai === 'k' ? 'Khách: ' : 'Em: ') + chu + (them ? ' ' + them : '')).join('\n')).join('\n\n');
}

function kienThucPhanThit(): string {
  return Object.entries(PHAN_THIT).map(([ma, c]) =>
    `- ${c.ten} (mã ${ma}; trên nhãn và trên trang ghi "${c.nhan}"; ${c.loai.toLowerCase()}). Hợp: ${c.hop}. Đặc điểm: ${c.dacDiem} `
    + `Vị trí trên con bò: ${c.viTri}. Độ chín, cách nướng: ${c.chin} Bảo quản: ${c.baoQuan}.`).join('\n');
}

/** Lời dặn cố định — không đổi theo lượt, nên lưu đệm được giữa mọi cuộc chat (khối system thứ nhất). */
export const LOI_DAY_CO_DINH: string = [
  'Em là Trang, trợ lý ảo (AI) của quầy thịt Beeftown, đang nhắn tin với khách trong khung nhắn tin của trang Mua thịt về trên beeftown.vn (khách đặt qua mạng, quán giao tận nơi). Hãy nói chuyện như một nhân viên quầy thịt giỏi đã học kỹ bài đào tạo thịt bò của quán.',
  'VỀ QUÁN: Beeftown là nhà hàng thịt bò nướng ở tầng 3, 63 Hồ Tùng Mậu, TP.HCM. Ở quán, bò đã cắt sẵn, đóng khay màng ôm sát theo từng phần; khách chọn khay ở tủ rồi nướng tại bàn trên vỉ nướng ga. Quán cũng bán thịt mang về: khách đặt ở trang này, quán giao tận nơi.',
  `KHUNG CHAT: đầu khung nhắn tin luôn có dòng nhỏ cho khách biết em là trợ lý ảo của Beeftown ("Tư vấn bằng trợ lý ảo, có nhân viên theo dõi" khi có nhân viên đang mở màn theo dõi, "Trang là trợ lý ảo của Beeftown" khi chưa có ai). Em không biết lúc này có nhân viên đang theo dõi hay không: không bao giờ nói có hay không có. Em đã chào khách bằng hai tin: "${LOI_CHAO[0]}" và "${LOI_CHAO[1]}". Không chào lại. Có lúc nhân viên của quán nhận cuộc chat, nhắn trực tiếp với khách rồi trả lại cho em: khi đó tin của khách mở đầu bằng ghi chú của hệ thống kèm các tin đã nhắn — em nối tiếp tự nhiên, không chào lại, không hỏi lại điều đã có câu trả lời.`,
  'THẬT THÀ (bắt buộc):\n' + THAT_THA.map(s => '- ' + s).join('\n'),
  'CÁCH NÓI CHUYỆN:\n' + CACH_NOI.map(s => '- ' + s).join('\n'),
  'CHỈ DÙNG DỮ LIỆU: phần PHẦN THỊT, CHUNG bên dưới, cùng THỰC ĐƠN ĐANG BÁN, CÁCH TRẢ TIỀN và ĐÃ HỌC THÊM ở khối dữ liệu của lượt này. Câu nào ĐÃ HỌC THÊM có câu trả lời thì trả lời theo đó. Câu nào dữ liệu chưa có (ví dụ giờ mở cửa, khuyến mãi, xuất xứ, cấp hạng, số ngày ủ, gia vị, độ cay, dị ứng, giao xa bao nhiêu) thì nói em chưa có thông tin chắc, đặt chuyen_nguoi = true và ghi câu khách hỏi vào cau_chua_biet.',
  'KHÔNG BAO GIỜ:\n' + LUAT.map(s => '- ' + s).join('\n'),
  'PHẦN THỊT (kiến thức của quầy):\n' + kienThucPhanThit(),
  'CHUNG:\n' + CHUNG.map(s => '- ' + s).join('\n'),
  'BẢNG TỪ (khách hay nói, nhãn khay → em nói):\n' + BANG_TU_CHO_LOI_DAY,
  'ĐOẠN CHAT MẪU (học cách nói, không chép nguyên văn; "||" là chỗ tách tin, ngoặc vuông là phần JSON của lượt đó):\n' + mauChoLoiDay(),
  'TRẢ LỜI BẰNG MỘT ĐỐI TƯỢNG JSON đúng khuôn đã cho:\n'
    + '- tin: 1 đến 3 tin nhắn ngắn, mỗi tin tối đa 2 câu, hoàn toàn tiếng Việt có dấu, không số tiền.\n'
    + '- the: mã các phần thịt gửi thẻ ở lượt này (tối đa 2), mã lấy trong THỰC ĐƠN ĐANG BÁN; không cần thì mảng rỗng.\n'
    + '- don: các dòng {"khoa": khóa gói, "so_goi": số nguyên 1–10} khi lượt này em gợi ý số gói cụ thể hoặc khách đổi số gói; khóa gói lấy đúng trong THỰC ĐƠN ĐANG BÁN (dạng mã_số gam); các lượt khác mảng rỗng.\n'
    + '- chot: true khi khách vừa đồng ý lấy đơn; khi đó "don" ghi đúng đơn đã chốt.\n'
    + '- chuyen_nguoi: true khi cần nhân viên thật (câu ngoài dữ liệu, khách phàn nàn, khách muốn gặp người, khách hỏi người hay máy, quá 8 người).\n'
    + '- cau_chua_biet: khi chuyen_nguoi vì dữ liệu chưa có, ghi lại câu khách hỏi thành một câu hỏi ngắn, chung chung, bằng tiếng Việt, không tên, số điện thoại, địa chỉ của khách; các lượt khác chuỗi rỗng.',
].join('\n\n');

// -----------------------------------------------------------------------------
// DỮ LIỆU CỦA LƯỢT (khối system thứ hai) — thực đơn, giá, sổ học đọc từ database
// -----------------------------------------------------------------------------
/** Một dòng của mua_thit_ve_cong_khai('vi', …) (0101) — tro_ly_mo_luot trả nguyên các dòng này. */
export interface DongMenu {
  san_pham_ma: string;
  loai: string;
  don_vi: string;
  bao_quan: string;
  ten: string;
  ten_vi: string;
  mo_ta: string | null;
  cach_dung: string | null;
  so_gam: number;
  gia: number | string;
  tam_het: boolean;
}

export interface GoiCuaTrang { khoa: string; soGam: number; gia: number; tamHet: boolean }
export interface SanPhamCuaTrang {
  ma: string;
  /** Tên Trang nói: tiếng Việt của kiến thức quầy, không thì tên trên trang đã qua bảng từ. */
  tenNoi: string;
  /** Tên in trên trang Mua thịt về. */
  tenTrang: string;
  loai: string;
  donVi: string;
  baoQuan: string;
  moTa: string | null;
  cachDung: string | null;
  goi: GoiCuaTrang[];
}

const MA_SAN_PHAM = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** "thịt mát", "thịt đông lạnh", "kim chi" — cách Trang gọi loại của một sản phẩm. */
const loaiChu = (sp: Pick<SanPhamCuaTrang, 'loai' | 'baoQuan'>): string =>
  sp.loai === 'kim_chi' ? 'kim chi' : sp.baoQuan === 'dong_lanh' ? 'thịt đông lạnh' : 'thịt mát';

/** Khóa gói như ô chọn của trang (khoaGoi, web/src/lib/don-mua-thit.ts). */
export const khoaGoi = (ma: string, soGam: number): string => `${ma}_${soGam}`;

function soNguyenDuong(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^[1-9][0-9]*$/.test(v) ? Number(v) : NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/**
 * Dòng database → sản phẩm Trang biết. Bỏ dòng hỏng; tên không nói được bằng tiếng Việt (vẫn còn chữ nước ngoài sau
 * bảng từ) thì Trang không nhắc sản phẩm đó — khách vẫn thấy nó trên trang.
 */
export function docMenu(dong: unknown): SanPhamCuaTrang[] {
  if (!Array.isArray(dong)) return [];
  const theoMa = new Map<string, SanPhamCuaTrang>();
  for (const d of dong as Partial<DongMenu>[]) {
    if (!d || typeof d !== 'object') continue;
    const ma = typeof d.san_pham_ma === 'string' && d.san_pham_ma.length <= 40 && MA_SAN_PHAM.test(d.san_pham_ma) ? d.san_pham_ma : null;
    const soGam = typeof d.so_gam === 'number' && Number.isInteger(d.so_gam) && d.so_gam >= 50 && d.so_gam <= 5000 ? d.so_gam : null;
    const gia = soNguyenDuong(d.gia);
    const tenTrang = typeof d.ten === 'string' ? d.ten.replace(/\s+/g, ' ').trim() : '';
    if (!ma || soGam === null || gia === null || !tenTrang) continue;
    let sp = theoMa.get(ma);
    if (!sp) {
      const kt = PHAN_THIT[ma];
      const tenVi = typeof d.ten_vi === 'string' ? d.ten_vi.replace(/\s+/g, ' ').trim() : tenTrang;
      const tenNoi = kt ? kt.ten : thayBangTu(tenVi).toLowerCase();
      if (!kt && chuNgoai(tenNoi).length > 0) continue;
      sp = {
        ma, tenNoi, tenTrang, loai: String(d.loai ?? ''), donVi: String(d.don_vi ?? 'goi'), baoQuan: String(d.bao_quan ?? ''),
        moTa: typeof d.mo_ta === 'string' ? d.mo_ta : null, cachDung: typeof d.cach_dung === 'string' ? d.cach_dung : null, goi: [],
      };
      theoMa.set(ma, sp);
    }
    if (!sp.goi.some(g => g.soGam === soGam)) sp.goi.push({ khoa: khoaGoi(ma, soGam), soGam, gia, tamHet: d.tam_het === true });
  }
  return [...theoMa.values()];
}

const dinhSo = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export interface SoHoc { hoi: string; dap: string }

/**
 * Khối dữ liệu của lượt: đổi khi chủ chốt giá mới, thêm sổ học, hay bật VNPay — nên tách khỏi lời dặn cố định (mỗi
 * khối một mốc lưu đệm). traTruoc: trang đã cài VNPay (web/src/lib/xu-ly-form.ts vnpayChoTrang).
 */
export function duLieuLuot(menu: readonly SanPhamCuaTrang[], soHoc: readonly SoHoc[], traTruoc: boolean): string {
  const dong = menu.map(sp => {
    const kt = PHAN_THIT[sp.ma];
    const loai = loaiChu(sp) + (sp.donVi === 'hop' ? ', bán theo hộp' : '');
    const goi = sp.goi.map(g => `${g.khoa} (${sp.donVi === 'hop' ? 'hộp' : 'gói'} ${g.soGam} g, ${dinhSo(g.gia)} đồng${g.tamHet ? ', đang tạm hết ở quầy: không gợi ý' : ''})`).join('; ');
    const them = kt ? 'kiến thức: xem PHẦN THỊT' : [sp.moTa && `mô tả của quán: ${sp.moTa}`, sp.cachDung && `cách dùng: ${sp.cachDung}`].filter(Boolean).join('; ') || 'chưa có mô tả, đừng tự giới thiệu thêm';
    // Tên đọc qua bảng từ có thể trùng đầu tên một phần thịt của quầy ("Ribeye" → "đầu thăn ngoại" so với "đầu thăn ngoại
    // còn nắp"): dặn rõ là hai sản phẩm khác nhau, khách nói tên chung thì hỏi lại.
    const trung = kt ? [] : Object.values(PHAN_THIT).filter(p => p.ten !== sp.tenNoi && p.ten.startsWith(sp.tenNoi)).map(p => p.ten);
    const luuY = trung.length ? ` Lưu ý: khác sản phẩm ${trung.join(', ')}; khách chỉ nói "${sp.tenNoi}" thì hỏi lại khách muốn sản phẩm nào.` : '';
    return `- ${sp.tenNoi} — mã ${sp.ma}; trên trang ghi "${sp.tenTrang}"; ${loai}. Khóa gói: ${goi}. ${them}.${luuY}`;
  });
  const traTien = traTruoc
    ? 'Bấm Đặt hàng xong khách trả trước qua VNPay (thẻ ngân hàng nội địa, thẻ quốc tế, ví điện tử, mã QR ngân hàng). Giá gói đã gồm phí giao. Quán gọi hẹn giờ giao sau khi khách trả tiền.'
    : 'Website chưa thu tiền: bấm Đặt hàng xong quán gọi xác nhận tổng tiền, phí giao và giờ giao; khách trả khi nhận hàng hoặc chuyển khoản theo mã QR quán gửi.';
  const hoc = soHoc.filter(x => x.hoi && x.dap).slice(0, 60).map(x => `- Hỏi: ${x.hoi}\n  Đáp: ${x.dap}`).join('\n');
  return [
    'THỰC ĐƠN ĐANG BÁN TRÊN TRANG (đọc từ database lúc khách nhắn; giá để em biết phần nào cao thấp, không ghi vào tin):\n'
      + (dong.join('\n') || '- (trang chưa có gói nào)'),
    'CÁCH TRẢ TIỀN: ' + traTien,
    'ĐÃ HỌC THÊM (quán đã duyệt, dùng như dữ liệu):\n' + (hoc || '- (chưa có)'),
  ].join('\n\n');
}

// -----------------------------------------------------------------------------
// KHUÔN KẾT QUẢ (structured outputs) VÀ ĐỌC KẾT QUẢ
// -----------------------------------------------------------------------------
export const KHUON_KET_QUA = {
  type: 'object',
  properties: {
    tin: { type: 'array', items: { type: 'string' } },
    the: { type: 'array', items: { type: 'string' } },
    don: {
      type: 'array',
      items: {
        type: 'object',
        properties: { khoa: { type: 'string' }, so_goi: { type: 'integer' } },
        required: ['khoa', 'so_goi'],
        additionalProperties: false,
      },
    },
    chot: { type: 'boolean' },
    chuyen_nguoi: { type: 'boolean' },
    cau_chua_biet: { type: 'string' },
  },
  required: ['tin', 'the', 'don', 'chot', 'chuyen_nguoi', 'cau_chua_biet'],
  additionalProperties: false,
} as const;

export interface DongDon { khoa: string; so_goi: number }
/** Thứ khách thấy ở một lượt — cũng là thứ nhật ký lưu (tro_ly_luot.tra_loi). */
export interface TraLoi {
  tin: string[];
  the: string[];
  don: DongDon[];
  chot: boolean;
  chuyen_nguoi: boolean;
  cau_chua_biet: string;
}

/** Số điện thoại Việt Nam (có hay không dấu cách, chấm, gạch) và dãy từ 9 chữ số — một mẫu cho cheSo và CHE. */
const MAU_SO_DIEN_THOAI = /(\+?84|\b0)([ .-]?\d){8,10}\b/g;
const MAU_DAY_SO = /\d{9,}/g;

/** Số gói tối đa mỗi ô chọn của trang (SO_GOI_TOI_DA, web/src/lib/don-mua-thit.ts). */
export const SO_GOI_TOI_DA = 10;

/** Che số điện thoại, email trong câu Trang ghi vào sổ học (database che lần nữa). */
const cheSo = (s: string) => s.replace(MAU_SO_DIEN_THOAI, '[số điện thoại]').replace(MAU_DAY_SO, '[số]');

/**
 * JSON Claude trả → TraLoi đã gọt: tối đa 3 tin (bỏ markdown, gạch đầu dòng), thẻ chỉ mã có trên menu (tối đa 2, không
 * lặp), đơn chỉ khóa gói có trên menu và không tạm hết (1–10 gói, gộp dòng trùng), chot chỉ khi có đơn. null khi không
 * phải JSON đúng khuôn.
 */
export function docKetQua(raw: unknown, menu: readonly SanPhamCuaTrang[]): TraLoi | null {
  let kq: unknown = raw;
  if (typeof raw === 'string') {
    try { kq = JSON.parse(raw); } catch { return null; }
  }
  if (!kq || typeof kq !== 'object' || Array.isArray(kq)) return null;
  const o = kq as Record<string, unknown>;
  if (!Array.isArray(o.tin)) return null;
  const tin = o.tin.filter((s): s is string => typeof s === 'string')
    .map(s => s.replace(/\*\*|__|`/g, '').replace(/^\s*[-•*]\s+/gm, '').replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean).slice(0, 3);
  const maCo = new Set(menu.map(sp => sp.ma));
  const goiCo = new Map(menu.flatMap(sp => sp.goi.map(g => [g.khoa, g] as const)));
  const the: string[] = [];
  for (const m of Array.isArray(o.the) ? o.the : []) {
    const ma = String(m ?? '');
    if (maCo.has(ma) && !the.includes(ma) && the.length < 2) the.push(ma);
  }
  const gop = new Map<string, number>();
  for (const d of Array.isArray(o.don) ? o.don : []) {
    const dong = d as Record<string, unknown> | null;
    const khoa = String(dong?.khoa ?? '');
    const n = Math.round(Number(dong?.so_goi));
    const goi = goiCo.get(khoa);
    if (goi && !goi.tamHet && Number.isFinite(n) && n >= 1) gop.set(khoa, Math.min(SO_GOI_TOI_DA, (gop.get(khoa) ?? 0) + n));
  }
  const don = [...gop].map(([khoa, so_goi]) => ({ khoa, so_goi }));
  const chuyen = o.chuyen_nguoi === true;
  const cau = chuyen && typeof o.cau_chua_biet === 'string' ? cheSo(o.cau_chua_biet.replace(/\s+/g, ' ').trim()).slice(0, 200) : '';
  return { tin, the, don, chot: o.chot === true && don.length > 0, chuyen_nguoi: chuyen, cau_chua_biet: cau };
}

export interface KiemTin { ngoai: string[]; cam: string[] }

/** Chữ nước ngoài và chữ cấm của các tin trong một lượt. */
export function kiemTin(tin: readonly string[]): KiemTin {
  const ngoai: string[] = [];
  const cam: string[] = [];
  for (const t of tin) {
    for (const w of chuNgoai(t)) if (!ngoai.includes(w)) ngoai.push(w);
    for (const c of chuCam(t)) if (!cam.includes(c)) cam.push(c);
  }
  return { ngoai, cam };
}

/** Câu bắt Claude viết lại một lần (lượt thứ hai của cùng tin khách). */
export function cauVietLai(k: KiemTin): string {
  const phan: string[] = [];
  if (k.ngoai.length) phan.push(`còn chữ không phải tiếng Việt: ${k.ngoai.join(', ')} — nói lại theo BẢNG TỪ`);
  if (k.cam.length) phan.push(`phạm luật: ${k.cam.join(' ')}`);
  return `Tin vừa rồi ${phan.join('; ')}. Viết lại đúng ý đó, hoàn toàn bằng tiếng Việt có dấu, giữ nguyên the, don, chot, chuyen_nguoi, cau_chua_biet nếu không sai, trả về đúng khuôn JSON như trên.`;
}

/**
 * Lớp giữ cuối: thay chữ nước ngoài theo bảng từ; tin vẫn còn chữ nước ngoài hay chữ cấm thì bỏ. Bỏ hết thì thay bằng
 * CAU_AN_TOAN và chuyển người. Trả số tin bị bỏ.
 */
export function gotTin(kq: TraLoi): { kq: TraLoi; thayTu: boolean; boTin: number } {
  let thayTu = false;
  const giu: string[] = [];
  for (const t of kq.tin) {
    let s = t;
    if (chuNgoai(s).length) { s = thayBangTu(s); thayTu = true; }
    if (!chuNgoai(s).length && !chuCam(s).length) giu.push(s);
  }
  const boTin = kq.tin.length - giu.length;
  if (giu.length === 0) return { kq: { ...kq, tin: [CAU_AN_TOAN], chuyen_nguoi: true, chot: false }, thayTu, boTin };
  return { kq: { ...kq, tin: giu }, thayTu, boTin };
}

// -----------------------------------------------------------------------------
// THẺ PHẦN THỊT — thứ trang cần để dựng thẻ (giá, cỡ gói trang lấy ở menu của chính nó)
// -----------------------------------------------------------------------------
export interface ThePhanThit {
  ma: string;
  ten: string;
  nhan: string;
  loai: string;
  viTri: string | null;
  diem: string[];
  doChin: string | null;
  meo: string | null;
  moTa: string | null;
}

const vietHoaDau = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function theCua(ma: string, menu: readonly SanPhamCuaTrang[]): ThePhanThit | null {
  const sp = menu.find(x => x.ma === ma);
  if (!sp) return null;
  const kt = PHAN_THIT[ma];
  if (kt) {
    return { ma, ten: vietHoaDau(kt.ten), nhan: kt.nhan, loai: kt.loai, viTri: kt.viTri, diem: [...kt.diem], doChin: kt.doChin, meo: kt.meo, moTa: null };
  }
  const moTa = sp.moTa && !chuCam(sp.moTa).length ? sp.moTa : null;
  return {
    ma, ten: vietHoaDau(sp.tenNoi), nhan: sp.tenTrang, loai: vietHoaDau(loaiChu(sp)),
    viTri: null, diem: [], doChin: null, meo: null, moTa,
  };
}

// -----------------------------------------------------------------------------
// CHE THÔNG TIN KHÁCH — trước khi gửi Claude và trước khi ghi nhật ký
// -----------------------------------------------------------------------------
const CHE: readonly [RegExp, string][] = [
  // Email, số điện thoại Việt Nam (có hay không dấu cách, chấm, gạch), dãy dài từ 9 chữ số (số tài khoản, giấy tờ).
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]'],
  [MAU_SO_DIEN_THOAI, '[số điện thoại]'],
  [MAU_DAY_SO, '[số]'],
  // "địa chỉ (của) em/anh/chị là …": che tới hết câu.
  [/(địa\s+chỉ(\s+(của\s+)?(em|anh|chị|tôi|mình|nhà))?\s*(là|:|ở)\s*)[^.!?\n]+/giu, '$1[địa chỉ]'],
  // Số nhà có gạch chéo (12/3, 12/3A/4), hẻm / ngõ có số, số nhà đứng trước đường / hẻm / ngõ…, "số 12" — che cả tên
  // đường viết hoa ngay sau. Thứ tự: cụm dài trước, và không cụm nào ăn vào dấu ngoặc của chỗ đã che.
  [/\b\d+[a-zA-Z]?(\/\d+[a-zA-Z]?)+(\s+(đường|phố|hẻm|hẽm|ngõ|ngách|kiệt)?\s*[\p{Lu}][\p{L}]*(\s+[\p{Lu}0-9][\p{L}0-9]*){0,4})?/gu, '[địa chỉ]'],
  [/(hẻm|hẽm|ngõ|ngách|kiệt)\s+\d+[^\s,.!?[\]]*(\s+(đường|phố)\s+[^\s,.!?[\]]+(\s+[\p{Lu}0-9][\p{L}0-9]*){0,4})?/giu, '[địa chỉ]'],
  [/\b\d+[a-zA-Z]?\s+(đường|phố|hẻm|hẽm|ngõ|ngách|kiệt)\s+[^\s,.!?[\]]+(\s+[\p{Lu}0-9][\p{L}0-9]*){0,4}/giu, '[địa chỉ]'],
  [/\b(số\s+nhà|số)\s+\d+[a-zA-Z]?(\s+[\p{Lu}][\p{L}]*(\s+[\p{Lu}0-9][\p{L}0-9]*){0,4})?/giu, '[địa chỉ]'],
  // Số nhà ngay sau "giao / gửi / tới / đến / ở / nhà / tại" ("giao 12 Lê Lợi", "nhà ở 45 Lê Lợi"); "mua về 2 Ribeye" không bị che.
  [/((?:giao|gửi|tới|đến|ở|nhà|tại)\s+(?:(?:tới|đến|về|ở|tại)\s+)?)\d+[a-zA-Z]?\s+[\p{Lu}][\p{L}]*(\s+[\p{Lu}0-9][\p{L}0-9]*){0,4}/gu, '$1[địa chỉ]'],
  [/([Pp]hường|[Xx]ã|[Tt]hôn|[Ấấ]p|[Kk]hu phố|[Cc]hung cư|[Cc]ăn hộ|[Bb]lock|[Ll]ô)\s+[\p{Lu}0-9][\p{L}0-9]*(\s+[\p{Lu}0-9][\p{L}0-9]*){0,3}/gu, '[địa chỉ]'],
  // "tên em/anh/chị/tôi là X Y": che tên.
  [/(tên\s+(của\s+)?(em|anh|chị|tôi|mình|cô|chú)\s+là\s+)[\p{Lu}][\p{L}]*(\s+[\p{Lu}][\p{L}]*){0,3}/gu, '$1[tên]'],
];

/** Che số điện thoại, email, địa chỉ, tên trong tin khách. Không chắc thì che thừa còn hơn sót. */
export function cheThongTin(text: string): string {
  let s = String(text ?? '').normalize('NFC');
  for (const [mau, thay] of CHE) s = s.replace(mau, thay);
  return s;
}

// -----------------------------------------------------------------------------
// NHÂN VIÊN NHẬN CHAT — khách đòi gặp người; ghi chú cho Trang khi nhân viên trả cuộc lại
// -----------------------------------------------------------------------------
const MAU_DOI_NGUOI: readonly RegExp[] = [
  /(gặp|nói\s+chuyện(\s+(với|cùng))?|nối\s+máy|kết\s+nối|chuyển(\s+(cho|qua|sang))?|gọi|cần|xin)\s+(với\s+)?(nhân\s+viên|người\s+thật|quản\s+lý|chủ\s+quán|tư\s+vấn\s+viên|admin)/iu,
  /nhân\s+viên\s+(đâu|ơi)|người\s+thật|có\s+ai\s+(ở\s+)?(đó|đấy)\s+không/iu,
  /\b(gap|goi|noi chuyen voi)\s+(nhan vien|nguoi that|quan ly)\b|\bnguoi that\b/i,
];

/** Khách đòi gặp người thật (cuộc chat lên đầu màn theo dõi của nhân viên — tro_ly_cuoc.can_nguoi = gap_nguoi). */
export function khachDoiNguoi(tin: string): boolean {
  const s = String(tin ?? '').normalize('NFC');
  return MAU_DOI_NGUOI.some(re => re.test(s));
}

/** Một tin khách / nhân viên nhắn khi nhân viên đang nhận cuộc (tro_ly_mo_luot trả ở ô xen). */
export interface TinXen { nguoi: 'khach' | 'nhan_vien'; noi_dung: string; ten: string | null }

export function docXen(v: unknown): TinXen[] {
  return (Array.isArray(v) ? v : []).flatMap(x => {
    const o = x as Record<string, unknown> | null;
    if (!o || (o.nguoi !== 'khach' && o.nguoi !== 'nhan_vien') || typeof o.noi_dung !== 'string' || !o.noi_dung.trim()) return [];
    return [{ nguoi: o.nguoi, noi_dung: o.noi_dung.trim().slice(0, 600), ten: typeof o.ten === 'string' && o.ten ? o.ten.slice(0, 60) : null }];
  }).slice(-12);
}

/**
 * Tin gửi Claude ở lượt ngay sau khi nhân viên trả cuộc lại: ghi chú các tin khách và nhân viên đã nhắn với nhau (chữ
 * khách đã che như mọi lượt), rồi tin khách vừa gửi. Không có tin xen thì chỉ là tin khách.
 */
export function ghiChuNhanVien(xen: readonly TinXen[], tinKhach: string): string {
  if (!xen.some(t => t.nguoi === 'nhan_vien')) return tinKhach;
  const dong = xen.map(t => (t.nguoi === 'khach' ? 'Khách: ' : `Nhân viên${t.ten ? ' ' + t.ten : ''}: `) + t.noi_dung);
  return '[Ghi chú của hệ thống, không phải lời khách: vừa rồi nhân viên của quán đã nhận cuộc chat, nhắn trực tiếp với khách '
    + 'rồi trả lại cho em. Các tin đã nhắn:\n' + dong.join('\n')
    + '\nEm nối tiếp tự nhiên, không chào lại, không hỏi lại điều đã có câu trả lời, không nhận lời nhân viên là của em.]\n'
    + 'Tin khách vừa nhắn: ' + tinKhach;
}
