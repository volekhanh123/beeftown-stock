/**
 * Đóng gói Beeftown Cân thành một file .exe cho Windows 64-bit:
 *
 *     cd can-app && npm ci && npx bun scripts/dong-goi.ts
 *
 * Ra dist/BeeftownCan.exe (~90 MB: có sẵn bộ chạy Bun bên trong, máy quán
 * không phải cài gì). Chạy được trên Linux/Mac — Bun tự tải bản Windows để
 * đóng gói. File .exe không ký số: lần đầu mở, Windows có thể báo "Windows
 * protected your PC" → More info → Run anyway.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

const goc = path.resolve(import.meta.dir, '..');
const dist = path.join(goc, 'dist');
fs.mkdirSync(dist, { recursive: true });

// Biểu tượng: bọc ảnh PNG 192×192 của kho vào file .ico (Windows đọc được ICO chứa PNG).
const png = fs.readFileSync(path.join(goc, '..', 'web', 'public', 'kho', 'bieu-tuong-192.png'));
const dau = Buffer.alloc(22);
dau.writeUInt16LE(0, 0); dau.writeUInt16LE(1, 2); dau.writeUInt16LE(1, 4);   // ICONDIR: 1 ảnh
dau.writeUInt8(192, 6); dau.writeUInt8(192, 7); dau.writeUInt8(0, 8); dau.writeUInt8(0, 9);
dau.writeUInt16LE(1, 10); dau.writeUInt16LE(32, 12);
dau.writeUInt32LE(png.length, 14); dau.writeUInt32LE(22, 18);
const ico = path.join(dist, 'bieu-tuong.ico');
fs.writeFileSync(ico, Buffer.concat([dau, png]));

const ra = path.join(dist, 'BeeftownCan.exe');
const kq = Bun.spawnSync([
  process.execPath, 'build', path.join(goc, 'src', 'main.ts'),
  '--compile', '--target=bun-windows-x64', '--minify',
  '--windows-hide-console',
  // Bun chỉ gắn biểu tượng và tên sản phẩm khi đóng gói TRÊN Windows.
  ...(process.platform === 'win32' ? [`--windows-icon=${ico}`, '--windows-title=Beeftown Can'] : []),
  '--outfile', ra,
], { cwd: goc, stdout: 'inherit', stderr: 'inherit' });
if (kq.exitCode !== 0) process.exit(kq.exitCode ?? 1);
console.log(`Xong: ${ra} (${(fs.statSync(ra).size / 1e6).toFixed(1)} MB)`);
