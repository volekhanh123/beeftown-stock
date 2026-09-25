/**
 * SOẠN TIN TUYỂN DỤNG — đọc, tạo, lưu, đăng, gỡ, duyệt lương
 *
 * Trước đây tin tuyển dụng chỉ sửa được bằng SQL. Nhưng tin đổi thường
 * xuyên — mở tuyển, đóng tuyển, đổi ca, đổi mức lương — và bắt người ta mở
 * SQL Editor mỗi lần là bắt họ phụ thuộc lập trình viên cho một việc điền
 * vào ô (cùng lý do với lib/cai-dat.ts).
 *
 * QUYỀN DO DATABASE QUYẾT ĐỊNH, KHÔNG PHẢI FILE NÀY
 *
 *   · policy vi_tri_them / vi_tri_sua (0012): chủ nhà hàng, quản lý và
 *     marketing soạn, đăng, gỡ được tin ở chi nhánh của mình.
 *   · trigger vi_tri_kiem_tra() (0026): chỉ chủ nhà hàng và quản lý đổi được
 *     mức lương chính thức; marketing chỉ ghi mức đề xuất.
 *
 * Giao diện chỉ ẩn nút cho gọn mắt — ai gọi thẳng vẫn bị database chặn.
 *
 * KHÔNG CÓ NÚT XÓA. Bảng không có policy DELETE, và hồ sơ ứng tuyển trỏ vào
 * tin bằng khóa ngoại `on delete restrict`. Tin không dùng nữa thì gỡ xuống.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { TRUONG_FORM, type CotTruong } from './truong-form';
import { BO_PHAN, LOAI_HOP_DONG } from './tuyen-dung';

export type TrangThaiTin = 'nhap' | 'da_duyet' | 'da_cong_bo' | 'da_thu_hoi';

/** Một dòng vi_tri_tuyen_dung. test-hop-dong-web.mjs kiểm mọi khóa ở đây là cột thật. */
export interface TinTuyenDung {
  id: string;
  ma: string;
  chi_nhanh_id: string;
  ten_vi: string;
  ten_en: string | null;
  bo_phan: string;
  cap_bac: string | null;
  loai_hop_dong: string;
  so_luong: number | null;
  mo_ta_vi: string | null;
  mo_ta_en: string | null;
  yeu_cau_vi: string | null;
  yeu_cau_en: string | null;
  quyen_loi_vi: string | null;
  quyen_loi_en: string | null;
  ca_lam: string | null;
  luong_de_xuat_tu: number | null;
  luong_de_xuat_den: number | null;
  luong_tu: number | null;
  luong_den: number | null;
  luong_da_duyet: boolean;
  luong_duyet_luc: string | null;
  han_nop: string | null;
  trang_thai: TrangThaiTin;
  cong_bo_luc: string | null;
  updated_at: string;
  hoi_email: boolean;
  hoi_nam_sinh: boolean;
  hoi_ca_lam: boolean;
  hoi_gioi_thieu: boolean;
  hoi_kinh_nghiem: boolean;
  hoi_cv: boolean;
}

/** Một thẻ trong danh sách tin. */
export interface DongTin {
  id: string;
  ten_vi: string;
  bo_phan: string;
  loai_hop_dong: string;
  trang_thai: TrangThaiTin;
  han_nop: string | null;
  luong_da_duyet: boolean;
  luong_tu: number | null;
  luong_den: number | null;
  luong_de_xuat_tu: number | null;
  luong_de_xuat_den: number | null;
  hoi_cv: boolean;
}

export interface ChiNhanh { id: string; ma: string; ten: string }

export interface KetQua { ok: boolean; cau: string }

/** Lưu hỏng thì trả kèm những gì người dùng vừa gõ, để màn hình không bắt gõ lại. */
export interface KetQuaLuu extends KetQua { daGo?: Partial<TinTuyenDung> }

// 0012 có nấc da_duyet; màn này không dùng tới, nên nó hiện như một bản nháp.
export const TRANG_THAI: Record<TrangThaiTin, { ten: string; lop: string }> = {
  nhap:       { ten: 'Nháp',      lop: 'nhap' },
  da_duyet:   { ten: 'Nháp',      lop: 'nhap' },
  da_cong_bo: { ten: 'Đang đăng', lop: 'song' },
  da_thu_hoi: { ten: 'Đã gỡ',     lop: 'tat' },
};

/** Hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD — khớp hom_nay_vn() của database. */
export function homNayVn(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Câu lỗi cho người đọc. Câu của trigger 0026 viết sẵn bằng tiếng Việt, dùng nguyên văn. */
function cauLoi(e: { message?: string } | null, macDinh: string): string {
  const m = e?.message ?? '';
  if (/vi_tri_cong_bo_phai_sach/.test(m)) {
    return 'Chưa đăng được: tên, mô tả và yêu cầu bằng tiếng Việt phải viết xong — không để trống, không còn chữ trong ngoặc vuông kiểu [chờ duyệt].';
  }
  if (/vi_tri_de_xuat_hop_le|vi_tri_luong_chi_khi_duyet/.test(m)) {
    return 'Mức lương "đến" phải lớn hơn hoặc bằng mức "từ".';
  }
  if (/violates row-level security|permission denied for table/i.test(m)) {
    return 'Tài khoản của bạn không có quyền làm việc này.';
  }
  return m || macDinh;
}

/** Mã tin từ tên: không dấu, chữ thường, gạch nối — "Phụ bếp ca tối" thành "phu-bep-ca-toi". */
function taoMa(ten: string): string {
  const khongDau = [...ten.normalize('NFD')]
    .filter(c => { const p = c.codePointAt(0)!; return p < 0x300 || p > 0x36f; })
    .join('')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
  return khongDau.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'tin';
}

function chu(form: FormData, ten: string): string | null {
  const s = String(form.get(ten) ?? '').trim();
  return s || null;
}

/** Số nguyên không âm, bỏ qua dấu chấm phân cách. null = để trống, undefined = gõ sai. */
function soNguyen(form: FormData, ten: string, toiDa: number): number | null | undefined {
  const s = String(form.get(ten) ?? '').replace(/[.,\s]/g, '');
  if (!s) return null;
  if (!/^\d+$/.test(s)) return undefined;
  const n = Number(s);
  return n <= toiDa ? n : undefined;
}

// -----------------------------------------------------------------------------
// ĐỌC
// -----------------------------------------------------------------------------
export async function docChiNhanh(client: SupabaseClient): Promise<ChiNhanh[]> {
  const { data } = await client.from('chi_nhanh').select('id, ma, ten').order('ma');
  return (data ?? []) as ChiNhanh[];
}

/** Tin đang đăng lên đầu, rồi bản nháp, rồi tin đã gỡ. */
export async function docDanhSach(client: SupabaseClient): Promise<DongTin[]> {
  const { data, error } = await client
    .from('vi_tri_tuyen_dung')
    .select('id, ten_vi, bo_phan, loai_hop_dong, trang_thai, han_nop, luong_da_duyet, luong_tu, luong_den, luong_de_xuat_tu, luong_de_xuat_den, hoi_cv')
    .order('ten_vi');
  if (error) throw new Error(error.message);
  const thuTu: Record<TrangThaiTin, number> = { da_cong_bo: 0, nhap: 1, da_duyet: 1, da_thu_hoi: 2 };
  return ((data ?? []) as DongTin[]).sort((a, b) => thuTu[a.trang_thai] - thuTu[b.trang_thai]);
}

export async function docTin(client: SupabaseClient, id: string): Promise<TinTuyenDung | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await client
    .from('vi_tri_tuyen_dung')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as TinTuyenDung) ?? null;
}

// -----------------------------------------------------------------------------
// TẠO
// -----------------------------------------------------------------------------
/**
 * Tạo tin mới ở dạng nháp. Mã tin sinh từ tên và KHÔNG sửa được về sau: nó là
 * giá trị form công khai gửi lên, nên đổi mã của một tin đang đăng là làm hỏng
 * mọi form người ta đã mở sẵn.
 */
export async function taoTin(
  client: SupabaseClient, form: FormData, chiNhanhId: string,
): Promise<{ ok: true; id: string } | { ok: false; cau: string }> {
  const ten = chu(form, 'ten_vi');
  const boPhan = String(form.get('bo_phan') ?? '');
  const loai = String(form.get('loai_hop_dong') ?? '');
  if (!ten) return { ok: false, cau: 'Chưa điền tên tin.' };
  if (!(boPhan in BO_PHAN)) return { ok: false, cau: 'Chưa chọn bộ phận.' };
  if (!(loai in LOAI_HOP_DONG)) return { ok: false, cau: 'Chưa chọn loại hợp đồng.' };

  // Mã là duy nhất trên MỌI chi nhánh, kể cả những chi nhánh RLS giấu khỏi
  // người đang tạo — nên không đọc trước được, chỉ thử rồi đổi đuôi.
  const goc = taoMa(ten);
  for (let lan = 1; lan <= 5; lan++) {
    const { data, error } = await client
      .from('vi_tri_tuyen_dung')
      .insert({
        chi_nhanh_id: chiNhanhId,
        ma: lan === 1 ? goc : `${goc}-${lan}`,
        ten_vi: ten,
        bo_phan: boPhan,
        loai_hop_dong: loai,
        // Tin quản lý và marketing hỏi CV sẵn, như bốn tin mẫu ở 0025.
        hoi_cv: boPhan === 'quan_ly' || boPhan === 'marketing',
      })
      .select('id')
      .single();
    if (!error) return { ok: true, id: data.id };
    if (!/duplicate key|unique/i.test(error.message)) {
      return { ok: false, cau: cauLoi(error, 'Không tạo được tin.') };
    }
  }
  return { ok: false, cau: 'Đã có nhiều tin trùng tên này. Đặt một tên khác.' };
}

