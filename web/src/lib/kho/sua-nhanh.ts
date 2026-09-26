/**
 * KHO — SỬA HÀNG LOẠT (GĐ8c, migration 0041)
 *
 * 1. Sửa nhanh mặt hàng (/noi-bo/kho/cai-dat/mat-hang/sua-nhanh): bảng mọi món,
 *    mỗi ô là một input, một nút "Lưu tất cả". Form mang cho từng dòng:
 *      id            (lặp lại, một lần mỗi dòng)
 *      pb_<id>       phiên bản = updated_at lúc mở trang (chống ghi đè)
 *      <ô>_<id>      giá trị gõ
 *      cu_<ô>_<id>   giá trị lúc mở trang (ô ẩn) — chỉ gửi ô đã đổi
 *    Ô để trống = GIỮ giá trị cũ. Muốn xóa hẳn một ô thì gõ dấu gạch "-".
 *    Database (kho_sua_nhanh_mat_hang) kiểm mọi luật và lưu TẤT CẢ HOẶC KHÔNG,
 *    trả lỗi theo từng dòng / từng ô — web không lặp lại luật, chỉ đổi "650.000"
 *    thành 650000, "1,5" thành 1.5 cho gọn.
 *
 * 2. Vị trí + lý do trên một form (/noi-bo/kho/cai-dat/vi-tri-ly-do): mọi dòng
 *    của hai bảng và vài dòng trống để thêm, một nút "Lưu tất cả". Chỉ ghi
 *    dòng có đổi; kiểm hết trước khi ghi dòng nào. `phien_ban` = chuỗi các dòng
 *    lúc mở trang — người khác vừa sửa thì từ chối, không đè.
 *
 * Hàm thuần (docFormSuaNhanh, giaTriO, docFormViTriLyDo, phienBanViTriLyDo)
 * test bằng Node; hàm gọi database nằm cuối file.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { cauLoiKho, docKg, docSoNguyen, docTien, laUuid, type KetQua } from './chung.ts';
import type { LyDo, ViTri } from './danh-muc.ts';

// -----------------------------------------------------------------------------
// 1 · SỬA NHANH MẶT HÀNG
// -----------------------------------------------------------------------------
export type KieuO = 'tien' | 'so' | 'kg' | 'chu' | 'noi_de' | 'dang_dung';

export const O_SUA_NHANH = [
  { khoa: 'gia_ban_kg', ten: 'Giá bán/kg', kieu: 'tien' },
  { khoa: 'han_dung_ngay', ten: 'HSD (ngày)', kieu: 'so' },
  { khoa: 'ma_can', ten: 'Mã cân', kieu: 'chu' },
  { khoa: 'quay_toi_thieu_goi', ten: 'Quầy tối thiểu (gói)', kieu: 'so' },
  { khoa: 'quay_toi_da_goi', ten: 'Quầy tối đa (gói)', kieu: 'so' },
  { khoa: 'ton_toi_thieu_kg', ten: 'Quầy tối thiểu (kg)', kieu: 'kg' },
  { khoa: 'kho_toi_thieu_kg', ten: 'Kho lạnh tối thiểu (kg)', kieu: 'kg' },
  { khoa: 'kho_toi_da_kg', ten: 'Kho lạnh tối đa (kg)', kieu: 'kg' },
  { khoa: 'noi_de_sau_pha', ten: 'Sau pha để ở', kieu: 'noi_de' },
  { khoa: 'dang_dung', ten: 'Tình trạng', kieu: 'dang_dung' },
] as const satisfies readonly { khoa: string; ten: string; kieu: KieuO }[];

export type OSuaNhanh = typeof O_SUA_NHANH[number]['khoa'];

export interface MonSuaNhanh {
  id: string; ma: string; ten: string; nhom: string | null;
  loai: 'tang' | 'phan_cat' | 'phu_pham';
  dem_goi: boolean; don_vi_goi: string; thu_tu: number;
  gia_ban_kg: number | null; han_dung_ngay: number | null; ma_can: string | null;
  quay_toi_thieu_goi: number | null; quay_toi_da_goi: number | null; ton_toi_thieu_kg: number | null;
  kho_toi_thieu_kg: number | null; kho_toi_da_kg: number | null;
  noi_de_sau_pha: 'kho' | 'quay' | null; dang_dung: boolean;
  /** updated_at lúc đọc — gửi lại nguyên chuỗi. */
  phien_ban: string;
}

