/**
 * BEEFTOWN — MINI APP ZALO: ĐƯỜNG CÒN HÀNG CỦA WEBSITE
 * ===================================================
 *
 *     node test/test-mini-app-con-hang-web.mjs
 *
 * web/src/lib/mini-app.ts (docConHangMiniApp) và web/src/pages/mini-app/con-hang.json.ts. Bất biến:
 *
 *   1. Gọi đúng mini_app_con_hang với p_chi_nhanh_ma của trang (PUBLIC_CHI_NHANH, mặc định q1).
 *   2. Database chưa nối, lỗi, ném lỗi, hết giờ, dữ liệu không phải mảng → {} ("không biết"). KHÔNG BAO GIỜ
 *      tự ra 'het': Mini App hiện mọi phần như cũ thay vì báo tạm hết một khay còn ở quầy.
 *   3. Dòng lạ (mã có chữ hoa, dấu, thẻ HTML; trạng thái ngoài con / sap_het / het) bị bỏ.
 *   4. Đường JSON: cho mọi nơi đọc (Mini App chạy trên tên miền Zalo), lưu đệm 60 giây, không cookie.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { docConHangMiniApp } from '../../web/src/lib/mini-app.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — MINI APP ZALO: ĐƯỜNG CÒN HÀNG CỦA WEBSITE');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Client giả: ghi lại lần gọi, trả kq (hoặc ném nếu kq là Error, hoặc treo nếu kq là 'treo'). */
function clientGia(kq) {
  const goi = [];
  return {
    goi,
    rpc: async (ten, thamSo) => {
      goi.push({ ten, thamSo });
      if (kq instanceof Error) throw kq;
      return kq;
    },
  };
}

// Câu lỗi console.error của thư viện không làm rối kết quả kiểm thử.
const consoleLoi = console.error;
console.error = () => {};

// ===========================================================================
await nhom('1 · GỌI ĐÚNG HÀM, ĐÚNG CHI NHÁNH', async () => {
  const c = clientGia({ data: [
    { ma: 'ribeye-with-cap', trang_thai: 'con' },
    { ma: 'outside-skirt', trang_thai: 'sap_het' },
    { ma: 'la-galbi', trang_thai: 'het' },
  ], error: null });
  const kq = await docConHangMiniApp(c);
  ok('Gọi mini_app_con_hang một lần với p_chi_nhanh_ma = "q1" (mặc định khi chưa đặt PUBLIC_CHI_NHANH)',
     c.goi.length === 1 && c.goi[0].ten === 'mini_app_con_hang' && c.goi[0].thamSo?.p_chi_nhanh_ma === 'q1',
     JSON.stringify(c.goi));
  ok('Trả đúng trạng thái từng phần thịt',
     JSON.stringify(kq) === JSON.stringify({ 'ribeye-with-cap': 'con', 'outside-skirt': 'sap_het', 'la-galbi': 'het' }),
     JSON.stringify(kq));
});

// ===========================================================================
await nhom('2 · HỎNG THÌ "KHÔNG BIẾT", KHÔNG BAO GIỜ "HẾT"', async () => {
  const rong = kq => JSON.stringify(kq) === '{}';
  ok('Database chưa nối (client null) → {}', rong(await docConHangMiniApp(null)));
  ok('Hàm chưa có (migration chưa chạy, PGRST202) → {}',
     rong(await docConHangMiniApp(clientGia({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } }))));
  ok('Database trả 500 → {}',
     rong(await docConHangMiniApp(clientGia({ data: null, error: { code: '500', message: 'Internal Server Error' } }))));
  ok('Mất mạng (fetch ném lỗi) → {}', rong(await docConHangMiniApp(clientGia(new TypeError('fetch failed')))));
  ok('Hết giờ (AbortError) → {}',
     rong(await docConHangMiniApp(clientGia(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })))));
  ok('Dữ liệu không phải mảng → {}', rong(await docConHangMiniApp(clientGia({ data: { ma: 'x' }, error: null }))));
  ok('Công tắc tắt (hàm trả mảng rỗng) → {}', rong(await docConHangMiniApp(clientGia({ data: [], error: null }))));
});

// ===========================================================================
await nhom('3 · DÒNG LẠ BỊ BỎ', async () => {
  const kq = await docConHangMiniApp(clientGia({ data: [
    { ma: 'Ribeye', trang_thai: 'con' },
    { ma: '<b>x</b>', trang_thai: 'het' },
    { ma: 'galbisal', trang_thai: 'het_han' },
    { ma: 'top-blade', trang_thai: 3 },
    { ma: 'chadolbagi', trang_thai: 'sap_het' },
    null,
  ], error: null }));
  ok('Chỉ giữ dòng có mã thường-số-gạch và trạng thái con / sap_het / het',
     JSON.stringify(kq) === JSON.stringify({ chadolbagi: 'sap_het' }), JSON.stringify(kq));
});

// ===========================================================================
await nhom('4 · ĐƯỜNG /mini-app/con-hang.json', async () => {
  const ma = readFileSync(join(GOC, 'web', 'src', 'pages', 'mini-app', 'con-hang.json.ts'), 'utf8');
  ok('Chỉ có GET, gọi docConHangMiniApp, trả { phanThit }',
     /export const GET\b/.test(ma) && !/export const (POST|PUT|DELETE|PATCH)\b/.test(ma)
     && /docConHangMiniApp\(\)/.test(ma) && /JSON\.stringify\(\{ phanThit \}\)/.test(ma));
  ok('Cho mọi nơi đọc (Access-Control-Allow-Origin: *), không gửi kèm cookie',
     /'Access-Control-Allow-Origin': '\*'/.test(ma) && !/Allow-Credentials/.test(ma) && !/cookies/.test(ma));
  ok('Lưu đệm công khai 60 giây', /'Cache-Control': 'public, max-age=60'/.test(ma));
});

console.error = consoleLoi;
process.exit(ketThuc('ĐƯỜNG CÒN HÀNG'));
