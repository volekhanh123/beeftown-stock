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
 *   · trigger vi_tri_kiem_tra() (0027, 0028): chỉ chủ nhà hàng và quản lý đổi
 *     được mức lương chính thức, kể cả đơn vị giờ/tháng; marketing chỉ ghi
 *     mức đề xuất.
 *
 * Giao diện chỉ ẩn nút cho gọn mắt — ai gọi thẳng vẫn bị database chặn.
 *
 * KHÔNG CÓ NÚT XÓA. Bảng không có policy DELETE, và hồ sơ ứng tuyển trỏ vào
 * tin bằng khóa ngoại `on delete restrict`. Tin không dùng nữa thì gỡ xuống.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { TRUONG_FORM, type CotTruong } from './truong-form';
import { BO_PHAN, LOAI_HOP_DONG, DON_VI_LUONG, MA_CHUA_CHOT } from './tuyen-dung';
import type { SoBanDich } from './ban-dich';
import { dichNB, type HaiThuTieng, type NgonNguNB } from './ngon-ngu-noi-bo';
import { dichCau } from './cau-noi-bo';

/**
 * Câu của file này ở hai thứ tiếng giao diện nội bộ. Mọi hàm trả câu cho người
 * đọc nhận thêm nn (mặc định tiếng Việt, như trước khi có tiếng Anh).
 */
