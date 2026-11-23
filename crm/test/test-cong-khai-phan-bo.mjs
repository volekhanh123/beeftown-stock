/**
 * BEEFTOWN — TRANG "CÁC PHẦN THỊT BÒ" (/phan-thit-bo, /en/beef-cuts, /ko/beef-cuts)
 * =================================================================================
 *
 *     node test/test-cong-khai-phan-bo.mjs
 *
 * Trang trụ cột cho người đang tìm tên các phần thịt ("đầu thăn ngoại", "dẻ sườn bò là phần nào"). Chữ nằm ở
 * web/src/lib/phan-bo.ts, trang ở web/src/components/TrangPhanBo.astro. File này gác điều Khánh đã quyết
 * ngày 23/11/2026 và điều tài liệu đào tạo cấm:
 *
 *   1. Tên tiếng Việt: ba tên Khánh chốt (đầu thăn ngoại, dẻ sườn bò, diềm thăn bò) cộng nạc vai bò, lõi vai bò;
 *      không "thăn vai". Bản tiếng Hàn dùng tên Hàn, bản tiếng Anh dùng tên Anh.
 *   2. Chữ không được viết: giống bò / cấp hạng / xuất xứ (Wagyu, MB9, A5, Úc, Hanwoo), số ngày ủ, giá, "bếp từ",
 *      than, Chimasal (chưa chốt tên); không câu so sánh nhất (cả danh sách chữ cấm của trang công khai).
 *   3. Đường gân giữa của lõi vai: tài liệu tự mâu thuẫn (mục 05 "đã loại bỏ", mục 09 "ăn được sau khi ủ") — trang
 *      không nói đã bỏ hay ăn được, chỉ dặn hỏi nhân viên quầy.
 *   4. Ba thứ tiếng đủ: mọi chuỗi có vi, en, ko; bản Hàn có chữ Hàn, bản Anh không lẫn chữ Việt có dấu ngoài tên riêng.
 *   5. Đường dẫn: dòng trong CAP_DUONG_DAN (sitemap và hreflang theo đó), ba file trang khai đúng đường dẫn,
 *      tiêu đề và mô tả đúng cỡ.
 *   6. Ảnh: bảy ảnh CHỤP THẬT của người khác (minhHoa: false — không nhãn "Ảnh minh họa", Khánh quyết 23/11/2026);
 *      dòng nguồn ảnh ghi tác giả, và ảnh CC BY 2.0 ghi giấy phép, trang gốc, việc đã chỉnh. Ảnh diềm thăn bò đã chỉnh bằng AI (Khánh quyết 23/11/2026: không nhãn "Ảnh minh họa"), nên dòng nguồn nói rõ "chỉnh sửa bằng AI".
 *   7. Trang: một h1, đủ bảy phần có neo (#pb-la-galbi và #pb-ba-chi được trang Mua thịt về trỏ tới), hỏi đáp có câu "Dẻ sườn bò là phần nào?", tên ngoại ngữ có thuộc tính lang.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const SRC = join(WEB, 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const doc = (...p) => readFileSync(join(...p), 'utf8');
const { PHAN_BO, CHU_PHAN_BO, NGUON_ANH_DIEM_THAN } = await nap('phan-bo.ts');
const { CAP_DUONG_DAN, NGON_NGU } = await nap('chu.ts');
const { DANH_MUC_ANH } = await nap('anh.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRANG CÁC PHẦN THỊT BÒ');

// Chép tay ở đây, KHÔNG đọc từ phan-bo.ts: sửa nhầm một tên ở đó thì phép thử này đỏ.
const TEN_VI = { 'dau-than-ngoai': 'Đầu thăn ngoại', 'de-suon': 'Dẻ sườn bò', 'diem-than': 'Diềm thăn bò', 'nac-vai': 'Nạc vai bò', 'loi-vai': 'Lõi vai bò',
  'la-galbi': 'LA Galbi (sườn bò cắt ngang)', 'ba-chi': 'Ba chỉ bò' };
const TEN_KO = { 'dau-than-ngoai': '꽃등심', 'de-suon': '갈비살', 'diem-than': '안창살', 'nac-vai': '윗등심', 'loi-vai': '부채살', 'la-galbi': 'LA갈비', 'ba-chi': '우삼겹' };
const ANH_CUA_PHAN = {
  'dau-than-ngoai': 'phan-bo-dau-than-ngoai', 'de-suon': 'phan-bo-de-suon', 'diem-than': 'phan-bo-diem-than',
  'nac-vai': 'phan-bo-nac-vai', 'loi-vai': 'phan-bo-loi-vai', 'la-galbi': 'phan-bo-la-galbi', 'ba-chi': 'phan-bo-ba-chi',
};
const CHU_VIET_CO_DAU = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;

/** Mọi chuỗi trong một cây dữ liệu, kèm đường đi tới nó. */
function moiChuoi(x, duong = '') {
  if (typeof x === 'string') return [[duong, x]];
  if (Array.isArray(x)) return x.flatMap((v, i) => moiChuoi(v, `${duong}[${i}]`));
  if (x && typeof x === 'object') return Object.entries(x).flatMap(([k, v]) => moiChuoi(v, duong ? `${duong}.${k}` : k));
  return [];
}
const TAT_CA = [...moiChuoi(PHAN_BO, 'PHAN_BO'), ...moiChuoi(CHU_PHAN_BO, 'CHU_PHAN_BO'), ...moiChuoi(NGUON_ANH_DIEM_THAN, 'NGUON')];
const CHU_TRANG = TAT_CA.filter(([d]) => !d.startsWith('NGUON'));
/** Chuỗi của một thứ tiếng: đường đi kết thúc bằng .vi / .en / .ko. */
const theoNgon = nn => CHU_TRANG.filter(([d]) => d.endsWith(`.${nn}`));

