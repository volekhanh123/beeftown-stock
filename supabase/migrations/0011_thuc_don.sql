-- =============================================================================
-- BEEFTOWN CRM — 0011 · THỰC ĐƠN
-- 31 món · giá duyệt từng món · bò xem giá tại quầy
-- =============================================================================
-- NGUỒN DỮ LIỆU
--
-- Bảng nội dung menu v1 ngày 17/09/2026 (31 mục: 18 món ăn F01–F18, 12 đồ uống
-- D01–D12, 1 set sốt S01). File CSV gốc nằm ngoài repo và bị .gitignore chặn,
-- nên MIGRATION NÀY LÀ NGUỒN SỰ THẬT — không có bước sinh lại từ CSV, vì một
-- bước như vậy sẽ không tái lập được trên máy khác.
--
-- HAI ĐIỀU QUAN TRỌNG TRONG DỮ LIỆU GỐC
--
--   1. Cột "Giá duyệt" TRỐNG ở cả 31 dòng. Không một mức giá nào được duyệt.
--      Sáu mức giá đang hiển thị trên website nháp không có nguồn.
--   2. Bốn món còn ô mô tả dạng nháp — F07 Carbonara, F18 Injeolmi Cheese,
--      D10 Lemon Ade, D11 Grapefruit Ade. Chúng được giữ nguyên trong cột nội
--      bộ copy_nhap; la_van_ban_tam() đảm bảo chúng không thể công bố.
--
-- CỘT "NGUYÊN VĂN NGUỒN" KHÔNG ĐƯỢC DÙNG LÀM MÔ TẢ TIẾNG ANH. Nó chứa những
-- câu quảng cáo chưa kiểm chứng — "100% fresh orange" cho D09 (brief ghi rõ
-- không tự đưa claim 100% vào bản in), "Creamy, rich" cho một món Carbonara
-- chưa chốt công thức. Nó ở lại cột nội bộ; mo_ta_en bắt đầu từ null.
-- Song ngữ miễn phí với TÊN MÓN, không miễn phí với LỜI QUẢNG CÁO.
-- =============================================================================


create type loai_nhom_mon as enum (
  'khai_vi', 'mon_chinh', 'do_uong', 'goi_them', 'thit_bo'
);


