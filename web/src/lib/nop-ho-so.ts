/**
 * NHẬN HỒ SƠ ỨNG TUYỂN
 * ====================
 *
 * HỢP ĐỒNG XỬ LÝ LỖI — điều quan trọng nhất trong file này.
 *
 * Thứ ghi dữ liệu và thứ quyết định câu thông báo là CÙNG MỘT biểu thức
 * await. Không có đường nào để hàm này trả về ok: true mà database chưa ghi.
 *
 * Đây chính là chỗ website nháp cũ sai nặng nhất: nó gọi fetch với
 * mode:'no-cors' rồi bọc trong try/catch, nên mọi lượt gửi đều báo thành công
 * với khách và biến mất. Quy tắc 4 trong README cũ — "form không bao giờ được
 * chết trước mặt khách" — đã bị rút lại bằng văn bản vì nó là nguyên nhân.
 *
 * CV LÀ TÙY CHỌN, VÀ CHẶNG CV HỎNG KHÔNG ĐƯỢC LÀM HỎNG CẢ HỒ SƠ.
 * Phục vụ và phụ bếp ứng tuyển từ điện thoại thường không có file CV. Nên
 * nếu tải CV thất bại, hồ sơ VẪN được nộp không kèm CV, và câu trả lời nói
 * rõ điều đó — thay vì bắt người ta điền lại từ đầu vì một cái file.
 *
 * Từ 0026, tin nào không hỏi CV thì file gửi kèm bị bỏ qua, không tải lên.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TruongForm } from './truong-form';

export interface KetQuaNop {
  ok: boolean;
  ma?: string;
  cau: string;
  /** Hồ sơ đã nộp nhưng CV không lên được. Vẫn là ok: true. */
  luuY?: string;
}

