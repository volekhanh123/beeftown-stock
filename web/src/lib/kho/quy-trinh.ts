/**
 * KHO — CÁC QUY TRÌNH (màn "Quy trình", giống màn Nghiệp vụ của iPOS)
 *
 * Mỗi nghiệp vụ là vài bước đánh số, mỗi bước một câu giải thích và một nút
 * "Làm bước này". Bước nào đang có việc chờ thì hiện số đỏ (khóa kho_dem_viec).
 * Người mới nhìn là biết thứ tự công việc và việc nào của ai.
 *
 * File thuần — test kiểm mọi link trỏ tới trang có thật và mọi khóa đếm là
 * khóa kho_dem_viec có thật.
 *
 * Hai thứ tiếng (lib/ngon-ngu-noi-bo.ts): tên, giới thiệu, tên bước, mô tả,
 * chữ nút và người làm là cặp { vi, en } — trang đọc [nn]. Bản tiếng Anh dùng
 * đúng tên menu / chữ nút của giao diện tiếng Anh.
 */

import type { HaiThuTieng, ViecKho } from './chung.ts';
import type { TenBieuTuong } from './bieu-tuong.ts';

export interface BuocQuyTrinh {
  ten: HaiThuTieng;
  moTa: HaiThuTieng;
  link: string;
  nut?: HaiThuTieng;
  /** Người làm bước này (chữ, để hiện khi người xem không có quyền). */
  ai: HaiThuTieng;
  quyen: ViecKho[];
  dem?: string[];
}

export interface QuyTrinh {
  ma: string;
  ten: HaiThuTieng;
  bieuTuong: TenBieuTuong;
  gioiThieu: HaiThuTieng;
  buoc: BuocQuyTrinh[];
}

// Người làm — dùng lại ở nhiều bước.
const AI = {
  quanLy: { vi: 'Quản lý', en: 'Manager' },
  thuKho: { vi: 'Thủ kho', en: 'Storekeeper' },
  keToan: { vi: 'Kế toán', en: 'Accountant' },
  nvQuay: { vi: 'NV quầy', en: 'Counter staff' },
  nvQuayThuKho: { vi: 'NV quầy / Thủ kho', en: 'Counter staff / Storekeeper' },
  keToanQuanLy: { vi: 'Kế toán / Quản lý', en: 'Accountant / Manager' },
} satisfies Record<string, HaiThuTieng>;

