/**
 * KHO — MẪU FILE "THÊM MÓN TỪ FILE" CỦA FABi (thuần, chỉ web)
 *
 * Tên cột và giá trị cố định đúng theo mẫu nhập món của FABi (tiếng Việt CỐ Ý — là dữ liệu FABi đọc, không phải
 * câu màn hình; test-kho-tieng-anh.mjs không quét file này, như lib/kho/misa.ts). File .xlsx dựng ở
 * taoTepNhapFabi (lib/kho/thu-ngan.ts) bằng lib/kho/tep-excel.ts.
 */
import type { DongMonFabi } from './thu-ngan.ts';

/**
 * Cột sheet "Menu" của file mẫu create-item.xlsx (FABi CMS → Thực đơn → Món ăn → Tiện ích → Thêm món từ file),
 * đúng thứ tự, đúng chữ. Nguồn: file mẫu Cowork tải ngày 27/10/2026; Khánh nhập thử 2 món theo đúng các cột này
 * cùng ngày — FABi nhận, giữ "01011" ở Mã món và Mã barcode, đơn vị Kg (file "Xuất, sửa thực đơn" xác nhận).
 * FABi bắt buộc Tên, Thành phố; cột khác để trống được. File này chỉ THÊM món mới — FABi không ghi gì về mã trùng.
 */
export const COT_NHAP_FABI = [
  'Thành phố', 'Tên', 'Giá', 'Mã món', 'Mã barcode', 'Món ăn kèm', 'Không cập nhật số lượng món ăn kèm', 'Nhóm',
  'Loại món', 'Mô tả', 'SKU', 'Đơn vị', 'Đơn vị tính thứ 2', 'VAT (%)', 'Thời gian chế biến (phút)',
  'Cho phép sửa giá khi bán', 'Cấu hình món ảo', 'Cấu hình món dịch vụ', 'Cấu hình món ăn là vé buffet', 'Ngày', 'Giờ',
  'Hình ảnh', 'Công thức inQR cho máy pha trà',
] as const;

/**
 * Giá trị cố định của file nhập: thành phố duy nhất của tài khoản FABi Beeftown; nhóm "Uncategory" (mã nhóm duy nhất
 * đang có); loại "DA" (Đồ ăn); đơn vị "KG" — FABi đọc 5 số trọng lượng trên tem thành kg (00230 → 0,23) rồi nhân
 * giá/kg, nên món cân phải là KG và giá theo 1 kg.
 */
export const MAC_DINH_FABI = { thanhPho: 'Hồ Chí Minh', nhom: 'ITEM_TYPE_OTHER', loaiMon: 'DA', donVi: 'KG' } as const;

/**
 * Dòng của sheet "Menu" (thuần): chỉ món vaoFile. Mã món = Mã barcode = mã đệm đủ số chữ của mẫu mã vạch
 * (01011) — FABi tìm món theo Mã barcode khi quét tem; kho tự nhận Mã món khi bán (0051 / 0054 / 0103).
 */
export function dongNhapFabi(ds: readonly DongMonFabi[]): (string | number | null)[][] {
  return ds.filter(d => d.vaoFile).map(d => COT_NHAP_FABI.map(c => {
    switch (c) {
      case 'Thành phố': return MAC_DINH_FABI.thanhPho;
      case 'Tên': return d.tenGoiY;
      case 'Giá': return d.giaKg;
      case 'Mã món': case 'Mã barcode': return d.maVach;
      case 'Nhóm': return MAC_DINH_FABI.nhom;
      case 'Loại món': return MAC_DINH_FABI.loaiMon;
      case 'Đơn vị': return MAC_DINH_FABI.donVi;
      default: return null;
    }
  }));
}
