/**
 * META PIXEL — beeftown.vn đo lượt xem và nút bấm cho quảng cáo Facebook, Instagram
 * ==================================================================================
 * Khánh giao 27/10/2026 (bản giao "Gắn Meta Pixel lên beeftown.vn"). Pixel "Beeftown Pixel", ID 1486681409963017,
 * thuộc Business Beeftown (2104301050185040). ID là số công khai — nằm trong mã trang của mọi web dùng pixel — nên
 * để thẳng ở đây, không qua biến môi trường: trang dựng đúng cả khi CI build không có .env.
 *
 * GẮN Ở ĐÂU. Chỉ khung trang công khai (layouts/Trang.astro): mã gốc của Meta ở cuối <head>, một lần cho mọi trang
 * vi / en / ko — trừ trang 404 (khongLapChiMuc). Không gắn ở /noi-bo, kho, /hook, /mini-app, Beeftown Cân, Mini App
 * Zalo (crm/test/test-cong-khai-meta-pixel.mjs giữ).
 *
 * KHÔNG HỎI ĐỒNG Ý, NÊN KHÔNG GỬI THÔNG TIN CÁ NHÂN NÀO (Khánh chốt 27/10/2026: bật cho mọi người):
 *   · guiSuKien() không nhận tham số nào ngoài tên sự kiện: mọi sự kiện chỉ kèm { content_name, language }, dựng từ
 *     thuộc tính data-pixel-trang của <body> và lang của <html>. Không chỗ gọi nào đưa được tên, số điện thoại, mã
 *     đặt bàn vào fbq.
 *   · fbq('init') chỉ có ID — không So khớp nâng cao (Advanced Matching), cũng đang Tắt trong Trình quản lý sự kiện.
 *   · URL không mang số điện thoại: form có ô cá nhân (hỏi bàn, nộp hồ sơ) là POST, gửi xong về đường dẫn trơn;
 *     form GET (đổi ngày hỏi bàn, Mua thịt về) chỉ mang ngày, mã gói, số gói.
 *   Trang Quyền riêng tư (vi / en / ko) ghi đúng những gì Meta nhận.
 *
 * SỰ KIỆN — mỗi sự kiện một chỗ gửi:
 *   PageView          mỗi lần mở trang: mã gốc tự gửi.
 *   ViewContent       mở trang Thực đơn (/thuc-don, /en/menu, /ko/menu): script của Trang.astro, theo suKienMoTrang.
 *   Contact           bấm link tel:, Zalo, Messenger (m.me) ở mọi trang, cả bấm chuột giữa (mở thẻ mới): script của
 *                     Trang.astro, theo suKienCuaLink.
 *   InitiateCheckout  bấm "Xem đơn" ở Mua thịt về: script của TrangMuaThitVe.astro, guiSuKienMotLan theo giỏ — một
 *                     giỏ một lần, kể cả bấm lại "Xem đơn" ở trang xem đơn; đổi giỏ rồi xem đơn là lần mới.
 *   Lead              thẻ "đã nhận yêu cầu" của trang hỏi bàn hiện ra — máy chủ chỉ dựng thẻ đó khi database đã trả
 *                     mã (lib/xu-ly-form.ts): script của TrangDatBan.astro, guiSuKienMotLan theo mã — tải lại hay
 *                     bấm Back về thẻ đó không thành Lead thứ hai.
 *
 * SCRIPT CỦA META TẢI HỎNG (chặn quảng cáo, mất mạng): mã gốc tải fbevents.js bất đồng bộ, fbq của mã gốc chỉ xếp
 * hàng lời gọi. Mọi lời gọi ngoài mã gốc đi qua guiSuKien: kiểm typeof fbq === 'function' và nuốt mọi lỗi — trang,
 * form hỏi bàn, Mua thịt về chạy như không có pixel. Kiểm thử trình duyệt chặn Meta ở mọi trang (kiem-tra/chan-meta.mjs).
 *
 * File thuần (không import gì): script của trang nạp được mà không kéo thêm thư viện nào vào trình duyệt.
 */

/** ID của Beeftown Pixel (tập dữ liệu 1486681409963017 trong Trình quản lý sự kiện). */
export const MA_PIXEL = '1486681409963017';

export type SuKienPixel = 'PageView' | 'ViewContent' | 'Contact' | 'InitiateCheckout' | 'Lead';
type NgonNguPixel = 'vi' | 'en' | 'ko';

/** Đúng hai trường, không hơn: tên trang và thứ tiếng. */
export interface ThamSoPixel {
  content_name: string;
  language: NgonNguPixel;
}

/** Tên trang: chữ thường, số, gạch nối — đúng dạng tenTrangPixel() dựng. */
const MAU_TEN_TRANG = /^[a-z0-9-]{1,40}$/;

/**
 * Tên trang gửi kèm sự kiện: đường dẫn bản tiếng Việt bỏ dấu "/" ('thuc-don', 'dat-ban', 'mua-thit-ve') — một tên
 * cho cả ba thứ tiếng, thứ tiếng nằm ở trường language. Trang chủ là 'trang-chu'.
 */
export function tenTrangPixel(duongDanVi: string): string {
  return duongDanVi.replace(/^\/+|\/+$/g, '') || 'trang-chu';
}

/** Sự kiện gửi ngay khi mở trang, ngoài PageView của mã gốc. */
const SU_KIEN_MO_TRANG: Readonly<Record<string, SuKienPixel>> = { 'thuc-don': 'ViewContent' };

