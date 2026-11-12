# Beeftown Mini App: tình trạng, việc chờ chốt, việc tiếp theo

Sổ ghi tình trạng của dự án Mini App: trên Zalo đã có gì, ai còn phải chốt gì, hướng phát triển, việc tiếp theo.
Phiên Claude đọc file này khi được hỏi tình trạng hay việc tiếp theo — không cần đọc khi chỉ sửa mã. Cách làm với mã
(lệnh, cấu trúc, cách app chạy, quy tắc): `CLAUDE.md` cùng thư mục. Hướng dẫn cho người: `README.md`.

Ngày trong file là ngày ghi, chưa chắc còn đúng hôm nay: trước khi báo tình trạng cho Khánh, đối chiếu với mã
(`src/cau-hinh.ts`) và hỏi lại phần nằm ngoài repo (Mini App Center, giấy tờ, câu trả lời của Sang).

## Người và lịch sử

- Người giao việc: Khánh (Võ Lê Khánh), CMO và partner của Beeftown. Pháp nhân bán hàng: Công ty TNHH SLK Group, mã số doanh nghiệp 0319712805.
- Bản 1.0 do Claude dựng ngày 22/10/2026 trong dự án "FnB Investment" trên claude.ai, rồi chuyển sang Claude Code cùng ngày lúc 13:00. Ghi chú đầy đủ của dự án: tài liệu claude/zalo-oa-beeftown.md trong project "FnB Investment" (trên claude.ai, không có trong repo).
- Từ 22/10/2026 mã nằm trong repo `volekhanh123/beeftown-stock`, thư mục `mini-app/`. Thư mục cũ `Documents\beeftown-mini-app` trên máy Khánh chỉ để lưu, không sửa ở đó nữa.

## Tình trạng (ghi từ 22/10/2026, 13:00; mỗi dòng có ngày của nó)

