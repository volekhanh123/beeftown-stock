/**
 * NỘI BỘ — MENU PHẦN NHÀ HÀNG (CRM / WEBSITE)
 *
 * Một danh sách duy nhất cho mọi màn của phần nhà hàng: thanh trên / thanh đáy của
 * layouts/NoiBo.astro, menu người dùng và trang "Khác" của kho (MUC_CRM trong
 * kho/dieu-huong.ts dựng từ đây), trang "Tất cả chức năng" (lib/ban-do-chuc-nang.ts).
 *
 * Vì sao gom về một chỗ: trước đây có hai bản — MUC trong NoiBo.astro và MUC_CRM
 * "soi gương" bên kho. Bản soi gương thiếu Zalo, Messenger, Tin tuyển dụng, nên đang
 * ở kho thì không có đường nào sang ba màn đó; Tin tuyển dụng thì không nằm trên menu
 * nào, vai marketing chỉ tới được qua một dòng chữ ở trang Tổng quan.
 *
 * THANH ĐÁY ĐIỆN THOẠI TỐI ĐA 5 NÚT. Bản cũ xếp cả 8 chữ của chủ nhà hàng lên thanh
 * đáy: ở màn 360px, Zalo, Messenger, Kho, Cài đặt nằm ngoài mép phải và không có gì
 * báo là phải cuộn ngang. Giờ vai nào cũng thấy đủ mục của mình trên thanh đáy, hoặc
 * 4 mục hay dùng + nút "Thêm" mở trang Tất cả chức năng (thanhDayNoiBo).
 *
 * Quyền ở đây chỉ để ẩn/hiện. Vai của từng mục khớp với RLS và dòng chặn đầu trang
 * đó — giấu một mục RLS vẫn cho thì khó chịu, hiện một mục RLS chặn thì người dùng
 * bấm vào rồi nhận lỗi khó hiểu (crm/test/test-noi-bo-dieu-huong.mjs kiểm).
 *
 * File thuần (chỉ `import type`), để test nạp thẳng bằng Node.
 */

import type { HaiThuTieng } from './ngon-ngu-noi-bo.ts';
import type { TenBieuTuong } from './kho/bieu-tuong.ts';

/** Bốn vai CRM (0001). Vai kho không thấy dữ liệu CRM (0018). */
export const VAI_CRM = ['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing'] as const;
/** Vai vào được kho (0017 / 0018) — khớp quyền 'xem' của QUYEN_KHO. */
export const VAI_VAO_KHO = ['chu_so_huu', 'quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan'] as const;

export type MaNhomNoiBo = 'khach' | 'website' | 'nha_hang';

export interface MucNoiBo {
  ma: string;
  /** Tên đầy đủ — trang Tất cả chức năng, menu bên kho. */
  ten: HaiThuTieng;
  /** Tên trên thanh menu (≤ 10 ký tự ở CẢ HAI thứ tiếng — thanh đáy 360px chia 5). */
  ngan: HaiThuTieng;
  link: string;
  vai: readonly string[];
  bieuTuong: TenBieuTuong;
  /** Nhóm trên trang Tất cả chức năng. null = không liệt kê ở đó (Kho: trang đó liệt kê từng mục kho). */
  nhom: MaNhomNoiBo | null;
  /** Chữ người dùng hay gõ khi tìm mà không nằm trong tên (cả hai thứ tiếng). */
  tuKhoa?: HaiThuTieng;
}

export const NHOM_NOI_BO: readonly { ma: MaNhomNoiBo; ten: HaiThuTieng }[] = [
  { ma: 'khach',    ten: { vi: 'Khách hàng',           en: 'Guests' } },
  { ma: 'website',  ten: { vi: 'Website và tuyển dụng', en: 'Website and hiring' } },
  { ma: 'nha_hang', ten: { vi: 'Nhà hàng',             en: 'Restaurant' } },
];

