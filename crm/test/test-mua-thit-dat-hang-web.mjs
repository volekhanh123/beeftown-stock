/**
 * BEEFTOWN — MUA THỊT VỀ: GỬI ĐƠN TỪ WEBSITE (web/src/lib/dat-hang-mua-thit.ts, luotDatHang của lib/xu-ly-form.ts)
 * ============================================================================================================
 *
 *     node test/test-mua-thit-dat-hang-web.mjs
 *
 * Khánh 03/11/2026: khách đặt thẳng trên website (0113). Database (tao_don_mua_thit) kiểm ở test-mua-thit-dat-hang.mjs;
 * component ở test-cong-khai-mua-thit-ve.mjs; trình duyệt thật trên Supabase giả ở web/kiem-tra/thu-day-du.mjs nhóm 12.
 * File này kiểm phần nằm giữa — đọc form, chặn sớm, gọi database, nói đúng kết quả. Theo 9 mục "xong":
 *
 *   2. bam-hai-lan — mã chống gửi hai lần đi nguyên lên database (database trả lại đơn cũ); đã nhận thì không
 *      mang giỏ về trang (F5 không dựng lại đơn).
 *   4. chu-va-so — ô số gói chỉ nhận "1"…"10" ("1.000", "1,5", "01" bị bỏ); giá đã thấy chỉ nhận chữ số; họ tên,
 *      địa chỉ có dấu nguyên vẹn, gộp khoảng trắng; số điện thoại có dấu cách / chấm vẫn đủ chữ số.
 *   5. mat-mang — supabase-js THẬT trên fetch giả: mất mạng, 502 trang HTML, 200 thân cắt, 200 thân rỗng →
 *      KHÔNG CHẮC (không bao giờ "đã nhận", không "chưa ghi"); database từ chối (mã SQLSTATE) → CHƯA ghi, câu
 *      của database đúng thứ tiếng; thân POST quá lớn / đọc hỏng → CHƯA ghi, database chưa được gọi.
 *   7. cau-chu — câu ba thứ tiếng; "đã nhận" không phải "thành công" hay "đã xác nhận"; KHÔNG CHẮC bảo đừng đặt lại.
 *   1. quyen — địa chỉ trang (chuyển hướng) không bao giờ mang họ tên, số điện thoại, địa chỉ.
 *   3, 6, 8, 9 — không áp dụng ở file này (không giờ, không kho, không migration, không dịch vụ ngoài ngoài Supabase).
 *
 * Cần web/node_modules (cd web && npm ci).
 */
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIB = join(GOC, 'web', 'src', 'lib');
const nap = f => import(pathToFileURL(join(LIB, f)).href);

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MUA THỊT VỀ: GỬI ĐƠN TỪ WEBSITE (THƯ VIỆN WEB)');
const DH = await nap('dat-hang-mua-thit.ts');
const XL = await nap('xu-ly-form.ts');
const { maChiNhanh } = await nap('noi-dung.ts');
const { timChuoiCam } = await nap('chuoi-cam.js');
const requireWeb = createRequire(join(GOC, 'web', 'package.json'));
const { createClient } = await import(pathToFileURL(requireWeb.resolve('@supabase/supabase-js')).href);

const NGON_NGU = ['vi', 'en', 'ko'];
const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐ]/;
const MA_GUI = '0b7f9d3e-2c1a-4e8b-9f00-1234567890ab';

