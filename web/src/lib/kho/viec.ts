/**
 * KHO — CÂU CHỮ CHO SỰ KIỆN THÔNG BÁO
 *
 * Database (kho_thong_bao, 0030) chỉ trả KHÓA + vài giá trị (số phiếu, tên, số
 * lượng, mốc thời gian). Câu tiếng Việt và đường dẫn "làm ngay" dựng ở đây —
 * sửa câu chữ không phải viết migration.
 *
 * File thuần: test kiểm mọi khóa database có thể trả về đều có câu ở đây.
 * Hai thứ tiếng: cauSuKien(su, nn) — câu tiếng Việt và tiếng Anh viết cạnh nhau
 * trong từng nhánh, đường dẫn và mức độ chỉ viết một lần.
 */

import type { HaiThuTieng, NgonNguNB } from './chung.ts';
import { congNgay, gioVnTuMs, homNayVn } from '../gio-vn.ts';

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

export const TEN_NHOM_NB: Record<NhomSuKien, HaiThuTieng> = {
  van_hanh: { vi: 'Vận hành', en: 'Operations' },
  nhac_nho: { vi: 'Nhắc nhở', en: 'Reminders' },
  he_thong: { vi: 'Hệ thống', en: 'System' },
};
export const TEN_NHOM: Record<NhomSuKien, string> = {
  van_hanh: TEN_NHOM_NB.van_hanh.vi, nhac_nho: TEN_NHOM_NB.nhac_nho.vi, he_thong: TEN_NHOM_NB.he_thong.vi,
};

const VUNG: Record<NgonNguNB, string> = { vi: 'vi-VN', en: 'en-US' };
const soNguyen = (x: SuKien['so']) => (x === null || x === undefined ? null : Number(x));
const q = (o: Record<string, string | null | undefined>) =>
  new URLSearchParams(Object.entries(o).filter(([, v]) => v) as [string, string][]).toString();

