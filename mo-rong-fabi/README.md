# Mở rộng FABi — đưa món mới của kho sang FABi

Extension cho Chrome (và Edge). Trên trang **Món ăn tại thành phố** của FABi CMS, bấm một nút: extension lấy
những món kho chưa có trên FABi, mở **Tiện ích → Thêm món từ file** và đưa file vào. FABi hiện bảng xem trước; bạn
kiểm rồi **tự bấm Lưu của FABi**. Không phải tải file Excel về máy, không phải chọn file.

Extension không bấm Lưu thay bạn, không sửa hay xóa món đã có trên FABi, không đọc khách hàng hay doanh thu. Nó chỉ
chạy trên `fabi.ipos.vn` và chỉ gọi `beeftown.vn`.

## Cài (một lần, trên máy dùng FABi CMS)

1. Lấy thư mục `mo-rong-fabi`: GitHub → repo `beeftown-stock` → nút **Code** → **Download ZIP** → giải nén. Thư mục
   cần dùng là `mo-rong-fabi` bên trong.
2. Chrome: mở `chrome://extensions`. Edge: mở `edge://extensions`.
3. Bật **Chế độ dành cho nhà phát triển** (Developer mode) ở góc phải trên (Edge: cột bên trái).
4. Bấm **Tải tiện ích đã giải nén** (Load unpacked) → chọn thư mục `mo-rong-fabi`.
5. Thấy "Beeftown — món mới sang FABi" trong danh sách là xong. Không cần ghim lên thanh công cụ.

Không xóa hay đổi tên thư mục `mo-rong-fabi` sau khi cài: Chrome đọc extension thẳng từ thư mục đó.

## Dùng

1. Trên cùng trình duyệt, đăng nhập kho ở `beeftown.vn/noi-bo` bằng tài khoản **quản lý** hoặc **chủ** (thủ kho,
   nhân viên quầy, kế toán không tải được danh sách món cho FABi). Kho đang chọn chi nhánh nào thì lấy món của chi
   nhánh đó.
2. Mở FABi CMS → **Món ăn** → **Món ăn tại thành phố**. Góc trái dưới có khung **Beeftown · món mới từ kho**.
3. Để ô tìm kiếm trống, hai ô lọc ở **Tất cả thành phố**, **Tất cả nhóm món**. Bấm **Đưa món mới sang FABi**.
4. Extension đọc mã món đang có trên FABi (tự cuộn cho bảng tải hết), lấy file từ kho, mở hộp thoại và đưa file vào.
   Món kho đã có trên FABi — kể cả món tạo tay chưa bán lần nào — không bị đưa lại.
5. FABi hiện bảng xem trước; khung ghi file của chi nhánh nào trong kho. Kiểm tên, mã, giá từng dòng. FABi báo lỗi
   dòng nào thì đọc câu lỗi trước, đừng bấm Lưu.
6. Bấm **Lưu** của FABi. FABi báo "Tải lên thành công" thì khung cũng báo xong.
7. Ở máy thu ngân, quét thử 1 tem cân của mỗi món mới: ra đúng món, đúng giá.

Đổi giá món đã có thì vẫn sửa tay trên FABi cùng lúc với kho — extension chỉ thêm món mới.

## Khung báo gì, làm gì

