/**
 * BEEFTOWN — CỔNG TRƯỚC KHI DEPLOY
 * ================================
 *
 *     npm run deploy              (gọi file này trước quet → build → wrangler deploy)
 *     npm run deploy:khan-cap     bỏ qua cổng — CHỈ khi khẩn cấp; in cảnh báo
 *
 * Deploy chạy trên máy ở quán, không chạy trên CI. Trước đây `npm run deploy` chỉ
 * quét chữ cấm — một commit làm hỏng kiểm thử vẫn lên được beeftown.vn (main từng
 * đỏ sau PR #26 mà không ai biết). Cổng này chỉ cho deploy commit mà CI đã chạy xanh:
 *
 *   1. số migration hợp lệ (kiem-migration.mjs, vài giây);
 *   2. thư mục web/ không có thay đổi chưa commit — bản deploy phải đúng là bản CI đã kiểm;
 *   3. hỏi GitHub kết quả workflow "Kiểm thử" của commit đang deploy (cần `gh`, xem dưới):
 *        xanh → đi tiếp · đỏ → từ chối, in link · đang chạy → bảo đợi.
 *      Không có `gh` / mất mạng / commit chưa có lượt CI → tự chạy kiểm thử ngay trên máy
 *      (astro check + toàn bộ test crm, vài phút) thay cho CI.
 *
 * Cài `gh` trên máy deploy (một lần): `winget install GitHub.cli`, rồi `gh auth login`.
 * Không để token GitHub trong web/.env — Astro đọc cả file đó lúc build.
 */

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOC = join(WEB, '..');
const WORKFLOW = 'kiem-thu.yml';

const DO = s => `\x1b[31m\x1b[1m${s}\x1b[0m`;
const VANG = s => `\x1b[33m${s}\x1b[0m`;
const XANH = s => `\x1b[32m${s}\x1b[0m`;

if (process.argv.includes('--khan-cap')) {
  console.log(DO('\n!!! DEPLOY KHẨN CẤP — BỎ QUA CỔNG KIỂM THỬ !!!'));
  console.log(VANG('Commit này có thể chưa qua CI. Ghi lý do vào nhóm chat, và chạy lại'));
  console.log(VANG('`npm run deploy` bình thường ngay khi CI xanh.\n'));
  process.exit(0);
}

