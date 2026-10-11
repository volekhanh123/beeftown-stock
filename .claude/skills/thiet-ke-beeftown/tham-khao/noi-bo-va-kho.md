# Nội bộ (`/noi-bo`) và kho (`/noi-bo/kho`) — cách dựng

Đọc khi làm màn cho nhân viên. Không có tài liệu thiết kế riêng cho hai khu này: luật nằm ở đầu các
file CSS, chú thích layout, `web/README.md` (mục "Giao diện nội bộ") và `web/KHO.md` (KHO.md thắng
README khi hai bên lệch).

## Tinh thần

- **Nền sáng, mật độ cao hơn trang công khai** — để đứng ở quầy dò một danh sách, không phải để đọc
  lướt. Nền Cream, thẻ và ô nhập trắng, đầu trang tối (`--than`). Chỉ có giao diện sáng. Dấu hiệu
  "đang ở trang quản trị" là đầu trang tối, thanh điều hướng và mật độ — không phải một bảng màu khác.
- **Thiết kế cho ngón cái trước, màn lớn sau.** Thủ kho, nhân viên quầy dùng điện thoại, tay có thể ướt.
- **Kho** thoáng hơn CRM (học cách iPOS Inventory Pro sắp xếp: thẻ trắng bo góc trên nền kem, biểu
  tượng rõ, số to). **Đỏ dành cho số báo việc và nút chính — chỗ nào đỏ là chỗ đó cần làm.**
