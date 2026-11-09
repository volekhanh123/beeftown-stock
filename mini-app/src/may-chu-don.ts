// Nối Mini App với máy chủ đơn: địa chỉ, fetch thật, bộ nhớ của máy. Logic nằm ở tra-truoc.ts (kiểm tra được bằng node).

import { CAU_HINH } from "./cau-hinh";
import {
  docDonTuMayChu,
  guiDonLenMayChu,
  type HamFetchApi,
  type KetQuaDoc,
  type KetQuaGui,
  type KhoLuu,
  type ThanDon,
} from "./tra-truoc";

/**
 * Địa chỉ máy chủ đơn. Biến VITE_DIA_CHI_MAY_CHU_DON (lúc chạy npm run dev hay build) thắng cau-hinh.ts, để thử với
 * máy chủ trên laptop mà không sửa mã. Rỗng: không trả trước, app gửi đơn vào chat OA như trước.
 */
export const DIA_CHI_MAY_CHU_DON = (
  (import.meta.env.VITE_DIA_CHI_MAY_CHU_DON as string | undefined) || CAU_HINH.diaChiMayChuDon
).replace(/\/+$/, "");

/** true: đặt và trả tiền trước trong app. */
export const TRA_TRUOC = DIA_CHI_MAY_CHU_DON !== "";

const fetchThat: HamFetchApi = (url, init) => fetch(url, init);

export function guiDonDenMayChu(than: ThanDon): Promise<KetQuaGui> {
  return guiDonLenMayChu(DIA_CHI_MAY_CHU_DON, than, fetchThat);
}

export function docDonTrenMayChu(ma: string, khoa: string): Promise<KetQuaDoc> {
  return docDonTuMayChu(DIA_CHI_MAY_CHU_DON, ma, khoa, fetchThat);
}

/** localStorage, hoặc null khi máy chặn (chế độ riêng tư, Zalo tắt bộ nhớ). */
export function khoLuuCuaMay(): KhoLuu | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
