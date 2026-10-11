/**
 * BEEFTOWN — TRANG CÔNG KHAI: NÚT NÀO, DẪN ĐI ĐÂU, ĐỊA CHỈ NÀO (web/src/lib/trang-cong-khai.ts)
 * ============================================================================================
 *
 *     node test/test-cong-khai-trang-chu.mjs
 *
 * Mọi quyết định "hiện nút gì" của trang công khai gom ở trang-cong-khai.ts để kiểm được ở
 * đây, không rải trong component. Bất biến (brief 06/10/2026, web/README.md):
 *
 *   1. Thứ bậc nút màn đầu theo mức sẵn sàng: form hỏi bàn mở → "Hỏi bàn" chính, "Khám phá
 *      thực đơn" phụ; chưa mở mà có kênh thật (Facebook, hotline, email) → "Khám phá thực
 *      đơn" chính, "Hỏi bàn" phụ; chưa mở và không kênh nào → phụ là "Xem đường lên tầng 3"
 *      — không bắt khách đi một quãng để đọc lời từ chối. Ở cả vi, en, ko.
 *   2. Chỉ nhận đường dẫn http(s) đã công bố: javascript:, data:, ftp:… gõ vào cổng nội dung
 *      KHÔNG thành href. Hotline có chữ lạ, email sai dạng cũng bị bỏ.
 *   3. Địa chỉ cố định "Tầng 3, 63 Hồ Tùng Mậu, TP.HCM" hiện cả khi chưa có database; bản công bố
 *      (dia_chi_hien_thi) thay vào khi có. Tên phường chưa có giấy xác nhận nên không ghi.
 *   4. Bốn mục điều hướng đúng thứ tự, đúng đường dẫn từng thứ tiếng, mục cuối là "Hỏi bàn".
 */

import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const LIB = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'src', 'lib');
const nap = f => import(pathToFileURL(join(LIB, f)).href);
const { nutMoDau, lienHe, diaChi, diaChiSauTang, diaChiManDau, diaChiCoCauTruc, cumDiaChi, jsonTrongScript, coKenhHoiBan, formHoiBanMo, dieuHuong, urlAnToan } = await nap('trang-cong-khai.ts');
const { chu, duongDanTuongUng, DIA_CHI_NHA_HANG, NGON_NGU } = await nap('chu.ts');
const { docNoiDung } = await nap('noi-dung.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRANG CÔNG KHAI: NÚT, LIÊN HỆ, ĐỊA CHỈ');

// Bản nền đúng như trang thấy khi chưa nối database: mọi khóa null.
const NEN = await docNoiDung('vi', null);
const nd = (them = {}) => ({ ...NEN, ...structuredClone(them) });
const inNut = ds => JSON.stringify(ds.map(n => `${n.kieu}:${n.chu}→${n.url}`));

