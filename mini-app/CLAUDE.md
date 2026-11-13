# mini-app/ — Mini App Zalo Beeftown

Phiên Claude tự nạp file này khi đọc file trong `mini-app/`. Quy trình chung ở `CLAUDE.md` gốc (9 mục trong mô tả PR,
`/code-review` trước khi mở PR, không nới kiểm thử). File này nói **cách làm với mã**. Tình trạng trên Zalo (ID,
phiên bản đã đưa lên, xác thực), việc chờ Sang / luật sư / iPOS chốt, hướng phát triển và việc tiếp theo nằm ở
`TINH-TRANG.md` — chỉ đọc khi được hỏi tình trạng hay việc tiếp theo. Hướng dẫn cho người, từng bước: `README.md`.
Mọi lệnh ở mục "Lệnh" chạy trong `mini-app/`.

**Tạm ngưng (Khánh 13/11/2026):** Khánh không dùng Mini App nữa. Mã giữ nguyên để dùng lại sau; không làm tính năng
mới, không đưa bản mới lên Zalo khi Khánh chưa bật lại. Khách mua thịt mang về và trả tiền online ở trang Mua thịt về
của website (VNPay, Terminal `SLKGTE11` — `web/README.md`, "VNPay cho Mua thịt về"). Mã VNPay `SLKGTE22` của Mini App
ngưng theo. Việc Khánh làm khi ngưng và khi bật lại: `may-chu-don/README.md`, "Tạm ngưng".

Zalo Mini App bán 6 phần thịt mang về của nhà hàng Beeftown. **Bán theo khay, giá cố định** (Khánh quyết 22/10/2026):
mỗi khay khoảng `soGamKhay` gam, giá `giaMoiKhay` không đổi theo số gam thật; tin đơn ghi từng dòng "số khay × giá =
tiền" và tổng tiền thịt. Số gam và giá đang là **số thử** (`giaThu: true` trong `src/cau-hinh.ts`), chưa phải số của
Sang. Hai cách đặt:

- `diaChiMayChuDon` (`src/cau-hinh.ts`) để trống: app mở chat với Zalo OA của quán và điền sẵn tin đơn; khách tự bấm
  Gửi. Không máy chủ, không lưu dữ liệu khách, không thu tiền trong app.
- `diaChiMayChuDon` có địa chỉ (đang là `https://don.beeftown.vn`): khách gửi đơn lên máy chủ đơn của repo
  (`may-chu-don/`, đặt ở Việt Nam) và trả tiền ngay trong app; chỉ giao tận nơi, giá khay đã gồm phí giao
  (Khánh 09/11/2026).

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm install` | Cài thư viện (`npm ci` cần Node 24 — mục "Lỗi đã gặp") |
| `npm run dev` | Chạy thử ở http://localhost:3000. Ngoài Zalo, nút "Gửi đơn qua Zalo" hiện tin nhắn thay vì mở chat. Thử trả trước với máy chủ đơn trên máy: đặt `VITE_DIA_CHI_MAY_CHU_DON=http://127.0.0.1:8787` (`README.md`, "Thử đặt và trả tiền với máy chủ đơn") |
| `npm run kiem-tra` | Kiểm tra giờ nhận, số điện thoại, nội dung tin, tổng tiền, dòng giá thử, đọc còn hàng, trả trước (gửi đơn, mất mạng, màn theo trạng thái, giữ đơn trên máy) (cần Node 22.6 trở lên) |
| `npm run build` | `tsc --noEmit && vite build`. Bản build trong `www/` chỉ chạy dưới `/zapps/<APP_ID>/` |
| `npm run deploy:thu` | `zmp deploy --testing --passive --desc "..."`. zmp-cli tự build, rồi tải `www/` lên. In "Deploy Done!", số phiên bản và mã QR mở bản thử |
| `npx zmp login` | Đăng nhập lại khi khóa hết hạn. Phải chọn cách đăng nhập và quét mã QR bằng app Zalo, nên để Khánh tự chạy trong cửa sổ dòng lệnh (hoặc bấm đúp `dua-len-zalo.cmd`) |

