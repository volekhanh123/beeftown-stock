# Beeftown — Thiết kế trang công khai

Tài liệu này giải thích **vì sao** trang công khai trông như hiện nay, hệ màu và chữ dùng theo luật nào, từng tài sản hình ảnh lấy từ đâu và thay bằng gì, và còn thiếu những ảnh nào phải đi chụp. Mã nguồn là `src/styles/cong-khai.css` (hệ giao diện) và các component trong `src/components/`; tài liệu này không lặp lại mã, chỉ ghi luật và lý do.

Đọc kèm: `README.md` (cách chạy, cổng nội dung), `THUC-DON.md` (công bố món lên trang Thực đơn), `../README.md` mục "Quy tắc thiết kế" (bảng màu tóm tắt).

Nguồn của mọi quyết định dưới đây: brief thiết kế Khánh gửi ngày 06/10/2026, PDF nhận diện `BGBTFILE (2).pdf` (11 trang, xuất từ Illustrator — logo, artwork đều là vector) và bảng 31 tên món làm việc. **Sự thật kinh doanh trong brief đứng trên câu chữ, giá và hình mockup trong PDF.**

---

## 1. Hướng thẩm mỹ: "Quầy thịt ấm"

Trang web như lúc bước tới quầy Beeftown:

- **Nền kem** như giấy gói của tiệm thịt — nền để đọc, chiếm phần lớn trang.
- **Đỏ Beeftown** là nhãn, tem và nút — dẫn hành động và tạo vài khoảnh khắc nhận diện.
- **Vài dải tối có chủ đích** — "bữa tối bên vỉ": thịt và ánh lửa ấm sáng lên trên nền tối.
- **Một chút vui** lấy từ chính artwork của PDF: mảng vân mỡ (trang 2), nét rosemary và miếng steak (trang 3), tem tròn và chữ lặp (trang 11).

**Vì sao hợp Beeftown.** Điều khác biệt của Beeftown nằm ở quầy: bò được cắt và đóng sẵn trong khay skin-pack, khách nhìn tận mắt, đọc nhãn, nhờ nhân viên tư vấn, rồi cả bàn cùng nướng trên vỉ gas đặt tại bàn. Một trang web kiểu "nhà hàng sang trọng" (nền đen, chữ vàng, ảnh mờ) giấu đi đúng điều đó và đẩy khách ra xa; một trang kiểu quán bình dân thì sai định vị "cao cấp vừa tầm". Quầy thịt ấm nói thẳng trải nghiệm: chuyên nghiệp như một tiệm thịt tử tế, gần gũi như một bữa tối cả nhà.

**Thiết bị chữ ký: "Đọc nhãn khay"** (`components/NhanKhay.astro`). Năm trường của nhãn skin-pack — tên phần cắt, giá mỗi 100g, trọng lượng, giá cuối (đã gồm VAT), ngày đóng gói — in trên một thẻ đặt thẳng, phẳng: đầu thẻ có logo và tiêu đề "Cách đọc nhãn khay", dưới là năm dòng theo đúng thứ tự trên nhãn, mỗi dòng gồm số thứ tự, tên trường và lời giải thích. Nó giải thích cách tính tiền một cách trung thực **mà không có con số nào** — không giá trị mẫu, không mã vạch giả: giá thật của từng khay chỉ có ở quầy. "Đã gồm VAT" chỉ nói về giá cuối trên nhãn khay, không bao giờ mở rộng thành cam kết cho cả hóa đơn.

**Nhịp trang.** Editorial thoáng: chữ lớn, khoảng trống rộng, nhịp thay đổi — ảnh lớn → chữ ngắn → cận cảnh → khối hướng dẫn gọn → một bữa ăn có người. Phần thực đơn và form phải **yên và rõ**: không trang trí chen vào chỗ khách đang đọc tên món hay gõ số điện thoại.

**Tám khối của trang chủ** (thứ tự theo brief 06/10/2026; ảnh và bố cục theo PR "trang chủ và thực đơn", 11/10/2026). Bề mặt của từng khối **giữ như đang chạy** — Khánh quyết ngày 11/10/2026: không đổi dải tối sang kem.

| # | Khối | Bề mặt | Hình | Bố cục |
|---|---|---|---|---|
| 1 | Màn đầu (`KhoiMoDau`) | kem | Ảnh `hero-vi-gas` (minh họa); tagline là một dải Beef Red gọn ngay dưới ảnh | Điện thoại: câu chính → mô tả → 2 nút → ảnh → dòng địa điểm. **Từ 360px ảnh đứng sau hai nút:** đỉnh ảnh cách đầu trang 551–606px (đo ở 360–430px, ba thứ tiếng), nên điện thoại thật — vùng nhìn cao khoảng 550–700px — ở màn hình đầu chỉ thấy mép trên của ảnh, cuộn một chút mới thấy cả ảnh. Kiểm thử chỉ chứng minh "đỉnh ảnh nằm trong màn hình đầu" ở cỡ thử (cao 740, 844, 932px), không chứng minh khách thấy cả ảnh. **Dưới 360px** phần chữ dài hơn cả một màn hình (cỡ thử 320 × 568px) nên ảnh lên ngay sau câu chính (đỉnh ảnh ở 303–317px) — không thì ảnh tải ngay (`loading="eager"`, `fetchpriority="high"`) nằm hẳn dưới màn hình đầu: trình duyệt ưu tiên tải một ảnh khách chưa thấy, và phép thử "ảnh dưới màn hình đầu phải lazy" đỏ. Từ 900px: chữ trái, ảnh phải, cân giữa theo chiều dọc; dòng địa điểm thành một hàng ngang dưới cả hai cột — địa chỉ và câu chỉ đường là một cặp dính nhau ở mọi trạng thái; có ngày mở (`ngay_khai_truong`) thì dòng ngày không xuống dòng, đứng ngang dòng địa chỉ, dòng trạng thái ngay dưới ngày. Không logo, không chữ đặt lên ảnh; khung ảnh không bóng đổ. Dải tagline có `aria-hidden` — trình đọc màn hình đọc tagline một lần, ở dòng hiệu của khối 2 |
| 2 | Ăn ở Beeftown thế nào? (`BaBuoc`) | kem | 3 biểu tượng: khay, nhãn, vỉ gas | Điện thoại xếp dọc, các bước cách nhau 24px; 600–899px mỗi bước một hàng (số bên trái, chữ bên phải); từ 900px ba cột, nét kẻ mảnh nối bước này sang bước sau. Số thứ tự 44 → 68px, không lấn tiêu đề của bước |
| 3 | Quầy chọn bò (`QuayChonBo`) | **tối** | Ảnh `bo-van-mo-can` (minh họa vân thịt — không phải ảnh khay hay quầy); thẻ "Cách đọc nhãn khay" | Ảnh trái, chữ phải; thẻ nhãn ở dưới, rộng tối đa 880px |
| 4 | Cả bữa, cho cả bàn (`BuaAnCungNhau`) | kem đậm | Ảnh `mon-an-chia-se` (minh họa) | Lời mở và nút "Xem thực đơn" (nút nằm sát đoạn giới thiệu) bên trái, ảnh bên phải; danh sách nhóm món thành một dải ngang phía dưới. Điện thoại: lời mở → nút → ảnh → danh sách |
| 5 | Rủ cả nhà, cả nhóm cùng đến (`DiCungNhom`) | **đỏ** | Ảnh `bua-an-cung-ban` (minh họa) | Ảnh trái, chữ phải (so le với khối 4); nút ngay sau đoạn giải thích; dải đỏ để phẳng — không mảng vân mỡ, không nét trang trí cạnh ảnh. Điện thoại: chữ → nút → ảnh |
| 6 | Beeftown ở tầng 3 (`LenTang3`) | kem | Số 3 và hình thang máy vẽ nét | Không đổi ở PR này |
| 7 | Câu hỏi thường gặp (`CauHoi`) | kem | Nét rosemary | Không đổi ở PR này |
| 8 | Chân trang (`ChanTrang`) | đỏ, dải pháp nhân tối | Logo Cream, tem tròn | Của layout, có ở mọi trang |

Hai ảnh bữa ăn (khối 4 và 5) có kim chi, mấy chén món phụ và bàn tay người: đó là **ảnh minh họa Khánh cho dùng** (11/10/2026 — bàn tay thì được, mặt người thì không). Câu chữ và alt của trang vẫn **không kể tên, không hứa món phụ nào**.

**Tránh:** mọi khối đều là ba thẻ giống nhau; pill / card ở mọi nơi; gradient tím xanh; kính mờ; hiệu ứng cuộn; bộ đen – vàng thay nhận diện; giọng fine dining xa cách; giao diện thiên về trẻ em.

### Trang Thực đơn — theo cuốn menu in "bản sáng"

Khánh chốt cuốn menu in **bản sáng** (Cuốn C nền sáng, artifact "Beeftown — Menu", Version 45) ngày 11/10/2026 và bảo đưa lên trang Thực đơn. Trang **không** đưa nguyên trang cuốn lên (giá trong cuốn là giá dummy, nhiều chữ còn chờ chốt, ảnh khay là ảnh AI): món vẫn đọc từ `thuc_don_cong_khai()` và chỉ món **đã công bố** mới hiện (`THUC-DON.md`); trang chỉ mượn cách trình bày của cuốn. Ba phần là ba tab (không JavaScript thì ba link neo, cả ba phần cùng hiện):

| Phần | Bề mặt | Chưa công bố món nào (trạng thái ngay sau deploy) | Đã công bố món |
|---|---|---|---|
| Bò tại quầy | **tối** (Khánh giữ ngày 11/10/2026) | Lời giải thích, ảnh `bo-cat-lat`, thẻ "Cách đọc nhãn khay" | Như trên, thêm nhóm "Gọi thêm tùy chọn": Set 4 sốt (S01) có ảnh `mon-set-4-sot` — ảnh tách nền đặt thẳng trên nền tối vẫn rõ (khay đen có viền sáng, rau và sốt nổi màu); tên nhóm cỡ tiêu đề nhỏ như nhóm bò bên cạnh |
| Món ăn | kem | Cột trái: tiêu đề, đoạn dẫn, ảnh `sot-cham`; cột phải: sáu nhóm của cuốn bằng chữ (Salad, Món thêm, Canh, Cơm, Mì, Lẩu) | Đầu phần trải ngang, rồi từng nhóm **dùng hết bề ngang khung** theo kiểu trang của cuốn (`ThucDonNhomAnh`). Ảnh `sot-cham` không còn ở trạng thái này: món đã có ảnh riêng, thêm một ảnh không khí chỉ chen vào giữa tiêu đề và món |
| Đồ uống | kem đậm | Cột trái: tiêu đề, đoạn dẫn, ảnh `uong-khong-con-ba-ly`; cột phải: Nước ép & ade, Nước ngọt, Nước suối — Highball, Soju, Makgeolli, Bia chỉ khi công tắc `hien_do_uong_co_con` bật | Cột trái như cũ (ảnh ba ly không cồn nhắc được ở mọi trạng thái); cột phải: nhóm có ảnh (ba ly signature, ba thẻ ngang nhau) trước, nhóm danh sách (highball, bia…) gọn như cũ sau. Đồ uống có cồn vẫn sau công tắc |

**Một nhóm kiểu cuốn** (`ThucDonNhomAnh.astro`, chữ của từng món `ThucDonMon.astro`):

