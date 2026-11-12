/**
 * VNPAY CHO MUA THỊT VỀ — NHẬN KẾT QUẢ (IPN) VÀ TRANG KHÁCH ĐƯỢC ĐƯA VỀ (0115)
 * ============================================================================
 *
 * IPN: VNPay gọi GET `https://<web>/hook/vnpay-ipn?vnp_…` (địa chỉ khai một lần cho Terminal của website ở trang quản lý
 * của VNPay). Hai lối vào gọi cùng `xuLyIpnVnpay`: src/worker.ts chặn đường dẫn này TRƯỚC Astro (như hook iPOS,
 * Messenger — không cookie, không phiên người), và src/pages/hook/vnpay-ipn.ts cho `astro dev`.
 *
 * Luật IPN (trả lời luôn là 200 + JSON {RspCode, Message} như code mẫu VNPay; VNPay gọi lại khi không nhận được 00 / 02):
 *   · chưa cài đủ bốn bí mật → 99 "Unknown error" (một dòng log nêu tên bí mật thiếu).
 *   · IP nguồn (CF-Connecting-IP — Cloudflare tự đặt, khách không giả được) ngoài dải của VNPay → 03 "IP prohibited".
 *   · chữ ký sai → 97 "Invalid Checksum". vnp_TmnCode khác Terminal của website → 01. Số tiền sai dạng → 04.
 *   · đăng nhập tài khoản máy may_vnpay (phiên nhớ trong isolate — taoPhienMayNho) → vnpay_ghi_ipn:
 *       da_ghi → 00 "Confirm Success" · khong_thay → 01 "Order not found" · da_xac_nhan → 02 "Order already confirmed"
 *       · sai_tien → 04 "Invalid amount" · lỗi database / mất mạng / hết giờ → 99 (VNPay gửi lại — KHÔNG BAO GIỜ 00 khi
 *       database chưa xác nhận đã ghi).
 *   · KHÔNG log chuỗi truy vấn (có chữ ký); câu log không chứa khóa, mật khẩu, mã thẻ.
 *
 * Trang kết quả (Return URL): `docKetQuaVe` kiểm chữ ký, rồi (chữ ký đúng) ghi dấu "khách đã về" qua vnpay_ghi_ve —
 * KHÔNG đổi trạng thái lần trả (chỉ IPN đổi) — và đọc lại database đã nhận tiền chưa, để trang nói đúng:
 *   · "Beeftown đã nhận tiền" — database ghi đã trả;
 *   · "VNPay báo bạn đã trả xong" — chữ ký đúng, mã 00, nhưng IPN chưa tới (hoặc không ghi được dấu);
 *   · "chưa trả được" — mã khác 00; "không xác nhận được" — chữ ký sai.
 *
 * Kiểm thử: crm/test/test-mua-thit-vnpay-web.mjs.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { dangNhapMay, taoPhienMayNho, type KetQuaDangNhapMay, type ThamSoDangNhapMay } from './tai-khoan-may.ts';
import { docCauHinhVnpay, docThamSoVnpay, ipTrongDanhSach, TEN_BI_MAT_VNPAY, type CauHinhVnpay, type DocCauHinh } from './vnpay.ts';
import type { Env } from './bien-moi-truong.ts';

export const DUONG_IPN_VNPAY = '/hook/vnpay-ipn';
/** Hạn giờ mỗi lời gọi Supabase của máy VNPay (ms): VNPay chờ IPN khoảng 30 giây. */
export const HET_GIO_SUPABASE_VNPAY_MS = 8_000;

export interface PhuThuocVnpay {
  env?: Env;
  /** Cấu hình dựng sẵn (test) — khi có thì không đọc env. */
  cauHinh?: DocCauHinh;
  /** Client của tài khoản máy (test: client giả trên PGlite) — khi có thì không đăng nhập thật. */
  taoClientMay?: () => SupabaseClient;
  /** fetch đi Supabase của client máy (test: fetch giả treo / lỗi). */
  fetchSupabase?: typeof fetch;
  hetGioSupabaseMs?: number;
  /** Dùng lại phiên máy giữa các lần gọi. Mặc định bật khi chạy thật, tắt khi test truyền client giả. */
  nhoPhien?: boolean;
  ghiLog?: (cau: string) => void;
}

const phienVnpay = taoPhienMayNho();

