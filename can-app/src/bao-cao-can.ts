/**
 * BEEFTOWN CÂN — NHẬT KÝ BÁN CỦA CÂN (phần REP: dòng REP / RES / REE)
 *
 * Cân TM-A ghi MỖI lần cân thành một giao dịch có số FID tăng dần. Cùng một
 * dạng chữ đi qua mọi đường: phần `DWL REP … END REP` của file USB A_000.TMS,
 * và câu trả lời của lệnh `UPL REP` qua WiFi (cổng 33581, xem giao-thuc.ts).
 * Mỗi giao dịch:
 *
 *   REP  năm(2 số) tháng ngày giờ phút giây FID SID nhân-viên      (đầu giao dịch)
 *   RES  SubID thành-tiền PLU nhóm quầy giá-vốn số-lượng đơn-vị loại thuế
 *        chữ1 chữ2 chữ3 chữ4 đơn-giá FID-liên-quan tên-hàng         (một dòng hàng)
 *   REE                                                              (cuối giao dịch)
 *
 * ĐÃ ĐỐI CHIẾU TRÊN FILE CÂN THẬT của quán (V3.14E8, lưu ra USB tháng 9/2026):
 * FID 2…42 liền nhau, mỗi FID một dòng RES; 1 sự kiện (FID 2, loại 1254 =
 * nâng cấp firmware), 21 dòng Bán (loại 0), 19 dòng "cân chưa in tem" (loại 2 —
 * cân ghi cả lần cân xong mà không in tem vì Spec283 = 1).
 *
 * Quy tắc (đặc tả reports-sales.md, đọc từ mã phần mềm TM-xA của hãng):
 *  · Số ghi "phần-nguyên,số-lẻ" và MỖI số mang số lẻ riêng: "7,2" = 0,07 kg,
 *    "60000,3", cùng cân năm 2024 còn ghi "888,2". Không có dấu phẩy = số nguyên.
 *  · Tiền → đồng: đơn giá theo Spec202, thành tiền theo Spec203:
 *    đồng = phần-nguyên × 10^(Spec − số lẻ) — đúng như giaTuFile() của
 *    can-tma.ts ("16000,3" với 3 số lẻ → 16.000 đ).
 *  · TÊN HÀNG trong dòng RES là tên HIỆN TẠI trong bảng PLU của cân LÚC ĐỌC,
 *    không phải lúc bán (FID 2–6 của cân quán đọc năm 2024 và năm 2026: số
 *    giống hệt, chỉ tên khác). Số lượng, đơn vị, đơn giá, thành tiền là của lúc
 *    bán. Mã cân (ma_can) KHÔNG có trong nhật ký. Vì vậy: đọc nhật ký thường
 *    xuyên (nên đọc ngay TRƯỚC khi gửi giá / hàng mới xuống cân), gắn mã cân theo
 *    bảng PLU lúc đọc, và khi gộp thì giữ bản đọc SỚM nhất (gopNhatKy).
 *  · Số PLU có thể đã được dùng cho hàng khác. nhatKyTuFile chỉ nhận mã cân khi
 *    đơn giá và cách bán (ký / cái) của dòng khớp dòng PLU hiện tại; không khớp
 *    thì để mã trống ('') thay vì trừ nhầm kho. Trên file thật: 12/12 dòng hàng
 *    thường từ lúc nạp danh mục Beeftown (FID 29 trở đi) khớp; trước đó chỉ 4/24
 *    khớp và ít nhất một dòng (năm 2024, loại 2 nên không tính kho) khớp do trùng
 *    giá tình cờ → phép kiểm này giảm chứ không loại hết nhầm lẫn; mã trống hay
 *    dòng cũ vẫn cần người xem lại.
 *  · Chỉ loại 0 (Bán) và 1 (Trả hàng) của dòng hàng (SubID ≥ 1) với PLU thường
 *    (< 9999981) mới tính kho. PLU 9999981–9999999 là PLU hệ thống (cân tạm,
 *    đếm tạm, phí dịch vụ, giảm giá, các kiểu thanh toán).
 *  · Dòng SubID 0: loại ≥ 255 là sự kiện (loại = 256 + mã: 308 = A52,
 *    777–780 = P521–P524, 1254 = E9.98); loại 0/1/10/11 là dòng thanh toán /
 *    giảm giá của cả phiếu. Cả hai vào `suKien`, không phải dòng hàng.
 *
 * CHƯA THỬ TRÊN CÂN THẬT: trả hàng (loại 1 — cân của quán đang tắt, Spec74 = 0;
 * số lượng lấy nguyên dấu như cân gửi, phần mềm hãng cũng làm vậy), dòng thanh
 * toán / giảm giá, đơn vị khác ký và cái, mã hàng ở ô Chữ khi Spec290–293 = 9,
 * FID đếm lại từ đầu sau A52 / P52x / E9.97 (khoá gộp có cả giờ nên không lẫn),
 * đọc qua WiFi (UPL REP).
 *
 * Hàm thuần: không đọc / ghi file, không nối mạng (việc đó ở nghiep-vu.ts).
 * Dòng vào là "chuỗi byte" như docFileCan / giao-thuc.ts trả (mỗi ký tự = 1
 * byte); dòng đã đổi sang chữ cũng đọc được.
 */
