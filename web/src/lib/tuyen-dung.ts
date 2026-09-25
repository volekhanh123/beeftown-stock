/** Đọc tin tuyển dụng đã công bố. Chưa có database thì trả về mảng rỗng, và
 *  trang tự dùng danh sách dự phòng tĩnh. */
import { taoClient } from './noi-dung';
import type { NgonNgu } from './noi-dung';
import type { ViTri } from '../components/TrangTuyenDung.astro';

export async function docViTri(ngonNgu: NgonNgu = 'vi'): Promise<ViTri[]> {
  const client = taoClient();
  if (!client) return [];
  try {
    const { data, error } = await client.rpc('tin_tuyen_dung_cong_khai', {
      p_ngon_ngu: ngonNgu,
    });
    if (error || !Array.isArray(data)) return [];
    return data as ViTri[];
  } catch {
    return [];
  }
}

/**
 * Nhãn cho các enum của tin tuyển dụng (0012, 0028). Khóa phải khớp ĐÚNG giá
 * trị enum trong database — màn soạn tin ghi thẳng khóa này xuống, và
 * test-hop-dong-web.mjs đối chiếu với pg_enum.
 */
export const BO_PHAN = {
  sanh:      { vi: 'Sảnh',      en: 'Floor' },
  bep:       { vi: 'Bếp',       en: 'Kitchen' },
  quay_thit: { vi: 'Quầy thịt', en: 'Meat counter' },
  quan_ly:   { vi: 'Quản lý',   en: 'Management' },
  marketing: { vi: 'Marketing', en: 'Marketing' },
} as const;

export const LOAI_HOP_DONG = {
  toan_thoi_gian: { vi: 'Toàn thời gian', en: 'Full time' },
  ban_thoi_gian:  { vi: 'Bán thời gian',  en: 'Part time' },
  thoi_vu:        { vi: 'Thời vụ',        en: 'Seasonal' },
  thuc_tap:       { vi: 'Thực tập',       en: 'Internship' },
} as const;

/** Lương trả theo giờ hay theo tháng — phần đuôi của "25.000 đ/giờ". */
export const DON_VI_LUONG = {
  gio:   { vi: 'giờ',   en: 'hour' },
  thang: { vi: 'tháng', en: 'month' },
} as const;

/**
 * "6.000.000–8.000.000 đ/tháng", "Từ 25.000 đ/giờ", "Đến 8.000.000 đ/tháng",
 * hoặc null. Database cho phép chỉ có một đầu — "từ 6 triệu" là một mức hợp lệ.
 */
export function dinhDangLuong(
  tu: number | null, den: number | null, donVi: string | null, ngonNgu: NgonNgu = 'vi',
): string | null {
  const so = (n: number) => n.toLocaleString('vi-VN');
  const d = donVi ? `đ/${nhanEnum(DON_VI_LUONG, donVi, ngonNgu)}` : 'đ';
  if (tu && den) return tu === den ? `${so(tu)} ${d}` : `${so(tu)}–${so(den)} ${d}`;
  if (tu) return `${ngonNgu === 'en' ? 'From' : 'Từ'} ${so(tu)} ${d}`;
  if (den) return `${ngonNgu === 'en' ? 'Up to' : 'Đến'} ${so(den)} ${d}`;
  return null;
}

/** Nhãn của một giá trị enum; giá trị lạ thì trả nguyên văn thay vì để trống. */
export function nhanEnum(
  bang: Record<string, { vi: string; en: string }>, ma: string, ngonNgu: NgonNgu = 'vi',
): string {
  return bang[ma]?.[ngonNgu] ?? ma;
}
