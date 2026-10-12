/**
 * KHO — MÁY TÍNH BẢNG DÙNG CHUNG: ĐỔI NGƯỜI BẰNG PIN, TỰ KHÓA (GĐ5d, 0034)
 *
 * Tablet ở quầy / bếp có TÀI KHOẢN RIÊNG (nhan_su vai may_chung). Tài khoản
 * đó chỉ làm được hai việc: liệt kê người đã gắn vào máy và kiểm PIN — không
 * đọc được gì trong kho hay CRM (0029, 0034). Ai làm phiếu nào vẫn ghi đúng
 * người đó, vì khi mở khóa bằng PIN, phiên bt_phien ĐỔI HẲN sang phiên của
 * chính người đó (access token của họ), không phải "máy làm thay".
 *
 * BA TRẠNG THÁI
 *
 *   Máy thường        không có cookie bt_may_hd hợp lệ — trang chạy như cũ.
 *   Máy đang khóa     bt_phien = phiên MÁY; bt_may_hd = { máy, người: - };
 *                     token của từng người đã gắn cất trong bt_may_s_<8 hex>.
 *   Có người đang dùng bt_phien = phiên NGƯỜI ĐÓ; token máy cất trong bt_may_tb;
 *                     bt_may_hd = { máy, người, lúc hoạt động } có chữ ký.
 *
 * MỖI REFRESH TOKEN CHỈ MỘT BẢN. Đổi phiên là CHUYỂN token từ chỗ này sang
 * chỗ kia trong cùng một lần trả lời (bt_phien ↔ cookie cất), không bao giờ
 * chép. Cookie cất chỉ giữ refresh token (không giữ access token), mã hóa
 * AES-GCM với AAD "may_id|nhan_su_id" (may-chung-ma-hoa.ts) — cookie của
 * người này bê sang người khác hay máy khác là giải mã hỏng. Token không bao
 * giờ ra HTML hay URL: mọi cookie ở đây httpOnly.
 *
 * Đổi phiên dùng client Supabase RIÊNG, persistSession: false — không lưu
 * phiên nào vào bộ nhớ chung của Worker.
 *
 * TỰ KHÓA (moTrangKho gọi kiemMayChung): GET quá phut_khoa phút kể từ lần
 * hoạt động cuối → khóa; POST được ân hạn tới 2 × phut_khoa rồi báo "phiếu
 * chưa được ghi". Máy chủ là nơi quyết định; public/kho/js/may-chung.js chỉ
 * đếm giờ để khóa màn hình sớm.
 *
 * BÍ MẬT KHO_MAY_KHOA: đọc từ `cloudflare:workers` (bí mật Worker, KHÔNG đặt
 * trong wrangler.toml). Thiếu → tính năng TẮT: mọi thứ khác chạy như máy
 * thường, màn /noi-bo/kho/may báo rõ.
 *
 * File này tự ghi cookie bt_phien — ĐÚNG định dạng phien.ts ghi (JSON
 * { access_token, refresh_token }, httpOnly, sameSite lax, path /, 7 ngày).
 * test-kho-may-chung.mjs nhóm 14 so hai chỗ này. KHÔNG sửa phien.ts.
 *
 * HAI THỨ TIẾNG: câu báo KetQua mang cả bản tiếng Anh (cauEn); câu lỗi của
 * database đi nguyên văn, trang tra dichCau lúc hiện.
 *
 * SUPABASE BẬN (lib/qua-tai.ts): mở khóa, khóa máy, gắn người đều đổi token
 * qua /auth/v1/token — cửa có hạn mức chung cho cả quán. Bị từ chối vì bận hay
 * mất mạng thì token VẪN CÒN: không xóa cookie cất, không bỏ token máy, không
 * đổi phiên nào — báo "đợi vài giây rồi thử lại". Máy chưa khóa được vì bận thì
 * không ai dùng tiếp dưới tên người trước: mọi trang kho trả trang "đang bận"
 * (tự tải lại) cho tới khi khóa được.
 */

import type { AstroCookies, AstroGlobal } from 'astro';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { coDatabase, xoaToken, type NhanSu } from '../phien.ts';
import { kqHai, kqLoi, laUuid, type HaiThuTieng, type KetQua, type NgonNguNB } from './chung.ts';
import { dichCau } from '../cau-noi-bo.ts';
import { docBao, ghiBao } from './bao.ts';
import { phanLoaiLoiAuth, trangQuaTai, ghiQuaTai, CAU_DANG_NHAP_TAM, type LoaiLoiAuth } from '../qua-tai.ts';
import {
  aadToken, bamPin, biMatHopLe, danKhoaMay, daQuaGioKhoa, giaiMaToken, giayConLai, kiemMoc, kyMoc,
  maHoaToken, pinHopLe, tenCookieNguoi,
  COOKIE_MAY_HD, COOKIE_MAY_TB, PHUT_KHOA_MAC_DINH,
  type KhoaMay, type MocHoatDong,
} from './may-chung-ma-hoa.ts';

/** Đường dẫn màn "Ai đang dùng máy?". */
export const DUONG_MAY = '/noi-bo/kho/may';

/** Câu báo dùng ở nhiều chỗ. */
const CAU_MAY = {
  chuaBat: { vi: 'Máy dùng chung chưa được bật.', en: 'The shared tablet feature is not turned on.' },
  matMay: {
    vi: 'Máy mất đăng nhập của máy — nhờ quản lý đăng ký lại máy.',
    en: 'The tablet lost its own login — ask a manager to register the tablet again.',
  },
  khongConGiu: {
    vi: 'Máy không còn giữ đăng nhập của bạn. Bấm "Gắn tôi vào máy này" và đăng nhập lại một lần.',
    en: 'The tablet no longer holds your login. Tap "Add me to this tablet" and log in once more.',
  },
  kiemPinLoi: { vi: 'Chưa kiểm được PIN. Thử lại.', en: 'Could not check the PIN. Try again.' },
  quaTaiMo: {
    vi: 'PIN đúng, nhưng hệ thống đăng nhập đang bận nên máy chưa mở được. Đợi vài giây rồi nhập PIN lại.',
    en: 'Your PIN is correct, but the login system is busy so the tablet could not open yet. Wait a few seconds, then enter your PIN again.',
  },
  quaTaiKhoa: {
    vi: 'Hệ thống đăng nhập đang bận nên máy CHƯA khóa. Đợi vài giây rồi bấm Khóa máy lại.',
    en: 'The login system is busy, so the tablet is NOT locked yet. Wait a few seconds, then tap Lock tablet again.',
  },
  quaTaiGo: {
    vi: 'Đã gỡ bạn khỏi máy, nhưng hệ thống đăng nhập đang bận nên máy CHƯA khóa. Đợi vài giây rồi bấm Khóa máy.',
    en: 'Removed you from the tablet, but the login system is busy so the tablet is NOT locked yet. Wait a few seconds, then tap Lock tablet.',
  },
} satisfies Record<string, HaiThuTieng>;

