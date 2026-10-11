/**
 * BEEFTOWN — ĐỊA ĐIỂM TRÊN TRANG CÔNG KHAI: TẦNG 3, 63 HỒ TÙNG MẬU, ĐI THANG MÁY
 * =============================================================================
 *
 *     node test/test-cong-khai-dia-diem.mjs
 *
 * Khánh chốt ngày 07/10 và 09/10/2026: quán ở Tầng 3, 63 Hồ Tùng Mậu; khách vào lối riêng ngay
 * cạnh GS25 rồi đi thang máy lên tầng 3. File này gác để địa điểm khác, hay chuyện "cầu thang
 * bộ", không quay lại trang. Bất biến:
 *
 *   1. Không file nào của website (web/src, file chữ trong web/public) còn địa chỉ khác, trừ ĐÚNG
 *      MỘT dòng: địa chỉ pháp nhân ở chân trang (PHAP_NHAN.diaChi trong web/src/lib/chu.ts).
 *   2. Không file nào còn "cầu thang", "thang bộ", "stair", "계단" — kể cả chú thích, tên lớp CSS,
 *      tên biểu tượng: chú thích ghi chuyện cũ là chỗ người sau chép lại.
 *   3. Ba câu chỉ đường nguyên văn (vi, en, ko) là câu chung của chu.ts, và có mặt ở trang Đến
 *      Beeftown của cả ba thứ tiếng: trong khối địa chỉ (LenTang3) và trong thẻ mô tả của trang.
 *   4. JSON-LD: streetAddress là "Tầng 3, 63 Hồ Tùng Mậu"; không có tên phường nào — phường của
 *      63 Hồ Tùng Mậu chưa có giấy xác nhận nên không ghi.
 *   5. Dòng pháp nhân còn nguyên từng ký tự. Dòng này khớp giấy đăng ký đang dùng cho hồ sơ xác
 *      minh trên Meta; đổi nó là việc Khánh quyết, không phải việc của một PR sửa địa điểm.
 *   6. Cách ghi địa điểm từng thứ tiếng đúng như đã chốt; không gọi 63 Hồ Tùng Mậu là "tòa nhà";
 *      hình và biểu tượng lối lên là thang máy.
 *
 * Chữ khách đọc (không kể chuyện đổi địa điểm, không bịa chỗ gửi xe hay lối cho xe lăn) kiểm ở
 * test-cong-khai-cau-chu.mjs nhóm 7 — file đó đọc câu từ cây cú pháp của Astro. Trang đã dựng ra
 * kiểm ở web/kiem-tra/trinh-duyet.mjs.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const SRC = join(WEB, 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const modChu = await nap('chu.ts');
const { chu, PHAP_NHAN, DIA_CHI_PHAN, DIA_CHI_NHA_HANG, NGON_NGU } = modChu;
const { diaChi, diaChiSauTang, diaChiCoCauTruc } = await nap('trang-cong-khai.ts');
const { docNoiDung } = await nap('noi-dung.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — ĐỊA ĐIỂM TRÊN TRANG CÔNG KHAI');

// ---------------------------------------------------------------------------
// Chép tay ở đây, KHÔNG đọc từ chu.ts: sửa nhầm một ký tự ở đó thì phép thử này đỏ.
// ---------------------------------------------------------------------------
const DIA_DIEM = { vi: 'Tầng 3, 63 Hồ Tùng Mậu', en: 'Floor 3, 63 Hồ Tùng Mậu', ko: 'Hồ Tùng Mậu 63, 3층' };
const DIA_DIEM_TRONG_CAU = { vi: 'ở tầng 3, 63 Hồ Tùng Mậu', en: 'on Floor 3, 63 Hồ Tùng Mậu', ko: 'Hồ Tùng Mậu 63, 3층' };
const DIA_CHI_NGAN = { vi: '63 Hồ Tùng Mậu, TP.HCM', en: '63 Hồ Tùng Mậu, Ho Chi Minh City', ko: '호치민시 Hồ Tùng Mậu 63' };
const CAU_CHI_DUONG = {
  vi: 'Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3.',
  en: 'Use our own entrance, right next to GS25, and take the lift to Floor 3.',
  ko: 'GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요.',
};
const PHAP_NHAN_DUNG = {
  ten: 'CÔNG TY TNHH SLK GROUP',
  maSoThue: '0319712805',
  diaChi: 'Tầng 3, 11-13-15-17-19-21 Hàm Nghi, Phường Sài Gòn, TP. Hồ Chí Minh',
};
const DONG_PHAP_NHAN_TRONG_MA = `  diaChi: '${PHAP_NHAN_DUNG.diaChi}',`;

// Địa chỉ không phải của quán: hai mặt bằng đã khai trước đó, viết kiểu nào cũng tính (có dấu,
// không dấu, trong đường dẫn bản đồ, chữ Hàn). "11-21" đứng riêng — không bắt ngày 2026-11-21.
const DIA_CHI_KHAC = /Hàm\s*Nghi|Ham\s*Nghi|H%C3%A0m\+Nghi|함\s*응이|(?<![\d-])11[-–]21(?![\d-])|11-13-15|Sài\s*Gòn|Sai\s*Gon|Saigon|사이공|Nguyễn\s*Thái\s*Học|Nguyen\s*Thai\s*Hoc/giu;
const CAU_THANG = /cầu\s*thang|thang\s*bộ|cau[-_ ]?thang|stair|계단/giu;
// "building" là động từ trong "We are building our opening team" — chỉ bắt khi là danh từ.
const TOA_NHA = /t[oò][aà]\s*nhà|건물|빌딩|\b(?:the|this|our|a)\s+building\b/giu;

const tuGoc = p => relative(GOC, p).split(sep).join('/');
const moiFile = d => !existsSync(d) ? [] : readdirSync(d, { withFileTypes: true })
  .flatMap(x => x.isDirectory() ? moiFile(join(d, x.name)) : [join(d, x.name)]);
const LA_FILE_CHU = /\.(astro|ts|tsx|js|mjs|jsx|css|json|jsonc|md|svg|html|txt|xml|webmanifest|ps1)$/i;
const FILE_WEB = [...moiFile(SRC), ...moiFile(join(WEB, 'public'))].filter(f => LA_FILE_CHU.test(f)).sort();
const doc = f => readFileSync(f, 'utf8');
const docSrc = (...phan) => doc(join(SRC, ...phan));

/** Mọi dòng của các file khớp mẫu: [{ file, dong, chu, thay }]. */
function timDong(dsFile, mau) {
  return dsFile.flatMap(f => doc(f).split('\n').flatMap((chuDong, i) => {
    const thay = chuDong.match(mau);
    return thay ? [{ file: tuGoc(f), dong: i + 1, chu: chuDong, thay: [...new Set(thay)] }] : [];
  }));
}
const inDong = ds => ds.slice(0, 8).map(d => `${d.file}:${d.dong} «${d.thay.join(', ')}»`).join(' | ')
  + (ds.length > 8 ? ` | … và ${ds.length - 8} dòng nữa` : '');