/** FormData như trình duyệt gửi từ trang (ô chọn đã bỏ số 0, ô giá chỉ của gói đã chọn). */
function formMau(them = {}) {
  const f = new FormData();
  const o = {
    ma_gui: MA_GUI, 'ribeye-cap_200': '2', 'gia_ribeye-cap_200': '400000', 'kim-chi-cai-thao_500': '1',
    'gia_kim-chi-cai-thao_500': '90000', ho_ten: 'Nguyễn Thị Hoa', sdt: '0912 345 678',
    dia_chi: '12 Nguyễn Huệ, phường Sài Gòn', ghi_chu: '', ...them,
  };
  for (const [k, v] of Object.entries(o)) if (v !== undefined) f.append(k, v);
  return f;
}
/** Request POST như trình duyệt gửi (application/x-www-form-urlencoded). */
const yeuCau = (form, dau = {}) => new Request('https://beeftown.vn/mua-thit-ve', {
  method: 'POST', body: new URLSearchParams([...form].map(([k, v]) => [k, String(v)])),
  headers: { 'content-type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': '203.0.113.9', ...dau },
});
async function ghiLog(fn) {
  const cu = console.error;
  const dong = [];
  console.error = (...a) => dong.push(a.join(' '));
  try { return { kq: await fn(), dong }; } finally { console.error = cu; }
}
/** Client giả: ghi lại lời gọi, trả đúng { data, error } đã đặt. */
function clientGia(traLoi) {
  const goi = [];
  return { goi, client: { rpc: async (ham, ts) => { goi.push({ ham, ts }); return typeof traLoi === 'function' ? traLoi(ts) : traLoi; } } };
}

// ===========================================================================
await nhom('1 · ĐỌC FORM (chu-va-so)', async () => {
  const d = DH.docDonGui(formMau({ ho_ten: '  Trần   Thị\n Ánh ', dia_chi: ' Tầng 3,\n63 Hồ Tùng Mậu ', ghi_chu: 'Gọi trước.\r\nCảm ơn!' }));
  ok('Giỏ đọc đúng: khoa → số gói, theo thứ tự form',
     JSON.stringify([...d.gio]) === JSON.stringify([['ribeye-cap_200', 2], ['kim-chi-cai-thao_500', 1]]), JSON.stringify([...d.gio]));
  ok('Giá đã thấy chỉ cho gói trong giỏ, là số', JSON.stringify(d.giaDaXem) === JSON.stringify({ 'ribeye-cap_200': 400000, 'kim-chi-cai-thao_500': 90000 }));
  ok('Họ tên, địa chỉ có dấu nguyên vẹn, khoảng trắng gộp lại; ghi chú giữ xuống dòng, bỏ \\r',
     d.hoTen === 'Trần Thị Ánh' && d.diaChi === 'Tầng 3, 63 Hồ Tùng Mậu' && d.ghiChu === 'Gọi trước.\nCảm ơn!', JSON.stringify(d));
  ok('Mã chống gửi hai lần đọc nguyên (chữ thường)', d.maGui === MA_GUI);
  ok('Mã chống gửi hai lần không đúng dạng UUID → null (database báo "Thiếu mã…", không đoán)',
     DH.docDonGui(formMau({ ma_gui: 'abc' })).maGui === null && DH.docDonGui(formMau({ ma_gui: undefined })).maGui === null);
  for (const so of ['1.000', '1,5', '01', '0', '11', '-1', ' 2', '2.0', 'abc', '']) {
    ok(`Ô số gói "${so}" không vào giỏ`, DH.docDonGui(formMau({ 'ribeye-cap_200': so })).gio.has('ribeye-cap_200') === false);
  }
  ok('"10" vào giỏ (SO_GOI_TOI_DA)', DH.docDonGui(formMau({ 'ribeye-cap_200': '10' })).gio.get('ribeye-cap_200') === 10);
  ok('Tên ô không phải khóa gói (chữ hoa, có dấu, thiếu số gam, ho_ten) không vào giỏ',
     [...DH.docDonGui(formMau({ 'Ribeye_200': '1', 'bò_200': '1', 'ribeye': '1', 'ribeye_2': '1' })).gio.keys()].join() === 'ribeye-cap_200,kim-chi-cai-thao_500');
  for (const gia of ['400.000', '400,000', '4e5', '-400000', '0', '']) {
    ok(`Giá đã thấy "${gia}" bị bỏ (database sẽ báo "Giá vừa đổi")`, !('ribeye-cap_200' in DH.docDonGui(formMau({ 'gia_ribeye-cap_200': gia })).giaDaXem));
  }
  const nhieu = new FormData();
  for (let i = 0; i < 80; i++) nhieu.append(`sp-${i}_200`, '1');
  ok('Tối đa 60 dòng (ràng buộc don_mua_thit_dong của 0113)', DH.docDonGui(nhieu).gio.size === 60);
});

