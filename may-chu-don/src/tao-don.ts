/**
 * KIỂM ĐƠN KHÁCH GỬI LÊN — hàm thuần, không database, không mạng
 * ===============================================================
 *
 * Máy chủ không tin số tiền, tên phần thịt hay giá Mini App gửi: chỉ nhận mã phần thịt và số khay, rồi tự tính
 * tiền theo bảng giá của chính Mini App (mini-app/src/san-pham.ts) — một nguồn giá cho cả app lẫn máy chủ. Giờ
 * nhận, số khay tối đa, số điện thoại kiểm bằng đúng hàm của Mini App (mini-app/src/don.ts, cau-hinh.ts), nên
 * app cho chọn giờ nào thì máy chủ nhận giờ đó.
 *
 * Khánh 09/11/2026: đơn trả trước trong app CHỈ GIAO TẬN NƠI, giá khay đã gồm phí giao ("giao tận nơi tạm thời là
 * bao gồm giá giao") — tổng tiền là tổng tiền khay, không dòng phí giao. Không còn nhận tại quán (bản 29/10 của
 * Claude). Tên, số điện thoại, địa chỉ giao bắt buộc: quán giao theo địa chỉ, gọi số khi giao, đợt 3 gửi ZNS theo số.
 *
 * Giờ Việt Nam: cacGioChon / cacNgayChon của Mini App đọc giờ "địa phương" của Date (getHours, getDate…). Máy
 * chủ thuê thường chạy UTC, nên dongHoVn dựng một Date có giờ địa phương đúng bằng giờ Việt Nam lúc `ms`, lấy từ
 * gioVnTuMs của web/src/lib/gio-vn.ts — không tự cộng 7 tiếng, không phụ thuộc múi giờ của máy.
 */
import { createHash } from 'node:crypto';
import { SAN_PHAM } from '../../mini-app/src/san-pham.ts';
import { CAU_HINH, CAU_HINH_GIO_GIAO } from '../../mini-app/src/cau-hinh.ts';
import { cacGioChon, cacNgayChon, chuanHoaSoDienThoai, type BaoQuan } from '../../mini-app/src/don.ts';
import { gioVnTuMs, laNgayCoThat } from '../../web/src/lib/gio-vn.ts';

export interface DongMoi {
  maPhan: string;
  ten: string;
  baoQuan: BaoQuan;
  soGamKhay: number;
  soKhay: number;
  giaMoiKhay: number;
}

export interface DonMoi {
  maGui: string;
  dong: DongMoi[];
  tongTien: number;
  cachNhan: 'giao-hang';
  /** Địa chỉ giao, đã làm sạch (DIA_CHI_TOI_THIEU…DIA_CHI_TOI_DA ký tự). */
  diaChi: string;
  /** yyyy-mm-dd, giờ Việt Nam */
  ngayNhan: string;
  /** HH:mm */
  gioNhan: string;
  ten: string;
  /** 0xxxxxxxxx */
  dienThoai: string;
  ghiChu: string;
  /** Bảng giá đang là giá thử (CAU_HINH.giaThu): đợt 2 không cho trả tiền thật theo giá này. */
  giaThu: boolean;
  /** Băm thứ khách gửi (dauNoiDungGui): cùng mã gửi mà khác nội dung thì từ chối, không ghi đè. */
  dauNoiDung: string;
}

export type KetQuaKiem = { ok: true; don: DonMoi } | { ok: false; loi: string[] };

export const MAU_MA_GUI = /^[A-Za-z0-9_-]{8,64}$/;
export const TEN_TOI_THIEU = 2;
export const TEN_TOI_DA = 60;
export const GHI_CHU_TOI_DA = 300;
/** Như ô địa chỉ của trang Mua thịt về trên website (tao_don_mua_thit, 0113): số nhà, tên đường, khu vực. */
export const DIA_CHI_TOI_THIEU = 8;
export const DIA_CHI_TOI_DA = 300;

/** Date có giờ địa phương bằng giờ Việt Nam lúc `ms`, để đưa vào hàm giờ của Mini App. */
export function dongHoVn(ms: number): Date {
  const m = gioVnTuMs(ms).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) throw new Error('Mốc giờ không hợp lệ');
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

