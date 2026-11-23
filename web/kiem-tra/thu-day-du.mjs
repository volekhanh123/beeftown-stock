/**
 * KIỂM THỬ TRANG CÔNG KHAI KHI ĐÃ NỐI DATABASE — trạng thái "đầy đủ"
 * ==================================================================
 *
 *     npm run thu-day-du                 ← bật Supabase giả + astro dev, chạy thử
 *     npm run thu-day-du -- --chup       ← chụp thêm toàn trang mọi route × 5 cỡ × (rong, day-du)
 *                                          vào kiem-tra/anh-chup/<kịch bản>/ (không commit)
 *     npm run thu-day-du -- --chi 2,3    ← chỉ chạy nhóm 2 và 3 (sửa nhanh một chỗ — nhóm 0 luôn chạy, CI chạy
 *                                          hết; gõ sai số nhóm thì đỏ: kiem-tra/chon-nhom.mjs)
 *
 * trinh-duyet.mjs chạy KHÔNG có database — trạng thái CI giữ đúng nhất. Nhưng phần
 * lớn chỗ hỏng thật nằm ở trạng thái còn lại: Facebook / Maps đã công bố, thực đơn
 * đã công bố, form hỏi bàn đang mở, database báo lỗi, mạng đứt giữa chừng. File này
 * dựng đủ các trạng thái đó bằng kiem-tra/gia-supabase.mjs (PostgREST giả, cổng
 * 54331) và astro dev (cổng 4353) với PUBLIC_SUPABASE_URL trỏ vào server giả.
 *
 * Bất biến:
 *   1. day-du: nút chính màn đầu là "Hỏi bàn" và dẫn tới /dat-ban đúng thứ tiếng; có
 *      link Facebook đã công bố, có nút Chỉ đường; thực đơn hiện món mẫu, nhãn Món
 *      sống kèm câu cảnh báo, nhãn Có cồn, KHÔNG một số tiền nào; /dat-ban có form và
 *      khung giờ, meta description / og:description là câu "gửi yêu cầu, nhà hàng gọi
 *      lại" (chu.ts moTaHoiBan) và đoạn mở đầu nói nhà hàng gọi lại.
 *   2. Bấm đúp "Gửi yêu cầu" → tao_dat_ban được gọi ĐÚNG MỘT lần; trang sau nói "đã
 *      nhận", không bao giờ "thành công".
 *   3. Database trả 500 hoặc mạng đứt giữa chừng → KHÔNG BAO GIỜ "đã nhận"; có khung
 *      lỗi; họ tên và số điện thoại khách đã gõ được điền lại. Database từ chối (hết
 *      bàn) → câu của database hiện ra, đúng thứ tiếng.
 *   4. rong (nối database, chưa công bố gì): không nút Facebook, không Chỉ đường; nút
 *      chính màn đầu là "Khám phá thực đơn". dat-ban-dong (form tắt): /dat-ban không có
 *      form; meta description / og:description là câu "chưa mở" (chu.ts moTaHoiBanChuaMo),
 *      cả mô tả lẫn đoạn mở đầu không hứa "gửi yêu cầu, nhà hàng gọi lại" (kiểm site thật
 *      07/10/2026). dat-ban-sap (database sập giữa lượt gửi, trang sau không dựng được form):
 *      khung "KHÔNG CHẮC đã ghi" hiện, và cả trang không nói "bạn chưa gửi được" hay "chưa mở hỏi
 *      bàn trực tuyến" — câu đó cãi khung lỗi, khách tin là chưa gửi và gửi lại thành hai bản.
 *   5. Mọi trang công khai × (rong, day-du, dat-ban-dong) ở 360 và 1440 px: HTTP 200,
 *      không tràn ngang, không lỗi JavaScript; thành phần và khung trang đúng quy tắc
 *      của đợt redesign (phép đo ở do-giao-dien.mjs — cùng bộ với trinh-duyet.mjs, nhưng
 *      ở đây trang có form, nút Chỉ đường, kênh liên hệ).
 *   7. dia-chi-cong-bo (khóa dia_chi_hien_thi đã công bố trong /noi-bo): bản công bố thay
 *      địa chỉ cố định trong mã ở MỌI chỗ in địa chỉ nhà hàng — khối địa chỉ, chân trang,
 *      câu hỏi thường gặp, bước 1 của trang Đến Beeftown, menu gọn, JSON-LD; màn đầu trang
 *      chủ in bản đó và bỏ vế phường; dòng pháp nhân không đổi. Về lại kịch bản chưa công
 *      bố địa chỉ thì trang in lại địa chỉ cố định.
 *   8. Form hỏi bàn (day-du) và form nộp hồ sơ (tuyen-dung-mo) ở 390 và 1440 px: ô một
 *      dòng (kể cả ô ngày) cao đúng 48px, ô nhiều dòng ≥ 48px, chữ 16px, nền trắng, viền
 *      #767676; nhãn 14–16px đặt trên ô, không placeholder; thẻ form nền xám nhạt #F4F4F4;
 *      ô giờ đang chọn nền đỏ chữ trắng; gửi thiếu thì có câu lỗi bằng chữ màu #8F0000 và
 *      tiêu điểm vào ô sai.
 *   9. Form nộp hồ sơ (tuyen-dung-mo / -dut / -loi): bấm đúp khi database chậm → nop_ho_so_ung_tuyen
 *      đúng một lần, nút khóa "Đang gửi…"; mạng đứt → khung "KHÔNG CHẮC", không form, không nút mời
 *      nộp; database từ chối → câu của database, quay về ?vi_tri=<mã>, chữ đã gõ được điền lại, ô đồng
 *      ý không tích sẵn; file CV quá 5MB → câu lỗi sát ô, không gửi.
 *  10. Màn đầu trang chủ ở ba trạng thái của khóa ngay_khai_truong — chưa có ngày (day-du), sắp
 *       mở (sap-mo: "Đón bạn từ …"), đã mở (da-mo: "Mở cửa từ …"), hai trạng thái sau kèm dòng
 *       trạng thái dài hai câu — × vi/en/ko × 390, 900, 1024, 1440 px: câu chỉ đường dính ngay
 *       dưới dòng địa chỉ, ngày nằm trên một dòng, không ô nào tràn khung, không cuộn ngang.
 *  11. Trang Thực đơn theo cuốn menu bản sáng (day-du = danh mục 11/10/2026 đã công bố) ở 320 → 1440 px
 *       (vi; en, ko ở 390 và 1440): bấm từng tab, mọi món của dữ liệu giả hiện đúng tên ở đúng phần;
 *       món có ảnh (ANH_CUA_MON) thì ảnh có alt đúng thứ tiếng và nhãn "Ảnh minh họa"; món sống kèm câu
 *       cảnh báo; câu dưới tên nhóm đúng chữ; không số tiền, không phần tử giá; không cuộn ngang; đủ mười
 *       bốn phép đo của do-giao-dien.mjs trên từng tab. khong-con-tat (công tắc đồ uống có cồn tắt): ba ly
 *       signature, nhãn Có cồn, dòng luật rượu đều không hiện. thuc-don-thu-suc: món không ảnh, tên và mô tả
 *       rất dài, nhóm lạ chưa có câu, nhóm đồ uống dạng danh sách — không tràn, vẫn đạt mọi phép đo.
 *       day-du chỉ có ba ly signature (có cồn) ở phần Đồ uống: tên ba nhóm không cồn phải đứng đầu cột
 *       thực đơn, cạnh ảnh ba ly không cồn; có món không cồn thì không có danh sách đó.
 *  12. Trang Mua thịt về — khách đặt thẳng trên website, chỉ giao tận nơi (0113; kịch bản mua-thit-* của
 *       gia-supabase.mjs, menu thử MENU_THU — giá THỬ). Mở (vi/en/ko × 390, 1440 px): đủ gói đúng nhóm, đúng giá trong
 *       [data-tien], ô giao hàng có nhãn, nút Đặt hàng; không Zalo, không "nhận tại quầy"; điều hướng năm mục; không
 *       tràn ngang. Thẻ gọn kiểu El Gaucho: tên, giá "Từ", nút "Chọn gói" mở hộp chọn (popover: con trỏ vào ô chọn
 *       đầu, nằm trọn trong màn, Esc đóng, chạy cả khi tắt JavaScript). Chọn gói (nút + và ô chọn trong hộp), "Đã
 *       chọn" trên thẻ, "Đơn của bạn" đúng từng dòng của lib, điền ô, Đặt hàng → tao_don_mua_thit
 *       nhận đúng giỏ, giá đã thấy, họ tên…; trang "đã nhận" có mã, không form; địa chỉ trang không mang dữ liệu khách.
 *       Bấm đúp (database chậm) → một lần gọi. Giỏ rỗng → không gọi. Tắt JavaScript → vẫn đặt được. Database từ chối
 *       (mua-thit-dat-loi) → câu lỗi đúng thứ tiếng, giỏ và ô liên hệ điền lại. Mất mạng (mua-thit-dat-dut) → "không
 *       chắc", không form. Thanh giỏ dính đáy khi có gói. mua-thit-het-quay, -loi / -dut / -treo (trả lời trong 6 giây),
 *       chưa mở (rong, day-du, mua-thit-rong, -lech): không form, không giá. mua-thit-khong-zalo: vẫn mở (0113).
 *       Hóa đơn đỏ (0125, vi/en/ko): bốn ô ẩn tới khi chọn "Cần xuất hóa đơn đỏ" (CSS — cả khi tắt JavaScript), hàng ô
 *       đánh dấu cao ≥ 48px; chọn mà để trống → ba câu lỗi sát ô, không gọi database; đủ → p_hoa_don đã chuẩn hóa; gõ
 *       dở rồi bỏ chọn → không p_hoa_don; database từ chối → ô được chọn lại, chữ đã gõ điền lại, địa chỉ trang sạch.
 *       Kiểm cả chính phép đo giao diện: nút vừa hết di chuột mà còn đang chuyển màu (kéo dài 1,5 giây cho chắc) thì
 *       phép đo chờ xong rồi mới đo (do-giao-dien.mjs: choDungYen); nền nút đứng yên ở màu ngoài bảng vẫn bị báo.
 *  13. Meta Pixel (src/lib/meta-pixel.ts; Meta bị chặn ở mọi context — chan-meta.mjs). Hỏi bàn: Lead đúng một lần,
 *       chỉ sau khi database trả mã (cả khi bấm đúp), chỉ kèm content_name và language — không họ tên, số điện thoại,
 *       mã; tải lại thẻ "đã nhận" không thành Lead thứ hai; database 500, mạng đứt, database từ chối → không Lead;
 *       địa chỉ trang sau khi gửi không mang họ tên hay số điện thoại. Bấm số điện thoại, link Zalo đã công bố →
 *       Contact. Back về thẻ "đã nhận" lấy từ bộ nhớ đệm → không Lead thứ hai. Mua thịt về: Đặt hàng có giỏ → đúng một
 *       InitiateCheckout trước khi chuyển trang, giỏ rỗng thì không; không lời gọi nào mang dữ liệu khách hay mã đơn.
 *  14. Trang đăng nhập nội bộ, đăng nhập KHÔNG thành thật (Supabase Auth giả của gia-supabase.mjs: sai mật khẩu, quá
 *       hạn mức, cắt kết nối; vi và en): lượt POST trả 303, trang báo lỗi là lượt GET không vào bộ đệm, câu lỗi đúng
 *       từng chữ (câu bận nói rõ không phải do sai mật khẩu), email điền lại, ô mật khẩu trống; F5, Quay lại + F5, Tiến
 *       + F5 không gửi lượt POST nào và Supabase không nhận thêm lượt đăng nhập nào; F5 trên trang lỗi là form trống.
 *  15. "Hệ thống đang bận" ĐÚNG LÚC GỬI FORM (Supabase Auth giả trả 429 cho lượt kiểm phiên — gia-supabase.mjs,
 *       traLoiAuth; vi và en): gửi refresh token ở form Cài đặt Zalo → lượt POST nhận trang 503 như cũ, trang đó tự
 *       thay mục lịch sử của nó bằng GET /noi-bo/chua-ghi (cùng chữ, nút về trang vừa gửi); lịch sử không còn mục nào
 *       của lượt POST; F5, Quay lại, Tiến + F5 không gửi lại token, trang báo không hỏi Supabase (issue #194, đợt 3).
 *  16. Khu nội bộ với ĐĂNG NHẬP THẬT qua Supabase Auth giả (gia-supabase.mjs: đăng nhập, /user, làm mới token, /logout
 *       có phạm vi, phiên thu hồi được; bảng nhan_su có một quản lý). Chromium BẢN ĐẦY ĐỦ có bfcache như nhóm 4 của
 *       trinh-duyet.mjs, nhưng không route nào (route tắt bộ nhớ đệm HTTP, và lúc đó chính trình duyệt gửi lại form khi
 *       bấm Quay lại — chan-meta.mjs, moChromiumKhongRoute). Đăng nhập bằng form; trang NoiBo (/noi-bo/dao-tao) và trang
 *       Kho (/noi-bo/kho/huong-dan) có đúng một thẻ script[data-dau-phien] mang đúng dấu trình duyệt đang giữ; đối chứng:
 *       trình duyệt có bfcache với chính trang đó. Bấm nút Đăng xuất thật (Auth giả nhận đúng một /logout phạm vi local;
 *       trang giấu ngay lúc gửi) rồi Quay lại → bản hiện lại là bản đã giấu và không được cho hiện, trang được xin lại
 *       bằng GET, máy chủ đưa về trang đăng nhập. Phiên bị thu hồi ở Auth giả rồi Quay lại về trang kết quả của form sửa
 *       tên video (lượt POST bị từ chối, trang dựng lại ngay) → KHÔNG lượt POST nào ra mạng (đếm bằng DevTools Protocol:
 *       lượt trả từ bộ nhớ đệm, hay chỉ tra bộ nhớ đệm, không tính) — với Chromium (nghe Clear-Site-Data của trả lời kết
 *       thúc phiên: trang "xác nhận gửi lại form" của trình duyệt), với trình duyệt không nghe lệnh đó (giả bằng cookie:
 *       trang được xin lại bằng GET), và khi đã đăng nhập lại trước khi Quay lại (form cũ không chạy dưới phiên mới).
 *
 * Hỏng thì ảnh chụp nằm ở kiem-tra/anh-loi/day-du/ (CI tải lên cùng artifact của
 * trinh-duyet.mjs).
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as cho } from 'node:timers/promises';
import { batMayGia, LIEN_HE_THU, MON_MAU, MON_THU_SUC, DIA_CHI_CONG_BO_THU, NGAY_DA_MO_THU, TRANG_THAI_THU, ngaySapMoThu,
  menuMuaThitVe, boTaiQuayTheoGu, GIO_NHAN_THU, GIAO_HANG_THU, NHAN_VIEN_THU, VIDEO_THU } from './gia-supabase.mjs';
import { timChuoiCam } from '../src/lib/chuoi-cam.js';
import { chuHienRa, boTienDaChot } from './chu-hien-ra.mjs';
import { taoChonNhom } from './chon-nhom.mjs';
import { choDungYen, doGiaoDien, PHEP_DO } from './do-giao-dien.mjs';
import { moChromium, moChromiumKhongRoute, ghiPixel, docHangDoi, suKienTrong } from './chan-meta.mjs';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const ANH_LOI = join(WEB, 'kiem-tra', 'anh-loi', 'day-du');
const ANH_CHUP = join(WEB, 'kiem-tra', 'anh-chup');
const CONG_GIA = 54331;
const CONG_WEB = 4353;
const CHUP = process.argv.includes('--chup');

// Câu chữ đọc từ chính thư viện của trang (Node ≥ 22.18 đọc thẳng .ts) — đổi chữ ở lib
// thì phép thử đổi theo, không phải chép tay hai nơi.
const { CAP_DUONG_DAN, NGON_NGU, chu, duongDanTuongUng, cauLoiDatabase, DIA_CHI_NHA_HANG, PHAP_NHAN } =
  await import(pathToFileURL(join(WEB, 'src', 'lib', 'chu.ts')).href);
const { NHAN_MON, CAU_NHOM } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'thuc-don.ts')).href);
const { ANH_CUA_MON, DANH_MUC_ANH } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'anh.ts')).href);
const { congNgay, homNayVn } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'gio-vn.ts')).href);
const { dinhDangNgay } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'noi-dung.ts')).href);
// Trang Mua thịt về (nhóm 12): đơn mong đợi tính bằng chính lib của trang từ dữ liệu giả.
const { nhomMuaThitVe, chiaNhom } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'mua-thit-ve.ts')).href);
// Tên hiện trên thẻ gói và dòng đơn: tên Việt / Hàn kèm tên khay trong ngoặc, và link sang trang Các phần thịt bò.
const { tenHienThi, lienKetPhanThit } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'ten-phan-thit.ts')).href);
const { CHU_DON, CAU_HOA_DON, dinhDangTien, docGio, nhanGoi, tinhDon } =
  await import(pathToFileURL(join(WEB, 'src', 'lib', 'don-mua-thit.ts')).href);
const { CAU_DAT_HANG } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'dat-hang-mua-thit.ts')).href);
const { TEN_GU } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'chon-theo-gu.ts')).href);
// Khu nội bộ (nhóm 16): câu báo của form sửa video, đọc từ chính thư viện của trang.
const { CAU: CAU_VIDEO } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'video-dao-tao.ts')).href);

/** Playwright của web/; máy không cài thì dùng bản cài chung của máy. */
function napPlaywright() {
  try { return createRequire(join(WEB, 'package.json'))('playwright'); }
  catch { return createRequire('/opt/node-tools/node_modules/')('playwright'); }
}
const { chromium } = napPlaywright();

// ---------------------------------------------------------------------------
// Bộ đếm — cùng kiểu trinh-duyet.mjs và các file test của crm
// ---------------------------------------------------------------------------
let dat = 0, hong = 0;
const loi = [];
function ok(ten, dieuKien, chiTiet = '') {
  if (dieuKien) { dat++; console.log(`  \x1b[32m✓\x1b[0m ${ten}`); }
  else {
    hong++; loi.push(ten + (chiTiet ? ` — ${chiTiet}` : ''));
    console.log(`  \x1b[31m✗ ${ten}\x1b[0m${chiTiet ? ` — ${chiTiet}` : ''}`);
  }
  return dieuKien;
}
// --chi 1,3: chỉ chạy các nhóm này (chon-nhom.mjs; nhóm 0 luôn chạy) — để sửa nhanh một chỗ; CI chạy hết.
// Gõ sai (thiếu số, có mục không phải số): dừng ngay, chưa bật Supabase giả hay astro dev.
const CHON_NHOM = taoChonNhom(process.argv, { luonChay: ['0'] });
if (CHON_NHOM.loi) { console.error(`\x1b[31m${CHON_NHOM.loi}\x1b[0m`); process.exit(1); }
async function nhom(ten, fn) {
  if (!CHON_NHOM.chay(ten)) return;
  console.log(`\n\x1b[1m${ten}\x1b[0m`);
  try { await fn(); } catch (e) { ok(`${ten} chạy được đến cuối`, false, e.stack || e.message); }
}

// ---------------------------------------------------------------------------
// astro dev với biến môi trường trỏ vào Supabase giả
// ---------------------------------------------------------------------------
async function song(goc) {
  try { return (await fetch(goc, { signal: AbortSignal.timeout(5000) })).ok; } catch { return false; }
}

/**
 * Cấu hình tạm: y hệt astro.config.mjs, cộng hai điều — thư mục cache Vite riêng (không
 * giành node_modules/.vite với một astro dev khác đang chạy trên máy) và tắt thanh công
 * cụ dev (nó không có trên trang thật, chỉ thêm lỗi console không liên quan).
 */
function taoCauHinhTam() {
  const thuMuc = mkdtempSync(join(tmpdir(), 'beeftown-thu-day-du-'));
  const tep = join(thuMuc, 'astro.config.mjs');
  writeFileSync(tep, `import goc from ${JSON.stringify(pathToFileURL(join(WEB, 'astro.config.mjs')).href)};
export default { ...goc, devToolbar: { enabled: false }, vite: { ...(goc.vite ?? {}), cacheDir: ${JSON.stringify(join(thuMuc, 'vite'))} } };
`);
  return { thuMuc, tep };
}

/** File .env nào trong web/ có khai PUBLIC_SUPABASE_URL — để báo khi biến môi trường không thắng. */
function envCoSupabase() {
  return ['.env', '.env.local', '.env.development', '.env.development.local']
    .filter(f => existsSync(join(WEB, f)) && /^\s*PUBLIC_SUPABASE_URL\s*=/m.test(readFileSync(join(WEB, f), 'utf8')));
}

