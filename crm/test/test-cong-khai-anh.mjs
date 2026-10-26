/**
 * BEEFTOWN — ẢNH CỦA TRANG CÔNG KHAI, NHÃN "ẢNH MINH HỌA", THẺ ĐỌC NHÃN KHAY, BỐ CỤC TRANG CHỦ
 * ==========================================================================================
 *
 *     node test/test-cong-khai-anh.mjs
 *
 * Đợt redesign, PR 3 (trang chủ và thực đơn) đưa ảnh lên trang. Khánh quyết ngày 11/10/2026:
 *   1. Giữ các dải nền tối như đang chạy ("Quầy chọn bò" ở trang chủ, "Bò tại quầy" ở Thực đơn).
 *   2. Đưa ảnh AI lên trang, mỗi ảnh có nhãn "Ảnh minh họa".
 *   3. Dùng cả hai ảnh bữa ăn có món phụ và bàn tay người (mon-an-chia-se, bua-an-cung-ban).
 *      Bàn tay thì được, mặt người thì không.
 *   4. Giữ nguyên câu chính của trang chủ.
 * Vẫn như cũ: ảnh AI không dùng cho quầy, khay, không gian, lối vào, thang máy — đó là KhungAnh.
 *
 * File này đọc MÃ NGUỒN (không cần trình duyệt). Số đo trên trang đã dựng nằm ở
 * web/kiem-tra/do-giao-dien.mjs (phép đo anh, nhanKhay, trangChu, thucDon). Bất biến:
 *
 *   1. Danh mục ảnh (web/src/lib/anh.ts): đúng bảy id; ảnh AI nào cũng mang cờ minhHoa; alt đủ vi,
 *      en, ko, tả đúng ảnh ChatGPT tạo ngày 11/10/2026 — không còn chữ của bộ ảnh cũ (vỉ gang, hương
 *      thảo, muối hạt, đĩa đá, bốn chén sốt), không chữ cấm, không nói đây là ảnh của quán, không kể
 *      tên món phụ, không chữ về than, lửa, khói.
 *   2. danh-sach.json: nguồn ghi đúng sự thật (ChatGPT qua Codex, 11/10/2026 — không còn job id của
 *      công cụ cũ); không khung nào đòi bề rộng lớn hơn vùng cắt của ảnh gốc (không phóng to).
 *   3. Ảnh đã dựng khớp với chỗ dùng: khung nào component gọi thì đã dựng, khung nào đã dựng thì có
 *      component gọi (không file ảnh chết trong repo); không PNG gốc nào lọt vào web/public/anh.
 *   4. Nhãn "Ảnh minh họa": component <Anh> tự gắn; chữ đủ ba thứ tiếng; cỡ chữ không dưới sàn 13px;
 *      đọc được trên MỌI vùng ảnh — kể cả vùng trắng tinh vẫn ≥ 4,5 : 1. Không component nào tự viết
 *      <img> trỏ vào /anh/.
 *   5. Bốn quyết định của Khánh: hai dải tối còn nguyên; câu chính đúng từng chữ ở ba thứ tiếng;
 *      trang chủ đủ bảy khối theo thứ tự (khối thứ tám là chân trang của layout); hai ảnh bữa ăn ở
 *      đúng khối; chỗ của ảnh chụp thật vẫn là KhungAnh.
 *   6. Thẻ "Cách đọc nhãn khay": năm trường theo thứ tự, chỉ tên trường — không giá trị mẫu, không
 *      mã vạch giả; không nghiêng, không bóng đổ, không mã màu viết thẳng (nền lấy từ bảng màu).
 *   7. Ảnh món của trang Thực đơn (cuốn menu bản sáng Khánh chốt 11/10/2026, 26 ảnh): đều là ảnh minh
 *      họa (kể cả ba ly signature và hai món tartare lấy từ menu chuẩn 29/09 — chưa rõ ảnh chụp thật hay
 *      ảnh dựng); nguồn ghi đúng sự thật; ảnh tách nền khai "tach_nen" (không cắt, chừa dải trống ở đáy
 *      cho nhãn); ANH_CUA_MON ghép đúng mã món của bảng danh mục với ảnh và khung đã dựng; chỉ
 *      ThucDonNhomAnh.astro gọi <Anh> bằng id lấy từ bảng đó. Mỗi ảnh món ăn có thêm khung "gon" của
 *      ảnh nhỏ 128px trong hàng món gọn trên điện thoại (13/10/2026): món tách nền 1:1 với dải đáy đủ
 *      cho nhãn một dòng (≥ 18 %), tartare 4:5 cắt sát đáy ảnh; ly signature không có khung gọn.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web');
const SRC = join(WEB, 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const { DANH_MUC_ANH } = await nap('anh.ts');
const { ANH_TAO_SAN } = await nap('anh-tao-san.ts');
const { chu, NGON_NGU } = await nap('chu.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');

const { ok: ghi, nhom, ketThuc } = taoBoDem('BEEFTOWN — ẢNH, NHÃN "ẢNH MINH HỌA", THẺ ĐỌC NHÃN KHAY, BỐ CỤC TRANG CHỦ');
/** Như ok() của kho-chung.mjs, và trả về kết quả để dùng trong điều kiện (ok() gốc không trả gì). */
const ok = (ten, dieuKien, chiTiet = '') => { ghi(ten, !!dieuKien, chiTiet ?? ''); return !!dieuKien; };
const tuGoc = p => relative(GOC, p).split(sep).join('/');
const doc = (...p) => readFileSync(join(...p), 'utf8');
const boChuThichCss = css => css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Khối <style> của một file .astro, đã bỏ chú thích. */
const kieuCua = nguon => boChuThichCss((nguon.match(/<style[^>]*>([\s\S]*?)<\/style>/g) ?? []).join('\n').replace(/<\/?style[^>]*>/g, ''));
/** Phần template của một file .astro: sau khối --- … ---, trước <script> và <style>; đã bỏ chú thích JSX và HTML. */
const mauCua = nguon => nguon.replace(/^---[\s\S]*?\n---/, '').replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
  .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/<!--[\s\S]*?-->/g, '');

