/**
 * BEEFTOWN — Kiểm thử: đăng nhập không thành thì trang báo lỗi là một lượt GET, không phải trả lời của lượt gửi form
 * ==============================================================================================================
 *
 *     node test/test-noi-bo-dang-nhap.mjs
 *
 * Rà soát vòng bốn của PR #188 (14/11/2026). Trang đăng nhập dựng câu báo lỗi ngay trong trả lời của lượt gửi form
 * (HTTP 200). Mục lịch sử của trang đó là một lượt POST, giữ nguyên thân form — cả email lẫn mật khẩu — trong trình
 * duyệt; tải lại mục đó là gửi lại form.
 *
 * Bản sửa (web/src/lib/phien.ts, web/src/pages/noi-bo/dang-nhap.astro): MỌI lượt gửi form đăng nhập kết thúc bằng
 * 303 sang GET — vào trong khi đăng nhập được, về /noi-bo/dang-nhap khi không. Câu lỗi đi qua cookie bt_loi_dang_nhap:
 * HttpOnly, sống 60 giây, chỉ gửi kèm trang đăng nhập, đọc một lần là xóa. Cookie mang MÃ của câu (không mang chữ
 * lạ được) và email đã gõ để điền lại — KHÔNG BAO GIỜ mang mật khẩu. Địa chỉ chuyển tới là chuỗi cố định, không mang
 * gì của form. Trang lỗi không vào bộ đệm (no-store); rời trang đăng nhập là ô mật khẩu bị xóa.
 *
 * Phần trình duyệt thật: web/kiem-tra/trinh-duyet.mjs nhóm 4 (bản build: lịch sử không còn mục POST nào, Quay lại /
 * Tiến + tải lại không gửi lại gì), web/kiem-tra/thu-day-du.mjs nhóm 14 (đăng nhập sai thật qua Supabase Auth giả).
 * Dòng "RÀ SOÁT VÒNG BỐN" đỏ trước bản sửa.
 *
 * Cần web/node_modules — như test-qua-tai.mjs.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import * as phien from '../../web/src/lib/phien.ts';
import { CAU_DANG_NHAP_TAM } from '../../web/src/lib/qua-tai.ts';
import { dichCau } from '../../web/src/lib/cau-noi-bo.ts';
import { timChuoiCam } from '../../web/src/lib/chuoi-cam.js';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEB = join(GOC, 'web', 'src');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — ĐĂNG NHẬP KHÔNG THÀNH: TRANG LỖI LÀ MỘT LƯỢT GET');

const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/i;
const { guiFormDangNhap, docLoiDangNhap, LOI_DANG_NHAP, COOKIE_LOI_DANG_NHAP } = phien;
const COOKIE = COOKIE_LOI_DANG_NHAP ?? 'bt_loi_dang_nhap';
const DUONG = '/noi-bo/dang-nhap';
const MAT_KHAU = 'Mk-Thu-9f1a·bi-mat';   // chuỗi dễ nhận ra: không được nằm trong bất kỳ cookie nào
const coHam = typeof guiFormDangNhap === 'function' && typeof docLoiDangNhap === 'function' && !!LOI_DANG_NHAP;

// Câu hiện có, chép tay từ bản trước của trang (không đọc lib): bản sửa phải giữ đúng từng chữ, cả hai thứ tiếng.
const CAU_CU = {
  thieu: { vi: 'Vui lòng điền email và mật khẩu.', en: 'Please enter your email and password.' },
  chua_noi_database: { vi: 'Chưa nối database. Xem hướng dẫn trong web/README.md.', en: 'No database connected. See web/README.md.' },
  qua_tai: CAU_DANG_NHAP_TAM.qua_tai,
  mat_ket_noi: CAU_DANG_NHAP_TAM.mat_ket_noi,
  sai: { vi: 'Email hoặc mật khẩu không đúng.', en: 'Wrong email or password.' },
  chua_noi_nhan_su: {
    vi: 'Tài khoản này chưa được nối với nhân sự nào. Liên hệ chủ nhà hàng.',
    en: 'This account is not linked to any staff member yet. Please contact the owner.',
  },
};

// ===========================================================================
// COOKIE GIẢ — đủ ba việc AstroCookies phien.ts dùng: get, set, delete. Ghi lại từng lần set / delete kèm tùy chọn.
// ===========================================================================
function hopCookie(dau = {}) {
  const kho = new Map(Object.entries(dau));
  const ghi = [];
  const xoa = [];
  return {
    get: ten => (kho.has(ten) ? { value: kho.get(ten) } : undefined),
    has: ten => kho.has(ten),
    set: (ten, v, tc) => { ghi.push({ ten, v: String(v), tc }); kho.set(ten, String(v)); },
    delete: (ten, tc) => { xoa.push({ ten, tc }); kho.delete(ten); },
    ghi, xoa,
    giaTri: ten => kho.get(ten),
  };
}

/** Một lượt POST của form đăng nhập, như trình duyệt gửi (application/x-www-form-urlencoded). */
const yeuCau = truong => new Request('https://beeftown.test/noi-bo/dang-nhap', {
  method: 'POST', body: new URLSearchParams(truong),
});

