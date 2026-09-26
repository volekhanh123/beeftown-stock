/**
 * BEEFTOWN — QUÉT CHỮ VIỆT NẰM NGOÀI CẶP { vi, en }
 * ================================================
 * Giao diện nội bộ có hai thứ tiếng: câu tiếng Việt chỉ được nằm ở giá trị
 * `vi:` của một cặp { vi, en } (lib/ngon-ngu-noi-bo.ts). Hàm ở đây tìm chữ Việt
 * người dùng nhìn thấy còn nằm ngoài chỗ đó, bỏ qua chú thích (//, /* *\/,
 * {/* *\/}, <!-- -->).
 *
 * Giá trị `vi:` được đọc bằng một bộ đọc chuỗi thật (hiểu `…${ `…` }…` lồng
 * nhau), kể cả dạng hàm `vi: (n: number) => \`…\``.
 *
 *     node test/quet-chu-viet.mjs <file>…        in từng dòng còn chữ Việt
 *
 * Dùng chung cho test-noi-bo-tieng-anh.mjs (phần CRM) và test-kho-tieng-anh.mjs.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const VIET = /[ạảãàáâậầấẩẫăắằẳẵặẹẻẽèéêệềếểễịỉĩìíọỏõòóôộồốổỗơợờớởỡụủũùúưựừứửữỵỷỹỳýđĐẠẢÃÀÁÂẬẦẤẨẪĂẮẰẲẴẶẸẺẼÈÉÊỆỀẾỂỄỊỈĨÌÍỌỎÕÒÓÔỘỒỐỔỖƠỢỜỚỞỠỤỦŨÙÚƯỰỪỨỬỮỴỶỸỲÝ]/;

const trang = m => m.replace(/[^\n]/g, ' ');

/** Bỏ chú thích, giữ nguyên số dòng. */
export function boChuThich(s) {
  return s
    .replace(/<!--[\s\S]*?-->/g, trang)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, trang)
    .replace(/\/\*[\s\S]*?\*\//g, trang)
    .split('\n').map(d => d.replace(/(^|[^:'"`])\/\/(?![^'"`]*['"`]\s*[,)}\]]).*$/, '$1')).join('\n');
}

// --- Bộ đọc chuỗi JS: trả vị trí ngay SAU chuỗi bắt đầu ở j, hoặc -1 ---------
function hetChuoi(s, j) {
  const q = s[j];
  if (q === "'" || q === '"') {
    for (let k = j + 1; k < s.length; k++) {
      if (s[k] === '\\') { k++; continue; }
      if (s[k] === q) return k + 1;
      if (s[k] === '\n') return -1;
    }
    return -1;
  }
  if (q === '`') return hetMau(s, j);
  return -1;
}

function hetMau(s, j) {
  for (let k = j + 1; k < s.length; k++) {
    const c = s[k];
    if (c === '\\') { k++; continue; }
    if (c === '`') return k + 1;
    if (c === '$' && s[k + 1] === '{') {
      k = hetBieuThuc(s, k + 2);
      if (k < 0) return -1;
    }
  }
  return -1;
}

/** Trong ${ … }: trả vị trí dấu } đóng. */
function hetBieuThuc(s, k) {
  let sau = 0;
  for (; k < s.length; k++) {
    const c = s[k];
    if (c === '{') sau++;
    else if (c === '}') { if (sau === 0) return k; sau--; }
    else if (c === "'" || c === '"' || c === '`') {
      const e = hetChuoi(s, k);
      if (e < 0) return -1;
      k = e - 1;
    }
  }
  return -1;
}

/** Xóa (thay bằng khoảng trắng, giữ dòng) mọi giá trị `vi: <chuỗi>` và `vi: (…) => <chuỗi>`. */
export function boGiaTriVi(s) {
  const re = /\bvi:\s*/g;
  let ra = '', i = 0, m;
  while ((m = re.exec(s))) {
    let j = m.index + m[0].length;
    const ham = /^\((?:[^()]|\([^()]*\))*\)\s*(?::\s*[\w<>[\]| ]+\s*)?=>\s*/.exec(s.slice(j, j + 200));
    if (ham) j += ham[0].length;
    const k = hetChuoi(s, j);
    if (k < 0) continue;
    ra += s.slice(i, j) + trang(s.slice(j, k));
    i = k;
    re.lastIndex = k;
  }
  return ra + s.slice(i);
}

/**
 * Các dòng còn chữ Việt ngoài { vi, en }: [[số dòng, nội dung], …].
 * coY: chuỗi cố ý giữ (so với dữ liệu, biểu thức nhận câu database…) — xóa trước khi quét.
 */
export function quetChuViet(nguon, coY = []) {
  let s = boGiaTriVi(boChuThich(nguon));
  for (const c of coY) s = s.split(c).join('');
  return s.split('\n').map((d, i) => [i + 1, d.trim()]).filter(([, d]) => VIET.test(d));
}

// --- Chạy tay: node test/quet-chu-viet.mjs <file>… -------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let tong = 0;
  for (const f of process.argv.slice(2)) {
    const kq = quetChuViet(readFileSync(f, 'utf8'));
    tong += kq.length;
    for (const [n, d] of kq) console.log(`${f}:${n}: ${d.slice(0, 160)}`);
  }
  console.error(`-- ${tong} dòng còn chữ Việt ngoài {vi,en}`);
}
