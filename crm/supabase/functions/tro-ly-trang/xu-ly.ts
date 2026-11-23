/**
 * EDGE FUNCTION tro-ly-trang — XỬ LÝ MỘT TIN KHÁCH (phần không phụ thuộc Deno)
 * ==========================================================================
 *
 * Trình duyệt (khung chat Trang ở trang Mua thịt về — web/src/components/TroLyTrang.astro) gửi:
 *   POST { cuoc: uuid, ma_tin: uuid, tin: "…", tra_truoc?: boolean, chi_nhanh?: "q1", nn?: "vi"|"ko" } — một tin khách
 *        (nn: trang khách đang mở. Trang trả lời tiếng Hàn khi tin có chữ Hàn, hay khi tin không rõ tiếng mà cuộc chat
 *        đang nói tiếng Hàn / trang là /ko — ngonNguTraLoi của tieng-viet-trang.ts; Khánh 23/11/2026 "Làm tiếng Hàn")
 *   POST { hanh_dong: "xem", cuoc: uuid, sau: số, chi_nhanh?: "q1" }                            — hỏi lại khi đang mở
 * Trả về (luôn JSON):
 *   200 { ok: true, tin: [...], the: [ThePhanThit], don: [{khoa, so_goi}], chot, chuyen_nguoi }  — Trang trả lời
 *   200 { ok: true, nhan_vien: true, ten }   — nhân viên đang nhận cuộc: tin đã tới nhân viên, KHÔNG gọi Claude
 *   200 { ok: true, xem: true, ai_tra_loi, ten, dang_go, truc, tin: [{id, nguoi, noi_dung, ten}] } — lệnh xem
 *   4xx / 5xx { ok: false, loi } — loi: sai · tat · qua_luot · het_luot (30 lượt của cuộc) · dang_tra_loi · tam_thoi · chua_cai
 *
 * Một lượt:
 *   1 · che số điện thoại, email, địa chỉ, tên trong tin khách (cheThongTin) — Claude và nhật ký chỉ thấy bản đã che;
 *   2 · tro_ly_mo_luot (0126): công tắc, giới hạn, giữ chỗ nhật ký, lịch sử của cuộc, menu, sổ học. Cùng ma_tin đã trả
 *       lời thì trả lại câu cũ — bấm đúp, mạng chập gửi lại không gọi Claude lần hai;
 *   3 · gọi Claude (Haiku 5.5, không suy nghĩ thêm, lời dặn và khối dữ liệu lưu đệm, khuôn JSON bắt buộc);
 *   4 · máy kiểm tiếng Việt và chữ cấm; sai thì bắt viết lại MỘT lần; vẫn sai thì thay bảng từ / bỏ tin (gotTin);
 *   5 · tro_ly_ghi_luot: ghi thứ khách thấy (hoặc lỗi); câu chưa biết vào sổ học.
 *
 * Mất mạng, Claude hết giờ hay trả 5xx: ghi lỗi vào nhật ký (đèn "Trợ lý Trang" đếm), trả { ok: false, loi:
 * 'tam_thoi' } — trang nói tin CHƯA được trả lời và cho gửi lại (cùng ma_tin: database cho thử lại trên chính dòng đó).
 * Không bao giờ dựng câu trả lời giả. Ghi nhật ký hỏng sau khi đã có câu trả lời thì vẫn trả câu đó cho khách (khách
 * không được hứa gì về nhật ký) và ghi log hàm.
 *
 * Phụ thuộc đưa vào từ ngoài (index.ts ở Supabase; kiểm thử thì giả): goiClaude (SDK @anthropic-ai/sdk), rpc
 * (PostgREST với khóa service_role). Nhờ vậy Node chạy thẳng file này trong crm/test/test-tro-ly-trang-ham.mjs.
 */
import {
  DON_LON_TU, KHUON_KET_QUA, LOI_DAY_CO_DINH, cauVietLai, cheThongTin, docKetQua, docMenu, docXen, duLieuLuot,
  ghiChuNhanVien, gotTin, khachDoiNguoi, khoiNgonNgu, kiemTin, soNguoiKhachNoi, theCua,
  type NgonNguTrang, type SanPhamCuaTrang, type SoHoc, type ThePhanThit, type TraLoi,
} from './trang.ts';
import { coChuHan, ngonNguTraLoi } from './tieng-viet-trang.ts';

