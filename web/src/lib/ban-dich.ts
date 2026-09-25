/**
 * BẢN DỊCH TỰ ĐỘNG — nối máy dịch với database
 * ============================================
 *
 * Luật nằm ở database (0036): ô nào cần dịch (v_viec_dich), ghi thế nào để
 * không bao giờ ghi bản dịch của một câu vừa bị sửa (ghi_ban_dich), và sửa
 * tay thắng máy (trigger ghi_so_ban_dich). File này chỉ làm ba việc: đọc
 * việc, gọi máy dịch (lib/may-dich.ts), ghi kết quả.
 *
 * AI GỌI FILE NÀY
 *
 *   · Màn soạn tin, sau khi Lưu → dịch đúng tin vừa lưu, CHẠY NỀN: trang trả
 *     về ngay, bản dịch ghi vào vài giây sau.
 *   · Middleware, khi vai biên tập mở một trang /noi-bo → dịch bù chỗ còn
 *     sót: sửa thẳng trong Supabase Studio, hoặc lần trước máy lỗi.
 *   · Màn công tắc → dịch MỘT dữ kiện TRƯỚC khi gọi dat_noi_dung(), vì bản
 *     dịch của dữ kiện đi cùng phiên bản (xem đầu 0036).
 *
 * Mọi lời gọi database dùng client của người đang đăng nhập — không có khóa
 * service_role. Ai không sửa được tin thì RLS cũng không cho ghi bản dịch.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from 'cloudflare:workers';
import {
  dichSangAnhHan, type BanDichCuaCau, type KetQuaNgonNgu, type NgonNguDich,
} from './may-dich';

export type { BanDichCuaCau, KetQuaNgonNgu, NgonNguDich };

/**
 * Khóa đọc LÚC CHẠY từ secret của Worker. Không đi qua import.meta.env: thứ
 * đó bị Vite nướng vào bản build, và bản build nằm trong tay bất kỳ ai tải
 * được file JavaScript của trang.
 */
function cauHinhMayDich() {
  return { khoa: env.GEMINI_API_KEY, mauMay: env.GEMINI_MODEL };
}

/** Vai soạn được nội dung công khai — cùng bộ ba với RLS của 0009–0012. */
export const VAI_BIEN_TAP = ['chu_so_huu', 'quan_ly', 'marketing'];

/** Một câu gốc đem dịch, cùng những thứ tiếng nó đang thiếu. */
interface CauGom {
  bang: string;
  dongId: string;
  cot: string;
  nguon: string;
  bam: string;
  can: Set<NgonNguDich>;
}

interface ViecDich {
  bang: string;
  dong_id: string;
  cot: string;
  ngon_ngu: NgonNguDich;
  nguon: string;
  bam: string;
  ly_do: string;
}

export interface TomTatDich {
  /** Số ô (một câu gốc × một thứ tiếng) đã đem dịch trong lượt này. */
  so_o: number;
  xong: number;
  bi_chan: number;
  loi: number;
  /** Câu lỗi đầu tiên, để màn hình nói được VÌ SAO — "lỗi" trống trơn thì không ai sửa được. */
  loi_dau: string | null;
}

// Một lượt = một lời gọi API. Giới hạn để lời gọi xong trước khi Worker cắt
// việc chạy nền (khoảng 30 giây sau khi trả trang); phần còn lại để lượt sau.
const TOI_DA_CAU_MOT_LUOT = 16;
const TOI_DA_CHU_MOT_LUOT = 6000;

/**
 * Dịch những ô đang chờ. Không truyền `loc` thì dịch bù toàn bộ những gì
 * người này được sửa; truyền bảng + dòng thì chỉ dịch đúng dòng đó.
 */
