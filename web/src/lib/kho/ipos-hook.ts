/**
 * KHO — NHẬN HÓA ĐƠN iPOS ĐẨY SANG (callback) (GĐ7c, migration 0042)
 *
 * iPOS Hub POST JSON thô tới `https://<web>/hook/ipos/<IPOS_CALLBACK_KHOA>` mỗi
 * khi thu ngân in hóa đơn. Hai lối vào gọi cùng một hàm `xuLyHookIpos`:
 *   · src/worker.ts chặn /hook/ipos/* TRƯỚC Astro — Hub có thể gửi
 *     "text/plain" / không có Origin, mà chốt chống CSRF của Astro
 *     (security.checkOrigin) trả 403 cho POST kiểu đó. Hook không dùng cookie
 *     nên không có gì để CSRF.
 *   · src/pages/hook/ipos/[khoa].ts — cùng hàm, cho `astro dev` và dự phòng.
 *
 * Luật:
 *   · chỉ POST (khác → 405); thiếu bí mật IPOS_CALLBACK_KHOA (hoặc < 32 ký tự)
 *     → 503 "chưa cài"; khóa sai → 404 (so sánh thời gian hằng).
 *   · body ≤ 256KB (quá → 413); JSON hỏng → 400.
 *   · Event 11 → phanTichCallback (ipos.ts, đã bỏ thông tin khách) → đăng nhập
 *     tài khoản máy may_ipos (client anon riêng; phiên chỉ nhớ trong bộ nhớ
 *     isolate tới gần hết hạn — dangNhapMayIposNho, tránh giới hạn đăng nhập) →
 *     kho_ipos_tim_chi_nhanh(pos_parent, pos_id) (không khớp → 202 + log cảnh
 *     báo, để Hub không bắn lại mãi) → kho_ipos_nhan_callback → 200 {"ok":true}
 *     CHỈ khi hóa đơn đã vào hộp thư; lỗi database → 500 (Hub thử lại).
 *   · Event 12 item_changed → kho_ipos_bao_menu_doi (lượt cron kế tiếp đọc lại
 *     thực đơn) → 200. Event khác → 200 bỏ qua, không đụng database.
 *   · KHÔNG log body; câu log / câu trả về không chứa khóa, token, mật khẩu.
 */

import {
  layBiMatIpos, dangNhapMayIpos, dangNhapMayIposNho, quenPhienMay, KHOA_TOI_THIEU, TEN_BI_MAT, type Env, type PhuThuocMay,
} from './ipos-dong-bo.ts';
import { TRUONG_IPOS, phanTichCallback, bangNhauHang, xoaToken } from './ipos.ts';

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

