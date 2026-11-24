/**
 * MUA THỊT VỀ — SEO BÁN THỊT (24/11/2026): JSON-LD ĐỦ TRƯỜNG, "XEM CÁC GÓI", DÒNG GIAO HÀNG, LINK TỪ PHẦN THỊT TỚI GÓI
 * =====================================================================================================
 * Chạy: node test/test-cong-khai-seo-ban-thit.mjs
 *
 * Rà soát SEO 23/11/2026 chấm "Mua thịt về" 48/100: Product/Offer thiếu url, sku, phí giao, đổi trả; từ trang Các phần thịt
 * bò không có đường tới gói. Giữ:
 *   1. sanPhamJsonLd(…, trang): mỗi Product và Offer có url = trang + #goi-<mã> và sku; giá không đổi; không ảnh (chưa có ảnh
 *      thật của từng gói); gọi không kèm `trang` thì đầu ra y như trước.
 *   2. Phí giao 0 đồng CHỈ khi trang in "Giá gói đã gồm phí giao" (traVnpay); đổi trả lấy từ trang Đổi trả và hoàn tiền —
 *      MerchantReturnNotPermitted, không bịa số ngày — và mọi chữ làm căn cứ có thật trong lib/chinh-sach.ts / trang.
 *   3. Neo: thẻ gói có id goi-<mã>; link "Xem các gói" (ba thứ tiếng) dẫn tới thẻ đầu; một dòng giao hàng đúng chữ trang Giao hàng.
 *   4. duongGoiTheoPhan: phần thịt có gói trong menu → /mua-thit-ve#goi-<mã> cùng thứ tiếng; không có gói → không link; trang
 *      chưa mở hay lỗi → không link. TrangPhanBo hiện "Mua gói này về nhà" (ba thứ tiếng) đúng chỗ đó.
 *   5. Câu VAT của trang Mua thịt về không đổi; không tên phường, không chữ cấm.
 * Trang dựng thật (neo tồn tại trong HTML, link bấm được, màn đầu 375×812): web/kiem-tra/thu-day-du.mjs nhóm 12.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const doc = (...p) => readFileSync(join(SRC, ...p), 'utf8').replace(/\r\n/g, '\n');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — SEO BÁN THỊT (JSON-LD, XEM CÁC GÓI, GIAO HÀNG, LINK TỪ PHẦN THỊT)');

const { nhomMuaThitVe, chiaNhom, sanPhamJsonLd, duongGoiTheoPhan, idNeoGoi } = await nap('mua-thit-ve.ts');
const { mucPhanThit } = await nap('ten-phan-thit.ts');
const { PHAN_BO, CHU_PHAN_BO } = await nap('phan-bo.ts');
const { CHINH_SACH } = await nap('chinh-sach.ts');
const { CHO_TRONG } = await nap('cho-trong.ts');
const { duongDanTuongUng, NGON_NGU } = await nap('chu.ts');
const { jsonTrongScript } = await nap('trang-cong-khai.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');

const BA = ['vi', 'en', 'ko'];
const dong = (ma, ten, soGam, gia, them = {}) => ({
  san_pham_ma: ma, loai: 'thit', don_vi: 'goi', bao_quan: 'mat', ten, ten_vi: ten, mo_ta: null, cach_dung: null, so_gam: soGam, gia, tam_het: false, ...them,
});
const menuTu = dongs => { const sanPham = nhomMuaThitVe(dongs); return { tinhTrang: 'co', sanPham, nhom: chiaNhom(sanPham) }; };
const MENU = menuTu([
  dong('ribeye-cap', 'Ribeye with Cap', 200, 400000), dong('ribeye-cap', 'Ribeye with Cap', 400, 800000),
  dong('la-galbi', 'LA Galbi', 400, 360000, { bao_quan: 'dong_lanh' }),
  dong('ba-chi-bo', 'Ba chỉ bò', 300, 180000, { bao_quan: 'dong_lanh', so_gam: 300 }),
  dong('than-ngoai', 'Thăn ngoại', 200, 300000, { bao_quan: 'mat' }),
  dong('kim-chi', 'Kim chi cải thảo', 500, 59000, { loai: 'kim_chi', don_vi: 'hop' }),
]);
const GOC_WEB = 'https://beeftown.vn';
const TRANG = (duongTrang, duongDoiTra, phiGiaoDaGom = true) => ({ goc: GOC_WEB, duongTrang, duongDoiTra, phiGiaoDaGom });
const TRANG_BA = Object.fromEntries(['vi', 'en', 'ko'].map(nn => [nn, TRANG(duongDanTuongUng('/mua-thit-ve', nn), duongDanTuongUng('/doi-tra-hoan-tien', nn))]));

// ===========================================================================
await nhom('1 · JSON-LD: url (neo), sku, giá không đổi, không ảnh', async () => {
  ok('Menu thử dựng đủ năm sản phẩm', MENU.sanPham.length === 5, MENU.sanPham.map(s => s.ma).join());
  for (const nn of BA) {
    const json = sanPhamJsonLd(MENU, 'mo', 'Beeftown', nn, TRANG_BA[nn]);
    const lai = JSON.parse(jsonTrongScript(json));   // đúng đường in ra trang: jsonTrongScript rồi trình duyệt parse
    const sp = lai['@graph'];
    const tiento = `${GOC_WEB}${TRANG_BA[nn].duongTrang}#`;
    ok(`[${nn}] JSON parse được; đủ năm Product`, lai['@context'] === 'https://schema.org' && sp.length === 5 && sp.every(p => p['@type'] === 'Product'));
    ok(`[${nn}] Mọi Product có url = trang + #goi-<mã> và sku = mã sản phẩm`,
       sp.every((p, i) => p.sku === MENU.sanPham[i].ma && p.url === `${tiento}goi-${MENU.sanPham[i].ma}`), JSON.stringify(sp.map(p => [p.sku, p.url])));
    const offers = sp.flatMap((p, i) => p.offers.map((o, j) => ({ o, goi: MENU.sanPham[i].goi[j], ma: MENU.sanPham[i].ma, url: p.url })));
    ok(`[${nn}] Mọi Offer (6) có url cùng neo với Product của nó và sku = khóa gói`,
       offers.length === 6 && offers.every(x => x.o.url === x.url && x.o.sku === x.goi.khoa), JSON.stringify(offers.map(x => [x.o.sku, x.o.url])));
    ok(`[${nn}] Giá, đơn vị tiền, tên cỡ gói và tình trạng không đổi`,
       offers.every(x => x.o.price === String(x.goi.gia) && x.o.priceCurrency === 'VND' && x.o.name === `${x.goi.soGam} g`
         && x.o.availability === 'https://schema.org/InStock'));
    ok(`[${nn}] Không ảnh, không đánh giá, không hạn giá, không mã vạch (chưa có dữ kiện thật)`,
       !['"image"', '"aggregateRating"', '"review"', '"priceValidUntil"', '"gtin', '"mpn"', '"itemCondition"'].some(k => JSON.stringify(json).includes(k)));
  }
  // Neo là chuỗi hợp lệ làm id HTML: không dấu cách, không ký tự lạ; mã sản phẩm của 0099 chỉ có [a-z0-9-].
  ok('idNeoGoi: "goi-" + mã; mọi neo là id HTML hợp lệ (không dấu cách, không ký tự lạ)',
     idNeoGoi('ribeye-cap') === 'goi-ribeye-cap' && MENU.sanPham.every(s => /^goi-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(idNeoGoi(s.ma))));
  ok('Hai sản phẩm không bao giờ cùng một neo (mã sản phẩm duy nhất)', new Set(MENU.sanPham.map(s => idNeoGoi(s.ma))).size === MENU.sanPham.length);
  ok('Gói tạm hết vẫn có url và sku, availability OutOfStock',
     (() => { const m = menuTu([dong('ribeye', 'Ribeye', 200, 189000, { tam_het: true })]); const o = sanPhamJsonLd(m, 'het_quay', 'Beeftown', 'vi', TRANG_BA.vi)['@graph'][0].offers[0];
       return o.availability.endsWith('OutOfStock') && o.sku === 'ribeye_200' && o.url.endsWith('#goi-ribeye'); })());
  // Gọi như cũ (test-cong-khai-seo.mjs): đầu ra y như trước, không url, không sku, không phí giao, không đổi trả.
  const cu = JSON.stringify(sanPhamJsonLd(MENU, 'mo', 'Beeftown'));
  ok('Gọi không kèm thông tin trang → không url, không sku, không shippingDetails, không hasMerchantReturnPolicy',
     !/"(url|sku|shippingDetails|hasMerchantReturnPolicy)"/.test(cu), cu.slice(0, 160));
  for (const tt of ['chua_mo', 'loi']) ok(`Trạng thái "${tt}" vẫn không khai gì`, sanPhamJsonLd(MENU, tt, 'Beeftown', 'vi', TRANG_BA.vi) === null);
  ok('Tên sản phẩm có "</script>" vẫn không đóng thẻ sớm khi có url và sku',
     !jsonTrongScript(sanPhamJsonLd(menuTu([dong('x', 'A</script><b>', 100, 1000)]), 'mo', 'Beeftown', 'vi', TRANG_BA.vi)).includes('</script>'));
});

// ===========================================================================
await nhom('2 · PHÍ GIAO 0 ĐỒNG VÀ ĐỔI TRẢ: CHỈ KHI CÓ CHỮ LÀM CĂN CỨ', async () => {
  for (const nn of BA) {
    const offers = sanPhamJsonLd(MENU, 'mo', 'Beeftown', nn, TRANG_BA[nn])['@graph'].flatMap(p => p.offers);
    const sd = offers[0].shippingDetails;
    ok(`[${nn}] Có shippingDetails trên mọi Offer: 0 VND, tới Việt Nam (TP.HCM, VN-SG), không giờ giao / số ngày giao`,
       offers.every(o => JSON.stringify(o.shippingDetails) === JSON.stringify(sd)) && sd['@type'] === 'OfferShippingDetails'
         && sd.shippingRate.value === 0 && sd.shippingRate.currency === 'VND'
         && sd.shippingDestination.addressCountry === 'VN' && sd.shippingDestination.addressRegion === 'VN-SG'
         && !('deliveryTime' in sd) && !JSON.stringify(sd).includes('handlingTime') && !JSON.stringify(sd).includes('transitTime'), JSON.stringify(sd));
    const rp = offers[0].hasMerchantReturnPolicy;
    ok(`[${nn}] hasMerchantReturnPolicy trên mọi Offer: MerchantReturnNotPermitted, nước VN, link tới trang Đổi trả cùng thứ tiếng, KHÔNG số ngày`,
       offers.every(o => JSON.stringify(o.hasMerchantReturnPolicy) === JSON.stringify(rp)) && rp['@type'] === 'MerchantReturnPolicy'
         && rp.returnPolicyCategory === 'https://schema.org/MerchantReturnNotPermitted' && rp.applicableCountry === 'VN'
         && rp.merchantReturnLink === `${GOC_WEB}${duongDanTuongUng(CHINH_SACH.doiTra.duong, nn)}`
         && !/merchantReturnDays|returnFees|returnMethod|refundType/.test(JSON.stringify(rp)), JSON.stringify(rp));
  }
  const khongVnpay = sanPhamJsonLd(MENU, 'mo', 'Beeftown', 'vi', TRANG('/mua-thit-ve', '/doi-tra-hoan-tien', false));
  ok('Trang chưa in "Giá gói đã gồm phí giao" (chưa cài VNPay: quán báo phí giao khi gọi) → KHÔNG có shippingDetails',
     !JSON.stringify(khongVnpay).includes('shippingDetails') && !JSON.stringify(khongVnpay).includes('shippingRate'));
  ok('…nhưng đổi trả vẫn có (trang Đổi trả không phụ thuộc cách trả tiền)', JSON.stringify(khongVnpay).includes('MerchantReturnNotPermitted'));

  // Căn cứ: các câu thật, từng chữ.
  const tatCa = k => JSON.stringify(CHINH_SACH[k]);
  ok('Căn cứ phí giao: trang Chính sách giá nói "Giá gói đã gồm phí giao trong khu vực" (vi), "include delivery within the area" (en), "배달비가 포함돼요" (ko)',
     tatCa('chinhSachGia').includes('Giá gói đã gồm phí giao trong khu vực') && tatCa('chinhSachGia').includes('Pack prices include delivery within the area')
       && tatCa('chinhSachGia').includes('배달비가 포함돼요'));
  const thanh = doc('components', 'TrangMuaThitVe.astro');
  ok('Căn cứ phí giao: trang Mua thịt về in "Giá gói đã gồm phí giao" / "Pack prices include delivery" / "팩 가격에 배달비가 포함돼요" ở nhánh traVnpay',
     thanh.includes("dieuGiaVnpay: { vi: 'Giá gói đã gồm phí giao', en: 'Pack prices include delivery', ko: '팩 가격에 배달비가 포함돼요' }")
       && thanh.includes("? [\n      { bt: 'xe-giao', chu: c.dieuGiaVnpay"));
  ok('Căn cứ phí giao: JSON-LD nhận phiGiaoDaGom = traVnpay (đúng điều kiện in câu đó)', /phiGiaoDaGom: traVnpay,/.test(thanh));
  ok('Căn cứ đổi trả: trang Đổi trả nói "Beeftown không nhận trả khi bạn đổi ý sau khi đã nhận hàng" (vi), "cannot take an order back because you changed your mind" (en), "반품을 받지 않아요" (ko)',
     tatCa('doiTra').includes('Beeftown không nhận trả khi bạn đổi ý sau khi đã nhận hàng') && tatCa('doiTra').includes('cannot take an order back because you changed your mind')
       && tatCa('doiTra').includes('반품을 받지 않아요'));
  ok('Căn cứ không chọn "FiniteReturnWindow": thời hạn báo lỗi của trang Đổi trả tính bằng GIỜ (GIO_BAO_LOI), không phải số ngày trả hàng',
     /Trong \$\{GIO_BAO_LOI\} giờ kể từ lúc nhận/.test(doc('lib', 'chinh-sach.ts')) && typeof CHO_TRONG.GIO_BAO_LOI === 'string');
  ok('Mọi dữ kiện JSON-LD này không dính chữ cấm (chuoi-cam.js)', BA.every(nn => timChuoiCam(JSON.stringify(sanPhamJsonLd(MENU, 'mo', 'Beeftown', nn, TRANG_BA[nn]))).length === 0));
});

// ===========================================================================
await nhom('3 · NEO CỦA THẺ GÓI, LINK "XEM CÁC GÓI" VÀ DÒNG GIAO HÀNG', async () => {
  const the = doc('components', 'MuaThitThe.astro');
  ok('MuaThitThe.astro: thẻ <article> mang id={idNeoGoi(sanPham.ma)} (cùng hàm với url của JSON-LD)',
     /<article class:list=\{\['the', 'mtv-the'[^\n]*\}\]\} id=\{idNeoGoi\(sanPham\.ma\)\} data-mtv-the=\{sanPham\.ma\}>/.test(the) && the.includes("import { idNeoGoi } from '../lib/mua-thit-ve';"));
  ok('Thẻ có scroll-margin-top (đầu trang dính không che thẻ khi nhảy tới neo)', /\.mtv-the \{ scroll-margin-top: var\(--cao-dau\); \}/.test(the));

  const thanh = doc('components', 'TrangMuaThitVe.astro');
  ok('"Xem các gói" / "See the packs" / "팩 보기"', thanh.includes("xemGoi: { vi: 'Xem các gói', en: 'See the packs', ko: '팩 보기' }"));
  ok('Link nằm trong màn đầu (khối mtv-dau), ngay sau đoạn dẫn và dòng giao hàng, trước dải ba điều, và trỏ tới thẻ ĐẦU TIÊN (nhóm đầu, sản phẩm đầu)',
     /const goiDau = menu\.nhom\[0\]\?\.sanPham\[0\];/.test(thanh)
       && /<p class="dan">[^\n]*<\/p>[\s\S]{0,400}data-mtv-giao-tom[\s\S]{0,500}href=\{`#\$\{idNeoGoi\(goiDau\.ma\)\}`\} data-mtv-xem-goi[\s\S]{0,200}<ul class="mtv-ba-dieu"/.test(thanh));
  ok('Link là nút phụ (nut-vien), không phải nút chính: trang chỉ có một hành động chính là Đặt hàng', /<a class="nut nut-vien" href=\{`#\$\{idNeoGoi\(goiDau\.ma\)\}`\}/.test(thanh));

  // Dòng giao hàng: dựng từ đúng hằng của trang Giao hàng.
  const giaoHang = JSON.stringify(CHINH_SACH.giaoHang);
  for (const nn of BA) {
    ok(`[${nn}] Dòng giao hàng dùng VUNG_GIAO và GIO_GIAO của CHO_TRONG — đúng chữ trang Giao hàng đang in`,
       thanh.includes('${CHO_TRONG.VUNG_GIAO.' + nn + '}') && thanh.includes('${CHO_TRONG.GIO_GIAO.' + nn + '}')
         && giaoHang.includes(CHO_TRONG.VUNG_GIAO[nn]) && giaoHang.includes(CHO_TRONG.GIO_GIAO[nn]));
  }
  ok('Dòng giao hàng nói quán gọi hẹn giờ (trang Giao hàng: "Quán gọi số điện thoại bạn ghi để hẹn giờ"), không thêm số liệu nào',
     thanh.includes('. Quán gọi hẹn giờ giao.`') && thanh.includes('We call to arrange a delivery time.`') && thanh.includes('매장에서 전화로 배달 시간을 함께 정해요.`') && giaoHang.includes('Quán gọi số điện thoại bạn ghi để hẹn giờ.'));
  ok('Dòng giao hàng có link sang trang Giao hàng cùng thứ tiếng: "Chi tiết giao hàng" / "Delivery details" / "배달 안내 보기"',
     thanh.includes("chiTietGiao: { vi: 'Chi tiết giao hàng', en: 'Delivery details', ko: '배달 안내 보기' }")
       && thanh.includes('const duongGiaoHang = duongDanTuongUng(CHINH_SACH.giaoHang.duong, nn);')
       && /<p class="mtv-giao-tom" data-mtv-giao-tom>\{c\.giaoTom\} <a class="lien-ket" href=\{duongGiaoHang\}>\{c\.chiTietGiao\}<\/a><\/p>/.test(thanh));
  ok('Dòng giao hàng không có số (giá, ngày, giờ, km): chỉ khu vực, giờ làm việc, hẹn giờ',
     BA.every(nn => !/\d/.test(`${CHO_TRONG.VUNG_GIAO[nn]} ${CHO_TRONG.GIO_GIAO[nn]}`.replace(/TP\.HCM/g, ''))));
  ok('Câu VAT giữ nguyên chữ ở cả ba thứ tiếng', thanh.includes("vat: { vi: `VAT: ${CHO_TRONG.VAT.vi}.`, en: `VAT: ${CHO_TRONG.VAT.en}.`, ko: `VAT: ${CHO_TRONG.VAT.ko}.` }")
     && CHO_TRONG.VAT.vi === 'giá gói chưa gồm VAT' && CHO_TRONG.VAT.en === 'pack prices do not include VAT' && CHO_TRONG.VAT.ko === '팩 가격에는 VAT가 포함되어 있지 않아요');
  ok('Chữ mới không dính chữ cấm', ['Xem các gói', 'See the packs', '팩 보기', 'Chi tiết giao hàng', 'Delivery details', '배달 안내 보기'].every(s => timChuoiCam(s).length === 0));
});

// ===========================================================================
await nhom('4 · TỪ PHẦN THỊT TỚI GÓI: duongGoiTheoPhan VÀ NÚT "MUA GÓI NÀY VỀ NHÀ"', async () => {
  for (const nn of BA) {
    const m = duongGoiTheoPhan(MENU, 'mo', nn);
    const buy = duongDanTuongUng('/mua-thit-ve', nn);
    ok(`[${nn}] Đúng ba phần có gói: đầu thăn ngoại (Ribeye with Cap), la-galbi, ba-chi — đúng neo, đúng đường dẫn thứ tiếng`,
       JSON.stringify(m) === JSON.stringify({ 'dau-than-ngoai': `${buy}#goi-ribeye-cap`, 'la-galbi': `${buy}#goi-la-galbi`, 'ba-chi': `${buy}#goi-ba-chi-bo` })
         || false, JSON.stringify(m));
  }
  ok('"Thăn ngoại" (không có phần tương ứng trong PHAN_THIT) và kim chi không có link', !Object.values(duongGoiTheoPhan(MENU, 'mo', 'vi')).some(u => /than-ngoai|kim-chi/.test(u)));
  ok('Phần thịt không có gói trong menu (de-suon, diem-than, nac-vai, loi-vai) → không khóa, không link',
     ['de-suon', 'diem-than', 'nac-vai', 'loi-vai'].every(id => !(id in duongGoiTheoPhan(MENU, 'mo', 'vi'))));
  ok('Mọi neo của link là neo của thẻ gói có thật trong menu', Object.values(duongGoiTheoPhan(MENU, 'mo', 'vi')).every(u => MENU.sanPham.some(s => u.endsWith(`#${idNeoGoi(s.ma)}`))));
  ok('Khóa của kết quả luôn là id có thật của PHAN_BO (trang Các phần thịt bò không nhận khóa lạ)', Object.keys(duongGoiTheoPhan(MENU, 'mo', 'vi')).every(k => PHAN_BO.some(p => p.id === k)));
  ok('Hai gói cùng một phần (Ribeye và Ribeye with Cap): lấy gói đứng trước trong menu',
     (() => { const m = menuTu([dong('ribeye', 'Ribeye', 200, 1000), dong('ribeye-cap', 'Ribeye with Cap', 200, 2000)]); return duongGoiTheoPhan(m, 'mo', 'vi')['dau-than-ngoai'].endsWith('#goi-ribeye'); })());
  ok('Trang Mua thịt về chưa mở hay lỗi → không link nào (không trỏ vào trang không có gói)',
     ['chua_mo', 'loi'].every(tt => Object.keys(duongGoiTheoPhan(MENU, tt, 'vi')).length === 0));
  ok('Mọi gói tạm hết (het_quay): trang vẫn liệt kê gói nên vẫn có link', Object.keys(duongGoiTheoPhan(MENU, 'het_quay', 'vi')).length === 3);
  ok('Menu rỗng hoặc chưa nối database → không link', Object.keys(duongGoiTheoPhan({ tinhTrang: 'chua_noi', sanPham: [], nhom: [] }, 'mo', 'vi')).length === 0);
  ok('mucPhanThit và lienKetPhanThit cùng một bảng ghép (PHAN_THIT): mọi phần thịt có gói đều ra id có thật của PHAN_BO',
     ['Ribeye', 'Ribeye with Cap', 'Outside Skirt', 'Top Blade', 'Galbisal', 'LA Galbi', 'Ba chỉ bò'].every(t => PHAN_BO.some(p => p.id === mucPhanThit({ loai: 'thit', ten: t, tenVi: t }))));
  ok('Kim chi tên "Ribeye" không bao giờ có phần thịt', mucPhanThit({ loai: 'kim_chi', ten: 'Ribeye', tenVi: 'Ribeye' }) === null);

  // Nút ở trang Các phần thịt bò.
  const nhan = CHU_PHAN_BO.muaGoiNay;
  ok('Nút "Mua gói này về nhà" / "Buy this pack to take home" / "이 팩 포장 구매하기"',
     nhan.vi === 'Mua gói này về nhà' && nhan.en === 'Buy this pack to take home' && nhan.ko === '이 팩 포장 구매하기');
  ok('Nhãn mới không dính chữ cấm, không tên phường', BA.every(nn => timChuoiCam(nhan[nn]).length === 0));
  const trang = doc('components', 'TrangPhanBo.astro');
  ok('TrangPhanBo.astro: nhận goiTheoPhan; nút chỉ hiện khi phần đó có link (goiTheoPhan[p.id]), href đúng link đó, ở mọi phần có gói — kể cả phần không có khối "them"',
     /goiTheoPhan\?: Readonly<Record<string, string>>;/.test(trang)
       && /\{goiTheoPhan\[p\.id\] && \(\s*<div class="hang-nut pb-mua"><a class="nut nut-vien" href=\{goiTheoPhan\[p\.id\]\} data-pb-mua-goi=\{p\.id\}>\{c\.muaGoiNay\[ngonNgu\]\}<\/a><\/div>\s*\)\}/.test(trang));
  ok('Link chung cũ ("Xem gói trên trang Mua thịt về") chỉ còn khi không có link tới đúng gói — không hai link cạnh nhau',
     trang.includes('{p.coGoiMuaVe && muaVeMo && !goiTheoPhan[p.id] && <p class="pb-them">'));
  // Ba file vỏ: đọc menu song song với nội dung, đúng thứ tiếng, cùng cách tính trạng thái như trang Mua thịt về.
  for (const [tep, nn] of [[['pages', 'phan-thit-bo.astro'], 'vi'], [['pages', 'en', 'beef-cuts.astro'], 'en'], [['pages', 'ko', 'beef-cuts.astro'], 'ko']]) {
    const v = doc(...tep);
    ok(`[${nn}] ${tep.join('/')}: đọc menu ('${nn}') song song, goiTheoPhan = duongGoiTheoPhan(menu, trangThaiMuaThit(muaThitVeMo(noiDung), menu), '${nn}'), truyền xuống TrangPhanBo`,
       v.includes(`const [noiDung, menu] = await Promise.all([docNoiDung('${nn}'), docMuaThitVe('${nn}')]);`)
         && v.includes(`const goiTheoPhan = duongGoiTheoPhan(menu, trangThaiMuaThit(muaThitVeMo(noiDung), menu), '${nn}');`)
         && v.includes(`<TrangPhanBo ngonNgu="${nn}" noiDung={noiDung} goiTheoPhan={goiTheoPhan} />`));
  }
  ok('Đủ ba thứ tiếng ở NGON_NGU (không thứ tiếng nào bị quên)', JSON.stringify([...NGON_NGU]) === JSON.stringify(BA));
});

process.exit(ketThuc('SEO BÁN THỊT'));
