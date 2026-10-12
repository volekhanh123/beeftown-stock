/**
 * CÂU THÔNG BÁO CỦA PHẦN MỀM NỘI BỘ Ở TIẾNG ANH
 * ============================================
 *
 * Câu chữ CỦA TRANG (tiêu đề, nhãn, nút) nằm ngay trong trang, dạng { vi, en }
 * (lib/ngon-ngu-noi-bo.ts). Còn câu THÔNG BÁO đến từ hai nơi trang không viết:
 *
 *   · thư viện trong web/src/lib — "Chưa điền tên tin.", "Email hoặc mật khẩu
 *     không đúng."… trả về dưới dạng chuỗi tiếng Việt;
 *   · database — trigger và hàm plpgsql `raise exception '…'` bằng tiếng Việt,
 *     đi lên trang qua error.message.
 *
 * Đổi chữ ký của vài chục hàm thư viện để nhận thêm ngôn ngữ thì rộng và dễ
 * sót; còn câu của database thì không có cách nào khác ngoài tra bảng. Nên
 * mọi câu thông báo đi qua dichCau() ngay chỗ trang hiện nó: tra ĐÚNG câu
 * tiếng Việt, rồi tới các mẫu có số/tên ở giữa.
 *
 * Câu chưa có bản tiếng Anh thì hiện nguyên tiếng Việt — người đọc vẫn thấy có
 * lỗi và vẫn chụp gửi được cho quản lý, thay vì một thông báo trống.
 */

import type { NgonNguNB, HaiThuTieng } from './ngon-ngu-noi-bo';
// Câu của phần kho (database kho, lỗi chung của kho) — bảng riêng, cùng cách tra.
import { CAU_KHO_EN, MAU_KHO_EN } from './kho/cau-kho-en.ts';
// Câu của phần gửi tin Zalo (0047) — bảng riêng, cùng cách tra.
import { CAU_ZALO_EN, MAU_ZALO_EN } from './zalo-cau-en.ts';
// Câu của bot Messenger (0053) — bảng riêng, cùng cách tra.
import { CAU_MESSENGER_EN, MAU_MESSENGER_EN } from './messenger-cau-en.ts';
// Đăng nhập khi Supabase bận / mất mạng — cặp { vi, en } nằm ở lib/qua-tai.ts.
import { CAU_DANG_NHAP_TAM } from './qua-tai.ts';

