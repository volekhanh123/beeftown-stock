/**
 * GỬI FORM Ở /noi-bo (phần CRM) — đọc thân, chuyển hướng sau khi ghi, câu báo qua cookie
 *
 * Cùng khuôn với kho (lib/kho/trang.ts: docFormGui, chuyenHuong) và Zalo (lib/zalo-bao.ts):
 *
 *   · Đọc thân trong try: mạng đứt giữa chừng thì báo CAU_DOC_FORM_HONG, không trang 500.
 *   · GHI ĐƯỢC THÌ CHUYỂN HƯỚNG 303 sang GET, câu báo đi qua cookie dùng một lần — F5 sau
 *     khi lưu không gửi lại lệnh cũ. KHÔNG ghi được thì dựng lại trang ngay, để chữ đã gõ
 *     còn nguyên (như kho).
 *   · Bấm đúp: lần hai tới máy chủ SAU khi lần một đã ghi, và trình duyệt bỏ câu trả lời
 *     của lần một — người bấm chỉ thấy câu của lần hai. Chuyển hướng không chữa được ca
 *     này, nên mỗi chỗ ghi tự nhận ra "đã đúng như mình gửi" và nói đúng điều đó: "Yêu cầu
 *     đã ở …" chứ không "người khác đã xử lý" (chuyenTrangThai ở đây; luuTin, goTin,
 *     duyetLuong ở tin-tuyen-dung.ts; themMotBan, themNhieuBan ở cai-dat.ts).
 *
 * Rà soát nợ kỹ thuật 11/10/2026. Kiểm thử: crm/test/test-noi-bo-gui-lai.mjs.
 */

import type { AstroCookies, AstroGlobal } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { HaiThuTieng } from './ngon-ngu-noi-bo.ts';

/**
 * Không đọc được thân POST: database chưa được gọi, nên "thử gửi lại" là đúng. Một câu cho
 * cả CRM lẫn kho (lib/kho/bao.ts dùng lại).
 */
export const CAU_DOC_FORM_HONG = {
  vi: 'Không đọc được dữ liệu gửi lên — mạng có thể đã đứt giữa chừng. Thử gửi lại.',
  en: 'Could not read what was sent — the connection may have dropped. Please send again.',
} satisfies HaiThuTieng;

export interface BaoNoiBo { ok: boolean; cau: string }

const COOKIE_BAO = 'bt_nb_bao';

/** Bản chạy thật (HTTPS) thì cookie chỉ đi qua HTTPS. Ngoài Astro (kiểm thử) import.meta.env không có. */
const banThat = () => (import.meta.env as Record<string, unknown> | undefined)?.PROD === true;

/** Đọc form gửi lên. Thân cụt, mạng đứt giữa chừng, không phải form → null, không ném. */
export async function docFormNoiBo(request: Request): Promise<FormData | null> {
  try { return await request.formData(); } catch { return null; }
}

export function ghiBaoNoiBo(cookies: AstroCookies, bao: BaoNoiBo) {
  cookies.set(COOKIE_BAO, JSON.stringify({ ok: bao.ok, cau: bao.cau }), {
    httpOnly: true,
    secure: banThat(),
    sameSite: 'lax',
    path: '/noi-bo',
    maxAge: 120,
  });
}

/** Câu báo của lần chuyển hướng vừa rồi; đọc một lần rồi xóa. */
export function docBaoNoiBo(cookies: AstroCookies): BaoNoiBo | null {
  const raw = cookies.get(COOKIE_BAO)?.value;
  if (!raw) return null;
  cookies.delete(COOKIE_BAO, { path: '/noi-bo' });
  try {
    const v = JSON.parse(raw);
    return typeof v?.ok === 'boolean' && typeof v?.cau === 'string' ? { ok: v.ok, cau: v.cau } : null;
  } catch { return null; }
}

/** Ghi câu báo rồi chuyển hướng 303 về chính trang này (giữ bộ lọc ?loc=…). */
export function chuyenHuongNoiBo(
  Astro: Pick<AstroGlobal, 'cookies' | 'url' | 'redirect'>, bao: BaoNoiBo,
  url = Astro.url.pathname + Astro.url.search,
): Response {
  ghiBaoNoiBo(Astro.cookies, bao);
  return Astro.redirect(url, 303);
}

/**
 * Kết quả đổi trạng thái một dòng:
 *   da_chuyen  — vừa đổi;
 *   da_o_san   — không khớp trạng thái cũ, nhưng dòng ĐÃ ở trạng thái đích (thường là lần hai
 *                của cú bấm đúp, hay F5 sau khi lưu);
 *   nguoi_khac — dòng đang ở trạng thái khác: người khác đã xử lý trước;
 *   { loi }    — database báo lỗi (câu tiếng Việt của database, chưa dịch).
 */
export type KetQuaChuyen = 'da_chuyen' | 'da_o_san' | 'nguoi_khac' | { loi: string };

/**
 * Đổi trạng thái một yêu cầu đặt bàn / hồ sơ ứng tuyển, CHỈ khi dòng còn đúng trạng thái lúc
 * trang được tải. Hai người cùng mở hộp thư trên hai điện thoại là chuyện thường; không có điều
 * kiện đó thì người bấm sau ghi đè lặng lẽ lên việc người bấm trước. RLS vẫn là chốt chặn.
 *
 * Không khớp dòng nào thì đọc lại trạng thái hiện tại; không đọc được thì KHÔNG đoán là đã xong.
 */
export async function chuyenTrangThai(
  client: SupabaseClient, bang: 'dat_ban' | 'ho_so_ung_tuyen',
  id: string, tu: string, toi: string, them: Record<string, unknown>,
): Promise<KetQuaChuyen> {
  const capNhat = { trang_thai: toi, ...them };
  const { data, error } = bang === 'dat_ban'
    ? await client.from('dat_ban').update(capNhat).eq('id', id).eq('trang_thai', tu).select('id')
    : await client.from('ho_so_ung_tuyen').update(capNhat).eq('id', id).eq('trang_thai', tu).select('id');
  if (error) return { loi: error.message ?? '' };
  if (data && data.length > 0) return 'da_chuyen';

  const { data: hienTai, error: loiDoc } = bang === 'dat_ban'
    ? await client.from('dat_ban').select('trang_thai').eq('id', id).maybeSingle()
    : await client.from('ho_so_ung_tuyen').select('trang_thai').eq('id', id).maybeSingle();
  if (!loiDoc && (hienTai as { trang_thai?: string } | null)?.trang_thai === toi) return 'da_o_san';
  return 'nguoi_khac';
}
