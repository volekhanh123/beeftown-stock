/**
 * QUYẾT ĐỊNH CỦA TRANG CÔNG KHAI — nút nào, dẫn đi đâu, địa chỉ nào
 * =================================================================
 * Gom về một chỗ để kiểm thử được, thay vì rải điều kiện trong từng component.
 *
 * Nguyên tắc chung (web/README.md): dữ kiện CHỈ THÊM vào trang. Chưa công bố
 * Facebook thì không có nút Facebook; chưa có Maps thì không có nút Chỉ đường —
 * một nút dẫn tới hư không tệ hơn là không có nút.
 */
import { DIA_CHI_NHA_HANG, chu, duongDanTuongUng } from './chu.ts';
import type { NgonNgu, NoiDung } from './noi-dung.ts';

/**
 * Chỉ nhận đường dẫn http(s). Cổng nội dung do người gõ tay: một "javascript:…"
 * hay "data:…" gõ nhầm (hoặc cố ý) không được thành href trên trang công khai.
 */
export function urlAnToan(u: string | null | undefined): string | null {
  if (typeof u !== 'string' || !u.trim()) return null;
  try {
    const x = new URL(u.trim());
    return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : null;
  } catch {
    return null;
  }
}

export interface LienHe {
  facebook: string | null;
  maps: string | null;
  instagram: string | null;
  tiktok: string | null;
  zalo: string | null;
  /** Số để hiện, như đã công bố. */
  hotline: string | null;
  /** "tel:…" bỏ dấu cách — chỉ khi số chỉ gồm chữ số, dấu cách, + . - ( ). */
  goi: string | null;
  /** "mailto:…" — chỉ khi trông đúng là một địa chỉ email. */
  thu: string | null;
}

export function lienHe(nd: NoiDung): LienHe {
  const hotline = typeof nd.hotline === 'string' && /^[\d\s+().-]{6,}$/.test(nd.hotline.trim()) ? nd.hotline.trim() : null;
  const email = typeof nd.email_lien_he === 'string' && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(nd.email_lien_he.trim())
    ? nd.email_lien_he.trim() : null;
  return {
    facebook: urlAnToan(nd.facebook_url),
    maps: urlAnToan(nd.google_maps_url),
    instagram: urlAnToan(nd.instagram_url),
    tiktok: urlAnToan(nd.tiktok_url),
    zalo: urlAnToan(nd.zalo_oa_url),
    hotline,
    goi: hotline ? `tel:${hotline.replace(/[\s().-]/g, '')}` : null,
    thu: email ? `mailto:${email}` : null,
  };
}

/** Địa chỉ in trên trang: bản công bố trong /noi-bo nếu có, không thì địa chỉ cố định. */
export function diaChi(nd: NoiDung): string {
  const congBo = typeof nd.dia_chi_hien_thi === 'string' ? nd.dia_chi_hien_thi.trim() : '';
  return congBo || DIA_CHI_NHA_HANG;
}

/** Form hỏi bàn trên web đang mở (công tắc). Trang /dat-ban còn hỏi lịch trống. */
export function formHoiBanMo(nd: NoiDung): boolean {
  return nd.form_dat_ban_dang_mo === true;
}

/** Có ít nhất một kênh thật để hỏi bàn: form, Facebook, hotline hoặc email. */
export function coKenhHoiBan(nd: NoiDung): boolean {
  const lh = lienHe(nd);
  return formHoiBanMo(nd) || !!(lh.facebook || lh.goi || lh.thu);
}

export interface Nut {
  url: string;
  chu: string;
  kieu: 'chinh' | 'vien';
}

/**
 * Hai nút của màn hình đầu — thứ bậc theo mức sẵn sàng mở cửa (brief mục 5):
 *  · form hỏi bàn đang mở → "Hỏi bàn" là nút chính, "Khám phá thực đơn" phụ;
 *  · chưa mở → "Khám phá thực đơn" chính; "Hỏi bàn" phụ NẾU có kênh thật để hỏi
 *    (Facebook, hotline, email — trang /dat-ban chỉ khách sang đó), không thì nút
 *    phụ dẫn sang "Đến Beeftown" — đừng bắt khách đi một quãng để đọc lời từ chối.
 */
export function nutMoDau(nd: NoiDung, ngonNgu: NgonNgu): Nut[] {
  const t = chu(ngonNgu);
  const hoiBan = { url: duongDanTuongUng('/dat-ban', ngonNgu), chu: t.datBan };
  const thucDon = { url: duongDanTuongUng('/thuc-don', ngonNgu), chu: t.khamPhaThucDon };
  if (formHoiBanMo(nd)) return [{ ...hoiBan, kieu: 'chinh' }, { ...thucDon, kieu: 'vien' }];
  const phu = coKenhHoiBan(nd)
    ? hoiBan
    : { url: duongDanTuongUng('/den-beeftown', ngonNgu), chu: t.xemDuongLen };
  return [{ ...thucDon, kieu: 'chinh' }, { ...phu, kieu: 'vien' }];
}

/** Bốn mục điều hướng chính, theo thứ tự của brief. */
export function dieuHuong(ngonNgu: NgonNgu): { url: string; chu: string; duong: string }[] {
  const t = chu(ngonNgu);
  const trangChu = duongDanTuongUng('/', ngonNgu);
  return [
    { url: `${trangChu}#trai-nghiem`, chu: t.traiNghiem, duong: trangChu },
    { url: duongDanTuongUng('/thuc-don', ngonNgu), chu: t.thucDon, duong: duongDanTuongUng('/thuc-don', ngonNgu) },
    { url: duongDanTuongUng('/den-beeftown', ngonNgu), chu: t.denBeeftown, duong: duongDanTuongUng('/den-beeftown', ngonNgu) },
    { url: duongDanTuongUng('/dat-ban', ngonNgu), chu: t.datBan, duong: duongDanTuongUng('/dat-ban', ngonNgu) },
  ];
}
