# Beeftown — database (Supabase)

Database chung của mọi phần mềm Beeftown: CRM và thẻ thành viên, đặt bàn, cổng nội dung, thực đơn, tuyển dụng, kho. Website và giao diện nội bộ ở `../web/` đọc/ghi vào đây.

> Thư mục này tên là `crm/` cho tới 25/09/2026 (migration nằm ở `crm/supabase/migrations/`). Chú thích trong các migration cũ còn ghi `crm/README.md` — là file này. Không sửa migration đã chạy chỉ để đổi chú thích.

Phần CRM và thẻ thành viên: Beeftown **sở hữu 100%** dữ liệu khách hàng — đây chính là một trong ba thứ mà ma trận phần mềm yêu cầu phải tự sở hữu.

> **Đặc tả nghiệp vụ:** [`../thiet-ke/Beeftown_CRM_Design.html`](../thiet-ke/Beeftown_CRM_Design.html). Mọi con số trong code (tỷ lệ 3%, ngưỡng 50.000đ, 6 nhóm khách) đều lấy từ đó — sửa code thì phải sửa cả tài liệu.

## Trạng thái

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| 0 | Schema database + phân quyền | ✅ Xong |
| 0b | **Siết an toàn** — vá 4 lỗ hổng, sửa 2 lỗi chỉ số | ✅ Xong (`0008`) |
| 1 | Đặt bàn thật (thay Google Sheet) | ✅ Schema xong, form chờ giờ phục vụ và bảng bàn |
| 2 | Lõi CRM — hồ sơ khách, phân nhóm | 🔜 Schema xong, chờ giao diện |
| 3 | Thẻ tích điểm | 🔜 Schema xong, chờ giao diện |
| 4 | Chiến dịch ZBS | 🔜 Schema xong, chờ nối API Zalo |
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
| 10 | **Kho · GĐ1** — 3 vai kho, tường ngăn CRM, danh mục, ô thông tin tự tạo, phiếu nhập có duyệt, sổ kho bất biến | ✅ Xong (`0017`–`0021`) |
| 11 | **Kho · GĐ2** — pha lóc (tỉ lệ thu hồi, giá vốn thật), chuyển quầy, xuất bếp, báo hủy có duyệt, kiểm kê dựng lại tồn | ✅ Xong (`0022`–`0023`) |
| 12 | **Kho · GĐ3** — đối chiếu hóa đơn, công nợ nhà cung cấp, thanh toán, trả hàng NCC, báo cáo xuất–nhập–tồn / thu hồi / hao hụt / bán, tải CSV | ✅ Xong (`0024`) |
| 13 | **Kho · GĐ4** — hai vai máy (tablet dùng chung, đồng bộ iPOS), đếm việc, chuông thông báo, ngưỡng cảnh báo, chỉ số quản trị | ✅ Xong (`0029`–`0030`) |
| 14 | **Vá quyền ba hàm CRM** — ghi lượt ghé, tìm/tạo khách, xếp tin tự kiểm vai và chi nhánh | ✅ Xong (`0031`) |

**1637 kiểm tra đạt** (trước đây 71). Database hoàn chỉnh. Trang công khai ở
`../web/` có 8 đường dẫn song ngữ, giao diện nội bộ `/noi-bo` và hai form
công khai đều đã dựng.

## Chạy kiểm thử

Không cần Docker, không cần cài Postgres — dùng PGlite (Postgres chạy WASM trong Node).

```bash
cd supabase && npm install && npm test
```

