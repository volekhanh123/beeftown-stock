/**
 * SUPABASE GIẢ CHO TRANG CÔNG KHAI — trạng thái "đã nối database"
 * ==============================================================
 *
 *     node kiem-tra/gia-supabase.mjs                      ← cổng 54331, kịch bản day-du
 *     node kiem-tra/gia-supabase.mjs --cong 54331 --kich-ban rong
 *     PUBLIC_SUPABASE_URL=http://127.0.0.1:54331 PUBLIC_SUPABASE_ANON_KEY=khoa-thu npx astro dev …
 *
 * CI không có web/.env, nên mọi kiểm thử trình duyệt khác chỉ thấy trang ở trạng thái
 * "chưa nối database". Trạng thái còn lại — Facebook, Maps, hotline đã công bố, thực
 * đơn đã công bố, form hỏi bàn đang mở, database báo lỗi, mạng đứt giữa chừng — chỉ
 * dựng được với một database. Server này đóng vai PostgREST của Supabase, trả lời
 * ĐÚNG những hàm trang công khai gọi, với đúng hình dạng database thật trả về:
 *
 *   noi_dung_cong_khai(p_ngon_ngu)         → jsonb: ĐỦ mọi khóa của sổ đăng ký (0010),
 *                                            khóa chưa công bố là null
 *   thuc_don_cong_khai(p_ngon_ngu)         → bảng 15 cột (0036)
 *   lich_trong_theo_ma(p_chi_nhanh_ma, p_ngay) → [{ gio 'HH:MM:SS', buoi, con_cho, da_qua }] (0013)
 *   tao_dat_ban(14 tham số, 0013)          → [{ dat_ban_id, ma_dat_ban, con_trong }]
 *   tin_tuyen_dung_cong_khai(p_ngon_ngu)   → [] (trang dùng danh sách dự phòng); kịch bản
 *                                            tuyen-dung-* trả hai tin mẫu, đủ cột của 0026 / 0043
 *   nop_ho_so_ung_tuyen(16 tham số, 0026)  → chuỗi mã hồ sơ 'BT-UV-YYMM-XXXXX'
 *
 * supabase-js gọi POST {URL}/rest/v1/rpc/<tên hàm> với thân JSON. PostgREST chọn hàm
 * theo TÊN tham số: gửi một tham số lạ (đổi tên p_ho_ten ở web mà quên database) là
 * 404 PGRST202 — server này làm y hệt, nên đổi tên tham số ở web là kiểm thử đỏ.
 * Lỗi trả dạng PostgREST: HTTP 4xx/5xx, thân { code, message, details, hint }.
 *
 * KỊCH BẢN (đổi lúc đang chạy: POST /__kich-ban {"ten": "…", "cham": ms} — đồng thời xóa bộ đếm;
 * "cham": tao_dat_ban và nop_ho_so_ung_tuyen chờ chừng ấy mili giây rồi mới trả lời, như database
 * ở xa / mạng 4G chậm — để kịp bấm lần hai trong lúc lần một còn đang chạy):
 *   rong          database nối rồi nhưng CHƯA công bố gì: mọi khóa null, thực đơn rỗng
 *   day-du        Facebook, Maps, hotline, email đã công bố; form hỏi bàn mở; thực đơn
 *                 và đồ uống có cồn bật; thực đơn = danh mục cuốn menu bản sáng (MON_MAU: 22 món
 *                 ăn, ba ly signature; không món nào có giá)
 *   khong-con-tat như day-du nhưng công tắc hien_do_uong_co_con TẮT: thuc_don_cong_khai() không trả
 *                 ba ly signature (như hàm thật), trang không nhắc đồ uống có cồn ở đâu
 *   thuc-don-thu-suc  như day-du, thêm MON_THU_SUC: một món Bò tại quầy (B01 — nhóm thịt bò có món,
 *                 không in giá), nhóm mã lạ chưa có câu, món không ảnh, tên và mô tả rất dài, hai nhóm
 *                 đồ uống dạng danh sách — thẻ món phải chịu được
 *   dat-ban-dong  như day-du nhưng form hỏi bàn đang tắt
 *   dat-ban-loi   như day-du; tao_dat_ban trả 400 "Khung giờ … ngày … đã hết bàn"
 *   dat-ban-500   như day-du; tao_dat_ban trả 500
 *   dat-ban-dut   như day-du; tao_dat_ban cắt kết nối không trả lời (mất mạng giữa chừng)
 *   dat-ban-sap   database sập giữa lượt gửi: tao_dat_ban cắt kết nối như dat-ban-dut, và
 *                 lich_trong_theo_ma trả 500 — trang sau khi gửi không dựng được form (thẻ "chưa mở")
 *   dia-chi-cong-bo  như day-du, thêm khóa dia_chi_hien_thi đã công bố (DIA_CHI_CONG_BO_THU): bản
 *                 công bố phải thay địa chỉ cố định trong mã ở mọi chỗ in địa chỉ
 *   tuyen-dung-mo như day-du, thêm hai tin tuyển dụng đã công bố (TIN_TUYEN_DUNG_THU): trang Tuyển
 *                 dụng hiện thẻ vị trí thật và form nộp hồ sơ — để đo ô nhập, ô chọn, nút chọn file;
 *                 nop_ho_so_ung_tuyen trả mã hồ sơ
 *   tuyen-dung-dut   như tuyen-dung-mo; nop_ho_so_ung_tuyen cắt kết nối không trả lời (KHÔNG CHẮC)
 *   tuyen-dung-loi   như tuyen-dung-mo; nop_ho_so_ung_tuyen trả 400 P0001 "Vị trí này đã hết hạn
 *                 nhận hồ sơ" (database từ chối — CHƯA ghi)
 *   sap-mo        như day-du, thêm ngay_khai_truong là một ngày CHƯA tới (ngaySapMoThu(): ngày 13/11
 *                 kế tiếp) và dong_trang_thai dài hai câu: màn đầu trang chủ hiện dòng "Đón bạn từ …"
 *   da-mo         như day-du, thêm ngay_khai_truong là một ngày ĐÃ qua (NGAY_DA_MO_THU) và
 *                 dong_trang_thai dài hai câu: màn đầu trang chủ hiện dòng "Mở cửa từ …"
 *
 * GET /__dem → { tên hàm: số lần gọi } — để kiểm "bấm đúp → tao_dat_ban đúng một lần".
 * GET /__nhat-ky → 200 lần gọi gần nhất { ham, thamSo }.
 *
 * Dùng như module: import { batMayGia } from './gia-supabase.mjs' (thu-day-du.mjs).
 * Không thư viện ngoài — chỉ node:http.
 */

