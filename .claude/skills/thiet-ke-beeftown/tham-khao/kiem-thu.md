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
| `test-cong-khai-giao-dien.mjs` | Mọi dòng `CAP_DUONG_DAN` có đủ ba file trang, mọi trang công khai nằm trong bảng · khối `:root` đầu tiên của `chung.css` khai đúng **11 biến gốc** (`--do`, `--do-dam`, `--kem`, `--kem-sau`, `--than`, `--da`, `--muc-nhat`, `--vach`, `--vach-kem`, `--vien-o`, `--rong`) với giá trị của bảng 22/10/2026 (`BIEN_GOC`, chép tay), mỗi biến khai một lần — đó là bảng `/noi-bo` và kho đang đọc; hai biến vàng của bảng cũ không còn khai ở đâu (`BIEN_BO`) · `cong-khai.css` **chỉ** `Trang.astro` nạp; mọi bộ chọn bắt đầu bằng `.ck` hoặc `html:has(body.ck)`; chỉ `@media`, `@keyframes` (không `@import`, `@supports`, `@font-face`, `@layer`, `@container`) · **nhóm 3 — bộ logo 21/10/2026**: `web/public/thuong-hieu` đúng tập file (logo chính, logo phụ, brandmark, mỗi thứ ba bản đỏ / đen / trắng, `net-dau-bo.svg`, hai PNG), không file nào của bộ hình cũ; SVG có `viewBox`, không `<script>`, `on…=`, `<text>`, `<image>`, href ra ngoài; màu chỉ `#BD0000`, `#000000`, `#FFFFFF` (`BANG_MAU`) và mỗi bản đúng bộ màu của nó (bản trắng khoét đầu bò lộ nền) · tên file tài sản ASCII; ảnh đủ `.avif` + `.webp`, ≤ 300 KB mỗi file, ≤ 8 MB cả thư mục · tài sản được git thấy; ảnh chia sẻ đúng 1200 × 630 · **nhóm 6 — bảng 22/10/2026 ở trang công khai**: 12 biến của khối `.ck` đầu tiên trong `cong-khai.css` đúng từng mã (`BANG_MAU_CHOT`, chép tay), mỗi biến khai một lần; không file công khai nào (trang, component, `cong-khai.css`, SVG) còn mã hex hay bộ ba số RGB của bảng cũ, kể cả trong chú thích; `theme-color` là đen; tương phản của hệ bề mặt đạt ngưỡng · **nhóm 7 — thành phần và khung trang**: mã màu viết thẳng trong file công khai chỉ là mã 6 chữ số của bảng (`#FFFFFF` hợp lệ; `white`, `#fff`, mã trắng ngà, `color-mix` với trắng bị bắt; ngoại lệ duy nhất, ghi tên: `@media print`); ô nhập nền `var(--kem)` cao 48px; tương phản viền ô với nền ô và với thẻ form tính lại bằng công thức WCAG, khớp con số tài liệu ghi; `--co-than` 16px, h1 32 → 48px, `--rong-ck` 1200px, `--muc-dem`, `--cao-dau` 64 / 80px, `.nut` 48px đệm 20px; chân trang không `hoa-van-chu`, không tem tròn, logo `logo-ngang-trang.svg` đúng tỷ lệ 578 × 130; đầu trang, thẻ nhãn khay đúng bản logo; `BieuTuong` nét không co theo cỡ; bộ chọn ngôn ngữ nhận đủ ba thứ tiếng; nhãn nút đóng đủ ba thứ tiếng; **sau rà soát 11/10/2026**: mã hex 4 và 8 chữ số cũng phải thuộc bảng; `rgb()` / `rgba()` chỉ dùng bộ ba của bảng; không `hsl()`, `oklch()`, `color()`…, không tên màu CSS, màu hệ thống chỉ trong `forced-colors` (phép quét tự thử trên 23 cách viết màu ngoài bảng); nút, `summary`, ô nhập không khai chiều cao dưới 48px; mọi `:hover` nằm trong `@media (hover: hover)`, `:active` của nút nằm ngoài; không dùng `scrollbar-gutter` (khoá cuộn bù bề rộng thanh cuộn bằng `--rong-thanh-cuon` do script đo); lớp phủ và khoá cuộn của menu gọn gắn với `[data-co-script]`, script nghe click ngay trên `<details>`; có luật `:autofill`; không quy tắc nào đặt cỡ h1 riêng theo thứ tiếng |
| `test-cong-khai-anh.mjs` | **Ảnh, nhãn "Ảnh minh họa", thẻ đọc nhãn khay, bốn quyết định của Khánh ngày 11/10/2026, ảnh món của cuốn menu bản sáng** — đọc mã nguồn: `DANH_MUC_ANH` đúng 33 id (bảy ảnh ChatGPT, 26 ảnh món), ảnh AI nào cũng `minhHoa: true`, alt đủ vi / en / ko, tả ảnh ChatGPT tạo 11/10/2026 (không còn chữ của bộ ảnh cũ, không chữ cấm, không nói là ảnh của quán, không kể tên món phụ, không than / lửa / khói, tiếng Hàn văn 해요체) · `danh-sach.json`: nguồn đúng sự thật (ảnh món: artifact "Beeftown — Menu" Version 45; ảnh AI qua cầu nối Codex rồi tách nền, hay menu chuẩn 29/09 chưa rõ chụp thật), không khung nào đòi bề rộng lớn hơn vùng cắt của ảnh gốc (ảnh tách nền: lớn hơn khung dựng quanh cả ảnh gốc), ảnh tách nền khai `tach_nen` với dải đáy ≥ 12 % · **khung nào component gọi thì đã dựng, khung nào đã dựng thì có component gọi** (không ảnh chết), không PNG gốc trong repo · nhãn tự gắn, đủ ba thứ tiếng, chữ ≥ 13px, đọc được cả trên vùng ảnh trắng tinh (≥ 4,5 : 1, tính từ CSS); không component nào tự viết `/anh/…`; chỉ ảnh màn đầu `uuTien` · hai dải đen còn `be-toi`, "Cả bữa" còn `be-kem-dam` (nền xám nhạt), "Rủ cả nhà" còn đỏ; câu chính đúng từng chữ ở ba thứ tiếng; trang chủ đủ bảy khối theo thứ tự; hai ảnh bữa ăn ở đúng khối; Đến Beeftown vẫn là `KhungAnh` · nhãn "Ảnh minh họa" chữ trắng trên đen 78 % · thẻ nhãn khay: logo chính đỏ `logo-ngang-do.svg` (578 × 130), năm trường theo thứ tự, tên trường chép tay ba thứ tiếng, không con số, không mã vạch giả, không `transform`, không `box-shadow`, không mã màu viết thẳng · **nhóm 7 — ảnh món**: `ANH_CUA_MON` ghép đúng 25 mã món của bảng danh mục với ảnh, khung đã dựng; cờ `tachNen`; khung `.tach-nen` trong suốt, nhãn của nó chỉ đổi chỗ; chỉ `ThucDonNhomAnh.astro` gọi `<Anh>` bằng biểu thức (`id={x.id} khung={x.khung}`), và chỉ trang Thực đơn dùng nó. **Thêm ảnh hay đổi khung thì sửa các danh sách chép tay ở đầu file** |
| `test-cong-khai-cau-chu.mjs` | Đọc mọi `{ vi, en, ko }`, chữ trong template, `alt`, `title`, `aria-label`, `placeholder`… của trang công khai: câu có vi + en thì phải có ko · không chữ cấm, không chữ "chờ duyệt / đang cập nhật / TBD / coming soon" · trang hỏi bàn, ứng tuyển, tuyển dụng không "thành công / success / 성공" · en, ko không dấu tiếng Việt (trừ tên riêng) · `t.datBan` đúng "Hỏi bàn / Ask for a table / 테이블 문의"; câu chỉ đường `t.loiLen` đúng từng chữ ở ba thứ tiếng · **nhóm 7 — địa điểm**: chữ khách đọc không ghi địa chỉ nào khác, không phường hay quận, không lối lên nào khác thang máy, không gọi là "tòa nhà", không kể chuyện đổi địa điểm, không chỗ gửi xe, lối cho xe lăn, số đo đường đi; bảng câu thử `CAU_THU` giữ cho mẫu không bắt nhầm câu đúng |
| `test-cong-khai-dia-diem.mjs` | Quét **mã nguồn** của trang công khai theo đồ thị import (kể cả chú thích, tên lớp, tên biểu tượng): không tên đường hay phường của địa chỉ khác — trừ đúng một dòng địa chỉ pháp nhân (`PHAP_NHAN.diaChi`), dòng này phải còn nguyên từng ký tự · không chữ về lối lên nào khác thang máy · ba câu chỉ đường có mặt ở trang Đến Beeftown · JSON-LD ghi `streetAddress` "Tầng 3, 63 Hồ Tùng Mậu", không tên phường · cách ghi địa điểm từng thứ tiếng; hình và biểu tượng lối lên là thang máy · không component hay layout nào gõ sẵn địa chỉ hoặc đọc thẳng `DIA_CHI_NHA_HANG` (bản công bố trong `/noi-bo` phải tới được mọi chỗ in địa chỉ) · bảng từ của máy dịch (`web/src/lib/may-dich.ts`) theo địa điểm hiện tại |
| `test-cong-khai-dinh-chu.mjs` | Quét **mọi** `.astro` dưới `web/src` ngoài khu nội bộ: không hai mẩu chữ dính nhau vì xuống dòng |
| `test-cong-khai-trang-chu.mjs` | Thứ bậc hai nút màn đầu theo trạng thái form và kênh; link chỉ http(s); địa chỉ cố định "Tầng 3, 63 Hồ Tùng Mậu, TP.HCM" và bản công bố thay vào khi có (`diaChi`, `diaChiSauTang`, `diaChiManDau`, JSON-LD — kể cả bản công bố gõ dở, số phòng "P.301"); điều hướng đúng bốn mục theo thứ tự Trải nghiệm / Thực đơn / Đến Beeftown / Hỏi bàn (năm mục khi trang Mua thịt về mở: `test-cong-khai-mua-thit-dieu-huong.mjs`) |
| `test-cong-khai-mua-thit-dieu-huong.mjs` | **Trang Mua thịt về, phần ngoài component**: đích đặt hàng (`dich-dat-hang.ts`) chỉ nhận link `https://zalo.me/<mã>` (cùng mẫu `la_link_zalo_oa()` của database), `linkGuiDon` giữ chữ ký cho PR đổi sang Mini App, chữ `CHU_DICH` đủ ba thứ tiếng, không chữ cấm, không "thành công"; file chỉ `import type`; chú thích đầu file ghi quyết định 26/10/2026 và việc của PR đổi sang Mini App · `muaThitVeMo` đúng bảng chân trị (công tắc hiệu lực của database × link) · điều hướng bốn mục khi chưa mở, năm khi mở (Mua thịt về ngay sau Thực đơn, Hỏi bàn vẫn cuối) · dòng `CAP_DUONG_DAN` ngay sau `/thuc-don`, ba file vỏ đọc nội dung và menu song song · mô tả trang "chưa mở" không hứa gửi đơn · mục tin đơn qua Zalo ở ba trang quyền riêng tư và ba trang xóa dữ liệu |
| `test-cong-khai-mua-thit-ve.mjs` | Đọc mã nguồn `TrangMuaThitVe.astro`, `MuaThitThe.astro`: form GET thật chỉ ở trạng thái mở; "chưa mở" chỉ h1, một câu, link Xem thực đơn — không câu mời nhắn, không nút kênh · nút gửi chỉ qua `linkGuiDon` / `CHU_DICH`, không chữ "zalo.me" trong component; đích xuống script bằng một `data-dich` · mọi số tiền chỉ qua `dinhDangTien` trong phần tử `data-tien`; không giá theo kg hay 100 g · không ô chữ, điện thoại, email, radio, checkbox; không `<img>` · đúng hai vùng thông báo (`aria-live` của tạm tính, `role="status"` của câu chép) · nút chỉ chạy nhờ JavaScript ra trang với `hidden`, mỗi component có `[hidden] { display: none !important; }` · hỏi đáp `div.cau-hoi > details`; giao tận nơi chỉ khi đã công bố |
| `test-mua-thit-ve-web.mjs` | Thư viện của trang Mua thịt về (`don-mua-thit.ts`, `mua-thit-ve.ts`): đọc menu không bao giờ ném (lỗi, ném, hết giờ, thân hỏng → trạng thái lỗi, một dòng log) · lớp chặn thứ hai (chữ cấm, ngoặc vuông, giá hỏng) · tiền "400.000 đ" ở mọi thứ tiếng, số gam không dấu ngăn, nhãn "Gói khoảng 200 g" · ô số gói chỉ nhận 0–10 ("1.000", "1,5" bị bỏ) · tin đơn tiếng Việt, không mã đơn, gửi hai lần ra hai tin giống hệt · giờ soạn theo giờ Việt Nam · trạng thái trang |
| `test-mua-thit-ve.mjs` | Database của Mua thịt về (migration 0101): hàm công khai `mua_thit_ve_cong_khai` (11 cột, giá gói là giá đã chốt), `zalo_oa_url` chỉ chủ và chỉ nhận `https://zalo.me/…`, công tắc hiệu lực trong `noi_dung_cong_khai`; nhóm 9 so `la_link_zalo_oa()` với `laLinkZaloOa()` của web trên một bảng mẫu |
| `test-cong-khai-quet-gia.mjs` | Bộ quét chữ cấm chỉ miễn số tiền dạng "400.000 đ" trong phần tử `data-tien` trên ba đường dẫn Mua thịt về (`chu-hien-ra.mjs`); số tiền ngoài `data-tien`, ở trang khác, hay dạng khác vẫn bị báo |
| `test-cong-khai-thuc-don.mjs` | Chỉ hai nhãn món (Món sống, Có cồn); không giá hiện ra; giá định dạng `125.000` |
| `test-cong-khai-mat-mang.mjs` | Mất mạng: câu "KHÔNG CHẮC … đừng gửi lại", không bao giờ "CHƯA được ghi nhận" |
| `test-chuoi-cam.mjs` | Bộ lọc chữ cấm bắt được cả chữ tổ hợp, khoảng trắng ẩn, số toàn khổ; không bắt nhầm "Nướng bằng vỉ gas", "Than phiền…", tagline "Pick it, grill it, love it!" |
| `test-cong-khai-nhan-dien.mjs` | **Bộ nhận diện 21/10/2026 trên toàn repo** (trang, CSS, kiểm thử trình duyệt, công cụ, skill, tài liệu — trừ `THUONG-HIEU.md`): không còn **tham chiếu** tới hình bộ cũ (giá trị của `src=`, `href=`, `url(`, `class=`, `--hinh:` và đường dẫn `/thuong-hieu/<tên cũ>` — chữ trong câu như "không `hoa-van-chu`" không bị bắt) · mọi đường dẫn `/thuong-hieu/<file>` có file · đầu trang `/noi-bo`, kho và trang in dùng logo, không gõ chữ BEEFTOWN bằng phông · tagline đúng chữ ở `chu.ts`, máy dịch, mọi trang và tài liệu; dải tagline của màn đầu tách vế theo dấu câu · không tài liệu, công cụ nào còn mã của bảng 09/10/2026 hay tám màu trạng thái |

