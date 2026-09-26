/**
 * CÂU CHỮ CỐ ĐỊNH — phần NỀN của trang
 * ====================================
 * Mọi câu trong file này đều là dữ kiện ĐÃ ĐƯỢC XÁC NHẬN, đối chiếu với
 * 02_Brand/Beeftown_Brand_Overview.md v0.10 (20/09/2026) và
 * deliverables/Beeftown_IMC_Plan_v4_2026-09-19.md.
 *
 * Không có công tắc nào tắt được phần này, và cũng không cần — vì không câu
 * nào ở đây phụ thuộc vào một thứ chưa chốt.
 *
 * BA THỨ TIẾNG. Tiếng Việt là bản gốc. Bản tiếng Anh và tiếng Hàn dịch từ
 * NGHĨA của câu tiếng Việt, không thêm dữ kiện, lời hứa hay tiện ích nào câu
 * gốc không nói — và mọi điều cấm dưới đây áp dụng cho cả ba bản.
 *
 * ĐIỀU KHÔNG ĐƯỢC XUẤT HIỆN Ở ĐÂY:
 *   · giá, ngày mở, giờ phục vụ, số điện thoại — chưa chốt, thuộc cổng nội dung
 *   · "rẻ", lợi thế giá, "best beef in town", "số một", "duy nhất"
 *   · Wagyu, MB9, số ngày ủ, nguồn gốc hay grade thịt
 *   · phòng riêng, chỗ gửi xe — chưa xác nhận
 *   · kinh nghiệm 25 năm của John và Sang gán cho Khánh
 *   · than hoa, than củi — nhà hàng nướng bằng vỉ gas đặt trên bàn
 */

import type { NgonNgu } from './noi-dung';

export const THUONG_HIEU = {
  ten: 'Beeftown',
  // Khẩu hiệu tiếng Anh, giữ nguyên ở mọi bản ngôn ngữ.
  khauHieu: 'Pick it, Grill it, Love it',
  // "Tên ngành hàng đã chốt" — Brand Overview mục 2.
  descriptor: 'Beef Specialty Restaurant',
} as const;

/**
 * Mọi ngôn ngữ của trang công khai. Thứ tự này cũng là thứ tự cột của
 * CAP_DUONG_DAN bên dưới — tiếng Việt đứng đầu vì là ngôn ngữ chính, và
 * x-default trỏ về nó.
 */
export const NGON_NGU = ['vi', 'en', 'ko'] as const satisfies readonly NgonNgu[];

/**
 * Tên mỗi thứ tiếng viết BẰNG CHÍNH thứ tiếng đó, trên mọi trang. Người cần
 * nút đổi ngôn ngữ là người chưa đọc được trang đang mở — ghi "Tiếng Hàn" trên
 * trang tiếng Việt thì người Hàn không nhận ra nút dành cho mình.
 */
export const TEN_NGON_NGU: Record<NgonNgu, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ko: '한국어',
};