const chay = (lenh, args, opts = {}) =>
  execFileSync(lenh, args, { cwd: GOC, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
const tuChoi = (...dong) => { console.log(DO('\nKHÔNG DEPLOY.')); for (const d of dong) console.log(d); process.exit(1); };

console.log('\x1b[1mCổng trước khi deploy\x1b[0m');

// ---------------------------------------------------------------------------
// 1 · Số migration — so với main MỚI NHẤT, nên lấy main về trước
// ---------------------------------------------------------------------------
let coMainMoi = true;
try { chay('git', ['fetch', '--quiet', 'origin', 'main'], { timeout: 20000 }); }
catch { coMainMoi = false; console.log(VANG('  ! Không lấy được main mới nhất (mất mạng?) — so với bản main đã có trên máy')); }
{
  const r = spawnSync(process.execPath, [join(GOC, 'crm', 'test', 'kiem-migration.mjs')], { cwd: GOC, encoding: 'utf8' });
  if (r.status !== 0) {
    process.stdout.write(r.stdout ?? '');
    tuChoi('Số migration không hợp lệ (xem ✗ ở trên).');
  }
  console.log(XANH('  ✓ Số migration hợp lệ'));
}

// ---------------------------------------------------------------------------
// 2 · Không có thay đổi chưa commit trong web/
// ---------------------------------------------------------------------------
const sha = chay('git', ['rev-parse', 'HEAD']);
{
  const doi = execFileSync('git', ['status', '--porcelain', '--', 'web/'], { cwd: GOC, encoding: 'utf8' })
    .split('\n').filter(Boolean);
  if (doi.length) {
    tuChoi('Thư mục web/ có thay đổi chưa commit — bản deploy sẽ khác bản CI đã kiểm:',
           doi.slice(0, 10).map(l => '  ' + l).join('\n'),
           'Commit và đẩy lên, đợi CI xanh, rồi deploy.');
  }
  console.log(XANH('  ✓ web/ không có thay đổi chưa commit'));

  if (coMainMoi && chay('git', ['rev-parse', 'origin/main']) !== sha) {
    console.log(VANG(`  ! Commit đang deploy (${sha.slice(0, 7)}) không phải main mới nhất — chắc chắn đây là bản muốn đưa lên?`));
  }
}

// ---------------------------------------------------------------------------
// 3 · Kết quả CI của commit này
// ---------------------------------------------------------------------------
function khoRepo() {
  const url = chay('git', ['remote', 'get-url', 'origin']);
  const m = url.match(/github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/);
  return m ? `${m[1]}/${m[2]}` : null;
}

/** 'xanh' | 'do' | 'dang-chay' | 'chua-co' | 'khong-hoi-duoc' + link */
function hoiCi() {
  const repo = khoRepo();
  if (!repo) return { kq: 'khong-hoi-duoc', ly_do: 'origin không phải GitHub' };
  let json;
  try {
    json = chay('gh', ['api', `repos/${repo}/actions/workflows/${WORKFLOW}/runs?head_sha=${sha}&per_page=20`], { timeout: 30000 });
  } catch (e) {
    const khongCo = e.code === 'ENOENT';
    return { kq: 'khong-hoi-duoc', ly_do: khongCo ? 'máy chưa cài gh (winget install GitHub.cli, rồi gh auth login)' : 'gh không hỏi được GitHub (chưa gh auth login, hoặc mất mạng)' };
  }
  // LƯỢT MỚI NHẤT quyết định (bỏ lượt bị hủy vì có lượt sau thay): lượt đêm giờ VN đỏ trên cùng commit
  // mà push trước đó xanh thì vẫn là đỏ — lượt đêm chạy chính để bắt lỗi múi giờ mà lượt kia không thấy.
  const luot = (JSON.parse(json).workflow_runs ?? [])
    .filter(l => l.conclusion !== 'cancelled' && l.conclusion !== 'skipped')
    .sort((a, b) => b.run_number - a.run_number);
  if (!luot.length) return { kq: 'chua-co' };
  const moiNhat = luot[0];
  if (moiNhat.status !== 'completed') return { kq: 'dang-chay', link: moiNhat.html_url };
  if (moiNhat.conclusion === 'success') return { kq: 'xanh', link: moiNhat.html_url };
  return { kq: 'do', link: moiNhat.html_url, ly_do: moiNhat.conclusion };
}

const ci = hoiCi();
if (ci.kq === 'xanh') {
  console.log(XANH(`  ✓ CI xanh cho commit ${sha.slice(0, 7)}`) + `  ${ci.link}`);
  process.exit(0);
}
if (ci.kq === 'do') tuChoi(`CI ĐỎ cho commit ${sha.slice(0, 7)} (${ci.ly_do}): ${ci.link}`, 'Sửa cho xanh rồi deploy.');
if (ci.kq === 'dang-chay') tuChoi(`CI đang chạy cho commit ${sha.slice(0, 7)} — đợi khoảng 10 phút rồi chạy lại: ${ci.link}`);

// Không hỏi được CI, hoặc commit chưa có lượt CI (chưa đẩy lên GitHub): tự kiểm ngay trên máy.
console.log(VANG(`  ! ${ci.kq === 'chua-co' ? `Commit ${sha.slice(0, 7)} chưa có lượt CI (đã đẩy lên GitHub chưa?)` : `Không hỏi được CI: ${ci.ly_do}`}`));
console.log(VANG('    → tự chạy kiểm thử trên máy này thay cho CI (vài phút)…\n'));

const buoc = [
  ['astro check', [join(WEB, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'check'], WEB],
  ['toàn bộ kiểm thử database', [join(GOC, 'crm', 'test', 'chay-tat-ca.mjs')], join(GOC, 'crm')],
];
if (!existsSync(join(GOC, 'crm', 'node_modules'))) {
  tuChoi('Chưa cài thư viện kiểm thử: chạy `npm ci` trong thư mục crm rồi deploy lại.');
}
for (const [ten, args, cwd] of buoc) {
  console.log(`\x1b[1m— ${ten}\x1b[0m`);
  const r = spawnSync(process.execPath, args, { cwd, stdio: 'inherit' });
  if (r.status !== 0) tuChoi(`${ten} HỎNG — sửa cho xanh rồi deploy.`);
}
console.log(XANH('\n  ✓ Kiểm thử trên máy đều đạt — đi tiếp'));
