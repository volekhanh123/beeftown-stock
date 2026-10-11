# Beeftown — bảng màu thương hiệu đã chốt và việc đưa sang website

Lập ngày 10/10/2026 từ Brand Guideline (bản lưu số 17 trên Claude). Khánh chốt bảng màu ngày 09/10/2026.
File này là bản tóm tắt cho người viết mã. Cập nhật ngày 11/10/2026, cùng PR "màu và thông tin chung".

> **Trang công khai ĐÃ đổi theo bảng màu này** (token trong khối `.ck` của `web/src/styles/cong-khai.css`,
> logo và hoa văn SVG, ảnh chia sẻ, biểu tượng trình duyệt). **`/noi-bo`, kho và Beeftown Cân CHƯA đổi**:
> ba nơi đó vẫn dùng bảng cũ trong khối `:root` của `web/src/styles/chung.css` và token riêng của
> `can-app/`. Nơi nào đã đổi, nơi nào chưa: mục 5.

- Guideline đầy đủ (5 trang, tiếng Anh): https://claude.ai/artifact/EKyJZyhi7sDznKXHRtc3iq
- Logo vector, file in đúng cỡ, bản PDF của guideline: máy Khánh, thư mục `Documents\Beeftown_Brand_Assets_V17_2026-10-09`. Không đưa vào repo (`.gitignore` chặn ảnh và PDF).

---

## 1. Bảng màu (5 màu, hệ RGB)

| Tên | HEX | RGB | Dùng cho | Phần trên mỗi bề mặt |
|---|---|---|---|---|
| Beef Red | `#A70C0C` | 167, 12, 12 | Logo, tiêu đề, mảng nhấn | 25 % |
| Cream | `#F0E3D0` | 240, 227, 208 | Nền: tường, giấy, màn hình | 60 % |
| Charcoal | `#151008` | 21, 16, 8 | Chữ và nét mảnh | 10 % |
| Marigold | `#F5AA14` | 245, 170, 20 | Điểm nhấn nhỏ | dưới 5 % |
| Warm Stone | `#B8A98C` | 184, 169, 140 | Nét kẻ và nền phụ | không tính |

- Một đỏ, một vàng. Guideline ghi: không màu pha nhạt, không đỏ thứ hai.
- Các mã cũ `#A21E22`, `#FBF4E1`, `#1E160E`, `#F5C211` của bản guideline trước không còn dùng.
- Chưa có mã CMYK và Pantone: nhà in đọc từ bản in thử, Khánh duyệt rồi mới ghi.
- "Charcoal" là tên màu. Beeftown nướng bằng vỉ gas.

## 2. Các quy tắc khác của guideline mà mã phải theo

- **Logo:** một logo gồm 3 phần: lockup (đầu bò + BEEFTOWN + dòng Pick it. Grill it. Love it.), brandmark (đầu bò), wordmark (chữ BEEFTOWN). Cả logo một màu. Rộng tối thiểu: lockup 160 px, brandmark 48 px; hẹp hơn 160 px thì dùng brandmark. Khoảng trống quanh logo bằng chiều cao chữ B. Mỗi bề mặt 1 logo, đặt ở trên cùng: trái, giữa hoặc phải.
- **Không:** đổi màu logo, kéo giãn, xoay, thêm bóng, viền, đặt lên ảnh, gõ lại bằng phông khác.
- **Hai bản vẽ:** bản cho nền sáng và bản cho nền tối khác nhau (bản nền tối có viền ngoài và mặt bò tô kín). Không lấy bản này đổi màu thành bản kia.
- **Chữ:** một phông Montserrat, độ đậm 500 / 700 / 800 / 900. Giá ghi dạng 000.000 đ, ngày dạng dd/mm/yyyy.
- **Tên gọi:** descriptor "Beef Specialty Restaurant"; tagline "Pick it. Grill it. Love it." có dấu chấm; câu chính cho khách "Không cần rành bò. Chọn theo gu, thấy giá trước."
- **Không viết:** rẻ, buffet, cao cấp, Korean BBQ, nướng Hàn, grade khi chưa có chứng nhận, số ngày ủ khi chưa có hồ sơ, chữ về than, lửa, khói, số phần trăm khi chưa có phép thử. Danh sách máy quét dùng vẫn là `web/src/lib/chuoi-cam.js`.
- **Ảnh nên có:** khay bò đóng sẵn có nhãn, vỉ gas với hơi nhẹ, bàn tay và đĩa ăn chung, nền kem và gỗ sáng. **Không có:** than, lửa, khói dày, đá đen, gang, thớt gỗ thô, rau thơm đặt trên thịt sống, vân mỡ đẹp hơn thịt quán bán.
- **Ảnh do AI tạo** chỉ để minh họa; quảng cáo và thực đơn dùng ảnh chụp thật.

