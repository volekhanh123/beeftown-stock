/**
 * QUYẾT ĐỊNH CỦA TRANG CÔNG KHAI — nút nào, dẫn đi đâu, địa chỉ nào
 * =================================================================
 * Gom về một chỗ để kiểm thử được, thay vì rải điều kiện trong từng component.
 *
 * Nguyên tắc chung (web/README.md): dữ kiện CHỈ THÊM vào trang. Chưa công bố
 * Facebook thì không có nút Facebook; chưa có Maps thì không có nút Chỉ đường —
 * một nút dẫn tới hư không tệ hơn là không có nút.
 */
import { DIA_CHI_NHA_HANG, DIA_CHI_PHAN, chu, duongDanTuongUng } from './chu.ts';
import { muaThitVeMo } from './dich-dat-hang.ts';
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
  /** Câu để hiện, như đã công bố (có thể kèm chú thích: "0909 123 456 (Zalo)"). */
  hotline: string | null;
  /** "tel:…" chỉ gồm + và chữ số, lấy từ phần số ở đầu câu đã công bố. */
  goi: string | null;
  /** "mailto:…" — chỉ khi trông đúng là một địa chỉ email. */
  thu: string | null;
}

/**
 * Hotline đã công bố → { câu để hiện, số để gọi }. Câu phải BẮT ĐẦU bằng một số điện
 * thoại (chữ số, dấu cách, + . - ( ), ít nhất 8 chữ số); sau số được phép có chú thích,
 * cách số một dấu cách: "0909 123 456 (Zalo)", "1900 1234 – nhánh 2". Câu không mở đầu
 * bằng số ("gọi 0912…", "tel:…", "<script>…") hay số dính chữ ("0912;rm") thì bỏ hẳn.
 */
function docHotline(giaTri: unknown): { hien: string; so: string } | null {
  if (typeof giaTri !== 'string') return null;
  const cau = giaTri.trim();
  const m = /^(\+?[\d().-]+(?:\s+[\d().-]+)*)(?:\s+\S.*)?$/u.exec(cau);
  if (!m) return null;
  const so = m[1].replace(/[\s().-]/g, '');
  return so.replace(/\D/g, '').length >= 8 ? { hien: cau, so } : null;
}

export function lienHe(nd: NoiDung): LienHe {
  const hotline = docHotline(nd.hotline);
  const email = typeof nd.email_lien_he === 'string' && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(nd.email_lien_he.trim())
    ? nd.email_lien_he.trim() : null;
  return {
    facebook: urlAnToan(nd.facebook_url),
    maps: urlAnToan(nd.google_maps_url),
    instagram: urlAnToan(nd.instagram_url),
    tiktok: urlAnToan(nd.tiktok_url),
    zalo: urlAnToan(nd.zalo_oa_url),
    hotline: hotline?.hien ?? null,
    goi: hotline ? `tel:${hotline.so}` : null,
    thu: email ? `mailto:${email}` : null,
  };
}

/** Địa chỉ in trên trang: bản công bố trong /noi-bo nếu có, không thì địa chỉ cố định. */
export function diaChi(nd: NoiDung): string {
  const congBo = typeof nd.dia_chi_hien_thi === 'string' ? nd.dia_chi_hien_thi.trim() : '';
  return congBo || DIA_CHI_NHA_HANG;
}

/**
 * Địa chỉ tách theo dấu phẩy, để in từng cụm không gãy giữa chừng ("Hồ Tùng / Mậu",
 * "Tầng / 3"). Mỗi cụm mang theo dấu phẩy của nó (chu) và khoảng trắng đứng sau (cach):
 * ghép lại là ĐÚNG NGUYÊN VĂN địa chỉ, như diaChi() và JSON-LD in. Cụm dài quá (bản công
 * bố không có dấu phẩy) thì giu = false — để trình duyệt tự xuống dòng, không tràn ngang.
 * Mọi chỗ in địa chỉ theo cụm dùng chung hàm này (một ngưỡng, một cách tách).
 */
export function cumDiaChi(dc: string): { chu: string; cach: string; giu: boolean }[] {
  return [...dc.matchAll(/([^,]*,?)(\s*)/gu)]
    .filter(m => m[0] !== '')
    .map(m => ({ chu: m[1], cach: m[2], giu: m[1].length <= 25 }));
}

/**
 * Địa chỉ không có "Tầng 3" ở đầu — cho chỗ đã in chữ "Tầng 3" đậm ngay trước (menu gọn,
 * màn đầu). Vẫn đi qua diaChi(): bản công bố trong /noi-bo phải tới được MỌI chỗ in địa chỉ,
 * không thì một trang hiện hai địa chỉ khác nhau.
 *
 * Bỏ "Tầng 3" xong mà hết chữ (bản công bố gõ dở: "Tầng 3,") thì trả lại cả bản công bố —
 * dòng địa chỉ không bao giờ rỗng.
 */
export function diaChiSauTang(nd: NoiDung): string {
  const dayDu = diaChi(nd);
  return dayDu.replace(/^\s*tầng\s*3\s*[,·–-]\s*/iu, '') || dayDu;
}

