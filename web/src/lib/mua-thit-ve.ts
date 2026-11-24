/**
 * MUA THỊT VỀ — ĐỌC MENU CHO TRANG CÔNG KHAI, qua đúng một cửa: mua_thit_ve_cong_khai() (migration 0101)
 * =====================================================================================================
 *
 * Database quyết định gói nào được hiện và giá bao nhiêu: chỉ khi kênh mở (công tắc hien_mua_thit_ve bật — từ 0113
 * không còn đòi link Zalo OA), chỉ sản phẩm Đang bán, kênh website, đã được chủ chốt giá ở /noi-bo/ban-le; giá là giá gói
 * trong ảnh chụp lần chốt (Khánh 26/10/2026 — giá mỗi kg ở Kho đổi sau đó thì trang vẫn giữ giá đã chốt, quán báo
 * tổng tiền khi xác nhận đơn). Hàm không trả mã nội bộ, giá kg hay số tồn. Trang chỉ trình bày, thêm vài lớp chặn:
 *
 *  · Lớp chặn thứ hai (nhomMuaThitVe): dòng hỏng bị bỏ; giá không phải số nguyên dương → bỏ gói (không bao giờ
 *    "liên hệ" hay ô giá trống); tên dính chữ cấm (chuoi-cam.js) hay còn ngoặc vuông → bỏ cả sản phẩm; mô tả,
 *    cách dùng dính → không hiện.
 *  · Không ném lỗi: chưa nối database → menu rỗng 'chua_noi', không log (trang đúng và đủ khi chưa có database:
 *    trạng thái "chưa mở"). Đã nối mà lỗi, ném, không trả lời trong HET_GIO_MS, hay trả thứ không phải danh sách →
 *    'loi' và ĐÚNG MỘT dòng log "[mua-thit-ve]" (Cloudflare → Workers → Logs) — không có dòng đó, database chết
 *    trông y hệt trang chưa mở.
 *  · Hạn chờ 4 giây: Worker không có hạn chờ mặc định; hết hạn thì hủy lời gọi (abortSignal của supabase-js).
 *    Không đệm trong Worker: giá vừa chốt phải lên trang ngay.
 *
 * File chỉ chạy ở máy chủ (nạp supabase-js qua noi-dung.ts). Phần tính đơn chạy cả trong trình duyệt nằm ở
 * don-mua-thit.ts; gửi đơn lên database ở dat-hang-mua-thit.ts; trangThaiMuaThit nhận `mo` (muaThitVeMo của
 * dich-dat-hang.ts) làm tham số. Kiểm thử: crm/test/test-mua-thit-ve-web.mjs.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { taoClient, maChiNhanh, type NgonNgu } from './noi-dung.ts';
import { timChuoiCam } from './chuoi-cam.js';
import { khoaGoi, type BaoQuan, type DonVi, type GoiMua, type SanPhamMua } from './don-mua-thit.ts';
import { mucPhanThit, tenHienThi } from './ten-phan-thit.ts';
import { duongDanTuongUng } from './chu.ts';

/** Một dòng mua_thit_ve_cong_khai() trả về — đúng 11 cột, đúng thứ tự của 0101. */
export interface DongMuaThitVe {
  san_pham_ma: string;
  loai: 'thit' | 'kim_chi';
  don_vi: DonVi;
  bao_quan: BaoQuan;
  ten: string;
  ten_vi: string;
  mo_ta: string | null;
  cach_dung: string | null;
  so_gam: number;
  gia: number;
  tam_het: boolean;
}

/** chua_noi: trang chưa nối database; loi: đã nối mà không đọc được; co: database đã trả lời (có thể rỗng). */
export type TinhTrangMenu = 'chua_noi' | 'loi' | 'co';
export type LoaiNhom = 'mat' | 'dong_lanh' | 'kim_chi';

export interface MenuMuaThit {
  tinhTrang: TinhTrangMenu;
  /** Theo thứ tự database: thịt trước kim chi, rồi thứ tự chủ đặt. */
  sanPham: SanPhamMua[];
  /** Thịt mát → Thịt đông lạnh → Kim chi; nhóm rỗng không có. */
  nhom: { loai: LoaiNhom; sanPham: SanPhamMua[] }[];
}

