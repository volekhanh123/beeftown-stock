/**
 * BEEFTOWN — TRANG KHÔNG CÓ (404) Ở KHU NỘI BỘ
 * ===========================================
 *
 *     node test/test-noi-bo-khong-co.mjs
 *
 * web/src/pages/404.astro là MỘT file Astro hiện cho mọi đường dẫn không có trang, kể cả
 * dưới /noi-bo, và middleware chạy trước nó. Bất biến:
 *
 *   1. Chọn nhánh (loaiTrangKhongCo, lib/dieu-huong-noi-bo.ts): trang nội bộ CHỈ khi đường
 *      dẫn là /noi-bo hoặc /noi-bo/… VÀ đã đăng nhập; còn lại là trang công khai. Đúng phạm vi
 *      cookie ngôn ngữ nb_ngon_ngu (path /noi-bo): /noi-bo-abc tuy middleware vẫn canh nhưng
 *      trình duyệt không gửi cookie đó tới — bản nội bộ ở đấy luôn tiếng Việt, nút English vô dụng.
 *   2. Nằm trong khu middleware.ts canh: middleware chặn tiền tố '/noi-bo', chuyển người chưa
 *      đăng nhập sang /noi-bo/dang-nhap, và chỉ đặt locals.phien SAU hai bước ấy — nên trang
 *      nội bộ không bao giờ hiện cho người chưa đăng nhập.
 *   3. 404.astro nối đúng: trả HTTP 404; nhánh nội bộ dùng khung NoiBo.astro, ngôn ngữ của
 *      nhân viên (locals.nn qua nnCua), câu từ cau-noi-bo.ts, có link về /noi-bo; trang
 *      không đọc database.
 *   4. Câu của trang nội bộ (CAU_TRANG_KHONG_CO, lib/cau-noi-bo.ts) đủ vi và en, bản tiếng
 *      Anh không còn chữ Việt, không dính chữ cấm.
 *
 * Kiểm thử trình duyệt (web/kiem-tra/trinh-duyet.mjs) chạy không có database nên chỉ thấy
 * nhánh CHƯA đăng nhập — phần đã đăng nhập được giữ ở đây.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { VIET } from './quet-chu-viet.mjs';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — TRANG KHÔNG CÓ Ở NỘI BỘ');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const doc = p => readFileSync(join(SRC, p), 'utf8');
// Nạp động: thiếu một hàm thì phép thử đỏ ở đúng dòng, không làm cả file ngừng chạy.
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const { loaiTrangKhongCo } = await nap('dieu-huong-noi-bo.ts');
const { CAU_TRANG_KHONG_CO } = await nap('cau-noi-bo.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');

// Các trường hợp chọn nhánh: [đường dẫn, đã đăng nhập, nhánh đúng].
const CA = [
  ['/noi-bo/khong-co', true, 'noi-bo'],
  ['/noi-bo/kho/khong-co/', true, 'noi-bo'],
  ['/noi-bo/en/khong-co', true, 'noi-bo'],
  ['/noi-bo/', true, 'noi-bo'],
  // Middleware vẫn canh /noi-bo-… (tiền tố không có dấu /), nhưng cookie nb_ngon_ngu (path /noi-bo)
  // không tới đó: bản nội bộ sẽ kẹt ở tiếng Việt. Trang công khai tiếng Việt thì đúng sự thật.
  ['/noi-bo-khong-co', true, 'cong-khai'],
  ['/noi-bokhong-co', true, 'cong-khai'],
  ['/noi-bo/khong-co', false, 'cong-khai'],
  ['/noi-bo-khong-co', false, 'cong-khai'],
  ['/khong-co', true, 'cong-khai'],
  ['/khong-co', false, 'cong-khai'],
  ['/en/khong-co', true, 'cong-khai'],
  ['/ko/khong-co', false, 'cong-khai'],
  ['/en/noi-bo', true, 'cong-khai'],
  ['/', false, 'cong-khai'],
];

// ===========================================================================
await nhom('1 · CHỌN NHÁNH: TRANG NỘI BỘ CHỈ KHI Ở /noi-bo, /noi-bo/… VÀ ĐÃ ĐĂNG NHẬP', async () => {
  const coHam = typeof loaiTrangKhongCo === 'function';
  ok('lib/dieu-huong-noi-bo.ts có hàm loaiTrangKhongCo', coHam);
  if (!coHam) return;
  for (const [duong, daDangNhap, dung] of CA) {
    const ra = loaiTrangKhongCo(duong, daDangNhap);
    ok(`${duong} · ${daDangNhap ? 'đã' : 'chưa'} đăng nhập → trang ${dung === 'noi-bo' ? 'nội bộ' : 'công khai'}`, ra === dung, `ra "${ra}"`);
  }

  // Bản nội bộ đọc tiếng từ cookie nb_ngon_ngu — nên chỉ hiện ở nơi trình duyệt GỬI cookie đó tới
  // (so đường dẫn của cookie theo RFC 6265 §5.1.4: trùng hẳn, hoặc tiếp theo là dấu /).
  const m = /COOKIE_NGON_NGU_NB[\s\S]*?\bpath:\s*'([^']+)'/.exec(doc('lib/ngon-ngu-noi-bo.ts'));
  const pathCookie = m?.[1];
  ok('Đọc được path của cookie nb_ngon_ngu (lib/ngon-ngu-noi-bo.ts)', !!pathCookie, String(pathCookie));
  const cookieToi = duong => duong === pathCookie || duong.startsWith(pathCookie.endsWith('/') ? pathCookie : pathCookie + '/');
  const ngoai = [...CA.map(c => c[0]), '/noi-bo-x', '/noi-boa', '/noi-bo/x/y']
    .filter(d => loaiTrangKhongCo(d, true) === 'noi-bo' && !cookieToi(d));
  ok(`Mọi đường dẫn ra trang nội bộ đều nằm trong phạm vi cookie nb_ngon_ngu (path ${pathCookie}) — nút English có tác dụng`,
     !!pathCookie && ngoai.length === 0, ngoai.join(', '));
});

// ===========================================================================
await nhom('2 · TRONG VÙNG middleware.ts CANH: CHƯA ĐĂNG NHẬP THÌ KHÔNG BAO GIỜ TỚI TRANG NỘI BỘ', async () => {
  // Đọc theo NGHĨA, không theo từng ký tự: đổi tên biến, xuống dòng, thêm await không làm đỏ.
  const mw = doc('middleware.ts').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const canh = /if\s*\(\s*!\s*\w+\.startsWith\(\s*['"]([^'"]+)['"]\s*\)\s*\)\s*return\s+(?:await\s+)?next\(\)/.exec(mw);
  const chuyen = /return\s+context\.redirect\(\s*['"]\/noi-bo\/dang-nhap['"]/.exec(mw);
  const datPhien = [...mw.matchAll(/context\.locals\.phien\s*=/g)];
  ok('middleware.ts canh một tiền tố: đường dẫn ngoài tiền tố đó đi thẳng (return next())', !!canh, canh?.[0]);
  const tienTo = canh?.[1] ?? '';
  const ngoaiVung = CA.filter(([d, coPhien]) => loaiTrangKhongCo(d, coPhien) === 'noi-bo' && !d.startsWith(tienTo)).map(c => c[0]);
  ok(`Mọi đường dẫn ra trang nội bộ đều nằm trong vùng middleware canh (tiền tố "${tienTo}")`,
     !!tienTo && ngoaiVung.length === 0, ngoaiVung.join(', '));
  ok('middleware.ts chuyển người chưa đăng nhập sang /noi-bo/dang-nhap, sau bước canh tiền tố',
     !!chuyen && !!canh && chuyen.index > canh.index);
  ok('middleware.ts đặt locals.phien đúng một chỗ, SAU khi đã chuyển người chưa đăng nhập đi',
     datPhien.length === 1 && !!chuyen && datPhien[0].index > chuyen.index, `${datPhien.length} chỗ`);
});

// ===========================================================================
await nhom('3 · pages/404.astro: HTTP 404, NHÁNH NỘI BỘ DÙNG KHUNG NỘI BỘ, TIẾNG CỦA NHÂN VIÊN, LINK VỀ /noi-bo', async () => {
  let trang = '';
  try { trang = doc('pages/404.astro'); } catch { /* chưa có file */ }
  ok('Có web/src/pages/404.astro', !!trang);
  if (!trang) return;
  ok('Trả HTTP 404 (Astro.response.status = 404)', /Astro\.response\.status\s*=\s*404\b/.test(trang));
  ok('Chọn nhánh bằng loaiTrangKhongCo(Astro.url.pathname, !!Astro.locals.phien)',
     /loaiTrangKhongCo\(\s*Astro\.url\.pathname\s*,\s*!!Astro\.locals\.phien\s*\)/.test(trang));
  ok('Hai bản tách bằng đúng kết quả đó: loai === \'noi-bo\' → <NoiBo>, còn lại → <Trang>',
     /\{loai === 'noi-bo' \? \(\s*<NoiBo\b[\s\S]*<\/NoiBo>\s*\) : \(\s*<Trang\b[\s\S]*<\/Trang>\s*\)\}/.test(trang));
  ok('Nhánh nội bộ dùng khung NoiBo.astro, kèm nhân sự đang đăng nhập (menu theo vai, nút đăng xuất)',
     /import NoiBo from '\.\.\/layouts\/NoiBo\.astro'/.test(trang) && /<NoiBo\b[^>]*nhanSu=\{/.test(trang));
  ok('Ngôn ngữ của nhân viên: nnCua(Astro) — locals.nn do middleware đặt từ cookie',
     /nnCua\(Astro\)/.test(trang));
  ok('Câu của nhánh nội bộ lấy từ CAU_TRANG_KHONG_CO (lib/cau-noi-bo.ts) qua dichNB',
     /dichNB\(\s*\w+\s*,\s*CAU_TRANG_KHONG_CO\s*\)/.test(trang) && /from '\.\.\/lib\/cau-noi-bo'/.test(trang));
  ok('Có link về trang chính nội bộ: href="/noi-bo"', /href="\/noi-bo"/.test(trang));
  ok('Trang không gọi database (.rpc / .from)', !/\.(rpc|from)\(/.test(trang));
});

