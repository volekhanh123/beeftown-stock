/**
 * KHO — THẺ KHO VÀ QUÉT ĐẦY ĐỦ (GĐ5c, migration 0033)
 *
 * Thẻ kho của một món: kho_the_kho(chi nhánh, món, vị trí, từ, đến) — dòng
 * đầu "Tồn đầu kỳ", rồi từng lần nhập / xuất theo thời gian, cột tồn cộng dồn.
 * KHÔNG có tiền: thủ kho, NV quầy đọc được (quyền `xem`). Không chọn vị trí =
 * cả chi nhánh, kể cả hàng đang mang ra quầy và hàng chờ hủy — nên tồn cuối kỳ
 * luôn bằng tổng tồn của món ở trang Tồn kho.
 *
 * Màn Quét: "Thêm vào phiên pha đang mở" gọi kho_quet_phien_pha với đúng một
 * nhãn — mỗi lần bấm có ma_gui riêng, bấm hai lần không cộng đôi.
 *
 * Phần trên (đọc link, link chứng từ, tổng kỳ) là hàm thuần — test bằng node.
 *
 * Hai thứ tiếng: câu báo có cauEn / loiEn; tên khoảng ngày nhận thêm nn (mặc
 * định tiếng Việt như cũ). Tên việc và diễn giải dòng sổ là chữ database — trang
 * dịch bằng dichCau (bảng cau-kho-en.ts).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, docNgay, docTungTrang, kqHai, laUuid, type HaiThuTieng, type KetQua, type NgonNguNB } from './chung.ts';
import { dichCau } from '../cau-noi-bo.ts';

// -----------------------------------------------------------------------------
// HÀM THUẦN
// -----------------------------------------------------------------------------

export interface DongTheKho {
  ngay: string | null;
  /** 'dau_ky' cho dòng đầu, còn lại là loại sổ kho (nhap, chuyen_di…). */
  loai: string;
  ten_loai: string;
  so_chung_tu: string | null;
  chung_tu_loai: string | null;
  chung_tu_id: string | null;
  vi_tri: string | null;
  ma_lo: string | null;
  nhap_kg: number;
  xuat_kg: number;
  ton_kg: number;
  nhap_goi: number;
  xuat_goi: number;
  ton_goi: number;
  dien_giai: string | null;
  lo_id: string | null;
  vi_tri_id: string | null;
}

export interface BoLocTheKho {
  /** '' = cả chi nhánh. */
  viTri: string;
  tu: string;
  den: string;
  /** Có chữ sai trong link (ngày không có thật, từ sau đến…) — đã dùng mặc định. */
  loi: string | null;
  /** Câu đó bằng tiếng Anh (docBoLocTheKho luôn điền cùng loi). */
  loiEn?: string | null;
}

const LOI_LINK = {
  ngaySai: { vi: 'Ngày trong link không đúng — đang xem tháng này.', en: 'The date in the link is not valid — showing this month.' },
  tuSauDen: { vi: 'Từ ngày phải trước đến ngày — đang xem tháng này.', en: 'The start date must be before the end date — showing this month.' },
} satisfies Record<string, HaiThuTieng>;

/** Ngày đầu tháng của một ngày YYYY-MM-DD. */
export const dauThang = (iso: string) => `${iso.slice(0, 7)}-01`;

/**
 * Đọc ?vi_tri=&tu=&den= của trang thẻ kho. Mặc định: từ đầu tháng này tới hôm
 * nay. Ngày sai hoặc "từ" sau "đến" thì về mặc định và báo một câu.
 */
export function docBoLocTheKho(q: URLSearchParams, homNay: string): BoLocTheKho {
  const viTriLink = q.get('vi_tri') ?? '';
  const viTri = laUuid(viTriLink) ? viTriLink : '';
  const tuLink = docNgay(q.get('tu'));
  const denLink = docNgay(q.get('den'));
  if (tuLink === undefined || denLink === undefined) {
    return { viTri, tu: dauThang(homNay), den: homNay, loi: LOI_LINK.ngaySai.vi, loiEn: LOI_LINK.ngaySai.en };
  }
  let den = denLink && denLink < homNay ? denLink : homNay;
  let tu = tuLink || dauThang(den);
  let loi: string | null = null;
  let loiEn: string | null = null;
  if (tu > den) {
    loi = LOI_LINK.tuSauDen.vi;
    loiEn = LOI_LINK.tuSauDen.en;
    tu = dauThang(homNay); den = homNay;
  }
  return { viTri, tu, den, loi, loiEn };
}

