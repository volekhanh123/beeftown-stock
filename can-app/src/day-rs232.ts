/**
 * BEEFTOWN CÂN — DÂY RS232 (THỬ)
 *
 * Mới chắc cân TM-xA nhận danh mục qua USB và WiFi (cổng 33571). Qua dây RS232
 * thì chưa thử trên cân thật. Phần này làm đúng như phần mềm TM-xA của hãng
 * (SaveForm.cs SaveToSerial, xem CAN-TMA.md):
 *   · cổng COM 9600 bit/giây (khớp thông số 41 của cân), 8 bit dữ liệu, không
 *     chẵn lẻ, 1 bit dừng, điều khiển luồng XOn/XOff (cân báo "chờ" khi bận);
 *     không bật DTR / RTS (hãng để mặc định);
 *   · trên cân phải vào Prog → 4 → 3 (P43 RS-232) trước — cân chỉ nghe dây khi
 *     đang ở màn hình đó (sách hướng dẫn V3.04A, mục 5.6.3);
 *   · bắt tay: gửi "UPL<tab>TIM<tab>", đọc tới dòng END, gửi "UPL<tab>END<tab>";
 *     cân không trả lời = dây / tốc độ / màn hình P43 chưa đúng, không gửi gì;
 *   · gửi: một dòng trống rồi đúng nội dung file như gửi qua WiFi;
 *   · xác nhận: hãng không làm, chương trình này hỏi giờ thêm một lần sau khi gửi
 *     (như hàng rào của đường mạng) — cân trả lời = cân đã đọc hết dữ liệu trước
 *     đó. Không trả lời thì CHƯA CHẮC cân đã nhận.
 *
 * Mở cổng COM bằng PowerShell (System.IO.Ports.SerialPort có sẵn trong Windows),
 * không cài thêm gì. PowerShell chỉ làm đường ống theo một kịch bản (ghi byte,
 * ghi file, đọc dòng tới END); trình tự hỏi / gửi / đọc kết quả nằm ở đây để
 * kiểm thử được bằng PowerShell giả. Tham số đi qua biến môi trường — không lo
 * dấu nháy. Lỗi nào đoạn lệnh cũng in thành một dòng LOI<tab>loại lỗi<tab>câu
 * lỗi; xong thì in OK<tab>số byte đã ghi.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { docDongTim, type GioCan } from './giao-thuc.ts';

/** Tốc độ cân chọn được (thông số 41: 0 = 300 … 5 = 9600 … 9 = 115200); cân để mặc định 9600. */
export const TOC_DO = [300, 600, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200] as const;
const LA_COM = /^COM\d{1,3}$/;

/** Chờ cân trả lời lần hỏi đầu (hãng chờ 3 giây). */
export const CHO_BAT_TAY_MS = 5000;
/** Chờ cân trả lời sau khi nhận xong (hãng chờ 30 giây ở đường mạng). */
export const CHO_XAC_NHAN_MS = 30000;

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
      if (/^﻿?(OK|LOI)(\t|\r?$)/m.test(ra ?? '')) xong(ra);
      else if (loi?.killed) hong(new LoiDay('Quá lâu không xong. Rút dây ra cắm lại rồi thử lại.'));
      else hong(new LoiDay(`Không chạy được PowerShell: ${loi?.message ?? 'không rõ lỗi'}`));
    });
});

/** Khung chung cho mọi đoạn lệnh. */
const khung = (than: string) => String.raw`$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
try {
` + than + String.raw`
} catch {
  $e = $_.Exception
  while ($e.InnerException) { $e = $e.InnerException }
  'LOI' + [char]9 + $e.GetType().Name + [char]9 + ($e.Message -replace '\s+', ' ')
  exit 2
}`;

/** Tên cổng từ .NET, và tên dễ đọc từ Windows ("USB-SERIAL CH340 (COM3)"). */
export const LENH_DS = khung(String.raw`  foreach ($t in [System.IO.Ports.SerialPort]::GetPortNames()) { 'COM' + [char]9 + $t }
  try {
    Get-CimInstance Win32_PnPEntity -Filter "Name LIKE '%(COM%'" | ForEach-Object { 'TEN' + [char]9 + $_.Name }
  } catch {}
  'OK'`);

