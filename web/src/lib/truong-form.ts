/**
 * NHỮNG TRƯỜNG TÙY CHỌN CỦA FORM NỘP HỒ SƠ — mỗi tin tuyển dụng tự bật/tắt
 *
 * Một danh sách cho cả hai phía, để hai phía không lệch nhau: form công khai
 * dùng `lop` để ẩn ô, màn /noi-bo/tin-tuyen-dung dùng `ten` để dựng công tắc.
 * `cot` là cột trên vi_tri_tuyen_dung (migration 0025).
 *
 * Họ tên, số điện thoại và ô đồng ý KHÔNG nằm ở đây — chúng luôn có. Thiếu
 * hai cái đầu thì không liên lạc được; thiếu cái cuối thì không được lưu.
 */
export const TRUONG_FORM = [
  { cot: 'hoi_email',       lop: 'email',       ten: 'Email' },
  { cot: 'hoi_nam_sinh',    lop: 'nam-sinh',    ten: 'Năm sinh' },
  { cot: 'hoi_ca_lam',      lop: 'ca-lam',      ten: 'Ca làm được' },
  { cot: 'hoi_gioi_thieu',  lop: 'gioi-thieu',  ten: 'Đôi dòng giới thiệu' },
  { cot: 'hoi_kinh_nghiem', lop: 'kinh-nghiem', ten: 'Kinh nghiệm đã có' },
  { cot: 'hoi_cv',          lop: 'cv',          ten: 'File CV' },
] as const;

export type CotTruong = (typeof TRUONG_FORM)[number]['cot'];

/** Tin hỏi trường nào. Thiếu cột (database chưa chạy 0025) nghĩa là hỏi, như trước. */
export type TruongForm = Partial<Record<CotTruong, boolean>>;
