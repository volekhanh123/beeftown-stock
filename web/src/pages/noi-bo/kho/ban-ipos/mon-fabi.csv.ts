/**
 * KHO — TẢI DANH SÁCH MÓN CẦN CÓ TRÊN FABi
 *
 *   /noi-bo/kho/ban-ipos/mon-fabi.csv   (quyền danh_muc: quản lý, chủ)
 *
 * Mỗi ô mã và mỗi mã giảm đang bật một dòng: tên món gợi ý, mã món = mã vạch = mã ô / mã giảm,
 * bán theo kg, giá/kg (mã giảm: giá đã giảm), đối chiếu thực đơn iPOS. Nội dung, quyền, câu lỗi và
 * tên file ở taoTepMonFabi (lib/kho/thu-ngan.ts, có kiểm thử); route chỉ mở phiên bằng moKhoTai
 * (phiên, tự khóa máy dùng chung, chi nhánh) và trả file. Đọc lỗi → 500 kèm câu, không file rỗng.
 */
import type { APIRoute } from 'astro';
import { moKhoTai } from '../../../../lib/kho/trang.ts';
import { taoTepMonFabi } from '../../../../lib/kho/thu-ngan.ts';

export const GET: APIRoute = async (ctx) => {
  const k = await moKhoTai(ctx);
  if (k instanceof Response) return k;
  const { client, nhanSu, chiNhanh, nn } = k;
  const tep = await taoTepMonFabi(client, { vai: nhanSu.vai_tro, chiNhanh, nn });
  if (tep.status !== 200 || !tep.tenTep) {
    return new Response(tep.noiDung, {
      status: tep.status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'private, no-store' },
    });
  }
  return new Response(tep.noiDung, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${tep.tenTep.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
      'cache-control': 'private, no-store',
    },
  });
};
