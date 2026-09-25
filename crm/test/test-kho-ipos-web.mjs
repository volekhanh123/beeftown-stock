/**
 * BEEFTOWN KHO — Kiểm thử phần WEB của đồng bộ iPOS (GĐ7a)
 * ========================================================
 *
 *     node test/test-kho-ipos-web.mjs
 *
 * Phần database nằm ở test-kho-ipos.mjs. File này kiểm:
 *   · lib/kho/ipos.ts (thuần): phanTichHoaDon đọc được nhiều kiểu JSON (định
 *     dạng iPOS CHƯA có tài liệu — fixture dưới đây là GIẢ), cảnh báo chỉ có
 *     tên khóa, giờ không múi → +07:00, URL, phân trang, xóa token;
 *   · lib/kho/ipos-dong-bo.ts: một lượt trọn vẹn trên PGlite bằng client giả
 *     (rpc → SQL dưới danh nghĩa người / máy), fetch giả; câu lỗi không bao
 *     giờ chứa token; thiếu bí mật → tắt êm;
 *   · src/worker.ts + wrangler.toml: có scheduled, có crons, không bí mật;
 *   · cả repo: không file nào chứa chuỗi giống token iPOS.
 */

import { taoBoDem, UID, UID_MAY_IPOS, themMayIpos, dungDatabase } from './kho-chung.mjs';
import {
  TRUONG_IPOS, phanTichHoaDon, docThoiDiem, giaiMaVach, laNhanCan, gopTrungMa, chiaLo,
  conTrangSau, gioThamSo, taoUrlHoaDon, xoaToken, timMangHoaDon,
} from '../../web/src/lib/kho/ipos.ts';
import { dongBoIpos, dongBoTatCa, layBiMatIpos, trangThaiBiMatIpos, cauTomTat } from '../../web/src/lib/kho/ipos-dong-bo.ts';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — KIỂM THỬ ĐỒNG BỘ iPOS (PHẦN WEB)');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Token GIẢ dựng lúc chạy — chuỗi "access_token=<dài>" không nằm nguyên văn
// trong file nào (nhóm quét repo sẽ bắt nó).
const TOKEN_GIA = ['TK', 'gia', 'Zz9', 'x7Q', 'p2L', 'm4N', 'r8'].join('');
const TEN_TS = ['access', 'token'].join('_');
for (const k of ['IPOS_ACCESS_TOKEN', 'KHO_IPOS_EMAIL', 'KHO_IPOS_MAT_KHAU']) delete process.env[k];
const ENV = { IPOS_ACCESS_TOKEN: TOKEN_GIA, KHO_IPOS_EMAIL: 'may-ipos@beeftown.test', KHO_IPOS_MAT_KHAU: 'mat-khau-gia-1234' };

function nhanCan(maCan, gram) {
  const s = '20' + String(maCan).padStart(5, '0') + String(gram).padStart(5, '0');
  let t = 0;
  for (let i = 0; i < 12; i++) t += (s.charCodeAt(i) - 48) * (i % 2 === 0 ? 1 : 3);
  return s + ((10 - (t % 10)) % 10);
}

// ---------------------------------------------------------------------------
// FIXTURE GIẢ — ba kiểu đặt tên trường khác nhau (chưa có tài liệu iPOS)
// ---------------------------------------------------------------------------
const FIX_A = {   // object bọc data, tran_*, sale_detail, giờ "YYYY-MM-DD HH:mm:ss" không múi
  data: [
    {
      tran_id: 'HD001', tran_date: '2026-09-25 12:30:00', is_cancel: 0, customer_phone: '0901234567',
      sale_detail: [
        { detail_id: 11, item_id: 'GOI-CAN', item_name: 'Thịt cân', barcode: nhanCan(101, 520), quantity: 1, amount: 364000 },
        { detail_id: 12, item_id: 'NUOC', item_name: 'Nước suối', quantity: 2, amount: 20000 },
      ],
    },
    { tran_id: 'HD002', tran_date: '2026-09-25T13:00:00+07:00', is_cancel: true, sale_detail: [] },
  ],
  has_more: false,
};
const FIX_B = [   // mảng trần, order_*, items, epoch giây / mili giây, status chữ
  { order_id: 5001, created_at: 1790000000, status: 'CANCELLED',
    items: [{ product_id: 'P1', qty: '0,45', unit: 'kg', total: '120000' }] },
  { order_id: 5002, created_at: 1790000000123, status: 'done',
    items: [{ product_id: 'P2', weight: 1.2, qty: 1, thanh_tien: 50000 }, { product_id: 'P3', qty: 3 }] },
];
const FIX_C = {   // lồng 2 tầng, sale_*, order_details, giờ DD/MM/YYYY; có HĐ hỏng
  result: {
    list: [
      { sale_id: 'S1', sale_date: '25/09/2026 23:50', order_details: [{ line_id: 'a', item_code: 'X', ean: nhanCan(7, 1234) }] },
      { code: 'NO-TIME-7788' },
      { time: '2026-09-25T10:00:00Z', details: [] },
      { id: 'BAD', time: 'hôm qua lúc 9h' },
      { sale_id: 'S2', sale_date: '2026-09-25 09:00', order_details: [{ item_code: 'Y' }, { ten: 'không mã' }] },
    ],
  },
};

