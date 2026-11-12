# Beeftown — hướng dẫn cho mọi phiên làm việc

Mỗi phiên Claude mở repo này đều đọc file này. Nó là **quy trình bắt buộc**, không phải gợi ý: lỗi của repo lặp lại
theo đúng chín nhóm ở mục "Định nghĩa xong", và phần lớn lộ ra ở commit "sửa N lỗi sau rà soát" *sau khi* tính năng đã
gộp. Mục tiêu: chặn chúng *trước* khi gộp.

File này nạp ở **mọi** phiên, nên chỉ giữ thứ mọi phiên cần. Chi tiết của một khu nằm ở `CLAUDE.md` của thư mục đó,
bảng CI ở `.github/CLAUDE.md` — cả hai tự nạp khi phiên đọc file ở đó. Codex và các agent khác đọc `AGENTS.md`.

## Repo gồm gì

| Thư mục | Nội dung | Bản đồ |
|---|---|---|
| `web/` | Website Astro trên Cloudflare Workers: trang công khai vi/en/ko, `/noi-bo`, kho, Zalo, Messenger, iPOS | `web/CLAUDE.md` |
| `crm/` | Database Supabase (`supabase/migrations/`) và **toàn bộ kiểm thử** (`test/`, chạy trên PGlite) | `crm/CLAUDE.md` |
| `can-app/` | Beeftown Cân (Windows `.exe`, Bun): gửi giá xuống cân TMA, máy quầy | `can-app/CLAUDE.md` |
| `mini-app/` | Mini App Zalo (React, zmp-cli): khách chọn khay thịt mang về. Không database, `package.json` và lệnh đưa lên riêng | `mini-app/CLAUDE.md` |
| `may-chu-don/` | Máy chủ đơn của Mini App (Bun, SQLite), chạy ở Việt Nam: đơn trả trước, VNPay, ZNS, màn hình đơn cho quầy, gọi xe Ahamove | `may-chu-don/CLAUDE.md` |
| `mo-rong-fabi/` | Extension Chrome: đưa món mới của kho vào FABi CMS, người dùng tự bấm Lưu. Không `package.json` | `mo-rong-fabi/README.md` |

Quy ước chung:
- Tên hàm, biến, chú thích, tài liệu viết **tiếng Việt không tắt**, giống mã đang có.
- `.gitignore` **chặn hết rồi mở từng cái** — file mới phải có dòng `!đường-dẫn` trong mục ĐƯỢC PHÉP,
  kiểm bằng `git status --short`. `test-quy-trinh.mjs` báo file mã nguồn bị chặn.
- Trang công khai phải đúng và đủ **khi chưa có database** (CI build không có `.env`).
- Giao diện, màu, câu chữ, ảnh, ấn phẩm: skill `.claude/skills/thiet-ke-beeftown/` (tự nạp khi việc khớp mô tả). Mã đổi
  thì sửa skill cùng PR (`test-ky-nang-thiet-ke.mjs` bắt mã màu, đường dẫn, tên biểu tượng, lớp CSS lệch). Bảng màu đã
  chốt và thứ còn mang nhận diện cũ: `THUONG-HIEU.md` mục 0 — đừng đổi màu lẻ tẻ ngoài các PR của danh sách ở đó.

## Bắt đầu phiên — đọc ít, tra nhiều

Bản đồ của thư mục tự nạp khi phiên đọc file trong đó: việc gì đọc mục nào, sửa file nào, chạy kiểm thử nào, sửa một
hàm thì phải đụng những chỗ nào. Đọc đúng mục nó chỉ — đừng đọc cả README hay `web/KHO.md`. Tra tên bằng máy thay vì
lục hàng chục nghìn dòng migration:

```bash
cd crm
npm run tim -- <hàm SQL | bảng | file>   # bản cuối ở migration nào, ai gọi, test nào nhắc, danh sách quyền phải xếp vào
npm run tim -- <hàm> --than              # nguyên văn bản cuối, để chép khi viết migration thay thân
npm run tom-tat-pr                       # nhánh này đụng khu nào, cỡ bao nhiêu, việc sau khi gộp
```

Làm tiếp một tính năng đã có đợt trước: đọc issue nhãn `viec-tiep` của nó, không đọc lại PR cũ.