// Bản nền đúng như trang thấy khi chưa nối database: mọi khóa null.
const NEN = await docNoiDung('vi', null);

// ===========================================================================
await nhom('1 · KHÔNG FILE NÀO CỦA WEBSITE CÒN ĐỊA CHỈ KHÁC, TRỪ ĐÚNG DÒNG PHÁP NHÂN', async () => {
  ok(`Quét ${FILE_WEB.length} file chữ của web/src và web/public (có trang, component, câu chung, CSS)`,
     FILE_WEB.length > 150
       && ['lib/chu.ts', 'components/ChanTrang.astro', 'pages/ko/visit.astro', 'styles/cong-khai.css', 'layouts/Trang.astro']
         .every(f => FILE_WEB.includes(join(SRC, ...f.split('/')))),
     `${FILE_WEB.length} file`);

  const thay = timDong(FILE_WEB, DIA_CHI_KHAC);
  const ngoaiLe = thay.filter(d => d.file === 'web/src/lib/chu.ts' && d.chu === DONG_PHAP_NHAN_TRONG_MA);
  const sai = thay.filter(d => !ngoaiLe.includes(d));
  ok('Không dòng nào ghi địa chỉ khác 63 Hồ Tùng Mậu (Hàm Nghi, 11-21, phường Sài Gòn, Nguyễn Thái Học…)',
     sai.length === 0, `${sai.length} dòng: ${inDong(sai)}`);
  ok('Ngoại lệ duy nhất là ĐÚNG MỘT dòng: PHAP_NHAN.diaChi trong web/src/lib/chu.ts', ngoaiLe.length === 1,
     `${ngoaiLe.length} dòng khớp`);

  // Đường dẫn bản đồ: trang không tự chế link Maps (nút "Chỉ đường" chỉ đọc google_maps_url đã công bố).
  const linkBanDo = timDong(FILE_WEB.filter(f => !tuGoc(f).startsWith('web/src/pages/noi-bo/')),
    /https?:\/\/(?:www\.)?(?:maps\.google|google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)[^\s'"`<)]*/gi);
  ok('Mã nguồn trang công khai không viết sẵn đường dẫn Google Maps nào (chỉ dùng link đã công bố trong /noi-bo)',
     linkBanDo.length === 0, inDong(linkBanDo));
});

// ===========================================================================
await nhom('2 · KHÔNG CÒN "CẦU THANG", "STAIR", "계단" — KHÁCH ĐI THANG MÁY', async () => {
  const thay = timDong(FILE_WEB, CAU_THANG);
  ok('Không file nào của web/src, web/public còn "cầu thang", "thang bộ", "stair", "계단" (kể cả chú thích, tên lớp, tên biểu tượng)',
     thay.length === 0, `${thay.length} dòng: ${inDong(thay)}`);

  // Câu phủ định về thang máy là câu của mặt bằng trước: "không có thang máy", "no guest lift", "엘리베이터는 없어요".
  const khongThangMay = timDong(FILE_WEB, /không\s+có\s+thang\s*máy|no\s+(?:guest\s+)?(?:lift|elevator)|(?:lift|elevator)\s+is\s+not|엘리베이터(?:는|가)?\s*없/giu);
  ok('Không câu nào nói "không có thang máy" / "no guest lift" / "엘리베이터는 없어요"', khongThangMay.length === 0, inDong(khongThangMay));

  for (const nn of NGON_NGU) {
    const bo = chu(nn);
    const dinh = Object.entries(bo).filter(([, s]) => new RegExp(CAU_THANG.source, 'iu').test(s));
    ok(`chu.ts [${nn}]: không câu chung nào nhắc cầu thang`, dinh.length === 0, dinh.map(([k]) => k).join(', '));
    ok(`chu.ts [${nn}]: không còn khóa cauThangBo (câu "cầu thang bộ, không có thang máy cho khách")`, !('cauThangBo' in bo));
  }
});

// ===========================================================================
await nhom('3 · BA CÂU CHỈ ĐƯỜNG NGUYÊN VĂN, CÓ MẶT Ở TRANG ĐẾN BEEFTOWN CỦA BA THỨ TIẾNG', async () => {
  for (const nn of NGON_NGU) {
    ok(`chu.ts [${nn}]: câu chỉ đường (loiLen) là nguyên văn "${CAU_CHI_DUONG[nn]}"`, chu(nn).loiLen === CAU_CHI_DUONG[nn], String(chu(nn).loiLen));
  }

  // Khối địa chỉ: LenTang3 in câu đó ở cả bản đầy đủ lẫn bản gọn, và trang Đến Beeftown dựng khối đó.
  const lenTang3 = docSrc('components', 'LenTang3.astro');
  ok('LenTang3.astro in câu chỉ đường {t.loiLen} ở cả hai bản (đầy đủ và gọn)', (lenTang3.match(/\{t\.loiLen\}/g) ?? []).length === 2
       && /const t = chu\(ngonNgu\);/.test(lenTang3), `${(lenTang3.match(/\{t\.loiLen\}/g) ?? []).length} chỗ`);
  const trangDen = docSrc('components', 'TrangDenBeeftown.astro');
  ok('TrangDenBeeftown.astro dựng khối LenTang3 đúng thứ tiếng của trang', /<LenTang3 ngonNgu=\{ngonNgu\} noiDung=\{nd\}/.test(trangDen));

  const TRANG = { vi: ['den-beeftown.astro'], en: ['en', 'visit.astro'], ko: ['ko', 'visit.astro'] };
  for (const nn of NGON_NGU) {
    const trang = docSrc('pages', ...TRANG[nn]);
    const ten = `pages/${TRANG[nn].join('/')}`;
    ok(`${ten}: dựng <TrangDenBeeftown ngonNgu="${nn}">`, trang.includes(`<TrangDenBeeftown ngonNgu="${nn}" noiDung={noiDung} />`)
       && trang.includes(`ngonNgu="${nn}"`) && trang.includes(`docNoiDung('${nn}')`));
    const moTa = trang.match(/\bmoTa="([^"]*)"/)?.[1] ?? '';
    ok(`${ten}: thẻ mô tả có câu chỉ đường nguyên văn`, moTa.includes(CAU_CHI_DUONG[nn]), moTa);
    ok(`${ten}: thẻ mô tả ghi địa điểm "${DIA_DIEM_TRONG_CAU[nn]}"`, moTa.includes(DIA_DIEM_TRONG_CAU[nn]), moTa);
  }

  // Những chỗ khác in địa chỉ cũng kèm câu chỉ đường: màn đầu trang chủ, chân trang, câu hỏi thường gặp.
  for (const [file, mau] of [
    ['KhoiMoDau.astro', /t\.loiLen/], ['ChanTrang.astro', /\{t\.loiLen\}/], ['CauHoi.astro', /\{tChung\.loiLen\}/],
  ]) {
    ok(`${file}: địa chỉ đi kèm câu chỉ đường`, mau.test(docSrc('components', file)));
  }
  ok('TrangDatBan.astro: khối LenTang3 bản gọn (có câu chỉ đường) đứng trên trang Hỏi bàn', /<LenTang3 gon ngonNgu=\{ngonNgu\} noiDung=\{nd\} \/>/.test(docSrc('components', 'TrangDatBan.astro')));
});

// ===========================================================================
await nhom('4 · JSON-LD: streetAddress ĐÚNG, KHÔNG CÓ TÊN PHƯỜNG', async () => {
  const dc = diaChiCoCauTruc(NEN);
  ok('JSON-LD chưa công bố: streetAddress là "Tầng 3, 63 Hồ Tùng Mậu"', dc.streetAddress === 'Tầng 3, 63 Hồ Tùng Mậu', JSON.stringify(dc));
  ok('JSON-LD chưa công bố: đúng bốn trường @type, streetAddress, addressRegion "TP.HCM", addressCountry "VN"',
     JSON.stringify(dc) === JSON.stringify({ '@type': 'PostalAddress', streetAddress: 'Tầng 3, 63 Hồ Tùng Mậu', addressRegion: 'TP.HCM', addressCountry: 'VN' }),
     JSON.stringify(dc));
  ok('JSON-LD chưa công bố: không có addressLocality — phường của 63 Hồ Tùng Mậu chưa có giấy xác nhận', !('addressLocality' in dc), JSON.stringify(dc));
  ok('JSON-LD chưa công bố: không chữ "phường", "ward", "Sài Gòn", "Hàm Nghi" ở bất kỳ trường nào',
     !/phường|\bward\b|Sài Gòn|Hàm Nghi/iu.test(JSON.stringify(dc)), JSON.stringify(dc));

  ok('DIA_CHI_PHAN không có khóa phuong, và không giá trị nào là tên phường',
     !('phuong' in DIA_CHI_PHAN) && !Object.values(DIA_CHI_PHAN).some(v => /phường|\bP\.\s*\S/iu.test(v)), JSON.stringify(DIA_CHI_PHAN));
  ok('DIA_CHI_NHA_HANG là "Tầng 3, 63 Hồ Tùng Mậu, TP.HCM"', DIA_CHI_NHA_HANG === 'Tầng 3, 63 Hồ Tùng Mậu, TP.HCM', DIA_CHI_NHA_HANG);
  ok('Chưa nối database: trang in đúng địa chỉ đó; sau chữ "Tầng 3" đậm là "63 Hồ Tùng Mậu, TP.HCM"',
     diaChi(NEN) === 'Tầng 3, 63 Hồ Tùng Mậu, TP.HCM' && diaChiSauTang(NEN) === '63 Hồ Tùng Mậu, TP.HCM', `${diaChi(NEN)} | ${diaChiSauTang(NEN)}`);

  const layout = docSrc('layouts', 'Trang.astro');
  ok('Trang.astro: địa chỉ của JSON-LD lấy từ diaChiCoCauTruc(nd), mô tả nhà hàng lấy từ câu nền moTaNgan',
     layout.includes('duLieuCoCauTruc.address = diaChiCoCauTruc(nd);') && layout.includes('description: nd.mo_ta_og ?? t.moTaNgan,'));
  for (const nn of NGON_NGU) {
    ok(`chu.ts [${nn}]: mô tả nền (thẻ description và JSON-LD) ghi "${DIA_DIEM_TRONG_CAU[nn]}"`, chu(nn).moTaNgan.includes(DIA_DIEM_TRONG_CAU[nn]), chu(nn).moTaNgan);
  }
});

// ===========================================================================
await nhom('5 · DÒNG PHÁP NHÂN Ở CHÂN TRANG CÒN NGUYÊN TỪNG KÝ TỰ', async () => {
  ok(`PHAP_NHAN.diaChi là nguyên văn "${PHAP_NHAN_DUNG.diaChi}"`, PHAP_NHAN.diaChi === PHAP_NHAN_DUNG.diaChi, PHAP_NHAN.diaChi);
  ok('PHAP_NHAN: tên công ty và mã số thuế không đổi; không thêm, không bớt trường nào',
     JSON.stringify(PHAP_NHAN) === JSON.stringify(PHAP_NHAN_DUNG), JSON.stringify(PHAP_NHAN));
  ok('ChanTrang.astro in dòng đó nguyên văn, có lang="vi", ở mọi thứ tiếng',
     docSrc('components', 'ChanTrang.astro').includes('<p class="chan-dong" lang="vi">{PHAP_NHAN.diaChi}</p>'));
  ok('web/kiem-tra/trinh-duyet.mjs vẫn so chân trang của từng trang với đúng dòng đó',
     doc(join(WEB, 'kiem-tra', 'trinh-duyet.mjs')).includes(`'${PHAP_NHAN_DUNG.diaChi}',`));
  ok('Địa chỉ nhà hàng và địa chỉ pháp nhân là hai hằng riêng: sửa cái này không đụng cái kia',
     DIA_CHI_NHA_HANG !== PHAP_NHAN.diaChi && !DIA_CHI_NHA_HANG.includes('Hàm Nghi'));
});

// ===========================================================================
await nhom('6 · CÁCH GHI ĐỊA ĐIỂM TỪNG THỨ TIẾNG; KHÔNG GỌI LÀ "TÒA NHÀ"; HÌNH LỐI LÊN LÀ THANG MÁY', async () => {
  for (const nn of NGON_NGU) {
    ok(`chu.ts [${nn}]: bản ngắn là "${DIA_CHI_NGAN[nn]}"`, chu(nn).diaChiNgan === DIA_CHI_NGAN[nn], chu(nn).diaChiNgan);
  }
  const tieuDe = f => docSrc('pages', ...f).match(/\btieuDe="([^"]*)"/)?.[1] ?? '';
  ok(`pages/den-beeftown.astro: tiêu đề "Đến Beeftown — ${DIA_DIEM.vi}"`, tieuDe(['den-beeftown.astro']) === `Đến Beeftown — ${DIA_DIEM.vi}`, tieuDe(['den-beeftown.astro']));
  ok(`pages/en/visit.astro: tiêu đề "Visit Beeftown — ${DIA_DIEM.en}"`, tieuDe(['en', 'visit.astro']) === `Visit Beeftown — ${DIA_DIEM.en}`, tieuDe(['en', 'visit.astro']));

  // Thẻ mô tả của các trang còn lại: trang nào ghi địa điểm thì ghi đúng cách của thứ tiếng đó.
  const MO_TA = [
    [['thuc-don.astro'], `${DIA_DIEM.vi}, TP.HCM`], [['en', 'menu.astro'], `${DIA_DIEM.en}, Ho Chi Minh City`], [['ko', 'menu.astro'], `호치민시 ${DIA_DIEM.ko}`],
    [['dat-ban.astro'], `${DIA_DIEM_TRONG_CAU.vi}, TP.HCM`], [['en', 'book.astro'], `${DIA_DIEM_TRONG_CAU.en}, Ho Chi Minh City`], [['ko', 'book.astro'], `호치민시 ${DIA_DIEM.ko}`],
    [['tuyen-dung.astro'], `tại ${DIA_CHI_NGAN.vi}`], [['en', 'jobs.astro'], `at ${DIA_CHI_NGAN.en}`], [['ko', 'jobs.astro'], DIA_CHI_NGAN.ko],
  ];
  for (const [f, mong] of MO_TA) {
    const moTa = docSrc('pages', ...f).match(/\bmoTa="([^"]*)"/)?.[1] ?? '';
    ok(`pages/${f.join('/')}: thẻ mô tả ghi "${mong}"`, moTa.includes(mong), moTa);
  }

  const toaNha = timDong(FILE_WEB, TOA_NHA);
  ok('Không file nào gọi địa điểm là "tòa nhà" / "the building" / "건물"', toaNha.length === 0, inDong(toaNha));

  const khungAnh = docSrc('components', 'KhungAnh.astro');
  const loai = khungAnh.match(/export type LoaiKhung = ([^;]+);/)?.[1] ?? '';
  ok("KhungAnh.astro: năm loại hình là 'quay' | 'khay' | 'thang-may' | 'loi-vao' | 'ban-nuong'",
     loai === "'quay' | 'khay' | 'thang-may' | 'loi-vao' | 'ban-nuong'", loai);
  ok("KhungAnh.astro: có hình vẽ cho loại 'thang-may'", /\{loai === 'thang-may' && \(\s*<g>[\s\S]*?<path d="/.test(khungAnh));
  ok('TrangDenBeeftown.astro: bước 2 dùng hình thang máy', /<KhungAnh loai="thang-may" /.test(docSrc('components', 'TrangDenBeeftown.astro')));
  const bieuTuong = docSrc('components', 'BieuTuong.astro');
  ok("BieuTuong.astro: có biểu tượng 'thang-may' (nét vẽ khai trong NET)", /\|\s*'thang-may'/.test(bieuTuong) && /^\s*'thang-may':\s*'M[^']+',$/m.test(bieuTuong));
  for (const f of ['LenTang3.astro', 'ChanTrang.astro', 'KhoiMoDau.astro']) {
    ok(`${f}: câu chỉ đường đi kèm biểu tượng thang máy`, docSrc('components', f).includes('<BieuTuong ten="thang-may" />'));
  }
});

process.exit(ketThuc('ĐỊA ĐIỂM TRÊN TRANG CÔNG KHAI'));
