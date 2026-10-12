/**
 * ZALO ZBS — NGƯỜI GỬI TIN (phần I/O)
 * ===================================
 *
 * Cron Trigger (src/worker.ts, 5 phút một lần) gọi `guiZaloTatCa(env)`:
 *
 *   đăng nhập tài khoản máy vai `may_zalo` (client anon RIÊNG, không lưu phiên)
 *   → zalo_bat_dau_luot (khóa lượt 10 phút, cấu hình + token BẢN MÃ + lô tin)
 *   → access token còn < 1 giờ thì làm mới; refresh token của Zalo dùng MỘT
 *     lần nên cái mới được mã hóa và LƯU NGAY (zalo_luu_token) trước khi gửi
 *   → gửi từng tin, ghi kết quả (zalo_ghi_ket_qua)
 *   → zalo_ket_thuc_luot (nhả khóa, lỗi của lượt, quota còn lại) → đăng xuất.
 *
 * Mọi quyết định "được gửi không" nằm trong database (duoc_phep_gui, khung giờ,
 * trần tháng — kiểm lại lúc lấy lô). File này chỉ chuyển tin và ghi kết quả.
 *
 * Đăng nhập máy: dangNhapMay (lib/tai-khoan-may.ts) — mỗi lời gọi Supabase tối đa
 * HET_GIO_SUPABASE_ZALO_MS. Tin ĐÃ TỚI Zalo mà ghi "da_gui" hỏng hai lần liền:
 * dừng gửi tin kế tiếp, thử ghi lại cuối lượt TRƯỚC zalo_ket_thuc_luot (hàm đó
 * trả tin chưa báo kết quả về hàng chờ → khách nhận lần hai). Vẫn hỏng thì
 * loi_cuoi nói thật "có thể bị gửi lần hai".
 *
 * BÍ MẬT (bí mật Worker, KHÔNG đặt trong wrangler.toml / .env / repo / log):
 *   ZALO_SECRET_KEY — secret key của App Zalo (làm mới token)
 *   ZALO_KHOA       — khóa mã hóa token trong database (≥ 32 ký tự)
 *   ZALO_MAY_EMAIL, ZALO_MAY_MAT_KHAU — tài khoản máy vai may_zalo
 * App ID, OA ID nằm trong database (zalo_cau_hinh) — không bí mật.
 * Đọc: tham số `env` → `cloudflare:workers` → process.env (test bằng Node).
 * Thiếu → không làm gì, một dòng log.
 *
 * Không bao giờ ném lỗi. Câu log / câu lỗi ghi vào database đều qua
 * xoaBiMatZalo: không token, không secret key, không số điện thoại. Log giữ
 * tiếng Việt cho người vận hành (như lib/kho/ipos-dong-bo.ts).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { envNode, envWorker, docChuoi, type Env } from './bien-moi-truong.ts';
import { dangNhapMay, type KetQuaDangNhapMay } from './tai-khoan-may.ts';
import {
  ZALO_API, XU_LY_LOI, CAU_GUI, sdtZalo, dungYeuCauGui, dungYeuCauToken, docPhanHoi, docPhanHoiToken,
  xoaBiMatZalo, type PhanHoiGui, type PhanHoiToken, type YeuCau,
} from './zalo.ts';
import { danKhoaZalo, giaiMaTokenZalo, khoaZaloHopLe, maHoaTokenZalo } from './zalo-ma-hoa.ts';

// -----------------------------------------------------------------------------
// BÍ MẬT
// -----------------------------------------------------------------------------
export type { Env };

export const TEN_BI_MAT_ZALO = {
  secretKey: 'ZALO_SECRET_KEY', khoa: 'ZALO_KHOA', email: 'ZALO_MAY_EMAIL', matKhau: 'ZALO_MAY_MAT_KHAU',
} as const;

export interface BiMatZalo {
  secretKey?: string;
  khoa?: string;
  email?: string;
  matKhau?: string;
}

/** Đọc bí mật Zalo. Không có → undefined; không bao giờ ném lỗi. */
export async function layBiMatZalo(env?: Env): Promise<BiMatZalo> {
  const w = await envWorker();
  const p = envNode();
  return {
    secretKey: docChuoi(TEN_BI_MAT_ZALO.secretKey, env, w, p),
    khoa: docChuoi(TEN_BI_MAT_ZALO.khoa, env, w, p),
    email: docChuoi(TEN_BI_MAT_ZALO.email, env, w, p),
    matKhau: docChuoi(TEN_BI_MAT_ZALO.matKhau, env, w, p),
  };
}