export const MENU_RONG: MenuMuaThit = Object.freeze({
  tinhTrang: 'chua_noi', sanPham: Object.freeze([]), nhom: Object.freeze([]),
}) as unknown as MenuMuaThit;

const MENU_LOI: MenuMuaThit = Object.freeze({ ...MENU_RONG, tinhTrang: 'loi' }) as MenuMuaThit;

/** Hạn chờ database của trang (ms). */
export const HET_GIO_MS = 4000;

const LA_LOAI = new Set(['thit', 'kim_chi']);
const LA_DON_VI = new Set(['goi', 'hop']);
const LA_BAO_QUAN = new Set(['mat', 'giu_lanh', 'dong_lanh']);
/** Mã sản phẩm của 0099: chữ thường không dấu, số, gạch nối; tối đa 40 ký tự. Nó thành tên ô form (khoaGoi). */
const MA_SAN_PHAM = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NGOAC_VUONG = /[[\]]/;

/** Chữ một dòng: xuống dòng, tab, nhiều dấu cách → một dấu cách (tên đi vào tin đơn từng dòng). Trống → null. */
function motDong(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  return s || null;
}

/** Chữ khách đọc: trống, còn ngoặc vuông (chữ tạm) hay dính chữ cấm → null. */
function chuSach(v: unknown): string | null {
  if (typeof v !== 'string' || !v.trim()) return null;
  const s = v.trim();
  return NGOAC_VUONG.test(s) || timChuoiCam(s).length > 0 ? null : s;
}

/** Số nguyên dương an toàn; PostgREST có thể trả bigint dạng chuỗi chữ số. Còn lại → null. */
function soNguyenDuong(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^[1-9][0-9]*$/.test(v) ? Number(v) : NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/**
 * Các dòng của database → sản phẩm, mỗi sản phẩm các gói của nó, giữ thứ tự database. Lớp chặn thứ hai — xem
 * đầu file. Không ném lỗi với dữ liệu nào.
 */
export function nhomMuaThitVe(dong: unknown): SanPhamMua[] {
  if (!Array.isArray(dong)) return [];
  const theoMa = new Map<string, SanPhamMua>();
  const boSanPham = new Set<string>();
  for (const d of dong as Partial<Record<keyof DongMuaThitVe, unknown>>[]) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) continue;
    const ma = typeof d.san_pham_ma === 'string' && d.san_pham_ma.length <= 40 && MA_SAN_PHAM.test(d.san_pham_ma) ? d.san_pham_ma : null;
    const ten = motDong(d.ten);
    const tenVi = motDong(d.ten_vi);
    if (!ma || !ten || !tenVi) continue;
    // Tên là thứ khách đọc trên thẻ và nhân viên đọc trong tin: một chữ cấm hay chữ tạm là bỏ cả sản phẩm.
    if (NGOAC_VUONG.test(ten) || NGOAC_VUONG.test(tenVi) || timChuoiCam(ten).length > 0 || timChuoiCam(tenVi).length > 0) {
      boSanPham.add(ma);
      continue;
    }
    const soGam = typeof d.so_gam === 'number' && Number.isInteger(d.so_gam) && d.so_gam >= 50 && d.so_gam <= 5000 ? d.so_gam : null;
    const gia = soNguyenDuong(d.gia);
    if (soGam === null || gia === null || !LA_LOAI.has(d.loai as string) || !LA_DON_VI.has(d.don_vi as string)
      || !LA_BAO_QUAN.has(d.bao_quan as string)) continue;

    let sp = theoMa.get(ma);
    if (!sp) {
      sp = {
        ma, loai: d.loai as SanPhamMua['loai'], donVi: d.don_vi as DonVi, baoQuan: d.bao_quan as BaoQuan,
        ten, tenVi, moTa: chuSach(d.mo_ta), cachDung: chuSach(d.cach_dung), goi: [],
      };
      theoMa.set(ma, sp);
    }
    if (sp.goi.some(g => g.soGam === soGam)) continue;   // trùng (sản phẩm, cỡ gói): giữ dòng đầu
    const goi: GoiMua = { khoa: khoaGoi(ma, soGam), soGam, gia, tamHet: d.tam_het === true };
    sp.goi.push(goi);
  }
  return [...theoMa.values()].filter(sp => !boSanPham.has(sp.ma) && sp.goi.length > 0);
}

