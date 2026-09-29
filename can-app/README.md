# Beeftown Cân — máy quầy: cân in tem, quầy, giảm giá cận date, tảng & ô, báo cáo

Chương trình Windows (`BeeftownCan.exe`) cho máy tính ở quầy, thay phần mềm của hãng cân. Đăng nhập bằng
**tài khoản kho của mình** (NV quầy, thủ kho, kế toán, quản lý, chủ) — thẻ hiện theo vai.

Máy quầy (từ 2.0.0, cần migration 0054):

- **Quầy** (mọi vai) — việc cần làm ngay: gói **hết hạn** → chọn lô, chụp ảnh, **tạo phiếu huỷ** (chờ quản lý
  duyệt); gói **cận date** → "xếp ra trước" và "cân lại bằng PLU n · mã 90001 · −30%"; món **dưới mức** →
  sửa số, **gửi yêu cầu lấy hàng** cho thủ kho. Tồn quầy từng món, yêu cầu đang chờ, hàng đang mang ra. Tự
  tải lại mỗi phút.
- **Tảng & ô mã** (mọi vai) — mỗi ô đang giữ tảng nào, lóc ra / đã bán / huỷ / còn, % bán, số lần lệch ô;
  báo **cân chưa đổi tên theo tảng** (so tên trên cân với tên kho muốn).
- **Giảm giá cận date** — FABi không đọc giá trên tem, nên mỗi mức giảm là **một mã cân riêng**. Quản lý / chủ
  tạo mã (món + mức, mã tự lấy từ 90001), bật / tắt; tải danh sách để tạo món trên FABi (mã món = mã cân,
  giá = giá đã giảm); mã lên cân ở lần gửi sau. Bán ra kho tự ghi là bán giảm giá.
- **Báo cáo** (chủ, quản lý, kế toán) — doanh thu / kg theo giờ, theo ngày, món bán chạy; bán giảm giá (tiền
  đã giảm, **giảm sớm** — gói còn hạn xa mà bán giảm); lệch ô; theo tảng (thu hồi, % bán). Tải Excel.

Với cân (quản lý, chủ):

- **Gửi giá từ kho** — đăng nhập kho Beeftown, lấy **mã cân, tên, giá bán/kg** từ Mặt hàng, xem trước thay đổi, bấm **Gửi xuống cân**. Không cần USB.
- **Tất cả hàng (SKU)** — mọi hàng đang có trên cân: số PLU, phím tắt, mã cân, **mã FABi** (5 số trong mã vạch), tên, giá, và đối chiếu với kho (khớp / khác kho / kho không có / còn nằm lại / chưa lên cân / không lên được). Có tìm kiếm, lọc, tải về Excel (CSV). Xem được cả khi chưa đăng nhập kho.
- **Mẫu tem** — sơ đồ tem đang dùng; chọn ô nào được in (tên hàng, số PLU, trọng lượng, đơn giá, thành tiền, mã vạch, ngày đóng gói, hạn dùng…) và sửa chữ cố định (tên quán, "Đơn giá", "HSD"…), rồi gửi xuống cân hoặc lưu file nạp USB.
- **Cân đổi địa chỉ** (từ 2.1.0) — nối cân không được thì chương trình tự dò WiFi tìm cân, dùng địa chỉ mới và gửi lại (xem mục bên dưới).

Tên và giá hàng chỉ sửa ở kho (kho là gốc); chương trình không sửa tay SKU.

**Truy vết theo tảng:** phần cắt có **ô mã** (ví dụ 10011–10019) thì mỗi ô là một PLU trên cân. Khi bếp lóc
một tảng và bấm "Giao ô mã" trong kho, ô đó đổi tên thành "Thăn ngoại cắt lát #0142" ở lần gửi sau — tem in
ra có số tảng, FABi bán theo mã ô. Bật **Tự gửi xuống cân khi kho đổi** (Cài đặt) để chương trình tự gửi
mỗi phút khi kho có thêm / sửa (chỉ khi cửa sổ đang mở). Danh mục lấy từ `web/src/lib/kho/danh-muc-can.ts`,
dùng chung với màn Đồng bộ cân.

Phần tính "thêm / sửa / bỏ" là **đúng code của màn Đồng bộ cân** (`web/src/lib/kho/can-tma.ts`), nên hai nơi luôn ra cùng một kết quả.

## Dùng

