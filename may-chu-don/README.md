# Máy chủ đơn của Mini App Zalo

Máy chủ nhỏ nhận đơn mua thịt mang về từ Mini App Zalo và hiện đơn cho quầy soạn khay. Đặt hàng tự động hoàn toàn:
khách chọn khay, trả tiền trong app, đơn hiện ngay trên máy tính bảng ở quầy — không còn gửi tin nhắn vào chat OA.

Máy chủ phải chạy ở Việt Nam: Zalo bắt dữ liệu khách của Mini App phải xử lý và lưu trong nước. Đợt thử chạy trên
laptop ở công ty, khi mở bán chuyển lên máy chủ thuê ở Việt Nam (khoảng 95.000–120.000 đ/tháng chưa VAT).

## Đã làm được (đợt 1, 2a, 2b, 3, VNPay 1)

- Nhận đơn từ Mini App: máy chủ tự tính tiền theo bảng giá, kiểm giờ nhận theo giờ Việt Nam, bấm gửi hai lần vẫn
  chỉ ra một đơn. Đơn trả trước chỉ giao tận nơi, giá khay đã gồm phí giao (Khánh 09/11/2026); màn quầy hiện địa
  chỉ giao. Sổ đơn tạo trước ngày đó tự thêm cột địa chỉ khi máy chủ chạy bản mới.
- Màn hình đơn cho quầy (đăng nhập bằng mật khẩu quầy, tiếng Việt và tiếng Anh): đơn đã trả tiền → Đang soạn →
  Chờ khách lấy → Khách đã lấy. Hủy đơn đã trả tiền → "Đã hủy, cần hoàn tiền" → người chuyển khoản trả bấm
  "Đã hoàn tiền cho khách".
- Đơn chưa trả tiền quá 30 phút tự hết hạn; quầy không thấy đơn chưa trả tiền.
- Thu tiền qua SePay: mỗi đơn có mã VietQR đúng số tiền, nội dung "BT" + mã đơn. Khách chuyển khoản → SePay báo máy
  chủ → đơn tự sang "Đã trả tiền, chờ soạn". Chuyển thiếu, chuyển dư, gõ sai mã, mang mã đơn mà vào tài khoản khác:
  hiện ở mục "Tiền về cần xem" trên màn quầy, người xử lý xong bấm "Đã xử lý xong". Máy chủ không giữ tên hay số tài
  khoản của người chuyển.

- Mini App (đợt 2b): khi khai địa chỉ máy chủ này (`diaChiMayChuDon` trong `mini-app/src/cau-hinh.ts`), khách gửi
  đơn lên đây và trả tiền ngay trong app — mã QR, chép số tài khoản / số tiền / nội dung, app tự cập nhật khi quán nhận
  đủ tiền. Thử trên laptop: `mini-app/README.md`, "Thử đặt và trả tiền với máy chủ đơn".
- Trả qua VNPay (Khánh 11/11/2026, mục "Cài VNPay qua Checkout SDK"): Zalo bắt Mini App có thanh toán phải dùng
  Checkout SDK, nên VNPay nối qua Zalo. Khách bấm "Trả … qua VNPay", Zalo mở trang VNPay; trả xong, Zalo báo máy chủ
  (có chữ ký), đơn tự sang "Đã trả tiền, chờ soạn". Khách trả hai lần, hay tiền không ra đơn nào: hiện ở "Tiền về cần
  xem". Môi trường thử (sandbox): màn quầy có dòng cảnh báo, đơn trả bằng tiền thử mang nhãn "Tiền thử VNPay". Có
  cấu hình VNPay thì app không hiện mã VietQR nữa.
- Tin Zalo (ZNS, đợt 3): tiền về đủ → khách nhận tin "Beeftown đã nhận đơn"; quầy bấm "Soạn xong, chờ giao" → khách
  nhận tin "đang giao". Mỗi đơn mỗi tin đúng một lần; mất mạng thì máy chủ tự gửi lại. Chỉ chạy khi đã cài ZNS (mục
  "Cài ZNS"); chưa cài thì máy chủ vẫn chạy như cũ.

Bộ cài lên máy chủ thuê ở Việt Nam: mục "Đưa lên máy chủ thuê" (đợt 4a).

