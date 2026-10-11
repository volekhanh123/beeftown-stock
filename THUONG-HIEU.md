# Beeftown — bảng màu thương hiệu đã chốt và việc đưa sang website

Lập ngày 10/10/2026 từ Brand Guideline (bản lưu số 17 trên Claude). Khánh chốt bảng màu ngày 09/10/2026.
File này là bản tóm tắt cho người viết mã. Cập nhật ngày 11/10/2026, ba lần: cùng PR "màu và thông tin
chung" (trang công khai); ở PR "thành phần và khung trang" (trang công khai bỏ nền trắng, địa điểm có
thang máy); rồi cùng lần đổi màu `/noi-bo`, kho và Beeftown Cân.

> **Cả website và Beeftown Cân ĐÃ đổi theo bảng màu này.** Trang công khai đổi trước (token trong khối
> `.ck` của `web/src/styles/cong-khai.css`, logo và hoa văn SVG, ảnh chia sẻ, biểu tượng trình duyệt).
> `/noi-bo` và kho đổi ngày 11/10/2026 (token trong hai khối `:root` của `web/src/styles/chung.css`),
> cùng lúc với Beeftown Cân bản 2.9.2. Khối `.ck` và `:root` **cùng giá trị nhưng chưa gộp**: đổi một mã
> thì đổi cả hai nơi. Thứ còn mang màu cũ (ảnh chụp trong trang hướng dẫn của kho, tài liệu thiết kế
> cũ): mục 5.

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

Trang công khai, `/noi-bo`, kho và Beeftown Cân dùng cùng một bảng, nên bảng dưới chỉ còn một cột cho mã.

| Việc | Guideline | Website (trang công khai, `/noi-bo`, kho) và Beeftown Cân |
|---|---|---|
| Beef Red | `#A70C0C` | `--do` `#A70C0C` |
| Cream | `#F0E3D0` | `--kem` `#F0E3D0` |
| Charcoal | `#151008` | `--than` `#151008` |
| Màu vàng | 1 màu: Marigold `#F5AA14` | 1 mã `#F5AA14`, 2 tên biến (`--cuc-vang`, `--mu-tat`) |
| Màu pha | Không có | Có, Khánh cho phép ngày 10/10/2026: `--do-dam` và `--do-sau` `#890607`, `--kem-sau` `#EBDCC6`, `--kem-dam` `#E7D5BC`, `--vien-o` `#7A7366`, `--muc-nhat` (Charcoal 68 %) |
| Màu trạng thái | Không nói tới | Chỉ ở `/noi-bo`, kho, Beeftown Cân: xanh = xong, vàng = lưu ý, đỏ nhạt = làm ngay (mục 4). Màu chức năng của công cụ, không thuộc năm màu thương hiệu |
| Màu trắng | Không có | Trang công khai không dùng (từ PR "thành phần và khung trang"): thẻ nền kem sau, ô nhập nền Cream; còn 2 chỗ có chủ đích: bản in ra giấy và thẻ "Đọc nhãn khay" (chờ PR bố cục trang chủ). `/noi-bo`, kho, Beeftown Cân: thẻ và ô nhập nền trắng, giữ nguyên qua lần đổi màu ngày 11/10/2026 |
| Phần của từng màu | Cream 60 · Beef Red 25 · Charcoal 10 · Marigold dưới 5 | Trang công khai: kem 60 · tối 25 · đỏ 12 · vàng 3 (`web/THIET-KE.md` ghi là gợi ý), chưa đổi. `/noi-bo`, kho: không tính |
| Warm Stone | Chỉ nét kẻ và nền phụ | Chữ phụ trên nền tối; ở `/noi-bo` và kho còn là viền nút phụ và vạch đậm của kho |
| Độ đậm Montserrat | 500 / 700 / 800 / 900 | 400 / 600 / 700 / 800, chưa đổi (Beeftown Cân dùng phông hệ thống) |
| Địa điểm | Tầng 3, 63 Hồ Tùng Mậu | Trang công khai đã đổi, trừ dòng địa chỉ pháp nhân ở chân trang (mục 6). `/noi-bo`, kho không ghi địa chỉ nhà hàng trong mã |

