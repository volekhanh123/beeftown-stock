/**
 * KHO — Ô MÃ XOAY VÒNG (0049, truy vết tảng GĐ2)
 *
 * Phần cắt của món theo tảng có vài ô mã cố định (mã cân riêng, tạo một lần
 * trên FABi, cùng giá). Lóc một tảng thì kho giao một ô trống cho phần cắt; cân
 * in tem bằng mã ô, FABi bán theo mã ô, kho biết mã ô ↔ tảng. Tảng bán hết thì
 * ô dùng lại.
 *
 * Ô mã gõ ở form mặt hàng dạng "10011-10019" hoặc "10011, 10012, 10015". Các
 * hàm đọc / viết là hàm thuần — test bằng node.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, kqHai, type HaiThuTieng, type KetQua } from './chung.ts';
import { dichCau } from '../cau-noi-bo.ts';

export interface DongOMa { id: string; mat_hang_id: string; so_o: number; ma_can: string }

export const O_MA_TOI_DA = 30;

const chuanMa = (s: string) => s.trim().replace(/^0+/, '');
const maHopLe = (s: string) => /^[1-9]\d{0,5}$/.test(s);

/**
 * "10011-10019" · "10011, 10012, 10015" · xuống dòng → danh sách mã theo thứ tự
 * ô (ô 1 = mã đầu tiên). Trống → [] (bỏ hết ô).
 */
export function docChuOMa(chu: string): { ma: string[]; loi: HaiThuTieng | null } {
  const ma: string[] = [];
  for (const muc of chu.split(/[,;\n]+/).map(x => x.trim()).filter(Boolean)) {
    const dai = /^(\d{1,6})\s*(?:-|–|—|\.\.)\s*(\d{1,6})$/.exec(muc);
    if (dai) {
      const a = Number(dai[1]), b = Number(dai[2]);
      if (!(a >= 1 && b >= a)) return { ma: [], loi: { vi: `Ô mã: "${muc}" phải từ số nhỏ tới số lớn.`, en: `Rotating codes: "${muc}" must go from the smaller number to the larger one.` } };
      if (b - a + 1 + ma.length > O_MA_TOI_DA) return { ma: [], loi: { vi: `Ô mã: tối đa ${O_MA_TOI_DA} ô mỗi món.`, en: `Rotating codes: at most ${O_MA_TOI_DA} per item.` } };
      for (let n = a; n <= b; n++) ma.push(String(n));
      continue;
    }
    const m = chuanMa(muc);
    if (!maHopLe(m)) return { ma: [], loi: { vi: `Ô mã: "${muc}" không phải mã cân (dãy số, tối đa 6 số).`, en: `Rotating codes: "${muc}" is not a scale code (digits, up to 6).` } };
    ma.push(m);
  }
  if (ma.some(m => !maHopLe(m))) return { ma: [], loi: { vi: 'Ô mã: mã cân tối đa 6 số.', en: 'Rotating codes: scale codes have at most 6 digits.' } };
  const trung = ma.find((m, i) => ma.indexOf(m) !== i);
  if (trung) return { ma: [], loi: { vi: `Ô mã: mã ${trung} ghi hai lần.`, en: `Rotating codes: code ${trung} appears twice.` } };
  if (ma.length > O_MA_TOI_DA) return { ma: [], loi: { vi: `Ô mã: tối đa ${O_MA_TOI_DA} ô mỗi món.`, en: `Rotating codes: at most ${O_MA_TOI_DA} per item.` } };
  return { ma, loi: null };
}

/** Danh sách mã (theo thứ tự ô) → chữ gọn: dãy liền nhau thành "a-b". */
export function chuOMa(ma: string[]): string {
  const ra: string[] = [];
  let i = 0;
  while (i < ma.length) {
    let j = i;
    while (j + 1 < ma.length && Number(ma[j + 1]) === Number(ma[j]) + 1) j++;
    ra.push(j - i >= 2 ? `${ma[i]}-${ma[j]}` : ma.slice(i, j + 1).join(', '));
    i = j + 1;
  }
  return ra.join(', ');
}

