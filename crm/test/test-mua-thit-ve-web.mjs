/**
 * BEEFTOWN — MUA THỊT VỀ: ĐỌC MENU VÀ SOẠN ĐƠN (web/src/lib/mua-thit-ve.ts, web/src/lib/don-mua-thit.ts)
 * =====================================================================================================
 *
 *     node test/test-mua-thit-ve-web.mjs
 *
 * Database của trang Mua thịt về (mua_thit_ve_cong_khai, migration 0101) kiểm ở test-mua-thit-ve.mjs; trang và
 * component ở test-cong-khai-mua-thit-ve.mjs; trang mở hay chưa (muaThitVeMo) ở test-cong-khai-mua-thit-dieu-huong.mjs. File này kiểm hai thư viện nằm giữa: đọc menu (mua-thit-ve.ts, chỉ chạy
 * ở máy chủ) và soạn đơn (don-mua-thit.ts, chạy cả ở máy chủ lẫn trong trình duyệt). Bất biến, theo 9 mục "xong":
 *
 *   1. mat-mang: docMuaThitVe() không bao giờ ném. Chưa nối database → menu rỗng 'chua_noi', không log. Database
 *      trả lỗi, ném, không trả lời trong hạn, trả thứ không phải mảng → 'loi' và ĐÚNG MỘT dòng log "[mua-thit-ve]" —
 *      cả với supabase-js THẬT trên fetch giả (mất mạng, 502 trang HTML, 200 thân bị cắt, treo). Hết hạn thì hủy lời
 *      gọi; đọc xong thì hẹn giờ đã xóa. Gọi đúng hàm, viết đủ tên hai tham số p_ngon_ngu, p_chi_nhanh_ma.
 *   2. Lớp chặn thứ hai sau database (nhomMuaThitVe): dòng hỏng bị bỏ; giá không phải số nguyên dương → bỏ gói đó;
 *      tên (ten hoặc ten_vi) dính chữ cấm hay ngoặc vuông → bỏ cả sản phẩm; mô tả, cách dùng dính → null; gói
 *      trùng → giữ một; gom ba nhóm Thịt mát / Thịt đông lạnh / Kim chi.
 *   3. chu-va-so: "400.000 đ" (dấu cách thường) ở mọi thứ tiếng, đúng như toLocaleString('vi-VN'); số gam in không
 *      dấu ngăn ("1000 g"); "Gói khoảng 200 g" (quyết định 2 của Khánh, 26/10/2026); ô số gói chỉ nhận 0–10 viết đúng
 *      kiểu ("1.000", "1,5", "01" bị bỏ — không thành 1000 gói hay 1 gói); khóa gói ASCII; giỏ lên địa chỉ trang
 *      (gioThanhDiaChi, khi database từ chối đơn) chỉ có khóa gói và số gói.
 *   4. bam-hai-lan: cùng giỏ → cùng đơn, theo thứ tự menu (database chống ghi hai lần theo ma_gui — test-mua-thit-
 *      dat-hang.mjs; trang chặn bấm đúp — test-cong-khai-mua-thit-ve.mjs).
 *   5. gio-vn: không áp dụng — don-mua-thit.ts không đọc đồng hồ (kiểm ở nhóm 9).
 *   7. CHU_DON (chữ có số, máy chủ và script của trang dùng chung) đủ vi / en / ko, không chữ cấm, không
 *      "thành công", không "báo giá", bản en / ko không lẫn chữ Việt.
 *   8. Một trạng thái trang: chua_mo / loi / het_quay / mo.
 *   9. Nạp: hai file không kéo thư viện nội bộ hay thư viện gửi đơn; don-mua-thit.ts chỉ import type nên chạy được
 *      trong trình duyệt mà không kéo supabase-js; rutGonMenu bỏ mô tả, cách dùng.
 *
 * Không áp dụng ở file này: quyen (thư viện chỉ gọi một hàm anon — quyền ở test-mua-thit-ve.mjs,
 * test-an-toan.mjs, test-hop-dong-web.mjs), ton-kho (website không ghi kho), migration. Gửi đơn (lib/dat-hang-mua-thit.ts)
 * kiểm ở test-mua-thit-dat-hang-web.mjs.
 *
 * Cần web/node_modules (cd web && npm ci) — như test-cong-khai-mat-mang.mjs.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIB = join(GOC, 'web', 'src', 'lib');
const nap = f => import(pathToFileURL(join(LIB, f)).href);
const docNguon = f => readFileSync(join(LIB, f), 'utf8').replace(/\r\n?/g, '\n');

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MUA THỊT VỀ: ĐỌC MENU VÀ SOẠN ĐƠN (THƯ VIỆN WEB)');

const DON = await nap('don-mua-thit.ts');
const MTV = await nap('mua-thit-ve.ts');
const { timChuoiCam, CAM } = await nap('chuoi-cam.js');
const { maChiNhanh } = await nap('noi-dung.ts');

// supabase-js của web/ — đúng bản website đang chạy.
const requireWeb = createRequire(join(GOC, 'web', 'package.json'));
const { createClient } = await import(pathToFileURL(requireWeb.resolve('@supabase/supabase-js')).href);

const NGON_NGU = ['vi', 'en', 'ko'];
const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/;
const MAU_GIA = CAM.find(m => /gia_da_duyet/.test(m.vi_sao));

/** Chạy fn, gom mọi dòng console.error trong lúc đó. */
async function ghiLog(fn) {
  const cu = console.error;
  const dong = [];
  console.error = (...a) => dong.push(a.join(' '));
  try { return { kq: await fn(), dong }; } finally { console.error = cu; }
}

