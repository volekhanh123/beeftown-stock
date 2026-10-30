# Beeftown Mini App: bán 6 phần thịt qua Zalo OA

Bản 1.0, dựng ngày 22/10/2026. Từ 22/10/2026 nằm trong repo `beeftown-stock`, thư mục `mini-app/`; mọi lệnh dưới đây chạy trong thư mục này.

## App làm gì

Có 5 màn hình (màn Trả tiền chỉ có khi đã khai máy chủ đơn, xem "Đặt và trả tiền trước" dưới đây):

1. **Mua thịt:** 6 phần thịt của quầy: Ribeye with Cap, Outside Skirt, Chadolbagi (đông lạnh), Top Blade, Galbisal, LA Galbi (đông lạnh). Khách chọn số khay cho từng phần. Bán theo khay, giá cố định: mỗi khay khoảng 150 g, giá không đổi theo số gam thật; app tính sẵn tổng tiền thịt. Phần nào quầy đã hết thì thẻ hiện "Tạm hết" (đọc từ kho qua website `beeftown.vn`, khi chủ đã bật; xem `web/KHO.md` mục 3r của repo); app không hiện số khay.
2. **Đơn hàng:** khách chọn nhận tại quán hay giao tận nơi, chọn ngày giờ, nhập tên và số điện thoại (bắt buộc khi giao), chọn cách trả tiền, ghi chú.
3. **Gửi đơn qua Zalo:** app mở chat với OA "Nhà hàng Beeftown Hồ Tùng Mậu", tin đơn điền sẵn. Khách phải tự bấm Gửi thì quán mới nhận được.
4. **Thông tin:** cách mua, cách tính tiền, thịt mát và đông lạnh, địa chỉ, liên hệ, thông tin của khách, đơn vị bán hàng.
5. **Trả tiền** (khi đã khai máy chủ đơn): mã QR chuyển khoản đúng số tiền, chép số tài khoản / số tiền / nội dung, app tự cập nhật khi quán nhận đủ tiền.

Khi chưa khai máy chủ đơn (`diaChiMayChuDon` trong `src/cau-hinh.ts` để trống, như hiện nay): app không có máy chủ, không lưu dữ liệu của khách và không thu tiền trong app. Đơn tới OA dưới dạng tin nhắn. Nhân viên trả lời trong chat OA: xác nhận đơn và tổng tiền (đơn giao tận nơi cộng phí giao), gửi mã QR chuyển khoản hoặc hẹn trả khi nhận.

Tin nhắn mẫu:

```
ĐẶT THỊT MANG VỀ – BEEFTOWN
• Ribeye with Cap (khay ~150 g): 2 × 300.000 đ = 600.000 đ
• LA Galbi (đông lạnh, khay ~150 g): 1 × 150.000 đ = 150.000 đ
Tổng: 3 khay · 750.000 đ tiền thịt
(Giá trong đơn là giá thử, chưa phải giá bán.)

Giao tới: 12 Nguyễn Huệ, phường Sài Gòn
Giờ nhận: khoảng 18:30, Thứ Sáu 13/11
Phí giao: nhờ quán báo
Người nhận: Anh Khánh · 0912 345 678
Thanh toán: trả khi nhận hàng

Nhờ quán soạn khay và xác nhận đơn giúp mình.
```

Ảnh chụp các màn hình ở `tai-lieu/anh-chup/` (chụp trước ngày 22/10/2026, còn giá theo 100 g: chụp lại khi có giá thật).

## Sửa thông tin

- `src/cau-hinh.ts`: OA ID, cờ giá thử (`giaThu`), ngày bắt đầu nhận hàng (13/11/2026), khung giờ nhận (10:30–13:30 và 16:30–21:00), số phút soạn khay (60), giờ mở cửa, địa chỉ, hotline, thông tin người bán.
- `src/san-pham.ts`: số gam khoảng của một khay (`soGamKhay`) và giá một khay (`giaMoiKhay`; để `null` thì app hiện "báo giá khi xác nhận đơn"), tạm ngưng bán (`conHang: false`), mô tả, cách nướng.

**Bán theo khay, giá cố định** (Khánh quyết 22/10/2026): không bán đúng số gam; giá một khay không đổi theo số gam thật của khay.