const CAU = {
  caoBatThuong:  { vi: 'Từ một triệu đồng một giờ trở lên là cao bất thường — có phải lương tháng?',
                   en: 'One million dong or more per hour is unusually high — is this a monthly salary?' },
  thapBatThuong: { vi: 'Dưới một triệu đồng một tháng là thấp bất thường — có phải lương giờ?',
                   en: 'Under one million dong per month is unusually low — is this an hourly wage?' },
  chuaSach:      { vi: 'Chưa đăng được: tên, mô tả và yêu cầu bằng tiếng Việt phải viết xong — không để trống, không còn chữ trong ngoặc vuông kiểu [chờ duyệt].',
                   en: 'Cannot publish yet: the Vietnamese title, description and requirements must be finished — nothing empty, no bracketed text like [chờ duyệt] left.' },
  denNhoHonTu:   { vi: 'Mức lương "đến" phải lớn hơn hoặc bằng mức "từ".',
                   en: 'The "to" salary must be greater than or equal to the "from" salary.' },
  khongQuyen:    { vi: 'Tài khoản của bạn không có quyền làm việc này.', en: 'Your account is not allowed to do this.' },
  chuaTen:       { vi: 'Chưa điền tên tin.', en: 'The posting has no title.' },
  chuaBoPhan:    { vi: 'Chưa chọn bộ phận.', en: 'No department chosen.' },
  chuaLoai:      { vi: 'Chưa chọn loại hợp đồng.', en: 'No contract type chosen.' },
  khongTao:      { vi: 'Không tạo được tin.', en: 'Could not create the posting.' },
  trungTen:      { vi: 'Đã có nhiều tin trùng tên này. Đặt một tên khác.', en: 'Several postings already use this title. Choose another title.' },
  khongTaoMau:   { vi: 'Không tạo được tin mẫu.', en: 'Could not create the sample postings.' },
  daTaoMau:      { vi: (n: unknown) => `Đã tạo ${n} tin mẫu ở dạng nháp. Viết mô tả và yêu cầu cho tin cần tuyển rồi bấm đăng.`,
                   en: (n: unknown) => `Created ${n} sample postings as drafts. Write the description and requirements for the roles you are hiring for, then publish.` },
  soLuongSai:    { vi: 'Số lượng cần tuyển phải là số từ 1 đến 999.', en: 'Openings must be a number from 1 to 999.' },
  luongSai:      { vi: 'Mức lương đề xuất phải là số đồng, ví dụ 25000 hoặc 6000000.', en: 'The proposed salary must be a number of dong, for example 25000 or 6000000.' },
  deXuatDenTu:   { vi: 'Mức đề xuất "đến" phải lớn hơn hoặc bằng mức "từ".', en: 'The proposed "to" amount must be greater than or equal to "from".' },
  chuaDonVi:     { vi: 'Chưa chọn lương tính theo giờ hay theo tháng.', en: 'Choose whether the salary is per hour or per month.' },
  hanNopSai:     { vi: 'Hạn nộp không đúng dạng ngày.', en: 'The deadline is not a valid date.' },
  daLuu:         { vi: 'Đã lưu.', en: 'Saved.' },
  daLuuDang:     { vi: 'Đã lưu và đăng lên trang tuyển dụng.', en: 'Saved and published on the careers page.' },
  viecSai:       { vi: 'Việc không hợp lệ.', en: 'Invalid action.' },
  khongLuu:      { vi: 'Không lưu được.', en: 'Could not save.' },
  nguoiKhacSua:  { vi: 'Tin vừa được người khác sửa. Bạn đang thấy bản mình vừa gõ, CHƯA được lưu — bấm lưu lần nữa sẽ ghi đè bản của họ.',
                   en: 'Someone else just edited this posting. You are seeing what you typed, NOT saved yet — saving again will overwrite their version.' },
  khongSuaDuoc:  { vi: 'Tài khoản của bạn không sửa được tin này.', en: 'Your account cannot edit this posting.' },
  khongDocTin:   { vi: 'Không đọc được tin này.', en: 'Could not read this posting.' },
  suaSauKhiMo:   { vi: 'Tin vừa được sửa sau lúc bạn mở trang. Xem lại mức đề xuất mới rồi hẵng duyệt.',
                   en: 'The posting was edited after you opened the page. Check the new proposed salary before approving.' },
  chuaDeXuat:    { vi: 'Chưa có mức đề xuất nào để duyệt. Điền mức đề xuất và bấm Lưu trước.',
                   en: 'There is no proposed salary to approve. Enter one and press Save first.' },
  khongDuyet:    { vi: 'Không duyệt được.', en: 'Could not approve.' },
  taiLai:        { vi: 'Tin vừa được sửa sau lúc bạn mở trang. Tải lại trang rồi thử lại.', en: 'The posting was edited after you opened the page. Reload and try again.' },
  daDuyet:       { vi: 'Đã duyệt — trang tuyển dụng hiện mức lương này.', en: 'Approved — the careers page shows this salary.' },
  daBoDuyet:     { vi: 'Đã bỏ duyệt — trang tuyển dụng không hiện lương nữa.', en: 'Approval removed — the careers page no longer shows a salary.' },
  khongGo:       { vi: 'Không gỡ được tin.', en: 'Could not take the posting down.' },
  khongConDang:  { vi: 'Tin không còn đang đăng — có thể người khác vừa gỡ. Tải lại trang để xem.', en: 'The posting is no longer live — someone may have just taken it down. Reload to check.' },
  daGo:          { vi: 'Đã gỡ tin khỏi trang tuyển dụng. Hồ sơ đã nộp vào tin này vẫn còn nguyên.', en: 'Took the posting off the careers page. Applications already sent to it are kept.' },
} satisfies Record<string, HaiThuTieng<unknown>>;

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
  /** null = chưa chốt (0043). */
  loai_hop_dong: string | null;
  so_luong: number | null;
  mo_ta_vi: string | null;
  mo_ta_en: string | null;
  yeu_cau_vi: string | null;
  yeu_cau_en: string | null;
  quyen_loi_vi: string | null;
  quyen_loi_en: string | null;
  ca_lam: string | null;
  // Bản tiếng Hàn, và bản dịch của hai ô trước đây chỉ có tiếng Việt (0036).
  ten_ko: string | null;
  mo_ta_ko: string | null;
  yeu_cau_ko: string | null;
  quyen_loi_ko: string | null;
  ca_lam_en: string | null;
  ca_lam_ko: string | null;
  cap_bac_en: string | null;
  cap_bac_ko: string | null;
  /** Sổ bản dịch — trigger ghi_so_ban_dich() giữ, web chỉ đọc. */
  ban_dich: SoBanDich;
  luong_de_xuat_tu: number | null;
  luong_de_xuat_den: number | null;
  luong_de_xuat_don_vi: string;
  luong_tu: number | null;
  luong_den: number | null;
  luong_don_vi: string;
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
  /** Tên tiếng Anh (máy dịch hoặc sửa tay) — danh sách ở giao diện tiếng Anh hiện tên này. */
  ten_en: string | null;
  bo_phan: string;
  loai_hop_dong: string | null;
  trang_thai: TrangThaiTin;
  han_nop: string | null;
  luong_da_duyet: boolean;
  luong_tu: number | null;
  luong_den: number | null;
  luong_don_vi: string;
  luong_de_xuat_tu: number | null;
  luong_de_xuat_den: number | null;
  luong_de_xuat_don_vi: string;
  hoi_cv: boolean;
}

export interface ChiNhanh { id: string; ma: string; ten: string }

export interface KetQua { ok: boolean; cau: string }

/** Lưu hỏng thì trả kèm những gì người dùng vừa gõ, để màn hình không bắt gõ lại. */
export interface KetQuaLuu extends KetQua { daGo?: Partial<TinTuyenDung> }

