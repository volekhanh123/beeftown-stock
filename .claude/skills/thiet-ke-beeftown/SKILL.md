---
name: thiet-ke-beeftown
description: Guideline thiết kế Beeftown — bộ nhận diện 21/10/2026 (logo chính, logo phụ, brandmark đầu bò; bảng màu đỏ, đen, trắng Khánh chốt 22/10/2026, thêm một đỏ đậm và bốn xám chỉ cho màn hình), token màu website, hệ giao diện "Quầy thịt ấm" của trang công khai (nền trắng, đầu trang và chân trang đen, đỏ cho nút, nhãn, giá; Montserrat), giao diện nội bộ /noi-bo và kho (trạng thái phân biệt bằng chữ, dấu và nét, không màu xanh hay vàng), câu chữ ba thứ tiếng, tagline Pick it, grill it, love it!, địa điểm, ảnh, logo và ấn phẩm (ảnh chia sẻ, bài đăng, story, in ấn). Dùng khi tạo hoặc sửa BẤT KỲ thứ gì người khác nhìn thấy của Beeftown — trang, component, CSS trong web/, màu, phông, nút, form, bảng, biểu tượng, ảnh, câu thông báo, bài đăng mạng xã hội, banner, slide, landing page — kể cả câu hỏi nhanh như "đỏ Beeftown mã gì". Use for any Beeftown UI, brand, copy or visual design work.
---

# Thiết kế Beeftown

Skill này là **bản đồ và luật vận hành** để làm giao diện Beeftown đúng ngay lần đầu. Nó không thay
tài liệu gốc — khi hai bên lệch nhau, thứ tự thắng là:

1. **Thương hiệu và sự thật kinh doanh** — `THUONG-HIEU.md` (bộ nhận diện 21/10/2026: logo, màu, phông
   của logo — mục 0–2; luật chữ, ảnh, địa điểm giữ từ guideline 09/10/2026 — mục 2, 6), `README.md` gốc
   mục "Concept" và "Giọng văn". Thắng mọi tài liệu cũ hơn.
2. **`web/THIET-KE.md`** — giao diện trang công khai **đang chạy**, lý do từng quyết định, manifest tài
   sản. Mục 2 ở đó ghi token và bảng tương phản của trang công khai; `/noi-bo` và kho dùng cùng token.
3. **Mã đang chạy** — `web/src/styles/*.css`, component trong `web/src/components/`.
4. Skill này.

Thấy skill lệch mã: sửa skill trong cùng PR. `crm/test/test-ky-nang-thiet-ke.mjs` bắt mã màu (bảng
token dưới đây so với cả hai nơi khai), biến CSS, đường dẫn, tên biểu tượng, loại khung ảnh, lớp dùng
chung và câu chỉ đường ghi trong skill mà không còn khớp với mã. Số đo ghi trong skill (cỡ chữ, khoảng
cách, bo góc) và tên hàm thì **không** được so với mã — đổi mã những thứ đó thì tự sửa skill. (Số đo
của chính trang thì có kiểm thử: `web/kiem-tra/do-giao-dien.mjs` đo trên trang đã dựng.)

## Bước 0 — đang làm cho khu nào?

Mỗi khu có CSS, layout và số thứ tiếng riêng. Xác định trước khi viết dòng nào.

| Khu | Ai nhìn | Layout · CSS | Thứ tiếng | Đọc tiếp |
|---|---|---|---|---|
| Trang công khai (`/`, `/en/…`, `/ko/…`) | Khách | `web/src/layouts/Trang.astro` · `chung.css` + `cong-khai.css` (mọi quy tắc dưới `body.ck`) | vi / en / ko | [tham-khao/trang-cong-khai.md](tham-khao/trang-cong-khai.md) |
| Nội bộ (`/noi-bo`) | Chủ, quản lý, nhân viên | `web/src/layouts/NoiBo.astro` · `chung.css` + `noi-bo.css` | vi / en | [tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md) |
| Kho (`/noi-bo/kho`) | Thủ kho, quầy, kế toán — nhiều trên điện thoại | `web/src/layouts/Kho.astro` · `chung.css` + `kho.css` + `kho-khung.css` | vi / en | [tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md) |
| Beeftown Cân (`can-app/`) | Máy tính ở quầy | `can-app/src/*.html` | vi | [tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md) |
| Ấn phẩm ngoài web | Khách trên mạng xã hội, tại quán | — | vi (en / ko khi cần) | [tham-khao/an-pham.md](tham-khao/an-pham.md) |

**Mọi khu web chung một bảng màu** — bảng 22/10/2026 (mục "Màu"), từ PR "Đổi nhận diện website";
Beeftown Cân chưa đổi (còn bảng cũ hơn, PR riêng). Mọi khu web dùng Montserrat (Beeftown Cân
chạy không mạng nên dùng phông hệ thống). **Đừng mang lớp của khu này sang khu kia**: lớp `.nut`,
`.be-kem`… của trang công khai chỉ sống dưới `.ck`; `cong-khai.css` chỉ `Trang.astro` được nạp
(có kiểm thử).

## Hướng thẩm mỹ: "Quầy thịt ấm"

Trang như lúc bước tới quầy Beeftown — một tiệm thịt tử tế, gần gũi như bữa tối cả nhà.

- **Nền trắng**, phần lớn trang (Khánh quyết 25/10/2026). Trang công khai: thẻ xám nhạt trên nền
  trắng, thẻ trắng trên dải xám nhạt / đen / đỏ, ô nhập trắng. `/noi-bo` và kho: nền trang xám nhạt,
  thẻ và ô nhập trắng.
