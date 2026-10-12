# Beeftown CRM

Hệ thống CRM và thẻ thành viên của Beeftown. Beeftown **sở hữu 100%** dữ liệu khách hàng — đây chính là một trong ba thứ mà ma trận phần mềm yêu cầu phải tự sở hữu.

> **Đặc tả nghiệp vụ:** [`../Beeftown_CRM_Design.html`](../Beeftown_CRM_Design.html). Mọi con số trong code (tỷ lệ 3%, ngưỡng 50.000đ, 6 nhóm khách) đều lấy từ đó — sửa code thì phải sửa cả tài liệu.

## Trạng thái

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| 0 | Schema database + phân quyền | ✅ Xong |
| 0b | **Siết an toàn** — vá 4 lỗ hổng, sửa 2 lỗi chỉ số | ✅ Xong (`0008`) |
| 1 | Đặt bàn thật (thay Google Sheet) | ✅ Schema xong, form chờ giờ phục vụ và bảng bàn |
| 2 | Lõi CRM — hồ sơ khách, phân nhóm | 🔜 Schema xong, chờ giao diện |
| 3 | Thẻ tích điểm | 🔜 Schema xong, chờ giao diện |
| 4 | Chiến dịch ZBS | ✅ Database xong (`0046`–`0047`): ZBS-01/02 tự động khi nhân viên xác nhận đặt bàn (`0063`), chiến dịch gửi tay, máy gửi `may_zalo`, trần 2 tin chăm sóc/tháng, khung giờ — chờ tick vàng, ZBS, App và mẫu được Zalo duyệt |
| 4b | Bot Messenger đặt bàn | ✅ Database xong (`0052`–`0053`): máy `may_messenger` nhớ bước hội thoại theo PSID đã băm (không lưu PSID thô, không lưu tin nhắn), khóa tra cứu sai 5 lần/15 phút, tự xóa phiên sau 30 ngày, thống kê theo ngày; đặt bàn đi qua anon như website — chờ App Meta được duyệt `pages_messaging` |
| 4c | Báo động khi đèn sức khỏe đỏ | ✅ Lõi xong (`0059`–`0060`): máy `may_bao_dong` đọc số liệu bảng sức khỏe qua `suc_khoe_so_lieu` (không mở quyền kho / CRM), sổ sự cố mỗi đèn đỏ một sự cố, khóa lượt, đánh dấu không lặp, dọn sau 90 ngày; mỗi lượt dọn luôn bốn bảng nhật ký quá hạn (`0073`); luật báo và câu chữ ở `web/src/lib/bao-dong-*.ts` — chờ chọn kênh (Telegram / email / Zalo) |
| 5 | Báo cáo BI | ✅ Hàm chỉ số xong (`chi_so_crm`, `phieu_do_launch`) |
| 6 | **Cổng nội dung** — công tắc cho từng dữ kiện | ✅ Xong (`0010`) |
| 7 | **Thực đơn** — 31 món, duyệt giá từng món | ✅ Xong (`0011`) |
| 8 | **Tuyển dụng** — tin, hồ sơ, vé tải CV | ✅ Xong (`0012`) |
| 9 | **Đặt nội dung một giao dịch** — công bố bốn bước thành một | ✅ Xong (`0015`) |
| 9b | **Vá vé tải CV, quyền thu hồi, nhật ký trùng** | ✅ Xong (`0016`) |
| 9c | **Vá quyền gọi hàm kiểm vé** — tải CV vẫn hỏng sau `0016` | ✅ Xong (`0025`) |
| 9d | **Form hỏi gì tùy từng tin** — chỉ tin cần CV mới có ô CV | ✅ Xong (`0026`) |
| 9e | **Màn soạn tin tuyển dụng** — chỉ chủ nhà hàng và quản lý duyệt lương | ✅ Xong (`0027`) |
| 9f | **Lương theo giờ hay theo tháng** — đơn vị đi cùng con số, duyệt cùng lúc | ✅ Xong (`0028`) |
| 9g | **Tiếng Hàn và bản dịch tự động** — sổ bản dịch từng ô, sửa tay thắng máy, không bao giờ ghi bản dịch của câu cũ | ✅ Xong (`0036`) |
| 9h | **Vá quyền ba hàm CRM** — ghi lượt ghé, tìm/tạo khách, xếp tin tự kiểm vai và chi nhánh; tài khoản tự đăng ký không có dòng `nhan_su` bị từ chối | ✅ Xong (`0045`) |
| 10 | **Kho · GĐ1** — 3 vai kho, tường ngăn CRM, danh mục, ô thông tin tự tạo, phiếu nhập có duyệt, sổ kho bất biến | ✅ Xong (`0017`–`0021`) |
| 11 | **Kho · GĐ2** — pha lóc (tỉ lệ thu hồi, giá vốn thật), chuyển quầy, xuất bếp, báo hủy có duyệt, kiểm kê dựng lại tồn | ✅ Xong (`0022`–`0023`) |
| 12 | **Kho · GĐ3** — đối chiếu hóa đơn, công nợ nhà cung cấp, thanh toán, trả hàng NCC, báo cáo xuất–nhập–tồn / thu hồi / hao hụt / bán, tải CSV | ✅ Xong (`0024`) |

Mọi kiểm thử đều đạt — số kiểm tra xem ở dòng cuối của `npm test` hoặc Summary của CI (README không ghi số đếm tay: số đó luôn cũ — từng ghi 1374 khi bộ thật đã lớn gấp mấy lần). Database hoàn chỉnh. Trang công khai ở
`../web/` có 12 đường dẫn ở ba thứ tiếng Việt–Anh–Hàn, giao diện nội bộ
`/noi-bo` và hai form công khai đều đã dựng.

## Chạy kiểm thử

Không cần Docker, không cần cài Postgres — dùng PGlite (Postgres chạy WASM trong Node), bản Postgres 17 như Supabase production (`test-quy-trinh.mjs` mục 1 giữ điều này).

```bash
cd web && npm ci        # một lần — test ở đây đọc cả mã web (@astrojs/compiler-rs, supabase-js)
cd ../crm && npm ci && npm test
```