/** Đọc body tối đa `toiDa` byte; quá → null. */
async function docBody(req: Request, toiDa: number): Promise<string | null> {
  const dai = Number(req.headers.get('content-length') ?? '');
  if (Number.isFinite(dai) && dai > toiDa) return null;
  if (!req.body) return '';
  const r = req.body.getReader();
  const phan: Uint8Array[] = [];
  let tong = 0;
  for (;;) {
    const { done, value } = await r.read();
    if (done) break;
    tong += value.byteLength;
    if (tong > toiDa) { try { await r.cancel(); } catch { /* bỏ qua */ } return null; }
    phan.push(value);
  }
  const gop = new Uint8Array(tong);
  let i = 0;
  for (const p of phan) { gop.set(p, i); i += p.byteLength; }
  return new TextDecoder().decode(gop);
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

  if (req.method !== 'POST') return traJson(405, { ok: false, loi: 'Chỉ nhận POST' }, { allow: 'POST' });
  if (!bm.khoaCallback || bm.khoaCallback.length < KHOA_TOI_THIEU) {
    return traJson(503, { ok: false, loi: `Chưa cài bí mật ${TEN_BI_MAT.khoaCallback}` });
  }
  if (!bangNhauHang(khoa, bm.khoaCallback)) return traJson(404, { ok: false, loi: 'Không tìm thấy' });

  let chu: string | null;
  try { chu = await docBody(req, TRUONG_IPOS.bodyToiDa); } catch { return traJson(400, { ok: false, loi: 'Không đọc được nội dung' }); }
  if (chu === null) return traJson(413, { ok: false, loi: 'Nội dung quá lớn' });
  let json: unknown;
  try { json = JSON.parse(chu); } catch { return traJson(400, { ok: false, loi: 'Nội dung không phải JSON' }); }

  const kq = phanTichCallback(json);
  if (kq.loai === 'khac') return traJson(200, { ok: true, bo_qua: true });
  if (kq.loai === 'loi') { ghi(`bỏ callback hỏng: ${kq.cau}`); return traJson(400, { ok: false, loi: kq.cau }); }

  const nho = phuThuoc.nhoPhien ?? !phuThuoc.taoClient;
  const dn = nho ? await dangNhapMayIposNho(bm, phuThuoc.env, phuThuoc) : await dangNhapMayIpos(bm, phuThuoc.env, phuThuoc);
  if (!dn.ok) {
    ghi(dn.cau);
    return traJson(503, { ok: false, loi: dn.chuaCai ? 'Máy chủ chưa cài tài khoản đồng bộ' : 'Chưa nhận được — thử lại sau' });
  }
  const client = dn.client;
  try {
    const { data: cn, error: e1 } = await client.rpc('kho_ipos_tim_chi_nhanh', {
      p_pos_parent: kq.posParent, p_pos_id: kq.posId,
    });
    if (e1) { if (nho) quenPhienMay(); ghi(`không tìm được chi nhánh: ${e1.message}`); return traJson(500, { ok: false, loi: 'Lỗi máy chủ — thử lại sau' }); }
    if (!cn) {
      ghi(`không có chi nhánh nào khớp pos_parent / pos_id của callback (event ${kq.loai === 'hoa_don' ? 11 : 12}) — kiểm tra màn Kết nối iPOS`);
      return traJson(202, { ok: true, bo_qua: true });
    }
    const chiNhanhId = String(cn);

    if (kq.loai === 'menu_doi') {
      const { error } = await client.rpc('kho_ipos_bao_menu_doi', { p_chi_nhanh_id: chiNhanhId });
      if (error) { if (nho) quenPhienMay(); ghi(`không ghi được cờ thực đơn đổi: ${error.message}`); return traJson(500, { ok: false, loi: 'Lỗi máy chủ — thử lại sau' }); }
      return traJson(200, { ok: true });
    }

    const { data, error } = await client.rpc('kho_ipos_nhan_callback', {
      p_chi_nhanh_id: chiNhanhId, p_hoa_don: kq.hoaDon,
    });
    if (error) { if (nho) quenPhienMay(); ghi(`không nhận được hóa đơn: ${error.message}`); return traJson(500, { ok: false, loi: 'Lỗi máy chủ — thử lại sau' }); }
    const t = (data ?? {}) as { hd_loi?: number; canh_bao?: { loi?: string }[] };
    if (Number(t.hd_loi ?? 0) > 0) {
      ghi(`database từ chối hóa đơn: ${String(t.canh_bao?.[0]?.loi ?? '').slice(0, 200)}`);
      return traJson(422, { ok: false, loi: 'Hóa đơn không hợp lệ' });
    }
    if (kq.canhBao.length) ghi(`đã nhận hóa đơn, lưu ý: ${kq.canhBao.join('; ')}`);
    return traJson(200, { ok: true });
  } catch (e) {
    if (nho) quenPhienMay();
    ghi(`lỗi: ${e instanceof Error ? e.message : String(e)}`);
    return traJson(500, { ok: false, loi: 'Lỗi máy chủ — thử lại sau' });
  } finally {
    await dn.dangXuat();
  }
}