/**
 * Chạy kịch bản BT_KICH_BAN trên cổng BT_COM, tốc độ BT_BAUD (cài như hãng: XOn/XOff, không DTR / RTS).
 * Kịch bản: các bước cách nhau bằng ";":
 *   GHI:<base64>  ghi các byte đó;
 *   GHITEP        ghi file BT_TEP, từng 1 KB;
 *   DOC:<ms>      đọc dòng (CR hay LF là hết dòng) tới dòng END đứng SAU một dòng TIM — in mỗi dòng thành
 *                 DONG<tab>bước<tab>base64; quá <ms> mà chưa tới thì in HET<tab>bước và dừng cả kịch bản.
 * Mỗi lần ghi chờ tối đa BT_CHO_KHOI mili giây (cân báo XOFF khi bận). Xong: chờ cổng đẩy hết rồi mới đóng.
 */
export const LENH_KICH_BAN = khung(String.raw`  $buoc = $env:BT_KICH_BAN -split ';'
  $p = [System.IO.Ports.SerialPort]::new($env:BT_COM, [int]$env:BT_BAUD, [System.IO.Ports.Parity]::None, 8, [System.IO.Ports.StopBits]::One)
  $p.Handshake = [System.IO.Ports.Handshake]::XOnXOff
  $p.WriteTimeout = [int]$env:BT_CHO_KHOI
  $p.ReadTimeout = 500
  $p.Open()
  $tong = 0
  $dung = $false
  try {
    Start-Sleep -Milliseconds 200
    $p.DiscardInBuffer()
    for ($i = 0; $i -lt $buoc.Length -and -not $dung; $i++) {
      $f = $buoc[$i] -split ':', 2
      if ($f[0] -eq 'GHI') {
        $b = [Convert]::FromBase64String($f[1])
        $p.Write($b, 0, $b.Length)
        $tong += $b.Length
      } elseif ($f[0] -eq 'GHITEP') {
        $b = [System.IO.File]::ReadAllBytes($env:BT_TEP)
        for ($j = 0; $j -lt $b.Length; $j += 1024) { $p.Write($b, $j, [Math]::Min(1024, $b.Length - $j)) }
        $tong += $b.Length
      } elseif ($f[0] -eq 'DOC') {
        $het = [DateTime]::UtcNow.AddMilliseconds([int]$f[1])
        $dong = New-Object 'System.Collections.Generic.List[byte]'
        $coTim = $false
        $xong = $false
        while (-not $xong -and [DateTime]::UtcNow -lt $het) {
          $n = $p.BytesToRead
          if ($n -le 0) { Start-Sleep -Milliseconds 20; continue }
          $tam = New-Object byte[] $n
          $n = $p.Read($tam, 0, $n)
          for ($k = 0; $k -lt $n -and -not $xong; $k++) {
            $c = $tam[$k]
            if ($c -eq 10 -or $c -eq 13) {
              if ($dong.Count -gt 0) {
                $mang = $dong.ToArray()
                'DONG' + [char]9 + $i + [char]9 + [Convert]::ToBase64String($mang)
                $dau = ([System.Text.Encoding]::ASCII.GetString($mang) -split [char]9)[0]
                if ($dau -eq 'TIM') { $coTim = $true } elseif ($dau -eq 'END' -and $coTim) { $xong = $true }
                $dong.Clear()
              }
            } else { $dong.Add($c) }
          }
        }
        if (-not $xong) { 'HET' + [char]9 + $i; $dung = $true }
      }
    }
    $het = [DateTime]::UtcNow.AddSeconds(30)
    while ($p.BytesToWrite -gt 0 -and [DateTime]::UtcNow -lt $het) { Start-Sleep -Milliseconds 50 }
    Start-Sleep -Milliseconds 300
  } finally { $p.Close() }
  'OK' + [char]9 + $tong`);

/**
 * Dòng OK → phần sau "OK<tab>"; dòng LOI → LoiDay có câu dễ hiểu. Bỏ dấu BOM
 * đầu dòng: Windows PowerShell 5.1 có máy vẫn in BOM trước dòng đầu.
 */