- **Đỏ Beeftown** cho nút, nhãn, giá — dẫn hành động.
- **Đen làm điểm nhấn**: đầu trang, chân trang và vài dải ("Quầy chọn bò", "Bò tại quầy") — thịt sáng
  lên trên nền đen.
- **Không hình trang trí**: khối màu phẳng và ảnh. Dấu thương hiệu duy nhất là logo bộ 21/10/2026; hình
  của bộ nhận diện cũ (vân mỡ, hương thảo, steak, tem tròn, chữ lặp) đã bỏ (Khánh quyết 26/10/2026).
- **Nhịp editorial**: chữ lớn, khoảng trống rộng, nhịp thay đổi. Thực đơn và form phải **yên và rõ**,
  không trang trí chen vào.

**Tránh:** mọi khối là ba thẻ giống nhau; pill / card ở mọi nơi; gradient tím xanh; kính mờ; hiệu
ứng cuộn; bộ đen – vàng kiểu "sang trọng"; giọng fine dining xa cách; giao diện thiên về trẻ em;
emoji làm biểu tượng.

Định vị vừa tầm — không bình dân, không sang trọng xa cách (để hiểu, **không viết ra**: guideline cấm
chữ "cao cấp" trong câu cho khách). Khách chính: người trưởng thành đi cùng gia đình, người thân; rồi
bạn bè, nhóm văn phòng.

## Màu

Bảng thương hiệu là bảng 22/10/2026 (`THUONG-HIEU.md` mục 1): ba màu dưới đây, cùng năm màu pha **chỉ
cho màn hình** (Khánh duyệt 25/10/2026). Website (trang công khai, `/noi-bo`, kho) dùng bảng này từ PR
"Đổi nhận diện website". Beeftown Cân còn bảng cũ hơn — đổi ở một PR riêng, kèm phiên bản mới của chương
trình.

### Bảng màu thương hiệu — Khánh chốt 22/10/2026

| Tên | HEX | In | Dùng cho |
|---|---|---|---|
| Đỏ | `#BD0000` | C17 M100 Y100 K9 · Pantone 3517 C (gần đúng) | Nút, nhãn, giá, logo |
| Đen | `#000000` | C75 M68 Y67 K90 | Chữ, đầu trang, chân trang, logo |
| Trắng | `#FFFFFF` | C0 M0 Y0 K0 | Nền, chữ trên đen và đỏ, logo |

Nguồn: Brand Guidelines 21/10/2026, trang 6 (Pantone là màu gần đúng — nhà in in thử, Khánh duyệt bản in
thử). Màu pha của màn hình: một đỏ đậm và bốn xám (bảng token dưới). Ấn phẩm chỉ dùng ba màu trên.

**Khu nào dùng gì:**

- **Ấn phẩm ngoài web** (bài đăng, story, in ấn, slide, biển): đỏ, đen, trắng, không màu pha; logo bộ
  21/10/2026 — xem [tham-khao/an-pham.md](tham-khao/an-pham.md).
- **Website** (trang công khai, `/noi-bo`, kho): ba màu cộng năm màu pha, chỉ qua token — bảng "Token màu
  của website" dưới đây.
- **`/noi-bo` và kho không có màu trạng thái**: trạng thái phân biệt bằng chữ, dấu, nét — bảy kiểu
  K1–K7, xem [tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md). Beeftown Cân còn màu trạng thái
  cũ (xanh, vàng) tới PR riêng của nó.
- Phần của mỗi màu trên trang công khai: nền trắng; đen ở đầu trang, chân trang, vài dải; đỏ cho nút,
  nhãn, giá (Khánh quyết 25/10/2026).

Chỉ dùng token, không gõ mã màu thẳng vào component. Không tự thêm sắc ngoài bảng.

### Token màu của website

Một bảng, khai ở **hai nơi cùng giá trị, chưa gộp**: khối `.ck` đầu tiên của
`web/src/styles/cong-khai.css` (trang công khai, `<body class="ck">`) và hai khối `:root` của
`web/src/styles/chung.css` (`/noi-bo` và kho đọc). 12 biến, mỗi biến khai đúng một lần ở mỗi nơi. Tên
biến giữ từ bảng trước (`--kem` mang trắng, `--than` mang đen) — đổi tên là việc sau
(`THUONG-HIEU.md` mục 0, việc 4).
**Đổi một mã là đổi cả hai nơi**, bảng này và `THUONG-HIEU.md` trong cùng PR: ba kiểm thử chép tay
từng mã — `crm/test/test-noi-bo-bang-mau.mjs` (nhóm 1 còn so hai khối với nhau),
`crm/test/test-cong-khai-giao-dien.mjs` và `crm/test/test-ky-nang-thiet-ke.mjs` (so bảng này với cả hai
nơi). Thêm token mới ở `chung.css` thì khai một khối `:root` riêng, như `--do-sau`, `--kem-dam`.
Beeftown Cân chạy không mạng nên khai màu ngay trong `can-app/src/giao-dien.html` và
`can-app/src/huong-dan.html` — chưa đổi sang bảng này (PR riêng, kèm phiên bản mới của chương trình).