// 0012 có nấc da_duyet; màn này không dùng tới, nên nó hiện như một bản nháp.
export const TRANG_THAI: Record<TrangThaiTin, { ten: HaiThuTieng; lop: string }> = {
  nhap:       { ten: { vi: 'Nháp',      en: 'Draft' },     lop: 'nhap' },
  da_duyet:   { ten: { vi: 'Nháp',      en: 'Draft' },     lop: 'nhap' },
  da_cong_bo: { ten: { vi: 'Đang đăng', en: 'Live' },      lop: 'song' },
  da_thu_hoi: { ten: { vi: 'Đã gỡ',     en: 'Taken down' }, lop: 'tat' },
};

/** Hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD — một chỗ duy nhất ở gio-vn.ts, khớp hom_nay_vn() của database. */
export { homNayVn } from './gio-vn.ts';

/**
 * Đơn vị chọn sẵn ở ô lương đề xuất. Tin chưa có mức đề xuất thì đơn vị đang
 * lưu chưa mang nghĩa gì (mặc định 'thang' của 0028), nên chọn theo loại hợp
 * đồng: bán thời gian thường trả theo giờ.
 */
export function donViDeXuat(
  t: Pick<TinTuyenDung, 'luong_de_xuat_tu' | 'luong_de_xuat_den' | 'luong_de_xuat_don_vi' | 'loai_hop_dong'>,
): string {
  if (t.luong_de_xuat_tu != null || t.luong_de_xuat_den != null) return t.luong_de_xuat_don_vi;
  return t.loai_hop_dong === 'ban_thoi_gian' ? 'gio' : 'thang';
}

/**
 * Câu nhắc khi con số và đơn vị lệch nhau — dấu hiệu quên đổi ô đơn vị. Chỉ
 * nhắc, không chặn: phụ cấp thực tập dưới một triệu một tháng vẫn có thật.
 */
export function canhBaoDonVi(
  tu: number | null, den: number | null, donVi: string, nn: NgonNguNB = 'vi',
): string | null {
  const cao = Math.max(tu ?? 0, den ?? 0);
  if (donVi === 'gio' && cao >= 1_000_000) return CAU.caoBatThuong[nn];
  if (donVi === 'thang' && cao > 0 && cao < 1_000_000) return CAU.thapBatThuong[nn];
  return null;
}

/** Câu lỗi cho người đọc. Câu của trigger 0027 viết sẵn bằng tiếng Việt, dùng nguyên văn. */
function cauLoi(e: { message?: string } | null, macDinh: string, nn: NgonNguNB): string {
  const m = e?.message ?? '';
  if (/vi_tri_cong_bo_phai_sach/.test(m)) return CAU.chuaSach[nn];
  if (/vi_tri_de_xuat_hop_le|vi_tri_luong_chi_khi_duyet/.test(m)) return CAU.denNhoHonTu[nn];
  if (/violates row-level security|permission denied for table/i.test(m)) return CAU.khongQuyen[nn];
  return m ? dichCau(nn, m) : macDinh;
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

/**
 * Loại hợp đồng từ form: một khóa của LOAI_HOP_DONG, null khi người soạn chọn
 * "Chưa chốt" (0043), undefined khi giá trị lạ hoặc thiếu.
 */
function docLoaiHopDong(form: FormData): string | null | undefined {
  const s = String(form.get('loai_hop_dong') ?? '');
  if (s === MA_CHUA_CHOT) return null;
  return s in LOAI_HOP_DONG ? s : undefined;
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
    .select('id, ten_vi, ten_en, bo_phan, loai_hop_dong, trang_thai, han_nop, luong_da_duyet, luong_tu, luong_den, luong_don_vi, luong_de_xuat_tu, luong_de_xuat_den, luong_de_xuat_don_vi, hoi_cv')
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
  client: SupabaseClient, form: FormData, chiNhanhId: string, nn: NgonNguNB = 'vi',
): Promise<{ ok: true; id: string } | { ok: false; cau: string }> {
  const t = dichNB(nn, CAU);
  const ten = chu(form, 'ten_vi');
  const boPhan = String(form.get('bo_phan') ?? '');
  const loai = docLoaiHopDong(form);
  if (!ten) return { ok: false, cau: t.chuaTen };
  if (!(boPhan in BO_PHAN)) return { ok: false, cau: t.chuaBoPhan };
  if (loai === undefined) return { ok: false, cau: t.chuaLoai };

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
        // Tin quản lý và marketing hỏi CV sẵn, như bốn tin mẫu ở 0026.
        hoi_cv: boPhan === 'quan_ly' || boPhan === 'marketing',
      })
      .select('id')
      .single();
    if (!error) return { ok: true, id: data.id };
    if (!/duplicate key|unique/i.test(error.message)) {
      return { ok: false, cau: cauLoi(error, t.khongTao, nn) };
    }
  }
  return { ok: false, cau: t.trungTen };
}