- **Tên nhóm** chữ hoa, đậm 800, cỡ `--co-nhom` 28 → 40px — to hơn h2 (26 → 36px) để nhóm đọc như tiêu đề trang của cuốn, không bao giờ to hơn h1 (32 → 48px); màu nhấn của bề mặt (Beef Red trên kem, đỏ đậm trên kem đậm). Ngay dưới: **câu của nhóm** (cuốn in dưới tiêu đề trang), đậm 700, cỡ `--co-dan`, màu chữ chính — chép nguyên văn cuốn vào `CAU_NHOM` (`src/lib/thuc-don.ts`, khóa theo mã nhóm; database không có cột này). Nhóm không có câu (Món đặc trưng, đồ uống, nhóm mới) thì không in gì.
- **Món dẫn đầu** là món đầu tiên database trả (`thu_tu` nhỏ nhất — migration 0091 xếp món to nhất trang của cuốn lên đầu). Từ 768px: tên nhóm, câu và chữ của món ở cột trái; ảnh lớn (tối đa 560px) ở cột phải, như trang của cuốn. Điện thoại: tên nhóm → ảnh → chữ.
- **Các món còn lại**: lưới thẻ ảnh trên, chữ dưới, thẳng lề trái — 1 cột dưới 600px, 2 cột từ 600px, 3 cột từ 1024px khi còn từ ba món (nhóm Mì); còn hai món thì hai cột như trang Salad của cuốn, ảnh tối đa 460px để thẻ nhỏ vẫn nhỏ hơn ảnh dẫn đầu. Nhóm **đúng hai món** (Món đặc trưng): hai thẻ ngang nhau như tờ kẹp của cuốn. Ba ly signature: ba thẻ đều; điện thoại một cột, ảnh ly tối đa 220px.
- **Tên món chữ thường, đậm 700** (không chữ hoa như cuốn): tên món là thứ khách đọc kỹ, tên dài ("Cơm trộn tartare bò cay", "Signature spicy cold noodles") viết hoa khó đọc và cần dòng cao hơn cho dấu chồng; tiếng Hàn không có chữ hoa, nên ba thứ tiếng cùng một nhịp. Chữ hoa chỉ dành cho tên nhóm. Món dẫn đầu tên 1,25 lần `--co-h3`.
- Không giá (`gia` null → không phần tử giá), không độ cay, không sao "Nên thử" — số trong cuốn là số giả lập. Nhãn Món sống / Có cồn và câu cảnh báo món sống như dòng món cũ.
- Thẻ chịu được dữ liệu sau này: món không ảnh (thẻ chỉ có chữ, không khung thay thế), mô tả bốn câu (tartare), tên rất dài, nhóm lạ chưa có câu — kịch bản `thuc-don-thu-suc` của `kiem-tra/gia-supabase.mjs`, `kiem-tra/thu-day-du.mjs` nhóm 11 đo ở 320 → 1440px.

### Từ PDF tới web

| Trang PDF | Chất liệu trong PDF | Trên web | Ghi chú |
|---|---|---|---|
| 1–4 | Đầu bò + miếng steak (brandmark), wordmark ngang, biến thể logo, khoảng trống quanh logo | `logo-ngang-do` ở đầu trang (rộng 160px, màn rộng 172px — lockup tối thiểu 160px theo guideline) và thẻ "Đọc nhãn khay"; `logo-ngang-kem` ở chân trang; `dau-bo-kem` thành biểu tượng trình duyệt | Vector trích nguyên, không gõ lại chữ BEEFTOWN, không vẽ lại bằng AI. Đầu trang nền kem nên dùng đúng biến thể cho nền kem — không đặt khối kem lạc lõng lên nền tối |
| 2 | Mảng vân mỡ organic: đỏ Beeftown trên đỏ đậm | `.nen-van-mo`: khối cuối trang Thực đơn và Đến Beeftown; góc mỗi khung ảnh (`van-mo-gan`, độ đậm 7 %); ảnh chia sẻ dự phòng. **Không còn ở trang chủ**: màn đầu và dải đỏ "Đi cùng nhóm" nay có ảnh, mảng vân mỡ tranh với ảnh nên bỏ | Tạo nhịp và chiều sâu, không phủ lên chữ, không đứng cạnh ảnh |
| 3 | Nét rosemary (5 nhánh), nét miếng steak (2) | `.net` tô bằng `--net-ve`: góc đầu trang con và FAQ (rosemary 5), khối Quầy chọn bò từ 1200px (steak 1), khối cuối Đến Beeftown (steak 2). Ba bước nay nối bằng nét kẻ mảnh; màn đầu và "Đi cùng nhóm" là ảnh | Tiết chế: cùng nét, cùng màu, vài điểm mỗi trang |
| 1, 5 | Hệ màu thực phẩm ấm | Token theo vai — mục 2 | Mã màu trên trang công khai theo bảng Khánh chốt 09/10/2026, không còn theo mã của PDF; `tao-bieu-tuong.py` đổi mã của PDF sang bảng đó khi chép SVG (bảng `DOI_MAU`) |
| 1, 6 | Hypo-me Bold, NVN Beloved Bold, Montserrat | Chỉ Montserrat — mục 3 | Hai phông display chưa có file và giấy phép |
| 7–8 | Mockup biển hiệu, đồng phục | **Chỉ tham chiếu** cách thương hiệu hiện diện trong ánh sáng ấm. Tagline ở màn đầu là một dải Beef Red một dòng ngay dưới ảnh | Không coi là ảnh nhà hàng hay nhân sự thật. Mặt tiền tầng trệt trong mockup **không phải** lối vào thật — Beeftown ở tầng 3 |
| 9–10 | Ảnh thịt, thớt, muối, tiêu; menu mockup; phối ảnh với nền đỏ / kem | **Chỉ tham chiếu** góc chụp, chất liệu thớ thịt, cách đặt ảnh trên nền đỏ — dùng cho brief chụp (mục 8) | **Không dùng:** giá 400.000 lặp ở trang 10, câu "Thịt chuẩn - Giá thật" (trang 9), mặt tiền mockup (trang 7), hình than (ô màu Charcoal trang 5, ảnh nướng trang 1). Tên phần cắt trong mockup không phải thực đơn đã chốt. Ảnh stock trong PDF chưa có quyền dùng |
| 11 | Tem tròn, nhịp lặp wordmark, bao bì | `tem-tron` ở chân trang và trạng thái "đã nhận" của Hỏi bàn (màn đầu không còn: không đặt logo, tem cạnh ảnh) | Không kéo mockup bao bì lên trang như nội dung bán hàng. Chữ BEEFTOWN lặp (`hoa-van-chu`) **không còn dùng trên trang**: đợt redesign bỏ nó khỏi chân trang (trên đỏ mới nó nhạt và lem, làm chữ khó đọc); file SVG còn trong `public/thuong-hieu/` cho ấn phẩm |

Tên màu `--than` (Charcoal) chỉ là tên màu. Beeftown nướng bằng **vỉ gas**; chữ "than hoa", "than củi", "charcoal", "숯" bị cấm trên mọi trang (`src/lib/chuoi-cam.js`).

---

## 2. Màu theo vai

> **Trang công khai** (`<body class="ck">`) dùng bảng màu thương hiệu Khánh chốt ngày 09/10/2026 (`THUONG-HIEU.md` ở thư mục gốc), cùng các màu pha cho màn hình Khánh cho phép ngày 10/10/2026. **`/noi-bo` và kho dùng cùng bảng đó từ ngày 12/10/2026**: chúng đọc khối `:root` của `src/styles/chung.css`, nay cùng giá trị với khối `.ck` — phần riêng của hai nơi đó ghi ở cuối mục này. Beeftown Cân chưa đổi.

Màu chữ theo **bề mặt**, không theo từng chỗ: mỗi khối khai một lớp bề mặt, mọi thứ bên trong đọc biến của bề mặt đó. Thêm khối mới chỉ cần chọn bề mặt, không phải tự chọn màu chữ — và không ai lỡ tay đặt chữ vàng lên nền kem.

### Token của trang công khai

Khai trong khối `.ck` đầu tiên của `src/styles/cong-khai.css`, mỗi biến đúng một lần. `crm/test/test-cong-khai-giao-dien.mjs` nhóm 6 chép tay từng mã và đỏ khi có mã nào lệch. Hai khối `:root` của `src/styles/chung.css` khai **cùng các biến này, cùng giá trị** cho `/noi-bo` và kho; hai nơi chưa gộp, nên đổi một mã là đổi cả hai (`crm/test/test-noi-bo-bang-mau.mjs` nhóm 1 so hai khối với nhau).

| Token | Mã | Tên trong guideline | Vai |
|---|---|---|---|
| `--kem` | `#F0E3D0` | Cream | Nền đọc mặc định; chữ trên nền tối và nền đỏ |
| `--kem-sau` | `#EBDCC6` | màu pha | Nền khối phụ nhẹ (`.be-kem-sau`, `.muc-sang` của trang cũ) |
| `--kem-dam` | `#E7D5BC` | màu pha | Nền khối phụ đậm hơn (`.be-kem-dam`): Cả bữa ở trang chủ, khối Tầng 3 của trang Đến Beeftown, một nhóm của trang Thực đơn |
| `--do` | `#A70C0C` | Beef Red | Nút chính, nhãn, dải đỏ, chữ nhấn cỡ thường trên kem |
| `--do-dam` | `#890607` | màu pha | Nút khi di chuột / đang gửi; chữ báo lỗi dưới ô nhập |
| `--do-sau` | `#890607` | màu pha, cùng mã với `--do-dam` | Chữ nhấn rất nhỏ (≤ 13px) trên kem; chữ nút trên nền đỏ; nét artwork trên kem; khung ảnh trên nền đỏ |
| `--than` | `#151008` | Charcoal | Chữ chính trên kem; nền dải tối |
| `--muc-nhat` | than 68 % | màu pha | Chữ phụ trên kem |
| `--da` | `#B8A98C` | Warm Stone | **Chỉ** chữ phụ trên nền tối |
| `--cuc-vang` | `#F5AA14` | Marigold | Vòng focus trên nền tối |
| `--mu-tat` | `#F5AA14` | Marigold (tên biến cũ, cùng mã) | Điểm nhấn nhỏ: vạch dòng trạng thái, chữ nhấn trên nền tối |
| `--vien-o` | `#7A7366` | màu pha | Viền ô nhập: 3,71 : 1 với nền Cream của ô, 3,49 : 1 với thẻ kem sau quanh ô (mức tối thiểu cho viền ô là 3 : 1, WCAG 1.4.11) |
| `--vach` · `--vach-kem` | than 16 % · kem 22 % | màu pha | Nét kẻ phân cách trên nền sáng · trên nền tối |
| (không có token) | `#211A10` | màu pha | Nền của khung ảnh đặt trên dải tối (`.khung-anh.tren-toi`) và nền chờ của ảnh trên dải tối lúc ảnh chưa về (`.anh.tren-toi`), cả hai trong `cong-khai.css`: sáng hơn Charcoal một nấc để khung tách khỏi nền. Mã viết thẳng, chỉ dùng ở hai chỗ đó |

Guideline có 5 màu, một đỏ và một vàng. Màn hình cần thêm: 1 đỏ đậm hơn cho nút khi di chuột và chữ nhỏ, 2 nền kem đậm hơn để tách khối, 1 màu viền ô nhập. Hai tên `--do-dam` / `--do-sau` và hai tên `--mu-tat` / `--cuc-vang` giữ lại vì component đang gọi cả hai; mỗi cặp một mã.

**Không có màu trắng.** Bảng màu thương hiệu không có trắng, nên trang công khai không có nền trắng nào: thẻ là kem sau trên nền kem (Cream trên nền kem sau, kem đậm, đỏ), ô nhập và ô chọn giờ nền Cream, ô đánh dấu tự vẽ (ô của hệ thống nền trắng). Chỗ duy nhất còn trắng, có chủ đích: bản in ra giấy (`@media print`). Thẻ "Đọc nhãn khay" trước đây trắng ngà, nghiêng, có bóng — PR "trang chủ và thực đơn" đã dựng lại: thẻ `.the` nền Cream trên dải tối, đặt thẳng, không bóng. `web/kiem-tra/do-giao-dien.mjs` đo màu nền của mọi phần tử trên trang đã dựng, không còn ngoại lệ nào (nền chờ của khung ảnh cũng là màu của bảng — kem đậm, `#211A10` trên dải tối, đỏ đậm trên dải đỏ — không dùng màu trung bình của ảnh); `crm/test/test-cong-khai-giao-dien.mjs` nhóm 7 chặn mã màu ngoài bảng trong mã nguồn.

`--kem-sau` và `--kem-dam` khác đề xuất ban đầu trong `THUONG-HIEU.md` (`#E7D5BC` và `#DAC5AA`): `#DAC5AA` làm dải "Cả bữa" sẫm hơn hẳn thiết kế đang chạy, nên hai bậc kem lùi lại một nấc để giữ độ chênh sáng giữa các khối gần với trước.

### Bề mặt (đặt lên `<section>`)

