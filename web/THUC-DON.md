# Công bố thực đơn lên beeftown.vn

Ba trang `/thuc-don`, `/en/menu`, `/ko/menu` đọc món qua đúng một cửa: hàm `thuc_don_cong_khai()` của
database (migration 0011, 0036). Phần **Bò tại quầy** luôn hiện (giải thích khay, nhãn, cách tính giá) — không
cần làm gì. Phần **Món ăn** và **Đồ uống** chỉ hiện những món đã qua đủ ba lớp:

1. **Công tắc `hien_thuc_don`** đang bật. Tắt (hoặc chưa từng bật) thì cả hai phần chỉ có lời giới thiệu theo
   nhóm món, không tên món nào.
2. **Món ở trạng thái `da_cong_bo`.** Database chỉ cho chuyển khi `mo_ta_vi` đã viết xong (không rỗng, không còn
   ngoặc vuông kiểu `[Chờ…]`), và **món sống phải có câu cảnh báo** (`canh_bao`) — CHECK `mon_an_cong_bo_phai_sach`.
3. **Đồ uống có cồn** còn cần thêm công tắc `hien_do_uong_co_con`. Tắt thì Signature, Highball, Bia, Soju,
   Makgeolli ẩn khỏi trang (dữ liệu vẫn còn), và dòng "không phục vụ đồ uống có cồn cho người dưới 18 tuổi"
   cũng ẩn theo.

Danh mục là cuốn menu in **bản sáng** Khánh chốt ngày 11/10/2026, nạp bằng migration `0091_thuc_don_ban_sang.sql`:
17 nhóm, 42 món (22 món ăn, 20 đồ uống), tất cả ở `nhap`. 10 món cũ không có trong cuốn đã thu hồi
(`da_thu_hoi`) và 3 nhóm cũ đã tắt (Miến & mì lạnh, Tráng miệng, Cocktails) — chúng không bao giờ lên trang.
Tên món và tên nhóm (ba thứ tiếng) đã nằm trong migration; hướng dẫn này chỉ ghi mô tả, cảnh báo và công bố.

**Giá không đi qua hướng dẫn này.** Trang Thực đơn chỉ in giá ĐÃ DUYỆT (cột `gia` khác null, tức
`gia_da_duyet = true`); hiện chưa món nào có. Hướng dẫn này không duyệt giá — duyệt giá là một việc riêng, có PR
riêng (`web/README.md`, dòng "Duyệt giá thực đơn"). Bò tại quầy không bao giờ có giá trên web — giá nằm trên nhãn
khay tại quầy. Bốn món có `gia_de_xuat` 69.000đ đang chờ duyệt (S01 Set 4 sốt, ba ly signature D13, D01, D14);
35 giá còn lại trong cuốn là giá dummy nên không nhập ở đâu cả.

**Tiếng Hàn do Claude dịch ngày 11/10/2026, sửa ngày 13/10/2026 theo rà soát, chưa có người đọc tiếng Hàn
xem** — tên món, tên nhóm (trong
migration 0091), mô tả và câu cảnh báo (các khối dưới). Nhờ người đọc tiếng Hàn xem lại trước khi chạy trên
production. Sửa một tên: `update mon_an set ten_ko = '…' where ma = '…';` (database tự ghi đó là bản sửa tay,
máy dịch không đè).

`crm/test/test-cong-khai-thuc-don.mjs` chạy **đúng các khối SQL dưới đây** (theo thứ tự, trên database thử
PGlite với đủ migration) và kiểm món hiện ra đúng thứ tự, chữ đúng từng chữ, giá vẫn rỗng, công tắc rượu có
tác dụng, chạy lại không đổi gì, thu hồi thì món biến mất. Sửa một khối ở đây mà làm hỏng điều đó thì `npm test`
đỏ. Mỗi khối có dòng `<!-- sql:tên -->` ngay trước để kiểm thử tìm được — đổi tên thì sửa cả kiểm thử.

## Làm ở đâu, theo thứ tự nào

- Supabase → project → **SQL Editor**. Mỗi khối là **một lần bấm Run**; khối nào báo lỗi thì dừng, đọc câu
  lỗi (database từ chối cả khối, không ghi nửa chừng).
- **Chạy trên project Beeftown-thu trước**, mở ba trang của bản xem thử, rồi mới chạy trên production.
- Chạy lại một khối lần nữa không hỏng gì: khối mô tả ghi lại đúng chữ đó, khối công bố bỏ qua món đã công bố,
  khối bật công tắc tự thu hồi bản cũ trước khi thêm bản mới.