import { chuanMa, giaTuFile, tuChuoiByte, type FileCan } from '../../web/src/lib/kho/can-tma.ts';
import { macTuInm } from './giao-thuc.ts';

// -----------------------------------------------------------------------------
// KIỂU DỮ LIỆU
// -----------------------------------------------------------------------------
export interface DongBanCan {
  mac: string;            // MAC của cân, 12 chữ số hex viết hoa ('' nếu không biết)
  fid: number;            // số giao dịch của cân
  luc: string;            // 'YYYY-MM-DD HH:mm:ss' theo đồng hồ của cân
  sid: number;            // số phiếu trong ngày (0 với dòng không phải bán đã xác nhận)
  stt: number;            // SubID — dòng hàng thứ mấy trong giao dịch (≥ 1)
  plu: number;
  ten: string;            // tên LÚC ĐỌC (cân tra bảng PLU hiện tại), không phải lúc bán
  maCan: string;          // '' nếu không biết
  loai: number;
  tenLoai: string;
  tinhKho: boolean;       // chỉ loại 0 bán và 1 trả hàng, không PLU hệ thống ≥ 9999981
  soLuong: number;        // kg hoặc cái, giữ dấu như cân gửi
  theoCai: boolean;
  donGia: number | null;  // đồng, theo Spec202
  thanhTien: number | null; // đồng, theo Spec203
}

export interface SuKienCan { fid: number; luc: string; loai: number; tenLoai: string; ghiChu: string }

/** Dòng PLU trên cân lúc đọc nhật ký — để gắn mã cân có kiểm đơn giá và cách bán. */
export interface PluLucDoc { ma: string; donGia: number | null; theoCai: boolean }

export interface TuyChonNhatKy {
  mac: string;
  /** Spec202: số lẻ của đơn giá. */
  soLeDonGia: number;
  /** Spec203: số lẻ của thành tiền. */
  soLeTien: number;
  /** Số PLU → mã cân, gắn thẳng không kiểm (người gọi tự chịu việc PLU bị dùng lại). */
  maTheoPlu?: Map<number, string>;
  /**
   * Bảng PLU lúc đọc: chỉ nhận mã khi đơn giá và cách bán của dòng khớp. Có bảng
   * này thì bỏ qua maTheoPlu.
   */
  pluLucDoc?: Map<number, PluLucDoc>;
  /**
   * 1…4: ô Chữ nào của dòng RES mang mã hàng (cân đặt Spec290–293 = 9 "Item Code").
   * Ô có mã thì dùng mã đó trước tiên. Chưa thử trên cân thật (cân của quán để 0).
   */
  oMaCan?: number;
}

export interface KetQuaNhatKy { dong: DongBanCan[]; suKien: SuKienCan[]; loi: string[] }

// -----------------------------------------------------------------------------
// DANH MỤC
// -----------------------------------------------------------------------------
/** PLU từ số này trở lên là PLU hệ thống của cân, không phải hàng trong danh mục. */
export const PLU_HE_THONG = 9999981;

export const TEN_PLU_HE_THONG: Record<number, string> = {
  9999999: 'Hàng cân tạm (không gọi PLU)',
  9999998: 'Hàng đếm tạm (không gọi PLU)',
  9999997: 'Phí dịch vụ',
  9999996: 'Giảm giá và làm tròn',
  9999995: 'Trả bằng thẻ',
  9999994: 'Thanh toán kiểu 1',
  9999993: 'Thanh toán kiểu 2',
  9999992: 'Thanh toán kiểu 3',
  9999991: 'Thanh toán tại cửa hàng',
  9999981: 'Alipay',
  9999982: 'WeChat Pay',
  9999983: 'Ví điện tử 2',
  9999984: 'Ví điện tử 3',
  9999985: 'Ví điện tử 4',
  9999986: 'Ví điện tử 5',
  9999987: 'Ví điện tử 6',
  9999988: 'Ví điện tử 7',
};

/**
 * 33 loại dòng nhật ký, theo danh sách "Logs Type Full" của phần mềm hãng.
 * Sự kiện: loại = 256 + mã (308 = A52, 777–780 = P521–P524, 1254 = E9.98).
 * Loại 252–254 do phần mềm máy tính của hãng tự sinh, cân không gửi.
 */