// ---------------------------------------------------------------------------
// Dữ liệu thử: dòng của mua_thit_ve_cong_khai() — đủ 11 cột, đúng thứ tự của 0101. Giá thử, không phải giá quán.
// ---------------------------------------------------------------------------
const dong = (them = {}) => ({
  san_pham_ma: 'ribeye-cap', loai: 'thit', don_vi: 'goi', bao_quan: 'mat',
  ten: 'Ribeye with Cap', ten_vi: 'Ribeye with Cap', mo_ta: 'Thớ mỡ đều, mềm.', cach_dung: 'Nướng vỉ thật nóng, lật một lần.',
  so_gam: 200, gia: 400000, tam_het: false, ...them,
});
const BA_CHI = { san_pham_ma: 'ba-chi-bo-my', ten: 'Ba chỉ bò Mỹ', ten_vi: 'Ba chỉ bò Mỹ', mo_ta: null, cach_dung: null };
const LA_GALBI = { san_pham_ma: 'la-galbi', bao_quan: 'dong_lanh', ten: 'LA Galbi', ten_vi: 'LA Galbi', mo_ta: null, cach_dung: null };
const KIM_CHI = {
  san_pham_ma: 'kim-chi-cai-thao', loai: 'kim_chi', don_vi: 'hop', bao_quan: 'giu_lanh',
  ten: 'Kim chi cải thảo', ten_vi: 'Kim chi cải thảo', mo_ta: 'Cải thảo muối kiểu Hàn.', cach_dung: 'Ăn kèm thịt nướng.',
};
const DONG_THU = [
  dong(),
  dong({ so_gam: 400, gia: 800000 }),
  dong({ ...BA_CHI, so_gam: 200, gia: 180000 }),
  dong({ ...BA_CHI, so_gam: 400, gia: 360000, tam_het: true }),
  dong({ ...LA_GALBI, so_gam: 400, gia: 360000 }),
  dong({ ...KIM_CHI, so_gam: 500, gia: 90000 }),
];
// Trang en / ko: ten đã dịch (bản dịch còn hiệu lực), ten_vi vẫn là tên tiếng Việt — tin đơn dùng ten_vi.
const TEN_DICH = {
  en: { 'ba-chi-bo-my': 'US beef brisket', 'kim-chi-cai-thao': 'Napa cabbage kimchi' },
  ko: { 'ba-chi-bo-my': '미국산 차돌박이', 'kim-chi-cai-thao': '배추김치' },
};
const dongCua = nn => DONG_THU.map(d => ({ ...d, ten: TEN_DICH[nn]?.[d.san_pham_ma] ?? d.ten }));
const MENU = MTV.nhomMuaThitVe(DONG_THU);

/** Giỏ đọc từ địa chỉ trang (hoặc FormData của script) → đơn, đúng đường máy chủ và trình duyệt cùng đi. */
function donTu(thamSo, menu = MENU) {
  const { gio, boTamHet } = DON.docGio(thamSo, menu);
  return DON.tinhDon(gio, menu, boTamHet);
}
const GIO_MAU = [['ribeye-cap_200', '2'], ['la-galbi_400', '1'], ['kim-chi-cai-thao_500', '1']];

/** Menu đã đọc (MenuMuaThit) từ một client giả trả đúng các dòng này. */
const menuTu = async (dongs, nn = 'vi') => MTV.docMuaThitVe(nn, { rpc: async () => ({ data: dongs, error: null }) });

