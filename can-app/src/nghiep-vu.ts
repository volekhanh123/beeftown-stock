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
 * Dây RS232 mới có phần thử (day-rs232.ts, làm như phần mềm hãng) — chưa thử trên cân thật.
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
 *
 * BẢN 2.7 (cân của quán bỏ qua cổng 33571 từ 02/10/2026; đọc qua 33581 thì được — ghi qua 33581 CHƯA THỬ TRÊN CÂN THẬT):
 *   · Thông số, chữ cài đặt, phím, mẫu tem ghi qua cổng hai chiều như gửi giá (ghiHoacLui), rồi đọc lại phần đó để kiểm
 *     (guiCaiDat → docLaiCaiDat, lechCaiDat): đọc lại thấy cân chưa nhận thì không ghi nhận gì. Lui về 33571 khi cổng hai
 *     chiều không nối được; mọi lần gửi qua 33571 bỏ dòng cài đặt mạng (boDongMang).
 *   · Gỡ hàng còn nằm lại bằng ghi đè dòng trống mã 99999 (goHangConLai) — an toàn hơn xoá cả danh sách; xoá cả danh sách
 *     hỏng giữa chừng thì tự gửi lại (phucHoiSauXoa).
 *   · Chẩn đoán WiFi (chanDoanWifi): phép thử an toàn của CAN-TMA.md §13, ghi file kết quả.
 *
 * HSD = SỐ NGÀY CÒN LẠI CỦA LÔ (cách b, 29/09/2026 — danh-muc-can.ts): kho gửi hạn của lô − hôm nay (giờ VN), cân in
 * HSD = ngày in + số đó, nên số trên cân chỉ đúng trong ngày tính. Chương trình ghi ngày tính của HSD đang nằm trên
 * cân vào Tài liệu › Beeftown Can › hsd-tinh-ngay.txt (ghi khi gửi đủ danh sách thành công, xoá qua WiFi đọc lại khớp,
 * nạp USB file làm từ kho, hay xem trước thấy HSD trên cân đã đúng hôm nay); ô Cân / Gửi giá / Tất cả hàng báo đỏ khi
 * cân in HSD mà ngày đó trước hôm nay (hsdTrenCan). Tự gửi gửi được HSD đếm ngược (số → số), không tự bật / tắt in HSD
 * (null ↔ số) — demBatTatHsd. In HSD: chưa thử trên cân thật.
 */
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { createClient, isAuthRetryableFetchError, type SupabaseClient } from '@supabase/supabase-js';
import {
  MA_CAN_THU, MA_CAN_TRONG, TEN_PLU_TRONG, PLU_RIENG_TOI_DA, chuanMa, docFileCan, dongPluRieng, ghiFileCan, giaTuFile, lapKeHoach, soChuSoMa,
  LoiFileCan, type DongKeHoach, type DongPlu, type FileCan, type HangKho, type KeHoach, type LoaiDong,
} from '../../web/src/lib/kho/can-tma.ts';
import {
  CANH_CHU, CAU_DOI, CO_CHU, DIEU_KIEN_IN, LoiTem, O_THEM_DUOC, XOAY, dauTem, docTem, dongMauTemDangDung, goiYHsd, suaTem, xemTem,
  type DaTat, type MauTem, type TemXem, type ThayDoiTem,
} from './tem.ts';
import {
  CONG_HAI_CHIEU, LoiGiaoThuc, docFileTuKetNoi, ghepFileUsb, khoiTim, khoiXoaVaNapPlu, laThongSoMang, moKetNoi,
  type GioCan, type KetNoiCan, type ThongTinCan, type TuyChonKetNoi,
} from './giao-thuc.ts';
import { GiuKetNoi, type TrangThaiGiu } from './giu-ket-noi.ts';
import { NgheUdp, type TuyChonUdp } from './udp-can.ts';
import {
  docKhoNhatKy, docNhatKy, ghiChuDong, ghiKhoNhatKy, gopNhatKy, khoa as khoaNhatKy, macTuDong, nhatKyTuFile, pluLucDocTuDong, sangCsv, soKieuViet, tomTatNhatKy,
  tuyChonTuThongSo, type DongBanCan, type KetQuaNhatKy, type SuKienCan, type TomTatNhatKy,
} from './bao-cao-can.ts';
import {
  CHU_CHUNG, CHU_MANG, LoiThongSo, NHAN_PHIM, NHOM_CHU_CHUNG, NHOM_THONG_SO, PHIM_CHU_TOI_DA, THONG_SO, docChuChung, docPhim, docThongSo, fileNho,
  suaChuChung as suaChuChungTrongFile, suaPhim as suaPhimTrongFile, suaThongSo as suaThongSoTrongFile,
  type MucChuChung, type MucThongSo, type PhimXem,
} from './thong-so.ts';
import { chonNhatKyGui, dongTrenCanBao, vanTayGiaoO } from './bao-kho.ts';
import { LA_IP, layMac, thuKetNoi, timCan as doTimCan, type KetQuaTim, type MangMay } from './tim-can.ts';
import { LoiDay, dsCongCom, giayDay, guiCom, hoiGioQuaDay, kiemCom, tocDoTuThongSo, type ChayPs, type CongCom } from './day-rs232.ts';
import {
  CHO_MAC_DINH, FS_THAT, GIOI_HAN_MAC_DINH, GOC_BAN_CAI, LoiCapNhat, cacTepCapNhat, chayThuBanMoi, doiTep, duongTepBanMoi, hoiBanMoi, moTaMb,
  ngayPhatHanhVn, taiVaKiem, thuGhiThuMuc, type ChayThu, type FsHam,
} from './cap-nhat.ts';
import { docCaiDat, docMatHang } from '../../web/src/lib/kho/danh-muc.ts';
import { hangChoCan, ngayNgan } from '../../web/src/lib/kho/danh-muc-can.ts';
import { congNgay, gioVnTuMs, homNayVn } from '../../web/src/lib/gio-vn.ts';
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
  /**
   * 2.8 — giữ MỘT kết nối hai chiều mở với cân (như phần mềm của hãng): mọi việc qua cổng hai chiều đi trên kết nối đó,
   * nhịp 30 giây hỏi giờ cân (đèn ô Cân), nghe cân tự báo in tem rồi tự đọc nhật ký. undefined = bật; false = như 2.7
   * (mỗi việc mở một kết nối rồi đóng).
   */
  giuKetNoi?: boolean;
  /** 2.8 — tự chỉnh giờ cân theo giờ Việt Nam mỗi ngày khi lệch quá 30 giây (chỉ khi giờ máy tính khớp giờ mạng). undefined = bật. */
  tuDatGio?: boolean;
  /** 2.8 — nghe cân tự phát qua UDP 33584 để tìm lại cân khi đổi địa chỉ (lần đầu Windows hỏi tường lửa). undefined = tắt. */
  ngheUdp?: boolean;
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
export interface LanTuGui {
  luc: string; daGui: boolean; cau: string;
  /** 2.9 — lần này HỎNG (không đọc được kho, không nối được cân…), khác với "không có gì để gửi" hay "tạm dừng" — báo kho. */
  hong?: boolean;
}

/** 2.9 — lần báo về kho gần nhất (kho_may_can_bao + nhật ký tem), hiện ở ô Cân. ok chỉ khi kho đã trả lời. */
export interface LanBaoKho { luc: string; ok: boolean; cau: string }

/** 2.8 — một lần tự chỉnh giờ cân (tu-dat-gio.json). */
export interface LanTuDatGio {
  luc: string;
  /** Đã gửi lệnh đặt giờ xuống cân (false: dừng trước — không kiểm được giờ máy tính). */
  daGui: boolean;
  /** Cân đọc lại đúng giờ vừa đặt. */
  ok: boolean;
  /** Giờ cân − giờ VN trước khi chỉnh (giây). */
  lechTruoc: number;
  cau: string;
}
/** 2.8 — các lần tự chỉnh giờ cân trong một ngày (giờ VN). */
export interface TuDatGio { ngay: string; lan: LanTuDatGio[] }

/** 2.8 — trạng thái việc chạy nền với cân (ô Cân trên trang, /api/can). */
export interface TrangThaiNen {
  /** Kết nối hai chiều giữ mở; bat = cài đặt giữ kết nối đang bật. */
  giu: TrangThaiGiu & { bat: boolean };
  /** Lần nhịp gần nhất hỏng: câu lỗi, lúc nào; null khi lần gần nhất nói chuyện được với cân. */
  loi: { luc: string; cau: string } | null;
  /** Giờ cân đọc ở lần nhịp / chỉnh gần nhất, lệch giờ Việt Nam (giây, dương = cân nhanh). */
  gio: { luc: string; gioCan: string; lechGiay: number } | null;
  /** Lần cuối cân tự báo in tem (ASK REP) — ISO. */
  lucCanBao: string | null;
  /** Thông số 58 trong file gốc: cân có bật tự báo khi có nhật ký mới (+1) không; null = chưa biết (không có file gốc / dòng 58). */
  tuBao58: boolean | null;
  /** Lần tự đọc nhật ký gần nhất: vì cân báo in tem hay vì vừa nối được cân. */
  nhatKy: { luc: string; lyDo: 'bao' | 'noi'; soDong: number; soMoi: number; loi: string | null } | null;
  /** Tự chỉnh giờ: cài đặt, các lần trong ngày gần nhất có chỉnh. */
  tuDatGio: { bat: boolean; ngay: string | null; lan: LanTuDatGio[] };
  /** Nghe cân phát UDP: cài đặt, đang nghe, lỗi mở cổng, các máy vừa phát. */
  udp: { bat: boolean; dangNghe: boolean; loi: string | null; thay: { ip: string; cong: number; luc: string }[] };
  /** 2.9 — lần báo về kho gần nhất (trạng thái cân, dòng trên cân, nhật ký tem); null = chưa báo lần nào. */
  baoKho: LanBaoKho | null;
}

const CAU_HINH_MAC_DINH: CauHinh = { ipCan: '192.168.1.22', congCan: 33571, diaChiKho: 'https://beeftown.vn' };

function docJson<T>(file: string, macDinh: T): T {
  try { return { ...macDinh, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch { return macDinh; }
}

/** Ghi cả một file xuống đĩa — kiểm thử thay được (phu.vietByte: giả đầy ổ / mất điện giữa chừng). */
export type VietByte = (duongDan: string, du: Uint8Array) => void;
/** Ghi rồi đẩy hẳn xuống đĩa (fsync) trước khi đóng: mất điện ngay sau khi đổi tên vẫn không ra file rỗng / rác. */
const vietXuongDia: VietByte = (duongDan, du) => {
  const fd = fs.openSync(duongDan, 'w');
  try {
    for (let da = 0; da < du.length;) da += fs.writeSync(fd, du, da, du.length - da);
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
};

/**
 * 2.9.1 — ghi đè cả file AN TOÀN: ghi file tạm cạnh file đích (`<tên>.tam`, fsync), rồi đổi tên đè file đích. Mất điện, đầy
 * ổ, chương trình tắt giữa chừng thì file đích vẫn là bản cũ đầy đủ, không bao giờ là file dở. Trước 2.9.1 file gốc
 * A_000.TMS, tren-can.tsv, cau-hinh.json ghi đè thẳng: hỏng giữa chừng là file gốc đọc không được (làm lại bước "Bắt đầu"),
 * cài đặt âm thầm về mặc định (địa chỉ cân cũ, tắt tự gửi, quên mã máy cân). Hỏng thì xoá file tạm rồi ném lỗi (file đang
 * mở trong Excel: đổi tên hỏng ngay như ghi thẳng trước đây — không chờ thử lại làm đứng chương trình).
 */
export function ghiFileAnToan(file: string, du: Uint8Array | string, viet: VietByte = vietXuongDia): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tam = file + '.tam';
  try {
    viet(tam, typeof du === 'string' ? Buffer.from(du, 'utf8') : du);
    fs.renameSync(tam, file);
  } catch (e) {
    try { fs.rmSync(tam, { force: true }); } catch { /* thôi — file đích vẫn là bản cũ */ }
    throw e;
  }
}

/**
 * 2.9.1 — fetch tới kho có hạn. fetch của Bun tự bỏ một yêu cầu treo sau chừng 5–6 phút (đo 05/10/2026: 360 giây): mạng
 * internet treo là việc đang chờ kho đứng chừng đó. Hạn:
 *   - `ms` cho yêu cầu đọc (GET / HEAD / OPTIONS) và đăng nhập / làm mới phiên (/auth/v1/);
 *   - `msLau` cho mọi yêu cầu khác — gọi hàm kho (báo cáo cả tháng chạy lâu; ghi kho: quá hạn sau khi kho đã ghi thì người
 *     dùng tưởng hỏng mà bấm lại), tải ảnh phiếu huỷ.
 * Quá hạn thì huỷ bằng lỗi tên AbortError (thư viện kho không bao giờ thử lại yêu cầu bị huỷ; layClient tắt hẳn việc thử lại
 * của nó). Câu lỗi có chữ "network timeout" để cauLoi / cauLoiKho ra câu mất mạng. Tín hiệu huỷ của người gọi (init.signal,
 * hay của Request) vẫn giữ.
 */
export function fetchCoHan(f: typeof fetch, ms: number, msLau: number): typeof fetch {
  return ((dau: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const laRequest = typeof Request !== 'undefined' && dau instanceof Request;
    const url = typeof dau === 'string' ? dau : dau instanceof URL ? dau.href : dau.url;
    const cachGoi = String(init?.method ?? (laRequest ? (dau as Request).method : 'GET')).toUpperCase();
    const doc = cachGoi === 'GET' || cachGoi === 'HEAD' || cachGoi === 'OPTIONS' || /\/auth\/v1\//.test(url);
    const ac = new AbortController();
    const hen = setTimeout(() => ac.abort(new DOMException('Kho không trả lời kịp (network timeout)', 'AbortError')), doc ? ms : msLau);
    (hen as { unref?: () => void }).unref?.();   // đọc xong trước hạn: hẹn tự hết, không giữ chương trình chạy
    const cuaNguoiGoi = init?.signal ?? (laRequest ? (dau as Request).signal : undefined);
    return f(dau, { ...init, signal: cuaNguoiGoi ? AbortSignal.any([cuaNguoiGoi, ac.signal]) : ac.signal });
  }) as typeof fetch;
}

/**
 * `p` trong hạn `ms`: quá hạn thì ném `loi()` — người chờ (hàng đợi việc với cân) đi tiếp. `p` vẫn chạy nốt; kết quả muộn bị
 * bỏ (lỗi muộn cũng không thành lỗi không ai bắt).
 */
function trongHan<T>(p: Promise<T>, ms: number, loi: () => Error): Promise<T> {
  let hen: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([p, new Promise<never>((_xong, hong) => { hen = setTimeout(() => hong(loi()), ms); })])
    .finally(() => clearTimeout(hen));
}

/** File JSON (cài đặt, phiên đăng nhập, file dấu…) — ghi đè an toàn (ghiFileAnToan). */
function ghiJson(file: string, v: unknown, viet?: VietByte) {
  ghiFileAnToan(file, JSON.stringify(v, null, 2), viet);
}

/**
 * Đọc một file dấu (can-chua-ro.json, chua-xac-nhan.json): không có file → null (không có dấu). File hỏng (sửa tay, ghi
 * dở) hay sai dạng (`kiem` trả null) vẫn coi là CÒN dấu, trả `macDinh` — không bao giờ báo "khớp" khi không chắc.
 */
function docDau<T>(file: string, kiem: (j: Record<string, unknown>) => T | null, macDinh: T): T | null {
  let chu: string;
  try { chu = fs.readFileSync(file, 'utf8'); }
  catch (e) { return (e as { code?: string })?.code === 'ENOENT' ? null : macDinh; }
  try {
    const j: unknown = JSON.parse(chu);
    return (j && typeof j === 'object' ? kiem(j as Record<string, unknown>) : null) ?? macDinh;
  } catch { return macDinh; }
}

// -----------------------------------------------------------------------------
// GỬI XUỐNG CÂN
// -----------------------------------------------------------------------------
export class LoiCan extends Error {}
/** Chưa nối được cân — chưa gửi byte nào, nên dò tìm cân rồi gửi lại được. */
export class LoiKhongNoi extends LoiCan {}

/**
 * 2.6.1: cân trả lời ở cổng hai chiều có mã máy khác cân chương trình vẫn dùng (kiemMayHaiChieu) — chưa gửi gì. Gửi
 * xuống cân thì dừng hẳn, không chuyển sang cổng 33571 (đó có thể là cân thứ hai của quán).
 */
export class LoiKhacMay extends LoiGiaoThuc {}

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

/** Đọc một bảng dạng tren-can.tsv (số PLU, mã, giá trong file, tên — cách bằng tab); không có file → rỗng. */
function docBangTrenCan(file: string): Map<number, HangTrenCan> {
  const m = new Map<number, HangTrenCan>();
  let chu = '';
  try { chu = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''); } catch { return m; }
  for (const d of chu.split(/\r?\n/)) {
    const c = d.split('\t');
    const so = Number(c[0]);
    if (c.length >= 4 && Number.isInteger(so) && c[0] !== '') m.set(so, { so, ma: c[1], gia: c[2], ten: c[3] });
  }
  return m;
}

/** Chữ của một bảng dạng tren-can.tsv — theo số PLU, CRLF (cùng dạng với Nap-Can-WiFi.ps1). */
function chuBangTrenCan(m: Map<number, HangTrenCan>): string {
  const dong = [...m.values()].sort((a, b) => a.so - b.so).map(h => `${h.so}\t${h.ma}\t${h.gia}\t${h.ten}`);
  return dong.join('\r\n') + (dong.length ? '\r\n' : '');
}

/**
 * Hàng còn nằm lại sau khi cân có `moi`: hàng có thể đang trên cân mà file mới không có (gửi qua WiFi không xoá được). Dòng
 * trống (số PLU đã gỡ bằng ghi đè, 2.7) không phải hàng còn nằm lại.
 */
function conLaiSau(moi: FileCan, coThe: Map<number, HangTrenCan>): HangTrenCan[] {
  const soMoi = new Set(moi.plu.map(p => p.so));
  return [...coThe.values()].filter(h => !soMoi.has(h.so) && !laPluTrong(h)).sort((a, b) => a.so - b.so);
}

/**
 * 2.9.3 — hàng CÓ THỂ đang trên cân: tren-can.tsv (đã xác nhận) cùng cho-xac-nhan.tsv (đã gửi, chưa xác nhận — dòng này
 * thay dòng cùng số PLU: lần ghi sau cùng). Chỉ dùng để tính hàng còn nằm lại; báo kho, tảng & ô chỉ dùng tren-can.tsv.
 */
function hangCoTheTrenCan(tren: Map<number, HangTrenCan>, cho: Map<number, HangTrenCan>): Map<number, HangTrenCan> {
  return new Map([...tren, ...cho]);
}

// -----------------------------------------------------------------------------
// 2.6: ĐỌC LẠI CÂN SAU KHI GỬI (xacNhanSauGui)
// -----------------------------------------------------------------------------
/** Một hàng vừa gửi mà đọc lại trên cân không thấy đúng. `can` null: cân không có PLU số đó. */
export interface LechPlu {
  so: number;
  gui: HangSoSanh;
  can: HangSoSanh | null;
}
/** Những gì so khi đọc lại: hsd = số ngày HSD đang ghi (null: không in HSD). */
interface HangSoSanh { ma: string; ten: string; gia: number | null; hsd: number | null }
const hangSoSanh = (p: DongPlu): HangSoSanh => ({ ma: p.ma, ten: p.ten, gia: p.gia, hsd: p.hsd });

/**
 * So hàng vừa gửi với danh sách cân trả về: mỗi PLU vừa gửi phải có trên cân, cùng mã cân, giá, HSD (tự gửi mỗi đêm chỉ
 * đổi số ngày HSD — không so thì cân bỏ qua lần gửi đó vẫn ra "khớp") và tên (bỏ dấu cách ở hai đầu). Hàng cân có mà lần
 * gửi không có (còn nằm lại) không tính. Hai danh sách phải qua cùng một bộ đọc (docFileCan, cùng số lẻ của giá).
 */
export function soPluVuaGui(gui: DongPlu[], can: DongPlu[]): LechPlu[] {
  const theoSo = new Map(can.map(p => [p.so, p]));
  const ra: LechPlu[] = [];
  for (const p of gui) {
    const c = theoSo.get(p.so);
    if (c && c.ma === p.ma && c.gia === p.gia && c.hsd === p.hsd && c.ten.trim() === p.ten.trim()) continue;
    ra.push({ so: p.so, gui: hangSoSanh(p), can: c ? hangSoSanh(c) : null });
  }
  return ra;
}

/** Câu báo khi đọc lại thấy cân chưa nhận lần gửi: nêu tối đa 5 hàng lệch (kèm HSD khi HSD khác), kèm cách làm. */
export function cauLechPlu(lech: LechPlu[], soDaGui: Set<number>, cachGui: CachGui = 'mot-chieu'): string {
  const gia = (g: number | null) => (g === null ? 'không có giá' : `${soKieuViet(g)} đ`);
  const hsd = (n: number | null) => (n === null ? 'không in HSD' : `HSD ${n} ngày`);
  const moTa = (h: HangSoSanh, coHsd: boolean) => `"${h.ten}" mã ${h.ma || '—'} ${gia(h.gia)}${coHsd ? `, ${hsd(h.hsd)}` : ''}`;
  const mot = (l: LechPlu) => {
    const coHsd = !!l.can && l.can.hsd !== l.gui.hsd;
    return l.can
      ? `PLU ${l.so} trên cân vẫn là ${moTa(l.can, coHsd)} (gửi ${moTa(l.gui, coHsd)})`
      : `PLU ${l.so} không có trên cân (gửi ${moTa(l.gui, false)})`;
  };
  // Hàng lệch mà lần này không gửi: cân đã khác với chương trình ghi nhận từ trước (lần gửi cũ cân bỏ qua) — nói thẳng,
  // không nói "chưa nhận" hàng chưa từng gửi. Lần gửi sau còn dấu 'lech' nên gửi cả danh sách.
  const ngoai = lech.filter(l => !soDaGui.has(l.so)).length, vuaGui = lech.length - ngoai;
  const thay = [
    vuaGui ? `cân CHƯA nhận ${vuaGui} hàng vừa gửi` : '',
    ngoai ? `cân còn ${ngoai} hàng khác kho từ trước (lần gửi cũ cân chưa nhận — lần gửi sau chương trình gửi cả danh sách)` : '',
  ].filter(Boolean).join(' và ');
  return `Đã gửi ${soDaGui.size} hàng qua WiFi (${cachGui === 'hai-chieu' ? 'cổng hai chiều' : 'cổng 33571'}) nhưng đọc lại thấy ${thay}: `
    + lech.slice(0, 5).map(mot).join('; ') + (lech.length > 5 ? `; và ${lech.length - 5} hàng khác` : '') + '. '
    + 'Chương trình chưa ghi nhận lần gửi này. Để cân ở màn hình bán hàng (không ở menu Prog, không có ai đang bấm) rồi bấm '
    + 'Gửi xuống cân thêm một lần; vẫn vậy thì bấm "Lưu file để nạp USB" và nạp bằng USB. Tự gửi tạm dừng tới lúc đó.';
}

// -----------------------------------------------------------------------------
// 2.7: GHI CÀI ĐẶT QUA CỔNG HAI CHIỀU RỒI ĐỌC LẠI ĐỂ KIỂM (lechCaiDat), BỎ DÒNG MẠNG KHI GỬI QUA 33571 (boDongMang)
// -----------------------------------------------------------------------------
/** Phần gửi riêng qua cổng hai chiều rồi đọc lại để kiểm: thông số, chữ cài đặt, phím, mẫu tem; PLU (dòng trống, hàng thử). */
export type PhanKiem = 'TMS' | 'TMT' | 'SCP' | 'LAB' | 'PLU';

/** Ô của một dòng để so: bỏ ô rỗng ở cuối; số nguyên so theo giá trị ("04" = "4"); ô khác giữ y nguyên byte. */
function oSoSanh(d: string): string[] {
  const c = d.split('\t');
  while (c.length && c[c.length - 1] === '') c.pop();
  return c.map(x => (/^\s*[+-]?\d+\s*$/.test(x) ? String(parseInt(x, 10)) : x));
}
const cungDong = (a: string, b: string) => { const x = oSoSanh(a), y = oSoSanh(b); return x.length === y.length && x.every((v, i) => v === y[i]); };
/** Chữ dạng chuỗi byte (UTF-8) → để hiện trong câu báo, có ngoặc kép. */
const chuHien = (byte: string | undefined) => `"${new TextDecoder().decode(Buffer.from(byte ?? '', 'latin1')).trim()}"`;
/** Số kiểu file cân "m,n" (m ÷ 10ⁿ) hay số nguyên; không đọc được → NaN. */
function soFile(v: string | undefined): number {
  const m = /^\s*([+-]?\d+)(?:,(\d+))?\s*$/.exec(v ?? '');
  return m ? Number(m[1]) / 10 ** Number(m[2] ?? 0) : NaN;
}
/** Các mẫu tem trong một dãy dòng LAB / LAS / LAE: mỗi mẫu từ dòng LAB tới dòng LAE (thiếu LAE thì tới hết). */
function nhomMauTem(dong: string[]): string[][] {
  const ra: string[][] = [];
  let dang: string[] | null = null;
  for (const d of dong) {
    const f0 = d.split('\t')[0];
    if (f0 === 'LAB') { dang = [d]; ra.push(dang); } else if (dang && (f0 === 'LAS' || f0 === 'LAE')) { dang.push(d); if (f0 === 'LAE') dang = null; }
  }
  return ra;
}

/**
 * Dòng PLU đọc từ cân qua cổng hai chiều (chuỗi byte) → DongPlu, giá theo số lẻ (thông số 202 / 203) của file `f` (file vừa
 * gửi / file gốc) — hai bên cùng một bộ đọc; không có file → 3 số lẻ như cân của quán. Dùng chung cho mọi lần đọc lại:
 * xacNhanSauGui, phucHoiSauXoa, lechCaiDat (PLU), goHangConLai, Chẩn đoán WiFi.
 */
export function docPluDocLai(dong: string[], f: FileCan | null): DongPlu[] {
  const soLe = f ? f.dong.filter(d => /^TMS\t20[23]\t/.test(d)) : [];
  return docFileCan(ghepFileUsb(f?.phienBan ?? '', { TMS: soLe, PLU: dong.filter(d => d.startsWith('PLU\t')) })).plu;
}

/**
 * 2.7 — so khối vừa gửi ("DWL <phần>" … "END <phần>") với phần đó đọc lại từ cân qua cổng hai chiều. Trả các câu lệch
 * (rỗng = cân có đúng mọi dòng vừa gửi). Dòng cân có mà lần gửi không có thì không tính.
 *   TMS: thông số theo số, giá trị so theo số · TMT: chữ theo số, y nguyên byte · SCP: số PLU của (tầng, phím)
 *   PLU: đúng luật của gửi giá (soPluVuaGui — mã cân, giá, tên, HSD) · LAB: cả mẫu tem cùng số (dòng LAB, các ô LAS, LAE),
 *   so từng ô — số so theo giá trị, bỏ ô rỗng ở cuối dòng (cân có thể ghi lại khác vài ô trống / số 0 đầu).
 * Không bao giờ nhắc tới chữ cân có mà lần gửi không có (tên / mật khẩu WiFi không bao giờ vào câu báo).
 */
export function lechCaiDat(phan: PhanKiem, khoi: string[], docLai: string[]): string[] {
  const guiDi = khoi.filter(d => { const f0 = d.split('\t')[0]; return f0 === phan || (phan === 'LAB' && (f0 === 'LAS' || f0 === 'LAE')); });
  const lech: string[] = [];
  if (phan === 'LAB') {
    const can = new Map(nhomMauTem(docLai).map(t => [String(Number(t[0].split('\t')[1])), t]));
    for (const t of nhomMauTem(guiDi)) {
      const id = String(Number(t[0].split('\t')[1]));
      const c = can.get(id);
      if (!c) { lech.push(`mẫu tem ${id}: cân không có mẫu này`); continue; }
      const soO = (x: string[]) => x.filter(d => d.startsWith('LAS\t')).length;
      if (t.length !== c.length) { lech.push(`mẫu tem ${id}: cân có ${soO(c)} ô (gửi ${soO(t)} ô)`); continue; }
      const i = t.findIndex((d, k) => !cungDong(d, c[k]));
      if (i === 0) lech.push(`mẫu tem ${id}: chữ cố định / cỡ tem trên cân khác bản vừa gửi`);
      else if (i > 0) lech.push(`mẫu tem ${id}: ô thứ ${i} trên cân khác bản vừa gửi`);
    }
    return lech;
  }
  if (phan === 'PLU') {
    const moTa = (h: HangSoSanh) => `"${h.ten.trim()}" mã ${h.ma || '—'}`;
    return soPluVuaGui(docPluDocLai(guiDi, null), docPluDocLai(docLai, null))
      .map(l => (l.can ? `PLU ${l.so}: cân vẫn là ${moTa(l.can)} (gửi ${moTa(l.gui)})` : `PLU ${l.so}: cân không có (gửi ${moTa(l.gui)})`));
  }
  const khoa = (f: string[]) => (phan === 'SCP' ? `${Number(f[1])}:${Number(f[2])}` : String(Number(f[1])));
  const can = new Map<string, string[]>();
  for (const d of docLai) { const f = d.split('\t'); if (f[0] === phan) can.set(khoa(f), f); }
  for (const d of guiDi) {
    const f = d.split('\t'), c = can.get(khoa(f));
    if (phan === 'TMS') {
      if (!c) lech.push(`thông số ${f[1]}: cân không trả dòng này (gửi ${f[2]})`);
      else if (soFile(c[2]) !== soFile(f[2])) lech.push(`thông số ${f[1]}: cân vẫn là ${c[2]} (gửi ${f[2]})`);
    } else if (phan === 'TMT') {
      if (!c) lech.push(`chữ số ${f[1]}: cân không trả dòng này (gửi ${chuHien(f[2])})`);
      else if ((c[2] ?? '') !== (f[2] ?? '')) lech.push(`chữ số ${f[1]}: cân vẫn là ${chuHien(c[2])} (gửi ${chuHien(f[2])})`);
    } else {
      const phim = Number(f[2]), trang = Number(f[1]);
      const ten = `phím ${NHAN_PHIM[phim] || phim}${trang > 0 ? ` (tầng ${trang + 1})` : ''}`;
      const goi = (v: string | undefined) => (Number(v) > 0 ? `PLU ${Number(v)}` : 'không gì');
      if (!c) lech.push(`${ten}: cân không trả dòng này (gửi ${goi(f[3])})`);
      else if (Number(c[3]) !== Number(f[3])) lech.push(`${ten}: cân vẫn gọi ${goi(c[3])} (gửi ${goi(f[3])})`);
    }
  }
  return lech;
}

/**
 * 2.7 — file gửi qua cổng 33571 bỏ các dòng cài đặt mạng: thông số mạng (TMS 43–53, 150–173, 430–441 — laThongSoMang) và
 * tên / mật khẩu WiFi, tên miền (TMT 15, 16, 19). Giá trị y như cân đang có vẫn có thể làm mạng cân khởi động lại giữa lúc
 * nhận (thông số 45 = 1 "áp ngay"); thiếu dòng thì cân giữ nguyên dòng đó. Mọi dòng khác (kể cả BOM, CRLF) y nguyên byte.
 * File gốc, file USB và đường ghi cổng hai chiều (kiemKhoiGhi đã chặn) không đổi.
 */
export function boDongMang(du: Uint8Array): Uint8Array {
  const s = Buffer.from(du).toString('latin1');
  const xd = s.includes('\r\n') ? '\r\n' : '\n';
  const dong = s.split(xd);
  const giu = dong.filter(d => {
    const m = /^(TMS|TMT)\t(\d+)\t/.exec(d);
    if (!m) return true;
    const id = parseInt(m[2], 10);
    return m[1] === 'TMS' ? !laThongSoMang(id) : !CHU_MANG.has(id);
  });
  return giu.length === dong.length ? du : new Uint8Array(Buffer.from(giu.join(xd), 'latin1'));
}

/** 2.9.2 — da-gui giữ tối đa chừng này bản, bỏ bản cũ hơn chừng này ngày (donDaGui). */
const DA_GUI_GIU_TOI_DA = 100;
const DA_GUI_GIU_NGAY = 30;

/** 2.9.2 — %APPDATA%\BeeftownCan\loi.txt tối đa chừng này byte; đầy thì thành loi-cu.txt (bản cũ hơn bỏ đi), ghi tiếp file mới. */
export const LOI_TXT_TOI_DA = 1024 * 1024;
/** Một lần ghi loi.txt tối đa chừng này ký tự (stack dài) — phần sau cắt bỏ. */
const LOI_TXT_LAN_TOI_DA = 8000;
/**
 * 2.9.2 — thêm một dòng vào `<thuMuc>/loi.txt` (giờ UTC đầu dòng, ISO có "Z", như các dòng cũ). Trước 2.9.2 main.ts ghi thêm
 * mãi không hạn: lỗi lặp lại (lời hứa hỏng chạy ngầm mỗi phút khi mất mạng) làm file lớn dần. Không ghi được thì thôi.
 */
export function ghiLoiTxt(thuMuc: string, cau: string, toiDa = LOI_TXT_TOI_DA): void {
  try {
    fs.mkdirSync(thuMuc, { recursive: true });
    const file = path.join(thuMuc, 'loi.txt'), cu = path.join(thuMuc, 'loi-cu.txt');
    const dong = `${new Date().toISOString()} ${cau.length > LOI_TXT_LAN_TOI_DA ? cau.slice(0, LOI_TXT_LAN_TOI_DA) + ' …(cắt bớt)' : cau}\n`;
    let co = 0;
    try { co = fs.statSync(file).size; } catch { /* chưa có */ }
    if (co > 0 && co + Buffer.byteLength(dong) > toiDa) { fs.rmSync(cu, { force: true }); fs.renameSync(file, cu); }
    fs.appendFileSync(file, dong);
  } catch { /* không ghi được thì thôi */ }
}

/** 2.6.1: chờ bản mới chạy thử tối đa 3 phút (lần chạy đầu, phần mềm diệt virus có thể quét lâu file 80 MB). */
const CHO_CHAY_THU_MS = 180_000;

/** Đọc lại sau khi gửi: lần 1 ngay, chưa khớp thì chờ rồi đọc lại (cân có thể còn đang lưu) — ms trước mỗi lần đọc. */
const CHO_XAC_NHAN_MS = [0, 3000, 5000];
/**
 * 2.9.3 — gửi mà chưa đọc lại được cân (cổng hai chiều bận: TM-xA đang mở, cân đang lưu…): lần thứ n liên tiếp thì tự gửi
 * thử lại sau THU_LAI_KHONG_DOC_MS[n − 1] (lần thứ 4 trở đi: phần tử cuối). Bấm Gửi xuống cân không phải chờ.
 */
export const THU_LAI_KHONG_DOC_MS = [60_000, 2 * 60_000, 5 * 60_000, 10 * 60_000];
/** 2.7: xoá qua WiFi hỏng giữa chừng → gửi lại cả danh sách ngay, chưa đủ thì chờ rồi gửi lại — ms trước mỗi lần. */
const CHO_PHUC_HOI_MS = [0, 3000, 8000];
/** 2.7: Chẩn đoán WiFi — cổng 33571 không trả lời, chờ chừng này cho cân lưu rồi mới đọc lại qua cổng hai chiều. */
const CHO_33571_MS = 4000;

// ---- 2.8: kết nối giữ mở, nghe cân, tự chỉnh giờ, UDP ----------------------------------------
/** Nhịp giữ kết nối (main.ts gọi nhipCan): như hãng hỏi UPL TIM mỗi 30 giây. */
export const NHIP_CAN_MS = 30_000;
/** Cân báo in tem (ASK REP): chờ chừng này rồi mới đọc nhật ký — in liền nhiều tem thì đọc một lần. */
const CHO_SAU_BAO_MS = 5_000;
/** Hai lần tự đọc nhật ký cách nhau ít nhất chừng này. */
const KHOANG_DOC_NHAT_KY_MS = 20_000;
/** Tự chỉnh giờ cân khi giờ cân lệch giờ Việt Nam quá chừng này (giây). */
const NGUONG_TU_DAT_GIO_GIAY = 30;
/** Giờ máy tính lệch giờ mạng quá chừng này (giây) thì không tự chỉnh giờ cân theo máy tính. */
const LECH_GIO_MAY_TOI_DA_GIAY = 120;
/** Mỗi ngày (giờ VN) tự chỉnh giờ cân tối đa chừng này lần, hai lần cách nhau ít nhất TU_DAT_GIO_CACH_MS. */
const TU_DAT_GIO_TOI_DA = 3;
const TU_DAT_GIO_CACH_MS = 10 * 60_000;
/** Nhịp hỏng liên tiếp: lần sau chờ 30 giây, 1, 2, 4 phút… tối đa chừng này — cân treo (nhận TCP mà không trả lời) thì nhịp
 * không giữ hàng đợi việc 30 giây mỗi lần liên tục. */
const NHIP_LUI_TOI_DA_MS = 5 * 60_000;
/** Tự đọc nhật ký hỏng: lần tự đọc sau chờ ít nhất chừng này (nối lại không kéo theo đọc lại ngay → không lặp mỗi 30 giây). */
const LUI_SAU_NHAT_KY_HONG_MS = 5 * 60_000;
/** UDP: máy phát gói của cân trong chừng này là "đang phát" (cân phát mỗi ~15 giây). */
const UDP_GAN_DAY_MS = 60_000;
/** Tìm cân bằng UDP: hỏi xong chờ trả lời chừng này (ms). */
const CHO_TRA_LOI_UDP_MS = 1_500;

// ---- 2.9: báo về kho (bao-kho.ts, migration 0061) --------------------------------------------
/** Hỏi kho các ô đang giao mỗi chừng này (main.ts): vừa "Giao ô mã" thì tự gửi trong khoảng 15 giây. */
export const HOI_KHO_MS = 15_000;
/** Báo trạng thái cân + gửi nhật ký tem về kho mỗi chừng này (main.ts). Đèn "Beeftown Cân" đỏ khi 30 phút không báo. */
export const BAO_KHO_MS = 60_000;
/** Dòng trên cân không đổi thì vẫn gửi lại sau chừng này (kho mất dòng, máy quầy khác cùng mã máy). */
const GUI_LAI_TREN_CAN_MS = 10 * 60_000;
/** Lần đầu gửi nhật ký tem ở một chi nhánh (chưa có mốc): chỉ các dòng từ chừng này ngày trước. */
const NHAT_KY_LAN_DAU_NGAY = 3;
/** Mỗi lần gửi tối đa chừng này dòng nhật ký (kho nhận tối đa 2000). */
const NHAT_KY_MOT_LAN = 1000;
/** Tự gửi tắt: vẫn so kho với cân (đọc kho, không gửi) chừng này một lần để báo "kho đổi mà cân chưa nhận". */
const TINH_LECH_MS = 5 * 60_000;
/** Việc chạy nền (hỏi kho 15 giây, báo kho mỗi phút) dùng lại người đăng nhập trong chừng này — không hỏi kho mỗi lần. */
const NGUOI_NEN_MS = 60_000;

// ---- 2.9.1: kho (internet) treo không giữ việc với cân -------------------------------------------
/**
 * Đọc danh mục kho (docKhoChoCan) tối đa chừng này; quá hạn thì thôi lượt đó, chưa gửi gì xuống cân. Trước 2.9.1 tự gửi (mỗi
 * phút), bấm Gửi, gỡ / xoá hàng đọc kho TRONG hàng đợi việc với cân (motLuc) không hạn: mạng internet treo là mọi việc với
 * cân qua WiFi (nhịp, tự đọc nhật ký, Đọc giờ, Gửi) đứng chờ tới khi fetch tự bỏ (5–6 phút). Từ 2.9.1 tự gửi và báo kho đọc
 * kho NGOÀI hàng đợi; bấm Gửi, gỡ / xoá vẫn đọc trong hàng đợi (người bấm chờ kết quả) nhưng có hạn này.
 */
const HAN_DOC_KHO_MS = 30_000;
/** Mỗi yêu cầu đọc tới kho (client Supabase — fetchCoHan); gọi hàm kho, ghi, tải ảnh được lâu hơn (HAN_YEU_CAU_LAU_MS). */
const HAN_YEU_CAU_KHO_MS = 20_000;
const HAN_YEU_CAU_LAU_MS = 120_000;
/** Nút việc với cân hỏi kho "ai đang đăng nhập" (kiemQuyenCan) tối đa chừng này — quá hạn như mất mạng: chưa đăng nhập. */
const HAN_HOI_QUYEN_MS = 8_000;
const MAT_MANG_KHO = 'Mất kết nối mạng: không nối được kho (internet chậm hay mất). Kiểm tra internet rồi thử lại.';
/** Lỗi đọc kho (PostgREST, đăng nhập) → LoiCan: mất mạng / quá hạn nói đúng là mạng; lỗi khác giữ câu của cauLoi. */
const loiDocKho = (e: unknown) => { const c = cauLoi(e); return new LoiCan(/^Mất kết nối mạng/.test(c) ? MAT_MANG_KHO : c); };

// ---- 2.9.2: kho đổi khoá / chuyển project — đọc lại kho-can.json ----------------------------------
/**
 * Địa chỉ Supabase + khoá anon đọc từ `<địa chỉ kho>/kho-can.json` lần đầu rồi lưu trong cau-hinh.json. Trước 2.9.2 chỉ đọc
 * lại khi người sửa ô Địa chỉ kho: kho đổi khoá anon hay khôi phục sang project mới là mọi máy quầy báo "Sai email hoặc mật
 * khẩu" (kho trả 401 "Invalid API key"), hoặc — project cũ còn chạy — âm thầm đọc / ghi project cũ. Từ 2.9.2 đọc lại khi:
 * mở chương trình (ngầm, không chờ), đăng nhập hỏng (rồi đăng nhập lại một lần nếu khác), kho trả 401 (tối đa một lần mỗi
 * DOC_LAI_KHO_CAN_CACH_MS). Không đọc được thì giữ bản đang lưu.
 */
const HAN_DOC_KHO_CAN_MS = 8_000;
const DOC_LAI_KHO_CAN_CACH_MS = 60_000;
/** Kho trả 401 "Invalid API key" — chương trình đang đọc lại kho-can.json (kiemLaiKhoCan). */
const KHOA_KHO_DOI = 'Kho không nhận khoá truy cập đang lưu trên máy này (kho vừa đổi khoá hay chuyển sang project mới). '
  + 'Chương trình tự đọc lại cấu hình kho (tối đa mỗi phút một lần) — thử lại sau ít phút; có thể phải đăng nhập lại.';
const laSaiKhoaKho = (m: string) => /Invalid API key|Unregistered API key|No API key found/i.test(m);
/** cauLoiKho của web, thêm câu cho 401 "Invalid API key" (hàm kho của máy quầy — khoTuClient). */
const cauLoiKhoMay = (e: unknown) => {
  const m = laDoiTuong(e) && typeof e.message === 'string' ? e.message : '';
  return laSaiKhoaKho(m) ? KHOA_KHO_DOI : cauLoiKho(e);
};

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
  /**
   * Tải ảnh phiếu huỷ lên `<chi nhánh>/huy/<ma_gui>/<số>.<đuôi>`, số từ `batDau` (taiAnh của web). Kho file không cho ghi
   * đè: đường dẫn đã có thì ảnh đó báo lỗi — lần gửi lại phải đánh số tiếp (taoPhieuHuy, 2.9.2).
   */
  taiAnhHuy(chiNhanhId: string, maGui: string, tep: File[], batDau: number): Promise<{ duongDan: string[]; loi: string[] }>;
}

