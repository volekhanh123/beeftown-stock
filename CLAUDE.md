# Beeftown — hướng dẫn cho mọi phiên làm việc

Mỗi phiên Claude mở repo này đều đọc file này. Nó là **quy trình bắt buộc**, không phải gợi ý:
lỗi của repo lặp lại theo đúng tám nhóm bên dưới, và phần lớn lộ ra ở commit "sửa N lỗi sau
rà soát" *sau khi* tính năng đã gộp. Mục tiêu: chặn chúng *trước* khi gộp.

## Repo gồm gì

| Thư mục | Nội dung | Đọc thêm |
|---|---|---|
| `web/` | Website Astro trên Cloudflare Workers: trang công khai vi/en/ko, `/noi-bo`, kho, Zalo, Messenger, iPOS | `web/README.md`, `web/KHO.md` |
| `crm/` | Database Supabase (`supabase/migrations/`) và **toàn bộ kiểm thử** (`test/`, chạy trên PGlite) | `crm/README.md` |
| `can-app/` | Beeftown Cân (Windows `.exe`, Bun): gửi giá xuống cân TMA, máy quầy | `can-app/README.md` |

Bảng màu thương hiệu đã chốt, giá trị đã áp dụng và thứ còn mang màu cũ (Beeftown Cân, ảnh hướng dẫn kho): `THUONG-HIEU.md`. Codex và các agent khác đọc `AGENTS.md` (cùng quy trình này).

Quy ước chung:
- Tên hàm, biến, chú thích, tài liệu viết **tiếng Việt không tắt**, giống mã đang có.
- `.gitignore` **chặn hết rồi mở từng cái** — file mới phải có dòng `!đường-dẫn` trong mục ĐƯỢC PHÉP,
  kiểm bằng `git status --short`. `test-quy-trinh.mjs` báo file mã nguồn bị chặn.
- Trang công khai phải đúng và đủ **khi chưa có database** (CI build không có `.env`).
- Việc giao diện, màu, câu chữ, ảnh, ấn phẩm: làm theo skill `.claude/skills/thiet-ke-beeftown/`
  (tự nạp khi việc khớp mô tả). Mã đổi thì sửa skill cùng PR — `test-ky-nang-thiet-ke.mjs` bắt mã màu,
  đường dẫn, tên biểu tượng, lớp CSS lệch; số đo và tên hàm thì tự giữ.

## Cài và chạy kiểm thử

```bash
cd web && npm ci && cd ../crm && npm ci && cd ../can-app && npm ci   # web trước: test crm đọc mã web
cd crm && npm test                  # mọi file test, song song, in tổng số kiểm tra (~2 phút)
node test/test-zalo.mjs             # một file
npm run kiem-migration              # gác số migration (so với origin/main)
npm run so-migration                # số migration kế tiếp — tính trên MỌI nhánh origin/*
cd ../can-app && npx bun test/thu.ts                     # Beeftown Cân
cd ../web && npx astro check && npm run quet && npm run thu-trinh-duyet -- --khong-build   # quet vừa build (không database)
```

File test mới tên `crm/test/test-<khu>-<ten>.mjs` **tự được chạy** — không sửa `package.json`.
`crm/test/thu-tai.mjs` (`npm run thu-tai`) là thử tải trên project Supabase THẬT Beeftown-thu — chỉ chạy tay,
không nằm trong `npm test` hay CI (xem README gốc, mục "Hạ tầng cho 100 người dùng cùng lúc").
`crm/test/doi-chieu-production.mjs` (`npm run doi-chieu`, chuỗi kết nối ở biến `DOI_CHIEU_DB_URL`) cũng chỉ chạy tay:
đối chiếu database thật với mọi migration — hàm, bảng, cột, ràng buộc, chỉ mục, trigger, policy, quyền. Kiểm thử của nó
(`test-doi-chieu-production.mjs`) thì chạy trong `npm test`.
Dùng khung chung `kho-chung.mjs` (`dungDatabase`, `taoBoDem`, `duoi(uid, sql)`, `duoiAnon(sql)`) — `npm test` nạp database
trống từ một ảnh chụp chung thay vì chạy lại từng migration, nên file dựng qua khung này chạy nhanh hơn.

## Định nghĩa "xong" — 9 mục

Mỗi tính năng hoặc bản sửa phải trả lời đủ 9 mục trong mô tả PR: **tên kiểm tra chứng minh**
(tên trong `ok(...)`), hoặc **"không áp dụng vì …"**. Mỗi mục là một nhóm lỗi đã thật sự xảy ra.