export const QUY_TRINH: QuyTrinh[] = [
  {
    ma: 'nhan-hang', ten: { vi: 'Nhận hàng', en: 'Receiving' }, bieuTuong: 'nhap',
    gioiThieu: {
      vi: 'Quản lý đặt hàng (phần mềm gợi ý số kg). Hàng về: thủ kho chụp, cân, gửi — không cần biết giá. Kế toán hoặc quản lý điền giá từ ảnh hóa đơn rồi duyệt; hàng chỉ vào tồn khi đã duyệt.',
      en: 'The manager places the order (the app suggests the kg). When the goods arrive, the storekeeper photographs, weighs and submits — no prices needed. The accountant or manager enters prices from the invoice photo and approves; goods go into stock only once approved.',
    },
    buoc: [
      // GĐ8a (0039): đặt hàng trước khi hàng về. Số đỏ: đơn quá ngày giao chưa thấy hàng.
      { ten: { vi: 'Đặt hàng nhà cung cấp', en: 'Order from the supplier' }, ai: AI.quanLy, quyen: ['nhap'],
        moTa: { vi: 'Chọn nhà cung cấp — phần mềm gợi ý số kg nên đặt theo tồn kho và lượng dùng 28 ngày. Sửa số, bấm Gửi, rồi in / lưu PDF gửi Zalo.',
                en: 'Choose the supplier — the app suggests how many kg to order from the stock and 28 days of usage. Adjust the numbers, press Send, then print / save a PDF to send on Zalo.' },
        link: '/noi-bo/kho/dat-hang/moi', nut: { vi: 'Lập đơn', en: 'New order' }, dem: ['don_dat_tre'] },
      { ten: { vi: 'Chụp hóa đơn', en: 'Photograph the invoice' }, ai: AI.thuKho, quyen: ['nhap'],
        moTa: { vi: 'Hàng theo đơn đặt: bấm "Nhận theo đơn này" để có sẵn món và kg. Chọn nhà cung cấp, chụp hóa đơn / phiếu giao hàng. Phiếu mua bắt buộc có ảnh.',
                en: 'Goods for a purchase order: press "Receive against this order" to fill in the items and kg. Choose the supplier and photograph the invoice / delivery note. A purchase must have a photo.' },
        link: '/noi-bo/kho/nhan-hang/moi' },
      { ten: { vi: 'Cân, đếm từng món', en: 'Weigh and count each item' }, ai: AI.thuKho, quyen: ['nhap'],
        moTa: { vi: 'Mỗi món một dòng: số kg cân được, số tảng / gói. Không phải ghi giá.',
                en: 'One line per item: the kg weighed and the number of primals / packs. No prices needed.' },
        link: '/noi-bo/kho/nhan-hang', dem: ['nhap_nhap'] },
      { ten: { vi: 'Xem lại và gửi', en: 'Review and submit' }, ai: AI.thuKho, quyen: ['nhap'],
        moTa: { vi: 'Soát lại rồi Gửi. Phiếu bị trả về thì sửa theo lý do rồi gửi lại.',
                en: 'Check it, then Send. If the note is sent back, fix what the reason says and send it again.' },
        link: '/noi-bo/kho/nhan-hang', dem: ['nhap_bi_tra'] },
      { ten: { vi: 'Điền giá và duyệt', en: 'Enter prices and approve' }, ai: AI.keToanQuanLy, quyen: ['duyet_nhap'],
        moTa: { vi: 'Nhìn ảnh hóa đơn, gõ đơn giá từng món. Giá cao hơn lần trước quá ngưỡng thì phần mềm ghi "vượt ngưỡng". Duyệt thì hàng vào tồn; từ chối thì trả về kèm lý do.',
                en: 'Look at the invoice photo and type each item\'s unit price. A price that rose more than the threshold since last time is marked "over threshold". Approve and the goods go into stock; reject and the note goes back with a reason.' },
        link: '/noi-bo/kho/duyet', dem: ['duyet_nhap'] },
      { ten: { vi: 'Đối chiếu, trả tiền nhà cung cấp', en: 'Reconcile and pay the supplier' }, ai: AI.keToan, quyen: ['ke_toan'],
        moTa: { vi: 'Ghi hóa đơn VAT, rồi ghi khoản đã chuyển khoản / tiền mặt. Không chọn phiếu thì tự trả phiếu đến hạn sớm nhất trước.',
                en: 'Record the VAT invoice, then the bank transfer / cash payment. If you do not pick receipts, the one due soonest is paid first.' },
        link: '/noi-bo/kho/cong-no?loc=chua_doi_chieu', dem: ['chua_doi_chieu', 'cong_no_qua_han'] },
    ],
  },
  {
    ma: 'pha-loc', ten: { vi: 'Pha lóc', en: 'Butchery' }, bieuTuong: 'dao',
    gioiThieu: {
      vi: 'Tảng thịt → các phần cắt đóng gói. Phần mềm tính tỉ lệ thu hồi và giá vốn thật mỗi kg.',
      en: 'Primal → packed cuts. The app works out the yield and the real cost per kg.',
    },
    buoc: [
      // GĐ5c (0033): gói cắt ra nào cũng có nhãn cân → quét nhãn; phụ phẩm, mỡ bỏ gõ kg.
      { ten: { vi: 'Chọn tảng, quét nhãn từng gói', en: 'Choose the primal, scan each pack' }, ai: AI.thuKho, quyen: ['pha_loc'],
        moTa: { vi: 'Bấm loại tảng đem pha, quét nhãn từng gói cắt ra (số gói, số kg tự cộng). Phụ phẩm, mỡ bỏ thì cân rồi gõ kg.',
                en: 'Press the type of primal you are cutting, then scan the label of each pack (packs and kg add up automatically). Weigh by-products and fat to discard, and type the kg.' },
        link: '/noi-bo/kho/pha-loc/moi', dem: ['pha_nhap'] },
      { ten: { vi: 'Xem kết quả, chốt', en: 'Check the results, close' }, ai: AI.thuKho, quyen: ['pha_loc'],
        moTa: { vi: 'Xem thu hồi so với dự kiến và trung bình 30 ngày. Lệch nhiều thì cân lại. Chốt xong: tảng rời kho, gói mới vào kho lạnh hoặc quầy tùy món.',
                en: 'Compare the yield with the expected yield and the 30-day average. Far off? Weigh again. Once closed, the primal leaves stock and the new packs go into the cold store or the counter, depending on the item.' },
        link: '/noi-bo/kho/pha-loc' },
      { ten: { vi: 'Xem phiên thu hồi thấp', en: 'Review low-yield sessions' }, ai: AI.quanLy, quyen: ['duyet'],
        moTa: { vi: 'Thu hồi thấp hơn dự kiến quá ngưỡng thì phần mềm tự báo. Mở phiên, xem số cân, bấm "Đã xem".',
                en: 'When the yield is below the expected yield by more than the threshold, the app alerts you. Open the session, check the weights, press "Seen".' },
        link: '/noi-bo/kho/pha-loc', dem: ['thu_hoi_thap'] },
      { ten: { vi: 'Mang gói ra quầy', en: 'Bring packs to the counter' }, ai: AI.thuKho, quyen: ['van_hanh'],
        moTa: { vi: 'Gói nào để kho lạnh thì mang ra quầy khi quầy cần. Quét nhãn cho nhanh.',
                en: 'Packs kept in the cold store go out to the counter when it needs them. Scan the labels to go faster.' },
        link: '/noi-bo/kho/xuat/moi?loai=chuyen' },
    ],
  },
  {
    ma: 'quay', ten: { vi: 'Quầy mỗi ngày', en: 'Daily counter' }, bieuTuong: 'quay',
    gioiThieu: {
      vi: 'Việc hằng ngày ở quầy thịt: bán trước gói hạn gần, quầy thiếu thì yêu cầu — thủ kho mang ra — quầy kiểm và bấm nhận, bỏ hàng hỏng, đếm cuối ngày.',
      en: 'Everyday work at the meat counter: sell the packs that expire soonest first; when the counter runs low, request stock — the storekeeper brings it out — the counter checks and confirms; throw out damaged goods; count at the end of the day.',
    },
    buoc: [
      { ten: { vi: 'Sáng: xếp gói hạn gần lên trước', en: 'Morning: put the packs expiring soonest at the front' }, ai: AI.nvQuay, quyen: ['xem'],
        moTa: { vi: 'Xem gói nào sắp hết hạn và đặt chúng ở phía trước để khách lấy trước.',
                en: 'See which packs are expiring soon and put them at the front so customers take them first.' },
        link: '/noi-bo/kho/ton?vi_tri=quay', dem: ['sap_het_han'] },
      { ten: { vi: 'Quầy thiếu → gửi yêu cầu', en: 'Counter running low → send a request' }, ai: AI.nvQuay, quyen: ['van_hanh'],
        moTa: { vi: 'Phần mềm tự liệt kê món quầy sắp hết kèm số gói nên lấy. Sửa số nếu cần, thêm món khác, rồi gửi cho thủ kho.',
                en: 'The app lists the counter items running low, with the suggested number of packs. Adjust if needed, add other items, then send it to the storekeeper.' },
        link: '/noi-bo/kho/quay/yeu-cau', nut: { vi: 'Yêu cầu hàng', en: 'Request stock' }, dem: ['quay_duoi_muc'] },
      { ten: { vi: 'Mang hàng ra quầy', en: 'Bring the goods to the counter' }, ai: AI.thuKho, quyen: ['van_hanh'],
        moTa: { vi: 'Mở yêu cầu, bấm "Mang ra quầy". Hệ thống tự lấy gói hạn gần trước; kho không đủ thì sửa số trước khi bấm.',
                en: 'Open the request and press "Bring to counter". The system takes the packs expiring soonest first; if the store does not have enough, change the numbers before pressing.' },
        link: '/noi-bo/kho/quay/yeu-cau', nut: { vi: 'Xem yêu cầu', en: 'View requests' }, dem: ['yeu_cau_quay'] },
      { ten: { vi: 'Kiểm hàng, bấm "Đã nhận"', en: 'Check the goods, press "Received in full"' }, ai: AI.nvQuay, quyen: ['van_hanh'],
        moTa: { vi: 'Đếm đủ thì bấm "Đã nhận đủ". Thiếu thì ghi số gói thực nhận — phần mềm báo quản lý. Người mang ra không tự bấm nhận được.',
                en: 'If everything is there, press "Received in full". If not, enter the packs that actually arrived — the app alerts the manager. The person who brought the goods cannot confirm them.' },
        link: '/noi-bo/kho/quay/nhan', nut: { vi: 'Nhận hàng', en: 'Receive' }, dem: ['hang_dang_chuyen'] },
      { ten: { vi: 'Nhận thiếu → quản lý xử lý', en: 'Received short → the manager handles it' }, ai: AI.quanLy, quyen: ['duyet'],
        moTa: { vi: 'Mở phiếu nhận thiếu: hàng còn ở kho thì "Trả về kho"; rơi vỡ, thất lạc thì "Ghi mất" kèm lý do.',
                en: 'Open the short-received slip: goods still in the store → "Return to store"; dropped or lost → "Record as lost" with a reason.' },
        link: '/noi-bo/kho/xuat', dem: ['chuyen_nhan_thieu'] },
      { ten: { vi: 'Hàng hỏng, hết hạn → báo hủy', en: 'Damaged or expired → report a write-off' }, ai: AI.nvQuay, quyen: ['van_hanh'],
        moTa: { vi: 'Chọn gói, chọn lý do, chụp ảnh. Hàng rời quầy ngay, chờ quản lý duyệt.',
                en: 'Choose the pack, choose a reason, take a photo. The goods leave the counter at once and wait for the manager\'s approval.' },
        link: '/noi-bo/kho/xuat/moi?loai=huy', dem: ['het_han'] },
      { ten: { vi: 'Cuối ngày: đếm quầy', en: 'End of day: counter count' }, ai: AI.nvQuay, quyen: ['van_hanh'],
        moTa: { vi: 'Quét nhãn từng gói còn trên quầy rồi gửi. Chưa nối iPOS: phần thiếu được tính là đã bán. Còn hàng chưa bấm nhận thì nhận trước rồi mới gửi được.',
                en: 'Scan every pack left on the counter, then send. Without iPOS, whatever is missing counts as sold. Goods not yet confirmed must be received before you can send.' },
        link: '/noi-bo/kho/quay/dem', dem: ['quay_chua_dem', 'kiem_ke_tra_ve'] },
    ],
  },
  {
    ma: 'hong-huy', ten: { vi: 'Hỏng hủy', en: 'Write-offs' }, bieuTuong: 'huy',
    gioiThieu: {
      vi: 'Hàng hết hạn, hư hỏng. Bắt buộc có lý do và ảnh; quản lý duyệt mới ghi mất.',
      en: 'Expired or damaged goods. A reason and a photo are required; they are written off only when the manager approves.',
    },
    buoc: [
      { ten: { vi: 'Báo hủy (có ảnh)', en: 'Report a write-off (with a photo)' }, ai: AI.nvQuayThuKho, quyen: ['van_hanh'],
        moTa: { vi: 'Hàng chuyển sang "chờ hủy" ngay, không bị đếm nhầm là đã bán.',
                en: 'The goods move to "awaiting write-off" at once, so they are not counted as sold by mistake.' },
        link: '/noi-bo/kho/xuat/moi?loai=huy', dem: ['het_han', 'huy_bi_tra'] },
      { ten: { vi: 'Duyệt hoặc trả lại', en: 'Approve or reject' }, ai: AI.quanLy, quyen: ['duyet'],
        moTa: { vi: 'Xem ảnh và lý do. Duyệt thì ghi hủy; từ chối thì hàng về lại chỗ cũ.',
                en: 'Look at the photo and the reason. Approve to write the goods off; reject and they go back where they were.' },
        link: '/noi-bo/kho/duyet', dem: ['duyet_huy'] },
      { ten: { vi: 'Xem báo cáo hủy', en: 'View the write-off report' }, ai: AI.quanLy, quyen: ['xem_gia'],
        moTa: { vi: 'Hủy bao nhiêu kg, bao nhiêu tiền, vì lý do gì — theo tuần, tháng.',
                en: 'How many kg and how much money were written off, and why — by week or by month.' },
        link: '/noi-bo/kho/bao-cao/hao-hut', nut: { vi: 'Xem báo cáo', en: 'View report' } },
    ],
  },
  {
    ma: 'kiem-ke', ten: { vi: 'Kiểm kê', en: 'Stocktake' }, bieuTuong: 'kiem_ke',
    gioiThieu: {
      vi: 'Đếm thật, so với sổ, quản lý duyệt phần chênh. Quầy đếm mỗi tối, kho lạnh theo lịch.',
      en: 'Count what is really there, compare it with the books, and the manager approves the differences. The counter is counted every evening, the cold store on a schedule.',
    },
    buoc: [
      { ten: { vi: 'Bắt đầu đếm', en: 'Start counting' }, ai: AI.nvQuayThuKho, quyen: ['van_hanh'],
        moTa: { vi: 'Chọn quầy hoặc kho lạnh. Người đếm không thấy số trên sổ khi đang đếm.',
                en: 'Choose the counter or the cold store. The person counting does not see the book figures while counting.' },
        link: '/noi-bo/kho/kiem-ke' },
      { ten: { vi: 'Quét hoặc đếm từng món', en: 'Scan or count each item' }, ai: AI.nvQuayThuKho, quyen: ['van_hanh'],
        moTa: { vi: 'Quét nhãn cân là nhanh nhất. Món hết thật thì bấm "Đã hết".',
                en: 'Scanning scale labels is fastest. If an item has really run out, press "None left".' },
        link: '/noi-bo/kho/kiem-ke', dem: ['kiem_ke_tra_ve'] },
      { ten: { vi: 'Gửi quản lý', en: 'Send to the manager' }, ai: AI.nvQuayThuKho, quyen: ['van_hanh'],
        moTa: { vi: 'Gửi xong, phần mềm chụp lại số trên sổ để so.',
                en: 'Once it is sent, the app takes a snapshot of the book figures to compare against.' },
        link: '/noi-bo/kho/kiem-ke', dem: ['quay_chua_dem'] },
      { ten: { vi: 'Duyệt chênh lệch', en: 'Approve the differences' }, ai: AI.quanLy, quyen: ['duyet'],
        moTa: { vi: 'Duyệt thì tồn kho được sửa theo số đếm. Nghi đếm sai thì trả về đếm lại.',
                en: 'Approving corrects the stock to the counted figures. If you suspect a counting mistake, send it back for a recount.' },
        link: '/noi-bo/kho/duyet', dem: ['duyet_kiem_ke'] },
    ],
  },
  {
    ma: 'cong-no', ten: { vi: 'Công nợ', en: 'Payables' }, bieuTuong: 'cong_no',
    gioiThieu: {
      vi: 'Còn phải trả = Nợ đầu kỳ + Mua − Đã trả − Giảm trừ.',
      en: 'Still to pay = Opening balance + Purchases − Paid − Deductions.',
    },
    buoc: [
      { ten: { vi: 'Đối chiếu hóa đơn', en: 'Reconcile invoices' }, ai: AI.keToan, quyen: ['ke_toan'],
        moTa: { vi: 'Ghi hóa đơn VAT cho từng phiếu nhập đã duyệt.',
                en: 'Record the VAT invoice for each approved goods receipt.' },
        link: '/noi-bo/kho/cong-no?loc=chua_doi_chieu', dem: ['chua_doi_chieu'] },
      { ten: { vi: 'Ghi thanh toán', en: 'Record payment' }, ai: AI.keToan, quyen: ['ke_toan'],
        moTa: { vi: 'Chuyển khoản / tiền mặt / giảm trừ. Tự chia cho phiếu đến hạn sớm nhất.',
                en: 'Bank transfer / cash / deduction. It is allocated automatically to the receipt due soonest.' },
        link: '/noi-bo/kho/cong-no', dem: ['cong_no_qua_han'] },
      { ten: { vi: 'Hóa đơn gộp', en: 'Combined invoice' }, ai: AI.keToan, quyen: ['ke_toan'],
        moTa: { vi: 'NCC xuất một hóa đơn cho nhiều lần giao: chọn các phiếu, ghi số hóa đơn — tự chia tiền vào từng phiếu.',
                en: 'The supplier issues one invoice for several deliveries: pick the receipts, enter the invoice number — the money is split across them automatically.' },
        link: '/noi-bo/kho/cong-no?tab=ncc' },
      { ten: { vi: 'Trả hàng nhà cung cấp', en: 'Return to supplier' },
        ai: { vi: 'Thủ kho ghi kg · Kế toán xác nhận tiền', en: 'Storekeeper (kg) · Accountant (amount)' }, quyen: ['nhap', 'ke_toan'],
        moTa: { vi: 'Thủ kho ghi số kg trả (hàng rời kho ngay), kế toán xác nhận với nhà cung cấp.',
                en: 'The storekeeper records the kg returned (the goods leave stock at once); the accountant confirms with the supplier.' },
        link: '/noi-bo/kho/cong-no/tra-hang', dem: ['tra_hang_cho_tien'] },
      { ten: { vi: 'Xuất sang MISA', en: 'Export to MISA' }, ai: AI.keToan, quyen: ['ke_toan'],
        moTa: { vi: 'Chọn kỳ, xem trước, tải file CSV để nhập khẩu vào MISA.',
                en: 'Choose a period, preview, then download the CSV file to import into MISA.' },
        link: '/noi-bo/kho/cong-no/misa', nut: { vi: 'Mở', en: 'Open' } },
      { ten: { vi: 'Tải bảng công nợ', en: 'Download payables' }, ai: AI.keToan, quyen: ['ke_toan'],
        moTa: { vi: 'File Excel (CSV) để gửi hoặc lưu lại.',
                en: 'An Excel (CSV) file to send or keep.' },
        link: '/noi-bo/kho/bao-cao/cong-no.csv', nut: { vi: 'Tải về', en: 'Download' } },
    ],
  },
];

export function timQuyTrinh(ma: string | null | undefined): QuyTrinh {
  return QUY_TRINH.find(q => q.ma === ma) ?? QUY_TRINH[0];
}
