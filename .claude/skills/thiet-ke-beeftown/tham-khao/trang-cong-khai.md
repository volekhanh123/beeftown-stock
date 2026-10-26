# Trang công khai — cách dựng

Đọc khi thêm hoặc sửa trang, khối, component dưới `web/src/pages/` (ngoài `noi-bo/`) và
`web/src/components/` (ngoài `kho/`). Luật thẩm mỹ: `SKILL.md`; lý do từng quyết định:
`web/THIET-KE.md`.

## Khung trang

- Mỗi thứ tiếng một file vỏ mỏng: `pages/thuc-don.astro`, `pages/en/menu.astro`, `pages/ko/menu.astro`.
  Vỏ đọc dữ liệu (`docNoiDung('<thứ tiếng>')`, thêm `docThucDon`… khi cần) rồi dựng
  `<Trang ngonNgu noiDung duongDan tieuDe moTa><TrangXxx ngonNgu noiDung /></Trang>`.
- Trang có form chạy PRG trước: `const chuyenHuong = await xuLyDatBan(Astro, '/dat-ban', 'vi');
  if (chuyenHuong) return chuyenHuong;`.
- `web/src/layouts/Trang.astro` lo: `<html lang>`, canonical, hreflang vi / en / ko + x-default, thẻ
  chia sẻ, JSON-LD, phông, `<body class="ck">`, link bỏ qua, `DauTrang`, `<main id="noi-dung">`,
  `ChanTrang`. Component không tự làm lại những thứ này.
- JSON-LD chỉ khai dữ kiện đã công bố — **không** `priceRange`, `aggregateRating`, giờ mở cửa khi
  chưa chốt.
- **Trang mới**: thêm một dòng `[vi, en, ko]` vào `CAP_DUONG_DAN` (`web/src/lib/chu.ts`) và tạo đủ ba
  file vỏ. Đường dẫn tiếng Anh bằng từ tiếng Anh (`/en/menu`), tiếng Hàn dùng lại từ tiếng Anh dưới
  `/ko`. Link nội bộ luôn qua `duongDanTuongUng('/duong-dan-viet', ngonNgu)` — không tự ghép `/en`.

## Nhịp trang

Trang chủ (`TrangRaMat.astro`): trắng (màn đầu: chữ + ảnh, dải tagline đỏ dưới ảnh — dải có
`aria-hidden`, tagline được đọc một lần ở dòng hiệu của ba bước) → trắng (ba bước) →
**đen** (quầy, thịt sáng lên) → xám nhạt (cả bữa, lớp `.be-kem-dam`) → **đỏ** (đi nhóm) → trắng (tầng 3)
→ trắng (câu hỏi) → chân trang **đen**. Tên lớp bề mặt giữ (`.be-kem`, `.be-toi`…), màu theo bảng
22/10/2026. Thứ tự tám khối và bề mặt của từng khối là điều Khánh đã quyết (11/10/2026: giữ như đang
chạy) — có kiểm thử, đừng đổi. Bảng từng khối, ảnh và bố cục điện thoại / máy tính: `web/THIET-KE.md`,
mục 1, "Tám khối của trang chủ". Hàng thông tin của màn đầu đổi theo `/noi-bo`: khóa `ngay_khai_truong`
(chưa có ngày · "Đón bạn từ …" · "Mở cửa từ …") và `dong_trang_thai` (một câu hay vài câu) — sửa hàng
này thì thử cả ba trạng thái (`npm run thu-day-du -- --chi 9`), đừng chỉ nhìn trang lúc chưa có database.

Khối có ảnh xếp so le trên máy tính (ảnh trái – chữ phải, rồi chữ trái – ảnh phải); trên điện thoại
chữ và nút đứng trước ảnh, trừ dải đen "Quầy chọn bò" mở bằng ảnh. Nút của một khối nằm ngay sau đoạn
giải thích của nó, không đẩy xuống cuối khối.

Trang con (Thực đơn, Đến Beeftown, Hỏi bàn, Tuyển dụng):

1. `section.mo-dau-trang.be-kem` — `.khung > p.hieu + h1 + p.dan` — không hình trang trí.
2. Các khối `section.muc.be-*` xen kẽ bề mặt — không hai dải đen hay hai dải đỏ liền nhau.
3. Khối kêu gọi cuối: `section.muc.be-do` với `p.hieu`, `h2`, `p.dan`, `.hang-nut` — dải đỏ phẳng.

## Khung mẫu một khối

