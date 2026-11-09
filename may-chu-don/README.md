# Máy chủ đơn của Mini App Zalo

Máy chủ nhỏ nhận đơn mua thịt mang về từ Mini App Zalo và hiện đơn cho quầy soạn khay. Đặt hàng tự động hoàn toàn:
khách chọn khay, trả tiền trong app, đơn hiện ngay trên máy tính bảng ở quầy — không còn gửi tin nhắn vào chat OA.

Máy chủ phải chạy ở Việt Nam: Zalo bắt dữ liệu khách của Mini App phải xử lý và lưu trong nước. Đợt thử chạy trên
laptop ở công ty, khi mở bán chuyển lên máy chủ thuê ở Việt Nam (khoảng 95.000–120.000 đ/tháng chưa VAT).

## Đã làm được (đợt 1, 2a, 3)

- Nhận đơn từ Mini App: máy chủ tự tính tiền theo bảng giá, kiểm giờ nhận theo giờ Việt Nam, bấm gửi hai lần vẫn
  chỉ ra một đơn. Đơn trả trước chỉ giao tận nơi, giá khay đã gồm phí giao (Khánh 09/11/2026); màn quầy hiện địa
  chỉ giao. Sổ đơn tạo trước ngày đó tự thêm cột địa chỉ khi máy chủ chạy bản mới.
- Màn hình đơn cho quầy (đăng nhập bằng mật khẩu quầy, tiếng Việt và tiếng Anh): đơn đã trả tiền → Đang soạn →
  Soạn xong, chờ giao → Đã giao khách. Hủy đơn đã trả tiền → "Đã hủy, cần hoàn tiền" → người chuyển khoản trả bấm
  "Đã hoàn tiền cho khách".
- Đơn chưa trả tiền quá 30 phút tự hết hạn; quầy không thấy đơn chưa trả tiền.
- Thu tiền qua SePay: mỗi đơn có mã VietQR đúng số tiền, nội dung "BT" + mã đơn. Khách chuyển khoản → SePay báo máy
  chủ → đơn tự sang "Đã trả tiền, chờ soạn". Chuyển thiếu, chuyển dư, gõ sai mã, mang mã đơn mà vào tài khoản khác:
  hiện ở mục "Tiền về cần xem" trên màn quầy, người xử lý xong bấm "Đã xử lý xong". Máy chủ không giữ tên hay số tài
  khoản của người chuyển.

- Mini App (đợt 2b): khi khai địa chỉ máy chủ này (`diaChiMayChuDon` trong `mini-app/src/cau-hinh.ts`), khách gửi
  đơn lên đây và trả tiền ngay trong app — mã QR, chép số tài khoản / số tiền / nội dung, app tự cập nhật khi quán nhận
  đủ tiền. Thử trên laptop: `mini-app/README.md`, "Thử đặt và trả tiền với máy chủ đơn".

- Tin ZNS báo khách (đợt 3): "Beeftown đã nhận đơn" khi đủ tiền, "Khay đã soạn xong" khi quầy bấm "Soạn xong, chờ giao".
  Mỗi đơn mỗi tin đúng một lần; mất mạng thì thử lại, không rõ Zalo đã nhận chưa thì không gửi lại mà màn quầy báo gọi
  khách. Gửi bằng App Zalo riêng của máy chủ đơn — mục "Tin ZNS". Chưa bật: chờ Khánh tạo App, đăng ký hai mẫu tin.

Bộ cài lên máy chủ thuê ở Việt Nam: mục "Đưa lên máy chủ thuê" (đợt 4a).

Chưa có: sao lưu, đèn trong `/noi-bo` (đợt 4). Mini App trên Zalo **chưa** gửi đơn lên máy chủ này:
địa chỉ còn để trống cho tới khi máy chủ chạy HTTPS — khách vẫn gửi tin vào chat OA.

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

## Đưa lên máy chủ thuê

