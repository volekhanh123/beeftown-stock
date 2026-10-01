/**
 * BÁO ĐỘNG — HỢP ĐỒNG KÊNH
 * ========================
 *
 * Kênh báo là thứ duy nhất CHƯA chọn (chủ nhà hàng quyết sau — Telegram, email hay Zalo; xem
 * web/README.md mục Báo động). Thêm một kênh = một file bao-dong-kenh-<ten>.ts cài KenhBaoDong,
 * một dòng trong chonKenhBaoDong, bí mật Worker của nó, một file test với fetch giả, một mục
 * README. KHÔNG cần migration: database chỉ kiểm mã kênh dạng chữ thường (^[a-z_]{1,20}$).
 *
 * Luật cho mọi kênh:
 *   · gui() KHÔNG BAO GIỜ ném lỗi, và trả { ok: true } CHỈ KHI dịch vụ xác nhận đã nhận tin.
 *   · Hết giờ (tinHieu bị hủy), lỗi mạng, 5xx, 429 → { ok: false, tamThoi: true }: lượt sau gửi
 *     lại. Sai cấu hình (400 / 401 / 403) → tamThoi: false — vẫn gửi lại, nhưng log nói rõ là
 *     cần người sửa.
 *   · Câu lỗi (cau) không chứa bí mật của kênh; bao-dong.ts còn xóa mọi chuỗi trong biMat khỏi
 *     câu log / câu lưu vào database lần nữa.
 */

import type { Tin } from './bao-dong-tin.ts';

export type Env = Record<string, unknown> | undefined;

export type KetQuaGui =
  | { ok: true }
  | { ok: false; tamThoi: boolean; cau: string };

export interface KenhBaoDong {
  /** Mã ghi vào database (bao_dong_trang_thai.kenh). 'khong' = không có kênh. */
  ma: string;
  /** Tên hiện trong tin "đã nối kênh" và trong log. */
  ten: string;
  /** Tin dài hơn thì bao-dong-tin.ts bỏ bớt mục. */
  gioiHanKyTu: number;
  /** Bí mật của kênh (token…) — xóa khỏi mọi câu log và câu lỗi. */
  biMat: readonly string[];
  gui(tin: Tin, tinHieu: AbortSignal): Promise<KetQuaGui>;
}

/** Chưa chọn kênh: việc báo động vẫn chạy, vẫn giữ sổ sự cố và đèn trên bảng, chỉ không gửi gì. */
export const KENH_KHONG: KenhBaoDong = Object.freeze({
  ma: 'khong',
  ten: 'khong',
  gioiHanKyTu: 0,
  biMat: [],
  async gui(): Promise<KetQuaGui> {
    return { ok: false, tamThoi: false, cau: 'chưa chọn kênh báo động' };
  },
});

/** Kênh Worker dùng lượt này. Bản này chưa có kênh nào — luôn KENH_KHONG. */
export function chonKenhBaoDong(_env?: Env): KenhBaoDong {
  return KENH_KHONG;
}
