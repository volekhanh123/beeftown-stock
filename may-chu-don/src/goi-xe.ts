/**
 * GỌI XE AHAMOVE — một lượt (main.ts gọi 15 giây một lần; kiểm thử gọi thẳng với fetch giả)
 * ========================================================================================
 *
 *   1. Lấy chuyến có việc đến hạn (SoDon.chuyenCanLam) và chuyến Ahamove im lâu (chuyenCanHoi). Không có thì thôi,
 *      không gọi Ahamove (không tạo token vô cớ: token mới làm chết token cũ).
 *   2. Token: giữ trong bộ nhớ (PhienAhamove); chưa có thì lấy; Ahamove báo 401 thì lấy lại một lần rồi gửi lại.
 *   3. Từng chuyến:
 *      · tao      — đánh dấu 'kiem_lai' TRƯỚC (SoDon.batDauTaoChuyen), rồi gửi Tạo đơn. Được: ghi mã Ahamove, link.
 *                   Ahamove không nhận (400/404/406): thôi, quầy thấy lý do. 503: chưa tạo, gửi lại sau 2 phút.
 *                   Mất mạng, hết giờ, 500, 409: KHÔNG gửi lại — để 'kiem_lai', lượt sau (sau 60 giây) tra lại.
 *      · kiem_lai — tra theo mã theo dõi (GET /v3/orders/tracks/<mã>): có đơn thì nhận lấy; chắc không có thì về 'tao'.
 *      · huy      — hủy theo mã Ahamove (chưa có thì theo mã theo dõi). Không có gì để hủy (404): xong. Ahamove không cho
 *                   hủy (406): hỏi trạng thái — đã khép thì thôi, còn chạy (tài xế đã lấy hàng) thì báo quầy.
 *   4. Hỏi trạng thái chuyến Ahamove im quá 3 phút (webhook lạc, hay chưa cài webhook).
 *
 * Mất mạng, Ahamove không trả lời: dừng lượt (lỗi chung), lượt sau làm tiếp. Không bao giờ ném lỗi vì Ahamove; lỗi sổ
 * đơn thì ném (main.ts ghi nhật ký). Nhật ký chỉ ghi mã đơn, lần, mã Ahamove, mã lỗi — không tên, không số điện
 * thoại, không địa chỉ, không token, không API key.
 */
import {
  MS_CHO_KIEM_LAI, docLoiAhamove, docTinChuyen, dungYeuCau, maTheoDoiXe, phanLoaiLoiTao, thanTaoChuyen, yeuCauToken,
  type CauHinhAhamove, type ChuyenXe, type TinChuyen, type YeuCauAhamove,
} from './ahamove.ts';
import type { SoDon } from './so-don.ts';

export type HamFetchAhamove = (url: string, init: YeuCauAhamove['init'] & { signal: AbortSignal }) =>
  Promise<{ status: number; text(): Promise<string> }>;

/**
 * Token Ahamove của máy chủ (trong bộ nhớ), lỗi lấy token gần nhất (/suc-khoe báo) và mốc được hỏi token lại: Ahamove
 * từ chối (sai API key, số, môi trường) thì chờ MS_CHO_TOKEN mới hỏi lại — không gửi API key 15 giây một lần.
 */
export interface PhienAhamove { token: string | null; loiToken: string | null; hoiTokenSau: number }
export const taoPhienAhamove = (): PhienAhamove => ({ token: null, loiToken: null, hoiTokenSau: 0 });
export const MS_CHO_TOKEN = 10 * 60_000;

export interface PhuThuocGoiXe {
  so: SoDon;
  cauHinh: CauHinhAhamove;
  hamFetch: HamFetchAhamove;
  bayGio: () => number;
  phien: PhienAhamove;
  ghi?: (cau: string) => void;
  /** Mỗi lượt làm tối đa chừng này chuyến (mỗi loại). */
  gioiHan?: number;
  /** Chờ Ahamove tối đa chừng này — kiểm thử đặt ngắn. */
  msHetGio?: number;
}

export interface KetQuaLuotXe {
  daTao: number;
  nhanLai: number;
  tuChoi: number;
  choKiemLai: number;
  daHuy: number;
  daHoi: number;
  /** Lượt dừng sớm (mất mạng, token) — câu không có bí mật. */
  dungVi: string | null;
}

const MS_HET_GIO = 15_000;
const MS_THU_LAI_MANG = 2 * 60_000;
const MS_THU_LAI_BAO_TRI = 2 * 60_000;

type KetQuaGoi = { status: number; json: unknown } | { loiMang: string };

