/**
 * CHẶN CỬA /noi-bo
 *
 * Kiểm tra đăng nhập ở MỘT chỗ, không ở từng trang. Lý do đơn giản: trang
 * thứ bảy ai đó thêm vào sẽ quên mất dòng kiểm tra, và không có phép thử nào
 * bắt được chuyện quên đó. Ở đây thì trang mới tự động được bảo vệ, và muốn
 * mở ra ngoài phải sửa đúng file này — một việc cố ý, nhìn thấy trong diff.
 *
 * Trang công khai không đi qua đây.
 */

import { defineMiddleware } from 'astro:middleware';
import { layPhien, coDatabase } from './lib/phien';
import { dichBu, chayNen, denLuotDichBu, VAI_BIEN_TAP } from './lib/ban-dich';

const MO_CHO_MOI_NGUOI = ['/noi-bo/dang-nhap', '/noi-bo/dang-xuat'];

export const onRequest = defineMiddleware(async (context, next) => {
  const duong = context.url.pathname.replace(/\/$/, '') || '/';

  if (!duong.startsWith('/noi-bo')) return next();

  context.locals.coDatabase = coDatabase();

  if (MO_CHO_MOI_NGUOI.includes(duong)) return next();

  const phien = await layPhien(context.cookies);
  if (!phien) {
    // Không kèm đường dẫn cũ vào URL chuyển hướng. Một tham số ?tiep=... là
    // một lỗ open-redirect đang chờ người ta quên kiểm tra nó.
    return context.redirect('/noi-bo/dang-nhap', 302);
  }

  context.locals.phien = phien;

  // DỊCH BÙ, CHẠY NỀN — những chỗ không đi qua nút Lưu của màn soạn: sửa thẳng
  // trong Supabase Studio, hoặc lần dịch trước bị lỗi. Chỉ vai biên tập (vai
  // khác không sửa được nội dung, nên RLS cũng không cho ghi bản dịch), chỉ
  // lượt GET (lượt POST lưu tin đã tự dịch dòng của nó), và tối đa một lượt
  // mỗi phút. Không bao giờ làm chậm trang: trang trả về trước, dịch sau.
  if (context.request.method === 'GET'
      && VAI_BIEN_TAP.includes(phien.nhanSu.vai_tro)
      && denLuotDichBu()) {
    chayNen(context.locals, dichBu(phien.client));
  }

  return next();
});