/** Câu khi đăng nhập email / mật khẩu thất bại: sai mật khẩu, hay chỉ là Supabase bận. */
function cauDangNhapHong(loai: LoaiLoiAuth, saiMatKhau: HaiThuTieng): KetQua {
  return kqHai(false, loai === 'tu_choi' ? saiMatKhau : CAU_DANG_NHAP_TAM[loai]);
}

/** Máy đang ở chế độ dùng chung — đưa vào TrangKho.may cho Kho.astro. */
export interface CheDoMay {
  mayId: string;
  /** Người đang dùng; null = máy đang khóa (phiên hiện tại là phiên máy). */
  nhanSuId: string | null;
  tenMay: string;
  phutKhoa: number;
  /** Giây còn lại trước khi tự khóa (cho may-chung.js). 0 khi máy đang khóa. */
  giayConLai: number;
}

/** Vai của tài khoản máy (0029): chỉ vào được /noi-bo/kho/may/*. */
export function laVaiMay(vai: string | null | undefined): boolean {
  return vai === 'may_chung' || vai === 'may_ipos';
}

/**
 * Màn đang ở chế độ máy dùng chung: mở bằng tài khoản máy (màn khóa), hoặc một người
 * đã mở khóa bằng PIN. Khung kho (menu người dùng) và trang Khác cùng hỏi hàm này để
 * ẩn phần nhà hàng và đổi "Đăng xuất" (xóa phiên của cả máy) thành "Khóa máy".
 */
export function laCheDoMay(vai: string | null | undefined, may: Pick<CheDoMay, 'nhanSuId'> | null | undefined): boolean {
  return laVaiMay(vai) || !!may?.nhanSuId;
}

export function laDuongMay(duong: string): boolean {
  const d = duong.replace(/\/$/, '');
  return d === DUONG_MAY || d.startsWith(DUONG_MAY + '/');
}

// -----------------------------------------------------------------------------
// BÍ MẬT VÀ KHÓA
// -----------------------------------------------------------------------------
/**
 * Đọc KHO_MAY_KHOA. Trên Worker: `env` của `cloudflare:workers`. Chạy thử
 * bằng Node / công cụ khác thì đọc process.env. Không có → undefined.
 */
export async function docBiMat(): Promise<string | undefined> {
  try {
    const m = await import('cloudflare:workers');
    const v = (m as { env?: Record<string, unknown> })?.env?.KHO_MAY_KHOA;
    if (typeof v === 'string' && v) return v;
  } catch { /* không chạy trên Worker — thử process.env */ }
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.KHO_MAY_KHOA;
  return typeof p === 'string' && p ? p : undefined;
}

// Dẫn khóa (HKDF) một lần cho mỗi bí mật — isolate của Worker dùng lại được.
let boNhoKhoa: { biMat: string; khoa: Promise<KhoaMay> } | null = null;

/**
 * Bộ khóa của máy dùng chung. null = tính năng TẮT (thiếu / ngắn bí mật).
 * Truyền biMat để test; bỏ trống thì đọc bí mật Worker.
 */
export async function layKhoaMay(biMat?: string): Promise<KhoaMay | null> {
  const bm = biMat ?? await docBiMat();
  if (!biMatHopLe(bm)) return null;
  if (!boNhoKhoa || boNhoKhoa.biMat !== bm) boNhoKhoa = { biMat: bm, khoa: danKhoaMay(bm) };
  try { return await boNhoKhoa.khoa; } catch { boNhoKhoa = null; return null; }
}

// -----------------------------------------------------------------------------
// COOKIE
// -----------------------------------------------------------------------------
// Cookie máy sống 60 ngày dưới /noi-bo. bt_phien thì giữ nguyên 7 ngày như
// phien.ts: tablet bỏ không quá 7 ngày thì mất phiên máy — quản lý đăng ký lại
// (token người đã cất vẫn dùng được lại vì cùng may_id).
const TUOI_COOKIE_MAY = 60 * 60 * 24 * 60;
const DUONG_COOKIE_MAY = '/noi-bo';

interface TokenPhien { access_token: string; refresh_token: string }

function layBien(ten: string): string | undefined {
  const v = (import.meta.env as Record<string, unknown>)?.[ten];
  return typeof v === 'string' && v ? v : undefined;
}

/** Đọc bt_phien — cùng luật với docToken() của phien.ts. */
function docPhien(cookies: AstroCookies): TokenPhien | null {
  const raw = cookies.get('bt_phien')?.value;
  if (!raw) return null;
  try {
    const t = JSON.parse(raw);
    return typeof t?.access_token === 'string' && typeof t?.refresh_token === 'string' ? t : null;
  } catch { return null; }
}

