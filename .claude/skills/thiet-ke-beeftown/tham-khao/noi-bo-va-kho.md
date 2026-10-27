# Nội bộ (`/noi-bo`) và kho (`/noi-bo/kho`) — cách dựng

Đọc khi làm màn cho nhân viên. Không có tài liệu thiết kế riêng cho hai khu này: luật nằm ở đầu các
file CSS, chú thích layout, `web/README.md` (mục "Giao diện nội bộ") và `web/KHO.md` (KHO.md thắng
README khi hai bên lệch).

## Tinh thần

- **Nền sáng, mật độ cao hơn trang công khai** — để đứng ở quầy dò một danh sách, không phải để đọc
  lướt. Nền trang xám nhạt, thẻ và ô nhập trắng, đầu trang đen (`--than`). Chỉ có giao diện sáng. Dấu
  hiệu "đang ở trang quản trị" là đầu trang đen, thanh điều hướng và mật độ — không phải một bảng màu
  khác.
- **Thẻ trắng trên nền xám nhạt**, tách bằng viền mảnh `#E2E2E2` (chỉ 1,18 : 1 trên `#F4F4F4` — đủ vì thẻ
  khác nền; Khánh xem ảnh chụp, `THUONG-HIEU.md` mục 0, điểm G).
- **Thiết kế cho ngón cái trước, màn lớn sau.** Thủ kho, nhân viên quầy dùng điện thoại, tay có thể ướt.
- **Kho** thoáng hơn CRM (học cách iPOS Inventory Pro sắp xếp: thẻ trắng bo góc trên nền xám nhạt,
  biểu tượng rõ, số to). **Đỏ dành cho số báo việc và nút chính — chỗ nào đỏ là chỗ đó cần làm.**
- **Không cần JavaScript**: mọi thao tác là form POST rồi chuyển hướng 303 (F5 không gửi lại).
- **Màu: cùng bảng với trang công khai** — bảng 22/10/2026, đổi ở PR "Đổi nhận diện website". Token
  đọc ở `:root` của `chung.css`, cùng giá trị với khối `.ck` (bảng "Token màu của website" trong
  `SKILL.md`). Hai khu có thêm token của kho và **bảy kiểu vẽ trạng thái**, ở mục "CSS và layout" dưới
  đây. Màn mới chỉ dùng biến: `crm/test/test-noi-bo-bang-mau.mjs` đỏ khi một file nội bộ gõ mã
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

Ô nhập luôn nền `--kem` (kể cả khi đặt thẳng trên nền trang), viền `--vien-o`. Trắng và xám nhạt chỉ
chênh 1,10 : 1 — thẻ tách khỏi nền bằng viền `--vach`. Di chuột trên thẻ, nút phụ, menu thả: `--kem-dam`.
Ô nhập không lớp riêng, ô đánh dấu, ô chọn một, nút "Chọn tệp", `<dialog>`, `<fieldset>`, thanh
`<progress>` đã có màu sẵn từ `noi-bo.css` (ô đánh dấu và ô chọn một tự vẽ để mọi trình duyệt vẽ cùng
một nét; khi in và ở chế độ tương phản cao thì trả về ô của hệ thống): trang chỉ đặt cỡ ô, không đặt màu, không
`accent-color`. Chữ gợi ý (placeholder) là `--muc-nhat`.

**Token thêm của kho** (khai trên `.kho-than`). Kho không có sắc riêng — token chỉ trỏ về biến:
`--kho-nen` là `--nb-nen`, `--kho-the` là `--nb-the`, `--kho-vach` là `--vach` (viền thẻ, vạch ngăn
trong thẻ), `--kho-vach-dam` là `--vien-o` (viền thẻ khi di chuột, vạch của dòng "xem cho biết"),
`--kho-bo` 14px.

**Trạng thái — không có màu riêng.** Ngày 25/10/2026 Khánh bỏ màu trạng thái xanh, vàng, đỏ nhạt (tám
biến trạng thái và hai biến vàng đã xóa khỏi CSS). Trạng thái vẽ bằng bảy kiểu, khai **một lần** ở
`noi-bo.css` (lớp `.nb-nhan.*`, `.nb-bao.*`) và `kho.css` / `kho-khung.css` (lớp của kho); kho đọc chung
(`Kho.astro` đặt `<body class="nb-than kho-than">`). Trang và component không khai lại, không gõ mã. Đỏ chỉ
cho "làm ngay":

