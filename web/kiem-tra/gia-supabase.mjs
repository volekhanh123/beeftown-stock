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
 *   mua_thit_ve_cong_khai(p_ngon_ngu, p_chi_nhanh_ma) → bảng 11 cột (0101): mỗi dòng một gói khách chọn được;
 *                                            kịch bản cũ trả [] (kênh chưa mở), mua-thit-* trả MENU_THU
 *   bo_tai_quay_theo_gu(p_ngon_ngu)        → bảng 6 cột (0116): phần thịt của MENU_THU đã gắn gu (GU_THU); chỉ
 *                                            day-du và thuc-don-thu-suc, kịch bản khác trả [] (khối ẩn)
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
 *   da-mo-chua-doi-cau  như day-du, thêm ngay_khai_truong ĐÃ qua nhưng KHÔNG công bố dong_trang_thai: chủ quên đổi câu
 *                 sau ngày khai trương (23/11/2026) — màn đầu hiện "Mở cửa từ …" và KHÔNG còn câu "đang chuẩn bị"
 *
 *   Trang Mua thịt về (0101, đặt thẳng trên website từ 0113). hien_mua_thit_ve dưới đây là giá trị DATABASE TRẢ —
 *   công tắc hiệu lực mà noi_dung_cong_khai() đã tính (bật + có gói trên menu web; từ 0113 không còn đòi link Zalo).
 *   Mọi kịch bản cũ: null, menu []. tao_don_mua_thit (0113) ghi đơn ở mọi kịch bản có menu, trừ hai kịch bản -dat-.
 *   Từ 0125 hàm nhận thêm p_hoa_don (hóa đơn đỏ, không bắt buộc) và ghi nó vào nhật ký như mọi tham số khác; luật của
 *   các ô hóa đơn kiểm ở crm/test/test-mua-thit-hoa-don.mjs (database thật trên PGlite), không ở server giả này.
 *   mua-thit-mo         như day-du (có hotline); hien_mua_thit_ve true, zalo_oa_url = ZALO_OA_THU, giờ giao có chữ
 *                       thử; menu MENU_THU (Ba chỉ bò Mỹ 400 g "Tạm hết ở quầy"); gu thử GU_THU (đợt 3: dòng gu trên thẻ)
 *   mua-thit-giao       như mua-thit-mo, thêm mua_thit_giao_hang (chữ thử, không số tiền), hotline null
 *   mua-thit-het-quay   như mua-thit-mo, mọi gói tam_het
 *   mua-thit-trang      như mua-thit-mo, thêm hien_tro_ly_trang = true (0126 · khung nhắn tin Trang; Edge Function giả
 *                       POST /functions/v1/tro-ly-trang trả TRA_LOI_TRANG_THU)
 *   mua-thit-rong       database tự tính false (bật, 0 gói); menu []
 *   mua-thit-khong-zalo true, zalo_oa_url null; menu MENU_THU — 0113: trang mở và đặt được dù chưa có link Zalo
 *   mua-thit-lech       true, menu [] (gói vừa bị bỏ giữa hai lời gọi song song)
 *   mua-thit-loi        true; mua_thit_ve_cong_khai trả 500
 *   mua-thit-dut        true; mua_thit_ve_cong_khai cắt kết nối (như dat-ban-dut)
 *   mua-thit-treo       true; mua_thit_ve_cong_khai không trả lời trong 10 giây
 *   mua-thit-dat-loi    như mua-thit-mo; tao_don_mua_thit trả 400 P0001 "Giá vừa đổi…" (database từ chối — CHƯA ghi)
 *   mua-thit-dat-dut    như mua-thit-mo; tao_don_mua_thit cắt kết nối không trả lời (KHÔNG CHẮC đã ghi)
 *
 * GET /__dem → { tên hàm: số lần gọi } — để kiểm "bấm đúp → tao_dat_ban đúng một lần". Lượt đọc / ghi bảng đếm theo
 * "<cách> <bảng>" ("GET nhan_su", "PATCH video_dao_tao"); mọi lượt gọi /auth/v1/token (đăng nhập, cả đổi refresh
 * token) đếm dưới tên 'auth:dang_nhap' — lượt đó vào /__nhat-ky chỉ kèm grant_type và email; mọi lượt gọi
 * /auth/v1/user (kiểm phiên) đếm dưới tên 'auth:kiem_phien' — vào /__nhat-ky chỉ kèm token có phải "ban-…" không.
 * GET /__nhat-ky → 200 lần gọi gần nhất { ham, thamSo }.
 *
 * /noi-bo — ĐĂNG NHẬP (thu-day-du.mjs nhóm 14: đăng nhập không thành; nhóm 15: Supabase bận đúng lúc gửi form; nhóm
 * 16: đăng nhập thật). Server này còn đóng vai Supabase Auth và vài bảng, đủ để lib/phien.ts đăng nhập, mở trang nội
 * bộ và đăng xuất như với Supabase thật — trước đây mỗi vòng rà soát nút Quay lại sau khi đăng xuất phải tự dựng một
 * Auth giả ngoài repo:
 *
 *   POST /auth/v1/token?grant_type=password        email + mật khẩu của NHAN_VIEN_THU → phiên mới: access token hạn
 *                                                   một giờ, refresh token dùng một lần; sai → 400 invalid_credentials.
 *                                                   Đăng nhập không thành kiểu khác, mọi kịch bản, email quyết định:
 *                                                   ban@… → 429 over_request_rate_limit (quá hạn mức), dut@… → cắt kết
 *                                                   nối, không một byte (mất mạng giữa chừng)
 *   POST /auth/v1/token?grant_type=refresh_token   đổi refresh token lấy cặp mới. Phiên đã thu hồi → 400
 *                                                   refresh_token_not_found; token đã dùng rồi → 400
 *                                                   refresh_token_already_used và phiên đó bị thu hồi luôn (Supabase bật
 *                                                   xoay refresh token). Trong 10 giây đầu sau lần dùng, dùng lại được trả
 *                                                   đúng cặp mới đã cấp — như khoảng cho dùng lại của bản thật, để hai lượt
 *                                                   mở trang song song cùng làm mới không thành đăng xuất
 *   GET  /auth/v1/user                              người của access token. Hết hạn hay token lạ → 403 bad_jwt; phiên đã
 *                                                   thu hồi → 403 session_not_found (supabase-js đổi thành
 *                                                   AuthSessionMissingError). Mọi kịch bản, token bắt đầu bằng "ban-" →
 *                                                   429 over_request_rate_limit (Supabase bận đúng lúc kiểm phiên: layPhien
 *                                                   trả QUA_TAI)
 *   POST /auth/v1/logout?scope=local|global|others  thu hồi phiên của token gửi lên / mọi phiên của người đó / mọi phiên
 *                                                   trừ phiên này (bỏ trống = global); 204. Token hỏng → như /user
 *
 *   Trả lời mang X-Supabase-Api-Version: 2024-01-01 và thân { code, message } như Supabase Auth trả cho supabase-js
 *   (mã nguồn công khai: internal/api/token.go, user.go, logout.go) — cùng bộ giả định với Auth giả của
 *   crm/test/test-noi-bo-dang-xuat.mjs.
 *
 *   Bảng (PostgREST, GET: lọc eq / neq, chọn cột, sắp xếp; PATCH: chỉ video_dao_tao): nhan_su (NHAN_VIEN_THU — một
 *   quản lý đang làm), chi_nhanh (CHI_NHANH_THU), video_dao_tao (VIDEO_THU), v_viec_dich (rỗng — middleware.ts dịch
 *   bù cho vai biên tập). Hàm kho_dem_viec (số đỏ trên menu kho, lib/kho/trang.ts). Bảng lạ → 404 PGRST205, cột lạ →
 *   400 42703, như PostgREST. Quyền đọc như RLS, rút gọn: chỉ người đăng nhập đọc được bảng (anon → []), chủ và quản
 *   lý sửa được video. Như PostgREST thật, access token của một phiên ĐÃ thu hồi vẫn đọc được bảng tới khi tự hết
 *   hạn: PostgREST chỉ kiểm chữ ký và hạn của JWT, không hỏi Auth (đầu dangXuat, lib/phien.ts).
 *
 *   POST /__thu-hoi → { da_thu_hoi: số phiên }: thu hồi MỌI phiên đang sống — như khi người đó đăng xuất mọi máy từ
 *   một máy khác, hay người quản trị xóa phiên trong Supabase. Website không được báo gì: nó chỉ biết ở lượt mở trang
 *   kế tiếp. GET /__auth → { phien, nhat_ky }: các phiên và 200 lượt gọi Auth gần nhất, mỗi lượt một số thứ tự `so`
 *   tăng dần (đặt mốc bằng số đó, không bằng vị trí trong mảng); không bao giờ chép mật khẩu hay token.
 *   Dùng như module: thuHoiPhien(accessToken?) — có token thì chỉ phiên của token đó; phienAuth(), nhatKyAuth(),
 *   bang(ten), suaBang(ten, id, giaTri) (sửa một dòng như người khác vừa sửa: updated_at đổi theo). Đổi kịch bản
 *   (/__kich-ban) không đụng tới phiên đăng nhập.
 *
 * Dùng như module: import { batMayGia } from './gia-supabase.mjs' (thu-day-du.mjs). cong: 0 → hệ điều hành chọn
 * cổng trống (crm/test/test-cong-khai-quet-gia.mjs); goc và cong trả về là cổng thật.
 * Không thư viện ngoài — chỉ node:http.
 */

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
// Giờ Việt Nam lấy từ chính thư viện của trang (Node ≥ 22.18 đọc thẳng file .ts) — không tự cộng 7 tiếng.
import { homNayVn } from '../src/lib/gio-vn.ts';