export interface TrangThaiBiMatZalo {
  secretKey: boolean;
  /** Đã cài và đủ dài. */
  khoa: boolean;
  taiKhoanMay: boolean;
}

/** Cho màn Cài đặt Zalo: bí mật nào đã cài — chỉ CÓ / KHÔNG, không bao giờ giá trị. */
export async function trangThaiBiMatZalo(env?: Env): Promise<TrangThaiBiMatZalo> {
  const b = await layBiMatZalo(env);
  return { secretKey: !!b.secretKey, khoa: khoaZaloHopLe(b.khoa), taiKhoanMay: !!(b.email && b.matKhau) };
}

/**
 * Mã hóa refresh token chủ nhà hàng dán vào (màn Cài đặt Zalo) bằng ZALO_KHOA.
 * Thiếu khóa → null (trang báo "chưa cài ZALO_KHOA").
 */
export async function maHoaRefreshToken(token: string, env?: Env): Promise<string | null> {
  const { khoa } = await layBiMatZalo(env);
  if (!khoaZaloHopLe(khoa)) return null;
  return maHoaTokenZalo(await danKhoaZalo(khoa), token.trim(), 'refresh');
}

// -----------------------------------------------------------------------------
// TÀI KHOẢN MÁY may_zalo
// -----------------------------------------------------------------------------
/**
 * Hạn giờ mỗi lời gọi Supabase của máy Zalo (ms). Một lượt dài tối đa ~4 phút (thoiGianToiDaMs);
 * Supabase treo thì lời gọi hỏng sau chừng này thay vì giữ khóa lượt tới khi Worker bị giết.
 */
export const HET_GIO_SUPABASE_ZALO_MS = 20_000;

/** Chờ trước mỗi lần thử ghi lại kết quả cuối lượt (ms) — cho database đang chập chờn thêm thời gian. */
const CHO_GHI_LAI_MS = [1_000, 3_000] as const;

export interface PhuThuocZalo {
  /** Tạo client Supabase (test thay bằng client giả). */
  taoClient?: () => SupabaseClient;
  fetchFn?: typeof fetch;
  ghiLog?: (cau: string) => void;
  /** Đồng hồ (ms) — test cho giờ cố định. */
  bayGio?: () => number;
  /** Số tin tối đa một lượt (p_gioi_han). */
  gioiHan?: number;
  /** Thời gian tối đa một lượt (ms) trước khi ngừng lấy tin mới. */
  thoiGianToiDaMs?: number;
  /** fetch đi Supabase của client máy (test: fetch giả treo / lỗi). Mặc định fetch toàn cục. */
  fetchSupabase?: typeof fetch;
  /** Hạn giờ mỗi lời gọi Supabase (ms). Mặc định HET_GIO_SUPABASE_ZALO_MS. */
  hetGioSupabaseMs?: number;
  /** Chờ ms (test: không chờ thật). */
  cho?: (ms: number) => Promise<void>;
}