const VI = {
  // --- Phần nền, luôn hiện --------------------------------------------------
  // Dùng trong tiêu đề trang khi cổng nội dung chưa có tiêu đề đã duyệt.
  nganhHang: 'Nhà hàng chuyên bò',
  diaChiNgan: 'Quận 1, TP.HCM',
  moTaNgan: 'Nhà hàng chuyên bò tại Quận 1, TP.HCM.',
  gioiThieu:
    'Beeftown đang chuẩn bị tại khu Cầu Ông Lãnh. Chọn bò tại quầy, nói khẩu vị ' +
    'để nhân viên tư vấn, rồi cùng cả bàn thưởng thức. Tụi mình sẽ kể dần câu ' +
    'chuyện trong bếp và cập nhật lịch mở tại đây.',

  // Bản dự phòng khi khóa dong_trang_thai chưa được công bố.
  trangThaiMacDinh:
    'Beeftown đang chuẩn bị đón bạn. Lịch mở cửa sẽ được cập nhật tại đây.',

  // Đứng TRƯỚC ngày khai trương, khi ngày đó đã công bố.
  moCuaTu: 'Mở cửa từ',
  donBanTu: 'Đón bạn từ',

  theoDoi: 'Theo dõi Beeftown',
  theoDoiPhu: 'Tin mới về bếp, quầy bò và lịch mở cửa',
  nhanTin: 'Nhắn Beeftown',
  chiDuong: 'Chỉ đường',
  goiNhaHang: 'Gọi nhà hàng',
  xemMenu: 'Xem thực đơn',
  datBan: 'Đặt bàn',

  // --- Tuyển dụng -----------------------------------------------------------
  tuyenDung: 'Tuyển dụng',
  tuyenDungTieuDe: 'Beeftown đang tìm người',
  tuyenDungDan:
    'Nhà hàng đang tuyển đội mở cửa cho ba bộ phận: quầy thịt, bếp và sảnh. ' +
    'Nhân viên sảnh làm bán thời gian, nhận cả người chưa có kinh nghiệm; quầy thịt và bếp cần người đã có tay nghề.',
  tuyenDungCachNop:
    'Gửi cho Beeftown họ tên, vị trí muốn ứng tuyển và số điện thoại. ' +
    'Nhà hàng sẽ gọi lại để hẹn gặp.',
  tuyenDungXem: 'Xem vị trí đang tuyển',
  tuyenDungChuaMo:
    'Cổng nộp hồ sơ trực tuyến chưa mở. Trong lúc chờ, bạn nhắn trực tiếp cho ' +
    'Beeftown qua Facebook là nhanh nhất.',

  // --- Đặt bàn --------------------------------------------------------------
  datBanChuaMo: 'Beeftown chưa mở đặt bàn trực tuyến',
  datBanChuaMoGiaiThich:
    'Nhà hàng đang hoàn thiện và giờ phục vụ chưa được chốt. Để giữ chỗ, bạn ' +
    'nhắn cho Beeftown qua Facebook — nhà hàng trả lời trong ngày.',

  // --- Chung ----------------------------------------------------------------
  quyenRiengTu: 'Quyền riêng tư',
  // Nhãn cho trình đọc màn hình của cụm nút đổi ngôn ngữ.
  chonNgonNgu: 'Ngôn ngữ',
  banQuyen: 'Beeftown',
  boQuaToiNoiDung: 'Bỏ qua, tới nội dung chính',
};

/**
 * Bản tiếng Việt là khuôn: bản khác thiếu một khóa, hay thừa một khóa gõ sai
 * tên, là lỗi biên dịch — không phải một chỗ trống trên trang tiếng Hàn mà
 * không ai đọc được để báo.
 */
type Bo = Record<keyof typeof VI, string>;

const EN: Bo = {
  nganhHang: THUONG_HIEU.descriptor,
  diaChiNgan: 'District 1, Ho Chi Minh City',
  moTaNgan: 'A beef specialty restaurant in District 1, Ho Chi Minh City.',
  gioiThieu:
    'Beeftown is getting ready near Cau Ong Lanh. Pick your beef at the counter, ' +
    'tell us how you like it, and share the table. We will share what happens in ' +
    'the kitchen and post our opening schedule here.',

  trangThaiMacDinh:
    'Beeftown is getting ready to welcome you. Opening hours will be posted here.',

  moCuaTu: 'Open since',
  donBanTu: 'Opening',

  theoDoi: 'Follow Beeftown',
  theoDoiPhu: 'Updates from the kitchen, the counter, and our opening date',
  nhanTin: 'Message Beeftown',
  chiDuong: 'Directions',
  goiNhaHang: 'Call the restaurant',
  xemMenu: 'View the menu',
  datBan: 'Book a table',

  tuyenDung: 'Careers',
  tuyenDungTieuDe: 'Beeftown is hiring',
  tuyenDungDan:
    'We are building our opening team across three departments: Butcher, Kitchen and Hall. ' +
    'Hall Crew roles are part-time and open to people without experience; Butcher and Kitchen roles need hands-on experience.',
  tuyenDungCachNop:
    'Send us your name, the role you want, and your phone number. ' +
    'We will call you back to arrange a meeting.',
  tuyenDungXem: 'See open roles',
  tuyenDungChuaMo:
    'Online applications are not open yet. For now, the fastest way is to message ' +
    'Beeftown directly on Facebook.',

  datBanChuaMo: 'Online booking is not open yet',
  datBanChuaMoGiaiThich:
    'The restaurant is still being fitted out and our hours are not confirmed. ' +
    'To hold a table, message Beeftown on Facebook — we reply the same day.',

  quyenRiengTu: 'Privacy',
  chonNgonNgu: 'Language',
  banQuyen: 'Beeftown',
  boQuaToiNoiDung: 'Skip to main content',
};