/** Tám tin mẫu ở dạng nháp (0012). Hàm database tự kiểm vai trò. */
export async function taoTinMau(client: SupabaseClient, chiNhanhId: string, nn: NgonNguNB = 'vi'): Promise<KetQua> {
  const { data, error } = await client.rpc('tao_tin_tuyen_dung_mau', { p_chi_nhanh_id: chiNhanhId });
  if (error) return { ok: false, cau: cauLoi(error, CAU.khongTaoMau[nn], nn) };
  return { ok: true, cau: CAU.daTaoMau[nn](data) };
}

// -----------------------------------------------------------------------------
// LƯU — một câu UPDATE cho mọi nút trong form soạn
// -----------------------------------------------------------------------------
/**
 * Các ô có bản dịch trên form soạn, theo thứ tự hiện trên màn hình. Khớp các
 * dòng vi_tri_tuyen_dung trong cot_ban_dich() của 0036: ô <cot> có bản dịch ở
 * <cot>_en và <cot>_ko.
 */
export const O_DICH = [
  { cot: 'ten',       ten: { vi: 'Tên vị trí',        en: 'Position title' },         dong: 1 },
  { cot: 'cap_bac',   ten: { vi: 'Cấp bậc, lộ trình', en: 'Level, career path' },     dong: 1 },
  { cot: 'ca_lam',    ten: { vi: 'Ca làm',            en: 'Shifts' },                 dong: 1 },
  { cot: 'mo_ta',     ten: { vi: 'Mô tả công việc',   en: 'Job description' },        dong: 4 },
  { cot: 'yeu_cau',   ten: { vi: 'Yêu cầu',           en: 'Requirements' },           dong: 3 },
  { cot: 'quyen_loi', ten: { vi: 'Quyền lợi',         en: 'Benefits' },               dong: 3 },
] as const;

/** So hai bản chữ như database so (chuan_ban_dich): bỏ \r và khoảng trắng hai đầu. */
function giongNhau(a: string | null, b: string | null): boolean {
  const c = (x: string | null) => (x ?? '').replace(/\r/g, '').trim();
  return c(a) === c(b);
}

function docForm(form: FormData, nn: NgonNguNB): { dong: Partial<TinTuyenDung>; loi: string | null } {
  const t = dichNB(nn, CAU);
  const boPhan = String(form.get('bo_phan') ?? '');
  const loai = docLoaiHopDong(form);
  const soLuong = soNguyen(form, 'so_luong', 999);
  const tu = soNguyen(form, 'luong_de_xuat_tu', 1_000_000_000);
  const den = soNguyen(form, 'luong_de_xuat_den', 1_000_000_000);
  const donVi = String(form.get('luong_de_xuat_don_vi') ?? '');
  const hanNop = chu(form, 'han_nop');

  const dong: Partial<TinTuyenDung> = {
    ten_vi: chu(form, 'ten_vi') ?? '',
    bo_phan: boPhan,
    cap_bac: chu(form, 'cap_bac'),
    loai_hop_dong: loai ?? null,
    so_luong: soLuong ?? null,
    han_nop: hanNop,
    mo_ta_vi: chu(form, 'mo_ta_vi'),
    yeu_cau_vi: chu(form, 'yeu_cau_vi'),
    quyen_loi_vi: chu(form, 'quyen_loi_vi'),
    ca_lam: chu(form, 'ca_lam'),
    luong_de_xuat_tu: tu ?? null,
    luong_de_xuat_den: den ?? null,
    luong_de_xuat_don_vi: donVi,
  };
  // Ô không tích thì trình duyệt không gửi gì — vắng mặt nghĩa là tắt.
  for (const f of TRUONG_FORM) {
    (dong as Record<CotTruong, boolean>)[f.cot] = form.get(f.cot) === 'co';
  }

  // Ô dịch chỉ vào câu UPDATE khi người dùng THẬT SỰ sửa nó so với lúc mở màn
  // hình (ô ẩn goc_…). Máy dịch chạy nền có thể đã ghi bản mới trong lúc form
  // còn mở; gửi lại nguyên chữ cũ của form là đè mất bản đó — và trigger còn
  // ghi nhận chữ cũ ấy là "bản sửa tay" của câu gốc mới, sai hẳn.
  for (const o of O_DICH) {
    for (const l of ['en', 'ko'] as const) {
      const ten = `${o.cot}_${l}` as keyof TinTuyenDung;
      if (form.get(ten) === null) continue;
      const moi = chu(form, ten);
      if (!giongNhau(moi, chu(form, `goc_${ten}`))) {
        (dong as Record<string, unknown>)[ten] = moi;
      }
    }
  }

  let loi: string | null = null;
  if (!dong.ten_vi) loi = t.chuaTen;
  else if (!(boPhan in BO_PHAN)) loi = t.chuaBoPhan;
  else if (loai === undefined) loi = t.chuaLoai;
  else if (soLuong === undefined || soLuong === 0) loi = t.soLuongSai;
  else if (tu === undefined || den === undefined) loi = t.luongSai;
  else if (tu != null && den != null && den < tu) loi = t.deXuatDenTu;
  else if (!(donVi in DON_VI_LUONG)) loi = t.chuaDonVi;
  else if (hanNop && !/^\d{4}-\d{2}-\d{2}$/.test(hanNop)) loi = t.hanNopSai;

  return { dong, loi };
}