## Trình duyệt (`web/kiem-tra/`)

`trinh-duyet.mjs` dựng trang **không database** và mở mọi trang công khai ở chín bề rộng (320, 360, 390,
430, 768, 800, 1024, 1366, 1440 — 320px là điện thoại nhỏ nhất và cũng là máy tính phóng to 400 %; 430px
là điện thoại rộng nhất, nơi lề `--le` đã lớn hơn 20px):

- HTTP 200, đúng `lang`, không lỗi JavaScript, **không tràn ngang**.
- Đúng **một `h1`**; mọi `<img>` có `width`, `height`, `alt`; ảnh dưới màn đầu `loading="lazy"`.
- **Thành phần và khung trang** — mười lăm phép đo của `web/kiem-tra/do-giao-dien.mjs`, chạy trong trang
  (dùng chung với `thu-day-du.mjs`), bảng màu chép tay trong file đó, không ngoại lệ nào:
  - `vungCham`: `.nut`, `nav a`, link chân trang, `.doi-ngon-ngu`, `summary`, `.lien-ket`, logo đầu trang,
    tab, ô nhập, ô chọn, ô chọn giờ, hàng ô đánh dấu cao **≥ 48px**.
  - `dauTrang`: cao 64px (dưới 1080px) / 80px, rộng hết cửa sổ (trang không chừa dải trống bên phải);
    nền đen; điều hướng 15–16px; logo phụ trắng `chu-beeftown-trang.svg` ≥ 148px (≥ 176px từ 1080px;
    dưới 360px: brandmark trắng `dau-bo-trang.svg` ≥ 48px), không kéo giãn; từ 768px nút Hỏi bàn ở ngay trên thanh.
  - `ngonNgu`: đủ vi, en, ko theo thứ tự; đúng một mục `aria-current="true"` trùng `lang` của trang, mục
    đó đậm hơn và có nét gạch, các mục khác là link có `hreflang`; chữ ≥ 14px.
  - `nenTrongBang`: màu nền của mọi phần tử thuộc bảng 22/10/2026, `html` và `body` nền trắng — đọc cả `background-color`, màu trong
    `background-image` (dải màu) và nền của phần tử giả `::before` / `::after`; ô đánh dấu còn hiện phải
    là ô tự vẽ. Không ngoại lệ: thẻ nhãn khay và nền chờ của khung ảnh cũng phải là màu của bảng.
  - `nut`: bo 4px, đệm ngang 20px (`.nut-nho` ≥ 16px), chữ ≥ 15px; màu nút chính và nút phụ đúng theo bề
    mặt; mỗi `.hang-nut` ≤ 1 nút chính.
  - `the`: `.the`, `.hb-the`, `.lt3-gon` nền trắng hoặc `#F4F4F4`, đệm 20 / 24px, có viền, không bóng đổ;
    thẻ cùng màu với nền phía sau thì viền phải tương phản với nền đó ≥ 1,35 : 1.
  - `cauHoi`: mỗi `summary` cao ≥ 56px, rộng bằng khối, có biểu tượng.
  - `bieuTuong`: cỡ 24px (kể cả biểu tượng của nhãn món), nét 1,5–2px không co theo cỡ, đỏ trên nền
    sáng / trắng trên đỏ / trắng hoặc đỏ trên đen, nằm trong thứ bấm được thì có nhãn chữ.
  - `chu`: chỉ Montserrat; chữ chạy 16/24px; h1 32/38px (tới 390px) và 48/56px (từ 1366px), ở giữa
    32–48px với dòng cao 1,17 lần; tiếng Hàn cùng cỡ, dòng 1,28 (32/41 và 48/61px) — không ngoại lệ nào
    về cỡ; h2 nhỏ hơn h1; `.khung` ≤ 1200px, lề điện thoại đúng `clamp(20px, 5vw, 40px)` (20px tới màn
    400px, 21,5px ở 430px — hằng `LE` chép tay trong file); đệm `.muc` 48–64px / 72–96px.
  - `chanTrang`: hai dải đen (dải chính và dải pháp nhân), logo chính trắng `logo-ngang-trang.svg`
    ≥ 160px đúng tỷ lệ 579 / 131, không `.hoa-van-chu`, không tem, chữ ≥ 14px, điện thoại hai
    nhóm link thành 2 cột.
  - `anh`: mọi `<img>` trỏ vào `/anh/` nằm trong `figure.anh`; ảnh AI (danh sách id chép tay) có nhãn
    đúng chữ của thứ tiếng, hiện ra, nằm trong khung, chữ ≥ 13px, ≥ 4,5 : 1 trên vùng ảnh sáng nhất;
    ảnh tách nền: vẽ ảnh lên canvas đúng cỡ khung, **0 điểm ảnh đặc (độ đục ≥ 50 %) dưới nhãn** — nhãn
    không che món; không bóng đổ, không xoay; khung đúng tỷ lệ của file; **không phần tử nào đè lên ảnh** (hỏi trình
    duyệt phần tử trên cùng ở năm điểm); mỗi trang nhiều nhất một ảnh tải ngay, có `fetchpriority="high"`,
    thuộc màn đầu trang chủ.
  - `nhanKhay` (trang chủ, Thực đơn): đúng một thẻ `.nk-the`, không `aria-hidden`, năm
    dòng đúng tên trường của thứ tiếng theo thứ tự, chữ số trong thẻ chỉ gồm số thứ tự và "100g", không
    nghiêng, không bóng, nền trắng hoặc `#F4F4F4`, viền 1–2px, rộng ≥ 640px trên máy tính, tên trường
    ≥ 16px đậm, logo chính đỏ `logo-ngang-do.svg` ≥ 160px đúng tỷ lệ.
  - `trangChu`: tám khối đúng thứ tự, bề mặt giữ nguyên (quầy đen, cả bữa xám nhạt `.be-kem-dam`, đi nhóm đỏ), khối sáng trắng / F4; câu
    chính đúng từng chữ; ảnh màn đầu tải ngay và nằm trong màn hình đầu; dưới 900px câu chính → mô tả →
    hai nút → ảnh → dòng địa điểm (dưới 360px ảnh ngay sau câu chính); từ 900px ảnh ở cột phải rộng
    ≥ 45 % khung, khối hình cao 60–140 % cột chữ, hai tâm lệch ≤ 8px, dòng địa điểm trải dưới cả hai
    cột; hàng thông tin: câu chỉ đường dính ngay dưới dòng địa chỉ (cách đáy địa chỉ −10 đến 8px) và thẳng
    mép trái với chữ địa chỉ ở mọi trạng thái, ngày mở nằm trên một dòng (từ 900px cả dòng "… từ <ngày>"
    một dòng, đứng trên dòng trạng thái), các ô không đè nhau, không ra ngoài khung; tagline "Pick it,
    grill it, love it!" là dải đỏ ≤ 72px, chữ trắng, không đè lên ảnh, có `aria-hidden="true"` — chữ trình đọc màn hình đọc được
    ở màn đầu và khối ba bước chứa tagline đúng **một** lần; ba bước xếp dọc cách 16–32px trên
    điện thoại, ba cột trên máy tính, số không quá 3,6 lần tiêu đề; "Cả bữa": nút sát đoạn giới thiệu,
    trước danh sách; "Đi nhóm": ảnh thay hình vẽ, nút ngay sau đoạn giải thích, không hoa văn chồng ảnh.
  - `thucDon`: "Bò tại quầy" nền đen, có ảnh `bo-cat-lat` và thẻ nhãn khay, không khung vẽ khay;
    "Món ăn" chưa có món thì có ảnh `sot-cham`, đã có món thì không; "Đồ uống" có ảnh `uong-khong-con-ba-ly`;
    không phần tử giá; tên nhóm kiểu cuốn ≥ 28px, không to hơn h1, chữ hoa đậm 800; thẻ món không tràn chữ,
    ảnh trên chữ (món dẫn đầu từ 768px: ảnh bên phải chữ); dưới 600px món đứng sau món dẫn đầu của nhóm
    món ăn là hàng gọn — ảnh 112–128px bên trái chữ, cùng mép trên, nhãn ảnh một dòng trong 20 % đáy
    khung; nhóm không có món dẫn đầu giữ thẻ ảnh trên chữ; "Đồ uống" đã công bố mà toàn món có cồn thì có
    tên nhóm không cồn (`.td-danh-muc`); mục của thanh chọn phần cao ≥ 48px.
  - `logoDungNen`: logo bộ 21/10/2026 đúng bản cho nền (bản trắng trên đen / đỏ, bản đỏ / đen trên nền
    sáng), không đặt trên ảnh, không kéo giãn; logo chính ≥ 160px, brandmark ≥ 48px (luật giữ từ bộ
    09/10/2026); không còn lớp hay nền / mặt nạ của hình bộ cũ.
