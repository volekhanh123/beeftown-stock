// Chia sẻ một phần thịt cho bạn bè trên Zalo (Khánh chọn 09/11/2026, ý từ mẫu zaui-fashion của Zalo; mã viết mới).
// Logic thuần, không React, không Zalo — kiểm tra bằng scripts/kiem-tra-don.ts. Lệnh mở khung chia sẻ: zalo.ts.
//
// Bạn bè bấm vào tin chia sẻ thì Mini App mở ở trang chủ, cuộn tới đúng phần thịt đó: đường dẫn "/mon/<mã>" (route
// trong ung-dung.tsx). Đọc cả "?mon=<mã>" phòng khi Zalo đưa đường dẫn về trang chủ kèm chuỗi hỏi.

import type { SanPham } from "./san-pham";

/**
 * Ảnh xem trước của tin chia sẻ: ảnh chia sẻ của website (logo trên nền đỏ, 1200 × 630). Zalo tải ảnh theo địa chỉ
 * công khai; ảnh không có dữ liệu khách. Mini App chưa có ảnh từng phần thịt — có ảnh thật thì đổi theo từng phần.
 */
export const ANH_CHIA_SE = "https://beeftown.vn/thuong-hieu/chia-se-1200x630.png";

export interface NoiDungChiaSe {
  title: string;
  description: string;
  thumbnail: string;
  path: string;
}

/** Đường dẫn trong Mini App mở thẳng một phần thịt. */
export const duongMon = (ma: string) => `/mon/${encodeURIComponent(ma)}`;

/**
 * Phần thịt có thật (trong `danhSach`, thường là SAN_PHAM) từ đường dẫn ("/mon/<mã>") hay chuỗi hỏi ("?mon=<mã>");
 * không có hay lạ thì null.
 */
export function monTuDuong(danhSach: readonly SanPham[], duong: string, chuoiHoi = ""): SanPham | null {
  const theoDuong = duong.match(/\/mon\/([^/?#]+)\/?$/)?.[1];
  let ma = theoDuong ?? null;
  if (!ma) {
    try {
      ma = new URLSearchParams(chuoiHoi).get("mon");
    } catch {
      ma = null;
    }
  }
  if (!ma) return null;
  let giai = ma;
  try {
    giai = decodeURIComponent(ma);
  } catch {
    return null;
  }
  return danhSach.find((sp) => sp.ma === giai) ?? null;
}

/** Nội dung tin chia sẻ: tên phần thịt, một câu mô tả, ảnh xem trước, đường dẫn mở đúng phần đó. */
export function noiDungChiaSe(sp: SanPham): NoiDungChiaSe {
  return {
    title: `${sp.ten} · Beeftown`,
    description: `${sp.moTa} Bán theo khay ~${sp.soGamKhay} g, đặt ngay trong Zalo.`,
    thumbnail: ANH_CHIA_SE,
    path: duongMon(sp.ma),
  };
}