Đưa lên cần `mini-app/.env` (`APP_ID`, `ZMP_TOKEN`), không bao giờ vào git; bản clone chưa có thì Khánh chép file từ
máy cũ hoặc chạy `npx zmp login`. Trước mỗi lần đưa lên: `npm run kiem-tra`, `npx tsc --noEmit` và (trong `crm/`)
`node test/test-mini-app-chu.mjs` phải đạt.

Kiểm thử trong repo:

- `.github/workflows/mini-app.yml`: mỗi PR hay commit lên main đổi `mini-app/` → `npm ci`, `npm run kiem-tra`, `tsc`, `vite build` (không có `.env`, không đưa lên Zalo). Workflow riêng: Mini App đỏ không khóa deploy website.
- `crm/test/test-mini-app-chu.mjs` (chạy trong `npm test` của `crm/`, mỗi PR): chữ khách thấy (mã nguồn bỏ chú thích, 6 phần thịt, cấu hình, tin đơn) không dính chữ cấm của `web/src/lib/chuoi-cam.js` và chữ Khánh dặn tránh; giá dạng "000.000 đ"; mỗi dòng "số khay × giá = tiền" đúng phép nhân và dòng tổng bằng tổng các dòng; tin có giá phải kèm dòng giá thử khi `giaThu: true`.
- `crm/test/test-quy-trinh.mjs`: file mới trong `mini-app/` phải có dòng mở trong `.gitignore` gốc; `.env`, `www/`, `node_modules/` không vào git; workflow đủ bước.
- `may-chu-don/test/thu.ts` nhóm 18 (CI "Kiểm thử"): `src/tra-truoc.ts` gọi thẳng máy chủ đơn thật — thân đơn app soạn được máy chủ nhận, gửi lại cùng mã gửi ra cùng đơn, chuyển thiếu rồi chuyển nốt, câu lỗi của máy chủ tới tay khách. Sửa `tra-truoc.ts` hay đường `/api/don` của máy chủ thì chạy cả hai bộ kiểm tra.

## Cấu trúc

```
src/cau-hinh.ts      OA ID, cờ giá thử, ngày bắt đầu nhận hàng, khung giờ nhận, giờ mở cửa, địa chỉ, người bán
src/san-pham.ts      6 phần thịt: tên, thịt mát / đông lạnh, mô tả, cách nướng, số gam khoảng và giá một khay
src/don.ts           logic thuần (không React, không Zalo): ngày giờ nhận, kiểm tra, soạn tin đơn
src/con-hang.ts      logic thuần: đọc còn hàng từ website (hỏng thì {}), trạng thái hiện cho từng phần thịt
src/con-hang-kho.tsx giữ trạng thái còn hàng trong lúc app mở, đọc lại sau 60 giây
src/zalo.ts          openChat, followOA, saveImageToGallery (lưu ảnh mã QR), openShareSheet (chia sẻ món), showOAWidget (khung quan tâm OA)
src/chia-se.ts       logic thuần của chia sẻ món: đường dẫn /mon/<mã>, đọc lại mã khi mở từ tin chia sẻ, nội dung tin
src/tra-truoc.ts     logic thuần của trả trước (không React, không Zalo): thân đơn, mã gửi, gửi / đọc đơn qua fetch có hết giờ, màn theo trạng thái, giờ VN, giữ đơn vừa đặt trên máy
src/may-chu-don.ts   địa chỉ máy chủ đơn (VITE_DIA_CHI_MAY_CHU_DON thắng cau-hinh.ts), TRA_TRUOC, fetch thật, localStorage
src/anh-qr.ts        vẽ mã QR từ chuỗi VietQR máy chủ gửi (qrcode 1.5.4)
src/gio-hang.tsx     giỏ hàng trong bộ nhớ; đơn trả trước vừa đặt (mã đơn, khóa xem — giữ trên máy tới hết ngày nhận), mã gửi của lần gửi gần nhất
src/thong-bao.tsx    thông báo ngắn tự làm
src/thanh-phan.tsx   đầu trang, nút số khay, thẻ phần thịt, giá, dòng báo giá thử
src/bieu-tuong.tsx   biểu tượng SVG
src/trang/           6 màn hình: trang-chu, don-hang, da-gui, thong-tin, tra-tien và don-cua-toi (hai màn cuối chỉ khi có máy chủ đơn)
scripts/kiem-tra-don.ts
tai-lieu/            biểu tượng 512 × 512, banner 1920 × 1080, 10 ảnh chụp màn hình
app-config.json      cấu hình Mini App (danh sách file để trống theo mẫu của Zalo, đừng điền tay)
zmp-cli.json         đánh dấu dự án Zalo Mini App cho zmp-cli
dua-len-zalo.cmd     cho Khánh bấm đúp trên Windows: cài thư viện, đăng nhập, đưa bản thử lên
.gitattributes       giữ dua-len-zalo.cmd xuống dòng CRLF (cmd.exe) trên mọi máy
.gitignore           node_modules, www, .env (repo gốc cũng chặn; file mới phải mở trong .gitignore gốc)
TINH-TRANG.md        tình trạng trên Zalo, việc chờ chốt, việc tiếp theo (không cần đọc khi chỉ sửa mã)
```

