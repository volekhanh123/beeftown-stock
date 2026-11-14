/**
 * BEEFTOWN KHO — Kiểm thử: đổi PIN trên máy tính bảng dùng chung phải nhập mật khẩu tài khoản
 * ========================================================================================
 *
 *     node test/test-kho-may-doi-pin.mjs
 *
 * Rà soát bảo mật 14/11/2026. Trang /noi-bo/kho/may/gan, phần "Đổi PIN của tôi", chỉ đòi PIN mới: không PIN cũ,
 * không mật khẩu. Một người rời máy mà chưa bấm "Khóa máy" thì ai cầm máy trong khoảng tự khóa (mặc định 5 phút)
 * vào đó đặt PIN mới — rồi về sau mở máy dưới tên người kia bất cứ lúc nào, việc họ làm ghi tên người kia. Nếu
 * người kia là quản lý thì duyệt được phiếu. Nhật ký chỉ ghi "tự đổi PIN".
 *
 * Bản sửa: doiPin (web/src/lib/kho/may-chung.ts) đòi mật khẩu tài khoản và đăng nhập thử bằng email CỦA PHIÊN
 * ĐANG DÙNG (không lấy email từ form) trước khi ghi PIN mới. Không cần migration.
 *
 * Supabase Auth ở đây là bản giả (fetch giả); database là PGlite thật — PIN đổi hay chưa đọc thẳng từ kho_may_nguoi.
 * Mỗi dòng "RÀ SOÁT 14/11" đỏ trước bản sửa. Cần web/node_modules — như test-qua-tai.mjs.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { dungDatabase, taoBoDem, taoClientPg, UID } from './kho-chung.mjs';

// Bí mật của máy dùng chung: may-chung.ts đọc process.env khi không chạy trên Worker.
process.env.KHO_MAY_KHOA = 'bi-mat-thu-cho-may-dung-chung-0123456789abcdef';
const { doiPin, layKhoaMay } = await import('../../web/src/lib/kho/may-chung.ts');
const { bamPin } = await import('../../web/src/lib/kho/may-chung-ma-hoa.ts');
const { CAU_DANG_NHAP_TAM } = await import('../../web/src/lib/qua-tai.ts');

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — ĐỔI PIN TRÊN MÁY DÙNG CHUNG PHẢI NHẬP MẬT KHẨU');
const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/i;

const requireWeb = createRequire(join(GOC, 'web', 'package.json'));
const { createClient } = await import(pathToFileURL(requireWeb.resolve('@supabase/supabase-js')).href);

// ===========================================================================
// DATABASE — một máy ở Q1, thủ kho Q1 đã gắn vào máy với PIN 4827
// ===========================================================================
const { db, cnA, nsId, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });
const khoa = await layKhoaMay();

const UID_MAY = '00000000-0000-4000-8000-0000000000d1';
await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Tablet quầy Q1', 'may_chung')`, [UID_MAY, cnA.id]);
const dk = await duoi(UID.qlA, `select kho_dang_ky_may($1, 'Tablet quầy', 5) as kq`, [UID_MAY]);
const mayId = dk.rows?.[0]?.kq?.may_id;
const pinBam = pin => bamPin(khoa, mayId, nsId[UID.thuKhoA], pin);
const PIN_CU = '4827';
const PIN_MOI = '9052';
const gan = mayId ? await duoi(UID.thuKhoA, `select kho_may_gan_nguoi($1, $2) as kq`, [mayId, await pinBam(PIN_CU)]) : { loi: 'không có máy' };

const pinDangLuu = async () => (await db.query(`select pin_bam from kho_may_nguoi where may_id = $1 and nhan_su_id = $2`, [mayId, nsId[UID.thuKhoA]])).rows[0]?.pin_bam;
const soLanDoiPin = async () => (await db.query(`select count(*)::int as so from kho_may_nhat_ky where may_id = $1 and su_kien = 'doi_pin'`, [mayId])).rows[0].so;

// ===========================================================================
// SUPABASE AUTH GIẢ — /token?grant_type=password và /logout
// ===========================================================================
const URL_GIA = 'https://gia-doi-pin.supabase.co';
const EMAIL = 'thu.kho.q1@beeftown.test';
const MAT_KHAU = 'mat-khau-that-cua-thu-kho';
const EMAIL_KHAC = 'nguoi.khac@beeftown.test';
const MAT_KHAU_KHAC = 'mat-khau-cua-nguoi-khac';
const b64url = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'x-supabase-api-version': '2024-01-01' },
});

const auth = {
  matKhau: new Map([[EMAIL, MAT_KHAU], [EMAIL_KHAC, MAT_KHAU_KHAC]]),
  nhatKy: [], soPhienCap: 0, tokenHong: null,
  datLai() { this.nhatKy = []; this.soPhienCap = 0; this.tokenHong = null; },
  dem(cua) { return this.nhatKy.filter(n => n.cua === cua).length; },
};

globalThis.fetch = async (url, init) => {
  const u = new URL(String(url));
  if (u.origin !== URL_GIA) throw new TypeError(`fetch giả: không biết ${u.origin}`);
  if (u.pathname === '/auth/v1/token') {
    const than = JSON.parse(String(init?.body ?? '{}'));
    auth.nhatKy.push({ cua: 'token', email: than.email, matKhau: than.password });
    if (auth.tokenHong) return auth.tokenHong();
    if (auth.matKhau.get(than.email) !== than.password) return json(400, { code: 'invalid_credentials', message: 'Invalid login credentials' });
    auth.soPhienCap++;
    const het = Math.floor(Date.now() / 1000) + 3600;
    const id = crypto.randomUUID();
    return json(200, {
      access_token: `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: id, exp: het, session_id: crypto.randomUUID() })}.chu-ky-gia`,
      refresh_token: `rt-${auth.soPhienCap}`, token_type: 'bearer', expires_in: 3600, expires_at: het,
      user: { id, aud: 'authenticated', role: 'authenticated', email: than.email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
    });
  }
  if (u.pathname === '/auth/v1/logout') { auth.nhatKy.push({ cua: 'logout' }); return new Response(null, { status: 204 }); }
  throw new TypeError(`fetch giả: không biết ${u.pathname}`);
};
const taoTam = () => createClient(URL_GIA, 'khoa-anon-gia', { auth: { persistSession: false, autoRefreshToken: false } });

// ===========================================================================
// GỌI doiPin NHƯ TRANG gan.astro GỌI
// ===========================================================================
const astroCua = uid => ({
  locals: { phien: { client: clientCua(uid), nhanSu: { id: nsId[uid], ho_ten: 'Thủ kho Q1', vai_tro: 'thu_kho', chi_nhanh_id: cnA.id, email: EMAIL } } },
});
const MAY = { mayId, nhanSuId: nsId[UID.thuKhoA], tenMay: 'Tablet quầy', phutKhoa: 5, giayConLai: 200 };

/** Gửi form "Đổi PIN của tôi". o: các ô của form. */
async function guiDoiPin(o, { uid = UID.thuKhoA, may = MAY } = {}) {
  auth.nhatKy = []; auth.soPhienCap = 0;
  const form = new FormData();
  form.set('viec', 'doi_pin');
  for (const [k, v] of Object.entries(o)) form.set(k, v);
  return doiPin(astroCua(uid), form, may, taoTam);
}
const tom = kq => `ok=${kq.ok} · ${kq.cau}`;
const conPinCu = async () => (await pinDangLuu()) === (await pinBam(PIN_CU));