import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
// Giờ Việt Nam lấy từ chính thư viện của trang (Node ≥ 22.18 đọc thẳng file .ts) — không tự cộng 7 tiếng.
import { homNayVn } from '../src/lib/gio-vn.ts';

export const CONG_MAC_DINH = 54331;
export const KICH_BAN = ['rong', 'day-du', 'dat-ban-dong', 'dat-ban-loi', 'dat-ban-500', 'dat-ban-dut', 'dat-ban-sap', 'dia-chi-cong-bo',
  'tuyen-dung-mo', 'tuyen-dung-dut', 'tuyen-dung-loi', 'sap-mo', 'da-mo', 'khong-con-tat', 'thuc-don-thu-suc'];

// Liên hệ "đã công bố" của kịch bản day-du. Đường dẫn thử, không phải trang thật của nhà hàng.
export const LIEN_HE_THU = {
  facebook_url: 'https://www.facebook.com/beeftown.thu',
  google_maps_url: 'https://maps.google.com/?q=63+H%E1%BB%93+T%C3%B9ng+M%E1%BA%ADu',
  hotline: '028 3822 1234',
  email_lien_he: 'thu@beeftown.example',
};

// Địa chỉ "đã công bố" của kịch bản dia-chi-cong-bo. Cố ý KHÁC địa chỉ cố định trong mã (viết đủ tên
// thành phố, thêm một vế phường — "phường Thử" là tên giả, chỉ để thử) để nhìn chữ là biết trang đang in
// bản công bố hay bản trong mã, và để thấy màn đầu trang chủ bỏ vế phường.
export const DIA_CHI_CONG_BO_THU = 'Tầng 3, 63 Hồ Tùng Mậu, phường Thử, TP. Hồ Chí Minh';

// Ngày khai trương của hai kịch bản sap-mo / da-mo. Trang chủ so ngay_khai_truong với hôm nay (giờ Việt
// Nam) để chọn chữ "Đón bạn từ" hay "Mở cửa từ", nên ngày "sắp mở" không được là một ngày cố định (tới
// ngày đó kiểm thử tự đổi kết quả): lấy ngày 13/11 KẾ TIẾP tính từ hôm nay — trước 13/11/2026 thì đúng
// là ngày mở dự kiến của quán, và chữ ngày luôn dài như nhau ("ngày 13 tháng 11, 2026").
export function ngaySapMoThu(homNay = homNayVn()) {
  const nam = Number(homNay.slice(0, 4));
  return `${nam}-11-13` > homNay ? `${nam}-11-13` : `${nam + 1}-11-13`;
}
export const NGAY_DA_MO_THU = '2026-10-01';
// Dòng trạng thái dài HAI câu — dài hơn hẳn câu dự phòng trong mã, để thấy hàng thông tin ở màn đầu
// còn thẳng hàng khi cột trạng thái cao hơn cột địa chỉ. Câu thử, không phải lời của nhà hàng.
export const TRANG_THAI_THU = {
  'sap-mo': 'Beeftown đang hoàn thiện những phần cuối trước ngày đón khách. Theo dõi trang Facebook của quán để xem hình ảnh mới của tầng 3.',
  'da-mo': 'Beeftown đã mở cửa đón khách ở tầng 3. Bạn hỏi bàn trước để quán giữ chỗ cho cả nhóm nhé.',
};

// Mọi khóa của sổ đăng ký khoa_cong_bo — database luôn trả ĐỦ, khóa chưa công bố là null
// (web/src/lib/noi-dung.ts, mục "BA ĐIỀU QUAN TRỌNG").
const KHOA_NOI_DUNG = [
  'ngay_khai_truong', 'ngay_treo_bang_ron', 'dong_trang_thai', 'form_dat_ban_dang_mo',
  'gio_phuc_vu_da_chot', 'hien_thuc_don', 'hien_do_uong_co_con', 'hien_tuyen_dung',
  'hien_ba_buoc', 'hien_quay_thit', 'hien_tiec_nhom', 'hien_danh_gia',
  'dia_chi_hien_thi', 'hotline', 'facebook_url', 'instagram_url', 'tiktok_url', 'zalo_oa_url',
  'google_maps_url', 'email_lien_he', 'tieu_de_og', 'mo_ta_og', 'anh_chia_se',
];

function noiDung(kichBan) {
  const nd = Object.fromEntries(KHOA_NOI_DUNG.map(k => [k, null]));
  if (kichBan === 'rong') return nd;
  return {
    ...nd,
    ...LIEN_HE_THU,
    form_dat_ban_dang_mo: kichBan !== 'dat-ban-dong',
    hien_thuc_don: true,
    hien_do_uong_co_con: kichBan !== 'khong-con-tat',
    ...(kichBan === 'dia-chi-cong-bo' ? { dia_chi_hien_thi: DIA_CHI_CONG_BO_THU } : {}),
    ...(kichBan === 'sap-mo' ? { ngay_khai_truong: ngaySapMoThu(), dong_trang_thai: TRANG_THAI_THU['sap-mo'] } : {}),
    ...(kichBan === 'da-mo' ? { ngay_khai_truong: NGAY_DA_MO_THU, dong_trang_thai: TRANG_THAI_THU['da-mo'] } : {}),
  };
}