## Cài và chạy kiểm thử

```bash
cd web && npm ci && cd ../crm && npm ci && cd ../can-app && npm ci   # web trước: test crm đọc mã web
cd crm && npm test                  # mọi file test, song song, in tổng số kiểm tra (~2 phút)
node test/test-zalo.mjs             # một file
npm run kiem-migration              # gác số migration (so với origin/main)
npm run so-migration                # số migration kế tiếp — tính trên MỌI nhánh origin/*
cd .. && node mo-rong-fabi/thu/thu-trinh-duyet.mjs   # Mở rộng FABi trong Chromium (CI cũng chạy)
```

Đã có `node_modules` (setup script của môi trường cloud cài sẵn) thì bỏ qua `npm ci`.
Lệnh của web, Beeftown Cân, máy chủ đơn, Mini App: mục "Lệnh" trong bản đồ của thư mục đó. Máy cần Node ≥ 22.18 để đọc
thẳng file `.ts`; CI chạy Node 24.

## Định nghĩa "xong" — 9 mục

Mỗi tính năng hoặc bản sửa phải trả lời đủ 9 mục trong mô tả PR: **tên kiểm tra chứng minh** (tên trong `ok(...)`),
hoặc **"không áp dụng vì …"**. Mỗi mục là một nhóm lỗi đã thật sự xảy ra. Chỗ phải đụng của từng khu: bản đồ của thư mục.

1. `quyen` — **Quyền.** `anon`, vai khác, chi nhánh khác, nhân sự đã nghỉ, tài khoản không có dòng `nhan_su` đều bị
   từ chối — thử bằng `duoi()` / `duoiAnon()`. Hàm `security definer` mới và danh sách quyền: `crm/CLAUDE.md`,
   "Hàm mới"; file `web/src/lib` mới đọc bảng: `web/CLAUDE.md`. Chính sách Storage: PGlite không có — ghi các bước thử tay trên project Beeftown-thu.
2. `bam-hai-lan` — **Gửi hai lần.** Bấm đúp, Meta / iPOS gửi lại webhook, hai lượt cron chồng nhau: chỉ đúng một bản
   ghi, không trừ kho hai lần, không gửi tin hai lần.
3. `gio-vn` — **Giờ Việt Nam.** Database dùng `hom_nay_vn()` / `bay_gio_vn()` / `gio_vn()`, web dùng
   `web/src/lib/gio-vn.ts`; không `current_date`, không tự cộng 7 tiếng. Thử mốc 23:50 và 00:10 giờ VN và ngày không
   có thật (31/02).
4. `chu-va-so` — **Chữ có dấu và số kiểu Việt.** "1.000" là một nghìn, "1,5" là một phẩy năm; tên file có dấu thành
   khóa ASCII; chữ không dính nhau khi xuống dòng (`compressHTML`); so khớp câu có dấu đúng ("Đúng" không phải "dừng").
5. `mat-mang` — **Mất mạng giữa chừng.** `fetch` ném lỗi, hết giờ, dịch vụ trả 500: **không bao giờ** báo thành công,
   không để bản ghi nửa vời. Thứ ghi dữ liệu và thứ quyết định câu thông báo là cùng một biểu thức `await`.
6. `ton-kho` — **Sổ kho.** Mọi kiểm thử kho kết thúc bằng `kho_doi_soat_ton()` rỗng.
7. `cau-chu` — **Câu thông báo.** Đúng sự thật ("đã nhận" khác "thành công"); đủ vi/en ở nội bộ, vi/en/ko ở trang công
   khai; câu `raise exception` mới có bản tiếng Anh (`crm/CLAUDE.md`, "Hàm mới"); không chứa chữ cấm (`chuoi-cam.js`).
8. `migration` — **Số migration.** Lấy từ `npm run so-migration`. Không sửa migration đã có trên main (viết migration
   mới). Chỉ chạy lên production sau khi PR được gộp; chạy xong thì `npm run doi-chieu` phải báo KHỚP — vì sao không
   chạy qua Supabase MCP khi không có người bấm xác nhận: `README.md`, "Chạy migration lên production".