| Lớp | Nền | Chữ chính | Chữ phụ | Chữ nhấn | Nút chính | Vòng focus | Nét artwork |
|---|---|---|---|---|---|---|---|
| `.be-kem` (mặc định) | kem | than | `--muc-nhat` | đỏ (nhỏ: đỏ đậm) | đỏ, chữ kem | than | đỏ đậm |
| `.be-kem-sau` | kem sau | than | `--muc-nhat` | đỏ (nhỏ: đỏ đậm) | đỏ, chữ kem | than | đỏ đậm |
| `.be-kem-dam` | kem đậm | than | `--muc-nhat` | **đỏ đậm** (7,00 : 1; đỏ thường trên nền này 5,42 : 1) | đỏ, chữ kem | than | đỏ đậm |
| `.be-toi` | than | kem | Warm Stone | Marigold | đỏ, chữ kem | Marigold | kem |
| `.be-do` | đỏ | kem | kem | kem | **kem, chữ đỏ đậm** | kem | kem |

Nút phụ (`.nut-vien`) cũng theo bề mặt, qua `--nut-phu-nen` / `--nut-phu-chu`: trên ba bề mặt kem là **nền Cream, chữ và viền Beef Red** (di chuột: nền kem đậm, chữ và viền đỏ đậm); trên dải đỏ và dải tối là **viền và chữ Cream**, nền trong (di chuột: phủ 12 % Cream). Thẻ `.the` tự là một bề mặt sáng: đặt trong dải nào nó cũng đặt lại biến chữ và nút như `.be-kem`.

### Tương phản (WCAG 2.2, đã tính)

| Cặp | Tỷ lệ | Dùng được cho |
|---|---|---|
| than / kem · kem sau · kem đậm | 14,96 · 14,05 · 13,20 : 1 | mọi chữ |
| `--muc-nhat` / kem · kem đậm | 5,92 · 5,61 : 1 | chữ phụ |
| đỏ / kem · kem sau · kem đậm | 6,15 · 5,77 · 5,42 : 1 | chữ thường, nút |
| đỏ đậm / kem · kem sau · kem đậm | 7,93 · 7,45 · 7,00 : 1 | chữ rất nhỏ, nhãn món, câu lỗi dưới ô nhập |
| kem / đỏ · đỏ đậm | 6,15 · 7,93 : 1 | chữ trên dải đỏ; chữ nút khi di chuột |
| kem / than | 14,96 : 1 | chữ trên dải tối |
| Warm Stone / than | 8,19 : 1 | chữ phụ trên tối |
| Marigold / than | 9,59 : 1 | chữ nhấn, focus trên tối |
| Marigold / đỏ | 3,94 : 1 | chỉ chữ lớn hoặc hình, không chữ thường |
| viền ô / kem · kem sau · kem đậm | 3,71 · 3,49 · 3,27 : 1 | viền ô nhập (cần ≥ 3 : 1): ô nền kem, đứng trong thẻ kem sau |
| `--muc-nhat` / kem sau | 5,80 : 1 | gợi ý dưới nhãn trong thẻ form |
| đỏ đậm / kem đậm · kem / đỏ pha 12 % kem | 7,00 · 5,27 : 1 | chữ nút phụ khi di chuột: trên kem · trên dải đỏ |
| **đỏ / than** | **2,43 : 1** | **KHÔNG đặt chữ đỏ trên dải tối** |
| **Warm Stone / kem · Marigold / kem** | **1,83 · 1,56 : 1** | **KHÔNG BAO GIỜ làm chữ trên nền kem** |

Nhãn "Ảnh minh họa" nằm trên ảnh nhưng có nền riêng (chữ Cream trên Charcoal 78 %), nên đọc được trên vùng ảnh nào cũng vậy: nền nhãn đặt lên vùng ảnh **trắng tinh** (trường hợp tệ nhất) cho 7,58 : 1, lên vùng màu kem cho 8,29 : 1. `crm/test/test-cong-khai-anh.mjs` nhóm 4 tính lại hai con số này từ CSS; `do-giao-dien.mjs` (phép đo `anh`) tính trên nhãn của từng ảnh ở trang đã dựng.

`npm run thu-trinh-duyet` đo tương phản của chữ trên nền đặc ngay trên trang đã dựng, ở 9 cỡ màn hình (320 → 1440px).

### Tỷ lệ

Trang đang chạy vào khoảng **kem 60 % / tối 25 % / đỏ 12 % / vàng 3 %** — tỷ lệ gợi ý của brief 06/10/2026. Guideline ghi Cream 60 % / Beef Red 25 % / Charcoal 10 % / Marigold dưới 5 %. **Khánh quyết ngày 11/10/2026: website giữ như đang chạy** — không đổi dải tối sang kem ở "Quầy chọn bò" (trang chủ), "Bò tại quầy" (Thực đơn) hay chỗ nào khác (`THUONG-HIEU.md` mục 3). Kiểm thử giữ bề mặt của từng khối (`crm/test/test-cong-khai-anh.mjs` nhóm 5; phép đo `trangChu`, `thucDon` của `do-giao-dien.mjs`). Các con số trên là ước lượng, chưa đo trên ảnh chụp toàn trang. Vàng chỉ là vạch, chấm, chữ nhấn nhỏ trên nền tối; không có khối vàng.

### `/noi-bo` và kho — cùng bảng từ ngày 12/10/2026

File này là tài liệu của trang công khai; phần dưới chỉ ghi điều người sửa trang công khai cần biết về hai nơi kia. Luật dựng màn nội bộ: skill `.claude/skills/thiet-ke-beeftown/` (file `tham-khao/noi-bo-va-kho.md`); mã và tương phản đầy đủ: `THUONG-HIEU.md` mục 4.

- **Cùng token, khai ở nơi khác.** `/noi-bo` và kho không có lớp `.ck`: chúng đọc hai khối `:root` của `chung.css`. Hai khối đó mang đúng các giá trị ở bảng "Token của trang công khai". `test-cong-khai-giao-dien.mjs` nhóm 2 chép tay 13 biến gốc của `:root`; `test-noi-bo-bang-mau.mjs` chép đủ 14 biến màu và so với khối `.ck`. Đổi một mã ở khối `.ck` mà quên `:root` (hay ngược lại) là kiểm thử đỏ.
- **Không có hệ bề mặt, và cũng không có trắng.** Nội bộ và kho chỉ có nền sáng và đầu trang Charcoal: hai bề mặt khai trên `.nb-than` — nền trang `--nb-nen` (kem sau) và thẻ, thanh, menu, ô nhập `--nb-the` (Cream). Cách xếp ngược trang công khai (thẻ kem sau trên nền Cream) mà giống khối thẻ đặt trên dải kem sau: màn nội bộ dày thẻ, thẻ sáng hơn nền thì đọc dễ hơn. Trên thẻ Cream: chữ than 14,96 : 1, chữ phụ `--muc-nhat` 5,92, chữ đỏ 6,15, viền ô nhập 3,71. Marigold và Warm Stone trên thẻ Cream chỉ 1,56 và 1,83 : 1 — không làm chữ hay biểu tượng ở đó.
- **Thêm màu trạng thái** (xanh = xong, vàng = lưu ý, đỏ nhạt = làm ngay), khai một lần trên `.nb-than` của `src/styles/noi-bo.css`: `--xanh`, `--xanh-nen`, `--xanh-vien`, `--vang-chu`, `--vang-nen`, `--vang-vien`, `--do-nen`, `--do-vien`. Đây là màu chức năng của công cụ, không thuộc năm màu thương hiệu: **không dùng ở trang công khai**.
- **Token của kho** (`--kho-nen`, `--kho-the`, `--kho-vach`, `--kho-vach-dam` trên `.kho-than`) không phải sắc riêng: chúng trỏ về `--nb-nen`, `--nb-the`, `--vach`, `--da`.
- **Còn màu cũ:** Beeftown Cân (`can-app/src/giao-dien.html`, `huong-dan.html` — PR riêng, kèm phiên bản mới) và 15 ảnh chụp trong trang hướng dẫn của kho (`public/kho/hd-*.png`), chờ chụp lại.

---

## 3. Chữ

- **Một họ phông: Montserrat** (Google Fonts, giấy phép OFL) ở bốn độ đậm: **400** chữ chạy; **600** điều hướng, nhãn ô, chú thích; **700** tiêu đề, nút, tên món; **800** tên thương hiệu (`.ten-thuong-hieu`), số lớn của ba bước và tên nhóm món của trang Thực đơn.
- **Tiếng Hàn:** trang `/ko` tải thêm Noto Sans KR, xếp ngay sau Montserrat (chữ Latin vẫn là Montserrat), `word-break: keep-all` để không cắt giữa một từ, tiêu đề không siết chữ và dòng thoáng hơn (1,28). Cỡ chữ thì như tiếng Việt và tiếng Anh ở mọi bề rộng — không co riêng: h1 **32/41px → 48/61px**. Câu chính trang chủ tiếng Hàn vì vậy xuống bốn dòng ở màn dưới 375px (như bản tiếng Việt), ba dòng từ 375px.
- **Logo luôn là vector gốc** từ PDF — không bao giờ gõ chữ BEEFTOWN bằng phông nào.
- **Phông display chưa dùng:** trang 1 của PDF ghi Hypo-me Bold, trang 6 ghi NVN Beloved Bold. Chưa có file phông và giấy phép dùng trên web, và chính tài liệu chưa rõ hai tên đó có phải một phông. Cần: file phông (WOFF2 hoặc OTF) + giấy phép web ghi rõ phạm vi (số lượt xem, tên miền). Khi có, chỉ dùng cho điểm nhấn (câu chính màn đầu, số ba bước), không dùng cho chữ chạy, và phải hiện đủ dấu tiếng Việt. Không tự thay bằng một phông "vui" ngẫu nhiên.

### Thang chữ

| Biến | Cỡ | Dùng cho |
|---|---|---|
| `--co-h1` | 32 → 48px (`clamp`; 32px tới 390px, 48px từ 1280px), dòng 1,17: **32/38px → 48/56px**. Tiếng Hàn cùng cỡ, dòng 1,28: 32/41px → 48/61px | Câu chính màn đầu và tiêu đề đầu trang con — một cỡ cho mọi trang, mọi thứ tiếng |
| `--co-h2` | 26 → 36px, dòng 1,2 | Tiêu đề khối — luôn nhỏ hơn h1 |
| `--co-h3` | 18 → 20px | Tiêu đề nhỏ; tên món trên trang Thực đơn |
| `--co-nhom` | 28 → 40px (28px tới 390px, 40px ở 1440px), đậm 800, chữ hoa | Tên nhóm món của trang Thực đơn (kiểu tiêu đề trang của cuốn menu bản sáng) — giữa h2 và h1, không bao giờ to hơn h1 |
| `--co-dan` | 18 → 20px | Đoạn dẫn (`.dan`), tối đa 58 ký tự một dòng; câu dưới tên nhóm món (đậm 700) |
| `--co-than` | **16px, dòng 24px** ở mọi bề rộng | Chữ chạy |
| `--co-nho` | 14px | Chữ phụ (`.nho`), gợi ý dưới ô |
| `--co-ti` | 13px | **Sàn** — nhãn. Không chữ nào nhỏ hơn, trừ dòng nhỏ viết hoa (`.hieu`, nhãn món — 12px, đậm, giãn chữ). Chân trang có sàn riêng: 14px |
| `--co-so` | 44 → 68px | Số thứ tự của ba bước — không quá 3,6 lần cỡ tiêu đề của bước (bản trước tới 104px, lấn nội dung) |

Thang chữ này theo plan redesign ngày 11/10/2026 (mục 4): chữ chạy 16/24px, tiêu đề chính 32/38px trên điện thoại và 48/56px trên máy tính. Bản trước dùng chữ chạy 17px và h1 tới 76px; h1 thu lại nên h2 và h3 thu theo để giữ thứ bậc. Câu hỏi thường gặp 17 → 18px đậm; nhãn ô nhập 15px đậm; điều hướng đầu trang 16px.

Tiêu đề lớn: `line-height` không dưới 1,08 — dấu chồng tiếng Việt (ễ, ậ) cần chỗ, 1,02 cắt dấu. `text-wrap: balance` cho tiêu đề, `pretty` cho đoạn văn.

