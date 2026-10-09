---
name: thiet-ke-beeftown
description: Guideline thiết kế Beeftown — hệ giao diện "Quầy thịt ấm" (màu theo bề mặt, Montserrat, artwork trích từ PDF nhận diện), giao diện nội bộ /noi-bo và kho, câu chữ ba thứ tiếng, ảnh, logo và ấn phẩm (ảnh chia sẻ, bài đăng, story). Dùng khi tạo hoặc sửa BẤT KỲ thứ gì người khác nhìn thấy của Beeftown — trang, component, CSS trong web/, màu, phông, nút, form, bảng, biểu tượng, ảnh, câu thông báo, bài đăng mạng xã hội, banner, slide, landing page — kể cả câu hỏi nhanh như "đỏ Beeftown mã gì". Use for any Beeftown UI, brand, copy or visual design work.
---

# Thiết kế Beeftown

Skill này là **bản đồ và luật vận hành** để làm giao diện Beeftown đúng ngay lần đầu. Nó không thay
tài liệu gốc — khi hai bên lệch nhau, thứ tự thắng là:

1. **Sự thật kinh doanh** — `README.md` gốc, mục "Concept" và "Giọng văn"; brief Khánh gửi.
2. **`web/THIET-KE.md`** — hệ giao diện trang công khai, lý do từng quyết định, manifest tài sản.
3. **Mã đang chạy** — `web/src/styles/*.css`, component trong `web/src/components/`.
4. Skill này.

Thấy skill lệch mã: sửa skill trong cùng PR. `crm/test/test-ky-nang-thiet-ke.mjs` bắt mã màu, đường
dẫn và tên biểu tượng ghi trong skill mà không còn khớp với mã.

## Bước 0 — đang làm cho khu nào?

Mỗi khu có CSS, layout và số thứ tiếng riêng. Xác định trước khi viết dòng nào.

| Khu | Ai nhìn | Layout · CSS | Thứ tiếng | Đọc tiếp |
|---|---|---|---|---|
| Trang công khai (`/`, `/en/…`, `/ko/…`) | Khách | `web/src/layouts/Trang.astro` · `chung.css` + `cong-khai.css` (mọi quy tắc dưới `body.ck`) | vi / en / ko | [tham-khao/trang-cong-khai.md](tham-khao/trang-cong-khai.md) |
| Nội bộ (`/noi-bo`) | Chủ, quản lý, nhân viên | `web/src/layouts/NoiBo.astro` · `chung.css` + `noi-bo.css` | vi / en | [tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md) |
| Kho (`/noi-bo/kho`) | Thủ kho, quầy, kế toán — nhiều trên điện thoại | `web/src/layouts/Kho.astro` · `chung.css` + `kho.css` + `kho-khung.css` | vi / en | [tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md) |
| Beeftown Cân (`can-app/`) | Máy tính ở quầy | `can-app/src/*.html` | vi | [tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md) |
| Ấn phẩm ngoài web | Khách trên mạng xã hội, tại quán | — | vi (en / ko khi cần) | [tham-khao/an-pham.md](tham-khao/an-pham.md) |

Mọi khu dùng chung bảng màu và Montserrat. **Đừng mang lớp của khu này sang khu kia**: lớp `.nut`,
`.be-kem`… của trang công khai chỉ sống dưới `.ck`; `cong-khai.css` chỉ `Trang.astro` được nạp
(có kiểm thử).

## Hướng thẩm mỹ: "Quầy thịt ấm"

Trang như lúc bước tới quầy Beeftown — một tiệm thịt tử tế, gần gũi như bữa tối cả nhà.

- **Nền kem** như giấy gói tiệm thịt — nền đọc, phần lớn trang.
- **Đỏ Beeftown** là nhãn, tem và nút — dẫn hành động, vài khoảnh khắc nhận diện.
- **Vài dải tối có chủ đích** — "bữa tối bên vỉ", thịt và ánh ấm sáng lên trên nền tối.
- **Một chút vui** lấy từ chính artwork của PDF: mảng vân mỡ, nét rosemary, nét miếng steak, tem tròn,
  chữ BEEFTOWN lặp. Tiết chế — vài điểm mỗi trang.
