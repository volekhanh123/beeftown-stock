/**
 * LỐI VÀO WORKER — web + nhận hóa đơn iPOS + Cron Trigger (GĐ7a, GĐ7c)
 *
 * `fetch`:
 *   · /hook/ipos/<khóa> → xuLyHookIpos (lib/kho/ipos-hook.ts) — iPOS Hub POST
 *     hóa đơn sang. Chặn TRƯỚC Astro vì chốt chống CSRF của Astro
 *     (security.checkOrigin) trả 403 cho POST "text/plain" không có Origin —
 *     đúng kiểu Hub có thể gửi. Hook không dùng cookie.
 *   · /hook/messenger → xuLyHookMessenger (lib/messenger-hook.ts) — webhook Meta
 *     của bot Messenger đặt bàn (GET xác minh, POST sự kiện có chữ ký). Cũng
 *     chặn trước Astro: Meta không gửi Origin, hook không dùng cookie. Truyền
 *     ctx để hook trả 200 ngay và xử lý tin trong ctx.waitUntil.
 *   · mọi đường dẫn khác: đúng handler mặc định của @astrojs/cloudflare.
 * `scheduled`: Cron Trigger khai ở wrangler.toml `[triggers] crons` — mỗi 5 phút
 * chạy `dongBoTatCa` (lib/kho/ipos-dong-bo.ts): thử lại hàng chờ + đọc thực đơn
 * iPOS khi tới hạn. Thiếu bí mật thì chỉ ghi một dòng log; web không bị ảnh hưởng.
 * Cùng cron đó chạy SONG SONG `guiZaloTatCa` (lib/zalo-gui.ts): gửi tin Zalo ZBS
 * đến hạn. Hai việc là hai lời waitUntil riêng — cả hai không bao giờ ném lỗi,
 * và việc này hỏng / chậm không chặn việc kia.
 * Cron THỨ HAI (CRON_BAO_DONG, "2-59/5 * * * *" — lệch 2 phút) chỉ chạy
 * `baoDongTatCa` (lib/bao-dong.ts): báo khi đèn sức khỏe chuyển đỏ. Tách cron để
 * iPOS / Zalo quá tải hay treo không kéo việc báo động chết theo. Cloudflare gọi
 * `scheduled` riêng cho từng cron, `controller.cron` là đúng chuỗi trong wrangler.toml.
 *
 * wrangler.toml khai `main = "./src/worker.ts"` (file NGUỒN — adapter chỉ tự
 * điền main khi nó vắng mặt, và build lại file này bằng Vite).
 * Chạy thử cục bộ (sau `npm run build`): `npx wrangler dev --config dist/server/wrangler.json`
 * rồi `curl "http://localhost:8787/cdn-cgi/handler/scheduled"` (xem web/KHO.md mục iPOS);
 * lượt báo động: thêm `?cron=2-59%2F5+*+*+*+*` (web/README.md mục Báo động).
 */

import { handle } from '@astrojs/cloudflare/handler';
import { dongBoTatCa } from './lib/kho/ipos-dong-bo.ts';
import { xuLyHookIpos, khoaTuDuong, DUONG_HOOK } from './lib/kho/ipos-hook.ts';
import { guiZaloTatCa } from './lib/zalo-gui.ts';
import { xuLyHookMessenger, DUONG_MESSENGER } from './lib/messenger-hook.ts';
import { baoDongTatCa, CRON_BAO_DONG } from './lib/bao-dong.ts';

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
    if (duong === DUONG_MESSENGER || duong === DUONG_MESSENGER + '/') {
      return xuLyHookMessenger(request, { env, ctx });
    }
    // Kiểu của handle là Request / Env / ExecutionContext của workerd — dự án không cài kiểu đó.
    return handle(request as never, env as never, ctx as never);
  },
  async scheduled(dieuKhien: { cron?: string } | undefined, env: Record<string, unknown>, ctx: NguCanh) {
    // Cron riêng của việc báo động: chỉ chạy việc đó.
    if (dieuKhien?.cron === CRON_BAO_DONG) {
      ctx.waitUntil(baoDongTatCa(env));
      return;
    }
    // Hai việc độc lập, chạy song song: mỗi promise một waitUntil.
    ctx.waitUntil(dongBoTatCa(env));
    ctx.waitUntil(guiZaloTatCa(env));
  },
};
