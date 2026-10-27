/**
 * KHO — NHẬN HÓA ĐƠN iPOS ĐẨY SANG (webhook "Đồng bộ realtime" của iPOS DW)
 * (GĐ7c 0042; định dạng iPOS DW cho FABi 27/10/2026)
 *
 * iPOS POST từng hóa đơn (JSON) tới `https://<web>/hook/ipos/<IPOS_CALLBACK_KHOA>`
 * khi thu ngân in, sửa hoặc xóa hóa đơn. Hai lối vào gọi cùng một hàm `xuLyHookIpos`:
 *   · src/worker.ts chặn /hook/ipos/* TRƯỚC Astro — chốt chống CSRF của Astro
 *     (security.checkOrigin) trả 403 cho POST "text/plain" / không có Origin.
 *     Hook không dùng cookie nên không có gì để CSRF.
 *   · src/pages/hook/ipos/[khoa].ts — cùng hàm, cho `astro dev` và dự phòng.
 *
 * Trả lời đúng quy tắc của tài liệu iPOS DW: thành công = 200 {"data": true};
 * thất bại = mã khác kèm {"error": {"code", "message"}} — iPOS gửi lại tối đa
 * 5 lần, cách nhau 30 giây. Lỡ hết 5 lần thì lượt kéo bù 5 phút (ipos-dong-bo.ts)
 * vẫn lấy lại được hóa đơn đó.
 *
 * Luật:
 *   · chỉ POST (khác → 405); thiếu bí mật IPOS_CALLBACK_KHOA (hoặc < 32 ký tự)
 *     → 503 "chưa cài"; khóa sai → 404 (so sánh thời gian hằng).
 *   · body ≤ 256KB (quá → 413); JSON hỏng → 400.
 *   · phanTichHoaDon (ipos.ts, raw chỉ giữ khóa cho phép) → hỏng 400; thiếu
 *     brand_id / store_id → 400 → đăng nhập tài khoản máy may_ipos (client anon
 *     riêng; phiên chỉ nhớ trong bộ nhớ isolate tới gần hết hạn — dangNhapMayIposNho,
 *     tránh giới hạn đăng nhập) → kho_ipos_tim_chi_nhanh(brand_id, store_id)
 *     (không khớp → 202 + log cảnh báo: không lưu thì không trả "thành công"; iPOS
 *     chỉ gửi lại 5 lần) → kho_ipos_nhan_callback → 200
 *     {"data": true} CHỈ khi hóa đơn đã vào hộp thư; lỗi database → 500 (iPOS gửi lại).
 *   · Header access_token iPOS gửi kèm KHÔNG được dùng để xác thực (tài liệu
 *     không nói rõ là token nào) — khóa bí mật trong đường dẫn là đủ.
 *   · KHÔNG log body; câu log / câu trả về không chứa khóa, token, mật khẩu.
 */

import {
  layBiMatIpos, dangNhapMayIpos, dangNhapMayIposNho, quenPhienMay, KHOA_TOI_THIEU, TEN_BI_MAT, type Env, type PhuThuocMay,
} from './ipos-dong-bo.ts';
import { TRUONG_IPOS, phanTichHoaDon, bangNhauHang, xoaToken } from './ipos.ts';
import { docThanGioiHan } from '../than-gioi-han.ts';

export const DUONG_HOOK = '/hook/ipos/';

export interface PhuThuocHook extends PhuThuocMay {
  env?: Env;
  /**
   * Dùng lại phiên máy giữa các lần iPOS gọi (tránh giới hạn đăng nhập của
   * Supabase Auth). Mặc định: bật khi chạy thật (không truyền taoClient), tắt
   * khi test truyền client giả.
   */
  nhoPhien?: boolean;
}

function traJson(status: number, body: Record<string, unknown>, them: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...them },
  });
}

/** Thành công theo tài liệu iPOS DW: 200 {"data": true}. */
const traDung = () => traJson(200, { data: true });

/** Thất bại theo tài liệu iPOS DW: mã khác 200 / 201, {"error": {"code", "message"}}. */
const traLoi = (status: number, ma: string, cau: string, them: Record<string, string> = {}) =>
  traJson(status, { error: { code: ma, message: cau } }, them);

/** Đọc body tối đa `toiDa` byte; quá → null (bộ đọc dùng chung với form công khai). */
async function docBody(req: Request, toiDa: number): Promise<string | null> {
  const than = await docThanGioiHan(req, toiDa);
  return than === null ? null : new TextDecoder().decode(than);
}

/** Khóa trong đường dẫn /hook/ipos/<khóa>[/]. Sai dạng → null. */
export function khoaTuDuong(pathname: string): string | null {
  if (!pathname.startsWith(DUONG_HOOK)) return null;
  const k = pathname.slice(DUONG_HOOK.length).replace(/\/$/, '');
  if (!k || k.includes('/')) return null;
  try { return decodeURIComponent(k); } catch { return null; }
}

