# Beeftown — bảng màu thương hiệu đã chốt và việc đưa sang website

Lập ngày 10/10/2026 từ Brand Guideline (bản lưu số 17 trên Claude). Khánh chốt bảng màu ngày 09/10/2026.
File này là bản tóm tắt cho người viết mã, so với `main` ở commit `167d334`.

> **Website CHƯA đổi theo bảng màu này.** `web/`, `can-app/` và các file SVG vẫn dùng bảng màu ở
> `web/THIET-KE.md` mục 2. Việc đổi là một PR riêng của phiên làm website. File này không sửa dòng mã nào.

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

| Việc | Guideline | Website trên `main` |
|---|---|---|
| Beef Red | `#A70C0C` | `--do` `#B23A2C` |
| Cream | `#F0E3D0` | `--kem` `#FBF4E1` |
| Charcoal | `#151008` | `--than` `#1E160E` |
| Màu vàng | 1 màu: Marigold `#F5AA14` | 2 màu: `--mu-tat` `#F2A900`, `--cuc-vang` `#F5C211` |
| Màu pha | Không có | `--do-dam`, `--do-sau`, `--kem-sau`, `--kem-dam`, `--vien-o`, `--muc-nhat` |
| Phần của từng màu | Cream 60 · Beef Red 25 · Charcoal 10 · Marigold dưới 5 | kem 60 · tối 25 · đỏ 12 · vàng 3 (`web/THIET-KE.md` ghi là gợi ý) |
| Warm Stone | Chỉ nét kẻ và nền phụ | Chữ phụ trên nền tối |
| Độ đậm Montserrat | 500 / 700 / 800 / 900 | 400 / 600 / 700 / 800 |
| Địa điểm | Tầng 3, 63 Hồ Tùng Mậu | "Hàm Nghi" ở 28 chỗ và "cầu thang" ở 24 chỗ trong `web/src` |

Hai việc Khánh cần quyết trước khi phiên website đổi màu:

1. Website có được giữ màu pha không. Màn hình cần ít nhất 1 đỏ đậm hơn cho nút khi di chuột và chữ nhỏ, 2 nền kem đậm hơn để tách khối, 1 màu viền ô nhập. Guideline đang ghi không màu pha.
2. Phần của từng màu trên trang web theo guideline (đỏ 25, tối 10) hay giữ như đang chạy (tối 25, đỏ 12).

## 4. Đề xuất đổi token (chưa ai duyệt, chưa áp dụng)

Đề xuất này giả định Khánh cho giữ màu pha trên website. Tương phản tính theo WCAG 2.2.

| Token | Đang là | Đề xuất | Tương phản sau khi đổi |
|---|---|---|---|
| `--do` | `#B23A2C` | `#A70C0C` | 6,15 : 1 với kem (đang là 5,4 : 1) |
| `--do-dam` | `#8F2C21` | `#890607` | 7,93 : 1 với kem |
| `--do-sau` | `#960F13` | `#890607` (gộp với `--do-dam`) | 7,00 và 6,00 : 1 với 2 nền kem đậm |
| `--kem` | `#FBF4E1` | `#F0E3D0` | chữ than 14,96 : 1 |
| `--kem-sau` | `#F5ECD7` | `#E7D5BC` | chữ than 13,20 · chữ đỏ 5,42 : 1 |
| `--kem-dam` | `#F1E4C2` | `#DAC5AA` | chữ than 11,31 · chữ đỏ 4,65 : 1, nên chữ nhấn dùng đỏ đậm 6,00 : 1 |
| `--than` | `#1E160E` | `#151008` | chữ kem 14,96 : 1 |
| `--mu-tat`, `--cuc-vang` | `#F2A900`, `#F5C211` | cả hai `#F5AA14` | 9,59 : 1 với than |
| `--da` | `#B8A98C` | giữ | 8,19 : 1 với than |
| `--vien-o` | `#8C8577` | `#7A7366` | 3,71 : 1 với kem. Mã cũ chỉ còn 2,89 : 1, dưới mức 3 : 1 của viền ô nhập |
| `--muc-nhat` | than 68 % | than mới 68 % | 5,92 : 1 với kem · 5,18 : 1 với `#DAC5AA` |

