/**
 * KHO — KIỂM KÊ
 *
 * Đếm một vị trí (quầy cuối ngày, kho lạnh), gửi quản lý duyệt. Duyệt thì
 * database ghi phần chênh so với sổ lúc gửi (kho_duyet_kiem_ke, 0023):
 * quầy đếm theo mặt hàng được DỰNG LẠI TỒN — lô mới nhất giữ lại, phần thiếu
 * ghi là bán (khi chưa nối iPOS).
 *
 * ĐẾM MÙ: lúc đang đếm, trang KHÔNG hiện số trên sổ — người đếm ghi đúng cái
 * mình thấy. Sổ và chênh lệch hiện khi phiếu đã gửi.
 *
 * FORM: k{i}_mh / k{i}_lo (ẩn), k{i}_goi, k{i}_kg, k{i}_het ("co"),
 * k{i}_goc (ẩn — số của dòng lúc mở trang, xem "HAI NGƯỜI CÙNG ĐẾM").
 * Thêm mặt hàng tìm thấy ngoài danh sách: them_mat_hang, them_goi, them_kg.
 *
 * TÍCH "ĐÃ HẾT THẬT" MÀ ĐỂ TRỐNG Ô = ĐẾM ĐƯỢC 0. Một lần chạm là đủ — trước
 * đây phải gõ 0 VÀ tích, quên một trong hai là bị báo "Chưa đếm".
 *
 * HAI NGƯỜI CÙNG ĐẾM MỘT PHIẾU: lưu là ghi lại TOÀN BỘ dòng (0023), nên máy
 * gửi sau bị chặn bằng phien_ban. Khi bị chặn, trang đọc lại số mới nhất rồi
 * gộp (gopKhiTrung): dòng mình không đụng tới lấy số mới; dòng mình vừa sửa
 * thì giữ (chưa lưu) — nhờ k{i}_goc biết dòng nào mình đã sửa. Không bao giờ
 * hiện lại số cũ kèm phien_ban mới: bấm Lưu lần hai sẽ xóa số của người kia.
 *
 * Hai thứ tiếng: lỗi nhập có loiEn song song với loi, tóm tắt quét có tomTatEn,
 * câu báo có cauEn. Câu database trả về (duyệt, trả về…) thì trang tra
 * dichCau lúc hiện.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, dinhDangKg, docKg, docSoNguyen, docTungTrang, kqHai, laUuid, type HaiThuTieng, type KetQua, type NgonNguNB } from './chung.ts';
import { gomTheoMaCan, tachDanhSachMa } from './ma-vach.ts';
import { apDungTim, type TimDs } from './tim-ds.ts';

export interface KiemKeTom {
  id: string;
  so_phieu: string;
  vi_tri_id: string;
  ten_vi_tri: string;
  loai_vi_tri: string;
  kieu: 'theo_mat_hang' | 'theo_lo';
  ngay_kiem: string;
  trang_thai: 'dang_dem' | 'cho_duyet' | 'da_duyet' | 'da_huy';
  so_dong: number;
  so_dong_da_dem: number;
  /** Lý do quản lý trả về (hoặc lý do hủy) — hiện ngay trên thẻ vị trí. */
  ly_do: string | null;
  nguoi_tao: string | null;
  created_at: string;
}

export interface KiemKe extends KiemKeTom {
  chi_nhanh_id: string;
  phien_ban: number;
  nguon_so_ban: 'kiem_ke' | 'ipos';
  ghi_chu: string | null;
  nguoi_gui: string | null;
  gui_luc: string | null;
  nguoi_duyet: string | null;
  duyet_luc: string | null;
  /** Số nhãn đã quét cộng dồn ở màn Đếm quầy (0032). 0 = chưa quét nhãn nào. */
  so_nhan_quet: number;
}

export interface DongKiemKe {
  id: string;
  thu_tu: number;
  mat_hang_id: string;
  lo_id: string | null;
  so_goi_dem: number | null;
  so_kg_dem: number | null;
  xac_nhan_het: boolean;
  so_goi_so: number | null;
  so_kg_so: number | null;
  /** 0032: gói gõ tay THÊM ngoài số nhãn đã quét; tu_quet = số của dòng tính từ nhãn. */
  so_goi_them: number;
  tu_quet: boolean;
}

