/**
 * KHO — TẢI FILE NHẬP MÓN CHO FABi (.xlsx, "Thêm món từ file")
 *
 *   /noi-bo/kho/ban-ipos/mon-fabi.xlsx   (quyền danh_muc: quản lý, chủ)
 *
 * Đúng sheet "Menu" của mẫu create-item.xlsx của FABi: món cân (mã cân), ô mã, mã giảm chưa thấy trên FABi —
 * Mã món = Mã barcode = mã đệm đủ 5 số, đơn vị KG, giá/kg của kho. Nội dung, quyền, câu lỗi và tên file ở
 * taoTepNhapFabi (lib/kho/thu-ngan.ts, có kiểm thử); route chỉ mở phiên bằng moKhoTai và trả file. Đọc lỗi →
 * 500 kèm câu; không có món mới → câu, không file rỗng.
 */
import type { APIRoute } from 'astro';
import { moKhoTai } from '../../../../lib/kho/trang.ts';
import { taoTepNhapFabi } from '../../../../lib/kho/thu-ngan.ts';
import { KIEU_XLSX } from '../../../../lib/kho/tep-excel.ts';

export const GET: APIRoute = async (ctx) => {
  const k = await moKhoTai(ctx);
  if (k instanceof Response) return k;
  const { client, nhanSu, chiNhanh, nn } = k;
  const tep = await taoTepNhapFabi(client, { vai: nhanSu.vai_tro, chiNhanh, nn });
  if (tep.status !== 200 || !tep.tenTep || typeof tep.noiDung === 'string') {
    return new Response(typeof tep.noiDung === 'string' ? tep.noiDung : '', {
      status: tep.status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'private, no-store' },
    });
  }
  return new Response(tep.noiDung, {
    headers: {
      'content-type': KIEU_XLSX,
      'content-disposition': `attachment; filename="${tep.tenTep.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
      'cache-control': 'private, no-store',
    },
  });
};
