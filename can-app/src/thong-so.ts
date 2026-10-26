/**
 * BEEFTOWN CÂN — THÔNG SỐ CÂN (phần TMS) VÀ PHÍM TẮT (phần SCP)
 *
 * Nguồn: đặc tả dịch ngược phần mềm TM-xA v3.10 của hãng (spec-wizard.md,
 * plu-hsd.md, barcode-keys.md, tms-format.md) và file cân thật của quán
 * (firmware V3.14E8, chỉ đọc cấu trúc).
 *
 * PHẦN TMS — mỗi dòng một thông số: "TMS<tab>số<tab>giá trị<tab>", giá trị là số
 * nguyên. File cân lưu ra USB có đủ 500 dòng (0–499) trong một khối
 * "DWL<tab>TMS<tab>" … "END<tab>TMS<tab>". Phần mềm của hãng gửi được một khối
 * chỉ có vài dòng, và một file có thể có nhiều khối TMS — cân chạy file như một
 * chuỗi lệnh, dòng sau đè dòng trước; thông số không gửi thì cân giữ nguyên.
 * KHÔNG BAO GIỜ ghi "CLR<tab>TMS<tab>" (xoá hết thông số về mặc định).
 *
 * PHẦN SCP — phím tắt: "SCP<tab>tầng<tab>phím<tab>số PLU<tab>".
 *   - Tầng 0 = bấm thẳng phím, tầng 1 = bấm Shift rồi bấm phím, tầng 2 = tầng
 *     thứ ba (có trong file cân, chưa rõ cách gọi trên bàn phím).
 *   - Phím = số nhỏ in ở góc phím. Bàn phím có cột (loại của quán: file cân có
 *     phím 1–73 ở tầng 0, 1–63 ở tầng 1, 2): 1–63 là phím chữ dùng làm phím tắt
 *     gọi hàng; 64–73 là phím chức năng in sẵn (Shift, Auto Mode, … Drawer) —
 *     trong file đang để 0 nhưng vẫn làm chức năng in trên phím, ghi số PLU vào
 *     đó có thể làm mất phím Shift / ngăn kéo → không cho sửa. (Loại bàn phím
 *     suy ra từ số phím trong file và hình bàn phím trong sổ tay — chưa thử
 *     trên cân thật.)
 *   - Số PLU 0 = phím trống; số âm = phím được gán một chức năng của cân (mã
 *     chức năng) → không đụng.
 *   - Phần mềm hãng chỉ ghi những phím có hàng; phím không ghi thì cân giữ gán
 *     cũ. Muốn bỏ phím phải ghi tường minh dòng "SCP<tab>tầng<tab>phím<tab>0<tab>".
 *
 * PHẦN TMT (2.4) — chữ cài đặt chung: "TMT<tab>số<tab>chữ<tab>", số 0–27 (tên
 *   quán, tên cân, đơn vị tiền, ghi chú cân 1–8…). Hãng ghi chữ nguyên văn (không
 *   đổi xuống dòng thành \v); cân của quán lưu chữ dạng UTF-8 như tên hàng.
 *   15, 16, 19 là tên WiFi, mật khẩu WiFi, tên miền máy chủ: KHÔNG BAO GIỜ đọc ra
 *   giao diện, không bao giờ ghi (sai là cân rời WiFi).
 *
 * GỬI XUỐNG CÂN: suaThongSo / suaChuChung / suaPhim sửa đúng dòng trong file gốc
 * (dòng khác giữ y nguyên từng byte, kể cả byte không phải UTF-8) và trả thêm
 * `khoi` chỉ gồm các dòng đổi; fileNho gói các khối đó thành một file nhỏ dạng
 * USB để gửi vào cổng 33571 (cổng Beeftown Cân 2.1 đã gửi được file PLU).
 * CHƯA THỬ TRÊN CÂN THẬT: cân có nhận khối TMS / TMT / SCP gửi riêng qua cổng 33571
 * hay không, và tác dụng thật của từng lựa chọn dưới đây — mọi câu trên giao
 * diện phải nói rõ điều đó, không báo "đã đổi" khi chưa thấy trên cân.
 *
 * File thuần: không đọc/ghi đĩa, không nối mạng.
 */
import { CO_FILE_TOI_DA, sangChuoiByte, tuChuoiByte, type FileCan } from '../../web/src/lib/kho/can-tma.ts';

export class LoiThongSo extends Error {}

// -----------------------------------------------------------------------------
// DANH MỤC THÔNG SỐ (chọn lọc cho một quán bò Việt Nam)
// -----------------------------------------------------------------------------
export interface LuaChon {
  gt: string;
  ten: string;
  /** Cảnh báo riêng khi chọn giá trị này (thêm ngoài hợp đồng, có thể bỏ qua). */
  canhBao?: string;
}

export interface MucThongSo {
  id: number;
  ten: string;
  moTa: string;
  nhom: string;
  kieu: 'chon' | 'so';
  luaChon?: LuaChon[];
  toiThieu?: number;
  toiDa?: number;
  /** Chỉ xem: suaThongSo từ chối sửa. */
  chiXem?: boolean;
  canhBao?: string;
}

/** Thứ tự nhóm để giao diện xếp các thông số. */
export const NHOM_THONG_SO = ['Ngày giờ', 'Hạn dùng (HSD)', 'In tem', 'Nhật ký bán', 'Giá và số lẻ', 'Mã vạch', 'Kết nối'] as const;

const CHUA_THU = 'Chưa thử trên cân thật.';
const THANG_TRUOC = 'Tháng đứng trước ngày: khách dễ đọc 09/10/26 thành ngày 9 tháng 10 trong khi thật là ngày 10 tháng 9.';
const GIO_12 = 'Giờ in theo 12 tiếng — chưa rõ cân có in SA/CH (AM/PM) không; chưa thử trên cân thật.';
const KIEU_SO_NGAY = 'Kiểu "in số ngày" (4–6) chỉ có ở phần mềm mới của hãng, sổ tay cân không có; chưa biết tem in ra sao — chưa thử trên cân thật.';
const BO_HSD_TUNG_HANG = 'Bỏ qua HSD riêng của từng hàng, kể cả HSD gửi từ kho.';

// Ví dụ ngày trong tên lựa chọn: 29/09/2026.
const KIEU_NGAY: [string, string, string?][] = [
  ['0', '2026.09.29 — năm.tháng.ngày (mặc định của hãng)'],
  ['1', '26.09.29 — năm.tháng.ngày, năm 2 số'],
  ['2', '09/29/26 — tháng/ngày/năm (kiểu Mỹ)', THANG_TRUOC],
  ['3', '09-29-26 — tháng-ngày-năm (kiểu Mỹ)', THANG_TRUOC],
  ['4', '29/09/26 — ngày/tháng/năm (kiểu Việt Nam, năm 2 số)'],
  ['5', '29-09-26 — ngày-tháng-năm (năm 2 số)'],
];

const soLe = (so: number): LuaChon[] => [0, 1, 2, 3, 4, 5].map(n => ({
  gt: String(n),
  ten: `${n} số lẻ — ${n === 0 ? '845' : '845.' + '0'.repeat(n)}${n === 3 ? ' (giá theo nghìn đồng như quán)' : ''}`,
})).slice(0, so + 1);

/**
 * Sửa được (7 mục trong thiết kế + 22):
 *   104, 265, 266 — cách viết ngày trên tem / màn hình.
 *   105, 106      — HSD chung (Beeftown Cân quản HSD từng hàng qua cột PLU, nên khuyên 105 = 0).
 *   250           — cách in tem mỗi lần cân.
 *   283           — ghi lần cân chưa in tem vào nhật ký.
 *   22 (thêm)     — độ đậm khi in trên giấy tem. Lý do cho sửa: chỉ đổi độ đậm của đầu in nhiệt, đổi lại được
 *                   ngay, không đụng giá, dữ liệu hàng hay nhật ký; tem mờ / mã vạch khó quét là việc quán hay
 *                   gặp. Khoảng 0–15 theo Tm.xml của hãng.
 * Chỉ xem (có giải thích vì sao không sửa ở đây): 0, 1, 2, 5, 21, 42, 43, 131, 166, 188, 202, 203, 208, 209.
 * Thông số khác (mạng, cân đo, mật khẩu…) không đưa ra: sửa sai có thể làm cân cân sai, mất WiFi hay khoá máy.
 */
