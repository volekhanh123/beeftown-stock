-- =============================================================================
-- BEEFTOWN CRM — 0094 · THỰC ĐƠN THEO CUỐN MENU BẢN SÁNG
-- 17 nhóm đang dùng · 42 món còn dùng · 10 món thu hồi · KHÔNG món nào công bố
-- =============================================================================
-- NGUỒN DỮ LIỆU
--
-- Cuốn menu in "bản sáng" (Cuốn C nền sáng), Khánh chốt ngày 11/10/2026 và bảo
-- đưa lên trang Thực đơn. Danh mục trong database lúc đó là seed của 0011 (bảng
-- nội dung menu v1 ngày 17/09/2026: 13 nhóm, 31 món) — KHÁC cuốn vừa chốt: cuốn
-- có bảy nhóm mới (Món đặc trưng, Món thêm, Signature, Bia, Soju, Nước ngọt,
-- Nước suối), 21 món mới, giữ 21 món cũ (đổi tên, nhóm hoặc thứ tự) và không
-- còn 10 món cũ.
--
-- Database thật đọc ngày 11/10/2026 (chỉ đọc): đúng 13 nhóm, 31 món, tất cả
-- 'nhap', chưa món nào có mô tả hay giá duyệt, chưa có phiên bản thực đơn.
-- Như 0011, file CSV / file thiết kế gốc nằm ngoài repo nên MIGRATION NÀY LÀ
-- NGUỒN SỰ THẬT của danh mục. Chữ tiếng Việt và tiếng Anh chép NGUYÊN VĂN cuốn
-- (kể cả chỗ cuốn viết "kimchi" ở mô tả và "kim chi" ở tên món). Tên tiếng Hàn
-- do Claude dịch ngày 11/10/2026, sửa ngày 13/10/2026 theo rà soát, CHƯA có
-- người đọc tiếng Hàn xem — xem web/THUC-DON.md trước khi công bố.
--
-- FILE NÀY LÀM GÌ
--
--   0. Chặn chạy lại khi thực đơn đã được làm tiếp (xem "CHỈ CHẠY MỘT LẦN").
--   1. nhom_mon: 17 nhóm của cuốn (tên vi / en / ko, thứ tự trang). Bảy nhóm
--      mới; ba nhóm không còn món (mien-mi, trang-mieng, cocktail) tắt
--      dang_dung — KHÔNG xóa.
--   2. mon_an: 42 món của cuốn. 21 dòng cũ giữ mã, đổi tên / nhóm / thứ tự;
--      21 dòng mới (F19–F23, D13–D28). Mọi món về 'nhap'.
--   3. 10 món có trong database mà không có trong cuốn → 'da_thu_hoi' kèm lý
--      do ở can_xac_nhan — KHÔNG xóa (file này không có câu xóa dòng nào).
--   4. v_mon_con_vuong thôi liệt kê món đã thu hồi và món thuộc nhóm đã tắt:
--      trang Tổng quan /noi-bo đọc thẳng view này để đếm "món còn vướng", để
--      nguyên thì 10 món thu hồi nằm trong danh sách việc mãi mãi. Cùng luật
--      với v_viec_dich (0036), vốn đã bỏ qua hai loại dòng này.
--   5. Sổ bản dịch (0036): tên ba thứ tiếng của món và nhóm đang dùng là chữ
--      của cuốn → ghi là bản TAY của đúng tên tiếng Việt mới, để máy dịch
--      không dịch đè.
--
-- FILE NÀY KHÔNG LÀM GÌ
--
--   · KHÔNG công bố món nào, KHÔNG bật công tắc nào (hien_thuc_don,
--     hien_do_uong_co_con), KHÔNG tạo phiên bản thực đơn. Chạy xong thì trang
--     Thực đơn vẫn y như trước: thuc_don_cong_khai() rỗng. Công bố là việc Khánh
--     chạy tay từng nhóm theo web/THUC-DON.md.
--   · KHÔNG ghi giá. Cuốn có 35 giá dummy → không ghi vào đâu cả. Bốn món có
--     giá thật theo menu chuẩn 29/09 (Set 4 sốt và ba ly signature, 69.000đ)
--     → gia_de_xuat = 69000, tức là ĐỀ XUẤT CHỜ DUYỆT; gia vẫn null,
--     gia_da_duyet vẫn false, website không thấy số nào.
--   · KHÔNG duyệt độ cay. Số ớt trong cuốn là số giả lập → muc_cay_de_xuat cho
--     22 món ăn; muc_cay null.
--   · KHÔNG ghi mô tả công khai, KHÔNG ghi câu cảnh báo món sống: mo_ta_vi /
--     mo_ta_en / mo_ta_ko và canh_bao* là null sau file này. Chúng được ghi ở
--     bước công bố của web/THUC-DON.md, sau khi bếp xác nhận.
--
-- TỪNG CỘT NỘI BỘ
--
--   copy_nhap        Mô tả tiếng Việt của cuốn (25 món có mô tả: 22 món ăn, 3
--                    ly signature) — đúng nghĩa 0011: "bản nháp mô tả, chờ
--                    biên tập". 17 đồ uống dạng danh sách không có mô tả trong
--                    cuốn → null. Không tự viết mô tả thay cuốn.
--   nguyen_van_nguon Mô tả tiếng Anh của cuốn, cùng 25 món — đúng nghĩa 0011:
--                    "câu gốc trong nguồn, có thể chứa claim chưa kiểm" (vd.
--                    "house kimchi" đang chờ bếp xác nhận). Như 0011, cột này
--                    KHÔNG tự thành mô tả tiếng Anh: mo_ta_en chỉ được ghi ở bước
--                    công bố của web/THUC-DON.md, sau khi bếp xác nhận.
--                    Bản nháp và câu nguồn cũ của 21 dòng giữ lại là của bảng
--                    17/09 — viết cho món CŨ (F03: "Fresh beef, korean style…"
--                    của Yukhoe, cạnh tên mới "Tartare bò hoa tuyết") — nên được
--                    thay hết; câu cũ còn nguyên trong 0011 để truy vết.
--   can_xac_nhan     Điều còn chờ bếp / Sang xác nhận, theo bảng danh mục
--                    11/10. Món không còn gì chờ → null. Đồ uống: cuốn ghi
--                    "Danh mục, nhãn hiệu, dung tích: chờ chốt" ở cả hai trang.
--   trang_in         Trang của cuốn: lẩu 7, set sốt 8, salad 9, món thêm 10,
--                    canh 11, cơm 12, mì 13, đồ uống có cồn 14, không cồn 15.
--                    Hai món tartare nằm trên tờ kẹp, không có số trang → null.
--   shot_id          → null cho 42 món còn dùng. 'P-F03'… là mã ảnh trong danh
--                    sách chụp của bảng 17/09 (P-F03 là ảnh Yukhoe); cuốn dùng
--                    bộ ảnh khác, giữ mã cũ cạnh tên món mới là chỉ nhầm ảnh.
--                    Món thu hồi giữ nguyên shot_id (lịch sử của dòng đó).
--   la_mon_song      Đúng hai món tartare (F03, F19). F07 Mì carbonara có lòng
--                    đỏ trứng tươi: chờ quyết có cần câu lưu ý không — để false.
--
-- CHẠY TRÊN DATABASE KHÔNG CÒN ĐÚNG SEED
--
-- Project Beeftown-thu có thể đã chạy web/THUC-DON.md bản cũ (F01, F03, D09,
-- D02 đã công bố với mô tả viết cho TÊN CŨ). Vì vậy 21 dòng cũ được đưa hẳn về
-- trạng thái của danh mục mới: 'nhap', mô tả và cảnh báo null, giá và độ cay
-- đã duyệt (nếu có) bỏ. Không làm vậy thì "Tartare bò hoa tuyết" sẽ hiện trên
-- trang với câu mô tả của "Bò sống trộn kiểu Hàn".
--
-- CHỈ CHẠY MỘT LẦN, CẢ FILE, TRƯỚC MỌI KHỐI CỦA web/THUC-DON.md (SQL Editor:
-- dán cả file — một giao dịch). Chạy xong: `npm run doi-chieu` phải báo KHỚP
-- (nó thấy view đổi), và khối "kiem-danh-muc" của web/THUC-DON.md phải ra đúng
-- 17 nhóm · 42 món · 10 món thu hồi (đối chiếu không đọc dữ liệu). Số lệch thì
-- hỏi lại, đừng chạy lại file này để "chữa".
--
-- Mục 2 đặt lại MỌI cột của 42 món về đúng cuốn: 'nhap', mô tả và cảnh báo null,
-- giá và độ cay đã duyệt bỏ, tên ba thứ tiếng về chữ của cuốn. Chạy lại sau khi
-- đã làm tiếp theo web/THUC-DON.md là xóa sạch phần đã làm. Nên mục 0 CHẶN:
-- database đã có món mã mới của file này (F19–F23, D13–D28 — tức file đã chạy)
-- MÀ một trong 42 món đã công bố, đã duyệt giá, đã duyệt độ cay, đã có mô tả hay
-- câu cảnh báo → raise exception, cả file không chạy, không dòng nào đổi.
-- Khối chặn KHÔNG thấy tên sửa tay (vd. người đọc tiếng Hàn sửa ten_ko): sửa tên
-- rồi thì cũng không chạy lại file này. Muốn đổi danh mục: viết migration mới.
-- Lần đầu (kể cả trên Beeftown-thu đã công bố theo bản cũ — chưa có món mã mới)
-- và lần chạy lại ngay sau lần đầu (chưa làm gì thêm) vẫn chạy được, dữ liệu ra
-- y như lần đầu.
-- =============================================================================


