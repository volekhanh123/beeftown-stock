# Beeftown Mini App: đọc trước khi làm

Zalo Mini App bán 6 phần thịt mang về của nhà hàng Beeftown (63 Hồ Tùng Mậu, phường Sài Gòn, TP.HCM). Khách chọn số khay (bán theo khay, giá cố định), app mở chat với Zalo OA của quán và điền sẵn tin đơn có tổng tiền; khách tự bấm Gửi. Không máy chủ, không lưu dữ liệu khách, không thu tiền trong app.

- Người giao việc: Khánh (Võ Lê Khánh), CMO và partner của Beeftown. Pháp nhân bán hàng: Công ty TNHH SLK Group, mã số doanh nghiệp 0319712805.
- Bản 1.0 do Claude dựng ngày 22/10/2026 trong dự án "FnB Investment" trên claude.ai, rồi chuyển sang Claude Code cùng ngày lúc 13:00. Ghi chú đầy đủ của dự án: tài liệu `claude/zalo-oa-beeftown.md` trong project "FnB Investment".
- Hướng dẫn cho người (tiếng Việt, từng bước): `README.md`.
- Từ 22/10/2026 mã nằm trong repo `volekhanh123/beeftown-stock`, thư mục `mini-app/`. Thư mục cũ `Documents\beeftown-mini-app` trên máy Khánh chỉ để lưu, không sửa ở đó nữa. Quy trình của repo áp dụng cho Mini App: `CLAUDE.md` gốc (9 mục trong mô tả PR, `/code-review` trước khi mở PR, không nới kiểm thử). Mọi lệnh ở mục "Lệnh" chạy trong `mini-app/`.

## Tình trạng 22/10/2026, 13:00