export const TEN_LOAI: Record<number, string> = {
  [-1]: 'Không thao tác',
  0: 'Bán',
  1: 'Trả hàng',
  2: 'Cân chưa in tem',
  3: 'Đã xoá khỏi phiếu',
  4: 'Treo phiếu',
  5: 'Bán chế độ tự động',
  6: 'Dự phòng 06',
  7: 'Dự phòng 07',
  8: 'Dự phòng 08',
  9: 'Dự phòng 09',
  10: 'Nhập kho',
  11: 'Xuất kho',
  12: 'Kiểm kê',
  13: 'Đặt hàng',
  14: 'Hao hụt',
  15: 'Dự phòng 15',
  252: 'Sản xuất (máy tính tự ghi)',
  253: 'Tách thùng — tăng (máy tính tự ghi)',
  254: 'Tách thùng — giảm (máy tính tự ghi)',
  255: 'Lỗi',
  256: 'Lỗi không rõ',
  257: 'Mất số giao dịch (FID)',
  258: 'Trùng số giao dịch (FID)',
  259: 'Khởi động lại bất thường',
  308: 'Xoá toàn bộ báo cáo trên cân (A52)',
  777: 'Khôi phục cài đặt gốc (P521)',
  778: 'Khôi phục cài đặt gốc (P522)',
  779: 'Khôi phục cài đặt gốc (P523)',
  780: 'Khôi phục cài đặt gốc (P524)',
  1249: 'Lỗi E9.93',
  1253: 'Khởi tạo lại bộ nhớ (E9.97)',
  1254: 'Nâng cấp firmware (E9.98)',
};

/** Tên loại; sự kiện chưa có tên hiện theo mã lỗi của cân: 451 → "Sự kiện E1.95". */
export function tenLoai(loai: number): string {
  const ten = TEN_LOAI[loai];
  if (ten) return ten;
  if (loai >= 256) {
    const ma = loai - 256;
    return `Sự kiện E${Math.floor(ma / 100)}.${String(ma % 100).padStart(2, '0')}`;
  }
  return `Loại ${loai}`;
}

// Đơn vị (bảng đơn vị của hãng) → số kg của một đơn vị. 1 = đơn vị cân của hệ
// thống (kg ở Việt Nam), 3 = kg; 2 = cái; từ 20 trở lên phần mềm hãng coi là cái.
// Cân của quán chỉ ghi 2 và 3; các đơn vị khác chưa thử trên cân thật.
const KG_MOT_DON_VI: Record<number, number> = { 1: 1, 3: 1, 4: 0.001, 5: 1000, 6: 0.45359237, 7: 0.5, 8: 0.1, 9: 0.1133980925 };

/** Đơn vị (cột Unit của dòng RES, cột 4 của dòng PLU) là hàng đếm cái? */
export function laTheoCai(donVi: number): boolean {
  return !(donVi in KG_MOT_DON_VI);
}

// -----------------------------------------------------------------------------
// SỐ VÀ CHỮ
// -----------------------------------------------------------------------------
const SO_NGUYEN = /^-?\d+$/;
const nguyen = (s: string | undefined): number | null => (s !== undefined && SO_NGUYEN.test(s) ? parseInt(s, 10) : null);
const khongAmKhong = (x: number): number => (x === 0 ? 0 : x);
const lamTron = (x: number, soLe: number): number => khongAmKhong(Math.round(x * 10 ** soLe) / 10 ** soLe);

/** "7,2" → 0.07 · "9" → 9 · "-6,2" → -0.06. Sai định dạng → null. */
export function soTuFile(tho: string | undefined): number | null {
  const m = /^(-?\d+)(?:,(\d+))?$/.exec(tho ?? '');
  if (!m) return null;
  return khongAmKhong(Number(`${m[1]}e-${m[2] ?? '0'}`));
}

/**
 * Tiền trong nhật ký → đồng, soLe = Spec202 (đơn giá) hoặc Spec203 (thành tiền).
 * Có dấu phẩy thì tính y như giaTuFile(); số không có dấu phẩy là số nguyên.
 */
export function tienTuFile(tho: string | undefined, soLe: number): number | null {
  const t = tho ?? '';
  const v = giaTuFile(SO_NGUYEN.test(t) ? `${t},0` : t, soLe);
  return v === null ? null : khongAmKhong(v);
}

/** Số kiểu Việt: 1234567.5 → "1.234.567,5". coDinh: luôn đủ soLe chữ số lẻ ("0,070"). */
export function soKieuViet(n: number, soLe = 0, coDinh = false): string {
  const s = Math.abs(n).toFixed(soLe);
  const [nguyenChu, leChu = ''] = s.split('.');
  const le = coDinh ? leChu : leChu.replace(/0+$/, '');
  const am = n < 0 && Number(s) !== 0;
  return (am ? '-' : '') + nguyenChu.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (le ? `,${le}` : '');
}

const UTF8_CHAT = new TextDecoder('utf-8', { fatal: true });

