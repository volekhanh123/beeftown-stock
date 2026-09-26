/**
 * KHO — ĐỒNG BỘ BÁN HÀNG iPOS (GĐ7a; GĐ7c, migration 0042) — phần I/O
 *
 * iPOS TỰ ĐẨY hóa đơn sang (callback, lib/kho/ipos-hook.ts) — không có API kéo
 * hóa đơn. File này lo phần còn lại, một lượt:
 *   kho_ipos_bat_dau → kho_ipos_nhan([]) (thử lại hàng chờ: dòng chưa khớp /
 *   thiếu hàng) → đọc thực đơn GET /v2/items khi tới hạn (mỗi ~1 giờ, iPOS báo
 *   thực đơn đổi, hoặc bấm tay) → kho_ipos_luu_menu → kho_ipos_ket_thuc.
 * Mọi quyết định trừ kho nằm trong database.
 *
 * Hai lối vào:
 *   · `dongBoIpos({ supabase, chiNhanhId, nguon: 'tay' })` — nút "Cập nhật ngay"
 *     ở /noi-bo/kho/cai-dat/ipos, chạy bằng PHIÊN NGƯỜI BẤM (quyền dong_bo_ban).
 *   · `dongBoTatCa(env)` — Cron Trigger (src/worker.ts): đăng nhập tài khoản
 *     máy vai `may_ipos` bằng client anon RIÊNG (không lưu phiên, không giữ
 *     refresh token), chạy mọi chi nhánh máy được đồng bộ, rồi đăng xuất.
 *
 * BÍ MẬT (bí mật Worker, KHÔNG đặt trong wrangler.toml / .env / repo):
 *   IPOS_ACCESS_TOKEN — token API iPOS (chỉ để đọc thực đơn) · KHO_IPOS_EMAIL,
 *   KHO_IPOS_MAT_KHAU — tài khoản máy · IPOS_CALLBACK_KHOA — khóa bí mật trong
 *   địa chỉ nhận hóa đơn. Đọc: tham số `env` → `cloudflare:workers` →
 *   process.env (chạy thử bằng Node). Thiếu → phần đó tắt, không lỗi gì khác.
 *
 * TOKEN KHÔNG BAO GIỜ rời khỏi hàm gọi iPOS: không vào database, không vào log,
 * không vào câu trả về trang — mọi câu lỗi đi qua `xoaToken`.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { TRUONG_IPOS, phanTichMenu, taoUrlMenu, xoaToken, type NoiIpos } from './ipos.ts';

// -----------------------------------------------------------------------------
// BÍ MẬT
// -----------------------------------------------------------------------------
export interface BiMatIpos {
  token?: string;
  email?: string;
  matKhau?: string;
  khoaCallback?: string;
}

export type Env = Record<string, unknown> | undefined;

export const TEN_BI_MAT = {
  token: 'IPOS_ACCESS_TOKEN', email: 'KHO_IPOS_EMAIL', matKhau: 'KHO_IPOS_MAT_KHAU', khoaCallback: 'IPOS_CALLBACK_KHOA',
} as const;

/** Khóa callback phải dài ít nhất chừng này (ngẫu nhiên). */
export const KHOA_TOI_THIEU = 32;

async function envWorker(): Promise<Env> {
  try {
    // @ts-ignore — dự án không cài kiểu của workerd; module này chỉ có trên Worker.
    const m = await import('cloudflare:workers');
    return (m as { env?: Record<string, unknown> })?.env;
  } catch { return undefined; }
}