function khoTuClient(c: SupabaseClient): KhoTruyCap {
  return {
    async rpc(ten, thamSo) {
      const { data, error } = await c.rpc(ten, thamSo);
      if (error) throw new LoiCan(cauLoiKhoMay(error));
      return data;
    },
    async bang(ten, cot) {
      const { data, error } = await c.from(ten).select(cot);
      if (error) throw new LoiCan(cauLoiKhoMay(error));
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
    async taiAnhHuy(chiNhanhId, maGui, tep, batDau) {
      const r = await taiAnh(c, chiNhanhId, 'huy', maGui, tep, batDau);
      return { duongDan: r.duongDan, loi: r.loi };
    },
  };
}

/** Ảnh gửi từ trang (base64) — kiểm dạng, cỡ. */
export interface AnhGui { ten: string; loai: string; base64: string }

/**
 * 2.9.2 — ảnh phiếu huỷ đã tải lên kho file của MỘT lần gửi form (chi nhánh + ma_gui). Gửi lại cùng form (kho chưa trả
 * lời, mất mạng giữa chừng) thì ảnh nào đã tải (cùng nội dung — dấu sha256) dùng lại đường dẫn cũ, ảnh mới đánh số sau
 * `soCuoi` — số lớn nhất đã THỬ tải, kể cả lần hỏng: ảnh hết giờ chờ có thể đã nằm trong kho, tải lại vào số đó là "already
 * exists". Web giữ đường dẫn trong ô ẩn anh_da_tai (docAnhDaTai / soThuTuCuoi); ở đây máy chủ nhỏ sống lâu hơn trang nên
 * nhớ trong bộ nhớ.
 */
interface AnhHuyDaTai { soCuoi: number; theoDau: Map<string, string> }
/** Nhớ ảnh của chừng này lần gửi form gần nhất. */
const ANH_HUY_NHO_TOI_DA = 50;
/** Ảnh vào số đã có trong kho file (bộ nhớ ảnh mất sau khi khởi động lại) → thử số sau, tối đa chừng này lần mỗi ảnh. */
const ANH_HUY_THU_SO_SAU = 8;
/**
 * 2.9.2 — lần gửi phiếu huỷ hỏng mà chưa biết kho đã ghi chưa (mất câu trả lời), theo chi nhánh + các lô: lần gửi sau cùng các
 * lô (form mới, kể cả sau khi chương trình khởi động lại) dùng lại ma_gui này — kho trả phiếu đã có, không thành hai phiếu.
 * Lưu trong %APPDATA%\BeeftownCan\phieu-huy-chua-chac.json, giữ HUY_CHUA_CHAC_GIU_MS; kho trả lời được thì xoá.
 */
interface HuyChuaChac { khoa: string; maGui: string; luc: number }
const HUY_CHUA_CHAC_GIU_MS = 24 * 3600_000;
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
  /**
   * Số dòng BẬT / TẮT in hạn dùng (HSD) trên tem (null ↔ số), kể cả hàng mới lần đầu in HSD khi cân chưa in HSD hàng
   * nào (demBatTatHsd) — tự gửi và xoá qua WiFi không mang theo, phải xem trước rồi bấm Gửi.
   */
  doiHsd: number;
  /** Số dòng chỉ đổi số ngày HSD (số → số: đếm ngược hằng ngày, đổi lô) — tự gửi và xoá qua WiFi gửi được. */
  demNguocHsd: number;
  /** Ngày (giờ VN, 'YYYY-MM-DD') các số ngày HSD của kế hoạch này được tính cho. */
  ngayHsd: string;
  /** HSD đang nằm trên cân tính cho ngày nào, có cũ không (hsdTrenCan) — sau khi xem trước. */
  hsdTrenCan: TrangThaiHsd;
  /** Lần xoá qua WiFi hỏng sau khi đã gửi lệnh xoá: cân có thể đang thiếu hàng (null: không có). */
  canChuaRo: CanChuaRo | null;
  /** 2.6: lần gửi gần nhất cân chưa xác nhận (null: không có, hay lần gửi gần nhất đã đọc lại khớp). */
  chuaXacNhan: ChuaXacNhan | null;
}

/** Dấu "hàng trên cân chưa rõ" (can-chua-ro.json): xoá qua WiFi hỏng sau khi đã gửi lệnh xoá cả danh sách. */
export interface CanChuaRo { luc: string; cau: string }

/**
 * 2.6 — dấu "lần gửi chưa được cân xác nhận" (chua-xac-nhan.json). Gửi qua cổng 33571 thì cân không trả lời gì; gửi
 * xong chương trình đọc lại danh sách hàng qua cổng hai chiều để kiểm (xacNhanSauGui):
 *   'khong-doc' — không đọc lại được (cổng hai chiều bận / hỏng, cân khác mã máy, trả rỗng). 2.9.3: KHÔNG ghi nhận gì
 *                 (2.6–2.9.2 ghi nhận như cân đã nhận — rà soát 11/10/2026: TM-xA mở làm cổng hai chiều bận, gửi rơi
 *                 về 33571 mà cân bỏ qua, kho nhận tên ô mới và trang pha lóc báo "Cân sẵn sàng" khi cân vẫn tên cũ).
 *                 Tự gửi thử lại cả danh sách, lùi dần (THU_LAI_KHONG_DOC_MS): soLanThu, thuLaiLuc;
 *   'lech'      — đọc lại thấy cân CHƯA có hàng vừa gửi (thiếu, khác mã hay giá): KHÔNG ghi nhận gì; tự gửi tạm dừng
 *                 tới khi người bấm Gửi được hay nạp USB.
 * Hàng vừa gửi của lần chưa xác nhận nằm ở cho-xac-nhan.tsv ("có thể đã trên cân" — chỉ để tính hàng còn nằm lại),
 * không ở tren-can.tsv (trạng thái đã xác nhận — báo kho, tảng & ô).
 * Hết dấu khi: gửi mà đọc lại khớp, ghi nhận file từ cân (USB / đọc qua WiFi), xoá qua WiFi đọc lại khớp.
 * Thấy ở quán 02–03/10/2026: chương trình ghi nhận 69 hàng kho đã gửi, cân thật chỉ có 7 hàng.
 */
export interface ChuaXacNhan {
  luc: string; loai: 'khong-doc' | 'lech'; soHang: number; cau: string;
  /** 2.9.3 — 'khong-doc': số lần liên tiếp gửi mà chưa đọc lại được cân (1 = lần đầu). */
  soLanThu?: number;
  /** 2.9.3 — 'khong-doc': tự gửi thử lại từ lúc này (ISO); null / không có = thử lại ngay lượt sau. */
  thuLaiLuc?: string | null;
}

/** Kết quả đọc lại cân sau khi gửi (xacNhanSauGui). */
export type KetQuaXacNhan = { loai: 'khop' } | { loai: 'khong-doc' | 'lech'; cau: string };

/** Kết quả Gửi xuống cân. xacNhan: đọc lại cân thấy đủ hàng vừa gửi; false → cauXacNhan nói vì sao chưa kiểm được. */
export interface KetQuaGui {
  soHang: number; conLai: HangTrenCan[]; doiDiaChi: DoiDiaChi | null;
  xacNhan: boolean; cauXacNhan: string | null;
  /** 2.6.1: số dòng hàng vừa gửi xuống cân (thêm / sửa, hay cả danh sách), và gửi qua cổng nào (guiPlu). */
  soHangGui: number; cachGui: CachGui;
}

/** 2.6.1: 'hai-chieu' — khối DWL PLU qua cổng 33581 như phần mềm hãng; 'mot-chieu' — cả file qua cổng 33571 (trước 2.6.1). */
export type CachGui = 'hai-chieu' | 'mot-chieu';

/**
 * 2.7 — kết quả gửi thông số / chữ cài đặt / phím / mẫu tem (guiCaiDat). xacNhan: đọc lại qua cổng hai chiều thấy cân có
 * đúng phần vừa gửi. false: chưa kiểm được (cauXacNhan nói vì sao) — chương trình ghi nhận như trước 2.7, trang nói
 * "chưa kiểm được", không nói "cân đã nhận". Đọc lại thấy cân CHƯA nhận thì không trả gì: ném lỗi, không ghi nhận.
 */
export interface KetQuaCaiDat {
  doiDiaChi: DoiDiaChi | null;
  cachGui: CachGui;
  xacNhan: boolean;
  cauXacNhan: string | null;
}

/** 2.7 — kết quả gỡ hàng còn nằm lại bằng ghi đè (goHangConLai). */
export interface KetQuaGo {
  /** Hàng đã gỡ: số PLU đó trên cân giờ là dòng trống (đọc lại khớp), hay cân đã không còn số đó (khongCoTrenCan). */
  daGo: HangTrenCan[];
  /** Số PLU cân đã không còn (nạp USB…) — không cần ghi gì, chỉ bỏ khỏi danh sách hàng trên cân của chương trình. */
  khongCoTrenCan: number[];
  /** Số phím tắt đã bỏ (đang gọi một số PLU vừa gỡ). */
  boPhim: number;
  /** Phím tắt chưa bỏ được (đọc lại lệch / không đọc được) — hàng vẫn đã gỡ. null: không có. */
  loiPhim: string | null;
}

/** 2.7 — một bước của Chẩn đoán WiFi. */
export interface BuocChanDoan {
  ma: string;
  ten: string;
  ketQua: 'dat' | 'hong' | 'bo-qua';
  cau: string;
  /** Bước chạy mất bao lâu (ms). */
  ms: number;
}
export interface KetQuaChanDoan {
  luc: string;
  ip: string;
  congHaiChieu: number;
  congMotChieu: number;
  /** Có chạy các bước ghi thử (thêm, sửa, gỡ PLU thử; file nhỏ qua 33571) không. */
  ghiThu: boolean;
  buoc: BuocChanDoan[];
  ketLuan: string[];
  /** File kết quả (Tài liệu\Beeftown Can\chan-doan\…) — gửi cho người sửa chương trình. */
  duongDan: string;
}

/** 2.7 — số PLU của hàng thử mà Chẩn đoán WiFi ghi tạm (mã MA_CAN_THU) rồi gỡ (dòng trống). */
export const PLU_THU = 9999;

/** Dòng tren-can.tsv là dòng trống (số PLU đã gỡ bằng ghi đè) — không phải hàng, không phải "còn nằm lại". */
export const laPluTrong = (h: { ma: string }) => chuanMa(h.ma) === MA_CAN_TRONG;

/**
 * HSD đang nằm trên cân tính cho ngày nào (hsd-tinh-ngay.txt). Cân in HSD = ngày in + số ngày còn lại của lô tính cho
 * ngày đó, nên mỗi ngày chưa gửi lại là HSD in ra muộn thêm 1 ngày.
 */
export interface TrangThaiHsd {
  /** Hôm nay theo giờ VN ('YYYY-MM-DD') của chương trình — trang so với ngày này, không theo đồng hồ trình duyệt. */
  homNay: string;
  /** Ngày (giờ VN) HSD trên cân được tính — lần gửi / xác nhận gần nhất. null: chưa biết. */
  tinhNgay: string | null;
  /** Có hàng nào trên cân (file gốc) đang in HSD. */
  coInHsd: boolean;
  /** Cân in HSD mà ngày tính trước hôm nay, hay chưa biết ngày tính → báo đỏ, gửi xuống cân trước khi đóng gói. */
  cu: boolean;
}

/** Một dòng ở thẻ "Tất cả hàng": hàng trên cân, đối chiếu với kho. */
export type TinhTrangHang =
  | 'khop'        // trên cân, đúng như kho
  | 'lech'        // trên cân, tên/giá khác kho (hoặc kho thiếu giá nên để nguyên)
  | 'ngoai_kho'   // trên cân, kho không có
  | 'con_lai'     // đã bỏ khỏi file nhưng WiFi không xoá được — vẫn nằm trên cân
  | 'chua_len'    // kho có, chưa lên cân
  | 'khong_len'   // kho có nhưng thiếu giá / mã quá dài — không đưa lên được
  | 'trong'       // 2.7: dòng trống — số PLU đã gỡ hàng bằng ghi đè, hàng mới dùng lại được
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
  /** HSD kho lấy từ đâu ("lô L0012 hết hạn 03/10", "tảng #0142 · …") — chỉ khi có hsdKho. */
  hsdNguon?: string;
}
export interface TatCaHang {
  hang: HangXem[]; coKho: boolean; loiKho: string | null;
  /** Xoá qua WiFi hỏng giữa chừng: "khớp kho" ở đây là so với file gốc, cân thật có thể đang thiếu hàng. */
  canChuaRo: CanChuaRo | null;
  /** 2.6: lần gửi gần nhất cân chưa xác nhận — "khớp kho" là theo lần gửi đó. */
  chuaXacNhan: ChuaXacNhan | null;
  /** HSD trên cân tính cho ngày nào, có cũ không. */
  hsdTrenCan: TrangThaiHsd;
}

// -----------------------------------------------------------------------------
// BẢN 2.2: KIỂU TRẢ VỀ CHO TRANG
// -----------------------------------------------------------------------------
export interface ThongTinHaiChieu {
  thongTin: ThongTinCan;
  /** Giờ trên cân lúc hỏi. */
  gio: GioCan;
  /** 2.9.2: giờ Việt Nam lúc đó, 'YYYY-MM-DD HH:mm:ss' (trước 2.9.2: giờ máy tính — máy để UTC thì lệch 7 tiếng). */
  gioVn: string;
  /** Giờ cân − giờ Việt Nam, giây (dương = cân nhanh). */
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

/** 2.5: kết quả hỏi bản mới (kiemBanMoi). phienBanMoi null = không có bản mới hơn (hoặc không cập nhật được). */
export interface BanMoiXem {
  coTheCapNhat: boolean;
  phienBan: string;
  phienBanMoi: string | null;
  kichThuocChu: string | null;
  ngayChu: string | null;
  /** Bản mới này đã không mở được trên máy này lần trước — trang không tự mời cập nhật. */
  daHongTruoc: boolean;
  cau: string;
}

export interface TrangThaiCapNhat {
  coTheCapNhat: boolean;
  dangCapNhat: boolean;
  cauTienDo: string | null;
  vuaCapNhatTu: string | null;
  capNhatHong: string | null;
}

/** Chữ cài đặt chung (TMT) để xem / sửa — không bao giờ có tên, mật khẩu WiFi hay tên miền (15, 16, 19). */
export interface ChuChungXem {
  muc: (MucChuChung & {
    /** Chữ trong file gốc; null = file không có dòng này. */
    giaTri: string | null;
    /** false: chữ trong file không phải UTF-8 (giaTri có ký tự thay thế). */
    docDuoc: boolean;
    /** Mẫu tem có ô in chữ này, ví dụ 'Mẫu 28 "Tem hàng" (cân đang dùng)'. */
    trenTem: string[];
  })[];
  nhom: readonly string[];
}

/**
 * Kế hoạch gửi dựng từ file gốc + kho (UngDung.dung): file sẽ gửi (du, moi) và hàng sẽ còn nằm lại trên cân (conLai).
 * ngayHsd: hôm nay (giờ VN) lấy TRƯỚC khi đọc kho — kho tính số ngày HSD cho ngày đó hoặc (đọc vắt qua nửa đêm) ngày
 * sau; ghi ngày sớm hơn thì trang báo HSD cũ sớm hơn, không bao giờ muộn hơn.
 */
/** 2.9.1 — một lần đọc danh mục kho (docKhoChoCan). */
interface KhoChoCan { dm: DanhMucKho; ngayHsd: string; soLanAp: number }

interface KeHoachGui {
  goc: FileCan; kh: KeHoach; du: Uint8Array; moi: FileCan;
  /** tren-can.tsv (đã xác nhận) và cho-xac-nhan.tsv (2.9.3: lần gửi chưa xác nhận — có thể đã trên cân). */
  tren: Map<number, HangTrenCan>; cho: Map<number, HangTrenCan>; conLai: HangTrenCan[];
  ngayHsd: string;
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
  /** Tài liệu\Beeftown Can\hsd-tinh-ngay.txt — HSD trên cân tính cho ngày nào (TrangThaiHsd), một dòng 'YYYY-MM-DD'. */
  readonly fileHsdNgay: string;
  /** Tài liệu\Beeftown Can\cho-usb\hsd-tinh-ngay.txt — ngày tính HSD của file nạp USB làm từ kho; "đã nạp USB" chép sang. */
  readonly fileHsdNgayChoUsb: string;
  /** Tài liệu\Beeftown Can\chua-xac-nhan.json — lần gửi gần nhất cân chưa xác nhận (ChuaXacNhan). */
  readonly fileChuaXacNhan: string;
  /**
   * Tài liệu\Beeftown Can\cho-xac-nhan.tsv — 2.9.3: dòng PLU đã gửi mà cân chưa xác nhận (cùng dạng tren-can.tsv). "Có thể
   * đã trên cân": chỉ để tính hàng còn nằm lại; lần đọc lại khớp sau quyết định dòng nào vào tren-can.tsv. Hết cùng dấu.
   */
  readonly fileChoXacNhan: string;
  /** %APPDATA%\BeeftownCan\tu-dat-gio.json — 2.8: các lần tự chỉnh giờ cân trong ngày (TuDatGio). */
  readonly fileTuDatGio: string;
  /** %APPDATA%\BeeftownCan\ma-may.txt — 2.9: mã cài đặt của máy quầy (kho_may_can.ma_may), sinh một lần. */
  readonly fileMaMay: string;
  /** %APPDATA%\BeeftownCan\nhat-ky-da-gui.json — 2.9: mốc nhật ký tem đã gửi kho, theo chi nhánh {id: giờ cân}. */
  readonly fileNhatKyDaGui: string;
  /** %APPDATA%\BeeftownCan\phieu-huy-chua-chac.json — 2.9.2: lần gửi phiếu huỷ chưa chắc kho đã ghi (HuyChuaChac). */
  readonly fileHuyChuaChac: string;
  /** 2.9 — số hàng kho thêm / sửa mà cân chưa có, theo lần tự gửi gần nhất; null = chưa biết. */
  private lechCuoi: number | null = null;
  /** 2.9 — lần gửi xuống cân được gần nhất (ms). */
  private lucGuiDuoc = 0;
  /** 2.9 — dấu vân tay các ô đang giao lần hỏi trước (null = chưa hỏi lần nào). */
  private vanTayO: string | null = null;
  /** 2.9 — dòng trên cân đã báo kho (khoá + lúc) — không đổi thì không gửi lại mỗi phút. */
  private trenCanDaBao: { khoa: string; luc: number } | null = null;
  private maMayNho: string | null = null;
  /** Lượt báo kho đang chạy — lượt gọi trong lúc đó chờ chính lượt này (không chạy song song, kể cả lần đầu). */
  private baoKhoDangChay: Promise<LanBaoKho> | null = null;
  /** Lần so kho với cân gần nhất khi tự gửi tắt (ms). */
  private lucTinhLech = 0;
  /** Người đăng nhập cho việc chạy nền, nhớ NGUOI_NEN_MS (đăng nhập / đăng xuất thì xoá). */
  private nguoiNen: { luc: number; nd: NguoiDung | null } | null = null;
  /**
   * 2.9.1 — người đăng nhập đọc được từ kho lần gần nhất (null: chưa đọc được, hay kho nói chưa đăng nhập; đăng nhập / đăng
   * xuất thì xoá). kiemQuyenCan dùng khi kho không trả lời kịp / mất mạng.
   */
  private nguoiBiet: NguoiDung | null = null;
  /** Tăng mỗi lần đăng nhập / đăng xuất — lần đọc người đăng nhập xong muộn (của phiên trước) không ghi vào nguoiBiet. */
  private lanDangNhap = 0;
  /**
   * 2.9.1 — số lần đã ghi nhận một lần gửi theo danh mục kho (gửi giá, xoá qua WiFi). Tự gửi đọc kho NGOÀI hàng đợi (mạng
   * treo không giữ việc với cân); trong hàng đợi chỉ dùng lần đọc đó khi chưa có lần gửi nào xen giữa — lần xen giữa có thể
   * mang kho mới hơn, gửi lần đọc cũ là đưa giá cũ đè lên.
   */
  private soLanApKho = 0;
  /** Nhật ký đã xét lần trước: file chưa đổi và lần đó không có gì để gửi → không đọc lại cả file. */
  private nhatKyDaXet: { khoa: string } | null = null;
  /** 2.9 — lần báo về kho gần nhất (ô Cân). */
  lanBaoKho: LanBaoKho | null = null;
  private client: SupabaseClient | null = null;
  /** 2.9.2 — lần đọc lại kho-can.json đang chạy (các lần gọi trong lúc đó dùng chung), lúc đọc gần nhất (ms), đã kiểm lúc mở chưa. */
  private khoCanDangDoc: Promise<boolean> | null = null;
  private lucDocKhoCan = Number.NEGATIVE_INFINITY;
  private daKiemKhoCanLucMo = false;
  /** 2.9.2 — ảnh phiếu huỷ đã tải theo lần gửi form ('<chi nhánh>/<ma_gui>'). */
  private readonly anhHuy = new Map<string, AnhHuyDaTai>();
  /** 2.9.2 — phiếu huỷ đang gửi theo ma_gui: bấm hai lần thì lần sau chờ lần trước xong (dùng lại ảnh, kho trả phiếu đã có). */
  private readonly huyDangGui = new Map<string, Promise<unknown>>();
  /** 2.8 — kết nối hai chiều giữ mở (giu-ket-noi.ts). */
  private readonly giu: GiuKetNoi;
  /** 2.8 — nghe cân tự phát qua UDP (udp-can.ts), chỉ khi bật ở Cài đặt. */
  private readonly udp: NgheUdp;
  /** 2.8 — việc chạy nền: lần đọc giờ, lỗi nhịp, lần cân báo in tem, lần tự đọc nhật ký (trong bộ nhớ). */
  private nen: {
    gio: { luc: number; gio: GioCan; lechGiay: number } | null;
    loi: { luc: number; cau: string } | null;
    lucCanBao: number;
    nhatKy: TrangThaiNen['nhatKy'];
  } = { gio: null, loi: null, lucCanBao: 0, nhatKy: null };
  private dangNhip = false;
  /** Nhịp hỏng liên tiếp và lúc sớm nhất được thử lại (ms) — lùi dần tới NHIP_LUI_TOI_DA_MS. */
  private nhipHong = 0;
  private nhipSau = 0;
  private lucNhipHong = 0;
  /** Lần tự đọc nhật ký gần nhất hỏng lúc nào (ms, 0 = lần gần nhất đọc được). */
  private lucNhatKyHong = 0;
  /** Thông số 58 của file gốc, nhớ theo thời điểm sửa / cỡ file (trang hỏi trạng thái mỗi 15 giây). */
  private tuBao58Nho: { khoa: string; v: boolean | null } | null = null;
  private henNhatKy: ReturnType<typeof setTimeout> | null = null;
  private lucDocNhatKy = 0;
  private dangDocNhatKy = false;
  private canDocLai: 'bao' | 'noi' | null = null;

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
      /** Kiểm thử: "hôm nay" theo giờ VN ('YYYY-MM-DD') thay cho homNayVn(). */
      homNay?: () => string;
      /** Kiểm thử: chờ (ms) trước mỗi lần đọc lại cân sau khi gửi — mặc định CHO_XAC_NHAN_MS. */
      choXacNhanMs?: number[];
      /**
       * 2.9.3 — kiểm thử: đọc danh sách PLU trên cân sau khi gửi (các dòng "PLU…" dạng byte) thay cho cổng hai chiều — cân giả
       * của các phần kiểm thử 2.1 chỉ có cổng 33571. Từ 2.9.3 lần gửi chỉ được ghi nhận khi đọc lại khớp.
       */
      docLaiPlu?: () => Promise<string[]>;
      /** 2.7 — kiểm thử: chờ (ms) trước mỗi lần tự gửi lại cả danh sách sau lần xoá qua WiFi hỏng — mặc định CHO_PHUC_HOI_MS. */
      choPhucHoiMs?: number[];
      /** 2.7 — kiểm thử: Chẩn đoán WiFi chờ (ms) sau khi gửi file nhỏ qua 33571 rồi mới đọc lại — mặc định CHO_33571_MS. */
      cho33571Ms?: number;
      /** 2.8 — kiểm thử: đồng hồ (ms) thay cho Date.now() — nhịp, tự chỉnh giờ, trạng thái nền. */
      bayGio?: () => number;
      /** 2.8 — kiểm thử: giờ mạng (ms) để kiểm giờ máy tính trước khi tự chỉnh giờ cân; null = không lấy được. Mặc định: giờ máy chủ kho. */
      gioMang?: () => Promise<number | null>;
      /** 2.8 — kiểm thử: cổng / địa chỉ UDP (udp-can.ts) thay cho 33584 / 255.255.255.255:33583. */
      udp?: TuyChonUdp;
      /** 2.8 — kiểm thử: chờ sau khi cân báo in tem rồi mới đọc nhật ký, khoảng tối thiểu giữa hai lần tự đọc, lùi sau lần hỏng (ms). */
      nhatKyMs?: { cho: number; khoang: number; luiHong?: number };
      /** 2.8 — kiểm thử: tìm cân bằng UDP, hỏi xong chờ trả lời (ms). */
      choUdpMs?: number;
      /** 2.9.1 — kiểm thử: đọc kho (danh mục cân) tối đa (ms) — mặc định HAN_DOC_KHO_MS. */
      hanKhoMs?: number;
      /** 2.9.1 — kiểm thử: mỗi yêu cầu đọc tới kho (client Supabase) tối đa (ms) — mặc định HAN_YEU_CAU_KHO_MS. */
      hanYeuCauKhoMs?: number;
      /** 2.9.1 — kiểm thử: nút việc với cân hỏi kho người đăng nhập tối đa (ms) — mặc định HAN_HOI_QUYEN_MS. */
      hanHoiQuyenMs?: number;
      /** 2.9.1 — kiểm thử: ghi byte xuống đĩa (ghiFileAnToan) — giả đầy ổ / mất điện giữa lúc ghi. */
      vietByte?: VietByte;
      /**
       * 2.5: tự cập nhật (cap-nhat.ts). main.ts truyền phiên bản, file đang chạy (process.execPath) và có phải bản
       * .exe đóng gói không; kiểm thử thêm gốc GitHub giả, thao tác file giả, thời gian chờ ngắn. Không có → không
       * cập nhật được (chạy bằng bun, kiểm thử khác).
       */
      capNhat?: {
        phienBan: string;
        tepChay: string;
        laBanDongGoi: boolean;
        goc?: string;
        fsHam?: FsHam;
        choMs?: { hoi: number; tong: number; lang: number };
        gioiHan?: { nhoNhat: number; lonNhat: number };
        /** Lần mở này ngay sau khi cập nhật từ bản đó (--vua-cap-nhat=). */
        vuaCapNhatTu?: string | null;
        /** Bản mới này không mở được, đã quay về (--cap-nhat-hong=). */
        capNhatHong?: string | null;
        /**
         * 2.6.1: chạy thử bản mới trước khi đổi file (chayThuBanMoi) — main.ts truyền chayThuQuaPowerShell. Không có
         * (kiểm thử cũ) → bỏ bước chạy thử.
         */
        chayThu?: ChayThu;
        /** 2.6.1: chờ chạy thử tối đa (ms) — mặc định CHO_CHAY_THU_MS. */
        choChayThuMs?: number;
        /** 2.6.1: ghi một dòng vào loi.txt (chạy thử mất bao lâu) — main.ts. */
        ghiNhatKy?: (cau: string) => void;
      };
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
    this.fileHsdNgay = path.join(dd.duLieu, 'hsd-tinh-ngay.txt');
    this.fileHsdNgayChoUsb = path.join(dd.duLieu, 'cho-usb', 'hsd-tinh-ngay.txt');
    this.fileChuaXacNhan = path.join(dd.duLieu, 'chua-xac-nhan.json');
    this.fileChoXacNhan = path.join(dd.duLieu, 'cho-xac-nhan.tsv');
    this.fileTuDatGio = path.join(dd.cauHinh, 'tu-dat-gio.json');
    this.fileMaMay = path.join(dd.cauHinh, 'ma-may.txt');
    this.fileNhatKyDaGui = path.join(dd.cauHinh, 'nhat-ky-da-gui.json');
    this.fileHuyChuaChac = path.join(dd.cauHinh, 'phieu-huy-chua-chac.json');
    this.giu = new GiuKetNoi((ip, cong, tuy) => moKetNoi(ip, cong, tuy), () => this.bayGio());
    this.udp = new NgheUdp({ ...(this.phu.udp ?? {}), bayGio: () => this.bayGio() });
  }

