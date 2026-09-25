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
 */

import type { AstroCookies, AstroGlobal } from 'astro';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { coDatabase, xoaToken, type NhanSu } from '../phien';
import { cauLoiKho, laUuid, type KetQua } from './chung.ts';
import { docBao, ghiBao } from './bao.ts';
import {
  aadToken, bamPin, biMatHopLe, danKhoaMay, daQuaGioKhoa, giaiMaToken, giayConLai, kiemMoc, kyMoc,
  maHoaToken, pinHopLe, tenCookieNguoi,
  COOKIE_MAY_HD, COOKIE_MAY_TB, PHUT_KHOA_MAC_DINH,
  type KhoaMay, type MocHoatDong,
} from './may-chung-ma-hoa.ts';

/** Đường dẫn màn "Ai đang dùng máy?". */
export const DUONG_MAY = '/noi-bo/kho/may';

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
    // @ts-ignore — dự án không cài kiểu của workerd; module này chỉ có trên Worker.
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

/** Đổi refresh token lấy phiên mới (token cũ hết hiệu lực — vẫn chỉ một bản). */
async function lamMoi(rt: string): Promise<Session | null> {
  try {
    const { data, error } = await taoClientTam().auth.refreshSession({ refresh_token: rt });
    return error || !data.session ? null : data.session;
  } catch { return null; }
}