// ---------------------------------------------------------------------------
// Thực đơn mẫu — ĐÚNG danh mục của cuốn menu bản sáng Khánh chốt 11/10/2026 (bảng danh mục 11/10,
// migration 0091) ở trạng thái "đã công bố hết những món công bố được": 22 món ăn (kể cả Set 4 sốt S01)
// và ba ly signature. Tên, mô tả ba thứ tiếng chép NGUYÊN VĂN bảng danh mục. 17 đồ uống dạng danh sách
// (highball, bia, soju, makgeolli, nước ép & ade, nước ngọt, nước suối) KHÔNG trả về: cuốn không có mô tả
// cho chúng, database đòi mô tả mới cho công bố. KHÔNG món nào có giá (gia null) — đúng như database:
// 69.000đ của Set 4 sốt và ba ly signature chỉ là giá đề xuất chờ duyệt, không bao giờ tới trang.
// Thứ tự: nhom_mon.thu_tu rồi mon_an.thu_tu, như thuc_don_cong_khai() trả.
// ---------------------------------------------------------------------------
const NN = ['vi', 'en', 'ko'];
const ba = (vi, en, ko) => ({ vi, en, ko });

// Nhóm theo thu_tu của bảng nhóm (0091). bo-tai-quay không có món nào trong danh mục.
const NHOM = {
  'goi-them':          { loai: 'goi_them', xemTaiQuay: false, ten: ba('Gọi thêm tùy chọn', 'Add-ons', '추가 메뉴') },
  'bo-tai-quay':       { loai: 'thit_bo', xemTaiQuay: true, ten: ba('Bò tại quầy', 'Beef at the Counter', '정육 코너') },
  'dac-trung':         { loai: 'khai_vi', xemTaiQuay: false, ten: ba('Món đặc trưng', 'Signature', '시그니처 메뉴') },
  'lau':               { loai: 'mon_chinh', xemTaiQuay: false, ten: ba('Lẩu', 'Hot pot', '전골') },
  'salad':             { loai: 'khai_vi', xemTaiQuay: false, ten: ba('Salad', 'Salads', '샐러드') },
  'mon-them':          { loai: 'khai_vi', xemTaiQuay: false, ten: ba('Món thêm', 'Sides', '사이드 메뉴') },
  'canh':              { loai: 'mon_chinh', xemTaiQuay: false, ten: ba('Canh', 'Stews', '찌개') },
  'com':               { loai: 'mon_chinh', xemTaiQuay: false, ten: ba('Cơm', 'Rice', '밥') },
  'mi-y':              { loai: 'mon_chinh', xemTaiQuay: false, ten: ba('Mì', 'Noodles & pasta', '면·파스타') },
  'do-uong-signature': { loai: 'do_uong', xemTaiQuay: false, ten: ba('Signature', 'Signature drinks', '시그니처 드링크') },
  'highball':          { loai: 'do_uong', xemTaiQuay: false, ten: ba('Highball', 'Highball', '하이볼') },
  'khong-con':         { loai: 'do_uong', xemTaiQuay: false, ten: ba('Nước ép & ade', 'Juice & ade', '주스·에이드') },
  // Chỉ kịch bản thuc-don-thu-suc: một nhóm mã lạ, chưa có câu dưới tên nhóm, chưa có ảnh.
  'nhom-thu':          { loai: 'khai_vi', xemTaiQuay: false, ten: ba('Nhóm thử chưa có câu', 'Test group without a line', '문구 없는 테스트 그룹') },
};

// Câu cảnh báo chung của hai món sống (nguyên văn tờ kẹp của cuốn).
const CANH_BAO_SONG = ba(
  'Món có bò sống và lòng đỏ trứng sống. Người đang mang thai, trẻ nhỏ, người lớn tuổi nên hỏi nhân viên trước khi gọi.',
  'Contains raw beef and raw egg yolk. If you are pregnant, or ordering for a child or an older guest, please ask our staff first.',
  '생소고기와 날계란 노른자가 들어간 메뉴예요. 임산부, 어린이, 어르신은 주문 전에 직원에게 문의해 주세요.',
);