- OA "Nhà hàng Beeftown Hồ Tùng Mậu" đã xác thực. OA ID `3030027075662095415`, đã điền trong `src/cau-hinh.ts`. Gói OA Tăng trưởng.
- Mini App "Beeftown", **Mini App ID `2858300068641327950`**, nằm trong Zalo App "SLK Group 2210" (ID 2513314422490328273). Loại hình Doanh nghiệp/Hộ kinh doanh (không đổi được), danh mục F&B → Kinh doanh/Quản lí dịch vụ ăn uống. Trang quản lý: https://miniapp.zaloplatforms.com/miniapp/2858300068641327950/statistic/overview
- Đăng nhập zmp-cli đã xong: file `.env` có `APP_ID` và `ZMP_TOKEN`. File này nằm ở `Documents\beeftown-mini-app\.env`, **không vào git** (`.gitignore` chặn, `test-quy-trinh.mjs` kiểm). Muốn đưa lên từ bản clone của repo: Khánh chép file đó sang `mini-app\.env`, hoặc chạy lại `npx zmp login` trong `mini-app\`.
- **Bản thử phiên bản 2** đã đưa lên 22/10 16:33 bằng `npm run deploy:thu` (kiem-tra 11/11, `tsc` đạt). Link mở bản thử: `https://zalo.me/s/2858300068641327950/?env=TESTING&version=2`. Lượt Testing tháng 10: 4/60. Chưa đối chiếu ở Mini App Center → Danh sách phiên bản. Lần 11:40 lỗi "No asset defined" (`CLAUDE.md`, "Lỗi đã gặp"), đã sửa lúc 11:58.
- Xác thực Mini App: bước chủ sở hữu đã xong (xác thực bằng OA, 22/10 11:33). Còn thiếu giấy tờ kinh doanh: giấy xác nhận ngành nghề kinh doanh phù hợp (dịch vụ ăn uống) và giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm. Thiếu 2 giấy này thì không gửi Zalo duyệt phiên bản được. Bản thử (testing) vẫn mở được bằng tài khoản Admin, Developer, người thử.
- **Bán theo khay, giá cố định** (Khánh quyết 22/10/2026): không bán đúng số gam. Mỗi khay khoảng `soGamKhay` gam (đang để ~150 g), giá `giaMoiKhay` không đổi theo số gam thật; tin đơn ghi từng dòng "số khay × giá = tiền" và tổng tiền thịt (chưa gồm phí giao). Bản thử phiên bản 2 trên Zalo còn bán theo giá/100 g.
- Số gam và giá đang là **số thử** (`giaThu: true` trong `src/cau-hinh.ts`), chưa phải số của Sang. Giá ghi dạng "120.000 đ" (có dấu cách, như repo) từ 22/10/2026; bản thử phiên bản 2 trên Zalo còn ghi "120.000đ".
- **Còn hàng theo kho** (bước 2, 23/10/2026): cách app đọc và hiện còn hàng ở `CLAUDE.md`, "Cách app chạy". Chưa chạy được thật cho tới khi: chạy migration 0093 và deploy web; gắn ô "Phần thịt trên Mini App Zalo" cho mặt hàng ở màn mặt hàng của kho; khai `beeftown.vn` ở Mini App Center → Cấu hình API Domains; chủ bật công tắc `mini_app_hien_con_hang` ở `/noi-bo` (mặc định tắt). Chi tiết: `web/KHO.md` mục 3r.
- Màu: Khánh chốt ngày 22/10/2026 bảng đỏ `#BD0000`, đen `#000000`, trắng `#FFFFFF`, bỏ Cream, Marigold, Warm Stone (`THUONG-HIEU.md` mục 0 của repo). Luật màu khi sửa `src/styles.css`: `CLAUDE.md`, "Quy tắc chữ và thương hiệu".
- 10 ảnh chụp trong `tai-lieu/anh-chup/` chụp trước khi đổi sang bán theo khay: còn giá theo 100 g, dạng "120.000đ". Chụp lại khi có giá thật.

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
  - **Đang làm từ 29/10/2026** (Khánh: "đừng theo kiểu nhắn tin nữa mà phải tự động hoàn toàn"): thư mục `may-chu-don/` của repo, chia 4 đợt (`may-chu-don/CLAUDE.md`, "Chia đợt"). Khánh chốt: trả trước, thu tiền online qua SePay (chuyển khoản VietQR vào VietinBank của SLK Group — thay cho Checkout SDK của Zalo, 29/10/2026), màn hình đơn riêng cho quầy, laptop ở công ty để thử rồi máy chủ thuê ở Việt Nam khi mở bán, báo khách trong app và bằng ZNS. Đợt 2b (30/10/2026): Mini App gửi đơn lên máy chủ khi `diaChiMayChuDon` có địa chỉ, màn trả tiền vẽ mã QR từ chuỗi VietQR máy chủ gửi, chép số tài khoản / số tiền / nội dung, tự cập nhật khi quán nhận đủ tiền (`CLAUDE.md`, "Cách app chạy"). Khánh chốt 30/10/2026: chuyển dư thì đơn vẫn soạn, hoàn phần dư; tiền về đủ sau 30 phút vẫn tính là đã trả. Khánh thuê máy chủ BizFly Cloud (TP.HCM, 134.000 đ/tháng) và cài máy chủ đơn ngày 09/11/2026; từ đó `diaChiMayChuDon` là `https://don.beeftown.vn`. Chưa có tài khoản nhận tiền và SePay thì app ghi đơn nhưng báo "Quán chưa mở nhận chuyển khoản trong app", mời khách chat với quán.
  - Làm khi đơn online khoảng 20 đơn/ngày (giả định của Claude, đo lại sau 4 tuần mở bán).
- **Hạ tầng** (Claude khuyên 22/10): giữ Supabase và Cloudflare; không chuyển cơ sở dữ liệu sang BizFly trước khai trương; không dùng laptop làm máy chủ chạy thật.

## Vào repo beeftown-stock (22/10/2026)

- Vào repo qua 1 PR: mã nguồn và ảnh (không `.env`, `node_modules`, `www`); dòng mở `!/mini-app/...` trong mục ĐƯỢC PHÉP của `.gitignore` gốc (ảnh PNG mở ở cuối file, sau `*.png`); workflow `.github/workflows/mini-app.yml`; `mini-app/` trong `.github/dependabot.yml`; kiểm thử chữ cấm `crm/test/test-mini-app-chu.mjs`; dòng trong bảng "Repo gồm gì" và bảng CI của `CLAUDE.md` gốc.
- Màu đã chốt ngày 22/10/2026 (mục "Tình trạng"). Câu hỏi treo từ 21/10 (giữ Cream và Marigold làm màu phụ hay không) đã xong: bỏ.

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
11. Máy chủ đơn chạy ở `https://don.beeftown.vn` từ 09/11/2026 (`may-chu-don/README.md`, "Đưa lên máy chủ thuê"). Khánh thêm `https://don.beeftown.vn` ở Mini App Center → Cấu hình API Domains, rồi bấm đúp `dua-len-zalo.cmd` đưa bản thử mới lên, đặt thử 1 đơn — sau khi PR điền địa chỉ gộp. Khách trả tiền được trong app khi có tài khoản VietinBank và SePay (`may-chu-don/README.md`, "Cài SePay").