Bốn việc cần Khánh quyết:

1. **Đã quyết ngày 10/10/2026:** website được giữ màu pha. Màn hình cần 1 đỏ đậm hơn cho nút khi di chuột và chữ nhỏ, 2 nền kem đậm hơn để tách khối, 1 màu viền ô nhập. Guideline vẫn ghi không màu pha; phép này chỉ áp dụng cho website và Beeftown Cân.
2. **Vẫn chờ:** phần của từng màu trên trang web theo guideline (đỏ 25, tối 10) hay giữ như đang chạy (tối 25, đỏ 12). Trang công khai hiện giữ như đang chạy; đổi là đổi bề mặt của vài khối, thuộc các PR bố cục sau.
3. **Vẫn chờ:** độ đậm Montserrat trên web theo guideline (500 / 700 / 800 / 900) hay giữ 400 / 600 / 700 / 800. Hai lần đổi màu không đụng tới chữ.
4. **Chưa hỏi:** `/noi-bo`, kho và Beeftown Cân vẫn dựng thẻ và ô nhập nền trắng, trong khi trang công khai đã bỏ trắng (guideline không có màu trắng). Lần đổi màu ngày 11/10/2026 giữ nguyên cách dựng đó; có bỏ trắng ở ba nơi này hay không là việc Khánh quyết.

## 4. Token đã áp dụng

Một bảng, khai ở **hai nơi cùng giá trị, chưa gộp**: khối `.ck` đầu tiên của `web/src/styles/cong-khai.css` (trang công khai) và hai khối `:root` của `web/src/styles/chung.css` (`/noi-bo` và kho). Beeftown Cân chạy không mạng nên khai lại cùng các mã trong khối `:root` của `can-app/src/giao-dien.html` và `can-app/src/huong-dan.html`. Tương phản tính theo WCAG 2.2.

Kiểm thử chép tay từng mã, không đọc từ file CSS:

- `crm/test/test-cong-khai-giao-dien.mjs`: nhóm 6 (khối `.ck`, 16 cặp tương phản của trang công khai), nhóm 2 (13 biến gốc của `:root`).
- `crm/test/test-noi-bo-bang-mau.mjs`: `/noi-bo`, kho, Beeftown Cân. Nhóm 1 so khối `:root` với khối `.ck`; nhóm 4 tính các cặp tương phản trên thẻ trắng, nền kem và ba nền nhạt.
- `can-app/test/thu-bang-mau.ts`: hai file HTML của Beeftown Cân.
- `crm/test/test-ky-nang-thiet-ke.mjs`: bảng token trong skill thiết kế khớp cả hai nơi khai.

