# Beeftown — Tài sản web

Website và các tài liệu thiết kế dạng web của **Beeftown** — Beef Specialty Restaurant, nhà hàng chuyên bò kiểu quầy thịt ở **Tầng 3, 63 Hồ Tùng Mậu, TP.HCM** (lối vào riêng ngay cạnh GS25, khách đi thang máy lên tầng 3). Dự kiến khai trương 2026.

> **Repo này chỉ chứa file web.** Tài liệu kinh doanh (mô hình tài chính, nghiên cứu đối thủ, danh sách KOL, kế hoạch marketing) **cố tình không được đưa lên** — xem `.gitignore`. Khi thêm file mới, nhớ kiểm tra `git status --short` trước khi commit.

---

## Concept

Bò được cắt và **đóng sẵn trong khay skin-pack theo từng phần cắt**. Nhãn khay ghi tên phần cắt, giá mỗi 100g, trọng lượng, giá cuối (đã gồm VAT — chỉ nói về giá trên nhãn) và ngày đóng gói. Khách nhìn và chọn phần bò tại quầy như ở một tiệm thịt, có nhân viên tư vấn; cả bàn cùng nướng trên **vỉ gas đặt tại bàn**, và trong bữa có thể gọi nhân viên chọn thêm. Có quy trình ủ, nhưng chưa xác nhận số ngày, phương pháp, grade hay xuất xứ — không viết claim nào về những điều đó.

- **Tagline trên web:** *Pick it. Grill it. Love it.* — descriptor *Beef Specialty Restaurant*. (Câu "Thịt chuẩn - Giá thật" chỉ có trên ảnh mockup của PDF nhận diện, không dùng trên web.)
- **Định vị:** cao cấp vừa tầm — không phải quán bình dân, cũng không phải nhà hàng sang trọng
- **Khách chính:** người trưởng thành đi cùng gia đình, người thân; rồi bạn bè, nhóm văn phòng. Bữa tối và dịp tụ họp.

---

## Các file

| File | Nội dung |
|---|---|
| `web/` | **Website đang dùng.** Astro trên Cloudflare Workers, ba thứ tiếng Việt–Anh–Hàn (bản Anh và Hàn do máy dịch khi câu tiếng Việt đổi). Xem `web/README.md`. |
| `web/THIET-KE.md` | **Hệ giao diện trang công khai** ("Quầy thịt ấm"): màu theo vai và tương phản, chữ, thành phần, manifest artwork (nguồn, vị trí, trạng thái từng tài sản), brief chụp ảnh / video, phần bàn giao. |
| `crm/` | Database CRM và kho trên Supabase: đặt bàn, khách hàng, điểm, thực đơn, tuyển dụng, cổng nội dung, kho, bản dịch tự động — và **toàn bộ kiểm thử** (`crm/test/`). |
| `CLAUDE.md` | **Quy trình kiểm thử bắt buộc** cho mọi tính năng mới: 9 mục "định nghĩa xong", cách chạy test, việc trước khi mở PR. |
| `AGENTS.md` | Cùng quy trình đó cho Codex và các agent không phải Claude, kèm quy tắc rà soát PR (mục "Code Review Rules"). |
| `THUONG-HIEU.md` | **Bảng màu thương hiệu Khánh chốt 09/10/2026**: giá trị đã áp dụng trên trang công khai, `/noi-bo`, kho và Beeftown Cân; chỗ website còn khác guideline; thứ còn mang màu cũ. |
| `.github/` | Kiểm thử tự động (GitHub Actions) mỗi PR, mỗi lần gộp và mỗi đêm 00:30 giờ VN; đóng gói `BeeftownCan.exe` (tải về không cần gõ lệnh: `can-app/README.md`, mục "Tải BeeftownCan.exe về"); mẫu PR; mẫu báo lỗi. |
| ~~`Beeftown_Website/index.html`~~ | ⚠️ **BẢN NHÁP CŨ — KHÔNG PHÁT HÀNH.** Xem cảnh báo bên dưới. |
| ~~`Beeftown_Website/google-apps-script.gs`~~ | ⚠️ Đã thay bằng `tao_dat_ban()` trong database. |
| `Beeftown_CRM_Design.html` | Thiết kế hệ thống CRM và thẻ thành viên. |
| `Beeftown_Bo_Nhan_Dien_So.html` | Bộ nhận diện trên Google Maps, Zalo OA, Facebook, Instagram, TikTok. |
| `Beeftown_Instore_Art.html` | Trang trí trong cửa hàng. |
| `Beeftown_Logo_Suite_and_Directions.html` | Bộ logo và các hướng nhận diện. |
| `Beeftown_Dashboard.html` | Bảng theo dõi chỉ số. |
| `Beeftown_Concept_Board_v1.svg` | Bảng concept tổng thể. |
| `Beeftown_Can_TMA.html` | Phần mềm cài hàng cho cân in tem TMA: sửa tên, giá, chữ trên tem rồi xuất file nạp vào cân qua USB. Chạy không cần mạng. |

Tất cả đều là **HTML tự chứa** — mở thẳng bằng trình duyệt, không cần cài đặt gì, không có bước build. Chỉ phụ thuộc Google Fonts và (riêng bản nháp website cũ) ảnh từ Unsplash.

---

## Phần mềm cân TMA

Cân in tem TM-A 30kg (dòng TM-xA, firmware V3.14E8) không có phần mềm đi kèm, nên `Beeftown_Can_TMA.html` thay phần việc hay dùng nhất: sửa danh sách hàng và chữ trên tem. Cách dùng có ghi ngay trên trang (3 bước: lưu từ cân ra USB → sửa → nạp lại).

Đã nạp thử vào cân thật và in tem thành công (25/09/2026).

**Nạp qua WiFi đã chạy được** (thử trên cân thật 26/09/2026): cân ở `192.168.1.22`, nhận ở cổng TCP **33571** đúng nội dung file USB. Qua WiFi cân chỉ thêm và sửa hàng, không xoá; nạp USB thì thay cả danh sách. Chương trình cho máy tính ở quán: `web/public/kho/can-wifi/Nap-Can-WiFi.ps1` (tải ở màn Đồng bộ cân) — chi tiết ở `web/README.md`, mục "Đồng bộ cân".