/** Sự kiện của lúc mở trang có tên này (ngoài PageView); không có thì null. */
export function suKienMoTrang(tenTrang: string | null | undefined): SuKienPixel | null {
  // hasOwnProperty.call, không Object.hasOwn: code này chạy trong trình duyệt, và WebView Android cũ (trước Chromium 93)
  // không có Object.hasOwn — ném lỗi ở đây là script của Trang.astro dừng trước khi gắn listener Contact.
  return typeof tenTrang === 'string' && Object.prototype.hasOwnProperty.call(SU_KIEN_MO_TRANG, tenTrang)
    ? SU_KIEN_MO_TRANG[tenTrang] : null;
}

/**
 * Mã gốc Meta Pixel (Trình quản lý sự kiện → "Get started"), đúng từng chữ — chỉ thay ID. Trang.astro in nguyên khối
 * này ở cuối <head>; kiểm thử so nó với bản Meta đưa.
 */
export function khoiMaPixel(id: string = MA_PIXEL): string {
  if (!/^\d{15,16}$/.test(id)) throw new Error(`ID pixel không đúng dạng: ${id}`);
  return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;
}

/**
 * Link đáng một sự kiện Contact: gọi điện (tel:), Zalo (zalo.me và tên miền con — link OA, Mini App), Messenger
 * (m.me, messenger.com). Link Trang Facebook, Instagram, email, link trong trang: không phải.
 */
export function suKienCuaLink(href: string | null | undefined): 'Contact' | null {
  if (typeof href !== 'string') return null;
  const lien = href.trim();
  if (/^tel:/i.test(lien)) return 'Contact';
  let u: URL;
  try { u = new URL(lien); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const may = u.hostname.toLowerCase();
  const thuoc = (ten: string) => may === ten || may.endsWith('.' + ten);
  return thuoc('zalo.me') || thuoc('m.me') || thuoc('messenger.com') ? 'Contact' : null;
}

/** Những gì guiSuKien đọc từ trình duyệt — kiểm thử truyền một bản giả. */
export interface MoiTruongPixel {
  fbq?: unknown;
  document?: {
    documentElement?: { lang?: string } | null;
    body?: { dataset?: Record<string, string | undefined> } | null;
  };
  sessionStorage?: Pick<Storage, 'getItem' | 'setItem'>;
}

const moiTruongThat = () => globalThis as unknown as MoiTruongPixel;

/** Tham số của trang đang mở; trang không gắn pixel (404, thiếu data-pixel-trang) hay thứ tiếng lạ → null. */
export function thamSoTrang(mt: MoiTruongPixel = moiTruongThat()): ThamSoPixel | null {
  const tenTrang = mt.document?.body?.dataset?.pixelTrang;
  const lang = mt.document?.documentElement?.lang;
  if (typeof tenTrang !== 'string' || !MAU_TEN_TRANG.test(tenTrang)) return null;
  if (lang !== 'vi' && lang !== 'en' && lang !== 'ko') return null;
  return { content_name: tenTrang, language: lang };
}

/**
 * Gửi một sự kiện chuẩn của Meta. Trả về true khi đã gọi fbq. Không bao giờ ném lỗi: fbq không có (script bị chặn
 * trước khi chạy, trang 404) hay fbq ném lỗi thì trả false và trang chạy tiếp.
 */
export function guiSuKien(ten: SuKienPixel, mt: MoiTruongPixel = moiTruongThat()): boolean {
  try {
    const fbq = mt.fbq;
    if (typeof fbq !== 'function') return false;
    const thamSo = thamSoTrang(mt);
    if (!thamSo) return false;
    fbq('track', ten, thamSo);
    return true;
  } catch {
    return false;
  }
}

/** Khóa sessionStorage giữ các lượt đã gửi của guiSuKienMotLan (theo thẻ trình duyệt). */
export const KHOA_DA_GUI = 'bt-pixel-da-gui';

/**
 * Gửi sự kiện một lần cho mỗi khóa trong thẻ trình duyệt này (Lead: mã đặt bàn; InitiateCheckout: giỏ). Khóa chỉ nằm
 * trong sessionStorage, không bao giờ tới fbq. Vì sao cần: bấm Back về trang "đã nhận" mà trình duyệt lấy trang từ bộ
 * nhớ đệm (không phải bfcache — hay gặp ở trình duyệt trong app Facebook, Zalo) thì trang dựng lại và script chạy lại.
 * Bộ nhớ bị chặn (chế độ riêng tư) thì gửi như guiSuKien — mỗi lượt dựng trang một lần. Trả về true khi lần này đã gọi fbq.
 */
export function guiSuKienMotLan(ten: SuKienPixel, khoa: string, mt: MoiTruongPixel = moiTruongThat()): boolean {
  const luot = `${ten}:${khoa}`;
  let daGui: string[] = [];
  try {
    const s = mt.sessionStorage?.getItem(KHOA_DA_GUI);
    const d: unknown = s ? JSON.parse(s) : [];
    if (Array.isArray(d)) daGui = d.filter((x): x is string => typeof x === 'string');
  } catch { /* không đọc được: như chưa gửi lượt nào */ }
  if (daGui.includes(luot)) return false;
  const gui = guiSuKien(ten, mt);
  if (gui) {
    try { mt.sessionStorage?.setItem(KHOA_DA_GUI, JSON.stringify([...daGui, luot].slice(-20))); } catch { /* không giữ được thì thôi */ }
  }
  return gui;
}
