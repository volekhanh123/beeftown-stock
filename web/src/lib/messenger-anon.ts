/**
 * BOT MESSENGER — CÁC LỜI GỌI DATABASE BẰNG CLIENT ANON (không phiên)
 * ==================================================================
 *
 * Đặt bàn, lịch trống, tra / hủy đặt bàn, nội dung công khai: bot gọi ĐÚNG các
 * hàm website công khai đang dùng, bằng client anon KHÔNG phiên (như
 * lib/noi-dung.ts taoClient) — tim_hoac_tao_khach (0045) từ chối phiên máy,
 * nên đặt bàn không thể đi bằng tài khoản máy may_messenger.
 *
 * File này tách riêng khỏi lib/messenger-hook.ts (chạy bằng tài khoản máy) để
 * test-hop-dong-web.mjs phân loại đúng: ở đây CHỈ có hàm nằm trong danh sách
 * anon được gọi (0013). Không gọi hàm mess_* nào ở đây.
 *
 * Không bao giờ ném lỗi: lỗi database → { ok: false, loi }, đứt mạng →
 * { ok: false, khongChac } (đặt bàn) hoặc { ok: false }.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DongTraCuu, KhungGio, ThongTinCongKhai } from './messenger.ts';
import { laLoiDatabase } from './chu.ts';

const loiCua = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function docLichTrong(
  client: SupabaseClient, chiNhanhMa: string, ngay: string,
): Promise<{ ok: true; khung: KhungGio[] } | { ok: false; loi: string }> {
  try {
    const { data, error } = await client.rpc('lich_trong_theo_ma', { p_chi_nhanh_ma: chiNhanhMa, p_ngay: ngay });
    if (error) return { ok: false, loi: error.message };
    return { ok: true, khung: Array.isArray(data) ? (data as KhungGio[]) : [] };
  } catch (e) { return { ok: false, loi: loiCua(e) }; }
}

export interface ThamSoDatBanMess {
  chiNhanhMa: string; ngay: string; gio: string; soKhach: number; hoTen: string; sdt: string;
}

/**
 * tao_dat_ban đúng như form website, đánh dấu nguồn bằng utm (không cần cột
 * mới): p_utm_source='messenger', p_utm_medium='chatbot'. Đồng ý nhận tin là
 * TÙY CHỌN và bot không hỏi → p_dong_y=false. Messenger không có IP → null:
 * database không có xô IP cho lời gọi đó, chỉ đếm theo số điện thoại và chi
 * nhánh (0084) — giới hạn theo khách của bot nằm ở mess_xin_dat_ban (0053).
 */
export async function taoDatBanMess(
  client: SupabaseClient, t: ThamSoDatBanMess,
): Promise<{ ok: true; ma: string } | { ok: false; loi?: string; khongChac?: boolean }> {
  try {
    const { data, error } = await client.rpc('tao_dat_ban', {
      p_chi_nhanh_ma: t.chiNhanhMa,
      p_sdt: t.sdt,
      p_ho_ten: t.hoTen,
      p_ngay: t.ngay,
      p_gio: t.gio,
      p_so_khach: t.soKhach,
      p_dip: null,
      p_ghi_chu: null,
      p_dong_y: false,
      p_utm_source: 'messenger',
      p_utm_medium: 'chatbot',
      p_utm_campaign: null,
      p_trang_gioi_thieu: null,
      p_ip: null,
    });
    // supabase-js KHÔNG ném khi đứt mạng / hết giờ / cổng 502–504: nó trả error không có
    // mã (code rỗng, status 0 hoặc body không phải JSON). Khi đó yêu cầu có thể đã ghi
    // xong rồi mới đứt → "không chắc", không bao giờ nói "chưa ghi nhận". Lỗi thật của
    // database / PostgREST luôn có mã (SQLSTATE 5 ký tự hoặc PGRSTxxx) — laLoiDatabase(),
    // cùng định nghĩa với form đặt bàn và nộp hồ sơ trên website.
    if (error) return laLoiDatabase(error) ? { ok: false, loi: error.message ?? '' } : { ok: false, khongChac: true };
    // tao_dat_ban trả cả con_trong — chỉ lấy mã; con số sức chứa dừng ở đây.
    const dong = (Array.isArray(data) ? data[0] : data) as { ma_dat_ban?: string } | null;
    if (!dong?.ma_dat_ban) return { ok: false, khongChac: true };
    return { ok: true, ma: String(dong.ma_dat_ban) };
  } catch {
    // Hết giờ chờ CÓ THỂ là đã ghi xong rồi mới đứt: không nói "thất bại".
    return { ok: false, khongChac: true };
  }
}