export async function dichBu(
  client: SupabaseClient, loc: { bang?: string; dongId?: string } = {},
): Promise<TomTatDich> {
  const tom: TomTatDich = { so_o: 0, xong: 0, bi_chan: 0, loi: 0, loi_dau: null };

  let truyVan = client
    .from('v_viec_dich')
    .select('bang, dong_id, cot, ngon_ngu, nguon, bam, ly_do')
    // Dữ kiện công bố chỉ được dịch khi người ta lưu lại nó (xem đầu file).
    .neq('bang', 'noi_dung_cong_bo');
  if (loc.bang) truyVan = truyVan.eq('bang', loc.bang);
  if (loc.dongId) truyVan = truyVan.eq('dong_id', loc.dongId);

  const { data, error } = await truyVan.limit(200);
  if (error) {
    tom.loi_dau = error.message;
    return tom;
  }

  // Gom theo câu gốc: một câu cần tiếng Anh, tiếng Hàn hay cả hai thì vẫn chỉ
  // đem dịch một lần.
  const theoCau = new Map<string, CauGom>();
  for (const v of (data ?? []) as ViecDich[]) {
    const k = `${v.bang}|${v.dong_id}|${v.cot}`;
    const c = theoCau.get(k)
      ?? { bang: v.bang, dongId: v.dong_id, cot: v.cot, nguon: v.nguon, bam: v.bam, can: new Set() };
    c.can.add(v.ngon_ngu);
    theoCau.set(k, c);
  }

  const luot: CauGom[] = [];
  let tongChu = 0;
  for (const c of theoCau.values()) {
    if (luot.length >= TOI_DA_CAU_MOT_LUOT) break;
    if (luot.length > 0 && tongChu + c.nguon.length > TOI_DA_CHU_MOT_LUOT) break;
    luot.push(c);
    tongChu += c.nguon.length;
  }
  if (luot.length === 0) return tom;

  // Khóa gửi đi là số thứ tự — máy dịch không cần biết id hay tên bảng.
  const ketQua = await dichSangAnhHan(
    luot.map((c, i) => ({ khoa: String(i), vi: c.nguon })), cauHinhMayDich());

  // ghi_ban_dich nhận một dòng mỗi lần.
  const theoDong = new Map<string, { bang: string; dongId: string; muc: object[] }>();
  luot.forEach((c, i) => {
    const kq = ketQua[i];
    const k = `${c.bang}|${c.dongId}`;
    const d = theoDong.get(k) ?? { bang: c.bang, dongId: c.dongId, muc: [] };
    for (const l of c.can) {
      const r = kq[l];
      d.muc.push({
        cot: c.cot, ngon_ngu: l, bam: c.bam, tt: r.tt,
        noi_dung: r.tt === 'ok' ? r.noi_dung : null,
        ly_do: r.tt === 'ok' ? null : r.ly_do,
      });
      tom.so_o++;
      if (r.tt === 'ok') tom.xong++;
      else if (r.tt === 'bi_chan') tom.bi_chan++;
      else { tom.loi++; tom.loi_dau ??= r.ly_do; }
    }
    theoDong.set(k, d);
  });

  for (const d of theoDong.values()) {
    const { error: loiGhi } = await client.rpc('ghi_ban_dich', {
      p_bang: d.bang, p_dong_id: d.dongId, p_muc: d.muc,
    });
    if (loiGhi) tom.loi_dau ??= loiGhi.message;
  }
  return tom;
}

/** Một câu cho người bấm nút "Dịch ngay" — nói rõ bao nhiêu ô xong, ô nào hỏng và vì sao. */
export function cauTomTat(t: TomTatDich): { ok: boolean; cau: string } {
  if (t.so_o === 0) {
    return t.loi_dau
      ? { ok: false, cau: `Không đọc được danh sách cần dịch: ${t.loi_dau}` }
      : { ok: true, cau: 'Không còn ô nào cần dịch.' };
  }
  const phan = [`Đã dịch ${t.xong}/${t.so_o} ô`];
  if (t.bi_chan) phan.push(`${t.bi_chan} ô bị bộ lọc chữ cấm chặn, không lên trang`);
  if (t.loi) phan.push(`${t.loi} ô chưa dịch được: ${t.loi_dau ?? ''}`);
  return { ok: t.loi === 0 && t.bi_chan === 0, cau: phan.join(' · ') };
}

