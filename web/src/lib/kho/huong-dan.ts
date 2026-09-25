/**
 * KHO — NỘI DUNG HƯỚNG DẪN SỬ DỤNG (GĐ6)
 *
 * Một nguồn cho cả trang trong app (/noi-bo/kho/huong-dan) lẫn trang chia sẻ
 * gửi nhóm qua Zalo. File thuần: không gọi database, test đọc thẳng bằng Node.
 *
 *   · MUC_HUONG_DAN: mỗi mục một việc. `id` là neo (#id) cho nút "?" của từng
 *     màn kho (prop huongDan của <Kho>), nên KHÔNG đổi id đã dùng.
 *   · NHOM_VAI: thứ tự và tên nhóm hiển thị. Mục thuộc nhóm của vai ĐẦU TIÊN
 *     trong `vai`; các vai sau chỉ để lọc "việc của tôi".
 *   · CAU_HOI: câu hỏi thường gặp, id bắt đầu bằng "hoi-".
 *
 * Câu chữ: ngắn, động từ trước, đúng chữ trên nút (**Gửi duyệt**). Phần của
 * thủ kho và nhân viên quầy không nhắc tiền — test-kho-giao-dien.mjs nhóm 5
 * quét chữ về tiền, id trùng, ảnh có file, link trỏ trang có thật.
 *
 * Ảnh: web/public/kho/hd-*.png, chụp từ Supabase giả bằng Playwright
 * (xem web/KHO.md mục "Hướng dẫn"). `rong`/`cao` phải khớp cỡ file thật.
 */

import { QUY_TRINH } from './quy-trinh.ts';

export type VaiHuongDan = 'chung' | 'thu_kho' | 'nhan_vien_quay' | 'quan_ly' | 'ke_toan' | 'chu_so_huu';

export interface MucHuongDan {
  id: string;
  vai: VaiHuongDan[];
  tieuDe: string;
  tomTat: string;
  /** Các bước đánh số. Cho phép **đậm** (xem dinhDang). */
  buoc: string[];
  meo?: string[];
  anh?: { file: string; chu: string; rong: number; cao: number };
  link?: { href: string; chu: string };
}

export interface CauHoi { id: string; hoi: string; dap: string }

export const NHOM_VAI: { vai: VaiHuongDan; ten: string }[] = [
  { vai: 'chung', ten: 'Bắt đầu' },
  { vai: 'thu_kho', ten: 'Thủ kho' },
  { vai: 'nhan_vien_quay', ten: 'Nhân viên quầy & bếp' },
  { vai: 'quan_ly', ten: 'Quản lý' },
  { vai: 'ke_toan', ten: 'Kế toán' },
  { vai: 'chu_so_huu', ten: 'Chủ quán' },
];

/** Vai tài khoản → nhóm hướng dẫn mặc định. Vai lạ (máy iPOS…) → "Bắt đầu". */
export function vaiHuongDan(vaiTro: string | null | undefined): VaiHuongDan {
  return NHOM_VAI.some(n => n.vai === vaiTro) ? vaiTro as VaiHuongDan : 'chung';
}