function thamSoMay(ch: CauHinhVnpay, pt: PhuThuocVnpay): ThamSoDangNhapMay {
  return {
    email: ch.email, matKhau: ch.matKhau, tenBiMat: TEN_BI_MAT_VNPAY, nhan: 'tài khoản máy VNPay', env: pt.env,
    taoClient: pt.taoClientMay, fetchGoc: pt.fetchSupabase, goiMs: pt.hetGioSupabaseMs ?? HET_GIO_SUPABASE_VNPAY_MS,
  };
}

async function dangNhap(ch: CauHinhVnpay, pt: PhuThuocVnpay): Promise<{ dn: KetQuaDangNhapMay; nho: boolean }> {
  const nho = pt.nhoPhien ?? !pt.taoClientMay;
  return { dn: nho ? await phienVnpay.dangNhap(thamSoMay(ch, pt)) : await dangNhapMay(thamSoMay(ch, pt)), nho };
}

/** Câu log: bỏ khóa bí mật và mật khẩu nếu lỡ có trong câu lỗi. */
function taoGhi(pt: PhuThuocVnpay, ch: CauHinhVnpay | null, dau: string) {
  const bi = ch ? [ch.khoaBiMat, ch.matKhau].filter(x => x.length >= 6) : [];
  return (cau: string) => {
    let s = `[${dau}] ${cau}`;
    for (const b of bi) s = s.split(b).join('***');
    (pt.ghiLog ?? console.log)(s.slice(0, 500));
  };
}

// -----------------------------------------------------------------------------
// IPN
// -----------------------------------------------------------------------------
export const RSP = {
  thanhCong:  { RspCode: '00', Message: 'Confirm Success' },
  khongThay:  { RspCode: '01', Message: 'Order not found' },
  daXacNhan:  { RspCode: '02', Message: 'Order already confirmed' },
  saiIp:      { RspCode: '03', Message: 'IP prohibited' },
  saiTien:    { RspCode: '04', Message: 'Invalid amount' },
  saiChuKy:   { RspCode: '97', Message: 'Invalid Checksum' },
  loiKhac:    { RspCode: '99', Message: 'Unknown error' },
} as const;

