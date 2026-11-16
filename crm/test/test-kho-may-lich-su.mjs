/**
 * BEEFTOWN — Kiểm thử: máy tính bảng dùng chung — lượt gửi form nào cũng kết thúc bằng 303 (đợt 2 của #194)
 * =====================================================================================================
 *
 *     node test/test-kho-may-lich-su.mjs
 *
 * Đợt 1 (#195) đổi trang đăng nhập. Ba trang của máy dùng chung — mở máy bằng PIN (/noi-bo/kho/may), gắn người /
 * đổi PIN (/noi-bo/kho/may/gan), đăng ký máy (/noi-bo/kho/may/dang-ky) — vẫn dựng trang báo lỗi ngay trong trả lời
 * của lượt gửi form: mục lịch sử đó giữ nguyên thân form (mật khẩu, PIN) trên một máy nhiều người dùng.
 *
 * Bản sửa:
 *   · lib/kho/trang.ts guiRoiChuyen — lượt POST của ba trang đi qua đúng một hàm, LUÔN trả 303: lưu được thì sang
 *     trang đích, không được (thân form hỏng, việc không hợp lệ, lỗi bất ngờ) thì về chính trang đó. Câu báo đi qua
 *     cookie báo sẵn có của kho (bt_kho_bao).
 *   · lib/kho/bao.ts ghiNhapLai / docNhapLai — chữ cần điền lại (email, tên máy, số phút) đi qua cookie dùng một lần,
 *     chỉ của đúng trang đó, sống 60 giây; chỉ các ô trang liệt kê, và KHÔNG BAO GIỜ ô mật khẩu / PIN.
 *   · lib/sau-dang-xuat.js — rời trang nội bộ nào cũng xóa mọi ô mật khẩu / PIN (trước chỉ trang đăng nhập có, bằng
 *     đoạn mã riêng). Trình duyệt thật: web/kiem-tra/trinh-duyet.mjs nhóm 4, cảnh "xóa ô mật khẩu khi rời trang".
 *
 * Còn lại, làm đợt sau (#194): trang "hệ thống đang bận" (Supabase bận khi kiểm phiên) vẫn là trả lời của lượt POST.
 * Dòng "#194" đỏ trước bản sửa.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { taoBoDem } from './kho-chung.mjs';

process.env.KHO_MAY_KHOA = 'bi-mat-thu-cho-may-dung-chung-0123456789abcdef';
const trang = await import('../../web/src/lib/kho/trang.ts');
const bao = await import('../../web/src/lib/kho/bao.ts');
const { CAU_DOC_FORM_HONG } = await import('../../web/src/lib/gui-noi-bo.ts');
const { LOI_KHO_CHUNG } = await import('../../web/src/lib/kho/chung.ts');

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = f => readFileSync(join(GOC, f), 'utf8');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MÁY DÙNG CHUNG: LƯỢT GỬI FORM NÀO CŨNG KẾT THÚC BẰNG 303 (#194)');

const { guiRoiChuyen } = trang;
const { ghiNhapLai, docNhapLai } = bao;
const coHam = typeof guiRoiChuyen === 'function' && typeof ghiNhapLai === 'function' && typeof docNhapLai === 'function';
const COOKIE_NHAP_LAI = 'bt_kho_nhap_lai';
const DUONG_GAN = '/noi-bo/kho/may/gan';
const MK = 'Mk-May-7f2c·bi-mat';
const PIN = '4826';
const BI_MAT = new RegExp([MK, PIN].map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'));

// ===========================================================================
// COOKIE GIẢ, ASTRO GIẢ — đủ thứ guiRoiChuyen dùng: request, locals, cookies, redirect
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
const yeuCau = (truong, { hong = false } = {}) => new Request('https://beeftown.test' + DUONG_GAN, hong
  ? { method: 'POST', headers: { 'content-type': 'multipart/form-data' }, body: 'mat_khau=' + MK }
  : { method: 'POST', body: new URLSearchParams(truong) });
function taoAstro(truong, tuyChon) {
  return {
    request: yeuCau(truong, tuyChon), locals: {}, cookies: hopCookie(),
    redirect: (url, status = 302) => new Response(null, { status, headers: { Location: url } }),
  };
}
/** Gọi guiRoiChuyen như một trang; trả { tl, astro, goiXuLy, loi, canhBao }. */
async function gui(truong, xuLy, { cacO = [], tuyChon } = {}) {
  const astro = taoAstro(truong, tuyChon);
  let goiXuLy = 0;
  const canhBao = [];
  const goc = console.error;
  console.error = (...p) => { canhBao.push(p.map(String).join(' ')); };
  let tl = null, loi = null;
  try {
    tl = await guiRoiChuyen(astro, DUONG_GAN, async form => { goiXuLy++; return xuLy(form); }, cacO);
  } catch (e) { loi = String(e?.message ?? e); } finally { console.error = goc; }
  return { tl, astro, goiXuLy, loi, canhBao };
}
const cookieBao = astro => { try { return JSON.parse(astro.cookies.giaTri('bt_kho_bao') ?? 'null'); } catch { return null; } };
const lanGhi = (astro, ten) => astro.cookies.ghi.filter(g => g.ten === ten);
const tuyChonNhapLaiDung = (tc, duong) => !!tc && tc.httpOnly === true && tc.sameSite === 'lax' && tc.path === duong
  && Number.isInteger(tc.maxAge) && tc.maxAge > 0 && tc.maxAge <= 60 && !('domain' in tc);

