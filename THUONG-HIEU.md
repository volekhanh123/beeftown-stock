# Beeftown — bảng màu thương hiệu đã chốt và việc đưa sang website

> **Ngày 22/10/2026 Khánh chốt bảng màu mới theo bộ logo gửi ngày 21/10/2026: chỉ đỏ `#BD0000`, đen
> `#000000`, trắng `#FFFFFF`. Bỏ Cream, Marigold, Warm Stone.** Mã của website và Beeftown Cân **chưa
> đổi**: website vẫn chạy bảng 09/10/2026, Beeftown Cân vẫn chạy bảng trước đó (mục 1–5 bên dưới, kiểm
> thử vẫn canh đúng các mã đó). Bảng mới, chỗ còn màu cũ và danh sách việc đổi màu chờ Khánh duyệt: mục 0.

## 0. Bảng màu mới — Khánh chốt 22/10/2026, mã chưa đổi

| Tên | HEX | RGB | Thay cho |
|---|---|---|---|
| Đỏ | `#BD0000` | 189, 0, 0 | Beef Red `#A70C0C` |
| Đen | `#000000` | 0, 0, 0 | Charcoal `#151008` |
| Trắng | `#FFFFFF` | 255, 255, 255 | Cream `#F0E3D0` làm nền |

- Bỏ hẳn: Cream `#F0E3D0`, Marigold `#F5AA14`, Warm Stone `#B8A98C`.
- Nguồn: bộ logo và màu chính thức Khánh gửi ngày 21/10/2026. Bảng chưa có tên tiếng Anh cho từng màu,
  chưa có mã CMYK và Pantone, chưa ghi phần của mỗi màu trên một bề mặt.
- Tương phản (WCAG 2.2): chữ đỏ trên nền trắng, chữ trắng trên nền đỏ 6,64 : 1 (đủ cho chữ thường); đen
  trên trắng 21 : 1; đỏ trên đen chỉ 3,16 : 1, chỉ dùng cho chữ lớn (từ 24 px, hoặc 18,66 px đậm) và
  hình, không dùng cho chữ thường.
- Ba điều ngược với bảng 09/10/2026, phải đổi cả kiểm thử khi đổi mã:
  1. Trắng thành màu chính. Luật "website không có nền trắng" (mục 3 và 4) bỏ; hai nhóm kiểm thử bắt
     mã trắng phải viết lại: `crm/test/test-cong-khai-giao-dien.mjs` nhóm 7 và
     `crm/test/test-noi-bo-bang-mau.mjs` nhóm 3–4.
  2. Không còn màu vàng. Marigold đang là vòng focus trên nền tối, chấm thông báo chưa đọc, nhãn
     "nháp" và "sắp hết hạn", đèn vàng ở `/noi-bo` và kho.
  3. Không còn màu ấm trung gian. Warm Stone đang là chữ phụ trên nền tối và vạch đậm của kho
     (`--kho-vach-dam`); hai nền kem đậm (`--kem-sau`, `--kem-dam`) đang tách thẻ khỏi nền trang.

### Nơi còn màu cũ (22/10/2026)

| Nơi | Đang chạy |
|---|---|
| Trang công khai: khối `.ck` của `web/src/styles/cong-khai.css` | Bảng 09/10/2026 |
| `/noi-bo` và kho: hai khối `:root` của `web/src/styles/chung.css`, `.nb-than` của `web/src/styles/noi-bo.css`, `.kho-than` của `web/src/styles/kho-khung.css` | Bảng 09/10/2026 và 8 màu trạng thái |
| Logo, hoa văn, biểu tượng: 16 file SVG trong `web/public/thuong-hieu/`, `web/public/bieu-tuong.svg`, `web/public/favicon.ico`, 2 ảnh PNG trong `web/public/thuong-hieu/`, 4 biểu tượng trong `web/public/kho/` | Bảng 09/10/2026 |
| `theme-color`: `web/src/layouts/Trang.astro`, `NoiBo.astro`, `Kho.astro`, `web/public/kho/manifest.json` | Bảng 09/10/2026 |
| Beeftown Cân: `can-app/src/giao-dien.html`, `can-app/src/huong-dan.html` | Bảng trước 09/10/2026 (mục 5) |
| 15 ảnh hướng dẫn kho `web/public/kho/hd-*.png` | Giao diện trước 11/10/2026 |
| Mini App Zalo (thư mục `mini-app/`, vào repo ở PR riêng) | Bảng mới từ bản 1.0, thêm 7 màu pha xám và đỏ (câu 1) |

