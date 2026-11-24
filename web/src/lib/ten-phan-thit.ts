/**
 * TÊN PHẦN THỊT TRÊN TRANG MUA THỊT VỀ — tên Việt (hay Hàn) kèm tên gốc trong ngoặc, và mục của phần đó ở trang
 * Các phần thịt bò (SEO quick win 23/11/2026)
 * =====================================================================================================
 *
 * VÌ SAO. Menu của trang lấy từ database (mua_thit_ve_cong_khai, 0101) và tên các gói thịt ở đó là tên khay: Ribeye,
 * Ribeye with Cap, Outside Skirt, Top Blade, Galbisal, LA Galbi. Người Việt tìm "đầu thăn ngoại", "dẻ sườn bò",
 * "diềm thăn bò" — nên trang tiếng Việt hiện "Đầu thăn ngoại (Ribeye)": tên Việt đứng trước, tên khay trong ngoặc để
 * khách đối chiếu với nhãn khay thật. Chỉ ĐỔI CÁCH HIỆN trong mã: không sửa database, không sửa tên sản phẩm.
 *
 * NGUỒN TÊN (không bịa tên nào):
 *   · tiếng Việt: BANG_TU của tieng-viet-trang.ts — bảng từ Khánh duyệt cho Trang (trợ lý ảo) nói đúng tên phần thịt
 *     (Ribeye → đầu thăn ngoại, Ribeye with Cap → đầu thăn ngoại còn nắp, Outside Skirt → diềm thăn bò, Top Blade → lõi
 *     vai bò, Galbisal → dẻ sườn bò, LA Galbi → sườn bò cắt ngang ướp sẵn). Cột đầu của bảng là khóa tra.
 *   · tiếng Hàn: ba tên Khánh chốt 23/11/2026 — 꽃등심 (đầu thăn ngoại), 갈비살 (dẻ sườn bò), 안창살 (diềm thăn bò).
 *     Phần nào chưa có tên Hàn trong bảng nhà (Top Blade, LA Galbi) thì giữ tên gốc. Tên Việt của chimasal CHƯA chốt:
 *     không có trong file này. Không bao giờ viết "thăn vai" (người bán dùng nó cho cả lõi vai, T-bone và ribeye).
 *   · tiếng Anh: giữ tên gốc.
 *   Tên đã Việt hóa sẵn ("Ba chỉ bò", "Kim chi cải thảo") và tên chủ đã dịch trong /noi-bo (ten khác tenVi ở trang Hàn,
 *   ten khác tenVi ở trang Anh) giữ nguyên — chủ dịch tay thì chủ thắng.
 *
 * ĐƠN GỬI CHO QUÁN KHÔNG ĐỔI. Trang gửi database chỉ KHÓA gói và SỐ LƯỢNG (lib/dat-hang-mua-thit.ts: p_gio,
 * p_gia_da_xem); tên trên đơn nhân viên đọc ở /noi-bo/don-mua-thit là tên database chụp lại lúc đặt (ten_vi, 0113) —
 * vẫn là "Ribeye", "Galbisal"… đúng tên khay. Nên một dòng đơn của quán không bao giờ mất tên gốc.
 *
 * LINK SANG TRANG CÁC PHẦN THỊT BÒ. Mỗi gói thịt dẫn tới mục của phần đó (#pb-<id>, components/TrangPhanBo.astro).
 * Chỉ link khi trang kia CÓ mục đó (id nằm trong PHAN_BO của phan-bo.ts): "LA Galbi" và "Ba chỉ bò" chờ PR của phiên
 * trang Phần thịt thêm mục #pb-la-galbi, #pb-ba-chi — khi PR đó vào, link tự hiện, không cần sửa file này. Không link
 * cho kim chi, và không link cho tên lạ (chủ thêm gói mới thì thẻ chưa có link, không bao giờ link sai).
 *
 * File chỉ chạy ở máy chủ (nạp bảng từ của Trang). Kiểm thử: crm/test/test-cong-khai-ten-phan-thit.mjs.
 */
import { BANG_TU } from './tieng-viet-trang.ts';
import { PHAN_BO } from './phan-bo.ts';
import { duongDanTuongUng } from './chu.ts';
import type { NgonNgu } from './noi-dung.ts';

/** Chỗ dữ liệu của sản phẩm mà hai hàm dưới đọc (SanPhamMua của don-mua-thit.ts có đủ). */
export interface SanPhamCoTen {
  loai: 'thit' | 'kim_chi';
  /** Tên theo thứ tiếng của trang. */
  ten: string;
  /** Tên tiếng Việt hiện tại — cũng là tên database chụp vào đơn. */
  tenVi: string;
}

interface PhanThit {
  /** Tên khay (khóa tra, không phân biệt hoa thường, một dấu cách). Phải là cột đầu của một dòng BANG_TU, trừ khi viTuBang = false. */
  goc: string;
  /** Tên Hàn trong bảng nhà; null = chưa có, trang Hàn giữ tên gốc. */
  ko: string | null;
  /** id của mục ở trang Các phần thịt bò (PHAN_BO) mà phần này thuộc về. */
  muc: string;
  /** Có dòng trong BANG_TU để lấy tên Việt không. "Ba chỉ bò" đã là tên Việt: false (chỉ có link). */
  viTuBang: boolean;
}