// ===========================================================================
await nhom('1 · guiRoiChuyen: MỌI KẾT CỤC CỦA LƯỢT GỬI LÀ 303', async () => {
  ok('#194: lib/kho/trang.ts có guiRoiChuyen, lib/kho/bao.ts có ghiNhapLai, docNhapLai', coHam,
     `trang: ${Object.keys(trang).join(', ')} · bao: ${Object.keys(bao).join(', ')}`);
  if (!coHam) return;

  // Lưu được: sang trang đích, câu báo đi theo bt_kho_bao, không có gì để điền lại.
  const xong = await gui({ viec: 'gan', email: 'a@b.vn', mat_khau: MK, pin: PIN, pin_lai: PIN },
    async () => ({ kq: { ok: true, cau: 'Đã gắn.', cauEn: 'Added.' }, toi: '/noi-bo/kho' }), { cacO: ['email'] });
  ok('#194: lưu được → 303 sang trang đích', xong.loi === null && xong.tl?.status === 303 && xong.tl.headers.get('location') === '/noi-bo/kho',
     xong.loi ?? `${xong.tl?.status} ${xong.tl?.headers.get('location')}`);
  ok('…câu báo nằm trong bt_kho_bao, đủ hai thứ tiếng', cookieBao(xong.astro)?.ok === true && cookieBao(xong.astro)?.cau === 'Đã gắn.'
     && cookieBao(xong.astro)?.cauEn === 'Added.', JSON.stringify(cookieBao(xong.astro)));
  ok('…không ghi cookie điền lại', lanGhi(xong.astro, COOKIE_NHAP_LAI).length === 0);

  // Không lưu được: về chính trang, câu lỗi, chữ điền lại CHỈ các ô trang liệt kê — mật khẩu, PIN không bao giờ.
  const loi = await gui({ viec: 'gan', email: 'a@b.vn', mat_khau: MK, pin: PIN, pin_lai: PIN },
    async form => ({ kq: { ok: false, cau: 'Email hoặc mật khẩu không đúng.' },
      nhapLai: { email: String(form.get('email')), mat_khau: String(form.get('mat_khau')), pin: PIN, pin_lai: PIN, la: 'x' } }),
    { cacO: ['email', 'mat_khau', 'pin', 'pin_lai'] });
  ok('#194: không lưu được → 303 về chính trang (không dựng trang trong trả lời của lượt POST)',
     loi.tl?.status === 303 && loi.tl.headers.get('location') === DUONG_GAN, `${loi.tl?.status} ${loi.tl?.headers.get('location')}`);
  ok('…câu lỗi nằm trong bt_kho_bao', cookieBao(loi.astro)?.ok === false && cookieBao(loi.astro)?.cau === 'Email hoặc mật khẩu không đúng.');
  const nl = lanGhi(loi.astro, COOKIE_NHAP_LAI);
  let giaTri = null;
  try { giaTri = JSON.parse(nl[0]?.v ?? 'null'); } catch { /* để null */ }
  ok('#194: cookie điền lại chỉ có ô email — ô mật khẩu, PIN bị bỏ kể cả khi trang lỡ liệt kê; ô lạ bị bỏ',
     nl.length === 1 && JSON.stringify(giaTri) === JSON.stringify({ email: 'a@b.vn' }), nl[0]?.v ?? '(không ghi)');
  ok('…cookie điền lại HttpOnly, SameSite=Lax, Path đúng trang, sống không quá 60 giây', tuyChonNhapLaiDung(nl[0]?.tc, DUONG_GAN),
     JSON.stringify(nl[0]?.tc));
  ok('#194: không cookie nào mang mật khẩu hay PIN', !loi.astro.cookies.ghi.some(g => BI_MAT.test(g.v) || BI_MAT.test(decodeURIComponent(g.v))),
     loi.astro.cookies.ghi.map(g => g.ten).join(', '));

  // Thân form không đọc được: không chạy việc, về chính trang với câu "không đọc được dữ liệu gửi lên".
  const hong = await gui({}, async () => ({ kq: { ok: true, cau: 'không được tới đây' } }), { tuyChon: { hong: true } });
  ok('#194: thân form hỏng → không chạy việc, 303 về chính trang, câu "không đọc được dữ liệu gửi lên" (đủ tiếng Anh)',
     hong.goiXuLy === 0 && hong.tl?.status === 303 && hong.tl.headers.get('location') === DUONG_GAN
     && cookieBao(hong.astro)?.cau === CAU_DOC_FORM_HONG.vi && cookieBao(hong.astro)?.cauEn === CAU_DOC_FORM_HONG.en,
     JSON.stringify({ goi: hong.goiXuLy, st: hong.tl?.status, bao: cookieBao(hong.astro) }));

  // Việc ném lỗi bất ngờ: không thành trang 500 (cũng là trả lời của lượt POST) — 303 về chính trang, câu "chưa ghi
  // được", một dòng nhật ký không chép chữ của lỗi (có thể mang email).
  const nem = await gui({ email: 'a@b.vn', mat_khau: MK }, async () => { throw new TypeError('a@b.vn ' + MK); }, { cacO: ['email'] });
  ok('#194: việc ném lỗi → không ném ra ngoài, 303 về chính trang, câu "chưa ghi được" của kho',
     nem.loi === null && nem.tl?.status === 303 && nem.tl.headers.get('location') === DUONG_GAN
     && cookieBao(nem.astro)?.ok === false && cookieBao(nem.astro)?.cau === LOI_KHO_CHUNG.macDinh.vi,
     nem.loi ?? JSON.stringify(cookieBao(nem.astro)));
  ok('…một dòng nhật ký, không chép chữ của lỗi', nem.canhBao.length === 1 && !/@|Mk-May/.test(nem.canhBao[0]), nem.canhBao.join(' | '));

  // Trang đích lạ (không thuộc /noi-bo/kho, địa chỉ máy khác): về chính trang — không bao giờ là một lối chuyển hướng mở.
  for (const toi of ['//ke-la.example/noi-bo/kho', 'https://ke-la.example/', '/noi-bo/dang-nhap', 'noi-bo/kho', '/noi-bo/khoxyz']) {
    const r = await gui({ viec: 'x' }, async () => ({ kq: { ok: true, cau: 'x' }, toi }));
    ok(`Trang đích lạ ${JSON.stringify(toi)} → về chính trang`, r.tl?.status === 303 && r.tl.headers.get('location') === DUONG_GAN,
       r.tl?.headers.get('location') ?? '');
  }
  const coThamSo = await gui({ viec: 'mo' }, async () => ({ kq: { ok: false, cau: 'Sai PIN.' }, toi: '/noi-bo/kho/may?chon=11111111-1111-4111-8111-111111111111' }));
  ok('Trang đích trong kho có tham số (?chon= của màn PIN) được giữ', coThamSo.tl?.headers.get('location') === '/noi-bo/kho/may?chon=11111111-1111-4111-8111-111111111111');
});

