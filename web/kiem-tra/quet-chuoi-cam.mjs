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

import { spawn } from 'node:child_process';
import { setTimeout as cho } from 'node:timers/promises';

// -----------------------------------------------------------------------------
// DANH SÁCH CẤM
// -----------------------------------------------------------------------------
// Mỗi dòng kèm LÝ DO. Khi phép thử đỏ, người đọc cần biết vì sao câu đó bị
// cấm — nếu không họ sẽ xóa từ đó đi và viết lại cùng ý bằng chữ khác.
// -----------------------------------------------------------------------------
const CAM = [
  { re: /unsplash|pexels|shutterstock/i,
    vi_sao: 'Ảnh kho. Mọi ảnh phải là ảnh thật, khai nguồn trong bảng tep_anh.' },
  { re: /0900[\s.]?000/i,
    vi_sao: 'Hotline mẫu của bản nháp cũ. Số thật vào khóa hotline trong cổng nội dung.' },
  { re: /\[s(ố|o) nh(à|a)\]|\[t(ê|e)n đường\]|\[placeholder\]/i,
    vi_sao: 'Chỗ trống chưa điền lọt ra trang. Chưa có địa chỉ thì ẨN, không hiện ngoặc vuông.' },
  { re: /wagyu|\bMB\s?9\b|\bA5\b/i,
    vi_sao: 'Grade và giống bò chưa được xác nhận. Tài liệu thương hiệu cấm tự thêm.' },
  { re: /229[.,]000|199[.,]000/,
    vi_sao: 'Giá của một chiến dịch chưa duyệt. Không giá nào trong CSV nguồn được duyệt.' },
  { re: /43\s?ng(à|a)y|ủ\s?\d+\s?ng(à|a)y/i,
    vi_sao: 'Số ngày ủ là một claim cụ thể chưa ai xác nhận.' },
  { re: /than\s?hoa|than\s?củi/i,
    vi_sao: 'Nhà hàng nướng bằng vỉ gas, không phải than.' },
  { re: /ph(ò|o)ng\s?ri(ê|e)ng|private\s+room/i,
    vi_sao: 'Tiện ích chưa xác nhận. Hứa trên web rồi khách tới không có là lỗi nặng nhất.' },
  { re: /rẻ hơn|giá tốt hơn|tiết kiệm \d+%|cheaper than/i,
    vi_sao: 'Tài liệu thương hiệu cấm lấy lợi thế giá làm hook.' },
  { re: /số một|s(ố|o) 1 (về|ve)|duy nhất tại|best beef|ngon nhất|tốt nhất/i,
    vi_sao: 'Claim so sánh nhất, không chứng minh được và vi phạm quảng cáo.' },
  { re: /đặt bàn thành công|booking confirmed/i,
    vi_sao: 'Yêu cầu đặt bàn KHÁC với bàn đã giữ. Chỉ nói "đã nhận yêu cầu".' },
  { re: /c(ò|o)n \d+ b(à|a)n|chỉ c(ò|o)n \d+|only \d+ (tables?|seats?) left/i,
    vi_sao: 'Hook khan hiếm. Số bàn trống bị chặn ở tầng server, không được tới trình duyệt.' },
  { re: /\d+(\.\d{3})+\s?(đ|vnđ|vnd)/i,
    vi_sao: 'Giá tiền. Chưa món nào có gia_da_duyet = true.' },
];

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

function quet(chu) {
  const thay = [];
  for (const { re, vi_sao } of CAM) {
    const m = chu.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'));
    if (m) thay.push({ tim_thay: [...new Set(m)].slice(0, 3).join(' · '), vi_sao });
  }
  return thay;
}

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
  throw new Error(`astro dev không lên sau 60 giây ở cổng ${cong}`);
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
