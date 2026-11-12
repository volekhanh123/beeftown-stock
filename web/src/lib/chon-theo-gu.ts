/**
 * CHỌN THEO GU — khối ở tab "Bò tại quầy" của trang Thực đơn (đợt 2 của đề xuất giao diện, Khánh duyệt 12/11/2026)
 * ===============================================================================================================
 *
 * Lời hứa "Không cần rành bò. Chọn theo gu, thấy giá trước." cần một chỗ nói phần cắt nào hợp gu nào. Phần cắt ở
 * quầy là đúng danh sách menu bán lẻ (Khánh xác nhận 12/11/2026); chủ, quản lý gắn gu cho từng phần thịt ở
 * /noi-bo/ban-le/<id> (ban_le_luu_gu, migration 0116). Trang đọc qua đúng một cửa: bo_tai_quay_theo_gu(p_ngon_ngu)
 * — chỉ phần thịt đã gắn gu, tên còn chữ tạm thì không, tên / mô tả theo luật bản dịch còn hiệu lực của Mua thịt về.
 *
 *  · Không giá, không gói: giá ở quán chỉ có trên nhãn khay — thẻ nói đúng điều đó.
 *  · Lớp chặn thứ hai (locPhanCat): dòng hỏng bị bỏ; tên dính chữ cấm hay còn ngoặc vuông → bỏ cả phần cắt; mô tả
 *    dính → không hiện; gu lạ → bỏ gu đó; không còn gu nào → bỏ phần cắt.
 *  · Không ném lỗi: chưa nối database → []; lỗi, ném, hết giờ, trả thứ không phải danh sách → [] và ĐÚNG MỘT dòng log
 *    "[chon-theo-gu]". Danh sách rỗng thì trang không có khối — trang Thực đơn đúng và đủ khi chưa có database.
 *
 * File chỉ chạy ở máy chủ (nạp supabase-js qua noi-dung.ts). Kiểm thử: crm/test/test-ban-le-gu.mjs.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BaThuTieng } from './chu.ts';
import { timChuoiCam } from './chuoi-cam.js';
import { taoClient, type NgonNgu } from './noi-dung.ts';

/** Bốn gu, theo thứ tự hiện — đúng mảng v_thu_tu của ban_le_luu_gu và ràng buộc ban_le_san_pham_gu_hop_le (0116). */
export const GU = ['mem_beo', 'dam_vi', 'nac_thanh', 'lat_mong'] as const;
export type Gu = (typeof GU)[number];

/** Tên gu ba thứ tiếng — trang công khai đọc cả ba, /noi-bo đọc vi / en. Ngắn để vừa một nút trên điện thoại (Codex rà
 * câu chữ 12/11/2026: tiếng Hàn thêm 맛 cho nhãn trọn nghĩa; "lát mỏng" bỏ vế "nướng nhanh"). */
export const TEN_GU: Readonly<Record<Gu, BaThuTieng>> = {
  mem_beo:   { vi: 'Mềm, béo', en: 'Tender and rich', ko: '부드럽고 고소한 맛' },
  dam_vi:    { vi: 'Đậm vị, dai giòn', en: 'Bold and chewy', ko: '진하고 쫄깃한 맛' },
  nac_thanh: { vi: 'Nạc, thanh', en: 'Lean and light', ko: '담백한 살코기' },
  lat_mong:  { vi: 'Lát mỏng', en: 'Thin slices', ko: '얇게 썬 고기' },
};

export interface PhanCatGu {
  ma: string;
  /** Tên theo thứ tiếng của trang. */
  ten: string;
  /** Tên tiếng Việt — trang en / ko in thêm để khách nói với nhân viên quầy. */
  tenVi: string;
  moTa: string | null;
  gu: Gu[];
}

export const HET_GIO_MS = 4000;
const MA_SAN_PHAM = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NGOAC_VUONG = /[[\]]/;

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

/** Các dòng của bo_tai_quay_theo_gu → phần cắt, giữ thứ tự database. Lớp chặn thứ hai — xem đầu file. */
export function locPhanCat(dong: unknown): PhanCatGu[] {
  if (!Array.isArray(dong)) return [];
  const ra: PhanCatGu[] = [];
  for (const d of dong as Record<string, unknown>[]) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) continue;
    const ma = typeof d.san_pham_ma === 'string' && d.san_pham_ma.length <= 40 && MA_SAN_PHAM.test(d.san_pham_ma) ? d.san_pham_ma : null;
    const ten = motDong(d.ten);
    const tenVi = motDong(d.ten_vi);
    if (!ma || !ten || !tenVi || ra.some(p => p.ma === ma)) continue;
    if (NGOAC_VUONG.test(ten) || NGOAC_VUONG.test(tenVi) || timChuoiCam(ten).length > 0 || timChuoiCam(tenVi).length > 0) continue;
    const gu = Array.isArray(d.gu) ? GU.filter(g => (d.gu as unknown[]).includes(g)) : [];
    if (gu.length === 0) continue;
    ra.push({ ma, ten, tenVi, moTa: chuSach(d.mo_ta), gu });
  }
  return ra;
}

/** Các gu có ít nhất một phần cắt — chỉ những gu này thành nút lọc. */
export function guCoMat(phanCat: readonly PhanCatGu[]): Gu[] {
  return GU.filter(g => phanCat.some(p => p.gu.includes(g)));
}

/** Đọc gu cho trang công khai. Không ném lỗi — xem đầu file. `hetGioMs` chỉ để kiểm thử đổi. */
export async function docBoTheoGu(
  ngonNgu: NgonNgu = 'vi',
  client: Pick<SupabaseClient, 'rpc'> | null = taoClient(),
  hetGioMs = HET_GIO_MS,
): Promise<PhanCatGu[]> {
  if (!client) return [];
  const huy = new AbortController();
  let hen: ReturnType<typeof setTimeout> | undefined;
  try {
    const truyVan = client.rpc('bo_tai_quay_theo_gu', { p_ngon_ngu: ngonNgu });
    const coHuy = truyVan as unknown as { abortSignal?: (s: AbortSignal) => unknown };
    if (typeof coHuy.abortSignal === 'function') coHuy.abortSignal(huy.signal);
    const hetGio = new Promise<'het_gio'>(xong => { hen = setTimeout(() => xong('het_gio'), hetGioMs); });
    const kq = await Promise.race([truyVan, hetGio]);
    if (kq === 'het_gio') {
      huy.abort();
      console.error(`[chon-theo-gu] hết giờ sau ${hetGioMs} ms`);
      return [];
    }
    const { data, error } = kq;
    if (error) {
      console.error('[chon-theo-gu] không đọc được gu:', error.code ?? '', error.message);
      return [];
    }
    if (!Array.isArray(data)) {
      console.error('[chon-theo-gu] gu không phải danh sách:', data === null ? 'null' : typeof data);
      return [];
    }
    return locPhanCat(data);
  } catch (e) {
    console.error('[chon-theo-gu] không gọi được database:', e instanceof Error ? e.message : String(e));
    return [];
  } finally {
    clearTimeout(hen);
  }
}
