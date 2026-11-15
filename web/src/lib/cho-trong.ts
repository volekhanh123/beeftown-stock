/**
 * CHỖ CÒN CHỜ TRẢ LỜI — thông tin vận hành của các trang chính sách
 * =================================================================
 *
 * Khánh giao 16/11/2026: bổ sung beeftown.vn để nộp hồ sơ thông báo website thương mại điện tử bán hàng
 * (Luật Thương mại điện tử 122/2025/QH15, Nghị định 248/2026/NĐ-CP). Thông tin vận hành chưa ai chốt thì
 * KHÔNG tự điền: mỗi chỗ ở đây giữ nguyên tên của nó, viết trong hai cặp ngoặc nhọn, cho tới khi người
 * được hỏi trả lời. Trang in nguyên chỗ trống ra để người duyệt thấy ngay còn thiếu gì.
 *
 * KHÔNG DEPLOY KHI CÒN CHỖ TRỐNG: `npm run deploy` (và `deploy:khan-cap`) chạy kiem-tra/cho-con-trong.mjs
 * trước khi build — còn một chỗ trống trong web/src là từ chối, in tên chỗ và file.
 *
 * CÁCH ĐIỀN. Mọi trang đọc từ đây, nên mỗi câu trả lời điền đúng MỘT chỗ:
 *   · khóa một chuỗi (EMAIL, GIO_BAO_LOI, NGAY_HOAN): viết thẳng giá trị — email, hay một con số;
 *   · khóa { vi, en, ko }: viết cụm chữ ở cả ba thứ tiếng, dịch đúng ý bản tiếng Việt (John hoặc Sang đọc
 *     bản tiếng Hàn). Cụm được ghép vào câu có sẵn: đọc câu đó ở lib/chinh-sach.ts (tìm tên khóa) trước khi
 *     viết, để câu ghép xong đọc trôi.
 * Viết xong: `cd crm && node test/test-cong-khai-chinh-sach.mjs` (chữ cấm, luật địa điểm, đủ ba thứ tiếng),
 * sửa NGAY_CAP_NHAT ở lib/chinh-sach.ts thành ngày điền xong, rồi `node kiem-tra/cho-con-trong.mjs` phải
 * báo sạch.
 *
 * Hai điều dễ vấp khi trả lời:
 *   · Không ghi số mét / km (kể cả bán kính giao hàng): luật SO_DO_DUONG_DI của web/kiem-tra/mau-dia-diem.mjs
 *     chặn mọi số đo độ dài trên trang công khai. Giao theo khoảng cách thì sửa luật đó trong cùng PR.
 *   · Không ghi tên phường, quận (luật PHUONG_QUAN cùng file): giao theo khu thì gọi tên khu khác cách,
 *     hoặc chờ Khánh có giấy xác nhận phường của 63 Hồ Tùng Mậu.
 */

import type { NgonNgu } from './noi-dung.ts';

type BaThuTieng = Readonly<Record<NgonNgu, string>>;

/* Mỗi chỗ trống viết thẳng thành chữ trong mã, ở cả ba thứ tiếng (không dựng bằng hàm): bước kiểm trước
   deploy đọc mã nguồn, nên chỗ nào chưa điền thì chữ của nó phải nằm ngay trong file. */
export const CHO_TRONG = {
  /** Email ghi lên web và tờ khai. Khánh trả lời 16/11/2026. */
  EMAIL: 'cskh@beeftown.vn',
  /** Giao tới đâu (cụm chữ, ghép sau "Khu vực giao:"). Khánh trả lời 16/11/2026: nội thành TP.HCM. */
  VUNG_GIAO: { vi: 'nội thành TP.HCM', en: 'central Ho Chi Minh City', ko: '호치민시 시내' },
  /** Khung giờ giao trong ngày (ghép sau "Giờ giao:"). Khánh trả lời 16/11/2026: như giờ làm việc. Đơn trả sau
      mấy giờ thì giao hôm sau: chưa trả lời — có thì ghép thêm vào cụm này. */
  GIO_GIAO: { vi: 'trong giờ làm việc của quán', en: 'during our working hours', ko: '매장 영업시간 중' },
  /** Ai giao: nhân viên quán, Ahamove… (ghép sau "Người giao:"). Hỏi: Sang. */
  DON_VI_GIAO: { vi: '{{DON_VI_GIAO}}', en: '{{DON_VI_GIAO}}', ko: '{{DON_VI_GIAO}}' },
  /** Đóng gói giữ lạnh thế nào, tối đa bao lâu trên đường (ghép sau "Giữ lạnh:"). Hỏi: Sang. */
  GIU_LANH: { vi: '{{GIU_LANH}}', en: '{{GIU_LANH}}', ko: '{{GIU_LANH}}' },
  /** Gói ghi 150 g: thu đúng giá ghi trên web hay tính lại theo tem cân. Khánh trả lời 16/11/2026: ghi 150 g, bỏ chữ
      "khoảng" (nhãn gói ở trang Mua thịt về cũng bỏ — lib/don-mua-thit.ts) — giá gói là giá ghi trên web. */
  CACH_TINH_GOI: {
    vi: 'bạn trả đúng giá ghi trên web, không tính lại theo cân',
    en: 'you pay the price shown on the website, with no reweighing',
    ko: '웹사이트에 표시된 가격 그대로 결제하시며, 다시 계량해 가격을 바꾸지 않아요',
  },
  /** Giá gói đã gồm VAT chưa (ghép sau "VAT:" ở trang Chính sách giá và trang Mua thịt về). Hỏi: Sang, John. */
  VAT: { vi: '{{VAT}}', en: '{{VAT}}', ko: '{{VAT}}' },
  /** Khách hẹn lại, giao lần 2 có tính thêm phí không. Khánh trả lời 16/11/2026: không tính phí. */
  GIAO_LAI: { vi: 'không tính thêm phí', en: 'no extra charge', ko: '추가 요금 없음' },
  /** Số giờ khách được báo hàng lỗi, kể từ lúc nhận — chỉ con số. Khánh trả lời 16/11/2026: 1 ngày. */
  GIO_BAO_LOI: '24',
  /** Số ngày làm việc để hoàn tiền về thẻ / ví — chỉ con số. Khánh trả lời 16/11/2026. */
  NGAY_HOAN: '2',
  /** Trả lời khiếu nại trong bao lâu, giải quyết xong trong bao lâu (ghép sau "Beeftown trả lời trong"). Hỏi: Khánh. */
  GIO_TRA_LOI: { vi: '{{GIO_TRA_LOI}}', en: '{{GIO_TRA_LOI}}', ko: '{{GIO_TRA_LOI}}' },
  /** Giờ nhận điện thoại, tin nhắn (ghép sau "Giờ nhận điện thoại, tin nhắn:"). Khánh trả lời 16/11/2026: như giờ làm việc. */
  GIO_HO_TRO: { vi: 'trong giờ làm việc của quán', en: 'during our working hours', ko: '매장 영업시간 중' },
  /** Giữ đơn mua thịt bao lâu rồi xóa thông tin khách (ghép sau "Đơn mua thịt được giữ"). Hỏi: Khánh. */
  THOI_GIAN_GIU_DON: { vi: '{{THOI_GIAN_GIU_DON}}', en: '{{THOI_GIAN_GIU_DON}}', ko: '{{THOI_GIAN_GIU_DON}}' },
} as const satisfies Record<string, string | BaThuTieng>;
