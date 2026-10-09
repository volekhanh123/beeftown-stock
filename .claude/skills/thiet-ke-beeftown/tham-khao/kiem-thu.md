# Kiểm thử gác giao diện — cái gì đỏ khi sửa UI

Đọc trước khi đẩy một thay đổi giao diện. CI (`.github/workflows/kiem-thu.yml`) chạy mọi
`crm/test/test-*.mjs` và phần web: `astro check`, `astro build`, đóng gói thử, `npm run quet`,
`npm run thu-trinh-duyet`, `npm run thu-day-du`.

## Lệnh

```bash
cd crm && npm test                                          # toàn bộ, in tổng số kiểm tra
node test/test-cong-khai-giao-dien.mjs                      # một file
node test/dinh-chu.mjs ../web/src/components/<file>.astro   # chữ dính của một component
cd ../web && npx astro check                                # kiểu, thiếu khóa thứ tiếng, tên biểu tượng
npm run quet                                                # chữ cấm trên trang đã dựng (không database)
npm run thu-trinh-duyet                                     # trình duyệt, không database
npm run thu-day-du                                          # trình duyệt, Supabase giả: đầy đủ, bấm đúp, lỗi 500, mất mạng
npm run thu-day-du -- --chup                                # ảnh chụp 360 / 390 / 768 / 1024 / 1440 → web/kiem-tra/anh-chup/
```

Cần `npm ci` ở `web/` trước — bộ quét chữ dính đọc template bằng trình biên dịch của Astro.

## Trang công khai

| Kiểm thử | Gác điều gì |
|---|---|
| `test-cong-khai-giao-dien.mjs` | Mọi dòng `CAP_DUONG_DAN` có đủ ba file trang, mọi trang công khai nằm trong bảng · `chung.css` giữ nguyên **13 biến cũ** (`--do`, `--do-dam`, `--kem`, `--kem-sau`, `--mu-tat`, `--cuc-vang`, `--than`, `--da`, `--muc-nhat`, `--vach`, `--vach-kem`, `--vien-o`, `--rong`), mỗi biến khai một lần · `cong-khai.css` **chỉ** `Trang.astro` nạp; mọi bộ chọn bắt đầu bằng `.ck` hoặc `html:has(body.ck)`; chỉ `@media`, `@keyframes` (không `@import`, `@supports`, `@font-face`, `@layer`, `@container`) · SVG thương hiệu: có `viewBox`, không `<script>`, `on…=`, `<text>`, `<image>`, href ra ngoài; màu chỉ trong bảng PDF · tên file tài sản ASCII; ảnh đủ `.avif` + `.webp`, ≤ 300 KB mỗi file, ≤ 8 MB cả thư mục · tài sản được git thấy; ảnh chia sẻ đúng 1200 × 630 |
| `test-cong-khai-cau-chu.mjs` | Đọc mọi `{ vi, en, ko }`, chữ trong template, `alt`, `title`, `aria-label`, `placeholder`… của trang công khai: câu có vi + en thì phải có ko · không chữ cấm, không chữ "chờ duyệt / đang cập nhật / TBD / coming soon" · trang hỏi bàn, ứng tuyển, tuyển dụng không "thành công / success / 성공" · en, ko không dấu tiếng Việt (trừ tên riêng) · `t.datBan` đúng "Hỏi bàn / Ask for a table / 테이블 문의"; câu cầu thang nói rõ không thang máy |
| `test-cong-khai-dinh-chu.mjs` | Quét **mọi** `.astro` dưới `web/src` ngoài khu nội bộ: không hai mẩu chữ dính nhau vì xuống dòng |
| `test-cong-khai-trang-chu.mjs` | Thứ bậc hai nút màn đầu theo trạng thái form và kênh; link chỉ http(s); địa chỉ cố định; điều hướng đúng bốn mục theo thứ tự Trải nghiệm / Thực đơn / Đến Beeftown / Hỏi bàn |
| `test-cong-khai-thuc-don.mjs` | Chỉ hai nhãn món (Món sống, Có cồn); không giá hiện ra; giá định dạng `125.000` |
| `test-cong-khai-mat-mang.mjs` | Mất mạng: câu "KHÔNG CHẮC … đừng gửi lại", không bao giờ "CHƯA được ghi nhận" |
| `test-chuoi-cam.mjs` | Bộ lọc chữ cấm bắt được cả chữ tổ hợp, khoảng trắng ẩn, số toàn khổ; không bắt nhầm "Nướng bằng vỉ gas", "Than phiền…" |