Đang chạy từ 09/11/2026 trên máy chủ BizFly Cloud ở TP.HCM (Basic, 1 vCPU, 1 GB RAM, 20 GB, 134.000 đ/tháng gồm sao
lưu ổ đĩa của BizFly), địa chỉ `https://don.beeftown.vn`. Mini App điền địa chỉ này từ cùng ngày; bản trên Zalo gửi đơn
lên đây từ lần đưa bản thử kế tiếp. Chưa cài VNPay (hay VietinBank và SePay) thì khách chưa trả tiền được trong app:
app ghi đơn, báo "Quán chưa mở trả tiền trong app" và mời khách chat với quán. 11/11/2026 VNPay đã cấp mã môi trường
thử (TEST): cài theo mục "Cài VNPay qua Checkout SDK".

Chưa có: sao lưu sổ đơn ra ngoài máy, đèn trong `/noi-bo` (đợt 4).

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
- 1 vCPU, 1 GB RAM, 20 GB, một IPv4 riêng là đủ. Khánh thuê 09/11/2026: BizFly Cloud, vùng Hồ Chí Minh, Billing plan
  **Subscription** (không chọn Spot Instance: máy có thể bị tắt), loại **Basic**, 1 vCPU / 1 GB / 20 GB, Ubuntu,
  bật Backup schedule — 134.000 đ/tháng. SSH key để trống: BizFly gửi mật khẩu root vào email.
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

### 7. Mini App dùng máy chủ

`diaChiMayChuDon: "https://don.beeftown.vn"` trong `mini-app/src/cau-hinh.ts` (điền 09/11/2026). Ở Mini App Center →
**Cấu hình API Domains** thêm `https://don.beeftown.vn`, rồi đưa bản thử lên (`mini-app/dua-len-zalo.cmd`). Thiếu bước
khai tên miền thì Zalo chặn và khách không gửi được đơn.

### Trên máy thuê có gì

| Chỗ | Là gì |
|---|---|
| `/opt/beeftown/hien-tai` | Liên kết tới bản mã đang chạy, trong `/opt/beeftown/ban/<commit>` (giữ 3 bản gần nhất). Đừng sửa ở đây |
| `/opt/beeftown/kho` | Bản tải của repo, chỉ để lấy mã — dịch vụ không chạy từ đây |
| `/opt/beeftown/nha` | Thư mục nhà của người dùng `beeftown` (bộ đệm thư viện). Mã và cấu hình thuộc root: `beeftown` không sửa được |
| `/var/lib/beeftown-may-chu-don/don.sqlite` | Sổ đơn — có tên, số điện thoại khách. Không chép ra khỏi máy |
| `/etc/beeftown/may-chu-don.env` | Bí mật: mật khẩu quầy, khóa sức khỏe, tài khoản, khóa SePay (từ `cai-dat/may-chu-don.env.mau`) |
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
| `CHE_DO_DEMO` | không | `1` bật chế độ demo (mục "Chế độ demo"): mã QR dùng tài khoản giả, quầy có nút giả lập tiền về. Không chạy cùng tài khoản nhận thật hay `SEPAY_KHOA_KY` |
| `ZALO_APP_ID` | khi gửi ZNS | App ID của App Zalo **riêng** cho máy chủ đơn (mục "Cài ZNS") |
| `ZALO_SECRET_KEY` | khi gửi ZNS | Secret key của App đó. Không gửi qua chat |
| `ZNS_MAU_DA_NHAN` | khi gửi ZNS | Mã mẫu (template ID) tin "Beeftown đã nhận đơn", Zalo đã duyệt |
| `ZNS_MAU_DANG_GIAO` | khi gửi ZNS | Mã mẫu tin "đang giao", Zalo đã duyệt |
| `ZALO_CHE_DO` | không | `thu` (mặc định: chỉ quản trị viên của OA nhận tin, không tính phí) hoặc `that` |
| `ZALO_REFRESH_TOKEN_MOI` | lần đầu | Refresh token Zalo. Máy chủ dùng một lần, lưu mã hóa, tự làm mới; dán lại khi nhật ký báo token bị từ chối |
| `ZALO_MINI_APP_ID` | khi trả qua VNPay | Mini App ID của Beeftown: `2858300068641327950` |
| `ZALO_CHECKOUT_KHOA_RIENG` | khi trả qua VNPay | **Private key** của Checkout SDK (Mini App Center → Checkout SDK → Cấu hình chung), ít nhất 16 ký tự. Không phải Secret Key của VNPay. Không gửi qua chat |
| `ZALO_CHECKOUT_PHUONG_THUC` | khi trả qua VNPay | `VNPAY_SANDBOX` (môi trường thử, tiền thử) hoặc `VNPAY` (tiền thật) |

