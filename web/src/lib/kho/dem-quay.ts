/**
 * KHO — ĐẾM QUẦY CUỐI NGÀY, QUÉT CỘNG DỒN (GĐ5b, migration 0032)
 *
 * Trang /noi-bo/kho/quay/dem của nhân viên quầy. Khác trang phiếu kiểm kê
 * (/noi-bo/kho/kiem-ke/<id>, quét ĐÈ số của món): ở đây mỗi lần gửi là MỘT
 * LƯỢT QUÉT được CỘNG vào phiếu —
 *   · kho_quet_kiem_ke(p_id, p_ma_gui, p_ma): p_ma là chuỗi số THÔ đúng như
 *     máy quét gửi; database đọc mã theo mẫu mã vạch trong Cài đặt. Cùng
 *     ma_gui = cùng lượt (bấm hai lần, mạng chập chờn gửi lại) → không cộng đôi.
 *     Hai máy quét cùng một phiếu cùng lúc vẫn cộng đúng (database khóa phiếu).
 *   · kho_bo_quet_kiem_ke: "Bỏ lượt vừa quét" (lượt của chính mình), "−1" một
 *     gói của một món.
 *   · kho_het_hang_con_lai(p_id, p_phien_ban): một chạm "những món không thấy
 *     gói nào là đã bán hết" — rồi gửi quản lý như phiếu thường.
 *
 * Nhân viên quầy KHÔNG thấy tiền, sổ hay chênh lệch: đọc bảng kho_kiem_ke_dong
 * (chỉ số đếm) và kho_kiem_ke_quet (từng nhãn đã quét) — không đọc view nào có giá.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, laUuid, type KetQua } from './chung.ts';
import { tachDanhSachMa } from './ma-vach.ts';

/** Tối đa nhãn một lượt gửi (kho_quet_kiem_ke chặn ở 300). */
export const TOI_DA_MOT_LUOT = 300;

/** Một món trong danh sách chạy: đã quét bao nhiêu nhãn, đang tính bao nhiêu gói / kg. */
export interface MonDaQuet {
  mat_hang_id: string;
  ten: string;
  dem_goi: boolean;
  don_vi_goi: string;
  so_nhan: number;
  so_goi_them: number;
  so_goi_dem: number | null;
  so_kg_dem: number | null;
}

/** Dòng của phiếu cho màn "Quét xong": món nào chưa thấy gói nào. */
export interface DongDemQuay {
  mat_hang_id: string;
  ten: string;
  dem_goi: boolean;
  so_goi_dem: number | null;
  so_kg_dem: number | null;
  xac_nhan_het: boolean;
}

const soHoacNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// -----------------------------------------------------------------------------
// HÀM THUẦN
// -----------------------------------------------------------------------------
/**
 * Nội dung ô quét → danh sách mã để gửi. Chỉ giữ chuỗi toàn số (máy quét đôi
 * khi gửi kèm ký tự lạ); mã sai độ dài vẫn gửi để database báo đúng nhãn đó.
 */
export function maTuO(noiDung: string): string[] {
  return tachDanhSachMa(noiDung).filter(m => /^\d{1,40}$/.test(m));
}

/**
 * Lỗi từng nhãn database trả về → vài câu ngắn cho nhân viên. Gom các nhãn
 * cùng một lỗi lại: "3 nhãn: Sai số kiểm tra — quét lại".
 */
export function cauLoiNhan(loi: { ma: string; loi: string }[]): string[] {
  const dem = new Map<string, number>();
  for (const l of loi) dem.set(l.loi, (dem.get(l.loi) ?? 0) + 1);
  return [...dem].map(([cau, n]) => (n > 1 ? `${n} nhãn: ${cau}` : `1 nhãn: ${cau}`));
}

/**
 * Món nào trên phiếu chưa thấy gói nào (chưa đếm, hoặc đếm ra 0 mà chưa xác
 * nhận hết) — hiện ở màn "Những món này không thấy gói nào — đã bán hết?".
 * Cùng điều kiện với kho_het_hang_con_lai.
 */
export function monKhongThay(dong: DongDemQuay[]): DongDemQuay[] {
  return dong.filter(d => !d.xac_nhan_het
    && (d.dem_goi ? (d.so_goi_dem ?? 0) === 0 : (d.so_kg_dem ?? 0) === 0));
}

/** "Đã cộng 12 nhãn: 5 gói Thăn ngoại, 7 gói Nạc vai." (các món có trong lượt này). */
export function cauDaCong(soNhan: number, daCo: boolean): string {
  if (daCo) return 'Lượt quét này đã được cộng từ trước — không cộng thêm lần nữa.';
  if (soNhan === 0) return 'Chưa cộng được nhãn nào.';
  return `Đã cộng ${soNhan} nhãn vào số đếm.`;
}

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export interface PhieuDemQuay {
  id: string;
  so_phieu: string;
  vi_tri_id: string;
  kieu: 'theo_mat_hang' | 'theo_lo';
  trang_thai: 'dang_dem' | 'cho_duyet' | 'da_duyet' | 'da_huy';
  phien_ban: number;
  ngay_kiem: string;
  gui_luc: string | null;
  /** Lý do quản lý trả về để đếm lại. */
  ly_do: string | null;
  so_nhan_quet: number;
}