| Token | Mã | Tên | Vai ở trang công khai | Vai ở `/noi-bo` và kho |
|---|---|---|---|---|
| `--kem` | `#FFFFFF` | trắng (tên biến cũ) | Nền mặc định; thẻ trong dải xám nhạt / đen / đỏ; ô nhập; chữ trên đen và đỏ; vòng focus trên nền tối | Thẻ, thanh, menu thả, ô nhập (`--nb-the`); chữ trên đầu trang đen và trên nút đỏ |
| `--kem-sau` | `#F4F4F4` | xám nhạt, màu pha | Dải phụ (`.be-kem-sau`, `.be-kem-dam`); thẻ `.the` trên nền trắng | Nền trang (`--nb-nen`); đầu bảng, dòng tổng |
| `--kem-dam` | `#E2E2E2` | xám vạch, màu pha | Nền khi di chuột; nền chờ khung ảnh; nhãn xám | Nút phụ, menu thả khi di chuột; nhãn "lưu ý"; rãnh thanh tiến độ; thẻ đã chọn của `NhanHangChon` |
| `--do` | `#BD0000` | đỏ | Nút chính, nhãn, giá, dải đỏ, chữ nhấn trên nền sáng | Nút chính, số báo việc, "làm ngay"; ô đánh dấu đã chọn |
| `--do-dam` | `#8F0000` | đỏ đậm, màu pha | Nút khi di chuột / đang gửi; câu lỗi dưới ô | Nút khi di chuột; câu lỗi |
| `--do-sau` | `#8F0000` | đỏ đậm, cùng mã `--do-dam` | Chữ nhấn ≤ 13px; chữ nút trên dải đỏ; nền chờ khung ảnh trên dải đỏ | Chưa dùng |
| `--than` | `#000000` | đen (tên biến cũ) | Chữ chính; nền đầu trang, dải đen, chân trang; vòng focus trên nền sáng | Chữ chính; đầu trang; vòng focus; nhãn "nháp"; vạch "xong" |
| `--muc-nhat` | `#555555` | xám chữ phụ, màu pha | Chữ phụ trên nền sáng | Chữ phụ, chữ gợi ý; vạch và vòng "!" của "lưu ý" |
| `--vach` | `#E2E2E2` | xám vạch, màu pha | Vạch ngăn, viền thẻ trên nền sáng | Viền thẻ, vạch ngăn (kho: `--kho-vach`) |
| `--vach-kem` | trắng 22 % | màu pha | Vạch ngăn trên nền đen | — |
| `--da` | `#E2E2E2` | xám vạch, màu pha | **Chỉ** chữ phụ trên nền đen (16,21 : 1) | Chữ phụ trên đầu trang đen |
| `--vien-o` | `#767676` | xám viền ô, màu pha | Viền ô nhập (4,54 : 1 với ô trắng; 4,13 với thẻ xám nhạt) | Viền ô nhập, ô đánh dấu, nút phụ; nét đứt "tắt"; viền nút trên đầu trang đen; vạch đậm của kho (`--kho-vach-dam`) |

`--do-dam` / `--do-sau` cùng mã (gộp khi đổi tên); `--vach`, `--kem-dam`, `--da` cùng mã nhưng khác vai.
Màu viết bằng `rgba()` dùng số RGB của bảng (0, 0, 0 · 255, 255, 255 · 189, 0, 0 · 143, 0, 0): kiểm
thử đỏ khi một file của trang công khai, `/noi-bo` hay kho còn mã hex hay bộ ba số RGB của bảng cũ.

Hai bề mặt của nội bộ (`--nb-nen`, `--nb-the`), token thêm của kho (`--kho-…`) và bảy kiểu vẽ trạng
thái: [tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md).

**Trắng là nền.** Mã viết thẳng chỉ là mã 6 chữ số của bảng: trắng viết `#FFFFFF` hoặc `var(--kem)` —
không `#fff`, không từ khóa `white`, không mã trắng ngà, không `color-mix` với trắng. Trang công khai:
thẻ nền `--kem-sau` trên nền trắng, trắng trên dải khác; ô nhập và ô chọn giờ nền `--kem`; ô đánh dấu tự
vẽ. `/noi-bo` và kho: nền trang `--kem-sau`, thẻ và mọi thứ nổi lên `--kem`, ô nhập `--kem`, ô đánh dấu
và ô chọn một tự vẽ. Ngoại lệ: `@media print` (giấy). Ở trang công khai, thẻ "Đọc nhãn khay"
(`NhanKhay.astro`) là một thẻ `.the` — đặt thẳng, không bóng đổ, nền trắng trên dải đen; nền chờ của
khung ảnh cũng là màu của bảng. `test-cong-khai-giao-dien.mjs` nhóm 7 và `test-noi-bo-bang-mau.mjs`
nhóm 3–4 quét mã nguồn, `do-giao-dien.mjs` đo màu nền của mọi phần tử trên trang công khai đã dựng.

**Không bao giờ:** chữ thường màu đỏ hay đỏ đậm trên nền đen (3,16 và 2,17 : 1 — chỉ chữ ≥ 24px hoặc
hình); chữ `#555555` trên nền đen (2,82 : 1); xám E2 / F4 làm chữ, viền ô, biểu tượng trên nền sáng
(1,30 / 1,10 : 1). Không để đỏ, `#555555`, `#767676`, đen là khác biệt **duy nhất** giữa hai trạng thái
(chỉ chênh 1,12 · 1,46 · 3,16 : 1). `--than` là tên biến cũ của đen: Beeftown nướng **vỉ gas**, không
than.

