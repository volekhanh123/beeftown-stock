/**
 * CÂU THÔNG BÁO CỦA PHẦN BOT MESSENGER (0053) Ở TIẾNG ANH
 * =====================================================
 *
 * Database bot Messenger nói bằng tiếng Việt ở `raise exception '…'` của các
 * RPC mess_* — lên trang /noi-bo/messenger qua error.message.
 *
 * dichCau() (lib/cau-noi-bo.ts) tra ở đây sau bảng CRM, kho, Zalo.
 * test-noi-bo-tieng-anh.mjs đòi mọi câu raise exception của migration CRM đều
 * dịch được.
 */

/** Câu cố định: đúng từng chữ. */
export const CAU_MESSENGER_EN: Readonly<Record<string, string>> = {
  // raise exception — 0053
  'Chỉ tài khoản máy Messenger mới gọi được hàm này': 'Only the Messenger machine account can call this function',
  'Mã khách Messenger phải là chuỗi băm 64 ký tự hex': 'The Messenger customer key must be a 64-character hex hash',
  'Bước hội thoại không hợp lệ': 'Invalid conversation step',
  'Dữ liệu phiên phải là đối tượng JSON không quá 4000 byte': 'Session data must be a JSON object of at most 4000 bytes',
  'Số phút tạm dừng từ 0 đến 1440': 'The pause must be between 0 and 1440 minutes',
  'Thiếu kết quả tra cứu': 'Missing lookup result',
  'Chỉ chủ sở hữu mới xem được cài đặt bot Messenger': 'Only the owner can view the Messenger bot settings',
  'Chỉ chủ sở hữu mới sửa được cài đặt bot Messenger': 'Only the owner can change the Messenger bot settings',
  'Lời chào dài từ 1 đến 300 ký tự': 'The greeting must be 1 to 300 characters long',
  'Số phút bot im khi khách gặp nhân viên từ 5 đến 1440':
    'The time the bot stays quiet after a customer asks for staff must be between 5 and 1440 minutes',
  'Chỉ chủ sở hữu hoặc quản lý mới xem được bot Messenger': 'Only the owner or a manager can view the Messenger bot',
};

/** Câu có phần thay đổi. */
export const MAU_MESSENGER_EN: ReadonlyArray<readonly [RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Loại sự kiện Messenger không hợp lệ: (.+)$/, m => `Invalid Messenger event type: ${m[1]}`],
];
