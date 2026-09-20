// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Cloudflare mua lại Astro tháng 1/2026, nên adapter Workers là deploy target
// hạng nhất — không có lớp phiên dịch nào ở giữa. Đây là lý do chính chọn
// Astro thay vì Next.js cho nền tảng này.
export default defineConfig({
  // output: 'server' vì nội dung trang phụ thuộc công tắc trong database.
  // Bật một công tắc là trang đổi ngay, không cần deploy lại.
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),

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

  // Đặt trước khi lên tên miền thật, nếu không thẻ og:image sẽ là đường dẫn
  // tương đối và Facebook không hiển thị được ảnh. Đây là lỗi phổ biến nhất
  // của đúng phần này.
  site: process.env.SITE_URL || 'https://beeftown.pages.dev',
});
