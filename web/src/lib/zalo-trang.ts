/**
 * ZALO — PHẦN DÙNG CHUNG CỦA BA TRANG /noi-bo/zalo
 *
 * Ai vào được, chi nhánh nào đang xem, nhãn hai thứ tiếng, định dạng giờ VN.
 * Chạy bằng client của nhân sự đã đăng nhập (sau middleware) — RLS và các RPC
 * zalo_* (0047) mới là luật; danh sách vai ở đây chỉ để không hiện nút mà
 * database sẽ từ chối.
 */

import type { AstroCookies } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { HaiThuTieng, NgonNguNB } from './ngon-ngu-noi-bo.ts';

/** Vai xem / chạy chiến dịch Zalo — khớp zalo_tong_quan, zalo_tao_chien_dich (0047). */
export const VAI_ZALO = ['chu_so_huu', 'quan_ly', 'marketing'] as const;

export function duocVaoZalo(vai: string): boolean {
  return (VAI_ZALO as readonly string[]).includes(vai);
}

export interface ChiNhanhZalo { id: string; ma: string; ten: string }

const COOKIE_CN = 'bt_zalo_cn';

/**
 * Chi nhánh đang xem. Nhân sự có chi nhánh → chi nhánh đó. Chủ (không gắn chi
 * nhánh) → ?cn=<mã>, rồi cookie, rồi chi nhánh đầu tiên.
 */
export async function chonChiNhanh(
  client: SupabaseClient, nhanSu: { chi_nhanh_id: string | null }, url: URL, cookies: AstroCookies,
): Promise<{ chiNhanh: ChiNhanhZalo | null; cacChiNhanh: ChiNhanhZalo[]; loi: string | null }> {
  const { data, error } = await client.from('chi_nhanh').select('id, ma, ten').order('ma');
  if (error) return { chiNhanh: null, cacChiNhanh: [], loi: error.message };
  const ds = (data ?? []) as ChiNhanhZalo[];
  if (nhanSu.chi_nhanh_id) {
    return { chiNhanh: ds.find(c => c.id === nhanSu.chi_nhanh_id) ?? null, cacChiNhanh: [], loi: null };
  }
  const thamSo = url.searchParams.get('cn');
  const chon = thamSo ?? cookies.get(COOKIE_CN)?.value;
  const cn = ds.find(c => c.ma === chon) ?? ds[0] ?? null;
  if (thamSo && cn) {
    cookies.set(COOKIE_CN, cn.ma, {
      httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax', path: '/noi-bo/zalo', maxAge: 60 * 60 * 24 * 60,
    });
  }
  return { chiNhanh: cn, cacChiNhanh: ds, loi: null };
}

export const TEN_KET_QUA: Record<string, HaiThuTieng> = {
  cho_gui:    { vi: 'Đang chờ gửi',   en: 'Waiting to send' },
  da_gui:     { vi: 'Đã gửi',         en: 'Sent' },
  that_bai:   { vi: 'Thất bại',       en: 'Failed' },
  bi_tu_choi: { vi: 'Không gửi được', en: 'Not allowed' },
  da_huy:     { vi: 'Đã hủy',         en: 'Cancelled' },
};

export const TEN_LOAI_TIN: Record<string, HaiThuTieng> = {
  giao_dich: { vi: 'Tin giao dịch', en: 'Transactional' },
  cham_soc:  { vi: 'Tin chăm sóc',  en: 'Marketing' },
};

/** Nhóm khách của zalo_khach_theo_nhom (0047) — khớp v_phan_nhom_khach + vip. */
export const TEN_NHOM: Record<string, HaiThuTieng> = {
  tat_ca:               { vi: 'Tất cả khách',            en: 'All customers' },
  vip:                  { vi: 'Khách VIP',               en: 'VIP customers' },
  moi:                  { vi: 'Khách mới',               en: 'New customers' },
  dang_thanh_thoi_quen: { vi: 'Đang thành thói quen',    en: 'Becoming regulars' },
  than_thiet:           { vi: 'Khách thân thiết',        en: 'Loyal customers' },
  ngu_dong:             { vi: 'Lâu rồi chưa quay lại',   en: 'Not back for a while' },
  chua_ghe:             { vi: 'Chưa ghé lần nào',        en: 'Never visited' },
  b2b:                  { vi: 'Khách doanh nghiệp',      en: 'Business customers' },
  khac:                 { vi: 'Khác',                    en: 'Other' },
};

export const TEN_TRANG_THAI_CD: Record<string, HaiThuTieng> = {
  nhap:      { vi: 'Nháp',      en: 'Draft' },
  dang_chay: { vi: 'Đang gửi',  en: 'Sending' },
  tam_dung:  { vi: 'Đã dừng',   en: 'Stopped' },
  hoan_tat:  { vi: 'Xong',      en: 'Done' },
};

/** Giờ Việt Nam, "27/09 14:05" (khác năm thì thêm năm). */
export function gioVn(iso: string | null | undefined, nn: NgonNguNB = 'vi'): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const cungNam = new Date().getUTCFullYear() === d.getUTCFullYear();
  return new Intl.DateTimeFormat(nn === 'en' ? 'en-GB' : 'vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', ...(cungNam ? {} : { year: 'numeric' }),
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);
}

/** Ô datetime-local (giờ VN, "2026-09-30T18:00") → ISO có múi +07:00. Sai dạng → null. */
export function gioHenSangIso(s: string | null | undefined): string | null {
  const v = String(s ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const iso = `${v}:00+07:00`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const laUuid = (s: unknown): s is string => typeof s === 'string' && UUID.test(s);
