/**
 * BEEFTOWN — Kiểm thử "Supabase bận không phải là hết phiên" (web/src/lib/qua-tai.ts)
 * =================================================================================
 *
 *     node test/test-qua-tai.mjs
 *
 * Đăng nhập, gia hạn phiên và mở máy tính bảng bằng PIN đi qua cùng một cửa
 * của Supabase Auth, có hạn mức chung cho cả quán. Bản trước coi MỌI lỗi là
 * "hết phiên": đá người đang làm ra ngoài, xóa đăng nhập đã cất trên máy tính
 * bảng, bắt quản lý đăng ký lại máy, báo "sai mật khẩu" cho người gõ đúng.
 *
 * Câu hỏi, theo thứ tự quan trọng:
 *
 * 1. Lỗi THẬT của supabase-js (dựng bằng fetch giả: 429, 5xx, 52x của
 *    Cloudflare, mất mạng, trang lỗi HTML) có được xếp là TẠM THỜI không?
 *    Token hết hạn / bị thu hồi / sai mật khẩu có vẫn là TỪ CHỐI không?
 * 2. Câu báo có đủ hai thứ tiếng, và lib/phien.ts trả đúng câu đó không?
 * 3. Trang "đang bận": 503, không lưu đệm, GET tự tải lại, POST nói rõ CHƯA ghi.
 * 4. Mấy chỗ dễ bị sửa ngược: phien.ts, middleware.ts, lib/kho/may-chung.ts
 *    không xóa cookie / token khi lỗi là tạm thời.
 *
 * Cần web/node_modules (cd web && npm install) — như test-zalo-web.mjs.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { taoBoDem } from './kho-chung.mjs';
import { phanLoaiLoiAuth, laTraLoiTamThoi, trangQuaTai, CAU_DANG_NHAP_TAM, QUA_TAI } from '../../web/src/lib/qua-tai.ts';
import { dichCau } from '../../web/src/lib/cau-noi-bo.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOC = join(__dirname, '..', '..');
const WEB = join(GOC, 'web', 'src');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — SUPABASE BẬN KHÔNG PHẢI LÀ HẾT PHIÊN');

const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/i;

// supabase-js của web/ — đúng bản website đang chạy.
const requireWeb = createRequire(join(GOC, 'web', 'package.json'));
const { createClient } = await import(pathToFileURL(requireWeb.resolve('@supabase/supabase-js')).href);

// ---------------------------------------------------------------------------
// fetch GIẢ: mỗi ca đặt một hàm trả lời; đếm số lần gọi (để biết có thử lại không)
// ---------------------------------------------------------------------------
let traLoiGia = () => { throw new Error('chưa đặt câu trả lời giả'); };
let soLanGoi = 0;
globalThis.fetch = async (url, init) => { soLanGoi++; return traLoiGia(String(url), init); };

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'x-supabase-api-version': '2024-01-01' },
  });
}
function html(status, body = '<html><body>lỗi của proxy</body></html>') {
  return new Response(body, { status, headers: { 'content-type': 'text/html' } });
}
const matMang = () => { throw new TypeError('fetch failed'); };

function b64url(o) { return Buffer.from(JSON.stringify(o)).toString('base64url'); }
const JWT = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + 3600, session_id: 's1' })}.chu-ky-gia`;
const PHIEN_MOI = {
  access_token: JWT, refresh_token: 'rt-moi', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'thu@beeftown.vn', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
};

const taoClient = () => createClient('https://thu-khong-that.supabase.co', 'khoa-anon-gia', {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Chạy một lời gọi auth với câu trả lời giả; trả { error, data, soLan }. */
async function goi(traLoi, lam) {
  traLoiGia = traLoi;
  soLanGoi = 0;
  const { data, error } = await lam(taoClient());
  return { data, error, soLan: soLanGoi };
}
const dangNhap = c => c.auth.signInWithPassword({ email: 'thu@beeftown.vn', password: 'mat-khau-gia' });
const lamMoi = c => c.auth.refreshSession({ refresh_token: 'rt-cu' });
const layUser = c => c.auth.getUser(JWT);

