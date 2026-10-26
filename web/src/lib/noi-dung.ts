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

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type NgonNgu = 'vi' | 'en' | 'ko';

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
  // Mini App Zalo hiện còn hàng theo kho (0093) — website không đọc khóa này, hàm mini_app_con_hang() tự hỏi.
  mini_app_hien_con_hang: boolean | null;
  // Mua thịt về (0101). hien_mua_thit_ve là công tắc HIỆU LỰC do database tính (noi_dung_cong_khai): true chỉ
  // khi công tắc bật, zalo_oa_url là link https://zalo.me/… hợp lệ đã công bố VÀ menu web có ít nhất một gói.
  // Điều hướng, trạng thái trang và form cùng đọc giá trị này (muaThitVeMo của lib/dich-dat-hang.ts).
  hien_mua_thit_ve: boolean | null;
  // Trang ghi "Tạm hết ở quầy" — website không đọc khóa này, hàm mua_thit_ve_cong_khai() tự hỏi.
  mua_thit_hien_tam_het: boolean | null;
  mua_thit_gio_nhan: string | null;
  // Đã công bố = trang mở "Giao tận nơi"; chưa công bố = chỉ nhận tại quầy.
  mua_thit_giao_hang: string | null;
  mua_thit_thue: string | null;
  mua_thit_bao_quan_mat: string | null;
  mua_thit_bao_quan_dong_lanh: string | null;
  mua_thit_can_lech: string | null;
  mua_thit_hang_loi: string | null;
  mua_thit_doi_huy: string | null;
  // Liên hệ
  dia_chi_hien_thi: string | null;
  hotline: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  // Từ 0101 chỉ chủ công bố, chỉ nhận https://zalo.me/<mã> — cũng là đích đặt hàng của Mua thịt về (lib/dich-dat-hang.ts).
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
  mini_app_hien_con_hang: null,
  hien_mua_thit_ve: null, mua_thit_hien_tam_het: null, mua_thit_gio_nhan: null, mua_thit_giao_hang: null,
  mua_thit_thue: null, mua_thit_bao_quan_mat: null, mua_thit_bao_quan_dong_lanh: null, mua_thit_can_lech: null,
  mua_thit_hang_loi: null, mua_thit_doi_huy: null,
  dia_chi_hien_thi: null, hotline: null, facebook_url: null, instagram_url: null,
  tiktok_url: null, zalo_oa_url: null, google_maps_url: null, email_lien_he: null,
  tieu_de_og: null, mo_ta_og: null, anh_chia_se: null,
};

/**
 * Hai biến này mang tiền tố PUBLIC_ nên Vite nhúng thẳng vào bản build.
 *
 * Đó là lựa chọn ĐÚNG ở đây, không phải đường tắt: khóa anon của Supabase
 * công khai theo thiết kế — nó nằm sẵn trong mã trang web mà ai cũng xem
 * được. An toàn nằm ở RLS và ở danh sách hàm anon được gọi (khối CHỐT QUYỀN
 * của migration mới nhất; DUOC_PHEP của crm/test/test-an-toan.mjs), không nằm ở việc giấu khóa.
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
 *
 * Nhưng KHÔNG im lặng: đã cấu hình database mà đọc lỗi thì ghi một dòng log
 * (Cloudflare → Workers → Logs). Không có dòng đó, một database chết trông y hệt
 * một trang chưa công bố gì — không ai biết để sửa.
 */
export async function docNoiDung(
  ngonNgu: NgonNgu = 'vi',
  client: Pick<SupabaseClient, 'rpc'> | null = taoClient(),
): Promise<NoiDung> {
  if (!client) return RONG;

  try {
    const { data, error } = await client.rpc('noi_dung_cong_khai', { p_ngon_ngu: ngonNgu });
    if (error) console.error('[noi-dung] không đọc được nội dung công khai:', error.code ?? '', error.message);
    if (error || !data) return RONG;
    return { ...RONG, ...(data as Partial<NoiDung>) };
  } catch (e) {
    console.error('[noi-dung] không gọi được database:', e instanceof Error ? e.message : String(e));
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

/** Ngày hôm nay theo giờ Việt Nam (UTC+7) — một chỗ duy nhất ở gio-vn.ts, khớp hom_nay_vn() trong database. */
export { homNayVn } from './gio-vn.ts';

const THANG_EN = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

// Một cách viết cho mỗi ngôn ngữ, không phải một nhánh if cho mỗi ngôn ngữ
// "khác tiếng Việt": thứ tiếng thứ ba mà quên khai thì là lỗi biên dịch, chứ
// không lặng lẽ rơi vào cách viết của tiếng Việt.
const CACH_VIET_NGAY: Record<NgonNgu, (nam: number, thang: number, ngay: number) => string> = {
  vi: (nam, thang, ngay) => `ngày ${ngay} tháng ${thang}, ${nam}`,
  en: (nam, thang, ngay) => `${ngay} ${THANG_EN[thang - 1]} ${nam}`,
  ko: (nam, thang, ngay) => `${nam}년 ${thang}월 ${ngay}일`,
};

/** "2026-12-01" → "ngày 1 tháng 12, 2026" / "1 December 2026" / "2026년 12월 1일" */
export function dinhDangNgay(iso: string, ngonNgu: NgonNgu): string {
  const [nam, thang, ngay] = iso.split('-').map(Number);
  if (!nam || !thang || !ngay) return iso;
  return CACH_VIET_NGAY[ngonNgu](nam, thang, ngay);
}
