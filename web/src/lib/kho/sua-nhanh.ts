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
 *
 * Hai thứ tiếng: bảng tên cột / loại lý do có bản `…_NB` ({ vi, en }), bảng tên
 * cũ dựng lại từ đó; lỗi đọc form trả loi và loiEn song song; câu báo KetQua
 * mang thêm cauEn. Câu lỗi của database (kho_sua_nhanh_mat_hang) trang tra
 * dichCau lúc hiện.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  cauLoiKho, docKg, docSoNguyen, docTien, kqHai, laUuid, type HaiThuTieng, type KetQua, type NgonNguNB,
} from './chung.ts';
import { dichCau } from '../cau-noi-bo.ts';
import type { LyDo, ViTri } from './danh-muc.ts';

/** Số ít / số nhiều cho câu tiếng Anh. */
const soIt = (n: number, mot: string, nhieu: string) => (n === 1 ? mot : nhieu);

// -----------------------------------------------------------------------------
// 1 · SỬA NHANH MẶT HÀNG
// -----------------------------------------------------------------------------
export type KieuO = 'tien' | 'so' | 'kg' | 'chu' | 'noi_de' | 'dang_dung';

export const O_SUA_NHANH_NB = [
  { khoa: 'gia_ban_kg', ten: { vi: 'Giá bán/kg', en: 'Sale price/kg' }, kieu: 'tien' },
  { khoa: 'han_dung_ngay', ten: { vi: 'HSD (ngày)', en: 'Use-by (days)' }, kieu: 'so' },
  { khoa: 'ma_can', ten: { vi: 'Mã cân', en: 'Scale code' }, kieu: 'chu' },
  { khoa: 'quay_toi_thieu_goi', ten: { vi: 'Quầy tối thiểu (gói)', en: 'Counter min (packs)' }, kieu: 'so' },
  { khoa: 'quay_toi_da_goi', ten: { vi: 'Quầy tối đa (gói)', en: 'Counter max (packs)' }, kieu: 'so' },
  { khoa: 'ton_toi_thieu_kg', ten: { vi: 'Quầy tối thiểu (kg)', en: 'Counter min (kg)' }, kieu: 'kg' },
  { khoa: 'kho_toi_thieu_kg', ten: { vi: 'Kho lạnh tối thiểu (kg)', en: 'Cold store min (kg)' }, kieu: 'kg' },
  { khoa: 'kho_toi_da_kg', ten: { vi: 'Kho lạnh tối đa (kg)', en: 'Cold store max (kg)' }, kieu: 'kg' },
  { khoa: 'noi_de_sau_pha', ten: { vi: 'Sau pha để ở', en: 'After butchery goes to' }, kieu: 'noi_de' },
  { khoa: 'dang_dung', ten: { vi: 'Tình trạng', en: 'Status' }, kieu: 'dang_dung' },
] as const satisfies readonly { khoa: string; ten: HaiThuTieng; kieu: KieuO }[];

export type OSuaNhanh = typeof O_SUA_NHANH_NB[number]['khoa'];

/** Bản chỉ tiếng Việt (tên cũ, cho code và test cũ). */
export const O_SUA_NHANH: readonly { khoa: OSuaNhanh; ten: string; kieu: KieuO }[] =
  O_SUA_NHANH_NB.map(o => ({ khoa: o.khoa, ten: o.ten.vi, kieu: o.kieu }));

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

/**
 * Giá trị hiện trong ô (và ô ẩn cu_…). Tiếng Anh: "650,000" và "1.5" — so
 * "có đổi không" và đọc số (docTien, docKg) hiểu cả hai cách viết.
 */
