# Đặc tả phần mềm cân TM-xA (dịch ngược)

Các file ở đây là **bản đặc tả Beeftown tự viết** khi dịch ngược TM-xA Management Program 3.10 (JHScale) —
phần mềm của hãng đi kèm cân TM-A. Chú thích trong `can-app/src/` (`thong-so.ts`, `giao-thuc.ts`, `tem.ts`…) và
`can-app/CAN-TMA.md` trỏ tới chúng theo tên file và số mục (§).

| File | Nội dung |
|---|---|
| `tms-format.md` | Định dạng file `.TMS` (phần, dòng, cột) |
| `plu-hsd.md` | Dòng PLU, hạn sử dụng |
| `label-format.md` | Mẫu tem (`LAB` / `LAS` / `LAE`), loại ô, cỡ chữ, canh chữ |
| `barcode-keys.md` | Mã vạch, phím tắt, nhóm hàng |
| `net-protocol.md` | Giao thức mạng với cân (cổng TCP, lệnh `UPL` / `DWL`) |
| `reports-sales.md` | Nhật ký bán, báo cáo |
| `spec-wizard.md` | Thông số (Spec), trình hướng dẫn cài đặt |
| `manuals.md` | Đối chiếu với sách hướng dẫn của hãng |
| `_tom-tat.txt` | Tóm tắt và các vòng phản biện |
| `luoc-do-csdl.md` | Lược đồ CSDL Access của phần mềm hãng (chỉ tên bảng, cột — không dữ liệu) |
| `GHI-CHU.md` | Ghi chú về bộ phần mềm kỹ thuật viên gửi: tên, phiên bản, danh sách file, file đã bỏ ra |

**Không có trong repo:** phần mềm của hãng (`TM-xA.exe`, DLL, video hướng dẫn) và mã C# dịch ngược
(`nghien-cuu/ma-dich-nguoc/…` mà đặc tả trích số dòng). Cả hai từng nằm ở nhánh `phan-mem-can-cu`; Khánh giữ bản
ở máy / Drive. Đường dẫn `phan-mem-can-cu/…`, `nghien-cuu/…` trong các file này là đường dẫn trong bản đó.

Mật khẩu quản trị mặc định của hãng được thay bằng `<factory default>` (xem sách hướng dẫn của hãng) — như
quy ước của `CAN-TMA.md`: không ghi giá trị đó vào repo. Mật khẩu CSDL Access viết cứng trong phần mềm hãng thì từ
đầu đã không chép.
