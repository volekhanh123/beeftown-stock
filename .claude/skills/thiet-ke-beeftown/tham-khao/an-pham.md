# Ấn phẩm ngoài web — mạng xã hội, ảnh chia sẻ, tại quán

Dùng khi làm bài đăng, story, ảnh bìa, banner, slide, biển, ấn phẩm in, landing page ngoài `web/`, hay
bất kỳ hình nào mang tên Beeftown. Luật gốc: **`THUONG-HIEU.md`** (bộ nhận diện 21/10/2026 — logo, màu:
mục 0–2; chữ, ảnh, địa điểm giữ từ guideline 09/10/2026: mục 2, 6); `web/THIET-KE.md` mục 8 (brief chụp
ảnh) và mục 9 (bộ campaign) cho phần guideline chưa nói tới.

## Nguyên tắc

- **Màu: bảng Khánh chốt 22/10/2026** (`THUONG-HIEU.md` mục 1): đỏ `#BD0000`, đen `#000000`, trắng
  `#FFFFFF`. In ấn: đỏ C17 M100 Y100 K9, đen C75 M68 Y67 K90, trắng C0 M0 Y0 K0; PANTONE 3517 C là màu
  gần đúng của đỏ — nhà in in thử, Khánh duyệt bản in thử. Không dùng xám pha và đỏ đậm (Khánh chỉ cho
  phép chúng trên màn hình), không màu trạng thái, không màu nào của các bảng cũ. Chữ đỏ trên nền trắng
  và chữ trắng trên nền đỏ dùng được cho chữ thường (6,64 : 1); chữ đỏ trên nền đen chỉ cho chữ lớn và
  hình (3,16 : 1). Phần của mỗi màu: nền trắng, đen làm điểm nhấn, đỏ cho nút, nhãn, giá (câu 4 của
  `THUONG-HIEU.md` mục 0).
- **Chữ: Montserrat** (Khánh quyết 26/10/2026). Guideline 21/10/2026 chỉ ghi phông **của logo** —
  Figtree ExtraBold / SemiBold — và Figtree thiếu chữ có dấu tiếng Việt: không dùng Figtree cho chữ.
  Guideline 21/10/2026 không nói độ đậm chữ thường: ấn phẩm theo web (400 / 600 / 700 / 800) cho tới khi
  Khánh nói khác. Giá dạng `000.000 đ`, ngày `dd/mm/yyyy`.
- **Chữ trên ấn phẩm chỉ gồm**: tagline *Pick it, grill it, love it!* (Khánh chốt 26/10/2026; logo
  chính đã in sẵn "PICK IT, GRILL IT, LOVE IT!" — đừng gõ lại tagline cạnh logo), descriptor *Beef Specialty Restaurant*, câu chính *Không cần rành bò. Chọn theo gu, thấy giá trước.*, địa điểm
  "Tầng 3, 63 Hồ Tùng Mậu" (không kèm tên phường, quận; chỉ đường thì dùng đúng câu trong
  [cau-chu.md](cau-chu.md), mục "Dữ kiện cố định"). Muốn thêm câu khác: câu đó phải đúng sự thật và qua
  được danh sách chữ cấm của web (`web/src/lib/chuoi-cam.js` áp dụng nguyên cho campaign).
- **Không viết**: rẻ, buffet, cao cấp, Korean BBQ, nướng Hàn, grade khi chưa có chứng nhận, số ngày ủ
  khi chưa có hồ sơ, chữ về than, lửa, khói, số phần trăm khi chưa có phép thử. Không câu "Thịt chuẩn
  - Giá thật". **Không ngày, không giá, không ưu đãi, không đếm ngược** khi chưa được công bố.
- Ảnh AI chỉ để minh họa, luôn ghi **"Ảnh minh họa"**, chỉ cho ảnh không khí món và bữa ăn; **quảng
  cáo và thực đơn dùng ảnh chụp thật** — không bao giờ AI cho quầy, khay, không gian, lối vào, thang
  máy, mặt người (bàn tay người thì được: Khánh quyết ngày 11/10/2026 cho website).