- **Nhịp editorial**: chữ lớn, khoảng trống rộng, nhịp thay đổi. Thực đơn và form phải **yên và rõ**,
  không trang trí chen vào.

**Tránh:** mọi khối là ba thẻ giống nhau; pill / card ở mọi nơi; gradient tím xanh; kính mờ; hiệu
ứng cuộn; bộ đen – vàng kiểu "sang trọng"; giọng fine dining xa cách; giao diện thiên về trẻ em;
emoji làm biểu tượng.

Định vị **cao cấp vừa tầm** — không bình dân, không sang trọng xa cách. Khách chính: người trưởng
thành đi cùng gia đình, người thân; rồi bạn bè, nhóm văn phòng.

## Màu

Chỉ dùng token, không gõ mã màu thẳng vào component. Không tự thêm sắc ngoài bảng.

| Token | Mã | Tên trong PDF | Vai |
|---|---|---|---|
| `--kem` | `#FBF4E1` | Cream | Nền đọc mặc định; chữ trên nền tối và nền đỏ |
| `--kem-sau` | `#F5ECD7` | — | Nền khối phụ nhẹ |
| `--kem-dam` | `#F1E4C2` | lớp lót logo | Nền khối phụ đậm hơn |
| `--do` | `#B23A2C` | Beef Red | Nút chính, nhãn, dải đỏ, chữ nhấn cỡ thường trên kem |
| `--do-dam` | `#8F2C21` | — | Nút khi di chuột / đang gửi; câu lỗi dưới ô nhập |
| `--do-sau` | `#960F13` | đỏ vân mỡ | Chữ nhấn ≤ 13px trên kem; chữ nút trên nền đỏ; nét artwork trên kem |
| `--than` | `#1E160E` | Charcoal | Chữ chính trên kem; nền dải tối |
| `--muc-nhat` | than 68 % | — | Chữ phụ trên kem |
| `--da` | `#B8A98C` | Warm Stone | **Chỉ** chữ phụ trên nền tối |
| `--mu-tat` | `#F2A900` | Mustard | Điểm nhấn nhỏ: vạch, chấm, chữ nhấn trên nền tối |
| `--cuc-vang` | `#F5C211` | Marigold | Vòng focus trên nền tối |
| `--vien-o` | `#8C8577` | — | Viền ô nhập (3,3 : 1 với kem) |

Token khai ở `web/src/styles/chung.css`. Khối `:root` đầu tiên là của chung cả ba khu — **không sửa
giá trị** (có kiểm thử); thêm token mới thì khai khối `:root` riêng như `--do-sau`, `--kem-dam`.

**Không bao giờ:** Warm Stone, Mustard, Marigold làm chữ trên nền kem (tương phản 1,5 – 2,1 : 1).
Không khối vàng — vàng chỉ là vạch, chấm, chữ nhấn nhỏ trên nền tối. Tên `--than` (Charcoal) chỉ là
tên màu: Beeftown nướng **vỉ gas**, không than.

**Tỷ lệ gợi ý** (brief, chưa phải luật thương hiệu): kem 60 % / tối 25 % / đỏ 12 % / vàng 3 %.

### Màu theo bề mặt (trang công khai)

Không chọn màu chữ cho từng chỗ. Đặt **một lớp bề mặt** lên `<section>`, mọi thứ bên trong đọc biến
của bề mặt (`--nen`, `--chu-chinh`, `--chu-phu`, `--nhan`, `--nhan-nho`, `--vien`, `--vong-focus`,
`--nut-nen`, `--nut-chu`, `--net-ve`).