/** Món mẫu, theo thứ tự database trả (nhom_mon.thu_tu, mon_an.thu_tu). */
export const MON_MAU = [
  { nhom: 'goi-them', ma: 'S01', ten: ba('Set 4 sốt', 'Signature set', '시그니처 소스 4종 세트'),
    moTa: ba('4 sốt hâm nóng ngay trên vỉ: phô mai, tare, ssamjang, sốt cay Tứ Xuyên. Kèm kimchi nhà làm và rau cuốn. Thêm 1 lần.',
             'Four sauces, served warm on the grill: cheese, tare, ssamjang and Sichuan chili. With house kimchi and wrap greens. One refill.',
             '치즈, 타레, 쌈장, 쓰촨식 매운 소스 네 가지를 그릴 위에서 따뜻하게 데워 드려요. 직접 담근 김치와 쌈 채소가 함께 나오고, 한 번 리필해 드려요.') },
  { nhom: 'dac-trung', ma: 'F03', ten: ba('Tartare bò hoa tuyết', 'Snow flower flank tartare', '눈꽃치즈 소고기 타르타르'),
    moTa: ba('Nạm có thớ rõ, vị bò đậm, dai vừa. Thịt tươi xếp như cánh hoa, phủ phô mai Grana Padano hoặc Parmigiano bào mịn như tuyết. Trộn lòng đỏ trứng với gia vị Hàn mặn ngọt. Vị mặn của phô mai, độ béo của lòng đỏ làm tròn vị bò.',
             'Flank, for its clear grain and deep beef flavour, arranged like petals under grated Grana Padano or Parmigiano. Mix in the yolk and our sweet-savoury Korean seasoning.',
             '결이 선명하고 풍미가 진한 플랭크 부위를 꽃잎처럼 담고, 그라나 파다노 또는 파르미지아노 치즈를 눈처럼 갈아 올렸어요. 노른자와 달콤짭짤한 한국식 양념을 넣어 비벼 드세요.'),
    laMonSong: true, canhBao: CANH_BAO_SONG },
  { nhom: 'dac-trung', ma: 'F19', ten: ba('Cơm trộn tartare bò cay', 'Spicy flank tartare rice bowl', '매콤 육회비빔밥'),
    moTa: ba('Nạm, phần cắt có ít trên mỗi con bò, cùng rau củ giòn theo mùa và sốt cay riêng của Beeftown. Trộn đều bò, sốt và cơm: một bát bibimbap tươi, cay dịu, làm vị bò rõ hơn.',
             'Flank, a cut each animal yields little of, with crisp seasonal vegetables and our own spicy sauce. Mix it through the rice, a fresh take on bibimbap.',
             '소 한 마리에서 조금밖에 나오지 않는 플랭크 부위에 아삭한 제철 채소와 Beeftown만의 매콤한 소스를 곁들였어요. 밥과 함께 고루 비벼 드세요.'),
    laMonSong: true, canhBao: CANH_BAO_SONG },
  { nhom: 'lau', ma: 'F15', ten: ba('Lẩu kim chi', 'Kimchi hot pot', '김치전골'),
    moTa: ba('Nấu từ kimchi nhà làm, với thịt heo, đậu hũ và nấm. Nước dùng chua, cay.',
             'Made with our house kimchi, pork, tofu and mushrooms. Sour, spicy broth.',
             '직접 담근 김치에 돼지고기, 두부, 버섯을 넣어 끓였어요. 새콤하고 매콤한 국물이에요.') },
  { nhom: 'lau', ma: 'F16', ten: ba('Lẩu bò bulgogi', 'Bulgogi hot pot', '불고기전골'),
    moTa: ba('Bò thái mỏng ướp bulgogi, miến, nấm. Nước dùng ngọt thanh.',
             'Thin-sliced bulgogi beef in a light, sweet broth.',
             '얇게 썬 불고기와 당면, 버섯을 넣었어요. 국물이 달큰하고 깔끔해요.') },
  { nhom: 'lau', ma: 'F20', ten: ba('Lẩu nấm', 'Mushroom hot pot', '버섯전골'),
    moTa: ba('Nhiều loại nấm tươi, đậu hũ, cải thảo. Nước dùng thanh.',
             'Assorted fresh mushrooms in a light broth.',
             '여러 가지 생버섯과 두부, 배추를 넣었어요. 국물이 맑고 담백해요.') },
  { nhom: 'salad', ma: 'F21', ten: ba('Salad nấm', 'Grilled mushroom salad', '구운 버섯 샐러드'),
    moTa: ba('Nấm nướng trên rau xanh, sốt mè. Ăn xen với bò cho đỡ ngán.',
             'Grilled mushrooms on fresh greens with sesame dressing.',
             '신선한 채소 위에 구운 버섯을 올리고 참깨 드레싱을 곁들였어요.') },
  { nhom: 'salad', ma: 'F01', ten: ba('Caesar salad', 'Caesar salad', '시저 샐러드'),
    moTa: ba('Xà lách romaine, bánh mì nướng giòn, phô mai bào, sốt Caesar.',
             'Romaine, croutons, shaved parmesan and Caesar dressing.',
             '로메인, 크루통, 파르메산 치즈에 시저 드레싱을 곁들였어요.') },
  { nhom: 'salad', ma: 'F10', ten: ba('Miến trộn Hàn', 'Hot plate japchae', '철판 잡채'),
    moTa: ba('Miến xào với bò và rau củ, dọn trên chảo gang nóng.',
             'Glass noodles stir-fried with beef and vegetables, on a sizzling plate.',
             '소고기와 채소를 넣고 볶은 당면을 뜨거운 철판에 담아 드려요.') },
  { nhom: 'mon-them', ma: 'F22', ten: ba('Trứng hấp núi lửa', 'Bomb egg soufflé', '폭탄 계란찜'),
    moTa: ba('Trứng hấp trong thố đá, phồng cao, mềm và nóng.',
             'Fluffy steamed egg, served hot in a stone pot.',
             '뚝배기에 봉긋하게 부풀려 낸, 부드럽고 뜨거운 계란찜이에요.') },
  { nhom: 'mon-them', ma: 'F23', ten: ba('Khoai tây chiên sốt bò', 'Beef chili fries', '비프 칠리 프라이'),
    moTa: ba('Khoai tây chiên giòn, phủ sốt bò bằm và sốt phô mai.',
             'Crispy fries topped with minced beef sauce and cheese sauce.',
             '바삭한 감자튀김에 다진 소고기 소스와 치즈 소스를 올렸어요.') },
  { nhom: 'mon-them', ma: 'F18', ten: ba('Bánh gạo chiên phô mai', 'Fried injeolmi rice cake', '치즈 인절미 튀김'),
    moTa: ba('Vỏ giòn, nhân phô mai kéo sợi, rắc bột đậu nành rang.',
             'Crispy outside, stretchy cheese inside, dusted with roasted soybean powder.',
             '겉은 바삭하고 속에는 치즈가 쭉 늘어나요. 볶은 콩가루를 뿌렸어요.') },
  { nhom: 'canh', ma: 'F12', ten: ba('Canh kim chi', 'Kimchi jjigae', '김치찌개'),
    moTa: ba('Nấu từ kimchi nhà làm, thịt heo, đậu hũ. Chua, cay.',
             'House kimchi, pork and tofu. Sour and spicy.',
             '직접 담근 김치에 돼지고기와 두부를 넣어 끓였어요. 새콤하고 매콤해요.') },
  { nhom: 'canh', ma: 'F14', ten: ba('Đậu phụ hầm', 'Sundubu jjigae', '순두부찌개'),
    moTa: ba('Đậu hũ non mềm trong nước dùng cay, nóng.',
             'Silky soft tofu in a hot, spicy broth.',
             '부드러운 순두부를 뜨겁고 매콤한 국물에 끓였어요.') },
  { nhom: 'canh', ma: 'F13', ten: ba('Canh tương đậu', 'Doenjang jjigae', '된장찌개'),
    moTa: ba('Tương đậu nành, đậu hũ và rau củ. Vị đậm.',
             'Soybean paste with tofu and vegetables. Rich and savoury.',
             '된장에 두부와 채소를 넣어 끓였어요. 맛이 깊고 구수해요.') },
  { nhom: 'com', ma: 'F06', ten: ba('Cơm kim chi bò', 'Beef kimchi fried rice', '소고기 김치볶음밥'),
    moTa: ba('Cơm rang kimchi nhà làm với bò, trứng ốp la.',
             'Fried rice with house kimchi and beef, topped with a fried egg.',
             '직접 담근 김치와 소고기를 넣어 볶고, 계란 프라이를 올렸어요.') },
  { nhom: 'com', ma: 'F05', ten: ba('Cơm trộn Hàn', 'Bibimbap', '비빔밥'),
    moTa: ba('Cơm, rau trộn, bò, trứng. Trộn cùng tương ớt.',
             'Rice with vegetables, beef and egg. Mix in the chili paste.',
             '밥에 나물, 소고기, 계란을 올렸어요. 고추장과 함께 비벼 드세요.') },
  { nhom: 'com', ma: 'F04', ten: ba('Cơm trộn trứng cá', 'Cheese al-bap', '치즈 알밥'),
    moTa: ba('Cơm bát đá nóng, phô mai, trứng cá, rau củ giòn.',
             'Hot stone-bowl rice with cheese, fish roe and crunchy vegetables.',
             '뜨거운 돌솥밥에 치즈, 날치알, 아삭한 채소를 올렸어요.') },
  { nhom: 'mi-y', ma: 'F11', ten: ba('Mì lạnh cay', 'Signature spicy cold noodles', '시그니처 매운 냉면'),
    moTa: ba('Mì lạnh sốt cay, nước dùng đá. Kèm cơm, khoảng 70% chén thường.',
             'Spicy cold noodles with icy broth. With rice, about 70% of a regular bowl.',
             '매콤한 양념의 냉면에 살얼음 육수를 곁들였어요. 밥은 보통 공기의 70% 정도로 함께 나와요.') },
  { nhom: 'mi-y', ma: 'F08', ten: ba('Mì Toowoomba', 'Toowoomba pasta', '투움바 파스타'),
    moTa: ba('Tôm và nấm trong sốt kem, cay nhẹ ở hậu vị.',
             'Shrimp and mushrooms in a creamy sauce with a gentle heat.',
             '새우와 버섯을 넣은 크림소스 파스타예요. 끝맛이 살짝 매콤해요.') },
  { nhom: 'mi-y', ma: 'F07', ten: ba('Mì carbonara', 'Carbonara pasta', '카르보나라 파스타'),
    moTa: ba('Sốt trứng và phô mai, thêm lòng đỏ tươi.',
             'Egg and cheese sauce, finished with a fresh yolk.',
             '계란과 치즈로 만든 소스에 신선한 노른자를 올렸어요.') },
  { nhom: 'mi-y', ma: 'F09', ten: ba('Mì bò sốt cà', 'Beef tomato pasta', '비프 토마토 파스타'),
    moTa: ba('Sốt cà chua nấu với bò bằm.',
             'Minced beef simmered in a rich tomato sauce.',
             '다진 소고기를 넣고 진하게 끓인 토마토소스 파스타예요.') },
  { nhom: 'do-uong-signature', ma: 'D13', ten: ba('Milky Cloud Makgeolli', 'Milky Cloud Makgeolli', '밀키 클라우드 막걸리'),
    moTa: ba('Makgeolli sữa. Makgeolli, sữa, kẹo cứng nghiền.',
             'Makgeolli, milk, crushed hard candy.',
             '막걸리에 우유와 잘게 부순 사탕을 더했어요.'),
    coCon: true },
  { nhom: 'do-uong-signature', ma: 'D01', ten: ba('Strawberry Crush', 'Strawberry Crush', '스트로베리 크러시'),
    moTa: ba('Highball dâu. Siro dâu, soda, whisky, dâu sấy.',
             'Strawberry syrup, soda, whisky, dried strawberry.',
             '딸기 시럽, 탄산수, 위스키에 말린 딸기를 올렸어요.'),
    coCon: true },
  { nhom: 'do-uong-signature', ma: 'D14', ten: ba('Berry Rouge Highball', 'Berry Rouge Highball', '베리 루즈 하이볼'),
    moTa: ba('Highball quả mọng. Hương quả mọng, chua nhẹ, ngọt dịu.',
             'Deep berry, bright acidity, soft sweetness.',
             '베리 향에 가벼운 산미와 은은한 단맛이 어우러져요.'),
    coCon: true },
];