/** Mô hình mặc định (Khánh duyệt 18/11/2026: "Oke" với Haiku 5.5, khoảng 58 đ mỗi cuộc chat). */
export const MO_HINH = 'claude-haiku-5-5';
/** Khóa API của Khánh là khóa cấp tổ chức: mỗi lời gọi kèm workspace. Không phải bí mật. */
export const WORKSPACE_MAC_DINH = 'wrkspc_01DCssYw7UrRT9SVqpR2ExFY';
/** Nguồn được gọi từ trình duyệt (CORS). */
export const NGUON_MAC_DINH: readonly string[] = ['https://beeftown.vn', 'https://www.beeftown.vn'];
/** Tin khách dài nhất (ký tự) — như maxlength của ô nhắn. */
export const TIN_TOI_DA = 400;
const THAN_TOI_DA = 4096;

/** Đủ để gọi client.messages.create của @anthropic-ai/sdk — index.ts đưa SDK thật vào. */
export type GoiClaude = (thamSo: Record<string, unknown>) => Promise<unknown>;
/** Gọi một hàm database (PostgREST /rest/v1/rpc) — trả { data, error } như supabase-js. */
export type Rpc = (ten: string, thamSo: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>;

export interface MoiTruong {
  goiClaude: GoiClaude | null;
  rpc: Rpc | null;
  moHinh?: string;
  nguonDuoc?: readonly string[];
  /** Đồng hồ (kiểm thử đưa đồng hồ giả để đo mili giây). */
  bayGio?: () => number;
  ghiLog?: (...x: unknown[]) => void;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MA_CHI_NHANH = /^[a-z0-9-]{1,20}$/;
const IP = /^(?:\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f:]{2,39})$/i;

function traJson(than: unknown, trangThai: number, nguon: string | null): Response {
  const dau: Record<string, string> = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (nguon) { dau['Access-Control-Allow-Origin'] = nguon; dau.Vary = 'Origin'; }
  return new Response(JSON.stringify(than), { status: trangThai, headers: dau });
}

/** Nguồn được phép thì trả lại đúng nguồn đó cho CORS; không thì null (trình duyệt tự chặn). */
function nguonCors(req: Request, duoc: readonly string[]): string | null {
  const o = req.headers.get('origin');
  return o && duoc.includes(o) ? o : null;
}

const IP_NOI_BO = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd][0-9a-f]{2}:)/i;

/**
 * IP khách cho giới hạn lượt. Ô đầu của x-forwarded-for do CHÍNH khách đặt được (proxy chỉ nối thêm phía sau), nên
 * không tin nó: lấy cf-connecting-ip (Cloudflare đặt), không có thì ô CUỐI CÙNG không phải địa chỉ nội bộ — thứ proxy
 * của Supabase nối vào. Sai dạng → null (không giới hạn theo IP; giới hạn 2.000 lượt mỗi ngày vẫn chặn).
 */
export function ipKhach(req: Request): string | null {
  const cf = req.headers.get('cf-connecting-ip')?.trim() ?? '';
  if (IP.test(cf)) return cf;
  const ds = (req.headers.get('x-forwarded-for') ?? '').split(',').map(s => s.trim()).filter(s => IP.test(s));
  return [...ds].reverse().find(s => !IP_NOI_BO.test(s)) ?? null;
}

interface YeuCau { cuoc: string; maTin: string; tin: string; traTruoc: boolean; chiNhanh: string | null; nnTrang: NgonNguTrang }
interface YeuCauXem { cuoc: string; sau: number; chiNhanh: string | null }

async function docThan(req: Request): Promise<Record<string, unknown> | null> {
  let chu: string;
  try { chu = await req.text(); } catch { return null; }
  if (!chu || chu.length > THAN_TOI_DA) return null;
  let o: unknown;
  try { o = JSON.parse(chu); } catch { return null; }
  return o && typeof o === 'object' && !Array.isArray(o) ? (o as Record<string, unknown>) : null;
}

const docChiNhanh = (v: unknown): string | null => (typeof v === 'string' && MA_CHI_NHANH.test(v) ? v : null);

function docYeuCau(o: Record<string, unknown>): YeuCau | null {
  const tin = typeof o.tin === 'string' ? o.tin.replace(/\s+/g, ' ').trim() : '';
  if (typeof o.cuoc !== 'string' || !UUID.test(o.cuoc) || typeof o.ma_tin !== 'string' || !UUID.test(o.ma_tin)) return null;
  if (!tin || [...tin].length > TIN_TOI_DA) return null;
  return {
    cuoc: o.cuoc.toLowerCase(), maTin: o.ma_tin.toLowerCase(), tin, traTruoc: o.tra_truoc === true, chiNhanh: docChiNhanh(o.chi_nhanh),
    nnTrang: o.nn === 'ko' ? 'ko' : 'vi',
  };
}