| Token | Bảng cũ (đã bỏ) | Đã áp dụng | Tương phản |
|---|---|---|---|
| `--do` | `#B23A2C` | `#A70C0C` | 6,15 : 1 với kem · 5,77 với `#EBDCC6` · 5,42 với `#E7D5BC` · 7,77 với thẻ trắng; chữ trắng đặt lên: 7,77 |
| `--do-dam` | `#8F2C21` | `#890607` | 7,93 : 1 với kem; chữ trắng đặt lên: 10,03 |
| `--do-sau` | `#960F13` | `#890607` (cùng mã với `--do-dam`) | 7,45 và 7,00 : 1 với 2 nền kem đậm hơn |
| `--kem` | `#FBF4E1` | `#F0E3D0` | chữ than 14,96 : 1 |
| `--kem-sau` | `#F5ECD7` | `#EBDCC6` | chữ than 14,05 · chữ đỏ 5,77 : 1 |
| `--kem-dam` | `#F1E4C2` | `#E7D5BC` | chữ than 13,20 · chữ đỏ 5,42 · chữ đỏ đậm 7,00 : 1 |
| `--than` | `#1E160E` | `#151008` | chữ kem 14,96 : 1; chữ than trên thẻ trắng 18,93 |
| `--mu-tat`, `--cuc-vang` | `#F2A900`, `#F5C211` | cả hai `#F5AA14` | 9,59 : 1 với than (chữ Marigold trên than, hay chữ than trên nhãn Marigold) |
| `--da` | `#B8A98C` | giữ | 8,19 : 1 với than |
| `--vien-o` | `#8C8577` | `#7A7366` | 3,71 : 1 với kem (nền ô nhập của trang công khai) · 3,49 với `#EBDCC6` (thẻ form quanh ô) · 3,27 với `#E7D5BC` · 4,70 với nền trắng (ô nhập của `/noi-bo`, kho, Beeftown Cân) |
| `--muc-nhat` | than cũ 68 % | than mới 68 % | 5,92 : 1 với kem · 5,61 với `#E7D5BC` · 6,63 với thẻ trắng |

**Hai giá trị khác đề xuất ngày 10/10/2026 của file này.** Đề xuất cũ là `--kem-sau` `#E7D5BC` và `--kem-dam` `#DAC5AA`. Khi làm thử, `#DAC5AA` làm dải "Cả bữa" ở trang chủ sẫm hơn hẳn thiết kế đang chạy. Giá trị đã áp dụng là `--kem-sau` `#EBDCC6` và `--kem-dam` `#E7D5BC`: hai bậc kem lùi lại một nấc, giữ độ chênh sáng giữa các khối gần với trước. `#DAC5AA` không còn dùng ở đâu.

**Token của kho** (khai trên `.kho-than` trong `web/src/styles/kho-khung.css`). Kho không có sắc riêng: mỗi token cùng mã với một màu ở bảng trên.

| Token | Cũ (đã bỏ) | Đã áp dụng | Là màu nào của bảng |
|---|---|---|---|
| `--kho-nen` (nền trang) | `#FFFCF6` | `#F0E3D0` | Cream |
| `--kho-the` (thẻ, ô nhập) | `#FFFFFF` | giữ | trắng |
| `--kho-vach` (viền thẻ, vạch trong thẻ) | `#EFE4D2` | `#E7D5BC` | kem đậm, cùng mã với `--kem-dam` |
| `--kho-vach-dam` (vạch đậm hơn) | `#E0D2BB` | `#B8A98C` | Warm Stone |

**Màu trạng thái của `/noi-bo`, kho và Beeftown Cân** — xanh = xong, vàng = lưu ý, đỏ nhạt = lỗi, làm ngay. Đây là màu chức năng của công cụ, không thuộc năm màu thương hiệu; ý nghĩa giữ như trước, sắc chỉnh lại cho hợp nền kem mới và đủ tương phản (xanh cũ chỉ được 4,21 : 1 trên kem mới). Khai một lần trên `.nb-than` của `web/src/styles/noi-bo.css`; kho đọc chung. Trước ngày 11/10/2026 các mã này nằm rải trong từng trang và có năm, sáu sắc "vàng đậm" khác nhau. **Sắc cụ thể do Claude chọn theo tương phản, Khánh chưa xem:** muốn đổi thì đổi một chỗ ở `.nb-than`, hai file HTML của Beeftown Cân và các bảng chép tay trong ba kiểm thử.