await nhom('1 · TÊN TIẾNG VIỆT, HÀN, ANH CỦA NĂM PHẦN THỊT', async () => {
  ok('Đúng bảy phần thịt, theo thứ tự trang: đầu thăn ngoại, dẻ sườn bò, diềm thăn bò, nạc vai bò, lõi vai bò, LA Galbi, ba chỉ bò',
     JSON.stringify(PHAN_BO.map(p => p.id)) === JSON.stringify(Object.keys(TEN_VI)), PHAN_BO.map(p => p.id).join(', '));
  for (const p of PHAN_BO) {
    ok(`${p.id}: tên Việt "${TEN_VI[p.id]}", tên Hàn "${TEN_KO[p.id]}", có tên Anh và phiên âm Latin của tên Hàn`,
       p.ten.vi === TEN_VI[p.id] && p.ten.ko === TEN_KO[p.id] && /^[A-Za-z][A-Za-z ()-]+$/.test(p.ten.en) && /^[A-Za-z ]+$/.test(p.hanLatin),
       JSON.stringify(p.ten) + ' ' + p.hanLatin);
  }
  const toanVi = theoNgon('vi').map(([, c]) => c).join('\n');
  ok('Không chỗ nào viết "thăn vai" (mỗi nơi dùng cho một phần khác nhau: top blade, T-bone, ribeye — Khánh dặn tránh)',
     !/thăn vai/i.test(toanVi) && !/thăn vai/i.test(TAT_CA.map(([, c]) => c).join('\n')));
  ok('Đầu thăn ngoại luôn có chữ "đầu": câu hỏi đáp nói thẳng "thăn ngoại" không có chữ "đầu" là striploin',
     /striploin/.test(CHU_PHAN_BO.hoi[1].d.vi) && /striploin/.test(CHU_PHAN_BO.hoi[1].d.en) && /đầu/.test(CHU_PHAN_BO.hoi[1].d.ko));
  ok('Chimasal / yukhoe CHƯA có trong trang (chưa chốt tên tiếng Việt cho phần thịt này)',
     !/chimasal|치마살|yukhoe|육회|flank steak/i.test(TAT_CA.map(([, c]) => c).join('\n')));
  ok('Tên Hàn của bảy phần chỉ xuất hiện như tên gọi khác / bản Hàn; trang tiếng Việt không dùng chúng làm tiêu đề',
     PHAN_BO.every(p => p.ten.vi !== p.ten.ko && !/[가-힣]/.test(p.ten.vi)));
});

