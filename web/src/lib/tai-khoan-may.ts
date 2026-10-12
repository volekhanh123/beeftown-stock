/**
 * TÀI KHOẢN MÁY — ĐĂNG NHẬP SUPABASE CHO VIỆC CHẠY NỀN
 * ===================================================
 *
 * Bốn việc chạy nền đăng nhập bằng tài khoản máy riêng của mình: báo động (may_bao_dong,
 * bao-dong.ts), Zalo (may_zalo, zalo-gui.ts), iPOS (may_ipos, kho/ipos-dong-bo.ts — cả hook nhận
 * hóa đơn), Messenger (may_messenger, messenger-hook.ts). Cùng một cách:
 *
 *   client anon RIÊNG (không lưu phiên, không tự làm mới, không đọc URL) → signInWithPassword →
 *   dùng → dangXuat() (thu hồi phiên vừa cấp, không giữ refresh token nào).
 *
 * MỖI LỜI GỌI SUPABASE CÓ HẠN GIỜ (taoFetchCoHan): Supabase treo thì lời gọi hỏng sau goiMs
 * thành `{ error }` như mọi lỗi mạng, không treo tới khi Worker bị giết — lúc đó khóa lượt giữ
 * 10 phút, nhật ký không ghi, khách Messenger không được trả lời. Hạn của từng việc khai ở file
 * của việc đó (Messenger ngắn hơn: ctx.waitUntil chỉ còn khoảng 30 giây sau khi trả 200).
 *
 * NHỚ PHIÊN (taoPhienMayNho) — cho việc bị gọi dồn (hook iPOS mỗi hóa đơn, Messenger mỗi tin):
 * mỗi lần một đăng nhập thì giờ cao điểm dễ chạm giới hạn đăng nhập của Supabase Auth (mặc định
 * ~30 lần / 5 phút / IP). Phiên giữ trong BỘ NHỚ của isolate (không ghi đâu cả, mất khi isolate
 * tắt) tới 2 phút trước khi hết hạn; hết thì đăng xuất phiên cũ, đăng nhập lại. Mỗi việc một bộ
 * nhớ riêng — hai tài khoản máy khác vai không bao giờ dùng chung phiên.
 *
 * Câu lỗi tiếng Việt, chỉ vào log cho người vận hành (test đọc nguyên văn): "chưa cài <EMAIL> /
 * <MẬT KHẨU>", "chưa nối database", "<nhãn> không đăng nhập được: <lý do>". Không bao giờ ném lỗi,
 * không bao giờ chứa mật khẩu (Supabase không nhắc lại mật khẩu; nơi gọi vẫn lọc log lần nữa).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { layBienCong, type Env } from './bien-moi-truong.ts';

/**
 * fetch có hạn giờ: mỗi lời gọi tối đa goiMs, và không quá hạn chót của lượt (tối thiểu 1 giây,
 * để lời gọi sau hạn chót hỏng nhanh thay vì treo). Giữ tín hiệu hủy của người gọi nếu có.
 */
export function taoFetchCoHan(fetchGoc: typeof fetch, hanChot: () => number, goiMs: number, bayGio: () => number = Date.now): typeof fetch {
  return async (input, init) => {
    const ms = Math.max(1000, Math.min(goiMs, hanChot() - bayGio()));
    const huy = new AbortController();
    const hen = setTimeout(() => huy.abort(new Error(`quá ${Math.max(1, Math.round(ms / 1000))} giây không trả lời`)), ms);
    const ngoai = init?.signal;
    const theoNgoai = () => huy.abort(ngoai?.reason);
    if (ngoai) {
      if (ngoai.aborted) huy.abort(ngoai.reason);
      else ngoai.addEventListener('abort', theoNgoai, { once: true });
    }
    try {
      return await fetchGoc(input, { ...init, signal: huy.signal });
    } finally {
      clearTimeout(hen);
      ngoai?.removeEventListener('abort', theoNgoai);
    }
  };
}

export interface ThamSoDangNhapMay {
  email?: string;
  matKhau?: string;
  /** Tên hai bí mật, cho câu "chưa cài …". */
  tenBiMat: { readonly email: string; readonly matKhau: string };
  /** Đầu câu lỗi đăng nhập, ví dụ "tài khoản máy Zalo" — log đọc nguyên văn. */
  nhan: string;
  env: Env;
  /** Client dựng sẵn (test: client giả trên PGlite) — khi có thì không đọc URL, không gắn fetch. */
  taoClient?: () => SupabaseClient;
  /** fetch gốc đi Supabase (test: fetch giả). Mặc định fetch toàn cục. */
  fetchGoc?: typeof fetch;
  /** Hạn giờ mỗi lời gọi (ms) — mỗi việc khai hằng của mình (HET_GIO_SUPABASE_ZALO_MS…). */
  goiMs: number;
  /** Hạn chót của cả lượt (ms theo đồng hồ bayGio). Mặc định không có — chỉ hạn từng lời gọi. */
  hanChot?: () => number;
  bayGio?: () => number;
}

