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

Mã dùng chung với web nằm ở `web/src/lib/` (`gio-vn.ts`, `kho/can-tma.ts`, `kho/chung.ts`, `kho/danh-muc.ts`,
`kho/danh-muc-can.ts`, `kho/ma-giam.ts`, `kho/tang.ts`, `kho/anh.ts`) — sửa ở đó là sửa cả `.exe`.

## Quy tắc

- Máy quầy chỉ thấy bản mới khi `PHIEN_BAN` tăng: CI của main tạo Release, máy quầy bấm Cập nhật. Đổi mã mà không
  tăng bản thì ghi lý do trong mô tả PR (`npm run tom-tat-pr` trong `crm/` nhắc chỗ này).
- Mỗi bản mới có mục "Bản X.Y" trong `README.md`: đổi gì, cách thử ở quán theo thứ tự.
- File `.TMS` có tên và mật khẩu WiFi của quán — không bao giờ commit, không gửi lên kho.
- Màu của Beeftown Cân còn nhận diện cũ: chỉ đổi trong PR đổi màu riêng (`THUONG-HIEU.md` mục 0, việc 7).

## Lệnh

```bash
npm ci                           # cài web/ trước (cd ../web && npm ci): mã dùng chung và kiểu Astro ở đó
npm run kiem-kieu                # tsc strict
npx bun test/thu.ts              # cân giả, kho giả, rồi từng module — luôn chạy khi đụng can-app/ hay file dùng chung
npx bun test/thu-trinh-duyet.ts  # giao diện trong Chromium cho từng vai (CI cũng chạy)
npx bun test/xem-giao-dien.ts    # mở giao diện với dữ liệu giả để xem, chụp màn hình
```
