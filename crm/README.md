# Beeftown CRM

Hệ thống CRM và thẻ thành viên của Beeftown. Beeftown **sở hữu 100%** dữ liệu khách hàng — đây chính là một trong ba thứ mà ma trận phần mềm yêu cầu phải tự sở hữu.

> **Đặc tả nghiệp vụ:** [`../Beeftown_CRM_Design.html`](../Beeftown_CRM_Design.html). Mọi con số trong code (tỷ lệ 3%, ngưỡng 50.000đ, 6 nhóm khách) đều lấy từ đó — sửa code thì phải sửa cả tài liệu.

## Trạng thái

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| 0 | Schema database + phân quyền | ✅ Xong, 71 kiểm tra đạt |
| 1 | Đặt bàn thật (thay Google Sheet) | 🔜 Schema xong, chờ giao diện |
| 2 | Lõi CRM — hồ sơ khách, phân nhóm | 🔜 Schema xong, chờ giao diện |
| 3 | Thẻ tích điểm | 🔜 Schema xong, chờ giao diện |
| 4 | Chiến dịch ZBS | 🔜 Schema xong, chờ nối API Zalo |
| 5 | Báo cáo BI | 🔜 Hàm chỉ số xong, chờ giao diện |

Phần **database đã hoàn chỉnh và kiểm thử đầy đủ**. Phần giao diện web chưa dựng.

## Chạy kiểm thử

Không cần Docker, không cần cài Postgres — dùng PGlite (Postgres chạy WASM trong Node).

```bash
cd crm && npm install && npm test
```

- `npm run test:db` — 50 kiểm tra nghiệp vụ (chuẩn hóa SĐT, sổ cái điểm, ba luật tính điểm, đặt bàn, phân nhóm)
- `npm run test:rls` — 21 kiểm tra phân quyền (tách dữ liệu giữa chi nhánh, vai trò, website công khai)

**Chạy lại toàn bộ kiểm thử sau mỗi lần sửa migration.** Chúng đã bắt được 2 lỗi thật trong quá trình xây: `generate_series` không nhận kiểu `time`, và ba hàm xem lịch trống thiếu `security definer` khiến website không gọi được.

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
│   └── 0007_phan_quyen.sql      chính sách RLS
└── test/                    ← kiểm thử chạy trên Postgres thật
```

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

Website công khai **không có quyền vào bảng nào cả** — chỉ gọi được ba hàm `SECURITY DEFINER` ở trên.

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