export const THONG_SO: MucThongSo[] = [
  // ---- Ngày giờ --------------------------------------------------------------
  {
    id: 104, ten: 'Kiểu ngày in trên tem', nhom: 'Ngày giờ', kieu: 'chon',
    moTa: 'Cách cân viết ngày khi in tem: ngày in (ngày đóng gói trên mẫu tem của quán) và hạn dùng (HSD). '
      + 'Cân chỉ có các kiểu dưới đây; kiểu ngày/tháng/năm của Việt Nam chỉ có năm 2 chữ số (29/09/26). '
      + 'Từ 100 trở đi là cùng kiểu ngày nhưng giờ in theo 12 tiếng.',
    luaChon: [
      ...KIEU_NGAY.map(([gt, ten, canhBao]) => ({ gt, ten: `${ten}, giờ 24 tiếng`, ...(canhBao ? { canhBao } : {}) })),
      ...KIEU_NGAY.map(([gt, ten, canhBao]) => ({ gt: String(100 + Number(gt)), ten: `${ten}, giờ 12 tiếng`,
        canhBao: canhBao ? `${canhBao} ${GIO_12}` : GIO_12 })),
    ],
    canhBao: `${CHUA_THU} Chọn 4 thì tem in 29/09/26 — năm chỉ có 2 chữ số, cân không có kiểu 29/09/2026. `
      + 'Đổi kiểu ngày là đổi mọi ngày in trên tem (ngày đóng gói, HSD). Gửi xong in thử một tem để xem.',
  },
  {
    id: 265, ten: 'Tháng in bằng chữ', nhom: 'Ngày giờ', kieu: 'chon',
    moTa: 'Tháng trong ngày in trên tem là số (09) hay hai chữ cái. Khách Việt đọc số dễ hơn — nên để số.',
    luaChon: [
      { gt: '0', ten: 'Số (09) — nên dùng' },
      { gt: '1', ten: 'Hai chữ cái', canhBao: 'Chưa biết cân in hai chữ cái nào cho tháng (có lẽ tên tiếng Anh viết tắt) — chưa thử trên cân thật.' },
    ],
    canhBao: CHUA_THU,
  },
  {
    id: 266, ten: 'Ngày trên màn hình cân', nhom: 'Ngày giờ', kieu: 'chon',
    moTa: 'Màn hình cân hiện ngày theo kiểu mặc định của cân, hay theo đúng kiểu ngày in trên tem (thông số 104 và 265). '
      + 'Chỉ đổi cách hiện trên màn hình, không đổi tem.',
    luaChon: [
      { gt: '0', ten: 'Kiểu mặc định của cân' },
      { gt: '1', ten: 'Theo kiểu ngày in trên tem (104, 265)' },
    ],
    canhBao: `${CHUA_THU} Có thể phải tắt rồi bật lại cân mới thấy màn hình đổi.`,
  },

  // ---- Hạn dùng ----------------------------------------------------------------
  {
    id: 105, ten: 'Cách in hạn dùng (HSD)', nhom: 'Hạn dùng (HSD)', kieu: 'chon',
    moTa: 'Cân lấy số ngày HSD ở đâu. HSD = ngày in tem + số ngày, theo đồng hồ của cân. Beeftown Cân gửi HSD riêng '
      + 'của từng hàng lấy từ kho (số ngày hạn dùng của mặt hàng), nên để 0 (theo từng hàng). Mẫu tem phải có ô Hạn dùng thì mới in.',
    luaChon: [
      { gt: '0', ten: 'Theo từng hàng — in ngày hết hạn (nên dùng)' },
      { gt: '1', ten: 'Theo từng hàng; hàng chưa đặt HSD thì dùng số ngày chung (106)',
        canhBao: 'Chưa rõ cân coi "chưa đặt HSD" là tắt in HSD hay số ngày bằng 0 — chưa thử trên cân thật.' },
      { gt: '2', ten: 'Mọi hàng dùng số ngày chung (106)', canhBao: BO_HSD_TUNG_HANG },
      { gt: '3', ten: 'Không in HSD', canhBao: 'Tem không in HSD dù hàng có đặt HSD.' },
      { gt: '4', ten: 'Theo từng hàng — in số ngày thay cho ngày hết hạn', canhBao: KIEU_SO_NGAY },
      { gt: '5', ten: 'Như 1 nhưng in số ngày thay cho ngày hết hạn', canhBao: KIEU_SO_NGAY },
      { gt: '6', ten: 'Như 2 nhưng in số ngày thay cho ngày hết hạn', canhBao: `${BO_HSD_TUNG_HANG} ${KIEU_SO_NGAY}` },
    ],
    canhBao: `${CHUA_THU} HSD tính từ ngày in tem theo đồng hồ của cân — đồng hồ cân sai thì HSD sai.`,
  },
  {
    id: 106, ten: 'Số ngày HSD chung', nhom: 'Hạn dùng (HSD)', kieu: 'so', toiThieu: 0, toiDa: 999,
    moTa: 'Số ngày cộng vào ngày in để ra HSD: dùng cho mọi hàng khi "Cách in hạn dùng" (105) là 2 hoặc 6, hoặc cho '
      + 'hàng chưa đặt HSD khi 105 là 1 hoặc 5. 0 = hết hạn ngay trong ngày in. Khi 105 là 0 số này không dùng.',
    canhBao: CHUA_THU,
  },

  // ---- In tem --------------------------------------------------------------------
  {
    id: 250, ten: 'In tem mỗi lần cân', nhom: 'In tem', kieu: 'chon',
    moTa: 'Phím【Accu】(cộng dồn) trên cân làm gì. Quán bán từng gói: mỗi lần cân in ngay một tem.',
    luaChon: [
      { gt: '0', ten: 'Cộng dồn bình thường: 【Accu】 gom nhiều món rồi in tem tổng',
        canhBao: 'Tem tổng in theo "Mẫu tem tổng" (thông số 5) — mẫu có sẵn của hãng, chưa sửa cho quán. Nhân viên phải được hướng dẫn lại.' },
      { gt: '1', ten: '【Accu】 làm như【Print】: mỗi lần cân in ngay một tem — nên dùng' },
      { gt: '2', ten: 'Chỉ cộng dồn được 1 lần',
        canhBao: 'Sổ tay cân chỉ có 0 và 1; lựa chọn 2 chỉ có ở phần mềm mới của hãng — chưa thử trên cân thật.' },
    ],
    canhBao: `${CHUA_THU} Đổi cách bán ở quầy — báo nhân viên trước khi đổi.`,
  },
  {
    id: 22, ten: 'Độ đậm khi in tem', nhom: 'In tem', kieu: 'so', toiThieu: 0, toiDa: 15,
    moTa: 'Độ đậm của đầu in nhiệt khi in trên giấy tem có khe (loại giấy quán dùng). Số càng lớn chữ càng đậm. '
      + 'Tem mờ, mã vạch khó quét thì tăng 1–2 nấc; chữ nhoè thì giảm.',
    canhBao: `${CHUA_THU} Đậm quá làm đầu in mau mòn và mã vạch nhoè, khó quét. Mỗi lần chỉ đổi 1–2 nấc rồi in thử.`,
  },
  {
    id: 0, ten: 'Mẫu tem mặc định', nhom: 'In tem', kieu: 'so', toiThieu: 0, toiDa: 99, chiXem: true,
    moTa: 'Số mẫu tem cân dùng để in tem hàng khi mặt hàng không chọn mẫu riêng. 0 = không in tem.',
    canhBao: 'Chỉ xem: sửa tem ở thẻ Thiết lập cân → Mẫu tem. Đặt sai số thì cân in theo mẫu khác hoặc không in tem.',
  },
  {
    id: 5, ten: 'Mẫu tem tổng', nhom: 'In tem', kieu: 'so', toiThieu: 0, toiDa: 99, chiXem: true,
    moTa: 'Mẫu tem in khi cộng dồn nhiều món. Chỉ dùng khi "In tem mỗi lần cân" (250) là 0.',
    canhBao: 'Chỉ xem.',
  },
  {
    id: 21, ten: 'Loại giấy', nhom: 'In tem', kieu: 'chon', chiXem: true,
    moTa: 'Cân đang in trên giấy tem có khe (decal từng tem) hay giấy cuộn liên tục.',
    luaChon: [
      { gt: '0', ten: 'Giấy thường (cuộn liên tục)' },
      { gt: '1', ten: 'Giấy tem có khe (decal)' },
    ],
    canhBao: 'Chỉ xem: chọn sai loại giấy thì cân không dò được khe giữa các tem — tem in lệch hoặc cân báo lỗi giấy.',
  },

  // ---- Nhật ký bán -----------------------------------------------------------------
  {
    id: 283, ten: 'Ghi lần cân chưa in tem vào nhật ký', nhom: 'Nhật ký bán', kieu: 'chon',
    moTa: 'Hàng đã lên cân, đã có giá nhưng không in tem (nhấc ra, bấm huỷ): cân có ghi lại vào nhật ký bán không. '
      + 'Các dòng này mang loại "Cân chưa in tem", không phải hàng bán — không tính vào kho, chỉ để đối chiếu hao hụt.',
    luaChon: [
      { gt: '0', ten: 'Không ghi', canhBao: 'Nhật ký không còn dấu vết những lần cân mà không in tem.' },
      { gt: '1', ten: 'Ghi lần cân đã có giá (mặc định của hãng)' },
      { gt: '2', ten: 'Ghi lần cân đã có giá và cả lần mới có trọng lượng' },
    ],
    canhBao: CHUA_THU,
  },
  {
    id: 131, ten: 'Tự ghi / tự in khi nhấc hàng ra', nhom: 'Nhật ký bán', kieu: 'chon', chiXem: true,
    moTa: 'Hàng đã có giá rồi được nhấc khỏi bàn cân mà chưa in tem thì cân có tự ghi (cộng dồn) hay tự in không. '
      + 'Theo sổ tay, 1 = tự ghi lần cân đó vào nhật ký (vẫn bấm【Cancel】để bỏ được). Giá trị 1 thường do trình cài '
      + 'đặt của hãng tự điền chứ không phải chủ ý (suy đoán).',
    luaChon: [
      { gt: '0', ten: 'Không' },
      { gt: '1', ten: 'Tự ghi (cộng dồn) khi nhấc hàng ra' },
      { gt: '2', ten: 'Bắt buộc tự ghi khi nhấc hàng ra' },
      { gt: '3', ten: 'Tự in tem khi nhấc hàng ra' },
      { gt: '4', ten: 'Bắt buộc tự in tem khi nhấc hàng ra' },
      { gt: '5', ten: 'Tự ghi và in khi nhấc hàng ra' },
      { gt: '6', ten: 'Bắt buộc tự ghi và in khi nhấc hàng ra' },
    ],
    canhBao: 'Chỉ xem: đổi làm thay đổi cách bán ở quầy (3, 4 tự in tem khi nhấc hàng ra) — chưa thử trên cân thật.',
  },

  // ---- Giá và số lẻ -----------------------------------------------------------------
  {
    id: 202, ten: 'Số lẻ đơn giá', nhom: 'Giá và số lẻ', kieu: 'chon', chiXem: true, luaChon: soLe(5),
    moTa: 'Cân hiện và in đơn giá với mấy số lẻ. Quán ghi giá theo nghìn đồng với 3 số lẻ: giá 845 hiện 845.000 = '
      + '845.000 đ/kg. Beeftown Cân tính giá gửi xuống cân theo đúng số này.',
    canhBao: 'Chỉ xem. Đổi số này thì MỌI giá trên cân đổi nghĩa (845.000 đ có thể hiện thành 845.00 hay 845) — mọi tem '
      + 'in sai giá cho tới khi gửi lại toàn bộ giá.',
  },
  {
    id: 203, ten: 'Số lẻ thành tiền', nhom: 'Giá và số lẻ', kieu: 'chon', chiXem: true, luaChon: soLe(5),
    moTa: 'Cân hiện và in thành tiền với mấy số lẻ (thường bằng số lẻ đơn giá). Với 3 số lẻ: 0,523 kg × 845.000 = 441.935 đ.',
    canhBao: 'Chỉ xem. Đổi số này thì MỌI thành tiền in trên tem đổi nghĩa — tem in sai tiền.',
  },
  {
    id: 188, ten: 'Số chữ số đơn giá', nhom: 'Giá và số lẻ', kieu: 'so', toiThieu: 0, toiDa: 7, chiXem: true,
    moTa: 'Ô đơn giá trên màn hình cân có mấy chữ số (0 = tự động). Với 6 chữ số và 3 số lẻ, giá cao nhất là 999.999 '
      + '= 999.999 đ/kg — giá cao hơn không đưa lên cân được.',
    canhBao: 'Chỉ xem: màn hình cân có thể chỉ có 6 ô số; đổi có thể làm giá hiện sai.',
  },

  // ---- Mã vạch -------------------------------------------------------------------
  {
    id: 1, ten: 'Mẫu mã vạch trên tem', nhom: 'Mã vạch', kieu: 'so', toiThieu: 0, toiDa: 99, chiXem: true,
    moTa: 'Số mẫu mã vạch (phần BAR của file cân) in trên tem hàng: mã vạch gồm những số nào (số đầu, mã hàng, trọng lượng…).',
    canhBao: 'Chỉ xem: đổi mẫu mã vạch thì máy quầy và kho không đọc được mã vạch trên tem nữa.',
  },
  {
    id: 2, ten: 'Số đầu mã vạch', nhom: 'Mã vạch', kieu: 'so', toiThieu: 0, toiDa: 9999999, chiXem: true,
    moTa: 'Các số đầu của mã vạch trên tem (thường 20). Máy đọc mã vạch nhờ số này mà biết đây là tem cân.',
    canhBao: 'Chỉ xem: đổi thì máy quầy không nhận ra tem cân.',
  },
  {
    id: 208, ten: 'Số lẻ trọng lượng trong mã vạch', nhom: 'Mã vạch', kieu: 'so', toiThieu: 0, toiDa: 5, chiXem: true,
    moTa: 'Trọng lượng ghi trong mã vạch với mấy số lẻ: 3 = tính bằng gam (1,250 kg ghi 01250).',
    canhBao: 'Chỉ xem: đổi thì máy quầy và kho đọc sai trọng lượng từ mã vạch.',
  },
  {
    id: 209, ten: 'Số lẻ tiền trong mã vạch', nhom: 'Mã vạch', kieu: 'so', toiThieu: 0, toiDa: 5, chiXem: true,
    moTa: 'Tiền ghi trong mã vạch (nếu mẫu mã vạch có ô tiền) với mấy số lẻ. Với giá theo nghìn đồng, 2 nghĩa là tiền '
      + 'trong mã vạch tính theo đơn vị 10 đ.',
    canhBao: 'Chỉ xem: đổi thì máy quầy đọc sai số tiền trong mã vạch.',
  },

  // ---- Kết nối ---------------------------------------------------------------------
  {
    id: 42, ten: 'Tự nạp USB khi bật cân', nhom: 'Kết nối', kieu: 'chon', chiXem: true,
    moTa: 'Bật cân mà USB đang cắm có file JHSCALE\\A_xxx.TMS thì cân tự nạp file đó (thay dữ liệu trên cân).',
    luaChon: [
      { gt: '0', ten: 'Không tự nạp' },
      { gt: '1', ten: 'Tự nạp file A_xxx.TMS khi bật cân' },
    ],
    canhBao: 'Chỉ xem. Đừng để USB có file A_xxx.TMS cũ cắm vào cân lúc bật: cân sẽ nạp lại dữ liệu cũ (giá cũ, tem cũ).',
  },
  {
    id: 43, ten: 'Kết nối mạng của cân', nhom: 'Kết nối', kieu: 'chon', chiXem: true,
    moTa: 'Cân có nhận kết nối qua mạng (WiFi) không.',
    luaChon: [
      { gt: '0', ten: 'Không nối mạng' },
      { gt: '1', ten: 'Máy chủ — máy tính gọi tới cân' },
      { gt: '2', ten: 'Máy khách — cân gọi tới máy tính' },
    ],
    canhBao: 'Chỉ xem: đổi thì Beeftown Cân và phần mềm của hãng có thể không nối được cân qua WiFi nữa.',
  },
  {
    id: 166, ten: 'Cổng nối hai chiều', nhom: 'Kết nối', kieu: 'so', toiThieu: 0, toiDa: 65535, chiXem: true,
    moTa: 'Cổng mạng cân mở cho phần mềm của hãng đọc / ghi dữ liệu (thường 33581). Beeftown Cân gửi giá vào cổng '
      + '33571 — chưa rõ thông số nào quy định cổng đó.',
    canhBao: 'Chỉ xem: đổi thì phần đọc dữ liệu qua WiFi không nối được cân.',
  },
];