/** Đăng nhập email / mật khẩu bằng client riêng. Trả client đó (để đăng xuất nếu cần) và phiên. */
async function dangNhapTam(email: string, matKhau: string): Promise<{ tam: SupabaseClient; s: Session } | null> {
  try {
    const tam = taoClientTam();
    const { data, error } = await tam.auth.signInWithPassword({ email, password: matKhau });
    return error || !data.session ? null : { tam, s: data.session };
  } catch { return null; }
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
 */
async function veMayKhoa(
  cookies: AstroCookies, khoa: KhoaMay, moc: MocHoatDong, catNguoi: boolean,
): Promise<'ok' | 'mat_may'> {
  const nguoi = docPhien(cookies);
  if (catNguoi && nguoi && moc.nhanSuId) {
    await catTokenNguoi(cookies, khoa, moc.mayId, moc.nhanSuId, nguoi.refresh_token);
  }
  const tb = await docTokenMay(cookies, khoa, moc.mayId);
  const s = tb ? await lamMoi(tb.rt) : null;
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
export async function khoaMay(Astro: AstroGlobal, cach: 'bam' | 'het_gio'): Promise<KetQua> {
  const khoa = await layKhoaMay();
  if (!khoa) return { ok: false, cau: 'Máy dùng chung chưa được bật.' };
  const moc = await docMoc(Astro.cookies, khoa);
  if (!moc) return { ok: false, cau: 'Máy này không phải máy dùng chung.' };
  if (!moc.nhanSuId) return { ok: true, cau: 'Máy đã khóa.' };
  const phien = Astro.locals.phien;
  if (phien && phien.nhanSu.id === moc.nhanSuId) {
    try { await phien.client.rpc('kho_may_khoa', { p_may_id: moc.mayId, p_cach: cach }); } catch { /* chỉ để ghi nhật ký */ }
  }
  const catNguoi = !!phien && phien.nhanSu.id === moc.nhanSuId;
  const kq = await veMayKhoa(Astro.cookies, khoa, moc, catNguoi);
  if (kq === 'mat_may') return { ok: false, cau: 'Máy mất đăng nhập của máy — nhờ quản lý đăng ký lại máy.' };
  return { ok: true, cau: cach === 'het_gio'
    ? 'Máy đã tự khóa vì lâu không dùng. Chọn tên và nhập PIN để dùng tiếp.'
    : 'Đã khóa máy.' };
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
    // GET ngay sau một POST trong ân hạn: giữ câu báo của lần lưu đó (phiếu
    // ĐÃ ghi) rồi nối câu "máy đã tự khóa" vào sau.
    const truoc = laPost ? null : docBao(cookies);
    const kq = await khoaMay(Astro, 'het_gio');
    if (kq.ok && laPost) kq.cau = 'Máy đã khóa — phiếu chưa được ghi. Mở khóa rồi làm lại.';
    if (truoc) kq.cau = `${truoc.cau} ${kq.cau}`;
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

/** Đọc máy và người đã gắn — gọi bằng phiên MÁY. Lỗi → câu tiếng Việt. */
export async function docManKhoa(Astro: AstroGlobal, client: SupabaseClient): Promise<ManKhoa | string> {
  const khoa = await layKhoaMay();
  if (!khoa) return 'Máy dùng chung chưa được bật.';
  const { data, error } = await client.rpc('kho_may_ds_nguoi', {});
  if (error || !data) return cauLoiKho(error, 'Không đọc được danh sách người dùng máy.');
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
export function cauKiemPin(kq: { ket_qua?: string; con_lan?: number; khoa_den?: string | null } | null): string {
  switch (kq?.ket_qua) {
    case 'dung': return 'Đúng PIN.';
    case 'sai': {
      const n = Number(kq.con_lan);
      return Number.isInteger(n) && n > 0
        ? `PIN chưa đúng. Còn ${n} lần thử — sai hết thì tên này bị khóa 15 phút.`
        : 'PIN chưa đúng.';
    }
    case 'khoa_nguoi': {
      const gio = gioPhut(kq.khoa_den);
      return gio
        ? `Nhập sai PIN nhiều lần nên tên này đang bị khóa tới ${gio}. Chờ tới giờ đó, hoặc nhờ quản lý mở khóa.`
        : 'Nhập sai PIN nhiều lần nên tên này đang bị khóa. Chờ 15 phút, hoặc nhờ quản lý mở khóa.';
    }
    case 'khoa_may': return 'Máy đã bị khóa vì nhập sai PIN quá nhiều lần. Nhờ quản lý mở khóa máy.';
    default: return 'Chưa kiểm được PIN. Thử lại.';
  }
}

/**
 * Mở khóa: kiểm PIN bằng phiên MÁY, đúng thì đổi bt_phien sang phiên của
 * người đó (token lấy từ cookie cất của họ), cất token máy vào bt_may_tb.
 */
export async function moKhoaNguoi(Astro: AstroGlobal, nhanSuId: string, pin: string): Promise<KetQua> {
  const khoa = await layKhoaMay();
  const phien = Astro.locals.phien;
  if (!khoa || !phien) return { ok: false, cau: 'Máy dùng chung chưa được bật.' };
  const moc = await docMoc(Astro.cookies, khoa);
  if (!moc || moc.nhanSuId || !laVaiMay(phien.nhanSu.vai_tro)) {
    return { ok: false, cau: 'Máy không ở màn khóa. Tải lại trang.' };
  }
  if (!laUuid(nhanSuId)) return { ok: false, cau: 'Chọn tên của bạn trước.' };
  if (!pinHopLe(pin)) return { ok: false, cau: 'PIN là 4 đến 6 chữ số.' };

  const man = await docManKhoa(Astro, phien.client);
  if (typeof man === 'string') return { ok: false, cau: man };
  if (man.may.id !== moc.mayId) return { ok: false, cau: 'Máy đã được đăng ký lại. Tải lại trang.' };

  // Máy không còn giữ phiên của người này thì dừng TRƯỚC khi kiểm PIN: PIN
  // đúng cũng không mở được gì, và không để màn khóa thành chỗ dò "PIN này
  // đúng chưa" cho một tên mà máy không mở được.
  const tenCk = await tenCookieNguoi(khoa, moc.mayId, nhanSuId);
  const rt = await giaiMaToken(khoa, Astro.cookies.get(tenCk)?.value, aadToken(moc.mayId, nhanSuId));
  if (!rt) {
    xoaCookieMay(Astro.cookies, tenCk);
    return { ok: false, cau: 'Máy không còn giữ đăng nhập của bạn. Bấm "Gắn tôi vào máy này" và đăng nhập lại một lần.' };
  }

  const pinBam = await bamPin(khoa, moc.mayId, nhanSuId, pin);
  const { data, error } = await phien.client.rpc('kho_may_kiem_pin', { p_nhan_su_id: nhanSuId, p_pin_bam: pinBam });
  if (error) return { ok: false, cau: cauLoiKho(error, 'Chưa kiểm được PIN. Thử lại.') };
  const kq = data as { ket_qua?: string; dung?: boolean; con_lan?: number; khoa_den?: string | null; ho_ten?: string };
  if (!kq?.dung) return { ok: false, cau: cauKiemPin(kq) };

  // Đúng PIN — đổi phiên đã cất của người này lấy phiên mới.
  const s = await lamMoi(rt);
  if (!s) {
    xoaCookieMay(Astro.cookies, tenCk);
    // kho_may_kiem_pin vừa ghi người này đang dùng — trả máy về "không ai dùng".
    try { await phien.client.rpc('kho_may_khoa', { p_may_id: moc.mayId, p_cach: 'bam' }); } catch { /* chỉ nhật ký */ }
    return { ok: false, cau: 'Máy không còn giữ đăng nhập của bạn (đã hết hạn). Bấm "Gắn tôi vào máy này" và đăng nhập lại một lần.' };
  }

  const may = docPhien(Astro.cookies);
  if (!may) return { ok: false, cau: 'Máy mất đăng nhập — tải lại trang.' };
  await ghiTokenMay(Astro.cookies, khoa, moc.mayId, {
    mayNsId: phien.nhanSu.id, rt: may.refresh_token, phut: man.may.phut_khoa, ten: man.may.ten,
  });
  ghiPhien(Astro.cookies, s);
  xoaCookieMay(Astro.cookies, tenCk);
  await ghiMoc(Astro.cookies, khoa, { mayId: moc.mayId, nhanSuId, luc: Date.now() });
  return { ok: true, cau: `Chào ${kq.ho_ten ?? 'bạn'}. Máy tự khóa sau ${man.may.phut_khoa} phút không dùng.` };
}

// -----------------------------------------------------------------------------
// GẮN NGƯỜI VÀO MÁY, ĐỔI PIN, TỰ GỠ
// -----------------------------------------------------------------------------
function docPinMoi(form: FormData): string | KetQua {
  const pin = String(form.get('pin') ?? '').trim();
  const pin2 = String(form.get('pin_lai') ?? '').trim();
  if (!pinHopLe(pin)) return { ok: false, cau: 'PIN phải là 4 đến 6 chữ số.' };
  if (pin !== pin2) return { ok: false, cau: 'Hai lần nhập PIN không giống nhau.' };
  if (/^(\d)\1+$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin)) {
    return { ok: false, cau: 'PIN dễ đoán quá (số lặp hoặc số liền nhau). Chọn PIN khác.' };
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
  if (!khoa || !phien || !coDatabase()) return { ok: false, cau: 'Máy dùng chung chưa được bật.' };
  const moc = await docMoc(Astro.cookies, khoa);
  if (!moc || moc.nhanSuId || !laVaiMay(phien.nhanSu.vai_tro)) {
    return { ok: false, cau: 'Khóa máy trước rồi gắn người mới.' };
  }
  const email = String(form.get('email') ?? '').trim();
  const matKhau = String(form.get('mat_khau') ?? '');
  if (!email || !matKhau) return { ok: false, cau: 'Điền email và mật khẩu của bạn.' };
  const pin = docPinMoi(form);
  if (typeof pin !== 'string') return pin;

  const dn = await dangNhapTam(email, matKhau);
  if (!dn) return { ok: false, cau: 'Email hoặc mật khẩu không đúng.' };
  const nguoi = taoClientVoiToken(dn.s.access_token);
  const { data: ns } = await nguoi
    .from('nhan_su').select('id, ho_ten').eq('auth_uid', dn.s.user.id).eq('dang_lam', true).maybeSingle();
  const nsDong = ns as { id: string; ho_ten: string } | null;
  if (!nsDong) {
    await dangXuatTam(dn.tam);
    return { ok: false, cau: 'Tài khoản này chưa được nối với nhân sự nào. Liên hệ chủ nhà hàng.' };
  }
  if (nsDong.id === phien.nhanSu.id) {
    await dangXuatTam(dn.tam);
    return { ok: false, cau: 'Đây là tài khoản của máy. Mỗi người gắn bằng tài khoản của chính mình.' };
  }

  const pinBam = await bamPin(khoa, moc.mayId, nsDong.id, pin);
  const { data, error } = await nguoi.rpc('kho_may_gan_nguoi', { p_may_id: moc.mayId, p_pin_bam: pinBam });
  if (error || !data) {
    await dangXuatTam(dn.tam);
    return { ok: false, cau: cauLoiKho(error, 'Chưa gắn được vào máy.') };
  }
  const g = data as { phut_khoa?: number; ten_may?: string; gan_lai?: boolean };

  // Chuyển: token máy (bt_phien) → bt_may_tb; phiên người vừa đăng nhập → bt_phien.
  const may = docPhien(Astro.cookies);
  if (!may) {
    await dangXuatTam(dn.tam);
    return { ok: false, cau: 'Máy mất đăng nhập — nhờ quản lý đăng ký lại máy.' };
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
  return { ok: true, cau: g.gan_lai
    ? `Đã đặt PIN mới cho ${nsDong.ho_ten} trên máy này.`
    : `Đã gắn ${nsDong.ho_ten} vào máy này. Lần sau chỉ cần chọn tên và nhập PIN.` };
}

/** Đổi PIN khi đang dùng máy bằng phiên của chính mình. */
export async function doiPin(Astro: AstroGlobal, form: FormData, may: CheDoMay): Promise<KetQua> {
  const khoa = await layKhoaMay();
  const phien = Astro.locals.phien;
  if (!khoa || !phien || may.nhanSuId !== phien.nhanSu.id) return { ok: false, cau: 'Mở khóa máy bằng tên của bạn trước.' };
  const pin = docPinMoi(form);
  if (typeof pin !== 'string') return pin;
  const pinBam = await bamPin(khoa, may.mayId, phien.nhanSu.id, pin);
  const { error } = await phien.client.rpc('kho_may_dat_pin', { p_may_id: may.mayId, p_pin_bam: pinBam });
  if (error) return { ok: false, cau: cauLoiKho(error, 'Chưa đổi được PIN.') };
  return { ok: true, cau: 'Đã đổi PIN. Lần sau mở máy bằng PIN mới.' };
}

/** "Gỡ tôi khỏi máy này": xóa khỏi danh sách, bỏ phiên của mình trên máy, về màn khóa. */
export async function goToiKhoiMay(Astro: AstroGlobal, may: CheDoMay): Promise<KetQua> {
  const khoa = await layKhoaMay();
  const phien = Astro.locals.phien;
  if (!khoa || !phien || may.nhanSuId !== phien.nhanSu.id) return { ok: false, cau: 'Bạn không đang dùng máy này.' };
  const { error } = await phien.client.rpc('kho_may_go', { p_may_id: may.mayId });
  if (error) return { ok: false, cau: cauLoiKho(error, 'Chưa gỡ được.') };
  // Thu hồi luôn phiên của mình trên máy (không cất, không để sống).
  await thuHoi(docPhien(Astro.cookies)?.refresh_token);
  const moc: MocHoatDong = { mayId: may.mayId, nhanSuId: may.nhanSuId, luc: Date.now() };
  const kq = await veMayKhoa(Astro.cookies, khoa, moc, false);
  if (kq === 'mat_may') return { ok: false, cau: 'Đã gỡ bạn khỏi máy. Máy mất đăng nhập của máy — nhờ quản lý đăng ký lại.' };
  return { ok: true, cau: 'Đã gỡ bạn khỏi máy này. Muốn dùng lại thì gắn lại.' };
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
  if (!khoa) return { ok: false, cau: 'Máy dùng chung chưa được bật: Cloudflare chưa có bí mật KHO_MAY_KHOA.' };
  if (!phien || !coDatabase()) return { ok: false, cau: 'Chưa đăng nhập.' };

  const emailMay = String(form.get('email_may') ?? '').trim();
  const mkMay = String(form.get('mat_khau_may') ?? '');
  const ten = String(form.get('ten') ?? '').trim().slice(0, 60);
  const phutChu = String(form.get('phut_khoa') ?? '').trim();
  const phut = phutChu === '' ? PHUT_KHOA_MAC_DINH : Number(phutChu);
  if (!emailMay || !mkMay) return { ok: false, cau: 'Điền email và mật khẩu của tài khoản máy.' };
  if (!Number.isInteger(phut) || phut < 1 || phut > 60) return { ok: false, cau: 'Số phút tự khóa phải từ 1 đến 60.' };

  // Client quản lý: phiên đang mở nếu là quản lý, không thì đăng nhập tạm.
  let quanLy: SupabaseClient = phien.client;
  let tamQl: SupabaseClient | null = null;
  if (!coQuyenDuyet) {
    const email = String(form.get('email_ql') ?? '').trim();
    const mk = String(form.get('mat_khau_ql') ?? '');
    if (!email || !mk) return { ok: false, cau: 'Điền email và mật khẩu của quản lý.' };
    const dn = await dangNhapTam(email, mk);
    if (!dn) return { ok: false, cau: 'Email hoặc mật khẩu của quản lý không đúng.' };
    tamQl = dn.tam;
    quanLy = taoClientVoiToken(dn.s.access_token);
  }

  const dnMay = await dangNhapTam(emailMay, mkMay);
  if (!dnMay) {
    if (tamQl) await dangXuatTam(tamQl);
    return { ok: false, cau: 'Email hoặc mật khẩu của tài khoản máy không đúng.' };
  }
  const { data, error } = await quanLy.rpc('kho_dang_ky_may', {
    p_auth_uid: dnMay.s.user.id, p_ten: ten || null, p_phut_khoa: phut,
  });
  if (tamQl) await dangXuatTam(tamQl);
  if (error || !data) {
    await dangXuatTam(dnMay.tam);
    return { ok: false, cau: cauLoiKho(error, 'Chưa đăng ký được máy.') };
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
  return { ok: true, cau: `Đã đăng ký máy "${m.ten}". Từng người bấm "Gắn tôi vào máy này" và đăng nhập một lần để đặt PIN.` };
}