/** Chữ gõ để xóa hẳn một ô (ô trống là GIỮ). */
export const CHU_XOA = '-';

/** Giá trị hiện trong ô (và ô ẩn cu_…). */
export function giaTriO(m: MonSuaNhanh, khoa: OSuaNhanh): string {
  const v = m[khoa];
  switch (khoa) {
    case 'gia_ban_kg': return v === null ? '' : Number(v).toLocaleString('vi-VN');
    case 'ton_toi_thieu_kg': case 'kho_toi_thieu_kg': case 'kho_toi_da_kg':
      return v === null ? '' : String(v).replace('.', ',');
    case 'noi_de_sau_pha': return v === 'quay' ? 'quay' : 'kho';
    case 'dang_dung': return v ? 'co' : 'khong';
    default: return v === null || v === undefined ? '' : String(v);
  }
}

/** Dạng chuẩn để so "có đổi không": "650.000" = "650000", "1.5" = "1,5". */
function chuan(kieu: KieuO, s: string): string {
  const t = s.trim();
  if (t === '' || t === CHU_XOA) return t;
  if (kieu === 'tien') { const n = docTien(t); return n === null || Number.isNaN(n) ? t : String(n); }
  if (kieu === 'kg') { const n = docKg(t); return n === null || Number.isNaN(n) ? t : String(n); }
  if (kieu === 'so') { const n = docSoNguyen(t, -1e9, 1e9); return n === null || Number.isNaN(n) ? t : String(n); }
  if (kieu === 'chu') return t.replace(/^0+(?=\d)/, '');
  return t;
}

/** Giá trị gửi database: số khi đọc được, không thì chữ gõ nguyên văn (database báo lỗi đúng ô). */
function giaTriGui(kieu: KieuO, s: string): string | number {
  const c = chuan(kieu, s);
  if ((kieu === 'tien' || kieu === 'kg' || kieu === 'so') && c !== '' && /^-?\d+(\.\d+)?$/.test(c)) return Number(c);
  return c;
}

export type DongGuiSuaNhanh = { id: string; phien_ban: string } & Partial<Record<OSuaNhanh, string | number | null>>;

export interface FormSuaNhanh {
  /** Dòng có ít nhất một ô đổi — gửi kho_sua_nhanh_mat_hang. */
  dong: DongGuiSuaNhanh[];
  /** Chữ đã gõ của mọi dòng trong form — lỗi thì hiện lại đúng như vậy. */
  chuGo: Map<string, Partial<Record<OSuaNhanh, string>>>;
  /** Số dòng có trong form (đã hiện trên trang). */
  soDong: number;
}

export function docFormSuaNhanh(form: FormData): FormSuaNhanh {
  const dong: DongGuiSuaNhanh[] = [];
  const chuGo = new Map<string, Partial<Record<OSuaNhanh, string>>>();
  const ids = [...new Set(form.getAll('id').map(String).filter(laUuid))];
  for (const id of ids) {
    const go: Partial<Record<OSuaNhanh, string>> = {};
    const doi: Partial<Record<OSuaNhanh, string | number | null>> = {};
    for (const o of O_SUA_NHANH) {
      if (!form.has(`${o.khoa}_${id}`)) continue;
      const moi = String(form.get(`${o.khoa}_${id}`) ?? '').trim();
      const cu = String(form.get(`cu_${o.khoa}_${id}`) ?? '').trim();
      go[o.khoa] = moi;
      if (moi === '') continue;                                  // trống = giữ
      if (moi === CHU_XOA) { if (cu !== '') doi[o.khoa] = null; continue; }
      if (chuan(o.kieu, moi) === chuan(o.kieu, cu)) continue;     // không đổi
      doi[o.khoa] = giaTriGui(o.kieu, moi);
    }
    chuGo.set(id, go);
    if (Object.keys(doi).length > 0) {
      dong.push({ id, phien_ban: String(form.get(`pb_${id}`) ?? ''), ...doi });
    }
  }
  return { dong, chuGo, soDong: ids.length };
}

