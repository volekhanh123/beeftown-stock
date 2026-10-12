/**
 * BOT MESSENGER ĐẶT BÀN — WEBHOOK META (phần I/O; 0052, 0053)
 * ===========================================================
 *
 * Meta gọi `https://<web>/hook/messenger`:
 *   · GET  xác minh webhook (hub.mode=subscribe, hub.verify_token = bí mật
 *     META_VERIFY_TOKEN) → trả hub.challenge; sai → 403.
 *   · POST mỗi khi khách nhắn Trang / bấm nút, và echo mỗi tin Trang gửi đi.
 *     Kiểm chữ ký X-Hub-Signature-256 trên body THÔ bằng META_APP_SECRET (thiếu
 *     / sai → 403), trả 200 NGAY rồi xử lý trong ctx.waitUntil (Meta chỉ chờ
 *     vài giây và gửi lại nếu không nhận 200).
 * Hai lối vào gọi cùng hàm `xuLyHookMessenger`: src/worker.ts chặn đường dẫn
 * này TRƯỚC Astro (như /hook/ipos), và src/pages/hook/messenger.ts cho
 * `astro dev` (không có waitUntil → xử lý xong rồi mới trả 200).
 *
 * MỖI SỰ KIỆN CỦA KHÁCH (tin chữ, quick reply, postback):
 *   PSID → psid_bam (HMAC với MESS_KHOA_BAM; database không bao giờ thấy PSID
 *   thô) → mess_lay_phien (ĐÚNG MỘT LẦN) → bot tắt / đang tạm dừng → im →
 *   "đang gõ" → buocTiep (lib/messenger.ts), chạy việc nó yêu cầu (đặt bàn,
 *   lịch trống, tra / hủy, nội dung công khai — lib/messenger-anon.ts, client
 *   anon KHÔNG phiên; riêng tao_dat_ban phải qua mess_xin_dat_ban trước: chặn
 *   gửi trùng + tối đa DAT_BAN_TOI_DA_NGAY lần / khách / ngày) → mess_luu_phien
 *   → mess_ghi_su_kien → Send API. Database / tài khoản máy lỗi khi bot đang
 *   bật → khách nhận một câu "đang trục trặc" (không bao giờ im giữa chừng).
 * ECHO: của bot (metadata "beeftown_bot", hoặc app_id = META_APP_ID nếu cài) →
 *   bỏ qua, KHÔNG gọi mess_lay_phien. Của người trực Trang → tạm dừng bot cho
 *   khách đó (mess_luu_phien(psid, null, null, phút)) + đếm 'nhan_vien_tra_loi'.
 *
 * TÀI KHOẢN MÁY may_messenger (MESS_MAY_EMAIL / MESS_MAY_MAT_KHAU): dangNhapMay
 * (lib/tai-khoan-may.ts) — client anon RIÊNG, mỗi lời gọi Supabase tối đa
 * HET_GIO_SUPABASE_MESS_MS, phiên nhớ trong bộ nhớ isolate tới gần hết hạn
 * (taoPhienMayNho, như hook iPOS) — chỉ gọi các RPC mess_* của máy.
 *
 * BÍ MẬT (bí mật Worker — KHÔNG trong wrangler.toml / .env / repo / log):
 *   META_APP_SECRET, META_PAGE_TOKEN, META_VERIFY_TOKEN (≥ 32 ký tự),
 *   MESS_MAY_EMAIL, MESS_MAY_MAT_KHAU, MESS_KHOA_BAM (≥ 32 ký tự).
 *   Tùy chọn (không bí mật): META_APP_ID. Đọc: `env` → `cloudflare:workers` →
 *   process.env. Thiếu cái nào → GET / POST trả 503, log MỘT lần.
 *
 * Không bao giờ ném lỗi. Không log body, nội dung tin, PSID, SĐT, token: mọi
 * câu log đi qua xoaBiMat. Log giữ tiếng Việt cho người vận hành.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { envNode, envWorker, docChuoi, layBienCong, type Env } from './bien-moi-truong.ts';
import { dangNhapMay, taoPhienMayNho, type KetQuaDangNhapMay, type ThamSoDangNhapMay } from './tai-khoan-may.ts';
import { taoClient, maChiNhanh } from './noi-dung.ts';
import {
  META_API, kiemChuKy, xacMinhWebhook, tachSuKien, bamPsid, xoaBiMat, buocTiep, thanTin, thanDangGo, thanHoSo,
  dungYeuCauMeta, CAU_BOT, type SuKien, type DauVao, type PhienBot, type NguCanh, type YeuCauGoi, type KetQuaGoi, type LoaiDem, type Tin,
} from './messenger.ts';
import {
  docLichTrong, taoDatBanMess, traCuuMess, ghiNhatKyTraCuuMess, huyDatBanMess, docThongTinCongKhai,
} from './messenger-anon.ts';

export const DUONG_MESSENGER = '/hook/messenger';

// -----------------------------------------------------------------------------
// BÍ MẬT
// -----------------------------------------------------------------------------
export type { Env } from './bien-moi-truong.ts';

export const TEN_BI_MAT_MESS = {
  appSecret: 'META_APP_SECRET',
  pageToken: 'META_PAGE_TOKEN',
  verifyToken: 'META_VERIFY_TOKEN',
  email: 'MESS_MAY_EMAIL',
  matKhau: 'MESS_MAY_MAT_KHAU',
  khoaBam: 'MESS_KHOA_BAM',
} as const;

/** META_VERIFY_TOKEN và MESS_KHOA_BAM phải dài ít nhất chừng này (ngẫu nhiên). */
export const MESS_KHOA_TOI_THIEU = 32;

