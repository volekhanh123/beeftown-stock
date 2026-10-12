/**
 * BEEFTOWN CÂN — BÁO VỀ KHO (2.9, truy vết tảng GĐ3; migration 0061)
 *
 * Trước 2.9 kho không biết gì về cân: mọi thứ nằm trong file trên máy quầy. Từ 2.9, mỗi phút (main.ts, BAO_KHO_MS) chương
 * trình báo về kho:
 *   · trạng thái (kho_may_can_bao): cân trả lời lần cuối, tự gửi bật không, số hàng kho đổi mà cân chưa nhận, lần tự gửi
 *     gần nhất có hỏng không, và các dòng đang nằm trên cân (số PLU, mã, tên, phím tắt) — kho chỉ giữ dòng MÃ Ô. Trang pha
 *     lóc dựa vào đó để hiện "Cân sẵn sàng: Ribeye #0142 = PLU 23 · phím E"; đèn "Beeftown Cân" ở /noi-bo dựa vào lần báo.
 *   · nhật ký tem đã in (kho_may_can_nhat_ky): dòng bán (loại 0) có mã cân, theo ký — kho chỉ giữ dòng mã ô, để đối chiếu
 *     "cân in 12 tem ô 10011, phiên quét 11". Gửi lại an toàn (kho bỏ dòng trùng); mốc chỉ tiến SAU khi kho trả lời.
 * Và mỗi 15 giây (HOI_KHO_MS) hỏi kho các ô đang giao (kho_can_giao_o_ma): đổi (vừa "Giao ô mã", tảng bán hết, chốt
 * phiên) thì tự gửi ngay, không đợi lượt tự gửi mỗi phút.
 *
 * File này chỉ có hàm thuần (test bằng bun, không mạng); nghiep-vu.ts gọi kho và đọc / ghi file.
 */
import type { DongBanCan } from './bao-cao-can.ts';
import type { PhimXem } from './thong-so.ts';

/**
 * Một dòng đang nằm trên cân gửi lên kho (kho_may_can_bao → tren_can). chua_xac_nhan (2.9.3, migration 0068): cân có thể đang
 * khác dòng này — chỉ có khóa khi true.
 */
export interface DongTrenCanBao { plu: number; ma_can: string; ten: string; phim: string[]; chua_xac_nhan?: true }
/** Một dòng nhật ký gửi lên kho (kho_may_can_nhat_ky). luc: giờ đồng hồ cân "YYYY-MM-DD HH:MM:SS" (giờ VN). */
export interface DongNhatKyBao { mac: string; fid: number; stt: number; luc: string; plu: number; ma_can: string; so_kg: number; loai: number }

/**
 * Dấu vân tay các ô đang giao (kho_can_giao_o_ma): chỉ những gì làm đổi dòng trên cân — ô nào, tảng nào giữ, còn giữ
 * không, hạn dùng / lô ra (HSD trên tem). Thứ tự dòng không tính.
 */
export function vanTayGiaoO(ds: unknown): string {
  if (!Array.isArray(ds)) return '';
  return ds.filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map(r => [r.o_ma_id, r.so_tang, r.con_giu, r.han_dung, r.lo_id, r.lo_vao_id].map(v => (v === null || v === undefined ? '' : String(v))).join('|'))
    .sort().join('\n');
}

/** Nhãn phím cho người đọc: tầng 1 "E", tầng 2 "Shift E", tầng 3+ "E (tầng 3)". */
export function nhanPhim(k: Pick<PhimXem, 'trang' | 'nhan'>): string {
  return k.trang === 0 ? k.nhan : k.trang === 1 ? `Shift ${k.nhan}` : `${k.nhan} (tầng ${k.trang + 1})`;
}

/**
 * Dòng trên cân (tren-can.tsv) + phím tắt trong file gốc → dòng gửi kho. Bỏ dòng không có mã (dòng trống, hàng thử);
 * mỗi PLU tối đa 8 phím (kho cũng cắt 8). `chuaChac` (2.9.3): dòng cân có thể đang khác → kèm chua_xac_nhan: true.
 */
export function dongTrenCanBao(tren: Iterable<{ so: number; ma: string; ten: string }>, phim: PhimXem[],
                               bo: (h: { so: number; ma: string }) => boolean = () => false,
                               chuaChac: (h: { so: number; ma: string; ten: string }) => boolean = () => false): DongTrenCanBao[] {
  const theoPlu = new Map<number, string[]>();
  for (const k of phim) {
    if (k.plu <= 0) continue;
    const ds = theoPlu.get(k.plu) ?? [];
    if (ds.length < 8) ds.push(nhanPhim(k));
    theoPlu.set(k.plu, ds);
  }
  return [...tren].filter(h => /^\d{1,6}$/.test(h.ma) && !bo(h)).sort((a, b) => a.so - b.so)
    .map(h => ({ plu: h.so, ma_can: h.ma, ten: h.ten, phim: theoPlu.get(h.so) ?? [], ...(chuaChac(h) ? { chua_xac_nhan: true as const } : {}) }));
}

/**
 * Chọn dòng nhật ký cần gửi kho: dòng bán (loại 0) tính kho, có mã cân, theo ký, số ký dương — kho chỉ giữ dòng mã ô,
 * chương trình không biết mã nào là ô nên gửi cả. Từ mốc `moc` (giờ cân của dòng cuối đã gửi được) trở đi, tối đa `toiDa`
 * dòng sớm nhất. Gửi lại các dòng đúng giây của mốc (kho bỏ dòng trùng) — nhưng chỉ khi có dòng SAU mốc; không có gì mới
 * thì [] (không gửi lại mỗi phút).
 */
export function chonNhatKyGui(ds: DongBanCan[], moc: string, toiDa: number): DongNhatKyBao[] {
  const hop = ds.filter(d => d.loai === 0 && d.tinhKho && !d.theoCai && /^\d{1,6}$/.test(d.maCan) && d.soLuong > 0
                         && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(d.luc) && d.luc >= moc)
    .sort((a, b) => (a.luc < b.luc ? -1 : a.luc > b.luc ? 1 : a.fid - b.fid || a.stt - b.stt));
  if (!hop.some(d => d.luc > moc)) return [];
  return hop.slice(0, toiDa).map(d => ({ mac: d.mac, fid: d.fid, stt: d.stt, luc: d.luc, plu: d.plu, ma_can: d.maCan,
                                         so_kg: Math.round(d.soLuong * 1000) / 1000, loai: d.loai }));
}
