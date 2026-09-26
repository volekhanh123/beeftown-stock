/**
 * KHO — CÔNG THỨC PHA LÓC DẠNG LƯỚI (GĐ8c)
 *
 * Mỗi công thức một lưới: phần cắt ra × tỷ lệ % (+ xử lý, thứ tự, ô "Bỏ").
 * Một form, ba nút:
 *   · "Tính lại"   — không lưu gì; máy chủ cộng tổng chạy từ chữ đã gõ:
 *                    xanh khi 95–100%, vàng dưới 95% (phần còn lại coi là
 *                    hao hụt), đỏ khi vượt 100%.
 *   · "Thêm dòng"  — như Tính lại, thêm 3 dòng trống.
 *   · "Lưu công thức" — thay TOÀN BỘ phần ra (dòng trống / tích Bỏ là không
 *                    có). Form mang `phien_ban` = chuỗi phần ra lúc mở; database
 *                    đã khác thì từ chối, không đè.
 * "Nhân bản công thức" tạo bản sao (tên + " (bản sao)", đủ phần ra).
 * "Gợi ý từ thực tế": tỷ lệ trung bình 30 ngày từ các phiên pha đã chốt của
 * đúng loại tảng đó (kg ra ÷ kg tảng, cộng dồn các phiên) — chỉ kg, không tiền;
 * điền vào cột "Gợi ý" để người dùng chép sang ô tỷ lệ.
 *
 * Hàm thuần (docLuoiCongThuc, tongTyLe, mauTong, phienBanCongThuc, tinhGoiY)
 * test bằng Node; hàm gọi database ở cuối file.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, congNgay, docKg, docSoNguyen, laUuid, type KetQua } from './chung.ts';
import type { CongThuc } from './danh-muc.ts';

export const SO_DONG_TRONG = 3;
export const SO_DONG_TOI_DA = 60;
export const NGAY_GOI_Y = 30;

export interface DongLuoi {
  mat_hang_ra_id: string;
  ty_le_du_kien: number | null;
  xu_ly: 'nhap_kho' | 'chuyen_bep' | 'bo' | null;
  thu_tu: number;
}

/** Chữ đã gõ của một dòng lưới — hiện lại đúng như vậy khi Tính lại / báo lỗi. */
export interface ChuDongLuoi { mh: string; tl: string; xl: string; tt: string; bo: boolean }

export function chuTuCongThuc(ct: CongThuc): ChuDongLuoi[] {
  return [...ct.dong].sort((a, b) => a.thu_tu - b.thu_tu).map(d => ({
    mh: d.mat_hang_ra_id,
    tl: d.ty_le_du_kien === null ? '' : String(d.ty_le_du_kien).replace('.', ','),
    xl: d.xu_ly ?? '',
    tt: String(d.thu_tu),
    bo: false,
  }));
}

/** Thêm n dòng trống vào cuối lưới. */
export function themDongTrong(chu: ChuDongLuoi[], n = SO_DONG_TRONG): ChuDongLuoi[] {
  return [...chu, ...Array.from({ length: n }, () => ({ mh: '', tl: '', xl: '', tt: '', bo: false }))];
}

export function docLuoiCongThuc(form: FormData): { dong: DongLuoi[]; chu: ChuDongLuoi[]; loi: string[] } {
  const n = Math.min(docSoNguyen(form.get('so_dong'), 0, SO_DONG_TOI_DA) || 0, SO_DONG_TOI_DA);
  const g = (t: string) => String(form.get(t) ?? '').trim();
  const chu: ChuDongLuoi[] = [];
  const dong: DongLuoi[] = [];
  const loi: string[] = [];
  const daCo = new Set<string>();
  for (let i = 0; i < n; i++) {
    const c: ChuDongLuoi = { mh: g(`mh_${i}`), tl: g(`tl_${i}`), xl: g(`xl_${i}`), tt: g(`tt_${i}`), bo: form.get(`bo_${i}`) === 'co' };
    chu.push(c);
    if (c.bo || !c.mh) continue;
    if (!laUuid(c.mh)) { loi.push(`Dòng ${i + 1}: chọn phần ra.`); continue; }
    if (daCo.has(c.mh)) { loi.push(`Dòng ${i + 1}: phần ra này đã có ở dòng trên — mỗi phần một dòng.`); continue; }
    daCo.add(c.mh);
    const tl = docKg(c.tl);
    if (Number.isNaN(tl) || (tl !== null && tl > 100)) { loi.push(`Dòng ${i + 1}: tỷ lệ là % từ 0 đến 100, ví dụ 72,5.`); continue; }
    const tt = docSoNguyen(c.tt, 0, 999);
    dong.push({
      mat_hang_ra_id: c.mh,
      ty_le_du_kien: tl,
      xu_ly: c.xl === 'nhap_kho' || c.xl === 'chuyen_bep' || c.xl === 'bo' ? c.xl : null,
      thu_tu: tt === null || Number.isNaN(tt) ? i + 1 : tt,
    });
  }
  return { dong, chu, loi };
}

