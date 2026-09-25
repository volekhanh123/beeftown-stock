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
| `Beeftown_Can_TMA.html` | Phần mềm cài hàng cho cân in tem TMA: sửa tên, giá, chữ trên tem rồi xuất file nạp vào cân qua USB. Chạy không cần mạng. |

Tất cả đều là **HTML tự chứa** — mở thẳng bằng trình duyệt, không cần cài đặt gì, không có bước build. Chỉ phụ thuộc Google Fonts và (riêng website) ảnh từ Unsplash.

---

## Phần mềm cân TMA

Cân in tem TM-A 30kg (dòng TM-xA, firmware V3.14E8) không có phần mềm đi kèm, nên `Beeftown_Can_TMA.html` thay phần việc hay dùng nhất: sửa danh sách hàng và chữ trên tem. Cách dùng có ghi ngay trên trang (3 bước: lưu từ cân ra USB → sửa → nạp lại).

Những điều đã biết về file `JHSCALE/A_000.TMS` mà cân lưu ra:

- Văn bản tách cột bằng tab, xuống dòng CRLF. Mỗi phần mở bằng `DWL<tab>TÊN` (đời cũ dùng `XD1`) và đóng bằng `END<tab>TÊN`.
- Dòng hàng `PLU`: cột 1 số PLU, 2 mã hàng (5 số, nằm trong mã vạch), 4 cách bán (1 cân ký, 2 theo gói), 5 đơn giá, 15 tên, 64 mã tìm kiếm không dấu. Các cột khác chưa rõ nghĩa, phần mềm giữ nguyên.
- Giá ghi dạng `mantissa,số-lẻ`: `845,0` = 845. Cân hiện giá theo Spec202 số lẻ (đang là 3), nên 845 hiện là `845.000`, đọc là 845.000đ. Tối đa 999.999đ vì cửa sổ đơn giá chỉ có 6 chữ số.
- Spec0 là số mẫu tem đang dùng (hiện là 28). Ô chữ số t của mẫu tem nằm ở cột `6 + t` của dòng `LAB` (từ t = 16 trở đi là `7 + t`).
- Phần `TIM` là giờ lúc lưu. Phần mềm bỏ phần này khi xuất để cân không bị chỉnh đồng hồ về giờ cũ.

Lưu ý khi sửa code phần mềm cân:

1. **Dòng không sửa phải được ghi lại y nguyên từng byte.** File được đọc dạng chuỗi byte, chỉ đổi sang UTF-8 khi hiện lên màn hình hoặc ghi chữ mới. Đừng chuyển sang đọc cả file bằng `TextDecoder`: file của một số cân có byte lỗi, đọc kiểu đó sẽ làm hỏng file.
2. **Không commit file `.TMS`** — trong đó có tên và mật khẩu WiFi của cửa hàng. `.gitignore` đã chặn.
3. Sơ đồ tem trên trang là gần đúng. Loại ô 0 là mã vạch, 3 là chữ cố định, 1 và 2 là dữ liệu; một số mã dữ liệu vẫn chưa rõ nghĩa nên hiện khung trống.
4. Sau khi sửa, kiểm tra lại: mở một file cân thật rồi xuất mà không sửa gì (bỏ tick "Giữ nguyên giờ trên cân") — file ra phải giống hệt file vào.

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
