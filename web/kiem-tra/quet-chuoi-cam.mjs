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
 * CÁCH DÙNG
 *   npm run quet                     ← tự bật server, quét, tắt server
 *   npm run quet -- --url https://…  ← quét một trang đang chạy thật
 */

import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as cho } from 'node:timers/promises';
import { timChuoiCam } from '../src/lib/chuoi-cam.js';

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
async function danhSachTrang(goc) {
  const luon_co = ['/', '/tuyen-dung', '/quyen-rieng-tu', '/en', '/en/jobs', '/en/privacy'];
  const bo = new Set(luon_co.map(d => new URL(d, goc).href));
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
// SERVER
// -----------------------------------------------------------------------------
async function song(goc) {
  try {
    const r = await fetch(goc, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

async function batServer(cong) {
  const p = spawn('npx', ['astro', 'dev', '--port', String(cong)],
                  { shell: true, stdio: 'ignore' });
  const goc = `http://localhost:${cong}`;
  // Astro dev tối ưu dependency ở lần tải đầu; request tới giữa chừng sẽ lỗi.
  // Nên chờ hẳn một lần tải THÀNH CÔNG, không chỉ chờ cổng mở.
  for (let i = 0; i < 60; i++) {
    if (await song(goc)) return { p, goc };
    await cho(1000);
  }
  tatServer(p);
  throw new Error(`astro dev không lên sau 60 giây ở cổng ${cong}. Nếu một lần quét trước bị ngắt ` +
                  'giữa chừng, có thể còn server chạy ngầm giữ cổng: chạy "npx astro dev stop" rồi thử lại.');
}

function tatServer(p) {
  if (!p?.pid) return;
  // process.kill trên Windows không giết tiến trình con, mà astro dev chạy
  // dưới npx nên nó CHÍNH LÀ tiến trình con.
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(p.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try { process.kill(-p.pid, 'SIGTERM'); } catch { p.kill('SIGTERM'); }
  }
  // Astro 7: không có terminal tương tác thì `astro dev` tự chuyển sang chạy
  // ngầm. Tiến trình spawn ở trên chỉ là cái vỏ đã thoát; server thật là một
  // tiến trình khác, có session riêng, mà hai lệnh giết trên không chạm tới.
  // Không dừng nó thì nó sống mồ côi giữ cổng 4329 và khóa "dev server đang
  // chạy" — lần quét sau hoặc không bật được server, hoặc đọc nhầm server cũ
  // đã hỏng bộ nhớ đệm, trả 500 cho mọi trang.
  spawnSync('npx', ['astro', 'dev', 'stop'], { shell: true, stdio: 'ignore' });
}

// -----------------------------------------------------------------------------
async function main() {
  const i = process.argv.indexOf('--url');
  const gocTuyChon = i > -1 ? process.argv[i + 1] : null;

  let tienTrinh = null;
  let goc = gocTuyChon;

  if (!goc) {
    const macDinh = 'http://localhost:4321';
    if (await song(macDinh)) {
      goc = macDinh;
      console.log(`Dùng server đang chạy sẵn: ${goc}\n`);
    } else {
      console.log('Đang bật astro dev…');
      ({ p: tienTrinh, goc } = await batServer(4329));
      console.log(`Server lên ở ${goc}\n`);
    }
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
        if (!r.ok) {
          console.log(`  ✗ ${duong.padEnd(18)} HTTP ${r.status}`);
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
    if (tienTrinh) tatServer(tienTrinh);
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