## 3. Chỗ guideline và website đang khác nhau

| Việc | Guideline | Trang công khai | `/noi-bo`, kho, Beeftown Cân |
|---|---|---|---|
| Beef Red | `#A70C0C` | `--do` `#A70C0C` | `--do` `#B23A2C` |
| Cream | `#F0E3D0` | `--kem` `#F0E3D0` | `--kem` `#FBF4E1` |
| Charcoal | `#151008` | `--than` `#151008` | `--than` `#1E160E` |
| Màu vàng | 1 màu: Marigold `#F5AA14` | 1 mã `#F5AA14`, 2 tên biến (`--cuc-vang`, `--mu-tat`) | 2 màu: `--mu-tat` `#F2A900`, `--cuc-vang` `#F5C211` |
| Màu pha | Không có | Có, Khánh cho phép ngày 10/10/2026: `--do-dam` và `--do-sau` `#890607`, `--kem-sau` `#EBDCC6`, `--kem-dam` `#E7D5BC`, `--vien-o` `#7A7366`, `--muc-nhat` (Charcoal 68 %) | Màu pha của bảng cũ |
| Phần của từng màu | Cream 60 · Beef Red 25 · Charcoal 10 · Marigold dưới 5 | kem 60 · tối 25 · đỏ 12 · vàng 3 (`web/THIET-KE.md` ghi là gợi ý), chưa đổi | không tính |
| Warm Stone | Chỉ nét kẻ và nền phụ | Chữ phụ trên nền tối | Chữ phụ trên nền tối |
| Độ đậm Montserrat | 500 / 700 / 800 / 900 | 400 / 600 / 700 / 800 | 400 / 600 / 700 / 800 |
| Địa điểm | Tầng 3, 63 Hồ Tùng Mậu | Đã đổi, trừ dòng địa chỉ pháp nhân ở chân trang (mục 6) | Không ghi địa chỉ nhà hàng trong mã |

Hai việc cần Khánh quyết:

1. **Đã quyết ngày 10/10/2026:** website được giữ màu pha. Màn hình cần 1 đỏ đậm hơn cho nút khi di chuột và chữ nhỏ, 2 nền kem đậm hơn để tách khối, 1 màu viền ô nhập. Guideline vẫn ghi không màu pha; phép này chỉ áp dụng cho website.
2. **Vẫn chờ:** phần của từng màu trên trang web theo guideline (đỏ 25, tối 10) hay giữ như đang chạy (tối 25, đỏ 12). Trang công khai hiện giữ như đang chạy; đổi là đổi bề mặt của vài khối, thuộc các PR bố cục sau.

## 4. Token đã áp dụng trên trang công khai

Áp dụng trong khối `.ck` đầu tiên của `web/src/styles/cong-khai.css`. `crm/test/test-cong-khai-giao-dien.mjs` nhóm 6 chép tay từng mã và kiểm 16 cặp tương phản. Tương phản tính theo WCAG 2.2.

| Token | Bảng cũ (`:root`, còn ở `/noi-bo` và kho) | Đã áp dụng ở trang công khai | Tương phản |
|---|---|---|---|
| `--do` | `#B23A2C` | `#A70C0C` | 6,15 : 1 với kem · 5,77 với `#EBDCC6` · 5,42 với `#E7D5BC` |
| `--do-dam` | `#8F2C21` | `#890607` | 7,93 : 1 với kem |
| `--do-sau` | `#960F13` | `#890607` (cùng mã với `--do-dam`) | 7,45 và 7,00 : 1 với 2 nền kem đậm hơn |
| `--kem` | `#FBF4E1` | `#F0E3D0` | chữ than 14,96 : 1 |
| `--kem-sau` | `#F5ECD7` | `#EBDCC6` | chữ than 14,05 · chữ đỏ 5,77 : 1 |
| `--kem-dam` | `#F1E4C2` | `#E7D5BC` | chữ than 13,20 · chữ đỏ 5,42 · chữ đỏ đậm 7,00 : 1 |
| `--than` | `#1E160E` | `#151008` | chữ kem 14,96 : 1 |
| `--mu-tat`, `--cuc-vang` | `#F2A900`, `#F5C211` | cả hai `#F5AA14` | 9,59 : 1 với than |
| `--da` | `#B8A98C` | giữ | 8,19 : 1 với than |
| `--vien-o` | `#8C8577` | `#7A7366` | 3,71 : 1 với kem · 3,49 với `#EBDCC6` · 3,27 với `#E7D5BC` · 4,70 với nền trắng của ô |
| `--muc-nhat` | than cũ 68 % | than mới 68 % | 5,92 : 1 với kem · 5,61 với `#E7D5BC` |