- OA "Nhà hàng Beeftown Hồ Tùng Mậu" đã xác thực. OA ID `3030027075662095415`, đã điền trong `src/cau-hinh.ts`. Gói OA Tăng trưởng.
- Mini App "Beeftown", **Mini App ID `2858300068641327950`**, nằm trong Zalo App "SLK Group 2210" (ID 2513314422490328273). Loại hình Doanh nghiệp/Hộ kinh doanh (không đổi được), danh mục F&B → Kinh doanh/Quản lí dịch vụ ăn uống. Trang quản lý: https://miniapp.zaloplatforms.com/miniapp/2858300068641327950/statistic/overview
- Đăng nhập zmp-cli đã xong: file `.env` có `APP_ID` và `ZMP_TOKEN`. File này nằm ở `Documents\beeftown-mini-app\.env`, **không vào git** (`.gitignore` chặn, `test-quy-trinh.mjs` kiểm). Muốn đưa lên từ bản clone của repo: Khánh chép file đó sang `mini-app\.env`, hoặc chạy lại `npx zmp login` trong `mini-app\`.
- **Bản thử phiên bản 2** đã đưa lên 22/10 16:33 bằng `npm run deploy:thu` (kiem-tra 11/11, `tsc` đạt). Link mở bản thử: `https://zalo.me/s/2858300068641327950/?env=TESTING&version=2`. Lượt Testing tháng 10: 4/60. Chưa đối chiếu ở Mini App Center → Danh sách phiên bản. Lần 11:40 lỗi "No asset defined" (mục "Lỗi đã gặp"), đã sửa lúc 11:58.
- Xác thực Mini App: bước chủ sở hữu đã xong (xác thực bằng OA, 22/10 11:33). Còn thiếu giấy tờ kinh doanh: giấy xác nhận ngành nghề kinh doanh phù hợp (dịch vụ ăn uống) và giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm. Thiếu 2 giấy này thì không gửi Zalo duyệt phiên bản được. Bản thử (testing) vẫn mở được bằng tài khoản Admin, Developer, người thử.
- **Bán theo khay, giá cố định** (Khánh quyết 22/10/2026): không bán đúng số gam. Mỗi khay khoảng `soGamKhay` gam (đang để ~150 g), giá `giaMoiKhay` không đổi theo số gam thật; tin đơn ghi từng dòng "số khay × giá = tiền" và tổng tiền thịt (chưa gồm phí giao). Bản thử phiên bản 2 trên Zalo còn bán theo giá/100 g.
- Số gam và giá đang là **số thử** (`giaThu: true` trong `src/cau-hinh.ts`), chưa phải số của Sang. Giá ghi dạng "120.000 đ" (có dấu cách, như repo) từ 22/10/2026; bản thử phiên bản 2 trên Zalo còn ghi "120.000đ".
- **Còn hàng theo kho** (bước 2, 23/10/2026): app hỏi `https://beeftown.vn/mini-app/con-hang.json` (`diaChiConHang` trong `src/cau-hinh.ts`) khi mở và khi khách quay lại app sau 60 giây. Kho báo `het` → thẻ hiện "Tạm hết", không thêm được khay; phần đã chọn mà vừa hết thì thẻ và màn đơn hàng ghi "Phần này vừa hết ở quầy; quán báo lại khi xác nhận đơn.", tin đơn ghi thêm "— app báo quầy vừa hết"; `sap_het` hiện như còn hàng (repo cấm câu khan hiếm kiểu "sắp hết"); không biết → hiện như cũ. Chưa chạy được thật cho tới khi: chạy migration 0093 và deploy web; gắn ô "Phần thịt trên Mini App Zalo" cho mặt hàng ở màn mặt hàng của kho; khai `beeftown.vn` ở Mini App Center → Cấu hình API Domains; chủ bật công tắc `mini_app_hien_con_hang` ở `/noi-bo` (mặc định tắt). Chi tiết: `web/KHO.md` mục 3r.
- Màu: Khánh chốt ngày 22/10/2026 bảng đỏ `#BD0000`, đen `#000000`, trắng `#FFFFFF`, bỏ Cream, Marigold, Warm Stone (`THUONG-HIEU.md` mục 0 của repo). `src/styles.css` dùng thêm 7 màu pha. Đỏ đậm và các xám (nền, vạch, chữ phụ) Khánh duyệt ngày 25/10/2026 (câu 1 ở mục đó); hai đỏ nhạt `#fff1f1`, `#d9a3a3` và chữ `#111111` chưa nằm trong câu trả lời — chốt cùng PR đổi màu, đừng dùng thêm chỗ mới. Website và Beeftown Cân còn màu cũ tới PR đổi màu.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm install` | Cài thư viện |
| `npm run dev` | Chạy thử ở http://localhost:3000. Ngoài Zalo, nút "Gửi đơn qua Zalo" hiện tin nhắn thay vì mở chat |
| `npm run kiem-tra` | Kiểm tra giờ nhận, số điện thoại, nội dung tin, tổng tiền, dòng giá thử, đọc còn hàng (cần Node 22.6 trở lên) |
| `npm run build` | `tsc --noEmit && vite build`. Bản build trong `www/` chỉ chạy dưới `/zapps/<APP_ID>/` |
| `npm run deploy:thu` | `zmp deploy --testing --passive --desc "..."`. zmp-cli tự build, rồi tải `www/` lên. In "Deploy Done!", số phiên bản và mã QR mở bản thử |
| `npx zmp login` | Đăng nhập lại khi khóa hết hạn. Phải chọn cách đăng nhập và quét mã QR bằng app Zalo, nên để Khánh tự chạy trong cửa sổ dòng lệnh (hoặc bấm đúp `dua-len-zalo.cmd`) |

Trước mỗi lần đưa lên: `npm run kiem-tra`, `npx tsc --noEmit` và (trong `crm/`) `node test/test-mini-app-chu.mjs` phải đạt.

Kiểm thử trong repo:

- `.github/workflows/mini-app.yml`: mỗi PR hay commit lên main đổi `mini-app/` → `npm ci`, `npm run kiem-tra`, `tsc`, `vite build` (không có `.env`, không đưa lên Zalo). Workflow riêng: Mini App đỏ không khóa deploy website.
- `crm/test/test-mini-app-chu.mjs` (chạy trong `npm test` của `crm/`, mỗi PR): chữ khách thấy (mã nguồn bỏ chú thích, 6 phần thịt, cấu hình, tin đơn) không dính chữ cấm của `web/src/lib/chuoi-cam.js` và chữ Khánh dặn tránh; giá dạng "000.000 đ"; mỗi dòng "số khay × giá = tiền" đúng phép nhân và dòng tổng bằng tổng các dòng; tin có giá phải kèm dòng giá thử khi `giaThu: true`.
- `crm/test/test-quy-trinh.mjs`: file mới trong `mini-app/` phải có dòng mở trong `.gitignore` gốc; `.env`, `www/`, `node_modules/` không vào git; workflow đủ bước.

## Cấu trúc

```
src/cau-hinh.ts      OA ID, cờ giá thử, ngày bắt đầu nhận hàng, khung giờ nhận, giờ mở cửa, địa chỉ, người bán
src/san-pham.ts      6 phần thịt: tên, thịt mát / đông lạnh, mô tả, cách nướng, số gam khoảng và giá một khay
src/don.ts           logic thuần (không React, không Zalo): ngày giờ nhận, kiểm tra, soạn tin đơn
src/con-hang.ts      logic thuần: đọc còn hàng từ website (hỏng thì {}), trạng thái hiện cho từng phần thịt
src/con-hang-kho.tsx giữ trạng thái còn hàng trong lúc app mở, đọc lại sau 60 giây
src/zalo.ts          openChat, followOA
src/gio-hang.tsx     giỏ hàng trong bộ nhớ
src/thong-bao.tsx    thông báo ngắn tự làm
src/thanh-phan.tsx   đầu trang, nút số khay, thẻ phần thịt, giá, dòng báo giá thử
src/bieu-tuong.tsx   biểu tượng SVG
src/trang/           4 màn hình: trang-chu, don-hang, da-gui, thong-tin
scripts/kiem-tra-don.ts
tai-lieu/            biểu tượng 512 × 512, banner 1920 × 1080, 10 ảnh chụp màn hình
app-config.json      cấu hình Mini App (danh sách file để trống theo mẫu của Zalo, đừng điền tay)
zmp-cli.json         đánh dấu dự án Zalo Mini App cho zmp-cli
dua-len-zalo.cmd     cho Khánh bấm đúp trên Windows: cài thư viện, đăng nhập, đưa bản thử lên
.gitattributes       giữ dua-len-zalo.cmd xuống dòng CRLF (cmd.exe) trên mọi máy
.gitignore           node_modules, www, .env (repo gốc cũng chặn; file mới phải mở trong .gitignore gốc)
```

## Cách app chạy

- Gửi đơn: `openChat({ type: "oa", id, message })` của zmp-sdk 2.53.1 (điền sẵn tin từ SDK 2.20.0); khách vẫn tự bấm Gửi. Quan tâm OA: `followOA({ id })`. Quyền 44 (mở chat) và 56 (yêu cầu theo dõi OA) đã cấp mặc định.
- Nhận biết đang ở trong Zalo: `/zalo/i.test(navigator.userAgent)`.
- Router: `ZMPRouter` của zmp-ui đặt basename `/zapps/${window.APP_ID}` ở bản production.
- Không dùng `Icon` và `Snackbar` của zmp-ui vì chúng tải phông từ h5.zadn.vn. Biểu tượng vẽ SVG, thông báo tự làm.
- Nếu `oaId` để trống, Vite bỏ hẳn đoạn gọi `openChat` khỏi bản build. Không đưa lên bản nào có `oaId` trống.
- Mã viết mới, không chép mẫu zaui của Zalo (giấy phép mẫu chỉ cho thử nghiệm, phi thương mại).
- Đổi giá: thay `soGamKhay`, `giaMoiKhay` trong `src/san-pham.ts`, đổi `giaThu` thành `false`, chạy kiểm tra, đưa lên lại. Tổng tiền tính ở `tongTienThit` (`src/don.ts`); phần chưa có giá thì tổng ghi "quán báo khi xác nhận".

## Lỗi đã gặp

- **"No asset defined. Please make sure that you have declared assets to load in `listSyncJS`, `listAsyncJS`, and `listCSS`."** Nguyên nhân: lệnh cũ dùng cờ `--existing` (dự án tự dựng). Ở chế độ đó zmp-cli-core đọc `app-config.json` ở thư mục gốc, nơi danh sách file để trống. Đã sửa: thêm `zmp-cli.json` (giống mẫu zaui-coffee, bỏ trường `cwd` vì trường này đè lên thư mục làm việc) và bỏ `--existing`. Không thêm lại `--existing`.
- **`npm error ERESOLVE could not resolve` … `peer vite@"^4.2.0 || ^5.0.0" from zmp-vite-plugin`** (26–29/10/2026). Nguyên nhân: PR #102 của Dependabot nâng vite 5.4.21 → 8.3.4 và được gộp khi CI "Mini App Zalo" đỏ (CI "Kiểm thử" xanh vì không cài `mini-app/`). zmp-vite-plugin 1.1.6, bản mới nhất của Zalo, chỉ nhận vite 4–5; `dua-len-zalo.cmd` dừng ở bước [1/3]. Đã sửa: vite về 5.4.21; `.github/dependabot.yml` chặn vite và @vitejs/plugin-react từ bản 6, react, react-dom và kiểu của chúng từ bản 19 (zmp-ui 1.11.14 chỉ chạy với React 16–18; PR #100 nâng React 19 cũng đỏ); `crm/test/test-mini-app-thu-vien.mjs` (trong `npm test`, CI "Kiểm thử") đỏ khi peer của thư viện trực tiếp lệch. PR nâng thư viện của Mini App: CI "Mini App Zalo" xanh mới gộp.
- **`npm ci` báo "Missing: type-fest@0.13.1 from lock file"** khi máy dùng npm 10 (đi kèm Node 22). CI dùng Node 24 (npm 11) thì cài được. Máy mới cài Node 24 LTS.
- **"Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0'…"**: zmp-cli tự bật, bỏ qua.
- Máy chủ của Claude trên claude.ai không vào được các tên miền của Zalo, nên phiên đó không đưa lên được. Claude Code trên máy Khánh dùng mạng thường, vào được.

## Quy tắc của Zalo phải giữ

Thỏa thuận nhà phát triển Zalo Mini App, cập nhật 25/09/2026: https://miniapp.zaloplatforms.com/documents/zalo-mini-app-developer-program-agreement

- Mỗi lần đổi tính năng hoặc giao diện phải gửi Zalo duyệt lại (Điều 5.2b).
- Dữ liệu của Mini App phải xử lý, lưu trong lãnh thổ Việt Nam (Điều 5.3.3b). Cấm nhận dữ liệu cá nhân từ Zalo khi hệ thống đặt ngoài Việt Nam (Điều 7.5). Supabase của Beeftown (Singapore) và Cloudflare không dùng cho dữ liệu khách của Mini App.
- Mini App phải hiện thông tin liên hệ (Điều 5.5). Màn hình Thông tin đang có: chat với quán, địa chỉ, website, đơn vị bán hàng. Hotline để trống trong `cau-hinh.ts`.
- Giới hạn đưa lên: bản Development tối đa 300 phiên bản/tháng, bản Testing tối đa 60 phiên bản/tháng.
- Giấy tờ xác thực: ảnh chụp hoặc scan từ bản gốc, không nhận bản photo kể cả bản công chứng; JPG, PNG, PDF; tối đa 5 MB mỗi file, 20 file, 3 lượt gửi mỗi ngày.

## Quy tắc chữ và thương hiệu

- Viết tiếng Việt theo quy tắc từ ngữ của Khánh: câu thường, có số, không ẩn dụ. Không dùng: nút thắt, đầu phễu, nước rút, dựng nền, hệ hạng, xoay trục, cổng số liệu, kích hoạt, leads, seeding, broadcast, footage, creative, camp, nghiệm thu. Số kiểu Việt Nam: 84.500 đ (giá có dấu cách trước chữ đ, như repo), 42,6%, ngày dd/mm. Việc cần làm ghi đủ 4 phần: động từ, con số, ai làm, hạn ngày.
- Beeftown là nhà hàng chuyên bò (Beef Specialty Restaurant). Không viết: Korean BBQ, nướng Hàn, buffet, rẻ, cao cấp, ngon nhất, số một.
- Chadolbagi và LA Galbi là thịt đông lạnh. Không gọi chung cả tủ là thịt mát.
- Màu: đỏ `#BD0000`, đen, trắng (Khánh chốt 22/10/2026, `THUONG-HIEU.md` mục 0 của repo). Chữ Montserrat (giấy phép OFL, chỉ các bộ latin, latin-ext, vietnamese). Câu khẩu hiệu: "Pick it, grill it, love it!"
- Địa chỉ: câu chỉ đường cho khách không ghi số tầng. Phần đơn vị bán hàng ghi theo giấy chứng nhận: "Tầng 4, Số 63 Hồ Tùng Mậu". Website, Google, Meta đang ghi tầng 3, chưa khớp.

