/**
 * BÁO ĐỘNG — VIỆC CHẠY NỀN (phần I/O)
 * ===================================
 *
 * Cron Trigger RIÊNG (wrangler.toml "2-59/5 * * * *", src/worker.ts) gọi `baoDongTatCa(env)`:
 *
 *   đăng nhập tài khoản máy vai may_bao_dong (client anon RIÊNG, không lưu phiên)
 *   → bao_dong_bat_dau_luot: khóa lượt 10 phút, mã lượt, số liệu bảng sức khỏe mọi chi nhánh
 *   → đánh giá bằng CHÍNH danhGiaSucKhoe() của bảng — cùng ngưỡng, cùng câu. Không đọc được
 *     số liệu → chỉ đèn giả doc_so_lieu, danh sách không đầy đủ: database không đóng sự cố nào
 *   → bao_dong_ghi_luot: màu mọi đèn → sổ sự cố
 *   → lapKeHoach (luật, bao-dong-chinh-sach.ts) → soanTin (bao-dong-tin.ts) → gửi qua kênh
 *     (bao-dong-kenh.ts) → bao_dong_da_gui (thử lại một lần; đóng luôn sự cố vừa báo hết đỏ)
 *   → trong finally: bao_dong_ket_thuc_luot (đóng sự cố im lặng, nhịp tim, lỗi) → đăng xuất.
 *
 * Cron riêng, lệch 2 phút so với iPOS / Zalo: hai việc đó quá tải hay treo không kéo việc báo
 * động chết theo — và đèn "Báo động" trên bảng đỏ khi chính việc này dừng.
 *
 * Thứ tự "gửi rồi mới đánh dấu": gửi được mà đánh dấu hỏng thì lượt sau gửi lặp đúng một tin —
 * thà lặp còn hơn mất. Gửi hỏng thì không đánh dấu gì, lượt sau gửi lại. Log chỉ nói "đã gửi"
 * SAU KHI kênh trả ok.
 *
 * Hết giờ: mỗi lời gọi database HET_GIO.goiMs, kênh HET_GIO.kenhMs, cả lượt HET_GIO.luotMs — quá
 * hạn thì mọi lời gọi còn lại hỏng nhanh, rồi còn HET_GIO.ketThucMs để kết thúc lượt, đăng xuất.
 * Không bao giờ ném lỗi. Log tiền tố [bao-dong], đã xóa mật khẩu máy, bí mật kênh, token, số
 * điện thoại (tiếng Việt cho người vận hành, như lib/zalo-gui.ts).
 *
 * BÍ MẬT (bí mật Worker, KHÔNG đặt trong wrangler.toml / .env / repo / log):
 *   BAO_DONG_MAY_EMAIL, BAO_DONG_MAY_MAT_KHAU — tài khoản máy vai may_bao_dong.
 * Kênh (khi chọn) thêm bí mật riêng của nó. Đọc: tham số `env` → `cloudflare:workers` →
 * process.env (test bằng Node). Thiếu → không làm gì, một dòng log.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { docChuoi, envNode, envWorker, layBienCong, type Env } from './bien-moi-truong.ts';
import type { NgonNguNB } from './ngon-ngu-noi-bo';
import { danhGiaSucKhoe, laSucKhoeTho } from './suc-khoe.ts';
import { lapKeHoach, type DaBao, type KeHoach, type SuCo } from './bao-dong-chinh-sach.ts';
import { soanTin, type Tin } from './bao-dong-tin.ts';
import { chonKenhBaoDong, type KenhBaoDong, type KetQuaGui } from './bao-dong-kenh.ts';
import { xoaBiMat } from './messenger.ts';

// -----------------------------------------------------------------------------
// HẰNG SỐ, BÍ MẬT
// -----------------------------------------------------------------------------
export type { Env } from './bien-moi-truong.ts';

/** Chuỗi cron của việc báo động — PHẢI trùng một phần tử `crons` trong web/wrangler.toml. */
export const CRON_BAO_DONG = '2-59/5 * * * *';

export const TEN_BI_MAT_BAO_DONG = { email: 'BAO_DONG_MAY_EMAIL', matKhau: 'BAO_DONG_MAY_MAT_KHAU' } as const;

