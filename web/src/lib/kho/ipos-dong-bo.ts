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
 *     máy vai `may_ipos` bằng client anon RIÊNG (dangNhapMay, lib/tai-khoan-may.ts:
 *     không lưu phiên, không giữ refresh token, mỗi lời gọi Supabase tối đa
 *     HET_GIO_SUPABASE_IPOS_MS), chạy mọi chi nhánh máy được đồng bộ, rồi đăng xuất.
 * kho_ipos_ket_thuc hỏng (gọi lại một lần vẫn hỏng) → lượt KHÔNG báo xong: khóa
 * lượt giữ tới 10 phút và nhật ký thiếu lượt này — câu trả về nói ra.
 *
 * BÍ MẬT (bí mật Worker, KHÔNG đặt trong wrangler.toml / .env / repo):
 *   IPOS_ACCESS_TOKEN — token API iPOS (chỉ để đọc thực đơn) · KHO_IPOS_EMAIL,
 *   KHO_IPOS_MAT_KHAU — tài khoản máy · IPOS_CALLBACK_KHOA — khóa bí mật trong
 *   địa chỉ nhận hóa đơn. Đọc: tham số `env` → `cloudflare:workers` →
 *   process.env (chạy thử bằng Node). Thiếu → phần đó tắt, không lỗi gì khác.
 *
 * TOKEN KHÔNG BAO GIỜ rời khỏi hàm gọi iPOS: không vào database, không vào log,
 * không vào câu trả về trang — mọi câu lỗi đi qua `xoaToken`.
 *
 * HAI THỨ TIẾNG: kết quả một lượt hiện trên màn Kết nối iPOS nên có bản tiếng
 * Anh (KetQuaDongBo.cauEn, canhBaoEn); nhật ký lượt trong database chỉ giữ tiếng
 * Việt — dichLoiIpos() dịch lại lúc hiện. Log của cron (dongBoTatCa) và câu
 * đăng nhập máy (chỉ vào log) giữ tiếng Việt cho người vận hành — test đọc
 * nguyên văn.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { envNode, envWorker, docChuoi, type Env } from '../bien-moi-truong.ts';
import { dangNhapMay, taoPhienMayNho, type KetQuaDangNhapMay, type ThamSoDangNhapMay } from '../tai-khoan-may.ts';
import { CAU_MENU_IPOS, TRUONG_IPOS, phanTichMenu, taoUrlMenu, xoaToken, type NoiIpos } from './ipos.ts';
import type { HaiThuTieng, NgonNguNB } from './chung.ts';
import { dichCau } from '../cau-noi-bo.ts';

// -----------------------------------------------------------------------------
// BÍ MẬT
// -----------------------------------------------------------------------------
export interface BiMatIpos {
  token?: string;
  email?: string;
  matKhau?: string;
  khoaCallback?: string;
}

export type { Env };

export const TEN_BI_MAT = {
  token: 'IPOS_ACCESS_TOKEN', email: 'KHO_IPOS_EMAIL', matKhau: 'KHO_IPOS_MAT_KHAU', khoaCallback: 'IPOS_CALLBACK_KHOA',
} as const;

/** Khóa callback phải dài ít nhất chừng này (ngẫu nhiên). */
export const KHOA_TOI_THIEU = 32;

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
/** Hạn giờ mỗi lời gọi Supabase của máy iPOS (ms) — cron và hook nhận hóa đơn. */
export const HET_GIO_SUPABASE_IPOS_MS = 20_000;

export interface PhuThuocMay {
  /** Tạo client Supabase (test thay bằng client giả). */
  taoClient?: () => SupabaseClient;
  /** fetch gọi iPOS (đọc thực đơn). */
  fetchFn?: typeof fetch;
  /** fetch đi Supabase của client máy (test: fetch giả treo / lỗi). Mặc định fetch toàn cục. */
  fetchSupabase?: typeof fetch;
  /** Hạn giờ mỗi lời gọi Supabase (ms). Mặc định HET_GIO_SUPABASE_IPOS_MS. */
  hetGioSupabaseMs?: number;
  ghiLog?: (cau: string) => void;
}

