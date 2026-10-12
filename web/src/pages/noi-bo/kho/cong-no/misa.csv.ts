/**
 * KHO — TẢI FILE MISA (GĐ8b, migration 0040)
 *
 *   /noi-bo/kho/cong-no/misa.csv?tu=&den=&loai=mua_hang|thanh_toan&ngan=phay
 *
 * Dữ liệu: kho_du_lieu_misa (dòng phẳng, TK lấy từ cài đặt misa_tk). Cột và
 * định dạng file: lib/kho/misa.ts (COT_MISA — "CHỈNH KHI CÓ FILE MẪU"). CSV
 * UTF-8 có BOM, ngăn cột bằng ";" (mặc định, Excel tiếng Việt) hoặc ",".
 * Cùng quyền với trang Công nợ (ke_toan). Đi qua middleware như mọi đường
 * /noi-bo; mở bằng moKhoTai (phiên, tự khóa máy dùng chung, chi nhánh); dữ
 * liệu đọc bằng client mang token của người tải (RLS quyết định). Câu lỗi
 * theo ngôn ngữ người tải.
 */
import type { APIRoute } from 'astro';
import { cauLoiKho, duoc, homNayVn } from '../../../../lib/kho/chung.ts';
import { docDuLieuMisa } from '../../../../lib/kho/cong-no.ts';
import { docBoLocMisa, taoCsvMisa, tenTepMisa } from '../../../../lib/kho/misa.ts';
import { moKhoTai } from '../../../../lib/kho/trang.ts';
import { dichNB } from '../../../../lib/ngon-ngu-noi-bo.ts';
import { dichCau } from '../../../../lib/cau-noi-bo.ts';

export const GET: APIRoute = async (ctx) => {
  const k = await moKhoTai(ctx);
  if (k instanceof Response) return k;
  const { client, nhanSu, chiNhanh: cn, nn } = k;
  const t = dichNB(nn, {
    khongKeToan: { vi: 'Tài khoản không xuất được dữ liệu kế toán', en: 'This account cannot export accounting data' },
    khongDoc: { vi: 'Không đọc được dữ liệu', en: 'Could not read the data' },
  });
  if (!duoc(nhanSu.vai_tro, 'ke_toan')) return new Response(t.khongKeToan, { status: 403 });

  const loc = docBoLocMisa(ctx.url.searchParams, homNayVn());
  let csv: string;
  try {
    csv = taoCsvMisa(loc.loai, await docDuLieuMisa(client, cn.id, loc.tu, loc.den, loc.loai), { ngan: loc.ngan });
  } catch (e) {
    // Câu database / mất mạng → câu dễ hiểu (cauLoiKho), rồi theo ngôn ngữ người tải. Lỗi đọc là 500, không phải 400.
    return new Response(dichCau(nn, cauLoiKho(e, t.khongDoc)), { status: 500 });
  }
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${tenTepMisa(loc.loai, cn.ma, loc.tu, loc.den)}"`,
      'cache-control': 'private, no-store',
    },
  });
};
