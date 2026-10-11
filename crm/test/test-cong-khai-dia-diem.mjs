/**
 * BEEFTOWN — ĐỊA ĐIỂM TRÊN TRANG CÔNG KHAI: TẦNG 3, 63 HỒ TÙNG MẬU, ĐI THANG MÁY
 * =============================================================================
 *
 *     node test/test-cong-khai-dia-diem.mjs
 *
 * Điều đã biết. Khánh quyết: địa điểm là 63 Hồ Tùng Mậu (07/10/2026); quán ở tầng 3, khách vào bằng
 * lối vào riêng ngay cạnh GS25 (09/10/2026). Địa điểm có thang máy: Khánh xác nhận ngày 11/10/2026.
 * CÂU chỉ đường ba thứ tiếng thì là Claude đề xuất, CHỜ KHÁNH DUYỆT CHỮ. File này giữ câu đang dùng
 * đúng từng chữ để không ai sửa lén một bản; Khánh duyệt chữ khác thì sửa loiLen ở web/src/lib/chu.ts
 * cùng lúc với các bản chép tay ở đây, ở test-cong-khai-cau-chu.mjs và web/kiem-tra/trinh-duyet.mjs.
 *
 * File này gác để địa chỉ khác, hay chuyện "cầu thang bộ", không quay lại trang. Bất biến:
 *
 *   1. Không file nào của trang công khai (trang, component, câu chung, CSS mà trang công khai nạp;
 *      file chữ trong web/public trừ phần của kho) còn tên đường hay tên phường của địa chỉ khác,
 *      trừ ĐÚNG MỘT dòng: địa chỉ pháp nhân ở chân trang (PHAP_NHAN.diaChi trong web/src/lib/chu.ts).
 *      Kho và /noi-bo không bị quét: "Bia Sài Gòn" ở đó là chữ đúng.
 *   2. Các file đó không còn "cầu thang", "thang bộ", "stair", "계단" — kể cả chú thích, tên lớp CSS,
 *      tên biểu tượng: chú thích ghi chuyện cũ là chỗ người sau chép lại.
 *   3. Ba câu chỉ đường đang dùng (vi, en, ko) là câu chung của chu.ts, và có mặt ở trang Đến
 *      Beeftown của cả ba thứ tiếng: trong khối địa chỉ (LenTang3) và trong thẻ mô tả của trang.
 *   4. JSON-LD: streetAddress là "Tầng 3, 63 Hồ Tùng Mậu"; không có tên phường nào — phường của
 *      63 Hồ Tùng Mậu chưa có giấy xác nhận nên không ghi.
 *   5. Dòng pháp nhân còn nguyên từng ký tự. Dòng này khớp giấy đăng ký đang dùng cho hồ sơ xác
 *      minh trên Meta; đổi nó là việc Khánh quyết, không phải việc của một PR sửa địa điểm.
 *   6. Cách ghi địa điểm từng thứ tiếng đúng như Khánh đã quyết; không gọi 63 Hồ Tùng Mậu là "tòa
 *      nhà"; hình và biểu tượng lối lên là thang máy.
 *   7. Bản công bố trong /noi-bo (khóa dia_chi_hien_thi) tới được MỌI chỗ in địa chỉ: không component
 *      nào gõ sẵn địa chỉ hay đọc thẳng hằng DIA_CHI_NHA_HANG.
 *   8. Bảng từ của máy dịch (web/src/lib/may-dich.ts) không còn tên khu của địa chỉ khác, và giữ
 *      nguyên "Hồ Tùng Mậu", dịch "Tầng 3", "thang máy" như trang đang viết.
 *
 * Chữ khách đọc (không ghi phường / quận, không kể chuyện đổi địa điểm, không bịa chỗ gửi xe, lối cho
 * xe lăn hay số đo) kiểm ở test-cong-khai-cau-chu.mjs nhóm 7 — file đó đọc câu từ cây cú pháp của
 * Astro. Trang đã dựng kiểm ở web/kiem-tra/trinh-duyet.mjs; trang có bản công bố kiểm ở
 * web/kiem-tra/thu-day-du.mjs nhóm 7. Mẫu tìm chữ sai dùng chung: web/kiem-tra/mau-dia-diem.mjs.
 *
 * KHI CÓ GIẤY XÁC NHẬN TÊN PHƯỜNG, sửa cùng lúc: DIA_CHI_PHAN và diaChiCoCauTruc() (mã); nhóm 4 của
 * file này; test-cong-khai-trang-chu.mjs nhóm 4; luật PHUONG_QUAN và bảng câu thử trong
 * web/kiem-tra/mau-dia-diem.mjs; kiểm tra JSON-LD trong web/kiem-tra/trinh-duyet.mjs.
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const SRC = join(WEB, 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const modChu = await nap('chu.ts');
const { chu, PHAP_NHAN, DIA_CHI_PHAN, DIA_CHI_NHA_HANG, NGON_NGU } = modChu;
const { diaChi, diaChiSauTang, diaChiManDau, diaChiCoCauTruc } = await nap('trang-cong-khai.ts');
const { docNoiDung } = await nap('noi-dung.ts');
const { TEN_DIA_CHI_KHAC, PHUONG_QUAN, CAU_THANG, TOA_NHA } = await import(pathToFileURL(join(WEB, 'kiem-tra', 'mau-dia-diem.mjs')).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — ĐỊA ĐIỂM TRÊN TRANG CÔNG KHAI');

// ---------------------------------------------------------------------------
// Chép tay ở đây, KHÔNG đọc từ chu.ts: sửa nhầm một ký tự ở đó thì phép thử này đỏ.
// ---------------------------------------------------------------------------
const DIA_DIEM = { vi: 'Tầng 3, 63 Hồ Tùng Mậu', en: 'Floor 3, 63 Hồ Tùng Mậu', ko: 'Hồ Tùng Mậu 63, 3층' };
const DIA_DIEM_TRONG_CAU = { vi: 'ở tầng 3, 63 Hồ Tùng Mậu', en: 'on Floor 3, 63 Hồ Tùng Mậu', ko: 'Hồ Tùng Mậu 63, 3층' };
const DIA_CHI_NGAN = { vi: '63 Hồ Tùng Mậu, TP.HCM', en: '63 Hồ Tùng Mậu, Ho Chi Minh City', ko: '호치민시 Hồ Tùng Mậu 63' };
// Câu chỉ đường đang dùng — Claude đề xuất, chờ Khánh duyệt chữ (xem đầu file).
const CAU_CHI_DUONG = {
  vi: 'Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3.',
  en: 'Use our own entrance, right next to GS25, and take the lift to Floor 3.',
  ko: 'GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요.',
};
const MO_TA_DEN_BEEFTOWN = {
  vi: `Beeftown ở tầng 3, 63 Hồ Tùng Mậu, TP.HCM. ${CAU_CHI_DUONG.vi}`,
  en: `Beeftown is on Floor 3, 63 Hồ Tùng Mậu, Ho Chi Minh City. ${CAU_CHI_DUONG.en}`,
  ko: `Beeftown은 호치민시 Hồ Tùng Mậu 63, 3층에 있어요. ${CAU_CHI_DUONG.ko}`,
};
const PHAP_NHAN_DUNG = {
  ten: 'CÔNG TY TNHH SLK GROUP',
  maSoThue: '0319712805',
  diaChi: 'Tầng 3, 11-13-15-17-19-21 Hàm Nghi, Phường Sài Gòn, TP. Hồ Chí Minh',
};
const DONG_PHAP_NHAN_TRONG_MA = `  diaChi: '${PHAP_NHAN_DUNG.diaChi}',`;

const tuGoc = p => relative(GOC, p).split(sep).join('/');
const moiFile = d => !existsSync(d) ? [] : readdirSync(d, { withFileTypes: true })
  .flatMap(x => x.isDirectory() ? moiFile(join(d, x.name)) : [join(d, x.name)]);
// Đọc file với xuống dòng kiểu Unix: máy Windows lấy mã về với \r\n thì mọi phép so nguyên dòng vẫn đúng.
const chuanXuongDong = chuFile => chuFile.replace(/\r\n?/g, '\n');
const doc = f => chuanXuongDong(readFileSync(f, 'utf8'));
const docSrc = (...phan) => doc(join(SRC, ...phan));

// ---------------------------------------------------------------------------
// FILE CỦA TRANG CÔNG KHAI: mọi file mã mà một trang công khai nạp, tìm theo đồ thị import từ
// pages/*.astro, pages/en, pages/ko (và robots.txt, sitemap.xml) — component hay file lib mới tự
// được quét. Kho, /noi-bo và các hook không đi qua đây. Cộng file chữ trong web/public, trừ thư
// mục của kho.
// ---------------------------------------------------------------------------
const NAP = /(?:import|export)\s+(?:[^'"`;]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]|import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;
function giaiDuongNap(tu, duong) {
  const goc = resolve(dirname(tu), duong);
  for (const duoi of ['', '.ts', '.js', '.mjs', '.astro', '.css', `${sep}index.ts`]) {
    if (existsSync(goc + duoi) && statSync(goc + duoi).isFile()) return goc + duoi;
  }
  return null;
}
const PAGES = join(SRC, 'pages');
const TRANG_GOC = ['', 'en', 'ko'].flatMap(d => readdirSync(join(PAGES, d), { withFileTypes: true })
  .filter(x => x.isFile() && /\.astro$|^(?:robots\.txt|sitemap\.xml)\.ts$/.test(x.name)).map(x => join(PAGES, d, x.name)));
// pages/404.astro là trang công khai nhưng có nhánh nội bộ cho nhân viên đã đăng nhập (PR #62): nó nạp
// layouts/NoiBo.astro, lib/cau-noi-bo.ts và lib/dieu-huong-noi-bo.ts (chọn nhánh), ba file đó nạp tiếp
// biểu tượng và câu của kho — nơi "Bia Sài Gòn" là chữ đúng. Quét chính ba file đó, KHÔNG đi tiếp từ
// chúng. Chỉ ba file này: một trang hay component công khai khác nạp thẳng file của kho thì vẫn bị kéo
// vào và nhóm 1 đỏ ("Không quét kho…").
const KHONG_DI_TIEP = new Set(['layouts/NoiBo.astro', 'lib/cau-noi-bo.ts', 'lib/dieu-huong-noi-bo.ts'].map(f => join(SRC, f)));
const daThay = new Set();
function diTu(f) {
  if (daThay.has(f)) return;
  daThay.add(f);
  if (KHONG_DI_TIEP.has(f)) return;
  for (const m of doc(f).matchAll(NAP)) {
    const toi = giaiDuongNap(f, m[1] ?? m[2]);
    if (toi && toi.startsWith(SRC + sep)) diTu(toi);
  }
}
TRANG_GOC.forEach(diTu);
const LA_FILE_CHU = /\.(astro|ts|tsx|js|mjs|jsx|css|json|jsonc|md|svg|html|txt|xml|webmanifest)$/i;
const FILE_PUBLIC = moiFile(join(WEB, 'public')).filter(f => LA_FILE_CHU.test(f) && !tuGoc(f).startsWith('web/public/kho/'));
const FILE_CONG_KHAI = [...daThay, ...FILE_PUBLIC].sort();
const ASTRO_CONG_KHAI = [...daThay].filter(f => f.endsWith('.astro')).sort();

/** Mọi dòng của các file mà luật bắt được: [{ file, dong, chu, thay }]. */
function timDong(dsFile, ...dsLuat) {
  return dsFile.flatMap(f => doc(f).split('\n').flatMap((chuDong, i) => {
    const thay = dsLuat.map(l => (l instanceof RegExp ? chuDong.match(l)?.[0] : l.tim(chuDong))).filter(Boolean);
    return thay.length ? [{ file: tuGoc(f), dong: i + 1, chu: chuDong, thay: [...new Set(thay)] }] : [];
  }));
}
const inDong = ds => ds.slice(0, 8).map(d => `${d.file}:${d.dong} «${d.thay.join(', ')}»`).join(' | ')
  + (ds.length > 8 ? ` | … và ${ds.length - 8} dòng nữa` : '');
