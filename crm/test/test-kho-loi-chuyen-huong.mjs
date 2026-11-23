/**
 * BEEFTOWN KHO — GỬI FORM KHÔNG THÀNH CŨNG CHUYỂN HƯỚNG 303; TRANG CÒN DỰNG TẠI CHỖ TỰ XÓA THÂN FORM (issue #194, đợt 5)
 * ==============================================================================
 *
 *     node test/test-kho-loi-chuyen-huong.mjs
 *
 * Trang kho ghi được thì đã 303 sang GET (chuyenHuong, lib/kho/trang.ts). KHÔNG ghi được thì dựng trang ngay trong trả
 * lời của lượt POST: mục lịch sử đó giữ nguyên thân form, F5 trên nó (hay Quay lại / Tiến tới rồi F5) là gửi lại. Đợt 2
 * đổi ba trang của máy dùng chung (guiRoiChuyen). Xem tay 16/11/2026 cả 43 trang kho đọc thân POST: chín trang dưới đây
 * dựng lại trang từ database và địa chỉ, không điền lại chữ nào của lượt gửi (trừ năm ô ngưỡng của Thiết lập kho, vừa
 * một cookie). Ở chín trang này, MỌI lượt POST kết thúc bằng 303 — lỗi, việc lạ, thân form hỏng, lỗi ném ra bất ngờ.
 * Các trang còn lại điền lại số theo từng dòng, mã gửi, ảnh đã tải, phiên bản phiếu (không vừa một cookie) hoặc có
 * bước xem trước / thêm dòng: vẫn dựng tại chỗ, và trang đó tự thay mục lịch sử của nó bằng một mục không có thân form
 * (Khánh chọn cách 2 ngày 16/11/2026 — lib/kho/xoa-than-post.js, in vào khung Kho chỉ ở trả lời của lượt POST).
 *
 * Bất biến:
 *   1. ghiBao: câu báo dài (câu lỗi ghép từng dòng, cả bản tiếng Anh) được cắt theo số byte sau mã hóa — cookie quá cỡ
 *      bị trình duyệt BỎ, trang sau chuyển hướng không báo gì, người bấm tưởng đã lưu.
 *   2. ketThucPost (cho trang đã đọc form trước khi biết việc gì): luôn 303. Thân form hỏng → câu CAU_DOC_FORM_HONG,
 *      không chạy việc; việc ném lỗi → câu "chưa chắc đã ghi"; trang đích lạ → về chính trang; cookie điền lại theo
 *      đường dẫn trang (không kèm ?…). guiRoiChuyen là docFormGui + ketThucPost.
 *   3. Chín trang: lượt POST nào cũng đi qua ketThucPost; không còn câu gán `bao = …` (lối dựng tại chỗ); phần HTML
 *      không đọc form.
 *   4. Mọi trang kho đọc thân POST được xếp vào đúng một nhóm — trang mới phải được xếp.
 *   5. Trang còn dựng tại chỗ: khung Kho in đoạn mã xóa thân form vào <head> của trả lời lượt POST (chỉ lượt POST,
 *      trước thẻ phông chữ); đoạn mã chỉ thay mục lịch sử (cùng địa chỉ, cùng history.state) — không tải lại, không
 *      chuyển trang, không gọi mạng; trình duyệt từ chối thì thôi. Khung CRM không có. Trên Chromium thật (F5, Quay
 *      lại / Tiến tới rồi F5 không gửi lại POST; đối chứng không có mã thì gửi lại): web/kiem-tra/trinh-duyet.mjs nhóm 4.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import vm from 'node:vm';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

process.env.KHO_MAY_KHOA = 'bi-mat-thu-cho-may-dung-chung-0123456789abcdef';
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(GOC, 'web', 'src');
const nap = f => import(pathToFileURL(join(SRC, 'lib', f)).href);
const TRANG = await nap('kho/trang.ts');
const BAO = await nap('kho/bao.ts');
const { CAU_DOC_FORM_HONG } = await nap('gui-noi-bo.ts');
const { LOI_KHO_CHUNG } = await nap('kho/chung.ts');
const { TEN_NGUONG_NB } = await nap('kho/thong-bao.ts');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — GỬI KHÔNG THÀNH CŨNG CHUYỂN HƯỚNG 303 (#194, đợt 5)');

/** Đợt 5: chín trang không điền lại chữ của lượt gửi (Thiết lập kho: năm ô ngưỡng qua cookie điền lại). */
const CHIN_TRANG = ['cai-dat/ma-vach.astro', 'ban-ipos/index.astro', 'pha-loc/moi.astro', 'quet.astro', 'tang/index.astro',
  'cong-no/misa.astro', 'kiem-ke/index.astro', 'index.astro', 'cai-dat/index.astro'];
