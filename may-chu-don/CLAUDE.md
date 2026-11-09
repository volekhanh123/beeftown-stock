# may-chu-don/ — máy chủ đơn của Mini App Zalo

Phiên Claude tự nạp file này khi đọc file trong `may-chu-don/`. Quy trình chung (9 mục "xong", kiểm thử trước khi mở
PR) ở `CLAUDE.md` gốc. Hướng dẫn cho người (chạy trên laptop, biến môi trường): `README.md`.

Khánh quyết 29/10/2026: bỏ gửi đơn qua tin nhắn chat OA, đặt hàng tự động hoàn toàn — khách **trả trước**, thu tiền
online qua **SePay** (chuyển khoản VietQR vào tài khoản VietinBank của SLK Group — Khánh mở tài khoản sau; Khánh đổi
từ Checkout SDK của Zalo sang SePay cùng ngày), quầy xem đơn trên **màn hình đơn riêng**, máy chủ **chạy thử trên laptop ở công ty rồi
chuyển lên máy chủ thuê ở Việt Nam** khi mở bán, khách được báo **trong app và bằng ZNS**. Khánh chốt 30/10/2026: khách chuyển dư thì đơn vẫn soạn, người làm hoàn phần
dư; tiền về đủ sau khi đơn quá hạn 30 phút vẫn tính là đã trả. Khánh chốt 09/11/2026: đơn trả trước **chỉ giao tận
nơi, giá khay đã gồm phí giao** ("giao tận nơi tạm thời là bao gồm giá giao") — tổng tiền là tổng tiền khay, đơn có
địa chỉ giao (cột `dia_chi`, chỉ màn quầy thấy; API của khách không trả); hoàn tiền do người làm tay.

Khánh 02/11/2026: tên miền máy chủ đơn là **`don.beeftown.vn`**; thử trước trên một **laptop dư cài Ubuntu** (xóa
Windows), mở ra internet qua router nhà — cùng bộ cài `cai-dat/` như máy thuê; mở bán thật thì chuyển sang máy thuê.
Khánh 09/11/2026: bỏ bước laptop, **thuê luôn BizFly Cloud** (vùng Hồ Chí Minh, Basic 1 vCPU / 1 GB / 20 GB, 134.000
đ/tháng) và chạy `cai don.beeftown.vn` trên đó; Cloudflare trỏ `don` về máy này (DNS only). Mật khẩu root và mật khẩu
quầy chỉ Khánh giữ. Phiên Claude trên đám mây không SSH được vào máy (mạng chặn): việc trên máy do Khánh gõ, Claude
chỉ từng lệnh.

## Vì sao là một máy chủ riêng

Dữ liệu khách của Mini App phải xử lý và lưu ở Việt Nam (thỏa thuận nhà phát triển Zalo Mini App, Điều 5.3.3b, 7.5 —
`mini-app/CLAUDE.md`, "Quy tắc của Zalo phải giữ"). Supabase của Beeftown ở Singapore, Cloudflare không chắc xử lý ở
Việt Nam: không dùng cho tên, số điện thoại của khách Mini App. Sổ đơn là một file SQLite (`bun:sqlite`) trên chính
máy chủ. Sang kho chỉ đi số khay (đợt 4), không dữ liệu khách. **Không dùng Cloudflare Tunnel** để đưa laptop ra
mạng: dữ liệu đi qua máy chủ Cloudflare.

## Chia đợt