/** Link trang thẻ kho của một món, giữ bộ lọc, đổi vài thứ trong `thay`. */
export function linkTheKho(
  matHangId: string, b: Partial<Pick<BoLocTheKho, 'viTri' | 'tu' | 'den'>> = {},
): string {
  const p = new URLSearchParams();
  if (b.viTri) p.set('vi_tri', b.viTri);
  if (b.tu) p.set('tu', b.tu);
  if (b.den) p.set('den', b.den);
  const s = p.toString();
  return `/noi-bo/kho/the-kho/${encodeURIComponent(matHangId)}${s ? `?${s}` : ''}`;
}

const TEN_KHOANG = {
  thangNay: { vi: 'Tháng này', en: 'This month' },
  thangTruoc: { vi: 'Tháng trước', en: 'Last month' },
  bayNgay: { vi: '7 ngày', en: '7 days' },
} satisfies Record<string, HaiThuTieng>;

/** Các khoảng ngày bấm nhanh: tháng này, tháng trước, 7 ngày. */
export function khoangNhanh(homNay: string, nn: NgonNguNB = 'vi'): { ten: string; tu: string; den: string }[] {
  const dau = dauThang(homNay);
  const d = new Date(dau + 'T00:00:00Z');
  d.setUTCDate(0);   // ngày cuối tháng trước
  const cuoiTruoc = d.toISOString().slice(0, 10);
  const bay = new Date(homNay + 'T00:00:00Z');
  bay.setUTCDate(bay.getUTCDate() - 6);
  return [
    { ten: TEN_KHOANG.thangNay[nn], tu: dau, den: homNay },
    { ten: TEN_KHOANG.thangTruoc[nn], tu: dauThang(cuoiTruoc), den: cuoiTruoc },
    { ten: TEN_KHOANG.bayNgay[nn], tu: bay.toISOString().slice(0, 10), den: homNay },
  ];
}

/**
 * Link mở chứng từ của một dòng thẻ kho — chỉ khi người xem mở được trang đó
 * (không thì null, trang hiện số phiếu dạng chữ). Phiếu nhập: vai xem giá mở
 * màn có tiền, thủ kho mở màn nhận hàng chỉ kg.
 */
export function linkChungTu(
  loai: string | null, id: string | null, duoc: (q: 'xem_gia' | 'nhap' | 'pha_loc' | 'xem') => boolean,
): string | null {
  if (!loai || !id) return null;
  const ma = encodeURIComponent(id);
  switch (loai) {
    case 'phieu_nhap':
      return duoc('xem_gia') ? `/noi-bo/kho/nhap/${ma}` : duoc('nhap') ? `/noi-bo/kho/nhan-hang/${ma}` : null;
    case 'phien_pha':
      return duoc('xem_gia') || duoc('pha_loc') ? `/noi-bo/kho/pha-loc/${ma}` : null;
    case 'phieu_xuat':
      return duoc('xem') ? `/noi-bo/kho/xuat/${ma}` : null;
    case 'kiem_ke':
      return duoc('xem') ? `/noi-bo/kho/kiem-ke/${ma}` : null;
    default:
      return null;
  }
}

/** Tổng trong kỳ: nhập, xuất, tồn đầu, tồn cuối (kg và gói). Cộng theo gram. */
export function tongKy(ds: DongTheKho[]): {
  dau_kg: number; dau_goi: number; nhap_kg: number; xuat_kg: number; nhap_goi: number; xuat_goi: number;
  cuoi_kg: number; cuoi_goi: number; so_dong: number;
} {
  const dau = ds.find(d => d.loai === 'dau_ky');
  const dong = ds.filter(d => d.loai !== 'dau_ky');
  const g = (f: (d: DongTheKho) => number) => Math.round(dong.reduce((s, d) => s + f(d) * 1000, 0)) / 1000;
  const cuoi = ds.at(-1);
  return {
    dau_kg: dau?.ton_kg ?? 0,
    dau_goi: dau?.ton_goi ?? 0,
    nhap_kg: g(d => d.nhap_kg),
    xuat_kg: g(d => d.xuat_kg),
    nhap_goi: dong.reduce((s, d) => s + d.nhap_goi, 0),
    xuat_goi: dong.reduce((s, d) => s + d.xuat_goi, 0),
    cuoi_kg: cuoi?.ton_kg ?? 0,
    cuoi_goi: cuoi?.ton_goi ?? 0,
    so_dong: dong.length,
  };
}

// -----------------------------------------------------------------------------
// ĐỌC DATABASE
// -----------------------------------------------------------------------------

export interface MatHangTheKho {
  id: string;
  ma: string;
  ten: string;
  loai: 'tang' | 'phan_cat' | 'phu_pham' | 'gia_vi' | 'do_uong';   // 0105: hai loại đếm theo cái
  dem_goi: boolean;
  don_vi_goi: string;
}

export async function docMatHangTheKho(client: SupabaseClient, id: string): Promise<MatHangTheKho | null> {
  if (!laUuid(id)) return null;
  const { data, error } = await client
    .from('kho_mat_hang')
    .select('id, ma, ten, loai, dem_goi, don_vi_goi')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as MatHangTheKho | null;
}