```astro
<section class="muc be-toi qcb" aria-labelledby="qcb-tieu-de">
  <div class="khung">
    <div class="qcb-dau">
      <p class="hieu">{t.hieu}</p>
      <h2 id="qcb-tieu-de">{t.tieuDe}</h2>
      <p class="dan">{t.doan1}</p>
    </div>
    <div class="hang-nut">
      <a class="nut nut-chinh" href={duongDanTuongUng('/dat-ban', ngonNgu)}>{tChung.datBan}</a>
    </div>
  </div>
</section>
```

- `aria-labelledby` trỏ tới id tiêu đề có tiền tố của component (`bb-tieu-de`, `td-h-quay`).
- Đúng **một `h1`** mỗi trang: ở `KhoiMoDau`, `mo-dau-trang` hoặc `TrangVanBan`.
- Không hình trang trí (Khánh bỏ hình của bộ nhận diện cũ ngày 26/10/2026): khối màu phẳng và ảnh; dấu
  thương hiệu duy nhất là logo bộ 21/10/2026 ở đầu trang, chân trang, thẻ "Đọc nhãn khay".

## CSS: chung hay riêng

- **Lớp dùng chung** chỉ ở `web/src/styles/cong-khai.css`, mọi quy tắc dưới `.ck` (có kiểm thử).
  Danh mục: `muc`, `khung`, `khung-hep`, `be-*`, `hieu`, `dan`, `nho`, `an-chu`, `nut`, `nut-chinh`,
  `nut-vien`, `nut-nho`, `hang-nut`, `lien-ket`, `the`, `luoi`, `trang-thai`, `anh`, `chu-thich-anh`,
  `khung-anh`, `cau-hoi`, `tra-loi`, `mon`, `nhan-mon`, `o`, `loi-o`, `mo-dau-trang`, `tach-nen`.
- **CSS riêng của component**: `<style>` có phạm vi (không `is:global`), mọi lớp mang **tiền tố của
  component**: `kmd-` (KhoiMoDau), `bb-` (BaBuoc), `qcb-` (QuayChonBo), `bacn-` (BuaAnCungNhau), `dcn-`
  (DiCungNhom), `lt3-` (LenTang3), `ch-`
  (CauHoi), `nk-` (NhanKhay), `td-` (TrangThucDon, ThucDonNhom), `tdn-` (ThucDonNhomAnh), `tdm-` (ThucDonMon),
  `db-` (TrangDenBeeftown), `hb-` (TrangDatBan),
  `ut-` (FormUngTuyen), `vb-` (TrangVanBan), `dt-` / `mg-` (DauTrang), `ct-` (ChanTrang).
- `:global()` chỉ để chạm tới phần tử do component con hay `<slot>` dựng (`.lt3-dc :global(svg)`).
- Trong CSS riêng: màu chỉ từ biến bề mặt và token; khoảng cách `--k-*`; cỡ chữ `--co-*`; mốc
  600 / 900 / 1024 / 1080px (768px chỉ của `DauTrang.astro`); tiếng Hàn chỉnh bằng `:lang(ko)`; thêm
  `@media (forced-colors: active)` khi dùng nền hay viền để truyền nghĩa. Thứ bấm được cao ít nhất
  `--cham` (48px); thẻ đệm `--dem-the`; không `box-shadow` trang trí.
- **`:hover` luôn nằm trong `@media (hover: hover)`**; thứ bấm được có thêm `:active` đặt ngoài khối
  đó. Màu viết thẳng: chỉ mã hex 6 chữ số của bảng hoặc `rgba()` với bộ ba của bảng — không mã 3 chữ
  số, không `hsl()`, `oklch()`, tên màu (`white`…), màu hệ thống ngoài `forced-colors`
  (`test-cong-khai-giao-dien.mjs` nhóm 7).