/** Chữ trong dòng (chuỗi byte UTF-8, hoặc đã là chữ) → chữ để hiện. "\v" của cân là xuống dòng. */
function docChu(s: string | undefined): string {
  let t = s ?? '';
  if (/[^\x00-\x7f]/.test(t) && !/[^\x00-\xff]/.test(t)) {
    try { t = UTF8_CHAT.decode(tuChuoiByte(t)); } catch { /* không phải UTF-8: coi như đã là chữ */ }
  }
  return t.replace(/[\t\r\n\v\f]+/g, ' ').trim().normalize('NFC');
}

const chuanMac = (mac: string | undefined): string => (mac ?? '').replace(/[^0-9a-f]/gi, '').toUpperCase();
const hai = (n: number) => String(n).padStart(2, '0');

/** Giờ của dòng REP (cột 1–6: năm 2 số, tháng, ngày, giờ, phút, giây) → 'YYYY-MM-DD HH:mm:ss'. */
function lucTuRep(c: string[]): string | null {
  const so = c.slice(1, 7).map(nguyen);
  if (so.some(x => x === null || x < 0)) return null;
  const [nam2, thang, ngay, gio, phut, giay] = so as number[];
  const nam = nam2 < 100 ? 2000 + nam2 : nam2;
  const d = new Date(Date.UTC(nam, thang - 1, ngay, gio, phut, giay));
  if (d.getUTCFullYear() !== nam || d.getUTCMonth() !== thang - 1 || d.getUTCDate() !== ngay
    || d.getUTCHours() !== gio || d.getUTCMinutes() !== phut || d.getUTCSeconds() !== giay) return null;
  return `${nam}-${hai(thang)}-${hai(ngay)} ${hai(gio)}:${hai(phut)}:${hai(giay)}`;
}

// -----------------------------------------------------------------------------
// ĐỌC NHẬT KÝ
// -----------------------------------------------------------------------------
const LOAI_THANH_TOAN = new Set([0, 1, 10, 11]);

function timMaCan(tuy: TuyChonNhatKy, c: string[], plu: number, donGia: number | null, theoCai: boolean): string {
  if (plu <= 0 || plu >= PLU_HE_THONG) return '';
  const o = tuy.oMaCan;
  if (o !== undefined && Number.isInteger(o) && o >= 1 && o <= 4) {
    const ma = chuanMa(docChu(c[10 + o]));
    if (ma) return ma;
  }
  if (tuy.pluLucDoc) {
    const p = tuy.pluLucDoc.get(plu);
    const khop = p !== undefined && p.ma !== '' && p.donGia !== null && donGia !== null
      && p.donGia === donGia && p.theoCai === theoCai;
    return khop ? chuanMa(p.ma) : '';
  }
  return chuanMa(tuy.maTheoPlu?.get(plu));
}

/**
 * Đọc các dòng REP / RES / REE (dòng khác bỏ qua — nên đưa cả file vào cũng
 * được). Dòng hỏng không làm hỏng cả lần đọc: bỏ đúng phần hỏng và ghi vào `loi`
 * (câu tiếng Việt, có số dòng, không chứa tên hàng). Phần mềm hãng thì từ chối
 * cả lần nhập khi gặp một dòng hỏng.
 */
