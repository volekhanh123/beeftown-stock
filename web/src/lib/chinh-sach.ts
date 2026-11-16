/**
 * CÁC TRANG CHÍNH SÁCH — chữ của tám trang, ba thứ tiếng đặt cạnh nhau
 * ===================================================================
 *
 * Khánh giao 16/11/2026. Trang Mua thịt về cho khách đặt hàng và trả trước qua VNPay, nên beeftown.vn là
 * "nền tảng thương mại điện tử kinh doanh trực tiếp có chức năng đặt hàng trực tuyến" (Luật Thương mại điện
 * tử 122/2025/QH15, Nghị định 248/2026/NĐ-CP). Điểm a khoản 1 Điều 17 Nghị định 248: nội dung Chương II phải
 * công bố đầy đủ, hoặc có link ở màn hình chính — nên chân trang có nhóm CHÍNH SÁCH trỏ tới tám trang này
 * cùng trang Quyền riêng tư (ChanTrang.astro).
 *
 * Bản tiếng Việt là bản gốc Khánh duyệt (Sang đọc phần giao hàng và đổi trả). Bản tiếng Anh và tiếng Hàn
 * dịch đúng ý từng câu, không thêm lời hứa nào bản tiếng Việt không có — đây là cam kết với khách và với
 * cơ quan quản lý. Sửa một câu thì sửa cả ba bản ngay trong cùng một mục.
 *
 * Thông tin vận hành chưa chốt (khu vực giao, giờ giao, VAT…) lấy từ CHO_TRONG (lib/cho-trong.ts) — không tự
 * điền. Hai dữ kiện cố định dùng lại: tên công ty, mã số thuế, số điện thoại của PHAP_NHAN (lib/chu.ts).
 *
 * ĐỊA CHỈ: địa chỉ đăng ký của công ty chỉ in ở chân trang, đúng một lần mỗi trang (web/kiem-tra/
 * trinh-duyet.mjs đếm; ở chỗ khác khách đọc nó thành địa chỉ quán), nên thân trang nói "ghi ở cuối trang".
 * Nhà hàng ghi "63 Hồ Tùng Mậu, TP.HCM": không số tầng (chưa chốt tầng 3 hay tầng 4), không tên phường
 * (chưa có giấy xác nhận — luật PHUONG_QUAN của web/kiem-tra/mau-dia-diem.mjs).
 *
 * CÁCH VIẾT MỘT CÂU. Mỗi câu là MỘT chuỗi cho mỗi thứ tiếng (compressHTML không làm dính chữ trong một
 * chuỗi). Link viết kiểu [chữ](đích): đích bắt đầu bằng "/" là đường dẫn tiếng Việt, trang tự đổi sang
 * đúng thứ tiếng qua duongDanTuongUng; tel:, mailto:, https: giữ nguyên (tachLienKet bên dưới).
 *
 * Kiểm thử: crm/test/test-cong-khai-chinh-sach.mjs (đủ ba thứ tiếng, link, chỗ trống, chữ cấm, luật địa
 * điểm, chân trang, trang Mua thịt về, bước chặn deploy).
 */

import type { NgonNgu } from './noi-dung.ts';
import { PHAP_NHAN } from './chu.ts';
import { CHO_TRONG } from './cho-trong.ts';

export type Cau = Readonly<Record<NgonNgu, string>>;
/** Một khối trong mục: đoạn văn, hoặc danh sách gạch đầu dòng. */
export type Khoi = Cau | { readonly danhSach: readonly Cau[] };
export interface MucChinhSach { readonly tieuDe: Cau; readonly khoi: readonly Khoi[] }
export interface TrangChinhSach {
  /** Đường dẫn tiếng Việt — dòng của trang trong CAP_DUONG_DAN (lib/chu.ts). */
  readonly duong: string;
  /** Tên ngắn: link ở chân trang, nhãn đỏ trên tiêu đề, đầu thẻ <title>. */
  readonly ten: Cau;
  readonly tieuDe: Cau;
  readonly moTa: Cau;
  readonly muc: readonly MucChinhSach[];
}

/**
 * Ngày cập nhật in ở cuối mỗi trang. Đổi chữ trang nào (kể cả khi điền chỗ trống) thì đổi ngày này —
 * Điều khoản hứa: "Beeftown ghi ngày cập nhật ở cuối trang".
 */
export const NGAY_CAP_NHAT = '16/11/2026';
export const CAU_CAP_NHAT: Cau = {
  vi: `Cập nhật ngày ${NGAY_CAP_NHAT}.`,
  en: `Last updated ${NGAY_CAP_NHAT}.`,
  ko: `최종 수정일: ${NGAY_CAP_NHAT}`,
};

// --- Dữ kiện dùng lại ---------------------------------------------------------------------------------
const SDT = PHAP_NHAN.dienThoai;
const GOI = `[${SDT}](tel:${SDT.replace(/\s/g, '')})`;
const EMAIL = `[${CHO_TRONG.EMAIL}](mailto:${CHO_TRONG.EMAIL})`;
const MESSENGER = '[facebook.com/beeftownvn](https://www.facebook.com/beeftownvn)';
// Tên Zalo OA giữ nguyên chữ Việt ở mọi thứ tiếng: khách gõ đúng tên này để tìm OA.
const ZALO_OA = 'Nhà hàng Beeftown Hồ Tùng Mậu';
const { VUNG_GIAO, GIO_GIAO, DON_VI_GIAO, GIU_LANH, CACH_TINH_GOI, VAT, GIAO_LAI, GIO_BAO_LOI, NGAY_HOAN, GIO_TRA_LOI, GIO_HO_TRO } = CHO_TRONG;

