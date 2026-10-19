# Nội bộ (`/noi-bo`) và kho (`/noi-bo/kho`) — cách dựng

Đọc khi làm màn cho nhân viên. Không có tài liệu thiết kế riêng cho hai khu này: luật nằm ở đầu các
file CSS, chú thích layout, `web/README.md` (mục "Giao diện nội bộ") và `web/KHO.md` (KHO.md thắng
README khi hai bên lệch).

## Tinh thần

- **Nền sáng, mật độ cao hơn trang công khai** — để đứng ở quầy dò một danh sách, không phải để đọc
  lướt. Nền trang kem sau, thẻ và ô nhập Cream, đầu trang tối (`--than`). Chỉ có giao diện sáng. Dấu
  hiệu "đang ở trang quản trị" là đầu trang tối, thanh điều hướng và mật độ — không phải một bảng màu
  khác.
- **Không có màu trắng**, như trang công khai: bảng màu thương hiệu không có trắng. Thẻ tách khỏi nền
  bằng viền mảnh, không bằng một mảng trắng. Trắng, đen chỉ có trên giấy in.
- **Thiết kế cho ngón cái trước, màn lớn sau.** Thủ kho, nhân viên quầy dùng điện thoại, tay có thể ướt.
- **Kho** thoáng hơn CRM (học cách iPOS Inventory Pro sắp xếp: thẻ Cream bo góc trên nền kem sau,
  biểu tượng rõ, số to). **Đỏ dành cho số báo việc và nút chính — chỗ nào đỏ là chỗ đó cần làm.**
