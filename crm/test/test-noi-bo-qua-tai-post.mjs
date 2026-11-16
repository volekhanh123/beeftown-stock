/**
 * BEEFTOWN — "HỆ THỐNG ĐANG BẬN" NGAY LÚC GỬI FORM: KHÔNG ĐỂ LẠI MỤC LỊCH SỬ POST (issue #194, đợt 3)
 * ===============================================================================================
 *
 *     node test/test-noi-bo-qua-tai-post.mjs
 *
 * Supabase bận đúng lúc nhân viên bấm Lưu (middleware: layPhien trả QUA_TAI; máy dùng chung: kiemMayChung gặp
 * TAM_LOI) thì trả lời của lượt POST là trang 503 "hệ thống đang bận" (lib/qua-tai.ts, trangQuaTai). Trang đó là
 * một mục lịch sử giữ nguyên thân form — trên trang Cài đặt Zalo là refresh token, trên máy dùng chung là PIN. Mọi
 * kết cục khác của các trang đó đã là 303 sang GET (#195, #198); đây là lối cuối.
 *
 * Không đổi sang 303: lượt POST nhận trả lời KHÔNG phải lỗi thì trình duyệt bỏ bản lưu đệm của trang form (đo trên
 * Chromium 156, 16/11/2026 — không còn bộ nhớ quay lại thì bấm Quay lại phải hỏi máy chủ đang bận, form đang gõ mất),
 * mà lời dặn của trang là "bấm Quay lại rồi gửi lại". Nên: vẫn trả 503 (bản lưu đệm của form còn nguyên), và trang
 * đó TỰ THAY mục lịch sử của nó (location.replace) bằng trang báo GET /noi-bo/chua-ghi — cùng từng chữ, không hỏi
 * Supabase. Đường dẫn trang vừa gửi (cho nút "Tải lại trang") đi theo cookie, không theo địa chỉ.
 *
 * Bất biến:
 *   1. Trang của lượt POST: vẫn 503, no-store, nói CHƯA ghi, không tự tải lại; có ĐÚNG MỘT đoạn mã, trong <head>:
 *      location.replace("/noi-bo/chua-ghi").
 *   2. Cookie bt_chua_ghi: HttpOnly, SameSite=Lax, Path=/noi-bo/chua-ghi, sống ≤ 300 giây, Secure khi HTTPS; chỉ mang
 *      đường dẫn trang nội bộ (đường dẫn lạ thì không ghi).
 *   3. Trang báo (trangChuaGhi): 503, no-store, ĐÚNG từng chữ của trang lượt POST; không mã, không tự tải lại; nút
 *      "Tải lại trang" về trang vừa gửi — không có, hay lạ, thì về /noi-bo.
 *   4. duongNoiBoAnToan: chỉ đường dẫn bắt đầu bằng /noi-bo, không đổi được máy chủ.
 *   5. Trang GET "đang bận" như cũ (không mã, không cookie, tự tải lại); nút tải lại không bao giờ là //máy-khác.
 *   6. middleware.ts trả trang báo TRƯỚC khi hỏi Supabase (layPhien) và trước nhánh trang mở cho mọi người.
 *
 * Trình duyệt thật: web/kiem-tra/trinh-duyet.mjs nhóm 4 (cảnh "HỆ THỐNG BẬN LÚC GỬI FORM": Quay lại về đúng form,
 * còn chữ đã gõ, không hỏi máy chủ), web/kiem-tra/thu-day-du.mjs nhóm 15 (qua middleware thật, Supabase Auth giả bận).
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web', 'src');
const QT = await import('../../web/src/lib/qua-tai.ts');
const { trangQuaTai } = QT;
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — HỆ THỐNG BẬN LÚC GỬI FORM: KHÔNG ĐỂ LẠI MỤC LỊCH SỬ POST (#194)');

const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/i;
const coHam = typeof QT.trangChuaGhi === 'function' && typeof QT.duongNoiBoAnToan === 'function'
  && QT.DUONG_CHUA_GHI === '/noi-bo/chua-ghi' && typeof QT.COOKIE_CHUA_GHI === 'string';
const main = html => (html.match(/<main>[\s\S]*<\/main>/) ?? [''])[0];
const boLink = html => html.replace(/href="[^"]*"/g, 'href=""');
const URL_THU = new URL('https://beeftown.vn/noi-bo/zalo/cai-dat?cn=q1&x=1');
const URL_HTTP = new URL('http://127.0.0.1:4353/noi-bo/kho/may/gan');

// ===========================================================================
await nhom('1 · TRANG CỦA LƯỢT POST TỰ THAY MỤC LỊCH SỬ CỦA NÓ', async () => {
  ok('#194: lib/qua-tai.ts có DUONG_CHUA_GHI = "/noi-bo/chua-ghi", COOKIE_CHUA_GHI, trangChuaGhi, duongNoiBoAnToan', coHam,
     Object.keys(QT).join(', '));
  const post = trangQuaTai('vi', true, URL_THU);
  const than = await post.text();
  ok('Vẫn 503, no-store (lượt POST nhận trả lời LỖI: trình duyệt giữ bản lưu đệm của trang form)',
     post.status === 503 && post.headers.get('cache-control') === 'no-store', `${post.status} ${post.headers.get('cache-control')}`);
  ok('Vẫn nói CHƯA ghi, không tự tải lại (không meta refresh)', /CHƯA được ghi/.test(than) && !/http-equiv="refresh"/.test(than));
  const cacMa = than.match(/<script\b[^>]*>[\s\S]*?<\/script>/g) ?? [];
  ok('#194: ĐÚNG MỘT đoạn mã, đúng một lệnh location.replace("/noi-bo/chua-ghi") — không src, không tài nguyên ngoài',
     cacMa.length === 1 && cacMa[0] === '<script>location.replace("/noi-bo/chua-ghi")</script>' && !/src=|https?:\/\//i.test(than),
     JSON.stringify(cacMa));
  ok('…nằm trong <head> (chạy trước khi thân trang hiện ra)',
     than.indexOf('<script>') > than.indexOf('<head>') && than.indexOf('<script>') < than.indexOf('</head>'));
  const en = await trangQuaTai('en', true, URL_THU).text();
  ok('Tiếng Anh: cùng đoạn mã, "NOT saved", không còn chữ Việt',
     en.includes('<script>location.replace("/noi-bo/chua-ghi")</script>') && /NOT saved/.test(en) && !VIET.test(en.replace(/<[^>]+>/g, ' ')));
});

// ===========================================================================
await nhom('2 · COOKIE ĐƯỜNG DẪN TRANG VỪA GỬI (cho nút "Tải lại trang" của trang báo)', async () => {
  if (!coHam) { ok('#194: có COOKIE_CHUA_GHI để thử', false); return; }
  const c = trangQuaTai('vi', true, URL_THU).headers.get('set-cookie') ?? '';
  const tc = c.split(';').map(s => s.trim());
  ok('#194: lượt POST ghi cookie bt_chua_ghi mang đường dẫn (mã hóa) của trang vừa gửi, kể cả tham số',
     tc[0] === `${QT.COOKIE_CHUA_GHI}=${encodeURIComponent('/noi-bo/zalo/cai-dat?cn=q1&x=1')}`, c);
  ok('…HttpOnly, SameSite=Lax, Path=/noi-bo/chua-ghi, Max-Age ≤ 300, Secure trên HTTPS',
     tc.includes('HttpOnly') && tc.includes('SameSite=Lax') && tc.includes('Path=/noi-bo/chua-ghi') && tc.includes('Secure')
     && Number((tc.find(x => /^Max-Age=/.test(x)) ?? 'Max-Age=x').slice(8)) > 0
     && Number((tc.find(x => /^Max-Age=/.test(x)) ?? 'Max-Age=x').slice(8)) <= 300, c);
  const http = trangQuaTai('vi', true, URL_HTTP).headers.get('set-cookie') ?? '';
  ok('…không Secure khi chạy HTTP (máy thử, astro dev) — không thì trình duyệt bỏ cookie',
     http.startsWith(`${QT.COOKIE_CHUA_GHI}=${encodeURIComponent('/noi-bo/kho/may/gan')};`) && !/;\s*Secure/i.test(http), http);
  for (const u of ['https://beeftown.vn//noi-bo/kho', 'https://beeftown.vn//ke-la.example/noi-bo', 'https://beeftown.vn/khong-noi-bo']) {
    const k = trangQuaTai('vi', true, new URL(u)).headers.get('set-cookie');
    ok(`Đường dẫn lạ ${JSON.stringify(new URL(u).pathname)} → không ghi cookie (trang báo về /noi-bo)`, k === null, String(k));
  }
  const get = trangQuaTai('vi', false, URL_THU);
  ok('Trang GET "đang bận" không ghi cookie nào', get.headers.get('set-cookie') === null);
});

// ===========================================================================
await nhom('3 · TRANG BÁO "CHƯA GHI" (GET /noi-bo/chua-ghi): ĐÚNG TỪNG CHỮ, KHÔNG MÃ, NÚT TẢI LẠI VỀ TRANG VỪA GỬI', async () => {
  if (!coHam) { ok('#194: có trangChuaGhi để thử', false); return; }
  const tl = QT.trangChuaGhi('vi', '/noi-bo/zalo/cai-dat?cn=q1&x=1');
  const than = await tl.text();
  ok('#194: 503, no-store, HTML utf-8', tl.status === 503 && tl.headers.get('cache-control') === 'no-store'
     && /text\/html; charset=utf-8/.test(tl.headers.get('content-type') ?? ''), `${tl.status} ${tl.headers.get('cache-control')}`);
  const post = await trangQuaTai('vi', true, URL_THU).text();
  ok('#194: ĐÚNG từng chữ của trang lượt POST (cùng <main>: CHƯA ghi, KHÔNG bị đăng xuất, Quay lại rồi gửi lại)',
     main(than) !== '' && boLink(main(than)) === boLink(main(post)), main(than).slice(0, 300));
  ok('…các câu cũ giữ nguyên chữ', ['Thao tác vừa gửi CHƯA được ghi.', 'Bạn KHÔNG bị đăng xuất.',
    'Đợi vài giây, bấm nút Quay lại của trình duyệt rồi gửi lại.', 'Tải lại trang'].every(c => than.includes(c)));
  ok('Không mã nào, không tự tải lại (F5 trên trang này chỉ là một lượt GET)', !/<script|http-equiv="refresh"|src=|https?:\/\//i.test(than));
  ok('Nút "Tải lại trang" về đúng trang vừa gửi, & được thoát', than.includes('href="/noi-bo/zalo/cai-dat?cn=q1&amp;x=1"'),
     (than.match(/<a href="[^"]*"/) ?? [''])[0]);
  ok('Không cookie: nút về /noi-bo', (await QT.trangChuaGhi('vi', undefined).text()).includes('<a href="/noi-bo">'));
  for (const la of ['//ke-la.example/x', 'https://ke-la.example/noi-bo', 'javascript:alert(1)', '/noi-bo-gia', '/noi-bo/"><b>x', '']) {
    const t = await QT.trangChuaGhi('vi', la).text();
    ok(`Cookie lạ ${JSON.stringify(la)} → nút về /noi-bo, chữ lạ không lọt vào trang`, t.includes('<a href="/noi-bo">') && !t.includes('ke-la') && !t.includes('<b>'));
  }
  const en = await QT.trangChuaGhi('en', '/noi-bo/kho').text();
  ok('Tiếng Anh: <html lang="en">, "NOT saved", "NOT been logged out", không còn chữ Việt',
     /<html lang="en">/.test(en) && /NOT saved/.test(en) && /NOT been logged out/.test(en) && !VIET.test(en.replace(/<[^>]+>/g, ' ')));
});

// ===========================================================================
await nhom('4 · duongNoiBoAnToan: CHỈ TRANG NỘI BỘ CỦA CHÍNH WEBSITE', async () => {
  if (!coHam) { ok('#194: có duongNoiBoAnToan để thử', false); return; }
  for (const d of ['/noi-bo', '/noi-bo/zalo/cai-dat', '/noi-bo/kho/xuat?loc=a&trang=2', '/noi-bo/kho/may?chon=11111111-1111-4111-8111-111111111111']) {
    ok(`Nhận ${JSON.stringify(d)}`, QT.duongNoiBoAnToan(d) === d);
  }
  for (const d of ['//noi-bo/kho', '//ke-la.example/x', 'https://ke-la.example/noi-bo', '/noi-bo-gia', '/noibo', 'noi-bo/kho', '/noi-bo/a b',
    '/noi-bo/a\\b', '/noi-bo/a\nb', '/noi-bo/"x', '/noi-bo/<x>', '', '/noi-bo/' + 'a'.repeat(1100), undefined, null, 123]) {
    ok(`Từ chối ${JSON.stringify(d)?.slice(0, 40)}`, QT.duongNoiBoAnToan(d) === null);
  }
});

// ===========================================================================
await nhom('5 · TRANG GET "ĐANG BẬN" NHƯ CŨ', async () => {
  const get = await trangQuaTai('vi', false, URL_THU).text();
  ok('Không mã nào, vẫn tự tải lại', !/<script/i.test(get) && /http-equiv="refresh"/.test(get));
  const haiGach = await trangQuaTai('vi', false, new URL('https://beeftown.vn//noi-bo/kho?a=1')).text();
  ok('Mở qua //noi-bo/… → nút "Tải lại trang" về /noi-bo, không bao giờ là //máy-khác (href="//…")',
     haiGach.includes('<a href="/noi-bo">') && !/href="\/\//.test(haiGach), (haiGach.match(/<a href="[^"]*"/) ?? [''])[0]);
  const haiGachPost = await trangQuaTai('vi', true, new URL('https://beeftown.vn//noi-bo/kho')).text();
  ok('…trang của lượt POST cũng vậy', !/href="\/\//.test(haiGachPost));
});

// ===========================================================================
await nhom('6 · middleware.ts: TRANG BÁO KHÔNG HỎI SUPABASE', async () => {
  const mw = readFileSync(join(WEB, 'middleware.ts'), 'utf8');
  const iBao = mw.indexOf('if (duong === DUONG_CHUA_GHI) return trangChuaGhi(');
  ok('#194: middleware trả trangChuaGhi cho /noi-bo/chua-ghi', iBao > 0, '(không thấy dòng đó)');
  ok('…TRƯỚC khi hỏi Supabase (layPhien) và trước nhánh trang mở cho mọi người',
     iBao > 0 && iBao < mw.indexOf('await layPhien(') && iBao < mw.indexOf('if (MO_CHO_MOI_NGUOI.includes(duong)) return next();'));
  ok('…đọc đường dẫn trang vừa gửi từ cookie COOKIE_CHUA_GHI',
     /trangChuaGhi\(context\.locals\.nn \?\? 'vi', context\.cookies\.get\(COOKIE_CHUA_GHI\)\?\.value\)/.test(mw));
  ok('Lượt POST bận vẫn đi qua trangQuaTai(…, laPost, …) — một chỗ cho middleware và máy dùng chung',
     /trangQuaTai\(context\.locals\.nn \?\? 'vi', context\.request\.method === 'POST', context\.url\)/.test(mw)
     && (readFileSync(join(WEB, 'lib', 'kho', 'may-chung.ts'), 'utf8').match(/return trangQuaTai\(/g) ?? []).length === 2);
});

// ===========================================================================
// Danh sách của #194 (máy quét theo mẫu chữ, 15/11/2026) xếp Cài đặt Zalo vào "có ô mật khẩu — làm trước" và trang Tin
// Zalo vào "lỗi dựng tại chỗ". Xem tay (16/11/2026): cả hai đã 303 sau MỌI lượt gửi từ trước — máy quét chỉ thấy câu
// gán `bao = …` trong khối POST, không thấy khối đó luôn kết thúc bằng chuyển hướng. Lối cuối của chúng là trang "đang
// bận" của middleware (nhóm 1–3). Canh ở đây để không ai sửa ngược.
await nhom('7 · HAI TRANG ZALO: MỌI LƯỢT GỬI KẾT THÚC BẰNG 303 (đã vậy từ trước — canh để không sửa ngược)', async () => {
  for (const [tep, dich] of [['zalo/cai-dat.astro', 'DUONG'], ['zalo/index.astro', 'Astro.url.pathname + Astro.url.search']]) {
    const s = readFileSync(join(WEB, 'pages', 'noi-bo', tep), 'utf8');
    const dau = s.indexOf("if (Astro.request.method === 'POST') {");
    const khoi = dau < 0 ? '' : s.slice(dau, s.indexOf('\n}\n', dau) + 2);
    const ma = khoi.replace(/\/\/[^\n]*/g, '');
    ok(`${tep}: khối POST đọc form trong try / catch — đọc hỏng hay ném lỗi cũng đi tiếp tới chuyển hướng`,
       /try \{\s*const form = await Astro\.request\.formData\(\);[\s\S]*\} catch \{/.test(ma), khoi.slice(0, 120));
    ok(`${tep}: không câu return nào trong khối ngoài lối cuối — mọi kết cục (lưu được, database từ chối, việc lạ, ném lỗi) là 303`,
       (ma.match(/\breturn\b/g) ?? []).length === 1
       && ma.trimEnd().endsWith(`ghiBaoZalo(Astro.cookies, bao);\n  return Astro.redirect(${dich}, 303);\n}`), ma.trimEnd().slice(-160));
  }
  const cd = readFileSync(join(WEB, 'pages', 'noi-bo', 'zalo', 'cai-dat.astro'), 'utf8');
  ok('zalo/cai-dat.astro: lỗi ném ra không được chép vào câu báo (catch không giữ lỗi — chữ lỗi lạ có thể mang token vừa dán)',
     /\} catch \{\s*\/\/[^\n]*\n\s*bao = \{ ok: false, cau: t\.khongDocForm \};/.test(cd));
  ok('zalo/cai-dat.astro: ô refresh token là ô mật khẩu, value rỗng — rời trang là xóa (lib/sau-dang-xuat.js, khung NoiBo)',
     /<input type="password" name="refresh_token" value=""/.test(cd) && /<NoiBo\b/.test(cd));
});

process.exit(ketThuc('HỆ THỐNG BẬN LÚC GỬI FORM'));