// Thứ tự = thứ tự trên thanh trên (máy tính) và trên trang Tất cả chức năng.
export const MUC_NOI_BO: readonly MucNoiBo[] = [
  { ma: 'tong_quan', link: '/noi-bo',
    ten: { vi: 'Tổng quan nhà hàng', en: 'Restaurant overview' }, ngan: { vi: 'Tổng quan', en: 'Overview' },
    vai: VAI_CRM, bieuTuong: 'nha', nhom: 'nha_hang',
    tuKhoa: { vi: 'hôm nay sức khỏe hệ thống khai trương', en: 'today system health opening' } },
  { ma: 'dat_ban', link: '/noi-bo/dat-ban',
    ten: { vi: 'Đặt bàn', en: 'Bookings' }, ngan: { vi: 'Đặt bàn', en: 'Bookings' },
    vai: VAI_CRM, bieuTuong: 'lich', nhom: 'khach',
    tuKhoa: { vi: 'giữ bàn khách gọi lại xác nhận', en: 'reservation table guest call back confirm' } },
  { ma: 'zalo', link: '/noi-bo/zalo',
    ten: { vi: 'Tin Zalo', en: 'Zalo messages' }, ngan: { vi: 'Zalo', en: 'Zalo' },
    vai: ['chu_so_huu', 'quan_ly', 'marketing'], bieuTuong: 'tin_nhan', nhom: 'khach',
    tuKhoa: { vi: 'nhắn tin chiến dịch khách hàng', en: 'campaign text message guests' } },
  { ma: 'messenger', link: '/noi-bo/messenger',
    ten: { vi: 'Bot Messenger', en: 'Messenger bot' }, ngan: { vi: 'Messenger', en: 'Messenger' },
    vai: ['chu_so_huu', 'quan_ly'], bieuTuong: 'tin_nhan', nhom: 'khach',
    tuKhoa: { vi: 'facebook fanpage trả lời tự động', en: 'facebook page auto reply' } },
  { ma: 'noi_dung', link: '/noi-bo/noi-dung',
    ten: { vi: 'Nội dung website', en: 'Website content' }, ngan: { vi: 'Nội dung', en: 'Content' },
    vai: ['chu_so_huu', 'quan_ly', 'marketing'], bieuTuong: 'trang_web', nhom: 'website',
    tuKhoa: { vi: 'công bố địa chỉ hotline giờ mở cửa trang web', en: 'publish address hotline opening hours site' } },
  { ma: 'tuyen_dung', link: '/noi-bo/tuyen-dung',
    ten: { vi: 'Hồ sơ ứng tuyển', en: 'Job applications' }, ngan: { vi: 'Tuyển dụng', en: 'Hiring' },
    vai: ['chu_so_huu', 'quan_ly'], bieuTuong: 'nguoi', nhom: 'website',
    tuKhoa: { vi: 'tuyển dụng ứng viên CV', en: 'hiring candidate CV' } },
  { ma: 'tin_tuyen_dung', link: '/noi-bo/tin-tuyen-dung',
    ten: { vi: 'Tin tuyển dụng', en: 'Job postings' }, ngan: { vi: 'Tin tuyển', en: 'Postings' },
    vai: VAI_CRM, bieuTuong: 'viec', nhom: 'website',
    tuKhoa: { vi: 'đăng tin vị trí lương', en: 'post vacancy position salary' } },
  { ma: 'kho', link: '/noi-bo/kho',
    ten: { vi: 'Kho', en: 'Inventory' }, ngan: { vi: 'Kho', en: 'Stock' },
    vai: VAI_VAO_KHO, bieuTuong: 'ton', nhom: null },
  { ma: 'cai_dat', link: '/noi-bo/cai-dat',
    ten: { vi: 'Cài đặt nhà hàng', en: 'Restaurant settings' }, ngan: { vi: 'Cài đặt', en: 'Settings' },
    vai: ['chu_so_huu', 'quan_ly'], bieuTuong: 'cai_dat', nhom: 'nha_hang',
    tuKhoa: { vi: 'chi nhánh bàn ăn giờ phục vụ dọn dữ liệu', en: 'branch tables opening hours data clean-up' } },
];

/** Trang Tất cả chức năng của phần nhà hàng (kho có trang riêng: /noi-bo/kho/khac). */
export const DUONG_TAT_CA_NOI_BO = '/noi-bo/chuc-nang';

/** Nút cuối thanh đáy khi một vai có quá 5 mục. */
export const MUC_THEM: MucNoiBo = {
  ma: 'them', link: DUONG_TAT_CA_NOI_BO,
  ten: { vi: 'Tất cả chức năng', en: 'All features' }, ngan: { vi: 'Thêm', en: 'More' },
  vai: VAI_CRM, bieuTuong: 'khac', nhom: null,
};

