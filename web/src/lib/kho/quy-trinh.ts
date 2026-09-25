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
    gioiThieu: 'Thịt nhà cung cấp giao tới → vào kho → trả tiền. Hàng chỉ vào tồn khi đã duyệt.',
    buoc: [
      { ten: 'Lập phiếu nhập, chụp hóa đơn', ai: 'Thủ kho', quyen: ['nhap'],
        moTa: 'Chọn nhà cung cấp, cân từng tảng, chụp hóa đơn / phiếu giao hàng. Lưu nháp hoặc gửi luôn.',
        link: '/noi-bo/kho/nhap/moi', dem: ['nhap_nhap', 'nhap_bi_tra'] },
      { ten: 'Duyệt phiếu nhập', ai: 'Quản lý', quyen: ['duyet'],
        moTa: 'Xem ảnh hóa đơn, số kg, đơn giá. Duyệt thì hàng vào tồn; từ chối thì trả về thủ kho kèm lý do.',
        link: '/noi-bo/kho/duyet', dem: ['duyet_nhap'] },
      { ten: 'Đối chiếu hóa đơn', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'Ghi số và tổng tiền trên hóa đơn VAT. Lệch với phiếu thì phần mềm báo ngay.',
        link: '/noi-bo/kho/cong-no?loc=chua_doi_chieu', dem: ['chua_doi_chieu'] },
      { ten: 'Trả tiền nhà cung cấp', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'Ghi khoản đã chuyển khoản / tiền mặt. Không chọn phiếu thì tự trả phiếu đến hạn sớm nhất trước.',
        link: '/noi-bo/kho/cong-no', dem: ['cong_no_qua_han'] },
    ],
  },
  {
    ma: 'pha-loc', ten: 'Pha lóc', bieuTuong: 'dao',
    gioiThieu: 'Tảng thịt → các phần cắt đóng gói. Phần mềm tính tỉ lệ thu hồi và giá vốn thật mỗi kg.',
    buoc: [
      { ten: 'Chọn tảng, cân từng phần cắt', ai: 'Thủ kho', quyen: ['pha_loc'],
        moTa: 'Chọn tảng đem pha, ghi kg từng phần cắt ra, phụ phẩm, phần bỏ. Lưu nháp được.',
        link: '/noi-bo/kho/pha-loc/moi', dem: ['pha_nhap'] },
      { ten: 'Xem thử thu hồi', ai: 'Thủ kho', quyen: ['pha_loc'],
        moTa: 'Trước khi chốt, xem tỉ lệ thu hồi và hao hụt. Lệch nhiều thì cân lại.',
        link: '/noi-bo/kho/pha-loc' },
      { ten: 'Chốt phiên', ai: 'Thủ kho', quyen: ['pha_loc'],
        moTa: 'Chốt xong: tảng rời kho, các gói mới vào kho lạnh hoặc quầy, mỗi gói có hạn dùng.',
        link: '/noi-bo/kho/pha-loc' },
      { ten: 'Mang gói ra quầy', ai: 'Thủ kho', quyen: ['van_hanh'],
        moTa: 'Gói nào để kho lạnh thì mang ra quầy khi quầy cần. Quét nhãn cho nhanh.',
        link: '/noi-bo/kho/xuat/moi?loai=chuyen' },
    ],
  },
  {
    ma: 'quay', ten: 'Quầy mỗi ngày', bieuTuong: 'quay',
    gioiThieu: 'Việc hằng ngày ở quầy thịt: bán trước gói hạn gần, bổ sung hàng, bỏ hàng hỏng, đếm cuối ngày.',
    buoc: [
      { ten: 'Sáng: xếp gói hạn gần lên trước', ai: 'NV quầy', quyen: ['xem'],
        moTa: 'Xem gói nào sắp hết hạn và đặt chúng ở phía trước để khách lấy trước.',
        link: '/noi-bo/kho/ton?vi_tri=quay', dem: ['sap_het_han'] },
      { ten: 'Quầy thiếu → mang hàng ra', ai: 'NV quầy / Thủ kho', quyen: ['van_hanh'],
        moTa: 'Món nào dưới mức tối thiểu thì lấy từ kho lạnh ra — hệ thống tự lấy gói hạn gần trước.',
        link: '/noi-bo/kho/xuat/moi?loai=chuyen', dem: ['quay_duoi_muc'] },
      { ten: 'Hàng hỏng, hết hạn → báo hủy', ai: 'NV quầy', quyen: ['van_hanh'],
        moTa: 'Chọn gói, chọn lý do, chụp ảnh. Hàng rời quầy ngay, chờ quản lý duyệt.',
        link: '/noi-bo/kho/xuat/moi?loai=huy', dem: ['het_han'] },
      { ten: 'Cuối ngày: đếm quầy', ai: 'NV quầy', quyen: ['van_hanh'],
        moTa: 'Quét nhãn từng gói còn trên quầy rồi gửi. Chưa nối iPOS: phần thiếu được tính là đã bán.',
        link: '/noi-bo/kho/kiem-ke', dem: ['quay_chua_dem', 'kiem_ke_tra_ve'] },
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
        link: '/noi-bo/kho/bao-cao?bao_cao=hao-hut', nut: 'Xem báo cáo' },
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
    gioiThieu: 'Còn nợ nhà cung cấp = Nhập mua − Trả hàng / giảm trừ − Đã thanh toán.',
    buoc: [
      { ten: 'Đối chiếu hóa đơn', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'Ghi hóa đơn VAT cho từng phiếu nhập đã duyệt.',
        link: '/noi-bo/kho/cong-no?loc=chua_doi_chieu', dem: ['chua_doi_chieu'] },
      { ten: 'Ghi thanh toán', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'Chuyển khoản / tiền mặt / giảm trừ. Tự chia cho phiếu đến hạn sớm nhất.',
        link: '/noi-bo/kho/cong-no', dem: ['cong_no_qua_han'] },
      { ten: 'Trả hàng nhà cung cấp', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'Hàng lỗi trả lại: tồn giảm và công nợ tự giảm theo.',
        link: '/noi-bo/kho/cong-no' },
      { ten: 'Tải bảng công nợ', ai: 'Kế toán', quyen: ['ke_toan'],
        moTa: 'File Excel (CSV) để gửi hoặc nhập sang phần mềm kế toán.',
        link: '/noi-bo/kho/bao-cao/cong-no.csv', nut: 'Tải về' },
    ],
  },
];

export function timQuyTrinh(ma: string | null | undefined): QuyTrinh {
  return QUY_TRINH.find(q => q.ma === ma) ?? QUY_TRINH[0];
}
