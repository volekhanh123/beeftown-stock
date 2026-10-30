// Đặt và trả tiền trước qua máy chủ đơn của Beeftown (thư mục may-chu-don/ của repo, đợt 2b): soạn thân đơn, gửi
// đơn, đọc trạng thái, chọn màn hiện cho khách, giữ đơn vừa đặt trên máy.
// File này không dùng React hay Zalo để chạy kiểm tra được bằng node (npm run kiem-tra), và để kiểm thử của máy chủ
// đơn gọi thẳng (may-chu-don/test/thu.ts: Mini App gửi đúng dạng máy chủ nhận, đọc đúng thứ máy chủ trả).
//
// Không bao giờ báo "quán đã nhận tiền" khi chưa đọc được điều đó từ máy chủ: mất mạng, hết giờ, máy chủ trả lỗi
// hay dữ liệu lạ đều ra "khong-ro" — màn đang hiện giữ nguyên và app hỏi lại.

import type { ThongTinNhan } from "./don";

export type TrangThaiDon =
  | "cho_thanh_toan"
  | "het_han"
  | "da_thanh_toan"
  | "dang_soan"
  | "cho_lay"
  | "da_giao"
  | "can_hoan_tien"
  | "da_hoan_tien";

const TRANG_THAI = new Set<string>([
  "cho_thanh_toan",
  "het_han",
  "da_thanh_toan",
  "dang_soan",
  "cho_lay",
  "da_giao",
  "can_hoan_tien",
  "da_hoan_tien",
]);

export interface ThanhToanCo {
  traDuoc: true;
  nganHang: string;
  soTaiKhoan: string;
  tenTaiKhoan: string;
  /** Số tiền còn phải chuyển (đồng). */
  soTien: number;
  /** "BT" + mã đơn. */
  noiDung: string;
  /** Chuỗi VietQR máy chủ dựng — app vẽ mã QR từ chuỗi này. */
  chuoiQr: string;
  hetHanLuc: number;
}
export type LyDoChuaTra = "chua_co_tai_khoan" | "gia_thu" | "khong_cho_tra" | "tam_loi";
export type ThanhToan = ThanhToanCo | { traDuoc: false; lyDo: LyDoChuaTra };

export interface DonTraTruoc {
  ma: string;
  soTrongNgay: number;
  trangThai: TrangThaiDon;
  tongTien: number;
  /** Tiền quán đã nhận cho đơn (câu trả lời của POST /api/don không có: 0). */
  daNhan: number;
  /** yyyy-mm-dd; câu trả lời của POST /api/don không có: null. */
  ngayNhan: string | null;
  /** HH:mm */
  gioNhan: string | null;
  thanhToan: ThanhToan;
}

/** Dạng POST /api/don của máy chủ đơn (may-chu-don/src/tao-don.ts, kiemDon). */
export interface ThanDon {
  maGui: string;
  khay: Record<string, number>;
  cachNhan: "tai-quan";
  ngay: string;
  gio: string;
  ten: string;
  dienThoai: string;
  ghiChu: string;
}

/** Thân đơn gửi lên: chỉ mã phần thịt và số khay — máy chủ tự tính tiền theo bảng giá, không tin giá app gửi. */
export function taoThanDon(maGui: string, soKhay: Record<string, number>, nhan: ThongTinNhan): ThanDon {
  const khay: Record<string, number> = {};
  for (const [ma, so] of Object.entries(soKhay)) if (so > 0) khay[ma] = so;
  return {
    maGui,
    khay,
    cachNhan: "tai-quan",
    ngay: nhan.ngay,
    gio: nhan.gio,
    ten: nhan.ten.trim(),
    dienThoai: nhan.dienThoai.trim(),
    ghiChu: nhan.ghiChu.trim(),
  };
}

/** Dấu của nội dung đơn (không gồm mã gửi): nội dung còn y nguyên thì gửi lại cùng mã gửi. */
export function dauNoiDung(soKhay: Record<string, number>, nhan: ThongTinNhan): string {
  return JSON.stringify(taoThanDon("", soKhay, nhan));
}