/**
 * Kịch bản thuc-don-thu-suc: dữ liệu mà database có thể trả SAU NÀY, để thử thẻ món chịu được — thêm vào
 * MON_MAU: một món của nhóm Bò tại quầy (thit_bo — trang vẽ nhóm này với khongGia: không bao giờ in giá);
 * một nhóm mã lạ (chưa có câu dưới tên nhóm) với một món không có ảnh, tên rất dài và mô tả dài;
 * hai nhóm đồ uống dạng danh sách (tên theo danh mục; mô tả là câu của seed 0011 — bản cuốn chưa có mô tả).
 */
export const MON_THU_SUC = [
  { nhom: 'bo-tai-quay', ma: 'B01', ten: ba('Thăn lưng bò', 'Striploin', '채끝') },
  { nhom: 'nhom-thu', ma: 'X01',
    ten: ba('Cơm trộn tartare bò cay kèm rau củ giòn theo mùa và sốt cay riêng', 'Spicy flank tartare rice bowl with crisp seasonal vegetables and our own spicy sauce',
            '아삭한 제철 채소와 Beeftown만의 매콤한 소스를 곁들인 매콤 소고기 타르타르 비빔밥'),
    moTa: ba('Nạm, phần cắt có ít trên mỗi con bò, cùng rau củ giòn theo mùa và sốt cay riêng của Beeftown. Trộn đều bò, sốt và cơm: một bát bibimbap tươi, cay dịu, làm vị bò rõ hơn. Nạm có thớ rõ, vị bò đậm, dai vừa. Trộn lòng đỏ trứng với gia vị Hàn mặn ngọt.',
             'Flank, a cut each animal yields little of, with crisp seasonal vegetables and our own spicy sauce. Mix it through the rice, a fresh take on bibimbap. Flank, for its clear grain and deep beef flavour.',
             '소 한 마리에서 조금밖에 나오지 않는 플랭크 부위에 아삭한 제철 채소와 Beeftown만의 매콤한 소스를 곁들였어요. 밥과 함께 고루 비벼 드세요. 결이 선명하고 풍미가 진한 플랭크 부위예요.') },
  { nhom: 'highball', ma: 'D02', ten: ba('Highball cổ điển', 'Classic highball', '클래식 하이볼'),
    moTa: ba('Whisky, soda và chanh.', 'Whisky, soda and lemon.', '위스키, 탄산수, 레몬.'), coCon: true },
  { nhom: 'khong-con', ma: 'D09', ten: ba('Nước cam', 'Orange juice', '오렌지 주스'),
    moTa: ba('Nước cam dùng lạnh.', 'Orange juice, served cold.', '차갑게 드리는 오렌지 주스.') },
];

