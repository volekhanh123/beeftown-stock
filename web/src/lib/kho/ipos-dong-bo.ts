/**
 * KHO — ĐỒNG BỘ BÁN HÀNG iPOS (GĐ7a; GĐ7c 0042; kéo bù theo iPOS DW 27/10/2026) — phần I/O
 *
 * iPOS TỰ ĐẨY từng hóa đơn sang (webhook, lib/kho/ipos-hook.ts). File này lo
 * phần còn lại, một lượt:
 *   kho_ipos_bat_dau → KÉO BÙ: GET /api/v1/partners/get-sales theo khoảng giờ
 *   cập nhật [tu_luc, den_luc] (database tính: mốc đã kéo tới − 15 phút → bây
 *   giờ), chia cửa sổ ≤ 1 ngày, đủ trang → kho_ipos_nhan theo lô (lô cuối của
 *   mỗi cửa sổ tiến mốc dong_bo_den_luc; cũng thử lại hàng chờ: dòng chưa khớp
 *   / thiếu hàng) → kho_ipos_ket_thuc. Không có hóa đơn nào (hoặc chưa cài
 *   token) thì một lần kho_ipos_nhan([]) để thử lại hàng chờ.
 * Kéo bù bắt lại hóa đơn webhook bị lỡ (iPOS chỉ gửi lại 5 lần trong 2,5 phút)
 * — hóa đơn đã nhận thì database bỏ vì trùng. iPOS DW không có API đọc thực
 * đơn: bảng kho_ipos_menu không còn được làm mới. Mọi quyết định trừ kho nằm
 * trong database.
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
 *   IPOS_ACCESS_TOKEN — token kéo dữ liệu bán hàng iPOS DW (header access_token)
 *   · KHO_IPOS_EMAIL, KHO_IPOS_MAT_KHAU — tài khoản máy · IPOS_CALLBACK_KHOA —
 *   khóa bí mật trong địa chỉ nhận hóa đơn. Đọc: tham số `env` →
 *   `cloudflare:workers` → process.env (chạy thử bằng Node). Thiếu → phần đó
 *   tắt, không lỗi gì khác.
 *
 * TOKEN KHÔNG BAO GIỜ rời khỏi hàm gọi iPOS: chỉ nằm ở header của fetch — không
 * trên URL, không vào database, không vào log, không vào câu trả về trang; mọi
 * câu lỗi vẫn đi qua `xoaToken`.
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
import {
  CAU_HOA_DON, CAU_KEO_IPOS, TRUONG_IPOS, chiaCuaSo, phanTichHoaDon, phanTichKetQuaKeo, taoUrlKeo, xoaToken, type CuaHangIpos, type HoaDonIpos,
} from './ipos.ts';
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

export type { Env } from '../bien-moi-truong.ts';

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
  /** fetch gọi iPOS (kéo hóa đơn). */
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
// MỘT LƯỢT: kéo bù hóa đơn + thử lại hàng chờ
// -----------------------------------------------------------------------------
export interface TomTatNhan {
  hd_moi: number; hd_trung: number; hd_sua: number; hd_huy: number; hd_loi: number;
  so_dong: number; dong: Record<string, number>;
}

export interface KetQuaKeo {
  /** Số hóa đơn iPOS trả về (kể cả cái đọc hỏng, cái của cửa hàng khác). */
  so_tra: number;
  /** Số hóa đơn đọc được, đúng cửa hàng, đã gửi database (gồm cả hóa đơn đã nhận qua webhook). */
  so_hd: number;
  /** Số cửa sổ đã kéo xong (mốc đã kéo tới tiến theo). */
  so_cua_so: number;
  /** Còn khoảng cũ hơn chưa kéo (quá CUA_SO_MOT_LUOT cửa sổ) — lượt sau kéo tiếp. */
  con_lai: boolean;
}