| Lớp | Nền | Chữ chính | Chữ phụ | Chữ nhấn | Nút chính | Focus |
|---|---|---|---|---|---|---|
| `.be-kem` (mặc định) | kem | than | `--muc-nhat` | đỏ (nhỏ: đỏ sâu) | đỏ, chữ kem | than |
| `.be-kem-sau` | kem sau | than | `--muc-nhat` | đỏ | đỏ, chữ kem | than |
| `.be-kem-dam` | kem đậm | than | `--muc-nhat` | **đỏ sâu** | đỏ, chữ kem | than |
| `.be-toi` | than | kem | Warm Stone | Mustard | đỏ, chữ kem | Marigold |
| `.be-do` | đỏ | kem | kem | kem | **kem, chữ đỏ sâu** | kem |

Muốn màu chữ khác trong một khối: dùng biến bề mặt (`color: var(--chu-phu)`), không dùng token gốc.
Thẻ sáng lồng trong dải tối phải tự khai `.be-kem` — bề mặt sáng đặt lại toàn bộ biến chữ.

Bảng tương phản đầy đủ (WCAG 2.2, đã tính): `web/THIET-KE.md`, mục 2. Cặp màu mới chưa có trong
bảng: tính tỷ lệ trước khi dùng — chữ thường ≥ 4,5 : 1, chữ ≥ 24px hoặc ≥ 19px đậm ≥ 3 : 1, viền ô
nhập ≥ 3 : 1.

## Chữ

- **Một họ phông: Montserrat** (Google Fonts, OFL), bốn độ đậm: **400** chữ chạy · **600** điều
  hướng, nhãn ô, chú thích · **700** tiêu đề, nút, tên món · **800** tên thương hiệu và số lớn.
- Trang `/ko` thêm **Noto Sans KR** ngay sau Montserrat; `word-break: keep-all`; tiêu đề không siết
  chữ, `line-height` 1,28; chữ hoa nhỏ giãn ít hơn.
- **Logo luôn là vector gốc** (`web/public/thuong-hieu/`) — không bao giờ gõ chữ BEEFTOWN bằng phông.
- Hypo-me Bold, NVN Beloved Bold (ghi trong PDF) **chưa có file và giấy phép** — không dùng, không tự
  thay bằng một phông "vui" khác.
- Tiêu đề lớn `line-height` ≥ 1,08 — dấu chồng tiếng Việt (ễ, ậ) cần chỗ. `text-wrap: balance` cho
  tiêu đề, `pretty` cho đoạn văn.
- **Sàn cỡ chữ 13px.** Ngoại lệ duy nhất: dòng nhỏ viết hoa đậm giãn chữ (`.hieu`, nhãn món) 12px.
- Ô nhập luôn 16px — iPhone tự phóng to khi chạm vào ô nhỏ hơn.

Thang chữ trang công khai (khai trên `.ck`):

| Biến | Cỡ | Dùng cho |
|---|---|---|
| `--co-h1` | 36 → 76px | Câu chính màn đầu (đầu trang con 36 → 64px) |
| `--co-h2` | 28 → 48px | Tiêu đề khối |
| `--co-h3` | 19 → 22px | Tiêu đề nhỏ, câu hỏi |
| `--co-dan` | 18 → 21px | Đoạn dẫn `.dan`, tối đa 58 ký tự một dòng |
| `--co-than` | 17px (16px dưới 600px) | Chữ chạy |
| `--co-nho` | 14px | Chữ phụ `.nho`, gợi ý dưới ô |
| `--co-ti` | 13px | Sàn — nhãn, chân trang |
| `--co-so` | 52 → 104px | Số lớn của ba bước |

## Khoảng cách, khung, hình khối

- Khoảng cách theo thang `--k-1` … `--k-10`: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128px. Không
  số lẻ ngoài thang.