// Tên trong mã (lớp CSS, khóa, tên biểu tượng) của chuyện cầu thang: mẫu chữ khách đọc không có các dạng này.
const TEN_CAU_THANG_TRONG_MA = /cau[-_ ]?thang|cauThang/iu;

// Bản nền đúng như trang thấy khi chưa nối database: mọi khóa null.
const NEN = await docNoiDung('vi', null);

// ===========================================================================
await nhom('1 · KHÔNG FILE NÀO CỦA TRANG CÔNG KHAI CÒN ĐỊA CHỈ KHÁC, TRỪ ĐÚNG DÒNG PHÁP NHÂN', async () => {
  const tenFile = FILE_CONG_KHAI.map(tuGoc);
  ok(`Quét ${FILE_CONG_KHAI.length} file của trang công khai, tìm theo đồ thị import từ ${TRANG_GOC.length} trang (có component, câu chung, CSS, SVG thương hiệu)`,
     FILE_CONG_KHAI.length >= 70 && TRANG_GOC.length >= 21
       && ['web/src/lib/chu.ts', 'web/src/lib/trang-cong-khai.ts', 'web/src/components/ChanTrang.astro', 'web/src/components/KhoiMoDau.astro',
         'web/src/components/DiCungNhom.astro', 'web/src/pages/ko/visit.astro', 'web/src/styles/cong-khai.css', 'web/src/layouts/Trang.astro',
         'web/public/bieu-tuong.svg'].every(f => tenFile.includes(f)),
     `${FILE_CONG_KHAI.length} file`);
  const lac = tenFile.filter(f => /^web\/src\/(?:pages\/noi-bo|components\/kho|lib\/kho)\/|^web\/public\/kho\//.test(f));
  ok('Không quét kho và /noi-bo ("Bia Sài Gòn" ở đó là chữ đúng)', lac.length === 0, lac.slice(0, 5).join(', '));

  const thay = timDong(FILE_CONG_KHAI, TEN_DIA_CHI_KHAC);
  const ngoaiLe = thay.filter(d => d.file === 'web/src/lib/chu.ts' && d.chu === DONG_PHAP_NHAN_TRONG_MA);
  const sai = thay.filter(d => !ngoaiLe.includes(d));
  ok('Không dòng nào ghi tên đường hay tên phường của địa chỉ khác (Hàm Nghi, Nguyễn Thái Học, Cầu Ông Lãnh, phường Sài Gòn…)',
     sai.length === 0, `${sai.length} dòng: ${inDong(sai)}`);
  ok('Ngoại lệ duy nhất là ĐÚNG MỘT dòng: PHAP_NHAN.diaChi trong web/src/lib/chu.ts', ngoaiLe.length === 1,
     `${ngoaiLe.length} dòng khớp`);
  // Phép so nguyên dòng ở trên phải đúng cả khi file xuống dòng kiểu Windows: dựng bản \r\n của chu.ts rồi
  // đọc lại bằng đúng bộ chuẩn hóa mà doc() dùng.
  const kieuWindows = doc(join(SRC, 'lib', 'chu.ts')).replace(/\n/g, '\r\n');
  ok('Dòng pháp nhân vẫn được nhận ra khi file xuống dòng kiểu Windows (\\r\\n)',
     kieuWindows.split('\n').filter(d => d === DONG_PHAP_NHAN_TRONG_MA).length === 0        // so thẳng thì hỏng: dòng còn \r ở cuối
       && chuanXuongDong(kieuWindows).split('\n').filter(d => d === DONG_PHAP_NHAN_TRONG_MA).length === 1);

  // Đường dẫn bản đồ: trang không tự chế link Maps (nút "Chỉ đường" chỉ đọc google_maps_url đã công bố).
  const linkBanDo = timDong(FILE_CONG_KHAI,
    /https?:\/\/(?:www\.)?(?:maps\.google|google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)[^\s'"`<)]*/i);
  ok('Mã nguồn trang công khai không viết sẵn đường dẫn Google Maps nào (chỉ dùng link đã công bố trong /noi-bo)',
     linkBanDo.length === 0, inDong(linkBanDo));
});

// ===========================================================================
await nhom('2 · KHÔNG CÒN "CẦU THANG", "STAIR", "계단" — KHÁCH ĐI THANG MÁY', async () => {
  const thay = timDong(FILE_CONG_KHAI, CAU_THANG, TEN_CAU_THANG_TRONG_MA);
  ok('Không file nào của trang công khai còn "cầu thang", "thang bộ", "stair", "계단", hay câu "không có thang máy" (kể cả chú thích, tên lớp, tên biểu tượng)',
     thay.length === 0, `${thay.length} dòng: ${inDong(thay)}`);

  for (const nn of NGON_NGU) {
    const bo = chu(nn);
    const dinh = Object.entries(bo).filter(([, cau]) => CAU_THANG.tim(cau));
    ok(`chu.ts [${nn}]: không câu chung nào nhắc cầu thang`, dinh.length === 0, dinh.map(([k]) => k).join(', '));
    ok(`chu.ts [${nn}]: không còn khóa cauThangBo (câu "cầu thang bộ, không có thang máy cho khách")`, !('cauThangBo' in bo));
  }
});

// ===========================================================================
await nhom('3 · BA CÂU CHỈ ĐƯỜNG ĐANG DÙNG (CHỜ KHÁNH DUYỆT CHỮ), CÓ MẶT Ở TRANG ĐẾN BEEFTOWN CỦA BA THỨ TIẾNG', async () => {
  for (const nn of NGON_NGU) {
    ok(`chu.ts [${nn}]: câu chỉ đường (loiLen) đúng từng chữ "${CAU_CHI_DUONG[nn]}"`, chu(nn).loiLen === CAU_CHI_DUONG[nn], String(chu(nn).loiLen));
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
    ok(`${ten}: thẻ mô tả có câu chỉ đường, đúng từng chữ`, moTa.includes(CAU_CHI_DUONG[nn]), moTa);
    ok(`${ten}: thẻ mô tả ghi địa điểm "${DIA_DIEM_TRONG_CAU[nn]}"`, moTa.includes(DIA_DIEM_TRONG_CAU[nn]), moTa);
    // Cả thẻ mô tả, đúng từng chữ: địa điểm, thành phố, rồi câu chỉ đường — không vế nào chen vào giữa (phường, quận, mốc đường).
    ok(`${ten}: thẻ mô tả đúng từng chữ "${MO_TA_DEN_BEEFTOWN[nn]}"`, moTa === MO_TA_DEN_BEEFTOWN[nn], moTa);
  }

  // Những chỗ khác in địa chỉ cũng kèm câu chỉ đường: màn đầu trang chủ, chân trang, câu hỏi thường gặp.
  // So với đúng CHỖ IN RA trong template — khai báo biến mà không in thì không tính.
  const kmd = docSrc('components', 'KhoiMoDau.astro');
  ok('KhoiMoDau.astro: màn đầu in câu chỉ đường (từng vế của t.loiLen) ngay dưới dòng địa chỉ',
     kmd.includes('const veLoiLen = t.loiLen.split(')
       && kmd.includes(`<li class="kmd-loi-len">{veLoiLen.map((ve, i) => <>{i > 0 && ' '}<span>{ve}</span></>)}</li>`)
       && kmd.indexOf('class="kmd-dia-chi"') > -1 && kmd.indexOf('class="kmd-dia-chi"') < kmd.indexOf('<li class="kmd-loi-len">'));
  ok('ChanTrang.astro: chân trang in câu chỉ đường ngay dưới địa chỉ nhà hàng',
     docSrc('components', 'ChanTrang.astro').includes('<p class="ct-loi-len"><BieuTuong ten="thang-may" /><span>{t.loiLen}</span></p>'));
  ok('CauHoi.astro: câu trả lời "ở tầng mấy, có thang máy không" in địa chỉ rồi tới câu chỉ đường',
     /<p>\{t\.d4a\} <span lang="vi">\{cumDc\.map\([^\n]*<\/span>\. \{tChung\.loiLen\}<\/p>/.test(docSrc('components', 'CauHoi.astro')));
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

  ok('DIA_CHI_PHAN không có khóa phuong, và không giá trị nào là tên phường hay quận',
     !('phuong' in DIA_CHI_PHAN) && !Object.values(DIA_CHI_PHAN).some(v => /phường|quận|\bP\.\s*\S|\bQ\.?\s*\d/iu.test(v)), JSON.stringify(DIA_CHI_PHAN));
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
    const nguon = docSrc('pages', ...f);
    const nn = f[0] === 'en' ? 'en' : f[0] === 'ko' ? 'ko' : 'vi';
    // Trang hỏi bàn (PR #61): mô tả chọn theo tình trạng form — moTaTrangHoiBan(nn, moDuoc) trả
    // chu(nn).moTaHoiBan (form mở) hoặc moTaHoiBanChuaMo (form đóng). Cả hai câu phải ghi đúng địa điểm.
    if (new RegExp(`\\bmoTa=\\{moTaTrangHoiBan\\('${nn}',`).test(nguon)) {
      const hai = [chu(nn).moTaHoiBan, chu(nn).moTaHoiBanChuaMo];
      ok(`pages/${f.join('/')}: thẻ mô tả ghi "${mong}" (cả hai câu của moTaTrangHoiBan: form mở và form đóng)`,
         hai.every(m => typeof m === 'string' && m.includes(mong)), hai.join(' | '));
      ok(`pages/${f.join('/')}: hai câu mô tả của moTaTrangHoiBan không ghi tên phường hay quận`,
         hai.every(m => !PHUONG_QUAN.tim(m ?? '')), hai.map(m => PHUONG_QUAN.tim(m ?? '')).filter(Boolean).join(' | '));
      continue;
    }
    const moTa = nguon.match(/\bmoTa="([^"]*)"/)?.[1] ?? '';
    ok(`pages/${f.join('/')}: thẻ mô tả ghi "${mong}"`, moTa.includes(mong), moTa);
  }

  // Thẻ tiêu đề và mô tả của MỌI trang công khai: không vế phường / quận nào (chưa có giấy xác nhận).
  const theMeta = TRANG_GOC.filter(f => f.endsWith('.astro')).flatMap(f => [...doc(f).matchAll(/\b(tieuDe|moTa)="([^"]*)"/g)]
    .map(m => ({ file: tuGoc(f), the: m[1], chu: m[2], thay: PHUONG_QUAN.tim(m[2]) })));
  ok(`Thẻ tiêu đề và mô tả của ${TRANG_GOC.filter(f => f.endsWith('.astro')).length} trang (${theMeta.length} thẻ): không ghi tên phường hay quận nào`,
     theMeta.length >= 30 && theMeta.every(t => !t.thay),
     theMeta.filter(t => t.thay).slice(0, 4).map(t => `${t.file} ${t.the} «${t.thay}»`).join(' | '));

  const toaNha = timDong(FILE_CONG_KHAI, TOA_NHA);
  ok('Không file nào của trang công khai gọi địa điểm là "tòa nhà" / "the building" / "건물" (kể cả chú thích)', toaNha.length === 0, inDong(toaNha));

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

// ===========================================================================
// Địa chỉ trên trang có hai nguồn: bản công bố trong /noi-bo (khóa dia_chi_hien_thi) và, khi chưa công
// bố, địa chỉ cố định trong mã. Bản công bố phải tới được MỌI chỗ in địa chỉ nhà hàng — không thì đổi
// địa chỉ trong /noi-bo xong, một trang vẫn hiện hai địa chỉ. Trang đã dựng có bản công bố: thu-day-du.mjs nhóm 7.
await nhom('7 · BẢN CÔNG BỐ TRONG /noi-bo TỚI ĐƯỢC MỌI CHỖ IN ĐỊA CHỈ', async () => {
  const CONG_BO = 'Tầng 3, 63 Hồ Tùng Mậu, phường Thử, TP. Hồ Chí Minh';   // "phường Thử": tên giả, chỉ để thử
  const nd = { ...NEN, dia_chi_hien_thi: `  ${CONG_BO}  ` };
  ok('Hàm: có bản công bố → khối địa chỉ, chân trang, câu hỏi thường gặp in nguyên bản công bố', diaChi(nd) === CONG_BO, diaChi(nd));
  ok('Hàm: có bản công bố → menu gọn in bản công bố sau chữ "Tầng 3"', diaChiSauTang(nd) === '63 Hồ Tùng Mậu, phường Thử, TP. Hồ Chí Minh', diaChiSauTang(nd));
  ok('Hàm: có bản công bố → màn đầu in bản công bố, bỏ vế phường', diaChiManDau(nd) === '63 Hồ Tùng Mậu, TP. Hồ Chí Minh', diaChiManDau(nd));
  ok('Hàm: có bản công bố → JSON-LD để cả dòng ở streetAddress',
     JSON.stringify(diaChiCoCauTruc(nd)) === JSON.stringify({ '@type': 'PostalAddress', streetAddress: CONG_BO, addressCountry: 'VN' }), JSON.stringify(diaChiCoCauTruc(nd)));
  ok('Hàm: bản công bố là một địa chỉ khác hẳn → mọi hàm trả địa chỉ đó, không trộn với địa chỉ cố định',
     [diaChi, diaChiSauTang, diaChiManDau].every(ham => ham({ ...NEN, dia_chi_hien_thi: '12 Đường Thử, TP. Thử' }) === '12 Đường Thử, TP. Thử')
       && diaChiCoCauTruc({ ...NEN, dia_chi_hien_thi: '12 Đường Thử, TP. Thử' }).streetAddress === '12 Đường Thử, TP. Thử');

  // Từng chỗ in địa chỉ gọi đúng hàm đọc bản công bố.
  const comp = f => docSrc('components', f);
  const kmd = comp('KhoiMoDau.astro');
  ok('KhoiMoDau.astro (màn đầu): dòng địa chỉ in diaChiManDau(nd)',
     kmd.includes('const cumDc = cumDiaChi(diaChiManDau(nd));')
       && /<a class="kmd-dia-chi"[^\n]*<strong>\{t\.tang3\}<\/strong> · <span lang="vi">\{cumDc\.map\(/.test(kmd));
  ok('DauTrang.astro (menu gọn): in diaChiSauTang(nd)', comp('DauTrang.astro').includes('<span lang="vi">{diaChiSauTang(nd)}</span>'));
  const lt3 = comp('LenTang3.astro');
  ok('LenTang3.astro (khối địa chỉ, bản đầy đủ và bản gọn; nút sao chép): in diaChi(nd)',
     lt3.includes('const dc = diaChi(nd);') && (lt3.match(/<span lang="vi">\{cumDiaChi\(dc\)\.map\(/g) ?? []).length === 2 && lt3.includes('data-sao-chep={dc}'));
  ok('ChanTrang.astro (chân trang): in diaChi(nd)', comp('ChanTrang.astro').includes('<p lang="vi">{cumDiaChi(diaChi(nd)).map('));
  ok('CauHoi.astro (câu hỏi thường gặp): in diaChi(nd)', comp('CauHoi.astro').includes('const cumDc = cumDiaChi(diaChi(nd));'));
  const tdb = comp('TrangDenBeeftown.astro');
  ok('TrangDenBeeftown.astro (bước 1, "Địa chỉ đầy đủ"): in diaChi(nd)',
     tdb.includes('const dc = diaChi(nd);') && tdb.includes('<p>{c.b1Chu} <span lang="vi">{cumDiaChi(dc).map('));
  ok('Trang.astro (JSON-LD): in diaChiCoCauTruc(nd)', docSrc('layouts', 'Trang.astro').includes('duLieuCoCauTruc.address = diaChiCoCauTruc(nd);'));

  // Không file .astro nào đi đường tắt: đọc thẳng hằng địa chỉ, hay gõ sẵn cả dòng địa chỉ vào template.
  const tat = timDong(ASTRO_CONG_KHAI, /DIA_CHI_NHA_HANG|DIA_CHI_PHAN/);
  ok(`Không file .astro công khai nào (${ASTRO_CONG_KHAI.length} file) đọc thẳng DIA_CHI_NHA_HANG / DIA_CHI_PHAN — chỉ lib/trang-cong-khai.ts đọc`,
     ASTRO_CONG_KHAI.length >= 40 && tat.length === 0, inDong(tat));
  const goSan = timDong(ASTRO_CONG_KHAI.filter(f => !tuGoc(f).startsWith('web/src/pages/')), /Tầng 3, 63 Hồ Tùng Mậu/);
  ok('Không component hay layout nào gõ sẵn "Tầng 3, 63 Hồ Tùng Mậu" (chỉ thẻ tiêu đề, mô tả của từng trang có chữ đó)', goSan.length === 0, inDong(goSan));
});

// ===========================================================================
// Máy dịch (Gemini) dịch tin tuyển dụng, món ăn, câu công bố từ tiếng Việt sang Anh và Hàn; bảng từ
// trong QUY_TAC_DICH dặn nó tên riêng nào giữ nguyên. Bảng từ sai thì bản dịch lên trang sai.
await nhom('8 · BẢNG TỪ CỦA MÁY DỊCH THEO ĐỊA ĐIỂM HIỆN TẠI', async () => {
  const quyTac = doc(join(SRC, 'lib', 'may-dich.ts')).match(/export const QUY_TAC_DICH = `([\s\S]*?)`;/)?.[1] ?? '';
  ok('Đọc được QUY_TAC_DICH và bảng từ của nó', quyTac.length > 500 && quyTac.includes('Glossary (Vietnamese → English / Korean):'), `${quyTac.length} ký tự`);
  const khac = quyTac.split('\n').flatMap((d, i) => (TEN_DIA_CHI_KHAC.tim(d) ? [`dòng ${i + 1} «${TEN_DIA_CHI_KHAC.tim(d)}»`] : []));
  ok('Bảng từ không còn tên đường, tên khu của địa chỉ khác (Cầu Ông Lãnh, Hàm Nghi…)', khac.length === 0, khac.join(' | '));
  ok('Bảng từ dặn giữ nguyên "Hồ Tùng Mậu" (cả trong bản tiếng Hàn)',
     quyTac.includes('   - Hồ Tùng Mậu → Hồ Tùng Mậu / Hồ Tùng Mậu (a street name: keep the Vietnamese spelling, also in Korean)\n'));
  ok('Bảng từ: Tầng 3 → Floor 3 / 3층 — như trang đang viết', quyTac.includes('   - Tầng 3 → Floor 3 / 3층\n')
     && chu('en').tang3 === 'Floor 3' && chu('ko').tang3 === '3층');
  ok('Bảng từ: thang máy → lift / 엘리베이터 — như câu chỉ đường đang viết', quyTac.includes('   - thang máy → lift / 엘리베이터\n')
     && chu('en').loiLen.includes('the lift') && chu('ko').loiLen.includes('엘리베이터'));
});

process.exit(ketThuc('ĐỊA ĐIỂM TRÊN TRANG CÔNG KHAI'));
