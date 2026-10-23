// Các lệnh của Zalo dùng trong app. Chỉ chạy được bên trong ứng dụng Zalo trên điện thoại.

import { followOA, openChat } from "zmp-sdk";
import { CAU_HINH } from "./cau-hinh";

/** Cùng cách zmp-sdk tự nhận biết: trình duyệt bên trong Zalo có chữ "zalo" trong user agent. */
export function dangTrongZalo(): boolean {
  return /zalo/i.test(navigator.userAgent);
}

export type KetQuaMoChat = "da-mo" | "ngoai-zalo" | "chua-co-oa" | "loi";

/** Mở khung chat với OA của quán, điền sẵn nội dung (khách vẫn phải tự bấm Gửi). */
export async function moChatVoiQuan(noiDung?: string): Promise<KetQuaMoChat> {
  if (!dangTrongZalo()) return "ngoai-zalo";
  if (!CAU_HINH.oaId) return "chua-co-oa";
  try {
    await openChat({ type: "oa", id: CAU_HINH.oaId, message: noiDung });
    return "da-mo";
  } catch {
    return "loi";
  }
}

/** Hiện hộp hỏi khách có muốn Quan tâm OA của quán không. */
export async function quanTamQuan(): Promise<boolean> {
  if (!dangTrongZalo() || !CAU_HINH.oaId) return false;
  try {
    await followOA({ id: CAU_HINH.oaId });
    return true;
  } catch {
    return false;
  }
}