// ===========================================================================
await nhom('1 · THỨ BẬC NÚT MÀN ĐẦU THEO MỨC SẴN SÀNG (vi, en, ko)', async () => {
  ok('Bản nền (chưa nối database): mọi khóa đều null', Object.values(NEN).every(v => v === null) && Object.keys(NEN).length > 15,
     JSON.stringify(NEN).slice(0, 120));

  for (const nn of NGON_NGU) {
    const t = chu(nn);
    const hoiBan = duongDanTuongUng('/dat-ban', nn);
    const thucDon = duongDanTuongUng('/thuc-don', nn);
    const denBeeftown = duongDanTuongUng('/den-beeftown', nn);
    const nut = { hoiBan: { url: hoiBan, chu: t.datBan }, thucDon: { url: thucDon, chu: t.khamPhaThucDon } };
    const la = (ds, chinh, phu) => ds.length === 2
      && ds[0].kieu === 'chinh' && ds[0].url === chinh.url && ds[0].chu === chinh.chu
      && ds[1].kieu === 'vien' && ds[1].url === phu.url && ds[1].chu === phu.chu;

    const mo = nutMoDau(nd({ form_dat_ban_dang_mo: true }), nn);
    ok(`[${nn}] Form hỏi bàn mở → "${t.datBan}" chính (${hoiBan}), "${t.khamPhaThucDon}" phụ`,
       la(mo, nut.hoiBan, nut.thucDon), inNut(mo));

    const moVaFb = nutMoDau(nd({ form_dat_ban_dang_mo: true, facebook_url: 'https://www.facebook.com/beeftown' }), nn);
    ok(`[${nn}] Form mở và có Facebook → vẫn "${t.datBan}" chính (form thắng)`, la(moVaFb, nut.hoiBan, nut.thucDon), inNut(moVaFb));

    for (const [ten, them] of [
      ['có Facebook', { facebook_url: 'https://www.facebook.com/beeftown' }],
      ['có hotline', { hotline: '028 3822 1234' }],
      ['có email', { email_lien_he: 'xin-chao@beeftown.vn' }],
    ]) {
      const ds = nutMoDau(nd({ form_dat_ban_dang_mo: false, ...them }), nn);
      ok(`[${nn}] Form chưa mở, ${ten} → "${t.khamPhaThucDon}" chính, "${t.datBan}" phụ`,
         la(ds, nut.thucDon, nut.hoiBan), inNut(ds));
    }

    const khongKenh = nutMoDau(NEN, nn);
    ok(`[${nn}] Chưa mở, không kênh nào → "${t.khamPhaThucDon}" chính, phụ là "${t.xemDuongLen}" (${denBeeftown})`,
       la(khongKenh, nut.thucDon, { url: denBeeftown, chu: t.xemDuongLen }), inNut(khongKenh));

    // Kênh "có" nhưng không dùng được thì không tính là kênh.
    const kenhHong = nutMoDau(nd({ facebook_url: 'javascript:alert(1)', hotline: 'gọi tôi nhé', email_lien_he: 'khong-phai-email' }), nn);
    ok(`[${nn}] Facebook javascript:, hotline chữ, email sai dạng → coi như không kênh: phụ là "${t.xemDuongLen}"`,
       la(kenhHong, nut.thucDon, { url: denBeeftown, chu: t.xemDuongLen }), inNut(kenhHong));

    // Instagram / TikTok / Zalo là kênh theo dõi, không phải chỗ hỏi bàn.
    const chiInstagram = nutMoDau(nd({ instagram_url: 'https://instagram.com/beeftown' }), nn);
    ok(`[${nn}] Chỉ có Instagram → vẫn không có nút "${t.datBan}"`,
       !chiInstagram.some(n => n.url === hoiBan), inNut(chiInstagram));

    // form_dat_ban_dang_mo chỉ là true khi đúng là true — chuỗi "true" hay 1 từ một bản ghi lạ không mở form.
    ok(`[${nn}] form_dat_ban_dang_mo = "true" (chuỗi) hoặc 1 không tính là mở`,
       !formHoiBanMo(nd({ form_dat_ban_dang_mo: 'true' })) && !formHoiBanMo(nd({ form_dat_ban_dang_mo: 1 })));
  }
});

// ===========================================================================
await nhom('2 · CHỈ NHẬN ĐƯỜNG DẪN http(s) ĐÃ CÔNG BỐ', async () => {
  const lhRong = lienHe(NEN);
  ok('Chưa công bố gì → không một liên hệ nào (không nút nào)', Object.values(lhRong).every(v => v === null), JSON.stringify(lhRong));

  const BI_BO = [
    'javascript:alert(document.cookie)', 'JAVASCRIPT:alert(1)', '  javascript:alert(1)', 'java\nscript:alert(1)',
    'data:text/html,<script>alert(1)</script>', 'ftp://beeftown.vn/menu', 'file:///etc/passwd',
    'vbscript:msgbox(1)', '//beeftown.vn', 'beeftown.vn', 'https://', '', '   ', null, undefined, 42,
  ];
  for (const u of BI_BO) {
    const lh = lienHe(nd({ facebook_url: u, google_maps_url: u, instagram_url: u, tiktok_url: u, zalo_oa_url: u }));
    ok(`${JSON.stringify(u) ?? 'undefined'} → bị bỏ ở mọi ô liên kết`,
       [lh.facebook, lh.maps, lh.instagram, lh.tiktok, lh.zalo].every(v => v === null) && urlAnToan(u) === null,
       JSON.stringify(lh));
  }

  const lh = lienHe(nd({
    facebook_url: '  https://www.facebook.com/beeftown  ',
    google_maps_url: 'https://maps.app.goo.gl/abc123',
    zalo_oa_url: 'http://zalo.me/beeftown',
  }));
  ok('https:// được nhận (khoảng trắng hai đầu bị bỏ)', lh.facebook === 'https://www.facebook.com/beeftown', lh.facebook);
  ok('Maps https:// được nhận nguyên văn', lh.maps === 'https://maps.app.goo.gl/abc123', lh.maps);
  ok('http:// vẫn là đường dẫn web — được nhận', lh.zalo === 'http://zalo.me/beeftown', lh.zalo);
});