await nhom('2 · CHỮ KHÔNG ĐƯỢC VIẾT', async () => {
  const gop = TAT_CA.map(([, c]) => c).join('\n');
  ok('Không giống bò, cấp hạng, xuất xứ: Wagyu, MB9, A5, Hanwoo, Úc, Australia, 호주',
     !/wagyu|와규|\bMB\s?9\b|\bA5\b|hanwoo|한우|\bÚc\b|australia|호주|nhập khẩu|imported/i.test(gop));
  ok('Không số ngày ủ, không phần trăm, không giá tiền, không khối lượng khay (nhãn khay ghi)',
     !/\d+\s?ngày|\d+\s?days?|\d+\s?일|\d+\s?%|\d[\d.,]*\s?(đ\b|vnđ|vnd|₫|\bg\b|gram|kg)/i.test(gop), gop.match(/\d+\s?ngày|\d+\s?%|\d[\d.,]*\s?(đ\b|vnđ|vnd|₫|\bg\b|gram|kg)/i)?.[0]);
  ok('Bàn nướng là vỉ gas: không "bếp từ", không than, củi, khói, charcoal, 숯',
     !/bếp từ|induction|than hoa|than củi|charcoal|\bcủi\b|khói|smoke|숯/i.test(gop), gop.match(/bếp từ|than hoa|khói|smoke/i)?.[0]);
  ok('Không claim so sánh nhất hay lợi thế giá: ngon nhất, tốt nhất, best, rẻ hơn, 최고…',
     !/ngon nhất|tốt nhất|số một|\bbest\b|\bthe best\b|rẻ hơn|cheaper|최고|가성비/i.test(gop));
  const bi = CHU_TRANG.flatMap(([d, c]) => timChuoiCam(c).map(m => `${d}: ${m.tim_thay}`));
  ok('Qua đúng danh sách chữ cấm của trang công khai (src/lib/chuoi-cam.js) — chuỗi nào cũng sạch', bi.length === 0, bi.join(' | '));
  // Tên các trang ảnh kho bị cấm in lên trang (chuoi-cam.js); nguồn ảnh chỉ ghi tên người chụp.
  ok('Dòng nguồn ảnh ghi tên người chụp, không in tên trang ảnh kho (chuoi-cam.js chặn "ảnh kho")',
     !/unsplash|pexels|pixabay|shutterstock/i.test(JSON.stringify(CHU_PHAN_BO.nguonDan) + JSON.stringify(CHU_PHAN_BO.nguonDiemThanTruoc)));
});

await nhom('3 · LÕI VAI: KHÔNG NÓI ĐƯỜNG GÂN GIỮA ĐÃ BỎ HAY ĂN ĐƯỢC', async () => {
  const loi = PHAN_BO.find(p => p.id === 'loi-vai');
  for (const nn of NGON_NGU) {
    const c = [loi.noi[nn], loi.an[nn], loi.nuong[nn], loi.hop[nn]].join(' ');
    ok(`loi-vai [${nn}]: không nói gân giữa "đã loại bỏ" / "ăn được sau khi ủ"`,
       !/loại bỏ|đã bỏ|removed|trimmed|ăn được|edible|aged|ủ\b|숙성|제거/i.test(c), c.match(/loại bỏ|đã bỏ|removed|trimmed|ăn được|edible|aged|ủ\b|숙성|제거/i)?.[0]);
    ok(`loi-vai [${nn}]: chỉ dặn hỏi nhân viên quầy về tình trạng sơ chế của khay`,
       /nhân viên quầy|counter staff|정육 코너 직원/.test(loi.noi[nn]), loi.noi[nn]);
  }
});