const MUC = new Map<number, MucThongSo>(THONG_SO.map(m => [m.id, m]));

const dinhSo = (n: number) => n.toLocaleString('vi-VN');

/**
 * Kiểm một giá trị định sửa: trả dạng chuẩn ("04" → "4"). Không có trong
 * THONG_SO, chỉ xem, hay sai giá trị → LoiThongSo (câu cho người dùng).
 */
export function kiemThongSo(id: number | string, giaTri: string | number): string {
  const so = typeof id === 'number' ? id : /^\s*\d+\s*$/.test(id) ? Number(id) : NaN;
  const muc = MUC.get(so);
  if (!muc) throw new LoiThongSo(`Thông số ${String(id).trim() || '(trống)'} không có trong danh sách được sửa ở đây.`);
  if (muc.chiXem) throw new LoiThongSo(`"${muc.ten}" (thông số ${muc.id}) chỉ được xem, không sửa ở đây.`);
  const s = String(giaTri ?? '').trim();
  const chuan = /^-?\d{1,9}$/.test(s) ? String(parseInt(s, 10)) : null;
  if (muc.kieu === 'chon') {
    const ds = muc.luaChon ?? [];
    if (chuan === null || !ds.some(l => l.gt === chuan)) {
      throw new LoiThongSo(`"${muc.ten}" không có lựa chọn "${s}". Chọn một trong: ${ds.map(l => l.gt).join(', ')}.`);
    }
    return chuan;
  }
  const n = chuan === null ? NaN : Number(chuan);
  const thap = muc.toiThieu ?? 0, cao = muc.toiDa ?? 2147483647;
  if (!Number.isInteger(n) || n < thap || n > cao) {
    throw new LoiThongSo(`"${muc.ten}" phải là số nguyên từ ${dinhSo(thap)} đến ${dinhSo(cao)}.`);
  }
  return String(n);
}

