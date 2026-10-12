# Đưa kho vào chạy thật — việc phải làm

Lịch: đào tạo 29/10–07/11/2026 · bán thử từ 08/11 · khai trương 13/11. Thịt ủ cần 7–21 ngày, nên muốn có thịt ủ bán ngày 08/11 thì tảng đầu tiên phải về **trước khoảng 20/10** — phần B phải xong trước ngày đó.

Các bước kỹ thuật đã có hướng dẫn trong `README.md` thì ở đây chỉ trỏ tới, không chép lại.

## A. Trước 15/10 — deploy địa chỉ mới

| # | Việc | Ai | Hạn |
|---|---|---|---|
| 1 | Gộp PR kho đang mở (#73 — soát luồng 6 bước). | Khánh | 14/10 |
| 2 | Chạy migration theo số ở SQL Editor, mỗi file một lần: trước hết các file đã ở main mà production còn thiếu (`npm run doi-chieu` chỉ ra; khi viết: `0063`, `0065` chưa chạy; `0069`–`0074`, `0078` vừa gộp ở PR #74, #78, #81), rồi hai file của PR #73 (hiện là `0082`, `0083`; số đổi nếu PR khác gộp trước — lấy số trong PR lúc gộp). Sau đó `npm run doi-chieu` phải báo KHỚP. Cách làm: `README.md`, mục "Chạy migration lên production". | Khánh | 15/10 |
| 3 | `npm run deploy` khi CI xanh — beeftown.vn hiện địa chỉ mới. | Khánh | 15/10 |
| 4 | Bật sao lưu hằng đêm: thêm 2 secret `SAO_LUU_DB_URL`, `SAO_LUU_MAT_KHAU`, chạy tay một lượt, đèn "Sao lưu dữ liệu" ở `/noi-bo` phải xanh. Đèn đang đỏ từ 05/10 — **chưa có bản sao nào**. Cách làm: `README.md`, mục "Sao lưu và khôi phục". | Khánh | 15/10 |

## B. Trước phiếu nhận hàng thật đầu tiên (khoảng 20/10)

**Thứ tự bắt buộc: bước 7 (dọn) xong rồi mới tới bước 9 (danh mục thật) và phiếu nhận hàng thật đầu tiên.** Lệnh dọn chạy một lần; sau ngày 20/10/2026, hoặc khi kho đã có danh mục mà chưa có dòng sổ kho nào, nó tự từ chối.

| # | Việc | Ai | Hạn |
|---|---|---|---|
| 5 | Mở Kho → Mặt hàng và Nhà cung cấp, ghi lại những mục anh đã gõ tay giữa dữ liệu mô phỏng (đã thấy: mặt hàng "RIBEYE", nhà cung cấp "SLK Grou…"). Bước 7 xoá cả chúng. | Khánh | 17/10 |
| 6 | Kiểm tra đèn "Sao lưu dữ liệu" xanh (mục 4) — có bản sao trước khi xoá. | Khánh | 17/10 |
| 7 | Dọn dữ liệu thử của kho: `crm/supabase/thu/don-du-lieu-thu-truoc-khai-truong.sql`. Sửa 3 dòng đầu file, chạy `'xem'`: đọc số dòng và cột "mới nhất" — mọi ngày ở đó phải là ngày nạp dữ liệu mô phỏng hoặc ngày anh bấm thử. Rồi chạy `'xoa'`. File tự từ chối nếu sai tên chi nhánh, sai ngày, đã tới 20/10, kho đã có danh mục thật, hoặc iPOS đang bật. Giữ vị trí, lý do, cài đặt kho, máy; số phiếu và số tảng bắt đầu lại từ 0001. | Khánh | 17/10 |
| 8 | `/noi-bo/cai-dat` → Chi nhánh: tên, địa chỉ "Tầng 3, 63 Hồ Tùng Mậu", giờ mở (còn câu hỏi trưa 10:00 hay 11:00 — `README.md`). Nhập bàn thật, hoặc đóng form đặt bàn. | Khánh | 20/10 |
| 9 | **Sau bước 7.** Danh mục thật theo màn **Kho → Thiết lập** (10 bước): mặt hàng, nhà cung cấp, công thức pha lóc, bảng ủ, ô mã cho phần cắt ủ, mã cân trùng mã món trên FABi, vị trí, lý do. Nguồn: bảng dữ liệu gốc dựng từ file của Sang. | Sang nhập, Khánh duyệt | 20/10 |
| 10 | Tài khoản. Chủ tạo ở **Kho → Thiết lập → Nhân viên & máy dùng chung**: thủ kho, NV quầy, kế toán, máy tính bảng dùng chung, máy iPOS. Quản lý, thu ngân, marketing: Supabase Studio + một dòng `nhan_su` (`README.md`, mục "Việc kỹ thuật"). | Khánh | 28/10 |
| 11 | Máy tính bảng dùng chung cần secret Worker `KHO_MAY_KHOA`: `npx wrangler secret put KHO_MAY_KHOA` (một chuỗi dài ngẫu nhiên). Thiếu thì màn máy dùng chung báo "Máy dùng chung chưa được bật". | Khánh | 28/10 |
| 12 | Chọn kênh báo động (Zalo, Telegram hoặc email) — không chọn thì đèn đỏ ban đêm không ai biết. `web/README.md`, mục "Báo động". | Khánh | 28/10 |

## C. Trước bán thử 08/11

| # | Việc | Ai | Hạn |
|---|---|---|---|
| 13 | Cài Beeftown Cân ở máy quầy, nối cân TMA thật, in thử tem của một phần cắt có ô mã, quét tem đó ở màn Quét nhãn. Cần người đứng cạnh cân. | Khánh + Claude | 05/11 |
| 14 | Chưa nối iPOS thật thì kho ở chế độ **đếm quầy**: thiếu khi đếm = đã bán. Đếm quầy phải làm **mỗi tối**, không thì sổ không trừ gì. | Quản lý ca | từ 08/11 |

## D. Hai tuần đầu (08–21/11)

| # | Việc | Ai | Khi nào |
|---|---|---|---|
| 15 | Đếm quầy (tới khi nối iPOS); xem bảng sức khỏe ở `/noi-bo`. | Quản lý ca | mỗi tối |
| 16 | Kiểm kê kho lạnh theo lô; xem báo cáo Thu hồi và Hao hụt; báo Claude số nào lạ. | Thủ kho, Khánh | mỗi tuần |

Câu hỏi còn mở về kho (đếm quầy theo ô mã, chặn mở lại phiên lóc): mô tả PR #73, mục "Còn mở".
