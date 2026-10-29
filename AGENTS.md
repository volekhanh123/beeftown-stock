# Beeftown — hướng dẫn cho Codex và các agent khác

Phiên Claude đọc `CLAUDE.md`. Codex và các agent khác đọc file này. Hai file cùng một quy trình:
**`CLAUDE.md` là bản gốc**, file này chỉ trỏ tới và thêm phần quy tắc rà soát pull request (PR).
Khi hai file nói khác nhau thì làm theo `CLAUDE.md` và báo chỗ lệch trong PR.

## Đọc trước khi làm

| File | Có gì |
|---|---|
| `CLAUDE.md` | Quy trình bắt buộc: cách chạy kiểm thử, 9 mục "định nghĩa xong", việc trước khi mở PR, các điều không bao giờ làm |
| `README.md` | Concept, giọng văn, các cảnh báo về bản nháp cũ, việc còn phải làm |
| `THUONG-HIEU.md` | Mục 0: bộ nhận diện 21/10/2026 (Brand Guidelines của designer), quyết định của Khánh, danh sách việc. Mục 1–4: bảng màu (đỏ `#BD0000`, đen, trắng và năm màu pha màn hình), luật logo / phông / ảnh, token đang chạy (website đã đổi ở PR 1 "Đổi nhận diện website"). Mục 5: thứ còn mang nhận diện cũ (Beeftown Cân — báo PR đổi màu Cân lẻ tẻ ngoài việc 7; ảnh hướng dẫn kho). Mục 6: địa điểm. Phụ lục: lịch sử bảng 09/10/2026 |
| `web/THIET-KE.md` | Giao diện trang công khai đang chạy: màu theo vai (mục 2; `/noi-bo` và kho dùng cùng token), chữ, thành phần |
| `web/src/lib/chuoi-cam.js` | Danh sách chữ cấm trên trang công khai, kèm lý do |
| `mini-app/CLAUDE.md` | Mini App Zalo: tình trạng trên Zalo, lệnh, việc được làm và phải hỏi Khánh (không đọc hay commit `mini-app/.env`; đổi chữ khách thấy phải hỏi trước) |
| `crm/CLAUDE.md`, `web/CLAUDE.md`, `can-app/CLAUDE.md`, `may-chu-don/CLAUDE.md` | Bản đồ của từng thư mục: việc gì đọc mục nào, sửa file nào, thêm hàm SQL thì đụng những chỗ nào, chạy kiểm thử nào. Làm trong thư mục nào thì đọc file của thư mục đó trước — đừng đọc cả README |
| `mo-rong-fabi/README.md` | Mở rộng FABi (extension Chrome): cách cài, giả định về giao diện FABi CMS, việc Khánh phải thử trên FABi thật |

## Khi viết mã

- Làm đúng `CLAUDE.md`: tên hàm, biến, chú thích, tài liệu viết tiếng Việt không tắt; kiểm thử viết trước khi sửa lỗi; điền đủ mẫu PR.
- `.gitignore` chặn hết rồi mở từng file. File mới phải có dòng `!đường-dẫn`; kiểm bằng `git status --short`.
- Tra tên trước khi lục: `cd crm && npm run tim -- <hàm SQL | bảng | file>` (bản cuối ở migration nào, ai gọi, test nào nhắc); `npm run tim -- <hàm> --than` in nguyên văn bản cuối để chép khi thay thân.
- `CLAUDE.md` yêu cầu chạy `/code-review`, là lệnh của Claude. Agent khác thay bằng việc tự rà soát diff so với `origin/main` theo mục "Code Review Rules" bên dưới, rồi ghi kết quả vào mục "Kiểm thử" của mẫu PR.
- Không tự gộp PR. Không deploy. Không chạy migration lên database thật.
- Không đưa khóa, token, mật khẩu, chuỗi kết nối hay file `.env` vào commit, vào mô tả PR hay vào nhận xét.

## Code Review Rules

Viết nhận xét bằng tiếng Việt. Mỗi nhận xét ghi: file và dòng, điều gì sai, sai trong tình huống nào.

Quy trình (chi tiết từng mục ở `CLAUDE.md`):