## Được làm và phải hỏi

- Được làm: sửa mã, chạy kiểm tra, đưa bản thử (testing) lên Zalo.
- Phải hỏi Khánh trước: gửi Zalo duyệt phiên bản, phát hành, bật "Hiển thị công khai", sửa thông tin Mini App trên Mini App Center, đổi chữ khách thấy (giá, mô tả phần thịt, giờ nhận, cách tính tiền).
- Không đọc, in ra hay commit file `.env` (có `ZMP_TOKEN`).
- Trong Beeftown, Khánh phụ trách marketing. Kho, FABi, giao hàng là việc vận hành của Sang. Chỉ nêu điều kiện để Mini App nối vào, không tự làm phần vận hành.

## Chờ người khác chốt

- **Sang:**
  - Số gam khoảng và giá một khay của 6 phần (thay số thử).
  - Khay bán qua app đóng riêng, hay cả quầy bán theo khay giá cố định. Quầy vẫn tính theo kg thì cùng một khay có 2 giá (khay 162 g theo giá 2.000 đ/g là 324.000 đ ở quầy, 300.000 đ trên app). Cả quầy bán theo khay thì cần: cân TMA in theo kiểu "theo gói" (Beeftown Cân đang gửi mọi mặt hàng kiểu "cân ký"), iPOS bán theo khay (`don_vi_ban` = `goi`).
  - Xác nhận 4 phần thịt mát.
  - Đọc lại mô tả và cách nướng (câu "Thịt sườn đã lóc xương" của Galbisal là Claude thêm).
  - Khung giờ nhận 10:30–13:30 và 16:30–21:00, 60 phút soạn khay.
  - Giao hàng: ai giao, xa nhất bao nhiêu km, phí, túi giữ lạnh.