// ===========================================================================
await nhom('1 · ĐỌC RPC: KHÔNG BAO GIỜ NÉM, LỖI THÌ ĐÚNG MỘT DÒNG LOG', async () => {
  let r = await ghiLog(() => MTV.docMuaThitVe('vi', null));
  ok('Không client (chưa nối database) → tinhTrang chua_noi, không sản phẩm, không dòng log nào',
     r.kq.tinhTrang === 'chua_noi' && r.kq.sanPham.length === 0 && r.kq.nhom.length === 0 && r.dong.length === 0,
     `${JSON.stringify(r.kq)}; ${r.dong.join(' | ')}`);
  ok('MENU_RONG là chua_noi, rỗng và đóng băng (không trang nào sửa nhầm được bản dùng chung)',
     MTV.MENU_RONG.tinhTrang === 'chua_noi' && MTV.MENU_RONG.sanPham.length === 0 && MTV.MENU_RONG.nhom.length === 0
     && Object.isFrozen(MTV.MENU_RONG) && Object.isFrozen(MTV.MENU_RONG.sanPham) && Object.isFrozen(MTV.MENU_RONG.nhom));
  ok('Hạn chờ database mặc định là 4 giây (HET_GIO_MS)', MTV.HET_GIO_MS === 4000, String(MTV.HET_GIO_MS));

  for (const nn of NGON_NGU) {
    let goi = null;
    const tot = { rpc: async (ham, ts) => { goi = { ham, ts }; return { data: dongCua(nn), error: null }; } };
    r = await ghiLog(() => MTV.docMuaThitVe(nn, tot));
    ok(`[${nn}] Gọi đúng hàm mua_thit_ve_cong_khai với đúng hai tham số p_ngon_ngu, p_chi_nhanh_ma (viết đủ tên, không rút gọn)`,
       goi?.ham === 'mua_thit_ve_cong_khai'
       && JSON.stringify(goi.ts) === JSON.stringify({ p_ngon_ngu: nn, p_chi_nhanh_ma: maChiNhanh() }), JSON.stringify(goi));
    ok(`[${nn}] Database trả dữ liệu → tinhTrang co, đủ bốn sản phẩm, không log`,
       r.kq.tinhTrang === 'co' && r.kq.sanPham.length === 4 && r.dong.length === 0, r.dong.join(' | '));
  }
  // test-hop-dong-web.mjs đọc tên tham số từ mã nguồn (p_…:) để đối chiếu với hàm trong database.
  ok('Mã nguồn viết đủ { p_ngon_ngu: ngonNgu, p_chi_nhanh_ma: maChiNhanh() } trong lời gọi rpc (test-hop-dong-web.mjs đọc được)',
     /\.rpc\(\s*'mua_thit_ve_cong_khai',\s*\{\s*p_ngon_ngu:\s*ngonNgu,\s*p_chi_nhanh_ma:\s*maChiNhanh\(\)\s*\}/.test(docNguon('mua-thit-ve.ts')));

  r = await ghiLog(() => MTV.docMuaThitVe('vi', { rpc: async () => ({ data: [], error: null }) }));
  ok('Database trả mảng rỗng (kênh chưa mở) → tinhTrang co, không sản phẩm, không log',
     r.kq.tinhTrang === 'co' && r.kq.sanPham.length === 0 && r.kq.nhom.length === 0 && r.dong.length === 0);

  const loi = { rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'Could not find the function public.mua_thit_ve_cong_khai' } }) };
  r = await ghiLog(() => MTV.docMuaThitVe('en', loi));
  ok('RPC trả error → tinhTrang loi, đúng một dòng log [mua-thit-ve] có mã lỗi',
     r.kq.tinhTrang === 'loi' && r.kq.sanPham.length === 0 && r.dong.length === 1
     && /^\[mua-thit-ve\] không đọc được menu mua thịt về:.*PGRST202/.test(r.dong[0]), r.dong.join(' | '));

  const nem = { rpc: async () => { throw new Error('fetch failed'); } };
  r = await ghiLog(() => MTV.docMuaThitVe('ko', nem));
  ok('RPC ném Error → loi, đúng một dòng log',
     r.kq.tinhTrang === 'loi' && r.dong.length === 1 && /^\[mua-thit-ve\] không gọi được database:.*fetch failed/.test(r.dong[0]), r.dong.join(' | '));

  r = await ghiLog(() => MTV.docMuaThitVe('vi', { rpc: async () => { throw 'ECONNRESET'; } }));
  ok('RPC ném chuỗi → loi, một dòng log', r.kq.tinhTrang === 'loi' && r.dong.length === 1 && /ECONNRESET/.test(r.dong[0]), r.dong.join(' | '));

  r = await ghiLog(() => MTV.docMuaThitVe('vi', { rpc: () => { throw new TypeError('rpc không chạy được'); } }));
  ok('rpc ném ngay khi gọi (không qua lời hứa) → loi, một dòng log', r.kq.tinhTrang === 'loi' && r.dong.length === 1, r.dong.join(' | '));

  const treo = { rpc: () => new Promise(() => {}) };
  const t0 = performance.now();
  r = await ghiLog(() => MTV.docMuaThitVe('vi', treo, 50));
  const ms = performance.now() - t0;
  ok('RPC không trả lời quá hạn (hetGioMs = 50) → loi trong dưới 1 giây, một dòng log "hết giờ"',
     r.kq.tinhTrang === 'loi' && ms < 1000 && r.dong.length === 1 && /^\[mua-thit-ve\] hết giờ sau 50 ms/.test(r.dong[0]),
     `${Math.round(ms)} ms; ${r.dong.join(' | ')}`);

  // Lời gọi của supabase-js là một builder có abortSignal(): hết hạn thì hủy, Worker không giữ kết nối treo.
  let tinHieu = null;
  const treoCoHuy = { rpc: () => ({ abortSignal(s) { tinHieu = s; return this; }, then: (a, b) => new Promise(() => {}).then(a, b) }) };
  r = await ghiLog(() => MTV.docMuaThitVe('vi', treoCoHuy, 50));
  ok('Hết hạn thì hủy lời gọi qua abortSignal (Worker không giữ kết nối treo)',
     r.kq.tinhTrang === 'loi' && tinHieu?.aborted === true, `aborted = ${tinHieu?.aborted}`);

  for (const [ten, data] of [['null', null], ['đối tượng', { san_pham_ma: 'ribeye-cap' }], ['chuỗi', 'abc'], ['số', 42]]) {
    r = await ghiLog(() => MTV.docMuaThitVe('vi', { rpc: async () => ({ data, error: null }) }));
    ok(`data không phải mảng (${ten}) → loi, một dòng log`, r.kq.tinhTrang === 'loi' && r.kq.sanPham.length === 0 && r.dong.length === 1,
       r.dong.join(' | '));
  }

  // Hẹn giờ 60 giây: còn sót thì Node thấy một Timeout đang chờ — trong Worker là trang chờ thêm cho tới hạn.
  const demHen = () => process.getActiveResourcesInfo().filter(x => x === 'Timeout').length;
  const truoc = demHen();
  await ghiLog(async () => {
    await MTV.docMuaThitVe('vi', { rpc: async () => ({ data: DONG_THU, error: null }) }, 60_000);
    await MTV.docMuaThitVe('vi', loi, 60_000);
    await MTV.docMuaThitVe('vi', nem, 60_000);
  });
  ok('Đọc xong (được, lỗi hay ném) thì hẹn giờ đã được xóa', demHen() === truoc, `${truoc} → ${demHen()} hẹn giờ`);

  // supabase-js THẬT với fetch giả — đúng đường trang chạy trên Cloudflare.
  let traLoiGia = () => { throw new Error('chưa đặt câu trả lời giả'); };
  const goiFetch = [];
  const clientThat = () => createClient('https://thu-khong-that.supabase.co', 'khoa-anon-gia', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url, init) => { goiFetch.push({ url: String(url), method: init?.method, body: init?.body }); return traLoiGia(init); } },
  });
  const KIEU_HONG = [
    ['mất mạng (ECONNREFUSED)', () => { throw new TypeError('fetch failed', { cause: Object.assign(new Error('connect ECONNREFUSED 104.18.0.1:443'), { code: 'ECONNREFUSED' }) }); }],
    ['502 trả trang HTML', () => new Response('<html><body><h1>Lỗi cổng</h1>502 Bad Gateway</body></html>', { status: 502, headers: { 'content-type': 'text/html' } })],
    ['200 thân bị cắt giữa chừng', () => new Response('[{"san_pham_ma":"ribeye-cap","lo', { status: 200, headers: { 'content-type': 'application/json' } })],
    ['200 thân rỗng', () => new Response('', { status: 200 })],
  ];
  for (const [ten, traLoi] of KIEU_HONG) {
    traLoiGia = traLoi;
    goiFetch.length = 0;
    let nemRa = null;
    r = await ghiLog(async () => { try { return await MTV.docMuaThitVe('vi', clientThat()); } catch (e) { nemRa = e; return null; } });
    ok(`supabase-js thật + fetch giả: ${ten} → loi, không ném, một dòng log`,
       !nemRa && r.kq?.tinhTrang === 'loi' && r.dong.length === 1 && goiFetch.length === 1
       && goiFetch[0].method === 'POST' && goiFetch[0].url.endsWith('/rest/v1/rpc/mua_thit_ve_cong_khai'),
       `${nemRa ? 'ném: ' + nemRa.message : JSON.stringify(r.kq?.tinhTrang)}; ${goiFetch.length} lần gọi; ${r.dong.join(' | ')}`);
  }
  // Database treo: fetch chỉ kết thúc khi bị hủy.
  let biHuy = false;
  traLoiGia = init => new Promise((_, tuChoi) => init?.signal?.addEventListener('abort', () => {
    biHuy = true; tuChoi(new DOMException('This operation was aborted', 'AbortError'));
  }));
  r = await ghiLog(() => MTV.docMuaThitVe('vi', clientThat(), 50));
  ok('supabase-js thật, database treo → loi sau hạn chờ, fetch nhận tín hiệu hủy',
     r.kq.tinhTrang === 'loi' && biHuy && r.dong.length === 1 && /hết giờ/.test(r.dong[0]), `bị hủy: ${biHuy}; ${r.dong.join(' | ')}`);

  traLoiGia = () => new Response(JSON.stringify(dongCua('en')), { status: 200, headers: { 'content-type': 'application/json' } });
  goiFetch.length = 0;
  r = await ghiLog(() => MTV.docMuaThitVe('en', clientThat()));
  ok('supabase-js thật, 200 đúng dạng → co; thân POST đúng hai tham số', r.kq.tinhTrang === 'co' && r.kq.sanPham.length === 4
     && r.dong.length === 0 && JSON.stringify(JSON.parse(goiFetch[0]?.body ?? 'null')) === JSON.stringify({ p_ngon_ngu: 'en', p_chi_nhanh_ma: maChiNhanh() }),
     `${goiFetch[0]?.body}; ${r.dong.join(' | ')}`);
});