const CHU_MA_GUI = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Mã gửi 24 ký tự cho một nội dung đơn. Bấm đúp, mạng chập chờn rồi gửi lại cùng mã: máy chủ trả lại đúng đơn
 * đã ghi, không ra hai đơn (may-chu-don/src/so-don.ts, taoDon theo maGui).
 */
export function taoMaGui(
  ngauNhien: (n: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n)),
): string {
  return Array.from(ngauNhien(24), (b) => CHU_MA_GUI[b % CHU_MA_GUI.length]).join("");
}

/** Kiểm thêm của đơn trả trước (kiemTraDon của don.ts đã kiểm giỏ, giờ nhận, dạng số điện thoại). */
export function kiemTraTraTruoc(nhan: ThongTinNhan, phanVuaHet: string[], phanChuaGia: string[]): string[] {
  const loi: string[] = [];
  for (const ten of phanVuaHet) loi.push(`${ten} vừa hết ở quầy. Bớt phần này rồi gửi lại.`);
  for (const ten of phanChuaGia) loi.push(`${ten} chưa có giá, chưa đặt trả trước được.`);
  if (nhan.ten.trim().length < 2) loi.push("Nhập tên người nhận để quầy gọi khi bạn tới lấy.");
  if (!nhan.dienThoai.trim()) loi.push("Nhập số điện thoại để quán liên hệ khi cần.");
  return loi;
}

// ---------- Đọc câu trả lời của máy chủ ----------

const laSoNguyen = (v: unknown, nhoNhat: number): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= nhoNhat;
const laChu = (v: unknown, toiDa: number): v is string => typeof v === "string" && v.length > 0 && v.length <= toiDa;
const LY_DO = new Set<string>(["chua_co_tai_khoan", "gia_thu", "khong_cho_tra", "tam_loi"]);

function docThanhToan(v: unknown): ThanhToan {
  const t = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  if (t.traDuoc === true) {
    if (
      laChu(t.nganHang, 60) &&
      typeof t.soTaiKhoan === "string" &&
      /^\d{6,19}$/.test(t.soTaiKhoan) &&
      laChu(t.tenTaiKhoan, 100) &&
      laSoNguyen(t.soTien, 1) &&
      typeof t.noiDung === "string" &&
      /^[A-Z0-9]{1,25}$/.test(t.noiDung) &&
      typeof t.chuoiQr === "string" &&
      /^000201[0-9A-Za-z .:/_-]{20,500}$/.test(t.chuoiQr) &&
      laSoNguyen(t.hetHanLuc, 1)
    ) {
      return {
        traDuoc: true,
        nganHang: t.nganHang,
        soTaiKhoan: t.soTaiKhoan,
        tenTaiKhoan: t.tenTaiKhoan,
        soTien: t.soTien,
        noiDung: t.noiDung,
        chuoiQr: t.chuoiQr,
        hetHanLuc: t.hetHanLuc,
      };
    }
    return { traDuoc: false, lyDo: "tam_loi" };
  }
  return {
    traDuoc: false,
    lyDo: typeof t.lyDo === "string" && LY_DO.has(t.lyDo) ? (t.lyDo as LyDoChuaTra) : "tam_loi",
  };
}

/** JSON của máy chủ → DonTraTruoc, hoặc null khi thiếu trường hay sai kiểu (không bao giờ ném lỗi). */
export function docDonTuJson(v: unknown): DonTraTruoc | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const b = v as Record<string, unknown>;
  if (typeof b.ma !== "string" || !/^[A-Z0-9]{8}$/.test(b.ma)) return null;
  if (!laSoNguyen(b.soTrongNgay, 1) || !laSoNguyen(b.tongTien, 1)) return null;
  if (typeof b.trangThai !== "string" || !TRANG_THAI.has(b.trangThai)) return null;
  if (b.daNhan !== undefined && !laSoNguyen(b.daNhan, 0)) return null;
  const ngay = typeof b.ngayNhan === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.ngayNhan) ? b.ngayNhan : null;
  const gio = typeof b.gioNhan === "string" && /^\d{2}:\d{2}$/.test(b.gioNhan) ? b.gioNhan : null;
  return {
    ma: b.ma,
    soTrongNgay: b.soTrongNgay,
    trangThai: b.trangThai as TrangThaiDon,
    tongTien: b.tongTien,
    daNhan: (b.daNhan as number | undefined) ?? 0,
    ngayNhan: ngay,
    gioNhan: gio,
    thanhToan: docThanhToan(b.thanhToan),
  };
}

