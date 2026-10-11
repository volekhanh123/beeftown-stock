# Ấn phẩm ngoài web — mạng xã hội, ảnh chia sẻ, tại quán

Dùng khi làm bài đăng, story, ảnh bìa, banner, slide, biển, ấn phẩm in, landing page ngoài `web/`, hay
bất kỳ hình nào mang tên Beeftown. Luật gốc: **`THUONG-HIEU.md`** (brand guideline Khánh chốt
09/10/2026 — bảng màu, logo, chữ, ảnh, địa điểm); `web/THIET-KE.md` mục 8 (brief chụp ảnh) và mục 9 (bộ
campaign) cho phần guideline chưa nói tới.

## Nguyên tắc

- **Màu: năm màu của bảng thương hiệu đã chốt**, không dùng màu pha của website (đỏ đậm, hai nền kem
  đậm hơn, màu viền ô nhập — Khánh chỉ cho phép chúng trên màn hình của trang công khai) và không dùng
  bảng cũ mà `/noi-bo`, kho còn chạy:
  Beef Red `#A70C0C`, Cream `#F0E3D0`, Charcoal `#151008`, Marigold `#F5AA14`, Warm Stone `#B8A98C`.
  Phần trên mỗi bề mặt: Cream 60 % · Beef Red 25 % · Charcoal 10 % · Marigold dưới 5 %; Warm Stone chỉ
  cho nét kẻ và nền phụ. Không màu pha nhạt, không đỏ thứ hai. Marigold và Warm Stone không làm chữ
  trên nền kem; không đặt chữ đỏ trên nền than (2,4 : 1); Marigold trên nền đỏ chỉ cho chữ lớn hay hình.
- **Chữ: Montserrat 500 / 700 / 800 / 900.** Giá dạng `000.000 đ`, ngày `dd/mm/yyyy`.
- **Chữ trên ấn phẩm chỉ gồm**: tagline *Pick it. Grill it. Love it.* (có dấu chấm), descriptor *Beef
  Specialty Restaurant*, câu chính *Không cần rành bò. Chọn theo gu, thấy giá trước.*, địa điểm
  "Tầng 3, 63 Hồ Tùng Mậu" (không kèm tên phường, quận; chỉ đường thì dùng đúng câu trong
  [cau-chu.md](cau-chu.md), mục "Dữ kiện cố định"). Muốn thêm câu khác: câu đó phải đúng sự thật và qua
  được danh sách chữ cấm của web (`web/src/lib/chuoi-cam.js` áp dụng nguyên cho campaign).
- **Không viết**: rẻ, buffet, cao cấp, Korean BBQ, nướng Hàn, grade khi chưa có chứng nhận, số ngày ủ
  khi chưa có hồ sơ, chữ về than, lửa, khói, số phần trăm khi chưa có phép thử. Không câu "Thịt chuẩn
  - Giá thật". **Không ngày, không giá, không ưu đãi, không đếm ngược** khi chưa được công bố.
- Ảnh AI chỉ để minh họa, luôn ghi **"Ảnh minh họa"**, chỉ cho ảnh không khí món; **quảng cáo và thực
  đơn dùng ảnh chụp thật** — không bao giờ AI cho quầy, khay, không gian, lối lên, con người.
- **Logo** (guideline): một logo gồm lockup (đầu bò + BEEFTOWN + tagline), brandmark (đầu bò), wordmark
  (chữ BEEFTOWN); cả logo một màu. Lockup rộng tối thiểu 160px — hẹp hơn thì dùng brandmark (tối thiểu
  48px). Khoảng trống quanh logo bằng chiều cao chữ "B". **Mỗi bề mặt một logo, đặt ở trên cùng**
  (trái, giữa hoặc phải). **Không** đổi màu, kéo giãn, xoay, thêm bóng, viền, **đặt lên ảnh**, gõ lại
  bằng phông khác. Bản cho nền sáng và bản cho nền tối là hai bản vẽ khác nhau (bản nền tối có viền
  ngoài và mặt bò tô kín) — không lấy bản này đổi màu thành bản kia.
