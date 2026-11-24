/**
 * TRANG CÔNG KHAI — SEO CHUNG TOÀN SITE (PR "SEO chung", 24/11/2026)
 * ==================================================================
 * Chạy: node test/test-cong-khai-seo-chung.mjs
 *
 * Giữ những điều rà soát SEO 23/11/2026 yêu cầu cho cả site (Khánh duyệt làm 24/11/2026), để không ai gỡ nhầm:
 *   1. JSON-LD Restaurant: telephone E.164 (+84…), hasMenu tuyệt đối đúng thứ tiếng và luôn có, image tuyệt đối, sameAs có
 *      Zalo OA khi đã công bố, @id; khối WebSite thứ hai trỏ về nhà hàng bằng @id; priceRange = khoảng chi tiêu Khánh nói 24/11/2026; vẫn KHÔNG có đánh giá.
 *   2. Chân trang: link viết đánh giá Google ở mọi trang, đúng thứ tiếng; khối pháp nhân có nhãn "Trụ sở công ty".
 *   3. Trang đang hoạt động: không còn ba cụm nói về "đội ngũ khai trương" (viết ghép ở nhóm 3 để git grep không bắt chính file này).
 *   4. Trang chủ: tiêu đề tiếng Việt có "Quận 1 cũ" (≤ 65 ký tự), h1 nói loại hình nhà hàng, đoạn giới thiệu 40–60 từ ở cả ba
 *      thứ tiếng, chỉ dựng từ dữ kiện đã có.
 *   5. Trang Đến Beeftown: khối hỏi đáp (giờ — cùng cổng với chân trang, đường lên, đặt bàn, "Beeftown này ở đâu?") và link
 *      đánh giá; giá mỗi người và chỗ gửi xe đúng lời Khánh 24/11/2026; không mốc đường, khoảng cách.
 *   6. og:image:alt đúng thứ tiếng của trang.
 *
 * Phần dựng thật (HTML sau khi build, trình duyệt) kiểm ở web/kiem-tra/trinh-duyet.mjs và bằng tay — file này đọc mã nguồn và
 * chạy các hàm thuần.
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const SRC = join(WEB, 'src');
const LIB = join(SRC, 'lib');
const nap = f => import(pathToFileURL(join(LIB, f)).href);
const doc = (...p) => readFileSync(join(...p), 'utf8');
const mau = s => s.replace(/\r\n/g, '\n');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRANG CÔNG KHAI: SEO CHUNG');

const { chu, NGON_NGU, THUONG_HIEU, DIA_CHI_NHA_HANG } = await nap('chu.ts');
const { soDienThoaiE164, lienHe, LINK_DANH_GIA_GOOGLE, KHOANG_GIA_MOI_NGUOI } = await nap('trang-cong-khai.ts');
const { PHUONG_QUAN } = await import(pathToFileURL(join(WEB, 'kiem-tra', 'mau-dia-diem.mjs')).href);
const { timChuoiCam, KHOANG_GIA_DA_DUYET } = await nap('chuoi-cam.js');
const { docNoiDung } = await nap('noi-dung.ts');

const NEN = await docNoiDung('vi', null);
const nd = (them = {}) => ({ ...NEN, ...structuredClone(them) });
const HANGUL = /[가-힣]/u;
const CHU_VIET = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/iu;
const tu = s => s.trim().split(/\s+/u).length;

const trang = mau(doc(SRC, 'layouts', 'Trang.astro'));
const chan = mau(doc(SRC, 'components', 'ChanTrang.astro'));
const kmd = mau(doc(SRC, 'components', 'KhoiMoDau.astro'));
const denBeeftown = mau(doc(SRC, 'components', 'TrangDenBeeftown.astro'));

// Mọi file PR này sở hữu (trừ file test): mã nguồn không còn câu nói về giai đoạn ra mắt.
const FILE_SO_HUU = [
  ['layouts', 'Trang.astro'], ['lib', 'trang-cong-khai.ts'], ['lib', 'chu.ts'], ['components', 'ChanTrang.astro'],
  ['components', 'KhoiMoDau.astro'], ['components', 'TrangRaMat.astro'], ['components', 'TrangDenBeeftown.astro'],
  ['components', 'CauHoi.astro'], ['pages', 'index.astro'], ['pages', 'en', 'index.astro'], ['pages', 'ko', 'index.astro'],
  ['pages', 'den-beeftown.astro'], ['pages', 'en', 'visit.astro'], ['pages', 'ko', 'visit.astro'],
];

// ===========================================================================
await nhom('1 · JSON-LD RESTAURANT VÀ WEBSITE', async () => {
  ok('soDienThoaiE164: "tel:0961245124" → "+84961245124"', soDienThoaiE164('tel:0961245124') === '+84961245124', String(soDienThoaiE164('tel:0961245124')));
  ok('soDienThoaiE164: "tel:84961245124" (đã có mã nước, thiếu +) → "+84961245124"', soDienThoaiE164('tel:84961245124') === '+84961245124');
  ok('soDienThoaiE164: số đã có "+" thì giữ ("tel:+84961245124")', soDienThoaiE164('tel:+84961245124') === '+84961245124');
  ok('soDienThoaiE164: số 11 chữ số trong nước ("tel:02838221234") → "+842838221234"', soDienThoaiE164('tel:02838221234') === '+842838221234', String(soDienThoaiE164('tel:02838221234')));
  ok('soDienThoaiE164: đầu số tổng đài không bị đoán ("tel:19001234" → giữ chữ số)', soDienThoaiE164('tel:19001234') === '19001234', String(soDienThoaiE164('tel:19001234')));
  ok('soDienThoaiE164: không phải tel: / null / quá ngắn → null', soDienThoaiE164(null) === null && soDienThoaiE164('mailto:a@b.vn') === null && soDienThoaiE164('tel:123') === null);
  ok('hotline đã công bố "0961 245 124" → lienHe().goi → telephone "+84961245124"; trang vẫn in "0961 245 124"',
     soDienThoaiE164(lienHe(nd({ hotline: '0961 245 124' })).goi) === '+84961245124' && lienHe(nd({ hotline: '0961 245 124' })).hotline === '0961 245 124');
  ok('hotline có chú thích "0961 245 124 (Zalo)" vẫn ra số E.164 sạch', soDienThoaiE164(lienHe(nd({ hotline: '0961 245 124 (Zalo)' })).goi) === '+84961245124');
  ok('Chưa công bố hotline → không có telephone (lienHe().goi rỗng; trang không bịa số)', lienHe(nd({ hotline: null })).goi === null);

  ok('Trang.astro: telephone dùng soDienThoaiE164', /duLieuCoCauTruc\.telephone = soDienThoaiE164\(lh\.goi\)/.test(trang));
  ok('Trang.astro: hasMenu luôn có khi biết tên miền — KHÔNG còn bị cổng hien_thuc_don chặn — và theo thứ tiếng của trang (duongDanTuongUng)',
     /if \(goc\) duLieuCoCauTruc\.hasMenu = goc \+ duongDanTuongUng\('\/thuc-don', ngonNgu\);/.test(trang) && !trang.includes('nd.hien_thuc_don === true && goc'));
  ok('Trang.astro: image tuyệt đối = ảnh og:image (anhChiaSe.url), chỉ khi biết tên miền', /if \(goc\) duLieuCoCauTruc\.image = anhChiaSe\.url;/.test(trang));
  ok('Trang.astro: ảnh dự phòng của og:image có thật trong bản build (web/public/thuong-hieu/chia-se-1200x630.png)', (() => {
    try { return readFileSync(join(WEB, 'public', 'thuong-hieu', 'chia-se-1200x630.png')).length > 1000 && trang.includes('/thuong-hieu/chia-se-1200x630.png'); } catch { return false; }
  })());
  ok('Trang.astro: sameAs có Zalo OA (lh.zalo) cùng cổng với Facebook, Instagram, TikTok', /const sameAs = \[lh\.facebook, lh\.instagram, lh\.tiktok, lh\.zalo\]\.filter\(Boolean\);/.test(trang));
  ok('lienHe: Zalo OA chỉ nhận https khi đã công bố; link không an toàn thì coi như chưa công bố',
     lienHe(nd({ zalo_oa_url: 'https://zalo.me/1234567890' })).zalo === 'https://zalo.me/1234567890'
       && lienHe(nd({ zalo_oa_url: 'javascript:alert(1)' })).zalo === null && lienHe(nd({ zalo_oa_url: null })).zalo === null);
  ok('Trang.astro: Restaurant có @id, WebSite có @id riêng và publisher trỏ về @id của nhà hàng',
     /'@id': idNhaHang,/.test(trang) && /'@type': 'WebSite',/.test(trang) && /publisher: \{ '@id': idNhaHang \}/.test(trang) && trang.includes("'@id': `${goc}/#trang-web`"));
  ok('Trang.astro: WebSite có name, url và inLanguage đủ ba thứ tiếng', /name: THUONG_HIEU\.ten,\n\s+url: `\$\{goc\}\/`,\n\s+inLanguage: \[\.\.\.NGON_NGU\],/.test(trang));
  ok('Trang.astro: khối WebSite cùng cổng khongLapChiMuc với Restaurant (trang 404 không có JSON-LD nào)',
     /\{!khongLapChiMuc && duLieuTrangWeb && <script type="application\/ld\+json"/.test(trang));
  // Chỉ xét phần mã (bỏ chú thích): priceRange / đánh giá chưa được duyệt, không có trường nào trong JSON-LD.
  const maTrang = trang.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok('Trang.astro: không có aggregateRating, review trong mã JSON-LD (chưa có đánh giá thật nào)', !/aggregateRating|\breview\b/.test(maTrang));
  ok('priceRange = "300.000–500.000 VND" (lời Khánh 24/11/2026), một giá trị cho cả ba thứ tiếng, dưới 100 ký tự, in qua KHOANG_GIA_MOI_NGUOI',
     KHOANG_GIA_MOI_NGUOI === '300.000–500.000 VND' && [...KHOANG_GIA_MOI_NGUOI].length < 100 && /priceRange: KHOANG_GIA_MOI_NGUOI,/.test(trang), KHOANG_GIA_MOI_NGUOI);
  ok('priceRange qua máy quét chữ cấm (ngoại lệ khoảng giá đã duyệt)', timChuoiCam(KHOANG_GIA_MOI_NGUOI).length === 0);
  ok('Trang.astro: không ghi tên phường nào trong mã JSON-LD', !PHUONG_QUAN.tim(maTrang));
});

// ===========================================================================
await nhom('2 · CHÂN TRANG: LINK ĐÁNH GIÁ GOOGLE VÀ NHÃN TRỤ SỞ CÔNG TY', async () => {
  ok('LINK_DANH_GIA_GOOGLE là link đánh giá đã xác minh của Google Business Profile', LINK_DANH_GIA_GOOGLE === 'https://g.page/r/CYQQxkRqfr6eEBM/review', LINK_DANH_GIA_GOOGLE);
  const NHAN = { vi: 'Viết đánh giá trên Google', en: 'Review us on Google', ko: '구글 리뷰 남기기' };
  const TRU_SO = { vi: 'Trụ sở công ty', en: 'Company office', ko: '회사 사무소' };
  for (const nn of NGON_NGU) {
    ok(`chu.ts [${nn}]: nhãn link đánh giá là "${NHAN[nn]}"`, chu(nn).danhGiaGoogle === NHAN[nn], chu(nn).danhGiaGoogle);
    ok(`chu.ts [${nn}]: nhãn pháp nhân là "${TRU_SO[nn]}"`, chu(nn).truSoCongTy === TRU_SO[nn], chu(nn).truSoCongTy);
    ok(`chu.ts [${nn}]: hai nhãn mới không dính chữ cấm`, timChuoiCam(chu(nn).danhGiaGoogle).length === 0 && timChuoiCam(chu(nn).truSoCongTy).length === 0);
  }
  ok('ChanTrang.astro: link đánh giá dùng LINK_DANH_GIA_GOOGLE, nhãn t.danhGiaGoogle, rel="noopener", không có điều kiện (mọi trang)',
     chan.includes('<p class="ct-danh-gia"><a href={LINK_DANH_GIA_GOOGLE} rel="noopener">{t.danhGiaGoogle}'));
  ok('ChanTrang.astro: nhãn t.truSoCongTy đứng ngay trên dòng tên công ty, trong khối .phap-nhan',
     /<div class="phap-nhan">\s*<p class="chan-dong chan-nhan">\{t\.truSoCongTy\}<\/p>\s*<p class="chan-dong"><span class="lien" lang="vi">\{PHAP_NHAN\.ten\}/.test(chan));
  ok('ChanTrang.astro: chữ pháp nhân giữ nguyên (địa chỉ in từ PHAP_NHAN.diaChi, không chép tay)', chan.includes('<p class="chan-dong" lang="vi">{PHAP_NHAN.diaChi}</p>'));
  ok('ChanTrang.astro: dải tuyển dụng viết như nhà hàng đang hoạt động',
     chan.includes("vi: 'Beeftown đang tuyển nhân viên quầy thịt, bếp và sảnh.'") && chan.includes("en: 'Beeftown is hiring for the butcher counter, kitchen and hall.'")
       && chan.includes("ko: 'Beeftown에서 정육, 주방, 홀 직원을 모집하고 있어요.'"));
});

// ===========================================================================
await nhom('3 · KHÔNG CÒN CÂU GIAI ĐOẠN RA MẮT TRONG FILE CỦA PR', async () => {
  // Ba cụm Khánh yêu cầu bỏ (24/11/2026). Các cụm giai đoạn ra mắt khác còn trong vài chú thích cũ để NÓI là đã bỏ — không xét ở đây.
  const CAM = new RegExp(['đội mở' + ' cửa', 'opening' + ' team', '오픈' + ' 팀'].join('|'), 'iu');
  for (const f of FILE_SO_HUU) {
    const cam = mau(doc(SRC, ...f)).split('\n').map((d, i) => ({ d, i: i + 1 })).filter(x => CAM.test(x.d));
    ok(`${f.join('/')}: không còn ba cụm "đội ngũ khai trương" (vi / en / ko)`, cam.length === 0, cam.map(x => `dòng ${x.i}`).join(', '));
  }
  for (const nn of NGON_NGU) {
    const t = chu(nn);
    ok(`chu.ts [${nn}]: câu tuyển dụng (tuyenDungDan) bắt đầu bằng tên Beeftown, không nói về đội ngũ khai trương`, t.tuyenDungDan.startsWith('Beeftown') && !CAM.test(t.tuyenDungDan), t.tuyenDungDan.slice(0, 60));
    ok(`chu.ts [${nn}]: theoDoiPhu không nhắc ngày mở`, !/opening date|오픈 일정/iu.test(t.theoDoiPhu), t.theoDoiPhu);
  }
});

// ===========================================================================
await nhom('4 · TRANG CHỦ: TIÊU ĐỀ, H1, ĐOẠN GIỚI THIỆU', async () => {
  const tieuDe = chu('vi').tieuDeTrangChu;
  ok('vi: tiêu đề trang chủ có "Quận 1 cũ"', tieuDe.includes('Quận 1 cũ'), tieuDe);
  ok('vi: tiêu đề trang chủ ≤ 65 ký tự', [...tieuDe].length <= 65, `${[...tieuDe].length} ký tự`);
  ok('vi: tiêu đề trang chủ nói loại hình "nhà hàng bò nướng tại bàn"', /nhà hàng bò nướng tại bàn/iu.test(tieuDe), tieuDe);
  for (const nn of NGON_NGU) ok(`[${nn}] tiêu đề trang chủ không tên phường, không chữ cấm`, !PHUONG_QUAN.tim(chu(nn).tieuDeTrangChu) && timChuoiCam(chu(nn).tieuDeTrangChu).length === 0, chu(nn).tieuDeTrangChu);

  ok('KhoiMoDau.astro: dòng hiệu (loại hình) nằm TRONG <h1>, trước hai câu chính; không còn <p class="hieu"> riêng',
     kmd.includes('<h1 id="kmd-tieu-de"><span class="hieu">{t.dongHieu}</span>') && !kmd.includes('<p class="hieu">{t.dongHieu}</p>'));
  ok('KhoiMoDau.astro: giữa loại hình và câu chính có dấu chấm ẩn (an-chu) + một dấu cách, để đọc thành hai câu',
     kmd.includes('<span class="an-chu">.</span>{\' \'}{cauChinh.map('));
  ok('H1 của ba trang chủ đều nói loại hình: dongHieu vi/en/ko có đủ, mỗi thứ tiếng một chữ riêng',
     new Set(NGON_NGU.map(nn => chu(nn).dongHieu)).size === 3 && /nhà hàng/iu.test(chu('vi').dongHieu) && /restaurant/iu.test(chu('en').dongHieu) && /전문점/u.test(chu('ko').dongHieu));
  ok('Ba trang chủ (vi/en/ko) cùng dùng TrangRaMat → KhoiMoDau (một nguồn h1)',
     ['index.astro', 'en/index.astro', 'ko/index.astro'].every(f => doc(SRC, 'pages', f).includes('<TrangRaMat')) && mau(doc(SRC, 'components', 'TrangRaMat.astro')).includes('<KhoiMoDau'));

  const KHU = { vi: 'Quận 1 cũ', en: 'former District 1', ko: '구 1군' };
  for (const nn of NGON_NGU) {
    // Bản tiếng Việt mang "{diaChi}" — KhoiMoDau.astro thay bằng địa chỉ đang in trên trang; ở đây thay bằng địa chỉ cố định.
    const g = chu(nn).gioiThieuNhaHang.replace('{diaChi}', DIA_CHI_NHA_HANG);
    ok(`[${nn}] đoạn giới thiệu trang chủ dài 40–60 từ`, tu(g) >= 40 && tu(g) <= 60, `${tu(g)} từ`);
    ok(`[${nn}] đoạn giới thiệu nói loại hình, tầng 3, 63 Hồ Tùng Mậu và khu vực "${KHU[nn]}"`, g.includes('Hồ Tùng Mậu') && g.includes('63') && g.includes(KHU[nn]), g.slice(0, 120));
    ok(`[${nn}] đoạn giới thiệu không tên phường, không chữ cấm, không giờ / giá / chỗ gửi xe`, !PHUONG_QUAN.tim(g) && timChuoiCam(g).length === 0 && !/\d{1,2}:\d{2}|₫|\d\s?đ|VND|gửi xe|parking|주차/iu.test(g));
  }
  ok('[vi] đoạn giới thiệu mở đầu đúng câu "Beeftown là nhà hàng bò nướng tại bàn ở Tầng 3, 63 Hồ Tùng Mậu, Quận 1 cũ, TP.HCM." (sau khi thay địa chỉ)',
     chu('vi').gioiThieuNhaHang.replace('{diaChi}', DIA_CHI_NHA_HANG).startsWith('Beeftown là nhà hàng bò nướng tại bàn ở Tầng 3, 63 Hồ Tùng Mậu, Quận 1 cũ, TP.HCM.'));
  ok('[vi] địa chỉ trong đoạn giới thiệu là "{diaChi}" (thay lúc dựng trang bằng diaChi(nd) — bản công bố trong /noi-bo thắng), không viết cứng',
     chu('vi').gioiThieuNhaHang.includes('{diaChi}') && !chu('vi').gioiThieuNhaHang.includes('Hồ Tùng Mậu')
       && kmd.includes("const gioiThieuNhaHang = t.gioiThieuNhaHang.replace('{diaChi}', () => diaChi(nd));"));
  ok('[ko] đoạn giới thiệu viết bằng tiếng Hàn, [en] không có chữ Hàn', HANGUL.test(chu('ko').gioiThieuNhaHang) && !HANGUL.test(chu('en').gioiThieuNhaHang));
  ok('KhoiMoDau.astro in đoạn giới thiệu nhà hàng SAU hàng địa điểm (dưới ảnh, không đẩy ảnh tải ngay xuống dưới màn hình đầu); đoạn cũ trên ảnh giữ nguyên',
     kmd.includes('<p class="dan kmd-gioi-thieu">{gioiThieuNhaHang}</p>') && kmd.indexOf('kmd-gioi-thieu">') > kmd.indexOf('class="kmd-hinh"')
       && kmd.includes('<p class="dan kmd-dan">{t.gioiThieu}</p>') && kmd.indexOf('kmd-gioi-thieu">') > kmd.indexOf('<ul class="kmd-thong-tin">'));
});

// ===========================================================================
await nhom('5 · /DEN-BEEFTOWN: HỎI ĐÁP VÀ LINK ĐÁNH GIÁ', async () => {
  ok('TrangDenBeeftown.astro: giờ mở cửa lấy từ gio-mo-cua.ts (cauGioMoCua + docGioMoCuaTrongLuot), cùng cổng với chân trang',
     denBeeftown.includes("import { cauGioMoCua, docGioMoCuaTrongLuot } from '../lib/gio-mo-cua';")
       && denBeeftown.includes('const cauGio = cauGioMoCua(await docGioMoCuaTrongLuot(Astro.request, nd), ngonNgu);'));
  ok('TrangDenBeeftown.astro: câu hỏi giờ chỉ in khi có cauGio; không giờ nào viết tay (không "11:00", "23:00")',
     /\{cauGio && \(\s*<div class="db-hd-muc">\s*<dt>\{c\.hdGioH\}/.test(denBeeftown) && !/\b(?:0?\d|1\d|2[0-3]):[0-5]\d\b/.test(denBeeftown.replace(/<style>[\s\S]*<\/style>/, '')));
  ok('TrangDenBeeftown.astro: câu hỏi đặt bàn chỉ khi có kênh thật (coKenh), dẫn tới /dat-ban và hotline đã công bố (lh.goi)',
     /\{coKenh && \(\s*<div class="db-hd-muc">\s*<dt>\{c\.hdDatH\}/.test(denBeeftown) && denBeeftown.includes("duongDanTuongUng('/dat-ban', ngonNgu)") && denBeeftown.includes('{lh.goi && <p>{c.hdGoi} <a class="lien-ket" href={lh.goi}>{lh.hotline}</a></p>}'));
  ok('TrangDenBeeftown.astro: có câu "Beeftown này ở đâu?" trả lời bằng "Beeftown · <địa chỉ>" lấy từ diaChi(nd)',
     denBeeftown.includes('<dt>{c.hdOdauH}</dt>') && denBeeftown.includes('<p>Beeftown · <span lang="vi">{cumDc.map(') && denBeeftown.includes('const cumDc = cumDiaChi(dc);'));
  ok('TrangDenBeeftown.astro: đường lên dùng đúng câu chỉ đường t.loiLen (lối riêng cạnh GS25, thang máy lên Tầng 3)', denBeeftown.includes('<p>{t.loiLen}</p>'));
  ok('TrangDenBeeftown.astro: có link đánh giá Google (LINK_DANH_GIA_GOOGLE, rel="noopener")', denBeeftown.includes('<a class="lien-ket" href={LINK_DANH_GIA_GOOGLE} rel="noopener">{t.danhGiaGoogle}'));
  const phanChu = denBeeftown.slice(denBeeftown.indexOf('hdHieu:'), denBeeftown.indexOf('// --- Ba bước'));
  ok('Khối hỏi đáp không nhắc mốc đường, khoảng cách, lối xe lăn (chưa ai xác nhận)',
     !/landmark|lối cho xe lăn|wheelchair|\d+\s?(?:km|mét|metres|meters|phút đi bộ|minutes? on foot)/iu.test(phanChu), phanChu.length + ' ký tự');
  // Khoảng chi tiêu và chỗ gửi xe: đúng lời Khánh 24/11/2026, ba thứ tiếng, không thêm điều Khánh chưa nói (VAT, đồ uống, loại xe, phí).
  const gt = khoa => phanChu.match(new RegExp(`${khoa}:\\s*\\{([\\s\\S]*?)\\},?\\n`))?.[1] ?? '';
  const gtD = { gia: gt('hdGiaD'), xe: gt('hdXeD') };
  ok('Hỏi đáp: "Ăn ở Beeftown khoảng bao nhiêu tiền?" → "Khoảng 300.000–500.000 đ/người." (en "About 300,000–500,000 VND per person.", ko "1인당 약 300,000–500,000동이에요.")',
     gtD.gia.includes("'Khoảng 300.000–500.000 đ/người.'") && gtD.gia.includes("'About 300,000–500,000 VND per person.'") && gtD.gia.includes("'1인당 약 300,000–500,000동이에요.'")
       && denBeeftown.includes("vi: 'Ăn ở Beeftown khoảng bao nhiêu tiền?'") && denBeeftown.includes('<dt>{c.hdGiaH}</dt>') && denBeeftown.includes('<dd><p>{c.hdGiaD}</p></dd>'));
  ok('Hỏi đáp: "Gửi xe ở đâu?" → "Có chỗ gửi xe ngay trước nhà hàng." (en "Parking is right in front of the restaurant.", ko "식당 바로 앞에 주차할 수 있어요.")',
     gtD.xe.includes("'Có chỗ gửi xe ngay trước nhà hàng.'") && gtD.xe.includes("'Parking is right in front of the restaurant.'") && gtD.xe.includes("'식당 바로 앞에 주차할 수 있어요.'")
       && denBeeftown.includes("vi: 'Gửi xe ở đâu?'") && denBeeftown.includes('<dt>{c.hdXeH}</dt>') && denBeeftown.includes('<dd><p>{c.hdXeD}</p></dd>'));
  ok('Hỏi đáp giá và gửi xe không thêm điều Khánh chưa nói: không VAT, đồ uống, loại xe, phí, miễn phí, tên bãi',
     !/VAT|부가세|đồ uống|drinks?|음료|xe máy|ô tô|oto|motorbike|\bcars?\b|오토바이|자동차|phí|\bfees?\b|free|miễn|무료|bãi|lot\b/iu.test(`${gtD.gia}\n${gtD.xe}`), `${gtD.gia}${gtD.xe}`.replace(/\s+/g, ' ').slice(0, 160));
  ok('Hỏi đáp giá nằm ngoài cổng: không phụ thuộc giờ / kênh đặt bàn (luôn in), cùng chỗ gửi xe',
     !/\{cauGio && \([\s\S]{0,80}hdGiaH/.test(denBeeftown) && !/\{coKenh && \([\s\S]{0,80}hdGiaH/.test(denBeeftown) && !/\{coKenh && \([\s\S]{0,80}hdXeH/.test(denBeeftown));
  for (const nn of NGON_NGU) {
    const bo = nn === 'vi' ? 0 : nn === 'en' ? 1 : 2;
    const khoangGia = [gtD.gia, gtD.xe].map(s => [...s.matchAll(/(vi|en|ko): '([^']*)'/g)].map(m => m[2])[bo]);
    ok(`[${nn}] câu giá và gửi xe qua máy quét chữ cấm (khoảng giá đã duyệt là ngoại lệ duy nhất)`, khoangGia.every(c => c && timChuoiCam(c).length === 0), khoangGia.join(' | '));
  }
  ok('Chữ cấm: đúng khoảng 300.000–500.000 (vi / en / ko) được qua; con số khác vẫn bị chặn',
     ['Khoảng 300.000–500.000 đ/người.', 'About 300,000–500,000 VND per person.', '1인당 약 300,000–500,000동이에요.', '300.000–500.000 VND'].every(c => timChuoiCam(c).length === 0)
       && ['Khoảng 300.000–600.000 đ/người.', 'Ribeye 250.000 đ', '300.000 đ', '500.000đ', 'About 300,000–450,000 VND', '300.000–500.000 đ và 250.000 đ'].every(c => timChuoiCam(c).length > 0));
  ok('chuoi-cam.js: KHOANG_GIA_DA_DUYET đúng một ngoại lệ, chỉ khoảng 300–500 nghìn', KHOANG_GIA_DA_DUYET.source.includes('300') && KHOANG_GIA_DA_DUYET.source.includes('500') && !/\\d\+/.test(KHOANG_GIA_DA_DUYET.source), KHOANG_GIA_DA_DUYET.source);
  ok('Khối hỏi đáp không ghi tên phường', !PHUONG_QUAN.tim(phanChu));
  // Mỗi câu hỏi/đáp ở ba thứ tiếng: đếm khóa hd* trong dich() — mỗi khóa phải đủ vi, en, ko (dich() báo lỗi biên dịch nếu thiếu, ở đây giữ cứng số khóa).
  const khoaHd = [...phanChu.matchAll(/^\s{2}(hd[A-Za-z]+):\s*\{/gm)].map(m => m[1]);
  ok('Khối hỏi đáp có đủ các khóa chữ (tiêu đề, bốn câu hỏi, các câu trả lời)', khoaHd.length >= 10, khoaHd.join(', '));
  ok('Mỗi khóa hd* đều có đủ ba thứ tiếng vi/en/ko', khoaHd.every(k => new RegExp(`${k}:[\\s\\S]*?vi:[\\s\\S]*?en:[\\s\\S]*?ko:`).test(phanChu)), khoaHd.join(', '));
  ok('Ba trang /den-beeftown, /en/visit, /ko/visit đều dựng TrangDenBeeftown với noiDung (cùng một khối hỏi đáp)',
     [['den-beeftown.astro'], ['en', 'visit.astro'], ['ko', 'visit.astro']].every(f => /<TrangDenBeeftown ngonNgu="(vi|en|ko)" noiDung=\{noiDung\} \/>/.test(doc(SRC, 'pages', ...f))));
});

// ===========================================================================
await nhom('6 · og:image:alt ĐÚNG THỨ TIẾNG CỦA TRANG', async () => {
  const alt = Object.fromEntries(NGON_NGU.map(nn => [nn, chu(nn).altAnhChiaSe]));
  ok('Ba bản alt khác nhau từng đôi một', new Set(Object.values(alt)).size === 3, JSON.stringify(alt));
  ok('[vi] alt viết bằng tiếng Việt (có dấu), không còn là khẩu hiệu tiếng Anh', CHU_VIET.test(alt.vi) && !alt.vi.includes(THUONG_HIEU.khauHieu), alt.vi);
  ok('[en] alt viết bằng tiếng Anh, không chữ Việt hay Hàn', !CHU_VIET.test(alt.en) && !HANGUL.test(alt.en) && !alt.en.includes(THUONG_HIEU.khauHieu), alt.en);
  ok('[ko] alt viết bằng tiếng Hàn', HANGUL.test(alt.ko), alt.ko);
  for (const nn of NGON_NGU) ok(`[${nn}] alt nhắc tên Beeftown, mô tả logo, không chữ cấm, không tên phường`, alt[nn].includes('Beeftown') && /logo|로고/iu.test(alt[nn]) && timChuoiCam(alt[nn]).length === 0 && !PHUONG_QUAN.tim(alt[nn]), alt[nn]);
  ok('Trang.astro: og:image:alt của ảnh dự phòng là t.altAnhChiaSe (thứ tiếng của trang), không còn ghép tên + khẩu hiệu tiếng Anh',
     trang.includes('alt: t.altAnhChiaSe }') && !trang.includes('alt: `${THUONG_HIEU.ten} — ${THUONG_HIEU.khauHieu}`'));
  ok('Trang.astro: ảnh chụp thật đã công bố vẫn dùng alt của chính nó (anh!.alt)', trang.includes('alt: anh!.alt }'));
});

// ===========================================================================
await nhom('7 · FILE MỚI KHÔNG BỊ .gitignore CHẶN', async () => {
  const biChan = f => { try { execFileSync('git', ['check-ignore', '-q', f], { cwd: GOC, stdio: 'ignore' }); return true; } catch { return false; } };
  ok('crm/test/test-cong-khai-seo-chung.mjs không bị chặn', !biChan('crm/test/test-cong-khai-seo-chung.mjs'));
});

ketThuc();
