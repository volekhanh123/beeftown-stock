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
 *
 * BẢN 2.2 (dựng lại từ phần mềm TM-xA của hãng — CHƯA THỬ TRÊN CÂN THẬT, trừ
 * khi ghi khác):
 *   · Cổng hai chiều 33581 (giao-thuc.ts): đọc thông tin cân + giờ
 *     (thongTinCanHaiChieu — việc nên thử đầu tiên, chỉ đọc), đọc dữ liệu cân
 *     thay bước USB (docTuCanQuaWifi), đọc / chỉnh giờ (gioCan, chinhGioCan —
 *     hỏng thì gửi khối giờ qua 33571), xoá hẳn hàng còn nằm lại (xoaQuaWifi:
 *     CLR + gửi lại cả danh sách, đọc lại để xác nhận), đọc nhật ký bán.
 *   · Thông số (TMS) và phím tắt (SCP) — thong-so.ts: sửa file gốc, gửi file
 *     nhỏ chỉ có khối đổi qua cổng 33571 như 2.1.
 *   · Nhật ký bán của cân (bao-cao-can.ts): gộp vào Tài liệu › Beeftown Can ›
 *     nhat-ky-can.tsv. File lưu từ cân ra USB có phần REP thì gộp ngay lúc ghi
 *     nhận (ghiNhanFileTuCan) — mọi lần gửi xuống cân đều bỏ phần REP / INF
 *     (boPhanChiDoc), nên file gốc sau lần gửi đầu không còn nhật ký.
 *   · Mẫu tem sửa kỹ hơn (tem.ts: di chuyển, cỡ chữ, điều kiện in, thêm ô).
 *   · Quyền: mọi việc mới với cân theo quy tắc thẻ Mẫu tem (kiemQuyenCan).
 */
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  chuanMa, docFileCan, ghiFileCan, giaTuFile, lapKeHoach, soChuSoMa, LoiFileCan,
  type DongKeHoach, type FileCan, type HangKho, type KeHoach, type LoaiDong,
} from '../../web/src/lib/kho/can-tma.ts';
import {
  CANH_CHU, CAU_DOI, CO_CHU, DIEU_KIEN_IN, LoiTem, O_THEM_DUOC, XOAY, dauTem, goiYHsd, suaTem, xemTem,
  type DaTat, type TemXem, type ThayDoiTem,
} from './tem.ts';
import {
  CONG_HAI_CHIEU, LoiGiaoThuc, docTuCan, ghepFileUsb, khoiTim, khoiXoaVaNapPlu, moKetNoi,
  type GioCan, type KetNoiCan, type ThongTinCan, type TuyChonKetNoi,
} from './giao-thuc.ts';
import {
  docKhoNhatKy, docNhatKy, ghiChuDong, ghiKhoNhatKy, gopNhatKy, khoa as khoaNhatKy, macTuDong, nhatKyTuFile, pluLucDocTuDong, sangCsv, tomTatNhatKy,
  tuyChonTuThongSo, type DongBanCan, type KetQuaNhatKy, type SuKienCan, type TomTatNhatKy,
} from './bao-cao-can.ts';
import {
  LoiThongSo, NHOM_THONG_SO, PHIM_CHU_TOI_DA, THONG_SO, docPhim, docThongSo, fileNho,
  suaPhim as suaPhimTrongFile, suaThongSo as suaThongSoTrongFile, type MucThongSo, type PhimXem,
} from './thong-so.ts';
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

/**
 * BEEFTOWN_CAN_DU_LIEU đặt thẳng thư mục dữ liệu (kiểm thử dùng). Không có nó thì
 * hỏi Windows thư mục Tài liệu — Windows không theo USERPROFILE, nên kiểm thử chỉ
 * đổi USERPROFILE vẫn ghi vào Tài liệu thật (đã ghi đè file gốc thật 29/09/2026).
 */
export function duongDanMacDinh(): DuongDan {
  const appData = process.env.APPDATA;
  const duLieu = process.env.BEEFTOWN_CAN_DU_LIEU?.trim();
  return {
    cauHinh: appData ? path.join(appData, 'BeeftownCan') : path.join(os.homedir(), '.beeftown-can'),
    duLieu: duLieu ? path.resolve(duLieu) : path.join(thuMucTaiLieu(), 'Beeftown Can'),
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
  /** Cổng hai chiều của cân (Spec166, thường 33581) — đọc thông tin, giờ, nhật ký, xoá qua WiFi. Chưa thử trên cân thật. */
  congHaiChieu?: number;
  /**
   * Mã máy cân báo khi bắt tay qua cổng hai chiều (MAC / INM) — nhớ ở lần nối đầu tới địa chỉ đang dùng; lần sau cân ở
   * địa chỉ đó báo mã khác (quán có hai cân, router phát địa chỉ cho cân khác) thì không làm gì. Để riêng với macCan (bảng
   * ARP của mô-đun WiFi) vì hai mã có thể khác nhau.
   */
  macHaiChieu?: string;
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
  /**
   * Dấu của kế hoạch này (hàng còn nằm lại + các dòng PLU sẽ gửi). Xoá qua WiFi phải gửi kèm: kho / cân đổi sau lúc
   * xem thì kế hoạch lúc bấm khác cái người đã xem → không xoá.
   */
  dauVan: string;
  /** Số dòng đổi hạn dùng (HSD) trên cân, kể cả hàng mới lần đầu in HSD (demDoiHsd) — tự gửi và xoá qua WiFi không mang theo. */
  doiHsd: number;
  /** Lần xoá qua WiFi hỏng sau khi đã gửi lệnh xoá: cân có thể đang thiếu hàng (null: không có). */
  canChuaRo: CanChuaRo | null;
}

/** Dấu "hàng trên cân chưa rõ" (can-chua-ro.json): xoá qua WiFi hỏng sau khi đã gửi lệnh xoá cả danh sách. */
export interface CanChuaRo { luc: string; cau: string }

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
  /** Hạn dùng đang ghi trên cân: số ngày, null = không in. Không có khoá: chưa biết (hàng chưa lên cân, dòng còn nằm lại). */
  hsd?: number | null;
  /** Hạn dùng kho muốn — chỉ khi kho quản HSD của hàng (han_dung_ngay). */
  hsdKho?: number | null;
}
export interface TatCaHang {
  hang: HangXem[]; coKho: boolean; loiKho: string | null;
  /** Xoá qua WiFi hỏng giữa chừng: "khớp kho" ở đây là so với file gốc, cân thật có thể đang thiếu hàng. */
  canChuaRo: CanChuaRo | null;
}

// -----------------------------------------------------------------------------
// BẢN 2.2: KIỂU TRẢ VỀ CHO TRANG
// -----------------------------------------------------------------------------
export interface ThongTinHaiChieu {
  thongTin: ThongTinCan;
  /** Giờ trên cân lúc hỏi. */
  gio: GioCan;
  /** Giờ máy tính lúc đó, 'YYYY-MM-DD HH:mm:ss'. */
  gioMay: string;
  /** Giờ cân − giờ máy tính, giây. */
  lechGiay: number;
  ip: string;
  cong: number;
}

export interface KetQuaChinhGio {
  /** Đường đã đặt giờ: 33581 (cân báo lại giờ mới) hay 33571 (gửi một chiều, cân không trả lời). */
  cach: '33581' | '33571';
  gio: GioCan;
  /** Cân đã báo lại đúng giờ vừa đặt (chỉ đường 33581). */
  daXacNhan: boolean;
  /** Vì sao cổng 33581 không được (khi đã đi đường 33571). */
  loiHaiChieu: string | null;
  doiDiaChi: DoiDiaChi | null;
}

export type NguonNhatKy = 'luu' | 'file' | 'wifi';
export interface NhatKyXem {
  nguon: NguonNhatKy;
  /** Lần đọc vừa rồi (null khi chỉ xem nhật ký đã lưu). */
  doc: { soDong: number; soMoi: number; loi: string[]; suKien: SuKienCan[]; mac: string; tuFid: number | null } | null;
  tomTat: TomTatNhatKy;
  /** Dòng trong khoảng ngày, mới nhất trước, tối đa DONG_NHAT_KY_TOI_DA. */
  dong: (DongBanCan & { ghiChu: string })[];
  soDongTrongKhoang: number;
  tongDaLuu: number;
  tu: string;
  den: string;
}

export interface ThongSoXem {
  muc: (MucThongSo & { giaTri: string | null })[];
  nhom: readonly string[];
  phienBan: string;
}

export interface PhimXemHang extends PhimXem { ten: string | null; maCan: string | null }