const traIpn = (r: { RspCode: string; Message: string }) => new Response(JSON.stringify(r), {
  status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

const KET_QUA_IPN: Record<string, (typeof RSP)[keyof typeof RSP]> = {
  da_ghi: RSP.thanhCong, khong_thay: RSP.khongThay, da_xac_nhan: RSP.daXacNhan, sai_tien: RSP.saiTien,
};

/** Một lần VNPay gọi IPN. Không bao giờ ném lỗi. */
export async function xuLyIpnVnpay(req: Request, pt: PhuThuocVnpay = {}): Promise<Response> {
  const doc = pt.cauHinh ?? await docCauHinhVnpay(pt.env);
  const ch = doc.ok ? doc.cauHinh : null;
  const ghi = taoGhi(pt, ch, 'VNPay IPN');
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Chỉ nhận GET', { status: 405, headers: { allow: 'GET, POST' } });
  }
  if (!doc.ok) { ghi(doc.cau); return traIpn(RSP.loiKhac); }
  const c = doc.cauHinh;

  const ip = req.headers.get('cf-connecting-ip');
  if (!ipTrongDanhSach(ip, c.ipIpn)) {
    ghi(`từ chối IPN từ IP ${String(ip ?? '(không có)').slice(0, 45)} — không nằm trong ${TEN_BI_MAT_VNPAY.ipIpn}`);
    return traIpn(RSP.saiIp);
  }

  let kq;
  try { kq = await docThamSoVnpay(new URL(req.url).searchParams, c); } catch { return traIpn(RSP.loiKhac); }
  if (!kq.chuKyDung) { ghi(`chữ ký sai (mã giao dịch ${kq.maGiaoDich.slice(0, 20) || '(trống)'})`); return traIpn(RSP.saiChuKy); }
  if (kq.maTmn !== c.maTmn || !kq.maDon) { ghi(`không phải giao dịch của website (${kq.maTmn} / ${kq.maGiaoDich.slice(0, 20)})`); return traIpn(RSP.khongThay); }
  if (kq.soTien === null) { ghi(`số tiền sai dạng (${kq.maGiaoDich})`); return traIpn(RSP.saiTien); }
  if (!/^[0-9A-Z]{2}$/.test(kq.maPhanHoi) || (kq.trangThaiGd !== null && !/^[0-9A-Z]{2}$/.test(kq.trangThaiGd))) {
    ghi(`mã phản hồi sai dạng (${kq.maGiaoDich})`);
    return traIpn(RSP.loiKhac);
  }

  const { dn, nho } = await dangNhap(c, pt);
  if (!dn.ok) { ghi(dn.cau); return traIpn(RSP.loiKhac); }
  try {
    const { data, error } = await dn.client.rpc('vnpay_ghi_ipn', {
      p_ma_giao_dich: kq.maGiaoDich, p_so_tien: kq.soTien, p_ma_phan_hoi: kq.maPhanHoi, p_trang_thai_gd: kq.trangThaiGd,
      p_ma_vnpay: kq.maVnpay || null, p_ngan_hang: kq.nganHang || null, p_tra_luc: kq.traLuc,
    });
    if (error) {
      if (nho) phienVnpay.quen();
      ghi(`không ghi được kết quả ${kq.maGiaoDich}: ${error.message ?? ''}`);
      return traIpn(RSP.loiKhac);
    }
    const r = typeof data === 'string' ? KET_QUA_IPN[data] : undefined;
    if (!r) { ghi(`database trả lời lạ cho ${kq.maGiaoDich}`); return traIpn(RSP.loiKhac); }
    ghi(`${kq.maGiaoDich}: ${data}${data === 'da_ghi' ? (kq.daTra ? ' (đã trả)' : ` (chưa trả, mã ${kq.maPhanHoi})`) : ''}`);
    return traIpn(r);
  } catch (e) {
    if (nho) phienVnpay.quen();
    ghi(`lỗi khi ghi ${kq.maGiaoDich}: ${e instanceof Error ? e.message : String(e)}`);
    return traIpn(RSP.loiKhac);
  } finally {
    await dn.dangXuat();
  }
}

// -----------------------------------------------------------------------------
// TRANG KẾT QUẢ (Return URL)
// -----------------------------------------------------------------------------
export type KetQuaVe =
  /** Website chưa cài VNPay — trang không có gì để kiểm. */
  | { loai: 'chua_cai' }
  /** Chữ ký sai hay thiếu: không tin gì trên đường dẫn. */
  | { loai: 'sai_chu_ky' }
  /**
   * Chữ ký đúng. daTra: VNPay báo đã trả (mã 00). daGhi: database đã ghi đơn ĐÃ TRẢ (IPN đã tới) — null khi không hỏi
   * được database (chưa ghi được dấu, mất mạng): trang nói theo chữ ký, không nói "Beeftown đã nhận tiền".
   */
  | { loai: 'co_ket_qua'; maDon: string; soTien: number | null; daTra: boolean; daGhi: boolean | null; maPhanHoi: string };

/** Không bao giờ ném lỗi. */
export async function docKetQuaVe(url: URL, pt: PhuThuocVnpay = {}): Promise<KetQuaVe> {
  const doc = pt.cauHinh ?? await docCauHinhVnpay(pt.env);
  if (!doc.ok) return { loai: 'chua_cai' };
  const c = doc.cauHinh;
  const ghi = taoGhi(pt, c, 'VNPay về');
  let kq;
  try { kq = await docThamSoVnpay(url.searchParams, c); } catch { return { loai: 'sai_chu_ky' }; }
  if (!kq.chuKyDung || kq.maTmn !== c.maTmn || !kq.maDon) return { loai: 'sai_chu_ky' };

  let daGhi: boolean | null = null;
  const { dn, nho } = await dangNhap(c, pt);
  if (!dn.ok) ghi(dn.cau);
  else {
    try {
      const { data, error } = await dn.client.rpc('vnpay_ghi_ve', {
        p_ma_giao_dich: kq.maGiaoDich, p_ma_phan_hoi: /^[0-9A-Z]{2}$/.test(kq.maPhanHoi) ? kq.maPhanHoi : null,
      });
      if (error) { if (nho) phienVnpay.quen(); ghi(`không ghi được dấu khách về ${kq.maGiaoDich}: ${error.message ?? ''}`); }
      else if (data && typeof data === 'object' && (data as { thay?: unknown }).thay === true) {
        daGhi = (data as { don_da_tra?: unknown }).don_da_tra === true;
      } else ghi(`khách về với mã giao dịch database không có: ${kq.maGiaoDich}`);
    } catch (e) {
      if (nho) phienVnpay.quen();
      ghi(`lỗi khi ghi dấu khách về ${kq.maGiaoDich}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      await dn.dangXuat();
    }
  }
  return { loai: 'co_ket_qua', maDon: kq.maDon, soTien: kq.soTien, daTra: kq.daTra, daGhi, maPhanHoi: kq.maPhanHoi };
}
