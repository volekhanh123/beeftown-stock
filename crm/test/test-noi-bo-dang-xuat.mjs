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
 * bản thật (local: chỉ phiên này; bỏ trống hoặc global: mọi phiên của người đó).
 * Dòng "RÀ SOÁT 14/11" đỏ trước bản sửa. Dòng ghi thêm "(vòng hai)" / "(vòng ba)" là của các vòng rà soát
 * sau: có dòng là lỗi vòng đó tìm ra (đỏ trước bản sửa của nó), có dòng chỉ là phép kiểm chặt hơn cho mã đã đúng
 * từ bản sửa đầu — loại này chỉ đỏ khi cố tình làm hỏng đúng chỗ mã nó giữ.
 * Cần web/node_modules — như test-qua-tai.mjs.
 *
 * Vòng hai của rà soát (14/11/2026) thêm:
 *   · nhóm 2, 3: phạm vi "local" được kiểm ở CẢ hai đường thu hồi — Auth giả cũ bỏ qua phạm vi nên bỏ tham số đi
 *     (mặc định của supabase-js là đăng xuất mọi máy) không kiểm tra nào đỏ;
 *   · nhóm 5: lượt /logout cuối của đường "token hết hạn" hỏng thì phải có một dòng nhật ký;
 *   · nhóm 7b: trên Worker, việc còn dở lúc trang trả lời bị cắt — lượt thu hồi chậm hơn hạn đợi phải được giao cho
 *     waitUntil;
 *   · nhóm 8b, 9: nút Quay lại sau khi đăng xuất. Vòng ba (trình duyệt thật, đăng nhập thật qua Supabase giả) chỉ ra
 *     bản đầu của phần này — một file tải riêng, nhớ lần bấm bằng biến và giờ trong localStorage — hở ở ba chỗ: file
 *     tải hỏng thì trang không còn gì che; trang cũ lóe một khung hình trước khi tải lại; phần "tab khác" dựa vào
 *     đồng hồ máy. Bản này lấy tín hiệu từ MÁY CHỦ: xoaToken đổi cookie bt_dau_phien (dấu phiên — một chuỗi ngẫu
 *     nhiên, không httpOnly, không mang gì của phiên) mỗi lần cookie phiên bị xóa; trang ghi dấu lúc máy chủ dựng nó
 *     và so lại ở ba lúc — rời trang, hiện lại từ bộ nhớ quay lại, và lúc tải khi trình duyệt dựng lại trang từ bản
 *     lưu đệm cũ vì bấm Quay lại (web/src/lib/sau-dang-xuat.js, in thẳng vào trang qua
 *     web/src/components/SauDangXuat.astro). Lúc thứ ba để lớp này không phải trông vào Clear-Site-Data.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { taoBoDem } from './kho-chung.mjs';