export type KetQuaDangNhap = KetQuaDangNhapMay;

function thamSoMay(bm: BiMatIpos, env: Env, phuThuoc: PhuThuocMay): ThamSoDangNhapMay {
  return {
    email: bm.email, matKhau: bm.matKhau, tenBiMat: TEN_BI_MAT, nhan: 'tài khoản máy', env,
    taoClient: phuThuoc.taoClient, fetchGoc: phuThuoc.fetchSupabase, goiMs: phuThuoc.hetGioSupabaseMs ?? HET_GIO_SUPABASE_IPOS_MS,
  };
}

/**
 * Đăng nhập tài khoản máy may_ipos (dangNhapMay: client anon RIÊNG, không lưu phiên, không tự
 * làm mới, mỗi lời gọi có hạn giờ). Dùng xong PHẢI gọi `dangXuat()`.
 */
export function dangNhapMayIpos(bm: BiMatIpos, env: Env, phuThuoc: PhuThuocMay = {}): Promise<KetQuaDangNhap> {
  return dangNhapMay(thamSoMay(bm, env, phuThuoc));
}

/**
 * Phiên máy dùng lại cho hook nhận hóa đơn (GĐ7c): mỗi hóa đơn một lần đăng nhập thì giờ cao
 * điểm dễ chạm giới hạn đăng nhập của Supabase Auth → hóa đơn bị từ chối. taoPhienMayNho giữ
 * phiên trong bộ nhớ isolate tới 2 phút trước khi hết hạn — riêng của iPOS.
 */
const phienIpos = taoPhienMayNho();

/** Bỏ phiên đang nhớ (lỗi database lạ — lần sau đăng nhập lại). */
export function quenPhienMay(): void { phienIpos.quen(); }

