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
import type { NgonNgu } from './noi-dung';
import { cauLoiDatabase, laLoiDatabase, dich, type BaThuTieng } from './chu.ts';

export interface KetQuaNop {
  ok: boolean;
  ma?: string;
  cau: string;
  /** Hồ sơ đã nộp nhưng CV không lên được. Vẫn là ok: true. */
  luuY?: string;
}

/**
 * Câu trả lời cho ứng viên, ở cả ba thứ tiếng. xu-ly-form.ts dùng lại bảng
 * này cho câu đọc từ cookie sau khi chuyển hướng, để hai nơi không nói hai
 * câu khác nhau.
 */
export const CAU_NOP = {
  thieuViTri: {
    vi: 'Vui lòng chọn vị trí muốn ứng tuyển.',
    en: 'Please choose the role you are applying for.',
    ko: '지원하실 포지션을 선택해 주세요.',
  },
  thieuHoTen: {
    vi: 'Vui lòng điền họ tên.',
    en: 'Please enter your full name.',
    ko: '이름을 입력해 주세요.',
  },
  thieuSdt: {
    vi: 'Vui lòng điền số điện thoại.',
    en: 'Please enter your phone number.',
    ko: '전화번호를 입력해 주세요.',
  },
  thieuDongY: {
    vi: 'Cần bạn đồng ý cho Beeftown lưu thông tin thì nhà hàng mới nhận hồ sơ được.',
    en: 'Beeftown can only accept your application if you agree to let us store your information.',
    ko: 'Beeftown이 정보를 보관하는 데 동의해 주셔야 지원서를 받을 수 있어요.',
  },
  chuaGhi: {
    vi: 'Chưa gửi được hồ sơ. Thông tin của bạn CHƯA được ghi nhận. Vui lòng thử lại.',
    en: 'Your application could not be sent. Your details have NOT been recorded. Please try again.',
    ko: '지원서를 보내지 못했어요. 입력하신 정보는 아직 접수되지 않았어요. 다시 시도해 주세요.',
  },
  daNhan: {
    vi: 'Beeftown đã nhận hồ sơ của bạn.',
    en: 'Beeftown has received your application.',
    ko: 'Beeftown에 지원서가 접수되었어요.',
  },
  cvHong: {
    vi: 'File CV không tải lên được nên hồ sơ được nộp không kèm CV. Bạn có thể gửi CV sau khi nhà hàng gọi lại.',
    en: 'Your CV file could not be uploaded, so your application was sent without it. You can send your CV after we call you back.',
    ko: '이력서 파일을 올리지 못해 이력서 없이 지원서가 제출되었어요. 매장에서 다시 전화드린 뒤에 이력서를 보내 주셔도 돼요.',
  },
} as const satisfies Record<string, BaThuTieng>;

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
  client: SupabaseClient, form: FormData, ip: string | null, ngonNgu: NgonNgu,
): Promise<KetQuaNop> {
  const cau = dich(ngonNgu, CAU_NOP);
  const viTri = String(form.get('vi_tri') ?? '').trim();
  const hoTen = String(form.get('ho_ten') ?? '').trim();
  const sdt = String(form.get('sdt') ?? '').trim();

  if (!viTri) return { ok: false, cau: cau.thieuViTri };
  if (!hoTen)  return { ok: false, cau: cau.thieuHoTen };
  if (!sdt)    return { ok: false, cau: cau.thieuSdt };
  if (form.get('dong_y') !== 'co') {
    return { ok: false, cau: cau.thieuDongY };
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
    // Đứt mạng / hết giờ / cổng 502–504: supabase-js không ném mà trả error
    // không có mã. Hồ sơ có thể đã ghi xong rồi mới đứt — ném để
    // xu-ly-form.ts nói "KHÔNG CHẮC", không bao giờ nói "CHƯA được ghi nhận"
    // (ứng viên sẽ nộp lại và có hai bản). Xem laLoiDatabase().
    if (!laLoiDatabase(error)) {
      throw new Error(`nop_ho_so_ung_tuyen: không nghe được trả lời — ${error.message ?? ''}`);
    }
    // Câu lỗi từ 0012 viết bằng tiếng Việt và đã tính tới việc hiện thẳng cho
    // ứng viên. Trang tiếng Việt dùng nguyên văn, trang khác nhận bản dịch;
    // chỉ khi không nhận ra mới thay bằng câu chung — xem cauLoiDatabase().
    return { ok: false, cau: cauLoiDatabase(error.message ?? '', ngonNgu, cau.chuaGhi) };
  }

  // Ghi được thì LUÔN có mã hồ sơ (0026; bẫy bot là exception, không phải
  // null). Không lỗi mà cũng không có mã — thân trả lời rỗng; supabase-js biến
  // 404 thân rỗng thành 204 — là database chưa xác nhận gì: không nói "đã nhận".
  if (typeof data !== 'string' || !data) throw new Error('nop_ho_so_ung_tuyen: trả lời không có mã hồ sơ');
  return {
    ok: true,
    ma: data,
    cau: cau.daNhan,
    luuY: cvHong ? cau.cvHong : undefined,
  };
}
