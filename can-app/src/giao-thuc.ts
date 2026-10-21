/**
 * BEEFTOWN CÂN — GIAO THỨC HAI CHIỀU CỦA HÃNG (cổng TCP 33581)
 *
 * TOÀN BỘ FILE NÀY CHƯA THỬ TRÊN CÂN THẬT. Cách nói chuyện dưới đây dựng lại từ
 * phần mềm TM-xA v3.10 của hãng (đọc mã dịch ngược, không chạy) — đặc tả có dẫn
 * chứng ở net-protocol.md (§ ghi trong chú thích là mục của file đó). Nhật ký của
 * TM-xA cho thấy chính cân của quán đã nói chuyện được qua cổng này (17/06/2024),
 * nhưng chương trình này chưa lần nào nối vào cân thật. Mọi câu lỗi vì thế đều chỉ
 * đường lui USB. Đường gửi của 2.1 (cổng 33571, `guiTcp` trong nghiep-vu.ts) giữ
 * nguyên, không dùng file này.
 *
 * CÁCH NÓI CHUYỆN (§0, §1.4, §6):
 *   - Cân là máy chủ TCP; máy tính nối vào. Không có mật khẩu, không có khung nhị
 *     phân, không có mã kiểm: chỉ là các dòng chữ tách cột bằng tab, như file USB
 *     A_000.TMS. Mỗi dòng kết thúc bằng tab rồi CRLF.
 *   - Máy tính gửi `DWL\t<PHẦN>\t` … `END\t<PHẦN>\t` = ghi xuống cân; `CLR\t<PHẦN>\t`
 *     + `CLR\tEND\t` = xoá cả phần; `UPL\t<PHẦN>\t` = hỏi cân. Cân trả các dòng rồi
 *     một dòng có cột đầu đúng bằng `END`; máy tính đáp `UPL\tEND\t`.
 *   - Cân không trả lời gì khi được ghi. Để biết cân đã xử lý xong, hãng gửi
 *     `UPL\tTIM\t` sau cùng (hàng rào) và chờ trả lời. Ở đây chờ dòng TIM RỒI mới
 *     tới dòng END của nó (§5.8 bản sửa): một dòng END đến trước dòng TIM không
 *     phải của hàng rào.
 *
 * Dòng luôn giữ dạng "chuỗi byte" (mỗi ký tự = 1 byte, latin1) như
 * `sangChuoiByte`/`tuChuoiByte` của web/src/lib/kho/can-tma.ts: đọc từ cân rồi ghi
 * lại thì y nguyên từng byte. Chỉ chữ để hiện (tên quán, tên máy) mới đổi sang
 * UTF-8.
 *
 * Mọi lần chờ đều có hạn (mặc định 30 giây như hãng; hàng rào sau khi ghi 60 giây
 * vì §11.7 khuyên chờ lâu hơn hãng). Hết hạn, mất kết nối hay cân trả dữ liệu lạ:
 * kết nối bị đóng (không đoán tiếp trạng thái dòng dữ liệu), các lệnh sau báo lỗi.
 *
 * 2.10 — CÙNG GIAO THỨC QUA DÂY RS232 (moKetNoiQuaLuong, cầu nối ở day-rs232.ts): phần mềm hãng nói đúng các dòng này
 * qua cổng COM (net-protocol.md §5 "RS-232 comparison"; ReportForm.cs đọc nhật ký qua dây bằng UPL INF, UPL MAC rồi
 * UPL REP). Khác đường mạng ba chỗ: không gửi BOM (đường dây của hãng mở bằng một dòng trống); sau MAC có UPL END như
 * hãng làm trên dây; cân chỉ nghe dây khi đang ở màn hình Prog → 4 → 3, nên lần hỏi MAC đầu chỉ chờ CHO_BAT_TAY_DAY_MS
 * và cân im lặng là 'khong-noi' (chưa gửi gì ngoài câu hỏi). Dây chậm (9600 bit/giây ≈ 1 KB/giây): mọi lần chờ gửi
 * và chờ hàng rào cộng thêm thời gian đẩy byte qua dây.
 */
import * as net from 'node:net';
import type { Duplex } from 'node:stream';
// Chữ cài đặt mạng: 15 tên WiFi, 16 mật khẩu WiFi, 19 tên miền máy chủ — một danh sách chung với đường 33571 / USB.
import { CHU_MANG } from './thong-so.ts';

export const CONG_HAI_CHIEU = 33581;

const CHO_MAC_DINH_MS = 30_000;          // recvTimeOut / sendTimeOut của hãng
const CHO_NOI_MAC_DINH_MS = 5_000;       // như guiTcp
const SO_LAN_HOI = 3;                    // hãng hỏi MAC / INF lại mãi; mình hỏi tối đa 3 lần
const SO_LAN_DOC_LAI_BAO_CAO = 10;       // như hãng: đọc tối đa 11 lần (§5.10)
const NGHI_BAO_CAO_MAC_DINH_MS = 100;    // lần đọc lại thứ n nghỉ n × 100 ms như hãng
/** 2.10 — qua dây: chờ cân trả lời lần hỏi đầu (hãng chờ 3 giây, kiểm dây ở day-rs232.ts chờ 5). */
export const CHO_BAT_TAY_DAY_MS = 5_000;
const LECH_GIO_TOI_DA_MS = 120_000;      // datGio: giờ cân đọc lại lệch hơn thế là cân chưa nhận
const DONG_TOI_DA = 1_000_000;           // một dòng dài hơn thế là dữ liệu lạ
const DOC_TOI_DA = 20_000_000;           // một lần đọc (một phần, một lần nhật ký) tối đa
const BOM = '\xEF\xBB\xBF';
const XD = '\r\n';

// -----------------------------------------------------------------------------
// LỖI
// -----------------------------------------------------------------------------
/**
 * khong-noi: chưa nối được (chưa gửi gì) · het-gio: cân không trả lời kịp ·
 * mat-ket-noi: kết nối đứt · sai-du-lieu: cân trả dữ liệu không đúng dạng ·
 * khong-cho-phep: dữ liệu định gửi bị chặn trước khi gửi (chưa gửi byte nào,
 * kết nối vẫn dùng tiếp được).
 */
export type LoaiLoiGiaoThuc = 'khong-noi' | 'het-gio' | 'mat-ket-noi' | 'sai-du-lieu' | 'khong-cho-phep';

/** Lỗi có câu tiếng Việt cho người dùng — giao diện hiện nguyên câu này. */
export class LoiGiaoThuc extends Error {
  readonly loai: LoaiLoiGiaoThuc;
  /** Đã gửi dữ liệu ghi xuống cân trước khi lỗi: cân có thể đã nhận một phần. */
  readonly daGhi: boolean;
  constructor(cau: string, loai: LoaiLoiGiaoThuc = 'sai-du-lieu', daGhi = false) {
    super(cau);
    this.loai = loai;
    this.daGhi = daGhi;
  }
}