// -----------------------------------------------------------------------------
// ĐỌC FILE (dạng chuỗi byte, giữ nguyên từng byte)
// -----------------------------------------------------------------------------
interface CacDong { coBom: boolean; xuongDong: string; dong: string[] }

/** Tách file thành dòng như docFileCan (BOM, CRLF hay LF); chấp nhận dòng trống trước "ECS VER" như file của hãng. */
function tachDong(du: Uint8Array): CacDong {
  if (!du || du.length === 0) throw new LoiThongSo('File rỗng. Lưu lại dữ liệu từ cân ra USB rồi tải lên lại.');
  if (du.length > CO_FILE_TOI_DA) throw new LoiThongSo('File quá lớn, không phải file dữ liệu của cân.');
  const coBom = du[0] === 0xEF && du[1] === 0xBB && du[2] === 0xBF;
  const noiDung = sangChuoiByte(coBom ? du.subarray(3) : du);
  const xuongDong = noiDung.includes('\r\n') ? '\r\n' : '\n';
  const dong = noiDung.split(xuongDong);
  const dau = (dong.find(d => d !== '') ?? '').split('\t');
  if (dau[0] !== 'ECS' || dau[1] !== 'VER') {
    throw new LoiThongSo('Đây không phải file dữ liệu của cân. Chọn file A_000.TMS trong thư mục JHSCALE của USB.');
  }
  return { coBom, xuongDong, dong };
}

function ghepDong(f: CacDong, dong: string[]): Uint8Array<ArrayBuffer> {
  const than = tuChuoiByte(dong.join(f.xuongDong));
  if (!f.coBom) return than;
  const ra = new Uint8Array(than.length + 3);
  ra.set([0xEF, 0xBB, 0xBF]);
  ra.set(than, 3);
  return ra;
}

const laDongMo = (c: string[]) => (c[0] === 'DWL' || c[0] === 'XD1') && c.length >= 2 && c.length <= 3 && (c[2] ?? '') === '' && c[1] !== '';

/**
 * Mọi khối của phần `ten` (mở bằng DWL hoặc XD1, đóng bằng END cùng tên), theo thứ tự trong file.
 * `hong` = có khối của phần này mở mà không đóng (gặp khối khác hay hết file trước dòng END).
 */
function timKhoi(dong: string[], ten: string): { khoi: { dau: number; cuoi: number }[]; hong: boolean } {
  const khoi: { dau: number; cuoi: number }[] = [];
  let hong = false;
  let mo: { ten: string; dau: number } | null = null;
  for (let i = 0; i < dong.length; i++) {
    const c = dong[i].split('\t');
    if (laDongMo(c)) {
      if (mo && mo.ten === ten) hong = true;
      mo = { ten: c[1], dau: i };
    } else if (c[0] === 'END' && mo && c[1] === mo.ten) {
      if (mo.ten === ten) khoi.push({ dau: mo.dau, cuoi: i });
      mo = null;
    }
  }
  if (mo && mo.ten === ten) hong = true;
  return { khoi, hong };
}

/** Vị trí chèn một khối mới: ngay trước dòng "END ECS" cuối file (hoặc cuối file). */
function chenKhoiMoi(dong: string[], khoiMoi: string[]): void {
  let e = -1;
  for (let i = dong.length - 1; i >= 0; i--) {
    const c = dong[i].split('\t');
    if (c[0] === 'END' && c[1] === 'ECS') { e = i; break; }
  }
  if (e < 0) e = dong.length > 0 && dong[dong.length - 1] === '' ? dong.length - 1 : dong.length;
  // File của cân để một dòng trống sau mỗi phần — làm theo nếu file đang như vậy.
  const them = e > 0 && dong[e - 1] === '' ? [...khoiMoi, ''] : khoiMoi;
  dong.splice(e, 0, ...them);
}

const soNguyen = (v: string | undefined): number | null => (v !== undefined && /^-?\d{1,10}$/.test(v) ? parseInt(v, 10) : null);

// -----------------------------------------------------------------------------
// THÔNG SỐ (TMS)
// -----------------------------------------------------------------------------
/** Giá trị thông số trong file (nguyên chữ). File có nhiều khối TMS thì khối sau thắng (như cân chạy lần lượt). */
export function docThongSo(f: FileCan): Map<number, string> {
  const ra = new Map<number, string>();
  for (const k of timKhoi(f.dong, 'TMS').khoi) {
    for (let i = k.dau + 1; i < k.cuoi; i++) {
      const c = f.dong[i].split('\t');
      if (c[0] !== 'TMS' || !/^\d+$/.test(c[1] ?? '')) continue;
      ra.set(parseInt(c[1], 10), c[2] ?? '');
    }
  }
  return ra;
}

const chuanGiaTri = (v: string) => (/^\s*-?\d{1,10}\s*$/.test(v) ? String(parseInt(v, 10)) : v);

/**
 * Sửa thông số trong file gốc.
 *   - `thay`: số thông số → giá trị mới. Kiểm TẤT CẢ trước khi sửa (một giá trị sai → LoiThongSo, không sửa gì).
 *   - Sửa đúng dòng TMS của thông số đó (có ở nhiều khối thì sửa mọi dòng); dòng khác giữ y nguyên từng byte.
 *     Thông số chưa có dòng nào → thêm dòng vào cuối khối TMS sau cùng (không có khối TMS → thêm khối mới
 *     trước "END ECS").
 *   - `khoi`: ["DWL\tTMS\t", "TMS\t104\t4\t", …, "END\tTMS\t"] — chỉ các thông số thật sự đổi, mỗi số một dòng,
 *     xếp theo số; rỗng nếu không có gì đổi (khi đó `du` là bản sao file cũ).
 *   - `doi`: các số thông số đã đổi.
 * Cân có nhận khối này qua cổng 33571 hay không: chưa thử trên cân thật.
 */
