/**
 * KHO — ĐỒNG BỘ BÁN HÀNG iPOS (GĐ7a, migration 0037) — phần I/O
 *
 * Một lượt: kho_ipos_bat_dau → gọi iPOS (có phân trang) → phanTichHoaDon
 * (ipos.ts, thuần) → kho_ipos_nhan (lô ≤ 200 HĐ; lô cuối mang den_luc để tiến
 * watermark) → kho_ipos_ket_thuc. Mọi quyết định trừ kho nằm trong database.
 *
 * Hai lối vào:
 *   · `dongBoIpos({ supabase, chiNhanhId, nguon: 'tay' })` — nút "Cập nhật ngay"
 *     ở /noi-bo/kho/cai-dat/ipos, chạy bằng PHIÊN NGƯỜI BẤM (quyền dong_bo_ban).
 *   · `dongBoTatCa(env)` — Cron Trigger (src/worker.ts): đăng nhập tài khoản
 *     máy vai `may_ipos` bằng client anon RIÊNG (không lưu phiên, không giữ
 *     refresh token), chạy mọi chi nhánh máy được đồng bộ, rồi đăng xuất.
 *
 * BÍ MẬT (bí mật Worker, KHÔNG đặt trong wrangler.toml / .env / repo):
 *   IPOS_ACCESS_TOKEN — token API iPOS · KHO_IPOS_EMAIL, KHO_IPOS_MAT_KHAU —
 *   tài khoản máy. Đọc: tham số `env` → `cloudflare:workers` → process.env
 *   (chạy thử bằng Node). Thiếu → đồng bộ tắt, không lỗi gì khác.
 *
 * TOKEN KHÔNG BAO GIỜ rời khỏi hàm gọi iPOS: không vào database (kho_ipos_bat_dau
 * không trả token, câu lỗi đi qua `xoaToken` trước khi gửi kho_ipos_ket_thuc —
 * database còn một lưới nữa), không vào log, không vào câu trả về trang.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  TRUONG_IPOS, phanTichHoaDon, conTrangSau, gopTrungMa, chiaLo, taoUrlHoaDon, xoaToken,
  type HoaDonIpos, type CuaSoIpos,
} from './ipos.ts';

// -----------------------------------------------------------------------------
// BÍ MẬT
// -----------------------------------------------------------------------------
export interface BiMatIpos {
  token?: string;
  email?: string;
  matKhau?: string;
}

type Env = Record<string, unknown> | undefined;

const TEN_BI_MAT = { token: 'IPOS_ACCESS_TOKEN', email: 'KHO_IPOS_EMAIL', matKhau: 'KHO_IPOS_MAT_KHAU' } as const;

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
  };
}

/** Cho màn Kết nối iPOS: đã cài bí mật nào — chỉ CÓ / KHÔNG, không bao giờ giá trị. */
export async function trangThaiBiMatIpos(env?: Env): Promise<{ token: boolean; taiKhoanMay: boolean }> {
  const b = await layBiMatIpos(env);
  return { token: !!b.token, taiKhoanMay: !!(b.email && b.matKhau) };
}

// -----------------------------------------------------------------------------
// MỘT LƯỢT
// -----------------------------------------------------------------------------
export interface TomTatNhan {
  hd_moi: number; hd_trung: number; hd_sua: number; hd_huy: number; hd_loi: number;
  so_dong: number; dong: Record<string, number>;
}

export interface KetQuaDongBo {
  ok: boolean;
  /** Câu tiếng Việt cho người đọc — đã xóa token. */
  cau: string;
  /** Không chạy vì thiếu bí mật IPOS_ACCESS_TOKEN. */
  chuaCai?: boolean;
  /** Database từ chối bắt đầu (chưa bật, đang chạy, vừa chạy...) — không phải lỗi. */
  tuChoi?: boolean;
  soHd?: number;
  tomTat?: TomTatNhan;
  canhBao?: string[];
}

export interface ThamSoDongBo {
  supabase: SupabaseClient;
  chiNhanhId: string;
  nguon: 'cron' | 'tay';
  env?: Env;
  fetchFn?: typeof fetch;
}

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

