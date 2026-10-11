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
| `test-cong-khai-giao-dien.mjs` | Mọi dòng `CAP_DUONG_DAN` có đủ ba file trang, mọi trang công khai nằm trong bảng · khối `:root` đầu tiên của `chung.css` giữ nguyên **13 biến cũ** (`--do`, `--do-dam`, `--kem`, `--kem-sau`, `--mu-tat`, `--cuc-vang`, `--than`, `--da`, `--muc-nhat`, `--vach`, `--vach-kem`, `--vien-o`, `--rong`), mỗi biến khai một lần — đó là bảng màu `/noi-bo` và kho đang đọc · `cong-khai.css` **chỉ** `Trang.astro` nạp; mọi bộ chọn bắt đầu bằng `.ck` hoặc `html:has(body.ck)`; chỉ `@media`, `@keyframes` (không `@import`, `@supports`, `@font-face`, `@layer`, `@container`) · SVG thương hiệu: có `viewBox`, không `<script>`, `on…=`, `<text>`, `<image>`, href ra ngoài; màu chỉ trong `BANG_MAU` (bảng màu chốt 09/10/2026 và màu pha của trang công khai) · tên file tài sản ASCII; ảnh đủ `.avif` + `.webp`, ≤ 300 KB mỗi file, ≤ 8 MB cả thư mục · tài sản được git thấy; ảnh chia sẻ đúng 1200 × 630 · **nhóm 6 — bảng màu chốt 09/10/2026 chỉ ở trang công khai**: 14 biến của khối `.ck` đầu tiên trong `cong-khai.css` đúng từng mã (`BANG_MAU_CHOT`, chép tay), mỗi biến khai một lần; không file công khai nào (trang, component, `cong-khai.css`, SVG) còn mã hex hay bộ ba số RGB của bảng cũ, kể cả trong chú thích; `theme-color` là màu kem; tương phản của hệ bề mặt đạt ngưỡng |
| `test-cong-khai-cau-chu.mjs` | Đọc mọi `{ vi, en, ko }`, chữ trong template, `alt`, `title`, `aria-label`, `placeholder`… của trang công khai: câu có vi + en thì phải có ko · không chữ cấm, không chữ "chờ duyệt / đang cập nhật / TBD / coming soon" · trang hỏi bàn, ứng tuyển, tuyển dụng không "thành công / success / 성공" · en, ko không dấu tiếng Việt (trừ tên riêng) · `t.datBan` đúng "Hỏi bàn / Ask for a table / 테이블 문의"; câu chỉ đường `t.loiLen` đúng từng chữ ở ba thứ tiếng · **nhóm 7 — địa điểm**: chữ khách đọc không ghi địa chỉ nào khác, không phường hay quận, không lối lên nào khác thang máy, không gọi là "tòa nhà", không kể chuyện đổi địa điểm, không chỗ gửi xe, lối cho xe lăn, số đo đường đi; bảng câu thử `CAU_THU` giữ cho mẫu không bắt nhầm câu đúng |
| `test-cong-khai-dia-diem.mjs` | Quét **mã nguồn** của trang công khai theo đồ thị import (kể cả chú thích, tên lớp, tên biểu tượng): không tên đường hay phường của địa chỉ khác — trừ đúng một dòng địa chỉ pháp nhân (`PHAP_NHAN.diaChi`), dòng này phải còn nguyên từng ký tự · không chữ về lối lên nào khác thang máy · ba câu chỉ đường có mặt ở trang Đến Beeftown · JSON-LD ghi `streetAddress` "Tầng 3, 63 Hồ Tùng Mậu", không tên phường · cách ghi địa điểm từng thứ tiếng; hình và biểu tượng lối lên là thang máy · không component hay layout nào gõ sẵn địa chỉ hoặc đọc thẳng `DIA_CHI_NHA_HANG` (bản công bố trong `/noi-bo` phải tới được mọi chỗ in địa chỉ) · bảng từ của máy dịch (`web/src/lib/may-dich.ts`) theo địa điểm hiện tại |
| `test-cong-khai-dinh-chu.mjs` | Quét **mọi** `.astro` dưới `web/src` ngoài khu nội bộ: không hai mẩu chữ dính nhau vì xuống dòng |
| `test-cong-khai-trang-chu.mjs` | Thứ bậc hai nút màn đầu theo trạng thái form và kênh; link chỉ http(s); địa chỉ cố định "Tầng 3, 63 Hồ Tùng Mậu, TP.HCM" và bản công bố thay vào khi có (`diaChi`, `diaChiSauTang`, `diaChiManDau`, JSON-LD — kể cả bản công bố gõ dở, số phòng "P.301"); điều hướng đúng bốn mục theo thứ tự Trải nghiệm / Thực đơn / Đến Beeftown / Hỏi bàn |
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
- **Địa điểm** (mọi trang): chân trang có "63 Hồ Tùng Mậu" kèm câu chỉ đường; trang chủ, Đến Beeftown,
  Hỏi bàn (ba thứ tiếng) in đúng từng chữ câu chỉ đường trong nội dung chính; JSON-LD ghi
  `streetAddress` "Tầng 3, 63 Hồ Tùng Mậu", không tên phường; ngoài dòng địa chỉ pháp nhân (có đúng một
  lần) cả trang không còn địa chỉ nào khác, không tên phường hay quận, không lối lên nào khác thang máy.
  Dòng pháp nhân viết cứng trong `web/kiem-tra/trinh-duyet.mjs` là chữ trên giấy đăng ký — đổi nó là
  việc Khánh quyết, không sửa trong một PR giao diện.
