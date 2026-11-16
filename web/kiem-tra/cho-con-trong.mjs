/**
 * CHỖ CÒN TRỐNG — không deploy khi web/src còn thông tin chờ trả lời
 * =================================================================
 *
 *     node kiem-tra/cho-con-trong.mjs                  quét web/src; còn chỗ trống thì in ra và thoát mã 1
 *     node kiem-tra/cho-con-trong.mjs --thu-muc <dir>  quét thư mục khác (kiểm thử dùng)
 *
 * Khánh giao 16/11/2026: các trang chính sách (lib/chinh-sach.ts) ghép thông tin vận hành chưa ai chốt —
 * khu vực giao, giờ giao, VAT, email… — từ lib/cho-trong.ts. Chưa trả lời thì chỗ đó giữ nguyên tên viết
 * hoa trong hai cặp ngoặc nhọn, và trang in nguyên chỗ trống ra. Lên beeftown.vn như vậy là nộp hồ sơ với
 * một trang chính sách còn trống — nên `npm run deploy` và `npm run deploy:khan-cap` chạy file này TRƯỚC
 * mọi bước khác: còn một chỗ là từ chối, in tên chỗ, file và dòng.
 *
 * VÌ SAO GẮN VÀO DEPLOY, KHÔNG VÀO `npm run quet`: CI chạy `npm run quet` ở mọi PR và trên main. Gắn vào đó
 * thì PR này đỏ cho tới khi mọi câu được trả lời, và một bước đỏ giữa chừng làm CI bỏ qua các bước kiểm
 * thử trình duyệt phía sau — người rà soát mất đúng kết quả cần xem. Cổng deploy là chỗ duy nhất trang lên
 * beeftown.vn, nên chặn ở đó là đủ và không che kiểm thử nào.
 *
 * Chỉ bắt đúng dạng chỗ trống: hai ngoặc nhọn, tên viết hoa không dấu (chữ, số, gạch dưới), hai ngoặc
 * đóng. Cú pháp của Astro như class:list={{ lien: x }} hay style={{ … }} có ngoặc nhọn đôi nhưng không phải
 * dạng đó, nên không bị bắt.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Một chỗ trống: hai ngoặc nhọn, TÊN_VIẾT_HOA, hai ngoặc đóng. */
export const MAU_CHO_TRONG = /\{\{[A-Z][A-Z0-9_]*\}\}/g;

const moiFile = d => readdirSync(d, { withFileTypes: true })
  .flatMap(x => (x.isDirectory() ? moiFile(join(d, x.name)) : x.isFile() ? [join(d, x.name)] : []));

/** Mọi chỗ trống trong một thư mục: [{ file (tương đối, dấu /), dong, cho }], theo file rồi theo dòng. */
export function timChoTrong(thuMuc) {
  const ra = [];
  for (const f of moiFile(thuMuc).sort()) {
    const chu = readFileSync(f, 'utf8');
    if (!chu.includes('{{')) continue;
    chu.split('\n').forEach((dong, i) => {
      for (const m of dong.matchAll(MAU_CHO_TRONG)) ra.push({ file: relative(thuMuc, f).split(sep).join('/'), dong: i + 1, cho: m[0] });
    });
  }
  return ra;
}

function main() {
  const i = process.argv.indexOf('--thu-muc');
  const thuMuc = i > -1 ? process.argv[i + 1] : join(WEB, 'src');
  if (!thuMuc || !statSync(thuMuc, { throwIfNoEntry: false })?.isDirectory()) {
    console.log(`Không có thư mục để quét: ${thuMuc ?? '(trống)'}`);
    process.exit(2);
  }
  const thay = timChoTrong(thuMuc);
  if (thay.length === 0) {
    console.log('\x1b[32m  ✓ Không còn chỗ trống chờ trả lời trong web/src\x1b[0m');
    return;
  }
  const ten = [...new Set(thay.map(t => t.cho))];
  console.log(`\x1b[31m\x1b[1m\nKHÔNG DEPLOY — web/src còn ${ten.length} chỗ trống chờ trả lời (${thay.length} lần):\x1b[0m`);
  for (const c of ten) {
    const noi = [...new Set(thay.filter(t => t.cho === c).map(t => `${t.file}:${t.dong}`))];
    console.log(`  ${c}  ${noi.slice(0, 3).join(', ')}${noi.length > 3 ? ` (và ${noi.length - 3} chỗ nữa)` : ''}`);
  }
  console.log('Điền câu trả lời ở web/src/lib/cho-trong.ts (đầu file có cách điền), commit, đợi CI xanh, rồi deploy.');
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