export function docNhatKy(dong: string[], tuy: TuyChonNhatKy): KetQuaNhatKy {
  const mac = chuanMac(tuy.mac);
  const ra: DongBanCan[] = [];
  const suKien: SuKienCan[] = [];
  const loi: string[] = [];
  let dang: { fid: number; luc: string; sid: number; ke: number } | null = null;
  let boQua = false;   // REP hỏng: bỏ các RES theo sau tới REE

  const dongLai = (so: number) => {
    if (dang) loi.push(`Dòng ${so}: giao dịch FID ${dang.fid} thiếu dòng REE (kết thúc) — vẫn nhận các dòng hàng đã đọc được.`);
    dang = null;
    boQua = false;
  };

  for (let i = 0; i < dong.length; i++) {
    const so = i + 1;
    const c = (dong[i] ?? '').replace(/\r$/, '').split('\t');
    if (c[0] === 'REP') {
      dongLai(so);
      if (c.length < 10) { loi.push(`Dòng ${so}: dòng REP thiếu cột (${c.length}/10) — bỏ giao dịch này.`); boQua = true; continue; }
      const luc = lucTuRep(c);
      const fid = nguyen(c[7]);
      if (!luc) { loi.push(`Dòng ${so}: giờ của giao dịch không đọc được — bỏ giao dịch này.`); boQua = true; continue; }
      if (fid === null || fid <= 0) { loi.push(`Dòng ${so}: số giao dịch (FID) "${c[7]}" không hợp lệ — bỏ giao dịch này.`); boQua = true; continue; }
      dang = { fid, luc, sid: nguyen(c[8]) ?? 0, ke: 1 };
    } else if (c[0] === 'RES') {
      if (!dang) {
        if (!boQua) loi.push(`Dòng ${so}: dòng RES không nằm trong giao dịch nào — bỏ qua.`);
        continue;
      }
      const g: { fid: number; luc: string; sid: number; ke: number } = dang;
      if (c.length < 18) { loi.push(`Dòng ${so}: dòng RES thiếu cột (${c.length}/18) — bỏ qua dòng này.`); continue; }
      const stt = nguyen(c[1]), plu = nguyen(c[3]), loai = nguyen(c[9]);
      if (stt === null || stt < 0 || plu === null || loai === null) {
        loi.push(`Dòng ${so}: dòng RES có SubID / PLU / loại không đọc được — bỏ qua dòng này.`);
        continue;
      }
      const thanhTien = tienTuFile(c[2], tuy.soLeTien);
      if (loai >= 255) {
        const chu = [c[11], c[12], c[13], c[14]].map(docChu).filter(Boolean);
        suKien.push({ fid: g.fid, luc: g.luc, loai, tenLoai: tenLoai(loai), ghiChu: chu.join(' · ') });
        continue;
      }
      if (stt === 0) {
        // Dòng của cả phiếu (thanh toán / giảm giá / phí). Chưa thử trên cân thật:
        // cân của quán in tem từng gói, chưa có dòng loại này.
        const ghiChu = LOAI_THANH_TOAN.has(loai)
          ? `${TEN_PLU_HE_THONG[plu] ?? `PLU ${plu}`}: ${thanhTien === null ? '?' : soKieuViet(thanhTien, 3)} đ (dòng của cả phiếu)`
          : `Dòng phụ SubID 0, loại ${loai}: phần mềm của hãng bỏ qua dòng này.`;
        suKien.push({ fid: g.fid, luc: g.luc, loai, tenLoai: tenLoai(loai), ghiChu });
        continue;
      }
      if (stt !== g.ke) loi.push(`Dòng ${so}: FID ${g.fid} có dòng hàng số ${stt}, đáng lẽ là ${g.ke} — vẫn nhận.`);
      g.ke = stt + 1;

      const donVi = nguyen(c[8]);
      if (donVi === null || (donVi !== 2 && donVi < 20 && !(donVi in KG_MOT_DON_VI))) {
        loi.push(`Dòng ${so}: đơn vị "${c[8]}" lạ — coi là hàng đếm cái.`);
      }
      const theoCai = laTheoCai(donVi ?? 2);
      const sl = soTuFile(c[7]);
      if (sl === null) loi.push(`Dòng ${so}: số lượng "${c[7]}" không đọc được — ghi 0.`);
      const heSo = theoCai ? 1 : KG_MOT_DON_VI[donVi as number];
      const soLuong = heSo === 1 ? (sl ?? 0) : lamTron((sl ?? 0) * heSo, 6);
      const donGia = tienTuFile(c[15], tuy.soLeDonGia);
      ra.push({
        mac, fid: g.fid, luc: g.luc, sid: g.sid, stt, plu,
        ten: docChu(c[17]),
        maCan: timMaCan(tuy, c, plu, donGia, theoCai),
        loai, tenLoai: tenLoai(loai),
        tinhKho: (loai === 0 || loai === 1) && plu > 0 && plu < PLU_HE_THONG,
        soLuong, theoCai, donGia, thanhTien,
      });
    } else if (c[0] === 'REE') {
      dang = null;
      boQua = false;
    } else if (c[0] === 'END') {
      dongLai(so);
    }
  }
  if (dang) loi.push(`Giao dịch FID ${(dang as { fid: number }).fid} thiếu dòng REE — nhật ký có thể bị cắt giữa chừng.`);
  return { dong: ra, suKien, loi };
}

// -----------------------------------------------------------------------------
// THÔNG SỐ, BẢNG PLU, MAC — lấy từ file USB hoặc từ các dòng đọc qua WiFi
// -----------------------------------------------------------------------------
/**
 * Số lẻ tiền và ô mã hàng từ các dòng TMS (nhiều khối TMS thì dòng sau thắng).
 * Không có thì 3 — như cân của quán (Spec202 = 203 = 3).
 */
export function tuyChonTuThongSo(dong: string[]): { soLeDonGia: number; soLeTien: number; oMaCan?: number } {
  const spec = new Map<number, string>();
  for (const d of dong) {
    const c = d.replace(/\r$/, '').split('\t');
    if (c[0] !== 'TMS' || c.length < 3) continue;
    const id = nguyen(c[1]);
    if (id !== null) spec.set(id, c[2]);
  }
  const soLe = (id: number) => { const v = spec.get(id); return v !== undefined && /^\d$/.test(v) ? parseInt(v, 10) : null; };
  const ra: { soLeDonGia: number; soLeTien: number; oMaCan?: number } = {
    soLeDonGia: soLe(202) ?? soLe(203) ?? 3,
    soLeTien: soLe(203) ?? soLe(202) ?? 3,
  };
  for (let id = 290; id <= 293; id++) if (spec.get(id) === '9') { ra.oMaCan = id - 289; break; }
  return ra;
}