export interface LoKiemKe {
  kiem_ke_dong_id: string;
  lo_id: string;
  so_goi_so: number;
  so_kg_so: number;
  so_goi_moi: number | null;
  so_kg_moi: number | null;
}

const soHoacNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export async function docDanhSachKiemKe(
  client: SupabaseClient, chiNhanhId: string, trangThai: string | null,
  // Có tim: tìm / lọc ngày / của tôi / đọc đúng một trang (lib/kho/tim-ds.ts).
  tim?: { tim: TimDs; nhanSuId: string | null },
): Promise<KiemKeTom[]> {
  let q = client
    .from('kho_v_kiem_ke')
    .select('id, so_phieu, vi_tri_id, ten_vi_tri, loai_vi_tri, kieu, ngay_kiem, trang_thai, so_dong, so_dong_da_dem, ly_do, nguoi_tao, created_at')
    .eq('chi_nhanh_id', chiNhanhId)
    .order('created_at', { ascending: false });
  if (trangThai) q = q.eq('trang_thai', trangThai);
  q = tim
    ? apDungTim(q, tim.tim, { cotTim: ['so_phieu', 'ten_vi_tri'], cotNgay: 'ngay_kiem', nhanSuId: tim.nhanSuId })
    : q.limit(120);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as KiemKeTom[];
}

export async function demKiemKeCho(client: SupabaseClient, chiNhanhId: string): Promise<number | null> {
  const { count, error } = await client
    .from('kho_kiem_ke').select('id', { count: 'exact', head: true })
    .eq('chi_nhanh_id', chiNhanhId).eq('trang_thai', 'cho_duyet');
  return error ? null : (count ?? 0);
}

export async function docKiemKe(
  client: SupabaseClient, id: string,
): Promise<{ kk: KiemKe; dong: DongKiemKe[]; lo: LoKiemKe[] } | null> {
  if (!laUuid(id)) return null;
  const { data: kk, error } = await client
    .from('kho_v_kiem_ke')
    .select('id, chi_nhanh_id, so_phieu, phien_ban, vi_tri_id, ten_vi_tri, loai_vi_tri, kieu, nguon_so_ban, ngay_kiem, trang_thai, ghi_chu, ly_do, nguoi_tao, nguoi_gui, gui_luc, nguoi_duyet, duyet_luc, created_at, so_dong, so_dong_da_dem, so_nhan_quet')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  if (!kk) return null;

  const { data: dong, error: e1 } = await client
    .from('kho_kiem_ke_dong')
    .select('id, thu_tu, mat_hang_id, lo_id, so_goi_dem, so_kg_dem, xac_nhan_het, so_goi_so, so_kg_so, so_goi_them, tu_quet')
    .eq('kiem_ke_id', id).order('thu_tu');
  if (e1) throw e1;
  const ids = (dong ?? []).map(d => d.id);
  let lo: LoKiemKe[] = [];
  if (ids.length && kk.trang_thai !== 'dang_dem') {
    const { data, error: e2 } = await client
      .from('kho_kiem_ke_lo')
      .select('kiem_ke_dong_id, lo_id, so_goi_so, so_kg_so, so_goi_moi, so_kg_moi')
      .in('kiem_ke_dong_id', ids);
    if (e2) throw e2;
    lo = (data ?? []).map(l => ({
      ...l, so_kg_so: Number(l.so_kg_so), so_kg_moi: soHoacNull(l.so_kg_moi),
    })) as LoKiemKe[];
  }
  return {
    kk: { ...kk, so_nhan_quet: Number(kk.so_nhan_quet ?? 0) } as KiemKe,
    dong: (dong ?? []).map(d => ({
      ...d, so_kg_dem: soHoacNull(d.so_kg_dem), so_kg_so: soHoacNull(d.so_kg_so),
      so_goi_them: Number(d.so_goi_them ?? 0), tu_quet: !!d.tu_quet,
    })) as DongKiemKe[],
    lo,
  };
}

/**
 * Số nhãn đã quét cộng dồn của từng món (màn Đếm quầy, 0032). Chỉ đọc khi
 * phiếu có nhãn (so_nhan_quet > 0). Lỗi đọc thì trả Map rỗng — chỉ để hiển thị.
 */