// ===========================================================================
await nhom('1 · PHÂN LOẠI (hàm thuần)', async () => {
  const bang = [
    [{ status: 429 }, 'qua_tai', '429'],
    [{ name: 'AuthApiError', status: 429, code: 'over_request_rate_limit' }, 'qua_tai', 'over_request_rate_limit'],
    [{ name: 'AuthRetryableFetchError', status: 0 }, 'mat_ket_noi', 'mất mạng (status 0)'],
    [{ name: 'AuthRetryableFetchError', status: 503 }, 'mat_ket_noi', '503'],
    [{ name: 'AuthUnknownError' }, 'mat_ket_noi', 'trả lời không đọc được'],
    [{ name: 'AuthApiError', status: 500 }, 'mat_ket_noi', '500'],
    [{ name: 'AuthApiError', status: 408 }, 'mat_ket_noi', '408'],
    [{ name: 'AuthApiError', status: 400, code: 'refresh_token_not_found' }, 'tu_choi', 'refresh token không còn'],
    [{ name: 'AuthApiError', status: 400, code: 'refresh_token_already_used' }, 'tu_choi', 'refresh token đã dùng'],
    [{ name: 'AuthApiError', status: 403, code: 'bad_jwt' }, 'tu_choi', 'access token hết hạn'],
    [{ name: 'AuthSessionMissingError', status: 400 }, 'tu_choi', 'phiên đã bị đăng xuất'],
    [{ name: 'AuthApiError', status: 400, code: 'invalid_credentials' }, 'tu_choi', 'sai mật khẩu'],
    [null, 'mat_ket_noi', 'null (không biết → không hủy phiên)'],
    ['chuỗi lạ', 'mat_ket_noi', 'không phải object'],
    [{}, 'mat_ket_noi', 'object không status'],
  ];
  for (const [e, mong, ten] of bang) {
    const ra = phanLoaiLoiAuth(e);
    ok(`${ten} → ${mong}`, ra === mong, ra);
  }
  for (const s of [0, 408, 429, 500, 503, 504, undefined, null]) ok(`database trả ${s} → tạm thời`, laTraLoiTamThoi(s));
  for (const s of [400, 401, 403, 404, 406]) ok(`database trả ${s} → KHÔNG tạm thời`, !laTraLoiTamThoi(s));
  ok('QUA_TAI là một chuỗi (layPhien trả nó thay cho null)', QUA_TAI === 'qua_tai');
});