/** Câu và đường dẫn cho một sự kiện. Khóa lạ: câu chung, không vỡ trang. */
export function cauSuKien(su: SuKien, nn: NgonNguNB = 'vi'): CauSuKien {
  // Câu hai thứ tiếng viết cạnh nhau ngay trong từng nhánh; c() chọn bản cần hiện.
  const c = (x: HaiThuTieng) => x[nn];
  const kg = (x: SuKien['so']) => {
    const n = soNguyen(x);
    return n === null ? '' : `${n.toLocaleString(VUNG[nn], { maximumFractionDigits: 3 })} kg`;
  };
  // Thiếu tên / mã (dữ liệu cũ, món đã xóa) thì để trống — không in chữ "null".
  const e = { ...su, ten: su.ten ?? '', ma: su.ma ?? '' };
  // Link tới trang nhà cung cấp: thiếu id thì về danh sách công nợ.
  const congNo = su.ref2 ? `/noi-bo/kho/cong-no/${su.ref2}` : '/noi-bo/kho/cong-no';
  const xem = c({ vi: 'Xem', en: 'View' });
  const duyet = c({ vi: 'Duyệt', en: 'Approve' });
  switch (e.khoa) {
    case 'nhap_bi_tu_choi':
      // Người nhận hàng sửa ở màn chỉ kg (0031) — thủ kho không mở được trang nhập có tiền.
      return { tieuDe: c({ vi: `Phiếu nhập ${e.ma} bị trả về`, en: `Goods receipt ${e.ma} was sent back` }),
               chiTiet: e.ten ? c({ vi: `Lý do: ${e.ten}`, en: `Reason: ${e.ten}` }) : undefined,
               link: `/noi-bo/kho/nhan-hang/${e.ref_id}`, nut: c({ vi: 'Sửa lại', en: 'Fix it' }), muc: 'do' };
    case 'huy_bi_tu_choi':
      return { tieuDe: c({ vi: `Báo hủy ${e.ma} không được duyệt`, en: `Write-off ${e.ma} was not approved` }),
               chiTiet: (e.ten ? c({ vi: `Lý do: ${e.ten}. `, en: `Reason: ${e.ten}. ` }) : '')
                 + c({ vi: 'Hàng đã về lại chỗ cũ.', en: 'The goods are back where they were.' }),
               link: `/noi-bo/kho/xuat/${e.ref_id}`, nut: xem, muc: 'vang' };
    case 'kiem_ke_tra_ve':
      return { tieuDe: c({ vi: `Kiểm kê ${e.ma} cần đếm lại`, en: `Stocktake ${e.ma} needs a recount` }),
               chiTiet: e.ten ? c({ vi: `Quản lý nhắn: ${e.ten}`, en: `Manager's note: ${e.ten}` }) : undefined,
               link: `/noi-bo/kho/kiem-ke/${e.ref_id}`, nut: c({ vi: 'Đếm lại', en: 'Recount' }), muc: 'do' };
    case 'het_han': {
      const con = soNguyen(e.so);
      return { tieuDe: c({ vi: `Hết hạn: ${e.ten}`, en: `Expired: ${e.ten}` }),
               chiTiet: c({ vi: `Lô ${e.ma}`, en: `Lot ${e.ma}` })
                 + (con ? c({ vi: ` · còn ${con} trên sổ`, en: ` · ${con} left on the books` }) : '')
                 + c({ vi: '. Không bán, không đưa bếp — báo hủy.', en: '. Do not sell or send to the kitchen — report a write-off.' }),
               link: `/noi-bo/kho/xuat/moi?${q({ loai: 'huy', tu: e.ref2, lo: e.ref_id })}`,
               nut: c({ vi: 'Báo hủy', en: 'Write off' }), muc: 'do' };
    }
    case 'sap_het_han':
      return e.phu === 'kho'
        ? { tieuDe: c({ vi: `Sắp hết hạn: ${e.ten}`, en: `Expiring soon: ${e.ten}` }),
            chiTiet: c({ vi: `Lô ${e.ma} — đưa ra quầy bán trước.`, en: `Lot ${e.ma} — take it to the counter and sell it first.` }),
            link: `/noi-bo/kho/xuat/moi?${q({ loai: 'chuyen', tu: e.ref2, lo: e.ref_id })}`,
            nut: c({ vi: 'Ra quầy', en: 'To counter' }), muc: 'vang' }
        : { tieuDe: c({ vi: `Sắp hết hạn: ${e.ten}`, en: `Expiring soon: ${e.ten}` }),
            chiTiet: c({ vi: `Lô ${e.ma} — xếp lên phía trước quầy để bán trước, hoặc đưa bếp.`,
                         en: `Lot ${e.ma} — put it at the front of the counter to sell first, or send it to the kitchen.` }),
            link: `/noi-bo/kho/xuat/moi?${q({ loai: 'xuat_bep', tu: e.ref2, lo: e.ref_id })}`,
            nut: c({ vi: 'Đưa bếp', en: 'To kitchen' }), muc: 'vang' };
    case 'quay_duoi_muc':
      return { tieuDe: c({ vi: `Quầy sắp hết: ${e.ten}`, en: `Counter running low: ${e.ten}` }),
               chiTiet: c({ vi: `Còn ${kg(e.so) || '0 kg'} bán được.`, en: `${kg(e.so) || '0 kg'} left to sell.` }),
               link: `/noi-bo/kho/xuat/moi?${q({ loai: 'chuyen', mh: e.ref_id })}`,
               nut: c({ vi: 'Mang ra quầy', en: 'Bring to counter' }), muc: 'vang' };
    case 'quay_chua_dem':
      return { tieuDe: (e.ten || c({ vi: 'Quầy', en: 'Counter' })) + c({ vi: ': chưa đếm cuối ngày hôm qua', en: ': yesterday\'s end-of-day count is missing' }),
               chiTiet: c({ vi: 'Chưa nối iPOS nên số đếm cuối ngày là số bán. Đếm và gửi ngay.',
                            en: 'iPOS is not connected, so the end-of-day count is the sales figure. Count and submit now.' }),
               link: `/noi-bo/kho/quay/dem?${q({ vi_tri: e.ref_id })}`, nut: c({ vi: 'Đếm ngay', en: 'Count now' }), muc: 'do' };
    case 'cho_duyet_nhap':
      return { tieuDe: c({ vi: `Phiếu nhập ${e.ma} chờ điền giá, duyệt`, en: `Goods receipt ${e.ma} needs prices and approval` }),
               chiTiet: e.ten || undefined,
               link: `/noi-bo/kho/nhap/${e.ref_id}?tu=duyet`, nut: c({ vi: 'Điền giá', en: 'Enter prices' }), muc: 'vang' };
    case 'cho_duyet_huy':
      return { tieuDe: c({ vi: `Báo hủy ${e.ma} chờ duyệt`, en: `Write-off ${e.ma} awaiting approval` }),
               chiTiet: e.ten ? c({ vi: `Ở ${e.ten}`, en: `At ${e.ten}` }) : undefined,
               link: `/noi-bo/kho/xuat/${e.ref_id}`, nut: duyet, muc: 'vang' };
    case 'cho_duyet_kiem_ke':
      return { tieuDe: c({ vi: `Kiểm kê ${e.ma} chờ duyệt`, en: `Stocktake ${e.ma} awaiting approval` }),
               chiTiet: e.ten || undefined,
               link: `/noi-bo/kho/kiem-ke/${e.ref_id}`, nut: duyet, muc: 'vang' };
    case 'cong_no_qua_han': {
      const n = soNguyen(e.so);
      return { tieuDe: n ? c({ vi: `Nợ quá hạn ${n} ngày: ${e.ma}`, en: `Payment ${n} days overdue: ${e.ma}` })
                         : c({ vi: `Nợ quá hạn: ${e.ma}`, en: `Payment overdue: ${e.ma}` }),
               chiTiet: e.ten || undefined, link: congNo, nut: c({ vi: 'Trả tiền', en: 'Pay' }), muc: 'do' };
    }
    case 'cong_no_den_han': {
      const n = soNguyen(e.so) ?? 0;
      return { tieuDe: n === 0 ? c({ vi: `Đến hạn trả hôm nay: ${e.ma}`, en: `Payment due today: ${e.ma}` })
                               : c({ vi: `Đến hạn trả trong ${n} ngày: ${e.ma}`, en: `Payment due in ${n} day${n === 1 ? '' : 's'}: ${e.ma}` }),
               chiTiet: e.ten || undefined, link: congNo, nut: xem, muc: 'vang' };
    }
    case 'chua_doi_chieu':
      return { tieuDe: c({ vi: `Chưa đối chiếu hóa đơn: ${e.ma}`, en: `Invoice not reconciled yet: ${e.ma}` }),
               chiTiet: e.ten || undefined,
               link: congNo, nut: c({ vi: 'Đối chiếu', en: 'Reconcile' }), muc: 'xam' };
    case 'pha_nhap_lau':
      return { tieuDe: c({ vi: `Phiên pha lóc ${e.ma} để nháp hơn một ngày`, en: `Butchery session ${e.ma} has been a draft for over a day` }),
               chiTiet: (e.ten || '') + c({ vi: ' — chốt hoặc hủy để kiểm kê không bị chặn.', en: ' — close or cancel it so stocktakes are not blocked.' }),
               link: `/noi-bo/kho/pha-loc/${e.ref_id}`, nut: c({ vi: 'Mở', en: 'Open' }), muc: 'vang' };
    // ---- 0032 · Quầy yêu cầu → thủ kho mang ra → quầy bấm nhận ------------
    case 'yeu_cau_quay': {
      // Thủ kho: so = số món quầy cần.
      const n = soNguyen(e.so);
      return { tieuDe: (e.ten || c({ vi: 'Quầy', en: 'Counter' })) + c({ vi: ` cần hàng: ${e.ma}`, en: ` needs stock: ${e.ma}` }),
               chiTiet: n ? c({ vi: `${n} món — mang ra quầy, lấy hàng hạn gần trước.`, en: `${n} item${n === 1 ? '' : 's'} — bring to the counter, earliest use-by first.` })
                          : c({ vi: 'Mang ra quầy, lấy hàng hạn gần trước.', en: 'Bring to the counter, earliest use-by first.' }),
               link: `/noi-bo/kho/quay/yeu-cau/${e.ref_id}`, nut: c({ vi: 'Mang ra', en: 'Bring out' }), muc: 'vang' };
    }
    case 'hang_dang_chuyen': {
      // NV quầy: so = số gói đang mang ra. Quá giờ nhắc (phu = 'qua_gio') thì đỏ.
      const n = soNguyen(e.so);
      const quaGio = e.phu === 'qua_gio';
      const dau = quaGio ? c({ vi: 'Chưa bấm nhận', en: 'Not confirmed yet' }) : c({ vi: 'Hàng đang mang ra', en: 'On the way' });
      const noi = e.ten ? ` ${e.ten}` : c({ vi: ' quầy', en: ' to the counter' });
      return { tieuDe: `${dau}${noi}: ${e.ma}`,
               chiTiet: (n ? c({ vi: `${n} gói. `, en: `${n} pack${n === 1 ? '' : 's'}. ` }) : '')
                 + (quaGio ? c({ vi: 'Đã quá giờ — ', en: 'Overdue — ' }) : '')
                 + c({ vi: 'Kiểm hàng rồi bấm "Đã nhận đủ", thiếu thì ghi số thực nhận.',
                       en: 'Check the goods, then press "Received in full"; if short, enter what actually arrived.' }),
               link: '/noi-bo/kho/quay/nhan', nut: c({ vi: 'Nhận hàng', en: 'Receive' }), muc: quaGio ? 'do' : 'vang' };
    }
    case 'chuyen_nhan_thieu': {
      // Quản lý: so = số gói quầy nhận thiếu.
      const n = soNguyen(e.so);
      return { tieuDe: (e.ten || c({ vi: 'Quầy', en: 'Counter' })) + c({ vi: ` nhận thiếu: ${e.ma}`, en: ` received short: ${e.ma}` }),
               chiTiet: (n ? c({ vi: `Thiếu ${n} gói. `, en: `${n} pack${n === 1 ? '' : 's'} short. ` }) : '')
                 + c({ vi: 'Hàng còn ở kho thì trả về kho; rơi vỡ, thất lạc thì ghi mất.',
                       en: 'If the goods are still in the store, return them to stock; if dropped or lost, record them as lost.' }),
               link: `/noi-bo/kho/xuat/${e.ref_id}`, nut: c({ vi: 'Xử lý', en: 'Handle' }), muc: 'do' };
    }
    // ---- 0033 · Pha lóc thu hồi thấp hơn dự kiến (không duyệt, chỉ báo) ------
    case 'thu_hoi_thap': {
      // Quản lý: so = thu hồi %, phu = dự kiến % (chữ số dấu chấm), ten = tên tảng.
      const pt = (x: number | string | null) => {
        const n = x === null || x === '' ? NaN : Number(x);
        return Number.isFinite(n) ? `${n.toLocaleString(VUNG[nn], { maximumFractionDigits: 1 })}%` : '';
      };
      const thuHoi = pt(e.so);
      const duKien = pt(e.phu);
      return { tieuDe: c({ vi: `Pha lóc ${e.ma} thu hồi thấp`, en: `Butchery ${e.ma} has a low yield` }) + (thuHoi ? `: ${thuHoi}` : ''),
               chiTiet: [e.ten, duKien ? c({ vi: `dự kiến ${duKien}`, en: `expected ${duKien}` }) : ''].filter(Boolean).join(' — ')
                 + c({ vi: '. Xem lại số cân rồi bấm "Đã xem".', en: '. Check the weights, then press "Seen".' }),
               link: `/noi-bo/kho/pha-loc/${e.ref_id}`, nut: xem, muc: 'vang' };
    }
    // ---- 0037 · Bán hàng iPOS ----------------------------------------------
    case 'ipos_cho_xu_ly': {
      // Quản lý: so = số dòng chưa trừ được kho, phu = số dòng chưa ghép món.
      const n = soNguyen(e.so) ?? 0;
      const chuaKhop = soNguyen(e.phu) ?? 0;
      const thieu = Math.max(n - chuaKhop, 0);
      const phan = [chuaKhop ? c({ vi: `${chuaKhop} chưa ghép món`, en: `${chuaKhop} not matched to a dish` }) : '',
                    thieu ? c({ vi: `${thieu} thiếu hàng trên sổ`, en: `${thieu} short on the books` }) : '']
        .filter(Boolean).join(', ');
      return { tieuDe: n ? c({ vi: `Bán hàng iPOS: ${n} dòng chưa trừ được kho`, en: `iPOS sales: ${n} line${n === 1 ? '' : 's'} not deducted from stock` })
                         : c({ vi: 'Bán hàng iPOS: có dòng chưa trừ được kho', en: 'iPOS sales: some lines not deducted from stock' }),
               chiTiet: (phan ? `${phan}. ` : '')
                 + c({ vi: 'Ghép món hoặc thử lại — còn dòng chờ thì chưa duyệt được kiểm kê quầy.',
                       en: 'Match the dish or retry — counter stocktakes cannot be approved while lines are waiting.' }),
               link: '/noi-bo/kho/ban-ipos', nut: c({ vi: 'Xử lý', en: 'Handle' }), muc: 'vang' };
    }
    case 'ipos_mat_ket_noi': {
      // Quản lý (0042): phu = 'loi' (lượt cập nhật cuối lỗi) | 'cham' (trong giờ mở cửa quá gio_mat_ket_noi giờ
      // không nhận hóa đơn nào); so = phút từ hóa đơn cuối nhận được (null = chưa nhận hóa đơn nào).
      const phut = soNguyen(e.so);
      const gio = phut === null ? ''
        : phut >= 120 ? c({ vi: `${Math.floor(phut / 60)} giờ`, en: `${Math.floor(phut / 60)} hours` })
        : c({ vi: `${phut} phút`, en: `${phut} minute${phut === 1 ? '' : 's'}` });
      if (e.phu === 'loi') {
        return { tieuDe: c({ vi: 'Không cập nhật được iPOS', en: 'Could not update from iPOS' }),
                 chiTiet: c({ vi: 'Lần cập nhật gần nhất bị lỗi (thử lại dòng chờ hoặc đọc thực đơn) — mở Kết nối iPOS xem lỗi, bấm "Cập nhật ngay".',
                              en: 'The last update failed (retrying waiting lines or reading the menu) — open the iPOS connection to see the error, then press "Update now".' }),
                 link: '/noi-bo/kho/cai-dat/ipos', nut: xem, muc: 'do' };
      }
      return { tieuDe: c({ vi: 'iPOS lâu không gửi hóa đơn sang', en: 'iPOS has not sent invoices for a while' }),
               chiTiet: (gio ? c({ vi: `Hóa đơn cuối nhận được: ${gio} trước. `, en: `Last invoice received: ${gio} ago. ` })
                             : c({ vi: 'Chưa nhận được hóa đơn nào từ iPOS. ', en: 'No invoice has been received from iPOS yet. ' }))
                 + c({ vi: 'Số bán chưa về kho — kiểm tra máy iPOS còn chạy, nhờ iPOS xem địa chỉ nhận hóa đơn.',
                       en: 'Sales are not reaching inventory — check the iPOS device is running and ask iPOS to check the invoice address.' }),
               link: '/noi-bo/kho/cai-dat/ipos', nut: xem, muc: 'do' };
    }
    // ---- 0038 · Định lượng: bếp nhận lệch định mức 7 ngày ------------------
    case 'dinh_muc_lech': {
      // Quản lý: so = lệch % (dương = bếp nhận nhiều hơn định lượng), phu = lệch kg,
      // luc = 0 giờ hôm nay (giờ VN) → khoảng 7 ngày của cảnh báo = luc − 6 ngày … luc.
      const pt = soNguyen(e.so);
      const lechKg = soNguyen(e.phu);
      const t = new Date(e.luc).getTime();
      const ngay = (n: number) => Number.isFinite(t) ? congNgay(homNayVn(t), n) : null;
      const nhieu = (lechKg ?? pt ?? 0) >= 0;
      const mon = e.ten || e.ma || c({ vi: 'một mặt hàng', en: 'an item' });
      const lechPt = pt !== null && Number.isFinite(pt)
        ? `${pt > 0 ? '+' : ''}${pt.toLocaleString(VUNG[nn], { maximumFractionDigits: 1 })}%` : '';
      const lechKgChu = lechKg !== null && Number.isFinite(lechKg) ? ` (${lechKg > 0 ? '+' : ''}${kg(lechKg)})` : '';
      return { tieuDe: nhieu ? c({ vi: `Bếp nhận thịt nhiều hơn định lượng: ${mon}`, en: `Kitchen took more meat than the recipes: ${mon}` })
                             : c({ vi: `Bếp nhận thịt ít hơn định lượng: ${mon}`, en: `Kitchen took less meat than the recipes: ${mon}` }),
               chiTiet: c({ vi: '7 ngày qua', en: 'Last 7 days' })
                 + (lechPt ? c({ vi: ` lệch ${lechPt}`, en: ` off by ${lechPt}` }) : '')
                 + lechKgChu
                 + c({ vi: ' so với số món bán trên iPOS. Xem lại phiếu Xuất bếp và định lượng món.',
                       en: ' compared with the dishes sold on iPOS. Review the kitchen issues and dish recipes.' }),
               link: `/noi-bo/kho/bao-cao/dinh-muc${ngay(-6) ? `?${q({ tu: ngay(-6), den: ngay(0) })}` : ''}`,
               nut: xem, muc: 'vang' };
    }
    // ---- 0039 · Đơn đặt hàng quá ngày giao mà chưa nhận ------------------
    case 'don_dat_tre': {
      // Quản lý: ma = số đơn, ten = tên NCC, so = số ngày trễ, phu = ngày giao dự kiến (YYYY-MM-DD).
      const tre = soNguyen(e.so);
      const hen = /^\d{4}-\d{2}-\d{2}$/.test(e.phu ?? '') ? e.phu!.split('-').reverse().join('/') : null;
      const phan = [e.ten, hen ? c({ vi: `hẹn giao ${hen}`, en: `due ${hen}` }) : '',
                    tre && tre > 0 ? c({ vi: `trễ ${tre} ngày`, en: `${tre} day${tre === 1 ? '' : 's'} late` }) : ''].filter(Boolean).join(' — ');
      return { tieuDe: e.ma ? c({ vi: `Đơn đặt ${e.ma} chưa thấy hàng về`, en: `Order ${e.ma} has not arrived` })
                            : c({ vi: 'Đơn đặt hàng chưa thấy hàng về', en: 'A purchase order has not arrived' }),
               chiTiet: (phan ? `${phan}. ` : '')
                 + c({ vi: 'Gọi nhà cung cấp hỏi lại; không giao nữa thì hủy đơn.',
                       en: 'Call the supplier to check; if it will not be delivered, cancel the order.' }),
               link: `/noi-bo/kho/dat-hang/${e.ref_id}`, nut: c({ vi: 'Xem đơn', en: 'View order' }), muc: 'vang' };
    }
    // ---- 0040 · Trả hàng hai bước; NCC đổi số tài khoản ngân hàng ------------
    case 'tra_hang_cho_tien': {
      // Kế toán: ma = số phiếu trả hàng (XT-), ten = tên NCC, so = tổng kg trả.
      const phan = [e.ten, kg(e.so)].filter(Boolean).join(' — ');
      return { tieuDe: e.ma ? c({ vi: `Trả hàng ${e.ma} chờ xác nhận tiền`, en: `Return ${e.ma} needs the amount confirmed` })
                            : c({ vi: 'Trả hàng chờ xác nhận tiền', en: 'A return needs the amount confirmed' }),
               chiTiet: (phan ? `${phan}. ` : '')
                 + c({ vi: 'Thủ kho đã ghi số kg trả — ghi số tiền nhà cung cấp trừ vào công nợ.',
                       en: 'The storekeeper recorded the kg returned — enter the amount the supplier deducts from what we owe.' }),
               link: '/noi-bo/kho/cong-no/tra-hang#cho-tien', nut: c({ vi: 'Xác nhận tiền', en: 'Confirm amount' }), muc: 'vang' };
    }
    case 'ncc_doi_tai_khoan': {
      // Chủ: ma = số tài khoản mới, ten = tên NCC, phu = người đổi.
      return { tieuDe: c({ vi: `Số tài khoản của ${e.ten || 'nhà cung cấp'} vừa bị đổi`,
                           en: `The bank account of ${e.ten || 'a supplier'} was just changed` }),
               chiTiet: (e.ma ? c({ vi: `Số mới: ${e.ma}. `, en: `New number: ${e.ma}. ` }) : '')
                 + (e.phu ? c({ vi: `Người đổi: ${e.phu}. `, en: `Changed by: ${e.phu}. ` }) : '')
                 + c({ vi: 'Gọi điện hỏi lại nhà cung cấp trước khi chuyển tiền — kẻ gian hay giả làm NCC để đổi số tài khoản.',
                       en: 'Call the supplier to confirm before paying — fraudsters often pose as suppliers to change bank details.' }),
               link: su.ref2 ? `/noi-bo/kho/cai-dat/nha-cung-cap?${q({ sua: su.ref2 })}` : '/noi-bo/kho/cai-dat/nha-cung-cap',
               nut: xem, muc: 'do' };
    }
    default:
      return { tieuDe: e.ten || e.ma || c({ vi: 'Có việc mới', en: 'Something new' }), link: '/noi-bo/kho', nut: xem, muc: 'xam' };
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
  // 0040
  'tra_hang_cho_tien', 'ncc_doi_tai_khoan',
] as const;

// -----------------------------------------------------------------------------
// GOM VIỆC CÙNG LOẠI (Khánh duyệt 22/10/2026)
// -----------------------------------------------------------------------------
// Thủ kho từng thấy 57 thẻ việc trên điện thoại: 10 lô hết hạn, 30 món quầy sắp hết… mỗi cái một
// thẻ. Từ NGUONG_GOM sự kiện cùng khóa trở lên thì thành MỘT dòng có số đếm, nút dẫn tới trang danh
// sách đã lọc sẵn (Tồn kho ?han=het_han, Công nợ ?loc=qua_han…) — ở đó từng lô / phiếu có nút riêng.
// Ít hơn thì vẫn từng dòng như cũ, thấy ngay số phiếu, tên lô.
//
// Database đếm số chưa đọc trên chuông theo ĐÚNG luật này (migration 0092: số dòng của trang chuông
// có sự kiện chưa đọc, 7 ngày) — đổi NGUONG_GOM / KHOA_KHONG_GOM thì viết migration mới cho khớp
// (test-kho-viec.mjs so hai bên).

export const NGUONG_GOM = 3;
/** Khóa không bao giờ gom: mỗi lần nhà cung cấp đổi số tài khoản phải được thấy riêng (chống lừa đảo). */
export const KHOA_KHONG_GOM: readonly string[] = ['ncc_doi_tai_khoan'];
/** Trang chuông chỉ hiện sự kiện trong chừng ấy ngày (trang Việc cần làm vẫn 30 ngày). */
export const NGAY_CHUONG = 7;

/** Một dòng của trang Việc cần làm / chuông: một sự kiện, hoặc NGUONG_GOM sự kiện cùng khóa trở lên. */
export interface DongViec {
  khoa: string;
  /** Các sự kiện trong dòng (một phần tử = dòng thường). */
  ds: SuKien[];
  cau: CauSuKien;
  /** Sự kiện cũ nhất / mới nhất trong dòng — trang Việc xếp cũ trước, chuông xếp mới trước. */
  cuNhat: string;
  moiNhat: string;
  chuaDoc: boolean;
}

const BAC_MUC: Record<CauSuKien['muc'], number> = { do: 2, vang: 1, xam: 0 };

/**
 * Câu cho một dòng gom `ds` (cùng khóa, ≥ NGUONG_GOM). null = khóa không gom (KHOA_KHONG_GOM) hoặc
 * khóa lạ. Mức độ của dòng = mức gấp nhất trong các sự kiện của nó.
 */
export function cauNhomSuKien(khoa: string, ds: SuKien[], nn: NgonNguNB = 'vi'): CauSuKien | null {
  if (KHOA_KHONG_GOM.includes(khoa)) return null;
  const c = (x: HaiThuTieng) => x[nn];
  const n = ds.length;
  const so = n.toLocaleString(VUNG[nn]);
  const muc = ds.map(e => cauSuKien(e, nn).muc).reduce<CauSuKien['muc']>((m, x) => (BAC_MUC[x] > BAC_MUC[m] ? x : m), 'xam');
  const xem = c({ vi: 'Xem', en: 'View' });
  const duyet = c({ vi: 'Duyệt', en: 'Approve' });
  // Dòng gom luôn từ NGUONG_GOM (3) sự kiện trở lên: câu tiếng Anh viết số nhiều.
  const dong = (tieuDe: HaiThuTieng, link: string, nut: string, chiTiet?: HaiThuTieng): CauSuKien =>
    ({ tieuDe: c(tieuDe), chiTiet: chiTiet ? c(chiTiet) : undefined, link, nut, muc });
  switch (khoa) {
    case 'nhap_bi_tu_choi':
      return dong({ vi: `${so} phiếu nhập bị trả về`, en: `${so} goods receipts were sent back` },
        '/noi-bo/kho/nhan-hang?loc=tu_choi', c({ vi: 'Sửa lại', en: 'Fix them' }),
        { vi: 'Mở từng phiếu, sửa rồi gửi lại.', en: 'Open each one, fix it and send it again.' });
    case 'huy_bi_tu_choi':
      return dong({ vi: `${so} báo hủy không được duyệt`, en: `${so} write-offs were not approved` },
        '/noi-bo/kho/xuat?loc=huy', xem, { vi: 'Hàng đã về lại chỗ cũ.', en: 'The goods are back where they were.' });
    case 'kiem_ke_tra_ve':
      return dong({ vi: `${so} phiếu kiểm kê cần đếm lại`, en: `${so} stocktakes need a recount` },
        '/noi-bo/kho/kiem-ke', c({ vi: 'Đếm lại', en: 'Recount' }));
    case 'het_han':
      return dong({ vi: `${so} lô hết hạn`, en: `${so} lots have expired` },
        '/noi-bo/kho/ton?han=het_han', c({ vi: 'Báo hủy', en: 'Write off' }),
        { vi: 'Không bán, không đưa bếp — báo hủy từng lô.', en: 'Do not sell or send to the kitchen — write off each lot.' });
    case 'sap_het_han':
      return dong({ vi: `${so} lô sắp hết hạn`, en: `${so} lots expire soon` },
        '/noi-bo/kho/ton?han=sap_het', xem,
        { vi: 'Đưa ra quầy bán trước, hoặc đưa bếp.', en: 'Take them to the counter to sell first, or send them to the kitchen.' });
    case 'quay_duoi_muc':
      return dong({ vi: `${so} món quầy sắp hết`, en: `${so} counter items are running low` },
        '/noi-bo/kho/ton?duoi_muc=1', xem,
        { vi: 'Lấy thêm hàng ra quầy.', en: 'Bring more stock to the counter.' });
    case 'quay_chua_dem':
      return dong({ vi: `${so} quầy chưa đếm cuối ngày hôm qua`, en: `${so} counters are missing yesterday's count` },
        '/noi-bo/kho/quay/dem', c({ vi: 'Đếm ngay', en: 'Count now' }));
    case 'cho_duyet_nhap':
      return dong({ vi: `${so} phiếu nhập chờ điền giá, duyệt`, en: `${so} goods receipts need prices and approval` },
        '/noi-bo/kho/duyet', duyet);
    case 'cho_duyet_huy':
      return dong({ vi: `${so} báo hủy chờ duyệt`, en: `${so} write-offs await approval` }, '/noi-bo/kho/duyet', duyet);
    case 'cho_duyet_kiem_ke':
      return dong({ vi: `${so} phiếu kiểm kê chờ duyệt`, en: `${so} stocktakes await approval` }, '/noi-bo/kho/duyet', duyet);
    case 'cong_no_qua_han': {
      const lauNhat = Math.max(0, ...ds.map(e => soNguyen(e.so) ?? 0));
      return dong({ vi: `${so} phiếu nợ quá hạn`, en: `${so} payments are overdue` },
        '/noi-bo/kho/cong-no?loc=qua_han', c({ vi: 'Trả tiền', en: 'Pay' }),
        lauNhat > 0 ? { vi: `Lâu nhất quá hạn ${lauNhat} ngày.`, en: `The oldest is ${lauNhat} day${lauNhat === 1 ? '' : 's'} overdue.` } : undefined);
    }
    case 'cong_no_den_han':
      return dong({ vi: `${so} phiếu sắp đến hạn trả`, en: `${so} payments are due soon` }, '/noi-bo/kho/cong-no?loc=den_han', xem);
    case 'chua_doi_chieu':
      return dong({ vi: `${so} hóa đơn chưa đối chiếu`, en: `${so} invoices are not reconciled` },
        '/noi-bo/kho/cong-no?loc=chua_doi_chieu', c({ vi: 'Đối chiếu', en: 'Reconcile' }));
    case 'pha_nhap_lau':
      return dong({ vi: `${so} phiên pha lóc để nháp hơn một ngày`, en: `${so} butchery sessions have been drafts for over a day` },
        '/noi-bo/kho/pha-loc?loc=nhap', c({ vi: 'Mở', en: 'Open' }),
        { vi: 'Chốt hoặc hủy để kiểm kê không bị chặn.', en: 'Close or cancel them so stocktakes are not blocked.' });
    case 'yeu_cau_quay':
      return dong({ vi: `${so} yêu cầu của quầy đang chờ`, en: `${so} counter requests are waiting` },
        '/noi-bo/kho/quay/yeu-cau', c({ vi: 'Mang ra', en: 'Bring out' }),
        { vi: 'Lấy hàng hạn gần trước.', en: 'Earliest use-by first.' });
    case 'hang_dang_chuyen':
      return dong({ vi: `${so} chuyến hàng đang mang ra quầy`, en: `${so} deliveries are on the way to the counter` },
        '/noi-bo/kho/quay/nhan', c({ vi: 'Nhận hàng', en: 'Receive' }),
        { vi: 'Kiểm hàng rồi bấm nhận từng chuyến.', en: 'Check the goods, then confirm each delivery.' });
    case 'chuyen_nhan_thieu':
      return dong({ vi: `${so} phiếu chuyển quầy nhận thiếu`, en: `${so} counter transfers were received short` },
        '/noi-bo/kho/xuat?loc=dang_chuyen', c({ vi: 'Xử lý', en: 'Handle' }));
    case 'thu_hoi_thap':
      return dong({ vi: `${so} phiên pha lóc thu hồi thấp`, en: `${so} butchery sessions have a low yield` },
        '/noi-bo/kho/pha-loc?loc=da_chot', xem,
        { vi: 'Xem lại số cân từng phiên rồi bấm "Đã xem".', en: 'Check the weights of each session, then press "Seen".' });
    case 'ipos_cho_xu_ly':
      return dong({ vi: `${so} cảnh báo bán hàng iPOS`, en: `${so} iPOS sales warnings` }, '/noi-bo/kho/ban-ipos', c({ vi: 'Xử lý', en: 'Handle' }));
    case 'ipos_mat_ket_noi':
      return dong({ vi: `${so} cảnh báo kết nối iPOS`, en: `${so} iPOS connection warnings` }, '/noi-bo/kho/cai-dat/ipos', xem);
    case 'dinh_muc_lech':
      return dong({ vi: `${so} mặt hàng bếp dùng lệch định lượng`, en: `${so} items used by the kitchen are off the recipes` },
        '/noi-bo/kho/bao-cao/dinh-muc', xem,
        { vi: '7 ngày qua, so với số món bán trên iPOS.', en: 'Last 7 days, compared with the dishes sold on iPOS.' });
    case 'don_dat_tre':
      return dong({ vi: `${so} đơn đặt chưa thấy hàng về`, en: `${so} purchase orders have not arrived` },
        '/noi-bo/kho/dat-hang?loc=dang_cho', xem,
        { vi: 'Gọi nhà cung cấp hỏi lại; không giao nữa thì hủy đơn.', en: 'Call the suppliers to check; cancel orders that will not be delivered.' });
    case 'tra_hang_cho_tien':
      return dong({ vi: `${so} phiếu trả hàng chờ xác nhận tiền`, en: `${so} returns need the amount confirmed` },
        '/noi-bo/kho/cong-no/tra-hang#cho-tien', c({ vi: 'Xác nhận tiền', en: 'Confirm amounts' }));
    default:
      return null;
  }
}

/**
 * Gom sự kiện thành dòng: khóa có ≥ NGUONG_GOM sự kiện (và gom được) thành một dòng, còn lại mỗi
 * sự kiện một dòng. Dòng giữ thứ tự sự kiện đầu tiên của nó trong `ds` — trang tự xếp lại.
 */
export function gomSuKien(ds: SuKien[], nn: NgonNguNB = 'vi'): DongViec[] {
  const theoKhoa = new Map<string, SuKien[]>();
  for (const e of ds) theoKhoa.set(e.khoa, [...(theoKhoa.get(e.khoa) ?? []), e]);
  const dong = (khoa: string, nhom: SuKien[], cau: CauSuKien): DongViec => {
    const luc = nhom.map(e => e.luc).sort();
    return { khoa, ds: nhom, cau, cuNhat: luc[0], moiNhat: luc[luc.length - 1], chuaDoc: nhom.some(e => !!e.chua_doc) };
  };
  const ra: DongViec[] = [];
  const daGom = new Set<string>();
  for (const e of ds) {
    const nhom = theoKhoa.get(e.khoa)!;
    const cauNhom = nhom.length >= NGUONG_GOM ? cauNhomSuKien(e.khoa, nhom, nn) : null;
    if (!cauNhom) { ra.push(dong(e.khoa, [e], cauSuKien(e, nn))); continue; }
    if (daGom.has(e.khoa)) continue;
    daGom.add(e.khoa);
    ra.push(dong(e.khoa, nhom, cauNhom));
  }
  return ra;
}

/** Sự kiện là "việc cần làm" (có nút làm ngay, không chỉ để biết). */
export function laViec(e: SuKien): boolean {
  return cauSuKien(e).muc !== 'xam';
}

/** "3 giờ trước", "hôm qua", "25/09" — đọc lướt được trên điện thoại. */
export function thoiGianTruoc(luc: string, bayGio = new Date(), nn: NgonNguNB = 'vi'): string {
  const c = (x: HaiThuTieng) => x[nn];
  const t = new Date(luc).getTime();
  if (!Number.isFinite(t)) return '—';
  const phut = Math.round((bayGio.getTime() - t) / 60000);
  if (phut < 1) return c({ vi: 'vừa xong', en: 'just now' });
  if (phut < 60) return c({ vi: `${phut} phút trước`, en: `${phut} min ago` });
  const gio = Math.round(phut / 60);
  if (gio < 24) return c({ vi: `${gio} giờ trước`, en: `${gio} h ago` });
  const ngay = Math.round(gio / 24);
  if (ngay === 1) return c({ vi: 'hôm qua', en: 'yesterday' });
  if (ngay < 7) return c({ vi: `${ngay} ngày trước`, en: `${ngay} days ago` });
  const vn = gioVnTuMs(t);
  return `${vn.slice(8, 10)}/${vn.slice(5, 7)}`;
}
