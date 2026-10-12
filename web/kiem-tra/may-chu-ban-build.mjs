/**
 * MÁY CHỦ BẢN BUILD — dist/ chạy trong wrangler dev (cùng workerd với Cloudflare)
 * ===============================================================================
 *
 * Dùng chung cho kiểm thử trình duyệt (trinh-duyet.mjs) và quét chữ cấm (quet-chuoi-cam.mjs).
 * Cả hai thử ĐÚNG thứ sẽ deploy: HTML đã nén (compressHTML — chữ dính nhau khi xuống dòng chỉ lộ
 * ra ở đây), trang dựng sẵn lúc build, Worker chạy trong workerd. astro dev thì khác cả ba: HTML
 * chưa nén, mọi trang dựng lúc xem, mã chạy trong Node.
 *
 * Build KHÔNG database, kể cả khi máy đang chạy có sẵn PUBLIC_SUPABASE_* (biến môi trường của phiên,
 * hay web/.env): Vite nướng hai biến này vào bản build, và biến môi trường thắng .env — đặt rỗng là
 * trang chắc chắn ở trạng thái của CI. Không vậy thì kiểm thử gửi form vào database THẬT.
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as cho } from 'node:timers/promises';

export const WEB = join(dirname(fileURLToPath(import.meta.url)), '..');

export async function song(goc) {
  try { return (await fetch(goc, { signal: AbortSignal.timeout(2000) })).ok; } catch { return false; }
}

/**
 * Build (trừ khi `khongBuild` và dist/ đã có) rồi bật wrangler dev ở `cong`. Trả { p, goc }.
 * Mặc định luôn build lại: thử trên dist/ cũ thì sửa mã rồi chạy vẫn xanh — lỗi vừa thêm không ai thấy.
 */
export async function batMayChuBanBuild({ cong, khongBuild = false }) {
  if (!khongBuild || !existsSync(join(WEB, 'dist', 'server'))) {
    console.log('Build lại bản mới nhất (astro build)…');
    const b = spawnSync(process.execPath, [join(WEB, 'node_modules', 'astro', 'bin', 'astro.mjs'), 'build'],
      { cwd: WEB, stdio: 'inherit', env: { ...process.env, PUBLIC_SUPABASE_URL: '', PUBLIC_SUPABASE_ANON_KEY: '' } });
    if (b.status !== 0) throw new Error('astro build hỏng');
  }
  const goc = `http://127.0.0.1:${cong}`;
  if (await song(goc)) throw new Error(`Cổng ${cong} đang bận — tắt máy chủ cũ rồi chạy lại`);
  const p = spawn(process.execPath, [join(WEB, 'node_modules', 'wrangler', 'bin', 'wrangler.js'), 'dev',
    '--port', String(cong), '--ip', '127.0.0.1', '--log-level', 'warn'],
    { cwd: WEB, stdio: 'ignore', detached: process.platform !== 'win32' });
  for (let i = 0; i < 60; i++) {
    if (await song(goc)) return { p, goc };
    await cho(1000);
  }
  tatMayChu(p);
  throw new Error(`wrangler dev không lên sau 60 giây ở cổng ${cong}`);
}

/** wrangler dev chạy ở nhóm tiến trình riêng (detached) nên giết cả nhóm; Windows: taskkill /T. */
export function tatMayChu(p) {
  if (!p?.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(-p.pid, 'SIGTERM'); } catch { p.kill('SIGTERM'); } }
}