const so = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

export async function docTheKho(
  client: SupabaseClient, chiNhanhId: string, matHangId: string, b: BoLocTheKho,
): Promise<DongTheKho[]> {
  // Đọc từng trang: thẻ kho dài hơn 1.000 dòng thì dòng cuối — số dư cuối — nằm ở trang sau.
  const data = await docTungTrang((tu, den) => client.rpc('kho_the_kho', {
    p_chi_nhanh_id: chiNhanhId,
    p_mat_hang_id: matHangId,
    p_vi_tri_id: b.viTri || null,
    p_tu: b.tu,
    p_den: b.den,
  }, { count: 'exact' }).range(tu, den));
  return (data as Record<string, unknown>[]).map(r => ({
    ngay: (r.ngay as string | null) ?? null,
    loai: String(r.loai ?? ''),
    ten_loai: String(r.ten_loai ?? ''),
    so_chung_tu: (r.so_chung_tu as string | null) ?? null,
    chung_tu_loai: (r.chung_tu_loai as string | null) ?? null,
    chung_tu_id: (r.chung_tu_id as string | null) ?? null,
    vi_tri: (r.vi_tri as string | null) ?? null,
    ma_lo: (r.ma_lo as string | null) ?? null,
    nhap_kg: so(r.nhap_kg), xuat_kg: so(r.xuat_kg), ton_kg: so(r.ton_kg),
    nhap_goi: so(r.nhap_goi), xuat_goi: so(r.xuat_goi), ton_goi: so(r.ton_goi),
    dien_giai: (r.dien_giai as string | null) ?? null,
    lo_id: (r.lo_id as string | null) ?? null,
    vi_tri_id: (r.vi_tri_id as string | null) ?? null,
  }));
}

/** Phiên pha lóc đang nháp của chi nhánh (cho nút "Thêm vào phiên pha" ở màn Quét). Không tiền. */
export interface PhienPhaMo { id: string; so_phieu: string; ten_mat_hang_vao: string; mat_hang_vao_id: string }

export async function docPhienPhaMo(client: SupabaseClient, chiNhanhId: string): Promise<PhienPhaMo[]> {
  const { data, error } = await client
    .from('kho_v_phien_pha')
    .select('id, so_phieu, mat_hang_vao_id, ten_mat_hang_vao')
    .eq('chi_nhanh_id', chiNhanhId)
    .eq('trang_thai', 'nhap')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  return (data ?? []) as PhienPhaMo[];
}

/**
 * "Thêm gói này vào phiên pha": một lượt quét một nhãn. Nhãn không nhận (không
 * có kg, là chính tảng đem pha, món đã gõ tay) thì báo đúng câu database trả.
 */
export async function themNhanVaoPhienPha(
  client: SupabaseClient, phienId: string, maGui: string, ma: string,
): Promise<KetQua> {
  if (!laUuid(phienId) || !laUuid(maGui)) return kqHai(false, CAU_THEM_PHA.trangCu);
  if (!/^\d{13}$/.test(ma)) return kqHai(false, CAU_THEM_PHA.nhanSai);
  const { data, error } = await client.rpc('kho_quet_phien_pha', { p_id: phienId, p_ma_gui: maGui, p_ma: [ma] });
  if (error) return { ok: false, cau: cauLoiKho(error) };
  const kq = (data ?? {}) as { da_co?: boolean; so_nhan?: number; loi?: { ma: string; loi: string }[] };
  if (kq.da_co) return kqHai(true, CAU_THEM_PHA.daCo);
  if (Number(kq.so_nhan ?? 0) > 0) return kqHai(true, CAU_THEM_PHA.daThem);
  const loi = kq.loi?.[0]?.loi;
  // Lý do là câu database (tiếng Việt) — bản tiếng Anh tra dichCau.
  return loi
    ? kqHai(false, { vi: `Chưa thêm được: ${loi}`, en: `Not added: ${dichCau('en', loi)}` })
    : kqHai(false, CAU_THEM_PHA.chuaThem);
}

const CAU_THEM_PHA = {
  trangCu: { vi: 'Trang đã cũ — tải lại trang rồi quét lại.', en: 'This page is out of date — reload it and scan again.' },
  nhanSai: { vi: 'Nhãn đọc sai — quét lại nhãn này.', en: 'The label was misread — scan it again.' },
  daCo: { vi: 'Gói này đã được thêm từ trước — không cộng thêm lần nữa.', en: 'This pack was already added — it is not counted again.' },
  daThem: { vi: 'Đã thêm gói này vào phiên pha.', en: 'Pack added to the butchery session.' },
  chuaThem: { vi: 'Chưa thêm được gói này vào phiên pha.', en: 'Could not add this pack to the butchery session.' },
} satisfies Record<string, HaiThuTieng>;
