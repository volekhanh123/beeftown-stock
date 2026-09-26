/**
 * KHO — MENU THEO VAI
 *
 * Khung giống iPOS Inventory Pro:
 *   · máy tính (≥1024px): cột ô biểu tượng bên trái, số đỏ báo việc, dưới là
 *     "Thao tác nhanh";
 *   · điện thoại / tablet: thanh 5 nút dưới đáy, nút giữa là QUÉT.
 *
 * Mỗi vai một thanh đáy riêng — thủ kho, NV quầy, quản lý, kế toán làm những
 * việc khác nhau, nên thứ nằm dưới ngón cái của họ cũng khác nhau.
 *
 * File thuần (không import lúc chạy trừ chung.ts), để test kiểm: mọi link trỏ
 * tới một trang có thật, thanh đáy không quá 5 nút, NV quầy và thủ kho không
 * có ô nào chỉ-xem-giá (0031: thủ kho không thấy tiền — nhận hàng ở ô "Nhận
 * hàng", chỉ kg; ô "Nhập hàng" có tiền là của kế toán, quản lý, chủ).
 *
 * Quyền ở đây chỉ để ẩn/hiện. Mỗi mục ghi đúng quyền mà TRANG ĐÓ kiểm ở đầu
 * file — lệch nhau thì người dùng bấm vào một ô rồi bị đẩy ra, rất khó chịu.
 */

import { duoc, type ViecKho } from './chung.ts';
import type { TenBieuTuong } from './bieu-tuong.ts';

/** Kết quả kho_dem_viec (0030): số đếm theo khóa; khóa không có quyền thì vắng mặt. */
export type SoViec = Record<string, number | boolean | string | null | undefined>;

export interface MucKho {
  ma: string;
  ten: string;
  /** Tên ngắn cho thanh đáy (≤ 9 ký tự). */
  ngan?: string;
  link: string;
  bieuTuong: TenBieuTuong;
  /** Cần MỘT trong các quyền này (khớp với dòng kiểm quyền đầu trang). */
  quyen: ViecKho[];
  /** Các khóa kho_dem_viec cộng lại thành số đỏ. */
  dem?: string[];
  /** Tiền tố đường dẫn khác cũng tính là "đang ở mục này". */
  khop?: string[];
}

// Các khóa "việc của chính mình / việc tay chân" — gom thành số đỏ của mục Việc.
// 0032: yêu cầu của quầy (thủ kho mang ra), hàng đang mang ra (quầy bấm nhận).
export const KHOA_VIEC_TAY = [
  'nhap_bi_tra', 'huy_bi_tra', 'kiem_ke_tra_ve', 'het_han', 'quay_duoi_muc', 'quay_chua_dem',
  'yeu_cau_quay', 'hang_dang_chuyen',
];
export const KHOA_DUYET = ['duyet_nhap', 'duyet_huy', 'duyet_kiem_ke'];
export const KHOA_CONG_NO = ['cong_no_qua_han', 'chua_doi_chieu'];

