/**
 * LỐI VÀO WORKER — web + nhận hóa đơn iPOS + Cron Trigger (GĐ7a, GĐ7c)
 *
 * `fetch`:
 *   · /hook/ipos/<khóa> → xuLyHookIpos (lib/kho/ipos-hook.ts) — iPOS Hub POST
 *     hóa đơn sang. Chặn TRƯỚC Astro vì chốt chống CSRF của Astro
 *     (security.checkOrigin) trả 403 cho POST "text/plain" không có Origin —
 *     đúng kiểu Hub có thể gửi. Hook không dùng cookie.
 *   · mọi đường dẫn khác: đúng handler mặc định của @astrojs/cloudflare.
 * `scheduled`: Cron Trigger khai ở wrangler.toml `[triggers] crons` — mỗi 5 phút
 * chạy `dongBoTatCa` (lib/kho/ipos-dong-bo.ts): thử lại hàng chờ + đọc thực đơn
 * iPOS khi tới hạn. Thiếu bí mật thì chỉ ghi một dòng log; web không bị ảnh hưởng.
 * Cùng cron đó chạy SONG SONG `guiZaloTatCa` (lib/zalo-gui.ts): gửi tin Zalo ZBS
 * đến hạn. Hai việc là hai lời waitUntil riêng — cả hai không bao giờ ném lỗi,
 * và việc này hỏng / chậm không chặn việc kia.
 *
 * wrangler.toml khai `main = "./src/worker.ts"` (file NGUỒN — adapter chỉ tự
 * điền main khi nó vắng mặt, và build lại file này bằng Vite).
 * Chạy thử cục bộ (sau `npm run build`): `npx wrangler dev --config dist/server/wrangler.json`
 * rồi `curl "http://localhost:8787/cdn-cgi/handler/scheduled"` (xem web/KHO.md mục iPOS).
 */

import { handle } from '@astrojs/cloudflare/handler';
import { dongBoTatCa } from './lib/kho/ipos-dong-bo.ts';
import { xuLyHookIpos, khoaTuDuong, DUONG_HOOK } from './lib/kho/ipos-hook.ts';
import { guiZaloTatCa } from './lib/zalo-gui.ts';

interface NguCanh {
  waitUntil(p: Promise<unknown>): void;
}

export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: NguCanh) {
    const duong = new URL(request.url).pathname;
    if (duong.startsWith(DUONG_HOOK)) {
      const khoa = khoaTuDuong(duong);
      if (khoa === null) return new Response('Không tìm thấy', { status: 404 });
      return xuLyHookIpos(request, khoa, { env });
    }
    // Kiểu của handle là Request / Env / ExecutionContext của workerd — dự án không cài kiểu đó.
    return handle(request as never, env as never, ctx as never);
  },
  async scheduled(_ctrl: unknown, env: Record<string, unknown>, ctx: NguCanh) {
    // Hai việc độc lập, chạy song song: mỗi promise một waitUntil.
    ctx.waitUntil(dongBoTatCa(env));
    ctx.waitUntil(guiZaloTatCa(env));
  },
};
