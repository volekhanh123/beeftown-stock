# Nội bộ (`/noi-bo`) và kho (`/noi-bo/kho`) — cách dựng

Đọc khi làm màn cho nhân viên. Không có tài liệu thiết kế riêng cho hai khu này: luật nằm ở đầu các
file CSS, chú thích layout, `web/README.md` (mục "Giao diện nội bộ") và `web/KHO.md` (KHO.md thắng
README khi hai bên lệch).

## Tinh thần

- **Nền sáng, mật độ cao hơn trang công khai** — để đứng ở quầy dò một danh sách, không phải để đọc
  lướt. Đầu trang tối (`--than`). Chỉ có giao diện sáng.
  (Chú thích đầu `noi-bo.css` còn ghi "trang công khai nền tối" — đúng trước 06/10/2026; giờ trang
  công khai là nền kem. Dấu hiệu "đang ở trang quản trị" bây giờ là đầu trang tối, thanh điều hướng và
  mật độ.)
- **Thiết kế cho ngón cái trước, màn lớn sau.** Thủ kho, nhân viên quầy dùng điện thoại, tay có thể ướt.
- **Kho** sáng và thoáng hơn CRM (học cách iPOS Inventory Pro sắp xếp: nền gần trắng, thẻ trắng bo góc,
  biểu tượng rõ, số to). **Đỏ dành cho số báo việc và nút chính — chỗ nào đỏ là chỗ đó cần làm.**
- **Không cần JavaScript**: mọi thao tác là form POST rồi chuyển hướng 303 (F5 không gửi lại).
- **Màu: còn bảng cũ.** Hai khu này đọc token ở `:root` của `chung.css` (bảng "Token của `/noi-bo` và
  kho" trong `SKILL.md`: đỏ `#B23A2C`, kem `#FBF4E1`…). Bảng màu thương hiệu chốt 09/10/2026 mới áp dụng
  cho trang công khai, qua khối `.ck` — lớp đó không có ở đây. Chưa có PR đổi màu cho `/noi-bo` và kho:
  màn mới dùng token như các màn đang có, không gõ mã của bảng mới vào một màn lẻ.

## CSS và layout

| | Nội bộ CRM | Kho |
|---|---|---|
| Layout | `web/src/layouts/NoiBo.astro` (props `tieuDe`, `nhanSu`) | `web/src/layouts/Kho.astro` (props `k`, `tieuDe`, `huongDan` — bắt buộc, `rong?`) |
| CSS | `chung.css` + `noi-bo.css` (lớp `nb-*`) | thêm `kho.css` (lớp `kho-*`, dựa trên `nb-*`) + `kho-khung.css` (mọi thứ dưới `.kho-than`) |
| Khung | `body.nb-than` → `header.nb-dau` → `nav.nb-dieu-huong` → `nav.nb-day` (điện thoại) → `main.nb-khung.nb-chinh` | `body.nb-than.kho-than` → `a.kho-bo-qua` → `header.kho-dau` (dính) → `.kho-khung` (`nav.kho-ben` từ 1024px + `main#noi-dung.kho-chinh`) → `nav.kho-day` (dưới 1024px) |
| Rộng | `.nb-khung` min(880px, 92 %) | `.kho-chinh` 880px; `.rong` 1200px |
| Mốc | 640px: thanh trên ↔ thanh đáy | 420 (lưới một cột) · 640 · 1024 (cột bên ↔ thanh đáy) |

Token thêm của kho (khai trên `.kho-than`): `--kho-nen` `#FFFCF6`, `--kho-the` `#FFFFFF`, `--kho-vach`
`#EFE4D2`, `--kho-vach-dam` `#E0D2BB`, `--kho-xanh` `#1F7A4C`, `--kho-xanh-nen` `#E9F5EE`,
`--kho-vang-nen` `#FFF5DC`, `--kho-do-nen` `#FDECEA`, `--kho-bo` 14px.

**Màu trạng thái** (cùng nghĩa ở cả hai khu):

| Nghĩa | Chữ / vạch | Nền | Lớp ví dụ |
|---|---|---|---|
| Xong, đang chạy | `#1F7A4C` | `#E9F5EE` | `.nb-nhan.song`, `.nb-bao.xong`, `.kho-han.con_han` |
| Lưu ý — xem hôm nay | `--mu-tat` (chữ vàng đậm `#8A5A00` – `#B07A00`) | `#FFF5DC` | `.nb-bao.luu-y`, `.nb-nhan.nhap`, `.kho-han.sap_het` |
| Lỗi, chờ người khác — làm ngay | `--do` | `#FDECEA` | `.nb-bao.loi`, `.nb-nhan.cho`, `.kho-han.het_han` |
| Tắt, chưa bật | `--vach` | — | `.nb-nhan.tat`, `.sk-den.tat` |

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
- Viền ô nhập nên dùng `--vien-o` (ở hai khu này 3,3 : 1 với kem); ô nội bộ cũ dùng `--vach` mờ hơn —
  màn mới đừng chép.

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
mạng). Dùng cùng màu đỏ, kem, than, mù tạt của **bảng cũ** như `/noi-bo` và kho (token khai ngay trong
file HTML; chưa đổi sang bảng màu chốt 09/10/2026), nhưng **phông hệ thống (Segoe UI)** vì chạy không
mạng. Khi sửa: giữ bảng màu app đang dùng, đừng thêm phông tải từ mạng, việc chính dùng nút to sẵn có
(`button.to`). Hai chỗ app khác web — đừng chép sang web: nút lọc bo tròn kiểu viên thuốc, nút khóa mờ
đi (`opacity: .5`) thay vì tối đi.