/** Tổng % của các dòng (bỏ dòng tích Bỏ / trống), 2 số lẻ. */
export function tongTyLe(dong: { ty_le_du_kien: number | null }[]): number {
  return Math.round(dong.reduce((s, d) => s + (d.ty_le_du_kien ?? 0), 0) * 100) / 100;
}

/** Tổng chạy từ chữ đang thấy trên lưới: dòng tích Bỏ, dòng chưa chọn phần ra, ô gõ sai không tính. */
export function tongChu(chu: ChuDongLuoi[]): number {
  return tongTyLe(chu.filter(c => !c.bo && c.mh).map(c => {
    const n = docKg(c.tl);
    return { ty_le_du_kien: n === null || Number.isNaN(n) ? null : n };
  }));
}

/** Màu tổng chạy: đỏ vượt 100%, xanh 95–100%, vàng dưới 95% (còn lại là hao hụt). */
export function mauTong(tong: number): 'xanh' | 'vang' | 'do' {
  if (tong > 100.005) return 'do';
  if (tong >= 95) return 'xanh';
  return 'vang';
}

export function cauTong(tong: number): string {
  const m = mauTong(tong);
  const s = tong.toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  if (m === 'do') return `Tổng ${s}% — vượt 100%, giảm bớt tỷ lệ các phần.`;
  const con = Math.round((100 - tong) * 100) / 100;
  return con === 0 ? `Tổng ${s}% — đủ 100%.`
    : `Tổng ${s}% — còn ${con.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}% coi là hao hụt khi pha.`;
}

/** Chuỗi phần ra để chống ghi đè: đổi một con số ở đâu cũng khác. */
export function phienBanCongThuc(ct: Pick<CongThuc, 'dong'>): string {
  return [...ct.dong].map(d => `${d.mat_hang_ra_id}:${d.ty_le_du_kien ?? ''}:${d.xu_ly ?? ''}:${d.thu_tu}`).sort().join(';');
}

/**
 * Tỷ lệ thực tế: cộng kg ra từng mặt hàng ÷ cộng kg tảng đem pha của các phiên
 * (phiên nào không có tổng kg vào thì bỏ). Trả % 1 số lẻ theo mặt hàng.
 */
export function tinhGoiY(
  phien: { id: string; tong_kg_vao: number | null }[],
  ra: { phien_pha_id: string; mat_hang_id: string; so_kg: number }[],
): { soPhien: number; kgVao: number; tyLe: Map<string, number> } {
  const dung = phien.filter(p => (p.tong_kg_vao ?? 0) > 0);
  const ids = new Set(dung.map(p => p.id));
  const kgVao = dung.reduce((s, p) => s + Number(p.tong_kg_vao), 0);
  const cong = new Map<string, number>();
  for (const r of ra) {
    if (!ids.has(r.phien_pha_id)) continue;
    cong.set(r.mat_hang_id, (cong.get(r.mat_hang_id) ?? 0) + Number(r.so_kg));
  }
  const tyLe = new Map<string, number>();
  if (kgVao > 0) for (const [mh, kg] of cong) tyLe.set(mh, Math.round(kg / kgVao * 1000) / 10);
  return { soPhien: dung.length, kgVao: Math.round(kgVao * 1000) / 1000, tyLe };
}