function docLoi(v: unknown): string[] {
  const loi = (v as { loi?: unknown } | null)?.loi;
  return Array.isArray(loi) ? loi.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, 10) : [];
}

// ---------- Gọi máy chủ ----------

/** fetch tối thiểu mà guiDonLenMayChu / docDonTuMayChu cần — để kiểm tra truyền fetch giả. */
export type HamFetchApi = (
  url: string,
  init: {
    method: "GET" | "POST";
    headers?: Record<string, string>;
    body?: string;
    signal: AbortSignal;
    cache: "no-store";
  },
) => Promise<{ status: number; json(): Promise<unknown> }>;

/** Gọi và đọc thân JSON; hết giờ bao cả lúc chờ trả lời lẫn lúc đọc thân. Lỗi mạng, hết giờ: ném lỗi. */
async function goi(
  hamFetch: HamFetchApi,
  url: string,
  init: { method: "GET" | "POST"; headers?: Record<string, string>; body?: string },
  msHetGio: number,
): Promise<{ status: number; than: unknown }> {
  const huy = new AbortController();
  const hen = setTimeout(() => huy.abort(), msHetGio);
  try {
    const lam = async () => {
      const tra = await hamFetch(url, { ...init, signal: huy.signal, cache: "no-store" });
      let than: unknown = null;
      try {
        than = await tra.json();
      } catch {
        than = null;
      }
      return { status: tra.status, than };
    };
    return await Promise.race([
      lam(),
      new Promise<never>((_, tuChoi) => huy.signal.addEventListener("abort", () => tuChoi(new Error("hết giờ")))),
    ]);
  } finally {
    clearTimeout(hen);
  }
}

export type KetQuaGui =
  /** Máy chủ đã ghi đơn (mới, hay đơn cũ cùng mã gửi). */
  | { loai: "da-ghi"; don: DonTraTruoc; khoa: string }
  /** Máy chủ từ chối và nói vì sao; đơn chưa ghi. 409 (cùng mã gửi, khác nội dung): trungMaGui. */
  | { loai: "chua-ghi"; loi: string[]; trungMaGui: boolean }
  /** Mất mạng, hết giờ, trả lời lạ: không biết đơn đã tới chưa. Gửi lại cùng mã gửi. */
  | { loai: "khong-ro" };

/** Các mã máy chủ đơn trả khi CHẮC đơn chưa ghi (may-chu-don/src/may-chu.ts, POST /api/don). */
const MA_CHUA_GHI = new Set([400, 409, 413, 429, 500]);

export async function guiDonLenMayChu(
  diaChi: string,
  than: ThanDon,
  hamFetch: HamFetchApi,
  msHetGio = 20_000,
): Promise<KetQuaGui> {
  try {
    const { status, than: tra } = await goi(
      hamFetch,
      `${diaChi}/api/don`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(than) },
      msHetGio,
    );
    if (status === 200 || status === 201) {
      const don = docDonTuJson(tra);
      const khoa = (tra as { khoa?: unknown }).khoa;
      return don && typeof khoa === "string" && /^[0-9a-f]{32}$/.test(khoa)
        ? { loai: "da-ghi", don, khoa }
        : { loai: "khong-ro" };
    }
    const loi = docLoi(tra);
    // Máy chủ đơn luôn kèm câu lý do; không có câu là trả lời của chỗ khác (proxy, mạng) — không chắc gì.
    if (MA_CHUA_GHI.has(status) && loi.length > 0) return { loai: "chua-ghi", loi, trungMaGui: status === 409 };
    return { loai: "khong-ro" };
  } catch {
    return { loai: "khong-ro" };
  }
}

