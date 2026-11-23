/**
 * TRANG MUA THỊT VỀ — TÊN VIỆT / HÀN CỦA PHẦN THỊT VÀ LINK SANG TRANG CÁC PHẦN THỊT BÒ (SEO, 23/11/2026)
 * =====================================================================================================
 * Chạy: node test/test-cong-khai-ten-phan-thit.mjs
 *
 * Menu của trang lấy từ database và tên gói là tên khay bằng tiếng Anh: Ribeye, Ribeye with Cap, Outside Skirt, Top Blade,
 * Galbisal, LA Galbi. Người Việt tìm "đầu thăn ngoại", "dẻ sườn bò", "diềm thăn bò". Web/src/lib/ten-phan-thit.ts đổi CÁCH
 * HIỆN (không đụng database): trang Việt "Đầu thăn ngoại (Ribeye)", trang Hàn "꽃등심 (Ribeye)", trang Anh giữ tên gốc. Giữ:
 *   1. tenHienThi: đúng tên, từ BANG_TU của tieng-viet-trang.ts (không chép tên mới); ba tên Hàn Khánh chốt; tên chủ dịch
 *      tay và tên không có trong bảng giữ nguyên; kim chi không đổi; không "thăn vai", không đặt tên cho chimasal.
 *   2. lienKetPhanThit: mỗi gói thịt dẫn tới #pb-<id> của đúng phần ở trang Các phần thịt bò, đủ ba thứ tiếng; chỉ khi trang
 *      đó CÓ mục (LA Galbi, Ba chỉ bò chờ PR của phiên trang Phần thịt); kim chi và tên lạ không link.
 *   3. Chỗ dùng: thẻ gói, hộp chọn, nhãn đọc màn hình, dòng "Đơn của bạn" (máy chủ và script), thẻ đơn của Trang, JSON-LD
 *      Product. Đơn gửi quán KHÔNG đổi: trang chỉ gửi khóa gói và số lượng, tên trên đơn là tên database chụp lại.
 *   4. Link cho cột Thông tin ở chân trang và dải "Nhìn tận mắt, chọn tận tay" ở trang chủ (ba thứ tiếng).
 * Trang dựng thật (thẻ, link, tên ở dòng đơn): web/kiem-tra/thu-day-du.mjs nhóm 12.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const doc = (...p) => readFileSync(join(SRC, ...p), 'utf8').replace(/\r\n/g, '\n');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TÊN PHẦN THỊT VÀ LINK SANG TRANG CÁC PHẦN THỊT BÒ');

const { tenHienThi, lienKetPhanThit, PHAN_THIT } = await nap('ten-phan-thit.ts');
const { BANG_TU } = await nap('tieng-viet-trang.ts');
const { PHAN_BO } = await nap('phan-bo.ts');
const { chu, NGON_NGU, duongDanTuongUng } = await nap('chu.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');
const { nhomMuaThitVe, chiaNhom, sanPhamJsonLd } = await nap('mua-thit-ve.ts');
const { khoaGoi } = await nap('don-mua-thit.ts');
const { theDon } = await nap('tro-ly-trang.ts');

/** Sản phẩm như nhomMuaThitVe dựng: chỉ các trường hai hàm đọc. */
const sp = (tenVi, ten = tenVi, loai = 'thit') => ({ loai, ten, tenVi });
const BA = ['vi', 'en', 'ko'];
const dongDb = (ma, tenVi, ten = tenVi, soGam = 200, loai = 'thit') => ({
  san_pham_ma: ma, loai, don_vi: loai === 'kim_chi' ? 'hop' : 'goi', bao_quan: 'mat', ten, ten_vi: tenVi, mo_ta: null, cach_dung: null, so_gam: soGam, gia: 189000, tam_het: false,
});

