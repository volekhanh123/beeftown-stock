/**
 * KHO — DANH MỤC HÀNG CỦA TỪNG NHÀ CUNG CẤP (0110, đợt 1)
 *
 * "NCC nào bán món nào": máy tự học từ phiếu mua đã gửi / đã duyệt, quản lý sửa tay (thêm cặp chưa từng giao,
 * bỏ cặp sai, NCC chính của món). Database gộp hai phần trong kho_ds_ncc_mat_hang — ở đây chỉ đọc, xếp và
 * viết chữ; không tính lại cặp nào.
 *
 * Hai lối chọn ở Nhận hàng:
 *   · NCC trước (lối chính): bước 2 hiện nút các món của NCC đó (monCuaNcc), dòng phụ "Lần trước 12,5 kg · 25/10";
 *   · món trước (không biết ai giao): bước 1 ?mon=<món> hiện nút các NCC bán món đó (nccCuaMon), NCC chính đầu.
 *
 * Không có tiền: thủ kho đọc được (vai nhap). Ghi (luuNccMon) chỉ vai ncc — quản lý, chủ, kế toán.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  cauLoiKho, dinhDangKg, dinhDangNgayNgan, kqHai, laDemCai, laUuid, soCaiChu, type HaiThuTieng, type KetQua, type NgonNguNB,
} from './chung.ts';

/** Một dòng của kho_ds_ncc_mat_hang. Số lần, lần cuối, kg / gói: ở chi nhánh đang xem. */
export interface NccMon {
  nha_cung_cap_id: string;
  mat_hang_id: string;
  la_chinh: boolean;
  /** Đã bỏ tay khỏi danh sách: không hiện thành nút. */
  da_bo: boolean;
  /** Người sửa tay đã thêm (hoặc thêm lại). */
  them_tay: boolean;
  /** Có trên phiếu mua đã gửi / đã duyệt, ở bất kỳ chi nhánh nào. */
  da_giao: boolean;
  so_lan: number;
  lan_cuoi: string | null;
  kg_lan_cuoi: number | null;
  goi_lan_cuoi: number | null;
}

export const VIEC_NCC_MON = ['them', 'bo', 'chinh', 'bo_chinh'] as const;
export type ViecNccMon = typeof VIEC_NCC_MON[number];

/**
 * Đọc danh mục của chi nhánh — chỉ các cặp của một NCC hoặc một món nếu truyền (database lọc từ đầu, không cộng cả
 * lịch sử phiếu). Lỗi (mạng, quyền) ném ra — trang tự quyết bỏ qua hay báo.
 */
export async function docNccMon(
  client: SupabaseClient, chiNhanhId: string, loc: { ncc?: string | null; mon?: string | null } = {},
): Promise<NccMon[]> {
  const { data, error } = await client.rpc('kho_ds_ncc_mat_hang', {
    p_chi_nhanh_id: chiNhanhId,
    p_nha_cung_cap_id: loc.ncc || null,
    p_mat_hang_id: loc.mon || null,
  });
  if (error) throw error;
  return ((data ?? []) as NccMon[]).map(r => ({
    ...r,
    so_lan: Number(r.so_lan) || 0,
    kg_lan_cuoi: r.kg_lan_cuoi === null || r.kg_lan_cuoi === undefined ? null : Number(r.kg_lan_cuoi),
    goi_lan_cuoi: r.goi_lan_cuoi === null || r.goi_lan_cuoi === undefined ? null : Number(r.goi_lan_cuoi),
  }));
}

/** Xếp: NCC chính trước, rồi giao gần nhất ở chi nhánh này, rồi giao nhiều lần hơn. Thứ tự đầu vào giữ khi bằng nhau. */
function xep(a: NccMon, b: NccMon): number {
  if (a.la_chinh !== b.la_chinh) return a.la_chinh ? -1 : 1;
  const la = a.lan_cuoi ?? '';
  const lb = b.lan_cuoi ?? '';
  if (la !== lb) return la < lb ? 1 : -1;
  return b.so_lan - a.so_lan;
}

/** Các món của một NCC (bỏ cặp đã bỏ tay), xếp như `xep`. */
export function monCuaNcc(ds: NccMon[], nccId: string | null | undefined): NccMon[] {
  if (!nccId) return [];
  return ds.filter(c => c.nha_cung_cap_id === nccId && !c.da_bo).sort(xep);
}

/** Các NCC bán một món (bỏ cặp đã bỏ tay), NCC chính đầu tiên. */
export function nccCuaMon(ds: NccMon[], monId: string | null | undefined): NccMon[] {
  if (!monId) return [];
  return ds.filter(c => c.mat_hang_id === monId && !c.da_bo).sort(xep);
}

/** Món của mặt hàng đủ để viết số lần trước: kg hay số cái. */
interface MonVietSo { dem_theo_cai?: boolean | null; loai?: string | null; don_vi_goi?: string | null; so_trong_thung?: number | null }

