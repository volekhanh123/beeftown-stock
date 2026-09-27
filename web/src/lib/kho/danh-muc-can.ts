/**
 * KHO — DANH MỤC ĐƯA XUỐNG CÂN (truy vết tảng GĐ3)
 *
 * Nguồn chung cho màn Đồng bộ cân (cai-dat/can.astro) và chương trình Beeftown
 * Cân (can-app): danh sách hàng {mã cân, tên, giá bán/kg} để lapKeHoach so với
 * file của cân.
 *
 *   · Món thường: một dòng theo mã cân của món, như trước.
 *   · Phần cắt có ô mã (0049): thêm MỖI Ô một dòng, cùng giá với món. Ô đang
 *     giao cho một tảng còn hàng thì tên kèm số tảng — "Thăn ngoại cắt lát
 *     #0142" — để tem in ra có số tảng; ô trống thì tên món. Ô trống vẫn nằm
 *     trên cân, nên số PLU của ô không đổi qua các lần lóc.
 *
 *   · Mã giảm giá (0054): mỗi mức giảm đang bật của món một dòng — "Steak
 *     Ribeye Angus -30%", giá đã giảm (ma-giam.ts). Mã giảm tắt / món ngừng
 *     dùng → dòng không dùng (bỏ khỏi cân).
 *
 * Tên + số tảng giữ trong 24 ký tự (dài hơn dễ bị cắt khi in): cắt bớt tên món,
 * không bao giờ cắt số tảng.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { HangKho } from './can-tma.ts';
import type { MatHang } from './danh-muc.ts';
import { docGiaoOMa, docOMa, type DongOMa, type GiaoOMa } from './o-ma.ts';
import { docMaGiam, giaGiam, tenGiam, type DongMaGiam } from './ma-giam.ts';
import { soTangChu } from './tang.ts';

export const TEN_CAN_TOI_DA = 24;

/** "Thăn ngoại cắt lát" + 142 → "Thăn ngoại cắt lát #0142", cắt tên cho vừa 24 ký tự. */
export function tenTheoTang(ten: string, soTang: number | null | undefined): string {
  const duoi = soTangChu(soTang);
  if (!duoi) return ten;
  const chu = [...ten.trim()];
  const toiDa = Math.max(TEN_CAN_TOI_DA - duoi.length - 1, 1);
  const goc = chu.length > toiDa ? chu.slice(0, toiDa).join('').trimEnd() : chu.join('');
  return `${goc} ${duoi}`;
}

/**
 * Ghép danh sách hàng cho cân (hàm thuần — test bằng node).
 * giao: ô đang giao ở CHI NHÁNH của cân (kho_v_o_ma_giao).
 */
export function ghepHangChoCan(matHang: MatHang[], oMa: Map<string, DongOMa[]>, giao: GiaoOMa[],
                               maGiam: DongMaGiam[] = []): HangKho[] {
  const tangCuaO = new Map(giao.filter(g => g.con_giu).map(g => [g.o_ma_id, g.so_tang]));
  const ra: HangKho[] = matHang.map(m => ({
    ma: m.ma, ma_can: m.ma_can, ten: m.ten, gia_ban_kg: m.gia_ban_kg, dang_dung: m.dang_dung,
  }));
  for (const m of matHang) {
    for (const o of oMa.get(m.id) ?? []) {
      ra.push({
        ma: `${m.ma}#${o.so_o}`,
        ma_can: o.ma_can,
        ten: tenTheoTang(m.ten, tangCuaO.get(o.id)),
        gia_ban_kg: m.gia_ban_kg,
        dang_dung: m.dang_dung,
      });
    }
  }
  const theoId = new Map(matHang.map(m => [m.id, m]));
  for (const g of maGiam) {
    const m = theoId.get(g.mat_hang_id);
    if (!m) continue;
    ra.push({
      ma: `${m.ma}~G${g.phan_tram}`,
      ma_can: g.ma_can,
      ten: tenGiam(m.ten, g.phan_tram, TEN_CAN_TOI_DA),
      gia_ban_kg: m.gia_ban_kg === null || m.gia_ban_kg === undefined ? m.gia_ban_kg : giaGiam(m.gia_ban_kg, g.phan_tram),
      dang_dung: m.dang_dung && g.dang_dung,
    });
  }
  return ra;
}

/** Đọc từ kho rồi ghép — dùng ở màn Đồng bộ cân và Beeftown Cân. */
export async function hangChoCan(client: SupabaseClient, chiNhanhId: string, matHang: MatHang[]): Promise<HangKho[]> {
  const [oMa, giao, maGiam] = await Promise.all([docOMa(client), docGiaoOMa(client, chiNhanhId), docMaGiam(client)]);
  return ghepHangChoCan(matHang, oMa, giao, maGiam);
}