// ===========================================================================
await nhom('2 · LỚP CHẶN THỨ HAI (nhomMuaThitVe)', async () => {
  const ma = sp => sp.map(s => s.ma).join(',');
  ok('Dữ liệu chuẩn → bốn sản phẩm, giữ thứ tự database', ma(MENU) === 'ribeye-cap,ba-chi-bo-my,la-galbi,kim-chi-cai-thao', ma(MENU));
  ok('Đổi tên cột của database sang tên trong mã: ma, loai, donVi, baoQuan, ten, tenVi, moTa, cachDung, goi { khoa, soGam, gia, tamHet }',
     JSON.stringify(MENU[0]) === JSON.stringify({
       ma: 'ribeye-cap', loai: 'thit', donVi: 'goi', baoQuan: 'mat', ten: 'Ribeye with Cap', tenVi: 'Ribeye with Cap',
       moTa: 'Thớ mỡ đều, mềm.', cachDung: 'Nướng vỉ thật nóng, lật một lần.',
       goi: [{ khoa: 'ribeye-cap_200', soGam: 200, gia: 400000, tamHet: false }, { khoa: 'ribeye-cap_400', soGam: 400, gia: 800000, tamHet: false }],
     }), JSON.stringify(MENU[0]));
  ok('Gói tạm hết giữ giá và cờ tamHet', JSON.stringify(MENU[1].goi[1]) === JSON.stringify({ khoa: 'ba-chi-bo-my_400', soGam: 400, gia: 360000, tamHet: true }));

  for (const v of [null, undefined, 'không phải mảng', { a: 1 }, 42]) {
    ok(`Dữ liệu ${JSON.stringify(v) ?? 'undefined'} → không sản phẩm nào`, Array.isArray(MTV.nhomMuaThitVe(v)) && MTV.nhomMuaThitVe(v).length === 0);
  }

  const hong = [
    dong({ san_pham_ma: 'a1', ten: null }), dong({ san_pham_ma: 'a2', ten: '   ' }), dong({ san_pham_ma: 'a3', ten_vi: null }),
    dong({ san_pham_ma: '' }), dong({ san_pham_ma: null }), dong({ san_pham_ma: 'Ba-Chi' }), dong({ san_pham_ma: 'bò-mỹ' }),
    dong({ san_pham_ma: 'co dau cach' }), dong({ san_pham_ma: 'x'.repeat(41) }),
    dong({ san_pham_ma: 'a4', so_gam: 49 }), dong({ san_pham_ma: 'a5', so_gam: 5001 }), dong({ san_pham_ma: 'a6', so_gam: 200.5 }),
    dong({ san_pham_ma: 'a7', so_gam: 'abc' }), dong({ san_pham_ma: 'a8', so_gam: null }),
    dong({ san_pham_ma: 'a9', don_vi: 'kg' }), dong({ san_pham_ma: 'a10', bao_quan: 'nong' }), dong({ san_pham_ma: 'a11', loai: 'ca' }),
    null, 'rác', 42, [],
  ];
  ok('Bỏ dòng thiếu tên, so_gam ngoài 50–5000, don_vi lạ, bao_quan lạ (và loại lạ, mã sản phẩm không phải ASCII thường, dòng rác)',
     MTV.nhomMuaThitVe(hong).length === 0, ma(MTV.nhomMuaThitVe(hong)));
  ok('… dòng tốt đứng sau dòng hỏng vẫn được giữ', ma(MTV.nhomMuaThitVe([...hong, dong({ san_pham_ma: 'tot' })])) === 'tot');
  ok('so_gam 50 và 5000 (hai đầu giới hạn của 0099) được nhận',
     MTV.nhomMuaThitVe([dong({ so_gam: 50 }), dong({ so_gam: 5000 })])[0]?.goi.map(g => g.soGam).join(',') === '50,5000');

  const gia = MTV.nhomMuaThitVe([
    dong({ so_gam: 100, gia: null }), dong({ so_gam: 200, gia: -1 }), dong({ so_gam: 300, gia: 0 }), dong({ so_gam: 400, gia: 400000.5 }),
    dong({ so_gam: 500, gia: 'abc' }), dong({ so_gam: 600, gia: Infinity }), dong({ so_gam: 700, gia: 2 ** 53 }), dong({ so_gam: 800, gia: undefined }),
    dong({ so_gam: 900, gia: '1.800.000' }),
    dong({ so_gam: 1000, gia: 1500000 }), dong({ so_gam: 1200, gia: '1800000' }),
  ]);
  ok('gia null, âm, 0, số lẻ, chữ → bỏ gói đó, gói khác của sản phẩm vẫn còn (bigint dạng chuỗi chữ số vẫn đọc được)',
     gia.length === 1 && gia[0].goi.map(g => `${g.soGam}:${g.gia}`).join(',') === '1000:1500000,1200:1800000',
     JSON.stringify(gia[0]?.goi));
  ok('Sản phẩm không còn gói nào hợp lệ → bỏ cả sản phẩm', MTV.nhomMuaThitVe([dong({ gia: 0 }), dong({ so_gam: 400, gia: null })]).length === 0);

  const tenXau = MTV.nhomMuaThitVe([
    dong({ san_pham_ma: 'wagyu', ten: 'Wagyu A5', ten_vi: 'Wagyu A5' }),
    dong({ san_pham_ma: 'cho', ten: '[chờ Sang chốt tên]', ten_vi: '[chờ Sang chốt tên]' }),
    dong({ san_pham_ma: 'nua-ngoac', ten: 'Thăn ngoại]', ten_vi: 'Thăn ngoại]' }),
    dong({ san_pham_ma: 'ten-vi-xau', ten: 'Striploin', ten_vi: 'Thăn ngoại ngon nhất' }),
    dong({ san_pham_ma: 'than-hoa', ten: 'Ba chỉ nướng than hoa', ten_vi: 'Ba chỉ nướng than hoa' }),
    dong({ san_pham_ma: 'sach' }),
  ]);
  ok('Tên dính chữ cấm hoặc ngoặc vuông → bỏ sản phẩm; ten_vi dính chữ cấm dù ten sạch → bỏ sản phẩm', ma(tenXau) === 'sach', ma(tenXau));
  ok('Một dòng của sản phẩm có tên dính chữ cấm → bỏ MỌI gói của sản phẩm đó',
     MTV.nhomMuaThitVe([dong(), dong({ so_gam: 400, ten: 'Ribeye Wagyu' })]).length === 0);

  const moTa = MTV.nhomMuaThitVe([
    dong({ san_pham_ma: 'a', mo_ta: 'Ngon nhất Sài Gòn.', cach_dung: 'Nướng trên than hoa.' }),
    dong({ san_pham_ma: 'b', mo_ta: '[chờ Sang viết]', cach_dung: '   ' }),
    dong({ san_pham_ma: 'c', mo_ta: 'Giá chỉ 400.000 đ.', cach_dung: null }),
  ]);
  ok('Mô tả dính chữ cấm → mo_ta null (cách dùng cũng vậy; ngoặc vuông, toàn khoảng trắng → null), sản phẩm vẫn hiện',
     moTa.length === 3 && moTa.every(s => s.moTa === null && s.cachDung === null), JSON.stringify(moTa.map(s => [s.moTa, s.cachDung])));

  const trung = MTV.nhomMuaThitVe([dong(), dong({ gia: 500000 }), dong({ so_gam: 400, gia: 800000 })]);
  ok('Trùng (san_pham_ma, so_gam) → giữ một gói (dòng đầu)',
     trung.length === 1 && trung[0].goi.map(g => `${g.soGam}:${g.gia}`).join(',') === '200:400000,400:800000', JSON.stringify(trung[0]?.goi));

  const xuongDong = MTV.nhomMuaThitVe([dong({ ten: 'Ribeye\nwith   Cap', ten_vi: ' Ribeye\twith Cap ' })]);
  ok('Tên có xuống dòng, tab, nhiều dấu cách → một dòng (tin đơn không vỡ dòng)',
     xuongDong[0]?.ten === 'Ribeye with Cap' && xuongDong[0]?.tenVi === 'Ribeye with Cap', JSON.stringify(xuongDong[0]?.ten));

  // Gom nhóm: database trả kim chi trước, đông lạnh, rồi thịt mát — trang vẫn Thịt mát → Đông lạnh → Kim chi.
  const m = await menuTu([dong({ ...KIM_CHI, so_gam: 500, gia: 90000 }), dong({ ...LA_GALBI, gia: 360000, so_gam: 400 }),
    dong({ san_pham_ma: 'than-ngoai', ten: 'Thăn ngoại', ten_vi: 'Thăn ngoại' }), dong({ ...BA_CHI, gia: 180000 })]);
  ok('Gom nhóm Thịt mát / Thịt đông lạnh / Kim chi, giữ thứ tự database trong nhóm',
     m.nhom.map(n => `${n.loai}:${n.sanPham.map(s => s.ma).join('+')}`).join(' | ') === 'mat:than-ngoai+ba-chi-bo-my | dong_lanh:la-galbi | kim_chi:kim-chi-cai-thao',
     m.nhom.map(n => `${n.loai}:${n.sanPham.map(s => s.ma).join('+')}`).join(' | '));
  ok('… sanPham của menu giữ thứ tự database', ma(m.sanPham) === 'kim-chi-cai-thao,la-galbi,than-ngoai,ba-chi-bo-my');
  const chiKimChi = await menuTu([dong({ ...KIM_CHI, so_gam: 500, gia: 90000 })]);
  ok('Bỏ nhóm rỗng', chiKimChi.nhom.length === 1 && chiKimChi.nhom[0].loai === 'kim_chi', JSON.stringify(chiKimChi.nhom.map(n => n.loai)));
  ok('Thịt giữ lạnh (không phải đông lạnh) vào nhóm Thịt mát',
     (await menuTu([dong({ bao_quan: 'giu_lanh' })])).nhom.map(n => n.loai).join(',') === 'mat');
});