1. Chép `BeeftownCan.exe` vào máy tính ở quán (máy phải cùng WiFi với cân). Nháy đúp để mở.
   File không ký số: lần đầu Windows có thể báo *"Windows protected your PC"* → **More info** → **Run anyway**.
2. **Đăng nhập kho** bằng tài khoản kho (NV quầy dùng thẻ Quầy, Tảng & ô; gửi giá xuống cân, tem, mã giảm: quản lý hoặc chủ). Máy nhớ đăng nhập.
3. **Bắt đầu** (một lần): trên cân lưu dữ liệu ra USB (`Prog → ↓ V3 tới P4 → Accu/Confirm → Accu/Confirm → Amend`), chọn file `JHSCALE\A_000.TMS`.
4. Mỗi lần đổi giá / thêm món trong kho: mở chương trình → xem bảng thay đổi → **Gửi xuống cân** → gọi thử một hàng trên cân.
5. Đổi tem: thẻ **Mẫu tem** → bỏ chọn / chọn ô, sửa chữ → **Gửi tem xuống cân** → cân thử một món, in một tem xem đã đổi chưa. Nếu chưa đổi: **Lưu file nạp USB**.

## Cân đổi địa chỉ — chương trình tự tìm cân (từ 2.1.0)

Router tự phát địa chỉ cho cân, nên sau khi cân hay router khởi động lại cân có thể mang địa chỉ khác
(192.168.1.22 → 192.168.1.37…). Chương trình tự xử lý (`src/tim-can.ts`):

- Nối cân không được (lúc mở chương trình, bấm **Kiểm tra kết nối**, **Gửi xuống cân**, **Gửi tem**, tự gửi) →
  **dò WiFi tìm cân**: thử nối cổng 33571 ở mọi địa chỉ trong mạng của máy tính — trong WiFi của quán chỉ cân mở
  cổng này. Mỗi địa chỉ chỉ mở rồi đóng kết nối, không gửi gì. Dải /24 (254 địa chỉ) mất chừng 4 giây.
- Thấy **đúng một cân** → dùng địa chỉ mới, lưu vào Cài đặt, gửi lại; trang báo "Cân đã đổi địa chỉ (cũ → mới)".
- **Chắc là đúng cân**: chương trình nhớ mã máy (MAC) của cân lần đầu nối được (bảng ARP của Windows,
  `arp -a`). Máy vừa thấy khác mã máy (quán có cân thứ hai, vừa thay cân) → không tự chuyển, không gửi danh mục
  sang; trang hiện nút "Dùng cân …". Chọn cân khác bằng tay thì chương trình quên mã cũ, nhớ mã cân mới.
  Không đọc được mã máy thì vẫn tự theo (không biết thì không chặn).
- Thấy **nhiều cân** → không tự chọn: trang hiện nút "Dùng cân …" từng địa chỉ (xem trên cân: `Prog → 4 → 2`).
- Không thấy cân → báo đã dò bao nhiêu địa chỉ, và các việc cần xem (cân bật chưa, cùng WiFi không…).
- Gửi hỏng giữa chừng (đã nối được) thì không tự gửi lại — người bấm quyết.
- Tự gửi mỗi phút: vừa dò mà không thấy cân (tối, cân tắt) thì 5 phút sau mới dò lại; lần dò trước thấy cân
  mà cân lại đổi địa chỉ thì dò ngay.
- Việc ghi xuống cân (tự gửi, bấm Gửi, gửi tem, gửi thử qua dây) chạy **lần lượt**, không chồng nhau; việc sau
  lập kế hoạch từ file gốc việc trước vừa ghi.
- Đang dò mà người gõ địa chỉ khác ở Cài đặt → kiểm lại theo địa chỉ mới, không tự đổi đè lên. Ô địa chỉ ở
  Cài đặt chỉ gửi khi người gõ vào đó, nên lưu cài đặt khác không đè địa chỉ chương trình vừa tự tìm ra; ô Cân
  tự làm mới mỗi phút.
- Nút **Tìm cân trong WiFi** (Cài đặt) dò bất cứ lúc nào. Mạng lớn hơn /22 chỉ dò dải /24 quanh máy tính và quanh
  địa chỉ cũ của cân.

Chương trình nhớ 10 lần đổi gần nhất (`cau-hinh.json`, `doiDiaChi`); cân đổi từ 2 lần trong 30 ngày thì ô Cân
nhắc **giữ cố định địa chỉ cho cân trong router** (DHCP Reservation / Static Lease / Address Binding) — cách chắc
nhất, làm một lần là xong.

