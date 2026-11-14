/**
 * BEEFTOWN KHO — Kiểm thử: tài khoản nhân viên mới chỉ mở được bằng mật khẩu tạm chủ vừa nhận (0123)
 * ===============================================================================================
 *
 *     node test/test-kho-nhan-vien-tai-khoan.mjs
 *
 * Rà soát bảo mật 14/11/2026. Màn Cài đặt → Nhân viên tạo tài khoản bằng auth.signUp với khóa anon, nên Supabase
 * phải mở đăng ký công khai: ai cũng đăng ký được một email bất kỳ. Khi Supabase bật "Confirm email" và email đó
 * đã có một tài khoản CHƯA xác nhận, lần đăng ký sau KHÔNG báo lỗi và KHÔNG đổi mật khẩu — Supabase trả lại chính
 * tài khoản cũ, kèm identity (mã nguồn công khai của Supabase Auth: internal/api/signup.go, "do not update the user
 * because we can't be sure of their claimed identity"). Mã cũ lấy tài khoản đó nối thành nhân viên. Vậy email đã
 * bị người khác đăng ký trước thì nhân viên mới mang mật khẩu của người đó, còn mật khẩu tạm chủ cầm thì không
 * mở được gì.
 *
 * Hai lớp chặn, kiểm cả hai:
 *   · web  — themNhanVien (web/src/lib/kho/nhan-vien.ts) đăng nhập thử bằng mật khẩu tạm TRƯỚC khi nối. Supabase
 *            kiểm mật khẩu trước khi xét email đã xác nhận chưa (internal/api/token.go), nên: vào được hoặc
 *            "email_not_confirmed" = mật khẩu tạm đúng; "invalid_credentials" = tài khoản có từ trước; 429 / 5xx /
 *            mất mạng = chưa biết. Chỉ trường hợp đầu mới nối.
 *   · database — trigger nhan_su_kiem_tai_khoan_vua_tao (0123): dưới một phiên, dòng nhan_su chỉ gắn được tài khoản
 *            đăng nhập tạo trong 10 phút gần nhất. Trigger, không thay thân kho_them_nhan_su — nhánh vai học viên
 *            (0119) cũng viết lại hàm đó.
 *
 * Supabase Auth ở đây là bản GIẢ (fetch giả), viết theo đúng các nhánh của mã nguồn nói trên. Giả định đó là đọc
 * mã, chưa chạy với Supabase thật: các bước thử tay trên project Beeftown-thu ở web/KHO.md mục 3f.
 *
 * Mỗi dòng "RÀ SOÁT 14/11" đỏ trước bản sửa. Các dòng còn lại giữ cho việc tạo nhân viên bình thường vẫn chạy.
 * Cần web/node_modules (cd web && npm install) — như test-qua-tai.mjs.
 */

import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { dungDatabase, taoBoDem, taoClientPg, UID } from './kho-chung.mjs';
import { themNhanVien } from '../../web/src/lib/kho/nhan-vien.ts';
import { dichCau } from '../../web/src/lib/cau-noi-bo.ts';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — TÀI KHOẢN NHÂN VIÊN MỚI VÀ EMAIL ĐÃ BỊ ĐĂNG KÝ TRƯỚC (0123)');
const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/i;

// supabase-js của web/ — đúng bản website đang chạy.
const requireWeb = createRequire(join(GOC, 'web', 'package.json'));
const { createClient } = await import(pathToFileURL(requireWeb.resolve('@supabase/supabase-js')).href);

// ===========================================================================
// DATABASE
// ===========================================================================
const { db, cnA, cnB, duoi, duoiAnon } = await dungDatabase();
const clientCua = await taoClientPg({ db, duoi, duoiAnon });
const mot = async (sql, p = []) => (await db.query(sql, p)).rows[0];

// Supabase có bảng auth.users; khung test chưa có — dựng bản tối thiểu mà kho_them_nhan_su và trigger 0123 cần.
await db.exec(`create table if not exists auth.users (id uuid primary key, email text, created_at timestamptz default now())`);

const CHI_NHANH = [{ id: cnA.id, ten: cnA.ten }, { id: cnB.id, ten: cnB.ten }];
const soNhanSu = async email => (await mot(`select count(*)::int as so from nhan_su where email = $1`, [email])).so;
const laNhanSu = async uid => (await mot(`select count(*)::int as so from nhan_su where auth_uid = $1`, [uid])).so > 0;

// ===========================================================================
// SUPABASE AUTH GIẢ — ba cửa mà màn Nhân viên đụng tới: /signup, /token?grant_type=password, /logout
// ===========================================================================
const URL_GIA = 'https://gia-nhan-vien.supabase.co';
const b64url = o => Buffer.from(JSON.stringify(o)).toString('base64url');

