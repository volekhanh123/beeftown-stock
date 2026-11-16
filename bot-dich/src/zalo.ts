/**
 * Gọi Zalo Bot API: POST https://bot-api.zaloplatforms.com/bot<TOKEN>/<tên hàm>, thân JSON, trả { ok, result }
 * hoặc { ok: false, error_code, description }. Nguồn: bot.zaloplatforms.com/docs và client của OpenClaw
 * (@openclaw/zalo, api.ts) — hai nguồn khớp nhau. Token nằm trong đường dẫn, nên không bao giờ in URL ra nhật ký.
 */

export const GOC_API_ZALO = 'https://bot-api.zaloplatforms.com';
const HET_GIO_MS = 15_000;

export class LoiZalo extends Error {
  readonly ham: string;
  readonly maLoi: number | undefined;
  constructor(ham: string, maLoi: number | undefined, moTa: string) {
    super(`Zalo ${ham}: ${moTa}`);
    this.name = 'LoiZalo';
    this.ham = ham;
    this.maLoi = maLoi;
  }
}

export type HamFetch = typeof fetch;

export async function goiZalo(
  token: string,
  ham: string,
  than: Record<string, unknown> | undefined,
  fetchFn: HamFetch = fetch,
): Promise<Record<string, unknown>> {
  let traVe: Response;
  try {
    traVe = await fetchFn(`${GOC_API_ZALO}/bot${token}/${ham}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: than ? JSON.stringify(than) : undefined,
      signal: AbortSignal.timeout(HET_GIO_MS),
    });
  } catch (loi) {
    // Thông báo lỗi của fetch có thể chứa URL (có token) — chỉ giữ tên lỗi.
    throw new LoiZalo(ham, undefined, `không gọi được (${(loi as Error)?.name ?? 'lỗi mạng'})`);
  }
  let du: Record<string, unknown> | null = null;
  try {
    du = (await traVe.json()) as Record<string, unknown>;
  } catch {
    du = null;
  }
  if (!traVe.ok || !du || du.ok !== true) {
    const maLoi = typeof du?.error_code === 'number' ? du.error_code : traVe.status;
    const moTa = typeof du?.description === 'string' ? du.description : `HTTP ${traVe.status}`;
    throw new LoiZalo(ham, maLoi, moTa);
  }
  return du;
}

export function guiTin(token: string, maChat: string, noiDung: string, fetchFn?: HamFetch) {
  return goiZalo(token, 'sendMessage', { chat_id: maChat, text: noiDung }, fetchFn);
}

/** Hiện "đang soạn tin" trong lúc dịch. Lỗi ở đây không quan trọng — người gọi bỏ qua. */
export function baoDangGo(token: string, maChat: string, fetchFn?: HamFetch) {
  return goiZalo(token, 'sendChatAction', { chat_id: maChat, action: 'typing' }, fetchFn);
}

export function dangKyWebhook(token: string, url: string, khoa: string, fetchFn?: HamFetch) {
  return goiZalo(token, 'setWebhook', { url, secret_token: khoa }, fetchFn);
}

export function thongTinBot(token: string, fetchFn?: HamFetch) {
  return goiZalo(token, 'getMe', undefined, fetchFn);
}
