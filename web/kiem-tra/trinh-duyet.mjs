/**
 * KIỂM THỬ BẰNG TRÌNH DUYỆT THẬT — khách mở trang, bấm form
 * ==========================================================
 *
 *     npm run thu-trinh-duyet                    ← build lại, bật wrangler dev trên bản build, chạy thử
 *     npm run thu-trinh-duyet -- --khong-build   ← dùng dist/ có sẵn (CI: bước trước vừa build)
 *     npm run thu-trinh-duyet -- --url https://… ← chạy trên một trang đang chạy thật (chỉ phần xem trang)
 *     npm run thu-trinh-duyet -- --khong-build --chi 5,7   ← chỉ nhóm 5 và 7 (sửa nhanh một chỗ — CI chạy hết;
 *                                                            gõ sai số nhóm thì đỏ: kiem-tra/chon-nhom.mjs)
 *
 * Các phép thử khác đọc mã hoặc HTML. File này mở trang trong Chromium thật, ở ba cỡ
 * màn hình, giống khách đứng trước bạt cầm điện thoại — và chạy trên BẢN BUILD qua
 * wrangler dev (cùng workerd với Cloudflare), không phải astro dev.
 *
 * Chạy KHÔNG có database (CI không có web/.env). Đó chính là trạng thái cần giữ đúng
 * nhất: README gốc — "form chưa sẵn sàng thì ẩn hẳn", "không bao giờ báo đã nhận khi
 * chưa ghi được". Bất biến:
 *
 *   1. Mọi trang công khai (sitemap + danh sách cố định) ở 320, 360, 390, 430, 768, 800, 1024,
 *      1366, 1440 px: trả 200, không lỗi JavaScript, không tải hỏng tài nguyên của chính
 *      trang, không tràn ngang, đúng thuộc tính lang; chân trang có pháp nhân (tên công
 *      ty · mã số thuế, địa chỉ, điện thoại) bằng chữ, ngay dưới dòng ©. Thêm (brief 06/10/2026):
 *      đúng một <h1>; mọi <img> có width, height, alt (alt="" cho ảnh trang trí); ảnh
 *      minh họa nằm dưới màn hình đầu thì loading="lazy"; nút, link điều hướng, summary
 *      cao ≥ 48px; chữ trên nền màu đặc đủ tương phản (≥ 4,5:1, chữ lớn ≥ 3:1).
 *      Thành phần và khung trang (đợt redesign, PR 2 — phép đo ở do-giao-dien.mjs): đầu
 *      trang 64 / 80px, bộ chọn ngôn ngữ đánh dấu thứ tiếng đang xem bằng chữ và nét,
 *      màu nền trong bảng 22/10/2026, nút và thẻ đúng quy tắc, hàng câu hỏi ≥ 56px, biểu tượng 24px,
 *      chữ chạy 16/24px và h1 32/38 → 48/56px, chân trang không hoa văn và chữ ≥ 14px.
 *      Địa điểm (Khánh quyết 07/10 và 09/10/2026: tầng 3, 63 Hồ Tùng Mậu, lối vào
 *      riêng ngay cạnh GS25; có thang máy: Khánh xác nhận 11/10/2026): chân trang có "63 Hồ Tùng
 *      Mậu"; trang chủ, Đến Beeftown, Hỏi bàn in đúng từng chữ câu chỉ đường đang
 *      dùng TRONG nội dung chính (chữ của câu là Claude đề xuất, chờ Khánh duyệt);
 *      JSON-LD ghi streetAddress "Tầng 3, 63 Hồ Tùng Mậu", không có tên phường; ngoài
 *      dòng pháp nhân, cả trang không còn địa chỉ nào khác và không ghi tên phường,
 *      quận nào (trừ "Quận 1 cũ", Khánh quyết 23/11/2026: chân trang ghi khu vực đó);
 *      không còn chữ về cầu thang bộ. Mẫu tìm chữ sai: mau-dia-diem.mjs.
 *      SEO 23/11/2026: mọi trang preload phông Montserrat tự phát (không stylesheet Google
 *      cho Montserrat), JSON-LD không khai giờ khi giờ chưa công bố, trang chủ có dòng hiệu
 *      đúng tiếng của trang.
 *   2. Trang đặt bàn / tuyển dụng / Mua thịt về chưa có database: KHÔNG có form nào, không có chữ
 *      "thành công" / "success" / "성공". Trang hỏi bàn: meta description, og:description
 *      và đoạn mở đầu không hứa "gửi yêu cầu, nhà hàng gọi lại" khi form đóng.
 *   3. Gửi thẳng form đặt bàn (không qua giao diện): trang quay về báo lỗi, không bao
 *      giờ báo thành công. Gửi từ trang web khác (Origin lạ) bị từ chối 403.
 *   4. /noi-bo chuyển sang trang đăng nhập (cả đường dẫn lạ dưới /noi-bo — đã đăng nhập thì
 *      chúng hiện trang 404 NỘI BỘ, kiểm ở crm/test/test-noi-bo-khong-co.mjs vì cần database);
 *      hook iPOS không lộ lỗi nội bộ; khóa sai dạng vẫn là 404 chữ trơn của src/worker.ts.
 *      Mọi trả lời dưới /noi-bo cấm nhúng vào khung (frame-ancestors 'none', X-Frame-Options:
 *      DENY) và không vào bộ đệm dùng chung (private), không bị ép no-store; đăng xuất mang
 *      Clear-Site-Data: "cache"; trang công khai thì không bị gắn gì.
 *      Bấm Đăng xuất rồi bấm Quay lại: trang cũ không hiện lại từ bộ nhớ quay lại của trình duyệt
 *      (bfcache) mà được xin lại từ máy chủ, và đã bị giấu từ lúc rời trang — thử bằng Chromium BẢN
 *      ĐẦY ĐỦ có bfcache bật, kèm một phép đối chứng là trình duyệt đó có bfcache thật; Quay lại bình
 *      thường thì vẫn giữ nguyên trang. Trả lời đăng xuất đổi cookie dấu phiên bt_dau_phien.
 *      Đăng nhập không thành (bản build không database: lần nào cũng không thành): lượt POST trả 303 về GET
 *      /noi-bo/dang-nhap, câu lỗi đi qua cookie bt_loi_dang_nhap (HttpOnly, Path=/noi-bo/dang-nhap, ≤ 60 giây, chỉ mã và
 *      email — không mật khẩu), trang mang cookie đó là no-store; F5, Quay lại / Tiến + F5 và tải lại từng mục lịch sử
 *      không gửi lượt POST nào, không lượt nào mang lại mật khẩu; bấm link rồi Quay lại thì ô mật khẩu đã trống.
 *   5. Menu gọn của màn hẹp (<details class="menu-gon">) mở / đóng được KHI TẮT
 *      JavaScript; có JavaScript thì Esc đóng nó và trả tiêu điểm về nút. Mở ra thì nút
 *      đổi thành nút đóng có nhãn chữ, có link "Hỏi bàn" là nút chính, có bộ chọn ngôn
 *      ngữ; Enter mở / đóng, Tab đi qua từng mục với vòng focus nhìn thấy, Tab ra khỏi
 *      mục cuối thì menu đóng. Có JavaScript: đang mở thì có lớp phủ tối và trang phía
 *      sau không cuộn; đóng bằng Esc, bằng nút đóng hay bằng cách bấm vào lớp phủ thì
 *      trang cuộn lại được. TẮT JavaScript: không lớp phủ, không khoá cuộn — bấm link
 *      neo trong bảng xong trang vẫn cuộn được.
 *   6. Câu hỏi thường gặp: Enter và phím cách mở / đóng từng câu, vòng focus nhìn thấy.
 *   7. Màn cảm ứng ((hover: none)): con trỏ ở trên nút, link, hàng câu hỏi mà kiểu không
 *      đổi — chạm xong không còn màu di chuột; máy có chuột vẫn đổi kiểu khi di chuột;
 *      cả hai loại máy đổi màu nền khi đang nhấn nút (:active).
 *   8. Thanh cuộn kiểu cổ điển (chiếm 15px): mở danh mục không xô lệch đầu trang và
 *      khung nội dung, không sinh cuộn ngang; ở 1440px khung nội dung vẫn cân giữa.
 *   9. Đường dẫn lạ (/…, /en/…, /ko/…) ở 360 và 1366 px: mã 404, trang 404 của Beeftown
 *      đúng thứ tiếng theo tiền tố, có link về /, /en, /ko, chân trang công khai, không
 *      tràn ngang, noindex và không canonical / hreflang / JSON-LD, cùng các phép đo
 *      thành phần của nhóm 1 (do-giao-dien.mjs). Chạy cả với --url.
 *  10. Ảnh (PR 3 của đợt redesign đưa ảnh lên trang chủ và trang Thực đơn): ảnh về chậm
 *      thì khung vẫn giữ sẵn đúng chỗ, đúng cỡ — ảnh về trang không xô lệch; mọi ảnh
 *      tải về được và dùng đúng khung của cỡ màn hình (điện thoại / màn rộng). Nhãn
 *      "Ảnh minh họa", thẻ đọc nhãn khay, bố cục màn đầu và các khối của trang chủ,
 *      trang Thực đơn: bốn phép đo anh, nhanKhay, trangChu, thucDon của do-giao-dien.mjs,
 *      chạy ở mục 1 trên mọi trang × chín cỡ màn hình.
 *  11. Trang Thực đơn chia ba phần thành tab: lúc tải trang chỉ phần đầu hiện, nên mục 1
 *      không bao giờ thấy ảnh và thành phần của hai phần còn lại. Bấm từng tab như khách
 *      (390 và 1440 px, ba thứ tiếng) rồi đo lại: phần vừa mở có đúng các ảnh của nó, ảnh
 *      tải về được, đủ nhãn "Ảnh minh họa", không gì đè lên ảnh, đúng khung — và giấu nhãn
 *      của ảnh trong phần vừa mở đi thì phép đo phải đỏ (phép đo thật sự nhìn thấy ảnh đó).
 *  12. Meta Pixel (src/lib/meta-pixel.ts). Mọi nhóm chạy với Meta bị chặn (chan-meta.mjs: CI không gửi lượt nào lên
 *      Pixel thật, và trang phải chạy đủ khi khách chặn quảng cáo). Mọi trang công khai có đúng một khối mã gốc, đúng
 *      từng chữ, cuối <head>; <body> mang tên trang; lời gọi fbq đúng init + PageView (trang Thực đơn thêm
 *      ViewContent), mỗi sự kiện chỉ kèm content_name và language. Bấm link tel:, Zalo, Messenger → Contact (cả bấm
 *      chuột giữa); link khác, chuột phải thì không. fbevents.js tải được (bản giả) thì nhận đủ lời gọi đã xếp hàng. Tắt JavaScript: ảnh noscript gọi đúng
 *      địa chỉ đo, trang vẫn đủ. Trang 404 không có pixel. Không lượt nào tới được Meta. Chạy cả với --url.
 *  13. Nút ngôn ngữ trên thanh đầu trang (768 và 1440 px, có và TẮT JavaScript; Khánh quyết 23/11/2026): một nút quả địa
 *      cầu ghi mã VI / EN / KO, lúc đầu đóng; bấm thì thả xuống Tiếng Việt · English · 한국어 đúng thứ tự, thứ tiếng
 *      đang xem không phải link, hai thứ tiếng kia dẫn tới đúng trang tương ứng; danh sách nằm trọn trong màn hình, ngay
 *      dưới thanh, đạt các phép đo của do-giao-dien.mjs khi đang mở; mở danh sách thì danh mục đóng và ngược lại (cùng
 *      name="dau-trang"). Có JavaScript: Esc đóng và trả tiêu điểm, bấm ra ngoài thì đóng, Tab ra khỏi link cuối thì
 *      đóng. Bấm một thứ tiếng khác thì tới trang đó, nút ghi mã mới.
 *
 * Hỏng thì ảnh chụp màn hình nằm ở kiem-tra/anh-loi/ (CI tải lên thành artifact).
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as cho } from 'node:timers/promises';
import { chromium } from 'playwright';
import { MAU_META, moChromium, ghiPixel, docHangDoi, suKienTrong } from './chan-meta.mjs';
import { TEN_DIA_CHI_KHAC, SO_NHA_KHAC, PHUONG_QUAN, CAU_THANG, boPhapNhan } from './mau-dia-diem.mjs';
import { choDungYen, doGiaoDien, PHEP_DO } from './do-giao-dien.mjs';
import { WEB, batMayChuBanBuild, tatMayChu } from './may-chu-ban-build.mjs';
import { taoChonNhom } from './chon-nhom.mjs';

// Meta Pixel (nhóm 12): ID và mã gốc đọc từ chính thư viện của trang — crm/test/test-cong-khai-meta-pixel.mjs so mã gốc
// đó với bản Meta đưa, đúng từng chữ. Tên trang thì chép quy tắc tay (bản tiếng Việt của đường dẫn, bỏ "/").
const { MA_PIXEL, khoiMaPixel } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'meta-pixel.ts')).href);
const { duongDanTuongUng, chu } = await import(pathToFileURL(join(WEB, 'src', 'lib', 'chu.ts')).href);

const ANH_LOI = join(WEB, 'kiem-tra', 'anh-loi');
const CONG = 4330;

// ---------------------------------------------------------------------------
// Bộ đếm — cùng kiểu các file test của crm
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
/**
 * Chờ trang đứng yên trước khi tự đọc màu sau một cú di chuột, chạm, bấm (do-giao-dien.mjs: choDungYen — chờ có điều
 * kiện, không chờ cứng). Quá hạn mà còn chuyển màu chạy thì báo đỏ ngay, kể tên thuộc tính còn chạy: đọc màu nửa chừng
 * có thể vẫn "khác màu trước" và lọt qua phép kiểm. Đứng yên thì không thêm dòng nào.
 */
const LAY_CON_CHAY = `(async () => (await (${choDungYen})()).map(a => typeof a === 'string' ? a : a.transitionProperty ?? a.animationName ?? 'hoạt cảnh'))()`;
async function dungYen(page, nhan) {
  const conChay = await page.evaluate(LAY_CON_CHAY);
  if (conChay.length) ok(`${nhan}: trang đứng yên trong hạn chờ trước khi đọc màu`, false, `còn chạy: ${conChay.slice(0, 5).join(', ')}`);
}
// --chi 5,7: chỉ chạy các nhóm này (chon-nhom.mjs) — sửa nhanh một chỗ; CI chạy hết.
const CHON_NHOM = taoChonNhom(process.argv);
async function nhom(ten, fn) {
  if (!CHON_NHOM.chay(ten)) return;
  console.log(`\n\x1b[1m${ten}\x1b[0m`);
  try { await fn(); } catch (e) { ok(`${ten} chạy được đến cuối`, false, e.stack || e.message); }
}

// ---------------------------------------------------------------------------
// Máy chủ: bản build chạy trong wrangler dev (may-chu-ban-build.mjs, dùng chung với quet-chuoi-cam.mjs)
// ---------------------------------------------------------------------------
const batMayChu = () => batMayChuBanBuild({ cong: CONG, khongBuild: process.argv.includes('--khong-build') });

// Danh sách cố định có đủ mọi trang của CAP_DUONG_DAN, gồm tám trang chính sách (lib/chinh-sach.ts): sitemap hỏng
// thì vẫn thử đủ (crm/test/test-cong-khai-quet-gia.mjs nhóm 5 giữ).
async function danhSachTrang(goc) {
  const bo = new Set(['/', '/thuc-don', '/mua-thit-ve', '/phan-thit-bo', '/den-beeftown', '/dat-ban', '/tuyen-dung', '/quyen-rieng-tu', '/xoa-du-lieu',
    '/dieu-khoan', '/chinh-sach-gia', '/thanh-toan', '/giao-hang', '/doi-tra-hoan-tien', '/khieu-nai', '/dieu-kien-ban-hang', '/ho-tro',
    '/en', '/en/menu', '/en/buy-meat', '/en/beef-cuts', '/en/visit', '/en/book', '/en/jobs', '/en/privacy', '/en/data-deletion',
    '/en/terms', '/en/pricing', '/en/payment', '/en/delivery', '/en/returns', '/en/complaints', '/en/conditions', '/en/support',
    '/ko', '/ko/menu', '/ko/buy-meat', '/ko/beef-cuts', '/ko/visit', '/ko/book', '/ko/jobs', '/ko/privacy', '/ko/data-deletion',
    '/ko/terms', '/ko/pricing', '/ko/payment', '/ko/delivery', '/ko/returns', '/ko/complaints', '/ko/conditions', '/ko/support']);
  try {
    const xml = await (await fetch(new URL('/sitemap.xml', goc))).text();
    for (const m of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) bo.add(new URL(m[1]).pathname);
  } catch { console.log('  (không đọc được sitemap.xml — dùng danh sách cố định)'); }
  return [...bo].sort();
}

const ngonNguCua = duong => (duong.startsWith('/en') ? 'en' : duong.startsWith('/ko') ? 'ko' : 'vi');
/** Chữ của một khối viết liền một dòng: innerText xuống dòng ở mỗi khối, câu dài thì ở đâu cũng một dấu cách. */
const motDong = chu => chu.replace(/\s+/g, ' ').trim();

// Chân trang: ngay dưới dòng © là pháp nhân, bằng CHỮ trong HTML (không phải ảnh), tên công ty,
// địa chỉ và số điện thoại đúng từng ký tự ở cả ba thứ tiếng — khớp Thông tin doanh nghiệp trên Meta
// (sửa 26/10/2026) cho hồ sơ xác minh doanh nghiệp. Chép tay ở đây, KHÔNG đọc PHAP_NHAN trong
// lib/chu.ts — sửa nhầm một ký tự ở đó thì phép thử này đỏ.
const DONG_BAN_QUYEN = /^© \d{4} Beeftown · Beef Specialty Restaurant$/;
const NHAN_MA_SO_THUE = { vi: 'Mã số thuế', en: 'Tax code', ko: '세금 코드' };
const NHAN_DIEN_THOAI = { vi: 'Điện thoại', en: 'Phone', ko: '전화' };
const dongPhapNhan = nn => [
  `CÔNG TY TNHH SLK GROUP · ${NHAN_MA_SO_THUE[nn]}: 0319712805`,
  '53 Võ Trường Toản, Phường An Khánh, Thành phố Hồ Chí Minh',
  `${NHAN_DIEN_THOAI[nn]}: 0961 245 124`,
];
// Dòng thứ tư dưới dòng ©: email (Khánh giao 16/11/2026; địa chỉ email còn chờ trả lời — chỉ so nhãn).
const NHAN_EMAIL = { vi: 'Email', en: 'Email', ko: '이메일' };
// Nhóm CHÍNH SÁCH của chân trang: tám trang chính sách rồi Quyền riêng tư, đúng thứ tự, đúng thứ tiếng. Chép tay.
const LINK_CHINH_SACH = {
  vi: ['/dieu-khoan', '/chinh-sach-gia', '/thanh-toan', '/giao-hang', '/doi-tra-hoan-tien', '/khieu-nai', '/dieu-kien-ban-hang', '/ho-tro', '/quyen-rieng-tu'],
  en: ['/en/terms', '/en/pricing', '/en/payment', '/en/delivery', '/en/returns', '/en/complaints', '/en/conditions', '/en/support', '/en/privacy'],
  ko: ['/ko/terms', '/ko/pricing', '/ko/payment', '/ko/delivery', '/ko/returns', '/ko/complaints', '/ko/conditions', '/ko/support', '/ko/privacy'],
};
// Cột Thông tin của chân trang: Các phần thịt bò đứng đầu (SEO 23/11/2026), rồi Tuyển dụng, Xóa dữ liệu. Chép tay.
const LINK_THONG_TIN = {
  vi: ['/phan-thit-bo', '/tuyen-dung', '/xoa-du-lieu'],
  en: ['/en/beef-cuts', '/en/jobs', '/en/data-deletion'],
  ko: ['/ko/beef-cuts', '/ko/jobs', '/ko/data-deletion'],
};
// Link của dải "Nhìn tận mắt, chọn tận tay" (QuayChonBo) — chỉ ở trang chủ.
const TRANG_CHU_BA = { '/': 'vi', '/en': 'en', '/ko': 'ko' };
const LINK_QUAY_CHON_BO = { vi: '/phan-thit-bo', en: '/en/beef-cuts', ko: '/ko/beef-cuts' };
/** Ba dòng ngay dưới dòng ©, đúng thứ tự. */
const coPhapNhan = (dongChan, iBanQuyen, phapNhan) =>
  iBanQuyen > -1 && phapNhan.every((dong, i) => dongChan[iBanQuyen + 1 + i] === dong);
// Trang Mua thịt về: chưa nối database là trạng thái "chưa mở" — không form chọn gói, không giá (bản thiết kế PR 2,
// mục 2.5). Trang có form khi mở kiểm ở thu-day-du.mjs nhóm 12 (Supabase giả).
const TRANG_FORM = ['/dat-ban', '/en/book', '/ko/book', '/tuyen-dung', '/en/jobs', '/ko/jobs', '/mua-thit-ve', '/en/buy-meat', '/ko/buy-meat'];
const TRANG_HOI_BAN = ['/dat-ban', '/en/book', '/ko/book'];
const CHU_THANH_CONG = /thành công|\bsuccess|성공/i;
// Lời hứa của form hỏi bàn: gửi yêu cầu trên trang, nhà hàng gọi lại. Form đóng thì mô tả và đoạn
// mở đầu không được nói câu này (kiểm site thật 07/10/2026) — chép tay, như crm/test/test-cong-khai-hoi-ban-dong.mjs.
const HUA_FORM = {
  vi: /gọi lại|gửi yêu cầu/i,
  en: /call you back|(?<!cannot )send (?:a|your)(?: table)? request/i,
  ko: /전화드려요|전화로 안내|문의를 보내 주세요/,
};
// Trang 404: một đường dẫn lạ cho mỗi thứ tiếng.
const TRANG_KHONG_CO = [['/khong-co-trang-nay', 'vi'], ['/en/khong-co', 'en'], ['/ko/khong-co', 'ko']];
const CO_MAN_HINH = [
  // 320px: điện thoại nhỏ nhất, và cũng là máy tính 1280px phóng to 400 % (WCAG 1.4.10 — không cuộn ngang).
  { ten: 'điện thoại nhỏ', width: 320, height: 568 },
  { ten: 'điện thoại', width: 360, height: 740 },
  { ten: 'điện thoại lớn', width: 390, height: 844 },
  // 430px: điện thoại rộng nhất đang bán. Từ 400px lề hai bên không còn là 20px mà lớn dần theo 5 % bề rộng
  // (--le: clamp(20px, 5vw, 40px)) — cỡ này giữ cho phép đo và trang không lệch nhau ở khoảng 400–599px.
  { ten: 'điện thoại rộng', width: 430, height: 932 },
  { ten: 'máy tính bảng dọc', width: 768, height: 1024 },
  { ten: 'máy tính bảng', width: 800, height: 1280 },
  { ten: 'máy tính bảng ngang', width: 1024, height: 768 },
  { ten: 'máy tính', width: 1366, height: 768 },
  { ten: 'màn rộng', width: 1440, height: 900 },
];

// Trang nói về đường lên tầng 3 phải in đúng từng chữ câu chỉ đường ngay trong nội dung chính — chân
// trang cũng có câu đó trên mọi trang, nên đọc <main>, không đọc cả trang. Chép tay ở đây, KHÔNG
// đọc lib/chu.ts — sửa nhầm một chữ ở đó thì phép thử này đỏ. Chữ của câu là Claude đề xuất, chờ
// Khánh duyệt: Khánh duyệt chữ khác thì sửa ở lib/chu.ts, ở đây và ở hai file test của crm cùng lúc.
const TRANG_LOI_LEN = ['/', '/en', '/ko', '/den-beeftown', '/en/visit', '/ko/visit', '/dat-ban', '/en/book', '/ko/book'];
const CAU_CHI_DUONG = {
  vi: 'Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3.',
  en: 'Use our own entrance, right next to GS25, and take the lift to Floor 3.',
  ko: 'GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요.',
};
const DUONG_NHA_HANG = '63 Hồ Tùng Mậu';
const DIA_CHI_JSON_LD = 'Tầng 3, 63 Hồ Tùng Mậu';
// Mẫu tìm chữ sai về địa điểm nằm ở mau-dia-diem.mjs (dùng chung với hai file test của crm, có bảng
// câu thử). Sau khi bỏ dòng pháp nhân ở trên, cả trang không được còn tên đường, tên phường của địa
// chỉ khác — kể cả trong thẻ mô tả, JSON-LD, alt ảnh — và chữ khách đọc không được có vế phường / quận
// nào. Chạy với --url trên trang thật thì đây cũng là chỗ lộ ra một bản công bố (dia_chi_hien_thi,
// mo_ta_og… trong /noi-bo) còn ghi địa chỉ khác. Số nhà "11-21" chỉ tìm trong chữ khách đọc: trong
// HTML thô, nét vẽ SVG cũng có dãy số kiểu đó.

/**
 * Các phép đo thêm của một trang (chạy TRONG trang). Trả về danh sách chỗ sai của từng phép.
 * Tương phản: chỉ xét chữ mà mọi lớp nền phía sau là MÀU ĐẶC — gặp ảnh nền / gradient thì
 * bỏ qua (không tính được bằng màu); nền nửa trong suốt thì trộn dần với lớp bên dưới.
 */