- **Tương phản** WCAG 2.2: ≥ 4,5 : 1, chữ ≥ 24px hoặc ≥ 18,66px đậm ≥ 3 : 1 (bỏ qua nền ảnh,
  `aria-hidden`, `.an-chu`).
- Chân trang: dòng `© <năm> Beeftown · Beef Specialty Restaurant` rồi đúng hai dòng pháp nhân, chữ
  ≥ 14px.
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
- Menu gọn ở 320, 360 và 768px: không JavaScript vẫn mở / đóng được; đang mở thì nút ghi "Đóng" / "Close" /
  "닫기", dưới 768px trong bảng có Hỏi bàn là nút chính và bộ chọn ba thứ tiếng (từ 768px hai thứ đó ở trên
  thanh, bảng không lặp lại); có JavaScript thì Esc đóng và trả focus, Enter mở / đóng, Tab đi qua từng
  mục với vòng focus ≥ 2px, Tab ra khỏi mục cuối thì đóng. Có JavaScript: đang mở thì có lớp phủ tối
  (con trỏ bàn tay) và lăn chuột không cuộn được trang; đóng bằng Esc, bằng nút đóng, bằng cách bấm vào
  lớp phủ thì trang cuộn lại được. Tắt JavaScript: không lớp phủ, không khoá cuộn, bấm link neo trong
  bảng xong trang vẫn cuộn được.