// ===========================================================================
await nhom('3 · HOTLINE VÀ EMAIL: CHỮ LẠ BỊ BỎ', async () => {
  const goi = h => lienHe(nd({ hotline: h }));
  for (const [h, hien, tel] of [
    ['028 3822 1234', '028 3822 1234', 'tel:02838221234'],
    ['+84 (28) 3822-1234', '+84 (28) 3822-1234', 'tel:+842838221234'],
    ['  0912.345.678 ', '0912.345.678', 'tel:0912345678'],
  ]) {
    const lh = goi(h);
    ok(`Hotline ${JSON.stringify(h)} → hiện "${hien}", gọi ${tel}`, lh.hotline === hien && lh.goi === tel, JSON.stringify(lh));
  }
  // Số kèm chú thích sau dấu cách ("(Zalo)", "– nhánh 2"): hiện nguyên câu đã công bố, tel: chỉ lấy phần số.
  // Trước đây cả số bị bỏ im lặng — nút Gọi, dòng điện thoại và telephone của JSON-LD cùng biến mất.
  for (const [h, hien, tel] of [
    ['0909 123 456 (Zalo)', '0909 123 456 (Zalo)', 'tel:0909123456'],
    ['1900 1234 – nhánh 2', '1900 1234 – nhánh 2', 'tel:19001234'],
    ['+84 28 3822 1234 (giờ hành chính)', '+84 28 3822 1234 (giờ hành chính)', 'tel:+842838221234'],
  ]) {
    const lh = goi(h);
    ok(`Hotline có chú thích ${JSON.stringify(h)} → hiện "${hien}", gọi ${tel}`, lh.hotline === hien && lh.goi === tel, JSON.stringify(lh));
  }
  for (const h of ['0900 ABC', 'gọi 0912345678', '<script>alert(1)</script>', '0912;rm', '12345', 'tel:0912345678', '',
                   '0912345678abc', '0909 (Zalo)', 'javascript:alert(1) 0912345678']) {
    const lh = goi(h);
    ok(`Hotline ${JSON.stringify(h)} có chữ lạ / quá ngắn → bỏ (không hiện, không tel:)`, lh.hotline === null && lh.goi === null,
       JSON.stringify(lh));
  }
  ok('Email đúng dạng → mailto:', lienHe(nd({ email_lien_he: ' xin-chao@beeftown.vn ' })).thu === 'mailto:xin-chao@beeftown.vn');
  for (const e of ['khong-phai-email', 'a@b', 'a@b.', 'x"@y.z', '<a@b.c>', 'a @b.c', '']) {
    const thu = lienHe(nd({ email_lien_he: e })).thu;
    ok(`Email ${JSON.stringify(e)} sai dạng → bỏ`, thu === null, thu);
  }
});