- Đây là thao tác dữ liệu, không phải migration — nhưng chỉ làm trên production **sau khi** PR đã gộp, migration
  `0091` đã chạy (và `npm run doi-chieu` báo KHỚP), web đã deploy.
- **Chưa xác nhận xong thì chưa công bố món đó.** Ghi mô tả trước thì được (trang chưa hiện gì), công bố thì chờ.
- **Migration 0091 chỉ chạy một lần.** Đã ghi mô tả, cảnh báo, công bố hay duyệt giá / độ cay mà chạy lại thì
  database từ chối cả file (khối chặn đầu file) — chạy lại sẽ xóa hết phần đã làm. Sửa món thì dùng câu `update`
  riêng; đổi danh mục thì viết migration mới.

## Bước 0 — Kiểm danh mục sau migration 0091

`npm run doi-chieu` chỉ so cấu trúc, không đọc dữ liệu. Khối này đếm dữ liệu migration vừa nạp:

<!-- sql:kiem-danh-muc -->
```sql
-- Phải ra: 17 · 3 · 42 · 10 · 0
select
  (select count(*) from nhom_mon where dang_dung)               as nhom_dang_dung,
  (select count(*) from nhom_mon where not dang_dung)           as nhom_da_tat,
  (select count(*) from mon_an where trang_thai <> 'da_thu_hoi') as mon_con_dung,
  (select count(*) from mon_an where trang_thai = 'da_thu_hoi')  as mon_da_thu_hoi,
  (select count(*) from mon_an where trang_thai = 'da_cong_bo')  as mon_da_cong_bo;
```

Ra số khác thì dừng, chưa chạy bước nào bên dưới — migration chưa chạy hết.

## Bước 1 — Xem món nào còn vướng gì

<!-- sql:xem -->
```sql
-- Món chưa công bố và lý do (view v_mon_con_vuong — 0011, sửa ở 0091), kèm bản nháp mô tả và điều cần xác nhận.
select v.ma, v.ten_vi, v.nhom, v.vuong_gi, m.copy_nhap, m.can_xac_nhan
from v_mon_con_vuong v
join mon_an m on m.ma = v.ma
join nhom_mon g on g.id = m.nhom_mon_id
order by g.thu_tu, m.thu_tu;
```

Ngay sau migration: 42 dòng, đều "Chưa có mô tả". Món đã thu hồi và nhóm đã tắt không hiện ở đây. Cột
`copy_nhap` là mô tả tiếng Việt của cuốn (mô tả tiếng Anh nằm ở `nguyen_van_nguon`); `can_xac_nhan` là điều phải
hỏi bếp hoặc Sang trước khi công bố. Sau Bước 2, món có độ cay hay giá đề xuất sẽ chuyển sang "Mức cay chưa được
duyệt" / "Giá chưa được duyệt": hai lý do này **không chặn** công bố — trang không in độ cay hay giá chưa duyệt.

## Bước 2 — Mô tả ba thứ tiếng, theo nhóm của cuốn

Chữ chép nguyên văn cuốn bản sáng (kể cả chỗ cuốn viết "kimchi" ở mô tả, "kim chi" ở tên món); tiếng Hàn xem
ghi chú ở đầu file. Quy tắc câu chữ (brief 06/10/2026):

- Trang chỉ được nói điều bếp đã xác nhận. Không "ngon nhất", không "100%", không tự gắn chay / cay / dị ứng.
  Bếp hay Sang xác nhận khác chữ của cuốn thì sửa câu ngay trong SQL Editor, đủ ba thứ tiếng, trước khi chạy.
- Câu có dấu nháy đơn thì gõ nháy hai lần: `'Beeftown''s'` — gõ một lần là SQL Editor báo lỗi cú pháp.
- `mo_ta_vi` là bản gốc và **bắt buộc**. `mo_ta_en`, `mo_ta_ko` nên có — thiếu thì trang tiếng Anh / tiếng
  Hàn lùi về bản kế tiếp (ko → en → vi).
- Dòng **Chờ** trên mỗi khối là điều còn chờ xác nhận. Chạy khối mô tả lúc nào cũng được; **chưa xác nhận xong
  thì chưa công bố món đó** (Bước 4).

