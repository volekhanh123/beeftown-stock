/**
 * WEBHOOK BOT MESSENGER — GET / POST /hook/messenger (0053)
 *
 * Trang công khai (ngoài /noi-bo — middleware không chặn, không cookie). Mọi
 * việc nằm ở lib/messenger-hook.ts (xuLyHookMessenger). Trên Worker thật,
 * src/worker.ts chặn /hook/messenger trước Astro và truyền ctx (trả 200 ngay,
 * xử lý trong waitUntil); route này dùng cho `astro dev` và dự phòng — không có
 * waitUntil nên xử lý xong rồi mới trả 200.
 */
import type { APIRoute } from 'astro';
import { xuLyHookMessenger } from '../../lib/messenger-hook.ts';

export const prerender = false;

export const ALL: APIRoute = ({ request }) => xuLyHookMessenger(request);