/** Gửi form với một hàm đăng nhập giả. Trả { vao, cookies, goi, loi, canhBao }. */
async function gui(truong, thuDangNhap, cookies = hopCookie()) {
  const goi = [];
  const goc = console.warn;
  const canhBao = [];
  console.warn = (...p) => { canhBao.push(p.join(' ')); };
  let vao, loi = null;
  try {
    vao = await guiFormDangNhap(cookies, truong instanceof Request ? truong : yeuCau(truong), {
      thuDangNhap: async (...thamSo) => { goi.push(thamSo); return thuDangNhap(...thamSo); },
    });
  } catch (e) { loi = String(e?.message ?? e); } finally { console.warn = goc; }
  return { vao, cookies, goi, loi, canhBao };
}

/** Lần ghi cookie lỗi (đúng một lần), giải mã như trình duyệt sẽ gửi lại. */
function cookieLoi(cookies) {
  const lan = cookies.ghi.filter(g => g.ten === COOKIE);
  if (lan.length !== 1) return { soLan: lan.length };
  let giaTri = null;
  try { giaTri = JSON.parse(lan[0].v); } catch { /* để null */ }
  return { soLan: 1, tho: lan[0].v, giaTri, tc: lan[0].tc };
}

/** Tùy chọn cookie lỗi đúng quy tắc: HttpOnly, SameSite=Lax, chỉ đường dẫn trang đăng nhập, sống 1–60 giây. */
const tuyChonDung = tc => !!tc && tc.httpOnly === true && tc.sameSite === 'lax' && tc.path === DUONG
  && Number.isInteger(tc.maxAge) && tc.maxAge > 0 && tc.maxAge <= 60 && !('expires' in tc) && !('domain' in tc);