- Mẫu tìm chữ sai về địa điểm dùng chung cho cả ba nơi (hai kiểm thử ở `crm/test/` và trình duyệt):
  `web/kiem-tra/mau-dia-diem.mjs`, kèm bảng câu thử. Mẫu bắt nhầm một câu đúng thì sửa mẫu và thêm câu
  đó vào bảng câu thử — không gỡ luật.
- Không database: trang hỏi bàn, tuyển dụng **không có `<form>`**.
- Menu gọn ở 360px: không JavaScript vẫn mở / đóng được; có JavaScript thì Esc đóng và trả focus.

`thu-day-du.mjs` chạy với Supabase giả: bấm đúp chỉ gửi **một** yêu cầu; nút đang gửi có
`aria-busy="true"` và "Đang gửi…"; khung kết quả nhận focus; lỗi 500 giữ lại dữ liệu đã gõ; không bao
giờ "thành công"; mọi trang × ba kịch bản ở 360 và 1440px không tràn ngang. Kịch bản
`dia-chi-cong-bo`: địa chỉ đã công bố trong `/noi-bo` tới được màn đầu, khối địa chỉ, chân trang, menu
gọn và JSON-LD của cả ba thứ tiếng — không chỗ nào còn in bản trong mã; màn đầu bỏ vế phường.

## Nội bộ và kho

| Kiểm thử | Gác điều gì |
|---|---|
| `test-noi-bo-tieng-anh.mjs` | Màn CRM trong danh sách `TEP` không có chữ Việt ngoài `{ vi, en }`; câu `raise exception` mới có bản tiếng Anh; chạy cả bộ quét chữ dính. **Màn CRM mới phải tự thêm vào `TEP`** |
| `test-kho-tieng-anh.mjs` | Tự tìm mọi file kho: không chữ Việt ngoài `{ vi, en }`; hàm có tham số `nn` phải được truyền; số tiếng Anh `1.25`, `450,000 ₫`; chữ dính |
| `test-noi-bo-dieu-huong.mjs` | Thanh đáy điện thoại ≤ 5 nút; nhãn thanh đáy ≤ 10 ký tự; thanh trên xuống dòng chứ không cuộn ngang; mọi mục có vi / en; biểu tượng có trong `BIEU_TUONG` |
| `test-kho-giao-dien.mjs` | Biểu tượng kho có trong `BIEU_TUONG`; biểu tượng app cài lên điện thoại; trang kho chỉ được nạp script trong danh sách cho phép |
| Các file `test-*-web.mjs` | Nhiều trang nội bộ không được có `<script>` |

## Quy trình

- `test-quy-trinh.mjs`: file mã nguồn (`web/src`, `crm/test`, `.claude/skills/`…) bị `.gitignore` chặn
  là đỏ. `.gitignore` mở **từng** skill — skill dùng chung mới cần một dòng mở cạnh dòng của skill này;
  skill riêng của một người để ở `~/.claude/skills/`.
- `test-ky-nang-thiet-ke.mjs`: file `.md` của skill này được git thấy, cấu hình máy vẫn bị chặn; phần
  đầu `SKILL.md` đọc được bằng YAML; link giữa các file có thật; mã màu, biến CSS, đường dẫn, hai danh
  sách biểu tượng, loại của `KhungAnh`, lớp dùng chung và lớp bề mặt khớp mã. **Hai bảng token của
  `SKILL.md` so với đúng nguồn của từng bảng, hai chiều**: bảng trang công khai với khối `.ck` đầu tiên
  của `cong-khai.css`, bảng `/noi-bo` và kho với `:root` của `chung.css`; cặp token–mã ghi ngoài hai
  bảng cũng phải đúng khu của file. Địa điểm: skill chép đúng địa chỉ và ba câu chỉ đường của `chu.ts`,
  không file nào của skill nhắc tên một địa chỉ khác hay một lối lên khác thang máy. Số đo và tên hàm
  không được kiểm. PR đổi màu `/noi-bo`, kho (`THUONG-HIEU.md` mục 5) hay đổi câu chỉ đường làm test
  này đỏ cho tới khi skill đổi theo — đúng ý đồ.
- Bộ quét bí mật (`test-zalo-web`, `test-messenger-web`, `test-kho-ipos-web`, `test-doi-chieu-production`)
  đọc cả repo — trong tài liệu chỉ viết chỗ giữ chỗ, không chuỗi trông như khóa thật.

## Chưa có kiểm thử — tự giữ

- Cấm emoji làm biểu tượng.
- Chú thích "Ảnh minh họa" trên trang đã dựng (hiện chưa dựng ảnh nào).
- `KhungAnh` không chữ bên trong.
- Chữ trơn "rẻ" (máy chỉ chặn "rẻ hơn").
- Tỷ lệ màu, nhịp xen kẽ bề mặt, số điểm trang trí mỗi trang — xem ảnh chụp.
