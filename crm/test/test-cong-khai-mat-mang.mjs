/**
 * BEEFTOWN — Đứt mạng khi ĐẶT BÀN / NỘP HỒ SƠ trên trang công khai
 * =================================================================
 *
 *     node test/test-cong-khai-mat-mang.mjs
 *
 * supabase-js (postgrest-js) KHÔNG ném khi fetch hỏng: nó trả
 * { error: { code: '', message: 'TypeError: fetch failed' } }. Cổng 502 / 504
 * trả trang HTML thì error chỉ có message, không có code. guiYeuCauDatBan
 * (lib/dat-ban.ts) và nopHoSo (lib/nop-ho-so.ts) từng coi MỌI error là
 * "database từ chối" và báo "… CHƯA được ghi nhận. Vui lòng thử lại." — trong
 * khi database có thể đã ghi xong rồi câu trả lời mới mất trên đường về. Khách
 * gửi lại, nhà hàng nhận hai bản. Nhánh catch → "KHÔNG CHẮC … đừng gửi lại
 * nhiều lần" của lib/xu-ly-form.ts không bao giờ chạy cho trường hợp đó.
 * Messenger đã làm đúng (lib/messenger-anon.ts, test-messenger-web.mjs nhóm 10b).
 *
 * Câu hỏi, theo thứ tự quan trọng:
 *
 * 1. Client giả trả đúng lỗi đứt mạng ở trên: hai hàm KHÔNG trả câu
 *    "CHƯA được ghi nhận" mà ném, để xu-ly-form.ts nói "KHÔNG CHẮC".
 * 2. supabase-js THẬT của web/ với fetch giả, mỗi kiểu hỏng một ca: mất
 *    mạng, đứt sau khi đã gửi, hủy / hết giờ, 502 / 504 / 520 trang HTML,
 *    503 JSON không mã, 200 thân bị cắt. Đổi bản supabase-js mà hình dạng
 *    lỗi đổi thì nhóm này đỏ.
 * 3. Không sửa quá tay: lỗi THẬT của database (P0001, 23505, 42501,
 *    PGRST202) vẫn là "chưa gửi được" với đúng câu; trả lời hợp lệ vẫn là
 *    "đã nhận".
 * 4. Tầng chuyển hướng (xu-ly-form.ts): lời gọi nằm trong try, catch ghi câu
 *    KHÔNG CHẮC, và câu đó đủ vi / en / ko, không nói "CHƯA được ghi nhận".
 * 5. laLoiDatabase (lib/chu.ts) — một định nghĩa dùng chung cho đặt bàn, nộp
 *    hồ sơ và Messenger.
 *
 * Cần web/node_modules (cd web && npm ci) — như test-qua-tai.mjs.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { taoBoDem } from './kho-chung.mjs';
import { guiYeuCauDatBan, CAU_DAT_BAN } from '../../web/src/lib/dat-ban.ts';
import { nopHoSo, CAU_NOP } from '../../web/src/lib/nop-ho-so.ts';
import { taoDatBanMess } from '../../web/src/lib/messenger-anon.ts';
import * as CHU from '../../web/src/lib/chu.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOC = join(__dirname, '..', '..');
const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — ĐỨT MẠNG KHI ĐẶT BÀN / NỘP HỒ SƠ: KHÔNG CHẮC, KHÔNG PHẢI "CHƯA GHI"');

// supabase-js của web/ — đúng bản website đang chạy.
const requireWeb = createRequire(join(GOC, 'web', 'package.json'));
const { createClient } = await import(pathToFileURL(requireWeb.resolve('@supabase/supabase-js')).href);

const NGON_NGU = ['vi', 'en', 'ko'];

function formDatBan() {
  const f = new FormData();
  f.set('ho_ten', 'Nguyễn Văn An');
  f.set('sdt', '0912345678');
  f.set('ngay', '2026-10-10');
  f.set('gio', '19:00');
  f.set('so_khach', '4');
  return f;
}
function formHoSo() {
  const f = new FormData();
  f.set('vi_tri', 'nhan-vien-sanh');
  f.set('ho_ten', 'Trần Thị Bình');
  f.set('sdt', '0912345679');
  f.set('dong_y', 'co');
  return f;
}

const GUI = {
  datBan: { ten: 'Đặt bàn', ham: 'tao_dat_ban', cau: CAU_DAT_BAN, chay: (c, nn) => guiYeuCauDatBan(c, formDatBan(), '203.0.113.7', nn) },
  hoSo:   { ten: 'Nộp hồ sơ', ham: 'nop_ho_so_ung_tuyen', cau: CAU_NOP, chay: (c, nn) => nopHoSo(c, formHoSo(), '203.0.113.7', nn) },
};

/** Chờ một lời hứa: { tra } khi nó trả về, { nem } khi nó ném. */
async function ketCuc(p) {
  try { return { tra: await p }; } catch (e) { return { nem: e }; }
}
const inRa = (k) => k.nem ? `ném: ${k.nem.message}` : `trả: ${JSON.stringify(k.tra)}`;