// ===========================================================================
await nhom('1 · MỌI LƯỢT GỬI FORM KẾT THÚC BẰNG CHUYỂN HƯỚNG SANG GET (guiFormDangNhap)', async () => {
  ok('RÀ SOÁT VÒNG BỐN: phien.ts có guiFormDangNhap, docLoiDangNhap, LOI_DANG_NHAP, COOKIE_LOI_DANG_NHAP',
     coHam && typeof COOKIE_LOI_DANG_NHAP === 'string', Object.keys(phien).join(', '));
  if (!coHam) return;

  const CA = [
    ['Sai email hoặc mật khẩu', CAU_CU.sai.vi, 'sai'],
    ['Supabase quá tải (429)', CAU_CU.qua_tai.vi, 'qua_tai'],
    ['Mất kết nối tới máy chủ đăng nhập', CAU_CU.mat_ket_noi.vi, 'mat_ket_noi'],
    ['Tài khoản chưa nối nhân sự', CAU_CU.chua_noi_nhan_su.vi, 'chua_noi_nhan_su'],
    ['Chưa nối database', CAU_CU.chua_noi_database.vi, 'chua_noi_database'],
  ];
  for (const [ten, cau, ma] of CA) {
    const r = await gui({ email: 'thu@beeftown.test', mat_khau: MAT_KHAU }, async () => cau);
    const c = cookieLoi(r.cookies);
    ok(`${ten}: không ném lỗi, trả "chưa vào" (trang chuyển về GET /noi-bo/dang-nhap)`, r.loi === null && r.vao === false, r.loi ?? String(r.vao));
    ok(`${ten}: ghi đúng MỘT cookie lỗi, mang mã "${ma}" và email đã gõ — chỉ hai khóa đó`,
       c.soLan === 1 && c.giaTri?.ma === ma && c.giaTri?.email === 'thu@beeftown.test'
       && Object.keys(c.giaTri ?? {}).sort().join() === 'email,ma', JSON.stringify(c));
    ok(`${ten}: cookie KHÔNG mang mật khẩu, không mang chữ của câu`, c.soLan === 1 && !c.tho.includes(MAT_KHAU)
       && !c.tho.includes('mat_khau') && !c.tho.includes(cau), c.tho);
    ok(`${ten}: cookie HttpOnly, SameSite=Lax, Path=${DUONG}, sống không quá 60 giây`, tuyChonDung(c.tc), JSON.stringify(c.tc));
    ok(`${ten}: hàm đăng nhập được gọi đúng một lần, với email đã bỏ khoảng trắng hai đầu và mật khẩu NGUYÊN VĂN`,
       r.goi.length === 1 && r.goi[0][0] === r.cookies && r.goi[0][1] === 'thu@beeftown.test' && r.goi[0][2] === MAT_KHAU,
       JSON.stringify(r.goi.map(g => g.slice(1))));
  }

  // Mật khẩu có khoảng trắng hai đầu: phải tới Supabase y nguyên (bỏ khoảng trắng là đổi mật khẩu người ta gõ).
  const r1 = await gui({ email: '  thu@beeftown.test \t', mat_khau: '  co khoang trang  ' }, async () => CAU_CU.sai.vi);
  ok('Email được bỏ khoảng trắng hai đầu; mật khẩu giữ nguyên khoảng trắng', r1.goi[0]?.[1] === 'thu@beeftown.test'
     && r1.goi[0]?.[2] === '  co khoang trang  ' && cookieLoi(r1.cookies).giaTri?.email === 'thu@beeftown.test', JSON.stringify(r1.goi.map(g => g.slice(1))));

  // Thiếu ô: không hỏi Supabase, câu "điền email và mật khẩu". Email đã gõ vẫn được điền lại.
  for (const [ten, truong, email] of [
    ['Thiếu mật khẩu', { email: 'thu@beeftown.test', mat_khau: '' }, 'thu@beeftown.test'],
    ['Thiếu email', { email: '', mat_khau: MAT_KHAU }, ''],
    ['Email toàn khoảng trắng', { email: '   ', mat_khau: MAT_KHAU }, ''],
    ['Không có ô nào', {}, ''],
  ]) {
    const r = await gui(truong, async () => { throw new Error('không được gọi'); });
    const c = cookieLoi(r.cookies);
    ok(`${ten}: không gọi Supabase; mã "thieu", email "${email}"; không ném lỗi`,
       r.loi === null && r.vao === false && r.goi.length === 0 && c.giaTri?.ma === 'thieu' && c.giaTri?.email === email
       && !c.tho.includes(MAT_KHAU) && tuyChonDung(c.tc), JSON.stringify({ c, loi: r.loi }));
  }

  // Thân form không đọc được (kiểu multipart mà không có ranh giới): trang vẫn phải chuyển hướng, không thành 500 —
  // trang 500 cũng là trả lời của lượt POST.
  const hong = new Request('https://beeftown.test/noi-bo/dang-nhap', {
    method: 'POST', headers: { 'content-type': 'multipart/form-data' }, body: 'email=thu%40beeftown.test',
  });
  const r2 = await gui(hong, async () => { throw new Error('không được gọi'); });
  ok('Thân form hỏng: không ném lỗi, không gọi Supabase, mã "thieu"', r2.loi === null && r2.vao === false && r2.goi.length === 0
     && cookieLoi(r2.cookies).giaTri?.ma === 'thieu', JSON.stringify({ loi: r2.loi, c: cookieLoi(r2.cookies) }));

  // Hàm đăng nhập ném lỗi bất ngờ (dựng client hỏng…): vẫn chuyển hướng, câu "chưa kết nối được máy chủ đăng nhập"
  // (không nói sai mật khẩu), và một dòng nhật ký [qua-tai] không mang email.
  const r3 = await gui({ email: 'thu@beeftown.test', mat_khau: MAT_KHAU }, async () => { throw new TypeError('thu@beeftown.test lỗi lạ'); });
  ok('Hàm đăng nhập ném lỗi: không ném ra ngoài, mã "mat_ket_noi", email vẫn được điền lại',
     r3.loi === null && r3.vao === false && cookieLoi(r3.cookies).giaTri?.ma === 'mat_ket_noi'
     && cookieLoi(r3.cookies).giaTri?.email === 'thu@beeftown.test', JSON.stringify({ loi: r3.loi, c: cookieLoi(r3.cookies) }));
  ok('…và ghi một dòng nhật ký "[qua-tai] đăng nhập", không chép chữ của lỗi (có thể mang email)',
     r3.canhBao.length === 1 && r3.canhBao[0].startsWith('[qua-tai] đăng nhập') && !/@|lỗi lạ/.test(r3.canhBao[0]), r3.canhBao.join(' | '));

  // Câu lạ (không có trong bảng — kiểm ở nhóm 3 rằng chuyện này không thể xảy ra): vẫn chuyển hướng, câu không nói sai mật khẩu.
  const r4 = await gui({ email: 'thu@beeftown.test', mat_khau: MAT_KHAU }, async () => 'Một câu lạ chưa có mã.');
  ok('Câu lạ không có mã: vẫn chuyển hướng, cookie mang mã "mat_ket_noi" (không mang chữ lạ)',
     r4.loi === null && r4.vao === false && cookieLoi(r4.cookies).giaTri?.ma === 'mat_ket_noi'
     && !cookieLoi(r4.cookies).tho.includes('câu lạ'), JSON.stringify(cookieLoi(r4.cookies)));

  // Email quá dài (Supabase không nhận email quá 254 ký tự): không điền lại — cookie không phình quá cỡ trình duyệt nhận.
  const dai = 'a'.repeat(250) + '@b.vn';
  const r5 = await gui({ email: dai, mat_khau: MAT_KHAU }, async () => CAU_CU.sai.vi);
  ok('Email dài hơn 254 ký tự: vẫn có câu lỗi, không điền lại email', cookieLoi(r5.cookies).giaTri?.ma === 'sai'
     && cookieLoi(r5.cookies).giaTri?.email === '', String(cookieLoi(r5.cookies).tho?.length));
  const vua = 'a'.repeat(249) + '@b.vn';
  const r6 = await gui({ email: vua, mat_khau: MAT_KHAU }, async () => CAU_CU.sai.vi);
  ok('Email đúng 254 ký tự: được điền lại', cookieLoi(r6.cookies).giaTri?.email === vua);

  // Đăng nhập được: vào trong, không ghi cookie lỗi; cookie lỗi cũ còn sót (lượt GET trước không về tới) bị xóa.
  const cu = hopCookie({ [COOKIE]: JSON.stringify({ ma: 'sai', email: 'cu@beeftown.test' }) });
  const r7 = await gui({ email: 'thu@beeftown.test', mat_khau: MAT_KHAU }, async () => null, cu);
  ok('Đăng nhập được: trả "vào"; không ghi cookie lỗi; cookie lỗi cũ bị xóa đúng đường dẫn',
     r7.loi === null && r7.vao === true && cookieLoi(r7.cookies).soLan === 0
     && r7.cookies.xoa.some(x => x.ten === COOKIE && x.tc?.path === DUONG) && !r7.cookies.has(COOKIE), JSON.stringify(r7.cookies.xoa));
  const r8 = await gui({ email: 'thu@beeftown.test', mat_khau: MAT_KHAU }, async () => null);
  ok('Đăng nhập được, không có cookie lỗi cũ: không xóa gì (không thêm Set-Cookie thừa)', r8.vao === true
     && r8.cookies.xoa.length === 0 && r8.cookies.ghi.length === 0, JSON.stringify(r8.cookies.xoa));
});