- **Luật sư:**
  - Mini App có chức năng đặt hàng có phải thông báo Bộ Công Thương không (Luật Thương mại điện tử 122/2025/QH15, Nghị định 248/2026/NĐ-CP).
  - Website và kho đặt trên Cloudflare, Supabase Singapore, có phải lập hồ sơ chuyển dữ liệu cá nhân ra nước ngoài không (Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, Nghị định 356/2025/NĐ-CP).
  - Khay bán giá cố định ghi định lượng thế nào ("~150 g" hay "từ 150 g") và được lệch bao nhiêu gam theo quy định đo lường hàng đóng gói sẵn.
- **iPOS:** FABi có nhận đơn tạo từ phần mềm ngoài qua API không, phí bao nhiêu.
- **Khánh** (thấy khi đưa vào repo 22/10/2026):
  - Guideline (`THUONG-HIEU.md` mục 2) ghi không viết chữ về than, lửa, khói; cách nướng của 5 phần thịt trong `src/san-pham.ts` ghi "Lửa vừa", "Lửa cao". Giữ, hay đổi chữ (ví dụ "Vỉ nóng vừa")?
  - Địa chỉ trong `src/cau-hinh.ts` ghi "phường Sài Gòn". Website không ghi phường vì tới 11/10/2026 chưa có giấy xác nhận (`THUONG-HIEU.md` mục 6); giấy chứng nhận địa điểm kinh doanh 20/10/2026 nay ghi "Phường Sài Gòn". Báo để website và Mini App ghi giống nhau.