function cong(a: TomTatNhan | undefined, b: TomTatNhan): TomTatNhan {
  if (!a) return { ...b, dong: { ...b.dong } };
  const dong = { ...a.dong };
  for (const [k, v] of Object.entries(b.dong ?? {})) dong[k] = (dong[k] ?? 0) + Number(v);
  return {
    hd_moi: a.hd_moi + b.hd_moi, hd_trung: a.hd_trung + b.hd_trung, hd_sua: a.hd_sua + b.hd_sua,
    hd_huy: a.hd_huy + b.hd_huy, hd_loi: a.hd_loi + b.hd_loi, so_dong: a.so_dong + b.so_dong, dong,
  };
}

/** Câu tóm tắt một lượt tốt. */
export function cauTomTat(soHd: number, t: TomTatNhan | undefined): string {
  if (!t) return 'Đã cập nhật.';
  const d = t.dong ?? {};
  const phan = [`${soHd} hóa đơn đọc từ iPOS`, `${t.hd_moi} mới`];
  if (t.hd_sua) phan.push(`${t.hd_sua} sửa`);
  if (t.hd_huy) phan.push(`${t.hd_huy} hủy`);
  phan.push(`${d.da_ghi ?? 0} dòng đã trừ kho`);
  const cho = (d.chua_khop ?? 0) + (d.thieu_hang ?? 0);
  if (cho) phan.push(`${cho} dòng chờ xử lý`);
  if (d.loi) phan.push(`${d.loi} dòng lỗi`);
  return `Đã cập nhật: ${phan.join(', ')}.`;
}

/**
 * Chạy một lượt đồng bộ cho một chi nhánh. Không bao giờ ném lỗi: mọi lỗi
 * thành `{ ok: false, cau }` với câu đã xóa token.
 */
