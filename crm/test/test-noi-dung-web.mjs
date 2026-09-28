/**
 * BEEFTOWN — ĐỌC NỘI DUNG CÔNG KHAI KHI DATABASE HỎNG (web/src/lib/noi-dung.ts)
 * ============================================================================
 *
 *     node test/test-noi-dung-web.mjs
 *
 * docNoiDung() không bao giờ ném lỗi: database hỏng thì trang hiện bản nền (đúng sự
 * thật, không bịa). Nhưng trước đây nó cũng không để lại dấu vết nào — một database
 * chết trông y hệt một trang chưa công bố gì. Bất biến:
 *
 *   1. Chưa cấu hình database → bản nền, không log (đó là trạng thái bình thường).
 *   2. Database trả lỗi / mạng ném lỗi → vẫn bản nền, và ĐÚNG MỘT dòng log "[noi-dung]".
 *   3. Database trả dữ liệu → trộn vào bản nền, không log.
 */

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { docNoiDung } = await import(join(GOC, 'web', 'src', 'lib', 'noi-dung.ts'));

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN — ĐỌC NỘI DUNG CÔNG KHAI KHI DATABASE HỎNG');

/** Chạy fn, gom mọi dòng console.error trong lúc đó. */
async function ghiLog(fn) {
  const cu = console.error;
  const dong = [];
  console.error = (...a) => dong.push(a.join(' '));
  try { return { kq: await fn(), dong }; } finally { console.error = cu; }
}
const laBanNen = nd => nd && nd.dia_chi_hien_thi === null && nd.ngay_khai_truong === null;

await nhom('1 · CHƯA CẤU HÌNH DATABASE → BẢN NỀN, KHÔNG LOG', async () => {
  const { kq, dong } = await ghiLog(() => docNoiDung('vi', null));
  ok('Trả bản nền', laBanNen(kq), JSON.stringify(kq).slice(0, 120));
  ok('Không ghi log', dong.length === 0, dong.join(' | '));
});

await nhom('2 · DATABASE HỎNG → BẢN NỀN, VÀ CÓ MỘT DÒNG LOG', async () => {
  const loi = { rpc: async () => ({ data: null, error: { code: 'PGRST002', message: 'Could not query the database for the schema cache' } }) };
  let r = await ghiLog(() => docNoiDung('en', loi));
  ok('Database trả lỗi: vẫn bản nền', laBanNen(r.kq));
  ok('Database trả lỗi: đúng một dòng log [noi-dung] có mã lỗi', r.dong.length === 1 && /\[noi-dung\].*PGRST002/.test(r.dong[0]), r.dong.join(' | '));

  const nem = { rpc: async () => { throw new Error('fetch failed'); } };
  r = await ghiLog(() => docNoiDung('ko', nem));
  ok('Mạng ném lỗi: vẫn bản nền, không ném ra ngoài', laBanNen(r.kq));
  ok('Mạng ném lỗi: đúng một dòng log [noi-dung]', r.dong.length === 1 && /\[noi-dung\].*fetch failed/.test(r.dong[0]), r.dong.join(' | '));
});

await nhom('3 · DATABASE TRẢ DỮ LIỆU → TRỘN VÀO BẢN NỀN, KHÔNG LOG', async () => {
  let thamSo = null;
  const tot = { rpc: async (ham, ts) => { thamSo = { ham, ts }; return { data: { dia_chi_hien_thi: '40–42 Nguyễn Thái Học' }, error: null }; } };
  const { kq, dong } = await ghiLog(() => docNoiDung('en', tot));
  ok('Gọi đúng hàm noi_dung_cong_khai với ngôn ngữ', thamSo?.ham === 'noi_dung_cong_khai' && thamSo?.ts?.p_ngon_ngu === 'en', JSON.stringify(thamSo));
  ok('Có địa chỉ từ database, các khóa khác vẫn là bản nền', kq.dia_chi_hien_thi === '40–42 Nguyễn Thái Học' && kq.ngay_khai_truong === null);
  ok('Không ghi log', dong.length === 0, dong.join(' | '));
});

process.exit(ketThuc('ĐỌC NỘI DUNG CÔNG KHAI'));
