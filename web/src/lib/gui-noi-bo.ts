/**
 * GỬI FORM Ở /noi-bo (phần CRM) — đọc thân, chuyển hướng sau khi ghi, câu báo qua cookie
 *
 * Cùng khuôn với kho (lib/kho/trang.ts: docFormGui, chuyenHuong) và Zalo (lib/zalo-bao.ts):
 *
 *   · Đọc thân trong try: mạng đứt giữa chừng thì báo CAU_DOC_FORM_HONG, không trang 500.
 *   · GHI ĐƯỢC THÌ CHUYỂN HƯỚNG 303 sang GET, câu báo đi qua cookie dùng một lần — F5 sau
 *     khi lưu không gửi lại lệnh cũ.
 *   · KHÔNG ghi được cũng chuyển hướng 303, câu lỗi cũng đi qua cookie (issue #194, đợt 4):
 *     trang dựng trong trả lời của lượt POST là một mục lịch sử giữ nguyên thân form — F5 trên
 *     nó, hay Quay lại / Tiến tới rồi F5, là gửi lại. Sáu trang dựng lại form từ database, không
 *     điền lại chữ nào của lượt gửi, nên chuyển hướng không làm mất gì: dat-ban, don-mua-thit,
 *     tuyen-dung, cai-dat, noi-dung, tin-tuyen-dung/index. Còn dựng tại chỗ khi lỗi — vì điền lại
 *     chữ đã gõ (dài, không vừa một cookie; #194, câu hỏi mở về chỗ giữ chữ đã gõ): thuc-don/[id],
 *     tin-tuyen-dung/[id], ban-le/[id], ban-le/cai-dat, ban-le/index, dao-tao, zalo/chien-dich/moi.
 *     Kiểm thử: crm/test/test-noi-bo-loi-chuyen-huong.mjs.
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

/**
 * Câu báo dài nhất giữ được trong cookie. Astro mã hóa giá trị bằng encodeURIComponent: một chữ
 * có dấu thành tới 9 byte, mà trình duyệt BỎ cookie quá 4 KB — trang sau chuyển hướng khi đó không
 * báo gì, người bấm tưởng đã lưu. 360 ký tự toàn chữ có dấu vẫn dưới 3,5 KB; câu dài hơn bị cắt.
 */
const CAU_TOI_DA = 360;

/**
 * Ghi câu báo cho ĐÚNG trang sẽ đọc nó (cookie path = đường dẫn trang). Lần chuyển hướng bị bỏ
 * dở (bấm sang trang khác trước khi GET xong) thì câu không hiện nhầm ở một trang CRM khác.
 */
export function ghiBaoNoiBo(cookies: AstroCookies, bao: BaoNoiBo, duong: string) {
  // Cắt theo ký tự (không cắt đôi một ký tự ngoài BMP — nửa cặp surrogate làm encodeURIComponent ném lỗi).
  const kyTu = Array.from(bao.cau);
  const cau = kyTu.length > CAU_TOI_DA ? `${kyTu.slice(0, CAU_TOI_DA - 1).join('').trimEnd()}…` : bao.cau;
  cookies.set(COOKIE_BAO, JSON.stringify({ ok: bao.ok, cau }), {
    httpOnly: true,
    secure: banThat(),
    sameSite: 'lax',
    path: duong,
    maxAge: 120,
  });
}

/** Câu báo của lần chuyển hướng vừa rồi về trang `duong`; đọc một lần rồi xóa. */
export function docBaoNoiBo(cookies: AstroCookies, duong: string): BaoNoiBo | null {
  const raw = cookies.get(COOKIE_BAO)?.value;
  if (!raw) return null;
  cookies.delete(COOKIE_BAO, { path: duong });
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
  ghiBaoNoiBo(Astro.cookies, bao, new URL(url, Astro.url).pathname);
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
 * Người bấm có ghi chú (hồ sơ ứng tuyển, cột ghi_chu_buoc → nhật ký): dòng đã ở trạng thái đích
 * chưa chắc mang ghi chú của họ — có thể người khác chuyển trước với ghi chú khác. Chỉ báo "đã ở"
 * khi bước đó trong nhat_ky_ho_so có đúng ghi chú này (lần hai của cú bấm đúp); không thì ghi chú
 * CHƯA được lưu — báo "người khác".
 */
export async function chuyenTrangThai(
  client: SupabaseClient, bang: 'dat_ban' | 'ho_so_ung_tuyen',
  id: string, tu: string, toi: string, them: Record<string, unknown>,
): Promise<KetQuaChuyen> {
  // Tên bảng viết thẳng ở từng nhánh: test-hop-dong-web.mjs đối chiếu from('…') với database.
  const bangNay = () => (bang === 'dat_ban' ? client.from('dat_ban') : client.from('ho_so_ung_tuyen'));
  const { data, error } = await bangNay()
    .update({ trang_thai: toi, ...them }).eq('id', id).eq('trang_thai', tu).select('id');
  if (error) return { loi: error.message ?? '' };
  if (data && data.length > 0) return 'da_chuyen';

  const { data: hienTai, error: loiDoc } = await bangNay().select('trang_thai').eq('id', id).maybeSingle();
  if (loiDoc || (hienTai as { trang_thai?: string } | null)?.trang_thai !== toi) return 'nguoi_khac';

  const ghiChu = typeof them.ghi_chu_buoc === 'string' ? them.ghi_chu_buoc.trim() : '';
  if (bang === 'ho_so_ung_tuyen' && ghiChu) {
    const { data: nk, error: loiNk } = await client
      .from('nhat_ky_ho_so')
      .select('ghi_chu')
      .eq('ho_so_id', id)
      .eq('den_trang_thai', toi)
      .order('created_at', { ascending: false })
      .limit(1);
    const cuoi = Array.isArray(nk) ? (nk[0] as { ghi_chu?: string | null } | undefined)?.ghi_chu : null;
    if (loiNk || (cuoi ?? '').trim() !== ghiChu) return 'nguoi_khac';
  }
  return 'da_o_san';
}