// ===========================================================================
await nhom('0 · Dựng được máy và người đã gắn', async () => {
  ok('Quản lý đăng ký máy, thủ kho gắn vào với PIN cũ', !!mayId && gan.loi === null && await conPinCu(), dk.loi ?? gan.loi ?? '');
});

// ===========================================================================
await nhom('1 · Không có mật khẩu, hoặc sai mật khẩu → PIN không đổi', async () => {
  const khong = await guiDoiPin({ pin: PIN_MOI, pin_lai: PIN_MOI });
  ok('RÀ SOÁT 14/11: không nhập mật khẩu → từ chối, PIN vẫn là PIN cũ', khong.ok === false && await conPinCu(), tom(khong));
  ok('…câu báo đòi mật khẩu tài khoản, có bản tiếng Anh; không tốn lượt đăng nhập nào',
     /mật khẩu/i.test(khong.cau) && typeof khong.cauEn === 'string' && !VIET.test(khong.cauEn) && auth.dem('token') === 0, `${khong.cau} | ${khong.cauEn}`);

  const sai = await guiDoiPin({ pin: PIN_MOI, pin_lai: PIN_MOI, mat_khau: 'doan-bua-mot-mat-khau' });
  ok('RÀ SOÁT 14/11: sai mật khẩu → từ chối, PIN vẫn là PIN cũ', sai.ok === false && await conPinCu(), tom(sai));
  ok('…câu báo: mật khẩu không đúng, PIN chưa đổi', /Mật khẩu không đúng/.test(sai.cau) && /PIN chưa đổi/.test(sai.cau)
     && typeof sai.cauEn === 'string' && !VIET.test(sai.cauEn), `${sai.cau} | ${sai.cauEn}`);
  ok('…đăng nhập thử đúng một lần, bằng email của phiên đang dùng máy', auth.dem('token') === 1 && auth.nhatKy[0].email === EMAIL, JSON.stringify(auth.nhatKy));

  // Người cầm máy biết mật khẩu của CHÍNH HỌ, và gửi kèm email của họ trong form: không được tính.
  const khac = await guiDoiPin({ pin: PIN_MOI, pin_lai: PIN_MOI, mat_khau: MAT_KHAU_KHAC, email: EMAIL_KHAC });
  ok('RÀ SOÁT 14/11: gửi kèm email và mật khẩu đúng của một người KHÁC → từ chối, PIN vẫn là PIN cũ', khac.ok === false && await conPinCu(), tom(khac));
  ok('…email trong form bị bỏ qua: chỉ thử với email của phiên', auth.nhatKy.filter(n => n.cua === 'token').every(n => n.email === EMAIL), JSON.stringify(auth.nhatKy));
  ok('Chưa lần nào ghi "đổi PIN" vào nhật ký máy', await soLanDoiPin() === 0, `${await soLanDoiPin()} lần`);
});