| Lệnh | Kiểm gì | Số kiểm tra |
|---|---|---|
| `npm run test:db` | nghiệp vụ: chuẩn hóa SĐT, sổ cái điểm, ba luật tính điểm, đặt bàn, phân nhóm | 74 |
| `npm run test:rls` | phân quyền: tách dữ liệu giữa chi nhánh, vai trò, website công khai | 23 |
| `npm run test:an-toan` | **bốn lỗ hổng ở `0008`** và hai lỗi chỉ số | 28 |
| `npm run test:cong-bo` | cổng nội dung và ảnh | 53 |
| `npm run test:thuc-don` | thực đơn và duyệt giá | 50 |
| `npm run test:tuyen-dung` | tuyển dụng, dữ liệu cá nhân, nhật ký bất biến, form theo từng tin, duyệt lương, lương giờ/tháng | 101 |
| `npm run test:cong-khai` | API công khai, mã đặt bàn, đo lường | 50 |
| `npm run test:noi-dung` | đặt/thu hồi nội dung trong một giao dịch, vé tải CV | 53 |
| `npm run test:hop-dong` | hợp đồng giữa `web/src` và database: tên hàm, tham số, bảng, cột, enum | 216 |
| `npm run test:kho` | **kho**: tường ngăn CRM, bảng quyền, phiếu nhập, sổ kho, giá vốn, mã vạch nhãn cân, form và CSV; pha lóc; chuyển, xuất bếp, hủy, kiểm kê; công nợ và báo cáo; đồng bộ cân; khung giao diện theo vai; đếm việc và thông báo | 103 + 117 + 164 + 115 + 120 + 91 + 55 + 114 + 74 |
| `npm run test:can` | đồng bộ danh mục sang cân in tem: đọc/ghi file `A_000.TMS`, dòng không đổi giữ nguyên từng byte | 55 |
| `npm run test:quyen-ham` | **ba hàm definer CRM ở `0031`**: ai bị từ chối, ai vẫn ghi được, website vẫn đặt bàn | 36 |

**Chạy lại toàn bộ kiểm thử sau mỗi lần sửa migration.** Chúng đã bắt được lỗi thật, không phải một lần:

- `generate_series` không nhận kiểu `time`;
- ba hàm xem lịch trống thiếu `security definer` khiến website không gọi được;
- **`alter default privileges ... revoke` không chặn được hàm mới** — Postgres cấp EXECUTE cho PUBLIC như một mặc định dựng sẵn trong nhân, không phải một dòng trong `pg_default_acl`. Bốn hàm helper vừa tạo trong chính `0008` đã lọt ra ngoài, và mục 1 của `test-an-toan.mjs` bắt được;
- **seed tin tuyển dụng chèn đúng 0 dòng mà không báo lỗi**, vì nó đọc bảng `chi_nhanh` lúc bảng còn rỗng. Nay là hàm `tao_tin_tuyen_dung_mau()` gọi sau khi đã tạo chi nhánh;
- **ràng buộc giá làm quản lý không đề xuất được giá cho món đã công bố** — một trạng thái vận hành bình thường bị chặn nhầm. Nay tách `gia_de_xuat` khỏi `gia`.

`test-phan-quyen.mjs` **mô phỏng quyền mặc định của Supabase** trước khi chạy migration. Thiếu khối đó thì mọi khẳng định "anon không làm được X" đều đúng một cách RỖNG — đúng vì PGlite vốn không cấp gì cho `anon`, chứ không phải vì schema an toàn.

## Cấu trúc

```
supabase/
├── migrations/              ← schema, đánh số theo thứ tự chạy
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
│   ├── 0029_kho_vai_may.sql     KHO · 2 vai máy (tablet dùng chung, iPOS) — ⚠ CHẠY RIÊNG, trước 0030
│   ├── 0030_kho_viec_thong_bao.sql  KHO · đếm việc, chuông thông báo, ngưỡng cảnh báo, chỉ số quản trị
│   └── 0031_va_quyen_ham_crm.sql  ⚠ VÁ — ghi_luot_ghe, tim_hoac_tao_khach, xep_hang_gui_tin tự kiểm vai
└── test/                    ← kiểm thử chạy trên Postgres thật
    └── kho-chung.mjs            khung dựng database dùng chung cho test-kho-*.mjs và test-quyen-ham-crm.mjs
```

### Thứ tự chạy có ràng buộc

