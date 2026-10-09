/**
 * CÂU THÔNG BÁO CỦA PHẦN ZALO (0047) Ở TIẾNG ANH
 * =============================================
 *
 * Database gửi tin Zalo nói bằng tiếng Việt ở hai chỗ lên trang:
 *   · `raise exception '…'` của các RPC zalo_* — lên trang qua error.message;
 *   · câu ghi vào nhat_ky_tin.loi / trả về trong bi_loai[].ly_do — lý do một tin
 *     không gửi, lý do một khách bị loại khỏi chiến dịch.
 *
 * dichCau() (lib/cau-noi-bo.ts) tra ở đây sau bảng CRM. test-noi-bo-tieng-anh.mjs
 * đòi mọi câu raise exception của migration CRM đều dịch được.
 */

/** Câu cố định: đúng từng chữ. */
export const CAU_ZALO_EN: Readonly<Record<string, string>> = {
  // raise exception — 0047
  'Chỉ tài khoản máy Zalo mới gọi được hàm này': 'Only the Zalo machine account can call this function',
  'Thiếu access token hoặc hạn dùng': 'Missing access token or expiry time',
  'Chỉ chủ sở hữu mới xem được cài đặt Zalo': 'Only the owner can view the Zalo settings',
  'Chỉ chủ sở hữu mới sửa được cài đặt Zalo': 'Only the owner can change the Zalo settings',
  'Chế độ gửi phải là "thu" hoặc "that"': 'The sending mode must be "thu" (test) or "that" (live)',
  'Giờ bắt đầu gửi tin chăm sóc phải trước giờ kết thúc': 'The start of the marketing-message window must be before its end',
  'Trần tin chăm sóc mỗi tháng từ 0 đến 2': 'The monthly marketing-message cap must be between 0 and 2',
  'Chưa đủ App ID, OA ID và refresh token để bật gửi tin Zalo': 'App ID, OA ID and a refresh token are required before Zalo sending can be turned on',
  'Chỉ chủ sở hữu mới nối được tài khoản Zalo': 'Only the owner can connect the Zalo account',
  'Refresh token phải được mã hóa trước khi lưu': 'The refresh token must be encrypted before it is saved',
  'Chỉ chủ sở hữu mới sửa được mẫu tin Zalo': 'Only the owner can change Zalo message templates',
  'Mẫu đã duyệt phải có mã mẫu Zalo': 'An approved template needs its Zalo template ID',
  'Mã mẫu Zalo không hợp lệ': 'Invalid Zalo template ID',
  'Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này mới chạy được chiến dịch Zalo':
    'Only the owner, or a manager or marketer of this branch, can run Zalo campaigns',
  'Chiến dịch chỉ dùng mẫu tin chăm sóc': 'Campaigns can only use marketing templates',
  'Thiếu mã gửi': 'Missing submission code',
  'Mã gửi đã dùng cho chi nhánh khác': 'This submission code was already used for another branch',
  'Chiến dịch cần có tên': 'The campaign needs a name',
  'Gửi tin Zalo đang tắt': 'Zalo sending is turned off',
  'Giờ gửi đã qua': 'The sending time has already passed',
  'Chỉ hẹn giờ gửi trong vòng 60 ngày': 'Sending can only be scheduled up to 60 days ahead',
  'Tham số chiến dịch phải là một đối tượng JSON': 'Campaign parameters must be a JSON object',
  'Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này mới gửi lại được tin Zalo':
    'Only the owner, or a manager or marketer of this branch, can resend Zalo messages',
  'Chỉ gửi lại được tin thất bại': 'Only failed messages can be resent',
  'Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này mới xem được tin Zalo':
    'Only the owner, or a manager or marketer of this branch, can view Zalo messages',

  // Lý do trong nhat_ky_tin.loi / bi_loai[].ly_do — 0006 và 0047
  'Không tìm thấy khách hàng': 'Customer not found',
  'Khách đã yêu cầu xoá dữ liệu': 'The customer asked for their data to be deleted',
  'Khách chưa từng giao dịch — Zalo không cho gửi': 'The customer has never transacted — Zalo does not allow sending',
  'Khách chưa đồng ý nhận tin quảng cáo': 'The customer has not agreed to receive marketing messages',
  'Khách đã hủy đặt bàn': 'The customer cancelled the booking',
  'Đặt bàn đã kết thúc — không nhắc lịch nữa': 'The booking is over — no more reminders',
  'Giờ hẹn mới đã sát — không còn nhắc trước 2 tiếng': 'The new booking time is too close — no 2-hour reminder any more',
  'Đã quá giờ hẹn — không gửi tin đặt bàn nữa': 'The booking time has passed — booking messages are no longer sent',
  'Đã thử 5 lần mà không nhận được kết quả': 'Tried 5 times without getting a result',
  'Mẫu tin chưa được Zalo duyệt hoặc đã tắt': 'The template is not approved by Zalo or has been turned off',
  'Chiến dịch đã dừng': 'The campaign was stopped',
  'Tin chưa được lấy ra trong lượt gửi nào': 'The message has not been picked up by any sending run',
  // 0063
  'Xác nhận khi đã sát giờ hẹn — không còn nhắc trước 2 tiếng': 'Confirmed too close to the booking time — no 2-hour reminder',
};

/** Câu có phần thay đổi. */
export const MAU_ZALO_EN: ReadonlyArray<readonly [RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Kết quả gửi không hợp lệ: (.+)$/, m => `Invalid sending result: ${m[1]}`],
  [/^Không tìm thấy tin (.+)$/, m => `Message ${m[1]} not found`],
  [/^Nhóm khách không hợp lệ: (.+)$/, m => `Invalid customer group: ${m[1]}`],
  [/^Thiếu tham số cho mẫu (.+?): (.+)$/, m => `Missing parameters for template ${m[1]}: ${m[2]}`],
  [/^Khách đã đủ (\d+) tin chăm sóc trong tháng$/, m => `The customer has already had ${m[1]} marketing messages this month`],
  [/^Xếp tin Zalo cho đặt bàn (.+?) lỗi: ([\s\S]+)$/, m => `Queuing Zalo messages for booking ${m[1]} failed: ${m[2]}`],
];