## Hướng phát triển (Claude đề xuất 22/10, Khánh chưa chốt mốc)

- **Mức 1** (bản này): bán theo khay giá cố định, tin đơn có tổng tiền; gửi đơn vào chat OA, nhân viên xác nhận và tính tiền trên FABi như khách tại quán.
- **Mức 2** (làm 23/10/2026, chờ gộp và bật): hiện còn hàng / sắp hết / tạm hết của từng phần thịt, đọc từ phần mềm kho — không hiện số khay.
  - Kho: repo `volekhanh123/beeftown-stock`, web và API trên Cloudflare Workers, dữ liệu ở Supabase "Beeftown" vùng ap-southeast-1. Kho đã có sẵn phần đồng bộ hóa đơn iPOS (các bảng `kho_ipos_*`) và mã cân trên nhãn khay (`kho_o_ma`, `kho_can_tem`); ngày 22/10 các bảng này chưa có dữ liệu.
  - Chỉ đọc số khay, không đụng dữ liệu khách.
  - Kho đã đếm số khay ở quầy: `kho_ton.so_goi` theo lô và vị trí, đọc qua `kho_v_ton` với vị trí loại `quay`. Mọi chỗ đọc tồn đều cần đăng nhập vai kho; chưa có gì mở cho `anon`.
  - Cần: 1 chỗ đọc công khai trên website chỉ trả "còn hàng / sắp hết / hết" của từng phần thịt Mini App (hàm SQL mới, kiểm thử quyền); gắn mỗi phần thịt Mini App với 1 `kho_mat_hang`; quầy quét khay ra vào kho đúng lúc; khai tên miền API ở Mini App Center → Cấu hình API Domains; Zalo duyệt lại.