**Bẫy chữ dính:** Astro 7 bỏ khoảng trắng có xuống dòng giữa hai nút — xem `README.md`, mục "Bẫy khi tách câu". `cd crm && node test/dinh-chu.mjs ../web/src/components/<file>.astro` phải báo 0 chỗ cho mọi component công khai (`crm/test/test-cong-khai-dinh-chu.mjs` quét cả bộ trong `npm test`).

---

## 4. Khoảng cách, khung, mốc màn hình

| Biến | Giá trị |
|---|---|
| `--k-1` … `--k-10` | 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128px |
| `--le` (lề hai bên) | `clamp(20px, 5vw, 40px)` — 20px tới màn 400px; từ đó lớn dần theo 5 % bề rộng (430px: 21,5px · 599px: 30px), 40px từ 800px. Phép đo `chu` và `nhanKhay` của `do-giao-dien.mjs` tính lề theo đúng công thức này |
| `--muc-dem` (đệm trên dưới một khối `.muc`) | `clamp(56px, …, 96px)` — 56px ở 390px, 96px ở 1440px (plan: 48–64px trên điện thoại, 72–96px trên máy tính) |
| `.khung` / `.khung-hep` | rộng tối đa 1200px / 760px, cộng lề |
| `--cao-dau` (đầu trang dính, tính cả nét kẻ dưới) | 64px; 80px từ 1080px |
| `--cham` | 48px — chiều cao tối thiểu của mọi thứ bấm được |
| `--dem-the` | đệm của thẻ: 20px; 24px từ 600px |
| `--bo` / `--bo-anh` | bo góc 4px (nút, ô) / 6px (ảnh, thẻ) — không bo tròn kiểu viên thuốc |
| `--nhanh` | 180ms cho mọi chuyển màu |

**Mốc màn hình:** dưới 360px — điện thoại rất nhỏ, hoặc máy tính phóng to 400 % — đầu trang dùng brandmark và màn đầu trang chủ đưa ảnh lên ngay sau câu chính; dưới 400px ẩn bớt trang trí (`.an-khi-hep`); **600px** điện thoại → máy tính bảng (ảnh đổi từ khung dọc sang khung ngang, thẻ đệm 20 → 24px, hàng nút thôi xếp dọc); **768px** bộ chọn ngôn ngữ và nút Hỏi bàn lên thanh đầu trang (mốc riêng của `DauTrang.astro`); **900px** bố cục hai cột; **1024px** màn rộng; **1080px** đầu trang hiện đủ điều hướng (dưới mốc này là menu gọn). Kiểm ở 360 / 390 / 768 / 1024 / 1440px.

Không dùng `100vw` (tính cả thanh cuộn → tràn ngang). Khối có trang trí lấn mép đặt `.co-trang-tri` (`overflow: clip`).

---

## 5. Thành phần

**Nút** (`.nut` + `.nut-chinh` | `.nut-vien`, bản gọn `.nut-nho`). Cao tối thiểu **48px**, đệm ngang 20px (bản gọn trên thanh đầu trang: 16px, chữ 15px), bo 4px, chữ 16px đậm, biểu tượng 24px. **Nút chính:** nền Beef Red, chữ Cream; di chuột nền đỏ đậm `#890607`. **Nút phụ:** nền Cream, chữ và viền Beef Red; di chuột nền kem đậm, chữ và viền đỏ đậm. **Trên dải đỏ:** nút chính nền Cream chữ đỏ đậm, nút phụ viền và chữ Cream. **Mỗi nhóm nút (`.hang-nut`) chỉ một nút chính.** Di chuột: đổi màu trong 180ms, không phóng to, không bóng đổ. **Kiểu di chuột (`:hover`) của mọi nút, link trên trang công khai nằm trong `@media (hover: hover)`** — trên màn cảm ứng, chạm xong thì phần tử vẫn bị coi là "đang di chuột" tới khi khách chạm chỗ khác, nút vừa đóng mà trông như đang mở. Phản hồi lúc chạm là `:active` (cùng màu với di chuột), đặt ngoài khối đó. **Đang gửi / khóa** (`aria-busy="true"`, `:disabled`): nền đỏ đậm, chữ kem — tối đi chứ không mờ đi, vì mờ thì tụt tương phản. Dưới 600px các nút trong `.hang-nut` xếp dọc, rộng hết khung. Nút hay link tới `/dat-ban` luôn ghi **"Hỏi bàn" / "Ask for a table" / "테이블 문의"** (`t.datBan`).

**Thẻ** (`.the`; thẻ form của Hỏi bàn `.hb-the` theo cùng quy tắc). Nền kem sau trên trang kem, Cream trên nền kem sau / kem đậm / đỏ; viền mảnh 1px `--vien`, bo 6px; đệm 20px trên điện thoại, 24px từ 600px (`--dem-the`); **không bóng đổ, không nền trắng**. Thẻ phải nhìn ra là thẻ: nền khác nền phía sau, hoặc viền tương phản với nền phía sau ít nhất 1,35 : 1 (nét `--vach` cho 1,40 : 1; Charcoal 12 % trở xuống là không đủ). Thẻ cần nhấn (lời dặn tầng 3, "đã nhận yêu cầu") thêm một vạch đỏ 4px ở một cạnh. Không còn ngoại lệ: thẻ "Đọc nhãn khay" cũng là một thẻ `.the`.

**Thứ bậc nút ở màn đầu** (`nutMoDau()` trong `src/lib/trang-cong-khai.ts`): form hỏi bàn mở → "Hỏi bàn" chính, "Khám phá thực đơn" phụ; chưa mở → "Khám phá thực đơn" chính, "Hỏi bàn" phụ khi có kênh thật (Facebook, hotline, email), không thì nút phụ "Xem đường lên tầng 3" dẫn sang trang Đến Beeftown.

**Liên kết có mũi tên** (`.lien-ket` + `<BieuTuong ten="mui-ten" />`): chữ đậm gạch chân, vùng chạm cao 48px, mũi tên 24px màu nhấn của bề mặt (Beef Red trên kem, Cream trên đỏ), nhích 3px khi di chuột. Dùng cho "Xem thực đơn →", không đóng hộp.

**Đầu trang** (`DauTrang.astro`): nền Cream, cao **64px**, từ 1080px cao **80px** (tính cả nét kẻ dưới). Logo đỏ trên kem rộng 160px (màn rộng 172px); dưới 360px — điện thoại rất nhỏ, hoặc máy tính phóng to 400 % — thanh đổi sang brandmark đầu bò 48px (`dau-bo-do.svg`), đúng luật "hẹp hơn 160px thì dùng brandmark" của guideline. Điều hướng **Trải nghiệm / Thực đơn / Đến Beeftown** chữ 16px, mục đang mở có `aria-current="page"`, đổi màu và có gạch dưới; **Hỏi bàn** là nút đỏ cao 48px. **Bộ chọn ngôn ngữ** in đủ ba thứ tiếng theo thứ tự cố định (Tiếng Việt · English · 한국어), chữ 15px màu chữ chính; thứ tiếng đang xem không phải link, in **đậm và có nét gạch đỏ 2px** (`aria-current="true"`) — nhận ra được không cần nhìn màu. Ba bề rộng: dưới 768px thanh chỉ có logo và nút "Danh mục"; từ 768px thêm ngôn ngữ và Hỏi bàn; từ 1080px đủ điều hướng, không còn nút "Danh mục". **Menu gọn** là `<details>` — mở, đóng được khi không có JavaScript (bấm, Enter, phím cách). Đang mở thì nút thành nút đóng ("Đóng" / "Close" / "닫기", dấu ×), bảng nền Cream kết thúc bằng một nét đỏ (không bóng đổ). Trong bảng (điện thoại): ba link trang cao 56px, **Hỏi bàn là nút chính rộng hết bảng**, hàng ngôn ngữ, địa chỉ. Script thêm: Esc đóng và trả tiêu điểm về nút, bấm ra ngoài hoặc bấm một mục thì đóng, Tab ra khỏi mục cuối thì đóng; và **chỉ khi script đã chạy** (nó gắn `data-co-script` lên `<details>`) mới có lớp phủ tối dưới bảng — bấm vào là đóng — và trang phía sau mới đứng yên. Không có script thì không lớp phủ, không khoá cuộn: khách bấm link neo "Trải nghiệm" xong vẫn cuộn được trang. Khoá cuộn làm thanh cuộn kiểu cổ điển (Windows: 15px) biến mất: script đo bề rộng thanh cuộn ngay trước khi mở và quy tắc khoá cuộn bù lại đúng chừng đó (`padding-right: var(--rong-thanh-cuon, 0px)`), nên trang không xô lệch. **Không dùng `scrollbar-gutter: stable`**: nó chừa 15px cả trên trình duyệt không có thanh cuộn nào chiếm chỗ (trình duyệt của kiểm thử và của máy chụp ảnh) — mọi ảnh chụp thừa một dải kem bên phải.

**Chân trang** (`ChanTrang.astro`): dải tuyển dụng gọn → dải đỏ Beef Red nền phẳng (logo Cream, tem tròn, hai nhóm link — điện thoại xếp 2 cột — gồm bốn mục điều hướng và Tuyển dụng, Quyền riêng tư, Xóa dữ liệu; địa chỉ kèm câu chỉ đường; mạng xã hội khi đã công bố) → phần pháp nhân trên nền Charcoal. **Không còn chữ BEEFTOWN lặp chìm sau chữ.** Chữ trong chân trang không nhỏ hơn 14px (tên cột là chữ hoa nhỏ 14px; dòng pháp nhân 14px màu Warm Stone, dải cao theo nội dung); mọi link cao 48px. Pháp nhân là `<footer>` đầu tiên của trang và giữ nguyên từng ký tự (`kiem-tra/trinh-duyet.mjs` đọc nó). Dòng địa chỉ pháp nhân chép theo giấy đăng ký, **không phải** địa chỉ nhà hàng: sửa địa điểm không đụng dòng này (`crm/test/test-cong-khai-dia-diem.mjs` nhóm 5). Trang không đặt `<footer>` nào khác.

**Dòng trạng thái** (`.trang-thai`): vạch Marigold bên trái, chữ từ khóa `dong_trang_thai`; chưa công bố thì câu nền "đang chuẩn bị đón bạn".

**Dòng món** (`.mon`, `ThucDonNhom.astro` — nhóm dạng danh sách: bò tại quầy, đồ uống không có ảnh): tên Việt (`.mon-ten`, 18px đậm) → tên gốc (`.mon-goc`) → mô tả (`.mon-mo-ta`, chỉ khi đã duyệt) → nhãn **Món sống** / **Có cồn** (`.nhan-mon`, chữ hoa nhỏ đỏ đậm kèm biểu tượng 24px). Món sống luôn kèm câu cảnh báo (`.canh-bao-mon`); món sống thiếu câu cảnh báo thì không hiện món. Vùng giá (`.mon-gia`) chỉ có khi `gia !== null` và nhóm không phải "xem giá tại quầy" — `gia` null thì **không render phần tử giá**, không ô trống. Không tự thêm nhãn chay, dị ứng, độ cay, khẩu phần, combo.

**Thẻ món kiểu cuốn menu bản sáng** (`ThucDonNhomAnh.astro` + `ThucDonMon.astro`): tên nhóm chữ hoa 800 cỡ `--co-nhom`, câu của nhóm, món dẫn đầu chữ trái – ảnh phải từ 768px, các món còn lại lưới thẻ ảnh trên chữ dưới — chi tiết và lý do ở mục 1, "Trang Thực đơn". Cùng luật giá, nhãn, cảnh báo với dòng món. Ảnh theo mã món (`ANH_CUA_MON`, `src/lib/anh.ts`); món không có trong bảng thì thẻ chỉ có chữ.