const THU_TU_NHOM: readonly LoaiNhom[] = ['mat', 'dong_lanh', 'kim_chi'];
const nhomCua = (sp: SanPhamMua): LoaiNhom =>
  sp.loai === 'kim_chi' ? 'kim_chi' : sp.baoQuan === 'dong_lanh' ? 'dong_lanh' : 'mat';

/** Thịt mát (thịt mát và giữ lạnh) → Thịt đông lạnh → Kim chi; trong nhóm giữ thứ tự database; bỏ nhóm rỗng. */
export function chiaNhom(sanPham: readonly SanPhamMua[]): MenuMuaThit['nhom'] {
  return THU_TU_NHOM.map(loai => ({ loai, sanPham: sanPham.filter(sp => nhomCua(sp) === loai) })).filter(n => n.sanPham.length > 0);
}

const thongDiep = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Đọc menu mua thịt về đúng thứ tiếng của trang. Không ném lỗi — xem đầu file. `hetGioMs` chỉ để kiểm thử đổi.
 */
export async function docMuaThitVe(
  ngonNgu: NgonNgu = 'vi',
  client: Pick<SupabaseClient, 'rpc'> | null = taoClient(),
  hetGioMs = HET_GIO_MS,
): Promise<MenuMuaThit> {
  if (!client) return MENU_RONG;
  const huy = new AbortController();
  let hen: ReturnType<typeof setTimeout> | undefined;
  try {
    const truyVan = client.rpc('mua_thit_ve_cong_khai', { p_ngon_ngu: ngonNgu, p_chi_nhanh_ma: maChiNhanh() });
    // Builder của supabase-js có abortSignal(); client giả của kiểm thử có thể không có.
    const coHuy = truyVan as unknown as { abortSignal?: (s: AbortSignal) => unknown };
    if (typeof coHuy.abortSignal === 'function') coHuy.abortSignal(huy.signal);
    const hetGio = new Promise<'het_gio'>(xong => { hen = setTimeout(() => xong('het_gio'), hetGioMs); });
    const kq = await Promise.race([truyVan, hetGio]);
    if (kq === 'het_gio') {
      huy.abort();
      console.error(`[mua-thit-ve] hết giờ sau ${hetGioMs} ms`);
      return MENU_LOI;
    }
    const { data, error } = kq;
    if (error) {
      console.error('[mua-thit-ve] không đọc được menu mua thịt về:', error.code ?? '', error.message);
      return MENU_LOI;
    }
    if (!Array.isArray(data)) {
      console.error('[mua-thit-ve] menu mua thịt về không phải danh sách:', data === null ? 'null' : typeof data);
      return MENU_LOI;
    }
    const sanPham = nhomMuaThitVe(data);
    return { tinhTrang: 'co', sanPham, nhom: chiaNhom(sanPham) };
  } catch (e) {
    console.error('[mua-thit-ve] không gọi được database:', thongDiep(e));
    return MENU_LOI;
  } finally {
    clearTimeout(hen);
  }
}

/** Trạng thái của trang — một bảng chân trị cho điều hướng, trang và form. */
export type TrangThaiTrang = 'chua_mo' | 'loi' | 'mo' | 'het_quay';

/**
 * NEO CỦA MỘT GÓI: id của thẻ sản phẩm trên trang Mua thịt về (MuaThitThe.astro), `goi-<mã sản phẩm>`. Mã sản phẩm của
 * 0099 chỉ có chữ thường không dấu, số, gạch nối (MA_SAN_PHAM) nên là id hợp lệ và ổn định — không đổi khi chủ đổi tên,
 * giá hay thứ tự. Ba nơi dùng cùng hàm này: id của thẻ, link "Xem các gói" ở đầu trang, và `url` trong JSON-LD.
 */
export function idNeoGoi(maSanPham: string): string {
  return `goi-${maSanPham}`;
}