export const CONG_MAC_DINH = 54331;
export const KICH_BAN = ['rong', 'day-du', 'dat-ban-dong', 'dat-ban-loi', 'dat-ban-500', 'dat-ban-dut', 'dat-ban-sap', 'dia-chi-cong-bo',
  'tuyen-dung-mo', 'tuyen-dung-dut', 'tuyen-dung-loi', 'sap-mo', 'da-mo', 'da-mo-chua-doi-cau', 'khong-con-tat', 'thuc-don-thu-suc',
  'mua-thit-mo', 'mua-thit-giao', 'mua-thit-het-quay', 'mua-thit-rong', 'mua-thit-khong-zalo',
  'mua-thit-lech', 'mua-thit-loi', 'mua-thit-dut', 'mua-thit-treo', 'mua-thit-dat-loi', 'mua-thit-dat-dut', 'mua-thit-trang'];

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
// (web/src/lib/noi-dung.ts, mục "BA ĐIỀU QUAN TRỌNG"). crm/test/test-cong-khai-quet-gia.mjs so với NoiDung.
const KHOA_NOI_DUNG = [
  'ngay_khai_truong', 'ngay_treo_bang_ron', 'dong_trang_thai', 'form_dat_ban_dang_mo',
  'gio_phuc_vu_da_chot', 'hien_thuc_don', 'hien_do_uong_co_con', 'hien_tuyen_dung',
  'hien_ba_buoc', 'hien_quay_thit', 'hien_tiec_nhom', 'hien_danh_gia',
  'mini_app_hien_con_hang',
  // Trang Mua thịt về (0101).
  'hien_mua_thit_ve', 'mua_thit_hien_tam_het', 'mua_thit_gio_nhan', 'mua_thit_giao_hang', 'mua_thit_thue',
  'mua_thit_bao_quan_mat', 'mua_thit_bao_quan_dong_lanh', 'mua_thit_can_lech', 'mua_thit_hang_loi', 'mua_thit_doi_huy',
  // Khung nhắn tin Trang (0126).
  'hien_tro_ly_trang',
  'dia_chi_hien_thi', 'hotline', 'facebook_url', 'instagram_url', 'tiktok_url', 'zalo_oa_url',
  'google_maps_url', 'email_lien_he', 'tieu_de_og', 'mo_ta_og', 'anh_chia_se',
];

const NN = ['vi', 'en', 'ko'];
const ba = (vi, en, ko) => ({ vi, en, ko });

// ---------------------------------------------------------------------------
// Trang Mua thịt về (0101) — đích đặt hàng và chữ đã công bố của các kịch bản mua-thit-*. Link và chữ thử, không
// phải của nhà hàng: OA thật ở mini-app/src/cau-hinh.ts, chữ thật do Sang chốt.
// ---------------------------------------------------------------------------
/** Link Zalo OA "đã công bố" — đúng mẫu https://zalo.me/<mã> (laLinkZaloOa, la_link_zalo_oa()). */
export const ZALO_OA_THU = 'https://zalo.me/beeftown-thu';
export const GIO_NHAN_THU = ba(
  'Giao từ 10:30 đến 21:00, sau khi quán gọi lại xác nhận.',
  'We deliver from 10:30 to 21:00, once we have called to confirm.',
  '주문 확인 전화를 드린 뒤 10:30부터 21:00 사이에 배달해 드려요.',
);
export const GIAO_HANG_THU = ba(
  'Giao trong bán kính 5 km quanh quán; quán báo phí giao khi gọi lại xác nhận đơn.',
  'We deliver within 5 km of the restaurant and tell you the delivery fee when we call to confirm.',
  '매장에서 5km 이내로 배달해요. 배달비는 주문 확인 전화로 알려 드려요.',
);
/** Kịch bản có menu (mua_thit_ve_cong_khai trả MENU_THU). */
const KICH_BAN_CO_MENU = new Set(['mua-thit-mo', 'mua-thit-giao', 'mua-thit-het-quay', 'mua-thit-khong-zalo',
  'mua-thit-dat-loi', 'mua-thit-dat-dut', 'mua-thit-trang']);

/** Khóa nhóm "Mua thịt về" của một kịch bản (rỗng với kịch bản cũ: mọi khóa null). */
function noiDungMuaThit(kichBan, n) {
  if (!kichBan.startsWith('mua-thit-')) return {};
  const nd = {
    // Công tắc HIỆU LỰC: database tự tính false khi chưa có gói nào (mua-thit-rong). Từ 0113 link Zalo không còn là
    // điều kiện: mua-thit-khong-zalo vẫn mở.
    hien_mua_thit_ve: kichBan !== 'mua-thit-rong',
    zalo_oa_url: kichBan === 'mua-thit-khong-zalo' ? null : ZALO_OA_THU,
  };
  if (['mua-thit-mo', 'mua-thit-giao', 'mua-thit-het-quay', 'mua-thit-trang'].includes(kichBan)) nd.mua_thit_gio_nhan = GIO_NHAN_THU[n];
  if (kichBan === 'mua-thit-giao') Object.assign(nd, { mua_thit_giao_hang: GIAO_HANG_THU[n], hotline: null });
  // 0126 · khung nhắn tin Trang bật (công tắc hien_tro_ly_trang) — Edge Function giả ở traLoiTroLy bên dưới.
  if (kichBan === 'mua-thit-trang') nd.hien_tro_ly_trang = true;
  return nd;
}

// ---------------------------------------------------------------------------
// Edge Function tro-ly-trang GIẢ (0126) — POST {URL}/functions/v1/tro-ly-trang, thân text/plain chứa JSON
// {cuoc, ma_tin, tin, tra_truoc, chi_nhanh}. Trả lời mẫu theo chữ khách gõ (không gọi Claude):
//   có "lỗi"             → 502 { ok: false, loi: 'tam_thoi' } LẦN ĐẦU của mỗi ma_tin; gửi lại cùng ma_tin → trả lời thường
//   có "người hay máy"   → nói thật là trợ lý ảo + cách liên hệ quán (chuyen_nguoi)
//   có "người" (số người) → hai tin, thẻ ribeye-cap, đơn 2 gói ribeye-cap_200 và 1 gói than-ngoai_200
//   còn lại              → một tin hỏi số người
// Lệnh xem {hanh_dong: 'xem', cuoc, sau} → trạng thái cuộc của nhân viên giả. Nhân viên giả do kiểm thử điều khiển:
// mayGia.troLyNhanVien({ viec: 'nhan' | 'go' | 'gui' | 'tra' | 'truc', ten, noi_dung, bat, cuoc }) (cuoc bỏ trống = cuộc
// vừa nhắn). Nhân viên đang nhận cuộc → tin khách trả { ok, nhan_vien: true, ten } (như Edge Function thật).
// ---------------------------------------------------------------------------
export const TRA_LOI_TRANG_THU = {
  goiY: {
    ok: true,
    tin: ['Dạ nhà mình 2 người thì em gợi ý đầu thăn ngoại còn nắp làm phần chính ạ.', 'Thêm một gói thăn ngoại để so, giá em để ở thẻ bên dưới nhé.'],
    the: [{ ma: 'ribeye-cap', ten: 'Đầu thăn ngoại còn nắp', nhan: 'Ribeye with Cap', loai: 'Thịt mát', viTri: 'vùng sườn dọc lưng',
            diem: ['Mềm', 'Béo thơm', 'Mọng nước'], doChin: 'Tái chín đến chín vừa', meo: 'Vỉ nóng vừa. Nếm miếng đầu không chấm gì.', moTa: null }],
    don: [{ khoa: 'ribeye-cap_200', so_goi: 2, ten: 'đầu thăn ngoại còn nắp' }, { khoa: 'than-ngoai_200', so_goi: 1, ten: 'thăn ngoại' }],
    chot: false, chuyen_nguoi: false,
  },
  ai: { ok: true, tin: ['Dạ em là trợ lý ảo của Beeftown ạ.', 'Anh/chị muốn nói chuyện với nhân viên của quán thì liên hệ theo cách ở ngay bên dưới nhé.'],
        the: [], don: [], chot: false, chuyen_nguoi: true },
  hoi: { ok: true, tin: ['Dạ anh/chị nướng cho mấy người ạ?'], the: [], don: [], chot: false, chuyen_nguoi: false },
};

