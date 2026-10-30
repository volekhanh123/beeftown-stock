# can-app/ — Beeftown Cân (BeeftownCan.exe, máy quầy, cân TMA)

Phiên Claude tự nạp file này khi đọc file trong `can-app/`. Quy trình chung ở `CLAUDE.md` gốc. Đọc đúng mục, đừng đọc
cả `README.md` (860 dòng, phần lớn là ghi chép từng bản):

| Việc | Đọc |
|---|---|
| Chương trình chạy thế nào, file lưu ở đâu | `README.md`, "Cách chạy bên trong" |
| Lệnh, đóng gói, Release | `README.md`, "Phát triển" |
| Giao thức cân, cột PLU, thông số, mẫu tem | `CAN-TMA.md`; đặc tả dịch ngược `dac-ta/` (bắt đầu từ `dac-ta/_tom-tat.txt`) |
| Thẻ, vai, giao diện | `README.md`, "Bản 2.11 — gọn còn 5 thẻ"; `src/giao-dien.html` |
| Việc còn dở, việc phải thử trên cân thật | `README.md`, "Chưa làm" |

## File

| File | Việc |
|---|---|
| `src/main.ts` | Khởi động, `PHIEN_BAN` (workflow đóng gói đọc đúng dòng `const PHIEN_BAN = '…';`) |
| `src/may-chu.ts` | Máy chủ nhỏ `127.0.0.1` mang mã bí mật `?t=`, mọi đường dẫn của giao diện |
| `src/nghiep-vu.ts` | Gửi giá / tem / thông số xuống cân rồi đọc lại để kiểm |
| `src/giao-thuc.ts`, `src/giu-ket-noi.ts`, `src/udp-can.ts`, `src/day-rs232.ts`, `src/tim-can.ts` | Nói chuyện với cân: TCP hai chiều, giữ kết nối, nghe UDP, dây RS232, dò WiFi |
| `src/tem.ts`, `src/thong-so.ts` | Mẫu tem, thông số, chữ, phím |
| `src/quay.ts` | Máy quầy: phần tính của thẻ Quầy, Giảm giá, Báo cáo (hàm thuần) |
| `src/bao-kho.ts`, `src/bao-cao-can.ts` | Báo về kho (migration 0061); nhật ký bán của cân |
| `src/cap-nhat.ts` | Nút Cập nhật (tải bản cài từ kho công khai `beeftown-can-ban-cai`) |
| `src/nhan-dien.ts` | Đặt logo phụ trắng và biểu tượng cửa sổ vào hai trang (2.12) |

Mã dùng chung với web nằm ở `web/src/lib/` (`gio-vn.ts`, `kho/can-tma.ts`, `kho/chung.ts`, `kho/danh-muc.ts`,
`kho/danh-muc-can.ts`, `kho/ma-giam.ts`, `kho/tang.ts`, `kho/anh.ts`) — sửa ở đó là sửa cả `.exe`. Từ 2.12 `.exe` nhúng thêm
`web/public/thuong-hieu/chu-beeftown-trang.svg` (logo đầu trang) và `web/public/bieu-tuong.svg` (biểu tượng cửa sổ): đổi hai
file đó là ra bản mới, tăng `PHIEN_BAN` (`dong-goi-can.yml` đóng gói thử khi PR đụng chúng).

## Quy tắc

- Máy quầy chỉ thấy bản mới khi `PHIEN_BAN` tăng: CI của main tạo Release, máy quầy bấm Cập nhật. Đổi mã mà không
  tăng bản thì ghi lý do trong mô tả PR (`npm run tom-tat-pr` trong `crm/` nhắc chỗ này).
- Mỗi bản mới có mục "Bản X.Y" trong `README.md`: đổi gì, cách thử ở quán theo thứ tự.
- File `.TMS` có tên và mật khẩu WiFi của quán — không bao giờ commit, không gửi lên kho.
- Màu theo bộ nhận diện 21/10/2026 từ bản 2.12: khối `:root` của `src/giao-dien.html` và `src/huong-dan.html` cùng tên, cùng
  giá trị với `web/src/styles/chung.css` — đổi một mã là đổi cả ba nơi và tăng `PHIEN_BAN`. Ngoài `:root` chỉ dùng biến.
  Trạng thái bằng chữ, dấu, nét: nhãn `.nhan-l.cho`, `.nhap`, `.song`, `.luu-y`, `.tat`, `.thong-tin` (K1, K3–K7 của
  `THUONG-HIEU.md` mục 4) — không lớp nào mang tên màu. Logo đầu trang là `<!--logo-phu-trang-->`, `src/nhan-dien.ts`
  thay bằng `web/public/thuong-hieu/chu-beeftown-trang.svg` — không gõ chữ BEEFTOWN. `crm/test/test-can-nhan-dien.mjs` gác.

## Lệnh

```bash
npm ci                           # cài web/ trước (cd ../web && npm ci): mã dùng chung và kiểu Astro ở đó
npm run kiem-kieu                # tsc strict
npx bun test/thu.ts              # cân giả, kho giả, rồi từng module — luôn chạy khi đụng can-app/ hay file dùng chung
npx bun test/thu-trinh-duyet.ts  # giao diện trong Chromium cho từng vai (CI cũng chạy)
npx bun test/xem-giao-dien.ts    # mở giao diện với dữ liệu giả để xem, chụp màn hình
```