**Beeftown Cân (`can-app/`, file `BeeftownCan.exe`)**: chương trình Windows quản lý cân — gửi giá từ kho xuống cân (đăng nhập kho, xem thay đổi, bấm Gửi; không cần USB), xem tất cả hàng (SKU) trên cân đối chiếu với kho, và chỉnh mẫu tem (chọn ô được in, sửa chữ cố định). Cân đổi địa chỉ (router phát lại) thì chương trình tự dò WiFi tìm lại cân. Xem `can-app/README.md`.

**Hằng ngày dùng màn Kho › Cài đặt › Đồng bộ cân** (`/noi-bo/kho/cai-dat/can`): kho là gốc, mã cân, tên, giá lấy thẳng từ danh mục mặt hàng — xem `web/README.md`, mục "Đồng bộ cân". File HTML độc lập giữ lại cho hai việc màn đồng bộ chưa làm: sửa chữ in trên tem, và sửa nhanh khi không mở được phần mềm kho. Hai bên dùng chung cách đọc file (`web/src/lib/kho/can-tma.ts`).

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

> **Cả website và Beeftown Cân** dùng bảng màu thương hiệu Khánh chốt ngày 09/10/2026 (`THUONG-HIEU.md`): trang công khai đổi trước; `/noi-bo`, kho và Beeftown Cân (bản 2.9.2) đổi ngày 11/10/2026. Còn mang màu cũ: 15 ảnh chụp trong trang hướng dẫn của kho (`web/public/kho/hd-*.png`), chờ chụp lại.

| Tên | Mã | Token web | Dùng cho |
|---|---|---|---|
| Beef Red | `#A70C0C` | `--do` | Màu chủ đạo: nút chính, nhãn, dải đỏ, chữ nhấn trên kem; ở `/noi-bo` và kho là số báo việc và việc "làm ngay" |
| Cream | `#F0E3D0` | `--kem` | Nền đọc; chữ trên nền tối và nền đỏ |
| Charcoal | `#151008` | `--than` | Chữ chính, nền dải tối, đầu trang nội bộ (tên màu — Beeftown nướng vỉ gas, không than) |
| Marigold | `#F5AA14` | `--cuc-vang`, `--mu-tat` | Điểm nhấn nhỏ, vòng focus trên nền tối; chữ chỉ trên nền tối |
| Warm Stone | `#B8A98C` | `--da` | Chữ phụ **chỉ trên nền tối**; nét kẻ |
| Đỏ đậm (màu pha) | `#890607` | `--do-dam`, `--do-sau` | Nút khi di chuột, chữ nhấn rất nhỏ trên kem, chữ nút trên nền đỏ, nét artwork trên kem |
| Kem sau · kem đậm (màu pha) | `#EBDCC6` · `#E7D5BC` | `--kem-sau` · `--kem-dam` | Nền khối phụ trên trang sáng; kem sau là nền của thẻ ở trang công khai, của đầu bảng ở kho; kem đậm là vạch trong thẻ của kho |
| Viền ô nhập (màu pha) | `#7A7366` | `--vien-o` | Viền ô nhập của form (trang công khai: ô nền Cream; `/noi-bo` và kho: ô nền trắng) |

Năm dòng đầu là năm màu của guideline. Ba dòng sau là màu pha cho màn hình, Khánh cho phép ngày 10/10/2026. Token khai ở **hai nơi cùng giá trị, chưa gộp** — khối `.ck` đầu tiên của `web/src/styles/cong-khai.css` (trang công khai) và hai khối `:root` của `web/src/styles/chung.css` (`/noi-bo`, kho); Beeftown Cân khai lại trong hai file HTML của nó. Đổi một mã là đổi mọi nơi đó trong cùng PR: `crm/test/test-cong-khai-giao-dien.mjs` (nhóm 2, 6) và `crm/test/test-noi-bo-bang-mau.mjs` gác từng mã.

`/noi-bo`, kho và Beeftown Cân có thêm **màu trạng thái** (xanh = xong, vàng = lưu ý, đỏ nhạt = làm ngay) — màu chức năng của công cụ, không thuộc năm màu thương hiệu, không dùng ở trang công khai. Mã và tương phản: `THUONG-HIEU.md`, mục 4.

**Bảng màu không có trắng**: trang công khai không có nền trắng — thẻ nền kem sau, ô nhập nền Cream (kiểm thử nhóm 7 và `web/kiem-tra/do-giao-dien.mjs`). `/noi-bo`, kho và Beeftown Cân thì vẫn dựng thẻ và ô nhập nền trắng trên nền kem: lần đổi màu ngày 11/10/2026 giữ cách dựng đó.

Warm Stone và Marigold **không bao giờ** làm chữ trên nền sáng (tương phản 1,83 và 1,56 : 1 với kem; 2,31 và 1,97 : 1 với thẻ trắng); không đặt chữ đỏ trên nền tối (2,43 : 1). Tỷ lệ trang công khai đang chạy: kem 60 % / tối 25 % / đỏ 12 % / vàng 3 % — guideline ghi Cream 60 / Beef Red 25 / Charcoal 10 / Marigold dưới 5, Khánh chưa quyết theo bên nào. Vai từng màu theo bề mặt và bảng tương phản: `web/THIET-KE.md`, mục 2.

### Phông chữ

- **Montserrat** (400 / 600 / 700 / 800) — mọi chữ trên web: tiêu đề, nội dung, nút. Trang tiếng Hàn thêm Noto Sans KR cho chữ Hangul.
- **Logo** là vector gốc trích từ PDF nhận diện — không gõ lại chữ BEEFTOWN bằng phông nào.
- *Hypo-me Bold* (PDF trang 1) và *NVN Beloved Bold* (trang 6) **chưa có file và bản quyền** nên chưa dùng. Cần file phông kèm giấy phép web trước khi dùng cho điểm nhấn — xem `web/THIET-KE.md`, mục 3.

### Giọng văn

Ấm áp, thẳng thắn, như một người bán thịt lành nghề. Thân thiện với gia đình và chuyên nghiệp với khách công ty.

**Nên:** nói về chất lượng tương xứng giá tiền · giải thích trải nghiệm chọn phần bò · nêu con số cụ thể

