# Beeftown — bộ nhận diện đã chốt và việc đưa sang website

> **Bộ nhận diện hiện hành: Brand Guidelines 21/10/2026** (designer, 7 trang): logo chính, logo phụ,
> brandmark; đỏ `#BD0000`, đen `#000000`, trắng `#FFFFFF`. Khánh chốt bảng màu ngày 22/10/2026; ngày
> 25/10/2026 duyệt đổi và trả lời câu 1–4; ngày 26/10/2026 chốt logo, tagline, phông chữ và bỏ hình của bộ
> nhận diện cũ (câu 5–8). **Website đã đổi** ở PR 1 "Đổi nhận diện website": trang công khai, `/noi-bo`,
> kho — màu, logo, biểu tượng, trạng thái. **Beeftown Cân đổi ở bản 2.12** (việc 7, PR riêng). Thứ còn mang nhận
> diện cũ: mục 5. Bảng 09/10/2026 mà website chạy trước PR 1: phụ lục cuối file — nơi duy nhất còn ghi mã cũ.

## 0. Bộ nhận diện 21/10/2026 — quyết định, tình trạng, việc

### Nguồn

Brand Guidelines 21/10/2026 do designer xuất từ Illustrator, 7 trang. PDF nằm trong thư mục Drive "LOGO
BEEFTOWN", không vào repo (`.gitignore` chặn PDF).

| Trang | Tiêu đề | Nội dung |
|---|---|---|
| 1 | BRAND GUIDELINES | Bìa: đầu bò trắng trên nền đỏ phẳng |
| 2 | LOGO CONSTRUCTION & GRID | Dựng logo trên lưới ô 1a: logo chính rộng 21a, cao 4,6a; chữ BEEFTOWN cao 3a; dòng tagline rộng 15a |
| 3 | CLEAR SPACE | Mỗi phía (trái, phải, trên, dưới) chừa một ô đầu bò — khoảng 3a, tức khoảng 14,8 % bề rộng logo chính |
| 4 | COLOR USAGE | Ba cặp: logo đỏ trên trắng; logo đen trên xám nhạt `#F4F4F4` (đầu bò để trắng); logo trắng trên đỏ (đầu bò khoét, lộ nền). Trang này không vẽ logo trắng trên đen, logo đen trên trắng |
| 5 | LOGO VARIATIONS | Logo chính (PRIMARY LOGO: chữ BEEFTOWN, đầu bò trong ô thay chữ O, dòng "PICK IT, GRILL IT, LOVE IT!"), logo phụ (SECONDARY LOGO: chữ BEEFTOWN, không tagline), brandmark (BRANDMARK: ô bo góc, đầu bò bên trong) |
| 6 | LOGO COLORS AND PANTONE | Đỏ `#BD0000` (C17 M100 Y100 K9), đen `#000000` (C75 M68 Y67 K90), trắng `#FFFFFF` (C0 M0 Y0 K0). PANTONE 3517 C là "màu gần đúng của đỏ thương hiệu; màu in thật đổi theo chất liệu, cách in và chất lượng in" |
| 7 | LOGO FONTS | Phông **của logo**: Figtree ExtraBold (chính), Figtree SemiBold (phụ) |

PDF **không ghi**: cỡ tối thiểu của logo, luật "không kéo giãn, không đặt lên ảnh", phông chữ chạy, ảnh, câu
chữ. Những luật đó giữ từ guideline 09/10/2026 và được ghi rõ nguồn ở mục 2.

### Câu Khánh đã trả lời (câu 1–4: 25/10/2026; câu 5–8: 26/10/2026)

1. **Màu pha trên màn hình.** Ngày 10/10/2026 Khánh cho website giữ 6 token màu pha (`--do-dam` và
   `--do-sau` cho đỏ đậm, 2 nền kem đậm, viền ô nhập, chữ phụ). Bảng mới có được thêm màu pha không: 1
   đỏ đậm hơn cho nút khi di chuột; 1 xám cho viền ô nhập (tối thiểu 3 : 1 với trắng); 1 xám cho chữ
   phụ (tối thiểu 4,5 : 1 với trắng); 1 nền xám nhạt để tách thẻ khỏi nền trắng? Mini App Zalo đang
   dùng 7 màu pha như vậy (`mini-app/src/styles.css`): câu trả lời áp cho cả Mini App.
   **Trả lời 25/10/2026: có** — một đỏ đậm (nút khi di chuột) và vài xám (viền ô nhập, chữ phụ, nền
   nhạt, vạch), như Mini App; chỉ trên màn hình, ấn phẩm vẫn chỉ ba màu. Bản mẫu Menu bán lẻ ngày
   25/10/2026 dùng: đỏ đậm `#8F0000`, xám viền ô nhập `#767676` (4,54 : 1 với trắng; Mini App chưa có màu
   này), xám chữ phụ `#555555` (7,46 : 1), nền xám nhạt `#F4F4F4`, vạch `#E2E2E2`. **Mã chốt ở PR 1:**
   `#8F0000`, `#767676`, `#555555`, `#F4F4F4`, `#E2E2E2` (mục 1). Hai đỏ nhạt (`#FFF1F1`, `#D9A3A3`) và chữ
   `#111111` của Mini App **vẫn chưa duyệt** (câu còn mở 1).
2. **Màu trạng thái** của `/noi-bo`, kho và Beeftown Cân (xanh = xong, vàng = lưu ý, đỏ nhạt = làm
   ngay): giữ làm màu chức năng như hiện nay (không thuộc bảng thương hiệu), hay đổi?
   **Trả lời 25/10/2026: bỏ.** `/noi-bo`, kho và Beeftown Cân chỉ dùng đỏ, đen, trắng và các xám ở câu 1.
   Trạng thái phân biệt bằng chữ và biểu tượng. Đề xuất của Claude (bản mẫu Menu bán lẻ 25/10/2026): đỏ =
   làm ngay ("Hết" nền đỏ chữ trắng); xám = lưu ý, tắt ("Sắp hết" nền xám); đen = xong, đang chạy ("Còn"
   viền đen). **Chốt ở PR 1:** bảy kiểu vẽ K1–K7 (mục 4).
3. **Thay Marigold** ở vòng focus trên nền tối, chấm chưa đọc, nhãn "nháp", đèn vàng bằng màu gì.
   Đề xuất của Claude: vòng focus trắng trên nền tối; chấm và nhãn dùng màu trạng thái của câu 2.
   **Trả lời 25/10/2026: theo đề xuất.** Vòng focus trên nền tối màu trắng. Câu 2 đã bỏ màu trạng thái,
   nên chấm, nhãn, đèn vàng theo cách báo mới của câu 2; nhãn "nháp", "giá thử" nền đen chữ trắng.