export function suaThongSo(du: Uint8Array, thay: Record<string, string | number>): { du: Uint8Array<ArrayBuffer>; khoi: string[]; doi: number[] } {
  const moi = new Map<number, string>();
  for (const [k, v] of Object.entries(thay ?? {})) {
    const gt = kiemThongSo(k, v);
    const id = Number(k);
    if (moi.has(id)) throw new LoiThongSo(`Thông số ${id} được sửa hai lần trong cùng một lần gửi.`);
    moi.set(id, gt);
  }

  return suaDongSo(du, 'TMS', moi, (cu, gt) => chuanGiaTri(cu) === gt,
    'Phần thông số (TMS) trong file bị hỏng (thiếu dòng kết thúc). Lưu lại dữ liệu từ cân ra USB rồi tải lên lại.');
}

/**
 * Sửa các dòng "<phần><tab>số<tab>giá trị<tab>" của phần TMS / TMT (dùng chung cho suaThongSo, suaChuChung):
 *   - `moi`: số → giá trị mới (đã kiểm, đã ở dạng chuỗi byte). `giong(cu, moi)`: giá trị trong file đã bằng giá trị mới.
 *   - Số có dòng: sửa cột 2 ở mọi dòng của số đó (mọi khối); dòng thiếu cột thì viết lại đủ dạng. Số chưa có dòng: thêm vào
 *     cuối khối sau cùng (không có khối → khối mới trước "END ECS"). Dòng khác giữ y nguyên từng byte.
 *   - `khoi`: DWL, mỗi số đổi một dòng (xếp theo số), END — rỗng nếu không có gì đổi (khi đó `du` là bản sao file cũ).
 */
function suaDongSo(du: Uint8Array, phan: 'TMS' | 'TMT', moi: Map<number, string>, giong: (cu: string, moi: string) => boolean,
  cauHong: string): { du: Uint8Array<ArrayBuffer>; khoi: string[]; doi: number[] } {
  const f = tachDong(du);
  const { khoi, hong } = timKhoi(f.dong, phan);
  if (hong) throw new LoiThongSo(cauHong);
  const viTri = new Map<number, number[]>();
  const hienTai = new Map<number, string>();
  for (const k of khoi) {
    for (let i = k.dau + 1; i < k.cuoi; i++) {
      const c = f.dong[i].split('\t');
      if (c[0] !== phan || !/^\d+$/.test(c[1] ?? '')) continue;
      const id = parseInt(c[1], 10);
      viTri.set(id, [...(viTri.get(id) ?? []), i]);
      hienTai.set(id, c[2] ?? '');
    }
  }

  const dong = f.dong.slice();
  const doi: number[] = [];
  const dongThem: string[] = [];
  for (const [id, gt] of [...moi].sort((a, b) => a[0] - b[0])) {
    const cu = hienTai.get(id);
    if (cu !== undefined && giong(cu, gt)) continue;
    doi.push(id);
    const ds = viTri.get(id);
    if (!ds) { dongThem.push(`${phan}\t${id}\t${gt}\t`); continue; }
    for (const i of ds) {
      const c = dong[i].split('\t');
      if (c.length >= 4) { c[2] = gt; dong[i] = c.join('\t'); } else dong[i] = `${phan}\t${id}\t${gt}\t`;
    }
  }
  if (doi.length === 0) return { du: new Uint8Array(du), khoi: [], doi: [] };
  if (dongThem.length) {
    if (khoi.length) dong.splice(khoi[khoi.length - 1].cuoi, 0, ...dongThem);
    else chenKhoiMoi(dong, [`DWL\t${phan}\t`, ...dongThem, `END\t${phan}\t`]);
  }
  return {
    du: ghepDong(f, dong),
    khoi: [`DWL\t${phan}\t`, ...doi.map(id => `${phan}\t${id}\t${moi.get(id)}\t`), `END\t${phan}\t`],
    doi,
  };
}

// -----------------------------------------------------------------------------
// CHỮ CÀI ĐẶT CHUNG (TMT) — 2.4
// -----------------------------------------------------------------------------
export interface MucChuChung {
  id: number;
  ten: string;
  moTa: string;
  nhom: string;
  /** Số ký tự tối đa (đếm ký tự, không đếm byte). */
  toiDa: number;
  /** Không được để trống. */
  batBuoc?: boolean;
  /** Chỉ xem: suaChuChung từ chối sửa. */
  chiXem?: boolean;
  /** Mã ô "Thông tin lúc in" (LAS cột 2 = 2) in chữ này trên tem (tem.ts TRUONG_BAN); không có = không in trên tem. */
  oTem?: number;
  canhBao?: string;
}

/** Thứ tự nhóm để giao diện xếp các chữ. */
export const NHOM_CHU_CHUNG = ['Tên quán và tên cân', 'Đơn vị tiền', 'Ghi chú cân (in trên tem, hoá đơn)', 'Chữ tuỳ ý', 'Chỉ xem'] as const;

/** Tên WiFi (15), mật khẩu WiFi (16), tên miền máy chủ (19): không đọc ra, không ghi. */
export const CHU_MANG = new Set([15, 16, 19]);

/** Số ký tự tối đa của một chữ — bằng tên hàng (TEN_TOI_DA của can-tma.ts). Cân chứa được bao nhiêu: chưa thử trên cân thật. */
export const CHU_CHUNG_TOI_DA = 40;

const CHUA_THU_CHU = 'Chưa thử trên cân thật. Gửi xong in thử một tem có ô này (hay xem màn hình cân) để biết cân đã đổi.';
// Vị trí in trên hoá đơn giấy thường (sổ tay cân, trang 88): 4–7 đầu phiếu, 8–11 cuối phiếu.
const VI_TRI_HOA_DON = ['đầu phiếu, giữa dòng', 'đầu phiếu, sát trái', 'đầu phiếu, giữa dòng', 'đầu phiếu, sát trái',
  'cuối phiếu, giữa dòng', 'cuối phiếu, sát trái', 'cuối phiếu, giữa dòng', 'cuối phiếu, sát trái'];

/**
 * Sửa được: 0, 1 (tên), 2, 3 (đơn vị tiền), 4–11 (ghi chú cân 1–8), 20–27 (chữ tuỳ ý 1–8).
 * Chỉ xem: 12, 13, 17, 18 (chữ dự phòng — chưa rõ cân dùng vào đâu), 14 (dấu ngành hàng).
 * Không có trong danh sách, không đọc ra, không ghi: 15, 16, 19 (CHU_MANG).
 * Nguồn: Tm.xml (String_Info) và sổ tay cân của hãng; số ô tem theo WizardForm.cs của hãng (CAN-TMA §3.2).
 */