| Lệnh | Kiểm gì |
|---|---|
| `npm test` | **tất cả**: tự tìm `chay-test.mjs` và mọi `test-*.mjs`, chạy song song 4 file, in tổng số kiểm tra. File test mới tự được chạy — không sửa `package.json` |
| `npm run kiem-migration` | **gác số migration**: không trùng số (số hở chỉ cảnh báo, kèm nhánh đang giữ số đó), không sửa migration đã có trên `origin/main` (so bằng mã blob của git — máy Windows CRLF vẫn đúng), số mới lớn hơn main, không `current_date` |
| `npm run so-migration` | in số migration kế tiếp, tính trên **mọi** nhánh `origin/*` (chạy `git fetch origin --prune` trước) |
| `npm run test:quy-trinh` | **quy trình**: hàm SQL mới phải có test nhắc tên, không file mã nguồn nào bị `.gitignore` chặn, CI còn đủ bước, CLAUDE.md và mẫu PR đủ 9 mục |
| `npm run test:db` | nghiệp vụ: chuẩn hóa SĐT, sổ cái điểm, ba luật tính điểm, đặt bàn, phân nhóm |
| `npm run test:rls` | phân quyền: tách dữ liệu giữa chi nhánh, vai trò, website công khai |
| `npm run test:an-toan` | **bốn lỗ hổng ở `0008`** và hai lỗi chỉ số |
| `npm run test:qua-tai` | **Supabase bận không phải là hết phiên** (`web/src/lib/qua-tai.ts`): lỗi thật của supabase-js dựng bằng fetch giả — 429, 5xx, 52x của Cloudflare, mất mạng là TẠM THỜI; token hết hạn / thu hồi, sai mật khẩu là TỪ CHỐI; câu báo hai thứ tiếng; trang "đang bận" 503 (GET tự tải lại, POST nói rõ CHƯA ghi); nhật ký `[qua-tai]` không chép token / email; `phien.ts`, `middleware.ts`, `kho/may-chung.ts` không xóa cookie / token khi lỗi tạm thời. Không cần PGlite |
| `npm run test:cong-bo` | cổng nội dung và ảnh |
| `npm run test:thuc-don` | thực đơn và duyệt giá |
| `npm run test:tuyen-dung` | tuyển dụng, dữ liệu cá nhân, nhật ký bất biến, form theo từng tin, duyệt lương, lương giờ/tháng |
| `npm run test:cong-khai` | API công khai, mã đặt bàn, đo lường |
| `npm run test:noi-dung` | đặt/thu hồi nội dung trong một giao dịch, vé tải CV |
| `npm run test:ban-dich` | **tiếng Hàn và bản dịch tự động**: trang lùi ko → en → vi, sửa tay thắng máy, không ghi bản dịch của câu cũ, bấm Lưu lại (`\r\n`) không tính là sửa tay, bản bị chặn không lên trang |
| `npm run test:hop-dong` | hợp đồng giữa `web/src` và database: tên hàm, tham số, bảng, cột, enum |
| `npm run test:kho` | **kho**: tường ngăn CRM, bảng quyền, phiếu nhập, sổ kho, giá vốn, mã vạch nhãn cân, form và CSV; pha lóc; chuyển, xuất bếp, hủy, kiểm kê; công nợ và báo cáo; đồng bộ cân |
| `npm run test:can` | đồng bộ danh mục sang cân in tem: đọc/ghi file `A_000.TMS`, dòng không đổi giữ nguyên từng byte |
| `npm run test:quyen-ham` | **ba hàm definer CRM ở `0045`**: ai bị từ chối (kể cả tài khoản không có dòng `nhan_su`), ai vẫn ghi được, website vẫn đặt bàn |
| `node test/test-quyen-chi-nhanh-crm.mjs` | **hàm CRM đúng chi nhánh, đặt bàn đúng bước `0069`**: thu ngân / quản lý tra SĐT khách chỉ ăn ở chi nhánh khác chỉ nhận id (không ghi chú, ngày sinh, tên), không điền được tên; khách mới chỉ cho chi nhánh mình; ghi lượt ghé cho khách chi nhánh khác vẫn được; phiếu đo, tin tuyển dụng mẫu đúng chi nhánh, mã gõ sai báo lỗi; xếp tin bấm đúp = một tin, khoá theo chi nhánh và ngày giờ VN, tin đã hỏng thì bấm lại gửi mới, khách / chiến dịch chi nhánh khác và mẫu khác mẫu chiến dịch bị từ chối; đặt bàn: thử cả 20 cặp trạng thái so với `CHUYEN_DUOC` của `/noi-bo/dat-ban`, không đổi khách / chi nhánh / mã / đồng ý / nguồn / người tạo, nguoi_xu_ly là người đang đăng nhập; chèn thẳng chỉ ở chờ gọi / đã xác nhận, ghi người tạo; xoá bàn / nhân sự (ON DELETE SET NULL) vẫn được; website hủy và SQL Editor như cũ |
| `node test/test-quyen-doc-crm.mjs` | **policy đọc `0070`**: tám bảng nội dung chỉ bốn vai CRM đang làm đọc được (đã nghỉ, không `nhan_su`, vai kho, máy thấy 0; ba view của trang Tổng quan thu ngân thấy như chủ); biểu thức mới giống biểu thức cũ (chép nguyên văn pg_policies) từng dòng với 13 kiểu người; cổng: không policy nào gọi hàm phân quyền mỗi dòng; đo 5.000 khách |
| `node test/test-chi-so-gio-vn.mjs` | **ngày giờ VN của `chi_so_crm` `0071`**: `ngay_vn()` ở 23:50 / 00:00 / 00:10 / 00:30 giờ VN với phiên UTC / VN / New York, qua năm, 29/02; lượt ghé, khách mới, điểm 0h–7h sáng tính đúng ngày; 31/02 báo lỗi; bộ dò `gio-utc.mjs` của `kiem-migration` bắt `<cột timestamptz>::date` mà không báo nhầm |
| `node test/test-kho-ipos-ghep-ma-v1.mjs`, `test-kho-chi-muc-tra-nguoc.mjs` | **`0072`**: ghép lại bằng `kho_ipos_gan_ma` (v1) món đang gắn ô sang gói cân / bỏ qua / món khác → bỏ ô như v2; năm chỉ mục tra ngược của kho và chỉ mục mốc `nhat_ky_tin` được planner dùng (EXPLAIN) |
| `node test/test-bao-dong-don-nhat-ky.mjs` | **dọn nhật ký `0073`**: một lượt báo động xóa đúng dòng quá hạn của bốn bảng, giữ dòng trong hạn, tin chờ gửi, 10 lượt iPOS mới nhất và nhịp tim cron; đèn iPOS / tin Zalo không đổi; tối đa 5.000 dòng mỗi lượt; lượt bị khóa không dọn; dọn hỏng (cả hết giờ) thì lượt vẫn chạy, câu lỗi ở `loi_don` — `test-bao-dong-web.mjs` kiểm Worker ghi nó vào lỗi của lượt và đèn Báo động đỏ; câu dọn đi qua chỉ mục; hàm dọn là nội bộ |
| `node test/test-tuyen-dung-sdt-rong.mjs` | **hồ sơ ứng tuyển không có số điện thoại `0080`**: anon nộp với số "abc", rỗng, dấu cách, "---", null → từ chối đúng câu, không dòng nào; số hợp lệ mọi dạng vẫn nhận, lưu dạng chuẩn; nộp hai lần một dòng; ràng buộc `ho_so_sdt_bat_buoc` chặn cả ghi thẳng và quản lý xóa trắng số, ẩn danh vẫn chạy; câu báo vi / en / ko; `0080` chép nguyên văn `0026` trừ một dòng; không hàm nào trong database còn `not sdt_hop_le(x)` thiếu `x is null or` |
| `node test/test-dat-ban-goi-lai.mjs` | **gửi đặt bàn hai lần `0062`**: gửi lại y hệt → một dòng, cùng mã, một tin Zalo, một dòng đồng ý, không trừ chỗ hai lần; lượt đầu lấy bàn cuối hay khung giờ vừa qua thì gửi lại vẫn nhận mã cũ; khác bất kỳ trường nào, dòng cũ đã hủy / đã xác nhận / quá 10 phút → dòng mới; số điện thoại viết khác kiểu là một; phiên đăng nhập không thuộc CRM không lấy được mã của khách; giao dịch đầu hủy giữa chừng thì gửi lại ra đúng một dòng |
| `node test/test-zalo-xac-nhan.mjs` | **tin Zalo đặt bàn chỉ đi khi đã xác nhận `0063`**: yêu cầu web / Messenger / nhân viên ghi hộ chưa xác nhận → không tin nào, kể cả khi đổi giờ; bấm "Đã gọi xác nhận" → đúng một ZBS-01 + một ZBS-02, bấm đúp không thêm; hẹn sau nửa đêm (giờ VN), xác nhận sát giờ; tin xếp trước `0063` cho yêu cầu chưa xác nhận bị máy gửi giữ lại, xác nhận rồi mới đi (đúng một lần), hủy / quá giờ thì bỏ; ai không được xác nhận thì không làm nảy tin; trigger hỏng không làm hỏng việc xác nhận |
| `npm run test:zalo` | **gửi tin Zalo `0046`–`0047`**: đặt bàn được xác nhận → đúng một ZBS-01 + một ZBS-02 (giờ hẹn − 2 tiếng), không trùng khi gọi lại; hủy / đổi giờ; mẫu chưa duyệt / Zalo tắt → không xếp; khách lần đầu nhận giao dịch nhưng không nhận chăm sóc; trần 2 tin/tháng tính cả tin chờ; khung giờ; xem trước chiến dịch; lượt gửi của máy (khóa 10 phút, kiểm lại, thử lại); máy không đọc được bảng CRM, không ai ngoài máy lấy được token |
| `node test/test-suc-khoe.mjs`, `test-suc-khoe-web.mjs` | **bảng sức khỏe hệ thống `0055`**: chỉ chủ (mọi chi nhánh) và quản lý (chi nhánh của mình) đọc được — vai khác, người đã nghỉ, tài khoản máy, anon bị từ chối; database mới không báo nhầm; đặt bàn / hồ sơ nằm im, tin Zalo kẹt, lỗi bot Messenger, ô dịch lỗi, sổ kho lệch đếm đúng từng chi nhánh; đèn iPOS giống hệt màn Kết nối iPOS, nhịp tim = lượt cron gần nhất; không trả SĐT, tên, token, câu lỗi thô; tên từng ô khớp giữa database và web. Phía web: từng ngưỡng màu, câu vi/en, và không đọc được thì không bao giờ báo "mọi thứ đang chạy tốt" |
| `node test/test-bao-dong.mjs` | **báo động `0059`–`0060`**: `0059` đúng một lệnh; chỉ máy `may_bao_dong` đang làm gọi được bốn RPC (mọi vai khác, máy đã tắt, máy Zalo / Messenger / iPOS, tài khoản không có dòng `nhan_su`, anon bị từ chối); máy không đọc được bảng nào, không gọi được hàm nội bộ hay hàm của máy khác; khóa lượt 10 phút, lượt cũ không nhả khóa của lượt mới; một đèn đỏ qua nhiều lượt vẫn là một sự cố; chập chờn trong 15 phút không thành sự cố mới, đỏ lại sau 15 phút hết đỏ (tin hết đỏ đang giữ tới 07:00) thành sự cố mới; danh sách đèn không đầy đủ thì không đóng gì; đánh dấu "đã gửi" gọi lại không đổi mốc, đánh dấu hết đỏ đóng luôn sự cố; hết giờ khi đọc số liệu (statement_timeout) vẫn chạy lượt; đối soát sổ kho dùng lại dưới 30 phút; câu lỗi lưu lại đã xóa token / SĐT; dọn sự cố quá 90 ngày. `test-suc-khoe.mjs` nhóm 13: `kho_ipos_trang_thai`, `suc_khoe_he_thong` và `suc_khoe_sao_luu` sau khi tách cho kết quả y hệt hàm cũ; mọi đèn trang `/noi-bo` thấy thì lượt báo động thấy y hệt |
| `node test/test-bao-dong-web.mjs` | **báo động phía web**: luật từng mốc giờ VN (21:59 / 22:00, 06:59 / 07:00, 07:59 / 08:00, 23:50 / 00:10), trần 5 tin không đặt lại lúc nửa đêm, đèn hệ thống hết đỏ ban đêm chỉ báo ngay khi tin đỏ cũng đến trong đêm (sao lưu ổn lại 3 giờ sáng → 07:00), tóm tắt 8 giờ kể cả khi mọi thứ xanh, không đọc được số liệu thì không "đã ổn lại" giả; câu chữ vi / en, số kiểu Việt, cắt cho vừa kênh; việc chạy nền đầu–cuối trên database với kênh giả: gửi hỏng / treo / đánh dấu hỏng / mất mạng giữa chừng, khóa, cron riêng |
| `npm run test:messenger` | **bot Messenger `0052`–`0053`**: quyền từng RPC (máy chỉ gọi RPC máy, người không gọi RPC máy, không phiên cũng bị từ chối); máy không đọc / ghi bảng CRM, không có việc kho, đọc đúng bằng máy Zalo; anon không gọi được `mess_*`, danh sách của anon không đổi, khối chốt quyền chép nguyên văn; chỉ lưu PSID đã băm; phiên giữ nguyên khi null, tạm dừng / bỏ tạm dừng; khóa ≥ 5 lần tra sai / 15 phút; dọn phiên > 30 ngày; thống kê, câu lỗi không lộ token / SĐT; cài đặt của chủ, tổng quan 7 ngày |