/**
 * Link từ trang Các phần thịt bò tới gói tương ứng trên trang Mua thịt về cùng thứ tiếng: id phần thịt (PHAN_BO) →
 * `/mua-thit-ve#goi-<mã>` (đã đổi sang đường dẫn của thứ tiếng). Dùng đúng bảng ghép của ten-phan-thit.ts
 * (PHAN_THIT, chiều ngược của lienKetPhanThit), nên "Ribeye" và "Ribeye with Cap" cùng thuộc đầu thăn ngoại: lấy gói
 * đứng trước trong menu. Chỉ khi trang Mua thịt về đang liệt kê gói (mo, het_quay) và gói CÓ trong menu đó — phần thịt
 * không có gói thì không có mục, link không bao giờ trỏ vào neo không tồn tại. Menu rỗng, trang chưa mở hay lỗi → {}.
 */
export function duongGoiTheoPhan(
  menu: MenuMuaThit, trangThai: TrangThaiTrang, ngonNgu: NgonNgu,
): Record<string, string> {
  if (trangThai !== 'mo' && trangThai !== 'het_quay') return {};
  const kq: Record<string, string> = {};
  for (const sp of menu.sanPham) {
    const muc = sp.goi.length > 0 ? mucPhanThit(sp) : null;
    if (muc && !(muc in kq)) kq[muc] = `${duongDanTuongUng('/mua-thit-ve', ngonNgu)}#${idNeoGoi(sp.ma)}`;
  }
  return kq;
}

/**
 * Thứ JSON-LD cần biết về trang (trang truyền vào, không bịa trong lib):
 *   · goc — Astro.site.origin ("https://beeftown.vn"; rỗng khi không có site: url thành đường dẫn tương đối);
 *   · duongTrang — đường dẫn của chính trang ("/mua-thit-ve", "/en/buy-meat"), không chuỗi truy vấn;
 *   · duongDoiTra — trang Đổi trả và hoàn tiền cùng thứ tiếng;
 *   · phiGiaoDaGom — trang CÓ in câu "Giá gói đã gồm phí giao" (traVnpay của TrangMuaThitVe.astro). Khi trang chưa
 *     in câu đó (khách được báo phí giao khi quán gọi xác nhận) thì KHÔNG khai phí giao 0 đồng.
 */
export interface TrangJsonLd {
  goc: string;
  duongTrang: string;
  duongDoiTra: string;
  phiGiaoDaGom: boolean;
}

/** Địa chỉ của gói trên trang: trang + neo của thẻ. Product và mọi Offer của nó cùng một địa chỉ. */
const urlGoi = (trang: TrangJsonLd, maSanPham: string): string => `${trang.goc}${trang.duongTrang}#${idNeoGoi(maSanPham)}`;

/**
 * Phí giao và đổi trả của mỗi Offer — chỉ dữ kiện đã in trên trang:
 *   · shippingDetails: 0 đồng, tới TP.HCM (ISO 3166-2 "VN-SG"), chỉ khi `phiGiaoDaGom`. Căn cứ: trang Mua thịt về "Giá gói
 *     đã gồm phí giao" (c.dieuGiaVnpay) và trang Chính sách giá "Giá gói đã gồm phí giao trong khu vực ở trang Giao hàng".
 *     Không khai giờ giao hay số ngày giao: trang Giao hàng chỉ nói "trong giờ làm việc của quán", quán gọi hẹn giờ.
 *   · hasMerchantReturnPolicy: trang Đổi trả và hoàn tiền (lib/chinh-sach.ts, doiTra) "Beeftown không nhận trả khi bạn
 *     đổi ý sau khi đã nhận hàng, vì thịt và kim chi đã giao không bán lại được" → MerchantReturnNotPermitted. Không khai
 *     số ngày: thời hạn báo lỗi của trang là 24 GIỜ và chỉ áp dụng cho hàng lỗi (giao sai, thiếu, rách, không còn lạnh, quá
 *     hạn), không phải thời hạn trả hàng — nên không dùng MerchantReturnFiniteReturnWindow (đòi merchantReturnDays) và
 *     không bịa số ngày. Link sang trang đổi trả để khách đọc phần hàng lỗi.
 */