// ===========================================================================
await nhom('2 · CHẶN SỚM, CÂU BA THỨ TIẾNG (cau-chu)', async () => {
  const CA = [
    ['giỏ rỗng', { 'ribeye-cap_200': undefined, 'kim-chi-cai-thao_500': undefined }, 'thieuGio'],
    ['thiếu họ tên', { ho_ten: '   ' }, 'thieuHoTen'],
    ['số điện thoại ít hơn 9 chữ số', { sdt: '0912 34' }, 'thieuSdt'],
    ['địa chỉ dưới 8 ký tự', { dia_chi: 'Q1' }, 'thieuDiaChi'],
  ];
  for (const [ten, them, khoa] of CA) {
    for (const nn of NGON_NGU) {
      const { goi, client } = clientGia({ data: null, error: null });
      const kq = await DH.guiDonMuaThit(client, DH.docDonGui(formMau(them)), null, nn);
      ok(`[${nn}] ${ten} → chưa ghi, đúng câu, database KHÔNG được gọi (không tốn lượt giới hạn)`,
         kq.ok === false && kq.cau === DH.CAU_DAT_HANG[khoa][nn] && goi.length === 0, JSON.stringify(kq));
    }
  }
  const C = DH.CAU_DAT_HANG;
  const moi = Object.entries(C).flatMap(([k, v]) => NGON_NGU.map(nn => [k, nn, v[nn]]));
  ok('Mọi câu đủ vi, en, ko; không chữ cấm', moi.every(([, , c]) => typeof c === 'string' && c.length > 5 && timChuoiCam(c).length === 0));
  ok('Bản en, ko không lẫn chữ Việt', moi.filter(([, nn]) => nn !== 'vi').every(([, , c]) => !VIET.test(c)),
     moi.filter(([, nn, c]) => nn !== 'vi' && VIET.test(c)).map(([k, nn]) => `${k}.${nn}`).join(', '));
  ok('Câu "đã nhận" không phải "thành công" hay "đã xác nhận"', NGON_NGU.every(nn => !/thành công|success|성공|xác nhận|confirm|확정/i.test(C.daNhan[nn])));
  ok('Câu "chưa ghi" nói rõ CHƯA được ghi nhận', /CHƯA/.test(C.chuaGhi.vi) && /NOT/.test(C.chuaGhi.en));
});