- Câu hỏi thường gặp ở 390 và 1440px: Enter mở, phím cách đóng, Tab sang câu kế có vòng focus, bấm ở
  mép phải của hàng cũng mở.
- **Màn cảm ứng** (nhóm 7; Playwright `hasTouch` → `(hover: none)`): con trỏ ở trên nút, link, hàng câu
  hỏi mà kiểu không đổi; chạm mở rồi chạm đóng nút danh mục thì nút về màu lúc đóng; máy có chuột vẫn
  đổi kiểu khi di chuột; nút đổi màu nền khi đang nhấn (`:active`) ở cả hai loại máy.
- **Thanh cuộn kiểu cổ điển** (nhóm 8; mở riêng một Chromium không giấu thanh cuộn) ở 800, 1024,
  1440px: mở danh mục thì logo, cụm nút bên phải và khung nội dung đứng nguyên chỗ, không cuộn ngang,
  phần bù bằng đúng bề rộng thanh cuộn; đóng lại thì hết phần bù; khung nội dung cân giữa.
- **Trang không có (404)** (nhóm 9) ở 360 và 1366px, đường dẫn lạ dưới `/`, `/en/`, `/ko/`: mã 404,
  `lang` theo tiền tố, link về ba trang chủ, chân trang công khai, `noindex`, không canonical / hreflang /
  JSON-LD — và **đủ mười lăm phép đo** của `do-giao-dien.mjs` như mọi trang công khai (`pages/404.astro`
  dùng `Trang.astro`, `.mo-dau-trang`, `.hang-nut`, `.nut`; không có ảnh). Sửa thành phần chung thì trang
  404 đổi theo.