Không nghe tiếng cân tự phát mỗi ~15 giây (UDP 33584): mở cổng nghe thì Windows hiện hộp hỏi tường lửa với nhân
viên quầy. Dò bằng kết nối ra ngoài thì không.

## Dây RS232 (thử, từ 2.1.0)

Mới chắc cân nhận danh mục qua **USB** và **WiFi**. Qua dây RS232 thì **chưa biết** — thẻ Cài đặt có phần thử
(`src/day-rs232.ts`), mở cổng COM bằng PowerShell có sẵn trong Windows (8 bit, không chẵn lẻ, 1 bit dừng, bật DTR/RTS):

1. Cắm dây từ máy tính vào cổng RS232 của cân (dây USB–RS232 hiện thành COM3, COM4…; cần driver CH340 / PL2303 /
   FTDI — Windows thường tự cài). **Cài đặt → Tìm cổng COM** → chọn cổng, tốc độ (cân thường để 9600).
2. **Nghe cân 10 giây**: cân có tự gửi gì qua dây không. Ra chữ đọc được = dây, cổng, tốc độ đúng. Không nghe thấy gì
   thì chưa nói lên được gì (cân có thể chỉ trả lời khi được hỏi).
3. **Gửi thử qua dây** (quản lý, chủ; lúc kho có thay đổi chưa lên cân): đẩy đúng nội dung như gửi WiFi (giữ cả hàng
   ngoài kho), rồi trang chỉ một hàng để gọi thử trên cân — ưu tiên hàng đổi giá; chỉ có hàng đổi tên (tảng) thì
   in thử một tem xem tên. Cân đổi = cân nhận qua dây. Chưa đổi thì thử tốc độ khác.
   Dây không báo "đã nhận" như WiFi, nên chương trình **không ghi nhận** lần gửi thử — lần gửi WiFi sau vẫn gửi lại.

Cân nhận qua dây thì làm tiếp: chọn dây hay WiFi ở Cài đặt, tự gửi qua dây; và thử xem qua dây cân có xoá được
hàng không (như USB).

- Đoạn lệnh PowerShell đã chạy thật với PowerShell 7 + cổng COM giả (pty trên Linux): gửi đủ byte, nghe được, lỗi
  cổng không có hiện đúng câu. Chưa chạy trên Windows PowerShell 5.1 và dây thật.

## Điều đã thử trên cân thật (26/09/2026, TM-xA V3.14E8)

- Cân nhận ở **cổng TCP 33571**, nội dung y như file USB `A_000.TMS`; gửi xong đóng chiều gửi, cân không trả lời.
- **Qua WiFi cân chỉ thêm và sửa hàng, không xoá.** Nạp USB thì cân thay cả danh sách.
  → Chương trình nhớ các hàng đang nằm trên cân (`Tài liệu\Beeftown Can\tren-can.tsv`). Hàng đã bỏ khỏi kho mà còn trên cân được báo đỏ, kèm nút **Lưu file để nạp USB** và **Tôi đã nạp USB xong**.

- **Chưa thử trên cân thật:** đổi mẫu tem qua WiFi. Cân nhận chắc chắn khi nạp USB (thay cả file); qua WiFi cân có nhận phần LAB hay không thì phải in thử một tem để biết.

## Mẫu tem trong file .TMS (`src/tem.ts`)

- Phần `LAB`: mỗi mẫu tem là một dòng `LAB`, các dòng `LAS` (mỗi dòng một ô in), rồi `LAE`. Phần `TMS` dòng số 0 cho biết cân đang dùng mẫu số mấy.
- Dòng `LAB`: cột 1 số mẫu · 2 tên · 4–5 rộng × cao (mm) · từ cột 6 là chữ cố định (cột 22 là cờ).
- Dòng `LAS`: cột 2 loại ô (0 mã vạch · 1 dữ liệu hàng · 2 số tính lúc in · 3 chữ cố định) · 3–4 ô nào · 5 điều kiện in · 9–12 vị trí và cỡ (chấm, 8 chấm/mm).
- **Tắt ô** = bỏ dòng `LAS`; dòng bỏ được nhớ trong `Tài liệu\Beeftown Can\tem-da-tat.json` để **bật lại** đúng chỗ. Dòng không sửa giữ y nguyên từng byte.