export interface BiMatMess {
  appSecret?: string;
  pageToken?: string;
  verifyToken?: string;
  email?: string;
  matKhau?: string;
  khoaBam?: string;
  /** Không bí mật, tùy chọn: App ID để nhận ra echo của chính bot. */
  appId?: string;
  /** Gốc website cho link trong tin (SITE_URL). */
  web: string;
}

/** Đọc bí mật Messenger. Không có → undefined; không bao giờ ném lỗi. */
export async function layBiMatMess(env?: Env): Promise<BiMatMess> {
  const w = await envWorker();
  const p = envNode();
  const T = TEN_BI_MAT_MESS;
  return {
    appSecret: docChuoi(T.appSecret, env, w, p),
    pageToken: docChuoi(T.pageToken, env, w, p),
    verifyToken: docChuoi(T.verifyToken, env, w, p),
    email: docChuoi(T.email, env, w, p),
    matKhau: docChuoi(T.matKhau, env, w, p),
    khoaBam: docChuoi(T.khoaBam, env, w, p),
    appId: docChuoi('META_APP_ID', env, w, p),
    web: (docChuoi('SITE_URL', env, w, p) ?? layBienCong('SITE_URL', env) ?? 'https://beeftown.vn').replace(/\/$/, ''),
  };
}

export interface TrangThaiBiMatMess {
  appSecret: boolean; pageToken: boolean;
  /** Đã cài và đủ dài. */
  verifyToken: boolean;
  taiKhoanMay: boolean;
  /** Đã cài và đủ dài. */
  khoaBam: boolean;
}

/** Cho màn /noi-bo/messenger: bí mật nào đã cài — chỉ CÓ / KHÔNG, không bao giờ giá trị. */
export async function trangThaiBiMatMess(env?: Env): Promise<TrangThaiBiMatMess> {
  const b = await layBiMatMess(env);
  return {
    appSecret: !!b.appSecret,
    pageToken: !!b.pageToken,
    verifyToken: !!b.verifyToken && b.verifyToken.length >= MESS_KHOA_TOI_THIEU,
    taiKhoanMay: !!(b.email && b.matKhau),
    khoaBam: !!b.khoaBam && b.khoaBam.length >= MESS_KHOA_TOI_THIEU,
  };
}

/** Tên các bí mật còn thiếu / quá ngắn. */
function thieuBiMat(b: BiMatMess): string[] {
  const T = TEN_BI_MAT_MESS;
  const ra: string[] = [];
  if (!b.appSecret) ra.push(T.appSecret);
  if (!b.pageToken) ra.push(T.pageToken);
  if (!b.verifyToken || b.verifyToken.length < MESS_KHOA_TOI_THIEU) ra.push(T.verifyToken);
  if (!b.email) ra.push(T.email);
  if (!b.matKhau) ra.push(T.matKhau);
  if (!b.khoaBam || b.khoaBam.length < MESS_KHOA_TOI_THIEU) ra.push(T.khoaBam);
  return ra;
}