### Món đặc trưng — F03, F19 (tờ kẹp)

**Chờ:** Sang xác nhận phần thịt (nạm) và nguồn trứng dùng sống của cả hai món; phô mai của F03 là Grana Padano hay Parmigiano.

<!-- sql:mo-ta-dac-trung -->
```sql
-- F03 · Tartare bò hoa tuyết
update mon_an set
  mo_ta_vi = 'Nạm có thớ rõ, vị bò đậm, dai vừa. Thịt tươi xếp như cánh hoa, phủ phô mai Grana Padano hoặc Parmigiano bào mịn như tuyết. Trộn lòng đỏ trứng với gia vị Hàn mặn ngọt. Vị mặn của phô mai, độ béo của lòng đỏ làm tròn vị bò.',
  mo_ta_en = 'Flank, for its clear grain and deep beef flavour, arranged like petals under grated Grana Padano or Parmigiano. Mix in the yolk and our sweet-savoury Korean seasoning.',
  mo_ta_ko = '결이 선명하고 풍미가 진한 플랭크 부위를 꽃잎처럼 담고, 그라나 파다노 또는 파르미지아노 치즈를 눈처럼 갈아 올렸어요. 노른자와 달콤짭짤한 한국식 양념을 넣어 비벼 드세요.'
where ma = 'F03';

-- F19 · Cơm trộn tartare bò cay
update mon_an set
  mo_ta_vi = 'Nạm, phần cắt có ít trên mỗi con bò, cùng rau củ giòn theo mùa và sốt cay riêng của Beeftown. Trộn đều bò, sốt và cơm: một bát bibimbap tươi, cay dịu, làm vị bò rõ hơn.',
  mo_ta_en = 'Flank, a cut each animal yields little of, with crisp seasonal vegetables and our own spicy sauce. Mix it through the rice, a fresh take on bibimbap.',
  mo_ta_ko = '소 한 마리에서 조금밖에 나오지 않는 플랭크 부위에 아삭한 제철 채소와 Beeftown만의 매콤한 소스를 곁들였어요. 밥과 함께 고루 비벼 드세요.'
where ma = 'F19';
```

### Lẩu — F15, F16, F20 (trang 7)

**Chờ:** Sang xác nhận giờ trưa (lẩu chỉ bán buổi trưa, theo combo); bếp xác nhận F15 nấu từ kimchi nhà làm.

<!-- sql:mo-ta-lau -->
```sql
-- F15 · Lẩu kim chi
update mon_an set
  mo_ta_vi = 'Nấu từ kimchi nhà làm, với thịt heo, đậu hũ và nấm. Nước dùng chua, cay.',
  mo_ta_en = 'Made with our house kimchi, pork, tofu and mushrooms. Sour, spicy broth.',
  mo_ta_ko = '직접 담근 김치에 돼지고기, 두부, 버섯을 넣어 끓였어요. 새콤하고 매콤한 국물이에요.'
where ma = 'F15';

-- F16 · Lẩu bò bulgogi
update mon_an set
  mo_ta_vi = 'Bò thái mỏng ướp bulgogi, miến, nấm. Nước dùng ngọt thanh.',
  mo_ta_en = 'Thin-sliced bulgogi beef in a light, sweet broth.',
  mo_ta_ko = '얇게 썬 불고기와 당면, 버섯을 넣었어요. 국물이 달큰하고 깔끔해요.'
where ma = 'F16';

-- F20 · Lẩu nấm
update mon_an set
  mo_ta_vi = 'Nhiều loại nấm tươi, đậu hũ, cải thảo. Nước dùng thanh.',
  mo_ta_en = 'Assorted fresh mushrooms in a light broth.',
  mo_ta_ko = '여러 가지 생버섯과 두부, 배추를 넣었어요. 국물이 맑고 담백해요.'
where ma = 'F20';
```

### Set 4 sốt — S01 (trang 8)

**Chờ:** Sang xác nhận 69.000đ tính theo người hay theo bàn và câu "Thêm 1 lần"; bếp xác nhận kimchi nhà làm.

