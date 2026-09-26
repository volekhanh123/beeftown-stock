/**
 * NHẬN HÓA ĐƠN iPOS ĐẨY SANG — POST /hook/ipos/<IPOS_CALLBACK_KHOA> (GĐ7c)
 *
 * Trang công khai (ngoài /noi-bo — middleware không chặn, không cookie). Mọi
 * việc nằm ở lib/kho/ipos-hook.ts (xuLyHookIpos). Trên Worker thật, src/worker.ts
 * chặn /hook/ipos/* trước Astro (chốt chống CSRF của Astro trả 403 cho POST
 * "text/plain" không có Origin); route này dùng cho `astro dev` và dự phòng.
 */
import type { APIRoute } from 'astro';
import { xuLyHookIpos } from '../../../lib/kho/ipos-hook.ts';

export const prerender = false;

export const ALL: APIRoute = ({ request, params }) => xuLyHookIpos(request, String(params.khoa ?? ''));
