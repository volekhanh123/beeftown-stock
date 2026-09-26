/**
 * KHO — CÁC QUY TRÌNH (màn "Quy trình", giống màn Nghiệp vụ của iPOS)
 *
 * Mỗi nghiệp vụ là vài bước đánh số, mỗi bước một câu giải thích và một nút
 * "Làm bước này". Bước nào đang có việc chờ thì hiện số đỏ (khóa kho_dem_viec).
 * Người mới nhìn là biết thứ tự công việc và việc nào của ai.
 *
 * File thuần — test kiểm mọi link trỏ tới trang có thật và mọi khóa đếm là
 * khóa kho_dem_viec có thật.
 */

import type { ViecKho } from './chung.ts';
import type { TenBieuTuong } from './bieu-tuong.ts';

export interface BuocQuyTrinh {
  ten: string;
  moTa: string;
  link: string;
  nut?: string;
  /** Người làm bước này (chữ, để hiện khi người xem không có quyền). */
  ai: string;
  quyen: ViecKho[];
  dem?: string[];
}

export interface QuyTrinh {
  ma: string;
  ten: string;
  bieuTuong: TenBieuTuong;
  gioiThieu: string;
  buoc: BuocQuyTrinh[];
}

export const QUY_TRINH: QuyTrinh[] = [
  {
    ma: 'nhan-hang', ten: 'Nhận hàng', bieuTuong: 'nhap',
    gioiThieu: 'Quản lý đặt hàng (phần mềm gợi ý số kg). Hàng về: thủ kho chụp, cân, gửi — không cần biết giá. Kế toán hoặc quản lý điền giá từ ảnh hóa đơn rồi duyệt; hàng chỉ vào tồn khi đã duyệt.',
    buoc: [
      // GĐ8a (0039): đặt hàng trước khi hàng về. Số đỏ: đơn quá ngày giao chưa thấy hàng.
      { ten: 'Đặt hàng nhà cung cấp', ai: 'Quản lý', quyen: ['nhap'],
        moTa: 'Chọn nhà cung cấp — phần mềm gợi ý số kg nên đặt theo tồn kho và lượng dùng 28 ngày. Sửa số, bấm Gửi, rồi in / lưu PDF gửi Zalo.',
        link: '/noi-bo/kho/dat-hang/moi', nut: 'Lập đơn', dem: ['don_dat_tre'] },
      { ten: 'Chụp hóa đơn', ai: 'Thủ kho', quyen: ['nhap'],
        moTa: 'Hàng theo đơn đặt: bấm "Nhận theo đơn này" để có sẵn món và kg. Chọn nhà cung cấp, chụp hóa đơn / phiếu giao hàng. Phiếu mua bắt buộc có ảnh.',
        link: '/noi-bo/kho/nhan-hang/moi' },
      { ten: 'Cân, đếm từng món', ai: 'Thủ kho', quyen: ['nhap'],
        moTa: 'Mỗi món một dòng: số kg cân được, số tảng / gói. Không phải ghi giá.',
        link: '/noi-bo/kho/nhan-hang', dem: ['nhap_nhap'] },
      { ten: 'Xem lại và gửi', ai: 'Thủ kho', quyen: ['nhap'],
        moTa: 'Soát lại rồi Gửi. Phiếu bị trả về thì sửa theo lý do rồi gửi lại.',
        link: '/noi-bo/kho/nhan-hang', dem: ['nhap_bi_tra'] },
      { ten: 'Điền giá và duyệt', ai: 'Kế toán / Quản lý', quyen: ['duyet_nhap'],
        moTa: 'Nhìn ảnh hóa đơn, gõ đơn giá từng món. Giá cao hơn lần trước quá ngưỡng thì phần mềm tô đỏ. Duyệt thì hàng vào tồn; từ chối thì trả về kèm lý do.',
        link: '/noi-bo/kho/duyet', dem: ['duyet_nhap'] },
      { ten: 'Đối chiếu, trả tiền nhà cung cấp', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'Ghi hóa đơn VAT, rồi ghi khoản đã chuyển khoản / tiền mặt. Không chọn phiếu thì tự trả phiếu đến hạn sớm nhất trước.',
        link: '/noi-bo/kho/cong-no?loc=chua_doi_chieu', dem: ['chua_doi_chieu', 'cong_no_qua_han'] },
    ],
  },
  {
    ma: 'pha-loc', ten: 'Pha lóc', bieuTuong: 'dao',
    gioiThieu: 'Tảng thịt → các phần cắt đóng gói. Phần mềm tính tỉ lệ thu hồi và giá vốn thật mỗi kg.',
    buoc: [
      // GĐ5c (0033): gói cắt ra nào cũng có nhãn cân → quét nhãn; phụ phẩm, mỡ bỏ gõ kg.
      { ten: 'Chọn tảng, quét nhãn từng gói', ai: 'Thủ kho', quyen: ['pha_loc'],
        moTa: 'Bấm loại tảng đem pha, quét nhãn từng gói cắt ra (số gói, số kg tự cộng). Phụ phẩm, mỡ bỏ thì cân rồi gõ kg.',
        link: '/noi-bo/kho/pha-loc/moi', dem: ['pha_nhap'] },
      { ten: 'Xem kết quả, chốt', ai: 'Thủ kho', quyen: ['pha_loc'],
        moTa: 'Xem thu hồi so với dự kiến và trung bình 30 ngày. Lệch nhiều thì cân lại. Chốt xong: tảng rời kho, gói mới vào kho lạnh hoặc quầy tùy món.',
        link: '/noi-bo/kho/pha-loc' },
      { ten: 'Xem phiên thu hồi thấp', ai: 'Quản lý', quyen: ['duyet'],
        moTa: 'Thu hồi thấp hơn dự kiến quá ngưỡng thì phần mềm tự báo. Mở phiên, xem số cân, bấm "Đã xem".',
        link: '/noi-bo/kho/pha-loc', dem: ['thu_hoi_thap'] },
      { ten: 'Mang gói ra quầy', ai: 'Thủ kho', quyen: ['van_hanh'],
        moTa: 'Gói nào để kho lạnh thì mang ra quầy khi quầy cần. Quét nhãn cho nhanh.',
        link: '/noi-bo/kho/xuat/moi?loai=chuyen' },
    ],
  },
  {
    ma: 'quay', ten: 'Quầy mỗi ngày', bieuTuong: 'quay',
    gioiThieu: 'Việc hằng ngày ở quầy thịt: bán trước gói hạn gần, quầy thiếu thì yêu cầu — thủ kho mang ra — quầy kiểm và bấm nhận, bỏ hàng hỏng, đếm cuối ngày.',
    buoc: [
      { ten: 'Sáng: xếp gói hạn gần lên trước', ai: 'NV quầy', quyen: ['xem'],
        moTa: 'Xem gói nào sắp hết hạn và đặt chúng ở phía trước để khách lấy trước.',
        link: '/noi-bo/kho/ton?vi_tri=quay', dem: ['sap_het_han'] },
      { ten: 'Quầy thiếu → gửi yêu cầu', ai: 'NV quầy', quyen: ['van_hanh'],
        moTa: 'Phần mềm tự liệt kê món quầy sắp hết kèm số gói nên lấy. Sửa số nếu cần, thêm món khác, rồi gửi cho thủ kho.',
        link: '/noi-bo/kho/quay/yeu-cau', nut: 'Yêu cầu hàng', dem: ['quay_duoi_muc'] },
      { ten: 'Mang hàng ra quầy', ai: 'Thủ kho', quyen: ['van_hanh'],
        moTa: 'Mở yêu cầu, bấm "Mang ra quầy". Hệ thống tự lấy gói hạn gần trước; kho không đủ thì sửa số trước khi bấm.',
        link: '/noi-bo/kho/quay/yeu-cau', nut: 'Xem yêu cầu', dem: ['yeu_cau_quay'] },
      { ten: 'Kiểm hàng, bấm "Đã nhận"', ai: 'NV quầy', quyen: ['van_hanh'],
        moTa: 'Đếm đủ thì bấm "Đã nhận đủ". Thiếu thì ghi số gói thực nhận — phần mềm báo quản lý. Người mang ra không tự bấm nhận được.',
        link: '/noi-bo/kho/quay/nhan', nut: 'Nhận hàng', dem: ['hang_dang_chuyen'] },
      { ten: 'Nhận thiếu → quản lý xử lý', ai: 'Quản lý', quyen: ['duyet'],
        moTa: 'Mở phiếu nhận thiếu: hàng còn ở kho thì "Trả về kho"; rơi vỡ, thất lạc thì "Ghi mất" kèm lý do.',
        link: '/noi-bo/kho/xuat', dem: ['chuyen_nhan_thieu'] },
      { ten: 'Hàng hỏng, hết hạn → báo hủy', ai: 'NV quầy', quyen: ['van_hanh'],
        moTa: 'Chọn gói, chọn lý do, chụp ảnh. Hàng rời quầy ngay, chờ quản lý duyệt.',
        link: '/noi-bo/kho/xuat/moi?loai=huy', dem: ['het_han'] },
      { ten: 'Cuối ngày: đếm quầy', ai: 'NV quầy', quyen: ['van_hanh'],
        moTa: 'Quét nhãn từng gói còn trên quầy rồi gửi. Chưa nối iPOS: phần thiếu được tính là đã bán. Còn hàng chưa bấm nhận thì nhận trước rồi mới gửi được.',
        link: '/noi-bo/kho/quay/dem', dem: ['quay_chua_dem', 'kiem_ke_tra_ve'] },
    ],
  },
  {
    ma: 'hong-huy', ten: 'Hỏng hủy', bieuTuong: 'huy',
    gioiThieu: 'Hàng hết hạn, hư hỏng. Bắt buộc có lý do và ảnh; quản lý duyệt mới ghi mất.',
    buoc: [
      { ten: 'Báo hủy (có ảnh)', ai: 'NV quầy / Thủ kho', quyen: ['van_hanh'],
        moTa: 'Hàng chuyển sang "chờ hủy" ngay, không bị đếm nhầm là đã bán.',
        link: '/noi-bo/kho/xuat/moi?loai=huy', dem: ['het_han', 'huy_bi_tra'] },
      { ten: 'Duyệt hoặc trả lại', ai: 'Quản lý', quyen: ['duyet'],
        moTa: 'Xem ảnh và lý do. Duyệt thì ghi hủy; từ chối thì hàng về lại chỗ cũ.',
        link: '/noi-bo/kho/duyet', dem: ['duyet_huy'] },
      { ten: 'Xem báo cáo hủy', ai: 'Quản lý', quyen: ['xem_gia'],
        moTa: 'Hủy bao nhiêu kg, bao nhiêu tiền, vì lý do gì — theo tuần, tháng.',
        link: '/noi-bo/kho/bao-cao/hao-hut', nut: 'Xem báo cáo' },
    ],
  },
  {
    ma: 'kiem-ke', ten: 'Kiểm kê', bieuTuong: 'kiem_ke',
    gioiThieu: 'Đếm thật, so với sổ, quản lý duyệt phần chênh. Quầy đếm mỗi tối, kho lạnh theo lịch.',
    buoc: [
      { ten: 'Bắt đầu đếm', ai: 'NV quầy / Thủ kho', quyen: ['van_hanh'],
        moTa: 'Chọn quầy hoặc kho lạnh. Người đếm không thấy số trên sổ khi đang đếm.',
        link: '/noi-bo/kho/kiem-ke' },
      { ten: 'Quét hoặc đếm từng món', ai: 'NV quầy / Thủ kho', quyen: ['van_hanh'],
        moTa: 'Quét nhãn cân là nhanh nhất. Món hết thật thì bấm "Đã hết".',
        link: '/noi-bo/kho/kiem-ke', dem: ['kiem_ke_tra_ve'] },
      { ten: 'Gửi quản lý', ai: 'NV quầy / Thủ kho', quyen: ['van_hanh'],
        moTa: 'Gửi xong, phần mềm chụp lại số trên sổ để so.',
        link: '/noi-bo/kho/kiem-ke', dem: ['quay_chua_dem'] },
      { ten: 'Duyệt chênh lệch', ai: 'Quản lý', quyen: ['duyet'],
        moTa: 'Duyệt thì tồn kho được sửa theo số đếm. Nghi đếm sai thì trả về đếm lại.',
        link: '/noi-bo/kho/duyet', dem: ['duyet_kiem_ke'] },
    ],
  },
  {
    ma: 'cong-no', ten: 'Công nợ', bieuTuong: 'cong_no',
    gioiThieu: 'Còn phải trả = Nợ đầu kỳ + Mua − Đã trả − Giảm trừ.',
    buoc: [
      { ten: 'Đối chiếu hóa đơn', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'Ghi hóa đơn VAT cho từng phiếu nhập đã duyệt.',
        link: '/noi-bo/kho/cong-no?loc=chua_doi_chieu', dem: ['chua_doi_chieu'] },
      { ten: 'Ghi thanh toán', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'Chuyển khoản / tiền mặt / giảm trừ. Tự chia cho phiếu đến hạn sớm nhất.',
        link: '/noi-bo/kho/cong-no', dem: ['cong_no_qua_han'] },
      { ten: 'Hóa đơn gộp', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'NCC xuất một hóa đơn cho nhiều lần giao: chọn các phiếu, ghi số hóa đơn — tự chia tiền vào từng phiếu.',
        link: '/noi-bo/kho/cong-no?tab=ncc' },
      { ten: 'Trả hàng nhà cung cấp', ai: 'Thủ kho ghi kg · Kế toán xác nhận tiền', quyen: ['nhap', 'ke_toan'],
        moTa: 'Thủ kho ghi số kg trả (hàng rời kho ngay), kế toán xác nhận với nhà cung cấp.',
        link: '/noi-bo/kho/cong-no/tra-hang', dem: ['tra_hang_cho_tien'] },
      { ten: 'Xuất sang MISA', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'Chọn kỳ, xem trước, tải file CSV để nhập khẩu vào MISA.',
        link: '/noi-bo/kho/cong-no/misa', nut: 'Mở' },
      { ten: 'Tải bảng công nợ', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'File Excel (CSV) để gửi hoặc lưu lại.',
        link: '/noi-bo/kho/bao-cao/cong-no.csv', nut: 'Tải về' },
    ],
  },
];

export function timQuyTrinh(ma: string | null | undefined): QuyTrinh {
  return QUY_TRINH.find(q => q.ma === ma) ?? QUY_TRINH[0];
}