### Câu Khánh cần trả lời trước khi đổi mã

1. **Màu pha trên màn hình.** Ngày 10/10/2026 Khánh cho website giữ 6 token màu pha (`--do-dam` và
   `--do-sau` cho đỏ đậm, 2 nền kem đậm, viền ô nhập, chữ phụ). Bảng mới có được thêm màu pha không: 1
   đỏ đậm hơn cho nút khi di chuột; 1 xám cho viền ô nhập (tối thiểu 3 : 1 với trắng); 1 xám cho chữ
   phụ (tối thiểu 4,5 : 1 với trắng); 1 nền xám nhạt để tách thẻ khỏi nền trắng? Mini App Zalo đang
   dùng 7 màu pha như vậy (`mini-app/src/styles.css`): câu trả lời áp cho cả Mini App.
2. **Màu trạng thái** của `/noi-bo`, kho và Beeftown Cân (xanh = xong, vàng = lưu ý, đỏ nhạt = làm
   ngay): giữ làm màu chức năng như hiện nay (không thuộc bảng thương hiệu), hay đổi?
3. **Thay Marigold** ở vòng focus trên nền tối, chấm chưa đọc, nhãn "nháp", đèn vàng bằng màu gì.
   Đề xuất của Claude: vòng focus trắng trên nền tối; chấm và nhãn dùng màu trạng thái của câu 2.
4. **Nền trang công khai:** trắng hay đen, và phần của mỗi màu (bảng 09/10/2026 đang chạy kem khoảng
   60, tối khoảng 25, đỏ khoảng 12, vàng khoảng 3).
5. **Logo:** thay nét tách từ PDF cũ bằng file vector của bộ logo 21/10/2026. Cần Khánh gửi bản SVG
   (repo chặn PNG và PDF, nhận SVG).

### Danh sách việc đổi màu — chờ Khánh duyệt

Chưa việc nào bắt đầu. Hạn ngày Khánh ghi khi duyệt.

| # | Việc | Ai làm | Hạn |
|---|---|---|---|
| 1 | Trả lời 5 câu ở trên | Khánh | |
| 2 | Gửi file SVG của bộ logo 21/10/2026: lockup, brandmark, wordmark, bản nền sáng và bản nền tối | Khánh | |
| 3 | Đổi mã cả website trong **1 PR**: 14 token của khối `.ck` và 14 token của `:root` cùng giá trị; 8 màu trạng thái theo câu 2; 4 token của kho; 35 chỗ `rgba()` trong 13 file theo số RGB mới; viết lại 4 bảng chép tay trong kiểm thử (`test-cong-khai-giao-dien.mjs`, `test-noi-bo-bang-mau.mjs`, `web/kiem-tra/do-giao-dien.mjs`, `web/kiem-tra/thu-day-du.mjs`) và 2 nhóm bắt mã trắng; sửa skill thiết kế, `README.md` mục "Bảng màu", `AGENTS.md` mục "Màu", `web/THIET-KE.md` mục 2, `web/KHO.md`, file này | Claude Code | |
| 4 | Đổi tên token cho đúng màu mới (`--kem` mang mã trắng là tên sai): 172 chỗ `var(--kem)`, `var(--kem-sau)`, `var(--kem-dam)`, `var(--cuc-vang)`, `var(--mu-tat)`, `var(--da)` trong 33 file. Làm cùng việc 3 hay PR sau: Khánh chọn | Claude Code | |
| 5 | Dựng lại logo, hoa văn, `bieu-tuong.svg`, `favicon.ico`, ảnh chia sẻ, 4 biểu tượng kho: từ file của việc 2, hoặc đổi bảng `DOI_MAU` của `web/cong-cu/thuong-hieu/tao-bieu-tuong.py` nếu chưa có file | Claude Code | |
| 6 | Đổi `theme-color` ở 3 layout và `theme_color`, `background_color` của `web/public/kho/manifest.json` | Claude Code, cùng PR việc 3 | |
| 7 | Beeftown Cân đổi thẳng sang bảng mới (bỏ qua bảng 09/10/2026): khối `:root` của 2 file HTML, nền trắng, màu trạng thái theo câu 2, tăng `PHIEN_BAN` (đang là 2.10.0) | Claude Code, PR riêng | |
| 8 | Chụp lại 15 ảnh `web/public/kho/hd-*.png` sau khi việc 3 gộp | Claude Code | |
| 9 | Deploy website sau khi việc 3, 5, 6 gộp và CI xanh; xem lại trang chủ, Thực đơn, `/noi-bo`, kho trên điện thoại | Khánh | |