const CHUA_THU = 'Cách nối hai chiều (cổng 33581) chưa thử trên cân thật.';
/** 2.10 — qua dây: thay CHUA_THU trong mọi câu lỗi của kết nối dây (KetNoi.lam). */
const CHUA_THU_DAY = 'Đọc / ghi qua dây RS232 mới thử bắt tay trên cân thật. Trên cân vào Prog → 4 → 3 rồi thử lại.';
const LUI_DOC = `${CHUA_THU} Nếu vẫn lỗi, dùng USB: trên cân lưu dữ liệu ra USB rồi đưa file A_000.TMS (thư mục JHSCALE) vào chương trình.`;
const LUI_GHI = `${CHUA_THU} Nếu vẫn lỗi, dùng USB: bấm "Lưu file để nạp USB" rồi nạp file vào cân.`;
const LUI_CHUNG = `${CHUA_THU} Nếu vẫn lỗi, dùng USB như trước (lưu từ cân ra USB để đọc, nạp file USB để ghi).`;
const DONG_TM_XA = 'Phần mềm của hãng (TM-xA) có đang mở trên máy nào không? Đóng nó trước — hai chương trình cùng nối một cân dễ lẫn dữ liệu.';

/** Việc đang làm, để câu lỗi nói đúng chỗ hỏng. */
interface NguCanh {
  viec: string;          // "đọc danh sách hàng (PLU)"…
  ghi: boolean;          // việc này gửi dữ liệu xuống cân
  coXoa?: boolean;       // dữ liệu gửi có lệnh CLR
}

const giay = (ms: number) => (ms >= 1000 ? String(Math.round(ms / 1000)) : (ms / 1000).toFixed(1).replace('.', ','));

function duoiGhi(nc: NguCanh): string {
  if (!nc.ghi) return LUI_DOC;
  const xoa = nc.coXoa
    ? ' Lệnh xoá cả phần (CLR) có thể đã chạy mà danh sách mới chưa nạp đủ — cân có thể đang thiếu hàng: nạp USB ngay.'
    : '';
  return `Chưa chắc cân đã lưu phần vừa gửi — xem lại trên cân.${xoa} ${LUI_GHI}`;
}

function loiHetGio(nc: NguCanh, ms: number): LoiGiaoThuc {
  return new LoiGiaoThuc(`Cân không trả lời sau ${giay(ms)} giây khi ${nc.viec}. ${DONG_TM_XA} ${duoiGhi(nc)}`, 'het-gio', nc.ghi);
}
function loiMat(nc: NguCanh): LoiGiaoThuc {
  return new LoiGiaoThuc(`Mất kết nối với cân khi ${nc.viec}. ${duoiGhi(nc)}`, 'mat-ket-noi', nc.ghi);
}
function loiDuLieu(nc: NguCanh, chiTiet: string): LoiGiaoThuc {
  return new LoiGiaoThuc(`Cân trả dữ liệu không đúng dạng khi ${nc.viec}: ${chiTiet}. ${duoiGhi(nc)}`, 'sai-du-lieu', nc.ghi);
}
function loiChan(chiTiet: string): LoiGiaoThuc {
  return new LoiGiaoThuc(`Không gửi xuống cân: ${chiTiet}. Chưa gửi gì.`, 'khong-cho-phep');
}

// -----------------------------------------------------------------------------
// KIỂU DỮ LIỆU
// -----------------------------------------------------------------------------
export interface ThongTinCan {
  /** Mã máy, 12 chữ số hex viết hoa, ví dụ "0023F01AECB1" (dòng MAC; dòng INM có thì theo INM như hãng). */
  mac: string;
  /** Tên quán trên cân (TMT 0), đã đổi sang chữ. */
  cuaHang: string;
  /** Tên máy (TMT 1), đã đổi sang chữ. */
  tenMay: string;
  /** Số máy (Spec 40). */
  soMay: number;
  /** Model và firmware, ví dụ "TM-xA UA006 V3.14E8". */
  model: string;
  /** Từ cuối của model, ví dụ "V3.14E8" ("" nếu model chỉ có một từ). */
  phienBan: string;
  /** Bảng mã cân báo ở dòng INA, ví dụ "UTF-8" ("" nếu cân không báo). */
  maHoa: string;
}

export type PhanDoc = 'TMS' | 'TMT' | 'SCP' | 'DPT' | 'CLS' | 'PLU' | 'BAR' | 'LAB' | 'SAL';
export interface GioCan { nam: number; thang: number; ngay: number; gio: number; phut: number; giay: number }

export interface KetNoiCan {
  readonly thongTin: ThongTinCan;
  /** Phiên bản firmware dạng chuỗi byte (ghi vào file USB y nguyên). */
  readonly phienBanTho: string;
  /**
   * 2.8 — kết nối còn dùng được: chưa đóng, chưa hỏng ở lệnh trước, cân chưa đóng phía bên kia. Không chắc cân còn
   * nghe (cân tắt đột ngột không báo gì) — muốn chắc thì hỏi giờ với hạn ngắn (docGio(ms)).
   */
  readonly dangMo: boolean;
  /** Như "Upload data" của hãng: các phần theo thứ tự, trên cùng một lượt. */
  docCacPhan(ds: PhanDoc[]): Promise<string[][]>;
  /** UPL <phần>: các dòng của phần (chuỗi byte, không gồm dòng END). LAB trả cả LAS và LAE của từng mẫu tem. */
  docPhan(ten: PhanDoc): Promise<string[]>;
  /** UPL REP -N: nhật ký bán từ giao dịch (FID) số tuFid trở đi, đọc tới khi hai lần liền khớp nhau như hãng. */
  docBaoCao(tuFid: number): Promise<string[]>;
  /** UPL TIM: giờ trên cân. `choMs`: chờ tối đa (mặc định như mọi lần đọc) — 2.8 hỏi nhanh xem kết nối còn sống không. */
  docGio(choMs?: number): Promise<GioCan>;
  /** Gửi CRLF + các khối DWL/CLR…END, rồi hàng rào UPL TIM (đọc dòng TIM rồi END), rồi UPL END. */
  ghi(dong: string[]): Promise<void>;
  /** DWL TIM (số không đệm 0), rồi hàng rào; giờ cân đọc lại phải khớp giờ vừa đặt. */
  datGio(luc: GioCan): Promise<void>;
  /** Đóng kết nối (không gửi gì thêm). */
  dong(): void;
}

export interface TuyChonKetNoi {
  /** Chờ mỗi dòng trả lời tối đa (ms). Mặc định 30 000 như hãng. */
  choMs?: number;
  /** Chờ nối TCP tối đa (ms). Mặc định 5 000. */
  choNoiMs?: number;
  /** Sau khi ghi, chờ cân qua hàng rào tối đa (ms). Mặc định 2 × choMs (§11.7: cân lưu nhiều PLU cần hơn 30 s). */
  choHangRaoMs?: number;
  /** Đọc nhật ký bán: lần đọc lại thứ n nghỉ n × nghiBaoCaoMs. Mặc định 100 như hãng. */
  nghiBaoCaoMs?: number;
  /** Tạo kết nối — kiểm thử thay được. Mặc định net.createConnection. */
  taoSocket?: (ip: string, cong: number) => net.Socket;
  /**
   * 2.8 — cân tự báo (dòng "ASK\t…", thông số 58): gọi với nguyên dòng (chuỗi byte), sau khi đã bỏ dòng đó khỏi luồng
   * trả lời. Không có → chỉ bỏ như trước. Gọi ở lượt sau của vòng sự kiện, lỗi trong hàm bị nuốt (không làm hỏng việc đọc).
   */
  khiCanBao?: (dong: string) => void;
}