// Tiếng Hàn: văn lịch sự 해요체 từ đầu đến cuối. "Quận 1, TP.HCM" viết theo
// cách người Hàn ở Sài Gòn vẫn gọi (호치민시 1군); tên khu Cầu Ông Lãnh để
// nguyên chữ Việt vì đó là chữ khách sẽ thấy trên biển đường và trên bản đồ.
const KO: Bo = {
  nganhHang: '소고기 전문점',
  diaChiNgan: '호치민시 1군',
  moTaNgan: '호치민시 1군에 있는 소고기 전문점이에요.',
  gioiThieu:
    'Beeftown은 Cầu Ông Lãnh 지역에서 오픈을 준비하고 있어요. 정육 코너에서 소고기를 ' +
    '고르고 원하시는 입맛을 말씀해 주시면 직원이 추천해 드려요. 그리고 테이블에 ' +
    '둘러앉아 다 함께 즐겨 보세요. 주방 이야기와 오픈 일정은 이곳에서 차근차근 전해 드릴게요.',

  trangThaiMacDinh:
    'Beeftown이 손님을 맞이할 준비를 하고 있어요. 오픈 일정은 이곳에서 알려 드릴게요.',

  moCuaTu: '오픈일',
  donBanTu: '오픈 예정일',

  theoDoi: 'Beeftown 팔로우하기',
  theoDoiPhu: '주방과 정육 코너, 오픈 일정 소식',
  nhanTin: 'Beeftown에 메시지 보내기',
  chiDuong: '길찾기',
  goiNhaHang: '매장에 전화하기',
  xemMenu: '메뉴 보기',
  datBan: '예약하기',

  tuyenDung: '채용',
  tuyenDungTieuDe: 'Beeftown에서 함께할 분을 찾고 있어요',
  tuyenDungDan:
    '오픈 팀을 정육, 주방, 홀 세 파트로 꾸리고 있어요. ' +
    '홀 직원은 파트타임이고 경력이 없어도 지원할 수 있어요. 정육과 주방은 실무 경력이 있는 분을 찾고 있어요.',
  tuyenDungCachNop:
    'Beeftown에 이름, 지원하려는 포지션, 전화번호를 보내 주세요. ' +
    '매장에서 다시 전화드려 만나 뵐 일정을 잡을게요.',
  tuyenDungXem: '채용 중인 포지션 보기',
  tuyenDungChuaMo:
    '온라인 지원 창구는 아직 열리지 않았어요. 그동안은 Facebook으로 ' +
    'Beeftown에 직접 메시지를 보내 주시는 게 빨라요.',

  datBanChuaMo: 'Beeftown은 아직 온라인 예약을 받지 않아요',
  datBanChuaMoGiaiThich:
    '매장 준비를 마무리하고 있고 영업시간도 아직 정해지지 않았어요. 예약을 원하시면 ' +
    'Facebook으로 Beeftown에 메시지를 보내 주세요. 당일 안에 답변드려요.',

  quyenRiengTu: '개인정보 처리방침',
  chonNgonNgu: '언어',
  banQuyen: 'Beeftown',
  boQuaToiNoiDung: '본문으로 바로가기',
};

const BO: Record<NgonNgu, Bo> = { vi: VI, en: EN, ko: KO };

export function chu(ngonNgu: NgonNgu): Bo {
  return BO[ngonNgu];
}

