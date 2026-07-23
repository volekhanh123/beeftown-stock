# Beeftown — Tài sản web

Website và các tài liệu thiết kế dạng web của **Beeftown** — nhà hàng BBQ bò kiểu quầy thịt tại khu Cầu Ông Lãnh, Quận 1, TP.HCM. Dự kiến khai trương 2026.

> **Repo này chỉ chứa file web.** Tài liệu kinh doanh (mô hình tài chính, nghiên cứu đối thủ, danh sách KOL, kế hoạch marketing) **cố tình không được đưa lên** — xem `.gitignore`. Khi thêm file mới, nhớ kiểm tra `git status --short` trước khi commit.

---

## Concept

Bò nhập khẩu tươi mát được pha lóc và **đóng gói sẵn theo từng phần cắt**, ghi rõ tên phần, trọng lượng và giá ngay trên gói. Khách ra quầy tự chọn phần mình thích như đi tiệm thịt, rồi mang về bàn nướng.

- **Khẩu hiệu:** Thịt chuẩn, giá thật · *Pick it – Grill it – Love it*
- **Định vị:** cao cấp vừa tầm — không phải quán bình dân, cũng không phải nhà hàng sang trọng
- **Khách mục tiêu:** gia đình và người trên 30 tuổi · dân văn phòng và tiệc công ty

---

## Các file

| File | Nội dung |
|---|---|
| `Beeftown_Website/index.html` | Website chính. Một file tự chứa, không cần build. Gồm phần đặt bàn 3 bước. |
| `Beeftown_Website/google-apps-script.gs` | Code nhận dữ liệu đặt bàn vào Google Sheet. Có hướng dẫn cài đặt ngay trong file. |
| `Beeftown_CRM_Design.html` | Thiết kế hệ thống CRM và thẻ thành viên. |
| `Beeftown_Bo_Nhan_Dien_So.html` | Bộ nhận diện trên Google Maps, Zalo OA, Facebook, Instagram, TikTok. |
| `Beeftown_Instore_Art.html` | Trang trí trong cửa hàng. |
| `Beeftown_Logo_Suite_and_Directions.html` | Bộ logo và các hướng nhận diện. |
| `Beeftown_Dashboard.html` | Bảng theo dõi chỉ số. |
| `Beeftown_Concept_Board_v1.svg` | Bảng concept tổng thể. |

Tất cả đều là **HTML tự chứa** — mở thẳng bằng trình duyệt, không cần cài đặt gì, không có bước build. Chỉ phụ thuộc Google Fonts và (riêng website) ảnh từ Unsplash.

---

## Quy tắc thiết kế

### Bảng màu

| Tên | Mã | Dùng cho |
|---|---|---|
| Beef Red | `#B23A2C` | Màu chủ đạo, nút chính |
| Cream | `#FBF4E1` | Nền sáng |
| Mustard | `#F2A900` | Điểm nhấn, giá tiền |
| Marigold | `#F5C211` | Điểm nhấn trên nền tối |
| Charcoal | `#1E160E` | Nền tối, chữ |
| Warm Stone | `#B8A98C` | Chữ phụ |

### Phông chữ

- **Montserrat** — toàn bộ tiêu đề và nội dung
- **Baloo 2** — chỉ dùng cho tên thương hiệu và khẩu hiệu
  - ⚠️ Đây là **bản thay tạm** cho *Hypo-me Bold* — phông độc quyền của thương hiệu. Cần mua bản quyền trước khi in ấn hoặc chạy quảng cáo.

### Giọng văn

Ấm áp, thẳng thắn, như một người bán thịt lành nghề. Thân thiện với gia đình và chuyên nghiệp với khách công ty.

**Nên:** nói về chất lượng tương xứng giá tiền · giải thích trải nghiệm chọn phần bò · nêu con số cụ thể

**Không nên:**
- ❌ Dùng chữ **"rẻ"** — thay bằng *hợp lý*, *xứng đáng*, *giá thật*
- ❌ Dùng tiếng lóng giới trẻ hoặc chiêu câu tương tác
- ❌ Hứa mâm banchan đầy đủ kiểu Hàn — Beeftown tập trung vào bò

---

## Lưu ý khi sửa code

Những chỗ dễ làm hỏng nếu không biết trước:

1. **Phần đặt bàn tự nhận diện số chi nhánh.** Mảng `BRANCHES` có 1 phần tử thì hiện thẻ thông tin và chọn sẵn; từ 2 phần tử trở lên tự chuyển thành nút cho khách chọn. Thêm chi nhánh chỉ cần thêm vào mảng, không phải sửa gì khác.

2. **Hàm `remainingFor()` là số bàn trống mô phỏng** — sinh ngẫu nhiên nhưng ổn định theo chi nhánh + ngày + giờ để demo. **Phải thay bằng API thật khi vận hành.**

3. **Ô đồng ý nhận tin là bắt buộc và không được tick sẵn** — yêu cầu pháp lý về dữ liệu cá nhân. Đừng bỏ thuộc tính `required` hay đặt `checked`.

4. **Form không bao giờ được "chết" trước mặt khách.** Nếu `BOOKING_ENDPOINT` chưa cấu hình hoặc mất mạng, vẫn phải hiện thông báo xác nhận. Giữ nguyên khối `try/catch` quanh `saveBooking()`.

5. **Không dùng emoji làm biểu tượng** — dùng SVG nét mảnh 1.5px cho thống nhất.

6. **Ảnh trên website hiện là ảnh minh hoạ từ Unsplash**, có ghi chú trong code. Thay bằng ảnh chụp thật trước khi công bố.

---

## Còn phải làm trước khi công bố

- [ ] Điền địa chỉ và hotline thật (hiện là `[số nhà], [tên đường]` và `0900 000 001`)
- [ ] Thay ảnh Unsplash bằng ảnh chụp thật
- [ ] Thay 4 đánh giá khách hàng minh hoạ bằng review thật từ Google Maps
- [ ] Chốt bảng giá chính thức (giá hiện tại là dự kiến, đã ghi chú trên trang)
- [ ] Nối `remainingFor()` vào hệ thống đặt bàn thật
- [ ] Cấu hình `BOOKING_ENDPOINT` theo hướng dẫn trong `google-apps-script.gs`
- [ ] Mua bản quyền phông Hypo-me cho tên thương hiệu