/**
 * Địa chỉ ngắn nhất, cho dòng địa chỉ ở màn đầu trang chủ: sau chữ "Tầng 3" đậm chỉ còn số
 * nhà, tên đường, thành phố. Bản công bố trong /noi-bo có ghi phường ("…, phường X, …" hay
 * "…, P. X, …") thì bỏ vế phường đi — dòng đó phải nằm gọn trên điện thoại; khối địa chỉ, chân
 * trang và JSON-LD vẫn in đủ bản công bố.
 *   · Chỉ bỏ khi "phường" mở đầu một vế (đứng sau dấu phẩy): tên đường có chữ "Phường" thì giữ.
 *   · "P." đứng trước một con số là số phòng ("P.301"), không phải phường: giữ. Phường đánh số
 *     thì bản công bố viết đủ chữ "phường 12".
 *   · Bỏ xong mà hết chữ thì trả lại diaChiSauTang() — không bao giờ rỗng.
 */
export function diaChiManDau(nd: NoiDung): string {
  const sauTang = diaChiSauTang(nd);
  return sauTang.replace(/,\s*(?:phường\s+|p\.(?!\s*\d)\s*)[^,]+/iu, '') || sauTang;
}

/**
 * Địa chỉ cho JSON-LD (schema.org PostalAddress). Chưa công bố: tách đúng từ địa chỉ cố
 * định. Có bản công bố: đó là cả một dòng do người gõ, nên để nguyên ở streetAddress và
 * KHÔNG thêm phường / thành phố lần nữa (Google đọc thành địa chỉ lặp).
 *
 * Không có addressLocality: trường đó là chỗ của tên phường, mà phường của 63 Hồ Tùng Mậu
 * chưa có giấy xác nhận (DIA_CHI_PHAN trong lib/chu.ts). Thiếu một trường tùy chọn thì Google
 * vẫn đọc được địa chỉ; ghi một tên phường chưa chắc là khai sai.
 */
export function diaChiCoCauTruc(nd: NoiDung): Record<string, string> {
  const congBo = typeof nd.dia_chi_hien_thi === 'string' ? nd.dia_chi_hien_thi.trim() : '';
  if (congBo) return { '@type': 'PostalAddress', streetAddress: congBo, addressCountry: 'VN' };
  return {
    '@type': 'PostalAddress',
    streetAddress: DIA_CHI_PHAN.duong,
    addressRegion: DIA_CHI_PHAN.thanhPho,
    addressCountry: 'VN',
  };
}

/**
 * JSON để in vào <script type="application/ld+json">. JSON.stringify không thoát "<",
 * nên một mô tả gõ trong /noi-bo có "</script>" sẽ đóng thẻ sớm và phần sau thành HTML.
 * \u003c đọc lại vẫn là "<".
 */
export function jsonTrongScript(duLieu: unknown): string {
  return JSON.stringify(duLieu).replace(/</g, '\\u003c');
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

/**
 * Mô tả (meta description, og:description) của trang hỏi bàn. `moDuoc` là của tinhTrangDatBan()
 * (lib/dat-ban.ts) — form dựng được không: công tắc tắt, chưa nối database, không còn chỗ, đọc lịch
 * hỏng đều là KHÔNG, và khi đó TrangDatBan hiện thẻ "chưa mở". Không dựng được form thì mô tả không
 * hứa "gửi yêu cầu, nhà hàng gọi lại" — kết quả Google và ô xem trước link trên Facebook nói đúng
 * điều trang nói (kiểm site thật 07/10/2026: form đóng mà mô tả vẫn hứa). Lượt vừa gửi xong thì
 * thẻ "đã nhận" thay thẻ "chưa mở", nhưng kết quả đó đến từ cookie của riêng một khách — trình quét
 * link không bao giờ thấy; mô tả theo moDuoc nói đúng tình trạng lúc trang được đọc.
 */
export function moTaTrangHoiBan(ngonNgu: NgonNgu, moDuoc: boolean): string {
  const t = chu(ngonNgu);
  return moDuoc ? t.moTaHoiBan : t.moTaHoiBanChuaMo;
}

/**
 * Mô tả (meta description, og:description) của trang Mua thịt về. `mo` do file vỏ tính: trạng thái trang là 'mo'
 * hoặc 'het_quay' (trang liệt kê gói kèm giá). Chưa mở, chưa nối database hay đọc menu lỗi thì mô tả nói đúng điều
 * trang nói — chưa mở — không hứa gửi đơn (khuôn moTaTrangHoiBan).
 */
export function moTaTrangMuaThit(ngonNgu: NgonNgu, mo: boolean): string {
  const t = chu(ngonNgu);
  return mo ? t.moTaMuaThit : t.moTaMuaThitChuaMo;
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

/**
 * Mục điều hướng chính, theo thứ tự của brief. Bốn mục; năm khi trang Mua thịt về mở (công tắc hiệu lực của
 * database, dich-dat-hang.ts) — "Mua thịt về" đứng ngay sau "Thực đơn", "Hỏi bàn" vẫn là mục cuối. Không có `nd`
 * (trang không đọc nội dung) thì bốn mục: điều hướng không bao giờ dẫn tới một trang đang "chưa mở".
 */
export function dieuHuong(ngonNgu: NgonNgu, nd?: NoiDung): { url: string; chu: string; duong: string }[] {
  const t = chu(ngonNgu);
  const trangChu = duongDanTuongUng('/', ngonNgu);
  const muc = (duongViet: string, chuMuc: string) => {
    const duong = duongDanTuongUng(duongViet, ngonNgu);
    return { url: duong, chu: chuMuc, duong };
  };
  return [
    { url: `${trangChu}#trai-nghiem`, chu: t.traiNghiem, duong: trangChu },
    muc('/thuc-don', t.thucDon),
    ...(nd && muaThitVeMo(nd) ? [muc('/mua-thit-ve', t.muaThitVe)] : []),
    muc('/den-beeftown', t.denBeeftown),
    muc('/dat-ban', t.datBan),
  ];
}