/** Câu cố định: đúng từng chữ, kể cả dấu chấm cuối. */
export const CAU_EN: Readonly<Record<string, string>> = {
  // lib/phien.ts — đăng nhập
  'Chưa nối database. Xem hướng dẫn trong web/README.md.':
    'No database connected. See web/README.md.',
  'Email hoặc mật khẩu không đúng.':
    'Wrong email or password.',
  'Tài khoản này chưa được nối với nhân sự nào. Liên hệ chủ nhà hàng.':
    'This account is not linked to any staff member yet. Please contact the owner.',
  // lib/phien.ts — đăng nhập khi Supabase bận / mất mạng (một nguồn: lib/qua-tai.ts)
  ...Object.fromEntries(Object.values(CAU_DANG_NHAP_TAM).map(c => [c.vi, c.en])),

  // lib/cong-tac.ts — câu chung khi database từ chối
  'Tài khoản của bạn không có quyền làm việc này.':
    'Your account is not allowed to do this.',
  'Không ghi được. Thông tin CHƯA được lưu.':
    'Could not save. Nothing has been saved.',

  // v_mon_con_vuong.vuong_gi (0011) — vì sao một món chưa công bố được
  'Chưa có mô tả': 'No description yet',
  'Món sống nhưng chưa có cảnh báo': 'Raw dish without a warning',
  'Giá chưa được duyệt': 'Price not approved',
  'Mức cay chưa được duyệt': 'Spice level not approved',
  'Sẵn sàng công bố': 'Ready to publish',

  // lib/may-dich.ts — lý do máy dịch hỏng, lưu trong sổ bản dịch (ly_do) rồi
  // hiện lại ở màn soạn. Câu có mã lỗi/biến nằm ở MAU_EN bên dưới.
  'Chưa có khóa GEMINI_API_KEY trong secret của Worker — xem web/README.md, mục "Bản dịch tự động".':
    'There is no GEMINI_API_KEY in the Worker secrets — see the automatic translation section of web/README.md.',
  'Gemini trả lời quá lâu. Sẽ tự thử lại sau.': 'Gemini took too long to answer. It will retry automatically.',
  'Gemini trả về dữ liệu không đọc được.': 'Gemini returned unreadable data.',
  'Gemini không trả về bản dịch nào.': 'Gemini returned no translation.',
  'Gemini trả về JSON hỏng.': 'Gemini returned broken JSON.',
  'Gemini trả về sai khuôn.': 'Gemini returned the wrong format.',
  'Máy dịch bỏ sót câu này.': 'The machine translation skipped this sentence.',
  'Máy dịch trả về chuỗi rỗng.': 'The machine translation returned an empty string.',

  // lib/chuoi-cam.js — vì sao một bản dịch bị chặn (vi_sao)
  'Ảnh kho. Mọi ảnh phải là ảnh thật, khai nguồn trong bảng tep_anh.':
    'Stock photo. Every photo must be real, with its source declared in the tep_anh table.',
  'Hotline mẫu của bản nháp cũ. Số thật vào khóa hotline trong cổng nội dung.':
    'Sample hotline from the old draft. The real number goes in the hotline key of the content switches.',
  'Chỗ trống chưa điền lọt ra trang. Chưa có địa chỉ thì ẨN, không hiện ngoặc vuông.':
    'An unfilled placeholder would reach the site. With no address yet, HIDE it — never show square brackets.',
  'Grade và giống bò chưa được xác nhận. Tài liệu thương hiệu cấm tự thêm.':
    'Beef grade and breed are not confirmed. The brand guide forbids adding them.',
  'Giá của một chiến dịch chưa duyệt. Không giá nào trong CSV nguồn được duyệt.':
    'Price from an unapproved campaign. No price in the source CSV is approved.',
  'Số ngày ủ là một claim cụ thể chưa ai xác nhận.':
    'The number of ageing days is a specific claim nobody has confirmed.',
  'Nhà hàng nướng bằng vỉ gas, không phải than.':
    'The restaurant grills on gas, not charcoal.',
  'Tiện ích chưa xác nhận. Hứa trên web rồi khách tới không có là lỗi nặng nhất.':
    'Unconfirmed amenity. Promising it on the web and guests finding nothing is the worst mistake.',
  'Tài liệu thương hiệu cấm lấy lợi thế giá làm hook.':
    'The brand guide forbids using price advantage as a hook.',
  'Claim so sánh nhất, không chứng minh được và vi phạm quảng cáo.':
    'A superlative claim: it cannot be proven and breaks advertising rules.',
  'Yêu cầu đặt bàn KHÁC với bàn đã giữ. Chỉ nói "đã nhận yêu cầu".':
    'A booking request is NOT a held table. Only say "request received".',
  'Hook khan hiếm. Số bàn trống bị chặn ở tầng server, không được tới trình duyệt.':
    'Scarcity hook. The number of free tables is blocked on the server and must never reach the browser.',
  'Giá tiền. Chưa món nào có gia_da_duyet = true.':
    'A price. No dish has gia_da_duyet = true yet.',

  // Database — raise exception của các migration phần CRM (0002–0016,
  // 0025–0028, 0036). Câu có % ở MAU_EN.
  'Sổ cái điểm là bất biến. Muốn sửa sai, ghi thêm một dòng loai=dieu_chinh.':
    'The points ledger is immutable. To correct a mistake, add a row with loai=dieu_chinh.',
  'Tổng hóa đơn không được âm': 'The bill total cannot be negative',
  'Chi nhánh chưa có cấu hình tích điểm': 'This branch has no loyalty-points setup',
  'Chương trình tích điểm chưa được bật cho chi nhánh này': 'The loyalty programme is not switched on for this branch',
  'Không thể đặt bàn cho ngày trong quá khứ': 'Cannot book a table for a past date',
  'Không tìm thấy khách hàng': 'Customer not found',
  'Dòng mới phải bắt đầu ở trạng thái nhap': 'A new row must start in the nhap (draft) status',
  'Không sửa được giá trị đã công bố. Hãy thu hồi rồi thêm dòng mới.':
    'A published value cannot be edited. Take it down, then add a new row.',
  'Không có quyền công bố nội dung': 'You are not allowed to publish content',
  'Form đặt bàn đang tạm đóng': 'The booking form is temporarily closed',
  'Nhật ký hồ sơ là bất biến. Muốn ghi chú thêm, tạo dòng mới.':
    'The application log is immutable. To add a note, create a new row.',
  'Cổng tuyển dụng đang tạm đóng': 'The careers section is temporarily closed',
  'Bạn đã thử tải lên quá nhiều lần, vui lòng chờ ít phút': 'Too many upload attempts, please wait a few minutes',
  'Không gửi được hồ sơ, vui lòng thử lại': 'Could not send the application, please try again',
  'Bạn đã nộp quá nhiều hồ sơ, vui lòng liên hệ trực tiếp với nhà hàng':
    'Too many applications sent, please contact the restaurant directly',
  'Vị trí này đã hết hạn nhận hồ sơ': 'This position is no longer accepting applications',
  'Chưa đồng ý cho Beeftown xử lý thông tin ứng tuyển': 'Consent for Beeftown to process the application data was not given',
  'Vui lòng điền họ tên': 'Please enter a full name',
  'Phiếu tải CV đã hết hạn, vui lòng chọn lại file': 'The CV upload ticket expired, please choose the file again',
  'Không sinh được mã hồ sơ, vui lòng thử lại': 'Could not generate an application code, please try again',
  'Không có quyền xem thống kê tuyển dụng': 'You are not allowed to view hiring statistics',
  'Chỉ chủ sở hữu mới chạy được việc dọn hồ sơ hết hạn': 'Only the owner can run the expired-application clean-up',
  'Chỉ chủ sở hữu hoặc quản lý mới khởi tạo được tin tuyển dụng mẫu': 'Only the owner or a manager can create the sample job postings',
  'Không sinh được mã đặt bàn, vui lòng thử lại': 'Could not generate a booking code, please try again',
  'Tra cứu bị tạm khoá, vui lòng gọi nhà hàng': 'Lookup is temporarily locked, please call the restaurant',
  // 0079 — giới hạn tần suất của các hàm công khai
  'Số điện thoại này đã có nhiều yêu cầu đặt bàn đang chờ nhà hàng xác nhận, vui lòng gọi nhà hàng':
    'This phone number already has several table requests waiting for confirmation, please call the restaurant',
  'Mạng bạn đang dùng đã gửi quá nhiều yêu cầu đặt bàn, vui lòng thử lại sau hoặc gọi nhà hàng':
    'Too many table requests from your network, please try again later or call the restaurant',
  'Hệ thống đang nhận quá nhiều yêu cầu, vui lòng thử lại sau hoặc liên hệ trực tiếp với nhà hàng':
    'The system is receiving too many requests, please try again later or contact the restaurant directly',
  'Vé tải CV này đã có một file': 'This CV upload ticket already has a file',
  'Đặt bàn này không huỷ được nữa, vui lòng gọi nhà hàng': 'This booking can no longer be cancelled, please call the restaurant',
  'Không có quyền xem phiếu đo': 'You are not allowed to view analytics records',
  'Chỉ chủ sở hữu mới dọn được dữ liệu đo lường': 'Only the owner can clean up analytics data',
  // 0065
  'Chỉ chủ sở hữu hoặc quản lý mới dọn được vé tải CV': 'Only the owner or a manager can clean up CV upload tickets',
  // 0074 — trigger ho_so_khoa_cot_don_dep
  'Đường dẫn CV, hạn lưu và trạng thái ẩn danh của hồ sơ chỉ đổi được qua việc dọn dữ liệu ở màn Cài đặt':
    'An application\'s CV path, retention date and anonymised flag can only change through the data clean-up on the Settings screen',
  'Không có quyền gỡ nội dung khỏi trang': 'You are not allowed to remove content from the site',
  'Chỉ chủ nhà hàng hoặc quản lý mới duyệt được mức lương': 'Only the owner or a manager can approve salaries',
  'p_muc phải là một mảng': 'p_muc must be an array',
  'Ngôn ngữ dịch phải là en hoặc ko': 'The translation language must be en or ko',
  'Thiếu bam của câu gốc': 'The source sentence hash (bam) is missing',

  // 0045 — ba hàm definer của CRM tự kiểm vai
  'Chỉ chủ sở hữu, quản lý hoặc thu ngân của chi nhánh này mới ghi được lượt ghé và điểm tích lũy':
    'Only the owner, a manager or a cashier of this branch can record visits and loyalty points',
  'Không ghi được lượt ghé dưới tên một nhân sự khác': 'A visit cannot be recorded under another staff member’s name',
  'Chỉ chủ sở hữu, quản lý hoặc thu ngân mới tra cứu hay tạo được hồ sơ khách':
    'Only the owner, a manager or a cashier can look up or create customer records',
  'Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này mới xếp được tin gửi khách':
    'Only the owner, a manager or marketing staff of this branch can queue messages to customers',
  // 0055 — bảng sức khỏe hệ thống
  'Chỉ chủ sở hữu hoặc quản lý mới xem được sức khỏe hệ thống':
    'Only the owner or a manager can view the system health panel',
  // 0060 — việc chạy nền báo động (chỉ tài khoản máy gọi, câu hiện ở log và đèn Báo động)
  'Chỉ tài khoản máy báo động mới gọi được hàm này': 'Only the alert machine account can call this function',
  'Lượt báo động này đã kết thúc hoặc quá hạn': 'This alert run has already ended or expired',
  'Danh sách đèn không hợp lệ': 'The list of health lights is invalid',
  'Tên kênh báo động không hợp lệ': 'The alert channel name is invalid',

  // 0069 — hàm CRM giới hạn đúng chi nhánh; đặt bàn chỉ đổi theo đúng bước (trigger dat_ban_kiem_sua)
  'Chỉ tạo được hồ sơ khách mới cho chi nhánh của bạn': 'You can only create new guest records for your own branch',
  'Chỉ xem được phiếu đo của chi nhánh của bạn': 'You can only view the launch scorecard of your own branch',
  'Chỉ khởi tạo được tin mẫu cho chi nhánh của bạn': 'You can only create sample job postings for your own branch',
  'Khách này chưa từng ghé hay đặt bàn ở chi nhánh này': 'This guest has never visited or booked at this branch',
  'Chiến dịch không thuộc chi nhánh này': 'This campaign does not belong to this branch',
  'Bước chuyển trạng thái đặt bàn không hợp lệ': 'That booking status change is not allowed',
  'Không sửa được khách, chi nhánh, mã đặt bàn, đồng ý nhận tin hay nguồn của một đặt bàn':
    'The guest, branch, booking code, marketing consent and source of a booking cannot be changed',
  'Đặt bàn đã kết thúc — không đổi được ngày, giờ, số khách hay bàn':
    'This booking has ended — its date, time, party size and table cannot be changed',
  'Bàn này không thuộc chi nhánh của đặt bàn': 'This table does not belong to the branch of the booking',
  'Lượt ghé phải của đúng khách và đúng chi nhánh của đặt bàn':
    'The visit must belong to the same guest and branch as the booking',
  'Người xử lý phải là chính người đang đăng nhập': 'The handler must be the person who is signed in',
  'Đặt bàn mới chỉ ở trạng thái chờ gọi hoặc đã xác nhận': 'A new booking can only be waiting for a call or already confirmed',
  'Mẫu tin khác mẫu của chiến dịch': 'The message template differs from the campaign template',
};

