/**
 * TIN ZNS BÁO KHÁCH (đợt 3) — "Beeftown đã nhận đơn", "Đơn đã soạn xong, chờ giao"
 * ================================================================================
 *
 * Gửi từ chính máy chủ đơn (ở Việt Nam): tin ZNS cần số điện thoại khách, mà dữ liệu khách Mini App phải xử lý ở Việt
 * Nam (CLAUDE.md của thư mục, "Vì sao là một máy chủ riêng") — không qua website (Cloudflare, Supabase Singapore).
 *
 * APP ZALO RIÊNG. Website gửi tin Zalo bằng App Zalo của nó và làm mới token 5 phút một lần (web/src/lib/zalo-gui.ts).
 * Refresh token của Zalo chỉ dùng MỘT lần: hai máy cùng làm mới một App thì làm chết token của nhau. Máy chủ đơn dùng
 * một App Zalo khác (README, "Tin ZNS"), cùng OA Beeftown; hai mẫu tin đăng ký dưới App này. Giả định (chưa đối chiếu
 * tài liệu chính thức, 09/11/2026): mẫu ZNS gắn với cặp OA + App — tạo dưới App của website thì App này không gửi được.
 *
 * Dùng lại phần THUẦN của website: địa chỉ, tên trường, bảng mã lỗi Zalo (web/src/lib/zalo.ts — đã đối chiếu tài liệu
 * Zalo 23/10/2026), mã hóa token AES-GCM (web/src/lib/zalo-ma-hoa.ts). Zalo đổi API thì sửa ở đó, chạy cả kiểm thử web.
 *
 * Không gửi trùng, không báo sai (CLAUDE.md gốc, mục bam-hai-lan, mat-mang):
 *   · tin xếp CÙNG giao dịch với bước đổi trạng thái, mỗi đơn mỗi bước một dòng (SoDon.xepTinZns);
 *   · trước khi gọi Zalo, tin sang dang_gui (SoDon.giuTinZns). Gọi xong mới ghi kết quả;
 *   · mất mạng TRƯỚC khi tới Zalo (không kết nối được, không phân giải được tên miền) → thử lại sau 5 phút;
 *   · đã gửi đi mà không biết Zalo nhận chưa (hết giờ chờ, đứt giữa chừng, 2xx thân lạ, máy chủ tắt giữa lúc gọi)
 *     → khong_ro, KHÔNG gửi lại: khách vẫn thấy trạng thái đơn trong app, màn quầy báo để gọi khách khi cần;
 *   · tin chỉ đi khi còn đúng: đơn còn ở bước đó và chưa quá giờ khách muốn nhận. Không thì bo_qua.
 * Log: không token, không secret key, không số điện thoại (xoaBiMatZalo), không tên khách.
 */
import { congNgay, homNayVn } from '../../web/src/lib/gio-vn.ts';
import {
  XU_LY_LOI, ZALO_API, docPhanHoi, docPhanHoiToken, dungYeuCauGui, dungYeuCauToken, sdtZalo, xoaBiMatZalo, type LoaiLoiZalo,
} from '../../web/src/lib/zalo.ts';
import { danKhoaZalo, giaiMaTokenZalo, khoaZaloHopLe, maHoaTokenZalo } from '../../web/src/lib/zalo-ma-hoa.ts';
import type { BuocZns, SoDon, TinZnsDenHan } from './so-don.ts';
import type { TrangThai } from './trang-thai.ts';