---

## Bảng 09/10/2026 đang chạy trên website (phần dưới viết trước ngày 22/10/2026)

Lập ngày 10/10/2026 từ Brand Guideline (bản lưu số 17 trên Claude). Khánh chốt bảng màu ngày 09/10/2026.
File này là bản tóm tắt cho người viết mã. Cập nhật ngày 11/10/2026 cùng PR "màu và thông tin chung"
(trang công khai) và PR "thành phần và khung trang" (trang công khai bỏ nền trắng, địa điểm có thang
máy); ngày 12/10/2026 cùng lần đổi màu `/noi-bo` và kho.

> **Cả website ĐÃ đổi theo bảng màu này, và không có nền trắng ở đâu cả.** Trang công khai đổi trước
> (token trong khối `.ck` của `web/src/styles/cong-khai.css`, logo và hoa văn SVG, ảnh chia sẻ, biểu
> tượng trình duyệt). `/noi-bo` và kho đổi ngày 12/10/2026 (token trong hai khối `:root` của
> `web/src/styles/chung.css`; thẻ Cream trên nền kem sau). Khối `.ck` và `:root` **cùng giá trị nhưng
> chưa gộp**: đổi một mã thì đổi cả hai nơi. **Beeftown Cân CHƯA đổi**: một PR riêng, kèm phiên bản mới
> của chương trình. Thứ còn mang màu cũ: mục 5.

- Guideline đầy đủ (5 trang, tiếng Anh): https://claude.ai/artifact/EKyJZyhi7sDznKXHRtc3iq
- Logo vector, file in đúng cỡ, bản PDF của guideline: máy Khánh, thư mục `Documents\Beeftown_Brand_Assets_V17_2026-10-09`. Không đưa vào repo (`.gitignore` chặn ảnh và PDF).

---

## 1. Bảng màu 09/10/2026 (5 màu, hệ RGB) — website đang chạy, sẽ thay bằng bảng ở mục 0

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

Trang công khai, `/noi-bo` và kho dùng cùng một bảng, nên bảng dưới chỉ còn một cột cho mã. Beeftown Cân còn bảng cũ (mục 5).