function doTrang() {
  const hien = el => {
    const k = el.getBoundingClientRect();
    return el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && k.width > 0 && k.height > 0;
  };

  const anhThieu = [...document.images]
    .filter(i => !i.hasAttribute('width') || !i.hasAttribute('height') || !i.hasAttribute('alt'))
    .map(i => `${i.getAttribute('src') ?? i.currentSrc} (thiếu ${['width', 'height', 'alt'].filter(a => !i.hasAttribute(a)).join(', ')})`);
  const anhKhongLazy = [...document.querySelectorAll('figure.anh img')]
    .filter(i => i.getBoundingClientRect().top + scrollY >= innerHeight && i.getAttribute('loading') !== 'lazy')
    .map(i => i.getAttribute('src') ?? i.currentSrc);

  // --- Tương phản (WCAG 2.2) ---
  const mau = s => {
    const m = /^rgba?\(([^)]+)\)$/.exec(String(s).trim());
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    const [r, g, b] = p.slice(0, 3).map(Number);
    const a = p[3] === undefined ? 1 : p[3].endsWith('%') ? parseFloat(p[3]) / 100 : Number(p[3]);
    return [r, g, b, a].some(Number.isNaN) ? null : { r, g, b, a };
  };
  const tron = (tren, duoi) => ({
    r: tren.r * tren.a + duoi.r * (1 - tren.a), g: tren.g * tren.a + duoi.g * (1 - tren.a),
    b: tren.b * tren.a + duoi.b * (1 - tren.a), a: 1,
  });
  const doSang = c => {
    const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const tiLe = (x, y) => { const [s, t] = [doSang(x), doSang(y)].sort((m, n) => n - m); return (s + 0.05) / (t + 0.05); };
  const nenCua = el => {
    const lop = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.backgroundImage !== 'none') return null;
      const c = mau(cs.backgroundColor);
      if (!c) return null;
      if (c.a > 0) { lop.push(c); if (c.a >= 1) break; }
    }
    return lop.reverse().reduce((nen, c) => tron(c, nen), { r: 255, g: 255, b: 255, a: 1 });
  };
  const tuongPhan = [];
  const daXet = new Set();
  const di = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = di.nextNode(); n; n = di.nextNode()) {
    const el = n.parentElement;
    if (!n.nodeValue.trim() || !el || daXet.has(el)) continue;
    daXet.add(el);
    if (el.closest('[aria-hidden="true"], script, style, noscript, template, .an-chu') || !hien(el)) continue;
    const cs = getComputedStyle(el);
    const chu = mau(cs.color);
    if (!chu || chu.a === 0) continue;
    const nen = nenCua(el);
    if (!nen) continue;
    let mo = 1;
    for (let e = el; e; e = e.parentElement) mo *= Number(getComputedStyle(e).opacity);
    const r = tiLe(tron({ ...chu, a: chu.a * mo }, nen), nen);
    const co = parseFloat(cs.fontSize);
    const can = co >= 24 || (co >= 18.66 && Number(cs.fontWeight) >= 700) ? 3 : 4.5;
    if (r + 0.005 < can) {
      tuongPhan.push(`«${n.nodeValue.trim().replace(/\s+/g, ' ').slice(0, 40)}» ${r.toFixed(2)}:1 < ${can}:1 (${cs.color} trên rgb(${[nen.r, nen.g, nen.b].map(Math.round).join(', ')}), ${co}px)`);
    }
  }

  return {
    soH1: document.querySelectorAll('h1').length,
    anhThieu, anhKhongLazy, tuongPhan,
    chuChan: document.querySelector('footer')?.innerText ?? '',
    chuChinh: document.querySelector('main')?.innerText ?? '',
    // Mọi chữ khách hoặc máy tìm kiếm đọc được: tiêu đề, thẻ meta, JSON-LD, chữ hiện trong <body>, alt / aria-label / title.
    chuCaTrang: [
      document.title,
      ...[...document.querySelectorAll('meta[content]')].map(m => m.getAttribute('content')),
      ...[...document.querySelectorAll('script[type="application/ld+json"]')].map(k => k.textContent),
      document.body.innerText,
      ...[...document.querySelectorAll('[alt], [aria-label], [title]')].flatMap(e => ['alt', 'aria-label', 'title'].map(a => e.getAttribute(a))),
    ].filter(Boolean).join('\n'),
    // Cả HTML của trang — để đếm dòng pháp nhân và tìm địa chỉ khác ở chỗ không hiện thành chữ.
    htmlTrang: document.documentElement.outerHTML,
    diaChiJsonLd: (() => {
      try { return JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent ?? 'null')?.address ?? null; }
      catch { return null; }
    })(),
    // JSON-LD của nhà hàng có khai giờ mở cửa không (chỉ được khi giờ đã công bố — lib/gio-mo-cua.ts).
    coGioJsonLd: (() => {
      try { return 'openingHoursSpecification' in (JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent ?? 'null') ?? {}); }
      catch { return null; }
    })(),
    // SEO 23/11/2026: phông Montserrat tự phát (preload, không stylesheet Google cho Montserrat) và dòng hiệu của trang chủ.
    phongPreload: [...document.querySelectorAll('link[rel="preload"][as="font"]')].map(l => l.getAttribute('href')),
    coGoogleMontserrat: [...document.querySelectorAll('link[rel="stylesheet"]')].some(l => /family=Montserrat/.test(l.href)),
    dongHieu: (document.querySelector('main .kmd .hieu')?.textContent ?? '').trim(),
  };
}

// ---------------------------------------------------------------------------
const i = process.argv.indexOf('--url');
const URL_NGOAI = i > -1 ? process.argv[i + 1] : null;
// --chi gõ sai (thiếu số, có mục không phải số): dừng ngay, chưa build, chưa bật máy chủ.
if (CHON_NHOM.loi) { console.error(`\x1b[31m${CHON_NHOM.loi}\x1b[0m`); process.exit(1); }

rmSync(ANH_LOI, { recursive: true, force: true });
// Ctrl+C giữa chừng: may-chu-ban-build.mjs tự tắt wrangler dev (nhóm tiến trình riêng) trước khi thoát.
console.log('\x1b[1m\nBEEFTOWN — KIỂM THỬ BẰNG TRÌNH DUYỆT THẬT\x1b[0m');
console.log('='.repeat(60));