/** Câu log đã in trong isolate này — "thiếu bí mật" chỉ in một lần, không ngập log. */
const daBao = new Set<string>();
function baoMotLan(ghi: (c: string) => void, cau: string) {
  if (daBao.has(cau)) return;
  daBao.add(cau);
  ghi(cau);
}
/** Cho test: quên các câu đã in một lần. */
export function quenDaBao(): void { daBao.clear(); }

// -----------------------------------------------------------------------------
// TÀI KHOẢN MÁY may_messenger
// -----------------------------------------------------------------------------
export interface PhuThuocMess {
  env?: Env;
  /** Worker: để trả 200 ngay và xử lý sau. Không có → xử lý xong rồi mới trả. */
  ctx?: { waitUntil(p: Promise<unknown>): void };
  /** Client của tài khoản máy (test thay bằng client giả). */
  taoClientMay?: () => SupabaseClient;
  /** Client anon không phiên cho đặt bàn / tra cứu / nội dung (mặc định lib/noi-dung.ts taoClient). */
  taoClientAnon?: () => SupabaseClient | null;
  fetchFn?: typeof fetch;
  ghiLog?: (cau: string) => void;
  /** Đồng hồ (ms) — test cố định ngày giờ. */
  bayGio?: () => number;
  /** Nhớ phiên máy giữa các lần Meta gọi. Mặc định: bật khi chạy thật, tắt khi test truyền client giả. */
  nhoPhien?: boolean;
  /** Mã chi nhánh nhận đặt bàn (mặc định PUBLIC_CHI_NHANH / 'q1'). */
  chiNhanhMa?: string;
  /** fetch đi Supabase của client máy (test: fetch giả treo / lỗi). Mặc định fetch toàn cục. */
  fetchSupabase?: typeof fetch;
  /** Hạn giờ mỗi lời gọi Supabase của máy (ms). Mặc định HET_GIO_SUPABASE_MESS_MS. */
  hetGioSupabaseMs?: number;
}

/**
 * Hạn giờ mỗi lời gọi Supabase của máy Messenger (ms). Worker trả 200 cho Meta NGAY rồi xử lý trong
 * ctx.waitUntil — chỉ còn khoảng 30 giây; một tin cần vài lời gọi nối nhau (đăng nhập,
 * mess_lay_phien, mess_luu_phien, mess_ghi_su_kien) mà vẫn phải còn giờ báo khách "đang trục trặc".
 */
export const HET_GIO_SUPABASE_MESS_MS = 8_000;

function thamSoMay(bm: BiMatMess, pt: PhuThuocMess): ThamSoDangNhapMay {
  return {
    email: bm.email, matKhau: bm.matKhau, tenBiMat: TEN_BI_MAT_MESS, nhan: 'tài khoản máy', env: pt.env,
    taoClient: pt.taoClientMay, fetchGoc: pt.fetchSupabase, goiMs: pt.hetGioSupabaseMs ?? HET_GIO_SUPABASE_MESS_MS,
  };
}

/** Phiên máy giữ trong bộ nhớ isolate (taoPhienMayNho) tới 2 phút trước khi hết hạn — riêng của Messenger. */
const phienMess = taoPhienMayNho();

/** Bỏ phiên đang nhớ (lỗi database lạ — lần sau đăng nhập lại). */
export function quenPhienMayMess(): void { phienMess.quen(); }

/**
 * Số phút tạm dừng lần gần nhất đọc được từ mess_lay_phien. Echo của nhân viên
 * không được gọi mess_lay_phien (hàm đó đếm tin khách), nên dùng số nhớ này;
 * isolate mới thì mặc định 60 như database.
 */
let phutTamDungNho = 60;

/**
 * Bot đang bật theo lần mess_lay_phien thành công gần nhất trong isolate này
 * (null = chưa biết). Khi database / tài khoản máy lỗi, chỉ báo khách "đang trục
 * trặc" nếu biết chắc bot đang bật — bot tắt thì nhân viên đang trả lời tay, im.
 */