export function docKetQua(ra: string, com: string): string {
  const dong = ra.split(/\r?\n/).map(d => d.replace(/^﻿/, ''));
  const loi = dong.find(d => d.startsWith('LOI\t'));
  if (loi) {
    const [, loai = '', cau = ''] = loi.split('\t');
    if (/UnauthorizedAccess/i.test(loai)) throw new LoiDay(`Cổng ${com} đang bị chương trình khác dùng (phần mềm cân cũ…). Tắt chương trình đó rồi thử lại.`);
    if (/does not exist|không tồn tại/i.test(cau)) throw new LoiDay(`Không thấy cổng ${com}. Dây đã cắm chưa? Bấm "Tìm cổng COM" lại.`);
    if (/Timeout/i.test(loai)) {
      throw new LoiDay(`Cổng ${com} không đẩy được dữ liệu đi (quá giờ — cân báo "chờ" mà không báo tiếp). Trên cân vào lại Prog → 4 → 3, `
        + 'rút dây ra cắm lại rồi thử lại.');
    }
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
  for (const d of ra.split(/\r?\n/).map(x => x.replace(/^﻿/, ''))) {
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
  if (!(TOC_DO as readonly number[]).includes(baud)) throw new LoiDay(`Chọn tốc độ: ${TOC_DO.join(', ')} (cân để mặc định 9600).`);
}

/** Tốc độ cân đang để theo thông số 41 (giá trị 0–9); không đọc được → null. */
export function tocDoTuThongSo(giaTri: string | undefined): number | null {
  const n = /^\s*\d\s*$/.test(giaTri ?? '') ? parseInt(giaTri!, 10) : -1;
  return n >= 0 && n < TOC_DO.length ? TOC_DO[n] : null;
}

/** Giây để đẩy hết `soByte` ở tốc độ `baud` (10 bit một byte). */
export const giayDay = (soByte: number, baud: number) => Math.ceil(soByte * 10 / baud);

export async function dsCongCom(chay: ChayPs = chayPowerShell): Promise<CongCom[]> {
  return docDsCom(await chay(LENH_DS, {}, 60_000));
}

// -----------------------------------------------------------------------------
// KỊCH BẢN (trình tự như phần mềm hãng)
// -----------------------------------------------------------------------------
export type BuocDay = { ghi: string } | { ghiTep: true } | { doc: number };

const b64 = (chu: string) => Buffer.from(chu, 'latin1').toString('base64');
/** Kịch bản → chuỗi BT_KICH_BAN cho LENH_KICH_BAN. */
export const chuoiKichBan = (buoc: BuocDay[]) =>
  buoc.map(b => ('ghi' in b ? `GHI:${b64(b.ghi)}` : 'ghiTep' in b ? 'GHITEP' : `DOC:${b.doc}`)).join(';');

/** Bắt tay như hãng: hỏi giờ, đọc tới END, báo xong. */
export const BAT_TAY: BuocDay[] = [{ ghi: 'UPL\tTIM\t\r\n' }, { doc: CHO_BAT_TAY_MS }, { ghi: 'UPL\tEND\t\r\n' }];
/** Gửi: bắt tay, một dòng trống, nội dung file, rồi hỏi giờ thêm một lần để biết cân đã đọc hết. */
export const GUI_FILE: BuocDay[] = [...BAT_TAY, { ghi: '\r\n' }, { ghiTep: true },
  { ghi: '\r\nUPL\tTIM\t\r\n' }, { doc: CHO_XAC_NHAN_MS }, { ghi: 'UPL\tEND\t\r\n' }];

export interface KetQuaKichBan {
  /** Số byte đã ghi ra dây. */
  soByte: number;
  /** Các dòng đọc được, theo bước (chuỗi byte — mỗi ký tự một byte). */
  dong: { buoc: number; chu: string }[];
  /** Bước DOC quá giờ (kịch bản dừng ở đó); null = mọi bước DOC tới được END. */
  hetGio: number | null;
}

/** Đọc những gì LENH_KICH_BAN in ra. */
export function docKichBan(ra: string, com: string): KetQuaKichBan {
  const soByte = Number(docKetQua(ra, com)) || 0;
  const dong: KetQuaKichBan['dong'] = [];
  let hetGio: number | null = null;
  for (const d of ra.split(/\r?\n/).map(x => x.replace(/^﻿/, '').trimEnd())) {
    const c = d.split('\t');
    if (c[0] === 'DONG' && c.length === 3) dong.push({ buoc: Number(c[1]), chu: Buffer.from(c[2], 'base64').toString('latin1') });
    else if (c[0] === 'HET' && hetGio === null) hetGio = Number(c[1]);
  }
  return { soByte, dong, hetGio };
}

/** Giờ trong các dòng cân trả lời ở một bước DOC; không có dòng TIM đọc được → null. */
export function gioTrongBuoc(kq: KetQuaKichBan, buoc: number): GioCan | null {
  for (const d of kq.dong) if (d.buoc === buoc && d.chu.startsWith('TIM\t')) return docDongTim(d.chu.split('\t'));
  return null;
}

const buocDoc = (kb: BuocDay[]) => kb.flatMap((b, i) => ('doc' in b ? [i] : []));

/** Câu báo khi bắt tay không được: cân không trả lời, hay trả lời mà không đúng. */
function loiBatTay(kq: KetQuaKichBan, com: string, baud: number): LoiDay {
  const nghe = kq.dong.filter(d => d.buoc === buocDoc(BAT_TAY)[0]);
  if (nghe.length) {
    const dau = nghe[0].chu.replace(/[^\x20-\x7e]/g, '·').slice(0, 40);
    return new LoiDay(`Có nghe thấy cân qua ${com} nhưng không đúng câu trả lời (nhận "${dau}"). Thường là sai tốc độ: `
      + `xem thông số 41 của cân (Prog → 1 → 2, SP.041: 5 = 9600) rồi chọn đúng tốc độ, thử lại.`);
  }
  return new LoiDay(`Cân không trả lời qua ${com} (tốc độ ${baud}) trong ${Math.round(CHO_BAT_TAY_MS / 1000)} giây — chưa gửi gì xuống cân. `
    + 'Kiểm lần lượt: (1) trên cân bấm Prog → 4 → 3 (P43 RS-232) và để cân ở màn hình đó; (2) tốc độ khớp thông số 41 '
    + 'của cân (Prog → 1 → 2, SP.041: 5 = 9600); (3) dây: nếu vẫn không được, gắn thêm đầu chuyển null-modem (đảo chân 2–3).');
}

/** Chạy một kịch bản; file `du` (nếu có) đi qua file tạm — file tạm (có mật khẩu WiFi của quán) xoá ngay sau đó. */
async function chayKichBan(com: string, baud: number, kb: BuocDay[], du: Uint8Array | null, chay: ChayPs): Promise<KetQuaKichBan> {
  kiemCom(com, baud);
  const tep = du ? path.join(os.tmpdir(), `beeftown-can-day-${process.pid}-${Date.now()}.tms`) : '';
  if (du) fs.writeFileSync(tep, du);
  try {
    const choKhoi = Math.max(CHO_XAC_NHAN_MS, giayDay(1024, baud) * 2000);
    const choDoc = kb.reduce((s, b) => s + ('doc' in b ? b.doc : 0), 0);
    const ra = await chay(LENH_KICH_BAN, { BT_COM: com, BT_BAUD: String(baud), BT_KICH_BAN: chuoiKichBan(kb), BT_TEP: tep,
      BT_CHO_KHOI: String(choKhoi) }, choDoc + giayDay(du?.length ?? 0, baud) * 2000 + 60_000);
    return docKichBan(ra, com);
  } finally {
    if (du) fs.rmSync(tep, { force: true });
  }
}

/** Kiểm tra dây: bắt tay, trả giờ trên cân. Cân không trả lời → LoiDay chỉ cách sửa. */
export async function hoiGioQuaDay(com: string, baud: number, chay: ChayPs = chayPowerShell): Promise<GioCan | null> {
  const kq = await chayKichBan(com, baud, BAT_TAY, null, chay);
  if (kq.hetGio !== null) throw loiBatTay(kq, com, baud);
  return gioTrongBuoc(kq, buocDoc(BAT_TAY)[0]);
}

/**
 * Gửi nội dung file qua dây như hãng. Bắt tay không được → LoiDay, chưa gửi byte nào của file. Gửi xong mà cân
 * không trả lời lần hỏi sau → daXacNhan false (chưa chắc cân đã nhận), không phải lỗi.
 */
export async function guiCom(com: string, baud: number, du: Uint8Array, chay: ChayPs = chayPowerShell):
  Promise<{ soByte: number; daXacNhan: boolean; gio: GioCan | null }> {
  const kq = await chayKichBan(com, baud, GUI_FILE, du, chay);
  const [docDau, docSau] = buocDoc(GUI_FILE);
  if (kq.hetGio === docDau) throw loiBatTay(kq, com, baud);
  return { soByte: kq.soByte, daXacNhan: kq.hetGio === null, gio: gioTrongBuoc(kq, docSau) };
}