// ===========================================================================
await nhom('2 · LỖI THẬT CỦA supabase-js (fetch giả)', async () => {
  // Đăng nhập bằng mật khẩu — trang đăng nhập, gắn người vào máy, đăng ký máy.
  let r = await goi(() => json(429, { code: 'over_request_rate_limit', message: 'Request rate limit reached' }), dangNhap);
  ok('Đăng nhập · 429 → qua_tai', phanLoaiLoiAuth(r.error) === 'qua_tai', `${r.error?.name} ${r.error?.status}`);
  ok('Đăng nhập · 429 không bị thử lại (một lượt)', r.soLan === 1, String(r.soLan));

  r = await goi(() => json(400, { code: 'invalid_credentials', message: 'Invalid login credentials' }), dangNhap);
  ok('Đăng nhập · sai mật khẩu → tu_choi', phanLoaiLoiAuth(r.error) === 'tu_choi', `${r.error?.name} ${r.error?.status}`);

  r = await goi(() => json(503, { message: 'upstream down' }), dangNhap);
  ok('Đăng nhập · 503 → mat_ket_noi', phanLoaiLoiAuth(r.error) === 'mat_ket_noi', `${r.error?.name} ${r.error?.status}`);

  r = await goi(() => html(522), dangNhap);
  ok('Đăng nhập · 522 của Cloudflare (trang HTML) → mat_ket_noi', phanLoaiLoiAuth(r.error) === 'mat_ket_noi', `${r.error?.name} ${r.error?.status}`);

  r = await goi(() => html(429), dangNhap);
  ok('Đăng nhập · 429 dạng trang HTML (proxy) → tạm thời, không phải sai mật khẩu',
     phanLoaiLoiAuth(r.error) !== 'tu_choi', `${r.error?.name} ${r.error?.status}`);

  r = await goi(matMang, dangNhap);
  ok('Đăng nhập · mất mạng → mat_ket_noi', phanLoaiLoiAuth(r.error) === 'mat_ket_noi', `${r.error?.name} ${r.error?.status}`);

  // Gia hạn phiên — mỗi giờ một lần cho mỗi người, và MỖI LẦN mở máy bằng PIN.
  r = await goi(() => json(429, { code: 'over_request_rate_limit', message: 'Request rate limit reached' }), lamMoi);
  ok('Gia hạn · 429 → qua_tai (refresh token VẪN CÒN)', phanLoaiLoiAuth(r.error) === 'qua_tai', `${r.error?.name} ${r.error?.status}`);
  ok('Gia hạn · 429 không bị thử lại (trả lời ngay, không treo 30 giây)', r.soLan === 1, String(r.soLan));

  r = await goi(() => json(400, { code: 'refresh_token_not_found', message: 'Invalid Refresh Token: Refresh Token Not Found' }), lamMoi);
  ok('Gia hạn · refresh token không còn → tu_choi (đăng xuất là đúng)', phanLoaiLoiAuth(r.error) === 'tu_choi', `${r.error?.name} ${r.error?.status}`);

  r = await goi(() => json(400, { code: 'refresh_token_already_used', message: 'Invalid Refresh Token: Already Used' }), lamMoi);
  ok('Gia hạn · refresh token đã dùng → tu_choi', phanLoaiLoiAuth(r.error) === 'tu_choi', `${r.error?.name} ${r.error?.status}`);

  r = await goi(() => json(200, PHIEN_MOI), lamMoi);
  ok('Gia hạn · thành công → có phiên mới (fetch giả dựng đúng)', !r.error && r.data?.session?.refresh_token === 'rt-moi',
     r.error?.message ?? '');

  // Kiểm access token — mỗi lần mở trang /noi-bo.
  r = await goi(() => json(403, { code: 'bad_jwt', message: 'invalid JWT: token is expired' }), layUser);
  ok('Kiểm phiên · access token hết hạn → tu_choi (đi gia hạn)', phanLoaiLoiAuth(r.error) === 'tu_choi', `${r.error?.name} ${r.error?.status}`);

  r = await goi(() => json(403, { code: 'session_not_found', message: 'Session from session_id claim in JWT does not exist' }), layUser);
  ok('Kiểm phiên · phiên đã đăng xuất → tu_choi', phanLoaiLoiAuth(r.error) === 'tu_choi', `${r.error?.name} ${r.error?.status}`);

  r = await goi(() => json(500, { message: 'internal error' }), layUser);
  ok('Kiểm phiên · 500 → mat_ket_noi (KHÔNG đi gia hạn, không đăng xuất)', phanLoaiLoiAuth(r.error) === 'mat_ket_noi', `${r.error?.name} ${r.error?.status}`);

  r = await goi(matMang, layUser);
  ok('Kiểm phiên · mất mạng → mat_ket_noi', phanLoaiLoiAuth(r.error) === 'mat_ket_noi', `${r.error?.name} ${r.error?.status}`);

  // Database (PostgREST) — dòng nhan_su đọc sau khi kiểm phiên.
  traLoiGia = matMang;
  const db = await taoClient().from('nhan_su').select('id').eq('auth_uid', 'u1').maybeSingle();
  ok('Database · mất mạng → status 0 → tạm thời', db.error && laTraLoiTamThoi(db.status), `status ${db.status}`);
  traLoiGia = () => json(401, { code: 'PGRST301', message: 'JWT expired' });
  const db2 = await taoClient().from('nhan_su').select('id').eq('auth_uid', 'u1').maybeSingle();
  ok('Database · 401 → KHÔNG tạm thời', db2.error && !laTraLoiTamThoi(db2.status), `status ${db2.status}`);
});

