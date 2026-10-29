# Máy chủ đơn của Mini App Zalo

Máy chủ nhỏ nhận đơn mua thịt mang về từ Mini App Zalo và hiện đơn cho quầy soạn khay. Đặt hàng tự động hoàn toàn:
khách chọn khay, trả tiền trong app, đơn hiện ngay trên máy tính bảng ở quầy — không còn gửi tin nhắn vào chat OA.

Máy chủ phải chạy ở Việt Nam: Zalo bắt dữ liệu khách của Mini App phải xử lý và lưu trong nước. Đợt thử chạy trên
laptop ở công ty, khi mở bán chuyển lên máy chủ thuê ở Việt Nam (khoảng 95.000–120.000 đ/tháng chưa VAT).

## Đã làm được (đợt 1, 2a)

- Nhận đơn từ Mini App: máy chủ tự tính tiền theo bảng giá, kiểm giờ nhận theo giờ Việt Nam, bấm gửi hai lần vẫn
  chỉ ra một đơn. Đơn trả trước đợt đầu chỉ nhận tại quán.
- Màn hình đơn cho quầy (đăng nhập bằng mật khẩu quầy, tiếng Việt và tiếng Anh): đơn đã trả tiền → Đang soạn →
  Chờ khách lấy → Khách đã lấy. Hủy đơn đã trả tiền → "Đã hủy, cần hoàn tiền" → người chuyển khoản trả bấm
  "Đã hoàn tiền cho khách".
- Đơn chưa trả tiền quá 30 phút tự hết hạn; quầy không thấy đơn chưa trả tiền.
- Thu tiền qua SePay: mỗi đơn có mã VietQR đúng số tiền, nội dung "BT" + mã đơn. Khách chuyển khoản → SePay báo máy
  chủ → đơn tự sang "Đã trả tiền, chờ soạn". Chuyển thiếu, chuyển dư, chuyển mà không khớp đơn nào: hiện ở mục
  "Tiền về cần xem" trên màn quầy, người xử lý xong bấm "Đã xử lý xong". Máy chủ không giữ tên hay số tài khoản của
  người chuyển.

Chưa có: màn trả tiền trong Mini App (đợt 2b), tin ZNS (đợt 3), máy chủ thuê, sao lưu, đèn trong `/noi-bo` (đợt 4).
Mini App trên Zalo **chưa** gửi đơn lên máy chủ này — vẫn gửi tin vào chat OA cho tới đợt 2b.

## Chạy thử trên laptop

Laptop Windows, macOS hay Linux đều được. Cần **Node.js 24** (bản LTS ở nodejs.org) và Git.

1. Tải repo về (lần đầu): `git clone https://github.com/volekhanh123/beeftown-stock.git`. Lần sau: `git pull`.
2. Mở cửa sổ dòng lệnh trong thư mục `may-chu-don`, cài thư viện:

   ```
   npm ci
   ```

3. Tạo 5 đơn mẫu để xem màn hình quầy (tên "Khách thử 1…5", số 0900 000 001…):

   ```
   npm run don-mau
   ```

4. Chạy máy chủ — thay `matkhau-quay` bằng mật khẩu bạn chọn, ít nhất 8 ký tự:

   Windows (PowerShell):
   ```
   $env:MAT_KHAU_QUAY="matkhau-quay"; $env:KHONG_HTTPS="1"; npm run chay
   ```
   macOS, Linux:
   ```
   MAT_KHAU_QUAY=matkhau-quay KHONG_HTTPS=1 npm run chay
   ```

5. Mở trình duyệt trên chính laptop: http://127.0.0.1:8787/quay → nhập mật khẩu quầy → thấy 4 đơn cần làm (đơn thứ 5
   chưa trả tiền nên không hiện). Bấm "Bắt đầu soạn", "Soạn xong, chờ khách lấy", "Hủy đơn, cần hoàn tiền" để thử.
6. Muốn mở từ máy tính bảng cùng WiFi: thêm `DIA_CHI_NGHE=0.0.0.0` khi chạy (bước 4), rồi trên máy tính bảng mở
   `http://<IP của laptop>:8787/quay`. Chỉ làm trong mạng công ty, vì laptop thử chưa có HTTPS.

Tắt máy chủ: bấm Ctrl + C trong cửa sổ dòng lệnh. Sổ đơn nằm ở `may-chu-don/du-lieu/don.sqlite`, không bao giờ lên
GitHub. Xóa thư mục `du-lieu` là xóa sạch đơn thử.