1. `quyen` — **Quyền.** `anon`, vai khác, chi nhánh khác, nhân sự đã nghỉ, tài khoản không có dòng
   `nhan_su` đều bị từ chối — thử bằng `duoi()` / `duoiAnon()`. Hàm `security definer` mới: kiểm vai
   ngay đầu thân hàm, có `set search_path`; xếp vào `DUOC_PHEP` (`test-an-toan.mjs`) hoặc
   `GOI_DUOC` / `NOI_BO` (`test-kho-quyen.mjs`). File `web/src/lib` mới đọc bảng: phân loại trong
   `CHAY_DA_DANG_NHAP` (`test-hop-dong-web.mjs`). Chính sách Storage: PGlite không có — ghi các
   bước thử tay trên project Beeftown-thu. *(4868551, 5021735, f9bcde0, 8cbf5fc)*
2. `bam-hai-lan` — **Gửi hai lần.** Bấm đúp, Meta / iPOS gửi lại webhook, hai lượt cron chồng nhau:
   chỉ đúng một bản ghi, không trừ kho hai lần, không gửi tin hai lần. *(861ff7f, 702ff11, b98c845)*
3. `gio-vn` — **Giờ Việt Nam.** Database dùng `hom_nay_vn()` / `bay_gio_vn()` / `gio_vn()`, không
   `current_date` (`kiem-migration.mjs` chặn). Web dùng `web/src/lib/gio-vn.ts` (`homNayVn`, `namVn`,
   `congNgay`, `docGioVnDiaPhuong` cho ô giờ người nhập / máy ngoài gửi) — `test-gio-vn.mjs` chặn tự
   cộng 7 tiếng. Thử mốc 23:50 và 00:10 giờ VN (đồng hồ giả `dong-ho-gia.mjs`; phía database
   `datGioDatabase` / `traGioDatabase` của `kho-chung.mjs`) và ngày không có thật (31/02). *(4868551)*
4. `chu-va-so` — **Chữ có dấu và số kiểu Việt.** "1.000" là một nghìn, "1,5" là một phẩy năm; tên
   file có dấu thành khóa ASCII; chữ không dính nhau khi xuống dòng (`compressHTML`); so khớp câu có
   dấu đúng ("Đúng" không phải "dừng"). *(6b1fddc, 52d0937, 1bb55ac, b98c845)*
5. `mat-mang` — **Mất mạng giữa chừng.** `fetch` ném lỗi, hết giờ, dịch vụ trả 500: **không bao giờ**
   báo thành công, không để bản ghi nửa vời. Thứ ghi dữ liệu và thứ quyết định câu thông báo là
   cùng một biểu thức `await` (README gốc).
6. `ton-kho` — **Sổ kho.** Mọi kiểm thử kho kết thúc bằng `kho_doi_soat_ton()` rỗng. *(861ff7f)*
7. `cau-chu` — **Câu thông báo.** Đúng sự thật ("đã nhận" khác "thành công"); đủ vi/en ở nội bộ,
   vi/en/ko ở trang công khai; câu `raise exception` mới có bản tiếng Anh trong
   `web/src/lib/kho/cau-kho-en.ts` hoặc `web/src/lib/cau-noi-bo.ts`; không chứa chữ cấm (`chuoi-cam.js`).
8. `migration` — **Số migration.** Lấy từ `npm run so-migration`. Không sửa migration đã có trên main
   (viết migration mới). Không chạy migration lên production trước khi PR được gộp. Chạy xong thì
   `npm run doi-chieu` phải báo KHỚP (README gốc, "Chạy migration lên production") — SQL Editor hay Supabase
   MCP báo xong chưa chắc đã chạy hết: `apply_migration` / `execute_sql` của MCP chờ xác nhận với câu có
   `delete`, phiên không có người bấm thì hết 60 giây và không chạy gì.
   *(6 lần đánh lại số trong 3 ngày; 2 lần đã chạy lên production; 04/10/2026 thiếu hai hàm vì một mảnh không chạy)*
9. `dich-vu-ngoai` — **Dịch vụ ngoài** (iPOS, Zalo, Meta, Gemini, Supabase Storage, Cloudflare): ghi rõ
   giả định và nguồn của nó; có kiểm thử giả cho từng kiểu hỏng; liệt kê việc Khánh phải thử thật.
   Việc chạy nền hay dịch vụ ngoài MỚI phải có đèn trong bảng sức khỏe ở `/noi-bo`: số liệu vào
   `suc_khoe_so_lieu()` (migration mới; đọc bằng hàm riêng như sao lưu thì gắn thêm vào
   `bao_dong_bat_dau_luot`, không thì không bao giờ được báo), màu và câu vào `web/src/lib/suc-khoe.ts`, kiểm ở
   `test-suc-khoe.mjs` (ô mới trong danh sách `KHOA`) và `test-suc-khoe-web.mjs`; đèn mới xếp vào `NHOM`
   của `web/src/lib/bao-dong-chinh-sach.ts` (đỏ ban đêm có báo ngay không) — hỏng thì chủ thấy ngay,
   không đợi khách báo. *(0c92b10, 0410c58, 5d03c40)*

