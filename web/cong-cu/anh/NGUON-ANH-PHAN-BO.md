# Nguồn và giấy phép — ảnh của trang "Các phần thịt bò" (`/phan-thit-bo`)

Năm ảnh dưới đây là **ảnh chụp thật của người khác**, giấy phép cho dùng lại, không phải ảnh AI và không phải ảnh quán.
Khánh quyết 23/11/2026: dùng ảnh thật lấy từ web cho trang này, không gắn nhãn "Ảnh minh họa" (nhãn đó chỉ dành cho ảnh AI —
`web/src/lib/anh.ts`, đầu file). Ảnh chỉ được cắt khung 4:3 và (riêng diềm thăn bò) chỉnh màu bằng Pillow — **không ảnh nào
trên trang đi qua công cụ tạo ảnh AI** (xem mục "Bản chỉnh bằng GPT, chưa dùng" bên dưới).

File này nằm ngoài `public/` nên không lên trang. Trên trang chỉ ghi tên tác giả (mục "Nguồn ảnh" cuối trang) và, với ảnh
CC BY 2.0, thêm giấy phép, trang gốc và việc đã chỉnh. Tên các trang kho ảnh (Pexels, Pixabay) **không** được in lên trang:
`src/lib/chuoi-cam.js` chặn chúng ("ảnh kho"), và giấy phép của hai nơi đó không đòi ghi nguồn.

| Id ảnh (`public/anh/`) | Phần thịt | Tác giả | Giấy phép | Trang gốc | Đã làm gì |
|---|---|---|---|---|---|
| `phan-bo-dau-than-ngoai` | Đầu thăn ngoại (ribeye) | Tiago Morheto | Pexels License (dùng thương mại, không đòi ghi nguồn) | pexels.com/photo/29095929/ | Cắt 4:3 quanh miếng thịt từ ảnh gốc 3:2; không chỉnh màu |
| `phan-bo-de-suon` | Dẻ sườn bò (galbisal) | 홍대앞고깃집 | Pixabay Content License (dùng thương mại, không đòi ghi nguồn) | pixabay.com, ảnh số 7683984 | Cắt 4:3; không chỉnh màu |
| `phan-bo-diem-than` | Diềm thăn bò (anchangsal) | T.Tseng | **CC BY 2.0** — bắt buộc ghi tên tác giả, giấy phép và việc đã chỉnh | commons.wikimedia.org/wiki/File:Yazawa_cut_harami_(sliced_outside_skirt)_(24034830974).jpg (chụp 22/01/2016, Yazawa, Beverly Hills) | Cắt 4:3 quanh một lát thịt; **hạ độ bão hòa và xoay hồng về đỏ** cho vùng màu đỏ (ảnh gốc ám hồng cánh sen). Trang ghi "đã cắt khung và chỉnh màu" |
| `phan-bo-nac-vai` | Nạc vai bò (chuck eye roll) | BlackRiv | Pixabay Content License | pixabay.com/photos/beef-chuck-roll-meat-raw-food-2864657/ | Cắt 4:3. Ảnh là khối chuck roll nguyên miếng |
| `phan-bo-loi-vai` | Lõi vai bò (top blade) | BlackRiv | Pixabay Content License | pixabay.com/photos/flat-iron-steak-seemed-beef-meat-3072106/ | Cắt 4:3. Ảnh là miếng flat iron đã lọc gân giữa |

## Kiểm tra giấy phép

- **T.Tseng, CC BY 2.0:** kiểm lại bằng API của Wikimedia Commons ngày 23/11/2026 (`LicenseShortName = CC BY 2.0`,
  `AttributionRequired = true`, tác giả T.Tseng).