-- =============================================================================
-- PHIÊN BẢN THỰC ĐƠN
-- =============================================================================
-- Yêu cầu WEBP23: "Ghi ngày/phiên bản cập nhật". Để con số đó nằm trong dữ
-- liệu thay vì gõ tay vào HTML — gõ tay thì nó sẽ đứng yên khi menu đổi.
-- =============================================================================
create table phien_ban_thuc_don (
  id            uuid primary key default gen_random_uuid(),
  ma            text not null unique,           -- 'v1.0'
  ngay_hieu_luc date not null,
  ghi_chu       text,
  dang_dung     boolean not null default false,
  nguoi_duyet   uuid references nhan_su(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- Đúng một phiên bản đang dùng.
create unique index phien_ban_dang_dung_idx
  on phien_ban_thuc_don((dang_dung)) where dang_dung;


-- =============================================================================
-- NHÓM MÓN
-- =============================================================================
create table nhom_mon (
  id       uuid primary key default gen_random_uuid(),
  ma       text not null unique,
  ten_vi   text not null,
  ten_en   text,
  loai     loai_nhom_mon not null,
  mo_ta_vi text,
  mo_ta_en text,
  thu_tu   smallint not null default 0,

  -- Bò được chọn TẠI QUẦY: khách xem trọng lượng và giá ngay trên nhãn khay.
  -- Đây là quyết định thương hiệu đã ghi nhận, không phải giải pháp tạm vì
  -- chưa có giá. Nhóm bật cờ này thì KHÔNG THỂ gán giá cho món bên trong.
  khong_niem_yet_gia boolean not null default false,

  dang_dung boolean not null default true
);

comment on column nhom_mon.khong_niem_yet_gia is
  'Nhóm không niêm yết giá trên web. Trigger chặn việc gán giá cho món thuộc nhóm này.';


-- =============================================================================
-- MÓN ĂN
-- =============================================================================
create table mon_an (
  id          uuid primary key default gen_random_uuid(),
  nhom_mon_id uuid not null references nhom_mon(id) on delete restrict,
  ma          text not null unique,        -- 'F01' … 'S01'
  thu_tu      smallint not null default 0,

  ten_vi   text,
  ten_en   text,
  mo_ta_vi text,
  mo_ta_en text,

  -- GIÁ — hai cột, không phải một cột kèm cờ.
  --
  -- gia_de_xuat: quản lý hoặc marketing điền thoải mái, kể cả khi món đã lên
  --   web. Đây là bản đề xuất đang chờ duyệt.
  -- gia: giá ĐÃ ĐƯỢC DUYỆT. Ràng buộc bên dưới khiến cột này chỉ có giá trị
  --   khi gia_da_duyet = true, nên "gia khác null" và "đã duyệt" là một.
  --
  -- Ban đầu thiết kế gộp làm một cột, và bài test bắt được ngay: một món đã
  -- công bố thì quản lý không đề xuất giá được nữa, vì ràng buộc lúc công bố
  -- đòi giá phải duyệt. Đề xuất giá là việc bình thường, không phải trạng
  -- thái sai — nên tách cột.
  gia_de_xuat     bigint,
  gia             bigint,
  gia_da_duyet    boolean not null default false,
  gia_nguoi_duyet uuid references nhan_su(id) on delete set null,
  gia_duyet_luc   timestamptz,

  -- Mức cay cùng khuôn: brief ghi "cay theo mô tả ảnh; mức chờ duyệt".
  muc_cay_de_xuat  smallint,
  muc_cay          smallint,
  muc_cay_da_duyet boolean not null default false,

  -- Nghĩa vụ pháp lý và an toàn, không phải thông tin trang trí.
  co_con      boolean not null default false,
  la_mon_song boolean not null default false,
  canh_bao    text,          -- bắt buộc khi la_mon_song, trước khi công bố
  khau_phan   text,          -- brief: "không tự ghi 2–4 người"
  di_ung      text[],

  -- ---- NỘI BỘ: không bao giờ ra tới website -------------------------------
  copy_nhap        text,   -- bản nháp mô tả, chờ biên tập
  nguyen_van_nguon text,   -- câu gốc trong brief, có thể chứa claim chưa kiểm
  can_xac_nhan     text,   -- điều gì đang chặn món này, để giao diện hiện ra
  shot_id          text,
  trang_in         smallint,
  -- -------------------------------------------------------------------------

  trang_thai   trang_thai_cong_bo not null default 'nhap',
  phien_ban_id uuid references phien_ban_thuc_don(id) on delete set null,
  nguoi_duyet  uuid references nhan_su(id) on delete set null,
  cong_bo_luc  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- "Có giá" và "đã duyệt giá" là MỘT. Không tồn tại trạng thái giá chưa
  -- duyệt nằm trong cột gia — nên hàm công khai không thể lỡ tay trả ra.
  constraint mon_an_gia_chi_khi_duyet check (
    (gia is not null) = gia_da_duyet and (gia is null or gia >= 0)),

  constraint mon_an_cay_chi_khi_duyet check (
    (muc_cay is not null) = muc_cay_da_duyet
    and (muc_cay is null or muc_cay between 0 and 3)),

  constraint mon_an_de_xuat_hop_le check (
    (gia_de_xuat is null or gia_de_xuat >= 0)
    and (muc_cay_de_xuat is null or muc_cay_de_xuat between 0 and 3)),

  -- Chốt chặn quyết định một món có được lên web hay không. Không cần nhắc
  -- tới giá nữa: ràng buộc bên trên đã khiến giá chưa duyệt không tồn tại.
  constraint mon_an_cong_bo_phai_sach check (
    trang_thai <> 'da_cong_bo' or (
          not la_van_ban_tam(ten_vi)
      and not la_van_ban_tam(mo_ta_vi)
      and (not la_mon_song or not la_van_ban_tam(canh_bao))))
);

create index mon_an_nhom_idx on mon_an(nhom_mon_id, thu_tu);
create index mon_an_cong_bo_idx on mon_an(trang_thai) where trang_thai = 'da_cong_bo';

create trigger mon_an_updated_at
  before update on mon_an
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table mon_an is
  'Món trong thực đơn. KHÔNG có chi_nhanh_id — dùng chung toàn thương hiệu, theo tiền lệ mau_tin ở 0006.';
comment on column mon_an.can_xac_nhan is
  'Điều gì đang chặn món này khỏi việc công bố. Nội bộ — để màn hình quản trị trả lời được "vì sao F07 chưa lên".';


-- -----------------------------------------------------------------------------
-- BÒ KHÔNG NIÊM YẾT GIÁ — cưỡng chế, không nhờ người nhớ
-- -----------------------------------------------------------------------------
-- Ràng buộc này phụ thuộc bảng nhom_mon nên không viết được bằng CHECK.
-- -----------------------------------------------------------------------------
create or replace function mon_an_kiem_tra_nhom()
returns trigger
language plpgsql
as $$
declare
  v_nhom nhom_mon;
begin
  select * into v_nhom from nhom_mon where id = new.nhom_mon_id;

  if v_nhom.khong_niem_yet_gia
     and (new.gia is not null or new.gia_da_duyet or new.gia_de_xuat is not null) then
    raise exception 'Nhóm % không niêm yết giá trên web — bò xem giá tại quầy', v_nhom.ten_vi
      using errcode = 'check_violation';
  end if;

  if new.trang_thai = 'da_cong_bo' and new.cong_bo_luc is null then
    new.cong_bo_luc := now();
  end if;

  return new;
end;
$$;

create trigger mon_an_kiem_tra_nhom_trigger
  before insert or update on mon_an
  for each row execute function mon_an_kiem_tra_nhom();


-- Giờ mon_an đã tồn tại, nối khóa ngoại còn thiếu từ 0009.
alter table tep_anh
  add constraint tep_anh_mon_an_fk
  foreign key (mon_an_id) references mon_an(id) on delete set null;


-- =============================================================================
-- THỰC ĐƠN CÔNG KHAI
-- =============================================================================
-- Mọi luật nằm trong thân hàm, không nằm ở phía gọi. Website không có cách
-- nào "quên" một luật, vì nó không được phép tự truy vấn bảng.
--
-- Danh sách cột trả về là danh sách TƯỜNG MINH — copy_nhap, nguyen_van_nguon,
-- can_xac_nhan, shot_id và trang_in KHÔNG THỂ lọt ra ngoài.
-- =============================================================================
create or replace function thuc_don_cong_khai(p_ngon_ngu text default 'vi')
returns table (
  nhom_ma     text,
  nhom_ten    text,
  nhom_loai   loai_nhom_mon,
  xem_gia_tai_quay boolean,
  mon_ma      text,
  ten         text,
  mo_ta       text,
  gia         bigint,
  muc_cay     smallint,
  co_con      boolean,
  la_mon_song boolean,
  canh_bao    text,
  khau_phan   text,
  phien_ban   text,
  cap_nhat_ngay date
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.ma,
    case when p_ngon_ngu = 'en' then coalesce(g.ten_en, g.ten_vi) else g.ten_vi end,
    g.loai,
    g.khong_niem_yet_gia,
    m.ma,
    case when p_ngon_ngu = 'en' then coalesce(m.ten_en, m.ten_vi) else m.ten_vi end,
    case when p_ngon_ngu = 'en' then coalesce(m.mo_ta_en, m.mo_ta_vi) else m.mo_ta_vi end,
    -- Thắt đai an toàn chồng lên CHECK: giá chưa duyệt thì trả về null, kể cả
    -- khi bằng cách nào đó một dòng sai lọt qua được ràng buộc.
    case when m.gia_da_duyet then m.gia end,
    case when m.muc_cay_da_duyet then m.muc_cay end,
    m.co_con,
    m.la_mon_song,
    m.canh_bao,
    m.khau_phan,
    pb.ma,
    pb.ngay_hieu_luc
  from nhom_mon g
  join mon_an m on m.nhom_mon_id = g.id
  left join phien_ban_thuc_don pb on pb.dang_dung
  where cong_tac_bat('hien_thuc_don')
    and g.dang_dung
    and m.trang_thai = 'da_cong_bo'
    -- Luật quảng cáo rượu bia có giới hạn riêng. Công tắc tắt thì ẩn đồ uống
    -- có cồn khỏi trang công khai, KHÔNG xóa dữ liệu.
    and (not m.co_con or cong_tac_bat('hien_do_uong_co_con'))
  order by g.thu_tu, m.thu_tu;
$$;

comment on function thuc_don_cong_khai is
  'Thực đơn cho website. Trả về rỗng khi công tắc hien_thuc_don chưa bật. Không bao giờ trả về giá chưa duyệt hay cột nội bộ.';


-- -----------------------------------------------------------------------------
-- MÓN CÒN VƯỚNG GÌ — cho màn hình quản trị
-- -----------------------------------------------------------------------------
create view v_mon_con_vuong with (security_invoker = true) as
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
where m.trang_thai <> 'da_cong_bo'
order by g.thu_tu, m.thu_tu;


-- =============================================================================
-- PHÂN QUYỀN
-- =============================================================================
alter table phien_ban_thuc_don enable row level security;
alter table nhom_mon           enable row level security;
alter table mon_an             enable row level security;

create policy phien_ban_doc on phien_ban_thuc_don
  for select using (co_phien_dang_nhap());
create policy phien_ban_sua on phien_ban_thuc_don
  for all using (co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]))
  with check (co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]));