import { dangXuat, xoaToken, COOKIE_DAU_PHIEN } from '../../web/src/lib/phien.ts';

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
function hopCookie(giaTri, { datHong = false } = {}) {
  const kho = new Map(giaTri === undefined ? [] : [['bt_phien', giaTri]]);
  const tuyChon = new Map();
  return {
    get: ten => (kho.has(ten) ? { value: kho.get(ten) } : undefined),
    set: (ten, v, tc) => { if (datHong) throw new Error('cookies.set hỏng'); kho.set(ten, v); tuyChon.set(ten, tc); },
    delete: ten => { kho.delete(ten); },
    con: () => kho.has('bt_phien'),
    /** Dấu phiên (cookie bt_dau_phien) đang nằm trong hộp, và tùy chọn nó được đặt cùng. */
    dau: () => kho.get('bt_dau_phien'),
    tuyChonDau: () => tuyChon.get('bt_dau_phien'),
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
/** Nhật ký không mang access token, refresh token của cặp `t`, và không có địa chỉ email nào. */
const khongLoBiMat = (dong, t) => {
  const chu = dong.join(' ');
  return !chu.includes(t.access_token) && !chu.includes(t.refresh_token) && !/@/.test(chu);
};

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
       dongThuHoi(dong).length === 1 && khongLoBiMat(dong, t), dong.join(' | '));
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
    const tokenMoi = [...auth.truyCap.keys()].filter(k => k !== cu.access_token).concat([...auth.lamMoi.keys()]);
    ok('…dòng nhật ký đó không mang token (cả cặp token vừa đổi) hay email',
       khongLoBiMat(dong, cu) && !tokenMoi.some(k => dong.join(' ').includes(k)), dong.join(' | '));
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
    let soGiaoNgay = -1;
    const dong = await batCanhBao(() => {
      const dangCho = dangXuat(cookies, { taoTam, hanMs: 300, chayNen: viec => { nen.push(viec); } });
      soGiaoNgay = nen.length;      // dangXuat vừa được gọi, CHƯA đợi gì
      return dangCho;
    });
    const mat = Date.now() - luc;
    // Giao ngay từ đầu, không phải sau hạn đợi: người bấm Đăng xuất rồi đóng tab giữa chừng thì Worker có thể hủy
    // việc chưa giao cho waitUntil (tài liệu giới hạn của Cloudflare Workers).
    ok('RÀ SOÁT 14/11 (vòng ba): lượt thu hồi được giao cho việc chạy nền NGAY khi bắt đầu, trước khi đợi', soGiaoNgay === 1, `${soGiaoNgay} lần giao lúc dangXuat vừa được gọi`);
    ok('RÀ SOÁT 14/11 (vòng hai): Supabase chậm hơn hạn đợi → trang vẫn trả lời đúng hạn, cookie bị xóa',
       mat >= 250 && mat < 1400 && cookies.con() === false, `${mat} ms`);
    ok('RÀ SOÁT 14/11 (vòng hai): …lượt thu hồi được giao cho việc chạy nền — đúng một promise',
       nen.length === 1 && typeof nen[0]?.then === 'function', `${nen.length} lần giao`);
    ok('RÀ SOÁT 14/11 (vòng hai): …lúc trang trả lời phiên chưa kịp thu hồi, và có đúng một dòng nhật ký nói vậy',
       auth.phien.get(cham.phienId) === true && dongThuHoi(dong).length === 1, dong.join(' | ') || '(không dòng nào)');
    ok('…dòng nhật ký đó không mang token hay email', khongLoBiMat(dong, cham), dong.join(' | '));
    await nen[0];
    ok('RÀ SOÁT 14/11 (vòng hai): …việc chạy nền xong thì phiên đã bị thu hồi', auth.phien.get(cham.phienId) === false);
  } finally {
    globalThis.fetch = fetchNhanh;
  }
  ok('Supabase trả lời trong hạn: lượt thu hồi cũng được giao cho việc chạy nền (một promise, đã xong)', nenNhanh.length === 1);
  // Vòng ba 14/11: giao việc mà hỏng (không có ngữ cảnh Worker hợp lệ, waitUntil ném lỗi) thì đăng xuất vẫn phải xong —
  // lỗi đó mà lọt ra ngoài là trang trả 500 và lệnh xóa cookie không về tới trình duyệt.
  auth.datLai();
  const giaoHong = auth.dangNhap();
  const ckGiaoHong = cookieCua(giaoHong);
  let loiGiao = null;
  try { await dangXuat(ckGiaoHong, { taoTam, chayNen: () => { throw new TypeError('Illegal invocation'); } }); } catch (e) { loiGiao = String(e?.message ?? e); }
  ok('RÀ SOÁT 14/11 (vòng ba): giao việc chạy nền mà ném lỗi → đăng xuất vẫn xong, cookie bị xóa, phiên vẫn bị thu hồi',
     loiGiao === null && ckGiaoHong.con() === false && auth.phien.get(giaoHong.phienId) === false, loiGiao ?? '');
  // …và vẫn ĐỢI lượt thu hồi trong hạn: không ai giữ được việc chạy nền thì lúc trang trả lời là lúc Worker cắt nó.
  // Supabase trả lời sau 300 mili-giây, hạn đợi 3 giây: dangXuat phải về sau khi phiên đã thu hồi, không dòng nhật ký.
  auth.datLai();
  const giaoHongCham = auth.dangNhap();
  const fetchGoc = globalThis.fetch;
  globalThis.fetch = async (...thamSo) => { await new Promise(xong => setTimeout(xong, 300)); return fetchGoc(...thamSo); };
  try {
    const lucGiao = Date.now();
    let daThuHoiLucVe = null;
    const dongGiao = await batCanhBao(async () => {
      await dangXuat(cookieCua(giaoHongCham), { taoTam, hanMs: 3000, chayNen: () => { throw new TypeError('Illegal invocation'); } });
      daThuHoiLucVe = auth.phien.get(giaoHongCham.phienId) === false;
    });
    const matGiao = Date.now() - lucGiao;
    ok('RÀ SOÁT 14/11 (vòng ba): …giao việc hỏng thì vẫn đợi lượt thu hồi trong hạn — lúc dangXuat về, phiên đã thu hồi, không dòng nhật ký nào',
       daThuHoiLucVe === true && matGiao >= 250 && matGiao < 2500 && dongGiao.length === 0, `${matGiao} ms · đã thu hồi lúc về: ${daThuHoiLucVe} · ${dongGiao.join(' | ')}`);
  } finally {
    globalThis.fetch = fetchGoc;
  }
  ok('Không có ngữ cảnh Worker (chayNen không truyền): dangXuat vẫn chạy như cũ', (await bamDangXuat(cookieCua(auth.dangNhap()))).loi === null);

  // Vòng ba 14/11: MỌI lỗi bất ngờ ở bước thu hồi (ở đây: dựng client hỏng — biến môi trường sai dạng chẳng hạn) đều
  // không được thành trang 500. Người bấm vẫn về trang đăng nhập, cookie bị xóa, dấu phiên đổi; và có một dòng nhật
  // ký để chủ biết phiên ở Supabase chưa được thu hồi.
  auth.datLai();
  const batNgo = auth.dangNhap();
  const ckBatNgo = cookieCua(batNgo);
  let loiBatNgo = null;
  const dongBatNgo = await batCanhBao(async () => {
    try { await dangXuat(ckBatNgo, { taoTam: () => { throw new Error(`Invalid supabaseUrl: ${batNgo.access_token}`); } }); } catch (e) { loiBatNgo = String(e?.message ?? e); }
  });
  ok('RÀ SOÁT 14/11 (vòng ba): bước thu hồi gặp lỗi bất ngờ (dựng client hỏng) → đăng xuất không ném lỗi, cookie bị xóa, dấu phiên đổi',
     loiBatNgo === null && ckBatNgo.con() === false && /^[0-9a-f-]{36}$/.test(ckBatNgo.dau() ?? ''), loiBatNgo ?? `dấu: ${ckBatNgo.dau()}`);
  ok('RÀ SOÁT 14/11 (vòng ba): …và có đúng một dòng nhật ký [qua-tai], không mang token hay chữ của lỗi',
     dongThuHoi(dongBatNgo).length === 1 && khongLoBiMat(dongBatNgo, batNgo) && !/supabaseUrl/.test(dongBatNgo.join(' ')), dongBatNgo.join(' | ') || '(không dòng nào)');
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
  // dấu phiên và đoạn mã ở đầu trang lo (nhóm 8b, 9).
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
  // Ghim đúng thứ tự câu lệnh đầu hàm: lấy ngữ cảnh Worker, rồi `await dangXuat(…)` là câu lệnh thứ hai — không phải
  // chỉ "có chữ await dangXuat ở đâu đó" (vòng ba 14/11: bản lỏng hơn vẫn xanh khi lời gọi bị bọc trong một hàm
  // không ai đợi, hay chỉ còn nằm trong chú thích; lúc đó trang trả lời trước khi cookie bị xóa).
  const DAU_HAM = /export const POST: APIRoute = async \(\{ cookies, redirect, locals \}\) => \{\s*const nguCanh = [^;\n]*;\s*await dangXuat\(cookies, \{ chayNen: viec => nguCanh\?\.waitUntil\?\.\(viec\) \}\);\s*const traLoi = redirect\(/;
  ok('POST đợi dangXuat xong rồi mới trả lời (await dangXuat là câu lệnh đứng ngay trước câu dựng trả lời)',
     DAU_HAM.test(trang), trang.slice(trang.indexOf('export const POST'), trang.indexOf('export const POST') + 300));
  for (const [ten, bien] of [
    ['bọc trong một hàm không ai đợi', m => m.replace('  await dangXuat(cookies, {', '  void (async () => { await dangXuat(cookies, {').replace(') });\n  const traLoi', ') }); })();\n  const traLoi')],
    ['bỏ await', m => m.replace('  await dangXuat(cookies, {', '  dangXuat(cookies, {')],
    ['chỉ còn trong chú thích', m => m.replace('  await dangXuat(cookies, {', '  // await dangXuat(cookies, {')],
  ]) {
    const hong = bien(trang);
    ok(`…mẫu kiểm đó đỏ khi lời gọi bị ${ten}`, hong !== trang && !DAU_HAM.test(hong));
  }
  ok('RÀ SOÁT 14/11 (vòng hai): POST giao lượt thu hồi cho waitUntil của Worker (locals.cfContext)',
     /const nguCanh = \(locals as [^;]*\)\?\.cfContext;/.test(trang) && /chayNen: viec => nguCanh\?\.waitUntil\?\.\(viec\)/.test(trang));
  const lib = readFileSync(join(GOC, 'web/src/lib/phien.ts'), 'utf8');
  const than = lib.slice(lib.indexOf('export async function dangXuat'), lib.indexOf('\n}\n', lib.indexOf('export async function dangXuat')));
  ok('dangXuat xóa cookie trong khối finally — thu hồi hỏng kiểu gì cũng không giữ cookie lại', /finally\s*\{\s*xoaToken\(cookies\);?\s*\}/.test(than), than.slice(0, 300));
});