const auth = {
  /** true = Supabase đang TẮT "Confirm email" (tài khoản mới được xác nhận ngay, đăng ký trả luôn phiên). */
  tuXacNhan: false,
  /** email → { id, matKhau, daXacNhan } */
  taiKhoan: new Map(),
  /** Mọi lần gọi: { cua: 'signup' | 'token' | 'logout', email, matKhau } */
  nhatKy: [],
  soPhienCap: 0,
  /** Đặt một hàm ở đây để cửa /token trả lời khác đi (429, 5xx, mất mạng). null = trả lời thật. */
  tokenHong: null,

  datLai({ tuXacNhan }) { this.tuXacNhan = tuXacNhan; this.nhatKy = []; this.soPhienCap = 0; this.tokenHong = null; },
  dem(cua) { return this.nhatKy.filter(n => n.cua === cua).length; },

  /** Một người (không phải chủ) đăng ký email từ trước, bằng mật khẩu của họ. */
  async dangKyTruoc(email, matKhau, { phutTruoc }) {
    const id = crypto.randomUUID();
    this.taiKhoan.set(email, { id, matKhau, daXacNhan: false });
    await db.query(`insert into auth.users (id, email, created_at) values ($1, $2, now() - make_interval(mins => $3))`, [id, email, phutTruoc]);
    return id;
  },
  /** Người nhận thư bấm link xác nhận. */
  xacNhan(email) { this.taiKhoan.get(email).daXacNhan = true; },
  /** Mật khẩu này có mở được tài khoản của email không; trả uid hoặc null. */
  moDuoc(email, matKhau) {
    const tk = this.taiKhoan.get(email);
    return tk && tk.daXacNhan && tk.matKhau === matKhau ? tk.id : null;
  },
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json', 'x-supabase-api-version': '2024-01-01' },
  });
}
function nguoiDung(tk, email, { identity = true } = {}) {
  return {
    id: tk.id, aud: 'authenticated', role: 'authenticated', email, app_metadata: {}, user_metadata: {},
    created_at: new Date().toISOString(),
    identities: identity ? [{ id: tk.id, user_id: tk.id, provider: 'email', identity_data: { email, sub: tk.id } }] : [],
  };
}
function phien(tk, email) {
  auth.soPhienCap++;
  const het = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: tk.id, exp: het, session_id: crypto.randomUUID() })}.chu-ky-gia`,
    refresh_token: `rt-${auth.soPhienCap}`, token_type: 'bearer', expires_in: 3600, expires_at: het,
    user: nguoiDung(tk, email),
  };
}

globalThis.fetch = async (url, init) => {
  const u = new URL(String(url));
  if (u.origin !== URL_GIA) throw new TypeError(`fetch giả: không biết ${u.origin}`);
  const than = init?.body ? JSON.parse(String(init.body)) : {};
  const email = String(than.email ?? '').toLowerCase();

  // ----- /signup — theo internal/api/signup.go --------------------------------------------------------
  if (u.pathname === '/auth/v1/signup') {
    auth.nhatKy.push({ cua: 'signup', email, matKhau: than.password });
    let tk = auth.taiKhoan.get(email);
    if (tk?.daXacNhan) {
      // Email đã có tài khoản ĐÃ xác nhận: tắt "Confirm email" thì báo lỗi; bật thì trả tài khoản giả không identity.
      if (auth.tuXacNhan) return json(422, { code: 'user_already_exists', message: 'User already registered' });
      return json(200, nguoiDung({ id: crypto.randomUUID() }, email, { identity: false }));
    }
    if (!tk) {
      tk = { id: crypto.randomUUID(), matKhau: than.password, daXacNhan: false };
      auth.taiKhoan.set(email, tk);
      await db.query(`insert into auth.users (id, email) values ($1, $2)`, [tk.id, email]);
    }
    // Tài khoản cũ CHƯA xác nhận: không đổi mật khẩu, trả lại chính nó.
    if (auth.tuXacNhan) { tk.daXacNhan = true; return json(200, phien(tk, email)); }
    return json(200, nguoiDung(tk, email));
  }

  // ----- /token?grant_type=password — theo internal/api/token.go: mật khẩu trước, xác nhận email sau ------
  if (u.pathname === '/auth/v1/token') {
    auth.nhatKy.push({ cua: 'token', email, matKhau: than.password });
    if (auth.tokenHong) return auth.tokenHong();
    const tk = auth.taiKhoan.get(email);
    if (!tk || tk.matKhau !== than.password) return json(400, { code: 'invalid_credentials', message: 'Invalid login credentials' });
    if (!tk.daXacNhan) return json(400, { code: 'email_not_confirmed', message: 'Email not confirmed' });
    return json(200, phien(tk, email));
  }

  if (u.pathname === '/auth/v1/logout') {
    auth.nhatKy.push({ cua: 'logout' });
    return new Response(null, { status: 204 });
  }
  throw new TypeError(`fetch giả: không biết ${u.pathname}`);
};

const taoTam = () => createClient(URL_GIA, 'khoa-anon-gia', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

/** Chủ bấm "Thêm nhân viên". Trả kết quả của themNhanVien kèm danh sách hàm database đã gọi. */
async function chuTao(email, { hoTen = 'Nhân viên thử', vai = 'thu_kho', chiNhanh = cnA.id } = {}) {
  daCho = [];
  const form = new FormData();
  form.set('ho_ten', hoTen); form.set('email', email); form.set('vai_tro', vai); form.set('chi_nhanh_id', chiNhanh);
  const chu = clientCua(UID.chu);
  const daGoi = [];
  const chuDem = { rpc(ten, thamSo) { daGoi.push(ten); return chu.rpc(ten, thamSo); } };
  // cho: kiểm thử không chờ thật giữa các lần đăng nhập thử lại; ghi lại số mili-giây được yêu cầu.
  const kq = await themNhanVien(chuDem, form, CHI_NHANH, { taoTam, cho: async ms => { daCho.push(ms); } });
  return { kq, daGoi };
}
/** Các quãng chờ (mili-giây) themNhanVien đã xin giữa các lần đăng nhập thử, của lần chuTao gần nhất. */
let daCho = [];
const tom = kq => `ok=${kq.ok} · ${String(kq.cau).slice(0, 170)}`;
const MAT_KHAU_TAM = /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/;
const MAT_KHAU_NGUOI_KHAC = 'mat-khau-cua-nguoi-dang-ky-truoc';

/** Kiểm chung cho một lần tạo BỊ TỪ CHỐI vì tài khoản có từ trước. */
async function kiemBiTuChoi(ten, email, { kq, daGoi }) {
  ok(`RÀ SOÁT 14/11: ${ten} → KHÔNG tạo nhân viên`, kq.ok === false && await soNhanSu(email) === 0, tom(kq));
  ok('…không gọi kho_them_nhan_su, không hiện mật khẩu tạm', !daGoi.includes('kho_them_nhan_su') && kq.moi === undefined, `đã gọi: ${daGoi.join(', ') || '(không)'}`);
  ok('…Supabase đã TỪ CHỐI mật khẩu thì không thử lại: đúng một lượt đăng nhập thử, không chờ', auth.dem('token') === 1 && daCho.length === 0, `${auth.dem('token')} lượt, chờ ${JSON.stringify(daCho)}`);
  ok('…câu báo nói thật: CHƯA tạo nhân viên, chỉ chỗ xóa tài khoản cũ',
     /CHƯA tạo nhân viên/.test(kq.cau) && kq.cau.includes('Supabase → Authentication → Users') && kq.cau.includes(email), kq.cau);
  ok('…có bản tiếng Anh, không lẫn chữ Việt', typeof kq.cauEn === 'string' && kq.cauEn.includes(email) && !VIET.test(kq.cauEn), kq.cauEn ?? '(thiếu)');
  // Bất biến cuối cùng: mật khẩu không do chủ phát thì không bao giờ mở được một tài khoản nhân viên.
  auth.xacNhan(email);
  const uid = auth.moDuoc(email, MAT_KHAU_NGUOI_KHAC);
  ok('…người đăng ký trước, kể cả sau khi email được xác nhận, không đăng nhập được dưới tên nhân viên nào',
     uid !== null && !(await laNhanSu(uid)), `uid ${uid}`);
}

// ===========================================================================
await nhom('1 · Tạo nhân viên bình thường vẫn chạy — Supabase bật hoặc tắt "Confirm email"', async () => {
  auth.datLai({ tuXacNhan: true });
  const a = await chuTao('thu.kho.moi@beeftown.test', { hoTen: 'Thủ kho mới' });
  ok('Tắt "Confirm email": tạo được, có mật khẩu tạm, không cần xác nhận',
     a.kq.ok === true && MAT_KHAU_TAM.test(a.kq.moi?.mat_khau ?? '') && a.kq.moi?.can_xac_nhan === false, tom(a.kq));
  const dong = await mot(`select n.vai_tro, n.chi_nhanh_id, n.dang_lam, n.auth_uid from nhan_su n where n.email = 'thu.kho.moi@beeftown.test'`);
  ok('…đúng một dòng nhân sự, đúng vai và chi nhánh', await soNhanSu('thu.kho.moi@beeftown.test') === 1
     && dong?.vai_tro === 'thu_kho' && dong?.chi_nhanh_id === cnA.id && dong?.dang_lam === true, JSON.stringify(dong));
  ok('…mật khẩu tạm chủ nhận được mở đúng tài khoản vừa nối', auth.moDuoc('thu.kho.moi@beeftown.test', a.kq.moi?.mat_khau) === dong?.auth_uid);
  const dk = auth.nhatKy.find(n => n.cua === 'signup');
  const thu = auth.nhatKy.filter(n => n.cua === 'token');
  ok('RÀ SOÁT 14/11: trước khi nối, đăng nhập thử đúng MỘT lần bằng chính mật khẩu tạm đã đăng ký',
     thu.length === 1 && thu[0].matKhau === dk?.matKhau && thu[0].matKhau === a.kq.moi?.mat_khau && thu[0].email === 'thu.kho.moi@beeftown.test',
     `${thu.length} lần thử`);
  ok('…mọi phiên Supabase cấp cho người mới đều được thu hồi ngay (không ai dùng)',
     auth.soPhienCap > 0 && auth.dem('logout') === auth.soPhienCap, `${auth.soPhienCap} phiên, ${auth.dem('logout')} lần đăng xuất`);

  auth.datLai({ tuXacNhan: false });
  const b = await chuTao('nv.quay.moi@beeftown.test', { hoTen: 'NV quầy mới', vai: 'nhan_vien_quay', chiNhanh: cnB.id });
  ok('Bật "Confirm email": tạo được, báo phải bấm link trong thư',
     b.kq.ok === true && MAT_KHAU_TAM.test(b.kq.moi?.mat_khau ?? '') && b.kq.moi?.can_xac_nhan === true && /Confirm email/.test(b.kq.cau), tom(b.kq));
  ok('…đúng một dòng nhân sự', await soNhanSu('nv.quay.moi@beeftown.test') === 1);
  auth.xacNhan('nv.quay.moi@beeftown.test');
  const uid = auth.moDuoc('nv.quay.moi@beeftown.test', b.kq.moi?.mat_khau);
  ok('…sau khi bấm link, mật khẩu tạm mở đúng tài khoản nhân viên đó', uid !== null && await laNhanSu(uid));
});

// ===========================================================================
await nhom('2 · Email đã bị người khác đăng ký trước → không nối thành nhân viên', async () => {
  // a) Đăng ký trước ba ngày, Supabase bật "Confirm email" suốt.
  auth.datLai({ tuXacNhan: false });
  await auth.dangKyTruoc('ke.toan.moi@beeftown.test', MAT_KHAU_NGUOI_KHAC, { phutTruoc: 3 * 24 * 60 });
  await kiemBiTuChoi('email đăng ký trước ba ngày, chưa xác nhận', 'ke.toan.moi@beeftown.test',
                     await chuTao('ke.toan.moi@beeftown.test', { hoTen: 'Kế toán mới', vai: 'ke_toan' }));

  // b) Đăng ký trước MỘT phút: lớp database (10 phút) chưa chặn — phải là bước đăng nhập thử chặn.
  auth.datLai({ tuXacNhan: false });
  await auth.dangKyTruoc('may.quay.moi@beeftown.test', MAT_KHAU_NGUOI_KHAC, { phutTruoc: 1 });
  await kiemBiTuChoi('email tài khoản máy đăng ký trước một phút', 'may.quay.moi@beeftown.test',
                     await chuTao('may.quay.moi@beeftown.test', { hoTen: 'Máy quầy mới', vai: 'may_chung' }));

  // c) Đăng ký trước lúc còn bật "Confirm email", rồi chủ TẮT nó (chính câu báo của màn này gợi ý tắt): lần đăng ký
  //    của chủ xác nhận luôn tài khoản cũ và trả về một phiên — có phiên không có nghĩa là mật khẩu tạm đúng.
  auth.datLai({ tuXacNhan: false });
  await auth.dangKyTruoc('thu.kho.hai@beeftown.test', MAT_KHAU_NGUOI_KHAC, { phutTruoc: 2 });
  auth.tuXacNhan = true;
  await kiemBiTuChoi('email đăng ký trước rồi "Confirm email" bị tắt', 'thu.kho.hai@beeftown.test',
                     await chuTao('thu.kho.hai@beeftown.test', { hoTen: 'Thủ kho hai' }));
});

// ===========================================================================
await nhom('3 · Email đã có tài khoản đã xác nhận: vẫn báo như cũ, không đăng nhập thử', async () => {
  for (const tuXacNhan of [true, false]) {
    auth.datLai({ tuXacNhan });
    const email = `da.co.${tuXacNhan ? 'tat' : 'bat'}@beeftown.test`;
    await auth.dangKyTruoc(email, 'mat-khau-cu', { phutTruoc: 600 });
    auth.xacNhan(email);
    const { kq, daGoi } = await chuTao(email);
    ok(`${tuXacNhan ? 'Tắt' : 'Bật'} "Confirm email": báo email đã có tài khoản, không tạo nhân viên`,
       kq.ok === false && /Email này đã có tài khoản đăng nhập/.test(kq.cau) && await soNhanSu(email) === 0 && !daGoi.includes('kho_them_nhan_su'), tom(kq));
    ok('…không tốn lượt đăng nhập thử nào', auth.dem('token') === 0, `${auth.dem('token')} lần`);
  }
});

// ===========================================================================
await nhom('4 · Chưa kiểm được mật khẩu tạm (Supabase bận, mất mạng) → không bao giờ báo đã tạo', async () => {
  const CA = [
    ['429 — quá hạn mức đăng nhập', () => json(429, { code: 'over_request_rate_limit', message: 'Request rate limit reached' })],
    ['503 — Supabase trục trặc', () => json(503, { message: 'Service Unavailable' })],
    ['mất mạng giữa chừng', () => { throw new TypeError('fetch failed'); }],
    ['trả lời không đọc được (trang lỗi của proxy)', () => new Response('<html>502</html>', { status: 502, headers: { 'content-type': 'text/html' } })],
  ];
  let i = 0;
  for (const [ten, hong] of CA) {
    auth.datLai({ tuXacNhan: i % 2 === 0 });
    auth.tokenHong = hong;
    const email = `chua.kiem.${++i}@beeftown.test`;
    const { kq, daGoi } = await chuTao(email);
    ok(`RÀ SOÁT 14/11: ${ten} → KHÔNG tạo nhân viên, không báo thành công`,
       kq.ok === false && kq.moi === undefined && await soNhanSu(email) === 0 && !daGoi.includes('kho_them_nhan_su'), tom(kq));
    ok('…đã thử lại hai lần (chờ 1,5 giây rồi 3 giây) trước khi chịu thua', auth.dem('token') === 3 && JSON.stringify(daCho) === '[1500,3000]', `${auth.dem('token')} lượt, chờ ${JSON.stringify(daCho)}`);
    ok('…câu báo nói đúng: chưa kiểm được, CHƯA tạo nhân viên, email có thể đã bị chiếm — xóa rồi tạo lại',
       /chưa kiểm được/i.test(kq.cau) && /CHƯA tạo nhân viên/.test(kq.cau) && kq.cau.includes('Supabase → Authentication → Users')
       && typeof kq.cauEn === 'string' && !VIET.test(kq.cauEn), `${kq.cau} | ${kq.cauEn}`);
  }
});

// ===========================================================================
await nhom('4b · Supabase bận thoáng qua → thử lại là tạo được, không để lại tài khoản mồ côi', async () => {
  // Rà soát mã 14/11: đăng ký (đã xong) và đăng nhập thử đi qua hai hạn mức khác nhau của Supabase. Đầu ca, cửa
  // đăng nhập hay chạm trần vài giây — bỏ cuộc ngay ở lần đầu là để lại một tài khoản đăng nhập không ai dùng được,
  // chủ phải vào Supabase xóa tay. Cửa đó nạp lại một lượt mỗi 2 giây, nên thử lại sau 1,5 giây và 3 giây.
  for (const [ten, soLanHong, tuXacNhan] of [['429 một lần rồi được', 1, true], ['mất mạng hai lần rồi được', 2, false]]) {
    auth.datLai({ tuXacNhan });
    let con = soLanHong;
    const that = () => { auth.tokenHong = null; };
    auth.tokenHong = () => {
      if (--con <= 0) queueMicrotask(that);
      if (soLanHong === 1) return json(429, { code: 'over_request_rate_limit', message: 'Request rate limit reached' });
      throw new TypeError('fetch failed');
    };
    const email = `ban.thoang.qua.${soLanHong}@beeftown.test`;
    const { kq, daGoi } = await chuTao(email);
    ok(`RÀ SOÁT 14/11: ${ten} → vẫn tạo được nhân viên, có mật khẩu tạm`,
       kq.ok === true && MAT_KHAU_TAM.test(kq.moi?.mat_khau ?? '') && await soNhanSu(email) === 1 && daGoi.includes('kho_them_nhan_su'), tom(kq));
    ok('…số lượt đăng nhập thử = số lần hỏng + 1', auth.dem('token') === soLanHong + 1 && daCho.length === soLanHong, `${auth.dem('token')} lượt, chờ ${JSON.stringify(daCho)}`);
  }
});

// ===========================================================================
await nhom('5 · Bấm tạo hai lần cùng một email → chỉ một nhân viên, mật khẩu tạm đầu vẫn đúng', async () => {
  auth.datLai({ tuXacNhan: false });
  const email = 'bam.hai.lan@beeftown.test';
  const mot_ = await chuTao(email, { hoTen: 'Bấm hai lần' });
  const hai = await chuTao(email, { hoTen: 'Bấm hai lần' });
  ok('Lần một tạo được', mot_.kq.ok === true && MAT_KHAU_TAM.test(mot_.kq.moi?.mat_khau ?? ''), tom(mot_.kq));
  ok('Lần hai (bật "Confirm email") không tạo thêm, không báo thành công', hai.kq.ok === false && hai.kq.moi === undefined, tom(hai.kq));
  ok('…vẫn đúng một dòng nhân sự', await soNhanSu(email) === 1);
  auth.xacNhan(email);
  const uid = auth.moDuoc(email, mot_.kq.moi?.mat_khau);
  ok('…mật khẩu tạm của lần một vẫn mở đúng tài khoản nhân viên đó', uid !== null && await laNhanSu(uid));

  auth.datLai({ tuXacNhan: true });
  const email2 = 'bam.hai.lan.tat@beeftown.test';
  const ba = await chuTao(email2);
  const bon = await chuTao(email2);
  ok('Tắt "Confirm email": lần hai báo email đã có tài khoản, vẫn một nhân sự',
     ba.kq.ok === true && bon.kq.ok === false && /Email này đã có tài khoản đăng nhập/.test(bon.kq.cau) && await soNhanSu(email2) === 1, tom(bon.kq));
});

// ===========================================================================
await nhom('6 · Database (0123): dưới một phiên, nhan_su chỉ gắn được tài khoản đăng nhập VỪA tạo', async () => {
  const CAU = 'Tài khoản đăng nhập này có từ trước, không phải vừa tạo ở màn Nhân viên';
  const goi = (uid, authUid, ten = 'Người thử') => duoi(uid, `select kho_them_nhan_su($1, $2, 'thu_kho', $3) as kq`, [authUid, ten, cnA.id]);
  const themTaiKhoan = async (email, taoLuc) => {
    const id = crypto.randomUUID();
    await db.query(`insert into auth.users (id, email, created_at) values ($1, $2, ${taoLuc})`, [id, email]);
    return id;
  };
  const biChan = r => typeof r.loi === 'string' && r.loi.includes(CAU);

  // a) Qua kho_them_nhan_su — đường của màn Nhân viên.
  for (const [ten, taoLuc] of [['11 phút trước', `now() - interval '11 minutes'`], ['ba ngày trước', `now() - interval '3 days'`],
                               ['không rõ lúc nào (created_at trống)', 'null']]) {
    const email = `cu.${ten.length}@beeftown.test`;
    const id = await themTaiKhoan(email, taoLuc);
    const r = await goi(UID.chu, id);
    ok(`RÀ SOÁT 14/11: tài khoản đăng nhập tạo ${ten} → từ chối, không ghi nhân sự`, biChan(r) && await soNhanSu(email) === 0, r.loi ?? 'NỐI ĐƯỢC');
  }
  for (const [ten, taoLuc] of [['vừa xong', 'now()'], ['9 phút trước', `now() - interval '9 minutes'`]]) {
    const email = `moi.${ten.length}@beeftown.test`;
    const id = await themTaiKhoan(email, taoLuc);
    const r = await goi(UID.chu, id);
    ok(`Tài khoản đăng nhập tạo ${ten} → chủ nối được`, r.loi === null && await soNhanSu(email) === 1, r.loi ?? '');
  }

  // b) Câu cũ của kho_them_nhan_su vẫn đến trước: người không phải chủ không dò được tuổi của một tài khoản.
  const cu = await themTaiKhoan('cu.cho.quan.ly@beeftown.test', `now() - interval '1 day'`);
  const moi = await themTaiKhoan('moi.cho.quan.ly@beeftown.test', 'now()');
  for (const [ten, uid] of [['quản lý', UID.qlA], ['thủ kho', UID.thuKhoA], ['người đã nghỉ', UID.nghiViec], ['tài khoản không có nhân sự', null]]) {
    const a = await goi(uid, cu);
    const b = await goi(uid, moi);
    ok(`${ten}: tài khoản cũ hay mới đều nhận cùng một câu "Chỉ chủ nhà hàng…"`,
       /Chỉ chủ nhà hàng mới tạo được tài khoản/.test(a.loi ?? '') && a.loi === b.loi, `${a.loi} | ${b.loi}`);
  }
  const an = await duoiAnon(`select kho_them_nhan_su($1, 'X', 'thu_kho', $2) as kq`, [moi, cnA.id]);
  ok('Chưa đăng nhập (anon) không gọi được', typeof an.loi === 'string' && /permission denied/i.test(an.loi), an.loi ?? 'GỌI ĐƯỢC');
  const ma = await goi(UID.chu, crypto.randomUUID());
  ok('uid không có trong auth.users → vẫn câu cũ "Không tìm thấy tài khoản đăng nhập vừa tạo"', /Không tìm thấy tài khoản đăng nhập vừa tạo/.test(ma.loi ?? ''), ma.loi ?? 'NỐI ĐƯỢC');
  await db.query(`insert into auth.users (id, email, created_at) values ($1, 'thu.kho.q1@beeftown.test', now() - interval '90 days')`, [UID.thuKhoA]);
  const trung = await goi(UID.chu, UID.thuKhoA);
  ok('Tài khoản (cũ) đã là nhân viên → vẫn câu cũ "đã gắn với một nhân sự khác"', /đã gắn với một nhân sự khác/.test(trung.loi ?? ''), trung.loi ?? 'NỐI ĐƯỢC');

  // c) Chủ ghi THẲNG bảng nhan_su (policy nhan_su_sua cho chủ làm mọi việc), không qua hàm: cùng một luật.
  const cuThang = await themTaiKhoan('cu.ghi.thang@beeftown.test', `now() - interval '2 hours'`);
  const them = await duoi(UID.chu, `insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, email, vai_tro) values ($1, $2, 'Ghi thẳng', 'cu.ghi.thang@beeftown.test', 'thu_kho') returning id`, [cuThang, cnA.id]);
  ok('RÀ SOÁT 14/11: chủ thêm thẳng một dòng nhan_su với tài khoản cũ → từ chối', biChan(them) && await soNhanSu('cu.ghi.thang@beeftown.test') === 0, them.loi ?? 'THÊM ĐƯỢC');
  const doi = await duoi(UID.chu, `update nhan_su set auth_uid = $1 where email = 'moi.8@beeftown.test' returning id`, [cuThang]);
  ok('RÀ SOÁT 14/11: chủ đổi auth_uid của một nhân viên sang tài khoản cũ → từ chối', biChan(doi), doi.loi ?? 'ĐỔI ĐƯỢC');
  const doiTen = await duoi(UID.chu, `update nhan_su set ho_ten = 'Tên mới' where auth_uid = $1 returning id`, [UID.thuKhoA]);
  ok('Sửa cột khác (họ tên) của nhân viên có tài khoản cũ → không bị chặn', doiTen.loi === null && doiTen.rows.length === 1, doiTen.loi ?? `${doiTen.rows?.length} dòng`);
  const khongTk = await duoi(UID.chu, `insert into nhan_su (chi_nhanh_id, ho_ten, vai_tro) values ($1, 'Chưa có tài khoản', 'thu_kho') returning id`, [cnA.id]);
  ok('Thêm dòng nhân sự chưa có tài khoản đăng nhập → không bị chặn', khongTk.loi === null, khongTk.loi ?? '');

  // c2) Rà soát bảo mật 14/11 (lượt hai): trigger chạy TRƯỚC khi RLS xét quyền ghi thì một tài khoản lạ — đã đăng
  //     nhập nhưng không phải nhân sự — thêm thử một dòng nhan_su là đọc được từ câu lỗi rằng mã tài khoản nó đưa
  //     vào có vừa được tạo hay không. Trigger phải chạy SAU khi RLS đã từ chối: người không có quyền ghi nhận cùng
  //     một câu lỗi của RLS, dù mã tài khoản cũ, mới hay không có thật.
  const moiChoLa = await themTaiKhoan('moi.cho.nguoi.la@beeftown.test', 'now()');
  const thuLa = authUid => duoi(null, `insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Người lạ thêm', 'thu_kho') returning id`, [authUid, cnA.id]);
  const laCu = await thuLa(cuThang);
  const laMoi = await thuLa(moiChoLa);
  const laMa = await thuLa(crypto.randomUUID());
  ok('RÀ SOÁT 14/11: tài khoản lạ thêm thẳng nhan_su → bị RLS từ chối, không dòng nào được ghi',
     [laCu, laMoi, laMa].every(r => typeof r.loi === 'string' && /row-level security/i.test(r.loi)), `${laCu.loi} | ${laMoi.loi} | ${laMa.loi}`);
  ok('RÀ SOÁT 14/11: …và câu lỗi giống hệt nhau cho mã tài khoản cũ, vừa tạo, hay không có thật (không dò được tuổi tài khoản)',
     laCu.loi === laMoi.loi && laMoi.loi === laMa.loi && !biChan(laCu) && !biChan(laMa), `${laCu.loi} | ${laMoi.loi} | ${laMa.loi}`);
  for (const [ten, uid] of [['quản lý', UID.qlA], ['marketing', UID.mktA], ['người đã nghỉ', UID.nghiViec]]) {
    const a = await duoi(uid, `insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Thêm thử', 'thu_kho') returning id`, [cuThang, cnA.id]);
    const b = await duoi(uid, `insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Thêm thử', 'thu_kho') returning id`, [moiChoLa, cnA.id]);
    ok(`${ten} thêm thẳng nhan_su: tài khoản cũ hay mới đều nhận cùng câu lỗi của RLS`, typeof a.loi === 'string' && a.loi === b.loi && /row-level security/i.test(a.loi), `${a.loi} | ${b.loi}`);
  }
  ok('…không dòng nhân sự nào lọt vào từ các lượt thử đó', (await mot(`select count(*)::int as so from nhan_su where ho_ten in ('Người lạ thêm', 'Thêm thử')`)).so === 0);

  // d) Không phiên (SQL Editor / Table Editor của Supabase): cách tạo chủ, quản lý, thu ngân, marketing — tài khoản thường đã có từ lâu.
  const cuStudio = await themTaiKhoan('quan.ly.moi@beeftown.test', `now() - interval '30 days'`);
  let loi = null;
  try { await db.query(`insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, vai_tro) values ($1, $2, 'Quản lý mới', 'quan_ly')`, [cuStudio, cnA.id]); } catch (e) { loi = String(e?.message ?? e); }
  ok('Không phiên: nối tài khoản cũ thành quản lý vẫn được', loi === null, loi ?? '');

  // e) Hàm trigger, và kho_them_nhan_su không bị viết lại.
  const ham = await mot(`select p.prosecdef, p.proconfig::text as cau_hinh, has_function_privilege('anon', p.oid, 'execute') as anon,
                                has_function_privilege('authenticated', p.oid, 'execute') as nguoi
                           from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'nhan_su_kiem_tai_khoan_vua_tao'`);
  ok('nhan_su_kiem_tai_khoan_vua_tao: security definer, đặt search_path, anon và người đăng nhập không gọi thẳng được',
     ham?.prosecdef === true && /search_path=public/.test(ham.cau_hinh ?? '') && ham.anon === false && ham.nguoi === false, JSON.stringify(ham));
  const goiThang = await duoi(UID.chu, `select nhan_su_kiem_tai_khoan_vua_tao()`);
  ok('…gọi thẳng dưới phiên của chủ cũng bị từ chối', typeof goiThang.loi === 'string', goiThang.loi ?? 'GỌI ĐƯỢC');
  const kho = await mot(`select p.prosecdef, p.proconfig::text as cau_hinh, has_function_privilege('anon', p.oid, 'execute') as anon,
                                has_function_privilege('authenticated', p.oid, 'execute') as nguoi
                           from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'kho_them_nhan_su'`);
  ok('kho_them_nhan_su vẫn là security definer, đặt search_path; người đăng nhập gọi được, anon không',
     kho?.prosecdef === true && /search_path=public/.test(kho.cau_hinh ?? '') && kho.anon === false && kho.nguoi === true, JSON.stringify(kho));
  // Nhánh vai học viên (0119) cũng viết lại kho_them_nhan_su: hai file cùng "create or replace" một hàm thì file chạy
  // sau đè file chạy trước. 0123 chặn bằng trigger để gộp theo thứ tự nào cũng đúng.
  const { readFileSync } = await import('node:fs');
  const sql = readFileSync(join(GOC, 'crm/supabase/migrations/0123_kho_tai_khoan_vua_tao.sql'), 'utf8').replace(/--[^\n]*/g, '');
  ok('0123 không viết lại thân kho_them_nhan_su (không đè bản của migration khác)', !/create\s+(or\s+replace\s+)?function\s+kho_them_nhan_su/i.test(sql));
  ok('Câu mới có bản tiếng Anh', (() => { const en = dichCau('en', CAU); return en !== CAU && !VIET.test(en); })(), dichCau('en', CAU));
});

// ===========================================================================
await nhom('7 · Sổ kho không bị đụng', async () => {
  const { rows } = await db.query(`select * from kho_doi_soat_ton()`);
  ok('kho_doi_soat_ton() rỗng', rows.length === 0, JSON.stringify(rows).slice(0, 200));
});

process.exit(ketThuc('tài khoản nhân viên mới và email đã bị đăng ký trước'));