## Cách app chạy

- Gửi đơn: `openChat({ type: "oa", id, message })` của zmp-sdk 2.53.1 (điền sẵn tin từ SDK 2.20.0); khách vẫn tự bấm Gửi. Quan tâm OA: `followOA({ id })`. Quyền 44 (mở chat) và 56 (yêu cầu theo dõi OA) đã cấp mặc định.
- Còn hàng theo kho: app hỏi `https://beeftown.vn/mini-app/con-hang.json` (`diaChiConHang` trong `src/cau-hinh.ts`) khi mở và khi khách quay lại app sau 60 giây. Kho báo `het` → thẻ hiện "Tạm hết", không thêm được khay; phần đã chọn mà vừa hết thì thẻ và màn đơn hàng ghi "Phần này vừa hết ở quầy; quán báo lại khi xác nhận đơn.", tin đơn ghi thêm "— app báo quầy vừa hết"; `sap_het` hiện như còn hàng (repo cấm câu khan hiếm kiểu "sắp hết"); không biết → hiện như cũ. Phía kho: `web/KHO.md` mục 3r; việc còn phải làm để chạy thật: `TINH-TRANG.md`.
- Trả trước (khi có máy chủ đơn, `TRA_TRUOC` của `src/may-chu-don.ts`): `POST /api/don` rồi màn `/tra-tien` hỏi `GET /api/don/<mã>?khoa=` (4 giây khi chờ tiền, 15 giây sau đó, ngay khi khách quay lại app). Mã QR vẽ trong app từ `thanhToan.chuoiQr` (không tải ảnh `qr.svg` của máy chủ: khỏi khai thêm tên miền ảnh, và có PNG để `saveImageToGallery`). Chép bằng `navigator.clipboard` (zmp-sdk 2.53.1 không có lệnh chép). Mất mạng, hết giờ, trả lời lạ: "không rõ" — không bao giờ báo đã ghi hay đã trả; gửi lại cùng mã gửi. `saveImageToGallery` có cần khai quyền ở Mini App Center không: chưa thử trên Zalo thật.
- Trả qua VNPay (Khánh 11/11/2026, máy chủ đơn có cấu hình Checkout SDK — `may-chu-don/README.md`, "Cài VNPay qua Checkout SDK"): `thanhToan.kieu` là `"vnpay"` thì màn `/tra-tien` hiện nút "Trả … qua VNPay" thay cho mã QR. Bấm nút: `CheckoutSDK.createOrder` với đúng `thanhToan.taoDon` máy chủ đã ký MAC (app không sửa chữ nào; Private key không bao giờ xuống app), Zalo mở trang VNPay; orderId Zalo trả về được báo lên máy chủ (`POST /api/don/<mã>/vnpay`, chỉ để máy chủ thấy đơn chờ kết quả quá lâu). Nghe `EventName.PaymentDone` rồi `checkTransaction` chỉ để nói với khách đang chờ gì ("Zalo báo bạn đã trả xong. App đang chờ quán ghi nhận tiền…") và hỏi lại máy chủ ngay — "Quán đã nhận đủ tiền" chỉ khi máy chủ đơn báo. Zalo đã báo trả xong thì nút trả khóa lại (trả hai lần là quán phải hoàn một lần). Sandbox (`thuNghiem`): dòng "Bản thử: … không trừ tiền thật". Ngoài Zalo: "Mở Mini App Beeftown trong Zalo để trả tiền". Chưa thử trên Zalo thật.
- Chia sẻ món (Khánh chọn 09/11/2026): nút "Chia sẻ" trên thẻ phần thịt, chỉ hiện trong Zalo. `openShareSheet({ type: "zmp_deep_link" })` với đường dẫn `/mon/<mã>` (route trong `ung-dung.tsx`, mở trang chủ, cuộn tới và viền đậm phần đó); ảnh xem trước là ảnh chia sẻ của website `https://beeftown.vn/thuong-hieu/chia-se-1200x630.png` (chưa có ảnh từng phần thịt). Bạn bè mở tin có đúng phần thịt không và ảnh có hiện không: chưa thử trên Zalo thật.
- Quan tâm OA và nút chat (Khánh chọn 09/11/2026): màn đặt xong (`da-gui`, `tra-tien` khi đã nhận tiền) hiện khung quan tâm OA do Zalo vẽ (`showOAWidget`, `KhungQuanTamOA` trong `thanh-phan.tsx`); ngoài Zalo hay Zalo báo lỗi thì hiện lại nút "Quan tâm Beeftown trên Zalo" (`followOA`). Nút chat nhỏ (`NutChat`) cạnh "Xem đơn" ở trang chủ và cạnh "Gửi đơn và trả tiền" ở màn đơn hàng, chỉ trong Zalo. Khung OA lấy đúng OA Beeftown không (OA gắn với Mini App): chưa thử trên Zalo thật.
- Đơn của tôi (Khánh chọn 09/11/2026): màn `/don-cua-toi`, lối vào "Đơn của tôi (N)" ở trang chủ khi có đơn. Danh sách nằm trên máy (`localStorage` khóa `beeftown-don-cua-toi`, `docDanhSachDon` / `themVaoDanhSach` trong `tra-truoc.ts`): tối đa 20 đơn, 30 ngày, chỉ mã đơn, khóa xem, số đơn, ngày nhận — không tên, số điện thoại, địa chỉ. Trạng thái hỏi máy chủ mỗi lần mở màn; máy chủ báo không có đơn thì bỏ khỏi danh sách. Bấm "Xem đơn" mở màn trả tiền / trạng thái của đơn đó.
- Nhận biết đang ở trong Zalo: `/zalo/i.test(navigator.userAgent)`.
- Router: `ZMPRouter` của zmp-ui đặt basename `/zapps/${window.APP_ID}` ở bản production.
- Không dùng `Icon` và `Snackbar` của zmp-ui vì chúng tải phông từ h5.zadn.vn. Biểu tượng vẽ SVG, thông báo tự làm.
- Nếu `oaId` để trống, Vite bỏ hẳn đoạn gọi `openChat` khỏi bản build. Không đưa lên bản nào có `oaId` trống.
- Mã viết mới, không chép mẫu zaui của Zalo (giấy phép mẫu chỉ cho thử nghiệm, phi thương mại). Chia sẻ món, khung quan tâm OA, Đơn của tôi lấy ý từ mẫu zaui-fashion, mã viết mới.
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
- Mini App có thanh toán phải tích hợp Checkout SDK của Zalo; mọi phương thức thanh toán phải khai trên hệ thống của Zalo (docs.zaloplatforms.com/docs/MA/checkoutSdk/intro, đọc 11/11/2026). Vì vậy VNPay đi qua Checkout SDK. Mã VietQR tự vẽ trong app (đợt 2b) không qua Checkout SDK — có cấu hình VNPay thì app không hiện nó; trước khi bật VietQR cho khách thật, hỏi Zalo hoặc chuyển sang phương thức "Chuyển khoản ngân hàng" (BANK) của Checkout SDK.
- Dữ liệu của Mini App phải xử lý, lưu trong lãnh thổ Việt Nam (Điều 5.3.3b). Cấm nhận dữ liệu cá nhân từ Zalo khi hệ thống đặt ngoài Việt Nam (Điều 7.5). Supabase của Beeftown (Singapore) và Cloudflare không dùng cho dữ liệu khách của Mini App.
- Mini App phải hiện thông tin liên hệ (Điều 5.5). Màn hình Thông tin đang có: chat với quán, địa chỉ, website, đơn vị bán hàng. Hotline để trống trong `cau-hinh.ts`.
- Giới hạn đưa lên: bản Development tối đa 300 phiên bản/tháng, bản Testing tối đa 60 phiên bản/tháng.
- Giấy tờ xác thực: ảnh chụp hoặc scan từ bản gốc, không nhận bản photo kể cả bản công chứng; JPG, PNG, PDF; tối đa 5 MB mỗi file, 20 file, 3 lượt gửi mỗi ngày.