export interface LoiDongSuaNhanh { dong: number | null; id: string | null; ten: string | null; truong: string | null; cau: string }

export interface KetQuaSuaNhanh extends KetQua {
  soLuu: number;
  loi: LoiDongSuaNhanh[];
}

/** Gom lỗi theo món: id → { câu cả dòng, ô bị lỗi }. */
export function loiTheoMon(loi: LoiDongSuaNhanh[]): Map<string, { cau: string[]; o: Set<string> }> {
  const ra = new Map<string, { cau: string[]; o: Set<string> }>();
  for (const l of loi) {
    if (!l.id) continue;
    const x = ra.get(l.id) ?? { cau: [], o: new Set<string>() };
    x.cau.push(l.cau);
    if (l.truong) x.o.add(l.truong);
    ra.set(l.id, x);
  }
  return ra;
}

/** Lỗi "vừa được người khác sửa" — dòng đó hiện lại số MỚI trong database, bỏ chữ đã gõ. */
export function laLoiPhienBan(l: LoiDongSuaNhanh): boolean {
  return l.truong === null && /người khác sửa|thiếu phiên bản/.test(l.cau);
}

/** Lọc bảng: nhóm, loại, chữ tìm (bỏ dấu, không phân biệt hoa thường). */
export function locMonSuaNhanh(
  ds: MonSuaNhanh[], loc: { nhom?: string; loai?: string; tim?: string }, boDau: (s: string) => string,
): MonSuaNhanh[] {
  const tim = boDau(loc.tim ?? '').toLowerCase().trim();
  return ds.filter(m =>
    (!loc.loai || m.loai === loc.loai)
    && (!loc.nhom || (loc.nhom === '(chưa có)' ? !m.nhom : m.nhom === loc.nhom))
    && (!tim || boDau(`${m.ten} ${m.ma} ${m.nhom ?? ''} ${m.ma_can ?? ''}`).toLowerCase().includes(tim)));
}

// -----------------------------------------------------------------------------
// 2 · VỊ TRÍ + LÝ DO TRÊN MỘT FORM
// -----------------------------------------------------------------------------
export const LOAI_LY_DO = [
  ['huy', 'Lý do hủy hàng'],
  ['xuat_bep', 'Lý do xuất bếp'],
  ['xuat_khac', 'Lý do xuất khác'],
  ['dieu_chinh', 'Lý do điều chỉnh'],
] as const;

/** Số dòng trống để thêm mới trên form: vị trí, và mỗi loại lý do. */
export const SO_DONG_THEM = 2;

/** Vị trí hệ thống (chờ hủy, đang mang ra quầy): không đổi loại, không tắt được. */
export const laViTriHeThong = (v: Pick<ViTri, 'loai'>) => v.loai === 'cho_huy' || v.loai === 'dang_chuyen';

