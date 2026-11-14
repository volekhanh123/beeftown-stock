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
 * Supabase Auth ở đây là bản giả (fetch giả), có phiên, có xoay refresh token. Dòng "RÀ SOÁT 14/11" đỏ trước bản sửa.
 * Cần web/node_modules — như test-qua-tai.mjs.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
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
    auth.nhatKy.push({ cua: 'logout', the, pham_vi: u.searchParams.get('scope') });
    if (auth.logoutHong) return auth.logoutHong();
    const a = auth.truyCap.get(the);
    if (!a || a.hetHan) return json(403, { code: 'bad_jwt', message: 'invalid JWT: unable to parse or verify signature, token has invalid claims: token is expired' });
    if (!auth.phien.get(a.phienId)) return json(403, { code: 'session_not_found', message: 'Session from session_id claim in JWT does not exist' });
    auth.phien.set(a.phienId, false);
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
    const { loi, cookies } = await bamDangXuat(cookieCua(t));
    ok(`${ten}: đăng xuất không ném lỗi, cookie bị xóa`, loi === null && cookies.con() === false, loi ?? '');
    ok('…không đổi refresh token khi chưa biết token có hỏng không (đổi lúc này là tốn hạn mức đang cạn)', auth.goi('token').length === 0);
  }
  // Hết hạn + cửa /token bận.
  auth.datLai();
  auth.tokenHong = () => json(429, { code: 'over_request_rate_limit', message: 'Request rate limit reached' });
  const t = auth.dangNhap({ hetHan: true });
  const { loi, cookies } = await bamDangXuat(cookieCua(t));
  ok('Token hết hạn mà cửa /token bận: vẫn đăng xuất được trên máy này', loi === null && cookies.con() === false, loi ?? '');
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
  await dangXuat(cookieCua(t), { taoTam, hanMs: 5000 });
  ok('Supabase trả lời ngay → đăng xuất xong ngay (không đợi hết hạn), phiên đã thu hồi', Date.now() - batDau < 2000 && auth.phien.get(t.phienId) === false, `${Date.now() - batDau} ms`);
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
  ok('RÀ SOÁT 14/11: trả lời đăng xuất mang Clear-Site-Data: "cache"', tl.headers.get('clear-site-data') === '"cache"', tl.headers.get('clear-site-data') ?? '(không có)');

  const ck2 = cookieCua(auth.dangNhap());
  const xem = await GET({ cookies: ck2, redirect: chuyen });
  ok('GET không đăng xuất ai: chỉ chuyển về /noi-bo, cookie còn nguyên, không xóa bộ đệm của ai',
     xem.status === 302 && xem.headers.get('location') === '/noi-bo' && ck2.con() === true && xem.headers.get('clear-site-data') === null);

  const trang = readFileSync(join(GOC, 'web/src/pages/noi-bo/dang-xuat.ts'), 'utf8');
  ok('POST đợi dangXuat(cookies) xong rồi mới trả lời', /export const POST: APIRoute = async \(\{ cookies, redirect \}\) => \{\s*await dangXuat\(cookies\);/.test(trang));
  const lib = readFileSync(join(GOC, 'web/src/lib/phien.ts'), 'utf8');
  const than = lib.slice(lib.indexOf('export async function dangXuat'), lib.indexOf('\n}\n', lib.indexOf('export async function dangXuat')));
  ok('dangXuat xóa cookie trong khối finally — thu hồi hỏng kiểu gì cũng không giữ cookie lại', /finally\s*\{\s*xoaToken\(cookies\);?\s*\}/.test(than), than.slice(0, 300));
});

process.exit(ketThuc('đăng xuất thu hồi phiên'));