/** Đợt 2: ba trang của máy dùng chung (guiRoiChuyen) — test-kho-may-lich-su.mjs. */
const BA_TRANG_MAY = ['may/dang-ky.astro', 'may/gan.astro', 'may/index.astro'];
/**
 * Còn dựng tại chỗ khi lỗi: điền lại số theo từng dòng, mã gửi (ma_gui), ảnh đã tải, phiên bản phiếu, chữ dài — không
 * vừa một cookie — hoặc có bước gửi không ghi (xem trước, thêm dòng, đọc mã). Trang nhân viên còn cố ý dựng tại chỗ khi
 * TẠO ĐƯỢC (hiện mật khẩu tạm một lần, không qua cookie hay địa chỉ). Khánh chọn cách 2 (16/11/2026, #194): giữ trang
 * tại chỗ, trang tự thay mục lịch sử của nó bằng một mục không có thân form — nhóm 5.
 */
const CON_TAI_CHO = ['ban-ipos/ghep.astro', 'cai-dat/can.astro', 'cai-dat/cong-thuc.astro', 'cai-dat/dinh-luong.astro',
  'cai-dat/ipos.astro', 'cai-dat/mat-hang.astro', 'cai-dat/mat-hang/sua-nhanh.astro', 'cai-dat/nha-cung-cap.astro',
  'cai-dat/nhan-vien.astro', 'cai-dat/o-thong-tin.astro', 'cai-dat/ton-dau.astro', 'cai-dat/vi-tri-ly-do.astro',
  'cong-no/[id].astro', 'cong-no/[id]/hoa-don-gop.astro', 'cong-no/[id]/tra-tien.astro', 'cong-no/no-dau.astro',
  'cong-no/tra-hang.astro', 'dat-hang/[id].astro', 'dat-hang/moi.astro', 'dat-hang/theo-mon.astro', 'kiem-ke/[id].astro',
  'nhan-hang/[id].astro', 'nhan-hang/moi.astro', 'nhap/[id].astro', 'pha-loc/[id].astro', 'quay/dem.astro', 'quay/nhan.astro',
  'quay/yeu-cau/[id].astro', 'quay/yeu-cau/index.astro', 'tang/[lo_id].astro', 'xuat/[id].astro'];

const GOC_KHO = join(SRC, 'pages', 'noi-bo', 'kho');
const docTrang = t => readFileSync(join(GOC_KHO, t), 'utf8');
/** Phần đầu trang (giữa hai dòng ---), bỏ chú thích. */
const phanDau = s => s.slice(s.indexOf('---') + 3, s.indexOf('\n---', s.indexOf('---') + 3))
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const phanHtml = s => s.slice(s.indexOf('\n---', s.indexOf('---') + 3) + 4);

// ---------------------------------------------------------------------------
// COOKIE GIẢ, ASTRO GIẢ — đủ thứ ketThucPost / guiRoiChuyen dùng
// ---------------------------------------------------------------------------
// Như trình duyệt: cookie định danh bằng tên + Path — lệnh xóa với Path khác KHÔNG xóa được (cookie còn sống tới hết hạn).
function hopCookie() {
  const kho = new Map();   // ten → { v, path }
  const ghi = [];
  return {
    get: ten => (kho.has(ten) ? { value: kho.get(ten).v } : undefined),
    has: ten => kho.has(ten),
    set: (ten, v, tc) => { ghi.push({ ten, v: String(v), tc }); kho.set(ten, { v: String(v), path: tc?.path ?? '/' }); },
    delete: (ten, tc) => { if (kho.get(ten)?.path === (tc?.path ?? '/')) kho.delete(ten); },
    ghi,
    giaTri: ten => kho.get(ten)?.v,
  };
}
const taoAstro = () => ({
  cookies: hopCookie(), locals: {},
  redirect: (url, status = 302) => new Response(null, { status, headers: { Location: url } }),
});
const cookieBao = astro => { try { return JSON.parse(astro.cookies.giaTri('bt_kho_bao') ?? 'null'); } catch { return null; } };
const formCo = truong => { const f = new FormData(); for (const [k, v] of Object.entries(truong)) f.set(k, v); return f; };
/** Gọi ketThucPost như một trang: { tl, astro, goiXuLy, loi, nhatKy }. */
async function ketThuc5(form, ve, xuLy, cacO) {
  const astro = taoAstro();
  let goiXuLy = 0, tl = null, loi = null;
  const nhatKy = [];
  const goc = console.error;
  console.error = (...p) => { nhatKy.push(p.map(String).join(' ')); };
  try {
    tl = await TRANG.ketThucPost(astro, form, ve, async f => { goiXuLy++; return xuLy(f); }, cacO);
  } catch (e) { loi = String(e?.message ?? e); } finally { console.error = goc; }
  return { tl, astro, goiXuLy, loi, nhatKy };
}
const den = tl => `${tl?.status} ${tl?.headers.get('location')}`;

