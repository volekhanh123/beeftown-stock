/**
 * BEEFTOWN CÂN — CHƯƠNG TRÌNH CHẠY (file .exe ở máy tính của quán)
 *
 * Mở một máy chủ nhỏ CHỈ trên máy này (127.0.0.1, cổng ngẫu nhiên, kèm mã bí
 * mật trên đường dẫn), rồi mở cửa sổ Edge dạng ứng dụng trỏ vào đó. Mọi việc
 * nằm ở nghiep-vu.ts; file này chỉ nối nút bấm với việc.
 *
 * Chạy lần hai khi đã có cửa sổ: chỉ mở lại cửa sổ, không chạy thêm máy chủ.
 * Đóng cửa sổ → chương trình tự tắt (trang báo /api/dong, hoặc lâu không nghe
 * nhịp từ trang).
 *
 * Kiểm thử trên Linux: `bun src/main.ts --khong-mo` rồi mở đường dẫn in ra.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { exec, execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { UngDung, duongDanMacDinh } from './nghiep-vu.ts';
import { moMayChu } from './may-chu.ts';

const PHIEN_BAN = '2.3.0';
const khongMo = process.argv.includes('--khong-mo');
const ud = new UngDung(duongDanMacDinh());
const fileDangChay = path.join(ud.dd.cauHinh, 'dang-chay.json');

function moCuaSo(url: string) {
  if (khongMo || process.platform !== 'win32') { console.log(`Mở: ${url}`); return; }
  exec(`start "" msedge --app="${url}" --window-size=1180,860`, { windowsHide: true }, (loi) => {
    if (loi) exec(`start "" "${url}"`, { windowsHide: true });
  });
}

/**
 * File .exe không có cửa sổ chữ, nên lỗi lúc khởi động phải hiện bằng hộp
 * thoại của Windows, và ghi vào %APPDATA%\BeeftownCan\loi.txt.
 */
function baoLoi(e: unknown) {
  const cau = e instanceof Error ? e.message : String(e);
  try {
    fs.mkdirSync(ud.dd.cauHinh, { recursive: true });
    fs.appendFileSync(path.join(ud.dd.cauHinh, 'loi.txt'), `${new Date().toISOString()} ${e instanceof Error ? e.stack : cau}\n`);
  } catch { /* không ghi được thì thôi */ }
  if (process.platform === 'win32' && !khongMo) {
    const chu = `Beeftown Cân không chạy được:\n\n${cau}`.replace(/'/g, "''");
    try {
      execFileSync('powershell.exe', ['-NoProfile', '-Command',
        `Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('${chu}', 'Beeftown Cân') | Out-Null`],
        { windowsHide: true, timeout: 120000 });
    } catch { /* thôi */ }
  } else console.error(cau);
}
process.on('uncaughtException', (e) => { baoLoi(e); process.exit(1); });
// Lời hứa hỏng chạy ngầm (ví dụ tự làm mới đăng nhập khi mất mạng): chỉ ghi lại, không tắt chương trình.
process.on('unhandledRejection', (e) => {
  try { fs.appendFileSync(path.join(ud.dd.cauHinh, 'loi.txt'), `${new Date().toISOString()} (ngầm) ${e instanceof Error ? e.stack : String(e)}\n`); } catch { /* thôi */ }
});

// ---- Đã có một bản đang chạy? Mở lại cửa sổ của nó rồi thoát. -------------
try {
  const cu = JSON.parse(fs.readFileSync(fileDangChay, 'utf8')) as { cong: number; ma: string };
  const r = await fetch(`http://127.0.0.1:${cu.cong}/api/nhip?t=${cu.ma}`, { method: 'POST', signal: AbortSignal.timeout(1500) });
  if (r.ok) { moCuaSo(`http://127.0.0.1:${cu.cong}/?t=${cu.ma}`); process.exit(0); }
} catch { /* không có bản nào đang chạy */ }

const MA = randomBytes(18).toString('hex');
let nhipCuoi = Date.now();
let henTat: ReturnType<typeof setTimeout> | null = null;

const mayChu = moMayChu(ud, {
  ma: MA, phienBan: PHIEN_BAN,
  khiCoNhip: () => { nhipCuoi = Date.now(); if (henTat) { clearTimeout(henTat); henTat = null; } },
  // Tải lại trang cũng báo "đóng" — yêu cầu mới trong 5 giây sẽ huỷ hẹn tắt.
  khiDong: () => { henTat = setTimeout(() => process.exit(0), 5000); },
});

fs.mkdirSync(ud.dd.cauHinh, { recursive: true });
fs.writeFileSync(fileDangChay, JSON.stringify({ cong: mayChu.port, ma: MA }), 'utf8');

// Tự gửi xuống cân khi kho đổi (bật ở Cài đặt): mỗi phút, khi đã có file gốc.
let dangTuGui = false;
setInterval(async () => {
  if (dangTuGui || !ud.cauHinh().tuGui || !ud.coFileGoc()) return;
  dangTuGui = true;
  try { await ud.tuGuiMotLan(); } finally { dangTuGui = false; }
}, 60_000);

// Lâu không nghe nhịp từ trang (cửa sổ đã đóng mà không kịp báo) → tắt.
// Cửa sổ thu nhỏ vẫn gửi nhịp chậm nhất mỗi phút, nên chờ tới 4 phút.
setInterval(() => { if (Date.now() - nhipCuoi > 4 * 60_000) process.exit(0); }, 30_000);

moCuaSo(`http://127.0.0.1:${mayChu.port}/?t=${MA}`);