Các điểm phải giữ khi đổi:

- Marigold và Warm Stone không làm chữ trên nền kem: 1,56 và 1,83 : 1.
- Marigold trên nền đỏ được 3,94 : 1: chỉ dùng cho chữ lớn hoặc hình, không cho chữ thường.
- Đỏ trên nền than chỉ 2,43 : 1: không đặt chữ đỏ trên dải tối.
- Viền `#7A7366` trên nền `#DAC5AA` còn 2,81 : 1: ô nhập đặt trên nền kem đậm thì cần viền đậm hơn.
- Nhiều chỗ viết màu bằng `rgba()` với số RGB của than, kem, đỏ cũ, nên đổi token chưa đủ: 29 dòng trong 14 file theo lệnh `grep -rnE "30, ?22, ?14|251, ?244, ?225|178, ?58, ?44" web/src can-app/src`, và 2 dòng nữa dùng số của `--do-sau` (150, 15, 19).
- Khối `:root` đầu file `chung.css` dùng chung cho trang công khai, `/noi-bo` và kho: đổi token là đổi cả 3 nơi.

## 5. Nơi đang ghi mã màu cũ

PR đổi màu phải sửa hết các nơi này trong cùng một lượt:

| Nơi | Ghi gì |
|---|---|
| `web/src/styles/chung.css` | Token trong 2 khối `:root` |
| `web/src/styles/*.css`, `web/src/components/*.astro` | Màu viết bằng `rgba()` với số RGB cũ (lệnh tìm ở mục 4) |
| `web/src/lib/qua-tai.ts` (dòng 141, 145) | Màu nền, màu chữ, màu nút của trang báo quá tải |
| `web/src/layouts/Trang.astro`, `NoiBo.astro`, `Kho.astro` | Thẻ `theme-color` |
| `web/public/kho/manifest.json` | `theme_color` |
| `web/public/thuong-hieu/*.svg` (15 file), `web/public/bieu-tuong.svg` | Màu tô của logo, đầu bò, hoa văn |
| `web/public/favicon.ico`, `web/public/thuong-hieu/bieu-tuong-180.png`, `chia-se-1200x630.png`, biểu tượng trong `web/public/kho/` | Ảnh dựng từ `web/cong-cu/thuong-hieu/tao-bieu-tuong.py` (hằng `DO`): đổi mã rồi dựng lại |
| `web/cong-cu/thuong-hieu/` | Cấu hình và script dựng tài sản |
| `can-app/src/giao-dien.html`, `can-app/src/huong-dan.html` | Token riêng của Beeftown Cân (`--do`, `--do-dam`, `--kem`, `--kem-sau`, `--mu-tat`, `--than`, `--vach`) |
| `crm/test/test-cong-khai-giao-dien.mjs` | Hằng `BANG_MAU`: danh sách mã màu SVG được phép |
| `web/THIET-KE.md` mục 2, `README.md` mục "Bảng màu" | Bảng token và bảng tương phản |
| PR #63 (skill `thiet-ke-beeftown`, chưa gộp) | Ghi bảng màu cũ; `crm/test/test-ky-nang-thiet-ke.mjs` so mã màu của skill với mã nguồn |

Logo vector bảng màu mới đã có sẵn trong thư mục tài sản trên máy Khánh (`01_Logo_vector`: lockup, brandmark, wordmark; bản nền sáng màu red, charcoal, black; bản nền tối màu cream, white).

## 6. Địa điểm

- Khánh chốt ngày 07/10 và 09/10/2026: quán ở **Tầng 3, 63 Hồ Tùng Mậu** (tiếng Anh: "Floor 3, 63 Hồ Tùng Mậu"; tiếng Hàn: "Hồ Tùng Mậu 63, 3층").
- Câu chỉ đường: "Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3."
- Mã nguồn trên `main` chưa đổi. Phiên làm website sửa theo danh sách `Beeftown_Website_Can_Sua_DiaDiem_2026-10-07.md` trong thư mục tài liệu của Khánh (ngoài repo), hạn 15/10/2026.
- Dòng địa chỉ pháp lý ở chân trang chờ Khánh quyết, chưa sửa.
