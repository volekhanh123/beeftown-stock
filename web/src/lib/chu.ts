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
 *   · phòng riêng, chỗ gửi xe, lối cho xe lăn — chưa xác nhận
 *   · tên phường của nhà hàng — chưa có giấy xác nhận (xem DIA_CHI_PHAN)
 *   · kinh nghiệm 25 năm của John và Sang gán cho Khánh
 *   · than hoa, than củi — nhà hàng nướng bằng vỉ gas đặt trên bàn
 */

import type { NgonNgu } from './noi-dung';

export const THUONG_HIEU = {
  ten: 'Beeftown',
  // Khẩu hiệu tiếng Anh, giữ nguyên ở mọi bản ngôn ngữ. Cách viết chuẩn trên web
  // theo brief 06/10/2026: ba câu, dấu chấm. (Logo gốc vẫn in "PICK IT – GRILL
  // IT – LOVE IT" — đó là nét chữ của logo, không gõ lại.)
  khauHieu: 'Pick it. Grill it. Love it.',
  // "Tên ngành hàng đã chốt" — Brand Overview mục 2.
  descriptor: 'Beef Specialty Restaurant',
} as const;

/**
 * PHÁP NHÂN — công ty đứng tên trang, ghi ở chân MỌI trang công khai, ngay dưới
 * dòng "© … Beeftown · Beef Specialty Restaurant". Khánh cung cấp 04/10/2026.
 *
 * Tên công ty và địa chỉ trụ sở là chữ pháp lý: GIỮ NGUYÊN tiếng Việt, đúng từng
 * ký tự như Khánh đưa, ở cả ba thứ tiếng — dịch ra là thành một cái tên không có
 * trên giấy tờ nào. Đổi chữ nào thì đối chiếu giấy đăng ký doanh nghiệp trước.
 * Chỉ nhãn "Mã số thuế" được dịch (khóa maSoThue bên dưới). web/kiem-tra/trinh-duyet.mjs đọc chân trang của từng trang
 * công khai và so với đúng các chuỗi này.
 */
export const PHAP_NHAN = {
  ten: 'CÔNG TY TNHH SLK GROUP',
  maSoThue: '0319712805',
  diaChi: 'Tầng 3, 11-13-15-17-19-21 Hàm Nghi, Phường Sài Gòn, TP. Hồ Chí Minh',
} as const;

/**
 * ĐỊA CHỈ NHÀ HÀNG — Tầng 3, 63 Hồ Tùng Mậu. Khánh quyết: địa điểm 63 Hồ Tùng Mậu
 * (07/10/2026); quán ở tầng 3, khách vào bằng lối vào riêng ngay cạnh GS25 (09/10/2026).
 * Địa chỉ hiện cố định trên trang công khai, kể cả khi chưa nối database. Khóa
 * dia_chi_hien_thi của cổng nội dung (nếu được công bố) thay cho chuỗi này.
 *
 * Giữ tiếng Việt ở cả ba thứ tiếng (lang="vi" khi in ra): đây là chữ khách đưa
 * cho tài xế và gõ vào bản đồ. Phần cần dịch — "Tầng 3", câu chỉ đường — nằm ở
 * khóa tang3 / loiLen bên dưới. Trong câu văn tiếng Anh ghi "Floor 3, 63 Hồ Tùng
 * Mậu", tiếng Hàn ghi "Hồ Tùng Mậu 63, 3층".
 *
 * KHÔNG CÓ TÊN PHƯỜNG: phường của 63 Hồ Tùng Mậu chưa có giấy xác nhận, nên không
 * ghi ở đâu cả — trang, thẻ mô tả, JSON-LD. Địa chỉ này KHÔNG liên quan tới
 * PHAP_NHAN.diaChi ở trên. Khi có giấy, sửa CÙNG LÚC:
 *   · mã: thêm khóa phuong vào đây, ghép vào DIA_CHI_NHA_HANG, khai addressLocality
 *     trong diaChiCoCauTruc() (lib/trang-cong-khai.ts);
 *   · kiểm thử: crm/test/test-cong-khai-dia-diem.mjs nhóm 4, test-cong-khai-trang-chu.mjs
 *     nhóm 4, luật PHUONG_QUAN và bảng câu thử trong web/kiem-tra/mau-dia-diem.mjs (cả
 *     test-cong-khai-cau-chu.mjs nhóm 7 chạy luật đó), kiểm tra JSON-LD trong
 *     web/kiem-tra/trinh-duyet.mjs, địa chỉ thử trong web/kiem-tra/thu-day-du.mjs nhóm 7;
 *   · tài liệu: THUONG-HIEU.md mục 6, AGENTS.md mục "Địa điểm", web/THIET-KE.md mục 10.
 *
 * Điều đã biết về đường đến chỉ có: lối vào riêng ngay cạnh GS25 (Khánh quyết
 * 09/10/2026), khách đi thang máy lên tầng 3 (Khánh xác nhận 11/10/2026: địa điểm có
 * thang máy). Nút thang máy ghi số mấy cho tầng của quán thì CHƯA BIẾT — không viết số
 * nút. Không viết thêm chỗ gửi xe, mốc đường, số bước, khoảng cách, lối cho xe lăn khi
 * chưa có người xác nhận.
 */