// ===========================================================================
await nhom('3 · CÂU BÁO HAI THỨ TIẾNG', async () => {
  const cac = Object.entries(CAU_DANG_NHAP_TAM);
  ok('Có đủ hai loại: qua_tai, mat_ket_noi', cac.length === 2 && 'qua_tai' in CAU_DANG_NHAP_TAM && 'mat_ket_noi' in CAU_DANG_NHAP_TAM);
  for (const [loai, c] of cac) {
    ok(`${loai}: nói rõ KHÔNG phải do sai mật khẩu`, /không phải do sai mật khẩu/.test(c.vi) && /password is not the problem/.test(c.en));
    ok(`${loai}: bản tiếng Anh không còn chữ Việt`, !VIET.test(c.en), c.en);
    ok(`${loai}: dichCau ra đúng bản tiếng Anh (cau-noi-bo.ts lấy từ qua-tai.ts)`, dichCau('en', c.vi) === c.en);
  }
  const phien = readFileSync(join(WEB, 'lib', 'phien.ts'), 'utf8');
  const dn = phien.slice(phien.indexOf('export async function dangNhap'));
  const than = dn.slice(0, dn.indexOf('\n}'));
  for (const [loai, c] of cac) {
    ok(`phien.ts dangNhap trả nguyên văn câu ${loai} (không lệch với qua-tai.ts)`, than.includes(`return '${c.vi}'`));
  }
  ok('phien.ts: "Email hoặc mật khẩu không đúng." chỉ còn cho lỗi tu_choi (đứng SAU hai câu bận)',
     than.indexOf("return 'Email hoặc mật khẩu không đúng.'") > than.indexOf(`return '${CAU_DANG_NHAP_TAM.mat_ket_noi.vi}'`));
});