export const HET_GIO = { goiMs: 20_000, kenhMs: 10_000, luotMs: 60_000, ketThucMs: 15_000 } as const;

export interface BiMatBaoDong {
  email?: string;
  matKhau?: string;
}

/** Đọc tài khoản máy báo động. Không có → undefined; không bao giờ ném lỗi. */
export async function layBiMatBaoDong(env?: Env): Promise<BiMatBaoDong> {
  const w = await envWorker();
  const p = envNode();
  return {
    email: docChuoi(TEN_BI_MAT_BAO_DONG.email, env, w, p),
    matKhau: docChuoi(TEN_BI_MAT_BAO_DONG.matKhau, env, w, p),
  };
}

/**
 * Xóa bí mật khỏi một câu log / câu lỗi: token kiểu Telegram (cả dạng mã hóa URL "%3A") TRƯỚC —
 * bộ lọc số điện thoại chỉ cắt được phần số của nó — rồi xoaBiMat của Messenger (bí mật đã biết
 * cả dạng mã hóa URL, token=…, token Meta, số điện thoại).
 */
export function xoaBiMatBaoDong(c: unknown, biMat: readonly string[] = []): string {
  const s = (c instanceof Error ? c.message : String(c ?? '')).replace(/[0-9]{6,}(?::|%3A)[A-Za-z0-9_-]{30,}/gi, '***');
  return xoaBiMat(s, ...biMat);
}

// -----------------------------------------------------------------------------
// ĐĂNG NHẬP MÁY, FETCH CÓ HẠN GIỜ
// -----------------------------------------------------------------------------
export interface PhuThuocBaoDong {
  /** Tạo client Supabase (test thay bằng client giả chạy trên PGlite). */
  taoClient?: () => SupabaseClient;
  /** fetch thật cho Supabase (test: fetch giả — lỗi mạng, 429, treo). */
  fetchFn?: typeof fetch;
  /** Kênh (test: kênh giả). Mặc định chonKenhBaoDong(env). */
  kenh?: KenhBaoDong;
  ghiLog?: (cau: string) => void;
  /** Đồng hồ cho HẠN GIỜ của lượt — luật báo dùng đồng hồ database, không dùng cái này. */
  bayGio?: () => number;
  /** Hết giờ (test cho ngắn). */
  hetGio?: Partial<typeof HET_GIO>;
  nn?: NgonNguNB;
}

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

type KetQuaDangNhap =
  | { ok: true; client: SupabaseClient; dangXuat: () => Promise<void> }
  | { ok: false; cau: string };

/** Đăng nhập may_bao_dong bằng client anon RIÊNG. Dùng xong PHẢI gọi dangXuat(). */
export async function dangNhapMayBaoDong(
  bm: BiMatBaoDong, env: Env, fetchCoHan: typeof fetch, phuThuoc: PhuThuocBaoDong = {},
): Promise<KetQuaDangNhap> {
  if (!bm.email || !bm.matKhau) {
    return { ok: false, cau: `chưa cài ${TEN_BI_MAT_BAO_DONG.email} / ${TEN_BI_MAT_BAO_DONG.matKhau}` };
  }
  let client: SupabaseClient;
  if (phuThuoc.taoClient) client = phuThuoc.taoClient();
  else {
    const url = layBienCong('PUBLIC_SUPABASE_URL', env);
    const anon = layBienCong('PUBLIC_SUPABASE_ANON_KEY', env);
    if (!url || !anon) return { ok: false, cau: 'chưa nối database' };
    client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: fetchCoHan },
    });
  }
  try {
    const { data, error } = await client.auth.signInWithPassword({ email: bm.email, password: bm.matKhau });
    if (error || !data?.session) {
      return { ok: false, cau: `tài khoản máy báo động không đăng nhập được: ${error?.message ?? 'không có phiên'}` };
    }
  } catch (e) {
    return { ok: false, cau: `tài khoản máy báo động không đăng nhập được: ${e instanceof Error ? e.message : String(e)}` };
  }
  return {
    ok: true, client,
    dangXuat: async () => { try { await client.auth.signOut({ scope: 'local' }); } catch { /* bỏ qua */ } },
  };
}