export const DIA_CHI_PHAN = {
  duong: 'Tầng 3, 63 Hồ Tùng Mậu',
  thanhPho: 'TP.HCM',
} as const;
export const DIA_CHI_NHA_HANG = `${DIA_CHI_PHAN.duong}, ${DIA_CHI_PHAN.thanhPho}`;

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
  diaChiNgan: '63 Hồ Tùng Mậu, TP.HCM',
  moTaNgan: 'Nhà hàng chuyên bò ở tầng 3, 63 Hồ Tùng Mậu, TP.HCM. Chọn bò tại quầy, cùng cả bàn nướng và thưởng thức.',
  // Câu chính của trang chủ (h1) — brief 06/10/2026.
  // \u00a0: "bạn thích", "cả bàn" không bị tách hai dòng ở màn hẹp.
  cauChinh: 'Chọn phần bò bạn\u00a0thích, rồi cùng cả\u00a0bàn thưởng thức.',
  gioiThieu:
    'Bò được cắt và đóng khay sẵn tại quầy. Bạn nhìn tận mắt, xem nhãn, nhờ ' +
    'nhân viên tư vấn — rồi cả bàn cùng nướng trên vỉ gas đặt tại bàn.',

  // Bản dự phòng khi khóa dong_trang_thai chưa được công bố.
  trangThaiMacDinh:
    'Beeftown đang chuẩn bị đón bạn.',

  // Đứng TRƯỚC ngày khai trương, khi ngày đó đã công bố.
  moCuaTu: 'Mở cửa từ',
  donBanTu: 'Đón bạn từ',

  theoDoi: 'Theo dõi Beeftown',
  theoDoiPhu: 'Tin mới về bếp, quầy bò và lịch mở cửa',
  nhanTin: 'Nhắn Beeftown',
  guiEmail: 'Gửi email cho Beeftown',
  chiDuong: 'Chỉ đường',
  goiNhaHang: 'Gọi nhà hàng',
  xemMenu: 'Xem thực đơn',
  // Tên nhóm món đã xác nhận bán (brief 06/10/2026) — MỘT bộ tên cho trang chủ và
  // trang Thực đơn. Tên nhóm, không tên món, không mô tả nguyên liệu.
  nhomSalad: 'Salad & khai vị',
  nhomCom: 'Cơm',
  nhomMiY: 'Mì Ý',
  nhomMien: 'Miến & mì lạnh',
  nhomCanh: 'Canh Hàn',
  nhomLau: 'Lẩu',
  nhomTrangMieng: 'Tráng miệng',
  nhomNuocEp: 'Nước ép & ade',
  nhomHighball: 'Highball',
  nhomMakgeolli: 'Makgeolli',
  nhomCocktail: 'Cocktail',
  setSot: 'Set sốt cho phần nướng (tùy chọn)',
  // Luật quảng cáo rượu bia: in kèm MỌI chỗ nhắc tới đồ uống có cồn.
  luatRuou: 'Beeftown không phục vụ đồ uống có cồn cho người dưới 18 tuổi.',
  khamPhaThucDon: 'Khám phá thực đơn',
  // Nút và mục điều hướng tới trang /dat-ban. "Hỏi bàn" chứ không "Đặt bàn":
  // gửi yêu cầu chưa phải là có bàn — nhà hàng kiểm tra rồi gọi xác nhận.
  datBan: 'Hỏi bàn',

  // --- Điều hướng ------------------------------------------------------------
  dieuHuongChinh: 'Điều hướng chính',
  traiNghiem: 'Trải nghiệm',
  thucDon: 'Thực đơn',
  denBeeftown: 'Đến Beeftown',
  moMenu: 'Danh mục',
  dongMenu: 'Đóng danh mục',
  // Nhãn của nút danh mục khi bảng đang mở (màn hẹp): ngắn, để nút không dài hơn lúc đóng.
  dong: 'Đóng',
  veTrangChu: 'Beeftown — về trang chủ',
  thongTin: 'Thông tin',
  xoaDuLieu: 'Xóa dữ liệu',

  // --- Đường đến ------------------------------------------------------------
  tang3: 'Tầng 3',
  // Câu chỉ đường — đi kèm địa chỉ ở mọi chỗ in địa chỉ. Hai điều trong câu là đã biết (lối vào
  // riêng ngay cạnh GS25: Khánh quyết 09/10/2026; có thang máy: Khánh xác nhận 11/10/2026). CHỮ của
  // câu ở cả ba thứ tiếng là Claude đề xuất, CHỜ KHÁNH DUYỆT. Đổi chữ thì sửa cùng lúc các bản chép tay
  // trong crm/test/test-cong-khai-dia-diem.mjs, test-cong-khai-cau-chu.mjs, web/kiem-tra/trinh-duyet.mjs.
  loiLen: 'Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3.',
  xemDuongLen: 'Xem đường lên tầng 3',
  saoChepDiaChi: 'Sao chép địa chỉ',
  daSaoChep: 'Đã sao chép địa chỉ',

  // Dòng nhỏ đặt trên ảnh tạo bằng công cụ AI (lib/anh.ts).
  anhMinhHoa: 'Ảnh minh họa',

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
    'Cổng nộp hồ sơ trực tuyến chưa mở. Bạn nhắn trực tiếp cho Beeftown qua ' +
    'Facebook là nhanh nhất.',

  // --- Đặt bàn --------------------------------------------------------------
  datBanChuaMo: 'Beeftown chưa mở hỏi bàn trực tuyến',
  // Không hứa thời gian trả lời — brief 06/10/2026 cấm. Phải còn chữ "Facebook":
  // trinh-duyet.mjs kiểm trang hỏi bàn chỉ đường sang đó khi form đóng.
  datBanChuaMoGiaiThich:
    'Muốn hỏi bàn, bạn nhắn cho Beeftown qua Facebook — nhà hàng sẽ kiểm tra và ' +
    'liên hệ lại với bạn.',
  // Mô tả (meta description, og:description) của trang hỏi bàn — trang-cong-khai.ts moTaTrangHoiBan()
  // chọn theo form có dựng được không. Form không dựng được thì KHÔNG hứa "gửi yêu cầu, nhà hàng gọi
  // lại" (kiểm site thật 07/10/2026): nói đúng điều thẻ "chưa mở" nói — nhắn qua Facebook.
  moTaHoiBan:
    'Hỏi bàn tại Beeftown, nhà hàng chuyên bò ở tầng 3, 63 Hồ Tùng Mậu, TP.HCM. ' +
    'Bạn gửi yêu cầu, nhà hàng kiểm tra rồi gọi lại để xác nhận.',
  moTaHoiBanChuaMo:
    'Beeftown, nhà hàng chuyên bò ở tầng 3, 63 Hồ Tùng Mậu, TP.HCM, chưa mở hỏi bàn trực tuyến. ' +
    'Muốn hỏi bàn, bạn nhắn cho Beeftown qua Facebook.',

  // --- Trang không có (404, pages/404.astro) --------------------------------
  // Không đoán đường dẫn hỏng vì đâu, chỉ nói điều chắc chắn đúng.
  khongCoTieuDeTrang: 'Không có trang này — Beeftown',
  khongCoTieuDe: 'Không có trang này',
  khongCoGiaiThich:
    'Đường dẫn bạn mở không dẫn tới trang nào của Beeftown. Có thể địa chỉ bị gõ sai, hoặc link đã cũ.',
  khongCoVeTrangChu: 'Về trang chủ',
  // Nhãn trên hai nút trang chủ của hai thứ tiếng còn lại.
  khongCoTrangChuKhac: 'Trang chủ bằng thứ tiếng khác',

  // --- Chung ----------------------------------------------------------------
  quyenRiengTu: 'Quyền riêng tư',
  // Nhãn cho trình đọc màn hình của cụm nút đổi ngôn ngữ.
  chonNgonNgu: 'Ngôn ngữ',
  banQuyen: 'Beeftown',
  // Nhãn trước mã số thuế ở chân trang. Tên công ty và địa chỉ không dịch — PHAP_NHAN.
  maSoThue: 'Mã số thuế',
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
  diaChiNgan: '63 Hồ Tùng Mậu, Ho Chi Minh City',
  moTaNgan: 'A beef specialty restaurant on Floor 3, 63 Hồ Tùng Mậu, Ho Chi Minh City. Pick your beef at the counter, then grill and share it at your table.',
  cauChinh: 'Pick the cut you like, then enjoy it with the whole table.',
  gioiThieu:
    'Our beef is cut and packed in trays at the counter. See it for yourself, read ' +
    'the label, ask our staff — then grill it together on the gas grill at your table.',

  trangThaiMacDinh:
    'Beeftown is getting ready to welcome you.',

  moCuaTu: 'Open since',
  donBanTu: 'Opening',

  theoDoi: 'Follow Beeftown',
  theoDoiPhu: 'Updates from the kitchen, the counter, and our opening date',
  nhanTin: 'Message Beeftown',
  guiEmail: 'Email Beeftown',
  chiDuong: 'Directions',
  goiNhaHang: 'Call the restaurant',
  xemMenu: 'View the menu',
  nhomSalad: 'Salads & starters',
  nhomCom: 'Rice dishes',
  nhomMiY: 'Pasta',
  nhomMien: 'Glass & cold noodles',
  nhomCanh: 'Korean soups & stews',
  nhomLau: 'Hot pot',
  nhomTrangMieng: 'Desserts',
  nhomNuocEp: 'Juices & ades',
  nhomHighball: 'Highballs',
  nhomMakgeolli: 'Makgeolli',
  nhomCocktail: 'Cocktails',
  setSot: 'Sauce set for the grill (optional)',
  luatRuou: 'Beeftown does not serve alcohol to anyone under 18.',
  khamPhaThucDon: 'Explore the menu',
  datBan: 'Ask for a table',

  dieuHuongChinh: 'Main navigation',
  traiNghiem: 'Experience',
  thucDon: 'Menu',
  denBeeftown: 'Visit',
  moMenu: 'Pages',
  dongMenu: 'Close pages',
  dong: 'Close',
  veTrangChu: 'Beeftown — home',
  thongTin: 'Information',
  xoaDuLieu: 'Data deletion',

  tang3: 'Floor 3',
  loiLen: 'Use our own entrance, right next to GS25, and take the lift to Floor 3.',
  xemDuongLen: 'How to get to Floor 3',
  saoChepDiaChi: 'Copy address',
  daSaoChep: 'Address copied',

  anhMinhHoa: 'Illustrative image',

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
    'Online applications are not open yet. The fastest way is to message ' +
    'Beeftown directly on Facebook.',

  datBanChuaMo: 'Online table requests are not open yet',
  datBanChuaMoGiaiThich:
    'To ask about a table, message Beeftown on Facebook — we will check and get back to you.',
  moTaHoiBan:
    'Ask for a table at Beeftown, a beef specialty restaurant on Floor 3, 63 Hồ Tùng Mậu, Ho Chi Minh City. ' +
    'Send a request and we will call you back to confirm.',
  moTaHoiBanChuaMo:
    'Beeftown, a beef specialty restaurant on Floor 3, 63 Hồ Tùng Mậu, Ho Chi Minh City, is not taking ' +
    'table requests online yet. To ask about a table, message Beeftown on Facebook.',

  khongCoTieuDeTrang: 'Page not found — Beeftown',
  khongCoTieuDe: 'This page does not exist',
  khongCoGiaiThich:
    'The link you opened does not lead to any Beeftown page. The address may be mistyped, or the link may be out of date.',
  khongCoVeTrangChu: 'Go to the home page',
  khongCoTrangChuKhac: 'Home page in another language',

  quyenRiengTu: 'Privacy',
  chonNgonNgu: 'Language',
  banQuyen: 'Beeftown',
  maSoThue: 'Tax code',
  boQuaToiNoiDung: 'Skip to main content',
};

