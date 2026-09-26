/**
 * KHO — TẢI BÁO CÁO VỀ EXCEL
 *
 *   /noi-bo/kho/bao-cao/<xuat-nhap-ton|thu-hoi|hao-hut|ban>.csv?tu=&den=
 *   /noi-bo/kho/bao-cao/cong-no.csv
 *   /noi-bo/kho/bao-cao/dinh-muc.csv?tu=&den=   (GĐ7b, 0038 — mọi vai xem kho;
 *        cột "Tiền lệch" chỉ khi người tải có quyền xem giá)
 *   /noi-bo/kho/bao-cao/ncc.csv?tu=&den=        (GĐ8a, 0039 — đánh giá nhà cung cấp;
 *        nhap hoặc xem_gia; giá TB, lệch hóa đơn, ngày trả tiền chỉ vai xem giá)
 *   /noi-bo/kho/bao-cao/theo-thang.csv?nam=     (GĐ8c, 0041 — mọi vai xem kho; cột tiền
 *        chỉ khi người tải xem giá)
 *   /noi-bo/kho/bao-cao/mua-hang.csv?tu=&den=&nhom=ncc|mat_hang   (GĐ8c — xem_gia)
 *   /noi-bo/kho/bao-cao/so-thanh-toan.csv?tu=&den=               (GĐ8c — ke_toan)
 *
 * Đi qua middleware như mọi đường /noi-bo — chưa đăng nhập thì bị chuyển về
 * trang đăng nhập. Dữ liệu lấy bằng client mang token của người đang dùng,
 * nên RLS vẫn quyết định họ thấy gì.
 *
 * Cột của file theo BAO_CAO trong lib/kho/bao-cao.ts — xuất – nhập – tồn có
 * thêm xuất khác và hao hụt (0032); định dạng file giữ như cũ.
 *
 * Hai thứ tiếng: tên cột, nhãn (loại, nguồn, dòng tổng) và câu lỗi theo ngôn
 * ngữ người tải (locals.nn, mặc định tiếng Việt). Khuôn file không đổi: BOM,
 * dấu chấm phẩy, kg dấu phẩy thập phân, tên file. File đánh giá NCC lấy cột từ
 * lib/kho/dat-hang.ts (gói nhập hàng).
 */
import type { APIRoute } from 'astro';
import { congNgay, duoc, homNayVn, nhanKho, TEN_LOAI_PHIEU_NHAP_NB } from '../../../../lib/kho/chung.ts';
import {
  BAO_CAO_NB, COT_CONG_NO_NB, docBaoCao, kyBaoCao, taoCsv, tieuDeCsv, tinhTong,
  DN_SO_THANH_TOAN_NB, NGAY_TOI_DA_KY, dinhNghiaMuaHang, dinhNghiaTheoThang, docMuaHang, docSoThanhToan, docTheoThang, namBaoCao,
} from '../../../../lib/kho/bao-cao.ts';
import { docCongNoPhieu, laNoDau } from '../../../../lib/kho/cong-no.ts';
import { docBaoCaoDinhMuc, dinhNghiaDinhMuc, NGAY_TOI_DA_DINH_MUC } from '../../../../lib/kho/dinh-luong.ts';
import { docDanhGiaNcc, dinhNghiaDanhGiaNcc } from '../../../../lib/kho/dat-hang.ts';
import { dichNB, nnCua } from '../../../../lib/ngon-ngu-noi-bo.ts';
import { dichCau } from '../../../../lib/cau-noi-bo.ts';

