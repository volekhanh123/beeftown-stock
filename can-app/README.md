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

Tên và giá hàng chỉ sửa ở kho (kho là gốc); chương trình không sửa tay SKU.

**Truy vết theo tảng:** phần cắt có **ô mã** (ví dụ 10011–10019) thì mỗi ô là một PLU trên cân. Khi bếp lóc
một tảng và bấm "Giao ô mã" trong kho, ô đó đổi tên thành "Thăn ngoại cắt lát #0142" ở lần gửi sau — tem in
ra có số tảng, FABi bán theo mã ô. Bật **Tự gửi xuống cân khi kho đổi** (Cài đặt) để chương trình tự gửi
mỗi phút khi kho có thêm / sửa (chỉ khi cửa sổ đang mở). Danh mục lấy từ `web/src/lib/kho/danh-muc-can.ts`,
dùng chung với màn Đồng bộ cân.

Phần tính "thêm / sửa / bỏ" là **đúng code của màn Đồng bộ cân** (`web/src/lib/kho/can-tma.ts`), nên hai nơi luôn ra cùng một kết quả.

## Tải BeeftownCan.exe về (không cần gõ lệnh)

GitHub tự đóng gói chương trình mỗi khi main có thay đổi cho Beeftown Cân. Cần đăng nhập GitHub bằng tài khoản vào
được repo này. File tải về là **file zip** (~38 MB): chuột phải → **Extract All…** (Giải nén tất cả) → được
`BeeftownCan.exe` (~83 MB), rồi làm tiếp như mục **Dùng** bên dưới.

**Bản dùng ở quán — Releases** (mỗi phiên bản một bản, giữ mãi):

1. Trang repo trên GitHub → cột bên phải, mục **Releases** → bấm bản mới nhất, ví dụ **Beeftown Cân 2.1.0**.
2. Mục **Assets** → bấm **BeeftownCan-2.1.0.zip**. Không bấm "Source code" — đó là mã nguồn, không chạy được.

Release chỉ có thêm khi số phiên bản tăng.

**Bản mới nhất trên main — tab Actions** (có cả những sửa đổi chưa lên số phiên bản):

1. Tab **Actions** → cột trái bấm **Đóng gói Beeftown Cân**.
2. Bấm lượt chạy trên cùng có dấu ✓ xanh và nhánh **main**.
3. Trang **Summary**: bấm dòng **⬇ Tải BeeftownCan-2.1.0**, hoặc kéo xuống mục **Artifacts** → bấm **BeeftownCan-2.1.0**.

Tab Actions chỉ giữ **một** bản chính thức, bản mới nhất: repo private có hạn mức dung lượng nên bản cũ tự xoá.
Dấu ✗ đỏ nghĩa là kiểm thử hoặc đóng gói hỏng, lượt đó không có file — báo người làm, tạm dùng bản ở Releases.

**Bản thử của một PR, trước khi gộp:**

1. Tab **Actions** → **Đóng gói Beeftown Cân** → nút **Run workflow** (bên phải).
2. Ô **Số PR muốn lấy bản thử** gõ số của PR (số sau dấu `#`, ví dụ `31`) → bấm nút xanh **Run workflow**.
3. Chờ chừng 3 phút, bấm lượt chạy mới, tải như bản trên main. Tên bản thử có chữ `thu` và số PR, ví dụ
   `BeeftownCan-2.1.0-thu-PR31-a1b2c3d`; giữ 7 ngày. Thử xong thì quay về bản ở Releases.

**Thay bản cũ ở quán:** đóng cửa sổ Beeftown Cân, chờ chừng 10 giây cho chương trình tắt hẳn, rồi chép file mới đè
lên file cũ. Cài đặt, đăng nhập, file gốc của cân không mất — chúng nằm ở `%APPDATA%` và `Tài liệu`, không nằm cạnh file .exe.

## Dùng

1. Chép `BeeftownCan.exe` (tải ở mục trên) vào máy tính ở quán (máy phải cùng WiFi với cân). Nháy đúp để mở.
   File không ký số: lần đầu Windows có thể báo *"Windows protected your PC"* → **More info** → **Run anyway**.