**Phần của mỗi màu** (Khánh quyết 25/10/2026): nền trắng; đen ở đầu trang, chân trang và hai dải tối
giữ từ 11/10/2026 ("Quầy chọn bò" ở trang chủ, "Bò tại quầy" ở Thực đơn); đỏ cho nút, nhãn, giá. Ba dải
đỏ đang chạy ("Đi cùng nhóm", khối kêu gọi cuối trang Thực đơn và Đến Beeftown) giữ như trước — Khánh xem
ảnh chụp. Đừng đổi bề mặt của một khối để "cho đúng guideline".

### Màu theo bề mặt (trang công khai)

Không chọn màu chữ cho từng chỗ. Đặt **một lớp bề mặt** lên `<section>`, mọi thứ bên trong đọc biến
của bề mặt (`--nen`, `--chu-chinh`, `--chu-phu`, `--nhan`, `--nhan-nho`, `--vien`, `--vong-focus`,
`--nut-nen`, `--nut-chu`, `--nut-phu-nen`, `--nut-phu-chu`).

| Lớp | Nền | Chữ chính | Chữ phụ | Chữ nhấn | Nút chính | Focus |
|---|---|---|---|---|---|---|
| `.be-kem` (mặc định) | trắng | đen | `--muc-nhat` | đỏ (nhỏ: đỏ đậm) | đỏ, chữ trắng | đen |
| `.be-kem-sau` | xám nhạt F4 | đen | `--muc-nhat` | đỏ (nhỏ: đỏ đậm) | đỏ, chữ trắng | đen |
| `.be-kem-dam` | xám nhạt F4 (cùng nền `.be-kem-sau`; tên lớp giữ) | đen | `--muc-nhat` | đỏ (nhỏ: đỏ đậm) | đỏ, chữ trắng | đen |
| `.be-toi` | đen | trắng | `--da` (E2) | **trắng** | đỏ, chữ trắng | trắng |
| `.be-do` | đỏ | trắng | trắng | trắng | **trắng, chữ đỏ đậm** | trắng |

Nút phụ (`.nut-vien`) trên ba bề mặt sáng: **nền trắng, chữ và viền đỏ** (di chuột: nền E2, chữ và viền
đỏ đậm); trên dải đỏ và dải đen: viền và chữ trắng, nền trong. Biểu tượng theo `--nhan`: đỏ trên nền
sáng, trắng trên đỏ và đen.

Muốn màu chữ khác trong một khối: dùng biến bề mặt (`color: var(--chu-phu)`), không dùng token gốc.
Thẻ sáng lồng trong dải đen hay đỏ phải tự khai `.be-kem` — bề mặt sáng đặt lại toàn bộ biến chữ. (Lớp `.the`
đã tự làm việc đó: thẻ luôn là một bề mặt sáng.)

Bảng tương phản đầy đủ (WCAG 2.2, đã tính): `web/THIET-KE.md`, mục 2 cho trang công khai;
[tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md) cho `/noi-bo` và kho (thẻ trắng trên nền xám
nhạt, bảy kiểu trạng thái). Cặp màu mới chưa có trong bảng: tính tỷ lệ trước khi dùng — chữ thường ≥ 4,5 : 1, chữ ≥ 24px
hoặc ≥ 18,66px đậm ≥ 3 : 1, viền ô nhập và biểu tượng mang nghĩa ≥ 3 : 1 (kiểm thử trình duyệt đo đúng
các ngưỡng này ở trang công khai; `test-noi-bo-bang-mau.mjs` tính các cặp của nội bộ và kho).

## Chữ

- **Một họ phông: Montserrat** (Google Fonts, OFL). Website đang chạy dùng bốn độ đậm: **400** chữ
  chạy · **600** điều hướng, nhãn ô, chú thích · **700** tiêu đề, nút, tên món · **800** tên thương
  hiệu, số lớn và tên nhóm món của trang Thực đơn (chữ hoa). Guideline 21/10/2026 chỉ ghi **phông của
  logo**: Figtree ExtraBold / SemiBold — chỉ nằm trong logo, vì Figtree thiếu chữ có dấu tiếng Việt.
  Khánh quyết 26/10/2026: chữ web giữ Montserrat, không đổi độ đậm. Ấn phẩm in cũng theo web
  (400 / 600 / 700 / 800) cho tới khi Khánh nói khác (`THUONG-HIEU.md` mục 0, câu còn mở).
- Giá ghi dạng `000.000 đ`, ngày dạng `dd/mm/yyyy` (guideline).
- Trang `/ko` thêm **Noto Sans KR** ngay sau Montserrat; `word-break: keep-all`; tiêu đề không siết
  chữ, `line-height` 1,28; chữ hoa nhỏ giãn ít hơn. **Cỡ chữ như vi / en** — không quy tắc nào co cỡ
  h1 riêng cho một thứ tiếng (h1 tiếng Hàn 32/41 → 48/61px).
- **Logo luôn là SVG bộ 21/10/2026** (`web/public/thuong-hieu/`) — không gõ chữ BEEFTOWN bằng phông
  nào, kể cả Figtree. Không thêm phông display, không tự thay bằng một phông "vui" khác.
- Tiêu đề lớn `line-height` ≥ 1,08 — dấu chồng tiếng Việt (ễ, ậ) cần chỗ. `text-wrap: balance` cho
  tiêu đề, `pretty` cho đoạn văn.