| Việc | Guideline | Website (trang công khai, `/noi-bo`, kho) |
|---|---|---|
| Beef Red | `#A70C0C` | `--do` `#A70C0C` |
| Cream | `#F0E3D0` | `--kem` `#F0E3D0` |
| Charcoal | `#151008` | `--than` `#151008` |
| Màu vàng | 1 màu: Marigold `#F5AA14` | 1 mã `#F5AA14`, 2 tên biến (`--cuc-vang`, `--mu-tat`) |
| Màu pha | Không có | Có, Khánh cho phép ngày 10/10/2026: `--do-dam` và `--do-sau` `#890607`, `--kem-sau` `#EBDCC6`, `--kem-dam` `#E7D5BC`, `--vien-o` `#7A7366`, `--muc-nhat` (Charcoal 68 %) |
| Màu trạng thái | Không nói tới | Chỉ ở `/noi-bo`, kho, Beeftown Cân: xanh = xong, vàng = lưu ý, đỏ nhạt = làm ngay (mục 4). Màu chức năng của công cụ, không thuộc năm màu thương hiệu |
| Màu trắng | Không có | Không dùng. Trang công khai (từ PR "thành phần và khung trang"): thẻ nền kem sau trên nền Cream, ô nhập nền Cream. `/noi-bo` và kho (từ 12/10/2026): thẻ Cream trên nền kem sau, ô nhập Cream, ô đánh dấu tự vẽ, chữ trên nút đỏ là Cream. Còn trắng có chủ đích: bản in ra giấy; ở trang công khai thẻ "Đọc nhãn khay" (chờ PR bố cục trang chủ) |
| Phần của từng màu | Cream 60 · Beef Red 25 · Charcoal 10 · Marigold dưới 5 | Trang công khai: kem 60 · tối 25 · đỏ 12 · vàng 3 (`web/THIET-KE.md` ghi là gợi ý), chưa đổi. `/noi-bo`, kho: không tính |
| Warm Stone | Chỉ nét kẻ và nền phụ | Chữ phụ trên nền tối; ở kho còn là vạch đậm (`--kho-vach-dam`) |
| Độ đậm Montserrat | 500 / 700 / 800 / 900 | 400 / 600 / 700 / 800, chưa đổi (Beeftown Cân dùng phông hệ thống) |
| Địa điểm | Tầng 3, 63 Hồ Tùng Mậu | Trang công khai đã đổi, trừ dòng địa chỉ pháp nhân ở chân trang (mục 6). `/noi-bo`, kho không ghi địa chỉ nhà hàng trong mã |

Bốn việc cần Khánh quyết:

1. **Đã quyết ngày 10/10/2026:** website được giữ màu pha. Màn hình cần 1 đỏ đậm hơn cho nút khi di chuột và chữ nhỏ, 2 nền kem đậm hơn để tách khối, 1 màu viền ô nhập. Guideline vẫn ghi không màu pha; phép này chỉ áp dụng cho màn hình (website, và Beeftown Cân khi đổi màu).
2. **Vẫn chờ:** phần của từng màu trên trang web theo guideline (đỏ 25, tối 10) hay giữ như đang chạy (tối 25, đỏ 12). Trang công khai hiện giữ như đang chạy; đổi là đổi bề mặt của vài khối, thuộc các PR bố cục sau.
3. **Vẫn chờ:** độ đậm Montserrat trên web theo guideline (500 / 700 / 800 / 900) hay giữ 400 / 600 / 700 / 800. Hai lần đổi màu không đụng tới chữ.
4. **Đã làm ngày 12/10/2026, chờ Khánh xem ảnh:** `/noi-bo` và kho bỏ nền trắng như trang công khai (guideline không có màu trắng): thẻ Cream trên nền kem sau. Ba nền nhạt của màu trạng thái cũng sẫm lại ngang kem sau — sáng hơn thẻ Cream thì thành mảng gần trắng. Beeftown Cân bỏ trắng cùng PR đổi màu của nó.

## 4. Token đã áp dụng

Một bảng, khai ở **hai nơi cùng giá trị, chưa gộp**: khối `.ck` đầu tiên của `web/src/styles/cong-khai.css` (trang công khai) và hai khối `:root` của `web/src/styles/chung.css` (`/noi-bo` và kho). Tương phản tính theo WCAG 2.2.

Kiểm thử chép tay từng mã, không đọc từ file CSS:

- `crm/test/test-cong-khai-giao-dien.mjs`: nhóm 6 (khối `.ck`, 16 cặp tương phản của trang công khai), nhóm 2 (13 biến gốc của `:root`).
- `crm/test/test-noi-bo-bang-mau.mjs`: `/noi-bo` và kho. Nhóm 1 so khối `:root` với khối `.ck`; nhóm 3–4 bắt mã trắng và ô của trình duyệt còn tô trắng; nhóm 5 tính các cặp tương phản trên thẻ Cream, nền kem sau, kem đậm và ba nền nhạt.
- `crm/test/test-ky-nang-thiet-ke.mjs`: bảng token trong skill thiết kế khớp cả hai nơi khai.