/**
 * Đúng thứ noi_dung_cong_khai(p_ngon_ngu) trả trong một kịch bản: ĐỦ mọi khóa, chưa công bố là null. Chữ của khóa văn
 * bản Mua thịt về theo thứ tiếng (như bản dịch đã duyệt); chữ của các khóa cũ không theo thứ tiếng (như trước).
 */
export function noiDung(kichBan, nn = 'vi') {
  const nd = Object.fromEntries(KHOA_NOI_DUNG.map(k => [k, null]));
  if (kichBan === 'rong') return nd;
  const n = NN.includes(nn) ? nn : 'vi';
  return {
    ...nd,
    ...LIEN_HE_THU,
    form_dat_ban_dang_mo: kichBan !== 'dat-ban-dong',
    hien_thuc_don: true,
    hien_do_uong_co_con: kichBan !== 'khong-con-tat',
    ...(kichBan === 'dia-chi-cong-bo' ? { dia_chi_hien_thi: DIA_CHI_CONG_BO_THU } : {}),
    ...(kichBan === 'sap-mo' ? { ngay_khai_truong: ngaySapMoThu(), dong_trang_thai: TRANG_THAI_THU['sap-mo'] } : {}),
    ...(kichBan === 'da-mo' ? { ngay_khai_truong: NGAY_DA_MO_THU, dong_trang_thai: TRANG_THAI_THU['da-mo'] } : {}),
    ...(kichBan === 'da-mo-chua-doi-cau' ? { ngay_khai_truong: NGAY_DA_MO_THU } : {}),
    ...noiDungMuaThit(kichBan, n),
  };
}

// ---------------------------------------------------------------------------
// Menu mua thịt về thử — hình dạng của mua_thit_ve_cong_khai() (0101), giá THỬ (không phải giá của quán; số nguyên
// chia hết cho 1.000 như ràng buộc giá của 0099). Thứ tự như database: thịt trước kim chi, gói theo số gam tăng
// dần. Đủ các ca trang phải chịu: thịt mát / đông lạnh / giữ lạnh, gói 1000 g, một gói "Tạm hết ở quầy", sản phẩm
// một gói, tên en / ko giống tên tiếng Việt (LA Galbi — thẻ phải gắn lang="vi"), hộp kim chi, và một sản phẩm tên
// dài đúng 120 ký tự, mô tả dài đúng 500 ký tự (giới hạn của ban_le_san_pham, 0099) cho phép đo 320px.
// thu-day-du.mjs nhóm 12 tính đơn và tin đơn mong đợi từ chính dữ liệu này (qua lib của trang).
// ---------------------------------------------------------------------------
export const MENU_THU = [
  { ma: 'ribeye-cap', loai: 'thit', donVi: 'goi', baoQuan: 'mat',
    ten: ba('Ribeye with Cap', 'Ribeye with the cap', '립아이 캡'),
    moTa: ba('Thăn lưng phần đầu, có lớp nắp mỡ bao quanh. Mềm, nhiều nước.',
             'The front of the rib, wrapped in its fat cap. Tender and juicy.',
             '등심 앞부분으로 지방층이 감싸고 있어요. 부드럽고 육즙이 많아요.'),
    cachDung: ba('Nướng trên vỉ nóng vừa, lật một lần, để thịt nghỉ hai phút trước khi cắt.',
                 'Grill on a medium-hot grill, turn once, and rest for two minutes before slicing.',
                 '중간 정도로 달군 그릴에서 한 번만 뒤집어 굽고, 자르기 전에 2분 정도 두세요.'),
    goi: [{ soGam: 200, gia: 400000 }, { soGam: 400, gia: 800000 }] },
  { ma: 'than-ngoai', loai: 'thit', donVi: 'goi', baoQuan: 'mat',
    ten: ba('Thăn ngoại', 'Striploin', '채끝'),
    moTa: ba('Thớ chắc, vị bò rõ.', 'Firm grain and a clear beef flavour.', '결이 단단하고 소고기 맛이 또렷해요.'),
    cachDung: ba('Thái lát dày, nướng nhanh trên vỉ thật nóng.', 'Slice thick and grill quickly on a very hot grill.',
                 '두툼하게 썰어 아주 뜨거운 그릴에서 빠르게 구워 주세요.'),
    goi: [{ soGam: 200, gia: 300000 }, { soGam: 400, gia: 600000 }, { soGam: 1000, gia: 1500000 }] },
  { ma: 'ba-chi-bo-my', loai: 'thit', donVi: 'goi', baoQuan: 'mat',
    ten: ba('Ba chỉ bò Mỹ', 'US beef short plate', '미국산 우삼겹'),
    moTa: ba('Thái lát mỏng, mỡ xen nạc.', 'Thin slices, fat running through the lean.', '얇게 썰어 살코기 사이에 지방이 고루 섞여 있어요.'),
    cachDung: ba('Lát mỏng nên chín nhanh, nướng từng lát.', 'Thin slices cook fast: grill one slice at a time.',
                 '얇아서 빨리 익으니 한 장씩 구워 주세요.'),
    goi: [{ soGam: 200, gia: 180000 }, { soGam: 400, gia: 360000, tamHet: true }] },
  { ma: 'la-galbi', loai: 'thit', donVi: 'goi', baoQuan: 'dong_lanh',
    ten: ba('LA Galbi', 'LA Galbi', 'LA Galbi'),
    moTa: ba('Sườn cắt ngang, có xương, đã ướp sẵn.', 'Cross-cut short ribs on the bone, already marinated.', '뼈째 가로로 썰어 미리 양념한 갈비예요.'),
    cachDung: ba('Rã đông trong ngăn mát, nướng trên vỉ nóng vừa.', 'Thaw in the fridge, then grill on a medium-hot grill.',
                 '냉장실에서 해동한 뒤 중간 정도로 달군 그릴에서 구워 주세요.'),
    goi: [{ soGam: 400, gia: 360000 }] },
  { ma: 'than-lung-cat-day', loai: 'thit', donVi: 'goi', baoQuan: 'giu_lanh',
    ten: ba('Thăn lưng bò Mỹ cắt dày để nướng tại nhà, chia gói vừa cho hai người, kèm cách bảo quản và cách nướng trên chảo rất nóng',
            'US beef striploin cut thick for grilling at home, packed for two people, with notes on storing it and cooking it in a very hot pan',
            '집에서 굽기 좋게 두툼하게 썬 미국산 채끝, 두 분이 드시기 좋은 양으로 포장하고 보관 방법과 아주 뜨거운 팬에서 굽는 방법을 함께 담았어요'),
    moTa: ba('Phần thăn lưng của bò Mỹ, thớ thịt mịn, có một dải mỡ mỏng chạy dọc mép giúp miếng thịt giữ được độ ẩm khi nướng. '
             + 'Quầy cắt dày khoảng hai đốt ngón tay để bạn nướng tại nhà mà phần giữa vẫn hồng. Giữ trong ngăn mát, lấy ra để ngoài '
             + 'khoảng hai mươi phút cho thịt bớt lạnh rồi mới nướng. Thấm khô mặt thịt bằng giấy, rắc muối ngay trước khi cho lên chảo '
             + 'đã thật nóng, lật một lần, để thịt nghỉ vài phút trên thớt rồi mới thái lát theo chiều ngang thớ. Ăn kèm kim chi cải '
             + 'thảo, rau xà lách và tương chấm.',
             'Striploin from US beef, with a fine grain and a thin strip of fat along the edge that keeps the meat moist as it cooks. '
             + 'The counter cuts it about two fingers thick so you can cook it at home and keep the centre pink. Keep it in the fridge, '
             + 'then leave it out for about twenty minutes before cooking. Pat the surface dry, salt it just before it goes into a very '
             + 'hot pan, turn it once, rest it for a few minutes on the board, then slice across the grain. Serve with napa cabbage '
             + 'kimchi, lettuce and dipping sauce.',
             '미국산 채끝으로 결이 곱고, 가장자리를 따라 얇은 지방층이 있어 구울 때 촉촉함이 유지돼요. 집에서 구워도 가운데가 '
             + '분홍빛으로 남도록 손가락 두 마디 정도 두께로 썰어 드려요. 냉장 보관하시고, 굽기 20분 전에 꺼내 두세요. 키친타월로 '
             + '겉면의 물기를 닦고 아주 뜨겁게 달군 팬에 올리기 직전에 소금을 뿌린 뒤, 한 번만 뒤집어 구워 주세요. 도마 위에서 몇 '
             + '분 두었다가 결의 반대 방향으로 썰어 배추김치, 상추, 쌈장과 함께 드세요.'),
    cachDung: null,
    goi: [{ soGam: 200, gia: 250000 }, { soGam: 400, gia: 500000 }] },
  { ma: 'kim-chi-cai-thao', loai: 'kim_chi', donVi: 'hop', baoQuan: 'giu_lanh',
    ten: ba('Kim chi cải thảo', 'Napa cabbage kimchi', '배추김치'),
    moTa: ba('Kim chi cải thảo nhà làm, chua cay vừa.', 'Our own napa cabbage kimchi, mildly sour and spicy.', '직접 담근 배추김치예요. 적당히 새콤하고 매콤해요.'),
    cachDung: ba('Giữ lạnh, dùng kèm thịt nướng hoặc nấu canh.', 'Keep cold; serve with grilled beef or cook it into a stew.',
                 '냉장 보관하고, 구운 고기와 함께 드시거나 찌개에 넣어 드세요.'),
    goi: [{ soGam: 500, gia: 90000 }] },
];