/** Ô mã mọi món: mat_hang_id → các ô theo số ô. */
export async function docOMa(client: SupabaseClient): Promise<Map<string, DongOMa[]>> {
  const { data, error } = await client.from('kho_o_ma').select('id, mat_hang_id, so_o, ma_can').order('so_o');
  if (error) throw error;
  const ra = new Map<string, DongOMa[]>();
  for (const r of (data ?? []) as DongOMa[]) ra.set(r.mat_hang_id, [...(ra.get(r.mat_hang_id) ?? []), r]);
  return ra;
}

/**
 * Thay ô mã của một món theo danh sách mã (quyền danh mục — policy kho_o_ma_sua).
 * Ô có số trùng thì sửa mã, thêm ô mới, bỏ ô thừa. Ô đã từng giao cho tảng thì
 * database không cho bỏ (lịch sử truy vết) — báo lại.
 */
export async function luuOMa(client: SupabaseClient, matHangId: string, ma: string[]): Promise<KetQua> {
  const { data: cu, error: e0 } = await client.from('kho_o_ma').select('id, so_o, ma_can').eq('mat_hang_id', matHangId);
  if (e0) return { ok: false, cau: cauLoiKho(e0) };
  const theoSo = new Map((cu ?? []).map(r => [r.so_o as number, r]));
  for (const [i, m] of ma.entries()) {
    const o = theoSo.get(i + 1);
    if (o && o.ma_can === m) continue;
    const { error } = o
      ? await client.from('kho_o_ma').update({ ma_can: m }).eq('id', o.id)
      : await client.from('kho_o_ma').insert({ mat_hang_id: matHangId, so_o: i + 1, ma_can: m });
    if (error) return { ok: false, cau: cauLoiKho(error) };
  }
  const thua = (cu ?? []).filter(r => (r.so_o as number) > ma.length).map(r => r.id as string);
  if (thua.length) {
    const { error } = await client.from('kho_o_ma').delete().in('id', thua);
    if (error) {
      return kqHai(false, { vi: 'Ô đã từng giao cho tảng nên không bỏ được (giữ lịch sử truy vết) — chỉ đổi mã hoặc thêm ô.',
                            en: 'A code that has been assigned to a primal cannot be removed (its history is kept) — only change codes or add more.' });
    }
  }
  return kqHai(true, { vi: 'Đã lưu ô mã.', en: 'Rotating codes saved.' });
}

// -----------------------------------------------------------------------------
// GIAO Ô CHO PHIÊN LÓC
// -----------------------------------------------------------------------------
/** Một dòng kho_v_o_ma_giao — ô đang giao. Không tiền. */
export interface GiaoOMa {
  giao_id: string;
  o_ma_id: string;
  mat_hang_id: string;
  ten_hang: string;
  so_o: number;
  ma_can: string;
  phien_pha_id: string;
  so_phieu: string;
  trang_thai_phien: string;
  lo_vao_id: string | null;
  so_tang: number | null;
  ma_lo_tang: string | null;
  lo_id: string | null;
  han_dung: string | null;
  con_kg: number;
  con_goi: number;
  con_giu: boolean;
  tu_luc: string;
}

export async function docGiaoOMa(client: SupabaseClient, chiNhanhId: string, phienPhaId?: string): Promise<GiaoOMa[]> {
  let q = client.from('kho_v_o_ma_giao')
    .select('giao_id, o_ma_id, mat_hang_id, ten_hang, so_o, ma_can, phien_pha_id, so_phieu, trang_thai_phien, lo_vao_id, so_tang, ma_lo_tang, lo_id, han_dung, con_kg, con_goi, con_giu, tu_luc')
    .eq('chi_nhanh_id', chiNhanhId);
  if (phienPhaId) q = q.eq('phien_pha_id', phienPhaId);
  const { data, error } = await q.order('ten_hang').order('so_o');
  if (error) throw error;
  return (data ?? []).map(r => ({ ...r, con_kg: Number(r.con_kg), con_goi: Number(r.con_goi) })) as GiaoOMa[];
}