/**
 * MỘT CÂU Ở ĐỦ BA THỨ TIẾNG — cho câu chữ riêng của từng component
 *
 * Thay cho kiểu `ngonNgu === 'en' ? 'A' : 'B'`. Kiểu đó chỉ đúng khi có đúng
 * hai thứ tiếng: thêm thứ ba là mọi ngôn ngữ không phải 'en' rơi vào nhánh
 * tiếng Việt, và trang tiếng Hàn hiện chữ Việt mà không có gì báo lỗi. Ở đây
 * một câu thiếu một thứ tiếng thì không biên dịch được.
 */
export type BaThuTieng<T = string> = Readonly<Record<NgonNgu, T>>;

/** { khoa: { vi, en, ko } } → { khoa: bản của ngonNgu }. Giá trị có thể là hàm, cho câu có số. */
export function dich<B extends Record<string, BaThuTieng<unknown>>>(
  ngonNgu: NgonNgu, bang: B,
): { [K in keyof B]: B[K][NgonNgu] } {
  const ra = {} as { [K in keyof B]: B[K][NgonNgu] };
  for (const khoa in bang) ra[khoa] = bang[khoa][ngonNgu];
  return ra;
}

/**
 * BẢNG ĐƯỜNG DẪN — mỗi dòng là MỘT trang ở ba thứ tiếng [vi, en, ko]
 *
 * Phải liệt kê tay, không suy ra được. Đường dẫn tiếng Anh dùng TỪ TIẾNG ANH
 * — /en/jobs chứ không phải /en/tuyen-dung — vì người Anh gõ và đọc đường dẫn
 * đó, và vì Google xếp hạng theo từ khóa trong đường dẫn. Bản tiếng Hàn dùng
 * lại đúng những từ tiếng Anh đó dưới /ko: đường dẫn bằng chữ Hàn bị mã hóa
 * phần trăm mỗi lần chép ra khỏi thanh địa chỉ (/ko/%EC%B1%84%EC%9A%A9…), dài
 * và không đọc được khi dán vào tin nhắn.
 *
 * Bản đầu tiên của hàm đổi ngôn ngữ chỉ ghép '/en' vào trước đường dẫn tiếng
 * Việt. Hệ quả: nút "English" trên trang tuyển dụng trỏ tới /en/tuyen-dung, và
 * trang đó KHÔNG TỒN TẠI — mỗi lượt bấm là một trang 404. Trang chủ thì đúng,
 * nên lỗi không lộ ra ở chỗ dễ thấy nhất. Ghép '/ko' theo cùng cách thì sẽ
 * hỏng y hệt, ở /ko/tuyen-dung.
 *
 * Bảng này là nguồn sự thật cho mọi chiều đổi ngôn ngữ và cho cả sitemap, nên
 * thêm một trang mới là sửa đúng một chỗ.
 */
export const CAP_DUONG_DAN: ReadonlyArray<readonly [vi: string, en: string, ko: string]> = [
  ['/',               '/en',         '/ko'],
  ['/tuyen-dung',     '/en/jobs',    '/ko/jobs'],
  ['/dat-ban',        '/en/book',    '/ko/book'],
  ['/quyen-rieng-tu', '/en/privacy', '/ko/privacy'],
] as const;

/**
 * Đường dẫn của CÙNG trang này ở ngôn ngữ `sang`. Không tìm thấy thì về trang
 * chủ của ngôn ngữ `sang` — một trang chủ đúng thứ tiếng vẫn hơn một trang 404.
 *
 * Tìm ở mọi cột nên không cần biết trang đang mở là tiếng gì: mọi đường dẫn
 * trong bảng là duy nhất, vì bản tiếng Anh và tiếng Hàn luôn nằm dưới /en và
 * /ko. Nhờ vậy duongDanTuongUng('/tuyen-dung', 'ko') cũng là cách lấy trang
 * tuyển dụng tiếng Hàn, thay vì chép tay '/ko/jobs' vào component.
 */