| Token | Bảng cũ (đã bỏ) | Đã áp dụng | Tương phản |
|---|---|---|---|
| `--do` | `#B23A2C` | `#A70C0C` | 6,15 : 1 với kem · 5,77 với `#EBDCC6` · 5,42 với `#E7D5BC`; chữ kem đặt lên: 6,15 |
| `--do-dam` | `#8F2C21` | `#890607` | 7,93 : 1 với kem; chữ kem đặt lên: 7,93 |
| `--do-sau` | `#960F13` | `#890607` (cùng mã với `--do-dam`) | 7,45 và 7,00 : 1 với 2 nền kem đậm hơn |
| `--kem` | `#FBF4E1` | `#F0E3D0` | chữ than 14,96 : 1 |
| `--kem-sau` | `#F5ECD7` | `#EBDCC6` | chữ than 14,05 · chữ đỏ 5,77 : 1 |
| `--kem-dam` | `#F1E4C2` | `#E7D5BC` | chữ than 13,20 · chữ đỏ 5,42 · chữ đỏ đậm 7,00 : 1 |
| `--than` | `#1E160E` | `#151008` | chữ kem 14,96 : 1; chữ than trên nền kem sau 14,05 |
| `--mu-tat`, `--cuc-vang` | `#F2A900`, `#F5C211` | cả hai `#F5AA14` | 9,59 : 1 với than (chữ Marigold trên than, hay chữ than trên nhãn Marigold) |
| `--da` | `#B8A98C` | giữ | 8,19 : 1 với than |
| `--vien-o` | `#8C8577` | `#7A7366` | 3,71 : 1 với kem (nền ô nhập ở cả website) · 3,49 với `#EBDCC6` (thẻ form của trang công khai, nền trang của `/noi-bo` và kho) · 3,27 với `#E7D5BC` |
| `--muc-nhat` | than cũ 68 % | than mới 68 % | 5,92 : 1 với kem · 5,80 với `#EBDCC6` · 5,61 với `#E7D5BC` |

**Hai giá trị khác đề xuất ngày 10/10/2026 của file này.** Đề xuất cũ là `--kem-sau` `#E7D5BC` và `--kem-dam` `#DAC5AA`. Khi làm thử, `#DAC5AA` làm dải "Cả bữa" ở trang chủ sẫm hơn hẳn thiết kế đang chạy. Giá trị đã áp dụng là `--kem-sau` `#EBDCC6` và `--kem-dam` `#E7D5BC`: hai bậc kem lùi lại một nấc, giữ độ chênh sáng giữa các khối gần với trước. `#DAC5AA` không còn dùng ở đâu.

**Hai bề mặt của `/noi-bo` và kho** (khai trên `.nb-than` trong `web/src/styles/noi-bo.css`; kho đọc chung): `--nb-nen` = `--kem-sau` (nền trang), `--nb-the` = `--kem` (thẻ, dòng danh sách, bảng, thanh điều hướng, thanh đáy, menu thả, hộp thoại). Ô nhập luôn nền Cream; chữ gợi ý trong ô là `--muc-nhat` (xám mặc định của trình duyệt chỉ 3,64 : 1 trên Cream). Cream và kem sau chỉ chênh 1,07 : 1: thẻ tách khỏi nền bằng viền `--vach` (Charcoal 16 %), như thẻ của trang công khai. Khi in, cả họ kem về trắng.

**Token của kho** (khai trên `.kho-than` trong `web/src/styles/kho-khung.css`). Kho không có sắc riêng: token chỉ trỏ về biến.

| Token | Cũ (đã bỏ) | Đã áp dụng |
|---|---|---|
| `--kho-nen` (nền trang) | `#FFFCF6` | `--nb-nen` (kem sau) |
| `--kho-the` (thẻ) | `#FFFFFF` | `--nb-the` (Cream) |
| `--kho-vach` (viền thẻ, vạch trong thẻ) | `#EFE4D2` | `--vach` (Charcoal 16 %; 1,40 : 1 với thẻ Cream) |
| `--kho-vach-dam` (vạch đậm hơn) | `#E0D2BB` | `--da` (Warm Stone) |

