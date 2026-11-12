/**
 * IPN VNPAY CỦA MUA THỊT VỀ — GET /hook/vnpay-ipn (0115)
 *
 * Trang công khai (ngoài /noi-bo — middleware không chặn, không cookie). Mọi việc nằm ở lib/vnpay-hook.ts
 * (xuLyIpnVnpay). Trên Worker thật, src/worker.ts chặn /hook/vnpay-ipn trước Astro; route này dùng cho `astro dev`
 * và dự phòng.
 */
import type { APIRoute } from 'astro';
import { xuLyIpnVnpay } from '../../lib/vnpay-hook.ts';

export const prerender = false;

export const ALL: APIRoute = ({ request }) => xuLyIpnVnpay(request);
