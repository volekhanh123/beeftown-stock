/**
 * QUÉT CHUỖI CẤM — quét thứ KHÁCH ĐỌC, không quét mã nguồn
 * ========================================================
 *
 * VÌ SAO KHÔNG GREP MÃ NGUỒN NỮA
 *
 * Bản đầu tiên của phép thử này là một lệnh grep vào src/ và public/. Nó sai
 * theo hai hướng ngược nhau, và cả hai đều nguy hiểm:
 *
 *   BÁO NHẦM. Nó tìm thấy chính những dòng chú thích ghi "cấm dùng từ này" và
 *   báo động. Một phép thử báo động về chính tài liệu của nó sẽ dạy người ta
 *   bỏ qua nó — và một phép thử bị bỏ qua thì tệ hơn không có, vì nó vẫn tạo
 *   cảm giác đã kiểm tra rồi.
 *
 *   BỎ SÓT — nặng hơn nhiều. Từ migration 0010 trở đi, nội dung trang đến TỪ
 *   DATABASE. Khánh gõ "rẻ hơn 30%" vào ô dòng trạng thái trong giao diện nội
 *   bộ rồi bấm công bố, thì câu đó lên trang chủ ngay lập tức — và lệnh grep
 *   mã nguồn vẫn xanh mãi mãi. Nó đang canh một cánh cửa đã không còn ai đi
 *   qua, trong khi cửa thật thì mở toang.
 *
 * Nên phép thử này tải trang thật qua HTTP và đọc PHẦN CHỮ HIỆN RA, đúng thứ
 * khách nhìn thấy. Mã nguồn viết gì không quan trọng; nội dung tới từ đâu
 * cũng không quan trọng.
 *
 * CHỖ NÓ VẪN KHÔNG VỚI TỚI, nói thẳng để không ai tưởng đã xong: nó chỉ thấy
 * nội dung ĐANG được công bố lúc chạy. Một dữ kiện được công bố sau đó thì
 * phải chạy lại. Vì vậy lệnh này thuộc về hai thời điểm: trước khi deploy, và
 * sau mỗi lần bật công tắc nội dung.
 *
 * QUÉT BẢN BUILD, KHÔNG QUÉT astro dev: trang dựng sẵn lúc build, HTML đã nén
 * (compressHTML) và Worker trong workerd chỉ có ở bản build — chữ dính nhau khi
 * xuống dòng, hay một trang build hỏng, astro dev không bao giờ thấy. Bản build
 * ở đây là bản KHÔNG database (như CI); `npm run deploy` build lại bản thật sau
 * bước quét này.
 *
 * CÁCH DÙNG
 *   npm run quet                      ← build, bật wrangler dev trên dist/, quét, tắt
 *   npm run quet -- --khong-build     ← dùng dist/ có sẵn (CI: bước trước vừa build)
 *   npm run quet -- --url https://…   ← quét một trang đang chạy thật (hay astro dev đang bật)
 */

import { timChuoiCam } from '../src/lib/chuoi-cam.js';
import { batMayChuBanBuild, tatMayChu } from './may-chu-ban-build.mjs';

// -----------------------------------------------------------------------------
// DANH SÁCH CẤM — nằm ở src/lib/chuoi-cam.js
// -----------------------------------------------------------------------------
// Máy dịch (src/lib/may-dich.ts) lọc bản dịch bằng đúng danh sách này trước
// khi cho lên trang, nên nó phải là MỘT file dùng chung — không phải hai bản
// chép sẽ lệch nhau sau lần sửa đầu tiên. Mỗi dòng ở đó vẫn kèm lý do.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// LẤY PHẦN CHỮ KHÁCH ĐỌC ĐƯỢC
// -----------------------------------------------------------------------------
// Bỏ script, style và chú thích HTML — ba thứ này có trong file nhưng không
// bao giờ hiện thành chữ. Giữ lại nội dung thẻ mô tả: chúng KHÔNG nằm trên
// trang, nhưng hiện ra ở kết quả tìm kiếm và ô xem trước khi chia sẻ link,
// nên với khách chúng cũng là chữ đọc được.
// -----------------------------------------------------------------------------
function chuHienRa(html) {
  const than = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  const phan = [];

  const tieuDe = than.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (tieuDe) phan.push(tieuDe[1]);

  for (const m of than.matchAll(/<meta\b[^>]*\bcontent\s*=\s*"([^"]*)"[^>]*>/gi)) {
    phan.push(m[1]);
  }

  // JSON-LD nằm trong <script> nên đã bị bỏ ở trên. Lấy lại riêng: Google đọc
  // nó và đưa lên kết quả tìm kiếm, nên nó cũng là chữ khách đọc được.
  for (const m of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    phan.push(m[1]);
  }

  phan.push(than.replace(/<[^>]+>/g, ' '));

  return phan.join(' \n ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ');
}

const quet = timChuoiCam;

