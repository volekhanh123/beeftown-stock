/**
 * BEEFTOWN CÂN — TỰ CẬP NHẬT (2.5)
 *
 * Bản cài nằm ở một kho GitHub CÔNG KHAI chỉ chứa file cài (REPO_BAN_CAI); mã nguồn vẫn ở kho riêng. Workflow
 * dong-goi-can.yml (job phat-hanh) đưa lên mỗi phiên bản mới: BeeftownCan.exe + phien-ban.json
 *   { dang: 1, phienBan: "2.6.0", tep: "BeeftownCan.exe", sha256: "<64 hex>", kichThuoc: <byte>, ngay: "<ISO>" }.
 *
 * Chương trình:
 *   1. hỏi `<gốc>/latest/download/phien-ban.json` (GitHub chuyển tới bản mới nhất) — chỉ nhận phiên bản MỚI HƠN;
 *   2. tải `<gốc>/download/can-v<phiên bản>/BeeftownCan.exe` — đường dựng từ khuôn cố định, phiên bản đã kiểm bằng
 *      regex; KHÔNG BAO GIỜ dùng đường dẫn nào ghi trong phiếu;
 *   3. ghi vào `<tên>.dang-tai` CẠNH file đang chạy (đổi tên cùng ổ đĩa mới nguyên tử), kiểm đúng cỡ, đúng SHA-256
 *      của phiếu, đúng file chạy Windows 64-bit giao diện (MZ/PE, x64, GUI — như CI kiểm);
 *   4. đổi tên file đang chạy thành `<tên>.cu.exe` (Windows cho đổi tên file đang chạy, không cho ghi đè), đặt file
 *      mới vào chỗ; hỏng giữa chừng thì đổi ngược lại;
 *   5. main.ts dừng máy chủ, xoá dang-chay.json, mở bản mới rồi CHỜ bản mới trả lời; không trả lời trong 90 giây
 *      (phần mềm diệt virus chặn, bản hỏng) thì tự quay về bản cũ (`<tên>.loi.exe` giữ bản mới để xem).
 *
 * Không ký số: khoá ký và token đưa file lên kho công khai đều nằm trong Secrets của GitHub, lộ một là lộ cả hai —
 * chữ ký không thêm được gì. Độ tin cậy dựa vào HTTPS tới đúng kho, phiên bản kiểm bằng regex, SHA-256 + cỡ do CI
 * tính, và kiểm PE. Chạy thử trên Windows thật: can-app/README.md, mục "Bản 2.5 — tự cập nhật".
 *
 * File thuần: mạng, file và PowerShell đều tiêm được (kiểm thử trên Linux với thư mục tạm và GitHub giả).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { khung, type ChayPs } from './day-rs232.ts';
import { homNayVn } from '../../web/src/lib/gio-vn.ts';

/** Kho GitHub công khai chỉ chứa file cài — workflow dong-goi-can.yml dùng đúng tên này (test-quy-trinh.mjs kiểm). */
export const REPO_BAN_CAI = 'volekhanh123/beeftown-can-ban-cai';
export const GOC_BAN_CAI = `https://github.com/${REPO_BAN_CAI}/releases`;
export const TEN_TEP_BAN_CAI = 'BeeftownCan.exe';
/** Dạng phiếu phiên bản mà bản này đọc được. Phiếu dạng khác → báo tải bằng tay. */
export const DANG_PHIEU = 1;
const LA_PHIEN_BAN = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/;
const LA_SHA256 = /^[0-9a-f]{64}$/;
/** Cỡ file cài chấp nhận (file thật ~85 MB). */
export const GIOI_HAN_MAC_DINH = { nhoNhat: 10 * 1024 * 1024, lonNhat: 150 * 1024 * 1024 };
/** Hỏi phiếu 15 giây; tải tối đa 10 phút, đứng yên quá 60 giây là hỏng. */
export const CHO_MAC_DINH = { hoi: 15_000, tong: 10 * 60_000, lang: 60_000 };
const PHIEU_TOI_DA = 16 * 1024;

export class LoiCapNhat extends Error {}
const CHUA_DOI = ' Chưa đổi gì — chương trình vẫn chạy bản cũ.';