async function batAstro(gocGia) {
  const goc = `http://127.0.0.1:${CONG_WEB}`;
  if (await song(goc)) throw new Error(`Cổng ${CONG_WEB} đang bận — tắt máy chủ cũ rồi chạy lại`);
  const cauHinh = taoCauHinhTam();
  const nhatKy = [];
  // --ignore-lock: chạy tiền cảnh, không đụng khóa .astro/dev.json của astro dev khác trên máy
  // (Astro 7 tự chuyển sang chạy ngầm khi đoán là bị máy gọi, và lúc đó không tắt được bằng kill).
  // --config: Astro ghép đường dẫn này vào sau thư mục gốc (path.join), nên phải là đường dẫn tương đối.
  const p = spawn(process.execPath, [join(WEB, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'dev',
    '--port', String(CONG_WEB), '--host', '127.0.0.1', '--ignore-lock', '--config', relative(WEB, cauHinh.tep)], {
    cwd: WEB,
    env: { ...process.env, PUBLIC_SUPABASE_URL: gocGia, PUBLIC_SUPABASE_ANON_KEY: 'khoa-thu' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  for (const s of [p.stdout, p.stderr]) s.on('data', d => { nhatKy.push(String(d)); if (nhatKy.length > 80) nhatKy.shift(); });
  for (let i = 0; i < 120; i++) {
    if (await song(goc)) return { p, goc, cauHinh, nhatKy };
    if (p.exitCode !== null) break;
    await cho(1000);
  }
  tatAstro({ p, cauHinh });
  throw new Error(`astro dev không lên ở cổng ${CONG_WEB}. Nhật ký cuối:\n${nhatKy.join('').slice(-3000)}`);
}

function tatAstro(may) {
  const p = may?.p;
  if (p?.pid && p.exitCode === null) {
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' });
    else { try { process.kill(-p.pid, 'SIGTERM'); } catch { p.kill('SIGTERM'); } }
  }
  if (may?.cauHinh) rmSync(may.cauHinh.thuMuc, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
const TRANG = CAP_DUONG_DAN.flat();
const ngonNguCua = duong => (duong.startsWith('/en') ? 'en' : duong.startsWith('/ko') ? 'ko' : 'vi');
// "접수되었는지 … 알 수 없어요" (KHÔNG CHẮC đã nhận chưa — lib/xu-ly-form.ts) là câu đúng khi mạng đứt,
// không phải lời báo đã nhận: loại nó ra khỏi mẫu tiếng Hàn.
const CHU_DA_NHAN = { vi: /đã nhận/i, en: /\breceived\b/i, ko: /접수되었(?!는지)/ };
const BAT_KY_DA_NHAN = /đã nhận|\breceived\b|접수되었(?!는지)/i;
const CHU_THANH_CONG = /thành công|\bsuccess|성공/i;
// Lời hứa của form hỏi bàn: gửi yêu cầu trên trang, nhà hàng gọi lại — chép tay, như
// crm/test/test-cong-khai-hoi-ban-dong.mjs. Form đóng thì mô tả và đoạn mở đầu không được nói câu này.
const HUA_FORM = { vi: /gọi lại|gửi yêu cầu/i, en: /call you back|(?<!cannot )send (?:a|your)(?: table)? request/i, ko: /전화드려요|전화로 안내|문의를 보내 주세요|요청을 보내 주세요/ };
const HUA_GOI_LAI = { vi: /gọi lại/i, en: /call you back/i, ko: /전화드려요|전화로 안내/ };
// "Bạn chưa gửi được yêu cầu", "chưa mở đặt bàn trực tuyến" (trước 23/11/2026: "hỏi bàn") — đúng khi database đã từ chối, sai khi
// KHÔNG CHẮC đã ghi (nhóm 4). Gồm cả cách nói "không gửi được" khác của trang (CAU_DAT_BAN.chuaGhi…).
const CHUA_GUI_DUOC = {
  vi: /chưa gửi được|không gửi được|chưa mở (?:hỏi|đặt) bàn/i,
  en: /cannot send|could not (?:be )?sen[dt]|not open yet/i,
  ko: /보낼 수 없어요|보내지 못했어요|받지 않아요/,
};
const DANG_GUI = { vi: 'Đang gửi…', en: 'Sending…', ko: '보내는 중…' };
const KHOA_LUU = 'bt-hoi-ban';
const KHOA_NUT = 'thu-day-du-nut-gui';   // nhóm 2: trạng thái nút lúc vừa gửi, giữ qua lần chuyển trang
const KHACH = { ho_ten: 'Khách Thử', sdt: '0912345678' };
const thuong = s => s.toLocaleLowerCase('vi');
const tenTep = duong => duong.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-') || 'goc';

let mayGia = null;
let mayWeb = null;
let trinhDuyet = null;
for (const tin of ['SIGINT', 'SIGTERM']) {
  process.on(tin, async () => { tatAstro(mayWeb); await mayGia?.dong(); process.exit(130); });
}

console.log('\x1b[1m\nBEEFTOWN — TRANG CÔNG KHAI KHI ĐÃ NỐI DATABASE (Supabase giả)\x1b[0m');
console.log('='.repeat(60));
rmSync(ANH_LOI, { recursive: true, force: true });

try {
  mayGia = await batMayGia({ cong: CONG_GIA, kichBan: 'day-du' });
  const coEnv = envCoSupabase();
  if (coEnv.length) console.log(`  (web/${coEnv.join(', web/')} có PUBLIC_SUPABASE_URL — biến môi trường phải thắng; kiểm ngay dưới đây)`);
  console.log('Bật astro dev…');
  mayWeb = await batAstro(mayGia.goc);
  const goc = mayWeb.goc;
  console.log(`Trang: ${goc}`);

  // Lần tải đầu của mỗi trang, Vite còn tối ưu thư viện và có thể trả lỗi giữa chừng:
  // tải mỗi trang tới khi được 200 rồi mới bắt đầu đếm.
  for (const duong of TRANG) {
    for (let lan = 0; lan < 5 && !(await song(goc + duong)); lan++) await cho(1500);
  }

  // =========================================================================
  await nhom('0 · BIẾN MÔI TRƯỜNG TỚI ĐƯỢC TRANG', async () => {
    mayGia.datKichBan('day-du');
    await fetch(goc + '/');
    const dem = mayGia.dem();
    if (!ok('PUBLIC_SUPABASE_URL của lệnh chạy thắng web/.env: trang chủ gọi noi_dung_cong_khai của Supabase giả',
            (dem.noi_dung_cong_khai ?? 0) >= 1,
            `server giả không nhận lượt gọi nào${coEnv.length ? ` — web/${coEnv.join(', web/')} đang thắng biến môi trường` : ''}`)) {
      throw new Error('Trang không nói chuyện với Supabase giả — mọi kiểm tra sau đều vô nghĩa');
    }
  });
  if (hong) throw new Error('dừng');

  trinhDuyet = await moChromium(chromium);
  const ctx = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const chupLoi = async ten => {
    mkdirSync(ANH_LOI, { recursive: true });
    await page.screenshot({ path: join(ANH_LOI, `${ten.replace(/[^a-z0-9-]+/gi, '_')}.png`), fullPage: true }).catch(() => {});
  };
  const chuTrang = async (chon = 'body') => (await page.locator(chon).first().innerText().catch(() => '')) ?? '';
  const moTaTrang = () => page.evaluate(() => ({
    moTa: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    og: document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '',
    dan: document.querySelector('main p.dan')?.textContent?.trim() ?? '',
  }));
  // Nút chính của màn đầu: link, hoặc (form hỏi bàn mở, 12/11/2026) nút gửi của hỏi bàn nhanh — khi đó "dẫn tới"
  // là action của form.
  const nutChinhMoDau = () => page.evaluate(() => {
    const a = document.querySelector('main .kmd .nut.nut-chinh');
    if (!a) return null;
    const toi = a.tagName === 'BUTTON' ? a.form?.action : a.href;
    return { chu: a.textContent.trim().replace(/\s+/g, ' '), duong: toi ? new URL(toi).pathname : null, gui: a.tagName === 'BUTTON' };
  });

  /** Điền form hỏi bàn như khách: bấm chọn giờ, chọn số người, gõ họ tên và số điện thoại. */
  async function dienForm() {
    const nhan = page.locator('form[data-hoi-ban] label:has(input[name="gio"]:not([disabled]))').first();
    if (await nhan.count()) await nhan.click();
    else await page.locator('form[data-hoi-ban] input[name="gio"]:not([disabled])').first().check({ force: true });
    const soKhach = page.locator('form[data-hoi-ban] select[name="so_khach"]');
    if (await soKhach.count()) await soKhach.selectOption('2');
    await page.fill('form[data-hoi-ban] [name="ho_ten"]', KHACH.ho_ten);
    await page.fill('form[data-hoi-ban] [name="sdt"]', KHACH.sdt);
  }
  const nutGui = () => page.locator('form[data-hoi-ban] [type="submit"]').first();

  /** Gửi form (bấm một lần hoặc bấm đúp) và chờ trang sau khi gửi tải xong. */
  async function gui({ dup = false } = {}) {
    const sau = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
    if (dup) await nutGui().dblclick();
    else await nutGui().click();
    await sau;
    await page.waitForLoadState('networkidle').catch(() => {});
    await cho(300);
  }

  // =========================================================================
  await nhom('1 · ĐÃ CÔNG BỐ ĐỦ (day-du): NÚT, LIÊN KẾT, THỰC ĐƠN, FORM', async () => {
    mayGia.datKichBan('day-du');
    for (const nn of NGON_NGU) {
      const t = chu(nn);
      const trangChu = duongDanTuongUng('/', nn);
      await page.goto(goc + trangChu, { waitUntil: 'load' });
      const nut = await nutChinhMoDau();
      const tot = [
        ok(`${trangChu}: nút chính màn đầu là "${t.datBan}" và dẫn tới ${duongDanTuongUng('/dat-ban', nn)}`,
           nut?.chu === t.datBan && nut?.duong === duongDanTuongUng('/dat-ban', nn), JSON.stringify(nut)),
        ok(`${trangChu}: form mở → nút chính là nút gửi của hỏi bàn nhanh (ô ngày, ô số người)`,
           nut?.gui === true && await page.locator('main .kmd form.kmd-hoi select[name="ngay"]').count() === 1
             && await page.locator('main .kmd form.kmd-hoi select[name="so_khach"]').count() === 1),
        ok(`${trangChu}: có link Facebook đã công bố`,
           await page.locator(`a[href="${LIEN_HE_THU.facebook_url}"]`).count() > 0),
        ok(`${trangChu}: có nút "${t.chiDuong}" dẫn tới Maps đã công bố`,
           await page.locator(`a[href="${LIEN_HE_THU.google_maps_url}"]`).filter({ hasText: t.chiDuong }).count() > 0),
      ];
      if (tot.includes(false)) await chupLoi(`day-du${trangChu}`);

      // Hỏi bàn nhanh (12/11/2026): chọn ngày thứ ba và 4 người ở màn đầu, bấm "Hỏi bàn" → trang Hỏi bàn đúng thứ
      // tiếng mở đúng ngày đó, ô số người chọn sẵn 4.
      const ngayChon = await page.locator('main .kmd select[name="ngay"] option').nth(2).getAttribute('value');
      await page.selectOption('main .kmd select[name="ngay"]', ngayChon);
      await page.selectOption('main .kmd select[name="so_khach"]', '4');
      await Promise.all([page.waitForLoadState('load'), page.waitForURL(u => new URL(u).pathname === duongDanTuongUng('/dat-ban', nn)),
        page.click('main .kmd form.kmd-hoi button[type="submit"]')]);
      const diaChi = new URL(page.url());
      const totHoiNhanh = [
        ok(`${trangChu}: hỏi bàn nhanh → ${duongDanTuongUng('/dat-ban', nn)}?ngay=${ngayChon}&so_khach=4#hb-gio`,
           diaChi.searchParams.get('ngay') === ngayChon && diaChi.searchParams.get('so_khach') === '4' && diaChi.hash === '#hb-gio', page.url()),
        ok(`${trangChu}: trang Đặt bàn mở đúng ngày đã chọn và ô số người chọn sẵn 4`,
           await page.locator('form[data-doi-ngay] input[name="ngay"]').getAttribute('value') === ngayChon
             && await page.locator('form[data-hoi-ban] select[name="so_khach"]').inputValue() === '4'),
      ];
      if (totHoiNhanh.includes(false)) await chupLoi(`hoi-nhanh${trangChu}`);

      const thucDon = duongDanTuongUng('/thuc-don', nn);
      await page.goto(goc + thucDon, { waitUntil: 'load' });
      // Có JavaScript thì ba phần là ba tab — chữ của tab chưa mở không hiện (innerText không
      // có). Bấm lần lượt từng tab như khách rồi gom chữ đã hiện.
      let chu_ = await chuTrang();
      const soTab = await page.locator('main [role="tab"]').count();
      for (let i = 0; i < soTab; i++) {
        await page.locator('main [role="tab"]').nth(i).click();
        chu_ += '\n' + await chuTrang('main');
      }
      // Chữ ẩn cũng không được có số tiền: đọc cả DOM (bỏ script, style).
      const chuDom = await page.evaluate(() => {
        const b = document.body.cloneNode(true);
        b.querySelectorAll('script, style, template').forEach(x => x.remove());
        return b.textContent;
      });
      const thieuMon = MON_MAU.filter(m => !chu_.includes(m.ten[nn])).map(m => m.ten[nn]);
      const f03 = MON_MAU.find(m => m.laMonSong);
      const cam = timChuoiCam(chu_ + '\n' + chuDom);
      const tot2 = [
        ok(`${thucDon}: hiện đủ tên món mẫu (bấm qua ${soTab} tab)`, thieuMon.length === 0, `thiếu: ${thieuMon.join(', ')}`),
        // innerText trả chữ ĐÃ qua text-transform (nhãn in hoa) — so không phân biệt hoa thường.
        ok(`${thucDon}: nhãn "${NHAN_MON.monSong[nn]}" kèm câu cảnh báo của món sống`,
           thuong(chu_).includes(thuong(NHAN_MON.monSong[nn])) && chu_.includes(f03.canhBao[nn])),
        ok(`${thucDon}: nhãn "${NHAN_MON.coCon[nn]}"`, thuong(chu_).includes(thuong(NHAN_MON.coCon[nn]))),
        ok(`${thucDon}: KHÔNG một số tiền nào, không chữ cấm (timChuoiCam)`, cam.length === 0,
           cam.map(c => c.tim_thay).join(' · ')),
        ok(`${thucDon}: không có phần tử giá (.mon-gia) — mọi món đều chưa duyệt giá`,
           await page.locator('.mon-gia').count() === 0),
        ok(`${thucDon}: không có chữ "chờ duyệt"`, !/chờ duyệt|pending approval|승인\s?대기/i.test(chu_ + chuDom)),
      ];
      if (tot2.includes(false)) await chupLoi(`day-du${thucDon}`);

      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      const soGio = await page.locator('form[data-hoi-ban] input[type="radio"][name="gio"]').count();
      if (!ok(`${hoiBan}: có form hỏi bàn với khung giờ để chọn`,
              await page.locator('form[data-hoi-ban]').count() === 1 && soGio > 0, `${soGio} khung giờ`)) {
        await chupLoi(`day-du${hoiBan}`);
      }
      const mt = await moTaTrang();
      ok(`${hoiBan}: form mở → meta description và og:description là câu "gửi yêu cầu, nhà hàng gọi lại" (moTaHoiBan)`,
         !!chu(nn).moTaHoiBan && mt.moTa === chu(nn).moTaHoiBan && mt.og === chu(nn).moTaHoiBan, `«${mt.moTa}»`);
      ok(`${hoiBan}: form mở → đoạn mở đầu nói nhà hàng gọi lại`, HUA_GOI_LAI[nn].test(mt.dan), `«${mt.dan}»`);
    }
  });

  // =========================================================================
  await nhom('2 · BẤM HAI LẦN "GỬI YÊU CẦU" → ĐÚNG MỘT YÊU CẦU, TRANG SAU NÓI "ĐÃ NHẬN"', async () => {
    // Database trả lời chậm (1,5 giây — như mạng 4G): lượt gửi đầu còn đang chạy ở máy chủ thì
    // khách bấm lần nữa. Không có gì chặn thì trình duyệt bỏ lượt đầu, gửi lượt hai — và máy chủ
    // nhận CẢ HAI. Bấm bằng chuột thật tại chỗ cái nút (không qua locator), nên nút đã khóa
    // hay chưa thì cú bấm vẫn tới — đúng như ngón tay khách.
    for (const nn of NGON_NGU) {
      for (const cach of ['bấm đúp', 'bấm lần hai sau 0,3 giây']) {
        const hoiBan = duongDanTuongUng('/dat-ban', nn);
        mayGia.datKichBan('day-du', { cham: 1500 });
        await page.goto(goc + hoiBan, { waitUntil: 'load' });
        await dienForm();
        await nutGui().scrollIntoViewIfNeeded();
        const hop = await nutGui().boundingBox();
        const [x, y] = [hop.x + hop.width / 2, hop.y + hop.height / 2];
        // Trạng thái nút NGAY sau khi trang xử lý lượt submit đầu: một listener gắn SAU script của
        // trang (nên chạy sau nó, cùng nhịp) chép lại vào sessionStorage — còn nguyên qua lần chuyển
        // trang. Đọc bằng evaluate sau cú bấm thì đua với lần chuyển trang: Chromium giữ evaluate tới
        // khi trang mới tới, ngữ cảnh cũ mất, phép thử hỏng mà nút chẳng sai gì.
        await page.evaluate(k => {
          sessionStorage.removeItem(k);
          document.querySelector('form[data-hoi-ban]')?.addEventListener('submit', () => {
            if (sessionStorage.getItem(k)) return;   // chỉ lượt đầu
            const b = document.querySelector('form[data-hoi-ban] [type="submit"]');
            sessionStorage.setItem(k, JSON.stringify(b && { tat: b.disabled, ban: b.getAttribute('aria-busy'), chu: b.textContent.trim() }));
          });
        }, KHOA_NUT);
        const sau = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
        if (cach === 'bấm đúp') await page.mouse.dblclick(x, y);
        else { await page.mouse.click(x, y); await cho(300); await page.mouse.click(x, y); }
        await sau;
        const nut = await page.evaluate(k => {
          const v = sessionStorage.getItem(k);
          sessionStorage.removeItem(k);
          try { return JSON.parse(v ?? 'null'); } catch { return { loi: v }; }
        }, KHOA_NUT);
        await page.waitForLoadState('networkidle').catch(() => {});
        await cho(1000);   // lượt thứ hai (nếu lọt) cần thêm chừng ấy để tới database

        const dem = mayGia.dem().tao_dat_ban ?? 0;
        const chu_ = await chuTrang();
        const nhan = `${hoiBan} (${cach})`;
        const tot = [
          ok(`${nhan}: đang gửi thì nút bị khóa, aria-busy="true", chữ "${DANG_GUI[nn]}"`,
             nut?.tat === true && nut?.ban === 'true' && nut?.chu.includes(DANG_GUI[nn]), JSON.stringify(nut)),
          ok(`${nhan}: tao_dat_ban được gọi ĐÚNG MỘT lần`, dem === 1, `${dem} lần`),
          ok(`${nhan}: trang sau khi gửi có khung "đã nhận"`,
             await page.locator('[data-ket-qua="da-nhan"]').count() === 1 && CHU_DA_NHAN[nn].test(chu_), chu_.slice(0, 200)),
          ok(`${nhan}: không có chữ "thành công"/"success"/"성공", không chữ cấm`,
             !CHU_THANH_CONG.test(chu_) && timChuoiCam(chu_).length === 0, chu_.match(CHU_THANH_CONG)?.[0]),
          ok(`${nhan}: tiêu điểm ở khung "đã nhận"`,
             await page.evaluate(() => document.activeElement?.getAttribute('data-ket-qua')) === 'da-nhan'),
          ok(`${nhan}: đã nhận thì bản lưu tạm (sessionStorage) bị xóa`,
             await page.evaluate(k => sessionStorage.getItem(k), KHOA_LUU) === null),
        ];
        if (tot.includes(false)) await chupLoi(`bam-hai-lan${hoiBan}-${cach === 'bấm đúp' ? 'dup' : 'cach'}`);
      }
    }
  });

  // =========================================================================
  await nhom('3 · DATABASE 500 / MẠNG ĐỨT: KHÔNG BAO GIỜ "ĐÃ NHẬN"; 500 ĐIỀN LẠI Ô, KHÔNG CHẮC THÌ KHÔNG', async () => {
    for (const kichBan of ['dat-ban-500', 'dat-ban-dut']) {
      // 500 có mã lỗi của database (XX000): giao dịch đã hủy, "chưa ghi" là đúng — điền lại ô để khách gửi lại.
      // Mạng đứt: KHÔNG CHẮC đã ghi chưa (lib/xu-ly-form.ts) — câu bảo khách nhắn hỏi, đừng gửi lại; điền sẵn
      // mọi ô (cả giờ) thì gửi lại chỉ còn một cú bấm và nhà hàng nhận hai bản. Nên xóa bản lưu, ô để trống.
      const khongChac = kichBan === 'dat-ban-dut';
      for (const nn of NGON_NGU) {
        const hoiBan = duongDanTuongUng('/dat-ban', nn);
        mayGia.datKichBan(kichBan);
        await page.goto(goc + hoiBan, { waitUntil: 'load' });
        await dienForm();
        await gui();
        const chu_ = await chuTrang();
        const o = await page.evaluate(() => ({
          ho_ten: document.querySelector('form[data-hoi-ban] [name="ho_ten"]')?.value ?? null,
          sdt: document.querySelector('form[data-hoi-ban] [name="sdt"]')?.value ?? null,
          gio: document.querySelector('form[data-hoi-ban] input[name="gio"]:checked')?.value ?? null,
        }));
        const luu = await page.evaluate(k => { try { return JSON.parse(sessionStorage.getItem(k) ?? 'null'); } catch { return 'hỏng'; } }, KHOA_LUU);
        const nhan = `${kichBan} ${hoiBan}`;
        const tot = [
          ok(`${nhan}: KHÔNG có "đã nhận" / "received" / "접수되었"`,
             !BAT_KY_DA_NHAN.test(chu_) && await page.locator('[data-ket-qua="da-nhan"]').count() === 0,
             chu_.match(BAT_KY_DA_NHAN)?.[0]),
          ok(`${nhan}: không có chữ "thành công"/"success"/"성공"`, !CHU_THANH_CONG.test(chu_), chu_.match(CHU_THANH_CONG)?.[0]),
          ok(`${nhan}: có khung lỗi (role="alert", data-ket-qua="${khongChac ? 'khong-chac' : 'loi'}")`,
             await page.locator(`[role="alert"][data-ket-qua="${khongChac ? 'khong-chac' : 'loi'}"]`).count() === 1),
          ok(`${nhan}: tiêu điểm ở khung lỗi`,
             await page.evaluate(() => document.activeElement?.getAttribute('data-ket-qua')) === (khongChac ? 'khong-chac' : 'loi')),
          ...(khongChac ? [
            ok(`${nhan}: KHÔNG CHẮC đã ghi → không điền lại họ tên, số điện thoại, giờ (gửi lại không còn là một cú bấm)`,
               !o.ho_ten && !o.sdt && !o.gio, JSON.stringify(o)),
            ok(`${nhan}: KHÔNG CHẮC đã ghi → bản lưu tạm bị xóa`, luu === null, JSON.stringify(luu)),
          ] : [
            ok(`${nhan}: họ tên và số điện thoại đã gõ được điền lại`,
               o.ho_ten === KHACH.ho_ten && o.sdt === KHACH.sdt, JSON.stringify(o)),
            ok(`${nhan}: bản lưu tạm không giữ ô đồng ý nhận tin`,
               !!luu && typeof luu === 'object' && !Object.keys(luu).some(k => /dong_y/.test(k)), JSON.stringify(luu)),
          ]),
          ok(`${nhan}: gửi một lần → tao_dat_ban một lần (không tự gửi lại)`, (mayGia.dem().tao_dat_ban ?? 0) === 1,
             `${mayGia.dem().tao_dat_ban ?? 0} lần`),
        ];
        if (tot.includes(false)) await chupLoi(`${kichBan}${hoiBan}`);
      }
    }

    for (const nn of NGON_NGU) {
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      mayGia.datKichBan('dat-ban-loi');
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      await dienForm();
      await gui();
      const khung = await chuTrang('[data-ket-qua="loi"]');
      const cau = nn === 'vi' ? 'đã hết bàn'
        : cauLoiDatabase('Khung giờ 18:00:00 ngày 2030-01-01 đã hết bàn', nn, '(câu chung)');
      const tot = [
        ok(`dat-ban-loi ${hoiBan}: câu từ chối của database hiện trong khung lỗi, đúng thứ tiếng ("${cau}")`,
           khung.includes(cau), khung.slice(0, 200)),
        ok(`dat-ban-loi ${hoiBan}: KHÔNG có "đã nhận"`, !BAT_KY_DA_NHAN.test(await chuTrang())),
      ];
      if (tot.includes(false)) await chupLoi(`dat-ban-loi${hoiBan}`);
    }

    // Đổi ngày: chữ đã gõ đi theo sang ngày mới, nhưng GIỜ thì không — giờ chọn cho ngày cũ mà hiện như đã
    // chọn ở ngày mới thì khách gửi một giờ mình chưa từng chọn cho ngày đó.
    mayGia.datKichBan('day-du');
    for (const nn of NGON_NGU) {
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      await dienForm();
      const homNay = await page.locator('form[data-doi-ngay] input[name="ngay"]').getAttribute('min');
      const ngayMoi = congNgay(homNay, 1);
      await page.fill('form[data-doi-ngay] input[name="ngay"]', ngayMoi);
      const sau = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
      await page.locator('form[data-doi-ngay] [type="submit"]').click();
      await sau;
      await cho(300);
      const o = await page.evaluate(() => ({
        ngay: document.querySelector('form[data-hoi-ban] input[type="hidden"][name="ngay"]')?.value ?? null,
        ho_ten: document.querySelector('form[data-hoi-ban] [name="ho_ten"]')?.value ?? null,
        gio: document.querySelector('form[data-hoi-ban] input[name="gio"]:checked')?.value ?? null,
      }));
      const tot = [
        ok(`đổi ngày ${hoiBan}: trang mới ở ngày ${ngayMoi}`, o.ngay === ngayMoi, JSON.stringify(o)),
        ok(`đổi ngày ${hoiBan}: họ tên đã gõ đi theo sang ngày mới`, o.ho_ten === KHACH.ho_ten, JSON.stringify(o)),
        ok(`đổi ngày ${hoiBan}: giờ chọn ở ngày cũ KHÔNG được chọn sẵn ở ngày mới`, o.gio === null, JSON.stringify(o)),
      ];
      if (tot.includes(false)) await chupLoi(`doi-ngay${hoiBan}`);
    }
  });

  // =========================================================================
  await nhom('4 · NỐI DATABASE NHƯNG CHƯA CÔNG BỐ GÌ (rong) · FORM ĐANG TẮT (dat-ban-dong) · SẬP GIỮA LƯỢT GỬI (dat-ban-sap)', async () => {
    mayGia.datKichBan('rong');
    for (const nn of NGON_NGU) {
      const t = chu(nn);
      const trangChu = duongDanTuongUng('/', nn);
      await page.goto(goc + trangChu, { waitUntil: 'load' });
      const nut = await nutChinhMoDau();
      const tot = [
        ok(`rong ${trangChu}: nút chính màn đầu là "${t.khamPhaThucDon}"`,
           nut?.chu === t.khamPhaThucDon && nut?.duong === duongDanTuongUng('/thuc-don', nn), JSON.stringify(nut)),
        ok(`rong ${trangChu}: không có nút / link Facebook`, await page.locator('a[href*="facebook.com"]').count() === 0),
        ok(`rong ${trangChu}: không có nút "${t.chiDuong}"`,
           await page.locator('a').filter({ hasText: new RegExp(`^\\s*${t.chiDuong}\\s*$`) }).count() === 0
             && await page.locator('a[href*="maps."]').count() === 0),
      ];
      if (tot.includes(false)) await chupLoi(`rong${trangChu}`);
    }

    mayGia.datKichBan('dat-ban-dong');
    for (const nn of NGON_NGU) {
      const t = chu(nn);
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      const chu_ = await chuTrang();
      const tot = [
        ok(`dat-ban-dong ${hoiBan}: không có form hỏi bàn`, await page.locator('form[data-hoi-ban]').count() === 0),
        ok(`dat-ban-dong ${hoiBan}: chỉ sang Facebook đã công bố`,
           /facebook/i.test(chu_) && await page.locator(`main a[href="${LIEN_HE_THU.facebook_url}"]`).count() > 0),
      ];
      const mt = await moTaTrang();
      tot.push(
        ok(`dat-ban-dong ${hoiBan}: meta description và og:description là câu "chưa mở" (moTaHoiBanChuaMo)`,
           !!t.moTaHoiBanChuaMo && mt.moTa === t.moTaHoiBanChuaMo && mt.og === t.moTaHoiBanChuaMo, `«${mt.moTa}»`),
        ok(`dat-ban-dong ${hoiBan}: mô tả không hứa gửi yêu cầu / gọi lại`,
           !HUA_FORM[nn].test(mt.moTa) && !HUA_FORM[nn].test(mt.og), mt.moTa.match(HUA_FORM[nn])?.[0]),
        ok(`dat-ban-dong ${hoiBan}: đoạn mở đầu không hứa gửi yêu cầu / gọi lại`,
           !!mt.dan && !HUA_FORM[nn].test(mt.dan), `«${mt.dan}»`),
      );
      const trangChu = duongDanTuongUng('/', nn);
      await page.goto(goc + trangChu, { waitUntil: 'load' });
      const nut = await nutChinhMoDau();
      tot.push(ok(`dat-ban-dong ${trangChu}: nút chính "${t.khamPhaThucDon}", "${t.datBan}" lùi xuống nút phụ (vẫn có kênh để hỏi)`,
        nut?.chu === t.khamPhaThucDon
          && await page.locator(`main a.nut.nut-vien[href="${duongDanTuongUng('/dat-ban', nn)}"]`).count() > 0,
        JSON.stringify(nut)));
      if (tot.includes(false)) await chupLoi(`dat-ban-dong${hoiBan}`);
    }

    // Form vừa đóng (hay đọc lịch hỏng) đúng lúc khách gửi: câu trả lời cho lượt gửi đó — kể cả "không chắc
    // đã ghi" — vẫn phải hiện, không bị thay im lặng bằng "chưa mở hỏi bàn trực tuyến".
    for (const nn of NGON_NGU) {
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      mayGia.datKichBan('day-du');
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      await dienForm();
      mayGia.datKichBan('dat-ban-dong');
      await gui();
      const { dan } = await moTaTrang();
      const tot = [
        ok(`dat-ban-dong (đóng giữa chừng) ${hoiBan}: khung lỗi của lượt gửi vẫn hiện`,
           await page.locator('[role="alert"][data-ket-qua]').count() === 1),
        ok(`dat-ban-dong (đóng giữa chừng) ${hoiBan}: KHÔNG có "đã nhận"`, !BAT_KY_DA_NHAN.test(await chuTrang())),
        // Database đã từ chối (form đóng) — chưa ghi gì, nên "bạn chưa gửi được", "chưa mở" là đúng.
        ok(`dat-ban-dong (đóng giữa chừng) ${hoiBan}: database đã từ chối → đoạn mở đầu vẫn nói chưa gửi được`,
           CHUA_GUI_DUOC[nn].test(dan), `«${dan}»`),
        ok(`dat-ban-dong (đóng giữa chừng) ${hoiBan}: database đã từ chối → thẻ vẫn có tiêu đề "chưa mở"`,
           await page.locator('.hb-chua-mo h2').count() === 1),
      ];
      if (tot.includes(false)) await chupLoi(`dat-ban-dong-giua-chung${hoiBan}`);
    }

    // Database sập đúng lúc khách gửi: tao_dat_ban không trả lời (KHÔNG CHẮC đã ghi — lib/xu-ly-form.ts),
    // và trang sau khi gửi cũng không đọc được lịch nên hiện thẻ "chưa mở" thay cho form. Khung lỗi bảo
    // "đừng gửi lại, nhắn Facebook để kiểm tra"; câu nào trên trang nói "bạn chưa gửi được" hay "chưa mở
    // hỏi bàn trực tuyến" cũng cãi khung lỗi — khách tin là chưa gửi và hỏi lại, nhà hàng nhận hai bản.
    // Câu đoạn mở đầu chép tay (chép từ code thì sửa code là kiểm thử đổi theo).
    const DAN_KHONG_CHAC = {
      vi: 'Cách liên hệ Beeftown lúc này ở ngay bên dưới.',
      en: 'Here is how to reach Beeftown for now.',
      ko: '지금 Beeftown에 연락하는 방법은 바로 아래에서 확인해 주세요.',
    };
    for (const nn of NGON_NGU) {
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      mayGia.datKichBan('day-du');
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      await dienForm();
      mayGia.datKichBan('dat-ban-sap');
      await gui();
      const { dan } = await moTaTrang();
      const chuMain = await chuTrang('main');
      const tot = [
        ok(`dat-ban-sap ${hoiBan}: trang sau khi gửi không có form (đúng trạng thái thẻ "chưa mở")`,
           await page.locator('form[data-hoi-ban]').count() === 0),
        ok(`dat-ban-sap ${hoiBan}: khung "KHÔNG CHẮC đã ghi" hiện (role="alert", data-ket-qua="khong-chac")`,
           await page.locator('[role="alert"][data-ket-qua="khong-chac"]').count() === 1),
        ok(`dat-ban-sap ${hoiBan}: đoạn mở đầu là câu trung tính «${DAN_KHONG_CHAC[nn]}»`, dan === DAN_KHONG_CHAC[nn], `«${dan}»`),
        ok(`dat-ban-sap ${hoiBan}: cả trang KHÔNG nói "chưa gửi được" / "chưa mở đặt bàn" (cãi khung "không chắc, đừng gửi lại")`,
           !!chuMain && !CHUA_GUI_DUOC[nn].test(chuMain), chuMain.match(CHUA_GUI_DUOC[nn])?.[0]),
        ok(`dat-ban-sap ${hoiBan}: thẻ không có tiêu đề "chưa mở" (h2), vẫn có nút sang Facebook đã công bố để kiểm tra`,
           await page.locator('.hb-chua-mo h2').count() === 0
             && await page.locator(`.hb-chua-mo a[href="${LIEN_HE_THU.facebook_url}"]`).count() === 1),
        ok(`dat-ban-sap ${hoiBan}: KHÔNG có "đã nhận"`, !BAT_KY_DA_NHAN.test(await chuTrang())),
        ok(`dat-ban-sap ${hoiBan}: gửi một lần → tao_dat_ban một lần (không tự gửi lại)`, (mayGia.dem().tao_dat_ban ?? 0) === 1,
           `${mayGia.dem().tao_dat_ban ?? 0} lần`),
      ];
      if (tot.includes(false)) await chupLoi(`dat-ban-sap${hoiBan}`);
    }
  });

  // =========================================================================
  await nhom(`5 · ${TRANG.length} TRANG × 3 KỊCH BẢN Ở 360 VÀ 1440 PX`, async () => {
    for (const kichBan of ['rong', 'day-du', 'dat-ban-dong']) {
      mayGia.datKichBan(kichBan);
      for (const rong of [360, 1440]) {
        const c = await trinhDuyet.newContext({ viewport: { width: rong, height: rong < 600 ? 740 : 900 } });
        for (const duong of TRANG) {
          const p = await c.newPage();
          const loiJs = [];
          p.on('pageerror', e => loiJs.push(e.message));
          p.on('console', m => { if (m.type() === 'error' && (m.location().url || goc).startsWith(goc)) loiJs.push(m.text()); });
          const r = await p.goto(goc + duong, { waitUntil: 'load', timeout: 60000 });
          const kq = await p.evaluate(() => ({ rong: document.documentElement.scrollWidth, khung: innerWidth }));
          const gd = await p.evaluate(doGiaoDien);
          const saiGd = Object.keys(PHEP_DO).flatMap(khoa => (gd[khoa] ?? ['không đo được']).map(c => `[${khoa}] ${c}`));
          const nhan = `${kichBan} ${duong} · ${rong}px`;
          const tot = [
            ok(`${nhan}: HTTP 200`, r?.status() === 200, `HTTP ${r?.status()}`),
            ok(`${nhan}: không tràn ngang`, kq.rong <= kq.khung + 1, `rộng ${kq.rong}px > khung ${kq.khung}px`),
            ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | ')),
            ok(`${nhan}: thành phần và khung trang đúng quy tắc (${Object.keys(PHEP_DO).length} phép đo của do-giao-dien.mjs)`,
               saiGd.length === 0, saiGd.slice(0, 5).join(' | ')),
          ];
          if (tot.includes(false)) {
            mkdirSync(ANH_LOI, { recursive: true });
            await p.screenshot({ path: join(ANH_LOI, `${kichBan}-${tenTep(duong)}-${rong}.png`), fullPage: true }).catch(() => {});
          }
          await p.close();
        }
        await c.close();
      }
    }
  });

  // =========================================================================
  // Địa chỉ trên trang có hai nguồn: bản công bố trong /noi-bo và, khi chưa công bố, địa chỉ cố định
  // trong mã. Đổi địa chỉ trong /noi-bo mà một chỗ vẫn in bản trong mã thì một trang hiện hai địa chỉ.
  await nhom('7 · ĐỊA CHỈ ĐÃ CÔNG BỐ (dia-chi-cong-bo) TỚI ĐƯỢC MỌI CHỖ IN ĐỊA CHỈ; MÀN ĐẦU BỎ VẾ PHƯỜNG', async () => {
    const motDong = s => (s ?? '').replace(/\s+/g, ' ').trim();
    const chuCua = async chon => motDong(await page.locator(chon).first().innerText().catch(() => ''));
    const CONG_BO = DIA_CHI_CONG_BO_THU;
    const SAU_TANG = CONG_BO.replace(/^Tầng 3, /, '');                // menu gọn in sau chữ "Tầng 3" đậm
    const MAN_DAU = SAU_TANG.replace(', phường Thử', '');             // màn đầu: bản ngắn, bỏ vế phường
    ok(`Địa chỉ thử "${CONG_BO}" khác địa chỉ cố định trong mã "${DIA_CHI_NHA_HANG}", và có một vế phường để thử`,
       CONG_BO !== DIA_CHI_NHA_HANG && !CONG_BO.includes(DIA_CHI_NHA_HANG) && SAU_TANG !== CONG_BO && MAN_DAU !== SAU_TANG
         && MAN_DAU === '63 Hồ Tùng Mậu, TP. Hồ Chí Minh');
    const jsonLd = () => page.evaluate(() => {
      try { return JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent ?? 'null')?.address ?? null; }
      catch { return null; }
    });

    mayGia.datKichBan('dia-chi-cong-bo');
    for (const nn of NGON_NGU) {
      const t = chu(nn);
      const trangChu = duongDanTuongUng('/', nn);
      await page.goto(goc + trangChu, { waitUntil: 'load' });
      const manDau = await chuCua('main .kmd-dia-chi');
      const khoi = await chuCua('main .lt3 .lt3-dc');
      const chan = await chuCua('footer address p[lang="vi"]');
      const ld = await jsonLd();
      const chuChan = motDong(await chuTrang('footer'));
      const tot = [
        ok(`dia-chi-cong-bo ${trangChu}: màn đầu in "${t.tang3} · ${MAN_DAU}" — bản công bố, đã bỏ vế phường`,
           manDau === `${t.tang3} · ${MAN_DAU}`, manDau),
        ok(`dia-chi-cong-bo ${trangChu}: khối địa chỉ in nguyên bản công bố`, khoi === CONG_BO, khoi),
        ok(`dia-chi-cong-bo ${trangChu}: chân trang in nguyên bản công bố`, chan === CONG_BO, chan),
        ok(`dia-chi-cong-bo ${trangChu}: JSON-LD để cả bản công bố ở streetAddress, không thêm trường phường / thành phố`,
           JSON.stringify(ld) === JSON.stringify({ '@type': 'PostalAddress', streetAddress: CONG_BO, addressCountry: 'VN' }), JSON.stringify(ld)),
        ok(`dia-chi-cong-bo ${trangChu}: nút sao chép địa chỉ chép bản công bố`,
           await page.locator('main [data-sao-chep]').first().getAttribute('data-sao-chep') === CONG_BO),
        ok(`dia-chi-cong-bo ${trangChu}: cả trang không còn in địa chỉ cố định trong mã ("${DIA_CHI_NHA_HANG}")`,
           !motDong(await chuTrang()).includes(DIA_CHI_NHA_HANG)),
        ok(`dia-chi-cong-bo ${trangChu}: dòng địa chỉ pháp nhân không đổi theo bản công bố`, chuChan.includes(PHAP_NHAN.diaChi)),
        ok(`dia-chi-cong-bo ${trangChu}: câu chỉ đường vẫn đi kèm địa chỉ ở màn đầu và chân trang`,
           motDong(await chuTrang('main .kmd-loi-len')) === t.loiLen && chuChan.includes(t.loiLen)),
      ];
      // Câu hỏi thường gặp: mở câu "ở tầng mấy" rồi đọc.
      const cauHoi = page.locator('main details').filter({ hasText: CONG_BO }).first();
      tot.push(ok(`dia-chi-cong-bo ${trangChu}: câu hỏi thường gặp in bản công bố kèm câu chỉ đường`,
        await cauHoi.count() === 1 && motDong(await cauHoi.evaluate(el => { el.open = true; return el.innerText; })).includes(`${CONG_BO}. ${t.loiLen}`)));
      // Menu gọn (màn hẹp): sau chữ "Tầng 3" đậm là bản công bố, còn nguyên vế phường.
      const menu = page.locator('details.menu-gon').first();
      tot.push(ok(`dia-chi-cong-bo ${trangChu}: menu gọn in "${t.tang3} · ${SAU_TANG}"`,
        await menu.count() === 1
          && motDong(await menu.evaluate(el => { el.open = true; return el.querySelector('.mg-dia-chi')?.innerText ?? ''; })) === `${t.tang3} · ${SAU_TANG}`,
        await menu.count() ? motDong(await menu.evaluate(el => el.querySelector('.mg-dia-chi')?.innerText ?? '')) : 'không thấy menu gọn'));
      if (tot.includes(false)) await chupLoi(`dia-chi-cong-bo${trangChu}`);

      const denBeeftown = duongDanTuongUng('/den-beeftown', nn);
      await page.goto(goc + denBeeftown, { waitUntil: 'load' });
      const tot2 = [
        ok(`dia-chi-cong-bo ${denBeeftown}: khối "Địa chỉ và lối lên" in nguyên bản công bố`, await chuCua('main .lt3 .lt3-dc') === CONG_BO, await chuCua('main .lt3 .lt3-dc')),
        ok(`dia-chi-cong-bo ${denBeeftown}: bước 1 in nguyên bản công bố sau "Địa chỉ đầy đủ"`,
           (await chuCua('main .db-muc:nth-child(1) .db-chu p')).endsWith(CONG_BO), await chuCua('main .db-muc:nth-child(1) .db-chu p')),
        ok(`dia-chi-cong-bo ${denBeeftown}: JSON-LD để cả bản công bố ở streetAddress`, (await jsonLd())?.streetAddress === CONG_BO, JSON.stringify(await jsonLd())),
      ];
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      await page.goto(goc + hoiBan, { waitUntil: 'load' });
      tot2.push(ok(`dia-chi-cong-bo ${hoiBan}: khối địa chỉ bản gọn in nguyên bản công bố`, await chuCua('main .lt3-gon .lt3-dc') === CONG_BO, await chuCua('main .lt3-gon .lt3-dc')));
      if (tot2.includes(false)) await chupLoi(`dia-chi-cong-bo${denBeeftown}`);
    }

    // Gỡ bản công bố (về day-du: dia_chi_hien_thi là null) → trang in lại địa chỉ cố định trong mã, ở cùng các chỗ đó.
    mayGia.datKichBan('day-du');
    await page.goto(goc + '/', { waitUntil: 'load' });
    ok(`day-du /: chưa công bố địa chỉ → màn đầu, khối địa chỉ, chân trang, JSON-LD in địa chỉ cố định "${DIA_CHI_NHA_HANG}"`,
       await chuCua('main .kmd-dia-chi') === `${chu('vi').tang3} · ${DIA_CHI_NHA_HANG.replace(/^Tầng 3, /, '')}`
         && await chuCua('main .lt3 .lt3-dc') === DIA_CHI_NHA_HANG && await chuCua('footer address p[lang="vi"]') === DIA_CHI_NHA_HANG
         && DIA_CHI_NHA_HANG.startsWith((await jsonLd())?.streetAddress ?? '?') && !motDong(await chuTrang()).includes('phường Thử'),
       [await chuCua('main .kmd-dia-chi'), await chuCua('main .lt3 .lt3-dc'), await chuCua('footer address p[lang="vi"]'), JSON.stringify(await jsonLd())].join(' | '));
  });

  // =========================================================================
  // Bảng màu chép tay (THUONG-HIEU.md mục 1 và 4) — phép thử không đọc CSS của trang.
  const MAU = { trang: 'rgb(255, 255, 255)', nenNhat: 'rgb(244, 244, 244)', do: 'rgb(189, 0, 0)', doDam: 'rgb(143, 0, 0)' };
  /** Đo ô nhập và nhãn của các form khớp `chon` (chạy TRONG trang). */
  const doO = chon => {
    const TRANG = 'rgb(255, 255, 255)', VIEN = 'rgb(118, 118, 118)';
    const hien = el => { const k = el.getBoundingClientRect(); return el.checkVisibility() && k.width > 0 && k.height > 0; };
    const o = [...document.querySelectorAll(chon)]
      .flatMap(f => [...f.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), select, textarea')])
      .filter(e => hien(e) && !e.closest('[aria-hidden="true"]'));
    const oSai = [], nhanSai = [];
    for (const e of o) {
      const cs = getComputedStyle(e), k = e.getBoundingClientRect(), ten = e.name || e.id;
      // Ô một dòng (chữ, số điện thoại, ngày, ô chọn) cao ĐÚNG 48px — ô ngày của Chromium tự cao thêm 2px nếu
      // không ghim chiều cao, đứng cạnh nút 48px thì lệch nhau. Ô nhiều dòng (textarea) thì từ 48px trở lên.
      if (e.tagName === 'TEXTAREA' ? k.height < 47.5 : Math.abs(k.height - 48) > 0.5) {
        oSai.push(`${ten} (${e.tagName.toLowerCase()}${e.type ? ` ${e.type}` : ''}) cao ${k.height.toFixed(1)}px`);
      }
      if (cs.fontSize !== '16px') oSai.push(`${ten} chữ ${cs.fontSize}`);
      if (cs.backgroundColor !== TRANG) oSai.push(`${ten} nền ${cs.backgroundColor}`);
      if (cs.borderTopColor !== VIEN || cs.borderTopWidth !== '1px') oSai.push(`${ten} viền ${cs.borderTopWidth} ${cs.borderTopColor}`);
      if (e.hasAttribute('placeholder')) nhanSai.push(`${ten} dùng placeholder`);
      // Nhãn: <label for>, hoặc <span> đầu của <label> bọc ngoài ô (form nộp hồ sơ).
      const nhan = (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) || e.closest('label')?.querySelector(':scope > span');
      if (!nhan || !hien(nhan)) { nhanSai.push(`${ten} không có nhãn nhìn thấy`); continue; }
      const co = parseFloat(getComputedStyle(nhan).fontSize);
      if (co < 14 || co > 16) nhanSai.push(`nhãn của ${ten} cỡ ${co}px`);
      if (nhan.getBoundingClientRect().bottom > k.top + 0.5) nhanSai.push(`nhãn của ${ten} không nằm trên ô`);
    }
    return { soO: o.length, coNgay: o.some(e => e.type === 'date'), oSai, nhanSai };
  };

  // =========================================================================
  // Giờ mở cửa (23/11/2026): JSON-LD khai giờ thì khách phải đọc được giờ đó — chân trang và khối "Địa chỉ và lối lên" in cùng
  // khung giờ, cùng hai công tắc. Bộ nhớ 60 giây của gio-mo-cua.ts nằm trong server dev: kịch bản có giờ chạy SAU các kịch bản
  // không có giờ, và "chi nhánh chưa chốt" (cần bỏ bộ nhớ) kiểm ở crm/test/test-cong-khai-seo.mjs nhóm 4c.
  await nhom('7b · GIỜ MỞ CỬA HIỆN TRÊN TRANG: CHỈ KHI CẢ HAI CÔNG TẮC BẬT, CÙNG GIỜ VỚI JSON-LD, KHÔNG THÊM LỜI GỌI DATABASE', async () => {
    const motDong = s => (s ?? '').replace(/\s+/g, ' ').trim();
    const docGio = () => page.evaluate(() => {
      let ld = null;
      try { ld = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent ?? 'null'); } catch { /* không có */ }
      return {
        chan: [...document.querySelectorAll('footer .ct-gio')].map(e => e.textContent.trim()),
        khoi: [...document.querySelectorAll('main .lt3 .lt3-gio')].map(e => e.textContent.trim()),
        ld: (ld?.openingHoursSpecification ?? []).map(x => `${x.opens}–${x.closes}`),
      };
    });
    const TRANG_GIO = nn => ['/', '/den-beeftown', '/dat-ban'].map(d => duongDanTuongUng(d, nn));

    // Công tắc nội dung tắt (day-du: null; gio-tat: null dù chi nhánh đã chốt): không giờ ở đâu, không gọi database lần hai.
    for (const kb of ['day-du', 'gio-tat']) {
      mayGia.datKichBan(kb);
      const truoc = mayGia.dem().chi_nhanh_cong_khai ?? 0;
      const sai = [];
      for (const nn of NGON_NGU) for (const d of TRANG_GIO(nn)) {
        await page.goto(goc + d, { waitUntil: 'load' });
        const g = await docGio();
        if (g.chan.length || g.khoi.length || g.ld.length) sai.push(`${d}: ${JSON.stringify(g)}`);
      }
      ok(`${kb}: cổng giờ tắt → chân trang, khối địa chỉ, JSON-LD không có giờ nào`, sai.length === 0, sai.slice(0, 2).join(' | '));
      ok(`${kb}: cổng giờ tắt → không một lời gọi chi_nhanh_cong_khai`, (mayGia.dem().chi_nhanh_cong_khai ?? 0) === truoc, `${(mayGia.dem().chi_nhanh_cong_khai ?? 0) - truoc} lời gọi`);
    }

    // Cả hai công tắc bật: giờ do database trả (11:00–14:00, 17:00–23:00), in đúng chữ của từng thứ tiếng.
    mayGia.datKichBan('gio-cong-bo');
    const truoc = mayGia.dem().chi_nhanh_cong_khai ?? 0;
    const MONG = { vi: 'Mở cửa mỗi ngày: 11:00–14:00 và 17:00–23:00', en: 'Open every day: 11:00–14:00 and 17:00–23:00', ko: '매일 영업: 11:00–14:00, 17:00–23:00' };
    let soTrang = 0;
    for (const nn of NGON_NGU) {
      for (const d of TRANG_GIO(nn)) {
        await page.goto(goc + d, { waitUntil: 'load' });
        soTrang++;
        const g = await docGio();
        const coKhoi = !d.includes('dat-ban') && !d.includes('book');   // trang đặt bàn chỉ có bản gọn (không in giờ ở khối)
        ok(`${d}: chân trang có đúng một dòng "${MONG[nn]}"`, JSON.stringify(g.chan.map(motDong)) === JSON.stringify([MONG[nn]]), JSON.stringify(g.chan));
        ok(`${d}: ${coKhoi ? `khối "Địa chỉ và lối lên" có đúng một dòng "${MONG[nn]}"` : 'khối địa chỉ bản gọn không in giờ'}`,
           JSON.stringify(g.khoi.map(motDong)) === JSON.stringify(coKhoi ? [MONG[nn]] : []), JSON.stringify(g.khoi));
        ok(`${d}: JSON-LD khai đúng hai khung đang in trên trang (11:00–14:00, 17:00–23:00)`, JSON.stringify(g.ld) === JSON.stringify(['11:00–14:00', '17:00–23:00']), JSON.stringify(g.ld));
      }
    }
    // Chân trang, khối địa chỉ và JSON-LD cùng một lượt xem → một lần đọc; bộ nhớ 60 giây gánh phần còn lại.
    const goi = (mayGia.dem().chi_nhanh_cong_khai ?? 0) - truoc;
    ok(`Giờ in ở chân trang, khối địa chỉ và JSON-LD cùng một lần đọc mỗi lượt xem: ${soTrang} lượt xem chỉ ${goi} lời gọi chi_nhanh_cong_khai (bộ nhớ 60 giây)`, goi >= 1 && goi <= 2, `${goi} lời gọi`);
  });

  await nhom('8 · THÀNH PHẦN CỦA FORM Ở 390 VÀ 1440 PX: Ô NHẬP, Ô CHỌN GIỜ, THẺ, CÂU LỖI', async () => {
    for (const rong of [390, 1440]) {
      await page.setViewportSize({ width: rong, height: 900 });
      const doTheoQuyTac = async nhan => {
        // Con trỏ còn nằm ở chỗ vừa bấm trên trang trước: đưa nó ra góc, không thì nút nằm dưới con trỏ đứng yên ở
        // màu "di chuột" và bị đo nhầm. Chuyển màu về màu thường (180ms) thì doGiaoDien tự chờ xong (choDungYen).
        await page.mouse.move(0, 0);
        const gd = await page.evaluate(doGiaoDien);
        return Object.entries(PHEP_DO).map(([khoa, ten]) =>
          ok(`${nhan}: ${ten}`, gd[khoa]?.length === 0, (gd[khoa] ?? ['không đo được']).slice(0, 4).join(' | ')));
      };

      mayGia.datKichBan('day-du');
      for (const nn of NGON_NGU) {
        const hoiBan = duongDanTuongUng('/dat-ban', nn);
        // Bản nháp các nhóm trước để lại (họ tên, giờ đã chọn — giữ 15 phút) sẽ điền sẵn form: xóa rồi mới mở
        // trang, để form ở đúng trạng thái của một khách vừa tới.
        await page.goto(goc + hoiBan, { waitUntil: 'load' });
        await page.evaluate(k => sessionStorage.removeItem(k), KHOA_LUU);
        await page.goto(goc + hoiBan, { waitUntil: 'load' });
        const nhan = `${hoiBan} · ${rong}px`;
        const tot = await doTheoQuyTac(nhan);
        const o = await page.evaluate(doO, 'form[data-hoi-ban], form[data-doi-ngay]');
        tot.push(ok(`${nhan}: ${o.soO} ô nhập, ô chọn — ô một dòng (kể cả ô ngày) cao đúng 48px, chữ 16px, nền trắng, viền 1px #767676`,
          o.soO >= 5 && o.coNgay && o.oSai.length === 0, `${o.coNgay ? '' : 'không thấy ô ngày · '}${o.oSai.slice(0, 4).join(' | ')}`));
        tot.push(ok(`${nhan}: mỗi ô có nhãn 14–16px đặt trên ô, không ô nào dùng placeholder thay nhãn`,
          o.nhanSai.length === 0, o.nhanSai.slice(0, 4).join(' | ')));
        const nenThe = await page.locator('.hb-the').first().evaluate(el => getComputedStyle(el).backgroundColor);
        tot.push(ok(`${nhan}: thẻ form nền xám nhạt #F4F4F4`, nenThe === MAU.nenNhat, nenThe));

        const chip = page.locator('form[data-hoi-ban] .hb-chip-o:has(input:not([disabled]))').first();
        const doChip = () => chip.locator('span').evaluate(sp => {
          const cs = getComputedStyle(sp);
          return { nen: cs.backgroundColor, chu: cs.color, cao: sp.getBoundingClientRect().height, co: cs.fontSize };
        });
        const truoc = await doChip();
        await chip.click();
        await page.evaluate(choDungYen);   // ô đổi màu trong 180ms: đọc khi đã đổi xong, không chờ cứng
        const sau = await doChip();
        tot.push(ok(`${nhan}: ô giờ cao ≥ 48px, chữ 16px; chưa chọn nền trắng, đang chọn nền đỏ chữ trắng`,
          truoc.cao >= 47.5 && truoc.co === '16px' && truoc.nen === MAU.trang && sau.nen === MAU.do && sau.chu === MAU.trang,
          JSON.stringify({ truoc, sau })));

        // Gửi khi họ tên và số điện thoại còn trống: lỗi bằng chữ, sát ô, màu #8F0000 — đọc màu khi trang đã đứng yên.
        await nutGui().click();
        await page.evaluate(choDungYen);
        const loi = await page.evaluate(() => ({
          cau: [...document.querySelectorAll('form[data-hoi-ban] .loi-o')].filter(p => !p.hidden)
            .map(p => ({ chu: p.textContent.trim(), mau: getComputedStyle(p).color })),
          vien: [...document.querySelectorAll('form[data-hoi-ban] :is(input, select, textarea)[aria-invalid="true"]')]
            .map(e => getComputedStyle(e).borderTopColor),
          tieuDiem: (() => {
            const a = document.activeElement, cs = getComputedStyle(a);
            return { ten: a.getAttribute('name'), vong: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 };
          })(),
        }));
        tot.push(ok(`${nhan}: gửi thiếu họ tên và số điện thoại → 2 câu lỗi bằng chữ màu #8F0000, 2 ô sai viền #8F0000`,
          loi.cau.length === 2 && loi.cau.every(c => c.chu.length > 5 && c.mau === MAU.doDam)
            && loi.vien.length === 2 && loi.vien.every(v => v === MAU.doDam), JSON.stringify(loi)));
        tot.push(ok(`${nhan}: tiêu điểm vào ô sai đầu tiên (họ tên), vòng focus nhìn thấy (≥ 2px)`,
          loi.tieuDiem.ten === 'ho_ten' && loi.tieuDiem.vong, JSON.stringify(loi.tieuDiem)));
        tot.push(ok(`${nhan}: form báo lỗi vẫn giữ màu nền trong bảng 22/10/2026, không tràn ngang`,
          (await page.evaluate(doGiaoDien)).nenTrongBang.length === 0
            && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)));
        if (tot.includes(false)) await chupLoi(`thanh-phan${hoiBan}-${rong}`);
      }

      mayGia.datKichBan('tuyen-dung-mo');
      for (const nn of NGON_NGU) {
        const tuyenDung = duongDanTuongUng('/tuyen-dung', nn);
        await page.goto(goc + tuyenDung, { waitUntil: 'load' });
        const nhan = `tuyen-dung-mo ${tuyenDung} · ${rong}px`;
        if (!ok(`${nhan}: có thẻ vị trí thật và form nộp hồ sơ`,
                await page.locator('form.form-nop').count() === 1 && await page.locator('.the.vi-tri').count() === 2)) {
          await chupLoi(`thanh-phan${tuyenDung}-${rong}`);
          continue;
        }
        const tot = await doTheoQuyTac(nhan);
        const o = await page.evaluate(doO, 'form.form-nop');
        tot.push(ok(`${nhan}: ${o.soO} ô nhập, ô chọn — ô một dòng cao đúng 48px, chữ 16px, nền trắng, viền 1px #767676`,
          o.soO >= 6 && o.oSai.length === 0, o.oSai.slice(0, 4).join(' | ')));
        tot.push(ok(`${nhan}: mỗi ô có nhãn 14–16px đặt trên ô, không ô nào dùng placeholder thay nhãn`,
          o.nhanSai.length === 0, o.nhanSai.slice(0, 4).join(' | ')));
        if (tot.includes(false)) await chupLoi(`thanh-phan${tuyenDung}-${rong}`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  // Form nộp hồ sơ cùng khuôn với form hỏi bàn (rà soát nợ kỹ thuật 11/10/2026): chặn bấm đúp, lượt gửi
  // KHÔNG CHẮC không mời gửi lại (không dựng form dưới câu "đừng gửi lại"), database từ chối thì quay về
  // đúng vị trí đã chọn và điền lại chữ đã gõ, file CV quá 5MB báo sát ô trước khi gửi.
  await nhom('9 · FORM NỘP HỒ SƠ: BẤM ĐÚP, MẤT MẠNG, DATABASE TỪ CHỐI, CV QUÁ 5MB', async () => {
    const UNG_VIEN = { ho_ten: 'Ứng Viên Thử', sdt: '0912345680', vi_tri: 'SANH-THU' };
    const KHOA_UT = 'bt-ung-tuyen';
    const nutNop = () => page.locator('form.form-nop [type="submit"]').first();
    async function dienHoSo() {
      await page.selectOption('form.form-nop select[name="vi_tri"]', UNG_VIEN.vi_tri);
      await page.fill('form.form-nop [name="ho_ten"]', UNG_VIEN.ho_ten);
      await page.fill('form.form-nop [name="sdt"]', UNG_VIEN.sdt);
      await page.locator('form.form-nop input[name="dong_y"]').check({ force: true });
    }
    async function moTrang(duong) {
      await page.goto(goc + duong, { waitUntil: 'load' });
      await page.evaluate(k => sessionStorage.removeItem(k), KHOA_UT);
      await page.goto(goc + duong, { waitUntil: 'load' });
    }
    async function guiHoSo() {
      const sau = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
      await nutNop().click();
      await sau;
      await page.waitForLoadState('networkidle').catch(() => {});
      await cho(300);
    }

    for (const nn of NGON_NGU) {
      const tuyenDung = duongDanTuongUng('/tuyen-dung', nn);

      // --- Bấm đúp khi database trả lời chậm: đúng một lượt nộp ---------------------------------
      for (const cach of ['bấm đúp', 'bấm lần hai sau 0,3 giây']) {
        mayGia.datKichBan('tuyen-dung-mo', { cham: 1500 });
        await moTrang(tuyenDung);
        await dienHoSo();
        await nutNop().scrollIntoViewIfNeeded();
        const hop = await nutNop().boundingBox();
        const [x, y] = [hop.x + hop.width / 2, hop.y + hop.height / 2];
        await page.evaluate(k => {
          sessionStorage.removeItem(k);
          document.querySelector('form.form-nop')?.addEventListener('submit', () => {
            if (sessionStorage.getItem(k)) return;
            const b = document.querySelector('form.form-nop [type="submit"]');
            sessionStorage.setItem(k, JSON.stringify(b && { tat: b.disabled, ban: b.getAttribute('aria-busy'), chu: b.textContent.trim() }));
          });
        }, KHOA_NUT);
        // Không có gì chặn lần bấm thứ hai thì trình duyệt hủy lượt chuyển trang đầu (ERR_ABORTED):
        // bắt lại để phép thử báo đỏ ở các kiểm tra dưới, không làm sập cả lượt chạy.
        const sau = page.waitForNavigation({ waitUntil: 'load', timeout: 30000 })
          .catch(() => page.waitForLoadState('load'));
        if (cach === 'bấm đúp') await page.mouse.dblclick(x, y);
        else { await page.mouse.click(x, y); await cho(300); await page.mouse.click(x, y); }
        await sau;
        await page.waitForLoadState('networkidle').catch(() => {});
        const nut = await page.evaluate(k => {
          const v = sessionStorage.getItem(k);
          sessionStorage.removeItem(k);
          try { return JSON.parse(v ?? 'null'); } catch { return { loi: v }; }
        }, KHOA_NUT).catch(e => ({ loi: e.message }));
        await cho(1000);
        const dem = mayGia.dem().nop_ho_so_ung_tuyen ?? 0;
        const chu_ = await chuTrang();
        const nhan = `${tuyenDung} nộp hồ sơ (${cach})`;
        const tot = [
          ok(`${nhan}: đang gửi thì nút bị khóa, aria-busy="true", chữ "${DANG_GUI[nn]}"`,
             nut?.tat === true && nut?.ban === 'true' && nut?.chu.includes(DANG_GUI[nn]), JSON.stringify(nut)),
          ok(`${nhan}: nop_ho_so_ung_tuyen được gọi ĐÚNG MỘT lần`, dem === 1, `${dem} lần`),
          ok(`${nhan}: trang sau có thẻ "đã nhận" kèm mã hồ sơ`,
             await page.locator('[data-ket-qua="da-nhan"]').count() === 1 && /BT-UV-2610-/.test(chu_) && CHU_DA_NHAN[nn].test(chu_), chu_.slice(0, 200)),
          ok(`${nhan}: không có chữ "thành công"/"success"/"성공", không chữ cấm`,
             !CHU_THANH_CONG.test(chu_) && timChuoiCam(chu_).length === 0, chu_.match(CHU_THANH_CONG)?.[0]),
          ok(`${nhan}: tiêu điểm ở thẻ "đã nhận"; bản giữ tạm bị xóa`,
             await page.evaluate(() => document.activeElement?.getAttribute('data-ket-qua')) === 'da-nhan'
               && await page.evaluate(k => sessionStorage.getItem(k), KHOA_UT) === null),
        ];
        if (tot.includes(false)) await chupLoi(`ho-so-bam-hai-lan${tuyenDung}-${cach === 'bấm đúp' ? 'dup' : 'cach'}`);
      }

      // --- Mạng đứt giữa lượt gửi: KHÔNG CHẮC — không dựng lại form, không mời nộp -------------
      mayGia.datKichBan('tuyen-dung-dut');
      await moTrang(tuyenDung);
      await dienHoSo();
      await guiHoSo();
      {
        const chuMain = await chuTrang('main');
        const nhan = `tuyen-dung-dut ${tuyenDung}`;
        const tot = [
          ok(`${nhan}: khung "KHÔNG CHẮC đã ghi" hiện (role="alert", data-ket-qua="khong-chac")`,
             await page.locator('[role="alert"][data-ket-qua="khong-chac"]').count() === 1),
          ok(`${nhan}: KHÔNG dựng form nộp hồ sơ dưới câu "đừng gửi lại"`, await page.locator('form.form-nop').count() === 0),
          ok(`${nhan}: không nút "Nộp hồ sơ" ở đầu trang, không nút "Ứng tuyển vị trí này" trên thẻ`,
             await page.locator('main a.nut[href="#nop-ho-so"]').count() === 0 && await page.locator('.td-nut-the').count() === 0),
          ok(`${nhan}: vẫn có nút sang Facebook đã công bố để kiểm tra`,
             await page.locator(`#nop-ho-so a[href="${LIEN_HE_THU.facebook_url}"]`).count() === 1),
          ok(`${nhan}: KHÔNG có "đã nhận" / "received" / "접수되었"`, !BAT_KY_DA_NHAN.test(chuMain), chuMain.match(BAT_KY_DA_NHAN)?.[0]),
          ok(`${nhan}: tiêu điểm ở khung "không chắc"; bản giữ tạm bị xóa (gửi lại không còn là một cú bấm)`,
             await page.evaluate(() => document.activeElement?.getAttribute('data-ket-qua')) === 'khong-chac'
               && await page.evaluate(k => sessionStorage.getItem(k), KHOA_UT) === null),
          ok(`${nhan}: gửi một lần → nop_ho_so_ung_tuyen một lần (không tự gửi lại)`, (mayGia.dem().nop_ho_so_ung_tuyen ?? 0) === 1,
             `${mayGia.dem().nop_ho_so_ung_tuyen ?? 0} lần`),
        ];
        if (tot.includes(false)) await chupLoi(`tuyen-dung-dut${tuyenDung}`);
      }

      // --- Database từ chối (chưa ghi gì): quay về đúng vị trí, điền lại chữ đã gõ ---------------
      mayGia.datKichBan('tuyen-dung-loi');
      await moTrang(tuyenDung);
      await dienHoSo();
      await guiHoSo();
      {
        const o = await page.evaluate(() => ({
          vi_tri: document.querySelector('form.form-nop select[name="vi_tri"]')?.value ?? null,
          ho_ten: document.querySelector('form.form-nop [name="ho_ten"]')?.value ?? null,
          sdt: document.querySelector('form.form-nop [name="sdt"]')?.value ?? null,
          dong_y: document.querySelector('form.form-nop input[name="dong_y"]')?.checked ?? null,
        }));
        const khung = await chuTrang('[data-ket-qua="loi"]');
        const cau = nn === 'vi' ? 'Vị trí này đã hết hạn nhận hồ sơ' : cauLoiDatabase('Vị trí này đã hết hạn nhận hồ sơ', nn, '(câu chung)');
        const nhan = `tuyen-dung-loi ${tuyenDung}`;
        const tot = [
          ok(`${nhan}: câu từ chối của database hiện trong khung lỗi, đúng thứ tiếng ("${cau}")`, khung.includes(cau), khung.slice(0, 200)),
          ok(`${nhan}: URL quay về ?vi_tri=${UNG_VIEN.vi_tri}#nop-ho-so`,
             new URL(page.url()).searchParams.get('vi_tri') === UNG_VIEN.vi_tri && new URL(page.url()).hash === '#nop-ho-so', page.url()),
          ok(`${nhan}: vị trí, họ tên, số điện thoại đã chọn / đã gõ được điền lại; ô đồng ý KHÔNG tích sẵn`,
             o.vi_tri === UNG_VIEN.vi_tri && o.ho_ten === UNG_VIEN.ho_ten && o.sdt === UNG_VIEN.sdt && o.dong_y === false, JSON.stringify(o)),
          ok(`${nhan}: KHÔNG có "đã nhận"`, !BAT_KY_DA_NHAN.test(await chuTrang('main'))),
        ];
        if (tot.includes(false)) await chupLoi(`tuyen-dung-loi${tuyenDung}`);
      }

      // --- File CV lớn hơn 5MB: báo sát ô, không gửi ------------------------------------------
      mayGia.datKichBan('tuyen-dung-mo');
      await moTrang(tuyenDung);
      await dienHoSo();
      await page.setInputFiles('form.form-nop input[name="cv"]', {
        name: 'CV-qua-lon.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(5 * 1024 * 1024 + 1024, 0x25),
      });
      await nutNop().click();
      await cho(800);
      {
        const loiCv = await page.evaluate(() => {
          const p = document.querySelector('form.form-nop [data-loi="cv"]');
          const o = document.querySelector('form.form-nop input[name="cv"]');
          return { hien: !!p && !p.hidden, chu: p?.textContent?.trim() ?? '', mau: p ? getComputedStyle(p).color : '',
                   sai: o?.getAttribute('aria-invalid'), tieuDiem: document.activeElement?.getAttribute('name') };
        });
        const nhan = `CV quá 5MB ${tuyenDung}`;
        const tot = [
          ok(`${nhan}: không gửi (nop_ho_so_ung_tuyen 0 lần, vẫn ở trang form)`,
             (mayGia.dem().nop_ho_so_ung_tuyen ?? 0) === 0 && await page.locator('form.form-nop').count() === 1),
          ok(`${nhan}: câu lỗi sát ô CV, màu #8F0000, nói 5MB; ô CV aria-invalid, tiêu điểm vào ô CV`,
             loiCv.hien && /5MB/.test(loiCv.chu) && loiCv.mau === MAU.doDam && loiCv.sai === 'true' && loiCv.tieuDiem === 'cv',
             JSON.stringify(loiCv)),
          ok(`${nhan}: nút gửi không bị khóa (gửi được sau khi chọn file khác)`,
             await nutNop().evaluate(b => !b.disabled && b.getAttribute('aria-busy') !== 'true')),
        ];
        if (tot.includes(false)) await chupLoi(`cv-qua-lon${tuyenDung}`);
      }
    }
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  // Màn đầu trang chủ có ba trạng thái theo khóa ngay_khai_truong: chưa có ngày, sắp mở ("Đón bạn từ …"),
  // đã mở ("Mở cửa từ …"). CI không có database nên trinh-duyet.mjs chỉ thấy trạng thái đầu; hai trạng thái
  // sau là thứ khách thấy thật quanh ngày mở. Dòng trạng thái thử dài hai câu: ô trạng thái cao hơn cặp
  // địa chỉ + câu chỉ đường — đúng lúc hàng thông tin dễ lệch nhất.
  await nhom('10 · MÀN ĐẦU TRANG CHỦ THEO NGÀY KHAI TRƯƠNG: CHƯA CÓ NGÀY, SẮP MỞ (sap-mo), ĐÃ MỞ (da-mo) Ở 390, 900, 1024, 1440 PX', async () => {
    const motDong = s => (s ?? '').replace(/\s+/g, ' ').trim();
    const homNay = homNayVn();
    const TRANG_THAI = [['day-du', null], ['sap-mo', ngaySapMoThu()], ['da-mo', NGAY_DA_MO_THU]];
    ok(`Ngày thử: sap-mo ${ngaySapMoThu()} sau hôm nay ${homNay} (giờ Việt Nam), da-mo ${NGAY_DA_MO_THU} đã qua; dòng trạng thái thử dài hai câu`,
       ngaySapMoThu() > homNay && NGAY_DA_MO_THU <= homNay
         && Object.values(TRANG_THAI_THU).every(c => (c.match(/[.!?](\s|$)/g) ?? []).length === 2 && timChuoiCam(c).length === 0));
    for (const rong of [390, 900, 1024, 1440]) {
      await page.setViewportSize({ width: rong, height: rong < 600 ? 844 : 900 });
      for (const [kichBan, ngay] of TRANG_THAI) {
        mayGia.datKichBan(kichBan);
        for (const nn of NGON_NGU) {
          const t = chu(nn);
          const duong = duongDanTuongUng('/', nn);
          const nhan = `${kichBan} ${duong} · ${rong}px`;
          const r = await page.goto(goc + duong, { waitUntil: 'load' });
          await page.evaluate(() => document.fonts.ready);
          const kq = await page.evaluate(() => {
            const chon = c => document.querySelector(`main .kmd ${c}`);
            const [tin, dc, loiLen, ngayMo, trangThai] = ['.kmd-thong-tin', '.kmd-dia-chi', '.kmd-loi-len', '.kmd-ngay', '.kmd-trang-thai'].map(chon);
            const chu = e => (e?.textContent ?? '').replace(/\s+/g, ' ').trim();
            const soDong = el => {
              if (!el) return 0;
              const vung = document.createRange(); vung.selectNodeContents(el);
              const dinh = [];
              for (const o of vung.getClientRects()) if (o.width >= 1 && !dinh.some(d => Math.abs(d - o.top) < 6)) dinh.push(o.top);
              return dinh.length;
            };
            const khop = tin?.getBoundingClientRect();
            return {
              khe: dc && loiLen ? loiLen.getBoundingClientRect().top - dc.getBoundingClientRect().bottom : null,
              loiLen: chu(loiLen), ngay: ngayMo ? chu(ngayMo) : null, trangThai: chu(trangThai),
              dongNgay: soDong(ngayMo?.querySelector('strong')), dongCaNgay: soDong(ngayMo),
              tran: tin ? [...tin.children].filter(e => { const k = e.getBoundingClientRect(); return k.left < khop.left - 1 || k.right > khop.right + 1 || k.right > innerWidth; }).map(e => e.className) : ['không thấy hàng thông tin'],
              rongTrang: document.documentElement.scrollWidth, khung: innerWidth,
            };
          });
          // Như nhóm 8: con trỏ còn nằm ở chỗ nhóm trước vừa bấm — đưa ra góc, không thì nút nằm dưới con trỏ bị đo ở
          // màu "di chuột". Chuyển màu về màu thường thì doGiaoDien tự chờ xong (choDungYen), không chờ cứng.
          await page.mouse.move(0, 0);
          const gd = await page.evaluate(doGiaoDien);
          const saiGd = Object.keys(PHEP_DO).flatMap(khoa => (gd[khoa] ?? ['không đo được']).map(c => `[${khoa}] ${c}`));
          const ngayMong = ngay ? `${ngay <= homNay ? t.moCuaTu : t.donBanTu} ${dinhDangNgay(ngay, nn)}` : null;
          const tot = [
            ok(`${nhan}: HTTP 200, không cuộn ngang, không ô nào của hàng thông tin tràn khung`,
               r?.status() === 200 && kq.rongTrang <= kq.khung + 1 && kq.tran.length === 0,
               `HTTP ${r?.status()}, rộng ${kq.rongTrang}px / khung ${kq.khung}px, tràn: ${kq.tran.join(', ') || 'không'}`),
            ok(ngayMong ? `${nhan}: dòng ngày ghi "${ngayMong}"` : `${nhan}: chưa công bố ngày → không có dòng ngày`, kq.ngay === ngayMong, String(kq.ngay)),
            ok(`${nhan}: ${kichBan === 'day-du' ? 'chưa công bố câu trạng thái → không có dòng trạng thái (không câu dự phòng)' : 'dòng trạng thái là câu hai câu đã công bố'}`,
               kq.trangThai === (TRANG_THAI_THU[kichBan] ?? ''), kq.trangThai),
            ok(`${nhan}: câu chỉ đường nguyên văn, dính ngay dưới dòng địa chỉ (cách đáy địa chỉ −10 đến 8px)`,
               kq.loiLen === t.loiLen && kq.khe !== null && kq.khe >= -10 && kq.khe <= 8, `cách ${kq.khe?.toFixed(1)}px · «${kq.loiLen}»`),
            ok(`${nhan}: thành phần và khung trang đúng quy tắc (${Object.keys(PHEP_DO).length} phép đo của do-giao-dien.mjs)`,
               saiGd.length === 0, saiGd.slice(0, 5).join(' | ')),
          ];
          if (ngay) {
            tot.push(ok(`${nhan}: ngày nằm trên một dòng${rong >= 900 ? ', cả dòng "… từ <ngày>" cũng một dòng' : ''}`,
              kq.dongNgay === 1 && (rong < 900 || kq.dongCaNgay === 1), `ngày ${kq.dongNgay} dòng, cả dòng ${kq.dongCaNgay} dòng`));
          }
          if (tot.includes(false)) await chupLoi(`man-dau-${kichBan}-${tenTep(duong)}-${rong}`);
        }
      }
    }
    // 23/11/2026 — trang chạy như nhà hàng đang hoạt động: ngày khai trương đã qua mà chủ không công bố câu trạng thái →
    // màn đầu ghi "Mở cửa từ …", không có dòng trạng thái nào (không câu "đang chuẩn bị đón bạn"), thẻ mô tả là câu nền.
    mayGia.datKichBan('da-mo-chua-doi-cau');
    for (const nn of NGON_NGU) {
      const t = chu(nn);
      const duong = duongDanTuongUng('/', nn);
      await page.goto(goc + duong, { waitUntil: 'load' });
      const kq = await page.evaluate(() => ({
        ngay: (document.querySelector('main .kmd .kmd-ngay')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        coTrangThai: !!document.querySelector('main .kmd .kmd-trang-thai'),
        chuManDau: (document.querySelector('main .kmd')?.innerText ?? '').replace(/\s+/g, ' '),
        moTa: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      }));
      ok(`da-mo-chua-doi-cau ${duong}: dòng "${t.moCuaTu} ${dinhDangNgay(NGAY_DA_MO_THU, nn)}" và không có dòng trạng thái nào`,
         kq.ngay === `${t.moCuaTu} ${dinhDangNgay(NGAY_DA_MO_THU, nn)}` && !kq.coTrangThai, JSON.stringify(kq).slice(0, 300));
      ok(`da-mo-chua-doi-cau ${duong}: thẻ mô tả là câu nền`, kq.moTa === t.moTaNgan, kq.moTa);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  // Trang Thực đơn sau khi Khánh công bố danh mục của cuốn menu bản sáng. Ba phần là ba tab: bấm từng tab như
  // khách, cuộn cho ảnh lazy của phần vừa mở tải xong, rồi đo.
  await nhom('11 · THỰC ĐƠN BẢN SÁNG ĐÃ CÔNG BỐ: TỪNG MÓN, ẢNH VÀ NHÃN, CẢNH BÁO MÓN SỐNG, CÔNG TẮC ĐỒ UỐNG CÓ CỒN, MỌI BỀ RỘNG', async () => {
    // Phần của từng nhóm trên trang — theo loai của nhóm (lib/thuc-don.ts → VE_PHAN): gọi thêm và bò tại quầy
    // ở dải "Bò tại quầy", đồ uống ở "Đồ uống", còn lại ở "Món ăn".
    const PHAN_CUA_NHOM = { 'goi-them': 'bo-tai-quay', 'bo-tai-quay': 'bo-tai-quay', highball: 'do-uong', 'khong-con': 'do-uong', 'do-uong-signature': 'do-uong' };
    const phanCua = m => PHAN_CUA_NHOM[m.nhom] ?? 'mon-an';
    const NHAN_ANH = { vi: 'Ảnh minh họa', en: 'Illustrative image', ko: '연출 이미지' };
    /** Bấm tab, cuộn hết phần vừa mở cho ảnh lazy tải xong, về đầu trang; trả về các thẻ món đang hiện. */
    const moTab = async (p, phan) => {
      await p.locator(`#td-tab-${phan}`).click();
      // Chuột rời khỏi trang trước khi cuộn: chuột đứng yên ở chỗ tab trong lúc trang cuộn bên dưới thì "di chuột"
      // lên nút Hỏi bàn của dải đỏ, và nút dừng lại dưới con trỏ thì giữ màu di chuột — không phải lỗi giao diện.
      // Chuyển màu của tab vừa bấm, của phần tử vừa đi qua thì doGiaoDien tự chờ xong (choDungYen).
      await p.mouse.move(0, 0);
      return p.evaluate(async phan => {
        const khoi = document.getElementById(phan);
        const dau = khoi.getBoundingClientRect().top + scrollY;
        for (let y = dau; y < dau + khoi.offsetHeight; y += 500) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)); }
        for (let i = 0; i < 100; i++) {
          const cho = [...khoi.querySelectorAll('figure.anh img')].filter(a => a.checkVisibility() && !(a.complete && a.naturalWidth > 0));
          if (!cho.length) break;
          await new Promise(r => setTimeout(r, 100));
        }
        scrollTo({ top: 0, behavior: 'instant' });
        const anhCua = f => f && {
          src: f.querySelector('img')?.getAttribute('src') ?? '', alt: f.querySelector('img')?.getAttribute('alt') ?? '',
          nhan: f.querySelector('figcaption')?.checkVisibility() ? f.querySelector('figcaption').textContent.trim() : '',
          daVe: !!f.querySelector('img')?.complete && (f.querySelector('img')?.naturalWidth ?? 0) > 0,
        };
        return {
          hien: [...document.querySelectorAll('.td-phan')].filter(x => x.checkVisibility()).map(x => x.id),
          mon: [...khoi.querySelectorAll('.tdn-mon, .td-nhom .mon')].filter(x => x.checkVisibility()).map(x => {
            const anh = x.classList.contains('tdn-lon') ? x.closest('.tdn-mo')?.querySelector('.tdn-lon-anh figure.anh') : x.querySelector('figure.anh');
            return {
              ten: (x.querySelector('.tdm-ten, .mon-ten')?.textContent ?? '').trim(),
              chu: x.innerText,
              anh: anhCua(anh),
            };
          }),
          cau: Object.fromEntries([...khoi.querySelectorAll('.tdn')].map(n => [n.querySelector('.tdn-ten')?.id ?? '', n.querySelector('.tdn-cau')?.textContent.trim() ?? null])),
          giaPhanTu: document.querySelectorAll('.mon-gia').length,
        };
      }, phan);
    };

    // Chữ đang hiện của một trang (chuTrang() ở trên đọc trang chung `page`; ở đây mỗi bề rộng một context riêng).
    const chuTrangCua = async (p, chon) => (await p.locator(chon).first().innerText().catch(() => '')) ?? '';
    const thu = async ({ kichBan, nn, rong, monMong, kiemThem = () => [] }) => {
      mayGia.datKichBan(kichBan);
      const c = await trinhDuyet.newContext({ viewport: { width: rong, height: rong < 600 ? 800 : 900 } });
      const p = await c.newPage();
      const loiJs = [];
      p.on('pageerror', e => loiJs.push(e.message));
      const duong = duongDanTuongUng('/thuc-don', nn);
      const nhan = `${kichBan} ${duong} · ${rong}px`;
      try {
        await p.goto(goc + duong, { waitUntil: 'load', timeout: 60000 });
        const tot = [];
        let thay = [];
        let chuCaTrang = '';
        for (const phan of ['mon-an', 'do-uong', 'bo-tai-quay']) {
          const kq = await moTab(p, phan);
          const gd = await p.evaluate(doGiaoDien);
          const saiGd = Object.keys(PHEP_DO).flatMap(khoa => (gd[khoa] ?? ['không đo được']).map(x => `[${khoa}] ${x}`));
          const tran = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          tot.push(
            ok(`${nhan} · tab #${phan}: đúng phần này hiện, không cuộn ngang, đủ ${Object.keys(PHEP_DO).length} phép đo của do-giao-dien.mjs`,
               kq.hien.join() === phan && tran <= 1 && saiGd.length === 0, [`hiện: ${kq.hien.join(', ')}`, tran > 1 ? `tràn ${tran}px` : '', ...saiGd.slice(0, 4)].filter(Boolean).join(' | ')),
          );
          // Mỗi món mong đợi của phần này hiện đúng tên; có ảnh thì ảnh đúng, alt đúng thứ tiếng, nhãn đang hiện.
          for (const m of monMong.filter(x => phanCua(x) === phan)) {
            const the = kq.mon.find(x => x.ten === m.ten[nn]);
            const a = ANH_CUA_MON[m.ma];
            const sai = !the ? ['không thấy thẻ món'] : [
              ...(a ? [!the.anh ? 'thiếu ảnh' : !the.anh.src.includes(`/anh/${a.id}-${a.khung}-`) ? `ảnh ${the.anh.src}` : '',
                the.anh && the.anh.alt !== DANH_MUC_ANH[a.id].alt[nn] ? 'alt sai thứ tiếng / sai ảnh' : '',
                the.anh && the.anh.nhan !== NHAN_ANH[nn] ? `nhãn «${the.anh.nhan}»` : '', the.anh && !the.anh.daVe ? 'ảnh chưa tải về' : '']
                : [the.anh ? 'món không có trong ANH_CUA_MON mà có ảnh' : '']),
              m.moTa && !the.chu.includes(m.moTa[nn]) ? 'thiếu mô tả' : '',
              m.laMonSong && !(thuong(the.chu).includes(thuong(NHAN_MON.monSong[nn])) && the.chu.includes(m.canhBao[nn])) ? 'món sống thiếu nhãn hoặc câu cảnh báo' : '',
            ].filter(Boolean);
            thay.push(m.ma);
            tot.push(ok(`${nhan} · ${m.ma} «${m.ten[nn]}»: hiện đúng tên${a ? ', ảnh, alt, nhãn' : ''}${m.laMonSong ? ', nhãn Món sống và câu cảnh báo' : ''}`, sai.length === 0, sai.join(' · ')));
          }
          // Câu dưới tên nhóm: đúng chữ CAU_NHOM; nhóm không có trong CAU_NHOM thì không in câu nào.
          for (const [idNhom, cau] of Object.entries(kq.cau)) {
            const ma = idNhom.replace(/^tdn-/, '');
            const mong = CAU_NHOM[ma]?.[nn] ?? null;
            tot.push(ok(`${nhan} · nhóm ${ma}: ${mong ? `câu dưới tên nhóm «${mong}»` : 'không có câu dưới tên nhóm'}`, cau === mong, `thấy «${cau}»`));
          }
          tot.push(ok(`${nhan} · tab #${phan}: không phần tử giá (.mon-gia)`, kq.giaPhanTu === 0, `${kq.giaPhanTu} phần tử`));
          if (phan === 'do-uong') {
            // Đã công bố đồ uống mà chưa có món không cồn nào (day-du: chỉ ba ly signature, đều có cồn): cột thực đơn
            // mở đầu bằng tên các nhóm không cồn, đứng trước nhóm đầu tiên — cạnh ảnh ba ly không cồn. Có món không
            // cồn (thuc-don-thu-suc) hay chưa công bố đồ uống nào (khong-con-tat) thì không có danh sách này.
            const uong = monMong.filter(m => phanCua(m) === 'do-uong');
            const tChu = chu(nn);
            const mong = uong.length && !uong.some(m => !m.coCon) ? [tChu.nhomNuocEp, tChu.nhomNuocNgot, tChu.nhomNuocSuoi] : [];
            const thayDs = await p.evaluate(() => {
              const ds = document.querySelector('#do-uong .td-uong-khong-con');
              const nhomDau = document.querySelector('#do-uong .td-chinh .tdn, #do-uong .td-chinh .td-nhom');
              return {
                ten: [...(ds?.querySelectorAll('.td-dm-ten') ?? [])].map(e => e.textContent.trim()),
                hien: !!ds?.checkVisibility(),
                truoc: !ds || !nhomDau || ds.getBoundingClientRect().bottom <= nhomDau.getBoundingClientRect().top + 0.5,
              };
            });
            tot.push(ok(mong.length
              ? `${nhan} · tab #do-uong: chưa có đồ uống không cồn nào công bố → tên ba nhóm không cồn (${mong.join(', ')}) hiện trước nhóm đầu tiên`
              : `${nhan} · tab #do-uong: không có danh sách nhóm không cồn chen trước đồ uống đã công bố`,
              JSON.stringify(thayDs.ten) === JSON.stringify(mong) && (!mong.length || (thayDs.hien && thayDs.truoc)),
              `thấy ${JSON.stringify(thayDs.ten)}, hiện ${thayDs.hien}, đứng trước ${thayDs.truoc}`));
          }
          chuCaTrang += '\n' + await chuTrangCua(p, 'main');
        }
        const cam = timChuoiCam(chuCaTrang);
        tot.push(
          ok(`${nhan}: KHÔNG một số tiền nào, không chữ cấm trên cả ba tab`, cam.length === 0, cam.map(x => x.tim_thay).join(' · ')),
          ok(`${nhan}: không lỗi JavaScript`, loiJs.length === 0, loiJs.slice(0, 3).join(' | ')),
          ...kiemThem(chuCaTrang),
        );
        if ((await Promise.all(tot)).includes(false)) {
          mkdirSync(ANH_LOI, { recursive: true });
          await p.screenshot({ path: join(ANH_LOI, `thuc-don-${kichBan}-${nn}-${rong}.png`), fullPage: true }).catch(() => {});
        }
      } finally {
        await c.close();
      }
    };
    const CO_DAY_DU = [[320, 'vi'], [360, 'vi'], [390, 'vi'], [430, 'vi'], [768, 'vi'], [1024, 'vi'], [1440, 'vi'],
      [390, 'en'], [1440, 'en'], [390, 'ko'], [1440, 'ko']];
    for (const [rong, nn] of CO_DAY_DU) {
      // Dữ liệu giả day-du: 22 món ăn và ba ly signature — mọi món phải hiện ở đúng phần.
      await thu({ kichBan: 'day-du', nn, rong, monMong: MON_MAU });
    }
    for (const [rong, nn] of [[390, 'vi'], [1440, 'vi'], [390, 'en'], [1440, 'ko']]) {
      const coCon = MON_MAU.filter(m => m.coCon);
      await thu({
        kichBan: 'khong-con-tat', nn, rong, monMong: MON_MAU.filter(m => !m.coCon),
        kiemThem: chuDoc => [
          ok(`khong-con-tat ${duongDanTuongUng('/thuc-don', nn)} · ${rong}px: công tắc đồ uống có cồn tắt → không ly signature nào, không nhãn "${NHAN_MON.coCon[nn]}", không dòng luật rượu`,
             !coCon.some(m => chuDoc.includes(m.ten[nn])) && !thuong(chuDoc).includes(thuong(NHAN_MON.coCon[nn])) && !chuDoc.includes(chu(nn).luatRuou),
             coCon.filter(m => chuDoc.includes(m.ten[nn])).map(m => m.ten[nn]).join(', ')),
        ],
      });
    }
    for (const [rong, nn] of [[320, 'vi'], [360, 'vi'], [390, 'vi'], [768, 'vi'], [1024, 'vi'], [1440, 'vi'], [390, 'ko'], [1440, 'ko'], [390, 'en']]) {
      await thu({ kichBan: 'thuc-don-thu-suc', nn, rong, monMong: [...MON_MAU, ...MON_THU_SUC] });
    }
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  // Trang Mua thịt về khi đã nối database — khách đặt thẳng trên website (0113). Supabase giả trả menu thử MENU_THU
  // (giá THỬ) theo kịch bản mua-thit-* và ghi đơn (tao_don_mua_thit). Đơn mong đợi tính bằng CHÍNH lib của trang
  // (don-mua-thit.ts); câu "đã nhận" đọc từ dat-hang-mua-thit.ts. "Hiện / không hiện" đo bằng isVisible().
  // Câu cạnh nút Đặt hàng (Khánh giao 16/11/2026, hồ sơ thông báo website thương mại điện tử): ba link, chép tay.
  const LINK_DAT_HANG = {
    vi: [['/quyen-rieng-tu', 'Quyền riêng tư'], ['/dieu-khoan', 'Điều khoản'], ['/doi-tra-hoan-tien', 'Đổi trả và hoàn tiền']],
    en: [['/en/privacy', 'Privacy'], ['/en/terms', 'Terms'], ['/en/returns', 'Returns and refunds']],
    ko: [['/ko/privacy', '개인정보 처리방침'], ['/ko/terms', '이용약관'], ['/ko/returns', '교환·환불']],
  };
  const CAU_CHINH_SACH = {
    vi: { duoi: 'Xem Quyền riêng tư, Điều khoản, Đổi trả và hoàn tiền.' },
    en: { duoi: 'See Privacy, Terms, Returns and refunds.' },
    ko: { duoi: '자세한 내용: 개인정보 처리방침, 이용약관, 교환·환불.' },
  };
  await nhom('12 · MUA THỊT VỀ: CHỌN GÓI, ĐẶT HÀNG, BẤM ĐÚP, TẮT JAVASCRIPT, DATABASE TỪ CHỐI, MẤT MẠNG, BỀ RỘNG', async () => {
    const ba = (vi, en, ko) => ({ vi, en, ko });
    const TAM_HET = ba('Tạm hết ở quầy', 'Sold out at the counter for now', '지금은 매장에 재고가 없어요');
    const TU = ba('Từ', 'From', '최저');
    // Đợt 3: cỡ gói dưới giá, dòng gu, cách dùng trong hộp, dải ba điều (chưa cài VNPay — máy thử không có bí mật VNPay).
    const SO_CO = { goi: ba(n => `${n} cỡ gói`, n => `${n} pack sizes`, n => `팩 크기 ${n}가지`), hop: ba(n => `${n} cỡ hộp`, n => `${n} box sizes`, n => `통 크기 ${n}가지`) };
    const GU_LA = ba('Gu:', 'Taste:', '맛:');
    const CACH_DUNG = ba('Cách dùng:', 'How to use:', '드시는 방법:');
    const BA_DIEU = ba(['Giao tận nơi', 'Trả khi nhận hàng', 'Quán gọi xác nhận đơn'],
                       ['Delivered to your door', 'Pay on delivery', 'We call to confirm your order'],
                       ['원하시는 주소로 배달해요', '받으실 때 결제해요', '매장에서 전화로 주문을 확인해요']);
    const LOC = ba(['Tất cả', 'Thịt mát', 'Thịt đông lạnh', 'Kim chi'], ['All', 'Chilled beef', 'Frozen beef', 'Kimchi'], ['전체', '냉장 소고기', '냉동 소고기', '김치']);
    const LOI_H1 = ba('Chưa tải được danh sách gói', 'We could not load the packs right now', '지금은 팩 목록을 불러오지 못했어요');
    const HET_QUAY = ba('Các gói đang tạm hết ở quầy.', 'Every pack is sold out at the counter for now.', '지금은 모든 팩이 매장에 재고가 없어요.');
    const DAT_HANG = ba('Đặt hàng', 'Place order', '주문하기');
    const KHONG_CHAC_H1 = ba('Chưa rõ đơn đã được ghi nhận', 'We are not sure your order was recorded', '주문 접수 여부를 확인하지 못했어요');
    const QUAY = /nhận tại quầy|pick up at the counter|매장 픽업/i;
    const KHACH_MUA = { ho_ten: 'Nguyễn Thị Hoa', sdt: '0912 345 678', dia_chi: '12 Nguyễn Huệ, phường Sài Gòn' };
    const motDong = s => (s ?? '').replace(/\s+/g, ' ').trim();
    const duongMua = nn => duongDanTuongUng('/mua-thit-ve', nn);
    const menuCua = (kichBan, nn) => nhomMuaThitVe(menuMuaThitVe(kichBan, nn));
    const dongMong = (don, nn) => don.dong.map(d =>
      motDong(CHU_DON.dongDau[nn](tenHienThi(d.sanPham, nn), nhanGoi(d.sanPham.donVi, d.goi.soGam, nn), d.soLuong) + dinhDangTien(d.thanhTien)));
    const coDuLieuKhach = s => s.includes('0912') || s.includes('Hoa') || s.includes('Nguy');

    const mo = async (duong, { rong = 390, cao, js = true } = {}) => {
      const c = await trinhDuyet.newContext({ viewport: { width: rong, height: cao ?? (rong < 600 ? 844 : 900) }, javaScriptEnabled: js });
      const p = await c.newPage();
      const loiJs = [];
      p.on('pageerror', e => loiJs.push(e.message));
      p.on('console', m => { if (m.type() === 'error' && (m.location().url || goc).startsWith(goc)) loiJs.push(m.text()); });
      const batDau = Date.now();
      const r = await p.goto(goc + duong, { waitUntil: 'load', timeout: 60000 });
      return { c, p, r, loiJs, thoiGian: Date.now() - batDau };
    };
    const chupP = async (p, ten) => {
      mkdirSync(ANH_LOI, { recursive: true });
      await p.screenshot({ path: join(ANH_LOI, `mua-thit-${ten.replace(/[^a-z0-9-]+/gi, '_')}.png`), fullPage: true }).catch(() => {});
    };
    const dieuHuong = async (p, nn) => ({
      so: await p.locator('header .mg-muc > li').count(),
      coMua: await p.locator(`header nav a[href="${duongMua(nn)}"]`).count() > 0,
    });
    // Thẻ gọn kiểu El Gaucho (Khánh 03/11/2026): trên thẻ chỉ tên, giá "Từ …" (một gói: nhãn gói và giá), nút "Chọn gói"
    // hay chữ tạm hết; hàng gói, giá từng gói, ô chọn nằm trong hộp chọn (popover, đóng khi mới vào trang).
    const docThe = p => p.evaluate(() => [...document.querySelectorAll('#chon-goi article')].map(a => {
      const nut = a.querySelector('[data-mtv-mo-hop]');
      const hop = a.querySelector('[data-mtv-hop]');
      return {
        ten: a.querySelector('h3')?.textContent.trim() ?? '',
        lang: a.querySelector('h3')?.getAttribute('lang') ?? null,
        lienKet: a.querySelector('.mtv-ve-phan a')?.getAttribute('href') ?? null,
        giaTu: (a.querySelector('.mtv-gia-tu')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        nut: !!nut && nut.checkVisibility(),
        tamHetThe: a.querySelector('.mtv-the-chan [data-mtv-tam-het]')?.textContent.trim() ?? null,
        hopDong: !hop || !hop.checkVisibility(),
        nhan: [...a.querySelectorAll('.mtv-goi .mtv-nhan-goi')].map(e => e.textContent.trim()),
        gia: [...a.querySelectorAll('.mtv-goi .mtv-gia[data-tien]')].map(e => e.textContent.trim()),
        tamHet: [...a.querySelectorAll('.mtv-goi [data-mtv-tam-het]')].map(e => e.textContent.trim()),
        o: [...a.querySelectorAll('select.mtv-so')].map(e => e.name),
        coGoi: (a.querySelector('.mtv-the-chan .mtv-co-goi')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        gu: a.querySelector('.mtv-gu')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
        cachDung: a.querySelector('[data-mtv-hop] .mtv-cach-dung')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      };
    }));
    const theMong = (menu, nn, coOChon, kichBan) => chiaNhom(menu).flatMap(n => n.sanPham).map(sp => {
      const datDuoc = sp.goi.filter(g => !g.tamHet);
      const coHop = coOChon && datDuoc.length > 0;
      const re = (datDuoc.length ? datDuoc : sp.goi).reduce((a, b) => (b.gia < a.gia ? b : a));
      const gu = boTaiQuayTheoGu(kichBan, nn).find(x => x.san_pham_ma === sp.ma)?.gu ?? [];
      return {
        ten: tenHienThi(sp, nn),
        // Tên đã đổi sang tên Việt / Hàn thì không còn là tên tiếng Việt lạc giữa trang khác: không lang="vi".
        lang: tenHienThi(sp, nn) === sp.ten && nn !== 'vi' && sp.ten === sp.tenVi ? 'vi' : null,
        lienKet: lienKetPhanThit(sp, nn),
        giaTu: sp.goi.length === 1 ? dinhDangTien(re.gia) : `${TU[nn]} ${dinhDangTien(re.gia)}`,
        nut: coHop,
        tamHetThe: coHop ? null : TAM_HET[nn],
        hopDong: true,
        nhan: coHop ? sp.goi.map(g => nhanGoi(sp.donVi, g.soGam, nn)) : [],
        gia: coHop ? sp.goi.map(g => dinhDangTien(g.gia)) : [],
        tamHet: coHop ? sp.goi.filter(g => g.tamHet).map(() => TAM_HET[nn]) : [],
        o: coHop ? datDuoc.map(g => g.khoa) : [],
        coGoi: sp.goi.length === 1 ? nhanGoi(sp.donVi, re.soGam, nn) : SO_CO[sp.donVi][nn](sp.goi.length),
        gu: sp.loai === 'thit' && gu.length ? `${GU_LA[nn]} ${gu.map(g => TEN_GU[g][nn]).join(' · ')}` : null,
        cachDung: coHop && sp.cachDung ? `${CACH_DUNG[nn]} ${sp.cachDung}` : null,
      };
    });
    /** Mở hộp chọn của thẻ có gói `khoa` (nút "Chọn gói"), làm `viec(hop)` trong hộp, rồi bấm Xong. */
    const trongHop = async (p, khoa, viec) => {
      const the = p.locator('#chon-goi article', { has: p.locator(`select.mtv-so[name="${khoa}"]`) });
      await the.locator('[data-mtv-mo-hop]').click();
      const hop = the.locator('[data-mtv-hop]');
      await hop.locator(`select.mtv-so[name="${khoa}"]`).waitFor({ state: 'visible', timeout: 5000 });
      await viec(hop);
      await hop.locator('.nut-chinh').click();
      await hop.waitFor({ state: 'hidden', timeout: 5000 });
    };
    const chonSo = (p, khoa, so) => trongHop(p, khoa, hop => hop.locator(`select.mtv-so[name="${khoa}"]`).selectOption(so));
    const moTaMeta = p => p.evaluate(() => document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '');
    const tranNgang = p => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    /** Điền ba ô liên hệ (bỏ qua ô đã có chữ khi giu = true). */
    const dien = async p => { for (const [ten, v] of Object.entries(KHACH_MUA)) await p.fill(`form[data-mtv-form] [name="${ten}"]`, v); };
    const nutDat = p => p.locator('form[data-mtv-form] [data-mtv-nut-dat]');
    const datVaCho = async (p, { dup = false } = {}) => {
      const nut = nutDat(p);
      await nut.scrollIntoViewIfNeeded();
      const hop = await nut.boundingBox();
      const sau = p.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
      if (dup) await p.mouse.dblclick(hop.x + hop.width / 2, hop.y + hop.height / 2);
      else await p.mouse.click(hop.x + hop.width / 2, hop.y + hop.height / 2);
      await sau;
      await p.waitForLoadState('networkidle').catch(() => {});
    };
    const goiDat = () => mayGia.nhatKy().filter(x => x.ham === 'tao_don_mua_thit');

    // ---- mua-thit-mo: danh sách gói, ô giao hàng, không Zalo, không nhận tại quầy, bề rộng ----------------------
    mayGia.datKichBan('mua-thit-mo');
    for (const nn of NGON_NGU) {
      const menu = menuCua('mua-thit-mo', nn);
      for (const rong of [390, 1440]) {
        const { c, p, r, loiJs } = await mo(duongMua(nn), { rong });
        const nhan = `mua-thit-mo ${duongMua(nn)} · ${rong}px`;
        try {
          const the = await docThe(p);
          const chuChinh = await p.locator('main').innerText();
          const dh = await dieuHuong(p, nn);
          const tot = [
            ok(`${nhan}: HTTP 200, một h1, không lỗi JavaScript`, r?.status() === 200 && await p.locator('h1').count() === 1 && !loiJs.length,
               `HTTP ${r?.status()} ${loiJs.slice(0, 2).join(' | ')}`),
            ok(`${nhan}: thẻ gọn đúng nhóm (tên, "Từ" + giá rẻ nhất, nút "Chọn gói", hộp đóng); trong hộp đúng nhãn gói, giá trong [data-tien], gói tạm hết có giá không ô chọn`,
               JSON.stringify(the) === JSON.stringify(theMong(menu, nn, true, 'mua-thit-mo')), JSON.stringify(the).slice(0, 400)),
            ok(`${nhan}: ô họ tên, số điện thoại, địa chỉ, ghi chú hiện và có nhãn; nút "${DAT_HANG[nn]}"`,
               (await Promise.all(['ho_ten', 'sdt', 'dia_chi', 'ghi_chu'].map(async ten => {
                 const o = p.locator(`form[data-mtv-form] [name="${ten}"]`);
                 const id = await o.getAttribute('id');
                 return await o.isVisible() && await p.locator(`label[for="${id}"]`).count() === 1;
               }))).every(Boolean) && motDong(await nutDat(p).innerText()) === DAT_HANG[nn]),
            ok(`${nhan}: không Zalo (không link chat, không khung chép đơn), không "nhận tại quầy"`,
               await p.locator('main a[href*="zalo.me"]').count() === 0 && await p.locator('main textarea[readonly]').count() === 0 && !QUAY.test(chuChinh)),
            ok(`${nhan}: điều hướng năm mục có Mua thịt về; meta description là câu mở`,
               dh.so === 5 && dh.coMua && await moTaMeta(p) === chu(nn).moTaMuaThit, `${dh.so} mục · ${await moTaMeta(p)}`),
            ok(`${nhan}: không tràn ngang`, await tranNgang(p) <= 0, `${await tranNgang(p)} px`),
            ok(`${nhan}: thanh giỏ chưa hiện khi giỏ rỗng`, !(await p.locator('[data-mtv-thanh]').isVisible())),
          ];
          // Phép đo giao diện của do-giao-dien.mjs trên trang đang mở (thẻ gọn), rồi lần nữa khi hộp chọn đang mở.
          const saiGd = async () => {
            const gd = await p.evaluate(doGiaoDien);
            return Object.keys(PHEP_DO).flatMap(khoa => (gd[khoa] ?? ['không đo được']).map(x => `[${khoa}] ${x}`));
          };
          const saiThe = await saiGd();
          tot.push(ok(`${nhan}: thẻ gọn đúng ${Object.keys(PHEP_DO).length} phép đo của do-giao-dien.mjs`, saiThe.length === 0, saiThe.slice(0, 5).join(' | ')));
          await p.locator('[data-mtv-mo-hop]').first().click();
          await p.locator('[data-mtv-hop]:popover-open').waitFor({ timeout: 5000 });
          // Nền mờ sau hộp không giữ con trỏ (popover không chặn trang phía sau): từ 600px hộp nằm giữa màn, không phủ lên
          // nút vừa bấm, nên con trỏ để lại trên "Chọn gói" giữ nút ở màu di chuột (xám E2) — đưa con trỏ ra góc rồi đo;
          // doGiaoDien chờ nút chuyển màu về trắng xong (choDungYen). Trước đây phép đo chạy ngay sau cú bấm: máy rảnh thì
          // đạt nhờ chuyển màu sang xám chưa kịp chạy, máy bận thì đo được màu đang chuyển dở (rgb(253, 253, 253)).
          await p.mouse.move(0, 0);
          const saiHop = await saiGd();
          const tranHop = await tranNgang(p);
          tot.push(ok(`${nhan}: hộp chọn đang mở đúng ${Object.keys(PHEP_DO).length} phép đo, không tràn ngang`, saiHop.length === 0 && tranHop <= 0,
                      `${tranHop} px · ${saiHop.slice(0, 5).join(' | ')}`));
          await p.keyboard.press('Escape');
          // Đợt 3 · dải ba điều (chưa cài VNPay), dòng phụ thứ ba là giờ giao đã công bố.
          const dieu = (await p.locator('.mtv-ba-dieu .mtv-dieu').allInnerTexts()).map(motDong);
          const phuGio = motDong(await p.locator('.mtv-ba-dieu li').nth(2).locator('.mtv-dieu-phu').innerText().catch(() => ''));
          tot.push(ok(`${nhan}: dải ba điều — ${BA_DIEU[nn].join(' · ')}; dòng phụ thứ ba là giờ giao đã công bố`,
                      JSON.stringify(dieu) === JSON.stringify(BA_DIEU[nn]) && phuGio === motDong(GIO_NHAN_THU[nn]), `${JSON.stringify(dieu)} · ${phuGio}`));
          // Khánh giao 16/11/2026 · câu cạnh nút Đặt hàng: "Xem Quyền riêng tư, Điều khoản, Đổi trả và hoàn tiền." — ba link
          // đúng thứ tiếng, chữ liền (không dính ở chỗ ghép). Chép tay, không đọc lib/chinh-sach.ts.
          const cauCs = p.locator('.mtv-don [data-chinh-sach]');
          const linkCs = await cauCs.locator('a').evaluateAll(as => as.map(a => [a.getAttribute('href'), a.textContent.trim()]));
          const chuCs = motDong(await cauCs.innerText().catch(() => ''));
          tot.push(ok(`${nhan}: câu cạnh nút Đặt hàng kết bằng "${CAU_CHINH_SACH[nn].duoi}", ba link ${LINK_DAT_HANG[nn].map(l => l[0]).join(', ')}`,
                      JSON.stringify(linkCs) === JSON.stringify(LINK_DAT_HANG[nn]) && chuCs.endsWith(CAU_CHINH_SACH[nn].duoi),
                      `${chuCs.slice(-120)} · ${JSON.stringify(linkCs)}`));
          // Đợt 3 · nút lọc nhóm (chạy nhờ script): "Kim chi" chỉ còn thẻ kim chi; "Tất cả" hiện lại hết.
          const nutLoc = p.locator('[data-mtv-loc] button');
          const chuLoc = (await nutLoc.allInnerTexts()).map(motDong);
          const theHien = () => p.evaluate(() => [...document.querySelectorAll('#chon-goi article')].filter(a => a.checkVisibility()).map(a => a.querySelector('h3')?.textContent.trim() ?? ''));
          await nutLoc.nth(3).click();
          const sauLoc = await theHien();
          const nhanLoc = await nutLoc.evaluateAll(ns => ns.map(n => n.getAttribute('aria-pressed')));
          const tranLoc = await tranNgang(p);
          await nutLoc.nth(0).click();
          const sauTatCa = await theHien();
          tot.push(ok(`${nhan}: nút lọc nhóm ${LOC[nn].join(' · ')} — "${LOC[nn][3]}" chỉ còn thẻ kim chi (aria-pressed đúng, không tràn ngang), "${LOC[nn][0]}" hiện lại đủ ${menu.length} thẻ`,
                      JSON.stringify(chuLoc) === JSON.stringify(LOC[nn])
                        && JSON.stringify(sauLoc) === JSON.stringify(menu.filter(sp => sp.loai === 'kim_chi').map(sp => sp.ten))
                        && JSON.stringify(nhanLoc) === '["false","false","false","true"]' && tranLoc <= 0 && sauTatCa.length === menu.length,
                      JSON.stringify({ chuLoc, sauLoc, nhanLoc, tranLoc, sauTatCa: sauTatCa.length })));
          if (rong === 1440) {
            // Đợt 3 · từ 1024px: cột "Đơn của bạn" bên phải lưới gói, dính dưới đầu trang khi cuộn qua lưới gói, nút Đặt
            // hàng trong màn hình; chọn gói rồi về đầu trang — thanh giỏ không hiện (cột đơn đã luôn trên màn hình).
            await chonSo(p, 'kim-chi-cai-thao_500', '1');
            await p.locator('#chon-goi .mtv-nhom').last().scrollIntoViewIfNeeded();
            await cho(250);
            const caoDau = await p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cao-dau')));
            const cot = await p.locator('[data-mtv-don]').boundingBox();
            const luoi = await p.locator('#chon-goi').boundingBox();
            const nut = await p.locator('[data-mtv-nut-dat]').boundingBox();
            await p.evaluate(() => window.scrollTo(0, 0));
            await cho(250);
            const thanhDau = await p.locator('[data-mtv-thanh]').isVisible();
            tot.push(ok(`${nhan}: cột "Đơn của bạn" bên phải lưới gói, dính dưới đầu trang (${caoDau}px) khi cuộn, nút Đặt hàng trong màn hình; thanh giỏ không hiện`,
                        !!cot && !!luoi && !!nut && cot.x >= luoi.x + luoi.width && Math.abs(cot.y - (caoDau + 16)) <= 1
                          && nut.y >= 0 && nut.y + nut.height <= 900 + 0.5 && !thanhDau,
                        JSON.stringify({ cot, luoi, nut, caoDau, thanhDau })));
          }
          // Chữ cấm trên trang đã dựng: bỏ đúng số tiền đã chốt trong [data-tien] (chu-hien-ra.mjs), phần còn lại sạch.
          const cam = timChuoiCam(chuHienRa(boTienDaChot(await p.content(), duongMua(nn))));
          tot.push(ok(`${nhan}: không chữ cấm ngoài số tiền đã chốt trong [data-tien]`, cam.length === 0, cam.map(x => x.tim_thay).join(' | ')));
          if (tot.includes(false)) await chupP(p, `mo-${nn}-${rong}`);
        } finally {
          await c.close();
        }
      }
    }

    // ---- Phép đo giao diện chờ trang đứng yên (do-giao-dien.mjs: choDungYen) ------------------------------------------
    // Lỗi chập chờn 15/11/2026: máy bận, "hộp chọn đang mở" ở trên đỏ với nền nút rgb(253, 253, 253) — phép đo bắt đúng
    // khung hình đầu của chuyển màu trắng → xám E2 (180ms) lúc con trỏ còn trên nút "Chọn gói"; trang không sai. Ở đây
    // kiểm chính phép đo, không phụ thuộc máy nhanh hay chậm: chuyển màu của nút kéo dài 1,5 giây, nên lúc gọi phép đo
    // nút CHẮC CHẮN đang giữa chừng — phép đo phải chờ xong rồi mới đo. Rồi nền nút đứng yên ở rgb(253, 253, 253): phép đo
    // vẫn phải báo — chờ không được làm cùn phép kiểm.
    {
      mayGia.datKichBan('mua-thit-mo');
      const { c, p } = await mo(duongMua('vi'), { rong: 1440 });
      const nhan = `mua-thit-mo ${duongMua('vi')} · 1440px · phép đo chờ trang đứng yên`;
      try {
        const saiGd = async () => {
          const gd = await p.evaluate(doGiaoDien);
          return Object.keys(PHEP_DO).flatMap(khoa => (gd[khoa] ?? ['không đo được']).map(x => `[${khoa}] ${x}`));
        };
        const nut = p.locator('[data-mtv-mo-hop]').first();
        await p.addStyleTag({ content: '.ck .nut { transition-duration: 1500ms !important; }' });
        await nut.hover();
        await p.evaluate(choDungYen);   // nền đã sang màu di chuột (không còn trắng): nút đang được di chuột
        const lucDiChuot = await nut.evaluate(n => `${n.matches(':hover')} ${getComputedStyle(n).backgroundColor}`);
        await p.mouse.move(0, 0);       // con trỏ rời nút: nền bắt đầu về trắng, mất 1,5 giây
        const giuaChung = await saiGd();
        await p.addStyleTag({ content: '.ck .mtv-mo-hop { background-color: rgb(253, 253, 253) !important; transition: none !important; }' });
        const nenDungYen = await saiGd();
        const tot = [
          ok(`${nhan}: nút "Chọn gói" vừa hết di chuột, nền đang về trắng (chuyển màu kéo dài 1,5 giây) — phép đo chờ xong rồi mới đo, đủ ${Object.keys(PHEP_DO).length} phép đo`,
             // Tiền đề: con trỏ thật sự đang trên nút và nền đã rời màu trắng — không thì lượt chuyển về trắng không có gì
             // để chờ. Không ghi cứng màu di chuột: đổi token màu di chuột không được làm kiểm tra này đỏ.
             lucDiChuot.startsWith('true ') && lucDiChuot !== 'true rgb(255, 255, 255)' && giuaChung.length === 0,
             `lúc di chuột: ${lucDiChuot} · ${giuaChung.slice(0, 3).join(' | ')}`),
          ok(`${nhan}: nền nút đứng yên ở rgb(253, 253, 253) — phép đo vẫn báo ở nenTrongBang và nut (chờ không làm cùn phép kiểm)`,
             nenDungYen.some(x => x.startsWith('[nenTrongBang] rgb(253, 253, 253) ở <button.nut.nut-vien.mtv-mo-hop>'))
               && nenDungYen.some(x => x.startsWith('[nut] <button.nut.nut-vien.mtv-mo-hop>') && x.includes('nền rgb(253, 253, 253)')),
             nenDungYen.slice(0, 3).join(' | ')),
        ];
        if (tot.includes(false)) await chupP(p, 'phep-do-cho-dung-yen');
      } finally {
        await c.close();
      }
    }

    // ---- mua-thit-giao (đợt 3): khu vực / phí giao chủ đã công bố là dòng phụ của điều thứ nhất -----------------------
    mayGia.datKichBan('mua-thit-giao');
    for (const nn of NGON_NGU) {
      const { c, p } = await mo(duongMua(nn));
      try {
        const phuGiao = motDong(await p.locator('.mtv-ba-dieu li').first().locator('.mtv-dieu-phu').innerText().catch(() => ''));
        ok(`mua-thit-giao ${duongMua(nn)}: điều "${BA_DIEU[nn][0]}" có dòng phụ là chữ giao hàng chủ đã công bố`,
           phuGiao === motDong(GIAO_HANG_THU[nn]), phuGiao);
      } finally {
        await c.close();
      }
    }

    // ---- mua-thit-mo: chọn gói, đơn của bạn, thanh giỏ, đặt hàng, trang đã nhận ------------------------------------
    for (const nn of NGON_NGU) {
      mayGia.datKichBan('mua-thit-mo');
      const menu = menuCua('mua-thit-mo', nn);
      const duong = duongMua(nn);
      const { c, p, loiJs } = await mo(duong);
      const nhan = `mua-thit-mo ${duong} · đặt hàng`;
      try {
        // Hộp chọn: mở bằng nút "Chọn gói", con trỏ vào ô chọn đầu, bấm + hai lần, "Đã chọn" ở chân hộp, Xong đóng hộp.
        const theRibeye = p.locator('#chon-goi article', { has: p.locator('select.mtv-so[name="ribeye-cap_200"]') });
        let hopMo = null;
        await trongHop(p, 'ribeye-cap_200', async hop => {
          // Con trỏ đọc khi hộp vừa mở, trước khi bấm + (bấm + thì con trỏ sang nút +). Script đưa con trỏ vào ô chọn ở
          // sự kiện toggle — trình duyệt XẾP HÀNG sự kiện này sau khi hộp hiện (chuẩn HTML), nên đọc ngay thì có lúc còn
          // null (máy CI chậm hơn: main đỏ sau PR #159). Đợi tối đa 3 giây cho con trỏ tới; không tới thì ghi null.
          await p.waitForFunction(() => document.activeElement?.getAttribute('name') === 'ribeye-cap_200', null, { timeout: 3000 }).catch(() => {});
          const focus = await p.evaluate(() => document.activeElement?.getAttribute('name') ?? null);
          const cong = hop.locator('select.mtv-so[name="ribeye-cap_200"] ~ [data-mtv-buoc="1"]');
          await cong.click();
          await cong.click();
          hopMo = {
            focus,
            daChon: motDong(await hop.locator('.mtv-hop-chan [data-mtv-da-chon]').innerText()),
            khung: await hop.boundingBox(),
          };
        });
        const daChonThe = motDong(await theRibeye.locator('.mtv-the-chan [data-mtv-da-chon]').innerText().catch(() => ''));
        // Esc đóng hộp (popover tự đóng) — ô chọn vẫn giữ số.
        await theRibeye.locator('[data-mtv-mo-hop]').click();
        await p.keyboard.press('Escape');
        const escDong = await theRibeye.locator('[data-mtv-hop]').isHidden();
        await chonSo(p, 'kim-chi-cai-thao_500', '1');
        const { gio } = docGio([['ribeye-cap_200', '2'], ['kim-chi-cai-thao_500', '1']], menu);
        const don = tinhDon(gio, menu);
        const dongTrang = (await p.locator('[data-mtv-dong-don] li').allInnerTexts()).map(motDong);
        const tamTinh = motDong(await p.locator('[data-mtv-tam-tinh]').innerText());
        await p.evaluate(() => window.scrollTo(0, 0));
        await cho(200);
        const thanhHien = await p.locator('[data-mtv-thanh]').isVisible();
        const thanhChu = motDong(await p.locator('[data-mtv-thanh-chu]').innerText().catch(() => ''));
        await p.locator('#dat-hang').scrollIntoViewIfNeeded();
        await cho(300);
        const thanhKhiODat = await p.locator('[data-mtv-thanh]').isVisible();
        await dien(p);
        await datVaCho(p);
        const url = new URL(p.url());
        const goi = goiDat();
        const ts = goi[0]?.thamSo ?? {};
        const tot = [
          ok(`${nhan}: hộp chọn mở bằng "Chọn gói" (con trỏ vào ô chọn đầu, nằm trọn trong màn 390px), "Đã chọn: 2 gói" ở chân hộp và trên thẻ, Esc đóng hộp`,
             hopMo?.focus === 'ribeye-cap_200' && hopMo.daChon === CHU_DON.daChon[nn](2, 0) && daChonThe === CHU_DON.daChon[nn](2, 0)
               && hopMo.khung && hopMo.khung.x >= 0 && hopMo.khung.x + hopMo.khung.width <= 390 + 0.5 && hopMo.khung.y >= 0 && hopMo.khung.y + hopMo.khung.height <= 844 + 0.5
               && escDong, JSON.stringify({ hopMo, daChonThe, escDong })),
          ok(`${nhan}: "Đơn của bạn" đúng từng dòng của lib; tạm tính ${dinhDangTien(don.tamTinh)}`,
             JSON.stringify(dongTrang) === JSON.stringify(dongMong(don, nn)) && tamTinh.endsWith(dinhDangTien(don.tamTinh)),
             `${JSON.stringify(dongTrang)} · ${tamTinh}`),
          ok(`${nhan}: thanh giỏ hiện ở đầu trang khi có gói (đếm, tạm tính), ẩn khi khối Đặt hàng trên màn hình`,
             thanhHien && thanhChu.includes(dinhDangTien(don.tamTinh)) && !thanhKhiODat, `${thanhHien} «${thanhChu}» · ${thanhKhiODat}`),
          ok(`${nhan}: tao_don_mua_thit đúng một lần, đúng giỏ, giá đã thấy, họ tên, số điện thoại, địa chỉ, thứ tiếng`,
             goi.length === 1 && JSON.stringify(ts.p_gio) === JSON.stringify({ 'ribeye-cap_200': 2, 'kim-chi-cai-thao_500': 1 })
               && ts.p_gia_da_xem?.['ribeye-cap_200'] === 400000 && ts.p_gia_da_xem?.['kim-chi-cai-thao_500'] === 90000
               && ts.p_ho_ten === KHACH_MUA.ho_ten && ts.p_sdt === KHACH_MUA.sdt && ts.p_dia_chi === KHACH_MUA.dia_chi
               && ts.p_ngon_ngu === nn && /^[0-9a-f-]{36}$/.test(ts.p_ma_gui ?? ''), JSON.stringify(goi)),
          ok(`${nhan}: trang "đã nhận" — h1 "${CAU_DAT_HANG.daNhan[nn]}", có mã đơn, không form`,
             motDong(await p.locator('h1').innerText()) === CAU_DAT_HANG.daNhan[nn]
               && /^[0-9A-Z]{6}$/.test(await p.locator('[data-ket-qua="da-nhan"]').getAttribute('data-ma') ?? '')
               && await p.locator('form[data-mtv-form]').count() === 0),
          ok(`${nhan}: địa chỉ trang sau khi đặt là đường dẫn trơn #da-nhan — không giỏ, không dữ liệu khách`,
             url.pathname === duong && url.search === '' && url.hash === '#da-nhan' && !coDuLieuKhach(decodeURIComponent(url.href)), url.href),
          ok(`${nhan}: không lỗi JavaScript`, !loiJs.length, loiJs.slice(0, 2).join(' | ')),
        ];
        const camDaNhan = timChuoiCam(chuHienRa(boTienDaChot(await p.content(), duong)));
        tot.push(ok(`${nhan}: trang "đã nhận" không chữ cấm`, camDaNhan.length === 0, camDaNhan.map(x => x.tim_thay).join(' | ')));
        await p.reload({ waitUntil: 'load' });
        tot.push(ok(`${nhan}: tải lại trang "đã nhận" (cookie dùng một lần) → trang chọn gói, không tạo đơn thứ hai`,
          await p.locator('form[data-mtv-form]').count() === 1 && goiDat().length === 1));
        if (tot.includes(false)) await chupP(p, `dat-${nn}`);
      } finally {
        await c.close();
      }
    }

    // ---- Bấm đúp khi database chậm: một lần gọi --------------------------------------------------------------------
    {
      mayGia.datKichBan('mua-thit-mo', { cham: 1500 });
      const { c, p } = await mo(duongMua('vi'));
      await chonSo(p, 'than-ngoai_400', '1');
      await dien(p);
      await datVaCho(p, { dup: true });
      ok('Bấm đúp Đặt hàng khi database chậm → tao_don_mua_thit đúng một lần, trang "đã nhận"',
         (mayGia.dem().tao_don_mua_thit ?? 0) === 1 && await p.locator('[data-ket-qua="da-nhan"]').count() === 1, JSON.stringify(mayGia.dem()));
      await c.close();
    }

    // ---- Giỏ rỗng: không gửi ---------------------------------------------------------------------------------------
    for (const nn of NGON_NGU) {
      mayGia.datKichBan('mua-thit-mo');
      const { c, p } = await mo(duongMua(nn));
      await dien(p);
      await nutDat(p).click();
      await cho(400);
      ok(`${duongMua(nn)}: giỏ rỗng bấm Đặt hàng → không gọi database, ở lại trang, báo "${CHU_DON.donTrong[nn]}"`,
         (mayGia.dem().tao_don_mua_thit ?? 0) === 0 && new URL(p.url()).pathname === duongMua(nn)
           && motDong(await p.locator('[data-mtv-bao]').innerText()) === CHU_DON.donTrong[nn]);
      await c.close();
    }

    // ---- Tắt JavaScript: vẫn đặt được ------------------------------------------------------------------------------
    {
      mayGia.datKichBan('mua-thit-mo');
      const { c, p } = await mo(duongMua('vi'), { js: false });
      // Hộp chọn là popover mở bằng popovertarget: chạy không cần JavaScript.
      let buocHien = true;
      // Đợt 3: nút lọc nhóm chỉ chạy nhờ script — tắt JavaScript thì không có, mọi thẻ cùng hiện.
      const locKhongJs = await p.locator('[data-mtv-loc]').isVisible();
      const theKhongJs = await p.evaluate(() => [...document.querySelectorAll('#chon-goi article')].every(a => a.checkVisibility()));
      ok('Tắt JavaScript: không nút lọc nhóm, mọi thẻ cùng hiện', !locKhongJs && theKhongJs, JSON.stringify({ locKhongJs, theKhongJs }));
      await chonSo(p, 'la-galbi_400', '2').catch(() => {});
      await trongHop(p, 'la-galbi_400', async hop => { buocHien = await hop.locator('[data-mtv-buoc]').first().isVisible(); }).catch(() => {});
      await dien(p);
      await Promise.all([p.waitForNavigation({ waitUntil: 'load' }), nutDat(p).click()]);
      const ts = goiDat()[0]?.thamSo ?? {};
      ok('Tắt JavaScript: hộp chọn vẫn mở / đóng (popover), nút −/+ không hiện; chọn bằng ô chọn, đặt hàng được (form POST), trang "đã nhận"',
         !buocHien && JSON.stringify(ts.p_gio) === JSON.stringify({ 'la-galbi_400': 2 }) && ts.p_gia_da_xem?.['la-galbi_400'] === 360000
           && await p.locator('[data-ket-qua="da-nhan"]').count() === 1, JSON.stringify(ts));
      await c.close();
    }

    // ---- 0125 · Hóa đơn đỏ: bốn ô ẩn tới khi chọn ô; trống → lỗi sát ô, không gọi; đủ → p_hoa_don đã chuẩn hóa ------
    const HOA_DON_THU = { hoa_don_ten_don_vi: 'Công ty TNHH Thử Nghiệm', hoa_don_ma_so_thue: '0123 456 789', hoa_don_email: 'ketoan@example.com' };
    const dienHoaDon = async (p, o = HOA_DON_THU) => { for (const [ten, v] of Object.entries(o)) await p.fill(`form[data-mtv-form] [name="${ten}"]`, v); };
    const loiHoaDon = p => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-mtv-loi]')]
      .map(e => [e.dataset.mtvLoi, e.hidden ? null : e.textContent.trim()])));
    for (const nn of NGON_NGU) {
      mayGia.datKichBan('mua-thit-mo');
      const { c, p, loiJs } = await mo(duongMua(nn));
      try {
        const oHd = p.locator('#mtv-hoa-don-o');
        const anLucDau = await oHd.isHidden();
        const hang = await p.locator('.mtv-hoa-don-chon').boundingBox();
        const tuVe = await p.locator('#mtv-xuat-hoa-don').evaluate(o => getComputedStyle(o).appearance);
        await chonSo(p, 'ribeye-cap_200', '1');
        await dien(p);
        await p.locator('#mtv-xuat-hoa-don').check();
        const hienKhiChon = await oHd.isVisible();
        await nutDat(p).click();
        await cho(300);
        const loi = await loiHoaDon(p);
        const conTro = await p.evaluate(() => document.activeElement?.getAttribute('name') ?? null);
        const goiKhiTrong = goiDat().length;
        await dienHoaDon(p);
        const loiTat = Object.values(await loiHoaDon(p)).every(v => v === null);
        await datVaCho(p);
        const ts = goiDat()[0]?.thamSo ?? {};
        const tot = [
          ok(`${duongMua(nn)}: bốn ô hóa đơn ẩn khi mới vào; ô đánh dấu tự vẽ, hàng cao ≥ 48px; chọn ô thì bốn ô hiện`,
             anLucDau && hang?.height >= 47.5 && tuVe === 'none' && hienKhiChon, JSON.stringify({ anLucDau, hang, tuVe, hienKhiChon })),
          ok(`${duongMua(nn)}: chọn mà để trống → ba câu lỗi sát ô đúng chữ (CAU_HOA_DON), con trỏ về ô tên đơn vị, không gọi database`,
             loi.hoa_don_ten_don_vi === CAU_HOA_DON.thieuTenDonVi[nn] && loi.hoa_don_ma_so_thue === CAU_HOA_DON.saiMaSoThue[nn]
               && loi.hoa_don_email === CAU_HOA_DON.thieuEmailHoaDon[nn] && conTro === 'hoa_don_ten_don_vi' && goiKhiTrong === 0,
             JSON.stringify({ loi, conTro, goiKhiTrong })),
          ok(`${duongMua(nn)}: sửa đúng thì lỗi tắt; Đặt hàng gửi p_hoa_don đã chuẩn hóa; trang "đã nhận"`,
             loiTat && JSON.stringify(ts.p_hoa_don) === JSON.stringify({ ten_don_vi: 'Công ty TNHH Thử Nghiệm', ma_so_thue: '0123456789', dia_chi: null, email: 'ketoan@example.com' })
               && await p.locator('[data-ket-qua="da-nhan"]').count() === 1, JSON.stringify(ts)),
          ok(`${duongMua(nn)}: hóa đơn đỏ — không lỗi JavaScript`, !loiJs.length, loiJs.slice(0, 2).join(' | ')),
        ];
        if (tot.includes(false)) await chupP(p, `hoa-don-${nn}`);
      } finally {
        await c.close();
      }
    }
    {
      // Gõ dở (mã số thuế sai dạng) rồi bỏ chọn: bốn ô ẩn không chặn gì, không chữ nào của hóa đơn rời trình duyệt.
      mayGia.datKichBan('mua-thit-mo');
      const { c, p } = await mo(duongMua('vi'));
      await chonSo(p, 'ribeye-cap_200', '1');
      await dien(p);
      await p.locator('#mtv-xuat-hoa-don').check();
      await dienHoaDon(p, { hoa_don_ma_so_thue: '12', hoa_don_email: 'ketoan@' });
      await p.locator('#mtv-xuat-hoa-don').uncheck();
      await datVaCho(p);
      const ts = goiDat()[0]?.thamSo ?? {};
      ok('Hóa đơn đỏ: gõ dở hai ô (sai dạng) rồi bỏ chọn → đặt được, lời gọi không mang p_hoa_don, trang "đã nhận"',
         goiDat().length === 1 && !('p_hoa_don' in ts) && await p.locator('[data-ket-qua="da-nhan"]').count() === 1, JSON.stringify(ts));
      await c.close();
    }
    {
      // Tắt JavaScript: CSS hiện bốn ô khi chọn; máy chủ đọc và chuẩn hóa (13 số liền → 10 số - 3 số).
      mayGia.datKichBan('mua-thit-mo');
      const { c, p } = await mo(duongMua('vi'), { js: false });
      const an = await p.locator('#mtv-hoa-don-o').isHidden();
      await chonSo(p, 'la-galbi_400', '1').catch(() => {});
      await dien(p);
      await p.locator('#mtv-xuat-hoa-don').check();
      const hien = await p.locator('#mtv-hoa-don-o').isVisible();
      await dienHoaDon(p, { ...HOA_DON_THU, hoa_don_ma_so_thue: '0123456789001' });
      await Promise.all([p.waitForNavigation({ waitUntil: 'load' }), nutDat(p).click()]);
      const ts = goiDat()[0]?.thamSo ?? {};
      ok('Tắt JavaScript: bốn ô hóa đơn ẩn tới khi chọn ô, chọn thì CSS hiện; đặt được, p_hoa_don đã chuẩn hóa ở máy chủ',
         an && hien && ts.p_hoa_don?.ma_so_thue === '0123456789-001' && ts.p_hoa_don?.ten_don_vi === HOA_DON_THU.hoa_don_ten_don_vi
           && await p.locator('[data-ket-qua="da-nhan"]').count() === 1, JSON.stringify({ an, hien, ts }));
      await c.close();
    }
    {
      // Database từ chối đơn có hóa đơn: về trang, ô được chọn lại, bốn ô hiện, chữ đã gõ điền lại; địa chỉ trang sạch.
      mayGia.datKichBan('mua-thit-dat-loi');
      const { c, p } = await mo(duongMua('vi'));
      await chonSo(p, 'ribeye-cap_200', '1');
      await dien(p);
      await p.locator('#mtv-xuat-hoa-don').check();
      await dienHoaDon(p);
      await datVaCho(p);
      const chon = await p.locator('#mtv-xuat-hoa-don').isChecked();
      const hien = await p.locator('#mtv-hoa-don-o').isVisible();
      const giaTri = await p.evaluate(() => ['hoa_don_ten_don_vi', 'hoa_don_ma_so_thue', 'hoa_don_email']
        .map(ten => document.querySelector(`form[data-mtv-form] [name="${ten}"]`)?.value ?? null));
      const diaChiTrang = decodeURIComponent(p.url());
      ok('Hóa đơn đỏ: database từ chối → ô "Cần xuất hóa đơn đỏ" chọn lại, bốn ô hiện, chữ đã gõ điền lại; địa chỉ trang không mang tên đơn vị, mã số thuế, email',
         chon && hien && JSON.stringify(giaTri) === JSON.stringify(Object.values(HOA_DON_THU)) && !/Thử|0123|ketoan|example/.test(diaChiTrang),
         JSON.stringify({ chon, hien, giaTri, diaChiTrang }));
      await c.close();
    }

    // ---- Database từ chối: câu lỗi, giỏ và ô liên hệ điền lại --------------------------------------------------------
    for (const nn of NGON_NGU) {
      mayGia.datKichBan('mua-thit-dat-loi');
      const duong = duongMua(nn);
      const { c, p, loiJs } = await mo(duong);
      await chonSo(p, 'ribeye-cap_200', '2');
      await dien(p);
      await datVaCho(p);
      const url = new URL(p.url());
      const cau = cauLoiDatabase('Giá vừa đổi, vui lòng tải lại trang để xem giá mới', nn, '');
      const tot = [
        ok(`mua-thit-dat-loi ${duong}: câu lỗi của database đúng thứ tiếng trên khối Giao hàng`,
           motDong(await p.locator('[data-ket-qua="loi"]').innerText().catch(() => '')) === cau, await p.locator('[data-ket-qua="loi"]').innerText().catch(() => '—')),
        ok(`mua-thit-dat-loi ${duong}: giỏ chọn sẵn từ địa chỉ trang (chỉ khóa gói, số gói); ô liên hệ điền lại từ sessionStorage`,
           url.search === '?ribeye-cap_200=2' && await p.locator('select.mtv-so[name="ribeye-cap_200"]').inputValue() === '2'
             && await p.locator('[name="ho_ten"]').inputValue() === KHACH_MUA.ho_ten && await p.locator('[name="dia_chi"]').inputValue() === KHACH_MUA.dia_chi
             && !coDuLieuKhach(decodeURIComponent(url.href)), url.href),
        ok(`mua-thit-dat-loi ${duong}: không lỗi JavaScript`, !loiJs.length, loiJs.join(' | ')),
      ];
      if (tot.includes(false)) await chupP(p, `dat-loi-${nn}`);
      await c.close();
    }

    // ---- Mất mạng giữa chừng: KHÔNG CHẮC, không form ---------------------------------------------------------------
    for (const nn of NGON_NGU) {
      mayGia.datKichBan('mua-thit-dat-dut');
      const { c, p } = await mo(duongMua(nn));
      await chonSo(p, 'ribeye-cap_200', '1');
      await dien(p);
      await datVaCho(p);
      ok(`mua-thit-dat-dut ${duongMua(nn)}: h1 "${KHONG_CHAC_H1[nn]}", câu không chắc, nút gọi quán, không form, không "đã nhận"`,
         motDong(await p.locator('h1').innerText()) === KHONG_CHAC_H1[nn] && await p.locator('[data-ket-qua="khong-chac"]').count() === 1
           && await p.locator('main a[href^="tel:"]').count() === 1 && await p.locator('form[data-mtv-form]').count() === 0
           && await p.locator('[data-ket-qua="da-nhan"]').count() === 0);
      await c.close();
    }

    // ---- Tạm hết ở quầy: giá, không form đặt hàng ------------------------------------------------------------------
    mayGia.datKichBan('mua-thit-het-quay');
    for (const nn of NGON_NGU) {
      const { c, p } = await mo(duongMua(nn));
      const the = await docThe(p);
      ok(`mua-thit-het-quay ${duongMua(nn)}: mọi thẻ có giá "Từ" và "${TAM_HET[nn]}", không nút chọn, không hộp, không ô chọn, không khối Đặt hàng, có câu tạm hết`,
         JSON.stringify(the) === JSON.stringify(theMong(menuCua('mua-thit-het-quay', nn), nn, false, 'mua-thit-het-quay'))
           && await p.locator('#dat-hang').count() === 0 && (await p.locator('main').innerText()).includes(HET_QUAY[nn]));
      await c.close();
    }

    // ---- Đọc menu lỗi / mất mạng / treo ----------------------------------------------------------------------------
    for (const kichBan of ['mua-thit-loi', 'mua-thit-dut', 'mua-thit-treo']) {
      mayGia.datKichBan(kichBan);
      for (const nn of NGON_NGU) {
        const { c, p, thoiGian } = await mo(duongMua(nn));
        const nhan = `${kichBan} ${duongMua(nn)}`;
        ok(`${nhan}: "${LOI_H1[nn]}", nút gọi quán, không form, không giá${kichBan === 'mua-thit-treo' ? ', trả lời trong 6 giây' : ''}`,
           motDong(await p.locator('h1').innerText()) === LOI_H1[nn] && await p.locator('main a.nut-chinh[href^="tel:"]').count() === 1
             && await p.locator('form').count() === 0 && await p.locator('[data-tien]').count() === 0 && (kichBan !== 'mua-thit-treo' || thoiGian < 6000),
           `${thoiGian} ms`);
        await c.close();
      }
    }

    // ---- Chưa mở; và mua-thit-khong-zalo (0113: mở dù chưa có link Zalo) -------------------------------------------
    for (const kichBan of ['rong', 'day-du', 'mua-thit-rong', 'mua-thit-lech', 'mua-thit-khong-zalo']) {
      mayGia.datKichBan(kichBan);
      for (const nn of NGON_NGU) {
        const { c, p, r, loiJs } = await mo(duongMua(nn));
        const nhan = `${kichBan} ${duongMua(nn)}`;
        const dh = await dieuHuong(p, nn);
        if (kichBan === 'mua-thit-khong-zalo') {
          ok(`${nhan}: trang mở — form đặt hàng, năm mục điều hướng`, await p.locator('form[data-mtv-form]').count() === 1 && dh.so === 5 && dh.coMua);
        } else {
          ok(`${nhan}: không form, không giá, không lỗi JavaScript${kichBan === 'mua-thit-lech' ? '' : '; điều hướng bốn mục; mô tả "chưa mở"'}`,
             r?.status() === 200 && await p.locator('form').count() === 0 && await p.locator('[data-tien]').count() === 0 && !loiJs.length
               && (kichBan === 'mua-thit-lech' || (dh.so === 4 && !dh.coMua && await moTaMeta(p) === chu(nn).moTaMuaThitChuaMo)),
             `${dh.so} mục · ${await moTaMeta(p)}`);
        }
        await c.close();
      }
    }

    // ---- Bề rộng hẹp có giỏ: không tràn ngang ----------------------------------------------------------------------
    mayGia.datKichBan('mua-thit-mo');
    for (const rong of [320, 360, 768, 1024]) {
      const { c, p } = await mo(`${duongMua('vi')}?ribeye-cap_200=2&than-lung-cat-day_400=1`, { rong });
      ok(`mua-thit-mo · ${rong}px, giỏ có gói (sản phẩm tên 120 ký tự): không tràn ngang; ô chọn từ địa chỉ trang`,
         await tranNgang(p) <= 0 && await p.locator('select.mtv-so[name="ribeye-cap_200"]').inputValue() === '2', `${await tranNgang(p)} px`);
      await c.close();
    }
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  await nhom('13 · META PIXEL KHI ĐÃ NỐI DATABASE: LEAD CHỈ SAU KHI DATABASE NHẬN, CONTACT, ĐẶT MUA THỊT, ĐỊA CHỈ TRANG KHÔNG MANG SỐ ĐIỆN THOẠI', async () => {
    const thamSo = duong => ({ content_name: duongDanTuongUng(duong, 'vi').replace(/^\//, '') || 'trang-chu', language: ngonNguCua(duong) });
    const tenSuKien = lenh => suKienTrong(lenh).map(l => l[1]);
    /** Một context mới (sessionStorage sạch), Meta bị chặn: lời gọi fbq nằm trong hàng đợi của trang. */
    const moTrang = async () => {
      const c = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
      const p = await c.newPage();
      const loiJs = [];
      p.on('pageerror', e => loiJs.push(e.message));
      return { c, p, loiJs };
    };
    const dienVaGui = async (p, { dup = false } = {}) => {
      const nhan = p.locator('form[data-hoi-ban] label:has(input[name="gio"]:not([disabled]))').first();
      if (await nhan.count()) await nhan.click();
      else await p.locator('form[data-hoi-ban] input[name="gio"]:not([disabled])').first().check({ force: true });
      await p.fill('form[data-hoi-ban] [name="ho_ten"]', KHACH.ho_ten);
      await p.fill('form[data-hoi-ban] [name="sdt"]', KHACH.sdt);
      const nut = p.locator('form[data-hoi-ban] [type="submit"]').first();
      await nut.scrollIntoViewIfNeeded();
      const hop = await nut.boundingBox();
      const sau = p.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
      if (dup) await p.mouse.dblclick(hop.x + hop.width / 2, hop.y + hop.height / 2);
      else await p.mouse.click(hop.x + hop.width / 2, hop.y + hop.height / 2);
      const traLoi = await sau;
      await p.waitForLoadState('networkidle').catch(() => {});
      await cho(dup ? 1000 : 300);
      return traLoi;
    };
    const coChuKhach = s => s.includes(KHACH.sdt) || s.includes(KHACH.sdt.slice(1)) || s.includes(KHACH.ho_ten);

    for (const nn of NGON_NGU) {
      const hoiBan = duongDanTuongUng('/dat-ban', nn);
      for (const dup of [false, true]) {
        mayGia.datKichBan('day-du', dup ? { cham: 1500 } : {});
        const { c, p, loiJs } = await moTrang();
        await p.goto(goc + hoiBan, { waitUntil: 'load' });
        const truoc = tenSuKien(await p.evaluate(docHangDoi));
        const traLoi = await dienVaGui(p, { dup });
        const htmlDaNhan = await traLoi?.text().catch(() => '') ?? '';
        const lenh = await p.evaluate(docHangDoi);
        const ma = (await p.locator('[data-ket-qua="da-nhan"]').getAttribute('data-ma').catch(() => null)) ?? '';
        const diaChi = p.url();
        await p.reload({ waitUntil: 'load' });
        const sauTaiLai = tenSuKien(await p.evaluate(docHangDoi));
        // Bấm Back về trang "đã nhận" mà trình duyệt lấy trang từ bộ nhớ đệm (không qua bfcache — hay gặp ở trình duyệt
        // trong app Facebook, Zalo): cùng HTML đó dựng lại, script chạy lại. Giả bằng route trả đúng HTML máy chủ đã trả.
        await c.route(goc + hoiBan, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: htmlDaNhan }), { times: 1 });
        await p.goto(goc + hoiBan, { waitUntil: 'load' });
        const veTuDem = { the: await p.locator(`[data-ket-qua="da-nhan"][data-ma="${ma}"]`).count(), ten: tenSuKien(await p.evaluate(docHangDoi)) };
        const nhan = `${hoiBan}${dup ? ' (bấm đúp, database chậm)' : ''}`;
        const tot = [
          ok(`${nhan}: trước khi gửi chỉ có PageView`, JSON.stringify(truoc) === '["PageView"]', JSON.stringify(truoc)),
          ok(`${nhan}: database trả mã → thẻ "đã nhận" và ĐÚNG MỘT Lead, chỉ kèm ${JSON.stringify(thamSo(hoiBan))}`,
             !!ma && (mayGia.dem().tao_dat_ban ?? 0) === 1
               && JSON.stringify(suKienTrong(lenh)) === JSON.stringify([['track', 'PageView'], ['track', 'Lead', thamSo(hoiBan)]]),
             `mã «${ma}», tao_dat_ban ${mayGia.dem().tao_dat_ban ?? 0} lần, ${JSON.stringify(suKienTrong(lenh))}`),
          ok(`${nhan}: không lời gọi fbq nào mang họ tên, số điện thoại, mã đặt bàn`,
             !coChuKhach(JSON.stringify(lenh)) && !(ma && JSON.stringify(lenh).includes(ma)), JSON.stringify(lenh)),
          ok(`${nhan}: địa chỉ trang sau khi gửi là đường dẫn trơn — không họ tên, không số điện thoại`,
             new URL(diaChi).pathname === hoiBan && new URL(diaChi).search === '' && !coChuKhach(decodeURIComponent(diaChi)), diaChi),
          ok(`${nhan}: tải lại trang (kết quả qua cookie dùng một lần) → không thẻ "đã nhận", không Lead thứ hai`,
             !sauTaiLai.includes('Lead'), JSON.stringify(sauTaiLai)),
          ok(`${nhan}: Back về trang "đã nhận" lấy từ bộ nhớ đệm (cùng HTML, script chạy lại) → thẻ hiện lại nhưng không Lead thứ hai`,
             !!ma && veTuDem.the === 1 && JSON.stringify(veTuDem.ten) === '["PageView"]', JSON.stringify(veTuDem)),
          ok(`${nhan}: không lỗi JavaScript`, !loiJs.length, loiJs.slice(0, 3).join(' | ')),
        ];
        if (tot.includes(false)) await p.screenshot({ path: join(ANH_LOI, `pixel-lead-${nn}${dup ? '-dup' : ''}.png`), fullPage: true }).catch(() => {});
        await c.close();
      }

      for (const kichBan of ['dat-ban-500', 'dat-ban-dut', 'dat-ban-loi']) {
        mayGia.datKichBan(kichBan);
        const { c, p } = await moTrang();
        await p.goto(goc + hoiBan, { waitUntil: 'load' });
        await dienVaGui(p);
        const ten = tenSuKien(await p.evaluate(docHangDoi));
        ok(`${kichBan} ${hoiBan}: database không xác nhận → không Lead, không thẻ "đã nhận"`,
           !ten.includes('Lead') && await p.locator('[data-ket-qua="da-nhan"]').count() === 0, JSON.stringify(ten));
        await c.close();
      }
    }

    // Contact với link ĐÃ CÔNG BỐ: số điện thoại (day-du) ở Đến Beeftown. (Mua thịt về không còn link Zalo OA từ 0113.)
    // Không rời trang khi bấm: chặn ở pha nổi bọt, sau listener pha capture của Trang.astro.
    const khongRoiTrang = p => p.evaluate(() => document.addEventListener('click', e => e.preventDefault()));
    for (const nn of NGON_NGU) {
      mayGia.datKichBan('day-du');
      const den = duongDanTuongUng('/den-beeftown', nn);
      const { c, p } = await moTrang();
      await p.goto(goc + den, { waitUntil: 'load' });
      await khongRoiTrang(p);
      await p.locator('main a[href^="tel:"]:visible').first().click();
      ok(`${den}: bấm số điện thoại đã công bố → Contact ${JSON.stringify(thamSo(den))}`,
         JSON.stringify(suKienTrong(await p.evaluate(docHangDoi)).at(-1)) === JSON.stringify(['track', 'Contact', thamSo(den)]),
         JSON.stringify(suKienTrong(await p.evaluate(docHangDoi))));
      await c.close();

    }

    // InitiateCheckout (0113): bấm Đặt hàng có giỏ là form POST (chuyển trang) — fbevents.js giả báo từng lời gọi về đây.
    // Giỏ rỗng: không. Có giỏ: đúng một lần trước khi chuyển trang, chỉ kèm tên trang và thứ tiếng — không họ tên, số
    // điện thoại, mã đơn. Trang "đã nhận" không gửi thêm sự kiện mua hàng nào.
    for (const nn of NGON_NGU) {
      mayGia.datKichBan('mua-thit-mo');
      const mua = duongDanTuongUng('/mua-thit-ve', nn);
      const c = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
      const lenh = await ghiPixel(c);
      const p = await c.newPage();
      const choThuVien = () => p.waitForFunction(() => typeof window.fbq?.callMethod === 'function', null, { timeout: 10000 }).catch(() => {});
      await p.goto(goc + mua, { waitUntil: 'load' });
      await choThuVien();
      for (const [ten, v] of Object.entries({ ho_ten: KHACH.ho_ten, sdt: KHACH.sdt, dia_chi: '12 Nguyễn Huệ, phường Sài Gòn' })) {
        await p.fill(`form[data-mtv-form] [name="${ten}"]`, v);
      }
      await p.locator('form[data-mtv-form] [data-mtv-nut-dat]').click();
      await cho(300);
      const sauRong = tenSuKien(lenh);
      // Hộp chọn gói (popover của thẻ): mở bằng "Chọn gói", chọn số, Xong.
      const theRibeye = p.locator('#chon-goi article', { has: p.locator('select.mtv-so[name="ribeye-cap_200"]') });
      await theRibeye.locator('[data-mtv-mo-hop]').click();
      await theRibeye.locator('select.mtv-so[name="ribeye-cap_200"]').selectOption('2');
      await theRibeye.locator('[data-mtv-hop] .nut-chinh').click();
      await Promise.all([
        p.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
        p.locator('form[data-mtv-form] [data-mtv-nut-dat]').click(),
      ]);
      await choThuVien();
      const sauGui = tenSuKien(lenh);
      const goi = suKienTrong(lenh).filter(l => l[1] === 'InitiateCheckout');
      ok(`${mua}: giỏ rỗng bấm Đặt hàng → không InitiateCheckout`, JSON.stringify(sauRong) === '["PageView"]', JSON.stringify(sauRong));
      ok(`${mua}: có giỏ bấm Đặt hàng → đúng một InitiateCheckout trước khi chuyển trang, chỉ kèm ${JSON.stringify(thamSo(mua))}; trang "đã nhận" chỉ PageView`,
         JSON.stringify(sauGui) === '["PageView","InitiateCheckout","PageView"]'
           && JSON.stringify(goi[0]) === JSON.stringify(['track', 'InitiateCheckout', thamSo(mua)])
           && await p.locator('[data-ket-qua="da-nhan"]').count() === 1, JSON.stringify(suKienTrong(lenh)));
      ok(`${mua}: không lời gọi fbq nào mang họ tên, số điện thoại, địa chỉ, mã đơn`,
         !/Khách Thử|0912345678|Nguyễn Huệ/.test(JSON.stringify(lenh))
           && !JSON.stringify(lenh).includes(await p.locator('[data-ket-qua="da-nhan"]').getAttribute('data-ma').catch(() => 'x') ?? 'x'));
      await c.close();
    }
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  await nhom('14 · ĐĂNG NHẬP NỘI BỘ KHÔNG THÀNH (Supabase Auth giả): CÂU LỖI SAU MỘT LƯỢT GET, EMAIL ĐIỀN LẠI, LỊCH SỬ KHÔNG CÒN MỤC POST', async () => {
    // Rà soát vòng bốn của PR #188: trang đăng nhập báo lỗi ngay trong trả lời của lượt gửi form thì mục lịch sử đó
    // là một lượt POST giữ nguyên thân form (email, mật khẩu). Nay mọi lượt gửi trả 303 về GET /noi-bo/dang-nhap; câu
    // lỗi và email đã gõ đi qua cookie ngắn hạn (lib/phien.ts, guiFormDangNhap). Ở đây là đăng nhập không thành THẬT:
    // đã nối database nên trang hiện form thật, gõ và bấm như nhân viên; Supabase Auth giả trả sai mật khẩu / quá hạn
    // mức / cắt kết nối (gia-supabase.mjs, traLoiAuth) và ĐẾM số lượt đăng nhập nó nhận — F5, Quay lại, Tiến không
    // được thêm lượt nào. Bản build, bfcache, đo ở tầng mạng: trinh-duyet.mjs nhóm 4.
    const { CAU_DANG_NHAP_TAM } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'qua-tai.ts')).href);
    // "Sai mật khẩu" chép tay (câu cũ của trang, phải giữ nguyên chữ); hai câu bận lấy từ nguồn duy nhất của chúng.
    const CAU = { sai: { vi: 'Email hoặc mật khẩu không đúng.', en: 'Wrong email or password.' }, ...CAU_DANG_NHAP_TAM };
    for (const [nn, dauEmail, loai] of [['vi', 'sai', 'sai'], ['vi', 'ban', 'qua_tai'], ['vi', 'dut', 'mat_ket_noi'], ['en', 'sai', 'sai'], ['en', 'ban', 'qua_tai'], ['en', 'dut', 'mat_ket_noi']]) {
      const ten = `${nn} · ${loai}`;
      const email = `${dauEmail}@beeftown.test`;
      const matKhau = `Mk-${loai}-${Date.now()}-bi-mat`;
      mayGia.datKichBan('day-du');   // xóa bộ đếm
      const c = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
      const p = await c.newPage();
      const luot = [];
      p.on('request', r => {
        const u = new URL(r.url());
        if (u.origin === goc) luot.push({ cach: r.method(), duong: u.pathname + u.search, trang: r.isNavigationRequest(), than: r.postData() ?? '' });
      });
      const traLoiTrang = [];
      p.on('response', r => { if (r.request().isNavigationRequest() && new URL(r.url()).origin === goc) traLoiTrang.push({ cach: r.request().method(), duong: new URL(r.url()).pathname, ma: r.status(), dem: r.headers()['cache-control'] ?? '' }); });
      const hopThoai = [];
      p.on('dialog', d => { hopThoai.push(d.message()); d.dismiss().catch(() => {}); });
      const soLanDangNhap = () => mayGia.dem()['auth:dang_nhap'] ?? 0;
      const docTrang = () => p.evaluate(() => ({
        loi: document.querySelector('.nb-bao.loi')?.textContent?.trim() ?? null,
        email: document.querySelector('input[name="email"]')?.value ?? null,
        mk: document.querySelector('input[name="mat_khau"]')?.value ?? null,
      })).catch(() => ({}));
      const choYen = async () => { await p.waitForLoadState('load').catch(() => {}); await cho(400); };

      await p.goto(goc + `/noi-bo/dang-nhap?nn=${nn}`, { waitUntil: 'load' });   // đặt cookie ngôn ngữ, về /noi-bo/dang-nhap
      if (!ok(`${ten}: trang đăng nhập (đã nối database) hiện form thật`, await p.locator('form.nb-the input[name="mat_khau"]').count() === 1, p.url())) {
        await chupLoi(`dang-nhap-${nn}-${loai}`); await c.close(); continue;
      }
      await p.fill('input[name="email"]', email);
      await p.fill('input[name="mat_khau"]', matKhau);
      const moc = luot.length;
      await Promise.all([p.waitForNavigation({ timeout: 20_000 }), p.click('form.nb-the button[type="submit"]')]);
      await choYen();
      const sauGui = await docTrang();
      const post = luot.slice(moc).filter(l => l.trang && l.cach === 'POST');
      ok(`${ten}: Supabase Auth giả nhận đúng MỘT lượt đăng nhập; trình duyệt gửi đúng một lượt POST`, soLanDangNhap() === 1 && post.length === 1,
         `đăng nhập: ${soLanDangNhap()} · ${JSON.stringify(luot.slice(moc).filter(l => l.trang).map(l => `${l.cach} ${l.duong}`))}`);
      ok(`${ten}: RÀ SOÁT VÒNG BỐN — lượt POST trả 303, trang báo lỗi là lượt GET /noi-bo/dang-nhap (không no-store thì không đạt)`,
         JSON.stringify(traLoiTrang.slice(-2).map(t => `${t.cach} ${t.duong} ${t.ma}`)) === JSON.stringify(['POST /noi-bo/dang-nhap 303', 'GET /noi-bo/dang-nhap 200'])
         && /no-store/.test(traLoiTrang.at(-1)?.dem ?? '') && p.url() === goc + '/noi-bo/dang-nhap', `${JSON.stringify(traLoiTrang)} · ${p.url()}`);
      ok(`${ten}: câu lỗi đúng từng chữ (${nn})${loai === 'sai' ? '' : ' — nói rõ không phải do sai mật khẩu'}`, sauGui.loi === CAU[loai][nn], JSON.stringify(sauGui.loi));
      ok(`${ten}: email đã gõ được điền lại, ô mật khẩu trống; mật khẩu không nằm ở đâu trong trang`,
         sauGui.email === email && sauGui.mk === '' && !(await p.content()).includes(matKhau), JSON.stringify({ ...sauGui, mk: sauGui.mk === matKhau ? '(mật khẩu)' : sauGui.mk }));

      // F5 trên trang báo lỗi, Quay lại + F5, Tiến + F5: không lượt POST nào, Supabase không nhận thêm lượt đăng nhập nào.
      const moc2 = luot.length;
      await p.reload({ waitUntil: 'load' }).catch(() => {}); await choYen();
      const sauF5 = await docTrang();
      await p.evaluate(() => history.back()).catch(() => {}); await choYen();
      await p.reload({ waitUntil: 'load' }).catch(() => {}); await choYen();
      await p.evaluate(() => history.forward()).catch(() => {}); await choYen();
      await p.reload({ waitUntil: 'load' }).catch(() => {}); await choYen();
      const sau = luot.slice(moc2);
      ok(`${ten}: RÀ SOÁT VÒNG BỐN — F5, Quay lại + F5, Tiến + F5: không lượt POST nào, Supabase không nhận thêm lượt đăng nhập nào, không hộp thoại`,
         sau.filter(l => l.trang).length >= 3 && sau.every(l => l.cach !== 'POST' && !l.than.includes(matKhau)) && soLanDangNhap() === 1 && hopThoai.length === 0,
         `đăng nhập: ${soLanDangNhap()} · ${JSON.stringify(sau.filter(l => l.trang).map(l => `${l.cach} ${l.duong}`))} · hộp thoại: ${JSON.stringify(hopThoai)}`);
      ok(`${ten}: F5 trên trang báo lỗi là form trống — câu lỗi chỉ hiện một lần, email không còn`,
         sauF5.loi === null && sauF5.email === '' && sauF5.mk === '', JSON.stringify(sauF5));
      await c.close();
    }
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  await nhom('15 · HỆ THỐNG BẬN ĐÚNG LÚC GỬI FORM (Supabase Auth giả bận): LỊCH SỬ KHÔNG CÒN MỤC POST, TOKEN KHÔNG BỊ GỬI LẠI', async () => {
    // Issue #194, đợt 3. Supabase bận đúng lúc bấm Lưu thì middleware trả trang 503 "hệ thống đang bận" làm trả lời của
    // lượt POST (lib/qua-tai.ts, trangQuaTai): mục lịch sử đó giữ nguyên thân form — ở đây là refresh token của Zalo
    // OA. Trang 503 vẫn giữ (lượt POST nhận trả lời lỗi nên trình duyệt còn bản lưu đệm của trang form — lời dặn "bấm
    // Quay lại rồi gửi lại" đúng; phần đó đo ở trinh-duyet.mjs nhóm 4), nhưng tự thay mục của nó bằng GET
    // /noi-bo/chua-ghi. Form gửi đi được dựng trên một trang công khai của chính website (trang 404 — không Meta Pixel,
    // không hỏi Supabase): lúc Supabase bận thì không trang nội bộ nào mở ra được để có form mà bấm. Cookie phiên đặt
    // thẳng, access token "ban-…" để Supabase Auth giả trả 429 cho lượt kiểm phiên (gia-supabase.mjs, traLoiAuth).
    const CAU = {
      vi: { chuaGhi: 'Thao tác vừa gửi CHƯA được ghi.', khongDangXuat: 'Bạn KHÔNG bị đăng xuất.', guiLai: 'Đợi vài giây, bấm nút Quay lại của trình duyệt rồi gửi lại.', taiLai: 'Tải lại trang' },
      en: { chuaGhi: 'What you just sent was NOT saved.', khongDangXuat: 'You have NOT been logged out.', guiLai: 'Wait a few seconds, press the browser Back button, then send it again.', taiLai: 'Reload the page' },
    };
    const DICH = '/noi-bo/zalo/cai-dat';
    for (const nn of ['vi', 'en']) {
      const ten = `${nn} · Cài đặt Zalo`;
      const token = `rt-zalo-thu-${nn}-${Date.now()}-bi-mat-AbCdEf0123456789`;
      mayGia.datKichBan('day-du');   // xóa bộ đếm
      const c = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
      await c.addCookies([
        { name: 'bt_phien', value: encodeURIComponent(JSON.stringify({ access_token: `ban-${nn}-${Date.now()}`, refresh_token: 'rt-phien-thu' })), url: goc },
        { name: 'nb_ngon_ngu', value: nn, url: goc + '/noi-bo' },
      ]);
      const p = await c.newPage();
      const cdp = await c.newCDPSession(p);
      const luot = [];
      p.on('request', r => {
        const u = new URL(r.url());
        if (u.origin === goc) luot.push({ cach: r.method(), duong: u.pathname + u.search, trang: r.isNavigationRequest(), than: r.postData() ?? '' });
      });
      const traLoiTrang = [];
      p.on('response', r => { if (r.request().isNavigationRequest() && new URL(r.url()).origin === goc) traLoiTrang.push({ cach: r.request().method(), duong: new URL(r.url()).pathname, ma: r.status(), dem: r.headers()['cache-control'] ?? '' }); });
      const hopThoai = [];
      p.on('dialog', d => { hopThoai.push(d.message()); d.dismiss().catch(() => {}); });
      const soLanKiemPhien = () => mayGia.dem()['auth:kiem_phien'] ?? 0;
      const choYen = async () => { await p.waitForLoadState('load').catch(() => {}); await cho(500); };

      const DAU = '/khong-co-trang-nay-thu-ban';
      await p.goto(goc + DAU, { waitUntil: 'load' });
      await p.evaluate(({ dich, token }) => {
        document.body.innerHTML = `<form id="form-thu" method="POST" action="${dich}"><input type="hidden" name="viec" value="token">`
          + `<input type="password" name="refresh_token" value="${token}"><button id="nut-thu" type="submit">Lưu token</button></form>`;
      }, { dich: DICH, token });
      const moc = luot.length;
      await Promise.all([p.waitForURL(goc + '/noi-bo/chua-ghi', { timeout: 15_000 }).catch(() => {}), p.click('#nut-thu')]);
      await choYen();
      const post = luot.slice(moc).filter(l => l.trang && l.cach === 'POST');
      ok(`${ten}: Supabase Auth giả nhận đúng MỘT lượt kiểm phiên (của lượt POST); trình duyệt gửi đúng một lượt POST, mang token`,
         soLanKiemPhien() === 1 && post.length === 1 && post[0].duong === DICH && post[0].than.includes(token),
         `kiểm phiên: ${soLanKiemPhien()} · ${JSON.stringify(luot.slice(moc).filter(l => l.trang).map(l => `${l.cach} ${l.duong}`))}`);
      if (!ok(`${ten}: #194 — lượt POST nhận trang 503 như cũ, rồi trang đó tự thay bằng GET /noi-bo/chua-ghi (503, no-store)`,
         JSON.stringify(traLoiTrang.slice(-2).map(t => `${t.cach} ${t.duong} ${t.ma}`)) === JSON.stringify([`POST ${DICH} 503`, 'GET /noi-bo/chua-ghi 503'])
         && /no-store/.test(traLoiTrang.at(-1)?.dem ?? '') && p.url() === goc + '/noi-bo/chua-ghi', `${JSON.stringify(traLoiTrang)} · ${p.url()}`)) {
        await chupLoi(`ban-luc-gui-${nn}`);
      }
      const trang = await p.evaluate(() => ({ chu: document.body?.innerText ?? '', link: document.querySelector('main a')?.getAttribute('href') ?? null, lang: document.documentElement.lang })).catch(() => ({}));
      ok(`${ten}: trang báo nói đúng từng chữ (${nn}): CHƯA ghi, KHÔNG bị đăng xuất, bấm Quay lại rồi gửi lại; nút "${CAU[nn].taiLai}" về ${DICH}`,
         Object.values(CAU[nn]).every(x => (trang.chu ?? '').includes(x)) && trang.link === DICH && trang.lang === nn, JSON.stringify(trang));
      ok(`${ten}: token không nằm ở đâu trong trang báo`, !(await p.content().catch(() => token)).includes(token));
      const ls = await cdp.send('Page.getNavigationHistory').catch(() => ({ entries: [] }));
      ok(`${ten}: #194 — lịch sử không còn mục nào của lượt POST (không mục form_submit, không mục ${DICH}): Quay lại là về trang trước, F5 không gửi lại form`,
         ls.entries.length >= 2 && ls.entries.every(e => e.transitionType !== 'form_submit' && new URL(e.url).pathname !== DICH)
         && new URL(ls.entries.at(-1).url).pathname === '/noi-bo/chua-ghi',
         JSON.stringify(ls.entries.map(e => `${e.url.replace(goc, '')} ${e.transitionType}`)));

      // F5 trên trang báo, Quay lại, Tiến + F5: không lượt POST nào, token không đi ra lần nữa, Supabase không bị hỏi thêm.
      const moc2 = luot.length;
      await p.reload({ waitUntil: 'load' }).catch(() => {}); await choYen();
      await p.evaluate(() => history.back()).catch(() => {}); await choYen();
      const sauLui = p.url();
      await p.evaluate(() => history.forward()).catch(() => {}); await choYen();
      await p.reload({ waitUntil: 'load' }).catch(() => {}); await choYen();
      const sau = luot.slice(moc2);
      ok(`${ten}: #194 — F5, Quay lại, Tiến + F5: không lượt POST nào, token không đi ra lần nào nữa, trang báo không hỏi Supabase, không hộp thoại`,
         sau.filter(l => l.trang).length >= 3 && sau.every(l => l.cach !== 'POST' && !l.than.includes(token) && !l.duong.includes(token))
         && soLanKiemPhien() === 1 && hopThoai.length === 0,
         `kiểm phiên: ${soLanKiemPhien()} · ${JSON.stringify(sau.filter(l => l.trang).map(l => `${l.cach} ${l.duong}`))} · hộp thoại: ${JSON.stringify(hopThoai)}`);
      ok(`${ten}: Quay lại từ trang báo về đúng trang có form (${DAU}), Tiến tới lại là trang báo`,
         sauLui === goc + DAU && p.url() === goc + '/noi-bo/chua-ghi', `${sauLui} → ${p.url()}`);
      await c.close();
    }
    mayGia.datKichBan('day-du');
  });

  // =========================================================================
  await nhom('16 · NỘI BỘ: ĐĂNG NHẬP THẬT QUA AUTH GIẢ, BẤM ĐĂNG XUẤT RỒI QUAY LẠI; PHIÊN BỊ THU HỒI RỒI QUAY LẠI VỀ TRANG KẾT QUẢ CỦA FORM', async () => {
    // Cùng phép đo với nhóm 4 của trinh-duyet.mjs (bản build, không database: form Đăng xuất dựng tay trên trang đăng
    // nhập), ở đây với đăng nhập thật và trang nội bộ thật. Chromium BẢN ĐẦY ĐỦ (channel 'chromium', bỏ cờ
    // --disable-back-forward-cache của Playwright): bản rút gọn không có bfcache. KHÔNG route nào (moChromiumKhongRoute):
    // route tắt bộ nhớ đệm HTTP, và lúc đó chính trình duyệt gửi lại form khi bấm Quay lại — phép thử "không lượt POST
    // nào ra mạng" đo sai.
    let trinhDuyetBoNho = null;
    try {
      trinhDuyetBoNho = await moChromiumKhongRoute(chromium, { channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'] });
    } catch (e) {
      ok('Mở được Chromium bản đầy đủ để thử nút Quay lại (thiếu thì: cd web && npx playwright install chromium)', false, String(e.message).split('\n')[0]);
      return;
    }
    /**
     * Mọi lời gọi vào trang đều có hạn: Playwright không đọc được một trang đang chờ lượt tải của chính nó, và mặc định
     * không có hạn. Hết hạn thì `undefined` — mọi phép so bên dưới so ĐÚNG giá trị mong đợi, nên "không đọc được" không
     * bao giờ thành đạt.
     */
    const coHan = (viec, hetMs = 5000) => {
      let hen;
      return Promise.race([
        Promise.resolve(viec).catch(() => undefined),
        new Promise(xong => { hen = setTimeout(() => xong(undefined), hetMs); }),
      ]).finally(() => clearTimeout(hen));
    };
    const trongTrang = (t, ham, thamSo) => coHan(t.evaluate(ham, thamSo));
    /** Chờ tới khi `dieuKien()` đúng, tối đa hetMs — không chờ cứng: máy CI chậm thì chờ lâu hơn, không đỏ oan. */
    const choDen = async (dieuKien, hetMs = 10_000) => {
      const het = Date.now() + hetMs;
      for (;;) {
        const dat = await dieuKien();
        if (dat || Date.now() >= het) return dat;
        await cho(100);
      }
    };

    // CHÍNH TRANG ghi lại (vào sessionStorage — còn qua lần chuyển trang, riêng từng tab; nhãn "b" + số ở ?buoc=):
    //   · hien — lúc trình duyệt báo trang hiện lại từ bộ nhớ quay lại (pageshow, tai nghe gắn trước mọi mã của trang):
    //            trang có đang bị giấu không. Mã của trang còn xét lại lúc thẻ hiện ra (visibilitychange — Chromium báo
    //            TRƯỚC pageshow), nên trang dấu không đổi thì lúc này đã được cho hiện lại; dấu đã đổi thì phải vẫn giấu;
    //   · giau — lần đầu trang bị giấu thì thân trang (<body>) đã được dựng chưa;
    //   · kieu — trình duyệt dựng từng tài liệu ở địa chỉ này theo kiểu nào, nối theo thứ tự (navigate, back_forward,
    //            reload). Trang hiện lại từ bfcache không phải tài liệu mới nên không thêm gì;
    //   · gui, roi, xet — lúc gửi một form, lúc trang RỜI đi, và lúc trang hiện lại từ bộ nhớ, SAU khi mã của trang đã
    //            chạy: trang có bị giấu không, mã của trang có cho nó hiện lại không. Gắn bằng danhDau sau khi trang tải
    //            xong — sự kiện chạy tai nghe theo thứ tự gắn, còn mã ghi ở đây chạy trước mọi mã của trang.
    const GHI_TRANG = () => {
      // Chỉ khung chính: mã này chạy ở mọi khung, kể cả khung YouTube bị chặn (trang lỗi, không có sessionStorage).
      if (window.top !== window) return;
      const nhan = () => 'b' + (new URLSearchParams(location.search).get('buoc') ?? '');
      const ghi = (ten, giaTri) => {
        try { sessionStorage.setItem(`thu:${nhan()}:${ten}`, giaTri); } catch { /* about:blank — không cần ghi */ }
      };
      try {
        ghi('kieu', `${sessionStorage.getItem(`thu:${nhan()}:kieu`) ?? ''}${performance.getEntriesByType('navigation')[0]?.type ?? '?'},`);
      } catch { /* như trên */ }
      window.addEventListener('pageshow', suKien => {
        if (suKien.persisted) ghi('hien', document.documentElement.style.visibility || 'hien');
      });
      let daGhi = false;
      new MutationObserver(() => {
        if (daGhi || document.documentElement?.style.visibility !== 'hidden') return;
        daGhi = true;
        ghi('giau', document.body ? 'co-than' : 'chua-co-than');
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] });
    };
    const danhDau = (t, nhan) => trongTrang(t, n => {
      window.__taiLieuCu = true;
      const ghi = ten => { try { sessionStorage.setItem(`thu:${n}:${ten}`, document.documentElement.style.visibility || 'hien'); } catch { /* bỏ qua */ } };
      window.addEventListener('submit', () => ghi('gui'));
      window.addEventListener('pagehide', () => ghi('roi'));
      window.addEventListener('pageshow', suKien => { if (suKien.persisted) ghi('xet'); });
    }, nhan);
    const ghiNhan = async (t, nhan) => (await trongTrang(t, n => Object.fromEntries(
      ['gui', 'roi', 'hien', 'xet', 'giau', 'kieu'].map(ten => [ten, sessionStorage.getItem(`thu:${n}:${ten}`)])), nhan)) ?? { khongDocDuoc: true };
    /** true = còn tài liệu cũ; false = tài liệu mới; undefined = không đọc được trang. */
    const conTaiLieuCu = t => trongTrang(t, () => window.__taiLieuCu === true);
    const dauTrongTrang = async t => (await trongTrang(t, () => {
      const the = document.querySelectorAll('script[data-dau-phien]');
      const khop = document.cookie.match(/(?:^|;\s*)bt_dau_phien=([^;]*)/);
      return { soThe: the.length, trongDau: document.head.querySelectorAll('script[data-dau-phien]').length,
        inVao: the[0]?.getAttribute('data-dau-phien') ?? null, cookie: khop ? khop[1] : '' };
    })) ?? { khongDocDuoc: true };

    /**
     * Mọi lượt dựng trang (Document) của tab tới web này, theo thứ tự, đọc từ DevTools Protocol của chính trình duyệt.
     * tuBoNhoDem: lượt đó được trả từ bộ nhớ đệm HTTP — KHÔNG ra mạng. loi: lượt hỏng, như trình duyệt báo; bấm Quay
     * lại về một trang kết quả POST mà bộ nhớ đệm không còn nó thì trình duyệt CHỈ tra bộ nhớ đệm, báo net::ERR_CACHE_MISS
     * và hiện trang "xác nhận gửi lại form" của nó — cũng không ra mạng. Sự kiện "request" của Playwright báo mọi loại như
     * nhau (lượt dựng lại từ bộ nhớ đệm hiện ra là một "POST" dù máy chủ không nhận gì), nên không dùng được.
     */
    const ghiMang = async (c, t) => {
      const ds = [];
      const theoId = new Map();
      const cdp = await c.newCDPSession(t);
      await cdp.send('Network.enable');
      cdp.on('Network.requestWillBeSent', e => {
        if (e.type !== 'Document' || !e.request.url.startsWith(goc)) return;
        const truoc = theoId.get(e.requestId);
        if (truoc && e.redirectResponse) truoc.tuBoNhoDem = !!e.redirectResponse.fromDiskCache;
        const u = new URL(e.request.url);
        const dong = { cach: e.request.method, duong: u.pathname + u.search, tuBoNhoDem: false };
        ds.push(dong);
        theoId.set(e.requestId, dong);
      });
      const tuBoNho = id => { const d = theoId.get(id); if (d) d.tuBoNhoDem = true; };
      cdp.on('Network.requestServedFromCache', e => tuBoNho(e.requestId));
      cdp.on('Network.responseReceived', e => { if (e.response.fromDiskCache || e.response.fromPrefetchCache) tuBoNho(e.requestId); });
      cdp.on('Network.loadingFailed', e => { const d = theoId.get(e.requestId); if (d) d.loi = e.errorText; });
      return ds;
    };
    const KHONG_CO_TRONG_BO_NHO_DEM = 'net::ERR_CACHE_MISS';
    const raMang = (ds, tu = 0) => ds.slice(tu).filter(d => !d.tuBoNhoDem && d.loi !== KHONG_CO_TRONG_BO_NHO_DEM);

    /** Một tab trong context mới: cookie, bộ nhớ quay lại, bộ nhớ đệm HTTP riêng. */
    const moTab = async () => {
      const c = await trinhDuyetBoNho.newContext({ viewport: { width: 1280, height: 800 } });
      await c.addInitScript(GHI_TRANG);
      const t = await c.newPage();
      const loiJs = [];
      t.on('pageerror', e => loiJs.push(e.message));
      // Lượt nào ra khỏi máy này mà nhận được trả lời (Meta, phông Google, khung YouTube…) — phải không có lượt nào.
      const raNgoai = [];
      c.on('requestfinished', r => { if (/^https?:/.test(r.url()) && !r.url().startsWith(goc)) raNgoai.push(r.url()); });
      const mang = await ghiMang(c, t);
      return { c, t, mang, loiJs, raNgoai };
    };
    /** Mốc của nhật ký Auth giả (số thứ tự lượt cuối) và các lượt từ sau mốc đó. */
    const mocAuth = () => mayGia.nhatKyAuth().at(-1)?.so ?? 0;
    const authTu = moc => mayGia.nhatKyAuth().filter(d => d.so > moc);
    /**
     * Đăng nhập như người dùng: gõ email, mật khẩu vào form của /noi-bo/dang-nhap, bấm nút — máy chủ đưa vào kho.
     * moTrang: false = điền form của trang đăng nhập đang mở (không thêm bước lịch sử). Trả mã phiên Auth giả vừa cấp.
     */
    const dangNhap = async (t, { moTrang = true } = {}) => {
      const moc = mocAuth();
      if (moTrang) await t.goto(goc + '/noi-bo/dang-nhap', { waitUntil: 'load', timeout: 30_000 });
      await t.fill('input[name="email"]', NHAN_VIEN_THU.email);
      await t.fill('input[name="mat_khau"]', NHAN_VIEN_THU.matKhau);
      await Promise.all([
        t.waitForURL(u => u.pathname === '/noi-bo/kho', { timeout: 30_000 }),
        t.click('form.nb-the button[type="submit"]'),
      ]);
      await t.waitForLoadState('load').catch(() => {});
      return authTu(moc).find(d => d.cua === 'token' && d.loai === 'password' && d.status === 200)?.phien ?? null;
    };
    // Hỏi theo một địa chỉ dưới /noi-bo: bt_dau_phien chỉ gửi dưới đường dẫn đó (Path=/noi-bo), bt_phien gửi ở mọi nơi.
    const cookieCua = async (c, ten) => (await c.cookies(goc + '/noi-bo/')).find(cookie => cookie.name === ten) ?? null;
    /** Cặp token cookie bt_phien đang giữ (Astro mã hóa giá trị cookie bằng encodeURIComponent). */
    const tokenCua = async c => {
      const cookie = await cookieCua(c, 'bt_phien');
      try { return cookie ? JSON.parse(decodeURIComponent(cookie.value)) : null; } catch { return null; }
    };
    /**
     * Bấm Quay lại rồi chờ yên. Lùi bằng history.back(): page.goBack() chờ sự kiện load, thứ không có khi trang hiện lại
     * từ bfcache. mongXinLai: chờ tới 10 giây cho một lượt GET tới đúng địa chỉ `duongCho` (đường dẫn + chuỗi hỏi, so
     * nguyên — `?buoc=1` không được khớp nhầm `?buoc=10`) ra mạng; không mong thì chờ 1 giây.
     * Rồi chờ thêm 1 giây: một vòng tải lại lặp, hay một lượt POST đi trễ, lộ ra trong lúc này. Chỉ chờ trang tải xong
     * khi có lượt nào ra mạng — trang hiện lại từ bfcache không có sự kiện load.
     */
    const luiVe = async (t, mang, duongCho, mongXinLai) => {
      const moc = mang.length;
      await trongTrang(t, () => { history.back(); });
      if (mongXinLai) await choDen(() => raMang(mang, moc).some(d => d.cach === 'GET' && d.duong === duongCho));
      else await cho(1000);
      if (raMang(mang, moc).length) {
        await t.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
        await choDen(async () => (await conTaiLieuCu(t)) === false, 5000);
      }
      await cho(1000);
      const ra = raMang(mang, moc);
      return {
        sau: mang.slice(moc), raMang: ra, url: t.url(), taiLieuCu: await conTaiLieuCu(t),
        xinLaiGet: ra.some(d => d.cach === 'GET' && d.duong === duongCho),
        postRaMang: ra.filter(d => d.cach === 'POST'),
      };
    };
    const chuTrang = async t => (await coHan(t.locator('body').innerText())) ?? '';
    const tom = x => JSON.stringify(x).slice(0, 600);

    async function thuNoiBo() {
      // Lần đầu mở một trang, astro dev còn dựng mã của nó (có khi tải lại trang giữa chừng): mở mỗi trang một lượt trước.
      {
        const { c, t } = await moTab();
        const trangThai = [];
        try {
          await dangNhap(t);
          for (const duong of ['/noi-bo/kho', '/noi-bo/dao-tao', '/noi-bo/kho/huong-dan', '/noi-bo/chuc-nang']) {
            let r = null;
            for (let lan = 0; lan < 3 && r?.status() !== 200; lan++) r = await t.goto(goc + duong, { waitUntil: 'load', timeout: 60_000 }).catch(() => null);
            trangThai.push(`${duong} ${r?.status() ?? 'không trả lời'}${new URL(t.url()).pathname === duong ? '' : ` → ${new URL(t.url()).pathname}`}`);
          }
        } finally { await coHan(c.close(), 10_000); }
        ok('Supabase giả đủ cho bốn trang nội bộ của nhóm này: đăng nhập thật rồi mở được kho, Video đào tạo, Hướng dẫn kho, Tất cả chức năng (200, không bị đưa đi chỗ khác)',
           trangThai.length === 4 && trangThai.every(s => / 200$/.test(s)), trangThai.join(' · '));
      }

      // ---- Bấm nút Đăng xuất thật trên một trang NoiBo và một trang Kho, rồi Quay lại ---------------------------------
      for (const { khung, duong, chonTen, moMenu, buoc } of [
        { khung: 'Trang NoiBo', duong: '/noi-bo/dao-tao', chonTen: 'header .nb-ten', moMenu: false, buoc: 1 },
        { khung: 'Trang Kho', duong: '/noi-bo/kho/huong-dan', chonTen: 'header .kho-nguoi-ten', moMenu: true, buoc: 3 },
      ]) {
        const { c, t, mang, loiJs, raNgoai } = await moTab();
        try {
          const phienId = await dangNhap(t);
          const tenKho = await chuTrang(t);
          ok(`${khung}: đăng nhập thật bằng form /noi-bo/dang-nhap → Auth giả cấp một phiên, máy chủ đưa vào kho, trang mang tên nhân viên`,
             !!phienId && new URL(t.url()).pathname === '/noi-bo/kho' && tenKho.includes(NHAN_VIEN_THU.hoTen) && !!(await cookieCua(c, 'bt_phien'))?.httpOnly,
             `${t.url()} · phiên ${phienId}`);
          const diaChi = `${duong}?buoc=${buoc}`;
          await t.goto(goc + diaChi, { waitUntil: 'load', timeout: 30_000 });
          await danhDau(t, `b${buoc}`);
          const dau = await dauTrongTrang(t);
          const ten = (await coHan(t.locator(chonTen).first().innerText())) ?? '';
          ok(`${khung} ${duong}: đúng một thẻ script[data-dau-phien], nằm trong <head>, mang đúng dấu trình duyệt đang giữ; trang mang tên người đăng nhập`,
             dau.soThe === 1 && dau.trongDau === 1 && dau.inVao === dau.cookie && ten.includes(NHAN_VIEN_THU.hoTen), tom({ ...dau, ten }));

          // Đối chứng: chính trang này vào được bfcache (khung YouTube bị chặn, mã HMR của astro dev không làm nó mất chỗ
          // trong bộ nhớ quay lại). Không có bfcache thì Quay lại nào cũng xin lại trang, và phép thử dưới đạt mà không đo gì.
          // Rời trang thì trang luôn được giấu (bản cất đi là bản đã giấu); dấu không đổi thì mã của trang cho nó hiện lại.
          await t.goto(goc + `/noi-bo/chuc-nang?buoc=${buoc + 1}`, { waitUntil: 'load', timeout: 30_000 });
          const doiChung = await luiVe(t, mang, diaChi, false);
          const ghiDc = await ghiNhan(t, `b${buoc}`);
          const hienGio = await trongTrang(t, () => document.documentElement.style.visibility);
          ok(`Đối chứng (${khung}): trình duyệt thử có bfcache với chính trang này — Quay lại bình thường đưa lại đúng trang cũ, không hỏi máy chủ; bản cất đi là bản đã giấu (rời trang là giấu), và mã của trang cho nó hiện lại vì dấu phiên không đổi`,
             doiChung.url === goc + diaChi && doiChung.taiLieuCu === true && doiChung.sau.length === 0
             && ghiDc.roi === 'hidden' && ghiDc.xet === 'hien' && hienGio === '',
             `${trinhDuyetBoNho.version()} · ${doiChung.url} · còn tài liệu cũ: ${doiChung.taiLieuCu} · lượt dựng trang: ${tom(doiChung.sau)} · ${tom(ghiDc)} · visibility «${hienGio}»`);

          const mocRa = mocAuth();
          if (moMenu) await t.click('header details.kho-nguoi > summary');
          await Promise.all([
            t.waitForURL(u => u.pathname === '/noi-bo/dang-nhap', { timeout: 30_000 }),
            t.click(moMenu ? 'header .kho-nguoi-menu form[action="/noi-bo/dang-xuat"] button[type="submit"]' : 'header form.nb-ai button[type="submit"]'),
          ]);
          await t.waitForLoadState('load').catch(() => {});
          const raAuth = authTu(mocRa).filter(d => d.cua === 'logout');
          const dauMoi = (await cookieCua(c, 'bt_dau_phien'))?.value ?? '';
          ok(`${khung}: bấm nút Đăng xuất thật → về trang đăng nhập; Auth giả nhận đúng một lượt /logout phạm vi local của chính phiên này, phiên hết sống; cookie phiên bị xóa, dấu phiên đổi`,
             raAuth.length === 1 && raAuth[0].pham_vi === 'local' && raAuth[0].phien === phienId && raAuth[0].status === 204
             && mayGia.phienAuth().find(p => p.id === phienId)?.conSong === false && !(await cookieCua(c, 'bt_phien'))
             && /^[0-9a-f-]{36}$/.test(dauMoi) && dauMoi !== dau.cookie,
             `${tom(raAuth)} · dấu ${dau.cookie || '(chưa có)'} → ${dauMoi}`);
          const roi = await ghiNhan(t, `b${buoc}`);
          ok(`${khung}: trang bị GIẤU ngay lúc gửi form Đăng xuất (trước khi máy chủ trả lời), và vẫn giấu lúc rời đi`,
             roi.gui === 'hidden' && roi.roi === 'hidden', tom(roi));

          const lui = await luiVe(t, mang, diaChi, true);
          const ghi = await ghiNhan(t, `b${buoc}`);
          const chu = await chuTrang(t);
          ok(`${khung}: bấm Quay lại sau khi Đăng xuất → bản hiện lại từ bộ nhớ quay lại vẫn bị GIẤU lúc trình duyệt báo nó hiện ra, và mã của trang KHÔNG cho nó hiện lại (dấu phiên đã đổi)`,
             ghi.hien === 'hidden' && ghi.xet === 'hidden', tom(ghi));
          ok(`${khung}: …trang được xin lại từ máy chủ (một lượt GET ra mạng, không lượt POST nào), máy chủ đưa về trang đăng nhập — trang cũ không còn, không còn tên nhân viên`,
             lui.xinLaiGet && lui.postRaMang.length === 0 && lui.taiLieuCu === false && new URL(lui.url).pathname === '/noi-bo/dang-nhap'
             && !chu.includes(NHAN_VIEN_THU.hoTen),
             `${lui.url} · còn tài liệu cũ: ${lui.taiLieuCu} · lượt dựng trang: ${tom(lui.sau)}`);
          ok(`${khung}: không lỗi JavaScript; không lượt nào ra khỏi máy này (Meta, phông Google, YouTube đều bị chặn ở tầng mạng)`,
             loiJs.length === 0 && raNgoai.length === 0, [...loiJs, ...raNgoai].slice(0, 3).join(' | '));
        } finally { await coHan(c.close(), 10_000); }
      }

      // ---- Phiên bị thu hồi ở Auth giả, rồi Quay lại về trang kết quả của một form -----------------------------------
      // Form sửa tên video: ghi được thì chuyển hướng 303 sang GET; KHÔNG ghi được thì trang dựng lại ngay trên lượt POST
      // (lib/gui-noi-bo.ts) — mục lịch sử của trang đó là một lượt POST, và trang đó không vào bfcache. Ở đây một quản lý
      // khác vừa sửa video (suaBang) nên database không ghi. Rồi phiên bị thu hồi ở Auth — người đó đăng xuất mọi máy từ
      // một máy khác, người quản trị xóa phiên: trình duyệt này không được báo gì, tới lượt mở trang kế tiếp máy chủ mới biết
      // (layPhien: /user 403, làm mới 400 → xoaToken: xóa cookie phiên, đổi dấu; trả lời mang Clear-Site-Data).
      //   · Chromium nghe Clear-Site-Data: bản lưu đệm của trang kết quả bị bỏ; bấm Quay lại thì trình duyệt chỉ tra bộ nhớ
      //     đệm, không thấy, và hiện trang "xác nhận gửi lại form" của nó — không gửi gì;
      //   · trình duyệt không nghe lệnh đó: bản lưu đệm còn; bấm Quay lại thì trình duyệt dựng lại trang kết quả từ nó (kiểu
      //     back_forward), dấu lệch — đoạn mã phải xin lại trang bằng GET, KHÔNG gửi lại form. Giả bằng cách tự đặt đúng hai
      //     cookie mà trả lời kết thúc phiên đặt (xóa cookie phiên, dấu mới — Path=/), như nhóm 4 của trinh-duyet.mjs: không
      //     gỡ được Clear-Site-Data khỏi trả lời thật — Chromium xử lý nó (cùng Set-Cookie) trước cả tầng chặn của DevTools,
      //     đã thử 15/11. Lượt mở trang kế tiếp không còn cookie phiên nên máy chủ chỉ đưa về trang đăng nhập, không kết
      //     thúc phiên nào nữa, không gửi Clear-Site-Data;
      //   · như cảnh trên, nhưng đăng nhập lại TRƯỚC khi Quay lại: form cũ mà bị gửi lại thì chạy dưới phiên mới, như của
      //     người đăng nhập sau (vòng rà soát bốn 14/11 đo được đúng lỗi này với bản trước của đoạn mã).
      for (const { canh, buoc, ngheXoa, dangNhapLai } of [
        { canh: 'Phiên bị thu hồi rồi Quay lại về trang kết quả của form (Chromium nghe Clear-Site-Data)', buoc: 10, ngheXoa: true, dangNhapLai: false },
        { canh: 'Phiên bị thu hồi rồi Quay lại về trang kết quả của form (trình duyệt không nghe Clear-Site-Data)', buoc: 20, ngheXoa: false, dangNhapLai: false },
        { canh: 'Phiên bị thu hồi, đăng nhập lại, rồi Quay lại về trang kết quả của form (trình duyệt không nghe Clear-Site-Data)', buoc: 30, ngheXoa: false, dangNhapLai: true },
      ]) {
        const { c, t, mang, loiJs, raNgoai } = await moTab();
        try {
          await dangNhap(t);
          const diaChi = `/noi-bo/dao-tao?buoc=${buoc}`;
          await t.goto(goc + diaChi, { waitUntil: 'load', timeout: 30_000 });
          const banKhac = mayGia.suaBang('video_dao_tao', VIDEO_THU.id, { tieu_de: `Bản người khác vừa sửa ${buoc}` });
          await t.click('details.vd-sua > summary');
          await t.fill('details.vd-sua form:not(.vd-xoa) input[name="tieu_de"]', `Tên tôi vừa gõ ${buoc}`);
          const mocGui = mang.length;
          const patchTruoc = mayGia.dem()['PATCH video_dao_tao'] ?? 0;
          await Promise.all([
            t.waitForNavigation({ waitUntil: 'load', timeout: 30_000 }),
            t.click('details.vd-sua form:not(.vd-xoa) button[type="submit"]'),
          ]);
          await danhDau(t, `b${buoc}`);
          const gui = mang.slice(mocGui);
          const bao = ((await coHan(t.locator('main .nb-bao.loi').first().innerText())) ?? '').trim();
          ok(`${canh}: gửi form sửa tên video khi người khác vừa sửa → database không ghi; trang kết quả dựng thẳng từ trả lời của lượt POST (ra mạng, không chuyển hướng), câu "${CAU_VIDEO.nguoiKhacSua.vi}"`,
             gui.length === 1 && gui[0].cach === 'POST' && gui[0].duong === diaChi && !gui[0].tuBoNhoDem && t.url() === goc + diaChi
             && bao === CAU_VIDEO.nguoiKhacSua.vi && (mayGia.dem()['PATCH video_dao_tao'] ?? 0) === patchTruoc + 1,
             `${tom(gui)} · «${bao}»`);

          const token = await tokenCua(c);
          const daThuHoi = token ? mayGia.thuHoiPhien(token.access_token) : 0;
          const dauCu = (await cookieCua(c, 'bt_dau_phien'))?.value ?? '';
          if (!ngheXoa) {
            await c.clearCookies({ name: 'bt_phien' });
            await c.addCookies([{ name: 'bt_dau_phien', value: crypto.randomUUID(), domain: '127.0.0.1', path: '/', sameSite: 'Lax' }]);
          }
          const mocThuHoi = mocAuth();
          await t.goto(goc + `/noi-bo/chuc-nang?buoc=${buoc + 1}`, { waitUntil: 'load', timeout: 30_000 });
          const auth = authTu(mocThuHoi);
          const dauMoi = (await cookieCua(c, 'bt_dau_phien'))?.value ?? '';
          const veDangNhap = new URL(t.url()).pathname === '/noi-bo/dang-nhap' && !(await cookieCua(c, 'bt_phien'))
            && /^[0-9a-f-]{36}$/.test(dauMoi) && dauMoi !== dauCu;
          const moTaDau = `thu hồi ${daThuHoi} · ${tom(auth)} · ${t.url()} · dấu ${dauCu || '(chưa có)'} → ${dauMoi}`;
          if (ngheXoa) {
            ok(`${canh}: Auth giả thu hồi phiên → lượt mở trang kế tiếp bị Auth từ chối (/user 403, làm mới token 400), máy chủ kết thúc phiên ở trình duyệt này: về trang đăng nhập, cookie phiên bị xóa, dấu phiên đổi`,
               daThuHoi === 1 && auth.some(d => d.cua === 'user' && d.status === 403)
               && auth.some(d => d.cua === 'token' && d.loai === 'refresh_token' && d.status === 400) && veDangNhap, moTaDau);
          } else {
            ok(`${canh}: Auth giả thu hồi phiên; trình duyệt mang đúng cookie của một trả lời kết thúc phiên (không cookie phiên, dấu mới) mà bộ nhớ đệm còn nguyên → lượt mở trang kế tiếp về trang đăng nhập, không hỏi Auth`,
               daThuHoi === 1 && auth.length === 0 && veDangNhap, moTaDau);
          }

          if (dangNhapLai) {
            await dangNhap(t, { moTrang: false });
            // Lùi một bước: trang đăng nhập — dựng dưới dấu mới nên hiện lại nguyên từ bộ nhớ quay lại, không làm gì. Bước
            // sau mới là trang kết quả của form.
            const buocDau = await luiVe(t, mang, '/noi-bo/dang-nhap', false);
            ok(`${canh}: (đăng nhập lại xong, lùi bước đầu: trang đăng nhập hiện lại nguyên từ bộ nhớ quay lại, không hỏi máy chủ)`,
               new URL(buocDau.url).pathname === '/noi-bo/dang-nhap' && buocDau.sau.length === 0, `${buocDau.url} · ${tom(buocDau.sau)}`);
          }
          const patchMoc = mayGia.dem()['PATCH video_dao_tao'] ?? 0;
          const lui = await luiVe(t, mang, diaChi, !ngheXoa);
          const ghi = await ghiNhan(t, `b${buoc}`);
          const chu = await chuTrang(t);
          const dauSau = await dauTrongTrang(t);
          const patchSau = mayGia.dem()['PATCH video_dao_tao'] ?? 0;
          ok(`${canh}: KHÔNG có lượt POST nào ra mạng — trình duyệt không gửi lại form`, lui.postRaMang.length === 0, tom(lui.sau));
          if (ngheXoa) {
            ok(`Đối chứng (${canh}): trả lời kết thúc phiên đã bỏ bản lưu đệm của trang kết quả — Quay lại chỉ tra bộ nhớ đệm và không thấy (${KHONG_CO_TRONG_BO_NHO_DEM}), không lượt nào ra mạng`,
               lui.sau.length === 1 && lui.sau[0].cach === 'POST' && lui.sau[0].duong === diaChi && lui.sau[0].loi === KHONG_CO_TRONG_BO_NHO_DEM
               && lui.raMang.length === 0, tom(lui.sau));
            ok(`${canh}: …tab hiện trang "xác nhận gửi lại form" của chính trình duyệt (địa chỉ không còn thuộc web), không phải trang cũ (không câu báo, không tên nhân viên, không đoạn mã của web); Supabase giả không nhận lượt sửa video nào`,
               !t.url().startsWith(goc) && dauSau.soThe !== 1 && !chu.includes(CAU_VIDEO.nguoiKhacSua.vi) && !chu.includes(NHAN_VIEN_THU.hoTen) && patchSau === patchMoc,
               `${t.url()} · «${chu.slice(0, 100)}» · ${tom(dauSau)} · PATCH ${patchMoc} → ${patchSau}`);
          } else {
            ok(`Đối chứng (${canh}): lùi về trang đó là một lượt DỰNG LẠI từ bộ nhớ đệm HTTP (POST không ra mạng, kiểu back_forward) — đúng cảnh mà một lệnh tải lại sẽ gửi lại form`,
               lui.sau[0]?.cach === 'POST' && lui.sau[0]?.duong === diaChi && lui.sau[0]?.tuBoNhoDem === true && /back_forward/.test(ghi.kieu ?? ''),
               `${tom(lui.sau)} · ${tom(ghi)}`);
            ok(`${canh}: …trang được xin lại bằng một lượt GET mới tới đúng địa chỉ, thân trang của bản cũ không bao giờ được dựng`,
               lui.xinLaiGet && ghi.giau === 'chua-co-than', `${tom(lui.sau)} · ${tom(ghi)}`);
            if (dangNhapLai) {
              ok(`${canh}: …form cũ KHÔNG chạy lại dưới phiên mới — Supabase giả không nhận lượt sửa video nào; trang là bản mới của phiên mới (tên video hiện giờ, không câu báo cũ)`,
                 patchSau === patchMoc && t.url() === goc + diaChi && chu.includes(banKhac.tieu_de)
                 && !chu.includes(CAU_VIDEO.nguoiKhacSua.vi) && !chu.includes(`Tên tôi vừa gõ ${buoc}`) && dauSau.soThe === 1 && dauSau.inVao === dauSau.cookie,
                 `${t.url()} · PATCH ${patchMoc} → ${patchSau} · ${tom(dauSau)}`);
            } else {
              ok(`${canh}: …máy chủ đưa về trang đăng nhập; chữ của trang cũ (câu báo, tên nhân viên) không còn; Supabase giả không nhận lượt sửa video nào`,
                 new URL(lui.url).pathname === '/noi-bo/dang-nhap' && !chu.includes(CAU_VIDEO.nguoiKhacSua.vi) && !chu.includes(NHAN_VIEN_THU.hoTen)
                 && patchSau === patchMoc, `${lui.url} · PATCH ${patchMoc} → ${patchSau}`);
            }
          }
          ok(`${canh}: không lỗi JavaScript; không lượt nào ra khỏi máy này`,
             loiJs.length === 0 && raNgoai.length === 0, [...loiJs, ...raNgoai].slice(0, 3).join(' | '));
        } finally { await coHan(c.close(), 10_000); }
      }
    }

    // Hạn cho cả nhóm: một lời gọi vào trình duyệt không trả lời thì nhóm này đỏ sau 4 phút, không treo cả bộ thử.
    let henKhoi;
    try {
      const ketCuc = await Promise.race([
        thuNoiBo().then(() => 'xong'),
        new Promise(xong => { henKhoi = setTimeout(() => xong('het-han'), 240_000); }),
      ]);
      if (ketCuc !== 'xong') ok('Nhóm 16 chạy xong trong 4 phút (không treo)', false, 'một lời gọi vào trình duyệt không trả lời');
    } finally {
      clearTimeout(henKhoi);
      await coHan(trinhDuyetBoNho.close(), 10_000);
    }
  });

  // =========================================================================
  await nhom('17 · TRỢ LÝ TRANG (0126): DÒNG TRỢ LÝ ẢO, NHỊP NHƯ NGƯỜI, THẺ ĐƠN DO TRANG TÍNH, CHO VÀO ĐƠN, MẤT MẠNG, NHÂN VIÊN NHẬN CHAT — 390 PX', async () => {
    const { CACH_DONG_AO, CACH_DONG_AO_CHON, CHU_TRO_LY, LOI_CHAO, dongAo, theDon } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'tro-ly-trang.ts')).href);
    const dongMong = dongAo(CACH_DONG_AO_CHON, false);
    const chuDong = dongMong.dau.vi + dongMong.gach.vi;
    const motDong = s => (s ?? '').replace(/\s+/g, ' ').trim();
    const c = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
    const p = await c.newPage();
    const loiJs = [];
    p.on('pageerror', e => loiJs.push(e.message));
    const chupTrang = async ten => {
      const thuMuc = join(WEB, 'kiem-tra', 'anh-chup', 'tro-ly-trang');
      mkdirSync(thuMuc, { recursive: true });
      await p.screenshot({ path: join(thuMuc, `${ten}-390.png`) });
    };
    try {
      // Công tắc tắt (mua-thit-mo): không có gì của Trang.
      mayGia.datKichBan('mua-thit-mo');
      await p.goto(goc + '/mua-thit-ve', { waitUntil: 'load', timeout: 60000 });
      ok('Công tắc chưa bật (mua-thit-mo): trang không có khối Trang', await p.locator('[data-tlt]').count() === 0);
      // Bật: thẻ mời hiện nhờ script.
      mayGia.datKichBan('mua-thit-trang');
      await p.goto(goc + '/mua-thit-ve', { waitUntil: 'load', timeout: 60000 });
      const nutMo = p.locator('[data-tlt-mo]');
      ok('Bật (mua-thit-trang): thẻ mời "Nhắn Trang" hiện, không lỗi JavaScript', await nutMo.isVisible() && !loiJs.length, loiJs.join(' | '));
      const cao = await nutMo.evaluate(e => e.getBoundingClientRect().height);
      ok('Nút "Nhắn Trang" cao ít nhất 48px', cao >= 48, `${cao}px`);
      await chupTrang('1-the-moi');
      await p.goto(goc + '/en/buy-meat', { waitUntil: 'load', timeout: 60000 });
      ok('Trang tiếng Anh: chưa có Trang (tạm, chờ Khánh chọn)', await p.locator('[data-tlt]').count() === 0);
      // Trang tiếng Hàn (Khánh 23/11/2026 "Làm tiếng Hàn"): thẻ mời tiếng Hàn.
      await p.goto(goc + '/ko/buy-meat', { waitUntil: 'load', timeout: 60000 });
      ok('Trang tiếng Hàn: thẻ mời hiện, nút ghi bằng tiếng Hàn', await p.locator('[data-tlt-mo]').isVisible()
        && motDong(await p.locator('[data-tlt-mo]').innerText()) === CHU_TRO_LY.moNut.ko);
      await p.goto(goc + '/mua-thit-ve', { waitUntil: 'load', timeout: 60000 });

      await p.locator('[data-tlt-mo]').click();
      const hop = p.locator('[data-tlt-hop]');
      ok('Bấm "Nhắn Trang": khung mở toàn màn hình điện thoại', await hop.isVisible()
        && (await hop.evaluate(e => e.getBoundingClientRect().height)) >= 840);
      const dongAo1 = motDong(await p.locator('[data-tlt-ai-dong]').innerText());
      const kieuDong = await p.locator('[data-tlt-ai]').evaluate(e => { const k = getComputedStyle(e); return `${k.textDecorationLine} ${k.color} ${k.fontSize}`; });
      ok(`Đầu khung: tên Trang và đúng một dòng gạch dưới "${chuDong}" — hiện ngay khi mở, chữ nhỏ màu xám`, dongAo1 === chuDong
        && motDong(await p.locator('#tlt-ten').innerText()).startsWith('Trang') && /^underline /.test(kieuDong) && await p.locator('[data-tlt-ai]').isVisible(), `${dongAo1} · ${kieuDong}`);
      const bong = () => p.locator('.tlt-cua-trang .tlt-bong').allInnerTexts();
      ok('Hai tin chào hiện ngay, đúng chữ, không nhắc AI', JSON.stringify((await bong()).map(motDong)) === JSON.stringify(LOI_CHAO));
      const kieuBong = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('.tlt-cua-trang .tlt-bong')); return `${s.backgroundColor} ${s.borderTopWidth} ${s.borderTopLeftRadius}`; });
      ok('Bong bóng do script dựng vẫn nhận CSS của khung: nền xám nhạt F4, viền 1px, góc 4px', kieuBong === 'rgb(244, 244, 244) 1px 4px', kieuBong);
      const caoDau = await p.locator('[data-tlt-ai-dong]').evaluate(e => Math.round(e.getBoundingClientRect().height));
      const caoNut = await p.locator('[data-tlt-ai]').evaluate(e => Math.round(e.getBoundingClientRect().height));
      ok('Dòng trợ lý ảo vừa hai dòng ở 390px, chỗ bấm cao ít nhất 24px (nút Đóng là biểu tượng vuông 48px, có nhãn ẩn)', caoDau <= 40 && caoNut >= 24
        && await p.locator('[data-tlt-dong] .an-chu').innerText() === CHU_TRO_LY.dong.vi, `dòng ${caoDau}px · chỗ bấm ${caoNut}px`);
      await chupTrang('2-loi-chao');
      // Bấm dòng gạch dưới: khung giải thích hiện (trợ lý ảo, gặp nhân viên, giá, tin được lưu và che, Quyền riêng tư).
      ok('Khung giải thích ẩn lúc mở', !(await p.locator('[data-tlt-ve]').isVisible()));
      await p.locator('[data-tlt-ai]').click();
      const ve = p.locator('[data-tlt-ve]');
      const chuVe = motDong(await ve.innerText());
      ok('Bấm dòng: khung giải thích hiện, aria-expanded = true; có "trợ lý ảo (AI)", cách gặp nhân viên, giá, tin được lưu và che',
        await ve.isVisible() && await p.locator('[data-tlt-ai]').getAttribute('aria-expanded') === 'true'
        && chuVe.includes(CHU_TRO_LY.veAi.vi) && chuVe.includes(CHU_TRO_LY.veGia.vi) && chuVe.includes(CHU_TRO_LY.veLuu.vi) && /gặp nhân viên/.test(chuVe), chuVe);
      ok('Chưa có nhân viên trực: không nói "đang theo dõi"', !chuVe.includes(CHU_TRO_LY.veTruc.vi));
      ok('Link Quyền riêng tư tới đúng mục chat', await ve.locator('a').getAttribute('href') === '/quyen-rieng-tu#tro-ly-trang');
      await chupTrang('8-giai-thich');
      await p.locator('[data-tlt-ai]').click();
      ok('Bấm lần nữa: khung giải thích đóng', !(await ve.isVisible()) && await p.locator('[data-tlt-ai]').getAttribute('aria-expanded') === 'false');
      // Ba cách ghi dòng cho Khánh chọn (ảnh 9-dong-cach-1/2/3): đổi chữ ngay trên trang rồi chụp, xong trả lại.
      for (const n of [1, 2, 3]) {
        await p.evaluate(([dau, gach]) => {
          document.querySelector('[data-tlt-ai-dau]').textContent = dau;
          document.querySelector('[data-tlt-ai]').textContent = gach;
        }, [CACH_DONG_AO[n].dau.vi, CACH_DONG_AO[n].gach.vi]);
        await chupTrang(`9-dong-cach-${n}`);
      }
      await p.evaluate(([dau, gach]) => {
        document.querySelector('[data-tlt-ai-dau]').textContent = dau;
        document.querySelector('[data-tlt-ai]').textContent = gach;
      }, [dongMong.dau.vi, dongMong.gach.vi]);

      // Lượt 1: nhịp như người — "Đã xem" và bong bóng sau 1–2 giây, tin đầu sau khoảng 10 giây.
      const batDau = Date.now();
      await p.locator('[data-tlt-o]').fill('nhà 2 người, thích mềm');
      await p.locator('[data-tlt-gui]').click();
      await p.locator('.tlt-da-xem').waitFor({ timeout: 4000 });
      const tDaXem = Date.now() - batDau;
      ok('"Đã xem" và bong bóng đang soạn hiện sau 1–2 giây; đầu khung ghi "đang soạn tin…", dòng trợ lý ảo vẫn nguyên',
        tDaXem >= 900 && tDaXem <= 3000 && await p.locator('.tlt-dang-go').isVisible() && await p.locator('[data-tlt-dang-soan]').isVisible()
        && motDong(await p.locator('[data-tlt-ai-dong]').innerText()) === chuDong, `${tDaXem} ms`);
      ok('Nút Gửi khóa khi đang chờ', await p.locator('[data-tlt-gui]').isDisabled());
      await chupTrang('3-dang-soan');
      await p.waitForFunction(n => document.querySelectorAll('.tlt-cua-trang .tlt-bong').length > n, LOI_CHAO.length + 1, { timeout: 20000 });
      const tTinDau = Date.now() - batDau;
      ok('Tin đầu sau lời chào hiện sau 9–12 giây (Edge Function giả trả ngay)', tTinDau >= 8800 && tTinDau <= 13000, `${tTinDau} ms`);
      await p.locator('.tlt-the').first().waitFor({ timeout: 10000 });
      await p.waitForTimeout(500);
      const ky = await p.evaluate(() => {
        const g = document.querySelector('[data-mtv-form]');
        return JSON.parse(g?.dataset.menu ?? '[]');
      });
      const td = theDon([{ khoa: 'ribeye-cap_200', so_goi: 2, ten: 'đầu thăn ngoại còn nắp' }, { khoa: 'than-ngoai_200', so_goi: 1, ten: 'thăn ngoại' }], ky, 'vi');
      const tongTrang = motDong(await p.locator('.tlt-tong [data-tien]').innerText());
      ok(`Thẻ đơn: trang tự tính tổng ${dinhDangTien(td.tamTinh)} từ giá gói của menu (không lấy số từ Trang)`, tongTrang === dinhDangTien(td.tamTinh), tongTrang);
      ok('Thẻ phần thịt: tên, tên trên nhãn, giá gói trong data-tien', /Đầu thăn ngoại còn nắp/.test(await p.locator('.tlt-the').first().innerText())
        && await p.locator('.tlt-the').first().locator('[data-tien]').count() >= 1);
      const kieuThe = await p.evaluate(() => {
        const t = document.querySelector('.tlt-the'), k = document.querySelector('.tlt-cua-khach .tlt-bong');
        return `${getComputedStyle(t).borderTopWidth} ${getComputedStyle(t.querySelector('ul')).listStyleType} ${getComputedStyle(k).backgroundColor}`;
      });
      ok('Thẻ có viền 1px, danh sách không chấm đầu dòng; bong bóng khách nền đen', kieuThe === '1px none rgb(0, 0, 0)', kieuThe);
      await p.evaluate(() => { const t = document.querySelector('[data-tlt-tin]'); t.scrollTop = t.scrollHeight; });
      await chupTrang('4-the-don');
      const tranNgangKhung = await p.evaluate(() => document.querySelector('[data-tlt-tin]').scrollWidth - document.querySelector('[data-tlt-tin]').clientWidth);
      ok('Khung không tràn ngang ở 390px', tranNgangKhung <= 0, `${tranNgangKhung}px`);

      // Cho vào đơn: ô chọn của form đặt hàng đổi như khách tự chọn, khung đóng, đơn của bạn có đúng dòng.
      await p.locator('.tlt-the button', { hasText: CHU_TRO_LY.choVaoDon.vi }).click();
      ok('"Cho vào đơn": khung đóng', !(await hop.isVisible()));
      const giaTri = await p.evaluate(() => [...document.querySelectorAll('select.mtv-so')].filter(s => s.value !== '0').map(s => `${s.name}=${s.value}`).sort().join('&'));
      ok('Ô chọn của form đặt hàng: ribeye-cap_200 = 2, than-ngoai_200 = 1', giaTri === 'ribeye-cap_200=2&than-ngoai_200=1', giaTri);
      const tamTinh = motDong(await p.locator('[data-mtv-tam-tinh] [data-tien]').innerText());
      ok('"Đơn của bạn" tính lại đúng tổng của thẻ', tamTinh === dinhDangTien(td.tamTinh), tamTinh);
      await chupTrang('5-da-cho-vao-don');

      // Từ đây có nhân viên mở màn theo dõi (giả): mở lại khung thì khung hỏi lại 8 giây một lần (chưa ai trực: 30 giây).
      mayGia.troLyNhanVien({ viec: 'truc', bat: true });
      // Mất mạng: Edge Function giả trả 502 lần đầu → câu "chưa được trả lời" + Gửi lại cùng mã tin → trả lời.
      await p.locator('[data-tlt-mo]').click();
      // Mở lại khung lúc có người trực: dòng dưới tên Trang đổi sang cách đã chọn khi có người trực (Khánh chọn cách 3).
      const coTruc = dongAo(CACH_DONG_AO_CHON, true);
      const chuCoTruc = coTruc.dau.vi + coTruc.gach.vi;
      const doiDong = await p.waitForFunction(chu => (document.querySelector('[data-tlt-ai-dong]')?.textContent ?? '').replace(/\s+/g, ' ').trim() === chu,
        chuCoTruc, { timeout: 5000 }).then(() => true, () => false);
      ok(`Có nhân viên trực: dòng dưới tên Trang thành "${chuCoTruc}" ngay khi mở lại khung (chưa ai trực thì là "${chuDong}")`,
        doiDong && (CACH_DONG_AO_CHON !== 3 || (chuCoTruc === CACH_DONG_AO[3].gach.vi && chuDong === CACH_DONG_AO[1].gach.vi)),
        motDong(await p.locator('[data-tlt-ai-dong]').innerText()));
      await chupTrang('12-co-nhan-vien-truc');
      await p.locator('[data-tlt-o]').fill('lỗi mạng thử');
      await p.locator('[data-tlt-gui]').click();
      const heThong = p.locator('.tlt-he-thong', { hasText: CHU_TRO_LY.chuaTraLoi.vi });
      await heThong.waitFor({ timeout: 15000 });
      ok('502: câu hệ thống nói tin CHƯA được trả lời, có nút Gửi lại; không bong bóng nào của Trang được bịa',
        await heThong.locator('button', { hasText: CHU_TRO_LY.guiLai.vi }).isVisible());
      await chupTrang('6-chua-tra-loi');
      await heThong.locator('button').click();
      await p.waitForFunction(() => /nướng cho mấy người/.test(document.querySelector('[data-tlt-tin]')?.innerText ?? ''), null, { timeout: 15000 });
      const goiTroLy = mayGia.nhatKy().filter(d => d.ham === 'tro-ly-trang' && d.thamSo.than?.hanh_dong !== 'xem');
      const goiXem = mayGia.nhatKy().filter(d => d.ham === 'tro-ly-trang' && d.thamSo.than?.hanh_dong === 'xem');
      ok('Lệnh xem (khung hỏi lại): text/plain, không cookie, đúng bốn ô, cùng mã cuộc chat', goiXem.length >= 1
        && goiXem.every(d => /^text\/plain/.test(d.thamSo.loaiNoiDung) && !d.thamSo.coCookie
          && JSON.stringify(Object.keys(d.thamSo.than ?? {}).sort()) === JSON.stringify(['chi_nhanh', 'cuoc', 'hanh_dong', 'sau'])
          && d.thamSo.than.cuoc === goiTroLy[0]?.thamSo.than?.cuoc), JSON.stringify(goiXem.slice(0, 2).map(d => d.thamSo.than)));
      const hai = goiTroLy.slice(-2);
      // Sáu ô từ 23/11/2026: thêm nn — trang khách đang mở (trang tiếng Việt gửi "vi"), để Trang biết trả lời tiếng Hàn hay tiếng Việt.
      ok('Gửi lại dùng đúng mã tin cũ; lời gọi text/plain, không cookie, đủ sáu ô (nn = "vi" ở trang tiếng Việt)', hai.length === 2 && hai[0].thamSo.than?.ma_tin === hai[1].thamSo.than?.ma_tin
        && goiTroLy.every(d => /^text\/plain/.test(d.thamSo.loaiNoiDung) && !d.thamSo.coCookie && d.thamSo.than?.nn === 'vi'
          && JSON.stringify(Object.keys(d.thamSo.than ?? {}).sort()) === JSON.stringify(['chi_nhanh', 'cuoc', 'ma_tin', 'nn', 'tin', 'tra_truoc'])), JSON.stringify(hai.map(d => d.thamSo.than)));
      ok('Mọi lượt cùng một mã cuộc chat', new Set(goiTroLy.map(d => d.thamSo.than?.cuoc)).size === 1);

      // Hỏi người hay máy: nói thật + thẻ liên hệ quán (kênh đã công bố).
      await p.locator('[data-tlt-o]').fill('em là người hay máy');
      await p.locator('[data-tlt-gui]').click();
      await p.locator('.tlt-the', { hasText: CHU_TRO_LY.lienHe.vi }).waitFor({ timeout: 15000 });
      const theLh = p.locator('.tlt-the', { hasText: CHU_TRO_LY.lienHe.vi }).last();
      ok('Hỏi người hay máy: Trang nói "trợ lý ảo"; thẻ liên hệ có "Gọi quán" (hotline đã công bố), không giả nhân viên vào khung',
        /em là trợ lý ảo của Beeftown/.test(await p.locator('[data-tlt-tin]').innerText()) && await theLh.locator('a[href^="tel:"]').count() === 1);
      ok('Không tin nào của Trang có chữ AI, bot, tự động', (await p.locator('.tlt-cua-trang .tlt-bong').allInnerTexts()).every(t => !/(^|[^\p{L}])AI(?![\p{L}])|\bbot\b|tự động/u.test(t)));
      await chupTrang('7-nguoi-hay-may');

      // Nhân viên nhận chat (0126 mục 4b, nhân viên giả): khách thấy "… đã vào chat", tin nhân viên có nhãn riêng.
      mayGia.troLyNhanVien({ viec: 'truc', bat: true });
      mayGia.troLyNhanVien({ viec: 'nhan', ten: 'Minh' });
      const vao = p.locator('.tlt-he-thong', { hasText: CHU_TRO_LY.nhanVienVao.vi('Minh') });
      await vao.waitFor({ timeout: 15000 });
      ok('Nhân viên nhận: khung hỏi lại thấy trong ≤ 10 giây, câu "Minh, nhân viên Beeftown, đã vào chat."', await vao.count() === 1);
      ok('Đầu khung đổi sang nhân viên: chữ "M", tên Minh, dòng "Nhân viên Beeftown"; dòng trợ lý ảo ẩn (nhân viên không gõ dưới tên Trang)',
        motDong(await p.locator('[data-tlt-hinh]').innerText()) === 'M' && motDong(await p.locator('[data-tlt-ten]').innerText()) === 'Minh'
        && motDong(await p.locator('[data-tlt-nv-dong]').innerText()) === CHU_TRO_LY.nhanVien.vi && !(await p.locator('[data-tlt-ai-dong]').isVisible()));
      mayGia.troLyNhanVien({ viec: 'go', bat: true });
      await p.locator('.tlt-cua-nv.tlt-dang-go').waitFor({ timeout: 8000 });
      ok('Nhân viên đang gõ: bong bóng đang soạn của nhân viên, đầu khung ghi "đang soạn tin…"', await p.locator('[data-tlt-dang-soan]').isVisible());
      await chupTrang('10-nhan-vien-dang-go');
      mayGia.troLyNhanVien({ viec: 'gui', noi_dung: 'Dạ em Minh bên quán ạ. Anh/chị cần em hỗ trợ gì thêm không ạ?' });
      const tinNv = p.locator('.tlt-cua-nv .tlt-bong', { hasText: 'Dạ em Minh bên quán ạ' });
      await tinNv.waitFor({ timeout: 8000 });
      ok('Tin nhân viên hiện là tin của nhân viên: nhãn "Minh · Nhân viên Beeftown", viền đậm; hết bong bóng đang soạn',
        motDong(await p.locator('.tlt-nguoi-gui').last().innerText()) === `Minh · ${CHU_TRO_LY.nhanVien.vi}` && await p.locator('.tlt-dang-go').count() === 0
        && await tinNv.evaluate(e => getComputedStyle(e).borderTopColor) === 'rgb(0, 0, 0)');
      const truocGui = mayGia.nhatKy().filter(d => d.ham === 'tro-ly-trang' && d.thamSo.than?.hanh_dong !== 'xem').length;
      const tGui = Date.now();
      await p.locator('[data-tlt-o]').fill('giao quận 7 được không em');
      await p.locator('[data-tlt-gui]').click();
      await p.locator('.tlt-da-xem', { hasText: CHU_TRO_LY.daGui.vi }).waitFor({ timeout: 4000 });
      ok('Khách nhắn lúc nhân viên đang nhận: "Đã gửi" ngay (dưới 1,5 giây), không nhịp và bong bóng của Trang',
        Date.now() - tGui < 1500 && await p.locator('.tlt-cua-trang.tlt-dang-go').count() === 0
        && mayGia.nhatKy().filter(d => d.ham === 'tro-ly-trang' && d.thamSo.than?.hanh_dong !== 'xem').length === truocGui + 1, `${Date.now() - tGui} ms`);
      await p.waitForTimeout(700);
      ok('"Đã gửi" nằm trong khung nhìn (khung cuộn tới tin vừa gửi)', await p.locator('.tlt-da-xem').evaluate(e => { const r = e.getBoundingClientRect(), k = document.querySelector('[data-tlt-tin]').getBoundingClientRect(); return r.bottom <= k.bottom + 1 && r.top >= k.top; }));
      await chupTrang('11-nhan-vien-tra-loi');
      // Đóng khung: thôi hỏi lại; mở lại: hỏi ngay.
      await p.locator('[data-tlt-dong]').click();
      const xemKhiDong = mayGia.nhatKy().filter(d => d.thamSo?.than?.hanh_dong === 'xem').length;
      await p.waitForTimeout(6000);
      ok('Đóng khung: không hỏi lại nữa (6 giây, nhân viên đang nhận)', mayGia.nhatKy().filter(d => d.thamSo?.than?.hanh_dong === 'xem').length === xemKhiDong);
      await p.locator('[data-tlt-mo]').click();
      mayGia.troLyNhanVien({ viec: 'tra' });
      await p.locator('.tlt-he-thong', { hasText: CHU_TRO_LY.trangQuayLai.vi }).waitFor({ timeout: 8000 });
      ok('Trả lại cho Trang: "Trang tiếp tục hỗ trợ anh/chị.", đầu khung về Trang với dòng trợ lý ảo',
        motDong(await p.locator('[data-tlt-ten]').innerText()) === 'Trang' && await p.locator('[data-tlt-ai-dong]').isVisible()
        && !(await p.locator('[data-tlt-nv-dong]').isVisible()));
      await p.locator('[data-tlt-ai]').click();
      ok('Có nhân viên trực: khung giải thích nói "đang theo dõi", không còn câu chỉ cách liên hệ', await p.locator('[data-tlt-ve-truc]').isVisible()
        && !(await p.locator('[data-tlt-ve-gap]').isVisible()));
      await p.locator('[data-tlt-ai]').click();
      mayGia.troLyNhanVien({ viec: 'truc', bat: false });
      // Đóng bằng nút: trang phía sau cuộn lại được.
      await p.locator('[data-tlt-dong]').click();
      // Sự kiện close của <dialog> chạy ở tác vụ sau: chờ tới 2 giây.
      const hetKhoa = await p.waitForFunction(() => !document.documentElement.classList.contains('tlt-khoa'), null, { timeout: 2000 }).then(() => true, () => false);
      ok('Đóng khung: hết khóa cuộn trang', hetKhoa);
      ok('Cả nhóm không lỗi JavaScript', loiJs.length === 0, loiJs.join(' | '));
    } finally {
      await c.close();
      mayGia.datKichBan('day-du');
    }
  });

  // =========================================================================
  if (CHUP) {
    await nhom('6 · CHỤP ẢNH TOÀN TRANG (--chup) → kiem-tra/anh-chup/', async () => {
      const CO = [360, 390, 768, 1024, 1440];
      let so = 0;
      const chupToanTrang = async (p, tep) => {
        // Cuộn hết trang cho ảnh lazy tải, rồi về đầu trang mới chụp.
        await p.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
          scrollTo(0, 0);
        });
        await p.waitForLoadState('networkidle').catch(() => {});
        await p.screenshot({ path: tep, fullPage: true });
        so++;
      };
      for (const kichBan of ['rong', 'day-du']) {
        const thuMuc = join(ANH_CHUP, kichBan);
        rmSync(thuMuc, { recursive: true, force: true });
        mkdirSync(thuMuc, { recursive: true });
        for (const rong of CO) {
          const c = await trinhDuyet.newContext({ viewport: { width: rong, height: rong < 600 ? 800 : 900 } });
          const p = await c.newPage();
          for (const duong of TRANG) {
            mayGia.datKichBan(kichBan);
            await p.goto(goc + duong, { waitUntil: 'load', timeout: 60000 });
            await chupToanTrang(p, join(thuMuc, `${tenTep(duong)}-${rong}.png`));
          }
          await c.close();
          // Hai trạng thái chỉ có sau khi gửi form: đã nhận, và máy chủ lỗi. dienForm / gui
          // làm việc trên trang chính, nên đổi cỡ trang chính rồi chụp trên đó.
          if (kichBan === 'day-du') {
            await page.setViewportSize({ width: rong, height: rong < 600 ? 800 : 900 });
            for (const [kb, duoi] of [['day-du', 'da-nhan'], ['dat-ban-500', 'loi-may-chu']]) {
              for (const nn of NGON_NGU) {
                const hoiBan = duongDanTuongUng('/dat-ban', nn);
                mayGia.datKichBan(kb);
                await page.goto(goc + hoiBan, { waitUntil: 'load' });
                await dienForm();
                await gui();
                await chupToanTrang(page, join(thuMuc, `${tenTep(hoiBan)}-${duoi}-${rong}.png`));
              }
            }
          }
        }
      }
      ok(`Đã chụp ${so} ảnh vào ${ANH_CHUP}`, so > 0);
    });
  }

  await ctx.close();
} catch (e) {
  if (e.message !== 'dừng') ok('Chạy được đến cuối', false, e.stack || e.message);
} finally {
  await trinhDuyet?.close().catch(() => {});
  tatAstro(mayWeb);
  await mayGia?.dong();
}
// --chi xin một số mà không nhóm nào mang số đó được chạy (gõ nhầm, nhóm 6 thiếu --chup): đỏ, không bao giờ đạt suông.
CHON_NHOM.baoNhomThieu(ok, 'nhóm chỉ chạy kèm cờ khác (nhóm 6: --chup)');

console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA TRẠNG THÁI ĐẦY ĐỦ ĐỀU ĐẠT${CHON_NHOM.ghiChu}\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA${CHON_NHOM.ghiChu}\x1b[0m`);
  for (const l of loi) console.log(`  \x1b[31m· ${l}\x1b[0m`);
  if (existsSync(ANH_LOI)) console.log(`Ảnh chụp lúc hỏng: ${ANH_LOI}`);
  if (mayWeb?.nhatKy?.length) console.log(`\nNhật ký astro dev (cuối):\n${mayWeb.nhatKy.join('').slice(-2000)}`);
}
process.exit(hong === 0 ? 0 : 1);