/** baud: 2.10 — tốc độ dây khi nói qua dây RS232 (null = qua mạng). */
interface ThoiGian { choMs: number; choNoiMs: number; choHangRaoMs: number; nghiBaoCaoMs: number; baud: number | null }

/** 2.10 — mili giây để đẩy `soByte` qua dây ở tốc độ `baud` (10 bit một byte), gấp đôi cho chắc; qua mạng: 0. */
const msQuaDay = (soByte: number, baud: number | null) => (baud ? Math.ceil(soByte * 10 / baud) * 2000 : 0);

// -----------------------------------------------------------------------------
// HÀM THUẦN
// -----------------------------------------------------------------------------
const truong0 = (d: string) => { const k = d.indexOf('\t'); return k < 0 ? d : d.slice(0, k); };
const LA_SO_NGUYEN = /^\s*[+-]?\d+\s*$/;                     // như int.TryParse của .NET
const chuTuByte = (s: string) => new TextDecoder('utf-8').decode(Buffer.from(s, 'latin1'));
const laUtf8 = (ten: string) => ten.toLowerCase().replace(/[-_\s]/g, '') === 'utf8';

function kiemGio(luc: GioCan): void {
  const { nam, thang, ngay, gio, phut, giay: s } = luc ?? ({} as GioCan);
  const nguyen = [nam, thang, ngay, gio, phut, s].every(Number.isInteger);
  const d = nguyen ? new Date(Date.UTC(nam, thang - 1, ngay)) : null;
  if (!d || nam < 2000 || nam > 2099 || d.getUTCMonth() !== thang - 1 || d.getUTCDate() !== ngay
    || gio < 0 || gio > 23 || phut < 0 || phut > 59 || s < 0 || s > 59) {
    throw loiChan('giờ đặt cho cân không hợp lệ (năm 2000–2099, ngày giờ có thật)');
  }
}

/**
 * Khối đặt giờ cân (§5.3): số không đệm 0, năm lấy hai số cuối.
 * 2026-09-29 14:05:09 → ["DWL\tTIM\t", "TIM\t26\t9\t29\t14\t5\t9\t", "END\tTIM\t"].
 */
export function khoiTim(luc: GioCan): string[] {
  kiemGio(luc);
  return ['DWL\tTIM\t', `TIM\t${luc.nam % 100}\t${luc.thang}\t${luc.ngay}\t${luc.gio}\t${luc.phut}\t${luc.giay}\t`, 'END\tTIM\t'];
}

/**
 * Xoá hết PLU trên cân rồi nạp lại đúng danh sách này (§5.12: cân không có lệnh
 * xoá một PLU). CHƯA THỬ TRÊN CÂN THẬT. Danh sách rỗng bị chặn: đó là lệnh xoá
 * sạch hàng trên cân.
 */
export function khoiXoaVaNapPlu(dongPlu: string[]): string[] {
  if (!Array.isArray(dongPlu) || dongPlu.length === 0) throw loiChan('danh sách hàng rỗng — lệnh này sẽ xoá sạch hàng trên cân');
  for (const d of dongPlu) {
    if (typeof d !== 'string' || !d.startsWith('PLU\t') || /[\r\n]/.test(d)) throw loiChan('danh sách hàng có dòng không phải dòng PLU');
  }
  return ['CLR\tPLU\t', 'CLR\tEND\t', 'DWL\tPLU\t', ...dongPlu, 'END\tPLU\t'];
}

/** Phần ghi được qua `ghi` (DWL). TIM chỉ qua datGio; REP, INF, MAC, VER, FNT, PAS… không bao giờ (§9). */
export const PHAN_GHI_DUOC: readonly PhanDoc[] = ['TMS', 'TMT', 'SCP', 'DPT', 'CLS', 'PLU', 'BAR', 'LAB', 'SAL'];
/** Phần được xoá cả phần (CLR) qua `ghi`. CLR TMS/TMT đặt lại cả cài đặt mạng của cân (§9.1). */
export const PHAN_XOA_DUOC: readonly PhanDoc[] = ['PLU'];
/** Thông số mạng (§9.2): gửi sai là cân rời WiFi tới khi sửa bằng tay trên cân. Cũng bỏ khỏi mọi lần gửi qua 33571 (2.7). */
export const laThongSoMang = (id: number) => (id >= 43 && id <= 53) || (id >= 150 && id <= 173) || (id >= 430 && id <= 441);

/**
 * Kiểm dữ liệu trước khi gửi bằng `ghi`: chỉ các khối DWL/CLR…END đúng dạng,
 * phần được phép, không đụng thông số mạng. Sai thì ném LoiGiaoThuc
 * 'khong-cho-phep' — chưa gửi byte nào.
 */
export function kiemKhoiGhi(dong: string[]): void {
  if (!Array.isArray(dong) || dong.length === 0) throw loiChan('không có dữ liệu để gửi');
  let trong: string | null = null;       // phần đang mở
  let choClrEnd = false;
  let soKhoi = 0;
  for (const d of dong) {
    if (typeof d !== 'string') throw loiChan('dữ liệu gửi có dòng không phải chữ');
    if (/[\r\n]/.test(d)) throw loiChan('một dòng có ký tự xuống dòng ở giữa');
    for (let i = 0; i < d.length; i++) if (d.charCodeAt(i) > 0xFF) throw loiChan('dòng chưa đổi sang chuỗi byte (có ký tự ngoài 0–255)');
    const f = d.split('\t');
    if (choClrEnd) {
      if (d !== 'CLR\tEND\t') throw loiChan('lệnh CLR phải có dòng CLR END ngay sau');
      choClrEnd = false;
      continue;
    }
    if (trong === null) {
      if (d === '') continue;
      if (f.length === 3 && f[2] === '' && f[0] === 'DWL') {
        if (!PHAN_GHI_DUOC.includes(f[1] as PhanDoc)) {
          throw loiChan(f[1] === 'TIM' ? 'giờ cân chỉ đặt bằng nút đặt giờ' : `phần ${f[1]} không được ghi qua WiFi`);
        }
        trong = f[1];
        soKhoi++;
        continue;
      }
      if (f.length === 3 && f[2] === '' && f[0] === 'CLR') {
        if (!PHAN_XOA_DUOC.includes(f[1] as PhanDoc)) throw loiChan(`không cho xoá cả phần ${f[1]} trên cân`);
        choClrEnd = true;
        soKhoi++;
        continue;
      }
      throw loiChan('có dòng nằm ngoài khối DWL…END');
    }
    if (f[0] === 'END') {
      if (d !== `END\t${trong}\t`) throw loiChan(`khối ${trong} đóng sai`);
      trong = null;
      continue;
    }
    if (d === '') throw loiChan(`dòng trống giữa khối ${trong}`);
    const hopLe = f[0] === trong || (trong === 'LAB' && (f[0] === 'LAS' || f[0] === 'LAE'));
    if (!hopLe) throw loiChan(`dòng ${f[0]} nằm trong khối ${trong}`);
    if (trong === 'TMS' || trong === 'TMT') {
      if (!LA_SO_NGUYEN.test(f[1] ?? '')) throw loiChan(`dòng ${trong} không có số thứ tự`);
      const id = parseInt(f[1], 10);
      if (trong === 'TMS' && laThongSoMang(id)) throw loiChan(`không ghi thông số mạng (TMS ${id}) qua WiFi`);
      if (trong === 'TMT' && CHU_MANG.has(id)) throw loiChan(`không ghi tên / mật khẩu WiFi hay tên miền (TMT ${id}) qua WiFi`);
    }
  }
  if (choClrEnd) throw loiChan('lệnh CLR thiếu dòng CLR END');
  if (trong !== null) throw loiChan(`khối ${trong} chưa đóng (thiếu END)`);
  if (soKhoi === 0) throw loiChan('không có khối DWL/CLR nào');
}