| Token | Cũ (đã bỏ) | Đã áp dụng | Tương phản |
|---|---|---|---|
| `--xanh` (chữ, vạch, đèn, nền nhãn đặc) | `#1F7A4C` | `#1A683F` | 6,78 : 1 với thẻ trắng · 5,36 với kem · 5,03 với `#EBDCC6` · 5,78 với nền xanh nhạt; chữ trắng đặt lên: 6,78 |
| `--xanh-nen` (nền nhạt) | `#E9F5EE` | `#E4F0E5` | chữ than 16,13 : 1 |
| `--xanh-vien` (viền khối xanh nhạt) | `#CDE7D8` | `#B9D8C0` | viền trang trí, không mang nghĩa một mình |
| `--vang-chu` (chữ, biểu tượng "lưu ý" trên nền sáng) | từ `#8A5A00` tới `#B07A00` | `#7A5200` | 6,92 : 1 với thẻ trắng · 5,47 với kem · 5,14 với `#EBDCC6` · 5,77 với nền vàng nhạt |
| `--vang-nen` (nền nhạt) | `#FFF5DC` | `#FDE9B5` | chữ than 15,77 : 1 |
| `--vang-vien` (viền khối vàng nhạt) | `#F3DDA5` | `#E8C36A` | viền trang trí |
| `--do-nen` (nền nhạt) | `#FDECEA` | `#FAE9E6` | chữ than 16,10 · chữ đỏ 6,61 : 1 |
| `--do-vien` (viền khối đỏ nhạt) | `#F2C9C3` | `#E8BDB7` | viền trang trí |

Đỏ của trạng thái là chính `--do`. Vàng đặc (nhãn "nháp", "sắp hết hạn", đèn vàng) là `--mu-tat` với chữ than đặt lên trên.

Các điểm phải giữ:

- Marigold và Warm Stone không làm chữ hay biểu tượng trên nền sáng: 1,56 và 1,83 : 1 với kem, 1,97 và 2,31 : 1 với thẻ trắng. Ở `/noi-bo` và kho, chữ "lưu ý" trên nền sáng dùng `--vang-chu`; đèn và chấm vàng tô Marigold và kẻ viền `--vang-chu`.
- Marigold trên nền đỏ được 3,94 : 1: chỉ dùng cho chữ lớn hoặc hình, không cho chữ thường.
- Đỏ trên nền than chỉ 2,43 : 1: không đặt chữ đỏ trên dải tối, trên đầu trang tối.
- Viền `#7A7366` trên `#E7D5BC` là 3,27 : 1, trên `#EBDCC6` là 3,49 : 1: vừa qua mức 3 : 1 của viền ô nhập. Trang công khai: ô nhập nền Cream (viền 3,71 : 1), đứng trong thẻ form nền `#EBDCC6` (viền 3,49 : 1) — cả hai đã đo lại bằng công thức WCAG trong `crm/test/test-cong-khai-giao-dien.mjs` nhóm 7; đừng đặt ô nhập lên nền sẫm hơn `#E7D5BC`. `/noi-bo`, kho, Beeftown Cân: ô nhập nền trắng (viền 4,70 : 1); không kẻ viền ô nhập bằng `--vach`, `--kho-vach` hay Warm Stone.
- Trang công khai không có nền trắng: mã màu viết thẳng trong file công khai chỉ được là mã của bảng trên (kiểm thử nhóm 7); màu nền trên trang đã dựng được đo ở `web/kiem-tra/do-giao-dien.mjs`. `/noi-bo`, kho và Beeftown Cân vẫn dựng thẻ và ô nhập nền trắng (mục 3, dòng "Màu trắng").
- Vòng focus: Charcoal trên nền sáng, Marigold trên nền tối. Marigold trên nền sáng không đủ để thấy.
- Bản in của `/noi-bo` và kho (`@media print`): chỉ đen, trắng, xám; nền kem không lên giấy.
- Màu viết bằng `rgba()` phải dùng số RGB của bảng mới (21, 16, 8 · 240, 227, 208 · 167, 12, 12 · 137, 6, 7). Kiểm thử đỏ khi một file của trang công khai, `/noi-bo`, kho hay Beeftown Cân còn mã hex hay bộ ba số RGB của bảng cũ, kể cả trong chú thích.
- **Đổi một mã là đổi cả hai nơi khai** (khối `.ck` và `:root`), hai file HTML của Beeftown Cân, file này, skill thiết kế và các bảng chép tay trong kiểm thử — trong cùng một PR. Chưa gộp hai khối thành một: gộp là một việc riêng, đụng thứ tự nạp CSS của trang công khai.