/**
 * Mô tả của từng khóa công bố (khoa_cong_bo.mo_ta, 0010/0015) ở tiếng Anh, tra
 * theo KHÓA chứ không theo câu tiếng Việt: câu mô tả có thể được sửa trong
 * database, còn khóa thì không bao giờ đổi. Khóa mới chưa có ở đây thì hiện
 * mô tả tiếng Việt.
 */
export const MO_TA_KHOA_EN: Readonly<Record<string, string>> = {
  dong_trang_thai:      'One sentence saying which stage the restaurant is at. Change it regularly — a sentence left for three months makes the site look abandoned.',
  form_dat_ban_dang_mo: 'Turn on the booking form. ONLY turn it on once someone is answering AND the real tables are entered in ban_an.',
  gio_phuc_vu_da_chot:  'Opening hours are confirmed. Off means the website shows no hours, even though the chi_nhanh table has default values.',
  dia_chi_hien_thi:     'The full address as guests read it. Publish only after checking it against the lease.',
  email_lien_he:        'A mailbox someone reads. Used as the fallback while there is no hotline.',
  facebook_url:         'Official Facebook page. This is the main button of the launch page — it must be a page that already has a cover photo and posts.',
  google_maps_url:      'Google Maps directions link. Test it on a real phone before publishing.',
  hotline:              'Restaurant phone number. Publish only when a real person answers during the published hours.',
  instagram_url:        'Official Instagram page.',
  tiktok_url:           'Official TikTok channel.',
  zalo_oa_url:          'Official Zalo OA.',
  ngay_khai_truong:     'Official opening date. Do NOT publish until it is confirmed in writing — changing the date after it is out is the biggest risk of the whole project.',
  ngay_treo_bang_ron:   'Date the construction banner goes up. Used to schedule when the address block goes live.',
  anh_chia_se:          'Image shown when the link is shared. Without it, a link pasted into Zalo shows only a bare line of blue text.',
  mo_ta_og:             'A one-line description shown when the link is shared.',
  tieu_de_og:           'Title shown when the link is pasted into Zalo or Facebook.',
  hien_ba_buoc:         'Show the three-step "how to order" block.',
  hien_danh_gia:        'Show guest reviews. Turn on only with REAL reviews you are allowed to use — the old draft site has four made-up reviews.',
  hien_do_uong_co_con:  'Show alcoholic drinks. Alcohol advertising law has its own limits — off is the safe default.',
  hien_quay_thit:       'Show the block about the work behind the beef counter.',
  hien_thuc_don:        'Show the menu block.',
  hien_tiec_nhom:       'Show the group and company dining block.',
  hien_tuyen_dung:      'Show the careers section.',
};