/** Ngôn ngữ của một câu trả lời đã có (nhật ký, lịch sử): có chữ Hàn → tiếng Hàn. */
function ngonNguCua(traLoi: unknown): NgonNguTrang {
  const tin = (traLoi as { tin?: unknown } | null)?.tin;
  return Array.isArray(tin) && tin.some(t => coChuHan(t)) ? 'ko' : 'vi';
}

function docYeuCauXem(o: Record<string, unknown>): YeuCauXem | null {
  if (typeof o.cuoc !== 'string' || !UUID.test(o.cuoc)) return null;
  const sau = typeof o.sau === 'number' && Number.isSafeInteger(o.sau) && o.sau >= 0 ? o.sau : 0;
  return { cuoc: o.cuoc.toLowerCase(), sau, chiNhanh: docChiNhanh(o.chi_nhanh) };
}

/** Một tin nhân viên / câu hệ thống cho khung chat của khách (đọc lại từ tro_ly_xem, không tin dữ liệu ngoài). */
function tinXem(v: unknown): { id: number; nguoi: string; noi_dung: string; ten: string | null }[] {
  return (Array.isArray(v) ? v : []).flatMap(x => {
    const t = x as Record<string, unknown> | null;
    const id = Number(t?.id);
    if (!t || !Number.isSafeInteger(id) || (t.nguoi !== 'nhan_vien' && t.nguoi !== 'he_thong') || typeof t.noi_dung !== 'string') return [];
    return [{ id, nguoi: t.nguoi, noi_dung: t.noi_dung.slice(0, 1000), ten: typeof t.ten === 'string' && t.ten ? t.ten.slice(0, 60) : null }];
  });
}

/** Lệnh xem: khung chat đang mở hỏi lại vài giây một lần — ai đang trả lời, nhân viên đang gõ, tin nhân viên mới. */
async function xuLyXem(o: Record<string, unknown>, rpc: Rpc, nguon: string | null, log: (...x: unknown[]) => void): Promise<Response> {
  const yc = docYeuCauXem(o);
  if (!yc) return traJson({ ok: false, loi: 'sai' }, 400, nguon);
  let d: Record<string, unknown>;
  try {
    const { data, error } = await rpc('tro_ly_xem', { p_cuoc: yc.cuoc, p_sau: yc.sau, p_chi_nhanh_ma: yc.chiNhanh });
    if (error || !data || typeof data !== 'object') {
      log('[tro-ly-trang] tro_ly_xem lỗi:', error?.message ?? 'không có dữ liệu');
      return traJson({ ok: false, loi: 'tam_thoi' }, 503, nguon);
    }
    d = data as Record<string, unknown>;
  } catch (e) {
    log('[tro-ly-trang] không gọi được database:', e instanceof Error ? e.message : String(e));
    return traJson({ ok: false, loi: 'tam_thoi' }, 503, nguon);
  }
  if (d.tat === true) return traJson({ ok: false, loi: 'tat' }, 403, nguon);
  if (d.sai === true) return traJson({ ok: false, loi: 'sai' }, 400, nguon);
  const laNv = d.ai_tra_loi === 'nhan_vien';
  return traJson({
    ok: true, xem: true,
    ai_tra_loi: laNv ? 'nhan_vien' : 'trang',
    ten: laNv && typeof d.ten === 'string' && d.ten ? d.ten.slice(0, 60) : null,
    // Chỉ nhân viên đang nhận mới "đang gõ" được — Trang trả lời theo lượt gửi, không qua lệnh xem.
    dang_go: laNv && d.dang_go === true, truc: d.truc === true, tin: tinXem(d.tin),
  }, 200, nguon);
}

interface DuLieuMo { luot: number; lich_su: { khach: string; tra_loi: TraLoi | null }[]; menu: unknown; so_hoc: SoHoc[]; xen?: unknown }

/**
 * Thứ trả trình duyệt: thẻ dựng lại từ menu hiện tại (nhật ký chỉ lưu mã); mỗi dòng đơn kèm tên Trang nói, để thẻ đơn
 * ghi "Đầu thăn ngoại còn nắp (Ribeye with Cap)" — tiền do trang tự tính từ menu của chính nó.
 */