Để Mini App gửi đơn thẳng lên máy chủ (không qua chat OA) và SePay báo được tiền về, máy chủ đơn phải chạy trên một máy
**có địa chỉ HTTPS công khai, đặt ở Việt Nam**. Laptop ở công ty không làm được việc này. Bộ cài trong `cai-dat/` dựng mọi
thứ bằng một lệnh: Node 24, Caddy (tự lấy chứng chỉ HTTPS), dịch vụ tự chạy lại khi hỏng, tường lửa, mật khẩu quầy.

### 1. Thuê máy (một lần)

- Hệ điều hành **Ubuntu 24.04 LTS**, trung tâm dữ liệu **ở Việt Nam** (Hà Nội hoặc TP.HCM — hỏi nhà cung cấp cho chắc).
- 1 vCPU, 1 GB RAM, 20 GB SSD, một IPv4 riêng là đủ (khoảng 95.000–120.000 đ/tháng chưa VAT).
- Nhà cung cấp gửi lại: **địa chỉ IP** và **mật khẩu root** (hoặc tài khoản `ubuntu` có sudo).
- Trang quản lý của nhà cung cấp có tường lửa riêng thì mở cổng 22, 80, 443.

### 1b. Hoặc dùng laptop dư (thử trước khi thuê máy)

Laptop đặt ở Việt Nam thì giữ đúng quy tắc dữ liệu khách. Bộ cài như máy thuê; khác ở bốn chỗ dưới đây. Khi mở bán thật
nên chuyển sang máy thuê: laptop ở nhà có điện, mạng, IP thay đổi, không ai trực.

1. **Cài Ubuntu (xóa sạch Windows).** Chép dữ liệu cần giữ ra trước.
   - Tải **Ubuntu Server 24.04 LTS** ở ubuntu.com/download/server.
   - Ghi ra USB (từ 4 GB) bằng **Rufus** (rufus.ie) trên một máy Windows khác.
   - Cắm USB vào laptop, bật máy, bấm phím chọn ổ khởi động (thường F12, F9 hoặc Esc — tùy hãng), chọn USB.
   - Khi cài:
     - chọn dùng cả ổ đĩa;
     - đặt tên người dùng, ví dụ `beeftown-admin`, và một mật khẩu mạnh;
     - **đánh dấu "Install OpenSSH server"**;
     - không chọn thêm gói nào.
   - Cắm dây mạng LAN thì ổn định hơn WiFi.
2. **Giữ laptop luôn bật.**
   - Cắm sạc.
   - Bộ cài tự nhận ra laptop: gập máy không ngủ, tắt chế độ ngủ.
   - Nếu BIOS có mục "Power on after AC loss" / "AC Recovery" thì bật, để mất điện có lại tự khởi động.
3. **Kiểm nhà mạng có cấp IP công khai không.**
   - Đăng nhập trang quản lý router (thường `192.168.1.1`, mật khẩu dán dưới đáy router), xem **địa chỉ WAN**.
   - Trên laptop sau khi cài, chạy `curl -4 https://api.ipify.org`.
   - Hai số **trùng nhau** là được.
   - Khác nhau, hoặc WAN bắt đầu bằng `100.64`–`100.127`, `10.` hay `172.16`–`172.31`, là nhà mạng dùng IP chung (CGNAT): từ ngoài không vào được laptop. Gọi tổng đài (FPT, Viettel, VNPT) xin **"IP public"** (thường miễn phí hoặc thu thêm), hoặc thuê máy.
4. **Mở cổng trên router.** Mục **NAT / Port Forwarding / Virtual Server**:
   - chuyển cổng **80 TCP** và **443 TCP** (thêm 443 UDP nếu có) về IP trong mạng nhà của laptop (`ip -4 addr` trên laptop, dạng `192.168.1.x`);
   - ở mục DHCP, **giữ cố định IP đó cho laptop** (DHCP reservation / static lease), kẻo khởi động lại là đổi.
   - Router có mạng khách (guest) mà đặt được laptop vào thì tốt hơn: laptop mở ra internet, đừng để nó chung mạng với máy cá nhân.