/**
 * Mã máy trong dòng INM (đã tách cột): cột 2, như hãng đọc qua mạng (NetForm.cs:2088–2100). "ZZZZ…" (cân không có
 * mã) → '000000000000'; cột 2 không phải 12 số hex → '' (người gọi tự chọn mã khác). Đường WiFi và đường file USB
 * (bao-cao-can.ts) cùng dùng hàm này, để một giao dịch đọc qua hai đường có cùng khoá nhật ký — phần mềm hãng thì
 * lệch: nhập file USB theo cột 1, nên sau "New MAC" nhật ký hai đường nằm ở hai cân khác nhau.
 */
export function macTuInm(f: readonly string[]): string {
  const m = f[2] ?? '';
  if (m.startsWith('ZZZZ')) return '000000000000';
  return /^[0-9A-Fa-f]{12}$/.test(m) ? m.toUpperCase() : '';
}

/** Firmware từ 2.38 hỏi nhật ký bằng dấu trừ (§4.2, §5.10): từ thứ 3 của model, ký tự 1–4. */
export function coDauTru(model: string): boolean {
  const tu = model.split(' ');
  if (tu.length < 3 || tu[2].length < 6) return false;
  const so = tu[2].slice(1, 5);
  return /^\s*[+-]?(\d+\.?\d*|\.\d+)\s*$/.test(so) && Number(so) >= 2.38;
}

/** Dòng hỏi nhật ký bán: "UPL\tREP\t-5\t" (firmware ≥ 2.38) hoặc "UPL\tREP\t5\t". */
export function yeuCauBaoCao(model: string, tuFid: number): string {
  if (!Number.isInteger(tuFid) || tuFid < 1) throw loiChan('số giao dịch bắt đầu phải là số nguyên từ 1');
  return `UPL\tREP\t${coDauTru(model) ? '-' : ''}${tuFid}\t`;
}

/** Thứ tự đọc như "Upload data" của hãng (§5.9). */
const THU_TU_DOC: PhanDoc[] = ['TMS', 'TMT', 'SCP', 'DPT', 'CLS', 'PLU', 'BAR', 'LAB'];
/** Thứ tự phần trong file USB cân tự lưu (đối chiếu file thật V3.14E8). */
const THU_TU_FILE: PhanDoc[] = ['DPT', 'CLS', 'PLU', 'BAR', 'LAB', 'SAL', 'SCP', 'TMS', 'TMT'];

/**
 * Ghép các phần đọc qua WiFi thành file dạng USB mà docFileCan đọc được:
 * "ECS\tVER\t<phienBan>\t", dòng trống, mỗi phần "DWL\t<PHẦN>\t" … "END\t<PHẦN>\t" rồi
 * dòng trống, cuối "END\tECS\t" — CRLF, không BOM, như file cân tự lưu. Phần có
 * trong `phan` mà rỗng vẫn ghi khối rỗng (docFileCan cần khối PLU).
 */
export function ghepFileUsb(phienBan: string, phan: Partial<Record<PhanDoc, string[]>>): Uint8Array<ArrayBuffer> {
  const L = [`ECS\tVER\t${String(phienBan).replace(/[\t\r\n]/g, '')}\t`, ''];
  for (const ten of THU_TU_FILE) {
    const ds = phan[ten];
    if (!ds) continue;
    L.push(`DWL\t${ten}\t`, ...ds, `END\t${ten}\t`, '');
  }
  L.push('END\tECS\t', '');
  const s = L.join(XD);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i) & 0xFF;
  return u8;
}

// -----------------------------------------------------------------------------
// ĐỌC DÒNG TỪ CÂN
// -----------------------------------------------------------------------------
/** Kết nối đóng (không còn dòng nào đến nữa). */
class KetNoiDaDong extends Error {}

/**
 * Tách dòng như StreamReader.ReadLine: nhận CR, LF hay CRLF; bỏ dòng trống, bỏ
 * BOM đầu dòng; bỏ dòng "ASK\t…" cân tự đẩy (§5.11, §9.12 — hãng cũng bỏ khi
 * không bật nghe nền).
 */
class DocDong {
  constructor(private readonly khiCanBao?: (dong: string) => void) {}
  private du = '';
  private hang: string[] = [];
  private dau = 0;
  private cho: { xong: (d: string | null) => void; hong: (e: Error) => void; hen: ReturnType<typeof setTimeout> } | null = null;
  private het: Error | null = null;

  them(chunk: Buffer): void {
    if (this.het) return;
    const s = this.du + chunk.toString('latin1');
    let tu = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c !== 13 && c !== 10) continue;
      this.nhanDong(s.slice(tu, i));
      if (c === 13 && s.charCodeAt(i + 1) === 10) i++;
      tu = i + 1;
    }
    this.du = s.slice(tu);
    if (this.du.length > DONG_TOI_DA) this.ket(new LoiGiaoThuc(`Cân gửi một dòng dài quá ${DONG_TOI_DA} byte. ${LUI_CHUNG}`, 'sai-du-lieu'));
  }

  private nhanDong(d: string): void {
    while (d.startsWith(BOM)) d = d.slice(3);
    if (d === '') return;
    if (d.startsWith('ASK\t')) {
      const bao = this.khiCanBao;
      if (bao) queueMicrotask(() => { try { bao(d); } catch { /* người nghe hỏng: không làm hỏng việc đọc */ } });
      return;
    }
    if (this.cho) { const c = this.cho; this.cho = null; clearTimeout(c.hen); c.xong(d); return; }
    this.hang.push(d);
  }

  /** Không còn dòng nào nữa (kết nối đóng hay dữ liệu hỏng). */
  ket(e: Error): void {
    if (this.het) return;
    this.het = e;
    if (this.cho) { const c = this.cho; this.cho = null; clearTimeout(c.hen); c.hong(e); }
  }

  /** Không còn dòng nào đến nữa (kết nối đã đóng / hỏng). */
  get daHet(): boolean { return this.het !== null; }

  /** Bỏ các dòng đã đến mà chưa ai đọc (AsyReadClear của hãng). */
  xoaHang(): void { this.hang = []; this.dau = 0; }

  /** Dòng kế tiếp; null nếu hết `ms` mà chưa có. */
  docDong(ms: number): Promise<string | null> {
    if (this.dau < this.hang.length) {
      const d = this.hang[this.dau++];
      if (this.dau === this.hang.length) this.xoaHang();
      return Promise.resolve(d);
    }
    if (this.het) return Promise.reject(this.het);
    return new Promise((xong, hong) => {
      const hen = setTimeout(() => { this.cho = null; xong(null); }, Math.max(1, ms));
      this.cho = { xong, hong, hen };
    });
  }
}