/**
 * Gu thử của các phần thịt trong MENU_THU (0116) — đủ ca khối "Chọn theo gu" phải chịu: một gu, hai gu, cả bốn gu có
 * mặt (thành bốn nút lọc), tên en / ko giống tên tiếng Việt (LA Galbi), tên dài 120 ký tự và mô tả 500 ký tự ở 320px.
 * Kim chi không có gu (database chặn).
 */
export const GU_THU = {
  'ribeye-cap': ['mem_beo'],
  'than-ngoai': ['dam_vi', 'nac_thanh'],
  'ba-chi-bo-my': ['mem_beo', 'lat_mong'],
  'la-galbi': ['dam_vi'],
  'than-lung-cat-day': ['nac_thanh'],
};
// Đợt 3: thẻ Mua thịt về đọc cùng gu — mua-thit-mo, mua-thit-giao có gu; mua-thit-het-quay không (thẻ không dòng gu).
const KICH_BAN_CO_GU = new Set(['day-du', 'thuc-don-thu-suc', 'mua-thit-mo', 'mua-thit-giao']);

/** Đúng các dòng bo_tai_quay_theo_gu(p_ngon_ngu) trả — 6 cột, thứ tự của 0116; kịch bản không có gu → []. */
export function boTaiQuayTheoGu(kichBan, nn = 'vi') {
  if (!KICH_BAN_CO_GU.has(kichBan)) return [];
  const n = NN.includes(nn) ? nn : 'vi';
  return MENU_THU.filter(sp => sp.loai === 'thit' && GU_THU[sp.ma]).map(sp => ({
    san_pham_ma: sp.ma,
    ten: sp.ten[n],
    ten_vi: sp.ten.vi,
    mo_ta: sp.moTa?.[n] ?? null,
    cach_dung: sp.cachDung?.[n] ?? null,
    gu: GU_THU[sp.ma],
  }));
}

/**
 * Đúng các dòng mua_thit_ve_cong_khai(p_ngon_ngu, p_chi_nhanh_ma) trả trong một kịch bản — 11 cột, đúng thứ tự của
 * 0101. Kịch bản không có menu → [] (như hàm thật khi kênh chưa mở). mua-thit-het-quay: mọi gói tam_het.
 */
export function menuMuaThitVe(kichBan, nn = 'vi') {
  if (!KICH_BAN_CO_MENU.has(kichBan)) return [];
  const n = NN.includes(nn) ? nn : 'vi';
  const hetQuay = kichBan === 'mua-thit-het-quay';
  return MENU_THU.flatMap(sp => sp.goi.map(g => ({
    san_pham_ma: sp.ma,
    loai: sp.loai,
    don_vi: sp.donVi,
    bao_quan: sp.baoQuan,
    ten: sp.ten[n],
    ten_vi: sp.ten.vi,
    mo_ta: sp.moTa?.[n] ?? null,
    cach_dung: sp.cachDung?.[n] ?? null,
    so_gam: g.soGam,
    gia: g.gia,
    tam_het: hetQuay || g.tamHet === true,
  })));
}

// ---------------------------------------------------------------------------
// Thực đơn mẫu — ĐÚNG danh mục của cuốn menu bản sáng Khánh chốt 11/10/2026 (bảng danh mục 11/10,
// migration 0096) ở trạng thái "đã công bố hết những món công bố được": 22 món ăn (kể cả Set 4 sốt S01)
// và ba ly signature. Tên, mô tả ba thứ tiếng chép NGUYÊN VĂN bảng danh mục. 17 đồ uống dạng danh sách
// (highball, bia, soju, makgeolli, nước ép & ade, nước ngọt, nước suối) KHÔNG trả về: cuốn không có mô tả
// cho chúng, database đòi mô tả mới cho công bố. KHÔNG món nào có giá (gia null) — đúng như database:
// 69.000đ của Set 4 sốt và ba ly signature chỉ là giá đề xuất chờ duyệt, không bao giờ tới trang.
// Thứ tự: nhom_mon.thu_tu rồi mon_an.thu_tu, như thuc_don_cong_khai() trả.
// ---------------------------------------------------------------------------
// Nhóm theo thu_tu của bảng nhóm (0096). bo-tai-quay không có món nào trong danh mục.
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
// /noi-bo — SUPABASE AUTH GIẢ VÀ MỘT NHÂN VIÊN (đầu file, mục "/noi-bo — ĐĂNG NHẬP THẬT")
// ---------------------------------------------------------------------------
/** Chi nhánh duy nhất. Mã q1 như mã mặc định của trang (lib/noi-dung.ts, maChiNhanh). */
export const CHI_NHANH_THU = { id: 'c1000000-0000-4000-8000-000000000001', ma: 'q1', ten: 'Chi nhánh Thử' };

/**
 * Nhân viên duy nhất: một quản lý đang làm ở CHI_NHANH_THU — mở được cả trang CRM lẫn kho, sửa được video đào tạo.
 * Email (tên miền .test, không gửi thư được) và mật khẩu thử, chỉ có ở server này.
 */
export const NHAN_VIEN_THU = {
  email: 'quan-ly.thu@beeftown.test', matKhau: 'mat-khau-thu-14',
  uid: 'a1000000-0000-4000-8000-000000000001', nhanSuId: 'b1000000-0000-4000-8000-000000000001',
  hoTen: 'Quản Lý Thử', vaiTro: 'quan_ly', chiNhanhId: CHI_NHANH_THU.id,
};

/**
 * Một video đào tạo (video_dao_tao, 0117) — trang /noi-bo/dao-tao chỉ có form sửa khi có video. youtube_id là mã
 * giả đúng dạng 11 ký tự (ràng buộc của bảng), không phải video thật: mã thật không được nằm trong repo công khai.
 */
export const VIDEO_THU = {
  id: 'd1000000-0000-4000-8000-000000000001', youtube_id: 'thuVideo014', tieu_de: 'Xếp khay thịt ở quầy',
  mo_ta: 'Video thử của Supabase giả.', tao_boi: NHAN_VIEN_THU.nhanSuId,
  created_at: '2026-11-01T03:00:00+00:00', updated_at: '2026-11-01T03:00:00+00:00',
};

/** Hạn của access token, như mặc định của Supabase (JWT expiry 3600 giây). */
const HAN_TOKEN_GIAY = 3600;

/** Cột của từng bảng giả, đúng bảng thật (0001, 0117; view v_viec_dich của 0099) — chọn hay lọc cột khác là 42703. */
const COT_BANG = {
  nhan_su: ['id', 'auth_uid', 'chi_nhanh_id', 'ho_ten', 'email', 'vai_tro', 'dang_lam', 'created_at', 'updated_at'],
  chi_nhanh: ['id', 'ma', 'ten', 'khu_vuc', 'dia_chi', 'dien_thoai', 'trua_bat_dau', 'trua_ket_thuc', 'toi_bat_dau',
    'toi_ket_thuc', 'buoc_khung_gio_phut', 'thoi_luong_bua_phut', 'giu_ban_phut', 'dang_hoat_dong', 'created_at', 'updated_at'],
  video_dao_tao: ['id', 'youtube_id', 'tieu_de', 'mo_ta', 'tao_boi', 'created_at', 'updated_at'],
  v_viec_dich: ['bang', 'dong_id', 'cot', 'ngon_ngu', 'nguon', 'bam', 'ly_do'],
};