**Không nên:**
- ❌ Dùng chữ **"rẻ"** — thay bằng *hợp lý*, *xứng đáng*, *giá thật*
- ❌ Dùng tiếng lóng giới trẻ hoặc chiêu câu tương tác
- ❌ Hứa mâm banchan đầy đủ kiểu Hàn — Beeftown tập trung vào bò
- ❌ Claim chưa xác nhận: số ngày ủ, phương pháp ủ, grade, xuất xứ, Wagyu; nướng than; phòng riêng; số bàn còn trống — danh sách đầy đủ kèm lý do ở `web/src/lib/chuoi-cam.js`

---

## ⚠️ Bản nháp cũ không được phát hành

`Beeftown_Website/index.html` là bản nháp thiết kế. Nó **không được deploy**, vì đang chứa:

- số bàn còn trống **mô phỏng** bằng hàm `remainingFor()`, kèm chữ đỏ *"Còn 1 bàn"* tạo cảm giác khan hiếm;
- bốn **đánh giá khách bịa**, có tên tuổi và nghề nghiệp;
- hotline mẫu `0900 000 001` và địa chỉ `[số nhà], [tên đường]`;
- 17 ảnh kho Unsplash, trong đó một ảnh phòng ăn được dùng để minh họa cho lời hứa *"phòng riêng tầng trên, 10–30 khách"* — một tiện ích **chưa được xác nhận**;
- sáu mức giá trông như đã chốt, trong khi bảng nội dung menu gốc **không có một giá nào được duyệt**;
- câu *"rẻ hơn 30–50% so với BBQ premium"*, lặp hai lần, không có căn cứ — và tài liệu thương hiệu cấm dùng lợi thế giá làm hook.

Nặng nhất: `BOOKING_ENDPOINT` để rỗng **và** lỗi bị nuốt hai lớp (`mode:'no-cors'` cộng `try/catch`), nên **mọi lượt đặt bàn đều báo thành công với khách rồi biến mất.**

### Quy tắc 4 của bản README cũ đã bị RÚT LẠI

Bản trước viết: *"Form không bao giờ được chết trước mặt khách. Nếu `BOOKING_ENDPOINT` chưa cấu hình hoặc mất mạng, vẫn phải hiện thông báo xác nhận."*

**Quy tắc đó sai, và nó chính là nguyên nhân của lỗi trên.** Nó biến một lỗi kỹ thuật thành một lời nói dối với khách.

Quy tắc thay thế:

> **Thứ ghi dữ liệu và thứ quyết định câu thông báo phải là cùng một biểu thức `await`.**
> Ghi thất bại thì nói thất bại, và chỉ đường sang inbox Facebook.
> Hết giờ chờ thì nói *"không chắc đã ghi nhận hay chưa"* — vì đúng là không chắc.
> Form chưa sẵn sàng thì **ẩn hẳn form**, không hiện nút mờ. Một form bị vô hiệu hóa là lời nói dối có thêm bước.

Chuỗi `"đặt bàn thành công"` **không được tồn tại** trong mã nguồn.

## Lưu ý khi sửa code

Những chỗ dễ làm hỏng nếu không biết trước:

1. **Phần đặt bàn tự nhận diện số chi nhánh.** Mảng `BRANCHES` có 1 phần tử thì hiện thẻ thông tin và chọn sẵn; từ 2 phần tử trở lên tự chuyển thành nút cho khách chọn. Thêm chi nhánh chỉ cần thêm vào mảng, không phải sửa gì khác.

2. **Hàm `remainingFor()` là số bàn trống mô phỏng** — sinh ngẫu nhiên nhưng ổn định theo chi nhánh + ngày + giờ để demo. **Phải thay bằng API thật khi vận hành.**

3. **Ô đồng ý nhận tin KHÔNG được tick sẵn, và KHÔNG được bắt buộc.** Bản nháp cũ đặt `required` lên ô này, nghĩa là khách phải đồng ý nhận quảng cáo mới đặt được bàn — như vậy không còn là đồng ý tự nguyện, dù ô không tick sẵn.

   Xác nhận đặt bàn và nhận tin quảng cáo là hai mục đích khác nhau, phải hỏi riêng. `tao_dat_ban()` nhận `p_dong_y` mặc định `false` và vẫn tạo đặt bàn bình thường; chỉ khi khách tự tick thì mới ghi một dòng vào `nhat_ky_dong_y` kèm nguyên văn câu khách đã đọc.

4. ~~Form không bao giờ được "chết" trước mặt khách.~~ **QUY TẮC NÀY ĐÃ BỊ RÚT LẠI** — xem phần giải thích ở trên. Nó biến một lỗi kỹ thuật thành một lời nói dối với khách, và chính nó là nguyên nhân khiến mọi lượt đặt bàn hiện nay báo thành công rồi biến mất.

5. **Không dùng emoji làm biểu tượng** — dùng SVG nét mảnh 1.5px cho thống nhất.

6. **Ảnh trong bản nháp cũ là ảnh kho Unsplash** — không bao giờ đưa lên web thật. Website `web/` chỉ dùng ảnh minh họa món tạo bằng AI (trang luôn ghi "Ảnh minh họa") và khung đồ họa cho quầy, không gian, lối lên cho tới khi có ảnh chụp thật — brief chụp ở `web/THIET-KE.md`, mục 8.

---

## Còn phải làm trước khi công bố

### Việc của Khánh — không ai làm thay được

- [ ] **Một câu hỏi về giờ: trưa mở 10:00 hay 11:00?** Mốc đóng 14:00 và khung tối 16:00–22:00 đã có hai nguồn khớp nhau (câu Khánh gõ "14-14 16-22" và roster trong `05_VanHanh`). Chỉ còn khung đầu là chưa rõ.
- [ ] **Tạo trang Facebook**, đăng ảnh bìa và 3–4 bài trước ngày treo bạt. Đây là nút thắt của cả Giai đoạn 1 — nút bấm chính của trang trỏ vào đây, và khi chưa có thì trang **không hiện nút nào cả**.
- [ ] **Mọi tài khoản đứng tên công ty**, không đứng tên người làm: GitHub, Cloudflare, Supabase (thẻ công ty trả tiền), nhà đăng ký tên miền, Facebook, Google Business, Zalo OA.
      *Phép thử thành thật: người làm đăng xuất một ngày, Khánh vẫn vào được từng cái.*