Bốn biến tài khoản phải đặt đủ cả bốn, hoặc không đặt cái nào (máy chủ vẫn nhận đơn nhưng không có mã trả tiền). Thiếu
một biến, khóa SePay dưới 16 ký tự, hay có khóa SePay mà chưa có tài khoản: máy chủ không chạy và báo rõ biến nào sai.
Bốn biến ZNS đầu cũng vậy: đủ cả bốn, hoặc không cái nào (không gửi tin Zalo). Ba biến VNPay cũng vậy; có ba biến
VNPay thì app trả qua VNPay (thắng VietQR); `CHE_DO_DEMO=1` cùng ba biến VNPay thì máy chủ không chạy.

## Đường dẫn

| Đường | Ai gọi | Việc |
|---|---|---|
| `POST /api/don` | Mini App | Gửi đơn. Trả mã đơn và khóa xem; gửi lại cùng mã gửi thì trả đơn cũ |
| `GET /api/don/<mã>?khoa=` | Mini App | Trạng thái đơn, tiền đã nhận, thông tin trả tiền khi còn chờ (không trả tên, số điện thoại) |
| `GET /api/don/<mã>/qr.svg?khoa=` | Mini App | Ảnh mã VietQR cho phần tiền còn thiếu (chỉ khi đơn còn chờ trả tiền) |
| `POST /api/don/<mã>/vnpay` | Mini App | Báo vừa mở trang VNPay (mã thanh toán của Zalo) — chỉ để biết đơn nào chờ Zalo báo kết quả quá lâu |
| `POST /sepay/tien-ve` | SePay | Tin có tiền về, ký HMAC-SHA256. Trả `{"success": true}` chỉ khi đã ghi xong |
| `POST /zalo/thanh-toan` | Checkout SDK của Zalo (Callback URL) | Kết quả VNPay, ký `mac` và `overallMac` bằng Private key. Trả `{"returnCode": 1}` chỉ khi đã ghi xong, `2` khi đã ghi từ trước. Caddy chỉ cho IP của Zalo |
| `POST /zalo/vnpay-ipn` | Checkout SDK của Zalo (sandbox) | Zalo chuyển tiếp IPN của VNPay để làm hồ sơ kiểm thử — chỉ ghi nhật ký, không đổi đơn |
| `GET /quay` | Quầy | Màn hình đơn |
| `POST /quay/demo/tien-ve` | Quầy, chỉ khi `CHE_DO_DEMO=1` | Giả lập khách chuyển đủ tiền cho một đơn chờ trả tiền (mục "Chế độ demo"); tắt demo thì 404 |
| `GET /suc-khoe` | Đèn sức khỏe (đợt 4) | Số đơn chờ soạn, chờ lâu nhất bao nhiêu phút, tin ZNS chờ / hỏng, trạng thái token Zalo; VNPay: phương thức, lần trả cuối, số lần thất bại 24 giờ, số đơn mở trang VNPay quá 20 phút chưa có kết quả, số tin Zalo bị từ chối — không dữ liệu khách |

## Chế độ demo (thử trọn luồng khi chưa có tài khoản ngân hàng)

Khánh 09/11/2026: thử từ lúc khách đặt tới lúc giao trên Mini App và màn quầy thật, khi chưa có tài khoản VietinBank và
SePay. Bật `CHE_DO_DEMO=1` thì:

- Mini App hiện mã QR như thật nhưng theo **tài khoản giả** (số toàn 0, tên "BEEFTOWN DEMO - DUNG CHUYEN KHOAN"), kèm
  dòng "Bản demo: đừng chuyển khoản". Mã hiện cả khi bảng giá còn là giá thử.