function goiChoKhach(kq: TraLoi, menu: readonly SanPhamCuaTrang[], nn: NgonNguTrang = 'vi', nnTrang: NgonNguTrang = nn) {
  const the = kq.the.map(ma => theCua(ma, menu, nn, nnTrang)).filter((x): x is ThePhanThit => x !== null);
  const tenCua = (khoa: string) => menu.find(sp => sp.goi.some(g => g.khoa === khoa))?.tenNoi ?? '';
  const don = kq.don.map(d => ({ khoa: d.khoa, so_goi: d.so_goi, ten: tenCua(d.khoa) }));
  return { ok: true, tin: kq.tin, the, don, chot: kq.chot, chuyen_nguoi: kq.chuyen_nguoi };
}

/** Lịch sử của cuộc → messages của Claude: khách nói chữ đã che, Trang nói đúng JSON đã trả. */
function lichSuThanhTin(lichSu: DuLieuMo['lich_su']): { role: 'user' | 'assistant'; content: string }[] {
  const ra: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const l of Array.isArray(lichSu) ? lichSu : []) {
    if (typeof l?.khach !== 'string' || !l.tra_loi || !Array.isArray(l.tra_loi.tin)) continue;
    ra.push({ role: 'user', content: l.khach }, { role: 'assistant', content: JSON.stringify(l.tra_loi) });
  }
  return ra;
}

interface DungToken { vao: number; ra: number; doc: number; ghi: number }

function chuCuaClaude(msg: unknown): { chu: string | null; dung: DungToken; lyDo: string } {
  const m = msg as { content?: { type?: string; text?: string }[]; stop_reason?: string; usage?: Record<string, unknown> } | null;
  const u = m?.usage ?? {};
  const so = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const dung = { vao: so(u.input_tokens), ra: so(u.output_tokens), doc: so(u.cache_read_input_tokens), ghi: so(u.cache_creation_input_tokens) };
  const lyDo = String(m?.stop_reason ?? '');
  if (lyDo === 'refusal') return { chu: null, dung, lyDo };
  const khoi = (m?.content ?? []).find(b => b?.type === 'text');
  return { chu: typeof khoi?.text === 'string' ? khoi.text : null, dung, lyDo };
}

function congToken(a: DungToken, b: DungToken): DungToken {
  return { vao: a.vao + b.vao, ra: a.ra + b.ra, doc: a.doc + b.doc, ghi: a.ghi + b.ghi };
}

/** Mã lỗi ngắn cho nhật ký: status HTTP của SDK (APIError.status) hoặc tên lỗi. Không ghi nội dung lỗi (có thể chứa khóa). */
function maLoi(e: unknown): string {
  const o = e as { status?: unknown; name?: unknown } | null;
  if (typeof o?.status === 'number') return `claude_${o.status}`;
  const ten = typeof o?.name === 'string' ? o.name.replace(/[^A-Za-z]/g, '').slice(0, 40) : '';
  return `claude_${ten || 'loi'}`;
}