-- =============================================================================
-- 0 · CHẶN CHẠY LẠI KHI THỰC ĐƠN ĐÃ ĐƯỢC LÀM TIẾP
-- =============================================================================
-- Câu raise có bản tiếng Anh ở web/src/lib/cau-noi-bo.ts (test-noi-bo-tieng-anh).
-- detail liệt kê từng món và lý do, để người chạy biết vì sao bị chặn.
-- -----------------------------------------------------------------------------
do $$
declare
  v_mon text;
begin
  -- Chưa có món mã mới của file này → lần chạy đầu: không chặn gì.
  if not exists (
    select 1 from mon_an
    where ma in ('F19', 'F20', 'F21', 'F22', 'F23', 'D13', 'D14', 'D15', 'D16', 'D17', 'D18',
                 'D19', 'D20', 'D21', 'D22', 'D23', 'D24', 'D25', 'D26', 'D27', 'D28')) then
    return;
  end if;

  select string_agg(m.ma || ': ' || concat_ws(', ',
           case when m.trang_thai = 'da_cong_bo' then 'đã công bố' end,
           case when m.gia_da_duyet then 'giá đã duyệt' end,
           case when m.muc_cay_da_duyet then 'độ cay đã duyệt' end,
           case when m.mo_ta_vi is not null then 'đã có mô tả' end,
           case when m.canh_bao is not null then 'đã có câu cảnh báo' end), ' · ' order by m.ma)
    into v_mon
  from mon_an m
  where m.ma in ('S01', 'F03', 'F19', 'F15', 'F16', 'F20', 'F21', 'F01', 'F10', 'F22', 'F23',
                 'F18', 'F12', 'F14', 'F13', 'F06', 'F05', 'F04', 'F11', 'F08', 'F07', 'F09',
                 'D13', 'D01', 'D14', 'D02', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21',
                 'D09', 'D22', 'D10', 'D23', 'D24', 'D25', 'D26', 'D27', 'D28')
    and (m.trang_thai = 'da_cong_bo' or m.gia_da_duyet or m.muc_cay_da_duyet
         or m.mo_ta_vi is not null or m.canh_bao is not null);

  if v_mon is not null then
    raise exception 'Thực đơn đã có món công bố, giá hoặc độ cay đã duyệt, hoặc mô tả đã ghi: chạy lại 0094 sẽ xóa hết. Không chạy lại file này.'
      using errcode = 'restrict_violation',
            detail  = v_mon,
            hint    = 'Sửa từng món bằng câu update riêng (web/THUC-DON.md), đổi danh mục thì viết migration mới.';
  end if;
