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

/**
 * Tên biến layBienCong đọc. Astro nướng biến KHÔNG có tiền tố PUBLIC_ (SITE_URL) vào bản build chỉ khi tên của nó
 * xuất hiện trong chính file dùng import.meta.env — tức file này, không phải nơi gọi. Giữ tên trong MÃ ở đây (không
 * chỉ trong chú thích); gọi tên khác là lỗi kiểu. Kiểm thử: test-bao-dong-web.mjs, nhóm "BIẾN BẢN BUILD".
 */
export const BIEN_CONG = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'SITE_URL'] as const;

/** Biến PUBLIC_* / SITE_URL: bản build (import.meta.env) trước, rồi env truyền vào, rồi process.env. */
export function layBienCong(ten: (typeof BIEN_CONG)[number], env: Env): string | undefined {
  const v = (import.meta as { env?: Record<string, unknown> }).env?.[ten];
  if (typeof v === 'string' && v) return v;
  return docChuoi(ten, env, envNode());
}