**Thử tải** (không nằm trong `npm test` — gọi project Supabase thật qua mạng): `npm run thu-tai` mô phỏng N nhân viên mở các trang kho trên **Beeftown-thu**, chỉ đọc, dừng ngay nếu database có chi nhánh nào tên không chứa "BẢN THỬ". Cách chạy và ngưỡng đạt ở README gốc, mục "Hạ tầng cho 100 người dùng cùng lúc".

**Chạy lại toàn bộ kiểm thử sau mỗi lần sửa migration.** Chúng đã bắt được lỗi thật, không phải một lần:

- `generate_series` không nhận kiểu `time`;
- ba hàm xem lịch trống thiếu `security definer` khiến website không gọi được;
- **`alter default privileges ... revoke` không chặn được hàm mới** — Postgres cấp EXECUTE cho PUBLIC như một mặc định dựng sẵn trong nhân, không phải một dòng trong `pg_default_acl`. Bốn hàm helper vừa tạo trong chính `0008` đã lọt ra ngoài, và mục 1 của `test-an-toan.mjs` bắt được;
- **seed tin tuyển dụng chèn đúng 0 dòng mà không báo lỗi**, vì nó đọc bảng `chi_nhanh` lúc bảng còn rỗng. Nay là hàm `tao_tin_tuyen_dung_mau()` gọi sau khi đã tạo chi nhánh;
- **ràng buộc giá làm quản lý không đề xuất được giá cho món đã công bố** — một trạng thái vận hành bình thường bị chặn nhầm. Nay tách `gia_de_xuat` khỏi `gia`.
- **`coalesce(..., false)` ở hai vế lọc của `v_viec_dich`** (`0036`). Gỡ đi thì ô CHƯA TỪNG DỊCH biến mất khỏi danh sách việc — `not (null = x)` là null, và WHERE coi null là sai. `test-ban-dich.mjs` đỏ năm chỗ khi thử gỡ.

`test-phan-quyen.mjs` (như mọi file dựng database qua `dungDatabaseTrong()` của `kho-chung.mjs`) **mô phỏng quyền mặc định của Supabase** trước khi chạy migration. Thiếu khối đó thì mọi khẳng định "anon không làm được X" đều đúng một cách RỖNG — đúng vì PGlite vốn không cấp gì cho `anon`, chứ không phải vì schema an toàn.
Chiều ngược lại cũng sai được: **cấp hàng loạt SAU khi nạp migration** (`grant execute on all functions … to authenticated`)
xoá trắng mọi `revoke` của migration — bảy file test cũ từng tự dựng Supabase giả và cấp như vậy cho tới 12/10/2026; nay
chúng dùng `kho-chung.mjs`, và `test-quy-trinh.mjs` mục 6 chặn.

### Kiểm thử tự động (CI)

GitHub Actions chạy bộ này mà không cần ai nhớ (`.github/workflows/`, xem `CLAUDE.md` ở gốc repo):

- **Đẩy nhánh có đổi migration** → `gac-nhanh.yml` kiểm số migration trong ~30 giây.
- **Mở / cập nhật PR, gộp vào main** → `kiem-thu.yml` chạy `node test/chay-tat-ca.mjs --tat-ca`, Beeftown Cân,
  và phía web. Main nhận commit thì còn comment vào PR đang mở nào vừa bị trùng số migration.
- **00:30 giờ Việt Nam mỗi đêm** → chạy lại toàn bộ với `TZ=Asia/Ho_Chi_Minh`, đúng khung 0h–7h khi ngày UTC
  còn là hôm qua.

Kết quả từng file và số migration kế tiếp nằm ở tab Actions → lượt chạy → Summary.

## Cấu trúc