const CV_TOI_DA = 5 * 1024 * 1024;   // khớp file_size_limit của kho ở 0014
const CV_KIEU = new Set([
  'application/pdf', 'image/jpeg', 'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/**
 * Bỏ mọi ký tự có thể làm đường dẫn kho lệch khỏi thư mục của vé — và mọi ký
 * tự Supabase Storage không nhận làm khóa. Kho CHỈ nhận ASCII: tên như
 * "CV Nguyễn Văn A.pdf" bị trả về "Invalid key", và chặng CV hỏng im lặng.
 * Nên bỏ DẤU chứ không bỏ CHỮ: ra "CV-Nguyen-Van-A.pdf".
 */
function tenTepAnToan(ten: string): string {
  const sach = ten
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // dấu thanh, mũ, móc, trăng
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')                 // đ không tách dấu được
    .replace(/[^A-Za-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-80);
  return sach || 'cv';
}

/**
 * Tải CV lên và trả về vé đã dùng.
 *
 * Trả về null cho mọi thất bại — hàm gọi sẽ nộp hồ sơ không kèm CV. Vé do
 * server cấp, hết hạn 15 phút, dùng một lần: id hồ sơ KHÔNG BAO GIỜ rời
 * database, nên anon không cầm được cái định danh cần giữ kín.
 */
async function taiCv(
  client: SupabaseClient, tep: File, ip: string | null,
): Promise<{ ve: string; ten: string } | null> {
  if (tep.size === 0 || tep.size > CV_TOI_DA) return null;
  if (!CV_KIEU.has(tep.type)) return null;

  const { data: ve, error } = await client.rpc('xin_phieu_tai_cv', { p_ip: ip });
  if (error || typeof ve !== 'string') return null;

  const ten = tenTepAnToan(tep.name);
  const { error: eTai } = await client.storage
    .from('ho-so-ung-tuyen')
    .upload(`${ve}/${ten}`, tep, { contentType: tep.type, upsert: false });

  return eTai ? null : { ve, ten };
}

/**
 * Tin này có hỏi CV không (0026).
 *
 * Không đọc được danh sách tin thì trả true, tức cứ tải như trước khi có
 * công tắc: làm mất CV của người ta tệ hơn một file thừa trong kho.
 */
async function tinHoiCv(client: SupabaseClient, viTri: string): Promise<boolean> {
  try {
    const { data, error } = await client.rpc('tin_tuyen_dung_cong_khai', { p_ngon_ngu: 'vi' });
    if (error || !Array.isArray(data)) return true;
    const tin = (data as ({ ma: string } & TruongForm)[]).find(v => v.ma === viTri);
    // Không thấy tin thì nop_ho_so_ung_tuyen() sẽ tự báo lỗi vị trí. Tải CV
    // lên lúc này chỉ để lại một file không hồ sơ nào trỏ tới.
    return tin !== undefined && tin.hoi_cv !== false;
  } catch {
    return true;
  }
}

export async function nopHoSo(
  client: SupabaseClient, form: FormData, ip: string | null,
): Promise<KetQuaNop> {
  const viTri = String(form.get('vi_tri') ?? '').trim();
  const hoTen = String(form.get('ho_ten') ?? '').trim();
  const sdt = String(form.get('sdt') ?? '').trim();

  if (!viTri) return { ok: false, cau: 'Vui lòng chọn vị trí muốn ứng tuyển.' };
  if (!hoTen)  return { ok: false, cau: 'Vui lòng điền họ tên.' };
  if (!sdt)    return { ok: false, cau: 'Vui lòng điền số điện thoại.' };
  if (form.get('dong_y') !== 'co') {
    return {
      ok: false,
      cau: 'Cần bạn đồng ý cho Beeftown lưu thông tin thì nhà hàng mới nhận hồ sơ được.',
    };
  }

  // Thời gian điền form, tính ở server từ mốc nhúng lúc dựng trang — nên nó
  // chạy cả khi trình duyệt tắt JavaScript.
  const moc = Number(form.get('moc') ?? 0);
  const giay = moc > 0 ? Math.floor((Date.now() - moc) / 1000) : null;

  const ca = form.getAll('ca').map(String).filter(Boolean);

  // Tải CV TRƯỚC khi nộp, vì nop_ho_so_ung_tuyen() cần mã vé. Hỏng thì bỏ
  // qua CV chứ không bỏ hồ sơ. Tin không hỏi CV thì không tải gì: database
  // sẽ bỏ vé, và file đã lên kho thì không hồ sơ nào trỏ tới, không việc dọn
  // nào xóa được.
  const tep = form.get('cv');
  let cv: { ve: string; ten: string } | null = null;
  let cvHong = false;
  if (tep instanceof File && tep.size > 0 && await tinHoiCv(client, viTri)) {
    cv = await taiCv(client, tep, ip);
    cvHong = cv === null;
  }

  const { data, error } = await client.rpc('nop_ho_so_ung_tuyen', {
    p_vi_tri_ma: viTri,
    p_ho_ten: hoTen,
    p_sdt: sdt,
    p_email: String(form.get('email') ?? '').trim() || null,
    p_nam_sinh: Number(form.get('nam_sinh')) || null,
    p_gioi_thieu: String(form.get('gioi_thieu') ?? '').trim() || null,
    p_kinh_nghiem: String(form.get('kinh_nghiem') ?? '').trim() || null,
    p_ca_lam_duoc: ca.length ? ca : null,
    p_ma_tai_len: cv?.ve ?? null,
    p_ten_tep: cv?.ten ?? null,
    p_dong_y: true,
    p_bay: String(form.get('website') ?? ''),   // honeypot
    p_giay_tren_form: giay,
    p_utm_source: String(form.get('utm_source') ?? '').trim() || null,
    p_utm_campaign: String(form.get('utm_campaign') ?? '').trim() || null,
    p_ip: ip,
  });

  if (error) {
    // Câu lỗi từ 0012 viết bằng tiếng Việt và đã tính tới việc hiện thẳng cho
    // ứng viên. Dùng nguyên văn; chỉ khi không nhận ra mới thay bằng câu chung.
    const m = error.message ?? '';
    return {
      ok: false,
      cau: /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(m)
        ? m
        : 'Chưa gửi được hồ sơ. Thông tin của bạn CHƯA được ghi nhận. Vui lòng thử lại.',
    };
  }

  return {
    ok: true,
    ma: typeof data === 'string' ? data : undefined,
    cau: 'Beeftown đã nhận hồ sơ của bạn.',
    luuY: cvHong
      ? 'File CV không tải lên được nên hồ sơ được nộp không kèm CV. Bạn có thể gửi CV sau khi nhà hàng gọi lại.'
      : undefined,
  };
}