// ===========================================================================
await nhom('1 · phanTichHoaDon: BA KIỂU TÊN TRƯỜNG', async () => {
  const a = phanTichHoaDon(FIX_A);
  const [h1, h2] = a.hoaDon;
  ok('Kiểu A: 2 HĐ, không cảnh báo', a.hoaDon.length === 2 && a.canhBao.length === 0 && a.soGoc === 2, JSON.stringify(a.canhBao));
  ok('Kiểu A: giờ không múi → +07:00', h1.thoi_diem_ban === '2026-09-25T12:30:00+07:00', h1.thoi_diem_ban);
  ok('Kiểu A: nhãn cân → 1 gói, KHÔNG gửi kg (database đọc kg trên nhãn), không tự giải mã cân',
     h1.dong[0].so_goi === 1 && h1.dong[0].so_kg === undefined && h1.dong[0].ma_can === undefined
     && h1.dong[0].ma_vach === nhanCan(101, 520) && h1.dong[0].ma_ipos === 'GOI-CAN' && h1.dong[0].khoa_dong === '11',
     JSON.stringify(h1.dong[0]));
  ok('Kiểu A: món thường số lượng nguyên → số gói, có tiền', h1.dong[1].so_goi === 2 && h1.dong[1].thanh_tien === 20000
     && h1.dong[1].so_kg === undefined, JSON.stringify(h1.dong[1]));
  ok('Kiểu A: is_cancel true → da_huy; 0 → không', h2.da_huy === true && h1.da_huy === false);
  ok('raw bỏ thông tin khách (số điện thoại)', !JSON.stringify(h1.raw).includes('0901234567') && h1.raw?.tran_id === 'HD001');

  const aCan = phanTichHoaDon(FIX_A, { mauMaVach: '2XCCCCCWWWWWK', soLeKg: 3 });
  ok('Có mẫu mã vạch → web gửi sẵn ma_can', aCan.hoaDon[0].dong[0].ma_can === '101', JSON.stringify(aCan.hoaDon[0].dong[0]));

  const b = phanTichHoaDon(FIX_B);
  const [b1, b2] = b.hoaDon;
  ok('Kiểu B (mảng trần): 2 HĐ, mã số → chuỗi', b.hoaDon.length === 2 && b1.ma_hd === '5001' && b2.ma_hd === '5002');
  ok('Kiểu B: epoch giây và mili giây', b1.thoi_diem_ban === new Date(1790000000 * 1000).toISOString()
     && b2.thoi_diem_ban === new Date(1790000000123).toISOString(), `${b1.thoi_diem_ban} ${b2.thoi_diem_ban}`);
  ok('Kiểu B: status "CANCELLED" → hủy, "done" → không', b1.da_huy === true && b2.da_huy === false);
  ok('Kiểu B: đơn vị kg + "0,45" → so_kg 0.45, không số gói; tiền chuỗi → số',
     b1.dong[0].so_kg === 0.45 && b1.dong[0].so_goi === undefined && b1.dong[0].thanh_tien === 120000, JSON.stringify(b1.dong[0]));
  ok('Kiểu B: weight → kg, qty nguyên → gói', b2.dong[0].so_kg === 1.2 && b2.dong[0].so_goi === 1
     && b2.dong[1].so_goi === 3 && b2.dong[1].so_kg === undefined, JSON.stringify(b2.dong));

  const c = phanTichHoaDon(FIX_C);
  ok('Kiểu C (lồng 2 tầng): giữ 2 HĐ hợp lệ, bỏ 3 HĐ hỏng', c.hoaDon.length === 2 && c.soGoc === 5
     && c.hoaDon.map(h => h.ma_hd).join() === 'S1,S2', JSON.stringify(c.hoaDon.map(h => h.ma_hd)));
  ok('Kiểu C: "25/09/2026 23:50" → 23:50 giờ VN', c.hoaDon[0].thoi_diem_ban === '2026-09-25T23:50:00+07:00');
  ok('Kiểu C: ean → ma_vach; line_id → khoa_dong', c.hoaDon[0].dong[0].ma_vach === nhanCan(7, 1234)
     && c.hoaDon[0].dong[0].khoa_dong === 'a');
  const cb = c.canhBao.join(' | ');
  ok('Cảnh báo nói TÊN KHÓA: thiếu giờ, thiếu mã, không đọc được giờ ở khóa "time", dòng không mã',
     /thiếu giờ bán/.test(cb) && /thiếu mã hóa đơn/.test(cb) && /khóa "time"/.test(cb) && /1 dòng không có mã/.test(cb), cb);
  ok('Cảnh báo KHÔNG chứa giá trị nào của HĐ', !/NO-TIME-7788|hôm qua|BAD|không mã/.test(cb), cb);

  const la = phanTichHoaDon({ foo: 1, bar: { baz: 2 } });
  ok('Không thấy mảng hóa đơn → 0 HĐ + cảnh báo tên khóa (foo, bar)', la.hoaDon.length === 0
     && /foo, bar/.test(la.canhBao[0] ?? '') && /TRUONG_IPOS/.test(la.canhBao[0] ?? ''), JSON.stringify(la.canhBao));
  ok('null / chuỗi → không vỡ', phanTichHoaDon(null).hoaDon.length === 0 && phanTichHoaDon('x').hoaDon.length === 0);
  ok('Mọi HĐ đọc được đều có giờ khớp dạng kho_ipos_nhan nhận',
     [...a.hoaDon, ...b.hoaDon, ...c.hoaDon].every(h => /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(h.thoi_diem_ban)
       && /(Z|[+-]\d{2}:?\d{2})$/.test(h.thoi_diem_ban)));
});