/** Tên khung ảnh bắt buộc (v_anh_con_thieu, 0009) ở tiếng Anh, tra theo mã khung. */
export const TEN_KHUNG_ANH_EN: Readonly<Record<string, string>> = {
  'bang-gia':      'Price board at the counter',
  'banner-b0':     'Construction banner',
  'doi-ngu':       'The team',
  'khay-thit':     'Close-up of tray and label',
  'khong-gian':    'Dining room',
  'mat-tien-ngay': 'Storefront by day',
  'mat-tien-toi':  'Storefront at night',
  'mon-tieu-bieu': 'Signature dish',
  'og-chia-se':    'Link-sharing image',
  'quay-thit':     'Beef selection counter',
  'so-nha':        'Street number 40–42',
  'vi-nuong':      'Grill in use',
};

/**
 * Trang không có ở khu nội bộ (pages/404.astro, nhánh đã đăng nhập), đọc qua dichNB().
 *
 * Câu của trang thường nằm ngay trong trang. Trang này là ngoại lệ: 404.astro nằm ở gốc
 * pages/ và cũng là trang 404 công khai, nên test-cong-khai-cau-chu.mjs quét nó như trang
 * công khai và đòi mọi { vi, en } trong file có thêm ko — mà phần mềm nội bộ không có
 * tiếng Hàn.
 */