// -----------------------------------------------------------------------------
// KẾT NỐI
// -----------------------------------------------------------------------------
const TEN_PHAN: Record<PhanDoc, string> = {
  TMS: 'thông số (TMS)', TMT: 'chữ cài đặt (TMT)', SCP: 'phím tắt (SCP)', DPT: 'nhóm hàng (DPT)', CLS: 'loại hàng (CLS)',
  PLU: 'danh sách hàng (PLU)', BAR: 'kiểu mã vạch (BAR)', LAB: 'mẫu tem (LAB)', SAL: 'nhân viên bán (SAL)',
};

/** Dòng TIM của cân (đã tách cột) → giờ; dòng sai → null. Dùng cả cho dây RS232 (day-rs232.ts). */
export function docDongTim(f: string[]): GioCan | null {
  if (f.length < 7 || !f.slice(1, 7).every(x => LA_SO_NGUYEN.test(x))) return null;
  const [yy, thang, ngay, gio, phut, s] = f.slice(1, 7).map(x => parseInt(x, 10));
  // Hãng cộng 2000 (cân gửi năm 2 số); năm đã đủ 4 số thì giữ nguyên, như lucTuRep đọc nhật ký bán.
  return { nam: yy < 100 ? yy + 2000 : yy, thang, ngay, gio, phut, giay: s };
}
const msCua = (g: GioCan) => Date.UTC(g.nam, g.thang - 1, g.ngay, g.gio, g.phut, g.giay);
const hienGio = (g: GioCan) => {
  const h = (n: number) => String(n).padStart(2, '0');
  return `${h(g.gio)}:${h(g.phut)}:${h(g.giay)} ngày ${h(g.ngay)}/${h(g.thang)}/${g.nam}`;
};

class KetNoi implements KetNoiCan {
  thongTin: ThongTinCan = { mac: '', cuaHang: '', tenMay: '', soMay: 0, model: '', phienBan: '', maHoa: '' };
  /** Model và phiên bản dạng chuỗi byte (ghi vào file USB y nguyên). */
  modelTho = '';
  phienBanTho = '';
  private doc: DocDong;
  private xich: Promise<unknown> = Promise.resolve();
  private loiHong: LoiGiaoThuc | null = null;
  private daDong = false;
  private soByteDoc = 0;
  /** Socket TCP, hay (2.10) luồng của cầu nối dây — cùng cách đọc / ghi. */
  private s: Duplex;
  private tg: ThoiGian;
  /** 2.10 — tên cổng COM khi nói qua dây (null = qua mạng). */
  private readonly day: string | null;
  /** 2.10 — lỗi cầu nối dây báo khi luồng hỏng (cổng không đẩy được, dây rút…) — ghép vào câu "mất kết nối". */
  private loiLuong: string | null = null;

  constructor(s: Duplex, tg: ThoiGian, khiCanBao?: (dong: string) => void, day: string | null = null) {
    this.day = day;
    this.s = s;
    this.tg = tg;
    this.doc = new DocDong(khiCanBao);
    s.on('data', (b: Buffer) => this.doc.them(b));
    s.on('end', () => this.doc.ket(new KetNoiDaDong()));
    s.on('close', () => this.doc.ket(new KetNoiDaDong()));
    s.on('error', (e: Error) => { if (day && e?.message) this.loiLuong = e.message; /* 'close' theo sau */ });
  }

  /** 2.10 — qua dây: câu lỗi nói về dây (không về cổng 33581), kèm lỗi cầu nối báo nếu có. Qua mạng: giữ nguyên. */
  private theoDuong(l: LoiGiaoThuc): LoiGiaoThuc {
    if (!this.day) return l;
    let cau = l.message.split(CHUA_THU).join(CHUA_THU_DAY);
    if (l.loai === 'mat-ket-noi' && this.loiLuong && !cau.includes(this.loiLuong)) cau = `${cau} (Dây báo: ${this.loiLuong})`;
    return cau === l.message ? l : new LoiGiaoThuc(cau, l.loai, l.daGhi);
  }

  // ---- gửi / đọc ------------------------------------------------------------
  private gui(chu: string, nc: NguCanh): Promise<void> {
    return new Promise((xong, hong) => {
      if (this.s.destroyed || !this.s.writable) { hong(loiMat(nc)); return; }
      // Qua dây: cầu nối chỉ nhận tiếp khi dây đẩy đi được — chờ thêm thời gian đẩy hết đoạn này.
      const ms = this.tg.choMs + msQuaDay(chu.length, this.tg.baud);
      const hen = setTimeout(() => hong(loiHetGio(nc, ms)), ms);
      this.s.write(Buffer.from(chu, 'latin1'), (e) => { clearTimeout(hen); if (e) hong(loiMat(nc)); else xong(); });
    });
  }

  private async docDong(nc: NguCanh, ms = this.tg.choMs): Promise<string> {
    let d: string | null;
    try { d = await this.doc.docDong(ms); } catch (e) {
      if (e instanceof LoiGiaoThuc) throw e;
      throw loiMat(nc);
    }
    if (d === null) throw loiHetGio(nc, ms);
    this.soByteDoc += d.length + 2;
    if (this.soByteDoc > DOC_TOI_DA) throw loiDuLieu(nc, `trả quá ${DOC_TOI_DA / 1_000_000} MB`);
    return d;
  }

  /** Mọi dòng tới dòng có cột đầu đúng bằng "END" (không tính dòng END). `ms`: chờ mỗi dòng (mặc định choMs). */
  private async docToiEnd(nc: NguCanh, ms?: number): Promise<string[]> {
    const ra: string[] = [];
    for (;;) {
      const d = await this.docDong(nc, ms);
      if (truong0(d) === 'END') return ra;
      ra.push(d);
    }
  }

  /**
   * Chờ trả lời UPL TIM: dòng TIM rồi dòng END sau nó; END đến trước TIM không
   * phải của hàng rào nên bỏ qua (§5.8 bản sửa). Cả lần chờ tối đa `ms`.
   */
  private async docHangRao(nc: NguCanh, ms: number): Promise<{ gio: GioCan | null }> {
    const hanChot = Date.now() + ms;
    let daThayTim = false, gio: GioCan | null = null;
    for (;;) {
      const conLai = hanChot - Date.now();
      if (conLai <= 0) throw loiHetGio(nc, ms);
      let d: string;
      try { d = await this.docDong(nc, conLai); } catch (e) {
        if (e instanceof LoiGiaoThuc && e.loai === 'het-gio') throw loiHetGio(nc, ms);
        throw e;
      }
      const f0 = truong0(d);
      if (f0 === 'TIM') { daThayTim = true; gio = docDongTim(d.split('\t')); } else if (f0 === 'END' && daThayTim) return { gio };
    }
  }