// ===========================================================================
await nhom('3 · TIỀN, SỐ GAM VÀ GIỎ (chu-va-so)', async () => {
  const cuaRepo = n => Math.round(n).toLocaleString('vi-VN') + ' đ';
  const SO = [1000, 9000, 45000, 90000, 180000, 400000, 999999, 1250000, 15000000, 99000000];
  const sai = SO.filter(n => DON.dinhDangTien(n) !== cuaRepo(n) || DON.dinhDangTien(n).includes('\u00a0') || !/^\d{1,3}(\.\d{3})+ đ$/.test(DON.dinhDangTien(n)));
  ok('dinhDangTien(n) = Math.round(n).toLocaleString(\'vi-VN\') + \' đ\' với 1.000 → 99.000.000; dấu cách là U+0020; cùng một kiểu ở vi, en, ko (hàm không nhận thứ tiếng)',
     sai.length === 0 && DON.dinhDangTien.length === 1, sai.map(n => `${n} → "${DON.dinhDangTien(n)}"`).join(' | '));
  ok('dinhDangSo: 1250000 → "1.250.000", 999 → "999", 400000.4 → "400.000" (không phụ thuộc Intl)',
     DON.dinhDangSo(1250000) === '1.250.000' && DON.dinhDangSo(999) === '999' && DON.dinhDangSo(400000.4) === '400.000');

  const gam = NGON_NGU.flatMap(nn => [DON.nhanGoi('goi', 1000, nn), DON.nhanGoi('hop', 1000, nn)]);
  ok('Số gam in không dấu ngăn ở mọi thứ tiếng: 1000 → "1000 g"', gam.every(s => s.includes('1000 g') && !/1[.,]000/.test(s)), gam.join(' | '));

  const NHAN = {
    vi: ['Gói khoảng 200 g', 'Hộp 500 g'], en: ['Pack of about 200 g', '500 g box'], ko: ['약 200 g 팩', '500 g 통'],
  };
  const nhanSai = NGON_NGU.filter(nn => DON.nhanGoi('goi', 200, nn) !== NHAN[nn][0] || DON.nhanGoi('hop', 500, nn) !== NHAN[nn][1]);
  ok('Nhãn gói thịt "Gói khoảng 200 g" / "Pack of about 200 g" / "약 200 g 팩"; hộp "Hộp 500 g" / "500 g box" / "500 g 통"',
     nhanSai.length === 0, nhanSai.map(nn => `${nn}: ${DON.nhanGoi('goi', 200, nn)} · ${DON.nhanGoi('hop', 500, nn)}`).join(' | '));

  const SAI_KIEU = ['1.000', '1,5', '-1', '11', '01', 'abc', '', ' 2', '2 ', '1e1', '0x2', '２', '2.0', '+2', '10.000'];
  const loLot = SAI_KIEU.filter(v => DON.docGio([['ribeye-cap_200', v]], MENU).gio.size !== 0);
  ok('docGio: "1.000", "1,5", "-1", "11", "01", "abc" bị bỏ — không thành 1000 gói hay 1 gói', loLot.length === 0, loLot.join(' | '));
  ok('docGio: "0" không vào giỏ; "1" → 1; "10" (SO_GOI_TOI_DA) → 10',
     DON.SO_GOI_TOI_DA === 10 && DON.docGio([['ribeye-cap_200', '0']], MENU).gio.size === 0
     && DON.docGio([['ribeye-cap_200', '1']], MENU).gio.get('ribeye-cap_200') === 1
     && DON.docGio([['ribeye-cap_200', '10']], MENU).gio.get('ribeye-cap_200') === 10);
  ok('docGio: khóa lặp lại → lấy lần đầu',
     DON.docGio([['ribeye-cap_200', '2'], ['ribeye-cap_200', '9']], MENU).gio.get('ribeye-cap_200') === 2);

  const la = DON.docGio([['khong-co_200', '2'], ['ribeye-cap_300', '1'], ['ribeye-cap', '1'], ['RIBEYE-CAP_200', '1'], ['ribeye-cap_200 ', '1']], MENU);
  const tamHet = DON.docGio([['ba-chi-bo-my_400', '2'], ['ba-chi-bo-my_200', '1'], ['ribeye-cap_400', '0']], MENU);
  ok('docGio: khóa không có trong menu bị bỏ; gói tạm hết bị bỏ và đếm vào boTamHet',
     la.gio.size === 0 && la.boTamHet === 0
     && JSON.stringify([...tamHet.gio]) === JSON.stringify([['ba-chi-bo-my_200', 1]]) && tamHet.boTamHet === 1,
     `${JSON.stringify([...la.gio])}; ${JSON.stringify([...tamHet.gio])} boTamHet=${tamHet.boTamHet}`);
  ok('docGio nhận cả FormData của trình duyệt (cặp [tên, giá trị]) — giá trị không phải chữ bị bỏ',
     DON.docGio([['ribeye-cap_200', 2], ['ribeye-cap_400', null]], MENU).gio.size === 0);
  const oKhac = DON.docGio([['ho_ten', 'Nguyễn Thị Hoa'], ['sdt', '0912345678'], ['gia_ribeye-cap_200', '400000'],
                            ['ma_gui', '00000000-0000-4000-8000-000000000001'], ['nhan', 'giao'], ['ribeye-cap_200', '1']], MENU);
  ok('docGio bỏ qua ô khác của form (họ tên, số điện thoại, giá đã thấy, mã chống gửi hai lần, "nhan" cũ)',
     JSON.stringify([...oKhac.gio]) === JSON.stringify([['ribeye-cap_200', 1]]) && !('cachNhan' in oKhac), JSON.stringify(oKhac));

  const don = donTu([...GIO_MAU].reverse());
  ok('tinhDon: mỗi dòng số gói × giá = thành tiền; tạm tính = tổng các dòng',
     don.dong.length === 3 && don.dong.every(d => d.thanhTien === d.soLuong * d.goi.gia)
     && don.tamTinh === don.dong.reduce((t, d) => t + d.thanhTien, 0) && don.tamTinh === 1250000, JSON.stringify(don.dong.map(d => d.thanhTien)));
  ok('tinhDon: dòng đơn theo thứ tự menu, không theo thứ tự chọn',
     don.dong.map(d => d.goi.khoa).join(',') === 'ribeye-cap_200,la-galbi_400,kim-chi-cai-thao_500');
  ok('tinhDon: giỏ rỗng → không dòng, tạm tính 0; không còn cách nhận (chỉ giao tận nơi)',
     (() => { const r = DON.tinhDon(new Map(), MENU); return r.dong.length === 0 && r.tamTinh === 0 && r.soGoi === 0 && r.soHop === 0 && !('cachNhan' in r); })());
  const tinhTay = DON.tinhDon(new Map([['ba-chi-bo-my_400', 2], ['ribeye-cap_200', 11], ['ribeye-cap_400', 2.5], ['la-galbi_400', 0], ['kim-chi-cai-thao_500', 1]]), MENU);
  ok('tinhDon (giỏ không qua docGio): gói tạm hết bị bỏ và đếm; số ngoài 1–10 hay số lẻ bị bỏ',
     tinhTay.dong.map(d => d.goi.khoa).join(',') === 'kim-chi-cai-thao_500' && tinhTay.boTamHet === 1, JSON.stringify(tinhTay.dong.map(d => d.goi.khoa)));

  ok('Đếm gói và hộp riêng: 2 Ribeye + 1 LA Galbi + 1 hộp kim chi → 3 gói, 1 hộp', don.soGoi === 3 && don.soHop === 1, `${don.soGoi} gói, ${don.soHop} hộp`);
  const DEM = {
    vi: ['3 gói · 1 hộp', '1 gói', '2 hộp', ''], en: ['3 packs · 1 box', '1 pack', '2 boxes', ''], ko: ['3팩 · 1통', '1팩', '2통', ''],
  };
  const demSai = NGON_NGU.filter(nn => JSON.stringify([[3, 1], [1, 0], [0, 2], [0, 0]].map(([a, b]) => DON.CHU_DON.dem[nn](a, b))) !== JSON.stringify(DEM[nn]));
  ok('Câu đếm: "3 gói · 1 hộp" / "3 packs · 1 box" / "3팩 · 1통"; bỏ vế bằng 0; tiếng Anh số ít "1 pack"',
     demSai.length === 0, demSai.map(nn => `${nn}: ${[[3, 1], [1, 0], [0, 2], [0, 0]].map(([a, b]) => JSON.stringify(DON.CHU_DON.dem[nn](a, b))).join(' ')}`).join(' | '));

  const khoa = MENU.flatMap(sp => sp.goi.map(g => [sp, g]));
  ok('khoaGoi(\'ribeye-cap\', 200) = "ribeye-cap_200"; mọi khóa gói của MENU chỉ có ký tự ASCII [a-z0-9_-] (tên có dấu không bao giờ thành tên ô form)',
     DON.khoaGoi('ribeye-cap', 200) === 'ribeye-cap_200'
     && khoa.every(([sp, g]) => /^[a-z0-9_-]+$/.test(g.khoa) && g.khoa === DON.khoaGoi(sp.ma, g.soGam))
     && khoa.some(([sp]) => sp.tenVi === 'Ba chỉ bò Mỹ'), khoa.map(([, g]) => g.khoa).join(','));

  // gioThanhDiaChi: database từ chối đơn → khách về trang kèm giỏ trên địa chỉ (lib/xu-ly-form.ts luotDatHang).
  const gio = DON.docGio(GIO_MAU, MENU).gio;
  ok('gioThanhDiaChi: "ribeye-cap_200=2&la-galbi_400=1&kim-chi-cai-thao_500=1"; đọc lại bằng docGio ra đúng giỏ',
     DON.gioThanhDiaChi(gio) === 'ribeye-cap_200=2&la-galbi_400=1&kim-chi-cai-thao_500=1'
     && JSON.stringify([...DON.docGio([...new URLSearchParams(DON.gioThanhDiaChi(gio))], MENU).gio]) === JSON.stringify([...gio]),
     DON.gioThanhDiaChi(gio));
  ok('gioThanhDiaChi bỏ khóa không phải khóa gói (ho_ten, sdt, chữ có dấu) và số ngoài 1–10 — địa chỉ trang không bao giờ mang họ tên, số điện thoại',
     DON.gioThanhDiaChi(new Map([['ho_ten', 1], ['sdt', 2], ['bò_200', 1], ['ribeye-cap_200', 11], ['ribeye-cap_400', 0], ['la-galbi_400', 3]])) === 'la-galbi_400=3'
     && DON.gioThanhDiaChi(new Map()) === '');
});