let dangBatNho: boolean | null = null;
/** PSID đã nhận câu "đang trục trặc" gần đây (chỉ trong bộ nhớ) — không gửi lặp mỗi tin. */
const daBaoTrucTrac = new Map<string, number>();
const BAO_TRUC_TRAC_MOI_MS = 10 * 60_000;
/** Cho test: quên trạng thái bật / tắt đã nhớ và các khách đã được báo trục trặc. */
export function quenTrangThaiMess(): void { dangBatNho = null; daBaoTrucTrac.clear(); }

/** Database / tài khoản máy lỗi: báo khách một câu (không để khách chờ trong im lặng giữa lúc đặt bàn). */
async function baoTrucTrac(sk: SuKien, bm: BiMatMess, pt: PhuThuocMess, ghi: (c: string) => void): Promise<void> {
  if (sk.loai === 'echo' || dangBatNho !== true) return;
  const bayGio = (pt.bayGio ?? Date.now)();
  const truoc = daBaoTrucTrac.get(sk.psid);
  if (truoc !== undefined && bayGio - truoc < BAO_TRUC_TRAC_MOI_MS) return;
  if (daBaoTrucTrac.size > 500) daBaoTrucTrac.clear();
  daBaoTrucTrac.set(sk.psid, bayGio);
  const r = await goiMeta(META_API.urlGuiTin, bm.pageToken!, thanTin(sk.psid, { chu: CAU_BOT.heThongBan }), pt.fetchFn ?? fetch);
  if (!r.ok) ghi(`không gửi được câu báo trục trặc: ${r.cau}`);
}