// ===========================================================================
await nhom('1 · ghiBao: CÂU BÁO DÀI KHÔNG LÀM COOKIE QUÁ CỠ (trình duyệt bỏ cookie quá cỡ — trang không báo gì)', async () => {
  const astro = taoAstro();
  const dongVi = 'Dòng 12: "Thăn lưng bò Úc (Striploin) — 1.250 kg" chưa có giá nhập, số lượng phải lớn hơn 0. ';
  const dongEn = 'Line 12: "Thăn lưng bò Úc (Striploin) — 1,250 kg" has no purchase price; the quantity must be above 0. ';
  BAO.ghiBao(astro.cookies, { ok: false, cau: dongVi.repeat(40), cauEn: dongEn.repeat(40) });
  const ghi = astro.cookies.ghi.find(g => g.ten === 'bt_kho_bao');
  // Astro mã hóa giá trị bằng encodeURIComponent; trình duyệt nhận tối đa 4096 byte cho tên + giá trị + thuộc tính.
  const coMaHoa = encodeURIComponent(ghi?.v ?? '').length + 'bt_kho_bao='.length;
  ok('#194: câu lỗi rất dài (≈ 3.800 ký tự có dấu, cả bản tiếng Anh) → giá trị cookie sau mã hóa vẫn dưới 3.800 byte',
     !!ghi && coMaHoa < 3800, String(coMaHoa));
  const doc = BAO.docBao(astro.cookies);
  ok('…đọc lại được: vẫn là câu lỗi (ok: false), đầu câu giữ nguyên, có dấu "…" ở chỗ cắt — cả hai thứ tiếng',
     doc?.ok === false && doc.cau.startsWith('Dòng 12: "Thăn lưng bò Úc') && doc.cau.endsWith('…')
     && doc.cauEn?.startsWith('Line 12: "Thăn lưng') && doc.cauEn.endsWith('…'),
     `${(doc?.cau ?? '').slice(-30)} · ${(doc?.cauEn ?? '').slice(-30)}`);
  ok('…cắt theo ký tự, không cắt đôi một chữ (không có ký tự thay thế U+FFFD)', !/\uFFFD/.test((doc?.cau ?? '') + (doc?.cauEn ?? '')));
  // Câu database (không có bản tiếng Anh sẵn) dài: BaoKho tra bản dịch theo NGUYÊN câu — cắt rồi thì không khớp. Dịch trước.
  const caudb = 'Chưa điền ô bắt buộc: ' + 'Hạn sử dụng của thùng thịt bò Úc nhập ngày 12/11, '.repeat(60);
  BAO.ghiBao(astro.cookies, { ok: false, cau: caudb });
  const ghiDb = astro.cookies.ghi.at(-1);
  const docDb = BAO.docBao(astro.cookies);
  ok('#194: câu database dài chưa có bản tiếng Anh → dịch bản đầy đủ trước khi cắt (màn tiếng Anh không hiện tiếng Việt cụt)',
     docDb?.cau.endsWith('…') && docDb?.cauEn?.startsWith('Required field not filled in: ') && docDb.cauEn.endsWith('…')
     && encodeURIComponent(ghiDb?.v ?? '').length + 'bt_kho_bao='.length < 3800,
     `${(docDb?.cauEn ?? '(không có)').slice(0, 50)} · ${encodeURIComponent(ghiDb?.v ?? '').length} byte`);
  BAO.ghiBao(astro.cookies, { ok: false, cau: 'Chưa điền ô bắt buộc: Hạn sử dụng' });
  ok('…câu database ngắn: không tự thêm bản tiếng Anh (BaoKho vẫn tra như cũ)', !('cauEn' in (BAO.docBao(astro.cookies) ?? {})));
  BAO.ghiBao(astro.cookies, { ok: true, cau: 'Đã lưu 1.250 kg.', cauEn: 'Saved 1,250 kg.' });
  const ngan = BAO.docBao(astro.cookies);
  ok('Câu ngắn giữ nguyên từng chữ, cả hai thứ tiếng', ngan?.cau === 'Đã lưu 1.250 kg.' && ngan?.cauEn === 'Saved 1,250 kg.', JSON.stringify(ngan));
  BAO.ghiBao(astro.cookies, { ok: false, cau: 'Chưa ghi được.' });
  const khongEn = BAO.docBao(astro.cookies);
  ok('Câu không có bản tiếng Anh: vẫn không có (không tự đặt cauEn)', khongEn?.cau === 'Chưa ghi được.' && !('cauEn' in (khongEn ?? {})),
     JSON.stringify(khongEn));
});