end
$$;


-- =============================================================================
-- 1 · NHÓM MÓN — 17 nhóm của cuốn
-- =============================================================================
-- Cột cuối (khong_niem_yet_gia) chỉ dùng khi THÊM nhóm mới; nhóm đã có giữ
-- nguyên cờ của nó (bo-tai-quay vẫn không niêm yết giá). Thứ tự = thứ tự trang
-- của cuốn; trang Thực đơn xếp theo cột này.
-- -----------------------------------------------------------------------------
insert into nhom_mon (ma, ten_vi, ten_en, ten_ko, loai, thu_tu, khong_niem_yet_gia)
select d.ma, d.ten_vi, d.ten_en, d.ten_ko, d.loai::loai_nhom_mon, d.thu_tu::smallint, d.khong_niem_yet_gia
from (values
  ('goi-them', 'Gọi thêm tùy chọn', 'Add-ons', '추가 메뉴', 'goi_them', 3, false),
  ('bo-tai-quay', 'Bò tại quầy', 'Beef at the Counter', '정육 코너', 'thit_bo', 4, true),
  ('dac-trung', 'Món đặc trưng', 'Signature', '시그니처 메뉴', 'khai_vi', 5, false),
  ('lau', 'Lẩu', 'Hot pot', '전골', 'mon_chinh', 6, false),
  ('salad', 'Salad', 'Salads', '샐러드', 'khai_vi', 7, false),
  ('mon-them', 'Món thêm', 'Sides', '사이드 메뉴', 'khai_vi', 8, false),
  ('canh', 'Canh', 'Stews', '찌개', 'mon_chinh', 9, false),
  ('com', 'Cơm', 'Rice', '밥', 'mon_chinh', 10, false),
  ('mi-y', 'Mì', 'Noodles & pasta', '면·파스타', 'mon_chinh', 11, false),
  ('do-uong-signature', 'Signature', 'Signature drinks', '시그니처 드링크', 'do_uong', 12, false),
  ('highball', 'Highball', 'Highball', '하이볼', 'do_uong', 13, false),
  ('bia', 'Bia', 'Beer', '맥주', 'do_uong', 14, false),
  ('soju', 'Soju', 'Soju', '소주', 'do_uong', 15, false),
  ('makgeolli', 'Makgeolli', 'Makgeolli', '막걸리', 'do_uong', 16, false),
  ('khong-con', 'Nước ép & ade', 'Juice & ade', '주스·에이드', 'do_uong', 17, false),
  ('nuoc-ngot', 'Nước ngọt', 'Soft drinks', '탄산음료', 'do_uong', 18, false),
  ('nuoc-suoi', 'Nước suối', 'Water', '생수', 'do_uong', 19, false)
) as d(ma, ten_vi, ten_en, ten_ko, loai, thu_tu, khong_niem_yet_gia)
on conflict (ma) do update set
  ten_vi    = excluded.ten_vi,
  ten_en    = excluded.ten_en,
  ten_ko    = excluded.ten_ko,
  loai      = excluded.loai,
  thu_tu    = excluded.thu_tu,
  dang_dung = true;

