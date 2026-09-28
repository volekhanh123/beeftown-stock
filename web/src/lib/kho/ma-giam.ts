/**
 * KHO — MÃ GIẢM GIÁ HÀNG CẬN DATE (0054)
 *
 * FABi không đọc giá trên tem (mã vạch chỉ có mã hàng + trọng lượng), nên mỗi
 * mức giảm của một món là MỘT MÃ CÂN RIÊNG: trên cân là hàng "Steak Ribeye
 * Angus -30%" giá đã giảm, trên FABi là món cùng mã, cùng giá. NV quầy cân lại
 * gói cận date bằng mã giảm và dán tem mới. Kho nhận mã giảm khi bán như ô mã.
 *
 * Hàm thuần — test bằng node. Công thức giá giống hệt SQL kho_gia_giam.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface DongMaGiam { id: string; mat_hang_id: string; phan_tram: number; ma_can: string; dang_dung: boolean }

/** Mức giảm hay dùng — gợi ý ở màn tạo mã. */
export const MUC_GIAM_GOI_Y = [20, 30, 50] as const;

/** Giá bán/kg sau khi giảm, làm tròn tới 1.000 đ. Giống SQL kho_gia_giam. */
export function giaGiam(gia: number, phanTram: number): number {
  return Math.round(gia * (100 - phanTram) / 100000) * 1000;
}

/** Tên trên cân: "<tên món> -30%", cắt tên món cho vừa `toiDa` ký tự, không cắt phần giảm. */
export function tenGiam(ten: string, phanTram: number, toiDa = 24): string {
  const duoi = `-${phanTram}%`;
  const chu = [...ten.trim()];
  const conLai = Math.max(toiDa - duoi.length - 1, 1);
  const goc = chu.length > conLai ? chu.slice(0, conLai).join('').trimEnd() : chu.join('');
  return `${goc} ${duoi}`;
}

/**
 * Mọi mã giảm (kể cả đã tắt) — RLS: vai xem. Database chưa chạy 0054 (chưa có
 * bảng) → [] để màn Đồng bộ cân và Beeftown Cân vẫn gửi được danh mục cũ.
 */
export async function docMaGiam(client: SupabaseClient): Promise<DongMaGiam[]> {
  const { data, error } = await client.from('kho_ma_giam')
    .select('id, mat_hang_id, phan_tram, ma_can, dang_dung').order('phan_tram');
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return [];
    throw error;
  }
  return (data ?? []) as DongMaGiam[];
}