/**
 * "Lần trước 12,5 kg · 25/10" (hàng cân ký) hoặc "Lần trước 2 thùng (48 lon) · 25/10" (món đếm theo cái — số cái là
 * so_goi, phiếu cũ không có thì so_kg, 0105 giữ hai số bằng nhau). Chưa giao ở chi nhánh này, hoặc không có số → null
 * (nút hiện dòng phụ khác) — không bao giờ "Lần trước 0 lon". Không có tiền.
 */
export function chuLanTruoc(c: NccMon | undefined, mon: MonVietSo | undefined, nn: NgonNguNB = 'vi'): string | null {
  if (!c?.lan_cuoi) return null;
  const ngay = dinhDangNgayNgan(c.lan_cuoi);
  let so: string;
  if (laDemCai(mon)) {
    const cai = c.goi_lan_cuoi || Math.round(c.kg_lan_cuoi ?? 0);
    if (!cai) return null;
    so = soCaiChu(cai, mon?.don_vi_goi ?? '', mon?.so_trong_thung, nn);
  } else {
    if (!c.kg_lan_cuoi) return null;
    so = `${dinhDangKg(c.kg_lan_cuoi, nn)} kg`;
  }
  return { vi: `Lần trước ${so} · ${ngay}`, en: `Last time ${so} · ${ngay}` }[nn];
}

/**
 * Nhóm "Gợi ý" của ô chọn món trên phiếu nhập soạn tay (29/10/2026): món của NCC đang chọn, xếp như `monCuaNcc`, chữ
 * phụ "Lần trước 12,5 kg · 25/10" — chưa giao ở chi nhánh này thì "NCC chính" hoặc không chữ. Không có tiền.
 */
export function goiYMonNcc(
  ds: NccMon[], nccId: string | null | undefined, mon: ReadonlyMap<string, MonVietSo>, nn: NgonNguNB = 'vi',
): { id: string; chu: string | null }[] {
  return monCuaNcc(ds, nccId).map(c => ({
    id: c.mat_hang_id,
    chu: chuLanTruoc(c, mon.get(c.mat_hang_id), nn) ?? (c.la_chinh ? { vi: 'NCC chính', en: 'Main supplier' }[nn] : null),
  }));
}

/** Cặp chưa giao ở chi nhánh đang xem: đã giao ở chi nhánh khác, hay chỉ mới thêm tay. Trang cài đặt dùng chung. */
export function chuChuaGiao(c: NccMon, nn: NgonNguNB = 'vi'): string {
  return (c.da_giao
    ? { vi: 'chưa giao ở chi nhánh này', en: 'not delivered at this branch yet' }
    : { vi: 'thêm tay, chưa giao', en: 'added by hand, not delivered yet' })[nn];
}

/** Nhãn "NCC chính" — chung cho dòng phụ ở nhận hàng và ở trang mặt hàng. */
const CHU_NCC_CHINH: HaiThuTieng = { vi: 'NCC chính', en: 'Main supplier' };

/** Dòng phụ dưới nút NCC (lối chọn món trước): "NCC chính · giao 25/10" / "giao 25/10" / "chưa giao ở chi nhánh này". */
export function chuNccCuaMon(c: NccMon, nn: NgonNguNB = 'vi'): string {
  const phan: string[] = [];
  if (c.la_chinh) phan.push(CHU_NCC_CHINH[nn]);
  phan.push(c.lan_cuoi
    ? { vi: `giao ${dinhDangNgayNgan(c.lan_cuoi)}`, en: `delivered ${dinhDangNgayNgan(c.lan_cuoi)}` }[nn]
    : chuChuaGiao(c, nn));
  return phan.join(' · ');
}

/**
 * Dòng phụ của một NCC ở mục "Ai bán món này" (trang mặt hàng, 30/10/2026): "NCC chính · Lần trước 12,5 kg · 25/10 ·
 * giao 3 lần". Đã giao mà phiếu gần nhất không có số → "giao 25/10"; chưa giao ở chi nhánh này → "chưa giao ở chi nhánh
 * này" / "thêm tay, chưa giao". Không có tiền.
 */
export function chuAiBan(c: NccMon, mon: MonVietSo | undefined, nn: NgonNguNB = 'vi'): string {
  const lanTruoc = chuLanTruoc(c, mon, nn);
  // Không có số lần trước thì dùng nguyên dòng phụ của nhận hàng ("NCC chính · giao 25/10" / "chưa giao …").
  const dau = lanTruoc ? [...(c.la_chinh ? [CHU_NCC_CHINH[nn]] : []), lanTruoc].join(' · ') : chuNccCuaMon(c, nn);
  return c.so_lan > 1 ? `${dau} · ${{ vi: `giao ${c.so_lan} lần`, en: `${c.so_lan} deliveries` }[nn]}` : dau;
}