// ===========================================================================
await nhom('2 · COOKIE LỖI ĐỌC MỘT LẦN LÀ HẾT (docLoiDangNhap)', async () => {
  if (!coHam) { ok('RÀ SOÁT VÒNG BỐN: có docLoiDangNhap để thử', false); return; }
  const r = await gui({ email: 'thu@beeftown.test', mat_khau: MAT_KHAU }, async () => CAU_CU.sai.vi);
  const tho = r.cookies.giaTri(COOKIE);
  const jar = hopCookie({ [COOKIE]: tho });
  const doc1 = docLoiDangNhap(jar);
  ok('Đọc lại đúng mã và email của lần gửi', doc1?.ma === 'sai' && doc1?.email === 'thu@beeftown.test', JSON.stringify(doc1));
  ok('…chỉ hai khóa ma, email', Object.keys(doc1 ?? {}).sort().join() === 'email,ma', JSON.stringify(doc1));
  ok('Đọc là xóa — đúng đường dẫn của cookie', jar.xoa.length === 1 && jar.xoa[0].ten === COOKIE && jar.xoa[0].tc?.path === DUONG,
     JSON.stringify(jar.xoa));
  ok('Đọc lần hai: không còn gì (tải lại trang lỗi là form trống)', docLoiDangNhap(jar) === null);

  const trong = hopCookie();
  ok('Không có cookie: null, không xóa gì (không thêm Set-Cookie vào mọi lượt mở trang)',
     docLoiDangNhap(trong) === null && trong.xoa.length === 0 && trong.ghi.length === 0);

  // Cookie bị sửa tay hay bị đặt từ nơi khác: chỉ mã có trong bảng mới thành câu; giá trị nào cũng bị xóa.
  const dai = 'a'.repeat(250) + '@b.vn';
  for (const [ten, giaTri, mong] of [
    ['không phải JSON', 'khong-phai-json', null],
    ['mã lạ', JSON.stringify({ ma: 'cau-la', email: 'x@y.z' }), null],
    ['mã "__proto__"', '{"ma":"__proto__","email":"x@y.z"}', null],
    ['mã "toString"', JSON.stringify({ ma: 'toString' }), null],
    ['mã là số', JSON.stringify({ ma: 1 }), null],
    ['mảng', '[]', null],
    ['null', 'null', null],
    ['chuỗi JSON', '"sai"', null],
    ['email không phải chuỗi', JSON.stringify({ ma: 'sai', email: 123 }), { ma: 'sai', email: '' }],
    ['email quá dài', JSON.stringify({ ma: 'sai', email: dai }), { ma: 'sai', email: '' }],
    ['thiếu email', JSON.stringify({ ma: 'qua_tai' }), { ma: 'qua_tai', email: '' }],
    ['có thêm khóa lạ', JSON.stringify({ ma: 'sai', email: 'x@y.z', mat_khau: 'abc', cau: 'Chữ lạ' }), { ma: 'sai', email: 'x@y.z' }],
  ]) {
    const j = hopCookie({ [COOKIE]: giaTri });
    const ra = docLoiDangNhap(j);
    ok(`Cookie ${ten}: ${mong ? JSON.stringify(mong) : 'bỏ qua'}; cookie vẫn bị xóa`,
       JSON.stringify(ra) === JSON.stringify(mong) && j.xoa.length === 1 && j.xoa[0].tc?.path === DUONG, JSON.stringify(ra));
  }
});

