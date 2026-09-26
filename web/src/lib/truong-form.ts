/**
 * NHỮNG TRƯỜNG TÙY CHỌN CỦA FORM NỘP HỒ SƠ — mỗi tin tuyển dụng tự bật/tắt
 *
 * Một danh sách cho cả hai phía, để hai phía không lệch nhau: form công khai
 * dùng `lop` để ẩn ô, màn /noi-bo/tin-tuyen-dung dùng `ten` để dựng công tắc.
 * `cot` là cột trên vi_tri_tuyen_dung (migration 0026).
 *
 * Họ tên, số điện thoại và ô đồng ý KHÔNG nằm ở đây — chúng luôn có. Thiếu
 * hai cái đầu thì không liên lạc được; thiếu cái cuối thì không được lưu.
 */
export const TRUONG_FORM = [
  { cot: 'hoi_email',       lop: 'email',       ten: { vi: 'Email',              en: 'Email' } },
  { cot: 'hoi_nam_sinh',    lop: 'nam-sinh',    ten: { vi: 'Năm sinh',           en: 'Year of birth' } },
  { cot: 'hoi_ca_lam',      lop: 'ca-lam',      ten: { vi: 'Ca làm được',        en: 'Available shifts' } },
  { cot: 'hoi_gioi_thieu',  lop: 'gioi-thieu',  ten: { vi: 'Đôi dòng giới thiệu', en: 'A few lines about yourself' } },
  { cot: 'hoi_kinh_nghiem', lop: 'kinh-nghiem', ten: { vi: 'Kinh nghiệm đã có',  en: 'Experience' } },
  { cot: 'hoi_cv',          lop: 'cv',          ten: { vi: 'File CV',            en: 'CV file' } },
] as const;

export type CotTruong = (typeof TRUONG_FORM)[number]['cot'];

/** Tin hỏi trường nào. Thiếu cột (database chưa chạy 0026) nghĩa là hỏi, như trước. */
export type TruongForm = Partial<Record<CotTruong, boolean>>;