/**
 * Ném đúng kiểu xu-ly-form.ts bắt (→ KHÔNG CHẮC), và lỗi ném ra là CỦA hàm này
 * (nhắc tên hàm SQL) chứ không phải một TypeError lạc trong khung kiểm thử.
 */
const nemKhongChac = (k, g) => !!k.nem && !k.tra && k.nem.message.includes(g.ham);

// ===========================================================================
await nhom('1 · Client giả trả { error: { code: "", message: "TypeError: fetch failed" } }', async () => {
  for (const g of Object.values(GUI)) {
    for (const nn of NGON_NGU) {
      let soLan = 0;
      const client = { rpc: async () => { soLan++; return { data: null, error: { code: '', message: 'TypeError: fetch failed' } }; } };
      const k = await ketCuc(g.chay(client, nn));
      ok(`${g.ten} đứt mạng (error.code rỗng, ${nn}) → không báo "CHƯA được ghi nhận", rơi vào nhánh KHÔNG CHẮC`,
         soLan === 1 && nemKhongChac(k, g) && k.tra?.cau !== g.cau.chuaGhi[nn], `${soLan} lần gọi; ${inRa(k)}`);
    }
  }
});

// ===========================================================================
// fetch GIẢ cho supabase-js thật: mỗi ca một hàm trả lời; đếm số lần gọi.
// ===========================================================================
let traLoiGia = () => { throw new Error('chưa đặt câu trả lời giả'); };
const goiFetch = [];
const fetchGia = async (url, init) => { goiFetch.push({ url: String(url), method: init?.method }); return traLoiGia(String(url), init); };
const taoClient = () => createClient('https://thu-khong-that.supabase.co', 'khoa-anon-gia', {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetchGia },
});

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json', 'x-supabase-api-version': '2024-01-01' },
  });
}
function html(status, body = '<html><body><h1>Lỗi cổng</h1>Máy chủ phía sau không trả lời kịp.</body></html>') {
  return new Response(body, { status, headers: { 'content-type': 'text/html' } });
}
const loiUndici = (thongDiep, ma) => new TypeError('fetch failed', { cause: Object.assign(new Error(thongDiep), { code: ma }) });

const KIEU_HONG = [
  ['mất mạng trước khi gửi (ECONNREFUSED)', () => { throw loiUndici('connect ECONNREFUSED 104.18.0.1:443', 'ECONNREFUSED'); }],
  ['đứt SAU khi đã gửi (UND_ERR_SOCKET — database có thể đã ghi)', () => { throw loiUndici('other side closed', 'UND_ERR_SOCKET'); }],
  ['bị hủy (AbortError)', () => { throw new DOMException('This operation was aborted', 'AbortError'); }],
  ['hết giờ chờ (TimeoutError)', () => { throw new DOMException('The operation was aborted due to timeout', 'TimeoutError'); }],
  ['cổng 502 trả trang HTML (có chữ có dấu)', () => html(502)],
  ['cổng 504 hết giờ trả trang HTML', () => html(504, '<html>504 Gateway Time-out</html>')],
  ['Cloudflare 520 trả trang HTML', () => html(520, '<html>Error 520: Web server is returning an unknown error</html>')],
  ['503 JSON không mã (cổng API, không phải PostgREST)', () => json(503, { message: 'name resolution failed' })],
  ['200 nhưng thân bị cắt giữa chừng (không phải JSON)', () => new Response('[{"ma_dat_ban":"K7', { status: 200, headers: { 'content-type': 'application/json' } })],
  // Không error mà cũng không mã: database chưa xác nhận gì → không được nói "đã nhận".
  ['200 nhưng thân rỗng (không lỗi, không mã)', () => new Response('', { status: 200 })],
  ['200 nhưng mảng rỗng (không lỗi, không mã)', () => json(200, [])],
  ['404 thân rỗng (supabase-js đổi thành 204, không lỗi)', () => new Response('', { status: 404 })],
];

