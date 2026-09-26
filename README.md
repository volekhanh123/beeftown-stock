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
| `web/` | **Website đang dùng.** Astro trên Cloudflare Workers, ba thứ tiếng Việt–Anh–Hàn (bản Anh và Hàn do máy dịch khi câu tiếng Việt đổi). Xem `web/README.md`. |
| `crm/` | Database CRM và kho trên Supabase: đặt bàn, khách hàng, điểm, thực đơn, tuyển dụng, cổng nội dung, kho, bản dịch tự động. 1374 kiểm tra. |
| ~~`Beeftown_Website/index.html`~~ | ⚠️ **BẢN NHÁP CŨ — KHÔNG PHÁT HÀNH.** Xem cảnh báo bên dưới. |
| ~~`Beeftown_Website/google-apps-script.gs`~~ | ⚠️ Đã thay bằng `tao_dat_ban()` trong database. |
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

Đã nạp thử vào cân thật và in tem thành công (25/09/2026).

**Nạp qua WiFi đã chạy được** (thử trên cân thật 26/09/2026): cân ở `192.168.1.22`, nhận ở cổng TCP **33571** đúng nội dung file USB. Qua WiFi cân chỉ thêm và sửa hàng, không xoá; nạp USB thì thay cả danh sách. Chương trình cho máy tính ở quán: `web/public/kho/can-wifi/Nap-Can-WiFi.ps1` (tải ở màn Đồng bộ cân) — chi tiết ở `web/README.md`, mục "Đồng bộ cân".

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

6. **Ảnh trên website hiện là ảnh minh hoạ từ Unsplash**, có ghi chú trong code. Thay bằng ảnh chụp thật trước khi công bố.

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

### Việc kỹ thuật — theo đúng thứ tự này

- [ ] Tạo project Supabase, chạy `crm/supabase/migrations/` **theo thứ tự số**
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

## Nghiệm thu — Khánh tự làm được

**Hai điện thoại thật, dùng 4G không dùng wifi.** Khách đứng trước bạt là đang dùng 4G.

- [ ] Gõ tay địa chỉ web. Trang hiện dưới 3 giây.
- [ ] **Không cần cuộn** đã đọc được khẩu hiệu, địa chỉ và dòng trạng thái.
- [ ] Chạm địa chỉ → mở Maps đúng 40–42 Nguyễn Thái Học.
- [ ] Chạm "Theo dõi Beeftown" → **mở app Facebook** đúng trang. *Đây là chỗ hay hỏng nhất.*
- [ ] Xoay ngang không vỡ. Chỉnh cỡ chữ hệ thống lớn nhất vẫn dùng được.
- [ ] Lặp lại toàn bộ trên điện thoại thứ hai, khác hệ điều hành.

**Ảnh xem trước khi chia sẻ**

- [ ] Dán link vào Zalo tự gửi cho mình → thấy **ảnh**, tiêu đề, một dòng mô tả. Không phải link xanh trơ.
- [ ] Lặp lại với Messenger và ô soạn bài Facebook.
- [ ] *Chưa tải ảnh 1200×630 lên thì chưa có ảnh — đúng như thiết kế. Chạy `select * from v_cong_bo_con_thieu` để xem còn thiếu gì.*

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