// ===========================================================================
await nhom('3 · GỌI DATABASE: THAM SỐ, ĐÃ NHẬN, TỪ CHỐI (bam-hai-lan, cau-chu)', async () => {
  const { goi, client } = clientGia({ data: { ma_don: 'B3G9PW', tam_tinh: 890000, da_co: false }, error: null });
  const kq = await DH.guiDonMuaThit(client, DH.docDonGui(formMau()), '203.0.113.9', 'en');
  ok('Gọi đúng tao_don_mua_thit một lần, đủ mười tham số có tên', goi.length === 1 && goi[0].ham === 'tao_don_mua_thit'
     && Object.keys(goi[0].ts).sort().join() === ['p_chi_nhanh_ma', 'p_dia_chi', 'p_ghi_chu', 'p_gia_da_xem', 'p_gio', 'p_ho_ten', 'p_ip',
       'p_ma_gui', 'p_ngon_ngu', 'p_sdt'].join(), JSON.stringify(goi[0]?.ts));
  ok('Tham số: mã chống gửi hai lần, chi nhánh của website, giỏ là object số, giá đã thấy, thứ tiếng, IP; ghi chú rỗng → null',
     goi[0].ts.p_ma_gui === MA_GUI && goi[0].ts.p_chi_nhanh_ma === maChiNhanh()
       && JSON.stringify(goi[0].ts.p_gio) === JSON.stringify({ 'ribeye-cap_200': 2, 'kim-chi-cai-thao_500': 1 })
       && goi[0].ts.p_gia_da_xem['ribeye-cap_200'] === 400000 && goi[0].ts.p_ngon_ngu === 'en' && goi[0].ts.p_ip === '203.0.113.9'
       && goi[0].ts.p_ghi_chu === null && goi[0].ts.p_sdt === '0912 345 678', JSON.stringify(goi[0].ts));
  ok('Database trả mã → đã nhận, đúng mã, câu "đã nhận" đúng thứ tiếng', kq.ok === true && kq.ma === 'B3G9PW' && kq.cau === DH.CAU_DAT_HANG.daNhan.en);

  const lai = await DH.guiDonMuaThit(clientGia({ data: { ma_don: 'B3G9PW', tam_tinh: 890000, da_co: true }, error: null }).client,
                                     DH.docDonGui(formMau()), null, 'vi');
  ok('Gửi lại cùng mã (database trả đơn cũ, da_co) → vẫn "đã nhận", cùng mã', lai.ok === true && lai.ma === 'B3G9PW');

  for (const nn of NGON_NGU) {
    const tuChoi = await DH.guiDonMuaThit(clientGia({ data: null, error: { code: 'P0001', message: 'Giá vừa đổi, vui lòng tải lại trang để xem giá mới' } }).client,
                                          DH.docDonGui(formMau()), null, nn);
    ok(`[${nn}] Database từ chối (P0001) → chưa ghi, câu của database đúng thứ tiếng`,
       tuChoi.ok === false && !tuChoi.khongChac && (nn === 'vi' ? /^Giá vừa đổi/.test(tuChoi.cau) : !VIET.test(tuChoi.cau) && tuChoi.cau.length > 10),
       JSON.stringify(tuChoi));
  }
  const la = await DH.guiDonMuaThit(clientGia({ data: null, error: { code: '42501', message: 'permission denied for function tao_don_mua_thit' } }).client,
                                    DH.docDonGui(formMau()), null, 'vi');
  ok('Lỗi database không có chữ Việt (quyền) → câu chung "CHƯA được ghi nhận", không lộ chữ kỹ thuật', la.ok === false && la.cau === DH.CAU_DAT_HANG.chuaGhi.vi);

  for (const [ten, data] of [['null', null], ['mảng', [{ ma_don: 'B3G9PW' }]], ['mã sai dạng', { ma_don: 'x' }], ['chuỗi', 'B3G9PW']]) {
    let nem = null;
    try { await DH.guiDonMuaThit(clientGia({ data, error: null }).client, DH.docDonGui(formMau()), null, 'vi'); } catch (e) { nem = e; }
    ok(`Không lỗi mà không có mã (${ten}) → ném (xu-ly-form nói KHÔNG CHẮC), không bao giờ "đã nhận"`, !!nem);
  }
});