## Biến môi trường

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `MAT_KHAU_QUAY` | có | Mật khẩu màn hình quầy, ít nhất 8 ký tự. Sai 5 lần trong 10 phút thì khóa 10 phút |
| `CONG` | không | Cổng, mặc định 8787 |
| `DIA_CHI_NGHE` | không | Mặc định `127.0.0.1` (chỉ máy này, sau proxy HTTPS). Thử từ máy tính bảng: `0.0.0.0` |
| `THU_MUC_DU_LIEU` | không | Nơi để sổ đơn, mặc định `./du-lieu` |
| `KHOA_SUC_KHOE` | không | Có thì `/suc-khoe` đòi `?khoa=` |
| `KHONG_HTTPS` | không | `1` khi thử bằng http trong LAN (cookie đăng nhập bỏ cờ Secure). Máy chủ thật không đặt |
| `TIN_PROXY` | không | `1` khi đứng sau proxy HTTPS của mình — lấy IP khách từ mục cuối của `X-Forwarded-For` |
| `NGAN_HANG_BIN` | khi nhận tiền | Mã BIN ngân hàng 6 số. VietinBank: `970415` |
| `TEN_NGAN_HANG` | khi nhận tiền | Tên hiện cho khách, ví dụ `VietinBank` |
| `SO_TAI_KHOAN` | khi nhận tiền | Số tài khoản nhận của Công ty TNHH SLK Group |
| `TEN_TAI_KHOAN` | khi nhận tiền | Tên chủ tài khoản đúng như ngân hàng in, ví dụ `CONG TY TNHH SLK GROUP` |
| `SEPAY_KHOA_KY` | khi nhận tiền | Secret Key HMAC-SHA256 của webhook SePay, ít nhất 16 ký tự. Không gửi qua chat |
| `CHO_TRA_GIA_THU` | không | `1` cho hiện mã trả tiền khi bảng giá còn là giá thử — chỉ để thử chuyển khoản thật số nhỏ |

Bốn biến tài khoản phải đặt đủ cả bốn, hoặc không đặt cái nào (máy chủ vẫn nhận đơn nhưng không có mã trả tiền). Thiếu
một biến, hay khóa SePay dưới 16 ký tự, máy chủ không chạy và báo rõ biến nào sai.

## Đường dẫn

| Đường | Ai gọi | Việc |
|---|---|---|
| `POST /api/don` | Mini App | Gửi đơn. Trả mã đơn và khóa xem; gửi lại cùng mã gửi thì trả đơn cũ |
| `GET /api/don/<mã>?khoa=` | Mini App | Trạng thái đơn, tiền đã nhận, thông tin trả tiền khi còn chờ (không trả tên, số điện thoại) |
| `GET /api/don/<mã>/qr.svg?khoa=` | Mini App | Ảnh mã VietQR cho phần tiền còn thiếu (chỉ khi đơn còn chờ trả tiền) |
| `POST /sepay/tien-ve` | SePay | Tin có tiền về, ký HMAC-SHA256. Trả `{"success": true}` chỉ khi đã ghi xong |
| `GET /quay` | Quầy | Màn hình đơn |
| `GET /suc-khoe` | Đèn sức khỏe (đợt 4) | Số đơn chờ soạn, chờ lâu nhất bao nhiêu phút — không dữ liệu khách |

## Cài SePay (khi đã có tài khoản VietinBank)

Theo tài liệu SePay (developer.sepay.vn, đọc 29/10/2026). SePay chỉ gửi tới địa chỉ **HTTPS công khai** — laptop ở
công ty không nhận được; cần máy chủ thuê ở Việt Nam có tên miền (đợt 4), hoặc thử bằng Test mode của SePay.

1. Đăng ký ở my.sepay.vn, liên kết tài khoản VietinBank **doanh nghiệp** của Công ty TNHH SLK Group.
2. Cấu hình Công ty → Cấu hình chung → **Cấu trúc mã thanh toán**: thêm mẫu tiền tố `BT`, độ dài hậu tố tối thiểu 8,
   tối đa 8, loại ký tự **Số và chữ**. Lưu lại.
3. Webhooks → thêm webhook:
   - URL: `https://<tên miền máy chủ>/sepay/tien-ve`, kiểu nội dung `application/json`.
   - Sự kiện: **Chỉ tiền vào**; tài khoản: VietinBank đó; bật **Chỉ gửi khi có mã thanh toán**, lọc tiền tố `BT`.
   - Bảo mật: **HMAC-SHA256** → tạo Secret Key → chép ngay vào biến `SEPAY_KHOA_KY` trên máy chủ (SePay chỉ hiện đủ
     một lần).
   - Bật **tự động gửi lại khi server trả lỗi** (SePay gửi lại 8 lần trong 33 phút).
4. Đặt 4 biến tài khoản ở bảng trên, chạy lại máy chủ. Dòng khởi động in "Nhận chuyển khoản vào VietinBank …xxxx".
5. Thử, chưa tốn tiền: bật **Test mode** của SePay, tạo một đơn thử (`CHO_TRA_GIA_THU=1`), mô phỏng một giao dịch
   tiền vào với nội dung `BT<mã đơn>` và đúng số tiền của đơn — đơn phải sang "Đã trả tiền, chờ soạn" trên màn quầy.
   Mô phỏng thêm một lần chuyển thiếu: phải hiện ở "Tiền về cần xem". Thử thật sau cùng: chuyển cho một đơn một khay
   (giá thử rẻ nhất 115.000 đ), rồi hủy đơn và hoàn tiền.
6. Tường lửa (khi có máy chủ thuê): chỉ cho các IP của SePay gọi `/sepay/tien-ve` — danh sách ở
   developer.sepay.vn/vi/dia-chi-ip.

## Việc của Khánh trước khi bật cho khách

1. Mở tài khoản VietinBank doanh nghiệp, cài SePay theo mục trên.
2. Hỏi Sang: giá thật của 6 phần (đang là giá thử — máy chủ không hiện mã trả tiền theo giá thử), cách tính phí
   giao hàng.
3. Hỏi luật sư: Mini App có chức năng đặt hàng và thanh toán có phải thông báo Bộ Công Thương không.