export type KetQuaDoc = { loai: "co"; don: DonTraTruoc } | { loai: "khong-thay" } | { loai: "khong-ro" };

export async function docDonTuMayChu(
  diaChi: string,
  ma: string,
  khoa: string,
  hamFetch: HamFetchApi,
  msHetGio = 10_000,
): Promise<KetQuaDoc> {
  try {
    const url = `${diaChi}/api/don/${encodeURIComponent(ma)}?khoa=${encodeURIComponent(khoa)}`;
    const { status, than } = await goi(hamFetch, url, { method: "GET" }, msHetGio);
    // Chỉ tin "không có đơn" khi máy chủ đơn nói đúng lý do đó — 404 vì sai địa chỉ, sai đường thì không xóa gì.
    if (status === 404 && (than as { lyDo?: unknown } | null)?.lyDo === "khong_thay_don") return { loai: "khong-thay" };
    const don = status === 200 ? docDonTuJson(than) : null;
    return don ? { loai: "co", don } : { loai: "khong-ro" };
  } catch {
    return { loai: "khong-ro" };
  }
}

// ---------- Màn trả tiền ----------

export type BuocTraTien =
  /** Còn chờ tiền: hiện mã QR. daNhan > 0 là khách đã chuyển thiếu, mã mới cho đúng phần còn thiếu. */
  | { buoc: "cho-tra"; thanhToan: ThanhToanCo; daNhan: number }
  /** Quán chưa nhận chuyển khoản trong app (chưa khai tài khoản, hay bảng giá còn là giá thử). */
  | { buoc: "chua-mo-tra"; lyDo: "chua_co_tai_khoan" | "gia_thu" }
  /** Còn chờ tiền mà máy chủ chưa đưa được mã (tạm lỗi): hỏi lại. */
  | { buoc: "dang-lay-ma" }
  /** Quán đã nhận đủ tiền. thua > 0: khách chuyển dư, quán hoàn phần dư (Khánh chốt 30/10/2026). */
  | { buoc: "da-nhan-du"; trangThai: "da_thanh_toan" | "dang_soan" | "cho_lay" | "da_giao"; thua: number }
  /** Quá 30 phút chưa đủ tiền. Tiền về đủ sau đó vẫn tính là đã trả (Khánh chốt 30/10/2026) — app vẫn hỏi lại. */
  | { buoc: "het-han"; daNhan: number }
  | { buoc: "da-huy"; daHoan: boolean };

export function buocTraTien(don: DonTraTruoc): BuocTraTien {
  switch (don.trangThai) {
    case "cho_thanh_toan": {
      const t = don.thanhToan;
      if (t.traDuoc) return { buoc: "cho-tra", thanhToan: t, daNhan: don.daNhan };
      if (t.lyDo === "chua_co_tai_khoan" || t.lyDo === "gia_thu") return { buoc: "chua-mo-tra", lyDo: t.lyDo };
      return { buoc: "dang-lay-ma" };
    }
    case "het_han":
      return { buoc: "het-han", daNhan: don.daNhan };
    case "can_hoan_tien":
      return { buoc: "da-huy", daHoan: false };
    case "da_hoan_tien":
      return { buoc: "da-huy", daHoan: true };
    default:
      return { buoc: "da-nhan-du", trangThai: don.trangThai, thua: Math.max(0, don.daNhan - don.tongTien) };
  }
}

/** Bao lâu hỏi lại máy chủ; null là đơn đã khép, thôi hỏi. */
export function hoiLaiSauMs(don: DonTraTruoc): number | null {
  if (don.trangThai === "da_giao" || don.trangThai === "da_hoan_tien") return null;
  if (don.trangThai !== "cho_thanh_toan") return 15_000;
  // Quán chưa mở trả tiền (giá thử, chưa có tài khoản): đơn chỉ còn chờ tự hủy — hỏi thưa, đỡ mạng của khách.
  const t = don.thanhToan;
  if (!t.traDuoc && (t.lyDo === "gia_thu" || t.lyDo === "chua_co_tai_khoan")) return 30_000;
  return 4_000;
}

