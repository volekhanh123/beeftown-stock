/**
 * KHO — LƯU TẠM LƯỢT QUÉT KHI MẤT MẠNG (phần thuần: không DOM, không mạng)
 *
 * Kho quét nhãn bằng camera điện thoại (Khánh chọn 26/11/2026: không dùng máy quét cầm tay). Trong kho lạnh, sóng
 * hay mất: bấm "Cộng nhãn" lúc mất mạng thì trình duyệt hiện trang lỗi và các mã vừa quét có thể mất. Phần gắn vào
 * ô quét (quet-luu-tam-trinh-duyet.ts, gọi từ components/kho/QuetMa.astro) dùng các hàm dưới đây để:
 *
 *   · GIỮ MÃ TRONG Ô (bản nháp, mọi trang có ô quét): chữ trong ô quét được chép vào bộ nhớ của trình duyệt
 *     (localStorage) mỗi lần đổi; tải lại trang mà ô trống thì đưa lại. Xóa ngay trước khi gửi form thật.
 *   · LƯU TẠM LƯỢT QUÉT (chỉ trang ghi thẳng lượt quét vào sổ — pha lóc, đếm quầy; QuetMa có `guiLai`): bấm gửi
 *     mà không tới được máy chủ thì lượt quét (mã, ma_gui và vài ô ẩn trang cần) vào HÀNG CHỜ trên máy; có mạng
 *     thì tự gửi lại. Gửi lại an toàn vì database chống cộng đôi theo ma_gui (kho_quet_phien_pha,
 *     kho_kiem_ke_lan_quet: unique ma_gui) — cùng một lượt gửi mười lần vẫn cộng một lần.
 *
 * Ba trang còn lại (Quét nhãn, Kiểm kê, phiếu chuyển / xuất) chỉ ĐỌC mã rồi hiện kết quả để người dùng làm tiếp —
 * gửi hộ lúc người dùng không nhìn là vô nghĩa, nên chỉ giữ mã trong ô.
 *
 * Gửi lại chỉ mang các ô trang khai trong `guiLai` (không mang ô gõ tay): pha lóc lưu phần gõ kg TRƯỚC khi quét
 * khi form có `so_ra` (pha-loc/[id].astro, VIEC_LUU_GO_TAY_TRUOC) — gửi lại bản gõ tay cũ sau vài giờ có thể đè số
 * người khác vừa sửa. Không có `so_ra` thì máy chủ bỏ qua bước đó và chỉ cộng nhãn.
 *
 * Một lượt chỉ được bỏ khỏi hàng chờ (tự động) khi máy chủ trả lời bằng một lần chuyển hướng về CHÍNH trang đó (trang
 * kho kết thúc mọi kết cục đã xử lý bằng 303 — chuyenHuong ở lib/kho/trang.ts) VÀ câu báo của trang đó là câu "xong"
 * (BaoKho, data-bao-ket-qua="xong"). Câu báo là lỗi — "nhãn hỏng, chưa cộng", "quầy đang có phiếu khác" (đếm quầy:
 * lượt lưu lúc chưa có phiếu, trong lúc chờ máy khác đã mở phiếu), hay cộng được một phần — thì GIỮ, thôi tự gửi,
 * hiện nguyên câu của kho: người dùng xem số trên trang rồi gửi lại hay bỏ. Không bao giờ tự xóa nhãn mà kho chưa
 * nói là đã nhận. Không chuyển hướng (trang dựng lại vì database lỗi), lỗi 5xx, hay fetch ném lỗi → giữ, gửi lại
 * sau. Chuyển sang trang đăng nhập / màn "Ai đang dùng máy?" → giữ, chờ đăng nhập. Chuyển sang trang khác → giữ,
 * thôi tự gửi, báo người dùng.
 *
 * Mỗi lượt gắn với NGƯỜI đã quét (nhân sự đăng nhập lúc đó): máy dùng chung đổi người bằng PIN (may-chung.ts) —
 * lượt của người này không bao giờ gửi dưới phiên của người khác.
 *
 * Kiểm: crm/test/test-kho-quet-luu-tam-web.mjs (hàm thuần, khớp với các trang), web/kiem-tra/thu-quet-luu-tam.mjs
 * (Chromium thật, tắt mạng giữa chừng).
 */