export async function dongBoIpos({ supabase, chiNhanhId, nguon, env, fetchFn }: ThamSoDongBo): Promise<KetQuaDongBo> {
  const { token } = await layBiMatIpos(env);
  if (!token) {
    return {
      ok: false, chuaCai: true,
      cau: 'Chưa cài bí mật IPOS_ACCESS_TOKEN cho Worker — đồng bộ iPOS đang tắt (xem web/KHO.md mục iPOS).',
    };
  }
  const goi = fetchFn ?? fetch;

  let lanId: string | undefined;
  try {
    const { data: bd, error: e1 } = await supabase.rpc('kho_ipos_bat_dau', {
      p_chi_nhanh_id: chiNhanhId, p_nguon: nguon,
    });
    if (e1) return { ok: false, cau: xoaToken(e1.message, token) };
    const b = bd as ({ duoc: boolean; ly_do?: string; lan_id?: string } & Partial<CuaSoIpos>) | null;
    if (!b?.duoc || !b.lan_id) return { ok: false, tuChoi: true, cau: b?.ly_do ?? 'Chưa đồng bộ được.' };
    lanId = b.lan_id;

    const cuaSo: CuaSoIpos = {
      api_url: String(b.api_url ?? ''), duong_dan_hoa_don: String(b.duong_dan_hoa_don ?? ''),
      pos_parent: String(b.pos_parent ?? ''), pos_id: String(b.pos_id ?? ''),
      tu_luc: String(b.tu_luc), den_luc: String(b.den_luc),
    };

    // ---- Đọc iPOS, từng trang ------------------------------------------------
    const tatCa: HoaDonIpos[] = [];
    const canhBao: string[] = [];
    const { trangDau, toiDaTrang } = TRUONG_IPOS.phanTrang;
    let conNua = false;
    for (let i = 0; i < toiDaTrang; i++) {
      const trang = trangDau + i;
      const json = await goiIpos(taoUrlHoaDon(cuaSo, token, trang), goi);
      const kq = phanTichHoaDon(json);
      tatCa.push(...kq.hoaDon);
      for (const c of kq.canhBao) if (!canhBao.includes(c)) canhBao.push(c);
      conNua = kq.soGoc > 0 && conTrangSau(json, trang, kq.soGoc);
      if (!conNua) break;
    }

    // ---- Gửi database --------------------------------------------------------
    const hoaDon = gopTrungMa(tatCa);
    const lo = chiaLo(hoaDon, 200);
    if (lo.length === 0) lo.push([]);   // vẫn gửi 1 lô rỗng: thử lại dòng cũ + tiến watermark
    let tomTat: TomTatNhan | undefined;
    for (let i = 0; i < lo.length; i++) {
      const cuoi = i === lo.length - 1;
      const { data: n, error: e2 } = await supabase.rpc('kho_ipos_nhan', {
        p_chi_nhanh_id: chiNhanhId, p_lan_id: lanId, p_hoa_don: lo[i],
        // Đọc chưa hết (quá số trang tối đa) thì KHÔNG tiến watermark.
        p_den_luc: cuoi && !conNua ? cuaSo.den_luc : null,
      });
      if (e2) throw new Error(e2.message);
      const t = n as TomTatNhan & { canh_bao?: { ma_hd?: string; loi?: string }[] };
      tomTat = cong(tomTat, t);
      if (t.hd_loi) canhBao.push(`${t.hd_loi} hóa đơn bị database từ chối (xem nhật ký)`);
    }

    const loi = conNua ? `Còn hóa đơn sau ${toiDaTrang} trang — lượt sau đọc tiếp` : null;
    await supabase.rpc('kho_ipos_ket_thuc', { p_lan_id: lanId, p_loi: loi });
    return { ok: !loi, cau: loi ?? cauTomTat(hoaDon.length, tomTat), soHd: hoaDon.length, tomTat, canhBao };
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
function layBienCong(ten: string, env: Env): string | undefined {
  const v = (import.meta as { env?: Record<string, unknown> }).env?.[ten];
  if (typeof v === 'string' && v) return v;
  return docChuoi(ten, env, envNode());
}

export interface PhuThuocCron {
  /** Tạo client Supabase (test thay bằng client giả). */
  taoClient?: () => SupabaseClient;
  fetchFn?: typeof fetch;
  ghiLog?: (cau: string) => void;
}

/**
 * Chạy từ `scheduled` của Worker. Không bao giờ ném lỗi. Trả danh sách câu
 * đã ghi log (đã xóa token) — để test đọc.
 */
export async function dongBoTatCa(env?: Env, phuThuoc: PhuThuocCron = {}): Promise<string[]> {
  const log: string[] = [];
  const ghi = (c: string, token?: string) => {
    const s = xoaToken(`[iPOS] ${c}`, token);
    log.push(s);
    (phuThuoc.ghiLog ?? console.log)(s);
  };

  const bm = await layBiMatIpos(env);
  if (!bm.token) { ghi('chưa cài bí mật IPOS_ACCESS_TOKEN — bỏ qua'); return log; }
  if (!bm.email || !bm.matKhau) { ghi('chưa cài KHO_IPOS_EMAIL / KHO_IPOS_MAT_KHAU — bỏ qua', bm.token); return log; }

  let client: SupabaseClient;
  if (phuThuoc.taoClient) client = phuThuoc.taoClient();
  else {
    const url = layBienCong('PUBLIC_SUPABASE_URL', env);
    const anon = layBienCong('PUBLIC_SUPABASE_ANON_KEY', env);
    if (!url || !anon) { ghi('chưa nối database — bỏ qua', bm.token); return log; }
    client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }

  let daDangNhap = false;
  try {
    const { data, error } = await client.auth.signInWithPassword({ email: bm.email, password: bm.matKhau });
    if (error || !data?.session) { ghi(`tài khoản máy không đăng nhập được: ${error?.message ?? 'không có phiên'}`, bm.token); return log; }
    daDangNhap = true;

    const { data: ds, error: e1 } = await client.rpc('kho_cn_duoc', { p_viec: 'dong_bo_ban' });
    if (e1) { ghi(`không đọc được chi nhánh: ${e1.message}`, bm.token); return log; }
    const chiNhanh = (Array.isArray(ds) ? ds : []) as string[];
    if (chiNhanh.length === 0) ghi('tài khoản máy không có chi nhánh nào được đồng bộ (vai phải là may_ipos)', bm.token);

    for (const cn of chiNhanh) {
      const kq = await dongBoIpos({ supabase: client, chiNhanhId: cn, nguon: 'cron', env, fetchFn: phuThuoc.fetchFn });
      // Chưa bật ở chi nhánh này = bình thường, không cần log.
      if (kq.tuChoi && /chưa bật/i.test(kq.cau)) continue;
      ghi(`${cn.slice(0, 8)}: ${kq.cau}`, bm.token);
    }
  } catch (e) {
    ghi(`lỗi: ${e instanceof Error ? e.message : String(e)}`, bm.token);
  } finally {
    // Thu hồi phiên vừa cấp — không giữ refresh token nào của máy.
    if (daDangNhap) { try { await client.auth.signOut({ scope: 'local' }); } catch { /* bỏ qua */ } }
  }
  return log;
}
