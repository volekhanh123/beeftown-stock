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

/**
 * Phiên lóc còn nháp của một ô đang giữ — đủ để tính hạn của lô phần cắt SẼ sinh ra lúc chốt (danh-muc-can.ts, tem cân
 * in mã ô trong lúc phiên còn mở). Không tiền.
 */
export interface PhienLocHsd {
  id: string;
  so_phieu: string;
  /** Ngày lóc 'YYYY-MM-DD' (kho_phien_pha.ngay_pha — có thể trước hôm nay: phiên mở từ hôm qua, ghi lùi ngày). */
  ngay_pha: string;
  /** Hạn SỚM NHẤT của các lô vào (tảng) — đọc thẳng kho_lo, kể cả lô đã hết tồn. null: không đọc được lô vào nào / một lô vào. */
  han_tang: string | null;
  /** Các dòng ra đã nhập (han_dung: hạn gõ tay, hay còn lại từ lần chốt trước khi phiên được mở lại). */
  ra: { mat_hang_id: string; han_dung: string | null; xu_ly: string }[];
}

/**
 * Đọc các phiên lóc theo id: ngày lóc, dòng ra, hạn các lô vào (kho_phien_pha, kho_phien_pha_ra, kho_phien_pha_vao,
 * kho_lo) — RLS: xem giá hay pha lóc ở đúng chi nhánh (quản lý, chủ, thủ kho); kho_lo: xem kho. Đọc thẳng các bảng chứ
 * không lấy từ tồn (kho_v_ton): tảng đã hết tồn vẫn là hạn chặn của lô ra. Phiên không đọc được (RLS) thì không có trong
 * kết quả; lỗi đọc thì ném (không đoán HSD).
 */
export async function docPhienLocHsd(client: SupabaseClient, phienIds: string[]): Promise<Map<string, PhienLocHsd>> {
  const ids = [...new Set(phienIds.filter(Boolean))];
  const ra = new Map<string, PhienLocHsd>();
  if (!ids.length) return ra;
  const [ph, dongRa, vao] = await Promise.all([
    client.from('kho_phien_pha').select('id, so_phieu, ngay_pha').in('id', ids),
    client.from('kho_phien_pha_ra').select('phien_pha_id, mat_hang_id, han_dung, xu_ly').in('phien_pha_id', ids),
    client.from('kho_phien_pha_vao').select('phien_pha_id, lo_id').in('phien_pha_id', ids),
  ]);
  for (const kq of [ph, dongRa, vao]) if (kq.error) throw kq.error;
  const dsVao = (vao.data ?? []) as { phien_pha_id: string; lo_id: string }[];
  const loIds = [...new Set(dsVao.map(v => v.lo_id))];
  const hanLo = new Map<string, string>();
  if (loIds.length) {
    const lo = await client.from('kho_lo').select('id, han_dung').in('id', loIds);
    if (lo.error) throw lo.error;
    for (const l of (lo.data ?? []) as { id: string; han_dung: string }[]) hanLo.set(l.id, String(l.han_dung).slice(0, 10));
  }
  for (const p of (ph.data ?? []) as { id: string; so_phieu: string; ngay_pha: string }[]) {
    const han = dsVao.filter(v => v.phien_pha_id === p.id).map(v => hanLo.get(v.lo_id) ?? null);
    ra.set(p.id, {
      id: p.id, so_phieu: p.so_phieu, ngay_pha: String(p.ngay_pha).slice(0, 10),
      han_tang: han.length && han.every(h => h !== null) ? (han as string[]).reduce((a, b) => (b < a ? b : a)) : null,
      ra: ((dongRa.data ?? []) as { phien_pha_id: string; mat_hang_id: string; han_dung: string | null; xu_ly: string }[])
        .filter(r => r.phien_pha_id === p.id)
        .map(r => ({ mat_hang_id: r.mat_hang_id, han_dung: r.han_dung === null ? null : String(r.han_dung).slice(0, 10), xu_ly: r.xu_ly })),
    });
  }
  return ra;
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
  return kqHai(true, { vi: `Đã giao ô mã — ${ds.map(mot.vi).join(' · ')}. Mở Beeftown Cân, bấm Gửi xuống cân.`,
                       en: `Rotating codes assigned — ${ds.map(mot.en).join(' · ')}. Open Beeftown Scale and press Send to scale.` });
}

/** Quản lý trả một ô về trống (quyền duyet). */
export async function giaiPhongOMa(client: SupabaseClient, giaoId: string): Promise<KetQua> {
  const { data, error } = await client.rpc('kho_giai_phong_o_ma', { p_giao_id: giaoId });
  if (error) return { ok: false, cau: cauLoiKho(error), cauEn: dichCau('en', cauLoiKho(error)) };
  const cau = String(data ?? '');
  return { ok: true, cau, cauEn: dichCau('en', cau) };
}