```
crm/
├── supabase/migrations/     ← schema, đánh số theo thứ tự chạy
│   ├── 0001_nen_mong.sql        chi nhánh · nhân sự · chuẩn hóa SĐT · hàm phân quyền
│   ├── 0002_khach_hang.sql      khách · nhật ký đồng ý · lượt ghé
│   ├── 0003_the_thanh_vien.sql  sổ cái điểm · ba luật tính điểm
│   ├── 0004_dat_ban.sql         bàn · khung giờ · số bàn còn trống
│   ├── 0005_phan_nhom_va_chi_so.sql   6 nhóm khách · 6 chỉ số
│   ├── 0006_gui_tin.sql         mẫu tin ZBS · chiến dịch · nhật ký gửi
│   ├── 0007_phan_quyen.sql      chính sách RLS
│   ├── 0008_siet_an_toan.sql    ⚠ VÁ 4 LỖ HỔNG — phải chạy trước 0009+
│   ├── 0009_tep_va_anh.sql      khung ảnh có tên · chốt chặn ảnh minh họa
│   ├── 0010_noi_dung_cong_bo.sql   CỔNG NỘI DUNG — công tắc từng dữ kiện
│   ├── 0011_thuc_don.sql        31 món · duyệt giá từng món · bò xem tại quầy
│   ├── 0012_tuyen_dung.sql      tin tuyển dụng · hồ sơ · vé tải CV
│   ├── 0013_cong_khai_va_do_luong.sql   API công khai · đo lường website
│   ├── 0014_storage_supabase.sql   kho file — PGlite BỎ QUA, kiểm bằng tay
│   ├── 0015_dat_noi_dung.sql    công bố một dữ kiện trong MỘT giao dịch
│   ├── 0016_va_ve_tai_cv_va_quyen_thu_hoi.sql   ⚠ VÁ 3 LỖI — xem đầu file
│   ├── 0017_kho_vai_tro.sql     KHO · 3 vai mới — ⚠ CHẠY RIÊNG, trước 0018
│   ├── 0018_kho_tuong_ngan.sql  KHO · vai kho không thấy/ghi dữ liệu CRM · bảng quyền kho
│   ├── 0019_kho_danh_muc.sql    KHO · vị trí, mặt hàng, NCC, lý do, ô thông tin tự tạo, cài đặt
│   ├── 0020_kho_so_cai_nhap.sql KHO · lô hàng, sổ kho bất biến, tồn, phiếu nhập + duyệt
│   ├── 0021_kho_chung_tu_anh.sql  KHO · kho file ảnh chứng từ — PGlite BỎ QUA phần storage
│   ├── 0022_kho_pha_loc.sql     KHO · phiên pha lóc: thu hồi, chia giá vốn không lệch một đồng
│   ├── 0023_kho_xuat_kiem_ke.sql  KHO · chuyển quầy, xuất bếp, hủy qua "chờ hủy", kiểm kê
│   ├── 0024_kho_cong_no_bao_cao.sql  KHO · đối chiếu hóa đơn, công nợ, thanh toán, trả NCC, báo cáo
│   ├── 0025_va_quyen_kiem_ve_tai_cv.sql   anon gọi được hàm kiểm vé — CV mới tải lên được
│   ├── 0026_form_theo_tung_tin.sql   mỗi tin tự chọn form hỏi gì — chỉ tin cần CV mới có ô CV
│   ├── 0027_duyet_luong_tin_tuyen_dung.sql   chỉ chủ nhà hàng và quản lý đổi được lương chính thức
│   ├── 0028_don_vi_luong.sql   lương theo giờ hay theo tháng — đơn vị duyệt cùng con số
│   ├── 0029_kho_vai_may.sql             KHO · hai vai máy may_chung (tablet dùng chung), may_ipos (đồng bộ iPOS) — ⚠ CHẠY RIÊNG, trước 0030
│   ├── 0030_kho_viec_thong_bao.sql      KHO · kho_dem_viec (số đỏ trên menu, đã khởi tạo kho chưa) · chuông thông báo · ngưỡng cảnh báo · chỉ số quản trị
│   ├── 0031_kho_thu_kho_khong_tien.sql  KHO · thủ kho không thấy tiền · nhận hàng chỉ kg · kế toán điền giá, duyệt · cảnh báo giá nhập
│   ├── 0032_kho_quay.sql                KHO · quầy yêu cầu → mang ra (hàng đi đường) → bấm nhận · đếm quầy cộng dồn bằng máy quét · xuất khác
│   ├── 0033_kho_pha_quet_the_kho.sql    KHO · pha lóc bằng quét nhãn · nơi để sau pha theo món · báo thu hồi thấp (quản lý "Đã xem") · thẻ kho
│   ├── 0034_kho_may_chung.sql           KHO · máy tính bảng dùng chung (đổi người bằng PIN băm HMAC, khóa khi sai nhiều) · chủ tự tạo / khóa tài khoản kho
│   ├── 0035_kho_dau_ky_thiet_lap.sql    KHO · nợ đầu kỳ NCC (phiếu ND-) · tồn đầu kỳ dạng lưới (1 phiếu/vị trí) · tiến độ Thiết lập, đánh dấu bỏ qua bước
│   ├── 0036_tieng_han_va_ban_dich.sql   tiếng Hàn · sổ bản dịch · máy dịch không ghi bản của câu cũ
│   ├── 0037_kho_ipos.sql                KHO · đồng bộ bán hàng iPOS: việc dong_bo_ban (máy may_ipos) · hộp thư HĐ → trừ kho FEFO ở quầy, thiếu hàng / chưa khớp tự thử lại · chặn kiểm kê quầy · doanh thu thật (token iPOS KHÔNG vào DB)
│   ├── 0038_kho_dinh_luong.sql         KHO · định lượng món (gram mỗi suất, dán Excel, lấy món từ iPOS) · đối chiếu Xuất bếp + chuyển bếp với suất bán iPOS × gram · cảnh báo dinh_muc_lech (không trừ kho theo định lượng)
│   ├── 0039_kho_dat_hang.sql           KHO · đặt hàng NCC (đơn DH-, thủ kho lập nháp chỉ kg, quản lý điền giá dự kiến + gửi) · gợi ý số kg nên đặt · nhận hàng theo đơn (nhan_mot_phan / da_nhan tự đổi) · đánh giá NCC · cảnh báo don_dat_tre
│   ├── 0040_kho_cong_no_v2.sql         KHO · công nợ kiểu iPOS · NCC hoàn tiền (HT-) / bù trừ (BT-) · hóa đơn gộp nhiều phiếu (chia khớp từng đồng, bỏ đối chiếu khi chưa trả) · trả hàng hai bước (thủ kho ghi kg, kế toán xác nhận tiền) · công nợ theo kỳ · dữ liệu xuất MISA + mã TK mặc định · nhật ký đổi tài khoản NCC, cảnh báo chủ
│   ├── 0041_kho_sua_nhanh_bao_cao.sql  KHO · sửa hàng loạt mặt hàng (ô trống giữ, phiên bản chống ghi đè, tất cả hoặc không, lỗi từng dòng) · báo cáo theo tháng (tiền chỉ vai xem giá) · mua hàng theo NCC / mặt hàng · sổ thanh toán
│   ├── 0042_kho_ipos_callback.sql      KHO · iPOS tự đẩy hóa đơn (callback Event 11): nhận gói gọn một lời gọi, chống trùng theo mã HĐ · bán theo kg / gói / suất (món chế biến chỉ đếm suất) · danh mục món iPOS (không giá) · mất kết nối = lâu không nhận hóa đơn trong giờ mở cửa · đếm quầy không bị chặn khi quán vắng · bỏ thông tin khách khỏi raw
│   ├── 0043_loai_hop_dong_chua_chot.sql  loại hợp đồng của vị trí tuyển được để trống = "chưa chốt" (trang công khai không hiện dòng đó)
│   ├── 0044_kho_ly_do_dinh_muc.sql     KHO · lý do Xuất bếp "không tính định mức" (cột tinh_dinh_muc, mặc định tắt cho "Cơm nhân viên", kể cả lý do thêm sau) · bếp nhận trong đối chiếu định mức và cảnh báo lệch bỏ các phiếu Xuất bếp đó
│   ├── 0045_va_quyen_ham_crm.sql       ⚠ VÁ — ghi_luot_ghe, tim_hoac_tao_khach, xep_hang_gui_tin tự kiểm vai (phải chạy TRƯỚC khi bật đăng ký tài khoản trên Supabase Auth)
│   ├── 0046_zalo_vai_may.sql           ZALO · vai máy may_zalo + trạng thái tin da_huy — ⚠ CHẠY RIÊNG, trước 0047
│   ├── 0047_zalo_gui_tin.sql           ZALO · hàng gửi (khoa_gui chống trùng, hẹn giờ, thử lại) · đặt bàn → ZBS-01 ngay + ZBS-02 trước 2 tiếng · đặt bàn = giao dịch · trần 2 tin chăm sóc/tháng + khung giờ · zalo_cau_hinh (token chỉ bản mã) · RPC máy may_zalo + RPC chiến dịch (danh sách ở đầu file)
│   ├── 0048_kho_theo_tang.sql          KHO · theo dõi theo tảng: món bật theo_tang nhận mỗi dòng một tảng có ngày mổ · duyệt → lô mang số tảng (#0142) và ngày ủ xong tra bảng ủ (kho_bang_u) · view kho_v_tang (đang ủ / sẵn sàng lóc)
│   ├── 0049_kho_o_ma.sql               KHO · ô mã xoay vòng: phần cắt theo tảng có ô mã cố định (kho_o_ma, không trùng mã cân món) · kho_giao_o_ma giao ô trống cho phiên lóc một tảng, chốt → ô gắn lô ra, hết tồn → ô dùng lại · mỗi phiên món theo tảng chỉ một tảng · quét phiên lóc / kiểm kê nhận nhãn mã ô · view kho_v_o_ma_giao
│   ├── 0050_kho_repack_truy_vet_tang.sql  KHO · repack: dòng nhập có kg sau repack (so_kg_thuc), tiền theo kg NCC, lô theo kg sau repack → giá vốn chia lại · tảng thiếu kg repack không gửi / duyệt được · kho_bao_cao_ncc thêm hao repack · kho_lo.tang_goc_id, view kho_v_lo_tang · kho_truy_vet_tang, kho_bao_cao_tang · kho_huy_ca_tang (mỗi vị trí một phiếu XH, kho_huy_tang)
│   ├── 0051_kho_ipos_o_ma.sql          KHO · bán qua iPOS theo ô mã → trừ đúng lô của tảng: kho_ipos_ma_hang.o_ma_id (kho_ipos_gan_o_ma), mã món iPOS trùng mã ô tự nhận, nhãn cân mã ô · lô của ô lúc bán không đủ → FEFO + kho_ipos_dong.lech_o · view kho_v_ipos_dong thêm số ô, số tảng
│   ├── 0052_messenger_vai_may.sql      MESSENGER · vai máy may_messenger — ⚠ CHẠY RIÊNG, trước 0053
│   ├── 0053_messenger_bot.sql          MESSENGER · mess_phien (khóa = HMAC của PSID, tự xóa sau 30 ngày, khóa tra cứu sai ≥ 5 lần/15 phút) · mess_cau_hinh (bot mặc định tắt) · mess_thong_ke_ngay (chỉ đếm) · RPC máy may_messenger + RPC cài đặt (chủ) + tổng quan (chủ / quản lý) — danh sách ở đầu file
│   ├── 0054_kho_may_quay.sql           KHO · máy quầy (Beeftown Cân): mã giảm giá hàng cận date, bảng quầy, tảng & ô mã, báo cáo bán theo giờ
│   ├── 0055_suc_khoe_he_thong.sql      SỨC KHỎE · suc_khoe_he_thong(): số liệu cho bảng đèn ở /noi-bo (chủ: mọi chi nhánh, quản lý: chi nhánh của mình) — chỉ số đếm và mốc giờ, không bảng mới · cột bat_luc (trigger ghi_luc_bat) ở zalo_cau_hinh, mess_cau_hinh
│   ├── 0058_sao_luu_hang_dem.sql       SAO LƯU · he_thong_sao_luu (mỗi lượt sao lưu hằng đêm một dòng — workflow ghi) · suc_khoe_sao_luu(): đèn "Sao lưu dữ liệu" (chủ / quản lý)
│   ├── 0059_bao_dong_vai_may.sql       BÁO ĐỘNG · vai máy may_bao_dong — ⚠ CHẠY RIÊNG, trước 0060
│   ├── 0060_bao_dong.sql               BÁO ĐỘNG · tách kiểm quyền khỏi phần tính (kho_ipos_trang_thai_goc, suc_khoe_so_lieu — nội bộ) · bao_dong_trang_thai (khóa lượt, nhịp tim, kênh) · bao_dong_su_co (mỗi đèn đỏ một sự cố, không lưu câu chữ) · bốn RPC máy bao_dong_* — danh sách ở đầu file
│   ├── 0061_kho_can_quay.sql           KHO · Beeftown Cân báo về kho (máy cân kho_may_can, tem đã in kho_can_tem, ô mã đang giao cho mọi vai xem) — chạy sau 0060, 0049, 0054
│   ├── 0062_dat_ban_goi_lai.sql        ĐẶT BÀN · tao_dat_ban() gọi lại Y HỆT (số điện thoại, chi nhánh, ngày, giờ, số khách, dịp, ghi chú, đồng ý nhận tin) trong 10 phút, dòng cũ còn cho_xac_nhan → trả lại dòng cũ và mã cũ, không ghi gì thêm · chỉ lời gọi không phiên (website, Messenger)
│   ├── 0063_zalo_chi_gui_khi_xac_nhan.sql ZALO · ZBS-01/ZBS-02 chỉ xếp khi nhân viên bấm "Đã gọi xác nhận" (cho_xac_nhan → da_xac_nhan), không phải lúc khách gửi yêu cầu · zalo_xep_tin_dat_ban(p_dat_ban_id, p_vua_xac_nhan, p_doi_gio) · máy gửi không lấy tin của đặt bàn chưa xác nhận (tin xếp trước 0063 nằm chờ)
│   ├── 0065_crm_bo_policy_ghi_thang.sql ⚠ VÁ — bỏ policy ghi thẳng nhat_ky_dong_y, nhat_ky_tin, so_cai_diem, luot_ghe, khach_hang (mọi đường ghi là hàm definer tự kiểm vai) · don_dep_phieu_tai_len kiểm vai
│   ├── 0069_crm_quyen_chi_nhanh.sql   ⚠ VÁ — tim_hoac_tao_khach không trả hồ sơ khách chi nhánh khác, khách mới chỉ cho chi nhánh mình · phieu_do_launch, tao_tin_tuyen_dung_mau đúng chi nhánh · xep_hang_gui_tin có khoa_gui (bấm đúp = một tin, tin hỏng thì gửi lại được), khách / chiến dịch / mẫu đúng · trigger dat_ban_kiem_sua (thêm + sửa): đặt bàn chỉ đổi theo đúng 5 bước của hộp thư, không đổi khách / chi nhánh / mã / đồng ý / nguồn; cột mới dat_ban.nguoi_tao ghi nhân viên ghi hộ
│   ├── 0070_crm_policy_doc_tinh_mot_lan.sql ⚠ VÁ — tám policy đọc chỉ kiểm "có đăng nhập" (nội dung, ảnh, thực đơn, mẫu tin) và kho file beeftown-noi-bo: chỉ bốn vai CRM đang làm · mọi policy CRM tính hàm phân quyền MỘT LẦN (crm_cn_duoc(), (select …)) — 5.000 khách: 339 → 10 ms
│   ├── 0071_crm_chi_so_ngay_vn.sql    ngay_vn(timestamptz) · chi_so_crm đếm ngày theo giờ Việt Nam (lượt ghé 0h–7h sáng không lệch sang hôm trước)
│   ├── 0072_kho_ghep_ma_v1_chi_muc.sql  KHO · kho_ipos_gan_ma (v1) ghép lại = bỏ ô mã như v2 · năm chỉ mục tra ngược (lô ↔ phiên pha / phiếu nhập / dòng xuất)
│   ├── 0073_bao_dong_don_nhat_ky.sql  lượt báo động 5 phút dọn nhat_ky_tra_cuu (30 ngày), kho_may_nhat_ky (180), kho_ipos_lan_chay (90, giữ 10 lượt mới nhất + nhịp tim), nhat_ky_tin (400, không xóa tin chờ gửi); dọn hỏng không làm hỏng lượt — câu lỗi về Worker (loi_don) → đèn Báo động · chỉ mục mốc nhat_ky_tin cho bảng sức khỏe, chỉ mục thời gian cho câu dọn
│   ├── 0074_xoa_file_cv.sql            ⚠ VÁ TUYỂN DỤNG · ẩn danh hồ sơ hết hạn KHÔNG còn xóa đường dẫn của CV chưa xóa: web xóa file trong kho trước (ho_so_cv_het_han → Storage → an_danh_ho_so_het_han) · ho_so_thu_muc_cv_mo_coi: thư mục kho CV không hồ sơ nào trỏ tới → xóa trước khi dọn vé · trigger ho_so_khoa_cot_don_dep: người đăng nhập không sửa thẳng duong_dan_cv, luu_den, da_an_danh · ô don_dep cho đèn "Dọn dữ liệu cá nhân"
│   └── 0080_ho_so_sdt_bat_buoc.sql    ⚠ VÁ TUYỂN DỤNG · nop_ho_so_ung_tuyen từ chối số không có chữ số nào ("abc", rỗng, null — chuan_hoa_sdt trả null, sdt_hop_le(null) là null nên "if not" không chạy): thân 0026 + "v_sdt is null or" · ràng buộc mới ho_so_sdt_bat_buoc (chưa ẩn danh thì phải có sdt)
└── test/                    ← kiểm thử chạy trên Postgres thật
    └── kho-chung.mjs            khung dựng database dùng chung cho test-kho-*.mjs và test-quyen-ham-crm.mjs
```