- **Sàn cỡ chữ 13px**; chân trang 14px. Ngoại lệ duy nhất: dòng nhỏ viết hoa đậm giãn chữ (`.hieu`,
  nhãn món) 12px.
- Ô nhập luôn 16px — iPhone tự phóng to khi chạm vào ô nhỏ hơn.

Thang chữ trang công khai (khai trên `.ck`; theo plan redesign 11/10/2026):

| Biến | Cỡ | Dùng cho |
|---|---|---|
| `--co-h1` | 32 → 48px, dòng 1,17 (32/38 → 48/56px); tiếng Hàn cùng cỡ, dòng 1,28 | Câu chính màn đầu và tiêu đề đầu trang con |
| `--co-h2` | 26 → 36px | Tiêu đề khối — luôn nhỏ hơn h1 |
| `--co-h3` | 18 → 20px | Tiêu đề nhỏ; tên món (đậm 700, chữ thường — món dẫn đầu 1,25 lần) |
| `--co-nhom` | 28 → 40px, đậm 800, chữ hoa | Tên nhóm món của trang Thực đơn, kiểu tiêu đề trang của cuốn menu bản sáng — to hơn h2, **không bao giờ to hơn h1**; câu dưới tên nhóm dùng `--co-dan` đậm 700 |
| `--co-dan` | 18 → 20px | Đoạn dẫn `.dan`, tối đa 58 ký tự một dòng |
| `--co-than` | 16px, dòng 24px | Chữ chạy, ở mọi bề rộng |
| `--co-nho` | 14px | Chữ phụ `.nho`, gợi ý dưới ô |
| `--co-ti` | 13px | Sàn — nhãn |
| `--co-so` | 44 → 68px | Số thứ tự của ba bước — không quá 3,6 lần tiêu đề của bước |

## Khoảng cách, khung, hình khối

- Khoảng cách theo thang `--k-1` … `--k-10`: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128px. Không
  số lẻ ngoài thang.
- Lề `--le` = `clamp(20px, 5vw, 40px)` (20px tới màn 400px, 21,5px ở 430px, 40px từ 800px); khung `.khung` 1200px, `.khung-hep` 760px.
  Đệm trên dưới một khối `--muc-dem`: 56px (điện thoại) → 96px (máy tính).
- Đầu trang `--cao-dau`: 64px; từ 1080px là 80px.
- Bo góc `--bo` 4px (nút, ô) và `--bo-anh` 6px (ảnh, thẻ). **Không bo tròn kiểu viên thuốc.**
- Thẻ: đệm `--dem-the` 20px (từ 600px: 24px), viền mảnh, **không bóng đổ**; thẻ trên nền trắng là F4.
- Chuyển màu `--nhanh` 180ms. Di chuột: đổi màu, **không phóng to, không bóng đổ**. Không hiệu ứng
  khi cuộn. `prefers-reduced-motion` tắt mọi chuyển động (đã có trong `chung.css`).
- Mốc màn hình: **600** (điện thoại → máy tính bảng) ·
  **768** (đầu trang: ngôn ngữ và Hỏi bàn lên thanh) · **900** (hai cột) · **1024** · **1080** (đầu
  trang đủ điều hướng). Kiểm ở 360 / 390 / 430 / 768 / 1024 / 1440px; không tràn ngang từ 320px (dưới
  360px đầu trang dùng brandmark trắng thay logo phụ, và màn đầu trang chủ đưa ảnh lên ngay sau câu
  chính: phần chữ ở cỡ đó dài hơn một màn hình, ảnh tải ngay không được nằm hẳn dưới màn hình đầu. Từ
  360px ảnh đứng sau hai nút, đỉnh ảnh ở 551–606px — điện thoại thật chỉ thấy mép trên của ảnh ở màn
  hình đầu).
- Không dùng `100vw` (tính cả thanh cuộn → tràn ngang).
- **Vùng chạm ≥ 48px ở mọi khu** (`--cham` trên trang công khai): nút, link điều hướng, link chân
  trang, liên kết có mũi tên, ô nhập, ô chọn giờ; hàng câu hỏi 56px.

Thang trên là của trang công khai. Nội bộ và kho có thang riêng (đơn vị `rem`, mật độ cao hơn, thẻ
trắng trên nền xám nhạt, trạng thái bằng chữ, dấu, nét): [tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md).

## Thành phần — dùng cái có sẵn trước

Trước khi viết CSS mới, tìm lớp hoặc component đã có. Danh mục đầy đủ kèm props và khung mẫu một
khối: [tham-khao/trang-cong-khai.md](tham-khao/trang-cong-khai.md) (công khai),
[tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md) (nội bộ, kho). Những luật hay bị quên:

- **Nút** `.nut` + `.nut-chinh` | `.nut-vien` (bản gọn trên thanh đầu trang: `.nut-nho`). Cao 48px,
  đệm ngang 20px, bo 4px. **Mỗi nhóm nút (`.hang-nut`) chỉ một nút chính.** Đang gửi:
  `aria-busy="true"` → **tối đi chứ không mờ đi**. **Mọi `:hover` của trang công khai nằm trong
  `@media (hover: hover)`** (màn cảm ứng giữ `:hover` sau khi chạm); phản hồi lúc chạm là `:active`,
  đặt ngoài khối đó. Nút / link tới `/dat-ban` luôn ghi **"Hỏi bàn" /
  "Ask for a table" / "테이블 문의"** (`t.datBan`).