<!-- sql:mo-ta-set-sot -->
```sql
-- S01 · Set 4 sốt
update mon_an set
  mo_ta_vi = '4 sốt hâm nóng ngay trên vỉ: phô mai, tare, ssamjang, sốt cay Tứ Xuyên. Kèm kimchi nhà làm và rau cuốn. Thêm 1 lần.',
  mo_ta_en = 'Four sauces, served warm on the grill: cheese, tare, ssamjang and Sichuan chili. With house kimchi and wrap greens. One refill.',
  mo_ta_ko = '치즈, 타레, 쌈장, 쓰촨식 매운 소스 네 가지를 그릴 위에서 따뜻하게 데워 드려요. 직접 담근 김치와 쌈 채소가 함께 나오고, 한 번 리필해 드려요.'
where ma = 'S01';
```

### Salad — F21, F01, F10 (trang 9)

Không còn điều chờ xác nhận.

<!-- sql:mo-ta-salad -->
```sql
-- F21 · Salad nấm
update mon_an set
  mo_ta_vi = 'Nấm nướng trên rau xanh, sốt mè. Ăn xen với bò cho đỡ ngán.',
  mo_ta_en = 'Grilled mushrooms on fresh greens with sesame dressing.',
  mo_ta_ko = '신선한 채소 위에 구운 버섯을 올리고 참깨 드레싱을 곁들였어요.'
where ma = 'F21';

-- F01 · Caesar salad
update mon_an set
  mo_ta_vi = 'Xà lách romaine, bánh mì nướng giòn, phô mai bào, sốt Caesar.',
  mo_ta_en = 'Romaine, croutons, shaved parmesan and Caesar dressing.',
  mo_ta_ko = '로메인, 크루통, 파르메산 치즈에 시저 드레싱을 곁들였어요.'
where ma = 'F01';

-- F10 · Miến trộn Hàn
update mon_an set
  mo_ta_vi = 'Miến xào với bò và rau củ, dọn trên chảo gang nóng.',
  mo_ta_en = 'Glass noodles stir-fried with beef and vegetables, on a sizzling plate.',
  mo_ta_ko = '소고기와 채소를 넣고 볶은 당면을 뜨거운 철판에 담아 드려요.'
where ma = 'F10';
```

### Món thêm — F22, F23, F18 (trang 10)

**Chờ:** Sang xác nhận F18 "Bánh gạo chiên phô mai" đúng là món "Injeolmi Cheese" của bảng nội dung 06/10.

<!-- sql:mo-ta-mon-them -->
```sql
-- F22 · Trứng hấp núi lửa
update mon_an set
  mo_ta_vi = 'Trứng hấp trong thố đá, phồng cao, mềm và nóng.',
  mo_ta_en = 'Fluffy steamed egg, served hot in a stone pot.',
  mo_ta_ko = '뚝배기에 봉긋하게 부풀려 낸, 부드럽고 뜨거운 계란찜이에요.'
where ma = 'F22';

-- F23 · Khoai tây chiên sốt bò
update mon_an set
  mo_ta_vi = 'Khoai tây chiên giòn, phủ sốt bò bằm và sốt phô mai.',
  mo_ta_en = 'Crispy fries topped with minced beef sauce and cheese sauce.',
  mo_ta_ko = '바삭한 감자튀김에 다진 소고기 소스와 치즈 소스를 올렸어요.'
where ma = 'F23';

-- F18 · Bánh gạo chiên phô mai
update mon_an set
  mo_ta_vi = 'Vỏ giòn, nhân phô mai kéo sợi, rắc bột đậu nành rang.',
  mo_ta_en = 'Crispy outside, stretchy cheese inside, dusted with roasted soybean powder.',
  mo_ta_ko = '겉은 바삭하고 속에는 치즈가 쭉 늘어나요. 볶은 콩가루를 뿌렸어요.'
where ma = 'F18';
```

### Canh — F12, F14, F13 (trang 11)

**Chờ:** bếp xác nhận F12 nấu từ kimchi nhà làm.

<!-- sql:mo-ta-canh -->
```sql
-- F12 · Canh kim chi
update mon_an set
  mo_ta_vi = 'Nấu từ kimchi nhà làm, thịt heo, đậu hũ. Chua, cay.',
  mo_ta_en = 'House kimchi, pork and tofu. Sour and spicy.',
  mo_ta_ko = '직접 담근 김치에 돼지고기와 두부를 넣어 끓였어요. 새콤하고 매콤해요.'
where ma = 'F12';

-- F14 · Đậu phụ hầm
update mon_an set
  mo_ta_vi = 'Đậu hũ non mềm trong nước dùng cay, nóng.',
  mo_ta_en = 'Silky soft tofu in a hot, spicy broth.',
  mo_ta_ko = '부드러운 순두부를 뜨겁고 매콤한 국물에 끓였어요.'
where ma = 'F14';

-- F13 · Canh tương đậu
update mon_an set
  mo_ta_vi = 'Tương đậu nành, đậu hũ và rau củ. Vị đậm.',
  mo_ta_en = 'Soybean paste with tofu and vegetables. Rich and savoury.',
  mo_ta_ko = '된장에 두부와 채소를 넣어 끓였어요. 맛이 깊고 구수해요.'
where ma = 'F13';
```