export async function docSoNhanQuet(client: SupabaseClient, kiemKeId: string): Promise<Map<string, number>> {
  const ra = new Map<string, number>();
  if (!laUuid(kiemKeId)) return ra;
  let data: { mat_hang_id: string }[];
  try {
    data = await docTungTrang((tu, den) => client
      .from('kho_kiem_ke_quet')
      .select('mat_hang_id', { count: 'exact' })
      .eq('kiem_ke_id', kiemKeId)
      .order('thu_tu')
      .range(tu, den));
  } catch {
    return ra;
  }
  for (const q of data) ra.set(q.mat_hang_id, (ra.get(q.mat_hang_id) ?? 0) + 1);
  return ra;
}

// -----------------------------------------------------------------------------
// FORM → DỮ LIỆU (hàm thuần)
// -----------------------------------------------------------------------------
/** Cách đếm hợp với vị trí: quầy đếm gói theo món, kho lạnh đếm từng lô (tảng). */
export function kieuTheoViTri(loaiViTri: string): 'theo_mat_hang' | 'theo_lo' {
  return loaiViTri === 'quay' ? 'theo_mat_hang' : 'theo_lo';
}

export interface DongDemForm {
  mat_hang_id: string;
  lo_id: string;
  goi: string;
  kg: string;
  het: boolean;
  /**
   * Số của dòng này trong database lúc mở trang (chuKyDong), đi kèm trong ô
   * ẩn k{i}_goc. null / không có = dòng mới thêm trên máy này (quét, thêm tay).
   */
  goc?: string | null;
}

/** Khóa của một dòng: mặt hàng + lô (đếm theo mặt hàng thì lô rỗng). */
export function khoaDong(d: { mat_hang_id: string; lo_id: string }): string {
  return `${d.mat_hang_id}|${d.lo_id}`;
}

/** "Chữ ký" số đếm của một dòng, để biết dòng đã bị sửa chưa. Kg "1.5" hay "1,5" là một. */
export function chuKyDong(d: { goi: string; kg: string; het: boolean }): string {
  return [d.goi.trim(), d.kg.trim().replace('.', ','), d.het ? '1' : '0'].join('|');
}

/** Dòng đã có số đếm chưa — tích "Đã hết thật" cũng là đã đếm (= 0). Giống so_dong_da_dem của 0023. */
export function daDemDong(d: { goi: string; kg: string; het: boolean }, demGoi: boolean): boolean {
  return d.het || (demGoi ? d.goi.trim() !== '' : d.kg.trim() !== '');
}

export function dongDemTuDb(ds: DongKiemKe[]): DongDemForm[] {
  return ds.map(d => {
    const f: DongDemForm = {
      mat_hang_id: d.mat_hang_id,
      lo_id: d.lo_id ?? '',
      goi: d.so_goi_dem === null ? '' : String(d.so_goi_dem),
      kg: d.so_kg_dem === null ? '' : String(d.so_kg_dem).replace('.', ','),
      het: d.xac_nhan_het,
    };
    f.goc = chuKyDong(f);
    return f;
  });
}

export function docFormKiemKe(
  form: FormData,
  matHang: { id: string; ten: string; dem_goi: boolean }[],
): { dong: DongDemForm[]; loi: string[]; loiEn: string[]; payload: Record<string, unknown>[] } {
  const dong: DongDemForm[] = [];
  const soDong = docSoNguyen(form.get('so_dong'), 0, 2000) ?? 0;
  for (let i = 0; i < (Number.isNaN(soDong) ? 0 : soDong); i++) {
    const g = (ten: string) => String(form.get(`k${i}_${ten}`) ?? '').trim();
    const goc = form.get(`k${i}_goc`);
    dong.push({
      mat_hang_id: g('mh'), lo_id: g('lo'), goi: g('goi'), kg: g('kg'), het: form.get(`k${i}_het`) === 'co',
      goc: typeof goc === 'string' ? goc : null,
    });
  }
  const them = String(form.get('them_mat_hang') ?? '').trim();
  if (laUuid(them)) {
    const co = dong.find(d => d.mat_hang_id === them && !d.lo_id);
    const moi: DongDemForm = { mat_hang_id: them, lo_id: '', goi: String(form.get('them_goi') ?? '').trim(), kg: String(form.get('them_kg') ?? '').trim(), het: false, goc: null };
    if (co) {
      co.goi = moi.goi || co.goi; co.kg = moi.kg || co.kg;
      if (moi.goi || moi.kg) co.het = false;   // vừa thấy hàng thì không còn "đã hết"
    } else dong.push(moi);
  }
  return { dong, ...payloadTuDong(dong, matHang) };
}

