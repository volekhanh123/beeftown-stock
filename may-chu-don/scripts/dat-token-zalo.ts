/**
 * Đặt refresh token Zalo cho tin ZNS:  npm run dat-token-zalo   (máy chủ thuê: sudo bash may-chu.sh zalo-token)
 *
 * Dán refresh token (lấy theo README, "Tin ZNS", bước 4) rồi Enter. Token được mã hóa bằng ZALO_KHOA rồi mới vào sổ đơn
 * (cùng THU_MUC_DU_LIEU với máy chủ). Máy chủ đang chạy thấy token mới ở lượt gửi kế tiếp (≤ 15 giây), làm mới ngay,
 * và log "Tin ZNS: đã làm mới token" — hay câu Zalo từ chối. Token đọc từ bàn phím, không từ tham số dòng lệnh (lịch sử
 * terminal giữ tham số). Không bao giờ in token ra.
 */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { danKhoaZalo, khoaZaloHopLe, maHoaTokenZalo } from '../../web/src/lib/zalo-ma-hoa.ts';
import { SoDon } from '../src/so-don.ts';

const khoa = process.env.ZALO_KHOA ?? '';
if (!khoaZaloHopLe(khoa)) {
  console.error('Thiếu ZALO_KHOA (ít nhất 32 ký tự) — đặt đúng khóa máy chủ đang dùng, rồi chạy lại.');
  process.exit(1);
}
const thuMuc = resolve(process.env.THU_MUC_DU_LIEU ?? './du-lieu');
mkdirSync(thuMuc, { recursive: true });

process.stdout.write('Dán refresh token Zalo của App máy chủ đơn rồi Enter: ');
let token = '';
for await (const dong of console) { token = dong.trim(); break; }
// Refresh token của Zalo là một chuỗi dài không dấu cách. Chặn lỡ dán nhầm cả câu, hay dán secret key / mã code ngắn.
if (!/^[A-Za-z0-9._~+/=-]{40,4096}$/.test(token)) {
  console.error('\nChuỗi này không giống refresh token (chuỗi dài, không dấu cách). Chưa lưu gì.');
  process.exit(1);
}
const so = new SoDon(join(thuMuc, 'don.sqlite'));
so.datRefreshTokenZalo(await maHoaTokenZalo(await danKhoaZalo(khoa), token, 'refresh'), Date.now());
so.dong();
console.log(`\nĐã lưu refresh token (đã mã hóa) vào ${join(thuMuc, 'don.sqlite')}.`);
console.log('Máy chủ đang chạy sẽ làm mới token trong vòng 15 giây — xem log: "Tin ZNS: đã làm mới token".');
console.log('Xóa token khỏi chỗ đã chép tạm (ghi chú, tin nhắn).');