export const MUC_KHO: MucKho[] = [
  { ma: 'trang_chu', ten: 'Trang chủ', link: '/noi-bo/kho', bieuTuong: 'nha', quyen: ['xem'] },
  { ma: 'viec', ten: 'Việc cần làm', ngan: 'Việc', link: '/noi-bo/kho/viec', bieuTuong: 'viec',
    quyen: ['nhap', 'van_hanh', 'pha_loc'], dem: KHOA_VIEC_TAY },
  // Kế toán vào Duyệt bằng duyet_nhap (0031) — chỉ thấy phiếu nhập.
  { ma: 'duyet', ten: 'Duyệt', link: '/noi-bo/kho/duyet', bieuTuong: 'duyet', quyen: ['duyet', 'duyet_nhap'],
    dem: KHOA_DUYET },
  { ma: 'quet', ten: 'Quét nhãn', ngan: 'Quét', link: '/noi-bo/kho/quet', bieuTuong: 'quet', quyen: ['xem'] },
  { ma: 'ton', ten: 'Tồn kho', link: '/noi-bo/kho/ton', bieuTuong: 'ton', quyen: ['xem'], dem: ['het_han'],
    khop: ['/noi-bo/kho/the-kho'] },
  // Nhận hàng: màn chỉ kg của người nhận hàng (thủ kho). Số đỏ = phiếu của
  // chính mình còn nháp hoặc bị trả về.
  { ma: 'nhan_hang', ten: 'Nhận hàng', link: '/noi-bo/kho/nhan-hang', bieuTuong: 'nhap', quyen: ['nhap'],
    dem: ['nhap_nhap', 'nhap_bi_tra'] },
  // Nhập hàng: phiếu có tiền — điền giá, duyệt, xem lại (vai xem giá).
  { ma: 'nhap', ten: 'Nhập hàng', link: '/noi-bo/kho/nhap', bieuTuong: 'nhap', quyen: ['xem_gia'] },
  { ma: 'pha_loc', ten: 'Pha lóc', link: '/noi-bo/kho/pha-loc', bieuTuong: 'dao', quyen: ['xem_gia', 'pha_loc'],
    dem: ['pha_nhap', 'thu_hoi_thap'] },   // 0033: quản lý thấy phiên thu hồi thấp chưa xem
  // Quầy yêu cầu → thủ kho mang ra → quầy bấm nhận (0032). Số đỏ: thủ kho thấy
  // yêu cầu đang chờ, NV quầy thấy hàng đang mang ra chờ bấm nhận.
  { ma: 'yeu_cau_quay', ten: 'Quầy cần hàng', link: '/noi-bo/kho/quay/yeu-cau', bieuTuong: 'chuyen',
    quyen: ['van_hanh'], dem: ['yeu_cau_quay'] },
  { ma: 'nhan_quay', ten: 'Nhận hàng ra quầy', link: '/noi-bo/kho/quay/nhan', bieuTuong: 'quay',
    quyen: ['van_hanh'], dem: ['hang_dang_chuyen'] },
  // Số đỏ thêm: phiếu chuyển quầy nhận thiếu, chờ quản lý xử lý (0032).
  { ma: 'xuat', ten: 'Chuyển · Xuất · Hủy', ngan: 'Xuất', link: '/noi-bo/kho/xuat', bieuTuong: 'chuyen',
    quyen: ['xem'], dem: ['huy_bi_tra', 'chuyen_nhan_thieu'] },
  { ma: 'kiem_ke', ten: 'Kiểm kê', link: '/noi-bo/kho/kiem-ke', bieuTuong: 'kiem_ke', quyen: ['xem'],
    dem: ['kiem_ke_tra_ve', 'quay_chua_dem'] },
  { ma: 'cong_no', ten: 'Công nợ', link: '/noi-bo/kho/cong-no', bieuTuong: 'cong_no', quyen: ['ke_toan'],
    dem: KHOA_CONG_NO },
  { ma: 'bao_cao', ten: 'Báo cáo', link: '/noi-bo/kho/bao-cao', bieuTuong: 'bao_cao', quyen: ['xem_gia'] },
  // GĐ7a (0037): dòng bán iPOS chưa trừ được kho — chưa ghép món, thiếu hàng trên sổ.
  { ma: 'ban_ipos', ten: 'Bán hàng iPOS', link: '/noi-bo/kho/ban-ipos', bieuTuong: 'quay', quyen: ['duyet'],
    dem: ['ipos_cho_xu_ly'] },
  // GĐ7b (0038): định lượng món (danh_muc) và đối chiếu định mức bếp. Báo cáo mở
  // cho mọi vai xem kho, nhưng ô menu chỉ cho quản lý / chủ — người nhận cảnh
  // báo dinh_muc_lech (số đỏ). Thủ kho / NV quầy mở trang (chỉ kg) khi được gửi link.
  { ma: 'dinh_luong', ten: 'Định lượng món', link: '/noi-bo/kho/cai-dat/dinh-luong', bieuTuong: 'bep',
    quyen: ['danh_muc'] },
  { ma: 'dinh_muc', ten: 'Định mức bếp', link: '/noi-bo/kho/bao-cao/dinh-muc', bieuTuong: 'bao_cao',
    quyen: ['duyet'], dem: ['dinh_muc_lech'] },
  { ma: 'quy_trinh', ten: 'Quy trình', link: '/noi-bo/kho/quy-trinh', bieuTuong: 'quy_trinh', quyen: ['xem'] },
  // GĐ5e: màn Cài đặt thành "Thiết lập" có tiến độ từng bước (0035). Không số
  // đỏ — số bước còn lại hiện ngay trên màn, kho_dem_viec không đếm nó.
  { ma: 'cai_dat', ten: 'Thiết lập', link: '/noi-bo/kho/cai-dat', bieuTuong: 'cai_dat',
    quyen: ['danh_muc', 'ncc', 'cai_dat_goc'] },
  { ma: 'huong_dan', ten: 'Hướng dẫn', link: '/noi-bo/kho/huong-dan', bieuTuong: 'huong_dan', quyen: ['xem'] },
];