-- Ba nhóm không còn món nào: F10 sang salad, F11 sang mi-y, F18 sang mon-them;
-- F17 và ba ly cocktail thu hồi ở mục 3. Tắt, không xóa — thuc_don_cong_khai()
-- và v_viec_dich đều bỏ qua nhóm đã tắt.
update nhom_mon set dang_dung = false
where ma in ('mien-mi', 'trang-mieng', 'cocktail');


-- =============================================================================
-- 2 · MÓN — 42 món của cuốn, theo thứ tự trang
-- =============================================================================
-- Mỗi món năm dòng:
--   (mã, nhóm, thứ tự, tên vi, tên en, tên ko,
--    mô tả tiếng Việt của cuốn → copy_nhap,
--    mô tả tiếng Anh của cuốn → nguyen_van_nguon,
--    điều còn chờ xác nhận → can_xac_nhan,
--    có cồn, món sống, độ cay ĐỀ XUẤT, giá ĐỀ XUẤT, trang của cuốn)
--
-- left join: gõ sai mã nhóm thì nhom_mon_id null → NOT NULL từ chối cả file,
-- không lặng lẽ bỏ sót món.
-- -----------------------------------------------------------------------------
insert into mon_an (ma, nhom_mon_id, thu_tu, ten_vi, ten_en, ten_ko,
                    copy_nhap, nguyen_van_nguon, can_xac_nhan,
                    co_con, la_mon_song, muc_cay_de_xuat, gia_de_xuat, trang_in)
select d.ma, g.id, d.thu_tu::smallint, d.ten_vi, d.ten_en, d.ten_ko,
       d.copy_nhap, d.nguyen_van_nguon, d.can_xac_nhan,
       d.co_con, d.la_mon_song, d.muc_cay_de_xuat::smallint, d.gia_de_xuat::bigint, d.trang_in::smallint