// Bảy ảnh ChatGPT tạo ngày 11/10/2026 và 26 ảnh món của cuốn menu bản sáng — chép tay, KHÔNG đọc từ anh.ts:
// thêm, bớt hay đổi cờ của một ảnh AI mà không sửa ở đây thì phép thử đỏ. Thêm ảnh CHỤP THẬT (minhHoa:
// false) thì thêm vào ANH_THAT.
const ANH_CHATGPT = ['hero-vi-gas', 'bo-van-mo-can', 'bo-cat-lat', 'sot-cham', 'mon-an-chia-se', 'bua-an-cung-ban', 'bo-xeo-vi'];
// Ảnh món của cuốn menu bản sáng (artifact "Beeftown — Menu", Version 45, 11/10/2026). Năm ảnh lấy từ menu
// chuẩn 29/09 của quán (ba ly signature, hai món tartare): "ảnh đã duyệt" nhưng CHƯA rõ ảnh chụp thật hay ảnh
// dựng — chưa rõ thì vẫn gắn nhãn minh họa. 21 ảnh còn lại là ảnh AI tạo qua cầu nối Codex rồi tách nền.
const ANH_MON_MENU_CHUAN = ['mon-tartare-bo-hoa-tuyet', 'mon-com-tron-tartare-bo-cay', 'uong-milky-cloud-makgeolli', 'uong-strawberry-crush', 'uong-berry-rouge-highball'];
const ANH_MON = [
  'mon-tartare-bo-hoa-tuyet', 'mon-com-tron-tartare-bo-cay', 'mon-lau-kim-chi', 'mon-lau-bo-bulgogi', 'mon-lau-nam', 'mon-set-4-sot',
  'mon-salad-nam', 'mon-caesar-salad', 'mon-mien-tron-han', 'mon-trung-hap-nui-lua', 'mon-khoai-tay-chien-sot-bo', 'mon-banh-gao-chien-pho-mai',
  'mon-canh-kim-chi', 'mon-dau-phu-ham', 'mon-canh-tuong-dau', 'mon-com-kim-chi-bo', 'mon-com-tron-han', 'mon-com-tron-trung-ca',
  'mon-mi-lanh-cay', 'mon-mi-toowoomba', 'mon-mi-carbonara', 'mon-mi-bo-sot-ca',
  'uong-milky-cloud-makgeolli', 'uong-strawberry-crush', 'uong-berry-rouge-highball', 'uong-khong-con-ba-ly',
];
// Ảnh tách nền: mọi ảnh món trừ hai ảnh tartare (ảnh có nền bàn gỗ, cắt như ảnh cũ).
const TACH_NEN = ANH_MON.filter(id => !['mon-tartare-bo-hoa-tuyet', 'mon-com-tron-tartare-bo-cay'].includes(id));
const ANH_AI = [...ANH_CHATGPT, ...ANH_MON];
const ANH_THAT = [];
// Ảnh đang đặt trên trang và khung của từng ảnh; bo-xeo-vi là ảnh dự phòng, chưa đặt ở đâu nên không dựng.
const ANH_DA_DAT = {
  'hero-vi-gas': ['4x3', '4x5'],
  'bo-van-mo-can': ['4x5', '1x1'],
  'bo-cat-lat': ['3x2'],
  'sot-cham': ['4x3'],
  'mon-an-chia-se': ['3x2', '4x3'],
  'bua-an-cung-ban': ['3x2', '4x3'],
  // Ảnh món: món ăn tách nền 4:3 (thêm 1:1 cho ảnh nhỏ của hàng món gọn trên điện thoại), hai ảnh tartare vuông
  // (thêm 4:5 cắt sát đáy cho hàng gọn), ba ly 4:5, ảnh ba ly không cồn của phần Đồ uống 3:2.
  ...Object.fromEntries(ANH_MON.map(id => [id, id.startsWith('mon-tartare') || id === 'mon-com-tron-tartare-bo-cay' ? ['1x1', '4x5']
    : id === 'uong-khong-con-ba-ly' ? ['3x2'] : id.startsWith('uong-') ? ['4x5'] : ['4x3', '1x1']])),
};
// Cỡ thật của các file gốc (để ngoài repo) — chép tay từ file. Tám PNG của ChatGPT; 26 file của cuốn menu bản sáng.
const CO_GOC = {
  'hero-vi-gas-16x9.png': [1672, 941], 'hero-vi-gas-4x5.png': [1122, 1402], 'bo-van-mo-can-4x5.png': [1122, 1402],
  'bo-cat-lat-3x2.png': [1536, 1024], 'sot-cham-4x3.png': [1448, 1086], 'bo-xeo-vi-4x3.png': [1448, 1086],
  'mon-an-chia-se-3x2.png': [1536, 1024], 'bua-an-cung-ban-3x2.png': [1536, 1024],
  'mon-banh-gao-chien-pho-mai.webp': [760, 768], 'mon-caesar-salad.webp': [1000, 881], 'mon-canh-kim-chi.webp': [1000, 890],
  'mon-canh-tuong-dau.webp': [1000, 913], 'mon-com-kim-chi-bo.webp': [1000, 907], 'mon-com-tron-han.webp': [1000, 894],
  'mon-com-tron-tartare-bo-cay.jpg': [1024, 1656], 'mon-com-tron-trung-ca.webp': [1000, 1004], 'mon-dau-phu-ham.webp': [1000, 884],
  'mon-khoai-tay-chien-sot-bo.webp': [760, 755], 'mon-lau-bo-bulgogi.webp': [1000, 767], 'mon-lau-kim-chi.webp': [1000, 785],
  'mon-lau-nam.webp': [1000, 778], 'mon-mi-bo-sot-ca.webp': [1000, 817], 'mon-mi-carbonara.webp': [1000, 823],
  'mon-mi-lanh-cay.webp': [900, 799], 'mon-mi-toowoomba.webp': [1000, 877], 'mon-mien-tron-han.webp': [1000, 794],
  'mon-salad-nam.webp': [1000, 863], 'mon-set-4-sot.webp': [1000, 610], 'mon-tartare-bo-hoa-tuyet.jpg': [1024, 1656],
  'mon-trung-hap-nui-lua.webp': [760, 752], 'uong-berry-rouge-highball.webp': [479, 756], 'uong-khong-con-ba-ly.png': [1200, 758],
  'uong-milky-cloud-makgeolli.webp': [524, 754], 'uong-strawberry-crush.webp': [449, 920],
};

