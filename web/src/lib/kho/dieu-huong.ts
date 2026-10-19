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
 * File thuần (lúc chạy chỉ import chung.ts và ../dieu-huong-noi-bo.ts, cũng thuần),
 * để test kiểm: mọi link trỏ tới một trang có thật, thanh đáy không quá 5 nút, NV quầy và thủ kho không
 * có ô nào chỉ-xem-giá (0031: thủ kho không thấy tiền — nhận hàng ở ô "Nhận
 * hàng", chỉ kg; ô "Nhập hàng" có tiền là của kế toán, quản lý, chủ).
 *
 * Quyền ở đây chỉ để ẩn/hiện. Mỗi mục ghi đúng quyền mà TRANG ĐÓ kiểm ở đầu
 * file — lệch nhau thì người dùng bấm vào một ô rồi bị đẩy ra, rất khó chịu.
 *
 * NHÓM (NHOM_KHO): chủ và quản lý thấy mọi mục (MUC_KHO). Xếp liền một dải thì tìm "Công nợ"
 * hay "Định lượng món" phải dò từng ô — trên laptop 1366×768, gần chục ô cuối nằm dưới mép
 * màn hình. Mỗi mục thuộc đúng một nhóm theo việc người ta đang làm; cột trái và
 * trang Khác in theo nhóm, trang Khác có thêm ô tìm (lib/ban-do-chuc-nang.ts).
 */

import { duoc, type ViecKho, type HaiThuTieng } from './chung.ts';
import type { TenBieuTuong } from './bieu-tuong.ts';
import { MUC_NOI_BO } from '../dieu-huong-noi-bo.ts';

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
  /** Nhóm trên cột trái và trang Khác. Hai mục chỉ-thanh-đáy (Ở quầy, Khác) không có nhóm. */
  nhom?: MaNhomKho;
}

export type MaNhomKho = 'hang_ngay' | 'ton_kho' | 'hang_vao' | 'che_bien' | 'tien_bao_cao' | 'thiet_lap';

