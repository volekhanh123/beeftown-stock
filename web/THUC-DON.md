# Công bố thực đơn lên beeftown.vn

Ba trang `/thuc-don`, `/en/menu`, `/ko/menu` đọc món qua đúng một cửa: hàm `thuc_don_cong_khai()` của
database (migration 0011, 0036). Phần **Bò tại quầy** luôn hiện (giải thích khay, nhãn, cách tính giá) — không
cần làm gì. Phần **Món ăn** và **Đồ uống** chỉ hiện những món đã qua đủ ba lớp:

1. **Công tắc `hien_thuc_don`** đang bật. Tắt (hoặc chưa từng bật) thì cả hai phần chỉ có lời giới thiệu theo
   nhóm món, không tên món nào.
2. **Món ở trạng thái `da_cong_bo`.** Database chỉ cho chuyển khi `mo_ta_vi` đã viết xong (không rỗng, không còn
   ngoặc vuông kiểu `[Chờ…]`), và **món sống phải có câu cảnh báo** (`canh_bao`) — CHECK `mon_an_cong_bo_phai_sach`.
3. **Đồ uống có cồn** còn cần thêm công tắc `hien_do_uong_co_con`. Tắt thì Highball, Makgeolli, Cocktails ẩn
   khỏi trang (dữ liệu vẫn còn), và dòng "không phục vụ đồ uống có cồn cho người dưới 18 tuổi" cũng ẩn theo.

**Giá không đi qua hướng dẫn này.** Chưa món nào có giá duyệt, và web chặn mọi số tiền trên trang công khai
(`web/src/lib/chuoi-cam.js`). Bò tại quầy không bao giờ có giá trên web — giá nằm trên nhãn khay tại quầy.

`crm/test/test-cong-khai-thuc-don.mjs` chạy **đúng các khối SQL dưới đây** (theo thứ tự, trên database thử
PGlite với đủ migration) và kiểm món hiện ra, giá vẫn rỗng, công tắc rượu có tác dụng, thu hồi thì món biến
mất. Sửa một khối ở đây mà làm hỏng điều đó thì `npm test` đỏ. Mỗi khối có dòng `<!-- sql:tên -->` ngay
trước để kiểm thử tìm được — đổi tên thì sửa cả kiểm thử.

## Màn Thực đơn trong /noi-bo — cách làm hằng ngày

Bước 2, 3, 4 và bước thu hồi bên dưới làm được cho **từng món** ở `/noi-bo/thuc-don`, không cần SQL:
- sửa tên, mô tả, khẩu phần, câu cảnh báo (món sống) và thứ tự;
- sửa bản tiếng Anh, tiếng Hàn (máy dịch sau mỗi lần lưu, sửa tay thắng máy);
- bấm **Lưu và công bố**, hoặc **Gỡ khỏi trang**.

Ai làm được: chủ nhà hàng, quản lý, marketing; thu ngân chỉ xem. Database vẫn chặn đúng như các khối SQL: món chưa
sạch không công bố được. Màn đó **không** đụng giá, mức cay, cờ món sống / có cồn, nhóm. Những việc đó, tên nhóm
tiếng Hàn và việc bật hai công tắc (bước 5) vẫn làm bằng SQL ở đây; muốn sửa nhiều món một lượt cũng dùng SQL.

## Làm ở đâu, theo thứ tự nào

- Supabase → project → **SQL Editor**. Mỗi khối là **một lần bấm Run**; khối nào báo lỗi thì dừng, đọc câu
  lỗi (database từ chối cả khối, không ghi nửa chừng).
- **Chạy trên project Beeftown-thu trước**, mở ba trang của bản xem thử, rồi mới chạy trên production.
- Chạy lại một khối lần nữa không hỏng gì: khối bật công tắc tự thu hồi bản cũ trước khi thêm bản mới.
- Đây là thao tác dữ liệu, không phải migration — nhưng vẫn chỉ làm trên production **sau khi** PR trang
  thực đơn đã gộp và deploy, để trang thật đọc được các cột này.

## Bước 1 — Xem món nào còn vướng gì

