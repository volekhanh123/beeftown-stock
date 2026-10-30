/**
 * TRẠNG THÁI CỦA MỘT ĐƠN — một chỗ duy nhất
 * =========================================
 *
 * Đơn trả trước trong app (Khánh chốt 29/10/2026): khách trả tiền trong Mini App rồi quầy mới soạn.
 *
 *   cho_thanh_toan ──(SePay báo đủ tiền)──▶ da_thanh_toan ──▶ dang_soan ──▶ cho_lay ──▶ da_giao
 *        │                                            │               │            │
 *        └──(quá 30 phút chưa trả)──▶ het_han         └───────────────┴────────────┴──▶ can_hoan_tien ──▶ da_hoan_tien
 *
 * Quầy chỉ đi theo BUOC_QUAY. Hai bước của máy (đã trả tiền, hết hạn) không có nút: tiền về qua SePay đi
 * SoDon.ghiTienVe (so-don.ts), không qua màn hình quầy. Hoàn tiền làm tay (Claude đề xuất 29/10/2026,
 * Khánh chưa chốt):
 * quầy bấm hủy → đơn vào "Cần hoàn tiền" → người chuyển khoản trả bấm "Đã hoàn tiền".
 *
 * Nhãn vẽ theo bảy kiểu trạng thái của nội bộ (skill thiet-ke-beeftown, tham-khao/noi-bo-va-kho.md) — không màu
 * trạng thái: K1 đỏ đặc "!" là việc phải làm ngay, K3 đen đặc là đang làm dở, K5 xám là chờ, K4 viền đen ✓ là
 * xong, K6 nét đứt là đã hủy / hết hạn, K7 viền mảnh là thông tin.
 */

export const TRANG_THAI = [
  'cho_thanh_toan', 'het_han', 'da_thanh_toan', 'dang_soan', 'cho_lay', 'da_giao', 'can_hoan_tien', 'da_hoan_tien',
] as const;
export type TrangThai = (typeof TRANG_THAI)[number];

export const laTrangThai = (v: unknown): v is TrangThai => typeof v === 'string' && (TRANG_THAI as readonly string[]).includes(v);

export type Kieu = 'k1' | 'k3' | 'k4' | 'k5' | 'k6' | 'k7';

/** Chữ của nhãn (vi / en) và kiểu vẽ. */
export const NHAN: Readonly<Record<TrangThai, { vi: string; en: string; kieu: Kieu }>> = {
  cho_thanh_toan: { vi: 'Chờ khách trả tiền', en: 'Awaiting payment', kieu: 'k7' },
  het_han: { vi: 'Hết hạn trả tiền', en: 'Payment expired', kieu: 'k6' },
  da_thanh_toan: { vi: 'Đã trả tiền, chờ soạn', en: 'Paid, to prepare', kieu: 'k1' },
  dang_soan: { vi: 'Đang soạn', en: 'Preparing', kieu: 'k3' },
  cho_lay: { vi: 'Chờ khách lấy', en: 'Ready for pickup', kieu: 'k5' },
  da_giao: { vi: 'Đã giao khách', en: 'Picked up', kieu: 'k4' },
  can_hoan_tien: { vi: 'Đã hủy, cần hoàn tiền', en: 'Cancelled, refund due', kieu: 'k1' },
  da_hoan_tien: { vi: 'Đã hoàn tiền', en: 'Refunded', kieu: 'k6' },
};

/** Bước quầy được bấm: từ trạng thái nào sang trạng thái nào, kèm chữ của nút. */
export const BUOC_QUAY: ReadonlyArray<{ tu: TrangThai; den: TrangThai; vi: string; en: string; chinh: boolean }> = [
  { tu: 'da_thanh_toan', den: 'dang_soan', vi: 'Bắt đầu soạn', en: 'Start preparing', chinh: true },
  { tu: 'dang_soan', den: 'cho_lay', vi: 'Soạn xong, chờ khách lấy', en: 'Ready for pickup', chinh: true },
  { tu: 'cho_lay', den: 'da_giao', vi: 'Khách đã lấy', en: 'Picked up', chinh: true },
  { tu: 'da_thanh_toan', den: 'can_hoan_tien', vi: 'Hủy đơn, cần hoàn tiền', en: 'Cancel, refund due', chinh: false },
  { tu: 'dang_soan', den: 'can_hoan_tien', vi: 'Hủy đơn, cần hoàn tiền', en: 'Cancel, refund due', chinh: false },
  { tu: 'cho_lay', den: 'can_hoan_tien', vi: 'Hủy đơn, cần hoàn tiền', en: 'Cancel, refund due', chinh: false },
  { tu: 'can_hoan_tien', den: 'da_hoan_tien', vi: 'Đã hoàn tiền cho khách', en: 'Refund sent', chinh: true },
];

export const duocBam = (tu: TrangThai, den: TrangThai) => BUOC_QUAY.some(b => b.tu === tu && b.den === den);

/** Trạng thái quầy còn phải làm — màn hình quầy xếp theo thứ tự này. */
export const CON_VIEC: readonly TrangThai[] = ['da_thanh_toan', 'dang_soan', 'cho_lay', 'can_hoan_tien'];
/** Trạng thái đã khép: không bước nào đi tiếp. */
export const DA_KHEP: readonly TrangThai[] = ['het_han', 'da_giao', 'da_hoan_tien'];