/** Gọi Ahamove có hết giờ; không bao giờ ném lỗi. */
async function goi(p: PhuThuocGoiXe, yc: YeuCauAhamove): Promise<KetQuaGoi> {
  const ms = p.msHetGio ?? MS_HET_GIO;
  const huy = new AbortController();
  const hen = setTimeout(() => huy.abort(), ms);
  try {
    const lam = async (): Promise<KetQuaGoi> => {
      const tra = await p.hamFetch(yc.url, { ...yc.init, signal: huy.signal });
      let json: unknown;
      try { json = JSON.parse(await tra.text()); } catch { json = undefined; }
      return { status: tra.status, json };
    };
    return await Promise.race([
      lam(),
      new Promise<KetQuaGoi>(xong => huy.signal.addEventListener('abort',
        () => xong({ loiMang: `Ahamove không trả lời sau ${Math.round(ms / 1000)} giây` }))),
    ]);
  } catch (e) {
    return { loiMang: `Không gọi được Ahamove (${e instanceof Error ? e.message : String(e)})` };
  } finally {
    clearTimeout(hen);
  }
}

type KetQuaToken = { ok: true } | { ok: false; cau: string };

async function layToken(p: PhuThuocGoiXe, buoc: boolean): Promise<KetQuaToken> {
  if (!buoc && p.phien.token) return { ok: true };
  if (p.bayGio() < p.phien.hoiTokenSau) return { ok: false, cau: p.phien.loiToken ?? 'Chờ hỏi lại token Ahamove' };
  p.phien.token = null;
  const kq = await goi(p, yeuCauToken(p.cauHinh));
  if ('loiMang' in kq) return { ok: false, cau: `Chưa lấy được token Ahamove: ${kq.loiMang}` };
  const token = kq.json && typeof kq.json === 'object' ? (kq.json as { token?: unknown }).token : undefined;
  if (kq.status === 200 && typeof token === 'string' && token.length > 10) {
    p.phien.token = token;
    p.phien.loiToken = null;
    return { ok: true };
  }
  const l = docLoiAhamove(kq.status, kq.json);
  const cau = kq.status >= 500
    ? `Ahamove lỗi khi cấp token (${l.ma})`
    : `Ahamove từ chối cấp token (${l.ma}) — kiểm AHAMOVE_API_KEY, AHAMOVE_SO_DIEN_THOAI, AHAMOVE_MOI_TRUONG`;
  if (kq.status < 500) { p.phien.loiToken = cau; p.phien.hoiTokenSau = p.bayGio() + MS_CHO_TOKEN; }
  return { ok: false, cau };
}

/** Gọi có token; Ahamove báo 401 thì lấy token mới một lần rồi gửi lại. */
async function goiCoToken(p: PhuThuocGoiXe, method: string, duong: string, than?: unknown): Promise<KetQuaGoi | { khongToken: string }> {
  for (let lan = 0; ; lan++) {
    const kq = await goi(p, dungYeuCau(p.cauHinh, method, duong, p.phien.token, than));
    if ('loiMang' in kq || kq.status !== 401 || lan > 0) return kq;
    const tk = await layToken(p, true);
    if (!tk.ok) return { khongToken: tk.cau };
  }
}

const tenChuyen = (c: { maDon: string; lan: number }) => maTheoDoiXe(c.maDon, c.lan);