- [ ] **Một hộp thư có người đọc.**
- [ ] Đăng ký tên miền `.vn` — cần giấy tờ, **1–5 ngày làm việc**. Trong lúc chờ, chạy trên tên miền tạm của Cloudflare. **Bạt chỉ in tên Facebook**, không in địa chỉ web, để hai đường không kẹt nhau.
- [ ] **Supabase gói trả phí trước khi mở bất kỳ form công khai nào** — gói miễn phí tự ngủ sau 7 ngày không dùng, và nó sẽ ngủ đúng hôm form lên sóng.
- [ ] **Hạ tầng cho nhiều nhân viên dùng cùng lúc** — hạn mức đăng nhập, gói Cloudflare, mạng tại quán: xem mục riêng [bên dưới](#hạ-tầng-cho-100-người-dùng-cùng-lúc).

### Việc kỹ thuật — theo đúng thứ tự này

- [ ] Tạo project Supabase, chạy `crm/supabase/migrations/` **theo thứ tự số** — rồi đối chiếu bằng `npm run doi-chieu` (mục [Chạy migration lên production](#chạy-migration-lên-production))
- [ ] Tạo tài khoản đầu tiên trong Supabase Studio, rồi thêm một dòng `nhan_su` có `auth_uid` trỏ tới nó và `vai_tro = 'chu_so_huu'`.
      *Không có bước thứ hai thì đăng nhập được vào Supabase nhưng `/noi-bo` vẫn từ chối — có chủ ý: Supabase Auth trả lời "ai", bảng `nhan_su` trả lời "có phải nhân viên không".*
- [ ] Thêm một dòng `chi_nhanh` có `ma` khớp biến `PUBLIC_CHI_NHANH`
- [ ] Điền `web/.env` **trên máy dùng để build** (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_CHI_NHANH`, `SITE_URL`).
- [ ] Tạo khóa Gemini ở Google AI Studio và đặt làm **secret** `GEMINI_API_KEY` của Worker (dashboard Cloudflare, hoặc `npx wrangler secret put GEMINI_API_KEY`). Không có khóa thì trang vẫn chạy, chỉ là bản Anh/Hàn lùi về bản kế tiếp. Chi tiết ở `web/README.md`, mục "Bản dịch tự động".
      *Build chạy trên máy, không chạy trên Cloudflare — dashboard của Cloudflare không có chỗ đặt mấy biến này. Đặt sai chỗ thì trang vẫn deploy, vẫn trả 200, chỉ là không nối được database và không ai biết.*
- [ ] Đăng nhập `/noi-bo`, công bố địa chỉ và link Facebook. Trang chủ đổi ngay, không cần deploy lại.
- [ ] Gọi `tao_tin_tuyen_dung_mau(<id chi nhánh>)` → 8 tin nháp. Sửa lại rồi chuyển sang `da_cong_bo`; **form ứng tuyển tự hiện ra** khi có tin đầu tiên được công bố.
- [ ] Kiểm tra kho file bằng tay theo danh sách cuối `0014_storage_supabase.sql`
- [ ] Mua bản quyền phông cho tên thương hiệu — hiện dùng Montserrat, **có chủ ý**, để không ai tưởng việc này đã xong

### Hai việc kỹ thuật dễ bị bỏ quên

- [ ] **Nhập bàn thật vào `ban_an` trước khi mở đặt bàn.** Công tắc `form_dat_ban_dang_mo` được seed sẵn `true` ở migration `0010` (để tám kiểm tra cũ không hỏng), nhưng bảng `ban_an` thì trống trên database vừa cài. Website có chốt chặn thứ hai — nó hỏi database xem còn khung giờ nào trống trong 14 ngày tới, không có thì hiện "chưa mở đặt bàn" thay vì dựng một cái form chỉ để báo *"hết bàn"*. Nhưng chốt chặn đó chỉ giấu triệu chứng; bàn vẫn phải nhập.
- [ ] **Email báo về khi có hồ sơ hoặc yêu cầu mới — chưa làm, và đây là việc quan trọng nhất còn lại.** Rủi ro lớn nhất của cả hệ thống không phải nó hỏng, mà là hồ sơ và yêu cầu nằm im trong database không ai mở. Cho tới khi có email, **`/noi-bo` phải được mở ra xem hằng ngày** — đó là điều kiện để bật bất kỳ form nào.

---

## Chạy migration lên production

**Vì sao có mục này:** ngày 04/10/2026 phát hiện project **Beeftown** thiếu hai hàm có trong migration đã gộp — `bao_dong_bat_dau_luot` (`0060`) và `kho_may_can_nhat_ky` (`0061`). Hai file đó được chạy thành nhiều mảnh và một mảnh lặng lẽ không chạy; không gì báo lỗi, báo động hằng ngày cứ chết ở hàm thiếu mà không ai biết. Nghi là do công cụ `apply_migration` / `execute_sql` của Supabase MCP: câu lệnh có `delete` phải chờ người bấm xác nhận, phiên không có chỗ bấm thì hết 60 giây và **không chạy gì**, nhưng phiên vẫn đi tiếp.

Migration chỉ chạy lên production **sau khi PR đã gộp** vào main (`CLAUDE.md`, mục 8). Mỗi lần:

1. `git checkout main && git pull` — máy phải có đúng migration vừa gộp.
2. Chạy từng file mới **theo thứ tự số**, **nguyên cả file**, ở Supabase → project **Beeftown** → **SQL Editor**. File nào `crm/README.md` (mục "Thứ tự chạy có ràng buộc") ghi "chạy RIÊNG" thì chạy một mình. Đừng nhờ phiên Claude chạy migration qua Supabase MCP khi không có người ngồi bấm xác nhận.
3. **Đối chiếu — bắt buộc, sau MỖI lần chạy migration lên production**, kể cả khi SQL Editor báo "Success". Trên máy tính (Windows PowerShell), trong thư mục repo:

   ```powershell
   cd crm
   npm ci
   $env:DOI_CHIEU_DB_URL='<chuỗi Session pooler của project Beeftown>'
   npm run doi-chieu
   ```

   Chuỗi đặt trong nháy **đơn** `'…'`: trong nháy kép, PowerShell biến `$…` của mật khẩu thành chữ khác. (Bash: `DOI_CHIEU_DB_URL='…' npm run doi-chieu`. `npm ci` chỉ cần lần đầu và khi `package-lock.json` đổi.)
   Chuỗi kết nối lấy như bước 1 của mục [Sao lưu](#việc-của-khánh-một-lần-khoảng-10-phút): Supabase → **Connect** → **Session pooler**, thay `[YOUR-PASSWORD]`. Chỉ đặt trong cửa sổ dòng lệnh đó — **không ghi vào file nào trong repo**, không dán vào issue hay chat. Script chỉ đọc (giao dịch `read only`), không hiện mật khẩu, mất khoảng 10–20 giây.

   **Đạt** khi dòng cuối là `KHỚP — … đều có và đúng trên database`. Nếu không:
   - **`THIẾU` / `KHÁC`** — một phần migration chưa chạy, hoặc database đang chạy bản cũ. Dòng báo ghi file migration chứa định nghĩa cuối cùng: chạy lại **đúng câu tạo đối tượng đó** ở SQL Editor (`create or replace function …` chạy lại an toàn; đừng chạy lại cả file có `insert` hay `alter table … add column`), rồi `npm run doi-chieu` lại đến khi khớp.
   - **`THỪA`** — database có thứ migration không tạo: ai đó tạo tay, hoặc một câu `drop` chưa chạy (dòng báo ghi file có câu drop). Hỏi lại trước khi xoá.
   - **`Không đối chiếu được`** — sai chuỗi kết nối, mất mạng, hết giờ. Chưa so được gì — **không** có nghĩa là khớp.
   - Production cố ý chưa chạy migration mới nhất: `npm run doi-chieu -- --den 0061` chỉ so đến số đó.
4. Rồi mới deploy web, nếu PR đổi cả web — theo thứ tự ghi ở mục "Migration" của PR.

**So những gì:** mọi hàm trong schema `public` (có mặt; thân hàm — bỏ chú thích và khoảng trắng, vì production lưu thân hàm đã bỏ chú thích —; kiểu trả về, `security definer`, `search_path`), bảng và view (RLS bật hay tắt), cột, ràng buộc, chỉ mục, trigger, policy RLS, quyền gọi / đọc ghi của `anon` và `authenticated`, enum. "Đúng" nghĩa là giống database dựng từ mọi file trong `crm/supabase/migrations/` — y như bộ kiểm thử dựng. **Không so:** dữ liệu migration chèn sẵn, kho file Storage (kiểm tay theo danh sách cuối `0014_storage_supabase.sql`), quyền của `service_role`.
Kiểm thử của chính công cụ: `crm/test/test-doi-chieu-production.mjs` (chạy trong `npm test`, trên PGlite).

---

## Hạ tầng cho 100 người dùng cùng lúc

**Ngắn gọn:** 100 nhân viên là tải nhẹ với Cloudflare + Supabase, và database đã viết đúng cho nhiều người cùng ghi — số phiếu cấp bằng bộ đếm có khóa dòng (không trùng số), `ma_gui` chống bấm Lưu hai lần, `phien_ban` chống hai máy ghi đè nhau, sổ kho chỉ ghi thêm. Chỗ gây sự cố thật nằm ở ba nơi: **hạn mức đăng nhập của Supabase, gói dịch vụ, và mạng tại quán.**

### Đo được — Beeftown-thu, 28/09/2026, khoảng 5 tuần dữ liệu mô phỏng

| Việc | Database tốn | Chạy khi nào |
|---|---|---|
| `kho_dem_viec` — số đỏ trên menu | ~44 ms | **mỗi lần mở một trang kho** |
| `kho_thong_bao` | ~32 ms | trang Hôm nay, Thông báo, Việc cần làm |
| `kho_chi_so_quan_tri` | ~32 ms | trang Hôm nay của quản lý |
| `kho_v_ton`, `kho_v_phieu_nhap`, … | ~1 ms | các trang danh sách |
| `noi_dung_cong_khai` — trang chủ công khai | ~0,6 ms | mỗi lượt khách vào web |

Mở một trang kho tốn khoảng 50–110 ms database. 100 người, mỗi người 15 giây mở một trang (dồn dập hơn thật) ≈ 7 trang/giây ≈ nửa nhân CPU: vừa sức gói Pro. Chỗ tối ưu đầu tiên nếu CPU cao là `kho_dem_viec` — phần lớn thời gian của nó nằm ở `kho_su_kien`. Trang công khai rẻ: 100 khách/giây mới tốn khoảng 10% một nhân, nên **chưa cần bộ nhớ đệm** — công tắc nội dung vẫn đổi trang ngay.

### Hạn mức đăng nhập — đọc trước

Đăng nhập bằng mật khẩu, gia hạn phiên (mỗi người một lần mỗi giờ) và **mở máy tính bảng bằng PIN** đều đi qua `/auth/v1/token` của Supabase. Cửa này có hạn mức theo địa chỉ IP: mặc định dồn được 30 lượt, rồi mỗi 2 giây thêm một lượt (150 lượt / 5 phút). Worker gọi Supabase từ máy chủ Cloudflare, nên với Supabase **cả quán là một IP** — đầu ca, sau buổi họp, ngày tập huấn là chạm trần.

Chạm trần thì web **giữ phiên** và báo "hệ thống đang bận, đợi vài giây" (`web/src/lib/qua-tai.ts`): không đăng xuất ai, không xóa đăng nhập đã cất trên máy tính bảng, không bắt quản lý đăng ký lại máy, không báo "sai mật khẩu" cho người gõ đúng. Bản trước làm cả bốn điều đó. Nhưng người ta vẫn phải chờ — nên nâng hạn mức (việc 1 bên dưới).

Không dùng cách "chuyển tiếp IP" (`Sb-Forwarded-For`) trong tài liệu Supabase: nó bắt đặt khóa bí mật đi xuyên RLS vào Worker — trái nguyên tắc ở đầu `web/src/lib/phien.ts` — và cũng vô ích, vì nhân viên dùng chung một IP WiFi.

### Việc của Khánh

1. [ ] **Supabase → Authentication → Rate Limits → "Rate limit for token refreshes"**: 150 → **450–600** lượt / 5 phút, ở **cả hai** project (Beeftown và Beeftown-thu). Mục này tính cả lượt đăng nhập bằng mật khẩu, không chỉ gia hạn. Kiểm: `npm run thu-tai -- --dang-nhap-don 60` trên Beeftown-thu (xem "Thử tải" bên dưới) — không lượt nào bị 429 là được. Nâng hạn mức cũng là cho dò mật khẩu nhanh hơn: làm cùng việc 3, và mật khẩu nhân viên từ 10 ký tự.
2. [ ] **Cloudflare Workers Paid — 5 USD/tháng.** Gói Free cho 100.000 lượt/ngày dùng **chung** cho web khách và hệ thống kho — một chiến dịch quảng cáo chạy tốt là đủ làm kho báo lỗi 1027 giữa ca — và mỗi lượt chỉ được 10 ms CPU, trang báo cáo và tải ảnh chứng từ vượt.
3. [ ] **Cloudflare → Security → WAF → Rate limiting rules** (gói Free có một luật, chỉ lọc theo đường dẫn, đếm 10 giây, chặn 10 giây): URI Path equals `/noi-bo/dang-nhap`, theo IP, **10 lượt / 10 giây** → Block. Chặn một máy bên ngoài dò mật khẩu hay cố tình đốt hạn mức đăng nhập chung của quán. Ngày tập huấn cả nhóm đăng nhập cùng lúc từ WiFi quán: tắt tạm luật này.
4. [ ] **Supabase Pro + cỡ máy Small** (~15 USD/tháng; Pro đã kèm 10 USD cho cỡ Micro). Giờ cao điểm CPU (Supabase → Reports → Database) thường xuyên trên 70% thì làm theo "Nếu chậm". Đổi cỡ máy làm gián đoạn vài phút — làm ngoài giờ. Small và Medium thêm RAM, CPU vẫn dùng chung; muốn CPU riêng phải lên Large.
5. [ ] **Tạo tài khoản cho 100 nhân viên theo đợt.** Tạo tài khoản tính vào hạn mức khác, "sign ups and sign ins" (30 / 5 phút). Màn Nhân viên đã báo "Tạo quá nhiều tài khoản liền nhau — chờ vài phút"; muốn tạo một lần thì nâng tạm hạn mức đó trong ngày tạo. Nhân viên quầy, bếp dùng **máy tính bảng dùng chung** (đổi người bằng PIN, `web/KHO.md` mục 3f) — ít thiết bị phải đăng nhập, ít lượt vào hạn mức.
6. [ ] **Mạng tại quán**
   - Hai đường cáp quang của **hai nhà mạng khác nhau**, router dual-WAN tự chuyển đường khi một đường đứt, cộng **4G dự phòng**. Web nội bộ rất nhẹ — 100 Mbps là đủ cho nhân viên.
   - **WiFi doanh nghiệp có bộ quản lý chung** (Ruijie Reyee, TP-Link Omada, UniFi…), mỗi điểm phát khoảng 25–30 thiết bị đang dùng, đặt theo khu: quầy, bếp, kho, từng tầng. Modem nhà mạng tặng thường chỉ chịu tốt 20–30 thiết bị.
   - **Kho lạnh chặn sóng WiFi**: đặt điểm phát ngay cửa kho lạnh, và thử quét mã bên trong trước khai trương.
   - **Ba mạng riêng**: nhân viên / thiết bị (iPOS, cân, máy in, máy tính bảng — IP cố định; cân phải giữ đúng `192.168.1.22`) / khách (cách ly, giới hạn băng thông).
   - **Bộ lưu điện (UPS)** cho router, switch, điểm phát.
7. [ ] **Khi mất mạng**: cân in tem vẫn chạy. Hỏi iPOS xác nhận máy bán hàng bán được khi mất mạng — nếu được, hóa đơn tự về kho khi có mạng lại (hook đã chống trùng theo mã hóa đơn). Kho **không** chạy khi mất mạng: in sẵn phiếu giấy (nhập, xuất, hủy, đếm quầy) để ở quầy và kho, có mạng lại thì nhập vào.
8. [ ] **Diễn tập trước khai trương**: 30 phút, 30–50 nhân viên trên máy thật, làm đúng việc hằng ngày; giữa chừng rút dây mạng chính, xem 4G có tự đỡ không.

### Thử tải trước khi mở cửa

`crm/test/thu-tai.mjs` mô phỏng N nhân viên mở các trang kho — gọi đúng các lời gọi Supabase mà Worker làm cho mỗi trang (Hôm nay, Tồn kho, Thông báo, Nhập hàng, Đếm quầy), **chỉ đọc**, và dừng ngay nếu database có chi nhánh nào tên không chứa "BẢN THỬ". Chạy trên máy tính (Windows PowerShell):

```powershell
cd crm
$env:SUPABASE_URL="https://<mã Beeftown-thu>.supabase.co"
$env:SUPABASE_ANON_KEY="<khóa anon của Beeftown-thu>"
$env:TAI_KHOAN="<email quản lý tập>:<mật khẩu>,<email thủ kho tập>:<mật khẩu>,<email NV quầy tập>:<mật khẩu>"
npm run thu-tai -- --nguoi 150 --phut 10
```

**Đạt** khi: không lời gọi nào hỏng (429, 5xx, mất mạng), 95% số lần mở trang dưới 2 giây, và CPU database (Supabase → Reports) dưới 70% trong lúc chạy. Lặp email NV quầy nhiều lần trong `TAI_KHOAN` để tăng tỉ lệ người dùng quầy. Thời gian đo từ máy ở Việt Nam nên cộng thêm độ trễ mạng sang Singapore; con số đáng so là mức chậm đi giữa lúc rảnh (pha 1) và lúc tải (pha 2).

### Theo dõi khi đang chạy thật

- **Cloudflare → Workers & Pages → beeftown → Metrics**: lượt gọi, tỉ lệ lỗi, thời gian CPU. **Logs** (bật trong `web/wrangler.toml`, giữ 7 ngày): tìm `[qua-tai]` — mỗi dòng là một lần nhân viên gặp trang "hệ thống đang bận". `qua_tai` = chạm hạn mức → việc 1; `mat_ket_noi` = Supabase trục trặc hoặc mất mạng. Nhật ký từng lượt gọi (invocation logs) cố ý tắt: nó chép nguyên URL, mà địa chỉ nhận hóa đơn iPOS mang khóa bí mật ngay trong đường dẫn.
- **Supabase → Reports → Database**: CPU, RAM giờ cao điểm.

### Nếu chậm — làm theo thứ tự

1. Nhiều dòng `[qua-tai] … qua_tai` → nâng thêm hạn mức token (việc 1).
2. CPU database trên 70% giờ cao điểm → nhớ kết quả `kho_dem_viec` khoảng 30 giây cho mỗi người trong Worker (xóa khi chính người đó ghi), hoặc tối ưu `kho_su_kien` — cả hai bớt phần lớn tải của mỗi lần mở trang.
3. Vẫn cao → nâng cỡ máy Supabase (CPU riêng từ cỡ Large).

---

## Sao lưu và khôi phục

**Mỗi đêm 02:00 giờ Việt Nam**, workflow **"Sao lưu database"** (`.github/workflows/sao-luu.yml`) sao lưu project Supabase **Beeftown**:

1. `crm/sao-luu/sao-luu.sh` — `supabase db dump` ra ba file (vai trò, cấu trúc, dữ liệu — gồm cả tài khoản đăng nhập), nén, **mã hoá AES-256** bằng mật khẩu của anh.
2. File đã mã hoá lưu ở mục **Artifacts** của lượt chạy, **giữ 30 ngày**. File chưa mã hoá không bao giờ rời máy chạy.
3. **Khôi phục thử** bản vừa tạo vào một Supabase dựng tạm ngay trong máy chạy (`crm/sao-luu/khoi-phuc.sh`): đủ số dòng từng bảng, sổ kho khớp tồn. Bản sao không khôi phục được thì coi như không có.
4. Ghi kết quả vào database → đèn **"Sao lưu dữ liệu"** ở `/noi-bo` (chủ và quản lý thấy). "Bản dùng được" = sao lưu xong **và** khôi phục thử đạt. Xanh khi có bản dùng được trong 36 giờ; vàng khi lượt gần nhất hỏng hoặc không khôi phục thử được mà vẫn còn bản dùng được trong 36 giờ; **đỏ khi quá 36 giờ không có bản dùng được, hoặc chưa có bản nào**.

Lượt nào hỏng thì cũng **đỏ ở tab Actions, và GitHub gửi email** cho người đặt lịch.

**Không có trong bản sao:** file trong Supabase Storage (CV ứng viên, ảnh chứng từ — chỉ có dòng mô tả của chúng), khóa bí mật của Worker (Cloudflare), cấu hình trong trang quản trị Supabase (hạn mức đăng nhập, email).

### Việc của Khánh (một lần, khoảng 10 phút)

1. [ ] **Chuỗi kết nối:** Supabase → project **Beeftown** → nút **Connect** → **Session pooler** → chép chuỗi `postgresql://postgres.….pooler.supabase.com:5432/postgres`, thay `[YOUR-PASSWORD]` bằng mật khẩu database. Quên mật khẩu → Database → Settings → **Reset database password** (web không dùng mật khẩu này — web dùng khóa API — nên đặt lại không ảnh hưởng gì).
2. [ ] **Mật khẩu mã hoá:** tự đặt một câu dài **từ 20 ký tự** (ví dụ 5–6 từ ngẫu nhiên). **Cất ở hai nơi ngoài GitHub** (trình quản lý mật khẩu + giấy trong két). **Mất mật khẩu này là mọi bản sao lưu thành rác** — không ai mở được, kể cả Claude.
3. [ ] GitHub → `beeftown-stock` → Settings → Secrets and variables → Actions → **New repository secret**, hai lần:
   - `SAO_LUU_DB_URL` = chuỗi ở bước 1
   - `SAO_LUU_MAT_KHAU` = mật khẩu ở bước 2
4. [ ] Tab **Actions** → **Sao lưu database** → **Run workflow**. Sau khoảng 5–10 phút lượt chạy phải **xanh**, Summary có "💾 Bản sao …" và "✅ Khôi phục thử … đủ dòng từng bảng". Đèn "Sao lưu dữ liệu" ở `/noi-bo` chuyển xanh.

Chi phí: mỗi lượt chạy vài phút máy GitHub Actions (kho riêng). Gói GitHub Free có hạn mức phút mỗi tháng cho kho riêng — xem Settings → Billing and plans; bản sao lưu cũng tính vào dung lượng lưu trữ Actions.

**Rủi ro còn lại — nên biết:** `SAO_LUU_DB_URL` là chìa khoá toàn quyền vào database. Secret của repo đọc được từ workflow ở **mọi nhánh** — ai (hay phiên Claude nào) đẩy được một nhánh có workflow sửa đổi là đọc được nó. Khoá chặt hơn nếu **Settings → Environments** của repo cho đặt secret và giới hạn nhánh (với kho riêng, GitHub chỉ có mục này từ gói Pro trở lên): tạo environment `sao-luu`, **Deployment branches → Selected branches → `main`**, chuyển hai secret vào environment đó (xoá bản ở mục Actions secrets), rồi nhờ Claude thêm dòng `environment: sao-luu` vào job trong `sao-luu.yml`. Sau khi dùng một thời gian, cũng nên đổi mật khẩu database định kỳ (đổi xong cập nhật `SAO_LUU_DB_URL`).

### Khôi phục khi cần — từng bước

Chỉ khôi phục vào một project **MỚI, TRỐNG**. Script tự từ chối database đã có bảng, để không lỡ tay ghi đè project đang chạy.

1. Tab **Actions** → **Sao lưu database** → lượt **xanh** gần nhất (trước lúc sự cố) → **Artifacts** → tải `sao-luu-beeftown-<ngày>` → giải nén ra file `beeftown-<ngày>.tar.gz.gpg`.
2. Supabase → **New project** (cùng vùng với project cũ). Project cũ có bật extension nào ngoài mặc định thì bật lại ở project mới. Lấy chuỗi **Session pooler** của project MỚI như bước 1 ở trên.
3. Trên máy có `psql`, `gpg` (Linux hoặc WSL trên Windows — đã thử; macOS: cài `gnupg` và `libpq` bằng Homebrew — script viết để chạy được nhưng chưa thử trên Mac), trong thư mục repo:

   ```bash
   SAO_LUU_MAT_KHAU='<mật khẩu mã hoá>' bash crm/sao-luu/khoi-phuc.sh beeftown-<ngày>.tar.gz.gpg '<chuỗi Session pooler của project MỚI>'
   ```

   Dòng cuối phải là `KET_QUA=dat …`. Script dừng mà không nạp gì khi: sai mật khẩu, file tải thiếu, file bị sửa (lệch mã kiểm), database đích đã có dữ liệu. Nạp rồi mà lệch số dòng hay sổ kho lệch tồn → báo rõ bảng nào.
4. Cloudflare → Worker của web → đổi `PUBLIC_SUPABASE_URL` và `PUBLIC_SUPABASE_ANON_KEY` sang project mới → deploy. Mọi người **đăng nhập lại** (tài khoản và mật khẩu giữ nguyên — có trong bản sao). Beeftown Cân lấy địa chỉ kho từ web nên đi theo.
5. Làm lại những thứ không nằm trong bản sao: hạn mức đăng nhập và email ở trang quản trị Supabase (mục "Hạ tầng" ở trên), file Storage (CV cũ không còn), và đổi secret `SAO_LUU_DB_URL` sang project mới. Khóa bí mật của Worker giữ nguyên — tài khoản máy (iPOS, máy quầy) có trong bản sao.

Sao lưu tay (máy **của mình** có Docker, `psql`, `gpg` — chuỗi kết nối nằm trên dòng lệnh của Supabase CLI, người dùng khác cùng máy thấy được): `SAO_LUU_DB_URL='…' SAO_LUU_MAT_KHAU='…' SUPABASE='npx supabase' bash crm/sao-luu/sao-luu.sh ra/`.
Kiểm thử: `crm/test/test-sao-luu.mjs` (chính hai script, với `supabase` và `psql` giả), `test-suc-khoe.mjs` nhóm 12 (bảng `he_thong_sao_luu`, câu ghi lượt), `test-suc-khoe-web.mjs` nhóm 16 (màu và câu của đèn).

## Nghiệm thu — Khánh tự làm được

**Hai điện thoại thật, dùng 4G không dùng wifi.** Khách đứng trước bạt là đang dùng 4G.

- [ ] Gõ tay địa chỉ web. Trang hiện dưới 3 giây.
- [ ] **Không cần cuộn** đã đọc được khẩu hiệu, địa chỉ và dòng trạng thái.
- [ ] Chạm "Chỉ đường" → mở Maps đúng 63 Hồ Tùng Mậu, ghim ở lối vào riêng cạnh GS25 (nút chỉ có khi link Maps đã công bố). Thấy ngay câu "Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3."
- [ ] Chạm "Theo dõi Beeftown" → **mở app Facebook** đúng trang. *Đây là chỗ hay hỏng nhất.*
- [ ] Xoay ngang không vỡ. Chỉnh cỡ chữ hệ thống lớn nhất vẫn dùng được.
- [ ] Lặp lại toàn bộ trên điện thoại thứ hai, khác hệ điều hành.

**Ảnh xem trước khi chia sẻ**

- [ ] Dán link vào Zalo tự gửi cho mình → thấy **ảnh**, tiêu đề, một dòng mô tả. Không phải link xanh trơ.
- [ ] Lặp lại với Messenger và ô soạn bài Facebook.
- [ ] *Chưa công bố ảnh chụp thật 1200×630 thì link hiện ảnh dự phòng (vân mỡ + logo) — đúng như thiết kế. Chạy `select * from v_cong_bo_con_thieu` để xem còn thiếu gì.*

**Soát nội dung — đọc thành tiếng, mở tài liệu thương hiệu bên cạnh**

- [ ] Mỗi câu trên trang, Khánh nói được nó lấy từ đâu. Câu nào không nói được thì xóa.
- [ ] Tìm trong trang: giá, ngày, giờ, số điện thoại, và các từ *phòng riêng, Wagyu, than, rẻ, số một, duy nhất*. **Có một kết quả là fail.** Làm cả ở `/en` và `/ko` — bản dịch máy đã qua bộ lọc chữ cấm, nhưng mắt người vẫn là lần kiểm cuối.
- [ ] Không ảnh nào là ảnh kho. Nếu có ảnh, Khánh nói được ai chụp và chụp khi nào.

**Trước khi bật form đặt bàn**

- [ ] Gửi một yêu cầu thật từ điện thoại ngoài. Bấm đồng hồ.
- [ ] **Một nhân viên thật, không được báo trước**, phải gọi lại trong khung giờ đã công bố. Không ai gọi thì form không lên sóng.
- [ ] Gửi với số "123" → bị từ chối bằng tiếng Việt.
- [ ] Gửi rồi bật chế độ máy bay giữa chừng → phải báo **thất bại**. Tuyệt đối không được báo "đã nhận".
- [ ] Thử đặt khung giờ đã qua — **chạy lúc 9 giờ tối giờ Việt Nam**, đó là lúc lỗi múi giờ lộ ra.

**Trước khi bật form ứng tuyển**

- [ ] Nộp một hồ sơ từ điện thoại ngoài.
- [ ] Có người nhận email trong 5 phút, đọc được trên điện thoại.
- [ ] Nếu bật tải CV: dán đường dẫn file vào cửa sổ ẩn danh → **phải bị từ chối**.
- [ ] Hỏi người phụ trách hộp thư: "có hồ sơ về thì anh/chị làm gì?" — phải có câu trả lời.

---

## Kiểm thử tự động — Khánh cần biết

Mỗi PR, mỗi lần gộp vào main và mỗi đêm lúc 00:30 giờ Việt Nam, GitHub tự chạy toàn bộ kiểm thử
(database, kho, Zalo, Messenger, Beeftown Cân, trang web trên trình duyệt thật). Chi tiết ở `CLAUDE.md`.

- **Chỉ bấm Merge khi PR có dấu ✓ xanh.** Dấu ✗ đỏ nghĩa là có kiểm thử hỏng — phiên Claude đang theo dõi
  PR sẽ tự sửa; đừng gộp trong lúc chờ.
- **Deploy tự chặn** commit chưa có CI xanh (`npm run deploy`). Cài `gh` một lần trên máy deploy:
  `winget install GitHub.cli`, rồi `gh auth login`.
- **Gặp lỗi khi vận hành** → GitHub → Issues → New issue → **Báo lỗi**. Mỗi lỗi báo ở đó sẽ có một kiểm thử
  riêng viết trước khi sửa, để không quay lại.
- **Email báo lỗi của lượt đêm**: bật ở GitHub → Settings → Notifications → Actions. Lượt đêm còn quét
  beeftown.vn thật, nên trang sập hay có chữ cấm vừa bật lên cũng sẽ báo đỏ.