/** Chuỗi phiên bản của hai bảng lúc mở trang (đổi một chữ ở đâu cũng khác). */
export function phienBanViTriLyDo(viTri: ViTri[], lyDo: LyDo[]): string {
  const v = [...viTri].sort((a, b) => a.id.localeCompare(b.id))
    .map(x => [x.id, x.ten, x.loai, x.thu_tu, x.dang_dung ? 1 : 0].join('|'));
  const l = [...lyDo].sort((a, b) => a.id.localeCompare(b.id))
    .map(x => [x.id, x.ten, x.loai, x.thu_tu, x.dang_dung ? 1 : 0, x.can_anh ? 1 : 0].join('|'));
  // Gọn: băm chuỗi dài thành 8 ký tự (FNV-1a) — chỉ để so, không để bảo mật.
  let h = 0x811c9dc5;
  for (const ch of [...v, '#', ...l].join('\n')) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${viTri.length}.${lyDo.length}.${h.toString(16).padStart(8, '0')}`;
}

export interface KeHoachViTriLyDo {
  viTriSua: { id: string; ten: string; dong: Record<string, unknown> }[];
  /** `o` = tên ô tên trên form — lưu được thì trang xóa chữ ở ô đó (bấm lại không thêm trùng). */
  viTriMoi: { ten: string; loai: 'kho' | 'quay'; thu_tu: number; o: string }[];
  lyDoSua: { id: string; ten: string; dong: Record<string, unknown> }[];
  lyDoMoi: { ten: string; loai: string; can_anh: boolean; o: string }[];
  loi: string[];
}

/**
 * Đọc form "Lưu tất cả": so từng dòng với dữ liệu lúc đọc lại, chỉ giữ dòng
 * đổi. Ô tên trống ở dòng có sẵn → lỗi (xóa tên không phải là xóa dòng — muốn
 * bỏ thì chọn "Ngừng dùng"). Dòng thêm mới để trống tên thì bỏ qua.
 */
export function docFormViTriLyDo(form: FormData, viTri: ViTri[], lyDo: LyDo[]): KeHoachViTriLyDo {
  const g = (t: string) => String(form.get(t) ?? '').trim();
  const thuTu = (t: string, macDinh: number) => {
    const n = docSoNguyen(form.get(t), 0, 999);
    return n === null || Number.isNaN(n) ? macDinh : n;
  };
  const kq: KeHoachViTriLyDo = { viTriSua: [], viTriMoi: [], lyDoSua: [], lyDoMoi: [], loi: [] };

  for (const v of viTri) {
    if (!form.has(`vt_ten_${v.id}`)) continue;
    const ten = g(`vt_ten_${v.id}`);
    if (!ten) { kq.loi.push(`Vị trí "${v.ten}": chưa có tên — muốn bỏ thì chọn "Ngừng dùng".`); continue; }
    if (ten.length > 60) { kq.loi.push(`Vị trí "${v.ten}": tên dài quá (tối đa 60 ký tự).`); continue; }
    const dong: Record<string, unknown> = {};
    if (ten !== v.ten) dong.ten = ten;
    const tt = thuTu(`vt_thu_tu_${v.id}`, v.thu_tu);
    if (tt !== v.thu_tu) dong.thu_tu = tt;
    if (!laViTriHeThong(v)) {
      const loai = g(`vt_loai_${v.id}`);
      if ((loai === 'kho' || loai === 'quay') && loai !== v.loai) dong.loai = loai;
      const dung = g(`vt_dang_dung_${v.id}`) !== 'khong';
      if (form.has(`vt_dang_dung_${v.id}`) && dung !== v.dang_dung) dong.dang_dung = dung;
    }
    if (Object.keys(dong).length > 0) kq.viTriSua.push({ id: v.id, ten, dong });
  }
  for (let i = 0; i < SO_DONG_THEM; i++) {
    const ten = g(`vt_moi_ten_${i}`);
    if (!ten) continue;
    const loai = g(`vt_moi_loai_${i}`);
    if (loai !== 'kho' && loai !== 'quay') { kq.loi.push(`Vị trí mới "${ten}": chọn Kho hoặc Quầy.`); continue; }
    if (ten.length > 60) { kq.loi.push(`Vị trí mới "${ten}": tên dài quá (tối đa 60 ký tự).`); continue; }
    kq.viTriMoi.push({ ten, loai, thu_tu: thuTu(`vt_moi_thu_tu_${i}`, 5), o: `vt_moi_ten_${i}` });
  }

  for (const l of lyDo) {
    if (!form.has(`ld_ten_${l.id}`)) continue;
    const ten = g(`ld_ten_${l.id}`);
    if (!ten) { kq.loi.push(`Lý do "${l.ten}": chưa có chữ — muốn bỏ thì chọn "Ngừng dùng".`); continue; }
    if (ten.length > 80) { kq.loi.push(`Lý do "${l.ten}": dài quá (tối đa 80 ký tự).`); continue; }
    const dong: Record<string, unknown> = {};
    if (ten !== l.ten) dong.ten = ten;
    const tt = thuTu(`ld_thu_tu_${l.id}`, l.thu_tu);
    if (tt !== l.thu_tu) dong.thu_tu = tt;
    if (form.has(`ld_dang_dung_${l.id}`)) {
      const dung = g(`ld_dang_dung_${l.id}`) !== 'khong';
      if (dung !== l.dang_dung) dong.dang_dung = dung;
    }
    // Ô tích "bắt buộc ảnh" chỉ có ở lý do hủy; ô ẩn ld_co_anh_<id> báo ô tích có trên form.
    if (form.has(`ld_co_anh_${l.id}`)) {
      const canAnh = form.get(`ld_can_anh_${l.id}`) === 'co';
      if (canAnh !== l.can_anh) dong.can_anh = canAnh;
    }
    if (Object.keys(dong).length > 0) kq.lyDoSua.push({ id: l.id, ten, dong });
  }
  for (const [loai] of LOAI_LY_DO) {
    for (let i = 0; i < SO_DONG_THEM; i++) {
      const ten = g(`ld_moi_ten_${loai}_${i}`);
      if (!ten) continue;
      if (ten.length > 80) { kq.loi.push(`Lý do mới "${ten}": dài quá (tối đa 80 ký tự).`); continue; }
      kq.lyDoMoi.push({ ten, loai, can_anh: form.get(`ld_moi_can_anh_${loai}_${i}`) === 'co', o: `ld_moi_ten_${loai}_${i}` });
    }
  }
  return kq;
}

export function soThayDoi(kh: KeHoachViTriLyDo): number {
  return kh.viTriSua.length + kh.viTriMoi.length + kh.lyDoSua.length + kh.lyDoMoi.length;
}

// -----------------------------------------------------------------------------
// GỌI DATABASE
// -----------------------------------------------------------------------------
const soHoa = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

/** Mặt hàng cho bảng sửa nhanh — không cột giá vốn nào (giá bán là giá công khai). */
export async function docMonSuaNhanh(client: SupabaseClient): Promise<MonSuaNhanh[]> {
  const { data, error } = await client
    .from('kho_mat_hang')
    .select('id, ma, ten, nhom, loai, dem_goi, don_vi_goi, thu_tu, gia_ban_kg, han_dung_ngay, ma_can, quay_toi_thieu_goi, quay_toi_da_goi, ton_toi_thieu_kg, kho_toi_thieu_kg, kho_toi_da_kg, noi_de_sau_pha, dang_dung, updated_at')
    .order('loai').order('thu_tu').order('ten');
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(r => ({
    id: String(r.id), ma: String(r.ma), ten: String(r.ten), nhom: (r.nhom as string | null) ?? null,
    loai: r.loai as MonSuaNhanh['loai'], dem_goi: r.dem_goi !== false, don_vi_goi: String(r.don_vi_goi ?? 'gói'),
    thu_tu: Number(r.thu_tu ?? 0),
    gia_ban_kg: soHoa(r.gia_ban_kg), han_dung_ngay: soHoa(r.han_dung_ngay), ma_can: (r.ma_can as string | null) ?? null,
    quay_toi_thieu_goi: soHoa(r.quay_toi_thieu_goi), quay_toi_da_goi: soHoa(r.quay_toi_da_goi),
    ton_toi_thieu_kg: soHoa(r.ton_toi_thieu_kg), kho_toi_thieu_kg: soHoa(r.kho_toi_thieu_kg), kho_toi_da_kg: soHoa(r.kho_toi_da_kg),
    noi_de_sau_pha: r.noi_de_sau_pha === 'quay' ? 'quay' : r.noi_de_sau_pha === 'kho' ? 'kho' : null,
    dang_dung: r.dang_dung !== false,
    phien_ban: String(r.updated_at ?? ''),
  }));
}

export async function suaNhanhMatHang(
  client: SupabaseClient, chiNhanhId: string, dong: DongGuiSuaNhanh[],
): Promise<KetQuaSuaNhanh> {
  if (dong.length === 0) return { ok: true, soLuu: 0, loi: [], cau: 'Chưa đổi ô nào — không có gì để lưu.' };
  const { data, error } = await client.rpc('kho_sua_nhanh_mat_hang', { p_chi_nhanh_id: chiNhanhId, p_dong: dong });
  if (error) return { ok: false, soLuu: 0, loi: [], cau: cauLoiKho(error) };
  const r = (data ?? {}) as { ok?: boolean; cau?: string; so_dong_luu?: number; loi?: LoiDongSuaNhanh[] };
  return {
    ok: r.ok === true,
    soLuu: Number(r.so_dong_luu ?? 0),
    loi: Array.isArray(r.loi) ? r.loi : [],
    cau: r.cau ?? (r.ok ? 'Đã lưu.' : 'Chưa lưu được.'),
  };
}

/**
 * Ghi kế hoạch vị trí + lý do. Đã kiểm hết ở docFormViTriLyDo; database chặn quyền.
 * `oMoiDaLuu` = ô tên của các dòng MỚI đã thêm được — lỗi giữa chừng thì trang
 * xóa chữ ở các ô đó, bấm Lưu lần nữa không thêm trùng.
 */
export async function luuViTriLyDo(
  client: SupabaseClient, chiNhanhId: string, kh: KeHoachViTriLyDo,
): Promise<KetQua & { oMoiDaLuu: string[] }> {
  const oMoiDaLuu: string[] = [];
  if (kh.loi.length > 0) return { ok: false, cau: `Chưa lưu gì: ${kh.loi.join(' · ')}`, oMoiDaLuu };
  const n = soThayDoi(kh);
  if (n === 0) return { ok: true, cau: 'Chưa đổi ô nào — không có gì để lưu.', oMoiDaLuu };
  let daLuu = 0;
  const hong = (e: unknown, ten: string) => ({
    ok: false,
    cau: `${daLuu > 0 ? `Đã lưu ${daLuu} dòng, ` : ''}chưa lưu được "${ten}": ${cauLoiKho(e)}`,
    oMoiDaLuu,
  });
  for (const v of kh.viTriSua) {
    const { data, error } = await client.from('kho_vi_tri').update(v.dong).eq('id', v.id).select('id');
    if (error || !data?.length) return hong(error ?? 'Không sửa được vị trí này.', v.ten);
    daLuu++;
  }
  for (const { o, ...v } of kh.viTriMoi) {
    const { error } = await client.from('kho_vi_tri').insert({ ...v, chi_nhanh_id: chiNhanhId });
    if (error) return hong(error, v.ten);
    daLuu++;
    oMoiDaLuu.push(o);
  }
  for (const l of kh.lyDoSua) {
    const { data, error } = await client.from('kho_ly_do').update(l.dong).eq('id', l.id).select('id');
    if (error || !data?.length) return hong(error ?? 'Không sửa được lý do này.', l.ten);
    daLuu++;
  }
  for (const { o, ...l } of kh.lyDoMoi) {
    const { error } = await client.from('kho_ly_do').insert({ ...l, thu_tu: 0, dang_dung: true });
    if (error) return hong(error, l.ten);
    daLuu++;
    oMoiDaLuu.push(o);
  }
  return { ok: true, cau: `Đã lưu ${daLuu} dòng.`, oMoiDaLuu };
}