// ===========================================================================
await nhom('2 · CHỮ ĐIỀN LẠI: MỘT LẦN, MỘT TRANG, KHÔNG BAO GIỜ MẬT KHẨU / PIN (ghiNhapLai, docNhapLai)', async () => {
  if (!coHam) { ok('#194: có ghiNhapLai, docNhapLai để thử', false); return; }
  const c = hopCookie();
  ghiNhapLai(c, DUONG_GAN, ['email', 'ten'], { email: ' a@b.vn ', ten: 'Máy quầy thịt', mat_khau: MK });
  const tho = c.giaTri(COOKIE_NHAP_LAI);
  const jar = hopCookie({ [COOKIE_NHAP_LAI]: tho });
  const doc1 = docNhapLai(jar, DUONG_GAN, ['email', 'ten']);
  ok('Đọc lại đúng các ô đã ghi (chữ giữ nguyên, có dấu)', JSON.stringify(doc1) === JSON.stringify({ email: ' a@b.vn ', ten: 'Máy quầy thịt' }),
     JSON.stringify(doc1));
  ok('Đọc là xóa, đúng Path của trang', jar.xoa.length === 1 && jar.xoa[0].ten === COOKIE_NHAP_LAI && jar.xoa[0].tc?.path === DUONG_GAN,
     JSON.stringify(jar.xoa));
  ok('Đọc lần hai: không còn gì (tải lại trang là form trống)', docNhapLai(jar, DUONG_GAN, ['email']) === null);
  const trong = hopCookie();
  ok('Không có cookie: null, không xóa gì (không thêm Set-Cookie vào mọi lượt mở trang)',
     docNhapLai(trong, DUONG_GAN, ['email']) === null && trong.xoa.length === 0);

  // Cookie bị sửa tay / đặt từ nơi khác: chỉ ô trang hỏi, chỉ chuỗi, không quá dài — và ô mật khẩu / PIN không bao giờ
  // được trả ra, kể cả khi trang lỡ hỏi.
  const dai = 'a'.repeat(255);
  for (const [ten, giaTri, cacO, mong] of [
    ['không phải JSON', 'khong-phai-json', ['email'], null],
    ['mảng', '["a"]', ['email'], null],
    ['null', 'null', ['email'], null],
    ['ô lạ', JSON.stringify({ la: 'x', email: 'a@b.vn' }), ['email'], { email: 'a@b.vn' }],
    ['giá trị không phải chuỗi', JSON.stringify({ email: 1, ten: { x: 1 } }), ['email', 'ten'], {}],
    ['quá 254 ký tự', JSON.stringify({ email: dai, ten: 'ok' }), ['email', 'ten'], { ten: 'ok' }],
    ['ô mật khẩu / PIN dù trang lỡ hỏi', JSON.stringify({ mat_khau: MK, pin: PIN, mat_khau_ql: MK, email: 'a@b.vn' }),
      ['mat_khau', 'pin', 'mat_khau_ql', 'email'], { email: 'a@b.vn' }],
  ]) {
    const j = hopCookie({ [COOKIE_NHAP_LAI]: giaTri });
    const ra = docNhapLai(j, DUONG_GAN, cacO);
    ok(`Cookie ${ten}: ${mong ? JSON.stringify(mong) : 'bỏ qua'}; cookie vẫn bị xóa`,
       JSON.stringify(ra) === JSON.stringify(mong) && j.xoa.length === 1, JSON.stringify(ra));
  }

  // Ghi: không có ô nào để giữ thì không ghi gì; chữ quá dài thì bỏ ô đó.
  const c2 = hopCookie();
  ghiNhapLai(c2, DUONG_GAN, ['email'], { mat_khau: MK });
  ok('Ghi: chỉ có ô mật khẩu → không ghi cookie nào', c2.ghi.length === 0, JSON.stringify(c2.ghi));
  const c3 = hopCookie();
  ghiNhapLai(c3, DUONG_GAN, ['email', 'ten'], { email: dai, ten: 'Máy bếp' });
  ok('Ghi: ô quá 254 ký tự bị bỏ, ô khác vẫn giữ', JSON.stringify(JSON.parse(c3.giaTri(COOKIE_NHAP_LAI) ?? 'null')) === JSON.stringify({ ten: 'Máy bếp' }));
});