export const CAU_TRANG_KHONG_CO = {
  // Cùng giọng với bản công khai (khongCo… trong lib/chu.ts): chỉ nói điều chắc chắn đúng.
  tieuDe: { vi: 'Không có trang này', en: 'This page does not exist' },
  giaiThich: {
    vi: 'Đường dẫn bạn mở không dẫn tới màn nào của phần mềm nội bộ. Có thể địa chỉ bị gõ sai, hoặc link đã cũ.',
    en: 'The link you opened does not lead to any screen of the internal software. The address may be mistyped, or the link may be out of date.',
  },
  veTrangChinh: { vi: 'Về trang chính nội bộ', en: 'Back to the internal home page' },
} as const satisfies Record<string, HaiThuTieng>;

export function moTaKhoa(nn: NgonNguNB, khoa: string, moTaVi: string): string {
  return nn === 'en' ? (MO_TA_KHOA_EN[khoa] ?? moTaVi) : moTaVi;
}

export function tenKhungAnh(nn: NgonNguNB, ma: string, tenVi: string): string {
  return nn === 'en' ? (TEN_KHUNG_ANH_EN[ma] ?? tenVi) : tenVi;
}

/** Câu có phần thay đổi (số, tên…): mẫu và cách dựng lại câu tiếng Anh. */
export const MAU_EN: ReadonlyArray<readonly [RegExp, (m: RegExpMatchArray) => string]> = [
  // lib/may-dich.ts
  [/^Không gọi được Gemini: ([\s\S]+)$/, m => `Could not reach Gemini: ${m[1]}`],
  [/^Gemini từ chối dịch \((.+)\)\.$/, m => `Gemini refused to translate (${m[1]}).`],
  [/^Gemini dừng giữa chừng \((.+)\)\.$/, m => `Gemini stopped midway (${m[1]}).`],
  [/^Không có mẫu máy "(.+?)" \(404\) — kiểm tra biến GEMINI_MODEL([\s\S]*)$/,
    m => `Model "${m[1]}" does not exist (404) — check the GEMINI_MODEL variable${m[2]}`],
  [/^Gemini báo hết hạn mức \(429\)\. Sẽ tự thử lại sau([\s\S]*)$/,
    m => `Gemini quota exceeded (429). It will retry automatically${m[1]}`],
  [/^Khóa Gemini bị từ chối \((\d+)\)([\s\S]*)$/, m => `The Gemini key was rejected (${m[1]})${m[2]}`],
  [/^Gemini đang lỗi \((\d+)\)\. Sẽ tự thử lại sau\.$/, m => `Gemini is failing (${m[1]}). It will retry automatically.`],
  [/^Gemini từ chối yêu cầu \((\d+)\)([\s\S]*)$/, m => `Gemini rejected the request (${m[1]})${m[2]}`],
  [/^Dính chữ cấm "(.+?)": ([\s\S]+)$/, m => `Contains the forbidden text "${m[1]}": ${CAU_EN[m[2].trim()] ?? m[2]}`],

  // Database — raise exception có % (Postgres thay % bằng giá trị)
  [/^Số điện thoại không hợp lệ: (.+)$/, m => `Invalid phone number: ${m[1]}`],
  [/^Không đủ điểm: số dư (.+?) , yêu cầu trừ (.+)$/, m => `Not enough points: balance ${m[1]}, requested ${m[2]}`],
  [/^Chưa đủ ngưỡng dùng điểm: cần tối thiểu (.+?)đ, hiện có (.+?)đ$/, m => `Points threshold not reached: need at least ${m[1]} VND, have ${m[2]} VND`],
  [/^Không đủ điểm: số dư (.+?)đ, muốn dùng (.+?)đ$/, m => `Not enough points: balance ${m[1]} VND, want to use ${m[2]} VND`],
  [/^Không thể trừ (.+?)đ điểm cho hóa đơn (.+?)đ$/, m => `Cannot deduct ${m[1]} VND of points from a ${m[2]} VND bill`],
  [/^Không tìm thấy chi nhánh (.+)$/, m => `Branch ${m[1]} not found`],
  [/^Khung giờ (.+?) ngày (.+?) đã hết bàn$/, m => `The ${m[1]} slot on ${m[2]} is fully booked`],
  [/^Không tìm thấy mẫu tin (.+)$/, m => `Message template ${m[1]} not found`],
  [/^Mẫu tin (.+?) chưa được Zalo duyệt$/, m => `Message template ${m[1]} is not approved by Zalo yet`],
  [/^Không được phép gửi: (.+)$/, m => `Sending not allowed: ${m[1]}`],
  [/^Khung giờ (.+?) hôm nay đã qua$/, m => `The ${m[1]} slot today has already passed`],
  [/^Ảnh cho khung (.+?) cần rộng tối thiểu (\d+)px$/, m => `The photo for slot ${m[1]} must be at least ${m[2]}px wide`],
  [/^Ảnh cho khung (.+?) cần cao tối thiểu (\d+)px$/, m => `The photo for slot ${m[1]} must be at least ${m[2]}px tall`],
  [/^Không chuyển được trạng thái từ (.+?) sang (.+)$/, m => `Cannot change the status from ${m[1]} to ${m[2]}`],
  [/^Khóa (.+?) chỉ chủ sở hữu mới được công bố$/, m => `Only the owner can publish the key ${m[1]}`],
  [/^Nhóm (.+?) không niêm yết giá trên web — bò xem giá tại quầy$/, m => `Group ${m[1]} has no prices on the web — beef prices are shown at the counter`],
  [/^Không chuyển được hồ sơ từ (.+?) sang (.+)$/, m => `Cannot move the application from ${m[1]} to ${m[2]}`],
  [/^Không tìm thấy vị trí tuyển dụng (.+)$/, m => `Job position ${m[1]} not found`],
  [/^Không có khóa công bố tên (.+)$/, m => `There is no publishing key named ${m[1]}`],
  [/^Khóa (.+?) chỉ chủ sở hữu mới được gỡ khỏi trang$/, m => `Only the owner can remove the key ${m[1]} from the site`],
  [/^Bảng (.+?) không nhận bản dịch qua hàm này$/, m => `Table ${m[1]} does not accept translations through this function`],
  [/^Ô (.+?) không nằm trong danh sách dịch của bảng (.+)$/, m => `Field ${m[1]} is not in the translation list of table ${m[2]}`],
  [/^Trạng thái bản dịch không hợp lệ: (.+)$/, m => `Invalid translation status: ${m[1]}`],
];

export function dichCau(nn: NgonNguNB, cau: string | null | undefined): string {
  if (!cau) return '';
  if (nn === 'vi') return cau;
  const gon = cau.trim();
  const coDinh = CAU_EN[gon] ?? CAU_KHO_EN[gon] ?? CAU_ZALO_EN[gon] ?? CAU_MESSENGER_EN[gon];
  if (coDinh) return coDinh;
  for (const [mau, dung] of [...MAU_EN, ...MAU_KHO_EN, ...MAU_ZALO_EN, ...MAU_MESSENGER_EN]) {
    const m = gon.match(mau);
    if (m) return dung(m);
  }
  return cau;
}
