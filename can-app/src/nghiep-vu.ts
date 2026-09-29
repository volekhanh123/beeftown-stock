/**
 * BEEFTOWN CÂN — PHẦN VIỆC (không có giao diện, kiểm thử bằng test/thu.ts)
 *
 * Ba việc với cân: gửi danh mục kho xuống cân · xem tất cả hàng trên cân
 * (tatCaHang) · chỉnh mẫu tem (tem, guiTem, taoFileUsbTem — cách đọc tem ở
 * tem.ts). Và máy quầy (0054, phần tính ở quay.ts): bảng quầy, tạo yêu cầu lấy
 * hàng / phiếu huỷ, tảng & ô mã, mã giảm giá, báo cáo bán.
 *
 * Đăng nhập theo vai: mọi vai kho (xem) dùng được thẻ Quầy, Tảng & ô, xem mã
 * giảm; gửi xuống cân, sửa tem, tạo mã giảm cần danh_muc (quản lý, chủ); báo
 * cáo có doanh thu cần xem_gia.
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
 *   tem-da-tat.json  các ô đã tắt trên mẫu tem, để bật lại được (xem tem.ts).
 *
 * Cân đổi địa chỉ (router phát lại): nối không được thì dò WiFi tìm cân
 * (tim-can.ts), thấy đúng một cân thì dùng địa chỉ mới và gửi lại (guiDenCan).
 * Dây RS232 mới có phần gửi thử (day-rs232.ts) — chưa biết cân có nhận qua dây.
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
  docFileCan, ghiFileCan, giaTuFile, lapKeHoach, soChuSoMa, LoiFileCan,
  type DongKeHoach, type FileCan, type HangKho, type KeHoach, type LoaiDong,
} from '../../web/src/lib/kho/can-tma.ts';
import { LoiTem, phimTat, suaTem, xemTem, type DaTat, type TemXem, type ThayDoiTem } from './tem.ts';
import { LA_IP, layMac, thuKetNoi, timCan as doTimCan, type KetQuaTim, type MangMay } from './tim-can.ts';
import { LoiDay, dsCongCom, giayDay, guiCom, kiemCom, ngheCom, tomTatNghe, type ChayPs, type CongCom } from './day-rs232.ts';
import { docCaiDat, docMatHang } from '../../web/src/lib/kho/danh-muc.ts';
import { hangChoCan } from '../../web/src/lib/kho/danh-muc-can.ts';
import { QUYEN_KHO, cauLoiKho, duoc } from '../../web/src/lib/kho/chung.ts';
import { taiAnh } from '../../web/src/lib/kho/anh.ts';
import {
  LoiQuay, dongHuy, dongYeuCau, khoangNgay, tomTatBaoCao, tomTatGiam, tomTatO, tomTatQuay,
  type BangQuay, type BaoCao, type DongBanGio, type DongGiamXem, type DongTang, type MonGiam, type NhomO, type OMaKho, type XemQuay,
} from './quay.ts';

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
  /** Tự gửi xuống cân khi kho đổi (mỗi phút, khi cửa sổ đang mở) — truy vết tảng GĐ3. */
  tuGui?: boolean;
  /** Những lần cân đổi địa chỉ mà chương trình tự tìm ra, mới nhất trước (tối đa 10). */
  doiDiaChi?: DoiDiaChi[];
  /** Mã máy (MAC) của cân đang dùng — cân đổi địa chỉ thì chỉ tự theo khi máy thấy trong WiFi cùng mã. */
  macCan?: string;
  /** Cổng COM và tốc độ chọn lần thử dây RS232 gần nhất. */
  com?: string;
  baud?: number;
}

/** Một lần cân đổi địa chỉ mà chương trình tự tìm ra. */
export interface DoiDiaChi { luc: string; tu: string; den: string }

/** Kết quả dò WiFi tìm cân (nút Kiểm tra kết nối / Tìm cân). */
export interface KetQuaTimCan extends KetQuaTim {
  /** Địa chỉ đang dùng nối được cân. */
  thongCan: boolean;
  /** Địa chỉ đang dùng (sau khi tự đổi, nếu có). */
  ipCan: string;
  /** Lần dò này tự đổi địa chỉ cân. */
  doi: DoiDiaChi | null;
  /** Không nối được: vì sao và làm gì (không thấy cân / thấy nhiều cân). */
  loi: string | null;
}

/** Kết quả lần tự gửi gần nhất (giữ trong bộ nhớ, hiện ở ô Cân). */
export interface LanTuGui { luc: string; daGui: boolean; cau: string }

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
/** Chưa nối được cân — chưa gửi byte nào, nên dò tìm cân rồi gửi lại được. */
export class LoiKhongNoi extends LoiCan {}

const GOI_Y_KET_NOI = (ip: string, cong: number) =>
  `Không kết nối được cân ở ${ip} (cổng ${cong}). Cân có đang bật, ở màn hình bán hàng không? ` +
  'Máy tính có cùng WiFi với cân không (không dùng WiFi khách)? Địa chỉ cân có đổi không — ' +
  'trên cân bấm Prog → 4 → 2 để xem, rồi sửa ở mục Cài đặt.';
const KHONG_THAY_CAN = (ip: string, cong: number, kq: KetQuaTim) => kq.dai.length === 0
  ? `Không kết nối được cân ở ${ip}: máy tính chưa vào mạng nào. WiFi của máy tính có đang bật không?`
  : `Không kết nối được cân ở ${ip} (cổng ${cong}), dò cả ${kq.daThu} địa chỉ trong mạng của máy tính ` +
    `(${kq.dai.join(', ')}) cũng không thấy cân. Cân có đang bật, ở màn hình bán hàng không? ` +
    'Máy tính có cùng WiFi với cân không (không dùng WiFi khách)? ' +
    'Vẫn không được thì trên cân bấm Prog → 4 → 2 xem địa chỉ, rồi sửa ở mục Cài đặt.';
const NHIEU_CAN = (thay: string[]) =>
  `Thấy ${thay.length} cân trong WiFi (${thay.join(', ')}) nên chưa biết gửi cho cân nào. ` +
  'Trên cân bấm Prog → 4 → 2 xem địa chỉ, rồi chọn đúng cân ở Cài đặt → Tìm cân.';