create policy nhom_mon_doc on nhom_mon
  for select using (co_phien_dang_nhap());
create policy nhom_mon_sua on nhom_mon
  for all using (co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]))
  with check (co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]));

create policy mon_an_doc on mon_an
  for select using (co_phien_dang_nhap());
create policy mon_an_them on mon_an
  for insert with check (
    co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]));
create policy mon_an_sua on mon_an
  for update using (
    co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]));


-- =============================================================================
-- SEED — 13 nhóm, 31 món, tất cả ở trạng thái nháp
-- =============================================================================
-- Nhóm thứ 13 "Bò tại quầy" không có món nào và không niêm yết giá. Nó tồn
-- tại để website có chỗ đặt phần giải thích về bò, và để cờ khong_niem_yet_gia
-- trở thành một ràng buộc thật chứ không phải một ghi chú.
--
-- Mọi món: trang_thai = 'nhap', gia = null, gia_da_duyet = false,
-- mo_ta_vi = null. Nghĩa là ngay sau khi cài, bật công tắc hien_thuc_don lên
-- thì thực đơn công khai vẫn RỖNG — phải có người biên tập và duyệt từng món.
-- =============================================================================
insert into nhom_mon (ma, ten_vi, ten_en, loai, thu_tu, khong_niem_yet_gia) values
  ('salad', 'Salad & khai vị', 'Salads & Starters', 'khai_vi', 6, false),
  ('com', 'Cơm', 'Rice', 'mon_chinh', 7, false),
  ('mi-y', 'Mì Ý', 'Pasta', 'mon_chinh', 8, false),
  ('mien-mi', 'Miến & mì lạnh', 'Noodles', 'mon_chinh', 9, false),
  ('canh', 'Canh Hàn', 'Korean Stews', 'mon_chinh', 10, false),
  ('lau', 'Lẩu', 'Hot Pot', 'mon_chinh', 11, false),
  ('trang-mieng', 'Tráng miệng', 'Desserts', 'mon_chinh', 12, false),
  ('khong-con', 'Không cồn', 'Non-alcoholic', 'do_uong', 13, false),
  ('highball', 'Highball', 'Highball', 'do_uong', 14, false),
  ('makgeolli', 'Makgeolli', 'Makgeolli', 'do_uong', 14, false),
  ('cocktail', 'Cocktails', 'Cocktails', 'do_uong', 15, false),
  ('goi-them', 'Gọi thêm tùy chọn', 'Add-ons', 'goi_them', 3, false),
  ('bo-tai-quay', 'Bò tại quầy', 'Beef at the Counter', 'thit_bo', 4, true);

