/**
 * BEEFTOWN — META PIXEL TRÊN TRANG CÔNG KHAI (ĐỌC TỪ MÃ NGUỒN VÀ GỌI THẲNG THƯ VIỆN)
 * =================================================================================
 *
 *     node test/test-cong-khai-meta-pixel.mjs
 *
 * Khánh giao 27/10/2026: gắn Meta Pixel (Beeftown Pixel, ID 1486681409963017) lên beeftown.vn, bật cho mọi người, không
 * hỏi đồng ý — bù lại không gửi thông tin cá nhân nào cho Meta, và trang Quyền riêng tư nói đúng Meta nhận gì. Thư viện:
 * web/src/lib/meta-pixel.ts. Bất biến:
 *
 *   1. Mã gốc đúng từng chữ bản Meta đưa ("Get started", chép tay dưới đây), ID đúng, fbq('init') không kèm dữ liệu
 *      khách (không So khớp nâng cao).
 *   2. Chỉ khung trang công khai Trang.astro in mã gốc, cuối <head>, trừ trang 404 (khongLapChiMuc). Không ở
 *      /noi-bo, kho, /hook, /mini-app, Beeftown Cân, Mini App Zalo. Ngoài mã gốc, mọi lời gọi fbq đi qua guiSuKien (kiểm
 *      typeof fbq === 'function'); sự kiện nào gửi ở đâu: Lead chỉ ở thẻ "đã nhận" của trang hỏi bàn, InitiateCheckout
 *      chỉ ở Mua thịt về, ViewContent / Contact ở Trang.astro.
 *   3. guiSuKien gửi đúng ('track', tên, { content_name, language }) — không trường nào khác; không fbq, fbq ném lỗi,
 *      trang 404 → không ném, trả false. guiSuKienMotLan: một Lead cho mỗi mã, mã không tới fbq.
 *   4. URL không mang thông tin cá nhân: form có ô họ tên, số điện thoại, email là POST; form GET không có ô đó.
 *   5. Ba trang Quyền riêng tư: bỏ câu "không pixel quảng cáo"; có mục Meta Pixel (sau "Chúng tôi thu những gì", trước
 *      Messenger) kể đủ nút gửi sự kiện, IP, cookie, câu "không gửi cho Meta", cách không bị đo; câu luật có Luật Bảo vệ
 *      dữ liệu cá nhân 2025 (hiệu lực 01/01/2026) và Nghị định 13/2023.
 *
 * Trang dựng thật: web/kiem-tra/trinh-duyet.mjs nhóm 12 (mã gốc trên mọi trang, ViewContent, Contact, tắt JavaScript,
 * 404, Meta bị chặn) và web/kiem-tra/thu-day-du.mjs nhóm 13 (Lead sau khi database nhận, không Lead khi lỗi,
 * InitiateCheckout, Contact với link đã công bố, URL sau khi gửi).
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const PIXEL = await nap('meta-pixel.ts');
const { CAP_DUONG_DAN, NGON_NGU, duongDanTuongUng } = await nap('chu.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — META PIXEL TRÊN TRANG CÔNG KHAI');

const doc = f => readFileSync(join(GOC, f), 'utf8').replace(/\r\n/g, '\n');
const tuGoc = p => relative(GOC, p).split(sep).join('/');
const moiFile = d => !existsSync(d) ? [] : readdirSync(d, { withFileTypes: true })
  .flatMap(x => x.isDirectory() ? (x.name === 'node_modules' ? [] : moiFile(join(d, x.name))) : [join(d, x.name)]);
/** Mã không chú thích: bỏ khối /* … *\/, dòng // …, chú thích {/* … *\/} của Astro. */
const boChuThich = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/[^\n]*/g, '$1');