// Hai mục chỉ có trên thanh đáy.
const MUC_QUAY: MucKho = {
  ma: 'hang_quay', ten: 'Hàng ở quầy', ngan: 'Ở quầy', link: '/noi-bo/kho/ton?vi_tri=quay', bieuTuong: 'quay',
  quyen: ['xem'],
};
const MUC_KHAC: MucKho = {
  ma: 'khac', ten: 'Khác', link: '/noi-bo/kho/khac', bieuTuong: 'khac', quyen: ['xem'],
};

const theoMa = (ma: string): MucKho => {
  const m = MUC_KHO.find(x => x.ma === ma);
  if (!m) throw new Error(`Không có mục menu kho "${ma}"`);
  return m;
};

/** Thanh đáy của từng vai — đúng 5 nút. Kế toán: Duyệt (điền giá phiếu nhập) đứng thứ hai. */
export const THANH_DAY: Record<string, MucKho[]> = {
  thu_kho:        [{ ...theoMa('trang_chu') }, theoMa('viec'), theoMa('quet'), theoMa('ton'), MUC_KHAC],
  // Nút Quầy có số đỏ khi hàng đang mang ra — trang chủ quầy có thẻ "bấm nhận".
  nhan_vien_quay: [{ ...theoMa('trang_chu'), ten: 'Quầy', bieuTuong: 'quay', dem: ['hang_dang_chuyen'] },
                   theoMa('viec'), theoMa('quet'),
                   MUC_QUAY, MUC_KHAC],
  quan_ly:        [{ ...theoMa('trang_chu'), ten: 'Hôm nay' }, theoMa('duyet'), theoMa('quet'), theoMa('ton'), MUC_KHAC],
  chu_so_huu:     [{ ...theoMa('trang_chu'), ten: 'Hôm nay' }, theoMa('duyet'), theoMa('quet'), theoMa('ton'), MUC_KHAC],
  ke_toan:        [theoMa('trang_chu'), theoMa('duyet'), theoMa('cong_no'), theoMa('nhap'), MUC_KHAC],
};

export interface ThaoTac { ten: string; link: string; bieuTuong: TenBieuTuong; quyen: ViecKho[] }

/** "Thao tác nhanh" — nút tròn trên trang chủ và danh sách dưới cột trái. */
export const THAO_TAC_NHANH: Record<string, ThaoTac[]> = {
  thu_kho: [
    { ten: 'Nhận hàng', link: '/noi-bo/kho/nhan-hang/moi', bieuTuong: 'nhap', quyen: ['nhap'] },
    { ten: 'Pha lóc', link: '/noi-bo/kho/pha-loc/moi', bieuTuong: 'dao', quyen: ['pha_loc'] },
    { ten: 'Quầy cần hàng', link: '/noi-bo/kho/quay/yeu-cau', bieuTuong: 'chuyen', quyen: ['van_hanh'] },
    { ten: 'Báo hủy', link: '/noi-bo/kho/xuat/moi?loai=huy', bieuTuong: 'huy', quyen: ['van_hanh'] },
    { ten: 'Kiểm kê', link: '/noi-bo/kho/kiem-ke', bieuTuong: 'kiem_ke', quyen: ['van_hanh'] },
  ],
  nhan_vien_quay: [
    { ten: 'Yêu cầu hàng', link: '/noi-bo/kho/quay/yeu-cau', bieuTuong: 'chuyen', quyen: ['van_hanh'] },
    { ten: 'Nhận hàng ra quầy', link: '/noi-bo/kho/quay/nhan', bieuTuong: 'quay', quyen: ['van_hanh'] },
    { ten: 'Tự lấy hàng', link: '/noi-bo/kho/xuat/moi?loai=chuyen', bieuTuong: 'chuyen', quyen: ['van_hanh'] },
    { ten: 'Đưa bếp', link: '/noi-bo/kho/xuat/moi?loai=xuat_bep', bieuTuong: 'bep', quyen: ['van_hanh'] },
    { ten: 'Báo hàng hỏng', link: '/noi-bo/kho/xuat/moi?loai=huy', bieuTuong: 'huy', quyen: ['van_hanh'] },
    { ten: 'Đếm quầy', link: '/noi-bo/kho/quay/dem', bieuTuong: 'kiem_ke', quyen: ['van_hanh'] },
  ],
  quan_ly: [
    { ten: 'Duyệt', link: '/noi-bo/kho/duyet', bieuTuong: 'duyet', quyen: ['duyet', 'duyet_nhap'] },
    { ten: 'Kiểm kê', link: '/noi-bo/kho/kiem-ke', bieuTuong: 'kiem_ke', quyen: ['xem'] },
    { ten: 'Tồn kho', link: '/noi-bo/kho/ton', bieuTuong: 'ton', quyen: ['xem'] },
    { ten: 'Báo cáo', link: '/noi-bo/kho/bao-cao', bieuTuong: 'bao_cao', quyen: ['xem_gia'] },
  ],
  ke_toan: [
    { ten: 'Duyệt phiếu nhập', link: '/noi-bo/kho/duyet', bieuTuong: 'duyet', quyen: ['duyet_nhap'] },
    { ten: 'Đối chiếu hóa đơn', link: '/noi-bo/kho/cong-no?loc=chua_doi_chieu', bieuTuong: 'viec', quyen: ['ke_toan'] },
    { ten: 'Ghi thanh toán', link: '/noi-bo/kho/cong-no', bieuTuong: 'cong_no', quyen: ['ke_toan'] },
    { ten: 'Tải công nợ (Excel)', link: '/noi-bo/kho/bao-cao/cong-no.csv', bieuTuong: 'bao_cao', quyen: ['ke_toan'] },
  ],
};
THAO_TAC_NHANH.chu_so_huu = THAO_TAC_NHANH.quan_ly;