// ===========================================================================
await nhom('3 · CÂU LỖI GIỮ NGUYÊN CHỮ, ĐỦ HAI THỨ TIẾNG', async () => {
  if (!coHam) { ok('RÀ SOÁT VÒNG BỐN: có LOI_DANG_NHAP để thử', false); return; }
  ok('Bảng mã có đúng sáu câu của trang đăng nhập', Object.keys(LOI_DANG_NHAP).sort().join() === Object.keys(CAU_CU).sort().join(),
     Object.keys(LOI_DANG_NHAP).join(', '));
  for (const [ma, c] of Object.entries(CAU_CU)) {
    ok(`${ma}: câu tiếng Việt giữ nguyên từng chữ`, LOI_DANG_NHAP[ma] === c.vi, LOI_DANG_NHAP[ma]);
    ok(`${ma}: bản tiếng Anh giữ nguyên từng chữ (dichCau)`, dichCau('en', LOI_DANG_NHAP[ma] ?? '') === c.en, dichCau('en', LOI_DANG_NHAP[ma] ?? ''));
    ok(`${ma}: bản tiếng Anh không còn chữ Việt`, !VIET.test(c.en), c.en);
    ok(`${ma}: không chứa chữ cấm (cả hai thứ tiếng)`, timChuoiCam(`${c.vi} ${c.en}`).length === 0, JSON.stringify(timChuoiCam(`${c.vi} ${c.en}`)));
  }
  ok('Supabase bận / mất mạng: vẫn nói rõ "không phải do sai mật khẩu" (vi) / "your password is not the problem" (en)',
     ['qua_tai', 'mat_ket_noi'].every(ma => /không phải do sai mật khẩu/.test(LOI_DANG_NHAP[ma])
       && /your password is not the problem/.test(dichCau('en', LOI_DANG_NHAP[ma]))));

  // Mọi câu dangNhap có thể trả đều có mã — thiếu một câu là trang sau chỉ hiện được câu chung.
  const nguon = readFileSync(join(WEB, 'lib', 'phien.ts'), 'utf8');
  const dn = nguon.slice(nguon.indexOf('export async function dangNhap'));
  const cauTra = [...dn.slice(0, dn.indexOf('\n}')).matchAll(/return '([^']+)'/g)].map(m => m[1]);
  const giaTri = new Set(Object.values(LOI_DANG_NHAP));
  ok(`${cauTra.length} câu dangNhap trả về đều có mã trong bảng`, cauTra.length >= 5 && cauTra.every(c => giaTri.has(c)),
     cauTra.filter(c => !giaTri.has(c)).join(' | '));
  ok('…và mọi mã (trừ "thieu" của trang) là một câu dangNhap thật sự trả',
     Object.entries(LOI_DANG_NHAP).every(([ma, c]) => ma === 'thieu' || cauTra.includes(c)),
     Object.entries(LOI_DANG_NHAP).filter(([ma, c]) => ma !== 'thieu' && !cauTra.includes(c)).map(([ma]) => ma).join(', '));

  // Không truyền hàm giả: dangNhap thật. Máy chạy kiểm thử không có PUBLIC_SUPABASE_* → nhánh "chưa nối database".
  const r = await guiFormDangNhap(hopCookie(), yeuCau({ email: 'thu@beeftown.test', mat_khau: MAT_KHAU }))
    .then(vao => ({ vao }), e => ({ loi: String(e?.message ?? e) }));
  ok('dangNhap thật (không có database): chuyển về trang đăng nhập với mã "chua_noi_database"', r.vao === false, JSON.stringify(r));
});