async function taoMot(p: PhuThuocGoiXe, c: ChuyenXe, ra: KetQuaLuotXe, ghi: (s: string) => void): Promise<void> {
  const { so } = p;
  const d = so.layDon(c.maDon);
  if (!d || !so.batDauTaoChuyen(c.maDon, c.lan, p.bayGio())) return;
  const kq = await goiCoToken(p, 'POST', '/v3/orders', thanTaoChuyen(d, c.lan, p.cauHinh));
  const sau = p.bayGio();
  if ('khongToken' in kq) {
    // Chưa gửi được đơn nào (token hỏng trước khi Ahamove nhận): về 'tao', không tính lần.
    so.traChuyenVeTao(c.maDon, c.lan, MS_THU_LAI_MANG, kq.khongToken, sau, false);
    ra.dungVi = kq.khongToken;
    return;
  }
  if ('loiMang' in kq) {
    // Ahamove có thể đã nhận: giữ 'kiem_lai' (đặt trước khi gửi), lượt sau tra lại theo mã theo dõi.
    so.hoanViecXe(c.maDon, c.lan, MS_CHO_KIEM_LAI, kq.loiMang, sau);
    ra.choKiemLai++;
    ra.dungVi = kq.loiMang;
    ghi(`${tenChuyen(c)}: chưa rõ đã tạo chưa (${kq.loiMang}) — tra lại sau`);
    return;
  }
  const tin = kq.status >= 200 && kq.status < 300 ? docTinChuyen(kq.json) : null;
  if (tin) {
    so.ghiTinAhamove(tin, sau, { ma: c.maDon, lan: c.lan });
    ra.daTao++;
    ghi(`${tenChuyen(c)}: đã tạo chuyến ${tin.maAha} (${tin.trangThai || '?'})`);
    return;
  }
  const l = docLoiAhamove(kq.status, kq.json);
  const kieu = kq.status >= 200 && kq.status < 300 ? 'khong_ro' : phanLoaiLoiTao(kq.status);
  if (kieu === 'tu_choi') {
    so.ghiLoiTaoChuyen(c.maDon, c.lan, l, sau);
    ra.tuChoi++;
    ghi(`${tenChuyen(c)}: Ahamove không nhận (${l.ma})`);
  } else if (kieu === 'bao_tri') {
    so.traChuyenVeTao(c.maDon, c.lan, MS_THU_LAI_BAO_TRI, `${l.ma} (HTTP ${kq.status})`, sau);
    ghi(`${tenChuyen(c)}: Ahamove đang bảo trì — gửi lại sau`);
  } else if (kieu === 'token') {
    // Vẫn 401 với token vừa lấy: chưa tạo. Lỗi chung — dừng lượt.
    so.traChuyenVeTao(c.maDon, c.lan, MS_THU_LAI_MANG, `${l.ma} (HTTP 401)`, sau, false);
    ra.dungVi = `Ahamove từ chối token (${l.ma})`;
  } else {
    so.hoanViecXe(c.maDon, c.lan, MS_CHO_KIEM_LAI, `${l.ma} (HTTP ${kq.status})`, sau);
    ra.choKiemLai++;
    ghi(`${tenChuyen(c)}: chưa rõ đã tạo chưa (${l.ma}, HTTP ${kq.status}) — tra lại sau`);
  }
}

/** Chọn đơn Ahamove của một mã theo dõi: đơn chưa hủy trước (nhận về chuyến đang chạy), không thì đơn đầu tiên. */
function chonTrongDanhSach(json: unknown, ma: string): TinChuyen | null | 'khong_doc_duoc' {
  if (!Array.isArray(json)) return 'khong_doc_duoc';
  const ds = json.map(docTinChuyen).filter((t): t is TinChuyen => !!t && (!t.maTheoDoi || t.maTheoDoi === ma));
  return ds.find(t => t.trangThai !== 'CANCELLED') ?? ds[0] ?? null;
}

async function kiemLaiMot(p: PhuThuocGoiXe, c: ChuyenXe, ra: KetQuaLuotXe, ghi: (s: string) => void): Promise<void> {
  const { so } = p;
  const ma = tenChuyen(c);
  const kq = await goiCoToken(p, 'GET', `/v3/orders/tracks/${encodeURIComponent(ma)}`);
  const sau = p.bayGio();
  if ('khongToken' in kq || 'loiMang' in kq) {
    const cau = 'khongToken' in kq ? kq.khongToken : kq.loiMang;
    so.hoanViecXe(c.maDon, c.lan, MS_THU_LAI_MANG, cau, sau);
    ra.dungVi = cau;
    return;
  }
  const chon = kq.status === 200 ? chonTrongDanhSach(kq.json, ma) : kq.status === 404 ? null : 'khong_doc_duoc';
  if (chon === 'khong_doc_duoc') {
    so.hoanViecXe(c.maDon, c.lan, MS_THU_LAI_MANG, `${docLoiAhamove(kq.status, kq.json).ma} (HTTP ${kq.status})`, sau);
    return;
  }
  if (chon) {
    so.ghiTinAhamove(chon, sau, { ma: c.maDon, lan: c.lan });
    ra.nhanLai++;
    ghi(`${ma}: tra lại thấy chuyến ${chon.maAha} (${chon.trangThai || '?'})`);
    return;
  }
  const viec = so.traChuyenVeTao(c.maDon, c.lan, 0, 'Tra lại: Ahamove chưa có đơn của mã này', sau);
  ghi(`${ma}: tra lại không thấy — ${viec === 'tao' ? 'gửi lại' : 'thôi'}`);
}

