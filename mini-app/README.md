# Beeftown Mini App: bán 6 phần thịt qua Zalo OA

Bản 1.0, dựng ngày 22/10/2026. Từ 22/10/2026 nằm trong repo `beeftown-stock`, thư mục `mini-app/`; mọi lệnh dưới đây chạy trong thư mục này.

## App làm gì

Có 4 màn hình:

1. **Mua thịt:** 6 phần thịt của quầy: Ribeye with Cap, Outside Skirt, Chadolbagi (đông lạnh), Top Blade, Galbisal, LA Galbi (đông lạnh). Khách chọn số khay cho từng phần.
2. **Đơn hàng:** khách chọn nhận tại quán hay giao tận nơi, chọn ngày giờ, nhập tên và số điện thoại (bắt buộc khi giao), chọn cách trả tiền, ghi chú.
3. **Gửi đơn qua Zalo:** app mở chat với OA "Nhà hàng Beeftown Hồ Tùng Mậu", tin đơn điền sẵn. Khách phải tự bấm Gửi thì quán mới nhận được.
4. **Thông tin:** cách mua, cách tính tiền, thịt mát và đông lạnh, địa chỉ, liên hệ, thông tin của khách, đơn vị bán hàng.

App không có máy chủ, không lưu dữ liệu của khách và không thu tiền trong app. Đơn tới OA dưới dạng tin nhắn. Nhân viên trả lời trong chat OA: báo số gam và tiền theo tem, gửi mã QR chuyển khoản hoặc hẹn trả khi nhận.

Tin nhắn mẫu:

```
ĐẶT THỊT MANG VỀ – BEEFTOWN
• Ribeye with Cap: 2 khay
• LA Galbi (đông lạnh): 1 khay
Tổng: 3 khay

Giao tới: 12 Nguyễn Huệ, phường Sài Gòn
Giờ nhận: khoảng 18:30, Thứ Sáu 13/11
Phí giao: nhờ quán báo
Người nhận: Anh Khánh · 0912 345 678
Thanh toán: trả khi nhận hàng

Nhờ quán soạn khay rồi báo số gam và tiền theo tem giúp mình.
```

Ảnh chụp các màn hình ở `tai-lieu/anh-chup/`.

## Sửa thông tin

- `src/cau-hinh.ts`: OA ID, cờ giá thử (`giaThu`), ngày bắt đầu nhận hàng (13/11/2026), khung giờ nhận (10:30–13:30 và 16:30–21:00), số phút soạn khay (60), giờ mở cửa, địa chỉ, hotline, thông tin người bán.
- `src/san-pham.ts`: giá cho 100 g của từng phần (để `null` thì app hiện "Báo giá khi xác nhận đơn"), tạm ngưng bán (`conHang: false`), mô tả, cách nướng.

**Giá hiện tại là giá thử** (Claude đặt 22/10/2026 để thử app, chưa phải giá của Sang): Ribeye with Cap 120.000 đ, Outside Skirt 110.000 đ, Chadolbagi 45.000 đ, Top Blade 65.000 đ, Galbisal 100.000 đ, LA Galbi 60.000 đ cho 100 g. Khi `giaThu: true`, app ghi "Giá thử" cạnh từng giá, hiện 1 dòng báo ở trang chủ, và tin đơn có thêm dòng "(Giá trong đơn là giá thử, chưa phải giá bán.)". Có giá thật thì thay số trong `san-pham.ts` và đổi `giaThu` thành `false`.

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
- `npm run kiem-tra`: chạy 11 kiểm tra cho giờ nhận, số điện thoại, nội dung tin và dòng giá thử (cần Node 22.6 trở lên).
- Chữ cấm: trong thư mục `crm` của repo, `node test/test-mini-app-chu.mjs` (cần `npm ci` ở `web` và `crm`). Kiểm thử này và `mini-app.yml` tự chạy trên GitHub mỗi PR.
- Bản build trong `www/` chỉ chạy dưới đường dẫn `/zapps/<Mini App ID>/` của Zalo. Mở thẳng `www/index.html` sẽ ra trang trắng; đó là cách router của zmp-ui chạy, không phải lỗi.

## Cần chốt trước khi phát hành

- **Sang:**
  - 4 phần ghi là thịt mát (Ribeye with Cap, Outside Skirt, Top Blade, Galbisal). App ghi theo textbook 02.06; Sang xác nhận.
  - Mô tả và cách nướng lấy từ file vận hành 02/09, riêng câu "Thịt sườn đã lóc xương" của Galbisal là Claude thêm; Sang đọc lại cả 6 thẻ.
  - Giá cho 100 g của 6 phần (thay giá thử, đổi `giaThu` thành `false`).
  - Khung giờ nhận và 60 phút soạn khay.
  - Giao tận nơi: ai giao, giao xa nhất bao nhiêu km, phí giao, túi giữ lạnh.
- **Luật sư:** Mini App có chức năng đặt hàng có phải thông báo với Bộ Công Thương theo Luật Thương mại điện tử 2025 và Nghị định 248/2026 không.
- **Nhân viên trực OA:** cách trả lời đơn (báo tiền theo tem, gửi QR, hẹn giờ) và ai trực chat trong giờ mở cửa.

## Ghi chú kỹ thuật

- React 18, zmp-ui 1.11.14, zmp-sdk 2.53.1, Vite 5, zmp-vite-plugin. Chữ Montserrat (giấy phép OFL), chỉ lấy bộ chữ Latin và tiếng Việt.
- Mã viết mới, không chép mẫu zaui của Zalo (giấy phép của mẫu chỉ cho thử nghiệm, phi thương mại).
- Biểu tượng vẽ bằng SVG trong app. Không dùng biểu tượng và snackbar của zmp-ui vì chúng tải phông từ máy chủ của Zalo.
- Logo tách từ file PNG trong thư mục Drive "LOGO BEEFTOWN" (21/10/2026), màu đỏ #BD0000.
- Đưa lên Zalo: `npm run deploy:thu` = `zmp deploy --testing --passive`. zmp-cli tự build (cần mạng tới Zalo) rồi tải thư mục `www` lên. File `zmp-cli.json` để zmp-cli nhận đây là dự án Zalo Mini App. Không dùng cờ `--existing`: cờ này lấy `app-config.json` ở thư mục gốc (danh sách file để trống theo mẫu của Zalo) và báo lỗi "No asset defined" (lỗi gặp ngày 22/10/2026).
- Dòng "Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED…" khi chạy zmp-cli là do chính zmp-cli bật, không phải lỗi của máy.
- Gửi đơn dùng `openChat({ type: "oa", id, message })`. Zalo cho điền sẵn tin, nhưng khách vẫn quyết định có gửi hay không.
- Thỏa thuận nhà phát triển của Zalo (cập nhật 25/09/2026): mỗi bản cập nhật tính năng hay giao diện phải được duyệt lại; Mini App phải hiện thông tin liên hệ; dữ liệu của Mini App phải xử lý và lưu trong lãnh thổ Việt Nam. Bản này không lưu dữ liệu nào.

## Thư mục

```
src/
  cau-hinh.ts      thông tin quán, giờ nhận, OA ID
  san-pham.ts      6 phần thịt và giá
  don.ts           giờ nhận, kiểm tra thông tin, nội dung tin nhắn
  zalo.ts          mở chat OA, quan tâm OA
  gio-hang.tsx     giỏ hàng (chỉ trong bộ nhớ)
  thong-bao.tsx    thông báo ngắn
  thanh-phan.tsx   đầu trang, nút số khay, thẻ phần thịt
  bieu-tuong.tsx   biểu tượng SVG
  trang/           4 màn hình
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