/** Dữ liệu của các bảng giả — mỗi server một bản, sửa được (PATCH, suaBang). Dòng đủ mọi cột của COT_BANG. */
function taoBang() {
  const luc = '2026-10-01T03:00:00+00:00';
  return {
    nhan_su: [{
      id: NHAN_VIEN_THU.nhanSuId, auth_uid: NHAN_VIEN_THU.uid, chi_nhanh_id: NHAN_VIEN_THU.chiNhanhId,
      ho_ten: NHAN_VIEN_THU.hoTen, email: NHAN_VIEN_THU.email, vai_tro: NHAN_VIEN_THU.vaiTro, dang_lam: true,
      created_at: luc, updated_at: luc,
    }],
    chi_nhanh: [{
      ...CHI_NHANH_THU, khu_vuc: null, dia_chi: null, dien_thoai: null,
      trua_bat_dau: '11:00:00', trua_ket_thuc: '14:00:00', toi_bat_dau: '17:00:00', toi_ket_thuc: '22:00:00',
      buoc_khung_gio_phut: 30, thoi_luong_bua_phut: 120, giu_ban_phut: 15, dang_hoat_dong: true, created_at: luc, updated_at: luc,
    }],
    video_dao_tao: [{ ...VIDEO_THU }],
    v_viec_dich: [],
  };
}

/** Vai đọc được video đào tạo: bảy vai người (policy video_dao_tao_doc, 0117) và học viên (0119); chủ và quản lý sửa được. */
const VAI_XEM_VIDEO = ['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing', 'thu_kho', 'nhan_vien_quay', 'ke_toan', 'hoc_vien'];
const VAI_SUA_VIDEO = ['chu_so_huu', 'quan_ly'];

const b64url = o => Buffer.from(JSON.stringify(o)).toString('base64url');

/** Người dùng Supabase Auth của NHAN_VIEN_THU — hình dạng /auth/v1/user trả về. */
function nguoiDungAuth() {
  const luc = '2026-10-01T03:00:00.000000Z';
  return {
    id: NHAN_VIEN_THU.uid, aud: 'authenticated', role: 'authenticated', email: NHAN_VIEN_THU.email,
    email_confirmed_at: luc, phone: '', confirmed_at: luc, last_sign_in_at: luc,
    app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [],
    created_at: luc, updated_at: luc, is_anonymous: false,
  };
}

/** Hai giá trị của một ô có bằng nhau không, như Postgres so: timestamptz so thời điểm, không so chữ. */
function cungGiaTri(cot, giaTri, chu) {
  if (giaTri === null || giaTri === undefined) return false;   // SQL: null không bằng, cũng không khác, gì cả
  if (String(giaTri) === chu) return true;
  if (!/_at$/.test(cot)) return false;
  const a = Date.parse(giaTri), b = Date.parse(chu);
  return !Number.isNaN(a) && a === b;
}