const THU_TU_NHOM = Object.keys(NHOM);
/**
 * Đúng các dòng thuc_don_cong_khai(p_ngon_ngu) trả trong một kịch bản — 15 cột, thứ tự như database.
 * crm/test/test-cong-khai-thuc-don.mjs so từng dòng, từng chữ, với database thật sau khi chạy hết các
 * khối của web/THUC-DON.md: dữ liệu giả và hướng dẫn công bố không lệch nhau được.
 */
export function thucDon(kichBan, nn) {
  if (kichBan === 'rong') return [];
  const n = NN.includes(nn) ? nn : 'vi';
  // Như thuc_don_cong_khai() (0036): công tắc hien_do_uong_co_con tắt thì món có cồn không ra khỏi database.
  const coCon = noiDung(kichBan).hien_do_uong_co_con === true;
  const mon = kichBan === 'thuc-don-thu-suc'
    ? [...MON_MAU, ...MON_THU_SUC].sort((a, b) => THU_TU_NHOM.indexOf(a.nhom) - THU_TU_NHOM.indexOf(b.nhom))
    : MON_MAU;
  return mon.filter(m => coCon || m.coCon !== true).map(m => ({
    nhom_ma: m.nhom,
    nhom_ten: NHOM[m.nhom].ten[n],
    nhom_loai: NHOM[m.nhom].loai,
    xem_gia_tai_quay: NHOM[m.nhom].xemTaiQuay,
    mon_ma: m.ma,
    ten: m.ten[n],
    mo_ta: m.moTa?.[n] ?? null,
    gia: null,
    muc_cay: null,
    co_con: m.coCon === true,
    la_mon_song: m.laMonSong === true,
    canh_bao: m.canhBao?.[n] ?? null,
    khau_phan: null,
    // Đúng khối phien-ban của web/THUC-DON.md (v2.0, ngày Khánh chốt cuốn).
    phien_ban: 'v2.0',
    cap_nhat_ngay: '2026-10-11',
  }));
}

// Khung giờ của một ngày: trưa và tối, bước 30 phút. Một khung hết chỗ để form có cả
// hai trạng thái. Không bao giờ có số bàn — lich_trong_theo_ma() chỉ trả có / không.
const GIO_TRUA = ['11:00:00', '11:30:00', '12:00:00', '12:30:00', '13:00:00'];
const GIO_TOI = ['17:30:00', '18:00:00', '18:30:00', '19:00:00', '19:30:00', '20:00:00'];
function lichTrong(kichBan) {
  if (kichBan === 'rong') return [];
  return [
    ...GIO_TRUA.map(gio => ({ gio, buoi: 'trua', con_cho: true, da_qua: false })),
    ...GIO_TOI.map(gio => ({ gio, buoi: 'toi', con_cho: gio !== '20:00:00', da_qua: false })),
  ];
}

// Hai tin tuyển dụng "đã công bố" của kịch bản tuyen-dung-mo — hình dạng của tin_tuyen_dung_cong_khai()
// (interface ViTri trong components/TrangTuyenDung.astro): tên vị trí theo danh sách dự phòng của trang,
// không mức lương, không hạn nộp (chưa con số nào được duyệt). Tin đầu hỏi đủ mọi trường tùy chọn của
// form (0026) để phép đo thấy hết các loại ô; tin sau tắt bớt.
const TIN_TUYEN_DUNG_THU = [
  { ma: 'SANH-THU', ten: ba('Nhân viên sảnh', 'Hall Crew', '홀 직원'), bo_phan: 'sanh', loai_hop_dong: 'ban_thoi_gian',
    mo_ta: ba('Đón khách, hướng dẫn chọn bò tại quầy và phục vụ tại bàn.',
              'Welcome guests, guide them at the beef counter and serve at the table.',
              '손님을 맞이하고 정육 코너 안내와 테이블 서비스를 맡아요.'),
    hoi: true },
  { ma: 'BEP-THU', ten: ba('Nhân viên bếp có kinh nghiệm', 'Experienced Kitchen Crew', '경력 주방 직원'), bo_phan: 'bep', loai_hop_dong: null,
    mo_ta: null, hoi: false },
];
function tinTuyenDung(kichBan, nn) {
  if (!kichBan.startsWith('tuyen-dung-')) return [];
  const n = NN.includes(nn) ? nn : 'vi';
  return TIN_TUYEN_DUNG_THU.map(t => ({
    ma: t.ma, ten: t.ten[n], bo_phan: t.bo_phan, cap_bac: null, loai_hop_dong: t.loai_hop_dong, so_luong: null,
    mo_ta: t.mo_ta?.[n] ?? null, yeu_cau: null, quyen_loi: null, ca_lam: null,
    luong_tu: null, luong_den: null, luong_don_vi: null, han_nop: null,
    hoi_email: t.hoi, hoi_nam_sinh: t.hoi, hoi_ca_lam: t.hoi, hoi_gioi_thieu: t.hoi, hoi_kinh_nghiem: t.hoi, hoi_cv: t.hoi,
  }));
}