/** Tám tin mẫu ở dạng nháp (0012). Hàm database tự kiểm vai trò. */
export async function taoTinMau(client: SupabaseClient, chiNhanhId: string): Promise<KetQua> {
  const { data, error } = await client.rpc('tao_tin_tuyen_dung_mau', { p_chi_nhanh_id: chiNhanhId });
  if (error) return { ok: false, cau: cauLoi(error, 'Không tạo được tin mẫu.') };
  return {
    ok: true,
    cau: `Đã tạo ${data} tin mẫu ở dạng nháp. Viết mô tả và yêu cầu cho tin cần tuyển rồi bấm đăng.`,
  };
}

// -----------------------------------------------------------------------------
// LƯU — một câu UPDATE cho mọi nút trong form soạn
// -----------------------------------------------------------------------------
function docForm(form: FormData): { dong: Partial<TinTuyenDung>; loi: string | null } {
  const boPhan = String(form.get('bo_phan') ?? '');
  const loai = String(form.get('loai_hop_dong') ?? '');
  const soLuong = soNguyen(form, 'so_luong', 999);
  const tu = soNguyen(form, 'luong_de_xuat_tu', 1_000_000_000);
  const den = soNguyen(form, 'luong_de_xuat_den', 1_000_000_000);
  const hanNop = chu(form, 'han_nop');

  const dong: Partial<TinTuyenDung> = {
    ten_vi: chu(form, 'ten_vi') ?? '',
    ten_en: chu(form, 'ten_en'),
    bo_phan: boPhan,
    cap_bac: chu(form, 'cap_bac'),
    loai_hop_dong: loai,
    so_luong: soLuong ?? null,
    han_nop: hanNop,
    mo_ta_vi: chu(form, 'mo_ta_vi'),
    mo_ta_en: chu(form, 'mo_ta_en'),
    yeu_cau_vi: chu(form, 'yeu_cau_vi'),
    yeu_cau_en: chu(form, 'yeu_cau_en'),
    quyen_loi_vi: chu(form, 'quyen_loi_vi'),
    quyen_loi_en: chu(form, 'quyen_loi_en'),
    ca_lam: chu(form, 'ca_lam'),
    luong_de_xuat_tu: tu ?? null,
    luong_de_xuat_den: den ?? null,
  };
  // Ô không tích thì trình duyệt không gửi gì — vắng mặt nghĩa là tắt.
  for (const f of TRUONG_FORM) {
    (dong as Record<CotTruong, boolean>)[f.cot] = form.get(f.cot) === 'co';
  }

  let loi: string | null = null;
  if (!dong.ten_vi) loi = 'Chưa điền tên tin.';
  else if (!(boPhan in BO_PHAN)) loi = 'Chưa chọn bộ phận.';
  else if (!(loai in LOAI_HOP_DONG)) loi = 'Chưa chọn loại hợp đồng.';
  else if (soLuong === undefined || soLuong === 0) loi = 'Số lượng cần tuyển phải là số từ 1 đến 999.';
  else if (tu === undefined || den === undefined) loi = 'Mức lương đề xuất phải là số đồng, ví dụ 6000000.';
  else if (tu != null && den != null && den < tu) loi = 'Mức đề xuất "đến" phải lớn hơn hoặc bằng mức "từ".';
  else if (hanNop && !/^\d{4}-\d{2}-\d{2}$/.test(hanNop)) loi = 'Hạn nộp không đúng dạng ngày.';

  return { dong, loi };
}

const CAU_XONG: Record<string, string> = {
  luu: 'Đã lưu.',
  luu_dang: 'Đã lưu và đăng lên trang tuyển dụng.',
};

/**
 * Lưu mọi ô của form soạn; nút "Lưu và đăng" thì đăng luôn trong CÙNG câu
 * UPDATE, để nội dung và trạng thái không bao giờ lệch nhau.
 */
