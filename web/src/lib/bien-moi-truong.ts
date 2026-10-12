/**
 * BIẾN MÔI TRƯỜNG VÀ BÍ MẬT — đọc ở một chỗ
 * ========================================
 *
 * Việc chạy nền (báo động, Zalo, iPOS, Messenger) đọc bí mật theo cùng một thứ tự:
 *   tham số `env` (Worker truyền vào) → `cloudflare:workers` → process.env (chạy thử bằng Node).
 * Biến công khai (PUBLIC_SUPABASE_URL…) thì còn có `import.meta.env` của Astro đứng trước.
 *
 * Không bao giờ ném lỗi: thiếu thì undefined, nơi gọi tự nói "chưa cài".
 */

export type Env = Record<string, unknown> | undefined;

/** `env` của Worker (`cloudflare:workers`). Chạy bằng Node / astro dev → undefined. */
export async function envWorker(): Promise<Env> {
  try {
    // @ts-ignore — dự án không cài kiểu của workerd; module này chỉ có trên Worker.
    const m = await import('cloudflare:workers');
    return (m as { env?: Record<string, unknown> })?.env;
  } catch { return undefined; }
}

/** process.env khi chạy bằng Node (test, astro dev). */
export function envNode(): Env {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
}

/** Chuỗi khác rỗng đầu tiên (đã bỏ khoảng trắng hai đầu) trong các nguồn, theo thứ tự. */
export function docChuoi(ten: string, ...nguon: Env[]): string | undefined {
  for (const n of nguon) {
    const v = n?.[ten];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

/** Biến công khai: `import.meta.env` của Astro → `env` → process.env. */
export function layBienCong(ten: string, env: Env): string | undefined {
  const v = (import.meta as { env?: Record<string, unknown> }).env?.[ten];
  if (typeof v === 'string' && v) return v;
  return docChuoi(ten, env, envNode());
}