async function huyMot(p: PhuThuocGoiXe, c: ChuyenXe, ra: KetQuaLuotXe, ghi: (s: string) => void): Promise<void> {
  const { so } = p;
  const ma = tenChuyen(c);
  const lyDo = 'Khách hàng muốn hủy đơn';
  const kq = c.maAha
    ? await goiCoToken(p, 'DELETE', `/v3/orders/${encodeURIComponent(c.maAha)}`, { comment: lyDo })
    : await goiCoToken(p, 'DELETE', '/v3/orders/tracks', { tracking_number: ma, comment: lyDo });
  const sau = p.bayGio();
  if ('khongToken' in kq || 'loiMang' in kq) {
    const cau = 'khongToken' in kq ? kq.khongToken : kq.loiMang;
    so.hoanHuyChuyen(c.maDon, c.lan, MS_THU_LAI_MANG, cau, sau);
    ra.dungVi = cau;
    return;
  }
  if (kq.status === 200 || kq.status === 404) {
    so.ghiDaHuyChuyen(c.maDon, c.lan, sau);
    ra.daHuy++;
    ghi(`${ma}: ${kq.status === 200 ? 'đã hủy chuyến' : 'không có chuyến nào để hủy'}`);
    return;
  }
  const l = docLoiAhamove(kq.status, kq.json);
  if (kq.status === 406 && c.maAha) {
    // Ahamove không cho hủy ở trạng thái này: hỏi trạng thái — đã khép (đã hủy, đã giao) thì thôi việc hủy.
    const ct = await goiCoToken(p, 'GET', `/v3/orders/${encodeURIComponent(c.maAha)}`);
    const tin = !('khongToken' in ct) && !('loiMang' in ct) && ct.status === 200 ? docTinChuyen(ct.json) : null;
    if (tin) so.ghiTinAhamove(tin, p.bayGio(), { ma: c.maDon, lan: c.lan });
    if (so.layChuyen(c.maDon, c.lan)?.viec !== 'huy') return;
  }
  if (kq.status === 406 || kq.status === 403 || kq.status === 401) {
    so.ghiHuyKhongDuoc(c.maDon, c.lan, `${l.ma} (HTTP ${kq.status})`, p.bayGio());
    ghi(`${ma}: không hủy được (${l.ma})`);
    return;
  }
  so.hoanHuyChuyen(c.maDon, c.lan, MS_THU_LAI_MANG, `${l.ma} (HTTP ${kq.status})`, sau);
}

async function hoiMot(p: PhuThuocGoiXe, c: ChuyenXe, ra: KetQuaLuotXe): Promise<void> {
  const { so } = p;
  const kq = await goiCoToken(p, 'GET', `/v3/orders/${encodeURIComponent(c.maAha!)}`);
  const sau = p.bayGio();
  so.daHoiChuyen(c.maDon, c.lan, sau);
  if ('khongToken' in kq || 'loiMang' in kq) { ra.dungVi = 'khongToken' in kq ? kq.khongToken : kq.loiMang; return; }
  const tin = kq.status === 200 ? docTinChuyen(kq.json) : null;
  if (tin && tin.maAha === c.maAha) { so.ghiTinAhamove(tin, sau, { ma: c.maDon, lan: c.lan }); ra.daHoi++; }
}

/** Một lượt. Không bao giờ ném lỗi vì Ahamove; lỗi sổ đơn thì ném (main.ts ghi nhật ký, lượt sau chạy lại). */
export async function goiXeMotLuot(p: PhuThuocGoiXe): Promise<KetQuaLuotXe> {
  const ghi = (s: string) => { try { (p.ghi ?? console.log)(`Ahamove: ${s}`); } catch { /* nhật ký hỏng không làm hỏng lượt */ } };
  const ra: KetQuaLuotXe = { daTao: 0, nhanLai: 0, tuChoi: 0, choKiemLai: 0, daHuy: 0, daHoi: 0, dungVi: null };
  const ms = p.bayGio();
  const viec = p.so.chuyenCanLam(ms, p.gioiHan ?? 10);
  const hoi = p.so.chuyenCanHoi(ms, p.gioiHan ?? 10);
  if (!viec.length && !hoi.length) return ra;
  const tk = await layToken(p, false);
  if (!tk.ok) { ra.dungVi = tk.cau; ghi(tk.cau); return ra; }
  for (const c of viec) {
    if (c.viec === 'tao') await taoMot(p, c, ra, ghi);
    else if (c.viec === 'kiem_lai') await kiemLaiMot(p, c, ra, ghi);
    else if (c.viec === 'huy') await huyMot(p, c, ra, ghi);
    if (ra.dungVi) { ghi(`dừng lượt: ${ra.dungVi}`); return ra; }
  }
  for (const c of hoi) {
    await hoiMot(p, c, ra);
    if (ra.dungVi) { ghi(`dừng lượt: ${ra.dungVi}`); return ra; }
  }
  return ra;
}