const CAU_XONG: Record<string, keyof typeof CAU> = {
  luu: 'daLuu',
  luu_dang: 'daLuuDang',
};

/**
 * Lưu mọi ô của form soạn; nút "Lưu và đăng" thì đăng luôn trong CÙNG câu
 * UPDATE, để nội dung và trạng thái không bao giờ lệch nhau.
 */
export async function luuTin(
  client: SupabaseClient, id: string, form: FormData, nn: NgonNguNB = 'vi',
): Promise<KetQuaLuu> {
  const t = dichNB(nn, CAU);
  const viec = String(form.get('viec') ?? 'luu');
  if (!(viec in CAU_XONG)) return { ok: false, cau: t.viecSai };

  const { dong, loi } = docForm(form, nn);
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

  if (error) return { ok: false, cau: cauLoi(error, t.khongLuu, nn), daGo: dong };
  if (!data || data.length === 0) {
    const { data: hienTai } = await client
      .from('vi_tri_tuyen_dung')
      .select('updated_at')
      .eq('id', id)
      .maybeSingle();
    return {
      ok: false,
      daGo: dong,
      cau: hienTai && hienTai.updated_at !== phienBan ? t.nguoiKhacSua : t.khongSuaDuoc,
    };
  }
  return { ok: true, cau: String(t[CAU_XONG[viec]]) };
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
  client: SupabaseClient, id: string, phienBan: string, duyet: boolean, nn: NgonNguNB = 'vi',
): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const { data: tin } = await client
    .from('vi_tri_tuyen_dung')
    .select('luong_de_xuat_tu, luong_de_xuat_den, luong_de_xuat_don_vi, updated_at')
    .eq('id', id)
    .maybeSingle();
  if (!tin) return { ok: false, cau: t.khongDocTin };
  if (tin.updated_at !== phienBan) return { ok: false, cau: t.suaSauKhiMo };
  if (duyet && tin.luong_de_xuat_tu == null && tin.luong_de_xuat_den == null) {
    return { ok: false, cau: t.chuaDeXuat };
  }

  const { data, error } = await client
    .from('vi_tri_tuyen_dung')
    .update(duyet
      ? { luong_tu: tin.luong_de_xuat_tu, luong_den: tin.luong_de_xuat_den,
          luong_don_vi: tin.luong_de_xuat_don_vi, luong_da_duyet: true }
      : { luong_tu: null, luong_den: null, luong_da_duyet: false })
    .eq('id', id)
    .eq('updated_at', phienBan)
    .select('id');
  if (error) return { ok: false, cau: cauLoi(error, t.khongDuyet, nn) };
  if (!data || data.length === 0) return { ok: false, cau: t.taiLai };
  return { ok: true, cau: duyet ? t.daDuyet : t.daBoDuyet };
}

/** Gỡ tin khỏi trang. Không đụng nội dung, nên không cần kiểm phiên bản. */
export async function goTin(client: SupabaseClient, id: string, nn: NgonNguNB = 'vi'): Promise<KetQua> {
  const t = dichNB(nn, CAU);
  const { data, error } = await client
    .from('vi_tri_tuyen_dung')
    .update({ trang_thai: 'da_thu_hoi' })
    .eq('id', id)
    .eq('trang_thai', 'da_cong_bo')
    .select('id');
  if (error) return { ok: false, cau: cauLoi(error, t.khongGo, nn) };
  if (!data || data.length === 0) return { ok: false, cau: t.khongConDang };
  return { ok: true, cau: t.daGo };
}