// Tiếng Hàn: văn lịch sự 해요체 từ đầu đến cuối. Tên đường Hồ Tùng Mậu để nguyên
// chữ Việt vì đó là chữ khách sẽ thấy trên biển đường và trên bản đồ.
const KO: Bo = {
  nganhHang: '소고기 전문점',
  diaChiNgan: '호치민시 Hồ Tùng Mậu 63',
  moTaNgan: '호치민시 Hồ Tùng Mậu 63, 3층에 있는 소고기 전문점이에요. 정육 코너에서 고기를 고르고 테이블에서 함께 구워 드세요.',
  // \u00a0: "함께 온 사람들과" (định ngữ + danh từ) không bị tách hai dòng.
  cauChinh: '좋아하는 부위를 고르고, 함께\u00a0온\u00a0사람들과 즐겨 보세요.',
  gioiThieu:
    '소고기는 정육 코너에서 손질해 트레이에 담아 두었어요. 직접 보고, 라벨을 확인하고, ' +
    '직원에게 추천을 받은 뒤 테이블 가스 그릴에서 다 함께 구워 드세요.',

  trangThaiMacDinh:
    'Beeftown이 손님을 맞이할 준비를 하고 있어요.',

  moCuaTu: '오픈일',
  donBanTu: '오픈 예정일',

  theoDoi: 'Beeftown 팔로우하기',
  theoDoiPhu: '주방과 정육 코너, 오픈 일정 소식',
  nhanTin: 'Beeftown에 메시지 보내기',
  guiEmail: 'Beeftown에 이메일 보내기',
  chiDuong: '길찾기',
  goiNhaHang: '매장에 전화하기',
  xemMenu: '메뉴 보기',
  nhomSalad: '샐러드·전채',
  nhomCom: '밥 요리',
  nhomMiY: '파스타',
  nhomMien: '당면·냉면',
  nhomCanh: '국·찌개',
  nhomLau: '전골',
  nhomTrangMieng: '디저트',
  nhomNuocEp: '주스·에이드',
  nhomHighball: '하이볼',
  nhomMakgeolli: '막걸리',
  nhomCocktail: '칵테일',
  setSot: '구이용 소스 세트 (선택)',
  luatRuou: 'Beeftown은 만 18세 미만에게 주류를 제공하지 않아요.',
  khamPhaThucDon: '메뉴 둘러보기',
  datBan: '테이블 문의',

  dieuHuongChinh: '주요 메뉴',
  traiNghiem: '이용 방법',
  thucDon: '메뉴',
  denBeeftown: '오시는 길',
  moMenu: '바로가기',
  dongMenu: '바로가기 닫기',
  dong: '닫기',
  veTrangChu: 'Beeftown 홈으로',
  thongTin: '안내',
  xoaDuLieu: '데이터 삭제',

  tang3: '3층',
  loiLen: 'GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요.',
  xemDuongLen: '3층 오시는 길 보기',
  saoChepDiaChi: '주소 복사',
  daSaoChep: '주소를 복사했어요',

  anhMinhHoa: '연출 이미지',

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
    '온라인 지원 창구는 아직 열리지 않았어요. Facebook으로 ' +
    'Beeftown에 직접 메시지를 보내 주시는 게 가장 빨라요.',

  datBanChuaMo: 'Beeftown은 아직 온라인 테이블 문의를 받지 않아요',
  datBanChuaMoGiaiThich:
    '테이블 문의는 Facebook으로 Beeftown에 메시지를 보내 주세요. 확인한 뒤 연락드릴게요.',
  moTaHoiBan:
    '호치민시 Hồ Tùng Mậu 63, 3층에 있는 소고기 전문점 Beeftown에 테이블 문의를 보내 주세요. ' +
    '매장에서 확인한 뒤 전화드려요.',
  moTaHoiBanChuaMo:
    '호치민시 Hồ Tùng Mậu 63, 3층에 있는 소고기 전문점 Beeftown은 아직 온라인 테이블 문의를 받지 않아요. ' +
    '테이블 문의는 Facebook으로 Beeftown에 메시지를 보내 주세요.',

  khongCoTieuDeTrang: '페이지를 찾을 수 없어요 — Beeftown',
  khongCoTieuDe: '찾으시는 페이지가 없어요',
  khongCoGiaiThich:
    '열어 보신 주소에는 Beeftown 페이지가 없어요. 주소가 잘못 입력되었거나 오래된 링크일 수 있어요.',
  khongCoVeTrangChu: '홈으로 가기',
  khongCoTrangChuKhac: '다른 언어로 된 홈',

  quyenRiengTu: '개인정보 처리방침',
  chonNgonNgu: '언어',
  banQuyen: 'Beeftown',
  // Dịch đúng nghĩa "mã số thuế", không dùng 사업자등록번호 — người Hàn đọc chữ đó
  // là số đăng ký kinh doanh của Hàn Quốc.
  maSoThue: '세금 코드',
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
  ['/thuc-don',       '/en/menu',    '/ko/menu'],
  ['/den-beeftown',   '/en/visit',   '/ko/visit'],
  ['/tuyen-dung',     '/en/jobs',    '/ko/jobs'],
  ['/dat-ban',        '/en/book',    '/ko/book'],
  ['/quyen-rieng-tu', '/en/privacy', '/ko/privacy'],
  ['/xoa-du-lieu',    '/en/data-deletion', '/ko/data-deletion'],
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

/**
 * Thứ tiếng của một đường dẫn, theo tiền tố: /en, /en/… → en; /ko, /ko/… → ko; còn lại → vi
 * (tiếng Việt không có tiền tố). Cho trang không ứng với dòng nào của CAP_DUONG_DAN — trang 404
 * (pages/404.astro) dựng cho MỌI đường dẫn lạ, chỉ biết thứ tiếng qua đường dẫn khách mở.
 * So trọn đoạn đầu: /english, /kor không phải tiền tố. Không phân biệt hoa thường — /EN/menu
 * gõ tay (hay bị bàn phím tự viết hoa) vẫn là người đọc tiếng Anh.
 */
export function ngonNguTuDuongDan(duongDan: string): NgonNgu {
  const m = /^\/(en|ko)(?:\/|$)/i.exec(duongDan);
  return m ? (m[1].toLowerCase() as NgonNgu) : 'vi';
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
    en: 'Online table requests are temporarily closed.',
    ko: '온라인 테이블 문의가 잠시 중단되었어요.',
  }],
  [/^Không thể đặt bàn cho ngày trong quá khứ/, {
    en: 'Requests cannot be made for a past date.',
    ko: '지난 날짜로는 문의할 수 없어요.',
  }],
  [/^Khung giờ \S+ hôm nay đã qua/, {
    en: 'That time has already passed today.',
    ko: '선택하신 시간대는 오늘 이미 지났어요.',
  }],
  [/^Khung giờ \S+ ngày \S+ đã hết bàn/, {
    en: 'No tables are available at that time.',
    ko: '선택하신 시간대에는 가능한 자리가 없어요.',
  }],
  // tao_dat_ban() — 0066, giới hạn tần suất
  [/^Mạng bạn đang dùng đã gửi quá nhiều yêu cầu đặt bàn/, {
    en: 'Too many table requests have been sent from your network. Please try again later or call the restaurant.',
    ko: '사용 중인 네트워크에서 테이블 문의가 너무 많이 들어왔어요. 잠시 후 다시 시도하시거나 매장에 전화해 주세요.',
  }],
  [/^Số điện thoại này đã có nhiều yêu cầu đặt bàn đang chờ/, {
    en: 'This phone number already has several table requests waiting for the restaurant to confirm. Please call the restaurant.',
    ko: '이 전화번호로 매장 확인을 기다리는 테이블 문의가 이미 여러 건 있어요. 매장에 전화해 주세요.',
  }],
  // tao_dat_ban(), xin_phieu_tai_cv(), nop_ho_so_ung_tuyen() — 0066, trần chung
  [/^Hệ thống đang nhận quá nhiều yêu cầu/, {
    en: 'The system is receiving too many requests right now. Please try again later or contact the restaurant directly.',
    ko: '지금 시스템에 요청이 너무 많이 들어오고 있어요. 잠시 후 다시 시도하시거나 매장에 직접 연락해 주세요.',
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

/**
 * Lỗi supabase-js trả về có đúng là DATABASE trả lời không.
 *
 * supabase-js KHÔNG ném khi lời gọi không tới nơi hay không về được: nó trả
 * error như mọi lỗi khác. Với postgrest-js 2.116 (PostgrestBuilder, nhánh
 * catch của fetch và processResponse):
 *   · fetch hỏng — mất mạng, đứt sau khi đã gửi, bị hủy, hết giờ — luôn là
 *     code '' và message 'TypeError: fetch failed' / 'AbortError: …';
 *   · cổng 502 / 504 / 520 trả trang HTML, hay thân 200 bị cắt — chỉ có
 *     message (chính trang HTML đó), không có code;
 *   · cổng API trả JSON của riêng nó (503 { message }) — cũng không có code.
 * Những lúc đó database CÓ THỂ đã ghi xong rồi câu trả lời mới mất: không
 * được nói "chưa ghi nhận". Lỗi thật của database / PostgREST luôn có mã —
 * SQLSTATE 5 ký tự có ít nhất một chữ số (P0001, 23505, 22P02, XX000) hoặc
 * PGRST + 3 số — và exception nghĩa là cả giao dịch đã hủy, nên lúc đó "chưa
 * ghi nhận" mới đúng. Mã nào khác ("EPIPE", "ERROR" của một proxy, PGRSTX00
 * — lỗi thư viện kết nối, không biết giao dịch đi tới đâu) đều là KHÔNG CHẮC:
 * nói "không chắc" khi thật ra chưa ghi chỉ làm khách nhắn hỏi thêm; nói
 * "chưa ghi" khi thật ra đã ghi thì nhà hàng nhận hai bản.
 */
export function laLoiDatabase(error: { code?: unknown } | null | undefined): boolean {
  return typeof error?.code === 'string' && /^(?:(?=[0-9A-Z]*\d)[0-9A-Z]{5}|PGRST\d{3})$/.test(error.code);
}