- **`0008` phải chạy trước mọi file sau nó.** Khối `alter default privileges` trong đó là thứ bảo vệ toàn bộ bảng tạo ra ở `0009`–`0015`.
- **`0009` và `0011` phụ thuộc vòng.** `tep_anh.mon_an_id` trỏ tới `mon_an` chưa tồn tại; cột ra đời ở `0009` không kèm khóa ngoại, khóa ngoại được thêm ở cuối `0011`.
- **File nào tạo hàm thì PHẢI kết thúc bằng khối chốt quyền.** Xem `0008` mục 6.
- **View mới PHẢI khai `security_invoker = true` tường minh.** Mặc định của Postgres là view chạy dưới quyền người tạo, tức đi xuyên qua RLS của bảng bên dưới — đúng lỗ hổng số 2 mà `0008` đã vá. `0008` chỉ sửa được 7 view có mặt lúc đó. `test-an-toan.mjs` mục 2 liệt kê `pg_class` và bắt đúng chuyện quên này; nó đã bắt được `v_bang_cong_tac` ngay lần chạy đầu tiên của `0015`.
- **`0017` phải chạy RIÊNG, một mình, trước `0018`.** Nó thêm giá trị vào enum `vai_tro`; Postgres không cho dùng giá trị enum mới trong cùng giao dịch vừa thêm nó.
- **Đừng tạo tài khoản vai kho trước khi chạy `0018`.** `0018` là tường ngăn: trước nó, một thủ kho đọc được số điện thoại khách.
- **`0014` là file duy nhất PGlite không chạy.** Toàn bộ DDL kho file bọc trong khối kiểm tra schema `storage`. Danh sách kiểm tra bằng tay nằm ở cuối file đó — **bắt buộc làm trên Supabase thật.**
- **Khối chốt quyền từ `0025` trở đi PHẢI giữ dòng `ve_con_hieu_luc(text)`.** Policy tải CV trên `storage.objects` gọi hàm đó dưới vai `anon`. Chép danh sách từ một file cũ hơn là CV lại rơi im lặng, và PGlite không có storage để thấy; `DUOC_PHEP` trong `test-an-toan.mjs` và mục 7 của `test-dat-noi-dung.mjs` mới bắt được.
- **Số migration không được trùng giữa các nhánh làm song song.** Supabase CLI coi phần số là phiên bản, nên hai file cùng số không cùng tồn tại được. Nhánh kho dùng `0017`–`0024`. Nhánh này lúc đầu dùng `0023`, `0025`, `0026` — `0023` trùng với nhánh kho — nên ngày 25/09/2026 đã đánh lại thành `0025`, `0026`, `0027`, giữ nguyên thứ tự giữa ba file. Bản vá quyền hàm CRM viết ra với số `0022`, trùng `0022` của nhánh kho, nên khi gộp về đã đổi thành `0031` (sau kho GĐ4 `0029`–`0030`). Migration mới lấy số sau số lớn nhất trên **mọi** nhánh đang mở: hiện là `0031`, nên số kế tiếp là `0032`. Khối chốt quyền của mọi file nhánh khác đều viết trước `0025` nên thiếu dòng `ve_con_hieu_luc(text)`: sau khi gộp, khối chốt quyền **chạy cuối cùng** phải có dòng đó, và `DUOC_PHEP` sẽ đỏ nếu thiếu. Trên một database đã có sẵn, đừng chạy file nào có khối chốt quyền thiếu dòng đó sau `0025`.

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
| `tim_hoac_tao_khach()` | Điểm vào duy nhất để tạo khách | Chủ sở hữu, quản lý, thu ngân; website qua `tao_dat_ban()` |
| `ghi_luot_ghe()` | Thu ngân ghi hóa đơn + tích/trừ điểm | Chủ sở hữu, quản lý, thu ngân — đúng chi nhánh |
| `xep_hang_gui_tin()` | Xếp một tin vào hàng gửi, sau `duoc_phep_gui()` | Chủ sở hữu, quản lý, marketing — đúng chi nhánh |
| `so_du_diem()` | Tra số dư điểm | Nhân sự |
| `tao_dat_ban()` | Website tạo đặt bàn | **Công khai (anon)** |
| `lich_trong_theo_ngay()` | Website xem khung giờ trống | **Công khai (anon)** |
| `so_ban_con_trong()` | Số bàn còn nhận tại một khung giờ | **Công khai (anon)** |
| `duoc_phep_gui()` | Chốt chặn trước khi gửi tin | Nội bộ |
| `chi_so_crm()` | 6 chỉ số theo dõi | Quản lý, chủ sở hữu |

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
20. **Hàm `security definer` mà nhân sự gọi qua RPC PHẢI tự kiểm vai ngay đầu thân hàm** (từ `0031`). Khối chốt quyền chỉ thu EXECUTE khỏi `public` và `anon`; `authenticated` vẫn gọi được mọi hàm chưa bị thu riêng — kể cả một tài khoản tự đăng ký không có dòng `nhan_su`. Hàm definer đi xuyên RLS, nên policy không cứu được. Khuôn: `if co_phien_dang_nhap() and not co_vai_tro(...) then raise exception '...' using errcode = 'insufficient_privilege'`, thêm `duoc_truy_cap_chi_nhanh()` nếu hàm nhận chi nhánh. Hàm chỉ để hàm khác gọi thì thu EXECUTE khỏi `authenticated` như lưu ý 13.