/** Bảng PLU lúc đọc từ các dòng "PLU\t…" (file USB hoặc UPL PLU qua WiFi). Trùng số thì dòng sau thắng. */
export function pluLucDocTuDong(dong: string[], soLeDonGia: number): Map<number, PluLucDoc> {
  const m = new Map<number, PluLucDoc>();
  for (const d of dong) {
    const c = d.replace(/\r$/, '').split('\t');
    if (c[0] !== 'PLU') continue;
    const so = nguyen(c[1]);
    if (so === null || so <= 0) continue;
    m.set(so, { ma: chuanMa(c[2]), donGia: tienTuFile(c[5], soLeDonGia), theoCai: laTheoCai(nguyen(c[4]) ?? 1) });
  }
  return m;
}

/**
 * MAC trong dòng INM của file USB ('' nếu không có): cột 2 như đường WiFi (macTuInm — một giao dịch đọc qua hai
 * đường phải cùng khoá, không thì doanh số bị cộng đôi); cột 2 không dùng được thì mới lấy cột 1.
 */
export function macTuDong(dong: string[]): string {
  for (const d of dong) {
    const c = d.split('\t');
    if (c[0] !== 'INM') continue;
    const m = macTuInm(c) || (/^[0-9A-Fa-f]{12}$/.test(c[1] ?? '') ? c[1].toUpperCase() : '');
    if (m) return m;
  }
  return '';
}

/**
 * Nhật ký bán trong file USB của cân. MAC lấy từ dòng INM nếu không truyền;
 * số lẻ từ Spec202/203; mã cân theo bảng PLU cùng file, có kiểm đơn giá và cách
 * bán (xem đầu file).
 */
export function nhatKyTuFile(f: FileCan, mac?: string): KetQuaNhatKy {
  const ts = tuyChonTuThongSo(f.dong);
  const may = chuanMac(mac ?? macTuDong(f.dong));
  const kq = docNhatKy(f.dong, { mac: may, ...ts, pluLucDoc: pluLucDocTuDong(f.plu.map(p => p.tho), ts.soLeDonGia) });
  const dau: string[] = [];
  if (!may) dau.push('Không đọc được địa chỉ MAC của cân (dòng INM) — nhật ký của hai cân có thể bị lẫn khi gộp.');
  if (!f.dong.some(d => d.startsWith('REP\t'))) {
    dau.push('File không có nhật ký bán (phần REP). Trên cân lưu ra USB bằng [Amend] (lưu toàn bộ) để có nhật ký.');
  }
  return { ...kq, loi: [...dau, ...kq.loi] };
}

// -----------------------------------------------------------------------------
// GỘP VÀ LƯU (nhat-ky-can.tsv)
// -----------------------------------------------------------------------------
/** Khoá một dòng nhật ký: MAC + FID + giờ + SubID (gopNhatKy; nghiep-vu đếm dòng mới theo khoá này). */
export const khoa = (d: DongBanCan) => `${d.mac}\t${d.fid}\t${d.luc}\t${d.stt}`;
const truocSau = (a: DongBanCan, b: DongBanCan) =>
  (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : 0) || (a.mac < b.mac ? -1 : a.mac > b.mac ? 1 : 0) || a.fid - b.fid || a.stt - b.stt;

/**
 * Gộp nhật ký đã lưu với lần đọc mới. Khoá = MAC + FID + giờ + SubID (có giờ
 * nên FID đếm lại từ đầu vẫn không lẫn). Trùng khoá thì giữ bản CŨ: tên và mã
 * cân của lần đọc sớm hơn gần lúc bán hơn. Xếp theo giờ.
 */
export function gopNhatKy(cu: DongBanCan[], moi: DongBanCan[]): DongBanCan[] {
  const m = new Map<string, DongBanCan>();
  for (const d of [...cu, ...moi]) if (!m.has(khoa(d))) m.set(khoa(d), d);
  return [...m.values()].sort(truocSau);
}

const COT_KHO = ['mac', 'fid', 'luc', 'sid', 'stt', 'plu', 'ten', 'maCan', 'loai', 'tenLoai', 'tinhKho', 'soLuong', 'theoCai', 'donGia', 'thanhTien'] as const;
type CotKho = typeof COT_KHO[number];

/** Nhật ký → TSV UTF-8 (không BOM), dòng đầu là tiêu đề, xuống dòng CRLF. */
export function ghiKhoNhatKy(ds: DongBanCan[]): string {
  const o = (d: DongBanCan, k: CotKho): string => {
    const v = d[k];
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? '1' : '0';
    return String(v).replace(/[\t\r\n\v\f]+/g, ' ');
  };
  return [COT_KHO.join('\t'), ...ds.map(d => COT_KHO.map(k => o(d, k)).join('\t'))].join('\r\n') + '\r\n';
}