/** Dòng đang hiện trên form → p_dong của kho_luu_kiem_ke, kèm lỗi gõ sai (loi / loiEn song song). */
export function payloadTuDong(
  dong: DongDemForm[],
  matHang: { id: string; ten: string; dem_goi: boolean }[],
): { loi: string[]; loiEn: string[]; payload: Record<string, unknown>[] } {
  const loi: string[] = [];
  const loiEn: string[] = [];
  const bao = (c: HaiThuTieng) => { loi.push(c.vi); loiEn.push(c.en); };
  const mh = new Map(matHang.map(m => [m.id, m]));
  const payload: Record<string, unknown>[] = [];
  for (const d of dong) {
    const m = mh.get(d.mat_hang_id);
    if (!m) { bao({ vi: 'Một dòng không hợp lệ — tải lại trang', en: 'A line is not valid — reload the page' }); continue; }
    const nhan = `"${m.ten}"`;
    const goi = docSoNguyen(d.goi, 0, 100000);
    const kg = docKg(d.kg);
    if (Number.isNaN(goi)) {
      bao({ vi: `${nhan}: số ${m.dem_goi ? 'gói' : 'đếm'} là số nguyên`,
            en: `${nhan}: the ${m.dem_goi ? 'pack count' : 'count'} must be a whole number` });
    }
    if (Number.isNaN(kg)) bao({ vi: `${nhan}: số kg chưa đúng (ví dụ 1,25)`, en: `${nhan}: the kg is not right (for example 1.25)` });
    const p: Record<string, unknown> = { mat_hang_id: d.mat_hang_id, xac_nhan_het: d.het };
    if (laUuid(d.lo_id)) p.lo_id = d.lo_id;
    if (goi !== null && !Number.isNaN(goi)) p.so_goi_dem = goi;
    if (kg !== null && !Number.isNaN(kg)) p.so_kg_dem = kg;
    // Tích "Đã hết thật", ô để trống = đếm được 0 (một lần chạm là đủ).
    // Tích mà vẫn ghi số > 0 thì không đoán người đếm muốn bên nào.
    if (d.het) {
      const conHang = (typeof p.so_goi_dem === 'number' && p.so_goi_dem > 0)
        || (typeof p.so_kg_dem === 'number' && p.so_kg_dem > 0);
      if (conHang) {
        bao({ vi: `${nhan}: đã tích "Đã hết thật" mà vẫn ghi số — bỏ tích, hoặc xóa số`,
              en: `${nhan}: "None left" is ticked but a number is entered — untick it, or clear the number` });
      }
      else if (m.dem_goi) { if (goi === null) p.so_goi_dem = 0; }
      else if (kg === null) p.so_kg_dem = 0;
    }
    payload.push(p);
  }
  return { loi, loiEn, payload };
}

export interface KetQuaQuetKiemKe {
  dong: DongDemForm[];
  /** Câu cho nhân viên bằng chữ thường ngày — không có mã số, không bảo vào "Cài đặt". */
  loi: string[];
  /** Các câu đó bằng tiếng Anh, cùng thứ tự. */
  loiEn: string[];
  /** Tổng số mã trong ô quét. */
  soMa: number;
  /** Số mặt hàng được ghi số từ lần quét này. */
  soHang: number;
  /** Số nhãn đã thành số đếm. */
  soDoc: number;
  /** Nhãn không đọc được: mã hỏng, sai số kiểm tra, không phải nhãn cân. */
  soNhanHong: number;
  /** Gói đọc được mã nhưng mã cân chưa gắn với món nào. */
  soGoiLa: number;
  /** "5 gói Thăn ngoại (1,52 kg), 7 gói Nạc vai (2,1 kg)" — cho câu báo xanh. */
  tomTat: string;
  /** Câu đó cho màn tiếng Anh (số kiểu 1.52, "and 2 more items"). */
  tomTatEn: string;
}

/**
 * Câu vàng cho nhãn không đọc được và gói lạ. Tách riêng để trang dựng lại
 * được sau khi chuyển hướng (chỉ cần hai con số trên đường dẫn).
 * Quét ĐÈ số của món (xem apDungQuet), nên không bảo "quét lại gói đó" —
 * quét lại mỗi một gói thì món đó chỉ còn 1 gói.
 */