function docChuoi(ten: string, ...nguon: Env[]): string | undefined {
  for (const n of nguon) {
    const v = n?.[ten];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

const envNode = (): Env => (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

/** Đọc bí mật iPOS. Không có → undefined; không bao giờ ném lỗi. */
export async function layBiMatIpos(env?: Env): Promise<BiMatIpos> {
  const w = await envWorker();
  const p = envNode();
  return {
    token: docChuoi(TEN_BI_MAT.token, env, w, p),
    email: docChuoi(TEN_BI_MAT.email, env, w, p),
    matKhau: docChuoi(TEN_BI_MAT.matKhau, env, w, p),
    khoaCallback: docChuoi(TEN_BI_MAT.khoaCallback, env, w, p),
  };
}

export interface TrangThaiBiMat {
  token: boolean;
  taiKhoanMay: boolean;
  /** Khóa callback đã cài và đủ dài. */
  khoaCallback: boolean;
}

/** Cho màn Kết nối iPOS: đã cài bí mật nào — chỉ CÓ / KHÔNG, không bao giờ giá trị. */
export async function trangThaiBiMatIpos(env?: Env): Promise<TrangThaiBiMat> {
  const b = await layBiMatIpos(env);
  return {
    token: !!b.token,
    taiKhoanMay: !!(b.email && b.matKhau),
    khoaCallback: !!b.khoaCallback && b.khoaCallback.length >= KHOA_TOI_THIEU,
  };
}

/**
 * Khóa callback — CHỈ gọi cho chủ nhà hàng (màn Kết nối iPOS hiện địa chỉ đầy
 * đủ để dán vào CMS iPOS). Chưa cài / quá ngắn → undefined.
 */
export async function layKhoaCallback(env?: Env): Promise<string | undefined> {
  const k = (await layBiMatIpos(env)).khoaCallback;
  return k && k.length >= KHOA_TOI_THIEU ? k : undefined;
}

// -----------------------------------------------------------------------------
// TÀI KHOẢN MÁY may_ipos
// -----------------------------------------------------------------------------
function layBienCong(ten: string, env: Env): string | undefined {
  const v = (import.meta as { env?: Record<string, unknown> }).env?.[ten];
  if (typeof v === 'string' && v) return v;
  return docChuoi(ten, env, envNode());
}

export interface PhuThuocMay {
  /** Tạo client Supabase (test thay bằng client giả). */
  taoClient?: () => SupabaseClient;
  fetchFn?: typeof fetch;
  ghiLog?: (cau: string) => void;
}

export type KetQuaDangNhap =
  | { ok: true; client: SupabaseClient; dangXuat: () => Promise<void>; /** Phiên hết hạn lúc (ms), nếu biết. */ hetLuc?: number }
  | { ok: false; cau: string; chuaCai: boolean };

/**
 * Đăng nhập tài khoản máy may_ipos bằng client anon RIÊNG (không lưu phiên,
 * không tự làm mới). Dùng xong PHẢI gọi `dangXuat()`.
 */
export async function dangNhapMayIpos(bm: BiMatIpos, env: Env, phuThuoc: PhuThuocMay = {}): Promise<KetQuaDangNhap> {
  if (!bm.email || !bm.matKhau) {
    return { ok: false, chuaCai: true, cau: `chưa cài ${TEN_BI_MAT.email} / ${TEN_BI_MAT.matKhau}` };
  }
  let client: SupabaseClient;
  if (phuThuoc.taoClient) client = phuThuoc.taoClient();
  else {
    const url = layBienCong('PUBLIC_SUPABASE_URL', env);
    const anon = layBienCong('PUBLIC_SUPABASE_ANON_KEY', env);
    if (!url || !anon) return { ok: false, chuaCai: true, cau: 'chưa nối database' };
    client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  let hetLuc: number | undefined;
  try {
    const { data, error } = await client.auth.signInWithPassword({ email: bm.email, password: bm.matKhau });
    if (error || !data?.session) {
      return { ok: false, chuaCai: false, cau: `tài khoản máy không đăng nhập được: ${error?.message ?? 'không có phiên'}` };
    }
    const het = Number((data.session as { expires_at?: number }).expires_at);
    if (Number.isFinite(het) && het > 0) hetLuc = het * 1000;
  } catch (e) {
    return { ok: false, chuaCai: false, cau: `tài khoản máy không đăng nhập được: ${e instanceof Error ? e.message : String(e)}` };
  }
  return {
    ok: true, client, hetLuc,
    // Thu hồi phiên vừa cấp — không giữ refresh token nào của máy.
    dangXuat: async () => { try { await client.auth.signOut({ scope: 'local' }); } catch { /* bỏ qua */ } },
  };
}

/**
 * Phiên máy dùng lại cho hook nhận hóa đơn (GĐ7c). Mỗi hóa đơn một lần đăng
 * nhập thì giờ cao điểm dễ chạm giới hạn đăng nhập của Supabase Auth (mặc định
 * ~30 lần / 5 phút / IP) → hóa đơn bị từ chối. Nên giữ phiên trong BỘ NHỚ của
 * isolate Worker (không ghi đâu cả, mất khi isolate tắt) tới 2 phút trước khi
 * hết hạn; hết thì đăng xuất phiên cũ, đăng nhập lại.
 */
let phienNho: { email: string; client: SupabaseClient; hetLuc: number } | null = null;
const NHO_TRUOC_HET_MS = 120_000;

/** Bỏ phiên đang nhớ (lỗi database lạ — lần sau đăng nhập lại). */
export function quenPhienMay(): void { phienNho = null; }

export async function dangNhapMayIposNho(
  bm: BiMatIpos, env: Env, phuThuoc: PhuThuocMay = {}, bayGio = Date.now(),
): Promise<KetQuaDangNhap> {
  const khongLam = async () => { /* phiên còn dùng lại — không đăng xuất */ };
  if (phienNho && phienNho.email === bm.email && phienNho.hetLuc - NHO_TRUOC_HET_MS > bayGio) {
    return { ok: true, client: phienNho.client, dangXuat: khongLam, hetLuc: phienNho.hetLuc };
  }
  const cu = phienNho;
  phienNho = null;
  if (cu) { try { await cu.client.auth.signOut({ scope: 'local' }); } catch { /* bỏ qua */ } }
  const dn = await dangNhapMayIpos(bm, env, phuThuoc);
  if (!dn.ok) return dn;
  // Không biết hạn phiên → không nhớ, dùng một lần rồi đăng xuất như cũ.
  if (!dn.hetLuc || !bm.email) return dn;
  phienNho = { email: bm.email, client: dn.client, hetLuc: dn.hetLuc };
  return { ...dn, dangXuat: khongLam };
}

// -----------------------------------------------------------------------------
// MỘT LƯỢT: thử lại hàng chờ + làm mới thực đơn
// -----------------------------------------------------------------------------
export interface TomTatNhan {
  hd_moi: number; hd_trung: number; hd_sua: number; hd_huy: number; hd_loi: number;
  so_dong: number; dong: Record<string, number>;
}

export interface KetQuaMenu {
  so_mon: number; moi: number; bo: number; dat_ten: number;
}

export interface KetQuaDongBo {
  ok: boolean;
  /** Câu tiếng Việt cho người đọc — đã xóa token. */
  cau: string;
  /** Thiếu bí mật IPOS_ACCESS_TOKEN — không đọc được thực đơn (hàng chờ vẫn thử lại). */
  chuaCai?: boolean;
  /** Database từ chối bắt đầu (chưa bật, đang chạy, vừa chạy...) — không phải lỗi. */
  tuChoi?: boolean;
  tomTat?: TomTatNhan;
  menu?: KetQuaMenu;
  canhBao?: string[];
}

export interface ThamSoDongBo {
  supabase: SupabaseClient;
  chiNhanhId: string;
  nguon: 'cron' | 'tay';
  env?: Env;
  fetchFn?: typeof fetch;
  /** Ép đọc thực đơn (mặc định: bấm tay, iPOS báo đổi, hoặc quá MENU_MOI_PHUT). */
  docMenu?: boolean;
}

/** Thực đơn cũ hơn chừng này (phút) thì lượt cron đọc lại. */
export const MENU_MOI_PHUT = 60;

async function goiIpos(url: string, fetchFn: typeof fetch): Promise<unknown> {
  const huy = new AbortController();
  const hen = setTimeout(() => huy.abort(), TRUONG_IPOS.timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetchFn(url, { headers: { accept: 'application/json' }, signal: huy.signal });
    } catch (e) {
      if (huy.signal.aborted) throw new Error(`iPOS không trả lời sau ${TRUONG_IPOS.timeoutMs / 1000} giây`);
      throw e;
    }
    if (!res.ok) throw new Error(`iPOS trả lỗi HTTP ${res.status}`);
    const chu = await res.text();
    try { return JSON.parse(chu); } catch { throw new Error('iPOS trả về nội dung không phải JSON'); }
  } finally {
    clearTimeout(hen);
  }
}

/** Tới lúc đọc lại thực đơn chưa. */
export function canDocMenu(o: { menu_luc?: string | null; menu_can_lam_moi?: boolean | null }, bayGio = Date.now()): boolean {
  if (o.menu_can_lam_moi) return true;
  if (!o.menu_luc) return true;
  const t = new Date(o.menu_luc).getTime();
  return Number.isNaN(t) || bayGio - t >= MENU_MOI_PHUT * 60_000;
}

/** Câu tóm tắt một lượt tốt. */
export function cauTomTat(t: TomTatNhan | undefined, menu?: KetQuaMenu | null): string {
  const phan: string[] = [];
  const d = t?.dong ?? {};
  const soThu = Object.values(d).reduce((a, b) => a + (Number(b) || 0), 0);
  if (!soThu) phan.push('không có dòng nào đang chờ');
  else {
    phan.push(`thử lại ${soThu} dòng đang chờ: ${d.da_ghi ?? 0} đã trừ kho`);
    const cho = (d.chua_khop ?? 0) + (d.thieu_hang ?? 0);
    if (cho) phan.push(`${cho} vẫn chờ xử lý`);
    if (d.loi) phan.push(`${d.loi} lỗi`);
  }
  if (menu) phan.push(`thực đơn iPOS ${menu.so_mon} món${menu.moi ? ` (${menu.moi} món mới)` : ''}`);
  return `Đã cập nhật: ${phan.join(', ')}.`;
}

/**
 * Một lượt cho một chi nhánh. Không bao giờ ném lỗi: mọi lỗi thành
 * `{ ok: false, cau }` với câu đã xóa token.
 */
export async function dongBoIpos({ supabase, chiNhanhId, nguon, env, fetchFn, docMenu }: ThamSoDongBo): Promise<KetQuaDongBo> {
  const { token } = await layBiMatIpos(env);
  const goi = fetchFn ?? fetch;

  let lanId: string | undefined;
  try {
    const { data: bd, error: e1 } = await supabase.rpc('kho_ipos_bat_dau', {
      p_chi_nhanh_id: chiNhanhId, p_nguon: nguon,
    });
    if (e1) return { ok: false, cau: xoaToken(e1.message, token) };
    const b = bd as ({ duoc: boolean; ly_do?: string; lan_id?: string; menu_luc?: string | null;
      menu_can_lam_moi?: boolean } & Partial<NoiIpos>) | null;
    if (!b?.duoc || !b.lan_id) return { ok: false, tuChoi: true, cau: b?.ly_do ?? 'Chưa đồng bộ được.' };
    lanId = b.lan_id;

    // ---- 1 · Thử lại hàng chờ (danh sách hóa đơn rỗng) ----------------------
    const { data: n, error: e2 } = await supabase.rpc('kho_ipos_nhan', {
      p_chi_nhanh_id: chiNhanhId, p_lan_id: lanId, p_hoa_don: [], p_den_luc: null,
    });
    if (e2) throw new Error(e2.message);
    const tomTat = n as TomTatNhan;

    // ---- 2 · Thực đơn iPOS (khi tới hạn) -----------------------------------
    const canhBao: string[] = [];
    let menu: KetQuaMenu | null = null;
    let loi: string | null = null;
    const toiHan = docMenu ?? (nguon === 'tay' || canDocMenu(b));
    if (toiHan && !token) {
      canhBao.push(`Chưa cài bí mật ${TEN_BI_MAT.token} — chưa đọc được thực đơn iPOS (hóa đơn vẫn nhận bình thường).`);
    } else if (toiHan && token) {
      const noi: NoiIpos = { api_url: String(b.api_url ?? ''), pos_parent: String(b.pos_parent ?? ''), pos_id: String(b.pos_id ?? '') };
      try {
        const kq = phanTichMenu(await goiIpos(taoUrlMenu(noi, token), goi));
        canhBao.push(...kq.canhBao);
        if (kq.loi) loi = kq.loi;
        else if (kq.mon.length === 0) canhBao.push('iPOS trả thực đơn rỗng — giữ thực đơn cũ.');
        else {
          const { data: m, error: e3 } = await supabase.rpc('kho_ipos_luu_menu', {
            p_chi_nhanh_id: chiNhanhId, p_mon: kq.mon,
          });
          if (e3) throw new Error(e3.message);
          menu = m as KetQuaMenu;
        }
      } catch (e) {
        loi = `Không đọc được thực đơn iPOS: ${e instanceof Error ? e.message : String(e)}`;
      }
      if (loi) loi = xoaToken(loi, token).slice(0, 300);
    }

    await supabase.rpc('kho_ipos_ket_thuc', { p_lan_id: lanId, p_loi: loi });
    const cau = loi ? `${cauTomTat(tomTat, null)} ${loi}` : cauTomTat(tomTat, menu);
    return { ok: !loi, cau, tomTat, menu: menu ?? undefined, canhBao, chuaCai: !token || undefined };
  } catch (e) {
    const cau = xoaToken(`Không đồng bộ được iPOS: ${e instanceof Error ? e.message : String(e)}`, token);
    if (lanId) {
      try { await supabase.rpc('kho_ipos_ket_thuc', { p_lan_id: lanId, p_loi: cau.slice(0, 300) }); }
      catch { /* database sẽ tự coi lượt là hỏng sau 10 phút */ }
    }
    return { ok: false, cau };
  }
}

// -----------------------------------------------------------------------------
// CRON — mọi chi nhánh, bằng tài khoản máy may_ipos
// -----------------------------------------------------------------------------
export type PhuThuocCron = PhuThuocMay;

/**
 * Chạy từ `scheduled` của Worker. Không bao giờ ném lỗi. Trả danh sách câu
 * đã ghi log (đã xóa token) — để test đọc.
 */
export async function dongBoTatCa(env?: Env, phuThuoc: PhuThuocCron = {}): Promise<string[]> {
  const log: string[] = [];
  const bm = await layBiMatIpos(env);
  const ghi = (c: string) => {
    const s = xoaToken(`[iPOS] ${c}`, bm.token);
    log.push(s);
    (phuThuoc.ghiLog ?? console.log)(s);
  };

  const dn = await dangNhapMayIpos(bm, env, phuThuoc);
  if (!dn.ok) { ghi(`${dn.cau} — bỏ qua`); return log; }
  const client = dn.client;
  try {
    const { data: ds, error: e1 } = await client.rpc('kho_cn_duoc', { p_viec: 'dong_bo_ban' });
    if (e1) { ghi(`không đọc được chi nhánh: ${e1.message}`); return log; }
    const chiNhanh = (Array.isArray(ds) ? ds : []) as string[];
    if (chiNhanh.length === 0) ghi('tài khoản máy không có chi nhánh nào được đồng bộ (vai phải là may_ipos)');

    for (const cn of chiNhanh) {
      const kq = await dongBoIpos({ supabase: client, chiNhanhId: cn, nguon: 'cron', env, fetchFn: phuThuoc.fetchFn });
      // Chưa bật ở chi nhánh này = bình thường, không cần log.
      if (kq.tuChoi && /chưa bật/i.test(kq.cau)) continue;
      ghi(`${cn.slice(0, 8)}: ${kq.cau}`);
    }
  } catch (e) {
    ghi(`lỗi: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    await dn.dangXuat();
  }
  return log;
}