/**
 * Các NCC đã bị bỏ tay khỏi danh sách của một món, xếp theo tên (mục "Ai bán món này" ghi riêng để biết vì sao không
 * có — bỏ rồi thì không tự hiện lại).
 */
export function nccDaBoCuaMon(ds: NccMon[], monId: string | null | undefined, ten: ReadonlyMap<string, string> = new Map()): NccMon[] {
  if (!monId) return [];
  return ds.filter(c => c.mat_hang_id === monId && c.da_bo)
    .sort((a, b) => (ten.get(a.nha_cung_cap_id) ?? '').localeCompare(ten.get(b.nha_cung_cap_id) ?? '', 'vi'));
}

/** Tên NCC theo id — chỉ hai cột (không ngân hàng, mã số thuế…). Vai xem_gia đọc được bảng này. Lỗi ném ra. */
export async function docTenNcc(client: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await client.from('kho_nha_cung_cap').select('id, ten');
  if (error) throw error;
  return new Map(((data ?? []) as { id: string; ten: string }[]).map(n => [n.id, n.ten]));
}

/**
 * Mục "Ai bán món này" của trang mặt hàng: danh mục NCC – món của một món ở chi nhánh (database lọc theo món) và tên
 * NCC, đọc song song. Lượt nào lỗi (mạng, quyền, 500) → null: trang chỉ mất mục này, có câu báo — không ném.
 */
export async function docAiBanMon(
  client: SupabaseClient, chiNhanhId: string, monId: string,
): Promise<{ ds: NccMon[]; ten: Map<string, string> } | null> {
  try {
    const [ds, ten] = await Promise.all([docNccMon(client, chiNhanhId, { mon: monId }), docTenNcc(client)]);
    return { ds, ten };
  } catch {
    return null;
  }
}

/** Đọc ?mon= của bước 1: chỉ nhận id dạng uuid, còn lại coi như không chọn. */
export function docMonChon(gt: string | null | undefined): string {
  const x = String(gt ?? '').trim();
  return laUuid(x) ? x : '';
}

/** mon, ncc: tên đã đặt sẵn trong ngoặc kép; tên không đọc được thì "món" / "nhà cung cấp này" (tenCau). */
const CAU_LUU: Record<ViecNccMon, (mon: HaiThuTieng, ncc: HaiThuTieng) => HaiThuTieng> = {
  them: (mon, ncc) => ({ vi: `Đã thêm ${mon.vi} vào món của ${ncc.vi}.`, en: `Added ${mon.en} to the items of ${ncc.en}.` }),
  bo: (mon, ncc) => ({
    vi: `Đã bỏ ${mon.vi} khỏi món của ${ncc.vi} — phiếu sau có giao món này cũng không tự hiện lại.`,
    en: `Removed ${mon.en} from the items of ${ncc.en} — it will not come back on its own even if a later delivery has it.`,
  }),
  chinh: (mon, ncc) => ({ vi: `Đã đặt ${ncc.vi} là nhà cung cấp chính của ${mon.vi}.`, en: `${ncc.en} is now the main supplier of ${mon.en}.` }),
  bo_chinh: (mon, ncc) => ({ vi: `Đã bỏ ${ncc.vi} khỏi vai nhà cung cấp chính của ${mon.vi}.`, en: `${ncc.en} is no longer the main supplier of ${mon.en}.` }),
};
const tenCau = (ten: string, macDinh: HaiThuTieng): HaiThuTieng => (ten ? { vi: `"${ten}"`, en: `"${ten}"` } : macDinh);

/**
 * Sửa tay một cặp. Câu "đã …" chỉ khi database nhận (cùng một await): mất mạng, hết giờ, lỗi quyền đều thành câu
 * lỗi. Bấm hai lần ra cùng trạng thái nên không cần mã gửi.
 */
export async function luuNccMon(
  client: SupabaseClient, nccId: string, monId: string, viec: string, ten: { ncc: string; mon: string },
): Promise<KetQua> {
  if (!(VIEC_NCC_MON as readonly string[]).includes(viec)) {
    return kqHai(false, { vi: 'Việc không hợp lệ.', en: 'Invalid action.' });
  }
  if (!laUuid(nccId)) return kqHai(false, { vi: 'Chưa chọn nhà cung cấp.', en: 'No supplier selected.' });
  if (!laUuid(monId)) return kqHai(false, { vi: 'Chưa chọn món.', en: 'No item selected.' });
  try {
    const { error } = await client.rpc('kho_luu_ncc_mat_hang', {
      p_nha_cung_cap_id: nccId, p_mat_hang_id: monId, p_viec: viec,
    });
    if (error) return { ok: false, cau: cauLoiKho(error) };
  } catch (e) {
    return { ok: false, cau: cauLoiKho(e) };
  }
  return kqHai(true, CAU_LUU[viec as ViecNccMon](
    tenCau(ten.mon, { vi: 'món', en: 'the item' }), tenCau(ten.ncc, { vi: 'nhà cung cấp này', en: 'this supplier' })));
}