// ===========================================================================
await nhom('1 · tenHienThi: TÊN VIỆT / HÀN KÈM TÊN KHAY, LẤY TỪ BẢNG NHÀ', async () => {
  const VI = [
    ['Ribeye', 'Đầu thăn ngoại (Ribeye)'],
    ['Ribeye with Cap', 'Đầu thăn ngoại còn nắp (Ribeye with Cap)'],
    ['Outside Skirt', 'Diềm thăn bò (Outside Skirt)'],
    ['Top Blade', 'Lõi vai bò (Top Blade)'],
    ['Galbisal', 'Dẻ sườn bò (Galbisal)'],
    ['LA Galbi', 'Sườn bò cắt ngang ướp sẵn (LA Galbi)'],
  ];
  for (const [goc, mong] of VI) ok(`vi: «${goc}» → «${mong}»`, tenHienThi(sp(goc), 'vi') === mong, tenHienThi(sp(goc), 'vi'));
  ok('Tên Việt lấy đúng từ BANG_TU của tieng-viet-trang.ts (cột hai, viết hoa chữ đầu) — file này không chép tên nào',
     VI.every(([goc]) => {
       const dong = BANG_TU.find(d => d[0].toLowerCase() === goc.toLowerCase());
       return !!dong && tenHienThi(sp(goc), 'vi').startsWith(dong[1].charAt(0).toUpperCase() + dong[1].slice(1) + ' (');
     }));
  ok('Bốn tên chung với trang Các phần thịt bò (PHAN_BO) khớp nhau: đầu thăn ngoại, dẻ sườn bò, diềm thăn bò, lõi vai bò',
     [['Ribeye', 'dau-than-ngoai'], ['Galbisal', 'de-suon'], ['Outside Skirt', 'diem-than'], ['Top Blade', 'loi-vai']].every(([goc, id]) =>
       tenHienThi(sp(goc), 'vi').startsWith(PHAN_BO.find(p => p.id === id).ten.vi + ' (')));
  ok('Tên khay nằm trong ngoặc là đúng chữ database (ten), để khách đối chiếu với nhãn khay', tenHienThi(sp('Ribeye', 'Ribeye'), 'vi').endsWith('(Ribeye)'));

  // Tiếng Hàn: ba tên Khánh chốt; không có tên thì giữ tên gốc.
  const KO = [['Ribeye', '꽃등심 (Ribeye)'], ['Ribeye with Cap', '꽃등심 (Ribeye with Cap)'], ['Galbisal', '갈비살 (Galbisal)'],
    ['Outside Skirt', '안창살 (Outside Skirt)'], ['Top Blade', 'Top Blade'], ['LA Galbi', 'LA Galbi']];
  for (const [goc, mong] of KO) ok(`ko: «${goc}» → «${mong}»`, tenHienThi(sp(goc), 'ko') === mong, tenHienThi(sp(goc), 'ko'));
  ok('Ba tên Hàn (꽃등심, 갈비살, 안창살) trùng tên Hàn của PHAN_BO ở trang Các phần thịt bò',
     [['dau-than-ngoai', '꽃등심'], ['de-suon', '갈비살'], ['diem-than', '안창살']].every(([id, ko]) => PHAN_BO.find(p => p.id === id).ten.ko === ko));
  ok('ko: tên chủ đã dịch trong /noi-bo (ten khác tenVi) giữ nguyên, không chồng thêm tên Hàn', tenHienThi(sp('Ribeye with Cap', '립아이 캡'), 'ko') === '립아이 캡');

  // Tiếng Anh: giữ tên gốc (kể cả tên chủ dịch).
  for (const [goc] of VI) ok(`en: «${goc}» giữ nguyên`, tenHienThi(sp(goc), 'en') === goc);
  ok('en: tên chủ dịch giữ nguyên', tenHienThi(sp('Ribeye with Cap', 'Ribeye with the cap'), 'en') === 'Ribeye with the cap');

  // Không đổi: tên đã Việt, tên lạ, kim chi, tên chủ đã đổi sang tên Việt.
  ok('Tên đã là tiếng Việt ("Ba chỉ bò", "Kim chi cải thảo") giữ nguyên ở cả ba thứ tiếng',
     BA.every(nn => tenHienThi(sp('Ba chỉ bò'), nn) === 'Ba chỉ bò' && tenHienThi(sp('Kim chi cải thảo', 'Kim chi cải thảo', 'kim_chi'), nn) === 'Kim chi cải thảo'));
  ok('Tên không có trong bảng giữ nguyên (chủ thêm gói mới: không bao giờ đoán tên)',
     BA.every(nn => tenHienThi(sp('Chuck Roll'), nn) === 'Chuck Roll' && tenHienThi(sp('Chimasal'), nn) === 'Chimasal'));
  ok('Kim chi tên "Ribeye" (sản phẩm loại kim_chi) cũng không đổi — chỉ thịt được đổi tên', BA.every(nn => tenHienThi(sp('Ribeye', 'Ribeye', 'kim_chi'), nn) === 'Ribeye'));
  ok('vi: chủ đã đổi tên thành tên Việt ("Đầu thăn ngoại") thì không lặp lại trong ngoặc', tenHienThi(sp('Ribeye', 'Đầu thăn ngoại'), 'vi') === 'Đầu thăn ngoại');
  ok('Khớp không phân biệt hoa thường và dấu cách thừa: " ribeye  WITH cap " là Ribeye with Cap',
     tenHienThi(sp(' ribeye  WITH cap ', ' ribeye  WITH cap '), 'vi').startsWith('Đầu thăn ngoại còn nắp ('));
  ok('Khớp trọn tên: "Ribeye Wagyu", "Ribeye Cap Roll" không bị coi là Ribeye', tenHienThi(sp('Ribeye Cap Roll'), 'vi') === 'Ribeye Cap Roll');

  // Luật chữ.
  const mọi = BA.flatMap(nn => PHAN_THIT.map(p => tenHienThi(sp(p.goc), nn)));
  ok('Không tên nào chứa "thăn vai" (người bán dùng cho lõi vai, T-bone và ribeye — dễ nhầm)', mọi.every(t => !/thăn\s+vai/iu.test(t)), mọi.filter(t => /thăn\s+vai/iu.test(t)).join(' | '));
  ok('Không tên nào dính chữ cấm (chuoi-cam.js)', mọi.every(t => timChuoiCam(t).length === 0), JSON.stringify(mọi.flatMap(t => timChuoiCam(t))));
  ok('Chimasal (chưa chốt tên Việt) không có trong bảng của ten-phan-thit.ts', !PHAN_THIT.some(p => /chima/i.test(p.goc) || /치마/.test(p.ko ?? '')) && !/chimasal/i.test(doc('lib', 'ten-phan-thit.ts').replace(/\/\*[\s\S]*?\*\//g, '')));
  ok('Mọi dòng của PHAN_THIT có tên Việt trong BANG_TU trừ phần đã là tên Việt ("Ba chỉ bò")',
     PHAN_THIT.every(p => !p.viTuBang || BANG_TU.some(d => d[0].toLowerCase() === p.goc.toLowerCase())), PHAN_THIT.map(p => p.goc).join(', '));
});

// ===========================================================================
await nhom('2 · lienKetPhanThit: ĐÚNG MỤC, ĐỦ BA THỨ TIẾNG, CHỈ KHI TRANG CÓ MỤC ĐÓ', async () => {
  const MUC = [['Ribeye', 'dau-than-ngoai'], ['Ribeye with Cap', 'dau-than-ngoai'], ['Outside Skirt', 'diem-than'], ['Top Blade', 'loi-vai'], ['Galbisal', 'de-suon']];
  for (const [goc, id] of MUC) {
    ok(`«${goc}» → #pb-${id}, ba thứ tiếng (/phan-thit-bo, /en/beef-cuts, /ko/beef-cuts)`,
       BA.every(nn => lienKetPhanThit(sp(goc), nn) === `${duongDanTuongUng('/phan-thit-bo', nn)}#pb-${id}`),
       BA.map(nn => lienKetPhanThit(sp(goc), nn)).join(' | '));
    ok(`#pb-${id} có thật trên trang Các phần thịt bò (PHAN_BO)`, PHAN_BO.some(p => p.id === id));
  }
  ok('Ba đường dẫn của trang đúng: /phan-thit-bo, /en/beef-cuts, /ko/beef-cuts',
     duongDanTuongUng('/phan-thit-bo', 'vi') === '/phan-thit-bo' && duongDanTuongUng('/phan-thit-bo', 'en') === '/en/beef-cuts' && duongDanTuongUng('/phan-thit-bo', 'ko') === '/ko/beef-cuts');

  // LA Galbi và Ba chỉ bò: link chỉ khi PHAN_BO đã có mục (#pb-la-galbi, #pb-ba-chi — PR của phiên trang Phần thịt).
  for (const [goc, id] of [['LA Galbi', 'la-galbi'], ['Ba chỉ bò', 'ba-chi']]) {
    const co = PHAN_BO.some(p => p.id === id);
    ok(`«${goc}»: ${co ? `trang đã có #pb-${id} → có link` : `trang chưa có #pb-${id} → chưa link (tự hiện khi PR trang Phần thịt vào)`}`,
       BA.every(nn => lienKetPhanThit(sp(goc), nn) === (co ? `${duongDanTuongUng('/phan-thit-bo', nn)}#pb-${id}` : null)),
       BA.map(nn => lienKetPhanThit(sp(goc), nn)).join(' | '));
  }
  ok('Mọi link phát ra trỏ tới một id có thật trong PHAN_BO (không bao giờ link vào hư không)',
     PHAN_THIT.every(p => BA.every(nn => { const l = lienKetPhanThit(sp(p.goc), nn); return l === null || PHAN_BO.some(x => l.endsWith(`#pb-${x.id}`)); })));
  ok('TrangPhanBo.astro dựng id mục từ PHAN_BO: id={`pb-${p.id}`} — link và mục cùng một nguồn', doc('components', 'TrangPhanBo.astro').includes('id={`pb-${p.id}`}'));
  ok('Kim chi không có link (kể cả tên trùng tên thịt); tên lạ, chimasal không link',
     BA.every(nn => lienKetPhanThit(sp('Kim chi cải thảo', 'Kim chi cải thảo', 'kim_chi'), nn) === null && lienKetPhanThit(sp('Ribeye', 'Ribeye', 'kim_chi'), nn) === null
       && lienKetPhanThit(sp('Chimasal'), nn) === null && lienKetPhanThit(sp('Chuck Roll'), nn) === null));
  ok('Link của gói đã được chủ dịch tên vẫn đúng mục (khớp theo tên tiếng Việt của database, không theo bản dịch)',
     lienKetPhanThit(sp('Ribeye with Cap', '립아이 캡'), 'ko') === '/ko/beef-cuts#pb-dau-than-ngoai');
});

// ===========================================================================
await nhom('3 · CHỖ DÙNG: THẺ, ĐƠN, JSON-LD, THẺ ĐƠN CỦA TRANG; ĐƠN GỬI QUÁN KHÔNG ĐỔI', async () => {
  const the = doc('components', 'MuaThitThe.astro').replace(/<style[\s\S]*?<\/style>/, '');
  ok('MuaThitThe.astro: tên hiện qua tenHienThi, link qua lienKetPhanThit', /import \{ lienKetPhanThit, tenHienThi \} from '\.\.\/lib\/ten-phan-thit';/.test(the)
       && /const ten = tenHienThi\(sanPham, ngonNgu\);/.test(the) && /const lienKetPhan = lienKetPhanThit\(sanPham, ngonNgu\);/.test(the));
  ok('MuaThitThe.astro: h3, tên trong hộp chọn, nhãn đọc màn hình (chọn, số lượng, bớt, thêm) đều dùng `ten`; khuôn trang (ngoài phần đầu file) không còn sanPham.ten',
     /<h3 lang=\{langTenHienThi\}>\{ten\}<\/h3>/.test(the) && /<p class="mtv-hop-ten" id=\{`\$\{idHop\}-ten`\} lang=\{langTenHienThi\}>\{ten\}<\/p>/.test(the)
       && /c\.soGoi\(nhan, ten\)/.test(the) && /c\.bot\(nhan, ten\)/.test(the) && /c\.them\(nhan, ten\)/.test(the) && /<span class="an-chu">: \{ten\}<\/span>/.test(the)
       && !/sanPham\.ten\b/.test(the.replace(/^---\n[\s\S]*?\n---\n/, '')), (the.replace(/^---\n[\s\S]*?\n---\n/, '').match(/.*sanPham\.ten\b.*/g) ?? []).join(' | '));
  ok('MuaThitThe.astro: link trên thẻ là .lien-ket (vùng chạm 48px, mũi tên), chữ có tên phần thịt ở phần ẩn cho trình đọc màn hình, chỉ khi có link',
     /\{lienKetPhan && \(\s*<p class="mtv-ve-phan"><a class="lien-ket" href=\{lienKetPhan\}>\{c\.vePhan\}<span class="an-chu">: \{ten\}<\/span><BieuTuong ten="mui-ten" \/><\/a><\/p>\s*\)\}/.test(the));
  ok('MuaThitThe.astro: chữ link đủ ba thứ tiếng', /vePhan: \{ vi: 'Xem phần thịt này', en: 'About this cut', ko: '이 부위 알아보기' \}/.test(the));

  const trang = doc('components', 'TrangMuaThitVe.astro');
  ok('TrangMuaThitVe.astro: JSON-LD nhận thứ tiếng của trang (sanPhamJsonLd(…, nn))', trang.includes('const jsonSanPham = sanPhamJsonLd(menu, trangThai, THUONG_HIEU.ten, nn);'));
  ok('TrangMuaThitVe.astro: menu cho script (data-menu) mang tên hiện ra ở `ten`; dòng "Đơn của bạn" của máy chủ dùng cùng tên',
     trang.includes('const menuHienThi = menu.sanPham.map(sp => ({ ...sp, ten: tenHienThi(sp, nn) }));') && trang.includes('data-menu={JSON.stringify(rutGonMenu(menuHienThi))}')
       && trang.includes('CHU_DON.dongDau[nn](tenHienThi(d.sanPham, nn), nhanGoi(d.sanPham.donVi, d.goi.soGam, nn), d.soLuong)'));
  ok('TrangMuaThitVe.astro: script của trang KHÔNG nạp ten-phan-thit (tên đã tới qua data-menu; lib đó nạp bảng từ của Trang)',
     !/<script>[\s\S]*ten-phan-thit[\s\S]*<\/script>/.test(trang.replace(/^---[\s\S]*?\n---\n/, '')));

  // JSON-LD Product.
  const menu = nhomMuaThitVe([dongDb('ribeye', 'Ribeye'), dongDb('galbisal', 'Galbisal'), dongDb('kim-chi', 'Kim chi cải thảo', 'Kim chi cải thảo', 500, 'kim_chi')]);
  const m = { tinhTrang: 'co', sanPham: menu, nhom: chiaNhom(menu) };
  const ten = nn => sanPhamJsonLd(m, 'mo', 'Beeftown', nn)['@graph'].map(p => p.name);
  ok('JSON-LD vi: Product.name = "Đầu thăn ngoại (Ribeye)", "Dẻ sườn bò (Galbisal)", kim chi giữ tên', JSON.stringify(ten('vi')) === JSON.stringify(['Đầu thăn ngoại (Ribeye)', 'Dẻ sườn bò (Galbisal)', 'Kim chi cải thảo']), JSON.stringify(ten('vi')));
  ok('JSON-LD en giữ tên khay; ko "꽃등심 (Ribeye)", "갈비살 (Galbisal)"', JSON.stringify(ten('en')) === JSON.stringify(['Ribeye', 'Galbisal', 'Kim chi cải thảo'])
       && JSON.stringify(ten('ko')) === JSON.stringify(['꽃등심 (Ribeye)', '갈비살 (Galbisal)', 'Kim chi cải thảo']), JSON.stringify(ten('ko')));
  ok('JSON-LD không truyền thứ tiếng → tên gốc như trước (không đổi hành vi của người gọi cũ)',
     JSON.stringify(sanPhamJsonLd(m, 'mo', 'Beeftown')['@graph'].map(p => p.name)) === JSON.stringify(['Ribeye', 'Galbisal', 'Kim chi cải thảo']));
  ok('Tên gốc trong menu không bị sửa (menu là dữ liệu dùng chung: tenHienThi chỉ trả chuỗi mới)', m.sanPham[0].ten === 'Ribeye' && m.sanPham[0].tenVi === 'Ribeye');

  // Đơn gửi quán: chỉ khóa gói, số lượng, giá đã xem.
  const dat = doc('lib', 'dat-hang-mua-thit.ts');
  const iRpc = dat.indexOf("client.rpc('tao_don_mua_thit', {");
  const rpc = dat.slice(iRpc, dat.indexOf('\n  });', iRpc));
  ok('Đơn gửi database (tao_don_mua_thit) chỉ có khóa gói + số lượng (p_gio) và giá đã xem — không tên sản phẩm nào đi từ trang; tên trên đơn là tên database chụp lại (ten_vi, 0113)',
     iRpc > 0 && /p_gio: Object\.fromEntries\(d\.gio\)/.test(rpc) && /p_gia_da_xem: d\.giaDaXem/.test(rpc) && !/\bten\b|tenVi|tenHienThi|sanPham|menu/.test(rpc.replace(/ten_don_vi/g, '')), rpc);
  ok('dat-hang-mua-thit.ts không nhắc tenHienThi / ten-phan-thit', !/tenHienThi|ten-phan-thit/.test(dat));

  // Thẻ đơn của Trang (trợ lý): tên menu đã có ngoặc thì không thêm tên Trang nói thành hai lớp ngoặc.
  const menuHT = menu.map(s => ({ ...s, ten: tenHienThi(s, 'vi') }));
  const don = noi => theDon([{ khoa: khoaGoi('ribeye', 200), so_goi: 2, ten: noi }], menuHT, 'vi').dong[0].chu;
  ok('Thẻ đơn của Trang: Trang nói "đầu thăn ngoại" → "Đầu thăn ngoại (Ribeye) · …", không "(… (…))"', /^Đầu thăn ngoại \(Ribeye\) · Gói 200 g × 2 = $/.test(don('đầu thăn ngoại')), don('đầu thăn ngoại'));
  ok('Thẻ đơn của Trang: Trang nói tên khác ("thăn lưng") mà menu đã có "tên Việt (tên khay)" → dùng tên menu, một lớp ngoặc', !/\(.*\(/.test(don('thăn lưng')) && don('thăn lưng').startsWith('Đầu thăn ngoại (Ribeye)'), don('thăn lưng'));
  const menuGoc = menu;
  ok('Thẻ đơn của Trang: menu chỉ có tên gốc (chưa Việt hóa) thì vẫn thêm tên Trang nói như trước',
     theDon([{ khoa: khoaGoi('ribeye', 200), so_goi: 1, ten: 'đầu thăn ngoại' }], menuGoc, 'vi').dong[0].chu.startsWith('Đầu thăn ngoại (Ribeye) · '));
});

// ===========================================================================
await nhom('4 · LINK Ở CHÂN TRANG (CỘT THÔNG TIN) VÀ Ở TRANG CHỦ (DẢI "NHÌN TẬN MẮT, CHỌN TẬN TAY")', async () => {
  ok('chu.ts: phanThitBo — "Các phần thịt bò" / "Beef cuts" / "소고기 부위"',
     chu('vi').phanThitBo === 'Các phần thịt bò' && chu('en').phanThitBo === 'Beef cuts' && chu('ko').phanThitBo === '소고기 부위');
  ok('Chữ link chân trang không chữ cấm, không tên phường', NGON_NGU.every(nn => timChuoiCam(chu(nn).phanThitBo).length === 0));

  const chan = doc('components', 'ChanTrang.astro');
  const cot = /<nav class="ct-cot" aria-labelledby="ct-thong-tin">[\s\S]*?<\/nav>/.exec(chan)?.[0] ?? '';
  const href = [...cot.matchAll(/<li><a href=\{duongDanTuongUng\('([^']+)', ngonNgu\)\}>\{t\.(\w+)\}<\/a><\/li>/g)].map(x => `${x[1]}:${x[2]}`);
  ok('ChanTrang.astro: cột Thông tin có /phan-thit-bo (t.phanThitBo) đứng đầu, rồi Tuyển dụng, Xóa dữ liệu — link dựng bằng duongDanTuongUng nên đủ ba thứ tiếng',
     JSON.stringify(href) === JSON.stringify(['/phan-thit-bo:phanThitBo', '/tuyen-dung:tuyenDung', '/xoa-du-lieu:xoaDuLieu']), href.join(' | '));

  const qcb = doc('components', 'QuayChonBo.astro');
  ok('QuayChonBo.astro: link .lien-ket tới trang Các phần thịt bò (duongDanTuongUng, đủ ba thứ tiếng), chữ "Xem các phần thịt bò" / "See the beef cuts" / "소고기 부위 보기", đứng sau đoạn nhân viên quầy',
     /xemPhanBo: \{ vi: 'Xem các phần thịt bò', en: 'See the beef cuts', ko: '소고기 부위 보기' \}/.test(qcb)
       && /<p>\{t\.doan2\}<\/p>\s*<p><a class="lien-ket" href=\{duongDanTuongUng\('\/phan-thit-bo', ngonNgu\)\}>\{t\.xemPhanBo\}<BieuTuong ten="mui-ten" \/><\/a><\/p>/.test(qcb));
  ok('Trang chủ dùng QuayChonBo (TrangRaMat.astro) — link nằm ở trang chủ cả ba thứ tiếng', doc('components', 'TrangRaMat.astro').includes('<QuayChonBo ngonNgu={ngonNgu} />'));
  ok('Trang Các phần thịt bò nằm trong CAP_DUONG_DAN (link chân trang không bao giờ dẫn tới 404)', duongDanTuongUng('/phan-thit-bo', 'en') !== '/en/phan-thit-bo');
});

process.exit(ketThuc('TÊN PHẦN THỊT VÀ LINK'));