// -----------------------------------------------------------------------------
// PHIÊN BẢN VÀ PHIẾU
// -----------------------------------------------------------------------------
/** So hai phiên bản "a.b.c" theo số (2.10.0 > 2.9.0): âm, 0, dương. Sai dạng → LoiCapNhat. */
export function soSanhPhienBan(a: string, b: string): number {
  if (!LA_PHIEN_BAN.test(a) || !LA_PHIEN_BAN.test(b)) throw new LoiCapNhat(`Phiên bản không đúng dạng: "${a}", "${b}".`);
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

export interface PhieuPhienBan {
  phienBan: string;
  tep: string;
  sha256: string;
  kichThuoc: number;
  /** Lúc phát hành (ISO) — chỉ để hiện; null nếu thiếu / sai. */
  ngay: string | null;
}

/** Đọc phiếu phiên bản — kiểm chặt từng trường; trường lạ (kể cả `url`) bỏ qua, không bao giờ dùng. */
export function docPhieuPhienBan(chu: string, gioiHan = GIOI_HAN_MAC_DINH): PhieuPhienBan {
  let v: unknown;
  try { v = JSON.parse(chu); } catch { throw new LoiCapNhat('Phiếu phiên bản trên kho cập nhật không đọc được.'); }
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new LoiCapNhat('Phiếu phiên bản trên kho cập nhật không đúng dạng.');
  const p = v as Record<string, unknown>;
  if (p.dang !== DANG_PHIEU) {
    throw new LoiCapNhat('Bản mới cần cài bằng tay một lần (phiếu phiên bản dạng mới) — tải ở trang Releases, xem Hướng dẫn.');
  }
  if (typeof p.phienBan !== 'string' || !LA_PHIEN_BAN.test(p.phienBan)) throw new LoiCapNhat('Phiếu phiên bản ghi phiên bản sai dạng.');
  if (p.tep !== TEN_TEP_BAN_CAI) throw new LoiCapNhat('Phiếu phiên bản ghi tên file lạ.');
  if (typeof p.sha256 !== 'string' || !LA_SHA256.test(p.sha256)) throw new LoiCapNhat('Phiếu phiên bản thiếu mã kiểm tra SHA-256.');
  if (typeof p.kichThuoc !== 'number' || !Number.isInteger(p.kichThuoc) || p.kichThuoc < gioiHan.nhoNhat || p.kichThuoc > gioiHan.lonNhat) {
    throw new LoiCapNhat('Phiếu phiên bản ghi cỡ file không hợp lý.');
  }
  const ngay = typeof p.ngay === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(p.ngay) && !Number.isNaN(Date.parse(p.ngay)) ? p.ngay : null;
  return { phienBan: p.phienBan, tep: p.tep, sha256: p.sha256, kichThuoc: p.kichThuoc, ngay };
}

export const duongPhieu = (goc: string) => `${goc}/latest/download/phien-ban.json`;

/** Đường tải file cài của một phiên bản — dựng từ khuôn cố định, phiên bản phải đúng dạng. */
export function duongTepBanMoi(phienBan: string, goc: string): string {
  if (!LA_PHIEN_BAN.test(phienBan)) throw new LoiCapNhat('Phiên bản không đúng dạng.');
  return `${goc}/download/can-v${phienBan}/${TEN_TEP_BAN_CAI}`;
}

/** Đọc thân trả lời, tối đa `toiDa` byte (phiếu phiên bản chỉ vài trăm byte). */
async function docGioiHan(r: Response, toiDa: number): Promise<string> {
  if (!r.body) return '';
  const doc = r.body.getReader();
  const phan: Uint8Array[] = [];
  let n = 0;
  for (;;) {
    const { done, value } = await doc.read();
    if (done) break;
    n += value.length;
    if (n > toiDa) { await doc.cancel().catch(() => {}); throw new LoiCapNhat('Phiếu phiên bản trên kho cập nhật quá lớn.'); }
    phan.push(value);
  }
  return Buffer.concat(phan).toString('utf8');
}

/** Hỏi kho cập nhật: phiếu bản mới nhất và có mới hơn bản đang chạy không (bằng hoặc cũ hơn → không bao giờ đề nghị). */
export async function hoiBanMoi(o: {
  fetch: typeof fetch; goc: string; phienBanDangChay: string; choMs: number; gioiHan?: typeof GIOI_HAN_MAC_DINH;
}): Promise<{ phieu: PhieuPhienBan; coBanMoi: boolean }> {
  let r: Response;
  try { r = await o.fetch(duongPhieu(o.goc), { redirect: 'follow', signal: AbortSignal.timeout(o.choMs) }); }
  catch { throw new LoiCapNhat('Không hỏi được bản mới — máy có vào mạng internet không?'); }
  if (r.status === 404) throw new LoiCapNhat('Kho cập nhật chưa có bản nào.');
  if (!r.ok) throw new LoiCapNhat(`Kho cập nhật trả lỗi (mã ${r.status}). Thử lại sau.`);
  let chu: string;
  try { chu = await docGioiHan(r, PHIEU_TOI_DA); }
  catch (e) {
    if (e instanceof LoiCapNhat) throw e;
    throw new LoiCapNhat('Không hỏi được bản mới — mạng ngắt giữa chừng.');
  }
  const phieu = docPhieuPhienBan(chu, o.gioiHan);
  return { phieu, coBanMoi: soSanhPhienBan(phieu.phienBan, o.phienBanDangChay) > 0 };
}

// -----------------------------------------------------------------------------
// TẢI VÀ KIỂM
// -----------------------------------------------------------------------------
/** File chạy Windows 64-bit có giao diện (như CI kiểm `file -b` = PE32+ GUI x86-64): MZ → PE, máy x64, PE32+, giao diện. */
export function kiemFileChayWindows(dau: Uint8Array): boolean {
  const b = Buffer.from(dau.buffer, dau.byteOffset, dau.byteLength);
  if (b.length < 0x40 || b[0] !== 0x4D || b[1] !== 0x5A) return false;
  const pe = b.readUInt32LE(0x3C);
  if (pe + 24 + 70 > b.length) return false;
  if (b.readUInt32LE(pe) !== 0x00004550) return false;           // "PE\0\0"
  if (b.readUInt16LE(pe + 4) !== 0x8664) return false;           // máy x64
  if (b.readUInt16LE(pe + 24) !== 0x20B) return false;           // PE32+
  return b.readUInt16LE(pe + 24 + 68) === 2;                     // giao diện Windows (không phải cửa sổ lệnh)
}

/**
 * Tải file cài vào `dich` (tạo mới, `wx`), đếm byte và băm SHA-256 trong lúc tải. Sai cỡ, sai SHA-256, không phải file
 * chạy Windows, mất mạng, đứng yên quá `choMs.lang`, quá `choMs.tong` → xoá `dich`, LoiCapNhat "Chưa đổi gì".
 */
export async function taiVaKiem(o: {
  fetch: typeof fetch; url: string; dich: string; phieu: PhieuPhienBan;
  choMs: { tong: number; lang: number }; khiTien?: (daTai: number) => void;
}): Promise<void> {
  const huy = new AbortController();
  const hetTong = setTimeout(() => huy.abort(), o.choMs.tong);
  let hetLang = setTimeout(() => huy.abort(), o.choMs.lang);
  let fd: number | null = null;
  try {
    try { fs.rmSync(o.dich, { force: true }); } catch { /* không xoá được thì mở wx báo lỗi */ }
    try { fd = fs.openSync(o.dich, 'wx'); }
    catch (e) { throw new LoiCapNhat(`Không ghi được file tạm cạnh chương trình (${(e as NodeJS.ErrnoException).code ?? 'lỗi'}).${CHUA_DOI}`); }
    let r: Response;
    try { r = await o.fetch(o.url, { redirect: 'follow', signal: huy.signal }); }
    catch { throw new LoiCapNhat('Không tải được bản mới (mất mạng hoặc quá lâu).' + CHUA_DOI); }
    if (!r.ok || !r.body) throw new LoiCapNhat(`Kho cập nhật trả lỗi (mã ${r.status}) khi tải file.${CHUA_DOI}`);
    if (o.url.startsWith('https:') && r.url && !r.url.startsWith('https:')) throw new LoiCapNhat('Kho cập nhật chuyển sang đường không mã hoá.' + CHUA_DOI);
    const coDai = r.headers.get('content-length');
    if (coDai !== null && !r.headers.get('content-encoding') && Number(coDai) !== o.phieu.kichThuoc) {
      await r.body.cancel().catch(() => {});
      throw new LoiCapNhat('File trên kho cập nhật không đúng cỡ ghi trong phiếu phiên bản.' + CHUA_DOI);
    }
    const bam = createHash('sha256');
    const dau: Buffer[] = [];
    let daTai = 0, soDau = 0;
    const doc = r.body.getReader();
    for (;;) {
      let phan: Awaited<ReturnType<typeof doc.read>>;
      try { phan = await doc.read(); }
      catch { throw new LoiCapNhat('Tải bị ngắt giữa chừng (mất mạng hoặc quá lâu).' + CHUA_DOI); }
      if (phan.done) break;
      const b = phan.value;
      daTai += b.length;
      if (daTai > o.phieu.kichThuoc) {
        await doc.cancel().catch(() => {});
        throw new LoiCapNhat('File tải về lớn hơn cỡ ghi trong phiếu phiên bản.' + CHUA_DOI);
      }
      bam.update(b);
      if (soDau < 4096) { const lay = b.subarray(0, 4096 - soDau); dau.push(Buffer.from(lay)); soDau += lay.length; }
      fs.writeSync(fd, b);
      clearTimeout(hetLang);
      hetLang = setTimeout(() => huy.abort(), o.choMs.lang);
      o.khiTien?.(daTai);
    }
    if (daTai !== o.phieu.kichThuoc) {
      throw new LoiCapNhat(`File tải về thiếu (${moTaMb(daTai)} / ${moTaMb(o.phieu.kichThuoc)}).${CHUA_DOI}`);
    }
    if (bam.digest('hex') !== o.phieu.sha256) throw new LoiCapNhat('File tải về không khớp mã kiểm tra SHA-256 — có thể hỏng khi tải.' + CHUA_DOI);
    if (!kiemFileChayWindows(Buffer.concat(dau))) throw new LoiCapNhat('File tải về không phải chương trình Windows 64-bit.' + CHUA_DOI);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;
  } catch (e) {
    huy.abort();
    if (fd !== null) { try { fs.closeSync(fd); } catch { /* thôi */ } fd = null; }
    try { fs.rmSync(o.dich, { force: true }); } catch { /* lần sau donSauCapNhat xoá */ }
    if (e instanceof LoiCapNhat) throw e;
    throw new LoiCapNhat(`Không ghi được file tạm (${(e as NodeJS.ErrnoException).code ?? (e as Error).message}).${CHUA_DOI}`);
  } finally {
    clearTimeout(hetTong);
    clearTimeout(hetLang);
  }
}

// -----------------------------------------------------------------------------
// ĐỔI FILE
// -----------------------------------------------------------------------------
export interface CacTep {
  thuMuc: string;
  /** File đang chạy (process.execPath). */
  tepChay: string;
  /** Bản trước — giữ đúng một bản để quay về bằng tay. */
  tepCu: string;
  /** Bản mới đang tải (không có đuôi .exe để không ai bấm nhầm). */
  tepDangTai: string;
  /** Bản mới không mở được — giữ để xem. */
  tepLoi: string;
  tepThuGhi: string;
  /** 2.6.1: bản mới đặt tạm ở đây (đuôi .exe để Windows chạy được) trong lúc chạy thử (chayThuBanMoi). */
  tepChayThu: string;
  /** 2.6.1: bản mới lúc chạy thử ghi phiên bản của nó vào đây rồi thoát (main.ts, BEEFTOWN_CAN_THU_CHAY). */
  fileChayThu: string;
}

export function cacTepCapNhat(tepChay: string): CacTep {
  const thuMuc = path.dirname(tepChay);
  const ten = path.basename(tepChay).replace(/\.exe$/i, '');
  return {
    thuMuc, tepChay,
    tepCu: path.join(thuMuc, `${ten}.cu.exe`), tepDangTai: path.join(thuMuc, `${ten}.dang-tai`),
    tepLoi: path.join(thuMuc, `${ten}.loi.exe`), tepThuGhi: path.join(thuMuc, `${ten}.thu-ghi`),
    tepChayThu: path.join(thuMuc, `${ten}.chay-thu.exe`), fileChayThu: path.join(thuMuc, `${ten}.chay-thu.json`),
  };
}

/** Thao tác file — kiểm thử tiêm lỗi (thư mục chỉ đọc, file bị khoá). */
export interface FsHam {
  doiTen(tu: string, den: string): void;
  xoa(p: string): void;
  co(p: string): boolean;
  ghiThu(p: string): void;
  ngu(ms: number): void;
  /** 2.6.1: đọc file chữ (file kết quả chạy thử) — ném nếu không có. */
  docChu(p: string): string;
}

export const FS_THAT: FsHam = {
  doiTen: (tu, den) => fs.renameSync(tu, den),
  xoa: p => fs.rmSync(p, { force: true }),
  co: p => fs.existsSync(p),
  ghiThu: p => fs.writeFileSync(p, 'x', { flag: 'wx' }),
  ngu: ms => Bun.sleepSync(ms),
  docChu: p => fs.readFileSync(p, 'utf8'),
};

/** Đổi tên, thử lại 6 lần × 300 ms khi file bị khoá (phần mềm diệt virus đang quét, tiến trình vừa thoát còn giữ file). */
function doiTenThuLai(h: FsHam, tu: string, den: string): void {
  for (let lan = 0; ; lan++) {
    try { h.doiTen(tu, den); return; } catch (e) { if (lan >= 5) throw e; h.ngu(300); }
  }
}

/** Chỉ cập nhật bản BeeftownCan.exe đóng gói, chạy trên Windows — không phải `bun src/main.ts`. */
export function laBanDongGoi(execPath: string, platform: string): boolean {
  if (platform !== 'win32') return false;
  const ten = path.win32.basename(execPath).toLowerCase();
  return ten.endsWith('.exe') && ten !== 'bun.exe' && ten !== 'bunx.exe';
}

/** Thư mục chứa chương trình có ghi được không — thử TRƯỚC khi tải (Program Files, USB chỉ đọc…). */
export function thuGhiThuMuc(t: CacTep, h: FsHam = FS_THAT): void {
  try { if (h.co(t.tepThuGhi)) h.xoa(t.tepThuGhi); h.ghiThu(t.tepThuGhi); h.xoa(t.tepThuGhi); }
  catch {
    throw new LoiCapNhat(`Không ghi được vào thư mục ${t.thuMuc} (chương trình nằm trong Program Files hay USB chỉ đọc?). `
      + 'Chép BeeftownCan.exe ra Desktop rồi mở từ đó, hoặc tải bằng tay ở trang Releases.' + CHUA_DOI);
  }
}

/**
 * Đặt bản mới (đã tải, đã kiểm ở `tepDangTai`) vào chỗ file đang chạy. Đồng bộ từ đầu đến cuối (không hẹn giờ nào
 * chen vào giữa hai lần đổi tên). File bị khoá (phần mềm diệt virus đang quét) → thử lại 5 lần × 300 ms; vẫn hỏng thì
 * đổi ngược lại, LoiCapNhat "Chưa đổi gì".
 */
export function doiTep(t: CacTep, h: FsHam = FS_THAT): void {
  const boTai = () => { try { h.xoa(t.tepDangTai); } catch { /* lần sau donSauCapNhat xoá */ } };
  if (h.co(t.tepCu)) {
    try { h.xoa(t.tepCu); }
    catch { boTai(); throw new LoiCapNhat(`Không xoá được bản dự phòng cũ ${path.basename(t.tepCu)} (đang mở?).${CHUA_DOI}`); }
  }
  try { h.doiTen(t.tepChay, t.tepCu); }
  catch { boTai(); throw new LoiCapNhat('Không đổi tên được file chương trình đang chạy.' + CHUA_DOI); }
  try { doiTenThuLai(h, t.tepDangTai, t.tepChay); return; } catch { /* đổi ngược lại bên dưới */ }
  try { h.doiTen(t.tepCu, t.tepChay); }
  catch {
    throw new LoiCapNhat(`Không đặt lại được file — vào thư mục ${t.thuMuc}, đổi tên ${path.basename(t.tepCu)} thành `
      + `${path.basename(t.tepChay)} rồi mở lại.`);
  }
  boTai();
  throw new LoiCapNhat('Không đặt được bản mới vào chỗ (file đang bị khoá, có thể do phần mềm diệt virus).' + CHUA_DOI);
}

/** Bản mới không mở được: bản mới → `.loi.exe`, bản cũ về chỗ. Thử lại vài lần (tiến trình vừa bị tắt còn giữ file). */
export function hoanTac(t: CacTep, h: FsHam = FS_THAT): void {
  let loi: unknown = null;
  for (let lan = 0; lan < 6; lan++) {
    try {
      if (h.co(t.tepChay)) {
        if (h.co(t.tepLoi)) h.xoa(t.tepLoi);
        h.doiTen(t.tepChay, t.tepLoi);
      }
      h.doiTen(t.tepCu, t.tepChay);
      return;
    } catch (e) { loi = e; h.ngu(500); }
  }
  throw loi;
}

/** Lúc khởi động: dọn file tải dở, file thử ghi, file chạy thử. Giữ `.cu.exe` (quay về bằng tay) và `.loi.exe` (để xem). */
export function donSauCapNhat(t: CacTep, h: FsHam = FS_THAT): void {
  for (const p of [t.tepDangTai, t.tepThuGhi, t.tepChayThu, t.fileChayThu]) { try { if (h.co(p)) h.xoa(p); } catch { /* lần sau */ } }
}

// -----------------------------------------------------------------------------
// CHẠY THỬ BẢN MỚI TRƯỚC KHI ĐỔI FILE (2.6.1)
// -----------------------------------------------------------------------------
/**
 * Chạy `tep` (chờ nó tự thoát, tối đa `choMs`) với biến môi trường BEEFTOWN_CAN_THU_CHAY = `fileKetQua`. Bản 2.6.1 trở
 * lên thấy biến đó thì chỉ ghi phiên bản của nó vào file rồi thoát (main.ts) — không mở máy chủ, không đụng dữ liệu.
 */
export type ChayThu = (tep: string, fileKetQua: string, choMs: number) => Promise<void>;

/**
 * Chạy và CHỜ tiến trình thoát (khác LENH_KHOI_DONG: mở rồi thôi). UseShellExecute = false để tiến trình con nhận biến
 * môi trường BEEFTOWN_CAN_THU_CHAY của PowerShell (chayPs đặt). Quá giờ → tắt nó, báo "het-gio".
 */
export const LENH_CHAY_THU = khung(String.raw`  $si = New-Object System.Diagnostics.ProcessStartInfo
  $si.FileName = $env:BT_TEP
  $si.WorkingDirectory = $env:BT_THU_MUC
  $si.UseShellExecute = $false
  $p = [System.Diagnostics.Process]::Start($si)
  if ($p.WaitForExit([int]$env:BT_CHO_MS)) { 'OK' + [char]9 + $p.ExitCode }
  else { try { $p.Kill() } catch {}; 'LOI' + [char]9 + 'het-gio' + [char]9 + 'quá ' + [int]($env:BT_CHO_MS / 1000) + ' giây chưa xong' }`);

export function chayThuQuaPowerShell(chayPs: ChayPs): ChayThu {
  return async (tep, fileKetQua, choMs) => {
    let ra: string;
    try {
      ra = await chayPs(LENH_CHAY_THU, { BT_TEP: tep, BT_THU_MUC: path.dirname(tep), BT_CHO_MS: String(choMs), BEEFTOWN_CAN_THU_CHAY: fileKetQua },
        choMs + 30_000);
    } catch (e) {
      // chayPowerShell viết câu quá giờ cho dây RS232 ("Rút dây ra cắm lại") — ở đây nói đúng việc đang làm.
      const cau = (e as Error).message;
      throw new LoiCapNhat(/Quá lâu không xong/.test(cau) ? `quá ${Math.round((choMs + 30_000) / 1000)} giây chưa xong`
        : `PowerShell không chạy được: ${cau}`);
    }
    if (/^﻿?OK\t/m.test(ra)) return;
    throw new LoiCapNhat(/^﻿?LOI\t[^\t]*\t(.*)$/m.exec(ra)?.[1] ?? 'PowerShell không trả lời');
  };
}

/**
 * 2.6.1 — bản mới đã tải và kiểm (ở `tepDangTai`): chạy thử nó một lần TRƯỚC khi đổi file, lúc bản cũ còn chạy. Bản
 * 2.5 → 2.6 ở quán (03/10/2026): bản mới mở sau khi đổi file mà 90 giây không trả lời nên tự quay về — mở tay thì được.
 * Lần chạy đầu một file .exe lạ 80 MB, phần mềm diệt virus có thể giữ để quét lâu hay chặn hẳn; chạy thử ở đây:
 *   - cho phần mềm diệt virus quét xong trước (lần mở thật sau đó nhanh);
 *   - bị chặn / hỏng → báo ngay, CHƯA ĐỔI GÌ (bản cũ vẫn chạy, không phải tắt rồi quay về), file để ở `.loi.exe`.
 * Đúng khi file kết quả ghi đúng phiên bản của phiếu. Trả số mili giây chạy thử mất (ghi vào loi.txt để biết máy chậm).
 * Bản mới chưa có chế độ chạy thử (2.6.0 trở về trước) thì không ghi file → coi là hỏng: không bao giờ hạ phiên bản
 * nên chuyện này không xảy ra.
 */
export async function chayThuBanMoi(o: { t: CacTep; phienBan: string; chayThu: ChayThu; choMs: number; fsHam?: FsHam }): Promise<number> {
  const h = o.fsHam ?? FS_THAT;
  const boHet = () => { for (const p of [o.t.tepChayThu, o.t.tepDangTai]) { try { if (h.co(p)) h.xoa(p); } catch { /* donSauCapNhat lần sau */ } } };
  for (const p of [o.t.tepChayThu, o.t.fileChayThu]) {
    try { if (h.co(p)) h.xoa(p); }
    catch { boHet(); throw new LoiCapNhat(`Không xoá được file chạy thử cũ ${path.basename(p)} (đang mở?).${CHUA_DOI}`); }
  }
  try { doiTenThuLai(h, o.t.tepDangTai, o.t.tepChayThu); }
  catch { boHet(); throw new LoiCapNhat(`Không đặt được bản mới để chạy thử (file đang bị khoá, có thể do phần mềm diệt virus).${CHUA_DOI}`); }
  const batDau = Date.now();
  let loi: string | null = null;
  try { await o.chayThu(o.t.tepChayThu, o.t.fileChayThu, o.choMs); } catch (e) { loi = (e as Error).message; }
  let phienBan: unknown = null;
  try { phienBan = (JSON.parse(h.docChu(o.t.fileChayThu)) as { phienBan?: unknown }).phienBan; } catch { /* không có / hỏng */ }
  try { h.xoa(o.t.fileChayThu); } catch { /* donSauCapNhat xoá lần sau */ }
  if (phienBan === o.phienBan) {
    // Tiến trình vừa thoát / phần mềm diệt virus quét sau khi chạy còn giữ file một lúc: thử lại như doiTep.
    try { doiTenThuLai(h, o.t.tepChayThu, o.t.tepDangTai); }
    catch { boHet(); throw new LoiCapNhat(`Chạy thử bản ${o.phienBan} được nhưng không đặt lại được file (đang bị khoá) — bấm Cập nhật lần nữa.${CHUA_DOI}`); }
    return Date.now() - batDau;
  }
  // Giữ bản mới để xem (như khi quay về sau khi đổi file): .loi.exe — chỉ thay .loi.exe cũ khi đặt được bản mới vào.
  let daGiu = false;
  try { if (h.co(o.t.tepLoi)) h.xoa(o.t.tepLoi); doiTenThuLai(h, o.t.tepChayThu, o.t.tepLoi); daGiu = true; }
  catch { boHet(); }
  const lyDo = loi ?? (phienBan === null ? 'không ghi được phiên bản' : `ghi phiên bản ${String(phienBan).slice(0, 20)}`);
  throw new LoiCapNhat(`Bản ${o.phienBan} tải về đúng nhưng chạy thử trên máy này không được (${lyDo.replace(/[.\s]+$/, '')}) — thường do phần mềm `
    + `diệt virus chặn file mới. ${daGiu ? `File để ở ${path.basename(o.t.tepLoi)} cạnh chương trình` : 'Không giữ lại được file (đang bị khoá)'}; `
    + `báo cho người lo phần mềm.${CHUA_DOI}`);
}

// -----------------------------------------------------------------------------
// KHỞI ĐỘNG LẠI
// -----------------------------------------------------------------------------
/** Mở một file chạy tách khỏi chương trình này (sống tiếp khi chương trình thoát) — trả số tiến trình. */
export type KhoiDong = (tep: string, thamSo: string, thuMuc: string) => Promise<number>;

/**
 * Mở qua PowerShell bằng .NET Process.Start: tiến trình mới là cháu (qua PowerShell), không thuộc chương trình cũ nên
 * không tắt theo. Tham số qua biến môi trường — đường dẫn có dấu cách, chữ có dấu không cần ngoặc kép; không dùng
 * Start-Process vì nó đọc đường dẫn như mẫu ký tự đại diện (thư mục tên có [ ] thì không tìm thấy file).
 */
export const LENH_KHOI_DONG = khung(String.raw`  $si = New-Object System.Diagnostics.ProcessStartInfo
  $si.FileName = $env:BT_TEP
  $si.Arguments = $env:BT_THAM
  $si.WorkingDirectory = $env:BT_THU_MUC
  $si.UseShellExecute = $true
  $p = [System.Diagnostics.Process]::Start($si)
  'OK' + [char]9 + $p.Id`);

export function khoiDongQuaPowerShell(chayPs: ChayPs): KhoiDong {
  return async (tep, thamSo, thuMuc) => {
    let ra: string;
    try { ra = await chayPs(LENH_KHOI_DONG, { BT_TEP: tep, BT_THAM: thamSo, BT_THU_MUC: thuMuc }, 30_000); }
    catch (e) { throw new LoiCapNhat(`Không mở được bản mới: ${(e as Error).message}`); }
    const pid = /^﻿?OK\t(\d+)/m.exec(ra)?.[1];
    if (!pid) throw new LoiCapNhat(`Không mở được bản mới: ${/^﻿?LOI\t[^\t]*\t(.*)$/m.exec(ra)?.[1] ?? 'PowerShell không trả lời'}`);
    return Number(pid);
  };
}

/** Tham số `--vua-cap-nhat=2.5.0` / `--cap-nhat-hong=2.6.0` của lần mở sau khi cập nhật (null nếu không có / sai dạng). */
export function docThamSoPhienBan(argv: string[], dau: string): string | null {
  const v = argv.find(a => a.startsWith(dau))?.slice(dau.length) ?? '';
  return LA_PHIEN_BAN.test(v) ? v : null;
}

/** Khoá "đang cập nhật" còn hạn không (main.ts: người mở tay giữa lúc khởi động lại thì chờ, không chạy thêm bản). */
export function khoaCapNhatConHan(fileKhoa: string, bayGio = Date.now()): boolean {
  try {
    const d = JSON.parse(fs.readFileSync(fileKhoa, 'utf8')) as { den?: unknown };
    return typeof d.den === 'number' && d.den > bayGio;
  } catch { return false; }
}

/**
 * Câu chỉ cách quay về bằng tay, theo đúng những file ĐANG có (không đoán): còn bản cũ (.cu.exe) và file đang chạy →
 * đổi tên cả hai; chỉ còn bản cũ → đổi bản cũ về tên chính; bản cũ đã về chỗ → chỉ cần mở lại.
 */
export function cauQuayVeBangTay(t: CacTep, h: FsHam = FS_THAT): string {
  const chay = path.basename(t.tepChay), cu = path.basename(t.tepCu), loi = path.basename(t.tepLoi);
  if (h.co(t.tepCu) && h.co(t.tepChay)) {
    return `Vào thư mục ${t.thuMuc}: đổi tên ${chay} thành ${h.co(t.tepLoi) ? path.basename(t.tepChay).replace(/\.exe$/i, '.moi.exe') : loi}, `
      + `rồi đổi ${cu} thành ${chay}, rồi mở ${chay}.`;
  }
  if (h.co(t.tepCu)) return `Vào thư mục ${t.thuMuc}: đổi tên ${cu} thành ${chay}, rồi mở ${chay}.`;
  return `Mở lại ${chay} (thư mục ${t.thuMuc}).`;
}

/**
 * Sau khi bản mới đã vào chỗ (doiTep xong): dừng máy chủ cũ, xoá dang-chay.json, mở bản mới, chờ nó ghi
 * dang-chay.json với phiên bản mới và trả lời /api/nhip.
 *   - THỨ TỰ quan trọng: dang-chay.json còn trỏ tới máy chủ cũ đang sống thì bản mới tưởng "đã có bản đang chạy",
 *     mở cửa sổ tới máy chủ cũ rồi thoát — máy chủ cũ thoát ngay sau, không còn gì chạy.
 *   - `fileKhoa` (hạn choMs + 30 giây) ghi TRƯỚC khi mở bản mới, xoá khi xong: người bấm mở chương trình trong lúc chờ
 *     thì main.ts báo chờ và thoát — không có hai bản cùng chạy (hai bản cùng tự gửi xuống cân).
 *   - Bản mới không trả lời trong `choMs` (bị chặn, bị hỏng) → tắt nó, hoanTac, mở lại bản cũ với
 *     `--cap-nhat-hong=<bản mới>` → 'quay-ve'; bản cũ đã về chỗ mà không mở lại được → 'quay-ve-chua-mo'; không quay
 *     về được → 'hong'. Hai trường hợp sau main.ts báo cauQuayVeBangTay.
 */
export async function khoiDongLaiSauCapNhat(o: {
  dungMayChu: () => Promise<void> | void; fileDangChay: string; fileKhoa: string; t: CacTep; phienBanMoi: string; phienBanCu: string;
  khoiDong: KhoiDong; diet: (pid: number) => void; fetch: typeof fetch; choMs: number; fsHam?: FsHam; nghiMs?: number;
  /** 2.6.1: tiến trình còn sống không (lúc hết giờ chờ) — để ghi lý do. */
  conChay?: (pid: number) => boolean;
  /** 2.6.1: bản mới không mở được → câu lý do (main.ts ghi vào loi.txt). */
  ghiLyDo?: (cau: string) => void;
}): Promise<'da-mo' | 'quay-ve' | 'quay-ve-chua-mo' | 'hong'> {
  try { await o.dungMayChu(); } catch { /* máy chủ đã dừng */ }
  try { fs.rmSync(o.fileDangChay, { force: true }); } catch { /* máy chủ cũ đã dừng: bản mới không trả lời được thay nó */ }
  try { fs.writeFileSync(o.fileKhoa, JSON.stringify({ den: Date.now() + o.choMs + 30_000 }), 'utf8'); } catch { /* không khoá được: vẫn tiếp */ }
  try { return await khoiDongVaCho(o); }
  finally { try { fs.rmSync(o.fileKhoa, { force: true }); } catch { /* hết hạn tự bỏ */ } }
}

async function khoiDongVaCho(o: Parameters<typeof khoiDongLaiSauCapNhat>[0]): Promise<'da-mo' | 'quay-ve' | 'quay-ve-chua-mo' | 'hong'> {
  let pid: number | null = null;
  const ghi = (cau: string) => { try { o.ghiLyDo?.(cau); } catch { /* không ghi được thì thôi */ } };
  try {
    pid = await o.khoiDong(o.t.tepChay, `--vua-cap-nhat=${o.phienBanCu}`, o.t.thuMuc);
    const han = Date.now() + o.choMs;
    while (Date.now() < han) {
      await Bun.sleep(o.nghiMs ?? 500);
      try {
        const d = JSON.parse(fs.readFileSync(o.fileDangChay, 'utf8')) as { cong?: unknown; ma?: unknown; phienBan?: unknown };
        if (d.phienBan !== o.phienBanMoi || !Number.isInteger(d.cong) || typeof d.ma !== 'string') continue;
        const r = await o.fetch(`http://127.0.0.1:${d.cong}/api/nhip?t=${d.ma}`, { method: 'POST', signal: AbortSignal.timeout(1500) });
        if (r.ok) return 'da-mo';
      } catch { /* chưa có — chờ tiếp */ }
    }
    let conChay: boolean | null = null;
    try { conChay = o.conChay ? o.conChay(pid) : null; } catch { conChay = null; }
    ghi(`Bản ${o.phienBanMoi} (tiến trình ${pid}) không trả lời trong ${Math.round(o.choMs / 1000)} giây — `
      + (conChay === true ? 'tiến trình vẫn đang chạy (máy chậm, hay phần mềm diệt virus đang quét / giữ file)'
        : conChay === false ? 'tiến trình đã tắt (bị chặn hay lỗi lúc mở — xem các dòng ngay trước trong loi.txt)' : 'không rõ tiến trình còn chạy không')
      + `. Quay về bản ${o.phienBanCu}.`);
  } catch (e) { ghi(`Không mở được bản ${o.phienBanMoi}: ${(e as Error).message}. Quay về bản ${o.phienBanCu}.`); }
  if (pid !== null) { try { o.diet(pid); } catch { /* đã tắt */ } }
  try { hoanTac(o.t, o.fsHam); } catch { return 'hong'; }
  try { await o.khoiDong(o.t.tepChay, `--cap-nhat-hong=${o.phienBanMoi}`, o.t.thuMuc); return 'quay-ve'; }
  catch { return 'quay-ve-chua-mo'; }
}

// -----------------------------------------------------------------------------
// CHỮ HIỆN
// -----------------------------------------------------------------------------
/** 89_456_123 byte → "85,3 MB" (dấu phẩy thập phân kiểu Việt). */
export const moTaMb = (byte: number) => `${(byte / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;

/** Ngày phát hành theo giờ Việt Nam: '2026-09-29T17:10:00Z' → '30/09/2026'. */
export function ngayPhatHanhVn(iso: string): string {
  const d = homNayVn(Date.parse(iso));
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}