## Trình duyệt (`web/kiem-tra/`)

`trinh-duyet.mjs` dựng trang **không database** và mở mọi trang công khai ở bảy bề rộng (360, 390, 768,
800, 1024, 1366, 1440):

- HTTP 200, đúng `lang`, không lỗi JavaScript, **không tràn ngang**.
- Đúng **một `h1`**; mọi `<img>` có `width`, `height`, `alt`; ảnh dưới màn đầu `loading="lazy"`.
- `.nut`, `nav a`, `.doi-ngon-ngu`, `summary` cao ≥ 44px.
- **Tương phản** WCAG 2.2: ≥ 4,5 : 1, chữ ≥ 24px hoặc ≥ 18,66px đậm ≥ 3 : 1 (bỏ qua nền ảnh,
  `aria-hidden`, `.an-chu`).
- Chân trang: dòng `© <năm> Beeftown · Beef Specialty Restaurant` rồi đúng hai dòng pháp nhân, chữ
  ≥ 12px.
- Trang chủ, Đến Beeftown, Hỏi bàn nói tới cầu thang bộ (ba thứ tiếng).
- Không database: trang hỏi bàn, tuyển dụng **không có `<form>`**.
- Menu gọn ở 360px: không JavaScript vẫn mở / đóng được; có JavaScript thì Esc đóng và trả focus.

`thu-day-du.mjs` chạy với Supabase giả: bấm đúp chỉ gửi **một** yêu cầu; nút đang gửi có
`aria-busy="true"` và "Đang gửi…"; khung kết quả nhận focus; lỗi 500 giữ lại dữ liệu đã gõ; không bao
giờ "thành công"; mọi trang × ba kịch bản ở 360 và 1440px không tràn ngang.

## Nội bộ và kho

| Kiểm thử | Gác điều gì |
|---|---|
| `test-noi-bo-tieng-anh.mjs` | Màn CRM trong danh sách `TEP` không có chữ Việt ngoài `{ vi, en }`; câu `raise exception` mới có bản tiếng Anh; chạy cả bộ quét chữ dính. **Màn CRM mới phải tự thêm vào `TEP`** |
| `test-kho-tieng-anh.mjs` | Tự tìm mọi file kho: không chữ Việt ngoài `{ vi, en }`; hàm có tham số `nn` phải được truyền; số tiếng Anh `1.25`, `450,000 ₫`; chữ dính |
| `test-noi-bo-dieu-huong.mjs` | Thanh đáy điện thoại ≤ 5 nút; nhãn thanh đáy ≤ 10 ký tự; thanh trên xuống dòng chứ không cuộn ngang; mọi mục có vi / en; biểu tượng có trong `BIEU_TUONG` |
| `test-kho-giao-dien.mjs` | Biểu tượng kho có trong `BIEU_TUONG`; biểu tượng app cài lên điện thoại; trang kho chỉ được nạp script trong danh sách cho phép |
| Các file `test-*-web.mjs` | Nhiều trang nội bộ không được có `<script>` |

## Quy trình

- `test-quy-trinh.mjs`: file mã nguồn (`web/src`, `crm/test`…) bị `.gitignore` chặn là đỏ. **Không**
  quét `.claude/` — skill bị chặn sẽ không ai báo; `test-ky-nang-thiet-ke.mjs` lo việc đó cho skill này.
- `test-ky-nang-thiet-ke.mjs`: skill này được git thấy, mã màu và đường dẫn trong skill khớp mã, danh
  sách biểu tượng khớp `BieuTuong.astro`.
- Bộ quét bí mật (`test-zalo-web`, `test-messenger-web`, `test-kho-ipos-web`, `test-doi-chieu-production`)
  đọc cả repo — trong tài liệu chỉ viết chỗ giữ chỗ, không chuỗi trông như khóa thật.

## Chưa có kiểm thử — tự giữ

- Cấm emoji làm biểu tượng.
- Chú thích "Ảnh minh họa" trên trang đã dựng (hiện chưa dựng ảnh nào).
- `KhungAnh` không chữ bên trong.
- Chữ trơn "rẻ" (máy chỉ chặn "rẻ hơn").
- Tỷ lệ màu, nhịp xen kẽ bề mặt, số điểm trang trí mỗi trang — xem ảnh chụp.