- **Không cần JavaScript**: mọi thao tác là form POST rồi chuyển hướng 303 (F5 không gửi lại).
- **Màu: cùng bảng với trang công khai** — bảng thương hiệu chốt 09/10/2026, hai khu này đổi ngày
  11/10/2026. Token đọc ở `:root` của `chung.css`, cùng giá trị với khối `.ck` (bảng "Token màu của
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

**Token thêm của kho** (khai trên `.kho-than`). Kho không có sắc riêng — mỗi token cùng mã với một màu
của bảng: `--kho-nen` `#F0E3D0` (nền trang, là Cream), `--kho-the` `#FFFFFF` (thẻ và ô nhập),
`--kho-vach` `#E7D5BC` (viền thẻ, vạch ngăn trong thẻ; là kem đậm), `--kho-vach-dam` `#B8A98C` (viền thẻ
khi di chuột, vạch của dòng "xem cho biết"; là Warm Stone), `--kho-bo` 14px.

**Màu trạng thái** — màu chức năng của công cụ, không thuộc bảng thương hiệu, không dùng ở trang công
khai. Khai **một lần** trên `.nb-than`, đầu `noi-bo.css`; kho đọc chung (`Kho.astro` đặt
`<body class="nb-than kho-than">`). Trang và component không khai lại, không gõ mã:

| Token | Mã | Dùng cho |
|---|---|---|
| `--xanh` | `#1A683F` | Chữ, vạch, đèn "xong, đang chạy"; nền đặc của nhãn (chữ trắng đặt lên) |
| `--xanh-nen` | `#E4F0E5` | Nền nhạt của khối và nhãn "xong" |
| `--xanh-vien` | `#B9D8C0` | Viền của khối nền xanh nhạt |
| `--vang-chu` | `#7A5200` | Chữ và biểu tượng "lưu ý" trên nền sáng; viền của đèn vàng và chấm "chưa đọc" |
| `--vang-nen` | `#FDE9B5` | Nền nhạt của khối "lưu ý" |
| `--vang-vien` | `#E8C36A` | Viền của khối nền vàng nhạt |
| `--do-nen` | `#FAE9E6` | Nền nhạt của khối "lỗi, làm ngay" |
| `--do-vien` | `#E8BDB7` | Viền của khối nền đỏ nhạt |

Đỏ của trạng thái là chính `--do`. Vàng đặc là `--mu-tat` (Marigold) với **chữ than đặt lên trên**.

| Nghĩa | Chữ, vạch, đèn | Nền nhạt | Nhãn đặc | Lớp ví dụ |
|---|---|---|---|---|
| Xong, đang chạy | `--xanh` | `--xanh-nen` | nền `--xanh`, chữ trắng | `.nb-nhan.song`, `.nb-bao.xong`, `.kho-han.con_han` |
| Lưu ý — xem hôm nay | `--vang-chu` | `--vang-nen` | nền `--mu-tat`, chữ than | `.nb-bao.luu-y`, `.nb-nhan.nhap`, `.kho-han.sap_het` |
| Lỗi, chờ người khác — làm ngay | `--do` | `--do-nen` | nền `--do`, chữ trắng | `.nb-bao.loi`, `.nb-nhan.cho`, `.kho-han.het_han` |
| Tắt, chưa bật | `--muc-nhat` | — | nền `--vach`, chữ `--muc-nhat` | `.nb-nhan.tat`; đèn `.sk-den.tat` là vòng rỗng viền `--vien-o` |

**Luật màu của hai khu** (đã tính theo WCAG 2.2; `test-noi-bo-bang-mau.mjs` nhóm 4 tính lại từng cặp):

- Chữ than: 18,93 : 1 trên thẻ trắng, 14,96 trên kem. Chữ phụ `--muc-nhat`: 6,63 và 5,92. Chữ đỏ: 7,77
  và 6,15. Chữ trắng trên nút đỏ: 7,77. `--xanh`: 6,78 và 5,36. `--vang-chu`: 6,92 và 5,47.
- **Marigold và Warm Stone không làm chữ hay biểu tượng trên nền sáng** (1,97 và 2,31 : 1 với thẻ
  trắng). Cần chữ "lưu ý" trên nền sáng: `--vang-chu`. Cần chấm, đèn hay vạch vàng: tô `--mu-tat` và kẻ
  viền `--vang-chu` (viền là thứ mang tương phản — xem `.sk-den.vang`, chấm "chưa đọc" của trang Thông
  báo). Marigold và Warm Stone làm chữ **chỉ** trên đầu trang tối và mục đang chọn của cột bên.
- **Không tô nền vàng cho cả dòng danh sách** để báo "mới": vài chục dòng chưa đọc thành một mảng vàng,
  trong khi vàng chỉ là điểm nhấn nhỏ. Dòng chưa đọc mang chấm Marigold ở biểu tượng và chữ "mới".
- **Vòng focus**: Charcoal trên nền sáng, Marigold trên đầu trang tối (`.nb-than :focus-visible`,
  `.nb-dau :focus-visible`). Ô nhập đang focus: viền than, thêm một nét than phía trong và quầng
  Marigold phía ngoài.
- **Bản in** (`@media print`): chỉ đen, trắng, xám; nền kem không lên giấy.

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
- Viền ô nhập là `--vien-o` (4,70 : 1 với nền trắng của ô; mức tối thiểu là 3 : 1). Không kẻ viền ô
  bằng `--vach`, `--kho-vach` hay Warm Stone — đứng ở quầy không thấy chỗ để chạm vào (có kiểm thử).
  Viền của **nút phụ** `.nb-nut.phu` thì là Warm Stone: nút đã có nền trắng và chữ than để nhận ra.

## Biểu tượng

Hai bộ, **không trộn**:

| Bộ | File | Nét | Tên |
|---|---|---|---|
| Trang công khai | `web/src/components/BieuTuong.astro` | 1,5px | mui-ten, menu, dong, cong… |
| Nội bộ, kho | `web/src/components/kho/BieuTuong.astro` + `web/src/lib/kho/bieu-tuong.ts` | 2px, prop `co` (mặc định 22) | nha, viec, duyet, quet, ton, quay, khac, nhap, dao, chuyen, bep, huy, kiem_ke, cong_no, bao_cao, cai_dat, chuong, quy_trinh, huong_dan, dang_xuat, can, nguoi, lich, them, tiep, lui, canh_bao, dat_hang, in, tin_nhan, tim, trang_web |

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
| Nút | `.nb-nut` (đỏ), `.nb-nut.phu` (trắng viền), `.kho-nut-xoa` (xóa: chữ, viền đỏ), `.kho-thanh-nut` (hàng nút; `.dinh` dính đáy dưới 1024px) | Tên nút kể **việc ngoài đời** ("Đã gọi xác nhận"), không việc trong database ("Duyệt"). `.nb-nut` đè `hidden` — thêm `[hidden]{display:none!important}` khi cần |
| Form | `label.nb-o > span` (nhãn, thêm " *" nếu bắt buộc) + `small` (gợi ý, **trên** ô) + ô; lưới `.kho-luoi`, `.kho-luoi-2`; bọc `.nb-the` | Số nhập bằng `type="text"` + `inputmode="numeric"` / `"decimal"`, không `type="number"`. Có / không là `select` ba lựa chọn, **không ô tick** (`TruongThem`). Ô mã: `autocapitalize="characters"`, `spellcheck="false"` |
| Chọn | `ChonMatHang` (`select` theo nhóm, mã để trong `title`), `NhanHangChon` (thẻ radio 56px, `:has(input:checked)`) | Không mã trong chữ của lựa chọn |
| Bảng | `BangBaoCao` → `.kho-bang-khung > table.kho-bang.kho-bao-cao` | Cột đầu dính; `td.so` canh phải; tổng ở `tfoot tr.tong`; 0 hiện `·`, không có hiện `—`; trống thì `p.nb-rong` nói số liệu từ đâu ra. Điện thoại: một thẻ mỗi dòng thay vì bảng |
| Tìm, lọc | `LocDanhSach` — một form GET, trạng thái lọc nằm trên đường dẫn (gửi qua Zalo được) | `ChonKy` cho kỳ báo cáo (tối đa một năm) |
| Trang | `PhanTrang` — 30 dòng, không đếm tổng | |
| Quét | `QuetMa` — ô `textarea` nhận máy quét như bàn phím; nút camera `hidden` tới khi camera chạy được | Không camera thì không nút camera; trang vẫn dùng được không JavaScript |
| In | `InDau` (giấy tự nói nó là gì: chi nhánh, tên, số, giờ in), `KyTen`, `NutIn` | `.kho-khong-in` / `.kho-chi-in`; khi in ẩn đầu, cột bên, thanh đáy, mọi nút |
| Báo | `BaoKho` → `.nb-bao.xong` (`role="status"`) / `.nb-bao.loi` (`role="alert"`) / `.nb-bao.luu-y` | Nhiều lỗi nối bằng " · "; dữ liệu đã gõ, mã đã quét được điền lại |
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
mạng). **Cùng bảng màu chốt 09/10/2026** như `/noi-bo` và kho (từ bản 2.9.2): vì chạy không mạng, mỗi
file HTML khai lại bảng trong khối `:root` của nó — hai file phải khai giống hệt nhau, đúng mã của bảng
"Token màu của website" và của bảng màu trạng thái ở trên (`test-noi-bo-bang-mau.mjs` nhóm 5 và
`can-app/test/thu.ts` gác). Hai tên biến trong app khác web: `--vach` ở đây là kem đậm (web gọi là
`--kem-dam`), chữ phụ Charcoal 68 % tên là `--chu-phu` (web gọi là `--muc-nhat`). **Phông hệ thống
(Segoe UI)** vì chạy không mạng. Khi sửa: chỉ dùng biến, đừng thêm phông tải từ mạng, việc chính
dùng nút to sẵn có (`button.to`); đổi giao diện thì tăng `PHIEN_BAN` trong `can-app/src/main.ts`. Màu
viết cứng còn lại là hình của vật thật, không phải màu giao diện: mực và nét gạch của tờ tem vẽ thử,
màn hình tinh thể lỏng của cân vẽ trong hướng dẫn. Hai chỗ app khác web — đừng chép sang web: nút lọc
bo tròn kiểu viên thuốc, nút khóa mờ đi (`opacity: .5`) thay vì tối đi.
