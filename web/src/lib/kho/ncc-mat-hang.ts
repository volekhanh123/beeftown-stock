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
  cauLoiKho, dinhDangKg, dinhDangNgayNgan, kqHai, laDemCai, laUuid, soCaiChu, type KetQua, type NgonNguNB,
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

/** Đọc cả danh mục của chi nhánh. Lỗi (mạng, quyền) ném ra — trang tự quyết bỏ qua hay báo. */
export async function docNccMon(client: SupabaseClient, chiNhanhId: string): Promise<NccMon[]> {
  const { data, error } = await client.rpc('kho_ds_ncc_mat_hang', { p_chi_nhanh_id: chiNhanhId });
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
 * "Lần trước 12,5 kg · 25/10" (hàng cân ký) hoặc "Lần trước 2 thùng · 25/10" (món đếm theo cái). Chưa giao ở chi
 * nhánh này → null (nút hiện dòng phụ khác). Không có tiền.
 */
export function chuLanTruoc(c: NccMon | undefined, mon: MonVietSo | undefined, nn: NgonNguNB = 'vi'): string | null {
  if (!c?.lan_cuoi) return null;
  const ngay = dinhDangNgayNgan(c.lan_cuoi);
  const so = laDemCai(mon)
    ? soCaiChu(c.goi_lan_cuoi ?? 0, mon?.don_vi_goi ?? '', mon?.so_trong_thung, nn)
    : `${dinhDangKg(c.kg_lan_cuoi, nn)} kg`;
  return { vi: `Lần trước ${so} · ${ngay}`, en: `Last time ${so} · ${ngay}` }[nn];
}

/** Dòng phụ dưới nút NCC (lối chọn món trước): "NCC chính · giao 25/10" / "giao 25/10" / "thêm tay". */
export function chuNccCuaMon(c: NccMon, nn: NgonNguNB = 'vi'): string | null {
  const phan: string[] = [];
  if (c.la_chinh) phan.push({ vi: 'NCC chính', en: 'Main supplier' }[nn]);
  if (c.lan_cuoi) phan.push({ vi: `giao ${dinhDangNgayNgan(c.lan_cuoi)}`, en: `delivered ${dinhDangNgayNgan(c.lan_cuoi)}` }[nn]);
  else if (!c.da_giao) phan.push({ vi: 'thêm tay, chưa giao', en: 'added by hand, not delivered yet' }[nn]);
  return phan.length ? phan.join(' · ') : null;
}

/** Đọc ?mon= của bước 1: chỉ nhận id dạng uuid, còn lại coi như không chọn. */
export function docMonChon(gt: string | null | undefined): string {
  const x = String(gt ?? '').trim();
  return laUuid(x) ? x : '';
}

const CAU_LUU: Record<ViecNccMon, (mon: string, ncc: string) => { vi: string; en: string }> = {
  them: (mon, ncc) => ({ vi: `Đã thêm "${mon}" vào món của ${ncc}.`, en: `Added "${mon}" to ${ncc}'s items.` }),
  bo: (mon, ncc) => ({
    vi: `Đã bỏ "${mon}" khỏi món của ${ncc} — phiếu sau có giao món này cũng không tự hiện lại.`,
    en: `Removed "${mon}" from ${ncc}'s items — it will not come back on its own even if a later delivery has it.`,
  }),
  chinh: (mon, ncc) => ({ vi: `${ncc} là nhà cung cấp chính của "${mon}".`, en: `${ncc} is now the main supplier of "${mon}".` }),
  bo_chinh: (mon, ncc) => ({ vi: `${ncc} thôi là nhà cung cấp chính của "${mon}".`, en: `${ncc} is no longer the main supplier of "${mon}".` }),
};

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
  if (!laUuid(nccId) || !laUuid(monId)) {
    return kqHai(false, { vi: 'Chưa chọn món.', en: 'No item selected.' });
  }
  try {
    const { error } = await client.rpc('kho_luu_ncc_mat_hang', {
      p_nha_cung_cap_id: nccId, p_mat_hang_id: monId, p_viec: viec,
    });
    if (error) return { ok: false, cau: cauLoiKho(error) };
  } catch (e) {
    return { ok: false, cau: cauLoiKho(e) };
  }
  return kqHai(true, CAU_LUU[viec as ViecNccMon](ten.mon, ten.ncc));
}