// ===========================================================================
await nhom('4 · TRANG "ĐANG BẬN"', async () => {
  const url = new URL('https://beeftown.vn/noi-bo/kho/xuat?loc=a&trang=2');
  const get = trangQuaTai('vi', false, url);
  const thanGet = await get.text();
  ok('503', get.status === 503, String(get.status));
  ok('Không lưu đệm (cache-control: no-store)', get.headers.get('cache-control') === 'no-store');
  const giay = Number(get.headers.get('retry-after'));
  ok('Retry-After 5–10 giây', giay >= 5 && giay <= 10, String(giay));
  ok('HTML utf-8', /text\/html; charset=utf-8/.test(get.headers.get('content-type') ?? ''));
  ok('GET tự tải lại sau đúng số giây Retry-After', thanGet.includes(`<meta http-equiv="refresh" content="${giay}">`));
  const cacGiay = new Set(Array.from({ length: 60 }, () => trangQuaTai('vi', false, url).headers.get('retry-after')));
  ok('Số giây NGẪU NHIÊN (mấy chục máy không thử lại cùng một giây)', cacGiay.size >= 3, [...cacGiay].join(','));
  ok('Luôn trong khoảng 5–10 giây', [...cacGiay].every(x => Number(x) >= 5 && Number(x) <= 10), [...cacGiay].join(','));
  ok('GET nói rõ KHÔNG bị đăng xuất', /KHÔNG bị đăng xuất/.test(thanGet));
  ok('Nút tải lại trỏ đúng trang đang mở, & được thoát', thanGet.includes('href="/noi-bo/kho/xuat?loc=a&amp;trang=2"'));
  ok('Không JavaScript, không tài nguyên ngoài', !/<script|src=|https?:\/\//i.test(thanGet));
  ok('<html lang="vi">', /<html lang="vi">/.test(thanGet));

  const post = trangQuaTai('vi', true, url);
  const thanPost = await post.text();
  ok('POST: 503', post.status === 503);
  ok('POST: nói rõ thao tác CHƯA được ghi', /CHƯA được ghi/.test(thanPost));
  ok('POST: KHÔNG tự tải lại (không tự gửi lại gì)', !/http-equiv="refresh"/.test(thanPost));

  const en = await trangQuaTai('en', false, url).text();
  ok('Tiếng Anh: <html lang="en">, nói "NOT been logged out"', /<html lang="en">/.test(en) && /NOT been logged out/.test(en));
  ok('Tiếng Anh: không còn chữ Việt', !VIET.test(en.replace(/<[^>]+>/g, ' ')), en.match(VIET)?.[0] ?? '');
  const enPost = await trangQuaTai('en', true, url).text();
  ok('Tiếng Anh POST: "NOT saved"', /NOT saved/.test(enPost) && !VIET.test(enPost.replace(/<[^>]+>/g, ' ')));
});

// ===========================================================================
await nhom('4b · NHẬT KÝ "[qua-tai]" (Cloudflare Workers Logs)', async () => {
  const { ghiQuaTai } = await import('../../web/src/lib/qua-tai.ts');
  const cu = console.warn;
  const dong = [];
  console.warn = (...a) => dong.push(a.join(' '));
  try {
    ghiQuaTai('gia hạn phiên', { name: 'AuthApiError', status: 429, code: 'over_request_rate_limit',
      message: 'Request rate limit reached for rt-bi-mat-khong-duoc-lo eyJhbGciOi.thu@beeftown.vn' });
    ghiQuaTai('đọc nhân sự', 503);
    ghiQuaTai('đăng nhập', new TypeError('fetch failed'));
  } finally { console.warn = cu; }
  ok('Ba dòng, mỗi dòng mở bằng [qua-tai]', dong.length === 3 && dong.every(d => d.startsWith('[qua-tai] ')), dong.join(' | '));
  ok('Ghi loại lỗi và mã HTTP', dong[0] === '[qua-tai] gia hạn phiên: qua_tai 429' && dong[1] === '[qua-tai] đọc nhân sự: mat_ket_noi 503'
     && dong[2] === '[qua-tai] đăng nhập: mat_ket_noi', dong.join(' | '));
  ok('KHÔNG chép câu lỗi (có thể chứa token / email) vào nhật ký', !dong.some(d => /rt-bi-mat|eyJ|@|fetch failed/.test(d)), dong.join(' | '));
});

// ===========================================================================
await nhom('5 · CHỖ DỄ BỊ SỬA NGƯỢC', async () => {
  const doc = p => readFileSync(join(WEB, p), 'utf8');
  const phien = doc('lib/phien.ts');
  const lay = phien.slice(phien.indexOf('export async function layPhien'), phien.indexOf('export async function dangNhap'));
  const iBan = lay.indexOf("if (error && phanLoaiLoiAuth(error) !== 'tu_choi') { ghiQuaTai('gia hạn phiên', error); return QUA_TAI; }");
  const iXoa = lay.indexOf('if (error || !data.session) { xoaToken(cookies); return null; }');
  ok('layPhien: gia hạn bị từ chối vì BẬN → QUA_TAI, trước dòng xóa cookie', iBan > 0 && iXoa > iBan);
  ok('layPhien: lỗi ném ra lúc gia hạn KHÔNG xóa cookie', /catch \(e\) \{ ghiQuaTai\([^)]*\); return QUA_TAI; \}/.test(lay) && !/catch \{ xoaToken/.test(lay));
  ok('layPhien: kiểm phiên lỗi tạm thời → QUA_TAI, không đi gia hạn',
     /else if \(loiUser && phanLoaiLoiAuth\(loiUser\) !== 'tu_choi'\) \{[\s\S]*?return QUA_TAI;/.test(lay));
  ok('layPhien: database bận khi đọc nhan_su → QUA_TAI (không phải "không là nhân viên")',
     lay.indexOf('if (error && laTraLoiTamThoi(status)) {') > 0
     && lay.indexOf('if (error && laTraLoiTamThoi(status)) {') < lay.indexOf('if (error || !ns) return null;'));
  const dn = phien.slice(phien.indexOf('export async function dangNhap'));
  ok('dangNhap: database bận sau khi đăng nhập → giữ phiên (không xóa cookie)',
     /if \(phien === QUA_TAI\) return null;\s*if \(!phien\) \{\s*xoaToken/.test(dn));

  const mw = doc('middleware.ts');
  ok('middleware: QUA_TAI → trang đang bận, xét TRƯỚC chỗ đưa về trang đăng nhập',
     mw.indexOf('phien === QUA_TAI') > 0 && mw.indexOf('phien === QUA_TAI') < mw.indexOf('if (!phien)')
     && /trangQuaTai\(/.test(mw));

  const may = doc('lib/kho/may-chung.ts');
  const lm = may.slice(may.indexOf('async function lamMoi'), may.indexOf('async function dangNhapTam'));
  ok('lamMoi: lỗi ném ra → TAM_LOI (không phải null = token chết)', /catch \(e\) \{ ghiQuaTai\([^)]*\); return TAM_LOI; \}/.test(lm));
  ok('lamMoi: chỉ lỗi TỪ CHỐI mới trả null', /if \(error && phanLoaiLoiAuth\(error\) === 'tu_choi'\) return null;/.test(lm));
  const ve = may.slice(may.indexOf('async function veMayKhoa'), may.indexOf('export async function khoaMay'));
  const iLamMoi = ve.indexOf('lamMoi(tb.rt)');
  ok('veMayKhoa: làm mới token máy TRƯỚC khi cất token người và xóa bt_may_tb',
     iLamMoi > 0 && iLamMoi < ve.indexOf('catTokenNguoi(') && iLamMoi < ve.indexOf('xoaCookieMay(cookies, COOKIE_MAY_TB)'));
  ok('veMayKhoa: bận → trả TAM_LOI trước khi đụng cookie nào',
     ve.indexOf('if (s === TAM_LOI) return TAM_LOI;') > iLamMoi
     && ve.indexOf('if (s === TAM_LOI) return TAM_LOI;') < ve.indexOf('xoaCookieMay('));
  const mo = may.slice(may.indexOf('export async function moKhoaNguoi'), may.indexOf('// GẮN NGƯỜI VÀO MÁY'));
  const khoiBan = mo.slice(mo.indexOf('if (s === TAM_LOI) {'), mo.indexOf('if (!s) {'));
  ok('Mở bằng PIN: bận → GIỮ cookie cất (không xóa đăng nhập đã lưu của người đó)',
     khoiBan.length > 0 && !/xoaCookieMay/.test(khoiBan) && /CAU_MAY\.quaTaiMo/.test(khoiBan));
  const kiem = may.slice(may.indexOf('export async function kiemMayChung'), may.indexOf('export async function giuMay'));
  ok('Tự khóa khi hết giờ: bận → chặn trang (không đưa về đăng nhập, không cho dùng tiếp)',
     /if \(kq\.quaTai\) return trangQuaTai\(/.test(kiem)
     && kiem.indexOf('if (kq.quaTai)') < kiem.indexOf('ghiBao(cookies, kq)'));
  ok('Phiên lạ trên máy: bận → chặn trang', /if \(kq === TAM_LOI\) return trangQuaTai\(/.test(kiem));
  const go = may.slice(may.indexOf('export async function goToiKhoiMay'), may.indexOf('// ĐĂNG KÝ MÁY'));
  ok('Gỡ tôi khỏi máy: về màn khóa TRƯỚC, thu hồi phiên SAU',
     go.indexOf('veMayKhoa(') > 0 && go.indexOf('veMayKhoa(') < go.indexOf('await thuHoi('));
  ok('Gắn người / đăng ký máy: sai mật khẩu khác với Supabase bận', (may.match(/cauDangNhapHong\(/g) ?? []).length >= 4);
});

process.exit(ketThuc('SUPABASE BẬN'));