function chinhSachOffer(trang: TrangJsonLd): Record<string, unknown> {
  return {
    ...(trang.phiGiaoDaGom ? {
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'VND' },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'VN', addressRegion: 'VN-SG' },
      },
    } : {}),
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'VN',
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      merchantReturnLink: `${trang.goc}${trang.duongDoiTra}`,
    },
  };
}

/**
 * DỮ LIỆU CÓ CẤU TRÚC (JSON-LD Product + Offer) CỦA TRANG MUA THỊT VỀ — chỉ gói có giá đã công bố.
 * Menu của file này đã là thứ database cho hiện (mua_thit_ve_cong_khai(): công tắc bật, sản phẩm Đang bán, giá
 * đã chốt ở /noi-bo/ban-le) và nhomMuaThitVe đã bỏ gói không có giá nguyên dương, tên dính chữ cấm hay còn ngoặc vuông
 * — nên mỗi Offer ở đây là một dòng đang in ra trang, đúng giá đang in ra trang. Không có gì bịa: không ảnh, không
 * đánh giá, không hạn giá, không giá khuyến mại. Mã sản phẩm, địa chỉ từng gói, phí giao và đổi trả chỉ có khi trang
 * truyền `trang` (TrangJsonLd) — xem hàm dưới.
 *   · chỉ trạng thái 'mo' và 'het_quay' (trang liệt kê gói kèm giá); chưa mở, lỗi → null, không khai gì;
 *   · gói "Tạm hết ở quầy" khai OutOfStock (khách thấy đúng câu đó), gói còn thì InStock;
 *   · tên Offer là cỡ gói ("200 g"), tên Product là tên đang hiện trên thẻ: theo thứ tiếng của trang, và khi truyền
 *     `ngonNgu` thì qua tenHienThi (lib/ten-phan-thit.ts) — trang Việt "Đầu thăn ngoại (Ribeye)". Không truyền thì tên gốc.
 * Trả về một khối @graph để in vào MỘT thẻ script; không có sản phẩm nào thì null.
 */
export function sanPhamJsonLd(
  menu: MenuMuaThit, trangThai: TrangThaiTrang, tenThuongHieu: string, ngonNgu?: NgonNgu, trang?: TrangJsonLd,
): Record<string, unknown> | null {
  if (trangThai !== 'mo' && trangThai !== 'het_quay') return null;
  const sanPham = menu.sanPham.filter(sp => sp.goi.length > 0);
  if (sanPham.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@graph': sanPham.map(sp => ({
      '@type': 'Product',
      name: ngonNgu ? tenHienThi(sp, ngonNgu) : sp.ten,
      ...(trang ? { sku: sp.ma, url: urlGoi(trang, sp.ma) } : {}),
      ...(sp.moTa ? { description: sp.moTa } : {}),
      brand: { '@type': 'Brand', name: tenThuongHieu },
      offers: sp.goi.map(g => ({
        '@type': 'Offer',
        name: `${g.soGam} g`,
        ...(trang ? { sku: g.khoa, url: urlGoi(trang, sp.ma) } : {}),
        price: String(g.gia),
        priceCurrency: 'VND',
        availability: g.tamHet ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        ...(trang ? chinhSachOffer(trang) : {}),
      })),
    })),
  };
}

/** Có ít nhất một gói khách đặt được (không "Tạm hết ở quầy"). */
export function coGoiDatDuoc(menu: MenuMuaThit): boolean {
  return menu.sanPham.some(sp => sp.goi.some(g => !g.tamHet));
}

/**
 * `mo` là muaThitVeMo(noiDung) của dich-dat-hang.ts — công tắc HIỆU LỰC của database (0101, 0113).
 * Chưa mở → chua_mo; mở mà đọc menu lỗi → loi (trang mời tải lại, gọi quán); menu rỗng (gói vừa bị bỏ giữa hai lời
 * gọi) → chua_mo; mọi gói tạm hết ở quầy → het_quay (liệt kê gói, không form); còn lại → mo.
 */
export function trangThaiMuaThit(mo: boolean, menu: MenuMuaThit): TrangThaiTrang {
  if (!mo) return 'chua_mo';
  if (menu.tinhTrang === 'loi') return 'loi';
  if (menu.sanPham.length === 0) return 'chua_mo';
  if (!coGoiDatDuoc(menu)) return 'het_quay';
  return 'mo';
}