- **Liên kết có mũi tên** `.lien-ket` + `<BieuTuong ten="mui-ten" />` — chữ gạch chân, không đóng hộp.
- **Biểu tượng**: hai bộ SVG nét tự vẽ, không trộn. Trang công khai: `web/src/components/BieuTuong.astro`
  (nét 1,5px) — mui-ten, menu, dong, cong, tru, khay, nhan, vi-gas, thang-may, nhom, ghim, sao-chep,
  da-chep, dien-thoai, tin-nhan, mon-song, co-con, cua. Bộ này hiện ở cỡ 24px, nét không co theo cỡ;
  biểu tượng trong thứ bấm được luôn kèm nhãn chữ. Nội bộ và kho:
  `web/src/components/kho/BieuTuong.astro` (nét 2px, tên trong `web/src/lib/kho/bieu-tuong.ts`).
  Thiếu thì vẽ thêm vào đúng bộ, cùng lưới 24 và cùng nét — **không emoji, không thư viện biểu tượng**.
- **Ảnh** chỉ qua `<Anh id="…">`; chỗ chưa có ảnh thật là `<KhungAnh loai="…">` — không bao giờ
  `<img>` trỏ tới file không có, không hộp xám, không chữ "ảnh đang cập nhật". Ảnh của một món: chỉ qua
  `ANH_CUA_MON` (`web/src/lib/anh.ts`, khóa theo mã món) trong `ThucDonNhomAnh.astro`.
- **Thực đơn kiểu cuốn menu bản sáng** (`ThucDonNhomAnh.astro` + `ThucDonMon.astro`): tên nhóm chữ hoa
  800 (`--co-nhom`) màu `--nhan`, câu của nhóm (`CAU_NHOM`, khóa theo mã nhóm), món dẫn đầu chữ trái –
  ảnh phải từ 768px, các món còn lại lưới thẻ ảnh trên chữ dưới từ 600px; **dưới 600px món đứng sau món
  dẫn đầu là hàng gọn** — ảnh nhỏ 128px (`--k-10`, khung `gon` của `ANH_CUA_MON`) bên trái, chữ bên phải;
  nhóm không có món dẫn đầu (hai tartare) giữ thẻ to; Đồ uống chưa có món không cồn thì vẫn in tên các nhóm
  không cồn cạnh ảnh ba ly không cồn; không giá
  khi `gia` null, không độ cay, không sao "Nên thử". Bố cục và lý do: `web/THIET-KE.md` mục 1, "Trang Thực đơn".
- **Form**: nhãn trên ô (không placeholder thay nhãn), ô một dòng cao đúng 48px (kể cả ô ngày) nền
  trắng viền `--vien-o`, ô tự điền (`:autofill`) vẫn nền trắng, lỗi sát ô
  bằng câu chữ màu đỏ đậm (`.loi-o` + `aria-invalid` + `aria-describedby`), không tick sẵn ô đồng ý
  nhận tin, chặn bấm đúp, giữ dữ liệu đã gõ khi lỗi mạng. Form chưa sẵn sàng thì **ẩn hẳn** — không
  hiện nút mờ.

## Ảnh, logo

- **Ảnh minh họa** (AI) chỉ cho ảnh không khí món, ảnh món và bữa ăn, luôn có nhãn **"Ảnh minh họa"** ngay
  trong khung ảnh (`<Anh>` tự gắn). Ảnh món của trang Thực đơn lấy từ cuốn menu bản sáng (11/10/2026) —
  kể cả ảnh "đã duyệt" của menu chuẩn 29/09 chưa rõ chụp thật hay dựng: vẫn gắn nhãn. **Ảnh tách nền**
  (`tachNen` trong `DANH_MUC_ANH`): khung `.tach-nen` trong suốt, không bo góc, món đặt thẳng lên nền;
  `web/cong-cu/anh/tao-co-anh.py` (mục `tach_nen` của `danh-sach.json`) chừa dải trống 12–14 % ở đáy khung
  và nhãn nằm giữa đáy — ngay dưới món, không đè lên món; ảnh nhỏ 128px của hàng món gọn có khung riêng
  (dải đáy 20 %, nhãn đệm hẹp, một dòng). Phép đo `anh` đếm điểm ảnh đặc dưới nhãn của ảnh tách nền
  (canvas) — phải là 0. Ảnh tách nền nén AVIF 40 / WebP 60; `public/anh` giữ dưới 6,8 MB, chừa chỗ cho ảnh
  chụp thật (ngân sách: `web/THIET-KE.md` mục 7). Khánh quyết ngày 11/10/2026: ảnh AI được lên trang; **bàn tay người
  thì được, mặt người thì không**; hai ảnh bữa ăn có món phụ (`mon-an-chia-se`, `bua-an-cung-ban`) là
  hình minh họa — câu chữ và alt không kể tên, không hứa món phụ nào. **Quầy, khay skin-pack, không
  gian quán, lối vào, thang máy, mặt người: chỉ ảnh chụp thật** (cho tới khi có: `<KhungAnh>`). Không
  ảnh kho (Unsplash…). Không than, củi, khói giả trong ảnh.
- **Trên ảnh không đặt gì khác**: không logo, không chữ chồng lên; khung
  ảnh bo 6px, không bóng đổ, không viền. Ảnh nào đã dựng cỡ thì phải có chỗ dùng — không để file ảnh
  chết trong `web/public/anh/`. Bảng từng ảnh và cách dựng: `web/THIET-KE.md`, mục 7.