export const ZNS = {
  /** main.ts chạy một lượt mỗi chừng này giây. */
  moiLuotGiay: 15,
  toiDaMoiLuot: 20,
  /** Lỗi tạm thời (mất mạng, Zalo bận): thử tối đa chừng này lần rồi thôi (loi). */
  soLanToiDa: 5,
  thuLaiMangGiay: 300,
  /** Quá giờ khách muốn nhận chừng này phút mà tin chưa đi: bỏ — tin không còn đúng lúc. */
  quaGioNhanPhut: 60,
  /**
   * Tham số của từng mẫu — tên phải đúng y tên tham số khi đăng ký mẫu trên Zalo (README, "Tin ZNS"). Zalo từ chối
   * thân có tham số mẫu không khai, nên mỗi mẫu chỉ gửi đúng các tham số của nó.
   */
  thamSo: {
    da_nhan: ['ten_khach', 'so_don', 'ma_don', 'gio_nhan', 'tong_tien'],
    soan_xong: ['ten_khach', 'so_don', 'ma_don', 'gio_nhan'],
  } as const satisfies Record<BuocZns, readonly string[]>,
  /** Đơn phải đang ở một trong các bước này thì tin mới còn đúng. */
  conDung: {
    da_nhan: ['da_thanh_toan', 'dang_soan', 'cho_lay'],
    soan_xong: ['cho_lay'],
  } as const satisfies Record<BuocZns, readonly TrangThai[]>,
  /** Mã lỗi mạng của Bun khi yêu cầu chưa ra khỏi máy (thử Bun 09/11/2026): gửi lại không thể trùng. */
  maMangChuaGui: ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ENETUNREACH', 'EHOSTUNREACH', 'ConnectionRefused', 'FailedToOpenSocket'],
  /** Tên khách trong tin: Zalo giới hạn độ dài tham số; cắt bớt cho chắc (giả định 30 ký tự như tham số tên của ZNS). */
  tenToiDa: 30,
} as const;

/** Biến môi trường của tin ZNS — đặt đủ cả năm, hoặc không cái nào (chưa gửi tin). ZNS_CHE_DO: thu (mặc định) / that. */
export const BIEN_ZNS = ['ZALO_APP_ID', 'ZALO_SECRET_KEY', 'ZALO_KHOA', 'ZNS_MAU_DA_NHAN', 'ZNS_MAU_SOAN_XONG'] as const;

export interface CauHinhZns {
  appId: string;
  secretKey: string;
  khoa: CryptoKey;
  mau: Record<BuocZns, string>;
  /** thu: mode "development" của Zalo — chỉ quản trị viên của OA / App nhận, khách thật không nhận gì. */
  cheDo: 'thu' | 'that';
}

export type DocCauHinhZns = { trang: 'tat' } | { trang: 'loi'; loi: string } | { trang: 'bat'; cauHinh: CauHinhZns };

/** Đọc cấu hình từ biến môi trường. Nửa vời (thiếu một biến, gõ sai) là lỗi: main.ts không mở máy chủ. */
export async function docCauHinhZns(env: Record<string, string | undefined>): Promise<DocCauHinhZns> {
  const gt = (t: string) => (env[t] ?? '').trim();
  const co = BIEN_ZNS.filter(t => gt(t) !== '');
  if (co.length === 0) return { trang: 'tat' };
  const thieu = BIEN_ZNS.filter(t => gt(t) === '');
  if (thieu.length) return { trang: 'loi', loi: `Tin ZNS: đặt đủ ${BIEN_ZNS.join(', ')} hoặc không đặt cái nào — đang thiếu ${thieu.join(', ')}.` };
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(gt('ZALO_APP_ID'))) return { trang: 'loi', loi: 'ZALO_APP_ID chỉ gồm chữ, số, "_", "-" (App ID ở developers.zalo.me).' };
  if (gt('ZALO_SECRET_KEY').length < 8) return { trang: 'loi', loi: 'ZALO_SECRET_KEY quá ngắn — chép Secret Key của App Zalo của máy chủ đơn.' };
  if (!khoaZaloHopLe(gt('ZALO_KHOA'))) return { trang: 'loi', loi: 'ZALO_KHOA phải có ít nhất 32 ký tự (openssl rand -base64 32).' };
  for (const t of ['ZNS_MAU_DA_NHAN', 'ZNS_MAU_SOAN_XONG'] as const) {
    if (!/^\d{1,20}$/.test(gt(t))) return { trang: 'loi', loi: `${t} là mã mẫu Zalo (chỉ chữ số) của mẫu đã được duyệt.` };
  }
  const cheDo = gt('ZNS_CHE_DO') || 'thu';
  if (cheDo !== 'thu' && cheDo !== 'that') return { trang: 'loi', loi: 'ZNS_CHE_DO là "thu" (chỉ quản trị viên OA nhận) hoặc "that".' };
  return {
    trang: 'bat',
    cauHinh: {
      appId: gt('ZALO_APP_ID'), secretKey: gt('ZALO_SECRET_KEY'), khoa: await danKhoaZalo(gt('ZALO_KHOA')),
      mau: { da_nhan: gt('ZNS_MAU_DA_NHAN'), soan_xong: gt('ZNS_MAU_SOAN_XONG') }, cheDo,
    },
  };
}