IP nhà mạng của gói gia đình có thể đổi (sau khi mất điện, khởi động lại modem). Đổi thì `don.beeftown.vn` trỏ sai và
Mini App không gửi được đơn. Trong lúc thử: thấy `https://don.beeftown.vn/quay` không mở được thì chạy lại
`curl -4 https://api.ipify.org` trên laptop và sửa IP ở bản ghi Cloudflare (bước 2).

Rồi làm tiếp bước 2–7 như máy thuê. Đăng nhập laptop từ máy khác trong nhà bằng `ssh beeftown-admin@192.168.1.x`, hoặc
gõ thẳng trên laptop. Tài khoản này không phải root, nên lệnh ở bước 3 thêm `sudo` trước `bash`.

### 2. Trỏ tên miền về máy (một lần, trước bước 3)

Ở Cloudflare → `beeftown.vn` → **DNS** → **Records** → **Add record**:

| Ô | Điền |
|---|---|
| Type | `A` |
| Name | `don` (thành `don.beeftown.vn`) |
| IPv4 address | IP của máy thuê |
| Proxy status | **tắt — DNS only (đám mây xám)**. Đám mây cam là đơn của khách đi qua máy chủ Cloudflare |
| TTL | Auto |

### 3. Cài (một lần, khoảng 5 phút)

Trên máy Windows mở PowerShell, đăng nhập vào máy thuê (lần đầu gõ `yes`, rồi mật khẩu root):

```
ssh root@<IP của máy thuê>
```

Trong cửa sổ đó, chạy hai lệnh (đăng nhập bằng `ubuntu` thì thêm `sudo` trước `bash`):

```
curl -fsSLo may-chu.sh https://raw.githubusercontent.com/volekhanh123/beeftown-stock/main/may-chu-don/cai-dat/may-chu.sh
bash may-chu.sh cai don.beeftown.vn
```

Lệnh chạy cả kiểm thử của máy chủ đơn ngay trên máy thuê; hỏng thì dừng, không bật máy chủ. Xong thì in
**MẬT KHẨU MÀN HÌNH QUẦY** — ghi lại ngay, chỉ in một lần. Chạy lại `cai` không mất gì: không đổi mật khẩu, không xóa đơn.

### 4. Kiểm

- Trên điện thoại mở `https://don.beeftown.vn/quay`: thấy trang đăng nhập quầy, có ổ khóa HTTPS. Chưa được thì đợi
  5 phút (tên miền mới cần thời gian), rồi trên máy thuê chạy
  `bash /opt/beeftown/hien-tai/may-chu-don/cai-dat/may-chu.sh trang-thai`.
- Máy tính bảng ở quầy: mở cùng địa chỉ, đăng nhập bằng mật khẩu quầy, thêm vào màn hình chính.

### 5. Cập nhật khi main có bản mới

```
bash /opt/beeftown/hien-tai/may-chu-don/cai-dat/may-chu.sh cap-nhat
```

Lấy bản mới của main vào một thư mục riêng, cài thư viện và chạy kiểm thử ở đó; đạt mới chuyển máy chủ sang (ngừng vài
giây). Hỏng ở bước nào thì bản đang chạy vẫn chạy, không bị đụng tới; bản mới không trả lời thì tự quay về bản cũ. **Đổi giá** ở Mini App (`mini-app/src/san-pham.ts`) thì phải cập nhật máy chủ: máy chủ tự
tính tiền theo bảng giá của nó.

### 6. Khi đã có tài khoản VietinBank và SePay

