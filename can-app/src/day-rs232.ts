/**
 * BEEFTOWN CÂN — DÂY RS232 (THỬ)
 *
 * Mới chắc cân TM-xA nhận danh mục qua USB và WiFi (cổng 33571). Qua dây RS232
 * thì chưa biết — phần này để thử trên cân thật: đẩy đúng nội dung file như khi
 * gửi qua WiFi ra cổng COM (dây USB–RS232 hiện thành COM3, COM4…), và nghe xem
 * cân có tự gửi gì qua dây không. Dây không báo "đã nhận" như WiFi (cân đóng
 * kết nối), nên chương trình không ghi nhận gì — người thử gọi hàng trên cân để
 * xem cân đã đổi chưa.
 *
 * Mở cổng COM bằng PowerShell (System.IO.Ports.SerialPort có sẵn trong Windows),
 * không cài thêm gì: 8 bit dữ liệu, không chẵn lẻ, 1 bit dừng, không bắt tay,
 * bật DTR và RTS. Đoạn lệnh đi dạng -EncodedCommand, tham số đi qua biến môi
 * trường — không lo dấu nháy. Lỗi nào đoạn lệnh cũng in thành một dòng
 * LOI<tab>loại lỗi<tab>câu lỗi; xong thì in OK<tab>kết quả.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFile } from 'node:child_process';

/** Tốc độ hay gặp ở cân; cân thường để 9600. */
export const TOC_DO = [2400, 4800, 9600, 19200, 38400, 57600, 115200] as const;
const LA_COM = /^COM\d{1,3}$/;

export interface CongCom { ten: string; moTa: string }

export class LoiDay extends Error {}

/** Chạy một đoạn PowerShell, trả những gì nó in ra — kiểm thử thay bằng hàm giả. */
export type ChayPs = (lenh: string, bien: Record<string, string>, choMs: number) => Promise<string>;

export const chayPowerShell: ChayPs = (lenh, bien, choMs) => new Promise((xong, hong) => {
  if (process.platform !== 'win32') { hong(new LoiDay('Dây RS232 chỉ dùng được trên máy Windows.')); return; }
  const ma = Buffer.from(lenh, 'utf16le').toString('base64');
  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', ma],
    { env: { ...process.env, ...bien }, windowsHide: true, timeout: choMs, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8' },
    (loi, ra) => {
      // Đoạn lệnh báo lỗi bằng dòng LOI và thoát mã 2 — vẫn là kết quả đọc được.
      if (/^(OK|LOI)(\t|\r?$)/m.test(ra ?? '')) xong(ra);
      else if (loi?.killed) hong(new LoiDay('Quá lâu không xong. Rút dây ra cắm lại rồi thử lại.'));
      else hong(new LoiDay(`Không chạy được PowerShell: ${loi?.message ?? 'không rõ lỗi'}`));
    });
});

/** Khung chung cho mọi đoạn lệnh. */
const khung = (than: string) => String.raw`$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
try {
` + than + String.raw`
} catch {
  $e = $_.Exception
  while ($e.InnerException) { $e = $e.InnerException }
  'LOI' + [char]9 + $e.GetType().Name + [char]9 + ($e.Message -replace '\s+', ' ')
  exit 2
}`;

const MO_CONG = String.raw`  $p = [System.IO.Ports.SerialPort]::new($env:BT_COM, [int]$env:BT_BAUD, [System.IO.Ports.Parity]::None, 8, [System.IO.Ports.StopBits]::One)
  $p.Handshake = [System.IO.Ports.Handshake]::None
  $p.DtrEnable = $true
  $p.RtsEnable = $true
`;

/** Tên cổng từ .NET, và tên dễ đọc từ Windows ("USB-SERIAL CH340 (COM3)"). */
export const LENH_DS = khung(String.raw`  foreach ($t in [System.IO.Ports.SerialPort]::GetPortNames()) { 'COM' + [char]9 + $t }
  try {
    Get-CimInstance Win32_PnPEntity -Filter "Name LIKE '%(COM%'" | ForEach-Object { 'TEN' + [char]9 + $_.Name }
  } catch {}
  'OK'`);

/** Mở cổng, chờ chút cho cân thấy DTR, đẩy file từng 1 KB, chờ cổng đẩy hết rồi mới đóng. */
export const LENH_GUI = khung(String.raw`  $b = [System.IO.File]::ReadAllBytes($env:BT_TEP)
` + MO_CONG + String.raw`  $p.WriteTimeout = [int]$env:BT_CHO_KHOI
  $p.Open()
  try {
    Start-Sleep -Milliseconds 300
    for ($i = 0; $i -lt $b.Length; $i += 1024) { $p.Write($b, $i, [Math]::Min(1024, $b.Length - $i)) }
    $het = [DateTime]::UtcNow.AddSeconds(30)
    while ($p.BytesToWrite -gt 0 -and [DateTime]::UtcNow -lt $het) { Start-Sleep -Milliseconds 50 }
    Start-Sleep -Milliseconds 500
  } finally { $p.Close() }
  'OK' + [char]9 + $b.Length`);

/** Nghe cổng BT_CHO mili giây (tối đa 64 KB), trả base64. */
export const LENH_NGHE = khung(MO_CONG + String.raw`  $p.Open()
  $ms = New-Object System.IO.MemoryStream
  $buf = New-Object byte[] 4096
  $het = [DateTime]::UtcNow.AddMilliseconds([int]$env:BT_CHO)
  try {
    while ([DateTime]::UtcNow -lt $het -and $ms.Length -lt 65536) {
      $n = $p.BytesToRead
      if ($n -gt 0) { $n = $p.Read($buf, 0, [Math]::Min($n, $buf.Length)); $ms.Write($buf, 0, $n) }
      else { Start-Sleep -Milliseconds 50 }
    }
  } finally { $p.Close() }
  'OK' + [char]9 + [Convert]::ToBase64String($ms.ToArray())`);