await nhom('2 · supabase-js THẬT, fetch giả — mỗi kiểu hỏng là KHÔNG CHẮC, không bao giờ "CHƯA ghi"', async () => {
  for (const g of Object.values(GUI)) {
    for (const [ten, traLoi] of KIEU_HONG) {
      traLoiGia = traLoi;
      goiFetch.length = 0;
      const k = await ketCuc(g.chay(taoClient(), 'vi'));
      const goiDung = goiFetch.length === 1 && goiFetch[0].method === 'POST' && goiFetch[0].url.endsWith(`/rest/v1/rpc/${g.ham}`);
      ok(`${g.ten} — ${ten} → nhánh KHÔNG CHẮC, không báo "CHƯA được ghi nhận"`,
         goiDung && nemKhongChac(k, g), `${goiFetch.length} lần gọi ${goiFetch.map(x => `${x.method} ${x.url}`).join(', ')}; ${inRa(k)}`);
    }
  }
  // Gửi hai lần: supabase-js không tự gửi lại POST khi đứt mạng → database nhận nhiều nhất một lần.
  traLoiGia = () => { throw loiUndici('other side closed', 'UND_ERR_SOCKET'); };
  goiFetch.length = 0;
  await ketCuc(GUI.datBan.chay(taoClient(), 'vi'));
  ok('supabase-js không tự gửi lại tao_dat_ban khi đứt mạng (POST không thử lại) → đúng một lần gọi', goiFetch.length === 1, `${goiFetch.length} lần`);
});

// ===========================================================================
await nhom('3 · Không sửa quá tay: lỗi THẬT của database vẫn là "chưa gửi được"; trả lời hợp lệ vẫn là "đã nhận"', async () => {
  const HET_BAN = 'Khung giờ 19:00 ngày 2026-10-10 đã hết bàn. Vui lòng chọn giờ khác.';
  const QUA_NHIEU = 'Bạn đã nộp quá nhiều hồ sơ trong hôm nay. Vui lòng liên hệ trực tiếp nhà hàng.';
  const ca = async (g, nn, traLoi) => { traLoiGia = traLoi; return ketCuc(g.chay(taoClient(), nn)); };

  let k = await ca(GUI.datBan, 'vi', () => json(400, { code: 'P0001', message: HET_BAN, details: null, hint: null }));
  ok('Đặt bàn — database từ chối (P0001, câu có dấu) → "chưa gửi", hiện NGUYÊN VĂN câu của database',
     k.tra?.ok === false && k.tra.cau === HET_BAN, inRa(k));
  k = await ca(GUI.datBan, 'en', () => json(400, { code: 'P0001', message: HET_BAN, details: null, hint: null }));
  ok('Đặt bàn — P0001 trên trang tiếng Anh → câu dịch "No tables are available at that time."',
     k.tra?.ok === false && k.tra.cau === 'No tables are available at that time.', inRa(k));
  k = await ca(GUI.hoSo, 'ko', () => json(400, { code: 'P0001', message: QUA_NHIEU, details: null, hint: null }));
  ok('Nộp hồ sơ — P0001 "nộp quá nhiều hồ sơ" trên trang tiếng Hàn → câu dịch tiếng Hàn',
     k.tra?.ok === false && k.tra.cau === '지원서를 너무 많이 보내셨어요. 매장에 직접 연락해 주세요.', inRa(k));

  for (const g of Object.values(GUI)) {
    for (const [ma, status, thongDiep] of [
      ['23505', 409, 'duplicate key value violates unique constraint "dat_ban_pkey"'],
      ['42501', 401, `permission denied for function ${g.ham}`],
      ['PGRST202', 404, `Could not find the function public.${g.ham} in the schema cache`],
    ]) {
      k = await ca(g, 'vi', () => json(status, { code: ma, message: thongDiep, details: null, hint: null }));
      ok(`${g.ten} — lỗi database ${ma} → vẫn "CHƯA được ghi nhận" (exception = cả giao dịch đã hủy)`,
         k.tra?.ok === false && k.tra.cau === g.cau.chuaGhi.vi, inRa(k));
    }
  }

  k = await ca(GUI.datBan, 'vi', () => json(200, [{ ma_dat_ban: 'K7M2QX', con_trong: 3 }]));
  ok('Đặt bàn — trả lời hợp lệ → "đã nhận" kèm mã, không lộ con_trong',
     k.tra?.ok === true && k.tra.ma === 'K7M2QX' && k.tra.cau === CAU_DAT_BAN.daNhan.vi && !JSON.stringify(k.tra).includes('con_trong'), inRa(k));
  k = await ca(GUI.hoSo, 'vi', () => json(200, 'HS7Q2M'));
  ok('Nộp hồ sơ — trả lời hợp lệ → "đã nhận" kèm mã',
     k.tra?.ok === true && k.tra.ma === 'HS7Q2M' && k.tra.cau === CAU_NOP.daNhan.vi, inRa(k));
});

