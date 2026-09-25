/**
 * BEEFTOWN KHO — chạy mọi file test-kho-*.mjs
 * ==========================================
 *
 *     node test/chay-kho.mjs
 *
 * Tự tìm mọi file test-kho-*.mjs trong thư mục này, nên thêm một file test kho
 * mới KHÔNG phải sửa package.json (file đó dùng chung với các phiên làm việc
 * khác — càng ít người sửa càng ít xung đột khi gộp nhánh).
 *
 * Thứ tự: các file đã có từ trước chạy theo thứ tự cũ; file mới chạy sau, theo
 * tên. Dừng ngay ở file đầu tiên hỏng, giống chuỗi && cũ.
 */

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const THU_MUC = dirname(fileURLToPath(import.meta.url));
const TRUOC = ['quyen', 'nhap', 'ma-vach', 'pha-loc', 'xuat-kiem-ke', 'cong-no', 'can']
  .map(t => `test-kho-${t}.mjs`);

const co = readdirSync(THU_MUC).filter(f => /^test-kho-.+\.mjs$/.test(f));
const thuTu = [
  ...TRUOC.filter(f => co.includes(f)),
  ...co.filter(f => !TRUOC.includes(f)).sort(),
];

for (const f of thuTu) {
  const r = spawnSync(process.execPath, [join(THU_MUC, f)], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\n\x1b[31m\x1b[1mDỪNG: ${f} hỏng (mã ${r.status ?? r.signal}).\x1b[0m`);
    process.exit(r.status || 1);
  }
}
console.log(`\n\x1b[32m\x1b[1mĐÃ CHẠY ${thuTu.length} FILE TEST KHO.\x1b[0m`);