- Lề `--le` = `clamp(20px, 5vw, 40px)`; khung `.khung` 1240px, `.khung-hep` 760px.
- Bo góc `--bo` 4px (nút, ô) và `--bo-anh` 6px (ảnh, thẻ). **Không bo tròn kiểu viên thuốc.**
- Chuyển màu `--nhanh` 180ms. Di chuột: đổi màu, **không phóng to, không bóng đổ**. Không hiệu ứng
  khi cuộn. `prefers-reduced-motion` tắt mọi chuyển động (đã có trong `chung.css`).
- Mốc màn hình: **400** (ẩn bớt trang trí, `.an-khi-hep`) · **600** (điện thoại → máy tính bảng) ·
  **900** (hai cột) · **1024** · **1080** (đầu trang đủ bốn mục). Kiểm ở 360 / 390 / 768 / 1024 /
  1440px.
- Không dùng `100vw` (tính cả thanh cuộn → tràn ngang). Khối có trang trí lấn mép: `.co-trang-tri`.
- **Vùng chạm**: trang công khai ≥ 44px, nút chính 52px; **nội bộ và kho ≥ 48px** cho mọi nút và ô
  nhập (dùng bằng ngón cái, ở quầy).

Thang trên là của trang công khai. Nội bộ và kho có thang riêng (đơn vị `rem`, mật độ cao hơn, thẻ
trắng, màu trạng thái xanh / vàng / đỏ / xám): [tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md).

## Thành phần — dùng cái có sẵn trước

Trước khi viết CSS mới, tìm lớp hoặc component đã có. Danh mục đầy đủ kèm props và khung mẫu một
khối: [tham-khao/trang-cong-khai.md](tham-khao/trang-cong-khai.md) (công khai),
[tham-khao/noi-bo-va-kho.md](tham-khao/noi-bo-va-kho.md) (nội bộ, kho). Những luật hay bị quên:

- **Nút** `.nut` + `.nut-chinh` | `.nut-vien` (nhỏ: `.nut-nho`). Đang gửi: `aria-busy="true"` →
  **tối đi chứ không mờ đi**. Nút / link tới `/dat-ban` luôn ghi **"Hỏi bàn" / "Ask for a table" /
  "테이블 문의"** (`t.datBan`).
- **Liên kết có mũi tên** `.lien-ket` + `<BieuTuong ten="mui-ten" />` — chữ gạch chân, không đóng hộp.
- **Biểu tượng**: hai bộ SVG nét tự vẽ, không trộn. Trang công khai: `web/src/components/BieuTuong.astro`
  (nét 1,5px) — mui-ten, menu, dong, cong, khay, nhan, vi-gas, cau-thang, nhom, ghim, sao-chep,
  da-chep, dien-thoai, tin-nhan, mon-song, co-con, cua. Nội bộ và kho:
  `web/src/components/kho/BieuTuong.astro` (nét 2px, tên trong `web/src/lib/kho/bieu-tuong.ts`).
  Thiếu thì vẽ thêm vào đúng bộ, cùng lưới 24 và cùng nét — **không emoji, không thư viện biểu tượng**.
- **Ảnh** chỉ qua `<Anh id="…">`; chỗ chưa có ảnh thật là `<KhungAnh loai="…">` — không bao giờ
  `<img>` trỏ tới file không có, không hộp xám, không chữ "ảnh đang cập nhật".
- **Form**: nhãn trên ô, lỗi sát ô (`.loi-o` + `aria-invalid` + `aria-describedby`), không tick sẵn ô
  đồng ý nhận tin, chặn bấm đúp, giữ dữ liệu đã gõ khi lỗi mạng. Form chưa sẵn sàng thì **ẩn hẳn** —
  không hiện nút mờ.
- **Trang trí** `.trang-tri` (`aria-hidden="true"`, không bắt chuột); nét một màu `.net.huong-thao-1…5`,
  `.steak-1/2` tô qua `--net-ve`. Không đặt trong danh sách món và form.

## Ảnh, logo, artwork