/** Thứ tự nhóm = thứ tự in. Tên ngắn: cột trái máy tính rộng 15rem. */
export const NHOM_KHO: readonly { ma: MaNhomKho; ten: HaiThuTieng }[] = [
  { ma: 'hang_ngay',    ten: { vi: 'Hằng ngày',             en: 'Daily' } },
  { ma: 'ton_kho',      ten: { vi: 'Tồn kho',               en: 'Stock' } },
  { ma: 'hang_vao',     ten: { vi: 'Mua và nhận hàng',      en: 'Buying and receiving' } },
  { ma: 'che_bien',     ten: { vi: 'Pha lóc, quầy, xuất',   en: 'Butchery, counter, issues' } },
  { ma: 'tien_bao_cao', ten: { vi: 'Tiền và báo cáo',       en: 'Money and reports' } },
  { ma: 'thiet_lap',    ten: { vi: 'Thiết lập và trợ giúp', en: 'Setup and help' } },
];

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
  { ma: 'trang_chu', nhom: 'hang_ngay', ten: { vi: 'Trang chủ', en: 'Home' }, link: '/noi-bo/kho', bieuTuong: 'nha', quyen: ['xem'] },
  { ma: 'viec', nhom: 'hang_ngay', ten: { vi: 'Việc cần làm', en: 'To-do' }, ngan: { vi: 'Việc', en: 'To-do' }, link: '/noi-bo/kho/viec', bieuTuong: 'viec',
    quyen: ['nhap', 'van_hanh', 'pha_loc'], dem: KHOA_VIEC_TAY },
  // Kế toán vào Duyệt bằng duyet_nhap (0031) — chỉ thấy phiếu nhập.
  { ma: 'duyet', nhom: 'hang_ngay', ten: { vi: 'Duyệt', en: 'Approvals' }, link: '/noi-bo/kho/duyet', bieuTuong: 'duyet', quyen: ['duyet', 'duyet_nhap'],
    dem: KHOA_DUYET },
  { ma: 'quet', nhom: 'hang_ngay', ten: { vi: 'Quét nhãn', en: 'Scan label' }, ngan: { vi: 'Quét', en: 'Scan' }, link: '/noi-bo/kho/quet', bieuTuong: 'quet', quyen: ['xem'] },
  { ma: 'ton', nhom: 'ton_kho', ten: { vi: 'Tồn kho', en: 'Stock on hand' }, ngan: { vi: 'Tồn kho', en: 'Stock' }, link: '/noi-bo/kho/ton', bieuTuong: 'ton', quyen: ['xem'], dem: ['het_han'],
    khop: ['/noi-bo/kho/the-kho'] },
  // 0048: món theo dõi theo tảng — tảng đang ủ / sẵn sàng lóc.
  { ma: 'tang', nhom: 'ton_kho', ten: { vi: 'Tảng · ủ', en: 'Primals · aging' }, link: '/noi-bo/kho/tang', bieuTuong: 'ton', quyen: ['xem'] },
  // GĐ8a (0039): đơn đặt hàng nhà cung cấp — quản lý / chủ lập và gửi, thủ kho lập
  // nháp chỉ kg (quyền nhap). Số đỏ: đơn đã gửi quá ngày giao mà chưa thấy hàng
  // (don_dat_tre — chỉ quản lý, chủ nhận). Kế toán xem đơn qua link (trang cho xem_gia).
  { ma: 'dat_hang', nhom: 'hang_vao', ten: { vi: 'Đặt hàng', en: 'Purchase orders' }, link: '/noi-bo/kho/dat-hang', bieuTuong: 'dat_hang', quyen: ['nhap'],
    dem: ['don_dat_tre'] },
  // Nhận hàng: màn chỉ kg của người nhận hàng (thủ kho). Số đỏ = phiếu của
  // chính mình còn nháp hoặc bị trả về.
  { ma: 'nhan_hang', nhom: 'hang_vao', ten: { vi: 'Nhận hàng', en: 'Receive goods' }, link: '/noi-bo/kho/nhan-hang', bieuTuong: 'nhap', quyen: ['nhap'],
    dem: ['nhap_nhap', 'nhap_bi_tra'] },
  // Nhập hàng: phiếu có tiền — điền giá, duyệt, xem lại (vai xem giá).
  { ma: 'nhap', nhom: 'hang_vao', ten: { vi: 'Nhập hàng', en: 'Goods receipts' }, ngan: { vi: 'Nhập hàng', en: 'Receipts' }, link: '/noi-bo/kho/nhap', bieuTuong: 'nhap', quyen: ['xem_gia'] },
  { ma: 'pha_loc', nhom: 'che_bien', ten: { vi: 'Pha lóc', en: 'Butchery' }, link: '/noi-bo/kho/pha-loc', bieuTuong: 'dao', quyen: ['xem_gia', 'pha_loc'],
    dem: ['pha_nhap', 'thu_hoi_thap'] },   // 0033: quản lý thấy phiên thu hồi thấp chưa xem
  // Quầy yêu cầu → thủ kho mang ra → quầy bấm nhận (0032). Số đỏ: thủ kho thấy
  // yêu cầu đang chờ, NV quầy thấy hàng đang mang ra chờ bấm nhận.
  { ma: 'yeu_cau_quay', nhom: 'che_bien', ten: { vi: 'Quầy cần hàng', en: 'Counter requests' }, link: '/noi-bo/kho/quay/yeu-cau', bieuTuong: 'chuyen',
    quyen: ['van_hanh'], dem: ['yeu_cau_quay'] },
  { ma: 'nhan_quay', nhom: 'che_bien', ten: { vi: 'Nhận hàng ra quầy', en: 'Counter receiving' }, link: '/noi-bo/kho/quay/nhan', bieuTuong: 'quay',
    quyen: ['van_hanh'], dem: ['hang_dang_chuyen'] },
  // Số đỏ thêm: phiếu chuyển quầy nhận thiếu, chờ quản lý xử lý (0032).
  { ma: 'xuat', nhom: 'che_bien', ten: { vi: 'Chuyển · Xuất · Hủy', en: 'Transfer · Issue · Write-off' }, ngan: { vi: 'Xuất', en: 'Issue' }, link: '/noi-bo/kho/xuat', bieuTuong: 'chuyen',
    quyen: ['xem'], dem: ['huy_bi_tra', 'chuyen_nhan_thieu'] },
  { ma: 'kiem_ke', nhom: 'ton_kho', ten: { vi: 'Kiểm kê', en: 'Stocktake' }, link: '/noi-bo/kho/kiem-ke', bieuTuong: 'kiem_ke', quyen: ['xem'],
    dem: ['kiem_ke_tra_ve', 'quay_chua_dem'] },
  { ma: 'cong_no', nhom: 'tien_bao_cao', ten: { vi: 'Công nợ', en: 'Payables' }, link: '/noi-bo/kho/cong-no', bieuTuong: 'cong_no', quyen: ['ke_toan'],
    dem: KHOA_CONG_NO },
  { ma: 'bao_cao', nhom: 'tien_bao_cao', ten: { vi: 'Báo cáo', en: 'Reports' }, link: '/noi-bo/kho/bao-cao', bieuTuong: 'bao_cao', quyen: ['xem_gia'] },
  // GĐ7a (0037): dòng bán iPOS chưa trừ được kho — chưa ghép món, thiếu hàng trên sổ.
  { ma: 'ban_ipos', nhom: 'tien_bao_cao', ten: { vi: 'Bán hàng iPOS', en: 'iPOS sales' }, link: '/noi-bo/kho/ban-ipos', bieuTuong: 'quay', quyen: ['duyet'],
    dem: ['ipos_cho_xu_ly'] },
  // Danh mục mặt hàng (tảng, phần cắt, phụ phẩm) — trước chỉ tới được qua Thiết lập. Đứng đầu nhóm
  // Thiết lập; ô riêng nên mở trang này (cả màn sửa nhanh) thì ô "Thiết lập" không sáng (dangO).
  { ma: 'mat_hang', nhom: 'thiet_lap', ten: { vi: 'Mặt hàng', en: 'Items' }, link: '/noi-bo/kho/cai-dat/mat-hang', bieuTuong: 'mat_hang',
    quyen: ['danh_muc'] },
  // GĐ7b (0038): định lượng món (danh_muc) và đối chiếu định mức bếp. Báo cáo mở
  // cho mọi vai xem kho, nhưng ô menu chỉ cho quản lý / chủ — người nhận cảnh
  // báo dinh_muc_lech (số đỏ). Thủ kho / NV quầy mở trang (chỉ kg) khi được gửi link.
  { ma: 'dinh_luong', nhom: 'thiet_lap', ten: { vi: 'Định lượng món', en: 'Dish recipes' }, link: '/noi-bo/kho/cai-dat/dinh-luong', bieuTuong: 'bep',
    quyen: ['danh_muc'] },
  { ma: 'dinh_muc', nhom: 'tien_bao_cao', ten: { vi: 'Định mức bếp', en: 'Kitchen usage' }, link: '/noi-bo/kho/bao-cao/dinh-muc', bieuTuong: 'bao_cao',
    quyen: ['duyet'], dem: ['dinh_muc_lech'] },
  { ma: 'quy_trinh', nhom: 'thiet_lap', ten: { vi: 'Quy trình', en: 'Workflows' }, link: '/noi-bo/kho/quy-trinh', bieuTuong: 'quy_trinh', quyen: ['xem'] },
  // GĐ5e: màn Cài đặt thành "Thiết lập" có tiến độ từng bước (0035). Không số
  // đỏ — số bước còn lại hiện ngay trên màn, kho_dem_viec không đếm nó.
  { ma: 'cai_dat', nhom: 'thiet_lap', ten: { vi: 'Thiết lập', en: 'Setup' }, link: '/noi-bo/kho/cai-dat', bieuTuong: 'cai_dat',
    quyen: ['danh_muc', 'ncc', 'cai_dat_goc'] },
  { ma: 'huong_dan', nhom: 'thiet_lap', ten: { vi: 'Hướng dẫn', en: 'Help' }, link: '/noi-bo/kho/huong-dan', bieuTuong: 'huong_dan', quyen: ['xem'] },
  // GĐ8c: bảng "vai nào làm được việc gì" bằng lời — mọi vai xem kho mở được.
  { ma: 'quyen', nhom: 'thiet_lap', ten: { vi: 'Ai làm được gì', en: 'Who can do what' }, link: '/noi-bo/kho/cai-dat/quyen', bieuTuong: 'nguoi', quyen: ['xem'] },
];

