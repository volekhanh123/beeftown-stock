/**
 * KHO — TÌM, LỌC NGÀY, "CỦA TÔI", CHIA TRANG CHO DANH SÁCH PHIẾU
 *
 * Dùng chung cho Nhập hàng, Chuyển · Xuất · Hủy, Kiểm kê, Pha lóc. Mọi thứ
 * đi trên URL (GET), nên F5, gửi link qua Zalo hay bấm "Quay lại" đều giữ
 * đúng bộ lọc — không cần JavaScript.
 *
 * Chia trang: đọc CO_TRANG + 1 dòng. Có dòng thứ CO_TRANG + 1 nghĩa là còn
 * trang sau — khỏi đếm tổng (đếm trên view nhiều cột chậm hơn nhiều).
 *
 * File thuần (không gọi database) — test bằng Node.
 */

export const CO_TRANG = 30;

export interface TimDs {
  /** Chữ tìm đã làm sạch ('' = không tìm). */
  q: string;
  tu: string | null;
  den: string | null;
  cuaToi: boolean;
  /** Trang, đếm từ 1. */
  trang: number;
}

const NGAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Làm sạch chữ tìm trước khi ghép vào bộ lọc .or() của PostgREST: dấu phẩy,
 * ngoặc, sao, phần trăm, nháy, gạch chéo ngược có nghĩa riêng ở đó — để
 * nguyên thì người gõ "A, B" làm vỡ câu lọc (hoặc chèn thêm điều kiện).
 */
export function lamSachTim(v: unknown): string {
  return String(v ?? '').replace(/[,()*%"'\\:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

export function docTimDs(sp: URLSearchParams): TimDs {
  const ngay = (k: string) => { const v = sp.get(k) ?? ''; return NGAY.test(v) ? v : null; };
  let tu = ngay('tu');
  let den = ngay('den');
  if (tu && den && tu > den) [tu, den] = [den, tu];
  const trang = Math.min(Math.max(Number.parseInt(sp.get('trang') ?? '1', 10) || 1, 1), 500);
  return { q: lamSachTim(sp.get('q')), tu, den, cuaToi: sp.get('cua_toi') === '1', trang };
}

/** Có đang lọc gì ngoài trạng thái không (để hiện "Bỏ lọc", đổi câu khi rỗng). */
export function dangTim(t: TimDs): boolean {
  return t.q !== '' || t.tu !== null || t.den !== null || t.cuaToi;
}

/** Vị trí dòng đầu/cuối cho .range() — lấy dư 1 dòng để biết còn trang sau. */
export function khoangTrang(t: TimDs): [number, number] {
  const dau = (t.trang - 1) * CO_TRANG;
  return [dau, dau + CO_TRANG];
}

/** Cắt về đúng CO_TRANG dòng và cho biết còn trang sau không. */
export function catTrang<T>(ds: T[]): { ds: T[]; coSau: boolean } {
  return { ds: ds.slice(0, CO_TRANG), coSau: ds.length > CO_TRANG };
}

/** Bộ lọc .or() tìm theo nhiều cột chữ: "so_phieu.ilike.*abc*,ten.ilike.*abc*". */
export function locTimNhieuCot(cot: readonly string[], q: string): string | null {
  const s = lamSachTim(q);
  return s ? cot.map(c => `${c}.ilike.*${s}*`).join(',') : null;
}

/**
 * Áp tìm / ngày / của tôi / trang lên một truy vấn Supabase. Truyền vào đúng
 * builder đang dựng (sau .select và .eq chi nhánh); trả về builder đã áp.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apDungTim<Q extends { or: any; gte: any; lte: any; eq: any; range: any }>(
  q: Q, t: TimDs, o: { cotTim: readonly string[]; cotNgay: string; nhanSuId: string | null },
): Q {
  let r = q;
  const hoac = locTimNhieuCot(o.cotTim, t.q);
  if (hoac) r = r.or(hoac);
  if (t.tu) r = r.gte(o.cotNgay, t.tu);
  if (t.den) r = r.lte(o.cotNgay, t.den);
  if (t.cuaToi && o.nhanSuId) r = r.eq('nguoi_tao', o.nhanSuId);
  const [dau, cuoi] = khoangTrang(t);
  return r.range(dau, cuoi);
}

/**
 * Link giữ nguyên mọi tham số hiện tại, đổi vài cái. Giá trị null = bỏ tham
 * số đó. Đổi bộ lọc thì về trang 1 (trừ khi chính là đổi trang).
 */
export function linkDs(duong: string, sp: URLSearchParams, thay: Record<string, string | null>): string {
  const m = new URLSearchParams(sp);
  if (!('trang' in thay)) m.delete('trang');
  for (const [k, v] of Object.entries(thay)) {
    if (v === null || v === '') m.delete(k); else m.set(k, v);
  }
  const s = m.toString();
  return s ? `${duong}?${s}` : duong;
}