export const CHU_CHUNG: MucChuChung[] = [
  {
    id: 0, ten: 'Tên quán', nhom: 'Tên quán và tên cân', toiDa: CHU_CHUNG_TOI_DA, batBuoc: true, oTem: 0,
    moTa: 'Tên cửa hàng lưu trong cân: in ở đầu hoá đơn giấy thường, và in trên tem khi mẫu tem có ô "Tên quán". '
      + 'Mục 1 (Thông tin cân) và phần mềm của hãng cũng hiện tên này.',
    canhBao: `${CHUA_THU_CHU} Không để trống: phần mềm của hãng nhận ra cân nhờ tên quán và tên cân.`,
  },
  {
    id: 1, ten: 'Tên cân', nhom: 'Tên quán và tên cân', toiDa: CHU_CHUNG_TOI_DA, batBuoc: true, oTem: 1,
    moTa: 'Tên đặt cho chiếc cân, ví dụ "Cân quầy 1" — có ích khi quán có nhiều cân. Thường không in; mẫu tem có ô "Tên cân" thì in.',
    canhBao: `${CHUA_THU_CHU} Không để trống: phần mềm của hãng nhận ra cân nhờ tên quán và tên cân.`,
  },
  {
    id: 2, ten: 'Chữ trước số tiền', nhom: 'Đơn vị tiền', toiDa: 8,
    moTa: 'Chữ in liền trước số tiền khi cân bật in đơn vị (thông số 186, 187). Mặc định của hãng là "$"; quán ở Việt Nam để trống.',
    canhBao: CHUA_THU_CHU,
  },
  {
    id: 3, ten: 'Chữ sau số tiền', nhom: 'Đơn vị tiền', toiDa: 8,
    moTa: 'Chữ in sau số tiền khi cân bật in đơn vị (thông số 186, 187), ví dụ "VND" hay "đ". Trình cài đặt của hãng cho Việt Nam ghi "VND".',
    canhBao: `${CHUA_THU_CHU} Chữ dài có thể lấn sang ô bên cạnh trên tem.`,
  },
  ...VI_TRI_HOA_DON.map((viTri, i): MucChuChung => ({
    id: 4 + i, ten: `Ghi chú cân ${i + 1}`, nhom: 'Ghi chú cân (in trên tem, hoá đơn)', toiDa: CHU_CHUNG_TOI_DA, oTem: 17 + i,
    moTa: `Dòng chữ tự đặt, in trên tem khi mẫu tem có ô "Ghi chú cân ${i + 1}" — ví dụ số điện thoại, địa chỉ, "Giữ lạnh 0–4 độ". `
      + `Trên hoá đơn giấy thường in ở ${viTri} (theo sổ tay cân).${i === 4 ? ' Mặc định của hãng là "Thank You".' : ''}`,
    canhBao: CHUA_THU_CHU,
  })),
  ...Array.from({ length: 8 }, (_, i): MucChuChung => ({
    id: 20 + i, ten: `Chữ tuỳ ý ${i + 1}`, nhom: 'Chữ tuỳ ý', toiDa: CHU_CHUNG_TOI_DA,
    moTa: `Chữ hiện trên màn hình cân lúc chờ, khi thông số 192 hay 281 chọn chữ này (giá trị ${24 + i}). Không in trên tem.`,
    canhBao: 'Chưa thử trên cân thật. Cân của quán có hiện chữ này không còn tuỳ loại màn hình.',
  })),
  {
    id: 12, ten: 'Chữ dự phòng 1', nhom: 'Chỉ xem', toiDa: CHU_CHUNG_TOI_DA, chiXem: true, oTem: 36,
    moTa: 'Sổ tay cân gọi là chữ của phí dịch vụ theo hàng; trình cài đặt của hãng ghi chữ màn hình lúc chờ vào đây.',
    canhBao: 'Chỉ xem: chưa rõ cân dùng vào đâu. Dùng "Ghi chú cân" để in chữ tự đặt.',
  },
  {
    id: 13, ten: 'Chữ dự phòng 2', nhom: 'Chỉ xem', toiDa: CHU_CHUNG_TOI_DA, chiXem: true, oTem: 37,
    moTa: 'Sổ tay cân gọi là chữ của phí dịch vụ.',
    canhBao: 'Chỉ xem: chưa rõ cân dùng vào đâu. Dùng "Ghi chú cân" để in chữ tự đặt.',
  },
  {
    id: 14, ten: 'Dấu ngành hàng', nhom: 'Chỉ xem', toiDa: 8, chiXem: true, oTem: 38,
    moTa: 'Dấu cân in trước trọng lượng khi cân theo độ chính xác "ngành hàng" (mặc định "*").',
    canhBao: 'Chỉ xem: đổi dấu này làm tem in trọng lượng khác đi.',
  },
  {
    id: 17, ten: 'Chữ dự phòng 6', nhom: 'Chỉ xem', toiDa: CHU_CHUNG_TOI_DA, chiXem: true, oTem: 41,
    moTa: 'Chữ dự phòng của hãng. Mẫu tem có ô "Chữ dự phòng 6" thì in chữ này; ngoài ra chưa thấy cân dùng vào đâu.',
    canhBao: 'Chỉ xem: chưa rõ cân dùng vào đâu.',
  },
  {
    id: 18, ten: 'Chữ dự phòng 7', nhom: 'Chỉ xem', toiDa: CHU_CHUNG_TOI_DA, chiXem: true, oTem: 42,
    moTa: 'Chữ dự phòng của hãng. Mẫu tem có ô "Chữ dự phòng 7" thì in chữ này; ngoài ra chưa thấy cân dùng vào đâu.',
    canhBao: 'Chỉ xem: chưa rõ cân dùng vào đâu.',
  },
];

const MUC_CHU = new Map<number, MucChuChung>(CHU_CHUNG.map(m => [m.id, m]));
const UTF8_CHAT = new TextDecoder('utf-8', { fatal: true });
const UTF8_LONG = new TextDecoder('utf-8');
const sangByteUtf8 = (t: string) => sangChuoiByte(new TextEncoder().encode(t));

const loiChuMang = (id: number) => new LoiThongSo(`Chữ số ${id} là ${id === 15 ? 'tên WiFi' : id === 16 ? 'mật khẩu WiFi' : 'tên miền máy chủ'} `
  + 'của cân — không đọc, không sửa ở đây: sửa sai là cân rời WiFi. Sửa trên cân (Prog → 1 → 3).');

/**
 * Kiểm một chữ định sửa, trả dạng chuẩn: tab / xuống dòng thành một dấu cách, bỏ ký tự điều khiển, bỏ cách thừa
 * hai đầu, NFC. Không có trong CHU_CHUNG, là chữ mạng (15, 16, 19), chỉ xem, không phải chữ, trống khi bắt buộc, dài
 * quá, có ký tự thay thế U+FFFD (chữ trong file không đọc được mà chưa gõ lại), hay có biểu tượng (❤ ☎ ✅, biểu tượng cảm
 * xúc, ký tự ngoài bảng chữ cơ bản) → LoiThongSo. Phông của cân in được ký tự nào: chưa thử trên cân thật.
 */
export function kiemChuChung(id: number | string, giaTri: unknown): string {
  const so = typeof id === 'number' ? id : /^\s*\d+\s*$/.test(id) ? Number(id) : NaN;
  if (CHU_MANG.has(so)) throw loiChuMang(so);
  const muc = MUC_CHU.get(so);
  if (!muc) throw new LoiThongSo(`Chữ số ${String(id).trim() || '(trống)'} không có trong danh sách được sửa ở đây.`);
  if (muc.chiXem) throw new LoiThongSo(`"${muc.ten}" (chữ số ${muc.id}) chỉ được xem, không sửa ở đây.`);
  if (typeof giaTri !== 'string' && typeof giaTri !== 'number') throw new LoiThongSo(`"${muc.ten}" phải là chữ.`);
  const moi = String(giaTri).replace(/[\t\r\n\v\f]+/g, ' ').replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim().normalize('NFC');
  if (moi.includes('\uFFFD')) {
    throw new LoiThongSo(`"${muc.ten}" có ký tự "\uFFFD" (chữ trong file không đọc được) — xoá cả ô, gõ lại cả chữ rồi gửi.`);
  }
  if (/[\uD800-\uDFFF\u200D\uFE00-\uFE0F]|\p{Extended_Pictographic}/u.test(moi)) {
    throw new LoiThongSo(`"${muc.ten}" có ký tự cân không in được (biểu tượng như ❤ ☎ ✅, biểu tượng cảm xúc) — bỏ ký tự đó rồi gửi lại.`);
  }
  if (muc.batBuoc && moi === '') throw new LoiThongSo(`"${muc.ten}" không được để trống.`);
  if ([...moi].length > muc.toiDa) throw new LoiThongSo(`"${muc.ten}" dài quá ${muc.toiDa} ký tự.`);
  return moi;
}

/**
 * Chữ trong file (đã đổi UTF-8 sang chữ), chỉ các số có trong CHU_CHUNG — tên / mật khẩu WiFi, tên miền (15, 16, 19)
 * không bao giờ đọc ra. File có nhiều khối TMT thì khối sau thắng. `docDuoc` = false: chữ trong file không phải
 * UTF-8 (cân đặt bảng mã khác) — `giaTri` khi đó có ký tự thay thế.
 */
export function docChuChung(f: FileCan): Map<number, { giaTri: string; docDuoc: boolean }> {
  const ra = new Map<number, { giaTri: string; docDuoc: boolean }>();
  for (const k of timKhoi(f.dong, 'TMT').khoi) {
    for (let i = k.dau + 1; i < k.cuoi; i++) {
      const c = f.dong[i].split('\t');
      if (c[0] !== 'TMT' || !/^\d+$/.test(c[1] ?? '')) continue;
      const id = parseInt(c[1], 10);
      if (!MUC_CHU.has(id)) continue;
      const du = tuChuoiByte(c[2] ?? '');
      let giaTri: string, docDuoc = true;
      try { giaTri = UTF8_CHAT.decode(du); } catch { giaTri = UTF8_LONG.decode(du); docDuoc = false; }
      ra.set(id, { giaTri, docDuoc });
    }
  }
  return ra;
}