/**
 * Chữ người dùng hay gõ khi tìm chức năng mà không nằm trong tên mục (trang Khác,
 * lib/ban-do-chuc-nang.ts). Ví dụ gõ "trả tiền" phải ra Công nợ, "hủy" phải ra
 * Chuyển · Xuất · Hủy. Mã lạ ở đây là test đỏ.
 */
export const TU_KHOA_KHO: Readonly<Record<string, HaiThuTieng>> = {
  viec:         { vi: 'việc của tôi bị trả về hết hạn', en: 'my tasks returned expired' },
  duyet:        { vi: 'chờ duyệt phiếu điền giá', en: 'pending approve fill in prices' },
  quet:         { vi: 'mã vạch nhãn cân camera', en: 'barcode scale label camera' },
  ton:          { vi: 'còn bao nhiêu hạn dùng thẻ kho lô', en: 'how much left use-by stock card batch' },
  tang:         { vi: 'ủ khô tảng thịt', en: 'dry aging primal' },
  dat_hang:     { vi: 'đơn đặt hàng nhà cung cấp mua hàng', en: 'supplier order buying' },
  nhan_hang:    { vi: 'nhà cung cấp giao hàng cân kg', en: 'supplier delivery weigh kg' },
  nhap:         { vi: 'phiếu nhập giá hóa đơn', en: 'receipt price invoice' },
  pha_loc:      { vi: 'lóc thịt cắt chia gói', en: 'cut portion pack' },
  yeu_cau_quay: { vi: 'quầy hết hàng mang ra', en: 'counter running low bring out' },
  nhan_quay:    { vi: 'quầy nhận hàng mang ra', en: 'counter receive delivered stock' },
  xuat:         { vi: 'báo hủy hàng hỏng chuyển quầy xuất bếp', en: 'report damaged write-off move to counter send to kitchen' },
  kiem_ke:      { vi: 'đếm kho lệch', en: 'count stock variance' },
  cong_no:      { vi: 'nợ nhà cung cấp trả tiền thanh toán hóa đơn MISA', en: 'supplier debt pay invoice MISA' },
  bao_cao:      { vi: 'doanh thu giá vốn thống kê Excel', en: 'revenue cost statistics Excel' },
  ban_ipos:     { vi: 'POS bán hàng trừ kho ghép món', en: 'POS sales deduct stock map dishes' },
  mat_hang:     { vi: 'danh mục SKU tảng phần cắt phụ phẩm mã cân ô mã giá bán', en: 'catalog SKU primal cut by-product scale code price' },
  dinh_luong:   { vi: 'công thức món ăn gram', en: 'dish recipe grams' },
  dinh_muc:     { vi: 'bếp dùng lệch định lượng', en: 'kitchen usage variance' },
  quy_trinh:    { vi: 'các bước làm việc', en: 'step by step' },
  cai_dat:      { vi: 'cài đặt nhà cung cấp nhân viên máy cân', en: 'settings suppliers staff scale' },
  huong_dan:    { vi: 'trợ giúp cách dùng hỏi đáp', en: 'help how to FAQ' },
  quyen:        { vi: 'phân quyền vai trò', en: 'permissions roles' },
};

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