// ===========================================================================
await nhom('4 · ĐỊA CHỈ CỐ ĐỊNH, BẢN CÔNG BỐ THAY VÀO KHI CÓ', async () => {
  ok('Địa chỉ cố định là "Tầng 3, 63 Hồ Tùng Mậu, TP.HCM"', DIA_CHI_NHA_HANG === 'Tầng 3, 63 Hồ Tùng Mậu, TP.HCM', DIA_CHI_NHA_HANG);
  ok('Chưa nối database → in địa chỉ cố định', diaChi(NEN) === DIA_CHI_NHA_HANG, diaChi(NEN));
  ok('dia_chi_hien_thi chỉ có khoảng trắng → vẫn địa chỉ cố định', diaChi(nd({ dia_chi_hien_thi: '   ' })) === DIA_CHI_NHA_HANG);
  // Bản công bố là chữ người gõ trong /noi-bo: có thể dài hơn địa chỉ cố định (thêm phường khi đã có giấy, viết đủ tên thành phố).
  const congBo = '  Tầng 3, 63 Hồ Tùng Mậu, phường Thử, TP. Hồ Chí Minh  ';
  ok('Có bản công bố → dùng bản công bố (bỏ khoảng trắng hai đầu)', diaChi(nd({ dia_chi_hien_thi: congBo })) === congBo.trim(),
     diaChi(nd({ dia_chi_hien_thi: congBo })));

  // Menu gọn và màn đầu in "Tầng 3" đậm rồi mới tới địa chỉ: bỏ "Tầng 3" ở đầu, nhưng phải là địa chỉ của
  // diaChi() — trước đây hai chỗ đó in hằng số, nên bản công bố không bao giờ tới (hai địa chỉ trên một trang).
  ok('diaChiSauTang: chưa công bố → "63 Hồ Tùng Mậu, TP.HCM"',
     diaChiSauTang(NEN) === '63 Hồ Tùng Mậu, TP.HCM', diaChiSauTang(NEN));
  ok('diaChiSauTang: có bản công bố → dùng bản công bố, bỏ "Tầng 3," ở đầu',
     diaChiSauTang(nd({ dia_chi_hien_thi: congBo })) === '63 Hồ Tùng Mậu, phường Thử, TP. Hồ Chí Minh',
     diaChiSauTang(nd({ dia_chi_hien_thi: congBo })));
  ok('diaChiSauTang: bản công bố không bắt đầu bằng "Tầng 3" → giữ nguyên',
     diaChiSauTang(nd({ dia_chi_hien_thi: '63 Hồ Tùng Mậu, TP. Hồ Chí Minh' })) === '63 Hồ Tùng Mậu, TP. Hồ Chí Minh');

  // Màn đầu trang chủ in bản ngắn nhất: sau "Tầng 3" chỉ còn số nhà, tên đường, thành phố. Bản công bố có ghi
  // phường (tên nào cũng vậy) thì màn đầu bỏ phường đi; các chỗ khác vẫn in đủ.
  ok('diaChiManDau: chưa công bố → "63 Hồ Tùng Mậu, TP.HCM"', diaChiManDau(NEN) === '63 Hồ Tùng Mậu, TP.HCM', diaChiManDau(NEN));
  ok('diaChiManDau: bản công bố có phường → bỏ "Tầng 3," ở đầu và bỏ phường',
     diaChiManDau(nd({ dia_chi_hien_thi: congBo })) === '63 Hồ Tùng Mậu, TP. Hồ Chí Minh', diaChiManDau(nd({ dia_chi_hien_thi: congBo })));
  ok('diaChiManDau: "Phường" viết hoa, "P." viết tắt cũng bỏ; chữ "phường" nằm trong tên đường thì giữ',
     diaChiManDau(nd({ dia_chi_hien_thi: 'Tầng 3, 63 Hồ Tùng Mậu, Phường Thử Hai, TP.HCM' })) === '63 Hồ Tùng Mậu, TP.HCM'
       && diaChiManDau(nd({ dia_chi_hien_thi: 'Tầng 3, 63 Hồ Tùng Mậu, P. Thử, TP.HCM' })) === '63 Hồ Tùng Mậu, TP.HCM'
       && diaChiManDau(nd({ dia_chi_hien_thi: '12 Đường Phường Thử, TP.HCM' })) === '12 Đường Phường Thử, TP.HCM');
  // "P." đứng trước một con số là số phòng ("P.301"), không phải phường: bỏ đi là mất chỗ khách cần tìm.
  for (const dc of ['Tầng 3, 63 Hồ Tùng Mậu, P.301, TP.HCM', 'Tầng 3, 63 Hồ Tùng Mậu, P. 301, TP.HCM', 'Tầng 3, 63 Hồ Tùng Mậu, p.12, TP.HCM']) {
    ok(`diaChiManDau(${JSON.stringify(dc)}): vế "P." + số (số phòng) được giữ nguyên`,
       diaChiManDau(nd({ dia_chi_hien_thi: dc })) === dc.replace(/^Tầng 3, /, ''), diaChiManDau(nd({ dia_chi_hien_thi: dc })));
  }
  ok('diaChiManDau: "phường 12" viết đủ chữ thì vẫn là phường — bỏ',
     diaChiManDau(nd({ dia_chi_hien_thi: 'Tầng 3, 63 Hồ Tùng Mậu, phường 12, TP.HCM' })) === '63 Hồ Tùng Mậu, TP.HCM');
  // Bản công bố gõ dở ("Tầng 3," rồi bấm công bố): bỏ "Tầng 3" đi thì hết chữ. Dòng địa chỉ không được rỗng —
  // màn đầu và menu gọn in chữ "Tầng 3" đậm rồi một dấu chấm lơ lửng — nên dùng lại cả bản công bố.
  for (const dc of ['Tầng 3,', 'Tầng 3', '  tầng 3 -  ']) {
    ok(`diaChiSauTang / diaChiManDau(${JSON.stringify(dc)}): không trả dòng rỗng, dùng lại cả bản công bố`,
       diaChiSauTang(nd({ dia_chi_hien_thi: dc })) === dc.trim() && diaChiManDau(nd({ dia_chi_hien_thi: dc })) === dc.trim(),
       JSON.stringify([diaChiSauTang(nd({ dia_chi_hien_thi: dc })), diaChiManDau(nd({ dia_chi_hien_thi: dc }))]));
  }
  ok('diaChiManDau: bỏ vế phường xong mà hết chữ (bản công bố "Tầng 3, , phường Thử") → không trả dòng rỗng, in phần sau "Tầng 3"',
     diaChiManDau(nd({ dia_chi_hien_thi: 'Tầng 3, , phường Thử' })) === ', phường Thử',
     JSON.stringify(diaChiManDau(nd({ dia_chi_hien_thi: 'Tầng 3, , phường Thử' }))));

  // JSON-LD: một nguồn địa chỉ, không lặp thành phố khi bản công bố đã có đủ.
  const coCauTruc = diaChiCoCauTruc(NEN);
  ok('JSON-LD chưa công bố: streetAddress lấy từ địa chỉ cố định, thành phố ở trường riêng, không có tên phường',
     JSON.stringify(coCauTruc) === JSON.stringify({ '@type': 'PostalAddress', streetAddress: 'Tầng 3, 63 Hồ Tùng Mậu', addressRegion: 'TP.HCM', addressCountry: 'VN' })
       && DIA_CHI_NHA_HANG.startsWith(coCauTruc.streetAddress) && DIA_CHI_NHA_HANG.endsWith(coCauTruc.addressRegion),
     JSON.stringify(coCauTruc));
  const coCauTrucCongBo = diaChiCoCauTruc(nd({ dia_chi_hien_thi: congBo }));
  ok('JSON-LD có bản công bố: streetAddress là bản công bố, không thêm phường / thành phố lần hai',
     coCauTrucCongBo.streetAddress === congBo.trim() && !('addressLocality' in coCauTrucCongBo) && !('addressRegion' in coCauTrucCongBo)
       && coCauTrucCongBo.addressCountry === 'VN', JSON.stringify(coCauTrucCongBo));

  // In địa chỉ theo cụm: "Hồ Tùng / Mậu", "phường / Thử" không gãy giữa cụm; cụm dài thì để tự xuống dòng.
  const cum = cumDiaChi(DIA_CHI_NHA_HANG);
  ok('cumDiaChi: địa chỉ cố định → 3 cụm, dấu phẩy đi cùng cụm, cụm nào cũng giữ nguyên một dòng',
     JSON.stringify(cum.map(c => c.chu)) === JSON.stringify(['Tầng 3,', '63 Hồ Tùng Mậu,', 'TP.HCM']) && cum.every(c => c.giu),
     JSON.stringify(cum));
  const cumCongBo = cumDiaChi(congBo.trim());
  ok('cumDiaChi: bản công bố có phường → 4 cụm, cụm nào cũng giữ nguyên một dòng',
     JSON.stringify(cumCongBo.map(c => c.chu)) === JSON.stringify(['Tầng 3,', '63 Hồ Tùng Mậu,', 'phường Thử,', 'TP. Hồ Chí Minh']) && cumCongBo.every(c => c.giu),
     JSON.stringify(cumCongBo));
  for (const dc of [DIA_CHI_NHA_HANG, congBo.trim(), 'Tầng 3,63 Hồ Tùng Mậu,, TP.HCM', '  Tầng 3 ,  Hồ Tùng Mậu  ', 'Một dòng không dấu phẩy']) {
    ok(`cumDiaChi(${JSON.stringify(dc)}): ghép lại ra ĐÚNG NGUYÊN VĂN (chữ trên trang không đổi)`,
       cumDiaChi(dc).map(c => c.chu + c.cach).join('') === dc, JSON.stringify(cumDiaChi(dc)));
  }
  const dai = cumDiaChi('Tầng 3 số 63 đường Hồ Tùng Mậu Thành phố Hồ Chí Minh Việt Nam');
  ok('cumDiaChi: một cụm dài (bản công bố không dấu phẩy) → không giữ nguyên dòng, kẻo tràn ngang màn hẹp',
     dai.length === 1 && dai[0].giu === false, JSON.stringify(dai));

  // JSON-LD in vào <script>: chữ do người gõ trong /noi-bo (mô tả, địa chỉ) có "</script>" thì không được đóng thẻ sớm.
  const json = jsonTrongScript({ description: 'Ngon </script><script>alert(1)</script>', a: '<!--' });
  ok('jsonTrongScript: không còn "<" nào (</script>, <!-- bị vô hiệu)', !json.includes('<'), json);
  ok('jsonTrongScript: đọc lại ra đúng dữ liệu', JSON.parse(json).description === 'Ngon </script><script>alert(1)</script>', json);
});

