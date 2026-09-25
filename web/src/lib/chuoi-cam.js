/**
 * DANH SÁCH CHỮ CẤM — một nguồn, hai người dùng
 * =============================================
 *
 * Trước 0029 danh sách này nằm trong web/kiem-tra/quet-chuoi-cam.mjs và chỉ
 * máy quét đọc. Giờ có thêm người thứ hai: máy dịch. Bản dịch máy lên trang
 * KHÔNG qua mắt người, nên nó phải qua đúng bộ lọc mà máy quét dùng cho trang
 * thật — và "đúng bộ lọc" nghĩa là cùng một file, không phải một bản chép sẽ
 * lệch dần theo thời gian.
 *
 * File JavaScript thuần (kèm chuoi-cam.d.ts cho TypeScript) vì máy quét chạy
 * bằng node trần, không qua Vite. Đuôi .js chứ không .mjs/.d.mts: web/ đã là
 * "type": "module", và .gitignore của repo chỉ mở web/ theo những đuôi đã
 * liệt kê — .d.mts không có trong đó, nên file kiểu sẽ lặng lẽ không vào git.
 *
 * MỖI DÒNG KÈM LÝ DO. Khi phép thử đỏ, người đọc cần biết vì sao câu đó bị
 * cấm — nếu không họ sẽ xóa từ đó đi và viết lại cùng ý bằng chữ khác.
 *
 * Mẫu tiếng Anh và tiếng Hàn đứng CẠNH mẫu tiếng Việt cùng lý do, không tách
 * nhóm: luật là một ("không claim so sánh nhất"), chỉ cách viết khác nhau.
 * Máy dịch hay dịch "nướng" thành 숯불구이 (nướng than) vì đó là cách nói quen
 * của BBQ Hàn — trong khi nhà hàng nướng vỉ gas. Đó là lý do chính để bản dịch
 * phải đi qua đây.
 */

export const CAM = [
  { re: /unsplash|pexels|shutterstock/i,
    vi_sao: 'Ảnh kho. Mọi ảnh phải là ảnh thật, khai nguồn trong bảng tep_anh.' },
  { re: /0900[\s.]?000/i,
    vi_sao: 'Hotline mẫu của bản nháp cũ. Số thật vào khóa hotline trong cổng nội dung.' },
  { re: /\[s(ố|o) nh(à|a)\]|\[t(ê|e)n đường\]|\[placeholder\]/i,
    vi_sao: 'Chỗ trống chưa điền lọt ra trang. Chưa có địa chỉ thì ẨN, không hiện ngoặc vuông.' },
  { re: /wagyu|와규|\bMB\s?9\b|\bA5\b/i,
    vi_sao: 'Grade và giống bò chưa được xác nhận. Tài liệu thương hiệu cấm tự thêm.' },
  { re: /229[.,]000|199[.,]000/,
    vi_sao: 'Giá của một chiến dịch chưa duyệt. Không giá nào trong CSV nguồn được duyệt.' },
  { re: /43\s?ng(à|a)y|ủ\s?\d+\s?ng(à|a)y|\b43[\s-]?days?\b|aged\s+(for\s+)?\d+\s?days?|\d+\s?일\s?(간\s?)?숙성|숙성\s?\d+\s?일/i,
    vi_sao: 'Số ngày ủ là một claim cụ thể chưa ai xác nhận.' },
  { re: /than\s?hoa|than\s?củi|charcoal|숯/i,
    vi_sao: 'Nhà hàng nướng bằng vỉ gas, không phải than.' },
  { re: /ph(ò|o)ng\s?ri(ê|e)ng|private\s+room|프라이빗\s?룸|개별\s?룸|단독\s?룸|별실|개인실/i,
    vi_sao: 'Tiện ích chưa xác nhận. Hứa trên web rồi khách tới không có là lỗi nặng nhất.' },
  { re: /rẻ hơn|giá tốt hơn|tiết kiệm \d+%|cheaper than|lowest price|best price|best value|더\s?저렴|보다\s?저렴|최저가|가성비/i,
    vi_sao: 'Tài liệu thương hiệu cấm lấy lợi thế giá làm hook.' },
  { re: /số một|s(ố|o) 1 (về|ve)|duy nhất tại|best beef|ngon nhất|tốt nhất|\bthe best\b|number one|\bno\.\s?1\b|#1\b|most delicious|최고|넘버\s?원|유일한|가장\s?맛있/i,
    vi_sao: 'Claim so sánh nhất, không chứng minh được và vi phạm quảng cáo.' },
  { re: /đặt bàn thành công|booking confirmed|reservation confirmed|table (is )?(booked|reserved|confirmed)|예약\s?(이\s?)?(확정|완료)|예약되었습니다/i,
    vi_sao: 'Yêu cầu đặt bàn KHÁC với bàn đã giữ. Chỉ nói "đã nhận yêu cầu".' },
  { re: /c(ò|o)n \d+ b(à|a)n|chỉ c(ò|o)n \d+|only \d+ (tables?|seats?) left|\d+\s?(개\s?)?(테이블|자리|석)\s?(만\s?)?남/i,
    vi_sao: 'Hook khan hiếm. Số bàn trống bị chặn ở tầng server, không được tới trình duyệt.' },
  { re: /\d+(\.\d{3})+\s?(đ|vnđ|vnd|₫|동|원)|\d+(,\d{3})+\s?(đ|vnđ|vnd|₫|dong|동|원)/i,
    vi_sao: 'Giá tiền. Chưa món nào có gia_da_duyet = true.' },
];

/**
 * Tìm mọi mẫu cấm trong một đoạn chữ. Trả về mảng rỗng nếu sạch.
 * Mỗi mẫu báo tối đa ba chỗ khác nhau — đủ để người đọc thấy vấn đề, không
 * đủ để làm ngập màn hình khi một trang lặp một từ hai chục lần.
 */
export function timChuoiCam(chu) {
  const thay = [];
  for (const { re, vi_sao } of CAM) {
    const m = chu.match(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g'));
    if (m) thay.push({ tim_thay: [...new Set(m)].slice(0, 3).join(' · '), vi_sao });
  }
  return thay;
}