insert into mon_an (ma, nhom_mon_id, thu_tu, ten_vi, ten_en, copy_nhap,
                    nguyen_van_nguon, can_xac_nhan, co_con, la_mon_song,
                    shot_id, trang_in) values
  ('F01', (select id from nhom_mon where ma = 'salad'), 10,
   'Salad Caesar', 'Caesar Salad',
   'Xà lách romaine, sốt Caesar, phô mai Parmesan và bánh mì giòn.',
   'Crisp romaine, homemade caesar dressing, parmesan cheese, croutons.',
   'Xác nhận sốt và thành phần dị ứng theo công thức; không tự gắn chay.',
   false, false, 'P-F01', 6),
  ('F02', (select id from nhom_mon where ma = 'salad'), 20,
   'Salad bò nướng', 'Beef Salad',
   'Rau xanh dùng cùng bò nướng và sốt salad của Beeftown.',
   'Fresh greens with grilled beef, special dressing.',
   'Xác nhận loại sốt, lượng thịt và cách trình bày.',
   false, false, 'P-F02', 6),
  ('F03', (select id from nhom_mon where ma = 'salad'), 30,
   'Bò sống trộn kiểu Hàn', 'Yukhoe',
   'Bò sống trộn kiểu Hàn. Hỏi nhân viên về thành phần và cách dùng.',
   'Fresh beef, korean style. Simple. Pure. Delicious.',
   'Bắt buộc giữ chữ bò sống. Xác nhận trứng sống và thành phần thực tế.',
   false, true, 'P-F03', 6),
  ('F04', (select id from nhom_mon where ma = 'com'), 40,
   'Cơm trứng cá phô mai', 'Cheese Al-bap',
   'Cơm nóng kết hợp trứng cá và phô mai tan chảy.',
   'Hot rice, flying fish roe, melted cheese. A perfect bite.',
   'Ảnh ghi flying fish roe; xác nhận đúng nguyên liệu và bát phục vụ.',
   false, false, 'P-F04', 7),
  ('F05', (select id from nhom_mon where ma = 'com'), 50,
   'Cơm trộn bò Bulgogi', 'Bulgogi Bibimbap',
   'Bò Bulgogi cùng rau củ và sốt dùng với cơm trộn.',
   'Savory bulgogi with fresh vegetables and special sauce.',
   'Xác nhận thành phần, trứng, sốt và hướng dẫn trộn trước khi in.',
   false, false, 'P-F05', 7),
  ('F06', (select id from nhom_mon where ma = 'com'), 60,
   'Cơm chiên kimchi', 'Kimchi Fried Rice',
   'Cơm chiên cùng kimchi, mang vị đậm đà đặc trưng.',
   'Kimchi, rice, and bold flavor. Classic done right.',
   'Xác nhận topping, mức cay và có thịt hay không.',
   false, false, 'P-F06', 7),
  ('F07', (select id from nhom_mon where ma = 'mi-y'), 70,
   'Mì Ý Carbonara', 'Carbonara Pasta',
   '[Mô tả sau khi duyệt công thức]',
   'Creamy, rich, and full of flavor.',
   'Không suy có kem, bacon, trứng hay loại phô mai từ tên Carbonara hoặc tính từ Creamy; biên tập sau khi bếp chốt.',
   false, false, 'P-F07', 8),
  ('F08', (select id from nhom_mon where ma = 'mi-y'), 80,
   'Mì Ý Toowoomba', 'Toowoomba Pasta',
   'Mì Ý sốt kem cay, vị béo và cay kết hợp.',
   'Spicy cream, irresistible taste.',
   'Xác nhận tôm/thịt, loại sốt và mức cay; không suy nguyên liệu từ công thức phổ biến.',
   false, false, 'P-F08', 8),
  ('F09', (select id from nhom_mon where ma = 'mi-y'), 90,
   'Mì Ý sốt bò bằm', 'Bolognese Pasta',
   'Mì Ý cùng sốt bò bằm Bolognese đậm vị.',
   'Classic beef ragù, deep flavor.',
   'Xác nhận công thức và thành phần cần công bố.',
   false, false, 'P-F09', 8),
  ('F10', (select id from nhom_mon where ma = 'mien-mi'), 100,
   'Miến trộn Japchae', 'Japchae',
   'Miến kiểu Hàn kết hợp thịt bò và rau củ.',
   'Korean classic with beef and vegetables.',
   'Tài liệu cũ ghi hot-stone Japchae, ảnh là đĩa miến; xác nhận nóng/lạnh và dụng cụ phục vụ.',
   false, false, 'P-F10', 9),
  ('F11', (select id from nhom_mon where ma = 'mien-mi'), 110,
   'Mì lạnh trộn cay', 'Bibim Naengmyeon',
   'Mì lạnh trộn cay, sợi dai và cảm giác thanh mát.',
   'Spicy, chewy, refreshing.',
   'Xác nhận thành phần, mức cay và hướng dẫn dùng.',
   false, false, 'P-F11', 9),
  ('F12', (select id from nhom_mon where ma = 'canh'), 120,
   'Canh kimchi', 'Kimchi Jjigae',
   'Canh kimchi cay, đậm vị, dùng nóng.',
   'Deep, spicy, and comforting.',
   'Xác nhận thịt/protein và định lượng hiện hành; không suy toàn menu chỉ món này có heo.',
   false, false, 'P-F12', 10),
  ('F13', (select id from nhom_mon where ma = 'canh'), 130,
   'Canh tương đậu Hàn', 'Doenjang Jjigae',
   'Canh tương đậu với vị đậm đà đặc trưng.',
   'Savory soybean paste stew.',
   'Xác nhận nước dùng, thành phần và khẩu phần.',
   false, false, 'P-F13', 10),
  ('F14', (select id from nhom_mon where ma = 'canh'), 140,
   'Canh đậu hũ non', 'Sundubu Jjigae',
   'Đậu hũ non trong phần canh nóng, cay và đậm vị.',
   'Soft tofu, rich and spicy.',
   'Xác nhận protein, trứng, nước dùng và mức cay.',
   false, false, 'P-F14', 10),
  ('F15', (select id from nhom_mon where ma = 'lau'), 150,
   'Lẩu kimchi', 'Kimchi Jeongol',
   'Lẩu kimchi với thịt heo, dùng cùng nhau tại bàn.',
   'A generous pot of kimchi and pork.',
   'Nguồn ảnh ghi pork. Xác nhận phần thực tế và số người; không tự ghi 2–4 người.',
   false, false, 'P-F15', 11),
  ('F16', (select id from nhom_mon where ma = 'lau'), 160,
   'Lẩu bò Bulgogi', 'Bulgogi Jeongol',
   'Bò Bulgogi cùng rau củ trong nồi lẩu dùng chung.',
   'Savory beef, fresh vegetables, A hearty favorite.',
   'Xác nhận nước dùng, khẩu phần, số người và cách phục vụ.',
   false, false, 'P-F16', 11),
  ('F17', (select id from nhom_mon where ma = 'trang-mieng'), 170,
   'Kem', 'Ice Cream',
   'Kem dùng lạnh để khép lại bữa ăn.',
   'Cool. Creamy. Always a good idea.',
   'Cần chốt vị kem, số viên và cách phục vụ; không mặc định vị vanilla.',
   false, false, 'P-F17', 12),
  ('F18', (select id from nhom_mon where ma = 'trang-mieng'), 180,
   'Injeolmi Cheese', 'Injeolmi Cheese',
   '[Chờ mô tả cấu tạo món thực tế]',
   'Soft, chewy, and sweet. A Korean favorite.',
   'Không tự dịch thành bánh gạo nhân phô mai; cần xác nhận tên Việt, nguyên liệu và dạng phục vụ.',
   false, false, 'P-F18', 12),
  ('D01', (select id from nhom_mon where ma = 'highball'), 190,
   'Highball dâu', 'Strawberry Highball',
   'Dâu, whisky và soda trong một ly highball.',
   'Fresh strawberries, whisky, and soda.',
   'Xác nhận dung tích, công thức; có cồn.',
   true, false, 'P-D01', 14),
  ('D02', (select id from nhom_mon where ma = 'highball'), 200,
   'Highball cổ điển', 'Classic Highball',
   'Whisky, soda và chanh trong ly highball cổ điển.',
   'Whisky, soda, lemon. Simple. Perfect.',
   'Xác nhận dung tích và công thức; có cồn.',
   true, false, 'P-D02', 14),
  ('D03', (select id from nhom_mon where ma = 'makgeolli'), 210,
   'Makgeolli dứa', 'Pineapple Makgeolli',
   'Makgeolli kết hợp dứa, hương vị trái cây.',
   'Makgeolli, pineapple, fresh flavor.',
   'Không xếp vào nước trái cây không cồn.',
   true, false, 'P-D03', 14),
  ('D04', (select id from nhom_mon where ma = 'makgeolli'), 220,
   'Makgeolli đào', 'Peach Makgeolli',
   'Makgeolli kết hợp đào, vị dịu và êm.',
   'Makgeolli, peach, light and smooth.',
   'Xác nhận loại đào/syrup; không tự ghi ít cồn.',
   true, false, 'P-D04', 14),
  ('D05', (select id from nhom_mon where ma = 'makgeolli'), 230,
   'Makgeolli yuzu', 'Yuzu Makgeolli',
   'Makgeolli kết hợp yuzu, thơm hương cam chanh.',
   'Makgeolli, yuzu, refreshing and aromatic.',
   'Giữ tên yuzu; xác nhận nguyên liệu thật.',
   true, false, 'P-D05', 14),
  ('D06', (select id from nhom_mon where ma = 'cocktail'), 240,
   'Beeftown Mule', 'Beeftown Mule',
   'Vodka, ginger beer, chanh xanh và bạc hà.',
   'Tên gốc trong brief: "BeefTown Mule". Vodka, ginger beer, lime, fresh mint.',
   'Chuẩn hóa viết Beeftown theo brand; giữ nguyên bản gốc ở cột nguồn.',
   true, false, 'P-D06', 15),
  ('D07', (select id from nhom_mon where ma = 'cocktail'), 250,
   'Yuzu Gin Tonic', 'Yuzu Gin Tonic',
   'Gin, yuzu và tonic, thơm hương cam chanh.',
   'Gin, yuzu, tonic, fresh and citrusy.',
   'Không tự gọi yuzu là chanh vàng.',
   true, false, 'P-D07', 15),
  ('D08', (select id from nhom_mon where ma = 'cocktail'), 260,
   'Itaewon Sunset', 'Itaewon Sunset',
   'Rum, cam và grenadine trong một ly cocktail.',
   'Rum, orange, grenadine, a taste of the night.',
   'Giữ tên riêng; xác nhận nguyên liệu và dung tích.',
   true, false, 'P-D08', 15),
  ('D09', (select id from nhom_mon where ma = 'khong-con'), 270,
   'Nước cam', 'Fresh Orange Juice',
   'Nước cam dùng lạnh.',
   '100% fresh orange.',
   'Không tự đưa claim 100% vào bản in trước khi xác nhận công thức/đường/đá.',
   false, false, 'P-D09', 13),
  ('D10', (select id from nhom_mon where ma = 'khong-con'), 280,
   'Lemon Ade', 'Lemon Ade',
   '[Chờ xác nhận công thức để đặt tên Việt]',
   'Sweet, tangy, refreshing.',
   'Cần biết có soda/gas hay không; không tự dịch là nước ép chanh.',
   false, false, 'P-D10', 13),
  ('D11', (select id from nhom_mon where ma = 'khong-con'), 290,
   'Grapefruit Ade', 'Grapefruit Ade',
   '[Chờ xác nhận loại trái cây và công thức]',
   'Citrus burst.',
   'Cần xác nhận grapefruit thực tế và có gas; không tự gọi bưởi hồng/nước ép.',
   false, false, 'P-D11', 13),
  ('D12', (select id from nhom_mon where ma = 'khong-con'), 300,
   'Nước ép dứa', 'Pineapple Juice',
   'Nước ép dứa với hương vị trái cây nhiệt đới.',
   'Tropical and fresh.',
   'Xác nhận nguyên liệu, đường, đá và dung tích.',
   false, false, 'P-D12', 13),
  ('S01', (select id from nhom_mon where ma = 'goi-them'), 310,
   'Set sốt gọi thêm', '4 Sauces + Veggies + Kimchi',
   'Các loại sốt đặc biệt dùng cùng bò, kèm một phần rau và kimchi.',
   'Cheese Fondue; Japanese Tare Sauce; Korean Ssamjang; Spicy Chili Oil.',
   '69.000 VND là giá trên artwork/tham chiếu; giá cuối, thuế, khẩu phần, refill và ranh giới với món kèm sẵn cần chốt.',
   false, false, 'P-S01', 3);


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on all functions in schema public from public';
    execute 'revoke execute on all functions in schema public from anon';

    execute 'grant execute on function tao_dat_ban(text,text,text,date,time,smallint,text,text,boolean,text,text,text,text,inet) to anon';
    execute 'grant execute on function lich_trong_theo_ngay(uuid,date) to anon';
    execute 'grant execute on function so_ban_con_trong(uuid,date,time) to anon';
    execute 'grant execute on function noi_dung_cong_khai(text) to anon';
    execute 'grant execute on function thuc_don_cong_khai(text) to anon';
  end if;
end
$$;