- Màn quầy có dòng cảnh báo đầu trang và mục **"Đơn chờ khách chuyển khoản (demo)"**. Bấm **"Giả lập khách đã chuyển
  khoản"** thì máy chủ ghi một lần tiền về giả (mã tham chiếu `DEMO`) đi đúng đường của tiền SePay thật: đơn sang "Đã
  trả tiền, chờ soạn", Mini App của khách tự chuyển sang "Quán đã nhận đủ tiền", tin ZNS "đã nhận đơn" được xếp (đã cài
  ZNS ở chế độ thử thì quản trị viên OA nhận). Bấm đúp vẫn chỉ một lần. Đơn có tiền giả mang nhãn "Tiền giả lập (demo)".
- Máy chủ **không chạy** nếu file bí mật có cả `CHE_DO_DEMO=1` lẫn bốn dòng tài khoản thật hay `SEPAY_KHOA_KY` — không
  bao giờ lẫn tiền giả với tiền thật.

Bật trên máy BizFly (sau khi PR có chế độ demo đã gộp):

```
bash /opt/beeftown/hien-tai/may-chu-don/cai-dat/may-chu.sh cap-nhat
nano /etc/beeftown/may-chu-don.env      # thêm một dòng: CHE_DO_DEMO=1 — lưu: Ctrl + O, Enter, Ctrl + X
systemctl restart may-chu-don
journalctl -u may-chu-don -n 5          # thấy dòng "CHẾ ĐỘ DEMO" là đã bật
```

Thử: đặt một đơn trên Mini App bản thử → màn trả tiền có dòng "Bản demo" → trên máy tính bảng mở
`https://don.beeftown.vn/quay`, bấm "Giả lập khách đã chuyển khoản" → Mini App đổi sang "Quán đã nhận đủ tiền" →
ở quầy bấm "Bắt đầu soạn", "Soạn xong, chờ giao", "Đã giao".

**Tắt trước khi mở bán:** xóa dòng `CHE_DO_DEMO=1` (hoặc thêm `#` ở đầu), `systemctl restart may-chu-don`. Đơn demo
còn trong sổ: ở màn quầy bấm cho xong ("Đã giao") hoặc "Hủy đơn, cần hoàn tiền" rồi "Đã hoàn tiền cho khách" (tiền giả,
không phải hoàn gì) — để khi mở bán, mục "Còn phải làm" chỉ còn đơn thật.

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

## Cài VNPay qua Checkout SDK (Khánh 11/11/2026)

**Vì sao qua Zalo:** tài liệu Checkout SDK (docs.zaloplatforms.com/docs/MA/checkoutSdk/intro, đọc 11/11/2026) ghi
Zalo "yêu cầu tất cả các đối tác … có tính năng thanh toán phải tích hợp Checkout SDK", và Checkout SDK đã nối sẵn
VNPay. Quán nhập mã VNPay ở trang quản lý Mini App; VNPay báo kết quả cho Zalo; Zalo báo máy chủ đơn. Máy chủ đơn chỉ
giữ **Private key của Checkout SDK** — không giữ Secret Key của VNPay.

**Hai mã VNPay, hai kênh.** Mỗi mã (Terminal) VNPay chỉ gửi kết quả về được một địa chỉ IPN:
- `SLKGTE22` (email có tệp khóa `VNPAY-QR_PGW_SLKGTE22_TEST_Key.zip`): dùng cho **Mini App**, IPN về Zalo.
- `SLKGTE11` (email ghi website `https://beeftown.vn`): để cho **website**, chưa dùng (website hiện không thu tiền).
Chưa chắc VNPay cấp `SLKGTE22` cho ứng dụng nào: hỏi lại VNPay (kythuatctt@vnpay.vn) khi gửi địa chỉ IPN ở bước 3.

Thứ tự (sai thứ tự thì khách thấy "Đang lấy mã trả tiền…" mãi):

1. **Gộp PR, cập nhật máy chủ, đưa Mini App bản thử mới lên** (bản mới đọc được thông tin VNPay):
   ```
   bash /opt/beeftown/hien-tai/may-chu-don/cai-dat/may-chu.sh cap-nhat
   ```
   rồi trên máy Windows bấm đúp `mini-app\dua-len-zalo.cmd`.
