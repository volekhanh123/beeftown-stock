/**
 * KHO — TẢI FILE MISA (GĐ8b, migration 0040)
 *
 *   /noi-bo/kho/cong-no/misa.csv?tu=&den=&loai=mua_hang|thanh_toan&ngan=phay
 *
 * Dữ liệu: kho_du_lieu_misa (dòng phẳng, TK lấy từ cài đặt misa_tk). Cột và
 * định dạng file: lib/kho/misa.ts (COT_MISA — "CHỈNH KHI CÓ FILE MẪU"). CSV
 * UTF-8 có BOM, ngăn cột bằng ";" (mặc định, Excel tiếng Việt) hoặc ",".
 * Cùng quyền với trang Công nợ (ke_toan). Đi qua middleware như mọi đường
 * /noi-bo; dữ liệu đọc bằng client mang token của người tải (RLS quyết định).
 */
import type { APIRoute } from 'astro';
import { duoc, homNayVn } from '../../../../lib/kho/chung.ts';
import { docDuLieuMisa } from '../../../../lib/kho/cong-no.ts';
import { docBoLocMisa, taoCsvMisa, tenTepMisa } from '../../../../lib/kho/misa.ts';

export const GET: APIRoute = async ({ locals, url, cookies }) => {
  const phien = locals.phien;
  if (!phien) return new Response('Chưa đăng nhập', { status: 401 });
  const { client, nhanSu } = phien;
  if (!duoc(nhanSu.vai_tro, 'ke_toan')) return new Response('Tài khoản không xuất được dữ liệu kế toán', { status: 403 });

  // Chi nhánh: cùng cách chọn với moTrangKho() (như bao-cao/[ten].csv.ts).
  const { data: ds } = await client.from('chi_nhanh').select('id, ma, ten').order('ma');
  const cacCn = (ds ?? []) as { id: string; ma: string; ten: string }[];
  const cn = nhanSu.chi_nhanh_id
    ? cacCn.find(c => c.id === nhanSu.chi_nhanh_id)
    : cacCn.find(c => c.ma === cookies.get('bt_kho_cn')?.value) ?? cacCn[0];
  if (!cn) return new Response('Chưa có chi nhánh', { status: 404 });

  const loc = docBoLocMisa(url.searchParams, homNayVn());
  let csv: string;
  try {
    csv = taoCsvMisa(loc.loai, await docDuLieuMisa(client, cn.id, loc.tu, loc.den, loc.loai), { ngan: loc.ngan });
  } catch (e) {
    const cau = (e as { message?: string })?.message ?? 'Không đọc được dữ liệu';
    return new Response(cau, { status: 400 });
  }
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${tenTepMisa(loc.loai, cn.ma, loc.tu, loc.den)}"`,
      'cache-control': 'private, no-store',
    },
  });
};