| Khung báo | Làm gì |
|---|---|
| Trình duyệt này chưa đăng nhập kho | Bấm liên kết "Mở trang đăng nhập kho", đăng nhập, bấm lại |
| Tài khoản … không được tải danh sách món | Đăng nhập kho bằng tài khoản quản lý hoặc chủ |
| Kho chuyển sang trang khác thay vì trả file | Trình duyệt đang đăng nhập kho bằng tài khoản máy, hoặc máy tính bảng dùng chung đang khóa: đăng nhập lại bằng tài khoản quản lý hoặc chủ |
| Ô tìm kiếm đang có chữ / Không thấy hai ô lọc "Tất cả…" | Xóa ô tìm kiếm, đặt hai ô lọc về Tất cả, bấm lại |
| Mới đọc được … / … món | Cuộn xuống cuối bảng cho hiện đủ, bấm lại |
| Không đọc được mã món ở dòng … | Xem dòng đó trên FABi: ô Mã món trống thì sửa món đó trên FABi; còn lại báo người làm phần mềm |
| Không có món mới nào cần thêm trên FABi | Không phải làm gì. Món mới phải có mã cân và giá bán/kg trong kho mới vào file |
| Bấm Tiện ích → Thêm món từ file | Tự mở hộp thoại đó trong 2 phút; extension đưa file vào |
| Không lấy được file từ kho / Kho báo lỗi | Thử lại sau ít phút; còn lỗi thì báo người làm phần mềm |
| Không thấy bảng món / dòng "Tổng" | FABi có thể đã đổi giao diện — báo người làm phần mềm |
| Extension vừa được tải lại | Tải lại trang FABi (phím F5), bấm lại |

Mọi câu báo dừng đều kèm "Chưa có gì được đưa vào FABi": lúc đó FABi chưa nhận gì.

## Cập nhật lên bản mới

Tải ZIP mới, chép đè thư mục `mo-rong-fabi` cũ, vào `chrome://extensions` bấm nút tải lại (mũi tên tròn) ở thẻ
extension, rồi tải lại trang FABi.

## Việc Khánh phải thử trên FABi thật (lần đầu, sau khi deploy web)

Kiểm thử trong repo chạy trên một trang FABi giả dựng theo HTML Cowork chép ngày 28/10/2026, không phải FABi thật.

1. Mở **Món ăn tại thành phố**: khung hiện ở góc trái dưới, không che nút nào cần bấm.
2. Bấm khi kho chưa có món mới: khung báo "Không có món mới…".
3. Thêm một món cân mới trong kho (mã cân chưa dùng, có giá bán/kg). Bấm: hộp thoại "Thêm món" tự mở, bảng xem trước
   hiện đúng 1 món — Mã món = Mã barcode = mã cân đủ 5 số (ví dụ `01017`), đơn vị Kg, giá đúng. Bấm Lưu → FABi báo
   "Tải lên thành công", khung báo xong. Món mới có trong danh sách FABi.
4. Bấm lại ngay: khung báo "Không có món mới… đã có trên FABi" (extension thấy món vừa thêm trong bảng FABi).
5. Quét 1 tem cân của món mới ở máy thu ngân: ra đúng món, đúng giá; hóa đơn về kho trừ đúng món.
6. Đăng xuất kho, bấm lại: khung báo chưa đăng nhập, có liên kết đăng nhập.
7. Đặt ô lọc thành phố sang "Hồ Chí Minh", bấm: khung báo ô lọc, không hỏi kho. Đặt lại "Tất cả thành phố": bấm được
   như bước 2. (Extension nhận ô lọc qua chữ "Tất cả thành phố" đang hiện; FABi vẽ khác thì báo ô lọc ở cả bước 2.)

Bước nào khác những gì ghi ở đây: chụp màn hình khung và hộp thoại FABi, gửi người làm phần mềm.

## Giả định về FABi CMS (nguồn: Cowork ghi trang thật ngày 28/10/2026)

FABi không có API tạo món (`web/KHO.md`, mục 3j), nên extension dựa vào giao diện FABi CMS. FABi đổi giao diện thì
extension dừng với câu báo, không đoán:

| Extension dựa vào | Đổi thì |
|---|---|
| Trang danh sách ở `https://fabi.ipos.vn/menu/items/items-in-city` | Khung không hiện |
| Bảng có cột tên đúng "Mã món"; dòng "Tổng: N món" dưới bảng | Báo không thấy bảng / dòng Tổng, dừng |
| Ô tìm kiếm có chữ gợi ý "Nhập tên hoặc mã món"; ô lọc hiện chữ (không phải chữ gợi ý) "Tất cả thành phố", "Tất cả nhóm …" | Báo ô lọc, dừng |
| Ô "Mã món" chứa đúng một mã (có thể kèm chữ khác) | Báo không đọc được mã ở dòng đó, dừng |
| Bảng tải thêm món khi cuộn tới cuối (chưa thấy tận mắt: thương hiệu mới có 3 món) | Báo đọc thiếu, dừng |
| Nút "Tiện ích" → mục "Thêm món từ file" | Nhờ người tự mở hộp thoại |
| Hộp thoại đang hiện có "Bước 2. Thêm món vào file", "Bước 3. Tải file thực đơn lên" và `<input type="file" class="excel-upload-input">` | Hết 2 phút thì báo, không đưa file |
| FABi đọc Excel ngay trên trình duyệt khi ô chọn file đổi, rồi hiện bảng xem trước có nút "Lưu" | Báo chưa thấy bảng xem trước |
| FABi báo "Tải lên thành công" sau khi lưu | Khung không báo xong (món vẫn lưu nếu FABi đã lưu) |

