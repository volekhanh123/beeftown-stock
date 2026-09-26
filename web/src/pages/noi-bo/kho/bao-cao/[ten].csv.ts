/**
 * KHO — TẢI BÁO CÁO VỀ EXCEL
 *
 *   /noi-bo/kho/bao-cao/<xuat-nhap-ton|thu-hoi|hao-hut|ban>.csv?tu=&den=
 *   /noi-bo/kho/bao-cao/cong-no.csv
 *   /noi-bo/kho/bao-cao/dinh-muc.csv?tu=&den=   (GĐ7b, 0038 — mọi vai xem kho;
 *        cột "Tiền lệch" chỉ khi người tải có quyền xem giá)
 *
 * Đi qua middleware như mọi đường /noi-bo — chưa đăng nhập thì bị chuyển về
 * trang đăng nhập. Dữ liệu lấy bằng client mang token của người đang dùng,
 * nên RLS vẫn quyết định họ thấy gì.
 *
 * Cột của file theo BAO_CAO trong lib/kho/bao-cao.ts — xuất – nhập – tồn có
 * thêm xuất khác và hao hụt (0032); định dạng file giữ như cũ.
 */
import type { APIRoute } from 'astro';
import { congNgay, duoc, homNayVn } from '../../../../lib/kho/chung.ts';
import { BAO_CAO, COT_CONG_NO, docBaoCao, kyBaoCao, taoCsv, tieuDeCsv, tinhTong } from '../../../../lib/kho/bao-cao.ts';
import { docCongNoPhieu, tenLoaiCongNo } from '../../../../lib/kho/cong-no.ts';
import { docBaoCaoDinhMuc, dinhNghiaDinhMuc, NGAY_TOI_DA_DINH_MUC } from '../../../../lib/kho/dinh-luong.ts';

export const GET: APIRoute = async ({ locals, params, url, cookies }) => {
  const phien = locals.phien;
  if (!phien) return new Response('Chưa đăng nhập', { status: 401 });
  const { client, nhanSu } = phien;
  const ten = params.ten ?? '';
  // Đối chiếu định mức (0038) mở cho mọi vai xem kho (thủ kho, NV quầy: chỉ kg).
  // Mọi file khác có tiền — chỉ vai xem giá.
  if (ten === 'dinh-muc' ? !duoc(nhanSu.vai_tro, 'xem') : !duoc(nhanSu.vai_tro, 'xem_gia')) {
    return new Response(ten === 'dinh-muc' ? 'Tài khoản không xem được kho' : 'Tài khoản không xem được báo cáo tiền', { status: 403 });
  }

  // Chi nhánh: cùng cách chọn với moTrangKho() — nhân sự theo chi nhánh của
  // mình, chủ nhà hàng theo chi nhánh đang chọn (cookie) hoặc chi nhánh đầu.
  const { data: ds } = await client.from('chi_nhanh').select('id, ma, ten').order('ma');
  const cacCn = (ds ?? []) as { id: string; ma: string; ten: string }[];
  const cn = nhanSu.chi_nhanh_id
    ? cacCn.find(c => c.id === nhanSu.chi_nhanh_id)
    : cacCn.find(c => c.ma === cookies.get('bt_kho_cn')?.value) ?? cacCn[0];
  if (!cn) return new Response('Chưa có chi nhánh', { status: 404 });

  const homNay = homNayVn();
  const { tu, den } = kyBaoCao(url.searchParams, homNay);
  let csv: string;
  let tenTep: string;
  if (ten === 'cong-no') {
    // Công nợ nhà cung cấp: cùng quyền với trang Công nợ (kế toán, quản lý, chủ).
    if (!duoc(nhanSu.vai_tro, 'ke_toan')) return new Response('Tài khoản không xem được công nợ nhà cung cấp', { status: 403 });
    try {
      // Không lọc = đọc HẾT mọi phiếu, từng trang một (không còn cắt ở 500 dòng).
      // Cột "Loại": nợ đầu kỳ (ND-) hay nhập mua — view công nợ không có cột loại.
      const dong = (await docCongNoPhieu(client, cn.id)).map(p => ({ ...p, loai_cong_no: tenLoaiCongNo(p) }));
      csv = taoCsv(COT_CONG_NO, dong as unknown as Record<string, unknown>[]);
    } catch {
      return new Response('Không đọc được công nợ', { status: 500 });
    }
    tenTep = `cong-no-${cn.ma}-${homNay}.csv`;
  } else if (ten === 'dinh-muc') {
    if (congNgay(tu, NGAY_TOI_DA_DINH_MUC) < den) return new Response('Khoảng ngày tối đa 1 năm', { status: 400 });
    const coGia = duoc(nhanSu.vai_tro, 'xem_gia');
    const dn = dinhNghiaDinhMuc(coGia);
    const kq = await docBaoCaoDinhMuc(client, cn.id, tu, den);
    if (kq.loi) return new Response(kq.loi, { status: 500 });
    const dong = kq.dong as unknown as Record<string, unknown>[];
    csv = taoCsv(dn.cot, dong, { tieuDe: tieuDeCsv(cn.ten, dn.ten, tu, den), tong: tinhTong(dn, dong) });
    tenTep = `kho-dinh-muc-${cn.ma}-${tu}-${den}.csv`;
  } else if (Object.hasOwn(BAO_CAO, ten)) {
    // Kỳ lấy từ form chọn ngày của trang Báo cáo (nút "Tải về Excel" gửi chính
    // form đó), nên luôn là hai ngày đang thấy trên màn hình.
    const dn = BAO_CAO[ten];
    const kq = await docBaoCao(client, ten, cn.id, tu, den);
    if (kq.loi) return new Response(kq.loi, { status: 500 });
    // Dòng đầu: chi nhánh · báo cáo · kỳ. Dòng cuối: tổng (cùng hàm với trang).
    csv = taoCsv(dn.cot, kq.dong, { tieuDe: tieuDeCsv(cn.ten, dn.ten, tu, den), tong: tinhTong(dn, kq.dong) });
    tenTep = `kho-${ten}-${cn.ma}-${tu}-${den}.csv`;
  } else {
    return new Response('Không có báo cáo này', { status: 404 });
  }

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${tenTep.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
      'cache-control': 'private, no-store',
    },
  });
};