| Kiểu | Vẽ | Nghĩa | Dấu không phải màu | Lớp |
|---|---|---|---|---|
| K1 đỏ đặc | Nền `--do`, chữ trắng, "!" trước chữ | Làm ngay, chờ duyệt, hết hạn (nhãn nhỏ) | Nền đặc và "!" | `.nb-nhan.cho`, `.kho-han.het_han` |
| K2 viền đỏ | Nền thẻ, viền 2px `--do`, số và biểu tượng đỏ, tam giác "!" | Làm ngay (khối, thẻ, ô số) | Viền dày 2px và tam giác | `.nb-bao.loi`, `.kho-o-so.gap`, `.kho-the-so.do` |
| K3 đen đặc | Nền `--than`, chữ trắng, không dấu | Nháp, giá thử, đang làm dở | Nền đặc, không dấu | `.nb-nhan.nhap` |
| K4 viền đen | Nền trong, viền 1,5px đen liền, chữ đen, "✓" | Xong, đang bật, còn hạn | Viền liền và ✓ | `.nb-nhan.song`, `.nb-bao.xong`, `.kho-han.con_han` |
| K5 xám | Nhãn: nền `--kem-dam`, chữ đen. Khối, ô số: nền thẻ, vạch `--muc-nhat`, vòng tròn "!" | Lưu ý — xem hôm nay | Nền xám đặc (nhãn) hoặc vòng tròn "!" (khối) | `.nb-nhan.luu-y`, `.nb-bao.luu-y`, `.kho-han.sap_het`, `.kho-o-so.luu-y`, `.kho-the-so.vang` |
| K6 nét đứt | Nền trong, viền 1,5px nét đứt `--vien-o`, chữ `--muc-nhat` | Tắt, đã hủy, chưa bật, việc của vai khác | Nét đứt | `.nb-nhan.tat`; đèn `.sk-den.tat` là vòng rỗng viền `--vien-o` |
| K7 thông tin | Nền trong, viền 1px `--vien-o` liền, chữ đen | Thuộc tính, không phải trạng thái: vai, "Nợ đầu", số tiền, "Bắt buộc" | Không dấu, viền mảnh | `.nb-nhan.thong-tin` |

Bốn luật cứng (`test-noi-bo-bang-mau.mjs` nhóm 7 gác CSS; `test-noi-bo-trang-thai.mjs` gác markup và câu):

1. Mỗi nhãn đều có chữ. Hai trạng thái đứng cạnh nhau khác nhau ở ít nhất một kênh không phải màu: dấu,
   nét, nền đặc / rỗng, hoặc **đảo chữ** (chữ trắng trên nền tối với chữ đen trên nền sáng — như K3 với
   K5).
2. Không để đỏ, `#555555`, `#767676`, đen là khác biệt **duy nhất** (chỉ chênh 1,12 · 1,46 · 3,16 : 1).
3. Không nền màu nhạt nào: chỗ cần nhấn dùng nền thẻ, `--kem-sau` hoặc K5.
4. Dấu vẽ bằng CSS, không emoji, không ký tự tam giác cảnh báo của bảng mã (iPhone vẽ thành emoji):
   `content` viết hai lần (`'!'` rồi `'!' / ''` — Safari cũ đọc dòng đầu, trình duyệt mới đọc dòng sau,
   trình đọc màn hình đọc chữ của nhãn); tam giác bằng `clip-path`, vòng bằng `border-radius`. Nhãn nền
   đặc có viền trong suốt 1,5px để chế độ tương phản cao vẫn vẽ khung.

Câu nhân viên đọc không gọi trạng thái bằng tên màu ("đèn vàng", "hiện xanh", "dòng nền vàng"): gọi theo
chữ của nhãn hay khung ("Cần xem", "Cân sẵn sàng", "vạch xám bên trái"). Hủy, tắt không vẽ bằng độ mờ
(`opacity`) — dùng K6.

**Luật màu của hai khu** (đã tính theo WCAG 2.2; `test-noi-bo-bang-mau.mjs` nhóm 5 tính lại từng cặp):

- Chữ đen: 21,00 : 1 trên thẻ trắng, 19,09 trên nền `#F4F4F4`. Chữ phụ `--muc-nhat`: 7,46 và 6,78. Chữ
  đỏ: 6,64 và 6,03. Chữ trắng trên nút đỏ: 6,64. Viền ô nhập: 4,54 và 4,13.
- **Không chữ đỏ hay `#555555` trên nền đen** (3,16 và 2,82 : 1): trên đầu trang đen chữ là trắng, chữ
  phụ là `--da` (`#E2E2E2`, 16,21 : 1). `#E2E2E2` không làm chữ, viền ô hay biểu tượng trên nền sáng
  (1,30 : 1 với trắng).