### Cơm — F06, F05, F04 (trang 12)

**Chờ:** bếp xác nhận F06 nấu từ kimchi nhà làm.

<!-- sql:mo-ta-com -->
```sql
-- F06 · Cơm kim chi bò
update mon_an set
  mo_ta_vi = 'Cơm rang kimchi nhà làm với bò, trứng ốp la.',
  mo_ta_en = 'Fried rice with house kimchi and beef, topped with a fried egg.',
  mo_ta_ko = '직접 담근 김치와 소고기를 넣어 볶고, 계란 프라이를 올렸어요.'
where ma = 'F06';

-- F05 · Cơm trộn Hàn
update mon_an set
  mo_ta_vi = 'Cơm, rau trộn, bò, trứng. Trộn cùng tương ớt.',
  mo_ta_en = 'Rice with vegetables, beef and egg. Mix in the chili paste.',
  mo_ta_ko = '밥에 나물, 소고기, 계란을 올렸어요. 고추장과 함께 비벼 드세요.'
where ma = 'F05';

-- F04 · Cơm trộn trứng cá
update mon_an set
  mo_ta_vi = 'Cơm bát đá nóng, phô mai, trứng cá, rau củ giòn.',
  mo_ta_en = 'Hot stone-bowl rice with cheese, fish roe and crunchy vegetables.',
  mo_ta_ko = '뜨거운 돌솥밥에 치즈, 날치알, 아삭한 채소를 올렸어요.'
where ma = 'F04';
```

### Mì — F11, F08, F07, F09 (trang 13)

**Chờ:** Sang xác nhận câu "Kèm cơm, khoảng 70% chén thường" của F11; Khánh quyết F07 (có lòng đỏ trứng tươi) có cần câu lưu ý như món sống không.

<!-- sql:mo-ta-mi -->
```sql
-- F11 · Mì lạnh cay
update mon_an set
  mo_ta_vi = 'Mì lạnh sốt cay, nước dùng đá. Kèm cơm, khoảng 70% chén thường.',
  mo_ta_en = 'Spicy cold noodles with icy broth. With rice, about 70% of a regular bowl.',
  mo_ta_ko = '매콤한 양념의 냉면에 살얼음 육수를 곁들였어요. 밥은 보통 공기의 70% 정도로 함께 나와요.'
where ma = 'F11';

-- F08 · Mì Toowoomba
update mon_an set
  mo_ta_vi = 'Tôm và nấm trong sốt kem, cay nhẹ ở hậu vị.',
  mo_ta_en = 'Shrimp and mushrooms in a creamy sauce with a gentle heat.',
  mo_ta_ko = '새우와 버섯을 넣은 크림소스 파스타예요. 끝맛이 살짝 매콤해요.'
where ma = 'F08';

-- F07 · Mì carbonara
update mon_an set
  mo_ta_vi = 'Sốt trứng và phô mai, thêm lòng đỏ tươi.',
  mo_ta_en = 'Egg and cheese sauce, finished with a fresh yolk.',
  mo_ta_ko = '계란과 치즈로 만든 소스에 신선한 노른자를 올렸어요.'
where ma = 'F07';

-- F09 · Mì bò sốt cà
update mon_an set
  mo_ta_vi = 'Sốt cà chua nấu với bò bằm.',
  mo_ta_en = 'Minced beef simmered in a rich tomato sauce.',
  mo_ta_ko = '다진 소고기를 넣고 진하게 끓인 토마토소스 파스타예요.'
where ma = 'F09';
```

### Ba ly signature — D13, D01, D14 (trang 14, có cồn)

**Chờ:** Khánh chốt danh mục, nhãn hiệu, dung tích đồ uống (cuốn ghi "chờ chốt"); D13, D14 còn là tên tạm, D14 chưa có thành phần.