/**
 * Sửa chữ cài đặt chung trong file gốc — như suaThongSo:
 *   - `thay`: số chữ → chữ mới. Kiểm TẤT CẢ trước khi sửa (một chữ sai → LoiThongSo, không sửa gì).
 *   - Chữ ghi dạng UTF-8 như tên hàng. Sửa đúng dòng TMT của số đó (có ở nhiều khối thì sửa mọi dòng); dòng khác
 *     (kể cả TMT 15, 16, 19) giữ y nguyên từng byte. Số chưa có dòng → thêm vào cuối khối TMT sau cùng (không có
 *     khối TMT → thêm khối mới trước "END ECS").
 *   - `khoi`: ["DWL\tTMT\t", "TMT\t0\t<chữ>\t", …, "END\tTMT\t"] — chỉ các chữ thật sự đổi, xếp theo số; rỗng nếu
 *     không có gì đổi (khi đó `du` là bản sao file cũ). `doi`: các số đã đổi.
 * Cân có nhận khối TMT gửi riêng qua cổng 33571 hay không: chưa thử trên cân thật.
 */
export function suaChuChung(du: Uint8Array, thay: Record<string, unknown>): { du: Uint8Array<ArrayBuffer>; khoi: string[]; doi: number[] } {
  const moi = new Map<number, string>();
  for (const [k, v] of Object.entries(thay ?? {})) {
    const chu = kiemChuChung(k, v);
    const id = Number(k);
    if (moi.has(id)) throw new LoiThongSo(`Chữ số ${id} được sửa hai lần trong cùng một lần gửi.`);
    moi.set(id, sangByteUtf8(chu));
  }
  return suaDongSo(du, 'TMT', moi, (cu, chu) => cu === chu,
    'Phần chữ cài đặt chung (TMT) trong file bị hỏng (thiếu dòng kết thúc). Lưu lại dữ liệu từ cân ra USB rồi tải lên lại.');
}

// -----------------------------------------------------------------------------
// FILE NHỎ ĐỂ GỬI QUA CỔNG 33571
// -----------------------------------------------------------------------------
/**
 * File nhỏ dạng USB: "ECS\tVER\t<phiên bản>\t", dòng trống, các khối, dòng trống, "END\tECS\t", xuống dòng CRLF —
 * bố cục như file cân tự lưu ra USB, không BOM. `khoi` có thể gồm nhiều khối (TMS rồi SCP…).
 * Từ chối: khối rỗng, dòng CLR (xoá bảng — không bao giờ gửi theo đường này), dòng ngoài khối, khối không đóng,
 * dòng TMT 15 / 16 / 19 (tên, mật khẩu WiFi, tên miền — CHU_MANG).
 * Phiên bản trống → "100" (số phần mềm của hãng luôn ghi).
 * Cân có nạp file nhỏ chỉ gồm TMS / SCP qua cổng 33571 không: chưa thử trên cân thật.
 */
export function fileNho(phienBan: string, khoi: string[]): Uint8Array<ArrayBuffer> {
  if (!Array.isArray(khoi) || khoi.length === 0) throw new LoiThongSo('Không có gì để gửi xuống cân.');
  const khoiHong = () => new LoiThongSo('Khối dữ liệu gửi xuống cân không đúng dạng (thiếu dòng mở / kết thúc).');
  let mo: string | null = null;
  for (const d of khoi) {
    if (typeof d !== 'string' || /[\r\n]/.test(d) || /[^\x00-\xFF]/.test(d)) {
      throw new LoiThongSo('Dòng gửi xuống cân có ký tự không hợp lệ.');
    }
    const c = d.split('\t');
    if (c[0] === 'CLR') throw new LoiThongSo('Không gửi lệnh xoá (CLR) theo đường này.');
    if (c[0] === 'ECS') throw khoiHong();
    if (laDongMo(c)) { if (mo !== null) throw khoiHong(); mo = c[1]; }
    else if (c[0] === 'END') { if (mo === null || c[1] !== mo) throw khoiHong(); mo = null; }
    else if (mo === null) throw khoiHong();
    else if (c[0] === 'TMT' && /^\d+$/.test(c[1] ?? '') && CHU_MANG.has(parseInt(c[1], 10))) throw loiChuMang(parseInt(c[1], 10));
  }
  if (mo !== null) throw khoiHong();
  const pb = String(phienBan ?? '').replace(/[^\x21-\x7E]/g, '') || '100';
  return tuChuoiByte([`ECS\tVER\t${pb}\t`, '', ...khoi, '', 'END\tECS\t', ''].join('\r\n'));
}

// -----------------------------------------------------------------------------
// PHÍM TẮT (SCP)
// -----------------------------------------------------------------------------
/**
 * Chữ in trên phím, theo số nhỏ ở góc phím (bàn phím có cột của cân TM-A): phím 58 là "_" (không phải gạch
 * dài) và phím 37 là dấu "-" thường — đúng hình bàn phím của hãng.
 * 64–73 là phím chức năng in sẵn (không gán hàng được).
 */
export const NHAN_PHIM: string[] = ['',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'SP', '<', '=', '>', '!', '?', '.', ',', ';', '+', '-', '*', '/', '(', ')', '{', '}', '[', ']', '‘', '“', '@', '#', '&', '$', '%',
  '^', '`', ':', '|', '\\', '_', '~', 'End', 'Del', 'Ins', 'IME',
  'Shift', 'Auto Mode', 'Manual Weight', 'Paper Type', 'Re-Print', '-%', '-Num', '@Price', 'T-Sale', 'Drawer'];

/** Phím 1–63: phím chữ, gán hàng được ở mọi tầng. */
export const PHIM_CHU_TOI_DA = 63;
/** Tầng 0 có thêm phím chức năng 64–73 (bàn phím có cột). */
export const PHIM_TANG_0_TOI_DA = 73;
/** Tầng 0 bấm thẳng, 1 Shift, 2 tầng thứ ba. */
export const TANG_TOI_DA = 2;
/** Số PLU lớn nhất người dùng đặt được (9.999.991 trở lên là PLU hệ thống của cân). */
export const PLU_TOI_DA = 9999990;

/** Nghĩa tiếng Việt của phím chức năng in sẵn 64–73 (tầng 0). */
export const CHUC_NANG_PHIM: Record<number, string> = {
  64: 'sang tầng phím thứ hai', 65: 'chế độ tự động', 66: 'nhập trọng lượng bằng tay', 67: 'đổi loại giấy',
  68: 'in lại tem', 69: 'giảm theo phần trăm', 70: 'giảm số tiền', 71: 'sửa đơn giá', 72: 'bán theo tổng tiền',
  73: 'mở ngăn kéo tiền',
};

/** Tên mã chức năng khi phím mang số âm (danh sách "Shortcut Function" của hãng, chỉ những mã hay gặp). */
const TEN_HAM: Record<number, string> = {
  11: '00', 68: '000', 12: 'Clear', 13: 'Cancel', 14: 'Accu/Confirm', 15: 'Cash/Print', 16: 'PLU', 17: 'F-Prog', 22: 'Amend',
  23: '×', 24: 'Feed', 25: 'Zero', 26: 'Tare', 27: 'Sale', 28: 'Prog', 29: 'Account', 30: 'Time', 31: '-%', 32: '-Num',
  33: '@Price', 34: 'T-Sale', 35: 'CashBox', 38: 'Manual Weight', 39: 'Paper Type', 40: 'Re-Print', 41: 'Shift',
  45: 'CCard', 52: 'Auto Mode',
};
for (let i = 1; i <= 10; i++) TEN_HAM[i] = String(i - 1);

export interface PhimXem {
  trang: number;
  phim: number;
  nhan: string;
  /** Số PLU; 0 = phím trống; âm = phím mang chức năng của cân. */
  plu: number;
  /** Thêm ngoài hợp đồng: gán hàng được không (phím chữ 1–63 và không phải phím chức năng). */
  suaDuoc: boolean;
  /** Thêm ngoài hợp đồng: vì sao không sửa được. */
  ghiChu?: string;
}

const tenTang = (t: number) => (t === 0 ? 'tầng 1 (bấm thẳng)' : t === 1 ? 'tầng 2 (Shift)' : `tầng ${t + 1}`);
const tenPhim = (phim: number) => (NHAN_PHIM[phim] ? `${NHAN_PHIM[phim]} (số ${phim})` : `số ${phim}`);