**Đọc nhãn khay** (`NhanKhay.astro`): xem mục 1. Một thẻ `.the` (nền Cream trên dải tối, viền mảnh, đệm 20 / 24px), **đặt thẳng, không bóng đổ, không nền trắng**, rộng tối đa 880px. Đầu thẻ: logo cho nền kem rộng 160px (mức tối thiểu của lockup) và tiêu đề, dưới là một nét Beef Red 2px. Năm dòng cách nhau bằng nét đứt: số thứ tự trong chấm tròn đỏ 28px, tên trường 17px đậm, lời giải thích 16px; từ 600px ba thứ đó nằm trên một hàng, điện thoại thì lời giải thích xuống dưới tên trường. Thẻ là nội dung thật (không `aria-hidden`). Dùng chung ở khối Quầy chọn bò và phần Bò tại quầy của trang Thực đơn.

**Tầng 3** (`LenTang3.astro`): số "3" lớn cạnh hình thang máy vẽ nét, địa chỉ **Tầng 3, 63 Hồ Tùng Mậu, TP.HCM**, và câu chỉ đường (`t.loiLen` trong `lib/chu.ts`): **"Lối vào riêng ngay cạnh GS25, đi thang máy lên tầng 3."** Lối vào riêng cạnh GS25 là điều Khánh đã quyết (09/10/2026); địa điểm có thang máy là điều Khánh xác nhận ngày 11/10/2026; chữ của câu ở ba thứ tiếng là Claude đề xuất, chờ Khánh duyệt. Nút thang máy ghi số mấy cho tầng của quán thì chưa biết — trang không ghi số nút. Khối chỉ in hai điều đã biết đó — không chỗ gửi xe, mốc đường, số bước, lối cho xe lăn khi chưa có người xác nhận. "Chỉ đường" chỉ khi link Google Maps đã công bố; "Sao chép địa chỉ" là nút bổ trợ, không có JavaScript thì ẩn hẳn. Có bản gọn (`gon`) cho trang Hỏi bàn — khách phải biết lối vào **trước** khi gửi yêu cầu; bản gọn là một thẻ `.the` có vạch đỏ bên trái.

**Câu hỏi thường gặp** (`.cau-hoi` + `<details>` / `<summary>`): mỗi hàng là vùng bấm trên toàn chiều rộng, cao tối thiểu **56px**, chữ 17 → 18px đậm; biểu tượng 24px màu nhấn: **dấu cộng khi đóng, dấu trừ khi mở** (hai biểu tượng trong mã, CSS chọn theo `[open]`). Enter và phím cách mở / đóng; câu trả lời rộng tối đa 66 ký tự. Chỉ trả lời bằng dữ kiện đã xác nhận.

**Form** (`.o`): nhãn trên ô (15px đậm), gợi ý ngay dưới nhãn (`small`), **không dùng placeholder thay nhãn**. Ô nhập, ô chọn, ô ngày cao **đúng 48px** (ô ngày ghim `height: 48px` — Chromium tự cộng 2px cho phần chữ ngày; ô nhiều dòng từ 48px trở lên), chữ 16px (iPhone không tự phóng to), **nền Cream**, viền 1px `--vien-o`; focus viền đỏ 3px. Ô trình duyệt tự điền (`:autofill`) vẫn nền Cream, chữ Charcoal: Chrome và Safari tô nền riêng không ghi đè được bằng `background`, nên phủ bằng bóng trong màu Cream. Thẻ form nền kem sau `#EBDCC6` — viền ô đạt 3,71 : 1 với nền ô và 3,49 : 1 với thẻ. Ô đánh dấu tự vẽ 24px: nền Cream, đã chọn thì nền Beef Red và dấu ✓ Cream. **Lỗi sát ô:** `.loi-o` ngay dưới ô (chữ đỏ đậm `#890607`, luôn là một câu chữ), ô có `aria-invalid="true"` (viền đỏ đậm) và `aria-describedby` trỏ tới câu lỗi; sau khi gửi, khung kết quả hoặc khung lỗi nhận focus. Mất mạng hay database báo lỗi: dữ liệu đã gõ được giữ lại (trong thẻ trình duyệt đó, 15 phút) để khách gửi lại. Giờ chọn bằng nút radio dạng chip cao 48px: chưa chọn nền Cream, **đang chọn nền Beef Red, chữ Cream** kèm dấu ✓. Ô đồng ý nhận tin **không tick sẵn, không bắt buộc**. Bấm gửi → "Đang gửi…", nút khóa, chặn bấm đúp. Kết quả là **"đã nhận yêu cầu"** kèm tem tròn — nhà hàng kiểm tra rồi liên hệ xác nhận; không bao giờ "thành công".

**Ảnh** (`Anh.astro`, `.anh`): `<picture>` AVIF rồi WebP, khung riêng cho điện thoại (`khungNho`, dưới 600px) và màn rộng (`khung`), luôn có `width` / `height`. Khung `<figure>` **tự giữ đúng tỷ lệ của ảnh** (`aspect-ratio` qua `--ti-le` / `--ti-le-nho`) từ trước khi ảnh về — ảnh về chậm thì trang không xô lệch (`kiem-tra/trinh-duyet.mjs` nhóm 10). Nền chờ là màu của bảng theo dải đặt ảnh (`nenKhung`: kem đậm, `#211A10` trên dải tối, đỏ đậm trên dải đỏ). Bo góc 6px, **không bóng đổ, không viền**; không đặt logo hay chữ nào lên ảnh. Ảnh màn đầu `uuTien` (tải ngay, `fetchpriority="high"`) — mỗi trang nhiều nhất một ảnh như vậy, và nó phải nằm trong màn hình đầu; mọi ảnh khác lazy. Ảnh minh họa luôn có nhãn **"Ảnh minh họa"** / "Illustrative image" / "연출 이미지" (`.chu-thich-anh`: trong khung, góc dưới trái, chữ Cream 13px trên nền Charcoal 78 %) — component tự gắn, không ai quên được. **Ảnh tách nền** (`tachNen` trong `DANH_MUC_ANH` — ảnh món của trang Thực đơn): khung thêm lớp `.tach-nen` — trong suốt, không bo góc, món đặt thẳng lên nền của dải như trong cuốn; `tao-co-anh.py` chừa sẵn một dải trống 12–14 % chiều cao ở đáy khung, và nhãn nằm giữa đáy khung, trong dải đó — tức là ngay dưới món, không đè lên món (nhãn chỉ đổi chỗ; cỡ chữ, màu, nền riêng giữ nguyên). Ảnh chưa dựng cỡ → hiện `KhungAnh` thay vào, không bao giờ là thẻ `<img>` trỏ tới file không có.

**Khung ảnh** (`KhungAnh.astro`, `.khung-anh`): chỗ của ảnh chụp thật chưa có. Đúng tỷ lệ của ảnh sau này, nét vẽ cùng nét và cùng màu với rosemary, một mảng vân mỡ chìm ở góc; năm loại `quay`, `khay`, `thang-may`, `loi-vao`, `ban-nuong`; nền `kem` | `toi` | `do`. **Không có chữ nào bên trong** ("ảnh đang cập nhật"…) — khách không cần biết chuyện sản xuất. Thay bằng ảnh thật là đổi một thẻ, không đổi bố cục.

**Trang trí** (`.trang-tri`): đặt tuyệt đối, không bắt chuột, `aria-hidden="true"`. Nét một màu dùng mặt nạ CSS (`.net.huong-thao-1..5`, `.steak-1`, `.steak-2`) nên một file SVG tô được mọi màu qua `--net-ve`. Mảng vân mỡ `.nen-van-mo`. Chỉ vài điểm mỗi trang; danh sách món, form và chân trang không có.

**Biểu tượng** (`BieuTuong.astro`): mui-ten, menu, dong, cong, tru, khay, nhan, vi-gas, thang-may, nhom, ghim, sao-chep, da-chep, dien-thoai, tin-nhan, mon-song, co-con, cua — một bộ SVG vẽ trên lưới 24, **hiện ở cỡ 24px**, nét 1,5px **không co theo cỡ** (`vector-effect: non-scaling-stroke`), cùng họ với nét của `KhungAnh`. Không ngoại lệ về cỡ: biểu tượng của nhãn món cũng 24px. Màu theo bề mặt: **Beef Red trên kem, Cream trên đỏ**. Biểu tượng nằm trong thứ bấm được luôn đi kèm nhãn chữ. Không dùng emoji làm biểu tượng.

---

## 6. Tiếp cận

- **Focus:** viền 3px cách 3px, màu theo bề mặt (`--vong-focus`: than trên kem, Marigold trên tối, kem trên đỏ) — luôn thấy rõ.
- **Vùng chạm ≥ 48px** cho mọi thứ bấm được: nút, link điều hướng, link chân trang, liên kết có mũi tên, `summary`, ô nhập, ô chọn giờ, hàng ô đánh dấu; hàng câu hỏi 56px. `web/kiem-tra/do-giao-dien.mjs` đo trên trang đã dựng.
- **Bàn phím:** menu gọn và câu hỏi thường gặp mở / đóng bằng Enter và phím cách; Tab đi qua từng mục của menu, Esc đóng và trả tiêu điểm về nút; vòng focus thấy ở mọi mục (`trinh-duyet.mjs` nhóm 5 và 6).
- **Giảm chuyển động:** `prefers-reduced-motion` tắt mọi animation và transition (`chung.css`). Không có hiệu ứng khi cuộn.
- **Ảnh:** alt ba thứ tiếng trong `DANH_MUC_ANH` (`src/lib/anh.ts`) tả món, không nói đây là ảnh chụp tại quán. Trang trí, logo bên cạnh chữ "Beeftown" và khung ảnh: `alt=""` / `aria-hidden`.
- **Cấu trúc:** mỗi trang đúng một `h1`; tagline tiếng Anh trên trang tiếng Việt có `lang="en"`.
- **Không giấu nội dung sau JavaScript:** menu gọn chạy bằng `<details>`, không script thì không lớp phủ và không khoá cuộn; tab thực đơn không có JavaScript thì hiện cả ba nhóm.
- **Màn cảm ứng:** không kiểu `:hover` nào ngoài `@media (hover: hover)`; nút đổi màu khi đang nhấn (`:active`). `trinh-duyet.mjs` nhóm 7 thử bằng trình duyệt giả màn cảm ứng.
- **Không chỉ dựa vào màu:** mục điều hướng đang mở và thứ tiếng đang xem có gạch dưới và đổi độ đậm; ô giờ đang chọn có dấu ✓; lỗi luôn có câu chữ.
- **Tương phản:** bảng ở mục 2. Warm Stone và Marigold không bao giờ làm chữ trên kem.

---

## 7. Manifest artwork

Trạng thái: **gốc** = trích nguyên từ PDF nhận diện; **dựng lại** = dựng bằng script từ tài sản gốc; **minh họa** = ảnh tạo bằng AI, luôn ghi "Ảnh minh họa"; **cần chụp** = đang là khung đồ họa, chờ ảnh chụp thật.

### Thương hiệu — `public/thuong-hieu/`, `public/bieu-tuong.svg`, `public/favicon.ico`