await nhom('4 · BA THỨ TIẾNG ĐỦ', async () => {
  const thieu = TAT_CA.filter(([d]) => /\.(vi|en|ko)$/.test(d)).filter(([, c]) => c.trim() === '').map(([d]) => d);
  ok('Mọi chuỗi vi / en / ko đều có chữ', thieu.length === 0, thieu.join(', '));
  const khongDu = [];
  const lanChuoi = (x, duong) => {
    if (x && typeof x === 'object' && !Array.isArray(x)) {
      const k = Object.keys(x);
      if (k.includes('vi') || k.includes('en') || k.includes('ko')) { if (!(k.includes('vi') && k.includes('en') && k.includes('ko'))) khongDu.push(duong); return; }
      for (const [a, v] of Object.entries(x)) lanChuoi(v, duong ? `${duong}.${a}` : a);
    } else if (Array.isArray(x)) x.forEach((v, i) => lanChuoi(v, `${duong}[${i}]`));
  };
  lanChuoi(PHAN_BO, 'PHAN_BO'); lanChuoi(CHU_PHAN_BO, 'CHU_PHAN_BO');
  ok('Mọi nhóm chữ khai đủ cả ba thứ tiếng — không thiếu một thứ tiếng nào', khongDu.length === 0, khongDu.join(', '));
  ok('Bản Hàn: mọi chuỗi có chữ Hàn (trừ nguồn ảnh) và viết 해요체 ở các câu dài',
     theoNgon('ko').filter(([, c]) => c.length > 40).every(([, c]) => /[가-힣]/.test(c) && /요[.?]?$|요\)?$/.test(c.trim())),
     theoNgon('ko').filter(([, c]) => c.length > 40 && !/요[.?]?$/.test(c.trim())).map(([d]) => d).join(', '));
  // Bản Anh không lẫn chữ Việt có dấu, trừ tên riêng: tên đặt trong ngoặc kép (“đầu thăn ngoại”, “diềm bụng”) và năm tên
  // tiếng Việt của năm phần thịt (đứng cạnh tên Anh, vd. "Rib finger (galbisal in Korean, dẻ sườn bò in Vietnamese)").
  const tenViet = new RegExp(Object.values(TEN_VI).map(t => t.toLowerCase()).join('|'), 'gi');
  const anLanViet = theoNgon('en').filter(([, c]) => CHU_VIET_CO_DAU.test(c.replace(/“[^”]*”/g, '').replace(tenViet, '')));
  ok('Bản Anh không lẫn chữ Việt có dấu ngoài tên đặt trong ngoặc kép', anLanViet.length === 0, anLanViet.map(([d]) => d).join(', '));
});

await nhom('5 · ĐƯỜNG DẪN, TIÊU ĐỀ, MÔ TẢ', async () => {
  const dong = CAP_DUONG_DAN.find(c => c[0] === '/phan-thit-bo');
  ok('CAP_DUONG_DAN có dòng /phan-thit-bo ↔ /en/beef-cuts ↔ /ko/beef-cuts (sitemap và hreflang theo bảng này)',
     !!dong && dong[1] === '/en/beef-cuts' && dong[2] === '/ko/beef-cuts', JSON.stringify(dong));
  const FILE = { vi: ['pages', 'phan-thit-bo.astro'], en: ['pages', 'en', 'beef-cuts.astro'], ko: ['pages', 'ko', 'beef-cuts.astro'] };
  for (const nn of NGON_NGU) {
    const f = join(SRC, ...FILE[nn]);
    if (!ok(`${nn}: có file trang ${FILE[nn].join('/')}`, existsSync(f))) continue;
    const s = doc(f);
    const duong = s.match(/duongDan="([^"]+)"/)?.[1];
    const tieuDe = s.match(/tieuDe="([^"]+)"/)?.[1] ?? '';
    const moTa = s.match(/moTa="([^"]+)"/)?.[1] ?? '';
    ok(`${nn}: đường dẫn ${dong?.[NGON_NGU.indexOf(nn)]}, nạp TrangPhanBo với đúng thứ tiếng`,
       duong === dong?.[NGON_NGU.indexOf(nn)] && new RegExp(`<TrangPhanBo ngonNgu="${nn}"`).test(s) && new RegExp(`docNoiDung\\('${nn}'\\)`).test(s), duong);
    ok(`${nn}: tiêu đề kết thúc " — Beeftown", mô tả 80–170 ký tự (cùng kiểu các trang khác)`,
       / — Beeftown$/.test(tieuDe) && moTa.length >= 80 && moTa.length <= 170, `${tieuDe.length} / ${moTa.length}`);
  }
  const viS = doc(SRC, 'pages', 'phan-thit-bo.astro');
  ok('Tiêu đề tiếng Việt có ba cụm khóa: đầu thăn ngoại, dẻ sườn bò, diềm thăn bò',
     /đầu thăn ngoại/.test(viS) && /dẻ sườn bò/.test(viS) && /diềm thăn bò/.test(viS));
});