## Cách chạy bên trong

```
BeeftownCan.exe ── máy chủ nhỏ 127.0.0.1:<cổng ngẫu nhiên>/?t=<mã bí mật>
      │                (src/main.ts, src/may-chu.ts; giao diện src/giao-dien.html)
      ├─ mở cửa sổ Edge dạng ứng dụng trỏ vào đó; đóng cửa sổ → chương trình tắt
      ├─ kho: https://beeftown.vn/kho-can.json → địa chỉ Supabase + khóa anon (công khai theo thiết kế)
      │        đăng nhập Supabase Auth; phiên lưu ở %APPDATA%\BeeftownCan\phien.json
      │        mọi vai kho (xem); gửi cân / tem / mã giảm cần danh_muc, báo cáo cần xem_gia
      │        máy quầy: kho_bang_quay, kho_can_o_ma, kho_bao_cao_ban_gio, kho_luu_ma_giam… (src/quay.ts)
      ├─ cân: TCP <IP cân>:33571 (src/nghiep-vu.ts → guiDenCan → guiTcp)
      │        nối không được → dò WiFi tìm cân (src/tim-can.ts), thấy một cân thì gửi lại ở đó
      └─ dây RS232 (thử): PowerShell System.IO.Ports.SerialPort (src/day-rs232.ts)
```

Bun tự cắt yêu cầu tới máy chủ nhỏ sau 10 giây; `may-chu.ts` tắt giới hạn đó (`timeout(req, 0)`) vì gửi qua dây,
dò WiFi hay kho chậm có thể lâu hơn.

| Nơi | Có gì |
|---|---|
| `%APPDATA%\BeeftownCan\` | `cau-hinh.json` (IP cân, cổng, địa chỉ kho, các lần cân đổi địa chỉ, cổng COM lần thử trước), `phien.json` (đăng nhập), `loi.txt` (lỗi) |
| `Tài liệu\Beeftown Can\` | `A_000.TMS` (file gốc = bản gần nhất đã nạp vào cân), `tren-can.tsv`, `tem-da-tat.json`, `da-gui\` (mỗi lần gửi một bản), `cho-usb\` |

Thư mục `Tài liệu\Beeftown Can` dùng chung với `web/public/kho/can-wifi/Nap-Can-WiFi.ps1`.
**File .TMS có tên và mật khẩu WiFi của quán** — chỉ nằm trên máy này và gửi tới cân, không lên kho, không commit.

Máy chủ chỉ nghe `127.0.0.1` và mọi yêu cầu phải mang đúng mã bí mật (`?t=`), nên trang web lạ mở trên cùng máy không gọi được.

## Phát triển

```bash
cd can-app && npm ci
npx bun test/thu.ts              # cân giả, kho giả (test/kho-gia.ts), tem, danh sách hàng, tự gửi, máy quầy,
                                 # cân đổi địa chỉ (cân giả ở 127.0.0.37, .38…), dây RS232 (PowerShell giả), chạy cả src/main.ts
npx bun test/xem-giao-dien.ts    # mở giao diện với dữ liệu giả để xem / chụp màn hình (--vai nhan_vien_quay để xem như NV quầy;
                                 # --can-doi-dia-chi: lúc mở tự dò ra cân; --hai-can: WiFi có hai cân, hiện nút chọn)
npx bun scripts/dong-goi.ts      # ra dist/BeeftownCan.exe (~87 MB), đóng gói được từ Linux
```

- Cần bản web có `/kho-can.json` (`web/src/pages/kho-can.json.ts`) đã triển khai.
- Đóng gói trên Linux thì file .exe chưa có biểu tượng riêng (Bun chỉ gắn biểu tượng khi đóng gói trên Windows).
- `dist/` và `node_modules/` không vào repo. File .exe quá lớn để để trong repo hoặc trên web (Cloudflare giới hạn 25 MB một file) — gửi tay, hoặc đưa lên GitHub Releases.

## Chưa làm

- Xoá hàng qua WiFi: chưa biết lệnh xoá của cân.
- Đọc danh sách hàng từ cân qua WiFi (để khỏi cần file gốc từ USB lần đầu).
- Hạn dùng trên tem: chưa biết cột nào của dòng PLU (số ngày), nên chưa đặt hạn dùng theo từng món.
- Kéo thả vị trí ô, đổi cỡ chữ, thêm ô mới trên tem.