// -----------------------------------------------------------------------------
// GỬI QUA KÊNH — có hạn giờ, không bao giờ ném lỗi
// -----------------------------------------------------------------------------
export async function guiCoHan(kenh: KenhBaoDong, tin: Tin, ms: number): Promise<KetQuaGui> {
  const huy = new AbortController();
  let hen: ReturnType<typeof setTimeout> | undefined;
  const hetGio = new Promise<KetQuaGui>(xong => {
    hen = setTimeout(() => {
      huy.abort();
      xong({ ok: false, tamThoi: true, cau: `quá ${Math.max(1, Math.round(ms / 1000))} giây không trả lời` });
    }, ms);
  });
  try {
    const gui = kenh.gui(tin, huy.signal).then(
      kq => (kq && typeof kq === 'object' && (kq.ok === true || kq.ok === false)
        ? kq : { ok: false as const, tamThoi: true, cau: 'kênh trả kết quả lạ' }),
      e => ({ ok: false as const, tamThoi: true, cau: e instanceof Error ? e.message : String(e) }));
    return await Promise.race([gui, hetGio]);
  } catch (e) {
    return { ok: false, tamThoi: true, cau: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(hen);
  }
}

// -----------------------------------------------------------------------------
// MỘT LƯỢT
// -----------------------------------------------------------------------------
interface BatDauLuot {
  bi_khoa: boolean;
  dang_chay_tu?: string;
  luot?: string;
  so_lieu?: unknown;
  loi_so_lieu?: string | null;
  trang_thai?: { kenh: string; kenh_tu_luc: string | null; tom_tat_luc: string | null; lan_chay_cuoi: string | null };
  da_bao_48_gio?: DaBao[];
  /** Dọn nhật ký quá hạn (0072) hỏng: câu lỗi (đã xoá bí mật). Lượt vẫn chạy; câu này vào lỗi của lượt. */
  loi_don?: string | null;
}

interface GhiLuot {
  luc: string;
  su_co: SuCo[];
}

/** Một đèn gửi xuống bao_dong_ghi_luot. */
interface DenGhi {
  ma_den: string;
  chi_nhanh_id: string | null;
  mau: 'xanh' | 'vang' | 'do' | 'tat';
}

/** "2 mới đỏ · 1 hết đỏ" / "tóm tắt sáng (3 đang đỏ)" — cho log, không tên, không câu. */
function moTaKeHoach(kh: KeHoach): string {
  const phan: string[] = [];
  // Tóm tắt đã liệt kê mọi mục đang đỏ — không đếm "mới đỏ" riêng.
  if (kh.moiDo.length && kh.tomTat === null) phan.push(`${kh.moiDo.length} mới đỏ`);
  if (kh.hetDo.length) phan.push(`${kh.hetDo.length} hết đỏ`);
  if (kh.tomTat === 'sang') phan.push(`tóm tắt sáng (${kh.dangDo.length} đang đỏ)`);
  if (kh.tomTat === 'noi_kenh') phan.push(`tin nối kênh (${kh.dangDo.length} đang đỏ)`);
  return phan.join(' · ');
}

/**
 * Chạy từ `scheduled` của Worker (cron CRON_BAO_DONG). Không bao giờ ném lỗi. Trả danh sách câu
 * đã ghi log (đã xóa bí mật) — để test đọc.
 */
export async function baoDongTatCa(env?: Env, phuThuoc: PhuThuocBaoDong = {}): Promise<string[]> {
  const log: string[] = [];
  const biMat: string[] = [];
  const sach = (c: unknown) => xoaBiMatBaoDong(c, biMat);
  const ghi = (c: string) => {
    const s = sach(`[bao-dong] ${c}`);
    log.push(s);
    try { (phuThuoc.ghiLog ?? console.log)(s); } catch { /* log hỏng không làm hỏng lượt */ }
  };

  try {
    const bm = await layBiMatBaoDong(env);
    if (bm.matKhau) biMat.push(bm.matKhau);
    if (!bm.email || !bm.matKhau) {
      ghi(`chưa cài ${TEN_BI_MAT_BAO_DONG.email} / ${TEN_BI_MAT_BAO_DONG.matKhau} — bỏ qua`);
      return log;
    }
    const kenh = phuThuoc.kenh ?? chonKenhBaoDong(env);
    biMat.push(...kenh.biMat);

    const hetGio = { ...HET_GIO, ...phuThuoc.hetGio };
    const bayGio = phuThuoc.bayGio ?? Date.now;
    let hanChot = bayGio() + hetGio.luotMs;
    const fetchCoHan = taoFetchCoHan(phuThuoc.fetchFn ?? fetch, () => hanChot, hetGio.goiMs, bayGio);

    const dn = await dangNhapMayBaoDong(bm, env, fetchCoHan, phuThuoc);
    if (!dn.ok) { ghi(`${dn.cau} — bỏ qua`); return log; }
    try {
      const w = await envWorker();
      const web = (docChuoi('SITE_URL', env, w, envNode()) ?? layBienCong('SITE_URL', env) ?? 'https://beeftown.vn').replace(/\/+$/, '');
      await motLuot(dn.client, kenh, {
        ghi, sach, web, nn: phuThuoc.nn ?? 'vi', kenhMs: () => Math.min(hetGio.kenhMs, Math.max(1000, hanChot - bayGio())),
        choKetThuc: () => { hanChot = Math.max(hanChot, bayGio() + hetGio.ketThucMs); },
      });
    } finally {
      hanChot = Math.max(hanChot, bayGio() + hetGio.ketThucMs);
      await dn.dangXuat();
    }
  } catch (e) {
    ghi(`lỗi: ${e instanceof Error ? e.message : String(e)}`);
  }
  return log;
}

interface NguCanhLuot {
  ghi: (c: string) => void;
  sach: (c: unknown) => string;
  web: string;
  nn: NgonNguNB;
  /** Hạn giờ cho lần gửi qua kênh, tính lúc gửi (không quá hạn chót của lượt). */
  kenhMs: () => number;
  /** Gọi trước khi kết thúc lượt: lượt đã quá hạn chót vẫn còn thời gian nhả khóa. */
  choKetThuc: () => void;
}

async function motLuot(client: SupabaseClient, kenh: KenhBaoDong, o: NguCanhLuot): Promise<void> {
  const { ghi, sach } = o;
  const { data: bd, error: e1 } = await client.rpc('bao_dong_bat_dau_luot', { p_kenh: kenh.ma });
  if (e1) { ghi(`không bắt đầu được lượt: ${e1.message}`); return; }
  const b = bd as BatDauLuot | null;
  if (!b || typeof b !== 'object') { ghi('không bắt đầu được lượt: dữ liệu trả về lạ'); return; }
  if (b.bi_khoa) { ghi('lượt khác đang chạy — bỏ qua'); return; }
  if (typeof b.luot !== 'string') { ghi('không bắt đầu được lượt: không có mã lượt'); return; }

  let loi: string | null = null;
  /** Lỗi của lượt gộp lại — một chỗ hỏng không che chỗ hỏng khác (dọn nhật ký hỏng + gửi hỏng…). */
  const themLoi = (c: string) => { loi = loi ? `${loi} · ${c}` : c; };
  if (typeof b.loi_don === 'string' && b.loi_don !== '') themLoi(`dọn nhật ký quá hạn hỏng: ${b.loi_don}`);
  const dong: string[] = [];
  let tomTatLog = '';
  try {
    // 1 · Đánh giá — CHÍNH hàm của bảng sức khỏe. Không có đèn "bao_dong": việc này không tự báo về mình.
    const sk = laSucKhoeTho(b.so_lieu) ? danhGiaSucKhoe(b.so_lieu, o.nn, true) : null;
    let den: DenGhi[];
    if (sk) {
      den = sk.khoi.flatMap(k => k.den.filter(d => d.ma !== 'bao_dong').map(d => ({
        ma_den: d.ma, chi_nhanh_id: k.ma === 'thuong_hieu' ? null : k.ma, mau: d.mau,
      })));
      den.push({ ma_den: 'doc_so_lieu', chi_nhanh_id: null, mau: 'xanh' });
    } else {
      den = [{ ma_den: 'doc_so_lieu', chi_nhanh_id: null, mau: 'do' }];
      themLoi(`không đọc được số liệu sức khỏe: ${b.loi_so_lieu ?? 'dữ liệu trả về lạ'}`);
    }

    // 2 · Ghi lượt. Danh sách không đầy đủ (mù) → database không coi sự cố nào là đã hết.
    const { data: gl, error: e2 } = await client.rpc('bao_dong_ghi_luot', { p_luot: b.luot, p_den: den, p_day_du: sk !== null });
    if (e2) { themLoi(`không ghi được lượt: ${e2.message}`); return; }
    const g = gl as GhiLuot | null;
    if (!g || typeof g.luc !== 'string' || !Array.isArray(g.su_co)) { themLoi('không ghi được lượt: dữ liệu trả về lạ'); return; }

    // 3 · Luật.
    const kh = lapKeHoach({
      luc: g.luc, kenh: kenh.ma, kenhTuLuc: b.trang_thai?.kenh_tu_luc ?? null, tomTatLuc: b.trang_thai?.tom_tat_luc ?? null,
      suCo: g.su_co, daBao48Gio: Array.isArray(b.da_bao_48_gio) ? b.da_bao_48_gio : [], mu: sk === null,
    });
    dong.push(...kh.dongIm);
    const soDo = g.su_co.filter(sc => sc.het_do_tu === null).length;
    tomTatLog = `${soDo} đèn đỏ · ${kenh.ma === 'khong' ? 'chưa chọn kênh' : `kênh ${kenh.ten}`}`;
    if (!kh.coTin) return;

    // 4 · Gửi — một tin cho cả lượt.
    const tin = soanTin({ keHoach: kh, sk, nn: o.nn, tenKenh: kenh.ten, gioiHanKyTu: kenh.gioiHanKyTu, web: o.web, luc: g.luc });
    const kq = await guiCoHan(kenh, tin, o.kenhMs());
    if (!kq.ok) {
      themLoi(`gửi qua ${kenh.ten} hỏng${kq.tamThoi ? ' (lượt sau gửi lại)' : ' (cần sửa cấu hình kênh; lượt sau vẫn thử lại)'}: ${kq.cau}`);
      return;
    }
    ghi(`đã gửi qua ${kenh.ten}: ${moTaKeHoach(kh)}${tin.soMucBoBot ? ` (bỏ bớt ${tin.soMucBoBot} mục vì tin quá dài)` : ''}`);

    // 5 · Đánh dấu — database đóng luôn các sự cố vừa báo hết đỏ trong cùng câu lệnh. Hỏng hai lần →
    //     lượt sau gửi lặp đúng tin này (thà lặp còn hơn mất).
    const thamSo = { p_kenh: kenh.ma, p_mo: kh.danhDauMo, p_het: kh.hetDo.map(sc => sc.id), p_tom_tat: kh.tomTat !== null };
    let { error: e3 } = await client.rpc('bao_dong_da_gui', thamSo);
    if (e3) ({ error: e3 } = await client.rpc('bao_dong_da_gui', thamSo));
    if (e3) {
      themLoi(`đã gửi nhưng không đánh dấu được — lượt sau có thể gửi lặp một tin: ${e3.message}`);
    }
  } catch (e) {
    themLoi(`lỗi: ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    o.choKetThuc();
    try {
      const { error: e4 } = await client.rpc('bao_dong_ket_thuc_luot', {
        p_luot: b.luot, p_dong: dong, p_loi: loi ? sach(loi).slice(0, 500) : null,
      });
      if (e4) ghi(`không kết thúc được lượt (khóa tự hết sau 10 phút): ${e4.message}`);
    } catch (e) {
      ghi(`không kết thúc được lượt (khóa tự hết sau 10 phút): ${e instanceof Error ? e.message : String(e)}`);
    }
    ghi(`lượt xong${tomTatLog ? ` — ${tomTatLog}` : ''}${loi ? ` — lỗi: ${loi}` : ''}`);
  }
}