// ===========================================================================
await nhom('4 · TRANG ĐĂNG NHẬP (mã nguồn): POST CHỈ CHUYỂN HƯỚNG, GET ĐỌC CÂU LỖI', async () => {
  const trang = readFileSync(join(WEB, 'pages', 'noi-bo', 'dang-nhap.astro'), 'utf8');
  const dau = trang.indexOf('---') + 3;
  const phanMa = trang.slice(dau, trang.indexOf('\n---', dau));
  const mau = phanMa.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const iPost = mau.indexOf("if (Astro.request.method === 'POST') {");
  let khoiPost = '';
  if (iPost >= 0) {
    // Khối if của lượt POST: đếm ngoặc nhọn tới dấu đóng của nó.
    let sau = 0;
    for (let i = iPost + "if (Astro.request.method === 'POST') ".length; i < mau.length; i++) {
      if (mau[i] === '{') sau++;
      else if (mau[i] === '}' && --sau === 0) { khoiPost = mau.slice(iPost, i + 1); break; }
    }
  }
  ok('Có khối xử lý lượt POST', khoiPost.length > 0, iPost < 0 ? 'không thấy' : '');
  const cacReturn = [...khoiPost.matchAll(/return\s+([^;]+);/g)].map(m => m[1].trim());
  ok('RÀ SOÁT VÒNG BỐN: lượt POST KHÔNG BAO GIỜ dựng trang — khối POST chỉ có hai lối ra, cả hai là chuyển hướng 303',
     cacReturn.length === 2 && cacReturn.includes("Astro.redirect('/noi-bo/kho', 303)")
     && cacReturn.includes("Astro.redirect('/noi-bo/dang-nhap', 303)")
     && /return Astro\.redirect\('\/noi-bo\/dang-nhap', 303\);\s*\}$/.test(khoiPost), cacReturn.join(' | ') || '(không có return)');
  ok('RÀ SOÁT VÒNG BỐN: lượt POST đi qua guiFormDangNhap (không tự đọc form, không tự gán câu lỗi)',
     /await guiFormDangNhap\(Astro\.cookies, Astro\.request\)/.test(khoiPost) && !/\bloi\s*=/.test(khoiPost)
     && !/formData\(/.test(khoiPost), khoiPost.slice(0, 300));
  ok('Địa chỉ chuyển tới là chuỗi cố định — không ghép gì của form vào URL',
     ![...mau.matchAll(/redirect\(([^)]*)\)/g)].some(m => /[`$+]|email|mat_khau|form/.test(m[1])),
     [...mau.matchAll(/redirect\(([^)]*)\)/g)].map(m => m[1]).join(' | '));
  ok('RÀ SOÁT VÒNG BỐN: lượt GET đọc câu lỗi từ cookie (docLoiDangNhap), chỉ ở lượt GET',
     /Astro\.request\.method === 'GET'[^\n;]*docLoiDangNhap\(Astro\.cookies\)|docLoiDangNhap\(Astro\.cookies\)[\s\S]{0,80}'GET'/.test(mau)
     || /if \(Astro\.request\.method === 'GET'\) \{[^}]*docLoiDangNhap\(Astro\.cookies\)/.test(mau), '');
  ok('RÀ SOÁT VÒNG BỐN: trang mang câu lỗi của một lần gửi thì không vào bộ đệm (Cache-Control: no-store)',
     /Astro\.response\.headers\.set\('cache-control', 'no-store'\)/.test(mau));
  ok('Đã đăng nhập thì vẫn đi thẳng vào trong (302 về /noi-bo), như trước', /return Astro\.redirect\('\/noi-bo', 302\)/.test(mau));

  // Phần HTML: email điền lại, mật khẩu thì không bao giờ.
  const html = trang.slice(trang.indexOf('\n---', dau) + 4);
  const oEmail = html.match(/<input\b[^>]*name="email"[^>]*>/)?.[0] ?? '';
  const oMatKhau = html.match(/<input\b[^>]*name="mat_khau"[^>]*>/)?.[0] ?? '';
  ok('Ô email điền lại email của lần gửi trước (value lấy từ cookie lỗi)', /\bvalue=\{[^}]*email[^}]*\}/.test(oEmail), oEmail.replace(/\s+/g, ' '));
  ok('Ô mật khẩu KHÔNG BAO GIỜ có value', oMatKhau.length > 0 && !/\bvalue=/.test(oMatKhau), oMatKhau.replace(/\s+/g, ' '));
  ok('Câu lỗi vẫn hiện trong khung nb-bao loi', /\{loi && <div class="nb-bao loi"><p>\{loi\}<\/p><\/div>\}/.test(html));
  // Rời trang là xóa mọi ô mật khẩu. Đợt 2 của #194 đưa việc này về đoạn mã dùng chung của mọi trang nội bộ
  // (lib/sau-dang-xuat.js) — khung NoiBo in nó vào <head> ở mọi lượt dựng trang, kể cả bản build không database.
  // Chạy thật đoạn mã: test-kho-may-lich-su.mjs nhóm 4; trình duyệt thật: trinh-duyet.mjs nhóm 4.
  const sdx = readFileSync(join(WEB, 'lib', 'sau-dang-xuat.js'), 'utf8');
  const roi = sdx.slice(sdx.indexOf("window.addEventListener('pagehide'"));
  const thanRoi = roi.slice(0, roi.indexOf('});') + 3);
  ok('RÀ SOÁT VÒNG BỐN: rời trang (pagehide) là xóa mọi ô mật khẩu — đoạn mã dùng chung lib/sau-dang-xuat.js; trang đăng nhập dùng khung NoiBo, khung in đoạn mã đó',
     /<NoiBo\b/.test(html) && /<SauDangXuat \/>/.test(readFileSync(join(WEB, 'layouts', 'NoiBo.astro'), 'utf8'))
     && /xoaMatKhau\(\);\s*\}\);$/.test(thanRoi)
     && /querySelectorAll\('input\[type="password"\]'\);\s*for \(var i = 0; i < o\.length; i\+\+\) o\[i\]\.value = '';/.test(sdx),
     thanRoi.slice(0, 200) || '(không thấy)');
});

// ===========================================================================
await nhom('5 · CHỖ DỄ BỊ SỬA NGƯỢC', async () => {
  const nguon = readFileSync(join(WEB, 'lib', 'phien.ts'), 'utf8');
  ok('Cookie lỗi đăng nhập: maxAge 60, path /noi-bo/dang-nhap, httpOnly — ghi một chỗ trong phien.ts',
     /const COOKIE_LOI_DANG_NHAP = 'bt_loi_dang_nhap'/.test(nguon)
     && /httpOnly: true,[\s\S]{0,160}sameSite: 'lax',\s*path: DUONG_DANG_NHAP,\s*maxAge: 60,/.test(nguon));
  const g = nguon.slice(nguon.indexOf('export async function guiFormDangNhap'));
  const than = g.slice(0, g.indexOf('\n}'));
  ok('guiFormDangNhap không đưa mật khẩu vào cookie lỗi (chỉ ghiLoiDangNhap(cookies, ma, email))',
     than.length > 0 && /ghiLoiDangNhap\(cookies, ma, email\)/.test(than) && !/ghiLoiDangNhap\([^)]*matKhau/.test(than), than.slice(0, 120));
  ok('dangNhap vẫn trả câu nguyên văn (test-qua-tai.mjs nhóm 3 khớp theo chữ)', /return 'Email hoặc mật khẩu không đúng\.';/.test(nguon));
});

process.exit(ketThuc('ĐĂNG NHẬP KHÔNG THÀNH'));