import { gioVnTuMs, homNayVn } from '../gio-vn.ts';
import { tachDanhSachMa } from './ma-vach.ts';
import type { HaiThuTieng, NgonNguNB } from '../ngon-ngu-noi-bo.ts';

/** Khóa localStorage của hàng chờ (một mảng cho mọi trang, mọi người trên máy này). */
export const KHOA_HANG_CHO = 'bt-kho-quet-cho';
/** Khóa localStorage của bản nháp ô quét (theo đường dẫn trang). */
export const KHOA_NHAP = 'bt-kho-quet-nhap';
/** Bản nháp quá chừng này thì bỏ (chữ quét hôm qua đưa lại vào ô hôm nay dễ bị cộng nhầm). */
export const HAN_NHAP_MS = 12 * 60 * 60 * 1000;
/** Gửi lại mà máy chủ vẫn chưa nhận chừng ấy lần (mạng vẫn có) → thôi tự gửi lượt đó, báo người dùng. */
export const SO_LAN_THU_TOI_DA = 5;
/** Trang chuyển tới khi phiên hết / máy dùng chung đã khóa: lượt quét chưa được xử lý. */
const TRANG_DANG_NHAP = ['/noi-bo/dang-nhap', '/noi-bo/kho/may'];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Một lượt quét đang chờ gửi. */
export interface LuotCho {
  /** Khóa chống cộng đôi của database — cũng là khóa của lượt trong hàng chờ. */
  ma_gui: string;
  /** Đường dẫn trang (không ?…, không / cuối): chỗ chặn nút khác, chỗ so trang đích. */
  duong: string;
  /** Địa chỉ gửi (đường dẫn + ?…, cùng website). */
  url: string;
  /** Các ô gửi lên, đúng thứ tự: viec, ma_quet, rồi các ô của `guiLai`. */
  truong: [string, string][];
  so_nhan: number;
  /** Lúc quét (ms). */
  luc: number;
  /** Nhân sự đã quét. */
  nguoi: string;
  /** Số lần đã gửi mà máy chủ chưa nhận (mạng có). */
  lan_thu: number;
  /**
   * Thôi tự gửi: kho trả lời bằng câu lỗi, bị chuyển sang trang khác, hay quá SO_LAN_THU_TOI_DA lần. Người dùng bấm
   * Gửi ngay hay Bỏ.
   */
  dung: boolean;
  /** Câu báo của kho ở lần gửi gần nhất (đúng chữ trang hiện), '' nếu chưa có. */
  cau_kho: string;
}

/** Bản nháp của một ô quét. */
export interface BanNhap { ma_quet: string; luc: number; nguoi: string }

