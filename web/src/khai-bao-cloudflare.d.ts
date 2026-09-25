/**
 * Khai tối thiểu cho module runtime của Cloudflare.
 *
 * Dự án không cài @cloudflare/workers-types (adapter tự lo phần chạy), nên
 * TypeScript cần được cho biết hình dạng của đúng thứ ta dùng: biến môi
 * trường lúc chạy. Astro 7 đã bỏ Astro.locals.runtime.env; đây là cách đọc
 * còn lại.
 *
 * Secret như GEMINI_API_KEY PHẢI đọc qua đây, không bao giờ qua
 * import.meta.env — thứ kia bị Vite nướng thẳng vào bản build công khai.
 */
declare module 'cloudflare:workers' {
  export const env: {
    /** Secret, đặt bằng `wrangler secret put GEMINI_API_KEY` hoặc trên dashboard. */
    readonly GEMINI_API_KEY?: string;
    /** Biến thường trong wrangler.toml. Trống thì dùng bí danh mặc định trong lib/may-dich.ts. */
    readonly GEMINI_MODEL?: string;
    readonly [ten: string]: unknown;
  };
}