- **Ảnh minh họa** (AI) chỉ cho ảnh không khí món, luôn có chú thích **"Ảnh minh họa"** (`<Anh>` tự
  gắn). **Quầy, khay skin-pack, không gian, lối lên, con người: chỉ ảnh chụp thật.** Không ảnh kho
  (Unsplash…). Không than, củi, khói giả trong ảnh.
- Logo, đầu bò, rosemary, steak, vân mỡ, tem tròn, chữ lặp: **vector trích nguyên từ PDF nhận diện**
  ở `web/public/thuong-hieu/` — không vẽ lại, không vẽ bằng AI, không gõ lại chữ. Đúng biến thể cho
  nền: `logo-ngang-do` trên kem, `logo-ngang-kem` trên đỏ / tối.
- Mockup trong PDF (mặt tiền, biển, đồng phục, menu, giá 400.000, câu "Thịt chuẩn - Giá thật") **chỉ
  là tham chiếu** — không đưa lên trang.
- Manifest từng tài sản (nguồn, chỗ dùng, trạng thái, điều kiện thay) và brief chụp ảnh:
  `web/THIET-KE.md`, mục 7 – 8.
- Bảy tài liệu thiết kế ở gốc repo (`Beeftown_*.html`, `Beeftown_Concept_Board_v1.svg`) làm **trước**
  brief 06/10/2026: phông Baloo / Anton, bảng màu khác, "Thịt chuẩn · Giá thật", phòng riêng, giá —
  **đã cũ, không chép**. Phần còn dùng được (kích thước mạng xã hội, luật đặt logo) và cỡ ấn phẩm:
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
- Tagline *Pick it. Grill it. Love it.* — descriptor *Beef Specialty Restaurant* (không phải "Korean
  BBQ"). Địa chỉ: Tầng 3, 11-21 Hàm Nghi — **cầu thang bộ, không có thang máy cho khách**.

## Tiếp cận

Focus 3px cách 3px, màu theo bề mặt · vùng chạm ≥ 44px · mỗi trang đúng một `h1` · câu tiếng Anh
trong trang Việt có `lang="en"` · alt ba thứ tiếng tả món (`DANH_MUC_ANH` trong `web/src/lib/anh.ts`),
trang trí và logo cạnh chữ "Beeftown" để `alt=""` · **không giấu nội dung sau JavaScript** (menu gọn
và hỏi đáp dùng `<details>`; không JavaScript vẫn đọc được đủ).

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
cd ../web && npx astro check && npm run quet && npm run thu-trinh-duyet
npm run thu-day-du -- --chup                           # ảnh chụp 360 / 390 / 768 / 1024 / 1440 × vi / en / ko
```

Kiểm thử nào gác luật nào, và bẫy hay gặp: [tham-khao/kiem-thu.md](tham-khao/kiem-thu.md).

Danh sách tự rà:

- [ ] Đúng khu, đúng layout, không lớp lạc khu.
- [ ] Chỉ token / biến bề mặt; không chữ vàng hay Warm Stone trên kem; cặp màu mới đã tính tương phản.
- [ ] Montserrat, đúng độ đậm; không chữ < 13px (trừ dòng hoa nhỏ 12px); ô nhập 16px.
- [ ] Nút, link, biểu tượng, ảnh dùng component có sẵn; không emoji; không `<img>` trỏ file chưa có.
- [ ] Không tràn ngang ở 360px; vùng chạm ≥ 44px (nội bộ, kho ≥ 48px); focus thấy rõ trên mọi bề mặt.
- [ ] Câu chữ đúng sự thật, đủ thứ tiếng, không chữ cấm, không claim chưa xác nhận.
- [ ] Không JavaScript vẫn dùng được; `prefers-reduced-motion` không còn chuyển động.
- [ ] Trang công khai đúng khi chưa có database.
- [ ] File mới có dòng mở trong `.gitignore` (`git status --short` thấy nó).