**Số gam và giá hiện tại là số thử** (Claude đặt 22/10/2026 để thử app, chưa phải số của Sang), mỗi khay ~150 g: Ribeye with Cap 300.000 đ (theo ví dụ của Khánh), Outside Skirt 275.000 đ, Chadolbagi 115.000 đ, Top Blade 165.000 đ, Galbisal 250.000 đ, LA Galbi 150.000 đ một khay (giữ tỷ lệ với giá thử theo 100 g trước đó). Khi `giaThu: true`, app ghi "Giá thử" cạnh từng giá, hiện 1 dòng báo ở trang chủ, và tin đơn có thêm dòng "(Giá trong đơn là giá thử, chưa phải giá bán.)". Có số thật thì thay `soGamKhay`, `giaMoiKhay` trong `san-pham.ts` và đổi `giaThu` thành `false`.

Mỗi lần sửa phải build, đưa lên lại và gửi Zalo duyệt lại.

## Đưa lên Zalo

Tình trạng 22/10/2026:

- OA ID đã điền: `3030027075662095415` (OA "Nhà hàng Beeftown Hồ Tùng Mậu", gói OA Tăng trưởng).
- Mini App "Beeftown" đã tạo trên Mini App Center, trong Zalo App "SLK Group 2210" (loại hình Doanh nghiệp, danh mục F&B → Kinh doanh/Quản lí dịch vụ ăn uống). **Mini App ID: `2858300068641327950`**. `dua-len-zalo.cmd` tự ghi số này vào file `.env` nếu chưa có file.
- Máy chủ của Claude không vào được máy chủ của Zalo, nên lệnh đưa lên phải chạy trên máy tính có mạng thường.

Đưa bản thử lên từ máy Windows (trong bản clone của repo: thư mục `mini-app`). Lần đầu ở bản clone: chép file `.env` từ `Documentseeftown-mini-app` sang `mini-app`, hoặc đăng nhập lại ở bước 2. Git không bao giờ nhận file `.env`.

1. Bấm đúp `dua-len-zalo.cmd`. Máy cần Node.js 18 trở lên (bản LTS ở nodejs.org). Lần đầu cài thư viện mất 1–3 phút.
2. Đăng nhập: thấy dòng "Choose a Login Method" thì bấm Enter (chọn "Login Via QR Code With Zalo App"), mở app Zalo trên điện thoại quét mã QR trong cửa sổ, bấm xác nhận. Có khoảng 2 phút. Khóa đăng nhập lưu trong file `.env`; đừng gửi file này cho ai.
3. Lệnh tự build rồi đưa lên bản thử (testing). Thấy "Deploy Done!" là xong; quét mã QR hiện ra bằng Zalo để mở bản thử.
4. Thử trên điện thoại: chọn 2 phần thịt, gửi đơn, xem tin có vào hộp chat của OA không.

Máy Mac: chạy `npm install`, `npm run login`, `npm run deploy:thu` trong thư mục này.

Bản thử chỉ mở được bằng tài khoản Zalo là Admin, Developer hoặc người thử của Mini App. Thêm Sang, John ở Mini App Center → Quản lý → Phân quyền thành viên.

Phát hành cho khách (sau khi chốt các mục ở phần dưới):

1. Mini App Center → Quản lý → Xét duyệt phiên bản: gửi duyệt bản đã thử.
2. Quản lý xác thực: làm xác thực KYB. Chưa xong KYB thì Mini App không hiện trong tìm kiếm của Zalo.
3. Thông tin ứng dụng: bật "Hiển thị công khai", điền email liên hệ, xem lại Điều khoản sử dụng.
4. Ở OA: Quản lý → Trang thông tin OA → nút thêm → chọn Mini App Beeftown.

## Chạy thử trên máy tính

- `npm run dev`, rồi mở http://localhost:3000. Ngoài Zalo, nút "Gửi đơn qua Zalo" hiện tin nhắn để xem chứ không mở chat.
- `npm run kiem-tra`: kiểm tra giờ nhận, số điện thoại, nội dung tin, tổng tiền và dòng giá thử (cần Node 22.6 trở lên).
- Chữ cấm: trong thư mục `crm` của repo, `node test/test-mini-app-chu.mjs` (cần `npm ci` ở `web` và `crm`). Kiểm thử này và `mini-app.yml` tự chạy trên GitHub mỗi PR.
- Bản build trong `www/` chỉ chạy dưới đường dẫn `/zapps/<Mini App ID>/` của Zalo. Mở thẳng `www/index.html` sẽ ra trang trắng; đó là cách router của zmp-ui chạy, không phải lỗi.

## Đặt và trả tiền trước (máy chủ đơn)

Khánh quyết 29/10/2026: đặt hàng tự động hoàn toàn, khách trả trước trong app, thu tiền qua SePay. Máy chủ đơn nằm ở
thư mục `may-chu-don/` của repo (chạy ở Việt Nam). Khi `diaChiMayChuDon` trong `src/cau-hinh.ts` có địa chỉ:

- Đơn hàng: chỉ nhận tại quán; tên và số điện thoại bắt buộc; nút "Gửi đơn và trả tiền" gửi đơn lên máy chủ. Máy chủ
  tự tính tiền theo bảng giá, app chỉ gửi mã phần thịt và số khay. Bấm hai lần, mạng chập chờn rồi gửi lại: vẫn một đơn.
- Trả tiền: mã QR vẽ ngay trong app từ chuỗi VietQR máy chủ gửi; nút "Lưu ảnh mã QR" (trong Zalo) để khách trả bằng
  app ngân hàng trên chính điện thoại đó; chép số tài khoản, số tiền, nội dung "BT" + mã đơn. App hỏi máy chủ 4 giây một
  lần và mỗi khi khách quay lại app; chỉ hiện "Quán đã nhận đủ tiền" khi máy chủ đã ghi đơn sang đã trả tiền.
- Chuyển thiếu: app hiện số đã nhận và mã mới cho phần còn thiếu. Chuyển dư: đơn vẫn soạn, quán hoàn phần dư. Quá 30
  phút chưa đủ tiền: đơn tự hủy; tiền về đủ sau đó vẫn tính là đã trả (Khánh chốt hai điều này 30/10/2026).
- App giữ mã đơn và khóa xem đơn trên máy 2 ngày (không tên, không số điện thoại) để mở lại đúng đơn khi máy đóng Mini
  App lúc khách ở app ngân hàng. Trang chủ hiện "Đơn #… của bạn".

### Thử đặt và trả tiền với máy chủ đơn

Không cần sửa `cau-hinh.ts`. Trên laptop (Node.js 24):

1. Chạy máy chủ đơn với một tài khoản thử, cho trả theo giá thử — `may-chu-don/README.md`, "Chạy thử trên laptop",
   thêm các biến `NGAN_HANG_BIN=970415`, `TEN_NGAN_HANG=VietinBank`, `SO_TAI_KHOAN=<số bất kỳ 6–19 chữ số>`,
   `TEN_TAI_KHOAN=CONG TY TNHH SLK GROUP`, `CHO_TRA_GIA_THU=1`.
2. Trong thư mục `mini-app`, chạy app trỏ vào máy chủ đó (PowerShell):

   ```
   $env:VITE_DIA_CHI_MAY_CHU_DON="http://127.0.0.1:8787"; npm run dev
   ```

3. Mở http://localhost:3000, chọn khay, gửi đơn: thấy màn Trả tiền có mã QR. Quét mã bằng app ngân hàng thì app ngân
   hàng hiện đúng số tài khoản, số tiền, nội dung (đừng chuyển vào tài khoản thử). Màn hình quầy chưa thấy đơn này vì
   đơn chưa trả tiền.

Tiền về thật chỉ thử được khi máy chủ đơn có HTTPS công khai và đã cài SePay (`may-chu-don/README.md`, "Cài SePay").
Bản thử trên Zalo chỉ gọi được máy chủ có HTTPS và tên miền đã khai ở Mini App Center → Cấu hình API Domains; đưa bản
thử có máy chủ đơn lên Zalo: đặt `VITE_DIA_CHI_MAY_CHU_DON` khi chạy `npm run deploy:thu`, hoặc điền `diaChiMayChuDon`.

## Cần chốt trước khi phát hành

- **Sang:**
  - 4 phần ghi là thịt mát (Ribeye with Cap, Outside Skirt, Top Blade, Galbisal). App ghi theo textbook 02.06; Sang xác nhận.
  - Mô tả và cách nướng lấy từ file vận hành 02/09, riêng câu "Thịt sườn đã lóc xương" của Galbisal là Claude thêm; Sang đọc lại cả 6 thẻ.
  - Số gam khoảng và giá một khay của 6 phần (thay số thử, đổi `giaThu` thành `false`).
  - Khay bán qua app đóng riêng, hay cả quầy bán theo khay giá cố định. Quầy vẫn tính theo kg thì cùng một khay có 2 giá (khay 162 g theo giá 2.000 đ/g là 324.000 đ ở quầy, 300.000 đ trên app).
  - Khung giờ nhận và 60 phút soạn khay.
  - Giao tận nơi: ai giao, giao xa nhất bao nhiêu km, phí giao, túi giữ lạnh.
