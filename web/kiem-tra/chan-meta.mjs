/**
 * META PIXEL TRONG KIỂM THỬ TRÌNH DUYỆT — chặn Meta, hoặc thay fbevents.js bằng bản ghi lời gọi
 * ==============================================================================================
 * Trang công khai có Meta Pixel (web/src/lib/meta-pixel.ts). CI có Internet: không chặn thì mỗi lượt CI gửi hàng trăm
 * PageView từ http://127.0.0.1 lên Beeftown Pixel THẬT — số đo quảng cáo sai, và màn Thử nghiệm sự kiện khó đọc. Nên
 * trinh-duyet.mjs và thu-day-du.mjs mở Chromium bằng moChromium(): MỌI context chặn connect.facebook.net và
 * www.facebook.com ngay từ lượt tải đầu, kiểu trình chặn quảng cáo (net::ERR_BLOCKED_BY_CLIENT).
 *
 * Chặn cũng là phép thử: mọi nhóm của hai file đó chạy với Meta bị chặn — trang, form hỏi bàn, Mua thịt về phải chạy
 * đủ khi khách chặn quảng cáo hay mất mạng tới Meta. Lời gọi fbq lúc đó nằm nguyên trong hàng đợi của mã gốc
 * (window.fbq.queue): docHangDoi đọc ra để kiểm sự kiện nào đã gửi, kèm gì.
 *
 * Context cần thấy lời gọi qua những lần chuyển trang (bấm "Xem đơn" là chuyển trang): ghiPixel() thay fbevents.js bằng
 * FBEVENTS_GIA — làm đúng việc của thư viện thật với hàng đợi nhưng không gửi gì, báo từng lời gọi về Node.
 */

/** Mọi địa chỉ của Meta mà Pixel gọi tới: connect.facebook.net (fbevents.js), www.facebook.com/tr (lượt đo). */
export const MAU_META = /^https?:\/\/(?:[a-z0-9-]+\.)*(?:facebook\.net|facebook\.com)(?::\d+)?\//i;

/**
 * Mở Chromium mà mọi context tạo ra sau đó (newContext, newPage) chặn Meta. Gắn ở trình duyệt, không ở từng context:
 * context mới thêm vào kiểm thử sau này tự được chặn — quên một chỗ là CI gửi lượt giả lên Pixel thật.
 */
export async function moChromium(chromium, tuyChon) {
  const trinhDuyet = await chromium.launch(tuyChon);
  const taoContext = trinhDuyet.newContext.bind(trinhDuyet);
  trinhDuyet.newContext = async (...thamSo) => {
    const ctx = await taoContext(...thamSo);
    await ctx.route(MAU_META, tuyen => tuyen.abort('blockedbyclient'));
    return ctx;
  };
  return trinhDuyet;
}

/**
 * fbevents.js giả: như thư viện thật, gắn fbq.callMethod rồi chạy lại mọi lời gọi đã xếp hàng; mỗi lời gọi ghi vào
 * window.__lenhPixel và báo về Node qua __baoPixel (exposeFunction — còn qua mọi lần chuyển trang). Không gửi gì đi.
 */
export const FBEVENTS_GIA = `(function () {
  var f = window.fbq;
  if (!f || f.callMethod) return;
  window.__lenhPixel = [];
  f.callMethod = function () {
    var lenh = JSON.parse(JSON.stringify(Array.prototype.slice.call(arguments)));
    window.__lenhPixel.push(lenh);
    if (typeof window.__baoPixel === 'function') window.__baoPixel(lenh);
  };
  var q = f.queue.splice(0);
  for (var i = 0; i < q.length; i++) f.callMethod.apply(f, q[i]);
})();`;

/**
 * Cho một context dùng fbevents.js giả thay vì bị chặn (route đăng ký sau thắng route chặn của moChromium); lượt đo
 * www.facebook.com/tr vẫn bị chặn. Trả về mảng nhận mọi lời gọi fbq của mọi trang trong context, theo thứ tự.
 */
export async function ghiPixel(ctx) {
  const lenh = [];
  await ctx.exposeFunction('__baoPixel', l => { lenh.push(l); });
  await ctx.route('https://connect.facebook.net/en_US/fbevents.js',
    tuyen => tuyen.fulfill({ status: 200, contentType: 'application/javascript', body: FBEVENTS_GIA }));
  return lenh;
}

/**
 * Chạy trong trang (page.evaluate): các lời gọi fbq còn trong hàng đợi của mã gốc — Meta bị chặn nên không gì lấy chúng
 * ra. Trang không có pixel → null.
 */
export function docHangDoi() {
  const f = window.fbq;
  return f && Array.isArray(f.queue) ? f.queue.map(a => JSON.parse(JSON.stringify(Array.from(a)))) : null;
}

/** Lời gọi gửi sự kiện (fbq('track', tên, tham số)) trong một danh sách lời gọi. */
export const suKienTrong = lenh => (lenh ?? []).filter(l => l[0] === 'track');