export interface KetQuaDongBo {
  ok: boolean;
  /** Câu tiếng Việt cho người đọc — đã xóa token. */
  cau: string;
  /** Bản tiếng Anh của cau (đã xóa token). Vắng khi câu là của database — trang tra dichCau. */
  cauEn?: string;
  /** Thiếu bí mật IPOS_ACCESS_TOKEN — không kéo bù được (hàng chờ vẫn thử lại). */
  chuaCai?: boolean;
  /** Database từ chối bắt đầu (chưa bật, đang chạy, vừa chạy...) — không phải lỗi. */
  tuChoi?: boolean;
  tomTat?: TomTatNhan;
  keo?: KetQuaKeo;
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
  /** Chờ ms (test: không chờ thật). */
  cho?: (ms: number) => Promise<void>;
}

/** Số cửa sổ (≤ 1 ngày) tối đa một lượt — mất kết nối lâu thì mỗi lượt 5 phút kéo bù chừng này ngày. */
export const CUA_SO_MOT_LUOT = 3;
/**
 * Hóa đơn mỗi lần gửi kho_ipos_nhan (database nhận ≤ 200). Mỗi lần gửi database còn thử
 * lại MỌI dòng đang chờ của chi nhánh dưới khóa chi nhánh — lô càng to, càng ít lượt quét.
 */
export const LO_GUI = 200;

/** Câu có một chỗ thay, ở hai thứ tiếng. */
type CauMau = { vi: (x: string) => string; en: (x: string) => string };
/** Câu có hai chỗ thay (số, lý do), ở hai thứ tiếng. */
type CauHai = { vi: (x: string, y: string) => string; en: (x: string, y: string) => string };

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
  quaTrang: {
    vi: `iPOS trả hơn ${TRUONG_IPOS.keo.trangToiDa} trang hóa đơn trong một ngày — dừng lại, không tiến mốc`,
    en: `iPOS returned more than ${TRUONG_IPOS.keo.trangToiDa} pages of invoices for one day — stopped without moving the checkpoint`,
  },
  keo: { vi: (x: string) => `Không kéo được hóa đơn iPOS: ${x}`, en: (x: string) => `Could not fetch iPOS invoices: ${x}` },
  khacCuaHang: {
    vi: (n: string) => `iPOS trả ${n} hóa đơn của cửa hàng khác (brand_id / store_id không khớp cấu hình) — đã bỏ, kiểm tra mã thương hiệu và mã cửa hàng`,
    en: (n: string) => `iPOS returned ${n} ${n === '1' ? 'invoice' : 'invoices'} from another store (brand_id / store_id do not match the settings) — skipped; check the brand code and store code`,
  },
  khongGhi: {
    vi: (n: string, lyDo: string) => `${n} hóa đơn iPOS không ghi được: ${lyDo}`,
    en: (n: string, lyDo: string) => `${n} iPOS ${n === '1' ? 'invoice' : 'invoices'} could not be recorded: ${lyDo}`,
  },
  dongBo: { vi: (x: string) => `Không đồng bộ được iPOS: ${x}`, en: (x: string) => `Could not sync iPOS: ${x}` },
  chuaDongBo: { vi: 'Chưa đồng bộ được.', en: 'Could not sync yet.' },
  chuaKetThuc: {
    vi: (x: string) => `Nhưng chưa ghi được kết thúc lượt (${x}) — lượt sau có thể phải chờ tới 10 phút.`,
    en: (x: string) => `But could not record the end of this run (${x}) — the next run may have to wait up to 10 minutes.`,
  },
} satisfies Record<string, CauMau | CauHai | HaiThuTieng>;

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

