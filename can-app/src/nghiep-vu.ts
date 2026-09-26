/**
 * BEEFTOWN CÂN — PHẦN VIỆC (không có giao diện, kiểm thử bằng test/thu.ts)
 *
 * Nối thẳng kho Beeftown với cân in tem TM-A qua WiFi:
 *   kho (Supabase, đăng nhập bằng tài khoản quản lý)
 *     → danh mục mặt hàng (mã cân, tên, giá bán/kg)
 *     → lapKeHoach / ghiFileCan — ĐÚNG code của màn Đồng bộ cân (web/src/lib/kho/can-tma.ts)
 *     → gửi file vào cổng TCP 33571 của cân.
 *
 * ĐIỀU ĐÃ THỬ TRÊN CÂN THẬT (26/09/2026, TM-xA V3.14E8):
 *   · Cân nhận ở cổng 33571, nội dung y như file USB A_000.TMS.
 *   · Qua WiFi cân chỉ THÊM và SỬA dòng PLU, không xoá dòng vắng mặt.
 *     Nạp USB thì cân thay cả danh sách.
 * Vì vậy chương trình giữ hai thứ trong thư mục Tài liệu › Beeftown Can
 * (dùng chung với Nap-Can-WiFi.ps1):
 *   A_000.TMS     file gốc: bản gần nhất đã nạp vào cân — cột và phần khác
 *                 của cân (mẫu tem, mã vạch...) được giữ nguyên từ file này.
 *   tren-can.tsv  các dòng PLU đang nằm trên cân, kể cả dòng đã bỏ khỏi kho
 *                 mà WiFi không xoá được → hiện thành "còn nằm trên cân".
 *
 * File .TMS có tên và mật khẩu WiFi của quán: chỉ ghi trên máy này và gửi tới
 * cân, không gửi lên kho hay đi đâu khác.
 */
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  docFileCan, ghiFileCan, lapKeHoach, soChuSoMa, LoiFileCan,
  type DongKeHoach, type FileCan, type HangKho, type LoaiDong,
} from '../../web/src/lib/kho/can-tma.ts';
import { docCaiDat, docMatHang } from '../../web/src/lib/kho/danh-muc.ts';
import { QUYEN_KHO } from '../../web/src/lib/kho/chung.ts';

// -----------------------------------------------------------------------------
// THƯ MỤC, CẤU HÌNH
// -----------------------------------------------------------------------------
export interface DuongDan {
  /** %APPDATA%\BeeftownCan — cấu hình, phiên đăng nhập. */
  cauHinh: string;
  /** Tài liệu\Beeftown Can — file gốc, tren-can.tsv, bản đã gửi. */
  duLieu: string;
}

/** Thư mục Tài liệu thật (OneDrive có thể dời nó đi) — hỏi Windows bằng UTF-8. */
function thuMucTaiLieu(): string {
  if (process.platform === 'win32') {
    try {
      const ra = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
        "[Console]::OutputEncoding=[Text.Encoding]::UTF8; [Environment]::GetFolderPath('MyDocuments')"],
        { encoding: 'utf8', windowsHide: true, timeout: 15000 }).trim();
      if (ra && fs.existsSync(ra)) return ra;
    } catch { /* dùng thư mục mặc định bên dưới */ }
  }
  return path.join(os.homedir(), 'Documents');
}

export function duongDanMacDinh(): DuongDan {
  const appData = process.env.APPDATA;
  return {
    cauHinh: appData ? path.join(appData, 'BeeftownCan') : path.join(os.homedir(), '.beeftown-can'),
    duLieu: path.join(thuMucTaiLieu(), 'Beeftown Can'),
  };
}

export interface CauHinh {
  ipCan: string;
  congCan: number;
  diaChiKho: string;
  supabaseUrl?: string;
  anonKey?: string;
  chiNhanhId?: string;
}

const CAU_HINH_MAC_DINH: CauHinh = { ipCan: '192.168.1.22', congCan: 33571, diaChiKho: 'https://beeftown.vn' };

