# Máy chủ đơn của Mini App Zalo

Máy chủ nhỏ nhận đơn mua thịt mang về từ Mini App Zalo và hiện đơn cho quầy soạn khay. Đặt hàng tự động hoàn toàn:
khách chọn khay, trả tiền trong app, đơn hiện ngay trên máy tính bảng ở quầy — không còn gửi tin nhắn vào chat OA.

Máy chủ phải chạy ở Việt Nam: Zalo bắt dữ liệu khách của Mini App phải xử lý và lưu trong nước. Đợt thử chạy trên
laptop ở công ty, khi mở bán chuyển lên máy chủ thuê ở Việt Nam (khoảng 95.000–120.000 đ/tháng chưa VAT).

## Đã làm được (đợt 1)

- Nhận đơn từ Mini App: máy chủ tự tính tiền theo bảng giá, kiểm giờ nhận theo giờ Việt Nam, bấm gửi hai lần vẫn
  chỉ ra một đơn. Đơn trả trước đợt đầu chỉ nhận tại quán.
- Màn hình đơn cho quầy (đăng nhập bằng mật khẩu quầy, tiếng Việt và tiếng Anh): đơn đã trả tiền → Đang soạn →
  Chờ khách lấy → Khách đã lấy. Hủy đơn đã trả tiền → "Đã hủy, cần hoàn tiền" → người chuyển khoản trả bấm
  "Đã hoàn tiền cho khách".
- Đơn chưa trả tiền quá 30 phút tự hết hạn; quầy không thấy đơn chưa trả tiền.

Chưa có: trả tiền trong app (đợt 2), tin ZNS (đợt 3), máy chủ thuê, sao lưu, đèn trong `/noi-bo` (đợt 4). Mini App
trên Zalo **chưa** gửi đơn lên máy chủ này — vẫn gửi tin vào chat OA cho tới đợt 2.

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
| `TIN_PROXY` | không | `1` khi đứng sau proxy HTTPS của mình — lấy IP khách từ `X-Forwarded-For` |

## Đường dẫn

| Đường | Ai gọi | Việc |
|---|---|---|
| `POST /api/don` | Mini App | Gửi đơn. Trả mã đơn và khóa xem; gửi lại cùng mã gửi thì trả đơn cũ |
| `GET /api/don/<mã>?khoa=` | Mini App | Trạng thái đơn của khách (không trả tên, số điện thoại) |
| `GET /quay` | Quầy | Màn hình đơn |
| `GET /suc-khoe` | Đèn sức khỏe (đợt 4) | Số đơn chờ soạn, chờ lâu nhất bao nhiêu phút — không dữ liệu khách |

## Việc của Khánh trước đợt 2

1. Mini App Center → Checkout SDK: đăng ký, chọn cách thu tiền (chuyển khoản, ZaloPay…), khai tài khoản nhận tiền
   của Công ty TNHH SLK Group, lấy **khóa bí mật** (Private Key). Không gửi khóa qua chat — đặt thẳng trên máy chủ.
2. Cho phiên Claude vào được `docs.zaloplatforms.com` (cài đặt môi trường → Network access) để đọc cách ký đơn.
3. Hỏi Sang: giá thật của 6 phần (đang là giá thử — máy chủ sẽ không cho trả tiền thật theo giá thử), cách tính phí
   giao hàng.
4. Hỏi luật sư: Mini App có chức năng đặt hàng và thanh toán có phải thông báo Bộ Công Thương không.
