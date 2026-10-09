# Beeftown — hướng dẫn cho Codex và các agent khác

Phiên Claude đọc `CLAUDE.md`. Codex và các agent khác đọc file này. Hai file cùng một quy trình:
**`CLAUDE.md` là bản gốc**, file này chỉ trỏ tới và thêm phần quy tắc rà soát pull request (PR).
Khi hai file nói khác nhau thì làm theo `CLAUDE.md` và báo chỗ lệch trong PR.

## Đọc trước khi làm

| File | Có gì |
|---|---|
| `CLAUDE.md` | Quy trình bắt buộc: cách chạy kiểm thử, 9 mục "định nghĩa xong", việc trước khi mở PR, các điều không bao giờ làm |
| `README.md` | Concept, giọng văn, các cảnh báo về bản nháp cũ, việc còn phải làm |
| `THUONG-HIEU.md` | Bảng màu thương hiệu Khánh chốt 09/10/2026 và phần website chưa đổi theo |
| `web/THIET-KE.md` | Giao diện trang công khai đang chạy: màu theo vai, chữ, thành phần |
| `web/src/lib/chuoi-cam.js` | Danh sách chữ cấm trên trang công khai, kèm lý do |

## Khi viết mã

- Làm đúng `CLAUDE.md`: tên hàm, biến, chú thích, tài liệu viết tiếng Việt không tắt; kiểm thử viết trước khi sửa lỗi; điền đủ mẫu PR.
- `.gitignore` chặn hết rồi mở từng file. File mới phải có dòng `!đường-dẫn`; kiểm bằng `git status --short`.
- `CLAUDE.md` yêu cầu chạy `/code-review`, là lệnh của Claude. Agent khác thay bằng việc tự rà soát diff so với `origin/main` theo mục "Code Review Rules" bên dưới, rồi ghi kết quả vào mục "Kiểm thử" của mẫu PR.
- Không tự gộp PR. Không deploy. Không chạy migration lên database thật.
- Không đưa khóa, token, mật khẩu, chuỗi kết nối hay file `.env` vào commit, vào mô tả PR hay vào nhận xét.

## Code Review Rules

Viết nhận xét bằng tiếng Việt. Mỗi nhận xét ghi: file và dòng, điều gì sai, sai trong tình huống nào.

Quy trình (chi tiết từng mục ở `CLAUDE.md`):

- Mô tả PR phải trả lời đủ 9 mục `quyen`, `bam-hai-lan`, `gio-vn`, `chu-va-so`, `mat-mang`, `ton-kho`, `cau-chu`, `migration`, `dich-vu-ngoai`. Mỗi mục có tên kiểm tra chứng minh hoặc câu "không áp dụng vì …". Thiếu mục nào thì báo mục đó.
- Báo khi PR tắt, bỏ qua hay nới một kiểm thử; khi sửa một migration đã có trên `main`; khi đổi chữ của một câu `raise exception` cũ.
- Báo khi mã báo "thành công" trước lúc database xác nhận, hoặc khi lệnh ghi dữ liệu và câu thông báo không cùng một biểu thức `await`.
- Báo hàm `security definer` mới thiếu kiểm vai ở đầu thân hàm hoặc thiếu `set search_path`.
- Báo `current_date`, `now()::date` hay phép tự cộng 7 tiếng. Giờ Việt Nam lấy từ `hom_nay_vn()` / `bay_gio_vn()` / `gio_vn()` ở database và `web/src/lib/gio-vn.ts` ở web.
- Báo chỗ đọc số kiểu Việt sai: "1.000" là một nghìn, "1,5" là một phẩy năm.
- Báo mọi khóa, token, mật khẩu, chuỗi kết nối xuất hiện trong diff.

Chữ và thương hiệu trên trang công khai:

- Báo chữ thuộc danh sách ở `web/src/lib/chuoi-cam.js`.
- Câu cố định mới trên trang công khai phải đủ bản Việt, Anh, Hàn; câu ở `/noi-bo` đủ bản Việt, Anh (mục `cau-chu` của `CLAUDE.md`).
- Beeftown là "Beef Specialty Restaurant". Báo "Korean BBQ", "nướng Hàn", "buffet", chữ "rẻ".
- "Charcoal" chỉ là tên màu. Beeftown nướng bằng vỉ gas: báo chữ hay hình nói về than, lửa, khói.
- Báo số ngày ủ, grade, xuất xứ, phần trăm khi PR không kèm nguồn xác nhận.
- Ảnh do AI tạo trên trang công khai phải có chú thích "Ảnh minh họa". Thiếu chú thích thì báo.
- Logo là file vector trong `web/public/thuong-hieu/`. Báo khi PR gõ lại chữ BEEFTOWN bằng phông, đổi màu, kéo giãn, xoay, thêm bóng hay viền, hoặc đặt logo lên ảnh. Bản logo cho nền sáng và bản cho nền tối là hai bản vẽ khác nhau: không lấy bản này đổi màu thành bản kia.

Màu, trong lúc website chưa đổi theo `THUONG-HIEU.md`:

- Không báo các mã màu cũ đang có trên `main`.
- Báo khi PR thêm một mã màu không có trong `web/THIET-KE.md` mục 2 và cũng không có trong `THUONG-HIEU.md`.
- Báo chữ màu Warm Stone hay Marigold đặt trên nền kem (tương phản dưới 2 : 1).
- PR đổi bảng màu của website phải đổi cùng lúc các nơi liệt kê ở `THUONG-HIEU.md` mục 5. Thiếu nơi nào thì báo nơi đó.

Địa điểm:

- Địa điểm quán là "Tầng 3, 63 Hồ Tùng Mậu". Báo khi PR thêm một chỗ mới ghi địa chỉ khác.
- Không báo các chỗ ghi "Hàm Nghi" và "cầu thang bộ" đang có trên `main`: việc sửa nằm ở một PR riêng, và dòng địa chỉ pháp lý ở chân trang chờ Khánh quyết.