function lyDoKhongSua(trang: number, phim: number, plu: number): string | null {
  if (trang === 0 && phim > PHIM_CHU_TOI_DA && phim <= PHIM_TANG_0_TOI_DA) {
    return `Phím ${tenPhim(phim)} là phím chức năng in sẵn trên cân (${CHUC_NANG_PHIM[phim]}), không gán hàng được.`;
  }
  if (phim < 1 || phim > PHIM_CHU_TOI_DA || trang < 0 || trang > TANG_TOI_DA) {
    return `Phím ${tenPhim(phim)} ở ${tenTang(trang)} không phải phím tắt gọi hàng.`;
  }
  if (plu < 0) {
    const ten = TEN_HAM[-plu];
    return `Phím ${tenPhim(phim)} ở ${tenTang(trang)} đang là phím chức năng của cân (mã ${-plu}${ten ? ` — ${ten}` : ''}), không sửa ở đây.`;
  }
  return null;
}

interface DongScp { trang: number; phim: number; plu: number; viTri: number[] }

function docScp(dong: string[], khoi: { dau: number; cuoi: number }[]): Map<string, DongScp> {
  const ra = new Map<string, DongScp>();
  for (const k of khoi) {
    for (let i = k.dau + 1; i < k.cuoi; i++) {
      const c = dong[i].split('\t');
      if (c[0] !== 'SCP') continue;
      const trang = soNguyen(c[1]), phim = soNguyen(c[2]), plu = soNguyen(c[3]);
      if (trang === null || phim === null || plu === null) continue;
      const khoa = `${trang}:${phim}`;
      const cu = ra.get(khoa);
      ra.set(khoa, { trang, phim, plu, viTri: [...(cu?.viTri ?? []), i] });
    }
  }
  return ra;
}

/** Các phím trong file (mọi khối SCP, dòng sau thắng), xếp theo tầng rồi số phím. Bỏ phím số 0 (hàng giả của PC). */
export function docPhim(f: FileCan): PhimXem[] {
  const ra: PhimXem[] = [];
  for (const p of docScp(f.dong, timKhoi(f.dong, 'SCP').khoi).values()) {
    if (p.phim <= 0) continue;
    const lyDo = lyDoKhongSua(p.trang, p.phim, p.plu);
    ra.push({ trang: p.trang, phim: p.phim, nhan: NHAN_PHIM[p.phim] ?? `Phím ${p.phim}`, plu: p.plu, suaDuoc: lyDo === null,
      ...(lyDo ? { ghiChu: lyDo } : {}) });
  }
  return ra.sort((a, b) => a.trang - b.trang || a.phim - b.phim);
}

/** Số PLU có trong các khối PLU của file; null nếu file không có phần PLU (khi đó không kiểm). */
function soPluTrongFile(dong: string[]): Set<number> | null {
  const { khoi } = timKhoi(dong, 'PLU');
  if (khoi.length === 0) return null;
  const ra = new Set<number>();
  for (const k of khoi) {
    for (let i = k.dau + 1; i < k.cuoi; i++) {
      const c = dong[i].split('\t');
      const so = c[0] === 'PLU' ? soNguyen(c[1]) : null;
      if (so !== null) ra.add(so);
    }
  }
  return ra;
}

/**
 * Gán phím tắt trong file gốc: mỗi mục là (tầng, phím, số PLU); PLU 0 = bỏ phím (ghi tường minh dòng 0).
 *   - Tầng 0–2, phím 1–63. Phím chức năng 64–73 ở tầng 0 và phím đang mang chức năng (PLU âm) → LoiThongSo.
 *   - Số PLU 1–9.999.990 và phải có trong phần PLU của file (nếu file có phần PLU).
 *   - Kiểm tất cả trước khi sửa. Sửa đúng dòng SCP của phím (dòng khác giữ y nguyên byte); phím chưa có dòng thì
 *     thêm vào cuối khối SCP sau cùng (không có khối → thêm khối mới trước "END ECS").
 *   - `khoi` = ["DWL\tSCP\t", "SCP\t0\t5\t12\t", …, "END\tSCP\t"] chỉ các phím đổi (rỗng nếu không đổi gì);
 *     `doi` (thêm ngoài hợp đồng) = các phím đã đổi.
 * Cân có nhận khối SCP gửi riêng qua cổng 33571 không: chưa thử trên cân thật.
 */
export function suaPhim(du: Uint8Array, thay: { trang: number; phim: number; plu: number }[]):
  { du: Uint8Array<ArrayBuffer>; khoi: string[]; doi: { trang: number; phim: number }[] } {
  const yeuCau = new Map<string, { trang: number; phim: number; plu: number }>();
  for (const t of thay ?? []) {
    const trang = Number(t?.trang), phim = Number(t?.phim), plu = Number(t?.plu);
    if (!Number.isInteger(trang) || trang < 0 || trang > TANG_TOI_DA) {
      throw new LoiThongSo('Tầng phím chỉ có 1 (bấm thẳng), 2 (bấm Shift trước) và 3.');
    }
    if (!Number.isInteger(phim) || phim < 1 || phim > PHIM_TANG_0_TOI_DA || (trang > 0 && phim > PHIM_CHU_TOI_DA)) {
      throw new LoiThongSo(`Phím số ${t?.phim} không có: phím tắt gọi hàng là phím số 1–${PHIM_CHU_TOI_DA}.`);
    }
    const lyDo = lyDoKhongSua(trang, phim, 0);
    if (lyDo) throw new LoiThongSo(lyDo);
    if (!Number.isInteger(plu) || plu < 0 || plu > PLU_TOI_DA) {
      throw new LoiThongSo(`Số PLU phải là số nguyên từ 1 đến ${dinhSo(PLU_TOI_DA)} (0 = bỏ phím).`);
    }
    const khoa = `${trang}:${phim}`;
    if (yeuCau.has(khoa)) throw new LoiThongSo(`Phím ${tenPhim(phim)} ở ${tenTang(trang)} được gán hai lần trong cùng một lần sửa.`);
    yeuCau.set(khoa, { trang, phim, plu });
  }

  const f = tachDong(du);
  const { khoi, hong } = timKhoi(f.dong, 'SCP');
  if (hong) {
    throw new LoiThongSo('Phần phím tắt (SCP) trong file bị hỏng (thiếu dòng kết thúc). Lưu lại dữ liệu từ cân ra USB rồi tải lên lại.');
  }
  const hienTai = docScp(f.dong, khoi);
  const coPlu = soPluTrongFile(f.dong);

  // Kiểm với file trước khi sửa gì.
  for (const [khoa, y] of yeuCau) {
    const cu = hienTai.get(khoa);
    if (cu && cu.plu < 0) throw new LoiThongSo(lyDoKhongSua(y.trang, y.phim, cu.plu) as string);
    if (y.plu > 0 && coPlu && !coPlu.has(y.plu)) {
      throw new LoiThongSo(`Trên cân không có hàng PLU ${y.plu} — gửi hàng xuống cân trước rồi mới gán phím.`);
    }
  }

  const dong = f.dong.slice();
  const doi: { trang: number; phim: number; plu: number }[] = [];
  const dongThem: string[] = [];
  const thuTu = [...yeuCau.values()].sort((a, b) => a.trang - b.trang || a.phim - b.phim);
  for (const y of thuTu) {
    const cu = hienTai.get(`${y.trang}:${y.phim}`);
    if (cu && cu.plu === y.plu) continue;
    doi.push(y);
    const chuan = `SCP\t${y.trang}\t${y.phim}\t${y.plu}\t`;
    if (!cu) { dongThem.push(chuan); continue; }
    for (const i of cu.viTri) {
      const c = dong[i].split('\t');
      if (c.length >= 5) { c[3] = String(y.plu); dong[i] = c.join('\t'); } else dong[i] = chuan;
    }
  }
  if (doi.length === 0) return { du: new Uint8Array(du), khoi: [], doi: [] };
  if (dongThem.length) {
    if (khoi.length) dong.splice(khoi[khoi.length - 1].cuoi, 0, ...dongThem);
    else chenKhoiMoi(dong, ['DWL\tSCP\t', ...dongThem, 'END\tSCP\t']);
  }
  return {
    du: ghepDong(f, dong),
    khoi: ['DWL\tSCP\t', ...doi.map(y => `SCP\t${y.trang}\t${y.phim}\t${y.plu}\t`), 'END\tSCP\t'],
    doi: doi.map(({ trang, phim }) => ({ trang, phim })),
  };
}