2. **Mini App Center** (miniapp.zaloplatforms.com → Mini App Beeftown → **Checkout SDK** → **Cấu hình chung**):
   - Thông tin chung: **Callback URL** `https://don.beeftown.vn/zalo/thanh-toan`. Chép **Private key** (bước 4 dán
     vào máy chủ). Security Method để `HmacSHA256`, App Status `ACTIVE`.
   - **Thêm thanh toán mới** → loại hình **Tích hợp toàn diện** → **VNPay**, bản **Sandbox**:
     - Terminal ID (vnp_TmnCode): `SLKGTE22`.
     - Version (vnp_Version): `2.1.0`.
     - Secret Key (vnp_HashSecret): trong tệp `VNPAY-QR_PGW_SLKGTE22_TEST_Key.zip` (mật khẩu VNPay gửi riêng cho đầu
       mối kỹ thuật). Gõ thẳng vào ô này — không gửi qua chat, không đặt lên máy chủ đơn.
     - Redirect Path: `/tra-tien`.
     - IPN Processing Notification Url (chỉ sandbox, không bắt buộc): `https://don.beeftown.vn/zalo/vnpay-ipn` — để
       có số liệu làm hồ sơ kiểm thử của VNPay (bước 6).
3. **Gửi VNPay địa chỉ IPN** (email kythuatctt@vnpay.vn, nhắc mã `SLKGTE22`):
   `https://payment-mini.zalo.me/api/transaction/2858300068641327950/vnp-ipn` — đây là địa chỉ của Zalo, không phải của
   máy chủ đơn. Dòng khởi động của máy chủ (bước 4) cũng in địa chỉ này.
4. **Máy chủ đơn** (SSH vào máy BizFly):
   ```
   nano /etc/beeftown/may-chu-don.env
   ```
   Bỏ dấu `#` ở ba dòng VNPay, dán Private key sau `ZALO_CHECKOUT_KHOA_RIENG=`, giữ `ZALO_CHECKOUT_PHUONG_THUC=VNPAY_SANDBOX`.
   Có dòng `CHE_DO_DEMO=1` thì xóa (máy chủ không chạy cả hai). Lưu: Ctrl + O, Enter, Ctrl + X.
   ```
   systemctl restart may-chu-don
   journalctl -u may-chu-don -n 8
   ```
   Thấy dòng "VNPay qua Checkout SDK: MÔI TRƯỜNG THỬ (VNPAY_SANDBOX)" là đã bật.
5. **Thử** — phương thức sandbox chỉ hiện với tài khoản Zalo là Admin, Developer hay người thử của Mini App:
   - Mở Mini App bản thử, đặt một đơn → màn trả tiền có dòng "Bản thử: VNPay đang ở môi trường thử" → bấm "Trả … qua
     VNPay" → trang VNPay sandbox → trả bằng **thẻ thử NCB trong email VNPay ngày 11/11/2026** (số thẻ, tên, ngày phát
     hành, OTP ở email đó; không chép vào repo).
   - Quay lại app: trong vài giây app chuyển sang "Quán đã nhận đủ tiền". Màn quầy (`https://don.beeftown.vn/quay`):
     dòng cảnh báo sandbox đầu trang, đơn mang nhãn "Tiền thử VNPay (sandbox)".
   - Thử thêm: bấm hủy trên trang VNPay → app ghi "Lần thanh toán vừa rồi chưa xong", đơn vẫn chờ trả tiền.
   - Không chuyển sang "Quán đã nhận đủ tiền": `journalctl -u may-chu-don -n 30`. "từ chối callback (sai_mac)" là
     Private key trên máy chủ khác Mini App Center; không có dòng "VNPay …" nào là Zalo chưa gọi được Callback URL.
     `https://don.beeftown.vn/suc-khoe?khoa=<KHOA_SUC_KHOE>` ô `soDonVnpayChoKetQua` đếm đơn đã mở trang VNPay quá 20
     phút mà chưa có kết quả.
6. **Kiểm thử của VNPay (SIT)** ở `https://sandbox.vnpayment.vn/vsm-sit-client/` (tài khoản trong email VNPay): Zalo
   xử lý IPN thay quán; câu Zalo trả VNPay cho từng giao dịch nằm trong nhật ký:
   ```
   journalctl -u may-chu-don | grep "VNPay IPN"
   ```