// ---------------------------------------------------------------------------
// Hàm và tham số — đúng chữ ký trong migration. batBuoc = tham số không có default.
// ---------------------------------------------------------------------------
const THAM_SO_DAT_BAN = [
  'p_chi_nhanh_ma', 'p_sdt', 'p_ho_ten', 'p_ngay', 'p_gio', 'p_so_khach', 'p_dip', 'p_ghi_chu',
  'p_dong_y', 'p_utm_source', 'p_utm_medium', 'p_utm_campaign', 'p_trang_gioi_thieu', 'p_ip',
];
const THAM_SO_NOP_HO_SO = [
  'p_vi_tri_ma', 'p_ho_ten', 'p_sdt', 'p_email', 'p_nam_sinh', 'p_gioi_thieu', 'p_kinh_nghiem', 'p_ca_lam_duoc',
  'p_ma_tai_len', 'p_ten_tep', 'p_dong_y', 'p_bay', 'p_giay_tren_form', 'p_utm_source', 'p_utm_campaign', 'p_ip',
];
const HAM = {
  noi_dung_cong_khai: { thamSo: ['p_ngon_ngu'], batBuoc: [] },
  thuc_don_cong_khai: { thamSo: ['p_ngon_ngu'], batBuoc: [] },
  tin_tuyen_dung_cong_khai: { thamSo: ['p_ngon_ngu'], batBuoc: [] },
  lich_trong_theo_ma: { thamSo: ['p_chi_nhanh_ma', 'p_ngay'], batBuoc: ['p_chi_nhanh_ma', 'p_ngay'] },
  tao_dat_ban: { thamSo: THAM_SO_DAT_BAN, batBuoc: THAM_SO_DAT_BAN.slice(0, 6) },
  nop_ho_so_ung_tuyen: { thamSo: THAM_SO_NOP_HO_SO, batBuoc: THAM_SO_NOP_HO_SO.slice(0, 3) },
};

const loiPostgrest = (code, message, details = null, hint = null) => ({ code, message, details, hint });

/** Mã đặt bàn: 6 ký tự từ cùng bảng chữ của sinh_ma_dat_ban() (0013). */
const BANG_MA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function maDatBan(n) {
  let x = (n * 2654435761) % 887503681;   // 31^6 mã khác nhau; n nhỏ nên không trùng
  let s = '';
  for (let i = 0; i < 6; i++, x = Math.floor(x / 31)) s += BANG_MA[x % 31];
  return s;
}

/**
 * Bật server giả. Trả về { goc, cong, datKichBan(ten), kichBan(), dem(), nhatKy(), dong() }.
 * im: true thì không in gì ra màn hình.
 */
