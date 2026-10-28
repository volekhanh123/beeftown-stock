/**
 * BEEFTOWN — MÔ TẢ PR ĐỦ MỤC
 * ==========================
 *
 *     MO_TA_PR="$(cat mo-ta.md)" node test/kiem-mo-ta-pr.mjs
 *     node test/kiem-mo-ta-pr.mjs --tep mo-ta.md
 *
 * Kiểm mô tả PR theo .github/pull_request_template.md — phần MÁY kiểm được, để Khánh không phải tự soát:
 *   · "Tóm tắt cho Khánh" có đủ bốn dòng Thay đổi / Rủi ro / Cần Khánh quyết / Sau khi gộp, dòng nào cũng
 *     có chữ (chú thích <!-- --> không tính); Rủi ro ghi một trong ba mức Thấp / Vừa / Cao;
 *   · "Khánh tự thử thế nào" có chữ;
 *   · đủ 9 mục "định nghĩa xong" (MUC_XONG của test-quy-trinh.mjs), mục nào cũng có tên kiểm tra hoặc
 *     "không áp dụng vì …".
 * Không kiểm chữ có đúng không — việc đó của người rà soát và của kiểm thử.
 *
 * Workflow .github/workflows/mo-ta-pr.yml chạy file này mỗi lần mở / sửa / đẩy thêm vào PR (cả PR nháp).
 */

import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Phải trùng MUC_XONG của test-quy-trinh.mjs — kiểm thử canh (test-quy-trinh-ban-do.mjs). */
export const MUC_XONG = [
  'quyen', 'bam-hai-lan', 'gio-vn', 'chu-va-so', 'mat-mang', 'ton-kho', 'cau-chu', 'migration', 'dich-vu-ngoai',
];

/** Bốn dòng của "Tóm tắt cho Khánh", đúng chữ in đậm của mẫu PR. */
export const DONG_TOM_TAT = ['Thay đổi', 'Rủi ro', 'Cần Khánh quyết', 'Sau khi gộp'];

const boChuThich = s => s.replace(/<!--[\s\S]*?-->/g, '');
const coChu = s => s.replace(/[\s*_`:—–\-[\]x]/g, '').length > 0;

/** Phần thân của mục "## tieuDe" tới tiêu đề ## kế tiếp (hoặc thẻ <details> / </details>). */
function phanMuc(than, tieuDe) {
  const dong = than.split('\n');
  const dau = dong.findIndex(d => new RegExp(`^##\\s+${tieuDe}\\s*$`, 'i').test(d.trim()));
  if (dau < 0) return null;
  const ra = [];
  for (let i = dau + 1; i < dong.length; i++) {
    if (/^##\s/.test(dong[i]) || /^\s*<\/?details>/i.test(dong[i]) || /^\s*<summary>/i.test(dong[i])) break;
    ra.push(dong[i]);
  }
  return ra.join('\n');
}

/** @returns danh sách lỗi (chuỗi) — rỗng là đạt */
export function kiemMoTa(thanGoc) {
  const loi = [];
  const than = boChuThich((thanGoc ?? '').replace(/\r\n/g, '\n'));

  const tomTat = phanMuc(than, 'Tóm tắt cho Khánh');
  if (tomTat === null) loi.push('Thiếu mục "## Tóm tắt cho Khánh" (mẫu PR).');
  else {
    for (const nhan of DONG_TOM_TAT) {
      const d = tomTat.split('\n').find(x => new RegExp(`^\\s*[-*]\\s*\\*\\*${nhan}:?\\*\\*`).test(x));
      if (!d) { loi.push(`"Tóm tắt cho Khánh" thiếu dòng **${nhan}:**`); continue; }
      const chu = d.replace(new RegExp(`^\\s*[-*]\\s*\\*\\*${nhan}:?\\*\\*:?`), '');
      if (!coChu(chu)) loi.push(`"Tóm tắt cho Khánh": dòng **${nhan}:** chưa có chữ.`);
      else if (nhan === 'Rủi ro' && !/(^|[^\p{L}])(thấp|vừa|cao)([^\p{L}]|$)/iu.test(chu)) {
        loi.push('"Tóm tắt cho Khánh": dòng **Rủi ro:** phải ghi một trong ba mức Thấp / Vừa / Cao.');
      }
    }
  }

  const thu = phanMuc(than, 'Khánh tự thử thế nào');
  if (thu === null) loi.push('Thiếu mục "## Khánh tự thử thế nào" (ghi "Không cần thử" nếu chỉ đổi phía trong).');
  else if (!coChu(thu)) loi.push('"Khánh tự thử thế nào" chưa có chữ (ghi "Không cần thử" nếu chỉ đổi phía trong).');

  // 9 mục: dòng "- [ ] `muc` — mô tả mẫu: <chữ>" và các dòng thụt vào ngay sau nó.
  const dong = than.split('\n');
  const laDongMuc = d => /^\s*[-*]\s*\[[ xX]\]\s*`[a-z-]+`/.test(d);
  for (const muc of MUC_XONG) {
    const i = dong.findIndex(d => laDongMuc(d) && d.includes('`' + muc + '`'));
    if (i < 0) { loi.push(`Thiếu mục \`${muc}\` trong "Định nghĩa xong — 9 mục".`); continue; }
    // Chữ sau dấu ":" đầu tiên đứng sau tên mục (mẫu: "`quyen` — anon / … bị từ chối: <chữ>").
    const sauTen = dong[i].slice(dong[i].indexOf('`' + muc + '`') + muc.length + 2);
    const hai = sauTen.indexOf(':');
    let chu = hai >= 0 ? sauTen.slice(hai + 1) : '';
    // Dòng thụt vào (gạch đầu dòng con) thuộc mục này; dòng không thụt là mục kế tiếp hoặc hết danh sách.
    for (let k = i + 1; k < dong.length && !laDongMuc(dong[k]) && !/^\S/.test(dong[k]); k++) chu += '\n' + dong[k];
    if (!coChu(chu)) loi.push(`Mục \`${muc}\` chưa có tên kiểm tra hay "không áp dụng vì …".`);
  }
  return loi;
}

const laFileChinh = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (laFileChinh) {
  const i = process.argv.indexOf('--tep');
  const than = i >= 0 ? readFileSync(process.argv[i + 1], 'utf8') : (process.env.MO_TA_PR ?? '');
  const loi = kiemMoTa(than);
  const bao = loi.length
    ? `### ✗ Mô tả PR còn thiếu ${loi.length} chỗ\n\n${loi.map(l => `- ${l}`).join('\n')}\n\n`
      + 'Sửa mô tả PR theo `.github/pull_request_template.md` — kiểm lại tự chạy khi lưu mô tả.\n'
    : '### ✓ Mô tả PR đủ mục\n';
  console.log(bao);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, bao + '\n');
  process.exit(loi.length ? 1 : 0);
}