export function cauQuetLoi(soNhanHong: number, soGoiLa: number, nn: NgonNguNB = 'vi'): string[] {
  const ra: string[] = [];
  const n = soNhanHong, g = soGoiLa;
  if (n > 0) {
    ra.push({
      vi: `${n} nhãn không đọc được — ${n > 1 ? 'các gói đó' : 'gói đó'} chưa được đếm. Quét lại một lượt tất cả gói của món đó (nhãn hỏng hẳn thì gõ tay số gói và xóa ô Kg của món đó).`,
      en: `${n} ${n === 1 ? 'label' : 'labels'} could not be read — ${n > 1 ? 'those packs were' : 'that pack was'} not counted. Scan all packs of that item again in one go (if a label is badly damaged, type the number of packs by hand and clear the Kg box for that item).`,
    }[nn]);
  }
  if (g > 0) {
    ra.push({
      vi: `${g} gói không nhận ra là món gì — chưa được đếm. Để riêng, báo quản lý.`,
      en: `${g} ${g === 1 ? 'pack was' : 'packs were'} not recognised as any item — not counted. Set ${g === 1 ? 'it' : 'them'} aside and tell the manager.`,
    }[nn]);
  }
  return ra;
}

/**
 * Quét hết các gói ở vị trí → số gói và tổng kg theo mặt hàng, ĐÈ lên số
 * đang ghi của mặt hàng đó (quét là đếm lại từ đầu, không cộng dồn).
 */
export function apDungQuet(
  dong: DongDemForm[],
  noiDung: string,
  matHang: { id: string; ten: string; ma_can: string | null; dang_dung: boolean; dem_goi?: boolean; don_vi_goi?: string | null }[],
  mau?: string | null,
  soLeKg = 3,
): KetQuaQuetKiemKe {
  const ds = tachDanhSachMa(noiDung);
  const gom = gomTheoMaCan(ds, mau || undefined, soLeKg);
  const theoCan = new Map(matHang.filter(m => m.dang_dung && m.ma_can).map(m => [m.ma_can!, m]));
  const ra = dong.map(d => ({ ...d }));
  const tom: string[] = [];
  const tomEn: string[] = [];
  let soHang = 0;
  let soDoc = 0;
  let soGoiLa = 0;
  for (const [maCan, g] of gom.theoMa) {
    const m = theoCan.get(maCan);
    if (!m) { soGoiLa += g.soGoi; continue; }
    soHang += 1;
    soDoc += g.soGoi;
    const kg = g.soKg > 0 ? String(g.soKg).replace('.', ',') : '';
    const co = ra.find(d => d.mat_hang_id === m.id && !d.lo_id);
    // Quét thấy gói thì món này còn hàng — bỏ tích "Đã hết thật" lỡ tích từ trước.
    if (co) { co.goi = String(g.soGoi); co.kg = kg; co.het = false; }
    else ra.push({ mat_hang_id: m.id, lo_id: '', goi: String(g.soGoi), kg, het: false, goc: null });
    for (const nn of ['vi', 'en'] as const) {
      (nn === 'vi' ? tom : tomEn).push(m.dem_goi === false
        ? `${dinhDangKg(g.soKg, nn)} kg ${m.ten}`
        : `${g.soGoi} ${m.don_vi_goi || GOI_MAC_DINH[nn]} ${m.ten}${g.soKg > 0 ? ` (${dinhDangKg(g.soKg, nn)} kg)` : ''}`);
    }
  }
  const conLai = tom.length - 3;
  const nhieu: HaiThuTieng = {
    vi: `${tom.slice(0, 3).join(', ')} và ${conLai} món khác`,
    en: `${tomEn.slice(0, 3).join(', ')} and ${conLai} more ${conLai === 1 ? 'item' : 'items'}`,
  };
  const tomTat = tom.length <= 3 ? tom.join(', ') : nhieu.vi;
  const tomTatEn = tomEn.length <= 3 ? tomEn.join(', ') : nhieu.en;
  const soNhanHong = gom.loi.length;
  return {
    dong: ra, loi: cauQuetLoi(soNhanHong, soGoiLa), loiEn: cauQuetLoi(soNhanHong, soGoiLa, 'en'),
    soMa: ds.length, soHang, soDoc, soNhanHong, soGoiLa, tomTat, tomTatEn,
  };
}

