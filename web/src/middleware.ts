/**
 * CHẶN CỬA /noi-bo
 *
 * Kiểm tra đăng nhập ở MỘT chỗ, không ở từng trang. Lý do đơn giản: trang
 * thứ bảy ai đó thêm vào sẽ quên mất dòng kiểm tra, và không có phép thử nào
 * bắt được chuyện quên đó. Ở đây thì trang mới tự động được bảo vệ, và muốn
 * mở ra ngoài phải sửa đúng file này — một việc cố ý, nhìn thấy trong diff.
 *
 * Cùng lý do, tài khoản HỌC VIÊN (0118, 0119 — tài khoản demo của buổi đào
 * tạo) bị giữ ở trang Video đào tạo ngay tại đây, không ở từng trang: trang
 * /noi-bo hay /noi-bo/kho thêm sau này tự được chặn với học viên.
 *
 * Trang công khai không đi qua đây.
 *
 * Cũng vì là một chỗ, đây là nơi gắn header bảo vệ cho MỌI trả lời của /noi-bo
 * (không vào bộ đệm dùng chung, không cho nhúng vào khung — lib/header-noi-bo.ts): onRequest
 * chỉ có hai lối ra, và lối của /noi-bo luôn đi qua datHeaderNoiBo. Lượt nào vừa kết thúc một
 * phiên (xoaToken đã chạy — lib/phien.ts) thì trả lời còn kèm lệnh bảo trình duyệt bỏ bản lưu đệm.
 */

import { defineMiddleware } from 'astro:middleware';
import type { APIContext, MiddlewareNext } from 'astro';
import { layPhien, coDatabase, phienVuaKetThuc } from './lib/phien';
import { QUA_TAI, trangQuaTai, trangChuaGhi, DUONG_CHUA_GHI, COOKIE_CHUA_GHI } from './lib/qua-tai';
import { datHeaderNoiBo } from './lib/header-noi-bo';
import { dichBu, chayNen, denLuotDichBu, VAI_BIEN_TAP } from './lib/ban-dich';
import { docNgonNguNB, ghiNgonNguNB, laNgonNguNB } from './lib/ngon-ngu-noi-bo';
import { chuyenHuongHocVien } from './lib/dieu-huong-noi-bo';

const MO_CHO_MOI_NGUOI = ['/noi-bo/dang-nhap', '/noi-bo/dang-xuat'];

export const onRequest = defineMiddleware(async (context, next) => {
  const duong = context.url.pathname.replace(/\/$/, '') || '/';

  if (!duong.startsWith('/noi-bo')) return next();
  return datHeaderNoiBo(await canhNoiBo(context, next, duong), { xoaBoDem: phienVuaKetThuc(context.cookies) });
});

/** Phần canh cửa của /noi-bo. Mọi câu return ở đây đều ra ngoài qua datHeaderNoiBo của onRequest. */
async function canhNoiBo(context: APIContext, next: MiddlewareNext, duong: string): Promise<Response> {
  // ĐỔI NGÔN NGỮ (lib/ngon-ngu-noi-bo.ts): nút "English" / "Tiếng Việt" là
  // link ?nn=… tới chính trang đang mở. Ghi cookie rồi chuyển về đúng đường
  // dẫn đó, bỏ ?nn= — đích chuyển luôn là đường dẫn /noi-bo của chính request,
  // nên không có open-redirect. Đứng TRƯỚC kiểm tra đăng nhập: trang đăng nhập
  // cũng đổi được tiếng.
  const doiNgonNgu = context.url.searchParams.get('nn');
  if (context.request.method === 'GET' && laNgonNguNB(doiNgonNgu)) {
    ghiNgonNguNB(context.cookies, doiNgonNgu);
    const ve = new URL(context.url);
    ve.searchParams.delete('nn');
    return context.redirect(ve.pathname + ve.search, 303);
  }
  context.locals.nn = docNgonNguNB(context.cookies);

  context.locals.coDatabase = coDatabase();

  // Trang báo "thao tác vừa gửi CHƯA được ghi" (lib/qua-tai.ts): trang "hệ thống đang bận" của một lượt POST tự thay
  // mục lịch sử của nó bằng trang này (issue #194). Không hỏi Supabase — nó hiện ra đúng lúc Supabase bận — và không
  // mang gì của phiên hay của form; cookie chỉ cho biết trang vừa gửi, để nút "Tải lại trang" về đúng chỗ.
  if (duong === DUONG_CHUA_GHI) return trangChuaGhi(context.locals.nn ?? 'vi', context.cookies.get(COOKIE_CHUA_GHI)?.value);

  if (MO_CHO_MOI_NGUOI.includes(duong)) return next();

  const phien = await layPhien(context.cookies);
  if (phien === QUA_TAI) {
    // Supabase bận / mất mạng: KHÔNG đưa về trang đăng nhập (người ta sẽ đăng
    // nhập lại, thêm một lượt vào đúng hạn mức đang cạn). Cookie còn nguyên;
    // GET tự tải lại sau 5–10 giây (ngẫu nhiên), POST báo rõ là CHƯA ghi.
    return trangQuaTai(context.locals.nn ?? 'vi', context.request.method === 'POST', context.url);
  }
  if (!phien) {
    // Không kèm đường dẫn cũ vào URL chuyển hướng. Một tham số ?tiep=... là
    // một lỗ open-redirect đang chờ người ta quên kiểm tra nó.
    return context.redirect('/noi-bo/dang-nhap', 302);
  }

  context.locals.phien = phien;

  // HỌC VIÊN: chỉ trang Video đào tạo (lib/dieu-huong-noi-bo.ts). Đứng TRƯỚC
  // next(): trang khác — kể cả lượt POST, file tải về của kho, trang 404 —
  // không chạy dòng nào. Database cũng chỉ cho vai này đọc video_dao_tao
  // (0119); dòng này để học viên không lạc vào trang toàn ô trống.
  const veDaoTao = chuyenHuongHocVien(phien.nhanSu.vai_tro, duong);
  if (veDaoTao) return context.redirect(veDaoTao, 302);

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
}