  /** Chạy lần lượt từng việc trên kết nối; hỏng giữa chừng thì đóng kết nối. */
  private lam<T>(nc: NguCanh, f: () => Promise<T>): Promise<T> {
    const chay = async (): Promise<T> => {
      if (this.loiHong) {
        throw this.theoDuong(new LoiGiaoThuc(`Kết nối với cân đã đóng sau lỗi lần trước. Mở kết nối mới rồi thử lại. ${LUI_CHUNG}`, 'mat-ket-noi'));
      }
      if (this.daDong) throw new LoiGiaoThuc('Kết nối với cân đã đóng. Mở kết nối mới rồi thử lại.', 'mat-ket-noi');
      this.doc.xoaHang();
      this.soByteDoc = 0;
      try {
        return await f();
      } catch (e) {
        // Qua dây: câu lỗi nói về dây, không về cổng 33581 (theoDuong).
        const l = this.theoDuong(e instanceof LoiGiaoThuc ? e
          : new LoiGiaoThuc(`Có lỗi khi ${nc.viec}: ${(e as Error)?.message ?? e}. ${duoiGhi(nc)}`, 'sai-du-lieu', nc.ghi));
        if (l.loai !== 'khong-cho-phep') { this.loiHong = l; this.huy(); }
        throw l;
      }
    };
    const p = this.xich.then(chay, chay);
    this.xich = p.catch(() => {});
    return p;
  }

  private huy(): void {
    this.doc.ket(new KetNoiDaDong());
    this.s.destroy();
  }

  get dangMo(): boolean { return !this.daDong && !this.loiHong && !this.s.destroyed && !this.doc.daHet; }

  // ---- bắt tay (§3.1, §4) ---------------------------------------------------
  async batTay(): Promise<void> {
    return this.lam({ viec: 'đọc thông tin cân', ghi: false }, async () => {
      // Như StreamWriter UTF-8 của hãng: BOM rồi một dòng trống (§1.5). Qua dây hãng chỉ mở bằng một dòng trống.
      await this.gui(this.day ? XD : BOM + XD, { viec: 'mở kết nối', ghi: false });

      const ncMac: NguCanh = { viec: 'đọc mã máy (MAC)', ghi: false };
      const choDau = Math.min(CHO_BAT_TAY_DAY_MS, this.tg.choMs);
      let mac: string | null = null;
      for (let lan = 0; lan < SO_LAN_HOI && mac === null; lan++) {
        await this.gui('UPL\tMAC\t' + XD, ncMac);
        let tra: string[];
        try {
          // Qua dây: lần hỏi đầu chờ ngắn — cân không ở màn hình P43 thì không bao giờ trả lời.
          tra = await this.docToiEnd(ncMac, this.day && lan === 0 ? choDau : undefined);
        } catch (e) {
          if (this.day && lan === 0 && e instanceof LoiGiaoThuc && e.loai === 'het-gio') throw loiKhongNoiDay(this.day, choDau);
          throw e;
        }
        for (const d of tra) {
          const f = d.split('\t');
          if (f[0] !== 'MAC') continue;
          const so = f.slice(1, 7);
          if (so.length < 6 || !so.every(x => LA_SO_NGUYEN.test(x) && Number(x) >= 0 && Number(x) <= 255)) {
            throw loiDuLieu(ncMac, `dòng MAC phải có 6 số từ 0 đến 255, cân trả "${d.replace(/\t/g, ' ').trim().slice(0, 60)}"`);
          }
          mac = so.map(x => parseInt(x, 10).toString(16).toUpperCase().padStart(2, '0')).join('');
        }
      }
      if (mac === null) throw loiDuLieu(ncMac, `hỏi ${SO_LAN_HOI} lần mà cân không trả dòng MAC`);
      // Hãng không gửi UPL END sau MAC trên đường mạng (§4.1); trên dây thì có (ReportForm.cs:6164).
      if (this.day) await this.gui('UPL\tEND\t' + XD, ncMac);

      const ncInf: NguCanh = { viec: 'đọc thông tin cân (INF)', ghi: false };
      let inf: string[] | null = null, ina: string[] | null = null, inm: string[] | null = null;
      for (let lan = 0; lan < SO_LAN_HOI && inf === null; lan++) {
        await this.gui('UPL\tINF\t' + XD, ncInf);
        for (const d of await this.docToiEnd(ncInf)) {
          const f = d.split('\t');
          if (f[0] === 'INF' && f.length >= 5) inf = f;
          else if (f[0] === 'INA') ina = f;
          else if (f[0] === 'INM') inm = f;
        }
      }
      await this.gui('UPL\tEND\t' + XD, ncInf);
      if (inf === null) throw loiDuLieu(ncInf, `hỏi ${SO_LAN_HOI} lần mà cân không trả dòng INF`);
      if (!LA_SO_NGUYEN.test(inf[3])) throw loiDuLieu(ncInf, 'số máy trong dòng INF không phải số');

      // Dòng INM có mã máy thì dùng nó như hãng; mã lạ (không đủ 12 số hex) thì giữ mã ở dòng MAC.
      const macInm = inm ? macTuInm(inm) : '';
      if (macInm) mac = macInm;

      // Bảng mã: enc2 khi enc1 trống hay trùng enc2, không thì enc1; enc2 trống = cân không báo (§4.2).
      const enc1 = ina?.[1] ?? '', enc2 = ina?.[2] ?? '';
      const maHoa = enc2 === '' ? '' : (enc1 === '' || enc1 === enc2 ? enc2 : enc1);

      this.modelTho = inf[4];
      const tu = inf[4].split(' ');
      this.phienBanTho = tu.length <= 1 ? '' : tu[tu.length - 1];
      this.thongTin = {
        mac, cuaHang: chuTuByte(inf[1]), tenMay: chuTuByte(inf[2]), soMay: parseInt(inf[3], 10),
        model: chuTuByte(inf[4]), phienBan: chuTuByte(this.phienBanTho), maHoa: chuTuByte(maHoa),
      };
    });
  }

  // ---- đọc (§5.9) -----------------------------------------------------------
  /** Một phần, sau khi đã gửi UPL <ten>. LAB: sau mỗi dòng LAB đọc LAS tới LAE (§5.9). */
  private async docMotPhan(ten: PhanDoc, nc: NguCanh): Promise<string[]> {
    const ra: string[] = [];
    let trongTem = false;
    for (;;) {
      const d = await this.docDong(nc);
      const f0 = truong0(d);
      if (trongTem) {
        if (f0 === 'LAS') ra.push(d);
        else if (f0 === 'LAE') { ra.push(d); trongTem = false; }
        // Hãng bỏ qua END ở đây và chờ LAE tới hết giờ; báo ngay cho rõ.
        else if (f0 === 'END') throw loiDuLieu(nc, 'một mẫu tem thiếu dòng kết thúc LAE');
        continue;
      }
      if (f0 === 'END') return ra;
      if (f0 === ten) { ra.push(d); if (ten === 'LAB') trongTem = true; }
      // Dòng khác (kể cả DWL bọc ngoài nếu cân có gửi) bỏ qua như hãng.
    }
  }