/** Thời điểm hiện tại theo cách PostgREST in timestamptz (micro giây, +00:00). */
const thoiDiemMoi = () => new Date().toISOString().replace(/\.(\d{3})Z$/, '.$1000+00:00');

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
// 0125: p_hoa_don (không bắt buộc) — web chỉ gửi khi khách chọn "Cần xuất hóa đơn đỏ"; như hàm thật, thiếu thì là null.
const THAM_SO_DAT_HANG = [
  'p_ma_gui', 'p_chi_nhanh_ma', 'p_ho_ten', 'p_sdt', 'p_dia_chi', 'p_ghi_chu', 'p_gio', 'p_gia_da_xem', 'p_ngon_ngu', 'p_ip',
  'p_hoa_don',
];
const HAM = {
  noi_dung_cong_khai: { thamSo: ['p_ngon_ngu'], batBuoc: [] },
  thuc_don_cong_khai: { thamSo: ['p_ngon_ngu'], batBuoc: [] },
  tin_tuyen_dung_cong_khai: { thamSo: ['p_ngon_ngu'], batBuoc: [] },
  lich_trong_theo_ma: { thamSo: ['p_chi_nhanh_ma', 'p_ngay'], batBuoc: ['p_chi_nhanh_ma', 'p_ngay'] },
  tao_dat_ban: { thamSo: THAM_SO_DAT_BAN, batBuoc: THAM_SO_DAT_BAN.slice(0, 6) },
  nop_ho_so_ung_tuyen: { thamSo: THAM_SO_NOP_HO_SO, batBuoc: THAM_SO_NOP_HO_SO.slice(0, 3) },
  mua_thit_ve_cong_khai: { thamSo: ['p_ngon_ngu', 'p_chi_nhanh_ma'], batBuoc: [] },
  bo_tai_quay_theo_gu: { thamSo: ['p_ngon_ngu'], batBuoc: [] },
  tao_don_mua_thit: { thamSo: THAM_SO_DAT_HANG, batBuoc: THAM_SO_DAT_HANG.slice(0, 8) },
  // /noi-bo (0092): số đỏ trên menu kho. Chỉ người đăng nhập, đúng chi nhánh của mình.
  kho_dem_viec: { thamSo: ['p_chi_nhanh_id'], batBuoc: ['p_chi_nhanh_id'] },
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
 * Bật server giả. Trả về { goc, cong, datKichBan(ten), kichBan(), dem(), nhatKy(), dong() } và phần /noi-bo:
 * thuHoiPhien(accessToken?), phienAuth(), nhatKyAuth(), bang(ten), suaBang(ten, id, giaTri) (đầu file).
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
  let soDonMuaThit = 0;
  const donTheoMaGui = new Map();
  const henGio = new Set();   // lời trả lời đang hoãn (mua-thit-treo) — dong() hủy hết
  // Nhân viên nhận chat giả (0126 mục 4b): cuộc → { aiTraLoi, ten, dangGo, tin }; truc = có nhân viên mở màn theo dõi.
  const troLyCuoc = new Map();
  let troLyTruc = false;
  let troLyId = 0;
  let troLyCuocCuoi = null;
  const cuocGia = id => {
    if (!troLyCuoc.has(id)) troLyCuoc.set(id, { aiTraLoi: 'trang', ten: null, dangGo: false, tin: [] });
    return troLyCuoc.get(id);
  };
  function troLyNhanVien({ viec, ten = null, noi_dung = '', bat = true, cuoc = null } = {}) {
    if (viec === 'truc') { troLyTruc = !!bat; return { truc: troLyTruc }; }
    const id = cuoc ?? troLyCuocCuoi;
    if (!id) throw new Error('Chưa có cuộc chat nào để nhân viên giả nhận');
    const cc = cuocGia(id);
    if (viec === 'nhan') { cc.aiTraLoi = 'nhan_vien'; cc.ten = ten; cc.tin.push({ id: ++troLyId, nguoi: 'he_thong', noi_dung: 'nhan_vien_vao', ten }); }
    else if (viec === 'go') cc.dangGo = !!bat;
    else if (viec === 'gui') { cc.dangGo = false; cc.tin.push({ id: ++troLyId, nguoi: 'nhan_vien', noi_dung: String(noi_dung), ten: cc.ten }); }
    else if (viec === 'tra') { cc.aiTraLoi = 'trang'; cc.ten = null; cc.dangGo = false; cc.tin.push({ id: ++troLyId, nguoi: 'he_thong', noi_dung: 'trang_quay_lai', ten: null }); }
    else throw new Error(`Việc lạ của nhân viên giả: ${viec}`);
    return { cuoc: id, ...cc, tin: [...cc.tin] };
  }

  const datKichBan = (ten, { cham: ms = 0 } = {}) => {
    if (!KICH_BAN.includes(ten)) throw new Error(`Kịch bản lạ: ${ten}`);
    hienTai = ten; cham = Math.max(0, Number(ms) || 0); dem = {}; nhatKy = [];
  };

  // --- Supabase Auth giả và bảng (/noi-bo) — đầu file, mục "/noi-bo — ĐĂNG NHẬP THẬT" -------------------------
  const cacPhien = new Map();   // session_id → { conSong, lyDo }
  const truyCap = new Map();    // access token → { phienId, het (giây) }
  const lamMoi = new Map();     // refresh token → { phienId, daDung, luc (giây lúc dùng), con (cặp đã cấp khi dùng) }
  const KHOANG_DUNG_LAI_GIAY = 10;   // GOTRUE_SECURITY_REFRESH_TOKEN_REUSE_INTERVAL mặc định
  const bang = taoBang();
  let nhatKyAuth = [];
  let soLuotAuth = 0;   // số thứ tự lượt gọi Auth, tăng mãi — nhật ký chỉ giữ 200 lượt gần nhất
  let soToken = 0;
  const giayBayGio = () => Math.floor(Date.now() / 1000);

  /** Cặp token mới cho một phiên — đúng hình dạng trả lời /token của Supabase Auth. */
  function capToken(phienId) {
    const n = ++soToken;
    const luc = giayBayGio();
    const access_token = [b64url({ alg: 'HS256', typ: 'JWT' }), b64url({
      aud: 'authenticated', exp: luc + HAN_TOKEN_GIAY, iat: luc, sub: NHAN_VIEN_THU.uid, email: NHAN_VIEN_THU.email,
      role: 'authenticated', session_id: phienId, n,
    }), 'chu-ky-gia'].join('.');
    const refresh_token = `rt-thu-${n}`;
    truyCap.set(access_token, { phienId, het: luc + HAN_TOKEN_GIAY });
    lamMoi.set(refresh_token, { phienId, daDung: false });
    return { access_token, token_type: 'bearer', expires_in: HAN_TOKEN_GIAY, expires_at: luc + HAN_TOKEN_GIAY, refresh_token, user: nguoiDungAuth() };
  }
  const thuHoi = (phienId, lyDo) => {
    const p = cacPhien.get(phienId);
    if (!p?.conSong) return 0;
    p.conSong = false; p.lyDo = lyDo;
    return 1;
  };
  /** Thu hồi ở Auth giả: phiên của `accessToken`, hoặc (không truyền) mọi phiên đang sống. Trả số phiên vừa thu hồi. */
  const thuHoiPhien = accessToken => {
    if (accessToken !== undefined) return truyCap.has(accessToken) ? thuHoi(truyCap.get(accessToken).phienId, 'thu-hoi') : 0;
    let n = 0;
    for (const id of cacPhien.keys()) n += thuHoi(id, 'thu-hoi');
    return n;
  };
  const phienAuth = () => [...cacPhien].map(([id, p]) => ({ id, conSong: p.conSong, lyDo: p.lyDo }));
  /**
   * requireAuthentication của Supabase Auth: token có thật, còn hạn, phiên còn sống. Trả { a } (a = phiên của token)
   * hoặc { loi: [mã HTTP, thân] }.
   */
  function kiemToken(the) {
    if (!the) return { loi: [401, { code: 'no_authorization', message: 'This endpoint requires a valid Bearer token' }] };
    const a = truyCap.get(the);
    if (!a) return { loi: [403, { code: 'bad_jwt', message: 'invalid JWT: unable to parse or verify signature, token is malformed' }] };
    if (a.het <= giayBayGio()) {
      return { loi: [403, { code: 'bad_jwt', message: 'invalid JWT: unable to parse or verify signature, token has invalid claims: token is expired' }] };
    }
    if (!cacPhien.get(a.phienId)?.conSong) {
      return { loi: [403, { code: 'session_not_found', message: 'Session from session_id claim in JWT does not exist' }] };
    }
    return { a };
  }
  /**
   * Vai của một lượt gọi PostgREST, như PostgREST đọc JWT: access token còn hạn → người đăng nhập (KỂ CẢ khi phiên đã
   * bị thu hồi ở Auth — PostgREST không hỏi Auth); token trùng khóa apikey → anon; token hết hạn → 401 PGRST303;
   * chuỗi lạ → 401 PGRST301.
   */
  function vaiCua(req) {
    const the = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
    if (!the || the === String(req.headers.apikey ?? '')) return { vai: 'anon' };
    const a = truyCap.get(the);
    if (!a) return { loi: [401, loiPostgrest('PGRST301', 'JWSError JWSInvalidSignature')] };
    if (a.het <= giayBayGio()) return { loi: [401, loiPostgrest('PGRST303', 'JWT expired')] };
    return { vai: 'authenticated', uid: NHAN_VIEN_THU.uid };
  }
  /** Dòng nhan_su đang làm của một tài khoản (nhan_su_hien_tai() của database), hoặc null. */
  const nhanSuCua = uid => bang.nhan_su.find(n => n.auth_uid === uid && n.dang_lam) ?? null;
  /** Các dòng một vai đọc được, như RLS (rút gọn): anon không đọc được bảng nội bộ nào. */
  function dongDocDuoc(ten, v) {
    if (v.vai !== 'authenticated') return [];
    const ns = nhanSuCua(v.uid);
    if (ten === 'nhan_su') return bang.nhan_su.filter(n => n.auth_uid === v.uid || (ns && ns.chi_nhanh_id === n.chi_nhanh_id));
    if (ten === 'video_dao_tao') return ns && VAI_XEM_VIDEO.includes(ns.vai_tro) ? bang.video_dao_tao : [];
    return ns ? bang[ten] : [];
  }
  /** Sửa một dòng như một người khác vừa sửa (vd quản lý khác sửa tên video): updated_at đổi theo. Trả bản sao dòng. */
  const suaBang = (ten, id, giaTri) => {
    const d = bang[ten]?.find(x => x.id === id);
    if (!d) throw new Error(`Supabase giả: không có dòng ${id} trong ${ten}`);
    Object.assign(d, giaTri, COT_BANG[ten].includes('updated_at') ? { updated_at: thoiDiemMoi() } : {});
    return { ...d };
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

      // --- Edge Function tro-ly-trang giả (0126): trả TRA_LOI_TRANG_THU theo chữ khách gõ --------------------
      if (url.pathname === '/functions/v1/tro-ly-trang') {
        const dau = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
        if (req.headers.origin) { dau['Access-Control-Allow-Origin'] = req.headers.origin; dau.Vary = 'Origin'; }
        if (req.method === 'OPTIONS') { res.writeHead(204, dau); return res.end(); }
        let than = null;
        try { than = JSON.parse(duLieu || 'null'); } catch { /* thân hỏng */ }
        nhatKy.push({ ham: 'tro-ly-trang', thamSo: { than, loaiNoiDung: req.headers['content-type'] ?? '', coCookie: !!req.headers.cookie } });
        const tin = String(than?.tin ?? '');
        const lanCuaMa = nhatKy.filter(d => d.ham === 'tro-ly-trang' && d.thamSo.than?.ma_tin === than?.ma_tin).length;
        const traVe = (status, j) => { res.writeHead(status, dau); res.end(JSON.stringify(j)); };
        if (than?.hanh_dong === 'xem') {
          const cc = typeof than.cuoc === 'string' ? troLyCuoc.get(than.cuoc) : null;
          const sau = Number(than.sau) || 0;
          return traVe(200, { ok: true, xem: true, ai_tra_loi: cc?.aiTraLoi ?? 'trang', ten: cc?.aiTraLoi === 'nhan_vien' ? cc.ten : null,
            dang_go: !!cc?.dangGo, truc: troLyTruc, tin: (cc?.tin ?? []).filter(t => t.id > sau) });
        }
        if (typeof than?.cuoc === 'string') troLyCuocCuoi = than.cuoc;
        const ccGui = typeof than?.cuoc === 'string' ? troLyCuoc.get(than.cuoc) : null;
        if (ccGui?.aiTraLoi === 'nhan_vien') return traVe(200, { ok: true, nhan_vien: true, ten: ccGui.ten });
        if (/lỗi/i.test(tin) && lanCuaMa === 1) return traVe(502, { ok: false, loi: 'tam_thoi' });
        if (/người hay máy/i.test(tin)) return traVe(200, TRA_LOI_TRANG_THU.ai);
        if (/người/i.test(tin)) return traVe(200, TRA_LOI_TRANG_THU.goiY);
        return traVe(200, TRA_LOI_TRANG_THU.hoi);
      }
      if (url.pathname === '/__thu-hoi' && req.method === 'POST') return tra(200, { da_thu_hoi: thuHoiPhien() });
      if (url.pathname === '/__auth') return tra(200, { phien: phienAuth(), nhat_ky: nhatKyAuth });

      // --- Supabase Auth: /auth/v1/… (/noi-bo) -------------------------------
      if (url.pathname.startsWith('/auth/v1/')) return traLoiAuth();

      // --- PostgREST: bảng /rest/v1/<bảng> (/noi-bo) -------------------------
      const mb = url.pathname.match(/^\/rest\/v1\/([a-z0-9_]+)$/);
      if (mb) return traLoiBang(mb[1]);

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
        case 'noi_dung_cong_khai': return tra(200, noiDung(hienTai, nn));
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
        case 'tao_don_mua_thit': {
          if (cham > 0) return void setTimeout(() => taoDonMuaThit(thamSo), cham);
          return taoDonMuaThit(thamSo);
        }
        case 'bo_tai_quay_theo_gu': return tra(200, boTaiQuayTheoGu(hienTai, nn));
        case 'kho_dem_viec': {
          const v = vaiCua(req);
          if (v.loi) return tra(...v.loi);
          // Hàm thật không cấp cho anon: PostgREST trả 401 khi người chưa đăng nhập thiếu quyền.
          if (v.vai !== 'authenticated') return tra(401, loiPostgrest('42501', 'permission denied for function kho_dem_viec'));
          const ns = nhanSuCua(v.uid);
          if (!ns || (ns.vai_tro !== 'chu_so_huu' && ns.chi_nhanh_id !== thamSo.p_chi_nhanh_id)) {
            return tra(400, loiPostgrest('P0001', 'Tài khoản của bạn không xem được kho của chi nhánh này'));
          }
          // Kho đã khởi tạo, không việc nào, không thông báo chưa đọc: menu không có số đỏ.
          return tra(200, { khoi_tao: true, chua_doc: 0, thong_bao_xem_luc: null, viec_dong: 0 });
        }
        case 'mua_thit_ve_cong_khai': {
          if (hienTai === 'mua-thit-loi') return tra(500, loiPostgrest('XX000', 'upstream request timeout'));
          if (hienTai === 'mua-thit-dut') { req.socket.destroy(); return; }   // mất mạng giữa chừng: không một byte
          if (hienTai === 'mua-thit-treo') {
            // Database treo: 10 giây không trả lời. Trang phải thôi chờ trước đó (HET_GIO_MS của lib/mua-thit-ve.ts).
            const h = setTimeout(() => {
              henGio.delete(h);
              if (!req.socket.destroyed && !res.writableEnded) tra(200, menuMuaThitVe('mua-thit-mo', nn));
            }, 10000);
            h.unref?.();
            henGio.add(h);
            return;
          }
          return tra(200, menuMuaThitVe(hienTai, nn));
        }
      }
      return tra(500, loiPostgrest('XX000', 'unreachable'));

      /** Supabase Auth giả: đúng bốn cửa lib/phien.ts gọi (đầu file, mục "/noi-bo — ĐĂNG NHẬP THẬT"). */
      function traLoiAuth() {
        const traAuth = (status, than) => {
          res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'X-Supabase-Api-Version': '2024-01-01' });
          res.end(JSON.stringify(than));
        };
        const cua = url.pathname.slice('/auth/v1/'.length);
        const the = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
        // Nhật ký không bao giờ chép mật khẩu hay token.
        const ghi = dong => { nhatKyAuth.push({ so: ++soLuotAuth, ...dong }); if (nhatKyAuth.length > 200) nhatKyAuth.shift(); };

        if (cua === 'token') {
          // Mọi lượt gọi cửa token — đăng nhập, cả đổi refresh token, cả lượt sai cách — đếm dưới tên 'auth:dang_nhap'
          // và vào nhật ký chung (/__nhat-ky) chỉ kèm grant_type và email: thu-day-du.mjs nhóm 14 kiểm "F5, Quay lại,
          // Tiến không gửi thêm lượt đăng nhập nào". datKichBan() xóa bộ đếm, không đụng phiên.
          let emailGui = '';
          try { emailGui = String(JSON.parse(duLieu || '{}')?.email ?? ''); } catch { /* thân hỏng: vẫn đếm */ }
          dem['auth:dang_nhap'] = (dem['auth:dang_nhap'] ?? 0) + 1;
          nhatKy.push({ ham: 'auth:dang_nhap', thamSo: { grant_type: url.searchParams.get('grant_type'), email: emailGui } });
          if (nhatKy.length > 200) nhatKy.shift();
        }

        if (cua === 'token' && req.method === 'POST') {
          const loai = url.searchParams.get('grant_type');
          let than = null;
          try { than = JSON.parse(duLieu || '{}'); } catch { /* thân hỏng: trả lời ngay dưới */ }
          if (!than || typeof than !== 'object') {
            ghi({ cua, loai, status: 400 });
            return traAuth(400, { code: 'bad_json', message: 'Could not parse request body as JSON' });
          }
          if (loai === 'password') {
            const email = String(than.email ?? '').trim().toLowerCase();
            // Đăng nhập không thành vì Supabase bận hay mất mạng (nhóm 14) — mọi kịch bản, email quyết định.
            if (email.startsWith('ban@')) {
              ghi({ cua, loai, email, status: 429 });
              return traAuth(429, { code: 'over_request_rate_limit', message: 'Request rate limit reached' });
            }
            if (email.startsWith('dut@')) {
              ghi({ cua, loai, email, status: 0 });   // 0: cắt kết nối, không một byte trả lời
              req.socket.destroy();
              return;
            }
            if (email !== NHAN_VIEN_THU.email || than.password !== NHAN_VIEN_THU.matKhau) {
              ghi({ cua, loai, email, status: 400 });
              return traAuth(400, { code: 'invalid_credentials', message: 'Invalid login credentials' });
            }
            const phienId = randomUUID();
            cacPhien.set(phienId, { conSong: true, lyDo: null });
            ghi({ cua, loai, email, phien: phienId, status: 200 });
            return traAuth(200, capToken(phienId));
          }
          if (loai === 'refresh_token') {
            const r = lamMoi.get(than.refresh_token);
            if (!r || !cacPhien.get(r.phienId)?.conSong) {
              ghi({ cua, loai, phien: r?.phienId ?? null, status: 400 });
              return traAuth(400, { code: 'refresh_token_not_found', message: 'Invalid Refresh Token: Refresh Token Not Found' });
            }
            if (r.daDung && giayBayGio() - r.luc <= KHOANG_DUNG_LAI_GIAY) {
              ghi({ cua, loai, phien: r.phienId, status: 200, dung_lai: true });
              return traAuth(200, r.con);
            }
            if (r.daDung) {
              // Refresh token đã xoay mà bị dùng lại: Supabase coi là token bị lộ, thu hồi cả phiên.
              thuHoi(r.phienId, 'dung-lai-refresh-token');
              ghi({ cua, loai, phien: r.phienId, status: 400 });
              return traAuth(400, { code: 'refresh_token_already_used', message: 'Invalid Refresh Token: Already Used' });
            }
            r.daDung = true;
            r.luc = giayBayGio();
            r.con = capToken(r.phienId);
            ghi({ cua, loai, phien: r.phienId, status: 200 });
            return traAuth(200, r.con);
          }
          ghi({ cua, loai, status: 400 });
          return traAuth(400, { code: 'validation_failed', message: 'unsupported_grant_type' });
        }

        if (cua === 'user') {
          // Mọi lượt kiểm phiên (auth.getUser của layPhien — mọi lượt xin trang nội bộ) đếm dưới tên 'auth:kiem_phien' và
          // vào nhật ký chung chỉ kèm "token có phải ban-… không": thu-day-du.mjs nhóm 15 kiểm "trang báo bận không hỏi
          // Supabase". Không bao giờ ghi token.
          dem['auth:kiem_phien'] = (dem['auth:kiem_phien'] ?? 0) + 1;
          nhatKy.push({ ham: 'auth:kiem_phien', thamSo: { ban: the.startsWith('ban-') } });
          if (nhatKy.length > 200) nhatKy.shift();
        }

        if (cua === 'user' && req.method === 'GET') {
          // Supabase bận đúng lúc kiểm phiên (nhóm 15) — mọi kịch bản, access token "ban-…" quyết định: layPhien trả
          // QUA_TAI, middleware trả trang "hệ thống đang bận".
          if (the.startsWith('ban-')) {
            ghi({ cua, phien: null, status: 429 });
            return traAuth(429, { code: 'over_request_rate_limit', message: 'Request rate limit reached' });
          }
          const k = kiemToken(the);
          ghi({ cua, phien: truyCap.get(the)?.phienId ?? null, status: k.loi ? k.loi[0] : 200 });
          return k.loi ? traAuth(...k.loi) : traAuth(200, nguoiDungAuth());
        }

        if (cua === 'logout' && req.method === 'POST') {
          const phamVi = url.searchParams.get('scope') || 'global';
          if (!['global', 'local', 'others'].includes(phamVi)) {
            ghi({ cua, pham_vi: phamVi, status: 400 });
            return traAuth(400, { code: 'validation_failed', message: `Unsupported logout scope "${phamVi}"` });
          }
          const k = kiemToken(the);
          if (k.loi) {
            ghi({ cua, pham_vi: phamVi, phien: truyCap.get(the)?.phienId ?? null, status: k.loi[0] });
            return traAuth(...k.loi);
          }
          // Phạm vi như Supabase Auth (internal/api/logout.go). Mọi phiên ở đây là của cùng một người.
          if (phamVi === 'local') thuHoi(k.a.phienId, 'logout-local');
          else for (const id of cacPhien.keys()) { if (phamVi === 'global' || id !== k.a.phienId) thuHoi(id, `logout-${phamVi}`); }
          ghi({ cua, pham_vi: phamVi, phien: k.a.phienId, status: 204 });
          res.writeHead(204, { 'X-Supabase-Api-Version': '2024-01-01' });
          return res.end();
        }

        ghi({ cua, cach: req.method, status: 404 });
        return traAuth(404, { code: 'not_found', message: `Supabase giả chưa làm ${req.method} ${url.pathname}` });
      }

      /** PostgREST giả cho bảng (đầu file): GET lọc eq / neq, chọn cột, sắp xếp; PATCH chỉ video_dao_tao. */
      function traLoiBang(ten) {
        let than = null;
        if (req.method === 'PATCH') {
          try { than = JSON.parse(duLieu || 'null'); } catch { return tra(400, loiPostgrest('PGRST102', 'Empty or invalid json')); }
        }
        const khoaDem = `${req.method} ${ten}`;
        dem[khoaDem] = (dem[khoaDem] ?? 0) + 1;
        nhatKy.push({ ham: khoaDem, thamSo: Object.fromEntries(url.searchParams), ...(than ? { than } : {}) });
        if (nhatKy.length > 200) nhatKy.shift();

        const cot = COT_BANG[ten];
        if (!cot) return tra(404, loiPostgrest('PGRST205', `Could not find the table 'public.${ten}' in the schema cache`));
        const v = vaiCua(req);
        if (v.loi) return tra(...v.loi);
        const loc = [];
        for (const [k, gt] of url.searchParams) {
          if (['select', 'order', 'limit', 'offset'].includes(k)) continue;
          const phep = /^(eq|neq)\.(.*)$/s.exec(gt);
          if (!phep) return tra(400, loiPostgrest('PGRST100', `"failed to parse filter (${gt})" (line 1, column 1)`, 'Supabase giả chỉ hiểu eq. và neq.'));
          if (!cot.includes(k)) return tra(400, loiPostgrest('42703', `column ${ten}.${k} does not exist`));
          loc.push([k, phep[1], phep[2]]);
        }
        const chon = (url.searchParams.get('select') ?? '*').split(',').map(s => s.trim()).filter(Boolean);
        const thuTu = (url.searchParams.get('order') ?? '').split(',').filter(Boolean)
          .map(s => { const [c, chieu] = s.split('.'); return [c, chieu === 'desc' ? -1 : 1]; });
        const cotLa = [...chon.filter(c => c !== '*'), ...thuTu.map(([c]) => c)].find(c => !cot.includes(c));
        if (cotLa) return tra(400, loiPostgrest('42703', `column ${ten}.${cotLa} does not exist`));

        // null không bằng, cũng không khác gì (SQL) — eq và neq đều bỏ dòng có ô null.
        const khop = dongDocDuoc(ten, v).filter(d => loc.every(([k, phep, gt]) =>
          d[k] !== null && d[k] !== undefined && (phep === 'eq') === cungGiaTri(k, d[k], gt)));
        // Như Postgres: tăng dần thì null xếp cuối, giảm dần thì null xếp đầu.
        khop.sort((a, b) => {
          for (const [c, huong] of thuTu) {
            if (a[c] === b[c]) continue;
            if (a[c] === null || a[c] === undefined) return huong;
            if (b[c] === null || b[c] === undefined) return -huong;
            return (a[c] < b[c] ? -1 : 1) * huong;
          }
          return 0;
        });
        const chieu = d => (chon.includes('*') ? { ...d } : Object.fromEntries(chon.map(c => [c, d[c] ?? null])));
        if (req.method === 'GET') return tra(200, khop.map(chieu));

        if (req.method === 'PATCH' && ten === 'video_dao_tao') {
          const cotSai = Object.keys(than ?? {}).find(c => !cot.includes(c));
          if (!than || typeof than !== 'object' || cotSai) {
            return tra(400, loiPostgrest('PGRST204', `Could not find the '${cotSai ?? '?'}' column of '${ten}' in the schema cache`));
          }
          // RLS video_dao_tao_sua: chỉ chủ và quản lý. Vai khác: 0 dòng, không lỗi — như PostgREST.
          const ns = v.vai === 'authenticated' ? nhanSuCua(v.uid) : null;
          const sua = ns && VAI_SUA_VIDEO.includes(ns.vai_tro) ? khop : [];
          for (const d of sua) Object.assign(d, than, { updated_at: thoiDiemMoi() });
          if (!/return=representation/.test(String(req.headers.prefer ?? ''))) { res.writeHead(204); return res.end(); }
          return tra(200, sua.map(chieu));
        }
        return tra(405, loiPostgrest('PGRST117', `Supabase giả chưa làm ${req.method} trên bảng ${ten}`));
      }

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

      // Trả lời tao_don_mua_thit (0113) như hàm thật: kênh đóng / gói lạ / giá lệch → 400 P0001 câu tiếng Việt;
      // cùng p_ma_gui → đơn cũ (da_co); ghi được → { ma_don, tam_tinh, da_co: false }. Hai kịch bản -dat-: từ chối
      // (CHƯA ghi) và cắt kết nối (KHÔNG CHẮC).
      function taoDonMuaThit(ts) {
        if (hienTai === 'mua-thit-dat-dut') { req.socket.destroy(); return; }
        if (!KICH_BAN_CO_MENU.has(hienTai) || hienTai === 'mua-thit-het-quay') {
          return tra(400, loiPostgrest('P0001', 'Mua thịt về qua website đang tạm đóng'));
        }
        if (hienTai === 'mua-thit-dat-loi') {
          return tra(400, loiPostgrest('P0001', 'Giá vừa đổi, vui lòng tải lại trang để xem giá mới'));
        }
        const cu = donTheoMaGui.get(ts.p_ma_gui);
        if (cu) return tra(200, { ...cu, da_co: true });
        const gia = new Map(MENU_THU.flatMap(sp => sp.goi.filter(g => !g.tamHet).map(g => [`${sp.ma}_${g.soGam}`, g.gia])));
        let tamTinh = 0;
        for (const [khoa, so] of Object.entries(ts.p_gio ?? {})) {
          const n = Number(so);
          if (!gia.has(khoa)) return tra(400, loiPostgrest('P0001', 'Có gói trong đơn không còn bán, vui lòng tải lại trang và chọn lại'));
          if (Number(ts.p_gia_da_xem?.[khoa]) !== gia.get(khoa)) {
            return tra(400, loiPostgrest('P0001', 'Giá vừa đổi, vui lòng tải lại trang để xem giá mới'));
          }
          tamTinh += n * gia.get(khoa);
        }
        if (tamTinh === 0) return tra(400, loiPostgrest('P0001', 'Đơn chưa có gói nào'));
        soDonMuaThit++;
        const don = { ma_don: maDatBan(1000 + soDonMuaThit), tam_tinh: tamTinh };
        donTheoMaGui.set(ts.p_ma_gui, don);
        return tra(200, { ...don, da_co: false });
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
  const congThat = server.address().port;   // cong: 0 → cổng hệ điều hành vừa chọn
  const goc = `http://127.0.0.1:${congThat}`;
  if (!im) console.log(`Supabase giả: ${goc} · kịch bản ${hienTai}`);

  return {
    goc,
    cong: congThat,
    datKichBan,
    kichBan: () => hienTai,
    dem: () => ({ ...dem }),
    nhatKy: () => [...nhatKy],
    troLyNhanVien,
    // /noi-bo: Supabase Auth giả và bảng (đầu file, mục "/noi-bo — ĐĂNG NHẬP THẬT").
    thuHoiPhien,
    phienAuth,
    nhatKyAuth: () => nhatKyAuth.map(d => ({ ...d })),
    bang: ten => (bang[ten] ? bang[ten].map(d => ({ ...d })) : null),
    suaBang,
    dong: () => new Promise(xong => {
      for (const h of henGio) clearTimeout(h);
      henGio.clear();
      server.closeAllConnections?.();
      server.close(() => xong());
    }),
  };
}