function docJson<T>(file: string, macDinh: T): T {
  try { return { ...macDinh, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch { return macDinh; }
}
function ghiJson(file: string, v: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(v, null, 2), 'utf8');
}

// -----------------------------------------------------------------------------
// GỬI XUỐNG CÂN
// -----------------------------------------------------------------------------
export class LoiCan extends Error {}

const GOI_Y_KET_NOI = (ip: string, cong: number) =>
  `Không kết nối được cân ở ${ip} (cổng ${cong}). Cân có đang bật, ở màn hình bán hàng không? ` +
  'Máy tính có cùng WiFi với cân không (không dùng WiFi khách)? Địa chỉ cân có đổi không — ' +
  'trên cân bấm Prog → 4 → 2 để xem, rồi sửa ở mục Cài đặt.';

/**
 * Gửi nguyên nội dung file vào cân, đóng chiều gửi (cân coi đó là "đã gửi
 * hết"), rồi chờ cân đóng kết nối — tối đa `choMs`. Cân không trả lời gì.
 */
export function guiTcp(ip: string, cong: number, du: Uint8Array, choMs = 15000): Promise<void> {
  return new Promise((xong, hong) => {
    const s = net.createConnection({ host: ip, port: cong });
    let daNoi = false, daGuiHet = false, ket = false;
    let hen: ReturnType<typeof setTimeout>;
    const dung = (loi?: Error) => {
      if (ket) return;
      ket = true;
      clearTimeout(hen);
      s.destroy();
      if (loi) hong(loi); else xong();
    };
    hen = setTimeout(() => dung(new LoiCan(GOI_Y_KET_NOI(ip, cong))), 5000);
    s.once('connect', () => {
      daNoi = true;
      clearTimeout(hen);
      hen = setTimeout(() => dung(daGuiHet ? undefined : new LoiCan('Cân nhận dữ liệu quá chậm. Gửi lại.')), choMs);
      s.end(Buffer.from(du), () => { daGuiHet = true; });
    });
    s.on('data', () => { /* cân không trả lời gì; bỏ qua nếu có */ });
    s.once('error', (e) => dung(daNoi && daGuiHet ? undefined : new LoiCan(daNoi ? `Mất kết nối với cân khi đang gửi (${e.message}). Gửi lại.` : GOI_Y_KET_NOI(ip, cong))));
    s.once('close', () => dung(daNoi && daGuiHet ? undefined : new LoiCan(daNoi ? 'Cân đóng kết nối trước khi nhận hết. Gửi lại.' : GOI_Y_KET_NOI(ip, cong))));
  });
}

/** Chỉ mở rồi đóng kết nối — không gửi gì. */
export function thuKetNoi(ip: string, cong: number, choMs = 4000): Promise<boolean> {
  return new Promise((kq) => {
    const s = net.createConnection({ host: ip, port: cong });
    const hen = setTimeout(() => { s.destroy(); kq(false); }, choMs);
    s.once('connect', () => { clearTimeout(hen); s.destroy(); kq(true); });
    s.once('error', () => { clearTimeout(hen); kq(false); });
  });
}

// -----------------------------------------------------------------------------
// TRÊN CÂN ĐANG CÓ GÌ (tren-can.tsv — cùng dạng với Nap-Can-WiFi.ps1)
// -----------------------------------------------------------------------------
export interface HangTrenCan { so: number; ma: string; gia: string; ten: string }

function hangTuFile(f: FileCan): Map<number, HangTrenCan> {
  const m = new Map<number, HangTrenCan>();
  for (const p of f.plu) m.set(p.so, { so: p.so, ma: p.ma, gia: p.cot[5] ?? '', ten: p.ten });
  return m;
}

// -----------------------------------------------------------------------------
// NGUỒN DANH MỤC
// -----------------------------------------------------------------------------
export interface DanhMucKho { matHang: HangKho[]; mauMaVach: string | null }
export interface NguoiDung {
  email: string; hoTen: string; vaiTro: string;
  chiNhanh: { id: string; ma: string; ten: string } | null;
  cacChiNhanh: { id: string; ma: string; ten: string }[];
}

type DongGuiVe = Omit<DongKeHoach, 'goc'>;
export interface XemTruoc {
  dong: DongGuiVe[];
  dem: Record<LoaiDong, number>;
  /** Dòng đang nằm trên cân mà file mới không có — WiFi không xoá được. */
  conLai: HangTrenCan[];
  soHangSauKhiGui: number;
  coThayDoi: boolean;
  phienBanCan: string;
}

// -----------------------------------------------------------------------------
// ỨNG DỤNG
// -----------------------------------------------------------------------------
export class UngDung {
  readonly fileCauHinh: string;
  readonly filePhien: string;
  readonly fileGoc: string;
  readonly fileTrenCan: string;
  readonly thuMucDaGui: string;
  readonly fileChoUsb: string;
  private client: SupabaseClient | null = null;

  constructor(
    readonly dd: DuongDan,
    private readonly phu: {
      gui?: typeof guiTcp;
      thu?: typeof thuKetNoi;
      /** Kiểm thử: thay kho thật bằng danh mục cho sẵn. */
      danhMuc?: () => Promise<DanhMucKho>;
      fetch?: typeof fetch;
    } = {},
  ) {
    this.fileCauHinh = path.join(dd.cauHinh, 'cau-hinh.json');
    this.filePhien = path.join(dd.cauHinh, 'phien.json');
    this.fileGoc = path.join(dd.duLieu, 'A_000.TMS');
    this.fileTrenCan = path.join(dd.duLieu, 'tren-can.tsv');
    this.thuMucDaGui = path.join(dd.duLieu, 'da-gui');
    this.fileChoUsb = path.join(dd.duLieu, 'cho-usb', 'A_000.TMS');
  }

  // ---- cấu hình --------------------------------------------------------------
  cauHinh(): CauHinh { return docJson(this.fileCauHinh, CAU_HINH_MAC_DINH); }

  luuCauHinh(moi: Partial<CauHinh>): CauHinh {
    const cu = this.cauHinh();
    const ip = String(moi.ipCan ?? cu.ipCan).trim();
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) throw new LoiCan('Địa chỉ cân phải có dạng 192.168.1.22.');
    const cong = Number(moi.congCan ?? cu.congCan);
    if (!Number.isInteger(cong) || cong < 1 || cong > 65535) throw new LoiCan('Cổng của cân là một số, thường là 33571.');
    let kho = String(moi.diaChiKho ?? cu.diaChiKho).trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(kho)) kho = 'https://' + kho;
    const doiKho = kho !== cu.diaChiKho;
    const kq: CauHinh = {
      ...cu, ipCan: ip, congCan: cong, diaChiKho: kho,
      ...(moi.chiNhanhId !== undefined ? { chiNhanhId: moi.chiNhanhId || undefined } : {}),
    };
    if (doiKho) { delete kq.supabaseUrl; delete kq.anonKey; this.client = null; }
    ghiJson(this.fileCauHinh, kq);
    return kq;
  }

  // ---- đăng nhập kho ---------------------------------------------------------
  private async layClient(): Promise<SupabaseClient> {
    if (this.client) return this.client;
    let ch = this.cauHinh();
    if (!ch.supabaseUrl || !ch.anonKey) {
      const f = this.phu.fetch ?? fetch;
      let r: Response;
      try { r = await f(`${ch.diaChiKho}/kho-can.json`, { signal: AbortSignal.timeout(15000) }); }
      catch { throw new LoiCan(`Không mở được ${ch.diaChiKho}. Máy tính có vào mạng internet không?`); }
      const j = await r.json().catch(() => ({})) as { supabaseUrl?: string; anonKey?: string };
      if (!r.ok || !j.supabaseUrl || !j.anonKey) {
        throw new LoiCan(`${ch.diaChiKho} chưa có cấu hình cho chương trình cân (cần bản web mới). Kiểm tra lại địa chỉ kho.`);
      }
      ch = { ...ch, supabaseUrl: j.supabaseUrl, anonKey: j.anonKey };
      ghiJson(this.fileCauHinh, ch);
    }
    const file = this.filePhien;
    const kho: Record<string, string> = docJson(file, {});
    // Phiên đăng nhập lưu trong %APPDATA% của máy này — "nhớ đăng nhập".
    const luuTru = {
      getItem: (k: string) => kho[k] ?? null,
      setItem: (k: string, v: string) => { kho[k] = v; ghiJson(file, kho); },
      removeItem: (k: string) => { delete kho[k]; ghiJson(file, kho); },
    };
    this.client = createClient(ch.supabaseUrl!, ch.anonKey!, {
      auth: { storage: luuTru, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
    return this.client;
  }

  async dangNhap(email: string, matKhau: string): Promise<NguoiDung> {
    const c = await this.layClient();
    const { error } = await c.auth.signInWithPassword({ email: email.trim(), password: matKhau });
    if (error) throw new LoiCan('Sai email hoặc mật khẩu.');
    const nd = await this.nguoiDung();
    if (!nd) {
      await c.auth.signOut().catch(() => {});
      throw new LoiCan('Tài khoản này không phải nhân viên đang làm, hoặc không có quyền sửa danh mục (cần quản lý hoặc chủ).');
    }
    return nd;
  }

  async dangXuat() {
    if (this.phu.danhMuc) return;
    const c = await this.layClient();
    await c.auth.signOut().catch(() => {});
    try { fs.rmSync(this.filePhien, { force: true }); } catch { /* không sao */ }
    this.client = null;
  }

  /** Người đang đăng nhập — null nếu chưa, hoặc không đủ quyền danh_muc. */
  async nguoiDung(): Promise<NguoiDung | null> {
    if (this.phu.danhMuc) {
      const cn = { id: 'thu', ma: 'THU', ten: 'Chi nhánh thử' };
      return { email: 'thu@beeftown', hoTen: 'Kiểm thử', vaiTro: 'quan_ly', chiNhanh: cn, cacChiNhanh: [cn] };
    }
    const c = await this.layClient();
    const { data: s } = await c.auth.getSession();
    const u = s.session?.user;
    if (!u) return null;
    const { data: ns } = await c.from('nhan_su')
      .select('id, ho_ten, vai_tro, chi_nhanh_id').eq('auth_uid', u.id).eq('dang_lam', true).maybeSingle();
    if (!ns || !(QUYEN_KHO.danh_muc as readonly string[]).includes(ns.vai_tro)) return null;
    const { data: cns } = await c.from('chi_nhanh').select('id, ma, ten').order('ma');
    const cacChiNhanh = (cns ?? []) as NguoiDung['cacChiNhanh'];
    const chon = ns.chi_nhanh_id ?? this.cauHinh().chiNhanhId;
    const chiNhanh = cacChiNhanh.find(x => x.id === chon) ?? (ns.chi_nhanh_id ? null : cacChiNhanh[0] ?? null);
    return { email: u.email ?? '', hoTen: ns.ho_ten, vaiTro: ns.vai_tro, chiNhanh, cacChiNhanh: ns.chi_nhanh_id ? cacChiNhanh.filter(x => x.id === ns.chi_nhanh_id) : cacChiNhanh };
  }

  private async layDanhMuc(): Promise<DanhMucKho> {
    if (this.phu.danhMuc) return this.phu.danhMuc();
    const nd = await this.nguoiDung();
    if (!nd) throw new LoiCan('Chưa đăng nhập kho, hoặc phiên đăng nhập đã hết. Đăng nhập lại.');
    if (!nd.chiNhanh) throw new LoiCan('Chưa chọn chi nhánh.');
    const c = await this.layClient();
    const [caiDat, matHang] = await Promise.all([docCaiDat(c, nd.chiNhanh.id), docMatHang(c)]);
    return { matHang, mauMaVach: caiDat?.mau_ma_vach ?? null };
  }

  // ---- file gốc và tren-can.tsv ---------------------------------------------
  coFileGoc(): boolean { return fs.existsSync(this.fileGoc); }

  thongTinGoc(): { phienBan: string; soHang: number; luc: string } | null {
    if (!this.coFileGoc()) return null;
    try {
      const f = docFileCan(new Uint8Array(fs.readFileSync(this.fileGoc)));
      return { phienBan: f.phienBan, soHang: f.plu.length, luc: fs.statSync(this.fileGoc).mtime.toISOString() };
    } catch { return null; }
  }

  docTrenCan(): Map<number, HangTrenCan> {
    const m = new Map<number, HangTrenCan>();
    let chu = '';
    try { chu = fs.readFileSync(this.fileTrenCan, 'utf8').replace(/^﻿/, ''); } catch { return m; }
    for (const d of chu.split(/\r?\n/)) {
      const c = d.split('\t');
      const so = Number(c[0]);
      if (c.length >= 4 && Number.isInteger(so) && c[0] !== '') m.set(so, { so, ma: c[1], gia: c[2], ten: c[3] });
    }
    return m;
  }

  private ghiTrenCan(m: Map<number, HangTrenCan>) {
    fs.mkdirSync(this.dd.duLieu, { recursive: true });
    const dong = [...m.values()].sort((a, b) => a.so - b.so).map(h => `${h.so}\t${h.ma}\t${h.gia}\t${h.ten}`);
    fs.writeFileSync(this.fileTrenCan, dong.join('\r\n') + (dong.length ? '\r\n' : ''), 'utf8');
  }

  private luuGoc(du: Uint8Array) {
    fs.mkdirSync(this.thuMucDaGui, { recursive: true });
    fs.writeFileSync(this.fileGoc, du);
    const luc = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    const ten = `${luc.getFullYear()}${p(luc.getMonth() + 1)}${p(luc.getDate())}-${p(luc.getHours())}${p(luc.getMinutes())}${p(luc.getSeconds())}.TMS`;
    fs.writeFileSync(path.join(this.thuMucDaGui, ten), du);
  }

  /** File vừa lưu từ cân ra USB (hoặc vừa nạp bằng USB): cân đang có ĐÚNG file này. */
  ghiNhanFileTuCan(du: Uint8Array): { soHang: number; phienBan: string } {
    const f = docFileCan(du);   // ném LoiFileCan nếu không phải file cân
    this.luuGoc(du);
    this.ghiTrenCan(hangTuFile(f));
    return { soHang: f.plu.length, phienBan: f.phienBan };
  }

  // ---- xem trước, gửi --------------------------------------------------------
  private async dung(giuHangNgoaiKho: boolean) {
    if (!this.coFileGoc()) throw new LoiCan('Chưa có file gốc của cân. Làm bước "Bắt đầu" trước.');
    const goc = docFileCan(new Uint8Array(fs.readFileSync(this.fileGoc)));
    const dm = await this.layDanhMuc();
    const tuy = { giuHangNgoaiKho, giuGioCan: true, soChuSoMa: soChuSoMa(dm.mauMaVach) };
    const kh = lapKeHoach(goc, dm.matHang, tuy, 'vi');
    const du = ghiFileCan(goc, kh, tuy);
    const moi = docFileCan(du);
    const tren = this.docTrenCan();
    const soMoi = new Set(moi.plu.map(p => p.so));
    const conLai = [...tren.values()].filter(h => !soMoi.has(h.so)).sort((a, b) => a.so - b.so);
    return { goc, kh, du, moi, tren, conLai };
  }

  async xemTruoc(giuHangNgoaiKho = false): Promise<XemTruoc> {
    const { goc, kh, moi, conLai } = await this.dung(giuHangNgoaiKho);
    return {
      dong: kh.dong.map(({ goc: _bo, ...d }) => d),
      dem: kh.dem, conLai, soHangSauKhiGui: moi.plu.length, coThayDoi: kh.coThayDoi || conLai.length > 0,
      phienBanCan: goc.phienBan,
    };
  }

  async guiXuongCan(giuHangNgoaiKho = false): Promise<{ soHang: number; conLai: HangTrenCan[] }> {
    const { du, moi, tren } = await this.dung(giuHangNgoaiKho);
    const ch = this.cauHinh();
    await (this.phu.gui ?? guiTcp)(ch.ipCan, ch.congCan, du);
    // Cân chỉ thêm / sửa: dòng cũ vẫn nằm lại.
    for (const [so, h] of hangTuFile(moi)) tren.set(so, h);
    this.luuGoc(du);
    this.ghiTrenCan(tren);
    const soMoi = new Set(moi.plu.map(p => p.so));
    return { soHang: moi.plu.length, conLai: [...tren.values()].filter(h => !soMoi.has(h.so)) };
  }

  /** Dựng file để nạp bằng USB (cân sẽ thay cả danh sách → xoá được hàng). */
  async taoFileUsb(giuHangNgoaiKho = false): Promise<{ duongDan: string; soHang: number }> {
    const { du, moi } = await this.dung(giuHangNgoaiKho);
    fs.mkdirSync(path.dirname(this.fileChoUsb), { recursive: true });
    fs.writeFileSync(this.fileChoUsb, du);
    return { duongDan: this.fileChoUsb, soHang: moi.plu.length };
  }

  /** Đã nạp file cho-usb vào cân bằng USB → cân có đúng file đó. */
  daNapUsb(): { soHang: number } {
    if (!fs.existsSync(this.fileChoUsb)) throw new LoiCan('Chưa có file nạp USB. Bấm "Lưu file để nạp USB" trước.');
    const kq = this.ghiNhanFileTuCan(new Uint8Array(fs.readFileSync(this.fileChoUsb)));
    fs.rmSync(this.fileChoUsb, { force: true });
    return { soHang: kq.soHang };
  }

  async thuCan(): Promise<boolean> {
    const ch = this.cauHinh();
    return (this.phu.thu ?? thuKetNoi)(ch.ipCan, ch.congCan);
  }
}

/** Câu lỗi cho người dùng — lỗi lạ thì nói chung chung, không lộ chi tiết kỹ thuật. */
export function cauLoi(e: unknown): string {
  if (e instanceof LoiCan || e instanceof LoiFileCan) return e.message;
  const m = e instanceof Error ? e.message : String(e);
  if (/fetch|network|ENOTFOUND|ECONNREFUSED|timed? ?out/i.test(m)) return 'Mất kết nối mạng. Kiểm tra internet rồi thử lại.';
  if (/JWT|refresh|session/i.test(m)) return 'Phiên đăng nhập đã hết. Đăng nhập lại.';
  return `Có lỗi: ${m}`;
}