| Tài sản | Nguồn | Vị trí dùng | Tỷ lệ / crop (màn rộng – điện thoại) | Trạng thái | Định dạng | Điều kiện thay bằng bản sản xuất |
|---|---|---|---|---|---|---|
| `logo-ngang-do.svg` | PDF trang 3, dòng ứng dụng (chữ đỏ trên kem) | Đầu trang mọi trang công khai; thẻ "Đọc nhãn khay" | 446 × 124; đầu trang rộng 172px – 160px | gốc | SVG | Nhà thiết kế giao master vector chính thức (AI / SVG): chép đè cùng tên, giữ đúng biến thể cho nền kem |
| `logo-ngang-kem.svg` | PDF trang 3 (chữ kem trên đỏ) | Chân trang, dải đỏ; ảnh chia sẻ dự phòng | 446 × 124 | gốc | SVG | Như trên |
| `dau-bo-do.svg`, `dau-bo-kem.svg` | PDF trang 3, brandmark đầu bò + miếng steak | `dau-bo-do`: logo đầu trang khi màn dưới 360px (48px). Cả hai: nguồn của `bieu-tuong.svg`; dự phòng cho tem, bài đăng | gần vuông | gốc | SVG | Như trên; dựng lại biểu tượng bằng `tao-bieu-tuong.py` |
| `tem-tron.svg` | PDF trang 11 | Chân trang; trạng thái "đã nhận" của Hỏi bàn | 1 : 1 (320) | gốc | SVG | Như trên |
| `huong-thao-1.svg` … `huong-thao-5.svg` | PDF trang 3, nét rosemary | Góc đầu trang con và FAQ (5). Nhánh 1 – 4 **không còn dùng trên trang** từ PR "trang chủ và thực đơn" (ba bước nối bằng nét kẻ; màn đầu và Đi cùng nhóm là ảnh) — giữ file và lớp `.net.huong-thao-1…4` cho ấn phẩm và trang sau | tự do; tô qua mặt nạ CSS | gốc (`huong-thao-2` bị khối đỏ che nửa dưới trong PDF — `so-sanh.py` ghi chú) | SVG một màu | Không cần thay |
| `steak-net-1.svg`, `steak-net-2.svg` | PDF trang 3, nét miếng steak | Quầy chọn bò, từ 1200px, bên phải thẻ đọc nhãn khay (1); khối cuối Đến Beeftown (2) | tự do; mặt nạ CSS | gốc | SVG một màu | Không cần thay |
| `van-mo.svg` | PDF trang 2, mảng vân mỡ đỏ trên đỏ đậm | `.nen-van-mo`: khối cuối Thực đơn và Đến Beeftown; ảnh chia sẻ (không còn ở màn đầu và Đi cùng nhóm của trang chủ) | 1280 × 720, phủ kín (`cover`) | gốc | SVG | Không cần thay |
| `van-mo-gan.svg` | PDF trang 2, riêng các đường vân | Mặt nạ mảng chìm ở góc mỗi khung ảnh | phủ kín | gốc | SVG một màu | Không cần thay |
| `chu-beeftown-nho.svg` | PDF trang 11, một chữ của mẫu lặp | Nguồn của `hoa-van-chu.svg` | — | gốc | SVG | Không cần thay |
| `hoa-van-chu.svg` | Dựng từ `chu-beeftown-nho` (hai hàng so le, một màu) | **Không còn dùng trên trang** (bỏ khỏi chân trang ở đợt redesign); giữ file cho ấn phẩm | ô lặp 186px | dựng lại | SVG một màu | Không cần thay |
| `bieu-tuong.svg` | `dau-bo-kem` trên ô đỏ bo góc | Tab trình duyệt — trang công khai, `/noi-bo` và kho dùng chung | 64 × 64 | dựng lại | SVG | Theo logo master |
| `favicon.ico` | Dựng từ `bieu-tuong.svg` | Trình duyệt cũ, Google | 16 / 32 / 48 | dựng lại | ICO | Theo logo master |
| `bieu-tuong-180.png` | Dựng từ `bieu-tuong.svg` | Biểu tượng màn hình chính iPhone | 180 × 180 | dựng lại | PNG | Theo logo master |
| `chia-se-1200x630.png` | `van-mo` + `logo-ngang-kem`, bố cục trang 2 | Ảnh chia sẻ link dự phòng (`og:image`) | 1200 × 630 | dựng lại — không ảnh chụp, không ngày, không giá | PNG | Ảnh chụp thật đã duyệt → công bố khóa `anh_chia_se` (nguồn `anh_that`) trong `/noi-bo`; ảnh đó được ưu tiên, file dự phòng giữ lại |

### Ảnh minh họa — `public/anh/` (cấu hình: `cong-cu/anh/danh-sach.json`)

Tám ảnh do **ChatGPT tạo ngày 11/10/2026**, gọi qua Codex CLI bằng gói Plus của Khánh; ảnh mẫu đưa cho ChatGPT là ảnh minh họa trong Brand Guideline (bàn gỗ sáng, bát đĩa màu kem, ghế đỏ, vỉ gas viền thép). File PNG gốc nằm **ngoài repo**, trên máy Khánh (thư mục `Beeftown_Web_Redesign_2026-10-11/03_Anh-ChatGPT`). Bộ ảnh tạo ngày 06/10/2026 bằng công cụ khác không còn dùng. Ràng buộc khi tạo: không than hay củi, không chữ, không logo, không mặt người, không khay skin-pack.

**Khánh quyết ngày 11/10/2026:** đưa ảnh AI lên trang, mỗi ảnh có nhãn "Ảnh minh họa"; **bàn tay người thì được, mặt người thì không**; dùng cả hai ảnh bữa ăn có kim chi và món phụ (`mon-an-chia-se`, `bua-an-cung-ban`) — đó là hình minh họa, câu chữ và alt của trang vẫn không kể tên, không hứa món phụ nào.

| Id | Ảnh | Vị trí dùng | Khung màn rộng – điện thoại (bề rộng đã dựng) | Trạng thái | Điều kiện thay |
|---|---|---|---|---|---|
| `hero-vi-gas` | Bàn tay cầm kẹp đặt lát bò lên vỉ gas tròn viền thép; đĩa bò sống, chén sốt, rau. Bản ngang và bản dọc là hai ảnh của **cùng một cảnh** (vỉ lưới thép, bàn tay từ bên trái; bản dọc tạo lại từ bản ngang làm ảnh mẫu) | Màn đầu trang chủ (`KhoiMoDau`), tải ngay | 4:3 cắt từ bản ngang 16:9 (640 / 960 / 1254) – 4:5 (480 / 720 / 1121) | minh họa | Ảnh chụp hero thật (brief mục 8, cảnh 1) |
| `bo-van-mo-can` | Một miếng bò sống dày có vân mỡ, trên giấy lót màu kem | Quầy chọn bò (`QuayChonBo`), dải tối | 4:5 (480 / 800 / 1121) – 1:1 (480 / 800 / 1122) | minh họa | Ảnh cận cảnh phần cắt thật tại quầy |
| `bo-cat-lat` | Lát bò sống xếp trên đĩa sứ kem, cạnh chiếc kẹp | Thực đơn, phần Bò tại quầy | 3:2 – 3:2 (480 / 800 / 1200) | minh họa | Ảnh phần cắt thật |
| `sot-cham` | Ba chén sốt trước đĩa bò nướng cắt lát và xà lách (alt trên trang **không** ghi số chén — set sốt thật chưa chốt số loại) | Thực đơn, phần Món ăn — **chỉ khi chưa công bố món nào** (lời giới thiệu theo nhóm); đã có món thì nhóm món trải hết khung, ảnh này không hiện | 4:3 – 4:3 (480 / 800 / 1200) | minh họa | Ảnh không khí bàn ăn thật |
| `mon-an-chia-se` | Đĩa bò nướng cắt lát giữa bàn, quanh là salad, cơm, canh, kim chi, các chén món phụ; không có người | Cả bữa (`BuaAnCungNhau`) | 3:2 – 4:3 (480 / 800 / 1200) | minh họa | Ảnh bàn ăn thật với món đã chốt (mục 8, cảnh 3 – 4) |
| `bua-an-cung-ban` | Nhiều bàn tay cùng gắp bò trên vỉ gas tròn giữa bàn; cơm, rau, món phụ, ba ly nước; không thấy mặt ai | Đi cùng nhóm (`DiCungNhom`), dải đỏ | 3:2 – 4:3 (480 / 800 / 1200) | minh họa | Ảnh người cùng ăn thật, có giấy đồng ý (mục 8, cảnh 4) |
| `bo-xeo-vi` | Lát bò đang chín trên vỉ gas tròn, có làn hơi | **Dự phòng — chưa đặt ở trang nào, chưa dựng cỡ** (mục `du_phong` của `danh-sach.json`; alt đã viết sẵn trong `anh.ts`) | — | minh họa, chưa dùng | — |

**Ảnh món của trang Thực đơn — cuốn menu bản sáng** (26 ảnh, lấy từ artifact "Beeftown — Menu", Cuốn C nền sáng, Version 45, Khánh chốt 11/10/2026; file gốc nằm **ngoài repo**). Vẫn là **ảnh minh họa**, trang vẫn ghi "Ảnh minh họa":

- 21 ảnh món ăn và ảnh ba ly không cồn: **ảnh AI tạo qua cầu nối Codex ngày 09–11/10/2026, rồi tách nền** (WebP / PNG có kênh trong suốt, bóng đổ nằm sẵn trong ảnh). `tao-co-anh.py` không cắt mà đặt chúng vào khung trong suốt (mục `tach_nen` của `danh-sach.json`: lề 4 %, dải trống ở đáy 13 % cho món ăn, 12 % cho ly, 14 % cho ảnh ba ly).
- Ba ly signature (tách nền) và hai món tartare (ảnh chữ nhật đứng có nền bàn gỗ, cắt vuông quanh đĩa / bát như ảnh cũ): **lấy từ menu chuẩn 29/09 của quán** — ghi chú dự án gọi là "ảnh đã duyệt" nhưng **chưa rõ là ảnh chụp thật hay ảnh dựng**; chưa rõ thì vẫn gắn nhãn minh họa.
- Alt tả đúng thứ nhìn thấy, ba thứ tiếng, không đếm số món / số ly, không giá, không kể tên món phụ — kể cả khi đó là một phần của món chính (alt của canh kim chi, lẩu kim chi, Set 4 sốt không viết chữ "kim chi"), không chữ "núi lửa", "xông khói" (luật than, lửa, khói của alt).

| Id | Món (mã) | Khung (bề rộng đã dựng) | Chỗ dùng |
|---|---|---|---|
| `mon-tartare-bo-hoa-tuyet`, `mon-com-tron-tartare-bo-cay` | Tartare bò hoa tuyết (F03), Cơm trộn tartare bò cay (F19) — ảnh có nền | 1:1 (480 / 800) | Món đặc trưng |
| `mon-lau-kim-chi`, `mon-lau-bo-bulgogi`, `mon-lau-nam` | F15, F16, F20 | 4:3 tách nền (480 / 800) | Lẩu |
| `mon-set-4-sot` | Set 4 sốt (S01) | 4:3 tách nền (480 / 800) | Dải tối Bò tại quầy, nhóm Gọi thêm |
| `mon-salad-nam`, `mon-caesar-salad`, `mon-mien-tron-han` | F21, F01, F10 | 4:3 tách nền (480 / 800) | Salad |
| `mon-trung-hap-nui-lua`, `mon-khoai-tay-chien-sot-bo`, `mon-banh-gao-chien-pho-mai` | F22, F23, F18 | 4:3 tách nền (480 / 800) | Món thêm |
| `mon-canh-kim-chi`, `mon-dau-phu-ham`, `mon-canh-tuong-dau` | F12, F14, F13 | 4:3 tách nền (480 / 800) | Canh |
| `mon-com-kim-chi-bo`, `mon-com-tron-han`, `mon-com-tron-trung-ca` | F06, F05, F04 | 4:3 tách nền (480 / 800) | Cơm |
| `mon-mi-lanh-cay`, `mon-mi-toowoomba`, `mon-mi-carbonara`, `mon-mi-bo-sot-ca` | F11, F08, F07, F09 | 4:3 tách nền (480 / 800) | Mì |
| `uong-milky-cloud-makgeolli`, `uong-strawberry-crush`, `uong-berry-rouge-highball` | D13, D01, D14 | 4:5 tách nền (400 / 640) | Đồ uống, nhóm Signature (có cồn — chỉ khi công tắc bật) |
| `uong-khong-con-ba-ly` | — (ade chanh dây, ade chanh, nước cam) | 3:2 tách nền (480 / 800) | Ảnh của cả phần Đồ uống, mọi trạng thái |

Bảng mã món → ảnh là `ANH_CUA_MON` (`src/lib/anh.ts`); ảnh chỉ hiện khi món đã công bố. Ảnh dẫn đầu hiện tới 560px nhưng chỉ có bản 800px — màn Retina thấy hơi mềm; thêm bản 1100–1200px cho món dẫn đầu thì cả thư mục lên khoảng 7,6 MB, chưa thêm.

Mọi file AVIF + WebP ≤ 300 KB, cả thư mục ≤ 8 MB (hiện khoảng 6,9 MB, 164 file). Ảnh nào đã dựng thì phải có chỗ dùng, chỗ nào dùng thì phải đã dựng (`crm/test/test-cong-khai-anh.mjs` nhóm 3) — không để file ảnh chết trong repo.

Ảnh AI **không bao giờ** dùng cho quầy, khay skin-pack, không gian quán, lối vào, thang máy hay mặt người — những chỗ đó là khung đồ họa cho tới khi có ảnh chụp thật. Không dùng ảnh AI cho quảng cáo và thực đơn in (`../THUONG-HIEU.md` mục 2).