## Sửa lỗi

- **Viết kiểm thử tái hiện lỗi TRƯỚC**, chạy thấy đỏ, rồi mới sửa. Kiểm thử đó ở lại mãi mãi.
- Lỗi báo qua issue nhãn `loi-that`: tên kiểm tra bắt đầu bằng `HỒI QUY #<số issue>`, PR ghi `Sửa #<số>`.
- Hàm SQL mới phải được ít nhất một file test nhắc tên (`test-quy-trinh.mjs` kiểm).

## Trước khi mở PR

1. `git fetch origin --prune && git merge origin/main` — rồi `npm run kiem-migration`.
2. Chạy đủ kiểm thử phần đã đụng (mục trên). `crm` thì luôn chạy toàn bộ `npm test`.
3. Chạy `/code-review` (mức high) trên diff so với `origin/main`; thêm `/security-review` khi đụng
   quyền, `security definer`, webhook, đăng nhập.
4. Điền mẫu PR: 9 mục, cách Khánh tự thử, migration và thứ tự triển khai.
5. CI đỏ trên PR của mình là việc của mình. Comment "Số migration của PR này không còn hợp lệ"
   nghĩa là PR khác vừa gộp cùng số — đánh lại số ngay.

## Không bao giờ

- Tắt, bỏ qua hay nới một kiểm thử để CI xanh.
- Ghi số kiểm tra đếm tay vào README — `npm test` in tổng, CI ghi vào Summary.
- Báo "thành công" trước khi database xác nhận. Chuỗi `"đặt bàn thành công"` không được tồn tại.
- Đổi chữ của câu `raise exception` cũ — kiểm thử khớp theo chữ tiếng Việt.
- Deploy khi CI chưa xanh. `npm run deploy` tự chặn; `npm run deploy:khan-cap` chỉ dùng khi khẩn cấp.

## CI (GitHub Actions)

| Khi nào | Chạy gì | Thời gian |
|---|---|---|
| Đẩy nhánh có đổi migration | `gac-nhanh.yml`: số migration, trùng với nhánh khác | ~30 giây |
| Mở / cập nhật PR không phải nháp; bấm "Ready for review" | `kiem-thu.yml`: database, kho, Zalo, Messenger, Beeftown Cân; web: astro check, build, đóng gói thử, chữ cấm, trình duyệt. PR nháp bỏ qua hai job này (đỡ phút CI) — chạy đủ kiểm thử trên máy trước khi đẩy | ~10 phút |
| Main nhận commit | như PR, rồi comment vào PR đang mở nào vừa bị trùng số migration | ~10 phút |
| 00:30 giờ VN mỗi đêm | quét chữ cấm trên beeftown.vn thật; toàn bộ với `TZ=Asia/Ho_Chi_Minh` khi main có commit trong 48 giờ qua, đêm Chủ nhật, đêm đầu / cuối tháng, hoặc không hỏi được GitHub (job `co-doi`). Cổng deploy bỏ qua lượt đêm không kiểm mã (`web/kiem-tra/ket-qua-ci.mjs`) | ~1 phút / ~10 phút |
| 02:00 giờ VN mỗi đêm; chạy tay | `sao-luu.yml`: sao lưu database (`crm/sao-luu/`) → mã hoá → artifact 30 ngày → khôi phục thử vào Supabase dựng tạm → ghi `he_thong_sao_luu` (đèn "Sao lưu dữ liệu"). Secret `SAO_LUU_DB_URL`, `SAO_LUU_MAT_KHAU` (README gốc, "Sao lưu và khôi phục") | ~5–10 phút |
| Main hoặc PR đổi `can-app/`, `web/src/lib/`; chạy tay (gõ số PR) | `dong-goi-can.yml`: kiểm thử Beeftown Cân rồi đóng gói `BeeftownCan.exe` → artifact, Release khi `PHIEN_BAN` mới, bản cài lên kho công khai `beeftown-can-ban-cai` cho nút Cập nhật (secret `TOKEN_BAN_CAI_CAN`) (PR: chỉ đóng gói thử, không tải lên) | ~1 phút |
| Đầu mỗi tháng | `dependabot.yml`: PR nâng thư viện `web/`, `crm/`, `can-app/` và action — bản nhỏ gom một PR mỗi thư mục, bản lớn PR riêng. CI xanh mới gộp | — |

Kết quả: tab Actions → lượt chạy → **Summary** (bảng từng file, số migration kế tiếp).
CI chạy Node 24 (`web/.node-version`); máy cần Node ≥ 22.18 để đọc thẳng file `.ts`.
