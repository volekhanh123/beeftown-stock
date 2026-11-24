/** Đọc tin tuyển dụng đã công bố. Chưa có database thì trả về mảng rỗng, và
 *  trang tự dùng danh sách dự phòng tĩnh. */
import { taoClient } from './noi-dung.ts';
import type { NgonNgu } from './noi-dung';
import type { BaThuTieng } from './chu';
import { homNayVn } from './gio-vn.ts';
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

// =============================================================================
// CHỮ CỦA TIN → KHỐI HIỂN THỊ, QUYỀN LỢI CHUNG, JSON-LD JobPosting (rà soát SEO 23/11/2026)
// =============================================================================

/** Một khối chữ của tin: đoạn văn, hoặc danh sách gạch đầu dòng. */
export type KhoiChu = { kieu: 'doan'; chu: string } | { kieu: 'ds'; muc: string[] };

// Người soạn tin gõ mỗi ý trên một dòng, mở đầu bằng "–" (hay "-", "•"…) — màn soạn là ô văn bản thuần.
const DONG_GACH = /^\s*[-–—•·*]\s+(\S.*)$/u;

/**
 * Chữ nhiều dòng → các khối: dòng gạch đầu dòng liền nhau thành MỘT danh sách (<ul><li>), mỗi dòng khác là một đoạn.
 * Trước đây cả khối nằm trong một <p> với white-space: pre-line: người xem thấy gạch, còn máy đọc trang (Google, trợ lý
 * AI) gộp cả khối thành một câu dài.
 */
export function tachKhoiChu(s: string | null | undefined): KhoiChu[] {
  const khoi: KhoiChu[] = [];
  for (const dong of (s ?? '').split(/\r?\n/)) {
    const g = DONG_GACH.exec(dong);
    if (g) {
      const cuoi = khoi[khoi.length - 1];
      if (cuoi?.kieu === 'ds') cuoi.muc.push(g[1].trim());
      else khoi.push({ kieu: 'ds', muc: [g[1].trim()] });
    } else if (dong.trim()) {
      khoi.push({ kieu: 'doan', chu: dong.trim() });
    }
  }
  return khoi;
}

/** Dòng so sánh: bỏ gạch đầu dòng, gộp khoảng trắng, không phân biệt hoa thường. */
const dongSoSanh = (d: string) => d.replace(DONG_GACH, '$1').replace(/\s+/gu, ' ').trim().toLowerCase();

/**
 * Tách phần quyền lợi GIỐNG NHAU của các tin ra một khối chung. Bản đầu của trang lặp nguyên văn khối "Quyền lợi" (cả
 * dòng đóng "Beeftown tách rõ kỹ năng…") dưới từng vị trí — bốn lần. Quy tắc: một dòng có mặt trong quyền lợi của MỌI
 * tin đang có quyền lợi (từ hai tin trở lên) là dòng chung; mỗi tin chỉ còn giữ phần riêng của nó. Tin có quyền lợi
 * khác thật thì giữ nguyên phần khác đó — không gộp ép.
 *
 * Trả về `chung` (chữ dựng lại từ các dòng chung, theo thứ tự của tin đầu tiên; null nếu không có dòng chung nào) và
 * `rieng`: mã tin → chữ quyền lợi riêng còn lại (null nếu hết).
 */
export function tachQuyenLoiChung(
  tin: { ma: string; quyen_loi: string | null }[],
): { chung: string | null; rieng: Map<string, string | null> } {
  const dongCua = (s: string | null) => (s ?? '').split(/\r?\n/).filter(d => d.trim());
  const co = tin.filter(t => dongCua(t.quyen_loi).length > 0);
  const rieng = new Map<string, string | null>(tin.map(t => [t.ma, t.quyen_loi?.trim() || null]));
  if (co.length < 2) return { chung: null, rieng };

  const taoTap = (t: { quyen_loi: string | null }) => new Set(dongCua(t.quyen_loi).map(dongSoSanh));
  const taps = co.map(taoTap);
  const chungKhoa = new Set([...taps[0]].filter(k => taps.every(tap => tap.has(k))));
  if (chungKhoa.size === 0) return { chung: null, rieng };

  const daLay = new Set<string>();
  const chung = dongCua(co[0].quyen_loi).filter(d => {
    const k = dongSoSanh(d);
    if (!chungKhoa.has(k) || daLay.has(k)) return false;
    daLay.add(k);
    return true;
  }).join('\n');
  for (const t of co) {
    const con = dongCua(t.quyen_loi).filter(d => !chungKhoa.has(dongSoSanh(d))).join('\n');
    rieng.set(t.ma, con || null);
  }
  return { chung, rieng };
}