// Mã gốc Meta Pixel, chép tay từ bản giao 27/10/2026 (Meta, "Get started" của Meta Pixel) — đúng từng ký tự.
const MA_META = `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1486681409963017');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1486681409963017&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;

// ===========================================================================
await nhom('1 · MÃ GỐC ĐÚNG TỪNG CHỮ BẢN META ĐƯA, ĐÚNG ID, KHÔNG SO KHỚP NÂNG CAO', async () => {
  ok('MA_PIXEL = 1486681409963017 (Beeftown Pixel, Business Beeftown 2104301050185040)', PIXEL.MA_PIXEL === '1486681409963017');
  const ma = PIXEL.khoiMaPixel();
  ok('khoiMaPixel() đúng từng ký tự mã gốc Meta đưa', ma === MA_META,
     [...ma].findIndex((c, i) => c !== MA_META[i]) >= 0 ? `lệch từ ký tự ${[...ma].findIndex((c, i) => c !== MA_META[i])}` : `dài ${ma.length} / ${MA_META.length}`);
  ok('fbq("init") chỉ có ID — không tham số thứ ba (So khớp nâng cao: email, số điện thoại, tên)',
     /fbq\('init', '\d+'\);/.test(ma) && !/fbq\('init', '\d+',/.test(ma) && !/\b(em|ph|fn|ln|external_id)\s*:/.test(ma));
  ok('Đúng một fbq("track") trong mã gốc, là PageView không kèm tham số',
     (ma.match(/fbq\('track'/g) ?? []).length === 1 && ma.includes("fbq('track', 'PageView');"));
  let nem = 0;
  for (const sai of ['abc', "1'); alert(1); //", '123', '14866814099630170000']) { try { PIXEL.khoiMaPixel(sai); } catch { nem++; } }
  ok('khoiMaPixel() từ chối ID sai dạng (chữ, dấu nháy, quá ngắn, quá dài) — không chèn được gì vào script', nem === 4, `${nem}/4`);
});

// ===========================================================================
await nhom('2 · GẮN Ở ĐÂU: CHỈ TRANG.ASTRO, TRỪ 404; MỌI LỜI GỌI FBQ QUA guiSuKien', async () => {
  const trang = doc('web/src/layouts/Trang.astro');
  ok('Trang.astro: tên trang null khi khongLapChiMuc (trang 404 không gắn pixel)',
     /const tenTrang = khongLapChiMuc \? null : tenTrangPixel\(banCua\('vi'\)\);/.test(trang));
  ok('Trang.astro: một chỗ in mã gốc, chỉ khi có tên trang, là thẻ cuối Trang.astro viết trong <head>',
     (trang.match(/khoiMaPixel\(\)/g) ?? []).length === 1
       && /\{tenTrang && <Fragment set:html=\{khoiMaPixel\(\)\} \/>\}\s*<\/head>/.test(trang));
  ok('Trang.astro: <body> mang data-pixel-trang (không có thì bỏ thuộc tính)',
     /<body class="ck" data-pixel-trang=\{tenTrang \?\? undefined\}>/.test(trang));
  ok('404.astro dựng Trang với khongLapChiMuc', /<Trang [^>]*\bkhongLapChiMuc\b/.test(doc('web/src/pages/404.astro')));

  // Không chỗ nào khác của web/src, Beeftown Cân, Mini App Zalo nhắc tới pixel.
  const CHO_PIXEL = new Set(['web/src/lib/meta-pixel.ts', 'web/src/layouts/Trang.astro',
    'web/src/components/TrangDatBan.astro', 'web/src/components/TrangMuaThitVe.astro']);
  const MAU_PIXEL = new RegExp(`${PIXEL.MA_PIXEL}|\\bfbq\\b|fbevents|meta-pixel|connect\\.facebook\\.net|facebook\\.com/tr\\b`);
  const tep = [...moiFile(SRC), ...moiFile(join(GOC, 'can-app', 'src')), ...moiFile(join(GOC, 'mini-app', 'src'))]
    .filter(f => /\.(astro|ts|tsx|js|mjs|jsx|html|css)$/.test(f));
  // Chú thích nhắc tới pixel thì được (trang Quyền riêng tư dẫn tới lib/meta-pixel.ts) — chỉ mã mới tính.
  const lac = tep.map(tuGoc).filter(f => !CHO_PIXEL.has(f) && MAU_PIXEL.test(boChuThich(doc(f))));
  ok(`Chỉ ${[...CHO_PIXEL].join(', ')} nhắc tới pixel — không /noi-bo, kho, /hook, /mini-app, Beeftown Cân, Mini App Zalo (${tep.length} file)`,
     lac.length === 0, lac.join(', '));
  const thieu = [...CHO_PIXEL].filter(f => !MAU_PIXEL.test(doc(f)));
  ok('Bốn file đó đều thật sự có pixel', thieu.length === 0, thieu.join(', '));

  // Ngoài mã gốc (chuỗi trong khoiMaPixel), lời gọi fbq duy nhất là của guiSuKien — nơi kiểm typeof fbq === 'function'.
  const lib = boChuThich(doc('web/src/lib/meta-pixel.ts'));
  const ngoaiMaGoc = lib.replace(/return `<!-- Meta Pixel Code -->[\s\S]*?<!-- End Meta Pixel Code -->`;/, '');
  ok('meta-pixel.ts: ngoài mã gốc chỉ một lời gọi fbq, nằm sau typeof fbq !== \'function\' trong khối try',
     (ngoaiMaGoc.match(/\bfbq\(/g) ?? []).length === 1
       && /try \{\s*const fbq = mt\.fbq;\s*if \(typeof fbq !== 'function'\) return false;[\s\S]*?fbq\('track', ten, thamSo\);/.test(ngoaiMaGoc));
  const goiThang = [...CHO_PIXEL].filter(f => f !== 'web/src/lib/meta-pixel.ts' && /\bfbq\s*\(/.test(boChuThich(doc(f))));
  ok('Trang.astro, TrangDatBan.astro, TrangMuaThitVe.astro không gọi fbq trực tiếp', goiThang.length === 0, goiThang.join(', '));

  // Sự kiện nào gửi ở đâu.
  const suKien = f => [...boChuThich(doc(f)).matchAll(/\bguiSuKien(?:MotLan)?\(\s*'(\w+)'/g)].map(m => m[1]);
  ok('TrangDatBan.astro chỉ gửi Lead, TrangMuaThitVe.astro chỉ InitiateCheckout — cả hai qua guiSuKienMotLan',
     JSON.stringify(suKien('web/src/components/TrangDatBan.astro')) === '["Lead"]'
       && /guiSuKienMotLan\('Lead'/.test(doc('web/src/components/TrangDatBan.astro'))
       && JSON.stringify(suKien('web/src/components/TrangMuaThitVe.astro')) === '["InitiateCheckout"]'
       && /guiSuKienMotLan\('InitiateCheckout'/.test(doc('web/src/components/TrangMuaThitVe.astro')),
     `${suKien('web/src/components/TrangDatBan.astro')} · ${suKien('web/src/components/TrangMuaThitVe.astro')}`);
  ok('Trang.astro gửi đúng hai thứ: sự kiện lúc mở trang (suKienMoTrang) và sự kiện của link được bấm (suKienCuaLink), cả click lẫn auxclick',
     /const moTrang = suKienMoTrang\(document\.body\.dataset\.pixelTrang\);\s*if \(moTrang\) guiSuKien\(moTrang\);/.test(trang)
       && /const suKien = lien \? suKienCuaLink\(lien\.href\) : null;\s*if \(suKien\) guiSuKien\(suKien\);/.test(trang)
       && /document\.addEventListener\('click', baoLink, true\);\s*document\.addEventListener\('auxclick', baoLink, true\);/.test(trang)
       && (trang.match(/\bguiSuKien\(/g) ?? []).length === 2);
  ok('meta-pixel.ts (chạy trong trình duyệt) không dùng Object.hasOwn — WebView Android cũ không có',
     !/Object\.hasOwn\b/.test(boChuThich(doc('web/src/lib/meta-pixel.ts'))));

  // Lead cùng nhánh với câu "đã nhận yêu cầu": data-ma chỉ trên thẻ data-ket-qua="da-nhan" (máy chủ chỉ dựng thẻ đó khi
  // database đã trả mã), và script chỉ gửi Lead khi thấy đúng thẻ đó.
  const datBan = doc('web/src/components/TrangDatBan.astro');
  ok('TrangDatBan.astro: data-ma chỉ nằm trên thẻ "đã nhận", trong nhánh {daNhanYeuCau && ketQua && (…)}',
     (datBan.match(/data-ma=/g) ?? []).length === 1
       && /\{daNhanYeuCau && ketQua && \(\s*<div class="hb-the hb-da-nhan" data-ket-qua="da-nhan" data-ma=\{ketQua\.ma\}/.test(datBan)
       && /const daNhanYeuCau = ketQua\?\.ok === true;/.test(datBan));
  ok('TrangDatBan.astro: Lead chỉ khi khung kết quả là "da-nhan" và có mã, một lần cho mỗi mã',
     /if \(khungKetQua\?\.dataset\.ketQua === 'da-nhan' && khungKetQua\.dataset\.ma\) guiSuKienMotLan\('Lead', khungKetQua\.dataset\.ma\);/.test(datBan));
  const mua = doc('web/src/components/TrangMuaThitVe.astro');
  ok('TrangMuaThitVe.astro: InitiateCheckout khi gửi form có giỏ và khi bấm "Xem đơn" của thanh dưới, một lần cho mỗi giỏ',
     /if \(donHienTai && donHienTai\.dong\.length > 0\) \{\s*baoXemDon\(\);\s*return;\s*\}/.test(mua)
       && /thanhXem\?\.addEventListener\('click', baoXemDon\);/.test(mua)
       && /guiSuKienMotLan\('InitiateCheckout', gio\.sort\(\)\.join\('&'\)\);/.test(mua));
});

// ===========================================================================
await nhom('3 · guiSuKien CHỈ GỬI TÊN TRANG VÀ THỨ TIẾNG; KHÔNG BAO GIỜ NÉM LỖI', async () => {
  const { guiSuKien, guiSuKienMotLan, thamSoTrang, suKienCuaLink, suKienMoTrang, tenTrangPixel, KHOA_DA_GUI } = PIXEL;
  const trinhDuyet = ({ ten = 'thuc-don', lang = 'vi', fbq, kho } = {}) => {
    const goi = [];
    const mt = {
      fbq: fbq === undefined ? (...a) => { goi.push(a); } : fbq,
      document: { documentElement: { lang }, body: { dataset: ten === null ? {} : { pixelTrang: ten } } },
      sessionStorage: kho,
    };
    return { mt, goi };
  };
  const khoGia = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, String(v)); }, m }; };

  {
    const { mt, goi } = trinhDuyet({ ten: 'dat-ban', lang: 'ko' });
    const gui = guiSuKien('Contact', mt);
    ok('guiSuKien: gọi fbq đúng một lần với (\'track\', tên, { content_name, language }) — đúng hai trường',
       gui === true && goi.length === 1 && goi[0].length === 3 && goi[0][0] === 'track' && goi[0][1] === 'Contact'
         && JSON.stringify(goi[0][2]) === '{"content_name":"dat-ban","language":"ko"}', JSON.stringify(goi));
  }
  {
    const loi = [];
    const kq = [
      guiSuKien('Lead', { document: trinhDuyet().mt.document }),                                    // không fbq
      guiSuKien('Lead', { ...trinhDuyet().mt, fbq: { queue: [] } }),                                // fbq không phải hàm
      guiSuKien('Lead', { ...trinhDuyet().mt, fbq: () => { throw new Error('fbevents hỏng'); } }),   // fbq ném lỗi
      guiSuKien('Lead', {}),                                                                         // không document
    ];
    ok('guiSuKien: không fbq, fbq không phải hàm, fbq ném lỗi, không document → false, không ném', kq.every(x => x === false) && !loi.length,
       JSON.stringify(kq));
  }
  {
    const sai = [['thuc-don', 'fr'], ['thuc-don', ''], [null, 'vi'], ['Thuc Don', 'vi'], ['<script>', 'vi'], ['', 'vi']];
    const lot = sai.filter(([ten, lang]) => { const { mt, goi } = trinhDuyet({ ten, lang }); return guiSuKien('PageView', mt) || goi.length; });
    ok('guiSuKien: trang không có tên (404), tên sai dạng, thứ tiếng lạ → không gọi fbq', lot.length === 0, JSON.stringify(lot));
  }
  ok('thamSoTrang: đúng hai khóa content_name, language',
     JSON.stringify(Object.keys(thamSoTrang(trinhDuyet({ ten: 'trang-chu', lang: 'en' }).mt))) === '["content_name","language"]');

  {
    const kho = khoGia();
    const { mt, goi } = trinhDuyet({ ten: 'dat-ban', kho });
    const ma = 'BT-2610-0042';
    const kq = [guiSuKienMotLan('Lead', ma, mt), guiSuKienMotLan('Lead', ma, mt), guiSuKienMotLan('Lead', 'BT-2610-0043', mt)];
    ok('guiSuKienMotLan: cùng mã gửi một lần (tải lại, bấm Back về thẻ "đã nhận" không thành Lead thứ hai); mã khác gửi tiếp',
       JSON.stringify(kq) === '[true,false,true]' && goi.length === 2 && goi.every(g => g[1] === 'Lead'), JSON.stringify(kq));
    ok('guiSuKienMotLan: mã đặt bàn không bao giờ tới fbq (chỉ nằm trong sessionStorage của thẻ trình duyệt)',
       !JSON.stringify(goi).includes('BT-') && (kho.m.get(KHOA_DA_GUI) ?? '').includes(ma), JSON.stringify(goi));
  }
  {
    const nem = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('QuotaExceeded'); } };
    const { mt, goi } = trinhDuyet({ ten: 'dat-ban', kho: nem });
    const kq = [guiSuKienMotLan('Lead', 'BT-1', mt), guiSuKienMotLan('Lead', 'BT-1', mt)];
    ok('guiSuKienMotLan: sessionStorage bị chặn (chế độ riêng tư) → vẫn gửi, không ném', kq.every(Boolean) && goi.length === 2, JSON.stringify(kq));
    const { mt: mt2, goi: goi2 } = trinhDuyet({ ten: 'dat-ban', kho: khoGia(), fbq: null });
    const kho2 = mt2.sessionStorage;
    ok('guiSuKienMotLan: fbq không có → không ghi là đã gửi',
       guiSuKienMotLan('Lead', 'BT-2', mt2) === false && kho2.getItem(KHOA_DA_GUI) === null && goi2.length === 0);
  }

  const LINK = [
    ['tel:+84283822123', 'Contact'], ['TEL:0961245124', 'Contact'], [' tel:028 3822 1234', 'Contact'],
    ['https://zalo.me/1234567890', 'Contact'], ['https://oa.zalo.me/home', 'Contact'], ['https://zalo.me/s/2858300068641327950/', 'Contact'],
    ['http://zalo.me/123', 'Contact'], ['https://m.me/beeftown', 'Contact'], ['https://www.messenger.com/t/beeftown', 'Contact'],
    ['https://www.facebook.com/beeftown', null], ['https://facebook.com/messages/t/1', null], ['mailto:thu@beeftown.vn', null],
    ['/thuc-don', null], ['#xem-don', null], ['https://beeftown.vn/dat-ban', null], ['javascript:alert(1)', null],
    ['https://zalo.me.example.com/x', null], ['https://notzalo.me/x', null], ['https://evilm.me/x', null], ['zalo://chat', null],
    ['', null], [null, null], [undefined, null],
  ];
  const sai = LINK.filter(([l, mong]) => suKienCuaLink(l) !== mong);
  ok(`suKienCuaLink: ${LINK.length} link — tel:, zalo.me (cả tên miền con), m.me, messenger.com là Contact; Trang Facebook, email, link trong trang, tên miền giả thì không`,
     sai.length === 0, sai.map(([l]) => `${l} → ${suKienCuaLink(l)}`).join(' | '));

  ok('suKienMoTrang: chỉ trang Thực đơn có ViewContent; tên lạ, constructor, __proto__ → null',
     suKienMoTrang('thuc-don') === 'ViewContent' && [undefined, null, '', 'trang-chu', 'dat-ban', 'mua-thit-ve', 'constructor', '__proto__', 'toString']
       .every(t => suKienMoTrang(t) === null));

  const tenSai = [];
  for (const cap of CAP_DUONG_DAN) {
    const ten = tenTrangPixel(cap[0]);
    if (!thamSoTrang(trinhDuyet({ ten }).mt)) tenSai.push(`${cap[0]} → ${ten} sai dạng`);
    for (const nn of NGON_NGU) {
      if (tenTrangPixel(duongDanTuongUng(cap[NGON_NGU.indexOf(nn)], 'vi')) !== ten) tenSai.push(`${cap[NGON_NGU.indexOf(nn)]} khác ${ten}`);
    }
  }
  ok(`tenTrangPixel: mọi trang của CAP_DUONG_DAN (${CAP_DUONG_DAN.length} × 3 thứ tiếng) có tên đúng dạng, cùng một tên cho ba thứ tiếng`,
     tenSai.length === 0 && tenTrangPixel('/') === 'trang-chu' && tenTrangPixel('/thuc-don') === 'thuc-don'
       && tenTrangPixel('/thuc-don/') === 'thuc-don', tenSai.join(' | '));
});

// ===========================================================================
await nhom('4 · URL KHÔNG MANG THÔNG TIN CÁ NHÂN: FORM CÓ Ô HỌ TÊN, ĐIỆN THOẠI, EMAIL LÀ POST', async () => {
  // Meta Pixel gửi địa chỉ trang đang xem cho Meta. Form GET đưa mọi ô vào địa chỉ trang.
  const CA_NHAN = /^(ho_ten|ten|sdt|so_dien_thoai|dien_thoai|email|dia_chi)$/;
  const tep = [...moiFile(join(SRC, 'components')), ...moiFile(join(SRC, 'pages')), join(SRC, 'layouts', 'Trang.astro')]
    .filter(f => f.endsWith('.astro') && !f.includes(`${sep}noi-bo${sep}`) && !f.includes(`${sep}kho${sep}`));
  const form = tep.flatMap(f => [...doc(tuGoc(f)).matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/g)].map(m => ({
    f: tuGoc(f), method: (/\bmethod="(\w+)"/i.exec(m[1])?.[1] ?? 'get').toLowerCase(),
    o: [...m[2].matchAll(/\bname="([\w-]+)"/g)].map(x => x[1]),
  })));
  const sai = form.filter(x => x.method !== 'post' && x.o.some(o => CA_NHAN.test(o)));
  ok(`${form.length} form công khai: form GET không có ô họ tên, số điện thoại, email, địa chỉ`, form.length >= 3 && sai.length === 0,
     sai.map(x => `${x.f}: ${x.o.filter(o => CA_NHAN.test(o)).join(', ')}`).join(' | '));
  const coCaNhan = form.filter(x => x.o.some(o => CA_NHAN.test(o)));
  ok('Form hỏi bàn và form nộp hồ sơ (có ô họ tên, số điện thoại) là POST',
     coCaNhan.length >= 2 && coCaNhan.every(x => x.method === 'post')
       && coCaNhan.some(x => x.f.endsWith('TrangDatBan.astro')) && coCaNhan.some(x => x.f.endsWith('FormUngTuyen.astro')),
     coCaNhan.map(x => `${x.f} ${x.method}`).join(' | '));
});

// ===========================================================================
await nhom('5 · TRANG QUYỀN RIÊNG TƯ NÓI ĐÚNG META NHẬN GÌ (VI / EN / KO)', async () => {
  const BA = {
    vi: { f: 'web/src/pages/quyen-rieng-tu.astro', muc: 'Khi bạn xem trang web này', truoc: 'Chúng tôi thu những gì',
      sau: 'Khi bạn nhắn Beeftown qua Messenger',
      cam: /không pixel quảng cáo|không dùng công cụ đo lường của bên thứ ba|không theo dõi bạn/i,
      nut: ['gọi điện', 'mở Zalo', 'mở Messenger', 'xem đơn mua thịt', 'gửi yêu cầu đặt bàn'],
      con: ['Meta Pixel', 'trang bạn đang xem', 'địa chỉ IP', 'loại trình duyệt', 'mã cookie', 'không gửi cho Meta',
        'bất kỳ thông tin nào bạn điền vào form', 'nước ngoài', 'chặn trình theo dõi', 'Cài đặt quảng cáo'],
      luat: ['Luật Bảo vệ dữ liệu cá nhân 2025', '01/01/2026', 'Nghị định 13/2023/NĐ-CP'] },
    en: { f: 'web/src/pages/en/privacy.astro', muc: 'When you browse this website', truoc: 'What we collect',
      sau: 'When you message Beeftown on Messenger',
      cam: /no advertising pixels|uses no third-party analytics|no tracking you/i,
      nut: ['calling', 'opening Zalo', 'opening Messenger', 'viewing a take-home order', 'sending a table request'],
      con: ['Meta Pixel', 'the page you are viewing', 'IP address', 'browser type', 'cookie ID', 'does not send Meta',
        'anything you type into a form', 'outside Vietnam', 'tracker blocking', 'ad preferences'],
      luat: ['Law on Personal Data Protection 2025', '1 January 2026', 'Decree 13/2023/ND-CP'] },
    ko: { f: 'web/src/pages/ko/privacy.astro', muc: '이 웹사이트를 보실 때', truoc: '수집하는 정보',
      sau: 'Messenger로 Beeftown에 메시지를 보내실 때',
      cam: /광고 픽셀도 쓰지 않|제3자 분석 도구를 사용하지 않|추적하지도/,
      nut: ['전화 걸기', 'Zalo 열기', 'Messenger 열기', '포장 구매 주문 보기', '테이블 문의 보내기'],
      con: ['Meta Pixel', '보고 계신 페이지', 'IP 주소', '브라우저 종류', '쿠키 식별값', 'Meta에 보내지 않아요',
        '양식에 입력하신 어떤 정보도', '해외', '추적 방지', '광고 설정'],
      luat: ['Luật Bảo vệ dữ liệu cá nhân 2025', '2026년 1월 1일', 'Nghị định 13/2023/NĐ-CP'] },
  };
  /** Chữ khách đọc: bỏ thẻ, gộp khoảng trắng (trang dựng với compressHTML — xuống dòng giữa chữ thành một dấu cách). */
  const chuDoc = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
  for (const [nn, x] of Object.entries(BA)) {
    const s = doc(x.f);
    const than = s.slice(s.indexOf('<TrangVanBan'));
    const iTruoc = than.indexOf(`<h2>${x.truoc}</h2>`), iMuc = than.indexOf(`<h2>${x.muc}</h2>`), iSau = than.indexOf(`<h2>${x.sau}</h2>`);
    ok(`[${nn}] mục "${x.muc}" đứng sau "${x.truoc}", trước "${x.sau}"`, iTruoc > -1 && iTruoc < iMuc && iMuc < iSau,
       `${iTruoc} · ${iMuc} · ${iSau}`);
    ok(`[${nn}] không còn câu nói Beeftown không dùng pixel / công cụ đo lường bên thứ ba`, !x.cam.test(chuDoc(than)),
       chuDoc(than).match(x.cam)?.[0]);
    const muc = iMuc > -1 ? chuDoc(than.slice(iMuc, than.indexOf('<h2>', iMuc + 4))) : '';
    const thieuNut = x.nut.filter(n => !muc.includes(n));
    ok(`[${nn}] mục Meta Pixel kể đủ năm nút gửi sự kiện: gọi điện, Zalo, Messenger (Contact), xem đơn mua thịt (InitiateCheckout), gửi yêu cầu đặt bàn (Lead)`,
       thieuNut.length === 0, `thiếu: ${thieuNut.join(', ')}`);
    const thieuY = x.con.filter(c => !muc.includes(c));
    ok(`[${nn}] mục Meta Pixel có: trang đang xem, IP, trình duyệt, cookie, câu "không gửi cho Meta" thông tin form, máy chủ nước ngoài, cách không bị đo`,
       thieuY.length === 0, `thiếu: ${thieuY.join(', ')}`);
    const cam = timChuoiCam(muc);
    ok(`[${nn}] mục Meta Pixel không chữ cấm`, cam.length === 0, cam.map(c => c.tim_thay).join(' · '));
    const cuoi = chuDoc((than.match(/<p class="nho">[\s\S]*?<\/p>/g) ?? []).at(-1) ?? '');
    const thieuLuat = x.luat.filter(l => !cuoi.includes(l));
    ok(`[${nn}] câu luật cuối trang có Luật Bảo vệ dữ liệu cá nhân 2025 (hiệu lực 01/01/2026) và Nghị định 13/2023`,
       thieuLuat.length === 0, `«${cuoi}» thiếu ${thieuLuat.join(', ')}`);
  }
});

process.exit(ketThuc('META PIXEL'));
