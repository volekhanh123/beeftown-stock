// Vẽ mã QR chuyển khoản ngay trên máy từ chuỗi VietQR máy chủ đơn gửi (máy chủ dựng chuỗi, app chỉ vẽ): không tải
// ảnh từ tên miền nào khác, và có sẵn ảnh PNG để lưu vào máy (zalo.ts, luuAnhVaoMay).

import QR from "qrcode";

/** Ảnh PNG (data URL) đen trên trắng, chừa lề 4 ô như chuẩn QR để app ngân hàng quét được. */
export function veMaQr(chuoiQr: string): Promise<string> {
  return QR.toDataURL(chuoiQr, {
    errorCorrectionLevel: "M",
    margin: 4,
    width: 600,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
}