- **File logo**: bản mới nằm trên máy Khánh (`Beeftown_Brand_Assets_V17_2026-10-09`, thư mục
  `01_Logo_vector`: bản nền sáng màu red / charcoal / black, bản nền tối màu cream / white) — không vào
  repo. SVG trong `web/public/thuong-hieu/` đã đổi sang mã màu của bảng chốt nhưng vẫn là **nét tách từ
  PDF nhận diện cũ**, không phải bản vẽ của bộ tài sản bản 17 — đừng dùng cho ấn phẩm mới.
- Kênh liên hệ (Facebook, hotline, Zalo, Google Maps) chỉ ghi khi **đã công bố** trong `/noi-bo` —
  tên tài khoản trong bản nháp cũ chưa phải dữ kiện.

## Kích thước

| Mẫu | Cỡ | Ghi chú |
|---|---|---|
| Ảnh chia sẻ link (OG) | 1200 × 630 | Bản dự phòng: `web/public/thuong-hieu/chia-se-1200x630.png` (vân mỡ + logo) |
| Bài đăng Facebook / Instagram | 1080 × 1350 (4:5) | Mẫu chuẩn của bộ campaign |
| Story, Reels | 1080 × 1920 (9:16) | Chừa khoảng 250px trên và dưới cho giao diện ứng dụng |
| Video TikTok | 1080 × 1920 | Chừa 260px trên, 300px dưới |
| Bài vuông Facebook | 1080 × 1080 | |
| Ảnh bìa Facebook | 820 × 312 | Vùng an toàn 640 × 312 |
| Avatar Facebook / Google | 720 × 720 | Hiển thị tròn; Google tối thiểu 250 × 250 |
| Ảnh bìa Google | 1024 × 576 (16:9) | Bài đăng Google 1200 × 900 |
| Avatar Zalo OA | 400 × 400 | Hiển thị rất nhỏ — dùng đầu bò, không dùng logo ngang |
| Ảnh bìa Zalo OA | 1920 × 1080 | Nửa dưới bị che |
| Avatar TikTok | 200 × 200 | Hiển thị tròn |

Nguồn bảng kích thước: `Beeftown_Bo_Nhan_Dien_So.html`, mục F4 (kích thước nền tảng — còn dùng được;
phần nội dung của file đó đã cũ, xem dưới).

## Ảnh chụp

Guideline (`THUONG-HIEU.md` mục 2):

- **Nên có:** khay bò đóng sẵn có nhãn, vỉ gas với hơi nhẹ, bàn tay và đĩa ăn chung, nền kem và gỗ sáng.
- **Không có:** than, lửa, khói dày, đá đen, gang, thớt gỗ thô, rau thơm đặt trên thịt sống, vân mỡ
  đẹp hơn thịt quán bán.

Thêm từ `web/THIET-KE.md` mục 8 — đọc bản đầy đủ trước khi đặt lịch chụp:

- Ánh sáng ấm, tự nhiên, một hướng sáng chính, cùng nhiệt độ màu cho cả bộ. Không flash gắn máy.
- **Vỉ gas thật của quán. Không than, không củi, không khói giả.**
- Không chữ, logo hãng khác; không đồ mượn từ mockup PDF. Ống kính gần góc nhìn người đứng — không ống
  siêu rộng làm phòng rộng hơn thật.
- Người trong ảnh có giấy đồng ý; ảnh có đồ uống có cồn chỉ người trưởng thành; trẻ em không làm trung
  tâm.
- Nhãn khay khi giá chưa công bố: canh nét để số tiền không đọc rõ — ảnh có số tiền là công bố giá.
- File gốc cạnh dài ≥ 2400px, không chữ, không lọc màu mạnh, tên file ASCII gạch nối
  (`quay-toan-canh-4x3.jpg`), kèm tên người chụp và ngày chụp.