/** Bốn nút hay dùng nhất trên thanh đáy, khi vai có quá 5 mục. Vai không có ở đây: 4 mục đầu. */
const UU_TIEN_DAY: Record<string, string[]> = {
  chu_so_huu: ['tong_quan', 'dat_ban', 'kho', 'zalo'],
  quan_ly:    ['tong_quan', 'dat_ban', 'kho', 'zalo'],
};

export const SO_NUT_DAY = 5;

/** Các mục vai này được thấy, theo thứ tự của MUC_NOI_BO. */
export function mucNoiBoCuaVai(vai: string | null | undefined): MucNoiBo[] {
  if (!vai) return [];
  return MUC_NOI_BO.filter(m => m.vai.includes(vai));
}

/**
 * Có cần trang Tất cả chức năng không: khi menu không hiện hết được những gì vai này
 * làm được — quá 5 mục, hoặc vai vào được kho (trang đó liệt kê từng màn kho). Chỉ bốn
 * vai CRM: vai chỉ-kho dùng trang Khác của kho, mở /noi-bo/chuc-nang cũng bị chuyển sang đó.
 */
export function canTrangTatCa(vai: string | null | undefined): boolean {
  if (!vai || !MUC_THEM.vai.includes(vai)) return false;
  const ds = mucNoiBoCuaVai(vai);
  return ds.length > SO_NUT_DAY || ds.some(m => m.ma === 'kho');
}

/** Thanh trên (máy tính, tablet): mọi mục, cộng "Tất cả chức năng" khi cần. */
export function thanhTrenNoiBo(vai: string | null | undefined): MucNoiBo[] {
  const ds = mucNoiBoCuaVai(vai);
  return canTrangTatCa(vai) ? [...ds, MUC_THEM] : ds;
}

/** Thanh đáy điện thoại: đủ mục nếu vừa 5 nút; không thì 4 mục hay dùng + "Thêm". */
export function thanhDayNoiBo(vai: string | null | undefined): MucNoiBo[] {
  const ds = mucNoiBoCuaVai(vai);
  if (!canTrangTatCa(vai)) return ds;
  const uuTien = (UU_TIEN_DAY[vai ?? ''] ?? [])
    .map(ma => ds.find(m => m.ma === ma))
    .filter((m): m is MucNoiBo => !!m);
  const chon = [...uuTien, ...ds.filter(m => !uuTien.includes(m))].slice(0, SO_NUT_DAY - 1);
  return [...chon, MUC_THEM];
}

/**
 * Trang không có (pages/404.astro) hiện bản nào: bản NỘI BỘ (khung NoiBo.astro, tiếng của
 * nhân viên, link về /noi-bo) hay bản công khai.
 *
 * Bản nội bộ chỉ khi đã đăng nhập VÀ đường dẫn là /noi-bo hoặc /noi-bo/… Người chưa đăng
 * nhập bị middleware.ts chuyển sang /noi-bo/dang-nhap TRƯỚC khi trang 404 chạy, nên không
 * bao giờ thấy bản nội bộ — và không đoán được trang nội bộ nào có.
 *
 * Hẹp hơn vùng middleware canh (mọi đường dẫn bắt đầu bằng '/noi-bo', kể cả /noi-bo-abc):
 * cookie ngôn ngữ nb_ngon_ngu có path /noi-bo, trình duyệt không gửi nó tới /noi-bo-abc —
 * bản nội bộ ở đó sẽ kẹt ở tiếng Việt và nút English không có tác dụng. Ở đó hiện bản công
 * khai (crm/test/test-noi-bo-khong-co.mjs).
 */
export function loaiTrangKhongCo(duongDan: string, daDangNhap: boolean): 'noi-bo' | 'cong-khai' {
  const trongKhuNoiBo = duongDan === '/noi-bo' || duongDan.startsWith('/noi-bo/');
  return daDangNhap && trongKhuNoiBo ? 'noi-bo' : 'cong-khai';
}

/** Đường dẫn hiện tại có thuộc mục này không (Tổng quan chỉ sáng ở đúng /noi-bo). */
export function dangONoiBo(muc: { link: string }, duong: string): boolean {
  const d = duong.replace(/\/$/, '') || '/noi-bo';
  if (muc.link === '/noi-bo') return d === '/noi-bo';
  return d === muc.link || d.startsWith(muc.link + '/');
}