// ===========================================================================
await nhom('4 · MẤT MẠNG: supabase-js THẬT TRÊN FETCH GIẢ (mat-mang)', async () => {
  let traLoiGia = () => { throw new Error('chưa đặt'); };
  const goiFetch = [];
  const clientThat = () => createClient('https://thu-khong-that.supabase.co', 'khoa-anon-gia', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (url, init) => { goiFetch.push({ url: String(url), method: init?.method }); return traLoiGia(init); } },
  });
  const KIEU_HONG = [
    ['mất mạng (ECONNREFUSED)', () => { throw new TypeError('fetch failed', { cause: Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' }) }); }],
    ['502 trả trang HTML', () => new Response('<html><body>502 Bad Gateway</body></html>', { status: 502, headers: { 'content-type': 'text/html' } })],
    ['200 thân bị cắt giữa chừng', () => new Response('{"ma_don":"B3G', { status: 200, headers: { 'content-type': 'application/json' } })],
    ['200 thân rỗng', () => new Response('', { status: 200 })],
  ];
  for (const nn of NGON_NGU) {
    for (const [ten, traLoi] of KIEU_HONG) {
      traLoiGia = traLoi;
      goiFetch.length = 0;
      const r = await ghiLog(() => XL.luotDatHang(yeuCau(formMau()), clientThat(), duong(nn), nn));
      const kq = r.kq.ketQua;
      ok(`[${nn}] ${ten} → KHÔNG CHẮC (không "đã nhận", không "chưa ghi"), về #dat-hang không mang giỏ, một dòng log [dat-hang]`,
         kq.ok === false && kq.khongChac === true && /KHÔNG CHẮC|NOT SURE|확실히 알 수 없어요/.test(kq.loi) && r.kq.ve === `${duong(nn)}#dat-hang`
           && goiFetch.length === 1 && goiFetch[0].url.endsWith('/rest/v1/rpc/tao_don_mua_thit')
           && r.dong.length === 1 && r.dong[0].startsWith('[dat-hang]'),
         `${JSON.stringify(r.kq)} · ${goiFetch.length} lần gọi · ${r.dong.join(' | ')}`);
    }
  }
  traLoiGia = () => new Response(JSON.stringify({ code: 'P0001', message: 'Mua thịt về qua website đang tạm đóng', details: null, hint: null }),
                                 { status: 400, headers: { 'content-type': 'application/json' } });
  const r = await ghiLog(() => XL.luotDatHang(yeuCau(formMau()), clientThat(), '/mua-thit-ve', 'vi'));
  ok('supabase-js thật, database từ chối (400 P0001) → CHƯA ghi, câu của database, không log',
     r.kq.ketQua.ok === false && !r.kq.ketQua.khongChac && r.kq.ketQua.loi === 'Mua thịt về qua website đang tạm đóng' && r.dong.length === 0,
     JSON.stringify(r.kq));
  traLoiGia = () => new Response(JSON.stringify({ ma_don: 'B3G9PW', tam_tinh: 890000, da_co: false }), { status: 200, headers: { 'content-type': 'application/json' } });
  const tot = await ghiLog(() => XL.luotDatHang(yeuCau(formMau()), clientThat(), '/en/buy-meat', 'en'));
  ok('supabase-js thật, 200 có mã → đã nhận, về #da-nhan', tot.kq.ketQua.ok === true && tot.kq.ketQua.ma === 'B3G9PW' && tot.kq.ve === '/en/buy-meat#da-nhan',
     JSON.stringify(tot.kq));
});
function duong(nn) { return nn === 'vi' ? '/mua-thit-ve' : `/${nn}/buy-meat`; }

// ===========================================================================
await nhom('5 · MỘT LƯỢT ĐẶT (luotDatHang): CHUYỂN HƯỚNG, THÂN QUÁ LỚN, ĐỊA CHỈ TRANG KHÔNG MANG DỮ LIỆU KHÁCH', async () => {
  const khongClient = await XL.luotDatHang(yeuCau(formMau()), null, '/mua-thit-ve', 'vi');
  ok('Chưa nối database → CHƯA ghi, câu mời gọi quán', khongClient.ketQua.ok === false && /CHƯA/.test(khongClient.ketQua.loi) && khongClient.ve === '/mua-thit-ve#dat-hang');

  const { goi, client } = clientGia({ data: { ma_don: 'B3G9PW' }, error: null });
  const to = new Request('https://beeftown.vn/mua-thit-ve', { method: 'POST', body: 'ghi_chu=' + 'x'.repeat(XL.THAN_TOI_DA_DAT_HANG + 10),
    headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  const quaLon = await XL.luotDatHang(to, client, '/mua-thit-ve', 'vi');
  ok('Thân POST quá lớn → CHƯA ghi, database chưa được gọi', quaLon.ketQua.ok === false && /CHƯA/.test(quaLon.ketQua.loi) && goi.length === 0, JSON.stringify(quaLon));

  const tuChoi = await XL.luotDatHang(yeuCau(formMau({ sdt: '0912 ' })), clientGia({ data: null, error: null }).client, '/mua-thit-ve', 'vi');
  ok('Chặn sớm (số điện thoại thiếu) → về trang KÈM giỏ trên địa chỉ: chỉ khóa gói và số gói',
     tuChoi.ketQua.ok === false && tuChoi.ve === '/mua-thit-ve?ribeye-cap_200=2&kim-chi-cai-thao_500=1#dat-hang', tuChoi.ve);
  const dbTuChoi = await XL.luotDatHang(yeuCau(formMau()), clientGia({ data: null, error: { code: 'P0001', message: 'Giá vừa đổi, vui lòng tải lại trang để xem giá mới' } }).client, '/ko/buy-meat', 'ko');
  ok('Database từ chối → về trang kèm giỏ; câu tiếng Hàn', dbTuChoi.ve === '/ko/buy-meat?ribeye-cap_200=2&kim-chi-cai-thao_500=1#dat-hang'
     && !VIET.test(dbTuChoi.ketQua.loi), JSON.stringify(dbTuChoi));
  const moiVe = [tuChoi.ve, dbTuChoi.ve, quaLon.ve, khongClient.ve];
  ok('Không địa chỉ chuyển hướng nào mang họ tên, số điện thoại, địa chỉ, ghi chú hay giá',
     moiVe.every(v => !/Hoa|0912|Nguy|ho_ten|sdt|dia_chi|ghi_chu|gia_/.test(decodeURIComponent(v))), moiVe.join(' | '));

  const daNhan = await XL.luotDatHang(yeuCau(formMau()), clientGia({ data: { ma_don: 'B3G9PW', tam_tinh: 890000, da_co: false }, error: null }).client, '/mua-thit-ve', 'vi');
  ok('Đã nhận → về #da-nhan, KHÔNG mang giỏ (F5 không dựng lại đơn), cookie mang mã', daNhan.ve === '/mua-thit-ve#da-nhan' && daNhan.ketQua.ma === 'B3G9PW');

  // ketQuaDatHang đọc cookie dùng một lần.
  const lo = new Map();
  const cookies = { get: k => (lo.has(k) ? { value: lo.get(k) } : undefined), delete: k => lo.delete(k) };
  lo.set('bt_kq', JSON.stringify({ ok: true, ma: 'XK7P2Q' }));
  ok('ketQuaDatHang: kết quả của form khác (Hỏi bàn — cookie dùng chung, lượt chuyển hướng bị bỏ dở) → null, không thành thẻ "đã nhận đơn"',
     XL.ketQuaDatHang({ cookies }, 'vi') === null);
  ok('luotDatHang ghi kết quả kèm loai = "dat_hang"', daNhan.ketQua.loai === 'dat_hang' && tuChoi.ketQua.loai === 'dat_hang');
  lo.set('bt_kq', JSON.stringify({ ok: true, ma: 'B3G9PW', loai: 'dat_hang' }));
  const k1 = XL.ketQuaDatHang({ cookies }, 'ko');
  ok('ketQuaDatHang: đã nhận → câu "đã nhận" đúng thứ tiếng của trang đọc, đúng mã', k1?.ok === true && k1.ma === 'B3G9PW' && k1.cau === DH.CAU_DAT_HANG.daNhan.ko,
     JSON.stringify(k1));
  lo.set('bt_kq', JSON.stringify({ ok: false, loi: 'x', khongChac: true, loai: 'dat_hang' }));
  const k2 = XL.ketQuaDatHang({ cookies }, 'vi');
  ok('ketQuaDatHang: không chắc giữ cờ khongChac', k2?.ok === false && k2.khongChac === true);
  ok('ketQuaDatHang: không cookie → null', XL.ketQuaDatHang({ cookies: { get: () => undefined, delete: () => {} } }, 'vi') === null);
});

process.exit(ketThuc('MUA THỊT VỀ — GỬI ĐƠN (THƯ VIỆN WEB)'));
