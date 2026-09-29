/**
 * Kho cập nhật GIẢ trên chính máy này — để thử nút "Cập nhật" của BeeftownCan.exe trên Windows TRƯỚC khi gộp,
 * không cần kho GitHub công khai:
 *
 *     cd can-app && npx bun test/may-cap-nhat-gia.ts <đường dẫn file .exe làm "bản mới"> <phiên bản, ví dụ 2.9.0>
 *
 * In ra một đường dẫn http://127.0.0.1:<cổng>/releases. Mở BeeftownCan.exe (bản đang thử) với biến môi trường đó:
 *
 *     $env:BEEFTOWN_CAN_NGUON_CAP_NHAT="http://127.0.0.1:<cổng>/releases"; .\BeeftownCan.exe
 *
 * main.ts chỉ nhận đường 127.0.0.1. File "bản mới" phải là file chạy Windows 64-bit, cỡ 10–150 MB.
 *   - Thử tải, kiểm, đổi file, và "bản mới không mở được → tự quay về": dùng BeeftownCan.exe bản 2.4.0 (Releases)
 *     làm "bản 2.9.0" — bản đó chạy nhưng không báo phiên bản 2.9.0, nên sau 90 giây chương trình phải tắt nó, đưa bản
 *     cũ về chỗ (bản "mới" thành BeeftownCan.loi.exe) và mở lại bản cũ với dòng báo đỏ.
 *   - Cập nhật trọn vẹn (bản mới mở và trả lời): cần hai bản có PHIEN_BAN khác nhau — thử sau khi gộp, 2.5.0 → 2.5.1.
 * Ctrl+C để tắt.
 */
import * as fs from 'node:fs';
import { createHash } from 'node:crypto';

const [tep, phienBan] = process.argv.slice(2);
if (!tep || !fs.existsSync(tep) || !/^\d+\.\d+\.\d+$/.test(phienBan ?? '')) {
  console.log('Cách dùng: npx bun test/may-cap-nhat-gia.ts <file .exe> <phiên bản, ví dụ 2.9.0>');
  process.exit(1);
}
const exe = fs.readFileSync(tep);
const phieu = JSON.stringify({
  dang: 1, phienBan, tep: 'BeeftownCan.exe', sha256: createHash('sha256').update(exe).digest('hex'), kichThuoc: exe.length,
  ngay: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
});
const may = Bun.serve({
  hostname: '127.0.0.1', port: 0,
  fetch(req) {
    const p = new URL(req.url).pathname;
    console.log(`${new Date().toLocaleTimeString('vi-VN')}  ${req.method} ${p}`);
    if (p === '/releases/latest/download/phien-ban.json') {
      return new Response(null, { status: 302, headers: { Location: `/releases/download/can-v${phienBan}/phien-ban.json` } });
    }
    if (p === `/releases/download/can-v${phienBan}/phien-ban.json`) return new Response(phieu, { headers: { 'Content-Type': 'application/json' } });
    if (p === `/releases/download/can-v${phienBan}/BeeftownCan.exe`) return new Response(exe, { headers: { 'Content-Length': String(exe.length) } });
    return new Response('Không có', { status: 404 });
  },
});
console.log(`Kho cập nhật giả: bản ${phienBan} (${(exe.length / 1048576).toFixed(1)} MB)`);
console.log(`$env:BEEFTOWN_CAN_NGUON_CAP_NHAT="http://127.0.0.1:${may.port}/releases"`);