/** Đọc lại nhat-ky-can.tsv. Dòng hỏng bỏ qua; thiếu tiêu đề thì hiểu theo thứ tự cột của ghiKhoNhatKy. */
export function docKhoNhatKy(chu: string): DongBanCan[] {
  const dong = chu.replace(/^﻿/, '').split(/\r?\n/);
  let viTri = new Map<string, number>(COT_KHO.map((k, i) => [k, i]));
  let batDau = 0;
  while (batDau < dong.length && dong[batDau].trim() === '') batDau++;
  if (batDau < dong.length) {
    const tieuDe = dong[batDau].split('\t');
    if (tieuDe.includes('fid') && tieuDe.includes('luc')) {
      viTri = new Map(tieuDe.map((k, i) => [k.trim(), i] as [string, number]));
      batDau++;
    }
  }
  const so = (s: string | undefined): number | null => (s !== undefined && s.trim() !== '' && Number.isFinite(Number(s)) ? Number(s) : null);
  const co = (s: string | undefined): boolean | null => (s === '1' ? true : s === '0' ? false : null);
  const ra: DongBanCan[] = [];
  for (let i = batDau; i < dong.length; i++) {
    if (dong[i].trim() === '') continue;
    const c = dong[i].split('\t');
    const lay = (k: CotKho): string | undefined => { const j = viTri.get(k); return j === undefined ? undefined : c[j]; };
    const fid = nguyen(lay('fid')), stt = nguyen(lay('stt')), plu = nguyen(lay('plu')), loai = nguyen(lay('loai'));
    const luc = lay('luc') ?? '';
    const soLuong = so(lay('soLuong'));
    if (fid === null || fid <= 0 || stt === null || stt < 0 || plu === null || loai === null || soLuong === null
      || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(luc)) continue;
    const donGiaChu = lay('donGia'), tienChu = lay('thanhTien');
    ra.push({
      mac: chuanMac(lay('mac')), fid, luc, sid: nguyen(lay('sid')) ?? 0, stt, plu,
      ten: lay('ten') ?? '', maCan: chuanMa(lay('maCan')),
      loai, tenLoai: lay('tenLoai') || tenLoai(loai),
      tinhKho: co(lay('tinhKho')) ?? ((loai === 0 || loai === 1) && plu > 0 && plu < PLU_HE_THONG),
      soLuong, theoCai: co(lay('theoCai')) ?? false,
      donGia: donGiaChu === undefined || donGiaChu === '' ? null : so(donGiaChu),
      thanhTien: tienChu === undefined || tienChu === '' ? null : so(tienChu),
    });
  }
  return ra;
}

// -----------------------------------------------------------------------------
// TÓM TẮT
// -----------------------------------------------------------------------------
export interface TongNhatKy { soGoi: number; kg: number; cai: number; tien: number }
export interface TomTatNhatKy {
  /** Chỉ dòng tính kho (bán trừ trả hàng). */
  tong: TongNhatKy;
  theoNgay: ({ ngay: string } & TongNhatKy)[];
  /** Theo mã cân; dòng chưa rõ mã gom theo PLU + tên lúc đọc. Nhiều tiền xếp trước. */
  theoHang: ({ maCan: string; plu: number; ten: string } & TongNhatKy)[];
  /** Số lần cân xong mà không in tem (loại 2) trong khoảng ngày. */
  chuaIn: number;
  /** Số dòng tính kho chưa rõ mã cân. */
  khongRoMa: number;
}

/**
 * Tóm tắt từ ngày `tu` tới ngày `den` (YYYY-MM-DD, tính cả hai đầu; '' = không
 * giới hạn), theo ngày trên đồng hồ của cân. Bán cộng một gói, trả hàng trừ một
 * gói; kg / cái / tiền cộng đúng dấu cân gửi (trả hàng chưa thử trên cân thật).
 */