- **Mức 3:** giá cố định nên tổng tiền biết trước khi gửi; trả tiền trong app (Checkout SDK, mã MAC ký ở máy chủ), đơn tự vào FABi, tin báo qua ZNS.
  - Cần 1 máy chủ nhỏ ở Việt Nam chỉ cho đơn của Mini App (BizFly 1–2 GB RAM, 95.000–120.000 đ/tháng chưa VAT). Máy này chỉ báo sang kho mã khay và số lượng.
  - Làm khi đơn online khoảng 20 đơn/ngày (giả định của Claude, đo lại sau 4 tuần mở bán).
- **Hạ tầng** (Claude khuyên 22/10): giữ Supabase và Cloudflare; không chuyển cơ sở dữ liệu sang BizFly trước khai trương; không dùng laptop làm máy chủ chạy thật.

## Trong repo beeftown-stock (từ 22/10/2026)

- Vào repo qua 1 PR: mã nguồn và ảnh (không `.env`, `node_modules`, `www`); dòng mở `!/mini-app/...` trong mục ĐƯỢC PHÉP của `.gitignore` gốc (ảnh PNG mở ở cuối file, sau `*.png`); workflow `.github/workflows/mini-app.yml`; `mini-app/` trong `.github/dependabot.yml`; kiểm thử chữ cấm `crm/test/test-mini-app-chu.mjs`; dòng trong bảng "Repo gồm gì" và bảng CI của `CLAUDE.md` gốc.
- Màu đã chốt ngày 22/10/2026 (mục "Tình trạng"). Câu hỏi treo từ 21/10 (giữ Cream và Marigold làm màu phụ hay không) đã xong: bỏ.
- Giá: máy quét chữ cấm của repo coi mọi giá là "giá chưa duyệt" (mẫu cuối của `web/src/lib/chuoi-cam.js`). Mini App được hiện giá thử trên bản thử, kèm nhãn "Giá thử" và dòng báo trong tin đơn — `test-mini-app-chu.mjs` nhóm 4 giữ điều này. Bản phát hành phải dùng giá Sang đã duyệt, đặt `giaThu: false` (việc 9 dưới đây).
- Giá ghi dạng "000.000 đ" như repo (`dinhDangTien` của `src/don.ts`, so với `web/src/lib/kho/chung.ts` trong `test-mini-app-chu.mjs` nhóm 3).
- 10 ảnh chụp trong `tai-lieu/anh-chup/` chụp trước khi đổi sang bán theo khay: còn giá theo 100 g, dạng "120.000đ". Chụp lại khi có giá thật.

