/**
 * BEEFTOWN KHO — TRANG CÓ TRUYỀN NGÔN NGỮ CHO THƯ VIỆN KHÔNG?
 * ==========================================================
 * Bộ quét chữ Việt (quet-chu-viet.mjs) chỉ thấy chữ viết NGAY trong file. Thư
 * viện đã có bản tiếng Anh mà trang quên truyền `nn` thì màn tiếng Anh vẫn hiện
 * tiếng Việt — lỗi đó nằm ở chỗ gọi. File này tìm hai kiểu sót:
 *
 *   1. Gọi một hàm thư viện kho có tham số `nn: NgonNguNB` mà không truyền gì
 *      mang ngôn ngữ (nn, k.nn, nnCua(…)) — hoặc chữ 'vi' viết rõ khi CỐ Ý muốn
 *      tiếng Việt (vd file cho phần mềm khác).
 *   2. Dùng bảng nhãn tên cũ chỉ có tiếng Việt (X) trong khi thư viện đã có bản
 *      hai thứ tiếng X_NB.
 *
 * Chỉ kiểm trang / component / khung — bên trong thư viện gọi nhau với mặc định
 * tiếng Việt là bình thường (vd laViec() chỉ cần mức độ).
 *
 *     node test/kiem-nn.mjs <file trong web/src>…
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// KIEM_WEB: chạy từ nơi khác (vd một worktree) thì chỉ thư mục web/src cần kiểm.
const WEB = process.env.KIEM_WEB || join(__dirname, '..', '..', 'web', 'src');
const LIB = join(WEB, 'lib', 'kho');

/** Vị trí ngay sau dấu ) khớp với dấu ( ở i (bỏ qua chuỗi, template). -1 nếu không khớp. */
function hetNgoac(s, i) {
  let sau = 0;
  for (let k = i; k < s.length; k++) {
    const c = s[k];
    if (c === "'" || c === '"' || c === '`') {
      const q = c;
      for (k++; k < s.length && s[k] !== q; k++) {
        if (s[k] === '\\') k++;
        else if (q === '`' && s[k] === '$' && s[k + 1] === '{') {
          let d = 0;
          for (k += 2; k < s.length; k++) { if (s[k] === '{') d++; else if (s[k] === '}') { if (d === 0) break; d--; } }
        }
      }
      continue;
    }
    if (c === '(') sau++;
    else if (c === ')') { sau--; if (sau === 0) return k + 1; }
  }
  return -1;
}

/** Tên các hàm export có tham số nn: NgonNguNB, và các bảng tên cũ có bản _NB, trong lib/kho. */
export function docThuVien() {
  const ham = new Set();
  const bangCu = new Set();
  for (const f of readdirSync(LIB).filter(f => f.endsWith('.ts'))) {
    const s = readFileSync(join(LIB, f), 'utf8');
    for (const m of s.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*(?:<[^>]*>)?\s*\(/g)) {
      const dau = m.index + m[0].length - 1;
      const het = hetNgoac(s, dau);
      if (het > 0 && /\bnn\s*:\s*NgonNguNB\b/.test(s.slice(dau, het))) ham.add(m[1]);
    }
    const ten = new Set([...s.matchAll(/export\s+const\s+(\w+)\b/g)].map(m => m[1]));
    for (const t of ten) if (ten.has(`${t}_NB`)) bangCu.add(t);
  }
  return { ham, bangCu };
}

const CO_NN = /\bnn\b|nnCua\(|'vi'|"vi"/;

/** Các chỗ sót trong một file: [[số dòng, mô tả], …]. */
export function kiemNn(nguon, thuVien = docThuVien()) {
  // Bỏ chú thích (giữ dòng) để không bắt nhầm tên hàm nhắc trong chú thích.
  const s = nguon
    .replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '))
    .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`])\/\/[^\n]*/g, (m, a) => a + ' '.repeat(m.length - a.length));
  const dong = i => s.slice(0, i).split('\n').length;
  const ra = [];
  for (const ten of thuVien.ham) {
    const re = new RegExp(`(?<![\\w.$])${ten}\\s*\\(`, 'g');
    for (const m of s.matchAll(re)) {
      if (/\b(function|import)\s+[\w{},\s]*$/.test(s.slice(Math.max(0, m.index - 40), m.index))) continue;
      const dau = m.index + m[0].length - 1;
      const het = hetNgoac(s, dau);
      if (het < 0) continue;
      if (!CO_NN.test(s.slice(dau, het))) ra.push([dong(m.index), `${ten}(…) không truyền nn`]);
    }
  }
  for (const ten of thuVien.bangCu) {
    const re = new RegExp(`(?<![\\w.$])${ten}(?![\\w$])`, 'g');
    for (const m of s.matchAll(re)) {
      // Dòng import không tính — chỉ tính chỗ dùng.
      const dauDong = s.lastIndexOf('\n', m.index) + 1;
      const cuoiDong = s.indexOf('\n', m.index);
      const cauLenh = s.slice(dauDong, cuoiDong < 0 ? undefined : cuoiDong);
      if (/^\s*(import\b|[\w\s,{}]*\}\s*from\s)/.test(cauLenh) || /^\s*[\w\s,]+,?\s*$/.test(cauLenh) && /import\s*\{[^}]*$/.test(s.slice(0, m.index))) continue;
      ra.push([dong(m.index), `bảng tên cũ ${ten} (dùng ${ten}_NB + nn)`]);
    }
  }
  return ra.sort((a, b) => a[0] - b[0]);
}

// --- Chạy tay ---------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const tv = docThuVien();
  let tong = 0;
  for (const f of process.argv.slice(2)) {
    const kq = kiemNn(readFileSync(f, 'utf8'), tv);
    tong += kq.length;
    for (const [n, d] of kq) console.log(`${f}:${n}: ${d}`);
  }
  console.error(`-- ${tong} chỗ sót ngôn ngữ (${tv.ham.size} hàm có nn, ${tv.bangCu.size} bảng tên cũ)`);
}