**Màu trạng thái của `/noi-bo` và kho** — xanh = xong, vàng = lưu ý, đỏ nhạt = lỗi, làm ngay. Đây là màu chức năng của công cụ, không thuộc năm màu thương hiệu; ý nghĩa giữ như trước, sắc chỉnh lại cho hợp hai nền kem và đủ tương phản (xanh cũ chỉ được 4,21 : 1 trên kem mới). Ba nền nhạt sẫm ngang kem sau, không sáng hơn thẻ Cream (có kiểm thử). Khai một lần trên `.nb-than` của `web/src/styles/noi-bo.css`; kho đọc chung. Trước đây các mã này nằm rải trong từng trang và có năm, sáu sắc "vàng đậm" khác nhau. **Sắc cụ thể do Claude chọn theo tương phản, Khánh chưa xem:** muốn đổi thì đổi một chỗ ở `.nb-than`, skill thiết kế và bảng chép tay trong `test-noi-bo-bang-mau.mjs`. Beeftown Cân có màu trạng thái riêng theo bảng cũ, đổi cùng PR của nó.

| Token | Cũ (đã bỏ) | Đã áp dụng | Tương phản |
|---|---|---|---|
| `--xanh` (chữ, vạch, đèn, nền nhãn đặc) | `#1F7A4C` | `#1A683F` | 5,36 : 1 với kem · 5,03 với `#EBDCC6` · 5,03 với nền xanh nhạt; chữ kem đặt lên: 5,36 |
| `--xanh-nen` (nền nhạt) | `#E9F5EE` | `#D3E3C6` | chữ than 14,04 : 1 |
| `--xanh-vien` (viền khối xanh nhạt) | `#CDE7D8` | `#A3C597` | viền trang trí, không mang nghĩa một mình |
| `--vang-chu` (chữ, biểu tượng "lưu ý" trên nền sáng) | từ `#8A5A00` tới `#B07A00` | `#7A5200` | 5,47 : 1 với kem · 5,14 với `#EBDCC6` · 5,16 với nền vàng nhạt |
| `--vang-nen` (nền nhạt) | `#FFF5DC` | `#F6DC9E` | chữ than 14,10 : 1 |
| `--vang-vien` (viền khối vàng nhạt) | `#F3DDA5` | `#DDB65C` | viền trang trí |
| `--do-nen` (nền nhạt) | `#FDECEA` | `#F2D6CE` | chữ than 13,78 · chữ đỏ 5,66 : 1 |
| `--do-vien` (viền khối đỏ nhạt) | `#F2C9C3` | `#DDA79C` | viền trang trí |

Đỏ của trạng thái là chính `--do`. Vàng đặc (nhãn "nháp", "sắp hết hạn", đèn vàng) là `--mu-tat` với chữ than đặt lên trên.

Các điểm phải giữ:

- Marigold và Warm Stone không làm chữ hay biểu tượng trên nền sáng: 1,56 và 1,83 : 1 với kem, 1,46 và 1,71 : 1 với kem sau. Ở `/noi-bo` và kho, chữ "lưu ý" trên nền sáng dùng `--vang-chu`; đèn và chấm vàng tô Marigold và kẻ viền `--vang-chu`.
- Marigold trên nền đỏ được 3,94 : 1: chỉ dùng cho chữ lớn hoặc hình, không cho chữ thường.
- Đỏ trên nền than chỉ 2,43 : 1: không đặt chữ đỏ trên dải tối, trên đầu trang tối.
- Viền `#7A7366` trên `#E7D5BC` là 3,27 : 1, trên `#EBDCC6` là 3,49 : 1: vừa qua mức 3 : 1 của viền ô nhập. Trang công khai: ô nhập nền Cream (viền 3,71 : 1), đứng trong thẻ form nền `#EBDCC6` (viền 3,49 : 1) — cả hai đã đo lại bằng công thức WCAG trong `crm/test/test-cong-khai-giao-dien.mjs` nhóm 7; đừng đặt ô nhập lên nền sẫm hơn `#E7D5BC`. `/noi-bo` và kho: ô nhập nền Cream (viền 3,71 : 1), trên nền trang kem sau 3,49 : 1; nút phụ cũng viền `--vien-o`; không kẻ viền ô nhập bằng `--vach`, `--kho-vach` hay Warm Stone.
- Website không có nền trắng: mã màu viết thẳng trong file công khai chỉ được là mã của bảng trên (`test-cong-khai-giao-dien.mjs` nhóm 7; màu nền trên trang đã dựng được đo ở `web/kiem-tra/do-giao-dien.mjs`); file của `/noi-bo` và kho cũng vậy, kể cả ô nhập, ô đánh dấu, nút chọn tệp, hộp thoại của trình duyệt (`test-noi-bo-bang-mau.mjs` nhóm 3–4).
- Vòng focus: Charcoal trên nền sáng, Marigold trên nền tối. Marigold trên nền sáng không đủ để thấy.
- Bản in của `/noi-bo` và kho (`@media print`): chỉ đen, trắng, xám; khi in, cả họ kem (`--kem`, `--kem-sau`, `--kem-dam`, hai bề mặt) về trắng nên nền kem không lên giấy kể cả khi máy in bật "in nền"; ô đánh dấu và ô chọn một trả về ô của hệ thống. Ba nền nhạt của màu trạng thái vẫn lên giấy khi bật "in nền" — đó là thông tin, như trước.
- Màu viết bằng `rgba()` phải dùng số RGB của bảng mới (21, 16, 8 · 240, 227, 208 · 167, 12, 12 · 137, 6, 7). Kiểm thử đỏ khi một file của trang công khai, `/noi-bo` hay kho còn mã hex hay bộ ba số RGB của bảng cũ, kể cả trong chú thích.
- **Đổi một mã là đổi cả hai nơi khai** (khối `.ck` và `:root`), file này, skill thiết kế và các bảng chép tay trong kiểm thử — trong cùng một PR (khi Beeftown Cân đã đổi: cả hai file HTML của nó). Chưa gộp hai khối thành một: gộp là một việc riêng, đụng thứ tự nạp CSS của trang công khai.

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

Đã đổi lần hai (12/10/2026: `/noi-bo` và kho, không nền trắng):

| Nơi | Đổi gì |
|---|---|
| `web/src/styles/chung.css` | 14 token trong hai khối `:root` mang giá trị của bảng chốt — cùng giá trị với khối `.ck` |
| `web/src/styles/noi-bo.css` | Hai bề mặt `--nb-nen` (kem sau), `--nb-the` (Cream) và 8 token màu trạng thái khai trên `.nb-than`; thẻ, thanh điều hướng, thanh đáy nền Cream; ô nhập Cream viền `--vien-o`; ô của trình duyệt không tô trắng (ô không lớp riêng, ô tự điền, ô đánh dấu và ô chọn một tự vẽ, nút chọn tệp, hộp thoại, khung nhóm ô, thanh tiến độ); chữ gợi ý `--muc-nhat`; chữ trên nút đỏ, nhãn xanh là Cream; nút phụ viền `--vien-o`; vòng focus Charcoal trên nền sáng, Marigold trên đầu trang tối; khi in cả họ kem về trắng và ô đánh dấu trả về ô của hệ thống; `rgba()` theo số RGB mới |
| `web/src/styles/kho.css`, `web/src/styles/kho-khung.css` | Token `--kho-…` trỏ về biến (mục 4); bỏ 4 token màu trạng thái riêng của kho (dùng chung của `.nb-than`); thanh đáy, menu thả, chip, bảng, thẻ nền Cream; dòng thông báo chưa đọc mang một chấm Marigold thay cho nền vàng nhạt cả dòng |
| 29 file dưới `web/src/pages/noi-bo/`, `web/src/components/SucKhoeHeThong.astro`, `web/src/components/kho/NhanHangChon.astro` | Mã hex viết cứng (kể cả trắng) trong `<style>` và thuộc tính `style` đổi thành biến; bỏ mã dự phòng trong `var()`; bỏ `accent-color` |
| `web/src/lib/qua-tai.ts` | Trang báo quá tải: nền Cream, chữ Charcoal, nút Beef Red chữ Cream |
| `web/src/layouts/NoiBo.astro`, `web/src/layouts/Kho.astro`, `web/public/kho/manifest.json` | `theme-color` và `theme_color` là `#151008`; `background_color` là `#EBDCC6` (nền trang kho) |
| Kiểm thử | Mới: `crm/test/test-noi-bo-bang-mau.mjs`. Đổi giá trị mong đợi: `test-cong-khai-giao-dien.mjs` nhóm 2, `test-ky-nang-thiet-ke.mjs` nhóm 3 |
| Tài liệu | File này, `README.md`, `AGENTS.md`, `web/THIET-KE.md`, `web/KHO.md`, skill thiết kế (một bảng token) |