## Quy tắc chữ và thương hiệu

- Viết tiếng Việt theo quy tắc từ ngữ của Khánh: câu thường, có số, không ẩn dụ. Không dùng: nút thắt, đầu phễu, nước rút, dựng nền, hệ hạng, xoay trục, cổng số liệu, kích hoạt, leads, seeding, broadcast, footage, creative, camp, nghiệm thu. Số kiểu Việt Nam: 84.500 đ (giá có dấu cách trước chữ đ, như repo), 42,6%, ngày dd/mm. Việc cần làm ghi đủ 4 phần: động từ, con số, ai làm, hạn ngày.
- Beeftown là nhà hàng chuyên bò (Beef Specialty Restaurant). Không viết: Korean BBQ, nướng Hàn, buffet, rẻ, cao cấp, ngon nhất, số một.
- Chadolbagi và LA Galbi là thịt đông lạnh. Không gọi chung cả tủ là thịt mát.
- Màu: đỏ `#BD0000`, đen, trắng (Khánh chốt 22/10/2026, `THUONG-HIEU.md` mục 0 của repo). `src/styles.css` dùng thêm 7 màu pha: đỏ đậm và các xám (nền, vạch, chữ phụ) Khánh duyệt ngày 25/10/2026 (câu 1 ở mục đó); hai đỏ nhạt `#fff1f1`, `#d9a3a3` và chữ `#111111` chưa nằm trong câu trả lời — chốt cùng PR đổi màu, đừng dùng thêm chỗ mới. Chữ Montserrat (giấy phép OFL, chỉ các bộ latin, latin-ext, vietnamese). Câu khẩu hiệu: "Pick it, grill it, love it!"
- Giá: máy quét chữ cấm của repo coi mọi giá là "giá chưa duyệt" (mẫu cuối của `web/src/lib/chuoi-cam.js`). Mini App được hiện giá thử trên bản thử, kèm nhãn "Giá thử" và dòng báo trong tin đơn — `test-mini-app-chu.mjs` nhóm 4 giữ điều này. Bản phát hành phải dùng giá Sang đã duyệt, đặt `giaThu: false`. Giá ghi dạng "000.000 đ" như repo (`dinhDangTien` của `src/don.ts`, so với `web/src/lib/kho/chung.ts` trong `test-mini-app-chu.mjs` nhóm 3).
- Địa chỉ: câu chỉ đường cho khách không ghi số tầng. Phần đơn vị bán hàng ghi theo giấy chứng nhận: "Tầng 4, Số 63 Hồ Tùng Mậu". Website, Google, Meta đang ghi tầng 3, chưa khớp.

## Được làm và phải hỏi

- Được làm: sửa mã, chạy kiểm tra, đưa bản thử (testing) lên Zalo.
- Phải hỏi Khánh trước: gửi Zalo duyệt phiên bản, phát hành, bật "Hiển thị công khai", sửa thông tin Mini App trên Mini App Center, đổi chữ khách thấy (giá, mô tả phần thịt, giờ nhận, cách tính tiền).
- Không đọc, in ra hay commit file `.env` (có `ZMP_TOKEN`).
- Trong Beeftown, Khánh phụ trách marketing. Kho, FABi, giao hàng là việc vận hành của Sang. Chỉ nêu điều kiện để Mini App nối vào, không tự làm phần vận hành.
