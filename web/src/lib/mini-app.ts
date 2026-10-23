/**
 * MINI APP ZALO — CÒN HÀNG Ở QUẦY
 * ==============================
 *
 * Mini App (mini-app/) không gọi database: nó hỏi trang này qua /mini-app/con-hang.json. Hàm dưới đây gọi
 * mini_app_con_hang() (0093) bằng vai anon và chỉ trả trạng thái của từng phần thịt — 'con', 'sap_het',
 * 'het' — không số khay, như lich_trong_theo_ma() không trả số bàn (dat-ban.ts).
 *
 * KHÔNG ném lỗi, và KHÔNG BAO GIỜ đoán "hết". Database chưa nối, mất mạng, hàm chưa có (migration chưa
 * chạy), công tắc mini_app_hien_con_hang tắt: đều ra {} — Mini App hiểu là "không biết" và hiện mọi phần
 * như trước khi có kho. Nói "tạm hết" khi không chắc là làm mất đơn của một khay còn nằm ở quầy.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { taoClient, maChiNhanh } from './noi-dung.ts';

export type TrangThaiConHang = 'con' | 'sap_het' | 'het';

const TRANG_THAI: ReadonlySet<string> = new Set(['con', 'sap_het', 'het']);
/** Mã phần thịt của Mini App (mini-app/src/san-pham.ts, lựa chọn của ô mini_app trong kho). */
const MA_PHAN_THIT = /^[a-z0-9-]{1,40}$/;

/**
 * Bộ đệm trong Worker: đường công khai /mini-app/con-hang.json không gọi database quá một lần mỗi
 * GIU_DEM_MS cho mỗi Worker đang chạy — 100 khách mở app cùng lúc hay ai đó gọi liên tục không thành 100 lần
 * gọi Supabase. Header Cache-Control chỉ giữ ở trình duyệt, không giữ ở Cloudflare cho Worker.
 */
export const GIU_DEM_MS = 30_000;
let dem: { luc: number; giaTri: Record<string, TrangThaiConHang> } | null = null;

export async function docConHangMiniAppCoDem(
  bayGio = Date.now(),
  doc: () => Promise<Record<string, TrangThaiConHang>> = () => docConHangMiniApp(),
): Promise<Record<string, TrangThaiConHang>> {
  if (dem && bayGio - dem.luc >= 0 && bayGio - dem.luc < GIU_DEM_MS) return dem.giaTri;
  const giaTri = await doc();
  dem = { luc: bayGio, giaTri };
  return giaTri;
}

/** Chỉ cho kiểm thử: xóa bộ đệm. */
export function xoaDemConHang(): void {
  dem = null;
}

/** Trạng thái còn hàng của từng phần thịt đã gắn mặt hàng trong kho. Phần chưa gắn: không có khóa. */
export async function docConHangMiniApp(
  client: SupabaseClient | null = taoClient(),
): Promise<Record<string, TrangThaiConHang>> {
  if (!client) return {};
  try {
    const { data, error } = await client.rpc('mini_app_con_hang', { p_chi_nhanh_ma: maChiNhanh() });
    if (error || !Array.isArray(data)) {
      if (error) console.error('[mini-app] không đọc được còn hàng:', error.code ?? '', error.message);
      return {};
    }
    const ra: Record<string, TrangThaiConHang> = {};
    for (const dong of data as { ma?: unknown; trang_thai?: unknown }[]) {
      if (typeof dong?.ma === 'string' && MA_PHAN_THIT.test(dong.ma)
          && typeof dong.trang_thai === 'string' && TRANG_THAI.has(dong.trang_thai)) {
        ra[dong.ma] = dong.trang_thai as TrangThaiConHang;
      }
    }
    return ra;
  } catch (e) {
    console.error('[mini-app] không gọi được database:', e instanceof Error ? e.message : String(e));
    return {};
  }
}