- **Logo** (Brand Guidelines 21/10/2026, trang 2–5): ba biến thể — logo chính (chữ BEEFTOWN, đầu bò
  trong ô thay chữ O, dòng "PICK IT, GRILL IT, LOVE IT!"), logo phụ (chữ BEEFTOWN, không tagline),
  brandmark (ô bo góc + đầu bò). Mỗi biến thể **chỉ ba bản màu: đỏ, đen, trắng**. Cách dùng (trang 4):
  đỏ trên nền trắng; đen trên xám nhạt (đầu bò để trắng); trắng trên đỏ (đầu bò khoét, lộ nền); trên nền
  đen cũng dùng bản trắng. Khoảng trống mỗi phía một ô đầu bò (trang 3). **Mỗi bề mặt một logo, đặt ở
  trên cùng** (trái, giữa hoặc phải). **Không** đổi màu ngoài ba bản, kéo giãn, xoay, thêm bóng, viền,
  **đặt lên ảnh**, gõ lại bằng phông (kể cả Figtree), dùng lại hình của bộ nhận diện cũ. Cỡ tối thiểu:
  guideline 21/10/2026 không ghi — giữ luật bộ 09/10/2026: logo chính rộng ≥ 160px, hẹp hơn dùng logo
  phụ hoặc brandmark (≥ 48px).
- **File logo**: SVG bộ 21/10/2026 ở `web/public/thuong-hieu/` — logo chính `logo-ngang-{do,den,trang}.svg`,
  logo phụ `chu-beeftown-{do,den,trang}.svg`, brandmark `dau-bo-{do,den,trang}.svg`, riêng đầu bò
  `net-dau-bo.svg` — path gốc của PDF guideline (`web/cong-cu/thuong-hieu/tach-logo.mjs`), chỉ ba mã màu
  màn hình. Ấn phẩm in cần CMYK thì lấy file gốc của designer ở thư mục Drive "LOGO BEEFTOWN".
- Kênh liên hệ (Facebook, hotline, Zalo, Google Maps) chỉ ghi khi **đã công bố** trong `/noi-bo` —
  tên tài khoản trong bản nháp cũ chưa phải dữ kiện.

## Kích thước

| Mẫu | Cỡ | Ghi chú |
|---|---|---|
| Ảnh chia sẻ link (OG) | 1200 × 630 | Bản dự phòng: `web/public/thuong-hieu/chia-se-1200x630.png` (logo chính trắng trên nền đỏ) |
| Bài đăng Facebook / Instagram | 1080 × 1350 (4:5) | Mẫu chuẩn của bộ campaign |
| Story, Reels | 1080 × 1920 (9:16) | Chừa khoảng 250px trên và dưới cho giao diện ứng dụng |
| Video TikTok | 1080 × 1920 | Chừa 260px trên, 300px dưới |
| Bài vuông Facebook | 1080 × 1080 | |
| Ảnh bìa Facebook | 820 × 312 | Vùng an toàn 640 × 312 |
| Avatar Facebook / Google | 720 × 720 | Hiển thị tròn; Google tối thiểu 250 × 250 |
| Ảnh bìa Google | 1024 × 576 (16:9) | Bài đăng Google 1200 × 900 |
| Avatar Zalo OA | 400 × 400 | Hiển thị rất nhỏ — dùng brandmark (`dau-bo-do.svg`, hoặc đầu bò trắng trên nền đỏ), không dùng logo chính |
| Ảnh bìa Zalo OA | 1920 × 1080 | Nửa dưới bị che |
| Avatar TikTok | 200 × 200 | Hiển thị tròn |

Nguồn bảng kích thước: `Beeftown_Bo_Nhan_Dien_So.html`, mục F4 (kích thước nền tảng — còn dùng được;
phần nội dung của file đó đã cũ, xem dưới).

## Ảnh chụp

Guideline (`THUONG-HIEU.md` mục 2):

- **Nên có:** khay bò đóng sẵn có nhãn, vỉ gas với hơi nhẹ, bàn tay và đĩa ăn chung, nền kem và gỗ sáng
  (đồ vật trong ảnh: giấy lót, đĩa sứ màu kem; gỗ sáng — không phải màu nền thiết kế).