- **Ảnh về chậm** (nhóm 10) ở 390, 768, 1440px trên `/`, `/ko`, `/thuc-don`: giữ mọi file `/anh/` lại,
  đo từng khung ảnh; thả ra, cuộn hết trang, đo lại — khung nào cũng đứng nguyên chỗ, nguyên cỡ (trang
  không xô lệch khi ảnh về); mọi ảnh đang hiện tải về được; mỗi ảnh dùng đúng khung của cỡ màn hình
  (bảng `KHUNG_MONG` chép tay). Đừng dùng `document.fonts.ready` ở đây: Chromium giữ lời hứa đó tới
  khi trang tải xong, mà ảnh màn đầu đang bị giữ lại.
- **Tab của trang Thực đơn** (nhóm 11) ở 390 và 1440px, ba thứ tiếng: lúc tải trang chỉ tab đầu hiện và
  `do-giao-dien.mjs` bỏ qua ảnh đang ẩn, nên nhóm 1 không bao giờ đo ảnh `sot-cham` của tab "Món ăn" (và
  `uong-khong-con-ba-ly` của tab "Đồ uống").
  Nhóm này bấm từng tab (Món ăn → Đồ uống → Bò tại quầy), chờ ảnh lazy của phần vừa mở tải xong rồi gọi
  lại `doGiaoDien`: đúng phần đó hiện, đúng ảnh của nó (bảng `ANH_CUA_PHAN` chép tay), phép đo `anh` và
  mười bốn phép đo còn lại đều đạt; rồi **giấu nhãn "Ảnh minh họa" của ảnh trong phần vừa mở — phép đo
  `anh` phải đỏ** (chứng minh phép đo có nhìn thấy ảnh của tab đó). Thêm ảnh vào một tab: sửa `ANH_CUA_PHAN`.