/** Escape HTML rồi đổi **x** thành <strong>x</strong>. Dùng với set:html. */
export function dinhDang(s: string): string {
  const an = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  return an.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

const anh = (ten: string, chu: string, cao = 844, rong = 390) =>
  ({ file: `/kho/hd-${ten}.png`, chu, rong, cao });

export const MUC_HUONG_DAN: MucHuongDan[] = [
  // ===========================================================================
  // BẮT ĐẦU — ai cũng đọc
  // ===========================================================================
  {
    id: 'dang-nhap', vai: ['chung'],
    tieuDe: 'Đăng nhập lần đầu',
    tomTat: 'Mỗi người một tài khoản riêng do chủ quán tạo. Việc bạn làm được ghi đúng tên bạn.',
    buoc: [
      'Nhận **email** và **mật khẩu tạm** từ chủ quán.',
      'Mở trang **Đăng nhập nội bộ**, gõ email và mật khẩu, bấm **Đăng nhập**.',
      'Phần mềm mở thẳng trang chủ kho của vai bạn.',
      'Xong việc trên máy của người khác: bấm tên mình ở góc trên → **Đăng xuất**.',
    ],
    meo: ['Không đưa mật khẩu cho người khác. Mỗi người một tài khoản — sổ sách mới đúng người làm.'],
    link: { href: '/noi-bo/dang-nhap', chu: 'Mở trang đăng nhập' },
  },
  {
    id: 'menu', vai: ['chung'],
    tieuDe: 'Menu, số đỏ và nút Quét',
    tomTat: 'Điện thoại có thanh 5 nút dưới đáy. Máy tính có các ô bên trái.',
    buoc: [
      'Nút đầu tiên là **trang chủ** của vai bạn (Trang chủ, Quầy hoặc Hôm nay).',
      'Nút tròn đỏ ở giữa là **Quét** — quét một nhãn cân để biết món gì, còn ở đâu. (Kế toán: nút giữa là **Công nợ**, Quét nằm trong **Khác**.)',
      '**Số đỏ** trên nút = số việc đang chờ bạn. Bấm vào để làm.',
      'Nút cuối **Khác** mở tất cả các mục còn lại và **Thao tác nhanh**.',
      'Chuông trên cùng = thông báo. Nút **?** mở đúng mục hướng dẫn của màn đang xem.',
    ],
    anh: anh('menu', 'Thanh 5 nút dưới đáy màn hình điện thoại', 69),
    link: { href: '/noi-bo/kho/khac', chu: 'Mở màn Khác' },
  },
  {
    id: 'quet-nhan', vai: ['chung'],
    tieuDe: 'Quét nhãn cân',
    tomTat: 'Quét một gói để biết món gì, bao nhiêu kg, hạn dùng, đang ở đâu — và làm việc với gói đó ngay.',
    buoc: [
      'Bấm nút **Quét** ở giữa thanh đáy.',
      '**Máy quét cầm tay:** bấm vào ô **Quét nhãn cân**, quét, rồi bấm **Xem món này**.',
      '**Camera:** bấm **Quét bằng camera**, đưa từng gói vào khung rồi đưa ra.',
      'Hai gói giống hệt nhau thì bấm **+1 gói giống hệt gói vừa quét**.',
      'Quét bằng camera xong thì bấm **Xong** trong khung camera — trang tự đọc.',
      'Trang hiện món đó còn ở đâu, kèm nút việc cho từng lô (**Đưa bếp**, **Báo hủy**…).',
    ],
    meo: [
      'Quét không ra? Xem câu hỏi "Quét không ra" ở cuối trang.',
      'Không có camera hay máy quét thì gõ 13 số dưới mã vạch vào ô.',
    ],
    anh: anh('quet', 'Màn Quét nhãn sau khi quét một gói'),
    link: { href: '/noi-bo/kho/quet', chu: 'Mở màn Quét' },
  },
  {
    id: 'thong-bao', vai: ['chung'],
    tieuDe: 'Chuông thông báo',
    tomTat: 'Chuông gom mọi sự kiện 30 ngày gần nhất: phiếu được duyệt, bị trả về, hàng sắp hết hạn…',
    buoc: [
      'Số trên chuông = thông báo chưa đọc.',
      'Bấm chuông để xem. Mở chuông là đã đọc.',
      'Bấm một dòng để mở đúng phiếu đó.',
    ],
    link: { href: '/noi-bo/kho/thong-bao', chu: 'Mở Thông báo' },
  },
  {
    id: 'viec-can-lam', vai: ['chung'],
    tieuDe: 'Việc cần làm',
    tomTat: 'Chỉ giữ những gì bạn phải làm. Mỗi dòng có một nút để làm ngay.',
    buoc: [
      'Thủ kho, NV quầy: bấm nút **Việc** ở thanh đáy. Quản lý, chủ: việc hiện ngay ở màn **Hôm nay**.',
      '**Làm ngay** là việc gấp; **Nên làm sớm** làm trong ngày.',
      'Bấm nút trên dòng để mở đúng màn cần làm. Làm xong, dòng tự mất.',
    ],
    link: { href: '/noi-bo/kho/viec', chu: 'Mở Việc cần làm' },
  },
  {
    id: 'cai-app', vai: ['chung'],
    tieuDe: 'Cài kho lên màn hình điện thoại',
    tomTat: 'Cài một lần thì có biểu tượng đầu bò trên màn hình, mở như một ứng dụng.',
    buoc: [
      'Đăng nhập kho trên điện thoại.',
      '**Android (Chrome):** bấm nút ⋮ góc trên → **Thêm vào màn hình chính** (hoặc **Cài đặt ứng dụng**).',
      '**iPhone / iPad (Safari):** bấm nút **Chia sẻ** (ô vuông có mũi tên) → **Thêm vào MH chính**.',
      'Từ giờ bấm biểu tượng Beeftown Kho để mở.',
    ],
    meo: ['iPhone phải dùng Safari mới cài được, Chrome trên iPhone không có mục này.'],
  },
  {
    id: 'ton-kho', vai: ['chung'],
    tieuDe: 'Xem tồn kho',
    tomTat: 'Còn bao nhiêu, ở đâu, hạn tới bao giờ.',
    buoc: [
      'Bấm **Tồn kho** (NV quầy: **Ở quầy**).',
      'Gõ tên món rồi bấm **Tìm**, hoặc lọc theo nơi để, hạn dùng.',
      'Bấm một món để xem từng lô. Lô **đỏ** là đã hết hạn — chỉ báo hủy được.',
      'Muốn xem món đó vào ra thế nào thì bấm **Thẻ kho**.',
    ],
    link: { href: '/noi-bo/kho/ton', chu: 'Mở Tồn kho' },
  },
  {
    id: 'may-chung', vai: ['chung'],
    tieuDe: 'Máy tính bảng dùng chung',
    tomTat: 'Tablet ở quầy, bếp dùng chung nhiều người: mỗi người chọn tên và gõ PIN riêng.',
    buoc: [
      'Quản lý đăng ký máy một lần (xem mục "Đăng ký máy dùng chung").',
      'Mỗi người **gắn tên vào máy** một lần và đặt PIN.',
      'Hằng ngày: chọn tên → gõ PIN → làm việc.',
      'Xong việc: bấm tên mình ở góc trên → **Khóa máy**. Quên khóa thì máy tự khóa sau 5 phút không dùng.',
      'Nghỉ dùng máy này: bấm tên mình → **Gỡ tôi khỏi máy này**.',
    ],
    meo: ['Không dùng PIN của người khác — việc làm bằng PIN của ai thì ghi tên người đó.'],
    link: { href: '/noi-bo/kho/may', chu: 'Mở màn máy dùng chung' },
  },
  {
    id: 'mo-may-pin', vai: ['chung'],
    tieuDe: 'Mở máy bằng PIN',
    tomTat: 'Màn "Ai đang dùng máy?" hiện khi máy đang khóa.',
    buoc: [
      'Bấm **tên mình** trong danh sách.',
      'Gõ PIN 4–6 số, bấm **Mở máy**.',
      'Không thấy tên mình: bấm **Gắn tôi vào máy này**.',
    ],
    meo: [
      'Sai PIN 5 lần thì tên đó bị khóa 15 phút. Cả máy sai quá nhiều thì máy khóa — nhờ quản lý mở.',
      'Muốn đổi PIN: bấm tên mình → **Đổi PIN của tôi**.',
    ],
    link: { href: '/noi-bo/kho/may', chu: 'Mở màn Ai đang dùng máy' },
  },
  {
    id: 'gan-may', vai: ['chung'],
    tieuDe: 'Lần đầu dùng một máy chung: gắn tên, đặt PIN',
    tomTat: 'Làm một lần trên mỗi máy. Lần sau chỉ cần chọn tên và gõ PIN.',
    buoc: [
      'Ở màn "Ai đang dùng máy?" bấm **Gắn tôi vào máy này**.',
      'Gõ **email** và **mật khẩu** của bạn.',
      'Đặt PIN 4–6 số, gõ lại lần nữa. Không dùng số lặp (1111) hay liền nhau (1234).',
      'Bấm **Gắn và bắt đầu dùng**.',
    ],
    meo: ['Quên PIN: làm lại các bước này để đặt PIN mới.'],
    link: { href: '/noi-bo/kho/may/gan', chu: 'Mở màn gắn tên' },
  },
  {
    id: 'quy-trinh', vai: ['chung'],
    tieuDe: 'Các quy trình',
    tomTat: 'Màn Quy trình vẽ từng việc thành các bước đánh số, bước nào của ai, bước nào đang có việc chờ.',
    buoc: QUY_TRINH.map(q => `**${q.ten}:** ${q.buoc.map(b => b.ten).join(' → ')}.`),
    meo: ['Bấm **Làm bước này** trên màn Quy trình để mở đúng màn cần làm.'],
    link: { href: '/noi-bo/kho/quy-trinh', chu: 'Mở Quy trình' },
  },

  // ===========================================================================
  // THỦ KHO — không nhắc tiền
  // ===========================================================================
  {
    id: 'thu-kho', vai: ['thu_kho'],
    tieuDe: 'Thủ kho: trang chủ và việc mỗi ngày',
    tomTat: 'Trang chủ hiện việc đang chờ bạn và các nút làm nhanh.',
    buoc: [
      'Mở kho → **Trang chủ**. Các nút tròn trên cùng: **Nhận hàng**, **Pha lóc**, **Quầy cần hàng**, **Báo hủy**, **Kiểm kê**.',
      'Xem ô **Quầy đang cần** — quầy yêu cầu thì mang ra trước.',
      'Xem các ô số: lô hết hạn, sắp hết hạn, phiếu nhận hàng còn dở hoặc bị trả về.',
      'Làm hết **Làm ngay** rồi tới **Nên làm sớm**.',
    ],
    anh: anh('trang-chu-thu-kho', 'Trang chủ của thủ kho'),
    link: { href: '/noi-bo/kho', chu: 'Mở trang chủ' },
  },
  {
    id: 'nhan-hang', vai: ['thu_kho'],
    tieuDe: 'Nhận hàng từ nhà cung cấp (3 bước)',
    tomTat: 'Chụp hóa đơn → cân từng món → gửi. Kế toán hoặc quản lý kiểm và duyệt; hàng vào tồn khi được duyệt.',
    buoc: [
      'Bấm **Nhận hàng** (nút tròn ở trang chủ).',
      '**Bước 1:** chụp hóa đơn / phiếu giao hàng (bắt buộc), chọn **Ai giao hàng?**, **Nhận vào đâu?** rồi bấm **Tiếp: cân hàng →**.',
      '**Bước 2:** mỗi món một dòng — chọn món, gõ **Số kg**, số tảng / gói, bấm **+ Thêm dòng**. Lặp lại tới hết hàng.',
      'Hết hàng thì bấm **Xong, xem lại →**.',
      '**Bước 3:** soát lại rồi bấm **Gửi cho kế toán / quản lý**.',
    ],
    meo: [
      'Hóa đơn nhiều trang: chụp thêm bằng nút **Thêm ảnh**. Ảnh gửi qua Zalo cũng chọn được.',
      'Có hạn dùng, số lô trên thùng thì mở **Thêm chi tiết** ở dòng đó. Bỏ trống hạn dùng = tự tính theo món.',
      'Gửi rồi mới thấy sai: bấm **Rút về để sửa** (khi chưa được duyệt).',
    ],
    anh: anh('nhan-hang', 'Bước 1 nhận hàng: chụp hóa đơn và chọn người giao'),
    link: { href: '/noi-bo/kho/nhan-hang/moi', chu: 'Mở màn Nhận hàng' },
  },
  {
    id: 'nhan-hang-can', vai: ['thu_kho'],
    tieuDe: 'Nhận hàng: cân từng món',
    tomTat: 'Bước 2 của nhận hàng. Phiếu đang dở vẫn nằm đó — làm tiếp lúc nào cũng được.',
    buoc: [
      'Ở **Món gì?** chọn món. Gõ **Số kg** cân được.',
      'Hàng đếm tảng / gói thì gõ thêm số tảng / gói.',
      'Bấm **+ Thêm dòng**. Dòng mới hiện ở danh sách **Hàng đã cân**.',
      'Ghi nhầm một dòng: bấm **Sửa** ở dòng đó, sửa rồi bấm **Lưu dòng này**. Bỏ hẳn dòng đó thì bấm **Bỏ**.',
      'Lập nhầm cả phiếu: mở **Bỏ phiếu này (lập nhầm)** → **Bỏ phiếu**.',
    ],
    meo: ['Phiếu đang dở hiện ở màn **Nhận hàng** và có số đỏ — đừng lập phiếu mới cho cùng chuyến hàng.'],
    anh: anh('nhan-hang-dong', 'Phiếu nhận hàng đang cân dở'),
    link: { href: '/noi-bo/kho/nhan-hang', chu: 'Mở danh sách nhận hàng' },
  },
  {
    id: 'phieu-bi-tra', vai: ['thu_kho'],
    tieuDe: 'Phiếu bị trả về',
    tomTat: 'Kế toán / quản lý thấy sai thì trả phiếu về kèm lý do. Bạn sửa rồi gửi lại.',
    buoc: [
      'Mở **Việc** (hoặc chuông) → bấm dòng **phiếu bị trả về**.',
      'Đọc ô **Phiếu bị trả về:** ở đầu phiếu.',
      'Sửa đúng chỗ được nhắc: chụp lại hóa đơn, cân lại dòng…',
      'Bấm **Xong, xem lại →** rồi **Gửi cho kế toán / quản lý**.',
    ],
    link: { href: '/noi-bo/kho/viec', chu: 'Mở Việc cần làm' },
  },
  {
    id: 'pha-loc', vai: ['thu_kho'],
    tieuDe: 'Pha lóc: quét nhãn từng gói (3 bước)',
    tomTat: 'Tảng thịt → các gói phần cắt. Gói nào cũng có nhãn cân, nên chỉ cần quét.',
    buoc: [
      'Bấm **Pha lóc** → **Bước 1:** bấm loại tảng đem pha. Mỗi phiên một loại tảng.',
      '**Bước 2 · Cân & quét:** mở **Tảng đem pha**, tích lô tảng đem pha. Lấy một phần thì ghi số kg cân được.',
      'Cắt, cân, in nhãn từng gói rồi quét nhãn vào ô **Quét nhãn cân**, bấm **Cộng nhãn vào phiên**. Số gói, số kg tự cộng.',
      'Phụ phẩm, mỡ bỏ (không có nhãn): cân rồi gõ kg ở mục **Phụ phẩm, mỡ bỏ — gõ kg**, bấm **Lưu + thêm dòng**.',
      'Bấm **Lưu, xem kết quả →**. **Bước 3:** xem thu hồi so với dự kiến, lệch nhiều thì cân lại.',
      'Bấm **Chốt phiên**. Gói để kho lạnh thì có nút mang ra quầy ngay.',
    ],
    meo: [
      'Quét nhầm một gói: bấm **−1** ở món đó, hoặc **Bỏ lượt vừa quét**.',
      'Đang pha dở mà phải đi: cứ để đó, vào **Pha lóc** bấm phiên đang dở để làm tiếp.',
      'Chốt nhầm: mở **Mở lại phiên để sửa**, ghi lý do, bấm **Mở lại phiên** (khi các gói mới chưa bị đụng tới).',
    ],
    anh: anh('pha-loc', 'Pha lóc bước 2: cân và quét nhãn'),
    link: { href: '/noi-bo/kho/pha-loc/moi', chu: 'Mở Pha lóc' },
  },
  {
    id: 'ra-quay', vai: ['thu_kho'],
    tieuDe: 'Mang hàng ra quầy theo yêu cầu',
    tomTat: 'Quầy gửi yêu cầu → bạn mang ra → quầy đếm và bấm nhận.',
    buoc: [
      'Bấm **Quầy cần hàng** (có số đỏ khi quầy đang chờ).',
      'Bấm yêu cầu cần làm. Phần mềm tự chọn gói hạn gần trước.',
      'Kho không đủ thì sửa số; ghi 0 là không mang món đó.',
      'Bấm **Mang ra quầy**, rồi mang hàng ra.',
      'Nhờ nhân viên quầy đếm và bấm nhận — bạn không tự bấm nhận được.',
    ],
    meo: [
      'Mang nhầm: mở **Hủy chuyến** → **Hủy chuyến — hàng về lại kho** (khi quầy chưa bấm nhận).',
      'Không có yêu cầu mà vẫn cần mang ra: dùng **lập phiếu chuyển** ở màn Quầy cần hàng.',
    ],
    link: { href: '/noi-bo/kho/quay/yeu-cau', chu: 'Mở Quầy cần hàng' },
  },
  {
    id: 'xuat-bep', vai: ['thu_kho', 'nhan_vien_quay'],
    tieuDe: 'Xuất bếp',
    tomTat: 'Ghi thịt đưa vào bếp nấu món.',
    buoc: [
      'NV quầy: bấm **Đưa bếp** (ở trang **Quầy** hoặc **Khác**). Thủ kho: mở **Khác** → **Chuyển · Xuất · Hủy** → **Xuất bếp**.',
      'Chọn nơi **Lấy từ**.',
      'Quét nhãn các gói, hoặc bấm tên món hay đưa bếp, hoặc chọn món và ghi số gói / số kg.',
      'Bấm **Ghi phiếu**.',
    ],
    link: { href: '/noi-bo/kho/xuat/moi?loai=xuat_bep', chu: 'Mở Xuất bếp' },
  },
  {
    id: 'kiem-ke', vai: ['thu_kho', 'nhan_vien_quay'],
    tieuDe: 'Kiểm kê kho',
    tomTat: 'Đếm thật rồi gửi quản lý. Lúc đếm bạn không thấy số trên sổ — cứ đếm đúng.',
    buoc: [
      'Bấm **Kiểm kê** → chọn kho lạnh hoặc quầy → bấm **Bắt đầu đếm**.',
      'Quét nhãn cân rồi bấm **Đọc mã và ghi số đếm** là nhanh nhất; hoặc gõ số gói / số kg từng món.',
      'Món hết thật thì ghi 0. Thấy món không có trong danh sách: mở **Thấy mặt hàng không có trong danh sách**.',
      'Đếm dở phải đi: bấm **Lưu số đếm**.',
      'Đếm xong: bấm **Gửi quản lý duyệt**.',
    ],
    meo: [
      'NV quầy bấm vào quầy thì mở màn **Đếm quầy** (xem mục "Đếm quầy cuối ngày").',
      'Kho còn phiên pha lóc chưa chốt thì chưa kiểm kê được — chốt phiên trước.',
    ],
    link: { href: '/noi-bo/kho/kiem-ke', chu: 'Mở Kiểm kê' },
  },
  {
    id: 'ton-dau', vai: ['thu_kho', 'quan_ly', 'chu_so_huu'],
    tieuDe: 'Tồn đầu kỳ (làm một lần khi bắt đầu)',
    tomTat: 'Ghi hàng đang có sẵn trong kho lạnh và quầy trước ngày bắt đầu dùng phần mềm.',
    buoc: [
      'Thủ kho: bấm **Nhận hàng** → **Nhập dạng bảng / dán Excel →**. Quản lý, chủ: **Thiết lập** → bước **Tồn đầu kỳ** → **Nhập tồn đầu kỳ**.',
      'Chọn nơi (kho lạnh, quầy). Chọn **Ngày tồn đầu kỳ** — thường là hôm trước ngày bắt đầu.',
      'Ghi số gói, số kg món đang có. Dòng để trống được bỏ qua.',
      'Bấm **Xem trước**, soát lại, rồi bấm **Xác nhận**.',
      'Phiếu được duyệt thì hàng mới vào tồn.',
    ],
    meo: ['Có sẵn bảng Excel: mở **Dán từ Excel (nhiều nơi một lượt)**, dán cả dòng tiêu đề.'],
    link: { href: '/noi-bo/kho/cai-dat/ton-dau', chu: 'Mở Tồn đầu kỳ' },
  },
  {
    id: 'the-kho', vai: ['thu_kho', 'quan_ly', 'ke_toan'],
    tieuDe: 'Thẻ kho',
    tomTat: 'Sổ vào ra của một món: tồn đầu kỳ, nhập, xuất, tồn cuối kỳ, từng phiếu.',
    buoc: [
      'Mở **Tồn kho**, bấm món cần xem → **Thẻ kho** (hoặc quét nhãn → **Thẻ kho**).',
      'Chọn **Ở đâu**, **Từ ngày**, **Đến ngày**, bấm **Xem**.',
      'Bấm số phiếu trên dòng để mở phiếu đó.',
    ],
    link: { href: '/noi-bo/kho/ton', chu: 'Mở Tồn kho' },
  },

  // ===========================================================================
  // NHÂN VIÊN QUẦY & BẾP — không nhắc tiền
  // ===========================================================================
  {
    id: 'nv-quay', vai: ['nhan_vien_quay'],
    tieuDe: 'Quầy: một ngày làm việc',
    tomTat: 'Trang **Quầy** là trang chủ của bạn: việc hôm nay xếp từ trên xuống.',
    buoc: [
      '**Sáng:** xem **Hết hạn — phải bỏ** và **Xếp ra bán trước**.',
      '**Quầy thiếu:** bấm **Yêu cầu hàng**, thủ kho mang ra.',
      '**Hàng tới:** đếm rồi bấm **Đã nhận đủ** (hoặc ghi số thiếu).',
      '**Hàng hỏng:** **Báo hàng hỏng**.',
      '**Cuối ngày:** **Đếm quầy**.',
    ],
    anh: anh('quay-hom-nay', 'Trang Quầy của nhân viên quầy'),
    link: { href: '/noi-bo/kho', chu: 'Mở trang Quầy' },
  },
  {
    id: 'xep-hang', vai: ['nhan_vien_quay'],
    tieuDe: 'Sáng: xếp gói hạn gần ra trước',
    tomTat: 'Bán trước gói sắp hết hạn để không phải bỏ.',
    buoc: [
      'Mở trang **Quầy**, xem mục **Xếp ra bán trước**.',
      'Đặt các gói trong danh sách ra phía trước quầy.',
      'Gói trong **Hết hạn — phải bỏ**: lấy ra, bấm **Báo hủy** ngay trên dòng đó.',
    ],
    link: { href: '/noi-bo/kho/ton?vi_tri=quay', chu: 'Mở Hàng ở quầy' },
  },
  {
    id: 'yeu-cau', vai: ['nhan_vien_quay'],
    tieuDe: 'Yêu cầu hàng ra quầy',
    tomTat: 'Phần mềm tự liệt kê món quầy sắp hết kèm số gói nên lấy.',
    buoc: [
      'Bấm **Yêu cầu hàng**.',
      'Xem **Món quầy sắp hết**. Sửa số nếu cần; ghi 0 là không lấy món đó.',
      'Cần món khác: ghi ở **Thêm món khác** (bấm **+ Thêm dòng** nếu cần thêm).',
      'Bấm **Gửi yêu cầu cho thủ kho**.',
    ],
    meo: ['Không cần nữa: mở yêu cầu → **Hủy yêu cầu (không cần nữa)** → **Hủy yêu cầu**.'],
    anh: anh('yeu-cau', 'Màn Yêu cầu hàng ra quầy'),
    link: { href: '/noi-bo/kho/quay/yeu-cau', chu: 'Mở Yêu cầu hàng' },
  },
  {
    id: 'nhan-ra-quay', vai: ['nhan_vien_quay'],
    tieuDe: 'Nhận hàng ra quầy: đủ hay thiếu',
    tomTat: 'Hàng thủ kho mang ra chỉ vào quầy khi bạn đếm và bấm nhận.',
    buoc: [
      'Bấm **Nhận hàng ra quầy** (có số đỏ khi có chuyến chờ).',
      'Đếm từng món trên xe / khay.',
      'Đủ: bấm **Đã nhận đủ**.',
      'Thiếu: bấm **Thiếu — ghi số nhận**, ghi số thực nhận từng món (không nhận được thì ghi 0), bấm **Gửi số thực nhận**.',
    ],
    meo: ['Nhận thiếu thì quản lý được báo và xử lý phần thiếu — bạn không phải làm gì thêm.'],
    link: { href: '/noi-bo/kho/quay/nhan', chu: 'Mở Nhận hàng ra quầy' },
  },
  {
    id: 'tu-lay-hang', vai: ['nhan_vien_quay'],
    tieuDe: 'Tự lấy hàng ra quầy',
    tomTat: 'Thủ kho không có mặt mà quầy cần gấp.',
    buoc: [
      'Mở **Khác** → **Tự lấy hàng**.',
      'Chọn **Lấy từ** (kho lạnh) và **Đưa đến** (quầy).',
      'Quét nhãn các gói mang ra, hoặc chọn món và ghi số gói.',
      'Bấm **Ghi phiếu**.',
    ],
    meo: ['Đã gửi yêu cầu cho thủ kho thì nhớ hủy yêu cầu đó.'],
    link: { href: '/noi-bo/kho/xuat/moi?loai=chuyen', chu: 'Mở Tự lấy hàng' },
  },
  {
    id: 'dem-quay', vai: ['nhan_vien_quay'],
    tieuDe: 'Đếm quầy cuối ngày',
    tomTat: 'Quét nhãn từng gói còn trên quầy. Quét nhiều đợt cũng được — số tự cộng dồn.',
    buoc: [
      'Bấm **Đếm quầy** (chọn quầy nếu có nhiều quầy).',
      'Quét nhãn từng gói còn trên quầy, bấm **Cộng vào số đếm**. Quét tiếp đợt sau cũng vậy.',
      'Lỡ quét thừa: bấm **−1** ở món đó, hoặc **Bỏ lượt vừa quét**.',
      'Quét hết thì bấm **Quét xong**.',
      'Phần mềm hỏi món nào không thấy gói nào: đã bán hết thật thì bấm **Đúng, đã bán hết — Gửi quản lý**; còn hàng thì quét tiếp.',
      'Món nào cũng có số: bấm **Gửi quản lý**.',
    ],
    meo: [
      'Còn chuyến hàng chưa bấm nhận thì phải nhận trước rồi mới gửi được.',
      'Gói mất nhãn: mở phiếu đếm (link ở cuối màn) và ghi tay — số ghi tay được cộng với số đã quét.',
      'Quản lý trả về thì đếm lại chỗ được nhắc rồi gửi lại.',
    ],
    anh: anh('dem-quay', 'Màn Đếm quầy cuối ngày'),
    link: { href: '/noi-bo/kho/quay/dem', chu: 'Mở Đếm quầy' },
  },
  {
    id: 'bao-huy', vai: ['nhan_vien_quay', 'thu_kho'],
    tieuDe: 'Báo hủy hàng hỏng, hết hạn (3 bước)',
    tomTat: 'Hàng rời quầy / kho ngay, chờ quản lý duyệt.',
    buoc: [
      'Bấm **Báo hàng hỏng** (thủ kho: **Báo hủy**).',
      '**Bước 1 · Hàng:** chọn nơi **Lấy từ**, quét nhãn gói cần hủy (hoặc chọn lô), bấm **Tiếp: chọn lý do →**.',
      '**Bước 2 · Lý do:** bấm lý do đúng (hết hạn, hỏng…).',
      '**Bước 3 · Ảnh và gửi:** chụp rõ nhãn và tình trạng hàng, bấm **Gửi báo hủy**.',
    ],
    meo: ['Quét nhầm: bấm **← Sửa hàng**. Chọn nhầm lý do: bấm **Đổi lý do**.'],
    anh: anh('bao-huy', 'Báo hủy bước 1: chọn hàng cần hủy'),
    link: { href: '/noi-bo/kho/xuat/moi?loai=huy', chu: 'Mở Báo hủy' },
  },
  {
    id: 'xuat-khac', vai: ['nhan_vien_quay', 'thu_kho'],
    tieuDe: 'Xuất khác',
    tomTat: 'Hàng dùng nội bộ, tặng khách, làm hàng mẫu — phải chọn lý do.',
    buoc: [
      'Mở **Khác** → **Chuyển · Xuất · Hủy** → **Xuất khác**.',
      'Chọn nơi **Lấy từ**, quét nhãn hoặc chọn món và ghi số.',
      'Chọn **Lý do**, bấm **Ghi phiếu**.',
    ],
    link: { href: '/noi-bo/kho/xuat/moi?loai=xuat_khac', chu: 'Mở Xuất khác' },
  },
  {
    id: 'chuyen-xuat', vai: ['nhan_vien_quay', 'thu_kho', 'quan_ly'],
    tieuDe: 'Chuyển · Xuất · Hủy: xem các phiếu',
    tomTat: 'Mọi phiếu chuyển ra quầy, xuất bếp, xuất khác, báo hủy.',
    buoc: [
      'Mở **Khác** → **Chuyển · Xuất · Hủy**.',
      'Lọc theo loại: **Đang mang ra**, **Chờ duyệt hủy**, **Xuất bếp**…',
      'Bấm một phiếu để xem chi tiết hoặc **In phiếu**.',
    ],
    link: { href: '/noi-bo/kho/xuat', chu: 'Mở Chuyển · Xuất · Hủy' },
  },

  // ===========================================================================
  // QUẢN LÝ
  // ===========================================================================
  {
    id: 'hom-nay', vai: ['quan_ly', 'chu_so_huu'],
    tieuDe: 'Màn Hôm nay',
    tomTat: 'Hai thẻ: **Cần theo dõi** là việc; **Quản trị** là con số tiền.',
    buoc: [
      'Mở kho → **Hôm nay**.',
      'Thẻ **Cần theo dõi**: chờ duyệt, hết hạn, quầy sắp hết, công nợ quá hạn, phiếu nhận thiếu, phiên pha lóc còn nháp. Bấm ô để làm.',
      'Thẻ **Quản trị**: giá trị tồn, giá vốn thịt / kg, thu hồi, hao hụt — so với kỳ trước.',
    ],
    anh: anh('hom-nay', 'Màn Hôm nay của quản lý'),
    link: { href: '/noi-bo/kho', chu: 'Mở Hôm nay' },
  },
  {
    id: 'quan-ly-duyet', vai: ['quan_ly', 'chu_so_huu', 'ke_toan'],
    tieuDe: 'Hộp Duyệt',
    tomTat: 'Mọi thứ chờ duyệt nằm một chỗ: phiếu nhập, báo hủy, kiểm kê. Cũ nhất ở trên.',
    buoc: [
      'Bấm **Duyệt** ở thanh đáy (số đỏ = số phiếu chờ).',
      'Bấm phiếu trên cùng để mở.',
      'Duyệt hoặc từ chối (ghi lý do). Xong thì tự quay về hộp Duyệt.',
    ],
    meo: ['Kế toán chỉ thấy phiếu nhập trong hộp Duyệt.'],
    anh: anh('duyet', 'Hộp Duyệt'),
    link: { href: '/noi-bo/kho/duyet', chu: 'Mở Duyệt' },
  },
  {
    id: 'duyet-nhap', vai: ['quan_ly', 'ke_toan', 'chu_so_huu'],
    tieuDe: 'Điền giá và duyệt phiếu nhập',
    tomTat: 'Thủ kho chỉ gửi số kg. Bạn nhìn ảnh hóa đơn, gõ đơn giá từng món rồi duyệt; hàng vào tồn khi duyệt.',
    buoc: [
      'Mở **Duyệt** → bấm phiếu nhập.',
      'Bấm ảnh hóa đơn để mở cỡ thật, phóng to xem số.',
      'Gõ **Đơn giá/kg** từng món. Có thì điền **Số hóa đơn**, **Tiền thuế (VAT)**, **Chi phí khác**.',
      'Bấm **Lưu giá** để phần mềm so với lần trước và tính thành tiền.',
      'Chip **đỏ** = giá tăng quá ngưỡng so với lần trước cùng nhà cung cấp — kiểm lại hóa đơn (chỉ cảnh báo, vẫn duyệt được).',
      'Đúng hết: bấm **Duyệt — cho hàng vào kho**.',
      'Sai (ảnh mờ, cân thiếu dòng…): mở **Từ chối phiếu**, ghi lý do rõ để thủ kho sửa, bấm **Từ chối**.',
    ],
    meo: ['Số kg sai thì bấm **Sửa dòng hàng, số kg →** thay vì trả về.'],
    anh: anh('dien-gia', 'Phiếu nhập chờ điền giá, có ảnh hóa đơn'),
    link: { href: '/noi-bo/kho/duyet', chu: 'Mở Duyệt' },
  },
  {
    id: 'nhan-thieu', vai: ['quan_ly', 'chu_so_huu'],
    tieuDe: 'Xử lý hàng quầy nhận thiếu',
    tomTat: 'Quầy nhận ít hơn số mang ra — phần thiếu chờ bạn quyết.',
    buoc: [
      'Mở **Hôm nay** → ô **phiếu chờ xử lý** (hoặc **Chuyển · Xuất · Hủy** → **Đang mang ra**).',
      'Mở phiếu, xem mục **Xử lý hàng thiếu**.',
      'Hàng còn ở kho: bấm **Trả về kho**.',
      'Rơi vỡ, thất lạc: ghi lý do, bấm **Ghi mất**.',
    ],
    link: { href: '/noi-bo/kho/xuat?loc=dang_chuyen', chu: 'Mở phiếu đang mang ra' },
  },
  {
    id: 'thu-hoi-thap', vai: ['quan_ly', 'chu_so_huu'],
    tieuDe: 'Pha lóc thu hồi thấp',
    tomTat: 'Thu hồi thấp hơn dự kiến quá ngưỡng thì phần mềm tự báo. Không phải duyệt, chỉ cần xem.',
    buoc: [
      'Bấm thông báo hoặc dòng **Việc** về thu hồi thấp.',
      'Xem số cân tảng vào, phần cắt ra, hao hụt.',
      'Hỏi thủ kho nếu cần. Ghi chú (không bắt buộc) rồi bấm **Đã xem**.',
    ],
    meo: ['Cân nhầm thì thủ kho mở lại phiên để sửa.'],
    link: { href: '/noi-bo/kho/pha-loc', chu: 'Mở Pha lóc' },
  },
  {
    id: 'duyet-huy', vai: ['quan_ly', 'chu_so_huu'],
    tieuDe: 'Duyệt báo hủy',
    tomTat: 'Xem ảnh và lý do. Duyệt thì ghi hủy; từ chối thì hàng về lại chỗ cũ.',
    buoc: [
      'Mở **Duyệt** → bấm phiếu báo hủy.',
      'Xem ảnh, lý do, số gói / kg.',
      'Đúng: bấm **Duyệt — ghi hủy**.',
      'Không đúng: mở **Từ chối — trả hàng về chỗ cũ**, ghi lý do, bấm **Từ chối**.',
    ],
    link: { href: '/noi-bo/kho/duyet', chu: 'Mở Duyệt' },
  },
  {
    id: 'duyet-kiem-ke', vai: ['quan_ly', 'chu_so_huu'],
    tieuDe: 'Duyệt kiểm kê',
    tomTat: 'Duyệt thì tồn trên sổ bằng số đếm. Nghi đếm sai thì trả về đếm lại.',
    buoc: [
      'Mở **Duyệt** → bấm phiếu kiểm kê.',
      'Xem các dòng lệch sổ và giá trị chênh.',
      'Đúng: bấm **Duyệt kiểm kê**.',
      'Nghi sai: mở **Trả về để đếm lại**, ghi chỗ cần đếm lại, bấm **Trả về đếm lại**.',
    ],
    meo: ['Chưa nối iPOS: phần thiếu ở quầy được ghi là đã bán.'],
    link: { href: '/noi-bo/kho/duyet', chu: 'Mở Duyệt' },
  },
  {
    id: 'dang-ky-may', vai: ['quan_ly', 'chu_so_huu'],
    tieuDe: 'Đăng ký máy dùng chung',
    tomTat: 'Làm một lần trên mỗi tablet, sau khi chủ đã tạo tài khoản máy.',
    buoc: [
      'Trên **chính tablet đó**, mở màn máy dùng chung → **Đăng ký máy này**.',
      'Gõ email, mật khẩu **của quản lý**.',
      'Gõ email, mật khẩu **tài khoản máy** (chủ tạo, vai "Máy tính bảng dùng chung").',
      'Đặt **Tên máy** (ví dụ Máy quầy thịt) và **Tự khóa sau** (nên để 5 phút).',
      'Bấm **Đăng ký máy này**. Rồi từng nhân viên gắn tên và đặt PIN.',
    ],
    link: { href: '/noi-bo/kho/may/dang-ky', chu: 'Mở Đăng ký máy' },
  },
  {
    id: 'mo-khoa-may', vai: ['quan_ly', 'chu_so_huu'],
    tieuDe: 'Mở khóa máy, mở khóa người sai PIN',
    tomTat: 'Làm trên điện thoại hoặc máy tính của quản lý.',
    buoc: [
      'Mở **Thiết lập** → **Nhân viên & máy dùng chung** (quản lý: **Máy dùng chung**).',
      'Máy bị khóa: bấm **Mở khóa máy**.',
      'Một người bị khóa vì sai PIN: bấm **Mở khóa** cạnh tên người đó.',
      'Người nghỉ dùng máy: bấm **Gỡ khỏi máy**.',
      'Mất máy, thôi dùng máy: mở **Tắt máy này** → **Tắt máy**.',
    ],
    link: { href: '/noi-bo/kho/cai-dat/nhan-vien', chu: 'Mở Máy dùng chung' },
  },
  {
    id: 'bao-cao', vai: ['quan_ly', 'chu_so_huu', 'ke_toan'],
    tieuDe: 'Báo cáo',
    tomTat: 'Tồn kho, thu hồi pha lóc, hao hụt, nhập hàng, công nợ — theo kỳ.',
    buoc: [
      'Mở **Khác** → **Báo cáo**.',
      'Chọn loại báo cáo, chọn kỳ (hoặc **Từ ngày**, **Đến ngày** → **Xem**).',
      'Cần file: bấm **Tải về Excel (CSV)**.',
    ],
    link: { href: '/noi-bo/kho/bao-cao', chu: 'Mở Báo cáo' },
  },

  // ===========================================================================
  // KẾ TOÁN
  // ===========================================================================
  {
    id: 'ke-toan', vai: ['ke_toan'],
    tieuDe: 'Kế toán: việc mỗi ngày',
    tomTat: 'Điền giá phiếu nhập, đối chiếu hóa đơn, ghi thanh toán, theo dõi công nợ.',
    buoc: [
      '**Duyệt:** điền giá và duyệt phiếu nhập thủ kho gửi.',
      '**Công nợ:** đối chiếu hóa đơn VAT cho phiếu đã duyệt.',
      '**Ghi thanh toán** khi đã chuyển khoản / trả tiền mặt.',
      'Cuối tháng: **Tải công nợ (Excel)** để nhập sang MISA.',
    ],
    link: { href: '/noi-bo/kho/cong-no', chu: 'Mở Công nợ' },
  },
  {
    id: 'doi-chieu', vai: ['ke_toan'],
    tieuDe: 'Đối chiếu hóa đơn',
    tomTat: 'Ghi số hóa đơn VAT cho từng phiếu nhập đã duyệt.',
    buoc: [
      'Mở **Công nợ** → ô **phiếu chưa đối chiếu hóa đơn**.',
      'Bấm nhà cung cấp → ở phiếu cần làm mở **Đối chiếu hóa đơn**.',
      'Gõ **Số hóa đơn**, **Ngày hóa đơn**, **Tổng tiền in trên hóa đơn**.',
      'Tiền hóa đơn khác phiếu nhập thì ghi lý do lệch ở **Ghi chú** (bắt buộc).',
      'Bấm **Lưu đối chiếu**.',
    ],
    link: { href: '/noi-bo/kho/cong-no?loc=chua_doi_chieu', chu: 'Mở phiếu chưa đối chiếu' },
  },
  {
    id: 'ghi-thanh-toan', vai: ['ke_toan'],
    tieuDe: 'Ghi thanh toán',
    tomTat: 'Ghi khoản đã chuyển khoản, tiền mặt hoặc giảm trừ cho nhà cung cấp.',
    buoc: [
      'Mở **Công nợ** → bấm tên nhà cung cấp.',
      'Ở mục **Ghi thanh toán**: chọn **Loại**, gõ **Số tiền**, **Hình thức**, **Ngày**.',
      'Chụp ủy nhiệm chi / biên nhận nếu có.',
      'Bấm **Ghi thanh toán**. Không chia phiếu thì tự trả phiếu đến hạn sớm nhất trước.',
    ],
    meo: [
      'Muốn trả đúng phiếu nào: mở **Chia cho phiếu cụ thể**; tổng phải bằng số tiền trả.',
      'Ghi nhầm: mở **Hủy khoản này (ghi nhầm)**, ghi lý do, bấm **Hủy khoản**.',
    ],
    link: { href: '/noi-bo/kho/cong-no', chu: 'Mở Công nợ' },
  },
  {
    id: 'cong-no', vai: ['ke_toan', 'chu_so_huu'],
    tieuDe: 'Đọc màn Công nợ',
    tomTat: 'Còn nợ = Nhập mua − Trả hàng / giảm trừ − Đã thanh toán.',
    buoc: [
      'Bốn ô trên cùng: đang nợ, quá hạn, đến hạn trong 7 ngày, phiếu chưa đối chiếu. Bấm ô để lọc.',
      'Bấm **Xem ví dụ** để xem cách tính.',
      'Số âm (−): nhà cung cấp đang nợ lại quán, thường do trả hàng sau khi đã trả tiền.',
      'Tải file: **Tải bảng công nợ tất cả phiếu (Excel)**.',
    ],
    anh: anh('cong-no', 'Màn Công nợ nhà cung cấp'),
    link: { href: '/noi-bo/kho/cong-no', chu: 'Mở Công nợ' },
  },
  {
    id: 'no-dau', vai: ['ke_toan', 'chu_so_huu'],
    tieuDe: 'Nợ đầu kỳ (làm một lần)',
    tomTat: 'Số tiền quán còn nợ từng nhà cung cấp tới hôm bắt đầu dùng phần mềm. Chỉ là tiền, không có hàng.',
    buoc: [
      'Mở **Công nợ** → **Nợ đầu kỳ**.',
      'Ở **Ghi nợ từng nhà cung cấp**: gõ **Số tiền còn nợ**, **Hạn trả** (bỏ trống = tự tính). Không nợ thì để trống.',
      'Bấm **Xem trước**, soát lại, rồi bấm **Ghi nợ đầu kỳ**.',
      'Không nợ ai: bấm **Không có nợ đầu kỳ**.',
    ],
    meo: ['Có sẵn Excel: mở **Dán từ Excel** → **Điền vào lưới và xem trước**.'],
    link: { href: '/noi-bo/kho/cong-no/no-dau', chu: 'Mở Nợ đầu kỳ' },
  },
  {
    id: 'tra-ncc', vai: ['ke_toan'],
    tieuDe: 'Trả hàng nhà cung cấp',
    tomTat: 'Hàng lỗi trả lại: tồn giảm và công nợ tự giảm theo.',
    buoc: [
      'Mở **Công nợ** → nhà cung cấp → ở phiếu nhập bấm **Trả hàng cho nhà cung cấp →**.',
      'Chọn nơi đang để hàng, gõ **Số kg trả** (và số gói).',
      '**Tiền giảm trừ công nợ**: để trống = tự tính; ghi 0 nếu họ đổi hàng mới.',
      'Chụp biên bản trả hàng, bấm **Ghi trả hàng**.',
    ],
    meo: ['Thủ kho thấy hàng lỗi thì để riêng và báo kế toán.'],
    link: { href: '/noi-bo/kho/cong-no', chu: 'Mở Công nợ' },
  },

  // ===========================================================================
  // CHỦ QUÁN
  // ===========================================================================
  {
    id: 'thiet-lap', vai: ['chu_so_huu', 'quan_ly'],
    tieuDe: 'Thiết lập kho (10 bước trước ngày chạy thật)',
    tomTat: 'Màn Thiết lập dẫn từng bước và đếm còn bao nhiêu bước.',
    buoc: [
      'Mở **Khác** → **Thiết lập**. Chưa bắt đầu thì bấm **Bắt đầu dùng kho** (tạo sẵn kho lạnh, quầy thịt, lý do mặc định).',
      'Làm lần lượt: **Chi nhánh & nhân viên**, **Mặt hàng**, **Công thức pha lóc**, **Nhà cung cấp & nợ đầu kỳ**, **Tồn đầu kỳ**.',
      'Tiếp: **Cách tính giá vốn**, **Định mức tồn ở quầy**, **Vị trí, lý do, mã vạch**, **Ngưỡng cảnh báo**, **Máy dùng chung**.',
      'Mỗi bước có nút **Làm bước này** mở đúng màn cần làm. Bước quán không cần thì bấm **Bỏ qua**.',
      'Dòng trên cùng báo **Còn … bước** tới khi **Đã xong cả 10 bước**.',
    ],
    anh: anh('thiet-lap', 'Màn Thiết lập kho với các bước'),
    link: { href: '/noi-bo/kho/cai-dat', chu: 'Mở Thiết lập' },
  },
  {
    id: 'tao-tai-khoan', vai: ['chu_so_huu'],
    tieuDe: 'Tạo tài khoản nhân viên',
    tomTat: 'Chủ tự tạo tài khoản cho thủ kho, nhân viên quầy, kế toán và máy tính bảng.',
    buoc: [
      'Mở **Thiết lập** → **Nhân viên & máy dùng chung**.',
      'Ở **Thêm nhân viên**: điền **Họ tên**, **Email đăng nhập**, **Vai**, **Chi nhánh**.',
      'Bấm **Tạo tài khoản**. **Mật khẩu tạm** chỉ hiện **một lần** — chép lại ngay, đưa cho người đó.',
      'Máy tính bảng: tạo tài khoản vai "Máy tính bảng dùng chung" (email riêng cho máy), rồi quản lý đăng ký máy trên tablet.',
      'Nghỉ việc: bấm **Khóa tài khoản**. Không xóa, nên sổ sách vẫn đúng tên người đã làm.',
    ],
    meo: ['Báo lỗi "tắt đăng ký" hay "xác nhận email": làm đúng câu hướng dẫn hiện trên màn.'],
    link: { href: '/noi-bo/kho/cai-dat/nhan-vien', chu: 'Mở Nhân viên' },
  },
  {
    id: 'mat-hang', vai: ['chu_so_huu', 'quan_ly'],
    tieuDe: 'Mặt hàng',
    tomTat: 'Danh mục tảng, phần cắt, phụ phẩm: mã cân, hạn dùng, giá bán, mức tối thiểu ở quầy.',
    buoc: [
      'Danh mục trống: bấm **Tạo danh mục mẫu**.',
      'Thêm nhiều món: mở **Dán nhiều mặt hàng từ Excel**, dán, bấm **Xem trước** rồi **Xác nhận nhập**.',
      'Thêm một món: mở **+ Thêm một mặt hàng**.',
      'Phần cắt cần **mã cân** (để quét nhãn) và **mức tối thiểu ở quầy** (để báo quầy sắp hết).',
    ],
    link: { href: '/noi-bo/kho/cai-dat/mat-hang', chu: 'Mở Mặt hàng' },
  },
  {
    id: 'cong-thuc', vai: ['chu_so_huu', 'quan_ly'],
    tieuDe: 'Công thức pha lóc',
    tomTat: 'Mỗi loại tảng thường ra bao nhiêu % từng phần — làm mốc so thu hồi. Không bắt buộc.',
    buoc: [
      'Mở **+ Tạo công thức mới**, chọn loại tảng, bấm **Tạo công thức**.',
      'Thêm từng phần ra và tỉ lệ, bấm **Thêm / cập nhật phần ra**.',
    ],
    link: { href: '/noi-bo/kho/cai-dat/cong-thuc', chu: 'Mở Công thức pha lóc' },
  },
  {
    id: 'nha-cung-cap', vai: ['chu_so_huu', 'quan_ly', 'ke_toan'],
    tieuDe: 'Nhà cung cấp',
    tomTat: 'Tên, mã số thuế, tài khoản ngân hàng, số ngày được nợ.',
    buoc: [
      'Mở **+ Thêm nhà cung cấp**, điền thông tin, bấm **Thêm nhà cung cấp**.',
      '**Số ngày nợ** là hạn trả mặc định, tính từ ngày hóa đơn.',
    ],
    link: { href: '/noi-bo/kho/cai-dat/nha-cung-cap', chu: 'Mở Nhà cung cấp' },
  },
  {
    id: 'vi-tri-ly-do', vai: ['chu_so_huu', 'quan_ly'],
    tieuDe: 'Vị trí và lý do',
    tomTat: 'Kho lạnh, tủ mát, quầy thịt; lý do hủy, lý do xuất khác.',
    buoc: [
      'Thêm nơi để hàng: mở **+ Thêm vị trí** → **Thêm vị trí**.',
      'Thêm lý do: mở **+ Thêm …** ở bảng lý do → **Thêm**. Tích "bắt buộc ảnh" nếu lý do đó phải chụp ảnh.',
    ],
    link: { href: '/noi-bo/kho/cai-dat/vi-tri-ly-do', chu: 'Mở Vị trí và lý do' },
  },
  {
    id: 'ma-vach', vai: ['chu_so_huu', 'quan_ly'],
    tieuDe: 'Mã vạch cân',
    tomTat: 'Cách phần mềm đọc 13 số dưới mã vạch nhãn cân.',
    buoc: [
      'Lấy một nhãn thật, gõ đúng 13 số vào **Thử một nhãn thật**, bấm **Đọc thử**.',
      'Đọc ra đúng món, đúng kg là xong. Sai thì sửa mẫu rồi bấm **Lưu cách đọc nhãn**.',
    ],
    link: { href: '/noi-bo/kho/cai-dat/ma-vach', chu: 'Mở Mã vạch cân' },
  },
  {
    id: 'dong-bo-can', vai: ['chu_so_huu', 'quan_ly'],
    tieuDe: 'Đồng bộ danh mục xuống cân',
    tomTat: 'Đưa mã cân, tên, giá bán sang cân in tem qua USB.',
    buoc: [
      'Trên cân: lưu dữ liệu ra USB.',
      'Tải file đó lên màn **Đồng bộ cân**, bấm **Xem trước**.',
      'Bấm **Tải file**, chép đè vào USB, nạp lại vào cân.',
    ],
    link: { href: '/noi-bo/kho/cai-dat/can', chu: 'Mở Đồng bộ cân' },
  },
  {
    id: 'o-thong-tin', vai: ['chu_so_huu'],
    tieuDe: 'Ô thông tin thêm',
    tomTat: 'Tự thêm ô cho form, ví dụ "Xuất xứ", "Nhiệt độ khi nhận".',
    buoc: [
      'Mở **+ Tạo ô mới**, đặt tên, chọn kiểu, bấm **Tạo ô**.',
      'Tên và kiểu không đổi được sau khi tạo — muốn đổi thì tắt ô cũ, tạo ô mới.',
    ],
    link: { href: '/noi-bo/kho/cai-dat/o-thong-tin', chu: 'Mở Ô thông tin thêm' },
  },
  {
    id: 'gia-von', vai: ['chu_so_huu'],
    tieuDe: 'Cách tính giá vốn',
    tomTat: 'Chọn cách chia giá vốn tảng cho các phần cắt, có cộng chi phí và VAT hay không.',
    buoc: [
      'Mở **Thiết lập** → mục **Cách tính giá vốn và số bán**.',
      'Chọn **Giá trị bán** (khuyên dùng) hoặc **Khối lượng**.',
      'Tích cộng chi phí khác / VAT nếu cần (hỏi kế toán về VAT).',
      'Bấm **Lưu**, kể cả khi không đổi gì.',
    ],
    link: { href: '/noi-bo/kho/cai-dat#gia-von', chu: 'Mở Cách tính giá vốn' },
  },
  {
    id: 'nguong', vai: ['chu_so_huu', 'quan_ly'],
    tieuDe: 'Ngưỡng cảnh báo',
    tomTat: 'Vượt ngưỡng thì phần mềm báo quản lý. Chỉ báo, không chặn.',
    buoc: [
      'Mở **Thiết lập** → mục **Ngưỡng cảnh báo**.',
      'Sửa: giá nhập tăng quá (%), thu hồi thấp quá (điểm %), hàng ra quầy chưa nhận sau (giờ), giờ chốt ngày.',
      'Bấm **Lưu ngưỡng cảnh báo**.',
    ],
    link: { href: '/noi-bo/kho/cai-dat#nguong', chu: 'Mở Ngưỡng cảnh báo' },
  },
];

export const CAU_HOI: CauHoi[] = [
  { id: 'hoi-quen-mat-khau', hoi: 'Quên mật khẩu?',
    dap: 'Báo chủ quán để được đặt lại mật khẩu (phần mềm chưa có nút tự đặt lại). Không mượn tài khoản người khác.' },
  { id: 'hoi-quen-pin', hoi: 'Quên PIN trên máy dùng chung?',
    dap: 'Ở màn "Ai đang dùng máy?" bấm **Gắn tôi vào máy này**, đăng nhập bằng email và mật khẩu rồi đặt PIN mới.' },
  { id: 'hoi-may-khoa', hoi: 'Máy tự khóa khi đang gõ dở một phiếu?',
    dap: 'Phiếu chưa được ghi. Mở máy bằng PIN rồi làm lại phiếu đó. Làm lâu thì bấm lưu giữa chừng (**Lưu số đếm**, **+ Thêm dòng**…).' },
  { id: 'hoi-bi-khoa-pin', hoi: 'Tên tôi bị khóa vì sai PIN?',
    dap: 'Chờ 15 phút, hoặc nhờ quản lý bấm **Mở khóa** cạnh tên bạn.' },
  { id: 'hoi-bi-tra-ve', hoi: 'Phiếu của tôi bị trả về?',
    dap: 'Mở **Việc** hoặc chuông, bấm phiếu đó. Lý do ghi ở đầu phiếu. Sửa đúng chỗ đó rồi gửi lại.' },
  { id: 'hoi-quet-khong-ra', hoi: 'Quét không ra?',
    dap: 'Lau nhãn, giữ máy cách nhãn một gang tay, đủ sáng. Máy quét cầm tay thì bấm vào ô quét trước. Vẫn không được thì gõ 13 số dưới mã vạch.' },
  { id: 'hoi-nhan-loi', hoi: 'Quét ra "không đọc được nhãn" hoặc sai món?',
    dap: 'Nhãn in lỗi hoặc món chưa có mã cân. Để riêng gói đó, báo quản lý kiểm **Mã vạch cân** và mã cân của món. Trong lúc chờ, chọn món và gõ số tay.' },
  { id: 'hoi-hang-thieu', hoi: 'Nhà cung cấp giao thiếu hàng?',
    dap: 'Chỉ ghi số thật cân / đếm được. Ghi chú số thiếu trên phiếu và chụp hóa đơn đầy đủ — kế toán sẽ đối chiếu.' },
  { id: 'hoi-quet-thua', hoi: 'Lỡ quét thừa một gói?',
    dap: 'Bấm **−1** ở món đó, hoặc **Bỏ lượt vừa quét** để bỏ cả lượt vừa quét.' },
  { id: 'hoi-chip-do', hoi: 'Chip đỏ cạnh giá là gì?',
    dap: 'Giá lần này cao hơn lần nhập trước cùng nhà cung cấp quá ngưỡng (mặc định 5%). Chỉ là cảnh báo — kiểm lại hóa đơn rồi vẫn duyệt được.' },
  { id: 'hoi-sua-phieu-da-duyet', hoi: 'Phiếu đã duyệt rồi mới thấy sai?',
    dap: 'Phiếu đã duyệt không sửa trực tiếp được. Báo quản lý: phiếu nhập thì hủy phiếu (khi hàng chưa bị dùng) rồi lập lại; số tồn sai thì kiểm kê lại.' },
  { id: 'hoi-het-han', hoi: 'Hàng hết hạn thì làm gì?',
    dap: 'Lấy ra khỏi quầy / kho ngay, **Báo hủy** kèm ảnh. Lô hết hạn không mang ra quầy hay xuất bếp được.' },
  { id: 'hoi-khong-thay-nut', hoi: 'Không thấy nút hay mục mà người khác có?',
    dap: 'Mỗi vai thấy những việc của vai đó. Thiếu việc cần làm thì nhờ chủ quán kiểm vai của tài khoản bạn.' },
  { id: 'hoi-cai-app', hoi: 'Cài kho lên màn hình điện thoại thế nào?',
    dap: 'Android (Chrome): nút ⋮ → **Thêm vào màn hình chính**. iPhone (Safari): nút **Chia sẻ** → **Thêm vào MH chính**.' },
  { id: 'hoi-mat-mang', hoi: 'Mất mạng giữa chừng?',
    dap: 'Phần mềm cần mạng để ghi. Bấm nút mà báo lỗi thì chờ có mạng rồi bấm lại — phiếu không bị ghi hai lần.' },
  { id: 'hoi-so-do', hoi: 'Số đỏ trên nút là gì?',
    dap: 'Số việc đang chờ bạn ở mục đó. Làm xong thì số tự giảm.' },
  { id: 'hoi-ai-xem-gia', hoi: 'Ai xem được giá?',
    dap: 'Chỉ quản lý, kế toán và chủ quán. Thủ kho và nhân viên quầy chỉ thấy kg, gói, hạn dùng.' },
  { id: 'hoi-nhan-thieu-quay', hoi: 'Hàng mang ra quầy bị thiếu?',
    dap: 'Nhân viên quầy bấm **Thiếu — ghi số nhận** và ghi số thật. Quản lý sẽ trả phần thiếu về kho hoặc ghi mất.' },
];

/** Mục thuộc vai (có vai trong danh sách `vai`). */
export function mucCuaVai(vai: VaiHuongDan): MucHuongDan[] {
  return MUC_HUONG_DAN.filter(m => m.vai.includes(vai));
}

/** Nhóm hiển thị của một mục = vai đầu tiên. */
export function nhomCua(m: MucHuongDan): VaiHuongDan { return m.vai[0]; }