const LIEN_HE: readonly Cau[] = [
  { vi: `Điện thoại: ${GOI}`, en: `Phone: ${GOI}`, ko: `전화: ${GOI}` },
  { vi: `Messenger: ${MESSENGER}`, en: `Messenger: ${MESSENGER}`, ko: `Messenger: ${MESSENGER}` },
  { vi: `Zalo OA: ${ZALO_OA}`, en: `Zalo Official Account: ${ZALO_OA}`, ko: `Zalo 공식 계정: ${ZALO_OA}` },
  { vi: `Email: ${EMAIL}`, en: `Email: ${EMAIL}`, ko: `이메일: ${EMAIL}` },
];

// --- Tám trang -------------------------------------------------------------------------------------------
export type KhoaChinhSach = 'dieuKhoan' | 'chinhSachGia' | 'thanhToan' | 'giaoHang' | 'doiTra' | 'khieuNai' | 'dieuKienBan' | 'hoTro';

export const CHINH_SACH: Readonly<Record<KhoaChinhSach, TrangChinhSach>> = {
  dieuKhoan: {
    duong: '/dieu-khoan',
    ten: { vi: 'Điều khoản', en: 'Terms', ko: '이용약관' },
    tieuDe: {
      vi: 'Điều khoản mua thịt về qua beeftown.vn',
      en: 'Terms for take-home orders on beeftown.vn',
      ko: 'beeftown.vn 포장 구매 이용약관',
    },
    moTa: {
      vi: 'Quyền và nghĩa vụ của Beeftown và của bạn khi đặt mua thịt về qua beeftown.vn.',
      en: 'The rights and duties of Beeftown and of you when you order beef to take home on beeftown.vn.',
      ko: 'beeftown.vn에서 포장 구매를 주문하실 때 Beeftown과 고객님의 권리와 의무를 안내해요.',
    },
    muc: [
      { tieuDe: { vi: 'Áp dụng cho', en: 'What these terms cover', ko: '적용 범위' }, khoi: [
        {
          vi: 'Các điều khoản này áp dụng cho đơn đặt qua trang [Mua thịt về](/mua-thit-ve) của beeftown.vn. Bấm Đặt hàng nghĩa là bạn đồng ý các điều khoản này.',
          en: 'These terms apply to orders placed on the [Take home](/mua-thit-ve) page of beeftown.vn. By tapping Place order you agree to them.',
          ko: '이 약관은 beeftown.vn의 [포장 구매](/mua-thit-ve) 페이지에서 하신 주문에 적용돼요. 주문하기를 누르시면 이 약관에 동의하시는 거예요.',
        },
        {
          vi: 'Hàng bán qua web: thịt bò mát, thịt bò đông lạnh và kim chi cải thảo hộp 500 g.',
          en: 'Sold on the website: chilled beef, frozen beef and napa cabbage kimchi in 500 g boxes.',
          ko: '웹사이트에서 판매하는 상품은 냉장 소고기, 냉동 소고기, 500 g 통 배추김치예요.',
        },
      ] },
      { tieuDe: { vi: 'Bên bán', en: 'The seller', ko: '판매자' }, khoi: [
        {
          vi: `Bên bán là ${PHAP_NHAN.ten}, mã số thuế ${PHAP_NHAN.maSoThue}, điện thoại ${GOI}, email ${EMAIL}. Địa chỉ đăng ký của công ty ghi ở cuối trang.`,
          en: `The seller is ${PHAP_NHAN.ten}, tax code ${PHAP_NHAN.maSoThue}, phone ${GOI}, email ${EMAIL}. The company's registered address is at the foot of this page.`,
          ko: `판매자는 ${PHAP_NHAN.ten}(세금 코드 ${PHAP_NHAN.maSoThue})이에요. 전화 ${GOI}, 이메일 ${EMAIL}. 회사 등록 주소는 페이지 맨 아래에 있어요.`,
        },
        {
          vi: 'Hàng giao đi từ nhà hàng Beeftown, 63 Hồ Tùng Mậu, TP.HCM.',
          en: 'Orders are sent out from the Beeftown restaurant, 63 Hồ Tùng Mậu, Ho Chi Minh City.',
          ko: '상품은 호치민시 Hồ Tùng Mậu 63 Beeftown 매장에서 보내 드려요.',
        },
      ] },
      { tieuDe: { vi: 'Beeftown có trách nhiệm', en: 'What Beeftown does', ko: 'Beeftown의 책임' }, khoi: [
        { danhSach: [
          { vi: 'Ghi đúng tên, trọng lượng, giá của từng gói.', en: 'Show the correct name, weight and price of every pack.', ko: '팩마다 이름, 중량, 가격을 정확히 적어요.' },
          { vi: 'Giao đúng hàng bạn đã đặt.', en: 'Deliver exactly what you ordered.', ko: '주문하신 상품을 그대로 배달해요.' },
          {
            vi: 'Giữ thông tin của bạn theo trang [Quyền riêng tư](/quyen-rieng-tu).',
            en: 'Keep your information as set out on the [Privacy](/quyen-rieng-tu) page.',
            ko: '[개인정보 처리방침](/quyen-rieng-tu)에 따라 고객님의 정보를 보관해요.',
          },
          {
            vi: 'Nhận và giải quyết khiếu nại theo trang [Khiếu nại](/khieu-nai).',
            en: 'Take and resolve complaints as set out on the [Complaints](/khieu-nai) page.',
            ko: '[불만 접수](/khieu-nai) 페이지에 따라 불만을 접수하고 처리해요.',
          },
        ] },
      ] },
      { tieuDe: { vi: 'Bạn có trách nhiệm', en: 'What you do', ko: '고객님의 책임' }, khoi: [
        { danhSach: [
          { vi: 'Ghi đúng họ tên, số điện thoại, địa chỉ giao.', en: 'Give your correct name, phone number and delivery address.', ko: '이름, 전화번호, 배달 주소를 정확히 적어 주세요.' },
          { vi: 'Nghe máy khi quán gọi hẹn giờ giao.', en: 'Answer when we call to arrange the delivery time.', ko: '배달 시간을 정하는 매장 전화를 받아 주세요.' },
          { vi: 'Kiểm hàng khi nhận.', en: 'Check the order when it arrives.', ko: '받으실 때 상품을 확인해 주세요.' },
          {
            vi: 'Cất thịt vào ngăn mát hoặc ngăn đá ngay sau khi nhận.',
            en: 'Put the beef in the fridge or freezer as soon as you receive it.',
            ko: '받으신 뒤 바로 고기를 냉장실이나 냉동실에 넣어 주세요.',
          },
        ] },
      ] },
      { tieuDe: { vi: 'Ảnh trên web', en: 'Photos on the website', ko: '웹사이트 사진' }, khoi: [
        {
          vi: 'Ảnh ghi "Ảnh minh họa" có thể khác miếng thịt thật về hình dáng, vân mỡ. Tên phần thịt và trọng lượng ghi trên nhãn gói là thông tin chính.',
          en: 'Photos marked "Illustrative image" may differ from the actual piece in shape and marbling. The cut name and weight on the pack label are what count.',
          ko: '"연출 이미지" 표시가 있는 사진은 실제 고기와 모양, 마블링이 다를 수 있어요. 팩 라벨에 적힌 부위 이름과 중량이 기준이에요.',
        },
      ] },
      { tieuDe: { vi: 'Thay đổi điều khoản', en: 'Changes to these terms', ko: '약관 변경' }, khoi: [
        {
          vi: 'Beeftown ghi ngày cập nhật ở cuối trang. Đơn đã trả tiền tính theo điều khoản tại thời điểm đặt.',
          en: 'Beeftown shows the date of the last update at the end of this page. A paid order follows the terms in force when it was placed.',
          ko: 'Beeftown은 페이지 맨 아래에 최종 수정일을 적어 둬요. 결제하신 주문에는 주문 당시의 약관이 적용돼요.',
        },
      ] },
      { tieuDe: { vi: 'Luật áp dụng', en: 'Governing law', ko: '준거법' }, khoi: [
        {
          vi: 'Pháp luật Việt Nam, gồm Luật Thương mại điện tử 2025 và Luật Bảo vệ quyền lợi người tiêu dùng 2023.',
          en: 'The laws of Vietnam, including the Law on E-commerce 2025 and the Law on Consumer Rights Protection 2023.',
          ko: '베트남 법률이 적용되며, 2025년 전자상거래법과 2023년 소비자권익보호법을 포함해요.',
        },
      ] },
    ],
  },

  chinhSachGia: {
    duong: '/chinh-sach-gia',
    ten: { vi: 'Chính sách giá', en: 'Pricing', ko: '가격 정책' },
    tieuDe: {
      vi: 'Giá trên beeftown.vn được tính thế nào',
      en: 'How prices on beeftown.vn work',
      ko: 'beeftown.vn 가격 안내',
    },
    moTa: {
      vi: 'Giá gói, phí giao, VAT và giá của đơn đã trả trên trang Mua thịt về của Beeftown.',
      en: 'Pack prices, delivery, VAT and the price of a paid order on the Beeftown Take home page.',
      ko: 'Beeftown 포장 구매 페이지의 팩 가격, 배달비, VAT, 결제하신 주문의 가격을 안내해요.',
    },
    muc: [
      { tieuDe: { vi: 'Giá gói', en: 'Pack prices', ko: '팩 가격' }, khoi: [
        { danhSach: [
          { vi: 'Giá trên web là giá của từng gói, đơn vị đồng.', en: 'Prices on the website are per pack, in Vietnamese dong.', ko: '웹사이트 가격은 팩별 가격이며, 단위는 베트남 동(VND)이에요.' },
          {
            vi: 'Giá gói đã gồm phí giao trong khu vực ở trang [Giao hàng](/giao-hang).',
            en: 'Pack prices include delivery within the area on the [Delivery](/giao-hang) page.',
            ko: '팩 가격에는 [배달](/giao-hang) 페이지에 안내한 지역까지의 배달비가 포함돼요.',
          },
          { vi: `VAT: ${VAT.vi}.`, en: `VAT: ${VAT.en}.`, ko: `VAT: ${VAT.ko}.` },
        ] },
      ] },
      { tieuDe: { vi: 'Gói theo trọng lượng', en: 'Packs sold by weight', ko: '중량으로 표시된 팩' }, khoi: [
        {
          // Khánh 16/11/2026: nhãn gói ghi đúng số gam, không "khoảng" (lib/don-mua-thit.ts).
          vi: `Gói ghi 150 g (hoặc 200 g, 400 g): ${CACH_TINH_GOI.vi}.`,
          en: `Packs marked 150 g (or 200 g, 400 g): ${CACH_TINH_GOI.en}.`,
          ko: `150 g(또는 200 g, 400 g)으로 표시된 팩: ${CACH_TINH_GOI.ko}.`,
        },
      ] },
      { tieuDe: { vi: 'Khi giá đổi', en: 'When prices change', ko: '가격이 바뀔 때' }, khoi: [
        {
          vi: 'Giá có thể đổi theo giá nhập thịt. Đơn đã trả tiền giữ đúng giá lúc đặt.',
          en: 'Prices may change with what we pay for beef. A paid order keeps the price it had when you placed it.',
          ko: '가격은 고기 매입가에 따라 바뀔 수 있어요. 결제하신 주문은 주문 당시 가격 그대로예요.',
        },
      ] },
    ],
  },

  thanhToan: {
    duong: '/thanh-toan',
    ten: { vi: 'Thanh toán', en: 'Payment', ko: '결제' },
    tieuDe: {
      vi: 'Trả tiền cho đơn mua thịt về',
      en: 'Paying for a take-home order',
      ko: '포장 주문 결제 안내',
    },
    moTa: {
      vi: 'Cách trả tiền qua VNPay cho đơn Mua thịt về, và việc cần làm khi trả không xong hay đã bị trừ tiền mà chưa thấy đơn.',
      en: 'How to pay for a take-home order with VNPay, and what to do if the payment does not go through or you were charged but see no order.',
      ko: '포장 주문을 VNPay로 결제하는 방법과, 결제가 끝나지 않았거나 돈이 빠져나갔는데 주문이 보이지 않을 때 하실 일을 안내해요.',
    },
    muc: [
      { tieuDe: { vi: 'Cách trả', en: 'How to pay', ko: '결제 방법' }, khoi: [
        {
          vi: 'Trả trước qua VNPay ngay sau khi bấm Đặt hàng: thẻ ATM nội địa, thẻ quốc tế, ví điện tử hoặc mã QR ngân hàng.',
          en: 'Pay in advance with VNPay right after you tap Place order: Vietnamese ATM card, international card, e-wallet or bank QR code.',
          ko: '주문하기를 누른 뒤 바로 VNPay로 미리 결제해 주세요. 베트남 ATM 카드, 해외 카드, 전자지갑, 은행 QR 코드를 쓸 수 있어요.',
        },
        {
          vi: 'Hiện Beeftown chưa nhận trả tiền khi nhận hàng (COD).',
          en: 'Beeftown does not take cash on delivery (COD) for now.',
          ko: '지금은 받으실 때 결제하는 방식(COD)은 받지 않아요.',
        },
      ] },
      { tieuDe: { vi: 'Thông tin thẻ', en: 'Your card details', ko: '카드 정보' }, khoi: [
        {
          vi: 'Bạn nhập thẻ hay tài khoản trên trang của VNPay, và VNPay xử lý thông tin đó. Beeftown không thấy và không lưu số thẻ.',
          en: 'You enter your card or account on the VNPay page, and VNPay handles those details. Beeftown never sees or stores your card number.',
          ko: '카드나 계좌 정보는 VNPay 페이지에서 입력하시고, VNPay가 처리해요. Beeftown은 카드 번호를 보거나 저장하지 않아요.',
        },
      ] },
      { tieuDe: { vi: 'Khi nào đơn được xác nhận', en: 'When your order is confirmed', ko: '주문이 확정되는 때' }, khoi: [
        {
          vi: 'Đơn chỉ được xác nhận khi VNPay báo bạn đã trả xong. Sau đó quán gọi số điện thoại bạn ghi để hẹn giờ giao.',
          en: 'Your order is confirmed only once VNPay reports that you have paid. We then call the number you gave to arrange the delivery time.',
          ko: 'VNPay에서 결제가 끝났다고 알려 온 뒤에야 주문이 확정돼요. 그다음 남겨 주신 번호로 전화드려 배달 시간을 정해요.',
        },
      ] },
      { tieuDe: { vi: 'Trả không xong', en: 'If the payment does not go through', ko: '결제가 끝나지 않았을 때' }, khoi: [
        {
          vi: 'Bạn hủy trên trang VNPay, nhập sai mã OTP hay tài khoản không đủ tiền: tiền không bị trừ, đơn chưa được trả và chưa được giao. Bạn trả lại ngay bằng nút Trả tiền qua VNPay ở trang kết quả, trên điện thoại hay máy tính vừa đặt đơn; hoặc gọi Beeftown.',
          en: 'If you cancel on the VNPay page, enter a wrong OTP or do not have enough money: nothing is charged, and the order stays unpaid and is not delivered. Pay again straight away with the Pay with VNPay button on the result page, on the phone or computer you ordered from; or call Beeftown.',
          ko: 'VNPay 페이지에서 취소하셨거나, OTP를 잘못 입력하셨거나, 잔액이 부족하면 돈은 빠져나가지 않고 주문은 결제되지 않은 채 배달되지 않아요. 주문하신 휴대폰이나 컴퓨터에서 결과 페이지의 VNPay로 결제하기 버튼으로 바로 다시 결제하시거나, Beeftown에 전화해 주세요.',
        },
      ] },
      { tieuDe: { vi: 'Đã bị trừ tiền mà chưa thấy đơn', en: 'Charged but no order', ko: '돈이 빠져나갔는데 주문이 보이지 않을 때' }, khoi: [
        {
          vi: `Tiền đã bị trừ mà không thấy đơn, hoặc không ai gọi hẹn giờ giao: gọi ${GOI} hoặc nhắn Beeftown. Beeftown kiểm với VNPay, rồi giao đơn hoặc hoàn tiền trong ${NGAY_HOAN} ngày làm việc.`,
          en: `If you were charged but see no order, or nobody calls to arrange delivery: call ${GOI} or message Beeftown. We check with VNPay, then deliver the order or refund you within ${NGAY_HOAN} working days.`,
          ko: `돈이 빠져나갔는데 주문이 보이지 않거나 배달 시간을 정하는 전화가 오지 않으면 ${GOI}로 전화하시거나 Beeftown에 메시지를 보내 주세요. Beeftown이 VNPay와 확인한 뒤 주문을 배달하거나 영업일 기준 ${NGAY_HOAN}일 이내에 환불해 드려요.`,
        },
      ] },
    ],
  },

  giaoHang: {
    duong: '/giao-hang',
    ten: { vi: 'Giao hàng', en: 'Delivery', ko: '배달' },
    tieuDe: {
      vi: 'Beeftown giao thịt tới bạn thế nào',
      en: 'How Beeftown delivers your order',
      ko: 'Beeftown 배달 안내',
    },
    moTa: {
      vi: 'Khu vực giao, giờ giao, người giao, cách giữ lạnh và việc cần kiểm khi nhận đơn Mua thịt về.',
      en: 'Delivery area, delivery times, who delivers, how the order is kept cold and what to check when a take-home order arrives.',
      ko: '포장 주문의 배달 지역, 배달 시간, 배달하는 사람, 신선하게 차갑게 유지하는 방법, 받으실 때 확인하실 점을 안내해요.',
    },
    muc: [
      { tieuDe: { vi: 'Khu vực giao', en: 'Delivery area', ko: '배달 지역' }, khoi: [
        { vi: `Khu vực giao: ${VUNG_GIAO.vi}.`, en: `Delivery area: ${VUNG_GIAO.en}.`, ko: `배달 지역: ${VUNG_GIAO.ko}.` },
        {
          // "đổi địa chỉ" là chữ luật CHUYEN_DIA_DIEM chặn (kể chuyện quán đổi địa điểm) — nói "nhận ở địa chỉ khác".
          vi: 'Địa chỉ ngoài khu vực này: quán gọi báo, bạn chọn nhận ở một địa chỉ khác trong khu vực hoặc được hoàn tiền.',
          en: 'If your address is outside this area, we call to let you know, and you choose another address within the area or a refund.',
          ko: '주소가 이 지역 밖이면 매장에서 전화로 알려 드리고, 이 지역 안의 다른 주소로 받으실지 환불받으실지 고르실 수 있어요.',
        },
      ] },
      { tieuDe: { vi: 'Giờ giao', en: 'Delivery times', ko: '배달 시간' }, khoi: [
        { vi: `Giờ giao: ${GIO_GIAO.vi}.`, en: `Delivery times: ${GIO_GIAO.en}.`, ko: `배달 시간: ${GIO_GIAO.ko}.` },
        {
          vi: 'Quán gọi số điện thoại bạn ghi để hẹn giờ.',
          en: 'We call the phone number you gave to agree a time.',
          ko: '남겨 주신 전화번호로 연락드려 시간을 정해요.',
        },
      ] },
      { tieuDe: { vi: 'Người giao và giữ lạnh', en: 'Who delivers, and keeping it cold', ko: '배달하는 사람과 냉장 유지' }, khoi: [
        { vi: `Người giao: ${DON_VI_GIAO.vi}.`, en: `Delivered by: ${DON_VI_GIAO.en}.`, ko: `배달: ${DON_VI_GIAO.ko}.` },
        { vi: `Giữ lạnh: ${GIU_LANH.vi}.`, en: `Keeping it cold: ${GIU_LANH.en}.`, ko: `냉장 유지: ${GIU_LANH.ko}.` },
      ] },
      { tieuDe: { vi: 'Khi nhận hàng', en: 'When your order arrives', ko: '받으실 때' }, khoi: [
        {
          vi: 'Kiểm số gói, tên phần thịt trên nhãn, gói còn kín và còn lạnh.',
          en: 'Check the number of packs, the cut name on each label, and that every pack is sealed and still cold.',
          ko: '팩 개수, 라벨에 적힌 부위 이름, 팩이 잘 밀봉되어 있고 아직 차가운지 확인해 주세요.',
        },
        {
          vi: 'Có vấn đề thì chụp ảnh, báo quán ngay. Xem trang [Đổi trả, hoàn tiền](/doi-tra-hoan-tien).',
          en: 'If something is wrong, take a photo and tell us straight away. See the [Returns and refunds](/doi-tra-hoan-tien) page.',
          ko: '문제가 있으면 사진을 찍어 바로 매장에 알려 주세요. [교환·환불](/doi-tra-hoan-tien) 페이지를 확인해 주세요.',
        },
      ] },
      { tieuDe: { vi: 'Khi quán không gọi được bạn', en: 'If we cannot reach you', ko: '전화 연결이 안 될 때' }, khoi: [
        {
          vi: 'Quán gọi 2 lần không được thì nhắn tin hẹn lại.',
          en: 'If we cannot reach you after calling twice, we send a message to arrange another time.',
          ko: '두 번 전화드려도 연결되지 않으면 메시지로 다시 시간을 정해요.',
        },
        {
          vi: `Giao lại lần 2 do bạn hẹn lại: ${GIAO_LAI.vi}.`,
          en: `A second delivery because you asked to rearrange: ${GIAO_LAI.en}.`,
          ko: `고객님 요청으로 다시 배달하는 경우: ${GIAO_LAI.ko}.`,
        },
      ] },
    ],
  },

  doiTra: {
    duong: '/doi-tra-hoan-tien',
    ten: { vi: 'Đổi trả, hoàn tiền', en: 'Returns and refunds', ko: '교환·환불' },
    tieuDe: {
      vi: 'Khi nào Beeftown đổi gói mới hoặc hoàn tiền',
      en: 'When Beeftown replaces a pack or refunds you',
      ko: 'Beeftown 교환·환불 안내',
    },
    moTa: {
      vi: 'Trường hợp được đổi gói mới hoặc hoàn tiền, cách báo, thời hạn và cách hoàn tiền cho đơn Mua thịt về.',
      en: 'When you get a new pack or a refund for a take-home order, how to tell us, the time limit and how refunds are paid.',
      ko: '포장 주문에서 새 팩으로 교환하거나 환불받으실 수 있는 경우, 알리는 방법, 기한, 환불 방법을 안내해요.',
    },
    muc: [
      { tieuDe: { vi: 'Beeftown đổi gói mới hoặc hoàn tiền khi', en: 'Beeftown replaces the pack or refunds you when', ko: '이럴 때 새 팩으로 교환하거나 환불해 드려요' }, khoi: [
        { danhSach: [
          { vi: 'Giao sai phần thịt.', en: 'We delivered the wrong cut.', ko: '다른 부위가 배달됐을 때' },
          { vi: 'Thiếu gói.', en: 'A pack is missing.', ko: '팩이 빠졌을 때' },
          { vi: 'Gói rách, hở màng.', en: 'A pack is torn or the film is open.', ko: '팩이 찢어졌거나 포장 필름이 열렸을 때' },
          { vi: 'Thịt không còn lạnh lúc nhận.', en: 'The beef is no longer cold when it arrives.', ko: '받으실 때 고기가 차갑지 않을 때' },
          { vi: 'Gói đã quá ngày ghi trên nhãn.', en: 'The pack is past the date on its label.', ko: '라벨에 적힌 날짜가 지났을 때' },
        ] },
      ] },
      { tieuDe: { vi: 'Cách báo', en: 'How to tell us', ko: '알리는 방법' }, khoi: [
        {
          vi: `Trong ${GIO_BAO_LOI} giờ kể từ lúc nhận, gọi ${GOI} hoặc nhắn Beeftown, gửi ảnh nhãn gói và chỗ lỗi.`,
          en: `Within ${GIO_BAO_LOI} hours of receiving the order, call ${GOI} or message Beeftown, with a photo of the pack label and the problem.`,
          ko: `받으신 때부터 ${GIO_BAO_LOI}시간 이내에 ${GOI}로 전화하시거나 Beeftown에 메시지를 보내, 팩 라벨과 문제가 있는 부분의 사진을 보내 주세요.`,
        },
        { vi: 'Giữ lại gói, chưa dùng.', en: 'Keep the pack and do not use it.', ko: '팩은 사용하지 말고 보관해 주세요.' },
      ] },
      { tieuDe: { vi: 'Không nhận trả', en: 'What we cannot take back', ko: '반품을 받지 않는 경우' }, khoi: [
        {
          vi: 'Beeftown không nhận trả khi bạn đổi ý sau khi đã nhận hàng, vì thịt và kim chi đã giao không bán lại được.',
          en: 'Beeftown cannot take an order back because you changed your mind after receiving it, as beef and kimchi that have been delivered cannot be sold again.',
          ko: '받으신 뒤 마음이 바뀌신 경우에는 반품을 받지 않아요. 배달된 고기와 김치는 다시 판매할 수 없기 때문이에요.',
        },
      ] },
      { tieuDe: { vi: 'Hoàn tiền', en: 'Refunds', ko: '환불' }, khoi: [
        {
          vi: `Tiền hoàn về đúng thẻ hoặc ví bạn đã dùng để trả qua VNPay, trong ${NGAY_HOAN} ngày làm việc kể từ lúc Beeftown đồng ý hoàn.`,
          en: `Refunds go back to the card or wallet you used to pay with VNPay, within ${NGAY_HOAN} working days of Beeftown agreeing to the refund.`,
          ko: `환불은 VNPay 결제에 쓰신 카드나 지갑으로, Beeftown이 환불을 승인한 때부터 영업일 기준 ${NGAY_HOAN}일 이내에 해 드려요.`,
        },
      ] },
      { tieuDe: { vi: 'Hủy đơn chưa giao', en: 'Cancelling before delivery', ko: '배달 전 주문 취소' }, khoi: [
        {
          vi: 'Đơn chưa giao mà bạn muốn hủy: gọi quán trước giờ hẹn giao, Beeftown hoàn toàn bộ tiền.',
          en: 'To cancel an order that has not been delivered, call us before the agreed delivery time and Beeftown refunds the full amount.',
          ko: '아직 배달되지 않은 주문을 취소하시려면 약속한 배달 시간 전에 매장에 전화해 주세요. Beeftown이 전액 환불해 드려요.',
        },
      ] },
    ],
  },

  khieuNai: {
    duong: '/khieu-nai',
    ten: { vi: 'Khiếu nại', en: 'Complaints', ko: '불만 접수' },
    tieuDe: {
      vi: 'Gửi khiếu nại tới Beeftown',
      en: 'How to make a complaint',
      ko: 'Beeftown 불만 접수 안내',
    },
    moTa: {
      vi: 'Nơi gửi khiếu nại về đơn Mua thịt về, thời hạn trả lời, cách Beeftown giải quyết và nơi bạn có thể phản ánh tiếp.',
      en: 'Where to send a complaint about a take-home order, how soon we reply, how Beeftown resolves it and where else you can turn.',
      ko: '포장 주문에 대한 불만을 보내실 곳, 답변 기한, Beeftown의 처리 방법, 그 밖에 민원을 제기하실 수 있는 곳을 안내해요.',
    },
    muc: [
      { tieuDe: { vi: 'Gửi qua', en: 'Where to send it', ko: '보내실 곳' }, khoi: [
        { danhSach: LIEN_HE },
        {
          vi: 'Ghi số điện thoại đã đặt đơn và ngày đặt.',
          en: 'Include the phone number you ordered with and the date of the order.',
          ko: '주문하실 때 쓰신 전화번호와 주문 날짜를 함께 적어 주세요.',
        },
      ] },
      { tieuDe: { vi: 'Thời hạn', en: 'How soon we reply', ko: '답변 기한' }, khoi: [
        { vi: `Beeftown trả lời trong ${GIO_TRA_LOI.vi}.`, en: `Beeftown replies within ${GIO_TRA_LOI.en}.`, ko: `Beeftown은 ${GIO_TRA_LOI.ko} 이내에 답변해 드려요.` },
      ] },
      { tieuDe: { vi: 'Cách giải quyết', en: 'How we resolve it', ko: '처리 방법' }, khoi: [
        {
          vi: 'Beeftown kiểm đơn và ảnh bạn gửi, rồi đổi hàng, hoàn tiền hoặc giải thích lý do từ chối.',
          en: 'Beeftown checks the order and the photos you sent, then replaces the goods, refunds you, or explains why we decline.',
          ko: 'Beeftown이 주문과 보내 주신 사진을 확인한 뒤 교환이나 환불을 해 드리거나, 거절하는 이유를 설명해 드려요.',
        },
      ] },
      { tieuDe: { vi: 'Chưa đồng ý cách giải quyết', en: 'If you do not agree', ko: '처리 결과에 동의하지 않으실 때' }, khoi: [
        {
          vi: 'Bạn có quyền gửi phản ánh tới Sở Công Thương TP.HCM, tới Hệ thống quản lý hoạt động thương mại điện tử (online.gov.vn), tới tổ chức bảo vệ người tiêu dùng, hoặc khởi kiện tại tòa án theo pháp luật Việt Nam.',
          en: 'You have the right to raise it with the Ho Chi Minh City Department of Industry and Trade, with the e-commerce management system (online.gov.vn) or with a consumer protection organisation, or to bring a claim in court under Vietnamese law.',
          ko: '호치민시 산업무역국, 전자상거래 관리 시스템(online.gov.vn), 소비자 보호 단체에 민원을 제기하시거나, 베트남 법에 따라 법원에 소송을 제기하실 권리가 있어요.',
        },
      ] },
    ],
  },

  dieuKienBan: {
    duong: '/dieu-kien-ban-hang',
    ten: { vi: 'Điều kiện bán hàng', en: 'Conditions of sale', ko: '판매 조건' },
    tieuDe: {
      vi: 'Điều kiện bán hàng qua beeftown.vn',
      en: 'Conditions of sale on beeftown.vn',
      ko: 'beeftown.vn 판매 조건',
    },
    moTa: {
      vi: 'Nơi giao, số gói tối đa, khi hàng hết sau lúc bạn đã trả, và ai mua được qua beeftown.vn.',
      en: 'Where we deliver, how many packs you can order, what happens if something sells out after you pay, and who can buy on beeftown.vn.',
      ko: 'beeftown.vn의 배달 지역, 주문 가능한 팩 수, 결제 후 품절될 때, 구매 대상을 안내해요.',
    },
    muc: [
      { tieuDe: { vi: 'Nơi giao', en: 'Where we deliver', ko: '배달 지역' }, khoi: [
        {
          vi: 'Beeftown chỉ giao trong khu vực ở trang [Giao hàng](/giao-hang).',
          en: 'Beeftown only delivers within the area on the [Delivery](/giao-hang) page.',
          ko: 'Beeftown은 [배달](/giao-hang) 페이지에 안내한 지역에만 배달해요.',
        },
      ] },
      { tieuDe: { vi: 'Số gói mỗi đơn', en: 'How many packs', ko: '주문 수량' }, khoi: [
        {
          vi: 'Mỗi gói đặt được tối đa 10 trên web. Cần nhiều hơn thì ghi ở ô Ghi chú, quán gọi báo có đủ hàng không.',
          en: 'You can order up to 10 of each pack on the website. If you need more, say so in the Note box and we will call to tell you whether we have enough.',
          ko: '웹사이트에서는 팩마다 최대 10개까지 주문하실 수 있어요. 더 필요하시면 메모란에 적어 주세요. 재고가 충분한지 전화로 알려 드려요.',
        },
      ] },
      { tieuDe: { vi: 'Khi hàng hết', en: 'If something sells out', ko: '품절될 때' }, khoi: [
        {
          vi: 'Thịt và kim chi có số lượng theo ngày. Hết hàng sau khi bạn đã trả: quán gọi báo, bạn chọn đổi phần khác cùng giá hoặc được hoàn tiền.',
          en: 'Beef and kimchi are limited each day. If something sells out after you have paid, we call you, and you choose another item at the same price or a refund.',
          ko: '고기와 김치는 날마다 수량이 정해져 있어요. 결제하신 뒤 품절되면 매장에서 전화드리고, 같은 가격의 다른 상품으로 바꾸실지 환불받으실지 고르실 수 있어요.',
        },
      ] },
      { tieuDe: { vi: 'Ai mua được', en: 'Who can buy', ko: '구매 대상' }, khoi: [
        {
          vi: 'Web chỉ bán cho khách mua để dùng, không bán sỉ.',
          en: 'The website sells only to customers buying for their own use, not wholesale.',
          ko: '웹사이트에서는 직접 드실 분께만 판매하며, 도매는 하지 않아요.',
        },
      ] },
    ],
  },

  hoTro: {
    duong: '/ho-tro',
    ten: { vi: 'Hỗ trợ', en: 'Support', ko: '고객 지원' },
    tieuDe: {
      vi: 'Liên hệ Beeftown khi cần hỗ trợ',
      en: 'Getting help from Beeftown',
      ko: 'Beeftown 고객 지원',
    },
    moTa: {
      vi: 'Số điện thoại, Messenger, Zalo OA, email và giờ Beeftown nhận điện thoại, tin nhắn.',
      en: 'Beeftown phone number, Messenger, Zalo Official Account, email, and the hours we answer calls and messages.',
      ko: 'Beeftown 전화번호, Messenger, Zalo 공식 계정, 이메일, 전화와 메시지를 받는 시간을 안내해요.',
    },
    muc: [
      { tieuDe: { vi: 'Liên hệ', en: 'Contact', ko: '연락처' }, khoi: [{ danhSach: LIEN_HE }] },
      { tieuDe: { vi: 'Giờ hỗ trợ', en: 'Hours', ko: '응대 시간' }, khoi: [
        { vi: `Giờ nhận điện thoại, tin nhắn: ${GIO_HO_TRO.vi}.`, en: `We answer calls and messages ${GIO_HO_TRO.en}.`, ko: `전화와 메시지는 ${GIO_HO_TRO.ko} 응대해요.` },
        {
          vi: 'Tin nhắn ngoài giờ được trả lời trong giờ làm việc kế tiếp.',
          en: 'Messages sent outside these hours are answered during the next working hours.',
          ko: '응대 시간 밖에 보내신 메시지는 다음 응대 시간에 답변해 드려요.',
        },
      ] },
      { tieuDe: { vi: 'Xem thêm', en: 'See also', ko: '함께 보기' }, khoi: [
        { danhSach: [
          { vi: '[Giao hàng](/giao-hang)', en: '[Delivery](/giao-hang)', ko: '[배달](/giao-hang)' },
          { vi: '[Đổi trả, hoàn tiền](/doi-tra-hoan-tien)', en: '[Returns and refunds](/doi-tra-hoan-tien)', ko: '[교환·환불](/doi-tra-hoan-tien)' },
          { vi: '[Khiếu nại](/khieu-nai)', en: '[Complaints](/khieu-nai)', ko: '[불만 접수](/khieu-nai)' },
        ] },
      ] },
    ],
  },
};