`thu-day-du.mjs` chạy với Supabase giả: bấm đúp chỉ gửi **một** yêu cầu; nút đang gửi có
`aria-busy="true"` và "Đang gửi…"; khung kết quả nhận focus; lỗi 500 giữ lại dữ liệu đã gõ; không bao
giờ "thành công"; mọi trang × ba kịch bản ở 360 và 1440px không tràn ngang và qua đủ mười lăm phép đo
của `do-giao-dien.mjs` (kịch bản `day-du` có món mang nhãn Món sống / Có cồn — biểu tượng nhãn món 24px
được đo ở đó). **Nhóm 8 — thành phần của form** (390 và 1440px): form hỏi bàn và form nộp hồ sơ
(kịch bản `tuyen-dung-mo` của `gia-supabase.mjs` trả hai tin mẫu) — ô một dòng (kể cả ô ngày) cao
đúng 48px, ô nhiều dòng ≥ 48px, chữ 16px, nền trắng, viền 1px `#767676`; nhãn 14–16px nằm trên ô, không `placeholder`; thẻ form nền
`#F4F4F4`; ô giờ chưa chọn nền trắng, đang chọn nền đỏ chữ trắng; gửi thiếu thì hai câu lỗi màu
`#8F0000`, tiêu điểm vào ô sai đầu tiên. Kịch bản
`tuyen-dung-mo` / `tuyen-dung-dut` / `tuyen-dung-loi` (nhóm 9): form nộp hồ sơ bấm đúp chỉ gửi một
hồ sơ; mạng đứt thì khung "không chắc", không dựng form, không nút mời nộp; database từ chối thì quay về
`?vi_tri=` và điền lại chữ đã gõ, ô đồng ý không tích sẵn; file CV quá 5MB báo sát ô, không gửi. Kịch bản
`dia-chi-cong-bo`: địa chỉ đã công bố trong `/noi-bo` tới được màn đầu, khối địa chỉ, chân trang, menu
gọn và JSON-LD của cả ba thứ tiếng — không chỗ nào còn in bản trong mã; màn đầu bỏ vế phường.
**Nhóm 9 — màn đầu trang chủ theo ngày khai trương** (390, 900, 1024, 1440px × vi / en / ko): ba trạng
thái của khóa `ngay_khai_truong` — chưa có ngày (`day-du`), sắp mở (`sap-mo`: ngày 13/11 kế tiếp, "Đón
bạn từ …"), đã mở (`da-mo`: 01/10/2026, "Mở cửa từ …"); hai kịch bản sau kèm `dong_trang_thai` dài hai
câu. Mỗi trạng thái: dòng ngày đúng chữ, câu chỉ đường nguyên văn và dính ngay dưới dòng địa chỉ, ngày
trên một dòng, không ô nào của hàng thông tin tràn khung, không cuộn ngang, đủ mười lăm phép đo. CI
không có database nên `trinh-duyet.mjs` chỉ thấy trạng thái chưa có ngày — sửa hàng thông tin của màn
đầu thì chạy `npm run thu-day-du -- --chi 9`. **Nhóm 11 — trang Thực đơn theo cuốn menu bản sáng**: kịch bản
`day-du` trả đúng danh mục 11/10/2026 đã công bố (`MON_MAU`: 22 món ăn kể cả S01, ba ly signature, chữ
nguyên văn, giá null); bấm từng tab ở 320 / 360 / 390 / 430 / 768 / 1024 / 1440px (en, ko ở 390 và 1440):
mọi món hiện đúng tên ở đúng phần, món có ảnh (`ANH_CUA_MON`) thì ảnh đúng, alt đúng thứ tiếng, nhãn đang
hiện; món sống có nhãn và câu cảnh báo; câu dưới tên nhóm đúng `CAU_NHOM`; không phần tử giá, không số tiền;
không cuộn ngang; đủ mười lăm phép đo trên từng tab. `khong-con-tat`: ba ly signature, nhãn Có cồn, dòng luật
rượu không hiện. `thuc-don-thu-suc` (`MON_THU_SUC`): món không ảnh, tên và mô tả rất dài, nhóm mã lạ chưa có
câu, nhóm đồ uống dạng danh sách. `day-du` chỉ có ba ly signature (có cồn) ở Đồ uống: tên ba nhóm không cồn
phải đứng đầu cột thực đơn, cạnh ảnh ba ly không cồn; có món không cồn thì không. Sửa thẻ món thì chạy
`npm run thu-day-du -- --chi 11`.

## Nội bộ và kho

| Kiểm thử | Gác điều gì |
|---|---|
| `test-noi-bo-bang-mau.mjs` | **Bảng màu của `/noi-bo` và kho** (mã chép tay, không đọc từ CSS) · nhóm 1: hai khối `:root` của `chung.css` khai đúng 12 biến màu của bảng 22/10/2026, mỗi biến một lần, không thêm biến màu nào; khối `.ck` của `cong-khai.css` cùng giá trị · nhóm 2: hai bề mặt (`--nb-nen` xám nhạt, `--nb-the` trắng) khai một lần trên `.nb-than`; tám biến trạng thái cũ và hai biến vàng không còn khai ở đâu; token `--kho-…` chỉ trỏ về biến; mọi biến dùng trong file nội bộ đều có khai, không `var()` nào kèm mã màu dự phòng · nhóm 3: không file nội bộ nào (bốn file CSS, trang, component, layout, `web/src/lib`, manifest và script của kho) còn mã hex hay bộ ba số RGB của bảng cũ, kể cả trong chú thích; màu viết cứng chỉ là mã 6 chữ số của bảng, bộ ba trong `rgb()` / `rgba()` chỉ của đen, trắng, đỏ, đỏ đậm — không tên màu CSS, không mã 3 chữ số, không `hsl()` / `oklch()`…, không màu hệ thống ngoài tương phản cao (bộ quét chung `crm/test/mau-css.mjs`, cùng trang công khai); `@media print` chỉ đen, trắng, xám, và khi in nền xám nhạt về trắng, ô đánh dấu trả về ô của hệ thống · nhóm 4: ô của trình duyệt dùng token — ô nhập không lớp riêng, ô tự điền, ô đánh dấu và ô chọn một tự vẽ (tương phản cao trả về ô của hệ thống), nút "Chọn tệp", `<dialog>`, `<fieldset>`, `<progress>`; chữ gợi ý `--muc-nhat`; ô nhập có lớp riêng nền trắng; không `accent-color` ngoài bản in · nhóm 5: tương phản của các cặp chữ / nền (thẻ trắng, nền `#F4F4F4`, nhãn E2), viền ô nhập và nút phụ, đèn, vòng focus; không chữ đỏ thường hay `#555555` trên nền đen; E2 không làm chữ trên nền sáng · nhóm 6: `theme-color`, manifest của kho, trang báo quá tải (`web/src/lib/qua-tai.ts`) · **nhóm 7 — trạng thái không chỉ khác bằng màu**: các họ trạng thái (`.nb-nhan`, `.nb-bao`, `.kho-han`, `.kho-o-so`, `.kho-the-so`, `.dm-chip`, đèn sức khỏe…) mỗi cặp khác nhau ở dấu, nét, hình, nền đặc / rỗng hay đảo chữ; có mẫu tự kiểm. **Thêm một màu: thêm vào `THUONG-HIEU.md` và bảng chép tay ở đầu file này** |
| `test-noi-bo-trang-thai.mjs` | **Markup và câu trạng thái** của `/noi-bo` và kho: nhãn hạn có chữ ("Hết hạn", "Sắp hết hạn", "Còn hạn" — `chuTinhTrangHan`); thuộc tính dùng `.thong-tin`, lưu ý dùng `.luu-y`, không mang dấu của trạng thái; câu thay cho màu (vượt ngưỡng, "(bạn)", thu hồi thấp, quá giờ, chữ của khung iPOS); không câu nào gọi trạng thái bằng xanh / vàng / green / yellow; hủy, tắt không vẽ bằng độ mờ |
| `test-noi-bo-tieng-anh.mjs` | Màn CRM trong danh sách `TEP` không có chữ Việt ngoài `{ vi, en }`; câu `raise exception` mới có bản tiếng Anh; chạy cả bộ quét chữ dính. **Màn CRM mới phải tự thêm vào `TEP`** |
| `test-kho-tieng-anh.mjs` | Tự tìm mọi file kho: không chữ Việt ngoài `{ vi, en }`; hàm có tham số `nn` phải được truyền; số tiếng Anh `1.25`, `450,000 ₫`; chữ dính |
| `test-noi-bo-dieu-huong.mjs` | Thanh đáy điện thoại ≤ 5 nút; nhãn thanh đáy ≤ 10 ký tự; thanh trên xuống dòng chứ không cuộn ngang; mọi mục có vi / en; biểu tượng có trong `BIEU_TUONG` |
| `test-kho-giao-dien.mjs` | Biểu tượng kho có trong `BIEU_TUONG`; biểu tượng app cài lên điện thoại (cỡ, phủ kín, vùng an toàn; góc của maskable-512 và hai bản 180 là đỏ của bảng, mọi điểm đục nằm giữa đỏ và trắng — không còn màu của bảng cũ); trang kho chỉ được nạp script trong danh sách cho phép |
| Các file `test-*-web.mjs` | Nhiều trang nội bộ không được có `<script>` |

## Quy trình

- `test-quy-trinh.mjs`: file mã nguồn (`web/src`, `crm/test`, `.claude/skills/`…) bị `.gitignore` chặn
  là đỏ. `.gitignore` mở **từng** skill — skill dùng chung mới cần một dòng mở cạnh dòng của skill này;
  skill riêng của một người để ở `~/.claude/skills/`.
- `test-ky-nang-thiet-ke.mjs`: file `.md` của skill này được git thấy, cấu hình máy vẫn bị chặn; phần
  đầu `SKILL.md` đọc được bằng YAML; link giữa các file có thật; mã màu, biến CSS, đường dẫn, hai danh
  sách biểu tượng, loại của `KhungAnh`, lớp dùng chung và lớp bề mặt khớp mã. **Bảng "Token màu của
  website" của `SKILL.md` so hai chiều với cả hai nơi khai**: khối `.ck` đầu tiên của `cong-khai.css`
  và `:root` của `chung.css` — hai nơi phải cùng bộ biến, cùng giá trị; cặp token–mã ghi ở bất kỳ file
  nào của skill cũng phải đúng mã đó; tên màu Đỏ / Đen / Trắng đứng trước một mã phải đúng mã của `--do` /
  `--than` / `--kem`; skill không ghi mã nào của bảng cũ, kể cả bảng 09/10/2026 (lịch sử chỉ ở
  `THUONG-HIEU.md`); tên file logo nhắc trong skill có thật; tagline đúng chữ của `chu.ts`. Địa điểm: skill chép đúng
  địa chỉ và ba câu chỉ đường của `chu.ts`, không file nào của skill nhắc tên một địa chỉ khác hay một
  lối lên khác thang máy. Số đo và tên hàm không được kiểm. PR đổi một mã màu hay đổi câu chỉ đường
  làm test này đỏ cho tới khi skill đổi theo — đúng ý đồ.
- Bộ quét bí mật (`test-zalo-web`, `test-messenger-web`, `test-kho-ipos-web`, `test-doi-chieu-production`)
  đọc cả repo — trong tài liệu chỉ viết chỗ giữ chỗ, không chuỗi trông như khóa thật.

## Chưa có kiểm thử — tự giữ

- Cấm emoji làm biểu tượng.
- **Nhãn của ảnh tách nền** có nằm dưới món thật không (kiểm thử chỉ giữ dải đáy ≥ 12 % và không phần tử
  nào đè lên ảnh — món to bất thường trong khung thì nhãn vẫn có thể chạm bóng đổ): xem ảnh chụp ở 600px
  (thẻ hai cột hẹp nhất) và 390px.
- **Nội dung của ảnh**: ảnh AI có lỡ cho thấy mặt người, quầy, khay, chữ, logo, than, lửa không; vân mỡ
  có đẹp hơn thịt quán bán không; ảnh đã cắt có mất món chính, cắt ngang bàn tay không — mở từng file
  trong `web/public/anh/` mà xem. Kiểm thử chỉ giữ: nhãn có mặt, alt không nói sai, khung đúng tỷ lệ.
- Hai cột màn đầu "cân" tới đâu, ảnh có hợp chỗ không — kiểm thử chỉ đo tỷ lệ chiều cao và độ lệch tâm.
- `KhungAnh` không chữ bên trong.
- Chữ trơn "rẻ" (máy chỉ chặn "rẻ hơn").
- Phần của mỗi màu, nhịp xen kẽ bề mặt — xem ảnh chụp.
- Màu của nút, link khi di chuột có đẹp không (kiểm thử chỉ đo: máy có chuột thì kiểu có đổi, màn cảm
  ứng thì không; tương phản của trạng thái di chuột tính bằng công thức ở
  `test-cong-khai-giao-dien.mjs` nhóm 7).
- **iPhone thật (Safari):** chạm vào lớp phủ tối dưới bảng danh mục có đóng danh mục không; ô tự điền
  (tên, số điện thoại đã lưu) có giữ nền trắng không; ô ngày của form Hỏi bàn có cao bằng nút cạnh nó
  không. Chromium của kiểm thử không tái hiện được ba việc này.
- Chữ có gãy dòng xấu không ở tiếng Anh và tiếng Hàn — xem ảnh chụp ở 360 và 768px.