**Điểm cần người xem lại bằng mắt — ảnh món** (13/10/2026): ảnh ba ly signature và hai món tartare cần Khánh xác nhận là ảnh chụp thật hay ảnh dựng (ảnh chụp thật thì đổi `minhHoa` và nguồn); tartare cắt vuông bỏ phần nền phía trên của ảnh gốc; ảnh món là ảnh AI của cuốn — Sang xem dụng cụ (nồi inox, thố đá, đĩa đen) và khẩu phần có giống món quán dọn không.

**Điểm cần người xem lại bằng mắt** (ghi lúc đưa ảnh lên, 11/10/2026): miếng bò của `bo-van-mo-can` có vân mỡ khá dày — cần Sang xem có đúng với thịt quán bán không (guideline: ảnh không được có vân mỡ đẹp hơn thịt quán bán); `bua-an-cung-ban` có ba ly nước màu vàng nhạt, người xem có thể hiểu là bia; `hero-vi-gas` vẽ vỉ lưới thép ở cả hai bản — nếu vỉ thật của quán là loại khác thì tạo lại cả hai; `mon-an-chia-se` và `bua-an-cung-ban` bày nhiều món phụ hơn điều trang hứa; `bo-van-mo-can` và `bo-cat-lat` đứng ở chỗ của khung vẽ khay trong hai khối nói về khay ("Nhìn tận mắt, chọn tận tay" ở trang chủ, "Chọn theo khay, giá xem trên nhãn" ở trang Thực đơn) — ảnh không vẽ khay hay quầy và có nhãn "Ảnh minh họa", nhưng khách có thể hiểu thịt ở quán bày trên giấy lót hoặc đĩa chứ không đóng khay: Khánh xem và quyết giữ ảnh hay trả lại khung vẽ khay.

### Khung ảnh đồ họa — chờ ảnh chụp thật (`KhungAnh.astro`)

| Loại | Vị trí dùng | Tỷ lệ | Trạng thái | Điều kiện thay |
|---|---|---|---|---|
| `loi-vao` | Đến Beeftown, bước 1 (tới 63 Hồ Tùng Mậu) | 4:3 | cần chụp | Ảnh lối vào riêng ngay cạnh GS25 (mục 8, cảnh 6) |
| `thang-may` | Đến Beeftown, bước 2 (thang máy lên tầng 3) | 4:3 | cần chụp | Ảnh thang máy ở lối vào riêng (mục 8, cảnh 6) |
| `quay` | Đến Beeftown, bước 3 (ghé quầy) | 4:3 | cần chụp | Ảnh quầy thật (mục 8, cảnh 2) |
| `khay` | Chỉ còn là hình thay cho `bo-van-mo-can`, `bo-cat-lat` nếu ảnh chưa dựng cỡ — hiện không hiện ở trang nào | theo khung của ảnh | cần chụp | Ảnh khay skin-pack có nhãn thật — khi có thì đặt cạnh thẻ đọc nhãn khay |
| `ban-nuong` | Chỉ còn là hình thay cho `hero-vi-gas`, `sot-cham`, `mon-an-chia-se`, `bua-an-cung-ban`, ảnh món và `uong-khong-con-ba-ly` nếu ảnh chưa dựng cỡ — hiện không hiện ở trang nào | theo khung của ảnh | cần chụp | Ảnh bàn nướng có người (mục 8, cảnh 4) |

**Đưa một ảnh chụp thật lên trang:** thêm id vào `IdAnh` và `DANH_MUC_ANH` (`src/lib/anh.ts`, `minhHoa: false`, alt đủ vi / en / ko), khai id trong `cong-cu/anh/danh-sach.json`, chạy `tao-co-anh.py`, rồi đổi `<KhungAnh loai="…" />` thành `<Anh id="…" />`. Ảnh thật không có dòng "Ảnh minh họa".

### Dựng lại tài sản

**Thương hiệu** — cần PDF nhận diện (PDF **không vào repo**), poppler (`pdftocairo`, `pdftoppm`), Pillow, và Playwright của `web/` (để dựng PNG):

```bash
cd web/cong-cu/thuong-hieu
python3 -I tach-tu-pdf.py "<BGBTFILE (2).pdf>" --liet-ke 3            # in từng phần tử của trang 3 — chọn vùng cắt
python3 -I tach-tu-pdf.py "<BGBTFILE (2).pdf>" <thư-mục-tạm>/svg       # xuất mọi tài sản khai trong cau_hinh_tai_san.py
python3 -I so-sanh.py "<BGBTFILE (2).pdf>" <thư-mục-tạm>/svg <thư-mục-tạm>/so-sanh   # đối chiếu từng điểm ảnh với PDF
python3 -I tao-bieu-tuong.py <thư-mục-tạm>/svg ../../public             # chép SVG, dựng favicon, biểu tượng 180, ảnh chia sẻ
```

`so-sanh.py` đạt khi ≤ 0,5 % điểm ảnh khác ngoài dải 2px quanh mép nét; ba tài sản bị phần tử khác đè trong PDF in số nhưng không tính là lỗi. Vùng cắt và số thứ tự phần tử nằm ở `cau_hinh_tai_san.py`.

**Ảnh** — cần Pillow có AVIF (Pillow ≥ 11.3 cài bằng pip):

```bash
python3 -I web/cong-cu/anh/tao-co-anh.py <thư-mục-ChatGPT> <thư-mục-cuốn-menu>      # mọi ảnh (tìm file gốc lần lượt trong hai thư mục)
python3 -I web/cong-cu/anh/tao-co-anh.py <thư-mục-ChatGPT> --chi sot-cham           # một ảnh
python3 -I web/cong-cu/anh/tao-co-anh.py <thư-mục-cuốn-menu> --chi 'mon-l*' --chi 'uong-*'   # một nhóm ảnh (dấu * khớp như tên file)
```

Ảnh gốc ở hai thư mục ngoài repo: bảy PNG của ChatGPT (`Beeftown_Web_Redesign_2026-10-11/03_Anh-ChatGPT` trên máy Khánh) và 26 file ảnh món của cuốn menu bản sáng (xuất từ artifact "Beeftown — Menu", Version 45; tên file đúng trường `goc`, vd. `mon-salad-nam.webp`). Cẩn thận với `--chi 'mon-*'`: mẫu đó khớp cả `mon-an-chia-se` (ảnh bữa ăn của đợt ChatGPT) — chạy với cả hai thư mục, hoặc liệt kê từng id.

1. Để file ảnh gốc (PNG của công cụ tạo ảnh, ảnh tách nền, hoặc ảnh chụp) trong một thư mục **ngoài repo**, tên đúng trường `goc` của `danh-sach.json` (vd. `hero-vi-gas-16x9.png`). Ghi nguồn, công cụ, ngày tạo vào `nguon` và bản được chọn vào `nguon.da_chon`. Ảnh đã tách nền (kênh trong suốt) thì khai `tach_nen: { le, duoi }` thay cho `fx`, `fy`.
2. Chạy script. Nó chuyển sRGB, bỏ EXIF và mọi siêu dữ liệu, cắt theo tỷ lệ quanh điểm lấy nét (`fx`, `fy`) — ảnh tách nền thì cắt sát phần có hình rồi đặt vào khung trong suốt, chừa dải trống ở đáy cho nhãn —, thu nhỏ (không phóng to), xuất AVIF + WebP (ảnh tách nền giữ kênh trong suốt) vào `public/anh/`, giữ mỗi file ≤ 300 KB (hạ chất lượng dần) và cả thư mục ≤ 8 MB, rồi ghi `src/lib/anh-tao-san.ts`. Chỉ dựng ảnh ở mục `anh`; ảnh ở mục `du_phong` (chưa đặt ở trang nào) không dựng, file cũ của nó bị xóa. In bảng kết quả; lỗi thì thoát mã 1 và không thay file cũ.
3. Mở từng file vừa xuất xem vùng cắt ở từng khung: không cắt mất món chính, không cắt ngang bàn tay; lệch chủ thể thì chỉnh `fx`, `fy` rồi chạy lại (chạy lại bao nhiêu lần cũng cho cùng kết quả).
4. `git status --short` phải thấy `public/anh/*.avif`, `*.webp` và `anh-tao-san.ts`; không có PNG gốc nào.
5. Ảnh mới (id mới): thêm vào `IdAnh`, `DANH_MUC_ANH` (alt vi / en / ko tả đúng thứ nhìn thấy) **và** vào các danh sách chép tay của kiểm thử — `ANH_CHATGPT` / `ANH_MON` / `ANH_THAT`, `ANH_DA_DAT`, `CO_GOC` trong `crm/test/test-cong-khai-anh.mjs`; `ANH_AI` trong `kiem-tra/do-giao-dien.mjs`; `KHUNG_MONG` trong `kiem-tra/trinh-duyet.mjs` (ảnh hiện khi chưa có database). Ảnh của một món: thêm vào `ANH_CUA_MON` (`src/lib/anh.ts`) và bảng `MONG` của `test-cong-khai-anh.mjs` nhóm 7.

---

## 8. Brief chụp ảnh và quay video

Ảnh thật thay dần khung đồ họa và ảnh minh họa. Mỗi ảnh lên trang phải trả lời được: **ai chụp, chụp khi nào** (phép thử nghiệm thu ở `../README.md`).

**Chung cho mọi cảnh**
- Ánh sáng ấm, tự nhiên, một hướng sáng chính; cùng một nhiệt độ màu cho cả bộ để các ảnh nối được với nhau. Không đèn flash gắn máy.
- Vỉ gas thật của quán. **Không than, không củi, không khói giả.**
- Không chữ, logo của hãng khác trong khung; không đồ trang trí mượn từ mockup PDF.
- Người trong ảnh: có giấy đồng ý chụp và đăng. Ảnh có đồ uống có cồn: chỉ người trưởng thành.
- Giao file gốc độ phân giải cao nhất (cạnh dài ≥ 2400px), không gắn chữ, không lọc màu mạnh; kèm tên người chụp và ngày chụp. Tên file ASCII không dấu, gạch nối: `quay-toan-canh-4x3.jpg`.

| # | Cảnh | Khung | Chỗ dùng | Ghi chú |
|---|---|---|---|---|
| 1 | **Hero**: bò có vân trên vỉ gas, một tay gắp đang đặt lát thịt, một góc bàn chia sẻ (chén sốt, rau, đĩa) | 4:3 **và** 4:5 (chụp riêng, hoặc chụp ngang 16:9 đủ rộng để cắt 4:3) | Màn đầu trang chủ | 4:3 (màn rộng): chủ thể ở giữa – trái; góc dưới bên trái yên — nhãn và chú thích nằm ở đó. 4:5 (điện thoại): chủ thể giữa khung, chừa khoảng thở trên và hai mép. Trang không đặt chữ hay logo lên ảnh (tagline là dải đỏ dưới ảnh); bài đăng, bạt thì chừa khoảng chữ riêng |
| 2 | **Quầy và ba bước**: (a) quầy toàn cảnh với khay xếp ngay ngắn; (b) cận khay skin-pack có nhãn thật; (c) tay khách chọn khay, nhân viên chỉ vào nhãn tư vấn; (d) khay bên vỉ gas, cả bàn cùng nướng | 4:5 và 4:3 | Quầy chọn bò; ba bước; Đến Beeftown bước 3 | **Cùng ánh sáng, cùng góc máy** để nối thành hành trình. Nhãn đọc được tên phần cắt và các trường; khi giá chưa được duyệt công bố thì canh nét sao cho số tiền không đọc rõ — ảnh có số tiền là công bố giá |
| 3 | **Món đi cùng và đồ uống** | 1:1 hoặc 4:3, chọn một cho cả bộ | Trang Thực đơn | Dụng cụ, khẩu phần thật của quán; một nền thống nhất (mặt bàn của quán). Tên file theo mã món: `F05-1x1.jpg`, `D09-1x1.jpg`, `S01-4x3.jpg` (mã theo danh mục cuốn bản sáng 11/10/2026: F01–F23 món ăn, D01–D28 đồ uống, S01 Set 4 sốt). Chỉ chụp món đã chốt công thức. Trang đang dùng ảnh minh họa của cuốn (mục 7); ảnh chụp tách nền trên phông trơn thì đặt được thẳng lên nền kem như hiện nay |
| 4 | **Người cùng ăn**: người trưởng thành đi cùng gia đình, người thân; bạn bè; nhóm đồng nghiệp — đang chia món, nướng, trò chuyện tự nhiên | 4:3, 16:9 | Đi cùng nhóm, Cả bữa | Không dàn dựng cụng ly quá đà; trẻ em không làm trung tâm |
| 5 | **Không gian** | 4:3, 16:9 | Trang chủ, Đến Beeftown | Ống kính gần góc nhìn người đứng — **không** dùng ống siêu rộng làm phòng rộng hơn thực tế |
| 6 | **Đường đến**: số 63 Hồ Tùng Mậu nhìn từ vỉa hè (thấy số nhà); lối vào riêng ngay cạnh GS25; thang máy; cửa tầng 3 | 4:3 (ba khung của trang Đến Beeftown) + 4:5 cho mạng xã hội | Đến Beeftown, bước 1–3 | Chụp **cả ban ngày và ban đêm** (đèn thật lúc mở cửa) |
| 7 | **Video đường lên**: một cảnh liền từ vỉa hè, qua lối vào riêng cạnh GS25, vào thang máy, tới cửa tầng 3 | dọc 9:16, 15–20 giây | Đến Beeftown, mạng xã hội | Có ảnh poster (khung đầu) và phụ đề vi / en / ko; không tự phát tiếng; không tải trước khi khách bấm |
| 8 | **Phim thương hiệu** | 16:9 và 9:16 | Trang chủ (sau này), mạng xã hội | Cận cảnh món, âm thanh xèo trên vỉ, nhạc nhẹ, ít chữ. Âm thanh do khách bật; có poster; không bắt xem trước khi vào thực đơn |

