/**
 * GỬI TIN ZNS — một lượt (main.ts gọi mỗi phút; kiểm thử gọi thẳng với fetch giả)
 * ===============================================================================
 *
 *   1. Bỏ tin quá cũ hay đơn đã sang bước khác (SoDon.boQuaTinZnsCu).
 *   2. Lấy tin đến hạn. Không có thì thôi, không gọi Zalo.
 *   3. Access token còn dưới 1 giờ (ZALO_API.lamMoiKhiConGiay) thì làm mới, và LƯU cặp token mới vào sổ đơn TRƯỚC khi
 *      gửi — refresh token cũ chết ngay khi Zalo trả cái mới.
 *   4. Từng tin: 'cho' → 'dang_gui' → gọi Zalo → ghi kết quả theo bảng XU_LY_LOI của web (cùng cách xử lý mã lỗi):
 *      lỗi của riêng tin (người nhận, mẫu) thì thôi tin đó; lỗi chung (hết quota, giới hạn, cấu hình, ngoài giờ) thì
 *      trả tin về hàng chờ và dừng lượt; token sai thì làm mới một lần rồi gửi lại.
 *
 * Mất mạng, hết giờ: thử lại sau 5 phút, như phần gửi của web (web/src/lib/zalo-gui.ts). Máy chủ tắt giữa lúc gọi
 * Zalo: tin thành 'khong_ro' khi khởi động lại, không gửi lại (SoDon.datKhongRoTinZnsDangGui).
 * Nhật ký chỉ ghi mã đơn, loại tin, mã lỗi — không tên, không số điện thoại, không token (xoaBiMatZalo).
 */
import {
  CAU_GUI, XU_LY_LOI, ZALO_API, docPhanHoi, docPhanHoiToken, dungYeuCauGui, dungYeuCauToken, sdtZalo, xoaBiMatZalo,
  type PhanHoiGui, type YeuCau,
} from '../../web/src/lib/zalo.ts';
import type { SoDon } from './so-don.ts';
import { duLieuTin, giaiMaToken, maHoaToken, maTheoDoi, type CauHinhZns } from './zns.ts';

/** fetch tối thiểu cần dùng — kiểm thử truyền bản giả. */
export type HamFetchZalo = (url: string, init: YeuCau['init'] & { signal: AbortSignal }) =>
  Promise<{ status: number; text(): Promise<string> }>;

export interface PhuThuocGuiZns {
  so: SoDon;
  cauHinh: CauHinhZns;
  hamFetch: HamFetchZalo;
  bayGio: () => number;
  ghi?: (cau: string) => void;
  /** Mỗi lượt gửi tối đa chừng này tin. */
  gioiHan?: number;
  /** Chờ Zalo tối đa chừng này (mặc định ZALO_API.timeoutMs) — kiểm thử đặt ngắn. */
  msHetGio?: number;
}

export interface KetQuaLuotZns {
  daGui: number;
  thatBai: number;
  hoanLai: number;
  boQua: number;
  /** Lượt dừng sớm vì lỗi chung (token, quota, cấu hình…) — câu đã xóa bí mật. */
  dungVi: string | null;
}

type KetQuaGoi = { status: number; json: unknown } | { loiMang: string };

/** Gọi Zalo có hết giờ; không bao giờ ném lỗi. */
async function goiZalo(hamFetch: HamFetchZalo, yc: YeuCau, msHetGio: number = ZALO_API.timeoutMs): Promise<KetQuaGoi> {
  const huy = new AbortController();
  const hen = setTimeout(() => huy.abort(), msHetGio);
  try {
    const lam = async (): Promise<KetQuaGoi> => {
      const tra = await hamFetch(yc.url, { ...yc.init, signal: huy.signal });
      let json: unknown;
      try { json = JSON.parse(await tra.text()); } catch { json = undefined; }
      return { status: tra.status, json };
    };
    return await Promise.race([
      lam(),
      new Promise<KetQuaGoi>(xong => huy.signal.addEventListener('abort',
        () => xong({ loiMang: CAU_GUI.khongTraLoi.vi(String(Math.round(msHetGio / 1000))) }))),
    ]);
  } catch (e) {
    return { loiMang: CAU_GUI.mang.vi(e instanceof Error ? e.message : String(e)) };
  } finally {
    clearTimeout(hen);
  }
}

