# .github/ — CI, mẫu PR, mẫu issue

Phiên Claude tự nạp file này khi đọc file trong `.github/` (workflow, mẫu PR, mẫu issue). Quy trình chung (9 mục
"xong", trước khi mở PR) ở `CLAUDE.md` gốc. File này nói: **khi nào CI chạy gì**, để biết một job đỏ là việc của ai
và chạy lại lệnh nào trên máy.

## CI (GitHub Actions)

| Khi nào | Chạy gì | Thời gian |
|---|---|---|
| Đẩy nhánh có đổi migration | `gac-nhanh.yml`: số migration, trùng với nhánh khác | ~30 giây |
| Mở / sửa mô tả / đẩy thêm vào PR (cả nháp) | `mo-ta-pr.yml`: comment "Máy tóm tắt PR" (`tom-tat-pr.mjs` — việc sau khi gộp, cỡ, chỗ cần chú ý; sửa lại comment cũ), mô tả đủ mục (`kiem-mo-ta-pr.mjs`) | ~20 giây |
| Mở / cập nhật PR không phải nháp; bấm "Ready for review" | `kiem-thu.yml`: database, kho, Zalo, Messenger, Beeftown Cân, máy chủ đơn Mini App, Mở rộng FABi; web: astro check, build, đóng gói thử, chữ cấm, trình duyệt. PR nháp bỏ qua hai job này (đỡ phút CI) — chạy đủ kiểm thử trên máy trước khi đẩy | ~10 phút |
| Main nhận commit | như PR, rồi comment vào PR đang mở nào vừa bị trùng số migration | ~10 phút |
| 00:30 giờ VN mỗi đêm | quét chữ cấm trên beeftown.vn thật; toàn bộ với `TZ=Asia/Ho_Chi_Minh` khi main có commit trong 48 giờ qua, đêm Chủ nhật, đêm đầu / cuối tháng, hoặc không hỏi được GitHub (job `co-doi`). Cổng deploy bỏ qua lượt đêm không kiểm mã (`web/kiem-tra/ket-qua-ci.mjs`) | ~1 phút / ~10 phút |
| 02:00 giờ VN mỗi đêm; chạy tay | `sao-luu.yml`: sao lưu database (`crm/sao-luu/`) → mã hoá → artifact 30 ngày → khôi phục thử vào Supabase dựng tạm → ghi `he_thong_sao_luu` (đèn "Sao lưu dữ liệu"). Secret `SAO_LUU_DB_URL`, `SAO_LUU_MAT_KHAU` (`README.md`, "Sao lưu và khôi phục") | ~5–10 phút |
| Main hoặc PR đổi `can-app/`, `web/src/lib/`; chạy tay (gõ số PR) | `dong-goi-can.yml`: kiểm thử Beeftown Cân rồi đóng gói `BeeftownCan.exe` → artifact, Release khi `PHIEN_BAN` mới, bản cài lên kho công khai `beeftown-can-ban-cai` cho nút Cập nhật (secret `TOKEN_BAN_CAI_CAN`) (PR: chỉ đóng gói thử, không tải lên) | ~1 phút |
| Main hoặc PR đổi `mini-app/`; chạy tay | `mini-app.yml`: Mini App Zalo — kiểm tra đơn, tsc, build (không có `.env`, không đưa lên Zalo). Chữ cấm trên chữ của Mini App quét trong `kiem-thu.yml` (`crm/test/test-mini-app-chu.mjs`) | ~1 phút |
| Đầu mỗi tháng | `dependabot.yml`: PR nâng thư viện `web/`, `crm/`, `can-app/`, `mini-app/` và action — bản nhỏ gom một PR mỗi thư mục, bản lớn PR riêng. CI xanh mới gộp | — |

Kết quả: tab Actions → lượt chạy → **Summary** (bảng từng file, số migration kế tiếp).
CI chạy Node 24 (`web/.node-version`); máy cần Node ≥ 22.18 để đọc thẳng file `.ts`.