/** schema.org employmentType của từng loại hợp đồng; chưa chốt (null) hoặc loại lạ thì không khai. */
const LOAI_JSON_LD: Record<string, string> = {
  toan_thoi_gian: 'FULL_TIME',
  ban_thoi_gian: 'PART_TIME',
  thoi_vu: 'TEMPORARY',
  thuc_tap: 'INTERN',
};

const thoatHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Chữ của tin → HTML tối thiểu cho trường description của JobPosting (Google đọc HTML: <p>, <ul><li>). */
function htmlMoTa(khoi: KhoiChu[]): string {
  return khoi
    .map(k => (k.kieu === 'doan' ? `<p>${thoatHtml(k.chu)}</p>` : `<ul>${k.muc.map(m => `<li>${thoatHtml(m)}</li>`).join('')}</ul>`))
    .join('');
}

/** Mốc thời gian của database (timestamptz, ISO) → ngày YYYY-MM-DD theo giờ Việt Nam; không đọc được thì null. */
export function ngayDangTuMoc(moc: string | null | undefined): string | null {
  if (!moc) return null;
  const ms = Date.parse(moc);
  return Number.isFinite(ms) ? homNayVn(ms) : null;
}

/** Tin tối thiểu mà JSON-LD cần (ViTri của TrangTuyenDung.astro là tập con rộng hơn của nó). */
export interface TinChoJsonLd {
  ma: string;
  ten: string;
  loai_hop_dong: string | null;
  mo_ta: string | null;
  yeu_cau: string | null;
  quyen_loi: string | null;
  han_nop: string | null;
  /** Ngày công bố tin (cột cong_bo_luc). Tin không có ngày thật thì KHÔNG có JobPosting. */
  cong_bo_luc?: string | null;
}

/**
 * JSON-LD JobPosting, MỘT cho mỗi tin đang tuyển (Google for Jobs). Chỉ khai điều có thật và đang hiện trên trang:
 *   · datePosted là bắt buộc của Google và phải là ngày thật → tin không có `cong_bo_luc` thì bị BỎ (không đoán ngày).
 *   · validThrough = hạn nộp (han_nop) của tin, khi có; không bịa hạn.
 *   · employmentType theo loai_hop_dong; chưa chốt thì bỏ trường.
 *   · KHÔNG baseSalary: trang chỉ hiện lương khi đã duyệt, và chưa có tin nào ghi (khai lương không hiện trên trang là sai chính sách).
 *   · KHÔNG phường: jobLocation dùng đúng địa chỉ cấu trúc của cả web (diaChiCoCauTruc).
 *   · directApply: form nộp hồ sơ nằm ngay trang này.
 */
export function tinTuyenDungJsonLd(
  tin: TinChoJsonLd[],
  boiCanh: { trangUrl: string; tenToChuc: string; diaChi: Record<string, string>; goc: string },
): Record<string, unknown>[] {
  const ra: Record<string, unknown>[] = [];
  for (const t of tin) {
    const datePosted = ngayDangTuMoc(t.cong_bo_luc);
    if (!datePosted || !t.ten.trim()) continue;
    const moTa = htmlMoTa([
      ...tachKhoiChu(t.mo_ta),
      ...tachKhoiChu(t.yeu_cau),
      ...tachKhoiChu(t.quyen_loi),
    ]);
    if (!moTa) continue;
    const loai = t.loai_hop_dong ? LOAI_JSON_LD[t.loai_hop_dong] : undefined;
    const hanNop = t.han_nop && /^\d{4}-\d{2}-\d{2}$/.test(t.han_nop) ? t.han_nop : null;
    ra.push({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: t.ten.trim(),
      description: moTa,
      datePosted,
      ...(hanNop ? { validThrough: hanNop } : {}),
      ...(loai ? { employmentType: loai } : {}),
      identifier: { '@type': 'PropertyValue', name: boiCanh.tenToChuc, value: t.ma },
      hiringOrganization: { '@type': 'Organization', name: boiCanh.tenToChuc, sameAs: boiCanh.goc },
      jobLocation: { '@type': 'Place', address: boiCanh.diaChi },
      directApply: true,
      url: boiCanh.trangUrl,
    });
  }
  return ra;
}
