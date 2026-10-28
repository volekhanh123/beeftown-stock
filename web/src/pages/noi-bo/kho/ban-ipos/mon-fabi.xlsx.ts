/**
 * KHO — TẢI FILE NHẬP MÓN CHO FABi (.xlsx, "Thêm món từ file")
 *
 *   /noi-bo/kho/ban-ipos/mon-fabi.xlsx               (quyền danh_muc: quản lý, chủ)
 *   /noi-bo/kho/ban-ipos/mon-fabi.xlsx?da_co=1011,…  (Mở rộng FABi — mo-rong-fabi/)
 *
 * Đúng sheet "Menu" của mẫu create-item.xlsx của FABi: món cân (mã cân), ô mã, mã giảm chưa thấy trên FABi —
 * Mã món = Mã barcode = mã đệm đủ 5 số, đơn vị KG, giá/kg của kho. Nội dung, quyền, câu lỗi và tên file ở
 * taoTepNhapFabi (lib/kho/thu-ngan.ts, có kiểm thử); route chỉ mở phiên bằng moKhoTai và trả file. Đọc lỗi →
 * 500 kèm câu; không có món mới → câu, không file rỗng.
 *
 * `da_co`: mã món toàn số đang có trên FABi, Mở rộng FABi đọc ở bảng món của FABi CMS — món mang mã đó không vào
 * file (FABi chỉ THÊM món từ file: đưa lại là hai món một mã). Sai dạng → 400, không đoán. Ba header cho
 * extension: x-so-mon (số món trong file), x-so-da-co (số món bỏ ra vì đã có trên FABi), x-chi-nhanh (mã chi nhánh
 * kho đang chọn, mã hóa URL — extension ghi ra để chủ nhiều chi nhánh thấy file của chi nhánh nào). Chỉ GET, không
 * ghi gì.
 */
import type { APIRoute } from 'astro';
import { moKhoTai } from '../../../../lib/kho/trang.ts';
import { cauMaDaCoSai, docMaDaCoFabi, taoTepNhapFabi } from '../../../../lib/kho/thu-ngan.ts';
import { KIEU_XLSX } from '../../../../lib/kho/tep-excel.ts';

export const GET: APIRoute = async (ctx) => {
  const k = await moKhoTai(ctx);
  if (k instanceof Response) return k;
  const { client, nhanSu, chiNhanh, nn } = k;
  const coDaCo = ctx.url.searchParams.has('da_co');
  const daCo = docMaDaCoFabi(ctx.url.searchParams.get('da_co'));
  if (daCo === null) {
    return new Response(cauMaDaCoSai(nn), {
      status: 400, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'private, no-store' },
    });
  }
  const tep = await taoTepNhapFabi(client, { vai: nhanSu.vai_tro, chiNhanh, nn, daCoTrenFabi: coDaCo ? daCo : null });
  const dem = { 'x-so-mon': String(tep.soMon), 'x-so-da-co': String(tep.soDaCo), 'x-chi-nhanh': encodeURIComponent(chiNhanh.ma) };
  if (tep.status !== 200 || !tep.tenTep || typeof tep.noiDung === 'string') {
    return new Response(typeof tep.noiDung === 'string' ? tep.noiDung : '', {
      status: tep.status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'private, no-store', ...dem },
    });
  }
  return new Response(tep.noiDung, {
    headers: {
      'content-type': KIEU_XLSX,
      'content-disposition': `attachment; filename="${tep.tenTep.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
      'cache-control': 'private, no-store',
      ...dem,
    },
  });
};