  /** Như "Upload data" của hãng: một dòng trống, rồi mỗi phần UPL <phần> … UPL END. */
  docCacPhan(ds: PhanDoc[]): Promise<string[][]> {
    for (const ten of ds) {
      if (!THU_TU_DOC.includes(ten) && ten !== 'SAL') return Promise.reject(loiChan(`không có phần ${String(ten)} để đọc`));
    }
    const viec = ds.length === 1 ? `đọc ${TEN_PHAN[ds[0]]}` : 'đọc dữ liệu từ cân';
    return this.lam({ viec, ghi: false }, async () => {
      await this.gui(XD, { viec, ghi: false });
      const ra: string[][] = [];
      for (const ten of ds) {
        const nc: NguCanh = { viec: `đọc ${TEN_PHAN[ten]}`, ghi: false };
        await this.gui(`UPL\t${ten}\t` + XD, nc);
        ra.push(await this.docMotPhan(ten, nc));
        await this.gui('UPL\tEND\t' + XD, nc);
      }
      return ra;
    });
  }

  async docPhan(ten: PhanDoc): Promise<string[]> {
    return (await this.docCacPhan([ten]))[0];
  }

  /**
   * Nhật ký bán (§5.10), vòng kiểm của hãng: hỏi, đọc tới END, đáp UPL END; nhận
   * khi lần này y hệt lần trước, hoặc lần này có thêm dòng bán ở cuối (có người
   * vừa bán) — khi đó lấy lần TRƯỚC. Trả lời rỗng nhận ngay. 11 lần vẫn không
   * khớp thì báo lỗi. CHƯA THỬ TRÊN CÂN THẬT.
   */
  async docBaoCao(tuFid: number): Promise<string[]> {
    const yc = yeuCauBaoCao(this.modelTho, tuFid);
    const nc: NguCanh = { viec: 'đọc nhật ký bán', ghi: false };
    return this.lam(nc, async () => {
      await this.gui(XD, nc);
      let truoc: string[] = [], chuoiTruoc = '', soTruoc = 0, lanLai = 0;
      for (;;) {
        await this.gui(yc + XD, nc);
        const nay = await this.docToiEnd(nc);
        await this.gui('UPL\tEND\t' + XD, nc);
        let so = 0;
        for (const d of nay) {
          const f0 = truong0(d), n = d.split('\t').length;
          if (f0 === 'RES') { so++; if (n < 18) throw loiDuLieu(nc, 'dòng hàng bán (RES) thiếu cột'); }
          if (f0 === 'REP' && n < 10) throw loiDuLieu(nc, 'dòng giao dịch (REP) thiếu cột');
        }
        const chuoi = nay.map(d => d + XD).join('');
        if ((so === soTruoc && chuoi === chuoiTruoc) || (so > soTruoc && soTruoc > 0 && chuoi.startsWith(chuoiTruoc))) break;
        truoc = nay; chuoiTruoc = chuoi; soTruoc = so;
        if (++lanLai > SO_LAN_DOC_LAI_BAO_CAO) {
          throw loiDuLieu(nc, `đọc ${lanLai} lần mà hai lần liền nhau không khớp (cân đang bán liên tục hay dữ liệu hỏng) — đọc lại sau ít phút`);
        }
        await new Promise(r => setTimeout(r, lanLai * this.tg.nghiBaoCaoMs));
      }
      await this.gui('UPL\tEND\t' + XD, nc);
      return truoc;
    });
  }

  async docGio(choMs?: number): Promise<GioCan> {
    const nc: NguCanh = { viec: 'đọc giờ cân', ghi: false };
    const ms = choMs !== undefined && choMs > 0 ? Math.min(choMs, this.tg.choMs) : this.tg.choMs;
    return this.lam(nc, async () => {
      await this.gui(XD + 'UPL\tTIM\t' + XD, nc);
      const { gio } = await this.docHangRao(nc, ms);
      await this.gui('UPL\tEND\t' + XD, nc);
      if (!gio) throw loiDuLieu(nc, 'dòng giờ (TIM) không đọc được');
      return gio;
    });
  }

  // ---- ghi (§5.8) -----------------------------------------------------------
  /** Gửi CRLF + các dòng + CRLF + UPL TIM trong một lần, chờ hàng rào, đáp UPL END. */
  private ghiVaChoHangRao(dong: string[], nc: NguCanh): Promise<{ gio: GioCan | null }> {
    return this.lam(nc, async () => {
      const than = XD + dong.map(d => d + XD).join('') + XD + 'UPL\tTIM\t' + XD;
      await this.gui(than, nc);
      // Qua dây: hàng rào chỉ tới sau khi dây đẩy hết các dòng vừa gửi.
      const kq = await this.docHangRao(nc, this.tg.choHangRaoMs + msQuaDay(than.length, this.tg.baud));
      await this.gui('UPL\tEND\t' + XD, nc);
      return kq;
    });
  }

  private kiemMaHoa(): void {
    const m = this.thongTin.maHoa;
    if (m && !laUtf8(m)) throw loiChan(`cân dùng bảng mã ${m}, chương trình chỉ ghi chữ UTF-8 — dùng USB hoặc phần mềm của hãng`);
  }

  /**
   * Ghi các khối DWL/CLR…END (đã kiểm bằng kiemKhoiGhi) rồi chờ hàng rào. Xong
   * nghĩa là cân đã đọc hết dòng gửi và trả lời UPL TIM sau đó — KHÔNG kiểm nội
   * dung; muốn chắc thì đọc lại bằng docPhan. CHƯA THỬ TRÊN CÂN THẬT.
   */
  async ghi(dong: string[]): Promise<void> {
    kiemKhoiGhi(dong);
    this.kiemMaHoa();
    const coXoa = dong.some(d => d.startsWith('CLR\t') && d !== 'CLR\tEND\t');
    await this.ghiVaChoHangRao(dong, { viec: 'chờ cân lưu dữ liệu vừa gửi', ghi: true, coXoa });
  }

  /**
   * Đặt giờ cân (§5.3). Hãng gửi rồi thôi; ở đây chờ hàng rào và so giờ cân trả
   * trong hàng rào với giờ vừa đặt — lệch quá 2 phút là cân chưa nhận. CHƯA THỬ
   * TRÊN CÂN THẬT.
   */
  async datGio(luc: GioCan): Promise<void> {
    const khoi = khoiTim(luc);
    const batDau = Date.now();
    const { gio } = await this.ghiVaChoHangRao(khoi, { viec: 'đặt giờ cân', ghi: true });
    if (!gio) throw this.theoDuong(new LoiGiaoThuc(`Đã gửi giờ mới nhưng cân không trả giờ để kiểm lại. Xem giờ trên cân. ${LUI_GHI}`, 'sai-du-lieu', true));
    if (Math.abs(msCua(gio) - (msCua(luc) + (Date.now() - batDau))) > LECH_GIO_TOI_DA_MS) {
      throw this.theoDuong(new LoiGiaoThuc(`Đã gửi giờ ${hienGio(luc)} nhưng cân vẫn báo ${hienGio(gio)} — cân chưa nhận giờ mới. Đặt giờ trên cân bằng tay. ${CHUA_THU}`, 'sai-du-lieu', true));
    }
  }