// ===========================================================================
await nhom('4 · GỬI HAI LẦN (bam-hai-lan)', async () => {
  const a = donTu(GIO_MAU);
  const b = donTu([...GIO_MAU].reverse());
  ok('Cùng giỏ (chọn theo thứ tự khác) → cùng đơn, cùng tạm tính',
     JSON.stringify(a.dong.map(d => [d.goi.khoa, d.soLuong])) === JSON.stringify(b.dong.map(d => [d.goi.khoa, d.soLuong])) && a.tamTinh === b.tamTinh);
  const c = donTu([['ribeye-cap_200', '3'], ...GIO_MAU.slice(1)]);
  ok('Đổi số gói → khác đơn', c.tamTinh !== a.tamTinh);
});

// ===========================================================================
await nhom('7 · CHỮ CỦA KHỐI ĐƠN (CHU_DON)', async () => {
  const KHOA = ['goiChu', 'dem', 'dongDau', 'tamTinh', 'donTrong', 'vuaDoi'];
  const C = DON.CHU_DON;
  const thieu = KHOA.filter(k => !C[k] || NGON_NGU.some(nn => C[k][nn] === undefined || typeof C[k][nn] !== typeof C[k].vi));
  ok('Mọi khóa đủ vi, en, ko', thieu.length === 0 && Object.keys(C).sort().join() === [...KHOA].sort().join(),
     `thiếu: ${thieu.join(', ')}; có: ${Object.keys(C).join(', ')}`);

  const TEN = { vi: 'Ba chỉ bò Mỹ', en: 'US beef brisket', ko: '미국산 차돌박이' };
  /** Mọi câu một thứ tiếng có thể ra, với tham số mẫu. */
  const cauCua = nn => [
    C.goiChu[nn]('goi', 200), C.goiChu[nn]('hop', 500), C.goiChu[nn]('goi', 1000),
    ...[[1, 0], [2, 1], [0, 2], [3, 3], [1, 1]].map(([a, b]) => C.dem[nn](a, b)),
    C.dongDau[nn](TEN[nn], DON.nhanGoi('goi', 200, nn), 2), C.tamTinh[nn], C.donTrong[nn],
    C.vuaDoi[nn](TEN[nn], DON.nhanGoi('goi', 400, nn), 3),
  ];
  const moiCau = NGON_NGU.flatMap(nn => cauCua(nn).map(c => [nn, c]));
  const xau = moiCau.filter(([, c]) => typeof c !== 'string' || timChuoiCam(c).length > 0 || /thành công|success|성공|[[\]]|báo giá|quote|견적/i.test(c));
  ok('Không chữ cấm, không "thành công / success / 성공", không ngoặc vuông, không "báo giá"', xau.length === 0, xau.map(([nn, c]) => `${nn}: ${c}`).join(' | '));
  const lan = moiCau.filter(([nn, c]) => nn !== 'vi' && VIET.test(c));
  ok('Bản en, ko không lẫn chữ Việt', lan.length === 0, lan.map(([nn, c]) => `${nn}: ${c}`).join(' | '));

  const CHU = {
    vi: ['Tạm tính', 'Bạn chưa chọn gói nào', 'Ribeye with Cap · Gói khoảng 200 g × 2 = ', 'Ribeye with Cap, Gói khoảng 200 g: 2.'],
    en: ['Subtotal', 'You have not chosen any packs yet', 'Ribeye with Cap · Pack of about 200 g × 2 = ', 'Ribeye with Cap, Pack of about 200 g: 2.'],
    ko: ['소계', '아직 고른 팩이 없어요', 'Ribeye with Cap · 약 200 g 팩 × 2 = ', 'Ribeye with Cap 약 200 g 팩: 2개.'],
  };
  const lech = NGON_NGU.filter(nn => JSON.stringify([C.tamTinh[nn], C.donTrong[nn],
    C.dongDau[nn]('Ribeye with Cap', DON.nhanGoi('goi', 200, nn), 2), C.vuaDoi[nn]('Ribeye with Cap', DON.nhanGoi('goi', 200, nn), 2)]) !== JSON.stringify(CHU[nn]));
  ok('Đúng chữ: Tạm tính / Subtotal / 소계; câu giỏ rỗng; dòng đơn kết bằng "= " (số tiền ghép sau, trong data-tien); câu vừa đổi',
     lech.length === 0, lech.map(nn => `${nn}: ${JSON.stringify([C.tamTinh[nn], C.donTrong[nn], C.dongDau[nn]('Ribeye with Cap', DON.nhanGoi('goi', 200, nn), 2), C.vuaDoi[nn]('Ribeye with Cap', DON.nhanGoi('goi', 200, nn), 2)])}`).join(' | '));
  ok('Không câu nào của CHU_DON chứa số tiền (số tiền luôn ở phần tử data-tien riêng)',
     moiCau.every(([, c]) => !/\d{1,3}(\.\d{3})+\s?đ/.test(c)));
});