export function dangNhapMayIposNho(
  bm: BiMatIpos, env: Env, phuThuoc: PhuThuocMay = {}, bayGio = Date.now(),
): Promise<KetQuaDangNhap> {
  return phienIpos.dangNhap(thamSoMay(bm, env, phuThuoc), bayGio);
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
  /** Bản tiếng Anh của cau (đã xóa token). Vắng khi câu là của database — trang tra dichCau. */
  cauEn?: string;
  /** Thiếu bí mật IPOS_ACCESS_TOKEN — không đọc được thực đơn (hàng chờ vẫn thử lại). */
  chuaCai?: boolean;
  /** Database từ chối bắt đầu (chưa bật, đang chạy, vừa chạy...) — không phải lỗi. */
  tuChoi?: boolean;
  tomTat?: TomTatNhan;
  menu?: KetQuaMenu;
  canhBao?: string[];
  /** Bản tiếng Anh của canhBao, cùng thứ tự. */
  canhBaoEn?: string[];
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

/** Câu có một chỗ thay, ở hai thứ tiếng. */
type CauMau = { vi: (x: string) => string; en: (x: string) => string };

/**
 * Câu của một lượt, hai thứ tiếng. Bản tiếng Việt đi vào câu trả về và nhật ký
 * lượt (kho_ipos_lan_chay.loi); dichLoiIpos() đọc ngược nhật ký cho màn tiếng Anh.
 */
const CAU_LUOT = {
  khongTraLoi: {
    vi: (giay: string) => `iPOS không trả lời sau ${giay} giây`,
    en: (giay: string) => `iPOS did not answer within ${giay} seconds`,
  },
  loiHttp: { vi: (ma: string) => `iPOS trả lỗi HTTP ${ma}`, en: (ma: string) => `iPOS returned an HTTP ${ma} error` },
  khongJson: { vi: 'iPOS trả về nội dung không phải JSON', en: 'iPOS returned something that is not JSON' },
  docMenu: { vi: (x: string) => `Không đọc được thực đơn iPOS: ${x}`, en: (x: string) => `Could not read the iPOS menu: ${x}` },
  dongBo: { vi: (x: string) => `Không đồng bộ được iPOS: ${x}`, en: (x: string) => `Could not sync iPOS: ${x}` },
  chuaDongBo: { vi: 'Chưa đồng bộ được.', en: 'Could not sync yet.' },
  chuaKetThuc: {
    vi: (x: string) => `Nhưng chưa ghi được kết thúc lượt (${x}) — lượt sau có thể phải chờ tới 10 phút.`,
    en: (x: string) => `But could not record the end of this run (${x}) — the next run may have to wait up to 10 minutes.`,
  },
} satisfies Record<string, CauMau | HaiThuTieng>;

const hai = (c: CauMau, x: string): HaiThuTieng => ({ vi: c.vi(x), en: c.en(x) });

/** Lỗi mang sẵn bản tiếng Anh (e.en); e.message vẫn là câu tiếng Việt như cũ. */
function loiHai(c: HaiThuTieng): Error {
  return Object.assign(new Error(c.vi), { en: c.en });
}

/** Câu của một lỗi ở hai thứ tiếng: lỗi của loiHai có sẵn bản tiếng Anh; lỗi khác tra dichCau. */
function cauCuaLoi(e: unknown): HaiThuTieng {
  const vi = e instanceof Error ? e.message : String(e);
  const en = (e as { en?: unknown } | null)?.en;
  return { vi, en: typeof en === 'string' ? en : dichCau('en', vi) };
}

async function goiIpos(url: string, fetchFn: typeof fetch): Promise<unknown> {
  const huy = new AbortController();
  const hen = setTimeout(() => huy.abort(), TRUONG_IPOS.timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetchFn(url, { headers: { accept: 'application/json' }, signal: huy.signal });
    } catch (e) {
      if (huy.signal.aborted) throw loiHai(hai(CAU_LUOT.khongTraLoi, String(TRUONG_IPOS.timeoutMs / 1000)));
      throw e;
    }
    if (!res.ok) throw loiHai(hai(CAU_LUOT.loiHttp, String(res.status)));
    const chu = await res.text();
    try { return JSON.parse(chu); } catch { throw loiHai(CAU_LUOT.khongJson); }
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
export function cauTomTat(t: TomTatNhan | undefined, menu?: KetQuaMenu | null, nn: NgonNguNB = 'vi'): string {
  const c = (x: HaiThuTieng) => x[nn];
  const phan: string[] = [];
  const d = t?.dong ?? {};
  const soThu = Object.values(d).reduce((a, b) => a + (Number(b) || 0), 0);
  if (!soThu) phan.push(c({ vi: 'không có dòng nào đang chờ', en: 'no lines waiting' }));
  else {
    phan.push(c({
      vi: `thử lại ${soThu} dòng đang chờ: ${d.da_ghi ?? 0} đã trừ kho`,
      en: `retried ${soThu} waiting ${soThu === 1 ? 'line' : 'lines'}: ${d.da_ghi ?? 0} deducted from stock`,
    }));
    const cho = (d.chua_khop ?? 0) + (d.thieu_hang ?? 0);
    if (cho) phan.push(c({ vi: `${cho} vẫn chờ xử lý`, en: `${cho} still waiting` }));
    if (d.loi) phan.push(c({ vi: `${d.loi} lỗi`, en: `${d.loi} ${Number(d.loi) === 1 ? 'error' : 'errors'}` }));
  }
  if (menu) {
    phan.push(c({
      vi: `thực đơn iPOS ${menu.so_mon} món${menu.moi ? ` (${menu.moi} món mới)` : ''}`,
      en: `iPOS menu ${menu.so_mon} ${Number(menu.so_mon) === 1 ? 'dish' : 'dishes'}${menu.moi ? ` (${menu.moi} new)` : ''}`,
    }));
  }
  return c({ vi: `Đã cập nhật: ${phan.join(', ')}.`, en: `Updated: ${phan.join(', ')}.` });
}

/**
 * Câu lỗi của một lượt đọc lại từ database (lan_cuoi_loi, kho_ipos_lan_chay.loi
 * — chỉ tiếng Việt, cắt ≤ 300 ký tự) → ngôn ngữ đang xem. Câu do file này và
 * ipos.ts viết thì dịch ở đây; câu của database (lượt treo, lỗi hàm kho) tra dichCau.
 */
export function dichLoiIpos(cau: string | null | undefined, nn: NgonNguNB = 'vi'): string {
  if (!cau) return '';
  if (nn === 'vi') return cau;
  for (const c of [CAU_LUOT.docMenu, CAU_LUOT.dongBo]) {
    const dau = c.vi('');
    if (cau.startsWith(dau)) return c.en(dichChiTietLoi(cau.slice(dau.length)));
  }
  return dichChiTietLoi(cau);
}

/** Câu lỗi gọi iPOS / đọc thực đơn → tiếng Anh; không nhận ra thì tra dichCau (câu database). */
function dichChiTietLoi(s: string): string {
  const M = CAU_MENU_IPOS;
  for (const c of [CAU_LUOT.khongJson, M.khongObject, M.khongItems]) if (s === c.vi) return c.en;
  // Câu có một chỗ thay: tách phần trước / sau chỗ thay, giữ nguyên giá trị ở giữa.
  const CHO = '\u0000';
  for (const c of [CAU_LUOT.khongTraLoi, CAU_LUOT.loiHttp, M.baoLoi] as CauMau[]) {
    const [dau, cuoi = ''] = c.vi(CHO).split(CHO);
    if (s.length >= dau.length + cuoi.length && s.startsWith(dau) && s.endsWith(cuoi)) {
      return c.en(s.slice(dau.length, s.length - cuoi.length));
    }
  }
  return dichCau('en', s);
}

/**
 * Kết thúc lượt (kho_ipos_ket_thuc): nhả khóa, ghi nhật ký, đèn iPOS. Hỏng thì gọi lại MỘT lần —
 * hàm database gọi lại an toàn (lượt đã kết thúc thì trả da_co). Không bao giờ ném lỗi.
 * Trả câu lỗi (đã xóa token); null = đã ghi. Hỏng hẳn thì khóa lượt giữ tới khi database tự coi
 * lượt là hỏng (10 phút) và nhật ký không có lượt này — nơi gọi KHÔNG được báo xong.
 */
async function ketThucLuot(supabase: SupabaseClient, lanId: string, loi: string | null, token: string | undefined): Promise<string | null> {
  let cuoi = '';
  for (let lan = 0; lan < 2; lan++) {
    try {
      const { error } = await supabase.rpc('kho_ipos_ket_thuc', { p_lan_id: lanId, p_loi: loi });
      if (!error) return null;
      cuoi = error.message;
    } catch (e) {
      cuoi = e instanceof Error ? e.message : String(e);
    }
  }
  return xoaToken(cuoi, token).slice(0, 200);
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
    if (!b?.duoc || !b.lan_id) {
      // Lý do từ chối là câu của database (chưa bật, đang chạy…) — trang tra dichCau.
      const lyDo = b?.ly_do;
      return lyDo != null ? { ok: false, tuChoi: true, cau: lyDo }
        : { ok: false, tuChoi: true, cau: CAU_LUOT.chuaDongBo.vi, cauEn: CAU_LUOT.chuaDongBo.en };
    }
    lanId = b.lan_id;

    // ---- 1 · Thử lại hàng chờ (danh sách hóa đơn rỗng) ----------------------
    const { data: n, error: e2 } = await supabase.rpc('kho_ipos_nhan', {
      p_chi_nhanh_id: chiNhanhId, p_lan_id: lanId, p_hoa_don: [], p_den_luc: null,
    });
    if (e2) throw new Error(e2.message);
    const tomTat = n as TomTatNhan;

    // ---- 2 · Thực đơn iPOS (khi tới hạn) -----------------------------------
    const canhBao: string[] = [];
    const canhBaoEn: string[] = [];
    const canh = (c: HaiThuTieng) => { canhBao.push(c.vi); canhBaoEn.push(c.en); };
    let menu: KetQuaMenu | null = null;
    // loi (tiếng Việt) vào nhật ký lượt và câu trả về; loiEn chỉ cho câu trả về.
    let loi: string | null = null;
    let loiEn: string | null = null;
    const toiHan = docMenu ?? (nguon === 'tay' || canDocMenu(b));
    if (toiHan && !token) {
      canh({
        vi: `Chưa cài bí mật ${TEN_BI_MAT.token} — chưa đọc được thực đơn iPOS (hóa đơn vẫn nhận bình thường).`,
        en: `The ${TEN_BI_MAT.token} secret is not set — the iPOS menu cannot be read yet (invoices are still received as usual).`,
      });
    } else if (toiHan && token) {
      const noi: NoiIpos = { api_url: String(b.api_url ?? ''), pos_parent: String(b.pos_parent ?? ''), pos_id: String(b.pos_id ?? '') };
      try {
        const kq = phanTichMenu(await goiIpos(taoUrlMenu(noi, token), goi));
        canhBao.push(...kq.canhBao);
        canhBaoEn.push(...kq.canhBaoEn);
        if (kq.loi) { loi = kq.loi; loiEn = kq.loiEn; }
        else if (kq.mon.length === 0) canh({ vi: 'iPOS trả thực đơn rỗng — giữ thực đơn cũ.', en: 'iPOS returned an empty menu — keeping the old menu.' });
        else {
          const { data: m, error: e3 } = await supabase.rpc('kho_ipos_luu_menu', {
            p_chi_nhanh_id: chiNhanhId, p_mon: kq.mon,
          });
          if (e3) throw new Error(e3.message);
          menu = m as KetQuaMenu;
        }
      } catch (e) {
        const ct = cauCuaLoi(e);
        loi = CAU_LUOT.docMenu.vi(ct.vi);
        loiEn = CAU_LUOT.docMenu.en(ct.en);
      }
      if (loi) {
        loi = xoaToken(loi, token).slice(0, 300);
        loiEn = xoaToken(loiEn ?? loi, token).slice(0, 300);
      }
    }

    const loiKetThuc = await ketThucLuot(supabase, lanId, loi, token);
    lanId = undefined;   // đã kết thúc (hoặc đã thử hai lần) — nhánh catch không gọi lại
    let cau = loi ? `${cauTomTat(tomTat, null)} ${loi}` : cauTomTat(tomTat, menu);
    let cauEn = loi ? `${cauTomTat(tomTat, null, 'en')} ${loiEn}` : cauTomTat(tomTat, menu, 'en');
    if (loiKetThuc !== null) {
      cau = `${cau} ${CAU_LUOT.chuaKetThuc.vi(loiKetThuc)}`;
      cauEn = `${cauEn} ${CAU_LUOT.chuaKetThuc.en(loiKetThuc)}`;
    }
    return {
      ok: !loi && loiKetThuc === null, cau, cauEn, tomTat, menu: menu ?? undefined, canhBao, canhBaoEn, chuaCai: !token || undefined,
    };
  } catch (e) {
    const ct = cauCuaLoi(e);
    const cau = xoaToken(CAU_LUOT.dongBo.vi(ct.vi), token);
    const cauEn = xoaToken(CAU_LUOT.dongBo.en(ct.en), token);
    // Kết thúc hỏng nữa thì database tự coi lượt là hỏng sau 10 phút — câu đã là câu lỗi.
    if (lanId) await ketThucLuot(supabase, lanId, cau.slice(0, 300), token);
    return { ok: false, cau, cauEn };
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
