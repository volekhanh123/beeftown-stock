/**
 * BEEFTOWN — Kiểm thử: đăng xuất thu hồi phiên ở Supabase, không chỉ xóa cookie
 * ==========================================================================
 *
 *     node test/test-noi-bo-dang-xuat.mjs
 *
 * Rà soát bảo mật 14/11/2026. /noi-bo/dang-xuat chỉ xóa cookie bt_phien trên trình duyệt đang bấm. Phiên ở
 * Supabase vẫn sống tới 7 ngày: ai đã chép được cookie đó từ trước (máy dùng chung, ảnh chụp công cụ lập trình,
 * bản sao lưu trình duyệt) vẫn vào được /noi-bo dưới tên người vừa đăng xuất. "Đăng xuất" phải có nghĩa là phiên
 * đó hết dùng được ở MỌI nơi.
 *
 * Bản sửa: dangXuat (web/src/lib/phien.ts) gọi Supabase thu hồi phiên rồi mới xóa cookie:
 *   · access token còn hạn        → một lượt /logout?scope=local, không đụng cửa /token;
 *   · access token đã hết hạn     → đổi refresh token lấy phiên mới rồi thu hồi phiên đó;
 *   · phiên đã mất ở Supabase     → thôi, không tốn lượt nào của hạn mức đăng nhập;
 *   · Supabase bận / mất mạng     → không thu hồi được, nhưng cookie VẪN bị xóa và người bấm vẫn về trang đăng nhập.
 *
 * Supabase Auth ở đây là bản giả (fetch giả), có phiên, có xoay refresh token, và hiểu phạm vi của /logout như
 * bản thật (local: chỉ phiên này; bỏ trống hoặc global: mọi phiên của người đó). Dòng "RÀ SOÁT 14/11" đỏ trước bản sửa.
 * Cần web/node_modules — như test-qua-tai.mjs.
 *
 * Vòng hai của rà soát (14/11/2026) thêm:
 *   · nhóm 2, 3: phạm vi "local" được kiểm ở CẢ hai đường thu hồi — Auth giả cũ bỏ qua phạm vi nên bỏ tham số đi
 *     (mặc định của supabase-js là đăng xuất mọi máy) không kiểm tra nào đỏ;
 *   · nhóm 5: lượt /logout cuối của đường "token hết hạn" hỏng thì phải có một dòng nhật ký;
 *   · nhóm 7b: trên Worker, việc còn dở lúc trang trả lời bị cắt — lượt thu hồi chậm hơn hạn đợi phải được giao cho
 *     waitUntil;
 *   · nhóm 9: nút Quay lại sau khi đăng xuất (web/public/kho/js/sau-dang-xuat.js).
 */

import { readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { taoBoDem } from './kho-chung.mjs';
import { dangXuat } from '../../web/src/lib/phien.ts';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — ĐĂNG XUẤT THU HỒI PHIÊN Ở SUPABASE');

const requireWeb = createRequire(join(GOC, 'web', 'package.json'));
const { createClient } = await import(pathToFileURL(requireWeb.resolve('@supabase/supabase-js')).href);

// ===========================================================================
// SUPABASE AUTH GIẢ — phiên, access token có hạn, refresh token xoay một lần
// ===========================================================================
const URL_GIA = 'https://gia-dang-xuat.supabase.co';
const b64url = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'x-supabase-api-version': '2024-01-01' },
});