// ===========================================================================
await nhom('2 · Supabase bận hoặc mất mạng → PIN không đổi, không đổ cho mật khẩu', async () => {
  const CA = [
    ['429 — quá hạn mức đăng nhập', () => json(429, { code: 'over_request_rate_limit', message: 'Request rate limit reached' }), CAU_DANG_NHAP_TAM.qua_tai.vi],
    ['503 — Supabase trục trặc', () => json(503, { message: 'Service Unavailable' }), CAU_DANG_NHAP_TAM.mat_ket_noi.vi],
    ['mất mạng giữa chừng', () => { throw new TypeError('fetch failed'); }, CAU_DANG_NHAP_TAM.mat_ket_noi.vi],
  ];
  for (const [ten, hong, cau] of CA) {
    auth.tokenHong = hong;
    const kq = await guiDoiPin({ pin: PIN_MOI, pin_lai: PIN_MOI, mat_khau: MAT_KHAU });
    auth.tokenHong = null;
    ok(`RÀ SOÁT 14/11: ${ten} → không báo đã đổi, PIN vẫn là PIN cũ`, kq.ok === false && await conPinCu(), tom(kq));
    ok('…câu báo là "đợi rồi thử lại — không phải do sai mật khẩu"', kq.cau === cau && !/Mật khẩu không đúng/.test(kq.cau), kq.cau);
  }
  ok('Vẫn chưa lần nào ghi "đổi PIN" vào nhật ký máy', await soLanDoiPin() === 0);
});

// ===========================================================================
await nhom('3 · PIN mới không hợp lệ → từ chối trước khi tốn lượt đăng nhập', async () => {
  for (const [ten, o] of [['số lặp 1111', { pin: '1111', pin_lai: '1111' }], ['số liền 1234', { pin: '1234', pin_lai: '1234' }],
                          ['hai lần gõ khác nhau', { pin: PIN_MOI, pin_lai: '9053' }], ['ba chữ số', { pin: '905', pin_lai: '905' }]]) {
    const kq = await guiDoiPin({ ...o, mat_khau: MAT_KHAU });
    ok(`PIN mới ${ten} → từ chối, không đăng nhập thử, PIN cũ còn nguyên`, kq.ok === false && auth.dem('token') === 0 && await conPinCu(), tom(kq));
  }
});

