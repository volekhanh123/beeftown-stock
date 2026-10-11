/**
 * BIẾN MÔI TRƯỜNG VÀ BÍ MẬT — dùng chung cho các việc chạy nền và webhook
 * =======================================================================
 *
 * Bốn việc (gửi tin Zalo, đồng bộ iPOS, bot Messenger, báo động) đọc bí mật theo cùng một thứ tự,
 * trước đây mỗi file chép riêng một bản giống hệt:
 *
 *   1. `env` người gọi truyền vào (cron của Worker, test);
 *   2. env của Worker — bí mật đặt bằng `wrangler secret put`, đọc qua module `cloudflare:workers`
 *      (chỉ có trên Worker; Node / test thì không có, trả undefined);
 *   3. `process.env` (chạy tay bằng Node).
 *
 * Biến PUBLIC_* (địa chỉ Supabase, khóa anon) thì khác: nằm sẵn trong bản build từ web/.env
 * (`import.meta.env`) — dashboard Cloudflare không có chỗ đặt chúng (web/README.md).
 */

export type Env = Record<string, unknown> | undefined;

/** env của Worker. Ngoài Worker (Node, test) → undefined; không bao giờ ném lỗi. */
export async function envWorker(): Promise<Env> {
  try {
    const m = await import('cloudflare:workers');
    return (m as { env?: Record<string, unknown> })?.env;
  } catch { return undefined; }
}

/** Chuỗi khác rỗng đầu tiên (đã cắt khoảng trắng hai đầu) trong các nguồn, theo thứ tự. */
export function docChuoi(ten: string, ...nguon: Env[]): string | undefined {
  for (const n of nguon) {
    const v = n?.[ten];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

export const envNode = (): Env => (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

/** Biến PUBLIC_* / SITE_URL: bản build (import.meta.env) trước, rồi env truyền vào, rồi process.env. */
export function layBienCong(ten: string, env: Env): string | undefined {
  const v = (import.meta as { env?: Record<string, unknown> }).env?.[ten];
  if (typeof v === 'string' && v) return v;
  return docChuoi(ten, env, envNode());
}
