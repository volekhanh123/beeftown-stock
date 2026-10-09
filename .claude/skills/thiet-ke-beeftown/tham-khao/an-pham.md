# Ấn phẩm ngoài web — mạng xã hội, ảnh chia sẻ, tại quán

Dùng khi làm bài đăng, story, ảnh bìa, banner, slide, landing page ngoài `web/`, hay bất kỳ hình nào
mang tên Beeftown. Luật gốc: `web/THIET-KE.md` mục 8 (brief chụp ảnh) và mục 9 (bộ campaign).

## Nguyên tắc

- **Cùng một hệ với web**: logo vector gốc, chất liệu PDF (vân mỡ, rosemary, steak, tem tròn, chữ lặp)
  đúng vai như trên web, chữ Montserrat, màu theo bảng trong `SKILL.md`.
- **Chữ trên ấn phẩm chỉ gồm**: tagline *Pick it. Grill it. Love it.*, descriptor *Beef Specialty
  Restaurant*, câu chính, "Tầng 3, 11-21 Hàm Nghi". Muốn thêm câu khác: câu đó phải đúng sự thật và
  qua được danh sách chữ cấm của web (`web/src/lib/chuoi-cam.js` áp dụng nguyên cho campaign).
- **Không ngày, không giá, không ưu đãi, không đếm ngược** khi chưa được công bố. Không câu "Thịt chuẩn
  - Giá thật". Không "Korean BBQ".
- Ảnh AI trong campaign cũng ghi **"Ảnh minh họa"**, và chỉ cho ảnh không khí món — không bao giờ cho
  quầy, khay, không gian, lối lên, con người.
- Logo chỉ đặt trên **nền đỏ, kem hoặc than**; trên ảnh chụp thì phủ lớp tối trước. Chừa khoảng trống
  quanh logo bằng chiều cao chữ "B". Không đổi màu ngoài bảng, không kéo giãn, xoay, đổ bóng.
  Đúng biến thể cho nền: `logo-ngang-do.svg` trên kem, `logo-ngang-kem.svg` trên đỏ / tối.
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

Tóm tắt `web/THIET-KE.md` mục 8 — đọc bản đầy đủ trước khi đặt lịch chụp:

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
06/10/2026. Chỉ dùng làm tư liệu, không chép màu, phông, câu chữ từ đó. Phần còn dùng được ghi rõ bên
dưới. (`Beeftown_Can_TMA.html` ở gốc repo là công cụ cân cũ, không thuộc nhóm này — `can-app/` đã thay
nó.)

| File | Còn dùng được | Lệch luật hiện hành — KHÔNG làm theo |
|---|---|---|
| `Beeftown_Bo_Nhan_Dien_So.html` | Bảng kích thước F4; luật logo F5 (nền, khoảng trống, không biến dạng); nguyên tắc trả lời đánh giá; cách đặt UTM | Phông Baloo 2; logo gõ chữ và bò nháy mắt làm avatar; "Thịt chuẩn · Giá thật"; danh mục "Korean barbecue"; hashtag kbbq / buffet; giá, giảm 20 %; phòng riêng; địa chỉ, giờ cũ; "Đặt bàn ngay" thay vì "Hỏi bàn"; ảnh "có khói, có lửa"; vàng làm màu giá và nút |
| `Beeftown_Logo_Suite_and_Directions.html` | Cỡ tối thiểu: wordmark 24px / 20mm, đầu bò 40px / 22mm | Bảng màu khác (`#E23B2E`…); phông Anton, Archivo; "BUTCHER · BEEF · BBQ"; hướng "Charcoal & ember"; hiệu ứng cuộn |
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
  được. Tin chăm sóc kết thúc bằng cách hủy nhận tin ("NGUNG").
- Tin báo động cho chủ (`web/src/lib/bao-dong-tin.ts`): chỉ số đếm, không tên hay số điện thoại khách.