// ===========================================================================
await nhom('4 · Không phải người đang dùng máy → từ chối như cũ', async () => {
  const kq = await guiDoiPin({ pin: PIN_MOI, pin_lai: PIN_MOI, mat_khau: MAT_KHAU }, { may: { ...MAY, nhanSuId: nsId[UID.nvQuayA] } });
  ok('Máy đang mở dưới tên người khác → từ chối, không đăng nhập thử', kq.ok === false && auth.dem('token') === 0 && await conPinCu(), tom(kq));
  const khoaRoi = await guiDoiPin({ pin: PIN_MOI, pin_lai: PIN_MOI, mat_khau: MAT_KHAU }, { may: { ...MAY, nhanSuId: null } });
  ok('Máy đang khóa → từ chối', khoaRoi.ok === false && await conPinCu(), tom(khoaRoi));
});

// ===========================================================================
await nhom('5 · Đúng mật khẩu → đổi được PIN', async () => {
  const kq = await guiDoiPin({ pin: PIN_MOI, pin_lai: PIN_MOI, mat_khau: MAT_KHAU });
  ok('Đúng mật khẩu, PIN mới hợp lệ → đã đổi', kq.ok === true && (await pinDangLuu()) === (await pinBam(PIN_MOI)), tom(kq));
  ok('…PIN cũ không còn dùng được', !(await conPinCu()));
  ok('…nhật ký máy ghi đúng một lần đổi PIN', await soLanDoiPin() === 1, `${await soLanDoiPin()} lần`);
  ok('…phiên đăng nhập thử bị thu hồi ngay (không token nào sống mà không ai giữ)',
     auth.soPhienCap === 1 && auth.dem('logout') === 1, `${auth.soPhienCap} phiên, ${auth.dem('logout')} lần đăng xuất`);

  const lai = await guiDoiPin({ pin: PIN_MOI, pin_lai: PIN_MOI, mat_khau: MAT_KHAU });
  ok('Bấm hai lần: lần hai cũng xong, PIN vẫn là PIN mới', lai.ok === true && (await pinDangLuu()) === (await pinBam(PIN_MOI)), tom(lai));
});

// ===========================================================================
await nhom('6 · Trang và hướng dẫn nói đúng: đổi PIN cần mật khẩu', async () => {
  const doc = f => readFileSync(join(GOC, f), 'utf8');
  const trang = doc('web/src/pages/noi-bo/kho/may/gan.astro');
  const formDoiPin = trang.slice(trang.indexOf('value="doi_pin"'), trang.indexOf('</form>', trang.indexOf('value="doi_pin"')));
  ok('RÀ SOÁT 14/11: form "Đổi PIN của tôi" có ô mật khẩu bắt buộc, không cho trình duyệt nhớ',
     /<input[^>]*type="password"[^>]*name="mat_khau"[^>]*>/.test(formDoiPin) && /name="mat_khau"[^>]*required/.test(formDoiPin)
     && /name="mat_khau"[^>]*autocomplete="off"/.test(formDoiPin), formDoiPin.slice(0, 300));
  ok('…trang không còn ghi "không cần mật khẩu"', !/không cần mật khẩu/.test(trang));
  const hd = doc('web/src/lib/kho/huong-dan.ts');
  const dong = hd.split('\n').filter(d => /Đổi PIN của tôi|Change my PIN/.test(d)).join('\n');
  ok('…hướng dẫn trong app (vi và en) nhắc phải nhập mật khẩu', /mật khẩu/.test(dong) && /password/i.test(dong), dong);
  ok('…web/KHO.md mục 3f ghi đổi PIN cần mật khẩu tài khoản', /Đổi PIN[^\n]*mật khẩu tài khoản/.test(doc('web/KHO.md')));
});

// ===========================================================================
await nhom('7 · Sổ kho không bị đụng', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows).slice(0, 200));
});

process.exit(ketThuc('đổi PIN trên máy dùng chung'));