// ===========================================================================
await nhom('8 · TRẠNG THÁI TRANG', async () => {
  const { trangThaiMuaThit: tt, coGoiDatDuoc, MENU_RONG } = MTV;
  const coDu = await menuTu(DONG_THU);
  const coRong = await menuTu([]);
  const hetHet = await menuTu(DONG_THU.map(d => ({ ...d, tam_het: true })));
  const loi = (await ghiLog(() => MTV.docMuaThitVe('vi', { rpc: async () => ({ data: null, error: { code: '500', message: 'lỗi' } }) }))).kq;
  ok('Bốn menu thử đúng tình trạng', coDu.tinhTrang === 'co' && coRong.tinhTrang === 'co' && hetHet.tinhTrang === 'co' && loi.tinhTrang === 'loi');

  ok('trangThaiMuaThit(false, bất kỳ menu) → chua_mo', [MENU_RONG, loi, coRong, coDu, hetHet].every(m => tt(false, m) === 'chua_mo'));
  ok('mo, menu loi → loi', tt(true, loi) === 'loi');
  ok('mo, menu co rỗng → chua_mo; mo, menu chua_noi → chua_mo', tt(true, coRong) === 'chua_mo' && tt(true, MENU_RONG) === 'chua_mo');
  ok('mo, mọi gói tam_het → het_quay; coGoiDatDuoc false', tt(true, hetHet) === 'het_quay' && coGoiDatDuoc(hetHet) === false);
  ok('mo, ≥ 1 gói đặt được → mo', tt(true, coDu) === 'mo' && coGoiDatDuoc(coDu) === true && coGoiDatDuoc(MENU_RONG) === false);
  const chiMotGoi = await menuTu([dong({ ...BA_CHI, so_gam: 400, gia: 360000, tam_het: true }), dong({ ...BA_CHI, so_gam: 200, gia: 180000 })]);
  ok('… một gói còn đặt được giữa các gói tạm hết → mo', tt(true, chiMotGoi) === 'mo');
  ok('Không còn coGiaoHang: chỉ giao tận nơi (Khánh 03/11/2026)', !('coGiaoHang' in MTV));
});