/** Kế hoạch gửi dựng từ file gốc + kho (UngDung.dung): file sẽ gửi (du, moi) và hàng sẽ còn nằm lại trên cân (conLai). */
interface KeHoachGui {
  goc: FileCan; kh: KeHoach; du: Uint8Array; moi: FileCan;
  tren: Map<number, HangTrenCan>; conLai: HangTrenCan[];
}

/** Trang chỉ nhận tối đa chừng này dòng nhật ký một lần (bảng dài hơn thì tải CSV). */
const DONG_NHAT_KY_TOI_DA = 3000;

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
  /** Tài liệu\Beeftown Can\nhat-ky-can.tsv — nhật ký bán của cân đã đọc (bao-cao-can.ts). */
  readonly fileNhatKy: string;
  /** Tài liệu\Beeftown Can\can-chua-ro.json — xoá qua WiFi hỏng sau khi đã gửi lệnh xoá (CanChuaRo). */
  readonly fileCanChuaRo: string;
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
      /** Kiểm thử: thời gian chờ của giao thức hai chiều (cổng 33581) — ngắn hơn 30 giây của hãng. */
      tuyHaiChieu?: TuyChonKetNoi;
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
    this.fileNhatKy = path.join(dd.duLieu, 'nhat-ky-can.tsv');
    this.fileCanChuaRo = path.join(dd.duLieu, 'can-chua-ro.json');
  }

  // ---- cấu hình --------------------------------------------------------------
  cauHinh(): CauHinh { return docJson(this.fileCauHinh, CAU_HINH_MAC_DINH); }

  /** congHaiChieu: null = xoá trống ô → về mặc định (33581); undefined = không đổi. */
  luuCauHinh(moi: Partial<Omit<CauHinh, 'congHaiChieu'>> & { congHaiChieu?: number | null }): CauHinh {
    const cu = this.cauHinh();
    const ip = String(moi.ipCan ?? cu.ipCan).trim();
    if (!LA_IP.test(ip)) throw new LoiCan('Địa chỉ cân phải có dạng 192.168.1.22.');
    const cong = Number(moi.congCan ?? cu.congCan);
    if (!Number.isInteger(cong) || cong < 1 || cong > 65535) throw new LoiCan('Cổng của cân là một số, thường là 33571.');
    let kho = String(moi.diaChiKho ?? cu.diaChiKho).trim().replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(kho)) kho = 'https://' + kho;
    const doiKho = kho !== cu.diaChiKho;
    const congHc = moi.congHaiChieu === undefined || moi.congHaiChieu === null ? moi.congHaiChieu : Number(moi.congHaiChieu);
    if (typeof congHc === 'number' && (!Number.isInteger(congHc) || congHc < 1 || congHc > 65535)) {
      throw new LoiCan('Cổng hai chiều của cân là một số, thường là 33581.');
    }
    const kq: CauHinh = {
      ...cu, ipCan: ip, congCan: cong, diaChiKho: kho,
      ...(moi.chiNhanhId !== undefined ? { chiNhanhId: moi.chiNhanhId || undefined } : {}),
      ...(moi.tuGui !== undefined ? { tuGui: moi.tuGui === true } : {}),
      ...(typeof congHc === 'number' ? { congHaiChieu: congHc } : {}),
    };
    if (congHc === null) delete kq.congHaiChieu;
    if (doiKho) { delete kq.supabaseUrl; delete kq.anonKey; this.client = null; }
    // Người chọn cân khác: mã máy cũ không còn đúng — lần nối được tới sẽ nhớ lại.
    if (ip !== cu.ipCan) delete kq.macCan;
    // Mã máy cổng hai chiều: quên cả khi người gõ lại đúng địa chỉ cũ rồi Lưu (vừa thay cân, cân mới nhận lại địa chỉ đó) —
    // chỉ người chọn cân mới quên được; địa chỉ tự đổi khi dò WiFi (ghiDoiDiaChi) thì vẫn là cân đó, giữ mã.
    if (ip !== cu.ipCan || moi.ipCan !== undefined) delete kq.macHaiChieu;
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

  /** Ghi file gốc, và một bản vào da-gui (`daGui`: đúng thứ đã gửi — file nhỏ thông số / phím; mặc định = file gốc). */
  private luuGoc(du: Uint8Array, daGui: Uint8Array = du) {
    fs.mkdirSync(this.thuMucDaGui, { recursive: true });
    fs.writeFileSync(this.fileGoc, du);
    const luc = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    const ten = `${luc.getFullYear()}${p(luc.getMonth() + 1)}${p(luc.getDate())}-${p(luc.getHours())}${p(luc.getMinutes())}${p(luc.getSeconds())}.TMS`;
    fs.writeFileSync(path.join(this.thuMucDaGui, ten), daGui);
  }

  // ---- dấu "hàng trên cân chưa rõ" (xoá qua WiFi hỏng giữa chừng) ------------------
  /** Dấu còn đó (xoá qua WiFi hỏng sau khi đã gửi lệnh xoá) — null nếu không có. */
  canChuaRo(): CanChuaRo | null {
    const macDinh: CanChuaRo = { luc: '', cau: 'Lần xoá qua WiFi trước hỏng giữa chừng — cân có thể thiếu hàng, nạp USB ngay.' };
    let chu: string;
    try { chu = fs.readFileSync(this.fileCanChuaRo, 'utf8'); }
    catch (e) { return (e as { code?: string })?.code === 'ENOENT' ? null : macDinh; }   // không có file: không có dấu
    // File hỏng (sửa tay…) vẫn coi là còn dấu — không báo "khớp" khi không chắc.
    try {
      const j = JSON.parse(chu) as Partial<CanChuaRo>;
      return typeof j.luc === 'string' && typeof j.cau === 'string' ? { luc: j.luc, cau: j.cau } : macDinh;
    } catch { return macDinh; }
  }
  private ghiCanChuaRo(loi: string) {
    ghiJson(this.fileCanChuaRo, { luc: new Date().toISOString(), cau: `Xoá qua WiFi hỏng sau khi đã gửi lệnh xoá cả danh sách hàng: ${loi}` } satisfies CanChuaRo);
  }
  /** Cân vừa nhận đủ danh sách (ghi nhận file từ cân / đã nạp USB, gửi đủ danh sách, xoá qua WiFi đọc lại khớp). */
  private xoaCanChuaRo() { fs.rmSync(this.fileCanChuaRo, { force: true }); }

  /**
   * File vừa lưu từ cân ra USB (hoặc vừa nạp bằng USB, hoặc đọc qua WiFi): cân đang có ĐÚNG file này.
   * File có nhật ký bán (phần REP — lưu ra USB bằng Amend) thì gộp ngay vào nhat-ky-can.tsv: lần gửi sau
   * bỏ phần REP khỏi file gốc, và tên hàng trong nhật ký là tên lúc đọc — đọc sớm thì đúng hơn.
   * Nhật ký gộp hỏng không chặn việc ghi nhận file, nhưng trả câu lỗi (nhatKy.loi) để trang báo.
   * File của phần mềm hãng có lệnh xoá bảng (CLR, tích "Clear Data") không nhận: file gốc đi xuống cân ở mọi lần gửi.
   */
  ghiNhanFileTuCan(du: Uint8Array): { soHang: number; phienBan: string; nhatKy: { soDong: number; soMoi: number } | { loi: string } | null } {
    const f = docFileCan(du);   // ném LoiFileCan nếu không phải file cân, hay file TM-xA có CLR TMS / TMT…
    if (f.dong.some(d => d.startsWith('CLR\t'))) {
      throw new LoiFileCan('File này có lệnh xoá cả danh sách hàng (CLR — phần mềm của hãng tích "Clear Data"), không phải dữ liệu cân tự lưu. '
        + 'Trên cân lưu dữ liệu ra USB (Amend) rồi chọn file A_000.TMS trong thư mục JHSCALE.');
    }
    this.luuGoc(du);
    this.ghiTrenCan(hangTuFile(f));
    this.xoaCanChuaRo();
    let nhatKy: { soDong: number; soMoi: number } | { loi: string } | null = null;
    if (f.dong.some(d => d.startsWith('REP\t'))) {
      try {
        const kq = this.nhatKyCuaFile(f);
        nhatKy = { soDong: kq.dong.length, soMoi: this.gopVaoNhatKy(kq.dong).soMoi };
      } catch (e) {
        // File đã ghi nhận nhưng nhật ký CHƯA gộp (thường vì nhat-ky-can.tsv đang mở trong Excel). Lấy lại: đóng file
        // nhat-ky-can.tsv rồi bấm "Đọc từ file gốc" ở thẻ Nhật ký cân TRƯỚC lần gửi xuống cân sau (gửi xong file gốc
        // không còn phần REP), hoặc lưu lại từ cân ra USB bằng [Amend].
        nhatKy = { loi: cauLoi(e) };
      }
    }
    return { soHang: f.plu.length, phienBan: f.phienBan, nhatKy };
  }

  // ---- xem trước, gửi --------------------------------------------------------
  private docGoc(): Uint8Array {
    if (!this.coFileGoc()) throw new LoiCan('Chưa có file gốc của cân. Làm bước "Bắt đầu" trước.');
    return new Uint8Array(fs.readFileSync(this.fileGoc));
  }

  private async dung(giuHangNgoaiKho: boolean): Promise<KeHoachGui> {
    const goc = docFileCan(this.docGoc());
    const dm = await this.layDanhMuc();
    // boPhanChiDoc: không bao giờ gửi lại nhật ký bán (REP) / thông tin máy (INF) cũ xuống cân (2.2).
    const tuy = { giuHangNgoaiKho, giuGioCan: true, soChuSoMa: soChuSoMa(dm.mauMaVach), boPhanChiDoc: true };
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
      dauVan: dauKeHoach(conLai, moi), doiHsd: demDoiHsd(kh.dong, goc), canChuaRo: this.canChuaRo(),
    };
  }

  /**
   * Gửi một kế hoạch đã dựng (dung) qua 33571 rồi ghi nhận. Tự gửi dùng thẳng kế hoạch nó vừa kiểm — không đọc kho
   * lần hai (kho đổi giữa hai lần đọc thì thứ gửi đi khác thứ đã kiểm). Gửi đủ danh sách → hết dấu "chưa rõ".
   */
  private async guiKeHoach(p: KeHoachGui, timLai: boolean): Promise<{ soHang: number; conLai: HangTrenCan[]; doiDiaChi: DoiDiaChi | null }> {
    const { du, moi, tren } = p;
    const doiDiaChi = await this.guiDenCan(du, timLai);
    // Cân chỉ thêm / sửa: dòng cũ vẫn nằm lại.
    for (const [so, h] of hangTuFile(moi)) tren.set(so, h);
    this.luuGoc(du);
    this.ghiTrenCan(tren);
    this.xoaCanChuaRo();
    const soMoi = new Set(moi.plu.map(x => x.so));
    return { soHang: moi.plu.length, conLai: [...tren.values()].filter(h => !soMoi.has(h.so)), doiDiaChi };
  }

  /** `timLai: false` — nối cân không được thì báo luôn, không dò WiFi (xem guiDenCan). */
  guiXuongCan(giuHangNgoaiKho = false, timLai = true): Promise<{ soHang: number; conLai: HangTrenCan[]; doiDiaChi: DoiDiaChi | null }> {
    return this.motLuc(async () => this.guiKeHoach(await this.dung(giuHangNgoaiKho), timLai));
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
      // Kiểm và gửi trong CÙNG một việc của hàng đợi, trên CÙNG một lần đọc kho: đọc kho hai lần (kiểm rồi mới gửi) thì
      // kho đổi HSD giữa hai lần vẫn lọt xuống cân mà không ai xem.
      this.lanTuGui = await this.motLuc(async (): Promise<LanTuGui> => {
        const p = await this.dung(false);
        const chuaRo = this.canChuaRo();
        // Đổi hạn dùng (HSD) của hàng trên cân, hay hàng mới bật in HSD khi cân chưa in HSD hàng nào (lần đầu là bật in HSD
        // cho cả loạt hàng): tem in khác hẳn, và cân in HSD ra sao chưa thử trên cân thật → không tự gửi, để quản lý xem
        // trước rồi bấm Gửi.
        const doiHsd = demDoiHsd(p.kh.dong, p.goc);
        if (doiHsd > 0) {
          return { luc, daGui: false, cau: (chuaRo ? 'Lần xoá qua WiFi trước hỏng giữa chừng — cân có thể thiếu hàng, nạp USB ngay. ' : '')
            + `Kho đổi hạn dùng (HSD) của ${doiHsd} hàng (hàng trên cân, hay hàng mới lần đầu in HSD) — tự gửi không gửi thay đổi HSD. `
            + 'Mở thẻ Gửi giá từ kho, xem lại rồi bấm Gửi xuống cân (in HSD chưa thử trên cân thật).' };
        }
        // Xoá qua WiFi hỏng giữa chừng: file gốc không nói được cân đang có gì — không bao giờ báo "khớp kho"; gửi lại cả
        // danh sách qua 33571 (cân thêm / sửa theo số PLU nên đặt lại mọi hàng lệnh xoá có thể đã xoá).
        if (!chuaRo && p.kh.dem.them + p.kh.dem.sua === 0) return { luc, daGui: false, cau: 'Cân đã khớp kho.' };
        const k = await this.guiKeHoach(p, Date.now() - this.lanDoHong >= DO_LAI_SAU_MS);
        const diaChi = k.doiDiaChi ? ` — cân đổi địa chỉ, đã tìm thấy ở ${k.doiDiaChi.den}.` : '.';
        if (chuaRo) {
          return { luc, daGui: true, cau: `Đã gửi lại cả danh sách ${k.soHang} hàng sau lần xoá qua WiFi hỏng — vẫn nên nạp USB để chắc cân đủ hàng`
            + diaChi };
        }
        return { luc, daGui: true, cau: `Đã tự gửi ${p.kh.dem.them} thêm, ${p.kh.dem.sua} sửa (${k.soHang} hàng)` + diaChi };
      });
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

  /**
   * File nạp USB từ file gốc (2.2): đường lui khi gửi thông số / phím / tem / giờ qua WiFi mà cân chưa đổi — file gốc
   * đã có sẵn thay đổi vừa gửi. Kèm thay đổi thông số / phím ĐANG SỬA trên trang mà chưa gửi (`thongSo`, `phim` — gửi
   * WiFi hỏng thì đi USB luôn): chỉ vào file USB, KHÔNG ghi file gốc — "Tôi đã nạp USB xong" (daNapUsb) mới ghi nhận.
   * Bỏ phần giờ, nhật ký bán, thông tin máy như mọi lần gửi.
   */
  async taoFileUsbGoc(b: { thongSo?: unknown; phim?: unknown } = {}): Promise<{
    duongDan: string; soHang: number; thongSo: number[]; phim: { trang: number; phim: number }[];
  }> {
    await this.kiemQuyenCan('Lưu file nạp USB');
    const thay: Record<string, string | number> = {};
    if (laDoiTuong(b.thongSo)) {
      for (const [k, v] of Object.entries(b.thongSo)) if (typeof v === 'string' || typeof v === 'number') thay[k] = v;
    }
    const thayPhim = (Array.isArray(b.phim) ? b.phim : []).filter(laDoiTuong).slice(0, 300)
      .map(t => ({ trang: Number(t.trang), phim: Number(t.phim), plu: Number(t.plu) }));
    let du = this.docGoc();
    let doiTs: number[] = [], doiPhim: { trang: number; phim: number }[] = [];
    if (Object.keys(thay).length) ({ du, doi: doiTs } = suaThongSoTrongFile(du, thay));
    if (thayPhim.length) ({ du, doi: doiPhim } = suaPhimTrongFile(du, thayPhim));
    const goc = docFileCan(du);
    const ra = ghiFileCan(goc, KHONG_DOI, { giuGioCan: true, boPhanChiDoc: true });
    fs.mkdirSync(path.dirname(this.fileChoUsb), { recursive: true });
    fs.writeFileSync(this.fileChoUsb, ra);
    fs.rmSync(this.fileDaTatChoUsb, { force: true });
    return { duongDan: this.fileChoUsb, soHang: goc.plu.length, thongSo: doiTs, phim: doiPhim };
  }

  // ---- tất cả hàng -------------------------------------------------------------
  /** Mọi hàng trên cân (theo file gốc và tren-can.tsv), đối chiếu kho nếu đã đăng nhập. */
  async tatCaHang(): Promise<TatCaHang> {
    const goc = docFileCan(this.docGoc());
    const phim = phimTheoPlu(goc);
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
        // HSD: đang ghi trên cân (dòng gốc), và kho muốn (chỉ khi kho quản HSD của hàng).
        const hsd = { ...(d.goc ? { hsd: d.goc.hsd } : {}), ...(d.hsd !== undefined ? { hsdKho: d.hsd } : {}) };
        if (d.loai === 'them') hang.push({ ...base, ...hsd, so: null, ten: d.ten, gia: d.gia, theoGoi: false, tinhTrang: 'chua_len', tenKho: d.ten, giaKho: d.gia });
        else if (d.loai === 'bo_qua') hang.push({ ...base, so: null, ten: d.ten, gia: d.gia, theoGoi: false, tinhTrang: 'khong_len', ghiChu: d.lyDo });
        else if (d.loai === 'xoa') hang.push({ ...base, ...hsd, so: d.so, ten: d.ten, gia: d.gia, theoGoi: theoGoi.get(d.so!) ?? false, tinhTrang: 'ngoai_kho', ghiChu: d.lyDo });
        else if (d.loai === 'sua') {
          hang.push({ ...base, ...hsd, so: d.so, ten: d.tenCu ?? d.ten, gia: d.giaCu ?? null, theoGoi: theoGoi.get(d.so!) ?? false, tinhTrang: 'lech',
            tenKho: d.ten, giaKho: d.gia });
        } else {
          hang.push({ ...base, ...hsd, so: d.so, ten: d.ten, gia: d.gia, theoGoi: theoGoi.get(d.so!) ?? false,
            tinhTrang: d.lyDo ? 'lech' : 'khop', ghiChu: d.lyDo });
        }
      }
    } else {
      for (const p of goc.plu) {
        hang.push({ so: p.so, phim: phim.get(p.so) ?? null, maCan: p.ma, maFabi: fabi(p.ma), ten: p.ten, gia: p.gia,
          theoGoi: p.cachBan === '2', tinhTrang: 'tren_can', hsd: p.hsd });
      }
    }

    const trongFile = new Set(goc.plu.map(p => p.so));
    for (const h of this.docTrenCan().values()) {
      if (trongFile.has(h.so)) continue;
      hang.push({ so: h.so, phim: null, maCan: h.ma, maFabi: fabi(h.ma), ten: h.ten, gia: giaTuFile(h.gia, goc.soLeGia),
        theoGoi: false, tinhTrang: 'con_lai', ghiChu: 'Đã bỏ khỏi danh sách nhưng gửi qua WiFi không xoá được — nạp USB để xoá hẳn.' });
    }
    hang.sort((a, b) => (a.so ?? Infinity) - (b.so ?? Infinity) || Number(a.maCan) - Number(b.maCan));
    return { hang, coKho: dm !== null, loiKho, canChuaRo: this.canChuaRo() };
  }

  // ---- mẫu tem -----------------------------------------------------------------
  private docDaTat(): DaTat { return docJson<DaTat>(this.fileDaTat, {}); }

  /**
   * Mẫu tem cân đang dùng, một hàng trên cân để vẽ tem mẫu, và (2.2) danh mục để sửa tem (ô thêm được, cỡ chữ,
   * điều kiện in, canh, xoay), các ô nên đổi sang "chỉ in khi có HSD" (goiYHsd), kiểu ngày in (Spec104).
   */
  tem(): {
    tem: TemXem | null;
    hangMau: { so: number; ten: string; gia: number | null; theoGoi: boolean; hsd: number | null; maCan: string } | null;
    danhMuc: { oThem: typeof O_THEM_DUOC; coChu: typeof CO_CHU; dieuKienIn: typeof DIEU_KIEN_IN; canhChu: typeof CANH_CHU; xoay: typeof XOAY };
    goiYHsd: string[];
    kieuNgay: number;
    /** Dấu mẫu tem (dauTem) — trang gửi lại kèm thay đổi; mẫu tem đã đổi từ lúc mở thẻ thì không áp thay đổi cũ. */
    dau: string;
  } {
    const goc = docFileCan(this.docGoc());
    const daTat = this.docDaTat();
    const p = goc.plu.filter(x => x.ten).sort((a, b) => a.so - b.so)[0];
    const k = Number(docThongSo(goc).get(104));
    return {
      tem: xemTem(goc, daTat),
      hangMau: p ? { so: p.so, ten: p.ten, gia: p.gia, theoGoi: p.cachBan === '2', hsd: p.hsd, maCan: p.ma } : null,
      danhMuc: { oThem: O_THEM_DUOC, coChu: CO_CHU, dieuKienIn: DIEU_KIEN_IN, canhChu: CANH_CHU, xoay: XOAY },
      goiYHsd: goiYHsd(goc, daTat),
      kieuNgay: Number.isInteger(k) ? k : 0,
      dau: dauTem(goc, daTat),
    };
  }

  /**
   * File để gửi: file gốc với tem đã sửa, bỏ phần giờ, nhật ký bán, thông tin máy. PLU giữ nguyên. Thay đổi phải
   * kèm dấu mẫu tem lúc trang mở (thay.dau): khoá "o:i" chỉ đúng với mẫu đó — bấm gửi lần hai (mẫu đã đổi sau lần
   * một), thẻ khác vừa gửi, vừa cập nhật file gốc thì áp vào sẽ tắt / dời nhầm ô → từ chối.
   */
  private dungTem(thay: ThayDoiTem): { du: Uint8Array; daTat: DaTat; canhBao: string[] } {
    const goc = this.docGoc(), daTat = this.docDaTat();
    if (typeof thay.dau !== 'string' || thay.dau === '' || thay.dau !== dauTem(docFileCan(goc), daTat)) throw new LoiCan(CAU_DOI);
    let kq;
    try { kq = suaTem(goc, daTat, thay); }
    catch (e) { if (e instanceof LoiTem) throw new LoiCan(e.message); throw e; }
    if (!kq.coDoi) throw new LoiCan('Tem chưa có gì thay đổi.');
    return { du: ghiFileCan(docFileCan(kq.du), KHONG_DOI, { giuGioCan: true, boPhanChiDoc: true }), daTat: kq.daTat, canhBao: kq.canhBao };
  }

  async guiTem(thay: ThayDoiTem): Promise<{ ok: true; doiDiaChi: DoiDiaChi | null; canhBao: string[] }> {
    await this.kiemQuyenCan('Sửa tem');
    return this.motLuc(async () => {
      const { du, daTat, canhBao } = this.dungTem(thay);
      const doiDiaChi = await this.guiDenCan(du);
      this.luuGoc(du);
      ghiJson(this.fileDaTat, daTat);
      return { ok: true as const, doiDiaChi, canhBao };
    });
  }

  async taoFileUsbTem(thay: ThayDoiTem): Promise<{ duongDan: string; soHang: number; canhBao: string[] }> {
    await this.kiemQuyenCan('Sửa tem');
    const { du, daTat, canhBao } = this.dungTem(thay);
    fs.mkdirSync(path.dirname(this.fileChoUsb), { recursive: true });
    fs.writeFileSync(this.fileChoUsb, du);
    ghiJson(this.fileDaTatChoUsb, daTat);
    return { duongDan: this.fileChoUsb, soHang: docFileCan(du).plu.length, canhBao };
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

  // ---- 2.2: quyền --------------------------------------------------------------------
  /**
   * Việc với cân của bản 2.2 (cổng hai chiều, thông số, giờ, phím, sửa tem, xoá qua WiFi, nhật ký cân) theo
   * quy tắc thẻ Mẫu tem / Gửi giá: chưa đăng nhập kho thì làm được (máy của quản lý chạy không cần kho); đã
   * đăng nhập mà vai không có danh_muc (NV quầy, thủ kho, kế toán) → từ chối. Không đọc được người đăng nhập
   * (mất mạng) coi như chưa đăng nhập — như khi đăng xuất; việc với cân vẫn chạy được không cần internet.
   */
  private async kiemQuyenCan(viec: string): Promise<void> {
    let nd: NguoiDung | null = null;
    try { nd = await this.nguoiDung(); } catch { nd = null; }
    if (nd && !nd.quyen.danhMuc) throw new LoiCan(`${viec} chỉ dành cho quản lý hoặc chủ.`);
  }

  // ---- 2.2: cổng hai chiều 33581 (giao-thuc.ts) — CHƯA THỬ TRÊN CÂN THẬT ----------------
  /**
   * Chạy việc qua cổng hai chiều ở địa chỉ cân. Nối không được (chưa gửi byte nào): hỏi cổng 33571 ở địa chỉ
   * cũ, không thông thì dò WiFi (thuCan) — cân ở địa chỉ mới thì thử lại một lần ở đó. Cân vẫn ở địa chỉ cũ
   * mà cổng hai chiều không mở: báo đúng lỗi của giao-thuc.ts (câu đó đã chỉ đường USB).
   */
  private async quaHaiChieu<T>(viec: (ip: string, cong: number, tuy: TuyChonKetNoi) => Promise<T>): Promise<T> {
    const ch = this.cauHinh();
    const cong = ch.congHaiChieu ?? CONG_HAI_CHIEU;
    const tuy = this.phu.tuyHaiChieu ?? {};
    try {
      return await viec(ch.ipCan, cong, tuy);
    } catch (e) {
      if (!(e instanceof LoiGiaoThuc) || e.loai !== 'khong-noi') throw e;
      const kq = await this.thuCan();
      if (!kq.thongCan || kq.ipCan === ch.ipCan) throw e;
      return await viec(kq.ipCan, cong, tuy);
    }
  }

  /**
   * Cân vừa bắt tay qua cổng hai chiều có đúng là cân chương trình vẫn dùng không (mã máy MAC / INM). Chưa nhớ mã và đây
   * là địa chỉ đang dùng: nhớ lại. Mã khác: ném 'khong-cho-phep' — chưa làm gì với cân này (quán có hai cân, router phát
   * địa chỉ cho cân khác, lần thử lại sau dò WiFi rơi vào cân khác).
   */
  private kiemMayHaiChieu(mac: string, ip: string, cong: number): void {
    const ch = this.cauHinh();
    const nho = ch.macHaiChieu;
    if (nho && mac !== nho) {
      throw new LoiGiaoThuc(`Cân ở ${ip} (cổng ${cong}) có mã máy ${mac}, không phải cân chương trình vẫn dùng (${nho}) — chưa đọc, chưa gửi, `
        + 'chưa ghi nhận gì. Quán có hai cân hay router vừa đổi địa chỉ: trên cân bấm Prog → 4 → 2 xem địa chỉ, rồi chọn đúng cân ở '
        + 'Cài đặt → Tìm cân. Vừa thay cân: ở Cài đặt gõ lại địa chỉ cân rồi bấm Lưu cài đặt.', 'khong-cho-phep');
    }
    if (!nho && mac && ch.ipCan === ip) this.ghiThem({ macHaiChieu: mac });
  }

  /** Mở một kết nối hai chiều, kiểm đúng cân (kiemMayHaiChieu), làm việc, đóng (kể cả khi hỏng). */
  private voiKetNoi<T>(viec: (kn: KetNoiCan, ip: string, cong: number) => Promise<T>): Promise<T> {
    return this.quaHaiChieu(async (ip, cong, tuy) => {
      const kn = await moKetNoi(ip, cong, tuy);
      try {
        this.kiemMayHaiChieu(kn.thongTin.mac, ip, cong);
        return await viec(kn, ip, cong);
      } finally { kn.dong(); }
    });
  }

  /** Thông tin cân + giờ trên cân qua cổng 33581 — chỉ đọc, không ghi gì; việc nên thử đầu tiên ở quán. */
  async thongTinCanHaiChieu(): Promise<ThongTinHaiChieu> {
    await this.kiemQuyenCan('Đọc thông tin cân qua WiFi');
    return this.motLuc(() => this.voiKetNoi(async (kn, ip, cong) => {
      const gio = await kn.docGio();
      const may = new Date();
      return { thongTin: kn.thongTin, gio, gioMay: chuoiGio(gioTuMay(may)), lechGiay: lechGiay(gio, may), ip, cong };
    }));
  }

  /**
   * Đọc dữ liệu cân qua WiFi (TMS, TMT, SCP, DPT, CLS, PLU, BAR, LAB) — thay bước USB "Bắt đầu" / "Cập nhật
   * file gốc từ cân". Chỉ ghi nhận khi file ghép lại đọc được (ghiNhanFileTuCan gọi docFileCan, hỏng thì ném
   * LoiFileCan và không ghi gì). Không có cài đặt mạng (docTuCan bỏ TMT 15/16/19, thông số mạng).
   * Không ghi nhận khi: cân khác mã máy (kiemMayHaiChieu); cân trả 0 hàng hay 0 thông số (cổng chưa thử này trả dạng
   * lạ / lệch dòng — ghi nhận thì file gốc rỗng, lần gửi sau đè hàng mới lên PLU 1, 2, 3… đang có trên cân); hay thiếu PLU
   * chương trình biết là đang nằm trên cân (tren-can.tsv) — dùng USB để cập nhật file gốc.
   */
  async docTuCanQuaWifi(): Promise<{ soHang: number; phienBan: string; thongTin: ThongTinCan }> {
    await this.kiemQuyenCan('Đọc dữ liệu từ cân');
    return this.motLuc(async () => {
      const { thongTin, du } = await this.quaHaiChieu(async (ip, cong, tuy) => {
        const r = await docTuCan(ip, cong, tuy);
        this.kiemMayHaiChieu(r.thongTin.mac, ip, cong);
        return r;
      });
      const f = docFileCan(du);
      const soTms = f.dong.filter(d => d.startsWith('TMS\t')).length;
      if (!f.plu.length || !soTms) {
        throw new LoiCan(`Đọc qua WiFi (cổng hai chiều — chưa thử trên cân thật) được ${f.plu.length} hàng, ${soTms} thông số — không tin được `
          + 'là cân trống. Chương trình chưa ghi nhận gì; dùng USB: trên cân lưu dữ liệu ra USB rồi đưa file A_000.TMS vào chương trình.');
      }
      if (this.coFileGoc()) {
        const coSo = new Set(f.plu.map(p => p.so));
        const mat = [...this.docTrenCan().keys()].filter(so => !coSo.has(so)).sort((a, b) => a - b);
        if (mat.length) {
          throw new LoiCan(`Đọc qua WiFi (cổng hai chiều — chưa thử trên cân thật) thiếu ${mat.length} hàng đang có trên cân `
            + `(PLU ${mat.slice(0, 8).join(', ')}${mat.length > 8 ? '…' : ''}). Chương trình chưa ghi nhận gì; dùng USB để cập nhật file gốc: `
            + 'trên cân lưu dữ liệu ra USB rồi chọn file đó ở Cài đặt → Cập nhật file gốc từ cân.');
        }
      }
      const kq = this.ghiNhanFileTuCan(du);
      return { soHang: kq.soHang, phienBan: kq.phienBan, thongTin };
    });
  }

  /**
   * Xoá hẳn hàng "còn nằm lại" qua WiFi — THỬ, CHƯA THỬ TRÊN CÂN THẬT. Cân không có lệnh xoá một PLU, nên:
   *   0. chỉ chạy đúng kế hoạch người đã xem (dauVan của xemTruoc), không mang thay đổi HSD chưa gửi, và chỉ với cân
   *      đã biết mã máy (bấm "Đọc thông tin cân" trước) — chưa nối cân nếu không đủ;
   *   1. đọc danh sách PLU qua cổng 33581 (chưa gửi gì) và KIỂM: cân trả rỗng, hay có PLU chương trình không biết
   *      (số + mã không có trong tren-can.tsv / file gốc: thêm trên bàn phím, phần mềm hãng, cân khác) → không xoá;
   *      lưu bản sao danh sách đó vào da-gui (truoc-xoa-wifi-….TMS) trước khi xoá;
   *   2. gửi CLR PLU + cả danh sách của kế hoạch (như nút Gửi xuống cân) + hàng rào UPL TIM;
   *   3. đọc lại danh sách PLU, so số PLU + mã cân với danh sách vừa gửi.
   * Khớp → file gốc = bản vừa gửi, tren-can.tsv = đúng danh sách đó. Không khớp hay hỏng sau khi đã gửi lệnh xoá →
   * báo lỗi chỉ đường USB, không ghi nhận gì, và ghi dấu "chưa rõ" (can-chua-ro.json): tự gửi, Tất cả hàng, Xem trước
   * không coi cân là khớp kho cho tới khi gửi đủ danh sách / nạp USB.
   */
  async xoaQuaWifi(giuHangNgoaiKho = false, dauVan?: unknown): Promise<{ soHang: number; daXoa: HangTrenCan[] }> {
    await this.kiemQuyenCan('Xoá hàng trên cân qua WiFi');
    if (typeof dauVan !== 'string' || !dauVan) {
      throw new LoiCan('Thiếu danh sách đã xem trước — bấm Xem lại (thẻ Gửi giá từ kho, hay "Xem hàng còn nằm lại") rồi thử lại. Chưa gửi gì xuống cân.');
    }
    return this.motLuc(async () => {
      const { goc, kh, du, moi, tren, conLai } = await this.dung(giuHangNgoaiKho);
      if (!conLai.length) throw new LoiCan('Không có hàng nào còn nằm lại trên cân — không cần xoá.');
      if (dauKeHoach(conLai, moi) !== dauVan) {
        throw new LoiCan('Danh sách trên cân hoặc trong kho đã đổi từ lúc xem trước — bấm Xem lại rồi thử lại. Chưa gửi gì xuống cân.');
      }
      if (demDoiHsd(kh.dong, goc) > 0) {
        throw new LoiCan('Kho có thay đổi hạn dùng (HSD) chưa gửi — gửi ở thẻ Gửi giá từ kho (xem trước, in thử tem) rồi mới xoá. Chưa gửi gì xuống cân.');
      }
      if (!this.cauHinh().macHaiChieu) {
        throw new LoiCan('Chưa biết mã máy của cân qua cổng hai chiều — bấm "Đọc thông tin cân" (thẻ Cân & thông số), xem đúng cân của quầy rồi mới xoá. '
          + 'Chưa gửi gì xuống cân.');
      }
      const khoi = khoiXoaVaNapPlu(moi.plu.map(p => p.tho));   // danh sách rỗng → LoiGiaoThuc, không xoá sạch cân
      const khoa = (so: number, ma: string) => `${so}\t${ma}`;
      const muon = new Set(moi.plu.map(p => khoa(p.so, p.ma)));
      // Cân phải đang có: hàng của file gốc và hàng còn nằm lại (tren-can.tsv) — số PLU và mã cân.
      const biet = new Map<number, string>(goc.plu.map(p => [p.so, p.ma]));
      for (const h of tren.values()) biet.set(h.so, chuanMa(h.ma));
      const ke = (ds: number[]) => ds.slice(0, 8).map(so => 'PLU ' + so).join(', ') + (ds.length > 8 ? '…' : '');
      let daGuiXoa = false;
      try {
        const docLai = await this.voiKetNoi(async (kn) => {
          const truoc = await kn.docPhan('PLU');
          const dongTruoc = truoc.map(d => d.split('\t')).filter(c => c[0] === 'PLU');
          if (!dongTruoc.length) {
            throw new LoiCan('Cân không trả danh sách hàng qua WiFi (cổng hai chiều — chưa thử trên cân thật) — không kiểm được cân đang có gì '
              + 'nên chưa gửi gì. Dùng "Lưu file để nạp USB".');
          }
          const la = dongTruoc.map(c => ({ so: parseInt(c[1], 10) || 0, ma: chuanMa(c[2]) }))
            .filter(x => biet.get(x.so) !== x.ma).map(x => x.so).sort((a, b) => a - b);
          if (la.length) {
            throw new LoiCan(`Cân đang có ${la.length} hàng chương trình không biết (${ke(la)}) — thêm trên bàn phím cân, bằng phần mềm của hãng, `
              + 'hay đây không phải cân vẫn dùng. Xoá qua WiFi sẽ xoá luôn các hàng này, nên chưa gửi gì xuống cân. Bấm "Đọc dữ liệu từ cân qua WiFi" '
              + '(hay cập nhật file gốc bằng USB) rồi xem lại.');
          }
          // Bản sao danh sách trên cân lúc này — nạp lại được bằng USB nếu lệnh xoá hỏng giữa chừng.
          fs.mkdirSync(this.thuMucDaGui, { recursive: true });
          fs.writeFileSync(path.join(this.thuMucDaGui, `truoc-xoa-wifi-${Date.now()}.TMS`), ghepFileUsb(goc.phienBan, { PLU: truoc }));
          daGuiXoa = true;
          await kn.ghi(khoi);
          return kn.docPhan('PLU');
        });
        const co = new Set(docLai.map(d => d.split('\t')).filter(c => c[0] === 'PLU').map(c => khoa(parseInt(c[1], 10) || 0, chuanMa(c[2]))));
        const thieu = [...muon].filter(k => !co.has(k)), thua = [...co].filter(k => !muon.has(k));
        if (thieu.length || thua.length) {
          const so = (ds: string[]) => ke(ds.map(k => Number(k.split('\t')[0])));
          throw new LoiCan(`Đã gửi lệnh xoá và cả danh sách ${moi.plu.length} hàng qua WiFi (cổng hai chiều — chưa thử trên cân thật) `
            + 'nhưng đọc lại thấy cân chưa đúng: '
            + [thieu.length ? `thiếu ${thieu.length} hàng (${so(thieu)})` : '', thua.length ? `thừa ${thua.length} hàng (${so(thua)})` : ''].filter(Boolean).join(', ')
            + '. Cân có thể đang thiếu hàng — nạp USB ngay: bấm "Lưu file để nạp USB" rồi nạp file vào cân. Chương trình chưa ghi nhận gì.');
        }
      } catch (e) {
        // Đã bắt đầu gửi lệnh xoá (trừ khi bị chặn trước khi gửi byte nào): cân có thể đang thiếu hàng.
        const chuaGui = e instanceof LoiGiaoThuc && e.loai === 'khong-cho-phep' && !e.daGhi;
        if (daGuiXoa && !chuaGui) {
          try { this.ghiCanChuaRo(cauLoi(e)); } catch { /* không ghi được dấu: câu lỗi dưới đây vẫn bảo nạp USB ngay */ }
        }
        throw e;
      }
      this.luuGoc(du);
      this.ghiTrenCan(hangTuFile(moi));
      this.xoaCanChuaRo();
      return { soHang: moi.plu.length, daXoa: conLai };
    });
  }

  // ---- 2.2: nhật ký bán của cân (bao-cao-can.ts) ----------------------------------------
  private docNhatKyDaLuu(): DongBanCan[] {
    let chu: string;
    try { chu = fs.readFileSync(this.fileNhatKy, 'utf8'); } catch { return []; }
    return docKhoNhatKy(chu);
  }

  /**
   * Gộp dòng mới vào nhat-ky-can.tsv (trùng khoá thì giữ bản cũ — gopNhatKy). Ghi file tạm rồi đổi tên: tắt
   * máy giữa chừng không làm hỏng file cũ. File cũ có dòng không đọc được (ví dụ sửa tay trong Excel) thì
   * giữ một bản sao trước khi ghi đè, để không mất dòng nào.
   */
  private gopVaoNhatKy(moi: DongBanCan[]): { soMoi: number } {
    let chuCu = '';
    try { chuCu = fs.readFileSync(this.fileNhatKy, 'utf8'); } catch { /* chưa có file */ }
    const cu = chuCu ? docKhoNhatKy(chuCu) : [];
    // Đếm dòng mới theo KHOÁ (không lấy hiệu số dòng): file đã có dòng trùng khoá (dán tay trong Excel, hai bản chương
    // trình cùng ghi) thì gộp bỏ bớt dòng cũ đúng bằng số dòng mới — hiệu số ra 0 và dòng bán mới không được ghi.
    const khoaCu = new Set(cu.map(khoaNhatKy));
    const soMoi = new Set(moi.map(khoaNhatKy).filter(k => !khoaCu.has(k))).size;
    if (chuCu && soMoi === 0) return { soMoi };
    const ds = gopNhatKy(cu, moi);
    fs.mkdirSync(this.dd.duLieu, { recursive: true });
    const soDongCu = chuCu.split(/\r?\n/).filter(d => d.trim() !== '').length - 1;   // bỏ dòng tiêu đề
    if (chuCu && soDongCu > cu.length) {
      fs.copyFileSync(this.fileNhatKy, this.fileNhatKy.replace(/\.tsv$/, `-ban-sao-${Date.now()}.tsv`));
    }
    const tam = this.fileNhatKy + '.tam';
    fs.writeFileSync(tam, ghiKhoNhatKy(ds), 'utf8');
    try { fs.renameSync(tam, this.fileNhatKy); } catch (e) {
      try { fs.rmSync(tam, { force: true }); } catch { /* thôi */ }
      throw new LoiCan(`Không ghi được ${this.fileNhatKy} (${(e as { code?: string })?.code ?? 'lỗi'}) — file có đang mở trong Excel không? `
        + 'Đóng file đó rồi làm lại; các dòng đã lưu trong file vẫn còn.');
    }
    return { soMoi };
  }

  /** Nhật ký trong một file cân: MAC ở dòng INM; file không có INM thì dùng mã máy cân đã nhớ (bảng ARP). */
  private nhatKyCuaFile(f: FileCan): KetQuaNhatKy {
    return nhatKyTuFile(f, macTuDong(f.dong) ? undefined : this.cauHinh().macCan);
  }

  /**
   * Nhật ký bán của cân. nguon 'luu': chỉ xem bản đã lưu. 'file': phần REP của file gốc (chỉ có khi file gốc
   * là file lưu từ cân ra USB — sau lần gửi đầu thì không còn; ghiNhanFileTuCan đã gộp sẵn lúc ghi nhận).
   * 'wifi': đọc qua cổng 33581 (UPL REP — chưa thử trên cân thật) TỪ giao dịch cuối đã lưu của cân này (kể cả
   * nó): còn thấy đúng giao dịch đó (cùng số, cùng giờ) thì cân chưa đếm lại; không thấy là cân đã đếm lại số giao
   * dịch từ 1 (xoá báo cáo A52 / P52x / E9.97, khởi tạo bộ nhớ) hay đã đẩy giao dịch cũ ra — đọc lại từ giao dịch 1
   * trên cùng kết nối, kèm câu báo (tuDau: đọc từ giao dịch 1 ngay). Gộp vào nhat-ky-can.tsv (khoá MAC + số + giờ +
   * SubID nên đọc lại không trùng). Mã cân gắn theo bảng PLU của cân LÚC ĐỌC: file → bảng PLU cùng file; WiFi → đọc
   * bảng PLU và thông số ngay sau nhật ký trên cùng kết nối (tên hàng trong nhật ký cũng là tên lúc đọc).
   */
  async nhatKyCan(b: { nguon?: unknown; tu?: unknown; den?: unknown; tuDau?: unknown } = {}): Promise<NhatKyXem> {
    await this.kiemQuyenCan('Nhật ký cân');
    const nguon: NguonNhatKy = b.nguon === 'wifi' ? 'wifi' : b.nguon === 'file' ? 'file' : 'luu';
    const { tu, den } = khoangNhatKy(b.tu, b.den);
    let doc: NhatKyXem['doc'] = null;
    if (nguon === 'file') {
      doc = await this.motLuc(async () => {
        const kq = this.nhatKyCuaFile(docFileCan(this.docGoc()));
        const { soMoi } = this.gopVaoNhatKy(kq.dong);
        return { soDong: kq.dong.length, soMoi, loi: kq.loi, suKien: kq.suKien, mac: kq.dong[0]?.mac ?? '', tuFid: null };
      });
    } else if (nguon === 'wifi') {
      doc = await this.motLuc(async () => {
        const r = await this.voiKetNoi(async (kn) => {
          const mac = kn.thongTin.mac;
          // Giao dịch MỚI NHẤT đã lưu (theo giờ của cân, cùng giờ thì số lớn hơn) — không phải số lớn nhất: sau khi cân
          // đếm lại, số cũ lớn hơn số mới và lần đọc nào cũng phải đọc lại từ giao dịch 1.
          let cuoi: DongBanCan | null = null;
          if (b.tuDau !== true) {
            for (const d of this.docNhatKyDaLuu()) {
              if (d.mac === mac && (!cuoi || d.luc > cuoi.luc || (d.luc === cuoi.luc && d.fid > cuoi.fid))) cuoi = d;
            }
          }
          let tuFid = cuoi ? cuoi.fid : 1;
          let dong = await kn.docBaoCao(tuFid);
          const loiThem: string[] = [];
          if (cuoi) {
            const c = cuoi;
            if (!docNhatKy(dong, { mac, soLeDonGia: 3, soLeTien: 3 }).dong.some(d => d.fid === c.fid && d.luc === c.luc)) {
              tuFid = 1;
              dong = await kn.docBaoCao(1);
              loiThem.push(`Cân không còn giao dịch số ${c.fid} lúc ${c.luc} đã lưu — cân đã đếm lại số giao dịch (xoá báo cáo / khôi phục gốc) `
                + 'hoặc đã xoá giao dịch cũ: đã đọc lại từ giao dịch 1.');
            }
          }
          const ts = tuyChonTuThongSo(await kn.docPhan('TMS'));
          const plu = await kn.docPhan('PLU');
          const kq = docNhatKy(dong, { mac, ...ts, pluLucDoc: pluLucDocTuDong(plu, ts.soLeDonGia) });
          return { kq: { ...kq, loi: [...loiThem, ...kq.loi] }, mac, tuFid };
        });
        const { soMoi } = this.gopVaoNhatKy(r.kq.dong);
        return { soDong: r.kq.dong.length, soMoi, loi: r.kq.loi, suKien: r.kq.suKien, mac: r.mac, tuFid: r.tuFid };
      });
    }
    const ds = this.docNhatKyDaLuu();
    const trong = ds.filter(d => trongKhoang(d, tu, den));
    return {
      nguon, doc, tomTat: tomTatNhatKy(ds, tu, den),
      dong: trong.slice(-DONG_NHAT_KY_TOI_DA).reverse().map(d => ({ ...d, ghiChu: ghiChuDong(d) })),
      soDongTrongKhoang: trong.length, tongDaLuu: ds.length, tu, den,
    };
  }

  /** Nhật ký đã lưu trong khoảng ngày → CSV cho Excel (bao-cao-can.ts sangCsv). */
  async taiNhatKyCsv(b: { tu?: unknown; den?: unknown } = {}): Promise<{ ten: string; chu: string }> {
    await this.kiemQuyenCan('Nhật ký cân');
    const { tu, den } = khoangNhatKy(b.tu, b.den);
    const ds = this.docNhatKyDaLuu().filter(d => trongKhoang(d, tu, den));
    return { ten: `nhat-ky-can${tu ? '-tu-' + tu : ''}${den ? '-den-' + den : ''}.csv`, chu: sangCsv(ds) };
  }

  // ---- 2.2: thông số (TMS) và phím tắt (SCP) — thong-so.ts ------------------------------
  async thongSo(): Promise<ThongSoXem> {
    await this.kiemQuyenCan('Thông số cân');
    const goc = docFileCan(this.docGoc());
    const gt = docThongSo(goc);
    return { muc: THONG_SO.map(m => ({ ...m, giaTri: gt.get(m.id) ?? null })), nhom: NHOM_THONG_SO, phienBan: goc.phienBan };
  }

  /**
   * Sửa thông số: sửa đúng dòng TMS trong file gốc, gửi file nhỏ chỉ có khối TMS đổi qua cổng 33571 (hàng đợi
   * và dò tìm cân của 2.1). Gửi xong mới thay file gốc. Cân có nhận khối TMS riêng qua 33571 không: CHƯA THỬ
   * TRÊN CÂN THẬT — cân không trả lời, nên trang nói "đã gửi", không nói "đã đổi".
   */
  async suaThongSo(b: { thay?: unknown } = {}): Promise<{ doi: number[]; doiDiaChi: DoiDiaChi | null }> {
    await this.kiemQuyenCan('Gửi thông số xuống cân');
    const thay: Record<string, string | number> = {};
    if (laDoiTuong(b.thay)) {
      for (const [k, v] of Object.entries(b.thay)) if (typeof v === 'string' || typeof v === 'number') thay[k] = v;
    }
    return this.motLuc(async () => {
      const goc = this.docGoc();
      const kq = suaThongSoTrongFile(goc, thay);
      if (!kq.khoi.length) throw new LoiCan('Thông số chưa có gì thay đổi — không gửi gì.');
      const nho = fileNho(docFileCan(goc).phienBan, kq.khoi);
      const doiDiaChi = await this.guiDenCan(nho);
      this.luuGoc(kq.du, nho);
      return { doi: kq.doi, doiDiaChi };
    });
  }

  /** Phím tắt trong file gốc (mọi tầng), kèm tên hàng phím đang gọi, và danh sách hàng để chọn. */
  async phim(): Promise<{ phim: PhimXemHang[]; hang: { so: number; ma: string; ten: string }[] }> {
    await this.kiemQuyenCan('Phím tắt');
    const goc = docFileCan(this.docGoc());
    const theoSo = new Map(goc.plu.map(p => [p.so, p]));
    return {
      phim: docPhim(goc).map(k => {
        const p = k.plu > 0 ? theoSo.get(k.plu) : undefined;
        return { ...k, ten: p?.ten ?? null, maCan: p?.ma ?? null };
      }),
      hang: goc.plu.map(p => ({ so: p.so, ma: p.ma, ten: p.ten })).sort((a, b) => a.so - b.so),
    };
  }

  /** Gán phím tắt: như suaThongSo, khối SCP đổi qua cổng 33571. CHƯA THỬ TRÊN CÂN THẬT. */
  async suaPhim(b: { thay?: unknown } = {}): Promise<{ doi: { trang: number; phim: number }[]; doiDiaChi: DoiDiaChi | null }> {
    await this.kiemQuyenCan('Gửi phím tắt xuống cân');
    const thay = (Array.isArray(b.thay) ? b.thay : []).filter(laDoiTuong).slice(0, 300)
      .map(t => ({ trang: Number(t.trang), phim: Number(t.phim), plu: Number(t.plu) }));
    return this.motLuc(async () => {
      const goc = this.docGoc();
      const kq = suaPhimTrongFile(goc, thay);
      if (!kq.khoi.length) throw new LoiCan('Phím tắt chưa có gì thay đổi — không gửi gì.');
      const nho = fileNho(docFileCan(goc).phienBan, kq.khoi);
      const doiDiaChi = await this.guiDenCan(nho);
      this.luuGoc(kq.du, nho);
      return { doi: kq.doi, doiDiaChi };
    });
  }

  // ---- 2.2: giờ cân --------------------------------------------------------------------
  /** Giờ trên cân qua cổng 33581, so với giờ máy tính. Chưa thử trên cân thật. */
  async gioCan(): Promise<{ gio: GioCan; gioMay: string; lechGiay: number }> {
    await this.kiemQuyenCan('Đọc giờ cân');
    return this.motLuc(() => this.voiKetNoi(async (kn) => {
      const gio = await kn.docGio();
      const may = new Date();
      return { gio, gioMay: chuoiGio(gioTuMay(may)), lechGiay: lechGiay(gio, may) };
    }));
  }

  /**
   * Chỉnh giờ cân — mặc định theo giờ máy tính lúc gửi; `luc` = giờ chọn trên trang ("2026-09-29T14:05").
   * Trước hết qua cổng 33581 (DWL TIM + hàng rào; cân báo lại giờ để kiểm — datGio của giao-thuc.ts). Cổng đó
   * hỏng thì gửi khối giờ trong file nhỏ qua cổng 33571 — đường này CHƯA THỬ TRÊN CÂN THẬT và cân không trả
   * lời, nên chưa biết cân đã nhận (daXacNhan = false). Đặt giờ hai lần không hại gì, nên đi đường lui cả khi
   * cổng 33581 đã gửi dở. Cả hai đường đều chưa thử trên cân thật.
   */
  async chinhGioCan(b: { luc?: unknown } = {}): Promise<KetQuaChinhGio> {
    await this.kiemQuyenCan('Chỉnh giờ cân');
    const chon = b.luc === undefined || b.luc === null || b.luc === '' ? null : gioTuChu(b.luc);
    if (chon) khoiTim(chon);   // ngày giờ không có thật → báo ngay, chưa nối cân
    const lay = () => chon ?? gioTuMay(new Date());
    return this.motLuc(async () => {
      let gio = lay();
      try {
        await this.voiKetNoi(async (kn) => { gio = lay(); await kn.datGio(gio); });
        return { cach: '33581' as const, gio, daXacNhan: true, loiHaiChieu: null, doiDiaChi: null };
      } catch (e) {
        if (!(e instanceof LoiGiaoThuc) || e.loai === 'khong-cho-phep') throw e;
        let phienBan = '';
        try { phienBan = docFileCan(this.docGoc()).phienBan; } catch { /* chưa có file gốc: fileNho ghi "100" */ }
        gio = lay();
        const doiDiaChi = await this.guiDenCan(fileNho(phienBan, khoiTim(gio)));
        return { cach: '33571' as const, gio, daXacNhan: false, loiHaiChieu: e.message, doiDiaChi };
      }
    });
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

// -----------------------------------------------------------------------------
// HÀM NHỎ (2.2)
// -----------------------------------------------------------------------------
const hai = (n: number) => String(n).padStart(2, '0');
const laDoiTuong = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Dấu của một kế hoạch xoá qua WiFi: hàng sẽ còn nằm lại (số PLU + mã) và nguyên văn các dòng PLU sẽ gửi lại. Trang gửi
 * kèm dấu của lần xem trước; lúc bấm mà dấu khác = kho / cân đã đổi, kế hoạch sắp chạy không phải cái người đã xem.
 */
function dauKeHoach(conLai: HangTrenCan[], moi: FileCan): string {
  return createHash('sha1').update(conLai.map(h => `${h.so}\t${h.ma}`).join(',') + '|', 'utf8')
    .update(moi.plu.map(p => p.tho).join('\n'), 'latin1').digest('hex');
}

/**
 * Số dòng kế hoạch đổi hạn dùng (HSD) trên tem: hàng trên cân đổi HSD, và hàng MỚI bật in HSD khi trên cân chưa hàng
 * nào in HSD (lần đầu bật HSD). Tự gửi và xoá qua WiFi không mang các thay đổi này — quản lý xem trước rồi bấm Gửi.
 */
function demDoiHsd(dong: DongKeHoach[], goc: FileCan): number {
  const daInHsd = goc.plu.some(p => p.hsd !== null);
  return dong.filter(d => d.hsd !== undefined && (d.hsdCu !== undefined
    ? d.hsd !== d.hsdCu
    : d.loai === 'them' && d.hsd !== null && !daInHsd)).length;
}

/** Số PLU → chữ trên phím tắt tầng 1 gọi nó (NHAN_PHIM của thong-so.ts: phím 58 là "_", không phải gạch dài). */
function phimTheoPlu(f: FileCan): Map<number, string> {
  const ra = new Map<number, string>();
  for (const k of docPhim(f)) if (k.trang === 0 && k.plu > 0 && k.phim <= PHIM_CHU_TOI_DA && !ra.has(k.plu)) ra.set(k.plu, k.nhan);
  return ra;
}

/** Giờ máy tính (giờ địa phương của Windows) → dạng giờ cân. */
function gioTuMay(d: Date): GioCan {
  return { nam: d.getFullYear(), thang: d.getMonth() + 1, ngay: d.getDate(), gio: d.getHours(), phut: d.getMinutes(), giay: d.getSeconds() };
}
const chuoiGio = (g: GioCan) => `${g.nam}-${hai(g.thang)}-${hai(g.ngay)} ${hai(g.gio)}:${hai(g.phut)}:${hai(g.giay)}`;
/** Giờ cân − giờ máy tính (giây); cả hai là giờ địa phương. */
const lechGiay = (g: GioCan, may: Date) =>
  Math.round((new Date(g.nam, g.thang - 1, g.ngay, g.gio, g.phut, g.giay).getTime() - may.getTime()) / 1000);

/** "2026-09-29T14:05" / "2026-09-29 14:05:09" (ô chọn giờ của trang) → giờ cân. Ngày không có thật: khoiTim báo. */
function gioTuChu(v: unknown): GioCan {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(v ?? '').trim());
  if (!m) throw new LoiCan('Giờ cần đặt phải có dạng ngày và giờ, ví dụ 2026-09-29 14:05.');
  return { nam: +m[1], thang: +m[2], ngay: +m[3], gio: +m[4], phut: +m[5], giay: m[6] ? +m[6] : 0 };
}

/** Khoảng ngày của nhật ký: 'YYYY-MM-DD' hoặc '' (không giới hạn), ngày phải có thật, bắt đầu ≤ kết thúc. */
function khoangNhatKy(tu: unknown, den: unknown): { tu: string; den: string } {
  const ngay = (v: unknown, ten: string): string => {
    const s = String(v ?? '').trim();
    if (!s) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    const d = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
    if (!m || !d || d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) {
      throw new LoiCan(`${ten} không phải ngày có thật (dạng 2026-09-29).`);
    }
    return s;
  };
  const a = ngay(tu, 'Ngày bắt đầu'), b = ngay(den, 'Ngày kết thúc');
  if (a && b && a > b) throw new LoiCan('Ngày bắt đầu phải trước ngày kết thúc.');
  return { tu: a, den: b };
}
const trongKhoang = (d: DongBanCan, tu: string, den: string) => {
  const n = d.luc.slice(0, 10);
  return (!tu || n >= tu) && (!den || n <= den);
};

/** Câu lỗi cho người dùng — lỗi lạ thì nói chung chung, không lộ chi tiết kỹ thuật. */
export function cauLoi(e: unknown): string {
  if (e instanceof LoiCan || e instanceof LoiFileCan || e instanceof LoiTem || e instanceof LoiDay
    || e instanceof LoiGiaoThuc || e instanceof LoiThongSo) return e.message;
  const m = e instanceof Error ? e.message : String(e);
  if (/fetch|network|ENOTFOUND|ECONNREFUSED|timed? ?out/i.test(m)) return 'Mất kết nối mạng. Kiểm tra internet rồi thử lại.';
  if (/JWT|refresh|session/i.test(m)) return 'Phiên đăng nhập đã hết. Đăng nhập lại.';
  return `Có lỗi: ${m}`;
}