const KHAC_MAY = (ip: string) =>
  `Thấy một cân ở ${ip} nhưng không phải cân vẫn dùng (mã máy khác), nên không tự gửi sang. ` +
  `Nếu đúng là cân của quầy (vừa thay cân, hay quán có hai cân): trên cân bấm Prog → 4 → 2 xem địa chỉ, rồi chọn cân ở Cài đặt → Tìm cân.`;
/** Tự gửi mỗi phút: vừa dò mà không thấy cân (tối, nghỉ) thì 5 phút sau mới dò lại, không dò mỗi phút. */
const DO_LAI_SAU_MS = 5 * 60_000;

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
    hen = setTimeout(() => dung(new LoiKhongNoi(GOI_Y_KET_NOI(ip, cong))), 5000);
    s.once('connect', () => {
      daNoi = true;
      clearTimeout(hen);
      hen = setTimeout(() => dung(daGuiHet ? undefined : new LoiCan('Cân nhận dữ liệu quá chậm. Gửi lại.')), choMs);
      s.end(Buffer.from(du), () => { daGuiHet = true; });
    });
    s.on('data', () => { /* cân không trả lời gì; bỏ qua nếu có */ });
    s.once('error', (e) => dung(daNoi && daGuiHet ? undefined : daNoi ? new LoiCan(`Mất kết nối với cân khi đang gửi (${e.message}). Gửi lại.`) : new LoiKhongNoi(GOI_Y_KET_NOI(ip, cong))));
    s.once('close', () => dung(daNoi && daGuiHet ? undefined : daNoi ? new LoiCan('Cân đóng kết nối trước khi nhận hết. Gửi lại.') : new LoiKhongNoi(GOI_Y_KET_NOI(ip, cong))));
  });
}

export { thuKetNoi };

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
export interface QuyenMay {
  /** Gửi xuống cân, sửa tem, tạo / tắt mã giảm (quản lý, chủ). */
  danhMuc: boolean;
  /** Tạo yêu cầu lấy hàng, phiếu huỷ (NV quầy, thủ kho, quản lý, chủ). */
  vanHanh: boolean;
  /** Báo cáo có doanh thu (chủ, quản lý, kế toán). */
  xemGia: boolean;
}
export interface NguoiDung {
  email: string; hoTen: string; vaiTro: string;
  chiNhanh: { id: string; ma: string; ten: string } | null;
  cacChiNhanh: { id: string; ma: string; ten: string }[];
  quyen: QuyenMay;
}

export const quyenCuaVai = (vai: string): QuyenMay =>
  ({ danhMuc: duoc(vai, 'danh_muc'), vanHanh: duoc(vai, 'van_hanh'), xemGia: duoc(vai, 'xem_gia') });

/**
 * Cách chương trình đọc / ghi kho cho máy quầy — thật là Supabase (khoTuClient),
 * kiểm thử thay bằng kho giả.
 */
export interface KhoTruyCap {
  rpc(ten: string, thamSo: Record<string, unknown>): Promise<unknown>;
  bang(ten: 'kho_ma_giam' | 'kho_mat_hang' | 'kho_o_ma', cot: string): Promise<Record<string, unknown>[]>;
  taiAnhHuy(chiNhanhId: string, maGui: string, tep: File[]): Promise<{ duongDan: string[]; loi: string[] }>;
}

