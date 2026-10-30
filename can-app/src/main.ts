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
 * Tự cập nhật (2.5, cap-nhat.ts): trang bấm "Cập nhật" → nghiep-vu tải, kiểm, đổi file → khoiDongLai ở đây dừng
 * máy chủ, mở bản mới, chờ nó trả lời (không trả lời thì quay về bản cũ) rồi thoát. Bản mới mở với
 * `--vua-cap-nhat=<bản cũ>` (hoặc bản cũ mở lại với `--cap-nhat-hong=<bản mới>`) để trang báo cho người dùng.
 *
 * Kiểm thử trên Linux: `bun src/main.ts --khong-mo` rồi mở đường dẫn in ra.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { exec, execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { BAO_KHO_MS, HOI_KHO_MS, NHIP_CAN_MS, UngDung, duongDanMacDinh, ghiLoiTxt as ghiLoiCoHan } from './nghiep-vu.ts';
import { moMayChu } from './may-chu.ts';
import {
  cacTepCapNhat, cauQuayVeBangTay, chayThuQuaPowerShell, docThamSoPhienBan, donSauCapNhat, khoaCapNhatConHan, khoiDongLaiSauCapNhat,
  khoiDongQuaPowerShell, laBanDongGoi,
} from './cap-nhat.ts';
import { chayPowerShell } from './day-rs232.ts';

const PHIEN_BAN = '2.12.0';

// ---- 2.6.1: bản cũ đang CHẠY THỬ file này trước khi đổi sang (cap-nhat.ts chayThuBanMoi) ---------------------------
// Chỉ ghi phiên bản vào file được chỉ rồi thoát: không mở máy chủ, không mở cửa sổ, không đụng dữ liệu — trước mọi bước
// khác (bản cũ đang chạy, dang-chay.json trỏ tới nó). Tên file phải đúng đuôi, không ghi đè file nào khác.
{
  const fileChayThu = process.env.BEEFTOWN_CAN_THU_CHAY ?? '';
  if (fileChayThu) {
    if (fileChayThu.endsWith('.chay-thu.json')) fs.writeFileSync(fileChayThu, JSON.stringify({ phienBan: PHIEN_BAN }), 'utf8');
    process.exit(fileChayThu.endsWith('.chay-thu.json') ? 0 : 2);
  }
}
const khongMo = process.argv.includes('--khong-mo');
const laExe = laBanDongGoi(process.execPath, process.platform);
// Chạy thử cập nhật trên Windows với kho giả trên chính máy này (can-app/test/may-cap-nhat-gia.ts): chỉ nhận 127.0.0.1.
const nguonThu = process.env.BEEFTOWN_CAN_NGUON_CAP_NHAT ?? '';
const ud = new UngDung(duongDanMacDinh(), {
  capNhat: {
    phienBan: PHIEN_BAN, tepChay: process.execPath, laBanDongGoi: laExe,
    ...(/^http:\/\/127\.0\.0\.1:\d{1,5}\/[\w./-]*$/.test(nguonThu) ? { goc: nguonThu.replace(/\/+$/, '') } : {}),
    vuaCapNhatTu: docThamSoPhienBan(process.argv, '--vua-cap-nhat='),
    capNhatHong: docThamSoPhienBan(process.argv, '--cap-nhat-hong='),
    chayThu: chayThuQuaPowerShell(chayPowerShell),
    ghiNhatKy: (cau) => ghiLoiTxt(cau),
  },
});
const fileDangChay = path.join(ud.dd.cauHinh, 'dang-chay.json');
// Có trong lúc bản cũ đang mở bản mới sau cập nhật (tối đa ~3,5 phút): người bấm mở tay lúc đó thì chờ.
const fileKhoaCapNhat = path.join(ud.dd.cauHinh, 'dang-cap-nhat.json');
const moSauCapNhat = process.argv.some(a => a.startsWith('--vua-cap-nhat=') || a.startsWith('--cap-nhat-hong='));

function moCuaSo(url: string) {
  if (khongMo || process.platform !== 'win32') { console.log(`Mở: ${url}`); return; }
  exec(`start "" msedge --app="${url}" --window-size=1180,860`, { windowsHide: true }, (loi) => {
    if (loi) exec(`start "" "${url}"`, { windowsHide: true });
  });
}

/**
 * Thêm một dòng vào %APPDATA%\BeeftownCan\loi.txt (giờ UTC đầu dòng như các dòng cũ). 2.9.2: có hạn — đầy 1 MB thì thành
 * loi-cu.txt (nghiep-vu.ts ghiLoiTxt). Không ghi được thì thôi.
 */
function ghiLoiTxt(cau: string) { ghiLoiCoHan(ud.dd.cauHinh, cau); }

/**
 * File .exe không có cửa sổ chữ, nên lỗi lúc khởi động phải hiện bằng hộp
 * thoại của Windows, và ghi vào %APPDATA%\BeeftownCan\loi.txt.
 */
function baoLoi(e: unknown) {
  const cau = e instanceof Error ? e.message : String(e);
  ghiLoiTxt(e instanceof Error ? e.stack ?? cau : cau);
  if (process.platform === 'win32' && !khongMo) {
    // Câu đi qua biến môi trường, không ghép vào lệnh: câu có thể chứa đường dẫn thư mục (tên có dấu nháy ’ ‘ — PowerShell
    // cũng coi là nháy đơn — sẽ phá lệnh).
    try {
      execFileSync('powershell.exe', ['-NoProfile', '-Command',
        "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show($env:BT_CHU, 'Beeftown Cân') | Out-Null"],
        { windowsHide: true, timeout: 120000, env: { ...process.env, BT_CHU: `Beeftown Cân không chạy được:\n\n${cau}` } });
    } catch { /* thôi */ }
  } else console.error(cau);
}
process.on('uncaughtException', (e) => { baoLoi(e); process.exit(1); });
// Lời hứa hỏng chạy ngầm (ví dụ tự làm mới đăng nhập khi mất mạng): chỉ ghi lại, không tắt chương trình.
process.on('unhandledRejection', (e) => { ghiLoiTxt(`(ngầm) ${e instanceof Error ? e.stack : String(e)}`); });

// ---- Đang cập nhật (bản cũ đang mở bản mới)? Không chạy thêm bản thứ hai — hai bản cùng tự gửi xuống cân. --------
if (!moSauCapNhat && khoaCapNhatConHan(fileKhoaCapNhat)) {
  baoLoi(new Error('Beeftown Cân đang cập nhật và sẽ tự mở lại. Chờ 1–3 phút; quá 4 phút chưa thấy cửa sổ thì mở lại chương trình.'));
  process.exit(0);
}

// ---- Đã có một bản đang chạy? Mở lại cửa sổ của nó rồi thoát. -------------
try {
  const cu = JSON.parse(fs.readFileSync(fileDangChay, 'utf8')) as { cong: number; ma: string };
  const r = await fetch(`http://127.0.0.1:${cu.cong}/api/nhip?t=${cu.ma}`, { method: 'POST', signal: AbortSignal.timeout(1500) });
  if (r.ok) { moCuaSo(`http://127.0.0.1:${cu.cong}/?t=${cu.ma}`); process.exit(0); }
} catch { /* không có bản nào đang chạy */ }

// File tải dở của lần cập nhật trước (mất điện giữa chừng). Giữ .cu.exe (quay về bằng tay) và .loi.exe.
if (laExe) { try { donSauCapNhat(cacTepCapNhat(process.execPath)); } catch { /* thôi */ } }

const MA = randomBytes(18).toString('hex');
let nhipCuoi = Date.now();
let henTat: ReturnType<typeof setTimeout> | null = null;
// Đang khởi động lại sau cập nhật: không tự tắt (cửa sổ cũ báo đóng, lâu không nghe nhịp) — tự tắt giữa chừng thì
// không còn ai quay về bản cũ nếu bản mới không mở được. Tự gửi cũng dừng. Tính từ lúc đổi file xong (ud.dangDoiFile),
// không chờ tới lúc máy chủ hẹn khoiDongLai.
let dangKhoiDongLai = false;
const dangCapNhat = () => dangKhoiDongLai || ud.dangDoiFile();

const mayChu = moMayChu(ud, {
  ma: MA, phienBan: PHIEN_BAN,
  khiCoNhip: () => { nhipCuoi = Date.now(); if (henTat) { clearTimeout(henTat); henTat = null; } },
  // Tải lại trang cũng báo "đóng" — yêu cầu mới trong 5 giây sẽ huỷ hẹn tắt.
  khiDong: () => { if (!dangCapNhat()) henTat = setTimeout(() => { if (!dangCapNhat()) process.exit(0); }, 5000); },
  khoiDongLai: (phienBanMoi) => {
    if (dangKhoiDongLai) return;
    dangKhoiDongLai = true;
    if (henTat) { clearTimeout(henTat); henTat = null; }
    const t = cacTepCapNhat(process.execPath);
    void khoiDongLaiSauCapNhat({
      dungMayChu: () => mayChu.stop(true), fileDangChay, fileKhoa: fileKhoaCapNhat, t, phienBanMoi, phienBanCu: PHIEN_BAN,
      // 2.6.1: 3 phút (2.5 → 2.6 ở quán: 90 giây không đủ); lý do không mở được ghi vào loi.txt.
      khoiDong: khoiDongQuaPowerShell(chayPowerShell), diet: (pid) => process.kill(pid), fetch, choMs: 180_000,
      conChay: (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } },
      ghiLyDo: (cau) => ghiLoiTxt(`Cập nhật: ${cau}`),
    }).then((kq) => {
      // Câu theo đúng những file đang có lúc này (cauQuayVeBangTay), không đoán.
      if (kq === 'hong') baoLoi(new Error(`Bản ${phienBanMoi} không mở được và chương trình không tự quay về được. ${cauQuayVeBangTay(t)}`));
      if (kq === 'quay-ve-chua-mo') {
        baoLoi(new Error(`Bản ${phienBanMoi} không mở được nên chương trình đã quay về bản ${PHIEN_BAN}, nhưng không tự mở lại được. ${cauQuayVeBangTay(t)}`));
      }
    }).catch(baoLoi).finally(() => process.exit(0));
  },
});