export function tomTatNhatKy(ds: DongBanCan[], tu: string, den: string): TomTatNhatKy {
  const moi = (): TongNhatKy => ({ soGoi: 0, kg: 0, cai: 0, tien: 0 });
  const cong = (t: TongNhatKy, d: DongBanCan) => {
    t.soGoi += d.loai === 1 ? -1 : 1;
    if (d.theoCai) t.cai += d.soLuong; else t.kg += d.soLuong;
    t.tien += d.thanhTien ?? 0;
  };
  const tron = <T extends TongNhatKy>(t: T): T => ({ ...t, kg: lamTron(t.kg, 3), cai: lamTron(t.cai, 3), tien: lamTron(t.tien, 0) });

  const tong = moi();
  const ngay = new Map<string, { ngay: string } & TongNhatKy>();
  const hang = new Map<string, { maCan: string; plu: number; ten: string; luc: string } & TongNhatKy>();
  let chuaIn = 0, khongRoMa = 0;
  for (const d of ds) {
    const n = d.luc.slice(0, 10);
    if ((tu && n < tu) || (den && n > den)) continue;
    if (d.loai === 2) chuaIn++;
    if (!d.tinhKho) continue;
    if (!d.maCan) khongRoMa++;
    cong(tong, d);
    const a = ngay.get(n) ?? { ngay: n, ...moi() };
    cong(a, d);
    ngay.set(n, a);
    const k = d.maCan ? `ma:${d.maCan}` : `plu:${d.plu}:${d.ten}`;
    const h = hang.get(k) ?? { maCan: d.maCan, plu: d.plu, ten: d.ten, luc: d.luc, ...moi() };
    if (d.luc >= h.luc) { h.plu = d.plu; h.ten = d.ten; h.luc = d.luc; }   // tên, PLU của lần bán gần nhất
    cong(h, d);
    hang.set(k, h);
  }
  return {
    tong: tron(tong),
    theoNgay: [...ngay.values()].sort((a, b) => (a.ngay < b.ngay ? -1 : 1)).map(tron),
    theoHang: [...hang.values()]
      .map(({ luc: _luc, ...h }) => tron(h))
      .sort((a, b) => b.tien - a.tien || b.kg - a.kg || (a.maCan || '~').localeCompare(b.maCan || '~') || a.plu - b.plu),
    chuaIn,
    khongRoMa,
  };
}

// -----------------------------------------------------------------------------
// CSV CHO EXCEL
// -----------------------------------------------------------------------------
/** Vì sao dòng không tính kho, hay cần xem lại ('' nếu không có gì cần nói). */
export function ghiChuDong(d: DongBanCan): string {
  if (d.loai === 2) return 'Không tính kho: cân xong nhưng chưa in tem (cân ghi lại vì Spec283 = 1).';
  if (d.loai === 3) return 'Không tính kho: đã xoá khỏi phiếu trên cân.';
  if ((d.loai === 0 || d.loai === 1) && d.plu >= PLU_HE_THONG) {
    const ten = TEN_PLU_HE_THONG[d.plu];
    return `Không tính kho: PLU hệ thống ${d.plu}${ten ? ` — ${ten}` : ''}, không phải hàng trong danh mục.`;
  }
  if (!d.tinhKho) return `Không tính kho: ${d.tenLoai}.`;
  const ghi: string[] = [];
  if (d.loai === 1) ghi.push('Trả hàng: cộng lại kho theo số lượng cân gửi (chưa thử trên cân thật).');
  if (!d.maCan) ghi.push('Chưa rõ mã cân: số PLU này nay là hàng khác hoặc đã đổi giá — xem lại trước khi trừ kho.');
  return ghi.join(' ');
}

const TIEU_DE_CSV = ['Ngày giờ (giờ cân)', 'Máy cân (MAC)', 'Số giao dịch (FID)', 'Số phiếu trong ngày (SID)', 'Dòng',
  'PLU', 'Mã cân', 'Tên hàng (lúc đọc nhật ký)', 'Loại', 'Mã loại', 'Tính kho', 'Số lượng', 'Đơn vị',
  'Đơn giá (đ)', 'Thành tiền (đ)', 'Ghi chú'];

/** Ô CSV: bọc ngoặc kép khi có ; " hay xuống dòng. */
function oCsv(v: string): string {
  return /[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Chữ do người gõ (tên hàng): chặn Excel hiểu thành công thức khi mở file. */
const chuAnToan = (t: string) => (/^[=+\-@]/.test(t) ? `'${t}` : t);

/**
 * Nhật ký → CSV cho Excel: UTF-8 có BOM, dấu ; ngăn cột, CRLF, tiêu đề tiếng
 * Việt, ngày dd/mm/yyyy HH:mm:ss, số kiểu Việt (chấm ngăn nghìn, phẩy thập
 * phân: "0,070" kg, "845.000" đ). Mỗi dòng hàng một hàng; cột Ghi chú nói rõ
 * dòng nào không tính kho và vì sao.
 */
export function sangCsv(ds: DongBanCan[]): string {
  const ngayGio = (luc: string) => `${luc.slice(8, 10)}/${luc.slice(5, 7)}/${luc.slice(0, 4)} ${luc.slice(11)}`;
  const tien = (v: number | null) => (v === null ? '' : soKieuViet(v, 3));
  const hang = ds.map(d => [
    ngayGio(d.luc), d.mac, String(d.fid), String(d.sid), String(d.stt),
    String(d.plu), d.maCan, chuAnToan(d.ten), d.tenLoai, String(d.loai), d.tinhKho ? 'Có' : 'Không',
    d.theoCai ? soKieuViet(d.soLuong, 3) : soKieuViet(d.soLuong, 3, true), d.theoCai ? 'cái' : 'kg',
    tien(d.donGia), tien(d.thanhTien), ghiChuDong(d),
  ].map(oCsv).join(';'));
  return '﻿' + [TIEU_DE_CSV.map(oCsv).join(';'), ...hang].join('\r\n') + '\r\n';
}
