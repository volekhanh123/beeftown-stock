/**
 * LỐI VÀO WORKER — web + Cron Trigger đồng bộ iPOS (GĐ7a)
 *
 * `fetch`: đúng handler mặc định của @astrojs/cloudflare (mọi trang Astro).
 * `scheduled`: Cron Trigger khai ở wrangler.toml `[triggers] crons` — mỗi 5 phút
 * chạy `dongBoTatCa` (lib/kho/ipos-dong-bo.ts). Thiếu bí mật iPOS thì nó chỉ ghi
 * một dòng log rồi thôi; web không bị ảnh hưởng.
 *
 * wrangler.toml khai `main = "./src/worker.ts"` (file NGUỒN — adapter chỉ tự
 * điền main khi nó vắng mặt, và build lại file này bằng Vite).
 * Chạy thử cục bộ (sau `npm run build`): `npx wrangler dev --config dist/server/wrangler.json`
 * rồi `curl "http://localhost:8787/cdn-cgi/handler/scheduled"` (xem web/KHO.md mục iPOS).
 */

import { handle } from '@astrojs/cloudflare/handler';
import { dongBoTatCa } from './lib/kho/ipos-dong-bo.ts';

interface NguCanhCron {
  waitUntil(p: Promise<unknown>): void;
}

export default {
  fetch: handle,
  async scheduled(_ctrl: unknown, env: Record<string, unknown>, ctx: NguCanhCron) {
    ctx.waitUntil(dongBoTatCa(env));
  },
};