/** Ghi bt_phien — ĐÚNG như ghiToken() của phien.ts (layPhien đọc cookie này). */
function ghiPhien(cookies: AstroCookies, s: TokenPhien) {
  const t: TokenPhien = { access_token: s.access_token, refresh_token: s.refresh_token };
  cookies.set('bt_phien', JSON.stringify(t), {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

function ghiCookieMay(cookies: AstroCookies, ten: string, giaTri: string) {
  cookies.set(ten, giaTri, {
    httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax',
    path: DUONG_COOKIE_MAY, maxAge: TUOI_COOKIE_MAY,
  });
}

function xoaCookieMay(cookies: AstroCookies, ten: string) {
  cookies.delete(ten, { path: DUONG_COOKIE_MAY });
}

async function docMoc(cookies: AstroCookies, khoa: KhoaMay): Promise<MocHoatDong | null> {
  return kiemMoc(khoa, cookies.get(COOKIE_MAY_HD)?.value);
}

async function ghiMoc(cookies: AstroCookies, khoa: KhoaMay, moc: MocHoatDong) {
  ghiCookieMay(cookies, COOKIE_MAY_HD, await kyMoc(khoa, moc));
}

/** Token máy cất trong bt_may_tb khi có người đang dùng: "<nhan_su_id máy>.<v1.…>". */
interface TokenMay { mayNsId: string; rt: string; phut: number; ten: string }

async function docTokenMay(cookies: AstroCookies, khoa: KhoaMay, mayId: string): Promise<TokenMay | null> {
  const raw = cookies.get(COOKIE_MAY_TB)?.value ?? '';
  const cham = raw.indexOf('.');
  const mayNsId = raw.slice(0, cham);
  if (cham < 0 || !laUuid(mayNsId)) return null;
  const ro = await giaiMaToken(khoa, raw.slice(cham + 1), aadToken(mayId, mayNsId));
  if (!ro) return null;
  try {
    const v = JSON.parse(ro);
    if (typeof v?.rt !== 'string' || !v.rt) return null;
    return {
      mayNsId, rt: v.rt,
      phut: Number.isInteger(v.phut) ? v.phut : PHUT_KHOA_MAC_DINH,
      ten: typeof v.ten === 'string' ? v.ten : '',
    };
  } catch { return null; }
}

async function ghiTokenMay(cookies: AstroCookies, khoa: KhoaMay, mayId: string, t: TokenMay) {
  const ma = await maHoaToken(khoa, JSON.stringify({ rt: t.rt, phut: t.phut, ten: t.ten }), aadToken(mayId, t.mayNsId));
  ghiCookieMay(cookies, COOKIE_MAY_TB, `${t.mayNsId}.${ma}`);
}

/** Cất refresh token của một người vào cookie riêng của họ trên máy này. */
async function catTokenNguoi(cookies: AstroCookies, khoa: KhoaMay, mayId: string, nsId: string, rt: string) {
  ghiCookieMay(cookies, await tenCookieNguoi(khoa, mayId, nsId), await maHoaToken(khoa, rt, aadToken(mayId, nsId)));
}

// -----------------------------------------------------------------------------
// SUPABASE — client riêng, không lưu phiên
// -----------------------------------------------------------------------------
function taoClientTam(): SupabaseClient {
  return createClient(layBien('PUBLIC_SUPABASE_URL')!, layBien('PUBLIC_SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function taoClientVoiToken(accessToken: string): SupabaseClient {
  return createClient(layBien('PUBLIC_SUPABASE_URL')!, layBien('PUBLIC_SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

/** lamMoi / veMayKhoa: Supabase bận hoặc mất mạng — token VẪN CÒN, chưa đổi gì. */
const TAM_LOI = 'tam_loi' as const;

/**
 * Đổi refresh token lấy phiên mới (token cũ hết hiệu lực — vẫn chỉ một bản).
 * null = token bị TỪ CHỐI (hết hạn, thu hồi). TAM_LOI = Supabase bận / mất
 * mạng: token chưa bị đụng tới — người gọi phải giữ nguyên nó.
 */
async function lamMoi(rt: string): Promise<Session | typeof TAM_LOI | null> {
  try {
    const { data, error } = await taoClientTam().auth.refreshSession({ refresh_token: rt });
    if (error && phanLoaiLoiAuth(error) === 'tu_choi') return null;
    if (error) { ghiQuaTai('máy dùng chung · đổi phiên', error); return TAM_LOI; }
    return data.session ?? null;
  } catch (e) { ghiQuaTai('máy dùng chung · đổi phiên', e); return TAM_LOI; }
}

/**
 * Đăng nhập email / mật khẩu bằng client riêng. Trả client đó (để đăng xuất
 * nếu cần) và phiên — hoặc loại lỗi: 'tu_choi' là sai email / mật khẩu, hai
 * loại kia là Supabase bận / mất mạng (không phải lỗi của người gõ).
 */
async function dangNhapTam(email: string, matKhau: string): Promise<{ tam: SupabaseClient; s: Session } | LoaiLoiAuth> {
  try {
    const tam = taoClientTam();
    const { data, error } = await tam.auth.signInWithPassword({ email, password: matKhau });
    const loai = error ? phanLoaiLoiAuth(error) : null;
    if (loai && loai !== 'tu_choi') ghiQuaTai('máy dùng chung · đăng nhập', error);
    if (loai) return loai;
    return data.session ? { tam, s: data.session } : 'mat_ket_noi';
  } catch (e) { ghiQuaTai('máy dùng chung · đăng nhập', e); return 'mat_ket_noi'; }
}

/** Thu hồi phiên vừa đăng nhập tạm (không để token nào sống mà không ai giữ). */
async function dangXuatTam(tam: SupabaseClient) {
  try { await tam.auth.signOut({ scope: 'local' }); } catch { /* đã hết hạn thì thôi */ }
}

/**
 * Thu hồi một refresh token sắp bị bỏ khỏi máy (phiên bị đè khi đăng ký máy,
 * cookie cất cũ khi gắn lại): token rời máy thì không được sống tiếp ở đâu.
 */
async function thuHoi(rt: string | null | undefined) {
  if (!rt) return;
  try {
    const tam = taoClientTam();
    const { data } = await tam.auth.refreshSession({ refresh_token: rt });
    if (data.session) await dangXuatTam(tam);
  } catch { /* không thu hồi được thì token vẫn đã rời khỏi máy */ }
}

// -----------------------------------------------------------------------------
// ĐỔI PHIÊN
// -----------------------------------------------------------------------------
/**
 * Đưa máy về trạng thái KHÓA: token người đang dùng cất vào cookie của họ
 * (catNguoi = false: bỏ đi — người vừa tự gỡ, hoặc phiên lạ), token máy
 * từ bt_may_tb về bt_phien.
 *
 * Trả 'mat_may' khi token máy hỏng / hết hạn: không còn phiên máy để quay về.
 * Khi đó token người vẫn được cất, bt_phien và mốc bị xóa — máy thành máy
 * thường đã đăng xuất; quản lý đăng ký lại là mọi người dùng tiếp được.
 *
 * Trả TAM_LOI khi Supabase bận / mất mạng. Token máy được làm mới TRƯỚC khi
 * đụng cookie nào, nên lúc đó chưa có gì thay đổi: người đang dùng vẫn đang
 * dùng, token máy vẫn cất. Người gọi báo "chưa khóa được" hoặc chặn trang.
 */
async function veMayKhoa(
  cookies: AstroCookies, khoa: KhoaMay, moc: MocHoatDong, catNguoi: boolean,
): Promise<'ok' | 'mat_may' | typeof TAM_LOI> {
  const tb = await docTokenMay(cookies, khoa, moc.mayId);
  const s = tb ? await lamMoi(tb.rt) : null;
  if (s === TAM_LOI) return TAM_LOI;
  const nguoi = docPhien(cookies);
  if (catNguoi && nguoi && moc.nhanSuId) {
    await catTokenNguoi(cookies, khoa, moc.mayId, moc.nhanSuId, nguoi.refresh_token);
  }
  xoaCookieMay(cookies, COOKIE_MAY_TB);
  if (!s) {
    xoaToken(cookies);
    xoaCookieMay(cookies, COOKIE_MAY_HD);
    return 'mat_may';
  }
  ghiPhien(cookies, s);
  await ghiMoc(cookies, khoa, { mayId: moc.mayId, nhanSuId: null, luc: Date.now() });
  return 'ok';
}

/**
 * Khóa máy (nút "Khóa máy", hết giờ, may-chung.js chuyển ?khoa=1).
 * Ghi kho_may_khoa bằng phiên người đang dùng (nhật ký máy biết ai rời máy).
 */
export async function khoaMay(Astro: AstroGlobal, cach: 'bam' | 'het_gio'): Promise<KetQua & { quaTai?: true }> {
  const khoa = await layKhoaMay();
  if (!khoa) return kqHai(false, CAU_MAY.chuaBat);
  const moc = await docMoc(Astro.cookies, khoa);
  if (!moc) return kqHai(false, { vi: 'Máy này không phải máy dùng chung.', en: 'This device is not a shared tablet.' });
  if (!moc.nhanSuId) return kqHai(true, { vi: 'Máy đã khóa.', en: 'The tablet is locked.' });
  const phien = Astro.locals.phien;
  if (phien && phien.nhanSu.id === moc.nhanSuId) {
    try { await phien.client.rpc('kho_may_khoa', { p_may_id: moc.mayId, p_cach: cach }); } catch { /* chỉ để ghi nhật ký */ }
  }
  const catNguoi = !!phien && phien.nhanSu.id === moc.nhanSuId;
  const kq = await veMayKhoa(Astro.cookies, khoa, moc, catNguoi);
  // quaTai: kiemMayChung cần phân biệt để chặn trang thay vì đưa về đăng nhập.
  if (kq === TAM_LOI) return { ...kqHai(false, CAU_MAY.quaTaiKhoa), quaTai: true };
  if (kq === 'mat_may') return kqHai(false, CAU_MAY.matMay);
  return kqHai(true, cach === 'het_gio'
    ? { vi: 'Máy đã tự khóa vì lâu không dùng. Chọn tên và nhập PIN để dùng tiếp.',
        en: 'The tablet locked itself after a while unused. Choose your name and enter your PIN to continue.' }
    : { vi: 'Đã khóa máy.', en: 'Tablet locked.' });
}

/**
 * Kiểm máy dùng chung cho moTrangKho: tự khóa khi quá giờ, dời mốc hoạt động
 * khi còn giờ. Trả null khi không phải máy dùng chung (hoặc tính năng tắt),
 * Response khi phải chuyển trang (vừa khóa).
 */
export async function kiemMayChung(Astro: AstroGlobal, nhanSu: NhanSu): Promise<CheDoMay | null | Response> {
  const khoa = await layKhoaMay();
  if (!khoa) return null;
  const moc = await docMoc(Astro.cookies, khoa);
  if (!moc) return null;
  const cookies = Astro.cookies;
  // Trang của máy dùng chung không được nằm trong bộ nhớ đệm trình duyệt:
  // bấm "Quay lại" sau khi khóa không được hiện lại trang của người trước.
  Astro.response.headers.set('Cache-Control', 'no-store');

  // Máy đang khóa: phiên phải là phiên máy. Người khác đăng nhập đè lên
  // (trang đăng nhập thường) thì token máy đã mất — máy thành máy thường.
  if (!moc.nhanSuId) {
    if (laVaiMay(nhanSu.vai_tro)) {
      return { mayId: moc.mayId, nhanSuId: null, tenMay: '', phutKhoa: PHUT_KHOA_MAC_DINH, giayConLai: 0 };
    }
    xoaCookieMay(cookies, COOKIE_MAY_HD);
    return null;
  }

  // Có người đang dùng nhưng bt_phien là người khác (ai đó đăng nhập đè bằng
  // trang đăng nhập thường): về màn khóa, KHÔNG cất phiên lạ đó.
  if (moc.nhanSuId !== nhanSu.id) {
    const kq = await veMayKhoa(cookies, khoa, moc, false);
    // Bận: chưa về được màn khóa — chặn trang, không cho phiên lạ dùng kho.
    if (kq === TAM_LOI) return trangQuaTai(Astro.locals.nn ?? 'vi', Astro.request.method === 'POST', Astro.url);
    return Astro.redirect(kq === 'ok' ? DUONG_MAY : '/noi-bo/dang-nhap', 302);
  }

  const tb = await docTokenMay(cookies, khoa, moc.mayId);
  if (!tb) {
    // Mất token máy: cất token người, đăng xuất khỏi tablet (không để một
    // tablet dùng chung đứng mở mãi mà không tự khóa).
    await veMayKhoa(cookies, khoa, moc, true);
    return Astro.redirect('/noi-bo/dang-nhap', 302);
  }

  const bayGio = Date.now();
  const laPost = Astro.request.method === 'POST';
  if (daQuaGioKhoa(moc.luc, bayGio, tb.phut, laPost)) {
    const kq = await khoaMay(Astro, 'het_gio');
    // Supabase bận nên CHƯA khóa được: không ai dùng tiếp dưới tên người trước.
    // Chặn trang ("đang bận", GET tự tải lại) cho tới khi khóa được. Câu báo
    // của lần lưu trước vẫn nằm trong cookie cho lần mở trang sau.
    if (kq.quaTai) return trangQuaTai(Astro.locals.nn ?? 'vi', laPost, Astro.url);
    // GET ngay sau một POST trong ân hạn: giữ câu báo của lần lưu đó (phiếu
    // ĐÃ ghi) rồi nối câu "máy đã tự khóa" vào sau.
    const truoc = laPost ? null : docBao(cookies);
    if (kq.ok && laPost) {
      const c = { vi: 'Máy đã khóa — phiếu chưa được ghi. Mở khóa rồi làm lại.', en: 'The tablet locked — your form was NOT saved. Unlock it and do it again.' };
      kq.cau = c.vi;
      kq.cauEn = c.en;
    }
    if (truoc) {
      // Câu của lần lưu trước có thể là câu database (không có cauEn) — tra dichCau.
      kq.cauEn = `${truoc.cauEn ?? dichCau('en', truoc.cau)} ${kq.cauEn ?? dichCau('en', kq.cau)}`;
      kq.cau = `${truoc.cau} ${kq.cau}`;
    }
    // Câu báo đi theo cookie bt_kho_bao (path /noi-bo/kho) như mọi trang kho.
    ghiBao(cookies, kq);
    return Astro.redirect(kq.ok ? DUONG_MAY : '/noi-bo/dang-nhap', 303);
  }

  // POST trong ân hạn (đã quá phut_khoa, chưa quá 2×) được ghi nhưng KHÔNG
  // dời mốc: lần mở trang ngay sau đó máy khóa luôn. Người đến sau cầm máy
  // đang mở trang của người trước chỉ gửi lọt được một phiếu, không dùng
  // tiếp được dưới tên người đó.
  const trongAnHan = laPost && daQuaGioKhoa(moc.luc, bayGio, tb.phut, false);
  if (!trongAnHan) await ghiMoc(cookies, khoa, { ...moc, luc: bayGio });
  return {
    mayId: moc.mayId, nhanSuId: moc.nhanSuId, tenMay: tb.ten, phutKhoa: tb.phut,
    giayConLai: giayConLai(trongAnHan ? moc.luc : bayGio, bayGio, tb.phut),
  };
}

/**
 * may-chung.js gọi GET ?giu=1 khi người dùng còn đang bấm / gõ trên trang
 * (gõ dở một phiếu dài không gửi request nào). Còn giờ thì dời mốc; quá giờ
 * thì thôi — lần mở trang sau máy chủ sẽ khóa. Không bao giờ trả dữ liệu.
 */
export async function giuMay(Astro: AstroGlobal): Promise<Response> {
  const khoa = await layKhoaMay();
  const phien = Astro.locals.phien;
  const moc = khoa ? await docMoc(Astro.cookies, khoa) : null;
  if (khoa && moc?.nhanSuId && phien?.nhanSu.id === moc.nhanSuId) {
    const tb = await docTokenMay(Astro.cookies, khoa, moc.mayId);
    const bayGio = Date.now();
    if (tb && !daQuaGioKhoa(moc.luc, bayGio, tb.phut)) {
      await ghiMoc(Astro.cookies, khoa, { ...moc, luc: bayGio });
      return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
    }
  }
  return new Response(null, { status: 409, headers: { 'cache-control': 'no-store' } });
}

// -----------------------------------------------------------------------------
// MÀN "AI ĐANG DÙNG MÁY?"
// -----------------------------------------------------------------------------
export interface NguoiTrenManKhoa {
  nhan_su_id: string;
  ho_ten: string;
  vai_tro: string;
  khoa_den: string | null;
  /** Máy còn giữ phiên của người này (có cookie cất) — không thì phải gắn lại. */
  coPhien: boolean;
}

export interface ManKhoa {
  may: { id: string; ten: string; ten_chi_nhanh: string | null; phut_khoa: number; bi_khoa: boolean };
  nguoi: NguoiTrenManKhoa[];
}

/**
 * Đọc máy và người đã gắn — gọi bằng phiên MÁY. Lỗi → câu theo nn (câu lỗi của
 * database thì nguyên văn — trang tra dichCau).
 */
export async function docManKhoa(Astro: AstroGlobal, client: SupabaseClient, nn: NgonNguNB = 'vi'): Promise<ManKhoa | string> {
  const r = await docManKhoaKq(Astro, client);
  return 'ok' in r ? (nn === 'en' && r.cauEn ? r.cauEn : r.cau) : r;
}

/** Như docManKhoa, lỗi thành KetQua (cả hai thứ tiếng) — cho moKhoaNguoi. */
async function docManKhoaKq(Astro: AstroGlobal, client: SupabaseClient): Promise<ManKhoa | KetQua> {
  const khoa = await layKhoaMay();
  if (!khoa) return kqHai(false, CAU_MAY.chuaBat);
  const { data, error } = await client.rpc('kho_may_ds_nguoi', {});
  if (error || !data) {
    return kqLoi(error, { vi: 'Không đọc được danh sách người dùng máy.', en: 'Could not read the list of tablet users.' });
  }
  const d = data as { may: ManKhoa['may']; nguoi: Omit<NguoiTrenManKhoa, 'coPhien'>[] };
  // Phiên máy chạy được hàm này = đúng là máy d.may.id. Mốc mất / lệch (xóa
  // cookie, đổi bí mật, đăng ký lại) thì dựng lại mốc "đang khóa" cho máy này.
  const moc = await docMoc(Astro.cookies, khoa);
  if (!moc || moc.mayId !== d.may.id || moc.nhanSuId) {
    await ghiMoc(Astro.cookies, khoa, { mayId: d.may.id, nhanSuId: null, luc: Date.now() });
  }
  const nguoi = await Promise.all((d.nguoi ?? []).map(async n => ({
    ...n,
    coPhien: !!Astro.cookies.get(await tenCookieNguoi(khoa, d.may.id, n.nhan_su_id))?.value,
  })));
  return { may: d.may, nguoi };
}

/** "14:05" theo giờ Việt Nam. */
export function gioPhut(iso: string | null | undefined): string {
  const t = iso ? new Date(iso) : null;
  if (!t || Number.isNaN(t.getTime())) return '';
  return t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Kết quả kho_may_kiem_pin → câu cho người đứng trước máy. Hàm thuần. */
export function cauKiemPin(
  kq: { ket_qua?: string; con_lan?: number; khoa_den?: string | null } | null, nn: NgonNguNB = 'vi',
): string {
  const c = (x: HaiThuTieng) => x[nn];
  switch (kq?.ket_qua) {
    case 'dung': return c({ vi: 'Đúng PIN.', en: 'Correct PIN.' });
    case 'sai': {
      const n = Number(kq.con_lan);
      return Number.isInteger(n) && n > 0
        ? c({ vi: `PIN chưa đúng. Còn ${n} lần thử — sai hết thì tên này bị khóa 15 phút.`,
              en: `Wrong PIN. ${n} ${n === 1 ? 'try' : 'tries'} left — after that this name is locked for 15 minutes.` })
        : c({ vi: 'PIN chưa đúng.', en: 'Wrong PIN.' });
    }
    case 'khoa_nguoi': {
      const gio = gioPhut(kq.khoa_den);
      return gio
        ? c({ vi: `Nhập sai PIN nhiều lần nên tên này đang bị khóa tới ${gio}. Chờ tới giờ đó, hoặc nhờ quản lý mở khóa.`,
              en: `Too many wrong PINs, so this name is locked until ${gio}. Wait until then, or ask a manager to unlock it.` })
        : c({ vi: 'Nhập sai PIN nhiều lần nên tên này đang bị khóa. Chờ 15 phút, hoặc nhờ quản lý mở khóa.',
              en: 'Too many wrong PINs, so this name is locked. Wait 15 minutes, or ask a manager to unlock it.' });
    }
    case 'khoa_may': return c({ vi: 'Máy đã bị khóa vì nhập sai PIN quá nhiều lần. Nhờ quản lý mở khóa máy.',
                                en: 'The tablet is locked because of too many wrong PINs. Ask a manager to unlock the tablet.' });
    default: return c(CAU_MAY.kiemPinLoi);
  }
}

/**
 * Mở khóa: kiểm PIN bằng phiên MÁY, đúng thì đổi bt_phien sang phiên của
 * người đó (token lấy từ cookie cất của họ), cất token máy vào bt_may_tb.
 */
export async function moKhoaNguoi(Astro: AstroGlobal, nhanSuId: string, pin: string): Promise<KetQua> {
  const khoa = await layKhoaMay();
  const phien = Astro.locals.phien;
  if (!khoa || !phien) return kqHai(false, CAU_MAY.chuaBat);
  const moc = await docMoc(Astro.cookies, khoa);
  if (!moc || moc.nhanSuId || !laVaiMay(phien.nhanSu.vai_tro)) {
    return kqHai(false, { vi: 'Máy không ở màn khóa. Tải lại trang.', en: 'The tablet is not on the lock screen. Reload the page.' });
  }
  if (!laUuid(nhanSuId)) return kqHai(false, { vi: 'Chọn tên của bạn trước.', en: 'Choose your name first.' });
  if (!pinHopLe(pin)) return kqHai(false, { vi: 'PIN là 4 đến 6 chữ số.', en: 'The PIN is 4 to 6 digits.' });

  const man = await docManKhoaKq(Astro, phien.client);
  if ('ok' in man) return man;
  if (man.may.id !== moc.mayId) {
    return kqHai(false, { vi: 'Máy đã được đăng ký lại. Tải lại trang.', en: 'The tablet was registered again. Reload the page.' });
  }

  // Máy không còn giữ phiên của người này thì dừng TRƯỚC khi kiểm PIN: PIN
  // đúng cũng không mở được gì, và không để màn khóa thành chỗ dò "PIN này
  // đúng chưa" cho một tên mà máy không mở được.
  const tenCk = await tenCookieNguoi(khoa, moc.mayId, nhanSuId);
  const rt = await giaiMaToken(khoa, Astro.cookies.get(tenCk)?.value, aadToken(moc.mayId, nhanSuId));
  if (!rt) {
    xoaCookieMay(Astro.cookies, tenCk);
    return kqHai(false, CAU_MAY.khongConGiu);
  }

  const pinBam = await bamPin(khoa, moc.mayId, nhanSuId, pin);
  const { data, error } = await phien.client.rpc('kho_may_kiem_pin', { p_nhan_su_id: nhanSuId, p_pin_bam: pinBam });
  if (error) return kqLoi(error, CAU_MAY.kiemPinLoi);
  const kq = data as { ket_qua?: string; dung?: boolean; con_lan?: number; khoa_den?: string | null; ho_ten?: string };
  if (!kq?.dung) return { ok: false, cau: cauKiemPin(kq), cauEn: cauKiemPin(kq, 'en') };

  // Đúng PIN — đổi phiên đã cất của người này lấy phiên mới.
  const s = await lamMoi(rt);
  if (s === TAM_LOI) {
    // Supabase bận: phiên đã cất VẪN CÒN — giữ cookie cất (xóa là bắt người ta
    // đăng nhập lại và đặt PIN lại giữa ca). kho_may_kiem_pin vừa ghi người này
    // đang dùng — trả máy về "không ai dùng"; nhập PIN lại là mở được.
    try { await phien.client.rpc('kho_may_khoa', { p_may_id: moc.mayId, p_cach: 'bam' }); } catch { /* chỉ nhật ký */ }
    return kqHai(false, CAU_MAY.quaTaiMo);
  }
  if (!s) {
    xoaCookieMay(Astro.cookies, tenCk);
    // kho_may_kiem_pin vừa ghi người này đang dùng — trả máy về "không ai dùng".
    try { await phien.client.rpc('kho_may_khoa', { p_may_id: moc.mayId, p_cach: 'bam' }); } catch { /* chỉ nhật ký */ }
    return kqHai(false, {
      vi: 'Máy không còn giữ đăng nhập của bạn (đã hết hạn). Bấm "Gắn tôi vào máy này" và đăng nhập lại một lần.',
      en: 'The tablet no longer holds your login (it expired). Tap "Add me to this tablet" and log in once more.',
    });
  }

  const may = docPhien(Astro.cookies);
  if (!may) return kqHai(false, { vi: 'Máy mất đăng nhập — tải lại trang.', en: 'The tablet lost its login — reload the page.' });
  await ghiTokenMay(Astro.cookies, khoa, moc.mayId, {
    mayNsId: phien.nhanSu.id, rt: may.refresh_token, phut: man.may.phut_khoa, ten: man.may.ten,
  });
  ghiPhien(Astro.cookies, s);
  xoaCookieMay(Astro.cookies, tenCk);
  await ghiMoc(Astro.cookies, khoa, { mayId: moc.mayId, nhanSuId, luc: Date.now() });
  const phut = man.may.phut_khoa;
  return kqHai(true, {
    vi: `Chào ${kq.ho_ten ?? 'bạn'}. Máy tự khóa sau ${phut} phút không dùng.`,
    en: `Hi ${kq.ho_ten ?? 'there'}. The tablet locks itself after ${phut} ${phut === 1 ? 'minute' : 'minutes'} unused.`,
  });
}

// -----------------------------------------------------------------------------
// GẮN NGƯỜI VÀO MÁY, ĐỔI PIN, TỰ GỠ
// -----------------------------------------------------------------------------
function docPinMoi(form: FormData): string | KetQua {
  const pin = String(form.get('pin') ?? '').trim();
  const pin2 = String(form.get('pin_lai') ?? '').trim();
  if (!pinHopLe(pin)) return kqHai(false, { vi: 'PIN phải là 4 đến 6 chữ số.', en: 'The PIN must be 4 to 6 digits.' });
  if (pin !== pin2) return kqHai(false, { vi: 'Hai lần nhập PIN không giống nhau.', en: 'The two PINs do not match.' });
  if (/^(\d)\1+$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin)) {
    return kqHai(false, {
      vi: 'PIN dễ đoán quá (số lặp hoặc số liền nhau). Chọn PIN khác.',
      en: 'That PIN is too easy to guess (repeated or consecutive digits). Choose another PIN.',
    });
  }
  return pin;
}

/**
 * Gắn: người dùng đăng nhập ĐẦY ĐỦ (email, mật khẩu) ngay trên máy đang khóa,
 * đặt PIN. Đăng nhập bằng client riêng — phiên máy trong bt_phien không bị
 * đè cho tới khi gắn xong; gắn xong thì người đó dùng máy luôn.
 */
export async function ganNguoi(Astro: AstroGlobal, form: FormData): Promise<KetQua> {
  const khoa = await layKhoaMay();
  const phien = Astro.locals.phien;
  if (!khoa || !phien || !coDatabase()) return kqHai(false, CAU_MAY.chuaBat);
  const moc = await docMoc(Astro.cookies, khoa);
  if (!moc || moc.nhanSuId || !laVaiMay(phien.nhanSu.vai_tro)) {
    return kqHai(false, { vi: 'Khóa máy trước rồi gắn người mới.', en: 'Lock the tablet first, then add someone new.' });
  }
  const email = String(form.get('email') ?? '').trim();
  const matKhau = String(form.get('mat_khau') ?? '');
  if (!email || !matKhau) return kqHai(false, { vi: 'Điền email và mật khẩu của bạn.', en: 'Enter your email and password.' });
  const pin = docPinMoi(form);
  if (typeof pin !== 'string') return pin;

  const dn = await dangNhapTam(email, matKhau);
  if (typeof dn === 'string') return cauDangNhapHong(dn, { vi: 'Email hoặc mật khẩu không đúng.', en: 'Wrong email or password.' });
  const nguoi = taoClientVoiToken(dn.s.access_token);
  const { data: ns } = await nguoi
    .from('nhan_su').select('id, ho_ten').eq('auth_uid', dn.s.user.id).eq('dang_lam', true).maybeSingle();
  const nsDong = ns as { id: string; ho_ten: string } | null;
  if (!nsDong) {
    await dangXuatTam(dn.tam);
    return kqHai(false, {
      vi: 'Tài khoản này chưa được nối với nhân sự nào. Liên hệ chủ nhà hàng.',
      en: 'This account is not linked to any staff member yet. Please contact the owner.',
    });
  }
  if (nsDong.id === phien.nhanSu.id) {
    await dangXuatTam(dn.tam);
    return kqHai(false, {
      vi: 'Đây là tài khoản của máy. Mỗi người gắn bằng tài khoản của chính mình.',
      en: "This is the tablet's own account. Everyone adds themselves with their own account.",
    });
  }

  const pinBam = await bamPin(khoa, moc.mayId, nsDong.id, pin);
  const { data, error } = await nguoi.rpc('kho_may_gan_nguoi', { p_may_id: moc.mayId, p_pin_bam: pinBam });
  if (error || !data) {
    await dangXuatTam(dn.tam);
    return kqLoi(error, { vi: 'Chưa gắn được vào máy.', en: 'Could not add you to the tablet.' });
  }
  const g = data as { phut_khoa?: number; ten_may?: string; gan_lai?: boolean };

  // Chuyển: token máy (bt_phien) → bt_may_tb; phiên người vừa đăng nhập → bt_phien.
  const may = docPhien(Astro.cookies);
  if (!may) {
    await dangXuatTam(dn.tam);
    return kqHai(false, {
      vi: 'Máy mất đăng nhập — nhờ quản lý đăng ký lại máy.',
      en: 'The tablet lost its login — ask a manager to register the tablet again.',
    });
  }
  await ghiTokenMay(Astro.cookies, khoa, moc.mayId, {
    mayNsId: phien.nhanSu.id, rt: may.refresh_token,
    phut: Number.isInteger(g.phut_khoa) ? g.phut_khoa! : PHUT_KHOA_MAC_DINH, ten: g.ten_may ?? '',
  });
  ghiPhien(Astro.cookies, { access_token: dn.s.access_token, refresh_token: dn.s.refresh_token });
  // Gắn lại: cookie cất cũ (nếu còn) là phiên cũ — thu hồi rồi bỏ, chỉ giữ
  // phiên vừa đăng nhập.
  const tenCkCu = await tenCookieNguoi(khoa, moc.mayId, nsDong.id);
  await thuHoi(await giaiMaToken(khoa, Astro.cookies.get(tenCkCu)?.value, aadToken(moc.mayId, nsDong.id)));
  xoaCookieMay(Astro.cookies, tenCkCu);
  await ghiMoc(Astro.cookies, khoa, { mayId: moc.mayId, nhanSuId: nsDong.id, luc: Date.now() });
  return kqHai(true, g.gan_lai
    ? { vi: `Đã đặt PIN mới cho ${nsDong.ho_ten} trên máy này.`, en: `Set a new PIN for ${nsDong.ho_ten} on this tablet.` }
    : { vi: `Đã gắn ${nsDong.ho_ten} vào máy này. Lần sau chỉ cần chọn tên và nhập PIN.`,
        en: `Added ${nsDong.ho_ten} to this tablet. Next time, just choose your name and enter your PIN.` });
}

/** Đổi PIN khi đang dùng máy bằng phiên của chính mình. */
export async function doiPin(Astro: AstroGlobal, form: FormData, may: CheDoMay): Promise<KetQua> {
  const khoa = await layKhoaMay();
  const phien = Astro.locals.phien;
  if (!khoa || !phien || may.nhanSuId !== phien.nhanSu.id) {
    return kqHai(false, { vi: 'Mở khóa máy bằng tên của bạn trước.', en: 'Unlock the tablet with your name first.' });
  }
  const pin = docPinMoi(form);
  if (typeof pin !== 'string') return pin;
  const pinBam = await bamPin(khoa, may.mayId, phien.nhanSu.id, pin);
  const { error } = await phien.client.rpc('kho_may_dat_pin', { p_may_id: may.mayId, p_pin_bam: pinBam });
  if (error) return kqLoi(error, { vi: 'Chưa đổi được PIN.', en: 'Could not change the PIN.' });
  return kqHai(true, { vi: 'Đã đổi PIN. Lần sau mở máy bằng PIN mới.', en: 'PIN changed. Use the new PIN next time you unlock the tablet.' });
}

/** "Gỡ tôi khỏi máy này": xóa khỏi danh sách, bỏ phiên của mình trên máy, về màn khóa. */
export async function goToiKhoiMay(Astro: AstroGlobal, may: CheDoMay): Promise<KetQua> {
  const khoa = await layKhoaMay();
  const phien = Astro.locals.phien;
  if (!khoa || !phien || may.nhanSuId !== phien.nhanSu.id) {
    return kqHai(false, { vi: 'Bạn không đang dùng máy này.', en: 'You are not using this tablet.' });
  }
  const { error } = await phien.client.rpc('kho_may_go', { p_may_id: may.mayId });
  if (error) return kqLoi(error, { vi: 'Chưa gỡ được.', en: 'Could not remove you.' });
  // Về màn khóa TRƯỚC, rồi mới thu hồi phiên của mình trên máy (không cất,
  // không để sống). Làm ngược lại mà Supabase bận thì máy đang cầm một phiên
  // đã thu hồi và không về được màn khóa.
  const rtCuaToi = docPhien(Astro.cookies)?.refresh_token;
  const moc: MocHoatDong = { mayId: may.mayId, nhanSuId: may.nhanSuId, luc: Date.now() };
  const kq = await veMayKhoa(Astro.cookies, khoa, moc, false);
  if (kq === TAM_LOI) return kqHai(false, CAU_MAY.quaTaiGo);
  await thuHoi(rtCuaToi);
  if (kq === 'mat_may') {
    return kqHai(false, {
      vi: 'Đã gỡ bạn khỏi máy. Máy mất đăng nhập của máy — nhờ quản lý đăng ký lại.',
      en: 'Removed you from the tablet. The tablet lost its own login — ask a manager to register it again.',
    });
  }
  return kqHai(true, { vi: 'Đã gỡ bạn khỏi máy này. Muốn dùng lại thì gắn lại.', en: 'Removed you from this tablet. To use it again, add yourself again.' });
}

// -----------------------------------------------------------------------------
// ĐĂNG KÝ MÁY (quản lý, trên chính tablet)
// -----------------------------------------------------------------------------
/**
 * Quản lý đứng trước tablet, gõ email / mật khẩu TÀI KHOẢN MÁY (và của chính
 * mình nếu tablet không đang mở bằng tài khoản quản lý). Máy chủ đăng nhập
 * tài khoản máy bằng client riêng để biết auth uid, gọi kho_dang_ky_may bằng
 * phiên QUẢN LÝ, rồi đặt phiên máy vào bt_phien — tablet về màn khóa.
 *
 * Phiên quản lý không ở lại trên tablet: đăng nhập tạm thì thu hồi ngay;
 * đang dùng máy bằng PIN thì cất lại như khi khóa.
 */
export async function dangKyMay(Astro: AstroGlobal, form: FormData, coQuyenDuyet: boolean): Promise<KetQua> {
  const khoa = await layKhoaMay();
  const phien = Astro.locals.phien;
  if (!khoa) {
    return kqHai(false, {
      vi: 'Máy dùng chung chưa được bật: Cloudflare chưa có bí mật KHO_MAY_KHOA.',
      en: 'The shared tablet feature is not turned on: Cloudflare does not have the KHO_MAY_KHOA secret yet.',
    });
  }
  if (!phien || !coDatabase()) return kqHai(false, { vi: 'Chưa đăng nhập.', en: 'Not logged in.' });

  const emailMay = String(form.get('email_may') ?? '').trim();
  const mkMay = String(form.get('mat_khau_may') ?? '');
  const ten = String(form.get('ten') ?? '').trim().slice(0, 60);
  const phutChu = String(form.get('phut_khoa') ?? '').trim();
  const phut = phutChu === '' ? PHUT_KHOA_MAC_DINH : Number(phutChu);
  if (!emailMay || !mkMay) {
    return kqHai(false, { vi: 'Điền email và mật khẩu của tài khoản máy.', en: 'Enter the email and password of the tablet account.' });
  }
  if (!Number.isInteger(phut) || phut < 1 || phut > 60) {
    return kqHai(false, { vi: 'Số phút tự khóa phải từ 1 đến 60.', en: 'Auto-lock minutes must be between 1 and 60.' });
  }

  // Client quản lý: phiên đang mở nếu là quản lý, không thì đăng nhập tạm.
  let quanLy: SupabaseClient = phien.client;
  let tamQl: SupabaseClient | null = null;
  if (!coQuyenDuyet) {
    const email = String(form.get('email_ql') ?? '').trim();
    const mk = String(form.get('mat_khau_ql') ?? '');
    if (!email || !mk) return kqHai(false, { vi: 'Điền email và mật khẩu của quản lý.', en: "Enter the manager's email and password." });
    const dn = await dangNhapTam(email, mk);
    if (typeof dn === 'string') {
      return cauDangNhapHong(dn, { vi: 'Email hoặc mật khẩu của quản lý không đúng.', en: 'Wrong manager email or password.' });
    }
    tamQl = dn.tam;
    quanLy = taoClientVoiToken(dn.s.access_token);
  }

  const dnMay = await dangNhapTam(emailMay, mkMay);
  if (typeof dnMay === 'string') {
    if (tamQl) await dangXuatTam(tamQl);
    return cauDangNhapHong(dnMay, { vi: 'Email hoặc mật khẩu của tài khoản máy không đúng.', en: 'Wrong tablet account email or password.' });
  }
  const { data, error } = await quanLy.rpc('kho_dang_ky_may', {
    p_auth_uid: dnMay.s.user.id, p_ten: ten || null, p_phut_khoa: phut,
  });
  if (tamQl) await dangXuatTam(tamQl);
  if (error || !data) {
    await dangXuatTam(dnMay.tam);
    return kqLoi(error, { vi: 'Chưa đăng ký được máy.', en: 'Could not register the tablet.' });
  }
  const m = data as { may_id: string; ten: string };

  // Người đang dùng máy bằng PIN (quản lý mở khóa rồi vào đây): cất lại phiên
  // của họ như khi khóa. Token máy cũ (bt_may_tb) bỏ — phiên máy mới thay.
  const mocCu = await docMoc(Astro.cookies, khoa);
  const cu = docPhien(Astro.cookies);
  // Phiên khác đang nằm trên tablet (quản lý đăng nhập thường, phiên máy cũ)
  // và token máy cũ thì thu hồi: bỏ khỏi cookie mà không thu hồi là để một
  // phiên sống mà không ai giữ.
  if (mocCu?.nhanSuId && mocCu.nhanSuId === phien.nhanSu.id && cu) {
    await catTokenNguoi(Astro.cookies, khoa, mocCu.mayId, mocCu.nhanSuId, cu.refresh_token);
  } else {
    await thuHoi(cu?.refresh_token);
  }
  if (mocCu) await thuHoi((await docTokenMay(Astro.cookies, khoa, mocCu.mayId))?.rt);
  xoaCookieMay(Astro.cookies, COOKIE_MAY_TB);
  ghiPhien(Astro.cookies, { access_token: dnMay.s.access_token, refresh_token: dnMay.s.refresh_token });
  await ghiMoc(Astro.cookies, khoa, { mayId: m.may_id, nhanSuId: null, luc: Date.now() });
  return kqHai(true, {
    vi: `Đã đăng ký máy "${m.ten}". Từng người bấm "Gắn tôi vào máy này" và đăng nhập một lần để đặt PIN.`,
    en: `Registered the tablet "${m.ten}". Each person taps "Add me to this tablet" and logs in once to set a PIN.`,
  });
}
