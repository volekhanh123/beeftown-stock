/**
 * KHO — CÂU CHỮ CHO SỰ KIỆN THÔNG BÁO
 *
 * Database (kho_thong_bao, 0030) chỉ trả KHÓA + vài giá trị (số phiếu, tên, số
 * lượng, mốc thời gian). Câu tiếng Việt và đường dẫn "làm ngay" dựng ở đây —
 * sửa câu chữ không phải viết migration.
 *
 * File thuần: test kiểm mọi khóa database có thể trả về đều có câu ở đây.
 */

export type NhomSuKien = 'van_hanh' | 'nhac_nho' | 'he_thong';

export interface SuKien {
  khoa: string;
  nhom: NhomSuKien;
  ref_id: string | null;
  ref2: string | null;
  ma: string | null;
  ten: string | null;
  phu: string | null;
  so: number | string | null;
  luc: string;
  chua_doc?: boolean;
}

export interface CauSuKien {
  tieuDe: string;
  chiTiet?: string;
  link: string;
  /** Chữ trên nút làm ngay. */
  nut: string;
  /** Mức độ: do = phải làm ngay, vang = nên làm sớm, xam = để biết. */
  muc: 'do' | 'vang' | 'xam';
}

export const TEN_NHOM: Record<NhomSuKien, string> = {
  van_hanh: 'Vận hành',
  nhac_nho: 'Nhắc nhở',
  he_thong: 'Hệ thống',
};

const soNguyen = (x: SuKien['so']) => (x === null || x === undefined ? null : Number(x));
const kg = (x: SuKien['so']) => {
  const n = soNguyen(x);
  return n === null ? '' : `${n.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} kg`;
};
const q = (o: Record<string, string | null | undefined>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]).toString();