/** "2026-11-13", "10:30" → "10:30 13/11/2026" (giờ Việt Nam, như khách chọn). */
export function gioNhanTrongTin(ngay: string, gio: string): string {
  const m = ngay.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${gio} ${m[3]}/${m[2]}/${m[1]}` : `${gio} ${ngay}`;
}

/** template_data của một tin — đúng các tham số của mẫu bước đó. */
export function duLieuTin(tin: TinZnsDenHan): Record<string, string> {
  const tat: Record<(typeof ZNS.thamSo)['da_nhan'][number], string> = {
    ten_khach: Array.from(tin.ten.trim()).slice(0, ZNS.tenToiDa).join(''),
    so_don: String(tin.soTrongNgay),
    ma_don: tin.maDon,
    gio_nhan: gioNhanTrongTin(tin.ngayNhan, tin.gioNhan),
    // Số tiền dạng số (tham số kiểu "tiền tệ" của mẫu — Zalo tự định dạng). Giả định, README "Tin ZNS".
    tong_tien: String(tin.tongTien),
  };
  return Object.fromEntries(ZNS.thamSo[tin.buoc].map(k => [k, tat[k]]));
}

/** Tin còn đúng không — lý do bỏ, hoặc null (gửi được). */
export function lyDoBoQua(tin: TinZnsDenHan, ms: number): string | null {
  if (!(ZNS.conDung[tin.buoc] as readonly TrangThai[]).includes(tin.trangThaiDon)) return `Đơn đã sang bước ${tin.trangThaiDon}`;
  const gioNhan = Date.parse(`${tin.ngayNhan}T${tin.gioNhan}:00+07:00`);
  if (Number.isFinite(gioNhan) && ms > gioNhan + ZNS.quaGioNhanPhut * 60_000) return 'Đã quá giờ khách muốn nhận';
  return null;
}

/** Zalo báo loại tin không gửi được 22:00–07:00 (-133): thử lại lúc 07:00 giờ Việt Nam kế tiếp. */
export function bayGioSangVn(ms: number): number {
  const homNay = Date.parse(`${homNayVn(ms)}T07:00:00+07:00`);
  return ms < homNay ? homNay : Date.parse(`${congNgay(homNayVn(ms), 1)}T07:00:00+07:00`);
}

type KetQuaGoi =
  | { kieu: 'tra_loi'; status: number; json: unknown }
  /** Yêu cầu chưa ra khỏi máy: gửi lại không trùng. */
  | { kieu: 'chua_gui'; cau: string }
  /** Đã gửi đi mà không có câu trả lời đọc được: có thể Zalo đã nhận. */
  | { kieu: 'khong_ro'; cau: string };

export interface PhuThuocZns {
  fetch?: (url: string, init: RequestInit) => Promise<Response>;
  bayGio?: () => number;
  ghiLog?: (cau: string) => void;
  /** Chờ Zalo tối đa (ms) — mặc định ZALO_API.timeoutMs; kiểm thử đặt ngắn. */
  hetGioMs?: number;
}

export interface KetQuaLuotZns { daGui: number; khongRo: number; loi: number; boQua: number; thuLai: number; dungVi: string | null }

/** Bộ gửi tin ZNS — main.ts gọi luot() mỗi ZNS.moiLuotGiay giây, không bao giờ hai lượt chồng nhau. */
export function taoBoGuiZns(so: SoDon, ch: CauHinhZns, pt: PhuThuocZns = {}) {
  const goiFetch = pt.fetch ?? ((url: string, init: RequestInit) => fetch(url, init));
  const bayGio = pt.bayGio ?? (() => Date.now());
  const hetGioMs = pt.hetGioMs ?? ZALO_API.timeoutMs;
  let cauCuoi = '';
  /** Lần làm mới token vừa hỏng tạm thời: chờ tới mốc này mới gọi Zalo làm mới lại (không gọi mỗi 15 giây). */
  let choLamMoiDen = 0;
  /** Ghi log — câu giống hệt câu trước (vd. "chưa có refresh token" mỗi 15 giây) thì không ghi lại. */
  const ghi = (cau: string, lap = false) => {
    const s = xoaBiMatZalo(cau, ch.secretKey);
    if (!lap && s === cauCuoi) return;
    cauCuoi = s;
    try { (pt.ghiLog ?? console.log)(`Tin ZNS: ${s}`); } catch { /* log hỏng không làm hỏng lượt */ }
  };

  async function goi(url: string, init: RequestInit): Promise<KetQuaGoi> {
    const huy = new AbortController();
    const hen = setTimeout(() => huy.abort(), hetGioMs);
    try {
      let res: Response;
      try { res = await goiFetch(url, { ...init, signal: huy.signal }); }
      catch (e) {
        const ma = String((e as { code?: unknown })?.code ?? '');
        const cau = huy.signal.aborted ? `Zalo không trả lời sau ${hetGioMs / 1000} giây` : `Không gọi được Zalo: ${String((e as Error)?.message ?? e)}`;
        return !huy.signal.aborted && (ZNS.maMangChuaGui as readonly string[]).includes(ma) ? { kieu: 'chua_gui', cau } : { kieu: 'khong_ro', cau };
      }
      let chu: string;
      try { chu = await res.text(); }
      catch (e) { return { kieu: 'khong_ro', cau: `Đứt kết nối khi đọc câu trả lời của Zalo (HTTP ${res.status})` }; }
      let json: unknown;
      try { json = JSON.parse(chu); } catch { json = undefined; }
      return { kieu: 'tra_loi', status: res.status, json };
    } finally { clearTimeout(hen); }
  }

  /**
   * Access token dùng được, hoặc null (chưa có / Zalo từ chối / mạng hỏng — lượt sau thử lại). Còn dưới một giờ thì
   * làm mới, kể cả khi không có tin nào: refresh token sống ~3 tháng, chỉ được gia hạn khi làm mới.
   */
  async function accessToken(ms: number, ep = false): Promise<string | null> {
    const t = so.layTokenZalo();
    if (!t) { ghi('chưa có refresh token — chạy lệnh đặt token (README, "Tin ZNS").'); return null; }
    if (t.loi) { ghi(`${t.loi} — chạy lại lệnh đặt token.`); return null; }
    // Access token cũ còn hạn: dùng được trong lúc chờ làm mới (Zalo OAuth hỏng tạm thời không làm ngừng gửi tin).
    const accessCu = !ep && t.accessMa && t.hetHanLuc !== null && t.hetHanLuc > ms ? await giaiMaTokenZalo(ch.khoa, t.accessMa, 'access') : null;
    if (accessCu && t.hetHanLuc! - ms > ZALO_API.lamMoiKhiConGiay * 1000) return accessCu;
    if (!ep && ms < choLamMoiDen) return accessCu;
    const refresh = await giaiMaTokenZalo(ch.khoa, t.refreshMa, 'refresh');
    if (!refresh) {
      so.ghiLoiTokenZalo(t.refreshMa, 'Không giải mã được refresh token (ZALO_KHOA đã đổi?)', ms);
      ghi('không giải mã được refresh token (ZALO_KHOA đã đổi?) — chạy lại lệnh đặt token.');
      return null;
    }
    const yc = dungYeuCauToken({ appId: ch.appId, refreshToken: refresh, secretKey: ch.secretKey });
    const r = await goi(yc.url, yc.init);
    if (r.kieu !== 'tra_loi') {
      // Hết giờ chờ lúc làm mới: Zalo có thể đã đổi token rồi mà máy không nhận được cái mới — lần sau sẽ biết.
      ghi(`không làm mới được token: ${xoaBiMatZalo(r.cau, refresh)}.`);
      choLamMoiDen = ms + 60_000;
      return accessCu;
    }
    const p = docPhanHoiToken(r.status, r.json);
    if (!p.ok) {
      const cau = xoaBiMatZalo(p.cau, refresh, ch.secretKey);
      if (!p.tamThoi) so.ghiLoiTokenZalo(t.refreshMa, `Zalo từ chối refresh token (${cau})`, ms);
      ghi(p.tamThoi ? `không làm mới được token: ${cau}.` : `Zalo từ chối refresh token (${cau}) — lấy refresh token mới và chạy lại lệnh đặt token.`);
      if (p.tamThoi) { choLamMoiDen = ms + 60_000; return accessCu; }
      return null;
    }
    // Refresh token mới phải vào sổ NGAY: cái cũ đã chết. Ghi hỏng thì token chết theo — log nói thật.
    try {
      const moi = {
        refreshMa: await maHoaTokenZalo(ch.khoa, p.refreshToken ?? refresh, 'refresh'),
        accessMa: await maHoaTokenZalo(ch.khoa, p.accessToken, 'access'),
        hetHanLuc: ms + p.hetHanGiay * 1000,
      };
      if (!so.luuTokenZalo(t.refreshMa, moi, ms)) { ghi('refresh token vừa được đặt lại giữa lúc làm mới — lượt sau dùng token mới đặt.'); return null; }
    } catch (e) {
      ghi(`làm mới được token nhưng KHÔNG ghi được vào sổ đơn (${String((e as Error)?.message ?? e)}) — token có thể đã mất, chạy lại lệnh đặt token nếu lượt sau báo Zalo từ chối.`, true);
      return null;
    }
    ghi(`đã làm mới token, hạn ${Math.round(p.hetHanGiay / 3600)} giờ.`);
    return p.accessToken;
  }

  async function guiMot(tin: TinZnsDenHan, sdt84: string, token: string): Promise<KetQuaGoi> {
    const yc = dungYeuCauGui({
      sdt84, templateId: ch.mau[tin.buoc], duLieu: duLieuTin(tin), trackingId: `${tin.maDon}-${tin.buoc}`, cheDo: ch.cheDo,
    }, token);
    return goi(yc.url, yc.init);
  }

  /** Một lượt: token, rồi tối đa ZNS.toiDaMoiLuot tin đến hạn. Không bao giờ ném lỗi ra ngoài. */
  async function luot(): Promise<KetQuaLuotZns> {
    const kq: KetQuaLuotZns = { daGui: 0, khongRo: 0, loi: 0, boQua: 0, thuLai: 0, dungVi: null };
    const ms = bayGio();
    let token = await accessToken(ms);
    if (!token) return { ...kq, dungVi: 'token' };
    let daLamMoi = false;
    for (const tin of so.tinZnsDenHan(ms, ZNS.toiDaMoiLuot)) {
      const ten = `đơn #${tin.soTrongNgay} (${tin.maDon}) ${tin.buoc}`;
      const boQua = lyDoBoQua(tin, ms);
      if (boQua) { if (so.ghiKetQuaTinZns(tin.maDon, tin.buoc, 'cho', { trangThai: 'bo_qua', lyDo: boQua }, ms)) kq.boQua++; continue; }
      const sdt = sdtZalo(tin.dienThoai);
      if (!sdt) {
        if (so.ghiKetQuaTinZns(tin.maDon, tin.buoc, 'cho', { trangThai: 'loi', lyDo: 'Số điện thoại không dùng được cho Zalo' }, ms)) kq.loi++;
        continue;
      }
      if (!so.giuTinZns(tin.maDon, tin.buoc)) continue;
      const lanThu = tin.soLan + 1;
      let r = await guiMot(tin, sdt, token);
      let p = r.kieu === 'tra_loi' ? docPhanHoi(r.status, r.json) : null;
      // Token hỏng (Zalo chưa nhận tin): làm mới một lần trong lượt rồi gửi lại đúng tin này.
      if (p && !p.ok && p.loai === 'token' && !daLamMoi) {
        daLamMoi = true;
        const moi = await accessToken(bayGio(), true);
        if (moi) { token = moi; r = await guiMot(tin, sdt, token); p = r.kieu === 'tra_loi' ? docPhanHoi(r.status, r.json) : null; }
      }
      const luc = bayGio();
      const ghiKq = (k: Parameters<SoDon['ghiKetQuaTinZns']>[3]) => so.ghiKetQuaTinZns(tin.maDon, tin.buoc, 'dang_gui', k, luc);
      if (r.kieu === 'khong_ro' || (p && !p.ok && p.ma === null && r.kieu === 'tra_loi' && r.status >= 200 && r.status < 300)) {
        const cau = r.kieu === 'khong_ro' ? r.cau : 'Zalo trả 2xx mà thân không đọc được';
        ghiKq({ trangThai: 'khong_ro', lyDo: `${cau} — không gửi lại` });
        kq.khongRo++; ghi(`${ten}: không rõ Zalo đã nhận chưa (${cau}) — không gửi lại.`, true);
        continue;
      }
      if (r.kieu === 'chua_gui') {
        const het = lanThu >= ZNS.soLanToiDa;
        ghiKq(het ? { trangThai: 'loi', lyDo: `${r.cau} (${lanThu} lần)` } : { trangThai: 'cho', thuLaiLuc: luc + ZNS.thuLaiMangGiay * 1000, lyDo: r.cau });
        if (het) kq.loi++; else kq.thuLai++;
        ghi(`${ten}: ${r.cau} — ${het ? 'thôi, đã thử đủ lần' : 'thử lại sau 5 phút'}.`, true);
        kq.dungVi = 'mang';
        break;   // mất mạng: tin sau cũng hỏng, đợi lượt sau
      }
      if (p!.ok) {
        ghiKq({ trangThai: 'da_gui', lyDo: '' });
        kq.daGui++; ghi(`${ten}: đã gửi${ch.cheDo === 'thu' ? ' (chế độ thử: chỉ quản trị viên OA nhận)' : ''}.`, true);
        continue;
      }
      const loi = p as Extract<typeof p, { ok: false }>;
      const loai: LoaiLoiZalo = loi.loai;
      const xl = XU_LY_LOI[loai];
      const cau = xoaBiMatZalo(loi.cau, token, ch.secretKey);
      if (loai === 'nguoi_nhan' || loai === 'mau' || xl.thuLaiSau === null) {
        ghiKq({ trangThai: 'loi', maLoi: loi.ma, lyDo: cau }); kq.loi++;
        ghi(`${ten}: ${cau} — không gửi lại.`, true);
      } else if (loai === 'ngoai_gio') {
        ghiKq({ trangThai: 'cho', thuLaiLuc: bayGioSangVn(luc), maLoi: loi.ma, lyDo: cau }); kq.thuLai++;
        ghi(`${ten}: ${cau} — gửi lại lúc 07:00.`, true);
      } else if (lanThu >= ZNS.soLanToiDa) {
        ghiKq({ trangThai: 'loi', maLoi: loi.ma, lyDo: `${cau} (${lanThu} lần)` }); kq.loi++;
        ghi(`${ten}: ${cau} — thôi, đã thử ${lanThu} lần.`, true);
      } else {
        ghiKq({ trangThai: 'cho', thuLaiLuc: luc + xl.thuLaiSau * 1000, maLoi: loi.ma, lyDo: cau }); kq.thuLai++;
        ghi(`${ten}: ${cau} — thử lại sau ${Math.round(xl.thuLaiSau / 60)} phút.`, true);
      }
      if (xl.dungLuot) { kq.dungVi = loai; break; }
    }
    return kq;
  }

  return {
    async luot(): Promise<KetQuaLuotZns> {
      try { return await luot(); }
      catch (e) { ghi(`lượt gửi hỏng: ${String((e as Error)?.message ?? e)}`, true); return { daGui: 0, khongRo: 0, loi: 0, boQua: 0, thuLai: 0, dungVi: 'loi' }; }
    },
  };
}