type KetQuaToken = { ok: true; accessToken: string } | { ok: false; cau: string };

/** Access token dùng được: đọc sổ đơn, làm mới khi gần hết hạn hay khi `buoc` (Zalo vừa báo token sai). */
async function layAccessToken(p: PhuThuocGuiZns, buoc: boolean): Promise<KetQuaToken> {
  const { so, cauHinh } = p;
  const ms = p.bayGio();
  const t = so.docTokenZalo();
  if (!t?.refreshMa) return { ok: false, cau: 'Chưa có refresh token Zalo — đặt ZALO_REFRESH_TOKEN_MOI rồi chạy lại máy chủ' };
  const refresh = giaiMaToken(t.refreshMa, cauHinh.secretKey);
  if (!refresh) {
    const cau = 'Không giải mã được token Zalo (ZALO_SECRET_KEY đã đổi?) — đặt lại ZALO_REFRESH_TOKEN_MOI';
    so.ghiLoiTokenZalo('khong_giai_ma', cau, ms);
    return { ok: false, cau };
  }
  const access = giaiMaToken(t.accessMa, cauHinh.secretKey);
  if (!buoc && access && t.hetHanLuc !== null && t.hetHanLuc - ms > ZALO_API.lamMoiKhiConGiay * 1000) {
    return { ok: true, accessToken: access };
  }
  const kq = await goiZalo(p.hamFetch, dungYeuCauToken({ appId: cauHinh.appId, refreshToken: refresh, secretKey: cauHinh.secretKey }),
    p.msHetGio);
  const ph = 'loiMang' in kq ? { ok: false as const, tamThoi: true, cau: kq.loiMang } : docPhanHoiToken(kq.status, kq.json);
  if (!ph.ok) {
    const cau = xoaBiMatZalo(ph.cau, refresh, cauHinh.secretKey);
    if (!ph.tamThoi) {
      so.ghiLoiTokenZalo('bi_tu_choi', cau, ms);
      return { ok: false, cau: `Zalo từ chối refresh token (${cau}) — lấy refresh token mới, đặt ZALO_REFRESH_TOKEN_MOI` };
    }
    return { ok: false, cau: `Chưa làm mới được token Zalo: ${cau}` };
  }
  // Refresh token cũ đã chết: lưu cái mới phải được. Sổ đơn bận thì thử lại; vẫn hỏng thì báo rõ phải dán lại.
  const moi = {
    refreshMa: ph.refreshToken ? maHoaToken(ph.refreshToken, cauHinh.secretKey) : null,
    accessMa: maHoaToken(ph.accessToken, cauHinh.secretKey),
    hetHanLuc: ms + ph.hetHanGiay * 1000,
  };
  for (let lan = 1; ; lan++) {
    try { so.luuTokenZalo(moi, ms); break; }
    catch (e) {
      if (lan >= 3) {
        return { ok: false, cau: `Đã làm mới token Zalo nhưng không lưu được (${e instanceof Error ? e.message : String(e)}) — `
          + 'lấy refresh token mới, đặt ZALO_REFRESH_TOKEN_MOI' };
      }
      await new Promise(xong => setTimeout(xong, 200 * lan));
    }
  }
  return { ok: true, accessToken: ph.accessToken };
}