export async function xuLyYeuCau(req: Request, mt: MoiTruong): Promise<Response> {
  const nguonDuoc = mt.nguonDuoc ?? NGUON_MAC_DINH;
  const nguon = nguonCors(req, nguonDuoc);
  const log = mt.ghiLog ?? console.log;
  const bayGio = mt.bayGio ?? Date.now;

  if (req.method === 'OPTIONS') {
    const dau: Record<string, string> = { 'Access-Control-Max-Age': '600' };
    if (nguon) {
      dau['Access-Control-Allow-Origin'] = nguon;
      dau['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
      dau['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type, x-client-info';
      dau.Vary = 'Origin';
    }
    return new Response(null, { status: 204, headers: dau });
  }
  if (req.method !== 'POST') return traJson({ ok: false, loi: 'sai' }, 405, nguon);
  // Trình duyệt luôn gửi Origin: trang khác nhúng lời gọi tới hàm này thì bị từ chối trước khi tốn gì. (Gọi ngoài
  // trình duyệt thì không có Origin — giới hạn lượt của tro_ly_mo_luot là chốt chặn.)
  if (req.headers.get('origin') && !nguon) return traJson({ ok: false, loi: 'sai' }, 403, null);

  const than = await docThan(req);
  if (!than) return traJson({ ok: false, loi: 'sai' }, 400, nguon);
  if (than.hanh_dong === 'xem') {
    if (!mt.rpc) {
      log('[tro-ly-trang] chưa cài: thiếu khóa service_role');
      return traJson({ ok: false, loi: 'chua_cai' }, 503, nguon);
    }
    return xuLyXem(than, mt.rpc, nguon, log);
  }
  if (!mt.goiClaude || !mt.rpc) {
    log('[tro-ly-trang] chưa cài: thiếu ANTHROPIC_API_KEY hoặc khóa service_role');
    return traJson({ ok: false, loi: 'chua_cai' }, 503, nguon);
  }

  const yc = docYeuCau(than);
  if (!yc) return traJson({ ok: false, loi: 'sai' }, 400, nguon);
  const batDau = bayGio();
  const tinChe = cheThongTin(yc.tin);

  // 2 · Mở lượt.
  let mo: Record<string, unknown>;
  try {
    const { data, error } = await mt.rpc('tro_ly_mo_luot', {
      p_cuoc: yc.cuoc, p_ma_tin: yc.maTin, p_tin: tinChe, p_ip: ipKhach(req), p_chi_nhanh_ma: yc.chiNhanh,
    });
    if (error || !data || typeof data !== 'object') {
      log('[tro-ly-trang] tro_ly_mo_luot lỗi:', error?.message ?? 'không có dữ liệu');
      return traJson({ ok: false, loi: 'tam_thoi' }, 503, nguon);
    }
    mo = data as Record<string, unknown>;
  } catch (e) {
    log('[tro-ly-trang] không gọi được database:', e instanceof Error ? e.message : String(e));
    return traJson({ ok: false, loi: 'tam_thoi' }, 503, nguon);
  }

  if (mo.duoc !== true) {
    const lyDo = String(mo.ly_do ?? '');
    if (lyDo === 'da_tra_loi') {
      // Cùng ma_tin đã trả lời (bấm đúp, trình duyệt gửi lại): trả đúng câu cũ, không gọi Claude.
      const nnCu = ngonNguCua(mo.tra_loi);
      const menuCu = docMenu(mo.menu, nnCu);
      const cu = docKetQua(mo.tra_loi, menuCu);
      if (cu) return traJson(goiChoKhach(cu, menuCu, nnCu, yc.nnTrang), 200, nguon);
      return traJson({ ok: false, loi: 'tam_thoi' }, 503, nguon);
    }
    // Nhân viên đang nhận cuộc này: database đã ghi tin cho nhân viên — không gọi Claude, không câu trả lời của Trang.
    if (lyDo === 'nhan_vien') {
      return traJson({ ok: true, nhan_vien: true, ten: typeof mo.ten === 'string' && mo.ten ? mo.ten.slice(0, 60) : null }, 200, nguon);
    }
    if (lyDo === 'dang_tra_loi') return traJson({ ok: false, loi: 'dang_tra_loi' }, 409, nguon);
    if (lyDo === 'tat' || lyDo === 'chua_mo') return traJson({ ok: false, loi: 'tat' }, 403, nguon);
    // Hết 30 lượt của cuộc chat: chờ không giúp gì (giới hạn theo cuộc, không theo giờ) — trang mời bắt đầu cuộc mới.
    if (lyDo === 'qua_luot_cuoc') return traJson({ ok: false, loi: 'het_luot' }, 429, nguon);
    if (lyDo.startsWith('qua_luot')) return traJson({ ok: false, loi: 'qua_luot' }, 429, nguon);
    return traJson({ ok: false, loi: 'sai' }, 400, nguon);
  }

  const du = mo as unknown as DuLieuMo;
  // Ngôn ngữ lượt này: theo chữ khách gõ; tin không rõ tiếng thì theo câu Trang trả lời gần nhất, chưa có thì theo trang.
  const lichSu = Array.isArray(du.lich_su) ? du.lich_su : [];
  const truoc = lichSu.at(-1)?.tra_loi;
  const nn = ngonNguTraLoi(yc.tin, truoc ? ngonNguCua(truoc) : yc.nnTrang);
  const menu = docMenu(du.menu, nn);
  const soHoc = (Array.isArray(du.so_hoc) ? du.so_hoc : []).filter(x => typeof x?.hoi === 'string' && typeof x?.dap === 'string');

  const thamSo = {
    model: mt.moHinh ?? MO_HINH,
    max_tokens: 1024,
    thinking: { type: 'disabled' },
    system: [
      { type: 'text', text: LOI_DAY_CO_DINH, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: duLieuLuot(menu, soHoc, yc.traTruoc), cache_control: { type: 'ephemeral' } },
      // Khối cuối, không lưu đệm: ngôn ngữ của lượt này (hai khối trên dùng chung giữa mọi cuộc chat cùng thứ tiếng).
      { type: 'text', text: khoiNgonNgu(nn) },
    ],
    // Nhân viên vừa trả cuộc lại: lượt này kèm ghi chú các tin họ đã nhắn với khách (ghiChuNhanVien).
    messages: [...lichSuThanhTin(du.lich_su), { role: 'user', content: ghiChuNhanVien(docXen(du.xen), tinChe) }],
    output_config: { format: { type: 'json_schema', schema: KHUON_KET_QUA } },
  };

  // 3, 4 · Claude, máy kiểm, viết lại một lần.
  let dung: DungToken = { vao: 0, ra: 0, doc: 0, ghi: 0 };
  let kq: TraLoi | null = null;
  let vietLai = false;
  try {
    const lan1 = chuCuaClaude(await mt.goiClaude(thamSo));
    dung = lan1.dung;
    kq = lan1.chu === null ? null : docKetQua(lan1.chu, menu);
    if (kq) {
      const k = kiemTin(kq.tin, nn);
      if (k.ngoai.length || k.cam.length) {
        vietLai = true;
        try {
          const lan2 = chuCuaClaude(await mt.goiClaude({
            ...thamSo,
            messages: [...thamSo.messages, { role: 'assistant', content: lan1.chu }, { role: 'user', content: cauVietLai(k, nn) }],
          }));
          dung = congToken(dung, lan2.dung);
          const kq2 = lan2.chu === null ? null : docKetQua(lan2.chu, menu);
          if (kq2 && kq2.tin.length) kq = kq2;
        } catch (e) {
          log('[tro-ly-trang] viết lại lỗi, giữ bản đầu để gọt:', maLoi(e));
        }
      }
    }
  } catch (e) {
    const loi = maLoi(e);
    log('[tro-ly-trang] gọi Claude lỗi:', loi);
    await ghiLuot(mt.rpc, yc, { loi, mili_giay: bayGio() - batDau, ...tokenGhi(dung) }, log);
    return traJson({ ok: false, loi: 'tam_thoi' }, 502, nguon);
  }

  let thayTu = false;
  let boTin = 0;
  if (!kq || kq.tin.length === 0) {
    // Từ chối, hết token giữa chừng, JSON hỏng: câu an toàn, mời liên hệ quán — đúng sự thật, không bịa.
    kq = { tin: [], the: [], don: [], chot: false, chuyen_nguoi: true, cau_chua_biet: '' };
  }
  const got = gotTin(kq, nn);
  kq = got.kq;
  // Đơn lớn (từ 9 người): luôn hiện cách liên hệ quán, kể cả khi Claude quên đặt chuyen_nguoi (bộ chấm lần 1, câu #7).
  if (!kq.chuyen_nguoi && soNguoiKhachNoi(yc.tin) >= DON_LON_TU) kq = { ...kq, chuyen_nguoi: true };
  thayTu = got.thayTu;
  boTin = got.boTin;

  // 5 · Ghi nhật ký (hỏng thì vẫn trả câu đã có cho khách).
  await ghiLuot(mt.rpc, yc, {
    tra_loi: kq, doi_nguoi: khachDoiNguoi(yc.tin), viet_lai: vietLai, thay_tu: thayTu, bo_tin: boTin,
    mili_giay: bayGio() - batDau, ...tokenGhi(dung),
  }, log);
  return traJson(goiChoKhach(kq, menu, nn, yc.nnTrang), 200, nguon);
}

function tokenGhi(d: DungToken) {
  return { token_vao: d.vao, token_ra: d.ra, token_doc_dem: d.doc, token_ghi_dem: d.ghi };
}

async function ghiLuot(rpc: Rpc, yc: YeuCau, ketQua: Record<string, unknown>, log: (...x: unknown[]) => void): Promise<void> {
  try {
    const { data, error } = await rpc('tro_ly_ghi_luot', { p_cuoc: yc.cuoc, p_ma_tin: yc.maTin, p_ket_qua: ketQua });
    if (error) log('[tro-ly-trang] tro_ly_ghi_luot lỗi:', error.message ?? '');
    else if (data !== true) log('[tro-ly-trang] tro_ly_ghi_luot: không có lượt đang mở khớp');
  } catch (e) {
    log('[tro-ly-trang] không ghi được nhật ký:', e instanceof Error ? e.message : String(e));
  }
}

