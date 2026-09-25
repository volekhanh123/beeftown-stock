/**
 * ĐỌC CỔNG NỘI DUNG
 * =================
 * Toàn bộ trang công khai đọc dữ kiện qua đúng một cửa: hàm
 * noi_dung_cong_khai() trong database (migration 0010).
 *
 * BA ĐIỀU QUAN TRỌNG
 *
 * 1. Chưa cấu hình Supabase thì MỌI dữ kiện là null, và trang vẫn chạy đúng.
 *    Đó không phải cách xử lý lỗi — đó là trạng thái mặc định của thiết kế.
 *    Nhờ vậy trang ra mắt deploy được NGAY hôm nay, trước khi có database,
 *    và tự sáng lên khi database được nối vào.
 *
 * 2. Database trả về ĐỦ mọi khóa trong sổ đăng ký. Khóa chưa duyệt có giá trị
 *    null; khóa gõ sai thì THIẾU HẲN. Nhờ vậy phân biệt được "chưa duyệt" với
 *    "lập trình viên gõ nhầm tên khóa".
 *
 * 3. Công tắc CHỈ THÊM dữ kiện. Phần nền — tên, khẩu hiệu, "nhà hàng chuyên
 *    bò tại Quận 1" — nằm trong mã nguồn và không có công tắc nào tắt được.
 */

import { createClient } from '@supabase/supabase-js';

export type NgonNgu = 'vi' | 'en';

/** Ảnh trả về từ cổng nội dung. Luôn kèm nguồn thật để không nhầm ảnh minh họa. */
export interface AnhCongBo {
  url: string;
  bucket: string;
  alt: string | null;
  chu_thich: string | null;
  nguon: 'anh_that' | 'anh_minh_hoa' | 'anh_concept' | 'anh_tai_lieu';
  rong: number | null;
  cao: number | null;
}

export interface NoiDung {
  // Lịch
  ngay_khai_truong: string | null;
  ngay_treo_bang_ron: string | null;
  // Trạng thái và công tắc
  dong_trang_thai: string | null;
  form_dat_ban_dang_mo: boolean | null;
  gio_phuc_vu_da_chot: boolean | null;
  hien_thuc_don: boolean | null;
  hien_do_uong_co_con: boolean | null;
  hien_tuyen_dung: boolean | null;
  hien_ba_buoc: boolean | null;
  hien_quay_thit: boolean | null;
  hien_tiec_nhom: boolean | null;
  hien_danh_gia: boolean | null;
  // Liên hệ
  dia_chi_hien_thi: string | null;
  hotline: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  zalo_oa_url: string | null;
  google_maps_url: string | null;
  email_lien_he: string | null;
  // Chia sẻ link
  tieu_de_og: string | null;
  mo_ta_og: string | null;
  anh_chia_se: AnhCongBo | null;
}

/** Mọi khóa null — trạng thái của một database vừa cài, và của một trang chưa nối database. */
const RONG: NoiDung = {
  ngay_khai_truong: null, ngay_treo_bang_ron: null,
  dong_trang_thai: null, form_dat_ban_dang_mo: null, gio_phuc_vu_da_chot: null,
  hien_thuc_don: null, hien_do_uong_co_con: null, hien_tuyen_dung: null,
  hien_ba_buoc: null, hien_quay_thit: null, hien_tiec_nhom: null, hien_danh_gia: null,
  dia_chi_hien_thi: null, hotline: null, facebook_url: null, instagram_url: null,
  tiktok_url: null, zalo_oa_url: null, google_maps_url: null, email_lien_he: null,
  tieu_de_og: null, mo_ta_og: null, anh_chia_se: null,
};

/**
 * Hai biến này mang tiền tố PUBLIC_ nên Vite nhúng thẳng vào bản build.
 *
 * Đó là lựa chọn ĐÚNG ở đây, không phải đường tắt: khóa anon của Supabase
 * công khai theo thiết kế — nó nằm sẵn trong mã trang web mà ai cũng xem
 * được. An toàn nằm ở RLS và ở danh sách 12 hàm anon được gọi (migration
 * 0013), không nằm ở việc giấu khóa.
 *
 * Hệ quả cần nhớ khi deploy: phải đặt hai biến này ở phần BUILD của
 * Cloudflare, không phải phần biến môi trường lúc chạy.
 *
 * (Astro 7 đã bỏ Astro.locals.runtime.env; cách đọc biến lúc chạy giờ là
 * import { env } from 'cloudflare:workers'. Không dùng ở đây vì không cần.)
 */
function layBien(ten: string): string | undefined {
  const v = (import.meta.env as Record<string, unknown>)?.[ten];
  return typeof v === 'string' && v ? v : undefined;
}

export function taoClient() {
  const url = layBien('PUBLIC_SUPABASE_URL');
  const key = layBien('PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function maChiNhanh(): string {
  return layBien('PUBLIC_CHI_NHANH') ?? 'q1';
}

/**
 * Đọc toàn bộ dữ kiện đã công bố.
 *
 * KHÔNG ném lỗi. Database chưa cấu hình, mất mạng, hay Supabase đang ngủ đều
 * cho cùng một kết quả: mọi dữ kiện null, trang hiện bản nền và nói đúng sự
 * thật. Một trang ra mắt hỏng vì database chậm thì tệ hơn hẳn một trang ra
 * mắt chỉ có tên, địa chỉ và nút theo dõi.
 */
export async function docNoiDung(ngonNgu: NgonNgu = 'vi'): Promise<NoiDung> {
  const client = taoClient();
  if (!client) return RONG;

  try {
    const { data, error } = await client.rpc('noi_dung_cong_khai', { p_ngon_ngu: ngonNgu });
    if (error || !data) return RONG;
    return { ...RONG, ...(data as Partial<NoiDung>) };
  } catch {
    return RONG;
  }
}

/**
 * Giai đoạn ra mắt được SUY RA từ các công tắc, không lưu ở đâu cả.
 *
 * Không lưu vì nếu lưu thì sẽ có lúc giai đoạn nói một đằng, công tắc nói một
 * nẻo — và lúc đó không biết tin cái nào.
 */
export type GiaiDoan = 'truoc_bang_ron' | 'ngay_bang_ron' | 'mo_rong' | 'co_ngay_mo' | 'dang_mo';

export function tinhGiaiDoan(nd: NoiDung, homNay: string): GiaiDoan {
  const coDiaChi = !!nd.dia_chi_hien_thi;
  const coMoRong = !!(nd.hien_thuc_don || nd.hien_quay_thit || nd.hien_ba_buoc);
  const ngayMo = nd.ngay_khai_truong;

  if (ngayMo && nd.gio_phuc_vu_da_chot && ngayMo <= homNay) return 'dang_mo';
  if (ngayMo) return 'co_ngay_mo';
  if (coMoRong) return 'mo_rong';
  if (coDiaChi) return 'ngay_bang_ron';
  return 'truoc_bang_ron';
}

/** Ngày hôm nay theo giờ Việt Nam (UTC+7). Cùng cách tính với hom_nay_vn() trong database. */
export function homNayVn(): string {
  const t = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return t.toISOString().slice(0, 10);
}

/** "2026-12-01" → "1 tháng 12, 2026" / "1 December 2026" */
export function dinhDangNgay(iso: string, ngonNgu: NgonNgu): string {
  const [nam, thang, ngay] = iso.split('-').map(Number);
  if (!nam || !thang || !ngay) return iso;
  if (ngonNgu === 'en') {
    const ten = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
    return `${ngay} ${ten[thang - 1]} ${nam}`;
  }
  return `ngày ${ngay} tháng ${thang}, ${nam}`;
}