Trên máy thuê: `nano /etc/beeftown/may-chu-don.env`, bỏ dấu `#` ở bốn dòng tài khoản và dòng `SEPAY_KHOA_KY`, điền giá
trị, lưu (Ctrl + O, Enter, Ctrl + X), rồi `systemctl restart may-chu-don`. Webhook SePay (mục "Cài SePay"):
`https://don.beeftown.vn/sepay/tien-ve`. Caddy chỉ cho các IP của SePay gọi đường này; IP khác nhận 403.
SePay mà đổi IP thì tin tiền về bị 403 âm thầm: đơn khách đã chuyển khoản vẫn tự hết hạn. Mỗi tuần (tới khi có đèn
sức khỏe và đối soát SePay, issue #138) xem my.sepay.vn → Webhooks → nhật ký gửi: có lần 403 là SePay đã thêm IP —
báo Claude Code sửa danh sách trong `cai-dat/Caddyfile.mau`.

### 6b. Khi hai mẫu tin ZNS đã được duyệt

Làm mục "Tin ZNS" bên dưới tới bước 3 (App riêng, hai mẫu, refresh token đầu tiên). Rồi trên máy thuê:
`nano /etc/beeftown/may-chu-don.env`, bỏ dấu `#` năm dòng `ZALO_APP_ID`, `ZALO_SECRET_KEY`, `ZALO_KHOA`, `ZNS_MAU_DA_NHAN`,
`ZNS_MAU_SOAN_XONG` (dòng `ZALO_KHOA` đã có sẵn khóa ngẫu nhiên — giữ nguyên), điền bốn dòng còn lại giữa hai dấu ngoặc kép, lưu,
`systemctl restart may-chu-don`, rồi `bash may-chu.sh zalo-token` và dán refresh token. Lệnh in vài dòng nhật ký: phải
có "Tin ZNS: đã làm mới token".

### 7. Mini App dùng máy chủ

Sau khi PR màn trả tiền (đợt 2b) gộp: điền `diaChiMayChuDon: 'https://don.beeftown.vn'` trong
`mini-app/src/cau-hinh.ts`; ở Mini App Center → **Cấu hình API Domains** thêm `https://don.beeftown.vn`; đưa bản thử lên.

### Trên máy thuê có gì

| Chỗ | Là gì |
|---|---|
| `/opt/beeftown/hien-tai` | Liên kết tới bản mã đang chạy, trong `/opt/beeftown/ban/<commit>` (giữ 3 bản gần nhất). Đừng sửa ở đây |
| `/opt/beeftown/kho` | Bản tải của repo, chỉ để lấy mã — dịch vụ không chạy từ đây |
| `/opt/beeftown/nha` | Thư mục nhà của người dùng `beeftown` (bộ đệm thư viện). Mã và cấu hình thuộc root: `beeftown` không sửa được |
| `/var/lib/beeftown-may-chu-don/don.sqlite` | Sổ đơn — có tên, số điện thoại khách. Không chép ra khỏi máy |
| `/etc/beeftown/may-chu-don.env` | Bí mật: mật khẩu quầy, khóa sức khỏe, tài khoản, khóa SePay, App Zalo của tin ZNS (từ `cai-dat/may-chu-don.env.mau`) |
| `/etc/caddy/Caddyfile` | HTTPS và chặn IP (từ `cai-dat/Caddyfile.mau` — sửa bản trong repo, rồi `cap-nhat`) |
| dịch vụ `may-chu-don` | `systemctl status may-chu-don`, nhật ký: `journalctl -u may-chu-don -n 50` |

Chưa có (đợt 4, issue #138): sao lưu sổ đơn ra ngoài máy, đèn sức khỏe trong `/noi-bo`, xóa dữ liệu khách quá hạn,
đối soát SePay bằng API.

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
| `ZALO_APP_ID` | khi gửi tin ZNS | App ID của App Zalo **riêng** của máy chủ đơn (không phải App của website) |
| `ZALO_SECRET_KEY` | khi gửi tin ZNS | Secret Key của App đó (developers.zalo.me → App → Cài đặt). Không gửi qua chat |
| `ZALO_KHOA` | khi gửi tin ZNS | Khóa mã hóa token Zalo trong sổ đơn, ít nhất 32 ký tự. Bộ cài điền sẵn. Đổi khóa = dán lại refresh token |
| `ZNS_MAU_DA_NHAN` | khi gửi tin ZNS | Mã mẫu (chữ số) của mẫu "Beeftown đã nhận đơn" đã được Zalo duyệt |
| `ZNS_MAU_SOAN_XONG` | khi gửi tin ZNS | Mã mẫu của mẫu "Khay đã soạn xong" |
| `ZNS_CHE_DO` | không | `thu` (mặc định: chỉ quản trị viên OA nhận, khách thật không nhận gì) hoặc `that` |

Bốn biến tài khoản phải đặt đủ cả bốn, hoặc không đặt cái nào (máy chủ vẫn nhận đơn nhưng không có mã trả tiền). Thiếu
một biến, khóa SePay dưới 16 ký tự, hay có khóa SePay mà chưa có tài khoản: máy chủ không chạy và báo rõ biến nào sai.
Năm biến tin ZNS cũng vậy: đủ cả năm (bật gửi tin), hoặc không cái nào (khách chỉ thấy trạng thái đơn trong app).

## Đường dẫn

| Đường | Ai gọi | Việc |
|---|---|---|
| `POST /api/don` | Mini App | Gửi đơn. Trả mã đơn và khóa xem; gửi lại cùng mã gửi thì trả đơn cũ |
| `GET /api/don/<mã>?khoa=` | Mini App | Trạng thái đơn, tiền đã nhận, thông tin trả tiền khi còn chờ (không trả tên, số điện thoại) |
| `GET /api/don/<mã>/qr.svg?khoa=` | Mini App | Ảnh mã VietQR cho phần tiền còn thiếu (chỉ khi đơn còn chờ trả tiền) |
| `POST /sepay/tien-ve` | SePay | Tin có tiền về, ký HMAC-SHA256. Trả `{"success": true}` chỉ khi đã ghi xong |
| `GET /quay` | Quầy | Màn hình đơn |
| `GET /suc-khoe` | Đèn sức khỏe (đợt 4) | Số đơn chờ soạn, chờ lâu nhất bao nhiêu phút; tin ZNS: có bật không, số tin chờ, số tin không tới khách trong 24 giờ, token Zalo (có / chưa có / bị từ chối) — không dữ liệu khách |

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
6. Tường lửa: trên máy chủ thuê, Caddy chỉ cho các IP của SePay gọi `/sepay/tien-ve` (`cai-dat/Caddyfile.mau`,
   danh sách developer.sepay.vn/vi/dia-chi-ip đọc 02/11/2026). SePay đổi IP thì sửa file đó và
   `crm/test/test-may-chu-don-cai-dat.mjs` cùng một PR, rồi `cap-nhat`.

## Tin ZNS

Máy chủ đơn gửi hai tin ZNS cho mỗi đơn trả trước, tới số điện thoại khách ghi:

| Khi nào | Mẫu | Biến mã mẫu |
|---|---|---|
| SePay báo đủ tiền (đơn sang "Đã trả tiền, chờ soạn") | "Beeftown đã nhận đơn" | `ZNS_MAU_DA_NHAN` |
| Quầy bấm "Soạn xong, chờ giao" | "Khay đã soạn xong" | `ZNS_MAU_SOAN_XONG` |

Đơn mẫu (`npm run don-mau`) và đơn nhận tại quán cũ trên sổ thử không bao giờ có tin.

**Vì sao App Zalo riêng.** Website đã gửi tin Zalo bằng App Zalo của nó (`web/README.md`, mục "Zalo"), làm mới token 5
phút một lần. Refresh token của Zalo chỉ dùng **một lần**: máy chủ đơn mà làm mới cùng App đó thì token của website chết
(hoặc ngược lại). Nên máy chủ đơn có App riêng, cùng OA Beeftown. Tin gửi từ máy chủ đơn ở Việt Nam, không qua website:
tin cần số điện thoại khách Mini App, mà dữ liệu đó phải xử lý ở Việt Nam.

> **Giả định, chưa đối chiếu tài liệu chính thức của Zalo (09/11/2026):** mẫu ZNS gắn với cặp OA + App (hướng dẫn của
> các nhà cung cấp ZNS ghi "chọn OA và App" khi tạo mẫu) — mẫu tạo dưới App của website thì App của máy chủ đơn không
> gửi được. Địa chỉ, tên trường, bảng mã lỗi dùng chung với website (`web/src/lib/zalo.ts`, đã đối chiếu 23/10/2026).
> Tham số `tong_tien` gửi dạng số (`600000`), giả định khai kiểu "Tiền tệ" để Zalo tự định dạng; `gio_nhan` gửi dạng
> chữ `10:30 13/11/2026`. Zalo báo sai dạng (mã -1123, -1124…) thì báo Claude Code sửa `src/zns.ts` (`duLieuTin`).

### Các bước của Khánh (một lần)

1. **App riêng.** developers.zalo.me → Tạo ứng dụng mới, tên ví dụ "Beeftown Máy chủ đơn". Liên kết với OA Beeftown;
   ở mục Official Account → cấp quyền: đặt *Callback URL* `https://beeftown.vn/`, bật quyền gửi tin ZBS / ZNS. Chép
   **App ID** và **Secret Key** (Secret Key không gửi qua chat).
2. **Hai mẫu tin.** Zalo Cloud Account (account.zalo.cloud) → tạo mẫu tin ZBS, loại giao dịch / cập nhật đơn hàng,
   chọn OA Beeftown và **App vừa tạo ở bước 1**. Tên tham số phải đúng y như dưới đây (trong dấu `< >`). Chờ Zalo
   duyệt, chép **mã mẫu** (dãy số) của từng mẫu.

   **Mẫu "Beeftown đã nhận đơn"** (`ZNS_MAU_DA_NHAN`)
   - Tiêu đề: `Beeftown đã nhận đơn của bạn`
   - Nội dung: `Chào <ten_khach>, Beeftown đã nhận đủ tiền cho đơn #<so_don>. Quầy đang soạn khay để giao theo giờ bạn muốn nhận.`
   - Bảng: `Mã đơn` — `<ma_don>`; `Giờ muốn nhận` — `<gio_nhan>`; `Tổng tiền` — `<tong_tien>`
   - Tham số: `ten_khach` tên khách (tối đa 30 ký tự), `so_don` số đơn trong ngày, `ma_don` mã đơn 8 ký tự,
     `gio_nhan` thời gian (chữ, ví dụ `10:30 13/11/2026`), `tong_tien` tiền tệ (số, ví dụ `600000`)

   **Mẫu "Khay đã soạn xong"** (`ZNS_MAU_SOAN_XONG`)
   - Tiêu đề: `Khay của bạn đã soạn xong`
   - Nội dung: `Chào <ten_khach>, khay của đơn #<so_don> đã soạn xong, chờ giao.`
   - Bảng: `Mã đơn` — `<ma_don>`; `Giờ muốn nhận` — `<gio_nhan>`
   - Tham số: `ten_khach`, `so_don`, `ma_don`, `gio_nhan` như trên

   Câu chữ khớp với chữ màn Trả tiền của Mini App. Zalo đòi sửa câu thì sửa câu, giữ nguyên tên tham số.
3. **Refresh token đầu tiên** của App mới — như `web/README.md`, "Lấy refresh token đầu tiên", nhưng dùng App ID và
   Secret Key **của App mới**: chủ OA mở
   `https://oauth.zaloapp.com/v4/oa/permission?app_id=<APP_ID mới>&redirect_uri=https://beeftown.vn/` → Cho phép → chép
   `code` trên thanh địa chỉ → đổi lấy token:
   ```bash
   curl -s -X POST https://oauth.zaloapp.com/v4/oa/access_token \
     -H "secret_key: <SECRET_KEY của App mới>" \
     -d app_id=<APP_ID mới> -d grant_type=authorization_code -d code=<code>
   ```
   Kết quả có `refresh_token`. Đừng dán nó vào màn Cài đặt Zalo của website (đó là App khác).
4. **Bật trên máy chủ.** Máy thuê: mục 6b ở trên. Laptop thử: thêm năm biến khi chạy máy chủ (PowerShell:
   `$env:ZALO_APP_ID="<App ID>"; $env:ZALO_SECRET_KEY="<Secret Key>"; $env:ZALO_KHOA="<32 ký tự trở lên, tự đặt>"; $env:ZNS_MAU_DA_NHAN="<mã mẫu>"; $env:ZNS_MAU_SOAN_XONG="<mã mẫu>"`),
   rồi ở cửa sổ khác, cùng `ZALO_KHOA` và cùng thư mục sổ đơn: `npm run dat-token-zalo` và dán refresh token.
   Dòng khởi động in "Tin ZNS: bật, chế độ thử"; vài giây sau: "Tin ZNS: đã làm mới token".
5. **Thử (chưa tốn tiền).** Chế độ thử (mặc định): Zalo chỉ giao tin cho quản trị viên của OA / App. Đặt một đơn bằng
   **số điện thoại của một quản trị viên OA**, trả đủ tiền (SePay Test mode) → nhận tin "Beeftown đã nhận đơn"; quầy
   bấm "Bắt đầu soạn", "Soạn xong, chờ giao" → nhận tin thứ hai. Ổn rồi mới đặt `ZNS_CHE_DO=that` và chạy lại máy chủ.
   Tin ZNS tính phí từng tin vào ví ZBS của OA; mỗi đơn hai tin.

### Khi tin không tới khách

- Thẻ đơn trên màn quầy hiện "! Tin Zalo báo đơn chưa chắc tới được khách … Gọi khách nếu cần báo đơn." khi Zalo từ
  chối (số không dùng Zalo, mẫu sai) hoặc khi không rõ Zalo đã nhận chưa (hết 15 giây chờ, đứt kết nối giữa chừng,
  máy chủ tắt giữa lúc gửi). Trường hợp không rõ thì **không gửi lại**: khách có thể đã nhận, gửi lại là nhận hai lần.
- Mất mạng trước khi tin ra khỏi máy: thử lại 5 phút một lần, tối đa 5 lần. Loại tin Zalo không cho gửi ban đêm
  (22:00–07:00): gửi lúc 07:00. Tin chỉ đi khi còn đúng: đơn đã hủy, hay đã quá giờ khách muốn nhận một giờ, thì bỏ.
- Nhật ký: `journalctl -u may-chu-don | grep "Tin ZNS"` — không có số điện thoại, tên khách, token.
- "Zalo từ chối refresh token": máy chủ ngừng gửi (không có lần thử nào tốn tiền). Lấy refresh token mới (bước 3) và
  chạy lại lệnh đặt token. Refresh token sống khoảng 3 tháng và được gia hạn mỗi lần làm mới (mỗi ngày một lần khi máy
  chủ chạy); máy chủ tắt quá 3 tháng thì phải lấy lại.

## Việc của Khánh trước khi bật cho khách

1. Mở tài khoản VietinBank doanh nghiệp, cài SePay theo mục trên.
2. Tạo App Zalo riêng cho máy chủ đơn, đăng ký hai mẫu tin ZNS, lấy refresh token (mục "Tin ZNS").
3. Hỏi Sang: giá thật của 6 phần (đang là giá thử — máy chủ không hiện mã trả tiền theo giá thử), cách tính phí
   giao hàng.
4. Hỏi luật sư: Mini App có chức năng đặt hàng và thanh toán có phải thông báo Bộ Công Thương không.