<!-- sql:xem -->
```sql
-- Món chưa công bố và lý do (view v_mon_con_vuong, 0011), kèm bản nháp mô tả và điều cần xác nhận.
select v.ma, v.ten_vi, v.nhom, v.vuong_gi, m.copy_nhap, m.can_xac_nhan
from v_mon_con_vuong v
join mon_an m on m.ma = v.ma
order by v.ma;
```

Cột `copy_nhap` là bản nháp mô tả lấy từ bảng nội dung menu; `can_xac_nhan` là điều phải hỏi bếp trước khi
công bố (sốt, thành phần dị ứng, trứng sống…). **Chưa xác nhận xong thì chưa công bố món đó.**

## Bước 2 — Tên món và mô tả đã duyệt

Lượt đầu: bốn món dưới đây (Salad Caesar, bò sống trộn kiểu Hàn, nước cam, Highball cổ điển). Lượt sau thì
chép khối, đổi mã món và câu chữ. Quy tắc câu chữ (brief 06/10/2026):

- Chỉ ghi điều bếp đã xác nhận. Không "ngon nhất", không "100%", không tự gắn chay / cay / dị ứng.
- `mo_ta_vi` là bản gốc và **bắt buộc**. `mo_ta_en`, `mo_ta_ko` nên có — thiếu thì trang tiếng Anh / tiếng
  Hàn lùi về bản kế tiếp (ko → en → vi).
- Tên tiếng Hàn (`ten_ko`) nhờ người đọc tiếng Hàn xem lại trước khi chạy trên production.

<!-- sql:mo-ta -->
```sql
update mon_an set
  mo_ta_vi = 'Xà lách romaine, sốt Caesar, phô mai Parmesan và bánh mì giòn.',
  mo_ta_en = 'Romaine lettuce, Caesar dressing, Parmesan and croutons.',
  mo_ta_ko = '로메인, 시저 드레싱, 파르메산 치즈와 크루통이 들어간 샐러드예요.',
  ten_ko   = '시저 샐러드'
where ma = 'F01';

update mon_an set
  mo_ta_vi = 'Bò sống trộn kiểu Hàn. Hỏi nhân viên về thành phần và cách dùng.',
  mo_ta_en = 'Korean-style raw beef. Ask our staff about the ingredients and how to enjoy it.',
  mo_ta_ko = '한국식으로 무친 생소고기예요. 재료와 드시는 방법은 직원에게 물어봐 주세요.',
  ten_ko   = '육회'
where ma = 'F03';

update mon_an set
  mo_ta_vi = 'Nước cam dùng lạnh.',
  mo_ta_en = 'Orange juice, served chilled.',
  mo_ta_ko = '차갑게 드리는 오렌지 주스예요.',
  ten_ko   = '오렌지 주스'
where ma = 'D09';

update mon_an set
  mo_ta_vi = 'Whisky, soda và chanh trong ly highball cổ điển.',
  mo_ta_en = 'Whisky, soda and lemon in a classic highball glass.',
  mo_ta_ko = '클래식 하이볼 잔에 위스키, 탄산수, 레몬을 담았어요.',
  ten_ko   = '클래식 하이볼'
where ma = 'D02';
```

Tên nhóm món bằng tiếng Hàn (một lần cho cả thực đơn; tiếng Anh đã có từ migration 0011):

<!-- sql:ten-nhom-ko -->
```sql
update nhom_mon set ten_ko = d.ten_ko
from (values
  ('bo-tai-quay', '정육 코너'),
  ('goi-them',    '추가 메뉴'),
  ('salad',       '샐러드 & 애피타이저'),
  ('com',         '밥'),
  ('mi-y',        '파스타'),
  ('mien-mi',     '당면 & 냉면'),
  ('canh',        '한식 찌개'),
  ('lau',         '전골'),
  ('trang-mieng', '디저트'),
  ('khong-con',   '논알코올'),
  ('highball',    '하이볼'),
  ('makgeolli',   '막걸리'),
  ('cocktail',    '칵테일')
) as d(ma, ten_ko)
where nhom_mon.ma = d.ma;
```

## Bước 3 — Câu cảnh báo cho món sống (F03)