7. **Mở bán** (khi VNPay cấp mã thật, Sang chốt giá thật): thêm VNPay bản **thật** ở Mini App Center với mã thật,
   gửi VNPay địa chỉ IPN cho mã thật, đổi `ZALO_CHECKOUT_PHUONG_THUC=VNPAY`, `systemctl restart may-chu-don`. Bảng
   giá còn là giá thử thì máy chủ không cho trả tiền thật (trừ `CHO_TRA_GIA_THU=1` để thử số nhỏ).

**Hoàn tiền** (khách trả hai lần, quầy hủy đơn đã trả): làm tay ở trang quản lý giao dịch của VNPay (merchant view
trong email), tra theo "Mã giao dịch VNPay" trên thẻ "Tiền về cần xem", rồi bấm "Đã xử lý xong" / "Đã hoàn tiền cho
khách". Máy chủ chưa gọi API hoàn tiền của Checkout SDK (việc tiếp).

**Chưa thử được với Zalo thật** (kiểm thử trong repo dùng Zalo giả theo đúng tài liệu): kiểu dữ liệu từng trường của
callback, Zalo có gửi lại khi máy chủ trả lỗi không (tài liệu: không), IP của webhook IPN sandbox. Zalo không gọi lại
sau 20 phút thì tài liệu bảo tra `getOrderStatus` — chưa làm (việc tiếp); trong lúc chờ, ô `soDonVnpayChoKetQua` của
`/suc-khoe` cho biết đơn nào cần tra tay ở Mini App Center.

## Cài ZNS (tin Zalo báo khách)

Máy chủ đơn gửi thẳng tới Zalo, không qua website: số điện thoại khách Mini App không rời máy chủ ở Việt Nam. Chi tiết
API Zalo dùng chung với website (`web/src/lib/zalo.ts`, đã đối chiếu tài liệu Zalo 23/10/2026). Mỗi tin trừ tiền ví
ZBS của OA theo bảng giá Zalo; chế độ thử không tính phí.

**Vì sao App Zalo riêng.** Refresh token của Zalo dùng một lần: mỗi lần làm mới, cái cũ chết ngay. Website
(`/noi-bo/zalo`) đã giữ chuỗi token của App của nó; máy chủ đơn dùng cùng App thì hai bên làm mới cùng một chuỗi và
làm chết của nhau. Một App riêng, cũng nối với OA "Nhà hàng Beeftown Hồ Tùng Mậu", có chuỗi token riêng.

1. developers.zalo.me → **Tạo ứng dụng** (ví dụ "Beeftown máy chủ đơn") → **Official Account** → liên kết OA của
   quán, bật quyền gửi tin ZBS / ZNS, đặt *Callback URL* (ví dụ `https://don.beeftown.vn/`). Chép App ID và Secret key.
2. Tạo **hai mẫu tin** ở trang quản lý ZBS của OA, gửi Zalo duyệt. Tên tham số phải gõ **đúng y** như dưới (máy chủ
   gửi đúng các tên này). Chữ dưới đây là bản Claude đề xuất — Khánh duyệt chữ trước khi gửi Zalo.
   - **Mẫu "Beeftown đã nhận đơn"** (loại giao dịch, xác nhận đơn hàng) — gửi khi tiền về đủ:
     > Beeftown đã nhận đơn và đủ tiền của `<ten_khach>`. Quán giao tới bạn theo thông tin dưới đây.
     > Mã đơn: `<ma_don>` · Số đơn: #`<so_don>` · Tổng tiền: `<tong_tien>` · Giao lúc: `<thoi_gian_giao>` ·
     > Giao tới: `<dia_chi>`
     > Cần đổi giờ hay địa chỉ giao, bạn nhắn Beeftown trên Zalo.
   - **Mẫu "Beeftown đang giao"** (loại giao dịch, cập nhật trạng thái đơn) — gửi khi quầy bấm "Soạn xong, chờ giao":
     > Đơn #`<so_don>` của `<ten_khach>` đã soạn xong, Beeftown đang giao tới bạn.
     > Mã đơn: `<ma_don>` · Giờ hẹn giao: `<thoi_gian_giao>`
   - Máy chủ gửi: `ten_khach` cắt 30 ký tự; `ma_don` 8 ký tự (ví dụ `K7QX4M9A`); `so_don` số đơn trong ngày;
     `tong_tien` dạng `600.000 đ`; `thoi_gian_giao` dạng `10:30 13/11/2026`; `dia_chi` cắt 200 ký tự. Chọn loại
     tham số cho khớp (chữ, không phải số) — loại và độ dài tối đa của từng tham số chưa đối chiếu tài liệu ZBS: Zalo
     từ chối mẫu hay tham số thì báo Claude Code đổi cách ghi ở `src/zns.ts` (`duLieuTin`).