await nhom('6 · ẢNH: CHỤP THẬT, KHÔNG NHÃN, CÓ NGUỒN', async () => {
  for (const p of PHAN_BO) {
    const id = ANH_CUA_PHAN[p.id];
    const mt = DANH_MUC_ANH[id];
    ok(`${id}: ảnh chụp thật (minhHoa: false), alt đủ ba thứ tiếng, không nói đây là ảnh của quán`,
       !!mt && mt.minhHoa === false && ['vi', 'en', 'ko'].every(nn => typeof mt.alt?.[nn] === 'string')
         && !/của quán|tại Beeftown|at Beeftown|Beeftown의|ảnh chụp tại|taken at/i.test(Object.values(mt.alt ?? {}).join(' ')), JSON.stringify(mt));
  }
  const goi = doc(SRC, 'components', 'AnhPhanBo.astro');
  ok('AnhPhanBo.astro gọi đúng bảy id, khung 4:3, hình thay là khay',
     JSON.stringify([...goi.matchAll(/<Anh id="([^"]+)" ngonNgu=\{ngonNgu\} khung="4x3" sizes=\{sizes\} thayBang="khay" \/>/g)].map(m => m[1]))
       === JSON.stringify(Object.values(ANH_CUA_PHAN)));
  const trang = doc(SRC, 'components', 'TrangPhanBo.astro');
  // Phần template: bỏ khối --- … ---, <style> và chú thích (chú thích đầu file nhắc chuyện nhãn).
  const mauTrang = trang.replace(/^---[\s\S]*?\n---/, '').replace(/<style[^>]*>[\s\S]*?<\/style>/g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  ok('Trang không tự gắn nhãn "Ảnh minh họa" (t.anhMinhHoa) — ảnh thật không có nhãn đó; chữ của trang cũng không có',
     !/anhMinhHoa|<figcaption class="chu-thich-anh"/.test(mauTrang) && !/minh họa|Illustrative|연출/i.test(JSON.stringify(CHU_PHAN_BO)));
  ok('Nguồn ảnh: ảnh CC BY 2.0 có tác giả T.Tseng, giấy phép CC BY 2.0 (link creativecommons.org), trang gốc Wikimedia Commons, việc đã cắt và chỉnh màu',
     /T\.Tseng/.test(CHU_PHAN_BO.nguonDiemThanGiua.vi) && /T\.Tseng/.test(CHU_PHAN_BO.nguonDiemThanGiua.en) && /T\.Tseng/.test(CHU_PHAN_BO.nguonDiemThanGiua.ko)
       && /CC BY 2\.0/.test(trang) && NGUON_ANH_DIEM_THAN.giayPhep === 'https://creativecommons.org/licenses/by/2.0/'
       && /^https:\/\/commons\.wikimedia\.org\/wiki\/File:Yazawa_cut_harami/.test(NGUON_ANH_DIEM_THAN.trang)
       && /chỉnh sửa bằng AI/.test(CHU_PHAN_BO.nguonDiemThanSau.vi) && /retouched with AI/.test(CHU_PHAN_BO.nguonDiemThanSau.en) && /AI로/.test(CHU_PHAN_BO.nguonDiemThanSau.ko));
  ok('Nguồn ảnh ghi tên cả ba người chụp còn lại: Tiago Morheto, BlackRiv, 홍대앞고깃집',
     NGON_NGU.every(nn => /Tiago Morheto/.test(CHU_PHAN_BO.nguonDan[nn]) && /BlackRiv/.test(CHU_PHAN_BO.nguonDan[nn]) && /홍대앞고깃집/.test(CHU_PHAN_BO.nguonDan[nn])));
  const tep = doc(WEB, 'cong-cu', 'anh', 'NGUON-ANH-PHAN-BO.md');
  ok('web/cong-cu/anh/NGUON-ANH-PHAN-BO.md ghi nguồn, tác giả, giấy phép của từng id ảnh', Object.values(ANH_CUA_PHAN).every(id => tep.includes('`' + id + '`')) && /CC BY 2\.0/.test(tep));
  const duongTam = join(WEB, 'public');
  ok('Tệp nguồn ảnh nằm ngoài public/ (tên kho ảnh không lên trang)', !existsSync(join(duongTam, 'NGUON-ANH-PHAN-BO.md')));
});

await nhom('7 · TRANG: MỘT H1, NĂM PHẦN CÓ NEO, HỎI ĐÁP, LANG CỦA TÊN NGOẠI NGỮ', async () => {
  const trang = doc(SRC, 'components', 'TrangPhanBo.astro');
  ok('Đúng một <h1> trong component', (trang.match(/<h1\b/g) ?? []).length === 1);
  ok('Mỗi phần thịt là một <section> có neo #pb-<id> và aria-labelledby; bảng so sánh trỏ tới đúng các neo đó',
     /id=\{`pb-\$\{p\.id\}`\}/.test(trang) && /aria-labelledby=\{`pb-h-\$\{p\.id\}`\}/.test(trang) && /href=\{`#pb-\$\{p\.id\}`\}/.test(trang));
  ok('Tên gọi khác đánh dấu thứ tiếng của từng tên: <span lang={k.ng}>', /<span lang=\{k\.ng\}>/.test(trang));
  ok('Hỏi đáp dùng <details> / <summary> (mở được khi tắt JavaScript), có câu "Dẻ sườn bò là phần nào?"',
     /<details>/.test(trang) && /<summary>/.test(trang) && CHU_PHAN_BO.hoi.some(q => q.h.vi === 'Dẻ sườn bò là phần nào?'));
  ok('Nút Đặt bàn chỉ khi có kênh thật (coKenhHoiBan); Xem thực đơn luôn có — cùng cách trang Đến Beeftown',
     /coKenh && <a class="nut nut-chinh" href=\{duongDanTuongUng\('\/dat-ban', ngonNgu\)\}>\{t\.datBan\}<\/a>/.test(trang) && /duongDanTuongUng\('\/thuc-don', ngonNgu\)/.test(trang));
  ok('Hình con bò: một <defs> cho cả trang, mỗi phần vẽ lại bằng <use>; mọi màu trong hình thuộc bảng màu',
     /<g id="pb-con" set:html=\{CON_BO_THAN\}/.test(trang) && /<use href=\{`#pb-vung-\$\{p\.id\}`\}/.test(trang)
       && [...doc(SRC, 'lib', 'so-do-con-bo.ts').matchAll(/#[0-9A-Fa-f]{6}\b/g)].every(m => ['#000000', '#555555', '#BD0000', '#E2E2E2', '#FFFFFF'].includes(m[0].toUpperCase())));
  const nuong = CHU_PHAN_BO.nuong.map(m => m.vi).join(' ');
  ok('Phần "nướng chung" chỉ có điều tài liệu đào tạo nêu: nói trước mức chín, nếm thử, chuyển ra rìa vỉ, lật thịt, nhờ nhân viên nướng giúp',
     CHU_PHAN_BO.nuong.length === 5 && /(mức|độ) chín/.test(nuong) && /nếm/.test(nuong) && /rìa vỉ/.test(nuong) && /nhân viên nướng giúp/.test(nuong));
});

await nhom('8 · BA GÓI MUA VỀ: LA GALBI, BA CHỈ BÒ, RIBEYE CÒN NẮP (23/11/2026)', async () => {
  const trang = doc(SRC, 'components', 'TrangPhanBo.astro');
  const id = ten => PHAN_BO.find(p => p.id === ten);
  ok('Hai neo cố định cho trang Mua thịt về: #pb-la-galbi và #pb-ba-chi (section id = pb-<id>; tiêu đề pb-h-<id>; hình pb-vung-<id>) — KHÔNG đổi tên',
     !!id('la-galbi') && !!id('ba-chi') && /id=\{`pb-\$\{p\.id\}`\}/.test(trang) && /id=\{`pb-h-\$\{p\.id\}`\}/.test(trang) && /id=\{`pb-vung-\$\{p\.id\}`\}/.test(trang));
  ok('Ribeye còn nắp: ghi chú nằm TRONG phần đầu thăn ngoại (them), ba thứ tiếng, nhắc tên "Ribeye with Cap" và phần nắp',
     NGON_NGU.every(nn => /Ribeye with Cap/i.test(id('dau-than-ngoai').them?.chu[nn] ?? '')) && id('dau-than-ngoai').coGoiMuaVe === true);
  ok('LA Galbi: sườn bò cắt ngang xương (flanken), có xương, đã ướp sẵn, cấp đông — đúng mô tả của quán trên trang Mua thịt về',
     /cắt ngang/.test(id('la-galbi').noi.vi) && /flanken/i.test(id('la-galbi').noi.vi) && /đã ướp sẵn và cấp đông/.test(id('la-galbi').an.vi) && /còn xương, đã ướp sẵn và cấp đông/.test(id('la-galbi').them.chu.vi));
  ok('Ba chỉ bò: mỡ xen nạc, cấp đông, hợp nướng nhanh trên vỉ hoặc nhúng lẩu — đúng mô tả của quán; tên Anh và Hàn',
     /mỡ xen nạc/.test(id('ba-chi').noi.vi) && /cấp đông/.test(id('ba-chi').an.vi) && /nướng nhanh trên vỉ hoặc nhúng lẩu/.test(id('ba-chi').an.vi) && /short plate/i.test(id('ba-chi').noi.vi) && id('ba-chi').ten.ko === '우삼겹');
  ok('Link sang trang Mua thịt về chỉ khi trang đó đang mở (muaThitVeMo, cùng công tắc với mục menu) và chỉ ở phần có gói',
     /import \{ muaThitVeMo \} from '\.\.\/lib\/dich-dat-hang'/.test(trang) && /p\.coGoiMuaVe && muaVeMo &&/.test(trang) && /duongDanTuongUng\('\/mua-thit-ve', ngonNgu\)/.test(trang)
       && PHAN_BO.filter(p => p.coGoiMuaVe).map(p => p.id).join() === 'dau-than-ngoai,la-galbi,ba-chi');
  ok('Bảng so sánh và hỏi đáp có đủ ba phần mới (hàng bảng ba thứ tiếng; câu hỏi LA galbi, ba chỉ bò, ribeye còn nắp)',
     ['la-galbi', 'ba-chi'].every(k => NGON_NGU.every(nn => (CHU_PHAN_BO.bang[k]?.[nn] ?? '').length > 20))
       && ['LA Galbi (sườn bò cắt ngang) là gì?', 'Ba chỉ bò là phần nào?', 'Đầu thăn ngoại còn nắp (Ribeye with Cap) là gì?'].every(h => CHU_PHAN_BO.hoi.some(q => q.h.vi.startsWith(h))));
  ok('Ba chỉ bò nói thái mỏng / lát mỏng chỉ như điều thường gặp, không hứa độ dày; không nói xuất xứ hay cấp hạng (đã kiểm ở nhóm 2)',
     !/\d\s?mm|\d\s?ly/i.test(JSON.stringify(id('ba-chi'))) && /thường được thái lát mỏng/.test(id('ba-chi').an.vi));
});

process.exit(ketThuc('TRANG CÁC PHẦN THỊT BÒ'));