## 5. Nơi đã đổi và thứ còn mang màu cũ

Đã đổi lần đầu (PR "màu và thông tin chung", trang công khai):

| Nơi | Đổi gì |
|---|---|
| `web/src/styles/cong-khai.css` | 14 token khai lại trong khối `.ck` đầu tiên; màu `rgba()` theo số RGB mới |
| `web/src/components/*.astro` của trang công khai | Màu `rgba()` trong phần `<style>` theo số RGB mới |
| `web/src/layouts/Trang.astro` | Thẻ `theme-color` là `#F0E3D0` |
| `web/public/thuong-hieu/*.svg` (15 file), `web/public/bieu-tuong.svg` | Màu tô của logo, đầu bò, hoa văn; hình không đổi |
| `web/public/favicon.ico`, `web/public/thuong-hieu/bieu-tuong-180.png`, `chia-se-1200x630.png`, 4 biểu tượng trong `web/public/kho/` | Dựng lại bằng `web/cong-cu/thuong-hieu/tao-bieu-tuong.py` (bảng `DOI_MAU` đổi mã của PDF sang mã đã chốt) |
| `crm/test/test-cong-khai-giao-dien.mjs` | Hằng `BANG_MAU` và nhóm 6 |
| `web/THIET-KE.md` mục 2, `README.md` mục "Bảng màu", `AGENTS.md` | Tài liệu theo tình trạng lúc đó |
| Skill `.claude/skills/thiet-ke-beeftown/` (PR #63, đã gộp) | Lúc đó: hai bảng token, một cho trang công khai và một cho `/noi-bo`, kho |

Đã đổi lần hai (11/10/2026: `/noi-bo`, kho, Beeftown Cân):

| Nơi | Đổi gì |
|---|---|
| `web/src/styles/chung.css` | 14 token trong hai khối `:root` mang giá trị của bảng chốt — cùng giá trị với khối `.ck` |
| `web/src/styles/noi-bo.css` | 8 token màu trạng thái khai trên `.nb-than`; viền ô nhập là `--vien-o`; vòng focus Charcoal trên nền sáng, Marigold trên đầu trang tối; viền nút phụ là Warm Stone; `rgba()` theo số RGB mới |
| `web/src/styles/kho.css`, `web/src/styles/kho-khung.css` | Token `--kho-…` theo bảng ở mục 4; bỏ 4 token màu trạng thái riêng của kho (dùng chung của `.nb-than`); dòng thông báo chưa đọc mang một chấm Marigold thay cho nền vàng nhạt cả dòng |
| 25 trang dưới `web/src/pages/noi-bo/`, `web/src/components/SucKhoeHeThong.astro`, `web/src/components/kho/NhanHangChon.astro` | Mã hex viết cứng trong `<style>` và thuộc tính `style` đổi thành biến; bỏ mã dự phòng trong `var()` |
| `web/src/lib/qua-tai.ts` | Trang báo quá tải: nền Cream, chữ Charcoal, nút Beef Red chữ Cream |
| `web/src/layouts/NoiBo.astro`, `web/src/layouts/Kho.astro`, `web/public/kho/manifest.json` | `theme-color` và `theme_color` là `#151008`; `background_color` là `#F0E3D0` |
| `can-app/src/giao-dien.html`, `can-app/src/huong-dan.html` | 16 biến trong khối `:root` của mỗi file; mọi mã viết cứng đổi thành biến. Bản 2.9.2 (`can-app/README.md`) |
| Kiểm thử | Mới: `crm/test/test-noi-bo-bang-mau.mjs`, `can-app/test/thu-bang-mau.ts`. Đổi giá trị mong đợi: `test-cong-khai-giao-dien.mjs` nhóm 2, `test-ky-nang-thiet-ke.mjs` nhóm 3 |
| Tài liệu | File này, `README.md`, `AGENTS.md`, `web/THIET-KE.md`, `web/KHO.md`, `can-app/README.md`, skill thiết kế (một bảng token) |

Ghi chú từ lần đổi đầu, vẫn đúng:

- **`web/public/bieu-tuong.svg`** (và `favicon.ico`, biểu tượng màn hình chính trong `web/public/kho/`) là một bộ file cho cả ba nơi. Ngoài tab trình duyệt, `bieu-tuong.svg` còn hiện ở đầu trang kho (`web/src/layouts/Kho.astro`) và trên phiếu đặt hàng in (`web/src/pages/noi-bo/kho/dat-hang/[id]/in.astro`).
- **Biểu tượng của `BeeftownCan.exe`**: `can-app/scripts/dong-goi.ts` bọc `web/public/kho/bieu-tuong-192.png` vào file chạy (chỉ khi đóng gói trên Windows — `web/KHO.md` mục 4). PR "màu và thông tin chung" đổi file ảnh đó mà không tăng `PHIEN_BAN`, nên hai bản 2.9.1 đóng gói trước và sau PR đó có thể khác biểu tượng. Bản 2.9.2 là bản đầu có giao diện theo bảng màu mới.
- **Logo ngang trên web**: `DOI_MAU_RIENG` trong `tao-bieu-tuong.py` đổi dòng "Pick it – Grill it – Love it" của `logo-ngang-do.svg` từ đỏ đậm sang Beef Red, để cả logo một màu như guideline. Logo trên web vẫn là nét tách từ PDF nhận diện cũ rồi đổi mã màu, **chưa phải** file vector của bộ tài sản bản 17 (dòng cuối mục này).

Còn mang màu cũ:

| Nơi | Ghi gì |
|---|---|
| 15 ảnh `web/public/kho/hd-*.png` | Ảnh chụp màn hình trong trang hướng dẫn của kho (`/noi-bo/kho/huong-dan`), chụp trước ngày 11/10/2026: còn giao diện bảng cũ. **Chờ chụp lại** (`web/KHO.md`, mục 3i) |
| `web/cong-cu/thuong-hieu/` (`cau_hinh_tai_san.py`, `tach-tu-pdf.py`, `ve-svg.mjs`) | Mã màu của PDF nhận diện, dùng để tách tài sản từ PDF — đây là mã nguồn, không phải mã trên trang |
| Tài liệu thiết kế cũ ở gốc repo (`Beeftown_*.html`, `Beeftown_Concept_Board_v1.svg`, `Beeftown_Website/`) | Làm trước guideline; không phát hành, không sửa, không chép |

Lệnh tìm chỗ còn sót (không in ra dòng nào là sạch): `grep -rnE "30, ?22, ?14|251, ?244, ?225|178, ?58, ?44|150, ?15, ?19" web/src can-app/src`.

Logo vector bảng màu mới đã có sẵn trong thư mục tài sản trên máy Khánh (`01_Logo_vector`: lockup, brandmark, wordmark; bản nền sáng màu red, charcoal, black; bản nền tối màu cream, white).

## 6. Địa điểm

- **Khánh đã quyết:** địa điểm là 63 Hồ Tùng Mậu (07/10/2026); quán ở **tầng 3**, khách vào bằng **lối vào riêng ngay cạnh GS25** (09/10/2026). Địa điểm **có thang máy**: Khánh xác nhận ngày 11/10/2026.
- **Chưa biết:** nút thang máy ghi số mấy cho tầng của quán. Trang chỉ ghi "tầng 3" / "Floor 3" / "3층", không ghi số nút.
- Cách ghi: "Tầng 3, 63 Hồ Tùng Mậu" (tiếng Anh: "Floor 3, 63 Hồ Tùng Mậu"; tiếng Hàn: "Hồ Tùng Mậu 63, 3층"). Bản ngắn: "63 Hồ Tùng Mậu, TP.HCM" · "63 Hồ Tùng Mậu, Ho Chi Minh City" · "호치민시 Hồ Tùng Mậu 63".
- **Câu chỉ đường là Claude đề xuất, CHỜ KHÁNH DUYỆT CHỮ:** "Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3." · "Use our own entrance, right next to GS25, and take the lift to Floor 3." · "GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요." Trang đang dùng đúng ba câu này (`loiLen` trong `web/src/lib/chu.ts`), và kiểm thử giữ chúng đúng từng chữ để ba bản không lệch nhau. Khánh duyệt chữ khác thì sửa `loiLen` cùng các bản chép tay trong `crm/test/test-cong-khai-dia-diem.mjs`, `test-cong-khai-cau-chu.mjs`, `web/kiem-tra/trinh-duyet.mjs`.
- **Mã nguồn đã đổi** (PR "màu và thông tin chung"): địa chỉ cố định `DIA_CHI_NHA_HANG`, câu chung `loiLen`, thẻ tiêu đề và mô tả của từng trang, JSON-LD, hình thang máy thay hình cầu thang, bảng từ của máy dịch (`web/src/lib/may-dich.ts`). Gác: `crm/test/test-cong-khai-dia-diem.mjs` (mã nguồn của trang công khai), `test-cong-khai-cau-chu.mjs` nhóm 7 (chữ khách đọc), `web/kiem-tra/trinh-duyet.mjs` (trang đã dựng), `web/kiem-tra/thu-day-du.mjs` nhóm 7 (trang có bản công bố). Mẫu tìm chữ sai dùng chung: `web/kiem-tra/mau-dia-diem.mjs`.
- **Chưa đổi, chờ Khánh quyết:** dòng địa chỉ pháp nhân ở chân trang (`PHAP_NHAN.diaChi` trong `web/src/lib/chu.ts`). Dòng này chép theo giấy đăng ký đang dùng cho hồ sơ xác minh trên Meta. Kiểm thử giữ nó nguyên từng ký tự.
- **Tên phường của 63 Hồ Tùng Mậu chưa có giấy xác nhận:** trang, thẻ mô tả và JSON-LD không ghi phường, cũng không ghi quận. Không tự thêm. Kiểm thử bắt mọi vế phường / quận trong chữ khách đọc, tên gì cũng vậy. Khi có giấy, danh sách mã và kiểm thử phải sửa cùng lúc nằm ở chú thích của `DIA_CHI_PHAN` trong `web/src/lib/chu.ts`.
- Điều đã biết về đường đến chỉ có địa chỉ, tầng 3, lối vào riêng ngay cạnh GS25, thang máy. Chỗ gửi xe, mốc đường, số bước, khoảng cách, lối cho xe lăn: chưa xác nhận, không viết lên trang.
- Không gọi 63 Hồ Tùng Mậu là "toà nhà". Trang chỉ nói địa điểm hiện tại, không kể chuyện đổi địa điểm.
- **Địa chỉ đã công bố trong database thắng địa chỉ trong mã.** Khóa `dia_chi_hien_thi` (màn Nội dung của `/noi-bo`, nhóm Liên hệ) nếu đang công bố thì trang in bản đó. Đổi địa điểm phải xem lại cả các khóa `dia_chi_hien_thi`, `google_maps_url`, `tieu_de_og`, `mo_ta_og`, `dong_trang_thai`, và ở màn Cài đặt (`/noi-bo/cai-dat`): tên chi nhánh và ô địa chỉ của chi nhánh. Bot Messenger trả lời khách bằng "Beeftown — <tên chi nhánh>" và, khi chưa có bản công bố, bằng ô địa chỉ đó.