// ===========================================================================
await nhom('2 · HÀM NHỎ: GIỜ, MÃ VẠCH, LÔ, PHÂN TRANG, URL, XÓA TOKEN', async () => {
  ok('docThoiDiem: ISO có Z giữ nguyên thời điểm', docThoiDiem('2026-09-25T16:50:00Z') === '2026-09-25T16:50:00.000Z');
  ok('docThoiDiem: +0700 / +07', docThoiDiem('2026-09-25 23:50:00+0700') === '2026-09-25T16:50:00.000Z'
     && docThoiDiem('2026-09-25 23:50+07') === '2026-09-25T16:50:00.000Z');
  ok('docThoiDiem: rác → null', docThoiDiem('abc') === null && docThoiDiem('') === null && docThoiDiem({}) === null);
  ok('giaiMaVach dùng ma-vach.ts', giaiMaVach(nhanCan(101, 520))?.maCan === '101' && giaiMaVach(nhanCan(101, 520))?.soKg === 0.52
     && giaiMaVach('123') === null);
  ok('laNhanCan: EAN-13 đầu "2" hợp lệ', laNhanCan(nhanCan(5, 100)) && !laNhanCan('8934567890123') && !laNhanCan(undefined));
  ok('gopTrungMa giữ bản sau', gopTrungMa([{ ma_hd: 'a', n: 1 }, { ma_hd: 'b' }, { ma_hd: 'a', n: 2 }])
     .map(h => h.ma_hd + (h.n ?? '')).join() === 'b,a2');
  ok('chiaLo 450 → 200 + 200 + 50', chiaLo(Array.from({ length: 450 }), 200).map(l => l.length).join() === '200,200,50');
  ok('timMangHoaDon: data.items', timMangHoaDon({ data: { items: [1, 2] } })?.length === 2);
  ok('conTrangSau: has_more / total_page / trang đầy',
     conTrangSau({ has_more: true }, 1, 3) === true && conTrangSau({ has_more: false }, 1, 100) === false
     && conTrangSau({ data: { total_page: 3 } }, 2, 5) === true && conTrangSau({ total_page: 3 }, 3, 5) === false
     && conTrangSau([], 1, TRUONG_IPOS.phanTrang.coTrang) === true && conTrangSau([], 1, 7) === false);
  ok('gioThamSo mặc định: giờ VN "YYYY-MM-DD HH:mm:ss"', gioThamSo('2026-09-25T16:50:00Z') === '2026-09-25 23:50:00');

  const url = taoUrlHoaDon({
    api_url: 'https://apitest.foodbook.vn/ipos/ws/xpartner/', duong_dan_hoa_don: 'sales',
    pos_parent: 'SPOLHCM4', pos_id: '5898', tu_luc: '2026-09-25T03:00:00Z', den_luc: '2026-09-25T04:00:00Z',
  }, TOKEN_GIA, 2);
  const u = new URL(url);
  ok('URL: api_url + đường dẫn, đủ tham số theo TRUONG_IPOS', u.pathname === '/ipos/ws/xpartner/sales'
     && u.searchParams.get(TEN_TS) === TOKEN_GIA && u.searchParams.get('pos_parent') === 'SPOLHCM4'
     && u.searchParams.get('pos_id') === '5898' && u.searchParams.get('from') === '2026-09-25 10:00:00'
     && u.searchParams.get('page') === '2' && u.searchParams.get('limit') === String(TRUONG_IPOS.phanTrang.coTrang), url.replace(TOKEN_GIA, '***'));

  const x1 = xoaToken(`GET ${url} failed`, TOKEN_GIA);
  ok('xoaToken: bỏ token khỏi URL', !x1.includes(TOKEN_GIA) && x1.includes(`${TEN_TS}=***`), x1);
  const x2 = xoaToken(`lỗi ${TEN_TS}=${'Q'.repeat(30)}&pos_id=1; token: "abcdefgh1234"`);
  ok('xoaToken: không biết token vẫn xóa mọi "access_token=…" / "token: …"', !/Q{30}|abcdefgh1234/.test(x2), x2);
  ok('xoaToken: token dạng mã hóa URL', !xoaToken(encodeURIComponent('a+b/c=d' + TOKEN_GIA), 'a+b/c=d' + TOKEN_GIA).includes(TOKEN_GIA));
  ok('cauTomTat dễ đọc', /3 hóa đơn.*2 dòng đã trừ kho.*1 dòng chờ xử lý/.test(cauTomTat(3,
    { hd_moi: 3, hd_trung: 0, hd_sua: 0, hd_huy: 0, hd_loi: 0, so_dong: 3, dong: { da_ghi: 2, thieu_hang: 1 } })));

  const nguon = readFileSync(join(GOC, 'web/src/lib/kho/ipos.ts'), 'utf8');
  const nhap = [...nguon.matchAll(/^import .* from '([^']+)'/gm)].map(m => m[1]);
  ok('ipos.ts thuần: chỉ import ma-vach.ts', nhap.join() === './ma-vach.ts', nhap.join());
  ok('Mọi giả định nằm trong TRUONG_IPOS có ghi "CHỈNH KHI CÓ TÀI LIỆU"', /CHỈNH KHI CÓ TÀI LIỆU[\s\S]{0,200}export const TRUONG_IPOS/.test(nguon));
});