// ===========================================================================
await nhom('2 · ketThucPost: TRANG ĐÃ ĐỌC FORM TRƯỚC — MỌI KẾT CỤC CỦA LƯỢT POST LÀ 303', async () => {
  const coHam = typeof TRANG.ketThucPost === 'function';
  ok('#194: lib/kho/trang.ts có ketThucPost', coHam, Object.keys(TRANG).join(', '));
  if (!coHam) return;
  const VE = '/noi-bo/kho/kiem-ke?loc=dang_dem';

  const loi = await ketThuc5(formCo({ viec: 'bat_dau' }), VE, async () => ({ kq: { ok: false, cau: 'Vị trí này đang có phiếu kiểm kê.', cauEn: 'x' } }));
  ok('#194: không ghi được → 303 về chính trang, giữ bộ lọc ?loc=', loi.tl?.status === 303 && loi.tl.headers.get('location') === VE, den(loi.tl));
  ok('…câu lỗi nằm trong bt_kho_bao', cookieBao(loi.astro)?.ok === false && cookieBao(loi.astro)?.cau === 'Vị trí này đang có phiếu kiểm kê.');

  const xong = await ketThuc5(formCo({ viec: 'bat_dau' }), VE, async () => ({ kq: { ok: true, cau: 'Đã mở phiếu.' }, toi: '/noi-bo/kho/kiem-ke/11111111-1111-4111-8111-111111111111' }));
  ok('Ghi được → 303 sang trang đích trong kho', xong.tl?.status === 303 && xong.tl.headers.get('location') === '/noi-bo/kho/kiem-ke/11111111-1111-4111-8111-111111111111', den(xong.tl));

  const hong = await ketThuc5(null, VE, async () => ({ kq: { ok: true, cau: 'không được tới đây' } }));
  ok('#194: thân form không đọc được (form null) → không chạy việc, 303 về chính trang, câu "không đọc được dữ liệu gửi lên" đủ tiếng Anh',
     hong.goiXuLy === 0 && hong.tl?.status === 303 && hong.tl.headers.get('location') === VE
     && cookieBao(hong.astro)?.cau === CAU_DOC_FORM_HONG.vi && cookieBao(hong.astro)?.cauEn === CAU_DOC_FORM_HONG.en,
     JSON.stringify({ goi: hong.goiXuLy, den: den(hong.tl), bao: cookieBao(hong.astro) }));

  const nem = await ketThuc5(formCo({ viec: 'bat_dau', ghi_chu: 'khach@vi-du.vn' }), VE, async () => { throw new TypeError('khach@vi-du.vn'); });
  ok('#194: việc ném lỗi bất ngờ → không thành trang 500: 303 về chính trang, câu "chưa chắc đã ghi" (không nói "chưa ghi được")',
     nem.loi === null && nem.tl?.status === 303 && nem.tl.headers.get('location') === VE
     && cookieBao(nem.astro)?.cau === LOI_KHO_CHUNG.batNgo.vi && cookieBao(nem.astro)?.cauEn === LOI_KHO_CHUNG.batNgo.en,
     nem.loi ?? JSON.stringify(cookieBao(nem.astro)));
  ok('…một dòng nhật ký, không chép chữ của lỗi, không chép phần ?… của địa chỉ',
     nem.nhatKy.length === 1 && !/@|loc=/.test(nem.nhatKy[0]), nem.nhatKy.join(' | '));

  for (const toi of ['//ke-la.example/noi-bo/kho', 'https://ke-la.example/', '/noi-bo/dang-nhap', '/noi-bo/khoxyz']) {
    const r = await ketThuc5(formCo({ viec: 'x' }), VE, async () => ({ kq: { ok: true, cau: 'x' }, toi }));
    ok(`Trang đích lạ ${JSON.stringify(toi)} → về chính trang`, r.tl?.headers.get('location') === VE, den(r.tl));
  }

  // Chữ điền lại: cookie theo ĐƯỜNG DẪN trang — thuộc tính Path có "?…" thì trình duyệt không bao giờ gửi cookie đó.
  const VE_CD = '/noi-bo/kho/cai-dat?mo=xong';
  const nl = await ketThuc5(formCo({ viec: 'nguong', nguong_gia_mua_pt: '15' }), VE_CD,
    async f => ({ kq: { ok: false, cau: 'Sai.' }, nhapLai: { nguong_gia_mua_pt: String(f.get('nguong_gia_mua_pt')) } }), ['nguong_gia_mua_pt']);
  const ghiNl = nl.astro.cookies.ghi.find(g => g.ten === 'bt_kho_nhap_lai');
  ok('#194: chữ điền lại đi theo cookie có Path là đường dẫn trang, không kèm ?… (/noi-bo/kho/cai-dat)',
     ghiNl?.tc?.path === '/noi-bo/kho/cai-dat' && nl.tl?.headers.get('location') === VE_CD, JSON.stringify(ghiNl?.tc));
  const docLai = BAO.docNhapLai(nl.astro.cookies, '/noi-bo/kho/cai-dat', ['nguong_gia_mua_pt']);
  ok('…lượt GET của trang đọc lại đúng số vừa gõ, rồi cookie bị xóa (đọc lần hai: không còn)', docLai?.nguong_gia_mua_pt === '15'
     && BAO.docNhapLai(nl.astro.cookies, '/noi-bo/kho/cai-dat', ['nguong_gia_mua_pt']) === null, JSON.stringify(docLai));
  // Trang trả lời cả /noi-bo/kho/cai-dat/ (dấu / cuối): Path vẫn là /noi-bo/kho/cai-dat — đọc xong xóa được; không thì
  // cookie sống thêm 60 giây và lần lưu ĐÚNG ngay sau đó hiện lại số sai cũ (người ta tưởng chưa lưu được).
  const nl2 = await ketThuc5(formCo({ viec: 'nguong', nguong_gia_mua_pt: '15' }), '/noi-bo/kho/cai-dat/?mo=xong',
    async f => ({ kq: { ok: false, cau: 'Sai.' }, nhapLai: { nguong_gia_mua_pt: '15' } }), ['nguong_gia_mua_pt']);
  const ghiNl2 = nl2.astro.cookies.ghi.find(g => g.ten === 'bt_kho_nhap_lai');
  BAO.docNhapLai(nl2.astro.cookies, '/noi-bo/kho/cai-dat', ['nguong_gia_mua_pt']);
  ok('RÀ SOÁT: địa chỉ có dấu / cuối → Path cookie không có dấu / cuối; lượt GET đọc xong là xóa được',
     ghiNl2?.tc?.path === '/noi-bo/kho/cai-dat' && !nl2.astro.cookies.has('bt_kho_nhap_lai'), JSON.stringify(ghiNl2?.tc));

  const nguon = readFileSync(join(SRC, 'lib', 'kho', 'trang.ts'), 'utf8');
  const thanGui = nguon.slice(nguon.indexOf('export async function guiRoiChuyen'));
  ok('guiRoiChuyen (ba trang máy dùng chung) là docFormGui + ketThucPost — một chỗ quyết định lượt POST kết thúc ra sao',
     /const form = await docFormGui\(Astro\);\n  return ketThucPost\(Astro, form, veKhiLoi, xuLy, cacO\);\n\}/.test(thanGui.slice(0, thanGui.indexOf('\n}\n') + 2)));
});