// ===========================================================================
await nhom('4 · CÂU CỦA TRANG NỘI BỘ: ĐỦ vi VÀ en, TIẾNG ANH KHÔNG CÒN CHỮ VIỆT, KHÔNG CHỮ CẤM', async () => {
  const coBang = !!CAU_TRANG_KHONG_CO && typeof CAU_TRANG_KHONG_CO === 'object';
  ok('lib/cau-noi-bo.ts có bảng CAU_TRANG_KHONG_CO', coBang);
  if (!coBang) return;
  const khoa = Object.keys(CAU_TRANG_KHONG_CO);
  ok('Có câu tiêu đề, câu giải thích, chữ trên nút về trang chính',
     ['tieuDe', 'giaiThich', 'veTrangChinh'].every(k => khoa.includes(k)), khoa.join(', '));
  for (const [k, c] of Object.entries(CAU_TRANG_KHONG_CO)) {
    ok(`${k}: có vi và en, không rỗng, en khác vi`,
       typeof c.vi === 'string' && typeof c.en === 'string' && !!c.vi.trim() && !!c.en.trim() && c.vi !== c.en,
       JSON.stringify(c));
    ok(`${k}: bản tiếng Anh không còn chữ có dấu tiếng Việt`, !VIET.test(c.en ?? ''), c.en);
    const cam = [c.vi, c.en].flatMap(s => timChuoiCam(s ?? '')).map(t => `"${t.tim_thay}" — ${t.vi_sao}`);
    ok(`${k}: không dính chữ cấm (chuoi-cam.js)`, cam.length === 0, cam.join(' | '));
  }
  ok('Câu không nói "thành công" / "success" — trang này chỉ báo là không có trang',
     !Object.values(CAU_TRANG_KHONG_CO).some(c => /thành công|success/i.test(`${c.vi} ${c.en}`)));
});

process.exit(ketThuc('TRANG KHÔNG CÓ Ở NỘI BỘ'));