Trang có thêm ô `excel-upload-input` trong các hộp thoại ẩn (Xuất, sửa thực đơn; Cấu hình giá theo nguồn): extension
chỉ đưa file vào ô của hộp thoại đang hiện.

## Cho người làm phần mềm

| File | Việc |
|---|---|
| `manifest.json` | Manifest V3. Quyền host duy nhất `https://beeftown.vn/*`; content script chỉ `https://fabi.ipos.vn/*`; không `permissions`, không `externally_connectable` |
| `chung.js` | Thuần (không DOM, không `chrome.*`): hằng, câu vi / en, đọc dòng Tổng, lọc mã số, phân loại phản hồi kho, base64. Nạp ở cả service worker và trang |
| `nen.js` | Service worker: nhận tin của chính extension từ `fabi.ipos.vn`, GET `mon-fabi.xlsx?da_co=…` với cookie phiên kho (`credentials: 'include'`), theo chuyển hướng rồi xét địa chỉ cuối (về trang đăng nhập = chưa đăng nhập; trang khác = tài khoản máy, máy khóa), hạn 30 giây, địa chỉ tối đa 8000 ký tự, trả base64 |
| `trang-fabi.js` | Content script: khung (Shadow DOM), đọc bảng, mở hộp thoại, `DataTransfer` → `input.files` + sự kiện `change`, theo dõi "Tải lên thành công" |
| `_locales/` | Tên và mô tả extension, vi / en |
| `thu/thu-trinh-duyet.mjs` | Thử trong Chromium thật với FABi và kho giả (HTTPS, chứng chỉ tự ký) |

Phía kho: `/noi-bo/kho/ban-ipos/mon-fabi.xlsx` nhận `da_co` (mã toàn số đang có trên FABi, tối đa 2000, sai dạng →
400) và bỏ món mang mã đó khỏi file (`docMaDaCoFabi`, `taoTepNhapFabi` trong `web/src/lib/kho/thu-ngan.ts`); header
`x-so-mon`, `x-so-da-co`, `x-chi-nhanh`. Route chỉ GET, không ghi gì; quyền như trước (`danh_muc`). Câu của kho theo
ngôn ngữ người dùng chọn ở kho; extension ghép đuôi "Chưa có gì được đưa vào FABi" cùng thứ tiếng với câu đó.

Content script phải nhờ service worker lấy file: `fetch` của content script đi theo nguồn của trang (`fabi.ipos.vn`).
Service worker có quyền host nên Chrome gửi kèm cookie phiên kho (SameSite=Lax) — thử trên Chromium thật ở
`thu/thu-trinh-duyet.mjs` nhóm 4.

```bash
cd crm && node test/test-mo-rong-fabi.mjs      # phần thuần, manifest, câu chữ, luật repo (chạy trong npm test)
node test/test-kho-ipos-ma-can.mjs             # route da_co (nhóm 8c)
cd .. && node mo-rong-fabi/thu/thu-trinh-duyet.mjs   # Chromium thật (cần web/ đã npm ci + npx playwright install chromium)
```

Đổi FABi CMS: sửa `trang-fabi.js` và trang giả trong `thu/thu-trinh-duyet.mjs` cùng lúc, ghi ngày và nguồn vào bảng
giả định ở trên. Đổi bản: tăng `version` trong `manifest.json`.