/**
 * Các phần thịt trang Mua thịt về biết. Thứ tự không quan trọng; "Ribeye with Cap" và "Ribeye" khác nhau nên khóa là
 * cả tên (khớp trọn tên, không khớp một phần).
 */
export const PHAN_THIT: readonly PhanThit[] = [
  { goc: 'Ribeye',          ko: '꽃등심', muc: 'dau-than-ngoai', viTuBang: true },
  { goc: 'Ribeye with Cap', ko: '꽃등심', muc: 'dau-than-ngoai', viTuBang: true },
  { goc: 'Outside Skirt',   ko: '안창살', muc: 'diem-than',      viTuBang: true },
  { goc: 'Top Blade',       ko: null,    muc: 'loi-vai',        viTuBang: true },
  { goc: 'Galbisal',        ko: '갈비살', muc: 'de-suon',        viTuBang: true },
  { goc: 'LA Galbi',        ko: null,    muc: 'la-galbi',       viTuBang: true },
  { goc: 'Ba chỉ bò',       ko: null,    muc: 'ba-chi',         viTuBang: false },
];

const chuanHoa = (s: string): string => s.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();

/** Phần thịt của một sản phẩm; chỉ thịt (kim chi và tên lạ → null). Khớp theo tên tiếng Việt của database (tenVi). */
function timPhanThit(sp: SanPhamCoTen): PhanThit | null {
  if (sp.loai !== 'thit') return null;
  const khoa = chuanHoa(sp.tenVi);
  return PHAN_THIT.find(p => chuanHoa(p.goc) === khoa) ?? null;
}

/** Tên Việt của một phần (bảng từ của Trang), viết hoa chữ đầu; không có thì null. */
function tenViet(p: PhanThit): string | null {
  if (!p.viTuBang) return null;
  const dong = BANG_TU.find(d => chuanHoa(d[0]) === chuanHoa(p.goc));
  const viet = dong?.[1];
  return viet ? `${viet.charAt(0).toLocaleUpperCase('vi')}${viet.slice(1)}` : null;
}

/**
 * Tên hiện trên thẻ, hộp chọn, dòng "Đơn của bạn" và JSON-LD Product.
 *   · vi: "Đầu thăn ngoại (Ribeye)" — tên Việt, tên khay trong ngoặc (tên khay = ten, đúng chữ đang hiện trước đây);
 *   · ko: "꽃등심 (Ribeye)" khi bảng nhà có tên Hàn và chủ chưa tự dịch tên đó; còn lại tên gốc;
 *   · en và mọi tên không có trong bảng: tên gốc (sp.ten).
 */
export function tenHienThi(sp: SanPhamCoTen, ngonNgu: NgonNgu): string {
  const p = timPhanThit(sp);
  if (!p) return sp.ten;
  if (ngonNgu === 'vi') {
    const viet = tenViet(p);
    // Tên khay trùng tên Việt (đổi tên trong /noi-bo thành tên Việt) thì không lặp lại trong ngoặc.
    return viet && chuanHoa(viet) !== chuanHoa(sp.ten) ? `${viet} (${sp.ten})` : sp.ten;
  }
  if (ngonNgu === 'ko' && p.ko && sp.ten === sp.tenVi) return `${p.ko} (${sp.ten})`;
  return sp.ten;
}

/** id của các mục đang có ở trang Các phần thịt bò: nguồn sự thật là PHAN_BO, cùng danh sách TrangPhanBo.astro dựng id từ đó. */
const MUC_CO_SAN: ReadonlySet<string> = new Set(PHAN_BO.map(p => p.id));

/**
 * id của phần thịt (PHAN_BO) mà gói này thuộc về; null khi gói không thuộc phần nào đã biết hay trang Các phần thịt bò
 * chưa có mục đó. Chiều ngược của lienKetPhanThit: trang Các phần thịt bò dùng nó để tìm gói của từng phần
 * (SEO 24/11/2026, mua-thit-ve.ts duongGoiTheoPhan) — một bảng ghép duy nhất cho cả hai chiều.
 */
export function mucPhanThit(sp: SanPhamCoTen): string | null {
  const p = timPhanThit(sp);
  return p && MUC_CO_SAN.has(p.muc) ? p.muc : null;
}

/**
 * Link tới mục của phần thịt này ở trang Các phần thịt bò (/phan-thit-bo, /en/beef-cuts, /ko/beef-cuts + #pb-<id>);
 * null khi sản phẩm không thuộc phần nào đã biết hay trang kia chưa có mục đó.
 */
export function lienKetPhanThit(sp: SanPhamCoTen, ngonNgu: NgonNgu): string | null {
  const p = timPhanThit(sp);
  if (!p || !MUC_CO_SAN.has(p.muc)) return null;
  return `${duongDanTuongUng('/phan-thit-bo', ngonNgu)}#pb-${p.muc}`;
}