from (values
  ('S01', 'goi-them', 10, 'Set 4 sốt', 'Signature set', '시그니처 소스 4종 세트',
   '4 sốt hâm nóng ngay trên vỉ: phô mai, tare, ssamjang, sốt cay Tứ Xuyên. Kèm kimchi nhà làm và rau cuốn. Thêm 1 lần.',
   'Four sauces, served warm on the grill: cheese, tare, ssamjang and Sichuan chili. With house kimchi and wrap greens. One refill.',
   '69.000đ tính theo người hay theo bàn; "Thêm 1 lần" (Sang xác nhận). Bếp xác nhận kimchi nhà làm.',
   false, false, 0, 69000, 8),
  ('F03', 'dac-trung', 10, 'Tartare bò hoa tuyết', 'Snow flower flank tartare', '눈꽃치즈 소고기 타르타르',
   'Nạm có thớ rõ, vị bò đậm, dai vừa. Thịt tươi xếp như cánh hoa, phủ phô mai Grana Padano hoặc Parmigiano bào mịn như tuyết. Trộn lòng đỏ trứng với gia vị Hàn mặn ngọt. Vị mặn của phô mai, độ béo của lòng đỏ làm tròn vị bò.',
   'Flank, for its clear grain and deep beef flavour, arranged like petals under grated Grana Padano or Parmigiano. Mix in the yolk and our sweet-savoury Korean seasoning.',
   'Sang xác nhận phần thịt (nạm) và nguồn trứng dùng sống; phô mai là Grana Padano hay Parmigiano.',
   false, true, 0, null, null),
  ('F19', 'dac-trung', 20, 'Cơm trộn tartare bò cay', 'Spicy flank tartare rice bowl', '매콤 육회비빔밥',
   'Nạm, phần cắt có ít trên mỗi con bò, cùng rau củ giòn theo mùa và sốt cay riêng của Beeftown. Trộn đều bò, sốt và cơm: một bát bibimbap tươi, cay dịu, làm vị bò rõ hơn.',
   'Flank, a cut each animal yields little of, with crisp seasonal vegetables and our own spicy sauce. Mix it through the rice, a fresh take on bibimbap.',
   'Sang xác nhận phần thịt (nạm) và nguồn trứng dùng sống.',
   false, true, 2, null, null),
  ('F15', 'lau', 10, 'Lẩu kim chi', 'Kimchi hot pot', '김치전골',
   'Nấu từ kimchi nhà làm, với thịt heo, đậu hũ và nấm. Nước dùng chua, cay.',
   'Made with our house kimchi, pork, tofu and mushrooms. Sour, spicy broth.',
   'Bếp xác nhận nấu từ kimchi nhà làm. Lẩu chỉ bán buổi trưa theo combo: giờ trưa chờ Sang xác nhận.',
   false, false, 2, null, 7),
  ('F16', 'lau', 20, 'Lẩu bò bulgogi', 'Bulgogi hot pot', '불고기전골',
   'Bò thái mỏng ướp bulgogi, miến, nấm. Nước dùng ngọt thanh.',
   'Thin-sliced bulgogi beef in a light, sweet broth.',
   'Lẩu chỉ bán buổi trưa theo combo: giờ trưa chờ Sang xác nhận.',
   false, false, 0, null, 7),
  ('F20', 'lau', 30, 'Lẩu nấm', 'Mushroom hot pot', '버섯전골',
   'Nhiều loại nấm tươi, đậu hũ, cải thảo. Nước dùng thanh.',
   'Assorted fresh mushrooms in a light broth.',
   'Lẩu chỉ bán buổi trưa theo combo: giờ trưa chờ Sang xác nhận.',
   false, false, 0, null, 7),
  ('F21', 'salad', 10, 'Salad nấm', 'Grilled mushroom salad', '구운 버섯 샐러드',
   'Nấm nướng trên rau xanh, sốt mè. Ăn xen với bò cho đỡ ngán.',
   'Grilled mushrooms on fresh greens with sesame dressing.',
   null,
   false, false, 0, null, 9),
  ('F01', 'salad', 20, 'Caesar salad', 'Caesar salad', '시저 샐러드',
   'Xà lách romaine, bánh mì nướng giòn, phô mai bào, sốt Caesar.',
   'Romaine, croutons, shaved parmesan and Caesar dressing.',
   null,
   false, false, 0, null, 9),
  ('F10', 'salad', 30, 'Miến trộn Hàn', 'Hot plate japchae', '철판 잡채',
   'Miến xào với bò và rau củ, dọn trên chảo gang nóng.',
   'Glass noodles stir-fried with beef and vegetables, on a sizzling plate.',
   null,
   false, false, 0, null, 9),
  ('F22', 'mon-them', 10, 'Trứng hấp núi lửa', 'Bomb egg soufflé', '폭탄 계란찜',
   'Trứng hấp trong thố đá, phồng cao, mềm và nóng.',
   'Fluffy steamed egg, served hot in a stone pot.',
   null,
   false, false, 0, null, 10),
  ('F23', 'mon-them', 20, 'Khoai tây chiên sốt bò', 'Beef chili fries', '비프 칠리 프라이',
   'Khoai tây chiên giòn, phủ sốt bò bằm và sốt phô mai.',
   'Crispy fries topped with minced beef sauce and cheese sauce.',
   null,
   false, false, 1, null, 10),
  ('F18', 'mon-them', 30, 'Bánh gạo chiên phô mai', 'Fried injeolmi rice cake', '치즈 인절미 튀김',
   'Vỏ giòn, nhân phô mai kéo sợi, rắc bột đậu nành rang.',
   'Crispy outside, stretchy cheese inside, dusted with roasted soybean powder.',
   'Claude ghép "Injeolmi Cheese" (bảng nội dung 06/10, nhóm tráng miệng) với "Bánh gạo chiên phô mai / Fried injeolmi rice cake" của cuốn — Sang xác nhận đúng là một món.',
   false, false, 0, null, 10),
  ('F12', 'canh', 10, 'Canh kim chi', 'Kimchi jjigae', '김치찌개',
   'Nấu từ kimchi nhà làm, thịt heo, đậu hũ. Chua, cay.',
   'House kimchi, pork and tofu. Sour and spicy.',
   'Bếp xác nhận nấu từ kimchi nhà làm.',
   false, false, 2, null, 11),
  ('F14', 'canh', 20, 'Đậu phụ hầm', 'Sundubu jjigae', '순두부찌개',
   'Đậu hũ non mềm trong nước dùng cay, nóng.',
   'Silky soft tofu in a hot, spicy broth.',
   null,
   false, false, 2, null, 11),
  ('F13', 'canh', 30, 'Canh tương đậu', 'Doenjang jjigae', '된장찌개',
   'Tương đậu nành, đậu hũ và rau củ. Vị đậm.',
   'Soybean paste with tofu and vegetables. Rich and savoury.',
   null,
   false, false, 1, null, 11),
  ('F06', 'com', 10, 'Cơm kim chi bò', 'Beef kimchi fried rice', '소고기 김치볶음밥',
   'Cơm rang kimchi nhà làm với bò, trứng ốp la.',
   'Fried rice with house kimchi and beef, topped with a fried egg.',
   'Bếp xác nhận nấu từ kimchi nhà làm.',
   false, false, 1, null, 12),
  ('F05', 'com', 20, 'Cơm trộn Hàn', 'Bibimbap', '비빔밥',
   'Cơm, rau trộn, bò, trứng. Trộn cùng tương ớt.',
   'Rice with vegetables, beef and egg. Mix in the chili paste.',
   null,
   false, false, 1, null, 12),
  ('F04', 'com', 30, 'Cơm trộn trứng cá', 'Cheese al-bap', '치즈 알밥',
   'Cơm bát đá nóng, phô mai, trứng cá, rau củ giòn.',
   'Hot stone-bowl rice with cheese, fish roe and crunchy vegetables.',
   null,
   false, false, 0, null, 12),
  ('F11', 'mi-y', 10, 'Mì lạnh cay', 'Signature spicy cold noodles', '시그니처 매운 냉면',
   'Mì lạnh sốt cay, nước dùng đá. Kèm cơm, khoảng 70% chén thường.',
   'Spicy cold noodles with icy broth. With rice, about 70% of a regular bowl.',
   'Sang xác nhận câu "Kèm cơm, khoảng 70% chén thường".',
   false, false, 3, null, 13),
  ('F08', 'mi-y', 20, 'Mì Toowoomba', 'Toowoomba pasta', '투움바 파스타',
   'Tôm và nấm trong sốt kem, cay nhẹ ở hậu vị.',
   'Shrimp and mushrooms in a creamy sauce with a gentle heat.',
   null,
   false, false, 1, null, 13),
  ('F07', 'mi-y', 30, 'Mì carbonara', 'Carbonara pasta', '카르보나라 파스타',
   'Sốt trứng và phô mai, thêm lòng đỏ tươi.',
   'Egg and cheese sauce, finished with a fresh yolk.',
   'Có lòng đỏ trứng tươi: quyết món này có cần câu lưu ý như món sống không (điểm rà soát menu 11/10). la_mon_song để false cho tới khi quyết.',
   false, false, 0, null, 13),
  ('F09', 'mi-y', 40, 'Mì bò sốt cà', 'Beef tomato pasta', '비프 토마토 파스타',
   'Sốt cà chua nấu với bò bằm.',
   'Minced beef simmered in a rich tomato sauce.',
   null,
   false, false, 0, null, 13),
  ('D13', 'do-uong-signature', 10, 'Milky Cloud Makgeolli', 'Milky Cloud Makgeolli', '밀키 클라우드 막걸리',
   'Makgeolli sữa. Makgeolli, sữa, kẹo cứng nghiền.',
   'Makgeolli, milk, crushed hard candy.',
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026). Tên tạm.',
   true, false, null, 69000, 14),
  ('D01', 'do-uong-signature', 20, 'Strawberry Crush', 'Strawberry Crush', '스트로베리 크러시',
   'Highball dâu. Siro dâu, soda, whisky, dâu sấy.',
   'Strawberry syrup, soda, whisky, dried strawberry.',
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   true, false, null, 69000, 14),
  ('D14', 'do-uong-signature', 30, 'Berry Rouge Highball', 'Berry Rouge Highball', '베리 루즈 하이볼',
   'Highball quả mọng. Hương quả mọng, chua nhẹ, ngọt dịu.',
   'Deep berry, bright acidity, soft sweetness.',
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026). Tên tạm; chưa có thành phần.',
   true, false, null, 69000, 14),
  ('D02', 'highball', 10, 'Highball cổ điển', 'Classic highball', '클래식 하이볼',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   true, false, null, null, 14),
  ('D15', 'highball', 20, 'Highball chanh', 'Lemon highball', '레몬 하이볼',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   true, false, null, null, 14),
  ('D16', 'bia', 10, 'Bia tươi', 'Draft beer', '생맥주',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   true, false, null, null, 14),
  ('D17', 'bia', 20, 'Bia chai', 'Bottled beer', '병맥주',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   true, false, null, null, 14),
  ('D18', 'soju', 10, 'Soju truyền thống', 'Original soju', '오리지널 소주',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   true, false, null, null, 14),
  ('D19', 'soju', 20, 'Soju nho xanh', 'Green grape soju', '청포도 소주',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   true, false, null, null, 14),
  ('D20', 'soju', 30, 'Soju mận', 'Plum soju', '자두 소주',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   true, false, null, null, 14),
  ('D21', 'makgeolli', 10, 'Makgeolli truyền thống', 'Original makgeolli', '오리지널 막걸리',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   true, false, null, null, 14),
  ('D09', 'khong-con', 10, 'Nước cam', 'Orange juice', '오렌지 주스',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   false, false, null, null, 15),
  ('D22', 'khong-con', 20, 'Nước xoài', 'Mango juice', '망고 주스',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   false, false, null, null, 15),
  ('D10', 'khong-con', 30, 'Ade chanh', 'Lemon ade', '레몬에이드',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   false, false, null, null, 15),
  ('D23', 'khong-con', 40, 'Ade chanh dây', 'Passion fruit ade', '패션프루트에이드',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   false, false, null, null, 15),
  ('D24', 'nuoc-ngot', 10, 'Cola', 'Cola', '콜라',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   false, false, null, null, 15),
  ('D25', 'nuoc-ngot', 20, 'Cola không đường', 'Zero cola', '제로 콜라',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   false, false, null, null, 15),
  ('D26', 'nuoc-ngot', 30, 'Soda chanh', 'Lemon-lime soda', '사이다',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   false, false, null, null, 15),
  ('D27', 'nuoc-suoi', 10, 'Nước suối', 'Still water', '생수',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   false, false, null, null, 15),
  ('D28', 'nuoc-suoi', 20, 'Nước có ga', 'Sparkling water', '탄산수',
   null,
   null,
   'Danh mục, nhãn hiệu, dung tích: chờ chốt (cuốn menu 11/10/2026).',
   false, false, null, null, 15)
) as d(ma, nhom, thu_tu, ten_vi, ten_en, ten_ko,
       copy_nhap, nguyen_van_nguon, can_xac_nhan,
       co_con, la_mon_song, muc_cay_de_xuat, gia_de_xuat, trang_in)