export const GET: APIRoute = async ({ locals, params, url, cookies }) => {
  const nn = nnCua({ locals });
  const t = dichNB(nn, {
    chuaDangNhap: { vi: 'Chưa đăng nhập', en: 'Not logged in' },
    khongXemKho: { vi: 'Tài khoản không xem được kho', en: 'This account cannot view inventory' },
    khongXemSoTt: { vi: 'Tài khoản không xem được sổ thanh toán', en: 'This account cannot view the payments ledger' },
    khongXemTien: { vi: 'Tài khoản không xem được báo cáo tiền', en: 'This account cannot view money reports' },
    chuaCoCn: { vi: 'Chưa có chi nhánh', en: 'No branch yet' },
    khongXemCongNo: { vi: 'Tài khoản không xem được công nợ nhà cung cấp', en: 'This account cannot view supplier payables' },
    khongDocCongNo: { vi: 'Không đọc được công nợ', en: 'Could not read payables' },
    kyToiDa: { vi: 'Khoảng ngày tối đa 1 năm', en: 'The date range can be at most 1 year' },
    nam: { vi: (n: number) => `Năm ${n}`, en: (n: number) => `Year ${n}` },
    khongCo: { vi: 'Không có báo cáo này', en: 'There is no such report' },
  });
  /** Câu lỗi từ thư viện / database (tiếng Việt) → ngôn ngữ người tải. */
  const loi = (cau: string, status: number) => new Response(dichCau(nn, cau), { status });

  const phien = locals.phien;
  if (!phien) return new Response(t.chuaDangNhap, { status: 401 });
  const { client, nhanSu } = phien;
  const ten = params.ten ?? '';
  // Đối chiếu định mức (0038) mở cho mọi vai xem kho (thủ kho, NV quầy: chỉ kg).
  // Mọi file khác có tiền — chỉ vai xem giá.
  // Đánh giá NCC (0039): cùng quyền với trang bao-cao/ncc (nhap hoặc xem_gia).
  if (ten === 'ncc') {
    if (!(duoc(nhanSu.vai_tro, 'nhap') || duoc(nhanSu.vai_tro, 'xem_gia'))) {
      return new Response(t.khongXemKho, { status: 403 });
    }
  } else if (ten === 'theo-thang') {
    // GĐ8c: theo tháng mở cho mọi vai xem kho (thủ kho, NV quầy: chỉ kg).
    if (!duoc(nhanSu.vai_tro, 'xem')) return new Response(t.khongXemKho, { status: 403 });
  } else if (ten === 'so-thanh-toan') {
    if (!duoc(nhanSu.vai_tro, 'ke_toan')) return new Response(t.khongXemSoTt, { status: 403 });
  } else if (ten === 'dinh-muc' ? !duoc(nhanSu.vai_tro, 'xem') : !duoc(nhanSu.vai_tro, 'xem_gia')) {
    return new Response(ten === 'dinh-muc' ? t.khongXemKho : t.khongXemTien, { status: 403 });
  }

  // Chi nhánh: cùng cách chọn với moTrangKho() — nhân sự theo chi nhánh của
  // mình, chủ nhà hàng theo chi nhánh đang chọn (cookie) hoặc chi nhánh đầu.
  const { data: ds } = await client.from('chi_nhanh').select('id, ma, ten').order('ma');
  const cacCn = (ds ?? []) as { id: string; ma: string; ten: string }[];
  const cn = nhanSu.chi_nhanh_id
    ? cacCn.find(c => c.id === nhanSu.chi_nhanh_id)
    : cacCn.find(c => c.ma === cookies.get('bt_kho_cn')?.value) ?? cacCn[0];
  if (!cn) return new Response(t.chuaCoCn, { status: 404 });

  const homNay = homNayVn();
  const { tu, den } = kyBaoCao(url.searchParams, homNay);
  let csv: string;
  let tenTep: string;
  if (ten === 'cong-no') {
    // Công nợ nhà cung cấp: cùng quyền với trang Công nợ (kế toán, quản lý, chủ).
    if (!duoc(nhanSu.vai_tro, 'ke_toan')) return new Response(t.khongXemCongNo, { status: 403 });
    try {
      // Không lọc = đọc HẾT mọi phiếu, từng trang một (không còn cắt ở 500 dòng).
      // Cột "Loại": nợ đầu kỳ (ND-) hay nhập mua — view công nợ không có cột loại.
      const dong = (await docCongNoPhieu(client, cn.id))
        .map(p => ({ ...p, loai_cong_no: nhanKho(TEN_LOAI_PHIEU_NHAP_NB, laNoDau(p) ? 'no_dau' : 'mua', nn) }));
      csv = taoCsv(COT_CONG_NO_NB[nn], dong as unknown as Record<string, unknown>[]);
    } catch {
      return new Response(t.khongDocCongNo, { status: 500 });
    }
    tenTep = `cong-no-${cn.ma}-${homNay}.csv`;
  } else if (ten === 'dinh-muc') {
    if (congNgay(tu, NGAY_TOI_DA_DINH_MUC) < den) return new Response(t.kyToiDa, { status: 400 });
    const coGia = duoc(nhanSu.vai_tro, 'xem_gia');
    const dn = dinhNghiaDinhMuc(coGia, nn);
    const kq = await docBaoCaoDinhMuc(client, cn.id, tu, den);
    if (kq.loi) return loi(kq.loi, 500);
    const dong = kq.dong as unknown as Record<string, unknown>[];
    csv = taoCsv(dn.cot, dong, { tieuDe: tieuDeCsv(cn.ten, dn.ten, tu, den), tong: tinhTong(dn, dong, nn) });
    tenTep = `kho-dinh-muc-${cn.ma}-${tu}-${den}.csv`;
  } else if (ten === 'ncc') {
    if (congNgay(tu, 366) < den) return new Response(t.kyToiDa, { status: 400 });
    const dn = dinhNghiaDanhGiaNcc(duoc(nhanSu.vai_tro, 'xem_gia'), nn);
    const kq = await docDanhGiaNcc(client, cn.id, tu, den);
    if (kq.loi) return loi(kq.loi, 500);
    const dong = kq.dong as unknown as Record<string, unknown>[];
    csv = taoCsv(dn.cot, dong, { tieuDe: tieuDeCsv(cn.ten, dn.ten, tu, den), tong: tinhTong(dn, dong, nn) });
    tenTep = `kho-danh-gia-ncc-${cn.ma}-${tu}-${den}.csv`;
  } else if (ten === 'theo-thang') {
    const nam = namBaoCao(url.searchParams, homNay);
    const dn = dinhNghiaTheoThang(duoc(nhanSu.vai_tro, 'xem_gia'), nn);
    const kq = await docTheoThang(client, cn.id, nam, nn);
    if (kq.loi) return loi(kq.loi, 500);
    const dong = kq.dong as unknown as Record<string, unknown>[];
    csv = taoCsv(dn.cot, dong, { tieuDe: [cn.ten, dn.ten, t.nam(nam)].join(' · '), tong: tinhTong(dn, dong, nn) });
    tenTep = `kho-theo-thang-${cn.ma}-${nam}.csv`;
  } else if (ten === 'mua-hang') {
    if (congNgay(tu, NGAY_TOI_DA_KY) < den) return new Response(t.kyToiDa, { status: 400 });
    const nhom = url.searchParams.get('nhom') === 'mat_hang' ? 'mat_hang' : 'ncc';
    const dn = dinhNghiaMuaHang(nhom, nn);
    const kq = await docMuaHang(client, cn.id, tu, den, nhom);
    if (kq.loi) return loi(kq.loi, 500);
    csv = taoCsv(dn.cot, kq.dong, { tieuDe: tieuDeCsv(cn.ten, dn.ten, tu, den), tong: tinhTong(dn, kq.dong, nn) });
    tenTep = `kho-mua-hang-${nhom}-${cn.ma}-${tu}-${den}.csv`;
  } else if (ten === 'so-thanh-toan') {
    if (congNgay(tu, NGAY_TOI_DA_KY) < den) return new Response(t.kyToiDa, { status: 400 });
    const kq = await docSoThanhToan(client, cn.id, tu, den, nn);
    if (kq.loi) return loi(kq.loi, 500);
    const dn = DN_SO_THANH_TOAN_NB[nn];
    csv = taoCsv(dn.cot, kq.dong, { tieuDe: tieuDeCsv(cn.ten, dn.ten, tu, den), tong: tinhTong(dn, kq.dong, nn) });
    tenTep = `kho-so-thanh-toan-${cn.ma}-${tu}-${den}.csv`;
  } else if (Object.hasOwn(BAO_CAO_NB, ten)) {
    // Kỳ lấy từ form chọn ngày của trang Báo cáo (nút "Tải về Excel" gửi chính
    // form đó), nên luôn là hai ngày đang thấy trên màn hình.
    const dn = BAO_CAO_NB[ten][nn];
    const kq = await docBaoCao(client, ten, cn.id, tu, den, nn);
    if (kq.loi) return loi(kq.loi, 500);
    // Dòng đầu: chi nhánh · báo cáo · kỳ. Dòng cuối: tổng (cùng hàm với trang).
    csv = taoCsv(dn.cot, kq.dong, { tieuDe: tieuDeCsv(cn.ten, dn.ten, tu, den), tong: tinhTong(dn, kq.dong, nn) });
    tenTep = `kho-${ten}-${cn.ma}-${tu}-${den}.csv`;
  } else {
    return new Response(t.khongCo, { status: 404 });
  }

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${tenTep.replace(/[^a-zA-Z0-9._-]/g, '_')}"`,
      'cache-control': 'private, no-store',
    },
  });
};