export async function batMayGia({ cong = CONG_MAC_DINH, kichBan = 'day-du', im = false } = {}) {
  if (!KICH_BAN.includes(kichBan)) throw new Error(`Kịch bản lạ: ${kichBan} — chọn một trong ${KICH_BAN.join(', ')}`);
  let hienTai = kichBan;
  let cham = 0;
  let dem = {};
  let nhatKy = [];
  let soDatBan = 0;
  let soHoSo = 0;

  const datKichBan = (ten, { cham: ms = 0 } = {}) => {
    if (!KICH_BAN.includes(ten)) throw new Error(`Kịch bản lạ: ${ten}`);
    hienTai = ten; cham = Math.max(0, Number(ms) || 0); dem = {}; nhatKy = [];
  };

  const server = createServer((req, res) => {
    const tra = (status, than, kieu = 'application/json; charset=utf-8') => {
      res.writeHead(status, { 'Content-Type': kieu });
      res.end(typeof than === 'string' ? than : JSON.stringify(than));
    };
    let duLieu = '';
    req.setEncoding('utf8');
    req.on('data', c => { duLieu += c; });
    req.on('end', () => {
      const url = new URL(req.url ?? '/', 'http://gia');

      // --- Điều khiển (chỉ kiểm thử dùng) -----------------------------------
      if (url.pathname === '/__kich-ban') {
        if (req.method === 'POST') {
          try { const { ten, cham: ms } = JSON.parse(duLieu || '{}'); datKichBan(ten, { cham: ms }); }
          catch (e) { return tra(400, { loi: e.message }); }
        }
        return tra(200, { ten: hienTai, cham });
      }
      if (url.pathname === '/__dem') return tra(200, dem);
      if (url.pathname === '/__nhat-ky') return tra(200, nhatKy);

      // --- PostgREST: POST /rest/v1/rpc/<hàm> -------------------------------
      const m = url.pathname.match(/^\/rest\/v1\/rpc\/([a-z0-9_]+)$/);
      if (!m) return tra(404, loiPostgrest('PGRST125', 'Invalid path specified in request URL'));
      const ten = m[1];
      let thamSo = {};
      if (duLieu.trim()) {
        try { thamSo = JSON.parse(duLieu); }
        catch { return tra(400, loiPostgrest('PGRST102', 'Empty or invalid json')); }
      }
      dem[ten] = (dem[ten] ?? 0) + 1;
      nhatKy.push({ ham: ten, thamSo });
      if (nhatKy.length > 200) nhatKy.shift();

      const ham = HAM[ten];
      const khoa = Object.keys(thamSo ?? {}).sort();
      const khongKhop = !ham || khoa.some(k => !ham.thamSo.includes(k)) || ham.batBuoc.some(k => !(k in thamSo));
      if (khongKhop) {
        return tra(404, loiPostgrest('PGRST202',
          `Could not find the function public.${ten}(${khoa.join(', ')}) in the schema cache`,
          `Searched for the function public.${ten} with parameters ${khoa.join(', ') || '(none)'} or with a single unnamed json/jsonb parameter, but no matches were found in the schema cache.`,
          null));
      }

      const nn = typeof thamSo.p_ngon_ngu === 'string' ? thamSo.p_ngon_ngu : 'vi';
      switch (ten) {
        case 'noi_dung_cong_khai': return tra(200, noiDung(hienTai));
        case 'thuc_don_cong_khai': return tra(200, thucDon(hienTai, nn));
        case 'tin_tuyen_dung_cong_khai': return tra(200, tinTuyenDung(hienTai, nn));
        case 'lich_trong_theo_ma':
          if (hienTai === 'dat-ban-sap') return tra(500, loiPostgrest('XX000', 'upstream request timeout'));
          return tra(200, lichTrong(hienTai));
        case 'tao_dat_ban': {
          if (cham > 0) return void setTimeout(() => taoDatBan(thamSo), cham);
          return taoDatBan(thamSo);
        }
        case 'nop_ho_so_ung_tuyen': {
          if (cham > 0) return void setTimeout(() => nopHoSo(), cham);
          return nopHoSo();
        }
      }
      return tra(500, loiPostgrest('XX000', 'unreachable'));

      // Trả lời nop_ho_so_ung_tuyen theo kịch bản: chuỗi mã hồ sơ, như hàm thật (returns text).
      function nopHoSo() {
        if (hienTai === 'tuyen-dung-dut') { req.socket.destroy(); return; }
        if (hienTai === 'tuyen-dung-loi') {
          return tra(400, loiPostgrest('P0001', 'Vị trí này đã hết hạn nhận hồ sơ'));
        }
        if (!hienTai.startsWith('tuyen-dung-')) return tra(400, loiPostgrest('P0001', 'Cổng tuyển dụng đang tạm đóng'));
        soHoSo++;
        // PostgREST trả một chuỗi JSON (có ngoặc kép) — tra() gửi chuỗi trần nguyên văn, nên tự stringify.
        return tra(200, JSON.stringify(`BT-UV-2610-${maDatBan(soHoSo).slice(0, 5)}`));
      }

      // Trả lời tao_dat_ban theo kịch bản. Tách thành hàm để chờ được ("cham").
      function taoDatBan(ts) {
        if (hienTai === 'dat-ban-dut' || hienTai === 'dat-ban-sap') {
          // Mất mạng giữa chừng: không một byte trả lời.
          req.socket.destroy();
          return;
        }
        if (hienTai === 'dat-ban-500') {
          return tra(500, loiPostgrest('XX000', 'upstream request timeout'));
        }
        if (hienTai === 'dat-ban-loi') {
          // Đúng câu của tao_dat_ban(): raise exception 'Khung giờ % ngày % đã hết bàn' (0010), p_gio kiểu time.
          const gio = /^\d{2}:\d{2}$/.test(ts.p_gio) ? `${ts.p_gio}:00` : String(ts.p_gio);
          return tra(400, loiPostgrest('P0001', `Khung giờ ${gio} ngày ${ts.p_ngay} đã hết bàn`));
        }
        if (hienTai === 'rong' || hienTai === 'dat-ban-dong') {
          return tra(400, loiPostgrest('P0001', 'Form đặt bàn đang tạm đóng'));
        }
        soDatBan++;
        return tra(200, [{
          dat_ban_id: `00000000-0000-4000-8000-${String(soDatBan).padStart(12, '0')}`,
          ma_dat_ban: maDatBan(soDatBan),
          con_trong: 7,
        }]);
      }
    });
  });

  await new Promise((xong, hong) => {
    server.once('error', hong);
    server.listen(cong, '127.0.0.1', xong);
  });
  const goc = `http://127.0.0.1:${cong}`;
  if (!im) console.log(`Supabase giả: ${goc} · kịch bản ${hienTai}`);

  return {
    goc,
    cong,
    datKichBan,
    kichBan: () => hienTai,
    dem: () => ({ ...dem }),
    nhatKy: () => [...nhatKy],
    dong: () => new Promise(xong => { server.closeAllConnections?.(); server.close(() => xong()); }),
  };
}

// --- Chạy thẳng: node kiem-tra/gia-supabase.mjs [--cong N] [--kich-ban ten] -----
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const lay = (co, macDinh) => { const i = process.argv.indexOf(co); return i > -1 ? process.argv[i + 1] : macDinh; };
  const may = await batMayGia({ cong: Number(lay('--cong', CONG_MAC_DINH)), kichBan: lay('--kich-ban', 'day-du') });
  console.log(`Kịch bản: ${KICH_BAN.join(' | ')} — đổi bằng: curl -X POST ${may.goc}/__kich-ban -d '{"ten":"rong"}'`);
  console.log(`Bật web: PUBLIC_SUPABASE_URL=${may.goc} PUBLIC_SUPABASE_ANON_KEY=khoa-thu npx astro dev --ignore-lock`);
  for (const tin of ['SIGINT', 'SIGTERM']) process.on(tin, async () => { await may.dong(); process.exit(0); });
}
