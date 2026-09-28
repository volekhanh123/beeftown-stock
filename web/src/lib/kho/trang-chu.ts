/**
 * KHO — TÍNH TOÁN CHO TRANG CHỦ (thuần, test được bằng Node)
 *
 * "Xếp ra bán trước": nhân viên quầy xếp gói hạn gần lên phía trước để khách
 * lấy trước. Phần mềm chỉ ra gói nào: mỗi món ở quầy, lô còn hạn gần nhất.
 * (Từ 0054 có thêm mã giảm giá cận date — lib/kho/ma-giam.ts, Beeftown Cân.)
 */

import type { DongTon } from './ton.ts';
import { dinhDangNgayNgan, type HaiThuTieng, type NgonNguNB } from './chung.ts';

export interface GoiYXep {
  mat_hang_id: string;
  ten: string;
  /** Lô nên để phía trước (còn hạn, hạn gần nhất). */
  truoc: DongTon;
  /** Các lô khác của món này ở quầy, hạn xa hơn. */
  sau: DongTon[];
  /** Câu dặn ngắn cho nhân viên. */
  cau: string;
  gap: boolean;
  /** Số tảng gốc của lô phía trước (món theo tảng, 0050) — null khi không theo tảng. */
  so_tang: number | null;
}

/**
 * Gợi ý xếp quầy. Chỉ tính hàng ở QUẦY và CÒN HẠN (hàng hết hạn không bán —
 * báo hủy, nằm ở danh sách khác). Món có một lô duy nhất và còn xa hạn thì
 * không cần dặn gì.
 *
 * soTang (0050, kho_v_lo_tang): lô → số tảng gốc. Có thì câu dặn nói số tảng
 * trên tem ("tảng #0142") — nhân viên nhìn tem là biết gói nào.
 */
export function goiYXepQuay(ton: DongTon[], nn: NgonNguNB = 'vi', soTang?: ReadonlyMap<string, number>): GoiYXep[] {
  const theoMon = new Map<string, DongTon[]>();
  for (const t of ton) {
    if (t.loai_vi_tri !== 'quay' || t.tinh_trang_han === 'het_han') continue;
    if (t.so_goi <= 0 && t.so_kg <= 0) continue;
    const ds = theoMon.get(t.mat_hang_id) ?? [];
    ds.push(t);
    theoMon.set(t.mat_hang_id, ds);
  }
  const ra: GoiYXep[] = [];
  for (const [id, ds] of theoMon) {
    ds.sort((a, b) => a.han_dung.localeCompare(b.han_dung) || a.ngay_dong_goi.localeCompare(b.ngay_dong_goi)
      || a.ma_lo.localeCompare(b.ma_lo));
    const [truoc, ...sau] = ds;
    const gap = truoc.tinh_trang_han === 'sap_het';
    const nhieuHan = sau.some(s => s.han_dung !== truoc.han_dung);
    if (!gap && !nhieuHan) continue;
    const soLuong = truoc.dem_goi && truoc.so_goi > 0 ? `${truoc.so_goi} ${truoc.don_vi_goi}` : `${truoc.so_kg} kg`;
    const c = (x: HaiThuTieng) => x[nn];
    const han = truoc.so_ngay_con === 0 ? c({ vi: 'hết hạn hôm nay', en: 'expires today' })
      : truoc.so_ngay_con === 1 ? c({ vi: 'còn 1 ngày', en: '1 day left' })
      : c({ vi: `hạn ${dinhDangNgayNgan(truoc.han_dung)}`, en: `use by ${dinhDangNgayNgan(truoc.han_dung)}` });
    const ngayDong = dinhDangNgayNgan(truoc.ngay_dong_goi);
    const tang = soTang?.get(truoc.lo_id) ?? null;
    const soTangChu = tang === null ? '' : `#${String(tang).padStart(4, '0')}`;
    ra.push({
      mat_hang_id: id, ten: truoc.ten_hang, truoc, sau, gap, so_tang: tang,
      cau: tang === null
        ? c({ vi: `Để ${soLuong} đóng ngày ${ngayDong} (${han}) lên phía trước.`,
              en: `Put the ${soLuong} packed on ${ngayDong} (${han}) at the front.` })
        : c({ vi: `Để ${soLuong} tảng ${soTangChu} (tem ghi ${soTangChu}, ${han}) lên phía trước.`,
              en: `Put the ${soLuong} from primal ${soTangChu} (label shows ${soTangChu}, ${han}) at the front.` }),
    });
  }
  return ra.sort((a, b) => Number(b.gap) - Number(a.gap)
    || a.truoc.so_ngay_con - b.truoc.so_ngay_con || a.ten.localeCompare(b.ten, 'vi'));
}

/** Ngày đầu tháng của một ngày YYYY-MM-DD. */
export function dauThang(iso: string): string {
  return iso.slice(0, 8) + '01';
}

/** Phần trăm thay đổi so với kỳ trước (null khi kỳ trước = 0 hoặc thiếu). */
export function thayDoiPt(nay: number | null, truoc: number | null): number | null {
  if (nay === null || truoc === null || truoc === 0) return null;
  return Math.round(((nay - truoc) / Math.abs(truoc)) * 1000) / 10;
}