- **Không tô nền cho cả dòng danh sách** để báo "mới": dòng chưa đọc mang **chấm đen** ở góc biểu tượng
  (vòng trắng 2px tách khỏi biểu tượng) và chữ "mới". Chấm không đỏ — đỏ là "làm ngay" của chính dòng.
- **Vòng focus**: đen trên nền sáng, trắng trên đầu trang đen (`.nb-than :focus-visible`,
  `.nb-dau :focus-visible`, `.kho-dau :focus-visible`). Ô nhập đang focus: viền đen dày gấp đôi và một
  vòng đen 3px cách 1px.
- **Bản in** (`@media print`): chỉ đen, trắng, xám. Khi in, `noi-bo.css` đặt nền xám nhạt và các bề mặt về
  trắng — nền không lên giấy kể cả khi máy in bật "in nền" — và trả ô đánh dấu, ô chọn một về ô của hệ
  thống (dấu ✓ trắng tự vẽ không lên giấy khi in tắt nền). Đầu tờ in là logo chính đen (`InDau`).

Đèn sức khỏe (`MauDen` trong `web/src/lib/suc-khoe.ts` — tên mức giữ): `do` = tam giác đỏ **"Xử lý
ngay"** · `vang` = hình thoi xám **"Xem hôm nay"** · `xanh` = chấm đen **"Ổn"** · `tat` = vòng rỗng
**"Chưa bật"**. **Không đọc được số liệu thì không bao giờ là "Ổn".** Mức và câu do `suc-khoe.ts` quyết
định, `SucKhoeHeThong.astro` chỉ vẽ. Đèn mới: `CLAUDE.md` mục 9.

Trạng thái chứng từ → nhãn: `trangThaiKho(ma, nn)` (`TRANG_THAI_CHUNG_TU_NB` trong
`web/src/lib/kho/chung.ts`) — "chờ duyệt", "đang chuyển" là **K1** (nền đỏ, "!") vì đang chờ một người
làm.

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
- Viền ô nhập là `--vien-o` (4,54 : 1 với nền trắng của ô, 4,13 với nền `#F4F4F4`; mức tối thiểu là
  3 : 1). Không kẻ viền ô bằng `--vach`, `--kho-vach` (`#E2E2E2` chỉ 1,30 : 1 trên trắng) — đứng ở quầy
  không thấy chỗ để chạm vào (có kiểm thử). **Nút phụ** `.nb-nut.phu` cũng viền `--vien-o`: nút trắng
  trên thẻ trắng.

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