// ===========================================================================
await nhom('5 · CÓ KÊNH HỎI BÀN THẬT KHÔNG', async () => {
  ok('Không gì cả → không có kênh', coKenhHoiBan(NEN) === false);
  ok('Form mở → có kênh', coKenhHoiBan(nd({ form_dat_ban_dang_mo: true })) === true);
  ok('Facebook https → có kênh', coKenhHoiBan(nd({ facebook_url: 'https://www.facebook.com/beeftown' })) === true);
  ok('Hotline đúng dạng → có kênh', coKenhHoiBan(nd({ hotline: '028 3822 1234' })) === true);
  ok('Email đúng dạng → có kênh', coKenhHoiBan(nd({ email_lien_he: 'xin-chao@beeftown.vn' })) === true);
  ok('Chỉ Maps / Instagram / TikTok / Zalo → không phải kênh hỏi bàn',
     coKenhHoiBan(nd({ google_maps_url: 'https://maps.app.goo.gl/x', instagram_url: 'https://instagram.com/x',
                       tiktok_url: 'https://tiktok.com/@x', zalo_oa_url: 'https://zalo.me/x' })) === false);
});

// ===========================================================================
await nhom('6 · BỐN MỤC ĐIỀU HƯỚNG (vi, en, ko)', async () => {
  for (const nn of NGON_NGU) {
    const t = chu(nn);
    const dh = dieuHuong(nn);
    const trangChu = duongDanTuongUng('/', nn);
    const mong = [
      [`${trangChu}#trai-nghiem`, t.traiNghiem],
      [duongDanTuongUng('/thuc-don', nn), t.thucDon],
      [duongDanTuongUng('/den-beeftown', nn), t.denBeeftown],
      [duongDanTuongUng('/dat-ban', nn), t.datBan],
    ];
    ok(`[${nn}] Trải nghiệm / Thực đơn / Đến Beeftown / Hỏi bàn — đúng thứ tự, đúng đường dẫn thứ tiếng này`,
       dh.length === 4 && dh.every((m, i) => m.url === mong[i][0] && m.chu === mong[i][1]),
       JSON.stringify(dh.map(m => [m.url, m.chu])));
    ok(`[${nn}] Mục cuối (nút đỏ) là "${t.datBan}"`, dh.at(-1)?.chu === { vi: 'Hỏi bàn', en: 'Ask for a table', ko: '테이블 문의' }[nn],
       dh.at(-1)?.chu);
    ok(`[${nn}] Không mục nào chép tay đường dẫn của thứ tiếng khác`,
       dh.every(m => (nn === 'vi' ? !/^\/(en|ko)(\/|#|$)/.test(m.url) : m.url.startsWith(`/${nn}`))),
       dh.map(m => m.url).join(' '));
  }
});

process.exit(ketThuc('TRANG CÔNG KHAI: NÚT, LIÊN HỆ, ĐỊA CHỈ'));