left join nhom_mon g on g.ma = d.nhom
on conflict (ma) do update set
  nhom_mon_id      = excluded.nhom_mon_id,
  thu_tu           = excluded.thu_tu,
  ten_vi           = excluded.ten_vi,
  ten_en           = excluded.ten_en,
  ten_ko           = excluded.ten_ko,
  copy_nhap        = excluded.copy_nhap,
  nguyen_van_nguon = excluded.nguyen_van_nguon,
  can_xac_nhan     = excluded.can_xac_nhan,
  co_con           = excluded.co_con,
  la_mon_song      = excluded.la_mon_song,
  muc_cay_de_xuat  = excluded.muc_cay_de_xuat,
  gia_de_xuat      = excluded.gia_de_xuat,
  trang_in         = excluded.trang_in,
  shot_id          = null,
  -- Dòng cũ về hẳn trạng thái của danh mục mới (xem đầu file, "CHẠY TRÊN
  -- DATABASE KHÔNG CÒN ĐÚNG SEED"). Trên database thật các cột này vốn đã
  -- đúng như vậy, nên ở đó đây là câu không đổi gì.
  trang_thai       = 'nhap',
  cong_bo_luc      = null,
  mo_ta_vi         = null,
  mo_ta_en         = null,
  mo_ta_ko         = null,
  canh_bao         = null,
  canh_bao_en      = null,
  canh_bao_ko      = null,
  gia              = null,
  gia_da_duyet     = false,
  gia_nguoi_duyet  = null,
  gia_duyet_luc    = null,
  muc_cay          = null,
  muc_cay_da_duyet = false;


-- =============================================================================
-- 3 · MƯỜI MÓN KHÔNG CÓ TRONG CUỐN — thu hồi, không xóa
-- =============================================================================
-- F02 Salad bò nướng · F17 Kem · D03–D05 Makgeolli dứa / đào / yuzu ·
-- D06 Beeftown Mule · D07 Yuzu Gin Tonic · D08 Itaewon Sunset ·
-- D11 Grapefruit Ade · D12 Nước ép dứa.
--
-- Chỉ đổi trạng thái và ghi lý do. Tên, bản nháp, câu nguồn, mã ảnh của bảng
-- 17/09 giữ nguyên để truy vết. thuc_don_cong_khai() chỉ trả món 'da_cong_bo'
-- nên món thu hồi không có đường lên trang, kể cả khi mọi công tắc đều bật.
-- -----------------------------------------------------------------------------
update mon_an set
  trang_thai   = 'da_thu_hoi',
  can_xac_nhan = 'Không có trong thực đơn chốt 11/10/2026 (cuốn menu bản sáng).'
where ma in ('F02', 'F17', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D11', 'D12');


-- =============================================================================
-- 4 · SỔ BẢN DỊCH — tên ba thứ tiếng là chữ của cuốn, máy không dịch đè
-- =============================================================================
-- Trigger ghi_so_ban_dich (0036) chỉ ghi "bản tay của câu gốc hiện tại" khi ô
-- dịch ĐỔI. Một ô dịch giữ nguyên chữ trong khi tên tiếng Việt đổi thì sổ vẫn
-- mang băm của tên CŨ, v_viec_dich coi là "bản dịch của câu cũ", và lần tới có
-- người mở /noi-bo máy sẽ dịch đè. Chuyện đó xảy ra thật khi máy đã dịch tên
-- tiếng Hàn từ trước: "Canh đậu hũ non" → "순두부찌개", nay tên Việt là "Đậu phụ
-- hầm" còn tên Hàn của cuốn vẫn là "순두부찌개" — ô không đổi, sổ lệch, máy dịch
-- lại "Đậu phụ hầm" thành một món khác.
--
-- Nên ghi sổ tường minh, như mục 3 của 0036: bản tay, của đúng tên tiếng Việt
-- đang có. Điều kiện where làm câu này không đụng dòng mà sổ đã đúng.
-- -----------------------------------------------------------------------------
update mon_an m
   set ban_dich = jsonb_set(m.ban_dich, '{ten}', jsonb_build_object(
         'en', jsonb_build_object('bam', bam_nguon(m.ten_vi), 'cach', 'tay', 'tt', 'ok', 'luc', now()),
         'ko', jsonb_build_object('bam', bam_nguon(m.ten_vi), 'cach', 'tay', 'tt', 'ok', 'luc', now())))
 where m.ma in (
         'S01', 'F03', 'F19', 'F15', 'F16', 'F20', 'F21', 'F01', 'F10', 'F22', 'F23',
         'F18', 'F12', 'F14', 'F13', 'F06', 'F05', 'F04', 'F11', 'F08', 'F07', 'F09',
         'D13', 'D01', 'D14', 'D02', 'D15', 'D16', 'D17', 'D18', 'D19', 'D20', 'D21',
         'D09', 'D22', 'D10', 'D23', 'D24', 'D25', 'D26', 'D27', 'D28')
   and (   m.ban_dich #>> '{ten,en,bam}'  is distinct from bam_nguon(m.ten_vi)
        or m.ban_dich #>> '{ten,en,cach}' is distinct from 'tay'
        or m.ban_dich #>> '{ten,en,tt}'   is distinct from 'ok'
        or m.ban_dich #>> '{ten,ko,bam}'  is distinct from bam_nguon(m.ten_vi)
        or m.ban_dich #>> '{ten,ko,cach}' is distinct from 'tay'
        or m.ban_dich #>> '{ten,ko,tt}'   is distinct from 'ok');

update nhom_mon g
   set ban_dich = jsonb_set(g.ban_dich, '{ten}', jsonb_build_object(
         'en', jsonb_build_object('bam', bam_nguon(g.ten_vi), 'cach', 'tay', 'tt', 'ok', 'luc', now()),
         'ko', jsonb_build_object('bam', bam_nguon(g.ten_vi), 'cach', 'tay', 'tt', 'ok', 'luc', now())))
 where g.dang_dung
   and (   g.ban_dich #>> '{ten,en,bam}'  is distinct from bam_nguon(g.ten_vi)
        or g.ban_dich #>> '{ten,en,cach}' is distinct from 'tay'
        or g.ban_dich #>> '{ten,en,tt}'   is distinct from 'ok'
        or g.ban_dich #>> '{ten,ko,bam}'  is distinct from bam_nguon(g.ten_vi)
        or g.ban_dich #>> '{ten,ko,cach}' is distinct from 'tay'
        or g.ban_dich #>> '{ten,ko,tt}'   is distinct from 'ok');


-- =============================================================================
-- 5 · MÓN CÒN VƯỚNG GÌ — bỏ món đã thu hồi và món thuộc nhóm đã tắt
-- =============================================================================
-- Thân view chép nguyên văn 0011 (chưa file nào sau 0011 thay view này), chỉ
-- đổi mệnh đề where:
--     trước: m.trang_thai <> 'da_cong_bo'
--     nay:   m.trang_thai not in ('da_cong_bo', 'da_thu_hoi') and g.dang_dung
--
-- Vì sao sửa view mà không chỉ lọc ở câu SQL của hướng dẫn: trang Tổng quan
-- /noi-bo đọc THẲNG view này (web/src/pages/noi-bo/index.astro) và đếm mọi dòng
-- có vuong_gi khác 'Sẵn sàng công bố' là "món còn vướng". 10 món thu hồi không
-- có mô tả nên sẽ bị đếm mãi, và dòng việc "Thực đơn" không bao giờ xanh.
--
-- Hệ quả cần biết: món bị gỡ khẩn cấp bằng SQL thu hồi của web/THUC-DON.md cũng
-- rời danh sách này (trước đây nó hiện là 'Sẵn sàng công bố'). Món đã thu hồi
-- không còn "vướng" gì — muốn đưa lại thì chạy lại khối công bố của nhóm đó.
--
-- create or replace giữ nguyên chủ và quyền của view. Danh sách cột, tên cột,
-- thứ tự cột KHÔNG đổi (Postgres cũng không cho đổi bằng create or replace).
-- PHẢI viết lại with (security_invoker = true): create or replace mà thiếu mệnh
-- đề with thì Postgres xóa tùy chọn cũ, view quay về chạy dưới quyền chủ và đi
-- vòng qua RLS của mon_an (test-an-toan.mjs kiểm mọi view).
-- -----------------------------------------------------------------------------
create or replace view v_mon_con_vuong with (security_invoker = true) as
select
  m.ma,
  m.ten_vi,
  g.ten_vi as nhom,
  m.trang_thai,
  m.can_xac_nhan,
  case
    when la_van_ban_tam(m.mo_ta_vi)                       then 'Chưa có mô tả'
    when m.la_mon_song and la_van_ban_tam(m.canh_bao)     then 'Món sống nhưng chưa có cảnh báo'
    when m.gia_de_xuat is not null and not m.gia_da_duyet         then 'Giá chưa được duyệt'
    when m.muc_cay_de_xuat is not null and not m.muc_cay_da_duyet then 'Mức cay chưa được duyệt'
    else 'Sẵn sàng công bố'
  end as vuong_gi
from mon_an m
join nhom_mon g on g.id = m.nhom_mon_id
where m.trang_thai not in ('da_cong_bo', 'da_thu_hoi')
  and g.dang_dung
order by g.thu_tu, m.thu_tu;

-- File này không tạo hàm nào, không tạo bảng nào → không có khối chốt quyền.