/** Số tảng của các lô (lô vào của phiên lóc). */
export async function docSoTang(client: SupabaseClient, loIds: string[]): Promise<Map<string, number | null>> {
  if (!loIds.length) return new Map();
  const { data, error } = await client.from('kho_lo').select('id, so_tang').in('id', loIds);
  if (error) throw error;
  return new Map((data ?? []).map(r => [r.id as string, r.so_tang === null ? null : Number(r.so_tang)]));
}

/** Giao ô trống cho mọi phần cắt có ô mã trong công thức của tảng (quyền pha_loc). */
export async function giaoOMa(client: SupabaseClient, phienPhaId: string): Promise<KetQua> {
  const { data, error } = await client.rpc('kho_giao_o_ma', { p_id: phienPhaId, p_mat_hang_id: null });
  if (error) return { ok: false, cau: cauLoiKho(error), cauEn: dichCau('en', cauLoiKho(error)) };
  const ds = (data ?? []) as { ten: string; so_o: number; ma_can: string }[];
  const mot = { vi: (x: typeof ds[number]) => `${x.ten}: ô ${x.so_o} (mã ${x.ma_can})`,
                en: (x: typeof ds[number]) => `${x.ten}: slot ${x.so_o} (code ${x.ma_can})` };
  // 0061: Beeftown Cân 2.9 ở quầy (bật Tự gửi) hỏi kho 15 giây một lần và tự gửi tên mới — tự gửi tắt hay bản cũ thì quản
  // lý phải bấm Gửi. Không hứa "cân đã đổi": trang đọc lại kho_phien_pha_can và hiện "Cân sẵn sàng" khi máy quầy báo.
  return kqHai(true, { vi: `Đã giao ô mã — ${ds.map(mot.vi).join(' · ')}. Beeftown Cân ở quầy bật Tự gửi thì tự gửi tên mới xuống cân sau khoảng 15–60 giây; không thì quản lý mở Beeftown Cân bấm Gửi xuống cân. Chờ dòng "Cân sẵn sàng" hiện xanh (bấm Xem lại cân) rồi mới in tem.`,
                       en: `Rotating codes assigned — ${ds.map(mot.en).join(' · ')}. If Beeftown Scale at the counter has automatic sending on, it sends the new names to the scale within about 15–60 seconds; otherwise a manager opens Beeftown Scale and presses Send to scale. Wait for the "Scale ready" line to turn green (press Check the scale again) before printing labels.` });
}

/** Quản lý trả một ô về trống (quyền duyet). */
export async function giaiPhongOMa(client: SupabaseClient, giaoId: string): Promise<KetQua> {
  const { data, error } = await client.rpc('kho_giai_phong_o_ma', { p_giao_id: giaoId });
  if (error) return { ok: false, cau: cauLoiKho(error), cauEn: dichCau('en', cauLoiKho(error)) };
  const cau = String(data ?? '');
  return { ok: true, cau, cauEn: dichCau('en', cau) };
}

// -----------------------------------------------------------------------------
// 0061 — BEEFTOWN CÂN BÁO VỀ KHO
// -----------------------------------------------------------------------------
/**
 * Ô đang giao cho danh mục cân (kho_can_giao_o_ma, quyền xem): đúng các dòng của kho_v_o_ma_giao, đọc được cả bằng NV quầy
 * (view thì rỗng với NV quầy — không đọc được phiên lóc). hangChoCan dùng hàm này.
 */
export async function docGiaoOMaCan(client: SupabaseClient, chiNhanhId: string): Promise<GiaoOMa[]> {
  const { data, error } = await client.rpc('kho_can_giao_o_ma', { p_chi_nhanh_id: chiNhanhId });
  // Database chưa chạy 0061 (Beeftown Cân 2.9 cập nhật trước khi kho có hàm): đọc view như 2.8 — quản lý / chủ vẫn gửi đủ
  // tên ô; NV quầy đọc view thì rỗng (như 2.8). Chỉ khi CHÍNH hàm này chưa có, lỗi khác vẫn ném.
  if (error && (error.code === 'PGRST202' || error.code === '42883') && /\bkho_can_giao_o_ma\b/.test(error.message ?? '')) {
    return docGiaoOMa(client, chiNhanhId);
  }
  if (error) throw error;
  const ds = Array.isArray(data) ? data as Record<string, unknown>[] : [];
  return ds.map(r => ({ ...r, con_kg: Number(r.con_kg), con_goi: Number(r.con_goi) })) as unknown as GiaoOMa[];
}