/** Đơn vị gói mặc định của cột kho_mat_hang.don_vi_goi (0019) — khi món không mang đơn vị. */
const GOI_MAC_DINH: HaiThuTieng = { vi: 'gói', en: 'packs' };

/** Đoạn câu database khi phien_ban lệch ("Phiếu đã được sửa ở máy khác. Tải lại trang…"). */
const MAY_KHAC = { vi: 'sửa ở máy khác', en: 'changed on another device' } satisfies HaiThuTieng;

/** Lỗi "phiếu đã được sửa ở máy khác" của kho_luu_kiem_ke / kho_gui_kiem_ke (phien_ban lệch). */
export function laLoiMayKhac(cau: string): boolean {
  return new RegExp(MAY_KHAC.vi, 'i').test(cau);
}

/**
 * Máy khác vừa lưu phiếu (phien_ban đã tăng) trong lúc mình đang đếm. Gộp số
 * mình vừa gửi (cuaToi — mỗi dòng mang goc = số lúc mình mở trang) với số mới
 * nhất trong database (moiNhat — từ dongDemTuDb):
 *   · dòng mình không sửa           → lấy số mới nhất;
 *   · dòng mình sửa, máy kia không  → giữ số của mình (CHƯA lưu);
 *   · cả hai cùng sửa, khác nhau    → lấy số của máy kia, báo tên dòng;
 *   · dòng mình thêm (quét, thêm tay) mà database chưa có → giữ.
 * Dòng trả về mang goc = số mới nhất, để lần lưu sau so với đúng bản mới.
 */
export function gopKhiTrung(
  cuaToi: DongDemForm[],
  moiNhat: DongDemForm[],
): { dong: DongDemForm[]; giu: number; trung: DongDemForm[] } {
  const TRONG = chuKyDong({ goi: '', kg: '', het: false });
  const toiSua = (d: DongDemForm) => chuKyDong(d) !== (d.goc ?? TRONG);
  const cua = new Map(cuaToi.map(d => [khoaDong(d), d]));
  const dong: DongDemForm[] = [];
  const trung: DongDemForm[] = [];
  let giu = 0;
  for (const f of moiNhat) {
    const khoa = khoaDong(f);
    const m = cua.get(khoa);
    cua.delete(khoa);
    const moi = chuKyDong(f);
    if (!m || !toiSua(m)) { dong.push({ ...f, goc: moi }); continue; }
    const hoSua = moi !== (m.goc ?? TRONG);
    if (!hoSua) { dong.push({ ...m, goc: moi }); giu += 1; continue; }
    if (moi === chuKyDong(m)) { dong.push({ ...f, goc: moi }); continue; }   // hai máy ghi giống nhau
    dong.push({ ...f, goc: moi });
    trung.push(f);
  }
  for (const m of cua.values()) {
    if (toiSua(m)) { dong.push({ ...m, goc: null }); giu += 1; }
  }
  return { dong, giu, trung };
}