**Hai giá trị khác đề xuất ngày 10/10/2026 của file này.** Đề xuất cũ là `--kem-sau` `#E7D5BC` và `--kem-dam` `#DAC5AA`. Khi làm thử, `#DAC5AA` làm dải "Cả bữa" ở trang chủ sẫm hơn hẳn thiết kế đang chạy. Giá trị đã áp dụng là `--kem-sau` `#EBDCC6` và `--kem-dam` `#E7D5BC`: hai bậc kem lùi lại một nấc, giữ độ chênh sáng giữa các khối gần với trước. `#DAC5AA` không còn dùng ở đâu.

Các điểm phải giữ:

- Marigold và Warm Stone không làm chữ trên nền kem: 1,56 và 1,83 : 1.
- Marigold trên nền đỏ được 3,94 : 1: chỉ dùng cho chữ lớn hoặc hình, không cho chữ thường.
- Đỏ trên nền than chỉ 2,43 : 1: không đặt chữ đỏ trên dải tối.
- Viền `#7A7366` trên `#E7D5BC` là 3,27 : 1, trên `#EBDCC6` là 3,49 : 1: vừa qua mức 3 : 1 của viền ô nhập. Ô nhập hiện có nền trắng (4,70 : 1); đổi nền ô thì đo lại.
- Màu viết bằng `rgba()` phải dùng số RGB của bảng mới (21, 16, 8 · 240, 227, 208 · 167, 12, 12 · 137, 6, 7). Kiểm thử nhóm 6 đỏ khi một file công khai còn mã hex hay bộ ba số RGB của bảng cũ.
- Khối `:root` đầu file `chung.css` dùng chung cho `/noi-bo` và kho: **không sửa khối đó trong một PR của trang công khai** (kiểm thử nhóm 2 gác).

## 5. Nơi đã đổi và nơi còn mã màu cũ

Đã đổi (PR "màu và thông tin chung"):

| Nơi | Đổi gì |
|---|---|
| `web/src/styles/cong-khai.css` | 14 token khai lại trong khối `.ck` đầu tiên; màu `rgba()` theo số RGB mới |
| `web/src/components/*.astro` của trang công khai | Màu `rgba()` trong phần `<style>` theo số RGB mới |
| `web/src/layouts/Trang.astro` | Thẻ `theme-color` là `#F0E3D0` |
| `web/public/thuong-hieu/*.svg` (15 file), `web/public/bieu-tuong.svg` | Màu tô của logo, đầu bò, hoa văn; hình không đổi |
| `web/public/favicon.ico`, `web/public/thuong-hieu/bieu-tuong-180.png`, `chia-se-1200x630.png`, 4 biểu tượng trong `web/public/kho/` | Dựng lại bằng `web/cong-cu/thuong-hieu/tao-bieu-tuong.py` (bảng `DOI_MAU` đổi mã của PDF sang mã đã chốt) |
| `crm/test/test-cong-khai-giao-dien.mjs` | Hằng `BANG_MAU` và nhóm 6 |
| `web/THIET-KE.md` mục 2, `README.md` mục "Bảng màu", `AGENTS.md` | Tài liệu theo tình trạng mới |

Biểu tượng trình duyệt (`bieu-tuong.svg`, `favicon.ico`) và biểu tượng màn hình chính của kho dùng chung một bộ file, nên `/noi-bo` và kho đã có biểu tượng màu mới dù giao diện bên trong chưa đổi.

Còn mã cũ, chờ một PR riêng:

| Nơi | Ghi gì |
|---|---|
| `web/src/styles/chung.css` | Token trong 2 khối `:root` — `/noi-bo` và kho đọc |
| `web/src/styles/noi-bo.css`, `kho.css`, `kho-khung.css` | Mã hex và màu `rgba()` của bảng cũ |
| `web/src/lib/qua-tai.ts` (dòng 141, 145) | Màu nền, màu chữ, màu nút của trang báo quá tải |
| `web/src/layouts/NoiBo.astro`, `Kho.astro` | Thẻ `theme-color` `#1E160E` |
| `web/public/kho/manifest.json` | `theme_color` `#1E160E` |
| `can-app/src/giao-dien.html`, `can-app/src/huong-dan.html` | Token riêng của Beeftown Cân (`--do`, `--do-dam`, `--kem`, `--kem-sau`, `--mu-tat`, `--than`, `--vach`) |
| `web/cong-cu/thuong-hieu/` (`cau_hinh_tai_san.py`, `tach-tu-pdf.py`, `ve-svg.mjs`) | Mã màu của PDF nhận diện, dùng để tách tài sản từ PDF — đây là mã nguồn, không phải mã trên trang |
| PR #63 (skill `thiet-ke-beeftown`, chưa gộp) | Ghi bảng màu cũ; `crm/test/test-ky-nang-thiet-ke.mjs` so mã màu của skill với mã nguồn |

Lệnh tìm chỗ còn sót: `grep -rnE "30, ?22, ?14|251, ?244, ?225|178, ?58, ?44|150, ?15, ?19" web/src can-app/src`.

Logo vector bảng màu mới đã có sẵn trong thư mục tài sản trên máy Khánh (`01_Logo_vector`: lockup, brandmark, wordmark; bản nền sáng màu red, charcoal, black; bản nền tối màu cream, white).

## 6. Địa điểm

- Khánh chốt ngày 07/10 và 09/10/2026: quán ở **Tầng 3, 63 Hồ Tùng Mậu** (tiếng Anh: "Floor 3, 63 Hồ Tùng Mậu"; tiếng Hàn: "Hồ Tùng Mậu 63, 3층"). Bản ngắn: "63 Hồ Tùng Mậu, TP.HCM" · "63 Hồ Tùng Mậu, Ho Chi Minh City" · "호치민시 Hồ Tùng Mậu 63".
- Câu chỉ đường, dùng nguyên văn: "Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3." · "Use our own entrance, right next to GS25, and take the lift to Floor 3." · "GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요."
- **Mã nguồn đã đổi** (PR "màu và thông tin chung"): địa chỉ cố định `DIA_CHI_NHA_HANG`, câu chung `loiLen`, thẻ tiêu đề và mô tả của từng trang, JSON-LD, hình thang máy thay hình cầu thang. `crm/test/test-cong-khai-dia-diem.mjs` gác: không file nào của website còn địa chỉ khác, không còn chữ về cầu thang bộ.
- **Chưa đổi, chờ Khánh quyết:** dòng địa chỉ pháp nhân ở chân trang (`PHAP_NHAN.diaChi` trong `web/src/lib/chu.ts`). Dòng này chép theo giấy đăng ký đang dùng cho hồ sơ xác minh trên Meta. Kiểm thử giữ nó nguyên từng ký tự.
- **Tên phường của 63 Hồ Tùng Mậu chưa có giấy xác nhận:** trang, thẻ mô tả và JSON-LD không ghi phường. Không tự thêm.
- Điều đã biết về đường đến chỉ có địa chỉ, tầng 3, lối vào riêng ngay cạnh GS25, thang máy. Chỗ gửi xe, mốc đường, số bước, khoảng cách, lối cho xe lăn: chưa xác nhận, không viết lên trang.
- Không gọi 63 Hồ Tùng Mậu là "toà nhà". Trang chỉ nói địa điểm hiện tại, không kể chuyện đổi địa điểm.
- **Địa chỉ đã công bố trong database thắng địa chỉ trong mã.** Khóa `dia_chi_hien_thi` (màn Nội dung của `/noi-bo`, nhóm Liên hệ) nếu đang công bố thì trang in bản đó. Đổi địa điểm phải xem lại cả các khóa `dia_chi_hien_thi`, `google_maps_url`, `tieu_de_og`, `mo_ta_og`, `dong_trang_thai`, và ở màn Cài đặt (`/noi-bo/cai-dat`): tên chi nhánh và ô địa chỉ của chi nhánh. Bot Messenger trả lời khách bằng "Beeftown — <tên chi nhánh>" và, khi chưa có bản công bố, bằng ô địa chỉ đó.