/**
 * Một dòng ô mã đang nằm trên cân, theo một máy quầy (kho_may_can.tren_can). chua_xac_nhan (0066, Beeftown Cân 2.9.2): máy đó
 * báo lần gửi gần nhất cân chưa xác nhận — cân có thể khác dòng này; không có (database / máy quầy cũ) = như false.
 */
export interface TrenCanO { plu: number; ten: string; phim: string[]; bao_luc: string; chua_xac_nhan?: boolean }
/** Một ô của phiên lóc (kho_phien_pha_can). in / in_kg: tem cân in bằng mã ô từ lúc giao tới lúc chốt. */
export interface OCanPhien {
  giao_id: string; o_ma_id: string; mat_hang_id: string; ten_hang: string; so_o: number; ma_can: string;
  so_tang: number | null; dang_giu: boolean; tu_luc: string; den_luc: string | null;
  quet: number; quet_kg: number; in: number; in_kg: number; tren_can: TrenCanO[];
}
/** Một máy quầy của chi nhánh báo trong 14 ngày. */
export interface MayCanPhien {
  bao_luc: string; phien_ban: string | null; giu_ket_noi: boolean; can_tra_loi_luc: string | null;
  tu_gui: boolean; lech_so: number | null; lech_tu: string | null; gui_loi: boolean; gui_luc: string | null;
  nhat_ky_luc: string | null;
  /** 0066: lần gửi gần nhất cân chưa xác nhận, từ lúc nào (database ghi). Không có = database chưa chạy 0066. */
  chua_xac_nhan?: boolean; chua_xac_nhan_tu?: string | null;
}
/** Nhãn mã thường (mã món / mã giảm) của phần cắt có ô, đã quét vào phiên theo tảng. */
export interface NhanThuong { mat_hang_id: string; ten: string; ma_can: string; so_nhan: number; so_kg: number }
export interface CanPhien {
  /** now() của database — "bao lâu trước" tính theo mốc này. */
  luc: string; theo_tang: boolean; co_mau_ma_vach: boolean;
  o: OCanPhien[]; nhan_thuong: NhanThuong[]; may: MayCanPhien[];
}

/**
 * Trang pha lóc đọc ô nào đã lên cân, tem in / nhãn quét, nhãn mã thường (kho_phien_pha_can, quyền pha_loc hoặc xem_gia).
 * Không bao giờ ném: không đọc được (database chưa chạy 0061, mạng) → null, trang bỏ khung này — KHÔNG đoán "cân sẵn sàng".
 */
export async function docCanPhien(client: SupabaseClient, phienPhaId: string): Promise<CanPhien | null> {
  try {
    const { data, error } = await client.rpc('kho_phien_pha_can', { p_id: phienPhaId });
    if (error || !data || typeof data !== 'object' || !Array.isArray((data as CanPhien).o)) return null;
    const d = data as CanPhien;
    return {
      luc: String(d.luc), theo_tang: d.theo_tang === true, co_mau_ma_vach: d.co_mau_ma_vach === true,
      o: d.o.map(o => ({ ...o, quet: Number(o.quet), quet_kg: Number(o.quet_kg), in: Number(o.in), in_kg: Number(o.in_kg),
                         tren_can: Array.isArray(o.tren_can) ? o.tren_can : [] })),
      nhan_thuong: (Array.isArray(d.nhan_thuong) ? d.nhan_thuong : []).map(n => ({ ...n, so_nhan: Number(n.so_nhan), so_kg: Number(n.so_kg) })),
      may: Array.isArray(d.may) ? d.may : [],
    };
  } catch {
    return null;
  }
}
