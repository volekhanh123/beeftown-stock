# Beeftown Cân — đưa danh mục kho xuống cân qua WiFi

Chương trình Windows (`BeeftownCan.exe`) cho máy tính ở quán: đăng nhập kho Beeftown, lấy **mã cân, tên, giá bán/kg** từ Mặt hàng, xem trước thay đổi, rồi bấm **Gửi xuống cân** — không cần USB, không cần tải file.

Phần tính "thêm / sửa / bỏ" là **đúng code của màn Đồng bộ cân** (`web/src/lib/kho/can-tma.ts`), nên hai nơi luôn ra cùng một kết quả.

## Dùng

1. Chép `BeeftownCan.exe` vào máy tính ở quán (máy phải cùng WiFi với cân). Nháy đúp để mở.
   File không ký số: lần đầu Windows có thể báo *"Windows protected your PC"* → **More info** → **Run anyway**.
2. **Đăng nhập kho** bằng tài khoản quản lý hoặc chủ. Máy nhớ đăng nhập.
3. **Bắt đầu** (một lần): trên cân lưu dữ liệu ra USB (`Prog → ↓ V3 tới P4 → Accu/Confirm → Accu/Confirm → Amend`), chọn file `JHSCALE\A_000.TMS`.
4. Mỗi lần đổi giá / thêm món trong kho: mở chương trình → xem bảng thay đổi → **Gửi xuống cân** → gọi thử một hàng trên cân.

Cân đổi địa chỉ (trên cân: `Prog → 4 → 2`) thì sửa ở **Cài đặt và việc khác**.

## Điều đã thử trên cân thật (26/09/2026, TM-xA V3.14E8)

- Cân nhận ở **cổng TCP 33571**, nội dung y như file USB `A_000.TMS`; gửi xong đóng chiều gửi, cân không trả lời.
- **Qua WiFi cân chỉ thêm và sửa hàng, không xoá.** Nạp USB thì cân thay cả danh sách.
  → Chương trình nhớ các hàng đang nằm trên cân (`Tài liệu\Beeftown Can\tren-can.tsv`). Hàng đã bỏ khỏi kho mà còn trên cân được báo đỏ, kèm nút **Lưu file để nạp USB** và **Tôi đã nạp USB xong**.

## Cách chạy bên trong

```
BeeftownCan.exe ── máy chủ nhỏ 127.0.0.1:<cổng ngẫu nhiên>/?t=<mã bí mật>
      │                (src/main.ts, src/may-chu.ts; giao diện src/giao-dien.html)
      ├─ mở cửa sổ Edge dạng ứng dụng trỏ vào đó; đóng cửa sổ → chương trình tắt
      ├─ kho: https://beeftown.vn/kho-can.json → địa chỉ Supabase + khóa anon (công khai theo thiết kế)
      │        đăng nhập Supabase Auth; phiên lưu ở %APPDATA%\BeeftownCan\phien.json
      │        quyền như màn Đồng bộ cân: vai có việc danh_muc (chủ, quản lý)
      └─ cân: TCP <IP cân>:33571 (src/nghiep-vu.ts → guiTcp)
```

| Nơi | Có gì |
|---|---|
| `%APPDATA%\BeeftownCan\` | `cau-hinh.json` (IP cân, cổng, địa chỉ kho), `phien.json` (đăng nhập), `loi.txt` (lỗi) |
| `Tài liệu\Beeftown Can\` | `A_000.TMS` (file gốc = bản gần nhất đã nạp vào cân), `tren-can.tsv`, `da-gui\` (mỗi lần gửi một bản), `cho-usb\` |

Thư mục `Tài liệu\Beeftown Can` dùng chung với `web/public/kho/can-wifi/Nap-Can-WiFi.ps1`.
**File .TMS có tên và mật khẩu WiFi của quán** — chỉ nằm trên máy này và gửi tới cân, không lên kho, không commit.

Máy chủ chỉ nghe `127.0.0.1` và mọi yêu cầu phải mang đúng mã bí mật (`?t=`), nên trang web lạ mở trên cùng máy không gọi được.

## Phát triển

```bash
cd can-app && npm ci
npx bun test/thu.ts              # 39 kiểm tra: cân giả, kho giả, chạy cả src/main.ts
npx bun test/xem-giao-dien.ts    # mở giao diện với dữ liệu giả để xem / chụp màn hình
npx bun scripts/dong-goi.ts      # ra dist/BeeftownCan.exe (~87 MB), đóng gói được từ Linux
```

- Cần bản web có `/kho-can.json` (`web/src/pages/kho-can.json.ts`) đã triển khai.
- Đóng gói trên Linux thì file .exe chưa có biểu tượng riêng (Bun chỉ gắn biểu tượng khi đóng gói trên Windows).
- `dist/` và `node_modules/` không vào repo. File .exe quá lớn để để trong repo hoặc trên web (Cloudflare giới hạn 25 MB một file) — gửi tay, hoặc đưa lên GitHub Releases.

## Chưa làm

- Xoá hàng qua WiFi: chưa biết lệnh xoá của cân.
- Đọc danh sách hàng từ cân qua WiFi (để khỏi cần file gốc từ USB lần đầu).
- Hạn dùng trên tem: chưa biết cột nào của dòng PLU.