0. `<TheTrangCon k={k} cha="…" />` — hàng thẻ (`.kho-the-chon`) của ô menu có mục con (Tồn kho, Quầy,
   Báo cáo, Thiết lập, Hướng dẫn), trên trang cha và từng trang con
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
| Nút | `.nb-nut` (đỏ, chữ trắng), `.nb-nut.phu` (trắng, viền `--vien-o`), `.kho-nut-xoa` (xóa: chữ, viền đỏ), `.kho-thanh-nut` (hàng nút; `.dinh` dính đáy dưới 1024px) | Tên nút kể **việc ngoài đời** ("Đã gọi xác nhận"), không việc trong database ("Duyệt"). `.nb-nut` đè `hidden` — thêm `[hidden]{display:none!important}` khi cần |
| Form | `label.nb-o > span` (nhãn, thêm " *" nếu bắt buộc) + `small` (gợi ý, **trên** ô) + ô; lưới `.kho-luoi`, `.kho-luoi-2`; bọc `.nb-the` | Số nhập bằng `type="text"` + `inputmode="numeric"` / `"decimal"`, không `type="number"`. Có / không là `select` ba lựa chọn, **không ô tick** (`TruongThem`). Ô mã: `autocapitalize="characters"`, `spellcheck="false"` |
| Chọn | `ChonMatHang` (`select` theo nhóm, mã để trong `title`), `NhanHangChon` (thẻ radio 56px, `:has(input:checked)`; `batBuoc` = phải chọn một) | Không mã trong chữ của lựa chọn |
| Form nhiều loại | Hỏi loại trước bằng `NhanHangChon`, rồi chỉ hiện ô của loại đó: ô riêng mang `data-loai`, CSS `:has()` ẩn ô không thuộc loại đang chọn; ô ít dùng gập trong `<details>` "Thông tin thêm". Mẫu: `FormMatHang` (Khánh, 27/10/2026: "nhiều trường thông tin quá bị rối") | Không JavaScript; trình duyệt không hiểu `:has()` thấy đủ mọi ô, nên máy chủ phải bỏ qua ô không thuộc loại (`O_THEO_LOAI` của `lib/kho/danh-muc.ts`) |
| Bảng | `BangBaoCao` → `.kho-bang-khung > table.kho-bang.kho-bao-cao` | Cột đầu dính; `td.so` canh phải; tổng ở `tfoot tr.tong`; 0 hiện `·`, không có hiện `—`; trống thì `p.nb-rong` nói số liệu từ đâu ra. Điện thoại: một thẻ mỗi dòng thay vì bảng |
| Tìm, lọc | `LocDanhSach` — một form GET, trạng thái lọc nằm trên đường dẫn (gửi qua Zalo được) | `ChonKy` cho kỳ báo cáo (tối đa một năm) |
| Trang | `PhanTrang` — 30 dòng, không đếm tổng | |
| Quét | `QuetMa` — ô `textarea` nhận máy quét như bàn phím; nút camera `hidden` tới khi camera chạy được | Không camera thì không nút camera; trang vẫn dùng được không JavaScript |
| In | `InDau` (giấy tự nói nó là gì: chi nhánh, tên, số, giờ in), `KyTen`, `NutIn` | `.kho-khong-in` / `.kho-chi-in`; khi in ẩn đầu, cột bên, thanh đáy, mọi nút |
| Báo | `BaoKho` → `.nb-bao.xong` (`role="status"`, K4 ✓) / `.nb-bao.loi` (`role="alert"`, K2 tam giác) / `.nb-bao.luu-y` (K5 vòng tròn "!") | Nhiều lỗi nối bằng " · "; dữ liệu đã gõ, mã đã quét được điền lại |
| Trước khi chuyển tiền | `CanhBaoTaiKhoan` — trang công nợ NCC và màn Trả tiền, ngay dưới dòng số tài khoản | Tài khoản vừa đổi trong 30 ngày → `.nb-bao.loi`; đọc nhật ký lỗi → `.nb-bao.luu-y` "chưa kiểm được"; cả hai dặn gọi hỏi lại NCC |
| Nhãn, đếm | `.nb-nhan`, `.kho-han`, `.kho-so-do` (đỏ, quá 99 hiện "99+") | |
| Bản đồ chức năng | `BanDoChucNang`, `OTimChucNang` | Form GET, không JavaScript |
| Thẻ trang con | `TheTrangCon` (`nav.kho-the-chon`) | Đi qua lại giữa một ô menu và mục con của nó (`cha` trong `lib/kho/dieu-huong.ts`); chỉ một thẻ thì không in. Không thay cho chip lọc `nav.kho-dh` |

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
mạng). **Chưa đổi** sang bộ 21/10/2026: vẫn dùng bảng màu cũ (đỏ, kem, than, mù tạt — token khai ngay
trong file HTML) và màu trạng thái xanh / vàng. Đổi Beeftown Cân là một PR riêng (`THUONG-HIEU.md` mục 0,
việc 7), kèm phiên bản mới của chương trình — đổi
giao diện thì tăng `PHIEN_BAN` trong `can-app/src/main.ts`. **Phông hệ thống (Segoe UI)** vì chạy không
mạng. Khi sửa: giữ bảng màu app đang dùng, đừng thêm phông tải từ mạng, việc chính dùng nút to sẵn có
(`button.to`). Hai chỗ app khác web — đừng chép sang web: nút lọc bo tròn kiểu viên thuốc, nút khóa mờ
đi (`opacity: .5`) thay vì tối đi.

**Từ 2.11 có năm thẻ** (Quầy · Cân · Giảm giá · Báo cáo · Thiết lập cân), chủ duyệt 25/10/2026. Mỗi thẻ gồm vài mục
(id `the-…`); phần ít dùng là mục gập `<details class="the">` có tiêu đề `h2` trên dòng gập, chỉ tải dữ liệu khi mở.
Thẻ nào hiện cho vai nào nằm một chỗ: hàm `mucDuocThay` trong khối "THẺ THEO VAI" của `can-app/src/giao-dien.html`
(NV quầy, thủ kho chỉ thẻ Quầy). Phần mới: tìm chỗ trong thẻ có sẵn trước (bản 2.11 gom từ mười thẻ để gọn); câu chỉ
đường viết "thẻ Thiết lập cân → Mẫu tem". Kiểm thử: `can-app/test/thu-giao-dien-gon.ts` (đọc mã) và `can-app/test/thu-trinh-duyet.ts`
(mở trang trong Chromium cho từng vai).