export function giaTriO(m: MonSuaNhanh, khoa: OSuaNhanh, nn: NgonNguNB = 'vi'): string {
  const v = m[khoa];
  switch (khoa) {
    case 'gia_ban_kg': return v === null ? '' : Number(v).toLocaleString(nn === 'en' ? 'en-US' : 'vi-VN');
    case 'ton_toi_thieu_kg': case 'kho_toi_thieu_kg': case 'kho_toi_da_kg':
      return v === null ? '' : nn === 'en' ? String(v) : String(v).replace('.', ',');
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

/**
 * Giá trị gửi database: số khi docTien / docKg / docSoNguyen ĐỌC ĐƯỢC, không thì chữ gõ nguyên văn (database báo lỗi
 * đúng ô). Không tự đoán bằng regex số thập phân: "650.00" (gõ thiếu một số 0) từng thành 650 đ và được lưu lặng lẽ.
 */
function giaTriGui(kieu: KieuO, s: string): string | number {
  const c = chuan(kieu, s);
  if (c === '' || c === CHU_XOA) return c;
  const t = s.trim();
  const n = kieu === 'tien' ? docTien(t) : kieu === 'kg' ? docKg(t) : kieu === 'so' ? docSoNguyen(t, -1e9, 1e9) : null;
  return n === null || Number.isNaN(n) ? c : n;
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

/**
 * Lỗi "vừa được người khác sửa" — dòng đó hiện lại số MỚI trong database, bỏ chữ đã gõ.
 * Nhận ra bằng câu tiếng Việt của kho_sua_nhanh_mat_hang (0041) — câu database, không phải chữ giao diện.
 */
export function laLoiPhienBan(l: LoiDongSuaNhanh): boolean {
  return l.truong === null && /người khác sửa|thiếu phiên bản/.test(l.cau);
}

/** Giá trị lọc "chưa có nhóm" trên đường dẫn (?nhom=…) — là mã lọc, không phải chữ hiện. */
export const NHOM_CHUA_CO = '(chưa có)';

/** Lọc bảng: nhóm, loại, chữ tìm (bỏ dấu, không phân biệt hoa thường). */
export function locMonSuaNhanh(
  ds: MonSuaNhanh[], loc: { nhom?: string; loai?: string; tim?: string }, boDau: (s: string) => string,
): MonSuaNhanh[] {
  const tim = boDau(loc.tim ?? '').toLowerCase().trim();
  return ds.filter(m =>
    (!loc.loai || m.loai === loc.loai)
    && (!loc.nhom || (loc.nhom === NHOM_CHUA_CO ? !m.nhom : m.nhom === loc.nhom))
    && (!tim || boDau(`${m.ten} ${m.ma} ${m.nhom ?? ''} ${m.ma_can ?? ''}`).toLowerCase().includes(tim)));
}

// -----------------------------------------------------------------------------
// 2 · VỊ TRÍ + LÝ DO TRÊN MỘT FORM
// -----------------------------------------------------------------------------
export const LOAI_LY_DO_NB = [
  ['huy', { vi: 'Lý do hủy hàng', en: 'Write-off reasons' }],
  ['xuat_bep', { vi: 'Lý do xuất bếp', en: 'Kitchen issue reasons' }],
  ['xuat_khac', { vi: 'Lý do xuất khác', en: 'Other issue reasons' }],
  ['dieu_chinh', { vi: 'Lý do điều chỉnh', en: 'Adjustment reasons' }],
] as const satisfies readonly (readonly [LyDo['loai'], HaiThuTieng])[];

/** Bản chỉ tiếng Việt (tên cũ, cho code và test cũ). */
export const LOAI_LY_DO: readonly (readonly [LyDo['loai'], string])[] = LOAI_LY_DO_NB.map(([loai, ten]) => [loai, ten.vi] as const);

/** Số dòng trống để thêm mới trên form: vị trí, và mỗi loại lý do. */
export const SO_DONG_THEM = 2;

/** Vị trí hệ thống (chờ hủy, đang mang ra quầy): không đổi loại, không tắt được. */
export const laViTriHeThong = (v: Pick<ViTri, 'loai'>) => v.loai === 'cho_huy' || v.loai === 'dang_chuyen';

/** Lý do có tính vào định mức bếp không (thiếu cột = tính, như mặc định database). */
export const tinhDinhMuc = (l: Pick<LyDo, 'tinh_dinh_muc'>) => l.tinh_dinh_muc !== false;

/** Chuỗi phiên bản của hai bảng lúc mở trang (đổi một chữ ở đâu cũng khác). */
export function phienBanViTriLyDo(viTri: ViTri[], lyDo: LyDo[]): string {
  const v = [...viTri].sort((a, b) => a.id.localeCompare(b.id))
    .map(x => [x.id, x.ten, x.loai, x.thu_tu, x.dang_dung ? 1 : 0].join('|'));
  const l = [...lyDo].sort((a, b) => a.id.localeCompare(b.id))
    .map(x => [x.id, x.ten, x.loai, x.thu_tu, x.dang_dung ? 1 : 0, x.can_anh ? 1 : 0, tinhDinhMuc(x) ? 1 : 0].join('|'));
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
  lyDoMoi: { ten: string; loai: string; can_anh: boolean; tinh_dinh_muc?: boolean; o: string }[];
  loi: string[];
  /** loi bằng tiếng Anh, cùng thứ tự. */
  loiEn: string[];
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
  const kq: KeHoachViTriLyDo = { viTriSua: [], viTriMoi: [], lyDoSua: [], lyDoMoi: [], loi: [], loiEn: [] };
  const bao = (x: HaiThuTieng) => { kq.loi.push(x.vi); kq.loiEn.push(x.en); };

  for (const v of viTri) {
    if (!form.has(`vt_ten_${v.id}`)) continue;
    const ten = g(`vt_ten_${v.id}`);
    if (!ten) {
      bao({ vi: `Vị trí "${v.ten}": chưa có tên — muốn bỏ thì chọn "Ngừng dùng".`,
            en: `Location "${v.ten}": the name is empty — to stop using it, choose "No longer used".` });
      continue;
    }
    if (ten.length > 60) {
      bao({ vi: `Vị trí "${v.ten}": tên dài quá (tối đa 60 ký tự).`, en: `Location "${v.ten}": the name is too long (60 characters max).` });
      continue;
    }
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
    if (loai !== 'kho' && loai !== 'quay') {
      bao({ vi: `Vị trí mới "${ten}": chọn Kho hoặc Quầy.`, en: `New location "${ten}": choose Store or Counter.` });
      continue;
    }
    if (ten.length > 60) {
      bao({ vi: `Vị trí mới "${ten}": tên dài quá (tối đa 60 ký tự).`, en: `New location "${ten}": the name is too long (60 characters max).` });
      continue;
    }
    kq.viTriMoi.push({ ten, loai, thu_tu: thuTu(`vt_moi_thu_tu_${i}`, 5), o: `vt_moi_ten_${i}` });
  }

  for (const l of lyDo) {
    if (!form.has(`ld_ten_${l.id}`)) continue;
    const ten = g(`ld_ten_${l.id}`);
    if (!ten) {
      bao({ vi: `Lý do "${l.ten}": chưa có chữ — muốn bỏ thì chọn "Ngừng dùng".`,
            en: `Reason "${l.ten}": the text is empty — to stop using it, choose "No longer used".` });
      continue;
    }
    if (ten.length > 80) {
      bao({ vi: `Lý do "${l.ten}": dài quá (tối đa 80 ký tự).`, en: `Reason "${l.ten}": too long (80 characters max).` });
      continue;
    }
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
    // Ô tích "tính vào định mức bếp" chỉ có ở lý do Xuất bếp; ô ẩn ld_co_dm_<id> báo ô tích có trên form.
    if (l.loai === 'xuat_bep' && form.has(`ld_co_dm_${l.id}`)) {
      const tinh = form.get(`ld_tinh_dm_${l.id}`) === 'co';
      if (tinh !== tinhDinhMuc(l)) dong.tinh_dinh_muc = tinh;
    }
    if (Object.keys(dong).length > 0) kq.lyDoSua.push({ id: l.id, ten, dong });
  }
  for (const [loai] of LOAI_LY_DO) {
    for (let i = 0; i < SO_DONG_THEM; i++) {
      const ten = g(`ld_moi_ten_${loai}_${i}`);
      if (!ten) continue;
      if (ten.length > 80) {
        bao({ vi: `Lý do mới "${ten}": dài quá (tối đa 80 ký tự).`, en: `New reason "${ten}": too long (80 characters max).` });
        continue;
      }
      const moi: KeHoachViTriLyDo['lyDoMoi'][number] = {
        ten, loai, can_anh: form.get(`ld_moi_can_anh_${loai}_${i}`) === 'co', o: `ld_moi_ten_${loai}_${i}`,
      };
      // Lý do Xuất bếp mới: ghi ô tích "tính vào định mức bếp" (tên "Cơm nhân viên" thì database luôn đặt KHÔNG tính).
      if (loai === 'xuat_bep' && form.has(`ld_moi_co_dm_${loai}_${i}`)) {
        moi.tinh_dinh_muc = form.get(`ld_moi_tinh_dm_${loai}_${i}`) === 'co';
      }
      kq.lyDoMoi.push(moi);
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

/** Câu "không có gì để lưu" — dùng ở cả hai form "Lưu tất cả". */
const CHUA_DOI_O: HaiThuTieng = { vi: 'Chưa đổi ô nào — không có gì để lưu.', en: 'No cells changed — nothing to save.' };

export async function suaNhanhMatHang(
  client: SupabaseClient, chiNhanhId: string, dong: DongGuiSuaNhanh[],
): Promise<KetQuaSuaNhanh> {
  if (dong.length === 0) return { soLuu: 0, loi: [], ...kqHai(true, CHUA_DOI_O) };
  const { data, error } = await client.rpc('kho_sua_nhanh_mat_hang', { p_chi_nhanh_id: chiNhanhId, p_dong: dong });
  if (error) return { ok: false, soLuu: 0, loi: [], cau: cauLoiKho(error) };
  const r = (data ?? {}) as { ok?: boolean; cau?: string; so_dong_luu?: number; loi?: LoiDongSuaNhanh[] };
  // Câu của database (tiếng Việt, trang tra dichCau); database không trả câu thì dùng câu mặc định hai thứ tiếng.
  const cau = r.cau ?? null;
  const macDinh: HaiThuTieng = r.ok ? { vi: 'Đã lưu.', en: 'Saved.' } : { vi: 'Chưa lưu được.', en: 'Not saved.' };
  return {
    ok: r.ok === true,
    soLuu: Number(r.so_dong_luu ?? 0),
    loi: Array.isArray(r.loi) ? r.loi : [],
    ...(cau !== null ? { cau } : { cau: macDinh.vi, cauEn: macDinh.en }),
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
  if (kh.loi.length > 0) {
    return { oMoiDaLuu, ...kqHai(false, { vi: `Chưa lưu gì: ${kh.loi.join(' · ')}`, en: `Nothing saved: ${kh.loiEn.join(' · ')}` }) };
  }
  const n = soThayDoi(kh);
  if (n === 0) return { oMoiDaLuu, ...kqHai(true, CHUA_DOI_O) };
  let daLuu = 0;
  // Lỗi database / mạng: câu tiếng Việt như cũ; bản tiếng Anh tra dichCau.
  const loiDb = (e: unknown): HaiThuTieng => { const vi = cauLoiKho(e); return { vi, en: dichCau('en', vi) }; };
  const hong = (loi: HaiThuTieng, ten: string) => ({
    oMoiDaLuu,
    ...kqHai(false, {
      vi: `${daLuu > 0 ? `Đã lưu ${daLuu} dòng, ` : ''}chưa lưu được "${ten}": ${loi.vi}`,
      en: daLuu > 0
        ? `Saved ${daLuu} ${soIt(daLuu, 'row', 'rows')}, but could not save "${ten}": ${loi.en}`
        : `Could not save "${ten}": ${loi.en}`,
    }),
  });
  const khongSuaViTri: HaiThuTieng = { vi: 'Không sửa được vị trí này.', en: 'Could not update this location.' };
  const khongSuaLyDo: HaiThuTieng = { vi: 'Không sửa được lý do này.', en: 'Could not update this reason.' };
  for (const v of kh.viTriSua) {
    const { data, error } = await client.from('kho_vi_tri').update(v.dong).eq('id', v.id).select('id');
    if (error || !data?.length) return hong(error ? loiDb(error) : khongSuaViTri, v.ten);
    daLuu++;
  }
  for (const { o, ...v } of kh.viTriMoi) {
    const { error } = await client.from('kho_vi_tri').insert({ ...v, chi_nhanh_id: chiNhanhId });
    if (error) return hong(loiDb(error), v.ten);
    daLuu++;
    oMoiDaLuu.push(o);
  }
  for (const l of kh.lyDoSua) {
    const { data, error } = await client.from('kho_ly_do').update(l.dong).eq('id', l.id).select('id');
    if (error || !data?.length) return hong(error ? loiDb(error) : khongSuaLyDo, l.ten);
    daLuu++;
  }
  for (const { o, ...l } of kh.lyDoMoi) {
    const { error } = await client.from('kho_ly_do').insert({ ...l, thu_tu: 0, dang_dung: true });
    if (error) return hong(loiDb(error), l.ten);
    daLuu++;
    oMoiDaLuu.push(o);
  }
  return { oMoiDaLuu, ...kqHai(true, { vi: `Đã lưu ${daLuu} dòng.`, en: `Saved ${daLuu} ${soIt(daLuu, 'row', 'rows')}.` }) };
}