// -----------------------------------------------------------------------------
// GHI
// -----------------------------------------------------------------------------
export async function batDauKiemKe(
  client: SupabaseClient, chiNhanhId: string, viTriId: string, kieu: string, maGui: string,
): Promise<KetQua & { id?: string }> {
  if (!laUuid(viTriId)) return kqHai(false, CAU_KK.chonViTri);
  if (!laUuid(maGui)) return kqHai(false, CAU_KK.formCu);
  const { data, error } = await client.rpc('kho_bat_dau_kiem_ke', {
    p_chi_nhanh_id: chiNhanhId, p_vi_tri_id: viTriId, p_kieu: kieu, p_ma_gui: maGui,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ...kqHai(true, CAU_KK.daMo), id: String(data) };
}

export async function luuKiemKe(
  client: SupabaseClient, id: string, phienBan: number, ghiChu: string | null, payload: Record<string, unknown>[],
): Promise<KetQua & { phienBan?: number }> {
  const { data, error } = await client.rpc('kho_luu_kiem_ke', {
    p_id: id, p_phien_ban: phienBan, p_ghi_chu: ghiChu, p_dong: payload,
  });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return { ...kqHai(true, CAU_KK.daLuu), phienBan: Number(data) };
}

/** Câu database (màn tiếng Anh tra dichCau lúc hiện); database không trả câu nào thì "Xong.". */
async function cauTraVe(ham: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<KetQua> {
  const { data, error } = await ham;
  if (error) return { ok: false, cau: cauLoiKho(error) };
  return data === null || data === undefined ? kqHai(true, CAU_KK.xong) : { ok: true, cau: String(data) };
}

export async function guiKiemKe(client: SupabaseClient, id: string, phienBan: number): Promise<KetQua> {
  const kq = await cauTraVe(client.rpc('kho_gui_kiem_ke', { p_id: id, p_phien_ban: phienBan }));
  if (kq.ok) return kq;
  // Câu "Chưa đếm: <món> — đếm hết (không còn thì ghi 0) rồi gửi" của 0023 bảo
  // "ghi 0" — nay chỉ cần tích "Đã hết thật". Đổi đuôi câu, dựng luôn bản tiếng Anh.
  const { dau, duoiDb, duoiMoi, ghi0, tich } = CHUA_DEM;
  if (kq.cau.startsWith(dau.vi) && kq.cau.endsWith(duoiDb.vi)) {
    const mon = kq.cau.slice(dau.vi.length, kq.cau.length - duoiDb.vi.length);
    return kqHai(false, { vi: dau.vi + mon + duoiMoi.vi, en: dau.en + mon + duoiMoi.en });
  }
  // Câu khác dạng (chưa có): đổi chữ như trước, bản tiếng Anh tra dichCau lúc hiện.
  return { ok: false, cau: kq.cau.replace(ghi0.vi, tich.vi) };
}

const CHUA_DEM = {
  dau: { vi: 'Chưa đếm: ', en: 'Not counted yet: ' },
  duoiDb: { vi: ' — đếm hết (không còn thì ghi 0) rồi gửi', en: ' — count everything (if none are left, enter 0), then send' },
  duoiMoi: { vi: ' — đếm hết (không còn gì thì tích "Đã hết thật") rồi gửi', en: ' — count everything (if none are left, tick "None left"), then send' },
  ghi0: { vi: 'không còn thì ghi 0', en: 'if none are left, enter 0' },
  tich: { vi: 'không còn gì thì tích "Đã hết thật"', en: 'if none are left, tick "None left"' },
} satisfies Record<string, HaiThuTieng>;

const CAU_KK = {
  chonViTri: { vi: 'Chọn vị trí cần kiểm kê.', en: 'Choose the location to count.' },
  formCu: { vi: 'Form đã cũ — tải lại trang.', en: 'This form is out of date — reload the page.' },
  daMo: {
    vi: 'Đã mở phiếu kiểm kê. Đếm từng mặt hàng rồi bấm "Gửi quản lý duyệt".',
    en: 'Stocktake sheet opened. Count each item, then press "Send to manager for approval".',
  },
  daLuu: { vi: 'Đã lưu số đếm.', en: 'Counts saved.' },
  xong: { vi: 'Xong.', en: 'Done.' },
  chuaHuy: {
    vi: 'Chưa hủy: ghi lý do hủy trước (vd. "mở nhầm vị trí"), rồi bấm lại.',
    en: 'Not cancelled: write a reason first (e.g. "opened the wrong location"), then press again.',
  },
} satisfies Record<string, HaiThuTieng>;
export function duyetKiemKe(client: SupabaseClient, id: string) {
  return cauTraVe(client.rpc('kho_duyet_kiem_ke', { p_id: id }));
}
export function tuChoiKiemKe(client: SupabaseClient, id: string, lyDo: string) {
  return cauTraVe(client.rpc('kho_tu_choi_kiem_ke', { p_id: id, p_ly_do: lyDo }));
}
/**
 * Hủy phiếu = bỏ hết số đã đếm. Bắt buộc ghi lý do — đó là bước xác nhận thứ
 * hai, để một lần bấm nhầm không làm mất cả buổi đếm.
 */
export async function huyKiemKe(client: SupabaseClient, id: string, lyDo: string | null): Promise<KetQua> {
  if (!lyDo?.trim()) return kqHai(false, CAU_KK.chuaHuy);
  return cauTraVe(client.rpc('kho_huy_kiem_ke', { p_id: id, p_ly_do: lyDo }));
}