### Thứ tự chạy có ràng buộc

- **`0008` phải chạy trước mọi file sau nó.** Khối `alter default privileges` trong đó là thứ bảo vệ toàn bộ bảng tạo ra ở `0009`–`0015`.
- **`0009` và `0011` phụ thuộc vòng.** `tep_anh.mon_an_id` trỏ tới `mon_an` chưa tồn tại; cột ra đời ở `0009` không kèm khóa ngoại, khóa ngoại được thêm ở cuối `0011`.
- **File nào tạo hàm thì PHẢI kết thúc bằng khối chốt quyền.** Xem `0008` mục 6.
- **View mới PHẢI khai `security_invoker = true` tường minh.** Mặc định của Postgres là view chạy dưới quyền người tạo, tức đi xuyên qua RLS của bảng bên dưới — đúng lỗ hổng số 2 mà `0008` đã vá. `0008` chỉ sửa được 7 view có mặt lúc đó. `test-an-toan.mjs` mục 2 liệt kê `pg_class` và bắt đúng chuyện quên này; nó đã bắt được `v_bang_cong_tac` ngay lần chạy đầu tiên của `0015`.
- **`0029` phải chạy RIÊNG, một mình, trước `0030`** — cùng lý do với `0017` (thêm `may_chung`, `may_ipos` vào `vai_tro`).
- **`0046` phải chạy RIÊNG, một mình, trước `0047`** — cùng lý do với `0017` (thêm `may_zalo` vào `vai_tro`, `da_huy` vào `ket_qua_gui`).
- **`0052` phải chạy RIÊNG, một mình, trước `0053`** — cùng lý do (thêm `may_messenger` vào `vai_tro`).
- **`0059` phải chạy RIÊNG, một mình, trước `0060`** — cùng lý do (thêm `may_bao_dong` vào `vai_tro`). `0060` cần `0055` (bảng sức khỏe) và `0058` (sao lưu).
- **`0017` phải chạy RIÊNG, một mình, trước `0018`.** Nó thêm giá trị vào enum `vai_tro`; Postgres không cho dùng giá trị enum mới trong cùng giao dịch vừa thêm nó. Migration mới nào có `alter type … add value` cũng phải có một dòng như thế ở đây — `test-quy-trinh.mjs` mục 5 đỏ khi thiếu, và khi cây thư mục ở trên thiếu file.
- **Đừng tạo tài khoản vai kho trước khi chạy `0018`.** `0018` là tường ngăn: trước nó, một thủ kho đọc được số điện thoại khách.
- **`0014` là file duy nhất PGlite không chạy.** Toàn bộ DDL kho file bọc trong khối kiểm tra schema `storage`. Danh sách kiểm tra bằng tay nằm ở cuối file đó — **bắt buộc làm trên Supabase thật.**
- **Khối chốt quyền từ `0025` trở đi PHẢI giữ dòng `ve_con_hieu_luc(text)`.** Policy tải CV trên `storage.objects` gọi hàm đó dưới vai `anon`. Chép danh sách từ một file cũ hơn là CV lại rơi im lặng, và PGlite không có storage để thấy; `DUOC_PHEP` trong `test-an-toan.mjs` và mục 7 của `test-dat-noi-dung.mjs` mới bắt được.
- **Số migration không được trùng giữa các nhánh làm song song.** Supabase CLI coi phần số là phiên bản, nên hai file cùng số không cùng tồn tại được. Nhánh kho dùng `0017`–`0024`. Nhánh này lúc đầu dùng `0023`, `0025`, `0026` — `0023` trùng với nhánh kho — nên ngày 25/09/2026 đã đánh lại thành `0025`, `0026`, `0027`, giữ nguyên thứ tự giữa ba file. Bản vá quyền hàm CRM viết ở nhánh `gom-ve-local` với số `0022` rồi `0031` (đều trùng số kho), khi đưa vào main (27/09/2026) đã đánh lại thành `0045`. Migration mới lấy số sau số lớn nhất trên **mọi** nhánh đang mở: `0028` là đơn vị lương; nhánh kho giai đoạn 4–5 (PR #9) giữ `0029`–`0035`; tiếng Hàn và bản dịch là `0036`; đồng bộ iPOS của kho là `0037`; định lượng món của kho là `0038`; đặt hàng NCC của kho là `0039`; công nợ v2 của kho là `0040`; sửa hàng loạt và báo cáo của kho là `0041`; iPOS đẩy hóa đơn (callback) của kho là `0042`; loại hợp đồng "chưa chốt" là `0043`; lý do Xuất bếp không tính định mức (cơm nhân viên) của kho là `0044` — PR #9 viết nó là `0043`, trùng với `0043` đã chạy trên production trước, nên khi gộp đã đánh lại thành `0044` (26/09/2026); vá quyền ba hàm CRM là `0045`; gửi tin Zalo ZBS là `0046` (vai máy, chạy riêng) và `0047`; theo dõi theo tảng của kho là `0048`, ô mã xoay vòng là `0049`, repack và truy vết tảng là `0050` — ba file này viết ở PR #21 với số `0046`–`0048`, trùng Zalo đã gộp trước, nên khi gộp đã đánh lại (27/09/2026) ; bán qua iPOS theo ô mã là `0051`; bot Messenger đặt bàn là `0052` (vai máy, chạy riêng) và `0053` — viết lúc đầu với số `0051`–`0052`, trùng `0051` của kho đã gộp trước, nên khi gộp đã đánh lại (27/09/2026) ; máy quầy của Beeftown Cân là `0054`; bảng sức khỏe hệ thống là `0055`; sao lưu hằng đêm là `0058`; báo động khi đèn đỏ là `0059` (vai máy, chạy riêng) và `0060` — viết lúc đầu với số `0056`–`0057`, nhỏ hơn `0058` đã gộp trước, nên khi gộp đã đánh lại (30/09/2026). **Số kế tiếp: chạy `npm run so-migration`** — không ghi tay ở đây nữa; `kiem-migration.mjs` chặn số trùng trên CI mỗi lần đẩy nhánh. `0036` đã chạy trên project Supabase với tên lịch sử `0029_tieng_han_va_ban_dich`, đặt trước khi thấy PR #9 — nội dung y hệt file. Khối chốt quyền của mọi file nhánh khác đều viết trước `0025` nên thiếu dòng `ve_con_hieu_luc(text)`: sau khi gộp, khối chốt quyền **chạy cuối cùng** phải có dòng đó, và `DUOC_PHEP` sẽ đỏ nếu thiếu. Trên một database đã có sẵn, đừng chạy file nào có khối chốt quyền thiếu dòng đó sau `0025`.

## Nhật ký kiểm tay kho file

`0014` bắt kiểm tay vì PGlite không có schema `storage`, và dặn ghi lại ngày, người kiểm vào đây.

**2026-09-25 · Claude, phiên sửa `0025`.** Chưa phải project Supabase thật: một Supabase thử dựng cục bộ gồm Postgres 17.10, storage-api v1.79.19 (mã nguồn của Supabase) và PostgREST v13.0.8, sau một cổng chung `/rest/v1` + `/storage/v1`, chạy đủ migration. Mọi thao tác dùng **khóa anon** qua `supabase-js`, và chạy cả hàm `nopHoSo()` thật của website.

| Bước | Tới `0016` | Thêm `0025` |
|---|---|---|
| 5 · tải lên `test/x.pdf` | bị từ chối — nhưng vì `permission denied for function ve_con_hieu_luc`, không phải vì kiểm vé | bị từ chối: `new row violates row-level security policy` |
| 6 · xin vé, tải lên `<mã vé>/cv.pdf` | **HỎNG:** `403 permission denied for function ve_con_hieu_luc` | thành công |
| 6 · tải lại đúng đường dẫn đó | bị từ chối (cùng lỗi quyền) | bị từ chối: `409 The resource already exists` |
| 6 · nộp hồ sơ kèm vé, rồi tải thêm vào thư mục vé | bị từ chối (cùng lỗi quyền) | bị từ chối: RLS — vé đã dùng |
| `nopHoSo()` với file `CV Nguyễn Văn Thử.pdf` | `ok: true` kèm câu "hồ sơ được nộp không kèm CV" | **vẫn không kèm CV:** `Invalid key` — xem dưới. Sửa tên file xong thì kèm được |
| 2 · mở URL công khai của CV vừa nộp, không khóa | — (chưa có CV nào) | bị từ chối (400); có khóa anon cũng không tải về hay liệt kê được |

Hai điều lộ ra, cần biết khi đọc bước 6 ở cuối `0014`:

- **Vé bị đánh dấu "đã dùng" khi nộp hồ sơ, không phải khi tải lên.** Lần tải thứ hai cùng đường dẫn bị chặn vì file đã tồn tại, không phải vì vé. Trước khi `nop_ho_so_ung_tuyen()` chạy, cùng một vé vẫn tải thêm được file **tên khác** (đã thử: thành công).
- **Storage chỉ nhận khóa ASCII.** `tenTepAnToan()` trong `web/src/lib/nop-ho-so.ts` từng giữ chữ có dấu, nên mọi CV đặt tên tiếng Việt có dấu bị trả `Invalid key` và rơi im lặng y như lỗi quyền. Đã sửa: bỏ dấu, giữ chữ (`CV-Nguyen-Van-Thu.pdf`).

**2026-09-25 · lần hai, sau `0026`.** Cùng bộ thử, thêm website chạy bằng `astro dev`, nộp hồ sơ qua đúng form trong trình duyệt:

- Tin *Quản lý sảnh* (có hỏi CV), file `CV Trần Quản Lý.pdf`: hồ sơ kèm CV, file lên kho thành `CV-Tran-Quan-Ly.pdf`, email và năm sinh được lưu.
- Tin *Nhân viên sảnh* (không hỏi CV), vẫn gắn file dù ô đang ẩn: hồ sơ vào, không xin vé, không file nào lên kho, không có câu cảnh báo thiếu CV.
- Tắt năm sinh, bật CV cho *Nhân viên sảnh* ở `/noi-bo/tin-tuyen-dung` (đăng nhập bằng Auth giả của bộ thử): form công khai đổi ngay.

**Chưa làm:** bước 1, 3, 4, 7, 8, và **toàn bộ danh sách trên project Supabase thật** — vẫn bắt buộc trước khi mở cổng tuyển dụng.

**`0074` (xóa file CV khi ẩn danh, quét CV mồ côi) · chưa kiểm tay.** Sáu bước ở cuối `0074_xoa_file_cv.sql` — quản lý không xóa được file, chủ xóa được CV mồ côi và CV của hồ sơ hết hạn, file của hồ sơ còn hạn không bị đụng, quản lý không sửa thẳng được hạn lưu — làm trên project Beeftown-thu rồi ghi kết quả vào đây. `npm test` chỉ thử được phần database và một kho file giả (`test-tuyen-dung-xoa-cv.mjs`).

## Bốn quyết định thiết kế quan trọng

### 1. Sổ cái điểm bất biến

Điểm là tiền, nên `so_cai_diem` **chỉ ghi thêm** — trigger chặn cả `UPDATE` lẫn `DELETE` ở tầng database. Số dư = tổng các dòng, không có cột `balance` để update.

Sửa sai bằng cách ghi thêm một dòng `loai = 'dieu_chinh'`, không sửa dòng cũ. Nhờ vậy luôn truy vết được ai làm gì lúc nào — chuẩn kế toán.

### 2. Số điện thoại chuẩn hóa ở tầng database

`+84912345678`, `0912 345 678`, `84912345678`, `912345678` đều thành `0912345678`. Trigger tự chuẩn hóa khi ghi, nên **không thể** lọt số sai định dạng dù nhập từ web, POS hay tay.

Không có bước này thì một người sẽ thành nhiều hồ sơ, và mọi chỉ số CRM đều sai.

### 3. Phân nhóm khách làm dạng view, không lưu cứng

`v_phan_nhom_khach` tính trực tiếp từ hai con số: số lần ghé và số ngày chưa quay lại. Luôn tươi, không cần job chạy đêm, không có nguy cơ lệch giữa bảng phân nhóm và thực tế.

### 4. Cấu trúc nhiều chi nhánh ngay từ đầu

Mọi bảng nghiệp vụ đều có `chi_nhanh_id` dù hiện chỉ chạy một nhà hàng. Thêm chi nhánh nhượng quyền sau này chỉ cần thêm dòng vào `chi_nhanh` — không phải sửa cấu trúc dữ liệu.

RLS đảm bảo chi nhánh nhượng quyền **không xem được tệp khách của toàn thương hiệu**, chỉ thấy khách đã từng tới chi nhánh mình.

## Cổng nội dung — ý tưởng trung tâm của `0010`

Kế hoạch ra mắt giao khoảng hai mươi đầu việc web, và việc nào cũng lặp lại đúng một câu: **chỉ đăng thứ đã được người thật xác nhận.**

Website nháp cũ làm theo cách sai — viết sẵn nội dung vào HTML rồi trông chờ ai đó nhớ xóa. Kết quả là hotline `0900 000 001`, địa chỉ `[số nhà], [tên đường]`, bốn đánh giá khách bịa và sáu mức giá chưa duyệt đều nằm sẵn trong file chờ được đẩy lên.

Cách làm ở đây: **mỗi dữ kiện là một dòng có công tắc riêng.** Trang công khai đọc qua đúng một hàm `security definer` chỉ trả về dòng đã công bố. Bản nháp nằm cùng bảng nhưng `anon` không có quyền vào bảng — nên **không tồn tại đường nào** để ngày khai trương chưa duyệt lọt ra ngoài.

Bốn điểm thiết kế đáng giữ:

1. **Ghi thêm, không sửa đè.** Đổi ngày khai trương = thêm dòng mới, thu hồi dòng cũ. Vì khi ngày bị dời — và nó sẽ bị dời — thứ cần nhất là gỡ dữ kiện sai **khỏi trang trong vài giây**, chứ không phải chờ soạn xong bản thay thế.
2. **Sổ đăng ký khóa đóng.** Gõ sai tên khóa là lỗi khóa ngoại ngay lúc ghi, không phải một ô trống im lặng trên trang chủ.
3. **Hàm công khai trả đủ MỌI khóa**, khóa chưa duyệt có giá trị `null`. Nhờ vậy front-end phân biệt được "chưa duyệt" với "lập trình viên gõ nhầm".
4. **Công tắc phải có hiệu lực thật.** `tao_dat_ban()` kiểm tra `form_dat_ban_dang_mo` ở đầu thân hàm. Không có bước này thì công tắc chỉ là trang trí: một trang đã nằm trong bộ nhớ đệm trình duyệt vẫn gọi được RPC và vẫn ghi đặt bàn.

**Phép thử:** chạy `select noi_dung_cong_khai()` trên database vừa cài. Mọi khóa phải là `null` trừ `form_dat_ban_dang_mo`. Đó là bất biến, thể hiện bằng dữ liệu chứ không bằng lời hứa.

```sql
select * from v_cong_bo_con_thieu;   -- checklist khai trương
select * from v_anh_con_thieu;       -- danh sách buổi chụp
select * from v_mon_con_vuong;       -- vì sao món F07 chưa lên web
```

## Ba luật tính điểm

Cưỡng chế ở database, không phụ thuộc code app nhớ kiểm tra:

| Luật | Nội dung | Cưỡng chế ở |
|---|---|---|
| 1 | Ngưỡng dùng tối thiểu 50.000đ | `ghi_luot_ghe()` |
| 2 | Không tích điểm trên phần đã trừ bằng điểm | `tinh_diem_tich()` |
| 3 | Không tích điểm trên hóa đơn khuyến mãi | `tinh_diem_tich()` |

Ngoài ra `cau_hinh_tich_diem.ty_le_tich` có **trần cứng 20%** — biên đóng góp chỉ 13,2%, tích 10% đã xóa gần hết lợi nhuận.

## Các hàm chính

| Hàm | Dùng cho | Ai gọi được |
|---|---|---|
| `tim_hoac_tao_khach()` | Điểm vào duy nhất để tạo khách | Chủ sở hữu, quản lý, thu ngân (`0045`); khách chưa từng ghé / đặt bàn ở chi nhánh người gọi chỉ trả id, khách mới chỉ cho chi nhánh người gọi (`0069`); website qua `tao_dat_ban()` |
| `ghi_luot_ghe()` | Thu ngân ghi hóa đơn + tích/trừ điểm | Chủ sở hữu, quản lý, thu ngân — đúng chi nhánh, người ghi lấy từ phiên (`0045`) |
| `xep_hang_gui_tin()` | Xếp một tin vào hàng gửi, sau `duoc_phep_gui()`; gọi lại cùng tin trả đúng tin đã xếp (`khoa_gui`, `0069`) | Chủ sở hữu, quản lý, marketing — đúng chi nhánh, khách của chi nhánh đó (`0045`, `0069`) |
| `so_du_diem()` | Tra số dư điểm | Nhân sự |
| `tao_dat_ban()` | Website tạo đặt bàn | **Công khai (anon)** |
| `lich_trong_theo_ngay()` | Website xem khung giờ trống | **Công khai (anon)** |
| `so_ban_con_trong()` | Số bàn còn nhận tại một khung giờ | **Công khai (anon)** |
| `duoc_phep_gui()` | Chốt chặn trước khi gửi tin — đặt bàn chưa hủy tính là giao dịch, tin chăm sóc có trần tháng (`0047`) | Nội bộ |
| `zalo_*()` | Gửi tin Zalo: 4 RPC máy (`may_zalo`), RPC cài đặt (chủ), RPC chiến dịch (chủ / quản lý / marketing đúng chi nhánh) — chữ ký và JSON trả về ở đầu `0047` | Xem `0047` |
| `mess_*()` | Bot Messenger: 5 RPC máy (`may_messenger`), cài đặt (chủ), tổng quan 7 ngày (chủ / quản lý) — chữ ký và JSON trả về ở đầu `0053`. Đặt bàn / tra / hủy của bot đi qua các hàm anon của website | Xem `0053` |
| `chi_so_crm()` | 6 chỉ số theo dõi, ngày theo giờ Việt Nam (`ngay_vn()`, `0071`) | Quản lý, chủ sở hữu |
| `phieu_do_launch()` | Phiếu đo ra mắt: lượt xem, bấm, ba con số đặt bàn khác nhau | Chủ sở hữu (mọi chi nhánh); quản lý, marketing (chi nhánh của mình, `0069`) |
| `suc_khoe_he_thong()` | Số liệu cho bảng đèn sức khỏe ở `/noi-bo`: việc chạy nền iPOS / Zalo / báo động, lỗi Messenger, máy dịch, yêu cầu và hồ sơ nằm im, sổ kho lệch — chỉ số đếm và mốc giờ. Từ `0060` là lớp kiểm vai bọc `suc_khoe_so_lieu` (nội bộ, kết quả không đổi) | Chủ sở hữu (mọi chi nhánh), quản lý (chi nhánh của mình) (`0055`, `0060`) |
| `suc_khoe_sao_luu()` | Số liệu cho đèn "Sao lưu dữ liệu": lượt sao lưu gần nhất và bản dùng được (khôi phục thử đạt) gần nhất — mốc giờ, cờ, cỡ file. Từ `0060` là lớp kiểm vai bọc `suc_khoe_sao_luu_so_lieu` (nội bộ, kết quả không đổi) | Chủ sở hữu, quản lý (`0058`, `0060`) |
| `ho_so_cv_het_han()` · `an_danh_ho_so_het_han()` | Ẩn danh hồ sơ hết hạn KÈM file CV: đọc đường dẫn CV → web xóa trong kho → ẩn danh hồ sơ không CV hoặc có CV đã chắc chắn xóa (`web/src/lib/xoa-cv.ts`). `don_dep_ho_so_het_han()` từ `0074` chỉ ẩn danh hồ sơ không CV | Chủ sở hữu (`0074`) |
| `ho_so_thu_muc_cv_mo_coi()` | Trong các thư mục web liệt kê từ kho CV: thư mục nào không hồ sơ nào trỏ tới và vé không còn hiệu lực — web xóa file trong đó trước khi dọn vé | Chủ sở hữu, quản lý (`0074`; chỉ chủ xóa được file) |
| `bao_dong_*()` | Báo động: 4 RPC máy (`may_bao_dong`) — bắt đầu lượt / ghi lượt / đã gửi / kết thúc lượt; chữ ký và JSON trả về ở `0060` | Chỉ `may_bao_dong` (`0060`) |

Website công khai **không có quyền vào bảng nào cả** — chỉ gọi được danh sách hàm `SECURITY DEFINER` trong khối chốt quyền ở cuối migration MỚI NHẤT có khối đó. Đừng chép số lượng vào đây: bảng trên đã từng nói "ba hàm" trong khi thực tế là 12, và nó lạc hậu suốt tám migration mà không ai để ý. `test-an-toan.mjs` canh danh sách đó.

## Việc cần làm trước khi chạy thật

- [ ] Tạo project Supabase, chạy các file migration theo thứ tự
- [ ] Tạo tài khoản nhân sự đầu tiên (`chu_so_huu`) và nối `auth_uid`
- [ ] Nhập danh sách bàn thật vào `ban_an`
- [ ] Kho: chạy `0017` riêng, rồi `0018`–`0024`; làm danh sách kiểm tay kho file `kho-chung-tu` ở cuối `0021`; tạo tài khoản vai kho
- [ ] **Xác thực Zalo OA (tick vàng)** — đường găng, làm sớm
- [ ] Tạo tài khoản ZBS + App, gửi 4 mẫu tin trong `mau_tin` đi duyệt (2–3 ngày làm việc)
- [ ] Cập nhật `ma_zalo` và `da_duyet = true` sau khi Zalo duyệt xong
- [ ] Chốt tỷ lệ tích điểm với nhà đầu tư, rồi bật `cau_hinh_tich_diem.dang_bat` ở Tuần 5
- [ ] Rà soát nghĩa vụ dữ liệu cá nhân (NĐ 13/2023) với tư vấn pháp lý
- [ ] Báo động: chạy `0059` riêng rồi `0060`, tạo tài khoản máy `may_bao_dong`, đặt hai bí mật Worker (`web/README.md` mục Báo động); chọn kênh báo

## Lưu ý cho người bảo trì

1. **Đừng bỏ `security definer` và `set search_path = public`** ở các hàm công khai — website sẽ ngừng gọi được, và bỏ `search_path` là lỗ hổng chiếm quyền.
2. **Đừng thêm policy `UPDATE`/`DELETE` cho `so_cai_diem`** — sổ cái phải bất biến.
3. **Chạy `npm test` sau mọi thay đổi migration.**
4. **Luôn gửi tin từ view `v_duoc_gui_tin`** hoặc qua `duoc_phep_gui()`, đừng gửi thẳng từ bảng `khach_hang` — sẽ gửi cho cả người chưa đồng ý.
5. **Xuất dữ liệu phải luôn chạy được** (`v_khach_tong_hop`). Đây là đường lui về phần mềm thuê nếu sau này cần bán doanh nghiệp.
6. **Đừng bao giờ đổi chữ ký của một hàm công khai.** `create or replace` với bộ tham số khác sẽ âm thầm tạo ra một OVERLOAD, và bản cũ vẫn giữ nguyên quyền đã cấp cho `anon`. Cần chữ ký khác thì **đặt tên mới** — xem `lich_trong_theo_ma` ở `0013`.
7. **Website và database nói chuyện bằng TÊN CHUỖI, và không có bước biên dịch nào kiểm chúng.** `rpc('tao_dat_ban', { p_so_khach: 4 })` gõ sai một chữ thì `astro check` vẫn xanh, còn PostgREST thì báo "không tìm thấy hàm phù hợp" — hoặc tệ hơn, chọn một phiên bản khác nhờ tham số mặc định và chạy im lặng với giá trị sai. `test/test-hop-dong-web.mjs` đọc mã nguồn `web/src`, rút ra mọi tên hàm, tham số, bảng và cột, rồi đối chiếu với `pg_proc` và `information_schema`. Nó cũng khẳng định mã chạy dưới vai `anon` không gọi hàm ngoài danh sách 12 hàm đã duyệt, và không đọc thẳng bảng nào.

8. **Thêm hàm mới thì phải cập nhật danh sách `DUOC_PHEP` trong `test/test-an-toan.mjs`.** Danh sách đó là bản sao có chủ ý của khối chốt quyền mới nhất — kể cả hàm chỉ policy storage gọi, như `ve_con_hieu_luc`. Câu DDL nói ý định; bài test mới là thứ chứng minh.
9. **Đừng đổi chữ trong các câu `raise exception` cũ** — bài test khớp regex tiếng Việt (`/hết bàn/i`, `/quá khứ/i`, `/bất biến/i`).
10. **Đừng tham chiếu BẢNG trong schema `auth` từ policy hay trigger** — dùng `la_chu_so_huu()`, `co_vai_tro()`, `co_phien_dang_nhap()` thay vì đọc thẳng `auth.users`.
    Riêng HÀM `auth.uid()` thì gọi thẳng được: Supabase cấp sẵn quyền đó cho `authenticated`, và `0007` đã dùng nó như vậy ở `nhan_su_doc` và `mau_tin_doc`. Bản trước của quy tắc này cấm luôn cả `auth.uid()`, tức là nó mâu thuẫn với chính `0007` — mà `nhan_su_doc` lại nằm trên đường đăng nhập của MỌI request `/noi-bo`.
    **Phép thử một dòng trên project mới:** `select has_schema_privilege('authenticated', 'auth', 'usage');` — trả `false` thì không ai đăng nhập được, và triệu chứng là bị đá về trang đăng nhập dù mật khẩu đúng.
11. **KHÔNG hiển thị `so_ban_con_trong` thành con số ở bất cứ đâu.** Nó là một oracle sức chứa, và hiển thị ra là tạo cảm giác khan hiếm giả — đúng thứ tài liệu thương hiệu cấm. Website dùng `lich_trong_theo_ma()`, chỉ trả về CÓ/KHÔNG còn chỗ.
12. **`duoc_truy_cap_chi_nhanh()` chỉ còn trả true cho bốn vai CRM** (từ `0018`). Vai kho dùng `kho_cn_duoc()` / `kho_duoc()`. Thêm vai mới sau này thì vai đó mặc định KHÔNG thấy dữ liệu CRM — muốn cho thấy phải sửa hàm này có chủ ý.
13. **Thêm hàm kho mới thì phải xếp nó vào `GOI_DUOC` hoặc `NOI_BO` trong `test/test-kho-quyen.mjs`.** Hàm nội bộ (chỉ hàm definer khác gọi) phải `revoke execute ... from authenticated` ở cuối file migration, bọc trong khối kiểm `pg_roles`.
14. **Sổ kho bất biến, tồn kho chỉ do trigger của sổ ghi.** `kho_ton` từ chối mọi lệnh ghi không đến từ trigger của `kho_so_cai` (kiểm `pg_trigger_depth()`), kể cả từ hàm definer. Sửa sai = dòng `dao_nguoc` hoặc chênh lệch kiểm kê. `kho_doi_soat_ton()` phải luôn trả về rỗng.
15. **Pha lóc: tổng giá vốn các lô ra = giá vốn tảng vào, đúng từng đồng.** Mọi phép chia tiền đi qua `kho_chia_so_du_lon_nhat()`. Sửa `kho_tinh_phien_pha()` thì chạy `test-kho-pha-loc.mjs` — nhóm 5 cố ý dùng số lẻ để bắt lệch một đồng.
16. **Hàng hết hạn không lên quầy, không vào bếp.** `kho_phan_bo()` bỏ qua lô hết hạn khi đích là quầy hoặc bếp; hàng hết hạn chỉ có đường báo hủy (qua vị trí "Hàng chờ hủy", quản lý duyệt).
17. **Kiểm kê ghi phần CHÊNH so với sổ chụp lúc gửi, không ghi đè tồn.** Hàng chuyển vào sau khi gửi đếm vẫn còn. Duyệt bị chặn khi vị trí còn phiếu nhập chờ duyệt hoặc phiên pha lóc nháp. Thiếu ở quầy ghi là `ban` chỉ khi `nguon_so_ban = 'kiem_ke'` (chưa nối iPOS) — nối iPOS xong nhớ đổi cài đặt này.
18. **Công nợ không có cột "số dư" nào để sửa.** Còn nợ của một phiếu luôn được TÍNH: hóa đơn (hoặc tổng phiếu) − các khoản thanh toán / giảm trừ còn hiệu lực. Ghi nhầm thì hủy khoản đó rồi ghi lại. Phiếu nhập đã có tiền trả thì trigger chặn hủy phiếu.
19. **Báo cáo là hàm SECURITY INVOKER** (`kho_bao_cao_*`) — đừng đổi sang definer: RLS của người gọi là thứ giữ cho nhân viên quầy nhận cột tiền bằng 0 và thủ kho chi nhánh khác nhận bảng rỗng.