/** Đăng nhập may_zalo (dangNhapMay: client anon RIÊNG, mỗi lời gọi có hạn giờ). Dùng xong PHẢI gọi dangXuat(). */
export function dangNhapMayZalo(bm: BiMatZalo, env: Env, phuThuoc: PhuThuocZalo = {}): Promise<KetQuaDangNhapMay> {
  return dangNhapMay({
    email: bm.email, matKhau: bm.matKhau, tenBiMat: TEN_BI_MAT_ZALO, nhan: 'tài khoản máy Zalo', env,
    taoClient: phuThuoc.taoClient, fetchGoc: phuThuoc.fetchSupabase, goiMs: phuThuoc.hetGioSupabaseMs ?? HET_GIO_SUPABASE_ZALO_MS,
  });
}

// -----------------------------------------------------------------------------
// GỌI ZALO
// -----------------------------------------------------------------------------
type KetQuaGoi = { status: number; json: unknown } | { loiMang: string };

async function goiZalo(yc: YeuCau, fetchFn: typeof fetch): Promise<KetQuaGoi> {
  const huy = new AbortController();
  const hen = setTimeout(() => huy.abort(), ZALO_API.timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetchFn(yc.url, { ...yc.init, signal: huy.signal });
    } catch (e) {
      if (huy.signal.aborted) return { loiMang: CAU_GUI.khongTraLoi.vi(String(ZALO_API.timeoutMs / 1000)) };
      return { loiMang: CAU_GUI.mang.vi(e instanceof Error ? e.message : String(e)) };
    }
    let json: unknown;
    try { json = JSON.parse(await res.text()); } catch { json = undefined; }
    return { status: res.status, json };
  } catch (e) {
    return { loiMang: CAU_GUI.mang.vi(e instanceof Error ? e.message : String(e)) };
  } finally {
    clearTimeout(hen);
  }
}

// -----------------------------------------------------------------------------
// MỘT LƯỢT
// -----------------------------------------------------------------------------
interface CauHinhLuot {
  app_id: string | null;
  oa_id: string | null;
  che_do: 'thu' | 'that';
  refresh_token_ma_hoa: string | null;
  access_token_ma_hoa: string | null;
  het_han_luc: string | null;
}

interface TinLuot {
  id: string;
  sdt: string;
  template_id: string | null;
  mau_ma: string;
  loai_tin: string;
  du_lieu: unknown;
  lan_thu: number;
}

interface BatDauLuot {
  khoa: boolean;
  dang_bat: boolean;
  trong_khung_cham_soc?: boolean;
  cau_hinh: CauHinhLuot | null;
  lo: TinLuot[];
}

export interface TomTatLuot {
  da_gui: number;
  that_bai: number;
  bi_tu_choi: number;
  chua_gui: number;
  lam_moi_token: boolean;
  quota: number | null;
}

/**
 * Chạy từ `scheduled` của Worker. Không bao giờ ném lỗi. Trả danh sách câu đã
 * ghi log (đã xóa token, secret key, số điện thoại) — để test đọc.
 */
export async function guiZaloTatCa(env?: Env, phuThuoc: PhuThuocZalo = {}): Promise<string[]> {
  const log: string[] = [];
  // Mọi bí mật / token gặp trong lượt — xóa khỏi mọi câu log và câu lỗi.
  const biMat: string[] = [];
  const sach = (c: unknown) => xoaBiMatZalo(c, ...biMat);
  const ghi = (c: string) => {
    const s = sach(`[Zalo] ${c}`);
    log.push(s);
    try { (phuThuoc.ghiLog ?? console.log)(s); } catch { /* log hỏng không làm hỏng lượt */ }
  };

  try {
    const bm = await layBiMatZalo(env);
    for (const b of [bm.secretKey, bm.khoa, bm.matKhau]) if (b) biMat.push(b);

    const thieu: string[] = [];
    if (!bm.secretKey) thieu.push(TEN_BI_MAT_ZALO.secretKey);
    if (!khoaZaloHopLe(bm.khoa)) thieu.push(TEN_BI_MAT_ZALO.khoa);
    if (!bm.email || !bm.matKhau) thieu.push(`${TEN_BI_MAT_ZALO.email} / ${TEN_BI_MAT_ZALO.matKhau}`);
    if (thieu.length) { ghi(`chưa cài ${thieu.join(', ')} — bỏ qua`); return log; }

    const dn = await dangNhapMayZalo(bm, env, phuThuoc);
    if (!dn.ok) { ghi(`${dn.cau} — bỏ qua`); return log; }
    try {
      await motLuot(dn.client, bm as Required<BiMatZalo>, phuThuoc, biMat, ghi, sach);
    } finally {
      await dn.dangXuat();
    }
  } catch (e) {
    ghi(`lỗi: ${e instanceof Error ? e.message : String(e)}`);
  }
  return log;
}