// ===========================================================================
await nhom('4 · Tầng chuyển hướng (lib/xu-ly-form.ts): lỗi ném ra thành câu KHÔNG CHẮC đủ ba thứ tiếng', async () => {
  // Đọc mã nguồn: xuLyDatBan / xuLyUngTuyen ghi cookie qua lib/phien.ts, cần import.meta.env của Astro.
  const nguon = readFileSync(join(GOC, 'web', 'src', 'lib', 'xu-ly-form.ts'), 'utf8');
  for (const [ham, khoa] of [['guiYeuCauDatBan', 'datBanKhongChac'], ['nopHoSo', 'ungTuyenKhongChac']]) {
    const m = nguon.match(new RegExp(`try \\{\\s*kq = await ${ham}\\([^]*?\\}\\s*catch\\b[^{]*\\{([^]*?)\\n  \\}`));
    ok(`xu-ly-form.ts: lời gọi ${ham}() nằm trong try, và catch ghi CAU.${khoa}`,
       !!m && m[1].includes(`ghiKetQua(ctx.cookies, { ok: false, loi: CAU.${khoa}[ngonNgu] })`), m ? m[1].trim() : 'không thấy khối try/catch');
    ok(`xu-ly-form.ts: catch của ${ham}() ghi log (console.error) — Workers Logs thấy sự cố, không đợi khách báo`,
       !!m && /console\.error\(/.test(m[1]), m ? m[1].trim() : '');

    const cau = nguon.match(new RegExp(`\\n  ${khoa}: \\{([^]*?)\\n  \\},`))?.[1] ?? '';
    ok(`CAU.${khoa}: vi "KHÔNG CHẮC … đừng gửi lại", en "NOT SURE … do not send it again", ko "확실히 알 수 없어요"; không có "CHƯA được ghi nhận"`,
       /vi:[^]*KHÔNG CHẮC[^]*đừng gửi lại/.test(cau) && /en:[^]*NOT SURE[^]*do not send it again/.test(cau)
       && /ko:[^]*확실히 알 수 없어요/.test(cau) && !/CHƯA được ghi nhận|NOT been recorded/.test(cau), cau.trim());
  }
});

// ===========================================================================
await nhom('5 · laLoiDatabase (lib/chu.ts): chỉ lỗi CÓ MÃ của database / PostgREST mới là "database từ chối"', async () => {
  const la = CHU.laLoiDatabase;
  ok('lib/chu.ts xuất laLoiDatabase', typeof la === 'function', typeof la);
  if (typeof la !== 'function') return;
  for (const code of ['P0001', '23505', '22P02', '42501', '57014', 'XX000', 'HV00B', 'PGRST000', 'PGRST202', 'PGRST116']) {
    ok(`code "${code}" → lỗi database`, la({ code, message: 'x' }) === true);
  }
  for (const [ten, e] of [['code ""', { code: '', message: 'TypeError: fetch failed' }], ['không có code', { message: '<html>502</html>' }],
                          ['code "20" (AbortError kiểu cũ)', { code: '20' }], ['code "ECONNRESET"', { code: 'ECONNRESET' }],
                          ['code "EPIPE" (5 chữ hoa, không có số — không phải SQLSTATE)', { code: 'EPIPE' }],
                          ['code "ERROR" của proxy', { code: 'ERROR' }], ['code "PGRSTX00" (lỗi thư viện kết nối)', { code: 'PGRSTX00' }],
                          ['code "p0001" chữ thường', { code: 'p0001' }],
                          ['code số 23505', { code: 23505 }], ['null', null], ['undefined', undefined]]) {
    ok(`${ten} → KHÔNG phải lỗi database (không nghe được trả lời)`, la(e) === false);
  }

  // Messenger dùng cùng định nghĩa: cổng 502 khi đặt bàn qua bot → "không chắc", không "lỗi".
  traLoiGia = () => html(502);
  const r = await taoDatBanMess(taoClient(), { chiNhanhMa: 'q1', ngay: '2026-10-10', gio: '19:00', soKhach: 4, hoTen: 'Nguyễn Văn An', sdt: '0912345678' });
  ok('Messenger: tao_dat_ban gặp cổng 502 (trang HTML) → khongChac, không trả câu lỗi', r.ok === false && r.khongChac === true && !r.loi, JSON.stringify(r));
  traLoiGia = () => json(400, { code: 'P0001', message: 'Khung giờ 19:00 ngày 2026-10-10 đã hết bàn.' });
  const r2 = await taoDatBanMess(taoClient(), { chiNhanhMa: 'q1', ngay: '2026-10-10', gio: '19:00', soKhach: 4, hoTen: 'Nguyễn Văn An', sdt: '0912345678' });
  ok('Messenger: tao_dat_ban bị database từ chối (P0001) → trả câu lỗi, không "không chắc"', r2.ok === false && !r2.khongChac && /hết bàn/.test(r2.loi ?? ''), JSON.stringify(r2));
});

process.exit(ketThuc('ĐỨT MẠNG KHI ĐẶT BÀN / NỘP HỒ SƠ'));