- **Logo bộ 21/10/2026** ở `web/public/thuong-hieu/`, tách nguyên path từ PDF Brand Guidelines bằng
  `web/cong-cu/thuong-hieu/tach-logo.mjs` — không vẽ lại, không vẽ bằng AI, không sửa tay. Ba biến thể ×
  ba bản màu: logo chính `logo-ngang-{do,den,trang}.svg`, logo phụ `chu-beeftown-{do,den,trang}.svg`,
  brandmark `dau-bo-{do,den,trang}.svg`; riêng đầu bò `net-dau-bo.svg` chỉ để dựng biểu tượng app.
  Đúng bản cho nền: đỏ trên trắng, đen trên xám nhạt hay giấy in, trắng trên đỏ và đen. Chỗ dùng: đầu
  trang công khai và `/noi-bo` logo phụ trắng; chân trang logo chính trắng; thẻ "Đọc nhãn khay" logo
  chính đỏ; đầu trang kho brandmark trắng; trang in của kho logo chính đen. Biểu tượng tab, favicon, ảnh
  chia sẻ, biểu tượng app dựng từ các SVG đó bằng `web/cong-cu/thuong-hieu/tao-bieu-tuong.py`. SVG chỉ
  được dùng `#BD0000`, `#000000`, `#FFFFFF` (`BANG_MAU` của `test-cong-khai-giao-dien.mjs`).
- **Luật logo** (guideline trang 2–5, mọi nơi): khoảng trống mỗi phía một ô đầu bò; chỉ ba bản màu;
  **không** đổi màu, kéo giãn, xoay, thêm bóng hay viền, đặt lên ảnh, gõ lại bằng phông; mỗi bề mặt một
  logo; đặt bản đỏ / đen lên nền đỏ / đen là sai (nền tối dùng bản trắng). Cỡ: logo chính ≥ 160px, hẹp
  hơn dùng logo phụ hoặc brandmark; brandmark ≥ 48px — luật giữ từ bộ 09/10/2026 (guideline 21/10/2026
  không ghi cỡ). Thanh đầu trang 64 / 80px dùng logo phụ 148px (176px từ 1080px) để đủ khoảng trống.