/**
 * tra_cuu_mot_dat_ban (0084) — trả một giá trị jsonb (null = không thấy), không phải bảng: với
 * hàm trả bảng, người gọi PostgREST tự hủy được giao dịch của lần sai (406 vnd.pgrst.object+json)
 * và khoá dò mã không bao giờ đếm. Hàm tự ghi nhật ký và tự khoá, kể cả với p_ip null. Đang khoá
 * thì database trả câu tiếng Việt "Tra cứu bị tạm khoá…" → { ok: false, loi }.
 */
export async function traCuuMess(
  client: SupabaseClient, ma: string, sdt: string,
): Promise<{ ok: true; dong: DongTraCuu | null } | { ok: false; loi: string }> {
  try {
    const { data, error } = await client.rpc('tra_cuu_mot_dat_ban', { p_ma: ma, p_sdt: sdt, p_ip: null });
    if (error) return { ok: false, loi: error.message };
    const dong = (Array.isArray(data) ? data[0] : data) as DongTraCuu | null | undefined;
    return { ok: true, dong: dong && dong.ma_dat_ban ? dong : null };
  } catch (e) { return { ok: false, loi: loiCua(e) }; }
}

/**
 * huy_dat_ban tự ghi nhật ký tra cứu và dùng chung khoá với tra_cuu_mot_dat_ban (0084). true = đã hủy;
 * false = không tìm thấy; lỗi = tìm thấy nhưng không hủy được nữa, hoặc đang khoá.
 */
export async function huyDatBanMess(
  client: SupabaseClient, ma: string, sdt: string,
): Promise<{ ok: true; daHuy: boolean } | { ok: false; loi: string }> {
  try {
    const { data, error } = await client.rpc('huy_dat_ban', { p_ma: ma, p_sdt: sdt, p_ly_do: 'Khách hủy qua Messenger', p_ip: null });
    if (error) return { ok: false, loi: error.message };
    return { ok: true, daHuy: data === true };
  } catch (e) { return { ok: false, loi: loiCua(e) }; }
}

interface DongChiNhanh {
  ma?: string; ten?: string | null; dia_chi?: string | null; dien_thoai?: string | null; gio_da_chot?: boolean | null;
  trua_bat_dau?: string | null; trua_ket_thuc?: string | null; toi_bat_dau?: string | null; toi_ket_thuc?: string | null;
}

const hhmm = (s: unknown) => (typeof s === 'string' && /^\d{2}:\d{2}/.test(s) ? s.slice(0, 5) : null);
const chuoi = (s: unknown) => (typeof s === 'string' && s.trim() ? s.trim() : null);

/**
 * Câu hỏi thường gặp: noi_dung_cong_khai('vi') + chi_nhanh_cong_khai(). Chỉ
 * dùng dữ kiện ĐÃ CÔNG BỐ — giờ phục vụ null khi gio_phuc_vu_da_chot tắt.
 */
export async function docThongTinCongKhai(
  client: SupabaseClient, chiNhanhMa: string,
): Promise<{ ok: true; tt: ThongTinCongKhai } | { ok: false; loi: string }> {
  try {
    const [a, b] = await Promise.all([
      client.rpc('noi_dung_cong_khai', { p_ngon_ngu: 'vi' }),
      client.rpc('chi_nhanh_cong_khai'),
    ]);
    if (a.error) return { ok: false, loi: a.error.message };
    const nd = (a.data ?? {}) as Record<string, unknown>;
    const ds = (!b.error && Array.isArray(b.data) ? b.data : []) as DongChiNhanh[];
    const cn = ds.find(c => String(c.ma ?? '').toLowerCase() === chiNhanhMa.toLowerCase()) ?? ds[0] ?? null;
    const gioChot = nd.gio_phuc_vu_da_chot === true && cn?.gio_da_chot === true;
    const khoang = (x: unknown, y: unknown): [string, string] | null => {
      const p = hhmm(x), q = hhmm(y);
      return p && q ? [p, q] : null;
    };
    return {
      ok: true,
      tt: {
        formMo: nd.form_dat_ban_dang_mo === true,
        hienThucDon: nd.hien_thuc_don === true,
        diaChi: chuoi(nd.dia_chi_hien_thi) ?? chuoi(cn?.dia_chi),
        hotline: chuoi(nd.hotline) ?? chuoi(cn?.dien_thoai),
        mapsUrl: chuoi(nd.google_maps_url),
        tenChiNhanh: chuoi(cn?.ten),
        gio: gioChot && cn ? { trua: khoang(cn.trua_bat_dau, cn.trua_ket_thuc), toi: khoang(cn.toi_bat_dau, cn.toi_ket_thuc) } : null,
      },
    };
  } catch (e) { return { ok: false, loi: loiCua(e) }; }
}