// -----------------------------------------------------------------------------
// HTTP
// -----------------------------------------------------------------------------
function traChu(status: number, chu: string, them: Record<string, string> = {}): Response {
  return new Response(chu, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', ...them } });
}

/** Đọc body tối đa `toiDa` byte, giữ nguyên từng byte (chữ ký tính trên body thô); quá → null. */
async function docBodyByte(req: Request, toiDa: number): Promise<Uint8Array | null> {
  const dai = Number(req.headers.get('content-length') ?? '');
  if (Number.isFinite(dai) && dai > toiDa) return null;
  if (!req.body) return new Uint8Array(0);
  const r = req.body.getReader();
  const phan: Uint8Array[] = [];
  let tong = 0;
  for (;;) {
    const { done, value } = await r.read();
    if (done) break;
    tong += value.byteLength;
    if (tong > toiDa) { try { await r.cancel(); } catch { /* bỏ qua */ } return null; }
    phan.push(value);
  }
  const gop = new Uint8Array(tong);
  let i = 0;
  for (const p of phan) { gop.set(p, i); i += p.byteLength; }
  return gop;
}

/** Gọi Graph API. Không ném; câu lỗi đã sạch token. */
async function goiMeta(url: string, token: string, body: unknown, fetchFn: typeof fetch): Promise<{ ok: true; data: unknown } | { ok: false; cau: string }> {
  const yc = dungYeuCauMeta(url, token, body);
  try {
    const res = await fetchFn(yc.url, { ...yc.init, signal: AbortSignal.timeout(10_000) });
    let data: unknown = null;
    try { data = await res.json(); } catch { /* không phải JSON */ }
    if (!res.ok) {
      const e = (data as { error?: { message?: string; code?: number } } | null)?.error;
      return { ok: false, cau: xoaBiMat(`HTTP ${res.status}${e?.code !== undefined ? ` mã ${e.code}` : ''}: ${String(e?.message ?? '').slice(0, 200)}`, token) };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, cau: xoaBiMat(e instanceof Error ? e.message : String(e), token) };
  }
}

// -----------------------------------------------------------------------------
// LỐI VÀO
// -----------------------------------------------------------------------------
/** Xử lý một lần Meta gọi. Không bao giờ ném lỗi. */
export async function xuLyHookMessenger(req: Request, pt: PhuThuocMess = {}): Promise<Response> {
  let ghi: (c: string) => void = () => {};
  try {
    const bm = await layBiMatMess(pt.env);
    const sach = (c: string) => xoaBiMat(c, bm.appSecret, bm.pageToken, bm.verifyToken, bm.matKhau, bm.khoaBam);
    ghi = (c: string) => { try { (pt.ghiLog ?? console.log)(sach(`[Messenger] ${c}`)); } catch { /* bỏ qua */ } };

    if (req.method !== 'GET' && req.method !== 'POST') return traChu(405, 'Chỉ nhận GET / POST', { allow: 'GET, POST' });
    const thieu = thieuBiMat(bm);
    if (thieu.length) {
      baoMotLan(ghi, `chưa cài bí mật ${thieu.join(', ')} — webhook Messenger trả 503`);
      return traChu(503, 'Chưa cài bot Messenger');
    }

    if (req.method === 'GET') {
      const challenge = xacMinhWebhook(new URL(req.url), bm.verifyToken!);
      if (challenge === null) { ghi('xác minh webhook thất bại (hub.mode / hub.verify_token sai)'); return traChu(403, 'Sai mã xác minh'); }
      return traChu(200, challenge);
    }

    let body: Uint8Array | null;
    try { body = await docBodyByte(req, META_API.bodyToiDa); } catch { return traChu(400, 'Không đọc được nội dung'); }
    if (body === null) return traChu(413, 'Nội dung quá lớn');
    if (!(await kiemChuKy(body, req.headers.get(META_API.headerChuKy), bm.appSecret!))) {
      ghi('bỏ webhook: chữ ký X-Hub-Signature-256 thiếu hoặc sai');
      return traChu(403, 'Sai chữ ký');
    }
    let json: unknown;
    try { json = JSON.parse(new TextDecoder().decode(body)); } catch { return traChu(400, 'Nội dung không phải JSON'); }
    const suKien = tachSuKien(json);
    if (!suKien.length) return traChu(200, 'EVENT_RECEIVED');

    const viec = xuLyCacSuKien(suKien, bm, pt, ghi).catch(e => ghi(`lỗi: ${e instanceof Error ? e.message : String(e)}`));
    if (pt.ctx && typeof pt.ctx.waitUntil === 'function') pt.ctx.waitUntil(viec);
    else await viec;
    return traChu(200, 'EVENT_RECEIVED');
  } catch (e) {
    ghi(`lỗi: ${e instanceof Error ? e.message : String(e)}`);
    return traChu(500, 'Lỗi máy chủ');
  }
}

async function xuLyCacSuKien(ds: SuKien[], bm: BiMatMess, pt: PhuThuocMess, ghi: (c: string) => void): Promise<void> {
  const nho = pt.nhoPhien ?? !pt.taoClientMay;
  const dn: KetQuaDangNhapMay = nho ? await phienMess.dangNhap(thamSoMay(bm, pt)) : await dangNhapMay(thamSoMay(bm, pt));
  if (!dn.ok) {
    ghi(dn.cau);
    for (const sk of ds) await baoTrucTrac(sk, bm, pt, ghi);
    return;
  }
  try {
    // Database đã hỏng ở một tin trong lô → các tin sau chỉ báo khách "đang trục trặc", không gọi
    // database nữa: mỗi lời gọi chờ tới HET_GIO_SUPABASE_MESS_MS, cộng dồn qua cả lô sẽ quá thời gian
    // waitUntil còn lại và khách cuối lô không được trả lời gì.
    let dbHong = false;
    for (const sk of ds) {
      if (dbHong) { await baoTrucTrac(sk, bm, pt, ghi); continue; }
      try { dbHong = (await motSuKien(sk, dn.client, bm, pt, ghi)) === 'db_hong'; }
      catch (e) {
        if (nho) quenPhienMayMess();
        ghi(`lỗi xử lý sự kiện: ${e instanceof Error ? e.message : String(e)}`);
        await baoTrucTrac(sk, bm, pt, ghi);
      }
    }
  } finally {
    await dn.dangXuat();
  }
}

interface KetQuaLayPhien {
  dang_bat?: boolean; loi_chao?: string; phut_tam_dung?: number;
  phien?: {
    buoc?: string; du_lieu?: Record<string, unknown>; dang_tam_dung?: boolean; bi_khoa?: boolean; cap_nhat?: string | null;
  } | null;
}

/** Một sự kiện. Trả 'db_hong' khi database không đọc được phiên (lô bỏ gọi database cho tin sau). */
async function motSuKien(
  sk: SuKien, may: SupabaseClient, bm: BiMatMess, pt: PhuThuocMess, ghi: (c: string) => void,
): Promise<'db_hong' | void> {
  const fetchFn = pt.fetchFn ?? fetch;
  const psidBam = await bamPsid(sk.psid, bm.khoaBam!);
  const demSuKien = async (loai: LoaiDem, loi: string | null = null) => {
    try {
      const { error } = await may.rpc('mess_ghi_su_kien', { p_loai: loai, p_loi: loi ? xoaBiMat(loi, bm.pageToken, bm.appSecret) : null });
      if (error) ghi(`không đếm được sự kiện ${loai}: ${error.message}`);
    } catch (e) { ghi(`không đếm được sự kiện ${loai}: ${e instanceof Error ? e.message : String(e)}`); }
  };

  // ---- Echo: tin Trang gửi đi -----------------------------------------------
  if (sk.loai === 'echo') {
    const cuaBot = sk.metadata === META_API.metadataBot || (!!bm.appId && sk.appId === bm.appId);
    if (cuaBot) return;
    // Người trực Trang vừa trả lời khách → bot im cho khách này.
    const { error } = await may.rpc('mess_luu_phien', {
      p_psid_bam: psidBam, p_buoc: null, p_du_lieu: null, p_tam_dung_phut: phutTamDungNho,
    });
    if (error) ghi(`không tạm dừng được bot sau tin nhân viên: ${error.message}`);
    await demSuKien('nhan_vien_tra_loi');
    return;
  }

  // ---- Sự kiện của khách: mess_lay_phien đúng một lần ------------------------
  const { data, error } = await may.rpc('mess_lay_phien', { p_psid_bam: psidBam });
  if (error) {
    ghi(`không đọc được phiên: ${error.message}`);
    // Báo khách TRƯỚC: đếm sự kiện cũng là một lời gọi database đang hỏng (có thể chờ hết hạn giờ).
    await baoTrucTrac(sk, bm, pt, ghi);
    await demSuKien('loi', `mess_lay_phien: ${error.message}`);
    return 'db_hong';
  }
  const lp = (data ?? {}) as KetQuaLayPhien;
  const phut = Number.isInteger(lp.phut_tam_dung) && Number(lp.phut_tam_dung) > 0 ? Number(lp.phut_tam_dung) : 60;
  phutTamDungNho = phut;
  dangBatNho = lp.dang_bat === true;
  if (lp.dang_bat !== true) return;               // bot tắt → im
  if (lp.phien?.dang_tam_dung === true) return;   // nhân viên đang trực → im

  const gui = async (body: Record<string, unknown>) => goiMeta(META_API.urlGuiTin, bm.pageToken!, body, fetchFn);
  const dg = await gui(thanDangGo(sk.psid));
  if (!dg.ok) ghi(`không gửi được "đang gõ": ${dg.cau}`);

  const nc: NguCanh = {
    bayGio: (pt.bayGio ?? Date.now)(),
    loiChao: String(lp.loi_chao ?? ''),
    phutTamDung: phut,
    biKhoa: lp.phien?.bi_khoa === true,
    capNhat: lp.phien?.cap_nhat ?? null,
    web: bm.web,
  };
  let phien: PhienBot | null = lp.phien && typeof lp.phien.buoc === 'string'
    ? { buoc: lp.phien.buoc, duLieu: (lp.phien.du_lieu ?? {}) as PhienBot['duLieu'] }
    : null;

  const anon = (() => { try { return pt.taoClientAnon ? pt.taoClientAnon() : taoClient(); } catch { return null; } })();
  const chiNhanhMa = pt.chiNhanhMa ?? maChiNhanh();

  const thucHien = async (g: YeuCauGoi): Promise<KetQuaGoi> => {
    if (!anon) {
      ghi('chưa nối database (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY) — không đọc / ghi được đặt bàn');
      if (g.goi === 'tao_dat_ban') return { goi: 'tao_dat_ban', ok: false };
      if (g.goi === 'huy') return { goi: 'huy', ok: false };
      return { goi: g.goi, ok: false, muc: g.goi === 'thong_tin' ? g.muc : undefined };
    }
    switch (g.goi) {
      case 'lich_trong': {
        const r = await docLichTrong(anon, chiNhanhMa, g.ngay);
        if (!r.ok) { ghi(`không đọc được lịch trống: ${r.loi}`); return { goi: 'lich_trong', ok: false }; }
        return { goi: 'lich_trong', ok: true, khung: r.khung };
      }
      case 'tao_dat_ban': {
        // Chốt theo khách TRƯỚC khi gửi: chặn gửi trùng (Meta giao lặp / bấm hai lần chạy song
        // song ở hai isolate) và giới hạn số lần gửi mỗi ngày. Không xin được → không gửi.
        const xin = await xinDatBan(may, psidBam, ghi);
        if (xin !== 'ok') return { goi: 'tao_dat_ban', ok: false, gioiHan: xin === 'loi' ? undefined : xin };
        const r = await taoDatBanMess(anon, { chiNhanhMa, ngay: g.ngay, gio: g.gio, soKhach: g.soKhach, hoTen: g.hoTen, sdt: g.sdt });
        if (!r.ok) ghi(r.khongChac ? 'tao_dat_ban không trả lời — không chắc đã ghi' : `tao_dat_ban từ chối: ${r.loi ?? ''}`);
        return r.ok ? { goi: 'tao_dat_ban', ok: true, ma: r.ma } : { goi: 'tao_dat_ban', ok: false, loi: r.loi, khongChac: r.khongChac };
      }
      case 'tra_cuu': {
        const r = await traCuuMess(anon, g.ma, g.sdt);
        if (!r.ok) { ghi(`không tra cứu được: ${r.loi}`); return { goi: 'tra_cuu', ok: false }; }
        const thay = !!r.dong;
        await ghiNhatKyTraCuuMess(anon, g.ma, thay);
        const biKhoa = await ghiTraCuu(may, psidBam, thay, ghi);
        return { goi: 'tra_cuu', ok: true, dong: r.dong, biKhoa };
      }
      case 'huy': {
        const r = await huyDatBanMess(anon, g.ma, g.sdt);
        // huy_dat_ban tự ghi nhật ký tra cứu. Lỗi (database: tìm thấy nhưng không hủy được
        // nữa; hoặc đứt mạng) không phải một lần đoán sai → không ghi lượt sai.
        if (!r.ok) { ghi(`huy_dat_ban: ${r.loi}`); return { goi: 'huy', ok: false, loi: r.loi }; }
        const biKhoa = await ghiTraCuu(may, psidBam, r.daHuy, ghi);
        return { goi: 'huy', ok: true, daHuy: r.daHuy, biKhoa };
      }
      case 'thong_tin': {
        const r = await docThongTinCongKhai(anon, chiNhanhMa);
        if (!r.ok) { ghi(`không đọc được nội dung công khai: ${r.loi}`); return { goi: 'thong_tin', ok: false, muc: g.muc }; }
        return { goi: 'thong_tin', ok: true, muc: g.muc, tt: r.tt };
      }
    }
  };

  const tin: Tin[] = [];
  const dem: LoaiDem[] = [];
  let tamDung = false;
  let khongLuu = false;
  let vao: DauVao = sk;
  for (let i = 0; i < 5; i++) {
    const r = buocTiep(phien, vao, nc);
    tin.push(...r.tin);
    dem.push(...r.dem);
    tamDung = tamDung || !!r.tamDung;
    khongLuu = !!r.khongLuu;
    phien = r.phien;
    if (!r.goi) break;
    const kq = await thucHien(r.goi);
    if ((kq.goi === 'tra_cuu' || kq.goi === 'huy') && kq.ok) nc.biKhoa = kq.biKhoa;
    vao = { loai: 'ket_qua', kq };
  }

  if (phien && !khongLuu) {
    const { error: e2 } = await may.rpc('mess_luu_phien', {
      p_psid_bam: psidBam, p_buoc: phien.buoc, p_du_lieu: phien.duLieu, p_tam_dung_phut: tamDung ? phut : null,
    });
    if (e2) { ghi(`không lưu được phiên: ${e2.message}`); dem.push('loi'); }
  }
  for (const loai of dem) await demSuKien(loai);

  for (const t of tin) {
    const r = await gui(thanTin(sk.psid, t));
    if (!r.ok) {
      ghi(`Send API từ chối: ${r.cau}`);
      await demSuKien('loi', `Send API: ${r.cau}`);
      break;
    }
  }
}

/**
 * mess_xin_dat_ban (0053) ngay trước tao_dat_ban: 'ok' = được gửi; 'dang_gui' = vừa có
 * một lần gửi cho khách này trong vài giây (sự kiện lặp / song song); 'qua_luot' = hết
 * DAT_BAN_TOI_DA_NGAY lần trong ngày; 'loi' = không hỏi được database → không gửi.
 */
async function xinDatBan(may: SupabaseClient, psidBam: string, ghi: (c: string) => void): Promise<'ok' | 'dang_gui' | 'qua_luot' | 'loi'> {
  try {
    const { data, error } = await may.rpc('mess_xin_dat_ban', { p_psid_bam: psidBam });
    if (error) { ghi(`không xin được lượt đặt bàn: ${error.message}`); return 'loi'; }
    const d = data as { ok?: boolean; ly_do?: string } | null;
    if (d?.ok === true) return 'ok';
    if (d?.ly_do === 'dang_gui' || d?.ly_do === 'qua_luot') {
      ghi(d.ly_do === 'dang_gui' ? 'bỏ lần gửi đặt bàn trùng (vừa gửi vài giây trước)' : 'khách đã hết lượt gửi đặt bàn hôm nay');
      return d.ly_do;
    }
    return 'loi';
  } catch (e) { ghi(`không xin được lượt đặt bàn: ${e instanceof Error ? e.message : String(e)}`); return 'loi'; }
}

/** mess_ghi_tra_cuu sau mỗi lần tra / hủy theo mã + SĐT khách gõ → đang bị khóa chưa. */
async function ghiTraCuu(may: SupabaseClient, psidBam: string, thanhCong: boolean, ghi: (c: string) => void): Promise<boolean> {
  try {
    const { data, error } = await may.rpc('mess_ghi_tra_cuu', { p_psid_bam: psidBam, p_thanh_cong: thanhCong });
    if (error) { ghi(`không ghi được lượt tra cứu: ${error.message}`); return false; }
    return (data as { bi_khoa?: boolean } | null)?.bi_khoa === true;
  } catch (e) { ghi(`không ghi được lượt tra cứu: ${e instanceof Error ? e.message : String(e)}`); return false; }
}

// -----------------------------------------------------------------------------
// CÀI NÚT BẮT ĐẦU + LỜI CHÀO + MENU CỐ ĐỊNH (màn /noi-bo/messenger, chỉ chủ)
// -----------------------------------------------------------------------------
export interface KetQuaCaiMenu { ok: boolean; cau: string; cauEn: string }

export async function caiHoSoMessenger(
  loiChao: string, pt: { env?: Env; fetchFn?: typeof fetch; ghiLog?: (c: string) => void } = {},
): Promise<KetQuaCaiMenu> {
  const bm = await layBiMatMess(pt.env);
  if (!bm.pageToken) {
    return { ok: false, cau: `Máy chủ chưa cài bí mật ${TEN_BI_MAT_MESS.pageToken}.`, cauEn: `The server secret ${TEN_BI_MAT_MESS.pageToken} is not set.` };
  }
  const r = await goiMeta(META_API.urlHoSo, bm.pageToken, thanHoSo(loiChao), pt.fetchFn ?? fetch);
  if (!r.ok) {
    const cau = xoaBiMat(r.cau, bm.pageToken, bm.appSecret);
    try { (pt.ghiLog ?? console.log)(`[Messenger] cài menu thất bại: ${cau}`); } catch { /* bỏ qua */ }
    return { ok: false, cau: `Meta từ chối: ${cau}`, cauEn: `Meta refused: ${cau}` };
  }
  const ketQua = (r.data as { result?: string } | null)?.result;
  if (ketQua !== 'success') {
    return { ok: false, cau: 'Meta không báo "success" — kiểm tra lại quyền pages_messaging của token.', cauEn: 'Meta did not report "success" — check the token has pages_messaging.' };
  }
  return {
    ok: true,
    cau: 'Đã cài nút Bắt đầu, lời chào và menu Messenger. Mở Messenger trên điện thoại để xem (có thể phải xóa hội thoại cũ).',
    cauEn: 'The Get Started button, greeting and Messenger menu are installed. Open Messenger on a phone to check (you may need to delete the old conversation).',
  };
}