// -----------------------------------------------------------------------------
// GỌI DATABASE
// -----------------------------------------------------------------------------
/** Phiên pha đã chốt của loại tảng này trong 30 ngày (kể cả hôm nay), chỉ kg. */
export async function docGoiYThucTe(
  client: SupabaseClient, chiNhanhId: string, matHangVaoId: string, homNay: string,
): Promise<{ soPhien: number; kgVao: number; tyLe: Map<string, number>; loi: string | null }> {
  const rong = { soPhien: 0, kgVao: 0, tyLe: new Map<string, number>() };
  const { data: phien, error } = await client
    .from('kho_phien_pha')
    .select('id, tong_kg_vao')
    .eq('chi_nhanh_id', chiNhanhId).eq('mat_hang_vao_id', matHangVaoId).eq('trang_thai', 'da_chot')
    .gte('ngay_pha', congNgay(homNay, -(NGAY_GOI_Y - 1))).lte('ngay_pha', homNay)
    .limit(500);
  if (error) return { ...rong, loi: cauLoiKho(error, 'Không đọc được các phiên pha lóc.') };
  const ds = ((phien ?? []) as { id: string; tong_kg_vao: unknown }[])
    .map(p => ({ id: p.id, tong_kg_vao: p.tong_kg_vao === null ? null : Number(p.tong_kg_vao) }));
  if (ds.length === 0) return { ...rong, loi: null };
  const { data: ra, error: loiRa } = await client
    .from('kho_phien_pha_ra')
    .select('phien_pha_id, mat_hang_id, so_kg')
    .in('phien_pha_id', ds.map(p => p.id));
  if (loiRa) return { ...rong, loi: cauLoiKho(loiRa, 'Không đọc được các phần pha ra.') };
  const dsRa = ((ra ?? []) as { phien_pha_id: string; mat_hang_id: string; so_kg: unknown }[])
    .map(r => ({ ...r, so_kg: Number(r.so_kg) }));
  return { ...tinhGoiY(ds, dsRa), loi: null };
}

/**
 * Lưu lưới = thay toàn bộ phần ra. Kiểm phiên bản trước (đọc lại từ database);
 * ghi các dòng (upsert theo công thức + mặt hàng) rồi bỏ dòng không còn trong lưới.
 */
export async function luuLuoiCongThuc(
  client: SupabaseClient, hienTai: CongThuc, phienBan: string, dong: DongLuoi[],
): Promise<KetQua> {
  if (phienBan !== phienBanCongThuc(hienTai)) {
    return { ok: false, cau: 'Công thức vừa được người khác sửa — tải lại trang để xem số mới rồi sửa lại.' };
  }
  if (dong.length > 0) {
    const { error } = await client.from('kho_cong_thuc_pha_dong').upsert(
      dong.map(d => ({ ...d, cong_thuc_id: hienTai.id })),
      { onConflict: 'cong_thuc_id,mat_hang_ra_id' },
    );
    if (error) return { ok: false, cau: cauLoiKho(error) };
  }
  const giu = new Set(dong.map(d => d.mat_hang_ra_id));
  const bo = hienTai.dong.filter(d => !giu.has(d.mat_hang_ra_id)).map(d => d.id);
  if (bo.length > 0) {
    const { error } = await client.from('kho_cong_thuc_pha_dong').delete().in('id', bo);
    if (error) return { ok: false, cau: `Đã lưu các phần ra, nhưng chưa bỏ được dòng cũ: ${cauLoiKho(error)}` };
  }
  return { ok: true, cau: `Đã lưu "${hienTai.ten}": ${dong.length} phần ra, tổng ${tongTyLe(dong).toLocaleString('vi-VN')}%.` };
}

/** Nhân bản: công thức mới cùng đầu vào, tên "… (bản sao)", đủ phần ra. */
export async function nhanBanCongThuc(
  client: SupabaseClient, ct: CongThuc,
): Promise<KetQua & { id?: string }> {
  const ten = `${ct.ten} (bản sao)`.slice(0, 120);
  const { data, error } = await client.from('kho_cong_thuc_pha')
    .insert({ ten, mat_hang_vao_id: ct.mat_hang_vao_id, ghi_chu: ct.ghi_chu })
    .select('id').single();
  if (error || !data) return { ok: false, cau: cauLoiKho(error ?? 'Không tạo được bản sao.') };
  const id = String(data.id);
  if (ct.dong.length > 0) {
    const { error: loiDong } = await client.from('kho_cong_thuc_pha_dong').insert(ct.dong.map(d => ({
      cong_thuc_id: id, mat_hang_ra_id: d.mat_hang_ra_id, ty_le_du_kien: d.ty_le_du_kien, xu_ly: d.xu_ly, thu_tu: d.thu_tu,
    })));
    if (loiDong) return { ok: false, id, cau: `Đã tạo "${ten}" nhưng chưa chép được phần ra: ${cauLoiKho(loiDong)}` };
  }
  return { ok: true, id, cau: `Đã tạo "${ten}" với ${ct.dong.length} phần ra. Sửa tên và tỷ lệ bên dưới.` };
}