/** Dịch một câu — dùng cho dữ kiện công bố, nơi bản dịch phải có TRƯỚC khi lưu. */
export async function dichMotCau(vi: string): Promise<BanDichCuaCau> {
  const [kq] = await dichSangAnhHan([{ khoa: '0', vi }], cauHinhMayDich());
  return kq;
}

/**
 * Cho một việc chạy tiếp sau khi trang đã trả về (waitUntil của Worker).
 * Không có ngữ cảnh Worker thì việc vẫn chạy, chỉ là không ai đợi nó.
 * Lỗi được nuốt và ghi log: máy dịch hỏng không được làm hỏng trang.
 */
export function chayNen(locals: App.Locals, viec: Promise<unknown>): void {
  const p = viec.catch(e => console.error('[ban-dich]', e instanceof Error ? e.message : e));
  (locals as { cfContext?: { waitUntil?(p: Promise<unknown>): void } }).cfContext?.waitUntil?.(p);
}

let lanDichBuCuoi = 0;

/**
 * Tối đa một lượt dịch bù mỗi phút cho mỗi bản Worker đang chạy. Đủ để hàng
 * việc cạn dần khi có người dùng trang nội bộ, mà không gọi API sau mỗi cú
 * bấm. v_viec_dich cũng tự chờ 15 phút sau một lần lỗi, nên khóa sai không
 * đốt hạn mức liên tục.
 */
export function denLuotDichBu(): boolean {
  const bayGio = Date.now();
  if (bayGio - lanDichBuCuoi < 60_000) return false;
  lanDichBuCuoi = bayGio;
  return true;
}

/** Những ô của một dòng đang chờ máy dịch, dạng "mo_ta/ko". */
export async function oDangCho(client: SupabaseClient, bang: string, dongId: string): Promise<Set<string>> {
  const { data } = await client
    .from('v_viec_dich')
    .select('cot, ngon_ngu')
    .eq('bang', bang)
    .eq('dong_id', dongId);
  return new Set((data ?? []).map((r: { cot: string; ngon_ngu: string }) => `${r.cot}/${r.ngon_ngu}`));
}

/** Một mục trong sổ bản dịch (cột ban_dich, 0036). */
export interface SoO {
  bam?: string;
  cach?: 'may' | 'tay';
  tt?: 'ok' | 'bi_chan' | 'loi';
  ly_do?: string;
  luc?: string;
}
export type SoBanDich = Record<string, Partial<Record<NgonNguDich, SoO>>>;

/**
 * Một dòng chữ nói trạng thái của một ô dịch, cho người soạn đọc lướt.
 * Trả về null khi không có gì đáng nói (ô chưa có câu gốc).
 */
export function moTaO(so: SoO | undefined, dangCho: boolean): { chu: string; lop: 'xong' | 'cho' | 'loi' } | null {
  if (dangCho) {
    return so?.tt === 'loi'
      ? { chu: `Lỗi lần trước, sẽ thử lại: ${so.ly_do ?? ''}`, lop: 'loi' }
      : { chu: 'Đang chờ máy dịch — tải lại trang sau ít giây', lop: 'cho' };
  }
  if (!so) return null;
  if (so.tt === 'bi_chan') return { chu: `Bị chặn, không lên trang: ${so.ly_do ?? ''}`, lop: 'loi' };
  if (so.tt === 'loi') return { chu: `Chưa dịch được: ${so.ly_do ?? ''}`, lop: 'loi' };
  return so.cach === 'tay'
    ? { chu: 'Bản sửa tay — giữ nguyên cho tới khi câu tiếng Việt đổi', lop: 'xong' }
    : { chu: 'Máy dịch', lop: 'xong' };
}
