/**
 * MUA THỊT VỀ — ĐỌC MENU CHO TRANG CÔNG KHAI, qua đúng một cửa: mua_thit_ve_cong_khai() (migration 0101)
 * =====================================================================================================
 *
 * Database quyết định gói nào được hiện và giá bao nhiêu: chỉ khi kênh mở (công tắc hien_mua_thit_ve bật, có link
 * Zalo OA hợp lệ), chỉ sản phẩm Đang bán, kênh website, đã được chủ chốt giá ở /noi-bo/ban-le; giá là giá gói
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
 * don-mua-thit.ts; đích đặt hàng (link Zalo OA, cách chuyển giỏ) ở dich-dat-hang.ts — file này không nạp nó, nên
 * trangThaiMuaThit nhận `mo` (muaThitVeMo của dich-dat-hang.ts) làm tham số. Kiểm thử: crm/test/test-mua-thit-ve-web.mjs.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { taoClient, maChiNhanh, type NgonNgu, type NoiDung } from './noi-dung.ts';
import { timChuoiCam } from './chuoi-cam.js';
import { khoaGoi, type BaoQuan, type DonVi, type GoiMua, type SanPhamMua } from './don-mua-thit.ts';

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

/** Trạng thái của trang — một bảng chân trị cho điều hướng, trang và form (bản thiết kế PR 2, mục 2.5). */
export type TrangThaiTrang = 'chua_mo' | 'loi' | 'mo' | 'het_quay';

/** Có ít nhất một gói khách đặt được (không "Tạm hết ở quầy"). */
export function coGoiDatDuoc(menu: MenuMuaThit): boolean {
  return menu.sanPham.some(sp => sp.goi.some(g => !g.tamHet));
}

/**
 * `mo` là muaThitVeMo(noiDung) của dich-dat-hang.ts — công tắc HIỆU LỰC của database (0101) và có đích đặt hàng.
 * Chưa mở → chua_mo; mở mà đọc menu lỗi → loi (trang mời nhắn Zalo OA); menu rỗng (gói vừa bị bỏ giữa hai lời gọi)
 * → chua_mo; mọi gói tạm hết ở quầy → het_quay (liệt kê gói, không form); còn lại → mo.
 */
export function trangThaiMuaThit(mo: boolean, menu: MenuMuaThit): TrangThaiTrang {
  if (!mo) return 'chua_mo';
  if (menu.tinhTrang === 'loi') return 'loi';
  if (menu.sanPham.length === 0) return 'chua_mo';
  if (!coGoiDatDuoc(menu)) return 'het_quay';
  return 'mo';
}

/** Trang nhận giao tận nơi: khóa mua_thit_giao_hang (chỉ chủ) đã công bố và có chữ. Chưa thì chỉ nhận tại quầy. */
export function coGiaoHang(nd: Pick<NoiDung, 'mua_thit_giao_hang'> | null | undefined): boolean {
  const v = nd?.mua_thit_giao_hang;
  return typeof v === 'string' && v.trim() !== '';
}
