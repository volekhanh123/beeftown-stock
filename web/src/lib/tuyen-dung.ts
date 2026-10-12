/** Đọc tin tuyển dụng đã công bố. Chưa có database thì trả về mảng rỗng, và
 *  trang tự dùng danh sách dự phòng tĩnh. */
import { taoClient } from './noi-dung.ts';
import type { NgonNgu } from './noi-dung';
import type { BaThuTieng } from './chu';
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
 *
 * MỖI NHÃN NẰM TRÊN ĐÚNG MỘT DÒNG. Phép thử đó đọc khóa bằng regex theo đầu
 * dòng: tách vi/en/ko xuống dòng riêng là nó đọc "vi", "en", "ko" thành ba
 * giá trị enum và báo lệch với database.
 */
export const BO_PHAN = {
  sanh:      { vi: 'Sảnh',      en: 'Hall',         ko: '홀' },
  bep:       { vi: 'Bếp',       en: 'Kitchen',      ko: '주방' },
  quay_thit: { vi: 'Quầy thịt', en: 'Butcher',      ko: '정육 코너' },
  quan_ly:   { vi: 'Quản lý',   en: 'Management',   ko: '관리직' },
  marketing: { vi: 'Marketing', en: 'Marketing',    ko: '마케팅' },
} as const satisfies Record<string, BaThuTieng>;

export const LOAI_HOP_DONG = {
  toan_thoi_gian: { vi: 'Toàn thời gian', en: 'Full time',  ko: '풀타임' },
  ban_thoi_gian:  { vi: 'Bán thời gian',  en: 'Part time',  ko: '파트타임' },
  thoi_vu:        { vi: 'Thời vụ',        en: 'Seasonal',   ko: '단기 근무' },
  thuc_tap:       { vi: 'Thực tập',       en: 'Internship', ko: '인턴' },
} as const satisfies Record<string, BaThuTieng>;

/**
 * Tin chưa chốt loại hợp đồng: cột loai_hop_dong là null (0043). Không nằm
 * trong LOAI_HOP_DONG vì bảng đó phải khớp đúng từng giá trị của enum
 * (test-hop-dong-web) — "chưa chốt" là vắng một quyết định, không phải một
 * loại hợp đồng. Form nội bộ gửi MA_CHUA_CHOT, server đổi thành null.
 */
export const MA_CHUA_CHOT = 'chua_chot';
export const CHUA_CHOT: BaThuTieng = { vi: 'Chưa chốt', en: 'To be confirmed', ko: '미정' };

/** Lương trả theo giờ hay theo tháng — phần đuôi của "25.000 đ/giờ". */
export const DON_VI_LUONG = {
  gio:   { vi: 'giờ',   en: 'hour',  ko: '시간' },
  thang: { vi: 'tháng', en: 'month', ko: '월' },
} as const satisfies Record<string, BaThuTieng>;

// Chữ đứng trước con số khi mức lương chỉ có một đầu. Tiếng Hàn quen đặt
// 부터/까지 SAU con số, nhưng đuôi "đ/시간" mà dính thêm 부터 thì khó đọc;
// 최소/최대 đứng trước được mà vẫn đúng nghĩa "từ"/"đến".
const MOT_DAU = {
  tu:  { vi: 'Từ',  en: 'From',  ko: '최소' },
  den: { vi: 'Đến', en: 'Up to', ko: '최대' },
} as const satisfies Record<string, BaThuTieng>;

/**
 * "6.000.000–8.000.000 đ/tháng", "Từ 25.000 đ/giờ", "Đến 8.000.000 đ/tháng",
 * hoặc null. Database cho phép chỉ có một đầu — "từ 6 triệu" là một mức hợp lệ.
 *
 * Con số viết cùng một kiểu ở MỌI ngôn ngữ (dấu chấm ngăn nghìn, đuôi "đ"):
 * đây là tiền đồng trả ở Việt Nam, và "6.000.000 đ" là cách ứng viên sẽ thấy
 * nó trên hợp đồng và bảng lương — chỉ chữ quanh con số là đổi theo trang.
 */
export function dinhDangLuong(
  tu: number | null, den: number | null, donVi: string | null, ngonNgu: NgonNgu = 'vi',
): string | null {
  const so = (n: number) => n.toLocaleString('vi-VN');
  const d = donVi ? `đ/${nhanEnum(DON_VI_LUONG, donVi, ngonNgu)}` : 'đ';
  if (tu && den) return tu === den ? `${so(tu)} ${d}` : `${so(tu)}–${so(den)} ${d}`;
  if (tu) return `${MOT_DAU.tu[ngonNgu]} ${so(tu)} ${d}`;
  if (den) return `${MOT_DAU.den[ngonNgu]} ${so(den)} ${d}`;
  return null;
}

/** Nhãn của một giá trị enum; giá trị lạ thì trả nguyên văn thay vì để trống. */
export function nhanEnum(
  bang: Record<string, BaThuTieng>, ma: string, ngonNgu: NgonNgu = 'vi',
): string {
  return bang[ma]?.[ngonNgu] ?? ma;
}