// --- Chạy thẳng: node kiem-tra/gia-supabase.mjs [--cong N] [--kich-ban ten] -----
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const lay = (co, macDinh) => { const i = process.argv.indexOf(co); return i > -1 ? process.argv[i + 1] : macDinh; };
  const may = await batMayGia({ cong: Number(lay('--cong', CONG_MAC_DINH)), kichBan: lay('--kich-ban', 'day-du') });
  console.log(`Kịch bản: ${KICH_BAN.join(' | ')} — đổi bằng: curl -X POST ${may.goc}/__kich-ban -d '{"ten":"rong"}'`);
  console.log(`Bật web: PUBLIC_SUPABASE_URL=${may.goc} PUBLIC_SUPABASE_ANON_KEY=khoa-thu npx astro dev --ignore-lock`);
  console.log(`Đăng nhập /noi-bo: ${NHAN_VIEN_THU.email} · mật khẩu ${NHAN_VIEN_THU.matKhau} (${NHAN_VIEN_THU.hoTen}, quản lý)`);
  console.log(`Thu hồi mọi phiên: curl -X POST ${may.goc}/__thu-hoi · xem phiên: curl ${may.goc}/__auth`);
  for (const tin of ['SIGINT', 'SIGTERM']) process.on(tin, async () => { await may.dong(); process.exit(0); });
}