/** Câu và đường dẫn cho một sự kiện. Khóa lạ: câu chung, không vỡ trang. */
export function cauSuKien(su: SuKien): CauSuKien {
  // Thiếu tên / mã (dữ liệu cũ, món đã xóa) thì để trống — không in chữ "null".
  const e = { ...su, ten: su.ten ?? '', ma: su.ma ?? '' };
  // Link tới trang nhà cung cấp: thiếu id thì về danh sách công nợ.
  const congNo = su.ref2 ? `/noi-bo/kho/cong-no/${su.ref2}` : '/noi-bo/kho/cong-no';
  switch (e.khoa) {
    case 'nhap_bi_tu_choi':
      // Người nhận hàng sửa ở màn chỉ kg (0031) — thủ kho không mở được trang nhập có tiền.
      return { tieuDe: `Phiếu nhập ${e.ma} bị trả về`, chiTiet: e.ten ? `Lý do: ${e.ten}` : undefined,
               link: `/noi-bo/kho/nhan-hang/${e.ref_id}`, nut: 'Sửa lại', muc: 'do' };
    case 'huy_bi_tu_choi':
      return { tieuDe: `Báo hủy ${e.ma} không được duyệt`,
               chiTiet: `${e.ten ? `Lý do: ${e.ten}. ` : ''}Hàng đã về lại chỗ cũ.`,
               link: `/noi-bo/kho/xuat/${e.ref_id}`, nut: 'Xem', muc: 'vang' };
    case 'kiem_ke_tra_ve':
      return { tieuDe: `Kiểm kê ${e.ma} cần đếm lại`, chiTiet: e.ten ? `Quản lý nhắn: ${e.ten}` : undefined,
               link: `/noi-bo/kho/kiem-ke/${e.ref_id}`, nut: 'Đếm lại', muc: 'do' };
    case 'het_han':
      return { tieuDe: `Hết hạn: ${e.ten}`,
               chiTiet: `Lô ${e.ma}${soNguyen(e.so) ? ` · còn ${soNguyen(e.so)} trên sổ` : ''}. Không bán, không đưa bếp — báo hủy.`,
               link: `/noi-bo/kho/xuat/moi?${q({ loai: 'huy', tu: e.ref2, lo: e.ref_id })}`, nut: 'Báo hủy', muc: 'do' };
    case 'sap_het_han':
      return e.phu === 'kho'
        ? { tieuDe: `Sắp hết hạn: ${e.ten}`, chiTiet: `Lô ${e.ma} — đưa ra quầy bán trước.`,
            link: `/noi-bo/kho/xuat/moi?${q({ loai: 'chuyen', tu: e.ref2, lo: e.ref_id })}`, nut: 'Ra quầy', muc: 'vang' }
        : { tieuDe: `Sắp hết hạn: ${e.ten}`, chiTiet: `Lô ${e.ma} — xếp lên phía trước quầy để bán trước, hoặc đưa bếp.`,
            link: `/noi-bo/kho/xuat/moi?${q({ loai: 'xuat_bep', tu: e.ref2, lo: e.ref_id })}`, nut: 'Đưa bếp', muc: 'vang' };
    case 'quay_duoi_muc':
      return { tieuDe: `Quầy sắp hết: ${e.ten}`, chiTiet: `Còn ${kg(e.so) || '0 kg'} bán được.`,
               link: `/noi-bo/kho/xuat/moi?${q({ loai: 'chuyen', mh: e.ref_id })}`, nut: 'Mang ra quầy', muc: 'vang' };
    case 'quay_chua_dem':
      return { tieuDe: `${e.ten || 'Quầy'}: chưa đếm cuối ngày hôm qua`,
               chiTiet: 'Chưa nối iPOS nên số đếm cuối ngày là số bán. Đếm và gửi ngay.',
               link: `/noi-bo/kho/quay/dem?${q({ vi_tri: e.ref_id })}`, nut: 'Đếm ngay', muc: 'do' };
    case 'cho_duyet_nhap':
      return { tieuDe: `Phiếu nhập ${e.ma} chờ điền giá, duyệt`, chiTiet: e.ten || undefined,
               link: `/noi-bo/kho/nhap/${e.ref_id}?tu=duyet`, nut: 'Điền giá', muc: 'vang' };
    case 'cho_duyet_huy':
      return { tieuDe: `Báo hủy ${e.ma} chờ duyệt`, chiTiet: e.ten ? `Ở ${e.ten}` : undefined,
               link: `/noi-bo/kho/xuat/${e.ref_id}`, nut: 'Duyệt', muc: 'vang' };
    case 'cho_duyet_kiem_ke':
      return { tieuDe: `Kiểm kê ${e.ma} chờ duyệt`, chiTiet: e.ten || undefined,
               link: `/noi-bo/kho/kiem-ke/${e.ref_id}`, nut: 'Duyệt', muc: 'vang' };
    case 'cong_no_qua_han':
      return { tieuDe: `Nợ quá hạn${soNguyen(e.so) ? ` ${soNguyen(e.so)} ngày` : ''}: ${e.ma}`,
               chiTiet: e.ten || undefined, link: congNo, nut: 'Trả tiền', muc: 'do' };
    case 'cong_no_den_han': {
      const n = soNguyen(e.so) ?? 0;
      return { tieuDe: `${n === 0 ? 'Đến hạn trả hôm nay' : `Đến hạn trả trong ${n} ngày`}: ${e.ma}`,
               chiTiet: e.ten || undefined, link: congNo, nut: 'Xem', muc: 'vang' };
    }
    case 'chua_doi_chieu':
      return { tieuDe: `Chưa đối chiếu hóa đơn: ${e.ma}`, chiTiet: e.ten || undefined,
               link: congNo, nut: 'Đối chiếu', muc: 'xam' };
    case 'pha_nhap_lau':
      return { tieuDe: `Phiên pha lóc ${e.ma} để nháp hơn một ngày`,
               chiTiet: `${e.ten || ''} — chốt hoặc hủy để kiểm kê không bị chặn.`,
               link: `/noi-bo/kho/pha-loc/${e.ref_id}`, nut: 'Mở', muc: 'vang' };
    // ---- 0032 · Quầy yêu cầu → thủ kho mang ra → quầy bấm nhận ------------
    case 'yeu_cau_quay': {
      // Thủ kho: so = số món quầy cần.
      const n = soNguyen(e.so);
      return { tieuDe: `${e.ten || 'Quầy'} cần hàng: ${e.ma}`,
               chiTiet: n ? `${n} món — mang ra quầy, lấy hàng hạn gần trước.` : 'Mang ra quầy, lấy hàng hạn gần trước.',
               link: `/noi-bo/kho/quay/yeu-cau/${e.ref_id}`, nut: 'Mang ra', muc: 'vang' };
    }
    case 'hang_dang_chuyen': {
      // NV quầy: so = số gói đang mang ra. Quá giờ nhắc (phu = 'qua_gio') thì đỏ.
      const n = soNguyen(e.so);
      const quaGio = e.phu === 'qua_gio';
      return { tieuDe: `${quaGio ? 'Chưa bấm nhận' : 'Hàng đang mang ra'}${e.ten ? ` ${e.ten}` : ' quầy'}: ${e.ma}`,
               chiTiet: `${n ? `${n} gói. ` : ''}${quaGio ? 'Đã quá giờ — ' : ''}Kiểm hàng rồi bấm "Đã nhận đủ", thiếu thì ghi số thực nhận.`,
               link: '/noi-bo/kho/quay/nhan', nut: 'Nhận hàng', muc: quaGio ? 'do' : 'vang' };
    }
    case 'chuyen_nhan_thieu': {
      // Quản lý: so = số gói quầy nhận thiếu.
      const n = soNguyen(e.so);
      return { tieuDe: `${e.ten || 'Quầy'} nhận thiếu: ${e.ma}`,
               chiTiet: `${n ? `Thiếu ${n} gói. ` : ''}Hàng còn ở kho thì trả về kho; rơi vỡ, thất lạc thì ghi mất.`,
               link: `/noi-bo/kho/xuat/${e.ref_id}`, nut: 'Xử lý', muc: 'do' };
    }
    // ---- 0033 · Pha lóc thu hồi thấp hơn dự kiến (không duyệt, chỉ báo) ------
    case 'thu_hoi_thap': {
      // Quản lý: so = thu hồi %, phu = dự kiến % (chữ số dấu chấm), ten = tên tảng.
      const pt = (x: number | string | null) => {
        const n = x === null || x === '' ? NaN : Number(x);
        return Number.isFinite(n) ? `${n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%` : '';
      };
      const thuHoi = pt(e.so);
      const duKien = pt(e.phu);
      return { tieuDe: `Pha lóc ${e.ma} thu hồi thấp${thuHoi ? `: ${thuHoi}` : ''}`,
               chiTiet: [e.ten, duKien ? `dự kiến ${duKien}` : ''].filter(Boolean).join(' — ')
                 + '. Xem lại số cân rồi bấm "Đã xem".',
               link: `/noi-bo/kho/pha-loc/${e.ref_id}`, nut: 'Xem', muc: 'vang' };
    }
    // ---- 0037 · Bán hàng iPOS ----------------------------------------------
    case 'ipos_cho_xu_ly': {
      // Quản lý: so = số dòng chưa trừ được kho, phu = số dòng chưa ghép món.
      const n = soNguyen(e.so) ?? 0;
      const chuaKhop = soNguyen(e.phu) ?? 0;
      const thieu = Math.max(n - chuaKhop, 0);
      const phan = [chuaKhop ? `${chuaKhop} chưa ghép món` : '', thieu ? `${thieu} thiếu hàng trên sổ` : '']
        .filter(Boolean).join(', ');
      return { tieuDe: `Bán hàng iPOS: ${n || 'có'} dòng chưa trừ được kho`,
               chiTiet: `${phan ? `${phan}. ` : ''}Ghép món hoặc thử lại — còn dòng chờ thì chưa duyệt được kiểm kê quầy.`,
               link: '/noi-bo/kho/ban-ipos', nut: 'Xử lý', muc: 'vang' };
    }
    case 'ipos_mat_ket_noi': {
      // Quản lý: phu = 'loi' (lượt cuối lỗi) | 'cham' (> 30 phút trong giờ mở cửa); so = phút từ lần tốt cuối.
      const phut = soNguyen(e.so);
      return { tieuDe: e.phu === 'loi' ? 'Không đồng bộ được iPOS' : 'iPOS lâu chưa cập nhật',
               chiTiet: `${phut ? `Lần tốt cuối: ${phut} phút trước. ` : ''}Số bán chưa về kho — mở Kết nối iPOS xem lỗi, bấm "Cập nhật ngay".`,
               link: '/noi-bo/kho/cai-dat/ipos', nut: 'Xem', muc: 'do' };
    }
    // ---- 0038 · Định lượng: bếp nhận lệch định mức 7 ngày ------------------
    case 'dinh_muc_lech': {
      // Quản lý: so = lệch % (dương = bếp nhận nhiều hơn định lượng), phu = lệch kg,
      // luc = 0 giờ hôm nay (giờ VN) → khoảng 7 ngày của cảnh báo = luc − 6 ngày … luc.
      const pt = soNguyen(e.so);
      const lechKg = soNguyen(e.phu);
      const t = new Date(e.luc).getTime();
      const ngay = (n: number) => Number.isFinite(t) ? new Date(t + 7 * 3600000 + n * 86400000).toISOString().slice(0, 10) : null;
      const nhieu = (lechKg ?? pt ?? 0) >= 0;
      return { tieuDe: `Bếp nhận thịt ${nhieu ? 'nhiều' : 'ít'} hơn định lượng: ${e.ten || e.ma || 'một mặt hàng'}`,
               chiTiet: `7 ngày qua${pt !== null && Number.isFinite(pt) ? ` lệch ${pt > 0 ? '+' : ''}${pt.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%` : ''}`
                 + `${lechKg !== null && Number.isFinite(lechKg) ? ` (${lechKg > 0 ? '+' : ''}${kg(lechKg)})` : ''}`
                 + ' so với số món bán trên iPOS. Xem lại phiếu Xuất bếp và định lượng món.',
               link: `/noi-bo/kho/bao-cao/dinh-muc${ngay(-6) ? `?${q({ tu: ngay(-6), den: ngay(0) })}` : ''}`,
               nut: 'Xem', muc: 'vang' };
    }
    // ---- 0039 · Đơn đặt hàng quá ngày giao mà chưa nhận ------------------
    case 'don_dat_tre': {
      // Quản lý: ma = số đơn, ten = tên NCC, so = số ngày trễ, phu = ngày giao dự kiến (YYYY-MM-DD).
      const tre = soNguyen(e.so);
      const hen = /^\d{4}-\d{2}-\d{2}$/.test(e.phu ?? '') ? e.phu!.split('-').reverse().join('/') : null;
      const phan = [e.ten, hen ? `hẹn giao ${hen}` : '', tre && tre > 0 ? `trễ ${tre} ngày` : ''].filter(Boolean).join(' — ');
      return { tieuDe: e.ma ? `Đơn đặt ${e.ma} chưa thấy hàng về` : 'Đơn đặt hàng chưa thấy hàng về',
               chiTiet: `${phan ? `${phan}. ` : ''}Gọi nhà cung cấp hỏi lại; không giao nữa thì hủy đơn.`,
               link: `/noi-bo/kho/dat-hang/${e.ref_id}`, nut: 'Xem đơn', muc: 'vang' };
    }
    default:
      return { tieuDe: e.ten || e.ma || 'Có việc mới', link: '/noi-bo/kho', nut: 'Xem', muc: 'xam' };
  }
}

/** Mọi khóa database có thể trả về (test so với migration mới nhất dựng lại kho_su_kien). */
export const KHOA_SU_KIEN = [
  'nhap_bi_tu_choi', 'huy_bi_tu_choi', 'kiem_ke_tra_ve', 'het_han', 'sap_het_han',
  'quay_duoi_muc', 'quay_chua_dem', 'cho_duyet_nhap', 'cho_duyet_huy', 'cho_duyet_kiem_ke',
  'cong_no_qua_han', 'cong_no_den_han', 'chua_doi_chieu', 'pha_nhap_lau',
  // 0032
  'yeu_cau_quay', 'hang_dang_chuyen', 'chuyen_nhan_thieu',
  // 0033
  'thu_hoi_thap',
  // 0037
  'ipos_cho_xu_ly', 'ipos_mat_ket_noi',
  // 0038
  'dinh_muc_lech',
  // 0039
  'don_dat_tre',
] as const;

/** Sự kiện là "việc cần làm" (có nút làm ngay, không chỉ để biết). */
export function laViec(e: SuKien): boolean {
  return cauSuKien(e).muc !== 'xam';
}

/** "3 giờ trước", "hôm qua", "25/09" — đọc lướt được trên điện thoại. */
export function thoiGianTruoc(luc: string, bayGio = new Date()): string {
  const t = new Date(luc).getTime();
  const phut = Math.round((bayGio.getTime() - t) / 60000);
  if (phut < 1) return 'vừa xong';
  if (phut < 60) return `${phut} phút trước`;
  const gio = Math.round(phut / 60);
  if (gio < 24) return `${gio} giờ trước`;
  const ngay = Math.round(gio / 24);
  if (ngay === 1) return 'hôm qua';
  if (ngay < 7) return `${ngay} ngày trước`;
  const d = new Date(t + 7 * 3600000);
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