- **Luật sư:**
  - Mini App có chức năng đặt hàng có phải thông báo với Bộ Công Thương theo Luật Thương mại điện tử 2025 và Nghị định 248/2026 không.
  - Khay bán giá cố định ghi định lượng thế nào ("~150 g" hay "từ 150 g") và được lệch bao nhiêu gam theo quy định đo lường hàng đóng gói sẵn.
- **Nhân viên trực OA:** cách trả lời đơn (xác nhận đơn và tổng tiền, báo phí giao, gửi QR, hẹn giờ) và ai trực chat trong giờ mở cửa.

## Ghi chú kỹ thuật

- React 18, zmp-ui 1.11.14, zmp-sdk 2.53.1, Vite 5, zmp-vite-plugin. Chữ Montserrat (giấy phép OFL), chỉ lấy bộ chữ Latin và tiếng Việt.
- Mã viết mới, không chép mẫu zaui của Zalo (giấy phép của mẫu chỉ cho thử nghiệm, phi thương mại).
- Biểu tượng vẽ bằng SVG trong app. Không dùng biểu tượng và snackbar của zmp-ui vì chúng tải phông từ máy chủ của Zalo.
- Logo tách từ file PNG trong thư mục Drive "LOGO BEEFTOWN" (21/10/2026), màu đỏ #BD0000.
- Đưa lên Zalo: `npm run deploy:thu` = `zmp deploy --testing --passive`. zmp-cli tự build (cần mạng tới Zalo) rồi tải thư mục `www` lên. File `zmp-cli.json` để zmp-cli nhận đây là dự án Zalo Mini App. Không dùng cờ `--existing`: cờ này lấy `app-config.json` ở thư mục gốc (danh sách file để trống theo mẫu của Zalo) và báo lỗi "No asset defined" (lỗi gặp ngày 22/10/2026).
- Dòng "Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED…" khi chạy zmp-cli là do chính zmp-cli bật, không phải lỗi của máy.
- Gửi đơn dùng `openChat({ type: "oa", id, message })`. Zalo cho điền sẵn tin, nhưng khách vẫn quyết định có gửi hay không.
- Thỏa thuận nhà phát triển của Zalo (cập nhật 25/09/2026): mỗi bản cập nhật tính năng hay giao diện phải được duyệt lại; Mini App phải hiện thông tin liên hệ; dữ liệu của Mini App phải xử lý và lưu trong lãnh thổ Việt Nam. Khi chưa khai máy chủ đơn, app không lưu dữ liệu nào; khi đã khai, tên, số điện thoại và đơn lưu ở máy chủ đơn đặt tại Việt Nam.
- Mã QR vẽ bằng thư viện `qrcode` 1.5.4 (giấy phép MIT), cùng bản máy chủ đơn dùng.

## Thư mục

```
src/
  cau-hinh.ts      thông tin quán, giờ nhận, OA ID
  san-pham.ts      6 phần thịt và giá
  don.ts           giờ nhận, kiểm tra thông tin, nội dung tin nhắn
  zalo.ts          mở chat OA, quan tâm OA, lưu ảnh mã QR vào máy
  tra-truoc.ts     đặt và trả tiền trước: gửi đơn, đọc trạng thái, màn hiện cho khách
  may-chu-don.ts   địa chỉ máy chủ đơn, fetch thật
  anh-qr.ts        vẽ mã QR chuyển khoản
  gio-hang.tsx     giỏ hàng (chỉ trong bộ nhớ), đơn trả trước vừa đặt
  thong-bao.tsx    thông báo ngắn
  thanh-phan.tsx   đầu trang, nút số khay, thẻ phần thịt
  bieu-tuong.tsx   biểu tượng SVG
  trang/           5 màn hình
scripts/kiem-tra-don.ts
tai-lieu/          biểu tượng 512 × 512, banner 1920 × 1080, ảnh chụp màn hình
dua-len-zalo.cmd   bấm đúp trên Windows: cài thư viện, đăng nhập Zalo, đưa bản thử lên
zmp-cli.json       đánh dấu dự án Zalo Mini App cho zmp-cli
CLAUDE.md          ghi chú cho Claude Code: tình trạng, quy tắc, việc tiếp theo
.env               Mini App ID (và khóa đăng nhập sau khi đăng nhập; không gửi file này cho ai)
```

## Nguồn

- Thỏa thuận nhà phát triển Zalo Mini App: https://miniapp.zaloplatforms.com/documents/zalo-mini-app-developer-program-agreement
- Trang thông tin OA (nút thêm: Gọi thoại, Mini App, Website): https://oa.zalo.me/home/documents/guides/trang-thong-tin-oa_73
- `openChat` và `followOA`: ghi chú trong gói zmp-sdk 2.53.1