/** "/noi-bo/kho/pha-loc/abc/" → "/noi-bo/kho/pha-loc/abc". */
export function chuanDuong(duong: string): string {
  return duong.split(/[?#]/)[0].replace(/(.)\/+$/, '$1');
}

/** Số mã trong ô quét — tách như máy chủ (tachDanhSachMa: dòng, dấu cách, dấu phẩy, chấm phẩy). */
export function demNhan(maQuet: string): number {
  return tachDanhSachMa(maQuet).length;
}

const laChu = (v: unknown): v is string => typeof v === 'string';
const laSo = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function laLuot(v: unknown): v is LuotCho {
  if (!v || typeof v !== 'object') return false;
  const l = v as Record<string, unknown>;
  return laChu(l.ma_gui) && UUID.test(l.ma_gui)
    && laChu(l.duong) && l.duong.startsWith('/noi-bo/kho/')
    && laChu(l.url) && l.url.startsWith('/noi-bo/kho/')
    && Array.isArray(l.truong) && l.truong.every(c => Array.isArray(c) && c.length === 2 && laChu(c[0]) && laChu(c[1]))
    && laSo(l.so_nhan) && laSo(l.luc) && laChu(l.nguoi) && l.nguoi !== ''
    && laSo(l.lan_thu) && typeof l.dung === 'boolean' && (l.cau_kho === undefined || laChu(l.cau_kho));
}

/** Đọc hàng chờ từ chữ đã lưu. Chữ hỏng → rỗng; lượt sai dạng (bản khác, bị sửa tay) bị bỏ. */
export function docHangCho(chu: string | null): LuotCho[] {
  if (!chu) return [];
  try {
    const v = JSON.parse(chu);
    return Array.isArray(v) ? v.filter(laLuot).map(l => ({ ...l, cau_kho: l.cau_kho ?? '' })) : [];
  } catch {
    return [];
  }
}

export function chuHangCho(ds: readonly LuotCho[]): string {
  return JSON.stringify(ds);
}

/**
 * Dựng một lượt chờ từ form của trang. `truong` là các cặp của FormData (file bỏ qua). Chỉ mang theo `viec`,
 * `ma_quet` và các ô có tên trong `guiLai`. Trả null khi ô quét trống, hay không có ma_gui hợp lệ (không có nó thì
 * gửi lại có thể cộng đôi — thà không lưu).
 */
export function taoLuot(o: {
  truong: Iterable<[string, unknown]>;
  guiLai: readonly string[];
  viec: string;
  maQuet: string;
  duong: string;
  url: string;
  nguoi: string;
  luc: number;
}): LuotCho | null {
  const maQuet = o.maQuet.trim();
  const soNhan = demNhan(maQuet);
  if (soNhan === 0 || !o.nguoi) return null;
  const giu = new Set(o.guiLai);
  const truong: [string, string][] = [['viec', o.viec], ['ma_quet', maQuet]];
  for (const [ten, gt] of o.truong) {
    if (ten === 'viec' || ten === 'ma_quet' || !giu.has(ten) || typeof gt !== 'string') continue;
    truong.push([ten, gt]);
  }
  const maGui = truong.find(([ten]) => ten === 'ma_gui')?.[1] ?? '';
  if (!UUID.test(maGui)) return null;
  const duong = chuanDuong(o.duong);
  if (!duong.startsWith('/noi-bo/kho/') || !o.url.startsWith('/noi-bo/kho/')) return null;
  return {
    ma_gui: maGui, duong, url: o.url, truong, so_nhan: soNhan, luc: o.luc, nguoi: o.nguoi, lan_thu: 0, dung: false,
    cau_kho: '',
  };
}

/** Thêm một lượt vào cuối hàng chờ (cùng ma_gui thì thay bản cũ — không bao giờ hai bản một lượt). */
export function themVaoHang(ds: readonly LuotCho[], luot: LuotCho): LuotCho[] {
  return [...ds.filter(l => l.ma_gui !== luot.ma_gui), luot];
}

export function boKhoiHang(ds: readonly LuotCho[], maGui: string): LuotCho[] {
  return ds.filter(l => l.ma_gui !== maGui);
}

/**
 * Ghi lại một lần gửi mà kho chưa nhận: tăng lan_thu, giữ câu của kho; `thoi` (kho trả lời bằng câu lỗi, bị chuyển
 * đi) hay quá SO_LAN_THU_TOI_DA lần thì thôi tự gửi.
 */
export function ghiLanThu(ds: readonly LuotCho[], maGui: string, thoi: boolean, cauKho = ''): LuotCho[] {
  return ds.map(l => {
    if (l.ma_gui !== maGui) return l;
    const lan = l.lan_thu + 1;
    return { ...l, lan_thu: lan, dung: thoi || lan >= SO_LAN_THU_TOI_DA, cau_kho: cauKho || l.cau_kho };
  });
}

/** Người dùng bấm "Gửi ngay": các lượt đã thôi tự gửi được gửi lại từ đầu. */
export function choGuiLai(ds: readonly LuotCho[], nguoi: string): LuotCho[] {
  return ds.map(l => (l.nguoi === nguoi && l.dung ? { ...l, lan_thu: 0, dung: false } : l));
}

export const cuaNguoi = (ds: readonly LuotCho[], nguoi: string) => ds.filter(l => l.nguoi === nguoi);
export const cuaNguoiKhac = (ds: readonly LuotCho[], nguoi: string) => ds.filter(l => l.nguoi !== nguoi);
export const cuaTrang = (ds: readonly LuotCho[], nguoi: string, duong: string) =>
  ds.filter(l => l.nguoi === nguoi && l.duong === chuanDuong(duong));

/** Kết cục của một lần gửi lại. */
export type KetCucGui =
  | 'da-nhan'     // chuyển hướng về chính trang, câu báo "xong" — bỏ khỏi hàng
  | 'tu-choi'     // chuyển hướng về chính trang, câu báo lỗi — giữ, thôi tự gửi, hiện câu
  | 'dang-nhap'   // phiên hết / máy khóa — giữ, chờ đăng nhập
  | 'bi-chuyen'   // chuyển sang trang khác (mất quyền, trang không còn) — giữ, thôi tự gửi
  | 'mat-mang'    // không tới được máy chủ — giữ, gửi lại khi có mạng
  | 'chua-nhan';  // tới máy chủ nhưng chưa ghi (database lỗi, 5xx) — giữ, gửi lại sau

/**
 * Xếp loại trả lời của một lần gửi lại (fetch, redirect: 'follow'). `traLoi` null = fetch ném lỗi (mất mạng, hết
 * giờ). `url` là địa chỉ cuối sau khi theo chuyển hướng. `bao`: kiểu câu báo kết quả của trang đích
 * (data-bao-ket-qua của BaoKho), null khi trang không có câu báo.
 */
export function xepLoaiTraLoi(
  traLoi: { redirected: boolean; status: number; url: string } | null, duong: string,
  bao: 'xong' | 'loi' | null = null,
): KetCucGui {
  if (!traLoi) return 'mat-mang';
  if (!traLoi.redirected) return 'chua-nhan';
  let cuoi: string;
  try { cuoi = chuanDuong(new URL(traLoi.url).pathname); } catch { return 'chua-nhan'; }
  // Không thấy câu báo (cookie câu báo dùng chung cả khu kho — một lượt xem khác của người dùng có thể đọc mất): chưa
  // biết kết quả → gửi lại sau; gửi lại an toàn, lần sau database trả "đã có" kèm câu báo.
  if (cuoi === chuanDuong(duong)) return bao === 'xong' ? 'da-nhan' : bao === 'loi' ? 'tu-choi' : 'chua-nhan';
  if (TRANG_DANG_NHAP.some(t => cuoi === t || cuoi.startsWith(t + '/'))) return 'dang-nhap';
  return 'bi-chuyen';
}

// -----------------------------------------------------------------------------
// BẢN NHÁP Ô QUÉT
// -----------------------------------------------------------------------------
function docBangNhap(chu: string | null): Record<string, BanNhap> {
  if (!chu) return {};
  try {
    const v = JSON.parse(chu);
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    const ra: Record<string, BanNhap> = {};
    for (const [duong, n] of Object.entries(v as Record<string, unknown>)) {
      const b = n as Record<string, unknown> | null;
      if (b && laChu(b.ma_quet) && laSo(b.luc) && laChu(b.nguoi)) ra[duong] = { ma_quet: b.ma_quet, luc: b.luc, nguoi: b.nguoi };
    }
    return ra;
  } catch {
    return {};
  }
}

/** Bản nháp còn hạn của đúng người, đúng trang; không có → null. */
export function docNhap(chu: string | null, duong: string, nguoi: string, bayGio: number): BanNhap | null {
  const b = docBangNhap(chu)[chuanDuong(duong)];
  if (!b || b.nguoi !== nguoi || !b.ma_quet.trim()) return null;
  return bayGio - b.luc >= 0 && bayGio - b.luc < HAN_NHAP_MS ? b : null;
}

/** Chữ mới của bảng nháp: ghi (maQuet có chữ) hay xóa (trống) bản của trang; bỏ luôn các bản quá hạn. */
export function ghiNhap(chu: string | null, duong: string, nguoi: string, maQuet: string, bayGio: number): string {
  const bang = docBangNhap(chu);
  for (const [d, b] of Object.entries(bang)) if (!(bayGio - b.luc >= 0 && bayGio - b.luc < HAN_NHAP_MS)) delete bang[d];
  const d = chuanDuong(duong);
  if (maQuet.trim() && nguoi) bang[d] = { ma_quet: maQuet, luc: bayGio, nguoi };
  else delete bang[d];
  return JSON.stringify(bang);
}

// -----------------------------------------------------------------------------
// CÂU HIỆN RA (vi / en)
// -----------------------------------------------------------------------------
/** "14:05" nếu hôm nay (giờ VN), "14:05 ngày 25/11" nếu hôm khác. */
export function gioLuot(luc: number, bayGio: number): string {
  const g = gioVnTuMs(luc);
  if (!g) return '';
  const gio = g.slice(11, 16);
  return g.slice(0, 10) === homNayVn(bayGio) ? gio : `${gio} ngày ${g.slice(8, 10)}/${g.slice(5, 7)}`;
}
function gioLuotEn(luc: number, bayGio: number): string {
  const g = gioVnTuMs(luc);
  if (!g) return '';
  const gio = g.slice(11, 16);
  return g.slice(0, 10) === homNayVn(bayGio) ? gio : `${gio} on ${g.slice(8, 10)}/${g.slice(5, 7)}`;
}

const nhanVi = (n: number) => `${n} nhãn`;
const nhanEn = (n: number) => `${n} label${n === 1 ? '' : 's'}`;
const luotVi = (n: number) => `${n} lượt quét`;
const luotEn = (n: number) => `${n} scan${n === 1 ? '' : 's'}`;
const tong = (ds: readonly LuotCho[]) => ds.reduce((s, l) => s + l.so_nhan, 0);

export const CAU_LUU_TAM = {
  /** Vừa đưa một lượt vào hàng chờ. */
  vuaLuu: (soNhan: number): HaiThuTieng => ({
    vi: `Chưa có mạng — đã lưu tạm ${nhanVi(soNhan)} trên máy này, CHƯA vào sổ kho. Có mạng lại máy tự gửi.`,
    en: `No connection — ${nhanEn(soNhan)} saved on this device only, NOT in the stock books yet. They are sent automatically when the connection is back.`,
  }),
  /** Hàng chờ của người đang đăng nhập. */
  dangCho: (ds: readonly LuotCho[]): HaiThuTieng => ({
    vi: `${nhanVi(tong(ds))} (${luotVi(ds.length)}) đang lưu tạm trên máy này, chưa vào sổ kho. Đừng xóa dữ liệu trình duyệt trước khi gửi xong.`,
    en: `${nhanEn(tong(ds))} (${luotEn(ds.length)}) are saved on this device and not in the stock books yet. Do not clear the browser data before they are sent.`,
  }),
  /**
   * Một lượt đã thôi tự gửi. Kho có thể đã cộng một phần (câu của kho nói rõ) — gửi lại vẫn an toàn: database chống
   * cộng đôi theo ma_gui.
   */
  dung: (l: LuotCho, bayGio: number): HaiThuTieng => ({
    vi: `Lượt quét lúc ${gioLuot(l.luc, bayGio)} (${nhanVi(l.so_nhan)}) chưa chắc đã vào sổ${l.cau_kho ? ` — kho trả lời: «${l.cau_kho}»` : ' — kho chưa nhận sau nhiều lần gửi'}. Máy đã thôi tự gửi lượt này: xem lại số trên trang, rồi bấm Gửi ngay (gửi lại không bao giờ cộng hai lần) hay Bỏ.`,
    en: `The scan from ${gioLuotEn(l.luc, bayGio)} (${nhanEn(l.so_nhan)}) may not be in the books${l.cau_kho ? ` — the stock system said: «${l.cau_kho}»` : ' — not accepted after several tries'}. Automatic sending stopped for it: check the numbers on the page, then press Send now (resending never counts twice) or Discard.`,
  }),
  /** Phiên hết / máy khóa lúc gửi lại. */
  dangNhap: (soLuot: number): HaiThuTieng => ({
    vi: `Cần đăng nhập lại để gửi ${luotVi(soLuot)} đang lưu tạm.`,
    en: `Sign in again to send the ${luotEn(soLuot)} saved on this device.`,
  }),
  /** Lượt của người khác trên cùng máy. */
  nguoiKhac: (soLuot: number): HaiThuTieng => ({
    vi: `Máy này còn ${luotVi(soLuot)} của tài khoản khác chưa gửi — người đó đăng nhập trên máy này để gửi.`,
    en: `This device still holds ${luotEn(soLuot)} from another account — that person needs to sign in on this device to send them.`,
  }),
  /** Kho đã nhận một lượt chờ (câu báo "xong"); `cau` là câu báo của trang (đã đúng thứ tiếng), có thể trống. */
  daNhan: (luc: number, soNhan: number, cau: string, bayGio: number): HaiThuTieng => ({
    vi: `Kho đã nhận lượt quét lúc ${gioLuot(luc, bayGio)} (${nhanVi(soNhan)})${cau ? `: ${cau}` : '.'}`,
    en: `The stock system received the scan from ${gioLuotEn(luc, bayGio)} (${nhanEn(soNhan)})${cau ? `: ${cau}` : '.'}`,
  }),
  /** Còn lượt chờ của trang này mà bấm nút khác (Quét xong, Gửi quản lý, Chốt, −1…). */
  chan: (ds: readonly LuotCho[]): HaiThuTieng => ({
    vi: `Còn ${luotVi(ds.length)} (${nhanVi(tong(ds))}) chưa vào sổ. Chờ máy gửi xong (cần mạng) rồi mới bấm tiếp — bấm bây giờ thì số sẽ thiếu các nhãn đó.`,
    en: `${luotEn(ds.length)} (${nhanEn(tong(ds))}) are not in the books yet. Wait until they are sent (needs a connection) before going on — otherwise the numbers will miss those labels.`,
  }),
  /** Trang chỉ đọc mã (Quét nhãn, Kiểm kê, phiếu xuất): bấm đọc lúc mất mạng. */
  chuaDoc: {
    vi: 'Chưa có mạng — chưa đọc được các mã. Mã vẫn nằm trong ô (máy này giữ cả khi tải lại trang); có mạng thì bấm lại.',
    en: 'No connection — the codes were not read. They are still in the box (this device keeps them even if the page reloads); press again when the connection is back.',
  } satisfies HaiThuTieng,
  /** Ô quét trống mà bấm gửi lúc mất mạng (pha lóc: Enter trong ô kg = lưu phần gõ tay). */
  chuaGui: {
    vi: 'Chưa có mạng — chưa gửi được gì. Có mạng thì bấm lại.',
    en: 'No connection — nothing was sent. Press again when the connection is back.',
  } satisfies HaiThuTieng,
  /** Không ghi được vào bộ nhớ máy (đầy, chế độ riêng tư). */
  khongLuuDuoc: {
    vi: 'Chưa có mạng, và máy không lưu tạm được (bộ nhớ trình duyệt đầy hay bị chặn). Mã vẫn nằm trong ô — đừng tải lại trang; có mạng thì bấm lại.',
    en: 'No connection, and this device could not save the scan (browser storage full or blocked). The codes are still in the box — do not reload the page; press again when the connection is back.',
  } satisfies HaiThuTieng,
  /** Đưa bản nháp lại vào ô. */
  duaLai: (soNhan: number, luc: number, bayGio: number): HaiThuTieng => ({
    vi: `Đã đưa lại vào ô ${nhanVi(soNhan)} quét lúc ${gioLuot(luc, bayGio)} mà chưa gửi.`,
    en: `Put back into the box ${nhanEn(soNhan)} scanned at ${gioLuotEn(luc, bayGio)} that were not sent.`,
  }),
  taiLai: { vi: 'Tải lại trang để thấy số mới', en: 'Reload the page to see the new numbers' } satisfies HaiThuTieng,
  /** Bấm "Tải lại" khi trang còn ô gõ tay chưa lưu (pha lóc: kg phụ phẩm). */
  hoiTaiLai: {
    vi: 'Trang còn số gõ tay chưa lưu — tải lại sẽ mất các số đó. Vẫn tải lại? (Muốn giữ: bấm Hủy rồi bấm Lưu.)',
    en: 'This page has typed numbers that are not saved — reloading loses them. Reload anyway? (To keep them: press Cancel, then Save.)',
  } satisfies HaiThuTieng,
  guiNgay: { vi: 'Gửi ngay', en: 'Send now' } satisfies HaiThuTieng,
  bo: { vi: 'Bỏ các lượt chờ', en: 'Discard waiting scans' } satisfies HaiThuTieng,
  hoiBo: (ds: readonly LuotCho[]): HaiThuTieng => ({
    vi: `Bỏ ${luotVi(ds.length)} (${nhanVi(tong(ds))}) chưa gửi? Các nhãn đó sẽ KHÔNG vào sổ kho — phải quét lại.`,
    en: `Discard ${luotEn(ds.length)} (${nhanEn(tong(ds))}) not sent yet? Those labels will NOT reach the stock books — they must be scanned again.`,
  }),
};

/** Chọn câu theo thứ tiếng của trang. */
export function cauTheo(nn: NgonNguNB, c: HaiThuTieng): string {
  return nn === 'en' ? c.en : c.vi;
}