/** Các mục của vai này theo nhóm (thứ tự NHOM_KHO, trong nhóm theo MUC_KHO). Nhóm rỗng bị bỏ. */
export function nhomCuaVai(vai: string): { ma: MaNhomKho; ten: HaiThuTieng; muc: MucKho[] }[] {
  const ds = mucCuaVai(vai);
  return NHOM_KHO
    .map(n => ({ ...n, muc: ds.filter(m => m.nhom === n.ma) }))
    .filter(n => n.muc.length > 0);
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
// PHẦN CRM / WEBSITE — menu người dùng và trang Khác, cho quản lý, chủ nhà hàng
// -----------------------------------------------------------------------------
// Dựng từ MUC_NOI_BO (lib/dieu-huong-noi-bo.ts) — một danh sách cho cả hai khung.
// Bản soi gương viết tay trước đây thiếu Zalo, Messenger, Tin tuyển dụng. Bỏ mục
// Kho: đang ở kho rồi.
export const MUC_CRM: { link: string; ten: HaiThuTieng; vai: string[]; bieuTuong: TenBieuTuong }[] =
  MUC_NOI_BO.filter(m => m.ma !== 'kho')
    .map(m => ({ link: m.link, ten: m.ten, vai: [...m.vai], bieuTuong: m.bieuTuong }));