// ===========================================================================
await nhom(`3 · ${CHIN_TRANG.length} TRANG KHO KHÔNG ĐIỀN LẠI CHỮ CỦA LƯỢT GỬI: MỌI KẾT CỤC CỦA LƯỢT POST LÀ 303`, async () => {
  for (const tep of CHIN_TRANG) {
    const s = docTrang(tep);
    const dau = phanDau(s);
    ok(`#194: ${tep} — lượt POST nào cũng đi qua ketThucPost (có "if (Astro.request.method === 'POST') return ketThucPost(Astro, …")`,
       /\nif \(Astro\.request\.method === 'POST'\) return ketThucPost\(Astro, \w+,/.test(dau));
    const gan = dau.match(/\bbao = [^\n]*/g) ?? [];
    ok(`#194: ${tep} — không còn câu gán "bao = …" (lối dựng trang báo lỗi ngay trong trả lời của lượt POST)`, gan.length === 0, gan.join(' | '));
    ok(`${tep}: không còn gọi chuyenHuong trực tiếp — kết cục nào cũng do ketThucPost quyết`, !/\bchuyenHuong\(/.test(dau));
    ok(`${tep}: phần HTML không đọc form của lượt gửi (không form.get / fd.get)`, !/\b(?:form|fd)\??\.get(?:All)?\(/.test(phanHtml(s)));
  }
  // Tài khoản chưa có chi nhánh: câu đúng sự thật ("chưa có chi nhánh — chưa ghi gì"), không phải "việc không hợp lệ".
  for (const tep of ['cai-dat/ma-vach.astro', 'ban-ipos/index.astro', 'kiem-ke/index.astro', 'index.astro', 'cai-dat/index.astro']) {
    ok(`RÀ SOÁT: ${tep} — lượt POST khi chưa có chi nhánh báo LOI_CHUA_CO_CN, không phải "việc không hợp lệ"`,
       /kqHai\(false, LOI_CHUA_CO_CN\)/.test(phanDau(docTrang(tep))));
  }
  ok('LOI_CHUA_CO_CN đủ hai thứ tiếng, nói rõ chưa ghi gì', /chưa ghi gì/.test(TRANG.LOI_CHUA_CO_CN?.vi ?? '')
     && /nothing was saved/.test(TRANG.LOI_CHUA_CO_CN?.en ?? ''), JSON.stringify(TRANG.LOI_CHUA_CO_CN));
  // Thiết lập kho: năm ô ngưỡng — lưu hỏng thì hiện lại đúng số vừa gõ, qua cookie điền lại (không qua thân form).
  const cd = phanDau(docTrang('cai-dat/index.astro'));
  ok('cai-dat/index.astro: lưu ngưỡng hỏng → nhapLai là các ô ngưỡng (Object.keys(TEN_NGUONG_NB)), lượt GET đọc lại bằng docNhapLai',
     /nhapLai: /.test(cd) && /docNhapLai\(Astro\.cookies, '\/noi-bo\/kho\/cai-dat', O_NGUONG\)/.test(cd)
     && /const O_NGUONG = Object\.keys\(TEN_NGUONG_NB\)/.test(cd));
  ok('RÀ SOÁT: cai-dat/index.astro — lưu được thì về /noi-bo/kho/cai-dat như trước (Bỏ qua: về mục của bước đó), không mang ?… của trang đang mở',
     /let ve = '\/noi-bo\/kho\/cai-dat';/.test(cd) && /return \{ kq, toi: kq\.ok \? ve : undefined \};/.test(cd));
  ok(`Năm ô ngưỡng (${Object.keys(TEN_NGUONG_NB).length}) đều là tên ô thường — không ô nào bị bộ lọc ô bí mật bỏ`,
     Object.keys(TEN_NGUONG_NB).length >= 5 && Object.keys(TEN_NGUONG_NB).every(o => !/(?:^|_)(?:mat_khau|pin|token)(?:_|$)/i.test(o)),
     Object.keys(TEN_NGUONG_NB).join(', '));
});

// ===========================================================================
await nhom('4 · MỌI TRANG KHO ĐỌC THÂN POST ĐƯỢC XẾP VÀO ĐÚNG MỘT NHÓM (trang mới phải được xếp)', async () => {
  const moiFile = d => readdirSync(d, { withFileTypes: true }).flatMap(x => x.isDirectory() ? moiFile(join(d, x.name)) : [join(d, x.name)]);
  const coPost = moiFile(GOC_KHO).filter(f => f.endsWith('.astro')).map(f => relative(GOC_KHO, f).split('\\').join('/'))
    .filter(f => /docFormGui\(|guiRoiChuyen\(|ketThucPost\(/.test(docTrang(f)));
  const nhomCua = f => [CHIN_TRANG, BA_TRANG_MAY, CON_TAI_CHO].filter(n => n.includes(f)).length;
  const chuaXep = coPost.filter(f => nhomCua(f) === 0);
  const haiNhom = coPost.filter(f => nhomCua(f) > 1);
  ok('Trang kho nào đọc thân POST cũng có tên trong đúng một nhóm (chín trang đợt 5 / ba trang máy dùng chung / còn dựng tại chỗ)',
     chuaXep.length === 0 && haiNhom.length === 0, `chưa xếp: ${chuaXep.join(', ')} · hai nhóm: ${haiNhom.join(', ')}`);
  const khongCo = [...CHIN_TRANG, ...BA_TRANG_MAY, ...CON_TAI_CHO].filter(f => !coPost.includes(f));
  ok('Danh sách không có tên trang nào không còn đọc thân POST (đổi tên, bỏ trang thì sửa danh sách)', khongCo.length === 0, khongCo.join(', '));
  ok(`Đủ ${coPost.length} trang: ${CHIN_TRANG.length} + ${BA_TRANG_MAY.length} + ${CON_TAI_CHO.length}`,
     coPost.length === CHIN_TRANG.length + BA_TRANG_MAY.length + CON_TAI_CHO.length);
});

// ===========================================================================
await nhom(`5 · ${CON_TAI_CHO.length} TRANG CÒN DỰNG TẠI CHỖ: TRẢ LỜI CỦA LƯỢT POST TỰ XÓA THÂN FORM KHỎI LỊCH SỬ (Khánh chọn cách 2, 16/11/2026)`, async () => {
  const TEP_MA = join(SRC, 'lib', 'kho', 'xoa-than-post.js');
  const TEP_THE = join(SRC, 'components', 'kho', 'XoaThanPost.astro');
  ok('#194: có đoạn mã lib/kho/xoa-than-post.js và thẻ components/kho/XoaThanPost.astro in nó vào trang',
     existsSync(TEP_MA) && existsSync(TEP_THE), `${existsSync(TEP_MA)} · ${existsSync(TEP_THE)}`);
  if (!existsSync(TEP_MA) || !existsSync(TEP_THE)) return;
  const nguonMa = readFileSync(TEP_MA, 'utf8');
  // Phần được in ra trang: từ "(function" — như thẻ XoaThanPost cắt (chú thích đầu file không in ra).
  const MA = nguonMa.slice(nguonMa.indexOf('(function'));

  /** Chạy đoạn mã trong một cửa sổ giả; ghi lại MỌI việc nó làm với lịch sử, địa chỉ, cookie, bộ nhớ, mạng. */
  const HREF = 'https://beeftown.vn/noi-bo/kho/nhan-hang/moi?ncc=11111111-1111-4111-8111-111111111111#dong-3';
  const chayMa = ({ nemLoi = false, khongCoLichSu = false } = {}) => {
    const viec = [];
    const trangThai = { cuon: 120 };
    const lichSu = khongCoLichSu ? undefined : {
      get state() { return trangThai; },
      replaceState: (...ts) => { viec.push(['replaceState', ...ts]); if (nemLoi) throw new Error('SecurityError'); },
      pushState: (...ts) => { viec.push(['pushState', ...ts]); },
      back: () => { viec.push(['back']); }, forward: () => { viec.push(['forward']); }, go: (...ts) => { viec.push(['go', ...ts]); },
    };
    const diaChi = {
      get href() { return HREF; }, set href(v) { viec.push(['location.href =', v]); },
      reload: () => { viec.push(['reload']); }, replace: v => { viec.push(['location.replace', v]); },
      assign: v => { viec.push(['location.assign', v]); }, toString: () => HREF,
    };
    const ghiLai = ten => () => { viec.push([ten]); };
    const taiLieu = {
      get cookie() { viec.push(['document.cookie']); return ''; }, set cookie(v) { viec.push(['document.cookie =', v]); },
      forms: [], querySelectorAll: () => { viec.push(['querySelectorAll']); return []; },
    };
    const boNho = { getItem: ghiLai('getItem'), setItem: ghiLai('setItem'), removeItem: ghiLai('removeItem') };
    const cuaSo = {
      history: lichSu, get location() { return diaChi; }, set location(v) { viec.push(['window.location =', v]); },
      document: taiLieu, localStorage: boNho, sessionStorage: boNho,
      fetch: ghiLai('fetch'), XMLHttpRequest: ghiLai('XMLHttpRequest'), navigator: { sendBeacon: ghiLai('sendBeacon') },
      addEventListener: ghiLai('addEventListener'), setTimeout: ghiLai('setTimeout'),
    };
    let loi = null;
    try {
      vm.runInNewContext(MA, { window: cuaSo, history: lichSu, location: diaChi, document: taiLieu, localStorage: boNho,
        sessionStorage: boNho, fetch: cuaSo.fetch, XMLHttpRequest: cuaSo.XMLHttpRequest, navigator: cuaSo.navigator,
        addEventListener: cuaSo.addEventListener, setTimeout: cuaSo.setTimeout });
    } catch (e) { loi = String(e?.message ?? e); }
    return { viec, loi, trangThai };
  };
  const tomViec = ds => JSON.stringify(ds.map(v => v.map(x => (typeof x === 'object' && x !== null ? '{state}' : x))));

  const thuong = chayMa();
  ok('#194: đoạn mã thay mục lịch sử của trang bằng một mục CÙNG địa chỉ (cả ?… và #…), giữ nguyên history.state — đúng một lệnh replaceState, không gì khác',
     thuong.loi === null && thuong.viec.length === 1 && thuong.viec[0][0] === 'replaceState'
     && thuong.viec[0][1] === thuong.trangThai && thuong.viec[0][2] === '' && thuong.viec[0][3] === HREF,
     thuong.loi ?? tomViec(thuong.viec));
  const tuChoi = chayMa({ nemLoi: true });
  ok('…trình duyệt từ chối (replaceState ném lỗi): không ném ra ngoài, không làm gì thêm (không tải lại, không chuyển trang)',
     tuChoi.loi === null && tuChoi.viec.length === 1 && tuChoi.viec[0][0] === 'replaceState', tuChoi.loi ?? tomViec(tuChoi.viec));
  const khongCo = chayMa({ khongCoLichSu: true });
  ok('…trình duyệt không có history.replaceState: không ném ra ngoài, không làm gì', khongCo.loi === null && khongCo.viec.length === 0,
     khongCo.loi ?? tomViec(khongCo.viec));
  // Lệnh reload() do MÃ gọi trên trang của lượt POST là GỬI LẠI form mà không hỏi (lib/sau-dang-xuat.js, đầu file) —
  // đoạn mã này chỉ được thay mục lịch sử. Kiểm cả chữ của mã (bỏ chú thích), không chỉ lần chạy ở trên.
  const chuMa = MA.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const cam = chuMa.match(/\b(?:reload|submit|requestSubmit|fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|setTimeout|setInterval|addEventListener)\b|\bhistory\s*\.\s*(?:pushState|back|forward|go)\b|\blocation\s*\.\s*(?:replace|assign)\b|\bdocument\s*\.\s*cookie\b|\b(?:location|href)\s*=(?!=)/g) ?? [];
  ok('RÀ SOÁT: chữ của đoạn mã không tải lại, không chuyển trang, không gửi form, không gọi mạng, không đọc cookie hay bộ nhớ, không hẹn giờ',
     cam.length === 0, cam.join(', '));

  const the = readFileSync(TEP_THE, 'utf8');
  ok('#194: XoaThanPost.astro in đúng đoạn mã đó — nhập lib/kho/xoa-than-post.js (?raw), bỏ chú thích đầu file',
     /(?:^|\n)import ma from '\.\.\/\.\.\/lib\/kho\/xoa-than-post\.js\?raw';\n/.test(phanDau(the))
     && /const MA = ma\.slice\(ma\.indexOf\('\(function'\)\);/.test(phanDau(the)));
  ok('#194: …CHỈ ở trả lời của lượt POST (lượt GET không in gì: mục lịch sử của nó không mang thân form), in thẳng vào trang',
     phanHtml(the).trim() === "{Astro.request.method === 'POST' && <script is:inline set:html={MA}></script>}", phanHtml(the).trim());

  // Khung Kho: một lần, trong <head>, trước thẻ phông chữ của Google (mã đứng sau thẻ bảng kiểu phải chờ nó tải xong mới
  // chạy — mạng tới Google chậm thì F5 trong lúc đó vẫn gửi lại form) và trước <SauDangXuat />.
  const khung = readFileSync(join(SRC, 'layouts', 'Kho.astro'), 'utf8');
  const dauHead = khung.indexOf('<head>'), cuoiHead = khung.indexOf('</head>');
  const viTri = khung.indexOf('<XoaThanPost />');
  const soLan = (khung.match(/<XoaThanPost\b/g) ?? []).length;
  const theKieu = khung.slice(dauHead).search(/<link\s+rel="stylesheet"/);
  ok('#194: khung Kho nhập components/kho/XoaThanPost.astro và in <XoaThanPost /> đúng một lần, trong <head>',
     /\nimport XoaThanPost from '\.\.\/components\/kho\/XoaThanPost\.astro';\n/.test(khung) && soLan === 1
     && dauHead > 0 && viTri > dauHead && viTri < cuoiHead, `${soLan} lần · vị trí ${viTri} · <head> ${dauHead}–${cuoiHead}`);
  // Từ 23/11/2026 phông Montserrat tự phát (chung.css), khung Kho không còn thẻ bảng kiểu chặn nào trong <head>: không còn
  // gì để đứng trước — nhưng nếu ai thêm lại một thẻ bảng kiểu thì đoạn mã vẫn phải đứng trước nó.
  ok('…trước thẻ bảng kiểu đầu tiên của <head> (nếu có — Google Fonts đã bỏ) và trước <SauDangXuat />',
     viTri > 0 && (theKieu < 0 || viTri < dauHead + theKieu) && viTri < khung.indexOf('<SauDangXuat />'),
     `XoaThanPost ${viTri} · bảng kiểu ${dauHead + theKieu} · SauDangXuat ${khung.indexOf('<SauDangXuat />')}`);
  const khungCrm = readFileSync(join(SRC, 'layouts', 'NoiBo.astro'), 'utf8');
  ok('Khung CRM (NoiBo.astro) không có đoạn mã này — Khánh quyết để nguyên bảy màn CRM (#194)',
     !/XoaThanPost|xoa-than-post/.test(khungCrm));

  // Trả lời của lượt POST nào cũng mang đoạn mã: cả 31 trang dựng trong khung Kho.
  const ngoaiKhung = CON_TAI_CHO.filter(t => {
    const s = docTrang(t);
    return !/\nimport Kho from '(?:\.\.\/)+layouts\/Kho\.astro';/.test(`\n${phanDau(s)}`) || !/^\s*<Kho[\s>]/.test(phanHtml(s).replace(/\{\/\*[\s\S]*?\*\/\}/g, ''));
  });
  ok(`#194: ${CON_TAI_CHO.length} trang còn dựng tại chỗ đều dựng trong khung Kho (thẻ ngoài cùng là <Kho …>) — trả lời của lượt POST nào cũng mang đoạn mã`,
     ngoaiKhung.length === 0, ngoaiKhung.join(', '));
});

process.exit(ketThuc('KHO: GỬI KHÔNG THÀNH CŨNG CHUYỂN HƯỚNG'));