- Token ở đây khai trong **khối `.ck`** của `cong-khai.css` (bảng 22/10/2026 — bảng "Token
  màu của website" trong `SKILL.md`). `:root` của `chung.css`, nơi `/noi-bo` và kho đọc, khai cùng giá
  trị: đổi một mã thì đổi cả hai nơi. Cần màu trong suốt thì viết `rgba()` bằng số RGB của bảng đó; mã
  hex hay bộ ba số của bảng cũ trong một file công khai (kể cả trong chú thích) là kiểm thử đỏ
  (`test-cong-khai-giao-dien.mjs` nhóm 6).
- Nút trên dải đỏ tự đổi (nút chính: nền trắng, chữ đỏ đậm; nút phụ: viền và chữ trắng) nhờ biến bề
  mặt — đừng viết lại màu nút trong component. Biểu tượng cạnh chữ lấy màu `--nhan` (đỏ trên nền sáng,
  trắng trên đỏ và đen).

## Ba thứ tiếng

| Loại chữ | Chỗ viết | Cách đọc |
|---|---|---|
| Chữ dùng nhiều nơi (điều hướng, nút, địa chỉ, tên nhóm món) | `VI`, `EN`, `KO` trong `web/src/lib/chu.ts` — thiếu một khóa thì không biên dịch | `const t = chu(ngonNgu)` |
| Chữ riêng của component | Bảng `{ khoa: { vi, en, ko } }` ngay trong component | `const c = dich(ngonNgu, { … })` |
| Nội dung trong database (khóa công bố, món, tin tuyển dụng) | `/noi-bo`; bản en / ko do máy dịch (`lib/ban-dich.ts`), sửa tay thắng máy | `docNoiDung(ngonNgu)` |
| Trang pháp lý (quyền riêng tư, xóa dữ liệu) | Viết thẳng trong từng file vỏ của từng thứ tiếng | sửa một thì sửa cả ba |

- **Không bao giờ** viết `ngonNgu === 'en' ? 'A' : 'B'` — thứ tiếng thứ ba rơi vào nhánh sai mà không
  ai biết. Dùng `dich`.
- Câu có số: giá trị là hàm, `{ vi: (n) => \`…${n}…\`, en: …, ko: … }`.
- Chữ tiếng Anh dịch theo nghĩa, viết tay — không máy dịch cho chữ trong mã.
- Tên riêng giữ tiếng Việt (địa chỉ, pháp nhân) bọc `<span lang="vi">`; descriptor, tagline tiếng
  Anh trên trang Việt bọc `<span lang="en">`.
- **Bẫy chữ dính**: Astro bỏ khoảng trắng có xuống dòng giữa hai nút — `{t.cau1}` ⏎ `{t.cau2}` thành
  "Câu một.Câu hai.". Viết hai mẩu trên một dòng cách một dấu cách, hoặc thêm `{' '}`. Chữ thẳng rồi
  xuống dòng trước một thẻ cũng dính. Chi tiết: `web/README.md`, "Bẫy khi tách câu".
- Tiếng Hàn: `word-break: keep-all` đã có; tiêu đề không siết chữ; chữ hoa nhỏ giãn ít.

## Cổng nội dung — đúng khi chưa có database

CI dựng trang **không có `.env`**. `docNoiDung()` khi đó (hoặc khi database lỗi) trả `RONG` — mọi khóa
`null`. Luật: **dữ liệu công bố chỉ thêm vào trang, không tắt phần nền**; "một nút dẫn tới hư không
tệ hơn không có nút".

- Chữ có bản nền: `nd.dong_trang_thai ?? t.trangThaiMacDinh`.
- Công tắc so `=== true` (`null` là chưa duyệt): `nd.hien_thuc_don === true`.
- Kênh liên hệ luôn qua `lienHe(nd)` (`web/src/lib/trang-cong-khai.ts`) — mỗi trường `string | null`,
  link không an toàn bị bỏ. Dựng `{lh.facebook && (<a …>)}`; cả khối không có gì để hiện thì ẩn cả
  khối.
- Quyết định suy ra để ở `trang-cong-khai.ts`, không rải trong component: `formHoiBanMo`,
  `coKenhHoiBan`, `nutMoDau` (thứ bậc hai nút màn đầu), `dieuHuong`.
- Giá: chỉ render phần tử giá khi `gia !== null` — không ô trống, không "liên hệ".
- Ngày: chỉ khi khóa ngày đã công bố; định dạng theo `dinhDangNgay(ngay, ngonNgu)`; hôm nay theo giờ
  Việt Nam `homNayVn()`.
- Ảnh: `coAnh(id, khung)`; chưa dựng cỡ thì `<Anh>` tự hiện `KhungAnh`.
- **Địa chỉ không bao giờ gõ thẳng vào component hay layout.** Lấy qua các hàm của
  `web/src/lib/trang-cong-khai.ts`: `diaChi(nd)` (bản công bố `dia_chi_hien_thi` trong `/noi-bo`, chưa
  có thì `DIA_CHI_NHA_HANG`), `diaChiSauTang(nd)` (bỏ vế "Tầng 3" khi câu đã nói tầng),
  `diaChiManDau(nd)` (màn đầu: bỏ thêm vế phường), `diaChiCoCauTruc(nd)` (JSON-LD), `cumDiaChi(…)`
  (tách cụm để xuống dòng đẹp). Câu chỉ đường là `t.loiLen` của `chu(ngonNgu)`. Bản công bố trong
  database thay cho bản trong mã ở **mọi** chỗ in địa chỉ — đổi địa chỉ trong mã thì nhắc Khánh xem lại
  bản công bố.

Ba trạng thái mở cửa (đang chuẩn bị / bán thử / đã mở) là quyết định công bố của Khánh, không tự đổi
theo ngày — `web/THIET-KE.md` mục 10.

## Component có sẵn

| Component | Props chính | Dùng cho |
|---|---|---|
| `BieuTuong` | `ten`, `class?` | Biểu tượng nét 1,5px, lưới 24, `currentColor`, luôn `aria-hidden`. Nơi dùng đặt cỡ 24px; nét không co theo cỡ. Nằm trong thứ bấm được thì phải có nhãn chữ cạnh nó (nhìn thấy, hoặc `.an-chu` khi thật sự không còn chỗ) |
| `Anh` | `id`, `ngonNgu`, `khung`, `khungNho?`, `sizes?`, `uuTien?`, `thayBang?`, `nenKhung?` | Ảnh AVIF / WebP trong khung tự giữ tỷ lệ (`khung` từ 600px, `khungNho` dưới 600px), tự gắn nhãn "Ảnh minh họa"; `uuTien` chỉ cho ảnh màn đầu (mỗi trang nhiều nhất một, và nó phải nằm trong màn hình đầu); `nenKhung` (`kem` / `toi` / `do` — tên giữ; nền chờ xám E2 / trắng 8 % / đỏ đậm) theo dải đặt ảnh; ảnh `tachNen` thì khung tự thêm `.tach-nen` (trong suốt, nhãn giữa đáy, dưới món). `id` và `khung` viết bằng chữ thẳng — kiểm thử đọc chúng từ mã; ngoại lệ duy nhất: ảnh món trong `ThucDonNhomAnh.astro`, `id={anh.id} khung={anh.khung}` lấy từ `ANH_CUA_MON` |
| `KhungAnh` | `loai` (`quay`, `khay`, `thang-may`, `loi-vao`, `ban-nuong`), `tiLe?`, `tiLeNho?`, `nen?` | Chỗ của ảnh chụp thật chưa có — đúng tỷ lệ, không chữ |
| `NhanKhay` | `ngonNgu` | Thiết bị chữ ký "Đọc nhãn khay": một thẻ `.the` đặt thẳng, không bóng đổ — logo chính đỏ, tiêu đề, năm trường theo thứ tự (số, tên trường, lời giải thích); không con số, không giá trị mẫu |
| `LenTang3` | `ngonNgu`, `noiDung`, `gon?`, `capTieuDe?`, `anHieu?`, `tieuDe?`, `khongLinkDuongDen?` | "Tầng 3" và đường lên; bản gọn cho trang Hỏi bàn. In địa chỉ và câu chỉ đường `t.loiLen` (lối vào riêng ngay cạnh GS25, thang máy lên tầng 3) — không viết lại câu đó trong component khác |
| `CauHoi` | `ngonNgu`, `noiDung` | Hỏi đáp bằng `<details>` — chỉ dữ kiện đã xác nhận. Mỗi `<summary>` có hai biểu tượng `cong` (`.bt-mo`) và `tru` (`.bt-dong`); hàng cao 56px, bấm được trên toàn chiều rộng |
| `TrangVanBan` | `hieu`, `tieuDe` + `<slot>` | Trang pháp lý |
| `ThucDonNhom` | `nhom`, `ngonNgu`, `ghiChu?`, `khongGia?` | Một nhóm món dạng danh sách (bò tại quầy, đồ uống chưa có ảnh) |
| `ThucDonNhomAnh` | `nhom`, `ngonNgu`, `kieu?` (`dan-dau` / `deu`), `ghiChu?`, `tieuDeNho?`, `nenKhung?`, `khongGia?` | Một nhóm món kiểu cuốn menu bản sáng: tên nhóm chữ hoa `--co-nhom`, câu của nhóm (`CAU_NHOM`), món dẫn đầu chữ trái – ảnh phải từ 768px, lưới thẻ ảnh trên chữ dưới (2 / 3 cột) từ 600px; dưới 600px món đứng sau món dẫn đầu là hàng gọn `tdn-gon` (ảnh 128px trái, chữ phải) — nhóm không có món dẫn đầu giữ thẻ to; `deu` cho ba ly signature (luôn là thẻ); `tieuDeNho` trong dải đen Bò tại quầy |
| `ThucDonMon` | `mon`, `ngonNgu`, `lon?`, `khongGia?` | Chữ của một món: tên (chữ thường đậm 700), giá chỉ khi `gia !== null`, mô tả, nhãn Món sống / Có cồn, câu cảnh báo món sống |
| `DauTrang`, `ChanTrang` | — | Layout đã gắn sẵn. Đầu trang cao 64 / 80px, bộ chọn ngôn ngữ in đủ ba thứ tiếng (thứ tiếng đang xem: `aria-current="true"`, chữ đậm và nét gạch), menu gọn có nút đóng và nút chính Hỏi bàn (lớp phủ tối và khoá cuộn chỉ có khi script đã chạy — `data-co-script`). Đầu trang đen, logo phụ trắng (dưới 360px brandmark trắng). Chân trang: hai dải đen, logo chính trắng, không tem, không hoa văn chữ, chữ ≥ 14px, `<footer>` pháp nhân duy nhất, giữ nguyên từng ký tự |

Thêm biểu tượng: vẽ thêm một dòng vào `NET` và kiểu `TenBieuTuong` trong `BieuTuong.astro`, lưới 24,
nét 1,5, đầu tròn — rồi cập nhật danh sách tên trong `SKILL.md` và `web/THIET-KE.md` mục 5.

Thêm ảnh thật: `web/THIET-KE.md` mục 7, "Đưa một ảnh chụp thật lên trang".

## Đặt một ảnh lên trang

- Chỉ qua `<Anh id="…" khung="…" khungNho="…" />`; không tự viết `<img src="/anh/…">` (có kiểm thử). Ảnh
  của một món không gõ vào component: thêm vào `ANH_CUA_MON` (mã món → id, khung, `gon` — khung ảnh nhỏ
  128px của hàng món gọn dưới 600px: 1x1 cho ảnh tách nền, 4x5 cắt sát đáy cho ảnh có nền) — thẻ món tự lấy.
- Ảnh món đã tách nền: khai `tach_nen: { le, duoi }` trong `danh-sach.json` (không `fx`, `fy`) và
  `tachNen: true` trong `DANH_MUC_ANH`; dải `duoi` ≥ 12 % để nhãn nằm dưới món ở thẻ nhỏ nhất (~250px).
  Khung gọn 1x1 (ảnh 128px) khai `tach_nen` riêng trong khung: `duoi` ≥ 18 % (nhãn một dòng ≈ 22px).
- Chọn khung theo chỗ đặt: cột nửa trang trên máy tính thì `4x3` hoặc `3x2`; điện thoại cần ảnh cao hơn
  thì khai `khungNho` (`4x5`, `4x3`, `1x1`). Khung phải có trong `web/cong-cu/anh/danh-sach.json` và đã
  dựng cỡ (`tao-co-anh.py`) — khung chưa dựng thì trang hiện `KhungAnh`, và kiểm thử đỏ.
- `sizes` ghi đúng bề rộng ảnh hiện ra: cột 6/11 của khung 1200px là `620px` từ 1280px, khoảng `50vw`
  từ 900px, còn lại `calc(100vw - 40px)`.
- Không đặt gì lên ảnh ngoài nhãn "Ảnh minh họa" của component: logo, chữ đứng cạnh hoặc dưới ảnh. Không `box-shadow`, không xoay, không viền.
- Sau khi dựng cỡ, mở từng file đã cắt mà xem: không cắt mất món chính, không cắt ngang bàn tay; alt
  viết theo đúng thứ nhìn thấy (một alt cho cả hai khung thì chỉ tả thứ có ở cả hai).

## JavaScript

- `<script>` thường của Astro (TypeScript, đóng gói) — không `is:inline` (trừ khối JSON-LD), không
  `define:vars`, không island `client:`.
- Dữ liệu máy chủ sang script qua `data-*`, đọc bằng `dataset` — câu báo lỗi ba thứ tiếng cũng đi qua
  `data-loi-*`.
- **Không giấu nội dung sau JavaScript**: menu gọn và hỏi đáp là `<details>`; tab thực đơn không có
  JavaScript là ba link neo và đủ ba nhóm; form là HTML GET / POST thật với PRG. Script chỉ **thêm**:
  phím Esc, đóng menu khi bấm ra ngoài hay Tab ra khỏi mục cuối, khóa bấm đúp (`aria-busy`, "Đang gửi…"), lỗi sát ô, giữ bản nháp 15 phút trong
  `sessionStorage` (trừ ô đồng ý), focus vào khung kết quả.
- Nút chỉ chạy được nhờ JavaScript (sao chép địa chỉ) ra trang với `hidden`, script dò tính năng rồi
  mới hiện; thông báo qua `role="status"`.
- Mọi truy vấn phần tử kiểm `null`; `sessionStorage`, clipboard bọc `try/catch`, hỏng thì im lặng.