2. **Đăng nhập kho** bằng tài khoản kho (NV quầy dùng thẻ Quầy, Tảng & ô; gửi giá xuống cân, tem, mã giảm: quản lý hoặc chủ). Máy nhớ đăng nhập.
3. **Bắt đầu** (một lần): trên cân lưu dữ liệu ra USB (`Prog → ↓ V3 tới P4 → Accu/Confirm → Accu/Confirm → Amend`), chọn file `JHSCALE\A_000.TMS`.
4. Mỗi lần đổi giá / thêm món trong kho: mở chương trình → xem bảng thay đổi → **Gửi xuống cân** → gọi thử một hàng trên cân.
5. Đổi tem: thẻ **Mẫu tem** → bỏ chọn / chọn ô, sửa chữ → **Gửi tem xuống cân** → cân thử một món, in một tem xem đã đổi chưa. Nếu chưa đổi: **Lưu file nạp USB**.

Cân đổi địa chỉ (trên cân: `Prog → 4 → 2`) thì sửa ở **Cài đặt và việc khác**.

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
      └─ cân: TCP <IP cân>:33571 (src/nghiep-vu.ts → guiTcp)
```

| Nơi | Có gì |
|---|---|
| `%APPDATA%\BeeftownCan\` | `cau-hinh.json` (IP cân, cổng, địa chỉ kho), `phien.json` (đăng nhập), `loi.txt` (lỗi) |
| `Tài liệu\Beeftown Can\` | `A_000.TMS` (file gốc = bản gần nhất đã nạp vào cân), `tren-can.tsv`, `tem-da-tat.json`, `da-gui\` (mỗi lần gửi một bản), `cho-usb\` |

Thư mục `Tài liệu\Beeftown Can` dùng chung với `web/public/kho/can-wifi/Nap-Can-WiFi.ps1`.
**File .TMS có tên và mật khẩu WiFi của quán** — chỉ nằm trên máy này và gửi tới cân, không lên kho, không commit.

Máy chủ chỉ nghe `127.0.0.1` và mọi yêu cầu phải mang đúng mã bí mật (`?t=`), nên trang web lạ mở trên cùng máy không gọi được.

## Phát triển

```bash
cd can-app && npm ci
npx bun test/thu.ts              # 112 kiểm tra: cân giả, kho giả (test/kho-gia.ts), tem, danh sách hàng, tự gửi, máy quầy, chạy cả src/main.ts
npx bun test/xem-giao-dien.ts    # mở giao diện với dữ liệu giả để xem / chụp màn hình (--vai nhan_vien_quay để xem như NV quầy)
npx bun scripts/dong-goi.ts      # ra dist/BeeftownCan.exe (~87 MB), đóng gói được từ Linux
```

- Cần bản web có `/kho-can.json` (`web/src/pages/kho-can.json.ts`) đã triển khai.
- Đóng gói trên Linux thì file .exe chưa có biểu tượng riêng (Bun chỉ gắn biểu tượng khi đóng gói trên Windows).
- `dist/` và `node_modules/` không vào repo. File .exe quá lớn để để trong repo hoặc trên web (Cloudflare giới hạn 25 MB một file) — GitHub đóng gói và giữ nó (mục **Tải BeeftownCan.exe về** ở trên).
- `.github/workflows/dong-goi-can.yml`: main đổi `can-app/` hoặc `web/src/lib/` (.exe gói cả mã dùng chung ở đó) →
  `npx bun test/thu.ts` → đóng gói → artifact `BeeftownCan-<PHIEN_BAN>`, xoá artifact chính thức cũ; phiên bản chưa có
  Release thì tạo Release, tag `can-v<PHIEN_BAN>`. PR đụng `can-app/` chỉ kiểm đóng gói, không tải lên. Chạy tay: gõ số
  PR, hoặc để trống và chọn nhánh ở *Use workflow from* (nhánh đó phải có file workflow này). Muốn Release mới thì tăng
  `PHIEN_BAN` trong `src/main.ts`, giữ đúng dạng `const PHIEN_BAN = '2.1.0';` — workflow đọc dòng này (`test-quy-trinh.mjs` kiểm).

## Chưa làm

- Xoá hàng qua WiFi: chưa biết lệnh xoá của cân.
- Đọc danh sách hàng từ cân qua WiFi (để khỏi cần file gốc từ USB lần đầu).
- Hạn dùng trên tem: chưa biết cột nào của dòng PLU (số ngày), nên chưa đặt hạn dùng theo từng món.
- Kéo thả vị trí ô, đổi cỡ chữ, thêm ô mới trên tem.