/** Một lượt gửi. Không bao giờ ném lỗi vì Zalo; lỗi sổ đơn thì ném (main.ts ghi nhật ký, lượt sau chạy lại). */
export async function guiZnsMotLuot(p: PhuThuocGuiZns): Promise<KetQuaLuotZns> {
  const { so, cauHinh } = p;
  const ghi = (s: string) => { try { (p.ghi ?? console.log)(`ZNS: ${s}`); } catch { /* nhật ký hỏng không làm hỏng lượt */ } };
  const ra: KetQuaLuotZns = { daGui: 0, thatBai: 0, hoanLai: 0, boQua: so.boQuaTinZnsCu(p.bayGio()), dungVi: null };
  const tin = so.tinZnsDenHan(p.bayGio(), p.gioiHan ?? 20);
  if (!tin.length) return ra;

  let tk = await layAccessToken(p, false);
  if (!tk.ok) { ra.dungVi = tk.cau; ghi(tk.cau); return ra; }
  let daLamMoiVoiToken = false;

  for (let i = 0; i < tin.length; i++) {
    const { maDon, loai } = tin[i];
    const ms = p.bayGio();
    const d = so.layDon(maDon);
    if (!d || !so.batDauGuiZns(maDon, loai, ms)) continue;
    const sdt = sdtZalo(d.dienThoai);
    if (!sdt) {
      so.ghiKetQuaZns(maDon, loai, { daGui: false, loi: CAU_GUI.sdtSai.vi, thuLaiSauMs: null }, ms);
      ra.thatBai++;
      continue;
    }
    const yc = dungYeuCauGui({
      sdt84: sdt, templateId: cauHinh.mau[loai], duLieu: duLieuTin(loai, d), trackingId: maTheoDoi(maDon, loai), cheDo: cauHinh.cheDo,
    }, tk.accessToken);
    const kq = await goiZalo(p.hamFetch, yc, p.msHetGio);
    const ph: PhanHoiGui = 'loiMang' in kq ? { ok: false, loai: 'thu_lai', ma: null, cau: kq.loiMang } : docPhanHoi(kq.status, kq.json);
    const sau = p.bayGio();
    if (ph.ok) {
      so.ghiKetQuaZns(maDon, loai, { daGui: true, msgId: ph.msgId }, sau);
      ra.daGui++;
      ghi(`đã gửi ${maDon} ${loai}`);
      continue;
    }
    const cau = xoaBiMatZalo(ph.cau, tk.accessToken, cauHinh.secretKey);
    // Mất mạng, Zalo không trả lời: lỗi chung, không phải của tin này — tin về hàng chờ không tính lần, dừng lượt (mạng
    // hỏng lâu không làm tin thành "thất bại", tin sau không phải chờ hết giờ từng cái một).
    if ('loiMang' in kq) {
      so.traTinZnsVeHang(maDon, loai, sau + (XU_LY_LOI.thu_lai.thuLaiSau ?? 300) * 1000, sau);
      ra.hoanLai++;
      ra.dungVi = cau;
      ghi(`dừng lượt ở ${maDon} ${loai}: ${cau}`);
      return ra;
    }
    // Token sai: làm mới một lần rồi gửi lại đúng tin này; vẫn sai thì dừng lượt.
    if (ph.loai === 'token' && !daLamMoiVoiToken) {
      daLamMoiVoiToken = true;
      so.traTinZnsVeHang(maDon, loai, sau, sau);
      tk = await layAccessToken(p, true);
      if (!tk.ok) { ra.dungVi = tk.cau; ghi(tk.cau); return ra; }
      i--;
      continue;
    }
    const xl = XU_LY_LOI[ph.loai];
    if (xl.dungLuot) {
      // Lỗi chung, không phải của khách này: tin về hàng chờ (không tính lần), cả lượt dừng.
      so.traTinZnsVeHang(maDon, loai, sau + (xl.thuLaiSau ?? 3600) * 1000, sau);
      ra.hoanLai++;
      ra.dungVi = cau;
      ghi(`dừng lượt ở ${maDon} ${loai}: ${cau}`);
      return ra;
    }
    const den = so.ghiKetQuaZns(maDon, loai, { daGui: false, loi: cau, thuLaiSauMs: xl.thuLaiSau === null ? null : xl.thuLaiSau * 1000 }, sau);
    if (den === 'cho') ra.hoanLai++; else ra.thatBai++;
    ghi(`${den === 'cho' ? 'gửi lại sau' : 'không gửi được'} ${maDon} ${loai}: ${cau}`);
  }
  return ra;
}
