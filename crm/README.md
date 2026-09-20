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
| 4 | Chiến dịch ZBS | 🔜 Schema xong, chờ nối API Zalo |
| 5 | Báo cáo BI | ✅ Hàm chỉ số xong (`chi_so_crm`, `phieu_do_launch`) |
| 6 | **Cổng nội dung** — công tắc cho từng dữ kiện | ✅ Xong (`0010`) |
| 7 | **Thực đơn** — 31 món, duyệt giá từng món | ✅ Xong (`0011`) |
| 8 | **Tuyển dụng** — tin, hồ sơ, vé tải CV | ✅ Xong (`0012`) |
| 9 | **Đặt nội dung một giao dịch** — công bố bốn bước thành một | ✅ Xong (`0015`) |
| 9b | **Vá vé tải CV, quyền thu hồi, nhật ký trùng** | ✅ Xong (`0016`) |

**417 kiểm tra đạt** (trước đây 71). Database hoàn chỉnh. Trang công khai ở
`../web/` có 8 đường dẫn song ngữ, giao diện nội bộ `/noi-bo` và hai form
công khai đều đã dựng.

## Chạy kiểm thử

Không cần Docker, không cần cài Postgres — dùng PGlite (Postgres chạy WASM trong Node).

```bash
cd crm && npm install && npm test
```

| Lệnh | Kiểm gì | Số kiểm tra |
|---|---|---|
| `npm run test:db` | nghiệp vụ: chuẩn hóa SĐT, sổ cái điểm, ba luật tính điểm, đặt bàn, phân nhóm | 59 |
| `npm run test:rls` | phân quyền: tách dữ liệu giữa chi nhánh, vai trò, website công khai | 23 |
| `npm run test:an-toan` | **bốn lỗ hổng ở `0008`** và hai lỗi chỉ số | 28 |
| `npm run test:cong-bo` | cổng nội dung và ảnh | 53 |
| `npm run test:thuc-don` | thực đơn và duyệt giá | 50 |
| `npm run test:tuyen-dung` | tuyển dụng, dữ liệu cá nhân, nhật ký bất biến | 67 |
| `npm run test:cong-khai` | API công khai, mã đặt bàn, đo lường | 50 |
| `npm run test:noi-dung` | đặt/thu hồi nội dung trong một giao dịch, vé tải CV | 52 |
| `npm run test:hop-dong` | hợp đồng giữa `web/src` và database: tên hàm, tham số, bảng, cột | 35 |

**Chạy lại toàn bộ kiểm thử sau mỗi lần sửa migration.** Chúng đã bắt được lỗi thật, không phải một lần:

- `generate_series` không nhận kiểu `time`;
- ba hàm xem lịch trống thiếu `security definer` khiến website không gọi được;
- **`alter default privileges ... revoke` không chặn được hàm mới** — Postgres cấp EXECUTE cho PUBLIC như một mặc định dựng sẵn trong nhân, không phải một dòng trong `pg_default_acl`. Bốn hàm helper vừa tạo trong chính `0008` đã lọt ra ngoài, và mục 1 của `test-an-toan.mjs` bắt được;
- **seed tin tuyển dụng chèn đúng 0 dòng mà không báo lỗi**, vì nó đọc bảng `chi_nhanh` lúc bảng còn rỗng. Nay là hàm `tao_tin_tuyen_dung_mau()` gọi sau khi đã tạo chi nhánh;
- **ràng buộc giá làm quản lý không đề xuất được giá cho món đã công bố** — một trạng thái vận hành bình thường bị chặn nhầm. Nay tách `gia_de_xuat` khỏi `gia`.