// ===========================================================================
await nhom('9 · NẠP', async () => {
  const CAM_NAP = /ban-le-noi-bo|\/kho\/|cau-noi-bo|dat-hang-mua-thit|xu-ly-form/;
  /** Mọi đường nạp tĩnh, động và export … from. */
  const duongNap = nguon => [...nguon.matchAll(/(?:import|export)\s+(?:[^'"`;]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map(m => m[1] ?? m[2]);
  const lac = ['mua-thit-ve.ts', 'don-mua-thit.ts'].flatMap(f => duongNap(docNguon(f)).filter(d => CAM_NAP.test(d)).map(d => `${f}: ${d}`));
  ok('mua-thit-ve.ts và don-mua-thit.ts không nạp ban-le-noi-bo.ts, lib/kho, cau-noi-bo.ts, thư viện gửi đơn', lac.length === 0, lac.join(' | '));

  const nguon = docNguon('don-mua-thit.ts');
  const cauNap = [...nguon.matchAll(/^\s*(?:import|export)\b[^;]*?\bfrom\s+['"][^'"]+['"]\s*;?|^\s*import\s+['"][^'"]+['"]\s*;?/gm)]
    .map(m => m[0].trim().replace(/\s+/g, ' '));
  ok('don-mua-thit.ts chỉ có import type (chạy được trong trình duyệt, không kéo supabase-js)',
     cauNap.length > 0 && cauNap.every(c => /^import type /.test(c) && /from '\.\/noi-dung\.ts'/.test(c)) && !/import\(/.test(nguon), cauNap.join(' | '));
  // Comment có thể nhắc chuyện đồng hồ — chỉ đọc phần mã.
  const ma = nguon.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*$/gm, '$1');
  ok('don-mua-thit.ts không đọc đồng hồ, không DOM, không mạng (gio-vn: không áp dụng)',
     !/\bDate\b|performance\.now|document\.|window\.|fetch\(/.test(ma), (ma.match(/.*\b(Date|document|window|fetch)\b.*/g) ?? []).join(' | '));

  const gon = DON.rutGonMenu(MENU);
  ok('rutGonMenu bỏ moTa, cachDung; giữ ma, donVi, baoQuan, ten, tenVi, goi',
     gon.length === MENU.length && gon.every((sp, i) => sp.moTa === null && sp.cachDung === null
       && ['ma', 'loai', 'donVi', 'baoQuan', 'ten', 'tenVi'].every(k => sp[k] === MENU[i][k]) && JSON.stringify(sp.goi) === JSON.stringify(MENU[i].goi))
     && MENU[0].moTa !== null, JSON.stringify(gon[0]));
  ok('rutGonMenu không sửa menu gốc (máy chủ còn dùng mô tả để dựng thẻ)', MENU[0].moTa === 'Thớ mỡ đều, mềm.' && MENU[0].cachDung !== null);
  const tuJson = donTu(GIO_MAU, JSON.parse(JSON.stringify(gon)));
  ok('data-menu (JSON của rutGonMenu) đọc lại ra đúng đơn như menu đầy đủ', tuJson.tamTinh === donTu(GIO_MAU).tamTinh && tuJson.dong.length === 3);
});

process.exit(ketThuc('MUA THỊT VỀ (THƯ VIỆN WEB)'));