- Đọc comment "Máy tóm tắt PR" trước (workflow `mo-ta-pr.yml`): khu đã đụng, việc sau khi gộp, hàm thay thân đổi bao nhiêu dòng. Rà soát migration thay thân theo phần đã đổi (`cd crm && npm run tim -- <hàm> --khac`), không đọc lại nguyên văn phần chép.
- Báo khi "Tóm tắt cho Khánh" của mô tả PR có tên hàm, tên file hay chữ kỹ thuật, hoặc mức rủi ro thấp hơn thực tế (đụng tiền, tồn kho, quyền, tin gửi khách, trang công khai mà ghi "Thấp").

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
- Beeftown nướng bằng vỉ gas: báo chữ hay hình nói về than, lửa, khói — kể cả chữ "charcoal" (từ 22/10/2026 không còn màu nào tên Charcoal).
- Báo số ngày ủ, grade, xuất xứ, phần trăm khi PR không kèm nguồn xác nhận.
- Ảnh do AI tạo trên trang công khai phải có chú thích "Ảnh minh họa". Thiếu chú thích thì báo. Ảnh AI chỉ cho món và bữa ăn: báo khi nó cho thấy quầy, khay skin-pack, không gian quán, lối vào, thang máy hay mặt người (bàn tay người thì được: Khánh quyết ngày 11/10/2026). Báo alt kể tên món phụ, alt nói đây là ảnh của quán, và file ảnh trong `web/public/anh/` mà không trang nào dùng.
- Các dải nền tối ("Quầy chọn bò" ở trang chủ, "Bò tại quầy" ở trang Thực đơn — nay là đen) và câu chính của trang chủ giữ nguyên: Khánh quyết ngày 11/10/2026. Báo khi PR đổi bề mặt của một khối hay sửa câu chính.
- Logo là SVG trong `web/public/thuong-hieu/`, tách nguyên path từ PDF Brand Guidelines 21/10/2026 bằng `web/cong-cu/thuong-hieu/tach-logo.mjs`: logo chính `logo-ngang-*`, logo phụ `chu-beeftown-*`, brandmark `dau-bo-*`, mỗi thứ ba bản `-do`, `-den`, `-trang`. Báo khi PR gõ lại chữ BEEFTOWN bằng phông (kể cả Figtree, phông của logo), sửa tay hay tô màu khác cho SVG, kéo giãn, xoay, thêm bóng hay viền, đặt logo lên ảnh, đặt bản đỏ / đen lên nền đỏ / đen (nền tối dùng bản trắng), hay dùng lại hình của bộ nhận diện cũ (hương thảo, vân mỡ, steak, tem tròn, chữ BEEFTOWN lặp, đầu bò cũ — Khánh bỏ ngày 26/10/2026).

Màu. Cả website — trang công khai, `/noi-bo`, kho — dùng bảng 22/10/2026: đỏ `#BD0000`, đen `#000000`, trắng `#FFFFFF`, cùng năm màu pha chỉ cho màn hình `#8F0000`, `#767676`, `#555555`, `#F4F4F4`, `#E2E2E2` (`THUONG-HIEU.md` mục 1 và 4). Bảng khai ở hai nơi cùng giá trị, chưa gộp: khối `.ck` đầu tiên của `web/src/styles/cong-khai.css` (trang công khai) và hai khối `:root` của `web/src/styles/chung.css` (`/noi-bo`, kho). Beeftown Cân (`can-app/src/giao-dien.html`, `can-app/src/huong-dan.html`) còn bảng cũ, đổi ở một PR riêng:

- Báo mọi mã hex hay bộ ba số RGB của các bảng cũ trong file giao diện, tài liệu, công cụ: `web/src/styles/`, trang, component, layout, `web/src/lib/qua-tai.ts`, SVG trong `web/public/thuong-hieu/`, `web/cong-cu/`. Bảng trước 09/10/2026: `#B23A2C`, `#FBF4E1`, `#1E160E`, `#F2A900`, `#F5C211`, `#8F2C21`, `#960F13`, `#F5ECD7`, `#F1E4C2`, `#8C8577`. Bảng 09/10/2026 và tám màu trạng thái: danh sách ở phụ lục của `THUONG-HIEU.md` (file duy nhất được ghi các mã đó; `crm/test/test-cong-khai-nhan-dien.mjs` nhóm 5 bắt chúng ở mọi file khác). Báo mã 3 chữ số (`#fff`, `#000`) — chỉ dạng 6 chữ số của bảng. Báo khi PR thêm một mã màu không có trong `THUONG-HIEU.md` mục 4 hay `web/THIET-KE.md` mục 2.
- Báo khi PR đổi một mã ở khối `.ck` mà không đổi `:root` của `chung.css` (hay ngược lại), và khi đổi màu một file HTML của Beeftown Cân mà không đổi file kia.
- Báo chữ thường màu đỏ hay đỏ đậm trên nền đen (3,16 và 2,17 : 1), chữ `#555555` trên nền đen (2,82 : 1), và chữ, viền ô hay biểu tượng `#E2E2E2` / `#F4F4F4` trên nền sáng (1,30 / 1,10 : 1).
- `/noi-bo` và kho không có màu trạng thái riêng (Khánh bỏ xanh, vàng, đỏ nhạt ngày 25/10/2026): trạng thái phân biệt bằng chữ, dấu (✓, "!", tam giác) và nét (liền, đứt, nền đặc / rỗng) — bảy kiểu K1–K7 ở `THUONG-HIEU.md` mục 4, khai trong `web/src/styles/noi-bo.css`. Báo khi PR thêm màu xanh, vàng hay nền màu nhạt; khi hai trạng thái đứng cạnh nhau chỉ khác nhau bằng màu; khi câu nhân viên đọc gọi trạng thái bằng tên màu ("đèn vàng", "hiện xanh"); khi một trang nội bộ gõ mã màu thay vì dùng biến; khi ô nhập kẻ viền bằng màu mờ hơn `--vien-o`. Mã mức trong mã và database (`'xanh'`, `'vang'`, `'do'`, `'tat'`) giữ tên — không báo. Beeftown Cân còn màu trạng thái riêng trong file HTML của nó tới PR riêng.
- 15 ảnh `web/public/kho/hd-*.png` (trang hướng dẫn của kho) chụp trước 11/10/2026 và trước PR 1, còn giao diện cũ: không báo, cho tới khi chúng được chụp lại (việc 8).
- Trang công khai nền trắng; đen làm điểm nhấn (đầu trang, vài dải, chân trang); đỏ cho nút, nhãn, giá (Khánh quyết 25/10/2026). Báo tên màu CSS (`white`…), mã 3 chữ số, mã trắng ngà hay `color-mix` với trắng trong file của trang công khai, `/noi-bo` và kho — trắng chỉ viết `#FFFFFF` hoặc `var(--kem)`; ô nhập, ô đánh dấu, nút chọn tệp của trình duyệt dùng token. Thẻ nhãn khay (`web/src/components/NhanKhay.astro`) đặt thẳng, không bóng đổ, chỉ ghi tên 5 trường, không có giá trị mẫu, logo chính đỏ. Beeftown Cân còn màu cũ (việc 7): không báo ở đó.
- Thành phần của trang công khai (`web/THIET-KE.md` mục 3–5, đo ở `web/kiem-tra/do-giao-dien.mjs`): mọi thứ bấm được cao ít nhất 48px; nút phụ trên nền sáng là nền trắng, chữ và viền đỏ; mỗi nhóm nút một nút chính; thẻ không bóng đổ; ô nhập nền trắng, viền `--vien-o`, nhãn ở trên ô; mọi `:hover` nằm trong `@media (hover: hover)`; lớp phủ và khoá cuộn của menu gọn chỉ có khi script đã chạy. Báo khi PR thêm thành phần lệch các số đó, hoặc gỡ một ngoại lệ trong `do-giao-dien.mjs` mà không sửa thành phần tương ứng.

Địa điểm:

- Địa điểm quán là "Tầng 3, 63 Hồ Tùng Mậu" (tiếng Anh "Floor 3, 63 Hồ Tùng Mậu", tiếng Hàn "Hồ Tùng Mậu 63, 3층"). Khách vào lối riêng ngay cạnh GS25 và đi thang máy lên tầng 3. Báo khi PR ghi địa chỉ khác, hoặc viết "cầu thang bộ", "không có thang máy", "stairs", "계단" trên trang công khai.
- Khánh đã quyết địa chỉ, tầng 3 và lối vào riêng ngay cạnh GS25, và đã xác nhận ngày 11/10/2026 rằng địa điểm có thang máy. Nút thang máy ghi số mấy cho tầng của quán thì chưa biết: báo khi PR viết số nút. CÂU chỉ đường ba thứ tiếng (`loiLen` trong `web/src/lib/chu.ts`) là Claude đề xuất, chờ Khánh duyệt chữ: báo khi PR ghi câu đó là "Khánh đã chốt", và báo khi PR đổi chữ của câu ở một nơi mà không đổi các bản chép tay trong kiểm thử.
- Ngoại lệ duy nhất: dòng địa chỉ pháp nhân ở chân trang (`PHAP_NHAN.diaChi` trong `web/src/lib/chu.ts`) ghi theo giấy chứng nhận đăng ký địa điểm kinh doanh, khớp Thông tin doanh nghiệp trên Meta (Khánh quyết 26/10/2026). Không báo dòng đó; báo khi PR sửa nó, hay sửa số điện thoại pháp nhân (`PHAP_NHAN.dienThoai`), mà mô tả PR không ghi Khánh đã quyết.
- Báo khi PR ghi tên phường hay quận của 63 Hồ Tùng Mậu (chưa có giấy xác nhận), gọi địa điểm là "toà nhà", viết "địa chỉ mới", "quán đã chuyển về…", "trước đây quán ở…", hoặc thêm thông tin chưa xác nhận: chỗ gửi xe, mốc đường, số bước, khoảng cách, giờ, lối cho xe lăn.
- Mẫu tìm chữ sai về địa điểm nằm ở `web/kiem-tra/mau-dia-diem.mjs`, kèm bảng câu thử. Báo khi PR nới một mẫu mà không thêm câu vào bảng câu thử.