const auth = {
  /** session_id → còn sống không */
  phien: new Map(),
  /** access token → { phienId, hetHan } */
  truyCap: new Map(),
  /** refresh token → { phienId, daDung } */
  lamMoi: new Map(),
  nhatKy: [], logoutHong: null, tokenHong: null, dem: 0,

  /** Một người đăng nhập: trả cặp token như cookie bt_phien giữ. */
  dangNhap({ hetHan = false } = {}) {
    const phienId = crypto.randomUUID();
    this.phien.set(phienId, true);
    return this.capToken(phienId, { hetHan });
  },
  capToken(phienId, { hetHan = false } = {}) {
    const n = ++this.dem;
    const access_token = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + (hetHan ? -60 : 3600), session_id: phienId, n })}.chu-ky-gia`;
    const refresh_token = `rt-${n}`;
    this.truyCap.set(access_token, { phienId, hetHan });
    this.lamMoi.set(refresh_token, { phienId, daDung: false });
    return { access_token, refresh_token, phienId };
  },
  /** Cặp token này còn vào được /noi-bo không (layPhien: getUser, hết hạn thì đổi refresh token). */
  conDungDuoc(t) {
    const a = this.truyCap.get(t.access_token);
    if (a && !a.hetHan && this.phien.get(a.phienId)) return true;
    const r = this.lamMoi.get(t.refresh_token);
    return !!(r && !r.daDung && this.phien.get(r.phienId));
  },
  datLai() { this.nhatKy = []; this.logoutHong = null; this.tokenHong = null; },
  goi(cua) { return this.nhatKy.filter(n => n.cua === cua); },
};

globalThis.fetch = async (url, init) => {
  const u = new URL(String(url));
  if (u.origin !== URL_GIA) throw new TypeError(`fetch giả: không biết ${u.origin}`);
  const dau = new Headers(init?.headers ?? {});
  const the = (dau.get('authorization') ?? '').replace(/^Bearer /, '');

  if (u.pathname === '/auth/v1/logout') {
    const phamVi = u.searchParams.get('scope');
    auth.nhatKy.push({ cua: 'logout', the, pham_vi: phamVi });
    // logoutHong(n): n là số thứ tự của lượt /logout này (từ 1). Trả undefined = lượt này không hỏng.
    const hong = auth.logoutHong ? auth.logoutHong(auth.goi('logout').length) : undefined;
    if (hong) return hong;
    const a = auth.truyCap.get(the);
    if (!a || a.hetHan) return json(403, { code: 'bad_jwt', message: 'invalid JWT: unable to parse or verify signature, token has invalid claims: token is expired' });
    if (!auth.phien.get(a.phienId)) return json(403, { code: 'session_not_found', message: 'Session from session_id claim in JWT does not exist' });
    // Phạm vi như Supabase Auth thật (mã nguồn công khai, internal/api/logout.go): "local" chỉ thu hồi phiên của
    // token này; bỏ trống hoặc "global" thu hồi MỌI phiên của người đó; "others" thu hồi mọi phiên trừ phiên này.
    // Mọi phiên ở đây là của cùng một người (sub "u1").
    if (phamVi === 'local') auth.phien.set(a.phienId, false);
    else for (const id of [...auth.phien.keys()]) { if (phamVi !== 'others' || id !== a.phienId) auth.phien.set(id, false); }
    return new Response(null, { status: 204 });
  }
  if (u.pathname === '/auth/v1/token' && u.searchParams.get('grant_type') === 'refresh_token') {
    const than = JSON.parse(String(init?.body ?? '{}'));
    auth.nhatKy.push({ cua: 'token', lam_moi: than.refresh_token });
    if (auth.tokenHong) return auth.tokenHong();
    const r = auth.lamMoi.get(than.refresh_token);
    if (!r || r.daDung || !auth.phien.get(r.phienId)) return json(400, { code: 'refresh_token_not_found', message: 'Invalid Refresh Token: Refresh Token Not Found' });
    r.daDung = true;
    const moi = auth.capToken(r.phienId);
    return json(200, {
      access_token: moi.access_token, refresh_token: moi.refresh_token, token_type: 'bearer', expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'thu@beeftown.test', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
    });
  }
  throw new TypeError(`fetch giả: không biết ${u.pathname}${u.search}`);
};
const taoTam = () => createClient(URL_GIA, 'khoa-anon-gia', { auth: { persistSession: false, autoRefreshToken: false } });

// ===========================================================================
// COOKIE GIẢ — đủ ba việc phien.ts dùng: get, set, delete
// ===========================================================================
function hopCookie(giaTri) {
  const kho = new Map(giaTri === undefined ? [] : [['bt_phien', giaTri]]);
  return {
    get: ten => (kho.has(ten) ? { value: kho.get(ten) } : undefined),
    set: (ten, v) => { kho.set(ten, v); },
    delete: ten => { kho.delete(ten); },
    con: () => kho.has('bt_phien'),
  };
}
const cookieCua = t => hopCookie(JSON.stringify({ access_token: t.access_token, refresh_token: t.refresh_token }));

/** Chạy `viec`, trả các dòng console.warn nó in ra (nhật ký "[qua-tai] …" của lib/qua-tai.ts). */
async function batCanhBao(viec) {
  const goc = console.warn;
  const dong = [];
  console.warn = (...phan) => { dong.push(phan.join(' ')); };
  try { await viec(); } finally { console.warn = goc; }
  return dong;
}
const dongThuHoi = dong => dong.filter(d => d.startsWith('[qua-tai] đăng xuất · thu hồi phiên'));

/** Bấm "Đăng xuất" với cookie này. Trả { loi, cookies }. */
async function bamDangXuat(cookies) {
  let loi = null;
  try { await dangXuat(cookies, { taoTam }); } catch (e) { loi = String(e?.message ?? e); }
  return { loi, cookies };
}

// ===========================================================================
await nhom('1 · Access token còn hạn → thu hồi phiên bằng một lượt gọi, rồi xóa cookie', async () => {
  auth.datLai();
  const t = auth.dangNhap();
  const banChep = { ...t };                       // ai đó đã chép cookie từ trước
  const { loi, cookies } = await bamDangXuat(cookieCua(t));
  ok('Đăng xuất chạy xong, cookie bt_phien bị xóa', loi === null && cookies.con() === false, loi ?? '');
  ok('RÀ SOÁT 14/11: phiên ở Supabase bị thu hồi', auth.phien.get(t.phienId) === false);
  ok('RÀ SOÁT 14/11: bản cookie đã chép từ trước không còn vào được /noi-bo', auth.conDungDuoc(banChep) === false);
  const lo = auth.goi('logout');
  ok('…đúng một lượt /logout, phạm vi "local" (chỉ phiên này), bằng access token của cookie',
     lo.length === 1 && lo[0].pham_vi === 'local' && lo[0].the === t.access_token, JSON.stringify(lo).slice(0, 200));
  ok('…không đụng cửa /token (không tốn hạn mức đăng nhập chung)', auth.goi('token').length === 0);
});

// ===========================================================================
await nhom('2 · Phạm vi "local": phiên trên máy khác của cùng người không bị đá ra', async () => {
  auth.datLai();
  const dienThoai = auth.dangNhap();
  const mayTinh = auth.dangNhap();
  await bamDangXuat(cookieCua(dienThoai));
  ok('Đăng xuất trên điện thoại: phiên điện thoại hết, phiên máy tính còn',
     auth.conDungDuoc(dienThoai) === false && auth.conDungDuoc(mayTinh) === true);

  // Đường thứ hai: trang để mở hơn một giờ rồi mới bấm Đăng xuất (middleware không làm mới token cho
  // /noi-bo/dang-xuat) — phiên được đổi refresh token rồi thu hồi. Lượt thu hồi đó cũng phải là "local".
  auth.datLai();
  const dienThoaiCu = auth.dangNhap({ hetHan: true });
  const mayTinh2 = auth.dangNhap();
  await bamDangXuat(cookieCua(dienThoaiCu));
  ok('RÀ SOÁT 14/11 (vòng hai): token của điện thoại đã hết hạn — phiên điện thoại hết, phiên máy tính còn',
     auth.conDungDuoc(dienThoaiCu) === false && auth.conDungDuoc(mayTinh2) === true,
     JSON.stringify(auth.goi('logout').map(l => l.pham_vi)));
});

// ===========================================================================
await nhom('3 · Access token đã hết hạn → đổi refresh token rồi thu hồi', async () => {
  auth.datLai();
  const t = auth.dangNhap({ hetHan: true });
  const banChep = { ...t };
  ok('Trước khi đăng xuất: bản chép vẫn vào được (refresh token còn sống)', auth.conDungDuoc(banChep) === true);
  const { loi, cookies } = await bamDangXuat(cookieCua(t));
  ok('Đăng xuất chạy xong, cookie bị xóa', loi === null && cookies.con() === false, loi ?? '');
  ok('RÀ SOÁT 14/11: phiên ở Supabase bị thu hồi', auth.phien.get(t.phienId) === false);
  ok('RÀ SOÁT 14/11: bản cookie đã chép (kể cả refresh token) không còn dùng được', auth.conDungDuoc(banChep) === false);
  const tk = auth.goi('token');
  const lo = auth.goi('logout');
  ok('…thứ tự: /logout bị từ chối vì token hết hạn → một lượt đổi refresh token của cookie → /logout bằng token mới',
     lo.length === 2 && tk.length === 1 && tk[0].lam_moi === t.refresh_token && lo[0].the === t.access_token && lo[1].the !== t.access_token,
     `${lo.length} logout, ${tk.length} token`);
  ok('RÀ SOÁT 14/11 (vòng hai): cả hai lượt /logout đều phạm vi "local"', lo.every(l => l.pham_vi === 'local'), JSON.stringify(lo.map(l => l.pham_vi)));
});

// ===========================================================================
await nhom('4 · Phiên đã mất ở Supabase, hoặc refresh token đã bị dùng → thôi, không tốn thêm lượt', async () => {
  auth.datLai();
  const t = auth.dangNhap();
  auth.phien.set(t.phienId, false);               // đã bị thu hồi ở nơi khác
  const a = await bamDangXuat(cookieCua(t));
  ok('Phiên đã mất: đăng xuất vẫn xong, cookie bị xóa', a.loi === null && a.cookies.con() === false, a.loi ?? '');
  ok('…không gọi /token', auth.goi('token').length === 0 && auth.goi('logout').length === 1, `${auth.goi('token').length} token`);

  auth.datLai();
  const cu = auth.dangNhap({ hetHan: true });
  auth.lamMoi.get(cu.refresh_token).daDung = true;   // refresh token đã xoay ở nơi khác
  const b = await bamDangXuat(cookieCua(cu));
  ok('Refresh token đã dùng: đăng xuất vẫn xong, cookie bị xóa', b.loi === null && b.cookies.con() === false, b.loi ?? '');
  ok('…thử đổi đúng một lần rồi thôi', auth.goi('token').length === 1 && auth.goi('logout').length === 1);
});

// ===========================================================================
await nhom('5 · Supabase bận hoặc mất mạng → cookie VẪN bị xóa, không ném lỗi ra trang', async () => {
  const CA = [
    ['429 — quá hạn mức', () => json(429, { code: 'over_request_rate_limit', message: 'Request rate limit reached' })],
    ['503 — Supabase trục trặc', () => json(503, { message: 'Service Unavailable' })],
    ['mất mạng', () => { throw new TypeError('fetch failed'); }],
    ['trang lỗi của proxy', () => new Response('<html>502</html>', { status: 502, headers: { 'content-type': 'text/html' } })],
  ];
  for (const [ten, hong] of CA) {
    auth.datLai();
    auth.logoutHong = hong;
    const t = auth.dangNhap();
    let kq;
    const dong = await batCanhBao(async () => { kq = await bamDangXuat(cookieCua(t)); });
    ok(`${ten}: đăng xuất không ném lỗi, cookie bị xóa`, kq.loi === null && kq.cookies.con() === false, kq.loi ?? '');
    ok('…không đổi refresh token khi chưa biết token có hỏng không (đổi lúc này là tốn hạn mức đang cạn)', auth.goi('token').length === 0);
    ok('…một dòng nhật ký [qua-tai] — không token, không email trong đó',
       dongThuHoi(dong).length === 1 && !dong.join(' ').includes(t.access_token) && !/@/.test(dong.join(' ')), dong.join(' | '));
  }
  // Hết hạn + cửa /token bận.
  auth.datLai();
  auth.tokenHong = () => json(429, { code: 'over_request_rate_limit', message: 'Request rate limit reached' });
  const t = auth.dangNhap({ hetHan: true });
  const { loi, cookies } = await bamDangXuat(cookieCua(t));
  ok('Token hết hạn mà cửa /token bận: vẫn đăng xuất được trên máy này', loi === null && cookies.con() === false, loi ?? '');

  // Vòng hai 14/11: token hết hạn, đổi refresh token ĐƯỢC, nhưng lượt /logout sau đó hỏng. Phiên còn sống với refresh
  // token vừa xoay — bản đầu im lặng, không ai biết đăng xuất đang không thu hồi được.
  for (const [ten, hong] of CA) {
    auth.datLai();
    auth.logoutHong = n => (n >= 2 ? hong() : undefined);      // lượt đầu vẫn trả 403 "token hết hạn" như thật
    const cu = auth.dangNhap({ hetHan: true });
    let kq;
    const dong = await batCanhBao(async () => { kq = await bamDangXuat(cookieCua(cu)); });
    ok(`Token hết hạn, đổi được, lượt /logout cuối gặp "${ten}": đăng xuất không ném lỗi, cookie bị xóa`,
       kq.loi === null && kq.cookies.con() === false && auth.goi('token').length === 1 && auth.goi('logout').length === 2, kq.loi ?? '');
    ok('RÀ SOÁT 14/11 (vòng hai): …và có một dòng nhật ký [qua-tai] cho lượt thu hồi hỏng', dongThuHoi(dong).length === 1, dong.join(' | ') || '(không dòng nào)');
  }
  // Bị TỪ CHỐI (phiên đã mất, refresh token đã dùng) không phải "bận": không ghi nhật ký quá tải.
  auth.datLai();
  const mat = auth.dangNhap();
  auth.phien.set(mat.phienId, false);
  const dongMat = await batCanhBao(() => bamDangXuat(cookieCua(mat)));
  ok('Phiên đã mất ở Supabase: không ghi dòng [qua-tai] nào (không phải quá tải)', dongThuHoi(dongMat).length === 0, dongMat.join(' | '));
});

// ===========================================================================
await nhom('6 · Không có cookie, cookie hỏng, chưa nối database → không gọi Supabase', async () => {
  for (const [ten, giaTri] of [['không có cookie', undefined], ['cookie không phải JSON', 'rac'], ['cookie thiếu refresh token', JSON.stringify({ access_token: 'a' })]]) {
    auth.datLai();
    const { loi, cookies } = await bamDangXuat(hopCookie(giaTri));
    ok(`${ten}: xong, không gọi mạng, không còn cookie`, loi === null && auth.nhatKy.length === 0 && cookies.con() === false, loi ?? JSON.stringify(auth.nhatKy));
  }
  // Mặc định (không truyền client): máy chạy kiểm thử không có PUBLIC_SUPABASE_* trong import.meta.env.
  auth.datLai();
  const t = auth.dangNhap();
  const cookies = cookieCua(t);
  let loi = null;
  try { await dangXuat(cookies); } catch (e) { loi = String(e?.message ?? e); }
  ok('Chưa nối database: vẫn xóa cookie, không ném lỗi', loi === null && cookies.con() === false && auth.nhatKy.length === 0, loi ?? '');
});

// ===========================================================================
await nhom('7 · Bấm đăng xuất hai lần → lần hai không làm gì thêm', async () => {
  auth.datLai();
  const t = auth.dangNhap();
  const cookies = cookieCua(t);
  await bamDangXuat(cookies);
  const truoc = auth.nhatKy.length;
  const hai = await bamDangXuat(cookies);
  ok('Lần hai: không lỗi, không gọi Supabase thêm lần nào', hai.loi === null && auth.nhatKy.length === truoc);
});

// ===========================================================================
await nhom('7b · Supabase treo (không trả lời) → đăng xuất vẫn xong, không treo theo', async () => {
  // Rà soát mã 14/11: bản đầu đợi Supabase không giới hạn. Người bấm Đăng xuất rồi đóng tab trong lúc trang còn
  // treo thì lệnh xóa cookie không bao giờ về tới trình duyệt — tệ hơn bản cũ (xóa ngay). dangXuat chỉ đợi lượt thu
  // hồi tối đa 4 giây; ở đây đặt hạn 300 mili-giây để kiểm thử khỏi chờ.
  const goc = globalThis.fetch;
  globalThis.fetch = () => new Promise(() => {});          // không bao giờ trả lời
  try {
    const cookies = cookieCua(auth.dangNhap());
    const batDau = Date.now();
    let loi = null;
    try { await dangXuat(cookies, { taoTam, hanMs: 300 }); } catch (e) { loi = String(e?.message ?? e); }
    const mat = Date.now() - batDau;
    ok('RÀ SOÁT 14/11: máy chủ đăng nhập treo → đăng xuất vẫn xong sau hạn đợi, không ném lỗi', loi === null && mat >= 250 && mat < 2000, `${mat} ms${loi ? ` · ${loi}` : ''}`);
    ok('…cookie vẫn bị xóa', cookies.con() === false);
  } finally {
    globalThis.fetch = goc;
  }
  const lib = readFileSync(join(GOC, 'web/src/lib/phien.ts'), 'utf8');
  ok('Hạn đợi của trang thật là 4 giây', /const HAN_THU_HOI_MS = 4000;/.test(lib) && /hanMs = HAN_THU_HOI_MS/.test(lib));

  // Supabase trả lời nhanh thì không đợi hết hạn.
  auth.datLai();
  const t = auth.dangNhap();
  const batDau = Date.now();
  const nenNhanh = [];
  const dongNhanh = await batCanhBao(() => dangXuat(cookieCua(t), { taoTam, hanMs: 5000, chayNen: viec => { nenNhanh.push(viec); } }));
  ok('Supabase trả lời ngay → đăng xuất xong ngay (không đợi hết hạn), phiên đã thu hồi', Date.now() - batDau < 2000 && auth.phien.get(t.phienId) === false, `${Date.now() - batDau} ms`);
  ok('…không dòng nhật ký nào', dongNhanh.length === 0, dongNhanh.join(' | '));

  // Vòng hai 14/11 — Supabase CHẬM hơn hạn đợi nhưng vẫn chạy. Trên Worker (workerd), việc còn dở lúc trang đã trả
  // lời bị cắt ngay: lượt /logout đang đi bị đóng kết nối, phiên không bị thu hồi, không ai biết. dangXuat giao
  // promise của lượt thu hồi cho `chayNen` (trang thật: waitUntil của Worker) và ghi một dòng nhật ký khi quá hạn.
  auth.datLai();
  const cham = auth.dangNhap();
  const fetchNhanh = globalThis.fetch;
  globalThis.fetch = async (...thamSo) => { await new Promise(xong => setTimeout(xong, 1500)); return fetchNhanh(...thamSo); };
  try {
    const nen = [];
    const cookies = cookieCua(cham);
    const luc = Date.now();
    const dong = await batCanhBao(() => dangXuat(cookies, { taoTam, hanMs: 300, chayNen: viec => { nen.push(viec); } }));
    const mat = Date.now() - luc;
    ok('RÀ SOÁT 14/11 (vòng hai): Supabase chậm hơn hạn đợi → trang vẫn trả lời đúng hạn, cookie bị xóa',
       mat >= 250 && mat < 1400 && cookies.con() === false, `${mat} ms`);
    ok('RÀ SOÁT 14/11 (vòng hai): …lượt thu hồi được giao cho việc chạy nền — đúng một promise',
       nen.length === 1 && typeof nen[0]?.then === 'function', `${nen.length} lần giao`);
    ok('RÀ SOÁT 14/11 (vòng hai): …lúc trang trả lời phiên chưa kịp thu hồi, và có đúng một dòng nhật ký nói vậy',
       auth.phien.get(cham.phienId) === true && dongThuHoi(dong).length === 1, dong.join(' | ') || '(không dòng nào)');
    await nen[0];
    ok('RÀ SOÁT 14/11 (vòng hai): …việc chạy nền xong thì phiên đã bị thu hồi', auth.phien.get(cham.phienId) === false);
  } finally {
    globalThis.fetch = fetchNhanh;
  }
  ok('Supabase trả lời trong hạn: lượt thu hồi cũng được giao cho việc chạy nền (một promise, đã xong)', nenNhanh.length === 1);
  ok('Không có ngữ cảnh Worker (chayNen không truyền): dangXuat vẫn chạy như cũ', (await bamDangXuat(cookieCua(auth.dangNhap()))).loi === null);
});

// ===========================================================================
await nhom('8 · Trang /noi-bo/dang-xuat: gọi đúng hàm này, bảo trình duyệt bỏ bản trang đang giữ, vẫn chỉ nhận POST', async () => {
  const { POST, GET } = await import('../../web/src/pages/noi-bo/dang-xuat.ts');
  const chuyen = (duong, ma) => new Response(null, { status: ma, headers: { Location: duong } });   // như context.redirect của Astro

  // Máy chạy kiểm thử chưa nối database: dangXuat không gọi mạng, nhưng trang vẫn phải xóa cookie và trả lời đúng.
  auth.datLai();
  const cookies = cookieCua(auth.dangNhap());
  const tl = await POST({ cookies, redirect: chuyen });
  ok('POST: chuyển về trang đăng nhập (302), cookie bt_phien bị xóa',
     tl.status === 302 && tl.headers.get('location') === '/noi-bo/dang-nhap' && cookies.con() === false, `HTTP ${tl.status} → ${tl.headers.get('location')}`);
  // Rà soát mã 14/11: không ép no-store cho cả khu nội bộ (lib/header-noi-bo.ts), nên chính lúc đăng xuất phải bảo
  // trình duyệt bỏ bản trang nó đang giữ — không thì người đến sau bấm Quay lại là thấy trang của người trước.
  // Header này gỡ bản lưu đệm HTTP và các trang ĐÃ nằm trong bộ nhớ quay lại; chính trang vừa bấm Đăng xuất thì do
  // sau-dang-xuat.js lo (nhóm 9).
  ok('RÀ SOÁT 14/11: trả lời đăng xuất mang Clear-Site-Data: "cache"', tl.headers.get('clear-site-data') === '"cache"', tl.headers.get('clear-site-data') ?? '(không có)');

  const ck2 = cookieCua(auth.dangNhap());
  const xem = await GET({ cookies: ck2, redirect: chuyen });
  ok('GET không đăng xuất ai: chỉ chuyển về /noi-bo, cookie còn nguyên, không xóa bộ đệm của ai',
     xem.status === 302 && xem.headers.get('location') === '/noi-bo' && ck2.con() === true && xem.headers.get('clear-site-data') === null);

  // Có ngữ cảnh Worker (locals.cfContext của bộ nối Cloudflare): trang vẫn trả lời đúng, không ném lỗi. Máy chạy
  // kiểm thử chưa nối database nên không có lượt thu hồi nào để giao — phần giao việc kiểm ở nhóm 7b (hàm) và bằng
  // mã nguồn ngay dưới (trang).
  const daGiao = [];
  const ck3 = cookieCua(auth.dangNhap());
  const tl3 = await POST({ cookies: ck3, redirect: chuyen, locals: { cfContext: { waitUntil: viec => { daGiao.push(viec); } } } });
  ok('POST có ngữ cảnh Worker: vẫn 302 về trang đăng nhập, cookie bị xóa', tl3.status === 302 && ck3.con() === false && daGiao.length === 0);

  const trang = readFileSync(join(GOC, 'web/src/pages/noi-bo/dang-xuat.ts'), 'utf8');
  ok('POST đợi dangXuat xong rồi mới trả lời',
     /export const POST: APIRoute = async \(\{ cookies, redirect, locals \}\) => \{[\s\S]{0,400}?await dangXuat\(cookies, \{ chayNen/.test(trang), trang.slice(trang.indexOf('export const POST'), trang.indexOf('export const POST') + 300));
  ok('RÀ SOÁT 14/11 (vòng hai): POST giao lượt thu hồi cho waitUntil của Worker (locals.cfContext)',
     /const nguCanh = \(locals as [^;]*\)\?\.cfContext;/.test(trang) && /chayNen: viec => nguCanh\?\.waitUntil\?\.\(viec\)/.test(trang));
  const lib = readFileSync(join(GOC, 'web/src/lib/phien.ts'), 'utf8');
  const than = lib.slice(lib.indexOf('export async function dangXuat'), lib.indexOf('\n}\n', lib.indexOf('export async function dangXuat')));
  ok('dangXuat xóa cookie trong khối finally — thu hồi hỏng kiểu gì cũng không giữ cookie lại', /finally\s*\{\s*xoaToken\(cookies\);?\s*\}/.test(than), than.slice(0, 300));
});

// ===========================================================================
await nhom('9 · Nút Quay lại sau khi đăng xuất: trang cũ không hiện lại từ bộ nhớ của trình duyệt (sau-dang-xuat.js)', async () => {
  // Vòng hai 14/11: thử bằng Chromium bản đầy đủ có bfcache (bản mặc định của Playwright không có) — Clear-Site-Data
  // không gỡ được chính trang vừa bấm Đăng xuất khỏi bộ nhớ quay lại: bấm Quay lại là trang cũ hiện ra, máy chủ không
  // được hỏi. web/public/kho/js/sau-dang-xuat.js tải lại trang trong đúng trường hợp đó. Ở đây chạy chính file đó với
  // cửa sổ giả; trên bản build thật và trình duyệt thật: web/kiem-tra/trinh-duyet.mjs nhóm 4.
  const DUONG_MA = join(GOC, 'web/public/kho/js/sau-dang-xuat.js');
  let ma = '';
  try { ma = readFileSync(DUONG_MA, 'utf8'); } catch { /* chưa có file: mọi kiểm tra bên dưới đỏ */ }
  ok('RÀ SOÁT 14/11 (vòng hai): có file web/public/kho/js/sau-dang-xuat.js', ma.length > 0);

  /** Một trang nội bộ vừa tải lúc `bayGio`, dùng chung kho localStorage `kho` với các tab khác. */
  function moTrang({ bayGio, kho = new Map(), khoHong = false }) {
    const nghe = { document: {}, window: {} };
    const tt = { bayGio, taiLai: 0 };
    const khoGia = khoHong
      ? { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } }
      : { getItem: k => (kho.has(k) ? kho.get(k) : null), setItem: (k, v) => { kho.set(k, String(v)); } };
    const goc = { style: {} };
    const document = { documentElement: goc, addEventListener: (ten, ham) => { (nghe.document[ten] ??= []).push(ham); } };
    const window = {
      localStorage: khoGia, location: { reload: () => { tt.taiLai += 1; } },
      addEventListener: (ten, ham) => { (nghe.window[ten] ??= []).push(ham); },
    };
    let loi = null;
    try { vm.runInNewContext(ma, { window, document, Date: { now: () => tt.bayGio }, parseInt, String }); } catch (e) { loi = String(e?.message ?? e); }
    const ban = (noi, ten, suKien) => { for (const ham of nghe[noi][ten] ?? []) ham(suKien); };
    const form = hanhDong => ({ getAttribute: ten => (ten === 'action' ? hanhDong : null) });
    return {
      loi, kho,
      datGio: gio => { tt.bayGio = gio; },
      guiForm: hanhDong => ban('document', 'submit', { target: form(hanhDong) }),
      /** Trang hiện ra: tuBoNho = true là lấy từ bộ nhớ quay lại (pageshow, persisted). */
      hienRa: tuBoNho => ban('window', 'pageshow', { persisted: tuBoNho }),
      taiLai: () => tt.taiLai,
      biGiau: () => goc.style.visibility === 'hidden',
    };
  }

  const a = moTrang({ bayGio: 1000 });
  ok('File chạy được với cửa sổ giả', a.loi === null, a.loi ?? '');
  a.hienRa(true);
  ok('Chưa ai đăng xuất: Quay lại từ bộ nhớ KHÔNG tải lại (bấm nhầm link rồi quay lại, chữ đang gõ dở còn nguyên)',
     a.taiLai() === 0 && !a.biGiau());

  const b = moTrang({ bayGio: 1000 });
  b.datGio(5000); b.guiForm('/noi-bo/dang-xuat');
  b.hienRa(false);
  ok('Bấm Đăng xuất rồi trang hiện theo lối thường (không từ bộ nhớ): không làm gì', b.taiLai() === 0 && !b.biGiau());
  b.hienRa(true);
  ok('RÀ SOÁT 14/11 (vòng hai): bấm Đăng xuất ở trang này rồi Quay lại từ bộ nhớ → giấu trang và tải lại đúng một lần',
     b.taiLai() === 1 && b.biGiau(), `tải lại ${b.taiLai()} lần, giấu: ${b.biGiau()}`);

  for (const hanhDong of ['/noi-bo/kho/may', '/noi-bo/dat-ban', '', null, '/noi-bo/dang-xuat-khac']) {
    const c = moTrang({ bayGio: 1000 });
    c.guiForm(hanhDong); c.hienRa(true);
    ok(`Gửi form khác (action ${JSON.stringify(hanhDong)}) không tính là đăng xuất`, c.taiLai() === 0 && !c.biGiau());
  }
  for (const hanhDong of ['/noi-bo/dang-xuat/', '/noi-bo/dang-xuat?x=1']) {
    const c = moTrang({ bayGio: 1000 });
    c.guiForm(hanhDong); c.hienRa(true);
    ok(`Form đăng xuất viết ${hanhDong} vẫn được nhận ra`, c.taiLai() === 1);
  }

  // Hai tab dùng chung localStorage: tab kia bấm Đăng xuất SAU khi tab này tải trang.
  const khoChung = new Map();
  const tabNay = moTrang({ bayGio: 1000, kho: khoChung });
  const tabKia = moTrang({ bayGio: 2000, kho: khoChung });
  tabKia.datGio(3000); tabKia.guiForm('/noi-bo/dang-xuat');
  tabNay.hienRa(true);
  ok('RÀ SOÁT 14/11 (vòng hai): tab khác bấm Đăng xuất sau lúc trang này tải → Quay lại từ bộ nhớ thì tải lại',
     tabNay.taiLai() === 1 && tabNay.biGiau(), JSON.stringify([...khoChung]));
  // Trang tải SAU lần đăng xuất đó (đã đăng nhập lại): không bị tải lại nữa.
  const tabMoi = moTrang({ bayGio: 4000, kho: khoChung });
  tabMoi.hienRa(true);
  ok('Trang tải sau lần đăng xuất gần nhất: Quay lại từ bộ nhớ không tải lại', tabMoi.taiLai() === 0 && !tabMoi.biGiau());

  // Trình duyệt chặn localStorage (chế độ riêng tư cũ, cài đặt chặn dữ liệu trang): không ném lỗi, còn biến của trang.
  const chan = moTrang({ bayGio: 1000, khoHong: true });
  let loiChan = null;
  try { chan.hienRa(true); chan.guiForm('/noi-bo/dang-xuat'); chan.hienRa(true); } catch (e) { loiChan = String(e?.message ?? e); }
  ok('localStorage bị chặn: không ném lỗi; chưa đăng xuất thì không tải lại, bấm Đăng xuất ở trang này thì vẫn tải lại',
     chan.loi === null && loiChan === null && chan.taiLai() === 1, loiChan ?? `tải lại ${chan.taiLai()} lần`);
  const rac = moTrang({ bayGio: 1000, kho: new Map([['bt_dang_xuat_luc', 'không phải số']]) });
  rac.hienRa(true);
  ok('Giá trị lạ trong localStorage: coi như chưa ai đăng xuất', rac.taiLai() === 0);

  ok('File không đụng cookie (cookie phiên là httpOnly) và không gọi mạng', ma.length > 0 && !/document\.cookie|fetch\(|XMLHttpRequest/.test(ma));

  // Hai khung giao diện nạp file này ở MỌI trang (không điều kiện), và mọi form Đăng xuất nằm trong một khung như vậy.
  const THE = /<script is:inline src="\/kho\/js\/sau-dang-xuat\.js" defer><\/script>\s*<\/body>/;
  for (const khung of ['web/src/layouts/NoiBo.astro', 'web/src/layouts/Kho.astro']) {
    const nguon = readFileSync(join(GOC, khung), 'utf8');
    ok(`RÀ SOÁT 14/11 (vòng hai): ${khung} nạp sau-dang-xuat.js ngay trước </body>, không điều kiện`,
       THE.test(nguon) && (nguon.match(/src="\/kho\/js\/sau-dang-xuat\.js"/g) ?? []).length === 1);
  }
  const moiAstro = thuMuc => readdirSync(thuMuc, { withFileTypes: true, recursive: true })
    .filter(f => f.isFile() && f.name.endsWith('.astro')).map(f => join(f.parentPath ?? f.path, f.name));
  const coForm = moiAstro(join(GOC, 'web/src')).filter(f => /dang-xuat"/.test(readFileSync(f, 'utf8')));
  const sai = coForm.filter(f => {
    const nguon = readFileSync(f, 'utf8');
    const dungDang = (nguon.match(/dang-xuat"/g) ?? []).length === (nguon.match(/<form method="POST" action="\/noi-bo\/dang-xuat"/g) ?? []).length;
    const trongKhung = /layouts[\\/](NoiBo|Kho)\.astro$/.test(f) || /from '[^']*layouts\/(NoiBo|Kho)\.astro'/.test(nguon);
    return !(dungDang && trongKhung);
  });
  ok(`Mọi form Đăng xuất (${coForm.length} file) viết đúng action="/noi-bo/dang-xuat" và nằm trong khung NoiBo hoặc Kho`,
     coForm.length >= 3 && sai.length === 0, sai.map(f => relative(GOC, f)).join(', '));
});

process.exit(ketThuc('đăng xuất thu hồi phiên'));