| Đợt | Việc | Trạng thái |
|---|---|---|
| 1 | Nhận đơn (`POST /api/don`), xem đơn, màn hình quầy, hết hạn 30 phút, số liệu sức khỏe | đã gộp (PR #137) |
| 2a | SePay: mã VietQR cho từng đơn (`viet-qr.ts`), nhận tin tiền về có ký HMAC (`sepay.ts`, `POST /sepay/tien-ve`), sổ `giao_dich` đúng một lần mỗi id, đủ / thiếu / dư / không khớp, mục "Tiền về cần xem" ở màn quầy | đã gộp (PR #143) |
| 2b | Mini App gửi đơn lên máy chủ thay vì mở chat khi `diaChiMayChuDon` có địa chỉ, màn trả tiền (mã QR vẽ trong app, chép số tài khoản / số tiền / nội dung, lưu ảnh mã), hỏi lại trạng thái đến khi đã nhận tiền (`mini-app/src/tra-truoc.ts`, kiểm với máy chủ thật ở `test/thu.ts` nhóm 18) | đã gộp (PR #146) |
| 3 | ZNS gửi thẳng từ máy chủ đơn: "Beeftown đã nhận đơn" (tiền về đủ), "đang giao" (quầy bấm "Soạn xong, chờ giao"); hàng chờ `zns_tin`, token riêng mã hóa trong `zalo_token`, vòng gửi mỗi phút (`zns.ts`, `gui-zns.ts`, `test/thu.ts` nhóm 20). Chạy khi Khánh cài App Zalo riêng, hai mẫu được duyệt, refresh token (README, "Cài ZNS") | đã gộp (PR #163) |
| 4a | Bộ cài máy chủ thuê (`cai-dat/`): Ubuntu 24.04, Caddy HTTPS, systemd, tường lửa, `/sepay` chỉ IP SePay, `cap-nhat` chạy kiểm thử rồi mới chạy lại; laptop dư (tự tắt ngủ, README mục 1b) | đã gộp (PR #155) |
| 4 | Máy chủ thuê ở Việt Nam, HTTPS (xong 09/11/2026: BizFly Cloud TP.HCM, `https://don.beeftown.vn`, Mini App điền địa chỉ), sao lưu sổ đơn ở Việt Nam, xóa dữ liệu khách quá hạn, đèn sức khỏe trong `/noi-bo`, báo số khay sang kho | đang làm (#138) |

## File

| File | Việc |
|---|---|
| `src/main.ts` | Khởi động: biến môi trường, sổ đơn, `Bun.serve`, hết hạn mỗi phút |
| `src/may-chu.ts` | Mọi đường dẫn (`taoXuLy` — kiểm thử gọi thẳng bằng `Request`), giới hạn lượt, phiên quầy, phông; chế độ demo (`TAI_KHOAN_DEMO`, `idTienVeDemo`, `/quay/demo/tien-ve`) |
| `src/tao-don.ts` | `kiemDon`: kiểm đơn khách gửi, tự tính tiền; `dongHoVn` (giờ VN cho hàm giờ của Mini App) |
| `src/so-don.ts` | `SoDon`: bảng SQLite, tạo đơn theo `maGui`, đổi trạng thái có kiểm trạng thái cũ, nhật ký; `ghiTienVe` (bảng `giao_dich`) |
| `src/viet-qr.ts` | Chuỗi VietQR chuẩn NAPAS (CRC16), ảnh SVG, nội dung chuyển khoản "BT" + mã đơn |
| `src/sepay.ts` | Kiểm chữ ký HMAC-SHA256 của SePay, đọc tin tiền về, tìm mã đơn trong nội dung |
| `src/zns.ts` | ZNS phần thuần: cấu hình từ biến môi trường (đủ bốn hoặc không), `duLieuTin` (tên tham số của mẫu Zalo), mã hóa token |
| `src/gui-zns.ts` | Một lượt gửi ZNS: làm mới token (lưu trước khi gửi), gửi, xử lý mã lỗi theo `XU_LY_LOI` của `web/src/lib/zalo.ts` |
| `src/trang-thai.ts` | Trạng thái, bước quầy được bấm, nhãn vi / en và kiểu vẽ K1–K7 |
| `src/man-quay.ts`, `src/quay.css` | Màn hình quầy dựng ở máy chủ, không JavaScript; chữ vi / en |
| `scripts/don-mau.ts` | Đơn mẫu cho laptop thử (`npm run don-mau`) |
| `test/thu.ts` | Kiểm thử (`npx bun test/thu.ts`) |
| `cai-dat/may-chu.sh` | Bộ cài lên máy chủ thuê: `cai <tên miền>`, `cap-nhat`, `trang-thai` (README, "Đưa lên máy chủ thuê") |
| `cai-dat/may-chu-don.service`, `Caddyfile.mau`, `may-chu-don.env.mau` | systemd, HTTPS + chặn IP, mẫu bí mật. Kiểm ở `crm/test/test-may-chu-don-cai-dat.mjs` (đổi đường dẫn, cổng, biến, IP SePay thì sửa cả đó) |

Mã dùng chung: giá và phần thịt `mini-app/src/san-pham.ts`, giờ nhận và số khay tối đa `mini-app/src/cau-hinh.ts`,
giờ nhận và số điện thoại `mini-app/src/don.ts`, giờ Việt Nam `web/src/lib/gio-vn.ts`, chữ cấm
`web/src/lib/chuoi-cam.js`, API Zalo (địa chỉ, trường, mã lỗi) `web/src/lib/zalo.ts` — sửa ở đó là sửa cả máy chủ
đơn (CI "Kiểm thử" chạy `test/thu.ts`).

## Quy tắc

- Máy chủ **không tin** tiền, tên, giá Mini App gửi: chỉ nhận mã phần thịt và số khay, tự tính tiền (`kiemDon`).
- Mọi lần ghi là một giao dịch `BEGIN IMMEDIATE`; đổi trạng thái chỉ khi đơn đang ở `tu` (bấm đúp, hai máy tính bảng
  cùng bấm: một bước). Tạo đơn theo `maGui`: gửi lại trả đơn cũ, khác nội dung thì 409.
- Câu trả lời của `/api` chỉ nói đã ghi khi giao dịch đã xong; lỗi thì "đơn CHƯA được ghi". Không chữ "thành công".
- Chỉ một đường đánh dấu "đã trả tiền": `POST /sepay/tien-ve`, sau khi chữ ký HMAC-SHA256 của SePay đúng, tiền vào
  đúng tài khoản của quán (chính hoặc VA) và tổng tiền đã về đủ tổng đơn (`SoDon.ghiTienVe`). Đơn mẫu chỉ ghi qua
  `scripts/don-mau.ts` (từ chối khi sổ có đơn của khách thật). Ngoại lệ duy nhất: chế độ demo (`CHE_DO_DEMO=1`, Khánh
  09/11/2026, README "Chế độ demo") — nút quầy `POST /quay/demo/tien-ve` gọi cùng `ghiTienVe` với id âm cố định theo đơn
  (`idTienVeDemo`) và tài khoản giả `TAI_KHOAN_DEMO`; `main.ts` không cho bật cùng tài khoản nhận thật hay
  `SEPAY_KHOA_KY` (`test/thu.ts` nhóm 21).
- Mỗi id SePay ghi đúng một lần, cùng giao dịch với việc đổi đơn. Khoản tiền nào mang mã của quán mà không tự khớp được
  (thiếu, dư, gõ sai mã, sai tài khoản) phải hiện ở "Tiền về cần xem" — không bao giờ lặng lẽ bỏ qua.
- Không giữ `content` / `description` của SePay (có thể có tên, số tài khoản người chuyển).
- ZNS: tin xếp cùng giao dịch với bước làm ra nó (`xepTinZns` trong `ghiTienVe` và `doiTrongGiaoDich`), mỗi đơn mỗi
  loại một dòng; chỉ tiền về qua `ghiTienVe` mới có tin (SePay, hay nút giả lập của chế độ demo; đơn mẫu,
  `ghiDaThanhToan` không). Gửi thẳng từ máy chủ đơn, không
  qua website (số điện thoại khách Mini App không rời Việt Nam). Refresh token mới lưu vào sổ đơn TRƯỚC khi gửi; tin
  đang gửi dở khi máy chủ tắt thành `khong_ro`, không gửi lại. Nhật ký, cột `loi`: qua `xoaBiMatZalo` — không số điện
  thoại, không token. Chữ của mẫu tin nằm trên Zalo (Khánh tạo và duyệt), máy chủ chỉ gửi tham số.
- Màn hình quầy: không màu trạng thái (bảy kiểu K1–K7 của nội bộ, skill `thiet-ke-beeftown`); chữ đủ vi / en.
- Thư mục du-lieu (sổ đơn `don.sqlite`) không bao giờ vào git — `.gitignore` chặn, `crm/test/test-quy-trinh.mjs` kiểm.

## Lệnh

```bash
npm ci
npx bun test/thu.ts            # kiểm thử (CI "Kiểm thử" cũng chạy)
npm run kiem-kieu              # tsc strict
MAT_KHAU_QUAY=... npm run chay # chạy máy chủ (README.md, "Chạy thử trên laptop")
npm run don-mau                # đơn mẫu vào sổ đơn của laptop thử
```