- Mockup trong PDF nhận diện cũ (mặt tiền, biển, đồng phục, menu, giá 400.000, câu "Thịt chuẩn - Giá
  thật") **chỉ là tham chiếu** — không đưa lên trang.
- Manifest từng tài sản (nguồn, chỗ dùng, trạng thái, điều kiện thay) và brief chụp ảnh:
  `web/THIET-KE.md`, mục 7 – 8.
- Hai tài liệu thiết kế còn ở gốc repo (`Beeftown_Bo_Nhan_Dien_So.html`, `Beeftown_CRM_Design.html`),
  cùng bốn tài liệu và bản nháp website đã lưu trữ 12/10/2026 (Logo Suite, Instore Art, Dashboard,
  Concept Board, bản nháp website — [commit 9443cc2](https://github.com/volekhanh123/beeftown-stock/tree/9443cc2cabb71b792772b1a52d7c134edab456cc)), làm **trước** brief 06/10/2026: phông
  Baloo / Anton, bảng màu khác, "Thịt chuẩn · Giá thật", phòng riêng, giá — **đã cũ, không chép**.
  Phần còn dùng được (kích thước mạng xã hội, luật đặt logo) và cỡ ấn phẩm:
  [tham-khao/an-pham.md](tham-khao/an-pham.md).

## Câu chữ

Giọng **ấm áp, thẳng thắn, như một người bán thịt lành nghề**. Thân thiện với gia đình, chuyên nghiệp
với khách công ty. Chi tiết và ví dụ: [tham-khao/cau-chu.md](tham-khao/cau-chu.md).

- **Đúng sự thật.** "Đã nhận yêu cầu" khác "thành công" — chỉ nói thành công khi database đã xác
  nhận; hết giờ chờ thì nói "không chắc đã ghi nhận". Không bao giờ dựng câu báo thành công cho đặt bàn.
- **Không claim chưa xác nhận:** số ngày ủ, phương pháp ủ, grade, xuất xứ, Wagyu; nướng than; phòng
  riêng; số bàn còn trống; so sánh nhất; lấy giá làm mồi câu. Không giá, ngày, ưu đãi, đếm ngược khi
  chưa công bố. Danh sách máy chặn kèm lý do: `web/src/lib/chuoi-cam.js` (kiểm thử và `npm run quet`).
- Không dùng chữ **"rẻ"** — thay bằng *hợp lý*, *xứng đáng*, *giá thật*. Máy chỉ chặn "rẻ hơn"; chữ
  trơn thì người viết tự giữ.
- **Đủ thứ tiếng**: trang công khai vi / en / ko, nội bộ và kho vi / en — không câu Việt nào nằm ngoài
  cặp `{ vi, en }` / bộ `{ vi, en, ko }`.
- **Không viết tắt** trong câu cho người đọc lẫn trong mã (tên hàm, biến, chú thích tiếng Việt).
- Guideline cấm thêm: **buffet, cao cấp, Korean BBQ, nướng Hàn**, chữ về than, lửa, khói, số phần
  trăm khi chưa có phép thử.
- Tagline *Pick it, grill it, love it!* (dấu phẩy, chấm than — theo logo, Khánh chốt 26/10/2026; logo
  chính đã in tagline, đừng gõ lại cạnh logo) — descriptor *Beef Specialty Restaurant*. Câu chính cho
  khách: *Không cần rành bò. Chọn theo gu, thấy giá trước.*
- **Địa điểm: Tầng 3, 63 Hồ Tùng Mậu** — khách vào bằng lối vào riêng ngay cạnh GS25 và đi thang máy
  lên tầng 3 (Khánh xác nhận ngày 11/10/2026: địa điểm có thang máy; nút thang máy ghi số mấy cho tầng
  của quán thì chưa biết). Mã đã ghi đúng như vậy (`DIA_CHI_NHA_HANG`, `loiLen` trong
  `web/src/lib/chu.ts`). Chỉ nói mấy điều đó: **không ghi tên phường hay quận** (chưa có giấy xác nhận), không gọi là "tòa nhà",
  không kể chuyện đổi địa điểm, không thêm chỗ gửi xe, số phút, số mét, lối cho xe lăn. Dòng địa chỉ
  pháp nhân ở chân trang là chữ trên giấy đăng ký, **khác** địa chỉ nhà hàng — không sửa, chờ Khánh
  quyết. Chi tiết, việc chờ Khánh duyệt và kiểm thử gác: [tham-khao/cau-chu.md](tham-khao/cau-chu.md),
  mục "Dữ kiện cố định".

## Tiếp cận

Focus 3px cách 3px, màu theo bề mặt · vùng chạm ≥ 48px · trạng thái đang chọn không chỉ khác bằng màu (thứ tiếng đang xem: chữ đậm và nét gạch) · mỗi trang đúng một `h1` · câu tiếng Anh
trong trang Việt có `lang="en"` · alt ba thứ tiếng tả món (`DANH_MUC_ANH` trong `web/src/lib/anh.ts`),
logo cạnh chữ "Beeftown" để `alt=""` · **không giấu nội dung sau JavaScript** (menu gọn
và hỏi đáp dùng `<details>`; không JavaScript vẫn đọc được đủ; lớp phủ và khoá cuộn của menu gọn chỉ
có khi script đã chạy).

## Quy trình một thay đổi giao diện

1. **Bước 0** ở trên: khu nào, mấy thứ tiếng, layout nào.
2. Đọc phần tham khảo của khu đó; tìm component / lớp có sẵn (`grep -rn "class=\"tên-lớp" web/src`).
3. Viết bằng token và biến bề mặt. Câu chữ đủ thứ tiếng ngay từ đầu, không "dịch sau".
4. Trang công khai phải **đúng và đủ khi chưa có database** — CI build không có `.env`; nội dung chưa
   công bố thì ẩn phần tử, không để ô trống.
5. Chạy kiểm tra (dưới) và xem ảnh chụp ở các bề rộng — đừng chỉ đọc mã.
6. Mô tả PR theo mẫu 9 mục của `CLAUDE.md`; mục `cau-chu` và `chu-va-so` thường là của giao diện.

## Kiểm tra trước khi xong

```bash
cd crm && npm test                                     # gồm quét chữ dính, chữ cấm, giao diện, tiếng Anh
node test/dinh-chu.mjs ../web/src/components/<file>.astro   # chữ dính của một component
cd ../web && npx astro check && npm run quet && npm run thu-trinh-duyet -- --khong-build   # quet vừa build (không database)
npm run thu-day-du -- --chup                           # ảnh chụp 360 / 390 / 768 / 1024 / 1440 × vi / en / ko
```

Kiểm thử nào gác luật nào, và bẫy hay gặp: [tham-khao/kiem-thu.md](tham-khao/kiem-thu.md).

Danh sách tự rà:

- [ ] Đúng khu, đúng layout, không lớp lạc khu.
- [ ] Màu đúng bảng: ấn phẩm chỉ đỏ, đen, trắng; màn hình thêm đỏ đậm và bốn xám, chỉ qua token;
      không màu trạng thái — hai trạng thái cạnh nhau khác nhau ở chữ, dấu hay nét.
- [ ] Chỉ token / biến bề mặt; không chữ đỏ thường hay `#555555` trên nền đen; cặp màu mới đã tính
      tương phản.
- [ ] Thẻ không bóng đổ; không hình trang trí của bộ cũ; logo đúng bản cho nền; mỗi nhóm nút một nút
      chính.
- [ ] Montserrat, đúng độ đậm; không chữ < 13px (trừ dòng hoa nhỏ 12px); ô nhập 16px.
- [ ] Nút, link, biểu tượng, ảnh dùng component có sẵn; không emoji; không `<img>` trỏ file chưa có.
- [ ] Ảnh AI có nhãn "Ảnh minh họa", không cho thấy quầy, khay, không gian, lối vào, thang máy, mặt
      người; không logo hay chữ đặt lên ảnh; alt tả đúng thứ nhìn thấy, đủ vi / en / ko.
- [ ] Không tràn ngang ở 360px; vùng chạm ≥ 48px; focus thấy rõ trên mọi bề mặt.
- [ ] Câu chữ đúng sự thật, đủ thứ tiếng, không chữ cấm, không claim chưa xác nhận; địa điểm chỉ là
      Tầng 3, 63 Hồ Tùng Mậu, lối vào riêng ngay cạnh GS25, thang máy — không phường, quận, không gì thêm.
- [ ] Không JavaScript vẫn dùng được; `prefers-reduced-motion` không còn chuyển động.
- [ ] Trang công khai đúng khi chưa có database.
- [ ] File mới có dòng mở trong `.gitignore` (`git status --short` thấy nó).