/** Dòng OK → phần sau "OK<tab>"; dòng LOI → LoiDay có câu dễ hiểu. */
export function docKetQua(ra: string, com: string): string {
  const dong = ra.split(/\r?\n/);
  const loi = dong.find(d => d.startsWith('LOI\t'));
  if (loi) {
    const [, loai = '', cau = ''] = loi.split('\t');
    if (/UnauthorizedAccess/i.test(loai)) throw new LoiDay(`Cổng ${com} đang bị chương trình khác dùng (phần mềm cân cũ…). Tắt chương trình đó rồi thử lại.`);
    if (/does not exist|không tồn tại/i.test(cau)) throw new LoiDay(`Không thấy cổng ${com}. Dây đã cắm chưa? Bấm "Tìm cổng COM" lại.`);
    if (/Timeout/i.test(loai)) throw new LoiDay(`Cổng ${com} không đẩy được dữ liệu đi (quá giờ). Rút dây ra cắm lại rồi thử lại.`);
    throw new LoiDay(`Cổng ${com}: ${cau.trim() || loai}`);
  }
  const ok = dong.map(d => d.trimEnd()).findLast(d => d === 'OK' || d.startsWith('OK\t'));
  if (ok === undefined) throw new LoiDay('PowerShell không trả kết quả.');
  return ok.slice(3);
}

/** Gộp tên cổng từ .NET với tên dễ đọc của Windows; xếp COM1, COM2, … COM10. */
export function docDsCom(ra: string): CongCom[] {
  docKetQua(ra, 'COM');
  const moTa = new Map<string, string>();
  const ten = new Set<string>();
  for (const d of ra.split(/\r?\n/)) {
    const [loai, gt = ''] = d.split('\t');
    // Vài driver trả tên dính ký tự lạ ở cuối ("COM3\0") — chỉ lấy COMn.
    const m = loai === 'COM' ? /^COM\d{1,3}/i.exec(gt.trim()) : loai === 'TEN' ? /\((COM\d{1,3})\)/i.exec(gt) : null;
    if (!m) continue;
    const t = (m[1] ?? m[0]).toUpperCase();
    ten.add(t);
    if (loai === 'TEN') moTa.set(t, gt.trim());
  }
  return [...ten].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))).map(t => ({ ten: t, moTa: moTa.get(t) ?? t }));
}

export function kiemCom(com: string, baud: number) {
  if (!LA_COM.test(com)) throw new LoiDay('Chọn cổng COM của dây (ví dụ COM3).');
  if (!(TOC_DO as readonly number[]).includes(baud)) throw new LoiDay(`Chọn tốc độ: ${TOC_DO.join(', ')} (cân thường để 9600).`);
}

/** Giây để đẩy hết `soByte` ở tốc độ `baud` (10 bit một byte). */
export const giayDay = (soByte: number, baud: number) => Math.ceil(soByte * 10 / baud);

export async function dsCongCom(chay: ChayPs = chayPowerShell): Promise<CongCom[]> {
  return docDsCom(await chay(LENH_DS, {}, 60_000));
}

/** Đẩy nguyên nội dung ra cổng COM. File tạm (có mật khẩu WiFi của quán) xoá ngay sau khi gửi. */
export async function guiCom(com: string, baud: number, du: Uint8Array, chay: ChayPs = chayPowerShell): Promise<void> {
  kiemCom(com, baud);
  const tep = path.join(os.tmpdir(), `beeftown-can-day-${process.pid}-${Date.now()}.tms`);
  fs.writeFileSync(tep, du);
  try {
    const choKhoi = Math.max(5000, giayDay(1024, baud) * 2000);
    const ra = await chay(LENH_GUI, { BT_COM: com, BT_BAUD: String(baud), BT_TEP: tep, BT_CHO_KHOI: String(choKhoi) },
      giayDay(du.length, baud) * 2000 + 60_000);
    docKetQua(ra, com);
  } finally {
    fs.rmSync(tep, { force: true });
  }
}

export async function ngheCom(com: string, baud: number, ms: number, chay: ChayPs = chayPowerShell): Promise<Uint8Array> {
  kiemCom(com, baud);
  const ra = docKetQua(await chay(LENH_NGHE, { BT_COM: com, BT_BAUD: String(baud), BT_CHO: String(ms) }, ms + 60_000), com);
  return new Uint8Array(Buffer.from(ra, 'base64'));
}

/** Những gì nghe được: bao nhiêu byte, bao nhiêu phần trăm là chữ đọc được (đúng tốc độ thì cao), đoạn đầu. */
export function tomTatNghe(du: Uint8Array): { soByte: number; docDuoc: number; chu: string; hex: string } {
  const doc = (b: number) => (b >= 32 && b < 127) || b === 9 || b === 10 || b === 13;
  let n = 0;
  for (const b of du) if (doc(b)) n++;
  return {
    soByte: du.length,
    docDuoc: du.length ? Math.round((n / du.length) * 100) : 0,
    chu: [...du.subarray(0, 160)].map(b => (b === 9 ? '→' : b === 10 || b === 13 ? '↵' : doc(b) ? String.fromCharCode(b) : '·')).join(''),
    hex: [...du.subarray(0, 48)].map(b => b.toString(16).padStart(2, '0')).join(' '),
  };
}