## Tài liệu thiết kế ở gốc repo — ĐÃ CŨ

Sáu file HTML / SVG ở gốc repo và bản nháp website cũ làm tháng 6 – 7/2026, **trước** brief
06/10/2026 và guideline 09/10/2026. Chỉ dùng làm tư liệu, không chép màu, phông, câu chữ, luật logo từ
đó. Phần còn dùng được ghi rõ bên dưới. (`Beeftown_Can_TMA.html` ở gốc repo là công cụ cân cũ, không
thuộc nhóm này — `can-app/` đã thay nó.)

| File | Còn dùng được | Lệch luật hiện hành — KHÔNG làm theo |
|---|---|---|
| `Beeftown_Bo_Nhan_Dien_So.html` | Bảng kích thước F4; nguyên tắc trả lời đánh giá; cách đặt UTM; câu mẫu tin Zalo (đã có trong database) | Phông Baloo 2; logo gõ chữ và bò nháy mắt làm avatar; luật logo F5 (đặt logo lên ảnh có lớp phủ — guideline mới cấm đặt lên ảnh); "Thịt chuẩn · Giá thật"; danh mục "Korean barbecue"; hashtag kbbq / buffet; giá, giảm 20 %; phòng riêng; địa chỉ, giờ cũ; "Đặt bàn ngay" thay vì "Hỏi bàn"; ảnh "có khói, có lửa"; vàng làm màu giá và nút |
| `Beeftown_Logo_Suite_and_Directions.html` | — | Bảng màu khác (`#E23B2E`…); phông Anton, Archivo; cỡ tối thiểu cũ (guideline mới: lockup 160px, brandmark 48px); "BUTCHER · BEEF · BBQ"; hướng "Charcoal & ember"; hiệu ứng cuộn |
| `Beeftown_Instore_Art.html` | Tagline | Mặt tiền tầng trệt (Beeftown ở tầng 3); phòng riêng; "AGED · IMPORTED"; giờ mở cửa; "hút Gen Z" |
| `Beeftown_CRM_Design.html` | Câu đồng ý nhận tin (ô không tick sẵn, từ khóa "NGUNG"); giọng "thẳng thắn, nói rõ điều kiện lẫn quyền lợi" | Phòng riêng cho VIP; quận cũ; "mua sẵn ~90 %" |
| `Beeftown_Dashboard.html` | — (công cụ tài chính nội bộ) | Bảng màu than hồng riêng, Segoe UI, "Korean BBQ" |
| `Beeftown_Concept_Board_v1.svg` | Tagline | Bảng màu cũ; "good beef, good price" (lấy giá làm mồi câu) |
| `Beeftown_Website/index.html` | — | Bản nháp **không được phát hành** (README gốc, mục cảnh báo) |

## Tin nhắn Zalo / Messenger

- Lời bot Messenger: `CAU_BOT` trong `web/src/lib/messenger.ts` — xưng "mình", gọi "bạn", Beeftown ở
  ngôi thứ ba; luôn "Beeftown đã nhận yêu cầu", lỗi thì nói rõ "CHƯA được ghi nhận"; không số bàn trống,
  không giá.
- Mẫu tin Zalo nằm trong database (migration `0006`, `0047`); mẫu đã được Zalo duyệt không sửa tại chỗ
  được. ZBS-01 "xác nhận đặt bàn" chỉ gửi khi nhân viên bấm "Đã gọi xác nhận" — yêu cầu khách vừa gửi
  chưa nhận tin Zalo nào (migration `0063`). Tin chăm sóc kết thúc bằng cách hủy nhận tin ("NGUNG").
- Tin báo động cho chủ (`web/src/lib/bao-dong-tin.ts`): chỉ số đếm, không tên hay số điện thoại khách.