### Beefy

File Beefy hiện có là **collage tham chiếu** — không dùng trên site, không nhúng cả bảng collage, không tạo mascot mới. Muốn dùng cần nhà thiết kế xuất **pose tách nền sạch** (SVG hoặc PNG nền trong, một pose một file), gợi ý ba pose: chào (Hello), ngon (Yummy), cảm ơn (Thank You). Dùng tối đa vài điểm: câu hỏi thường gặp, trạng thái "đã nhận" của Hỏi bàn. Beefy là nhân vật minh họa, **không thay brandmark** đầu bò + steak; **không dùng** wordmark chữ cong và descriptor "Korean BBQ & Family Restaurant" trong collage — descriptor hiện hành là "Beef Specialty Restaurant".

---

## 9. Bộ campaign

| Mẫu | Cỡ | Dùng cho |
|---|---|---|
| OG | 1200 × 630 | Ảnh xem trước khi chia sẻ link (bản dự phòng: `public/thuong-hieu/chia-se-1200x630.png`) |
| Bài đăng | 1080 × 1350 (4:5) | Facebook, Instagram |
| Story | 1080 × 1920 (9:16) | Story, Reels — chừa khoảng 250px trên và dưới cho giao diện ứng dụng |

Nguyên tắc: logo vector gốc; chất liệu PDF (vân mỡ, rosemary, tem tròn, chữ lặp) theo đúng vai ở mục 1; chữ Montserrat; màu theo bảng mục 2. Chữ chỉ gồm tagline "Pick it. Grill it. Love it.", descriptor, câu chính, "Tầng 3, 63 Hồ Tùng Mậu". Ảnh AI trong campaign cũng ghi "Ảnh minh họa". **Không ngày, không giá, không ưu đãi, không đếm ngược** khi chưa được công bố; không câu "Thịt chuẩn - Giá thật"; danh sách chữ cấm của web áp dụng nguyên cho campaign.

---

## 10. Bàn giao

### Nội dung cần Khánh xác nhận

| Việc | Hiện trạng trên trang | Khi có |
|---|---|---|
| Giờ mở cửa | Không hiện giờ; JSON-LD không khai giờ | Nhập giờ ở màn chi nhánh trong `/noi-bo`, bật công tắc `gio_phuc_vu_da_chot` (khung giờ của form hỏi bàn và bot Messenger đọc từ đó); trang công khai chưa có chỗ in giờ — thêm khi giờ đã chốt |
| Chỗ gửi xe | Không nói | Ghi thông tin thật — thêm vào trang Đến Beeftown |
| Link Google Maps | Không nút "Chỉ đường" | Công bố `google_maps_url` trong `/noi-bo` — mở thử trên điện thoại, ghim đúng lối vào riêng cạnh GS25 ở 63 Hồ Tùng Mậu |
| Tên phường của 63 Hồ Tùng Mậu | Trang, thẻ mô tả và JSON-LD không ghi phường, quận | Có giấy xác nhận thì thêm khóa `phuong` vào `DIA_CHI_PHAN` (`src/lib/chu.ts`) và `addressLocality` vào `diaChiCoCauTruc()`, **cùng lúc** sửa kiểm thử đang gác việc không ghi phường: `crm/test/test-cong-khai-dia-diem.mjs` nhóm 4, `test-cong-khai-trang-chu.mjs` nhóm 4, luật `PHUONG_QUAN` và bảng câu thử trong `kiem-tra/mau-dia-diem.mjs`, kiểm tra JSON-LD trong `kiem-tra/trinh-duyet.mjs`, địa chỉ thử của `kiem-tra/thu-day-du.mjs` nhóm 7 |
| Chữ của câu chỉ đường | Trang dùng câu Claude đề xuất, ở ba thứ tiếng | Khánh duyệt chữ; đổi thì sửa `loiLen` (`src/lib/chu.ts`) cùng các bản chép tay trong `crm/test/test-cong-khai-dia-diem.mjs`, `test-cong-khai-cau-chu.mjs`, `kiem-tra/trinh-duyet.mjs` |
| Dòng địa chỉ pháp nhân ở chân trang | Ghi theo giấy đăng ký đang dùng cho hồ sơ xác minh trên Meta | Khánh quyết có đổi không; đổi thì sửa `PHAP_NHAN.diaChi`, dòng chép tay trong `kiem-tra/trinh-duyet.mjs` và `test-cong-khai-dia-diem.mjs` cùng lúc |
| Hotline | Không nút gọi | Công bố `hotline` |
| Trang Facebook | Không nút "Theo dõi"; trang Hỏi bàn khi form đóng vẫn nhắc nhắn qua Facebook | Công bố `facebook_url` |
| Tên món tiếng Việt cuối, mô tả | Thực đơn chỉ hiện lời giới thiệu theo nhóm | Duyệt và công bố món theo `THUC-DON.md` |
| Giá | Không giá nào trên trang | Duyệt giá (việc "Duyệt giá" trong `README.md`) |
| Ảnh thật | Sáu ảnh minh họa (AI, có nhãn) ở trang chủ và trang Thực đơn; 26 ảnh món của cuốn menu bản sáng (minh họa, hiện khi món được công bố); khung đồ họa ở trang Đến Beeftown | Brief chụp mục 8 |
| Ảnh ba ly signature và hai món tartare | Gắn nhãn "Ảnh minh họa": menu chuẩn 29/09 gọi là "ảnh đã duyệt" nhưng chưa rõ ảnh chụp thật hay ảnh dựng | Khánh xác nhận; ảnh chụp thật thì đổi `minhHoa: false` trong `src/lib/anh.ts`, sửa nguồn trong `danh-sach.json` và danh sách chép tay của `crm/test/test-cong-khai-anh.mjs` |
| Phông display | Montserrat | File phông + giấy phép web (mục 3) |
| "Floor 3" trong tiếng Anh; nút thang máy | Trang tiếng Anh ghi "Floor 3", tiếng Hàn "3층". Khánh xác nhận ngày 11/10/2026 địa điểm có thang máy; nút thang máy ghi số mấy cho tầng của quán thì chưa biết, nên trang không ghi số nút | Xác nhận cách gọi thống nhất với biển chỉ dẫn và nút bấm trong thang máy |
| Câu luật rượu | "Beeftown không phục vụ đồ uống có cồn cho người dưới 18 tuổi." — chỉ hiện khi đồ uống có cồn được bật | Xác nhận câu chữ |
| Ảnh minh họa (ChatGPT, 11/10/2026) | Sáu ảnh đang ở trang chủ và trang Thực đơn, mỗi ảnh có nhãn "Ảnh minh họa"; Khánh cho đưa lên ngày 11/10/2026 | Sang xem vân mỡ của `bo-van-mo-can` và loại vỉ của `hero-vi-gas` có đúng với quán; Khánh xem ba ly nước của `bua-an-cung-ban` (mục 7, "Điểm cần người xem lại bằng mắt"). Ảnh nào không ổn thì tạo lại, thay file gốc, chạy lại `tao-co-anh.py` |

### Phần chỉ là minh họa

Sáu ảnh tạo bằng AI đang ở trang chủ và trang Thực đơn, và 26 ảnh món của cuốn menu bản sáng (mục 7) — luôn có dòng "Ảnh minh họa", không bao giờ dùng cho quầy, khay, không gian, lối vào, thang máy hay mặt người. Món phụ và bàn tay trong hai ảnh bữa ăn là hình minh họa, không phải lời hứa của quán. Hình nét trong khung ảnh là đồ họa, không phải sơ đồ thật của quán.

### Tài sản cần thay

Ảnh chụp theo mục 8 (thay khung ảnh của trang Đến Beeftown, rồi dần thay ảnh minh họa); master vector logo chính thức (thay các SVG trích từ PDF nếu nhà thiết kế giao bản sạch hơn); pose Beefy tách nền (nếu muốn dùng); file phông display kèm giấy phép.

### Ba trạng thái mở cửa

Trang **không tự đổi theo ngày** — mỗi trạng thái là quyết định công bố của Khánh, bật trong `/noi-bo`:

| Trạng thái | Công tắc | Trang làm gì |
|---|---|---|
| Đang chuẩn bị (mặc định) | `form_dat_ban_dang_mo` tắt; `dong_trang_thai` trống hoặc câu "đang chuẩn bị" | Nút chính màn đầu "Khám phá thực đơn"; trang Hỏi bàn nói chưa mở hỏi bàn trực tuyến và chỉ sang Facebook |
| Mở bán thử | Khánh bật form, đổi `dong_trang_thai` thành câu đã duyệt về bán thử | Nút chính "Hỏi bàn"; form nhận yêu cầu (chỉ khi database còn khung giờ trống trong 14 ngày tới) |
| Đã mở | Như trên, `dong_trang_thai` đổi sang câu đã mở; `ngay_khai_truong` nếu muốn hiện ngày | Như trên |

Ngày mở chỉ hiện khi `ngay_khai_truong` đã công bố: trước ngày đó ghi "Đón bạn từ …", từ ngày đó ghi "Mở cửa từ …" — đây là chỗ duy nhất trang đọc ngày; nút, form và dòng trạng thái không đổi theo ngày. Không banner, không đếm ngược, không ưu đãi.

### Kiểm tra trước khi gộp

Kết quả của từng lượt nằm ở PR và tab Actions (Summary), không ghi vào đây.

| Kiểm tra | Lệnh |
|---|---|
| Kiểm thử database và web | `cd crm && npm test` |
| Kiểu dữ liệu | `cd web && npx astro check` |
| Chữ cấm trên trang đã dựng | `npm run quet` |
| Trình duyệt, không database | `npm run thu-trinh-duyet` |
| Trình duyệt, Supabase giả (đầy đủ, bấm đúp, lỗi 500, đứt mạng) | `npm run thu-day-du` |
| Chữ dính trên một component | `cd crm && node test/dinh-chu.mjs ../web/src/components/<file>.astro` |
| Ảnh chụp 360 / 390 / 768 / 1024 / 1440 × vi / en / ko | `npm run thu-day-du -- --chup` |
| Tương phản | bảng mục 2 (tính theo WCAG 2.2) |
| Đối chiếu tài sản với PDF | `so-sanh.py` |
| Dựng cỡ ảnh | `tao-co-anh.py` (sRGB, bỏ siêu dữ liệu, ≤ 300 KB, không phóng to, chạy lại cho cùng kết quả) |