/** Chữ người gõ: bỏ ký tự điều khiển, gộp khoảng trắng, NFC (bộ gõ có thể gửi dấu rời). */
export function lamSachChu(v: unknown): string {
  return String(typeof v === 'string' ? v : '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Băm thứ khách gửi lên — giỏ, giờ nhận, địa chỉ giao, tên, số, ghi chú — đã làm sạch, KHÔNG gồm giá hay kết quả kiểm. Gửi lại
 * cùng maGui sau khi giờ nhận vừa qua hay bảng giá vừa đổi vẫn ra cùng dấu: máy chủ trả lại đơn đã ghi, không bắt
 * khách đặt lại thành đơn thứ hai (may-chu.ts tra maGui trước khi gọi kiemDon).
 */
export function dauNoiDungGui(than: unknown): string {
  const b = (than && typeof than === 'object' && !Array.isArray(than) ? than : {}) as Record<string, unknown>;
  const khay = b.khay && typeof b.khay === 'object' && !Array.isArray(b.khay) ? (b.khay as Record<string, unknown>) : {};
  const gio = Object.entries(khay).filter(([, so]) => so !== 0).sort(([a], [c]) => (a < c ? -1 : a > c ? 1 : 0));
  const so = typeof b.dienThoai === 'string' ? b.dienThoai : '';
  const noiDung = {
    gio, cachNhan: b.cachNhan ?? null, ngay: b.ngay ?? null, gioNhan: b.gio ?? null, ten: lamSachChu(b.ten),
    dienThoai: chuanHoaSoDienThoai(so) ?? lamSachChu(so), ghiChu: lamSachChu(b.ghiChu),
    // Thêm ở CUỐI và chỉ khi có: thân không có diaChi (gửi trước 09/11) ra đúng dấu cũ — gửi lại cùng mã gửi sau khi
    // nâng cấp vẫn trả đơn đã ghi, không 409.
    ...(b.diaChi !== undefined ? { diaChi: lamSachChu(b.diaChi) } : {}),
  };
  return createHash('sha256').update(JSON.stringify(noiDung)).digest('hex');
}

/**
 * Kiểm thân yêu cầu POST /api/don.
 * Dạng: { maGui, khay: { "<mã phần thịt>": số khay }, cachNhan: "giao-hang", diaChi, ngay: "yyyy-mm-dd",
 *         gio: "HH:mm", ten, dienThoai, ghiChu? }
 */
export function kiemDon(than: unknown, ms: number): KetQuaKiem {
  const b = (than && typeof than === 'object' && !Array.isArray(than) ? than : {}) as Record<string, unknown>;
  const loi: string[] = [];

  const maGui = typeof b.maGui === 'string' ? b.maGui : '';
  if (!MAU_MA_GUI.test(maGui)) loi.push('Đơn thiếu mã gửi. Mở lại Mini App rồi gửi lại.');

  // Giỏ: mỗi phần thịt một số nguyên 1…soKhayToiDa. Mã lạ, phần tạm ngưng, phần chưa có giá: từ chối cả đơn —
  // khách phải thấy đúng thứ mình trả tiền.
  const khay = b.khay && typeof b.khay === 'object' && !Array.isArray(b.khay) ? (b.khay as Record<string, unknown>) : {};
  const dong: DongMoi[] = [];
  let coChon = false;   // có phần nào khác 0 khay — kể cả phần sai, đã có câu riêng
  for (const [ma, so] of Object.entries(khay)) {
    if (so === 0) continue;
    coChon = true;
    const sp = SAN_PHAM.find(s => s.ma === ma);
    if (!sp) { loi.push('Đơn có phần thịt quán không bán. Mở lại Mini App rồi chọn lại.'); continue; }
    if (typeof so !== 'number' || !Number.isInteger(so) || so < 1 || so > CAU_HINH.soKhayToiDa) {
      loi.push(`Số khay của ${sp.ten} phải từ 1 đến ${CAU_HINH.soKhayToiDa}.`);
      continue;
    }
    if (!sp.conHang) { loi.push(`${sp.ten} đang tạm ngưng bán.`); continue; }
    if (sp.giaMoiKhay === null) { loi.push(`${sp.ten} chưa có giá, chưa đặt trả trước được.`); continue; }
    dong.push({ maPhan: sp.ma, ten: sp.ten, baoQuan: sp.baoQuan, soGamKhay: sp.soGamKhay, soKhay: so, giaMoiKhay: sp.giaMoiKhay });
  }
  if (!coChon) loi.push('Bạn chưa chọn khay thịt nào.');
  // Cùng một câu cho nhiều mã lạ: chỉ giữ một.
  for (let i = loi.length - 1; i > 0; i--) if (loi.indexOf(loi[i]) < i) loi.splice(i, 1);
  // Thứ tự dòng theo SAN_PHAM, như tin đơn của Mini App.
  dong.sort((a, c) => SAN_PHAM.findIndex(s => s.ma === a.maPhan) - SAN_PHAM.findIndex(s => s.ma === c.maPhan));

  if (b.cachNhan !== 'giao-hang') loi.push('Đơn trả trước trong app hiện chỉ giao tận nơi.');
  const diaChi = lamSachChu(b.diaChi);
  if (b.cachNhan === 'giao-hang') {
    if (diaChi.length < DIA_CHI_TOI_THIEU) loi.push('Nhập địa chỉ giao hàng (số nhà, đường, phường).');
    else if (diaChi.length > DIA_CHI_TOI_DA) loi.push(`Địa chỉ giao dài quá ${DIA_CHI_TOI_DA} ký tự.`);
  }

  // Ngày giờ nhận: đúng dạng, có thật trên lịch, và nằm trong danh sách Mini App đang cho chọn lúc này.
  const ngay = typeof b.ngay === 'string' ? b.ngay : '';
  const gio = typeof b.gio === 'string' ? b.gio : '';
  const mNgay = ngay.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const ngayCoThat = !!mNgay && laNgayCoThat(+mNgay[1], +mNgay[2], +mNgay[3]);
  if (!ngayCoThat || !/^\d{2}:\d{2}$/.test(gio)) {
    loi.push('Chọn ngày và giờ nhận hàng.');
  } else {
    const bayGio = dongHoVn(ms);
    const ngayDuocChon = cacNgayChon(bayGio, CAU_HINH_GIO_GIAO).some(n => n.giaTri === ngay);
    if (!ngayDuocChon || !cacGioChon(ngay, bayGio, CAU_HINH_GIO_GIAO).includes(gio)) {
      loi.push('Giờ nhận này không còn chọn được. Chọn lại giờ nhận.');
    }
  }

  const ten = lamSachChu(b.ten);
  if (ten.length < TEN_TOI_THIEU) loi.push('Nhập tên người nhận để quán giao đúng người.');
  else if (ten.length > TEN_TOI_DA) loi.push(`Tên người nhận dài quá ${TEN_TOI_DA} ký tự.`);

  const dienThoai = chuanHoaSoDienThoai(typeof b.dienThoai === 'string' ? b.dienThoai : '');
  if (!dienThoai) loi.push('Số điện thoại chưa đúng: cần 10 số, bắt đầu bằng 0.');

  const ghiChu = lamSachChu(b.ghiChu);
  if (ghiChu.length > GHI_CHU_TOI_DA) loi.push(`Ghi chú dài quá ${GHI_CHU_TOI_DA} ký tự.`);

  if (loi.length) return { ok: false, loi };

  const tongTien = dong.reduce((t, d) => t + d.soKhay * d.giaMoiKhay, 0);
  const dauNoiDung = dauNoiDungGui(than);
  return {
    ok: true,
    don: {
      maGui, dong, tongTien, cachNhan: 'giao-hang', diaChi, ngayNhan: ngay, gioNhan: gio, ten, dienThoai: dienThoai!, ghiChu,
      giaThu: CAU_HINH.giaThu, dauNoiDung,
    },
  };
}
