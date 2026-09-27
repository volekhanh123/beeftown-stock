/**
 * BEEFTOWN KHO — Kiểm thử web ô mã (0049)
 * ======================================
 *
 *     node test/test-kho-o-ma-web.mjs
 *
 * Hàm thuần của lib/kho/o-ma.ts (đọc / viết dải ô mã) và các trang dùng nó.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoBoDem } from './kho-chung.mjs';
import { docChuOMa, chuOMa, O_MA_TOI_DA } from '../../web/src/lib/kho/o-ma.ts';

const { ok, nhom, ketThuc } = taoBoDem('BEEFTOWN KHO — WEB Ô MÃ');
const GOC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const doc = p => readFileSync(join(GOC, p), 'utf8');

await nhom('1 · DẢI Ô MÃ DẠNG CHỮ', async () => {
  const a = docChuOMa('10011-10019');
  ok('"10011-10019" → 9 mã theo thứ tự', a.loi === null && a.ma.length === 9 && a.ma[0] === '10011' && a.ma[8] === '10019');
  ok('Viết gọn lại thành "10011-10019"', chuOMa(a.ma) === '10011-10019');
  const b = docChuOMa('10011, 10012; 10015\n010016');
  ok('Danh sách lẻ, bỏ số 0 đầu', b.loi === null && b.ma.join() === '10011,10012,10015,10016');
  ok('Viết gọn: hai số liền giữ dạng liệt kê', chuOMa(b.ma) === '10011, 10012, 10015, 10016');
  ok('Ba số liền trở lên thành dải', chuOMa(['1', '2', '3', '7']) === '1-3, 7');
  ok('Nhận "–" và ".."', docChuOMa('20001–20003').ma.length === 3 && docChuOMa('20001..20002').ma.length === 2);
  ok('Trống → bỏ hết ô', docChuOMa('').ma.length === 0 && docChuOMa('  ').loi === null);
  ok('Dải ngược → lỗi', docChuOMa('10019-10011').loi !== null);
  ok('Mã trùng → lỗi', docChuOMa('10011, 10011').loi !== null);
  ok(`Quá ${O_MA_TOI_DA} ô → lỗi`, docChuOMa('10001-10040').loi !== null);
  ok('Mã 7 số → lỗi', docChuOMa('1234567').loi !== null);
  ok('Chữ lạ → lỗi có tiếng Anh', !!docChuOMa('abc').loi?.en);
});

await nhom('2 · TRANG', async () => {
  const form = doc('web/src/components/kho/FormMatHang.astro');
  ok('Form mặt hàng có ô "Ô mã"', /name="o_ma"/.test(form));
  const dm = doc('web/src/lib/kho/danh-muc.ts');
  ok('luuMatHang đọc ô mã trước khi ghi, chỉ cho phần cắt', /docChuOMa/.test(dm) && /loai !== 'phan_cat'/.test(dm));
  const pha = doc('web/src/pages/noi-bo/kho/pha-loc/[id].astro');
  ok('Phiên lóc món theo tảng có khung ô mã và nút giao', /mhVao\?\.theo_tang/.test(pha) && /value="giao_o_ma"/.test(pha));
  ok('Nút giao chỉ hiện khi đúng một tảng', /loVaoPhien\.length === 1/.test(pha));
});

process.exit(ketThuc('WEB Ô MÃ'));