/**
 * Phiếu của một quầy: phiếu đang mở (đang đếm / chờ duyệt — mỗi vị trí chỉ
 * một) và phiếu đã duyệt gần nhất (để báo "hôm nay đã đếm").
 */
export async function docPhieuQuay(
  client: SupabaseClient, chiNhanhId: string, viTriId: string,
): Promise<{ mo: PhieuDemQuay | null; daDuyet: PhieuDemQuay | null }> {
  const { data, error } = await client
    .from('kho_v_kiem_ke')
    .select('id, so_phieu, vi_tri_id, kieu, trang_thai, phien_ban, ngay_kiem, gui_luc, ly_do, so_nhan_quet')
    .eq('chi_nhanh_id', chiNhanhId).eq('vi_tri_id', viTriId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  const ds = (data ?? []).map(p => ({ ...p, so_nhan_quet: Number(p.so_nhan_quet ?? 0) })) as PhieuDemQuay[];
  return {
    mo: ds.find(p => p.trang_thai === 'dang_dem' || p.trang_thai === 'cho_duyet') ?? null,
    daDuyet: ds.find(p => p.trang_thai === 'da_duyet') ?? null,
  };
}

/**
 * Danh sách chạy của phiếu (sau khi chuyển hướng): món vừa quét lên đầu.
 * Giống kho_kiem_ke_ds_quet của 0032 (hàm đó chỉ dùng nội bộ database).
 */
export async function docMonDaQuet(client: SupabaseClient, kiemKeId: string): Promise<MonDaQuet[]> {
  if (!laUuid(kiemKeId)) return [];
  const [dong, quet] = await Promise.all([
    client.from('kho_kiem_ke_dong')
      .select('mat_hang_id, lo_id, thu_tu, so_goi_dem, so_kg_dem, so_goi_them, tu_quet')
      .eq('kiem_ke_id', kiemKeId).order('thu_tu'),
    client.from('kho_kiem_ke_quet')
      .select('mat_hang_id, created_at')
      .eq('kiem_ke_id', kiemKeId).limit(5000),
  ]);
  if (dong.error) throw dong.error;
  if (quet.error) throw quet.error;
  const nhan = new Map<string, { n: number; cuoi: string }>();
  for (const q of quet.data ?? []) {
    const cu = nhan.get(q.mat_hang_id) ?? { n: 0, cuoi: '' };
    cu.n += 1;
    if (q.created_at > cu.cuoi) cu.cuoi = q.created_at;
    nhan.set(q.mat_hang_id, cu);
  }
  const co = (dong.data ?? []).filter(d => !d.lo_id && (d.tu_quet || (d.so_goi_them ?? 0) > 0));
  if (co.length === 0) return [];
  const mh = await docTenMon(client, co.map(d => d.mat_hang_id));
  return co
    .map(d => ({ d, x: nhan.get(d.mat_hang_id) }))
    .sort((a, b) => (b.x?.cuoi ?? '').localeCompare(a.x?.cuoi ?? '') || a.d.thu_tu - b.d.thu_tu)
    .map(({ d, x }) => {
      const m = mh.get(d.mat_hang_id);
      return {
        mat_hang_id: d.mat_hang_id,
        ten: m?.ten ?? '—',
        dem_goi: m?.dem_goi ?? true,
        don_vi_goi: m?.don_vi_goi ?? 'gói',
        so_nhan: x?.n ?? 0,
        so_goi_them: Number(d.so_goi_them ?? 0),
        so_goi_dem: soHoacNull(d.so_goi_dem),
        so_kg_dem: soHoacNull(d.so_kg_dem),
      };
    });
}

/** Mọi dòng của phiếu, kèm tên món — cho màn "Quét xong". */
export async function docDongDemQuay(client: SupabaseClient, kiemKeId: string): Promise<DongDemQuay[]> {
  if (!laUuid(kiemKeId)) return [];
  const { data, error } = await client
    .from('kho_kiem_ke_dong')
    .select('mat_hang_id, lo_id, thu_tu, so_goi_dem, so_kg_dem, xac_nhan_het')
    .eq('kiem_ke_id', kiemKeId).order('thu_tu');
  if (error) throw error;
  const ds = (data ?? []).filter(d => !d.lo_id);
  const mh = await docTenMon(client, ds.map(d => d.mat_hang_id));
  return ds.map(d => ({
    mat_hang_id: d.mat_hang_id,
    ten: mh.get(d.mat_hang_id)?.ten ?? '—',
    dem_goi: mh.get(d.mat_hang_id)?.dem_goi ?? true,
    so_goi_dem: soHoacNull(d.so_goi_dem),
    so_kg_dem: soHoacNull(d.so_kg_dem),
    xac_nhan_het: !!d.xac_nhan_het,
  }));
}

/** Tên, cách đếm của các món — chỉ cột không có tiền. */
async function docTenMon(
  client: SupabaseClient, ids: string[],
): Promise<Map<string, { ten: string; dem_goi: boolean; don_vi_goi: string }>> {
  const ds = [...new Set(ids.filter(laUuid))];
  const ra = new Map<string, { ten: string; dem_goi: boolean; don_vi_goi: string }>();
  if (ds.length === 0) return ra;
  const { data, error } = await client
    .from('kho_mat_hang')
    .select('id, ten, dem_goi, don_vi_goi')
    .in('id', ds);
  if (error) throw error;
  for (const m of data ?? []) ra.set(m.id, { ten: m.ten, dem_goi: m.dem_goi, don_vi_goi: m.don_vi_goi });
  return ra;
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
export interface KetQuaLuot extends KetQua {
  soNhan?: number;
  /** Câu vàng cho các nhãn không cộng được (đã gom theo lỗi). */
  loiNhan?: string[];
}

interface TraVeQuet { da_co?: boolean; so_nhan?: number; loi?: { ma: string; loi: string }[] }

/** Một lượt quét: gửi mọi mã trong ô quét, cộng vào phiếu. */
export async function quetMotLuot(
  client: SupabaseClient, kiemKeId: string, maGui: string, noiDung: string,
): Promise<KetQuaLuot> {
  if (!laUuid(kiemKeId) || !laUuid(maGui)) return { ok: false, cau: 'Trang đã cũ — tải lại trang rồi quét lại.' };
  const ma = maTuO(noiDung);
  if (ma.length === 0) return { ok: false, cau: 'Ô quét đang trống — chưa đọc nhãn nào.' };
  if (ma.length > TOI_DA_MOT_LUOT) {
    return { ok: false, cau: `Một lần gửi tối đa ${TOI_DA_MOT_LUOT} nhãn — đang có ${ma.length}. Xóa bớt, gửi, rồi quét tiếp.` };
  }
  const { data, error } = await client.rpc('kho_quet_kiem_ke', { p_id: kiemKeId, p_ma_gui: maGui, p_ma: ma });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (data ?? {}) as TraVeQuet;
  const soNhan = Number(kq.so_nhan ?? 0);
  return { ok: soNhan > 0 || !!kq.da_co, cau: cauDaCong(soNhan, !!kq.da_co), soNhan, loiNhan: cauLoiNhan(kq.loi ?? []) };
}

/** "Bỏ lượt vừa quét" (cach = lan_cuoi) hoặc "−1" một gói của một món (bot_mot). */
export async function suaQuet(
  client: SupabaseClient, kiemKeId: string, maGui: string, cach: 'lan_cuoi' | 'bot_mot', matHangId: string | null,
): Promise<KetQua> {
  if (!laUuid(kiemKeId) || !laUuid(maGui)) return { ok: false, cau: 'Trang đã cũ — tải lại trang.' };
  if (cach === 'bot_mot' && !laUuid(matHangId)) return { ok: false, cau: 'Chưa chọn món.' };
  const { data, error } = await client.rpc('kho_bo_quet_kiem_ke', {
    p_id: kiemKeId, p_ma_gui: maGui, p_cach: cach, p_mat_hang_id: cach === 'bot_mot' ? matHangId : null,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (data ?? {}) as TraVeQuet;
  if (kq.da_co) return { ok: true, cau: 'Đã sửa từ trước — không sửa thêm lần nữa.' };
  const n = Number(kq.so_nhan ?? 0);
  return { ok: true, cau: cach === 'lan_cuoi' ? `Đã bỏ lượt vừa quét (${n} nhãn).` : 'Đã bớt 1 gói.' };
}

/**
 * "Đúng, đã bán hết — gửi quản lý": món không thấy gói nào = 0 (xác nhận hết),
 * rồi gửi phiếu. Phiếu đã có đủ số thì chỉ gửi.
 */
export async function hetHangVaGui(
  client: SupabaseClient, kiemKeId: string, phienBan: number, conMonKhongThay: boolean,
): Promise<KetQua> {
  if (!laUuid(kiemKeId)) return { ok: false, cau: 'Trang đã cũ — tải lại trang.' };
  let pb = phienBan;
  if (conMonKhongThay) {
    const { data, error } = await client.rpc('kho_het_hang_con_lai', { p_id: kiemKeId, p_phien_ban: phienBan });
    if (error) return { ok: false, cau: cauLoiKho(error) };
    pb = Number((data as { phien_ban?: number } | null)?.phien_ban ?? phienBan);
  }
  const { error } = await client.rpc('kho_gui_kiem_ke', { p_id: kiemKeId, p_phien_ban: pb });
  if (error) {
    return { ok: false, cau: conMonKhongThay
      ? `Đã ghi các món đó là bán hết nhưng CHƯA gửi được: ${cauLoiKho(error)}`
      : `Chưa gửi được: ${cauLoiKho(error)}` };
  }
  return { ok: true, cau: 'Đã gửi quản lý. Cảm ơn!' };
}
