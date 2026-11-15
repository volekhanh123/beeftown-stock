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
  /** Email ghi lên web và tờ khai. Hỏi: Khánh. */
  EMAIL: '{{EMAIL}}',
  /** Giao tới đâu (cụm chữ, ghép sau "Khu vực giao:"). Hỏi: Sang. */
  VUNG_GIAO: { vi: '{{VUNG_GIAO}}', en: '{{VUNG_GIAO}}', ko: '{{VUNG_GIAO}}' },
  /** Khung giờ giao trong ngày; đơn trả sau mấy giờ thì giao hôm sau (ghép sau "Giờ giao:"). Hỏi: Sang. */
  GIO_GIAO: { vi: '{{GIO_GIAO}}', en: '{{GIO_GIAO}}', ko: '{{GIO_GIAO}}' },
  /** Ai giao: nhân viên quán, Ahamove… (ghép sau "Người giao:"). Hỏi: Sang. */
  DON_VI_GIAO: { vi: '{{DON_VI_GIAO}}', en: '{{DON_VI_GIAO}}', ko: '{{DON_VI_GIAO}}' },
  /** Đóng gói giữ lạnh thế nào, tối đa bao lâu trên đường (ghép sau "Giữ lạnh:"). Hỏi: Sang. */
  GIU_LANH: { vi: '{{GIU_LANH}}', en: '{{GIU_LANH}}', ko: '{{GIU_LANH}}' },
  /** Gói "khoảng 150 g": thu đúng giá ghi trên web hay tính lại theo tem cân. Hỏi: Sang. */
  CACH_TINH_GOI: { vi: '{{CACH_TINH_GOI}}', en: '{{CACH_TINH_GOI}}', ko: '{{CACH_TINH_GOI}}' },
  /** Giá gói đã gồm VAT chưa (ghép sau "VAT:" ở trang Chính sách giá và trang Mua thịt về). Hỏi: Sang, John. */
  VAT: { vi: '{{VAT}}', en: '{{VAT}}', ko: '{{VAT}}' },
  /** Khách hẹn lại, giao lần 2 có tính thêm phí không, bao nhiêu. Hỏi: Sang. */
  GIAO_LAI: { vi: '{{GIAO_LAI}}', en: '{{GIAO_LAI}}', ko: '{{GIAO_LAI}}' },
  /** Số giờ khách được báo hàng lỗi, kể từ lúc nhận — chỉ con số. Hỏi: Sang. */
  GIO_BAO_LOI: '{{GIO_BAO_LOI}}',
  /** Số ngày làm việc để hoàn tiền về thẻ / ví — chỉ con số. Hỏi: Sang. */
  NGAY_HOAN: '{{NGAY_HOAN}}',
  /** Trả lời khiếu nại trong bao lâu, giải quyết xong trong bao lâu (ghép sau "Beeftown trả lời trong"). Hỏi: Khánh. */
  GIO_TRA_LOI: { vi: '{{GIO_TRA_LOI}}', en: '{{GIO_TRA_LOI}}', ko: '{{GIO_TRA_LOI}}' },
  /** Giờ nhận điện thoại, tin nhắn (ghép sau "Giờ nhận điện thoại, tin nhắn:"). Hỏi: Khánh. */
  GIO_HO_TRO: { vi: '{{GIO_HO_TRO}}', en: '{{GIO_HO_TRO}}', ko: '{{GIO_HO_TRO}}' },
  /** Giữ đơn mua thịt bao lâu rồi xóa thông tin khách (ghép sau "Đơn mua thịt được giữ"). Hỏi: Khánh. */
  THOI_GIAN_GIU_DON: { vi: '{{THOI_GIAN_GIU_DON}}', en: '{{THOI_GIAN_GIU_DON}}', ko: '{{THOI_GIAN_GIU_DON}}' },
} as const satisfies Record<string, string | BaThuTieng>;