- **Không có:** than, lửa, khói dày, đá đen, gang, thớt gỗ thô, rau thơm đặt trên thịt sống, vân mỡ
  đẹp hơn thịt quán bán. Đá đen, gang, thớt gỗ thô là luật cho nền và mặt đặt thịt bò, vỉ và bàn nướng
  (bỏ kiểu ảnh steakhouse nền tối của PDF cũ, trang 11); thố, bát đá đen, chảo gang đựng món ăn kèm kiểu
  Hàn là dụng cụ dọn món, không thuộc luật này.

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

Các file HTML / SVG và bản nháp website cũ làm tháng 6 – 7/2026, **trước** brief 06/10/2026 và
guideline 09/10/2026. Chỉ dùng làm tư liệu, không chép màu, phông, câu chữ, luật logo từ đó. Phần còn
dùng được ghi rõ bên dưới. Hai file còn ở gốc repo; năm thứ còn lại đã lưu trữ 12/10/2026, nguyên văn ở
[commit 9443cc2](https://github.com/volekhanh123/beeftown-stock/tree/9443cc2cabb71b792772b1a52d7c134edab456cc).

| File | Còn dùng được | Lệch luật hiện hành — KHÔNG làm theo |
|---|---|---|
| `Beeftown_Bo_Nhan_Dien_So.html` | Bảng kích thước F4; nguyên tắc trả lời đánh giá; cách đặt UTM; câu mẫu tin Zalo (đã có trong database) | Phông Baloo 2; logo gõ chữ và bò nháy mắt làm avatar; luật logo F5 (đặt logo lên ảnh có lớp phủ — guideline mới cấm đặt lên ảnh); "Thịt chuẩn · Giá thật"; danh mục "Korean barbecue"; hashtag kbbq / buffet; giá, giảm 20 %; phòng riêng; địa chỉ, giờ cũ; "Đặt bàn ngay" thay vì "Hỏi bàn"; ảnh "có khói, có lửa"; vàng làm màu giá và nút |
| Logo Suite and Directions (đã lưu trữ) | — | Bảng màu khác (`#E23B2E`…); phông Anton, Archivo; luật logo cũ (bộ 21/10/2026: mục "Logo" ở trên); "BUTCHER · BEEF · BBQ"; hướng "Charcoal & ember"; hiệu ứng cuộn |
| Instore Art (đã lưu trữ) | — (tagline đã chốt 26/10/2026, không lấy từ đây) | Mặt tiền tầng trệt (Beeftown ở tầng 3); phòng riêng; "AGED · IMPORTED"; giờ mở cửa; "hút Gen Z" |
| `Beeftown_CRM_Design.html` | Câu đồng ý nhận tin (ô không tick sẵn, từ khóa "NGUNG"); giọng "thẳng thắn, nói rõ điều kiện lẫn quyền lợi" | Phòng riêng cho VIP; quận cũ; "mua sẵn ~90 %" |
| Dashboard (đã lưu trữ) | — (công cụ tài chính nội bộ) | Bảng màu than hồng riêng, Segoe UI, "Korean BBQ" |
| Concept Board v1 (đã lưu trữ) | — (tagline đã chốt 26/10/2026, không lấy từ đây) | Bảng màu cũ; "good beef, good price" (lấy giá làm mồi câu) |
| Bản nháp website (đã lưu trữ) | — | Bản nháp **không được phát hành** (README gốc, mục cảnh báo) |

## Tin nhắn Zalo / Messenger

- Lời bot Messenger: `CAU_BOT` trong `web/src/lib/messenger.ts` — xưng "mình", gọi "bạn", Beeftown ở
  ngôi thứ ba; luôn "Beeftown đã nhận yêu cầu", lỗi thì nói rõ "CHƯA được ghi nhận"; không số bàn trống,
  không giá.
- Mẫu tin Zalo nằm trong database (migration `0006`, `0047`); mẫu đã được Zalo duyệt không sửa tại chỗ
  được. ZBS-01 "xác nhận đặt bàn" chỉ gửi khi nhân viên bấm "Đã gọi xác nhận" — yêu cầu khách vừa gửi
  chưa nhận tin Zalo nào (migration `0063`). Tin chăm sóc kết thúc bằng cách hủy nhận tin ("NGUNG").
- Tin báo động cho chủ (`web/src/lib/bao-dong-tin.ts`): chỉ số đếm, không tên hay số điện thoại khách.