  /** Hôm nay theo giờ Việt Nam ('YYYY-MM-DD') — gio-vn.ts, máy tính để múi giờ nào cũng vậy. */
  private homNay(): string { return this.phu.homNay ? this.phu.homNay() : homNayVn(this.bayGio()); }
  /** Bây giờ (ms) — kiểm thử thay được (phu.bayGio). */
  private bayGio(): number { return (this.phu.bayGio ?? Date.now)(); }

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
      ...(moi.giuKetNoi !== undefined ? { giuKetNoi: moi.giuKetNoi === true } : {}),
      ...(moi.tuDatGio !== undefined ? { tuDatGio: moi.tuDatGio === true } : {}),
      ...(moi.ngheUdp !== undefined ? { ngheUdp: moi.ngheUdp === true } : {}),
    };
    if (congHc === null) delete kq.congHaiChieu;
    if (doiKho) { delete kq.supabaseUrl; delete kq.anonKey; this.client = null; }
    // Người chọn cân khác: mã máy cũ không còn đúng — lần nối được tới sẽ nhớ lại.
    if (ip !== cu.ipCan) delete kq.macCan;
    // Mã máy cổng hai chiều: quên cả khi người gõ lại đúng địa chỉ cũ rồi Lưu (vừa thay cân, cân mới nhận lại địa chỉ đó) —
    // chỉ người chọn cân mới quên được; địa chỉ tự đổi khi dò WiFi (ghiDoiDiaChi) thì vẫn là cân đó, giữ mã.
    if (ip !== cu.ipCan || moi.ipCan !== undefined) delete kq.macHaiChieu;
    ghiJson(this.fileCauHinh, kq, this.phu.vietByte);
    // 2.8: đổi cân / cổng hay tắt giữ kết nối → đóng kết nối đang giữ, sau việc đang chạy (hàng đợi motLuc) — đóng ngay thì
    // việc đang gửi dở trên kết nối đó hỏng giữa chừng. Việc sau dùng cài đặt mới (địa chỉ / cổng khác → kết nối mới).
    if (ip !== cu.ipCan || moi.ipCan !== undefined || kq.congHaiChieu !== cu.congHaiChieu || kq.giuKetNoi === false) {
      this.motLuc(async () => { this.giu.bo(); }).catch(() => { /* đang khởi động lại: dongNen đã đóng */ });
    }
    // Người vừa sửa cài đặt (địa chỉ, cổng, bật lại giữ kết nối): nhịp sau thử ngay, không chờ hết lùi.
    this.nhipHong = 0;
    this.nhipSau = 0;
    void this.capNhatUdp();
    return kq;
  }

  private ghiThem(them: Partial<CauHinh>) { ghiJson(this.fileCauHinh, { ...this.cauHinh(), ...them }, this.phu.vietByte); }

  // ---- đăng nhập kho ---------------------------------------------------------
  /** `<địa chỉ kho>/kho-can.json` → địa chỉ Supabase + khoá anon. Không đọc được / thiếu → ném LoiCan. */
  private async docKhoCan(diaChiKho: string, hanMs: number): Promise<{ supabaseUrl: string; anonKey: string }> {
    const f = this.phu.fetch ?? fetch;
    let r: Response;
    try { r = await f(`${diaChiKho}/kho-can.json`, { signal: AbortSignal.timeout(hanMs) }); }
    catch { throw new LoiCan(`Không mở được ${diaChiKho}. Máy tính có vào mạng internet không?`); }
    const j = await r.json().catch(() => ({})) as { supabaseUrl?: unknown; anonKey?: unknown };
    if (!r.ok || typeof j.supabaseUrl !== 'string' || !/^https?:\/\//i.test(j.supabaseUrl) || typeof j.anonKey !== 'string' || !j.anonKey) {
      throw new LoiCan(`${diaChiKho} chưa có cấu hình cho chương trình cân (cần bản web mới). Kiểm tra lại địa chỉ kho.`);
    }
    return { supabaseUrl: j.supabaseUrl, anonKey: j.anonKey };
  }

  /**
   * 2.9.2 — đọc lại kho-can.json (xem HAN_DOC_KHO_CAN_MS). Địa chỉ / khoá khác bản đang lưu → lưu bản mới, bỏ client cũ (việc
   * sau tạo client mới), quên người đăng nhập (project mới thì phải đăng nhập lại; cùng project thì phiên trong phien.json vẫn
   * dùng được) → true. Không đọc được, không khác, hay người vừa đổi ô Địa chỉ kho trong lúc đọc → false. `epBuoc`: mở chương
   * trình, đăng nhập hỏng; không thì (kho trả 401) tối đa một lần mỗi DOC_LAI_KHO_CAN_CACH_MS.
   */
  private kiemLaiKhoCan(epBuoc: boolean): Promise<boolean> {
    if (this.khoCanDangDoc) return this.khoCanDangDoc;
    if (!epBuoc && this.bayGio() - this.lucDocKhoCan < DOC_LAI_KHO_CAN_CACH_MS) return Promise.resolve(false);
    this.lucDocKhoCan = this.bayGio();
    const diaChiKho = this.cauHinh().diaChiKho;
    const viec = (async () => {
      let moi: { supabaseUrl: string; anonKey: string };
      try { moi = await this.docKhoCan(diaChiKho, Math.min(this.phu.hanYeuCauKhoMs ?? HAN_YEU_CAU_KHO_MS, HAN_DOC_KHO_CAN_MS)); }
      catch { return false; }
      const ch = this.cauHinh();
      if (ch.diaChiKho !== diaChiKho || (ch.supabaseUrl === moi.supabaseUrl && ch.anonKey === moi.anonKey)) return false;
      this.ghiThem({ supabaseUrl: moi.supabaseUrl, anonKey: moi.anonKey });
      const cu = this.client;
      this.client = null;
      // Client cũ thôi tự làm mới phiên với project cũ.
      cu?.auth.stopAutoRefresh().catch(() => { /* không sao */ });
      this.nguoiNen = null;
      this.nguoiBiet = null;
      this.lanDangNhap++;
      return true;
    })().finally(() => { this.khoCanDangDoc = null; });
    this.khoCanDangDoc = viec;
    return viec;
  }

  private async layClient(): Promise<SupabaseClient> {
    if (this.client) return this.client;
    let ch = this.cauHinh();
    const tuBoNho = !!(ch.supabaseUrl && ch.anonKey);
    if (!tuBoNho) {
      ch = { ...ch, ...await this.docKhoCan(ch.diaChiKho, 15000) };
      ghiJson(this.fileCauHinh, ch, this.phu.vietByte);
      this.lucDocKhoCan = this.bayGio();
    }
    const file = this.filePhien;
    const kho: Record<string, string> = docJson(file, {});
    // Phiên đăng nhập lưu trong %APPDATA% của máy này — "nhớ đăng nhập".
    const luuTru = {
      getItem: (k: string) => kho[k] ?? null,
      setItem: (k: string, v: string) => { kho[k] = v; ghiJson(file, kho, this.phu.vietByte); },
      removeItem: (k: string) => { delete kho[k]; ghiJson(file, kho, this.phu.vietByte); },
    };
    const fetchHan = fetchCoHan(this.phu.fetch ?? fetch, this.phu.hanYeuCauKhoMs ?? HAN_YEU_CAU_KHO_MS, HAN_YEU_CAU_LAU_MS);
    // 2.9.2: kho trả 401 "Invalid API key" (khoá anon bị từ chối — kho đổi khoá / chuyển project) → đọc lại kho-can.json ngầm.
    const fetchKho = (async (dau: Parameters<typeof fetch>[0], init?: RequestInit) => {
      const r = await fetchHan(dau, init);
      // Chỉ khi kho từ chối KHOÁ — phiên hết hạn ("JWT expired") cũng là 401 mà kho-can.json không đổi gì.
      if (r.status === 401) void r.clone().text().then(t => { if (laSaiKhoaKho(t)) void this.kiemLaiKhoCan(false); }, () => { /* thôi */ });
      return r;
    }) as typeof fetch;
    this.client = createClient(ch.supabaseUrl!, ch.anonKey!, {
      auth: { storage: luuTru, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      // 2.9.1: mỗi yêu cầu tới kho có hạn — mạng treo không giữ việc nào (đăng nhập, đọc kho, báo kho) tới 5–6 phút. Thư viện
      // không tự thử lại lần đọc hỏng mạng (1 + 2 + 4 giây): mất mạng thì nút bấm chờ 7 giây mỗi lần đọc, lượt thử lại còn chạy
      // ngầm sau khi việc đã thôi — chương trình tự thử lại theo nhịp của nó (tự gửi, báo kho mỗi phút; người bấm lại).
      global: { fetch: fetchKho },
      db: { retry: false },
    });
    // 2.9.2: địa chỉ / khoá lấy từ cau-hinh.json — mỗi lần mở chương trình kiểm ngầm kho-can.json một lần (không chờ): kho
    // chuyển sang project mới mà project cũ còn chạy thì không có 401 nào báo, chỉ cách này mới biết.
    if (tuBoNho && !this.daKiemKhoCanLucMo) { this.daKiemKhoCanLucMo = true; void this.kiemLaiKhoCan(true); }
    return this.client;
  }

  async dangNhap(email: string, matKhau: string): Promise<NguoiDung> {
    this.nguoiNen = null;
    this.nguoiBiet = null;
    this.lanDangNhap++;
    let c = await this.layClient();
    let { error } = await c.auth.signInWithPassword({ email: email.trim(), password: matKhau });
    // 2.9.2: đăng nhập hỏng vì khoá bị từ chối (401) hay project không trả lời → đọc lại kho-can.json. Sai mật khẩu (400: khoá
    // đúng, kho trả lời) hay mạng treo hết giờ thì không — chỉ thêm chờ. Lần kiểm ngầm lúc mở còn đang đọc thì chờ nó: đăng
    // nhập vào project cũ được rồi kho-can.json mới báo project mới là phiên nằm ở project cũ. Địa chỉ / khoá đã khác (lần này
    // hay lần kiểm ngầm) → đăng nhập lại MỘT lần bằng cái mới.
    if (error && error.status !== 400 && !/không trả lời kịp/i.test(error.message)) await this.kiemLaiKhoCan(true);
    else if (this.khoCanDangDoc) await this.khoCanDangDoc;
    if (this.client !== c) {
      c = await this.layClient();
      ({ error } = await c.auth.signInWithPassword({ email: email.trim(), password: matKhau }));
    }
    // 2.9.1: mất mạng / mạng treo / kho lỗi 5xx không phải sai mật khẩu — nói đúng, người dùng không đổi mật khẩu oan.
    if (error && isAuthRetryableFetchError(error)) throw new LoiCan(MAT_MANG_KHO);
    // 2.9.2: kho từ chối khoá anon (401) mà kho-can.json chưa cho khoá khác — không phải sai mật khẩu.
    if (error && (error.status === 401 || laSaiKhoaKho(error.message))) {
      throw new LoiCan(`Kho không nhận khoá truy cập đang lưu trên máy này, và ${this.cauHinh().diaChiKho}/kho-can.json chưa cho khoá mới `
        + '(mất mạng, hay web chưa cập nhật). Kiểm tra internet rồi thử lại; vẫn vậy thì báo người quản trị web.');
    }
    if (error) throw new LoiCan('Sai email hoặc mật khẩu.');
    const nd = await this.nguoiDung();
    if (!nd) {
      await c.auth.signOut().catch(() => {});
      throw new LoiCan('Tài khoản này không phải nhân viên kho đang làm (cần NV quầy, thủ kho, kế toán, quản lý hoặc chủ).');
    }
    return nd;
  }

  async dangXuat() {
    this.nguoiNen = null;
    this.nguoiBiet = null;
    this.lanDangNhap++;
    if (this.phu.danhMuc) return;
    const c = await this.layClient();
    await c.auth.signOut().catch(() => {});
    try { fs.rmSync(this.filePhien, { force: true }); } catch { /* không sao */ }
    this.client = null;
  }

  /**
   * Người đang đăng nhập — null nếu chưa, hoặc không phải vai kho (xem). 2.9.1: không đọc được kho (mất mạng, quá hạn, kho
   * lỗi) thì NÉM lỗi, không trả null — trước đó lỗi bị nuốt thành "chưa đăng nhập": đăng nhập xong mà mạng chập là bị đăng
   * xuất với câu "không phải nhân viên kho", tự gửi báo "Đăng nhập lại" trong khi chỉ là mất mạng.
   */
  async nguoiDung(): Promise<NguoiDung | null> {
    if (this.phu.nguoi) return this.phu.nguoi;
    if (this.phu.danhMuc || this.phu.kho) {
      const cn = { id: 'thu', ma: 'THU', ten: 'Chi nhánh thử' };
      return { email: 'thu@beeftown', hoTen: 'Kiểm thử', vaiTro: 'quan_ly', chiNhanh: cn, cacChiNhanh: [cn], quyen: quyenCuaVai('quan_ly') };
    }
    const lan = this.lanDangNhap;
    const nho = (nd: NguoiDung | null) => { if (lan === this.lanDangNhap) this.nguoiBiet = nd; return nd; };
    const c = await this.layClient();
    const { data: s, error: loiPhien } = await c.auth.getSession();
    // Phiên hết hạn mà làm mới hỏng vì mạng: phiên vẫn nằm trong phien.json — mất mạng, không phải chưa đăng nhập.
    if (loiPhien && isAuthRetryableFetchError(loiPhien)) throw new LoiCan(MAT_MANG_KHO);
    const u = s.session?.user;
    if (!u) return nho(null);
    const { data: ns, error: loiNs } = await c.from('nhan_su')
      .select('id, ho_ten, vai_tro, chi_nhanh_id').eq('auth_uid', u.id).eq('dang_lam', true).maybeSingle();
    if (loiNs) throw loiDocKho(loiNs);
    if (!ns || !(QUYEN_KHO.xem as readonly string[]).includes(ns.vai_tro)) return nho(null);
    const { data: cns, error: loiCn } = await c.from('chi_nhanh').select('id, ma, ten').order('ma');
    if (loiCn) throw loiDocKho(loiCn);
    const cacChiNhanh = (cns ?? []) as NguoiDung['cacChiNhanh'];
    const chon = ns.chi_nhanh_id ?? this.cauHinh().chiNhanhId;
    const chiNhanh = cacChiNhanh.find(x => x.id === chon) ?? (ns.chi_nhanh_id ? null : cacChiNhanh[0] ?? null);
    return nho({ email: u.email ?? '', hoTen: ns.ho_ten, vaiTro: ns.vai_tro, chiNhanh,
      cacChiNhanh: ns.chi_nhanh_id ? cacChiNhanh.filter(x => x.id === ns.chi_nhanh_id) : cacChiNhanh, quyen: quyenCuaVai(ns.vai_tro) });
  }

  /**
   * Danh mục cân từ kho. `tuDong` (2.9 — tự gửi): mọi vai xem — NV quầy đăng nhập ở máy quầy cũng tự gửi được (0061:
   * kho_can_giao_o_ma cho tên ô kèm số tảng). Gửi tay, xem trước, file USB, gỡ / xoá hàng: chỉ quản lý / chủ như trước.
   */
  private async layDanhMuc(tuDong = false): Promise<DanhMucKho> {
    const nd = await this.nguoiDung();
    if (!nd) throw new LoiCan('Chưa đăng nhập kho, hoặc phiên đăng nhập đã hết. Đăng nhập lại.');
    if (!nd.chiNhanh) throw new LoiCan('Chưa chọn chi nhánh.');
    if (!tuDong && !nd.quyen.danhMuc) throw new LoiCan('Đưa danh mục xuống cân chỉ dành cho quản lý hoặc chủ.');
    if (this.phu.danhMuc) return this.phu.danhMuc();
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

  /**
   * Phiếu huỷ ở quầy (chờ quản lý duyệt). Ảnh tải lên kho chứng từ trước, rồi mới gọi kho. 2.9.2: cùng ma_gui (gửi lại
   * cùng form, bấm hai lần) thì chạy lần lượt — lần sau dùng lại ảnh lần trước đã tải (anhHuy) và kho_tao_phieu_xuat trả
   * phiếu đã có. Trước 2.9.2 lần gửi lại tải ảnh vào đúng đường dẫn cũ, kho file báo "already exists", kẹt ở bước ảnh mãi.
   */
  async taoPhieuHuy(b: { maGui?: unknown; lyDoId?: unknown; ghiChu?: unknown; dong?: unknown; anh?: unknown }): Promise<{ soPhieu: string; daCo: boolean; loiAnh: string[] }> {
    const maGui = String(b.maGui ?? '');
    const truoc = this.huyDangGui.get(maGui);
    const viec = (truoc ?? Promise.resolve()).catch(() => { /* lần trước hỏng: lần này tự báo lỗi của nó */ }).then(() => this.taoPhieuHuyMotLan(b));
    if (LA_UUID.test(maGui)) this.huyDangGui.set(maGui, viec);
    try { return await viec; } finally { if (this.huyDangGui.get(maGui) === viec) this.huyDangGui.delete(maGui); }
  }

  private async taoPhieuHuyMotLan(b: { maGui?: unknown; lyDoId?: unknown; ghiChu?: unknown; dong?: unknown; anh?: unknown }): Promise<{ soPhieu: string; daCo: boolean; loiAnh: string[] }> {
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

    const tep: { f: File; dau: string }[] = [];
    for (const a of (Array.isArray(b.anh) ? b.anh : []).slice(0, 8) as AnhGui[]) {
      if (!a || typeof a.base64 !== 'string' || typeof a.loai !== 'string') continue;
      const du = Buffer.from(a.base64, 'base64');
      if (du.length > 10 * 1024 * 1024) throw new LoiCan(`Ảnh "${a.ten}" nặng quá 10 MB.`);
      tep.push({ f: new File([du], String(a.ten || 'anh.jpg').slice(0, 80), { type: a.loai }), dau: createHash('sha256').update(a.loai).update(du).digest('hex') });
    }
    if (ld.can_anh && tep.length === 0) throw new LoiCan(`Lý do "${ld.ten}" cần ảnh chụp hàng — chọn ít nhất một ảnh.`);
    // 2.9.2: lần gửi trước cùng các lô hỏng mà chưa biết kho đã ghi chưa (HuyChuaChac — kể cả trước khi chương trình khởi động
    // lại, trang mở form mới với ma_gui mới) → gửi bằng ma_gui của lần đó.
    const khoaLo = `${cn}|${[...new Set(x.dong.map(d => d.lo_id))].sort().join(',')}`;
    const maGuiDung = this.docHuyChuaChac().find(h => h.khoa === khoaLo)?.maGui ?? maGui;
    try {
      const tai = await this.taiAnhHuyGiuSo(kho, cn, maGuiDung, tep);
      if (ld.can_anh && tai.duongDan.length === 0) {
        throw new LoiCan(`Ảnh chưa tải lên được${tai.loi.length ? ': ' + tai.loi.join(' · ') : ''}. Thử lại.`);
      }
      const kq = await kho.rpc('kho_tao_phieu_xuat', {
        p_chi_nhanh_id: cn, p_ma_gui: maGuiDung, p_loai: 'huy', p_vi_tri_id: x.viTriId, p_vi_tri_den_id: null,
        p_ly_do_id: ld.id, p_ghi_chu: String(b.ghiChu ?? '').trim().slice(0, 500) || null, p_anh: tai.duongDan, p_dong: x.dong,
      }) as { so_phieu: string; da_co: boolean }[] | { so_phieu: string; da_co: boolean };
      const r = Array.isArray(kq) ? kq[0] : kq;
      this.ghiHuyChuaChac(khoaLo, null);
      return { soPhieu: r?.so_phieu ?? '', daCo: !!r?.da_co, loiAnh: tai.loi };
    } catch (e) {
      // Hỏng từ bước ảnh trở đi: chưa biết kho đã ghi phiếu chưa — lần gửi sau cùng các lô dùng lại ma_gui này.
      this.ghiHuyChuaChac(khoaLo, maGuiDung);
      throw e;
    }
  }

  /** 2.9.2 — các lần gửi phiếu huỷ chưa chắc còn hạn (HuyChuaChac). File hỏng / không có → rỗng. */
  private docHuyChuaChac(): HuyChuaChac[] {
    const ds = docJson<{ ds?: unknown }>(this.fileHuyChuaChac, {}).ds;
    const bay = this.bayGio();
    return (Array.isArray(ds) ? ds : []).filter((h): h is HuyChuaChac => laDoiTuong(h) && typeof h.khoa === 'string'
      && typeof h.maGui === 'string' && LA_UUID.test(h.maGui) && typeof h.luc === 'number' && bay - h.luc < HUY_CHUA_CHAC_GIU_MS);
  }

  /** Nhớ (`maGui`) hay quên (null) lần gửi chưa chắc của các lô `khoa`. Không ghi được thì thôi — chỉ mất phần nhớ qua lần mở. */
  private ghiHuyChuaChac(khoa: string, maGui: string | null): void {
    const cu = this.docHuyChuaChac();
    if (!maGui && !cu.some(h => h.khoa === khoa)) return;
    const ds = cu.filter(h => h.khoa !== khoa);
    if (maGui) ds.push({ khoa, maGui, luc: this.bayGio() });
    try { ghiJson(this.fileHuyChuaChac, { ds: ds.slice(-20) }, this.phu.vietByte); } catch { /* thôi */ }
  }

  /**
   * 2.9.2 — tải ảnh phiếu huỷ, nhớ theo lần gửi form (AnhHuyDaTai): ảnh đã tải (cùng dấu) dùng lại đường dẫn, ảnh mới
   * tải từng cái vào số sau soCuoi. Trả đường dẫn theo thứ tự ảnh người chọn, bỏ trùng.
   */
  private async taiAnhHuyGiuSo(kho: KhoTruyCap, cn: string, maGui: string, tep: { f: File; dau: string }[]): Promise<{ duongDan: string[]; loi: string[] }> {
    const duongDan: string[] = [], loi: string[] = [];
    if (tep.length === 0) return { duongDan, loi };
    const khoa = `${cn}/${maGui}`;
    const nho = this.anhHuy.get(khoa) ?? { soCuoi: 0, theoDau: new Map<string, string>() };
    this.anhHuy.delete(khoa);
    this.anhHuy.set(khoa, nho);   // mới dùng → cuối hàng; bỏ lần gửi cũ nhất khi quá ANH_HUY_NHO_TOI_DA
    while (this.anhHuy.size > ANH_HUY_NHO_TOI_DA) this.anhHuy.delete(this.anhHuy.keys().next().value as string);
    for (const { f, dau } of tep) {
      const cu = nho.theoDau.get(dau);
      if (cu) { if (!duongDan.includes(cu)) duongDan.push(cu); continue; }
      for (let lan = 0; ; lan++) {
        nho.soCuoi += 1;
        const r = await kho.taiAnhHuy(cn, maGui, [f], nho.soCuoi);
        const d = r.duongDan[0];
        if (d) { nho.theoDau.set(dau, d); duongDan.push(d); break; }
        // Số này đã có trong kho file (lần gửi trước khi chương trình khởi động lại — bộ nhớ ảnh đã mất): thử số sau.
        if (lan < ANH_HUY_THU_SO_SAU && r.loi.some(l => /already exists|Duplicate/i.test(l))) continue;
        loi.push(...r.loi);
        break;
      }
    }
    return { duongDan, loi };
  }

  /** Số PLU trên cân theo mã cân (file gốc + dòng WiFi không xoá được). Dòng trống (2.7) không phải hàng. */
  private pluTheoMa(): Map<string, number> {
    const m = new Map<string, number>();
    for (const h of this.docTrenCan().values()) if (h.ma && !laPluTrong(h)) m.set(h.ma, h.so);
    if (this.coFileGoc()) {
      try { for (const p of docFileCan(this.docGoc()).plu) if (p.ma && !laPluTrong(p)) m.set(p.ma, p.so); } catch { /* file hỏng: bỏ qua */ }
    }
    return m;
  }

  /** Tên đang nằm trên cân theo mã cân (file gốc + dòng WiFi không xoá được). Dòng trống (2.7) không phải hàng. */
  private tenTrenCan(): Map<string, string> {
    const m = new Map<string, string>();
    for (const h of this.docTrenCan().values()) if (h.ma && !laPluTrong(h)) m.set(h.ma, h.ten);
    if (this.coFileGoc()) {
      try { for (const p of docFileCan(this.docGoc()).plu) if (p.ma && !laPluTrong(p)) m.set(p.ma, p.ten); } catch { /* file hỏng: bỏ qua */ }
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

  /** tren-can.tsv — hàng cân đã xác nhận (đọc lại khớp, file từ cân) cùng hàng còn nằm lại; 2.9.3: không có lần gửi chưa xác nhận. */
  docTrenCan(): Map<number, HangTrenCan> { return docBangTrenCan(this.fileTrenCan); }

  /** 2.9.3 — cho-xac-nhan.tsv: dòng PLU đã gửi mà cân chưa xác nhận ("có thể đã trên cân"). */
  docChoXacNhan(): Map<number, HangTrenCan> { return docBangTrenCan(this.fileChoXacNhan); }

  /**
   * 2.9.3 — lần gửi chưa được cân xác nhận (đọc lại lệch / không đọc được): hàng vừa gửi có thể đã nằm trên cân (cân lưu mà
   * chưa đọc lại được, lưu một phần) → thêm vào cho-xac-nhan.tsv, KHÔNG vào tren-can.tsv. Hàng còn nằm lại tính cả các dòng
   * này: kho bỏ món trước khi cân được kiểm thì món đó vẫn được báo "có thể còn nằm lại", không lặng lẽ ở lại trên cân.
   */
  private themChoXacNhan(moi: FileCan, soDaGui: Set<number>) {
    const cho = this.docChoXacNhan();
    for (const [so, h] of hangTuFile(moi)) if (soDaGui.has(so)) cho.set(so, h);
    ghiFileAnToan(this.fileChoXacNhan, chuBangTrenCan(cho), this.phu.vietByte);
  }

  /** 2.9.3 — bỏ các số PLU khỏi cho-xac-nhan.tsv (vừa gỡ bằng ghi đè, đọc lại khớp). */
  private boChoXacNhan(so: Iterable<number>) {
    const cho = this.docChoXacNhan();
    let doi = false;
    for (const x of so) doi = cho.delete(x) || doi;
    if (doi) ghiFileAnToan(this.fileChoXacNhan, chuBangTrenCan(cho), this.phu.vietByte);
  }

  /**
   * Ghi tren-can.tsv — 2.9.1: luôn TRƯỚC file gốc (luuGoc) khi đổi cả hai. Hỏng giữa hai lần ghi (đầy ổ, mất điện) thì
   * tren-can.tsv mới hơn file gốc: hàng có thể đang trên cân nhiều hơn thật — chỉ thêm cảnh báo "còn nằm lại", gửi lại
   * vô hại. Ghi file gốc trước mà tren-can.tsv hỏng thì ngược lại: hàng thật trên cân (thêm trên bàn phím…) vắng khỏi
   * tren-can.tsv, kho không có → không ai biết nó còn nằm lại.
   */
  private ghiTrenCan(m: Map<number, HangTrenCan>) {
    ghiFileAnToan(this.fileTrenCan, chuBangTrenCan(m), this.phu.vietByte);
  }

  /**
   * Ghi file gốc, và một bản vào da-gui (`daGui`: thứ đã gửi — file nhỏ thông số / phím; mặc định = file gốc). 2.9.2: bản
   * lưu bỏ dòng cài đặt mạng (boDongMang — tên / mật khẩu WiFi TMT 15, 16, tên miền 19, thông số mạng): thư mục Tài liệu
   * có thể đồng bộ OneDrive, mà mỗi lần gửi trước đó để lại một bản sao mật khẩu WiFi. File gốc giữ nguyên đủ. Rồi dọn
   * da-gui (donDaGui).
   */
  private luuGoc(du: Uint8Array, daGui: Uint8Array = du) {
    ghiFileAnToan(this.fileGoc, du, this.phu.vietByte);
    fs.mkdirSync(this.thuMucDaGui, { recursive: true });
    const ten = `${tenTheoGioVn(this.bayGio())}.TMS`;
    fs.writeFileSync(path.join(this.thuMucDaGui, ten), boDongMang(daGui));
    this.donDaGui();
  }

  /**
   * 2.9.2 — da-gui giữ DA_GUI_GIU_TOI_DA bản .TMS mới nhất, bỏ bản cũ hơn DA_GUI_GIU_NGAY ngày (theo ngày sửa file; bản mới
   * nhất luôn giữ). Trước 2.9.2 không bao giờ dọn — tự gửi mỗi lần kho đổi là thêm một bản. File không phải .TMS (người dùng
   * để vào) không đụng. Từng file một: file hỏng (vừa mất, OneDrive đang giữ) bỏ qua, không dừng cả lượt, không làm hỏng lần
   * gửi. Trả các bản còn giữ, mới trước.
   */
  private donDaGui(): { f: string; ms: number }[] {
    let ten: string[];
    try { ten = fs.readdirSync(this.thuMucDaGui).filter(t => /\.tms$/i.test(t)); } catch { return []; }
    const ds: { f: string; ms: number }[] = [];
    for (const t of ten) {
      const f = path.join(this.thuMucDaGui, t);
      try { ds.push({ f, ms: fs.statSync(f).mtimeMs }); } catch { /* bỏ qua file này */ }
    }
    ds.sort((a, b) => b.ms - a.ms);
    // Ngày sửa file là giờ thật của máy (không phải đồng hồ kiểm thử bayGio).
    const bay = Date.now();
    return ds.filter((x, i) => {
      if (i === 0 || (i < DA_GUI_GIU_TOI_DA && bay - x.ms <= DA_GUI_GIU_NGAY * 86_400_000)) return true;
      try { fs.rmSync(x.f, { force: true }); return false; } catch { return true; }
    });
  }

  /**
   * 2.9.2 — main.ts gọi một lần sau khi mở: dọn da-gui (cả máy chưa gửi gì từ khi lên 2.9.2), rồi bỏ dòng mạng khỏi các bản còn
   * giữ — bản lưu trước 2.9.2 có tên / mật khẩu WiFi — giữ ngày sửa. Đọc / ghi bất đồng bộ từng file (file tạm rồi đổi tên):
   * không chặn máy chủ nhỏ, nhịp với cân, lần gửi. File không làm được thì bỏ qua — lần mở sau thử lại.
   */
  async lamSachDaGuiLucMo(): Promise<void> {
    for (const x of this.donDaGui()) {
      try {
        const du = new Uint8Array(await fs.promises.readFile(x.f));
        const sach = boDongMang(du);
        if (sach === du) continue;
        const tam = x.f + '.tam';
        await fs.promises.writeFile(tam, sach);
        await fs.promises.utimes(tam, new Date(x.ms), new Date(x.ms));
        await fs.promises.rename(tam, x.f);
      } catch { /* file này thôi */ }
    }
  }

  // ---- dấu "hàng trên cân chưa rõ" (xoá qua WiFi hỏng giữa chừng) ------------------
  /** Dấu còn đó (xoá qua WiFi hỏng sau khi đã gửi lệnh xoá) — null nếu không có. */
  canChuaRo(): CanChuaRo | null {
    return docDau<CanChuaRo>(this.fileCanChuaRo,
      j => (typeof j.luc === 'string' && typeof j.cau === 'string' ? { luc: j.luc, cau: j.cau } : null),
      { luc: '', cau: 'Lần xoá qua WiFi trước hỏng giữa chừng — cân có thể thiếu hàng, nạp USB ngay.' });
  }
  private ghiCanChuaRo(loi: string) {
    ghiJson(this.fileCanChuaRo, { luc: new Date().toISOString(), cau: `Xoá qua WiFi hỏng sau khi đã gửi lệnh xoá cả danh sách hàng: ${loi}` } satisfies CanChuaRo,
      this.phu.vietByte);
  }
  /** Cân vừa nhận đủ danh sách (ghi nhận file từ cân / đã nạp USB, gửi đủ danh sách, xoá qua WiFi đọc lại khớp). */
  private xoaCanChuaRo() { fs.rmSync(this.fileCanChuaRo, { force: true }); }

  // ---- 2.6: dấu "lần gửi chưa được cân xác nhận" (ChuaXacNhan) ------------------------
  /** Dấu còn đó — null nếu không có (docDau: file hỏng vẫn là còn dấu). */
  chuaXacNhan(): ChuaXacNhan | null {
    return docDau<ChuaXacNhan>(this.fileChuaXacNhan,
      j => (typeof j.luc === 'string' && typeof j.cau === 'string' && (j.loai === 'khong-doc' || j.loai === 'lech')
        ? { luc: j.luc, loai: j.loai, soHang: Number.isInteger(j.soHang) ? j.soHang as number : 0, cau: j.cau,
            ...(j.loai === 'khong-doc' ? {
              soLanThu: Number.isInteger(j.soLanThu) && (j.soLanThu as number) > 0 ? j.soLanThu as number : 1,
              thuLaiLuc: typeof j.thuLaiLuc === 'string' && Number.isFinite(Date.parse(j.thuLaiLuc)) ? j.thuLaiLuc : null,
            } : {}) } : null),
      { luc: '', loai: 'khong-doc', soHang: 0, cau: 'Lần gửi trước chưa được cân xác nhận.', soLanThu: 1, thuLaiLuc: null });
  }
  private ghiChuaXacNhan(dau: ChuaXacNhan) { ghiJson(this.fileChuaXacNhan, dau, this.phu.vietByte); }
  /**
   * Cân vừa được kiểm là có đúng danh sách chương trình ghi nhận (đọc lại khớp, file từ cân). 2.9.3: hết cả cho-xac-nhan.tsv —
   * người gọi đã đưa dòng nào thật sự trên cân vào tren-can.tsv (guiKeHoach), hay cân vừa có đúng cả danh sách.
   */
  private xoaChuaXacNhan() {
    fs.rmSync(this.fileChuaXacNhan, { force: true });
    fs.rmSync(this.fileChoXacNhan, { force: true });
  }

  // ---- HSD trên cân tính cho ngày nào (hsd-tinh-ngay.txt) -----------------------------
  /** HSD trên cân tính cho ngày nào, cân có in HSD không, và có cũ không (trước hôm nay giờ VN, hay chưa biết). */
  hsdTrenCan(): TrangThaiHsd {
    const homNay = this.homNay();
    const tinhNgay = docNgayHsd(this.fileHsdNgay);
    let coInHsd = false;
    if (this.coFileGoc()) {
      try { coInHsd = docFileCan(this.docGoc()).plu.some(p => p.hsd !== null); } catch { /* file hỏng: không nói gì về HSD */ }
    }
    return { homNay, tinhNgay, coInHsd, cu: coInHsd && (tinhNgay === null || tinhNgay < homNay) };
  }

  /**
   * Ghi ngày tính HSD đang nằm trên cân. Ghi file tạm rồi đổi tên (tắt máy giữa chừng không để lại file dở). Không ghi
   * được thì thôi: việc gửi đã xong, ngày cũ chỉ làm trang báo HSD cũ — hướng an toàn.
   */
  private ghiNgayHsd(ngay: string, file = this.fileHsdNgay) {
    if (!LA_NGAY.test(ngay)) return;
    try { ghiFileAnToan(file, ngay + '\r\n', this.phu.vietByte); } catch { /* xem trên */ }
  }

  /** Không biết HSD trên cân tính cho ngày nào nữa (file gốc mới có HSD khác bản chương trình đã gửi). */
  private quenNgayHsd() { try { fs.rmSync(this.fileHsdNgay, { force: true }); } catch { /* thôi — ngày cũ vẫn là ngày trước */ } }

  /**
   * Kế hoạch tính cho `ngay` không đổi HSD của hàng nào đang trên cân (mọi hàng kho quản HSD: số trên cân = số tính
   * hôm nay) → HSD trên cân đúng cho ngày đó, như vừa gửi. Lần xoá qua WiFi trước hỏng, hay (2.9.3) lần gửi trước cân chưa
   * xác nhận — chưa rõ cân có gì (cân có thể đang giữ HSD của lần gửi đó) — thì không.
   */
  private ghiNhanHsdKhop(kh: KeHoach, ngay: string) {
    if (this.canChuaRo() || this.chuaXacNhan()) return;
    if (kh.dong.some(d => d.hsd !== undefined && d.hsdCu !== undefined && d.hsd !== d.hsdCu)) return;
    if (docNgayHsd(this.fileHsdNgay) !== ngay) this.ghiNgayHsd(ngay);
  }

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
    // HSD trong file mới khác bản chương trình đã gửi (đặt trên cân, file của màn Đồng bộ cân / Nap-Can-WiFi…): không
    // biết số đó tính cho ngày nào → quên ngày tính, trang báo đỏ tới lần gửi sau.
    let cu: FileCan | null = null;
    if (this.coFileGoc()) { try { cu = docFileCan(this.docGoc()); } catch { cu = null; } }
    if (!cungHsd(cu, f)) this.quenNgayHsd();
    this.ghiTrenCan(hangTuFile(f));
    this.luuGoc(du);
    this.xoaCanChuaRo();
    this.xoaChuaXacNhan();   // file này là cân thật: hết nghi lần gửi trước
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

  /**
   * 2.9.1 — đọc danh mục kho cho một kế hoạch, có hạn (HAN_DOC_KHO_MS): quá hạn thì thôi — chưa gửi gì. `ngayHsd` lấy TRƯỚC
   * khi đọc kho (đọc vắt qua nửa đêm thì HSD trên cân ghi tính cho hôm qua — trang báo đỏ, gửi lại; không bao giờ ngược lại).
   * `soLanAp`: số lần đã gửi theo kho lúc BẮT ĐẦU đọc (tuGuiMotLan — đọc kho ngoài hàng đợi).
   */
  private async docKhoChoCan(tuDong: boolean): Promise<KhoChoCan> {
    const soLanAp = this.soLanApKho;
    const ngayHsd = this.homNay();
    const han = this.phu.hanKhoMs ?? HAN_DOC_KHO_MS;
    const dm = await trongHan(this.layDanhMuc(tuDong), han, () => new LoiCan(
      `Kho không trả lời sau ${han % 1000 ? (han / 1000).toFixed(1).replace('.', ',') : han / 1000} giây (mạng internet chậm hay mất) — `
      + 'chưa đọc được danh mục, chưa gửi gì xuống cân. Việc với cân qua WiFi vẫn chạy; thử lại khi có mạng.'));
    return { dm, ngayHsd, soLanAp };
  }

  /** Kế hoạch gửi: file gốc + danh mục kho (`kho` đọc sẵn — tự gửi; không có thì đọc ở đây). */
  private async dung(giuHangNgoaiKho: boolean, tuDong = false, kho?: KhoChoCan): Promise<KeHoachGui> {
    const goc = docFileCan(this.docGoc());
    const { dm, ngayHsd } = kho ?? await this.docKhoChoCan(tuDong);
    // boPhanChiDoc: không bao giờ gửi lại nhật ký bán (REP) / thông tin máy (INF) cũ xuống cân (2.2).
    const tuy = { giuHangNgoaiKho, giuGioCan: true, soChuSoMa: soChuSoMa(dm.mauMaVach), boPhanChiDoc: true };
    const kh = lapKeHoach(goc, dm.matHang, tuy, 'vi');
    const du = ghiFileCan(goc, kh, tuy);
    const moi = docFileCan(du);
    const tren = this.docTrenCan(), cho = this.docChoXacNhan();
    return { goc, kh, du, moi, tren, cho, conLai: conLaiSau(moi, hangCoTheTrenCan(tren, cho)), ngayHsd };
  }

  async xemTruoc(giuHangNgoaiKho = false): Promise<XemTruoc> {
    const { goc, kh, moi, conLai, ngayHsd } = await this.dung(giuHangNgoaiKho);
    // HSD trên cân đã đúng số tính hôm nay (không dòng nào đổi) → ghi nhận như vừa gửi.
    this.ghiNhanHsdKhop(kh, ngayHsd);
    return {
      dong: kh.dong.map(({ goc: _bo, ...d }) => d),
      dem: kh.dem, conLai, soHangSauKhiGui: moi.plu.length, coThayDoi: kh.coThayDoi || conLai.length > 0,
      phienBanCan: goc.phienBan,
      dauVan: dauKeHoach(conLai, moi), doiHsd: demBatTatHsd(kh.dong, goc), demNguocHsd: demDemNguocHsd(kh.dong),
      ngayHsd, hsdTrenCan: this.hsdTrenCan(), canChuaRo: this.canChuaRo(), chuaXacNhan: this.chuaXacNhan(),
    };
  }

  /**
   * Gửi một kế hoạch đã dựng (dung) — 2.6.1: qua cổng hai chiều, hỏng thì 33571 (guiPlu) —, đọc lại cân để kiểm (2.6,
   * xacNhanSauGui), rồi ghi nhận. Tự gửi dùng
   * thẳng kế hoạch nó vừa kiểm — không đọc kho lần hai (kho đổi giữa hai lần đọc thì thứ gửi đi khác thứ đã kiểm).
   * CHỈ khi đọc lại khớp mới ghi nhận (tren-can.tsv, file gốc, hsd-tinh-ngay.txt): gửi đủ danh sách → hết dấu "chưa rõ",
   * và HSD trên cân là số tính cho ngày của kế hoạch.
   * Gửi hỏng → không ghi nhận gì. Đọc lại thấy cân CHƯA nhận → không ghi nhận gì, dấu 'lech', tự gửi tạm dừng.
   * Không đọc lại được (2.9.3) → cũng KHÔNG ghi nhận gì: dấu 'khong-doc' kèm giờ tự gửi thử lại (lùi dần); trước 2.9.3 lần
   * gửi này được ghi nhận như cân đã nhận (rà soát 11/10/2026 — xem ChuaXacNhan).
   * Lần gửi chưa xác nhận: hàng vừa gửi vào cho-xac-nhan.tsv (có thể đã trên cân); lần đọc lại khớp sau đưa dòng nào cân
   * thật sự có vào tren-can.tsv.
   */
  private async guiKeHoach(p: KeHoachGui, timLai: boolean, tuDong = false): Promise<KetQuaGui> {
    const { du, moi, tren } = p;
    const { doiDiaChi, cachGui, soDaGui, loiHaiChieu } = await this.guiPlu(p, timLai);
    const soHangGui = soDaGui.size;
    const ketQua = await this.xacNhanSauGui(moi, soDaGui, cachGui);
    const luc = new Date().toISOString();
    // Cổng hai chiều hỏng: đã gửi qua 33571 (cân của quán từng bỏ qua cổng này — 03/10/2026), hay hỏng sau khi đã ghi.
    const veHaiChieu = !loiHaiChieu ? ''
      : cachGui === 'mot-chieu' ? ` (Cổng hai chiều không ghi được: ${loiHaiChieu.replace(/[.\s]+$/, '')} — nên đã gửi qua cổng 33571; ở quán cân từng bỏ qua cổng này.)`
      : ` (Cổng hai chiều báo lỗi sau khi đã gửi: ${loiHaiChieu.replace(/[.\s]+$/, '')} — cân có thể còn đang lưu.)`;
    // Đã gửi mà chưa xác nhận: các dòng vừa gửi có thể đã nằm trên cân.
    if (ketQua.loai !== 'khop') this.themChoXacNhan(moi, soDaGui);
    if (ketQua.loai === 'lech') {
      // Địa chỉ mới (nếu dò thấy) đã lưu — vẫn nói ra, không để đổi địa chỉ lặng lẽ.
      const cau = ketQua.cau + veHaiChieu
        + (doiDiaChi ? ` Cân đã đổi địa chỉ — tìm thấy ở ${doiDiaChi.den}, đã lưu địa chỉ mới.` : '');
      this.ghiChuaXacNhan({ luc, loai: 'lech', soHang: moi.plu.length, cau });
      throw new LoiCan(cau);
    }
    if (ketQua.loai === 'khong-doc') {
      // Cân có thể đã nhận (lần gửi này có thể đã đè giá / tên lên cân): lần đọc kho cũ hơn của tự gửi không được gửi nữa.
      this.soLanApKho++;
      // Lùi dần chỉ theo các lần TỰ gửi liên tiếp; người bấm Gửi là một lần thử mới (không đẩy lần tự gửi sau ra 10 phút).
      const truoc = this.chuaXacNhan();
      const soLanThu = tuDong && truoc?.loai === 'khong-doc' ? (truoc.soLanThu ?? 1) + 1 : 1;
      const thuLai = this.bayGio() + THU_LAI_KHONG_DOC_MS[Math.min(soLanThu, THU_LAI_KHONG_DOC_MS.length) - 1];
      const cauXacNhan = `Đã gửi ${soHangGui} hàng nhưng chưa đọc lại được cân để kiểm (${ketQua.cau.replace(/[.\s]+$/, '')}).${veHaiChieu} `
        + 'Chương trình CHƯA ghi nhận lần gửi này (bảng vẫn theo lần cân xác nhận gần nhất). '
        + (this.cauHinh().tuGui === true ? `Tự gửi thử lại lúc ${gioPhutVn(thuLai)}.`
          : 'Đóng phần mềm của hãng (TM-xA) nếu đang mở, để cân ở màn hình bán hàng rồi bấm Gửi xuống cân lần nữa.')
        + (doiDiaChi ? ` Cân đã đổi địa chỉ — tìm thấy ở ${doiDiaChi.den}, đã lưu địa chỉ mới.` : '');
      this.ghiChuaXacNhan({ luc, loai: 'khong-doc', soHang: moi.plu.length, cau: cauXacNhan, soLanThu, thuLaiLuc: new Date(thuLai).toISOString() });
      return { soHang: moi.plu.length, conLai: conLaiSau(moi, hangCoTheTrenCan(tren, this.docChoXacNhan())), doiDiaChi,
               xacNhan: false, cauXacNhan, soHangGui, cachGui };
    }
    // Đọc lại khớp. Cân chỉ thêm / sửa: dòng cũ vẫn nằm lại.
    for (const [so, h] of hangTuFile(moi)) tren.set(so, h);
    // Dòng của lần gửi chưa xác nhận trước mà kế hoạch này không có: cân đọc lại còn đúng dòng đó (cùng số PLU, mã) thì nó
    // thật sự nằm trên cân → tren-can.tsv (hàng còn nằm lại, gỡ được); không thì cân chưa từng nhận — bỏ.
    const soMoi = new Set(moi.plu.map(x => x.so));
    const doc = new Map(ketQua.trenCan.map(c => [c.so, c]));
    for (const [so, h] of this.docChoXacNhan()) {
      const c = doc.get(so);
      if (!soMoi.has(so) && c && c.ma === chuanMa(h.ma)) tren.set(so, { so, ma: c.ma, gia: c.cot[5] ?? '', ten: c.ten });
    }
    this.ghiTrenCan(tren);
    this.luuGoc(du);
    this.soLanApKho++;
    this.xoaCanChuaRo();
    this.ghiNgayHsd(p.ngayHsd);
    this.xoaChuaXacNhan();
    return { soHang: moi.plu.length, conLai: conLaiSau(moi, tren), doiDiaChi, xacNhan: true, cauXacNhan: null, soHangGui, cachGui };
  }

  /**
   * 2.6.1 — đưa hàng của kế hoạch xuống cân. Thấy ở quán 03/10/2026: cân bỏ qua MỌI lần gửi qua cổng 33571 (cả 69 hàng
   * mới, cả lần chỉ sửa giá 4 dòng), còn đọc qua cổng hai chiều 33581 thì được. Nên:
   *   1. ghi khối `DWL PLU` qua cổng hai chiều như phần mềm hãng, chờ hàng rào (cân đọc hết rồi mới trả UPL TIM —
   *      giao-thuc.ts `ghi`); không có CLR: cân chỉ thêm / sửa theo số PLU;
   *   2. không nối được cổng hai chiều → (trừ khi `timLai` false) hỏi 33571 ở địa chỉ cũ, không thông thì dò WiFi MỘT lượt
   *      (thuCan); cân ở địa chỉ mới thì ghi lại qua cổng hai chiều ở đó;
   *   3. vẫn không ghi được qua cổng hai chiều → cả file qua 33571 như trước 2.6.1 (không dò lần hai; 33571 cũng không
   *      nối được thì báo câu của lần dò). Cân ở địa chỉ đang dùng KHÁC mã máy chương trình nhớ → không gửi gì cả
   *      (quán có thể có hai cân).
   * File gốc / da-gui vẫn lưu CẢ file (thứ cân phải có sau lần gửi), không chỉ khối vừa gửi: file chỉ vài dòng PLU mà ai
   * đó nạp bằng USB thì cân xoá hết hàng khác.
   * Dòng gửi: chỉ các hàng thêm / sửa; CẢ danh sách khi không chắc cân đang có gì (dấu "chưa rõ" sau lần xoá hỏng, dấu
   * "chưa xác nhận") hay khi không có gì đổi (người bấm Gửi để gửi lại và kiểm). Đọc lại để kiểm: xacNhanSauGui.
   */
  private async guiPlu(p: KeHoachGui, timLai: boolean): Promise<{
    doiDiaChi: DoiDiaChi | null; cachGui: CachGui; soDaGui: Set<number>; loiHaiChieu: string | null;
  }> {
    const soDoi = new Set(p.kh.dong.filter(d => (d.loai === 'them' || d.loai === 'sua') && d.so !== null).map(d => d.so as number));
    const caDanhSach = soDoi.size === 0 || this.canChuaRo() !== null || this.chuaXacNhan() !== null;
    const guiDi = p.moi.plu.filter(x => caDanhSach || soDoi.has(x.so));
    const soDaGui = new Set(guiDi.map(x => x.so));
    if (!guiDi.length) {   // kho không có hàng nào lên cân: như trước 2.6.1
      return { doiDiaChi: await this.guiDenCan(p.du, timLai), cachGui: 'mot-chieu', soDaGui: new Set(), loiHaiChieu: null };
    }
    const r = await this.ghiHoacLui(['DWL\tPLU\t', ...guiDi.map(x => x.tho), 'END\tPLU\t'], p.du, timLai);
    // Qua 33571 là cả file: mọi hàng của kế hoạch đều vừa gửi.
    return { ...r, soDaGui: r.cachGui === 'mot-chieu' ? new Set(p.moi.plu.map(x => x.so)) : soDaGui };
  }

  /**
   * Ghi các khối DWL qua cổng hai chiều ở địa chỉ đang dùng (hàng rào UPL TIM); hỏng thì lui về cổng 33571 — rút từ guiPlu
   * 2.6.1 để thông số, chữ cài đặt, phím, mẫu tem (2.7) đi đúng đường như gửi giá:
   *   1. không dò WiFi ở lần ghi đầu; không nối được cổng hai chiều → (trừ khi `timLai` false) hỏi 33571 ở địa chỉ cũ, không
   *      thông thì dò WiFi MỘT lượt (thuCan); cân ở địa chỉ mới thì ghi lại qua cổng hai chiều ở đó;
   *   2. đã ghi xong khối mà hỏng sau đó (hết giờ hàng rào, đứt) → KHÔNG gửi chồng qua 33571 (cân có thể đang lưu), để đọc
   *      lại quyết định (cachGui 'hai-chieu' kèm loiHaiChieu);
   *   3. vẫn không ghi được qua cổng hai chiều → `duMotChieu` qua 33571 (guiDenCan bỏ dòng mạng, không dò lần hai).
   * Cân ở địa chỉ đang dùng khác mã máy chương trình nhớ → ném LoiKhacMay, không gửi gì (quán có thể có hai cân).
   */
  private async ghiHoacLui(khoi: string[], duMotChieu: Uint8Array, timLai: boolean): Promise<{
    doiDiaChi: DoiDiaChi | null; cachGui: CachGui; loiHaiChieu: string | null;
  }> {
    // Ghi ở địa chỉ đang dùng, không tự dò (dò một lần ở dưới nếu cần).
    const ghiHaiChieu = async (): Promise<{ xong: true } | { xong: false; loi: string; daGhi: boolean; khongNoi: boolean }> => {
      try {
        await this.voiKetNoi(kn => kn.ghi(khoi), false);
        return { xong: true };
      } catch (e) {
        if (e instanceof LoiKhacMay) throw e;   // chưa gửi gì: kiemMayHaiChieu chặn trước khi ghi
        const g = e instanceof LoiGiaoThuc;
        return { xong: false, loi: cauLoi(e), daGhi: g && e.daGhi, khongNoi: g && e.loai === 'khong-noi' };
      }
    };
    // Gửi được qua cổng hai chiều: nhớ mã máy (ARP) như guiDenCan — timCan dùng để nhận ra cân khác.
    const daGuiHaiChieu = async (doi: DoiDiaChi | null, loi: string | null) => {
      try { await this.nhoMac(this.cauHinh().ipCan); } catch { /* không đọc được mã máy: lần sau */ }
      return { doiDiaChi: doi, cachGui: 'hai-chieu' as const, loiHaiChieu: loi };
    };
    let lan = await ghiHaiChieu();
    if (lan.xong) return daGuiHaiChieu(null, null);
    // Đã ghi xong khối mà hỏng sau đó (hết giờ chờ hàng rào, đứt kết nối): cân có thể đã nhận / đang lưu — không gửi thêm
    // qua 33571 (gửi chồng lúc cân đang lưu), để đọc lại quyết định.
    if (lan.daGhi) return daGuiHaiChieu(null, lan.loi);
    let doiDiaChi: DoiDiaChi | null = null;
    let loiDo: LoiCan | null = null;
    if (timLai && lan.khongNoi) {
      // Không nối được cổng hai chiều: hỏi 33571 ở địa chỉ cũ, không thông thì dò WiFi — MỘT lượt (thuCan).
      const kq = await this.thuCan();
      if (kq.thongCan && kq.doi) {
        // Cân đổi địa chỉ: ghi qua cổng hai chiều ở địa chỉ mới trước (cân của quán bỏ qua 33571).
        doiDiaChi = kq.doi;
        const lan2 = await ghiHaiChieu();
        if (lan2.xong) return daGuiHaiChieu(doiDiaChi, null);
        if (lan2.daGhi) return daGuiHaiChieu(doiDiaChi, lan2.loi);
        lan = lan2;
      } else if (!kq.thongCan) {
        // Không thấy cân / thấy cân khác / nhiều cân: câu của lần dò (như guiDenCan) — báo nếu 33571 cũng không nối được.
        loiDo = kq.thay.length ? new LoiCan(kq.loi!) : new LoiKhongNoi(kq.loi!);
      }
    }
    // Cổng hai chiều hỏng → qua 33571 như trước 2.6.1, không dò lần hai.
    try { doiDiaChi = (await this.guiDenCan(duMotChieu, false)) ?? doiDiaChi; }
    catch (e) { throw loiDo && e instanceof LoiKhongNoi ? loiDo : e; }
    return { doiDiaChi, cachGui: 'mot-chieu', loiHaiChieu: lan.loi };
  }

  /**
   * 2.7 — đọc lại `phan` qua cổng hai chiều ở địa chỉ đang dùng (không dò WiFi) và so với khối vừa gửi (lechCaiDat).
   * Chưa khớp, hay đọc hỏng (cân đang lưu có thể chưa trả lời), thì chờ rồi đọc lại như xacNhanSauGui. Không bao giờ ném.
   * Cân trả phần rỗng → 'khong-doc' (cổng chưa thử trên cân thật trả dạng lạ — không kết luận "cân chưa nhận").
   */
  private async docLaiCaiDat(phan: PhanKiem, khoi: string[], cacLanCho: number[] = this.phu.choXacNhanMs ?? CHO_XAC_NHAN_MS):
    Promise<KetQuaXacNhan & { lech?: string[] }> {
    let lech: string[] | null = null;
    let loiCuoi = '';
    for (const ms of cacLanCho) {
      if (ms > 0) await new Promise(r => setTimeout(r, ms));
      let doc: string[];
      try {
        doc = await this.voiKetNoi(kn => kn.docPhan(phan), false);
        if (!doc.length) throw new LoiCan('cân trả phần này rỗng qua cổng hai chiều');
      } catch (e) {
        loiCuoi = cauLoi(e);
        if (e instanceof LoiGiaoThuc && e.loai === 'khong-cho-phep') break;   // cân khác mã máy: đọc lại vẫn vậy
        continue;
      }
      lech = lechCaiDat(phan, khoi, doc);
      if (!lech.length) return { loai: 'khop' };
    }
    return lech ? { loai: 'lech', cau: lech.slice(0, 5).join('; ') + (lech.length > 5 ? `; và ${lech.length - 5} chỗ khác` : ''), lech }
      : { loai: 'khong-doc', cau: loiCuoi };
  }

  /**
   * 2.7 — gửi một khối cài đặt (thông số TMS, chữ cài đặt TMT, phím SCP, mẫu tem LAB) xuống cân như gửi giá: ghi qua cổng
   * hai chiều, hỏng thì `duMotChieu` qua 33571 (ghiHoacLui), rồi đọc lại phần đó để kiểm (docLaiCaiDat).
   *   Khớp → xacNhan. Không đọc lại được → xacNhan false kèm câu (người gọi ghi nhận như trước 2.7).
   *   Đọc lại thấy cân CHƯA nhận → ném LoiCan: người gọi KHÔNG ghi nhận gì (file gốc vẫn là thứ cân đang có — trước 2.7,
   *   gửi qua 33571 là ghi nhận luôn, nên khi cân bỏ qua thì file gốc lệch cân và lần sửa sau báo "chưa có gì thay đổi").
   * `ten`: "thông số", "chữ cài đặt", "phím tắt", "mẫu tem" — cho câu báo.
   */
  private async guiCaiDat(phan: Exclude<PhanKiem, 'PLU'>, khoi: string[], duMotChieu: Uint8Array, ten: string): Promise<KetQuaCaiDat> {
    const { doiDiaChi, cachGui, loiHaiChieu } = await this.ghiHoacLui(khoi, duMotChieu, true);
    // Đã lui về 33571 vì cổng hai chiều không nối được: đọc lại một lần thôi (đọc lại nhiều lần chỉ làm trang treo lâu).
    const kq = await this.docLaiCaiDat(phan, khoi, cachGui === 'mot-chieu' ? [0] : undefined);
    const qua = cachGui === 'hai-chieu' ? 'cổng hai chiều' : 'cổng 33571';
    const veHaiChieu = loiHaiChieu
      ? ` (Cổng hai chiều ${cachGui === 'mot-chieu' ? 'không ghi được' : 'báo lỗi sau khi đã gửi'}: ${loiHaiChieu.replace(/[.\s]+$/, '')}.)` : '';
    if (kq.loai === 'lech') {
      throw new LoiCan(`Đã gửi ${ten} qua ${qua} nhưng đọc lại thấy cân CHƯA nhận: ${kq.cau}.${veHaiChieu} Chương trình chưa ghi nhận gì. `
        + 'Để cân ở màn hình bán hàng (không ở menu Prog, không có ai đang bấm) rồi gửi lại; vẫn vậy thì bấm "Lưu file nạp USB" và nạp bằng USB.'
        + (doiDiaChi ? ` Cân đã đổi địa chỉ — tìm thấy ở ${doiDiaChi.den}, đã lưu địa chỉ mới.` : ''));
    }
    if (kq.loai === 'khop') return { doiDiaChi, cachGui, xacNhan: true, cauXacNhan: null };
    return { doiDiaChi, cachGui, xacNhan: false,
      cauXacNhan: `Đã gửi ${ten} qua ${qua} nhưng chưa đọc lại được cân để kiểm (${kq.cau.replace(/[.\s]+$/, '')}).${veHaiChieu}` };
  }

  /** `timLai: false` — nối cân không được thì báo luôn, không dò WiFi (xem guiDenCan). */
  guiXuongCan(giuHangNgoaiKho = false, timLai = true): Promise<KetQuaGui> {
    return this.motLuc(async () => {
      const k = await this.guiKeHoach(await this.dung(giuHangNgoaiKho), timLai);
      // 2.9 — báo kho: cân đọc lại khớp thì vừa gửi được, hết lệch (2.9.3: chưa đọc lại được thì chưa "gửi được").
      if (k.xacNhan) { this.lucGuiDuoc = this.bayGio(); this.lechCuoi = 0; }
      return k;
    });
  }

  /**
   * 2.6: vừa gửi `moi` (guiPlu — qua 33571 thì cân không trả lời gì) — đọc danh sách hàng qua cổng hai chiều ở đúng địa chỉ vừa gửi
   * (không dò WiFi), so số PLU, mã cân, giá, HSD, tên (soPluVuaGui). Chưa khớp, hay đọc hỏng (cân đang lưu có thể chưa
   * trả lời), thì chờ rồi đọc lại (CHO_XAC_NHAN_MS) — trừ khi cân khác mã máy (đọc lại cũng vậy). Không bao giờ ném:
   * hết lượt mà chưa lần nào đọc được → 'khong-doc' kèm câu lỗi lần cuối; đã có lần đọc thấy lệch → 'lech' (đã thấy cân
   * chưa có hàng vừa gửi, không coi như chưa biết).
   */
  private async xacNhanSauGui(moi: FileCan, soDaGui: Set<number>, cachGui: CachGui):
    Promise<{ loai: 'khop'; trenCan: DongPlu[] } | { loai: 'khong-doc'; cau: string } | { loai: 'lech'; cau: string }> {
    const cacLanCho = this.phu.choXacNhanMs ?? CHO_XAC_NHAN_MS;
    let lech: LechPlu[] | null = null;
    let loiCuoi = '';
    for (const ms of cacLanCho) {
      if (ms > 0) await new Promise(r => setTimeout(r, ms));
      let trenCan: DongPlu[];
      try {
        const docLai = this.phu.docLaiPlu ?? (() => this.voiKetNoi(kn => kn.docPhan('PLU'), false));
        const dong = (await docLai()).filter(d => d.startsWith('PLU\t'));
        if (!dong.length) throw new LoiCan('cân trả danh sách hàng rỗng qua cổng hai chiều');
        trenCan = docPluDocLai(dong, moi);
      } catch (e) {
        loiCuoi = cauLoi(e);
        if (e instanceof LoiGiaoThuc && e.loai === 'khong-cho-phep') break;   // cân khác mã máy: đọc lại vẫn vậy
        continue;
      }
      lech = soPluVuaGui(moi.plu, trenCan);
      if (!lech.length) return { loai: 'khop', trenCan };
    }
    return lech ? { loai: 'lech', cau: cauLechPlu(lech, soDaGui, cachGui) } : { loai: 'khong-doc', cau: loiCuoi };
  }

  /**
   * Việc ghi xuống cân chạy lần lượt: tự gửi, bấm Gửi, gửi tem, gửi thử qua dây
   * không chồng nhau — hai file chồng nhau thì không biết cân giữ bản nào, và
   * việc sau lập kế hoạch từ file gốc việc trước vừa ghi.
   */
  private hangDoi: Promise<unknown> = Promise.resolve();
  private motLuc<T>(viec: () => Promise<T>): Promise<T> {
    // Kiểm lúc việc BẮT ĐẦU (không phải lúc xếp hàng): việc xếp sau lần đổi file cập nhật thì dừng gọn.
    const lan = this.hangDoi.then(() => {
      if (this.dangKhoiDongLai) throw new LoiCan('Chương trình đang khởi động lại để cập nhật — chờ cửa sổ mới mở rồi làm lại.');
      return viec();
    });
    this.hangDoi = lan.then(() => {}, () => {});
    return lan;
  }

  /**
   * Tự gửi (GĐ3): kho có thêm / sửa hàng so với cân (đổi giá, lóc tảng mới →
   * ô mã đổi tên theo số tảng, HSD đếm ngược sang ngày mới) thì gửi qua WiFi.
   * Không có gì đổi thì thôi. Hàng cần xoá không tính — WiFi không xoá được,
   * để người bấm nạp USB.
   * 2.9.3: lần gửi trước chưa đọc lại được cân (dấu 'khong-doc') → tới giờ thử lại (thuLaiLuc, lùi dần) thì gửi lại cả
   * danh sách, KỂ CẢ khi kế hoạch thấy kho không đổi so với lần cân xác nhận (cân có thể đang giữ bản chưa xác nhận); chưa
   * tới giờ thì không gửi, nói giờ thử lại.
   */
  lanTuGui: LanTuGui | null = null;
  async tuGuiMotLan(): Promise<LanTuGui> {
    const luc = new Date().toISOString();
    try {
      // 2.9.3: lần gửi trước chưa đọc lại được cân và chưa tới giờ thử lại → không đọc kho, không dựng kế hoạch (mỗi phút).
      const cho = this.chuaXacNhan();
      const hen = cho?.loai === 'khong-doc' ? Date.parse(cho.thuLaiLuc ?? '') : NaN;
      if (Number.isFinite(hen) && this.bayGio() < hen) {
        this.lanTuGui = { luc, daGui: false, cau: (this.canChuaRo() ? 'Lần xoá qua WiFi trước hỏng giữa chừng — cân có thể thiếu hàng, nạp USB ngay. ' : '')
          + 'Lần gửi trước chưa đọc lại được cân để kiểm (cân bận, phần mềm của hãng đang mở…) — '
          + `chương trình chưa ghi nhận; tự gửi thử lại lúc ${gioPhutVn(hen)}.` };
        return this.lanTuGui;
      }
      // 2.9.1: đọc kho NGOÀI hàng đợi việc với cân — mạng internet chậm / treo không giữ nhịp, tự đọc nhật ký, nút bấm. Lần gửi
      // trước cân chưa nhận (tạm dừng, xem dưới) thì không đọc kho như trước.
      const kho = cho?.loai === 'lech' ? null : await this.docKhoChoCan(true);
      // Kiểm và gửi trong CÙNG một việc của hàng đợi, trên CÙNG một lần đọc kho: đọc kho hai lần (kiểm rồi mới gửi) thì
      // kho đổi HSD giữa hai lần vẫn lọt xuống cân mà không ai xem.
      this.lanTuGui = await this.motLuc(async (): Promise<LanTuGui> => {
        // 2.6: lần gửi trước đọc lại thấy cân CHƯA nhận → không gửi lại mỗi phút (cân đang ở menu, hay không nhận qua
        // WiFi): chờ người bấm Gửi xuống cân (gửi được thì hết dấu) hay nạp USB.
        const dauTruoc = this.chuaXacNhan();
        if (dauTruoc?.loai === 'lech') {
          return { luc, daGui: false, cau: (this.canChuaRo() ? 'Lần xoá qua WiFi trước hỏng giữa chừng — cân có thể thiếu hàng, nạp USB ngay. ' : '')
            + 'Tự gửi tạm dừng: lần gửi trước, đọc lại thấy cân chưa nhận. Mở thẻ Gửi giá từ kho, để cân ở màn hình '
            + 'bán hàng rồi bấm Gửi xuống cân — hoặc nạp USB.' };
        }
        // Có lần gửi theo kho xong SAU lúc bắt đầu đọc kho (người bấm Gửi trong lúc đó): lần đọc này có thể cũ hơn thứ cân vừa
        // nhận — không gửi, lượt sau đọc kho lại.
        if (!kho || kho.soLanAp !== this.soLanApKho) {
          return { luc, daGui: false, cau: 'Vừa có lần gửi khác xuống cân trong lúc đọc kho — lượt tự gửi sau (trong 1 phút) đọc kho lại.' };
        }
        const p = await this.dung(false, true, kho);
        this.lechCuoi = p.kh.dem.them + p.kh.dem.sua;
        const chuaRo = this.canChuaRo();
        const nhacChuaRo = chuaRo ? 'Lần xoá qua WiFi trước hỏng giữa chừng — cân có thể thiếu hàng, nạp USB ngay. ' : '';
        // Bật / tắt in hạn dùng (HSD) của hàng trên cân (null ↔ số), hay hàng mới bật in HSD khi cân chưa in HSD hàng nào
        // (lần đầu là bật in HSD cho cả loạt hàng): tem in khác hẳn, và cân in HSD ra sao chưa thử trên cân thật → không
        // tự gửi, để quản lý xem trước rồi bấm Gửi. Chỉ đổi số ngày (đếm ngược hằng ngày, đổi lô) thì gửi như đổi giá.
        const batTat = demBatTatHsd(p.kh.dong, p.goc);
        if (batTat > 0) {
          return { luc, daGui: false, cau: nhacChuaRo
            + `Kho bật / tắt in hạn dùng (HSD) của ${batTat} hàng (hàng trên cân, hay hàng mới lần đầu in HSD) — tự gửi không bật / tắt HSD, `
            + 'nên chưa gửi gì (cả HSD đếm ngược của hàng khác). Mở thẻ Gửi giá từ kho, xem lại rồi bấm Gửi xuống cân (in HSD chưa thử trên cân thật).' };
        }
        // 2.9.3 — lần gửi trước chưa đọc lại được cân: thử lại theo giờ đã hẹn (lùi dần), không gửi mỗi phút.
        const thuLai = dauTruoc?.loai === 'khong-doc' ? dauTruoc : null;
        const henThuLai = Date.parse(thuLai?.thuLaiLuc ?? '');
        if (thuLai && Number.isFinite(henThuLai) && this.bayGio() < henThuLai) {
          return { luc, daGui: false, cau: nhacChuaRo + 'Lần gửi trước chưa đọc lại được cân để kiểm (cân bận, phần mềm của hãng đang mở…) — '
            + `chương trình chưa ghi nhận; tự gửi thử lại lúc ${gioPhutVn(henThuLai)}.` };
        }
        // Xoá qua WiFi hỏng giữa chừng, hay lần gửi trước chưa đọc lại được: file gốc không nói được cân đang có gì — không
        // bao giờ báo "khớp kho"; gửi lại cả danh sách (guiPlu: cổng hai chiều, hỏng thì 33571; cân thêm / sửa theo số PLU
        // nên đặt lại mọi hàng lệnh xoá — hay lần gửi chưa xác nhận — có thể đã đổi).
        if (!chuaRo && !thuLai && p.kh.dem.them + p.kh.dem.sua === 0) {
          this.ghiNhanHsdKhop(p.kh, p.ngayHsd);   // HSD trên cân đúng số tính hôm nay
          return { luc, daGui: false, cau: 'Cân đã khớp kho.' };
        }
        const demNguoc = demDemNguocHsd(p.kh.dong);
        const k = await this.guiKeHoach(p, Date.now() - this.lanDoHong >= DO_LAI_SAU_MS, true);
        // Cân đọc lại khớp → gửi được, hết lệch; chưa đọc lại được thì chưa biết cân đã nhận chưa (vẫn tính lệch — file gốc
        // chưa đổi), và (2.9.3) chưa phải "gửi được" — kho không thấy lần gửi mới mỗi lượt thử lại hỏng.
        if (k.xacNhan) { this.lucGuiDuoc = this.bayGio(); this.lechCuoi = 0; }
        const diaChi = k.doiDiaChi ? ` — cân đổi địa chỉ, đã tìm thấy ở ${k.doiDiaChi.den}.` : '.';
        const qua = k.cachGui === 'hai-chieu' ? 'cổng hai chiều' : 'cổng 33571';
        const henSau = Date.parse(this.chuaXacNhan()?.thuLaiLuc ?? '');
        const ketQua = k.xacNhan ? ', cân đã nhận (đọc lại khớp)'
          : ' — chưa đọc lại được cân để kiểm, chương trình chưa ghi nhận' + (Number.isFinite(henSau) ? `; tự gửi thử lại lúc ${gioPhutVn(henSau)}` : '');
        if (chuaRo) {
          return { luc, daGui: true, cau: `Đã gửi lại cả danh sách ${k.soHangGui} hàng sau lần xoá qua WiFi hỏng`
            + (k.xacNhan ? ' — vẫn nên nạp USB để chắc cân đủ hàng' : ketQua) + diaChi };
        }
        if (thuLai) {
          return { luc, daGui: true, cau: `Thử lại lần ${(thuLai.soLanThu ?? 1) + 1}: đã gửi lại cả danh sách ${k.soHangGui} hàng qua ${qua} `
            + '(lần gửi trước chưa đọc lại được cân)' + ketQua + diaChi };
        }
        return { luc, daGui: true, cau: `Đã tự gửi ${p.kh.dem.them} thêm, ${p.kh.dem.sua} sửa (gửi ${k.soHangGui} hàng qua ${qua})`
          + (demNguoc ? `, HSD đếm ngược ${demNguoc} hàng — tính cho ngày ${ngayNgan(p.ngayHsd)}` : '')
          + ketQua + diaChi };
      });
    } catch (e) {
      this.lanTuGui = { luc, daGui: false, cau: cauLoi(e), hong: true };
    }
    return this.lanTuGui;
  }

  // ---- 2.9: hỏi kho 15 giây, báo về kho mỗi phút (bao-kho.ts) ------------------------------
  /** Mã cài đặt của máy quầy (uuid, ma-may.txt) — sinh lần đầu; không ghi được file thì dùng mã trong bộ nhớ tới lúc tắt. */
  maMay(): string {
    if (this.maMayNho) return this.maMayNho;
    let ma = '';
    try { ma = fs.readFileSync(this.fileMaMay, 'utf8').trim(); } catch { /* chưa có */ }
    if (!LA_UUID.test(ma)) {
      ma = randomUUID();
      try { ghiFileAnToan(this.fileMaMay, ma, this.phu.vietByte); }
      catch { /* không ghi được: lần mở sau là máy mới với kho — đèn vẫn đúng */ }
    }
    this.maMayNho = ma;
    return ma;
  }

  /**
   * Hỏi kho các ô đang giao (kho_can_giao_o_ma — mọi vai xem). true = khác lần hỏi trước (vừa "Giao ô mã", chốt phiên,
   * tảng bán hết) → main.ts tự gửi ngay. Lần hỏi đầu chỉ nhớ (lượt tự gửi mỗi phút lo phần còn lại). Không ném: chưa đăng
   * nhập, mất mạng → false, lần sau hỏi lại.
   */
  /** Như voiKho, cho việc chạy nền: người đăng nhập nhớ NGUOI_NEN_MS (hỏi kho 15 giây không hỏi lại nhan_su mỗi lần). */
  private async voiKhoNen(): Promise<{ kho: KhoTruyCap; nd: NguoiDung; cn: string }> {
    const bayGio = this.bayGio();
    if (!this.nguoiNen || bayGio - this.nguoiNen.luc > NGUOI_NEN_MS) this.nguoiNen = { luc: bayGio, nd: await this.nguoiDung() };
    const nd = this.nguoiNen.nd;
    if (!nd) throw new LoiCan('Chưa đăng nhập kho, hoặc phiên đăng nhập đã hết. Đăng nhập lại.');
    if (!nd.chiNhanh) throw new LoiCan('Chưa chọn chi nhánh.');
    const kho = this.phu.kho ?? khoTuClient(await this.layClient());
    return { kho, nd, cn: nd.chiNhanh.id };
  }

  async khoDoiO(): Promise<boolean> {
    try {
      const { kho, cn } = await this.voiKhoNen();
      const vt = cn + '\n' + vanTayGiaoO(await kho.rpc('kho_can_giao_o_ma', { p_chi_nhanh_id: cn }));
      const cu = this.vanTayO;
      this.vanTayO = vt;
      return cu !== null && cu !== vt;
    } catch {
      return false;
    }
  }

  /**
   * Dòng đang nằm trên cân (tren-can.tsv) kèm phím tắt trong file gốc — bỏ dòng trống, hàng thử. 2.9.3: chỉ hàng cân đã
   * xác nhận (đọc lại khớp, file từ cân) — không có lần gửi chưa xác nhận (cho-xac-nhan.tsv); trước 2.9.3 lần gửi "khong-doc"
   * cũng vào đây, kho thấy tên ô mới khi cân vẫn tên cũ.
   */
  private trenCanBao() {
    let phim: PhimXem[] = [];
    try { phim = docPhim(docFileCan(this.docGoc())); } catch { /* chưa có file gốc: không phím */ }
    const tren = this.docTrenCan(), cho = this.docChoXacNhan();
    // 2.9.3: dòng nào cân có thể đang khác — lần xoá qua WiFi hỏng (cân có thể thiếu hàng) hay đọc lại lệch: mọi dòng; chưa
    // đọc lại được: dòng có lần gửi chờ xác nhận khác dòng đã xác nhận (mã / tên). Lần gửi lại cả danh sách y hệt không đánh dấu
    // dòng nào — trang pha lóc không chặn in tem mọi ô chỉ vì một lần đếm ngược HSD chưa đọc lại được.
    const caMay = this.canChuaRo() !== null || this.chuaXacNhan()?.loai === 'lech';
    const chuaChac = (h: { so: number; ma: string; ten: string }) => {
      if (caMay) return true;
      const c = cho.get(h.so);
      return !!c && (chuanMa(c.ma) !== chuanMa(h.ma) || c.ten.trim() !== h.ten.trim());
    };
    return dongTrenCanBao(tren.values(), phim, h => h.so === PLU_THU || laPluTrong(h), chuaChac);
  }

  /** Mốc nhật ký đã gửi kho của chi nhánh (giờ cân "YYYY-MM-DD HH:MM:SS"); chưa có → đầu ngày NHAT_KY_LAN_DAU_NGAY ngày trước. */
  private mocNhatKy(cn: string): string {
    const j = docJson<Record<string, unknown>>(this.fileNhatKyDaGui, {});
    const m = j[cn];
    return typeof m === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(m)
      ? m : `${congNgay(this.homNay(), -NHAT_KY_LAN_DAU_NGAY)} 00:00:00`;
  }

  /**
   * Gửi nhật ký tem lên kho (kho_may_can_nhat_ky) từ mốc của chi nhánh. Mốc chỉ tiến SAU khi kho trả lời — mất mạng giữa
   * chừng thì lần sau gửi lại (kho bỏ dòng trùng). Không có dòng mới → không gọi kho.
   */
  private async guiNhatKyLenKho(kho: KhoTruyCap, cn: string): Promise<{ tong: number; moi: number }> {
    const moc = this.mocNhatKy(cn);
    // File chưa đổi (giờ sửa, cỡ) và lần trước không có gì để gửi từ cùng mốc → không đọc lại cả file mỗi phút.
    let khoa = '';
    try { const st = fs.statSync(this.fileNhatKy); khoa = `${cn}|${moc}|${st.mtimeMs}|${st.size}`; } catch { return { tong: 0, moi: 0 }; }
    if (this.nhatKyDaXet?.khoa === khoa) return { tong: 0, moi: 0 };
    // Dòng có giờ cân ở tương lai (đồng hồ cân sai lúc in) không gửi: kho bỏ, và mốc nhảy tới đó thì dòng thật sau khi
    // chỉnh giờ không bao giờ được gửi. Giờ VN hiện tại + 5 phút (đồng hồ cân lệch vài phút vẫn nhận).
    const toiDa = gioVnTuMs(this.bayGio() + 5 * 60_000).replace('T', ' ');
    const ds = chonNhatKyGui(this.docNhatKyDaLuu().filter(d => d.luc <= toiDa), moc, NHAT_KY_MOT_LAN);
    if (!ds.length) { this.nhatKyDaXet = { khoa }; return { tong: 0, moi: 0 }; }
    this.nhatKyDaXet = null;
    const kq = await kho.rpc('kho_may_can_nhat_ky', { p_chi_nhanh_id: cn, p_ma_may: this.maMay(), p_dong: ds }) as { tong?: unknown; moi?: unknown };
    const j = docJson<Record<string, unknown>>(this.fileNhatKyDaGui, {});
    try { ghiJson(this.fileNhatKyDaGui, { ...j, [cn]: ds[ds.length - 1].luc }, this.phu.vietByte); } catch { /* không ghi được: lần sau gửi lại, kho bỏ trùng */ }
    return { tong: ds.length, moi: Number(kq?.moi) || 0 };
  }

  /**
   * Báo về kho một lần (main.ts, mỗi BAO_KHO_MS): trạng thái cân + dòng trên cân (kho_may_can_bao), rồi nhật ký tem. Không
   * ném. "Đã báo" chỉ khi kho đã trả lời; chưa đăng nhập / mất mạng / kho từ chối → ok:false kèm câu, lần sau thử lại.
   */
  async baoKhoMotLan(): Promise<LanBaoKho> {
    if (this.baoKhoDangChay) return this.baoKhoDangChay;
    const p = this.baoKhoMotLanThat().finally(() => { if (this.baoKhoDangChay === p) this.baoKhoDangChay = null; });
    this.baoKhoDangChay = p;
    return p;
  }

  private async baoKhoMotLanThat(): Promise<LanBaoKho> {
    const luc = new Date(this.bayGio()).toISOString();
    try {
      let kn: { kho: KhoTruyCap; nd: NguoiDung; cn: string };
      try { kn = await this.voiKhoNen(); } catch (e) {
        this.lanBaoKho = { luc, ok: false, cau: `Chưa báo trạng thái cân về kho: ${cauLoi(e)} (trang pha lóc không biết cân đã đổi tên chưa).` };
        return this.lanBaoKho;
      }
      const { kho, cn } = kn;
      const ch = this.cauHinh();
      const bayGio = this.bayGio();
      // Tự gửi tắt: vẫn so kho với cân (đọc kho, không gửi gì) mỗi TINH_LECH_MS — kho đổi mà cân chưa nhận thì đèn vàng
      // "Tự gửi đang tắt: quản lý bấm Gửi". Không so được (chưa có file gốc, kho lỗi) → chưa biết (null).
      if (ch.tuGui !== true && this.coFileGoc() && bayGio - this.lucTinhLech >= TINH_LECH_MS) {
        this.lucTinhLech = bayGio;
        try {
          const kho = await this.docKhoChoCan(true);   // 2.9.1: đọc kho ngoài hàng đợi việc với cân
          const kh = await this.motLuc(() => this.dung(false, true, kho));
          this.lechCuoi = kh.kh.dem.them + kh.kh.dem.sua;
        } catch { this.lechCuoi = null; }
      }
      const tren = this.trenCanBao();
      const khoa = cn + '\n' + JSON.stringify(tren);
      const guiTren = !this.trenCanDaBao || this.trenCanDaBao.khoa !== khoa || bayGio - this.trenCanDaBao.luc > GUI_LAI_TREN_CAN_MS;
      // Cách đây bao nhiêu GIÂY, không gửi mốc giờ của máy này — đồng hồ máy quầy sai không làm đèn ở kho sai.
      const giay = (ms: number) => (ms > 0 ? Math.max(0, Math.round((bayGio - ms) / 1000)) : null);
      await kho.rpc('kho_may_can_bao', {
        p_chi_nhanh_id: cn, p_ma_may: this.maMay(),
        p_bao: {
          phien_ban: this.phu.capNhat?.phienBan ?? null,
          mac_can: ch.macHaiChieu ?? ch.macCan ?? null,
          giu_ket_noi: this.giuKetNoiBat(),
          can_tra_loi_giay: giay(this.giu.lucNgheMs()),
          tu_gui: ch.tuGui === true,
          lech_so: this.lechCuoi,
          // 2.9.3 (migration 0090): lần gửi gần nhất cân chưa xác nhận (chưa đọc lại được / đọc lại lệch), hay lần xoá qua WiFi
          // hỏng giữa chừng — cân có thể khác tren_can. Trang pha lóc không nói "Cân sẵn sàng" khi cờ này bật.
          chua_xac_nhan: this.chuaXacNhan() !== null || this.canChuaRo() !== null,
          gui_loi: ch.tuGui === true && this.lanTuGui?.hong === true,
          gui_giay: giay(this.lucGuiDuoc),
          tren_can: guiTren ? tren : null,
        },
      });
      if (guiTren) this.trenCanDaBao = { khoa, luc: bayGio };
      let nk = { tong: 0, moi: 0 }, loiNk = '';
      try { nk = await this.guiNhatKyLenKho(kho, cn); } catch (e) { loiNk = cauLoi(e); }
      this.lanBaoKho = { luc, ok: !loiNk, cau: 'Đã báo trạng thái cân về kho'
        + (loiNk ? ` — nhật ký tem chưa gửi được (${loiNk}), tự thử lại sau 1 phút.`
           : nk.tong ? `, gửi ${nk.tong} dòng nhật ký tem (${nk.moi} dòng mới với kho).` : '.') };
    } catch (e) {
      this.lanBaoKho = { luc, ok: false, cau: `Chưa báo được về kho: ${cauLoi(e)} — tự thử lại sau 1 phút.` };
    }
    return this.lanBaoKho;
  }

  /** Dựng file để nạp bằng USB (cân sẽ thay cả danh sách → xoá được hàng). */
  async taoFileUsb(giuHangNgoaiKho = false): Promise<{ duongDan: string; soHang: number; ngayHsd: string }> {
    const { du, moi, ngayHsd } = await this.dung(giuHangNgoaiKho);
    ghiFileAnToan(this.fileChoUsb, du, this.phu.vietByte);
    fs.rmSync(this.fileDaTatChoUsb, { force: true });
    // HSD trong file tính cho hôm nay: nạp vào hôm sau thì "đã nạp USB" ghi đúng ngày tính, trang báo HSD cũ.
    fs.rmSync(this.fileHsdNgayChoUsb, { force: true });
    this.ghiNgayHsd(ngayHsd, this.fileHsdNgayChoUsb);
    return { duongDan: this.fileChoUsb, soHang: moi.plu.length, ngayHsd };
  }

  /**
   * File nạp USB từ file gốc (2.2): đường lui khi gửi thông số / phím / tem / giờ qua WiFi mà cân chưa đổi — file gốc
   * đã có sẵn thay đổi vừa gửi. Kèm thay đổi thông số / phím ĐANG SỬA trên trang mà chưa gửi (`thongSo`, `phim` — gửi
   * WiFi hỏng thì đi USB luôn): chỉ vào file USB, KHÔNG ghi file gốc — "Tôi đã nạp USB xong" (daNapUsb) mới ghi nhận.
   * 2.4: kèm cả chữ cài đặt chung đang sửa (`chuChung`). Bỏ phần giờ, nhật ký bán, thông tin máy như mọi lần gửi.
   */
  async taoFileUsbGoc(b: { thongSo?: unknown; phim?: unknown; chuChung?: unknown } = {}): Promise<{
    duongDan: string; soHang: number; thongSo: number[]; phim: { trang: number; phim: number }[]; chuChung: number[];
  }> {
    await this.kiemQuyenCan('Lưu file nạp USB');
    const thay: Record<string, string | number> = {};
    if (laDoiTuong(b.thongSo)) {
      for (const [k, v] of Object.entries(b.thongSo)) if (typeof v === 'string' || typeof v === 'number') thay[k] = v;
    }
    const thayPhim = (Array.isArray(b.phim) ? b.phim : []).filter(laDoiTuong).slice(0, 300)
      .map(t => ({ trang: Number(t.trang), phim: Number(t.phim), plu: Number(t.plu) }));
    const thayChu = layThayChu(b.chuChung);
    let du = this.docGoc();
    let doiTs: number[] = [], doiPhim: { trang: number; phim: number }[] = [], doiChu: number[] = [];
    if (Object.keys(thay).length) ({ du, doi: doiTs } = suaThongSoTrongFile(du, thay));
    if (thayPhim.length) ({ du, doi: doiPhim } = suaPhimTrongFile(du, thayPhim));
    if (Object.keys(thayChu).length) ({ du, doi: doiChu } = suaChuChungTrongFile(du, thayChu));
    const goc = docFileCan(du);
    const ra = ghiFileCan(goc, KHONG_DOI, { giuGioCan: true, boPhanChiDoc: true });
    ghiFileAnToan(this.fileChoUsb, ra, this.phu.vietByte);
    fs.rmSync(this.fileDaTatChoUsb, { force: true });
    fs.rmSync(this.fileHsdNgayChoUsb, { force: true });   // PLU như file gốc: HSD vẫn tính cho ngày cũ
    return { duongDan: this.fileChoUsb, soHang: goc.plu.length, thongSo: doiTs, phim: doiPhim, chuChung: doiChu };
  }

  // ---- tất cả hàng -------------------------------------------------------------
  /** Mọi hàng trên cân (theo file gốc và tren-can.tsv), đối chiếu kho nếu đã đăng nhập. */
  async tatCaHang(): Promise<TatCaHang> {
    const goc = docFileCan(this.docGoc());
    const phim = phimTheoPlu(goc);
    const ngayHsd = this.homNay();   // trước khi đọc kho — xem KeHoachGui
    let dm: DanhMucKho | null = null, loiKho: string | null = null;
    try { dm = await this.layDanhMuc(); } catch (e) { loiKho = cauLoi(e); }
    const soChuSo = soChuSoMa(dm?.mauMaVach);
    const fabi = (ma: string) => (ma ? ma.padStart(soChuSo, '0') : '');
    const hang: HangXem[] = [];
    const theoGoi = new Map(goc.plu.map(p => [p.so, p.cachBan === '2']));
    /** Số PLU kế hoạch theo kho dùng (cả hàng "Thêm" — dòng hiện không kèm số). */
    const soKeHoach = new Set<number>();

    if (dm) {
      const kh = lapKeHoach(goc, dm.matHang, { giuHangNgoaiKho: false, giuGioCan: true, soChuSoMa: soChuSo }, 'vi');
      for (const d of kh.dong) if (d.so !== null) soKeHoach.add(d.so);
      this.ghiNhanHsdKhop(kh, ngayHsd);   // HSD trên cân đã đúng số tính hôm nay → ghi nhận
      for (const d of kh.dong) {
        const base = { phim: d.so !== null && d.goc ? phim.get(d.so) ?? null : null, maCan: d.maCan, maFabi: fabi(d.maCan) };
        // HSD: đang ghi trên cân (dòng gốc), và kho muốn (chỉ khi kho quản HSD của hàng) kèm nguồn.
        const hsd = { ...(d.goc ? { hsd: d.goc.hsd } : {}), ...(d.hsd !== undefined ? { hsdKho: d.hsd } : {}),
                      ...(d.hsd !== undefined && d.hsdNguon ? { hsdNguon: d.hsdNguon } : {}) };
        if (d.loai === 'them') hang.push({ ...base, ...hsd, so: null, ten: d.ten, gia: d.gia, theoGoi: false, tinhTrang: 'chua_len', tenKho: d.ten, giaKho: d.gia });
        else if (d.loai === 'bo_qua') hang.push({ ...base, so: null, ten: d.ten, gia: d.gia, theoGoi: false, tinhTrang: 'khong_len', ghiChu: d.lyDo });
        else if (d.loai === 'xoa') {
          hang.push({ ...base, ...hsd, so: d.so, ten: d.ten, gia: d.gia, theoGoi: theoGoi.get(d.so!) ?? false,
            tinhTrang: laPluTrong({ ma: d.maCan }) ? 'trong' : 'ngoai_kho', ghiChu: d.lyDo });
        }
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
          theoGoi: p.cachBan === '2', tinhTrang: laPluTrong(p) ? 'trong' : 'tren_can', hsd: p.hsd });
      }
    }

    const trongFile = new Set(goc.plu.map(p => p.so));
    // 2.9.3: dòng của lần gửi chưa xác nhận (cho-xac-nhan.tsv) mà số PLU không thuộc file gốc, tren-can.tsv hay kế hoạch theo kho
    // (hàng kho còn muốn đã hiện ở dòng "Chưa lên cân" / "Khác kho"): có thể đang nằm trên cân.
    const tren = this.docTrenCan(), cho = this.docChoXacNhan();
    const choRieng = new Set<number>();
    for (const [so, h] of cho) if (!tren.has(so) && !soKeHoach.has(so) && !trongFile.has(so)) { tren.set(so, h); choRieng.add(so); }
    for (const h of tren.values()) {
      if (trongFile.has(h.so)) continue;
      if (laPluTrong(h)) {
        hang.push({ so: h.so, phim: null, maCan: h.ma, maFabi: '', ten: h.ten, gia: giaTuFile(h.gia, goc.soLeGia),
          theoGoi: false, tinhTrang: 'trong', ghiChu: 'PLU trống — đã gỡ hàng bằng ghi đè qua WiFi. Hàng mới sẽ dùng lại số PLU này.' });
        continue;
      }
      // Chưa đọc được kho: dòng chờ xác nhận không biết kho còn muốn không — "trên cân" (chưa đối chiếu), không "còn nằm lại".
      const cho1 = choRieng.has(h.so);
      hang.push({ so: h.so, phim: null, maCan: h.ma, maFabi: fabi(h.ma), ten: h.ten, gia: giaTuFile(h.gia, goc.soLeGia),
        theoGoi: false, tinhTrang: cho1 && !dm ? 'tren_can' : 'con_lai', ghiChu: !cho1
          ? 'Đã bỏ khỏi danh sách nhưng gửi qua WiFi không xoá được — gỡ khỏi cân qua WiFi (ghi đè) hoặc nạp USB.'
          : dm ? 'Đã gửi xuống cân nhưng cân chưa xác nhận, rồi kho bỏ — có thể còn nằm trên cân: gỡ khỏi cân qua WiFi (ghi đè) hoặc nạp USB.'
          : 'Đã gửi xuống cân nhưng cân chưa xác nhận — có thể đang nằm trên cân.' });
    }
    hang.sort((a, b) => (a.so ?? Infinity) - (b.so ?? Infinity) || Number(a.maCan) - Number(b.maCan));
    return { hang, coKho: dm !== null, loiKho, canChuaRo: this.canChuaRo(), chuaXacNhan: this.chuaXacNhan(), hsdTrenCan: this.hsdTrenCan() };
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

  /**
   * Gửi tem đã sửa. 2.7: chỉ khối mẫu tem cân đang dùng ("DWL LAB" + LAB, các LAS, LAE — cân thay cả mẫu cùng số) qua cổng
   * hai chiều, rồi đọc lại phần LAB để kiểm (guiCaiDat); cổng hai chiều không nối được thì cả file (bỏ dòng mạng) qua 33571
   * như trước. Đọc lại thấy cân chưa nhận → báo lỗi, file gốc và ô đã tắt giữ nguyên. CHƯA THỬ TRÊN CÂN THẬT.
   */
  async guiTem(thay: ThayDoiTem): Promise<{ ok: true; canhBao: string[] } & KetQuaCaiDat> {
    await this.kiemQuyenCan('Sửa tem');
    return this.motLuc(async () => {
      const { du, daTat, canhBao } = this.dungTem(thay);
      let khoi: string[];
      try { khoi = ['DWL\tLAB\t', ...dongMauTemDangDung(docFileCan(du)), 'END\tLAB\t']; }
      catch (e) { if (e instanceof LoiTem) throw new LoiCan(e.message); throw e; }
      const gui = await this.guiCaiDat('LAB', khoi, du, 'mẫu tem');
      this.luuGoc(du);
      ghiJson(this.fileDaTat, daTat, this.phu.vietByte);
      return { ok: true as const, canhBao, ...gui };
    });
  }

  async taoFileUsbTem(thay: ThayDoiTem): Promise<{ duongDan: string; soHang: number; canhBao: string[] }> {
    await this.kiemQuyenCan('Sửa tem');
    const { du, daTat, canhBao } = this.dungTem(thay);
    ghiFileAnToan(this.fileChoUsb, du, this.phu.vietByte);
    ghiJson(this.fileDaTatChoUsb, daTat, this.phu.vietByte);
    fs.rmSync(this.fileHsdNgayChoUsb, { force: true });   // PLU như file gốc: HSD vẫn tính cho ngày cũ
    return { duongDan: this.fileChoUsb, soHang: docFileCan(du).plu.length, canhBao };
  }

  /**
   * Đã nạp file cho-usb vào cân bằng USB → cân có đúng file đó. File làm từ kho (taoFileUsb) mang ngày tính HSD của
   * lúc lưu file — ghi ngày đó (không phải hôm nay): nạp file hôm qua thì trang vẫn báo HSD cũ.
   */
  daNapUsb(): { soHang: number } {
    if (!fs.existsSync(this.fileChoUsb)) throw new LoiCan('Chưa có file nạp USB. Bấm "Lưu file để nạp USB" trước.');
    const kq = this.ghiNhanFileTuCan(new Uint8Array(fs.readFileSync(this.fileChoUsb)));
    // File USB làm từ thẻ Tem: giờ cân mới thật sự có tem đó.
    if (fs.existsSync(this.fileDaTatChoUsb)) ghiJson(this.fileDaTat, docJson<DaTat>(this.fileDaTatChoUsb, {}), this.phu.vietByte);
    const ngayHsd = docNgayHsd(this.fileHsdNgayChoUsb);
    if (ngayHsd) this.ghiNgayHsd(ngayHsd);
    fs.rmSync(this.fileChoUsb, { force: true });
    fs.rmSync(this.fileDaTatChoUsb, { force: true });
    fs.rmSync(this.fileHsdNgayChoUsb, { force: true });
    return { soHang: kq.soHang };
  }

  // ---- 2.2: quyền --------------------------------------------------------------------
  /**
   * Việc với cân của bản 2.2 (cổng hai chiều, thông số, giờ, phím, sửa tem, xoá qua WiFi, nhật ký cân) theo
   * quy tắc thẻ Mẫu tem / Gửi giá: chưa đăng nhập kho thì làm được (máy của quản lý chạy không cần kho); đã
   * đăng nhập mà vai không có danh_muc (NV quầy, thủ kho, kế toán) → từ chối. Không đọc được người đăng nhập
   * (mất mạng; 2.9.1: kho không trả lời trong HAN_HOI_QUYEN_MS) thì theo người đọc được lần gần nhất (nguoiBiet — NV quầy
   * vẫn bị từ chối); chưa đọc được lần nào thì coi như chưa đăng nhập — như khi đăng xuất; việc với cân vẫn chạy được không
   * cần internet.
   */
  private async kiemQuyenCan(viec: string): Promise<void> {
    let nd: NguoiDung | null;
    // 2.9.1: hỏi kho có hạn ngắn — mạng internet treo (WiFi tới cân vẫn tốt) thì nút việc với cân không chờ kho cả phút.
    try { nd = await trongHan(this.nguoiDung(), this.phu.hanHoiQuyenMs ?? HAN_HOI_QUYEN_MS, () => new Error('hết hạn hỏi kho')); }
    catch { nd = this.nguoiBiet; }
    if (nd && !nd.quyen.danhMuc) throw new LoiCan(`${viec} chỉ dành cho quản lý hoặc chủ.`);
  }

  // ---- 2.2: cổng hai chiều 33581 (giao-thuc.ts) — CHƯA THỬ TRÊN CÂN THẬT ----------------
  /**
   * Chạy việc qua cổng hai chiều ở địa chỉ cân. Nối không được (chưa gửi byte nào): hỏi cổng 33571 ở địa chỉ
   * cũ, không thông thì dò WiFi (thuCan) — cân ở địa chỉ mới thì thử lại một lần ở đó. Cân vẫn ở địa chỉ cũ
   * mà cổng hai chiều không mở: báo đúng lỗi của giao-thuc.ts (câu đó đã chỉ đường USB).
   */
  private async quaHaiChieu<T>(viec: (ip: string, cong: number, tuy: TuyChonKetNoi) => Promise<T>, timLai = true): Promise<T> {
    const ch = this.cauHinh();
    const cong = ch.congHaiChieu ?? CONG_HAI_CHIEU;
    const tuy = this.phu.tuyHaiChieu ?? {};
    if (!timLai) return viec(ch.ipCan, cong, tuy);
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
      throw new LoiKhacMay(`Cân ở ${ip} (cổng ${cong}) có mã máy ${mac}, không phải cân chương trình vẫn dùng (${nho}) — chưa đọc, chưa gửi, `
        + 'chưa ghi nhận gì. Quán có hai cân hay router vừa đổi địa chỉ: trên cân bấm Prog → 4 → 2 xem địa chỉ, rồi chọn đúng cân ở '
        + 'Cài đặt → Tìm cân. Vừa thay cân: ở Cài đặt gõ lại địa chỉ cân rồi bấm Lưu cài đặt.', 'khong-cho-phep');
    }
    if (!nho && mac && ch.ipCan === ip) this.ghiThem({ macHaiChieu: mac });
  }

  /**
   * Làm một việc trên kết nối hai chiều, sau khi kiểm đúng cân (kiemMayHaiChieu). `timLai: false` — chỉ ở địa chỉ đang
   * dùng, không dò WiFi (đọc lại ngay sau khi vừa gửi được tới địa chỉ đó; nhịp nền).
   * 2.8 — giữ kết nối bật (mặc định): việc đi trên kết nối đang giữ (GiuKetNoi — dùng lại khi còn sống, không thì mở
   * mới); xong KHÔNG đóng. Kết nối hỏng giữa chừng hay tới cân khác mã máy thì bỏ. `moi`: bắt tay lại trên kết nối mới
   * (Đọc thông tin cân, Chẩn đoán WiFi). Giữ kết nối tắt: như 2.7 — mở, làm, đóng.
   */
  private voiKetNoi<T>(viec: (kn: KetNoiCan, ip: string, cong: number) => Promise<T>, timLai = true, moi = false): Promise<T> {
    if (!this.giuKetNoiBat()) {
      return this.quaHaiChieu(async (ip, cong, tuy) => {
        const kn = await moKetNoi(ip, cong, tuy);
        try {
          this.kiemMayHaiChieu(kn.thongTin.mac, ip, cong);
          return await viec(kn, ip, cong);
        } finally { kn.dong(); }
      }, timLai);
    }
    return this.quaHaiChieu(async (ip, cong, tuy) => {
      const kn = await this.giu.lay(ip, cong, { ...tuy, khiCanBao: (d) => this.khiCanBao(d) }, moi);
      try {
        this.kiemMayHaiChieu(kn.thongTin.mac, ip, cong);
      } catch (e) {
        this.giu.bo(kn);   // không giữ kết nối tới cân khác
        throw e;
      }
      try {
        const kq = await viec(kn, ip, cong);
        this.giu.daNghe(kn);
        return kq;
      } catch (e) {
        this.giu.hong(kn, e);
        throw e;
      }
    }, timLai);
  }

  // ---- 2.8: kết nối giữ mở, nhịp, nghe cân, tự chỉnh giờ, UDP (CHƯA THỬ TRÊN CÂN THẬT) -----------------------------
  private giuKetNoiBat(): boolean { return this.cauHinh().giuKetNoi !== false; }

  /**
   * Nhịp mỗi 30 giây (main.ts, như hãng hỏi UPL TIM): giữ kết nối hai chiều sống và biết cân còn đó (đèn ô Cân), đọc giờ
   * cân. Vừa nối (lại) được → đọc nhật ký bù những tem in lúc chưa nối. Không nối được ở địa chỉ đang dùng mà nghe UDP thấy
   * đúng một cân ở địa chỉ khác → nhận cân bằng mã máy rồi theo (theoUdp). Không dò cả WiFi (việc đó của tự gửi / nút Tìm
   * cân). Rồi tự chỉnh giờ cân nếu cần (tuDatGioNeuCan). Không bao giờ ném.
   */
  async nhipCan(): Promise<void> {
    if (this.dangNhip || this.dangKhoiDongLai) return;
    if (!this.giuKetNoiBat()) { this.giu.bo(); return; }
    // Có việc (của người dùng, tự gửi) nói chuyện được với cân SAU lần nhịp hỏng: hết lùi.
    if (this.nhipHong && this.giu.lucNgheMs() > this.lucNhipHong) { this.nhipHong = 0; this.nhipSau = 0; }
    if (this.bayGio() < this.nhipSau) return;
    this.dangNhip = true;
    try {
      const soLanTruoc = this.giu.trangThai().soLanMo;
      // Giờ cân: lấy luôn giờ vừa hỏi khi dùng lại kết nối (GiuKetNoi hỏi trước) — một lần UPL TIM mỗi nhịp.
      const docGioNhip = async () => {
        const gio = await this.voiKetNoi(async kn => this.giu.gioVuaHoi(kn) ?? kn.docGio(), false);
        const ms = this.bayGio();
        this.nen.gio = { luc: ms, gio, lechGiay: lechGiayVn(gio, ms) };
        this.nen.loi = null;
      };
      let duoc = false;
      try {
        await this.motLuc(async () => {
          try {
            await docGioNhip();
            duoc = true;
          } catch (e) {
            this.nen.loi = { luc: this.bayGio(), cau: cauLoi(e) };
            if (e instanceof LoiGiaoThuc && e.loai === 'khong-noi' && await this.theoUdp()) {
              await docGioNhip();
              duoc = true;
            }
          }
        });
      } catch (e) {
        this.nen.loi = { luc: this.bayGio(), cau: cauLoi(e) };
      }
      if (!duoc) {
        this.nhipHong++;
        this.lucNhipHong = this.bayGio();
        this.nhipSau = this.lucNhipHong + Math.min(NHIP_LUI_TOI_DA_MS, NHIP_CAN_MS * 2 ** (this.nhipHong - 1)) - 1_000;
        return;
      }
      this.nhipHong = 0;
      this.nhipSau = 0;
      if (this.giu.trangThai().soLanMo !== soLanTruoc) this.henDocNhatKy('noi', 0);
      await this.tuDatGioNeuCan();
    } catch (e) {
      this.nen.loi = { luc: this.bayGio(), cau: cauLoi(e) };
    } finally {
      this.dangNhip = false;
    }
  }

  /** Cân tự đẩy một dòng "ASK…" trên kết nối đang giữ: ASK REP = có nhật ký mới (vừa in tem) → hẹn đọc nhật ký. */
  private khiCanBao(dong: string): void {
    if (!dong.startsWith('ASK\tREP')) return;   // ASK PLU (cân hỏi một hàng, thông số 58 +2): không dùng
    this.nen.lucCanBao = this.bayGio();
    this.henDocNhatKy('bao');
  }

  /**
   * Hẹn tự đọc nhật ký qua WiFi: sau `cho` ms (in liền nhiều tem thì cân báo nhiều lần — đọc một lần), và cách lần tự đọc
   * trước ít nhất KHOANG_DOC_NHAT_KY_MS. Đã có hẹn thì thôi; đang đọc thì đọc thêm một lần khi xong.
   */
  private henDocNhatKy(lyDo: 'bao' | 'noi', cho = this.phu.nhatKyMs?.cho ?? CHO_SAU_BAO_MS): void {
    if (this.dangDocNhatKy) { this.canDocLai ??= lyDo; return; }
    if (this.henNhatKy) return;
    const khoang = this.phu.nhatKyMs?.khoang ?? KHOANG_DOC_NHAT_KY_MS;
    // Lần trước hỏng (cân không trả nhật ký, dữ liệu lạ): chờ LUI_SAU_NHAT_KY_HONG_MS — việc hỏng làm bỏ kết nối, nhịp nối lại
    // rồi hẹn đọc bù: không lùi thì đọc → hỏng → nối lại → đọc… mỗi 30 giây mãi.
    const lui = this.lucNhatKyHong ? this.lucNhatKyHong + (this.phu.nhatKyMs?.luiHong ?? LUI_SAU_NHAT_KY_HONG_MS) - this.bayGio() : 0;
    const ms = Math.max(cho, this.lucDocNhatKy + khoang - this.bayGio(), lui, 0);
    this.henNhatKy = setTimeout(() => { this.henNhatKy = null; void this.docNhatKyNen(lyDo); }, ms);
    this.henNhatKy.unref?.();
  }

  /**
   * Tự đọc nhật ký qua WiFi (như nút "Đọc qua WiFi" của thẻ Nhật ký cân, không kiểm vai: chỉ đọc cân rồi lưu vào
   * nhat-ky-can.tsv trên máy này — xem vẫn chỉ quản lý / chủ). Một lượt mỗi lúc, xếp hàng với mọi việc khác (motLuc).
   * Không bao giờ ném: lỗi vào trạng thái nền.
   */
  async docNhatKyNen(lyDo: 'bao' | 'noi' = 'bao'): Promise<void> {
    if (this.dangDocNhatKy) { this.canDocLai ??= lyDo; return; }
    if (!this.giuKetNoiBat() || this.dangKhoiDongLai) return;
    this.dangDocNhatKy = true;
    try {
      const r = await this.motLuc(() => this.docNhatKyWifi(false, false));
      const { soMoi } = this.gopVaoNhatKy(r.kq.dong);
      this.nen.nhatKy = { luc: new Date(this.bayGio()).toISOString(), lyDo, soDong: r.kq.dong.length, soMoi, loi: r.kq.loi[0] ?? null };
      this.lucNhatKyHong = 0;
    } catch (e) {
      this.nen.nhatKy = { luc: new Date(this.bayGio()).toISOString(), lyDo, soDong: 0, soMoi: 0, loi: cauLoi(e) };
      this.lucNhatKyHong = this.bayGio();
    } finally {
      this.lucDocNhatKy = this.bayGio();
      this.dangDocNhatKy = false;
      const lai = this.canDocLai;
      this.canDocLai = null;
      if (lai) this.henDocNhatKy(lai);
    }
  }

  /**
   * Tự chỉnh giờ cân (2.8): giờ cân đọc ở nhịp vừa rồi lệch giờ Việt Nam quá NGUONG_TU_DAT_GIO_GIAY → đặt theo giờ VN
   * (DWL TIM, đọc lại trong hàng rào — datGio). Mỗi ngày (giờ VN) tối đa TU_DAT_GIO_TOI_DA lần, cách nhau
   * TU_DAT_GIO_CACH_MS — sáng mở chương trình là cân đúng giờ; cân mất điện giữa ngày thì chỉnh lại. Trước khi gửi: giờ
   * máy tính phải khớp giờ mạng (máy chủ kho) trong LECH_GIO_MAY_TOI_DA_GIAY — máy tính sai giờ mà chỉnh theo thì cân in
   * sai ngày đóng gói, sai HSD. Không kiểm được thì không chỉnh. Mọi lần (kể cả dừng trước) ghi vào tu-dat-gio.json.
   */
  private async tuDatGioNeuCan(): Promise<void> {
    const g = this.nen.gio;
    if (this.cauHinh().tuDatGio === false || !g || Math.abs(g.lechGiay) <= NGUONG_TU_DAT_GIO_GIAY) return;
    const ngay = this.homNay();
    const cu = this.docTuDatGio();
    const lan = cu && cu.ngay === ngay ? cu.lan : [];
    // Chỉ lần đã GỬI giờ xuống cân mới tính vào giới hạn trong ngày — sáng mất mạng 30 phút (không kiểm được giờ máy tính,
    // chưa gửi gì) không làm mất tự chỉnh cả ngày. Mọi lần (kể cả chưa gửi) cách nhau ít nhất TU_DAT_GIO_CACH_MS.
    if (lan.filter(l => l.daGui).length >= TU_DAT_GIO_TOI_DA) return;
    const cuoi = lan[lan.length - 1];
    if (cuoi && this.bayGio() - Date.parse(cuoi.luc) < TU_DAT_GIO_CACH_MS) return;
    const luc = new Date(this.bayGio()).toISOString();
    // Giữ 20 lần gần nhất trong ngày (mất mạng cả ngày: mỗi 10 phút một lần chưa gửi).
    const ghi = (l: Omit<LanTuDatGio, 'luc' | 'lechTruoc'>) => this.ghiTuDatGio({ ngay, lan: [...lan, { luc, lechTruoc: g.lechGiay, ...l }].slice(-20) });
    const huong = (giay: number, nhanh: string, cham: string) => `${giay > 0 ? nhanh : cham} ${khoangThoiGianNgan(Math.abs(giay))}`;
    const mang = await this.layGioMang();
    if (mang === null) {
      ghi({ daGui: false, ok: false, cau: `Giờ cân ${huong(g.lechGiay, 'nhanh', 'chậm')} nhưng chưa tự chỉnh: không lấy được giờ mạng để kiểm `
        + 'giờ máy tính (mất mạng?). Chỉnh tay ở thẻ Cân & thông số nếu giờ máy tính đúng.' });
      return;
    }
    const lechMay = Math.round((this.bayGio() - mang) / 1000);
    if (Math.abs(lechMay) > LECH_GIO_MAY_TOI_DA_GIAY) {
      ghi({ daGui: false, ok: false, cau: `Giờ cân ${huong(g.lechGiay, 'nhanh', 'chậm')} nhưng chưa tự chỉnh: giờ máy tính ${huong(lechMay, 'nhanh', 'chậm')} `
        + 'so với giờ mạng — chỉnh giờ máy tính trước (Windows: Cài đặt → Thời gian → Đặt giờ tự động).' });
      return;
    }
    try {
      const gio = await this.motLuc(() => this.voiKetNoi(async (kn) => {
        const g2 = gioVnLuc(this.bayGio());
        await kn.datGio(g2);
        return g2;
      }, false));
      this.nen.gio = { luc: this.bayGio(), gio, lechGiay: 0 };
      ghi({ daGui: true, ok: true, cau: `Đã tự chỉnh giờ cân theo giờ Việt Nam (${chuoiGio(gio)}); trước đó giờ cân ${huong(g.lechGiay, 'nhanh', 'chậm')}.` });
    } catch (e) {
      ghi({ daGui: !(e instanceof LoiGiaoThuc && (e.loai === 'khong-noi' || e.loai === 'khong-cho-phep')), ok: false,
        cau: `Tự chỉnh giờ cân chưa được: ${cauLoi(e)}` });
    }
  }

  /** Giờ mạng (ms) — trường Date của máy chủ kho; không lấy được → null. */
  private async layGioMang(): Promise<number | null> {
    if (this.phu.gioMang) return this.phu.gioMang();
    try {
      const r = await (this.phu.fetch ?? fetch)(this.cauHinh().diaChiKho, { method: 'HEAD', cache: 'no-store', signal: AbortSignal.timeout(5000) });
      const d = Date.parse(r.headers.get('date') ?? '');
      return Number.isFinite(d) ? d : null;
    } catch { return null; }
  }

  docTuDatGio(): TuDatGio | null {
    const j = docJson<Partial<TuDatGio>>(this.fileTuDatGio, {});
    return typeof j.ngay === 'string' && Array.isArray(j.lan) ? { ngay: j.ngay, lan: j.lan as LanTuDatGio[] } : null;
  }
  private ghiTuDatGio(v: TuDatGio) {
    try { ghiJson(this.fileTuDatGio, v, this.phu.vietByte); } catch { /* không ghi được: lần sau thử lại — cân vẫn đúng giờ nếu đã chỉnh */ }
  }

  /** Bật / tắt nghe UDP theo cài đặt. */
  async capNhatUdp(): Promise<void> {
    if (this.cauHinh().ngheUdp === true) await this.udp.bat();
    else this.udp.tat();
  }

  /**
   * Nhịp không nối được cân ở địa chỉ đang dùng: nghe UDP thấy ĐÚNG MỘT cân phát ở địa chỉ khác (trong UDP_GAN_DAY_MS) →
   * nối cổng hai chiều ở đó, mã máy phải đúng mã đã nhớ (macHaiChieu) → dùng địa chỉ mới (ghiDoiDiaChi, như dò WiFi).
   * Chưa nhớ mã máy / không nghe UDP / không thấy hay thấy nhiều cân → không làm gì. Trả địa chỉ đã đổi hay null.
   */
  private async theoUdp(): Promise<DoiDiaChi | null> {
    const ch = this.cauHinh();
    if (ch.ngheUdp !== true || !ch.macHaiChieu || !this.udp.dangNghe) return null;
    const khac = this.udp.ganDay(UDP_GAN_DAY_MS).filter(c => c.ip !== ch.ipCan);
    if (khac.length !== 1) return null;
    const ip = khac[0].ip, cong = ch.congHaiChieu ?? CONG_HAI_CHIEU;
    let kn: KetNoiCan;
    try { kn = await this.giu.lay(ip, cong, { ...(this.phu.tuyHaiChieu ?? {}), khiCanBao: (d) => this.khiCanBao(d) }); }
    catch { return null; }
    if (kn.thongTin.mac !== ch.macHaiChieu) { this.giu.bo(kn); return null; }
    const vanNhu = this.cauHinh();
    if (vanNhu.ipCan !== ch.ipCan) { this.giu.bo(kn); return null; }   // người vừa đổi địa chỉ ở Cài đặt
    return this.ghiDoiDiaChi(ch.ipCan, ip, ch.macCan);
  }

  /** Thông số 58 trong file gốc: bật tự báo khi có nhật ký mới (+1)? null = không biết. */
  private tuBao58(): boolean | null {
    let khoa: string;
    try { const st = fs.statSync(this.fileGoc); khoa = `${st.mtimeMs}:${st.size}`; } catch { return null; }
    if (this.tuBao58Nho?.khoa === khoa) return this.tuBao58Nho.v;
    let v: boolean | null = null;
    try {
      const d = docFileCan(this.docGoc()).dong.find(x => /^TMS\t58\t/.test(x));
      const so = d ? Number(d.split('\t')[2]) : NaN;
      v = Number.isInteger(so) ? (so & 1) === 1 : null;
    } catch { v = null; }
    this.tuBao58Nho = { khoa, v };
    return v;
  }

  /** Trạng thái việc chạy nền (ô Cân). */
  trangThaiNen(): TrangThaiNen {
    const ch = this.cauHinh();
    const iso = (ms: number) => new Date(ms).toISOString();
    const td = this.docTuDatGio();
    const g = this.nen.gio;
    return {
      giu: { bat: this.giuKetNoiBat(), ...this.giu.trangThai() },
      loi: this.nen.loi ? { luc: iso(this.nen.loi.luc), cau: this.nen.loi.cau } : null,
      gio: g ? { luc: iso(g.luc), gioCan: chuoiGio(g.gio), lechGiay: g.lechGiay } : null,
      lucCanBao: this.nen.lucCanBao ? iso(this.nen.lucCanBao) : null,
      tuBao58: this.tuBao58(),
      nhatKy: this.nen.nhatKy,
      tuDatGio: { bat: ch.tuDatGio !== false, ngay: td?.ngay ?? null, lan: td?.lan ?? [] },
      udp: {
        bat: ch.ngheUdp === true, dangNghe: this.udp.dangNghe, loi: this.udp.loi,
        thay: this.udp.ganDay(UDP_GAN_DAY_MS).map(c => ({ ip: c.ip, cong: c.cong, luc: iso(c.luc) })),
      },
      baoKho: this.lanBaoKho,
    };
  }

  /** Đóng kết nối đang giữ, thôi nghe UDP, bỏ hẹn đọc nhật ký (tắt chương trình, kiểm thử). */
  dongNen(): void {
    if (this.henNhatKy) { clearTimeout(this.henNhatKy); this.henNhatKy = null; }
    this.giu.bo();
    this.udp.tat();
  }

  /** Thông tin cân + giờ trên cân qua cổng 33581 — chỉ đọc, không ghi gì; việc nên thử đầu tiên ở quán. */
  async thongTinCanHaiChieu(): Promise<ThongTinHaiChieu> {
    await this.kiemQuyenCan('Đọc thông tin cân qua WiFi');
    // 2.8: bắt tay lại trên kết nối mới (moi) — nút này là để kiểm cân trả lời từ đầu, không dùng kết nối đang giữ.
    return this.motLuc(() => this.voiKetNoi(async (kn, ip, cong) => {
      const gio = await kn.docGio();
      const ms = this.bayGio();
      return { thongTin: kn.thongTin, gio, gioVn: chuoiGio(gioVnLuc(ms)), lechGiay: lechGiayVn(gio, ms), ip, cong };
    }, true, true));
  }

  /**
   * Đọc dữ liệu cân qua WiFi (TMS, TMT, SCP, DPT, CLS, PLU, BAR, LAB) — thay bước USB "Bắt đầu" / "Cập nhật
   * file gốc từ cân". Chỉ ghi nhận khi file ghép lại đọc được (ghiNhanFileTuCan gọi docFileCan, hỏng thì ném
   * LoiFileCan và không ghi gì). Không có cài đặt mạng (docFileTuKetNoi bỏ TMT 15/16/19, thông số mạng).
   * Không ghi nhận khi: cân khác mã máy (kiemMayHaiChieu); cân trả 0 hàng hay 0 thông số (cổng chưa thử này trả dạng
   * lạ / lệch dòng — ghi nhận thì file gốc rỗng, lần gửi sau đè hàng mới lên PLU 1, 2, 3… đang có trên cân); hay thiếu PLU
   * chương trình biết là đang nằm trên cân (tren-can.tsv) — dùng USB để cập nhật file gốc.
   */
  async docTuCanQuaWifi(): Promise<{ soHang: number; phienBan: string; thongTin: ThongTinCan }> {
    await this.kiemQuyenCan('Đọc dữ liệu từ cân');
    return this.motLuc(async () => {
      // 2.8: trên kết nối đang giữ (voiKetNoi kiểm mã máy TRƯỚC khi đọc) — không mở kết nối thứ hai tới cân.
      const { thongTin, du } = await this.voiKetNoi(kn => docFileTuKetNoi(kn));
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
            + `(PLU ${mat.slice(0, 8).join(', ')}${mat.length > 8 ? '…' : ''}) theo chương trình. Có thể lần gửi trước cân chưa nhận — `
            + 'cũng có thể cổng hai chiều trả thiếu, nên chương trình chưa ghi nhận gì. Để chắc: trên cân lưu dữ liệu ra USB rồi chọn '
            + 'file đó ở Cài đặt → Cập nhật file gốc từ cân (đó là danh sách thật trên cân).');
        }
      }
      const kq = this.ghiNhanFileTuCan(du);
      return { soHang: kq.soHang, phienBan: kq.phienBan, thongTin };
    });
  }

  /**
   * 2.7 — GỠ hàng "còn nằm lại" qua WiFi bằng GHI ĐÈ (CHƯA THỬ TRÊN CÂN THẬT). Cân không có lệnh xoá một hàng, nhưng ghi
   * theo số PLU: mỗi số PLU còn nằm lại nhận một dòng trống (mã MA_CAN_TRONG 99999, giá 0, tên TEN_PLU_TRONG, không in
   * HSD — dongPluRieng). Phím tắt đang gọi số đó được bỏ (SCP … 0): hàng mới dùng lại số PLU không thừa hưởng phím cũ.
   * An toàn hơn xoá hẳn (xoaQuaWifi): chỉ là lệnh DWL như gửi giá, không lúc nào cân thiếu hàng; hỏng giữa chừng thì
   * gửi lại (ghi đè lần nữa không hại gì).
   *   0. chỉ chạy đúng kế hoạch người đã xem (dauVan của xemTruoc), chỉ với cân đã biết mã máy (như xoaQuaWifi), chỉ qua
   *      cổng hai chiều ở địa chỉ đang dùng (cổng 33571 không trả lời nên không kiểm được), không dò WiFi;
   *   1. đọc danh sách PLU trên cân trước (chưa gửi gì): số PLU nào giờ là HÀNG KHÁC (thêm trên bàn phím, phần mềm hãng,
   *      cân khác) → không gỡ gì (ghi đè là mất hàng đó); số đã là dòng trống hay cân không còn → không cần ghi;
   *   2. ghi khối PLU (dòng trống cho số còn hàng) + khối SCP (phím bỏ) + hàng rào, trên cùng kết nối;
   *   3. đọc lại PLU: mọi số vừa gỡ phải là dòng trống → tren-can.tsv ghi các số đó là dòng trống (số cân không còn thì
   *      bỏ khỏi tren-can.tsv); lệch / không đọc được → ném lỗi, không ghi nhận gì;
   *   4. đọc lại SCP (khi có bỏ phím): khớp → file gốc nhận phím đã bỏ; không thì báo riêng (loiPhim) — hàng vẫn đã gỡ.
   */
  async goHangConLai(giuHangNgoaiKho = false, dauVan?: unknown): Promise<KetQuaGo> {
    await this.kiemQuyenCan('Gỡ hàng còn nằm lại qua WiFi');
    if (typeof dauVan !== 'string' || !dauVan) {
      throw new LoiCan('Thiếu danh sách đã xem trước — bấm Xem lại (thẻ Gửi giá từ kho, hay "Xem hàng còn nằm lại") rồi thử lại. Chưa gửi gì xuống cân.');
    }
    return this.motLuc(async () => {
      const { goc, moi, tren, cho, conLai } = await this.dung(giuHangNgoaiKho);
      if (!conLai.length) throw new LoiCan('Không có hàng nào còn nằm lại trên cân — không cần gỡ.');
      if (dauKeHoach(conLai, moi) !== dauVan) {
        throw new LoiCan('Danh sách trên cân hoặc trong kho đã đổi từ lúc xem trước — bấm Xem lại rồi thử lại. Chưa gửi gì xuống cân.');
      }
      if (!this.cauHinh().macHaiChieu) {
        throw new LoiCan('Chưa biết mã máy của cân qua cổng hai chiều — bấm "Đọc thông tin cân" (thẻ Cân & thông số), xem đúng cân của quầy rồi mới gỡ. '
          + 'Chưa gửi gì xuống cân.');
      }
      const ke = (ds: number[]) => ds.slice(0, 8).map(so => 'PLU ' + so).join(', ') + (ds.length > 8 ? '…' : '');
      const saiSo = conLai.filter(h => h.so < 1 || h.so > PLU_RIENG_TOI_DA).map(h => h.so);
      if (saiSo.length) {
        throw new LoiCan(`Số PLU không hợp lệ trong danh sách hàng trên cân của chương trình (${ke(saiSo)}) — bấm "Đọc dữ liệu từ cân qua WiFi" `
          + '(hay cập nhật file gốc bằng USB) rồi xem lại. Chưa gửi gì xuống cân.');
      }
      const soGo = new Set(conLai.map(h => h.so));
      const phimBo = docPhim(goc).filter(k => k.plu > 0 && soGo.has(k.plu)).map(k => ({ trang: k.trang, phim: k.phim, plu: 0 }));
      const ph = phimBo.length ? suaPhimTrongFile(this.docGoc(), phimBo) : null;
      const dongTrong = (so: number) => dongPluRieng(goc, { so, ma: MA_CAN_TRONG, ten: TEN_PLU_TRONG, gia: 0 });

      let canGo: HangTrenCan[] = [], khongCo: HangTrenCan[] = [], daTrong: HangTrenCan[] = [];
      try {
        await this.voiKetNoi(async (kn) => {
          const dangCo = new Map(docPluDocLai(await kn.docPhan('PLU'), goc).map(p => [p.so, p]));
          if (!dangCo.size) {
            throw new LoiCan('Cân không trả danh sách hàng qua WiFi (cổng hai chiều) — không kiểm được cân đang có gì nên chưa gửi gì. Dùng "Lưu file để nạp USB".');
          }
          // Mã chương trình biết cho số đó: dòng đã xác nhận, và (2.9.3) dòng của lần gửi chưa xác nhận — cân có thể giữ một trong hai.
          const maBiet = (so: number) => [tren.get(so), cho.get(so)].filter((x): x is HangTrenCan => !!x).map(x => chuanMa(x.ma));
          const khac = conLai.filter(h => { const p = dangCo.get(h.so); return !!p && !laPluTrong(p) && !maBiet(h.so).includes(p.ma); });
          if (khac.length) {
            throw new LoiCan(`Trên cân, ${khac.length} số PLU giờ là hàng khác (${khac.slice(0, 5).map(h => `PLU ${h.so}: "${dangCo.get(h.so)!.ten.trim()}" `
              + `mã ${dangCo.get(h.so)!.ma || '—'}`).join('; ')}) — thêm trên bàn phím cân, bằng phần mềm của hãng, hay đây không phải cân vẫn dùng. `
              + 'Gỡ sẽ ghi đè mất hàng đó, nên chưa gửi gì. Bấm "Đọc dữ liệu từ cân qua WiFi" (hay cập nhật file gốc bằng USB) rồi xem lại.');
          }
          canGo = conLai.filter(h => { const p = dangCo.get(h.so); return !!p && !laPluTrong(p); });
          daTrong = conLai.filter(h => { const p = dangCo.get(h.so); return !!p && laPluTrong(p); });
          khongCo = conLai.filter(h => !dangCo.has(h.so));
          const khoi = [...(canGo.length ? ['DWL\tPLU\t', ...canGo.map(h => dongTrong(h.so)), 'END\tPLU\t'] : []), ...(ph?.khoi ?? [])];
          if (khoi.length) await kn.ghi(khoi);
        }, false);
      } catch (e) {
        // Đã gửi rồi mới hỏng (hết giờ hàng rào, đứt): cân có thể đã nhận — đọc lại quyết định. Chưa gửi gì: báo luôn.
        if (!(e instanceof LoiGiaoThuc) || !e.daGhi) throw e;
      }
      const khoiPlu = ['DWL\tPLU\t', ...canGo.map(h => dongTrong(h.so)), 'END\tPLU\t'];
      if (canGo.length) {
        const kq = await this.docLaiCaiDat('PLU', khoiPlu);
        const ds = ke(canGo.map(h => h.so));
        if (kq.loai === 'lech') {
          throw new LoiCan(`Đã gửi dòng trống cho ${canGo.length} hàng (${ds}) qua cổng hai chiều nhưng đọc lại thấy cân CHƯA nhận: ${kq.cau}. `
            + 'Chương trình chưa ghi nhận gì. Để cân ở màn hình bán hàng rồi bấm lại (ghi đè lần nữa không hại gì), hoặc nạp USB.');
        }
        if (kq.loai === 'khong-doc') {
          throw new LoiCan(`Đã gửi dòng trống cho ${canGo.length} hàng (${ds}) nhưng chưa đọc lại được cân để kiểm (${kq.cau.replace(/[.\s]+$/, '')}). `
            + 'Chương trình chưa ghi nhận gì — bấm lại (ghi đè lần nữa không hại gì), hoặc gọi thử số PLU đó trên cân: ra "KHÔNG DÙNG" là đã gỡ.');
        }
      }
      for (const h of [...canGo, ...daTrong]) tren.set(h.so, { so: h.so, ma: MA_CAN_TRONG, gia: '0,0', ten: TEN_PLU_TRONG });
      for (const h of khongCo) tren.delete(h.so);   // cân không còn số đó (đã nạp USB…): chỉ bỏ khỏi danh sách
      this.ghiTrenCan(tren);
      this.boChoXacNhan(soGo);   // 2.9.3: số vừa gỡ không còn "có thể" là hàng của lần gửi chưa xác nhận
      let loiPhim: string | null = null, phimXong = false;
      if (ph) {
        const kp = await this.docLaiCaiDat('SCP', ph.khoi);
        if (kp.loai === 'khop') phimXong = true;
        else {
          loiPhim = (kp.loai === 'lech' ? `Đọc lại thấy phím tắt chưa đổi: ${kp.cau}.` : `Chưa đọc lại được phím tắt (${kp.cau.replace(/[.\s]+$/, '')}).`)
            + ' Hàng đã gỡ; phím vẫn gọi số PLU đó (ra dòng trống) — bỏ phím ở thẻ Phím tắt.';
        }
      }
      // File gốc bỏ dòng của các số vừa gỡ (như hàng còn nằm lại sau một lần gửi: chỉ tren-can.tsv giữ — ở đây là dòng
      // trống), và nhận phím đã bỏ khi cân đọc lại khớp. Không bỏ thì thẻ Tất cả hàng vẫn hiện hàng cũ "Kho không có".
      const duMoi = boDongPlu(phimXong && ph ? ph.du : this.docGoc(), soGo);
      const khoiDaGui = [...(canGo.length ? khoiPlu : []), ...(phimXong && ph ? ph.khoi : [])];
      if (khoiDaGui.length) this.luuGoc(duMoi, fileNho(goc.phienBan, khoiDaGui));
      else ghiFileAnToan(this.fileGoc, duMoi, this.phu.vietByte);   // không gửi gì (cân đã không còn / đã là dòng trống): chỉ sửa file gốc
      return { daGo: conLai, khongCoTrenCan: khongCo.map(h => h.so), boPhim: phimXong ? phimBo.length : 0, loiPhim };
    });
  }

  /**
   * Xoá hẳn hàng "còn nằm lại" qua WiFi — THỬ, CHƯA THỬ TRÊN CÂN THẬT. Cân không có lệnh xoá một PLU, nên:
   *   0. chỉ chạy đúng kế hoạch người đã xem (dauVan của xemTruoc), không mang bật / tắt in HSD chưa gửi (HSD đếm
   *      ngược thì được — cả danh sách gửi lại mang số ngày tính hôm nay), và chỉ với cân
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
  async xoaQuaWifi(giuHangNgoaiKho = false, dauVan?: unknown): Promise<{ soHang: number; daXoa: HangTrenCan[]; phucHoi: string | null }> {
    await this.kiemQuyenCan('Xoá hàng trên cân qua WiFi');
    if (typeof dauVan !== 'string' || !dauVan) {
      throw new LoiCan('Thiếu danh sách đã xem trước — bấm Xem lại (thẻ Gửi giá từ kho, hay "Xem hàng còn nằm lại") rồi thử lại. Chưa gửi gì xuống cân.');
    }
    return this.motLuc(async () => {
      const { goc, kh, du, moi, tren, cho, conLai, ngayHsd } = await this.dung(giuHangNgoaiKho);
      if (!conLai.length) throw new LoiCan('Không có hàng nào còn nằm lại trên cân — không cần xoá.');
      if (dauKeHoach(conLai, moi) !== dauVan) {
        throw new LoiCan('Danh sách trên cân hoặc trong kho đã đổi từ lúc xem trước — bấm Xem lại rồi thử lại. Chưa gửi gì xuống cân.');
      }
      if (demBatTatHsd(kh.dong, goc) > 0) {
        throw new LoiCan('Kho bật / tắt in hạn dùng (HSD) của hàng chưa gửi — gửi ở thẻ Gửi giá từ kho (xem trước, in thử tem) rồi mới xoá. Chưa gửi gì xuống cân.');
      }
      if (!this.cauHinh().macHaiChieu) {
        throw new LoiCan('Chưa biết mã máy của cân qua cổng hai chiều — bấm "Đọc thông tin cân" (thẻ Cân & thông số), xem đúng cân của quầy rồi mới xoá. '
          + 'Chưa gửi gì xuống cân.');
      }
      const khoi = khoiXoaVaNapPlu(moi.plu.map(p => p.tho));   // danh sách rỗng → LoiGiaoThuc, không xoá sạch cân
      const khoa = (so: number, ma: string) => `${so}\t${ma}`;
      const muon = new Set(moi.plu.map(p => khoa(p.so, p.ma)));
      // Cân phải đang có: hàng của file gốc và hàng còn nằm lại (tren-can.tsv) — số PLU và mã cân; 2.9.3: hay hàng của lần
      // gửi chưa xác nhận (cho-xac-nhan.tsv) — cân có thể đã nhận.
      const biet = new Map<number, Set<string>>();
      const bietThem = (so: number, ma: string) => biet.set(so, (biet.get(so) ?? new Set<string>()).add(chuanMa(ma)));
      for (const p of goc.plu) bietThem(p.so, p.ma);
      for (const h of [...tren.values(), ...cho.values()]) bietThem(h.so, h.ma);
      const ke = (ds: number[]) => ds.slice(0, 8).map(so => 'PLU ' + so).join(', ') + (ds.length > 8 ? '…' : '');
      let daGuiXoa = false;
      let lechSauXoa: string | null = null;   // đọc lại sau lệnh xoá thấy cân chưa đúng: thiếu / thừa hàng nào
      try {
        const docLai = await this.voiKetNoi(async (kn) => {
          const truoc = await kn.docPhan('PLU');
          const dongTruoc = truoc.map(d => d.split('\t')).filter(c => c[0] === 'PLU');
          if (!dongTruoc.length) {
            throw new LoiCan('Cân không trả danh sách hàng qua WiFi (cổng hai chiều — chưa thử trên cân thật) — không kiểm được cân đang có gì '
              + 'nên chưa gửi gì. Dùng "Lưu file để nạp USB".');
          }
          const la = dongTruoc.map(c => ({ so: parseInt(c[1], 10) || 0, ma: chuanMa(c[2]) }))
            .filter(x => !biet.get(x.so)?.has(x.ma)).map(x => x.so).sort((a, b) => a - b);
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
          lechSauXoa = [thieu.length ? `thiếu ${thieu.length} hàng (${so(thieu)})` : '', thua.length ? `thừa ${thua.length} hàng (${so(thua)})` : '']
            .filter(Boolean).join(', ');
          throw new LoiCan(`Đã gửi lệnh xoá và cả danh sách ${moi.plu.length} hàng qua WiFi (cổng hai chiều — chưa thử trên cân thật) `
            + `nhưng đọc lại thấy cân chưa đúng: ${lechSauXoa}. Cân có thể đang thiếu hàng — nạp USB ngay: bấm "Lưu file để nạp USB" rồi nạp file vào cân. `
            + 'Chương trình chưa ghi nhận gì.');
        }
      } catch (e) {
        // Đã bắt đầu gửi lệnh xoá (trừ khi bị chặn trước khi gửi byte nào): cân có thể đang thiếu hàng.
        const chuaGui = e instanceof LoiGiaoThuc && e.loai === 'khong-cho-phep' && !e.daGhi;
        if (!daGuiXoa || chuaGui) throw e;
        // 2.7: không bỏ cân thiếu hàng giữa giờ bán — tự gửi lại ngay cả danh sách của kế hoạch (DWL, không CLR) rồi đọc lại.
        const { trenCan: phucHoi, soLanGui } = await this.phucHoiSauXoa(moi);
        if (!phucHoi) {
          try { this.ghiCanChuaRo(cauLoi(e)); } catch { /* không ghi được dấu: câu lỗi dưới đây vẫn bảo nạp USB ngay */ }
          throw new LoiCan(`${cauLoi(e).replace(/[.\s]+$/, '')}. `
            + (soLanGui ? `Chương trình đã tự gửi lại cả danh sách ${moi.plu.length} hàng ${soLanGui} lần mà chưa đọc lại được đủ hàng trên cân`
              : 'Chương trình định gửi lại cả danh sách nhưng không nối lại được cân')
            + ' — nạp USB ngay.');
        }
        // Câu ngắn vì sao lần xoá đầu chưa xong — không chép câu lỗi dài (câu đó bảo "nạp USB ngay", giờ không còn đúng).
        const lyDo = lechSauXoa ? `đọc lại thấy cân chưa đúng: ${lechSauXoa}`
          : e instanceof LoiGiaoThuc ? ({ 'het-gio': 'cân không trả lời kịp', 'mat-ket-noi': 'mất kết nối giữa chừng',
            'sai-du-lieu': 'cân trả dữ liệu không đúng dạng', 'khong-noi': 'không nối được cân', 'khong-cho-phep': 'bị chặn' } as const)[e.loai]
          : 'có lỗi giữa chừng';
        // Cân đã có đủ mọi hàng của kế hoạch (đọc lại đúng số PLU, mã, tên, giá, HSD): ghi nhận đúng thứ cân đang có.
        const thua = phucHoi.filter(p => !muon.has(khoa(p.so, p.ma)));
        this.ghiTrenCan(new Map(phucHoi.map(p => [p.so, { so: p.so, ma: p.ma, gia: p.cot[5] ?? '', ten: p.ten }])));
        this.luuGoc(du);
        this.soLanApKho++;
        this.xoaCanChuaRo();
        this.xoaChuaXacNhan();
        this.ghiNgayHsd(ngayHsd);
        const conLaiThat = thua.filter(p => !laPluTrong(p));
        if (conLaiThat.length) {
          throw new LoiCan(`Lệnh xoá qua WiFi chưa xong (${lyDo}). Chương trình đã tự gửi lại cả danh sách và đọc lại thấy cân có đủ `
            + `${moi.plu.length} hàng — cân không thiếu hàng. Nhưng ${conLaiThat.length} hàng còn nằm lại vẫn còn `
            + `(${ke(conLaiThat.map(p => p.so))}): gỡ bằng nút "Gỡ khỏi cân qua WiFi (ghi đè)" hoặc nạp USB.`);
        }
        return { soHang: moi.plu.length, daXoa: conLai, phucHoi: `Lần xoá đầu chưa xong (${lyDo}); `
          + 'chương trình đã tự gửi lại cả danh sách và đọc lại thấy cân đủ hàng, không còn hàng nào nằm lại.' };
      }
      this.ghiTrenCan(hangTuFile(moi));
      this.luuGoc(du);
      this.soLanApKho++;
      this.xoaCanChuaRo();
      this.xoaChuaXacNhan();      // cân đọc lại đúng cả danh sách vừa gửi
      this.ghiNgayHsd(ngayHsd);   // cân đọc lại đúng cả danh sách vừa gửi: HSD tính cho ngày của kế hoạch
      return { soHang: moi.plu.length, daXoa: conLai, phucHoi: null };
    });
  }

  /**
   * 2.7 — lệnh xoá cả danh sách qua WiFi (xoaQuaWifi) đã gửi mà hỏng giữa chừng (đứt, hết giờ, đọc lại lệch): cân có thể
   * đang thiếu hàng giữa giờ bán. Gửi lại NGAY cả danh sách của kế hoạch — chỉ "DWL PLU", không CLR: cân thêm / sửa theo
   * số PLU nên đặt lại mọi hàng lệnh xoá có thể đã xoá — trên kết nối mới ở địa chỉ đang dùng, rồi đọc lại PLU; chưa đủ
   * thì chờ (CHO_PHUC_HOI_MS) rồi làm lại. Đủ = mọi hàng của kế hoạch có trên cân đúng số PLU, mã, tên, giá, HSD
   * (soPluVuaGui). Trả danh sách PLU đọc lại (thứ cân đang có thật) khi đủ; null khi hết lượt mà chưa đủ. Không ném.
   */
  private async phucHoiSauXoa(moi: FileCan): Promise<{ trenCan: DongPlu[] | null; soLanGui: number }> {
    let soLanGui = 0;   // số lần đã thật sự bắt đầu gửi lại (nối được, bắt tay xong) — câu báo không được nói quá
    for (const ms of this.phu.choPhucHoiMs ?? CHO_PHUC_HOI_MS) {
      if (ms > 0) await new Promise(r => setTimeout(r, ms));
      try {
        const doc = await this.voiKetNoi(async (kn) => {
          soLanGui++;
          await kn.ghi(['DWL\tPLU\t', ...moi.plu.map(p => p.tho), 'END\tPLU\t']);
          return kn.docPhan('PLU');
        }, false);
        const trenCan = docPluDocLai(doc, moi);
        if (!soPluVuaGui(moi.plu, trenCan).length) return { trenCan, soLanGui };
      } catch (e) {
        if (e instanceof LoiGiaoThuc && e.loai === 'khong-cho-phep' && !e.daGhi) break;   // cân khác mã máy: không gửi gì
      }
    }
    return { trenCan: null, soLanGui };
  }

  // ---- 2.7: chẩn đoán WiFi --------------------------------------------------------------
  /**
   * Chẩn đoán đường WiFi tới cân bằng các phép thử an toàn của CAN-TMA.md §13, ghi kết quả ra file để gửi người sửa
   * chương trình. Không bao giờ đọc / ghi cài đặt mạng, tên hay mật khẩu WiFi.
   *   Chỉ đọc (mặc định): 1 bắt tay cổng hai chiều (mã máy, loại máy, bảng mã) · 2 giờ cân · 3 danh sách hàng (so với
   *   chương trình).
   *   ghiThu (làm ngoài giờ bán): 4 ghi lại y hệt một hàng đang có rồi đọc lại (không đổi gì) · 5 thêm hàng thử PLU 9999
   *   (mã MA_CAN_THU) · 6 sửa hàng thử · 7 gửi file nhỏ chỉ có hàng thử qua cổng 33571, chờ, đọc lại qua cổng hai chiều —
   *   cổng 33571 có còn nhận không · 8 gỡ hàng thử bằng dòng trống (ghi đè). Bước ghi cần file gốc (khuôn dòng PLU) và
   *   PLU 9999 chưa có hàng thật. Hết bước, tren-can.tsv ghi đúng PLU 9999 đang là gì (dòng trống, hay hàng thử nếu gỡ
   *   hỏng — khi đó nó hiện thành "còn nằm lại").
   * Một bước hỏng thì các bước cần nó bỏ qua (có lý do). Mỗi bước một kết nối, ở địa chỉ đang dùng, không dò WiFi.
   */
  async chanDoanWifi(b: { ghiThu?: unknown } = {}): Promise<KetQuaChanDoan> {
    await this.kiemQuyenCan('Chẩn đoán WiFi');
    const ghiThu = b.ghiThu === true;
    return this.motLuc(async () => {
      const ch = this.cauHinh();
      const cong = ch.congHaiChieu ?? CONG_HAI_CHIEU;
      const buoc: BuocChanDoan[] = [];
      const lam = async (ma: string, ten: string, viec: () => Promise<string>): Promise<boolean> => {
        const bd = Date.now();
        try {
          buoc.push({ ma, ten, ketQua: 'dat', cau: await viec(), ms: Date.now() - bd });
          return true;
        } catch (e) {
          buoc.push({ ma, ten, ketQua: 'hong', cau: cauLoi(e), ms: Date.now() - bd });
          return false;
        }
      };
      const boQua = (ma: string, ten: string, cau: string) => { buoc.push({ ma, ten, ketQua: 'bo-qua', cau, ms: 0 }); };
      const BUOC_GHI: [string, string][] = [
        ['ghi-y-het', '4. Ghi lại y hệt một hàng đang có (không đổi gì)'], ['them-thu', `5. Thêm hàng thử PLU ${PLU_THU}`],
        ['sua-thu', '6. Sửa hàng thử'], ['33571', '7. Gửi file nhỏ qua cổng 33571'], ['go-thu', '8. Gỡ hàng thử (ghi đè dòng trống)'],
      ];
      const boQuaTu = (i: number, cau: string) => { for (const [ma, ten] of BUOC_GHI.slice(i)) boQua(ma, ten, cau); };

      let goc: FileCan | null = null;
      try { goc = this.coFileGoc() ? docFileCan(this.docGoc()) : null; } catch { goc = null; }
      const docPlu = (dong: string[]) => docPluDocLai(dong, goc);
      const docMotPlu = async (so: number) => (docPlu(await this.voiKetNoi(kn => kn.docPhan('PLU'), false))).find(p => p.so === so) ?? null;

      let thongTin: ThongTinCan | null = null;
      const batTay = await lam('bat-tay', '1. Bắt tay qua cổng hai chiều', async () => {
        thongTin = await this.voiKetNoi(async kn => kn.thongTin, false, true);   // 2.8: bắt tay lại trên kết nối mới
        const t = thongTin as ThongTinCan;
        return `Cân trả lời ở ${ch.ipCan}:${cong} — mã máy ${t.mac}, ${t.model || 'không rõ loại máy'}, bảng mã ${t.maHoa || 'cân không báo'}.`;
      });
      if (!batTay) {
        boQua('gio', '2. Đọc giờ cân', 'Cổng hai chiều không trả lời.');
        boQua('doc-plu', '3. Đọc danh sách hàng', 'Cổng hai chiều không trả lời.');
        if (ghiThu) boQuaTu(0, 'Cổng hai chiều không trả lời.');
      } else {
        await lam('gio', '2. Đọc giờ cân', async () => {
          const g = await this.voiKetNoi(kn => kn.docGio(), false);
          const lech = lechGiayVn(g, this.bayGio());
          return `Giờ trên cân ${chuoiGio(g)} — ${Math.abs(lech) <= 120 ? 'khớp giờ Việt Nam'
            : `${lech < 0 ? 'chậm' : 'nhanh'} hơn giờ Việt Nam ${khoangThoiGian(Math.abs(lech))}: chỉnh giờ cân (mục 2) — ngày đóng gói, HSD in theo giờ cân`}.`;
        });
        let trenCan: DongPlu[] | null = null;
        const docDuoc = await lam('doc-plu', '3. Đọc danh sách hàng', async () => {
          trenCan = docPlu(await this.voiKetNoi(kn => kn.docPhan('PLU'), false));
          const ds = trenCan as DongPlu[];
          const soTrong = ds.filter(laPluTrong).length;
          const coHang = `Cân có ${ds.length - soTrong} hàng${soTrong ? ` và ${soTrong} PLU trống` : ''}`;
          if (!goc) return `${coHang} (chương trình chưa có file gốc để so).`;
          const theoSo = new Map(goc.plu.map(p => [p.so, p]));
          const khop = ds.filter(p => { const g = theoSo.get(p.so); return g && g.ma === p.ma && g.gia === p.gia && g.ten.trim() === p.ten.trim(); }).length;
          return `${coHang}; ${khop}/${goc.plu.length} hàng của chương trình khớp đúng số PLU, mã, tên, giá.`
            + (khop < goc.plu.length ? ' Hàng lệch: lần gửi trước cân chưa nhận, hay ai sửa trên cân.' : '');
        });
        if (ghiThu) {
          if (!docDuoc || !trenCan) boQuaTu(0, 'Chưa đọc được danh sách hàng.');
          else if (!goc) boQuaTu(0, 'Chưa có file gốc — làm bước "Bắt đầu" trước (cần khuôn dòng hàng của cân).');
          else await this.chanDoanGhi(lam, boQuaTu, boQua, goc, trenCan, docMotPlu);
        }
      }

      const ket = (ma: string) => buoc.find(x => x.ma === ma)?.ketQua;
      const ketLuan: string[] = [];
      if (ket('bat-tay') !== 'dat') {
        ketLuan.push('Cổng hai chiều (33581) không trả lời. Gửi giá, thông số, phím, tem, gỡ hàng qua WiFi đều cần cổng này — dùng USB tới khi '
          + 'sửa được. Kiểm: cân đang bật, ở màn hình bán hàng, cùng WiFi với máy tính; phần mềm TM-xA của hãng đã đóng trên mọi máy.');
      } else if (!ghiThu) {
        ketLuan.push('Đọc qua cổng hai chiều chạy được. Muốn biết cân có nhận GHI qua WiFi không: tích "Thử cả ghi" rồi chẩn đoán lại (ngoài giờ bán).');
      } else {
        if (ket('ghi-y-het') === 'dat' && ket('them-thu') === 'dat' && ket('sua-thu') === 'dat') {
          ketLuan.push('Cân NHẬN ghi qua cổng hai chiều: thêm và sửa hàng qua WiFi được — Gửi xuống cân, thông số, phím, tem đều đi đường này.');
        } else if (ket('ghi-y-het') === 'hong' || ket('them-thu') === 'hong' || ket('sua-thu') === 'hong') {
          ketLuan.push('Cân CHƯA nhận ghi qua cổng hai chiều (xem bước hỏng). Tạm dùng USB; gửi file kết quả này cho người sửa chương trình.');
        }
        if (ket('go-thu') === 'dat') ketLuan.push('Gỡ hàng bằng ghi đè (dòng trống) chạy được: nút "Gỡ khỏi cân qua WiFi (ghi đè)" dùng được.');
        else if (ket('go-thu') === 'hong') ketLuan.push(`Gỡ hàng thử chưa được: PLU ${PLU_THU} có thể còn hàng thử — xem thẻ Tất cả hàng, gỡ lại hoặc nạp USB.`);
        if (ket('33571') === 'dat') ketLuan.push('Cổng 33571 nhận file nhỏ: đường lui còn dùng được.');
        else if (ket('33571') === 'hong') ketLuan.push('Cổng 33571 không nhận (như ở quán từ 02/10/2026): chỉ cổng hai chiều và USB dùng được.');
      }

      const luc = this.bayGio();
      const thuMuc = path.join(this.dd.duLieu, 'chan-doan');
      const duongDan = path.join(thuMuc, `chan-doan-${tenTheoGioVn(luc)}.txt`);
      const tt = thongTin as ThongTinCan | null;
      const dong = [
        'BEEFTOWN CÂN — CHẨN ĐOÁN WIFI', `Lúc: ${chuoiGio(gioVnLuc(luc))}`, `Phiên bản chương trình: ${this.phu.capNhat?.phienBan ?? 'không rõ'}`,
        `Cân: ${ch.ipCan} · cổng hai chiều ${cong} · cổng một chiều ${ch.congCan}`,
        `Mã máy / loại máy: ${tt ? `${tt.mac} / ${tt.model} / bảng mã ${tt.maHoa || '—'}` : '—'}`,
        `Có ghi thử: ${ghiThu ? 'có' : 'không (chỉ đọc)'}`, '',
        ...buoc.map(x => `[${x.ketQua === 'dat' ? 'ĐẠT' : x.ketQua === 'hong' ? 'HỎNG' : 'BỎ QUA'}] ${x.ten} (${x.ms} ms): ${x.cau}`), '',
        'KẾT LUẬN', ...ketLuan.map(k => '- ' + k), '',
      ];
      fs.mkdirSync(thuMuc, { recursive: true });
      fs.writeFileSync(duongDan, '﻿' + dong.join('\r\n'), 'utf8');
      return { luc: new Date(luc).toISOString(), ip: ch.ipCan, congHaiChieu: cong, congMotChieu: ch.congCan, ghiThu, buoc, ketLuan, duongDan };
    });
  }

  /** Bước 4–8 của chanDoanWifi (ghi thử). Ghi tren-can.tsv đúng PLU_THU đang là gì sau các bước. */
  private async chanDoanGhi(
    lam: (ma: string, ten: string, viec: () => Promise<string>) => Promise<boolean>,
    boQuaTu: (i: number, cau: string) => void,
    boQua: (ma: string, ten: string, cau: string) => void,
    goc: FileCan, trenCan: DongPlu[], docMotPlu: (so: number) => Promise<DongPlu | null>,
  ): Promise<void> {
    // Đọc lại như mọi lần gửi (docLaiCaiDat: chờ rồi đọc lại vài lần) — cân lưu chậm vài giây không bị coi là không nhận.
    const ghiVaChoKhop = async (dong: string): Promise<string> => {
      const bd = Date.now();
      await this.voiKetNoi(kn => kn.ghi(['DWL\tPLU\t', dong, 'END\tPLU\t']), false);
      const giay = ((Date.now() - bd) / 1000).toFixed(1).replace('.', ',');
      const kq = await this.docLaiCaiDat('PLU', [dong]);
      if (kq.loai === 'lech') throw new LoiCan(`Cân trả lời hàng rào sau ${giay} giây nhưng đọc lại thấy CHƯA nhận: ${kq.cau}.`);
      if (kq.loai === 'khong-doc') throw new LoiCan(`Cân trả lời hàng rào sau ${giay} giây nhưng chưa đọc lại được để kiểm (${kq.cau.replace(/[.\s]+$/, '')}).`);
      return `Cân trả lời hàng rào sau ${giay} giây; đọc lại đúng.`;
    };
    const mau = trenCan[0];
    if (!mau) boQuaTu(0, 'Cân chưa có hàng nào để ghi lại y hệt.');
    else if (!await lam('ghi-y-het', '4. Ghi lại y hệt một hàng đang có (không đổi gì)', async () => `PLU ${mau.so}: ${await ghiVaChoKhop(mau.tho)} `
      + '(Không đổi gì nên bước này chỉ cho biết cân trả lời lệnh ghi; cân có LƯU không thì xem bước 5.)')) {
      boQuaTu(1, 'Cân chưa nhận lệnh ghi y hệt — không thử thêm.');
      return;
    }
    if (!mau) return;
    const tren = this.docTrenCan();
    const dangCo = trenCan.find(p => p.so === PLU_THU) ?? goc.plu.find(p => p.so === PLU_THU) ?? tren.get(PLU_THU);
    if (dangCo && ![MA_CAN_THU, MA_CAN_TRONG].includes(chuanMa(dangCo.ma))) {
      boQuaTu(1, `PLU ${PLU_THU} đang có hàng thật (mã ${dangCo.ma || '—'}) — không ghi đè.`);
      return;
    }
    const dongThu = (ten: string, gia: number) => dongPluRieng(goc, { so: PLU_THU, ma: MA_CAN_THU, ten, gia });
    const ghiNhan = (h: HangTrenCan) => { const t = this.docTrenCan(); t.set(PLU_THU, h); this.ghiTrenCan(t); };
    // Bản hàng thử cuối cùng đã gửi xuống cân (null: chưa gửi lệnh thêm) — để nhớ đúng nếu gỡ hỏng mà không đọc lại được.
    let thuCuoi = null as string | null;   // "as": gán trong hàm lam — TypeScript không được coi là luôn null
    const them = await lam('them-thu', `5. Thêm hàng thử PLU ${PLU_THU}`, async () => {
      thuCuoi = dongThu('THỬ WIFI 1', 1000);
      return `"THỬ WIFI 1" mã ${MA_CAN_THU}, 1.000 đ/kg: ${await ghiVaChoKhop(thuCuoi)}`;
    });
    const sua = them && await lam('sua-thu', '6. Sửa hàng thử', async () => {
      thuCuoi = dongThu('THỬ WIFI 2', 2000);
      return `đổi thành "THỬ WIFI 2", 2.000 đ/kg: ${await ghiVaChoKhop(thuCuoi)}`;
    });
    if (!them) boQua('sua-thu', '6. Sửa hàng thử', 'Chưa thêm được hàng thử.');
    if (!them || !sua) boQua('33571', '7. Gửi file nhỏ qua cổng 33571', them ? 'Chưa sửa được hàng thử.' : 'Chưa thêm được hàng thử.');
    else {
      await lam('33571', '7. Gửi file nhỏ qua cổng 33571', async () => {
        const ch = this.cauHinh();
        // 2.8: đóng kết nối hai chiều đang giữ trước — bước này hỏi "cổng 33571 có nhận không", không phải "có nhận khi đang
        // giữ một kết nối khác không" (chưa biết cân có nhận hai kết nối cùng lúc). Đọc lại sau đó mở kết nối mới.
        this.giu.bo();
        const dong33571 = dongThu('THỬ 33571', 3000);
        const nho = fileNho(goc.phienBan, ['DWL\tPLU\t', dong33571, 'END\tPLU\t']);
        try { await (this.phu.gui ?? guiTcp)(ch.ipCan, ch.congCan, nho); }
        catch (e) { throw new LoiCan(`Không gửi được qua cổng ${ch.congCan}: ${cauLoi(e)}`); }
        await new Promise(r => setTimeout(r, this.phu.cho33571Ms ?? CHO_33571_MS));
        const p = await docMotPlu(PLU_THU);
        const ten = (p?.ten ?? '').trim();
        if (ten === 'THỬ 33571') {
          thuCuoi = dong33571;
          return 'Cân đã nhận file nhỏ qua cổng 33571 (đọc lại qua cổng hai chiều thấy "THỬ 33571").';
        }
        throw new LoiCan(`Cân bỏ qua file nhỏ gửi qua cổng ${ch.congCan}: đọc lại vẫn là "${ten || '—'}".`);
      });
    }
    // Luôn gỡ khi đã gửi lệnh thêm (kể cả thêm / sửa báo hỏng — cân có thể đã lưu một phần): không để hàng thử lại trên cân.
    if (thuCuoi === null) return;
    const daGuiCuoi: string = thuCuoi;
    const go = await lam('go-thu', '8. Gỡ hàng thử (ghi đè dòng trống)', async () =>
      `PLU ${PLU_THU} thành dòng trống mã ${MA_CAN_TRONG}: ${await ghiVaChoKhop(dongPluRieng(goc, { so: PLU_THU, ma: MA_CAN_TRONG, ten: TEN_PLU_TRONG, gia: 0 }))}`);
    if (go) { ghiNhan({ so: PLU_THU, ma: MA_CAN_TRONG, gia: '0,0', ten: TEN_PLU_TRONG }); return; }
    // Gỡ hỏng: nhớ đúng thứ đang ở PLU_THU trên cân (đọc lại được thì theo cân) để hàng thử hiện thành "còn nằm lại" và gỡ
    // lại được. Đọc được mà cân không có PLU_THU (cân không lưu cả lệnh thêm): không ghi nhận gì.
    let p: DongPlu | null = null, docDuoc = true;
    try { p = await docMotPlu(PLU_THU); } catch { docDuoc = false; }
    if (p) ghiNhan({ so: p.so, ma: p.ma, gia: p.cot[5] ?? '', ten: p.ten });
    else if (!docDuoc) {
      // Không đọc được: nhớ bản cuối đã gửi, đọc từ chính dòng đã gửi — giá theo số lẻ của cân như tren-can.tsv, không
      // viết tay "m,n" (cân 0 số lẻ: 2.000 đ là "2000,0", không phải "2,0").
      const [d] = docPluDocLai([daGuiCuoi], goc);
      if (d) ghiNhan({ so: d.so, ma: d.ma, gia: d.cot[5] ?? '', ten: d.ten });
    }
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
    try { ghiFileAnToan(this.fileNhatKy, ghiKhoNhatKy(ds), this.phu.vietByte); } catch (e) {
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
   * Đọc nhật ký qua WiFi (UPL REP — chưa thử trên cân thật) TỪ giao dịch cuối đã lưu của cân này (kể cả nó), rồi bảng
   * PLU và thông số trên cùng kết nối để gắn mã cân (xem nhatKyCan). Chưa gộp vào nhat-ky-can.tsv. Người gọi chạy trong
   * motLuc: nút "Đọc qua WiFi" (nhatKyCan) và tự đọc khi cân báo in tem (docNhatKyNen, 2.8). `timLai`: nối không được
   * thì dò WiFi tìm cân (nút bấm); việc chạy nền không bao giờ dò.
   */
  private docNhatKyWifi(tuDau: boolean, timLai = true): Promise<{ kq: KetQuaNhatKy; mac: string; tuFid: number }> {
    return this.voiKetNoi(async (kn) => {
      const mac = kn.thongTin.mac;
      // Giao dịch MỚI NHẤT đã lưu (theo giờ của cân, cùng giờ thì số lớn hơn) — không phải số lớn nhất: sau khi cân
      // đếm lại, số cũ lớn hơn số mới và lần đọc nào cũng phải đọc lại từ giao dịch 1.
      let cuoi: DongBanCan | null = null;
      if (!tuDau) {
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
    }, timLai);
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
        const r = await this.docNhatKyWifi(b.tuDau === true);
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

  // ---- 2.5: tự cập nhật — cap-nhat.ts ----------------------------------------------------
  /** Đã đổi file xong, main.ts đang mở bản mới: việc ghi xuống cân mới (motLuc) và lần cập nhật khác đều dừng. */
  private dangKhoiDongLai = false;
  private dangCapNhat = false;
  private tienDoCapNhat: { buoc: 'tai' | 'chay-thu' | 'cho-can' | 'doi-tep' | null; daTai: number; tong: number } = { buoc: null, daTai: 0, tong: 0 };
  private banMoiNho: { luc: number; kq: BanMoiXem } | null = null;
  private dangHoiBanMoi: Promise<BanMoiXem> | null = null;
  private daXetBanHong = false;

  /** Đã đổi file xong, đang khởi động lại — main.ts không tự tắt, không tự gửi trong lúc này. */
  dangDoiFile(): boolean { return this.dangKhoiDongLai; }

  /**
   * Bản đã không mở được trên máy này (lần mở với --cap-nhat-hong=X ghi lại vào %APPDATA%\BeeftownCan\
   * ban-cap-nhat-hong.txt): trang KHÔNG tự mời cập nhật lên X nữa (chỉ nút "Kiểm tra bản mới" mới hiện, kèm lời báo).
   * Cập nhật được lên bản khác (--vua-cap-nhat=) thì xoá.
   */
  private banCapNhatHong(): string | null {
    const cn = this.phu.capNhat;
    const tep = path.join(this.dd.cauHinh, 'ban-cap-nhat-hong.txt');
    if (!this.daXetBanHong) {
      this.daXetBanHong = true;
      try {
        if (cn?.capNhatHong) { fs.mkdirSync(this.dd.cauHinh, { recursive: true }); fs.writeFileSync(tep, cn.capNhatHong, 'utf8'); }
        else if (cn?.vuaCapNhatTu) fs.rmSync(tep, { force: true });
      } catch { /* không ghi được: chỉ mất lời nhắc */ }
    }
    try { const v = fs.readFileSync(tep, 'utf8').trim(); return /^\d+\.\d+\.\d+$/.test(v) ? v : null; } catch { return null; }
  }

  private goiCapNhat() {
    const cn = this.phu.capNhat;
    return {
      cn, goc: cn?.goc ?? GOC_BAN_CAI, fsHam: cn?.fsHam ?? FS_THAT, choMs: cn?.choMs ?? CHO_MAC_DINH,
      gioiHan: cn?.gioiHan ?? GIOI_HAN_MAC_DINH, fetch: this.phu.fetch ?? fetch,
    };
  }

  /**
   * Có bản mới không (trang hỏi lúc mở, và nút "Kiểm tra bản mới" với hoiLai). Không phải bản .exe → trả ngay, không
   * hỏi mạng. Nhớ 30 phút; hai lời hỏi cùng lúc dùng chung một lần hỏi. Mọi vai đều xem được.
   */
  async kiemBanMoi(hoiLai = false): Promise<BanMoiXem> {
    const { cn, goc, choMs, gioiHan, fetch: f } = this.goiCapNhat();
    const phienBan = cn?.phienBan ?? '';
    if (!cn || !cn.laBanDongGoi) {
      return { coTheCapNhat: false, phienBan, phienBanMoi: null, kichThuocChu: null, ngayChu: null, daHongTruoc: false,
        cau: 'Chỉ cập nhật được bản BeeftownCan.exe chạy trên Windows.' };
    }
    if (!hoiLai && this.banMoiNho && Date.now() - this.banMoiNho.luc < 30 * 60_000) return this.banMoiNho.kq;
    if (this.dangHoiBanMoi) return this.dangHoiBanMoi;
    this.dangHoiBanMoi = (async () => {
      const { phieu, coBanMoi } = await hoiBanMoi({ fetch: f, goc, phienBanDangChay: phienBan, choMs: choMs.hoi, gioiHan });
      const daHongTruoc = coBanMoi && this.banCapNhatHong() === phieu.phienBan;
      const kq: BanMoiXem = coBanMoi
        ? { coTheCapNhat: true, phienBan, phienBanMoi: phieu.phienBan, kichThuocChu: moTaMb(phieu.kichThuoc),
            ngayChu: phieu.ngay ? ngayPhatHanhVn(phieu.ngay) : null, daHongTruoc,
            cau: daHongTruoc
              ? `Bản ${phieu.phienBan} đã không mở được trên máy này lần trước. Đã xử lý (phần mềm diệt virus…) thì bấm Cập nhật để `
                + 'thử lại; không thì chờ bản sau.'
              : `Có bản mới ${phieu.phienBan} (${moTaMb(phieu.kichThuoc)}${phieu.ngay ? `, phát hành ${ngayPhatHanhVn(phieu.ngay)}` : ''}).` }
        : { coTheCapNhat: true, phienBan, phienBanMoi: null, kichThuocChu: null, ngayChu: null, daHongTruoc: false,
            cau: `Đang dùng bản mới nhất (${phienBan}).` };
      this.banMoiNho = { luc: Date.now(), kq };
      return kq;
    })();
    try { return await this.dangHoiBanMoi; } finally { this.dangHoiBanMoi = null; }
  }

  /**
   * Cập nhật lên bản mới nhất: kiểm thư mục ghi được → hỏi lại phiếu (không tin phiên bản trang gửi) → tải và kiểm
   * NGOÀI hàng đợi (1–3 phút tải không chặn việc gửi xuống cân) → đổi file TRONG hàng đợi (chờ việc ghi xuống cân
   * đang chạy xong) → dangKhoiDongLai. Trả về rồi máy chủ mới hẹn main.ts khởi động lại (may-chu.ts). Bấm hai lần →
   * lần sau bị từ chối. Mọi vai bấm được: chỉ cài bản chính thức từ kho cập nhật, không đụng dữ liệu.
   */
  async capNhat(): Promise<{ phienBan: string; phienBanCu: string; cau: string }> {
    const { cn, goc, fsHam, choMs, gioiHan, fetch: f } = this.goiCapNhat();
    if (!cn || !cn.laBanDongGoi) {
      throw new LoiCapNhat('Chỉ cập nhật được bản BeeftownCan.exe chạy trên Windows (bản đang chạy bằng bun — dùng git pull).');
    }
    if (this.dangKhoiDongLai) throw new LoiCapNhat('Chương trình đang khởi động lại để cập nhật — chờ cửa sổ mới mở.');
    if (this.dangCapNhat) throw new LoiCapNhat('Đang cập nhật — chờ lần bấm trước xong.');
    this.dangCapNhat = true;
    try {
      const t = cacTepCapNhat(cn.tepChay);
      if (/\.(cu|loi)\.exe$/i.test(t.tepChay)) {
        throw new LoiCapNhat(`Đang chạy bản dự phòng (${path.basename(t.tepChay)}) — đổi tên lại thành BeeftownCan.exe rồi mở lại.`);
      }
      thuGhiThuMuc(t, fsHam);
      const { phieu, coBanMoi } = await hoiBanMoi({ fetch: f, goc, phienBanDangChay: cn.phienBan, choMs: choMs.hoi, gioiHan });
      if (!coBanMoi) throw new LoiCapNhat(`Đang dùng bản mới nhất (${cn.phienBan}).`);
      this.tienDoCapNhat = { buoc: 'tai', daTai: 0, tong: phieu.kichThuoc };
      await taiVaKiem({ fetch: f, url: duongTepBanMoi(phieu.phienBan, goc), dich: t.tepDangTai, phieu,
        choMs: { tong: choMs.tong, lang: choMs.lang }, khiTien: n => { this.tienDoCapNhat.daTai = n; } });
      // 2.6.1: chạy thử bản mới lúc bản này còn chạy — bị chặn thì báo ngay, chưa đổi gì (cap-nhat.ts chayThuBanMoi).
      if (cn.chayThu) {
        this.tienDoCapNhat.buoc = 'chay-thu';
        const ms = await chayThuBanMoi({ t, phienBan: phieu.phienBan, chayThu: cn.chayThu, choMs: cn.choChayThuMs ?? CHO_CHAY_THU_MS, fsHam });
        try { cn.ghiNhatKy?.(`Cập nhật: chạy thử bản ${phieu.phienBan} được, mất ${(ms / 1000).toFixed(1).replace('.', ',')} giây.`); } catch { /* thôi */ }
      }
      this.tienDoCapNhat.buoc = 'cho-can';
      await this.motLuc(async () => {
        this.tienDoCapNhat.buoc = 'doi-tep';
        doiTep(t, fsHam);
        this.dangKhoiDongLai = true;
        // 2.8: đóng kết nối đang giữ với cân — bản mới mở kết nối của nó (cân có nhận hai kết nối cùng lúc không: chưa biết).
        this.dongNen();
      });
      return {
        phienBan: phieu.phienBan, phienBanCu: cn.phienBan,
        cau: `Đã tải ${cn.chayThu ? 'và chạy thử' : 'và kiểm tra'} bản ${phieu.phienBan}. Đang khởi động lại — cửa sổ mới sẽ tự mở (có thể 1–3 phút), `
          + 'cửa sổ này tự đóng. Quá 4 phút chưa thấy: mở lại Beeftown Cân như mọi khi.',
      };
    } finally {
      this.dangCapNhat = false;
      if (!this.dangKhoiDongLai) this.tienDoCapNhat = { buoc: null, daTai: 0, tong: 0 };
    }
  }

  /** Trạng thái cập nhật cho trang (không hỏi mạng): tiến độ đang tải, vừa cập nhật từ bản nào, bản mới hỏng. */
  trangThaiCapNhat(): TrangThaiCapNhat {
    const cn = this.phu.capNhat;
    const td = this.tienDoCapNhat;
    const cauTienDo = td.buoc === 'tai' ? `Đang tải ${moTaMb(td.daTai)} / ${moTaMb(td.tong)}…`
      : td.buoc === 'chay-thu' ? 'Đã tải xong. Đang chạy thử bản mới trên máy này (có thể tới 3 phút)…'
      : td.buoc === 'cho-can' ? 'Đã tải xong. Đang chờ việc gửi xuống cân xong…'
      : td.buoc === 'doi-tep' || this.dangKhoiDongLai ? 'Đang khởi động lại…' : null;
    return {
      coTheCapNhat: !!cn?.laBanDongGoi, dangCapNhat: this.dangCapNhat || this.dangKhoiDongLai, cauTienDo,
      vuaCapNhatTu: cn?.vuaCapNhatTu ?? null, capNhatHong: cn?.capNhatHong ?? null,
    };
  }

  // ---- 2.2: thông số (TMS) và phím tắt (SCP) — thong-so.ts ------------------------------
  async thongSo(): Promise<ThongSoXem> {
    await this.kiemQuyenCan('Thông số cân');
    const goc = docFileCan(this.docGoc());
    const gt = docThongSo(goc);
    return { muc: THONG_SO.map(m => ({ ...m, giaTri: gt.get(m.id) ?? null })), nhom: NHOM_THONG_SO, phienBan: goc.phienBan };
  }

  /**
   * Sửa thông số: sửa đúng dòng TMS trong file gốc, gửi khối TMS đổi xuống cân. 2.7: qua cổng hai chiều rồi đọc lại phần
   * TMS để kiểm (guiCaiDat); cổng hai chiều không nối được thì file nhỏ chỉ có khối đó qua cổng 33571. Đọc lại khớp hay
   * không đọc được → thay file gốc (xacNhan nói rõ); đọc lại thấy cân chưa nhận → báo lỗi, file gốc giữ nguyên.
   * Ghi thông số qua cổng hai chiều: CHƯA THỬ TRÊN CÂN THẬT.
   */
  async suaThongSo(b: { thay?: unknown } = {}): Promise<{ doi: number[] } & KetQuaCaiDat> {
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
      const gui = await this.guiCaiDat('TMS', kq.khoi, nho, `${kq.doi.length} thông số`);
      this.luuGoc(kq.du, nho);
      return { doi: kq.doi, ...gui };
    });
  }

  // ---- 2.4: chữ cài đặt chung (TMT) — thong-so.ts ------------------------------------
  /** Chữ cài đặt chung trong file gốc, kèm các mẫu tem có ô in chữ đó. Không bao giờ trả TMT 15, 16, 19. */
  async chuChung(): Promise<ChuChungXem> {
    await this.kiemQuyenCan('Chữ cài đặt chung');
    const goc = docFileCan(this.docGoc());
    const gt = docChuChung(goc);
    let cacMau: MauTem[] = [], dangDung: MauTem | null = null;
    try { ({ cacMau, dangDung } = docTem(goc)); } catch { /* phần tem hỏng: không nói gì về tem */ }
    const tenMau = (t: MauTem) => `Mẫu ${t.id}${t.ten.trim() ? ` "${t.ten.trim()}"` : ''}${t === dangDung ? ' (cân đang dùng)' : ''}`;
    return {
      muc: CHU_CHUNG.map(m => ({
        ...m, giaTri: gt.get(m.id)?.giaTri ?? null, docDuoc: gt.get(m.id)?.docDuoc ?? true,
        trenTem: m.oTem === undefined ? [] : cacMau.filter(t => t.o.some(o => o.loai === '2' && o.chu === m.oTem)).map(tenMau),
      })),
      nhom: NHOM_CHU_CHUNG,
    };
  }

  /**
   * Sửa chữ cài đặt chung: như suaThongSo — sửa đúng dòng TMT trong file gốc, gửi khối TMT đổi qua cổng hai chiều rồi
   * đọc lại để kiểm (2.7; lui về file nhỏ qua 33571). Tên, mật khẩu WiFi, tên miền (15, 16, 19) bị từ chối — và không
   * bao giờ vào câu báo khi đọc lại (lechCaiDat chỉ nói dòng vừa gửi). CHƯA THỬ TRÊN CÂN THẬT.
   */
  async suaChuChung(b: { thay?: unknown } = {}): Promise<{ doi: number[] } & KetQuaCaiDat> {
    await this.kiemQuyenCan('Gửi chữ cài đặt chung xuống cân');
    const thay = layThayChu(b.thay);
    return this.motLuc(async () => {
      const goc = this.docGoc();
      const kq = suaChuChungTrongFile(goc, thay);
      if (!kq.khoi.length) throw new LoiCan('Chữ cài đặt chung chưa có gì thay đổi — không gửi gì.');
      const nho = fileNho(docFileCan(goc).phienBan, kq.khoi);
      const gui = await this.guiCaiDat('TMT', kq.khoi, nho, `${kq.doi.length} chữ cài đặt chung`);
      this.luuGoc(kq.du, nho);
      return { doi: kq.doi, ...gui };
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

  /** Gán phím tắt: như suaThongSo, khối SCP đổi qua cổng hai chiều rồi đọc lại (2.7; lui về 33571). CHƯA THỬ TRÊN CÂN THẬT. */
  async suaPhim(b: { thay?: unknown } = {}): Promise<{ doi: { trang: number; phim: number }[] } & KetQuaCaiDat> {
    await this.kiemQuyenCan('Gửi phím tắt xuống cân');
    const thay = (Array.isArray(b.thay) ? b.thay : []).filter(laDoiTuong).slice(0, 300)
      .map(t => ({ trang: Number(t.trang), phim: Number(t.phim), plu: Number(t.plu) }));
    return this.motLuc(async () => {
      const goc = this.docGoc();
      const kq = suaPhimTrongFile(goc, thay);
      if (!kq.khoi.length) throw new LoiCan('Phím tắt chưa có gì thay đổi — không gửi gì.');
      const nho = fileNho(docFileCan(goc).phienBan, kq.khoi);
      const gui = await this.guiCaiDat('SCP', kq.khoi, nho, `${kq.doi.length} phím tắt`);
      this.luuGoc(kq.du, nho);
      return { doi: kq.doi, ...gui };
    });
  }

  // ---- 2.2: giờ cân --------------------------------------------------------------------
  /**
   * Giờ trên cân qua cổng 33581, so với giờ Việt Nam (2.9.2 — trước đó so với giờ máy tính: máy để múi giờ khác thì báo lệch
   * oan, người bấm "Chỉnh giờ" là cân sai theo). Chưa thử trên cân thật.
   */
  async gioCan(): Promise<{ gio: GioCan; gioVn: string; lechGiay: number }> {
    await this.kiemQuyenCan('Đọc giờ cân');
    return this.motLuc(() => this.voiKetNoi(async (kn) => {
      const gio = await kn.docGio();
      const ms = this.bayGio();
      return { gio, gioVn: chuoiGio(gioVnLuc(ms)), lechGiay: lechGiayVn(gio, ms) };
    }));
  }

  /**
   * Chỉnh giờ cân — mặc định theo giờ Việt Nam lúc gửi (2.9.2: gio-vn.ts như nhịp 30 giây và tự chỉnh giờ — trước đó theo
   * múi giờ của máy tính: máy để UTC thì 23:26 giờ VN thành 16:26 trên cân, tem in sai ngày đóng gói / HSD, rồi tự chỉnh giờ
   * lại kéo về); `luc` = giờ chọn trên trang ("2026-09-29T14:05", giờ VN).
   * Trước hết qua cổng 33581 (DWL TIM + hàng rào; cân báo lại giờ để kiểm — datGio của giao-thuc.ts). Cổng đó
   * hỏng thì gửi khối giờ trong file nhỏ qua cổng 33571 — đường này CHƯA THỬ TRÊN CÂN THẬT và cân không trả
   * lời, nên chưa biết cân đã nhận (daXacNhan = false). Đặt giờ hai lần không hại gì, nên đi đường lui cả khi
   * cổng 33581 đã gửi dở. Cả hai đường đều chưa thử trên cân thật.
   */
  async chinhGioCan(b: { luc?: unknown } = {}): Promise<KetQuaChinhGio> {
    await this.kiemQuyenCan('Chỉnh giờ cân');
    const chon = b.luc === undefined || b.luc === null || b.luc === '' ? null : gioTuChu(b.luc);
    if (chon) khoiTim(chon);   // ngày giờ không có thật → báo ngay, chưa nối cân
    const lay = () => chon ?? gioVnLuc(this.bayGio());
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
   * Gửi tới cân qua cổng 33571. Không nối được (chưa gửi byte nào) thì dò WiFi tìm cân: thấy
   * đúng cân đang dùng ở địa chỉ khác thì dùng địa chỉ đó (lưu lại) và gửi lại
   * một lần. Đang gửi dở mà hỏng thì không gửi lại — để người bấm quyết.
   * 2.7: bỏ các dòng cài đặt mạng trước khi gửi (boDongMang).
   */
  private async guiDenCan(duGoc: Uint8Array, timLai = true): Promise<DoiDiaChi | null> {
    const gui = this.phu.gui ?? guiTcp;
    const du = boDongMang(duGoc);
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
    // 2.8: đang giữ kết nối hai chiều tới địa chỉ này và cân còn trả lời → thông, không mở thêm kết nối 33571 tới cùng cân
    // (cân có nhận hai kết nối cùng lúc không: chưa biết — thử 33571 lúc đang giữ có thể hỏng oan rồi dò cả WiFi).
    const tt = this.giu.trangThai();
    if (this.giuKetNoiBat() && tt.dangMo && tt.ip === ch.ipCan) {
      try {
        await this.motLuc(() => this.voiKetNoi(kn => kn.docGio(), false));
        return { thongCan: true, ipCan: ch.ipCan, doi: null, loi: null, thay: [ch.ipCan], daThu: 0, dai: [] };
      } catch { /* kết nối đã chết: thử như trước */ }
    }
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
    // 2.8: nghe UDP → thử các máy vừa trả lời trước; không ra cân dùng được (không thấy, thấy cân khác mã máy, thấy nhiều cân —
    // có thể cân của quán bị tường lửa / bộ phát chặn gói) thì dò WiFi bằng TCP như trước.
    const quaUdp = await this.timQuaUdp(truoc);
    if (quaUdp) {
      const kq = await this.ketQuaTim(truoc, quaUdp);
      if (kq.thongCan) return kq;
    }
    return this.ketQuaTim(truoc, await this.doMang(truoc));
  }

  /** Từ các địa chỉ vừa thấy cân (dò TCP hay UDP): đổi địa chỉ khi thấy đúng một cân ở chỗ khác và không khác mã máy. */
  private async ketQuaTim(truoc: CauHinh, kq: KetQuaTim): Promise<KetQuaTimCan> {
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

  /**
   * 2.8 — đang nghe UDP (bật ở Cài đặt): hỏi như hãng (5 gói tới cổng 33583) rồi chờ CHO_TRA_LOI_UDP_MS, lấy các máy vừa
   * phát gói của cân (trả lời hay tự phát mỗi ~15 giây) thay cho dò cả WiFi bằng TCP. Không nghe / không thấy máy nào →
   * null (dò TCP như trước). Gói không mang mã máy: timCan vẫn so mã máy trước khi đổi địa chỉ.
   */
  private async timQuaUdp(ch: CauHinh): Promise<KetQuaTim | null> {
    if (ch.ngheUdp !== true || !this.udp.dangNghe) return null;
    // Chỉ máy trả lời / phát SAU lúc hỏi: địa chỉ cũ của cân vừa đổi địa chỉ còn nằm trong danh sách 60 giây — tính nó là
    // "cân vẫn ở địa chỉ cũ" thì không bao giờ theo cân sang địa chỉ mới.
    const moc = this.udp.moc();
    await this.udp.hoi();
    await new Promise(r => setTimeout(r, this.phu.choUdpMs ?? CHO_TRA_LOI_UDP_MS));
    const soIp = (ip: string) => ip.split('.').reduce((n, x) => n * 256 + Number(x), 0);
    const nghe = this.udp.tuMoc(moc).map(c => c.ip).sort((a, b) => soIp(a) - soIp(b));
    const thay: string[] = [];
    for (const ip of nghe) if (await this.xacMinhMayUdp(ip, ch)) thay.push(ip);
    return thay.length ? { thay, daThu: 0, dai: ['tín hiệu cân phát (UDP)'] } : null;
  }

  /**
   * 2.8 — máy vừa phát gói của cân (UDP, không mang mã máy, ai trong WiFi cũng phát được) có phải cân vẫn dùng không. Gói
   * chỉ là gợi ý địa chỉ:
   *   - đã nhớ mã máy cổng hai chiều → bắt tay 33581 ở đó, mã phải đúng (chỉ đọc, đóng ngay);
   *   - chỉ nhớ mã máy ARP → nối thử cổng của cân (để bảng ARP có máy đó) rồi đọc mã; không đọc được thì KHÔNG tin (dò TCP thì
   *     vừa nối nên bảng ARP luôn có; nghe UDP thì chưa gửi gì tới máy đó — bỏ qua bước này là đổi địa chỉ mà không so mã);
   *   - chưa nhớ mã nào → như dò TCP: dùng làm gợi ý (ketQuaTim chỉ đổi khi thấy đúng một máy).
   */
  private async xacMinhMayUdp(ip: string, ch: CauHinh): Promise<boolean> {
    if (ip === ch.ipCan) return true;
    if (ch.macHaiChieu) {
      try {
        const kn = await moKetNoi(ip, ch.congHaiChieu ?? CONG_HAI_CHIEU, this.phu.tuyHaiChieu ?? {});
        try { return kn.thongTin.mac === ch.macHaiChieu; } finally { kn.dong(); }
      } catch { return false; }
    }
    if (ch.macCan) {
      await (this.phu.thu ?? thuKetNoi)(ip, ch.congCan, 2000);
      const mac = await (this.phu.mac ?? layMac)(ip);
      return !!mac && mac === ch.macCan;
    }
    return true;
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
  /**
   * Cổng COM của máy, cổng và tốc độ lần thử trước, và tốc độ cân đang để theo thông số 41 trong file gốc (null =
   * chưa có file gốc / không đọc được). Tốc độ gợi ý: lần trước, không có thì theo cân, không có nữa thì 9600.
   */
  async dsCom(): Promise<{ cong: CongCom[]; com: string | null; baud: number; baudCan: number | null }> {
    const ch = this.cauHinh();
    let baudCan: number | null = null;
    try { baudCan = tocDoTuThongSo(docThongSo(docFileCan(this.docGoc())).get(41)); } catch { /* chưa có file gốc */ }
    return { cong: await dsCongCom(this.phu.chayPs), com: ch.com ?? null, baud: ch.baud ?? baudCan ?? 9600, baudCan };
  }

  /**
   * Gửi thử qua dây: đúng nội dung như gửi qua WiFi, giữ cả hàng ngoài kho (lỡ
   * qua dây cân thay cả danh sách như USB thì cũng không mất hàng). Bắt tay như
   * hãng trước khi gửi (cân không trả lời → báo, không gửi gì); gửi xong hỏi giờ
   * thêm một lần — daXacNhan là cân đã đọc hết. KHÔNG ghi nhận là cân đã nhận —
   * lần gửi WiFi sau vẫn gửi lại các thay đổi này. Trả một hàng vừa đổi để gọi
   * thử trên cân: ưu tiên hàng đổi giá (nhìn là thấy), rồi hàng thêm, cuối cùng
   * hàng chỉ đổi tên (đổi tên theo tảng).
   */
  guiThuQuaDay(b: { com?: unknown; baud?: unknown }): Promise<{
    com: string; baud: number; soByte: number; giay: number; daXacNhan: boolean; gio: GioCan | null;
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
      const kq = await guiCom(com, baud, du, this.phu.chayPs);
      this.ghiThem({ com, baud });
      return {
        com, baud, soByte: du.length, giay: Math.max(giayDay(du.length, baud), Math.round((Date.now() - bd) / 1000)),
        daXacNhan: kq.daXacNhan, gio: kq.gio,
        hang: { so: hang.so, ten: hang.ten, tenCu: hang.tenCu ?? null, gia: hang.gia, giaCu: hang.giaCu ?? null, loai: hang.loai },
      };
    });
  }

  /**
   * Kiểm tra dây: bắt tay như hãng (hỏi giờ cân qua dây). Trả lời được = dây, cổng, tốc độ đúng và cân đang ở
   * màn hình Prog → 4 → 3. Chỉ đọc, không đổi gì trên cân.
   */
  async kiemTraDay(b: { com?: unknown; baud?: unknown }): Promise<{ com: string; baud: number; gio: GioCan | null }> {
    await this.kiemQuyenCan('Kiểm tra dây RS232');
    const com = String(b.com ?? ''), baud = Number(b.baud);
    kiemCom(com, baud);
    return this.motLuc(async () => {
      const gio = await hoiGioQuaDay(com, baud, this.phu.chayPs);
      this.ghiThem({ com, baud });
      return { com, baud, gio };
    });
  }
}

// -----------------------------------------------------------------------------
// HÀM NHỎ (2.2)
// -----------------------------------------------------------------------------
const hai = (n: number) => String(n).padStart(2, '0');
/** "HH:MM" giờ Việt Nam của một mốc (ms) — gio-vn.ts, máy tính để múi giờ nào cũng vậy. */
const gioPhutVn = (ms: number) => gioVnTuMs(ms).slice(11, 16);
const laDoiTuong = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
/**
 * Chữ cài đặt chung định sửa, từ thân yêu cầu: số chữ → giá trị, giữ nguyên để kiemChuChung kiểm từng mục (giá trị không
 * phải chữ → báo "phải là chữ", không lặng lẽ bỏ). Thân không phải đối tượng → không sửa gì.
 */
const layThayChu = (v: unknown): Record<string, unknown> => (laDoiTuong(v) ? { ...v } : {});

/**
 * Dấu của một kế hoạch xoá qua WiFi: hàng sẽ còn nằm lại (số PLU + mã) và nguyên văn các dòng PLU sẽ gửi lại. Trang gửi
 * kèm dấu của lần xem trước; lúc bấm mà dấu khác = kho / cân đã đổi, kế hoạch sắp chạy không phải cái người đã xem.
 */
function dauKeHoach(conLai: HangTrenCan[], moi: FileCan): string {
  return createHash('sha1').update(conLai.map(h => `${h.so}\t${h.ma}`).join(',') + '|', 'utf8')
    .update(moi.plu.map(p => p.tho).join('\n'), 'latin1').digest('hex');
}

/**
 * 2.7 — file cân bỏ các dòng PLU có số trong `so` (số đã gỡ bằng ghi đè — tren-can.tsv giữ dòng trống của chúng). Mọi dòng
 * khác (kể cả BOM, xuống dòng) y nguyên byte. Không có dòng nào để bỏ → trả lại đúng mảng byte đó.
 */
export function boDongPlu(du: Uint8Array, so: ReadonlySet<number>): Uint8Array {
  const f = docFileCan(du);
  const bo = new Set(f.plu.filter(p => so.has(p.so)).map(p => p.dong));
  if (!bo.size) return du;
  const than = Buffer.from(f.dong.filter((_, i) => !bo.has(i)).join(f.xuongDong), 'latin1');
  return new Uint8Array(f.coBom ? Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), than]) : than);
}

/**
 * Số dòng kế hoạch BẬT / TẮT in hạn dùng (HSD) trên tem: hàng trên cân đổi giữa không in (null) và có số ngày, và hàng
 * MỚI bật in HSD khi trên cân chưa hàng nào in HSD (lần đầu bật HSD). Tự gửi và xoá qua WiFi không mang các thay đổi
 * này — tem in khác hẳn, quản lý xem trước rồi bấm Gửi. Chỉ đổi số ngày (demDemNguocHsd) thì không tính.
 */
function demBatTatHsd(dong: DongKeHoach[], goc: FileCan): number {
  const daInHsd = goc.plu.some(p => p.hsd !== null);
  return dong.filter(d => d.hsd !== undefined && (d.hsdCu !== undefined
    ? (d.hsd === null) !== (d.hsdCu === null)
    : d.loai === 'them' && d.hsd !== null && !daInHsd)).length;
}

/**
 * Số dòng chỉ đổi SỐ NGÀY HSD của hàng trên cân (cả cũ và mới đều là số): đếm ngược hằng ngày, đổi sang lô khác.
 * HSD = số ngày còn lại của lô nên đổi mỗi ngày — tự gửi gửi như đổi giá.
 */
function demDemNguocHsd(dong: DongKeHoach[]): number {
  return dong.filter(d => typeof d.hsd === 'number' && typeof d.hsdCu === 'number' && d.hsd !== d.hsdCu).length;
}

const LA_NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Ngày trong hsd-tinh-ngay.txt ('YYYY-MM-DD'); không có file, sai dạng → null (chưa biết). */
function docNgayHsd(file: string): string | null {
  let chu = '';
  try { chu = fs.readFileSync(file, 'utf8').trim(); } catch { return null; }
  return LA_NGAY.test(chu) ? chu : null;
}

/**
 * Hai file cân có cùng HSD trên mọi hàng đang in HSD của file mới (theo số PLU + mã cân)? Hàng không in HSD không
 * tính. Không có file cũ: cùng khi file mới không in HSD hàng nào.
 */
function cungHsd(cu: FileCan | null, moi: FileCan): boolean {
  const truoc = new Map((cu?.plu ?? []).map(p => [`${p.so}\t${p.ma}`, p.hsd]));
  return moi.plu.every(p => p.hsd === null || truoc.get(`${p.so}\t${p.ma}`) === p.hsd);
}

/** Số PLU → chữ trên phím tắt tầng 1 gọi nó (NHAN_PHIM của thong-so.ts: phím 58 là "_", không phải gạch dài). */
function phimTheoPlu(f: FileCan): Map<number, string> {
  const ra = new Map<number, string>();
  for (const k of docPhim(f)) if (k.trang === 0 && k.plu > 0 && k.phim <= PHIM_CHU_TOI_DA && !ra.has(k.plu)) ra.set(k.plu, k.nhan);
  return ra;
}

const chuoiGio = (g: GioCan) => `${g.nam}-${hai(g.thang)}-${hai(g.ngay)} ${hai(g.gio)}:${hai(g.phut)}:${hai(g.giay)}`;
/**
 * 2.8 — giờ cân − giờ Việt Nam lúc `ms` (giây, dương = cân nhanh). Cân giữ giờ địa phương (giờ VN ở quán); giờ VN lấy từ
 * gio-vn.ts nên máy tính để múi giờ nào cũng vậy.
 */
export function lechGiayVn(g: GioCan, ms: number): number {
  return Math.round((Date.UTC(g.nam, g.thang - 1, g.ngay, g.gio, g.phut, g.giay) - Date.parse(gioVnTuMs(ms) + 'Z')) / 1000);
}
/**
 * 2.8 — giờ Việt Nam lúc `ms` dạng giờ cân. 2.9.2: MỌI việc đặt / so giờ cân dùng giờ này (nhịp, tự chỉnh, nút Chỉnh giờ,
 * Đọc giờ, Chẩn đoán), không theo múi giờ của máy tính.
 */
export function gioVnLuc(ms: number): GioCan { return gioTuChu(gioVnTuMs(ms)); }
/** 2.9.2 — 'YYYYMMDD-HHmmss' theo giờ Việt Nam: tên file da-gui, chan-doan (trước đó theo múi giờ của máy). */
export const tenTheoGioVn = (ms: number) => gioVnTuMs(ms).replace(/-|:/g, '').replace('T', '-');

/** 2.8 — dưới 90 giây nói số giây ("45 giây"), dài hơn như khoangThoiGian. */
function khoangThoiGianNgan(giay: number): string {
  return giay < 90 ? `${Math.round(giay)} giây` : khoangThoiGian(giay);
}

/** Số giây → "3 ngày 4 giờ", "2 giờ 5 phút", "7 phút" (câu báo lệch giờ của Chẩn đoán WiFi). */
function khoangThoiGian(giay: number): string {
  const phut = Math.round(giay / 60), gio = Math.floor(phut / 60), ngay = Math.floor(gio / 24);
  if (ngay > 0) return `${ngay} ngày${gio % 24 ? ` ${gio % 24} giờ` : ''}`;
  if (gio > 0) return `${gio} giờ${phut % 60 ? ` ${phut % 60} phút` : ''}`;
  return `${phut} phút`;
}

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
    || e instanceof LoiGiaoThuc || e instanceof LoiThongSo || e instanceof LoiCapNhat) return e.message;
  // Lỗi của thư viện kho (PostgREST) là đối tượng { message, … }, không phải Error — String() ra "[object Object]".
  const m = e instanceof Error ? e.message
    : laDoiTuong(e) ? (typeof e.message === 'string' ? e.message : '') : e === null || e === undefined ? '' : String(e);
  // "Unable to connect" là câu của Bun (chính chương trình này) khi không nối được kho — khác "fetch failed" của Node.
  if (/fetch|network|unable to connect|load failed|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|timed? ?out/i.test(m)) {
    return 'Mất kết nối mạng. Kiểm tra internet rồi thử lại.';
  }
  if (laSaiKhoaKho(m)) return KHOA_KHO_DOI;
  if (/JWT|refresh|session/i.test(m)) return 'Phiên đăng nhập đã hết. Đăng nhập lại.';
  return m ? `Có lỗi: ${m}` : 'Có lỗi (không rõ chi tiết).';
}