/**
 * Biểu tượng xác nhận của cơ quan quản lý thương mại điện tử ở chân trang — chỗ chừa sẵn, ẨN (null) cho tới
 * khi Khánh gửi mã. PR gắn biểu tượng điền đủ: link trang xác nhận cơ quan cấp, ảnh biểu tượng (đặt vào
 * web/public/, ảnh của cơ quan cấp — không vẽ lại), cỡ ảnh, alt ba thứ tiếng. Chưa có mã thì chân trang không
 * in gì (không khung trống, không <img> trỏ tới file chưa có).
 */
export const XAC_NHAN_CO_QUAN: { readonly url: string; readonly anh: string; readonly rong: number; readonly cao: number; readonly alt: Cau } | null = null;

/** Thứ tự link ở nhóm CHÍNH SÁCH của chân trang (Quyền riêng tư đứng cuối, ngoài bảng này). */
export const THU_TU_CHINH_SACH: readonly KhoaChinhSach[] = [
  'dieuKhoan', 'chinhSachGia', 'thanhToan', 'giaoHang', 'doiTra', 'khieuNai', 'dieuKienBan', 'hoTro',
];

/** Một mẩu của câu đã tách: chữ thường, hoặc link. */
export type Mau = { chu: string; dich?: undefined } | { chu: string; dich: string };

/**
 * Tách câu thành chữ và link. "[chữ](/duong)" là link nội bộ (đường dẫn tiếng Việt, người gọi đổi sang
 * đúng thứ tiếng); tel:, mailto:, https: giữ nguyên. Dấu ngoặc vuông không theo sau bởi (đích) là chữ thường.
 */
export function tachLienKet(cau: string): Mau[] {
  const ra: Mau[] = [];
  let tu = 0;
  for (const m of cau.matchAll(/\[([^\]]+)\]\(((?:\/|tel:|mailto:|https:\/\/)[^)\s]*)\)/g)) {
    if (m.index > tu) ra.push({ chu: cau.slice(tu, m.index) });
    ra.push({ chu: m[1], dich: m[2] });
    tu = m.index + m[0].length;
  }
  if (tu < cau.length) ra.push({ chu: cau.slice(tu) });
  return ra;
}

/** Chữ của câu như khách đọc (bỏ cú pháp link) — cho kiểm thử chữ cấm, luật địa điểm. */
export const chuCuaCau = (cau: string): string => tachLienKet(cau).map(m => m.chu).join('');