fs.mkdirSync(ud.dd.cauHinh, { recursive: true });
// phienBan: lúc cập nhật, bản cũ chờ file này ghi phiên bản mới (bản mới đã chạy) rồi mới thoát.
fs.writeFileSync(fileDangChay, JSON.stringify({ cong: mayChu.port, ma: MA, phienBan: PHIEN_BAN }), 'utf8');

// Tự gửi xuống cân khi kho đổi (bật ở Cài đặt): mỗi phút, khi đã có file gốc.
let dangTuGui = false;
const tuGui = async () => {
  if (dangCapNhat() || dangTuGui || !ud.cauHinh().tuGui || !ud.coFileGoc()) return;
  dangTuGui = true;
  // 2.9: gửi được thì báo kho ngay (dòng trên cân mới) — trang pha lóc thấy "Cân sẵn sàng" không phải đợi lượt mỗi phút.
  try { if ((await ud.tuGuiMotLan()).daGui) void ud.baoKhoMotLan(); } finally { dangTuGui = false; }
};
setInterval(tuGui, 60_000);
// 2.9: hỏi kho các ô đang giao mỗi 15 giây — vừa "Giao ô mã" (hay chốt phiên, tảng bán hết) thì tự gửi ngay.
let dangHoiKho = false;
setInterval(async () => {
  if (dangCapNhat() || dangTuGui || dangHoiKho || !ud.cauHinh().tuGui || !ud.coFileGoc()) return;
  dangHoiKho = true;
  try { if (await ud.khoDoiO()) await tuGui(); } finally { dangHoiKho = false; }
}, HOI_KHO_MS);
// 2.9: báo trạng thái cân + nhật ký tem về kho mỗi phút (đèn "Beeftown Cân" ở /noi-bo, trang pha lóc) — lần đầu sau 5 giây.
setTimeout(() => { if (!dangCapNhat()) void ud.baoKhoMotLan(); }, 5_000);
// 2.9.2: dọn Tài liệu\Beeftown Can\da-gui một lần sau khi mở — giữ 100 bản / 30 ngày, bỏ mật khẩu WiFi khỏi bản lưu cũ (không chờ).
setTimeout(() => { void ud.lamSachDaGuiLucMo(); }, 10_000);
setInterval(() => { if (!dangCapNhat()) void ud.baoKhoMotLan(); }, BAO_KHO_MS);

// 2.8: giữ kết nối hai chiều mở với cân (nghe cân tự báo in tem, đèn ô Cân, tự chỉnh giờ cân mỗi ngày) — nhịp 30 giây như
// phần mềm của hãng; lần đầu ngay sau khi mở. Nghe UDP cân tự phát nếu bật ở Cài đặt.
void ud.capNhatUdp();
setTimeout(() => { if (!dangCapNhat()) void ud.nhipCan(); }, 2_000);
setInterval(() => { if (!dangCapNhat()) void ud.nhipCan(); }, NHIP_CAN_MS);

// Lâu không nghe nhịp từ trang (cửa sổ đã đóng mà không kịp báo) → tắt.
// Cửa sổ thu nhỏ vẫn gửi nhịp chậm nhất mỗi phút, nên chờ tới 4 phút.
setInterval(() => { if (!dangCapNhat() && Date.now() - nhipCuoi > 4 * 60_000) process.exit(0); }, 30_000);

moCuaSo(`http://127.0.0.1:${mayChu.port}/?t=${MA}`);