<!-- sql:mo-ta-signature -->
```sql
-- D13 · Milky Cloud Makgeolli
update mon_an set
  mo_ta_vi = 'Makgeolli sữa. Makgeolli, sữa, kẹo cứng nghiền.',
  mo_ta_en = 'Makgeolli, milk, crushed hard candy.',
  mo_ta_ko = '막걸리에 우유와 잘게 부순 사탕을 더했어요.'
where ma = 'D13';

-- D01 · Strawberry Crush
update mon_an set
  mo_ta_vi = 'Highball dâu. Siro dâu, soda, whisky, dâu sấy.',
  mo_ta_en = 'Strawberry syrup, soda, whisky, dried strawberry.',
  mo_ta_ko = '딸기 시럽, 탄산수, 위스키에 말린 딸기를 올렸어요.'
where ma = 'D01';

-- D14 · Berry Rouge Highball
update mon_an set
  mo_ta_vi = 'Highball quả mọng. Hương quả mọng, chua nhẹ, ngọt dịu.',
  mo_ta_en = 'Deep berry, bright acidity, soft sweetness.',
  mo_ta_ko = '베리 향에 가벼운 산미와 은은한 단맛이 어우러져요.'
where ma = 'D14';
```

## Bước 3 — Câu cảnh báo cho hai món sống (F03, F19)

Bắt buộc trước khi công bố nhóm Món đặc trưng: database từ chối công bố món sống thiếu cảnh báo. Câu cảnh báo
hiện ngay dưới tên món, cạnh nhãn "Món sống", ở cả ba thứ tiếng — khách nước ngoài là người cần đọc nó nhất.

**Chờ:** như nhóm Món đặc trưng — Sang xác nhận nguồn trứng dùng sống.

<!-- sql:canh-bao -->
```sql
update mon_an set
  canh_bao    = 'Món có bò sống và lòng đỏ trứng sống. Người đang mang thai, trẻ nhỏ, người lớn tuổi nên hỏi nhân viên trước khi gọi.',
  canh_bao_en = 'Contains raw beef and raw egg yolk. If you are pregnant, or ordering for a child or an older guest, please ask our staff first.',
  canh_bao_ko = '생소고기와 날계란 노른자가 들어간 메뉴예요. 임산부, 어린이, 어르신은 주문 전에 직원에게 문의해 주세요.'
where ma in ('F03', 'F19');
```

## Bước 4 — Công bố từng nhóm

Mỗi khối công bố đúng các món của một nhóm. Món nào trong nhóm **chưa xác nhận xong** thì xóa mã đó khỏi danh
sách trước khi chạy. Chạy lại không đổi gì: món đã công bố được bỏ qua.

<!-- sql:cong-bo-dac-trung -->
```sql
update mon_an set trang_thai = 'da_cong_bo'
where ma in ('F03', 'F19')
  and trang_thai <> 'da_cong_bo';
```

<!-- sql:cong-bo-lau -->
```sql
update mon_an set trang_thai = 'da_cong_bo'
where ma in ('F15', 'F16', 'F20')
  and trang_thai <> 'da_cong_bo';
```

<!-- sql:cong-bo-set-sot -->
```sql
update mon_an set trang_thai = 'da_cong_bo'
where ma in ('S01')
  and trang_thai <> 'da_cong_bo';
```

<!-- sql:cong-bo-salad -->
```sql
update mon_an set trang_thai = 'da_cong_bo'
where ma in ('F21', 'F01', 'F10')
  and trang_thai <> 'da_cong_bo';
```

<!-- sql:cong-bo-mon-them -->
```sql
update mon_an set trang_thai = 'da_cong_bo'
where ma in ('F22', 'F23', 'F18')
  and trang_thai <> 'da_cong_bo';
```

<!-- sql:cong-bo-canh -->
```sql
update mon_an set trang_thai = 'da_cong_bo'
where ma in ('F12', 'F14', 'F13')
  and trang_thai <> 'da_cong_bo';
```

<!-- sql:cong-bo-com -->
```sql
update mon_an set trang_thai = 'da_cong_bo'
where ma in ('F06', 'F05', 'F04')
  and trang_thai <> 'da_cong_bo';
```

<!-- sql:cong-bo-mi -->
```sql
update mon_an set trang_thai = 'da_cong_bo'
where ma in ('F11', 'F08', 'F07', 'F09')
  and trang_thai <> 'da_cong_bo';
```

