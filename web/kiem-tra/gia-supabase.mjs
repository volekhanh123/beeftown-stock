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
 *                 và đồ uống có cồn bật; thực đơn mẫu (không món nào có giá)
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
  'tuyen-dung-mo', 'tuyen-dung-dut', 'tuyen-dung-loi', 'sap-mo', 'da-mo'];

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
    hien_do_uong_co_con: true,
    ...(kichBan === 'dia-chi-cong-bo' ? { dia_chi_hien_thi: DIA_CHI_CONG_BO_THU } : {}),
    ...(kichBan === 'sap-mo' ? { ngay_khai_truong: ngaySapMoThu(), dong_trang_thai: TRANG_THAI_THU['sap-mo'] } : {}),
    ...(kichBan === 'da-mo' ? { ngay_khai_truong: NGAY_DA_MO_THU, dong_trang_thai: TRANG_THAI_THU['da-mo'] } : {}),
  };
}

// ---------------------------------------------------------------------------
// Thực đơn mẫu — tên món lấy từ seed 0011; KHÔNG món nào có giá (gia null), đúng
// như database hiện nay: chưa một mức giá nào được duyệt.
// ---------------------------------------------------------------------------
const NN = ['vi', 'en', 'ko'];
const ba = (vi, en, ko) => ({ vi, en, ko });

const NHOM = {
  'goi-them':    { loai: 'goi_them', xemTaiQuay: false, ten: ba('Gọi thêm tùy chọn', 'Add-ons', '추가 메뉴') },
  'bo-tai-quay': { loai: 'thit_bo', xemTaiQuay: true, ten: ba('Bò tại quầy', 'Beef at the Counter', '정육 코너') },
  'salad':       { loai: 'khai_vi', xemTaiQuay: false, ten: ba('Salad & khai vị', 'Salads & Starters', '샐러드 & 애피타이저') },
  'khong-con':   { loai: 'do_uong', xemTaiQuay: false, ten: ba('Không cồn', 'Non-alcoholic', '논알코올') },
  'highball':    { loai: 'do_uong', xemTaiQuay: false, ten: ba('Highball', 'Highball', '하이볼') },
};

/** Món mẫu, theo thứ tự database trả (nhom_mon.thu_tu, mon_an.thu_tu). */
export const MON_MAU = [
  { nhom: 'goi-them', ma: 'S01', ten: ba('Set sốt gọi thêm', 'Sauce set add-on', '소스 세트 추가'),
    moTa: ba('Các loại sốt dùng cùng bò, kèm một phần rau và kimchi.',
             'Dipping sauces for the beef, with greens and kimchi.',
             '고기와 함께 드시는 소스에 채소와 김치가 곁들여져요.') },
  { nhom: 'bo-tai-quay', ma: 'B01', ten: ba('Thăn lưng bò', 'Striploin', '채끝') },
  { nhom: 'salad', ma: 'F01', ten: ba('Salad Caesar', 'Caesar Salad', '시저 샐러드'),
    moTa: ba('Xà lách romaine, sốt Caesar và phô mai Parmesan.',
             'Romaine, Caesar dressing and Parmesan.',
             '로메인, 시저 드레싱, 파르메산 치즈.') },
  { nhom: 'salad', ma: 'F03', ten: ba('Bò sống trộn kiểu Hàn', 'Korean-style raw beef', '육회'),
    moTa: ba('Bò sống trộn kiểu Hàn.', 'Raw beef dressed the Korean way.', '한국식으로 무친 생소고기.'),
    laMonSong: true,
    canhBao: ba('Món dùng bò sống. Hỏi nhân viên về thành phần.',
                'This dish uses raw beef. Ask our staff about the ingredients.',
                '생소고기를 사용한 메뉴예요. 재료는 직원에게 문의해 주세요.') },
  { nhom: 'khong-con', ma: 'D09', ten: ba('Nước cam', 'Orange juice', '오렌지 주스'),
    moTa: ba('Nước cam dùng lạnh.', 'Orange juice, served cold.', '차갑게 드리는 오렌지 주스.') },
  { nhom: 'highball', ma: 'D02', ten: ba('Highball cổ điển', 'Classic Highball', '클래식 하이볼'),
    moTa: ba('Whisky, soda và chanh.', 'Whisky, soda and lemon.', '위스키, 탄산수, 레몬.'),
    coCon: true },
];

function thucDon(kichBan, nn) {
  if (kichBan === 'rong') return [];
  const n = NN.includes(nn) ? nn : 'vi';
  return MON_MAU.map(m => ({
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
    phien_ban: 'v1.0',
    cap_nhat_ngay: '2026-10-01',
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