async function motLuot(
  client: SupabaseClient, bm: Required<BiMatZalo>, phuThuoc: PhuThuocZalo, biMat: string[],
  ghi: (c: string) => void, sach: (c: unknown) => string,
): Promise<void> {
  const goi = phuThuoc.fetchFn ?? fetch;
  const bayGio = phuThuoc.bayGio ?? Date.now;
  const batDau = bayGio();
  const hetGioLuc = batDau + (phuThuoc.thoiGianToiDaMs ?? 240_000);

  const { data: bd, error: e1 } = await client.rpc('zalo_bat_dau_luot', { p_gioi_han: phuThuoc.gioiHan ?? 50 });
  if (e1) { ghi(`không bắt đầu được lượt: ${e1.message}`); return; }
  const b = bd as BatDauLuot | null;
  if (!b?.dang_bat) return;                          // Zalo đang tắt — bình thường, không log.
  if (b.khoa) { ghi('lượt trước vẫn đang chạy — bỏ qua'); return; }

  const tom: TomTatLuot = { da_gui: 0, that_bai: 0, bi_tu_choi: 0, chua_gui: 0, lam_moi_token: false, quota: null };
  let loiLuot: string | null = null;
  const lo = Array.isArray(b.lo) ? b.lo : [];

  /**
   * Tin ĐÃ TỚI Zalo mà chưa ghi được "da_gui" (database lỗi hai lần liền). zalo_ket_thuc_luot trả
   * mọi tin chưa báo kết quả về hàng chờ → lượt sau gửi khách lần hai. Thử ghi lại cuối lượt, mỗi
   * lần sau một lúc chờ, TRƯỚC khi kết thúc lượt; gọi lại an toàn (tin đã ở trạng thái cuối → bo_qua).
   */
  const chuaGhi: { tin: TinLuot; thamSo: Record<string, unknown> }[] = [];
  const cho = phuThuoc.cho ?? ((ms: number) => new Promise<void>(xong => setTimeout(xong, ms)));
  const tenTin = (ds: { tin: TinLuot }[]) => ds.map(x => x.tin.id.slice(0, 8)).join(', ');
  const ghiLaiCuoiLuot = async () => {
    for (const ms of CHO_GHI_LAI_MS) {
      if (!chuaGhi.length) return;
      await cho(ms);
      for (const x of [...chuaGhi]) {
        let loi: string | null;
        try { loi = (await client.rpc('zalo_ghi_ket_qua', x.thamSo)).error?.message ?? null; }
        catch (e) { loi = e instanceof Error ? e.message : String(e); }
        if (loi) continue;
        chuaGhi.splice(chuaGhi.indexOf(x), 1);
        ghi(`đã ghi lại được kết quả tin ${x.tin.id.slice(0, 8)}`);
      }
    }
    if (chuaGhi.length) {
      loiLuot = CAU_GUI.daToiChuaGhi.vi(tenTin(chuaGhi));
      ghi(loiLuot);
    }
  };

  const ketThuc = async () => {
    try { await ghiLaiCuoiLuot(); } catch (e) { ghi(`không ghi lại được kết quả: ${e instanceof Error ? e.message : String(e)}`); }
    const { error } = await client.rpc('zalo_ket_thuc_luot', {
      p_loi: loiLuot ? sach(loiLuot).slice(0, 500) : null, p_quota: tom.quota,
    });
    if (error) ghi(`không kết thúc được lượt: ${error.message}`);
    const phan = [`đã gửi ${tom.da_gui}`, `thất bại ${tom.that_bai}`, `bị từ chối ${tom.bi_tu_choi}`];
    if (tom.chua_gui) phan.push(`chưa gửi ${tom.chua_gui}`);
    if (tom.lam_moi_token) phan.push('đã làm mới token');
    if (tom.quota !== null) phan.push(`quota còn ${tom.quota}`);
    if (lo.length || loiLuot || tom.lam_moi_token) ghi(`${phan.join(', ')}${loiLuot ? ` — ${loiLuot}` : ''}`);
  };

  // Ghi kết quả một tin. Lỗi mạng khi ghi thì thử lại MỘT lần: tin đã tới Zalo
  // mà không ghi được "da_gui" sẽ bị zalo_ket_thuc_luot trả về hàng chờ và gửi
  // lần hai cho khách. Gọi lại an toàn — tin đã ở trạng thái cuối thì bo_qua.
  // Vẫn hỏng: "da_gui" vào chuaGhi (thử lại cuối lượt), trả false để vòng gửi dừng.
  const ghiKetQua = async (tin: TinLuot, ketQua: 'da_gui' | 'that_bai' | 'bi_tu_choi',
    o: { maZalo?: string | null; loi?: string | null; thuLaiSau?: number | null; chuaGui?: boolean } = {}): Promise<boolean> => {
    const thamSo = {
      p_id: tin.id, p_ket_qua: ketQua, p_ma_zalo: o.maZalo ?? null,
      p_loi: o.loi ? sach(o.loi).slice(0, 500) : null, p_thu_lai_sau: o.thuLaiSau ?? null,
    };
    let { data, error } = await client.rpc('zalo_ghi_ket_qua', thamSo);
    if (error) ({ data, error } = await client.rpc('zalo_ghi_ket_qua', thamSo));
    if (error) {
      ghi(`không ghi được kết quả tin ${tin.id.slice(0, 8)}: ${error.message}`);
      if (ketQua !== 'da_gui') return true;
      chuaGhi.push({ tin, thamSo });
      tom.da_gui++;               // đã tới Zalo — đếm như đã gửi, dù database chưa ghi
      return false;
    }
    if ((data as { ok?: boolean } | null)?.ok === false) ghi(`tin ${tin.id.slice(0, 8)}: ${(data as { loi?: string }).loi ?? 'không ghi được'}`);
    if (o.chuaGui) tom.chua_gui++;
    else if (ketQua === 'da_gui') tom.da_gui++;
    else if (ketQua === 'bi_tu_choi') tom.bi_tu_choi++;
    else tom.that_bai++;
    return true;
  };

  // Không có token dùng được → KHÔNG gửi tin nào của lô, nhưng vẫn báo từng tin
  // "Chưa gửi — <lý do>" kèm hẹn thử lại. Để im thì zalo_ket_thuc_luot trả tin
  // về hàng chờ 5 phút một lần, mỗi lần lan_thu + 1 — sau 25 phút mọi tin đến
  // hạn thành that_bai "Đã thử 5 lần mà không nhận được kết quả" (sai lý do,
  // và chủ không kịp dán lại token).
  const khongGuiLo = async (cau: string, thuLaiSau: number) => {
    loiLuot = cau;
    for (const tin of lo) await ghiKetQua(tin, 'that_bai', { loi: CAU_GUI.chuaGui.vi(cau), thuLaiSau, chuaGui: true });
  };
  /** Lỗi cần người làm (dán lại token, sửa bí mật) → hẹn 1 giờ; lỗi tạm → như lỗi mạng. */
  const HEN_CAN_NGUOI = XU_LY_LOI.cau_hinh.thuLaiSau ?? 3600;
  const HEN_TAM = XU_LY_LOI.thu_lai.thuLaiSau ?? 300;

  try {
    const cfg = b.cau_hinh;
    const khoa = await danKhoaZalo(bm.khoa);

    // ---- 1 · Token -------------------------------------------------------
    if (!cfg?.refresh_token_ma_hoa || !cfg.app_id) { await khongGuiLo(CAU_GUI.chuaCoToken.vi, HEN_CAN_NGUOI); return; }
    let refresh = await giaiMaTokenZalo(khoa, cfg.refresh_token_ma_hoa, 'refresh');
    let access = cfg.access_token_ma_hoa ? await giaiMaTokenZalo(khoa, cfg.access_token_ma_hoa, 'access') : null;
    if (!refresh) { await khongGuiLo(CAU_GUI.tokenHong.vi, HEN_CAN_NGUOI); return; }
    biMat.push(refresh);
    if (access) biMat.push(access);
    let hetHan = cfg.het_han_luc ? Date.parse(cfg.het_han_luc) : NaN;
    const appId = cfg.app_id;

    /** Làm mới token; lưu token mới NGAY. Trả câu lỗi (null = xong). */
    const lamMoi = async (): Promise<{ loi: string | null; dung: boolean; tamThoi?: boolean }> => {
      const kq = await goiZalo(dungYeuCauToken({ appId, refreshToken: refresh!, secretKey: bm.secretKey }), goi);
      const ph: PhanHoiToken = 'loiMang' in kq
        ? { ok: false, tamThoi: true, cau: kq.loiMang }
        : docPhanHoiToken(kq.status, kq.json);
      if (!ph.ok) {
        const cau = ph.tamThoi ? CAU_GUI.lamMoiLoi.vi(ph.cau) : CAU_GUI.lamMoiTuChoi.vi(ph.cau);
        return { loi: cau, dung: true, tamThoi: ph.tamThoi };
      }
      biMat.push(ph.accessToken);
      if (ph.refreshToken) biMat.push(ph.refreshToken);
      access = ph.accessToken;
      if (ph.refreshToken) refresh = ph.refreshToken;
      hetHan = bayGio() + ph.hetHanGiay * 1000;
      tom.lam_moi_token = true;

      // Refresh token cũ đã chết ở phía Zalo — lưu cái mới trước mọi việc khác.
      const thamSo = {
        p_access_ma_hoa: await maHoaTokenZalo(khoa, ph.accessToken, 'access'),
        p_het_han_luc: new Date(hetHan).toISOString(),
        p_refresh_ma_hoa: ph.refreshToken ? await maHoaTokenZalo(khoa, ph.refreshToken, 'refresh') : null,
      };
      let loiLuu: string | null = null;
      for (let lan = 0; lan < 2; lan++) {
        const { error } = await client.rpc('zalo_luu_token', {
          p_access_ma_hoa: thamSo.p_access_ma_hoa, p_het_han_luc: thamSo.p_het_han_luc, p_refresh_ma_hoa: thamSo.p_refresh_ma_hoa,
        });
        if (!error) { loiLuu = null; break; }
        loiLuu = error.message;
      }
      // Không lưu được: vẫn gửi bằng token trong bộ nhớ, nhưng báo lên để chủ biết.
      return { loi: loiLuu ? CAU_GUI.luuTokenLoi.vi(loiLuu) : null, dung: false };
    };

    if (!access || !Number.isFinite(hetHan) || hetHan - bayGio() < ZALO_API.lamMoiKhiConGiay * 1000) {
      const lm = await lamMoi();
      if (lm.loi) loiLuot = lm.loi;
      // Làm mới hỏng: còn access token chưa hết hạn thì vẫn dùng.
      if (lm.dung && !(access && Number.isFinite(hetHan) && hetHan > bayGio())) {
        await khongGuiLo(lm.loi ?? CAU_GUI.chuaCoToken.vi, lm.tamThoi ? HEN_TAM : HEN_CAN_NGUOI);
        return;
      }
    }

    // ---- 2 · Gửi ---------------------------------------------------------
    const guiMot = async (tin: TinLuot, sdt84: string): Promise<PhanHoiGui> => {
      const kq = await goiZalo(dungYeuCauGui({
        sdt84, templateId: String(tin.template_id), duLieu: tin.du_lieu, trackingId: tin.id, cheDo: cfg.che_do === 'that' ? 'that' : 'thu',
      }, access!), goi);
      return 'loiMang' in kq ? { ok: false, loai: 'thu_lai', ma: null, cau: kq.loiMang } : docPhanHoi(kq.status, kq.json);
    };

    let daLamMoiVi401 = false;
    let dung: { loi: string; thuLaiSau: number | null } | null = null;
    for (let i = 0; i < lo.length; i++) {
      const tin = lo[i];
      if (dung) {
        // Lỗi chung (hết quota, token hỏng, App sai…) — không gọi Zalo nữa, hẹn lượt sau.
        await ghiKetQua(tin, 'that_bai', { loi: CAU_GUI.chuaGui.vi(dung.loi), thuLaiSau: dung.thuLaiSau, chuaGui: true });
        continue;
      }
      if (bayGio() > hetGioLuc) {
        // Không báo kết quả: zalo_ket_thuc_luot trả tin về hàng chờ.
        loiLuot = loiLuot ?? CAU_GUI.hetGio.vi;
        tom.chua_gui += lo.length - i;
        break;
      }
      const sdt84 = sdtZalo(tin.sdt);
      if (!sdt84) { await ghiKetQua(tin, 'bi_tu_choi', { loi: CAU_GUI.sdtSai.vi }); continue; }
      if (!tin.template_id) { await ghiKetQua(tin, 'that_bai', { loi: CAU_GUI.thieuMau.vi }); continue; }

      let ph = await guiMot(tin, sdt84);
      if (!ph.ok && ph.loai === 'token' && !daLamMoiVi401) {
        // Token bị từ chối giữa chừng: làm mới MỘT lần trong lượt rồi gửi lại tin này.
        daLamMoiVi401 = true;
        const lm = await lamMoi();
        if (lm.loi) loiLuot = lm.loi;
        if (!lm.dung) ph = await guiMot(tin, sdt84);
        if (!ph.ok && ph.loai === 'token') ph = { ...ph, cau: lm.dung ? lm.loi ?? ph.cau : CAU_GUI.tokenVanHong.vi };
      }

      if (ph.ok) {
        const daGhi = await ghiKetQua(tin, 'da_gui', { maZalo: ph.msgId });
        if (ph.quotaConLai !== null) tom.quota = ph.quotaConLai;
        if (!daGhi) {
          // Database đang không ghi được: mỗi tin gửi thêm là thêm một tin có thể tới khách
          // hai lần. Dừng lượt; tin còn lại không báo kết quả → về hàng chờ, lượt sau gửi.
          loiLuot = CAU_GUI.dungChuaGhi.vi(tin.id.slice(0, 8));
          tom.chua_gui += lo.length - i - 1;
          break;
        }
        continue;
      }
      const xl = XU_LY_LOI[ph.loai];
      await ghiKetQua(tin, xl.ketQua, { loi: ph.cau, thuLaiSau: xl.thuLaiSau });
      if (xl.dungLuot) {
        dung = { loi: ph.cau, thuLaiSau: xl.thuLaiSau };
        loiLuot = ph.cau;
      }
    }
  } catch (e) {
    loiLuot = `lỗi: ${e instanceof Error ? e.message : String(e)}`;
  } finally {
    try { await ketThuc(); } catch (e) { ghi(`không kết thúc được lượt: ${e instanceof Error ? e.message : String(e)}`); }
  }
}