## Việc tiếp theo

1. Đã xong 22/10: bản thử phiên bản 2 lên Zalo, mã QR đã gửi Khánh. Còn: Khánh xem phiên bản 2 có ở Mini App Center → Quản lý → Danh sách phiên bản — 23/10.
2. Khánh thử 1 đơn nhận tại quán và 1 đơn giao tận nơi trên bản thử, xem 2 tin có vào chat OA không — 22/10.
3. Đã xong 22/10: Mini App vào repo `volekhanh123/beeftown-stock`, thư mục `mini-app/`. Còn: Khánh duyệt và gộp PR; sau đó chép `Documents\beeftown-mini-app\.env` sang `mini-app\.env` của bản clone (hoặc `npx zmp login` lại) để đưa bản thử lên từ repo — sau khi gộp.
4. Khánh thêm 2 người thử (Sang, John) ở Mini App Center → Phân quyền thành viên — 24/10.
5. Khánh hỏi Sang hoặc John 1 câu: quán đã có giấy chứng nhận đủ điều kiện an toàn thực phẩm chưa, ai giữ — 24/10.
6. Khánh nộp 2 giấy (ngành nghề, an toàn thực phẩm) ở Quản lý → Quản lý xác thực — trước 03/11.
7. Khánh gửi luật sư 2 câu hỏi ở mục "Chờ người khác chốt" — 30/10.
8. Khánh hỏi iPOS 1 câu về API tạo đơn FABi, hỏi Sang 1 câu về đếm khay ở quầy theo phần thịt — 30/10.
9. Khi Sang gửi số gam và giá một khay: Claude Code đổi `san-pham.ts`, đặt `giaThu: false`, chạy kiểm tra, đưa bản thử; Khánh duyệt rồi gửi Zalo duyệt — trước 06/11.
10. Sau khi PR còn hàng gộp: Khánh chạy migration 0093 rồi deploy web; Sang gắn ô "Phần thịt trên Mini App Zalo" cho 6 mặt hàng ở màn mặt hàng của kho; Khánh khai `beeftown.vn` ở Mini App Center → Cấu hình API Domains; Khánh bật công tắc `mini_app_hien_con_hang` khi Sang xác nhận quầy quét khay ra vào đúng lúc — Khánh ghi hạn.
