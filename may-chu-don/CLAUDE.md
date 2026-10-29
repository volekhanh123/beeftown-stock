# may-chu-don/ — máy chủ đơn của Mini App Zalo

Phiên Claude tự nạp file này khi đọc file trong `may-chu-don/`. Quy trình chung (9 mục "xong", kiểm thử trước khi mở
PR) ở `CLAUDE.md` gốc. Hướng dẫn cho người (chạy trên laptop, biến môi trường): `README.md`.

Khánh quyết 29/10/2026: bỏ gửi đơn qua tin nhắn chat OA, đặt hàng tự động hoàn toàn — khách **trả trước trong app**
(Checkout SDK của Zalo), quầy xem đơn trên **màn hình đơn riêng**, máy chủ **chạy thử trên laptop ở công ty rồi
chuyển lên máy chủ thuê ở Việt Nam** khi mở bán, khách được báo **trong app và bằng ZNS**. Claude đề xuất, Khánh
chưa chốt: đơn trả trước đợt đầu chỉ nhận tại quán (phí giao chưa chốt), hoàn tiền do người làm tay.

## Vì sao là một máy chủ riêng

Dữ liệu khách của Mini App phải xử lý và lưu ở Việt Nam (thỏa thuận nhà phát triển Zalo Mini App, Điều 5.3.3b, 7.5 —
`mini-app/CLAUDE.md`, "Quy tắc của Zalo phải giữ"). Supabase của Beeftown ở Singapore, Cloudflare không chắc xử lý ở
Việt Nam: không dùng cho tên, số điện thoại của khách Mini App. Sổ đơn là một file SQLite (`bun:sqlite`) trên chính
máy chủ. Sang kho chỉ đi số khay (đợt 4), không dữ liệu khách. **Không dùng Cloudflare Tunnel** để đưa laptop ra
mạng: dữ liệu đi qua máy chủ Cloudflare.

## Chia đợt

| Đợt | Việc | Trạng thái |
|---|---|---|
| 1 | Nhận đơn (`POST /api/don`), xem đơn, màn hình quầy, hết hạn 30 phút, số liệu sức khỏe | PR này |
| 2 | Checkout SDK: máy chủ ký `mac` cho `createOrder`, nhận báo thanh toán → `SoDon.ghiDaThanhToan`, kiểm lại bằng `checkTransaction`; Mini App gửi đơn lên máy chủ thay vì mở chat (chỉ bản thử) | chờ Khánh đăng ký Checkout, khóa bí mật; đọc tài liệu ở `docs.zaloplatforms.com` |
| 3 | ZNS: "đã nhận đơn", "khay đã sẵn sàng" | chờ mẫu tin được duyệt |
| 4 | Máy chủ thuê ở Việt Nam, HTTPS, sao lưu sổ đơn ở Việt Nam, xóa dữ liệu khách quá hạn, đèn sức khỏe trong `/noi-bo`, báo số khay sang kho | chờ thuê máy |

## File

| File | Việc |
|---|---|
| `src/main.ts` | Khởi động: biến môi trường, sổ đơn, `Bun.serve`, hết hạn mỗi phút |
| `src/may-chu.ts` | Mọi đường dẫn (`taoXuLy` — kiểm thử gọi thẳng bằng `Request`), giới hạn lượt, phiên quầy, phông |
| `src/tao-don.ts` | `kiemDon`: kiểm đơn khách gửi, tự tính tiền; `dongHoVn` (giờ VN cho hàm giờ của Mini App) |
| `src/so-don.ts` | `SoDon`: bảng SQLite, tạo đơn theo `maGui`, đổi trạng thái có kiểm trạng thái cũ, nhật ký |
| `src/trang-thai.ts` | Trạng thái, bước quầy được bấm, nhãn vi / en và kiểu vẽ K1–K7 |
| `src/man-quay.ts`, `src/quay.css` | Màn hình quầy dựng ở máy chủ, không JavaScript; chữ vi / en |
| `scripts/don-mau.ts` | Đơn mẫu cho laptop thử (`npm run don-mau`) |
| `test/thu.ts` | Kiểm thử (`npx bun test/thu.ts`) |

Mã dùng chung: giá và phần thịt `mini-app/src/san-pham.ts`, giờ nhận và số khay tối đa `mini-app/src/cau-hinh.ts`,
giờ nhận và số điện thoại `mini-app/src/don.ts`, giờ Việt Nam `web/src/lib/gio-vn.ts`, chữ cấm
`web/src/lib/chuoi-cam.js` — sửa ở đó là sửa cả máy chủ đơn (CI "Kiểm thử" chạy `test/thu.ts`).

## Quy tắc

- Máy chủ **không tin** tiền, tên, giá Mini App gửi: chỉ nhận mã phần thịt và số khay, tự tính tiền (`kiemDon`).
- Mọi lần ghi là một giao dịch `BEGIN IMMEDIATE`; đổi trạng thái chỉ khi đơn đang ở `tu` (bấm đúp, hai máy tính bảng
  cùng bấm: một bước). Tạo đơn theo `maGui`: gửi lại trả đơn cũ, khác nội dung thì 409.
- Câu trả lời của `/api` chỉ nói đã ghi khi giao dịch đã xong; lỗi thì "đơn CHƯA được ghi". Không chữ "thành công".
- Không đường dẫn nào đánh dấu "đã trả tiền" từ ngoài cho tới đợt 2 — và đợt 2 chỉ sau khi kiểm chữ ký của Zalo
  và số tiền. Đơn mẫu chỉ ghi qua `scripts/don-mau.ts` (từ chối khi sổ có đơn của khách thật).
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