// -----------------------------------------------------------------------------
// DANH SÁCH TRANG — lấy từ sitemap, vì sitemap là thứ ta khai với Google
// -----------------------------------------------------------------------------
// Nếu một trang không có trong sitemap mà vẫn công khai thì đó đã là một lỗi
// riêng. Cộng thêm vài đường dẫn cố định để phòng sitemap hỏng.
// -----------------------------------------------------------------------------
// Trang 404 (pages/404.astro): một đường dẫn lạ cho mỗi thứ tiếng. Chữ trên đó cũng là chữ khách
// đọc; mã trả về phải là 404 — không 200, không 500.
const TRANG_KHONG_CO = ['/khong-co-trang-nay', '/en/khong-co-trang-nay', '/ko/khong-co-trang-nay'];

async function danhSachTrang(goc) {
  // Đủ 21 trang công khai (7 trang × vi/en/ko) — sitemap hỏng thì vẫn quét hết.
  const luon_co = [
    '/', '/thuc-don', '/den-beeftown', '/dat-ban', '/tuyen-dung', '/quyen-rieng-tu', '/xoa-du-lieu',
    '/en', '/en/menu', '/en/visit', '/en/book', '/en/jobs', '/en/privacy', '/en/data-deletion',
    '/ko', '/ko/menu', '/ko/visit', '/ko/book', '/ko/jobs', '/ko/privacy', '/ko/data-deletion',
  ];
  const bo = new Set([...luon_co, ...TRANG_KHONG_CO].map(d => new URL(d, goc).href));
  try {
    const xml = await (await fetch(new URL('/sitemap.xml', goc))).text();
    for (const m of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)) {
      const u = new URL(m[1]);
      bo.add(new URL(u.pathname + u.search, goc).href);
    }
  } catch {
    console.log('  (không đọc được sitemap.xml — dùng danh sách cố định)');
  }
  return [...bo].sort();
}

// -----------------------------------------------------------------------------
async function main() {
  const i = process.argv.indexOf('--url');
  const gocTuyChon = i > -1 ? process.argv[i + 1] : null;

  let tienTrinh = null;
  let goc = gocTuyChon;

  if (!goc) {
    // Không còn tự dùng astro dev đang bật ở cổng 4321: đó không phải bản sẽ deploy, và có thể
    // đang nối database thật. Muốn quét nó thì gõ rõ --url http://localhost:4321.
    ({ p: tienTrinh, goc } = await batMayChuBanBuild({ cong: 4329, khongBuild: process.argv.includes('--khong-build') }));
    // wrangler dev chạy ở nhóm tiến trình riêng nên không nhận Ctrl+C — tự tắt nó trước khi thoát, kẻo nó giữ cổng.
    for (const tin of ['SIGINT', 'SIGTERM']) process.on(tin, () => { tatMayChu(tienTrinh); process.exit(130); });
    console.log(`Bản build chạy trong wrangler dev ở ${goc}\n`);
  }

  let soLoi = 0;
  try {
    const trang = await danhSachTrang(goc);
    console.log(`Quét ${trang.length} trang tại ${goc}\n`);

    for (const url of trang) {
      const duong = new URL(url).pathname;
      let html;
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
        const laTrangKhongCo = TRANG_KHONG_CO.includes(duong);
        if (laTrangKhongCo ? r.status !== 404 : !r.ok) {
          console.log(`  ✗ ${duong.padEnd(18)} HTTP ${r.status}${laTrangKhongCo ? ' (trang không có phải trả 404)' : ''}`);
          soLoi++;
          continue;
        }
        html = await r.text();
      } catch (e) {
        console.log(`  ✗ ${duong.padEnd(18)} không tải được: ${e.message}`);
        soLoi++;
        continue;
      }

      const thay = quet(chuHienRa(html));
      if (thay.length === 0) {
        console.log(`  ✓ ${duong.padEnd(18)} sạch`);
      } else {
        soLoi += thay.length;
        console.log(`  ✗ ${duong.padEnd(18)} ${thay.length} vi phạm`);
        for (const t of thay) {
          console.log(`      tìm thấy: "${t.tim_thay}"`);
          console.log(`      vì sao cấm: ${t.vi_sao}`);
        }
      }
    }
  } finally {
    if (tienTrinh) tatMayChu(tienTrinh);
  }

  console.log();
  if (soLoi === 0) {
    console.log('Đạt — không có chuỗi cấm nào trong phần chữ khách đọc được.');
    console.log('Nhớ: phép thử này chỉ thấy nội dung ĐANG công bố. Chạy lại sau mỗi lần bật công tắc.');
  } else {
    console.log(`KHÔNG ĐẠT — ${soLoi} vấn đề. Không deploy cho tới khi sạch.`);
    process.exitCode = 1;
  }
}

main().catch(e => {
  console.error('Lỗi khi chạy phép thử:', e.message);
  process.exitCode = 1;
});