// ===========================================================================
await nhom('1 · DANH MỤC ẢNH: ĐÚNG 33 ID, CỜ MINH HỌA, ALT BA THỨ TIẾNG TẢ ĐÚNG ẢNH', async () => {
  const idKhai = (doc(SRC, 'lib', 'anh.ts').match(/export\s+type\s+IdAnh\s*=\s*([^;]+);/)?.[1].match(/'([^']+)'/g) ?? []).map(s => s.slice(1, -1));
  const mong = [...ANH_AI, ...ANH_THAT].sort();
  ok(`IdAnh khai đúng ${mong.length} id: ${mong.join(', ')}`, JSON.stringify([...idKhai].sort()) === JSON.stringify(mong), idKhai.join(', '));
  ok('DANH_MUC_ANH có đúng các id đó', JSON.stringify(Object.keys(DANH_MUC_ANH).sort()) === JSON.stringify(mong), Object.keys(DANH_MUC_ANH).join(', '));

  // Chữ của bộ ảnh cũ (tạo ngày 06/10/2026, không còn dùng): ảnh mới không có vỉ gang, hương thảo, muối
  // hạt, đĩa đá, và chỉ có ba chén sốt.
  const CHU_ANH_CU = /vỉ gang|\bgang\b|cast[- ]iron|무쇠|hương thảo|rosemary|로즈메리|muối hạt|coarse salt|굵은 소금|đĩa đá|stone plate|돌 접시|bốn chén|four small|네 가지/iu;
  // Alt tả món: không nói đây là ảnh của quán, không kể tên món phụ (trang không hứa món phụ nào).
  const NOI_LA_CUA_QUAN = /beeftown|tại quán|của quán|nhà hàng|chụp tại|our restaurant|at the restaurant|our (?:table|grill|counter)|매장|저희|우리 (?:가게|매장)/iu;
  const TEN_MON_PHU = /kim ?chi|김치|banchan|반찬|rau trộn|giá đỗ|namul|나물|canh rong biển|seaweed|미역/iu;
  // Than, lửa, khói: Beeftown nướng vỉ gas (THUONG-HIEU.md mục 2). "Hơi" (steam, 김) thì được.
  const THAN_LUA_KHOI = { vi: /(?<![\p{L}])(?:than|lửa|khói|củi)(?![\p{L}])/iu, en: /\b(?:flames?|fire|smok\w*|charcoal|embers?|coals?)\b/i, ko: /불꽃|연기|숯|화로|장작/u };
  const CHU_VIET = /[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
  // Số lượng món: alt không đếm "ba chén sốt", "bốn lát bò"… — set sốt và món thật chưa chốt số loại, ảnh là
  // ảnh minh họa. "Một" / "a" / "한" làm mạo từ ("một bàn tay", "a plate") thì được; "a pair of tongs" là một chiếc kẹp.
  const SO_LUONG = {
    // Tiếng Việt: số đi liền một danh từ đếm món — "chín" (đã chín), "năm" (năm trước), "ba" đứng riêng thì không bắt.
    vi: /\d|(?<![\p{L}])(?:hai|ba|bốn|năm|sáu|bảy|tám|chín|mười)\s+(?:chén|đĩa|dĩa|bát|tô|lát|miếng|món|loại|phần|khay|ly|cốc|vị|thứ|chiếc|cái)(?![\p{L}])/iu,
    en: /\d|\b(?:two|three|four|five|six|seven|eight|nine|ten|dozen|trio)\b/i,
    ko: /\d|(?<![가-힣])(?:두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s?(?:가지|개|접시|그릇|종지|종류|장|점|조각|잔|병)/u,
  };

  for (const id of mong) {
    const mt = DANH_MUC_ANH[id];
    if (!ok(`${id}: có trong danh mục`, !!mt)) continue;
    ok(`${id}: ${ANH_AI.includes(id) ? 'ảnh AI → minhHoa: true (trang tự gắn "Ảnh minh họa")' : 'ảnh chụp thật → minhHoa: false'}`,
       mt.minhHoa === ANH_AI.includes(id), `minhHoa = ${mt.minhHoa}`);
    for (const nn of NGON_NGU) {
      const a = mt.alt?.[nn];
      const ten = `${id} [${nn}]`;
      if (!ok(`${ten}: có alt, dài 30–220 ký tự, kết thúc bằng dấu chấm`, typeof a === 'string' && a.length >= 30 && a.length <= 220 && a.trim() === a && a.endsWith('.'), JSON.stringify(a))) continue;
      ok(`${ten}: không còn chữ của bộ ảnh cũ (vỉ gang, hương thảo, muối hạt, đĩa đá, bốn chén sốt)`, !CHU_ANH_CU.test(a), a.match(CHU_ANH_CU)?.[0]);
      ok(`${ten}: không chữ cấm`, timChuoiCam(a).length === 0, timChuoiCam(a).map(c => c.tim_thay).join(' | '));
      ok(`${ten}: tả món — không nói đây là ảnh của quán`, !NOI_LA_CUA_QUAN.test(a), a.match(NOI_LA_CUA_QUAN)?.[0]);
      ok(`${ten}: không kể tên món phụ nào (trang không hứa món phụ)`, !TEN_MON_PHU.test(a), a.match(TEN_MON_PHU)?.[0]);
      ok(`${ten}: không chữ về than, lửa, khói`, !THAN_LUA_KHOI[nn].test(a), a.match(THAN_LUA_KHOI[nn])?.[0]);
      ok(`${ten}: không ghi số lượng món (ba chén, bốn lát…) — món và set sốt thật chưa chốt số loại`, !SO_LUONG[nn].test(a), a.match(SO_LUONG[nn])?.[0]);
    }
    ok(`${id}: alt tiếng Anh không lẫn chữ Việt; alt tiếng Hàn là chữ Hàn, văn 해요체 (kết thúc "요.")`,
       !CHU_VIET.test(mt.alt?.en ?? 'ă') && /[가-힣]/.test(mt.alt?.ko ?? '') && /요\.$/.test(mt.alt?.ko ?? '') && !CHU_VIET.test(mt.alt?.ko ?? 'ă'),
       `${mt.alt?.en} · ${mt.alt?.ko}`);
  }
  // Phép dò phải thật sự bắt được chữ sai — thử ngay trên các alt của bộ ảnh cũ.
  const ALT_CU = ['Những lát bò có vân mỡ được gắp lên vỉ gang đặt trên bếp gas giữa bàn, bên cạnh chén sốt và rau.',
    'Close-up of a raw beef cut with fine white marbling, beside rosemary and coarse salt.', '어두운 돌 접시 위에 가지런히 놓인 얇은 마블링 소고기.',
    'Bốn chén sốt chấm nhỏ, rau xanh và kimchi đặt cạnh vỉ nướng.', '무쇠 그릴 위에서 노릇하게 익어 가는 소고기와 피어오르는 김.'];
  ok(`Phép dò chữ của bộ ảnh cũ bắt được cả ${ALT_CU.length} alt cũ`, ALT_CU.every(a => CHU_ANH_CU.test(a)), ALT_CU.filter(a => !CHU_ANH_CU.test(a)).join(' | '));
  ok('Phép dò số lượng món bắt được "Ba chén sốt", "năm lát bò", "Three small bowls", "소스 세 가지"; không bắt nhầm "Một bàn tay", "đang chín", "năm trước", "a pair of tongs", "한 덩이"',
     SO_LUONG.vi.test('Ba chén sốt chấm đặt trước đĩa bò.') && SO_LUONG.vi.test('năm lát bò') && SO_LUONG.en.test('Three small bowls of dipping sauce.') && SO_LUONG.ko.test('접시 앞에 소스 세 가지가 놓여 있어요.')
       && SO_LUONG.ko.test('소스 3종') && !SO_LUONG.vi.test('Một bàn tay cầm kẹp, lát bò đang chín trên vỉ, như năm trước.') && !SO_LUONG.en.test('A plate, with a pair of tongs beside it.') && !SO_LUONG.ko.test('두툼한 생 소고기 한 덩이, 자세히 보여요.'));
  ok('Phép dò than, lửa, khói không bắt nhầm "then", "than" tiếng Anh, "thang", "hơi nóng"',
     !THAN_LUA_KHOI.en.test('then enjoy it, rather than wait') && !THAN_LUA_KHOI.vi.test('đi thang máy, một làn hơi nóng') && THAN_LUA_KHOI.vi.test('nướng than') && THAN_LUA_KHOI.en.test('over an open flame'));
});

// ===========================================================================
const danhSach = JSON.parse(doc(WEB, 'cong-cu', 'anh', 'danh-sach.json'));
const KHUNG = { '16x9': [16, 9], '4x5': [4, 5], '3x2': [3, 2], '4x3': [4, 3], '1x1': [1, 1] };
/** Bề rộng vùng cắt của một khung trên ảnh gốc — cùng công thức với vung_cat() của tao-co-anh.py. */
const rongVungCat = ([rongGoc, caoGoc], [rx, ry]) => (rongGoc * ry > caoGoc * rx ? caoGoc * rx / ry : rongGoc);

await nhom('2 · danh-sach.json: NGUỒN ĐÚNG SỰ THẬT, KHÔNG PHÓNG TO ẢNH GỐC', async () => {
  const daDat = Object.keys(danhSach.anh ?? {});
  const duPhong = Object.keys(danhSach.du_phong ?? {});
  ok(`Mục "anh" (dựng cỡ) là đúng ${Object.keys(ANH_DA_DAT).length} ảnh đang đặt trên trang`,
     JSON.stringify([...daDat].sort()) === JSON.stringify(Object.keys(ANH_DA_DAT).sort()), daDat.join(', '));
  ok('Mục "du_phong" (không dựng cỡ) giữ ảnh chưa đặt ở trang nào: bo-xeo-vi', JSON.stringify(duPhong) === JSON.stringify(['bo-xeo-vi']), duPhong.join(', '));
  ok('Hai mục cộng lại là đủ mọi id của danh mục, không id nào nằm ở cả hai',
     JSON.stringify([...daDat, ...duPhong].sort()) === JSON.stringify(Object.keys(DANH_MUC_ANH).sort()) && !daDat.some(i => duPhong.includes(i)));

  const nguyenVan = doc(WEB, 'cong-cu', 'anh', 'danh-sach.json');
  ok('Không còn dấu vết của nguồn cũ: tên công cụ cũ, tên mô hình, job id dạng UUID',
     !/higgsfield|nano_banana|ung_vien|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(nguyenVan),
     nguyenVan.match(/higgsfield|nano_banana|ung_vien|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0]);
  for (const [id, mt] of [...Object.entries(danhSach.anh ?? {}), ...Object.entries(danhSach.du_phong ?? {})]) {
    const nguon = `${mt.nguon?.tu ?? ''} · ${mt.nguon?.cong_cu ?? ''}`;
    if (!ANH_MON.includes(id)) {
      ok(`${id}: nguồn ghi ChatGPT (qua Codex), tạo ngày 11/10/2026; có mô tả`,
         /ChatGPT/.test(mt.nguon?.cong_cu ?? '') && /Codex/.test(mt.nguon?.cong_cu ?? '') && /11\/10\/2026/.test(mt.nguon?.cong_cu ?? '')
           && typeof mt.mo_ta === 'string' && mt.mo_ta.length > 20, JSON.stringify(mt.nguon));
    } else {
      // Ảnh món: lấy từ cuốn menu bản sáng; không nhận vơ công cụ (không ghi ChatGPT — không ai nói ảnh món do ChatGPT tạo).
      ok(`${id}: nguồn ghi artifact "Beeftown — Menu" (cuốn C nền sáng, Version 45, 11/10/2026); có mô tả`,
         /Beeftown — Menu/.test(nguon) && /Version 45/.test(nguon) && /11\/10\/2026/.test(nguon) && !/ChatGPT/.test(nguon)
           && typeof mt.mo_ta === 'string' && mt.mo_ta.length > 20, JSON.stringify(mt.nguon));
      ok(ANH_MON_MENU_CHUAN.includes(id)
        ? `${id}: nguồn ghi đúng "lấy từ menu chuẩn 29/09 của quán", CHƯA rõ ảnh chụp thật hay ảnh dựng`
        : `${id}: nguồn ghi đúng "ảnh AI tạo qua cầu nối Codex ngày 09–11/10/2026", rồi tách nền`,
         ANH_MON_MENU_CHUAN.includes(id) ? /menu chuẩn 29\/09/.test(nguon) && /CHƯA rõ/.test(nguon)
           : /ảnh AI/.test(nguon) && /Codex/.test(nguon) && /09–11\/10\/2026/.test(nguon) && /tách nền/.test(nguon),
         mt.nguon?.cong_cu);
    }
    ok(`${id}: mô tả không còn chữ của bộ ảnh cũ`, !/vỉ gang|hương thảo|muối hạt|đĩa đá|bốn chén/iu.test(mt.mo_ta ?? ''), mt.mo_ta);
    const tachNen = mt.tach_nen;
    ok(`${id}: ${TACH_NEN.includes(id) ? 'khai "tach_nen" (ảnh tách nền: không cắt, đặt vào khung, chừa dải trống ở đáy cho nhãn)' : 'không khai "tach_nen" (ảnh có nền: cắt theo khung)'}`,
       TACH_NEN.includes(id) === !!tachNen, JSON.stringify(tachNen));
    for (const [tenKhung, k] of Object.entries(mt.khung ?? {})) {
      const goc = k.goc ?? mt.goc;
      const co = CO_GOC[goc];
      const noi = `${id} / ${tenKhung}`;
      const tenDung = ANH_MON.includes(id) ? new RegExp(`^${id}\\.(?:webp|png|jpg)$`).test(goc) : goc.startsWith(`${id}-`);
      if (!ok(`${noi}: file gốc ${goc} là một trong các ảnh đã biết cỡ, tên đúng quy ước (<id>-<khung>.png; ảnh của cuốn: <id>.webp/.png/.jpg)`,
              !!co && tenDung && !!KHUNG[tenKhung], goc)) continue;
      if (tachNen) {
        // Khung có thể khai "tach_nen" riêng (le, duoi) đè lên mục chung — như tao-co-anh.py (tach_nen_cua_khung).
        const tachNenKhung = { ...tachNen, ...(k.tach_nen ?? {}) };
        ok(`${noi}: "tach_nen" riêng của khung (nếu có) chỉ khai le, duoi`,
           k.tach_nen === undefined || (typeof k.tach_nen === 'object' && Object.keys(k.tach_nen).length > 0
             && Object.keys(k.tach_nen).every(x => x === 'le' || x === 'duoi')), JSON.stringify(k.tach_nen));
        // Ảnh tách nền không cắt: khung dựng quanh phần có hình, đúng cỡ điểm ảnh của ảnh gốc. Phần có hình không
        // lớn hơn ảnh gốc, nên khung không bao giờ rộng hơn khung dựng quanh CẢ ảnh gốc — bề rộng xuất vượt mức
        // đó là phóng to. (tao-co-anh.py còn kiểm sát hơn, theo đúng phần có hình.)
        const [rx, ry] = KHUNG[tenKhung];
        const rongToiDa = Math.ceil(Math.max(co[0] / (1 - 2 * tachNenKhung.le), co[1] / (1 - tachNenKhung.le - tachNenKhung.duoi) * rx / ry));
        ok(`${noi}: bề rộng lớn nhất ${Math.max(...k.rong)}px không vượt khung dựng quanh ảnh gốc (${rongToiDa}px) — không phóng to`,
           Array.isArray(k.rong) && k.rong.length >= 2 && Math.max(...k.rong) <= rongToiDa, JSON.stringify(k.rong));
        ok(`${noi}: ảnh tách nền không có điểm lấy nét (không cắt)`, k.fx === undefined && k.fy === undefined);
        // Dải trống ở đáy đủ chỗ cho nhãn: nhãn cao ~24px (chữ 13px, dòng 1,4, đệm 3px) và khung nhỏ nhất trên trang
        // rộng ~250px (thẻ hai cột ở màn 600px; ly signature ~170px khung 4:5) → dải ≥ 12 % chiều cao khung.
        ok(`${noi}: dải trống ở đáy (duoi ${tachNenKhung.duoi}) ≥ 12 % chiều cao khung — nhãn "Ảnh minh họa" nằm dưới món, không đè lên món`,
           tachNenKhung.duoi >= 0.12 && tachNenKhung.le >= 0 && tachNenKhung.le <= 0.1, JSON.stringify(tachNenKhung));
      } else {
        const rongCat = Math.floor(rongVungCat(co, KHUNG[tenKhung]));
        ok(`${noi}: bề rộng lớn nhất ${Math.max(...k.rong)}px không vượt vùng cắt ${rongCat}px của ảnh gốc (không phóng to)`,
           Array.isArray(k.rong) && k.rong.length >= 2 && Math.max(...k.rong) <= rongCat, JSON.stringify(k.rong));
        ok(`${noi}: điểm lấy nét fx, fy nằm trong 0..1`, [k.fx ?? 0.5, k.fy ?? 0.5].every(v => typeof v === 'number' && v >= 0 && v <= 1), `${k.fx}, ${k.fy}`);
      }
    }
  }
  for (const [id, cacKhung] of Object.entries(ANH_DA_DAT)) {
    ok(`${id}: danh-sach.json khai đúng các khung ${cacKhung.join(', ')}`,
       JSON.stringify(Object.keys(danhSach.anh?.[id]?.khung ?? {}).sort()) === JSON.stringify([...cacKhung].sort()), Object.keys(danhSach.anh?.[id]?.khung ?? {}).join(', '));
  }
});

// ===========================================================================
// File công khai: mọi .astro ngoài khu nội bộ (cùng danh sách với test-cong-khai-giao-dien.mjs).
const NOI_BO = ['pages/noi-bo/', 'components/kho/', 'layouts/Kho.astro', 'layouts/NoiBo.astro',
  'components/SucKhoeHeThong.astro', 'components/BanDoChucNang.astro', 'components/OTimChucNang.astro'];
const moiAstro = thu => readdirSync(join(SRC, thu), { withFileTypes: true }).flatMap(d => {
  const duong = thu ? `${thu}/${d.name}` : d.name;
  return d.isDirectory() ? moiAstro(duong) : d.name.endsWith('.astro') ? [duong] : [];
});
const congKhai = moiAstro('').filter(f => !NOI_BO.some(n => f.startsWith(n)));
/** Mọi chỗ gọi <Anh …> trong một file: { id, khung, khungNho, uuTien } — và idDong / khungDong khi id, khung
 *  là biểu thức ({anh.id}) thay vì chữ thẳng (chỉ ảnh món, lấy từ ANH_CUA_MON). */
function choGoiAnh(nguon) {
  return [...mauCua(nguon).matchAll(/<Anh\b([\s\S]*?)\/>/g)].map(m => {
    const tt = ten => m[1].match(new RegExp(`\\b${ten}="([^"]*)"`))?.[1] ?? null;
    const dong = ten => m[1].match(new RegExp(`\\b${ten}=\\{([^}]*)\\}`))?.[1] ?? null;
    return { id: tt('id'), khung: tt('khung'), khungNho: tt('khungNho'), uuTien: /\buuTien\b/.test(m[1]), thayBang: tt('thayBang'),
             idDong: dong('id'), khungDong: dong('khung'), khungNhoDong: dong('khungNho') };
  });
}
const goiAnh = congKhai.flatMap(f => choGoiAnh(doc(SRC, f)).map(g => ({ ...g, file: f })));
// Ảnh món: ThucDonNhomAnh.astro gọi <Anh id={anh.id} khung={anh.khung}> với anh = ANH_CUA_MON[mã món].
const { ANH_CUA_MON } = await nap('anh.ts');
const goiAnhChuThang = goiAnh.filter(g => !g.idDong && !g.khungDong);
const goiAnhMon = goiAnh.filter(g => g.idDong || g.khungDong);

await nhom('3 · ẢNH ĐÃ DỰNG KHỚP VỚI CHỖ DÙNG; KHÔNG ẢNH CHẾT, KHÔNG PNG GỐC', async () => {
  ok(`Trang công khai gọi <Anh> ở ${goiAnhChuThang.length} chỗ ghi id và khung bằng chữ thẳng (kiểm được)`,
     goiAnhChuThang.length >= 7 && goiAnhChuThang.every(g => g.id && g.khung), goiAnhChuThang.filter(g => !g.id || !g.khung).map(g => g.file).join(', '));
  // Chỗ gọi bằng biểu thức chỉ được là ảnh món: trong ThucDonNhomAnh.astro, id và khung lấy cùng một mục của
  // ANH_CUA_MON (anh.id / anh.khung), khungNho (nếu có) là khung gọn của chính mục đó ({… ? anh.gon : undefined})
  // — nhờ vậy khung của ảnh món đọc được từ ANH_CUA_MON.
  const khungGonDung = g => g.khungNhoDong === null
    || new RegExp(`^[\\w!.?&| ]+ \\? ${g.idDong.replace(/\.id$/, '')}\\.gon : undefined$`).test(g.khungNhoDong);
  ok(`Chỉ ThucDonNhomAnh.astro gọi <Anh> bằng biểu thức, và chỉ dạng id={x.id} khung={x.khung} [khungNho={… ? x.gon : undefined}] (${goiAnhMon.length} chỗ)`,
     goiAnhMon.length >= 1 && goiAnhMon.every(g => g.file === 'components/ThucDonNhomAnh.astro' && /^\w+\.id$/.test(g.idDong ?? '')
       && g.khungDong === g.idDong.replace(/\.id$/, '.khung') && !g.khungNho && khungGonDung(g))
       && /import \{ ANH_CUA_MON \} from '\.\.\/lib\/anh'/.test(doc(SRC, 'components', 'ThucDonNhomAnh.astro')),
     goiAnhMon.map(g => `${g.file}: id={${g.idDong}} khung={${g.khungDong}} khungNho={${g.khungNhoDong}}`).join(' | '));
  const coGon = goiAnhMon.some(g => g.khungNhoDong !== null);
  const dung = new Set([
    ...goiAnhChuThang.flatMap(g => [`${g.id} ${g.khung}`, ...(g.khungNho ? [`${g.id} ${g.khungNho}`] : [])]),
    ...(goiAnhMon.length ? Object.values(ANH_CUA_MON).map(a => `${a.id} ${a.khung}`) : []),
    ...(coGon ? Object.values(ANH_CUA_MON).filter(a => a.gon).map(a => `${a.id} ${a.gon}`) : []),
  ]);
  const daDung = new Set(Object.entries(ANH_TAO_SAN).flatMap(([id, k]) => Object.keys(k).map(ten => `${id} ${ten}`)));
  const chuaDung = [...dung].filter(d => !daDung.has(d));
  const chet = [...daDung].filter(d => !dung.has(d));
  ok(`Khung nào component gọi thì đã dựng cỡ (${dung.size} khung) — không chỗ nào rơi về khung đồ họa`, chuaDung.length === 0, chuaDung.join(' | '));
  ok(`Khung nào đã dựng thì có component gọi (${daDung.size} khung) — không file ảnh chết trong repo`, daDung.size > 0 && chet.length === 0, chet.join(' | '));
  const mong = Object.entries(ANH_DA_DAT).flatMap(([id, k]) => k.map(ten => `${id} ${ten}`)).sort();
  ok('anh-tao-san.ts có đúng các ảnh và khung đang đặt trên trang', JSON.stringify([...daDung].sort()) === JSON.stringify(mong), [...daDung].sort().join(' | '));
  for (const [id, cacKhung] of Object.entries(ANH_TAO_SAN)) for (const [ten, co] of Object.entries(cacKhung)) {
    const [rx, ry] = KHUNG[ten] ?? [0, 1];
    ok(`${id} ${ten}: cỡ ${co.rong} × ${co.cao} đúng tỷ lệ khung, bề rộng lớn nhất là cỡ cuối trong danh sách`,
       Math.abs(co.cao - co.rong * ry / rx) <= 1 && co.rong === co.cac.at(-1) && co.cac.length >= 2, JSON.stringify(co));
  }
  const tep = existsSync(join(WEB, 'public', 'anh')) ? readdirSync(join(WEB, 'public', 'anh')) : [];
  const la = tep.filter(f => !/\.(avif|webp)$/.test(f));
  ok(`web/public/anh chỉ có .avif và .webp (${tep.length} file) — không PNG gốc, không file tạm`, tep.length > 0 && la.length === 0, la.join(', '));
  const gitPng = execFileSync('git', ['ls-files', '-co', '--exclude-standard', 'web/public/anh', 'web/cong-cu/anh'], { cwd: GOC, encoding: 'utf8' })
    .split('\n').filter(f => /\.(png|jpe?g)$/i.test(f));
  ok('Git không thấy ảnh gốc (PNG, JPG) nào trong web/public/anh và web/cong-cu/anh', gitPng.length === 0, gitPng.join(', '));
});

// ===========================================================================
/** Độ sáng tương đối và tỷ lệ tương phản theo WCAG 2.2; màu là [r, g, b] 0–255. */
const doSang = ([r, g, b]) => {
  const k = [r, g, b].map(v => v / 255).map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
};
const tuongPhan = (a, b) => { const [s, t] = [doSang(a), doSang(b)].sort((x, y) => y - x); return (s + 0.05) / (t + 0.05); };
const TRANG = [255, 255, 255], DEN = [0, 0, 0], NEN_NHAT = [244, 244, 244];   // bảng 22/10/2026: --kem, --than, --kem-sau

await nhom('4 · NHÃN "ẢNH MINH HỌA": TỰ GẮN, ĐỦ BA THỨ TIẾNG, ĐỌC ĐƯỢC TRÊN MỌI VÙNG ẢNH', async () => {
  const anh = doc(SRC, 'components', 'Anh.astro');
  ok('Anh.astro: ảnh minh họa thì luôn có <figcaption class="chu-thich-anh"> ngay trong <figure> của ảnh',
     /\{minhHoa && <figcaption class="chu-thich-anh">\{t\.anhMinhHoa\}<\/figcaption>\}/.test(anh) && /const minhHoa = DANH_MUC_ANH\[id\]\.minhHoa;/.test(anh));
  ok('Nhãn đủ ba thứ tiếng: "Ảnh minh họa" · "Illustrative image" · "연출 이미지"',
     chu('vi').anhMinhHoa === 'Ảnh minh họa' && chu('en').anhMinhHoa === 'Illustrative image' && chu('ko').anhMinhHoa === '연출 이미지',
     NGON_NGU.map(nn => chu(nn).anhMinhHoa).join(' · '));

  const ck = boChuThichCss(doc(SRC, 'styles', 'cong-khai.css'));
  const nhan = ck.match(/\.ck \.chu-thich-anh\s*\{([^}]*)\}/)?.[1] ?? '';
  const co = nhan.match(/font-size:\s*(?:(\d+)px|var\(--co-(ti|nho)\))/);
  const coPx = co ? (co[1] ? Number(co[1]) : co[2] === 'ti' ? 13 : 14) : 0;
  ok(`Nhãn: cỡ chữ ${coPx}px — không dưới sàn 13px của trang công khai`, coPx >= 13, nhan.trim().replace(/\s+/g, ' '));
  const nen = nhan.match(/background:\s*rgba\(\s*0,\s*0,\s*0,\s*(0?\.\d+|1)\s*\)/);
  const doDuc = nen ? Number(nen[1]) : 0;
  ok('Nhãn: chữ trắng trên nền đen có độ trong (màu của bảng), nằm tuyệt đối trong khung ảnh',
     /color:\s*var\(--kem\)/.test(nhan) && !!nen && /position:\s*absolute/.test(nhan), nhan.trim().replace(/\s+/g, ' '));
  // Vùng ảnh phía sau nhãn có thể sáng tới đâu cũng được — tệ nhất là trắng tinh. Nền nhãn pha lên vùng đó:
  const tren = mau => DEN.map((v, i) => v * doDuc + mau[i] * (1 - doDuc));
  const [trenTrang, trenXam] = [tuongPhan(TRANG, tren(TRANG)), tuongPhan(TRANG, tren(NEN_NHAT))];
  ok(`Nhãn đọc được trên mọi vùng ảnh: trên vùng trắng tinh ${trenTrang.toFixed(2).replace('.', ',')} : 1, trên vùng xám nhạt F4 ${trenXam.toFixed(2).replace('.', ',')} : 1 (cần ≥ 4,5 : 1)`,
     trenTrang >= 4.5 && trenXam >= 4.5, `độ đục của nền nhãn: ${doDuc}`);

  const tuViet = congKhai.filter(f => f !== 'components/Anh.astro' && /["'`(]\/anh\//.test(mauCua(doc(SRC, f))));
  ok('Không component công khai nào tự viết đường dẫn /anh/… — ảnh chỉ đi qua <Anh> (nhãn không thể bị quên)', tuViet.length === 0, tuViet.join(', '));
  ok('Anh.astro: ảnh ưu tiên tải ngay (eager, fetchpriority="high"), mọi ảnh khác lazy; luôn có width, height, alt',
     /loading=\{uuTien \? 'eager' : 'lazy'\}/.test(anh) && /fetchpriority=\{uuTien \? 'high' : 'auto'\}/.test(anh)
       && /width=\{lon\.rong\}/.test(anh) && /height=\{lon\.cao\}/.test(anh) && /alt=\{altAnh\(id, ngonNgu\)\}/.test(anh));
  const uuTien = goiAnh.filter(g => g.uuTien);
  ok('Chỉ một chỗ gọi ảnh ưu tiên (uuTien): ảnh màn đầu trang chủ, hero-vi-gas trong KhoiMoDau.astro',
     uuTien.length === 1 && uuTien[0].id === 'hero-vi-gas' && uuTien[0].file === 'components/KhoiMoDau.astro', uuTien.map(g => `${g.file}: ${g.id}`).join(' | '));
});

// ===========================================================================
await nhom('5 · BỐN QUYẾT ĐỊNH CỦA KHÁNH (11/10/2026): DẢI TỐI, CÂU CHÍNH, THỨ TỰ KHỐI, HAI ẢNH BỮA ĂN', async () => {
  const lopCua = (file, mauMo) => mauCua(doc(SRC, 'components', file)).match(mauMo)?.[1] ?? '';
  const quay = lopCua('QuayChonBo.astro', /<section class="([^"]*)"[^>]*aria-labelledby="qcb-tieu-de"/);
  ok('Trang chủ, "Quầy chọn bò": vẫn là dải tối (be-toi)', /\bbe-toi\b/.test(quay) && !/\bbe-kem/.test(quay), quay);
  const boTaiQuay = lopCua('TrangThucDon.astro', /<section id="bo-tai-quay" class="([^"]*)"/);
  ok('Thực đơn, "Bò tại quầy": vẫn là dải tối (be-toi)', /\bbe-toi\b/.test(boTaiQuay) && !/\bbe-kem/.test(boTaiQuay), boTaiQuay);
  ok('"Cả bữa" vẫn bề mặt be-kem-dam (nền xám nhạt F4), "Rủ cả nhà" vẫn dải đỏ — tỷ lệ màu của trang giữ như đang chạy',
     /\bbe-kem-dam\b/.test(lopCua('BuaAnCungNhau.astro', /<section class="([^"]*)"[^>]*aria-labelledby="bacn-tieu-de"/))
       && /\bbe-do\b/.test(lopCua('DiCungNhom.astro', /<section class="([^"]*)"[^>]*aria-labelledby="dcn-tieu-de"/)));
  // Bảng 22/10/2026, nền trang trắng, đen làm điểm nhấn (QĐ4 ngày 25/10/2026): đầu trang và cả hai dải chân trang là
  // bề mặt đen — chữ, nút, vòng focus đổi theo biến của bề mặt, không viết màu riêng.
  const dauTrang = mauCua(doc(SRC, 'components', 'DauTrang.astro')).match(/<header class="([^"]*)"/)?.[1] ?? '';
  const chanTrang = mauCua(doc(SRC, 'components', 'ChanTrang.astro'));
  const [ctChinh, ctDay] = [/<div class="(ct-chinh[^"]*)"/, /<div class="(ct-day[^"]*)"/].map(m => chanTrang.match(m)?.[1] ?? '');
  ok('Đầu trang (DauTrang.astro) và hai dải chân trang (ChanTrang.astro: ct-chinh, ct-day) là bề mặt đen be-toi',
     [dauTrang, ctChinh, ctDay].every(l => /\bbe-toi\b/.test(l) && !/\bbe-(?:do|kem)/.test(l)), `${dauTrang} · ${ctChinh} · ${ctDay}`);

  // Câu chính — chép tay, kể cả dấu cách không ngắt ( ) đang giữ "bạn thích", "cả bàn" trên một dòng.
  const CAU_CHINH = {
    vi: 'Chọn phần bò bạn thích, rồi cùng cả bàn thưởng thức.',
    en: 'Pick the cut you like, then enjoy it with the whole table.',
    ko: '좋아하는 부위를 고르고, 함께 온 사람들과 즐겨 보세요.',
  };
  for (const nn of NGON_NGU) ok(`[${nn}] Câu chính của trang chủ giữ nguyên từng chữ: "${CAU_CHINH[nn].replaceAll(' ', ' ')}"`, chu(nn).cauChinh === CAU_CHINH[nn], chu(nn).cauChinh);
  ok('KhoiMoDau.astro: câu chính là <h1> của trang chủ', /<h1 id="kmd-tieu-de">\{t\.cauChinh\}<\/h1>/.test(doc(SRC, 'components', 'KhoiMoDau.astro')));
  // Tagline có ở hai khối liền nhau: dải đỏ dưới ảnh màn đầu (để nhìn) và dòng hiệu của khối ba bước (để đọc).
  // Trình đọc màn hình chỉ đọc MỘT lần: dải dưới ảnh là aria-hidden, dòng hiệu của ba bước thì không.
  const theKhauHieu = mauCua(doc(SRC, 'components', 'KhoiMoDau.astro')).match(/<p\b[^>]*class="kmd-khau-hieu"[^>]*>/)?.[0] ?? '';
  const baBuoc = mauCua(doc(SRC, 'components', 'BaBuoc.astro'));
  ok('KhoiMoDau.astro: dải tagline dưới ảnh có aria-hidden="true" và lang="en" — mắt thấy, trình đọc màn hình không đọc lần thứ hai',
     /\baria-hidden="true"/.test(theKhauHieu) && /\blang="en"/.test(theKhauHieu), theKhauHieu || 'không thấy <p class="kmd-khau-hieu">');
  ok('BaBuoc.astro: dòng hiệu đọc tagline (THUONG_HIEU.khauHieu, lang="en"), không aria-hidden — đây là lần đọc duy nhất',
     /<p class="hieu"><span lang="en">\{THUONG_HIEU\.khauHieu\}<\/span><\/p>/.test(baBuoc));

  const trangChu = mauCua(doc(SRC, 'components', 'TrangRaMat.astro'));
  const thuTu = [...trangChu.matchAll(/<(KhoiMoDau|BaBuoc|QuayChonBo|BuaAnCungNhau|DiCungNhom|LenTang3|CauHoi)\b/g)].map(m => m[1]);
  ok('Trang chủ đủ bảy khối theo thứ tự: màn đầu → ba bước → quầy chọn bò → cả bữa → đi nhóm → tầng 3 → câu hỏi (khối thứ tám là chân trang)',
     thuTu.join(' ') === 'KhoiMoDau BaBuoc QuayChonBo BuaAnCungNhau DiCungNhom LenTang3 CauHoi', thuTu.join(' '));

  const o = (id, file) => goiAnh.some(g => g.id === id && g.file === `components/${file}`);
  ok('Ảnh bữa ăn mon-an-chia-se ở khối "Cả bữa, cho cả bàn" (BuaAnCungNhau.astro)', o('mon-an-chia-se', 'BuaAnCungNhau.astro'));
  ok('Ảnh bữa ăn bua-an-cung-ban ở khối "Rủ cả nhà, cả nhóm cùng đến" (DiCungNhom.astro), thay hình vẽ bàn nướng',
     o('bua-an-cung-ban', 'DiCungNhom.astro') && !/<KhungAnh\b/.test(mauCua(doc(SRC, 'components', 'DiCungNhom.astro'))));
  ok('hero-vi-gas ở màn đầu, bo-van-mo-can ở Quầy chọn bò; bo-cat-lat, sot-cham và uong-khong-con-ba-ly ở trang Thực đơn',
     o('hero-vi-gas', 'KhoiMoDau.astro') && o('bo-van-mo-can', 'QuayChonBo.astro') && o('bo-cat-lat', 'TrangThucDon.astro') && o('sot-cham', 'TrangThucDon.astro')
       && o('uong-khong-con-ba-ly', 'TrangThucDon.astro'));

  // Ảnh AI không bao giờ thay cho ảnh chụp thật: đường đến, thang máy, quầy vẫn là khung đồ họa.
  const den = mauCua(doc(SRC, 'components', 'TrangDenBeeftown.astro'));
  ok('Đến Beeftown: lối vào, thang máy, quầy vẫn là <KhungAnh> — không ảnh AI nào ở đó',
     ['loi-vao', 'thang-may', 'quay'].every(l => new RegExp(`<KhungAnh\\b[^>]*loai="${l}"`).test(den)) && !/<Anh\b/.test(den));
  const ngoaiHaiTrang = goiAnh.filter(g => !['KhoiMoDau', 'QuayChonBo', 'BuaAnCungNhau', 'DiCungNhom', 'TrangThucDon', 'ThucDonNhomAnh'].some(c => g.file === `components/${c}.astro`));
  ok('Ảnh AI chỉ nằm ở trang chủ và trang Thực đơn', ngoaiHaiTrang.length === 0, ngoaiHaiTrang.map(g => `${g.file}: ${g.id}`).join(' | '));
  ok('Chỗ của ảnh AI khi chưa dựng cỡ không bao giờ là hình quầy, lối vào hay thang máy (thayBang chỉ khay / ban-nuong)',
     goiAnh.every(g => [null, 'khay', 'ban-nuong'].includes(g.thayBang)), goiAnh.map(g => g.thayBang).join(', '));
});

// ===========================================================================
await nhom('6 · THẺ "CÁCH ĐỌC NHÃN KHAY": NĂM TRƯỜNG THEO THỨ TỰ, KHÔNG GIÁ TRỊ MẪU, THẲNG, PHẲNG', async () => {
  const nguon = doc(SRC, 'components', 'NhanKhay.astro');
  const mau = mauCua(nguon);
  const kieu = kieuCua(nguon);
  ok('Năm trường đọc theo thứ tự: tên phần cắt → giá mỗi 100g → trọng lượng → giá cuối → ngày đóng gói',
     /const KHOA = \['ten', 'gia100', 'can', 'giaCuoi', 'ngay'\] as const;/.test(nguon));
  // Tên trường — chép tay ở ba thứ tiếng (câu chữ đã duyệt, không đổi trong PR này).
  const TRUONG = [
    ['ten', 'Tên phần cắt', 'Cut', '부위'], ['gia100', 'Giá / 100g', 'Price / 100g', '100g당 가격'], ['can', 'Trọng lượng', 'Weight', '중량'],
    ['giaCuoi', 'Giá cuối', 'Final price', '최종 가격'], ['ngay', 'Ngày đóng gói', 'Packed on', '포장일'],
  ];
  for (const [khoa, vi, en, ko] of TRUONG) {
    const dong = nguon.match(new RegExp(`\\n\\s*${khoa}:\\s*\\{ vi: '([^']*)', en: '([^']*)', ko: '([^']*)' \\},`));
    ok(`Trường ${khoa}: "${vi}" · "${en}" · "${ko}"`, !!dong && dong[1] === vi && dong[2] === en && dong[3] === ko, dong?.slice(1).join(' · '));
  }
  // Mọi chữ khai trong thẻ: không con số nào ngoài "100g" của tên trường, không đơn vị tiền.
  const chuKhai = [...nguon.matchAll(/(?:vi|en|ko): '([^']*)'/g)].map(m => m[1]);
  const coSo = chuKhai.filter(c => /\d/.test(c.replace(/100g/g, '')) || /₫|vnđ|vnd|\bđ\b|원\b|000/i.test(c));
  ok(`Thẻ chỉ ghi tên trường và lời giải thích (${chuKhai.length} câu): không giá trị mẫu, không số tiền, không ngày, không trọng lượng`, chuKhai.length === 33 && coSo.length === 0, coSo.join(' | '));
  ok('Template của thẻ không viết thẳng con số nào ngoài số thứ tự của trường (i + 1)', !/>[^<{]*\d[^<{]*</.test(mau), mau.match(/>[^<{]*\d[^<{]*</)?.[0]);
  ok('Không còn thanh giá trị giả và mã vạch giả (nk-gach, nk-ma-vach)', !/nk-gach|nk-ma-vach|repeating-linear-gradient/.test(nguon));
  ok('Thẻ đặt thẳng: không transform, không rotate', !/\btransform\s*:|\brotate\s*[:(]/.test(kieu), kieu.match(/[^;{}]*(?:transform|rotate)[^;{}]*/)?.[0]?.trim());
  ok('Thẻ phẳng: không box-shadow, không filter', !/box-shadow|drop-shadow|\bfilter\s*:/.test(kieu), kieu.match(/[^;{}]*(?:shadow|filter)[^;{}]*/)?.[0]?.trim());
  ok('Thẻ không viết thẳng mã màu nào: màu chỉ qua biến của bảng', !/#[0-9a-f]{3,8}\b/i.test(kieu), kieu.match(/#[0-9a-f]{3,8}\b/i)?.[0]);
  ok('Thẻ là nội dung đọc được (không aria-hidden trên thẻ) và dùng lớp .the của hệ giao diện (thẻ sáng trên dải đen, viền mảnh)',
     /class="nk-the the"/.test(mau) && !/class="nk-the[^"]*"[^>]*aria-hidden/.test(mau));
  // Logo chính bản đỏ (bộ 21/10/2026, cùng tên file với logo cũ nhưng nội dung mới) trên thẻ trắng — đỏ trên trắng đúng
  // guideline trang 4. width / height khai đúng tỷ lệ viewBox của CHÍNH file (không chép 446 × 124 của logo cũ).
  const theLogo = mau.match(/<img\b[^>]*\ssrc="\/thuong-hieu\/logo-ngang-do\.svg"[^>]*>/)?.[0] ?? '';
  const [rongLogo, caoLogo] = [/\swidth="(\d+(?:\.\d+)?)"/, /\sheight="(\d+(?:\.\d+)?)"/].map(m => Number(theLogo.match(m)?.[1] ?? 0));
  const vbLogo = doc(WEB, 'public', 'thuong-hieu', 'logo-ngang-do.svg').match(/<svg\b[^>]*\sviewBox\s*=\s*["']([^"']+)["']/)?.[1].trim().split(/[\s,]+/).map(Number) ?? [];
  const dungTiLe = (r, c) => r > 0 && c > 0 && vbLogo.length === 4 && Math.abs((r / c) / (vbLogo[2] / vbLogo[3]) - 1) <= 0.01;
  ok('Logo trên thẻ: logo chính đỏ logo-ngang-do.svg cho thẻ trắng, width / height đúng tỷ lệ viewBox (±1 %), width ≥ 160, alt rỗng (đứng cạnh tiêu đề của thẻ)',
     !!theLogo && /\salt=""/.test(theLogo) && rongLogo >= 160 && dungTiLe(rongLogo, caoLogo), theLogo || 'không thấy <img src="/thuong-hieu/logo-ngang-do.svg">');
  ok('…phép tỷ lệ bắt được cỡ 446 × 124 của logo cũ và nhận 446 × 101', !dungTiLe(446, 124) && dungTiLe(446, 101));
  const dung = ['QuayChonBo.astro', 'TrangThucDon.astro'].filter(f => /<NhanKhay\b/.test(mauCua(doc(SRC, 'components', f))));
  ok('Trang chủ (Quầy chọn bò) và trang Thực đơn (Bò tại quầy) dùng chung một thẻ', dung.length === 2, dung.join(', '));
});

// ===========================================================================
await nhom('7 · ẢNH MÓN CỦA TRANG THỰC ĐƠN (CUỐN MENU BẢN SÁNG 11/10/2026): BẢNG GHÉP MÃ MÓN, ẢNH TÁCH NỀN, NHÃN', async () => {
  // Mã món → ảnh, chép tay từ bảng danh mục cuốn bản sáng (scratchpad danh-muc-ban-sang.md, mục "Món ăn" và
  // "do-uong-signature"): 22 món ăn kể cả Set 4 sốt S01, ba ly signature. 17 đồ uống dạng danh sách không có ảnh.
  const MONG = {
    F03: 'mon-tartare-bo-hoa-tuyet', F19: 'mon-com-tron-tartare-bo-cay', F15: 'mon-lau-kim-chi', F16: 'mon-lau-bo-bulgogi',
    F20: 'mon-lau-nam', S01: 'mon-set-4-sot', F21: 'mon-salad-nam', F01: 'mon-caesar-salad', F10: 'mon-mien-tron-han',
    F22: 'mon-trung-hap-nui-lua', F23: 'mon-khoai-tay-chien-sot-bo', F18: 'mon-banh-gao-chien-pho-mai', F12: 'mon-canh-kim-chi',
    F14: 'mon-dau-phu-ham', F13: 'mon-canh-tuong-dau', F06: 'mon-com-kim-chi-bo', F05: 'mon-com-tron-han', F04: 'mon-com-tron-trung-ca',
    F11: 'mon-mi-lanh-cay', F08: 'mon-mi-toowoomba', F07: 'mon-mi-carbonara', F09: 'mon-mi-bo-sot-ca',
    D13: 'uong-milky-cloud-makgeolli', D01: 'uong-strawberry-crush', D14: 'uong-berry-rouge-highball',
  };
  const thucTe = Object.fromEntries(Object.entries(ANH_CUA_MON).map(([ma, a]) => [ma, a.id]));
  ok(`ANH_CUA_MON ghép đúng ${Object.keys(MONG).length} mã món của bảng danh mục với ảnh của món đó`,
     JSON.stringify(Object.entries(thucTe).sort()) === JSON.stringify(Object.entries(MONG).sort()),
     Object.entries(thucTe).filter(([ma, id]) => MONG[ma] !== id).map(([ma, id]) => `${ma} → ${id}`).join(', ') || Object.keys(MONG).filter(ma => !thucTe[ma]).join(', '));
  for (const [ma, a] of Object.entries(ANH_CUA_MON)) {
    ok(`${ma}: khung ${a.khung} của ảnh ${a.id} có trong danh-sach.json và đã dựng`,
       !!danhSach.anh?.[a.id]?.khung?.[a.khung] && !!ANH_TAO_SAN[a.id]?.[a.khung], JSON.stringify(a));
    // Khung gọn (ảnh nhỏ 128px của hàng món gọn dưới 600px): mọi món ăn có, ly signature không (nhóm ly luôn là thẻ).
    const laLy = a.id.startsWith('uong-');
    const mt = danhSach.anh?.[a.id] ?? {};
    if (laLy) { ok(`${ma}: ly signature không có khung gọn (thẻ ảnh trên chữ dưới ở mọi bề rộng)`, a.gon === undefined, String(a.gon)); continue; }
    if (!ok(`${ma}: có khung gọn ${a.gon} khác khung chính, khai trong danh-sach.json và đã dựng`,
            !!a.gon && a.gon !== a.khung && !!mt.khung?.[a.gon] && !!ANH_TAO_SAN[a.id]?.[a.gon], JSON.stringify(a))) continue;
    const kg = mt.khung[a.gon];
    if (mt.tach_nen) {
      // Ảnh nhỏ 128px: nhãn một dòng cao ≈ 22px (chữ 13px, dòng 1,4, đệm 2px) → dải đáy ≥ 18 % chiều cao khung vuông.
      const duoi = { ...mt.tach_nen, ...(kg.tach_nen ?? {}) }.duoi;
      ok(`${ma}: khung gọn của ảnh tách nền là 1x1, dải đáy ${duoi} ≥ 18 % — nhãn một dòng nằm dưới món ở ảnh nhỏ 128px`,
         a.gon === '1x1' && duoi >= 0.18, JSON.stringify(kg));
    } else {
      // Ảnh có nền (tartare): khung gọn 4:5 cắt sát đáy ảnh gốc — phần mặt bàn dưới đĩa là chỗ của nhãn.
      ok(`${ma}: khung gọn của ảnh có nền là 4x5 cắt sát đáy ảnh (fy 1) — nhãn nằm trên mặt bàn, không đè lên món`,
         a.gon === '4x5' && kg.fy === 1, JSON.stringify(kg));
    }
  }
  // Alt không khẳng định nguyên liệu mà mô tả món chưa nói, bếp chưa xác nhận (rà soát 13/10/2026): đậu phụ hầm
  // không ghi nghêu, lòng đỏ; carbonara không ghi thịt muối; ba thứ tiếng tả cùng một thứ; tiếng Hàn "말린 딸기".
  const alt = id => DANH_MUC_ANH[id]?.alt ?? {};
  const KHONG_KHANG_DINH = {
    'mon-dau-phu-ham': /nghêu|lòng đỏ|clam|yolk|조개|노른자/iu,
    'mon-mi-carbonara': /thịt muối|bacon|pancetta|guanciale|베이컨|판체타/iu,
  };
  for (const [id, mau] of Object.entries(KHONG_KHANG_DINH)) {
    const thay = Object.entries(alt(id)).filter(([, c]) => mau.test(c)).map(([nn]) => nn);
    ok(`${id}: alt ba thứ tiếng không khẳng định nguyên liệu mô tả món không nói (${mau.source})`, thay.length === 0, thay.join(', '));
  }
  ok('mon-com-kim-chi-bo: alt ba thứ tiếng khớp nhau — không thứ tiếng nào thêm màu đĩa',
     !/màu kem|cream|크림색/iu.test(Object.values(alt('mon-com-kim-chi-bo')).join(' ')), JSON.stringify(alt('mon-com-kim-chi-bo')));
  ok('uong-strawberry-crush: alt tiếng Hàn viết "말린 딸기" (không "건조 딸기"), như mô tả món D01',
     /말린 딸기/.test(alt('uong-strawberry-crush').ko ?? '') && !/건조/.test(alt('uong-strawberry-crush').ko ?? ''), alt('uong-strawberry-crush').ko);
  ok('Ảnh ba ly không cồn (uong-khong-con-ba-ly) là ảnh của cả phần Đồ uống — không gắn với một món nào',
     !Object.values(ANH_CUA_MON).some(a => a.id === 'uong-khong-con-ba-ly'));
  for (const id of ANH_MON) {
    ok(`${id}: ảnh minh họa (minhHoa: true)${TACH_NEN.includes(id) ? ', tách nền (tachNen: true)' : ', ảnh có nền (không tachNen)'}`,
       DANH_MUC_ANH[id]?.minhHoa === true && (DANH_MUC_ANH[id]?.tachNen === true) === TACH_NEN.includes(id), JSON.stringify(DANH_MUC_ANH[id] && { ...DANH_MUC_ANH[id], alt: '…' }));
  }

  // Khung ảnh tách nền: trong suốt (món đặt thẳng lên nền của dải), nhãn chỉ đổi CHỖ — cỡ chữ, màu, nền riêng của nhãn
  // giữ như nhóm 4 đã tính (đọc được trên vùng ảnh trắng tinh).
  const ck = boChuThichCss(doc(SRC, 'styles', 'cong-khai.css'));
  const khungTach = ck.match(/\.ck \.anh\.tach-nen\s*\{([^}]*)\}/)?.[1] ?? '';
  const nhanTach = ck.match(/\.ck \.anh\.tach-nen \.chu-thich-anh\s*\{([^}]*)\}/)?.[1] ?? '';
  ok('cong-khai.css: khung .anh.tach-nen trong suốt (không nền chờ, không mảng màu sau món)', /background:\s*transparent/.test(khungTach), khungTach.trim());
  const thuocTinh = [...nhanTach.matchAll(/([a-z-]+)\s*:/g)].map(m => m[1]);
  ok('cong-khai.css: nhãn của ảnh tách nền chỉ đổi chỗ (left, bottom, transform, white-space) — giữ cỡ chữ, màu và nền riêng của nhãn',
     thuocTinh.length > 0 && thuocTinh.every(t => ['left', 'bottom', 'transform', 'white-space'].includes(t)), nhanTach.trim());
  const anhAstro = doc(SRC, 'components', 'Anh.astro');
  ok('Anh.astro: ảnh tachNen thì khung thêm lớp tach-nen (đọc từ DANH_MUC_ANH, nơi dùng không quên được)',
     /const tachNen = DANH_MUC_ANH\[id\]\.tachNen === true;/.test(anhAstro) && /tachNen \? 'tach-nen'/.test(anhAstro));
  const dungNhomAnh = congKhai.filter(f => /<ThucDonNhomAnh\b/.test(mauCua(doc(SRC, f))));
  ok('ThucDonNhomAnh (ảnh món) chỉ nằm ở trang Thực đơn (TrangThucDon.astro)', JSON.stringify(dungNhomAnh) === JSON.stringify(['components/TrangThucDon.astro']), dungNhomAnh.join(', '));
});

process.exit(ketThuc('ẢNH, NHÃN "ẢNH MINH HỌA", THẺ ĐỌC NHÃN KHAY, BỐ CỤC TRANG CHỦ'));