Ghi chú từ lần đổi đầu, vẫn đúng:

- **`web/public/bieu-tuong.svg`** (và `favicon.ico`, biểu tượng màn hình chính trong `web/public/kho/`) là một bộ file cho cả ba nơi. Ngoài tab trình duyệt, `bieu-tuong.svg` còn hiện ở đầu trang kho (`web/src/layouts/Kho.astro`) và trên phiếu đặt hàng in (`web/src/pages/noi-bo/kho/dat-hang/[id]/in.astro`).
- **Biểu tượng của `BeeftownCan.exe`**: `can-app/scripts/dong-goi.ts` bọc `web/public/kho/bieu-tuong-192.png` vào file chạy (chỉ khi đóng gói trên Windows — `web/KHO.md` mục 4). PR "màu và thông tin chung" đổi file ảnh đó mà không tăng `PHIEN_BAN`, nên hai bản 2.9.1 đóng gói trước và sau PR đó có thể khác biểu tượng.
- **Logo ngang trên web**: `DOI_MAU_RIENG` trong `tao-bieu-tuong.py` đổi dòng "Pick it – Grill it – Love it" của `logo-ngang-do.svg` từ đỏ đậm sang Beef Red, để cả logo một màu như guideline. Logo trên web vẫn là nét tách từ PDF nhận diện cũ rồi đổi mã màu, **chưa phải** file vector của bộ tài sản bản 17 (dòng cuối mục này).

Còn mang màu cũ:

| Nơi | Ghi gì |
|---|---|
| Beeftown Cân: `can-app/src/giao-dien.html`, `can-app/src/huong-dan.html` | Bảng cũ (đỏ, kem, than, mù tạt) khai trong khối `:root` của mỗi file; thẻ, ô nhập nền trắng. **PR riêng**, kèm phiên bản mới của chương trình — sau bản 2.9.3 đang chờ gộp |
| 15 ảnh `web/public/kho/hd-*.png` | Ảnh chụp màn hình trong trang hướng dẫn của kho (`/noi-bo/kho/huong-dan`), chụp trước ngày 11/10/2026: còn giao diện bảng cũ, thẻ trắng. **Chờ chụp lại** (`web/KHO.md`, mục 3i) |
| `web/cong-cu/thuong-hieu/` (`cau_hinh_tai_san.py`, `tach-tu-pdf.py`, `ve-svg.mjs`) | Mã màu của PDF nhận diện, dùng để tách tài sản từ PDF — đây là mã nguồn, không phải mã trên trang |
| Tài liệu thiết kế cũ ở gốc repo (`Beeftown_*.html`, `Beeftown_Concept_Board_v1.svg`, `Beeftown_Website/`) | Làm trước guideline; không phát hành, không sửa, không chép |

Lệnh tìm chỗ còn sót trên website (không in ra dòng nào là sạch): `grep -rnE "30, ?22, ?14|251, ?244, ?225|178, ?58, ?44|150, ?15, ?19" web/src`.

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