- **Không cần JavaScript**: mọi thao tác là form POST rồi chuyển hướng 303 (F5 không gửi lại).
- **Màu: cùng bảng với trang công khai** — bảng thương hiệu chốt 09/10/2026, hai khu này đổi ngày
  12/10/2026. Token đọc ở `:root` của `chung.css`, cùng giá trị với khối `.ck` (bảng "Token màu của
  website" trong `SKILL.md`). Hai khu có thêm token của kho và màu trạng thái, ở mục "CSS và layout"
  dưới đây. Màn mới chỉ dùng biến: `crm/test/test-noi-bo-bang-mau.mjs` đỏ khi một file nội bộ gõ mã
  màu ngoài bảng, dùng biến chưa khai hay để lại mã của bảng cũ.

## CSS và layout

| | Nội bộ CRM | Kho |
|---|---|---|
| Layout | `web/src/layouts/NoiBo.astro` (props `tieuDe`, `nhanSu`) | `web/src/layouts/Kho.astro` (props `k`, `tieuDe`, `huongDan` — bắt buộc, `rong?`) |
| CSS | `chung.css` + `noi-bo.css` (lớp `nb-*`) | thêm `kho.css` (lớp `kho-*`, dựa trên `nb-*`) + `kho-khung.css` (mọi thứ dưới `.kho-than`) |
| Khung | `body.nb-than` → `header.nb-dau` → `nav.nb-dieu-huong` → `nav.nb-day` (điện thoại) → `main.nb-khung.nb-chinh` | `body.nb-than.kho-than` → `a.kho-bo-qua` → `header.kho-dau` (dính) → `.kho-khung` (`nav.kho-ben` từ 1024px + `main#noi-dung.kho-chinh`) → `nav.kho-day` (dưới 1024px) |
| Rộng | `.nb-khung` min(880px, 92 %) | `.kho-chinh` 880px; `.rong` 1200px |
| Mốc | 640px: thanh trên ↔ thanh đáy | 420 (lưới một cột) · 640 · 1024 (cột bên ↔ thanh đáy) |

**Hai bề mặt** (khai một lần trên `.nb-than`, đầu `noi-bo.css`; kho đọc chung):

| Biến | Là | Dùng cho |
|---|---|---|
| `--nb-nen` | `--kem-sau` | Nền trang; nền của hàng nút dính đáy |
| `--nb-the` | `--kem` | Thẻ, dòng danh sách, bảng, thanh điều hướng, thanh đáy, menu thả, hộp thoại, mục cột bên khi di chuột |

Ô nhập luôn nền `--kem` (kể cả khi đặt thẳng trên nền trang), viền `--vien-o`. Cream và kem sau chỉ
chênh 1,07 : 1 — thẻ tách khỏi nền bằng viền `--vach`. Di chuột trên thẻ, nút phụ, menu thả: `--kem-dam`.
Ô nhập không lớp riêng, ô đánh dấu, ô chọn một, nút "Chọn tệp", `<dialog>`, `<fieldset>`, thanh
`<progress>` đã có màu sẵn từ `noi-bo.css` (ô đánh dấu và ô chọn một tự vẽ — ô của hệ thống nền trắng;
khi in và ở chế độ tương phản cao thì trả về ô của hệ thống): trang chỉ đặt cỡ ô, không đặt màu, không
`accent-color`. Chữ gợi ý (placeholder) là `--muc-nhat`.

**Token thêm của kho** (khai trên `.kho-than`). Kho không có sắc riêng — token chỉ trỏ về biến:
`--kho-nen` là `--nb-nen`, `--kho-the` là `--nb-the`, `--kho-vach` là `--vach` (viền thẻ, vạch ngăn
trong thẻ), `--kho-vach-dam` là `--da` (viền thẻ khi di chuột, vạch của dòng "xem cho biết"; Warm Stone),
`--kho-bo` 14px.

**Màu trạng thái** — màu chức năng của công cụ, không thuộc bảng thương hiệu, không dùng ở trang công
khai. Khai **một lần** trên `.nb-than`, đầu `noi-bo.css`; kho đọc chung (`Kho.astro` đặt
`<body class="nb-than kho-than">`). Trang và component không khai lại, không gõ mã:

| Token | Mã | Dùng cho |
|---|---|---|
| `--xanh` | `#1A683F` | Chữ, vạch, đèn "xong, đang chạy"; nền đặc của nhãn (chữ kem đặt lên) |
| `--xanh-nen` | `#D3E3C6` | Nền nhạt của khối và nhãn "xong" |
| `--xanh-vien` | `#A3C597` | Viền của khối nền xanh nhạt |
| `--vang-chu` | `#7A5200` | Chữ và biểu tượng "lưu ý" trên nền sáng; viền của đèn vàng và chấm "chưa đọc" |
| `--vang-nen` | `#F6DC9E` | Nền nhạt của khối "lưu ý" |
| `--vang-vien` | `#DDB65C` | Viền của khối nền vàng nhạt |
| `--do-nen` | `#F2D6CE` | Nền nhạt của khối "lỗi, làm ngay" |
| `--do-vien` | `#DDA79C` | Viền của khối nền đỏ nhạt |

Ba nền nhạt sẫm ngang kem sau, **không sáng hơn thẻ Cream** (có kiểm thử): sáng hơn thì thành một
mảng gần trắng giữa thẻ kem. Đỏ của trạng thái là chính `--do`. Vàng đặc là `--mu-tat` (Marigold) với
**chữ than đặt lên trên**.

| Nghĩa | Chữ, vạch, đèn | Nền nhạt | Nhãn đặc | Lớp ví dụ |
|---|---|---|---|---|
| Xong, đang chạy | `--xanh` | `--xanh-nen` | nền `--xanh`, chữ kem | `.nb-nhan.song`, `.nb-bao.xong`, `.kho-han.con_han` |
| Lưu ý — xem hôm nay | `--vang-chu` | `--vang-nen` | nền `--mu-tat`, chữ than | `.nb-bao.luu-y`, `.nb-nhan.nhap`, `.kho-han.sap_het` |
| Lỗi, chờ người khác — làm ngay | `--do` | `--do-nen` | nền `--do`, chữ kem | `.nb-bao.loi`, `.nb-nhan.cho`, `.kho-han.het_han` |
| Tắt, chưa bật | `--muc-nhat` | — | nền `--vach`, chữ `--muc-nhat` | `.nb-nhan.tat`; đèn `.sk-den.tat` là vòng rỗng viền `--vien-o` |

**Luật màu của hai khu** (đã tính theo WCAG 2.2; `test-noi-bo-bang-mau.mjs` nhóm 5 tính lại từng cặp):

- Chữ than: 14,96 : 1 trên thẻ Cream, 14,05 trên nền kem sau. Chữ phụ `--muc-nhat`: 5,92 và 5,80. Chữ
  đỏ: 6,15 và 5,77. Chữ kem trên nút đỏ: 6,15. `--xanh`: 5,36 và 5,03. `--vang-chu`: 5,47 và 5,14.
- **Marigold và Warm Stone không làm chữ hay biểu tượng trên nền sáng** (1,56 và 1,83 : 1 với thẻ
  Cream). Cần chữ "lưu ý" trên nền sáng: `--vang-chu`. Cần chấm, đèn hay vạch vàng: tô `--mu-tat` và kẻ
  viền `--vang-chu` (viền là thứ mang tương phản — xem `.sk-den.vang`, chấm "chưa đọc" của trang Thông
  báo). Marigold và Warm Stone làm chữ **chỉ** trên đầu trang tối và mục đang chọn của cột bên.
- **Không tô nền vàng cho cả dòng danh sách** để báo "mới": vài chục dòng chưa đọc thành một mảng vàng,
  trong khi vàng chỉ là điểm nhấn nhỏ. Dòng chưa đọc mang chấm Marigold ở biểu tượng và chữ "mới".
- **Vòng focus**: Charcoal trên nền sáng, Marigold trên đầu trang tối (`.nb-than :focus-visible`,
  `.nb-dau :focus-visible`). Ô nhập đang focus: viền than, thêm một nét than phía trong và quầng
  Marigold phía ngoài.
- **Bản in** (`@media print`): chỉ đen, trắng, xám. Khi in, `noi-bo.css` đặt cả họ kem (`--kem`, `--kem-sau`,
  `--kem-dam`, hai bề mặt) về trắng — nền kem không lên giấy kể cả khi máy in bật "in nền" — và trả ô đánh
  dấu, ô chọn một về ô của hệ thống (dấu ✓ Cream tự vẽ không lên giấy khi in tắt nền).

Đèn sức khỏe (`MauDen` trong `web/src/lib/suc-khoe.ts`): đỏ = xử lý ngay · vàng = xem hôm nay · xanh =
ổn · xám = chưa bật. **Không đọc được số liệu thì không bao giờ hiện xanh.** Màu và câu do
`suc-khoe.ts` quyết định, `SucKhoeHeThong.astro` chỉ vẽ. Đèn mới: `CLAUDE.md` mục 9.

Trạng thái chứng từ → nhãn: `trangThaiKho(ma, nn)` (`TRANG_THAI_CHUNG_TU_NB` trong
`web/src/lib/kho/chung.ts`) — "chờ duyệt", "đang chuyển" là **đỏ** vì đang chờ một người làm.

## Chữ và kích thước

- Montserrat 400 / 600 / 700 / 800, chữ thân 16px. Cỡ tính bằng `rem`, không có biến thang chữ:
  `h1` 1,5rem (kho 1,45rem đậm 800) · `h2` 1,1rem · nhãn ô 0,88rem đậm 600 · nút 0,92rem đậm 700 ·
  tiêu đề bảng, nhóm 0,7 – 0,78rem viết hoa giãn chữ.
- **Số luôn `font-variant-numeric: tabular-nums`** (`td.so`, `.kho-so`, `.kho-the-so b`), canh phải
  trong bảng.
- **Vùng chạm ≥ 48px cho mọi nút và ô nhập**, chữ ô nhập ≥ 16px. Thẻ chọn lớn 56px. Thanh đáy 4 –
  4,25rem, chừa `env(safe-area-inset-bottom)`. (Vài chỗ cũ 36 – 44px là nợ, đừng bắt chước.)
- Bo góc: nhãn 4px · nút nhỏ 6px · nút, ô 8px (kho 10px) · thẻ 10px (kho `--kho-bo` 14px) · chip
  999px.
- Viền ô nhập là `--vien-o` (3,71 : 1 với nền Cream của ô, 3,49 với nền kem sau; mức tối thiểu là
  3 : 1). Không kẻ viền ô bằng `--vach`, `--kho-vach` hay Warm Stone — đứng ở quầy không thấy chỗ để chạm
  vào (có kiểm thử). **Nút phụ** `.nb-nut.phu` cũng viền `--vien-o`: nút Cream trên thẻ Cream, viền Warm
  Stone chỉ 1,83 : 1.

## Biểu tượng

Hai bộ, **không trộn**:

| Bộ | File | Nét | Tên |
|---|---|---|---|
| Trang công khai | `web/src/components/BieuTuong.astro` | 1,5px | mui-ten, menu, dong, cong… |
| Nội bộ, kho | `web/src/components/kho/BieuTuong.astro` + `web/src/lib/kho/bieu-tuong.ts` | 2px, prop `co` (mặc định 22) | nha, viec, duyet, quet, ton, quay, khac, nhap, dao, chuyen, bep, huy, kiem_ke, cong_no, bao_cao, cai_dat, chuong, quy_trinh, huong_dan, dang_xuat, can, nguoi, lich, them, tiep, lui, canh_bao, dat_hang, in, tin_nhan, tim, trang_web, mat_hang |

Cỡ: 18 (menu) · 20 (cột bên) · 22 (thanh đáy) · 26 (nút quét, ô chức năng). Không thư viện biểu tượng.
Thêm biểu tượng kho: thêm vào `BIEU_TUONG` — kiểm thử điều hướng đòi mọi mục menu có biểu tượng trong đó.

## Điều hướng

- Mọi màn nhà hàng nằm trong **một** danh sách: `web/src/lib/dieu-huong-noi-bo.ts` (tên, tên ngắn, vai
  được thấy, biểu tượng, nhóm). Màn mới = thêm một dòng; **vai được thấy phải khớp RLS** của database.
- Máy tính: thanh trên **xuống dòng, không cuộn ngang**. Điện thoại (≤ 640px): thanh đáy **tối đa 5
  nút**, tên ngắn **≤ 10 ký tự ở cả hai thứ tiếng**; vai nhiều mục thấy 4 mục + "Thêm" →
  `/noi-bo/chuc-nang`.
- Luôn hiện tài khoản đang dùng — nhiều người dùng chung một điện thoại. Kho: đăng xuất nằm trong menu
  người dùng, không là nút trần dưới ngón tay.

## Khung một trang kho

1. `.nh-buoc` "Bước 1/3 · …" (khi là luồng nhiều bước)
2. `<h1>`
3. `<BaoKho bao loiDoc />` — câu báo sau khi ghi, ngay dưới `h1`
4. `p.nb-dan` dẫn, kèm link "Xem cách làm →"
5. `.kho-nut-nhanh` việc chính
6. `nav.kho-dh` chip trạng thái
7. `<LocDanhSach>` tìm / lọc
8. Danh sách thẻ `a.nb-dong` (`.nb-dong-dau` + `.nb-nhan` + `dl`) — hoặc bảng khi màn rộng cần
9. `<PhanTrang>`
10. Link "← quay lại"

Ví dụ: `web/src/pages/noi-bo/kho/nhap/index.astro` (danh sách), `nhan-hang/moi.astro` (form ba bước),
`bao-cao/[loai].astro` (báo cáo).

## Thành phần

| Thứ | Dùng | Luật |
|---|---|---|
| Nút | `.nb-nut` (đỏ, chữ kem), `.nb-nut.phu` (Cream, viền `--vien-o`), `.kho-nut-xoa` (xóa: chữ, viền đỏ), `.kho-thanh-nut` (hàng nút; `.dinh` dính đáy dưới 1024px) | Tên nút kể **việc ngoài đời** ("Đã gọi xác nhận"), không việc trong database ("Duyệt"). `.nb-nut` đè `hidden` — thêm `[hidden]{display:none!important}` khi cần |
| Form | `label.nb-o > span` (nhãn, thêm " *" nếu bắt buộc) + `small` (gợi ý, **trên** ô) + ô; lưới `.kho-luoi`, `.kho-luoi-2`; bọc `.nb-the` | Số nhập bằng `type="text"` + `inputmode="numeric"` / `"decimal"`, không `type="number"`. Có / không là `select` ba lựa chọn, **không ô tick** (`TruongThem`). Ô mã: `autocapitalize="characters"`, `spellcheck="false"` |
| Chọn | `ChonMatHang` (`select` theo nhóm, mã để trong `title`), `NhanHangChon` (thẻ radio 56px, `:has(input:checked)`) | Không mã trong chữ của lựa chọn |
| Bảng | `BangBaoCao` → `.kho-bang-khung > table.kho-bang.kho-bao-cao` | Cột đầu dính; `td.so` canh phải; tổng ở `tfoot tr.tong`; 0 hiện `·`, không có hiện `—`; trống thì `p.nb-rong` nói số liệu từ đâu ra. Điện thoại: một thẻ mỗi dòng thay vì bảng |
| Tìm, lọc | `LocDanhSach` — một form GET, trạng thái lọc nằm trên đường dẫn (gửi qua Zalo được) | `ChonKy` cho kỳ báo cáo (tối đa một năm) |
| Trang | `PhanTrang` — 30 dòng, không đếm tổng | |
| Quét | `QuetMa` — ô `textarea` nhận máy quét như bàn phím; nút camera `hidden` tới khi camera chạy được | Không camera thì không nút camera; trang vẫn dùng được không JavaScript |
| In | `InDau` (giấy tự nói nó là gì: chi nhánh, tên, số, giờ in), `KyTen`, `NutIn` | `.kho-khong-in` / `.kho-chi-in`; khi in ẩn đầu, cột bên, thanh đáy, mọi nút |
| Báo | `BaoKho` → `.nb-bao.xong` (`role="status"`) / `.nb-bao.loi` (`role="alert"`) / `.nb-bao.luu-y` | Nhiều lỗi nối bằng " · "; dữ liệu đã gõ, mã đã quét được điền lại |
| Trước khi chuyển tiền | `CanhBaoTaiKhoan` — trang công nợ NCC và màn Trả tiền, ngay dưới dòng số tài khoản | Tài khoản vừa đổi trong 30 ngày → `.nb-bao.loi`; đọc nhật ký lỗi → `.nb-bao.luu-y` "chưa kiểm được"; cả hai dặn gọi hỏi lại NCC |
| Nhãn, đếm | `.nb-nhan`, `.kho-han`, `.kho-so-do` (đỏ, quá 99 hiện "99+") | |
| Bản đồ chức năng | `BanDoChucNang`, `OTimChucNang` | Form GET, không JavaScript |

Thao tác xóa / hủy: đặt trong `<details class="nb-the">` đóng sẵn, có ô lý do bắt buộc và nút
`.kho-nut-xoa` — **không `confirm()`**.

## Tương tác

- **Gửi hai lần**: form tạo chứng từ mang `ma_gui` ẩn (UUID khi dựng trang); lỗi thì dựng lại với
  **cùng** `ma_gui`. Form sửa mang `phien_ban` để hai máy không ghi đè nhau. Không cần spinner.
- **Không báo thành công khi không có gì đổi** — người khác đã xử lý thì nói đã có người xử lý.
- Supabase bận (429 / 5xx): trang 503; GET tự tải lại sau 5 – 10 giây, POST nói rõ thao tác **chưa**
  được ghi. Mất mạng giữa chừng: "có thể đã ghi hoặc chưa — tải lại trang để kiểm".
- Không có chế độ ngoại tuyến.
- **JavaScript chỉ được phép** ở: `QuetMa`, `/kho/js/ean13.js`, `/kho/js/may-chung.js` (khóa máy dùng
  chung), `/kho/js/in-an.js`. Không thư viện npm trong trình duyệt; `<script>`, `onclick` ngoài danh
  sách là kiểm thử đỏ.
- Số: `dinhDangKg`, `dinhDangTien`, `dinhDangPhanTram` (`web/src/lib/kho/chung.ts`) — tiếng Việt
  `450.000 đ`, tiếng Anh `450,000 ₫`. Ô kg nhận "1,5" lẫn "1.5". `—` nghĩa là không đọc được hoặc
  không có quyền, **không phải số 0**.
- Ngày: `dinhDangNgay` (dd/mm/yyyy), `dinhDangThoiDiem` ("dd/mm HH:MM" giờ Việt Nam).
- `{n && …}` in ra chữ "0" khi `n = 0` — viết `n > 0 && …`.

## Câu chữ nội bộ

- Tiếng Việt thường, không thuật ngữ: "hạn gần bán trước", không "FEFO".
- Hướng dẫn: động từ đứng đầu, gọi đúng chữ trên nút; **không nhắc tiền** ở phần cho thủ kho và nhân
  viên quầy.
- Không đổi hay xóa id neo của trang hướng dẫn đã được link tới.
- Ảnh chụp cho hướng dẫn không bao giờ dùng dữ liệu thật.

## Hai thứ tiếng

- Lựa chọn của **trình duyệt** (cookie `nb_ngon_ngu`), không nằm trong đường dẫn; mặc định tiếng Việt.
- Chữ của trang: `{ vi, en }` ngay trong trang, đọc qua `dichNB(nn, …)`; `nn` lấy bằng `nnCua(Astro)`
  (kho: `k.nn`). Component dùng chung nhận `nn` qua prop.
- Nhãn mã (trạng thái, loại): bảng `…_NB` đọc bằng `nhanKho(BANG_NB, ma, nn)` / `trangThaiKho(ma, nn)`.
- Câu trang không tự viết (lỗi `raise exception`): `dichCau(nn, câu)` — bản tiếng Anh thêm vào
  `web/src/lib/cau-noi-bo.ts` hoặc `web/src/lib/kho/cau-kho-en.ts`. Câu báo sau khi ghi:
  `kqHai(ok, { vi, en })`.
- Script trong trang không đọc được biến máy chủ — chữ đi qua `data-*`.
- Tên lưu trong database không dịch.

## Beeftown Cân (`can-app/`)

Chương trình Windows mở giao diện trong cửa sổ ứng dụng của Edge (1180 × 860), máy chủ Bun ở `127.0.0.1`. Giao diện
`can-app/src/giao-dien.html`, hướng dẫn in được `can-app/src/huong-dan.html` (tự chứa, không tải gì từ
mạng). **Chưa đổi** sang bảng màu chốt 09/10/2026: vẫn dùng đỏ, kem, than, mù tạt của **bảng cũ** (token
khai ngay trong file HTML). Đổi màu Beeftown Cân là một PR riêng, kèm phiên bản mới của chương trình — đổi
giao diện thì tăng `PHIEN_BAN` trong `can-app/src/main.ts`. **Phông hệ thống (Segoe UI)** vì chạy không
mạng. Khi sửa: giữ bảng màu app đang dùng, đừng thêm phông tải từ mạng, việc chính dùng nút to sẵn có
(`button.to`). Hai chỗ app khác web — đừng chép sang web: nút lọc bo tròn kiểu viên thuốc, nút khóa mờ
đi (`opacity: .5`) thay vì tối đi.