let mayChu = null;
let trinhDuyet = null;
try {
  const goc = URL_NGOAI ?? (mayChu = await batMayChu()).goc;
  console.log(`Trang: ${goc}`);
  trinhDuyet = await moChromium(chromium);
  const trang = await danhSachTrang(goc);
  const chupLoi = async (page, ten) => {
    mkdirSync(ANH_LOI, { recursive: true });
    await page.screenshot({ path: join(ANH_LOI, `${ten.replace(/[^a-z0-9-]+/gi, '_')}.png`), fullPage: true }).catch(() => {});
  };

  // =========================================================================
  await nhom(`1 · ${trang.length} TRANG CÔNG KHAI Ở ${CO_MAN_HINH.length} CỠ MÀN HÌNH`, async () => {
    for (const co of CO_MAN_HINH) {
      const ctx = await trinhDuyet.newContext({ viewport: { width: co.width, height: co.height } });
      for (const duong of trang) {
        const page = await ctx.newPage();
        const loiJs = [], taiHong = [];
        const cuaTrang = u => u.startsWith(goc);
        page.on('pageerror', e => loiJs.push(e.message));
        page.on('console', m => { if (m.type() === 'error' && cuaTrang(m.location().url || goc)) loiJs.push(m.text()); });
        page.on('requestfailed', r => { if (cuaTrang(r.url())) taiHong.push(`${r.url()} (${r.failure()?.errorText})`); });
        page.on('response', r => { if (cuaTrang(r.url()) && r.status() >= 400) taiHong.push(`${r.url()} HTTP ${r.status()}`); });

        const r = await page.goto(goc + duong, { waitUntil: 'load', timeout: 30000 });
        const kq = await page.evaluate(() => {
          const chan = document.querySelector('footer');
          return {
            lang: document.documentElement.lang,
            rong: document.documentElement.scrollWidth,
            khung: window.innerWidth,
            // innerText: chỉ chữ thật sự hiện ra (ảnh, chữ bị ẩn không có ở đây), mỗi khối một dòng.
            dongChan: (chan?.innerText ?? '').split('\n').map(s => s.trim()).filter(Boolean),
            coChan: !!chan,
            linkChinhSach: [...(chan?.querySelectorAll('nav[aria-labelledby="ct-chinh-sach"] a') ?? [])].map(a => a.getAttribute('href')),
            linkThongTin: [...(chan?.querySelectorAll('nav[aria-labelledby="ct-thong-tin"] a') ?? [])].map(a => a.getAttribute('href')),
            linkQuay: [...document.querySelectorAll('.qcb a.lien-ket')].map(a => a.getAttribute('href')),
            // Có chữ trong HTML mà không đọc được thì cũng như không: bị ẩn, khung rỗng, chữ dưới 14px.
            chanAn: !!chan && [...chan.querySelectorAll('p')].some(p => {
              const k = p.getBoundingClientRect();
              return !p.checkVisibility({ opacityProperty: true, visibilityProperty: true })
                || k.width === 0 || k.height === 0 || parseFloat(getComputedStyle(p).fontSize) < 14;
            }),
          };
        });
        const nhan = `${duong} · ${co.ten} ${co.width}px`;
        const them = await page.evaluate(doTrang);
        const giaoDien = await page.evaluate(doGiaoDien);
        const iBanQuyen = kq.dongChan.findIndex(d => DONG_BAN_QUYEN.test(d));
        const phapNhan = dongPhapNhan(ngonNguCua(duong));
        // Chữ của trang sau khi bỏ dòng pháp nhân: tên đường / tên phường của địa chỉ khác tìm cả trong HTML thô,
        // số nhà và vế phường / quận chỉ tìm trong chữ khách đọc.
        const chuKhongPhapNhan = boPhapNhan(them.chuCaTrang, phapNhan[1]);
        const diaChiKhac = TEN_DIA_CHI_KHAC.tim(boPhapNhan(them.htmlTrang, phapNhan[1]))
          ?? TEN_DIA_CHI_KHAC.tim(chuKhongPhapNhan) ?? SO_NHA_KHAC.tim(chuKhongPhapNhan);
        const phuongQuan = PHUONG_QUAN.tim(chuKhongPhapNhan);
        const tot = [
          ok(`${nhan}: HTTP 200, đúng lang="${ngonNguCua(duong)}"`, r?.status() === 200 && kq.lang === ngonNguCua(duong),
             `HTTP ${r?.status()}, lang="${kq.lang}"`),
          ok(`${nhan}: không lỗi JavaScript, không tải hỏng`, !loiJs.length && !taiHong.length,
             [...loiJs, ...taiHong].slice(0, 3).join(' | ')),
          ok(`${nhan}: không tràn ngang`, kq.rong <= kq.khung + 1, `rộng ${kq.rong}px > khung ${kq.khung}px`),
          ok(`${nhan}: chân trang — ngay dưới dòng "© … Beeftown · Beef Specialty Restaurant" là pháp nhân SLK GROUP (tên, mã số thuế, địa chỉ, điện thoại), chữ HTML đúng từng ký tự, hiện trên màn hình`,
             kq.coChan && !kq.chanAn && coPhapNhan(kq.dongChan, iBanQuyen, phapNhan),
             !kq.coChan ? 'trang không có <footer>'
               : kq.chanAn ? 'một dòng chân trang bị ẩn hoặc chữ dưới 14px' : JSON.stringify(kq.dongChan)),
          ok(`${nhan}: chân trang — dòng "${NHAN_EMAIL[ngonNguCua(duong)]}: …" ngay dưới số điện thoại pháp nhân; nhóm Chính sách đủ 9 link đúng thứ tự, đúng thứ tiếng`,
             iBanQuyen > -1 && (kq.dongChan[iBanQuyen + 4] ?? '').startsWith(`${NHAN_EMAIL[ngonNguCua(duong)]}: `)
               && JSON.stringify(kq.linkChinhSach) === JSON.stringify(LINK_CHINH_SACH[ngonNguCua(duong)]),
             `${kq.dongChan[iBanQuyen + 4] ?? '(không có dòng)'} · ${kq.linkChinhSach.join(' ')}`),
          ok(`${nhan}: chân trang — cột Thông tin có link trang Các phần thịt bò đứng đầu, rồi Tuyển dụng, Xóa dữ liệu, đúng thứ tiếng`,
             JSON.stringify(kq.linkThongTin) === JSON.stringify(LINK_THONG_TIN[ngonNguCua(duong)]), kq.linkThongTin.join(' ')),
          ok(`${nhan}: ${TRANG_CHU_BA[duong] ? 'dải "Nhìn tận mắt, chọn tận tay" có đúng một link sang trang Các phần thịt bò' : 'không có dải "Nhìn tận mắt, chọn tận tay" (chỉ trang chủ có)'}`,
             JSON.stringify(kq.linkQuay) === JSON.stringify(TRANG_CHU_BA[duong] ? [LINK_QUAY_CHON_BO[TRANG_CHU_BA[duong]]] : []), kq.linkQuay.join(' ')),
          ok(`${nhan}: đúng một <h1>`, them.soH1 === 1, `${them.soH1} thẻ h1`),
          ok(`${nhan}: mọi <img> có width, height, alt`, !them.anhThieu.length, them.anhThieu.slice(0, 3).join(' | ')),
          ok(`${nhan}: ảnh minh họa dưới màn hình đầu có loading="lazy"`, !them.anhKhongLazy.length, them.anhKhongLazy.slice(0, 3).join(' | ')),
          ...Object.entries(PHEP_DO).map(([khoa, ten]) =>
            ok(`${nhan}: ${ten}`, giaoDien[khoa]?.length === 0, (giaoDien[khoa] ?? ['không đo được']).slice(0, 4).join(' | '))),
          ok(`${nhan}: chân trang có địa chỉ "${DUONG_NHA_HANG}" kèm khu vực "Quận 1 cũ" (bản build không database) và câu chỉ đường`,
             them.chuChan.includes(DUONG_NHA_HANG) && (URL_NGOAI || them.chuChan.includes('Quận 1 cũ'))
               && motDong(them.chuChan).includes(CAU_CHI_DUONG[ngonNguCua(duong)]),
             motDong(them.chuChan).slice(0, 200)),
          // SEO 23/11/2026: phông Montserrat tự phát (preload bộ latin, không stylesheet Google cho Montserrat); JSON-LD
          // chưa công bố giờ thì không có openingHoursSpecification; trang chủ có dòng hiệu đúng tiếng của trang.
          ok(`${nhan}: phông Montserrat tự phát — preload /phong/montserrat-5.3.0-latin-wght.woff2, không stylesheet Google cho Montserrat`,
             them.phongPreload.includes('/phong/montserrat-5.3.0-latin-wght.woff2') && !them.coGoogleMontserrat,
             `preload: ${them.phongPreload.join(', ') || '(không có)'} · stylesheet Google Montserrat: ${them.coGoogleMontserrat}`),
          ...(URL_NGOAI ? [] : [ok(`${nhan}: JSON-LD chưa công bố giờ phục vụ → không có openingHoursSpecification`, them.coGioJsonLd === false, String(them.coGioJsonLd))]),
          ...(duongDanTuongUng('/', ngonNguCua(duong)) === duong
            ? [ok(`${nhan}: dòng hiệu trên câu chính là "${chu(ngonNguCua(duong)).dongHieu}" (đúng tiếng của trang, không còn "Beef Specialty Restaurant")`,
                  them.dongHieu === chu(ngonNguCua(duong)).dongHieu && !/Beef Specialty/i.test(them.dongHieu), them.dongHieu)]
            : []),
          ...(TRANG_LOI_LEN.includes(duong)
            ? [ok(`${nhan}: nội dung chính in đúng từng chữ câu chỉ đường (lối vào riêng ngay cạnh GS25, thang máy lên tầng 3)`,
                  motDong(them.chuChinh).includes(CAU_CHI_DUONG[ngonNguCua(duong)]))]
            : []),
          // Trang thật (--url) có thể đang in bản công bố của /noi-bo: cả dòng đó nằm ở streetAddress, nên chỉ
          // đòi có "63 Hồ Tùng Mậu". Bản build không database thì phải đúng từng trường của địa chỉ cố định.
          ok(`${nhan}: JSON-LD ghi streetAddress "${DIA_CHI_JSON_LD}", không có tên phường`,
             typeof them.diaChiJsonLd?.streetAddress === 'string'
               && (URL_NGOAI
                 ? them.diaChiJsonLd.streetAddress.includes(DUONG_NHA_HANG)
                 : them.diaChiJsonLd.streetAddress === DIA_CHI_JSON_LD && !('addressLocality' in them.diaChiJsonLd)
                   && !/phường/iu.test(JSON.stringify(them.diaChiJsonLd)))
               && !TEN_DIA_CHI_KHAC.tim(JSON.stringify(them.diaChiJsonLd)) && !SO_NHA_KHAC.tim(JSON.stringify(them.diaChiJsonLd)),
             JSON.stringify(them.diaChiJsonLd)),
          ok(`${nhan}: ngoài dòng pháp nhân (có đúng một lần), cả trang không còn địa chỉ nào khác ${DUONG_NHA_HANG}`,
             them.htmlTrang.split(phapNhan[1]).length === 2 && !diaChiKhac,
             `dòng pháp nhân có ${them.htmlTrang.split(phapNhan[1]).length - 1} lần; thấy «${diaChiKhac ?? ''}»`),
          ok(`${nhan}: ngoài dòng pháp nhân, chữ khách đọc không ghi tên phường hay quận nào (trừ "Quận 1 cũ")`, !phuongQuan, `thấy «${phuongQuan ?? ''}»`),
          ok(`${nhan}: không còn chữ về cầu thang bộ, không câu nào nói không có thang máy`, !CAU_THANG.tim(them.chuCaTrang),
             CAU_THANG.tim(them.chuCaTrang) ?? ''),
          ok(`${nhan}: tương phản chữ ≥ 4,5:1 (chữ lớn ≥ 3:1) trên nền màu đặc`, !them.tuongPhan.length,
             them.tuongPhan.slice(0, 3).join(' | ')),
        ];
        if (tot.includes(false)) await chupLoi(page, `${duong}-${co.width}`);
        await page.close();
      }
      await ctx.close();
    }
  });

  // =========================================================================
  if (URL_NGOAI) {
    console.log('\n(Trang thật: bỏ qua mục 2–4 — chúng giả định chưa có database và gửi form thử.)');
  } else {
    const ctx = await trinhDuyet.newContext({ viewport: { width: 360, height: 740 } });
    const page = await ctx.newPage();

    await nhom('2 · CHƯA CÓ DATABASE: FORM ẨN HẲN, KHÔNG BÁO THÀNH CÔNG', async () => {
      for (const duong of TRANG_FORM) {
        await page.goto(goc + duong);
        const soForm = await page.locator('form').count();
        const chu = await page.locator('body').innerText();
        ok(`${duong}: không có form nào (form chưa sẵn sàng thì ẩn hẳn)`, soForm === 0, `${soForm} form`);
        ok(`${duong}: không có chữ "thành công"/"success"/"성공"`, !CHU_THANH_CONG.test(chu), chu.match(CHU_THANH_CONG)?.[0]);
        if (TRANG_HOI_BAN.includes(duong)) {
          const hua = HUA_FORM[ngonNguCua(duong)];
          const moTa = await page.locator('meta[name="description"]').getAttribute('content') ?? '';
          const moTaOg = await page.locator('meta[property="og:description"]').getAttribute('content') ?? '';
          const dan = await page.locator('main p.dan').first().innerText().catch(() => '');
          ok(`${duong}: form đóng → meta description và og:description không hứa gửi yêu cầu / gọi lại`,
             !hua.test(moTa) && !hua.test(moTaOg), `«${moTa}»`);
          ok(`${duong}: form đóng → đoạn mở đầu không hứa gửi yêu cầu / gọi lại`, !!dan && !hua.test(dan), `«${dan}»`);
        }
      }
    });

    await nhom('3 · GỬI THẲNG FORM ĐẶT BÀN: BÁO LỖI, KHÔNG BAO GIỜ BÁO THÀNH CÔNG', async () => {
      for (const duong of ['/dat-ban', '/en/book', '/ko/book']) {
        await page.goto(goc + duong);
        const truoc = await page.locator('body').innerText();
        // Dựng form ngay trên trang rồi bấm gửi — giống kẻ gửi thẳng, hoặc trang cũ còn trong bộ nhớ đệm.
        await Promise.all([
          page.waitForNavigation(),
          page.evaluate(() => {
            const f = document.createElement('form');
            f.method = 'post'; f.action = location.pathname;
            for (const [k, v] of Object.entries({ ho_ten: 'Khách Thử', sdt: '0912345678', ngay: '2030-10-01', gio: '18:00', so_khach: '2' })) {
              const o = document.createElement('input'); o.name = k; o.value = v; f.appendChild(o);
            }
            document.body.appendChild(f); f.submit();
          }),
        ]);
        const sau = await page.locator('body').innerText();
        ok(`${duong}: gửi xong quay về đúng trang`, new URL(page.url()).pathname === duong, page.url());
        ok(`${duong}: không bao giờ báo thành công`, !CHU_THANH_CONG.test(sau), sau.match(CHU_THANH_CONG)?.[0]);
        // Đặt bàn đang đóng thì trang CỐ Ý bỏ câu lỗi của lần gửi và hiện khung "chưa mở đặt bàn" — cũng là
        // sự thật, và cũng chỉ đường sang Facebook. Không được là trang khác, trang trống hay form.
        if (!ok(`${duong}: trang sau khi gửi nói rõ chưa đặt được và chỉ đường sang Facebook`,
                /facebook/i.test(sau) && (sau === truoc || sau.length > truoc.length) && await page.locator('form').count() === 0,
                sau.slice(0, 160))) await chupLoi(page, `gui-thang${duong}`);
      }

      const r = await page.request.post(goc + '/dat-ban', {
        headers: { Origin: 'https://ke-la.example', 'Content-Type': 'application/x-www-form-urlencoded' },
        data: 'ho_ten=x&sdt=0912345678', maxRedirects: 0,
      });
      ok('Gửi từ trang web khác (Origin lạ) → 403', r.status() === 403, `HTTP ${r.status()}`);
    });

    await nhom('4 · KHU NỘI BỘ VÀ HOOK', async () => {
      const r = await page.goto(goc + '/noi-bo');
      ok('/noi-bo → trang đăng nhập (200)', r?.status() === 200 && new URL(page.url()).pathname === '/noi-bo/dang-nhap', page.url());
      for (const [cach, duong] of [['GET', '/hook/ipos/khong-dung'], ['POST', '/hook/ipos/khong-dung'], ['POST', '/hook/messenger']]) {
        const h = await page.request.fetch(goc + duong, { method: cach, data: cach === 'POST' ? '{}' : undefined, maxRedirects: 0 });
        const than = await h.text();
        ok(`${cach} ${duong}: từ chối (4xx/503), không lộ lỗi nội bộ`,
           (h.status() >= 400 && h.status() < 500) || h.status() === 503,
           `HTTP ${h.status()}`);
        ok(`${cach} ${duong}: thân trả lời không có dấu vết lỗi (stack, đường dẫn file)`,
           !/\bat [\w.<>]+ \(|node_modules|\.ts:\d+|Error:/.test(than), than.slice(0, 160));
      }
      // Nhánh riêng của src/worker.ts: khóa sai dạng → 404 chữ trơn, chặn TRƯỚC Astro. Trang 404 của
      // web không được thay câu trả lời này bằng HTML.
      const h = await page.request.get(goc + '/hook/ipos/a/b', { maxRedirects: 0 });
      const thanHook = await h.text();
      ok('GET /hook/ipos/a/b: vẫn là 404 chữ trơn "Không tìm thấy" của src/worker.ts, không phải trang 404 HTML',
         h.status() === 404 && thanHook === 'Không tìm thấy' && !/text\/html/i.test(h.headers()['content-type'] ?? ''),
         `HTTP ${h.status()}, ${h.headers()['content-type']}, «${thanHook.slice(0, 60)}»`);
      // Đường dẫn lạ dưới /noi-bo vẫn đi qua middleware: chưa đăng nhập thì về trang đăng nhập — trang 404
      // không mở ra cho người lạ biết đường dẫn nào có, đường dẫn nào không. Đủ các dạng middleware canh:
      // trong khu nội bộ, sâu trong kho, có / cuối, và tiền tố không có / (/noi-bo-…). Đã đăng nhập thì
      // /noi-bo/… hiện bản 404 NỘI BỘ — phần đó cần database, kiểm ở crm/test/test-noi-bo-khong-co.mjs.
      for (const duong of ['/noi-bo/khong-co-trang-nay', '/noi-bo/kho/khong-co-trang-nay/', '/noi-bo-khong-co-trang-nay']) {
        const nb = await page.request.get(goc + duong, { maxRedirects: 0 });
        ok(`GET ${duong} chưa đăng nhập → chuyển về /noi-bo/dang-nhap, không phải trang 404`,
           nb.status() === 302 && new URL(nb.headers().location ?? '', goc).pathname === '/noi-bo/dang-nhap',
           `HTTP ${nb.status()} → ${nb.headers().location}`);
      }
      // Header bảo vệ của khu nội bộ (rà soát 14/11/2026, lib/header-noi-bo.ts): mọi trả lời dưới /noi-bo — trang
      // đăng nhập (có và không có / cuối), lệnh chuyển hướng của người chưa đăng nhập — cấm trang khác nhúng vào
      // khung và không cho bộ đệm dùng chung giữ. KHÔNG ép no-store (bấm Quay lại sau trang "đang bận" phải còn form
      // đang gõ — lý do ở đầu lib/header-noi-bo.ts). Trang công khai thì không bị gắn gì.
      const camNhung = d => (d['content-security-policy'] ?? '').split(',').some(cs => /^frame-ancestors\s+'none'$/i.test(
        cs.split(';').map(l => l.trim()).find(l => /^frame-ancestors(\s|$)/i.test(l)) ?? '')) && d['x-frame-options'] === 'DENY';
      const rieng = d => /(^|,\s*)(private|no-store)\b/.test(d['cache-control'] ?? '');
      const tomDau = d => `cache-control: ${d['cache-control']} · csp: ${d['content-security-policy']} · x-frame-options: ${d['x-frame-options']}`;
      for (const duong of ['/noi-bo/dang-nhap', '/noi-bo/dang-nhap/', '/noi-bo/kho', '/noi-bo/khong-co-trang-nay']) {
        const nb = await page.request.get(goc + duong, { maxRedirects: 0 });
        ok(`GET ${duong}: cấm nhúng vào khung (frame-ancestors 'none', X-Frame-Options DENY), không vào bộ đệm dùng chung (private hoặc no-store)`,
           camNhung(nb.headers()) && rieng(nb.headers()), `HTTP ${nb.status()} · ${tomDau(nb.headers())}`);
      }
      const dn = (await page.request.get(goc + '/noi-bo/dang-nhap', { maxRedirects: 0 })).headers();
      ok('Trang đăng nhập không bị ép no-store', !/no-store/.test(dn['cache-control'] ?? ''), tomDau(dn));
      const ck = (await page.request.get(goc + '/', { maxRedirects: 0 })).headers();
      ok('Trang chủ công khai không bị gắn header của khu nội bộ', !camNhung(ck) && !/private|no-store/.test(ck['cache-control'] ?? '')
         && !/frame-ancestors/.test(ck['content-security-policy'] ?? '') && ck['x-frame-options'] === undefined, tomDau(ck));
      // Đăng xuất (chưa đăng nhập cũng gửi được: /noi-bo/dang-xuat mở cho mọi người): về trang đăng nhập, kèm lệnh
      // bảo trình duyệt bỏ bản lưu đệm và các trang đã nằm trong bộ nhớ quay lại của nó. Riêng trang vừa bấm Đăng
      // xuất thì lệnh này không gỡ được — khối "NÚT QUAY LẠI" ngay dưới.
      const ra = await page.request.post(goc + '/noi-bo/dang-xuat', {
        headers: { Origin: goc, 'Content-Type': 'application/x-www-form-urlencoded' }, data: '', maxRedirects: 0,
      });
      ok('POST /noi-bo/dang-xuat: 302 về trang đăng nhập, mang Clear-Site-Data: "cache" và header chống nhúng',
         ra.status() === 302 && new URL(ra.headers().location ?? '', goc).pathname === '/noi-bo/dang-nhap'
         && ra.headers()['clear-site-data'] === '"cache"' && camNhung(ra.headers()),
         `HTTP ${ra.status()} → ${ra.headers().location} · clear-site-data: ${ra.headers()['clear-site-data']} · ${tomDau(ra.headers())}`);

      // DẤU PHIÊN: trả lời đăng xuất đổi cookie bt_dau_phien — tín hiệu để trang nội bộ biết phiên đã kết thúc khi
      // trình duyệt đưa nó trở lại từ bộ nhớ (lib/phien.ts xoaToken). JavaScript phải đọc được nó, nên không HttpOnly.
      const cookieDat = ra.headersArray().filter(h => h.name.toLowerCase() === 'set-cookie').map(h => h.value);
      const dauPhien = cookieDat.find(c => c.startsWith('bt_dau_phien=')) ?? '';
      // Lệnh xóa cookie phiên phải mang ĐÚNG Path của lúc đặt (Path=/): mang Path khác thì trả lời trông vẫn đúng mà
      // trình duyệt giữ nguyên cookie (vòng bốn 14/11 — phép kiểm cũ chỉ nhìn "bt_phien=deleted"). Bản build thật là bản
      // PROD nên cookie dấu phải có Secure.
      const xoaPhien = cookieDat.find(c => c.startsWith('bt_phien=')) ?? '';
      ok('POST /noi-bo/dang-xuat: đặt dấu phiên mới (bt_dau_phien) — chuỗi ngẫu nhiên, Path=/, Secure, không HttpOnly; cookie phiên bị xóa bằng lệnh mang đúng Path=/',
         /^bt_dau_phien=[0-9a-f-]{36};/.test(dauPhien) && /;\s*Path=\/(;|$)/i.test(dauPhien) && /;\s*Secure(;|$)/i.test(dauPhien) && !/httponly/i.test(dauPhien)
         && /^bt_phien=(deleted)?;/.test(xoaPhien) && /;\s*Path=\/(;|$)/i.test(xoaPhien), cookieDat.join(' | ').slice(0, 300));

      // NÚT QUAY LẠI SAU KHI ĐĂNG XUẤT (rà soát 14/11/2026, vòng hai và ba). Header ở trên KHÔNG đủ: trang vừa bấm Đăng
      // xuất vẫn nằm trong bộ nhớ quay lại (bfcache) của trình duyệt, bấm Quay lại là hiện ra mà máy chủ không được
      // hỏi. Đoạn mã in thẳng vào đầu mọi trang nội bộ (components/SauDangXuat.astro, lib/sau-dang-xuat.js) so dấu
      // phiên máy chủ in vào trang với dấu trình duyệt đang giữ. Trang rời đi là giấu (lúc nào cũng vậy); lúc hiện lại,
      // dấu không đổi thì cho hiện, dấu đã khác thì vẫn giấu và xin lại trang từ máy chủ.
      //
      // Phải thử bằng Chromium BẢN ĐẦY ĐỦ: bản rút gọn mà chromium.launch() trần dùng không có bfcache, và Playwright
      // còn tắt bfcache bằng một cờ mặc định — thử ở đó thì lỗi này không bao giờ lộ (bản đầu của đợt vá đã kết luận
      // sai đúng vì vậy). Phép đối chứng đầu tiên bắt chính chuyện đó: trình duyệt thử không có bfcache là đỏ.
      // Bản build này không có database nên không đăng nhập được: form Đăng xuất được dựng ngay trên trang đăng nhập
      // — cùng khung NoiBo, cùng đoạn mã; lượt POST /noi-bo/dang-xuat (xóa cookie, đổi dấu) là của Worker thật.
      /**
       * Mọi lời gọi vào trang đều có hạn. Playwright KHÔNG đọc được một trang đang chờ lượt xin lại trang của chính nó
       * (máy chủ chưa trả lời): evaluate() không trả lời cho tới khi trang mới về, và mặc định không có hạn — bản đầu
       * của khối này treo cả bộ thử ở đúng chỗ đó. Hết hạn thì trả `undefined`: mọi phép so bên dưới so ĐÚNG giá trị
       * mong đợi (=== true, === 'hidden'…), nên "không đọc được" không bao giờ thành đạt.
       */
      const coHan = (viec, hetMs = 5000) => {
        let hen;
        return Promise.race([
          Promise.resolve(viec).catch(() => undefined),
          new Promise(xong => { hen = setTimeout(() => xong(undefined), hetMs); }),
        ]).finally(() => clearTimeout(hen));
      };
      const trongTrang = (t, ham, thamSo) => coHan(t.evaluate(ham, thamSo));
      const nghi = ms => new Promise(xong => setTimeout(xong, ms));
      /** Chờ tới khi `dieuKien()` đúng, tối đa hetMs — không chờ cứng: máy CI chậm thì chờ lâu hơn, không đỏ oan. */
      const choDen = async (dieuKien, hetMs = 10_000) => {
        const het = Date.now() + hetMs;
        for (;;) {
          const dat = await dieuKien();
          if (dat || Date.now() >= het) return dat;
          await nghi(100);
        }
      };
      /** Dấu phiên máy chủ in vào trang đang mở, và dấu trình duyệt đang giữ (đoạn mã của trang so đúng hai thứ này). */
      const dauTrongTrang = async t => (await trongTrang(t, () => {
        const the = document.querySelectorAll('head script[data-dau-phien]');
        const khop = document.cookie.match(/(?:^|;\s*)bt_dau_phien=([^;]*)/);
        const ma = the[0]?.textContent ?? '';
        return { soThe: the.length, inVao: the[0]?.getAttribute('data-dau-phien') ?? null, cookie: khop ? khop[1] : '',
                 coMa: ma.includes('bt_dau_phien=') && ma.includes("addEventListener('pagehide'") && ma.includes("addEventListener('pageshow'") };
      })) ?? { khongDocDuoc: true };
      /** Chạy một khối thử có hạn cho CẢ khối: một lời gọi nào đó của trình duyệt không trả lời thì khối đỏ, không treo. */
      const chayCoHan = async (ten, khoi, hetMs = 180_000) => {
        let hen;
        try {
          const ketCuc = await Promise.race([khoi().then(() => 'xong'), new Promise(xong => { hen = setTimeout(() => xong('het-han'), hetMs); })]);
          if (ketCuc !== 'xong') ok(`${ten} chạy xong trong ${hetMs / 60_000} phút`, false, 'hết hạn — trang tải chậm, hoặc một lời gọi vào trình duyệt không trả lời; cảnh đang chạy dở là cảnh ngay sau dòng cuối in ở trên');
        } finally {
          clearTimeout(hen);
        }
      };

      /**
       * Phông chữ của Google được trả lời TẠI CHỖ bằng một bảng kiểu rỗng (vòng bốn 14/11). Khối này mở vài chục trang,
       * route của Playwright tắt bộ đệm HTTP nên trang nào cũng xin lại phông (đo được 89 lượt), và đoạn mã cần thử đứng
       * sau thẻ phông trong <head> — mạng tới Google chậm là cả khối chậm theo, tới mức hết hạn dù mã không sai.
       */
      const phongChuTaiCho = c => c.route(u => /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(u.hostname),
        tuyen => tuyen.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: '' }).catch(() => {}));
      const dungFormDangXuat = t => trongTrang(t, () => {
        const f = document.createElement('form');
        f.method = 'POST'; f.setAttribute('action', '/noi-bo/dang-xuat');
        f.innerHTML = '<button type="submit" id="thu-dang-xuat">Đăng xuất</button>';
        document.body.appendChild(f);
      });
      const bamDangXuat = async (t, dau) => {
        await Promise.all([t.waitForURL(u => !u.search.includes(dau)), t.click('#thu-dang-xuat')]);
        await t.waitForLoadState('load');
      };

      let coBoNho = null;
      try {
        coBoNho = await moChromium(chromium, { channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'] });
      } catch (e) {
        ok('Mở được Chromium bản đầy đủ để thử nút Quay lại (thiếu thì: cd web && npx playwright install chromium)', false, String(e.message).split('\n')[0]);
      }
      if (coBoNho) {
        const thuNutQuayLai = async () => {
          const ctxLui = await coBoNho.newContext();
          await phongChuTaiCho(ctxLui);
          const tab = await ctxLui.newPage();
          const dieuHuong = t => {
            const ds = [];
            t.on('request', r => { if (r.isNavigationRequest()) ds.push(new URL(r.url()).pathname + new URL(r.url()).search); });
            return ds;
          };
          const yeuCau = dieuHuong(tab);
          const taiFile = [];
          tab.on('request', r => { if (/sau-dang-xuat/.test(r.url())) taiFile.push(r.url()); });
          // CHÍNH TRANG ghi lại nó đang bị giấu hay hiện ở ba lúc (vào sessionStorage — còn qua lần chuyển trang, riêng
          // từng tab; nhãn là "b" + số ở ?buoc= của trang, để cảnh sau không đọc nhầm của cảnh trước):
          //   · hien — lúc trang hiện lại từ bộ nhớ, TRƯỚC khi đoạn mã của trang kịp chạy: 'hidden' ở đây nghĩa là trạng
          //            thái trình duyệt cất đi là trạng thái đã giấu (khung hình nào được vẽ ra thì đo riêng bằng quay màn
          //            hình — khối "KHUNG HÌNH KHI BẤM QUAY LẠI");
          //   · cho  — 0,6 giây sau đó, nếu trang cũ còn sống (máy chủ chưa trả lời lượt xin lại);
          //   · roi  — lúc trang RỜI đi, SAU khi đoạn mã của trang đã chạy;
          //   · giau — lần đầu trang bị giấu thì thân trang (<body>) đã được dựng chưa. Không ghi trạng thái tải của
          //            tài liệu: lệnh xin lại trang hủy việc đọc trang, và trình duyệt báo tài liệu "complete" ngay lúc đó;
          //   · kieu — trình duyệt dựng từng tài liệu ở địa chỉ này theo kiểu nào, nối theo thứ tự: "navigate" (mở
          //            thường), "back_forward" (bấm Quay lại mà phải dựng lại trang), "reload" (tải lại). Trang hiện
          //            lại từ bfcache không phải tài liệu mới nên không thêm gì.
          // Sự kiện gửi tới window chạy các tai nghe theo THỨ TỰ GẮN (cờ capture không đổi được thứ tự — đã thử: bản
          // đầu của khối này dựa vào cờ đó và đo nhầm). Nên tai nghe "hien" / "cho" gắn bằng addInitScript — chạy ở đầu
          // mỗi tài liệu mới, trước mọi mã của trang; tai nghe "roi" gắn bằng danhDau sau khi trang tải xong.
          await ctxLui.addInitScript(() => {
            const nhan = () => 'b' + (new URLSearchParams(location.search).get('buoc') ?? '');
            try {
              const khoa = `thu:${nhan()}:kieu`;
              sessionStorage.setItem(khoa, `${sessionStorage.getItem(khoa) ?? ''}${performance.getEntriesByType('navigation')[0]?.type ?? '?'},`);
            } catch { /* tài liệu chưa có địa chỉ thật (about:blank) — không cần ghi */ }
            // "Lúc hiện lại" = sự kiện ĐẾN TRƯỚC giữa visibilitychange (thẻ hiện ra) và pageshow: Chromium báo
            // visibilitychange trước pageshow khi đưa một trang ra từ bộ nhớ (đã đo), và đoạn mã của trang nghe cả hai.
            let daRoi = false;
            window.addEventListener('pagehide', () => { daRoi = true; });
            const ghiLucHien = () => {
              if (!daRoi) return;
              daRoi = false;
              const dangGiau = () => document.documentElement.style.visibility || 'hien';
              sessionStorage.setItem(`thu:${nhan()}:hien`, dangGiau());
              setTimeout(() => sessionStorage.setItem(`thu:${nhan()}:cho`, dangGiau()), 600);
            };
            document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ghiLucHien(); });
            window.addEventListener('pageshow', suKien => { if (suKien.persisted) ghiLucHien(); });
            let daGhi = false;
            new MutationObserver(() => {
              if (daGhi || document.documentElement?.style.visibility !== 'hidden') return;
              daGhi = true;
              sessionStorage.setItem(`thu:${nhan()}:giau`, document.body ? 'co-than' : 'chua-co-than');
            }).observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] });
          });
          const danhDau = (t, nhan) => trongTrang(t, n => {
            window.__taiLieuCu = true;
            window.addEventListener('pagehide', () => sessionStorage.setItem(`thu:${n}:roi`, document.documentElement.style.visibility || 'hien'));
          }, nhan);
          const ghiNhan = async (t, nhan) => (await trongTrang(t, n => Object.fromEntries(
            ['roi', 'hien', 'cho', 'giau', 'kieu'].map(ten => [ten, sessionStorage.getItem(`thu:${n}:${ten}`)])), nhan)) ?? { khongDocDuoc: true };
          /** true = còn tài liệu cũ; false = tài liệu mới; undefined = không đọc được trang. */
          const conTaiLieuCu = t => trongTrang(t, () => window.__taiLieuCu === true);
          /**
           * Bấm Quay lại rồi chờ trang về tới địa chỉ có `dau`. Lùi bằng history.back(): page.goBack() chờ sự kiện load,
           * thứ không có khi trang hiện lại từ bfcache. Trả:
           *   · taiLai    — sau khi quay về, trình duyệt có XIN LẠI trang đó từ máy chủ không. Mong xin lại thì chờ lượt
           *                 xin đó tới 10 giây; không mong thì chờ 1 giây yên lặng (lệnh xin lại, nếu có, phát lượt xin
           *                 ngay trong lúc trang hiện ra — không phụ thuộc máy chủ trả lời nhanh hay chậm);
           *   · taiLieuCu — trang đang hiện có còn là tài liệu cũ (còn dấu JavaScript đặt trước đó) không;
           *   · dauKhop   — trang đang hiện mang đúng dấu phiên trình duyệt đang giữ không. Sau một lần đăng xuất, chỉ
           *                 bản máy chủ VỪA dựng mới mang dấu mới: "có lượt xin trang" chưa đủ nói là máy chủ đã trả
           *                 lời (trình duyệt có thể tự trả bằng bản lưu đệm), dấu khớp thì đủ.
           */
          const lui = async (t, ds, dau, mongTaiLai) => {
            const moc = ds.length;
            await trongTrang(t, () => { history.back(); });
            await choDen(() => t.url().includes(dau));
            const xinLai = () => ds.slice(moc).some(y => y.includes(dau));
            if (mongTaiLai) await choDen(xinLai); else await nghi(1000);
            // Chỉ chờ trang tải xong khi nó ĐƯỢC xin lại. Trang hiện lại từ bfcache không có sự kiện load: chờ là chờ hết
            // hạn mặc định 30 giây của Playwright (vòng ba 14/11 đo được hai lần chờ như vậy ở bản đầu).
            if (xinLai()) {
              await t.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
              await choDen(async () => (await conTaiLieuCu(t)) === false);
            }
            const dauSau = await dauTrongTrang(t);
            return { taiLai: xinLai(), taiLieuCu: await conTaiLieuCu(t), veDung: t.url().includes(dau), nhan: JSON.stringify(ds.slice(moc)),
                     dauKhop: dauSau.soThe === 1 && dauSau.inVao === dauSau.cookie };
          };
          await tab.goto(goc + '/noi-bo/dang-nhap?buoc=1'); await danhDau(tab, 'b1');
          const dau1 = await dauTrongTrang(tab);
          ok('Trang đăng nhập (khung NoiBo): đoạn mã nằm ngay trong <head> (đúng một thẻ, có mã bên trong), mang dấu phiên máy chủ thấy; không tải file riêng nào',
             dau1.soThe === 1 && dau1.coMa === true && dau1.inVao === dau1.cookie && taiFile.length === 0, `${JSON.stringify(dau1)} · tải: ${taiFile.join(', ')}`);
          await tab.goto(goc + '/noi-bo/dang-nhap?buoc=2');
          const doiChung = await lui(tab, yeuCau, 'buoc=1', false);
          const ghi1 = await ghiNhan(tab, 'b1');
          const coBfcache = doiChung.veDung && doiChung.taiLieuCu === true && !doiChung.taiLai;
          ok('Đối chứng: trình duyệt thử có bfcache thật — Quay lại bình thường hiện lại đúng trang cũ, không hỏi máy chủ, không bị xin lại',
             coBfcache, `${coBoNho.version()} · ${tab.url()} · còn tài liệu cũ: ${doiChung.taiLieuCu} · máy chủ nhận: ${doiChung.nhan}`);
          // Trang rời đi là GIẤU, lúc nào cũng vậy (vòng bốn 14/11): bản trình duyệt cất vào bộ nhớ quay lại luôn là bản
          // đã giấu. Về lại mà dấu không đổi thì đoạn mã cho hiện ngay ("cho" = 0,6 giây sau lúc hiện lại).
          ok('RÀ SOÁT 14/11 (vòng bốn): …trang đó được GIẤU lúc rời (bản cất vào bộ nhớ là bản đã giấu) và HIỆN LẠI ngay khi quay về, vì không ai đăng xuất',
             ghi1.roi === 'hidden' && ghi1.hien === 'hidden' && ghi1.cho === 'hien'
             && (await trongTrang(tab, () => document.documentElement.style.visibility)) === '', JSON.stringify(ghi1));

          await tab.goto(goc + '/noi-bo/dang-nhap?buoc=3'); await danhDau(tab, 'b3'); await dungFormDangXuat(tab);
          // Một cookie phiên nằm THẬT trong trình duyệt, đặt như ghiToken đặt (Path=/, HttpOnly). Bản build này không có
          // database nên không đăng nhập được; giá trị không cần đúng — điều cần biết là trình duyệt có BỎ cookie đó khi
          // nhận trả lời đăng xuất không. Lệnh xóa mang Path khác là trình duyệt giữ nguyên nó (vòng bốn 14/11).
          const cookiePhien = async () => (await ctxLui.cookies()).filter(c => c.name === 'bt_phien').map(c => c.path);
          await ctxLui.addCookies([{ name: 'bt_phien', value: encodeURIComponent(JSON.stringify({ access_token: 'thu', refresh_token: 'thu' })),
                                    url: goc + '/', httpOnly: true, sameSite: 'Lax' }]);
          const phienTruoc = await cookiePhien();
          await bamDangXuat(tab, 'buoc=3');
          const phienSau = await cookiePhien();
          ok('RÀ SOÁT 14/11 (vòng bốn): bấm Đăng xuất trong trình duyệt thật → cookie phiên (đặt với Path=/) KHÔNG còn trong trình duyệt',
             phienTruoc.join() === '/' && phienSau.length === 0, `trước: ${JSON.stringify(phienTruoc)} · sau: ${JSON.stringify(phienSau)}`);
          ok('Bấm Đăng xuất: về trang đăng nhập', new URL(tab.url()).pathname === '/noi-bo/dang-nhap' && new URL(tab.url()).search === '', tab.url());
          const dau3 = await dauTrongTrang(tab);
          ok('RÀ SOÁT 14/11 (vòng ba): đăng xuất đổi dấu phiên trong trình duyệt; trang đăng nhập sau đó mang đúng dấu mới',
             /^[0-9a-f-]{36}$/.test(dau3.cookie ?? '') && dau3.cookie !== dau1.cookie && dau3.inVao === dau3.cookie, `${dau1.cookie || '(chưa có)'} → ${JSON.stringify(dau3)}`);
          const roi3 = await ghiNhan(tab, 'b3');
          ok('RÀ SOÁT 14/11 (vòng ba): trang vừa bấm Đăng xuất đã bị GIẤU từ lúc rời đi', roi3.roi === 'hidden', JSON.stringify(roi3));
          // Bấm Quay lại, và GIỮ lượt xin lại ở máy chủ 1,5 giây (như khi máy chủ chậm). Trong lúc đó không hỏi được
          // trang từ ngoài (xem coHan), nên chính trang cũ ghi lại: lúc hiện lại nó giấu hay hiện, 0,6 giây sau thì sao.
          let tha;
          const giu = new Promise(xong => { tha = xong; });
          const laBuoc3 = u => u.search.includes('buoc=3');
          await tab.route(laBuoc3, async tuyen => { await giu; await tuyen.continue().catch(() => {}); });
          const moc3 = yeuCau.length;
          await trongTrang(tab, () => { history.back(); });
          const daXin = await choDen(() => yeuCau.slice(moc3).some(y => y.includes('buoc=3')));
          await nghi(1500);
          tha();
          await tab.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
          await choDen(async () => (await conTaiLieuCu(tab)) === false);
          await tab.unroute(laBuoc3).catch(() => {});
          const ghi3 = await ghiNhan(tab, 'b3');
          ok('RÀ SOÁT 14/11 (vòng hai): bấm Đăng xuất rồi Quay lại — trình duyệt xin lại trang từ máy chủ thay vì chỉ lấy từ bộ nhớ',
             coBfcache && daXin === true, `máy chủ nhận sau khi lùi: ${JSON.stringify(yeuCau.slice(moc3))}`);
          ok('RÀ SOÁT 14/11 (vòng ba): bản hiện lại từ bộ nhớ là bản ĐÃ GIẤU — trước khi đoạn mã của trang kịp chạy — và vẫn bị giấu suốt lúc chờ máy chủ trả lời',
             ghi3.hien === 'hidden' && ghi3.cho === 'hidden', JSON.stringify(ghi3));
          const dauSau3 = await dauTrongTrang(tab);
          ok('…máy chủ trả lời xong: trang cũ được thay bằng trang MỚI từ máy chủ (mang dấu phiên hiện tại)',
             (await conTaiLieuCu(tab)) === false && tab.url().includes('buoc=3') && dauSau3.soThe === 1 && dauSau3.inVao === dauSau3.cookie,
             `${tab.url()} · ${JSON.stringify(dauSau3)}`);

          // Đăng xuất ở TAB KHÁC; tab này đang mở một trang tải từ trước, rời trang rồi Quay lại.
          const tabKia = await ctxLui.newPage();
          const yeuCauKia = dieuHuong(tabKia);
          await tabKia.goto(goc + '/noi-bo/dang-nhap?buoc=4'); await danhDau(tabKia, 'b4');
          await tab.goto(goc + '/noi-bo/dang-nhap?buoc=5'); await dungFormDangXuat(tab);
          await bamDangXuat(tab, 'buoc=5');
          await tabKia.goto(goc + '/noi-bo/dang-nhap?buoc=6');
          const roiKia = await ghiNhan(tabKia, 'b4');
          const tabKhac = await lui(tabKia, yeuCauKia, 'buoc=4', true);
          const ghi4 = await ghiNhan(tabKia, 'b4');
          ok('RÀ SOÁT 14/11 (vòng hai): đăng xuất ở tab khác, tab này rời trang rồi Quay lại — trang cũ bị giấu lúc rời, hiện lại là bản đã giấu, và được xin lại từ máy chủ',
             coBfcache && roiKia.roi === 'hidden' && ghi4.hien === 'hidden' && tabKhac.taiLai && tabKhac.taiLieuCu === false && tabKhac.dauKhop,
             `lúc rời: ${JSON.stringify(roiKia)} · lúc hiện lại: ${JSON.stringify(ghi4)} · còn tài liệu cũ: ${tabKhac.taiLieuCu} · dấu khớp: ${tabKhac.dauKhop} · máy chủ nhận sau khi lùi: ${tabKhac.nhan}`);

          // Trang ĐÃ NẰM trong bộ nhớ quay lại lúc tab khác đăng xuất (nó rời đi khi dấu chưa đổi). Hai lớp cùng lo:
          // Clear-Site-Data của trả lời đăng xuất gỡ nó khỏi bộ nhớ; còn sót thì nó nằm đó ở dạng ĐÃ GIẤU và đoạn mã của
          // trang xin lại nó lúc hiện ra. Đằng nào thì bấm Quay lại cũng phải hỏi lại máy chủ. Cảnh này một mình
          // Clear-Site-Data cũng làm xanh được — lớp thứ hai được thử riêng ở khối "TRÌNH DUYỆT KHÔNG NGHE LỆNH" bên dưới.
          await tabKia.goto(goc + '/noi-bo/dang-nhap?buoc=9'); await danhDau(tabKia, 'b9');
          await tabKia.goto(goc + '/noi-bo/dang-nhap?buoc=10');
          const roi9 = await ghiNhan(tabKia, 'b9');
          await tab.goto(goc + '/noi-bo/dang-nhap?buoc=11'); await dungFormDangXuat(tab);
          await bamDangXuat(tab, 'buoc=11');
          const daNam = await lui(tabKia, yeuCauKia, 'buoc=9', true);
          ok('Trang đã nằm trong bộ nhớ quay lại lúc tab khác đăng xuất (rời đi khi dấu chưa đổi — vẫn được giấu lúc rời) → Quay lại: trình duyệt hỏi lại máy chủ, không hiện bản cũ',
             coBfcache && roi9.roi === 'hidden' && daNam.taiLai && daNam.taiLieuCu === false && daNam.dauKhop,
             `lúc rời: ${JSON.stringify(roi9)} · còn tài liệu cũ: ${daNam.taiLieuCu} · dấu khớp: ${daNam.dauKhop} · máy chủ nhận sau khi lùi: ${daNam.nhan}`);

          // BẢN LƯU ĐỆM CŨ. Bấm Quay lại mà trình duyệt DỰNG LẠI trang từ bản HTML nó giữ — không hỏi máy chủ, không phải
          // bfcache. Chromium xóa bản đó khi nhận Clear-Site-Data của trả lời đăng xuất; trình duyệt không nghe lệnh ấy
          // thì còn. Ở đây đóng vai trình duyệt như vậy: lượt xin trang ĐẦU sau khi lùi được trả bằng đúng bản HTML cũ
          // (mang dấu cũ), các lượt sau đi tới máy chủ thật. Cảnh này chỉ có nghĩa khi lùi về trang là một lượt DỰNG LẠI
          // (kiểu "back_forward"), không phải lấy nguyên trang từ bfcache: trang được mở một kết nối WebRTC và gắn một
          // tai nghe unload — hai thứ làm Chromium không cất trang vào bfcache — và phép kiểm bên dưới TỰ XÁC NHẬN điều
          // đó bằng chuỗi kiểu tải trình duyệt báo (giữ một Web Lock thì không đủ: đã thử, trang vẫn vào bfcache).
          await tab.goto(goc + '/noi-bo/dang-nhap?buoc=12');
          const banCu = await coHan(tab.content());
          await trongTrang(tab, () => {
            try { window.__ketNoiThu = new RTCPeerConnection(); window.__ketNoiThu.createDataChannel('thu'); } catch { /* không có WebRTC */ }
            window.addEventListener('unload', () => {});
          });
          await tab.goto(goc + '/noi-bo/dang-nhap?buoc=13');
          await tabKia.goto(goc + '/noi-bo/dang-nhap?buoc=14'); await dungFormDangXuat(tabKia);
          await bamDangXuat(tabKia, 'buoc=14');
          let luotThu = 0;
          const laBuoc12 = u => u.search.includes('buoc=12');
          await tab.route(laBuoc12, async tuyen => {
            luotThu += 1;
            if (luotThu === 1 && typeof banCu === 'string') await tuyen.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: banCu }).catch(() => {});
            else await tuyen.continue().catch(() => {});
          });
          const moc12 = yeuCau.length;
          const luot12 = () => yeuCau.slice(moc12).filter(y => y.includes('buoc=12')).length;
          await trongTrang(tab, () => { history.back(); });
          await choDen(() => luot12() >= 2);
          await tab.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
          await nghi(1000);   // một vòng xin lại lặp, nếu có, lộ ra trong một giây này
          await tab.unroute(laBuoc12).catch(() => {});
          const dau12 = await dauTrongTrang(tab);
          const ghi12 = await ghiNhan(tab, 'b12');
          ok('Đối chứng của cảnh "bản lưu đệm cũ": lùi về trang là một lượt DỰNG LẠI (kiểu back_forward), không phải bfcache; lượt xin lại sau đó là một lượt mở thường, không phải reload',
             ghi12.kieu === 'navigate,back_forward,navigate,', JSON.stringify(ghi12));
          ok('RÀ SOÁT 14/11 (vòng ba): bấm Quay lại mà trình duyệt đưa ra BẢN LƯU ĐỆM CŨ của trang → thân trang của bản đó không bao giờ được dựng, và trang được xin lại đúng một lần',
             typeof banCu === 'string' && luot12() === 2 && ghi12.giau === 'chua-co-than', `${luot12()} lượt xin trang · ${JSON.stringify(ghi12)}`);
          ok('…trang cuối cùng là bản mới từ máy chủ: mang đúng dấu trình duyệt đang giữ, không bị giấu',
             dau12.soThe === 1 && dau12.inVao === dau12.cookie && /^[0-9a-f-]{36}$/.test(dau12.cookie ?? '')
             && (await trongTrang(tab, () => document.documentElement.style.visibility)) === '', JSON.stringify(dau12));

          // ĐỊA CHỈ VIẾT KHÁC (vòng bốn 14/11). //noi-bo/… và /noi%2Dbo/… vẫn ra trang nội bộ, nhưng trình duyệt so Path của
          // cookie với đường dẫn THÔ: cookie dấu đặt Path=/noi-bo thì ở đó cả máy chủ lẫn đoạn mã đều đọc ra chuỗi rỗng,
          // luôn "khớp", và bấm Đăng xuất ở một trang như vậy rồi Quay lại là thấy lại nó. Cookie dấu nay có Path=/.
          for (const duongKhac of ['//noi-bo/dang-nhap?buoc=31', '/noi%2Dbo/dang-nhap?buoc=32']) {
            const traLoiKhac = await tab.goto(goc + duongKhac);
            const dauKhac = await dauTrongTrang(tab);
            ok(`RÀ SOÁT 14/11 (vòng bốn): ${duongKhac} — trang nội bộ mở qua địa chỉ viết khác vẫn thấy dấu phiên: máy chủ in đúng dấu trình duyệt đang giữ`,
               traLoiKhac?.status() === 200 && dauKhac.soThe === 1 && /^[0-9a-f-]{36}$/.test(dauKhac.cookie ?? '') && dauKhac.inVao === dauKhac.cookie,
               `HTTP ${traLoiKhac?.status()} · ${JSON.stringify(dauKhac)}`);
          }
          // …và nút Đăng xuất bấm ở một trang như vậy cũng giấu trang lúc rời, Quay lại là xin lại máy chủ. Địa chỉ ở đây
          // còn có phần sau dấu #: xin lại mà giữ phần đó thì trình duyệt coi là cuộn trong trang, không hỏi máy chủ, và
          // trang nằm lại ở trạng thái bị giấu; ghép "đường dẫn + tham số" thì //noi-bo/… thành địa chỉ của máy chủ khác.
          await tab.goto(goc + '//noi-bo/dang-nhap?buoc=33#cuoi-trang'); await danhDau(tab, 'b33'); await dungFormDangXuat(tab);
          await bamDangXuat(tab, 'buoc=33');
          const roi33 = await ghiNhan(tab, 'b33');
          const lui33 = await lui(tab, yeuCau, 'buoc=33', true);
          const sau33 = new URL(tab.url());
          ok('RÀ SOÁT 14/11 (vòng bốn): bấm Đăng xuất ở trang mở qua //noi-bo/…#… rồi Quay lại → trang bị giấu lúc rời và được xin lại từ CHÍNH máy chủ này (đúng tên miền, đúng đường dẫn), không nằm lại ở trạng thái bị giấu',
             roi33.roi === 'hidden' && lui33.taiLai && lui33.taiLieuCu === false && lui33.dauKhop
             && sau33.origin === goc && sau33.pathname === '//noi-bo/dang-nhap' && sau33.search === '?buoc=33'
             && (await trongTrang(tab, () => document.documentElement.style.visibility)) === '',
             `${tab.url()} · lúc rời: ${JSON.stringify(roi33)} · còn tài liệu cũ: ${lui33.taiLieuCu} · dấu khớp: ${lui33.dauKhop} · máy chủ nhận: ${lui33.nhan}`);

          // Trang tải SAU lần đăng xuất (như sau khi đăng nhập lại): Quay lại bình thường vẫn giữ nguyên trang —
          // bấm nhầm một link rồi quay lại, chữ đang gõ dở không mất.
          await tab.goto(goc + '/noi-bo/dang-nhap?buoc=7'); await danhDau(tab, 'b7');
          // Bản build này không có database nên trang đăng nhập không có ô nhập nào: dựng một ô rồi GÕ vào nó.
          await trongTrang(tab, () => { const o = document.createElement('input'); o.id = 'thu-o-dang-go'; document.body.appendChild(o); });
          await coHan(tab.fill('#thu-o-dang-go', 'chữ đang gõ dở'));
          await tab.goto(goc + '/noi-bo/dang-nhap?buoc=8');
          const sauDo = await lui(tab, yeuCau, 'buoc=7', false);
          const ghi7 = await ghiNhan(tab, 'b7');
          const chuDangGo = await trongTrang(tab, () => document.getElementById('thu-o-dang-go')?.value ?? null);
          ok('Trang tải sau lần đăng xuất: Quay lại bình thường vẫn hiện đúng trang cũ — không bị xin lại, không nằm lại ở trạng thái bị giấu, chữ đang gõ dở còn nguyên',
             sauDo.veDung && sauDo.taiLieuCu === true && !sauDo.taiLai && ghi7.roi === 'hidden' && ghi7.hien === 'hidden' && ghi7.cho === 'hien'
             && (await trongTrang(tab, () => document.documentElement.style.visibility)) === '' && chuDangGo === 'chữ đang gõ dở',
             `${tab.url()} · còn tài liệu cũ: ${sauDo.taiLieuCu} · ${JSON.stringify(ghi7)} · ô đang gõ: «${chuDangGo}» · máy chủ nhận: ${sauDo.nhan}`);
          await coHan(ctxLui.close(), 10_000);
        };
        // KHUNG HÌNH KHI BẤM QUAY LẠI (vòng bốn 14/11, đo bằng quay màn hình — CDP Page.startScreencast). Các phép kiểm ở
        // trên đọc trạng thái của trang (style.visibility); chúng không thấy điều người dùng thấy. Chromium đưa một trang
        // ra từ bộ nhớ quay lại bằng KHUNG HÌNH CUỐI nó đã vẽ cho trang đó, trước khi kịp dựng lại trang: trang chỉ giấu
        // lúc rời đi (pagehide) thì không còn lượt vẽ nào sau đó, và một khung hình của trang cũ vẫn hiện ra (đo được 6/8
        // lần bấm Quay lại sau khi đăng xuất). Trang cũ ở đây được phủ một ô XANH DƯƠNG kín màn hình trước khi rời;
        // khung hình nào có màu xanh đó là khung hình trang cũ được vẽ ra.
        const thuKhungHinh = async () => {
          const doMau = await (await coBoNho.newContext()).newPage();   // trang phụ: giải mã từng khung hình để đếm màu
          const tiLeXanh = anh => coHan(doMau.evaluate(async duLieu => {
            const hinh = new Image();
            hinh.src = 'data:image/jpeg;base64,' + duLieu;
            await hinh.decode();
            const giay = document.createElement('canvas');
            giay.width = hinh.width; giay.height = hinh.height;
            const but = giay.getContext('2d');
            but.drawImage(hinh, 0, 0);
            const diem = but.getImageData(0, 0, giay.width, giay.height).data;
            let xanh = 0;
            for (let i = 0; i < diem.length; i += 4) if (diem[i + 2] > 170 && diem[i] < 100 && diem[i + 1] < 100) xanh += 1;
            return xanh / (diem.length / 4);
          }, anh), 10_000);

          /**
           * Một cảnh. cach: 'khong-ai'   — không ai đăng xuất (đối chứng);
           *                 'tai-cho'    — bấm Đăng xuất NGAY trên trang đó (trả lời về sau 300 ms, như mạng thật);
           *                 'tab-khac'   — trang rời đi trước, tab khác đăng xuất, và lệnh Clear-Site-Data bị gỡ khỏi trả lời
           *                                (đóng vai trình duyệt không nghe lệnh đó — Chromium thì gỡ hẳn các trang này).
           */
          const quayLai = async cach => {
            const ctxK = await coBoNho.newContext({ viewport: { width: 800, height: 600 } });
            await phongChuTaiCho(ctxK);
            const lenhDaGo = [];
            await ctxK.route(u => u.pathname === '/noi-bo/dang-xuat', async tuyen => {
              if (cach === 'tab-khac') {
                const traLoi = await tuyen.fetch({ maxRedirects: 0 });
                const dau = { ...traLoi.headers() };
                lenhDaGo.push(dau['clear-site-data'] ?? null);
                delete dau['clear-site-data'];
                await tuyen.fulfill({ response: traLoi, headers: dau });
              } else {
                await nghi(300);
                await tuyen.continue().catch(() => {});
              }
            });
            // Gắn trước mọi mã của trang: ghi trang đang giấu hay hiện ở ĐÚNG lúc trình duyệt đưa nó ra từ bộ nhớ — sự
            // kiện đến trước giữa visibilitychange và pageshow (Chromium báo visibilitychange trước).
            await ctxK.addInitScript(() => {
              let daRoi = false;
              window.addEventListener('pagehide', () => { daRoi = true; });
              const ghi = () => {
                if (!daRoi) return;
                daRoi = false;
                sessionStorage.setItem('thu:luc-ve', document.documentElement.style.visibility || 'hien');
              };
              document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ghi(); });
              window.addEventListener('pageshow', suKien => { if (suKien.persisted) ghi(); });
            });
            const tabB = await ctxK.newPage();
            const xin = [];
            tabB.on('request', r => { if (r.isNavigationRequest()) xin.push(new URL(r.url()).search); });
            await tabB.goto(goc + '/noi-bo/dang-nhap?buoc=41');
            await trongTrang(tabB, () => {
              window.__taiLieuCu = true;
              const o = document.createElement('div');
              o.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgb(0,0,255)';
              document.body.appendChild(o);
            });
            if (cach === 'tai-cho') {
              await dungFormDangXuat(tabB);
              await coHan(tabB.$eval('#thu-dang-xuat', nut => { nut.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647'; }));
              await nghi(150);
              await bamDangXuat(tabB, 'buoc=41');
            } else {
              await nghi(150);
              await tabB.goto(goc + '/noi-bo/dang-nhap?buoc=42');
              if (cach === 'tab-khac') {
                const tabA = await ctxK.newPage();
                await tabA.goto(goc + '/noi-bo/dang-nhap?buoc=43'); await dungFormDangXuat(tabA);
                await bamDangXuat(tabA, 'buoc=43');
                await tabB.bringToFront();
              }
            }
            const cdp = await ctxK.newCDPSession(tabB);
            const khung = [];
            cdp.on('Page.screencastFrame', k => {
              khung.push({ luc: Date.now(), anh: k.data });
              cdp.send('Page.screencastFrameAck', { sessionId: k.sessionId }).catch(() => {});
            });
            await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 40, everyNthFrame: 1 });
            await nghi(300);
            const moc = xin.length;
            const luc0 = Date.now();
            await trongTrang(tabB, () => { setTimeout(() => history.back(), 30); });
            await choDen(() => tabB.url().includes('buoc=41'));
            const xinLai = () => xin.slice(moc).some(y => y.includes('buoc=41'));
            if (cach !== 'khong-ai') {
              await choDen(xinLai);
              await tabB.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
              await choDen(async () => (await trongTrang(tabB, () => window.__taiLieuCu === true)) === false);
            }
            await nghi(1200);   // đủ để mọi khung hình của lần hiện lại được gửi về
            await cdp.send('Page.stopScreencast').catch(() => {});
            const xanh = [];
            for (const k of khung.filter(k => k.luc >= luc0)) xanh.push({ ms: k.luc - luc0, xanh: Math.round((await tiLeXanh(k.anh) ?? -1) * 100) / 100 });
            const sau = (await trongTrang(tabB, () => ({
              lucVe: sessionStorage.getItem('thu:luc-ve'), conCu: window.__taiLieuCu === true, giau: document.documentElement.style.visibility,
            }))) ?? { khongDocDuoc: true };
            const dauSau = await dauTrongTrang(tabB);
            await coHan(ctxK.close(), 10_000);
            return { lenhDaGo, xinLai: xinLai(), nhan: JSON.stringify(xin.slice(moc)), khung: xanh, coXanh: xanh.filter(k => k.xanh > 0.5).length,
                     khongDoDuoc: xanh.filter(k => k.xanh < 0).length, ...sau, dauKhop: dauSau.soThe === 1 && dauSau.inVao === dauSau.cookie };
          };
          const tomKhung = kq => `${JSON.stringify({ ...kq, khung: undefined })} · khung hình: ${JSON.stringify(kq.khung.slice(0, 12))}`;

          const doiChungKhung = await quayLai('khong-ai');
          ok('Đối chứng của phép đo khung hình: không ai đăng xuất → Quay lại đưa trang cũ ra từ bộ nhớ (trạng thái đã giấu) rồi trang HIỆN LẠI — quay màn hình THẤY ô xanh của nó; máy chủ không bị hỏi',
             doiChungKhung.lucVe === 'hidden' && doiChungKhung.conCu === true && doiChungKhung.giau === '' && !doiChungKhung.xinLai
             && doiChungKhung.coXanh >= 1 && doiChungKhung.khongDoDuoc === 0, tomKhung(doiChungKhung));
          const taiCho = await quayLai('tai-cho');
          ok('Đối chứng: trang vừa bấm Đăng xuất thật sự nằm trong bộ nhớ quay lại — bấm Quay lại là trình duyệt đưa chính nó ra (không phải dựng lại)',
             taiCho.lucVe !== null && taiCho.lucVe !== undefined, tomKhung(taiCho));
          ok('RÀ SOÁT 14/11 (vòng bốn): bấm Đăng xuất rồi Quay lại → KHÔNG khung hình nào của trang cũ được vẽ ra (đo bằng quay màn hình — trang đã giấu từ lúc bấm nút)',
             taiCho.lucVe === 'hidden' && taiCho.coXanh === 0 && taiCho.khongDoDuoc === 0 && taiCho.khung.length >= 1, tomKhung(taiCho));
          ok('…và trang đó được xin lại từ máy chủ: trang cuối là bản mới, mang đúng dấu trình duyệt đang giữ, không bị giấu',
             taiCho.xinLai && taiCho.conCu === false && taiCho.dauKhop && taiCho.giau === '', `máy chủ nhận: ${taiCho.nhan} · ${tomKhung(taiCho)}`);

          // TRÌNH DUYỆT KHÔNG NGHE LỆNH Clear-Site-Data. Chromium gỡ mọi trang của khu này khỏi bộ nhớ quay lại khi nhận lệnh
          // đó (mọi trả lời kết thúc một phiên đều mang nó), nên ở Chromium trang rời đi TRƯỚC lần đăng xuất không bao giờ
          // được đưa ra lại — và phép kiểm "trang đã nằm trong bộ nhớ" ở trên xanh cả khi đoạn mã rỗng. Ở đây lệnh bị gỡ
          // (đóng vai trình duyệt không nghe lệnh): trang cất từ trước vẫn nằm trong bộ nhớ. Điều mã bảo đảm: trang đó được
          // cất ở trạng thái ĐÃ GIẤU (giấu ở mọi lần rời trang) và được xin lại, không tự hiện lại. Điều mã KHÔNG bảo đảm
          // được: Chromium có thể vẫn vẽ khung hình cuối của nó một lần (đo được 4/8) — không có lượt vẽ nào giữa lúc trang
          // biết mình rời đi và lúc trang bị cất. Trình duyệt dựng lại trang từ trạng thái đã cất thì không vẽ gì.
          const daCat = await quayLai('tab-khac');
          ok('Đối chứng: lệnh Clear-Site-Data đã bị gỡ khỏi trả lời đăng xuất, và trang cũ VẪN nằm trong bộ nhớ quay lại — bấm Quay lại là trình duyệt đưa chính bản đó ra',
             daCat.lenhDaGo.length === 1 && daCat.lenhDaGo[0] === '"cache"' && daCat.lucVe !== null && daCat.lucVe !== undefined, tomKhung(daCat));
          ok('RÀ SOÁT 14/11 (vòng bốn): trang cất vào bộ nhớ TRƯỚC lần đăng xuất, trình duyệt không nghe Clear-Site-Data → trang đó được cất ở trạng thái ĐÃ GIẤU, không tự hiện lại, và được xin lại từ máy chủ: trang cuối là bản mới',
             daCat.lucVe === 'hidden' && daCat.xinLai && daCat.conCu === false && daCat.dauKhop && daCat.giau === '', `máy chủ nhận: ${daCat.nhan} · ${tomKhung(daCat)}`);

          // TRANG KHÔNG RỜI ĐI THÌ KHÔNG BỊ GIẤU. Đoạn mã giấu trang ở mọi lần rời (pagehide). Những việc trông như rời
          // trang mà trang vẫn ở lại — tải một file, trả lời không có nội dung (204), link gọi điện, link mở tab mới, đổi
          // sang tab khác — không được làm trang biến mất: sau đó không có lần "hiện lại" nào để đoạn mã cho hiện.
          const ctxO = await coBoNho.newContext({ acceptDownloads: true });
          await phongChuTaiCho(ctxO);
          const daNhan = [];
          await ctxO.route(u => u.pathname === '/noi-bo/thu-tai-file', tuyen => {
            daNhan.push(`${tuyen.request().method()} tai-file`);
            return tuyen.fulfill({ status: 200, headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="thu.csv"' }, body: 'a,b\n1,2\n' });
          });
          await ctxO.route(u => u.pathname === '/noi-bo/thu-204', tuyen => { daNhan.push(`${tuyen.request().method()} 204`); return tuyen.fulfill({ status: 204, body: '' }); });
          const oLai = [];
          for (const [ten, chon, bangChung] of [
            ['bấm link tải file', '#thu-tai', kq => kq.taiVe.join() === 'thu.csv' && kq.nhan.join() === 'GET tai-file'],
            ['gửi form mà trả lời là một file tải về', '#thu-form-tai button', kq => kq.taiVe.join() === 'thu.csv' && kq.nhan.join() === 'POST tai-file'],
            ['bấm link mà máy chủ trả lời 204 (không có nội dung)', '#thu-204', kq => kq.nhan.join() === 'GET 204'],
            ['bấm link gọi điện (tel:)', '#thu-goi', kq => kq.suKien.includes('click:thu-goi')],
            ['bấm link mở tab mới', '#thu-tab-moi', kq => kq.tabMoi === 1],
          ]) {
            const t = await ctxO.newPage();   // mỗi cảnh một tab: sau link tel:, tab đó không còn nhận cú bấm nào nữa
            await t.goto(goc + '/noi-bo/dang-nhap?buoc=5' + oLai.length);
            await trongTrang(t, () => {
              window.__taiLieuCu = true; window.__soLanRoi = 0; window.__suKien = [];
              window.addEventListener('pagehide', () => { window.__soLanRoi += 1; });
              window.addEventListener('click', suKien => { window.__suKien.push('click:' + (suKien.target.id || suKien.target.closest('[id]')?.id)); }, true);
              const them = (id, html) => {
                const khoi = document.createElement('p');
                khoi.style.cssText = 'position:relative;z-index:99999;margin:8px;background:#fff';
                khoi.innerHTML = html;
                khoi.firstElementChild.id = id;
                document.body.insertBefore(khoi, document.body.firstChild);
              };
              them('thu-tai', '<a href="/noi-bo/thu-tai-file">tải file</a>');
              them('thu-form-tai', '<form method="POST" action="/noi-bo/thu-tai-file"><button>gửi form tải file</button></form>');
              them('thu-204', '<a href="/noi-bo/thu-204">không có nội dung</a>');
              them('thu-goi', '<a href="tel:0900000000">gọi</a>');
              them('thu-tab-moi', '<a href="/noi-bo/dang-nhap?buoc=59" target="_blank" rel="noopener">tab mới</a>');
            });
            daNhan.length = 0;
            const taiVe = [];
            t.on('download', d => taiVe.push(d.suggestedFilename()));
            const soTab = ctxO.pages().length;
            await coHan(t.click(chon, { timeout: 3000, noWaitAfter: true }));
            await nghi(900);
            const trong = (await trongTrang(t, () => ({ giau: document.documentElement.style.visibility, conCu: window.__taiLieuCu === true, roi: window.__soLanRoi, suKien: window.__suKien }))) ?? {};
            const kq = { ...trong, taiVe, nhan: [...daNhan], tabMoi: ctxO.pages().length - soTab };
            oLai.push({ ten, dat: kq.giau === '' && kq.conCu === true && kq.roi === 0 && bangChung({ suKien: [], ...kq }) === true, kq });
            await coHan(t.close(), 5000);
          }
          // Đổi sang tab khác rồi quay lại: trang bị che (visibilitychange) chứ không rời đi.
          const tDoi = await ctxO.newPage();
          await tDoi.goto(goc + '/noi-bo/dang-nhap?buoc=57');
          await trongTrang(tDoi, () => { window.__taiLieuCu = true; window.__soLanRoi = 0; window.__biChe = 0; window.addEventListener('pagehide', () => { window.__soLanRoi += 1; }); document.addEventListener('visibilitychange', () => { if (document.hidden) window.__biChe += 1; }); });
          const tKia = await ctxO.newPage();
          await tKia.goto(goc + '/noi-bo/dang-nhap?buoc=58'); await tKia.bringToFront(); await nghi(400);
          await tDoi.bringToFront(); await nghi(300);
          const doiTab = (await trongTrang(tDoi, () => ({ giau: document.documentElement.style.visibility, conCu: window.__taiLieuCu === true, roi: window.__soLanRoi, biChe: window.__biChe }))) ?? {};
          oLai.push({ ten: 'đổi sang tab khác rồi quay lại', dat: doiTab.giau === '' && doiTab.conCu === true && doiTab.roi === 0, kq: doiTab });
          await coHan(ctxO.close(), 10_000);
          for (const canh of oLai) {
            ok(`RÀ SOÁT 14/11 (vòng bốn): ${canh.ten} — trang không rời đi nên không bị giấu (việc đó có xảy ra thật, trang vẫn là trang cũ, không có lần rời nào)`,
               canh.dat, JSON.stringify(canh.kq));
          }
        };
        // Hạn cho cả khối: một lời gọi nào đó của trình duyệt không trả lời thì khối này đỏ sau 3 phút, không treo cả
        // bộ thử (và cả việc CI) tới khi bị hủy.
        try {
          await chayCoHan('Khối thử nút Quay lại', thuNutQuayLai);
          await chayCoHan('Khối thử khung hình khi Quay lại và trang không rời đi', thuKhungHinh, 150_000);
        } finally {
          await coHan(coBoNho.close(), 10_000);
        }
      }

      // TRANG KẾT QUẢ CỦA MỘT LẦN GỬI FORM KHÔNG BỊ GỬI LẠI (vòng bốn 14/11 — lỗi mức cao của chính bản trước). Trang nội bộ
      // báo lỗi của một lần gửi form ngay tại chỗ, trong trả lời của POST (trừ form đăng nhập từ đợt sửa lịch sử của nó —
      // cảnh "ĐĂNG NHẬP KHÔNG THÀNH" ngay dưới; trang kết quả ở đây vì vậy do batTrungGianPost dựng). Bấm Quay lại, Chromium
      // dựng lại trang đó từ bản lưu đệm HTTP (không phải bfcache, không hỏi máy chủ). Bản trước của đoạn mã thấy dấu
      // phiên đã đổi thì gọi location.reload() — và reload do MÃ gọi làm trình duyệt GỬI LẠI form mà không hỏi: đo được
      // một lần ghi dưới quyền người đăng nhập sau, và một lần đăng nhập lại dưới tên người trước. Nay đoạn mã xin lại
      // trang bằng một lượt GET.
      //
      // Trình duyệt ở đây mở TRẦN, không qua moChromium: route của Playwright tắt bộ đệm HTTP, mà cảnh này cần đúng bộ
      // đệm đó (trang nội bộ không nạp Meta Pixel nên không có gì phải chặn). Vì không có route, mọi lượt xin tài liệu
      // được đo ở tầng mạng qua CDP: phương thức, và có lấy từ bộ đệm hay đi ra mạng. Dấu phiên được đổi bằng cách đặt
      // thẳng cookie — như khi phiên kết thúc mà bản lưu đệm không bị xóa (trình duyệt không nghe Clear-Site-Data).
      let khongChan = null;
      try {
        khongChan = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'] });
      } catch (e) {
        ok('Mở được Chromium bản đầy đủ (không chặn mạng) để thử trang kết quả gửi form', false, String(e.message).split('\n')[0]);
      }
      if (khongChan) {
        /**
         * Máy chủ nhỏ đứng trước Worker cho cảnh "trang kết quả gửi form": GET chuyển nguyên cho Worker; POST trả CHÍNH
         * trang Worker dựng cho địa chỉ đó, HTTP 200 — đúng hình dạng trang kết quả của các form nội bộ còn báo lỗi tại
         * chỗ. Cảnh này trước dùng thẳng form đăng nhập (trang duy nhất mở được khi chưa có database); nay lượt POST của
         * trang đó luôn trả 303, còn các form khác thì cần đăng nhập. Mã của trang, kể cả đoạn mã cần thử, vẫn là của bản
         * build; cookie không phân biệt cổng, nên dấu phiên trình duyệt giữ cho Worker cũng là dấu của máy chủ này.
         */
        const batTrungGianPost = async () => {
          const { createServer } = await import('node:http');
          const may = createServer(async (req, res) => {
            try {
              req.resume();
              await new Promise(xong => req.on('end', xong));   // bỏ thân form: máy chủ thật dựng lại trang, không ghi gì
              const tl = await fetch(goc + req.url, { redirect: 'manual', headers: req.headers.cookie ? { cookie: req.headers.cookie } : {} });
              const dau = {};
              tl.headers.forEach((v, k) => { if (!/^(content-encoding|content-length|transfer-encoding|connection|keep-alive|set-cookie)$/.test(k)) dau[k] = v; });
              const datCookie = tl.headers.getSetCookie();
              if (datCookie.length) dau['set-cookie'] = datCookie;
              res.writeHead(tl.status, dau);
              res.end(Buffer.from(await tl.arrayBuffer()));
            } catch (e) { res.writeHead(502); res.end(String(e?.message ?? e)); }
          });
          await new Promise(xong => may.listen(0, '127.0.0.1', xong));
          return { goc: `http://127.0.0.1:${may.address().port}`, dong: () => new Promise(xong => { may.closeAllConnections?.(); may.close(() => xong()); }) };
        };
        const thuGuiLaiForm = async () => {
          const trungGian = await batTrungGianPost();
          try { await thuGuiLaiFormQua(trungGian.goc); } finally { await coHan(trungGian.dong(), 5000); }
        };
        const thuGuiLaiFormQua = async gocForm => {
          const ctxForm = await khongChan.newContext();
          const tabForm = await ctxForm.newPage();
          const cdp = await ctxForm.newCDPSession(tabForm);
          await cdp.send('Network.enable');
          const luot = new Map();   // requestId → { cach, duong, tuDem } của mọi lượt xin TÀI LIỆU
          cdp.on('Network.requestWillBeSent', e => {
            if (e.type === 'Document') luot.set(e.requestId, { cach: e.request.method, duong: new URL(e.request.url).pathname + new URL(e.request.url).search, tuDem: false });
          });
          cdp.on('Network.responseReceived', e => { const l = luot.get(e.requestId); if (l && e.response.fromDiskCache === true) l.tuDem = true; });
          cdp.on('Network.requestServedFromCache', e => { const l = luot.get(e.requestId); if (l) l.tuDem = true; });
          const hopThoai = [];
          tabForm.on('dialog', d => { hopThoai.push(d.message()); d.dismiss().catch(() => {}); });
          const tom = ds => JSON.stringify(ds.map(l => `${l.cach} ${l.duong}${l.tuDem ? ' (từ bộ đệm)' : ''}`));

          await tabForm.goto(gocForm + '/noi-bo/dang-nhap?buoc=20');
          // Một form POST về chính địa chỉ này: máy chủ dựng trang kết quả tại chỗ (HTTP 200), như các form nội bộ báo lỗi.
          await trongTrang(tabForm, () => {
            const f = document.createElement('form');
            f.method = 'POST';
            f.innerHTML = '<input name="email" value=""><input name="mat_khau" value=""><button type="submit" id="thu-gui">Gửi</button>';
            document.body.appendChild(f);
          });
          await Promise.all([tabForm.waitForNavigation({ timeout: 15_000 }), tabForm.click('#thu-gui')]);
          await trongTrang(tabForm, () => { window.__ketQuaGuiForm = true; });
          const guiLanDau = [...luot.values()].filter(l => l.cach === 'POST' && !l.tuDem).length;
          await tabForm.goto(gocForm + '/noi-bo/dang-nhap?buoc=21');
          await ctxForm.addCookies([{ name: 'bt_dau_phien', value: crypto.randomUUID(), url: gocForm + '/' }]);
          luot.clear();
          await trongTrang(tabForm, () => { history.back(); });
          // Bản sửa: sau lượt dựng lại từ bộ đệm là một lượt GET ra mạng. Bản lỗi: là một lượt POST ra mạng — chờ lượt nào tới trước.
          await choDen(() => [...luot.values()].some(l => !l.tuDem));
          await tabForm.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
          await nghi(1000);   // một vòng xin lại lặp, nếu có, lộ ra trong một giây này
          const sau = [...luot.values()];
          const dungLaiTuDem = sau.filter(l => l.tuDem);
          const raMang = sau.filter(l => !l.tuDem);
          ok('Đối chứng của cảnh "trang kết quả gửi form": lần gửi đầu là đúng một lượt POST ra mạng; bấm Quay lại thì trình duyệt DỰNG LẠI trang đó từ bản lưu đệm, không hỏi máy chủ',
             guiLanDau === 1 && dungLaiTuDem.length === 1 && dungLaiTuDem[0].cach === 'POST' && dungLaiTuDem[0].duong.includes('buoc=20'), `gửi đầu: ${guiLanDau} · sau khi lùi: ${tom(sau)}`);
          ok('RÀ SOÁT 14/11 (vòng bốn): bấm Quay lại về trang KẾT QUẢ của một lần gửi form sau khi dấu phiên đổi → không lượt POST nào đi ra mạng (form không bị gửi lại), không hộp thoại nào',
             raMang.every(l => l.cach !== 'POST') && hopThoai.length === 0, `sau khi lùi: ${tom(sau)} · hộp thoại: ${JSON.stringify(hopThoai)}`);
          const dauForm = await dauTrongTrang(tabForm);
          ok('RÀ SOÁT 14/11 (vòng bốn): …trang được xin lại bằng đúng MỘT lượt GET, và trang cuối là bản mới từ máy chủ: mang đúng dấu trình duyệt đang giữ, không bị giấu',
             raMang.length === 1 && raMang[0].cach === 'GET' && raMang[0].duong === '/noi-bo/dang-nhap?buoc=20'
             && (await trongTrang(tabForm, () => window.__ketQuaGuiForm === true)) === false
             && dauForm.soThe === 1 && /^[0-9a-f-]{36}$/.test(dauForm.cookie ?? '') && dauForm.inVao === dauForm.cookie
             && (await trongTrang(tabForm, () => document.documentElement.style.visibility)) === '', `sau khi lùi: ${tom(sau)} · ${JSON.stringify(dauForm)}`);
          await coHan(ctxForm.close(), 10_000);
        };

        // ĐĂNG NHẬP KHÔNG THÀNH: LỊCH SỬ KHÔNG CÒN MỤC POST NÀO (rà soát vòng bốn của PR #188, đợt sửa trang đăng nhập).
        // Trang đăng nhập báo lỗi ngay trong trả lời của lượt gửi form thì mục lịch sử đó là một lượt POST giữ nguyên
        // thân form — email, mật khẩu: tải lại nó là gửi lại form. Nay lượt POST nào của trang cũng trả 303 về GET
        // /noi-bo/dang-nhap, câu lỗi đi qua cookie ngắn hạn (lib/phien.ts, guiFormDangNhap), và trang xóa ô mật khẩu lúc
        // rời đi. Bản build này không có database nên lần đăng nhập nào cũng không thành — đúng đường cần thử. Trang
        // không hiện form khi chưa có database: form được dựng ngay trên trang, giống form thật (cùng tên ô, POST,
        // không action — gửi về chính địa chỉ đang mở), rồi gõ và bấm như nhân viên. Cùng trình duyệt trần của cảnh
        // trên (bộ đệm HTTP, bfcache); mọi lượt xin — có thân hay không — đo ở tầng mạng qua CDP. Đăng nhập sai THẬT
        // (Supabase Auth giả, câu lỗi vi/en, email điền lại): thu-day-du.mjs nhóm 14.
        const DUONG_DN = '/noi-bo/dang-nhap';
        const EMAIL_THU = 'thu-lich-su@beeftown.test';
        const MK_THU = `Mk-${crypto.randomUUID().slice(0, 8)}-bi-mat`;
        /** Form giống form đăng nhập thật, dựng trên trang; `link`: thêm một link sang trang khác. */
        const dungFormDangNhap = (t, link) => trongTrang(t, l => {
          const f = document.createElement('form');
          f.method = 'POST';
          f.innerHTML = '<input type="email" name="email" required><input type="password" name="mat_khau" required>'
            + '<button type="submit" id="thu-dang-nhap">Đăng nhập</button>' + (l ? `<a id="thu-link" href="${l}">đi trang khác</a>` : '');
          document.body.appendChild(f);
        }, link);

        // Trả lời của máy chủ, đo thẳng bằng fetch của Node — không bộ cookie nào của trình duyệt xen vào.
        const thuTraLoiDangNhap = async () => {
          const r = await fetch(goc + DUONG_DN, {
            method: 'POST', redirect: 'manual',
            headers: { Origin: goc, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ email: EMAIL_THU, mat_khau: MK_THU }).toString(),
          });
          const than = await r.text();
          const loiDn = r.headers.getSetCookie().find(c => c.startsWith('bt_loi_dang_nhap=')) ?? '';
          ok('RÀ SOÁT VÒNG BỐN: POST /noi-bo/dang-nhap không đăng nhập được → 303 về đúng /noi-bo/dang-nhap, không dựng trang; địa chỉ không mang email hay mật khẩu',
             r.status === 303 && r.headers.get('location') === DUONG_DN && than === '', `HTTP ${r.status} → ${r.headers.get('location')} · thân ${than.length} byte`);
          ok('RÀ SOÁT VÒNG BỐN: …câu lỗi đi qua cookie bt_loi_dang_nhap — HttpOnly, Secure, SameSite=Lax, Path=/noi-bo/dang-nhap, Max-Age ≤ 60 — không mang mật khẩu',
             /;\s*HttpOnly(;|$)/i.test(loiDn) && /;\s*Secure(;|$)/i.test(loiDn) && /;\s*SameSite=Lax(;|$)/i.test(loiDn)
             && /;\s*Path=\/noi-bo\/dang-nhap(;|$)/i.test(loiDn) && Number(loiDn.match(/;\s*Max-Age=(\d+)/i)?.[1] ?? 999) <= 60
             && !loiDn.includes(MK_THU) && !decodeURIComponent(loiDn).includes(MK_THU), loiDn || '(không có cookie lỗi)');
          const cap = loiDn.split(';')[0];
          let giaTri = null;
          try { giaTri = JSON.parse(decodeURIComponent(cap.slice('bt_loi_dang_nhap='.length))); } catch { /* để null */ }
          ok('…cookie chỉ mang mã của câu (bản build không database: "chua_noi_database") và email đã gõ',
             giaTri?.ma === 'chua_noi_database' && giaTri?.email === EMAIL_THU && Object.keys(giaTri).sort().join() === 'email,ma', JSON.stringify(giaTri));
          const g = await fetch(goc + DUONG_DN, { redirect: 'manual', headers: cap ? { Cookie: cap } : {} });
          await g.text();
          const xoa = g.headers.getSetCookie().find(c => c.startsWith('bt_loi_dang_nhap=')) ?? '';
          ok('RÀ SOÁT VÒNG BỐN: lượt GET mang cookie đó: 200, Cache-Control: no-store (trang lỗi của một lần gửi không vào bộ đệm), cookie bị xóa đúng Path',
             g.status === 200 && /no-store/.test(g.headers.get('cache-control') ?? '') && /;\s*Path=\/noi-bo\/dang-nhap(;|$)/i.test(xoa)
             && (/;\s*Max-Age=0(;|$)/i.test(xoa) || /Expires=Thu, 01 Jan 1970/i.test(xoa)), `HTTP ${g.status} · cache-control: ${g.headers.get('cache-control')} · ${xoa}`);
          const g2 = await fetch(goc + DUONG_DN, { redirect: 'manual' });
          await g2.text();
          ok('…GET không cookie: trang đăng nhập thường — không no-store, không đụng cookie lỗi',
             g2.status === 200 && !/no-store/.test(g2.headers.get('cache-control') ?? '') && !g2.headers.getSetCookie().some(c => c.startsWith('bt_loi_dang_nhap=')),
             `cache-control: ${g2.headers.get('cache-control')}`);
        };

        // Trình duyệt: gõ, gửi, rồi F5, Quay lại / Tiến + F5, và đi tới TỪNG mục lịch sử rồi tải lại mục đó.
        const thuLichSuDangNhap = async () => {
          const ctxDn = await khongChan.newContext();
          const tabDn = await ctxDn.newPage();
          const cdpDn = await ctxDn.newCDPSession(tabDn);
          await cdpDn.send('Network.enable');
          const luotDn = [];   // MỌI lượt xin của trang: { id, cach, duong, loai, than, tuDem, ma, toi }
          cdpDn.on('Network.requestWillBeSent', e => {
            if (e.redirectResponse) {   // lượt chuyển hướng dùng lại requestId; redirectResponse là trả lời của lượt TRƯỚC
              const truoc = luotDn.findLast(l => l.id === e.requestId);
              if (truoc) { truoc.ma = e.redirectResponse.status; truoc.toi = e.redirectResponse.headers?.location ?? e.redirectResponse.headers?.Location; }
            }
            const u = new URL(e.request.url);
            luotDn.push({ id: e.requestId, cach: e.request.method, duong: u.pathname + u.search, loai: e.type, than: e.request.postData ?? '', tuDem: false });
          });
          cdpDn.on('Network.responseReceived', e => { const l = luotDn.findLast(x => x.id === e.requestId); if (l) { l.ma ??= e.response.status; if (e.response.fromDiskCache) l.tuDem = true; } });
          cdpDn.on('Network.requestServedFromCache', e => { const l = luotDn.findLast(x => x.id === e.requestId); if (l) l.tuDem = true; });
          const hopThoaiDn = [];
          tabDn.on('dialog', d => { hopThoaiDn.push(`${d.type()}: ${d.message()}`); d.dismiss().catch(() => {}); });
          const taiLieu = ds => ds.filter(l => l.loai === 'Document');
          const tomDn = ds => JSON.stringify(taiLieu(ds).map(l => `${l.cach} ${l.duong}${l.tuDem ? ' (từ bộ đệm)' : ''}${l.ma ? ` → ${l.ma}` : ''}`));
          const choYen = async () => { await tabDn.waitForLoadState('load', { timeout: 10_000 }).catch(() => {}); await nghi(700); };

          await tabDn.goto(goc + DUONG_DN + '?buoc=70');
          await dungFormDangNhap(tabDn);
          await tabDn.fill('input[name="email"]', EMAIL_THU);
          await tabDn.fill('input[name="mat_khau"]', MK_THU);
          const moc0 = luotDn.length;
          await Promise.all([tabDn.waitForNavigation({ timeout: 15_000 }), tabDn.click('#thu-dang-nhap')]);
          await choYen();
          const gui = taiLieu(luotDn.slice(moc0));
          const post = gui.filter(l => l.cach === 'POST');
          ok('Đối chứng: lần gửi là đúng MỘT lượt POST ra mạng, mang email và mật khẩu đã gõ (form thật sự được gửi)',
             post.length === 1 && !post[0].tuDem && post[0].than.includes(encodeURIComponent(EMAIL_THU)) && post[0].than.includes(MK_THU), tomDn(luotDn.slice(moc0)));
          ok('RÀ SOÁT VÒNG BỐN: …máy chủ trả 303 về /noi-bo/dang-nhap, trình duyệt xin trang đó bằng GET; địa chỉ đang mở không mang email, mật khẩu',
             post[0]?.ma === 303 && post[0]?.toi === DUONG_DN && gui.at(-1)?.cach === 'GET' && gui.at(-1)?.duong === DUONG_DN
             && tabDn.url() === goc + DUONG_DN, `${tomDn(luotDn.slice(moc0))} · ${tabDn.url()}`);
          ok('…trang đang hiện không chứa mật khẩu ở đâu cả', (await trongTrang(tabDn, mk => !document.documentElement.outerHTML.includes(mk), MK_THU)) === true);

          const lichSu = await cdpDn.send('Page.getNavigationHistory');
          const cacMuc = lichSu.entries.filter(m => m.url.startsWith(goc));
          const viTri = async () => (await cdpDn.send('Page.getNavigationHistory').catch(() => ({}))).currentIndex;
          const viTriSauGui = lichSu.currentIndex;
          const moc1 = luotDn.length;
          let soLanTaiLai = 0;
          // Chỉ đếm lần tải lại thật sự xong: hết giờ mà vẫn đếm thì phép đối chứng đạt dù có mục chưa được tải lại.
          const taiLai = async () => { if (await tabDn.reload({ waitUntil: 'load', timeout: 15_000 }).then(() => true, () => false)) soLanTaiLai++; await choYen(); };
          await taiLai();
          await trongTrang(tabDn, () => { history.back(); }); await choYen();
          const daLui = (await viTri()) === viTriSauGui - 1 && tabDn.url().includes('buoc=70');
          const sauLui = await trongTrang(tabDn, () => [...document.querySelectorAll('input[type="password"]')].map(o => o.value));
          await taiLai();
          await trongTrang(tabDn, () => { history.forward(); }); await choYen();
          const daTien = (await viTri()) === viTriSauGui;
          await taiLai();
          for (const muc of cacMuc) {
            await cdpDn.send('Page.navigateToHistoryEntry', { entryId: muc.id }).catch(() => {});
            await choYen();
            await taiLai();
          }
          const sau = luotDn.slice(moc1);
          const coMatKhau = sau.filter(l => l.than.includes(MK_THU) || l.than.includes(encodeURIComponent(MK_THU)));
          ok('Đối chứng: lịch sử có đủ hai mục (trang đã gõ, trang sau khi gửi); Quay lại và Tiến tới đúng từng mục; mỗi lần tải lại là một lượt xin trang',
             cacMuc.length === 2 && daLui && daTien && soLanTaiLai === 3 + cacMuc.length && taiLieu(sau).length >= soLanTaiLai,
             `${cacMuc.length} mục · lùi: ${daLui} · tiến: ${daTien} · tải lại ${soLanTaiLai} lần · ${tomDn(sau)}`);
          ok('RÀ SOÁT VÒNG BỐN: lịch sử không còn mục POST nào — F5, Quay lại / Tiến + F5, tải lại từng mục: không lượt POST nào đi ra (kể cả lấy từ bộ đệm), không hộp thoại "gửi lại biểu mẫu"',
             sau.every(l => l.cach !== 'POST') && hopThoaiDn.length === 0, `${tomDn(sau)} · hộp thoại: ${JSON.stringify(hopThoaiDn)}`);
          ok('RÀ SOÁT VÒNG BỐN: …không lượt xin nào (mọi loại, không chỉ trang) mang lại mật khẩu đã gõ',
             coMatKhau.length === 0, JSON.stringify(coMatKhau.map(l => `${l.cach} ${l.duong}`)));
          ok('…Quay lại về trang đã gõ: không ô mật khẩu nào còn chữ', Array.isArray(sauLui) && sauLui.every(v => v === ''), JSON.stringify(sauLui));
          await coHan(ctxDn.close(), 10_000);
        };

        // Rời trang là xóa ô mật khẩu: gõ rồi bấm một link, Quay lại — trang về từ bfcache với chữ đã gõ, trừ mật khẩu.
        // (Sau lượt gửi form, Chromium 156 không giữ trang đã gõ trong bfcache; Safari, Firefox, bản Chromium sau thì
        // chưa chắc — lớp này không trông vào chuyện đó.)
        const thuXoaMatKhau = async () => {
          const ctxB = await khongChan.newContext();
          await phongChuTaiCho(ctxB);
          const tabB = await ctxB.newPage();
          await tabB.goto(goc + DUONG_DN + '?buoc=71');
          await dungFormDangNhap(tabB, DUONG_DN + '?buoc=72');
          await tabB.fill('input[name="email"]', EMAIL_THU);
          await tabB.fill('input[name="mat_khau"]', MK_THU);
          await trongTrang(tabB, () => { window.__trangCu = true; });
          await Promise.all([tabB.waitForURL(u => u.search.includes('buoc=72'), { timeout: 15_000 }), tabB.click('#thu-link')]);
          await tabB.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
          await trongTrang(tabB, () => { history.back(); });
          await choDen(() => tabB.url().includes('buoc=71'));
          await nghi(800);
          const ve = await trongTrang(tabB, () => ({
            cu: window.__trangCu === true,
            email: document.querySelector('input[name="email"]')?.value ?? null,
            mk: document.querySelector('input[name="mat_khau"]')?.value ?? null,
          }));
          ok('Đối chứng: bấm link rồi Quay lại — trang đăng nhập về từ bfcache, còn nguyên ô email đã gõ (trình duyệt giữ chữ đã gõ)',
             ve?.cu === true && ve?.email === EMAIL_THU, JSON.stringify(ve));
          ok('RÀ SOÁT VÒNG BỐN: …nhưng ô mật khẩu đã trống — trang xóa nó lúc rời đi',
             ve?.cu === true && ve?.mk === '', JSON.stringify({ ...ve, mk: ve?.mk === MK_THU ? '(mật khẩu đã gõ)' : ve?.mk }));
          await coHan(ctxB.close(), 10_000);
        };

        // HỆ THỐNG BẬN LÚC GỬI FORM (issue #194, đợt 3). Supabase bận đúng lúc bấm Lưu thì trả lời của lượt POST là
        // trang 503 "hệ thống đang bận" (lib/qua-tai.ts, trangQuaTai) — một mục lịch sử giữ nguyên thân form. Trang đó
        // vẫn là 503 (lượt POST nhận trả lời lỗi thì Chromium GIỮ bản lưu đệm của trang form; trả 303 thì nó bỏ, và
        // bấm Quay lại phải hỏi máy chủ đang bận — đo 16/11/2026, có và không có bfcache), nhưng tự thay mục của nó bằng
        // GET /noi-bo/chua-ghi (trangChuaGhi). Bản build không có database nên không bao giờ "bận": cảnh này dựng một máy
        // chủ nhỏ trả ĐÚNG hai trang mà mã của website dựng (nhập thẳng lib/qua-tai.ts), và một trang form nội bộ mang
        // đúng đoạn mã của khung (lib/sau-dang-xuat.js). Lời dặn của trang là "bấm Quay lại rồi gửi lại": phải về đúng
        // form, còn chữ đã gõ (trừ mật khẩu), không hỏi máy chủ. Qua middleware thật, Supabase Auth giả bận:
        // thu-day-du.mjs nhóm 15.
        const thuBanLucGui = async () => {
          // Trang báo trên CHÍNH bản build (Worker): middleware trả nó trước khi hỏi Supabase, nên bản không database
          // cũng có — 503, no-store, header bảo vệ của /noi-bo, nút "Tải lại trang" về trang trong cookie (lạ → /noi-bo).
          const bao = await fetch(goc + '/noi-bo/chua-ghi', { redirect: 'manual', headers: { cookie: 'bt_chua_ghi=%2Fnoi-bo%2Fkho%2Fxuat%3Floc%3Da' } });
          const thanBao = await bao.text();
          ok('#194: bản build — GET /noi-bo/chua-ghi là trang báo "CHƯA ghi" (503, no-store, không cho nhúng), nút về trang trong cookie',
             bao.status === 503 && /no-store/.test(bao.headers.get('cache-control') ?? '') && bao.headers.get('x-frame-options') === 'DENY'
             && thanBao.includes('CHƯA được ghi') && thanBao.includes('<a href="/noi-bo/kho/xuat?loc=a">') && !/<script/i.test(thanBao),
             `HTTP ${bao.status} · ${bao.headers.get('cache-control')} · ${(thanBao.match(/<a href="[^"]*"/) ?? [''])[0]}`);
          const baoLa = await (await fetch(goc + '/noi-bo/chua-ghi', { redirect: 'manual', headers: { cookie: 'bt_chua_ghi=%2F%2Fke-la.example%2Fx' } })).text();
          ok('…cookie lạ (//máy-khác) → nút về /noi-bo', baoLa.includes('<a href="/noi-bo">') && !baoLa.includes('ke-la'));
          const QT = await import(pathToFileURL(join(WEB, 'src', 'lib', 'qua-tai.ts')).href);
          const { readFileSync } = await import('node:fs');
          const maKhung = readFileSync(join(WEB, 'src', 'lib', 'sau-dang-xuat.js'), 'utf8');
          const MA = maKhung.slice(maKhung.indexOf('(function'));
          const DUONG_FORM = '/noi-bo/thu-ban';
          const CHU_GO = 'Thùng 1.000 g — đã cân, 1,5 kg vụn';
          const MK = 'Mk-thu-ban-' + Date.now();
          const nhatKyMay = [];   // mọi lượt máy chủ nhận: { cach, duong, than }
          const { createServer } = await import('node:http');
          const guiTraLoi = async (res, tl) => {
            const dau = {};
            tl.headers.forEach((v, k) => { if (k !== 'set-cookie') dau[k] = v; });
            const datCookie = tl.headers.getSetCookie();
            if (datCookie.length) dau['set-cookie'] = datCookie;
            res.writeHead(tl.status, dau);
            res.end(Buffer.from(await tl.arrayBuffer()));
          };
          const may = createServer((req, res) => {
            let than = '';
            req.setEncoding('utf8');
            req.on('data', c => { than += c; });
            req.on('end', async () => {
              try {
                const u = new URL(req.url, 'http://127.0.0.1');
                nhatKyMay.push({ cach: req.method, duong: u.pathname + u.search, than });
                const url = new URL(req.url, `http://${req.headers.host}`);
                if (u.pathname === DUONG_FORM && req.method === 'POST') return await guiTraLoi(res, QT.trangQuaTai('vi', true, url));
                if (u.pathname === DUONG_FORM) {
                  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private' });
                  return res.end(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><script data-dau-phien="">${MA}</script>`
                    + `<title>Form nội bộ thử</title></head><body><h1 id="form-thu">Form nội bộ thử</h1><form method="POST">`
                    + `<input name="ghi_chu" id="ghi_chu" type="text"><input name="mat_khau" id="mat_khau" type="password" autocomplete="off">`
                    + `<button id="nut-luu" type="submit">Lưu</button></form></body></html>`);
                }
                if (u.pathname === '/noi-bo/chua-ghi') {
                  // Như middleware: Astro đọc cookie đã giải mã (decodeURIComponent) rồi mới đưa cho trangChuaGhi.
                  const tho = (req.headers.cookie ?? '').split(/;\s*/).find(x => x.startsWith('bt_chua_ghi='))?.slice('bt_chua_ghi='.length);
                  let giaTri; try { giaTri = tho === undefined ? undefined : decodeURIComponent(tho); } catch { giaTri = undefined; }
                  return await guiTraLoi(res, QT.trangChuaGhi('vi', giaTri));
                }
                res.writeHead(404); res.end();
              } catch (e) { res.writeHead(500, { 'content-type': 'text/plain' }); res.end(String(e?.message ?? e)); }
            });
          });
          await new Promise(xong => may.listen(0, '127.0.0.1', xong));
          const gocBan = `http://127.0.0.1:${may.address().port}`;
          const ctxBan = await khongChan.newContext();
          try {
            const tab = await ctxBan.newPage();
            const cdp = await ctxBan.newCDPSession(tab);
            const hopThoai = [];
            tab.on('dialog', d => { hopThoai.push(`${d.type()}: ${d.message()}`); d.dismiss().catch(() => {}); });
            await tab.goto(gocBan + DUONG_FORM, { waitUntil: 'load' });
            await tab.fill('#ghi_chu', CHU_GO);
            await tab.fill('#mat_khau', MK);
            const moc = nhatKyMay.length;
            await Promise.all([tab.waitForURL(gocBan + '/noi-bo/chua-ghi', { timeout: 15_000 }).catch(() => {}), tab.click('#nut-luu')]);
            await tab.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
            await nghi(500);
            const guiDi = nhatKyMay.slice(moc);
            const tom = ds => JSON.stringify(ds.map(l => `${l.cach} ${l.duong}`));
            ok('Đối chứng: lượt gửi là đúng MỘT lượt POST tới máy chủ, mang chữ đã gõ và mật khẩu (form thật sự được gửi)',
               guiDi.filter(l => l.cach === 'POST').length === 1 && guiDi[0]?.cach === 'POST' && guiDi[0].than.includes(encodeURIComponent(MK)),
               tom(guiDi));
            ok('#194: hệ thống bận lúc gửi — trang 503 của lượt POST tự thay bằng GET /noi-bo/chua-ghi; trang báo nói CHƯA ghi, nút "Tải lại trang" về đúng form',
               tab.url() === gocBan + '/noi-bo/chua-ghi' && guiDi.at(-1)?.cach === 'GET' && guiDi.at(-1)?.duong === '/noi-bo/chua-ghi'
               && (await trongTrang(tab, () => document.body.innerText.includes('CHƯA được ghi') && document.querySelector('main a')?.getAttribute('href'))) === DUONG_FORM,
               `${tab.url()} · ${tom(guiDi)}`);
            const ls = await coHan(cdp.send('Page.getNavigationHistory')) ?? { entries: [] };
            ok('#194: …lịch sử không còn mục nào của lượt POST (CDP: không mục form_submit) — F5 trên trang báo không thể gửi lại form',
               ls.entries.length >= 2 && ls.entries.every(e => e.transitionType !== 'form_submit')
               && new URL(ls.entries.at(-1).url).pathname === '/noi-bo/chua-ghi' && new URL(ls.entries.at(-2).url).pathname === DUONG_FORM,
               JSON.stringify(ls.entries.map(e => `${e.url.replace(gocBan, '')} ${e.transitionType}`)));

            // Lời dặn của trang: bấm Quay lại rồi gửi lại.
            const moc2 = nhatKyMay.length;
            await trongTrang(tab, () => { history.back(); });
            await choDen(() => tab.url() === gocBan + DUONG_FORM);
            await tab.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
            await nghi(800);
            const lui = nhatKyMay.slice(moc2);
            const oForm = await trongTrang(tab, () => ({
              form: !!document.getElementById('form-thu'),
              chu: document.getElementById('ghi_chu')?.value ?? null,
              mk: document.getElementById('mat_khau')?.value ?? null,
              hien: document.documentElement.style.visibility,
            }));
            ok('#194: bấm Quay lại (lời dặn của trang) — về đúng form, KHÔNG hỏi máy chủ đang bận (bản lưu đệm của trang form còn nguyên)',
               tab.url() === gocBan + DUONG_FORM && oForm?.form === true && oForm?.hien === '' && lui.length === 0,
               `${tab.url()} · máy chủ nhận: ${tom(lui)} · ${JSON.stringify({ ...oForm, mk: oForm?.mk === MK ? '(mật khẩu)' : oForm?.mk })}`);
            ok('#194: …chữ đã gõ còn nguyên (gửi lại không phải gõ lại), ô mật khẩu trống',
               oForm?.chu === CHU_GO && oForm?.mk === '', JSON.stringify({ ...oForm, mk: oForm?.mk === MK ? '(mật khẩu)' : oForm?.mk }));

            // Tiến tới, F5: chỉ là lượt GET trang báo — không lượt POST nào, mật khẩu không đi ra lần nữa, không hộp thoại.
            await trongTrang(tab, () => { history.forward(); });
            await choDen(() => tab.url() === gocBan + '/noi-bo/chua-ghi');
            await tab.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
            await coHan(tab.reload({ waitUntil: 'load' }), 10_000);
            await nghi(500);
            const sau = nhatKyMay.slice(moc2);
            ok('#194: Tiến tới, F5 — không lượt POST nào, mật khẩu không đi ra lần nữa, không hộp thoại "gửi lại biểu mẫu"',
               sau.length >= 1 && sau.every(l => l.cach === 'GET' && l.duong === '/noi-bo/chua-ghi' && !l.than.includes(MK) && !l.duong.includes(MK))
               && hopThoai.length === 0 && tab.url() === gocBan + '/noi-bo/chua-ghi',
               `${tom(sau)} · hộp thoại: ${JSON.stringify(hopThoai)} · ${tab.url()}`);
          } finally {
            await coHan(ctxBan.close(), 10_000);
            await coHan(new Promise(xong => { may.closeAllConnections?.(); may.close(() => xong()); }), 5000);
          }
        };

        // TRANG KHO DỰNG TẠI CHỖ TỰ XÓA THÂN FORM KHỎI LỊCH SỬ (issue #194, đợt 5 — Khánh chọn cách 2 ngày 16/11/2026). 31
        // trang kho báo lỗi (hay hiện bước xem trước, thêm dòng) ngay trong trả lời của lượt POST: chữ đã gõ theo từng dòng,
        // mã gửi, ảnh đã tải còn nguyên. Mục lịch sử của trả lời đó giữ thân form — F5, hay rời đi rồi Quay lại / Tiến tới
        // và F5, là gửi lại cả form. Khung Kho in vào <head> của trả lời lượt POST một đoạn mã (components/kho/
        // XoaThanPost.astro, mã ở lib/kho/xoa-than-post.js) thay mục đó bằng một mục cùng địa chỉ, không thân form. Trang
        // kho cần đăng nhập, bản build không có database: cảnh này dựng một máy chủ nhỏ trả trang form và trang báo lỗi tại
        // chỗ mang ĐÚNG đoạn mã đó, cùng đoạn mã của khung (lib/sau-dang-xuat.js) đúng thứ tự trong <head>, form gửi về
        // chính địa chỉ của nó, header như /noi-bo (private). Đối chứng: cùng trang không có đoạn mã — F5 là gửi lại (cảnh
        // này thấy được lỗi). Thẻ chỉ in ở lượt POST, khung in nó trước thẻ phông chữ: crm/test/test-kho-loi-chuyen-huong.mjs
        // nhóm 5.
        const thuLoiTaiChoKho = async () => {
          const { readFileSync, existsSync } = await import('node:fs');
          const TEP_XOA = join(WEB, 'src', 'lib', 'kho', 'xoa-than-post.js');
          ok('#194: có đoạn mã lib/kho/xoa-than-post.js (khung Kho in nó vào trả lời của lượt POST)', existsSync(TEP_XOA));
          if (!existsSync(TEP_XOA)) return;
          const maXoa = readFileSync(TEP_XOA, 'utf8');
          const MA_XOA = maXoa.slice(maXoa.indexOf('(function'));
          const maKhung = readFileSync(join(WEB, 'src', 'lib', 'sau-dang-xuat.js'), 'utf8');
          const MA_KHUNG = maKhung.slice(maKhung.indexOf('(function'));
          const DUONG = '/noi-bo/kho/thu-loi-tai-cho';
          const DUONG_DC = '/noi-bo/kho/thu-doi-chung';   // đối chứng: cùng trang, không có đoạn mã
          const DUONG_KHAC = '/noi-bo/kho/thu-trang-khac';
          const SO_GO = '1.250,5';
          const nhatKyMay = [];   // mọi lượt máy chủ nhận: { cach, duong, than }
          const trangKho = ({ laPost, coMa, so, maGui }) => '<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Phiếu thử</title>'
            + (laPost && coMa ? `<script>${MA_XOA}</script>` : '')
            + `<script data-dau-phien="">${MA_KHUNG}</script></head><body>`
            + `<p id="bao">${laPost ? 'Chưa lưu được: dòng 2 chưa có giá nhập.' : ''}</p>`
            + `<form method="POST"><input name="so_luong" id="so_luong" value="${so}"><input type="hidden" name="ma_gui" value="${maGui}">`
            + `<button id="nut-luu" type="submit">Lưu</button></form><a id="sang-khac" href="${DUONG_KHAC}">Mặt hàng</a></body></html>`;
          const { createServer } = await import('node:http');
          const may = createServer((req, res) => {
            let than = '';
            req.setEncoding('utf8');
            req.on('data', c => { than += c; });
            req.on('end', () => {
              try {
                const u = new URL(req.url, 'http://127.0.0.1');
                nhatKyMay.push({ cach: req.method, duong: u.pathname + u.search, than });
                const dau = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'private' };
                if (u.pathname === DUONG || u.pathname === DUONG_DC) {
                  // Như trang kho: lỗi thì dựng lại form ngay trong trả lời, với số vừa gửi và CÙNG mã gửi.
                  const laPost = req.method === 'POST';
                  const f = new URLSearchParams(than);
                  res.writeHead(200, dau);
                  return res.end(trangKho({ laPost, coMa: u.pathname === DUONG,
                    so: laPost ? (f.get('so_luong') ?? '').replace(/[<>"&]/g, '') : '',
                    maGui: laPost ? (f.get('ma_gui') ?? '').replace(/[^\w-]/g, '') : globalThis.crypto.randomUUID() }));
                }
                if (u.pathname === DUONG_KHAC) {
                  res.writeHead(200, dau);
                  return res.end('<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Mặt hàng</title></head><body><h1 id="khac">Mặt hàng</h1></body></html>');
                }
                res.writeHead(404); res.end();
              } catch (e) { res.writeHead(500, { 'content-type': 'text/plain' }); res.end(String(e?.message ?? e)); }
            });
          });
          await new Promise(xong => may.listen(0, '127.0.0.1', xong));
          const gocKho = `http://127.0.0.1:${may.address().port}`;
          const ctxKho = await khongChan.newContext();
          try {
            const tab = await ctxKho.newPage();
            const hopThoai = [];
            tab.on('dialog', d => { hopThoai.push(`${d.type()}: ${d.message()}`); d.dismiss().catch(() => {}); });
            const tom = ds => JSON.stringify(ds.map(l => `${l.cach} ${l.duong}`));
            const coPost = ds => ds.some(l => l.cach === 'POST');
            const oTrang = async () => (await trongTrang(tab, () => ({
              duong: location.pathname + location.search, bao: document.getElementById('bao')?.textContent ?? null,
              so: document.getElementById('so_luong')?.value ?? null,
            }))) ?? { khongDocDuoc: true };
            /** Một bước (gửi form, F5, Quay lại…) và mọi lượt máy chủ nhận trong lúc đó. */
            const buoc = async lam => {
              const moc = nhatKyMay.length;
              await coHan(lam(), 15_000);
              await tab.waitForLoadState('load', { timeout: 10_000 }).catch(() => {});
              await nghi(400);
              return nhatKyMay.slice(moc);
            };
            /** Mở form, gõ số, bấm Lưu: trả lời là trang báo lỗi dựng tại chỗ (HTTP 200 của lượt POST). */
            const guiLoi = async duong => {
              await coHan(tab.goto(gocKho + duong + '?loc=a', { waitUntil: 'load' }), 15_000);
              await coHan(tab.fill('#so_luong', SO_GO));
              return buoc(() => Promise.all([tab.waitForNavigation({ timeout: 15_000 }), tab.click('#nut-luu')]));
            };
            const f5 = () => buoc(() => tab.reload({ waitUntil: 'load' }));
            const guiLai = ds => ds.some(l => l.cach === 'POST' && l.than.includes(encodeURIComponent(SO_GO)));

            // Đối chứng trước: không có đoạn mã thì F5 trên trang báo lỗi — và rời đi, Quay lại, F5 — gửi lại thân form.
            const guiDc = await guiLoi(DUONG_DC);
            const f5Dc = await f5();
            await guiLoi(DUONG_DC);
            await buoc(() => tab.click('#sang-khac'));
            const luiDc = await buoc(() => tab.goBack({ waitUntil: 'load' }));
            const luiF5Dc = await f5();
            ok('Đối chứng: trang báo lỗi tại chỗ KHÔNG có đoạn mã — F5 gửi lại nguyên thân form; rời đi, Quay lại, F5 cũng vậy (cảnh thử thấy được lỗi)',
               guiDc.filter(l => l.cach === 'POST').length === 1 && guiLai(f5Dc) && guiLai([...luiDc, ...luiF5Dc]),
               `gửi: ${tom(guiDc)} · F5: ${tom(f5Dc)} · Quay lại: ${tom(luiDc)} · F5: ${tom(luiF5Dc)}`);

            // Có đoạn mã (như trả lời của lượt POST trong khung Kho).
            const moc = nhatKyMay.length;
            const gui = await guiLoi(DUONG);
            const sauGui = await oTrang();
            ok('#194: trang báo lỗi vẫn dựng tại chỗ — đúng MỘT lượt POST, câu lỗi hiện, số vừa gõ còn nguyên trong ô',
               gui.filter(l => l.cach === 'POST').length === 1 && guiLai(gui) && sauGui.bao?.startsWith('Chưa lưu được') && sauGui.so === SO_GO,
               `${tom(gui)} · ${JSON.stringify(sauGui)}`);
            const f5Co = await f5();
            ok('#194: F5 trên trang báo lỗi — một lượt GET của chính trang, không gửi lại form',
               f5Co.length >= 1 && !coPost(f5Co) && f5Co.every(l => l.duong === DUONG + '?loc=a'), tom(f5Co));

            // Rời trang báo lỗi (bấm một link) rồi Quay lại về đó, F5; Tiến tới, Quay lại, F5.
            await guiLoi(DUONG);
            await buoc(() => tab.click('#sang-khac'));
            const lui = await buoc(() => tab.goBack({ waitUntil: 'load' }));
            const sauLui = await oTrang();
            const luiF5 = await f5();
            const tienLui = [...await buoc(() => tab.goForward({ waitUntil: 'load' })), ...await buoc(() => tab.goBack({ waitUntil: 'load' }))];
            const tienLuiF5 = await f5();
            ok('#194: rời trang báo lỗi, Quay lại về đó, F5 — rồi Tiến tới, Quay lại, F5 — không lượt POST nào, vẫn đúng địa chỉ của trang',
               !coPost([...lui, ...luiF5, ...tienLui, ...tienLuiF5]) && sauLui.duong === DUONG + '?loc=a',
               `Quay lại: ${tom(lui)} ${JSON.stringify(sauLui)} · F5: ${tom(luiF5)} · Tiến, Quay lại: ${tom(tienLui)} · F5: ${tom(tienLuiF5)}`);

            // Tiến tới về một trang báo lỗi (Quay lại về form trước nó, rồi Tiến), F5.
            await guiLoi(DUONG);
            await buoc(() => tab.goBack({ waitUntil: 'load' }));
            const tien = await buoc(() => tab.goForward({ waitUntil: 'load' }));
            const tienF5 = await f5();
            ok('#194: Quay lại về form rồi Tiến tới về trang báo lỗi, F5 — không lượt POST nào',
               !coPost([...tien, ...tienF5]), `Tiến: ${tom(tien)} · F5: ${tom(tienF5)}`);
            const tatCa = nhatKyMay.slice(moc);
            ok('#194: cả cảnh có đoạn mã: máy chủ nhận đúng ba lượt POST — ba lần bấm Lưu — không hộp thoại "gửi lại biểu mẫu"',
               tatCa.filter(l => l.cach === 'POST').length === 3 && hopThoai.length === 0,
               `${tom(tatCa.filter(l => l.cach === 'POST'))} · hộp thoại: ${JSON.stringify(hopThoai)}`);
          } finally {
            await coHan(ctxKho.close(), 10_000);
            await coHan(new Promise(xong => { may.closeAllConnections?.(); may.close(() => xong()); }), 5000);
          }
        };

        try {
          await chayCoHan('Khối thử trang kết quả gửi form', thuGuiLaiForm, 120_000);
          await chayCoHan('Khối thử trả lời của lượt đăng nhập không thành', thuTraLoiDangNhap, 60_000);
          await chayCoHan('Khối thử lịch sử sau khi đăng nhập không thành', thuLichSuDangNhap, 150_000);
          await chayCoHan('Khối thử xóa ô mật khẩu khi rời trang đăng nhập', thuXoaMatKhau, 60_000);
          await chayCoHan('Khối thử hệ thống bận lúc gửi form', thuBanLucGui, 90_000);
          await chayCoHan('Khối thử trang kho dựng tại chỗ tự xóa thân form', thuLoiTaiChoKho, 120_000);
        } finally {
          await coHan(khongChan.close(), 10_000);
        }
      }
    });
    await ctx.close();
  }

  // =========================================================================
  // Nhãn của nút danh mục, nút Đặt bàn (tên từ 23/11/2026; trước đó "Hỏi bàn") và đường dẫn của nó — chép tay, KHÔNG đọc lib/chu.ts (cùng lý do
  // với CAU_CHI_DUONG ở trên).
  const NHAN_MENU = {
    vi: { mo: 'Danh mục', dong: 'Đóng', hoiBan: 'Đặt bàn', duong: '/dat-ban' },
    en: { mo: 'Pages', dong: 'Close', hoiBan: 'Book a table', duong: '/en/book' },
    ko: { mo: '바로가기', dong: '닫기', hoiBan: '테이블 예약', duong: '/ko/book' },
  };
  const tieuDiem = page => page.evaluate(() => {
    const a = document.activeElement;
    const cs = a ? getComputedStyle(a) : null;
    return {
      trongBang: !!a?.closest('.mg-bang'), laCauHoi: !!a?.matches('.cau-hoi summary'),
      vong: !!cs && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2,
      moTa: a ? `<${a.tagName.toLowerCase()}> ${a.textContent.trim().slice(0, 30)}` : 'không có',
    };
  });

  /** Lớp phủ tối dưới bảng danh mục (phần tử giả ::before của <details>) và việc khoá cuộn trang. */
  const lopPhu = page => page.evaluate(() => {
    const phu = getComputedStyle(document.querySelector('details.menu-gon'), '::before');
    const co = phu.content !== 'none' && phu.content !== 'normal' && phu.display !== 'none';
    return {
      mau: co && phu.position === 'fixed' ? phu.backgroundColor : null,
      conTro: co ? phu.cursor : null,
      khoaCuon: getComputedStyle(document.documentElement).overflowY === 'hidden',
    };
  });
  /** Chờ tới khi trang cuộn khỏi vị trí `truoc` (tối đa 0,7 giây). Hỏi từ ngoài trang: tắt JavaScript vẫn chạy. */
  const choCuon = async (page, truoc, toiDa = 700) => {
    for (let t = 0; t < toiDa && await page.evaluate(() => scrollY) === truoc; t += 50) await cho(50);
  };
  /** Lăn chuột xuống ở gần đáy màn hình (chỗ của lớp phủ, ngoài bảng danh mục); trả số px trang đã cuộn. */
  const lanChuot = async page => {
    const { width, height } = page.viewportSize();
    const truoc = await page.evaluate(() => scrollY);
    await page.mouse.move(width / 2, height - 30);
    await page.mouse.wheel(0, 240);
    await choCuon(page, truoc);
    await cho(200);
    return (await page.evaluate(() => scrollY)) - truoc;
  };
  const veDau = page => page.evaluate(() => scrollTo(0, 0));

  await nhom('5 · MENU GỌN Ở 320, 360 VÀ 768 PX: MỞ / ĐÓNG KHI TẮT JAVASCRIPT; CÓ JAVASCRIPT: Esc, Enter, Tab, LỚP PHỦ, KHOÁ CUỘN', async () => {
    for (const rong of [320, 360, 768]) {
      for (const coJs of [false, true]) {
        const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: rong < 600 ? 740 : 1024 }, javaScriptEnabled: coJs });
        const page = await ctx.newPage();
        for (const duong of ['/', '/en', '/ko']) {
          await page.goto(goc + duong);
          const nn = ngonNguCua(duong);
          const nhan = `${duong} · ${rong}px · ${coJs ? 'có' : 'TẮT'} JavaScript`;
          const menu = page.locator('details.menu-gon');
          const nut = menu.locator('summary');
          const muc = menu.locator('a[href]');
          const mo = () => menu.evaluate(d => d.open).catch(() => null);
          const thayMuc = async () => (await muc.count()) > 0 && await muc.first().isVisible();
          const chuNut = async () => motDong(await nut.innerText());
          if (!ok(`${nhan}: có menu gọn, lúc đầu đóng, các mục chưa hiện, nút ghi "${NHAN_MENU[nn].mo}"`,
                  await menu.count() === 1 && await nut.isVisible() && await mo() === false && !(await thayMuc())
                    && await chuNut() === NHAN_MENU[nn].mo, await chuNut().catch(() => ''))) {
            await chupLoi(page, `menu-gon${duong}-${rong}-${coJs ? 'js' : 'khong-js'}`);
            continue;
          }
          await nut.click();
          // Nút đổi màu trong 180ms: doGiaoDien bên dưới tự chờ chuyển màu xong (choDungYen); mấy phép đọc trước nó (đang
          // mở, thấy mục, chữ trên nút) không phụ thuộc màu — không chờ cứng.
          const tot = [
            ok(`${nhan}: bấm nút danh mục → mở, thấy các mục`, await mo() === true && await thayMuc()),
            ok(`${nhan}: đang mở thì nút là nút đóng, ghi "${NHAN_MENU[nn].dong}"`, await chuNut() === NHAN_MENU[nn].dong, await chuNut()),
          ];
          const gd = await page.evaluate(doGiaoDien);
          for (const khoa of ['vungCham', 'ngonNgu', 'nenTrongBang', 'bieuTuong', 'the']) {
            tot.push(ok(`${nhan}: danh mục đang mở — ${PHEP_DO[khoa]}`, gd[khoa]?.length === 0, (gd[khoa] ?? ['không đo được']).slice(0, 4).join(' | ')));
          }
          tot.push(ok(`${nhan}: danh mục đang mở không làm trang tràn ngang`,
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)));
          const hoiBan = menu.locator(`.mg-bang a[href="${NHAN_MENU[nn].duong}"]`);
          const ngonNguTrongBang = menu.locator('.mg-bang .mg-ngon-ngu .doi-ngon-ngu');
          if (rong < 768) {
            // Điện thoại: thanh đầu trang chỉ có logo và nút danh mục — Hỏi bàn và ngôn ngữ nằm trong bảng.
            tot.push(ok(`${nhan}: trong danh mục có "${NHAN_MENU[nn].hoiBan}" là nút chính, dẫn tới ${NHAN_MENU[nn].duong}`,
              await hoiBan.count() === 1 && await hoiBan.isVisible() && motDong(await hoiBan.innerText()) === NHAN_MENU[nn].hoiBan
                && await hoiBan.evaluate(a => a.classList.contains('nut') && a.classList.contains('nut-chinh'))));
            tot.push(ok(`${nhan}: trong danh mục có bộ chọn 3 thứ tiếng`,
              await ngonNguTrongBang.count() === 3 && await ngonNguTrongBang.first().isVisible()));
          } else {
            // Từ 768px hai thứ đó đã ở ngay trên thanh (do-giao-dien.mjs kiểm) — bảng không lặp lại.
            tot.push(ok(`${nhan}: Hỏi bàn và ngôn ngữ đã ở trên thanh, bảng danh mục không lặp lại`,
              !(await hoiBan.first().isVisible().catch(() => false)) && !(await ngonNguTrongBang.first().isVisible().catch(() => false))));
          }
          const phu = await lopPhu(page);
          if (coJs) {
            // Có script: lớp phủ tối che phần trang dưới bảng, bấm vào là đóng; trang phía sau đứng yên.
            tot.push(ok(`${nhan}: đang mở — có lớp phủ tối (đen 50 %) dưới bảng, con trỏ bàn tay`,
              phu.mau === 'rgba(0, 0, 0, 0.5)' && phu.conTro === 'pointer', JSON.stringify(phu)));
            const daCuon = await lanChuot(page);
            tot.push(ok(`${nhan}: đang mở — trang phía sau không cuộn`, phu.khoaCuon && daCuon === 0, `khoá ${phu.khoaCuon}, lăn chuột cuộn ${daCuon}px`));
            await page.keyboard.press('Escape');
            tot.push(ok(`${nhan}: Esc → đóng, tiêu điểm về nút danh mục`,
               await mo() === false && await nut.evaluate(s => document.activeElement === s)));
            const sauEsc = [await lopPhu(page), await lanChuot(page)];
            tot.push(ok(`${nhan}: đóng bằng Esc → hết lớp phủ, trang cuộn lại được`,
              sauEsc[0].mau === null && !sauEsc[0].khoaCuon && sauEsc[1] > 0, `${JSON.stringify(sauEsc[0])}, lăn chuột cuộn ${sauEsc[1]}px`));
            await veDau(page);
            await nut.focus();
            // Bàn phím từ đầu tới cuối: Enter mở, Tab đi qua từng mục, Tab ra khỏi mục cuối thì đóng.
            await page.keyboard.press('Enter');
            tot.push(ok(`${nhan}: Enter trên nút → mở`, await mo() === true && await thayMuc()));
            await page.keyboard.press('Tab');
            const dau = await tieuDiem(page);
            tot.push(ok(`${nhan}: Tab → mục đầu của danh mục, vòng focus nhìn thấy (≥ 2px)`, dau.trongBang && dau.vong, JSON.stringify(dau)));
            const soMuc = await menu.locator('.mg-bang a[href]').evaluateAll(as => as.filter(a => a.checkVisibility()).length);
            let conTrong = true, conVong = true;
            for (let i = 1; i < soMuc; i++) {
              await page.keyboard.press('Tab');
              const t = await tieuDiem(page);
              conTrong &&= t.trongBang; conVong &&= t.vong;
            }
            tot.push(ok(`${nhan}: Tab qua ${soMuc} mục — tiêu điểm ở trong danh mục, mục nào cũng có vòng focus, danh mục còn mở`,
               soMuc >= 3 && conTrong && conVong && await mo() === true));
            await page.keyboard.press('Tab');
            tot.push(ok(`${nhan}: Tab ra khỏi mục cuối → danh mục đóng`, await mo() === false));
            await nut.focus();
            await page.keyboard.press('Enter');
            await page.keyboard.press('Enter');
            tot.push(ok(`${nhan}: Enter hai lần trên nút → mở rồi đóng`, await mo() === false && !(await thayMuc())));
            // Đóng bằng nút đóng.
            await nut.click();
            const moLai = await mo();
            await nut.click();
            const sauNut = [await lopPhu(page), await lanChuot(page)];
            tot.push(ok(`${nhan}: mở rồi bấm nút đóng → đóng, hết lớp phủ, trang cuộn lại được`,
              moLai === true && await mo() === false && sauNut[0].mau === null && !sauNut[0].khoaCuon && sauNut[1] > 0,
              `${JSON.stringify(sauNut[0])}, lăn chuột cuộn ${sauNut[1]}px`));
            await veDau(page);
            // Đóng bằng cách bấm vào lớp phủ (gần đáy màn hình, ngoài bảng).
            await nut.click();
            const moLan3 = await mo();
            const { width, height } = page.viewportSize();
            const dich = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.className ?? '', [width / 2, height - 30]);
            await page.mouse.click(width / 2, height - 30);
            const sauPhu = [await lopPhu(page), await lanChuot(page)];
            tot.push(ok(`${nhan}: mở rồi bấm vào lớp phủ → đóng, trang cuộn lại được`,
              moLan3 === true && /\bmenu-gon\b/.test(dich) && await mo() === false && !sauPhu[0].khoaCuon && sauPhu[1] > 0,
              `chỗ bấm là «${dich}», ${JSON.stringify(sauPhu[0])}, lăn chuột cuộn ${sauPhu[1]}px`));
          } else {
            // Không có script: không gì đóng được menu khi khách bấm một link neo trong bảng. Vì vậy không
            // lớp phủ, không khoá cuộn — menu là một <details> thường, trang vẫn cuộn như trước đợt redesign.
            const daCuon = await lanChuot(page);
            tot.push(ok(`${nhan}: đang mở — không lớp phủ, không khoá cuộn, trang vẫn cuộn được`,
              phu.mau === null && !phu.khoaCuon && daCuon > 0, `${JSON.stringify(phu)}, lăn chuột cuộn ${daCuon}px`));
            await veDau(page);
            // Link neo "Trải nghiệm" dẫn tới #trai-nghiem của chính trang này: trang nhảy tới đó, menu còn mở
            // (không có script để đóng) — khách vẫn phải cuộn tiếp và tự đóng được.
            await muc.first().click();
            await choCuon(page, 0, 2000);
            const taiNeo = await page.evaluate(() => ({ neo: location.hash, y: scrollY }));
            const cuonTiep = await lanChuot(page);
            tot.push(ok(`${nhan}: bấm link neo trong danh mục → trang tới #trai-nghiem và cuộn tiếp được`,
              taiNeo.neo === '#trai-nghiem' && taiNeo.y > 0 && cuonTiep > 0, `${JSON.stringify(taiNeo)}, lăn chuột cuộn ${cuonTiep}px`));
            await nut.click();
            tot.push(ok(`${nhan}: bấm lần nữa → đóng`, await mo() === false && !(await thayMuc())));
          }
          if (tot.includes(false)) await chupLoi(page, `menu-gon${duong}-${rong}-${coJs ? 'js' : 'khong-js'}`);
        }
        await ctx.close();
      }
    }
  });

  // =========================================================================
  await nhom('6 · CÂU HỎI THƯỜNG GẶP Ở 390 VÀ 1440 PX: BÀN PHÍM MỞ / ĐÓNG, BẤM ĐƯỢC TRÊN TOÀN CHIỀU RỘNG', async () => {
    for (const rong of [390, 1440]) {
      const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: 900 } });
      const page = await ctx.newPage();
      for (const duong of ['/', '/en', '/ko']) {
        await page.goto(goc + duong);
        const nhan = `${duong} · ${rong}px`;
        const cau = page.locator('.cau-hoi details');
        const soCau = await cau.count();
        const dangMo = () => cau.first().evaluate(d => d.open);
        if (!ok(`${nhan}: có câu hỏi thường gặp, lúc đầu đều đóng`,
                soCau >= 4 && await cau.evaluateAll(ds => ds.every(d => !d.open)), `${soCau} câu`)) continue;
        const tom = cau.first().locator('summary');
        await tom.focus();
        await page.keyboard.press('Enter');
        const tot = [
          ok(`${nhan}: Enter trên câu đầu → mở, thấy câu trả lời`, await dangMo() === true && await cau.first().locator('.tra-loi').isVisible()),
        ];
        const gd = await page.evaluate(doGiaoDien);
        tot.push(ok(`${nhan}: câu đang mở — ${PHEP_DO.cauHoi}`, gd.cauHoi.length === 0, gd.cauHoi.slice(0, 3).join(' | ')));
        tot.push(ok(`${nhan}: câu đang mở — ${PHEP_DO.bieuTuong}`, gd.bieuTuong.length === 0, gd.bieuTuong.slice(0, 3).join(' | ')));
        await page.keyboard.press('Space');
        tot.push(ok(`${nhan}: phím cách → đóng`, await dangMo() === false));
        await page.keyboard.press('Tab');
        const ke = await tieuDiem(page);
        tot.push(ok(`${nhan}: Tab → câu kế tiếp, vòng focus nhìn thấy (≥ 2px)`, ke.laCauHoi && ke.vong, JSON.stringify(ke)));
        // Bấm ở hai mép của hàng, không phải lên chữ: cả chiều rộng là vùng bấm.
        const hop = await tom.boundingBox();
        await page.mouse.click(hop.x + hop.width - 5, hop.y + hop.height / 2);
        tot.push(ok(`${nhan}: bấm ở mép phải của hàng → mở`, await dangMo() === true));
        const hopMo = await tom.boundingBox();
        await page.mouse.click(hopMo.x + hopMo.width * 0.8, hopMo.y + hopMo.height / 2);
        tot.push(ok(`${nhan}: bấm vào khoảng trống giữa hàng → đóng`, await dangMo() === false));
        if (tot.includes(false)) await chupLoi(page, `cau-hoi${duong}-${rong}`);
      }
      await ctx.close();
    }
  });

  // =========================================================================
  // Màu "di chuột" (:hover) chỉ dành cho máy có chuột. Trên màn cảm ứng, chạm xong thì trình duyệt vẫn coi
  // ngón tay "đang ở trên" phần tử: nút giữ màu di chuột cho tới khi khách chạm chỗ khác — nút danh mục vừa
  // đóng mà trông như đang mở. Playwright giả màn cảm ứng bằng hasTouch: (hover: none), và locator.hover()
  // vẫn đặt được :hover — đúng tình huống đó.
  await nhom('7 · MÀN CẢM ỨNG: CHẠM XONG KHÔNG CÒN MÀU DI CHUỘT; MÁY CÓ CHUỘT VẪN ĐỔI MÀU KHI DI CHUỘT VÀ KHI NHẤN', async () => {
    const kieu = el => {
      const cs = getComputedStyle(el);
      const [svg, con] = [el.querySelector('svg'), el.querySelector(':scope > span')];
      return [cs.backgroundColor, cs.color, cs.borderTopColor, cs.borderBottomColor, cs.textDecorationLine, cs.textDecorationThickness,
        svg ? getComputedStyle(svg).transform : '', con ? getComputedStyle(con).textDecorationLine : ''].join(' | ');
    };
    // [tên, bộ chọn, bề rộng cần để phần tử hiện ra]
    const PHAN_TU = [
      ['nút danh mục', 'details.menu-gon summary', 390],
      ['nút chính', 'main .nut-chinh', 390],
      ['nút phụ', 'main .nut-vien', 390],
      ['liên kết có mũi tên', 'main .lien-ket', 390],
      ['hàng câu hỏi thường gặp', '.cau-hoi summary', 390],
      ['link chân trang', 'footer .ct-cot a', 390],
      ['dòng địa chỉ ở khối mở đầu', '.kmd-dia-chi', 390],
      ['link điều hướng trên thanh', '.dt-nav a:not([aria-current])', 1440],
      ['nút ngôn ngữ trên thanh', 'details.dt-ngon-ngu summary', 1440],
    ];
    for (const camUng of [true, false]) {
      for (const rong of [390, 1440]) {
        const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: 800 }, hasTouch: camUng });
        const page = await ctx.newPage();
        await page.goto(goc + '/');
        const loai = camUng ? 'màn cảm ứng' : 'máy có chuột';
        const nhan = `/ · ${rong}px · ${loai}`;
        const khongDiChuot = await page.evaluate(() => matchMedia('(hover: none)').matches);
        if (!ok(`${nhan}: trình duyệt báo ${camUng ? 'không' : 'có'} di chuột được ((hover: ${camUng ? 'none' : 'hover'}))`, khongDiChuot === camUng)) { await ctx.close(); continue; }
        for (const [ten, chon] of PHAN_TU.filter(p => p[2] === rong)) {
          const el = page.locator(chon).first();
          if (!ok(`${nhan}: thấy ${ten} (${chon})`, await el.count() > 0 && await el.isVisible())) continue;
          await page.mouse.move(0, 0);
          await el.scrollIntoViewIfNeeded();
          // Phần tử vừa rời con trỏ, trang vừa cuộn: chờ mọi chuyển màu (180ms) xong rồi mới đọc — choDungYen, không chờ cứng.
          await dungYen(page, nhan);
          const truoc = await el.evaluate(kieu);
          await el.hover();
          await dungYen(page, nhan);   // chuyển sang màu di chuột xong (máy có chuột) rồi mới đọc
          const [dangTren, sau] = [await el.evaluate(e => e.matches(':hover')), await el.evaluate(kieu)];
          if (camUng) {
            ok(`${nhan}: ${ten} — con trỏ đang ở trên (:hover) mà kiểu không đổi`, dangTren && sau === truoc, `:hover ${dangTren} · trước «${truoc}» · sau «${sau}»`);
          } else {
            ok(`${nhan}: ${ten} — di chuột lên thì đổi kiểu`, dangTren && sau !== truoc, `:hover ${dangTren} · «${sau}»`);
          }
        }
        if (camUng && rong === 390) {
          // Đúng lỗi được báo: chạm mở rồi chạm đóng nút danh mục, nút phải về màu lúc đóng.
          const nut = page.locator('details.menu-gon summary');
          // Cú chạm thành cú bấm do trình duyệt tự dựng sau tap() — chờ đúng việc đó (danh mục mở / đóng, có hạn), rồi
          // chờ nút đổi màu xong (choDungYen). Không chờ cứng: hết hạn mà danh mục chưa đổi thì phép kiểm dưới đỏ.
          const choDanhMuc = mo => page.waitForFunction(m => document.querySelector('details.menu-gon')?.open === m, mo, { timeout: 5000 }).catch(() => {});
          await page.mouse.move(0, 0);
          await veDau(page);
          await dungYen(page, nhan);
          const truoc = await nut.evaluate(kieu);
          await nut.tap();
          await choDanhMuc(true);
          await dungYen(page, nhan);
          const daMo = await nut.evaluate(s => s.parentElement.open);
          await nut.tap();
          await choDanhMuc(false);
          await dungYen(page, nhan);
          const sau = await nut.evaluate(kieu);
          ok(`${nhan}: chạm mở rồi chạm đóng nút danh mục → nút về đúng kiểu lúc đóng`,
             daMo && await nut.evaluate(s => !s.parentElement.open) && sau === truoc, `trước «${truoc}» · sau «${sau}»`);
        }
        // Nhấn giữ (:active) phải có phản hồi ở cả hai loại máy — trên màn cảm ứng đó là phản hồi duy nhất.
        // Chặn mọi cú bấm từ đây: thả chuột trên nút không được chuyển trang hay mở danh mục.
        await page.evaluate(() => document.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }, true));
        for (const [ten, chon] of [['nút chính', 'main .nut-chinh'], ['nút phụ', 'main .nut-vien'], ['nút danh mục', 'details.menu-gon summary']]) {
          const el = page.locator(chon).first();
          if (!(await el.isVisible().catch(() => false))) continue;
          await page.mouse.move(0, 0);
          await el.scrollIntoViewIfNeeded();
          await dungYen(page, nhan);
          const truoc = await el.evaluate(e => getComputedStyle(e).backgroundColor);
          const hop = await el.boundingBox();
          await page.mouse.move(hop.x + hop.width / 2, hop.y + hop.height / 2);
          await page.mouse.down();
          await dungYen(page, nhan);   // đang giữ chuột: chuyển sang màu nhấn xong rồi mới đọc
          const [dangNhan, luc] = [await el.evaluate(e => e.matches(':active')), await el.evaluate(e => getComputedStyle(e).backgroundColor)];
          await page.mouse.up();
          ok(`${nhan}: ${ten} — đang nhấn (:active) thì nền đổi màu`, dangNhan && luc !== truoc, `:active ${dangNhan} · trước ${truoc} · lúc nhấn ${luc}`);
        }
        await ctx.close();
      }
    }
  });

  // =========================================================================
  // Máy có thanh cuộn kiểu cổ điển (Windows, chuột cắm vào Mac): thanh cuộn chiếm 15px bề ngang. Khoá cuộn
  // khi mở danh mục làm thanh cuộn biến mất — không bù lại thì cả trang xô sang phải 15px rồi xô lại lúc đóng.
  // DauTrang.astro đo bề rộng thanh cuộn trước khi mở và bù bằng padding-right của <html>.
  // Playwright mặc định giấu thanh cuộn, nên nhóm này mở một Chromium riêng có thanh cuộn thật.
  await nhom('8 · THANH CUỘN KIỂU CỔ ĐIỂN: MỞ DANH MỤC KHÔNG XÔ LỆCH TRANG, KHÔNG CUỘN NGANG', async () => {
    const coThanhCuon = await moChromium(chromium, { ignoreDefaultArgs: ['--hide-scrollbars'] });
    try {
      const do_ = page => page.evaluate(() => {
        const trai = chon => document.querySelector(chon)?.getBoundingClientRect().left ?? null;
        const phai = chon => document.querySelector(chon)?.getBoundingClientRect().right ?? null;
        const khung = document.querySelector('main .khung')?.getBoundingClientRect();
        return {
          thanhCuon: innerWidth - document.documentElement.clientWidth,
          bu: parseFloat(getComputedStyle(document.documentElement).paddingRight),
          tranNgang: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          logo: trai('.dt-logo'), cumPhai: phai('.dt-phai'), khungTrai: khung?.left ?? null,
          leTrai: khung ? khung.left : null, lePhai: khung ? document.documentElement.clientWidth - khung.right : null,
        };
      });
      for (const [rong, cao] of [[800, 1280], [1024, 768], [1440, 900]]) {
        const ctx = await coThanhCuon.newContext({ viewport: { width: rong, height: cao } });
        const page = await ctx.newPage();
        for (const duong of ['/', '/ko/book']) {
          await page.goto(goc + duong);
          const nhan = `${duong} · ${rong}px · thanh cuộn cổ điển`;
          const truoc = await do_(page);
          const tot = [
            ok(`${nhan}: trình duyệt có thanh cuộn chiếm chỗ thật (≥ 10px)`, truoc.thanhCuon >= 10, `${truoc.thanhCuon}px`),
            ok(`${nhan}: không cuộn ngang; khung nội dung cân giữa (lề trái bằng lề phải)`,
               truoc.tranNgang <= 0 && truoc.leTrai !== null && Math.abs(truoc.leTrai - truoc.lePhai) <= 1, JSON.stringify(truoc)),
          ];
          if (rong < 1080) {
            // Bù thanh cuộn và khoá cuộn chạy ngay trong cú bấm (DauTrang.astro); chờ trang đứng yên rồi mới đo vị trí.
            await page.locator('details.menu-gon summary').click();
            await dungYen(page, nhan);
            const sau = await do_(page);
            const khoa = await page.evaluate(() => getComputedStyle(document.documentElement).overflowY === 'hidden');
            tot.push(ok(`${nhan}: mở danh mục (trang đã khoá cuộn) — logo, cụm nút bên phải và khung nội dung đứng nguyên chỗ`,
              khoa && sau.logo === truoc.logo && sau.cumPhai === truoc.cumPhai && sau.khungTrai === truoc.khungTrai,
              `khoá ${khoa} · trước ${JSON.stringify(truoc)} · sau ${JSON.stringify(sau)}`));
            tot.push(ok(`${nhan}: mở danh mục không sinh cuộn ngang; phần bù bằng đúng bề rộng thanh cuộn vừa mất (${truoc.thanhCuon}px)`,
              sau.tranNgang <= 0 && sau.bu === truoc.thanhCuon, `tràn ${sau.tranNgang}px, bù ${sau.bu}px`));
            await page.keyboard.press('Escape');
            await dungYen(page, nhan);
            const dongLai = await do_(page);
            tot.push(ok(`${nhan}: đóng danh mục — thanh cuộn trở lại, hết phần bù, mọi thứ vẫn đứng nguyên chỗ`,
              dongLai.thanhCuon === truoc.thanhCuon && dongLai.bu === 0 && dongLai.logo === truoc.logo && dongLai.cumPhai === truoc.cumPhai
                && dongLai.khungTrai === truoc.khungTrai, JSON.stringify(dongLai)));
          }
          if (tot.includes(false)) await chupLoi(page, `thanh-cuon${duong}-${rong}`);
        }
        await ctx.close();
      }
    } finally {
      await coThanhCuon.close().catch(() => {});
    }
  });

  // =========================================================================
  // Kiểm site thật 07/10/2026: đường dẫn lạ trả đúng mã 404 nhưng HTML là mẫu mặc định của Astro —
  // lang="en", nền đen, không một link, không chữ Beeftown. Chạy cả với --url (kiểm beeftown.vn sau deploy).
  await nhom('9 · TRANG KHÔNG CÓ (404): MÃ 404, ĐÚNG THỨ TIẾNG, CÓ ĐƯỜNG VỀ TRANG CHỦ', async () => {
    for (const co of CO_MAN_HINH.filter(c => c.width === 360 || c.width === 1366)) {
      const ctx = await trinhDuyet.newContext({ viewport: { width: co.width, height: co.height } });
      for (const [duong, nn] of TRANG_KHONG_CO) {
        const page = await ctx.newPage();
        const loiJs = [], taiHong = [];
        // Chính tài liệu trả 404 (đó là điều cần kiểm) — chỉ tài nguyên KHÁC của trang mới tính là tải hỏng.
        const taiNguyenCuaTrang = u => u.startsWith(goc) && new URL(u).pathname !== duong;
        page.on('pageerror', e => loiJs.push(e.message));
        page.on('requestfailed', r => { if (taiNguyenCuaTrang(r.url())) taiHong.push(`${r.url()} (${r.failure()?.errorText})`); });
        page.on('response', r => { if (taiNguyenCuaTrang(r.url()) && r.status() >= 400) taiHong.push(`${r.url()} HTTP ${r.status()}`); });

        const r = await page.goto(goc + duong, { waitUntil: 'load', timeout: 30000 });
        const kq = await page.evaluate(() => {
          const chan = document.querySelector('footer');
          return {
            lang: document.documentElement.lang,
            tieuDe: document.title,
            rong: document.documentElement.scrollWidth,
            khung: window.innerWidth,
            linkChinh: [...document.querySelectorAll('main a[href]')].map(a => a.getAttribute('href')),
            robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
            soCanonical: document.querySelectorAll('link[rel="canonical"]').length,
            soHreflang: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
            soJsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
            dongChan: (chan?.innerText ?? '').split('\n').map(s => s.trim()).filter(Boolean),
          };
        });
        const them = await page.evaluate(doTrang);
        const giaoDien = await page.evaluate(doGiaoDien);
        const nhan = `${duong} · ${co.ten} ${co.width}px`;
        const iBanQuyen = kq.dongChan.findIndex(d => DONG_BAN_QUYEN.test(d));
        const phapNhan = dongPhapNhan(nn);
        const thieuLink = ['/', '/en', '/ko'].filter(d => !kq.linkChinh.includes(d));
        const tot = [
          ok(`${nhan}: HTTP 404 (không đổi thành 200)`, r?.status() === 404, `HTTP ${r?.status()}`),
          ok(`${nhan}: lang="${nn}" theo tiền tố đường dẫn`, kq.lang === nn, `lang="${kq.lang}"`),
          ok(`${nhan}: trang của Beeftown (tiêu đề có chữ Beeftown, đúng một <h1>)`,
             /Beeftown/.test(kq.tieuDe) && them.soH1 === 1, `«${kq.tieuDe}», ${them.soH1} thẻ h1`),
          ok(`${nhan}: nội dung chính có link về trang chủ của cả ba thứ tiếng (/, /en, /ko)`, thieuLink.length === 0,
             `thiếu ${thieuLink.join(', ')} — có ${JSON.stringify(kq.linkChinh)}`),
          ok(`${nhan}: chân trang công khai có pháp nhân SLK GROUP (tên, mã số thuế, địa chỉ, điện thoại)`,
             coPhapNhan(kq.dongChan, iBanQuyen, phapNhan),
             JSON.stringify(kq.dongChan).slice(0, 200)),
          ok(`${nhan}: không tràn ngang`, kq.rong <= kq.khung + 1, `rộng ${kq.rong}px > khung ${kq.khung}px`),
          ok(`${nhan}: noindex, không canonical, không hreflang, không JSON-LD (dựng không database — sẽ khai sai)`,
             /noindex/.test(kq.robots) && kq.soCanonical === 0 && kq.soHreflang === 0 && kq.soJsonLd === 0,
             `robots «${kq.robots}», ${kq.soCanonical} canonical, ${kq.soHreflang} hreflang, ${kq.soJsonLd} JSON-LD`),
          // Cùng các phép đo thành phần và khung trang với 24 trang ở nhóm 1 (do-giao-dien.mjs).
          ...Object.entries(PHEP_DO).map(([khoa, ten]) =>
            ok(`${nhan}: ${ten}`, giaoDien[khoa]?.length === 0, (giaoDien[khoa] ?? ['không đo được']).slice(0, 4).join(' | '))),
          ok(`${nhan}: tương phản chữ ≥ 4,5:1 (chữ lớn ≥ 3:1)`, !them.tuongPhan.length, them.tuongPhan.slice(0, 3).join(' | ')),
          ok(`${nhan}: không lỗi JavaScript, không tải hỏng`, !loiJs.length && !taiHong.length,
             [...loiJs, ...taiHong].slice(0, 3).join(' | ')),
        ];
        if (tot.includes(false)) await chupLoi(page, `khong-co${duong}-${co.width}`);
        await page.close();
      }
      await ctx.close();
    }
    // Prop khongLapChiMuc chỉ dành cho trang 404: trang thường vẫn giữ canonical và hreflang.
    const ctx = await trinhDuyet.newContext();
    const page = await ctx.newPage();
    await page.goto(goc + '/en/book', { waitUntil: 'load' });
    const thuong = await page.evaluate(() => ({
      robots: document.querySelectorAll('meta[name="robots"]').length,
      soCanonical: document.querySelectorAll('link[rel="canonical"]').length,
      soHreflang: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
      soJsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    }));
    ok('/en/book (trang thường): vẫn có canonical, đủ 4 hreflang, JSON-LD, không noindex',
       thuong.robots === 0 && thuong.soCanonical === 1 && thuong.soHreflang === 4 && thuong.soJsonLd === 1, JSON.stringify(thuong));
    await ctx.close();
  });

  // =========================================================================
  // Ảnh về chậm (3G, máy yếu): khung ảnh phải giữ sẵn đúng chỗ của ảnh — không thì cả trang xô xuống khi ảnh
  // về, khách đang đọc bị trượt mất dòng. Giữ mọi file /anh/ lại ở máy chủ giả (chưa trả), đo từng khung; thả
  // ra, cuộn hết trang cho ảnh lazy về, đo lại: khung nào cũng phải đứng nguyên chỗ, nguyên cỡ.
  await nhom('10 · ẢNH VỀ CHẬM: KHUNG GIỮ SẴN CHỖ, TRANG KHÔNG XÔ LỆCH; ẢNH VỀ ĐỦ, ĐÚNG KHUNG TỪNG CỠ MÀN HÌNH', async () => {
    // Chờ phông chữ xong (tối đa 5 giây) rồi mới đo: phông về sau thì chữ xuống dòng khác đi, vị trí các khung
    // đổi mà không phải do ảnh. Không dùng document.fonts.ready: Chromium giữ lời hứa đó tới khi trang tải
    // xong, mà ở lần đo đầu ảnh màn đầu đang bị giữ lại — trang chưa bao giờ "tải xong".
    const doKhung = page => page.evaluate(async () => {
      for (let i = 0; i < 50 && document.fonts.status !== 'loaded'; i++) await new Promise(r => setTimeout(r, 100));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return {
        caoTrang: document.documentElement.scrollHeight,
        soPhong: [...document.fonts].filter(f => f.status === 'loaded').length,
        khung: [...document.querySelectorAll('figure.anh')].map(f => {
          const k = f.getBoundingClientRect();
          const a = f.querySelector('img');
          return {
            id: (a?.getAttribute('src') ?? '').replace(/^.*\/anh\//, '').replace(/-\d+x\d+-\d+\.\w+$/, ''),
            trai: Math.round(k.left * 2) / 2, tren: Math.round((k.top + scrollY) * 2) / 2, rong: Math.round(k.width * 2) / 2, cao: Math.round(k.height * 2) / 2,
            hien: f.checkVisibility(), daVe: !!a && a.complete && a.naturalWidth > 0,
            file: (a?.currentSrc ?? '').replace(/^.*\/anh\//, ''),
            tiLeFile: a && a.naturalHeight ? a.naturalWidth / a.naturalHeight : null,
          };
        }),
      };
    });
    // Khung của từng ảnh theo bề rộng màn hình: dưới 600px dùng khung điện thoại (khungNho), từ 600px khung chính.
    const KHUNG_MONG = {
      'hero-vi-gas': ['4x5', '4x3'], 'bo-van-mo-can': ['1x1', '4x5'], 'bo-cat-lat': ['3x2', '3x2'], 'sot-cham': ['4x3', '4x3'],
      'mon-an-chia-se': ['4x3', '3x2'], 'bua-an-cung-ban': ['4x3', '3x2'], 'uong-khong-con-ba-ly': ['3x2', '3x2'],
      'quay-chon-bo': ['4x3', '4x3'],
    };
    for (const [rong, cao] of [[390, 844], [768, 1024], [1440, 900]]) {
      for (const duong of ['/', '/ko', '/thuc-don', '/den-beeftown']) {
        const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: cao } });
        const page = await ctx.newPage();
        const nhan = `${duong} · ${rong}px`;
        let tha;
        const giu = new Promise(xong => { tha = xong; });
        const hong = [];
        page.on('response', r => { if (/\/anh\//.test(r.url()) && r.status() >= 400) hong.push(`${r.url()} HTTP ${r.status()}`); });
        await page.route('**/anh/**', async r => { await giu; await r.continue().catch(() => {}); });
        try {
          await page.goto(goc + duong, { waitUntil: 'domcontentloaded', timeout: 30000 });
          const truoc = await doKhung(page);
          tha();
          await page.waitForLoadState('load');
          await page.evaluate(async () => {
            for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)); }
            scrollTo({ top: 0, behavior: 'instant' });
          });
          await page.waitForFunction(() => [...document.querySelectorAll('figure.anh img')].filter(a => a.checkVisibility()).every(a => a.complete && a.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {});
          const sau = await doKhung(page);
          const hienRa = sau.khung.filter(k => k.hien);
          const tot = [
            ok(`${nhan}: trang có ảnh (${hienRa.length} ảnh đang hiện), lúc ảnh chưa về chưa ảnh nào tải xong`,
               hienRa.length >= 1 && truoc.khung.length === sau.khung.length && truoc.khung.every(k => !k.daVe), JSON.stringify(truoc.khung.map(k => [k.id, k.daVe]))),
            // Vị trí theo chiều dọc và chiều cao trang chỉ so khi phông chữ không đổi giữa hai lần đo (phông về
            // muộn làm chữ xuống dòng khác — không phải lỗi của ảnh); bề rộng, chiều cao của khung thì luôn so.
            ok(`${nhan}: ảnh chưa về mà khung đã giữ sẵn đúng chỗ, đúng cỡ — ảnh về trang không xô lệch (cao trang ${truoc.caoTrang}px → ${sau.caoTrang}px)`,
               truoc.khung.every((k, i) => ['trai', 'rong', 'cao'].every(c => k[c] === sau.khung[i][c]))
                 && (truoc.soPhong !== sau.soPhong || (truoc.caoTrang === sau.caoTrang && truoc.khung.every((k, i) => k.tren === sau.khung[i].tren)))
                 && hienRa.every(k => k.rong > 100 && k.cao > 60),
               truoc.khung.map((k, i) => `${k.id} ${k.rong}×${k.cao}@${k.tren} → ${sau.khung[i]?.rong}×${sau.khung[i]?.cao}@${sau.khung[i]?.tren}`).join(' | ')),
            ok(`${nhan}: mọi ảnh đang hiện đều tải về được, không file nào hỏng`, hienRa.every(k => k.daVe) && hong.length === 0,
               [...hienRa.filter(k => !k.daVe).map(k => `${k.id} chưa về`), ...hong].join(' | ')),
            ok(`${nhan}: mỗi ảnh dùng đúng khung của cỡ màn hình này, khung hiện đúng tỷ lệ của file`,
               hienRa.every(k => k.file.startsWith(`${k.id}-${KHUNG_MONG[k.id]?.[rong < 600 ? 0 : 1]}-`) && Math.abs(k.rong / k.cao - k.tiLeFile) < 0.02),
               hienRa.map(k => `${k.file} trong khung ${k.rong}×${k.cao}`).join(' | ')),
          ];
          if (tot.includes(false)) await chupLoi(page, `anh-cham${duong}-${rong}`);
        } finally {
          tha();
          await ctx.close();
        }
      }
    }
  });

  // =========================================================================
  // Trang Thực đơn: ba phần (Bò tại quầy / Món ăn / Đồ uống) là ba tab. Lúc tải trang chỉ tab đầu hiện, và
  // do-giao-dien.mjs bỏ qua ảnh đang ẩn — nên ở mục 1 ảnh sot-cham của tab "Món ăn" chưa bao giờ được đo: giấu
  // nhãn "Ảnh minh họa" của nó, chèn chữ đè lên, bóp méo khung… phép đo vẫn đạt. Ở đây bấm từng tab như khách
  // rồi đo lại trên phần vừa mở.
  await nhom('11 · TRANG THỰC ĐƠN: BẤM TỪNG TAB RỒI ĐO LẠI ẢNH VÀ THÀNH PHẦN CỦA PHẦN VỪA MỞ Ở 390 VÀ 1440 PX', async () => {
    // Ảnh của từng phần lúc CHƯA công bố món (CI không có database) — chép tay theo TrangThucDon.astro; phần không
    // có ảnh thì để []. Ảnh món (đã công bố) đo ở thu-day-du.mjs nhóm 11.
    const ANH_CUA_PHAN = { 'bo-tai-quay': ['bo-cat-lat'], 'mon-an': ['sot-cham'], 'do-uong': ['uong-khong-con-ba-ly'] };
    for (const [rong, cao] of [[390, 844], [1440, 900]]) {
      const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: cao } });
      const page = await ctx.newPage();
      for (const duong of ['/thuc-don', '/en/menu', '/ko/menu']) {
        await page.goto(goc + duong, { waitUntil: 'load', timeout: 30000 });
        // Bấm theo thứ tự khách hay bấm: sang "Món ăn", sang "Đồ uống", rồi quay về "Bò tại quầy".
        for (const phan of ['mon-an', 'do-uong', 'bo-tai-quay']) {
          const anhMong = ANH_CUA_PHAN[phan];
          const nhan = `${duong} · ${rong}px · tab #${phan}`;
          await page.locator(`#td-tab-${phan}`).click();
          // Ảnh của phần vừa mở là ảnh lazy: cuộn tới từng ảnh cho nó tải, chờ tải xong, rồi về đầu trang.
          const thay = await page.evaluate(async phan => {
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const khoi = document.getElementById(phan);
            const anh = [...khoi.querySelectorAll('figure.anh')].filter(f => f.checkVisibility());
            for (const f of anh) {
              f.scrollIntoView({ block: 'center', behavior: 'instant' });
              const a = f.querySelector('img');
              for (let i = 0; i < 100 && !(a.complete && a.naturalWidth > 0); i++) await new Promise(r => setTimeout(r, 100));
            }
            scrollTo({ top: 0, behavior: 'instant' });
            return {
              tabDangChon: [...document.querySelectorAll('.td-tab a[aria-selected="true"]')].map(a => a.id),
              phanHien: [...document.querySelectorAll('.td-phan')].filter(p => p.checkVisibility()).map(p => p.id),
              anhHien: anh.map(f => (f.querySelector('img')?.getAttribute('src') ?? '').replace(/^.*\/anh\//, '').replace(/-\d+x\d+-\d+\.\w+$/, '')),
              anhVe: anh.every(f => { const a = f.querySelector('img'); return a.complete && a.naturalWidth > 0; }),
              nhanAnh: anh.map(f => f.querySelector('figcaption')?.checkVisibility() ? f.querySelector('figcaption').textContent.trim() : ''),
              hash: location.hash,
            };
          }, phan);
          const gd = await page.evaluate(doGiaoDien);
          const saiKhac = Object.keys(PHEP_DO).filter(k => k !== 'anh').flatMap(k => (gd[k] ?? ['không đo được']).map(c => `[${k}] ${c}`));
          const tot = [
            ok(`${nhan}: bấm tab → đúng phần này hiện (hai phần kia ẩn), tab được đánh dấu đang chọn, địa chỉ trang thành #${phan}`,
               thay.phanHien.join() === phan && thay.tabDangChon.join() === `td-tab-${phan}` && thay.hash === `#${phan}`,
               `hiện: ${thay.phanHien.join(', ') || 'không phần nào'} · tab: ${thay.tabDangChon.join(', ')} · ${thay.hash}`),
            ok(`${nhan}: phần vừa mở ${anhMong.length ? `có đúng ảnh ${anhMong.join(', ')}, ảnh tải về được, nhãn "Ảnh minh họa" đang hiện` : 'không có ảnh nào'}`,
               thay.anhHien.join() === anhMong.join() && thay.anhVe && thay.nhanAnh.every(n => n.length > 0),
               `ảnh: ${thay.anhHien.join(', ') || 'không'} · tải xong: ${thay.anhVe} · nhãn: ${JSON.stringify(thay.nhanAnh)}`),
            ok(`${nhan}: ${PHEP_DO.anh}`, gd.anh?.length === 0, (gd.anh ?? ['không đo được']).slice(0, 4).join(' | ')),
            ok(`${nhan}: ${Object.keys(PHEP_DO).length - 1} phép đo còn lại của do-giao-dien.mjs vẫn đạt trên phần vừa mở`, saiKhac.length === 0, saiKhac.slice(0, 5).join(' | ')),
          ];
          // Phép đo phải thật sự NHÌN THẤY ảnh của phần vừa mở: giấu nhãn của ảnh đó đi thì phải đỏ. Không có bước
          // này thì một lần sửa làm phép đo lại bỏ qua tab (hay bỏ qua cả ảnh) vẫn xanh.
          if (anhMong.length) {
            const kieuGiau = await page.addStyleTag({ content: `#${phan} figure.anh figcaption { display: none !important; }` });
            const gdGiau = await page.evaluate(doGiaoDien);
            await kieuGiau.evaluate(e => e.remove());
            tot.push(ok(`${nhan}: giấu nhãn "Ảnh minh họa" của ${anhMong.join(', ')} thì phép đo ảnh đỏ — phép đo có nhìn thấy ảnh của tab này`,
              (gdGiau.anh?.length ?? 0) > 0 && gdGiau.anh.some(c => anhMong.some(id => c.includes(id))), (gdGiau.anh ?? []).slice(0, 3).join(' | ') || 'phép đo vẫn đạt'));
          }
          if (tot.includes(false)) await chupLoi(page, `tab${duong}-${phan}-${rong}`);
        }
      }
      await ctx.close();
    }
  });

  // =========================================================================
  // Meta Pixel: mọi nhóm trên đã chạy với Meta bị chặn (chan-meta.mjs) — trang đủ khi khách chặn quảng cáo. Nhóm này
  // kiểm chính pixel. Chạy cả với --url (kiểm beeftown.vn sau deploy).
  await nhom('12 · META PIXEL: MÃ GỐC Ở MỌI TRANG CÔNG KHAI, SỰ KIỆN CHỈ KÈM TÊN TRANG VÀ THỨ TIẾNG, KHÔNG Ở TRANG 404', async () => {
    const MA_GOC = khoiMaPixel();
    const TRANG_THUC_DON = ['/thuc-don', '/en/menu', '/ko/menu'];
    const tenTrangMong = duong => duongDanTuongUng(duong, 'vi').replace(/^\//, '') || 'trang-chu';
    const thamSo = (duong, nn) => ({ content_name: tenTrangMong(duong), language: nn });
    const toiMeta = [];   // lượt nào tới được Meta (có trả lời) — phải rỗng
    const ctx = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
    ctx.on('requestfinished', r => { if (MAU_META.test(r.url())) toiMeta.push(r.url()); });

    for (const duong of trang) {
      const nn = ngonNguCua(duong);
      const page = await ctx.newPage();
      const loiJs = [];
      page.on('pageerror', e => loiJs.push(e.message));
      const html = await (await fetch(goc + duong)).text();
      const iMa = html.indexOf(MA_GOC);
      // Giữa mã gốc và </head> chỉ còn thứ Astro tự chèn khi build (CSS của trang, script module) — không thẻ nào của ta.
      const sauMa = iMa < 0 ? '' : html.slice(iMa + MA_GOC.length, html.indexOf('</head>'))
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>|<link\b[^>]*>|<script type="module"[^>]*>[\s\S]*?<\/script>/g, '').trim();
      await page.goto(goc + duong, { waitUntil: 'load', timeout: 30000 });
      const tenTrang = await page.evaluate(() => document.body.dataset.pixelTrang ?? null);
      const lenh = await page.evaluate(docHangDoi);
      const mong = [['init', MA_PIXEL], ['track', 'PageView'],
        ...(TRANG_THUC_DON.includes(duong) ? [['track', 'ViewContent', thamSo(duong, nn)]] : [])];
      const tot = [
        ok(`${duong}: đúng một khối mã gốc Meta Pixel, đúng từng chữ, cuối <head> (sau nó chỉ còn CSS, script Astro tự chèn)`,
           iMa > -1 && html.split(MA_GOC).length === 2 && iMa < html.indexOf('</head>') && sauMa === '',
           iMa < 0 ? 'không thấy mã gốc' : `sau mã gốc: «${sauMa.slice(0, 80)}»`),
        ok(`${duong}: <body data-pixel-trang="${tenTrangMong(duong)}">`, tenTrang === tenTrangMong(duong), String(tenTrang)),
        ok(`${duong}: lời gọi fbq đúng ${mong.map(l => l[1]).join(' + ')}${mong.length > 2 ? ' (chỉ content_name, language)' : ''} — không gì khác`,
           JSON.stringify(lenh) === JSON.stringify(mong), JSON.stringify(lenh)),
        ok(`${duong}: Meta bị chặn, trang không lỗi JavaScript`, !loiJs.length, loiJs.slice(0, 3).join(' | ')),
      ];
      if (tot.includes(false)) await chupLoi(page, `pixel${duong}`);
      await page.close();
    }

    // Contact: link dựng thẳng vào trang (bản build không database không có hotline, Zalo, Messenger). Bấm vào chữ
    // bên trong link cũng tính; link Trang Facebook, email, link trong trang thì không.
    const LINK = [
      ['tel:+84283822123', true], ['https://zalo.me/1234567890', true], ['https://oa.zalo.me/home', true],
      ['https://m.me/beeftown', true], ['https://www.messenger.com/t/beeftown', true],
      ['https://www.facebook.com/beeftown', false], ['mailto:thu@beeftown.example', false], ['/thuc-don', false],
      ['https://zalo.me.example.com/x', false],
    ];
    for (const duong of ['/den-beeftown', '/en/visit', '/ko/visit']) {
      const nn = ngonNguCua(duong);
      const page = await ctx.newPage();
      await page.goto(goc + duong, { waitUntil: 'load', timeout: 30000 });
      await page.evaluate(ds => {
        const hop = document.createElement('div');
        hop.id = 'thu-pixel';
        for (const [href] of ds) {
          const a = document.createElement('a');
          a.href = href;
          a.innerHTML = '<span>bấm</span>';
          // Không rời trang: chặn ở pha nổi bọt, SAU listener pha capture của Trang.astro.
          a.addEventListener('click', e => e.preventDefault());
          hop.append(a);
        }
        document.querySelector('main').prepend(hop);
      }, LINK);
      const sai = [];
      for (const [i, [href, laContact]] of LINK.entries()) {
        const truoc = suKienTrong(await page.evaluate(docHangDoi)).length;
        await page.evaluate(j => document.querySelectorAll('#thu-pixel a span')[j].click(), i);
        const moi = suKienTrong(await page.evaluate(docHangDoi)).slice(truoc);
        const dung = laContact
          ? moi.length === 1 && JSON.stringify(moi[0]) === JSON.stringify(['track', 'Contact', thamSo(duong, nn)])
          : moi.length === 0;
        if (!dung) sai.push(`${href}: ${JSON.stringify(moi)}`);
      }
      ok(`${duong}: bấm tel:, zalo.me, oa.zalo.me, m.me, messenger.com → một Contact mỗi lần (chỉ content_name, language); Trang Facebook, mailto, link trong trang, tên miền giả zalo.me.example.com → không`,
         sai.length === 0, sai.slice(0, 3).join(' | '));
      // Bấm chuột giữa (mở thẻ mới) chỉ phát auxclick: vẫn là Contact. Chuột phải (button 2) thì không.
      const truocGiua = suKienTrong(await page.evaluate(docHangDoi)).length;
      await page.evaluate(() => {
        const a = document.querySelectorAll('#thu-pixel a span')[1];   // https://zalo.me/…
        for (const nut of [1, 2]) a.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: nut }));
      });
      const giua = suKienTrong(await page.evaluate(docHangDoi)).slice(truocGiua);
      ok(`${duong}: bấm chuột giữa vào link Zalo → một Contact; chuột phải → không`,
         JSON.stringify(giua) === JSON.stringify([['track', 'Contact', thamSo(duong, nn)]]), JSON.stringify(giua));
      await page.close();
    }

    // fbevents.js tải được: lời gọi đã xếp hàng tới thư viện đủ, đúng thứ tự; lời gọi sau đó đi thẳng.
    {
      const ctxGhi = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 } });
      const lenh = await ghiPixel(ctxGhi);
      for (const duong of TRANG_THUC_DON) {
        const nn = ngonNguCua(duong);
        const page = await ctxGhi.newPage();
        lenh.length = 0;
        // Thứ tự "sự kiện load của trang" và "lúc trình duyệt xin fbevents.js" (SEO 23/11/2026: tải sau trang).
        const thuTuTai = [];
        page.on('request', r => { if (/connect\.facebook\.net\/en_US\/fbevents\.js/.test(r.url())) thuTuTai.push('fbevents.js'); });
        page.on('load', () => thuTuTai.push('load'));
        await page.goto(goc + duong, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction(() => typeof window.fbq?.callMethod === 'function', null, { timeout: 10000 }).catch(() => {});
        await page.evaluate(() => {
          const a = Object.assign(document.createElement('a'), { href: 'tel:+84283822123', textContent: 'gọi' });
          a.addEventListener('click', e => e.preventDefault());
          document.querySelector('main').prepend(a);
          a.click();
        });
        await cho(200);
        const mong = [['init', MA_PIXEL], ['track', 'PageView'], ['track', 'ViewContent', thamSo(duong, nn)],
          ['track', 'Contact', thamSo(duong, nn)]];
        ok(`${duong}: fbevents.js tải được (bản giả) → nhận init, PageView, ViewContent đã xếp hàng rồi Contact khi bấm, đúng thứ tự`,
           JSON.stringify(lenh) === JSON.stringify(mong), JSON.stringify(lenh));
        ok(`${duong}: fbevents.js chỉ được xin SAU sự kiện load của trang, đúng một lần (không chặn dựng trang)`,
           JSON.stringify(thuTuTai) === JSON.stringify(['load', 'fbevents.js']), JSON.stringify(thuTuTai));
        await page.close();
      }
      await ctxGhi.close();
    }

    // Tắt JavaScript: ảnh noscript của mã gốc gọi đúng địa chỉ đo (bị chặn); ảnh nằm trong <head> nên trình duyệt mở
    // <body> sớm — <body> vẫn phải giữ lớp "ck" và tên trang, trang vẫn đủ.
    {
      const ctxTat = await trinhDuyet.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
      ctxTat.on('requestfinished', r => { if (MAU_META.test(r.url())) toiMeta.push(r.url()); });
      for (const duong of ['/', '/en/menu', '/ko/book']) {
        const page = await ctxTat.newPage();
        const goiMeta = [];
        page.on('request', r => { if (MAU_META.test(r.url())) goiMeta.push(r.url()); });
        await page.goto(goc + duong, { waitUntil: 'load', timeout: 30000 });
        const kq = await page.evaluate(() => ({
          lop: document.body.className, tenTrang: document.body.dataset.pixelTrang ?? null,
          soH1: document.querySelectorAll('h1').length, coChan: !!document.querySelector('footer'),
        }));
        ok(`${duong} (tắt JavaScript): chỉ ảnh noscript gọi Meta, đúng https://www.facebook.com/tr?id=${MA_PIXEL}&ev=PageView&noscript=1`,
           JSON.stringify(goiMeta) === JSON.stringify([`https://www.facebook.com/tr?id=${MA_PIXEL}&ev=PageView&noscript=1`]),
           JSON.stringify(goiMeta));
        ok(`${duong} (tắt JavaScript): <body class="ck" data-pixel-trang="${tenTrangMong(duong)}">, đúng một <h1>, có chân trang`,
           kq.lop.split(/\s+/).includes('ck') && kq.tenTrang === tenTrangMong(duong) && kq.soH1 === 1 && kq.coChan, JSON.stringify(kq));
        await page.close();
      }
      await ctxTat.close();
    }

    // Trang 404 (khongLapChiMuc): không mã gốc, không fbq, không tên trang; bấm link gọi điện không lỗi.
    for (const [duong] of TRANG_KHONG_CO) {
      const page = await ctx.newPage();
      const loiJs = [];
      page.on('pageerror', e => loiJs.push(e.message));
      const html = await (await fetch(goc + duong)).text();
      await page.goto(goc + duong, { waitUntil: 'load', timeout: 30000 });
      const kq = await page.evaluate(() => {
        const a = Object.assign(document.createElement('a'), { href: 'tel:+84283822123', textContent: 'gọi' });
        a.addEventListener('click', e => e.preventDefault());
        document.querySelector('main').prepend(a);
        a.click();
        return { fbq: typeof window.fbq, tenTrang: document.body.dataset.pixelTrang ?? null };
      });
      ok(`${duong} (404): không mã Meta Pixel, không fbq, không data-pixel-trang; bấm link tel: không lỗi`,
         !html.includes(MA_PIXEL) && !/facebook\.(?:net|com\/tr)|fbq\(/.test(html) && kq.fbq === 'undefined' && kq.tenTrang === null && !loiJs.length,
         `${JSON.stringify(kq)} ${loiJs.join(' | ')}`);
      await page.close();
    }

    ok('Không lượt nào tới được Meta trong cả nhóm (CI không gửi lượt đo nào lên Beeftown Pixel thật)', toiMeta.length === 0,
       toiMeta.slice(0, 3).join(' | '));
    await ctx.close();
  });

  // =========================================================================
  // Nút ngôn ngữ trên thanh đầu trang (từ 768px; Khánh quyết 23/11/2026 — thay ba chữ in liền nhau): một nút quả địa
  // cầu ghi mã thứ tiếng đang xem, bấm thì thả xuống ba thứ tiếng. Là <details> nên tắt JavaScript vẫn mở / đóng được.
  // Mã, tên thứ tiếng và đường dẫn tương ứng chép tay — không đọc lib/chu.ts (cùng lý do với NHAN_MENU).
  const MA_NN = { vi: 'VI', en: 'EN', ko: 'KO' };
  const TEN_NN = ['Tiếng Việt', 'English', '한국어'];
  const BAN_CUA = { '/': ['/', '/en', '/ko'], '/en/menu': ['/thuc-don', '/en/menu', '/ko/menu'], '/ko/book': ['/dat-ban', '/en/book', '/ko/book'] };
  await nhom('13 · NÚT NGÔN NGỮ Ở 768 VÀ 1440 PX: MỘT NÚT QUẢ ĐỊA CẦU THẢ XUỐNG BA THỨ TIẾNG; TẮT JAVASCRIPT VẪN MỞ / ĐÓNG; Esc, BẤM RA NGOÀI, TAB, CHỈ MỞ MỘT BẢNG', async () => {
    for (const rong of [768, 1440]) {
      for (const coJs of [false, true]) {
        const ctx = await trinhDuyet.newContext({ viewport: { width: rong, height: 900 }, javaScriptEnabled: coJs });
        const page = await ctx.newPage();
        for (const [duong, banKhac] of Object.entries(BAN_CUA)) {
          await page.goto(goc + duong);
          const nn = ngonNguCua(duong);
          const nhan = `${duong} · ${rong}px · ${coJs ? 'có' : 'TẮT'} JavaScript`;
          const hop = page.locator('header details.dt-ngon-ngu');
          const nut = hop.locator('summary');
          const bang = hop.locator('.dt-nn-bang');
          const mo = () => hop.evaluate(d => d.open).catch(() => null);
          const tot = [];
          if (!ok(`${nhan}: thanh có đúng một nút ngôn ngữ, lúc đầu đóng, ghi «${MA_NN[nn]}» cạnh quả địa cầu, danh sách chưa hiện`,
                  await hop.count() === 1 && await nut.isVisible() && await mo() === false && !(await bang.isVisible())
                    && motDong(await nut.locator('.dt-ma-nn').innerText()) === MA_NN[nn] && await nut.locator('svg').count() === 1,
                  await nut.innerText().catch(() => ''))) {
            await chupLoi(page, `nut-ngon-ngu${duong.replace(/\//g, '-')}-${rong}-${coJs ? 'js' : 'khong-js'}`);
            continue;
          }
          await nut.click();
          const muc = await bang.locator('.doi-ngon-ngu').evaluateAll(es => es.map(e => ({
            chu: e.textContent.trim(), the: e.tagName, href: e.getAttribute('href'), dangXem: e.getAttribute('aria-current') === 'true',
            hien: e.checkVisibility(),
          })));
          tot.push(ok(`${nhan}: bấm nút → mở, thấy ${TEN_NN.join(' · ')} đúng thứ tự`,
            await mo() === true && muc.length === 3 && muc.every(m => m.hien) && muc.map(m => m.chu).join('|') === TEN_NN.join('|'), JSON.stringify(muc)));
          const viTri = ['vi', 'en', 'ko'].indexOf(nn);
          tot.push(ok(`${nhan}: thứ tiếng đang xem không phải link (aria-current), hai thứ tiếng kia là link tới đúng trang tương ứng`,
            muc.every((m, i) => (i === viTri ? m.dangXem && m.the !== 'A' : !m.dangXem && m.the === 'A' && m.href === banKhac[i])), JSON.stringify(muc)));
          const khung = await page.evaluate(() => {
            const b = document.querySelector('header .dt-nn-bang').getBoundingClientRect();
            return { trai: b.left, phai: b.right, tren: b.top, day: document.querySelector('header.dau-trang').getBoundingClientRect().bottom,
              rong: document.documentElement.clientWidth, tran: document.documentElement.scrollWidth - innerWidth };
          });
          tot.push(ok(`${nhan}: danh sách nằm trọn trong màn hình, treo ngay dưới thanh đầu trang, không làm trang tràn ngang`,
            khung.trai >= 0 && khung.phai <= khung.rong + 0.5 && Math.abs(khung.tren - khung.day) <= 1.5 && khung.tran <= 1, JSON.stringify(khung)));
          const gd = await page.evaluate(doGiaoDien);
          for (const khoa of ['vungCham', 'dauTrang', 'ngonNgu', 'nenTrongBang', 'bieuTuong']) {
            tot.push(ok(`${nhan}: danh sách đang mở — ${PHEP_DO[khoa]}`, gd[khoa]?.length === 0, (gd[khoa] ?? ['không đo được']).slice(0, 4).join(' | ')));
          }
          if (rong < 1080) {
            // Nút danh mục và nút ngôn ngữ cùng name="dau-trang": mở cái này thì cái kia đóng (cả khi tắt JavaScript).
            const menu = page.locator('details.menu-gon');
            const hopTrenThanh = () => page.evaluate(() => ['.dt-ngon-ngu > summary', '.dt-hoi-ban', '.menu-gon > summary']
              .map(c => { const k = document.querySelector(`header ${c}`).getBoundingClientRect(); return [Math.round(k.left), Math.round(k.width)]; }));
            const truocMo = await hopTrenThanh();
            await menu.locator('summary').click();
            tot.push(ok(`${nhan}: đang mở danh sách mà bấm Danh mục → danh sách đóng, danh mục mở (chỉ một bảng một lúc)`,
              await mo() === false && await menu.evaluate(d => d.open)));
            // Lỗi thật 23/11/2026: nút danh mục đổi bề rộng ("Danh mục" ↔ "Đóng") nên nút ngôn ngữ và Đặt bàn xô đi 37px
            // ngay lúc danh mục đóng — đóng lúc nhấn chuột xuống (mất tiêu điểm), nên cú bấm nhả ra ngoài nút và mất.
            const sauMo = await hopTrenThanh();
            tot.push(ok(`${nhan}: mở danh mục không làm nút ngôn ngữ, Đặt bàn, Danh mục xô lệch hay đổi bề rộng`,
              JSON.stringify(sauMo) === JSON.stringify(truocMo), `trước ${JSON.stringify(truocMo)} · sau ${JSON.stringify(sauMo)}`));
            await nut.click();
            tot.push(ok(`${nhan}: đang mở danh mục mà bấm nút ngôn ngữ → danh mục đóng, danh sách mở`,
              await mo() === true && !(await menu.evaluate(d => d.open))));
          }
          if (coJs) {
            await page.keyboard.press('Escape');
            tot.push(ok(`${nhan}: Esc → đóng, tiêu điểm về nút ngôn ngữ`, await mo() === false && await nut.evaluate(s => document.activeElement === s)));
            await nut.click();
            // Góc dưới bên trái màn hình: chắc chắn ngoài danh sách (ở 768px danh sách che giữa câu tiêu đề).
            await page.mouse.click(8, page.viewportSize().height - 8);
            tot.push(ok(`${nhan}: mở rồi bấm ra ngoài (góc dưới trang) → đóng`, await mo() === false));
            // Bàn phím: Enter mở, Tab đi qua hai link, Tab ra khỏi link cuối thì đóng (bảng không che phần tử vừa nhận tiêu điểm).
            await nut.focus();
            await page.keyboard.press('Enter');
            const diQua = [];
            for (let i = 0; i < 2; i++) {
              await page.keyboard.press('Tab');
              diQua.push(await page.evaluate(() => {
                const a = document.activeElement, cs = getComputedStyle(a);
                return { trong: !!a.closest('.dt-nn-bang'), vong: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2 };
              }));
            }
            tot.push(ok(`${nhan}: Enter mở, Tab qua hai link — tiêu điểm trong danh sách, có vòng focus, danh sách còn mở`,
              diQua.every(t => t.trong && t.vong) && await mo() === true, JSON.stringify(diQua)));
            await page.keyboard.press('Tab');
            tot.push(ok(`${nhan}: Tab ra khỏi link cuối → danh sách đóng`, await mo() === false));
          } else {
            await nut.click();
            tot.push(ok(`${nhan}: bấm nút lần nữa → đóng`, await mo() === false && !(await bang.isVisible())));
          }
          // Bấm một thứ tiếng khác → tới đúng trang tương ứng, nút ở trang đó ghi mã mới.
          const khac = (viTri + 1) % 3;
          await nut.click();
          await Promise.all([page.waitForURL(u => new URL(u).pathname === banKhac[khac], { timeout: 15_000 }).catch(() => {}),
            bang.locator('a.doi-ngon-ngu', { hasText: TEN_NN[khac] }).click()]);
          tot.push(ok(`${nhan}: bấm «${TEN_NN[khac]}» → tới ${banKhac[khac]}, nút ghi «${Object.values(MA_NN)[khac]}», danh sách đóng`,
            new URL(page.url()).pathname === banKhac[khac] && motDong(await page.locator('header .dt-ma-nn').innerText()) === Object.values(MA_NN)[khac]
              && await mo() === false, page.url()));
          if (tot.includes(false)) await chupLoi(page, `nut-ngon-ngu${duong.replace(/\//g, '-')}-${rong}-${coJs ? 'js' : 'khong-js'}`);
        }
        await ctx.close();
      }
    }
  });
} catch (e) {
  ok('Chạy được đến cuối', false, e.stack || e.message);
} finally {
  await trinhDuyet?.close().catch(() => {});
  tatMayChu(mayChu?.p);
}
// --chi xin một số mà không nhóm nào mang số đó được chạy (gõ nhầm, nhóm bị --url bỏ qua): đỏ, không bao giờ đạt suông.
CHON_NHOM.baoNhomThieu(ok, 'nhóm bị --url bỏ qua');

console.log('\n' + '='.repeat(60));
if (hong === 0) {
  console.log(`\x1b[32m\x1b[1mTẤT CẢ ${dat} KIỂM TRA TRÌNH DUYỆT ĐỀU ĐẠT${CHON_NHOM.ghiChu}\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m${hong} HỎNG / ${dat + hong} KIỂM TRA${CHON_NHOM.ghiChu}\x1b[0m`);
  for (const l of loi) console.log(`  \x1b[31m· ${l}\x1b[0m`);
  if (existsSync(ANH_LOI)) console.log(`Ảnh chụp lúc hỏng: ${ANH_LOI}`);
}
process.exit(hong === 0 ? 0 : 1);