/**
 * Xử lý một lần iPOS gọi sang. Không bao giờ ném lỗi — mọi lỗi thành một mã
 * HTTP rõ ràng.
 */
export async function xuLyHookIpos(req: Request, khoa: string, phuThuoc: PhuThuocHook = {}): Promise<Response> {
  const bm = await layBiMatIpos(phuThuoc.env);
  const bi = [bm.khoaCallback, bm.token, bm.matKhau].filter((x): x is string => !!x);
  const sach = (c: string) => {
    let s = c;
    for (const b of bi) s = xoaToken(s, b);
    return s;
  };
  const ghi = (c: string) => (phuThuoc.ghiLog ?? console.log)(sach(`[iPOS hook] ${c}`));

  if (req.method !== 'POST') return traLoi(405, 'chi_nhan_post', 'Chỉ nhận POST', { allow: 'POST' });
  if (!bm.khoaCallback || bm.khoaCallback.length < KHOA_TOI_THIEU) {
    return traLoi(503, 'chua_cai', `Chưa cài bí mật ${TEN_BI_MAT.khoaCallback}`);
  }
  if (!bangNhauHang(khoa, bm.khoaCallback)) return traLoi(404, 'khong_tim_thay', 'Không tìm thấy');

  let chu: string | null;
  try { chu = await docBody(req, TRUONG_IPOS.bodyToiDa); } catch { return traLoi(400, 'khong_doc_duoc', 'Không đọc được nội dung'); }
  if (chu === null) return traLoi(413, 'qua_lon', 'Nội dung quá lớn');
  let json: unknown;
  try { json = JSON.parse(chu); } catch { return traLoi(400, 'khong_phai_json', 'Nội dung không phải JSON'); }

  const kq = phanTichHoaDon(json);
  if (kq.loai === 'loi') { ghi(`bỏ hóa đơn hỏng: ${kq.cau}`); return traLoi(400, 'hoa_don_hong', kq.cau); }
  if (!kq.brandId || !kq.storeId) {
    ghi('bỏ hóa đơn thiếu brand_id / store_id');
    return traLoi(400, 'thieu_cua_hang', 'Hóa đơn thiếu "brand_id" hoặc "store_id"');
  }

  const nho = phuThuoc.nhoPhien ?? !phuThuoc.taoClient;
  const dn = nho ? await dangNhapMayIposNho(bm, phuThuoc.env, phuThuoc) : await dangNhapMayIpos(bm, phuThuoc.env, phuThuoc);
  if (!dn.ok) {
    ghi(dn.cau);
    return dn.chuaCai ? traLoi(503, 'chua_cai', 'Máy chủ chưa cài tài khoản đồng bộ')
      : traLoi(503, 'thu_lai', 'Chưa nhận được — thử lại sau');
  }
  const client = dn.client;
  try {
    const { data: cn, error: e1 } = await client.rpc('kho_ipos_tim_chi_nhanh', {
      p_pos_parent: kq.brandId, p_pos_id: kq.storeId,
    });
    if (e1) { if (nho) quenPhienMay(); ghi(`không tìm được chi nhánh: ${e1.message}`); return traLoi(500, 'loi_may_chu', 'Lỗi máy chủ — thử lại sau'); }
    if (!cn) {
      ghi('không có chi nhánh nào khớp brand_id / store_id của hóa đơn — kiểm tra màn Kết nối iPOS');
      return traLoi(202, 'khong_khop_cua_hang', 'Không có cửa hàng nào khớp brand_id / store_id');
    }

    const { data, error } = await client.rpc('kho_ipos_nhan_callback', {
      p_chi_nhanh_id: String(cn), p_hoa_don: kq.hoaDon,
    });
    if (error) { if (nho) quenPhienMay(); ghi(`không nhận được hóa đơn: ${error.message}`); return traLoi(500, 'loi_may_chu', 'Lỗi máy chủ — thử lại sau'); }
    const t = (data ?? {}) as { hd_loi?: number; canh_bao?: { loi?: string }[] };
    if (Number(t.hd_loi ?? 0) > 0) {
      ghi(`database từ chối hóa đơn: ${String(t.canh_bao?.[0]?.loi ?? '').slice(0, 200)}`);
      return traLoi(422, 'hoa_don_khong_hop_le', 'Hóa đơn không hợp lệ');
    }
    if (kq.canhBao.length) ghi(`đã nhận hóa đơn, lưu ý: ${kq.canhBao.join('; ')}`);
    return traDung();
  } catch (e) {
    if (nho) quenPhienMay();
    ghi(`lỗi: ${e instanceof Error ? e.message : String(e)}`);
    return traLoi(500, 'loi_may_chu', 'Lỗi máy chủ — thử lại sau');
  } finally {
    await dn.dangXuat();
  }
}