Ba ly signature có cồn: công bố rồi vẫn ẩn tới khi bật công tắc đồ uống có cồn (Bước 5).

<!-- sql:cong-bo-signature -->
```sql
update mon_an set trang_thai = 'da_cong_bo'
where ma in ('D13', 'D01', 'D14')
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

Phiên bản thực đơn — trang Thực đơn in ngày cập nhật lấy từ đây. Ngày là ngày Khánh chốt cuốn; muốn ghi ngày
công bố thì đổi `'2026-10-11'` trước khi chạy (chạy lại với ngày khác thì trang đổi theo ngày mới):

<!-- sql:phien-ban -->
```sql
begin;
-- Đúng một phiên bản đang dùng: tắt bản khác (nếu có) rồi bật bản này.
update phien_ban_thuc_don set dang_dung = false
where dang_dung and ma <> 'v2.0';
insert into phien_ban_thuc_don (ma, ngay_hieu_luc, ghi_chu, dang_dung)
values ('v2.0', '2026-10-11', 'Cuốn menu bản sáng, Khánh chốt 11/10/2026 (migration 0091)', true)
on conflict (ma) do update set dang_dung = true, ngay_hieu_luc = excluded.ngay_hieu_luc;
commit;
```

**Đồ uống có cồn để tắt** ở lượt đầu: ba ly signature (D13, D01, D14) đã công bố nhưng chưa hiện trên trang.
Khi Khánh muốn hiện (đã kiểm quy định quảng cáo đồ uống có cồn):

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

Công bố đủ 8 nhóm món ăn: 22 dòng (25 khi đã bật đồ uống có cồn). Rồi mở `https://beeftown.vn/thuc-don`,
`/en/menu`, `/ko/menu` (production) hoặc bản xem thử (Beeftown-thu):

- món vừa công bố hiện đúng nhóm, đúng thứ tự của cuốn; F03, F19 có nhãn "Món sống" và câu cảnh báo ở cả ba thứ
  tiếng;
- không có con số giá nào, không có độ cay;
- quét chữ cấm trên trang thật: `cd web && npm run quet -- --url https://beeftown.vn`.

## Đồ uống dạng danh sách (17 món) chưa công bố được

Cuốn in 17 đồ uống chỉ có tên, không có câu mô tả: 2 highball, 2 bia, 3 soju, 1 makgeolli, 4 nước ép & ade,
3 nước ngọt, 2 nước suối. Database chỉ cho công bố món có `mo_ta_vi`, nên 17 món này ở lại `nhap` và trang chưa
hiện chúng; hướng dẫn này không tự viết mô tả thay cuốn. Hai lối ra, Khánh chọn sau:

1. **Viết một câu mô tả cho mỗi món** (17 câu, đủ ba thứ tiếng), bếp và Sang duyệt như món ăn, rồi thêm khối mô
   tả và khối công bố theo nhóm như Bước 2 và Bước 4.
2. **Đổi luật ở một PR riêng:** cho đồ uống dạng danh sách lên trang chỉ với tên — migration mới đổi CHECK
   `mon_an_cong_bo_phai_sach` cho riêng các nhóm này, trang Thực đơn in chúng thành danh sách, kèm kiểm thử.

Lối nào cũng chờ chốt danh mục, nhãn hiệu, dung tích trước (`can_xac_nhan` của cả 20 đồ uống). Trong lúc chờ,
dòng "Thực đơn" ở trang Tổng quan `/noi-bo` báo 17 món "Chưa có mô tả" — đúng sự thật, không phải lỗi.

## Thu hồi — khi cần gỡ ngay

Gỡ một món (trang thôi hiện món đó trong vài giây, dữ liệu vẫn còn):

<!-- sql:thu-hoi-mon -->
```sql
update mon_an set trang_thai = 'da_thu_hoi' where ma in ('F03');
```

Món đã thu hồi rời danh sách ở Bước 1. Công bố lại: chạy lại khối công bố của nhóm đó (Bước 4) — nhóm còn món
cố ý chưa công bố thì chỉ để lại mã món cần đưa lại.

Gỡ cả phần Món ăn / Đồ uống (trang quay về lời giới thiệu theo nhóm; Bò tại quầy vẫn hiện):

<!-- sql:tat-thuc-don -->
```sql
update noi_dung_cong_bo set trang_thai = 'da_thu_hoi'
where khoa = 'hien_thuc_don' and trang_thai = 'da_cong_bo';
```