Bắt buộc trước khi công bố F03: database từ chối công bố món sống thiếu cảnh báo. Câu cảnh báo hiện ngay dưới
tên món, cạnh nhãn "Món sống", ở cả ba thứ tiếng — khách nước ngoài là người cần đọc nó nhất.

<!-- sql:canh-bao -->
```sql
update mon_an set
  canh_bao    = 'Món dùng thịt bò sống, không nấu chín. Hỏi nhân viên về thành phần trước khi gọi.',
  canh_bao_en = 'Made with raw, uncooked beef. Please ask our staff about the ingredients before ordering.',
  canh_bao_ko = '익히지 않은 생소고기로 만든 메뉴예요. 주문 전에 재료를 직원에게 문의해 주세요.'
where ma = 'F03';
```

## Bước 4 — Công bố các món đã duyệt

<!-- sql:cong-bo-mon -->
```sql
update mon_an set trang_thai = 'da_cong_bo'
where ma in ('F01', 'F03', 'D09', 'D02')
  and trang_thai <> 'da_cong_bo';
```

Database báo `mon_an_cong_bo_phai_sach` nghĩa là một món trong danh sách còn thiếu mô tả hoặc (món sống) thiếu
cảnh báo — cả câu lệnh bị từ chối, không món nào đổi. Xem lại Bước 1.

## Bước 5 — Bật thực đơn trên trang

<!-- sql:bat-thuc-don -->
```sql
begin;
-- Mỗi khóa chỉ có MỘT bản đang công bố: thu hồi bản cũ (nếu có) rồi thêm bản mới.
update noi_dung_cong_bo set trang_thai = 'da_thu_hoi'
where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo';
insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai, ly_do)
values ('hien_thuc_don', 'bool', true, 'da_cong_bo', 'Mở thực đơn trên trang công khai — web/THUC-DON.md');
commit;
```

**Đồ uống có cồn để tắt** ở lượt đầu: D02 (Highball) đã công bố nhưng chưa hiện trên trang. Khi Khánh muốn
hiện (đã kiểm quy định quảng cáo đồ uống có cồn):

<!-- sql:bat-do-uong-co-con -->
```sql
begin;
update noi_dung_cong_bo set trang_thai = 'da_thu_hoi'
where khoa = 'hien_do_uong_co_con' and trang_thai = 'da_cong_bo';
insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai, ly_do)
values ('hien_do_uong_co_con', 'bool', true, 'da_cong_bo', 'Hiện đồ uống có cồn trên thực đơn — web/THUC-DON.md');
commit;
```

<!-- sql:tat-do-uong-co-con -->
```sql
update noi_dung_cong_bo set trang_thai = 'da_thu_hoi'
where khoa = 'hien_do_uong_co_con' and trang_thai = 'da_cong_bo';
```

## Bước 6 — Kiểm ba trang

<!-- sql:kiem -->
```sql
-- Đúng những gì trang tiếng Việt sẽ hiện. Cột gia phải RỖNG ở mọi dòng.
select nhom_ma, mon_ma, ten, mo_ta, gia, co_con, la_mon_song, canh_bao
from thuc_don_cong_khai('vi');
```

Rồi mở `https://beeftown.vn/thuc-don`, `/en/menu`, `/ko/menu` (production) hoặc bản xem thử (Beeftown-thu):

- món vừa công bố hiện đúng nhóm; F03 có nhãn "Món sống" và câu cảnh báo ở cả ba thứ tiếng;
- không có con số giá nào;
- quét chữ cấm trên trang thật: `cd web && npm run quet -- --url https://beeftown.vn`.

## Thu hồi — khi cần gỡ ngay

Gỡ một món (trang thôi hiện món đó trong vài giây, dữ liệu vẫn còn):

<!-- sql:thu-hoi-mon -->
```sql
update mon_an set trang_thai = 'da_thu_hoi' where ma in ('F03');
```

Gỡ cả phần Món ăn / Đồ uống (trang quay về lời giới thiệu theo nhóm; Bò tại quầy vẫn hiện):

<!-- sql:tat-thuc-don -->
```sql
update noi_dung_cong_bo set trang_thai = 'da_thu_hoi'
where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo';
```

Công bố lại một món đã thu hồi: chạy lại Bước 4 với mã món đó.