// ===========================================================================
// Client Supabase GIẢ trên PGlite: rpc(tên, {p_…}) → select tên(p_… => $n)
// dưới danh nghĩa một người. Ghi lại mọi lời gọi để kiểm.
const { db, cnA, cnB, duoi } = await dungDatabase();
function clientGia(uid, { matKhauDung = ENV.KHO_IPOS_MAT_KHAU } = {}) {
  const goi = [];
  let dangNhap = uid;
  return {
    goi,
    rpc: async (ten, thamSo = {}) => {
      goi.push({ ten, thamSo: structuredClone(thamSo) });
      const k = Object.keys(thamSo);
      const r = await duoi(dangNhap, `select ${ten}(${k.map((x, i) => `${x} => $${i + 1}`).join(', ')}) as kq`,
        k.map(x => (thamSo[x] !== null && typeof thamSo[x] === 'object') ? JSON.stringify(thamSo[x]) : thamSo[x]));
      return r.loi ? { data: null, error: { message: r.loi } } : { data: r.rows[0].kq, error: null };
    },
    auth: {
      signInWithPassword: async ({ password }) => password === matKhauDung
        ? { data: { session: { access_token: 'x' } }, error: null }
        : (dangNhap = null, { data: { session: null }, error: { message: 'Invalid login credentials' } }),
      signOut: async () => { goi.push({ ten: 'signOut' }); return { error: null }; },
    },
  };
}
/** fetch giả: trả JSON theo trang, ghi lại URL. */
function fetchGia(trangTheoSo) {
  const url = [];
  const f = async u => {
    url.push(String(u));
    const trang = Number(new URL(String(u)).searchParams.get('page'));
    const body = trangTheoSo[trang] ?? { data: [], has_more: false };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  f.url = url;
  return f;
}
const MAY = UID_MAY_IPOS.mayIposA;
let viTriQuay;
const LUC_BAN = new Date(Date.now() - 20 * 60000).toISOString();
const hdTrang = (ma, n) => Array.from({ length: n }, (_, i) => ({
  tran_id: `${ma}-${i}`, tran_date: LUC_BAN,
  sale_detail: [{ detail_id: 1, item_id: 'M1', barcode: nhanCan(101, 500 + i), quantity: 1, amount: 100000 }],
}));

await nhom('3 · dongBoIpos: MỘT LƯỢT TRỌN VẸN TRÊN DATABASE THẬT (PGlite)', async () => {
  await themMayIpos(db, cnA, cnB);
  await duoi(UID.qlA, `select kho_khoi_tao($1)`, [cnA.id]);
  viTriQuay = (await db.query(`select id from kho_vi_tri where chi_nhanh_id = $1 and loai = 'quay'`, [cnA.id])).rows[0].id;

  const chuaCai = clientGia(MAY);
  const k0 = await dongBoIpos({ supabase: chuaCai, chiNhanhId: cnA.id, nguon: 'cron', env: {}, fetchFn: fetchGia({}) });
  ok('Thiếu IPOS_ACCESS_TOKEN → tắt êm, nói rõ, KHÔNG gọi database', k0.ok === false && k0.chuaCai === true
     && /IPOS_ACCESS_TOKEN/.test(k0.cau) && chuaCai.goi.length === 0, JSON.stringify(k0));
  ok('trangThaiBiMatIpos chỉ trả có / không', JSON.stringify(await trangThaiBiMatIpos(ENV)) === '{"token":true,"taiKhoanMay":true}'
     && !(JSON.stringify(await layBiMatIpos({})).includes('IPOS')));

  const chuaBat = await dongBoIpos({ supabase: clientGia(MAY), chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: fetchGia({}) });
  ok('Chưa bật ở chi nhánh → tuChoi (không phải lỗi)', chuaBat.tuChoi === true && /chưa bật/.test(chuaBat.cau), JSON.stringify(chuaBat));

  const luu = await duoi(UID.chu, `select kho_ipos_luu_cau_hinh($1, $2::jsonb) as v`, [cnA.id, JSON.stringify({
    bat: true, pos_parent: 'SPOLHCM4', pos_id: '5898', duong_dan_hoa_don: '/hoa-don', vi_tri_ban_id: viTriQuay })]);
  ok('Chủ bật kết nối iPOS chi nhánh A', luu.loi === null && luu.rows[0].v.cau_hinh_du === true, luu.loi ?? '');

  // 3 trang: 100 + 100 + 30 HĐ, trang 2 lặp lại 1 HĐ của trang 1.
  const t2 = hdTrang('B', 100); t2[0] = hdTrang('A', 1)[0];
  const f = fetchGia({ 1: { data: hdTrang('A', 100) }, 2: { data: t2 }, 3: { data: [...hdTrang('C', 30), ...FIX_A.data] } });
  const may = clientGia(MAY);
  const k1 = await dongBoIpos({ supabase: may, chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: f });
  ok('Máy chạy được lượt: ok, 231 HĐ khác mã', k1.ok === true && k1.soHd === 231, JSON.stringify(k1).slice(0, 300));
  ok('Đọc đủ 3 trang rồi dừng (trang cuối không đầy)', f.url.length === 3, String(f.url.length));
  const nhan = may.goi.filter(g => g.ten === 'kho_ipos_nhan');
  ok('Chia 2 lô ≤ 200 HĐ; chỉ lô CUỐI mang p_den_luc', nhan.length === 2 && nhan[0].thamSo.p_hoa_don.length === 200
     && nhan[1].thamSo.p_hoa_don.length === 31 && nhan[0].thamSo.p_den_luc === null && !!nhan[1].thamSo.p_den_luc);
  ok('Thứ tự: bat_dau → nhan → nhan → ket_thuc(null)', may.goi.map(g => g.ten).join() ===
     'kho_ipos_bat_dau,kho_ipos_nhan,kho_ipos_nhan,kho_ipos_ket_thuc' && may.goi[3].thamSo.p_loi === null);
  const { rows: [dem] } = await db.query(`select (select count(*)::int from kho_ipos_hoa_don where chi_nhanh_id = $1) as hd,
      (select count(*)::int from kho_ipos_dong where chi_nhanh_id = $1) as dong,
      (select count(*)::int from kho_ipos_dong where chi_nhanh_id = $1 and trang_thai = 'cho') as cho`, [cnA.id]);
  ok('Database có 231 HĐ; dòng "chờ" vì chưa chuyển nguồn số bán', dem.hd === 231 && dem.dong === dem.cho && dem.dong === 231,
     JSON.stringify(dem));
  const { rows: [cf] } = await db.query(`select * from kho_ipos_cau_hinh where chi_nhanh_id = $1`, [cnA.id]);
  ok('Watermark tiến, khóa lượt nhả, không lỗi', cf.dong_bo_den_luc !== null && cf.dang_chay_tu === null && cf.lan_cuoi_loi === null);
  const { rows: [hd1] } = await db.query(`select raw::text as r from kho_ipos_hoa_don where ma_hd = 'HD001'`);
  ok('raw lưu database không có số điện thoại khách', hd1 && !hd1.r.includes('0901234567'));
  ok('URL gọi iPOS mang token (chỉ trong lời gọi fetch)', f.url.every(u => u.includes(TOKEN_GIA)));

  // Lượt 2 (chạy lại ngay): trùng HĐ → không ghi thêm.
  const k2 = await dongBoIpos({ supabase: clientGia(MAY), chiNhanhId: cnA.id, nguon: 'cron', env: ENV,
    fetchFn: fetchGia({ 1: { data: hdTrang('A', 5), has_more: false } }) });
  ok('Gửi lại HĐ cũ → hd_trung, không HĐ mới', k2.ok && k2.tomTat.hd_trung === 5 && k2.tomTat.hd_moi === 0, JSON.stringify(k2.tomTat));

  // Vượt số trang tối đa → không tiến watermark, ghi lý do.
  const vo = {};
  for (let i = 1; i <= TRUONG_IPOS.phanTrang.toiDaTrang + 1; i++) vo[i] = { data: hdTrang(`D${i}`, 1), has_more: true };
  const den0 = (await db.query(`select dong_bo_den_luc from kho_ipos_cau_hinh where chi_nhanh_id = $1`, [cnA.id])).rows[0].dong_bo_den_luc;
  const may3 = clientGia(MAY);
  const k3 = await dongBoIpos({ supabase: may3, chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: fetchGia(vo) });
  const den1 = (await db.query(`select dong_bo_den_luc from kho_ipos_cau_hinh where chi_nhanh_id = $1`, [cnA.id])).rows[0].dong_bo_den_luc;
  ok('Còn trang sau khi hết số trang tối đa → ok=false, watermark đứng yên',
     k3.ok === false && /trang/.test(k3.cau) && +den0 === +den1
     && may3.goi.find(g => g.ten === 'kho_ipos_nhan').thamSo.p_den_luc === null, k3.cau);
});

// ===========================================================================
await nhom('4 · CÂU LỖI KHÔNG BAO GIỜ CHỨA TOKEN', async () => {
  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '5 minutes'`);
  const nem = async u => { throw new Error(`fetch failed: GET ${u} (connect ECONNREFUSED)`); };
  const may = clientGia(MAY);
  const k = await dongBoIpos({ supabase: may, chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: nem });
  const loiGui = may.goi.find(g => g.ten === 'kho_ipos_ket_thuc')?.thamSo.p_loi ?? '';
  ok('fetch ném lỗi có URL chứa token → câu trả về đã xóa token', k.ok === false && !k.cau.includes(TOKEN_GIA)
     && k.cau.includes(`${TEN_TS}=***`), k.cau);
  ok('Câu gửi kho_ipos_ket_thuc cũng đã xóa token (≤ 300 ký tự)', loiGui && !loiGui.includes(TOKEN_GIA) && loiGui.length <= 300, loiGui);
  const { rows: [lan] } = await db.query(`select loi from kho_ipos_lan_chay where chi_nhanh_id = $1 order by bat_dau_luc desc limit 1`, [cnA.id]);
  const { rows: [cf] } = await db.query(`select lan_cuoi_loi, dang_chay_tu from kho_ipos_cau_hinh where chi_nhanh_id = $1`, [cnA.id]);
  ok('Nhật ký + cấu hình: có lỗi, không token, khóa lượt đã nhả', lan.loi && !lan.loi.includes(TOKEN_GIA)
     && cf.lan_cuoi_loi && !cf.lan_cuoi_loi.includes(TOKEN_GIA) && cf.dang_chay_tu === null, lan.loi);

  const http = async () => new Response('Unauthorized', { status: 401 });
  const k401 = await dongBoIpos({ supabase: clientGia(MAY), chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: http });
  ok('HTTP 401 → "iPOS trả lỗi HTTP 401", không URL', /HTTP 401/.test(k401.cau) && !k401.cau.includes('http'), k401.cau);
  const khongJson = async () => new Response('<html>', { status: 200 });
  const kj = await dongBoIpos({ supabase: clientGia(MAY), chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: khongJson });
  ok('Trả HTML → "không phải JSON"', /không phải JSON/.test(kj.cau), kj.cau);

  // Lỗi database có chữ token (giả) cũng bị xóa.
  const clientLoi = { rpc: async () => ({ data: null, error: { message: `boom ${TEN_TS}=${TOKEN_GIA}` } }) };
  const kd = await dongBoIpos({ supabase: clientLoi, chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn: http });
  ok('Lỗi database lỡ chứa token → cũng bị xóa', !kd.cau.includes(TOKEN_GIA), kd.cau);

  const nv = await dongBoIpos({ supabase: clientGia(UID.nvQuayA), chiNhanhId: cnA.id, nguon: 'tay', env: ENV, fetchFn: fetchGia({}) });
  ok('NV quầy bấm "Cập nhật ngay" → database từ chối', nv.ok === false && /không đồng bộ được/.test(nv.cau), nv.cau);
  const mayB = await dongBoIpos({ supabase: clientGia(UID_MAY_IPOS.mayIposB), chiNhanhId: cnA.id, nguon: 'cron', env: ENV, fetchFn: fetchGia({}) });
  ok('Máy chi nhánh B không đồng bộ chi nhánh A', mayB.ok === false && !mayB.tuChoi, mayB.cau);
});

// ===========================================================================
await nhom('5 · dongBoTatCa (CRON): ĐĂNG NHẬP MÁY → CHI NHÁNH CỦA MÁY → ĐĂNG XUẤT', async () => {
  await db.query(`update kho_ipos_lan_chay set bat_dau_luc = bat_dau_luc - interval '5 minutes'`);
  await db.query(`update kho_ipos_cau_hinh set dang_chay_tu = null, lan_dang_chay = null`);
  const log0 = await dongBoTatCa({}, { taoClient: () => clientGia(MAY), ghiLog: () => {} });
  ok('Thiếu bí mật → 1 dòng log "chưa cài", không làm gì', log0.length === 1 && /chưa cài/.test(log0[0]), log0.join());

  const sai = clientGia(MAY, { matKhauDung: 'khac' });
  const log1 = await dongBoTatCa(ENV, { taoClient: () => sai, ghiLog: () => {} });
  ok('Sai mật khẩu máy → log lỗi, không gọi RPC nào', /không đăng nhập được/.test(log1.join()) && sai.goi.length === 0, log1.join());

  const c = clientGia(MAY);
  const log2 = await dongBoTatCa(ENV, { taoClient: () => c, fetchFn: fetchGia({ 1: { data: hdTrang('E', 2) } }), ghiLog: () => {} });
  ok('Máy A: hỏi kho_cn_duoc(dong_bo_ban) → chỉ chi nhánh A → 1 lượt → đăng xuất',
     c.goi[0].ten === 'kho_cn_duoc' && c.goi[0].thamSo.p_viec === 'dong_bo_ban'
     && c.goi.filter(g => g.ten === 'kho_ipos_bat_dau').length === 1
     && c.goi.find(g => g.ten === 'kho_ipos_bat_dau').thamSo.p_chi_nhanh_id === cnA.id
     && c.goi.at(-1).ten === 'signOut', c.goi.map(g => g.ten).join());
  ok('Log có kết quả lượt, không token', /Đã cập nhật: 2 hóa đơn/.test(log2.join()) && !log2.join().includes(TOKEN_GIA), log2.join());

  const cB = clientGia(UID_MAY_IPOS.mayIposB);
  const log3 = await dongBoTatCa(ENV, { taoClient: () => cB, fetchFn: fetchGia({}), ghiLog: () => {} });
  ok('Máy B: chi nhánh B chưa bật → im lặng (không log lượt)', log3.length === 0
     && cB.goi.find(g => g.ten === 'kho_ipos_bat_dau')?.thamSo.p_chi_nhanh_id === cnB.id, log3.join());
  const { rows: [{ n }] } = await db.query(`select count(*)::int as n from kho_doi_soat_ton()`);
  ok('Đối soát tồn rỗng', n === 0);
});

// ===========================================================================
await nhom('6 · WORKER, WRANGLER, KHÔNG TOKEN TRONG REPO', async () => {
  const w = readFileSync(join(GOC, 'web/src/worker.ts'), 'utf8');
  ok('src/worker.ts: fetch = handle của adapter + scheduled gọi dongBoTatCa qua waitUntil',
     /from '@astrojs\/cloudflare\/handler'/.test(w) && /fetch:\s*handle/.test(w)
     && /async scheduled\([^)]*\)\s*\{[\s\S]*waitUntil\(dongBoTatCa\(env\)\)/.test(w));
  const t = readFileSync(join(GOC, 'web/wrangler.toml'), 'utf8');
  ok('wrangler.toml: main = src/worker.ts, crons 5 phút, giữ workers_dev / preview_urls = false',
     /^main = "\.\/src\/worker\.ts"$/m.test(t) && /^\[triggers\]\s*\ncrons = \["\*\/5 \* \* \* \*"\]/m.test(t)
     && /^workers_dev = false$/m.test(t) && /^preview_urls = false$/m.test(t));
  ok('wrangler.toml không có [vars] (bí mật không đặt ở đây)', !/^\[vars\]/m.test(t));
  const wj = join(GOC, 'web/dist/server/wrangler.json');
  if (existsSync(wj)) {
    const j = JSON.parse(readFileSync(wj, 'utf8'));
    ok('Bản build (dist/server/wrangler.json) có triggers.crons', Array.isArray(j.triggers?.crons) && j.triggers.crons.length > 0,
       JSON.stringify(j.triggers));
    const e = join(GOC, 'web/dist/server', j.main ?? 'entry.mjs');
    ok('Bản build xuất scheduled', existsSync(e) && /scheduled\s*\(/.test(readFileSync(e, 'utf8')));
  } else {
    console.log('  (chưa build web — bỏ qua kiểm dist/server/wrangler.json)');
  }

  // Quét mọi file git theo dõi + file mới chưa bị .gitignore chặn.
  const ds = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: GOC, encoding: 'utf8' })
    .split('\n').filter(f => f && !f.includes('node_modules/') && existsSync(join(GOC, f)));
  const giongToken = new RegExp(`${TEN_TS}=[A-Za-z0-9._~%+/-]{16,}`);
  const ganBiMat = new RegExp(`IPOS_${'ACCESS'}_TOKEN\\s*=\\s*["']?[^\\s"'$<{]+`);
  const tim = [];
  for (const f of ds) {
    let s;
    try { s = readFileSync(join(GOC, f), 'utf8'); } catch { continue; }
    if (s.includes('\u0000')) continue;
    if (giongToken.test(s) || ganBiMat.test(s) || s.includes(TOKEN_GIA)) tim.push(f);
  }
  ok(`Không file nào (${ds.length} file) chứa chuỗi giống token iPOS`, tim.length === 0 && ds.length > 50, tim.join(', '));
  const env = join(GOC, 'web/.env.example');
  ok('.env.example không nhắc tới token iPOS', !existsSync(env) || !/IPOS_ACCESS_TOKEN\s*=/.test(readFileSync(env, 'utf8')));
});

process.exit(ketThuc('ĐỒNG BỘ iPOS (PHẦN WEB)'));