/** Các mục cột trái mà vai này được thấy. */
export function mucCuaVai(vai: string): MucKho[] {
  return MUC_KHO.filter(m => m.quyen.some(q => duoc(vai, q)));
}

/** Thanh đáy của vai này (vai lạ: chỉ Trang chủ + Khác). */
export function thanhDayCuaVai(vai: string): MucKho[] {
  const ds = THANH_DAY[vai] ?? [theoMa('trang_chu'), MUC_KHAC];
  return ds.filter(m => m.quyen.some(q => duoc(vai, q)));
}

export function thaoTacCuaVai(vai: string): ThaoTac[] {
  return (THAO_TAC_NHANH[vai] ?? []).filter(t => t.quyen.some(q => duoc(vai, q)));
}

/** Số đỏ của một mục: cộng các khóa đếm (khóa vắng mặt = 0). */
export function soDo(muc: { dem?: string[] }, viec: SoViec | null | undefined): number {
  if (!muc.dem || !viec) return 0;
  return muc.dem.reduce((s, k) => s + (typeof viec[k] === 'number' ? (viec[k] as number) : 0), 0);
}

/** Đường dẫn hiện tại có thuộc mục này không. */
export function dangO(muc: { link: string; khop?: string[] }, duong: string, timKiem = ''): boolean {
  const [goc, q] = muc.link.split('?');
  const d = duong.replace(/\/$/, '') || '/';
  if (q) return d === goc && timKiem.replace(/^\?/, '').split('&').includes(q);
  if (goc === '/noi-bo/kho') return d === goc;
  // Trang có ô menu riêng nằm dưới đường của ô khác (bao-cao/dinh-muc dưới
  // Báo cáo, cai-dat/dinh-luong dưới Thiết lập, GĐ7b): chỉ ô riêng sáng.
  const conRieng = MUC_KHO.some(m => {
    const l = m.link.split('?')[0];
    return !m.link.includes('?') && l.startsWith(goc + '/') && (d === l || d.startsWith(l + '/'));
  });
  if (conRieng) return false;
  return d === goc || d.startsWith(goc + '/') || (muc.khop ?? []).some(p => d === p || d.startsWith(p + '/'));
}

/** Hiện số đỏ: 0 thì không hiện, lớn quá thì "99+". */
export function nhanSo(n: number): string {
  return n > 99 ? '99+' : String(n);
}

// -----------------------------------------------------------------------------
// PHẦN CRM / WEBSITE — link trong menu người dùng cho quản lý, chủ nhà hàng
// -----------------------------------------------------------------------------
// Soi gương danh sách MUC trong layouts/NoiBo.astro (file dùng chung — kho
// không sửa file đó). Vai nào thấy mục nào phải khớp với bên đó.
const VAI_CRM = ['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing'];
export const MUC_CRM: { link: string; ten: string; vai: string[]; bieuTuong: TenBieuTuong }[] = [
  { link: '/noi-bo', ten: 'Tổng quan nhà hàng', vai: VAI_CRM, bieuTuong: 'nha' },
  { link: '/noi-bo/dat-ban', ten: 'Đặt bàn', vai: VAI_CRM, bieuTuong: 'lich' },
  { link: '/noi-bo/noi-dung', ten: 'Nội dung website', vai: ['chu_so_huu', 'quan_ly', 'marketing'], bieuTuong: 'viec' },
  { link: '/noi-bo/tuyen-dung', ten: 'Tuyển dụng', vai: ['chu_so_huu', 'quan_ly'], bieuTuong: 'nguoi' },
  { link: '/noi-bo/cai-dat', ten: 'Cài đặt nhà hàng', vai: ['chu_so_huu', 'quan_ly'], bieuTuong: 'cai_dat' },
];