function khoTuClient(c: SupabaseClient): KhoTruyCap {
  return {
    async rpc(ten, thamSo) {
      const { data, error } = await c.rpc(ten, thamSo);
      if (error) throw new LoiCan(cauLoiKho(error));
      return data;
    },
    async bang(ten, cot) {
      const { data, error } = await c.from(ten).select(cot);
      if (error) throw new LoiCan(cauLoiKho(error));
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
    async taiAnhHuy(chiNhanhId, maGui, tep) {
      const r = await taiAnh(c, chiNhanhId, 'huy', maGui, tep);
      return { duongDan: r.duongDan, loi: r.loi };
    },
  };
}

/** Ảnh gửi từ trang (base64) — kiểm dạng, cỡ. */
export interface AnhGui { ten: string; loai: string; base64: string }
const LA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

/** Một dòng ở thẻ "Tất cả hàng": hàng trên cân, đối chiếu với kho. */
export type TinhTrangHang =
  | 'khop'        // trên cân, đúng như kho
  | 'lech'        // trên cân, tên/giá khác kho (hoặc kho thiếu giá nên để nguyên)
  | 'ngoai_kho'   // trên cân, kho không có
  | 'con_lai'     // đã bỏ khỏi file nhưng WiFi không xoá được — vẫn nằm trên cân
  | 'chua_len'    // kho có, chưa lên cân
  | 'khong_len'   // kho có nhưng thiếu giá / mã quá dài — không đưa lên được
  | 'tren_can';   // chưa đăng nhập kho nên chưa đối chiếu
export interface HangXem {
  so: number | null;
  phim: string | null;
  maCan: string;
  maFabi: string;          // mã hàng 5 số trong mã vạch — khớp "mã vạch" của món trên FABi
  ten: string;
  gia: number | null;
  theoGoi: boolean;
  tinhTrang: TinhTrangHang;
  tenKho?: string;
  giaKho?: number | null;
  ghiChu?: string;
}
export interface TatCaHang { hang: HangXem[]; coKho: boolean; loiKho: string | null }

const KHONG_DOI: KeHoach = { dong: [], dem: { them: 0, sua: 0, giu: 0, xoa: 0, ngoai_kho: 0, bo_qua: 0 }, coThayDoi: false };

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
  readonly fileDaTat: string;
  readonly fileDaTatChoUsb: string;
  private client: SupabaseClient | null = null;

  constructor(
    readonly dd: DuongDan,
    private readonly phu: {
      gui?: typeof guiTcp;
      thu?: typeof thuKetNoi;
      /** Kiểm thử: thay kho thật bằng danh mục cho sẵn. */
      danhMuc?: () => Promise<DanhMucKho>;
      /** Kiểm thử: kho giả cho máy quầy, và người đăng nhập (mặc định quản lý). */
      kho?: KhoTruyCap;
      nguoi?: NguoiDung;
      fetch?: typeof fetch;
      /** Kiểm thử: mạng để dò tìm cân thay cho mạng thật của máy (dải 127.0.0.x). */
      mang?: MangMay[];
      /** Kiểm thử: PowerShell giả cho dây RS232. */
      chayPs?: ChayPs;
      /** Kiểm thử: mã máy (MAC) theo địa chỉ thay cho bảng ARP thật. */
      mac?: (ip: string) => Promise<string | null>;
    } = {},
  ) {
    this.fileCauHinh = path.join(dd.cauHinh, 'cau-hinh.json');
    this.filePhien = path.join(dd.cauHinh, 'phien.json');
    this.fileGoc = path.join(dd.duLieu, 'A_000.TMS');
    this.fileTrenCan = path.join(dd.duLieu, 'tren-can.tsv');
    this.thuMucDaGui = path.join(dd.duLieu, 'da-gui');
    this.fileChoUsb = path.join(dd.duLieu, 'cho-usb', 'A_000.TMS');
    this.fileDaTat = path.join(dd.duLieu, 'tem-da-tat.json');
    this.fileDaTatChoUsb = path.join(dd.duLieu, 'cho-usb', 'tem-da-tat.json');
  }

  // ---- cấu hình --------------------------------------------------------------
  cauHinh(): CauHinh { return docJson(this.fileCauHinh, CAU_HINH_MAC_DINH); }

  luuCauHinh(moi: Partial<CauHinh>): CauHinh {
    const cu = this.cauHinh();
    const ip = String(moi.ipCan ?? cu.ipCan).trim();
    if (!LA_IP.test(ip)) throw new LoiCan('Địa chỉ cân phải có dạng 192.168.1.22.');
    const cong = Number(moi.congCan ?? cu.congCan);
    if (!Number.isInteger(cong) || cong < 1 || cong > 65535) throw new LoiCan('Cổng của cân là một số, thường là 33571.');
    let kho = String(moi.diaChiKho ?? cu.diaChiKho).trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(kho)) kho = 'https://' + kho;
    const doiKho = kho !== cu.diaChiKho;
    const kq: CauHinh = {
      ...cu, ipCan: ip, congCan: cong, diaChiKho: kho,
      ...(moi.chiNhanhId !== undefined ? { chiNhanhId: moi.chiNhanhId || undefined } : {}),
      ...(moi.tuGui !== undefined ? { tuGui: moi.tuGui === true } : {}),
    };
    if (doiKho) { delete kq.supabaseUrl; delete kq.anonKey; this.client = null; }
    // Người chọn cân khác: mã máy cũ không còn đúng — lần nối được tới sẽ nhớ lại.
    if (ip !== cu.ipCan) delete kq.macCan;
    ghiJson(this.fileCauHinh, kq);
    return kq;
  }

  private ghiThem(them: Partial<CauHinh>) { ghiJson(this.fileCauHinh, { ...this.cauHinh(), ...them }); }

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
      throw new LoiCan('Tài khoản này không phải nhân viên kho đang làm (cần NV quầy, thủ kho, kế toán, quản lý hoặc chủ).');
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

  /** Người đang đăng nhập — null nếu chưa, hoặc không phải vai kho (xem). */
  async nguoiDung(): Promise<NguoiDung | null> {
    if (this.phu.nguoi) return this.phu.nguoi;
    if (this.phu.danhMuc || this.phu.kho) {
      const cn = { id: 'thu', ma: 'THU', ten: 'Chi nhánh thử' };
      return { email: 'thu@beeftown', hoTen: 'Kiểm thử', vaiTro: 'quan_ly', chiNhanh: cn, cacChiNhanh: [cn], quyen: quyenCuaVai('quan_ly') };
    }
    const c = await this.layClient();
    const { data: s } = await c.auth.getSession();
    const u = s.session?.user;
    if (!u) return null;
    const { data: ns } = await c.from('nhan_su')
      .select('id, ho_ten, vai_tro, chi_nhanh_id').eq('auth_uid', u.id).eq('dang_lam', true).maybeSingle();
    if (!ns || !(QUYEN_KHO.xem as readonly string[]).includes(ns.vai_tro)) return null;
    const { data: cns } = await c.from('chi_nhanh').select('id, ma, ten').order('ma');
    const cacChiNhanh = (cns ?? []) as NguoiDung['cacChiNhanh'];
    const chon = ns.chi_nhanh_id ?? this.cauHinh().chiNhanhId;
    const chiNhanh = cacChiNhanh.find(x => x.id === chon) ?? (ns.chi_nhanh_id ? null : cacChiNhanh[0] ?? null);
    return { email: u.email ?? '', hoTen: ns.ho_ten, vaiTro: ns.vai_tro, chiNhanh, cacChiNhanh: ns.chi_nhanh_id ? cacChiNhanh.filter(x => x.id === ns.chi_nhanh_id) : cacChiNhanh,
             quyen: quyenCuaVai(ns.vai_tro) };
  }

  private async layDanhMuc(): Promise<DanhMucKho> {
    if (this.phu.danhMuc) return this.phu.danhMuc();
    const nd = await this.nguoiDung();
    if (!nd) throw new LoiCan('Chưa đăng nhập kho, hoặc phiên đăng nhập đã hết. Đăng nhập lại.');
    if (!nd.chiNhanh) throw new LoiCan('Chưa chọn chi nhánh.');
    // NV quầy không đọc được phiên lóc (tên ô theo tảng) — danh mục cân chỉ quản lý / chủ gửi.
    if (!nd.quyen.danhMuc) throw new LoiCan('Đưa danh mục xuống cân chỉ dành cho quản lý hoặc chủ.');
    const c = await this.layClient();
    const [caiDat, matHang] = await Promise.all([docCaiDat(c, nd.chiNhanh.id), docMatHang(c)]);
    // Truy vết tảng (GĐ3): mỗi ô mã một dòng, tên kèm số tảng đang giữ ô.
    return { matHang: await hangChoCan(c, nd.chiNhanh.id, matHang), mauMaVach: caiDat?.mau_ma_vach ?? null };
  }

  // ---- máy quầy (0054) ------------------------------------------------------
  private async voiKho(): Promise<{ kho: KhoTruyCap; nd: NguoiDung; cn: string }> {
    const nd = await this.nguoiDung();
    if (!nd) throw new LoiCan('Chưa đăng nhập kho, hoặc phiên đăng nhập đã hết. Đăng nhập lại.');
    if (!nd.chiNhanh) throw new LoiCan('Chưa chọn chi nhánh.');
    const kho = this.phu.kho ?? khoTuClient(await this.layClient());
    return { kho, nd, cn: nd.chiNhanh.id };
  }

  private async docBangQuay(kho: KhoTruyCap, cn: string): Promise<BangQuay> {
    return await kho.rpc('kho_bang_quay', { p_chi_nhanh_id: cn }) as BangQuay;
  }

  async bangQuay(): Promise<XemQuay & { quyen: QuyenMay }> {
    const { kho, nd, cn } = await this.voiKho();
    const x = tomTatQuay(await this.docBangQuay(kho, cn));
    // Số PLU của mã giảm trên cân — NV quầy gọi hàng trên cân bằng số PLU.
    const plu = this.pluTheoMa();
    for (const l of x.canDate) for (const g of l.maGiam) g.plu = plu.get(g.ma_can) ?? null;
    return { ...x, quyen: nd.quyen };
  }

  /** NV quầy xin thêm hàng (kho_tao_yeu_cau). ma_gui do trang tạo — bấm hai lần không thành hai phiếu. */
  async taoYeuCau(b: { maGui?: unknown; viTriId?: unknown; ghiChu?: unknown; nguon?: unknown; dong?: unknown }): Promise<{ soPhieu: string; daCo: boolean }> {
    const { kho, nd, cn } = await this.voiKho();
    if (!nd.quyen.vanHanh) throw new LoiCan('Tài khoản này không tạo được yêu cầu lấy hàng.');
    const maGui = String(b.maGui ?? '');
    if (!LA_UUID.test(maGui)) throw new LoiCan('Mở lại form rồi gửi lại.');
    const bq = await this.docBangQuay(kho, cn);
    const viTri = bq.vi_tri.find(v => v.id === b.viTriId) ?? bq.vi_tri[0];
    if (!viTri) throw new LoiCan('Chi nhánh chưa có quầy trong kho.');
    let dong;
    try { dong = dongYeuCau(b.dong, new Map(bq.mon.map(m => [m.id, m]))); }
    catch (e) { if (e instanceof LoiQuay) throw new LoiCan(e.message); throw e; }
    const kq = await kho.rpc('kho_tao_yeu_cau', {
      p_chi_nhanh_id: cn, p_ma_gui: maGui, p_vi_tri_id: viTri.id, p_nguon: b.nguon === 'goi_y' ? 'goi_y' : 'tay',
      p_ghi_chu: String(b.ghiChu ?? '').trim().slice(0, 500) || null, p_dong: dong,
    }) as { so_phieu: string; da_co: boolean }[] | { so_phieu: string; da_co: boolean };
    const r = Array.isArray(kq) ? kq[0] : kq;
    return { soPhieu: r?.so_phieu ?? '', daCo: !!r?.da_co };
  }

  /** Phiếu huỷ ở quầy (chờ quản lý duyệt). Ảnh tải lên kho chứng từ trước, rồi mới gọi kho. */
  async taoPhieuHuy(b: { maGui?: unknown; lyDoId?: unknown; ghiChu?: unknown; dong?: unknown; anh?: unknown }): Promise<{ soPhieu: string; daCo: boolean; loiAnh: string[] }> {
    const { kho, nd, cn } = await this.voiKho();
    if (!nd.quyen.vanHanh) throw new LoiCan('Tài khoản này không tạo được phiếu huỷ.');
    const maGui = String(b.maGui ?? '');
    if (!LA_UUID.test(maGui)) throw new LoiCan('Mở lại form rồi gửi lại.');
    const bq = await this.docBangQuay(kho, cn);
    const ld = bq.ly_do_huy.find(l => l.id === b.lyDoId);
    if (!ld) throw new LoiCan('Chọn lý do huỷ.');
    let x;
    try { x = dongHuy(b.dong, new Map(bq.lo.map(l => [l.lo_id, l])), new Map(bq.mon.map(m => [m.id, m]))); }
    catch (e) { if (e instanceof LoiQuay) throw new LoiCan(e.message); throw e; }

    const tep: File[] = [];
    for (const a of (Array.isArray(b.anh) ? b.anh : []).slice(0, 8) as AnhGui[]) {
      if (!a || typeof a.base64 !== 'string' || typeof a.loai !== 'string') continue;
      const du = Buffer.from(a.base64, 'base64');
      if (du.length > 10 * 1024 * 1024) throw new LoiCan(`Ảnh "${a.ten}" nặng quá 10 MB.`);
      tep.push(new File([du], String(a.ten || 'anh.jpg').slice(0, 80), { type: a.loai }));
    }
    if (ld.can_anh && tep.length === 0) throw new LoiCan(`Lý do "${ld.ten}" cần ảnh chụp hàng — chọn ít nhất một ảnh.`);
    const tai = tep.length ? await kho.taiAnhHuy(cn, maGui, tep) : { duongDan: [], loi: [] };
    if (ld.can_anh && tai.duongDan.length === 0) {
      throw new LoiCan(`Ảnh chưa tải lên được${tai.loi.length ? ': ' + tai.loi.join(' · ') : ''}. Thử lại.`);
    }
    const kq = await kho.rpc('kho_tao_phieu_xuat', {
      p_chi_nhanh_id: cn, p_ma_gui: maGui, p_loai: 'huy', p_vi_tri_id: x.viTriId, p_vi_tri_den_id: null,
      p_ly_do_id: ld.id, p_ghi_chu: String(b.ghiChu ?? '').trim().slice(0, 500) || null, p_anh: tai.duongDan, p_dong: x.dong,
    }) as { so_phieu: string; da_co: boolean }[] | { so_phieu: string; da_co: boolean };
    const r = Array.isArray(kq) ? kq[0] : kq;
    return { soPhieu: r?.so_phieu ?? '', daCo: !!r?.da_co, loiAnh: tai.loi };
  }

  /** Số PLU trên cân theo mã cân (file gốc + dòng WiFi không xoá được). */
  private pluTheoMa(): Map<string, number> {
    const m = new Map<string, number>();
    for (const h of this.docTrenCan().values()) if (h.ma) m.set(h.ma, h.so);
    if (this.coFileGoc()) {
      try { for (const p of docFileCan(this.docGoc()).plu) if (p.ma) m.set(p.ma, p.so); } catch { /* file hỏng: bỏ qua */ }
    }
    return m;
  }

  /** Tên đang nằm trên cân theo mã cân (file gốc + dòng WiFi không xoá được). */
  private tenTrenCan(): Map<string, string> {
    const m = new Map<string, string>();
    for (const h of this.docTrenCan().values()) if (h.ma) m.set(h.ma, h.ten);
    if (this.coFileGoc()) {
      try { for (const p of docFileCan(this.docGoc()).plu) if (p.ma) m.set(p.ma, p.ten); } catch { /* file hỏng: bỏ qua */ }
    }
    return m;
  }

  async tangVaO(): Promise<{ nhom: NhomO[]; coFileGoc: boolean }> {
    const { kho, cn } = await this.voiKho();
    const ds = await kho.rpc('kho_can_o_ma', { p_chi_nhanh_id: cn }) as OMaKho[];
    return { nhom: tomTatO(ds ?? [], this.tenTrenCan()), coFileGoc: this.coFileGoc() };
  }

  async maGiam(): Promise<{ ds: DongGiamXem[]; monTaoDuoc: MonGiam[]; sua: boolean }> {
    const { kho, nd } = await this.voiKho();
    const [g, mh, o] = await Promise.all([
      kho.bang('kho_ma_giam', 'id, mat_hang_id, phan_tram, ma_can, dang_dung'),
      kho.bang('kho_mat_hang', 'id, ma, ten, ma_can, gia_ban_kg, dang_dung'),
      kho.bang('kho_o_ma', 'mat_hang_id'),
    ]);
    const coO = new Set(o.map(x => String(x.mat_hang_id)));
    const mon: MonGiam[] = mh.map(m => ({
      id: String(m.id), ma: String(m.ma), ten: String(m.ten), ma_can: (m.ma_can as string | null) ?? null,
      gia_ban_kg: m.gia_ban_kg === null || m.gia_ban_kg === undefined ? null : Number(m.gia_ban_kg),
      dang_dung: m.dang_dung === true, coO: coO.has(String(m.id)),
    }));
    const kq = tomTatGiam(g.map(x => ({ id: String(x.id), mat_hang_id: String(x.mat_hang_id), phan_tram: Number(x.phan_tram),
                                         ma_can: String(x.ma_can), dang_dung: x.dang_dung === true })), mon, this.tenTrenCan());
    return { ...kq, sua: nd.quyen.danhMuc };
  }

  async luuMaGiam(b: { matHangId?: unknown; phanTram?: unknown; maCan?: unknown }): Promise<{ maCan: string; giaGiam: number; ten: string; phanTram: number }> {
    const { kho, nd } = await this.voiKho();
    if (!nd.quyen.danhMuc) throw new LoiCan('Chỉ quản lý hoặc chủ được tạo mã giảm giá.');
    const pt = Number(b.phanTram);
    if (!Number.isInteger(pt) || pt < 5 || pt > 90) throw new LoiCan('Mức giảm từ 5% đến 90%.');
    const ma = String(b.maCan ?? '').trim();
    if (ma && !/^\d{1,6}$/.test(ma)) throw new LoiCan('Mã cân là số, tối đa 6 chữ số.');
    if (!LA_UUID.test(String(b.matHangId ?? ''))) throw new LoiCan('Chọn món.');
    const r = await kho.rpc('kho_luu_ma_giam', { p_mat_hang_id: b.matHangId, p_phan_tram: pt, p_ma_can: ma || null }) as
      { ma_can: string; gia_giam_kg: number; ten: string; phan_tram: number };
    return { maCan: r.ma_can, giaGiam: Number(r.gia_giam_kg), ten: r.ten, phanTram: r.phan_tram };
  }

  async batMaGiam(b: { id?: unknown; bat?: unknown }): Promise<{ cau: string }> {
    const { kho, nd } = await this.voiKho();
    if (!nd.quyen.danhMuc) throw new LoiCan('Chỉ quản lý hoặc chủ được bật / tắt mã giảm giá.');
    if (!LA_UUID.test(String(b.id ?? ''))) throw new LoiCan('Không thấy mã giảm giá này.');
    return { cau: String(await kho.rpc('kho_bat_ma_giam', { p_id: b.id, p_dang_dung: b.bat === true })) };
  }

  async baoCao(b: { tu?: unknown; den?: unknown }): Promise<BaoCao> {
    const { kho, nd, cn } = await this.voiKho();
    if (!nd.quyen.xemGia) throw new LoiCan('Báo cáo có doanh thu — chỉ chủ, quản lý, kế toán xem được.');
    let k;
    try { k = khoangNgay(b.tu, b.den); } catch (e) { if (e instanceof LoiQuay) throw new LoiCan(e.message); throw e; }
    const [dong, tang] = await Promise.all([
      kho.rpc('kho_bao_cao_ban_gio', { p_chi_nhanh_id: cn, p_tu: k.tu, p_den: k.den }),
      kho.rpc('kho_bao_cao_tang', { p_chi_nhanh_id: cn, p_tu: k.tu, p_den: k.den }),
    ]);
    return tomTatBaoCao(k.tu, k.den, (dong ?? []) as DongBanGio[], (tang ?? []) as DongTang[]);
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
  private docGoc(): Uint8Array {
    if (!this.coFileGoc()) throw new LoiCan('Chưa có file gốc của cân. Làm bước "Bắt đầu" trước.');
    return new Uint8Array(fs.readFileSync(this.fileGoc));
  }

  private async dung(giuHangNgoaiKho: boolean) {
    const goc = docFileCan(this.docGoc());
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

  /** `timLai: false` — nối cân không được thì báo luôn, không dò WiFi (xem guiDenCan). */
  guiXuongCan(giuHangNgoaiKho = false, timLai = true): Promise<{ soHang: number; conLai: HangTrenCan[]; doiDiaChi: DoiDiaChi | null }> {
    return this.motLuc(async () => {
      const { du, moi, tren } = await this.dung(giuHangNgoaiKho);
      const doiDiaChi = await this.guiDenCan(du, timLai);
      // Cân chỉ thêm / sửa: dòng cũ vẫn nằm lại.
      for (const [so, h] of hangTuFile(moi)) tren.set(so, h);
      this.luuGoc(du);
      this.ghiTrenCan(tren);
      const soMoi = new Set(moi.plu.map(p => p.so));
      return { soHang: moi.plu.length, conLai: [...tren.values()].filter(h => !soMoi.has(h.so)), doiDiaChi };
    });
  }

  /**
   * Việc ghi xuống cân chạy lần lượt: tự gửi, bấm Gửi, gửi tem, gửi thử qua dây
   * không chồng nhau — hai file chồng nhau thì không biết cân giữ bản nào, và
   * việc sau lập kế hoạch từ file gốc việc trước vừa ghi.
   */
  private hangDoi: Promise<unknown> = Promise.resolve();
  private motLuc<T>(viec: () => Promise<T>): Promise<T> {
    const lan = this.hangDoi.then(viec);
    this.hangDoi = lan.then(() => {}, () => {});
    return lan;
  }

  /**
   * Tự gửi (GĐ3): kho có thêm / sửa hàng so với cân (đổi giá, lóc tảng mới →
   * ô mã đổi tên theo số tảng) thì gửi qua WiFi. Không có gì đổi thì thôi.
   * Hàng cần xoá không tính — WiFi không xoá được, để người bấm nạp USB.
   */
  lanTuGui: LanTuGui | null = null;
  async tuGuiMotLan(): Promise<LanTuGui> {
    const luc = new Date().toISOString();
    try {
      const x = await this.xemTruoc(false);
      if (x.dem.them + x.dem.sua === 0) {
        this.lanTuGui = { luc, daGui: false, cau: 'Cân đã khớp kho.' };
      } else {
        const k = await this.guiXuongCan(false, Date.now() - this.lanDoHong >= DO_LAI_SAU_MS);
        this.lanTuGui = { luc, daGui: true, cau: `Đã tự gửi ${x.dem.them} thêm, ${x.dem.sua} sửa (${k.soHang} hàng)`
          + (k.doiDiaChi ? ` — cân đổi địa chỉ, đã tìm thấy ở ${k.doiDiaChi.den}.` : '.') };
      }
    } catch (e) {
      this.lanTuGui = { luc, daGui: false, cau: cauLoi(e) };
    }
    return this.lanTuGui;
  }

  /** Dựng file để nạp bằng USB (cân sẽ thay cả danh sách → xoá được hàng). */
  async taoFileUsb(giuHangNgoaiKho = false): Promise<{ duongDan: string; soHang: number }> {
    const { du, moi } = await this.dung(giuHangNgoaiKho);
    fs.mkdirSync(path.dirname(this.fileChoUsb), { recursive: true });
    fs.writeFileSync(this.fileChoUsb, du);
    fs.rmSync(this.fileDaTatChoUsb, { force: true });
    return { duongDan: this.fileChoUsb, soHang: moi.plu.length };
  }

  // ---- tất cả hàng -------------------------------------------------------------
  /** Mọi hàng trên cân (theo file gốc và tren-can.tsv), đối chiếu kho nếu đã đăng nhập. */
  async tatCaHang(): Promise<TatCaHang> {
    const goc = docFileCan(this.docGoc());
    const phim = phimTat(goc);
    let dm: DanhMucKho | null = null, loiKho: string | null = null;
    try { dm = await this.layDanhMuc(); } catch (e) { loiKho = cauLoi(e); }
    const soChuSo = soChuSoMa(dm?.mauMaVach);
    const fabi = (ma: string) => (ma ? ma.padStart(soChuSo, '0') : '');
    const hang: HangXem[] = [];
    const theoGoi = new Map(goc.plu.map(p => [p.so, p.cachBan === '2']));

    if (dm) {
      const kh = lapKeHoach(goc, dm.matHang, { giuHangNgoaiKho: false, giuGioCan: true, soChuSoMa: soChuSo }, 'vi');
      for (const d of kh.dong) {
        const base = { phim: d.so !== null && d.goc ? phim.get(d.so) ?? null : null, maCan: d.maCan, maFabi: fabi(d.maCan) };
        if (d.loai === 'them') hang.push({ ...base, so: null, ten: d.ten, gia: d.gia, theoGoi: false, tinhTrang: 'chua_len', tenKho: d.ten, giaKho: d.gia });
        else if (d.loai === 'bo_qua') hang.push({ ...base, so: null, ten: d.ten, gia: d.gia, theoGoi: false, tinhTrang: 'khong_len', ghiChu: d.lyDo });
        else if (d.loai === 'xoa') hang.push({ ...base, so: d.so, ten: d.ten, gia: d.gia, theoGoi: theoGoi.get(d.so!) ?? false, tinhTrang: 'ngoai_kho', ghiChu: d.lyDo });
        else if (d.loai === 'sua') {
          hang.push({ ...base, so: d.so, ten: d.tenCu ?? d.ten, gia: d.giaCu ?? null, theoGoi: theoGoi.get(d.so!) ?? false, tinhTrang: 'lech',
            tenKho: d.ten, giaKho: d.gia });
        } else {
          hang.push({ ...base, so: d.so, ten: d.ten, gia: d.gia, theoGoi: theoGoi.get(d.so!) ?? false,
            tinhTrang: d.lyDo ? 'lech' : 'khop', ghiChu: d.lyDo });
        }
      }
    } else {
      for (const p of goc.plu) {
        hang.push({ so: p.so, phim: phim.get(p.so) ?? null, maCan: p.ma, maFabi: fabi(p.ma), ten: p.ten, gia: p.gia,
          theoGoi: p.cachBan === '2', tinhTrang: 'tren_can' });
      }
    }

    const trongFile = new Set(goc.plu.map(p => p.so));
    for (const h of this.docTrenCan().values()) {
      if (trongFile.has(h.so)) continue;
      hang.push({ so: h.so, phim: null, maCan: h.ma, maFabi: fabi(h.ma), ten: h.ten, gia: giaTuFile(h.gia, goc.soLeGia),
        theoGoi: false, tinhTrang: 'con_lai', ghiChu: 'Đã bỏ khỏi danh sách nhưng gửi qua WiFi không xoá được — nạp USB để xoá hẳn.' });
    }
    hang.sort((a, b) => (a.so ?? Infinity) - (b.so ?? Infinity) || Number(a.maCan) - Number(b.maCan));
    return { hang, coKho: dm !== null, loiKho };
  }

  // ---- mẫu tem -----------------------------------------------------------------
  private docDaTat(): DaTat { return docJson<DaTat>(this.fileDaTat, {}); }

  /** Mẫu tem cân đang dùng, và một hàng trên cân để vẽ tem mẫu. */
  tem(): { tem: TemXem | null; hangMau: { so: number; ten: string; gia: number | null; theoGoi: boolean } | null } {
    const goc = docFileCan(this.docGoc());
    const p = goc.plu.filter(x => x.ten).sort((a, b) => a.so - b.so)[0];
    return { tem: xemTem(goc, this.docDaTat()), hangMau: p ? { so: p.so, ten: p.ten, gia: p.gia, theoGoi: p.cachBan === '2' } : null };
  }

  /** File để gửi: file gốc với tem đã sửa, bỏ phần giờ. PLU giữ nguyên. */
  private dungTem(thay: ThayDoiTem): { du: Uint8Array; daTat: DaTat } {
    let kq;
    try { kq = suaTem(this.docGoc(), this.docDaTat(), thay); }
    catch (e) { if (e instanceof LoiTem) throw new LoiCan(e.message); throw e; }
    if (!kq.coDoi) throw new LoiCan('Tem chưa có gì thay đổi.');
    return { du: ghiFileCan(docFileCan(kq.du), KHONG_DOI, { giuGioCan: true }), daTat: kq.daTat };
  }

  guiTem(thay: ThayDoiTem): Promise<{ ok: true; doiDiaChi: DoiDiaChi | null }> {
    return this.motLuc(async () => {
      const { du, daTat } = this.dungTem(thay);
      const doiDiaChi = await this.guiDenCan(du);
      this.luuGoc(du);
      ghiJson(this.fileDaTat, daTat);
      return { ok: true as const, doiDiaChi };
    });
  }

  taoFileUsbTem(thay: ThayDoiTem): { duongDan: string; soHang: number } {
    const { du, daTat } = this.dungTem(thay);
    fs.mkdirSync(path.dirname(this.fileChoUsb), { recursive: true });
    fs.writeFileSync(this.fileChoUsb, du);
    ghiJson(this.fileDaTatChoUsb, daTat);
    return { duongDan: this.fileChoUsb, soHang: docFileCan(du).plu.length };
  }

  /** Đã nạp file cho-usb vào cân bằng USB → cân có đúng file đó. */
  daNapUsb(): { soHang: number } {
    if (!fs.existsSync(this.fileChoUsb)) throw new LoiCan('Chưa có file nạp USB. Bấm "Lưu file để nạp USB" trước.');
    const kq = this.ghiNhanFileTuCan(new Uint8Array(fs.readFileSync(this.fileChoUsb)));
    // File USB làm từ thẻ Tem: giờ cân mới thật sự có tem đó.
    if (fs.existsSync(this.fileDaTatChoUsb)) ghiJson(this.fileDaTat, docJson<DaTat>(this.fileDaTatChoUsb, {}));
    fs.rmSync(this.fileChoUsb, { force: true });
    fs.rmSync(this.fileDaTatChoUsb, { force: true });
    return { soHang: kq.soHang };
  }

  // ---- nối cân, tìm cân khi cân đổi địa chỉ ------------------------------------
  /**
   * Gửi tới cân. Không nối được (chưa gửi byte nào) thì dò WiFi tìm cân: thấy
   * đúng cân đang dùng ở địa chỉ khác thì dùng địa chỉ đó (lưu lại) và gửi lại
   * một lần. Đang gửi dở mà hỏng thì không gửi lại — để người bấm quyết.
   */
  private async guiDenCan(du: Uint8Array, timLai = true): Promise<DoiDiaChi | null> {
    const gui = this.phu.gui ?? guiTcp;
    const ch = this.cauHinh();
    try {
      await gui(ch.ipCan, ch.congCan, du);
      await this.nhoMac(ch.ipCan);
      return null;
    } catch (e) {
      if (!(e instanceof LoiKhongNoi) || !timLai) throw e;
    }
    const kq = await this.timCan();
    // Không thấy cân: vẫn là "chưa nối được". Thấy nhiều cân / cân khác máy: phải chọn, không tự đoán.
    if (!kq.thongCan) throw kq.thay.length ? new LoiCan(kq.loi!) : new LoiKhongNoi(kq.loi!);
    await gui(kq.ipCan, ch.congCan, du);
    await this.nhoMac(kq.ipCan);
    return kq.doi;
  }

  /** Nút "Kiểm tra kết nối" (chạy cả lúc mở chương trình): nối không được thì dò WiFi tìm cân. */
  async thuCan(): Promise<KetQuaTimCan> {
    const ch = this.cauHinh();
    // Chờ ngắn như mỗi địa chỉ khi dò: cân tắt thì khỏi chờ lâu rồi mới dò.
    if (await (this.phu.thu ?? thuKetNoi)(ch.ipCan, ch.congCan, 2000)) {
      await this.nhoMac(ch.ipCan);
      return { thongCan: true, ipCan: ch.ipCan, doi: null, loi: null, thay: [ch.ipCan], daThu: 0, dai: [] };
    }
    return this.timCan();
  }

  /**
   * Dò WiFi tìm cân (nút "Tìm cân"). Thấy đúng một cân ở địa chỉ khác thì dùng
   * luôn địa chỉ đó — trừ khi đã biết mã máy của cân mà máy vừa thấy khác mã
   * (cân khác, không phải cân vẫn dùng đổi địa chỉ).
   */
  async timCan(): Promise<KetQuaTimCan> {
    const truoc = this.cauHinh();
    const kq = await this.doMang(truoc);
    // Cài đặt đổi trong lúc dò (người gõ địa chỉ / cổng khác, hay lượt dò chung với tự gửi vừa
    // đổi địa chỉ): kết quả dò không còn đúng — kiểm lại theo cài đặt mới, không tự đổi đè lên.
    const vanNhu = () => { const c = this.cauHinh(); return c.ipCan === truoc.ipCan && c.congCan === truoc.congCan; };
    if (!vanNhu()) return this.thuCan();
    let doi: DoiDiaChi | null = null, khacMay: string | null = null;
    if (kq.thay.length === 1 && kq.thay[0] !== truoc.ipCan) {
      const moi = kq.thay[0];
      const mac = await (this.phu.mac ?? layMac)(moi);
      if (!vanNhu()) return this.thuCan();
      const cu = this.cauHinh();
      if (cu.macCan && mac && mac !== cu.macCan) khacMay = moi;
      else doi = this.ghiDoiDiaChi(cu.ipCan, moi, mac ?? cu.macCan);
    }
    const ch = this.cauHinh();
    const thongCan = !khacMay && kq.thay.includes(ch.ipCan);
    const loi = thongCan ? null : khacMay ? KHAC_MAY(khacMay) : kq.thay.length ? NHIEU_CAN(kq.thay) : KHONG_THAY_CAN(ch.ipCan, ch.congCan, kq);
    this.lanDoHong = thongCan ? 0 : Date.now();
    return { ...kq, thongCan, ipCan: ch.ipCan, doi, loi };
  }

  /** Lúc dò WiFi gần nhất mà không nối được cân (ms, 0: lần dò gần nhất thấy cân) — tự gửi chờ 5 phút mới dò lại. */
  lanDoHong = 0;
  private dangDo: { khoa: string; kq: Promise<KetQuaTim> } | null = null;
  /** Một lượt dò mỗi lúc cho cùng địa chỉ cũ và cổng; bấm Tìm cân khi tự gửi đang dò thì dùng chung lượt đó. */
  private doMang(ch: CauHinh): Promise<KetQuaTim> {
    const khoa = `${ch.ipCan}:${ch.congCan}`;
    if (this.dangDo?.khoa !== khoa) {
      const kq = doTimCan(ch.congCan, ch.ipCan, this.phu.mang)
        .finally(() => { if (this.dangDo?.kq === kq) this.dangDo = null; });
      this.dangDo = { khoa, kq };
    }
    return this.dangDo.kq;
  }

  /** Cân đổi địa chỉ: dùng địa chỉ mới, nhớ 10 lần gần nhất — cân hay đổi thì trang nhắc giữ cố định trong router. */
  private ghiDoiDiaChi(tu: string, den: string, mac: string | undefined): DoiDiaChi {
    const doi = { luc: new Date().toISOString(), tu, den };
    this.ghiThem({ ipCan: den, macCan: mac, doiDiaChi: [doi, ...(this.cauHinh().doiDiaChi ?? [])].slice(0, 10) });
    return doi;
  }

  /** Vừa nối được cân ở địa chỉ đang dùng mà chưa biết mã máy: đọc và nhớ (một lần). */
  private async nhoMac(ip: string) {
    if (this.cauHinh().macCan || this.cauHinh().ipCan !== ip) return;
    const mac = await (this.phu.mac ?? layMac)(ip);
    const ch = this.cauHinh();
    if (mac && ch.ipCan === ip && !ch.macCan) this.ghiThem({ macCan: mac });
  }

  // ---- dây RS232 (thử — xem day-rs232.ts) --------------------------------------
  async dsCom(): Promise<{ cong: CongCom[]; com: string | null; baud: number }> {
    const ch = this.cauHinh();
    return { cong: await dsCongCom(this.phu.chayPs), com: ch.com ?? null, baud: ch.baud ?? 9600 };
  }

  /**
   * Gửi thử qua dây: đúng nội dung như gửi qua WiFi, giữ cả hàng ngoài kho (lỡ
   * qua dây cân thay cả danh sách như USB thì cũng không mất hàng). KHÔNG ghi
   * nhận là cân đã nhận — lần gửi WiFi sau vẫn gửi lại các thay đổi này. Trả một
   * hàng vừa đổi để gọi thử trên cân: ưu tiên hàng đổi giá (nhìn là thấy), rồi
   * hàng thêm, cuối cùng hàng chỉ đổi tên (đổi tên theo tảng).
   */
  guiThuQuaDay(b: { com?: unknown; baud?: unknown }): Promise<{
    com: string; baud: number; soByte: number; giay: number;
    hang: { so: number | null; ten: string; tenCu: string | null; gia: number | null; giaCu: number | null; loai: string };
  }> {
    const com = String(b.com ?? ''), baud = Number(b.baud);
    kiemCom(com, baud);
    return this.motLuc(async () => {
      const { kh, du } = await this.dung(true);
      const doi = kh.dong.filter(d => d.loai === 'sua' || d.loai === 'them');
      const hang = doi.find(d => d.loai === 'sua' && d.giaCu !== undefined && d.gia !== d.giaCu)
        ?? doi.find(d => d.loai === 'them') ?? doi[0];
      if (!hang) {
        throw new LoiCan('Kho và cân đang khớp nên gửi thử sẽ không thấy gì đổi trên cân. Thử lúc kho có đổi giá hoặc thêm món ' +
          '(thẻ Gửi giá từ kho có dòng Thêm / Sửa) — hoặc tạm sửa giá một món ít bán trong kho, thử xong sửa lại.');
      }
      const bd = Date.now();
      await guiCom(com, baud, du, this.phu.chayPs);
      this.ghiThem({ com, baud });
      return {
        com, baud, soByte: du.length, giay: Math.max(giayDay(du.length, baud), Math.round((Date.now() - bd) / 1000)),
        hang: { so: hang.so, ten: hang.ten, tenCu: hang.tenCu ?? null, gia: hang.gia, giaCu: hang.giaCu ?? null, loai: hang.loai },
      };
    });
  }

  /** Nghe cân qua dây `giay` giây: đúng tốc độ thì chữ đọc được; cân không tự gửi gì thì trống (chưa nói lên được gì). */
  async ngheQuaDay(b: { com?: unknown; baud?: unknown; giay?: unknown }): Promise<ReturnType<typeof tomTatNghe> & { com: string; baud: number; giay: number }> {
    const com = String(b.com ?? ''), baud = Number(b.baud);
    const giay = Math.min(60, Math.max(1, Math.round(Number(b.giay) || 10)));
    const du = await ngheCom(com, baud, giay * 1000, this.phu.chayPs);
    this.ghiThem({ com, baud });
    return { ...tomTatNghe(du), com, baud, giay };
  }
}

/** Câu lỗi cho người dùng — lỗi lạ thì nói chung chung, không lộ chi tiết kỹ thuật. */
export function cauLoi(e: unknown): string {
  if (e instanceof LoiCan || e instanceof LoiFileCan || e instanceof LoiTem || e instanceof LoiDay) return e.message;
  const m = e instanceof Error ? e.message : String(e);
  if (/fetch|network|ENOTFOUND|ECONNREFUSED|timed? ?out/i.test(m)) return 'Mất kết nối mạng. Kiểm tra internet rồi thử lại.';
  if (/JWT|refresh|session/i.test(m)) return 'Phiên đăng nhập đã hết. Đăng nhập lại.';
  return `Có lỗi: ${m}`;
}
