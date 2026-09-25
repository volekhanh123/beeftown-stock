// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import cloudflare from '@astrojs/cloudflare';

// Cloudflare mua lại Astro tháng 1/2026, nên adapter Workers là deploy target
// hạng nhất — không có lớp phiên dịch nào ở giữa. Đây là lý do chính chọn
// Astro thay vì Next.js cho nền tảng này.

// -----------------------------------------------------------------------------
// ĐỌC .env NGAY TẠI ĐÂY, KHÔNG DÙNG process.env
// -----------------------------------------------------------------------------
// File cấu hình này được nạp bằng một câu import() trần, TRƯỚC khi Astro dựng
// Vite. Mà Astro chỉ chép .env vào process.env ở hook buildStart() của
// astro-env-plugin — tức là sau. Nên `process.env.SITE_URL` ở đây LUÔN rỗng
// dù .env có ghi gì đi nữa.
//
// Tệ hơn: hook đó còn có guard `if (!isBuild) return`, nên khi chạy
// `astro dev` thì .env KHÔNG BAO GIỜ tới được process.env. Giai đoạn chạy thử
// trên máy là giai đoạn 100% rơi về giá trị dự phòng.
//
// loadEnv của Vite đọc thẳng file, không phụ thuộc vòng đời nào. Tham số thứ
// ba là '' để nhận mọi tiền tố — mặc định của Vite chỉ nhận VITE_.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

export default defineConfig({
  // output: 'server' vì nội dung trang phụ thuộc công tắc trong database.
  // Bật một công tắc là trang đổi ngay, không cần deploy lại.
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),

  // Không dùng Astro Sessions ở đâu cả — phiên đăng nhập /noi-bo tự viết bằng
  // cookie trong src/lib/phien.ts. Để mặc định thì adapter tự bật driver
  // Cloudflare KV và tiêm một binding tên SESSION *không có id* vào
  // dist/server/wrangler.json; wrangler sẽ tự tạo một KV namespace không ai
  // đọc, và nếu sau này chuyển sang CI dùng API token hẹp thì binding bị hạ
  // thành `inherit` và lần deploy đầu tiên hỏng với lỗi khó hiểu.
  session: false,

  // Chống CSRF: từ chối POST có Origin khác tên miền của trang. Astro bật sẵn
  // cho output: 'server', nhưng ghi ra ĐÂY để nó nhìn thấy được — /noi-bo và
  // hai form công khai đều là POST bằng form HTML thuần, và một mặc định im
  // lặng thì không ai kiểm được là nó còn bật hay không.
  security: { checkOrigin: true },

  // Tiếng Việt là ngôn ngữ chính và không có tiền tố trong đường dẫn.
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi', 'en'],
    routing: { prefixDefaultLocale: false },
  },

  // Phải đúng TRƯỚC khi build, vì Astro nướng giá trị này vào bản build: nó
  // thành canonical, og:url, url trong JSON-LD và mọi <loc> trong sitemap.
  //
  // Giá trị dự phòng là tên miền thật: web chạy ở beeftown.vn, còn địa chỉ
  // workers.dev đã tắt (workers_dev = false trong wrangler.toml). Dự phòng sai
  // tên miền thì nó sai theo cách trông như đúng.
  site: env.SITE_URL || 'https://beeftown.vn',
});
