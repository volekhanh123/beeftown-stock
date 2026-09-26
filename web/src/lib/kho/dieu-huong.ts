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

import { duoc, type ViecKho, type HaiThuTieng } from './chung.ts';
import type { TenBieuTuong } from './bieu-tuong.ts';

/** Kết quả kho_dem_viec (0030): số đếm theo khóa; khóa không có quyền thì vắng mặt. */
export type SoViec = Record<string, number | boolean | string | null | undefined>;

export interface MucKho {
  ma: string;
  /** Tên hai thứ tiếng (lib/ngon-ngu-noi-bo.ts) — trang đọc m.ten[nn]. */
  ten: HaiThuTieng;
  /** Tên ngắn cho thanh đáy (≤ 9 ký tự ở CẢ HAI thứ tiếng). */
  ngan?: HaiThuTieng;
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
// 0040: + phiếu trả hàng thủ kho đã ghi kg, chờ kế toán xác nhận tiền.
export const KHOA_CONG_NO = ['cong_no_qua_han', 'chua_doi_chieu', 'tra_hang_cho_tien'];

export const MUC_KHO: MucKho[] = [
  { ma: 'trang_chu', ten: { vi: 'Trang chủ', en: 'Home' }, link: '/noi-bo/kho', bieuTuong: 'nha', quyen: ['xem'] },
  { ma: 'viec', ten: { vi: 'Việc cần làm', en: 'To-do' }, ngan: { vi: 'Việc', en: 'To-do' }, link: '/noi-bo/kho/viec', bieuTuong: 'viec',
    quyen: ['nhap', 'van_hanh', 'pha_loc'], dem: KHOA_VIEC_TAY },
  // Kế toán vào Duyệt bằng duyet_nhap (0031) — chỉ thấy phiếu nhập.
  { ma: 'duyet', ten: { vi: 'Duyệt', en: 'Approvals' }, link: '/noi-bo/kho/duyet', bieuTuong: 'duyet', quyen: ['duyet', 'duyet_nhap'],
    dem: KHOA_DUYET },
  { ma: 'quet', ten: { vi: 'Quét nhãn', en: 'Scan label' }, ngan: { vi: 'Quét', en: 'Scan' }, link: '/noi-bo/kho/quet', bieuTuong: 'quet', quyen: ['xem'] },
  { ma: 'ton', ten: { vi: 'Tồn kho', en: 'Stock on hand' }, ngan: { vi: 'Tồn kho', en: 'Stock' }, link: '/noi-bo/kho/ton', bieuTuong: 'ton', quyen: ['xem'], dem: ['het_han'],
    khop: ['/noi-bo/kho/the-kho'] },
  // Nhận hàng: màn chỉ kg của người nhận hàng (thủ kho). Số đỏ = phiếu của
  // chính mình còn nháp hoặc bị trả về.
  { ma: 'nhan_hang', ten: { vi: 'Nhận hàng', en: 'Receive goods' }, link: '/noi-bo/kho/nhan-hang', bieuTuong: 'nhap', quyen: ['nhap'],
    dem: ['nhap_nhap', 'nhap_bi_tra'] },
  // Nhập hàng: phiếu có tiền — điền giá, duyệt, xem lại (vai xem giá).
  { ma: 'nhap', ten: { vi: 'Nhập hàng', en: 'Goods receipts' }, ngan: { vi: 'Nhập hàng', en: 'Receipts' }, link: '/noi-bo/kho/nhap', bieuTuong: 'nhap', quyen: ['xem_gia'] },
  // GĐ8a (0039): đơn đặt hàng nhà cung cấp — quản lý / chủ lập và gửi, thủ kho lập
  // nháp chỉ kg (quyền nhap). Số đỏ: đơn đã gửi quá ngày giao mà chưa thấy hàng
  // (don_dat_tre — chỉ quản lý, chủ nhận). Kế toán xem đơn qua link (trang cho xem_gia).
  { ma: 'dat_hang', ten: { vi: 'Đặt hàng', en: 'Purchase orders' }, link: '/noi-bo/kho/dat-hang', bieuTuong: 'dat_hang', quyen: ['nhap'],
    dem: ['don_dat_tre'] },
  { ma: 'pha_loc', ten: { vi: 'Pha lóc', en: 'Butchery' }, link: '/noi-bo/kho/pha-loc', bieuTuong: 'dao', quyen: ['xem_gia', 'pha_loc'],
    dem: ['pha_nhap', 'thu_hoi_thap'] },   // 0033: quản lý thấy phiên thu hồi thấp chưa xem
  // Quầy yêu cầu → thủ kho mang ra → quầy bấm nhận (0032). Số đỏ: thủ kho thấy
  // yêu cầu đang chờ, NV quầy thấy hàng đang mang ra chờ bấm nhận.
  { ma: 'yeu_cau_quay', ten: { vi: 'Quầy cần hàng', en: 'Counter requests' }, link: '/noi-bo/kho/quay/yeu-cau', bieuTuong: 'chuyen',
    quyen: ['van_hanh'], dem: ['yeu_cau_quay'] },
  { ma: 'nhan_quay', ten: { vi: 'Nhận hàng ra quầy', en: 'Counter receiving' }, link: '/noi-bo/kho/quay/nhan', bieuTuong: 'quay',
    quyen: ['van_hanh'], dem: ['hang_dang_chuyen'] },
  // Số đỏ thêm: phiếu chuyển quầy nhận thiếu, chờ quản lý xử lý (0032).
  { ma: 'xuat', ten: { vi: 'Chuyển · Xuất · Hủy', en: 'Transfer · Issue · Write-off' }, ngan: { vi: 'Xuất', en: 'Issue' }, link: '/noi-bo/kho/xuat', bieuTuong: 'chuyen',
    quyen: ['xem'], dem: ['huy_bi_tra', 'chuyen_nhan_thieu'] },
  { ma: 'kiem_ke', ten: { vi: 'Kiểm kê', en: 'Stocktake' }, link: '/noi-bo/kho/kiem-ke', bieuTuong: 'kiem_ke', quyen: ['xem'],
    dem: ['kiem_ke_tra_ve', 'quay_chua_dem'] },
  { ma: 'cong_no', ten: { vi: 'Công nợ', en: 'Payables' }, link: '/noi-bo/kho/cong-no', bieuTuong: 'cong_no', quyen: ['ke_toan'],
    dem: KHOA_CONG_NO },
  { ma: 'bao_cao', ten: { vi: 'Báo cáo', en: 'Reports' }, link: '/noi-bo/kho/bao-cao', bieuTuong: 'bao_cao', quyen: ['xem_gia'] },
  // GĐ7a (0037): dòng bán iPOS chưa trừ được kho — chưa ghép món, thiếu hàng trên sổ.
  { ma: 'ban_ipos', ten: { vi: 'Bán hàng iPOS', en: 'iPOS sales' }, link: '/noi-bo/kho/ban-ipos', bieuTuong: 'quay', quyen: ['duyet'],
    dem: ['ipos_cho_xu_ly'] },
  // GĐ7b (0038): định lượng món (danh_muc) và đối chiếu định mức bếp. Báo cáo mở
  // cho mọi vai xem kho, nhưng ô menu chỉ cho quản lý / chủ — người nhận cảnh
  // báo dinh_muc_lech (số đỏ). Thủ kho / NV quầy mở trang (chỉ kg) khi được gửi link.
  { ma: 'dinh_luong', ten: { vi: 'Định lượng món', en: 'Dish recipes' }, link: '/noi-bo/kho/cai-dat/dinh-luong', bieuTuong: 'bep',
    quyen: ['danh_muc'] },
  { ma: 'dinh_muc', ten: { vi: 'Định mức bếp', en: 'Kitchen usage' }, link: '/noi-bo/kho/bao-cao/dinh-muc', bieuTuong: 'bao_cao',
    quyen: ['duyet'], dem: ['dinh_muc_lech'] },
  { ma: 'quy_trinh', ten: { vi: 'Quy trình', en: 'Workflows' }, link: '/noi-bo/kho/quy-trinh', bieuTuong: 'quy_trinh', quyen: ['xem'] },
  // GĐ5e: màn Cài đặt thành "Thiết lập" có tiến độ từng bước (0035). Không số
  // đỏ — số bước còn lại hiện ngay trên màn, kho_dem_viec không đếm nó.
  { ma: 'cai_dat', ten: { vi: 'Thiết lập', en: 'Setup' }, link: '/noi-bo/kho/cai-dat', bieuTuong: 'cai_dat',
    quyen: ['danh_muc', 'ncc', 'cai_dat_goc'] },
  { ma: 'huong_dan', ten: { vi: 'Hướng dẫn', en: 'Help' }, link: '/noi-bo/kho/huong-dan', bieuTuong: 'huong_dan', quyen: ['xem'] },
  // GĐ8c: bảng "vai nào làm được việc gì" bằng lời — mọi vai xem kho mở được.
  { ma: 'quyen', ten: { vi: 'Ai làm được gì', en: 'Who can do what' }, link: '/noi-bo/kho/cai-dat/quyen', bieuTuong: 'nguoi', quyen: ['xem'] },
];

// Hai mục chỉ có trên thanh đáy.
const MUC_QUAY: MucKho = {
  ma: 'hang_quay', ten: { vi: 'Hàng ở quầy', en: 'Counter stock' }, ngan: { vi: 'Ở quầy', en: 'Stock' }, link: '/noi-bo/kho/ton?vi_tri=quay', bieuTuong: 'quay',
  quyen: ['xem'],
};
const MUC_KHAC: MucKho = {
  ma: 'khac', ten: { vi: 'Khác', en: 'More' }, link: '/noi-bo/kho/khac', bieuTuong: 'khac', quyen: ['xem'],
};

const theoMa = (ma: string): MucKho => {
  const m = MUC_KHO.find(x => x.ma === ma);
  if (!m) throw new Error(`Unknown inventory menu item "${ma}"`);
  return m;
};

/** Thanh đáy của từng vai — đúng 5 nút. Kế toán: Duyệt (điền giá phiếu nhập) đứng thứ hai. */
export const THANH_DAY: Record<string, MucKho[]> = {
  thu_kho:        [{ ...theoMa('trang_chu') }, theoMa('viec'), theoMa('quet'), theoMa('ton'), MUC_KHAC],
  // Nút Quầy có số đỏ khi hàng đang mang ra — trang chủ quầy có thẻ "bấm nhận".
  nhan_vien_quay: [{ ...theoMa('trang_chu'), ten: { vi: 'Quầy', en: 'Counter' }, bieuTuong: 'quay', dem: ['hang_dang_chuyen'] },
                   theoMa('viec'), theoMa('quet'),
                   MUC_QUAY, MUC_KHAC],
  quan_ly:        [{ ...theoMa('trang_chu'), ten: { vi: 'Hôm nay', en: 'Today' } }, theoMa('duyet'), theoMa('quet'), theoMa('ton'), MUC_KHAC],
  chu_so_huu:     [{ ...theoMa('trang_chu'), ten: { vi: 'Hôm nay', en: 'Today' } }, theoMa('duyet'), theoMa('quet'), theoMa('ton'), MUC_KHAC],
  ke_toan:        [theoMa('trang_chu'), theoMa('duyet'), theoMa('cong_no'), theoMa('nhap'), MUC_KHAC],
};

export interface ThaoTac { ten: HaiThuTieng; link: string; bieuTuong: TenBieuTuong; quyen: ViecKho[] }

/** "Thao tác nhanh" — nút tròn trên trang chủ và danh sách dưới cột trái. */
export const THAO_TAC_NHANH: Record<string, ThaoTac[]> = {
  thu_kho: [
    { ten: { vi: 'Nhận hàng', en: 'Receive goods' }, link: '/noi-bo/kho/nhan-hang/moi', bieuTuong: 'nhap', quyen: ['nhap'] },
    { ten: { vi: 'Pha lóc', en: 'Butchery' }, link: '/noi-bo/kho/pha-loc/moi', bieuTuong: 'dao', quyen: ['pha_loc'] },
    { ten: { vi: 'Quầy cần hàng', en: 'Counter requests' }, link: '/noi-bo/kho/quay/yeu-cau', bieuTuong: 'chuyen', quyen: ['van_hanh'] },
    { ten: { vi: 'Báo hủy', en: 'Report write-off' }, link: '/noi-bo/kho/xuat/moi?loai=huy', bieuTuong: 'huy', quyen: ['van_hanh'] },
    { ten: { vi: 'Kiểm kê', en: 'Stocktake' }, link: '/noi-bo/kho/kiem-ke', bieuTuong: 'kiem_ke', quyen: ['van_hanh'] },
    // GĐ8b (0040): trả hàng NCC hai bước — thủ kho chỉ ghi kg.
    { ten: { vi: 'Trả hàng NCC', en: 'Return to supplier' }, link: '/noi-bo/kho/cong-no/tra-hang', bieuTuong: 'chuyen', quyen: ['nhap'] },
  ],
  nhan_vien_quay: [
    { ten: { vi: 'Yêu cầu hàng', en: 'Request stock' }, link: '/noi-bo/kho/quay/yeu-cau', bieuTuong: 'chuyen', quyen: ['van_hanh'] },
    { ten: { vi: 'Nhận hàng ra quầy', en: 'Counter receiving' }, link: '/noi-bo/kho/quay/nhan', bieuTuong: 'quay', quyen: ['van_hanh'] },
    { ten: { vi: 'Tự lấy hàng', en: 'Take stock myself' }, link: '/noi-bo/kho/xuat/moi?loai=chuyen', bieuTuong: 'chuyen', quyen: ['van_hanh'] },
    { ten: { vi: 'Đưa bếp', en: 'Send to kitchen' }, link: '/noi-bo/kho/xuat/moi?loai=xuat_bep', bieuTuong: 'bep', quyen: ['van_hanh'] },
    { ten: { vi: 'Báo hàng hỏng', en: 'Report damaged goods' }, link: '/noi-bo/kho/xuat/moi?loai=huy', bieuTuong: 'huy', quyen: ['van_hanh'] },
    { ten: { vi: 'Đếm quầy', en: 'Counter count' }, link: '/noi-bo/kho/quay/dem', bieuTuong: 'kiem_ke', quyen: ['van_hanh'] },
  ],
  quan_ly: [
    { ten: { vi: 'Duyệt', en: 'Approvals' }, link: '/noi-bo/kho/duyet', bieuTuong: 'duyet', quyen: ['duyet', 'duyet_nhap'] },
    { ten: { vi: 'Đặt hàng', en: 'New purchase order' }, link: '/noi-bo/kho/dat-hang/moi', bieuTuong: 'dat_hang', quyen: ['nhap'] },
    { ten: { vi: 'Kiểm kê', en: 'Stocktake' }, link: '/noi-bo/kho/kiem-ke', bieuTuong: 'kiem_ke', quyen: ['xem'] },
    { ten: { vi: 'Tồn kho', en: 'Stock on hand' }, link: '/noi-bo/kho/ton', bieuTuong: 'ton', quyen: ['xem'] },
    { ten: { vi: 'Báo cáo', en: 'Reports' }, link: '/noi-bo/kho/bao-cao', bieuTuong: 'bao_cao', quyen: ['xem_gia'] },
  ],
  ke_toan: [
    { ten: { vi: 'Duyệt phiếu nhập', en: 'Approve goods receipts' }, link: '/noi-bo/kho/duyet', bieuTuong: 'duyet', quyen: ['duyet_nhap'] },
    { ten: { vi: 'Đối chiếu hóa đơn', en: 'Reconcile invoices' }, link: '/noi-bo/kho/cong-no?loc=chua_doi_chieu', bieuTuong: 'viec', quyen: ['ke_toan'] },
    { ten: { vi: 'Ghi thanh toán', en: 'Record payment' }, link: '/noi-bo/kho/cong-no', bieuTuong: 'cong_no', quyen: ['ke_toan'] },
    { ten: { vi: 'Tải công nợ (Excel)', en: 'Download payables (Excel)' }, link: '/noi-bo/kho/bao-cao/cong-no.csv', bieuTuong: 'bao_cao', quyen: ['ke_toan'] },
    { ten: { vi: 'Xuất sang MISA', en: 'Export to MISA' }, link: '/noi-bo/kho/cong-no/misa', bieuTuong: 'bao_cao', quyen: ['ke_toan'] },
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
export const MUC_CRM: { link: string; ten: HaiThuTieng; vai: string[]; bieuTuong: TenBieuTuong }[] = [
  { link: '/noi-bo', ten: { vi: 'Tổng quan nhà hàng', en: 'Restaurant overview' }, vai: VAI_CRM, bieuTuong: 'nha' },
  { link: '/noi-bo/dat-ban', ten: { vi: 'Đặt bàn', en: 'Bookings' }, vai: VAI_CRM, bieuTuong: 'lich' },
  { link: '/noi-bo/noi-dung', ten: { vi: 'Nội dung website', en: 'Website content' }, vai: ['chu_so_huu', 'quan_ly', 'marketing'], bieuTuong: 'viec' },
  { link: '/noi-bo/tuyen-dung', ten: { vi: 'Tuyển dụng', en: 'Hiring' }, vai: ['chu_so_huu', 'quan_ly'], bieuTuong: 'nguoi' },
  { link: '/noi-bo/cai-dat', ten: { vi: 'Cài đặt nhà hàng', en: 'Restaurant settings' }, vai: ['chu_so_huu', 'quan_ly'], bieuTuong: 'cai_dat' },
];