/** Gọi iPOS một lần: token ở header access_token, không bao giờ trên URL. */
async function goiIpos(url: string, token: string, fetchFn: typeof fetch): Promise<unknown> {
  const huy = new AbortController();
  const hen = setTimeout(() => huy.abort(), TRUONG_IPOS.timeoutMs);
  try {
    let res: Response;
    try {
      res = await fetchFn(url, {
        headers: { accept: 'application/json', [TRUONG_IPOS.keo.tieuDeToken]: token }, signal: huy.signal,
      });
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

/**
 * Kéo đủ trang của MỘT cửa sổ (epoch giây). Lỗi bất kỳ trang nào → ném (lỗi hai thứ tiếng).
 * Chỉ dừng ở trang RỖNG — không tin "trang thiếu là trang cuối": iPOS mà ngầm trả ít hơn
 * page_size thì dừng sớm sẽ bỏ sót hóa đơn rồi vẫn tiến mốc. Trang giống hệt trang trước
 * (máy chủ bỏ qua tham số page) cũng là hết, không chép trùng.
 */
async function keoCuaSo(ch: CuaHangIpos, tu: number, den: number, token: string, fetchFn: typeof fetch): Promise<unknown[]> {
  const ra: unknown[] = [];
  let truoc = '';
  for (let trang = 1; trang <= TRUONG_IPOS.keo.trangToiDa; trang++) {
    const kq = phanTichKetQuaKeo(await goiIpos(taoUrlKeo(ch, tu, den, trang), token, fetchFn));
    if (kq.loi) throw loiHai({ vi: kq.loi, en: kq.loiEn ?? kq.loi });
    if (kq.hoaDon.length === 0) return ra;
    const dauCuoi = JSON.stringify([kq.hoaDon.length, kq.hoaDon[0], kq.hoaDon.at(-1)]);
    if (dauCuoi === truoc) return ra;
    truoc = dauCuoi;
    ra.push(...kq.hoaDon);
  }
  throw loiHai(CAU_LUOT.quaTrang);
}

/** Câu tóm tắt một lượt tốt. */
export function cauTomTat(t: TomTatNhan | undefined, keo?: KetQuaKeo | null, nn: NgonNguNB = 'vi'): string {
  const c = (x: HaiThuTieng) => x[nn];
  const phan: string[] = [];
  if (keo) {
    const moi = t?.hd_moi ?? 0;
    phan.push(keo.so_tra === 0 ? c({ vi: 'iPOS không có hóa đơn nào mới cập nhật', en: 'iPOS has no recently updated invoices' })
      : c({
        vi: `kéo ${keo.so_tra} hóa đơn từ iPOS${moi ? `, ${moi} hóa đơn mới` : ''}`,
        en: `fetched ${keo.so_tra} ${keo.so_tra === 1 ? 'invoice' : 'invoices'} from iPOS${moi ? `, ${moi} new` : ''}`,
      }));
  }
  const d = t?.dong ?? {};
  const soThu = Object.values(d).reduce((a, b) => a + (Number(b) || 0), 0);
  if (!soThu) phan.push(c({ vi: 'không có dòng bán nào đang chờ', en: 'no sale lines waiting' }));
  else {
    phan.push(c({
      vi: `xử lý ${soThu} dòng bán: ${d.da_ghi ?? 0} đã trừ kho`,
      en: `processed ${soThu} sale ${soThu === 1 ? 'line' : 'lines'}: ${d.da_ghi ?? 0} deducted from stock`,
    }));
    const cho = (d.chua_khop ?? 0) + (d.thieu_hang ?? 0);
    if (cho) phan.push(c({ vi: `${cho} vẫn chờ xử lý`, en: `${cho} still waiting` }));
    if (d.loi) phan.push(c({ vi: `${d.loi} lỗi`, en: `${d.loi} ${Number(d.loi) === 1 ? 'error' : 'errors'}` }));
  }
  if (keo?.con_lai) phan.push(c({ vi: 'còn hóa đơn cũ hơn, lượt sau kéo tiếp', en: 'older invoices remain; the next run continues' }));
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
  for (const c of [CAU_LUOT.keo, CAU_LUOT.dongBo]) {
    const dau = c.vi('');
    if (cau.startsWith(dau)) return c.en(dichChiTietLoi(cau.slice(dau.length)));
  }
  // "<n> hóa đơn iPOS không ghi được: <lý do>"
  const CHO = '\u0000';
  const [dauG, giuaG] = CAU_LUOT.khongGhi.vi(CHO, CHO).split(CHO);
  const m = cau.startsWith(dauG) ? cau.slice(dauG.length).match(/^(\d+)(.*)$/s) : null;
  if (m && m[2].startsWith(giuaG)) return CAU_LUOT.khongGhi.en(m[1], dichChiTietLoi(m[2].slice(giuaG.length)));
  return dichChiTietLoi(cau);
}

/** Câu lỗi gọi iPOS / kéo hóa đơn → tiếng Anh; không nhận ra thì tra dichCau (câu database). */
function dichChiTietLoi(s: string): string {
  const K = CAU_KEO_IPOS;
  for (const c of [CAU_LUOT.khongJson, CAU_LUOT.quaTrang, K.khongObject, K.khongData, ...Object.values(CAU_HOA_DON)]) {
    if (s === c.vi) return c.en;
  }
  // Câu có một chỗ thay: tách phần trước / sau chỗ thay, giữ nguyên giá trị ở giữa.
  const CHO = '\u0000';
  for (const c of [CAU_LUOT.khongTraLoi, CAU_LUOT.loiHttp, CAU_LUOT.khacCuaHang, K.baoLoi] as CauMau[]) {
    const [dau, cuoi = ''] = c.vi(CHO).split(CHO);
    if (s.length >= dau.length + cuoi.length && s.startsWith(dau) && s.endsWith(cuoi)) {
      return c.en(s.slice(dau.length, s.length - cuoi.length));
    }
  }
  return dichCau('en', s);
}

/** Chờ trước khi gọi lại kho_ipos_ket_thuc (ms) — mạng chập chờn một giây thì gọi ngay cũng hỏng. */
const CHO_KET_THUC_LAI_MS = 1_500;

/**
 * Kết thúc lượt (kho_ipos_ket_thuc): nhả khóa, ghi nhật ký, đèn iPOS. Hỏng thì chờ một chút rồi gọi
 * lại MỘT lần — hàm database gọi lại an toàn (lượt đã kết thúc thì trả da_co). Không bao giờ ném lỗi.
 * Trả câu lỗi (đã xóa token); null = đã ghi. Hỏng hẳn thì khóa lượt giữ tới khi database tự coi
 * lượt là hỏng (10 phút) và nhật ký không có lượt này — nơi gọi KHÔNG được báo xong.
 */
async function ketThucLuot(
  supabase: SupabaseClient, lanId: string, loi: string | null, token: string | undefined, cho: (ms: number) => Promise<void>,
): Promise<string | null> {
  let cuoi = '';
  for (let lan = 0; lan < 2; lan++) {
    if (lan > 0) await cho(CHO_KET_THUC_LAI_MS);
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
 *
 * Mốc đã kéo tới (dong_bo_den_luc) chỉ tiến khi cả cửa sổ đã kéo đủ trang VÀ
 * đã vào database (lô cuối của cửa sổ mang p_den_luc). Kéo hỏng giữa chừng →
 * lượt sau kéo lại từ mốc cũ; hóa đơn đã nhận thì database bỏ vì trùng.
 */
export async function dongBoIpos({ supabase, chiNhanhId, nguon, env, fetchFn, cho }: ThamSoDongBo): Promise<KetQuaDongBo> {
  const { token } = await layBiMatIpos(env);
  const goi = fetchFn ?? fetch;
  const choMs = cho ?? ((ms: number) => new Promise<void>(xong => setTimeout(xong, ms)));

  let lanId: string | undefined;
  try {
    const { data: bd, error: e1 } = await supabase.rpc('kho_ipos_bat_dau', {
      p_chi_nhanh_id: chiNhanhId, p_nguon: nguon,
    });
    if (e1) return { ok: false, cau: xoaToken(e1.message, token) };
    const b = bd as { duoc: boolean; ly_do?: string; lan_id?: string; pos_parent?: string | null; pos_id?: string | null;
      tu_luc?: string | null; den_luc?: string | null } | null;
    if (!b?.duoc || !b.lan_id) {
      // Lý do từ chối là câu của database (chưa bật, đang chạy…) — trang tra dichCau.
      const lyDo = b?.ly_do;
      return lyDo != null ? { ok: false, tuChoi: true, cau: lyDo }
        : { ok: false, tuChoi: true, cau: CAU_LUOT.chuaDongBo.vi, cauEn: CAU_LUOT.chuaDongBo.en };
    }
    const lan = b.lan_id;
    lanId = lan;

    const canhBao: string[] = [];
    const canhBaoEn: string[] = [];
    const canh = (c: HaiThuTieng) => { canhBao.push(c.vi); canhBaoEn.push(c.en); };
    // loi (tiếng Việt) vào nhật ký lượt và câu trả về; loiEn chỉ cho câu trả về.
    let loi: string | null = null;
    let loiEn: string | null = null;

    // ---- Gửi database: cộng dồn số hóa đơn, giữ trạng thái dòng của lần gửi cuối --
    const tomTat: TomTatNhan = { hd_moi: 0, hd_trung: 0, hd_sua: 0, hd_huy: 0, hd_loi: 0, so_dong: 0, dong: {} };
    let lyDoDb = '';
    const nhan = async (lo: HoaDonIpos[], denLuc: string | null) => {
      const { data, error } = await supabase.rpc('kho_ipos_nhan', {
        p_chi_nhanh_id: chiNhanhId, p_lan_id: lan, p_hoa_don: lo, p_den_luc: denLuc,
      });
      if (error) throw new Error(error.message);
      const n = (data ?? {}) as Partial<TomTatNhan> & { canh_bao?: { loi?: string }[] };
      for (const k of ['hd_moi', 'hd_trung', 'hd_sua', 'hd_huy', 'hd_loi', 'so_dong'] as const) tomTat[k] += Number(n[k] ?? 0);
      tomTat.dong = n.dong ?? {};
      if (!lyDoDb && n.canh_bao?.length) lyDoDb = String(n.canh_bao[0]?.loi ?? '').slice(0, 120);
    };

    let keo: KetQuaKeo | undefined;
    if (!token) {
      canh({
        vi: `Chưa cài bí mật ${TEN_BI_MAT.token} — chưa kéo bù được hóa đơn từ iPOS (hóa đơn iPOS gửi sang vẫn nhận bình thường).`,
        en: `The ${TEN_BI_MAT.token} secret is not set — invoices cannot be fetched from iPOS yet (invoices sent by iPOS are still received as usual).`,
      });
      await nhan([], null);
    } else {
      const ch: CuaHangIpos = { brandId: String(b.pos_parent ?? ''), storeId: String(b.pos_id ?? '') };
      const cuaSo = chiaCuaSo(Date.parse(String(b.tu_luc ?? '')), Date.parse(String(b.den_luc ?? '')), CUA_SO_MOT_LUOT + 1);
      const k: KetQuaKeo = { so_tra: 0, so_hd: 0, so_cua_so: 0, con_lai: cuaSo.length > CUA_SO_MOT_LUOT };
      keo = k;
      let hong = 0;
      let lyDoHong: HaiThuTieng | null = null;
      let khacCuaHang = 0;
      for (const [tu, den] of cuaSo.slice(0, CUA_SO_MOT_LUOT)) {
        let tho: unknown[];
        try {
          tho = await keoCuaSo(ch, tu, den, token, goi);
        } catch (e) {
          const ct = cauCuaLoi(e);
          loi = CAU_LUOT.keo.vi(ct.vi);
          loiEn = CAU_LUOT.keo.en(ct.en);
          break;
        }
        k.so_tra += tho.length;
        const hd: HoaDonIpos[] = [];
        for (const x of tho) {
          const kq = phanTichHoaDon(x);
          if (kq.loai === 'loi') { hong++; lyDoHong ??= { vi: kq.cau, en: kq.cauEn }; continue; }
          // iPOS lọc theo cửa hàng rồi; hóa đơn ghi rõ cửa hàng khác thì không nhận.
          if ((kq.storeId && kq.storeId !== ch.storeId) || (kq.brandId && kq.brandId.toLowerCase() !== ch.brandId.toLowerCase())) {
            khacCuaHang++;
            continue;
          }
          hd.push(kq.hoaDon);
        }
        k.so_hd += hd.length;
        const denLuc = new Date(den * 1000).toISOString();
        if (hd.length === 0) await nhan([], denLuc);
        for (let i = 0; i < hd.length; i += LO_GUI) await nhan(hd.slice(i, i + LO_GUI), i + LO_GUI >= hd.length ? denLuc : null);
        k.so_cua_so++;
      }
      // Kéo hỏng ngay cửa sổ đầu (hoặc không có cửa sổ nào) — vẫn thử lại hàng chờ.
      if (k.so_cua_so === 0) await nhan([], null);
      // iPOS đã lọc theo cửa hàng, nên hóa đơn cửa hàng khác gần như chắc là cấu hình sai — đèn đỏ, không im lặng.
      if (!loi && khacCuaHang) {
        loi = CAU_LUOT.khacCuaHang.vi(String(khacCuaHang));
        loiEn = CAU_LUOT.khacCuaHang.en(String(khacCuaHang));
      }
      const khongGhi = hong + tomTat.hd_loi;
      if (!loi && khongGhi) {
        // Hóa đơn hỏng không chặn mốc (chặn thì kẹt mãi), nhưng đèn phải đỏ để người xem.
        const lyDo = lyDoHong ?? { vi: lyDoDb, en: dichCau('en', lyDoDb) };
        loi = CAU_LUOT.khongGhi.vi(String(khongGhi), lyDo.vi);
        loiEn = CAU_LUOT.khongGhi.en(String(khongGhi), lyDo.en);
      }
      if (loi) {
        loi = xoaToken(loi, token).slice(0, 300);
        loiEn = xoaToken(loiEn ?? loi, token).slice(0, 300);
      }
    }

    const loiKetThuc = await ketThucLuot(supabase, lan, loi, token, choMs);
    lanId = undefined;   // đã kết thúc (hoặc đã thử hai lần) — nhánh catch không gọi lại
    // Kéo hỏng ngay cửa sổ đầu thì không nói gì về hóa đơn iPOS — câu lỗi nói thay.
    const keoHien = keo && keo.so_cua_so > 0 ? keo : null;
    let cau = loi ? `${cauTomTat(tomTat, keoHien)} ${loi}` : cauTomTat(tomTat, keoHien);
    let cauEn = loi ? `${cauTomTat(tomTat, keoHien, 'en')} ${loiEn}` : cauTomTat(tomTat, keoHien, 'en');
    if (loiKetThuc !== null) {
      cau = `${cau} ${CAU_LUOT.chuaKetThuc.vi(loiKetThuc)}`;
      cauEn = `${cauEn} ${CAU_LUOT.chuaKetThuc.en(loiKetThuc)}`;
    }
    return {
      ok: !loi && loiKetThuc === null, cau, cauEn, tomTat, keo, canhBao, canhBaoEn, chuaCai: !token || undefined,
    };
  } catch (e) {
    const ct = cauCuaLoi(e);
    const cau = xoaToken(CAU_LUOT.dongBo.vi(ct.vi), token);
    const cauEn = xoaToken(CAU_LUOT.dongBo.en(ct.en), token);
    // Kết thúc hỏng nữa thì database tự coi lượt là hỏng sau 10 phút — câu đã là câu lỗi.
    if (lanId) await ketThucLuot(supabase, lanId, cau.slice(0, 300), token, choMs);
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