export async function luuTin(client: SupabaseClient, id: string, form: FormData): Promise<KetQuaLuu> {
  const viec = String(form.get('viec') ?? 'luu');
  if (!(viec in CAU_XONG)) return { ok: false, cau: 'Việc không hợp lệ.' };

  const { dong, loi } = docForm(form);
  if (loi) return { ok: false, cau: loi, daGo: dong };
  if (viec === 'luu_dang') dong.trang_thai = 'da_cong_bo';

  // Chống hai người cùng sửa: chỉ ghi khi dòng còn đúng phiên bản lúc mở màn hình.
  const phienBan = String(form.get('phien_ban') ?? '');
  const { data, error } = await client
    .from('vi_tri_tuyen_dung')
    .update(dong)
    .eq('id', id)
    .eq('updated_at', phienBan)
    .select('id');

  if (error) return { ok: false, cau: cauLoi(error, 'Không lưu được.'), daGo: dong };
  if (!data || data.length === 0) {
    const { data: hienTai } = await client
      .from('vi_tri_tuyen_dung')
      .select('updated_at')
      .eq('id', id)
      .maybeSingle();
    return {
      ok: false,
      daGo: dong,
      cau: hienTai && hienTai.updated_at !== phienBan
        ? 'Tin vừa được người khác sửa. Bạn đang thấy bản mình vừa gõ, CHƯA được lưu — bấm lưu lần nữa sẽ ghi đè bản của họ.'
        : 'Tài khoản của bạn không sửa được tin này.',
    };
  }
  return { ok: true, cau: CAU_XONG[viec] };
}

/**
 * Duyệt, hoặc bỏ duyệt, mức lương ĐÃ LƯU.
 *
 * Tách khỏi form soạn vì hai lẽ. Một: người duyệt phải duyệt đúng con số đang
 * thấy trên màn hình, nên mức đề xuất vừa bị ai sửa sau lúc mở trang thì từ
 * chối. Hai: nút duyệt nằm chung form thì một cú Enter ở ô tên có thể bấm
 * trúng nó — trình duyệt bấm nút submit ĐẦU TIÊN của form.
 */
export async function duyetLuong(
  client: SupabaseClient, id: string, phienBan: string, duyet: boolean,
): Promise<KetQua> {
  const { data: tin } = await client
    .from('vi_tri_tuyen_dung')
    .select('luong_de_xuat_tu, luong_de_xuat_den, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (!tin) return { ok: false, cau: 'Không đọc được tin này.' };
  if (tin.updated_at !== phienBan) {
    return { ok: false, cau: 'Tin vừa được sửa sau lúc bạn mở trang. Xem lại mức đề xuất mới rồi hẵng duyệt.' };
  }
  if (duyet && tin.luong_de_xuat_tu == null && tin.luong_de_xuat_den == null) {
    return { ok: false, cau: 'Chưa có mức đề xuất nào để duyệt. Điền mức đề xuất và bấm Lưu trước.' };
  }

  const { data, error } = await client
    .from('vi_tri_tuyen_dung')
    .update(duyet
      ? { luong_tu: tin.luong_de_xuat_tu, luong_den: tin.luong_de_xuat_den, luong_da_duyet: true }
      : { luong_tu: null, luong_den: null, luong_da_duyet: false })
    .eq('id', id)
    .eq('updated_at', phienBan)
    .select('id');
  if (error) return { ok: false, cau: cauLoi(error, 'Không duyệt được.') };
  if (!data || data.length === 0) {
    return { ok: false, cau: 'Tin vừa được sửa sau lúc bạn mở trang. Tải lại trang rồi thử lại.' };
  }
  return {
    ok: true,
    cau: duyet
      ? 'Đã duyệt — trang tuyển dụng hiện mức lương này.'
      : 'Đã bỏ duyệt — trang tuyển dụng không hiện lương nữa.',
  };
}

/** Gỡ tin khỏi trang. Không đụng nội dung, nên không cần kiểm phiên bản. */
export async function goTin(client: SupabaseClient, id: string): Promise<KetQua> {
  const { data, error } = await client
    .from('vi_tri_tuyen_dung')
    .update({ trang_thai: 'da_thu_hoi' })
    .eq('id', id)
    .eq('trang_thai', 'da_cong_bo')
    .select('id');
  if (error) return { ok: false, cau: cauLoi(error, 'Không gỡ được tin.') };
  if (!data || data.length === 0) {
    return { ok: false, cau: 'Tin không còn đang đăng — có thể người khác vừa gỡ. Tải lại trang để xem.' };
  }
  return { ok: true, cau: 'Đã gỡ tin khỏi trang tuyển dụng. Hồ sơ đã nộp vào tin này vẫn còn nguyên.' };
}