export function duongDanTuongUng(duongDan: string, sang: NgonNgu): string {
  const sach = duongDan.length > 1 ? duongDan.replace(/\/$/, '') : duongDan;
  const cap = CAP_DUONG_DAN.find(c => c.includes(sach)) ?? CAP_DUONG_DAN[0];
  return cap[NGON_NGU.indexOf(sang)];
}

// -----------------------------------------------------------------------------
// CÂU LỖI TỪ DATABASE, CHO TRANG TIẾNG ANH VÀ TIẾNG HÀN
// -----------------------------------------------------------------------------
// Hàm trong database raise exception bằng tiếng Việt, và câu đó được viết để
// hiện thẳng cho khách (0012, 0013). Trang tiếng Việt vẫn dùng nguyên văn.
// Hai trang kia thì không thể: "Số điện thoại không hợp lệ" giữa một trang
// tiếng Hàn là câu khách không đọc được — mà khách Hàn điền số +82 lại chính
// là người dễ gặp câu đó nhất, vì database chỉ nhận số Việt Nam.
//
// Nhận ra câu bằng phần ĐẦU câu, vì đuôi câu mang giá trị (giờ, ngày, số điện
// thoại). Câu không có trong bảng — hoặc database đổi chữ — thì rơi về câu
// chung của form: "chưa gửi được, CHƯA được ghi nhận". Câu đó vẫn đúng, vì
// exception nghĩa là cả giao dịch đã hủy, không dòng nào được ghi.
// -----------------------------------------------------------------------------
const CO_DAU = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

const LOI_DATABASE: ReadonlyArray<readonly [RegExp, Readonly<Record<'en' | 'ko', string>>]> = [
  // tao_dat_ban() — 0013
  [/^Form đặt bàn đang tạm đóng/, {
    en: 'Online booking is temporarily closed.',
    ko: '온라인 예약이 잠시 중단되었어요.',
  }],
  [/^Không thể đặt bàn cho ngày trong quá khứ/, {
    en: 'A table cannot be booked for a date in the past.',
    ko: '지난 날짜로는 예약할 수 없어요.',
  }],
  [/^Khung giờ \S+ hôm nay đã qua/, {
    en: 'That time has already passed today.',
    ko: '선택하신 시간대는 오늘 이미 지났어요.',
  }],
  [/^Khung giờ \S+ ngày \S+ đã hết bàn/, {
    en: 'No tables are available at that time.',
    ko: '선택하신 시간대에는 예약 가능한 자리가 없어요.',
  }],
  // tim_hoac_tao_khach() — 0002, gọi từ tao_dat_ban(); và nop_ho_so_ung_tuyen() — 0026
  [/^Số điện thoại không hợp lệ/, {
    en: 'The phone number is not valid.',
    ko: '전화번호가 올바르지 않아요.',
  }],
  // nop_ho_so_ung_tuyen() — 0026
  [/^Cổng tuyển dụng đang tạm đóng/, {
    en: 'Online applications are temporarily closed.',
    ko: '온라인 지원이 잠시 중단되었어요.',
  }],
  [/^Bạn đã nộp quá nhiều hồ sơ/, {
    en: 'You have sent too many applications. Please contact the restaurant directly.',
    ko: '지원서를 너무 많이 보내셨어요. 매장에 직접 연락해 주세요.',
  }],
  [/^Không tìm thấy vị trí tuyển dụng/, {
    en: 'This role could not be found.',
    ko: '선택하신 포지션을 찾을 수 없어요.',
  }],
  [/^Vị trí này đã hết hạn nhận hồ sơ/, {
    en: 'This role is no longer accepting applications.',
    ko: '이 포지션은 지원이 마감되었어요.',
  }],
];

/**
 * Câu khách đọc khi database từ chối. `cauChung` là câu dự phòng của form, ở
 * đúng ngôn ngữ của trang.
 */
export function cauLoiDatabase(thongDiep: string, ngonNgu: NgonNgu, cauChung: string): string {
  if (ngonNgu === 'vi') return CO_DAU.test(thongDiep) ? thongDiep : cauChung;
  return LOI_DATABASE.find(([mau]) => mau.test(thongDiep))?.[1][ngonNgu] ?? cauChung;
}