9. `dich-vu-ngoai` — **Dịch vụ ngoài** (iPOS, Zalo, Meta, Gemini, Supabase Storage, Cloudflare): ghi rõ giả định và
   nguồn của nó; có kiểm thử giả cho từng kiểu hỏng; liệt kê việc Khánh phải thử thật. Việc chạy nền hay dịch vụ ngoài
   MỚI phải có đèn trong bảng sức khỏe ở `/noi-bo` — hỏng thì chủ thấy ngay, không đợi khách báo. Năm chỗ phải đụng:
   `crm/CLAUDE.md`, "Đèn sức khỏe".

## Sửa lỗi

- **Viết kiểm thử tái hiện lỗi TRƯỚC**, chạy thấy đỏ, rồi mới sửa. Kiểm thử đó ở lại mãi mãi.
- Lỗi báo qua issue nhãn `loi-that`: tên kiểm tra bắt đầu bằng `HỒI QUY #<số issue>`, PR ghi `Sửa #<số>`.
- Hàm SQL mới phải được ít nhất một file test nhắc tên (`test-quy-trinh.mjs` kiểm).

## Chia việc thành PR

Khánh là người duyệt duy nhất và không đọc code. PR nhỏ, một việc, thì đọc được trong hai phút và ít lỗi lọt.

- **Một PR, một thay đổi người dùng thấy được.** Lỗi gặp dọc đường mà không thuộc việc đang làm: PR riêng, hoặc issue.
- **Cỡ:** dưới khoảng 1.500 dòng mã + SQL thật sự đổi — không tính kiểm thử, tài liệu, thân hàm chép nguyên văn.
  `npm run tom-tat-pr` đo; comment "Máy tóm tắt PR" nhắc khi vượt.
- **Tính năng lớn chia đợt.** Mỗi đợt gộp được một mình, main vẫn đúng sau mỗi đợt. Phần còn lại: issue theo mẫu
  `.github/ISSUE_TEMPLATE/viec-tiep.yml` — đã quyết gì, còn gì, nằm ở hàm / file / mục tài liệu nào. PR đợt sau ghi
  `Tiếp #<số>`.
- **Nhánh.** Mỗi phiên một nhánh. PR của nhánh đã gộp thì việc mới bắt đầu lại từ `origin/main`. Nhiều phiên chạy song
  song thì chia theo khu (kho / trang công khai / Beeftown Cân / Mini App) để ít đụng cùng file và cùng số migration.

## Trước khi mở PR

1. `git fetch origin --prune && git merge origin/main` — rồi `npm run kiem-migration`.
2. Chạy đủ kiểm thử phần đã đụng (lệnh ở bản đồ của thư mục). `crm` thì luôn chạy toàn bộ `npm test`.
3. Chạy `/code-review` (mức high) trên diff so với `origin/main`; thêm `/security-review` khi đụng
   quyền, `security definer`, webhook, đăng nhập.
4. `cd crm && npm run tom-tat-pr`, rồi điền mẫu PR. Phần Khánh đọc ở trên cùng: "Tóm tắt cho Khánh" (bốn dòng, không
   tên hàm, không tên file; "Sau khi gộp" chép từ `tom-tat-pr`) và cách tự thử. 9 mục, migration, kiểm thử để trong phần
   gập "Chi tiết cho người rà soát". Kiểm trước: `node test/kiem-mo-ta-pr.mjs --tep <file mô tả>` — workflow
   "Mô tả PR" đỏ khi thiếu mục.
5. CI đỏ trên PR của mình là việc của mình. PR nháp không chạy bộ kiểm thử đầy đủ — chạy đủ trên máy trước khi đẩy.
   Comment "Số migration của PR này không còn hợp lệ" nghĩa là PR khác vừa gộp cùng số — đánh lại số ngay. Khi nào CI
   chạy gì: `.github/CLAUDE.md`.

## Không bao giờ

- Tắt, bỏ qua hay nới một kiểm thử để CI xanh.
- Ghi số kiểm tra đếm tay vào README — `npm test` in tổng, CI ghi vào Summary.
- Báo "thành công" trước khi database xác nhận. Chuỗi `"đặt bàn thành công"` không được tồn tại.
- Đổi chữ của câu `raise exception` cũ — kiểm thử khớp theo chữ tiếng Việt.
- Deploy khi CI chưa xanh. `npm run deploy` tự chặn; `npm run deploy:khan-cap` chỉ dùng khi khẩn cấp.