- **Pexels, Pixabay:** nguồn và giấy phép lấy từ ghi chú của video đào tạo thịt bò 13/11/2026
  (`05_VanHanh/04_Training/00_Video_DaoTao_ThitBo_2026-11-13/anh-minh-hoa/anh-that/nguon-va-giay-phep.md`, trên OneDrive,
  không nằm trong repo). **Chưa kiểm lại trang gốc ngày 23/11/2026**: cả hai trang chặn trình duyệt tự động (màn xác minh
  bot), mình không vượt qua. Ảnh Pexels tải lại được từ máy chủ ảnh của Pexels (1600 × 1067).
- Ba ảnh (dẻ sườn bò, nạc vai bò, lõi vai bò) chỉ có bản 900 px; ảnh đầu thăn ngoại cắt từ bản 1600 px, ảnh diềm thăn bò từ
  bản 1920 px. Mọi bản đã dựng không vượt 640 px (`danh-sach.json`, id `phan-bo-*`) để giữ phần trống của thư mục `public/anh`
  (8 MB): năm ảnh này dùng 462.110 byte, thư mục còn trống khoảng 0,62 MB sau khi thêm.

## Bản chỉnh bằng GPT, chưa dùng (diềm thăn bò)

Ảnh diềm thăn bò gốc ám hồng cánh sen và có vệt hơi nước trên vỉ. Ngày 23/11/2026 mình thử chỉnh bằng cầu nối GPT
(`image_generate`, chế độ sửa ảnh, một lượt, khoảng một phút): bản GPT cho thịt đỏ tự nhiên, vân mỡ rõ, vỉ sạch, **đẹp hơn
rõ rệt** bản chỉnh màu bằng Pillow. Nhưng đó là **ảnh AI** (GPT vẽ lại toàn bộ điểm ảnh, vân mỡ không còn giống hệt ảnh gốc),
nên theo `AGENTS.md` và đầu file `src/lib/anh.ts` trang phải ghi "Ảnh minh họa" — trái với chỉ thị 23/11/2026 không gắn nhãn
cho trang này. Vì vậy **trang đang dùng bản chỉnh màu bằng Pillow, bản GPT chưa lên trang**. Hai bản để cạnh nhau trong thư
mục ghi chú của phiên làm việc (ngoài repo). Muốn dùng bản GPT: Khánh quyết hoặc chấp nhận nhãn, hoặc bỏ quy tắc nhãn cho
trang này; rồi đổi nguồn của `phan-bo-diem-than` trong `danh-sach.json`, chạy `tao-co-anh.py`, khai ảnh là ảnh AI (`minhHoa: true`
và thêm vào `ANH_AI` của `crm/test/test-cong-khai-anh.mjs`) nếu giữ nhãn.

## Ảnh gốc để dựng lại

Ảnh gốc (JPG đã cắt 4:3) **không vào repo** (`.gitignore` chặn `*.jpg`). Muốn dựng lại cỡ ảnh: tải lại từng ảnh theo cột "Trang
gốc", cắt đúng khung như cột "Đã làm gì", đặt tên `phan-bo-<…>-4x3.jpg` rồi chạy `tao-co-anh.py` như
`web/THIET-KE.md` mục 7, "Dựng lại tài sản". Bản dựng trong `public/anh/` là bản đang dùng.

## Việc cần Khánh biết

1. Ảnh nạc vai bò và lõi vai bò là ảnh thịt trên nền be (từ nhà bán), không phải ảnh khay hay quầy. Ảnh dẻ sườn bò là một
   đĩa dọn ở nhà hàng, có thêm hành tây và rau trang trí.
2. Ảnh thật chụp tại Beeftown (quầy, khay skin-pack) có thì thay: đổi tệp nguồn của id tương ứng trong `danh-sach.json`.
3. Ảnh đã tạo lại hay chỉnh bằng AI là **ảnh AI** và theo `AGENTS.md` (mục chữ và thương hiệu) phải có nhãn "Ảnh minh họa" —
   xem mục "Bản chỉnh bằng GPT, chưa dùng". Phải hỏi Khánh trước khi đưa lên trang không nhãn.