// ===========================================================================
await nhom('8b · Dấu phiên: mỗi lần cookie phiên bị xóa, máy chủ đổi cookie bt_dau_phien', async () => {
  // Trang nội bộ không tự biết phiên đã kết thúc khi trình duyệt đưa nó trở lại từ bộ nhớ quay lại (không có lượt
  // hỏi máy chủ nào). Tín hiệu phải đến từ máy chủ, và phải đọc được bằng JavaScript: một cookie KHÔNG httpOnly chỉ
  // mang một chuỗi ngẫu nhiên. Cookie phiên (bt_phien) vẫn httpOnly như cũ.
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  ok('Tên cookie dấu phiên là bt_dau_phien', COOKIE_DAU_PHIEN === 'bt_dau_phien', String(COOKIE_DAU_PHIEN));

  auth.datLai();
  const t = auth.dangNhap();
  const cookies = cookieCua(t);
  ok('Đang đăng nhập: chưa có dấu phiên nào (phiên có từ trước bản này vẫn chạy)', cookies.dau() === undefined);
  await bamDangXuat(cookies);
  const dau1 = cookies.dau();
  ok('RÀ SOÁT 14/11 (vòng ba): đăng xuất đặt dấu phiên mới — một chuỗi ngẫu nhiên', UUID.test(dau1 ?? ''), String(dau1));
  const tc = cookies.tuyChonDau() ?? {};
  ok('…cookie đó JavaScript đọc được (không httpOnly), chỉ gửi dưới /noi-bo, SameSite=Lax, sống đủ lâu',
     tc.httpOnly === false && tc.path === '/noi-bo' && tc.sameSite === 'lax' && tc.maxAge >= 60 * 60 * 24 * 30, JSON.stringify(tc));
  ok('…và không mang gì của phiên: không access token, không refresh token, không mã phiên',
     !dau1.includes(t.access_token) && !dau1.includes(t.refresh_token) && dau1 !== t.phienId && !t.access_token.includes(dau1));
  await bamDangXuat(cookies);
  ok('Đăng xuất lần nữa (không còn cookie phiên): dấu lại đổi — hai lần đăng xuất không bao giờ cho cùng một dấu',
     UUID.test(cookies.dau() ?? '') && cookies.dau() !== dau1, `${dau1} → ${cookies.dau()}`);

  // xoaToken là chỗ duy nhất xóa cookie phiên (đăng xuất, phiên bị Supabase từ chối, máy dùng chung mất phiên máy):
  // đổi dấu nằm ngay trong nó, nên đường nào cũng đổi.
  const hop = hopCookie(JSON.stringify({ access_token: 'a', refresh_token: 'b' }));
  xoaToken(hop);
  ok('xoaToken: xóa cookie phiên VÀ đổi dấu phiên', hop.con() === false && UUID.test(hop.dau() ?? ''), String(hop.dau()));
  // Không đặt được dấu (hộp cookie hỏng) thì việc xóa cookie phiên vẫn phải xong, không ném lỗi ra trang.
  const hong = hopCookie(JSON.stringify({ access_token: 'a', refresh_token: 'b' }), { datHong: true });
  let loi = null;
  try { xoaToken(hong); } catch (e) { loi = String(e?.message ?? e); }
  ok('Đặt dấu hỏng → xoaToken không ném lỗi, cookie phiên vẫn bị xóa', loi === null && hong.con() === false, loi ?? '');

  const lib = readFileSync(join(GOC, 'web/src/lib/phien.ts'), 'utf8');
  const thanGhi = lib.slice(lib.indexOf('function ghiToken'), lib.indexOf('\n}\n', lib.indexOf('function ghiToken')));
  ok('Làm mới token (ghiToken) KHÔNG đổi dấu — không thì mỗi giờ một lần, bấm Quay lại là mất chữ đang gõ',
     thanGhi.length > 0 && !/doiDauPhien|COOKIE_DAU_PHIEN/.test(thanGhi), thanGhi.slice(0, 200));
  ok('Cookie phiên vẫn httpOnly', /cookies\.set\(COOKIE_PHIEN, JSON\.stringify\(t\), \{\s*httpOnly: true,/.test(lib));
});

// ===========================================================================
await nhom('9 · Nút Quay lại sau khi đăng xuất: trang của phiên đã kết thúc không hiện lại từ bộ nhớ của trình duyệt', async () => {
  // web/src/lib/sau-dang-xuat.js chạy ở đầu mọi trang nội bộ (in thẳng vào trang — không phải một file tải riêng). Ở
  // đây chạy chính file đó với cửa sổ giả; trên bản build thật, trình duyệt thật có bfcache: web/kiem-tra/
  // trinh-duyet.mjs nhóm 4.
  const DUONG_MA = join(GOC, 'web/src/lib/sau-dang-xuat.js');
  let ma = '';
  try { ma = readFileSync(DUONG_MA, 'utf8'); } catch { /* chưa có file: mọi kiểm tra bên dưới đỏ */ }
  ok('RÀ SOÁT 14/11 (vòng ba): có file web/src/lib/sau-dang-xuat.js', ma.length > 0);

  /**
   * Một trang nội bộ. dauLucDung: dấu phiên máy chủ in vào trang (undefined = không có thẻ script / thuộc tính).
   * hop.cookie: chuỗi document.cookie hiện tại (đổi được giữa chừng); hop.hong = true thì đọc cookie ném lỗi.
   * hop.kieuTai: trang này được tải theo kiểu nào, như trình duyệt báo qua performance — 'navigate', 'reload',
   *   'back_forward'; 'cu:<số>' = trình duyệt cũ chỉ có performance.navigation.type; 'nem' = hỏi thì ném lỗi;
   *   bỏ trống = trình duyệt không có performance.
   */
  function moTrang(dauLucDung, hop) {
    const nghe = {};
    const tt = { taiLai: 0 };
    const goc = { style: {} };
    const document = {
      documentElement: goc,
      currentScript: dauLucDung === undefined ? null : { getAttribute: ten => (ten === 'data-dau-phien' ? dauLucDung : null) },
      get cookie() { if (hop.hong) throw new Error('SecurityError'); return hop.cookie; },
      set cookie(v) { tt.ghiCookie = v; },
    };
    const kieu = hop.kieuTai;
    const performance = kieu === undefined ? undefined
      : kieu === 'nem' ? { getEntriesByType: () => { throw new Error('không cho đọc'); } }
      : kieu.startsWith('cu:') ? { navigation: { type: Number(kieu.slice(3)) } }
      : { getEntriesByType: loai => (loai === 'navigation' ? [{ type: kieu }] : []) };
    const window = {
      location: { reload: () => { tt.taiLai += 1; } },
      addEventListener: (ten, ham) => { (nghe[ten] ??= []).push(ham); },
      performance,
    };
    let loi = null;
    try { vm.runInNewContext(ma, { window, document }); } catch (e) { loi = String(e?.message ?? e); }
    // Ngay sau khi mã chạy xong trong <head>, trước mọi sự kiện: trang đã bị giấu chưa, đã gọi tải lại mấy lần.
    const giauLucTai = goc.style.visibility === 'hidden';
    const taiLaiLucTai = tt.taiLai;
    const ban = (ten, suKien) => { for (const ham of nghe[ten] ?? []) ham(suKien); };
    return {
      loi, giauLucTai, taiLaiLucTai,
      roiTrang: () => ban('pagehide', { persisted: true }),
      /** Trang hiện ra: tuBoNho = true là lấy từ bộ nhớ quay lại (pageshow, persisted). */
      hienRa: tuBoNho => ban('pageshow', { persisted: tuBoNho }),
      taiLai: () => tt.taiLai,
      biGiau: () => goc.style.visibility === 'hidden',
      daGhiCookie: () => tt.ghiCookie !== undefined,
    };
  }
  const DAU_X = '11111111-1111-4111-8111-111111111111', DAU_Y = '22222222-2222-4222-8222-222222222222';
  const ck = dau => `nb_ngon_ngu=vi; ${dau === null ? '' : `bt_dau_phien=${dau}; `}khac=1`;

  // a) Không ai đăng xuất.
  const hopA = { cookie: ck(DAU_X) };
  const a = moTrang(DAU_X, hopA);
  ok('File chạy được với cửa sổ giả', a.loi === null, a.loi ?? '');
  a.roiTrang(); a.hienRa(true);
  ok('Dấu phiên không đổi: rời trang không bị giấu, Quay lại từ bộ nhớ KHÔNG tải lại (chữ đang gõ dở còn nguyên)',
     a.taiLai() === 0 && !a.biGiau());

  // b) Bấm Đăng xuất ở chính trang này: trả lời đăng xuất đổi dấu TRƯỚC khi trang rời đi.
  const hopB = { cookie: ck(DAU_X) };
  const b = moTrang(DAU_X, hopB);
  hopB.cookie = ck(DAU_Y);
  b.roiTrang();
  ok('RÀ SOÁT 14/11 (vòng ba): đăng xuất rồi rời trang → trang bị giấu NGAY lúc rời (bản trình duyệt cất đi là bản đã giấu, không lóe ra khi Quay lại)',
     b.biGiau() && b.taiLai() === 0);
  b.hienRa(false);
  ok('…trang hiện theo lối thường (không từ bộ nhớ) thì không tải lại', b.taiLai() === 0);
  b.hienRa(true);
  ok('RÀ SOÁT 14/11 (vòng ba): …Quay lại từ bộ nhớ → tải lại đúng một lần, trang vẫn giấu', b.taiLai() === 1 && b.biGiau(), `tải lại ${b.taiLai()} lần`);

  // c) Tab khác đăng xuất khi trang này ĐÃ nằm trong bộ nhớ quay lại.
  const hopC = { cookie: ck(DAU_X) };
  const c = moTrang(DAU_X, hopC);
  c.roiTrang();
  ok('Rời trang lúc dấu chưa đổi: không giấu', !c.biGiau());
  hopC.cookie = ck(DAU_Y);
  c.hienRa(true);
  ok('RÀ SOÁT 14/11 (vòng ba): tab khác đăng xuất khi trang đang nằm trong bộ nhớ → Quay lại thì giấu và tải lại', c.taiLai() === 1 && c.biGiau());

  // d) Phiên có từ trước bản này: trang không có dấu ('') — đăng xuất đặt dấu đầu tiên.
  const hopD = { cookie: ck(null) };
  const d = moTrang('', hopD);
  d.roiTrang(); d.hienRa(true);
  ok('Trang không có dấu, cookie cũng không có dấu: coi là không đổi', d.taiLai() === 0 && !d.biGiau());
  hopD.cookie = ck(DAU_Y);
  d.roiTrang(); d.hienRa(true);
  ok('…đăng xuất đặt dấu đầu tiên → trang đó được tải lại', d.taiLai() === 1 && d.biGiau());

  // e) Tab khác đăng xuất trong lúc trang này còn đang tải: máy chủ đã dựng trang dưới dấu cũ, cookie đã là dấu mới.
  const e = moTrang(DAU_X, { cookie: ck(DAU_Y) });
  e.roiTrang(); e.hienRa(true);
  ok('RÀ SOÁT 14/11 (vòng ba): dấu máy chủ in vào trang khác dấu trình duyệt đang giữ ngay từ lúc tải → vẫn là trang cũ: giấu, tải lại',
     e.taiLai() === 1 && e.biGiau());

  // f) Đã biết là trang cũ thì luôn là trang cũ — kể cả khi cookie sau đó trở về đúng giá trị cũ (bị xóa tay…).
  const hopF = { cookie: ck(null) };
  const f = moTrang('', hopF);
  hopF.cookie = ck(DAU_Y); f.roiTrang();
  hopF.cookie = ck(null); f.hienRa(true);
  ok('Trang đã bị giấu lúc rời thì khi hiện lại luôn tải lại, dù cookie đã trở về như cũ (không để lại một trang trắng)', f.taiLai() === 1);

  // g) Không đọc được cookie, hay thiếu thẻ / thuộc tính: coi như đã đổi — thà tải lại thừa còn hơn hiện trang cũ.
  const g = moTrang(DAU_X, { cookie: ck(DAU_X), hong: true });
  let loiG = null;
  try { g.roiTrang(); g.hienRa(true); } catch (loi) { loiG = String(loi?.message ?? loi); }
  ok('Đọc cookie ném lỗi → không ném lỗi ra trang; trang được giấu và tải lại', g.loi === null && loiG === null && g.taiLai() === 1 && g.biGiau(), loiG ?? '');
  const h = moTrang(undefined, { cookie: ck(DAU_X) });
  h.roiTrang(); h.hienRa(true);
  ok('Không tìm thấy thẻ script của chính nó → coi như đã đổi', h.loi === null && h.taiLai() === 1);
  // Kể cả khi trình duyệt chưa có dấu nào: "không thấy thẻ" khác "thẻ ghi dấu rỗng" — không biết trang được dựng dưới
  // dấu nào thì không được coi là khớp.
  const h2 = moTrang(undefined, { cookie: ck(null) });
  h2.roiTrang();
  const h2Giau = h2.biGiau();
  h2.hienRa(true);
  ok('…kể cả khi trình duyệt chưa có dấu nào: vẫn giấu lúc rời và tải lại', h2.loi === null && h2Giau && h2.taiLai() === 1, `giấu lúc rời: ${h2Giau} · tải lại ${h2.taiLai()} lần`);

  // h) Chỉ khớp ĐÚNG tên cookie.
  for (const [ten, chuoi] of [
    ['cookie tên dài hơn (bt_dau_phien_khac)', `bt_dau_phien_khac=${DAU_Y}; bt_dau_phien=${DAU_X}`],
    ['cookie tên có tiền tố (xbt_dau_phien)', `xbt_dau_phien=${DAU_Y}; bt_dau_phien=${DAU_X}`],
    ['dấu nằm cuối chuỗi, không có dấu chấm phẩy', `khac=1; bt_dau_phien=${DAU_X}`],
    ['dấu nằm đầu chuỗi', `bt_dau_phien=${DAU_X}; khac=1`],
  ]) {
    const k = moTrang(DAU_X, { cookie: chuoi });
    k.roiTrang(); k.hienRa(true);
    ok(`Đọc đúng dấu khi ${ten}`, k.taiLai() === 0 && !k.biGiau());
  }

  // i) Bấm Quay lại mà trình duyệt DỰNG LẠI trang từ bản lưu đệm của nó — không lấy nguyên trang từ bộ nhớ quay lại,
  //    cũng không hỏi máy chủ. Bản đó mang dấu cũ. Mã chạy ngay trong <head> phải giấu và tải lại, không trông vào
  //    việc trình duyệt có nghe lệnh Clear-Site-Data của trả lời đăng xuất hay không (Chrome nghe; trình duyệt khác
  //    chưa thử).
  const i1 = moTrang(DAU_X, { cookie: ck(DAU_Y), kieuTai: 'back_forward' });
  ok('RÀ SOÁT 14/11 (vòng ba): bấm Quay lại, trình duyệt dựng lại trang từ bản lưu đệm mang dấu cũ → giấu NGAY lúc tải và tải lại đúng một lần',
     i1.loi === null && i1.giauLucTai && i1.taiLaiLucTai === 1, `giấu lúc tải: ${i1.giauLucTai} · tải lại ${i1.taiLaiLucTai} lần`);
  const i2 = moTrang(DAU_X, { cookie: ck(DAU_X), kieuTai: 'back_forward' });
  ok('…dấu không đổi (không ai đăng xuất): bấm Quay lại không giấu, không tải lại — chữ trình duyệt điền lại vào form vẫn còn',
     !i2.giauLucTai && i2.taiLaiLucTai === 0);
  const i3 = moTrang(DAU_X, { cookie: ck(DAU_Y), kieuTai: 'reload' });
  ok('RÀ SOÁT 14/11 (vòng ba): …trang VỪA được tải lại mà dấu vẫn lệch → không tải lại nữa (không bao giờ thành vòng lặp)',
     !i3.giauLucTai && i3.taiLaiLucTai === 0, `tải lại ${i3.taiLaiLucTai} lần`);
  i3.roiTrang();
  ok('…nhưng trang đó vẫn bị giấu lúc rời, như mọi trang lệch dấu', i3.biGiau());
  const i4 = moTrang(DAU_X, { cookie: ck(DAU_Y), kieuTai: 'navigate' });
  ok('…mở trang theo lối thường (bấm link, gõ địa chỉ) → không tải lại lúc tải', !i4.giauLucTai && i4.taiLaiLucTai === 0);
  const i5 = moTrang(DAU_X, { cookie: ck(DAU_Y) });
  ok('…trình duyệt không cho biết kiểu tải → không tải lại lúc tải (thiếu lớp này còn hơn tải lại vô hạn)',
     i5.loi === null && !i5.giauLucTai && i5.taiLaiLucTai === 0);
  const i6 = moTrang(DAU_X, { cookie: ck(DAU_Y), kieuTai: 'cu:2' });
  ok('…trình duyệt cũ chỉ có performance.navigation: kiểu 2 (lùi / tiến) → giấu và tải lại một lần', i6.giauLucTai && i6.taiLaiLucTai === 1);
  const i7 = moTrang(DAU_X, { cookie: ck(DAU_Y), kieuTai: 'cu:1' });
  ok('…performance.navigation kiểu 1 (vừa tải lại) → không tải lại nữa', !i7.giauLucTai && i7.taiLaiLucTai === 0);
  const i8 = moTrang(DAU_X, { cookie: ck(DAU_Y), kieuTai: 'nem' });
  ok('…hỏi kiểu tải mà ném lỗi → không ném lỗi ra trang, không tải lại lúc tải', i8.loi === null && !i8.giauLucTai && i8.taiLaiLucTai === 0, i8.loi ?? '');
  const i9 = moTrang(undefined, { cookie: ck(null), kieuTai: 'back_forward' });
  ok('…không thấy thẻ của chính mình, bấm Quay lại → giấu và tải lại một lần (rồi là trang kiểu "reload": dừng)', i9.giauLucTai && i9.taiLaiLucTai === 1);

  ok('File chỉ ĐỌC cookie: không ghi cookie, không gọi mạng, không dùng localStorage hay sessionStorage, không dựa vào đồng hồ',
     ma.length > 0 && !a.daGhiCookie() && !/document\.cookie\s*=[^=]|fetch\(|XMLHttpRequest|localStorage|sessionStorage|Date\.now|new Date|performance\.now|timeOrigin/.test(ma.slice(ma.indexOf('(function'))));
  ok('Tên cookie trong file đúng là COOKIE_DAU_PHIEN của lib/phien.ts', ma.includes(`${COOKIE_DAU_PHIEN}=`));
  ok('File không chứa chuỗi đóng thẻ script (nó được in thẳng vào trang)', ma.length > 0 && !/<\/script/i.test(ma));

  // In thẳng vào trang qua một component dùng chung — không phải thẻ <script src> (lượt tải riêng hỏng là mất lớp này).
  let tp = '';
  try { tp = readFileSync(join(GOC, 'web/src/components/SauDangXuat.astro'), 'utf8'); } catch { /* chưa có */ }
  ok('RÀ SOÁT 14/11 (vòng ba): components/SauDangXuat.astro in mã vào trang kèm dấu phiên máy chủ đang thấy',
     /import ma from '\.\.\/lib\/sau-dang-xuat\.js\?raw';/.test(tp) && /Astro\.cookies\.get\(COOKIE_DAU_PHIEN\)\?\.value \?\? ''/.test(tp)
     && /<script is:inline data-dau-phien=\{dau\} set:html=\{MA\}><\/script>/.test(tp), tp.slice(0, 300));
  for (const khung of ['web/src/layouts/NoiBo.astro', 'web/src/layouts/Kho.astro']) {
    const nguon = readFileSync(join(GOC, khung), 'utf8');
    const dauTrang = nguon.slice(nguon.indexOf('<head>'), nguon.indexOf('</head>'));
    ok(`RÀ SOÁT 14/11 (vòng ba): ${khung} đặt <SauDangXuat /> trong <head>, không điều kiện, và không còn thẻ script tải file riêng`,
       /import SauDangXuat from '\.\.\/components\/SauDangXuat\.astro';/.test(nguon) && /\n\s*<SauDangXuat \/>\n/.test(dauTrang)
       && (nguon.match(/<SauDangXuat \/>/g) ?? []).length === 1 && !/sau-dang-xuat\.js/.test(nguon));
  }
  ok('Không còn file tải riêng public/kho/js/sau-dang-xuat.js', !existsSync(join(GOC, 'web/public/kho/js/sau-dang-xuat.js')));
  const moiAstro = thuMuc => readdirSync(thuMuc, { withFileTypes: true, recursive: true })
    .filter(f => f.isFile() && f.name.endsWith('.astro')).map(f => join(f.parentPath ?? f.path, f.name));
  const coForm = moiAstro(join(GOC, 'web/src')).filter(f => /dang-xuat"/.test(readFileSync(f, 'utf8')));
  const sai = coForm.filter(f => {
    const nguon = readFileSync(f, 'utf8');
    const dungDang = (nguon.match(/dang-xuat"/g) ?? []).length === (nguon.match(/<form method="POST" action="\/noi-bo\/dang-xuat"/g) ?? []).length;
    const trongKhung = /layouts[\\/](NoiBo|Kho)\.astro$/.test(f) || /from '[^']*layouts\/(NoiBo|Kho)\.astro'/.test(nguon);
    return !(dungDang && trongKhung);
  });
  ok(`Mọi form Đăng xuất (${coForm.length} file) gửi POST tới /noi-bo/dang-xuat và nằm trong khung NoiBo hoặc Kho`,
     coForm.length >= 3 && sai.length === 0, sai.map(f => relative(GOC, f)).join(', '));
});

process.exit(ketThuc('đăng xuất thu hồi phiên'));
