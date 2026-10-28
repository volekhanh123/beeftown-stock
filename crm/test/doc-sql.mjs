/**
 * BEEFTOWN — ĐỌC CÂU TẠO HÀM TRONG FILE MIGRATION
 * ===============================================
 * Dùng chung cho tim.mjs (tra một tên) và tom-tat-pr.mjs (tóm tắt nhánh). Đọc chữ của file SQL, không dựng
 * database: giữ nguyên văn chú thích và cách xuống dòng — đúng thứ phiên làm việc chép khi viết migration
 * thay thân ("chép bản cuối nguyên văn rồi vá").
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Số dòng (đếm từ 1) của vị trí i trong chuỗi s. */
export function soDong(s, i) {
  let n = 1;
  for (let k = s.indexOf('\n'); k >= 0 && k < i; k = s.indexOf('\n', k + 1)) n++;
  return n;
}

/** Vị trí i nằm sau dấu -- trên cùng dòng (câu trong chú thích, không phải lệnh). */
export function trongChuThich(s, i) {
  return s.slice(s.lastIndexOf('\n', i - 1) + 1, i).includes('--');
}

export const thoat = ten => ten.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Mọi câu `create [or replace] function` trong s, theo thứ tự. Mỗi câu cắt tới dấu ; sau thẻ đóng của thân
 * ($$ … $$, $f$ … $f$ — thẻ lồng bên trong khác tên nên không cắt nhầm). language, security definer,
 * set search_path đứng trước hay sau thân đều đọc được.
 */
export function cacCauHam(s) {
  const ra = [];
  const re = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?"?([a-z_0-9]+)"?\s*\(/gi;
  for (const m of s.matchAll(re)) {
    if (trongChuThich(s, m.index)) continue;
    const mo = /\$([a-z_]*)\$/gi;
    mo.lastIndex = m.index;
    const t = mo.exec(s);
    if (!t) continue;
    const dong = s.indexOf(t[0], t.index + t[0].length);
    if (dong < 0) continue;
    const cham = s.indexOf(';', dong + t[0].length);
    const het = cham < 0 ? s.length : cham + 1;
    const dau = s.slice(m.index, t.index);
    const vo = dau + ' ' + s.slice(dong + t[0].length, het);
    const cau = s.slice(m.index, het);
    ra.push({
      ten: m[1].toLowerCase(),
      viTri: m.index,
      cau,
      thamSo: dau.slice(dau.indexOf('(')).replace(/\s+/g, ' ').replace(/\)\s*returns[\s\S]*$/i, ')').trim(),
      definer: /security\s+definer/i.test(vo),
      searchPath: /set\s+search_path/i.test(vo),
      ngonNgu: vo.match(/language\s+(\w+)/i)?.[1]?.toLowerCase() ?? '?',
      raise: [...cau.matchAll(/raise\s+exception\s+'((?:[^']|'')*)'/gi)].map(r => r[1].replace(/''/g, "'")),
    });
  }
  return ra;
}

/** Bản cuối của từng hàm trong một chuỗi migration đã nối theo thứ tự số: Map tên → câu tạo. */
export function banCuoiTheoTen(s) {
  const ra = new Map();
  for (const h of cacCauHam(s)) ra.set(h.ten, h);
  return ra;
}

/**
 * So hai bản của một câu (theo dòng) bằng git diff --no-index.
 * @returns { them, bot, chu } — chu là diff dạng unified (rỗng khi chỉ cần đếm)
 */
export function soHaiBan(cu, moi, { inChu = false, mau = false, nhanCu = 'bản trước', nhanMoi = 'bản mới' } = {}) {
  const thu = mkdtempSync(join(tmpdir(), 'beeftown-so-'));
  try {
    const a = join(thu, nhanCu.replace(/[^\w.-]+/g, '_') || 'a');
    const b = join(thu, (nhanMoi.replace(/[^\w.-]+/g, '_') || 'b') + (nhanCu === nhanMoi ? '.moi' : ''));
    writeFileSync(a, cu.endsWith('\n') ? cu : cu + '\n');
    writeFileSync(b, moi.endsWith('\n') ? moi : moi + '\n');
    const chay = args => {
      try { return execFileSync('git', ['diff', '--no-index', ...args, a, b], { encoding: 'utf8', maxBuffer: 64 << 20 }); }
      catch (e) { return e.stdout ?? ''; }   // git diff --no-index trả mã 1 khi hai file khác nhau
    };
    const [them = '0', bot = '0'] = chay(['--numstat']).split('\t');
    return { them: Number(them) || 0, bot: Number(bot) || 0, chu: inChu ? chay([mau ? '--color=always' : '--color=never']) : '' };
  } finally {
    rmSync(thu, { recursive: true, force: true });
  }
}