/**
 * Gửi lại cùng mã gửi thì máy chủ trả đơn cũ. Đơn cũ còn chờ tiền hay đang soạn: đúng là đơn khách đang theo. Đã hết
 * hạn, đã lấy, đã hủy: khách đang đặt đơn mới y như cũ — phải gửi với mã gửi mới.
 */
export function donCuConDung(trangThai: TrangThaiDon): boolean {
  return ["cho_thanh_toan", "da_thanh_toan", "dang_soan", "cho_lay"].includes(trangThai);
}

/** Ngày yyyy-mm-dd theo giờ Việt Nam của một mốc ms. */
export function ngayVn(ms: number): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Ho_Chi_Minh",
    })
      .formatToParts(ms)
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}

/** Giờ:phút theo giờ Việt Nam của một mốc ms — đúng cả khi máy của khách đặt múi giờ khác. */
export function gioPhutVn(ms: number): string {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(ms);
}

// ---------- Đơn vừa đặt, giữ trên máy ----------
// Khách rời Mini App sang app ngân hàng; máy yếu có thể đóng Mini App. Giữ mã đơn và khóa xem (không tên, không số
// điện thoại) để mở lại đúng đơn. Hỏng bộ nhớ thì thôi, không làm hỏng việc đặt.

export interface DonDaDat {
  ma: string;
  khoa: string;
  soTrongNgay: number;
  /** Ngày nhận (yyyy-mm-dd): giữ đơn trên máy ít nhất tới hết ngày này. */
  ngayNhan: string;
  luc: number;
}

export interface KhoLuu {
  getItem(khoa: string): string | null;
  setItem(khoa: string, giaTri: string): void;
  removeItem(khoa: string): void;
}

export const KHOA_LUU = "beeftown-don-tra-truoc";
/**
 * Giữ đơn vừa đặt tới hết ngày nhận (khách chọn được tới 7 ngày sau, trước ngày mở bán còn xa hơn), và ít nhất 2 ngày
 * kể từ lúc đặt. Ngày nhận quá 60 ngày sau lúc đặt là dữ liệu hỏng.
 */
export const GIU_DON_MS = 2 * 24 * 60 * 60 * 1000;
const NGAY_NHAN_XA_NHAT_MS = 60 * 24 * 60 * 60 * 1000;

export function luuDonDaDat(kho: KhoLuu | null, don: DonDaDat): void {
  try {
    kho?.setItem(KHOA_LUU, JSON.stringify(don));
  } catch {
    /* bộ nhớ đầy hay bị chặn */
  }
}

export function xoaDonDaDat(kho: KhoLuu | null): void {
  try {
    kho?.removeItem(KHOA_LUU);
  } catch {
    /* như trên */
  }
}

export function docDonDaDat(kho: KhoLuu | null, bayGio: number): DonDaDat | null {
  try {
    const v = JSON.parse(kho?.getItem(KHOA_LUU) ?? "null") as Record<string, unknown> | null;
    if (
      !v ||
      typeof v.ma !== "string" ||
      !/^[A-Z0-9]{8}$/.test(v.ma) ||
      typeof v.khoa !== "string" ||
      !/^[0-9a-f]{32}$/.test(v.khoa) ||
      !laSoNguyen(v.soTrongNgay, 1) ||
      !laSoNguyen(v.luc, 1) ||
      typeof v.ngayNhan !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(v.ngayNhan) ||
      v.ngayNhan > ngayVn(v.luc + NGAY_NHAN_XA_NHAT_MS) ||
      v.luc > bayGio + 60_000 ||
      (bayGio - v.luc > GIU_DON_MS && ngayVn(bayGio) > v.ngayNhan)
    ) {
      return null;
    }
    return { ma: v.ma, khoa: v.khoa, soTrongNgay: v.soTrongNgay, ngayNhan: v.ngayNhan, luc: v.luc };
  } catch {
    return null;
  }
}