  dong(): void {
    if (this.daDong) return;
    this.daDong = true;
    // end: gửi nốt byte còn đợi rồi mới đóng; cân không đóng theo thì huỷ hẳn sau 2 giây.
    this.s.end();
    setTimeout(() => this.s.destroy(), 2000).unref?.();
  }
}

function noi(ip: string, cong: number, tg: ThoiGian, taoSocket?: (ip: string, cong: number) => net.Socket): Promise<net.Socket> {
  const khongNoi = () => new LoiGiaoThuc(
    `Không kết nối được cân ở ${ip} (cổng ${cong}). Cân có đang bật, ở màn hình bán hàng, cùng WiFi với máy tính không? ` +
    `Cân có thể chưa mở cổng hai chiều này. ${DONG_TM_XA} ${LUI_CHUNG}`, 'khong-noi');
  return new Promise((xong, hong) => {
    let s: net.Socket;
    try { s = taoSocket ? taoSocket(ip, cong) : net.createConnection({ host: ip, port: cong }); } catch { hong(khongNoi()); return; }
    if (s.readyState === 'open') { xong(s); return; }
    const hen = setTimeout(() => { s.destroy(); hong(khongNoi()); }, tg.choNoiMs);
    const loi = () => { clearTimeout(hen); s.destroy(); hong(khongNoi()); };
    s.once('error', loi);
    s.once('connect', () => { clearTimeout(hen); s.removeListener('error', loi); xong(s); });
  });
}

function thoiGian(tuy: TuyChonKetNoi, baud: number | null): ThoiGian {
  const choMs = tuy.choMs ?? CHO_MAC_DINH_MS;
  return {
    choMs,
    choNoiMs: tuy.choNoiMs ?? Math.min(CHO_NOI_MAC_DINH_MS, choMs),
    choHangRaoMs: tuy.choHangRaoMs ?? 2 * choMs,
    nghiBaoCaoMs: tuy.nghiBaoCaoMs ?? NGHI_BAO_CAO_MAC_DINH_MS,
    baud,
  };
}

async function moKetNoiNoiBo(ip: string, cong: number, tuy: TuyChonKetNoi): Promise<KetNoi> {
  const tg = thoiGian(tuy, null);
  const s = await noi(ip, cong, tg, tuy.taoSocket);
  const kn = new KetNoi(s, tg, tuy.khiCanBao);
  await kn.batTay();
  return kn;
}

/** 2.10 — cân không trả lời lần hỏi đầu qua dây: 'khong-noi' (chưa gửi gì ngoài câu hỏi), chỉ đúng chỗ cần làm. */
function loiKhongNoiDay(com: string, ms: number): LoiGiaoThuc {
  return new LoiGiaoThuc(`Cân không trả lời qua dây ${com} trong ${giay(ms)} giây — chưa gửi gì xuống cân. `
    + 'Trên cân bấm Prog → 4 → 3 (P43 RS-232) và để cân ở màn hình đó (cân chỉ nghe dây khi ở đây), rồi thử lại. '
    + 'Vẫn không được: rút dây ra cắm lại, bấm Kiểm tra dây ở Cài đặt.', 'khong-noi');
}

/**
 * 2.10 — bắt tay và nói chuyện với cân qua một luồng byte có sẵn: cầu nối dây RS232 (day-rs232.ts `moKetNoiDay`). Cùng
 * mọi việc như moKetNoi (đọc, ghi, xoá, hàng rào, đặt giờ); khác ở bắt tay và thời gian chờ (xem đầu file). `com`: tên
 * cổng cho câu báo; `baud`: tốc độ dây. Bắt tay hỏng thì luồng bị huỷ. Nhớ gọi `dong()` khi xong.
 */
export async function moKetNoiQuaLuong(luong: Duplex, com: string, baud: number, tuy: TuyChonKetNoi = {}): Promise<KetNoiCan> {
  const kn = new KetNoi(luong, thoiGian(tuy, baud), tuy.khiCanBao, com);
  await kn.batTay();
  return kn;
}

/**
 * Nối vào cân và bắt tay như hãng (§3.1, §4): gửi EF BB BF 0D 0A; UPL MAC (dòng MAC
 * 6 số thập phân → mã hex); UPL INF (INF / INA / INM); UPL END. CHƯA THỬ TRÊN CÂN THẬT.
 * Đóng phần mềm TM-xA trước (§9.10). Nhớ gọi `dong()` khi xong.
 */
export function moKetNoi(ip: string, cong: number = CONG_HAI_CHIEU, tuy: TuyChonKetNoi = {}): Promise<KetNoiCan> {
  return moKetNoiNoiBo(ip, cong, tuy);
}

/**
 * Đọc dữ liệu cân qua WiFi (TMS, TMT, SCP, DPT, CLS, PLU, BAR, LAB — thứ tự như
 * hãng) và ghép thành file dạng USB (xem ghepFileUsb) mà docFileCan đọc được. Không
 * có REP, INF, TIM (không bao giờ gửi ngược lại cân). Không có cài đặt mạng: tên /
 * mật khẩu WiFi, tên miền (TMT 15, 16, 19) và thông số mạng (laThongSoMang) bị bỏ —
 * file này thành file gốc, mà file gốc đi xuống cân qua 33571 / USB ở mọi lần gửi
 * sau; giá trị cân trả qua cổng chưa thử này (mật khẩu che, bảng mã khác, thiếu) mà
 * khác cài đặt thật là cân rời WiFi. Khối TMS / TMT thiếu dòng nào thì cân giữ
 * nguyên dòng đó (như trình hướng dẫn của hãng). CHƯA THỬ TRÊN CÂN THẬT.
 */
export async function docTuCan(ip: string, cong: number = CONG_HAI_CHIEU, tuy: TuyChonKetNoi = {}): Promise<{ thongTin: ThongTinCan; du: Uint8Array }> {
  const kn = await moKetNoiNoiBo(ip, cong, tuy);
  try {
    return await docFileTuKetNoi(kn);
  } finally {
    kn.dong();
  }
}

/** Như docTuCan nhưng trên một kết nối đang mở (2.8: kết nối giữ mở — không mở thêm kết nối thứ hai tới cân). */
export async function docFileTuKetNoi(kn: KetNoiCan): Promise<{ thongTin: ThongTinCan; du: Uint8Array }> {
  const doc = await kn.docCacPhan(THU_TU_DOC);
  const phan: Partial<Record<PhanDoc, string[]>> = {};
  THU_TU_DOC.forEach((ten, i) => { phan[ten] = doc[i]; });
  const soCua = (d: string) => { const c = d.split('\t'); return LA_SO_NGUYEN.test(c[1] ?? '') ? parseInt(c[1], 10) : NaN; };
  phan.TMS = phan.TMS?.filter(d => !laThongSoMang(soCua(d)));
  phan.TMT = phan.TMT?.filter(d => !CHU_MANG.has(soCua(d)));
  return { thongTin: kn.thongTin, du: ghepFileUsb(kn.phienBanTho, phan) };
}
