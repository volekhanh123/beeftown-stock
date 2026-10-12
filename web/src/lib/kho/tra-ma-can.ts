/**
 * KHO — TRA MÃ CÂN TRÊN NHÃN → MÓN (mã của món · ô mã · mã giảm giá)
 *
 * Nhãn cân mang một mã hàng 5 số. Mã đó là một trong ba thứ:
 *   · mã cân của chính món (kho_mat_hang.ma_can);
 *   · một Ô MÃ xoay vòng (kho_o_ma, 0049) — phần cắt của món theo tảng; mỗi ô gắn với một
 *     tảng trong lúc tảng đó còn bán, nên tem của mọi khay thịt ủ in bằng mã ô;
 *   · một MÃ GIẢM GIÁ hàng cận date (kho_ma_giam, 0054).
 * Database tra cả ba bằng kho_mat_hang_theo_ma_can (bản mới nhất ở 0054). File này là BẢN SOI
 * GƯƠNG của hàm đó cho những chỗ web tự tra — màn Quét nhãn, quét nhãn vào phiếu chuyển /
 * xuất bếp / báo hủy, kiểm kê dán nhãn, "Thử một nhãn":
 *   1. món ĐANG DÙNG có ma_can = mã → món đó;
 *   2. không thì ô mã mang mã đó, món của ô đang dùng → món đó;
 *   3. không thì mã giảm mang mã đó, món đang dùng, và KHÔNG ô mã nào (kể cả ô của món đã
 *      ngừng dùng) mang mã đó → món đó.
 * crm/test/test-kho-tra-ma-can.mjs so từng mã với hàm SQL trên cùng dữ liệu và giữ một bản
 * chép thân hàm: SQL đổi luật thì bài đó đỏ cho tới khi file này đổi theo.
 *
 * File thuần: không import gì lúc chạy, không gọi database. Ô mã và mã giảm do trang đọc
 * MỘT lần mỗi yêu cầu (o-ma.ts docMaTrenNhan), không mỗi nhãn một lượt.
 */

/** Vì sao mã khớp món: mã của chính món · một ô mã · một mã giảm giá. */
export type NguonMaCan = 'ma_mon' | 'o_ma' | 'ma_giam';

export interface MonCoMaCan { id: string; ma_can: string | null; dang_dung: boolean }
/** Một dòng kho_o_ma — chỉ phần cần để tra. */
export interface OMaDeTra { mat_hang_id: string; so_o: number; ma_can: string }
/** Một dòng kho_ma_giam — chỉ phần cần để tra (mã đã tắt vẫn tra: tem in trước đó còn bán). */
export interface MaGiamDeTra { mat_hang_id: string; phan_tram: number; ma_can: string }

export interface KhopMaCan<M> {
  matHang: M;
  nguon: NguonMaCan;
  /** Mã đã bỏ số 0 đầu. */
  maCan: string;
  /** Số ô — chỉ khi nguon = 'o_ma'. */
  soO: number | null;
  /** Phần trăm giảm — chỉ khi nguon = 'ma_giam'. */
  phanTram: number | null;
}

export interface BangTraMaCan<M> {
  theoMaMon: Map<string, M>;
  /** matHang null = ô của một món không còn trong danh mục. */
  theoOMa: Map<string, { matHang: M | null; soO: number }>;
  theoMaGiam: Map<string, { matHang: M | null; phanTram: number }>;
}

/** "00012" → "12" — như docMaVach đọc mã hàng trên nhãn và như database lưu ma_can. */
export function chuanMaCan(ma: unknown): string {
  return String(ma ?? '').trim().replace(/^0+/, '');
}

/** Dựng bảng tra một lần cho cả lượt quét. Không truyền ô mã / mã giảm → chỉ tra mã của chính món. */
export function taoBangTraMaCan<M extends MonCoMaCan>(
  matHang: readonly M[], oMa: readonly OMaDeTra[] = [], maGiam: readonly MaGiamDeTra[] = [],
): BangTraMaCan<M> {
  const theoId = new Map(matHang.map(m => [m.id, m]));
  const theoMaMon = new Map<string, M>();
  for (const m of matHang) {
    const ma = chuanMaCan(m.ma_can);
    if (ma && m.dang_dung && !theoMaMon.has(ma)) theoMaMon.set(ma, m);
  }
  const theoOMa = new Map<string, { matHang: M | null; soO: number }>();
  for (const o of oMa) {
    const ma = chuanMaCan(o.ma_can);
    if (ma && !theoOMa.has(ma)) theoOMa.set(ma, { matHang: theoId.get(o.mat_hang_id) ?? null, soO: Number(o.so_o) });
  }
  const theoMaGiam = new Map<string, { matHang: M | null; phanTram: number }>();
  for (const g of maGiam) {
    const ma = chuanMaCan(g.ma_can);
    if (ma && !theoMaGiam.has(ma)) theoMaGiam.set(ma, { matHang: theoId.get(g.mat_hang_id) ?? null, phanTram: Number(g.phan_tram) });
  }
  return { theoMaMon, theoOMa, theoMaGiam };
}

/** Món của một mã cân đọc từ nhãn, kèm lý do khớp. Không món nào → null. */
export function traMaCan<M extends MonCoMaCan>(bang: BangTraMaCan<M>, maCan: unknown): KhopMaCan<M> | null {
  const ma = chuanMaCan(maCan);
  if (!ma) return null;
  const mon = bang.theoMaMon.get(ma);
  if (mon) return { matHang: mon, nguon: 'ma_mon', maCan: ma, soO: null, phanTram: null };
  const o = bang.theoOMa.get(ma);
  // Có ô mang mã này: hoặc ra món của ô, hoặc không ra gì — SQL không xét tiếp mã giảm.
  if (o) return o.matHang?.dang_dung ? { matHang: o.matHang, nguon: 'o_ma', maCan: ma, soO: o.soO, phanTram: null } : null;
  const g = bang.theoMaGiam.get(ma);
  return g?.matHang?.dang_dung ? { matHang: g.matHang, nguon: 'ma_giam', maCan: ma, soO: null, phanTram: g.phanTram } : null;
}

/**
 * Ô của nhãn đang giao cho tảng nào ở chi nhánh: `giao` là các dòng kho_can_giao_o_ma (ô chưa
 * trả, kể cả khi lô của tảng đã hết trên sổ — bán qua iPOS cũng coi ô đó còn thuộc tảng ấy).
 * Nhãn không phải mã ô, hoặc ô chưa giao cho tảng nào → null.
 */
export function oDangGiao<G extends { ma_can: string }>(
  khop: Pick<KhopMaCan<unknown>, 'nguon' | 'maCan'> | null | undefined, giao: readonly G[],
): G | null {
  if (!khop || khop.nguon !== 'o_ma') return null;
  return giao.find(g => chuanMaCan(g.ma_can) === khop.maCan) ?? null;
}