`test-phan-quyen.mjs` **mô phỏng quyền mặc định của Supabase** trước khi chạy migration. Thiếu khối đó thì mọi khẳng định "anon không làm được X" đều đúng một cách RỖNG — đúng vì PGlite vốn không cấp gì cho `anon`, chứ không phải vì schema an toàn.

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
│   └── 0016_va_ve_tai_cv_va_quyen_thu_hoi.sql   ⚠ VÁ 3 LỖI — xem đầu file
└── test/                    ← kiểm thử chạy trên Postgres thật
```

### Thứ tự chạy có ràng buộc

- **`0008` phải chạy trước mọi file sau nó.** Khối `alter default privileges` trong đó là thứ bảo vệ toàn bộ bảng tạo ra ở `0009`–`0015`.
- **`0009` và `0011` phụ thuộc vòng.** `tep_anh.mon_an_id` trỏ tới `mon_an` chưa tồn tại; cột ra đời ở `0009` không kèm khóa ngoại, khóa ngoại được thêm ở cuối `0011`.
- **File nào tạo hàm thì PHẢI kết thúc bằng khối chốt quyền.** Xem `0008` mục 6.
- **View mới PHẢI khai `security_invoker = true` tường minh.** Mặc định của Postgres là view chạy dưới quyền người tạo, tức đi xuyên qua RLS của bảng bên dưới — đúng lỗ hổng số 2 mà `0008` đã vá. `0008` chỉ sửa được 7 view có mặt lúc đó. `test-an-toan.mjs` mục 2 liệt kê `pg_class` và bắt đúng chuyện quên này; nó đã bắt được `v_bang_cong_tac` ngay lần chạy đầu tiên của `0015`.
- **`0014` là file duy nhất PGlite không chạy.** Toàn bộ DDL kho file bọc trong khối kiểm tra schema `storage`. Danh sách kiểm tra bằng tay nằm ở cuối file đó — **bắt buộc làm trên Supabase thật.**

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
| `tim_hoac_tao_khach()` | Điểm vào duy nhất để tạo khách | Nhân sự |
| `ghi_luot_ghe()` | Thu ngân ghi hóa đơn + tích/trừ điểm | Thu ngân, quản lý |
| `so_du_diem()` | Tra số dư điểm | Nhân sự |
| `tao_dat_ban()` | Website tạo đặt bàn | **Công khai (anon)** |
| `lich_trong_theo_ngay()` | Website xem khung giờ trống | **Công khai (anon)** |
| `so_ban_con_trong()` | Số bàn còn nhận tại một khung giờ | **Công khai (anon)** |
| `duoc_phep_gui()` | Chốt chặn trước khi gửi tin | Nội bộ |
| `chi_so_crm()` | 6 chỉ số theo dõi | Quản lý, chủ sở hữu |

Website công khai **không có quyền vào bảng nào cả** — chỉ gọi được danh sách hàm `SECURITY DEFINER` trong khối chốt quyền ở cuối migration MỚI NHẤT có tạo hàm. Đừng chép số lượng vào đây: bảng trên đã từng nói "ba hàm" trong khi thực tế là 12, và nó lạc hậu suốt tám migration mà không ai để ý. `test-an-toan.mjs` canh danh sách đó.

## Việc cần làm trước khi chạy thật

- [ ] Tạo project Supabase, chạy các file migration theo thứ tự
- [ ] Tạo tài khoản nhân sự đầu tiên (`chu_so_huu`) và nối `auth_uid`
- [ ] Nhập danh sách bàn thật vào `ban_an`
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

8. **Thêm hàm mới thì phải cập nhật danh sách `DUOC_PHEP` trong `test/test-an-toan.mjs`.** Danh sách đó là bản sao có chủ ý của khối chốt quyền ở `0013`. Câu DDL nói ý định; bài test mới là thứ chứng minh.
9. **Đừng đổi chữ trong các câu `raise exception` cũ** — bài test khớp regex tiếng Việt (`/hết bàn/i`, `/quá khứ/i`, `/bất biến/i`).
10. **Đừng tham chiếu BẢNG trong schema `auth` từ policy hay trigger** — dùng `la_chu_so_huu()`, `co_vai_tro()`, `co_phien_dang_nhap()` thay vì đọc thẳng `auth.users`.
    Riêng HÀM `auth.uid()` thì gọi thẳng được: Supabase cấp sẵn quyền đó cho `authenticated`, và `0007` đã dùng nó như vậy ở `nhan_su_doc` và `mau_tin_doc`. Bản trước của quy tắc này cấm luôn cả `auth.uid()`, tức là nó mâu thuẫn với chính `0007` — mà `nhan_su_doc` lại nằm trên đường đăng nhập của MỌI request `/noi-bo`.
    **Phép thử một dòng trên project mới:** `select has_schema_privilege('authenticated', 'auth', 'usage');` — trả `false` thì không ai đăng nhập được, và triệu chứng là bị đá về trang đăng nhập dù mật khẩu đúng.
11. **KHÔNG hiển thị `so_ban_con_trong` thành con số ở bất cứ đâu.** Nó là một oracle sức chứa, và hiển thị ra là tạo cảm giác khan hiếm giả — đúng thứ tài liệu thương hiệu cấm. Website dùng `lich_trong_theo_ma()`, chỉ trả về CÓ/KHÔNG còn chỗ.
