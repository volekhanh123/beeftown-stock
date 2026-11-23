# Nguồn và giấy phép — ảnh của trang "Các phần thịt bò" (`/phan-thit-bo`)

Bảy ảnh: năm ảnh đợt 1 (PR #212, 23/11/2026) và hai ảnh đợt 2 (LA Galbi, ba chỉ bò — cùng ngày, bảng dưới).

Các ảnh dưới đây là **ảnh chụp thật của người khác**, giấy phép cho dùng lại, không phải ảnh quán. Khánh quyết 23/11/2026:
dùng ảnh thật lấy từ web cho trang này, **không gắn nhãn "Ảnh minh họa"**. Bốn ảnh chỉ được cắt khung 4:3. **Ảnh diềm thăn bò là
ngoại lệ:** ảnh gốc ám hồng và có vệt hơi nước nên đã **chỉnh sửa bằng AI** (GPT qua cầu nối Codex, 23/11/2026) — Khánh duyệt
dùng bản đó, không nhãn (mục "Ảnh diềm thăn bò chỉnh bằng AI" bên dưới). Vì ảnh đó là ảnh AI chỉnh từ ảnh thật, dòng nguồn ảnh
trên trang nói rõ "chỉnh sửa bằng AI" (CC BY 2.0 cũng đòi ghi việc đã chỉnh).

File này nằm ngoài `public/` nên không lên trang. Trên trang chỉ ghi tên tác giả (mục "Nguồn ảnh" cuối trang) và, với ảnh
CC BY 2.0, thêm giấy phép, trang gốc và việc đã chỉnh. Tên các trang kho ảnh (Pexels, Pixabay) **không** được in lên trang:
`src/lib/chuoi-cam.js` chặn chúng ("ảnh kho"), và giấy phép của hai nơi đó không đòi ghi nguồn.

| Id ảnh (`public/anh/`) | Phần thịt | Tác giả | Giấy phép | Trang gốc | Đã làm gì |
|---|---|---|---|---|---|
| `phan-bo-dau-than-ngoai` | Đầu thăn ngoại (ribeye) | Tiago Morheto | Pexels License (dùng thương mại, không đòi ghi nguồn) | pexels.com/photo/29095929/ | Cắt 4:3 quanh miếng thịt từ ảnh gốc 3:2; không chỉnh màu |
| `phan-bo-de-suon` | Dẻ sườn bò (galbisal) | 홍대앞고깃집 | Pixabay Content License (dùng thương mại, không đòi ghi nguồn) | pixabay.com, ảnh số 7683984 | Cắt 4:3; không chỉnh màu |
| `phan-bo-diem-than` | Diềm thăn bò (anchangsal) | T.Tseng | **CC BY 2.0** — bắt buộc ghi tên tác giả, giấy phép và việc đã chỉnh | commons.wikimedia.org/wiki/File:Yazawa_cut_harami_(sliced_outside_skirt)_(24034830974).jpg (chụp 22/01/2016, Yazawa, Beverly Hills) | Cắt 4:3 quanh một lát thịt, rồi **chỉnh sửa bằng AI** (sửa màu về đỏ tự nhiên, bỏ vệt hơi nước trên vỉ; ảnh gốc ám hồng cánh sen). Trang ghi "đã cắt khung và chỉnh sửa bằng AI" |
| `phan-bo-nac-vai` | Nạc vai bò (chuck eye roll) | BlackRiv | Pixabay Content License | pixabay.com/photos/beef-chuck-roll-meat-raw-food-2864657/ | Cắt 4:3. Ảnh là khối chuck roll nguyên miếng |
| `phan-bo-loi-vai` | Lõi vai bò (top blade) | BlackRiv | Pixabay Content License | pixabay.com/photos/flat-iron-steak-seemed-beef-meat-3072106/ | Cắt 4:3. Ảnh là miếng flat iron đã lọc gân giữa |
| `phan-bo-la-galbi` | LA Galbi (sườn bò cắt ngang) | 홍대앞고깃집 | Pixabay Content License (kiểm lại trang gốc 23/11/2026) | pixabay.com/photos/…-7683982/ (tiêu đề Pixabay "Marinated Korean beef ribs", thẻ "La갈비") | Cắt 4:3 (1137 × 853); không chỉnh màu. **Ảnh không thấy rõ các mặt cắt xương tròn của kiểu flanken** (GPT nhận xét 23/11/2026), nên alt chỉ tả "lát thịt bò đã ướp", không nói tên phần thịt |
| `phan-bo-ba-chi` | Ba chỉ bò | 홍대앞고깃집 | Pixabay Content License (kiểm lại trang gốc 23/11/2026) | pixabay.com/photos/…-7683988/ (bộ "고기모둠 세트 우삼겹세트") | Cắt 4:3 (630 × 472) lấy phần các lát thịt bò thái mỏng ở bên trái; không chỉnh màu. Alt chỉ tả "lát thịt bò thái mỏng, mỡ xen nạc" (không khẳng định đúng phần short plate: nhìn ảnh không phân biệt được với thịt ức) |

## Kiểm tra giấy phép

- **T.Tseng, CC BY 2.0:** kiểm lại bằng API của Wikimedia Commons ngày 23/11/2026 (`LicenseShortName = CC BY 2.0`,
  `AttributionRequired = true`, tác giả T.Tseng).
- **Pexels, Pixabay:** đợt 1 (PR #212) lấy nguồn và giấy phép từ ghi chú của video đào tạo thịt bò 13/11/2026
  (`05_VanHanh/04_Training/00_Video_DaoTao_ThitBo_2026-11-13/anh-minh-hoa/anh-that/nguon-va-giay-phep.md`, trên OneDrive, không
  nằm trong repo) vì hai trang chặn trình duyệt tự động. **Đợt 2 (23/11/2026) kiểm lại trang gốc bằng Chrome của Khánh** (Claude
  in Chrome, không vượt màn xác minh nào): ảnh ribeye trên Pexels hiện tác giả Tiago Morheto, giấy phép "Free"; hai ảnh BlackRiv
  trên Pixabay (nạc vai, lõi vai) hiện "Pixabay Content License"; hai ảnh mới hiện tác giả 홍대앞고깃집 và "Pixabay Content
  License". Ảnh dẻ sườn 7683984 cùng tác giả (thấy ở lưới kết quả Pixabay, chưa mở trang riêng). Ảnh Pexels tải lại được từ máy chủ
  ảnh của Pexels (1600 × 1067).
- Ba ảnh (dẻ sườn bò, nạc vai bò, lõi vai bò) chỉ có bản 900 px; ảnh đầu thăn ngoại cắt từ bản 1600 px, ảnh diềm thăn bò từ
  bản 1920 px. Mọi bản đã dựng không vượt 640 px (`danh-sach.json`, id `phan-bo-*`) để giữ phần trống của thư mục `public/anh`
  (8 MB): năm ảnh đợt 1 dùng khoảng 468 KB (thư mục 7.746.918 byte); hai ảnh đợt 2 thêm khoảng 177 KB (AVIF 45, WebP 60): **7.923.813 byte, còn trống 464.795 byte (≈ 0,44 MB)**.

## Ảnh diềm thăn bò chỉnh bằng AI (đang dùng)

Ảnh gốc của T.Tseng ám hồng cánh sen và có vệt hơi nước trên vỉ. Ngày 23/11/2026 chỉnh bằng cầu nối GPT (`image_generate`, chế độ
sửa ảnh, một lượt, khoảng một phút, ảnh mẫu là bản cắt 4:3 chưa chỉnh): thịt đỏ tự nhiên, vân mỡ rõ, vỉ sạch, **đẹp hơn rõ rệt**
bản chỉnh màu bằng Pillow. Đây là **ảnh AI** — GPT vẽ lại toàn bộ điểm ảnh, vân mỡ không còn giống hệt ảnh gốc — nên theo
`AGENTS.md` bình thường phải có nhãn "Ảnh minh họa". **Khánh quyết 23/11/2026: dùng bản GPT, không nhãn.** Đây là ngoại lệ có
chủ đích cho đúng ảnh này (`phan-bo-diem-than`, khai `minhHoa: false`); không ảnh AI nào khác được bỏ nhãn.

- Điều kiện giữ lại: dòng nguồn ảnh cuối trang nói "chỉnh sửa bằng AI" ở ba thứ tiếng (test-cong-khai-phan-bo nhóm 6); alt tả đúng thứ
  nhìn thấy, không nói đây là ảnh quán; ảnh chỉ dùng cho trang này.
- Ảnh GPT (PNG 1448 × 1086) và bản Pillow cũ để trong thư mục ghi chú của phiên làm việc, ngoài repo (`.gitignore` chặn `*.png`).
  Muốn trả về bản Pillow: bỏ chỉnh AI trong `danh-sach.json` (đổi `goc` về JPG 800 × 600 cắt từ ảnh Commons, hạ bão hòa vùng đỏ),
  chạy `tao-co-anh.py`, sửa dòng nguồn ảnh và `DA_CHINH_AI` của `test-cong-khai-anh.mjs`.

## Ảnh gốc để dựng lại

Ảnh gốc (JPG đã cắt 4:3) **không vào repo** (`.gitignore` chặn `*.jpg`). Muốn dựng lại cỡ ảnh: tải lại từng ảnh theo cột "Trang
gốc", cắt đúng khung như cột "Đã làm gì", đặt tên `phan-bo-<…>-4x3.jpg` rồi chạy `tao-co-anh.py` như
`web/THIET-KE.md` mục 7, "Dựng lại tài sản". Bản dựng trong `public/anh/` là bản đang dùng.

## Việc cần Khánh biết

1. Ảnh nạc vai bò và lõi vai bò là ảnh thịt trên nền be (từ nhà bán), không phải ảnh khay hay quầy. Ảnh dẻ sườn bò là một
   đĩa dọn ở nhà hàng, có thêm hành tây và rau trang trí.
2. Ảnh thật chụp tại Beeftown (quầy, khay skin-pack) có thì thay: đổi tệp nguồn của id tương ứng trong `danh-sach.json`.
3. Ảnh đã tạo lại hay chỉnh bằng AI là **ảnh AI** và theo `AGENTS.md` phải có nhãn "Ảnh minh họa". Chỉ ảnh diềm thăn bò được bỏ nhãn,
   theo quyết định của Khánh 23/11/2026; ảnh khác chỉnh bằng AI thì phải hỏi Khánh trước.