4. **Nền trang công khai:** trắng hay đen, và phần của mỗi màu.
   **Trả lời 25/10/2026 (12:12): nền trắng, đen làm điểm nhấn.** Đầu trang đen, vài dải đen, chân trang
   đen; đỏ cho nút, nhãn, giá. Hai dải tối giữ từ quyết định 11/10/2026 ("Quầy chọn bò" của trang chủ, "Bò
   tại quầy" của trang Thực đơn) nay là đen.
5. **Logo:** thay nét tách từ PDF nhận diện cũ bằng file vector của bộ logo 21/10/2026.
   **Trả lời 26/10/2026: lấy path gốc từ PDF guideline.** PDF xuất từ Illustrator chứa nguyên vector của
   logo: `web/cong-cu/thuong-hieu/tach-logo.mjs` tách 10 SVG (bảng tài sản ở mục 2) vào
   `web/public/thuong-hieu/`, không vẽ lại; không cần designer xuất SVG riêng. Mini App vẫn dùng bản PNG
   của thư mục Drive (việc 10).
6. **Tagline:** logo 21/10/2026 ghi "PICK IT, GRILL IT, LOVE IT!" (dấu phẩy, chấm than), còn guideline
   09/10/2026, website và skill thiết kế viết ba câu có dấu chấm.
   **Trả lời 26/10/2026: "Pick it, grill it, love it!"** (dấu phẩy, chấm than) ở mọi nơi — câu chữ, tài
   liệu, skill, kiểm thử. Dòng in hoa "PICK IT, GRILL IT, LOVE IT!" trong logo chính là hình, không gõ lại.
7. **Phông chữ.** **Trả lời 26/10/2026: website giữ Montserrat.** Guideline 21/10/2026 chỉ ghi phông **của
   logo** (Figtree ExtraBold, Figtree SemiBold). Figtree thiếu chữ có dấu tiếng Việt (ư, ạ, ế, ề, ị, ộ, ữ…
   — đã kiểm bảng ký tự của phông), nên Figtree chỉ nằm trong logo (logo là path, không cần phông). Không
   đổi độ đậm (400 / 600 / 700 / 800).
8. **Hình của bộ nhận diện cũ.** **Trả lời 26/10/2026: bỏ hết.** Đầu bò hoạt hình và logo cũ, nhánh hương
   thảo, vân mỡ, miếng steak, tem tròn, chữ BEEFTOWN lặp. Không giữ hình cũ đổi màu. Chỗ cần dấu thương
   hiệu dùng logo / brandmark mới; còn lại để khối màu phẳng và ảnh (kiểu El Gaucho).

### Chọn trong PR 1 — Khánh xem ảnh chụp trong mô tả PR

Những điểm dưới đây guideline không nói, PR 1 chọn một cách để làm; Khánh xem ảnh chụp rồi giữ hay đổi.

| # | Điểm | PR 1 chọn |
|---|---|---|
| A | Biểu tượng màn hình chính iPhone (`bieu-tuong-180.png`) | Đầu bò trắng cao 66 % cạnh trên nền đỏ phủ kín |
| B | Ảnh chia sẻ dự phòng (`chia-se-1200x630.png`) | Logo chính trắng rộng 480 px giữa nền đỏ phẳng; không ảnh chụp, không ngày, không giá |
| C | Logo trên đầu trang công khai (thanh đen cao 64 / 80 px) | Logo phụ trắng rộng 148 px (176 px từ màn 1080 px) — đủ một ô đầu bò khoảng trống; dưới 360 px dùng brandmark trắng |
| D | Logo trên giấy in (phiếu đặt hàng, mọi trang in của kho) | Logo chính đen; chữ "BEEFTOWN" gõ bằng phông ở đầu trang `/noi-bo` và các trang in thay bằng logo |
| E | Ba dải đỏ (`.be-do`): "Đi cùng nhóm" của trang chủ, khối kêu gọi cuối của trang Thực đơn và trang Đến Beeftown | Giữ như đang chạy (câu 4 chỉ nói đỏ cho nút, nhãn, giá) |
| F | Khung chờ ảnh thật (`web/src/components/KhungAnh.astro`: quầy, khay, thang máy, lối vào, bàn nướng) | Giữ hình vẽ nét làm khung chờ, màu theo token; mất đi khi có ảnh chụp thật |
| G | Viền thẻ ở `/noi-bo` và kho: `#E2E2E2` trên nền `#F4F4F4` chỉ 1,18 : 1 | Giữ (thẻ trắng khác nền xám nhạt, viền chỉ để trang trí) |

### Câu còn mở

1. **Ba màu của Mini App chưa duyệt:** hai đỏ nhạt `#FFF1F1`, `#D9A3A3` và chữ `#111111`. Website không dùng;
   chốt hoặc bỏ ở PR Mini App (việc 10).
2. **Độ đậm chữ trên ấn phẩm in.** Guideline 21/10/2026 không nói độ đậm chữ thường. Ấn phẩm theo web
   (Montserrat 400 / 600 / 700 / 800) cho tới khi Khánh nói khác.

### Danh sách việc — tình trạng 26/10/2026

Việc 3, 5, 6 làm chung trong PR 1 "Đổi nhận diện website". Trang "Mua thịt về" là PR 2, sau khi PR 1 gộp.

| # | Việc | Ai làm | Tình trạng |
|---|---|---|---|
| 1 | Trả lời các câu ở trên | Khánh | Xong: câu 1–4 (25/10/2026), câu 5–8 (26/10/2026). Còn mở: hai câu ở trên |
| 2 | Gửi file SVG của bộ logo | Khánh | Không cần nữa: path lấy thẳng từ PDF (câu 5). Designer gửi PDF mới thì chạy lại `web/cong-cu/thuong-hieu/tach-logo.mjs` — script dừng khi số path của PDF khác bản 21/10/2026 |
| 3 | Đổi màu cả website: 12 biến mỗi nơi (khối `.ck` và `:root`, bỏ hai biến vàng); bỏ 8 token trạng thái và vẽ trạng thái bằng K1–K7; `rgba()` theo số RGB mới; bảng chép tay trong kiểm thử; tài liệu, skill thiết kế | Claude Code | PR 1 |
| 4 | Đổi tên token cho đúng màu mới (`--kem` mang mã trắng, `--than` mang mã đen là tên sai) | Claude Code | PR sau PR 1 (PR 1 giữ tên). Trước PR 1 có khoảng 267 chỗ `var()` tới `--kem`, `--kem-sau`, `--kem-dam`, `--than`, `--do-dam`, `--do-sau`, `--da` trong 39 file — đếm lại khi làm |
| 5 | Logo, biểu tượng, ảnh chia sẻ theo bộ mới | Claude Code | PR 1: `tach-logo.mjs` (10 SVG) rồi `web/cong-cu/thuong-hieu/tao-bieu-tuong.py` (`bieu-tuong.svg`, `favicon.ico`, 2 PNG thương hiệu, 4 biểu tượng kho); xóa 14 SVG của bộ cũ |
| 6 | `theme-color` | Claude Code | PR 1: `#000000` ở 3 layout; `web/public/kho/manifest.json`: `theme_color` `#000000`, `background_color` `#F4F4F4` |
| 7 | Beeftown Cân đổi thẳng sang bộ 21/10/2026: khối `:root` của 2 file HTML, nền theo câu 4, bỏ màu trạng thái (câu 2), logo và biểu tượng theo bộ mới, tăng `PHIEN_BAN` | Claude Code | Xong ở bản 2.12 (PR riêng, 30/10/2026): nền trang `#F4F4F4`, thẻ trắng, đầu trang đen như kho; nhãn K1–K7; logo phụ trắng và biểu tượng tab lấy thẳng file của `web/public` (`can-app/src/nhan-dien.ts`); kiểm thử `crm/test/test-can-nhan-dien.mjs`. Biểu tượng của file `.exe` vẫn mặc định (mục 5) |
| 8 | Chụp lại 15 ảnh `web/public/kho/hd-*.png` | Claude Code | Sau khi PR 1 gộp |
| 9 | Deploy website sau khi PR 1 gộp và CI xanh; xem lại trang chủ, Thực đơn, `/noi-bo`, kho trên điện thoại; Facebook Sharing Debugger → "Scrape Again" cho `/`, `/en`, `/ko`; ai đã thêm app kho vào màn hình chính thì xóa và thêm lại | Khánh | Sau PR 1 |
| 10 | Mini App: thay 4 logo PNG trong `mini-app/src/assets/` bằng SVG của bộ mới; chốt hoặc bỏ 3 màu chưa duyệt | Claude Code | PR Mini App |
| 11 | Trang "Mua thịt về" | Claude Code | PR 2, sau PR 1 |

---

## 1. Bảng màu 22/10/2026

| Tên | HEX | RGB | CMYK | Pantone | Thay cho (bảng 09/10/2026) |
|---|---|---|---|---|---|
| Đỏ | `#BD0000` | 189, 0, 0 | C17 M100 Y100 K9 | 3517 C (gần đúng) | Beef Red |
| Đen | `#000000` | 0, 0, 0 | C75 M68 Y67 K90 | — | Charcoal |
| Trắng | `#FFFFFF` | 255, 255, 255 | C0 M0 Y0 K0 | — | Cream làm nền |

- Nguồn: guideline 21/10/2026, trang 6. PANTONE 3517 C là màu gần đúng; màu in thật đổi theo chất liệu,
  cách in, chất lượng in — nhà in in thử, Khánh duyệt bản in thử.
- Bỏ hẳn: Cream, Marigold, Warm Stone, đỏ đậm cũ, bốn nền kem.
- **Màu pha chỉ cho màn hình** (câu 1, 25/10/2026; ấn phẩm không dùng): đỏ đậm `#8F0000`; xám viền ô
  `#767676`; xám chữ phụ `#555555`; xám nhạt `#F4F4F4`; xám vạch `#E2E2E2`.
- Tương phản (WCAG 2.2):

| Cặp | Tỷ lệ | Dùng ở |
|---|---|---|
| Đen trên trắng / `#F4F4F4` / `#E2E2E2` | 21,00 / 19,09 / 16,21 | Chữ chính, nhãn xám |
| `#555555` trên trắng / `#F4F4F4` / `#E2E2E2` | 7,46 / 6,78 / 5,75 | Chữ phụ, gợi ý trong ô, chữ nhãn "tắt" |
| Đỏ trên trắng / `#F4F4F4` / `#E2E2E2` | 6,64 / 6,03 / 5,12 | Chữ nhấn, biểu tượng, viền "làm ngay" |
| Đỏ đậm trên trắng / `#F4F4F4` / `#E2E2E2` | 9,69 / 8,81 / 7,48 | Câu lỗi, chữ nút trên dải đỏ, nút phụ khi di chuột |
| Trắng trên đỏ / đỏ đậm / đen | 6,64 / 9,69 / 21,00 | Nút, nhãn đặc, đầu trang |
| `#E2E2E2` trên đen | 16,21 | Chữ phụ trên nền đen (`--da`) |
| Trắng trên đỏ phủ 12 % trắng (`#C51F1F`) | 5,85 | Nút phụ trên dải đỏ khi di chuột |
| Trắng trên đen 78 % phủ lên vùng trắng tinh / `#F4F4F4` của ảnh | 11,71 / 12,14 | Nhãn "Ảnh minh họa" |
| `#767676` trên trắng / `#F4F4F4` / `#E2E2E2` / đen | 4,54 / 4,13 / 3,51 / 4,62 | Viền ô nhập, nét đứt "tắt", viền nút trên đầu trang đen |
| **Cấm làm chữ thường:** đỏ trên đen; đỏ đậm trên đen; `#555555` trên đen | 3,16; 2,17; 2,82 | Đỏ trên đen chỉ cho chữ từ 24 px (18,66 px đậm) và hình |
| **Chỉ trang trí:** `#E2E2E2` trên trắng / `#F4F4F4`; `#F4F4F4` trên trắng | 1,30 / 1,18; 1,10 | Viền thẻ, nền thẻ |
| **Không bao giờ là khác biệt duy nhất:** đỏ với `#555555` / `#767676` / đen | 1,12 / 1,46 / 3,16 | Luật 2 của trạng thái (mục 4) |

## 2. Các quy tắc của guideline mà mã phải theo

- **Logo (guideline 21/10/2026):** ba biến thể — logo chính (chữ BEEFTOWN, đầu bò trong ô thay chữ O,
  dòng "PICK IT, GRILL IT, LOVE IT!"), logo phụ (chữ BEEFTOWN, không tagline), brandmark (ô bo góc + đầu
  bò). Mỗi biến thể **ba bản màu: đỏ, đen, trắng** — chỉ ba bản đó. Cách dùng (trang 4): đỏ trên nền
  trắng; đen trên xám nhạt `#F4F4F4` (đầu bò để trắng); trắng trên đỏ (đầu bò khoét, lộ nền). Website dùng
  thêm hai cặp guideline chưa vẽ: trắng trên nền đen (đầu trang, chân trang — câu 4) và đen trên giấy
  trắng (trang in). Dựng hình (trang 2): logo chính 21a × 4,6a, chữ BEEFTOWN cao 3a, tagline rộng 15a.
  Khoảng trống (trang 3): mỗi phía một ô đầu bò. Mỗi bề mặt một logo.
- **Cỡ tối thiểu:** guideline 21/10/2026 không ghi. **Luật giữ từ bộ 09/10/2026:** logo chính rộng ≥ 160 px,
  hẹp hơn dùng logo phụ hoặc brandmark; brandmark ≥ 48 px. Logo phụ (tài sản mới) trên thanh đầu trang
  công khai rộng ≥ 148 px (≥ 176 px từ màn 1080 px) — ngưỡng riêng của tài sản mới, không phải hạ 160 px.
- **Không:** đổi màu ngoài ba bản, kéo giãn, xoay, thêm bóng hay viền, đặt lên ảnh, gõ lại bằng phông
  (kể cả Figtree), dùng lại hình của bộ cũ, đặt bản đỏ / đen lên nền đỏ / đen (nền tối dùng bản trắng).
- **Tài sản đã tách** (`web/public/thuong-hieu/`, path gốc của PDF, chỉ ba mã `#BD0000`, `#000000`,
  `#FFFFFF`). Công cụ: `web/cong-cu/thuong-hieu/tach-logo.mjs` (đọc trang 5 và trang 1 của PDF) rồi
  `web/cong-cu/thuong-hieu/tao-bieu-tuong.py` (dựng biểu tượng và ảnh chia sẻ từ các SVG đó). viewBox là khung
  hình đo trong PDF làm tròn lên số nguyên, hình đặt giữa: thẻ `<img width height>` ghi đúng hai số đó, nên trang
  không xô lệch khi logo tải xong (`test-cong-khai-giao-dien.mjs` nhóm 3 so nhân chéo):

| File | viewBox | Dùng ở |
|---|---|---|
| `logo-ngang-do.svg` | 579 × 131 (hình 578,148 × 130,406) | Logo chính đỏ (đầu bò trắng) — thẻ "Đọc nhãn khay" (nền trắng) |
| `logo-ngang-den.svg` | như trên | Logo chính đen (đầu bò trắng) — phiếu đặt hàng in, mọi trang in của kho |
| `logo-ngang-trang.svg` | như trên | Logo chính trắng (đầu bò khoét lộ nền) — chân trang công khai (nền đen) |
| `chu-beeftown-do.svg`, `chu-beeftown-den.svg` | 430 × 61 (hình 429,191 × 60,52) | Logo phụ đỏ, đen — chỗ hẹp, thấp trên nền sáng (chưa dùng trên web) |
| `chu-beeftown-trang.svg` | như trên | Logo phụ trắng — đầu trang công khai, đầu trang `/noi-bo` (nền đen) |
| `dau-bo-do.svg`, `dau-bo-den.svg` | 177 × 169 (hình 176,809 × 168,371) | Brandmark đỏ, đen — nguồn của biểu tượng trình duyệt; ấn phẩm nhỏ |
| `dau-bo-trang.svg` | như trên | Brandmark trắng — đầu trang công khai dưới 360 px, đầu trang kho (nền đen) |
| `net-dau-bo.svg` | 369 × 438 (hình 368,975 × 437,709) | Riêng đầu bò, trắng — chỉ để dựng biểu tượng app (nền đỏ tràn) |

  Dựng từ các SVG trên (`tao-bieu-tuong.py`): `web/public/bieu-tuong.svg` (brandmark đỏ giữa ô 64 × 64,
  biểu tượng tab), `web/public/favicon.ico` (16 / 32 / 48 px), `web/public/thuong-hieu/bieu-tuong-180.png` và
  `web/public/kho/bieu-tuong-180.png` (đầu bò trắng trên đỏ phủ kín), `web/public/kho/bieu-tuong-192.png`,
  `bieu-tuong-512.png` (y hệt `bieu-tuong.svg`, góc trong suốt), `bieu-tuong-maskable-512.png`, và
  `web/public/thuong-hieu/chia-se-1200x630.png` (logo chính trắng giữa nền đỏ).
- **Phông:** phông **của logo** là Figtree ExtraBold (chính) và Figtree SemiBold (phụ) — chỉ nằm trong
  logo. Chữ trên web và ấn phẩm: **Montserrat** (câu 7). Web 400 / 600 / 700 / 800. Guideline 21/10/2026
  không nói về phông chữ chạy hay độ đậm chữ thường (câu còn mở 2). Giá ghi dạng 000.000 đ, ngày dạng
  dd/mm/yyyy.
- **Tên gọi:** descriptor "Beef Specialty Restaurant"; tagline **"Pick it, grill it, love it!"** (dấu phẩy,
  chấm than — câu 6); câu chính cho khách "Không cần rành bò. Chọn theo gu, thấy giá trước."
- **Không viết:** rẻ, buffet, cao cấp, Korean BBQ, nướng Hàn, grade khi chưa có chứng nhận, số ngày ủ khi chưa có hồ sơ, chữ về than, lửa, khói, số phần trăm khi chưa có phép thử. Danh sách máy quét dùng vẫn là `web/src/lib/chuoi-cam.js`.
- **Ảnh nên có** (luật giữ từ guideline 09/10/2026): khay bò đóng sẵn có nhãn, vỉ gas với hơi nhẹ, bàn tay và đĩa ăn chung, nền kem và gỗ sáng (đồ vật trong ảnh: giấy lót, đĩa sứ màu kem; gỗ sáng — không phải màu nền thiết kế). **Không có:** than, lửa, khói dày, đá đen, gang, thớt gỗ thô, rau thơm đặt trên thịt sống, vân mỡ đẹp hơn thịt quán bán. Đá đen, gang, thớt gỗ thô là luật cho **nền và mặt đặt thịt bò, vỉ và bàn nướng**: guideline bản 2 bỏ kiểu ảnh steakhouse nền tối của PDF cũ (trang 11: nền "black slate, cast iron, dark wood, charcoal" để thịt đỏ nổi lên) — bò không nằm trên phiến đá đen, không nướng trên vỉ / chảo gang. Thố đá, bát đá đen, chảo gang **đựng món ăn kèm kiểu Hàn** (canh, đậu phụ hầm, cơm trộn, miến xào — các ảnh thố / bát đá và ảnh chảo gang của F10 trong cuốn menu bản sáng) là dụng cụ dọn món, không thuộc luật này; dụng cụ thật của quán thì Sang xác nhận.
- **Ảnh do AI tạo** chỉ để minh họa. **Quảng cáo và thực đơn IN** (menu giấy, placemat, bảng tại quán) dùng ảnh chụp thật — luật này không áp cho trang Thực đơn của website. Trên website (Khánh quyết ngày 11/10/2026): ảnh AI được lên trang, **kể cả trang Thực đơn** (`bo-cat-lat`, `sot-cham`, và ảnh món lấy từ cuốn menu in bản sáng Khánh chốt 11/10/2026), mỗi ảnh có nhãn "Ảnh minh họa"; bàn tay người thì được, mặt người thì không; hai ảnh bữa ăn có kim chi và món phụ được dùng như hình minh họa (câu chữ không hứa món phụ nào); quầy, khay skin-pack, không gian quán, lối vào, thang máy vẫn chờ ảnh chụp thật. Bảng từng ảnh: `web/THIET-KE.md` mục 7.

## 3. Chỗ guideline và website khác nhau

Trang công khai, `/noi-bo`, kho và Beeftown Cân (từ bản 2.12) dùng cùng một bảng.

| Việc | Guideline 21/10/2026 | Website (trang công khai, `/noi-bo`, kho) |
|---|---|---|
| Màu | Đỏ, đen, trắng | Thêm 5 màu pha chỉ cho màn hình (câu 1): `#8F0000`, `#767676`, `#555555`, `#F4F4F4`, `#E2E2E2` |
| Trạng thái | Không nói | Chữ, dấu, nét — không màu riêng (câu 2; bảy kiểu K1–K7 ở mục 4) |
| Logo trên nền đen | Trang 4 không vẽ | Bản trắng (đầu trang, chân trang) |
| Logo trên giấy trắng | Trang 4 chỉ vẽ đen trên `#F4F4F4` | Logo chính đen trên trang in |
| Đầu trang | Không nói | Logo phụ (thanh cao 64 / 80 px, logo chính quá thấp ở cỡ này); dưới 360 px brandmark |
| Cỡ tối thiểu | Không ghi | Giữ luật bộ 09/10/2026: logo chính ≥ 160 px, brandmark ≥ 48 px; logo phụ đầu trang ≥ 148 px (mục 2) |
| Phông | Figtree (chỉ logo) | Montserrat cho mọi chữ (câu 7) |
| Phần của mỗi màu | Không nói | Nền trắng; đen ở đầu trang, vài dải, chân trang; đỏ cho nút, nhãn, giá (câu 4) |
| Địa điểm | Không nói | Mục 6 |

## 4. Token đã áp dụng

Một bảng, khai ở **hai nơi cùng giá trị, chưa gộp**: khối `.ck` đầu tiên của `web/src/styles/cong-khai.css`
(trang công khai) và hai khối `:root` của `web/src/styles/chung.css` (`/noi-bo` và kho). Tên biến giữ từ bảng
09/10/2026 (`--kem` mang trắng, `--than` mang đen) — đổi tên là việc 4. Tương phản tính theo WCAG 2.2 (mục 1).
Beeftown Cân chạy không mạng nên khai lại các biến nó dùng — cùng tên, cùng giá trị với `:root` của `chung.css` — trong
khối `:root` của `can-app/src/giao-dien.html` và `can-app/src/huong-dan.html` (`crm/test/test-can-nhan-dien.mjs` so
từng mã với `chung.css`); nhãn trạng thái là `.nhan-l.cho`, `.nhap`, `.song`, `.luu-y`, `.tat`, `.thong-tin` — cùng
bảy kiểu K1–K7 bên dưới (Beeftown Cân không dùng K2 ở nhãn, có ở khung báo và ô số).

Kiểm thử chép tay từng mã, không đọc từ file CSS:

- `crm/test/test-cong-khai-giao-dien.mjs`: nhóm 6 (khối `.ck`, các cặp tương phản của trang công khai), nhóm 2
  (biến gốc của `:root`), nhóm 7 (chỉ mã 6 chữ số của bảng); nhóm 3 (bộ 10 SVG logo, mỗi bản đúng màu).
- `crm/test/test-noi-bo-bang-mau.mjs`: `/noi-bo` và kho. Nhóm 1 so khối `:root` với khối `.ck`; nhóm 3–4 chỉ
  mã của bảng, ô của trình duyệt dùng token; nhóm 5 các cặp tương phản; nhóm 7 trạng thái không chỉ khác bằng
  màu.
- `crm/test/test-noi-bo-trang-thai.mjs`: markup và câu trạng thái của `/noi-bo` và kho (nhãn có chữ, câu
  hướng dẫn không gọi tên màu).
- `crm/test/test-ky-nang-thiet-ke.mjs`: bảng token trong skill thiết kế khớp cả hai nơi khai.
- `crm/test/test-can-nhan-dien.mjs`: Beeftown Cân — `:root` của hai trang so với `chung.css` và bảng chép tay; không
  mã cũ; sáu kiểu nhãn, khung báo, ô số, đèn ô Cân không chỉ khác bằng màu; tương phản; logo phụ trắng và biểu tượng
  tab của `web/public`; câu chữ không gọi trạng thái bằng xanh / vàng.
- `web/kiem-tra/do-giao-dien.mjs`, `web/kiem-tra/thu-day-du.mjs`: đo màu trên trang đã dựng.

| Token | Bảng 09/10/2026 (đã bỏ) | Đã áp dụng (PR 1) | Vai |
|---|---|---|---|
| `--do` | `#A70C0C` | `#BD0000` | Đỏ: nút chính, nhãn, giá, dải đỏ, chữ nhấn trên nền sáng; ở `/noi-bo` và kho số báo việc, "làm ngay" |
| `--do-dam` | `#890607` | `#8F0000` | Đỏ đậm: nút khi di chuột / đang gửi, câu lỗi dưới ô |
| `--do-sau` | `#890607` | `#8F0000` | Bí danh của `--do-dam` (gộp ở việc 4): chữ nhấn ≤ 13 px, chữ nút trên dải đỏ |
| `--kem` | `#F0E3D0` | `#FFFFFF` | Trắng: nền trang công khai; thẻ, ô nhập nội bộ; chữ trên đen và đỏ; vòng focus trên nền tối |
| `--kem-sau` | `#EBDCC6` | `#F4F4F4` | Xám nhạt: dải phụ, thẻ trên nền trắng; nền trang `/noi-bo`, kho; đầu bảng |
| `--kem-dam` | `#E7D5BC` | `#E2E2E2` | Xám vạch: nền khi di chuột, nhãn "lưu ý", khung ảnh chờ, dòng làm nổi trong bảng |
| `--than` | `#151008` | `#000000` | Đen: chữ chính, đầu trang, dải đen, chân trang, vòng focus trên nền sáng, nhãn "nháp", vạch "xong" |
| `--muc-nhat` | than 68 % | `#555555` | Xám chữ phụ: chữ phụ, gợi ý trong ô, vạch và vòng "!" của "lưu ý" |
| `--vach` | than 16 % | `#E2E2E2` | Viền thẻ, vạch ngăn |
| `--vach-kem` | kem 22 % | trắng 22 % | Vạch ngăn trên nền đen |
| `--vien-o` | `#7A7366` | `#767676` | Viền ô nhập, ô đánh dấu, nút phụ nội bộ; nét đứt "tắt"; viền nút trên đầu trang đen |
| `--da` | `#B8A98C` | `#E2E2E2` | **Chỉ** chữ phụ trên nền đen (16,21 : 1) |
| `--cuc-vang`, `--mu-tat` | `#F5AA14` | **bỏ** | Vòng focus thành trắng / đen theo nền; nhãn "nháp" thành đen; vạch "lưu ý" thành `#555555` |

**Bề mặt của trang công khai** (`cong-khai.css`; tên lớp giữ): `.be-kem` nền trắng; `.be-kem-sau` và
`.be-kem-dam` nền `#F4F4F4` (một nền nhạt duy nhất được duyệt); `.be-toi` nền đen — chữ trắng, chữ phụ
`--da`, chữ nhấn **trắng** (đỏ trên đen chỉ 3,16 : 1), vòng focus trắng; `.be-do` nền đỏ — chữ trắng, nút
chính nền trắng chữ đỏ đậm. Thẻ `.the` nền `#F4F4F4` trên nền trắng, trắng trên mọi dải khác. Nút phụ:
nền trắng, chữ và viền đỏ (di chuột: nền `#E2E2E2`, chữ và viền đỏ đậm); trên dải đỏ và đen: viền và chữ
trắng, nền trong.

**Hai bề mặt của `/noi-bo` và kho** (khai trên `.nb-than` trong `web/src/styles/noi-bo.css`; kho đọc chung):
`--nb-nen` = `--kem-sau` (nền trang `#F4F4F4`), `--nb-the` = `--kem` (thẻ, dòng danh sách, bảng, thanh điều
hướng, thanh đáy, menu thả, hộp thoại — trắng). Trắng và `#F4F4F4` chỉ chênh 1,10 : 1: thẻ tách khỏi nền bằng
viền `--vach` (`#E2E2E2`, 1,18 : 1 trên `#F4F4F4` — mục 0, điểm G). Ô nhập luôn nền trắng, viền `--vien-o`;
chữ gợi ý trong ô là `--muc-nhat`.

**Token của kho** (khai trên `.kho-than` trong `web/src/styles/kho-khung.css`). Kho không có sắc riêng:

| Token | Trỏ về |
|---|---|
| `--kho-nen` (nền trang) | `--nb-nen` (`#F4F4F4`) |
| `--kho-the` (thẻ) | `--nb-the` (trắng) |
| `--kho-vach` (viền thẻ, vạch trong thẻ) | `--vach` (`#E2E2E2`) |
| `--kho-vach-dam` (vạch đậm hơn) | `--vien-o` (`#767676`; trước PR 1 là `--da`) |

**Trạng thái của `/noi-bo` và kho — không có màu riêng** (câu 2). Tám token màu trạng thái và hai biến vàng
đã bỏ. Trạng thái vẽ bằng bảy kiểu, đỏ chỉ cho "làm ngay":

| Kiểu | Vẽ | Nghĩa | Dấu không phải màu | Lớp |
|---|---|---|---|---|
| K1 đỏ đặc | Nền `--do`, chữ trắng, dấu "!" trước chữ | Làm ngay, chờ duyệt, hết hạn (nhãn nhỏ) | Nền đặc và "!" | `.nb-nhan.cho`, `.kho-han.het_han` |
| K2 viền đỏ | Nền thẻ, viền 2 px `--do`, số và biểu tượng đỏ, tam giác "!" | Làm ngay (khối, thẻ, ô số) | Viền dày 2 px và tam giác | `.nb-bao.loi`, `.kho-o-so.gap`, `.kho-the-so.do` |
| K3 đen đặc | Nền `--than`, chữ trắng, không dấu | Nháp, giá thử, đang làm dở (câu 3) | Nền đặc, không dấu | `.nb-nhan.nhap` |
| K4 viền đen | Nền trong, viền 1,5 px đen liền, chữ đen, "✓" | Xong, đang bật, còn hạn | Viền liền và ✓ | `.nb-nhan.song`, `.nb-bao.xong`, `.kho-han.con_han` |
| K5 xám | Nhãn: nền `--kem-dam`, chữ đen. Khối, ô số: nền thẻ, vạch `--muc-nhat`, vòng tròn "!" | Lưu ý ("Sắp hết" nền xám) | Nền xám (nhãn) hoặc vòng tròn "!" (khối) | `.nb-nhan.luu-y`, `.nb-bao.luu-y`, `.kho-han.sap_het`, `.kho-o-so.luu-y`, `.kho-the-so.vang` |
| K6 nét đứt | Nền trong, viền 1,5 px nét đứt `--vien-o`, chữ `--muc-nhat` | Tắt, đã hủy, chưa bật, việc của vai khác | Nét đứt | `.nb-nhan.tat`, `.sk-den.tat` |
| K7 thông tin | Nền trong, viền 1 px `--vien-o` liền, chữ đen | Thuộc tính, không phải trạng thái: vai, "Nợ đầu", số tiền | Không dấu, viền mảnh | `.nb-nhan.thong-tin` |

Bốn luật cứng:

1. Mỗi nhãn đều có chữ. Hai trạng thái đứng cạnh nhau khác nhau ở ít nhất một kênh không phải màu: dấu,
   nét, nền đặc / rỗng, hoặc **đảo chữ** (chữ trắng trên nền tối với chữ đen trên nền sáng, chênh ≥ 7 : 1).
2. Không để đỏ, `#555555`, `#767676`, đen là khác biệt duy nhất (1,12 · 1,46 · 3,16 : 1).
3. Không nền màu nhạt nào: chỗ trước đây tô xanh, vàng, đỏ nhạt nay là nền thẻ, `#F4F4F4` hoặc K5.
4. Dấu vẽ bằng CSS, không emoji, không ký tự tam giác cảnh báo của bảng mã (iPhone vẽ thành emoji). `content`
   viết hai lần (`'!'` rồi `'!' / ''`): Safari cũ đọc dòng đầu, trình duyệt mới đọc dòng sau. Tam giác vẽ
   bằng `clip-path`, vòng bằng `border-radius`.

Đèn sức khỏe ở `/noi-bo` (`web/src/components/SucKhoeHeThong.astro`) giữ tên mức trong mã và database
(`'do' | 'vang' | 'xanh' | 'tat'`) nhưng vẽ bằng hình và chữ: `do` tam giác đỏ "Xử lý ngay", `vang` hình thoi
`#555555` "Xem hôm nay", `xanh` chấm đen "Ổn", `tat` vòng rỗng `#767676` "Chưa bật".

Các điểm phải giữ:

- Không chữ thường màu đỏ hay đỏ đậm trên nền đen (3,16 và 2,17 : 1), không chữ `#555555` trên nền đen
  (2,82 : 1) — trên dải đen chữ nhấn là trắng, chữ phụ là `--da`. `#E2E2E2` và `#F4F4F4` không làm chữ, viền
  ô hay biểu tượng trên nền sáng (1,30 và 1,10 : 1).
- Viền ô nhập luôn `--vien-o`: 4,54 : 1 với ô trắng, 4,13 : 1 với thẻ `#F4F4F4` quanh ô (mức tối thiểu cho
  viền ô là 3 : 1). Không kẻ viền ô bằng `--vach`, `--kho-vach`.
- Trắng chỉ viết `#FFFFFF` hoặc `var(--kem)`: không tên màu CSS (`white`), không mã 3 chữ số (`#fff`), không
  mã trắng ngà, không `color-mix` với trắng (`test-cong-khai-giao-dien.mjs` nhóm 7, `test-noi-bo-bang-mau.mjs`
  nhóm 3–4; màu nền trên trang đã dựng đo ở `web/kiem-tra/do-giao-dien.mjs`).
- Vòng focus: đen trên nền sáng, trắng trên nền đen và đỏ.
- Bản in của `/noi-bo` và kho (`@media print`): chỉ đen, trắng, xám; nền xám nhạt về trắng nên không lên
  giấy kể cả khi máy in bật "in nền"; ô đánh dấu và ô chọn một trả về ô của hệ thống; logo chính đen.
- Màu viết bằng `rgba()` dùng số RGB của bảng (0, 0, 0 · 255, 255, 255 · 189, 0, 0 · 143, 0, 0). Kiểm thử đỏ
  khi một file của trang công khai, `/noi-bo` hay kho còn mã hex hay bộ ba số RGB của bảng cũ, kể cả trong chú
  thích (`crm/test/test-cong-khai-nhan-dien.mjs` quét thêm tài liệu, công cụ, skill).
- **Đổi một mã là đổi cả hai nơi khai** (khối `.ck` và `:root`), file này, skill thiết kế và các bảng chép
  tay trong kiểm thử — trong cùng một PR, kể cả hai file HTML của Beeftown Cân (bản mới của chương trình). Chưa gộp hai
  khối thành một: gộp là một việc riêng, đụng thứ tự nạp CSS của trang công khai.

## 5. Nơi đã đổi và thứ còn mang nhận diện cũ

Đã đổi lần bốn — Beeftown Cân 2.12 (việc 7, PR riêng, bộ nhận diện 21/10/2026):

| Nơi | Đổi gì |
|---|---|
| `can-app/src/giao-dien.html`, `can-app/src/huong-dan.html` | Khối `:root` theo bảng 22/10/2026 (cùng tên, cùng giá trị với `chung.css`); nền trang `#F4F4F4`, thẻ và ô nhập trắng, đầu trang đen; nút chính đỏ; ô đánh dấu đỏ; vòng focus đen / trắng; bỏ bảy biến cũ (`--trang`, `--mu-tat`, `--xanh`, `--xanh-nen`, `--vang-nen`, `--do-nen`, `--chu-phu`) |
| Trạng thái | Nhãn `.nhan-l` sáu kiểu K1, K3–K7 (chữ, dấu, nét); khung báo ✓ / vòng "!" / tam giác "!"; ô số "làm ngay" viền đỏ tam giác, "lưu ý" vòng "!"; đèn ô Cân chấm đen / tam giác đỏ / vòng rỗng; dòng đã sửa chưa gửi có vạch đen; nhãn và hộp của trang hướng dẫn theo cùng kiểu |
| Logo, biểu tượng cửa sổ | Logo phụ trắng thay chữ BEEFTOWN gõ bằng phông ở đầu hai trang; brandmark làm biểu tượng cửa sổ — `src/may-chu.ts` nhập thẳng `web/public/thuong-hieu/chu-beeftown-trang.svg`, `web/public/bieu-tuong.svg` khi đóng gói, `src/nhan-dien.ts` đặt vào trang; bản in hướng dẫn: logo đen |
| Câu chữ | Hướng dẫn và chú thích gọi khung theo dấu ("khung có dấu ✓", "khung lưu ý", "khung viền đỏ"), không "khung xanh", "nút vàng", "chấm xanh" |
| Kiểm thử | Mới: `crm/test/test-can-nhan-dien.mjs`; `can-app/test/thu.ts` đọc trang máy chủ trả thật (logo, biểu tượng cửa sổ); `crm/test/test-cong-khai-nhan-dien.mjs` quét thêm `can-app/src` |
| Tài liệu | File này, `can-app/README.md` (mục "Bản 2.12"), `can-app/CLAUDE.md`, `AGENTS.md`, `CLAUDE.md`, skill thiết kế |

Đã đổi lần ba — PR 1 "Đổi nhận diện website" (bộ nhận diện 21/10/2026):

| Nơi | Đổi gì |
|---|---|
| `web/src/styles/cong-khai.css`, `web/src/styles/chung.css` | 12 biến mỗi nơi theo bảng 22/10/2026; bỏ hai biến vàng; `rgba()` theo số RGB mới; trang công khai nền trắng, đầu trang và chân trang đen |
| `web/src/styles/noi-bo.css`, `kho.css`, `kho-khung.css`, `<style>` của các trang `/noi-bo` và kho | Bỏ 8 token trạng thái; trạng thái vẽ bằng K1–K7; đèn sức khỏe vẽ bằng hình |
| `web/public/thuong-hieu/` | 10 SVG bộ mới (`tach-logo.mjs`); xóa 14 SVG của bộ cũ (logo cũ, đầu bò cũ, hương thảo, vân mỡ, steak, tem tròn, chữ lặp); `logo-ngang-do.svg`, `dau-bo-do.svg` giữ tên, nội dung mới |
| `web/public/bieu-tuong.svg`, `favicon.ico`, 2 PNG trong `web/public/thuong-hieu/`, 4 biểu tượng trong `web/public/kho/` | Dựng lại bằng `tao-bieu-tuong.py` từ SVG bộ mới |
| Đầu trang, chân trang, trang in | Đầu trang công khai và `/noi-bo`: logo phụ trắng; đầu trang kho: brandmark trắng; chân trang: logo chính trắng; trang in của kho: logo chính đen thay chữ "BEEFTOWN" gõ bằng phông |
| Hình trang trí | Bỏ hết lớp trang trí (`.trang-tri`, nét hương thảo, steak, vân mỡ, tem tròn, chữ lặp); khối màu phẳng và ảnh |
| `theme-color` (3 layout), `web/public/kho/manifest.json` | `#000000`; `background_color` `#F4F4F4` |
| Câu chữ nhân viên đọc, tin Zalo cho chủ | Bỏ tên màu ("đèn vàng", "hiện xanh"…), gọi theo chữ của nhãn |
| Tagline | "Pick it, grill it, love it!" ở `web/src/lib/chu.ts`, máy dịch, kiểm thử, tài liệu |
| Công cụ | Xóa công cụ tách PDF nhận diện cũ (chỉ phục vụ hình đã bỏ); `web/cong-cu/anh/tao-co-anh.py` dán ảnh tách nền lên nền trắng |
| Kiểm thử | Bảng chép tay theo bảng mới; mới: `crm/test/test-cong-khai-nhan-dien.mjs` (toàn repo không còn tham chiếu hình bộ cũ, mã cũ, tagline cũ), `crm/test/test-noi-bo-trang-thai.mjs` |
| Tài liệu | File này, `README.md`, `AGENTS.md`, `CLAUDE.md`, `web/README.md`, `web/THIET-KE.md`, `web/KHO.md`, skill thiết kế |

Đã đổi lần đầu (PR "màu và thông tin chung", trang công khai, sang bảng 09/10/2026):

| Nơi | Đổi gì |
|---|---|
| `web/src/styles/cong-khai.css` | 14 token khai lại trong khối `.ck` đầu tiên; màu `rgba()` theo số RGB mới |
| `web/src/components/*.astro` của trang công khai | Màu `rgba()` trong phần `<style>` theo số RGB mới |
| `web/src/layouts/Trang.astro` | Thẻ `theme-color` |
| `web/public/thuong-hieu/*.svg` (15 file lúc đó), `web/public/bieu-tuong.svg` | Màu tô của logo, đầu bò, hoa văn; hình không đổi |
| `web/public/favicon.ico`, `web/public/thuong-hieu/bieu-tuong-180.png`, `chia-se-1200x630.png`, 4 biểu tượng trong `web/public/kho/` | Dựng lại bằng `tao-bieu-tuong.py` (lúc đó đổi mã màu của PDF cũ sang mã đã chốt) |
| `crm/test/test-cong-khai-giao-dien.mjs` | Hằng `BANG_MAU` và nhóm 6 |
| `web/THIET-KE.md` mục 2, `README.md` mục "Bảng màu", `AGENTS.md` | Tài liệu theo tình trạng lúc đó |
| Skill `.claude/skills/thiet-ke-beeftown/` (PR #63, đã gộp) | Lúc đó: hai bảng token, một cho trang công khai và một cho `/noi-bo`, kho |

Đã đổi lần hai (12/10/2026: `/noi-bo` và kho sang bảng 09/10/2026, không nền trắng):

| Nơi | Đổi gì |
|---|---|
| `web/src/styles/chung.css` | 14 token trong hai khối `:root` — cùng giá trị với khối `.ck` |
| `web/src/styles/noi-bo.css` | Hai bề mặt `--nb-nen`, `--nb-the` và 8 token màu trạng thái khai trên `.nb-than`; ô của trình duyệt không tô trắng; chữ gợi ý `--muc-nhat`; nút phụ viền `--vien-o` |
| `web/src/styles/kho.css`, `web/src/styles/kho-khung.css` | Token `--kho-…` trỏ về biến; bỏ 4 token màu trạng thái riêng của kho |
| 29 file dưới `web/src/pages/noi-bo/`, `web/src/components/SucKhoeHeThong.astro`, `web/src/components/kho/NhanHangChon.astro` | Mã hex viết cứng trong `<style>` và thuộc tính `style` đổi thành biến; bỏ `accent-color` |
| `web/src/lib/qua-tai.ts` | Trang báo quá tải theo bảng |
| `web/src/layouts/NoiBo.astro`, `web/src/layouts/Kho.astro`, `web/public/kho/manifest.json` | `theme-color`, `theme_color`, `background_color` |
| Kiểm thử | Mới: `crm/test/test-noi-bo-bang-mau.mjs` |

Ghi chú vẫn đúng:

- **`web/public/bieu-tuong.svg`** (và `favicon.ico`, biểu tượng màn hình chính trong `web/public/kho/`) là một
  bộ file cho cả ba nơi. Từ PR 1 nó chỉ còn là biểu tượng tab trình duyệt: đầu trang kho dùng
  `web/public/thuong-hieu/dau-bo-trang.svg`, phiếu đặt hàng in (`web/src/pages/noi-bo/kho/dat-hang/[id]/in.astro`)
  và các trang in của kho dùng `web/public/thuong-hieu/logo-ngang-den.svg`.
- **Biểu tượng của `BeeftownCan.exe`**: `can-app/scripts/dong-goi.ts` bọc `web/public/kho/bieu-tuong-192.png` vào
  file chạy — chỉ khi đóng gói trên Windows (`web/KHO.md` mục 4). File `.exe` CI dựng trên Ubuntu không mang
  biểu tượng; chỉ bản đóng gói tay trên Windows mang biểu tượng mới. Đổi file ảnh đó mà không tăng
  `PHIEN_BAN` thì hai bản cùng số phiên bản có thể khác biểu tượng.

Còn mang nhận diện cũ:

| Nơi | Ghi gì | Việc |
|---|---|---|
| 15 ảnh `web/public/kho/hd-*.png` | Ảnh chụp màn hình trong trang hướng dẫn của kho (`/noi-bo/kho/huong-dan`), chụp trước ngày 11/10/2026: giao diện bảng trước 09/10/2026, thẻ trắng. **Chụp lại sau PR 1** (`web/KHO.md`, mục 3i) | 8 |
| Mini App Zalo (`mini-app/`) | 4 logo PNG trong `mini-app/src/assets/`; 3 màu chưa duyệt (câu còn mở 1) | 10 |
| Bộ nhớ đệm ngoài | Ảnh xem trước cũ trên Facebook / Zalo; biểu tượng cũ của app kho đã cài trên điện thoại | 9 |
| Hai tài liệu cũ ở gốc repo (`Beeftown_Bo_Nhan_Dien_So.html`, `Beeftown_CRM_Design.html`) | Làm trước guideline; không phát hành, không sửa, không chép | — |

Lệnh tìm chỗ còn sót trên website (không in ra dòng nào là sạch; `crm/test/test-cong-khai-nhan-dien.mjs` quét
cùng họ mã trên cả tài liệu và công cụ):
`grep -rnE "#(A70C0C|F0E3D0|151008|F5AA14|B8A98C|890607|EBDCC6|E7D5BC|7A7366|211A10|FFFDF6)\b|rgba?\(\s*(21,\s*16,\s*8|240,\s*227,\s*208|167,\s*12,\s*12|137,\s*6,\s*7)" web/src web/public`.

## 6. Địa điểm

- **Khánh đã quyết:** địa điểm là 63 Hồ Tùng Mậu (07/10/2026); quán ở **tầng 3**, khách vào bằng **lối vào riêng ngay cạnh GS25** (09/10/2026). Địa điểm **có thang máy**: Khánh xác nhận ngày 11/10/2026.
- **Chưa biết:** nút thang máy ghi số mấy cho tầng của quán. Trang chỉ ghi "tầng 3" / "Floor 3" / "3층", không ghi số nút.
- Cách ghi: "Tầng 3, 63 Hồ Tùng Mậu" (tiếng Anh: "Floor 3, 63 Hồ Tùng Mậu"; tiếng Hàn: "Hồ Tùng Mậu 63, 3층"). Bản ngắn: "63 Hồ Tùng Mậu, TP.HCM" · "63 Hồ Tùng Mậu, Ho Chi Minh City" · "호치민시 Hồ Tùng Mậu 63".
- **Câu chỉ đường là Claude đề xuất, CHỜ KHÁNH DUYỆT CHỮ:** "Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3." · "Use our own entrance, right next to GS25, and take the lift to Floor 3." · "GS25 바로 옆 전용 입구로 들어와 엘리베이터로 3층까지 올라오세요." Trang đang dùng đúng ba câu này (`loiLen` trong `web/src/lib/chu.ts`), và kiểm thử giữ chúng đúng từng chữ để ba bản không lệch nhau. Khánh duyệt chữ khác thì sửa `loiLen` cùng các bản chép tay trong `crm/test/test-cong-khai-dia-diem.mjs`, `test-cong-khai-cau-chu.mjs`, `web/kiem-tra/trinh-duyet.mjs`.
- **Mã nguồn đã đổi** (PR "màu và thông tin chung"): địa chỉ cố định `DIA_CHI_NHA_HANG`, câu chung `loiLen`, thẻ tiêu đề và mô tả của từng trang, JSON-LD, hình thang máy thay hình cầu thang, bảng từ của máy dịch (`web/src/lib/may-dich.ts`). Gác: `crm/test/test-cong-khai-dia-diem.mjs` (mã nguồn của trang công khai), `test-cong-khai-cau-chu.mjs` nhóm 7 (chữ khách đọc), `web/kiem-tra/trinh-duyet.mjs` (trang đã dựng), `web/kiem-tra/thu-day-du.mjs` nhóm 7 (trang có bản công bố). Mẫu tìm chữ sai dùng chung: `web/kiem-tra/mau-dia-diem.mjs`.
- **Pháp nhân ở chân trang, Khánh quyết 26/10/2026:** địa chỉ (`PHAP_NHAN.diaChi` trong `web/src/lib/chu.ts`) chép theo mục 4 giấy chứng nhận đăng ký địa điểm kinh doanh, thay đổi lần 2 ngày 20/10/2026, và thêm số điện thoại (`PHAP_NHAN.dienThoai`) — khớp Thông tin doanh nghiệp trên Meta (Meta sửa cùng ngày) để nộp lại xác minh doanh nghiệp. Đây không phải địa chỉ nhà hàng. Kiểm thử giữ cả hai nguyên từng ký tự.
- **Tên phường của 63 Hồ Tùng Mậu chưa có giấy xác nhận:** trang, thẻ mô tả và JSON-LD không ghi phường, cũng không ghi quận. Không tự thêm. Kiểm thử bắt mọi vế phường / quận trong chữ khách đọc, tên gì cũng vậy. Khi có giấy, danh sách mã và kiểm thử phải sửa cùng lúc nằm ở chú thích của `DIA_CHI_PHAN` trong `web/src/lib/chu.ts`.
- Điều đã biết về đường đến chỉ có địa chỉ, tầng 3, lối vào riêng ngay cạnh GS25, thang máy. Chỗ gửi xe, mốc đường, số bước, khoảng cách, lối cho xe lăn: chưa xác nhận, không viết lên trang.
- Không gọi 63 Hồ Tùng Mậu là "toà nhà". Trang chỉ nói địa điểm hiện tại, không kể chuyện đổi địa điểm.
- **Địa chỉ đã công bố trong database thắng địa chỉ trong mã.** Khóa `dia_chi_hien_thi` (màn Nội dung của `/noi-bo`, nhóm Liên hệ) nếu đang công bố thì trang in bản đó. Đổi địa điểm phải xem lại cả các khóa `dia_chi_hien_thi`, `google_maps_url`, `tieu_de_og`, `mo_ta_og`, `dong_trang_thai`, và ở màn Cài đặt (`/noi-bo/cai-dat`): tên chi nhánh và ô địa chỉ của chi nhánh. Bot Messenger trả lời khách bằng "Beeftown — <tên chi nhánh>" và, khi chưa có bản công bố, bằng ô địa chỉ đó.

---

## Phụ lục — lịch sử bảng 09/10/2026

Phần này chỉ để tra lịch sử: website chạy bảng 09/10/2026 từ 09–12/10/2026 tới PR 1. **Không dùng mã nào dưới
đây cho thiết kế mới.** Đây là nơi duy nhất trong repo còn ghi mã của bảng này (kiểm thử chặn mã cũ ở mọi file
khác).

Bảng lập ngày 10/10/2026 từ Brand Guideline (bản lưu số 17 trên Claude), Khánh chốt ngày 09/10/2026. Trang công
khai đổi sang bảng này trong PR "màu và thông tin chung", "thành phần và khung trang" (bỏ nền trắng) và "trang
chủ và thực đơn" (11/10/2026); `/noi-bo` và kho đổi ngày 12/10/2026. Lúc đó website không có nền trắng ở đâu cả.
Logo trên web khi ấy là nét tách từ PDF nhận diện cũ rồi đổi mã màu (bảng `DOI_MAU` của công cụ cũ), cùng các
hình trang trí của PDF đó (vân mỡ, hương thảo, steak, tem tròn, chữ lặp) — tất cả bỏ ở PR 1. Guideline đầy đủ
lúc đó (5 trang, tiếng Anh): https://claude.ai/artifact/EKyJZyhi7sDznKXHRtc3iq; logo vector, file in và PDF ở
máy Khánh, thư mục `Documents\Beeftown_Brand_Assets_V17_2026-10-09`.

**Bảng 5 màu (hệ RGB):**

| Tên | HEX | RGB | Dùng cho | Phần trên mỗi bề mặt |
|---|---|---|---|---|
| Beef Red | `#A70C0C` | 167, 12, 12 | Logo, tiêu đề, mảng nhấn | 25 % |
| Cream | `#F0E3D0` | 240, 227, 208 | Nền: tường, giấy, màn hình | 60 % |
| Charcoal | `#151008` | 21, 16, 8 | Chữ và nét mảnh | 10 % |
| Marigold | `#F5AA14` | 245, 170, 20 | Điểm nhấn nhỏ | dưới 5 % |
| Warm Stone | `#B8A98C` | 184, 169, 140 | Nét kẻ và nền phụ | không tính |

Guideline 09/10/2026 ghi: một đỏ, một vàng, không màu pha nhạt; chữ Montserrat độ đậm 500 / 700 / 800 / 900;
logo gồm lockup, brandmark, wordmark, có bản riêng cho nền sáng và nền tối; tagline viết ba câu có dấu chấm.
Các mã cũ hơn nữa (`#A21E22`, `#FBF4E1`, `#1E160E`, `#F5C211`) của bản guideline trước đó đã bỏ từ 09/10/2026.

**Màu pha của website (Khánh cho phép 10/10/2026) và token đã chạy:**

| Token | Mã |
|---|---|
| `--do` | `#A70C0C` |
| `--do-dam`, `--do-sau` | `#890607` |
| `--kem` | `#F0E3D0` |
| `--kem-sau` | `#EBDCC6` |
| `--kem-dam` | `#E7D5BC` |
| `--than` | `#151008` |
| `--mu-tat`, `--cuc-vang` | `#F5AA14` |
| `--da` | `#B8A98C` |
| `--vien-o` | `#7A7366` |
| `--muc-nhat`, `--vach`, `--vach-kem` | than 68 %, than 16 %, kem 22 % |
| (không token) nền khung ảnh trên dải tối; nền thẻ nhãn khay cũ | `#211A10`; `#FFFDF6` |

Đề xuất ngày 10/10/2026 là `--kem-sau` `#E7D5BC` và `--kem-dam` `#DAC5AA`; khi làm thử `#DAC5AA` làm dải "Cả bữa"
sẫm hơn hẳn, nên hai bậc kem lùi lại một nấc. Phần của từng màu trên trang công khai (Khánh quyết 11/10/2026: giữ
như đang chạy): kem khoảng 60, tối 25, đỏ 12, vàng 3.

**Tám màu trạng thái của `/noi-bo` và kho (12/10/2026 – PR 1, Claude chọn theo tương phản, bỏ ngày 25/10/2026):**

| Token | Mã | Vai |
|---|---|---|
| `--xanh` | `#1A683F` | Chữ, vạch, đèn "xong", nền nhãn đặc |
| `--xanh-nen` | `#D3E3C6` | Nền nhạt |
| `--xanh-vien` | `#A3C597` | Viền khối xanh nhạt |
| `--vang-chu` | `#7A5200` | Chữ, biểu tượng "lưu ý" trên nền sáng |
| `--vang-nen` | `#F6DC9E` | Nền nhạt |
| `--vang-vien` | `#DDB65C` | Viền khối vàng nhạt |
| `--do-nen` | `#F2D6CE` | Nền nhạt của "lỗi, làm ngay" |
| `--do-vien` | `#DDA79C` | Viền khối đỏ nhạt |

Token của kho khi đó: `--kho-vach` là than 16 %, `--kho-vach-dam` là `--da` (Warm Stone). Lệnh tìm bảng còn cũ
hơn (trước 09/10/2026): `grep -rnE "30, ?22, ?14|251, ?244, ?225|178, ?58, ?44|150, ?15, ?19" web/src`.
