# Beeftown — hướng dẫn cho Codex và các agent khác

Phiên Claude đọc `CLAUDE.md`. Codex và các agent khác đọc file này. Hai file cùng một quy trình:
**`CLAUDE.md` là bản gốc**, file này chỉ trỏ tới và thêm phần quy tắc rà soát pull request (PR).
Khi hai file nói khác nhau thì làm theo `CLAUDE.md` và báo chỗ lệch trong PR.

## Đọc trước khi làm

| File | Có gì |
|---|---|
| `CLAUDE.md` | Quy trình bắt buộc: cách chạy kiểm thử, 9 mục "định nghĩa xong", việc trước khi mở PR, các điều không bao giờ làm |
| `README.md` | Concept, giọng văn, các cảnh báo về bản nháp cũ, việc còn phải làm |
| `THUONG-HIEU.md` | Bảng màu thương hiệu Khánh chốt 09/10/2026: giá trị đã áp dụng ở trang công khai, `/noi-bo` và kho; thứ còn mang màu cũ (Beeftown Cân, ảnh hướng dẫn kho); địa điểm |
| `web/THIET-KE.md` | Giao diện trang công khai đang chạy: màu theo vai (mục 2; `/noi-bo` và kho dùng cùng token), chữ, thành phần |
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

Màu. Cả website — trang công khai, `/noi-bo`, kho — dùng bảng màu Khánh chốt 09/10/2026 (`THUONG-HIEU.md` mục 1 và 4). Bảng khai ở hai nơi cùng giá trị, chưa gộp: khối `.ck` đầu tiên của `web/src/styles/cong-khai.css` (trang công khai) và hai khối `:root` của `web/src/styles/chung.css` (`/noi-bo`, kho). Beeftown Cân (`can-app/src/giao-dien.html`, `can-app/src/huong-dan.html`) còn bảng cũ, đổi ở một PR riêng:

- Báo mọi mã hex hay bộ ba số RGB của bảng cũ (`#B23A2C`, `#FBF4E1`, `#1E160E`, `#F2A900`, `#F5C211`, `#8F2C21`, `#960F13`, `#F5ECD7`, `#F1E4C2`, `#8C8577`) trong file giao diện: `web/src/styles/`, trang, component, layout, `web/src/lib/qua-tai.ts`, SVG trong `web/public/thuong-hieu/`. Báo khi PR thêm một mã màu không có trong `THUONG-HIEU.md` mục 4 hay `web/THIET-KE.md` mục 2.
- Báo khi PR đổi một mã ở khối `.ck` mà không đổi `:root` của `chung.css` (hay ngược lại), và khi đổi màu một file HTML của Beeftown Cân mà không đổi file kia.
- Báo chữ hay biểu tượng màu Warm Stone, Marigold đặt trên nền sáng — kem, kem sau, kem đậm (tương phản từ 1,46 tới 1,83 : 1) — và chữ đỏ đặt trên nền tối (2,43 : 1).
- `/noi-bo`, kho, Beeftown Cân có thêm màu trạng thái (xanh, vàng, đỏ nhạt), khai một lần trên `.nb-than` của `web/src/styles/noi-bo.css`. Báo khi một trang nội bộ gõ mã màu thay vì dùng biến, khi trang công khai dùng màu trạng thái, và khi ô nhập kẻ viền bằng màu mờ hơn `--vien-o`.
- 15 ảnh `web/public/kho/hd-*.png` (trang hướng dẫn của kho) chụp trước ngày đổi màu và còn giao diện cũ: không báo, cho tới khi chúng được chụp lại.
- Website không có nền trắng (bảng màu không có trắng): báo `#fff`, `white`, mã trắng ngà hay `color-mix` với trắng trong file của trang công khai, `/noi-bo` và kho — kể cả ô nhập, ô đánh dấu, nút chọn tệp của trình duyệt chưa có nền Cream. Ngoại lệ đang có: `@media print`, và ở trang công khai thẻ nhãn khay `web/src/components/NhanKhay.astro` (chờ PR bố cục trang chủ). Beeftown Cân còn thẻ và ô nhập nền trắng (chưa đổi màu): không báo ở đó.
- Thành phần của trang công khai (`web/THIET-KE.md` mục 3–5, đo ở `web/kiem-tra/do-giao-dien.mjs`): mọi thứ bấm được cao ít nhất 48px; nút phụ trên nền kem là nền Cream, chữ và viền Beef Red; mỗi nhóm nút một nút chính; thẻ không bóng đổ; ô nhập nền Cream, viền `--vien-o`, nhãn ở trên ô; mọi `:hover` nằm trong `@media (hover: hover)`; lớp phủ và khoá cuộn của menu gọn chỉ có khi script đã chạy. Báo khi PR thêm thành phần lệch các số đó, hoặc gỡ một ngoại lệ trong `do-giao-dien.mjs` mà không sửa thành phần tương ứng.

Địa điểm:

- Địa điểm quán là "Tầng 3, 63 Hồ Tùng Mậu" (tiếng Anh "Floor 3, 63 Hồ Tùng Mậu", tiếng Hàn "Hồ Tùng Mậu 63, 3층"). Khách vào lối riêng ngay cạnh GS25 và đi thang máy lên tầng 3. Báo khi PR ghi địa chỉ khác, hoặc viết "cầu thang bộ", "không có thang máy", "stairs", "계단" trên trang công khai.
- Khánh đã quyết địa chỉ, tầng 3 và lối vào riêng ngay cạnh GS25, và đã xác nhận ngày 11/10/2026 rằng địa điểm có thang máy. Nút thang máy ghi số mấy cho tầng của quán thì chưa biết: báo khi PR viết số nút. CÂU chỉ đường ba thứ tiếng (`loiLen` trong `web/src/lib/chu.ts`) là Claude đề xuất, chờ Khánh duyệt chữ: báo khi PR ghi câu đó là "Khánh đã chốt", và báo khi PR đổi chữ của câu ở một nơi mà không đổi các bản chép tay trong kiểm thử.
- Ngoại lệ duy nhất: dòng địa chỉ pháp nhân ở chân trang (`PHAP_NHAN.diaChi` trong `web/src/lib/chu.ts`) còn ghi theo giấy đăng ký và chờ Khánh quyết. Không báo dòng đó; báo khi PR sửa nó mà mô tả PR không ghi Khánh đã quyết.
- Báo khi PR ghi tên phường hay quận của 63 Hồ Tùng Mậu (chưa có giấy xác nhận), gọi địa điểm là "toà nhà", viết "địa chỉ mới", "quán đã chuyển về…", "trước đây quán ở…", hoặc thêm thông tin chưa xác nhận: chỗ gửi xe, mốc đường, số bước, khoảng cách, giờ, lối cho xe lăn.
- Mẫu tìm chữ sai về địa điểm nằm ở `web/kiem-tra/mau-dia-diem.mjs`, kèm bảng câu thử. Báo khi PR nới một mẫu mà không thêm câu vào bảng câu thử.