3. Lấy refresh token đầu tiên cho App mới: chủ OA mở
   `https://oauth.zaloapp.com/v4/oa/permission?app_id=<App ID>&redirect_uri=<Callback URL>` → **Cho phép** → chép
   `code` trên thanh địa chỉ, đổi lấy token trên máy của mình:
   ```
   curl -s -X POST https://oauth.zaloapp.com/v4/oa/access_token -H "secret_key: <Secret key>" -d app_id=<App ID> -d grant_type=authorization_code -d code=<code>
   ```
   (Hoặc *API Explorer* trên developers.zalo.me.) Chép `refresh_token` trong kết quả.
4. Trên máy chủ: `sudo nano /etc/beeftown/may-chu-don.env`, bỏ dấu `#` ở các dòng ZNS, điền `ZALO_APP_ID`,
   `ZALO_SECRET_KEY`, hai mã mẫu, `ZALO_REFRESH_TOKEN_MOI=<refresh token>`, để `ZALO_CHE_DO=thu`. Lưu, rồi
   `sudo systemctl restart may-chu-don`. Nhật ký (`journalctl -u may-chu-don -n 20`) phải có
   "ZNS: chế độ thử (chỉ quản trị viên OA nhận), token đã có" và "đã nhận refresh token mới". Xóa token khỏi lịch sử
   terminal, ghi chú. Máy chủ lưu token mã hóa trong sổ đơn và tự làm mới (dưới 1 giờ trước khi hết hạn) — không phải
   dán lại, trừ khi nhật ký báo "Zalo từ chối refresh token".
5. Thử, chưa tốn tiền: đặt một đơn bằng **số điện thoại của một quản trị viên OA**, cho tiền về đủ (Test mode SePay) →
   trong 1 phút số đó nhận tin "Beeftown đã nhận đơn"; nhật ký có "ZNS: đã gửi <mã đơn> da_nhan". Ở màn quầy bấm
   "Bắt đầu soạn" rồi "Soạn xong, chờ giao" → nhận tin "đang giao". Ổn thì đổi `ZALO_CHE_DO=that`, chạy lại dịch vụ.

Cách máy chủ gửi: mỗi phút một lượt. Mỗi đơn mỗi loại tin đúng một dòng trong sổ đơn (xếp cùng lúc với bước làm ra
tin), nên bấm đúp hay SePay gửi lại không ra hai tin. Mất mạng, Zalo không trả lời: gửi lại sau 5 phút, tối đa 6 lần.
Số sai, người nhận chặn tin, mẫu sai: thôi tin đó. Hết tiền ví ZBS, quá giới hạn, ngoài giờ gửi: dừng cả lượt, gửi lại
sau. Tin quá cũ không gửi nữa: "đã nhận đơn" sau 24 giờ hay khi đơn đã hủy; "đang giao" sau 6 giờ hay khi đơn đã giao.
Máy chủ tắt giữa lúc gọi Zalo: tin đó không gửi lại (khách nhận hai tin còn tệ hơn thiếu một tin). Đơn mẫu không có
tin nào. Nhật ký chỉ ghi mã đơn và mã lỗi — không tên, không số điện thoại, không token.

## Việc của Khánh trước khi bật cho khách

1. Cài VNPay qua Checkout SDK theo mục trên (môi trường thử trước). SePay và VietinBank chỉ cần khi muốn nhận thêm
   chuyển khoản VietQR — có VNPay thì app không hiện mã VietQR.
2. Hỏi Sang: giá thật của 6 phần (đang là giá thử — máy chủ không hiện mã trả tiền theo giá thử), cách tính phí
   giao hàng.
3. Hỏi luật sư: Mini App có chức năng đặt hàng và thanh toán có phải thông báo Bộ Công Thương không.
4. Cài ZNS theo mục trên: App Zalo riêng, hai mẫu tin được Zalo duyệt, refresh token, thử ở chế độ thử.