// ===========================================================================
await nhom('3 · BA TRANG MÁY DÙNG CHUNG (mã nguồn): LƯỢT POST CHỈ ĐI QUA guiRoiChuyen', async () => {
  const TRANG = [
    ['kho/may/index.astro', 'DUONG_MAY', []],
    ['kho/may/gan.astro', 'DUONG_GAN', ['email']],
    ['kho/may/dang-ky.astro', 'DUONG_DANG_KY', ['email_may', 'ten', 'phut_khoa', 'email_ql']],
  ];
  for (const [tep, duong, oGiu] of TRANG) {
    const s = doc('web/src/pages/noi-bo/' + tep);
    const fm = s.slice(s.indexOf('---') + 3, s.indexOf('\n---', s.indexOf('---') + 3)).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const html = s.slice(s.indexOf('\n---', s.indexOf('---') + 3) + 4);
    ok(`#194: ${tep} — lượt POST chỉ có một lối: return guiRoiChuyen(Astro, ${duong}, …)`,
       new RegExp(`if \\(Astro\\.request\\.method === 'POST'\\) return (await )?guiRoiChuyen\\(Astro, ${duong},`).test(fm),
       (fm.match(/if \(Astro\.request\.method === 'POST'\)[^\n]*/) ?? ['(không thấy)'])[0]);
    ok(`#194: ${tep} — không tự đọc form, không tự gán câu báo (không còn dựng trang trong trả lời của lượt POST)`,
       !/docFormGui\(/.test(fm) && !/\bbao\s*=(?!=)/.test(fm.replace(/const bao\b|let bao\b/g, '')) && !/\bformData\(/.test(fm),
       (fm.match(/docFormGui\(|\bbao\s*=[^=]/) ?? [''])[0]);
    const oMatKhau = [...html.matchAll(/<input\b[^>]*type="password"[^>]*>/g)].map(m => m[0]);
    ok(`${tep} — ô mật khẩu / PIN (${oMatKhau.length}) không bao giờ có value`, oMatKhau.length > 0 && oMatKhau.every(o => !/\bvalue=/.test(o)),
       oMatKhau.filter(o => /\bvalue=/.test(o)).join(' | '));
    if (oGiu.length) {
      const m = fm.match(/const O_GIU = \[([^\]]*)\] as const;/);
      const cacO = m ? [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]) : [];
      ok(`#194: ${tep} — chỉ điền lại ${oGiu.join(', ')} (không ô mật khẩu / PIN), đọc bằng docNhapLai một lần`,
         JSON.stringify(cacO) === JSON.stringify(oGiu) && /docNhapLai\(Astro\.cookies, \w+, O_GIU\)/.test(fm)
         && /guiRoiChuyen\(Astro, \w+, [\s\S]*?, O_GIU\)/.test(fm), JSON.stringify(cacO));
    } else {
      ok(`${tep} — không có chữ nào để điền lại (chỉ PIN)`, !/docNhapLai|ghiNhapLai|O_GIU/.test(fm));
    }
  }
});

// ===========================================================================
await nhom('4 · RỜI TRANG NỘI BỘ NÀO CŨNG XÓA Ô MẬT KHẨU / PIN (lib/sau-dang-xuat.js)', async () => {
  const ma = doc('web/src/lib/sau-dang-xuat.js');
  /** Chạy đoạn mã với cửa sổ giả; `o`: các ô mật khẩu giả (hoặc 'nem' = querySelectorAll ném lỗi, 'khong' = không có hàm). */
  function chay(o) {
    const nghe = {};
    const goc = { style: { visibility: '' } };
    const hoi = [];
    const document = {
      documentElement: goc,
      currentScript: { getAttribute: ten => (ten === 'data-dau-phien' ? 'dau-x' : null) },
      cookie: 'bt_dau_phien=dau-x',
      visibilityState: 'visible',
      addEventListener: () => {},
      ...(o === 'khong' ? {} : {
        querySelectorAll: chon => { hoi.push(chon); if (o === 'nem') throw new Error('không cho đọc'); return o; },
      }),
    };
    const window = {
      location: { href: 'https://beeftown.vn/noi-bo/kho/may/gan', replace: () => {}, reload: () => {} },
      addEventListener: (ten, ham) => { (nghe[ten] ??= []).push(ham); },
      setTimeout: () => 0,
    };
    let loi = null;
    try { vm.runInNewContext(ma.slice(ma.indexOf('(function')), { window, document }); } catch (e) { loi = String(e?.message ?? e); }
    let loiRoi = null;
    try { for (const ham of nghe.pagehide ?? []) ham({ persisted: true }); } catch (e) { loiRoi = String(e?.message ?? e); }
    return { loi, loiRoi, giau: goc.style.visibility === 'hidden', hoi };
  }
  const cacO = [{ value: MK }, { value: PIN }, { value: '' }];
  const r = chay(cacO);
  ok('#194: rời trang → mọi ô type="password" (mật khẩu, PIN) bị xóa', r.loi === null && r.loiRoi === null && cacO.every(x => x.value === ''),
     JSON.stringify({ loi: r.loi, loiRoi: r.loiRoi, con: cacO.map(x => x.value) }));
  ok('…tìm đúng ô input[type="password"], và trang vẫn được giấu như trước', JSON.stringify(r.hoi) === JSON.stringify(['input[type="password"]']) && r.giau,
     JSON.stringify(r));
  const nem = chay('nem');
  ok('Tìm ô ném lỗi: không lỗi nào lọt ra, trang vẫn được giấu', nem.loi === null && nem.loiRoi === null && nem.giau, JSON.stringify(nem));
  const khong = chay('khong');
  ok('Trình duyệt không có querySelectorAll: không lỗi nào lọt ra, trang vẫn được giấu', khong.loi === null && khong.loiRoi === null && khong.giau,
     JSON.stringify(khong));
  // Một chỗ duy nhất: trang đăng nhập không còn đoạn mã riêng; cả hai khung nội bộ in đoạn mã dùng chung.
  const dn = doc('web/src/pages/noi-bo/dang-nhap.astro');
  ok('#194: trang đăng nhập không còn đoạn mã xóa ô mật khẩu riêng (dùng chung lib/sau-dang-xuat.js)', !/addEventListener\('pagehide'/.test(dn));
  for (const khung of ['web/src/layouts/NoiBo.astro', 'web/src/layouts/Kho.astro']) {
    ok(`${khung} in đoạn mã dùng chung (<SauDangXuat />)`, /<SauDangXuat \/>/.test(doc(khung)));
  }
});

process.exit(ketThuc('MÁY DÙNG CHUNG — LƯỢT GỬI FORM'));