export type KetQuaDangNhapMay =
  | { ok: true; client: SupabaseClient; dangXuat: () => Promise<void>; /** Phiên hết hạn lúc (ms), nếu biết. */ hetLuc?: number }
  | { ok: false; cau: string; /** Thiếu bí mật / chưa nối database — không phải lỗi lúc chạy. */ chuaCai: boolean };

/** Đăng nhập tài khoản máy. Không bao giờ ném lỗi. Dùng xong PHẢI gọi dangXuat(). */
export async function dangNhapMay(t: ThamSoDangNhapMay): Promise<KetQuaDangNhapMay> {
  if (!t.email || !t.matKhau) {
    return { ok: false, chuaCai: true, cau: `chưa cài ${t.tenBiMat.email} / ${t.tenBiMat.matKhau}` };
  }
  let client: SupabaseClient;
  if (t.taoClient) client = t.taoClient();
  else {
    const url = layBienCong('PUBLIC_SUPABASE_URL', t.env);
    const anon = layBienCong('PUBLIC_SUPABASE_ANON_KEY', t.env);
    if (!url || !anon) return { ok: false, chuaCai: true, cau: 'chưa nối database' };
    const goc: typeof fetch = t.fetchGoc ?? ((input, init) => fetch(input, init));
    client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: taoFetchCoHan(goc, t.hanChot ?? (() => Infinity), t.goiMs, t.bayGio) },
    });
  }
  let hetLuc: number | undefined;
  try {
    const { data, error } = await client.auth.signInWithPassword({ email: t.email, password: t.matKhau });
    if (error || !data?.session) {
      return { ok: false, chuaCai: false, cau: `${t.nhan} không đăng nhập được: ${error?.message ?? 'không có phiên'}` };
    }
    const het = Number((data.session as { expires_at?: number }).expires_at);
    if (Number.isFinite(het) && het > 0) hetLuc = het * 1000;
  } catch (e) {
    return { ok: false, chuaCai: false, cau: `${t.nhan} không đăng nhập được: ${e instanceof Error ? e.message : String(e)}` };
  }
  return {
    ok: true, client, hetLuc,
    // Thu hồi phiên vừa cấp — không giữ refresh token nào của máy.
    dangXuat: async () => { try { await client.auth.signOut({ scope: 'local' }); } catch { /* bỏ qua */ } },
  };
}

/** Phiên nhớ được dùng lại tới chừng này (ms) trước khi hết hạn. */
const NHO_TRUOC_HET_MS = 120_000;

export interface PhienMayNho {
  /** Như dangNhapMay, nhưng dùng lại phiên còn hạn; dangXuat() của phiên nhớ không đăng xuất. */
  dangNhap(t: ThamSoDangNhapMay, bayGio?: number): Promise<KetQuaDangNhapMay>;
  /** Bỏ phiên đang nhớ (lỗi database lạ — lần sau đăng nhập lại). */
  quen(): void;
}

/**
 * Một bộ nhớ phiên cho MỘT việc (gọi một lần ở đầu module của việc đó). Nhiều lời gọi cùng lúc
 * (webhook tới dồn) khi chưa có phiên dùng được thì chờ chung MỘT lần đăng nhập — không mỗi lời
 * gọi một phiên, không phiên nào bị ghi đè mà không đăng xuất.
 */
export function taoPhienMayNho(): PhienMayNho {
  let nho: { email: string; client: SupabaseClient; hetLuc: number } | null = null;
  let dangChay: Promise<unknown> | null = null;
  const khongLam = async () => { /* phiên còn dùng lại — không đăng xuất */ };
  const dungLai = (t: ThamSoDangNhapMay, bayGio: number): KetQuaDangNhapMay | null =>
    (nho && nho.email === t.email && nho.hetLuc - NHO_TRUOC_HET_MS > bayGio
      ? { ok: true, client: nho.client, dangXuat: khongLam, hetLuc: nho.hetLuc } : null);
  const dangNhapMoi = async (t: ThamSoDangNhapMay): Promise<KetQuaDangNhapMay> => {
    const cu = nho;
    nho = null;
    if (cu) { try { await cu.client.auth.signOut({ scope: 'local' }); } catch { /* bỏ qua */ } }
    const dn = await dangNhapMay(t);
    if (!dn.ok) return dn;
    // Không biết hạn phiên → không nhớ, dùng một lần rồi đăng xuất như thường.
    if (!dn.hetLuc || !t.email) return dn;
    nho = { email: t.email, client: dn.client, hetLuc: dn.hetLuc };
    return { ...dn, dangXuat: khongLam };
  };
  return {
    quen() { nho = null; },
    async dangNhap(t, bayGio = Date.now()) {
      const co = dungLai(t, bayGio);
      if (co) return co;
      // Có lần đăng nhập đang chạy → chờ nó xong rồi xét lại phiên nhớ (đăng nhập hỏng / không nhớ
      // được thì tự đăng nhập — client không nhớ là của riêng người gọi, người gọi tự đăng xuất).
      while (dangChay) {
        await dangChay;
        const sau = dungLai(t, bayGio);
        if (sau) return sau;
      }
      const p = dangNhapMoi(t);
      const xong = p.then(() => undefined, () => undefined);
      dangChay = xong;
      try { return await p; } finally { if (dangChay === xong) dangChay = null; }
    },
  };
}
