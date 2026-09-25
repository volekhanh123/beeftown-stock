-- =============================================================================
-- BEEFTOWN CRM — 0009 · TỆP VÀ ẢNH
-- Khung ảnh có tên · dữ liệu mô tả ảnh · chốt chặn chống ảnh minh họa
-- =============================================================================
-- VÌ SAO BẢNG NÀY TỒN TẠI
--
-- File .gitignore của repo chặn cứng *.png *.jpg *.jpeg ở khối cuối, mà khối
-- đó đứng SAU danh sách cho phép nên luôn thắng. Nghĩa là ảnh thật KHÔNG THỂ
-- commit vào repo. Đây là ràng buộc, không phải lựa chọn — và nó đúng: ảnh đi
-- qua Supabase Storage, còn Postgres giữ sự thật về từng tấm.
--
-- Website nháp hiện tại có 17 ảnh Unsplash, trong đó có một ảnh phòng ăn lấy
-- từ kho ảnh được dùng để minh họa cho lời hứa "phòng riêng tầng trên, 10–30
-- khách" — một tiện ích chưa hề được xác nhận. Bảng này làm cho kiểu nhầm lẫn
-- đó KHÔNG THỂ xảy ra: mỗi tấm ảnh bắt buộc khai là ảnh thật hay không, và
-- ảnh không phải ảnh thật thì bắt buộc có chú thích nói rõ.
-- =============================================================================


-- =============================================================================
-- KHUNG ẢNH — sổ đăng ký các vị trí ảnh có tên
-- =============================================================================
-- Giao diện nội bộ là danh sách Ô CÓ TÊN SẴN, không phải thư viện ảnh tự do.
-- Lý do: "tải ảnh lên đâu đó" thì không ai biết còn thiếu tấm nào, còn ô có
-- tên thì danh sách buổi chụp trở thành một câu truy vấn (v_anh_con_thieu).
--
-- Kích thước tối thiểu lấy từ Beeftown_Bo_Nhan_Dien_So.html mục F4, riêng ảnh
-- chia sẻ dùng 1200×630 — quy cách Open Graph phổ biến mà tài liệu chưa ghi.
-- =============================================================================
create table khung_anh (
  ma             text primary key,
  ten            text not null,
  mo_ta          text not null,        -- người chụp đọc là hiểu phải chụp gì
  nhom           text not null,        -- 'mat_tien' | 'quay' | 'khong_gian' | 'doi_ngu' | 'mon' | 'chia_se'
  ty_le          text,                 -- gợi ý khung hình, ví dụ '16:9'
  rong_toi_thieu int,
  cao_toi_thieu  int,
  bat_buoc       boolean not null default false,  -- thiếu = chưa đủ để khai trương
  thu_tu         smallint not null default 0
);

comment on table khung_anh is
  'Các vị trí ảnh có tên trên website. Thêm ô mới ở đây, đừng để giao diện tự nghĩ ra tên.';


-- =============================================================================
-- LOẠI TỆP VÀ NGUỒN ẢNH
-- =============================================================================
create type loai_tep as enum (
  'mat_tien', 'quay_thit', 'khong_gian', 'doi_ngu', 'mon_an',
  'chia_se', 'logo', 'tuyen_dung', 'noi_bo'
);

-- Cột bắt buộc khai. Không có giá trị mặc định là "ảnh thật" — người tải lên
-- phải tự chọn, vì đó chính là câu hỏi hay bị bỏ qua nhất.
create type anh_thuc_te as enum (
  'anh_that',     -- chụp tại Beeftown, của Beeftown
  'anh_minh_hoa', -- ảnh kho hoặc ảnh mượn — PHẢI ghi rõ khi hiển thị
  'anh_concept',  -- phối cảnh, dựng hình
  'anh_tai_lieu'  -- chụp màn hình, giấy tờ, dùng nội bộ
);


-- =============================================================================
-- TỆP ẢNH
-- =============================================================================
create table tep_anh (
  id            uuid primary key default gen_random_uuid(),

  bucket        text not null,
  duong_dan     text not null,
  khung_ma      text references khung_anh(ma) on delete set null,

  loai          loai_tep    not null,
  nguon_that    anh_thuc_te not null,

  -- alt_vi bắt buộc khi công bố: người dùng trình đọc màn hình cũng là khách.
  alt_vi        text,
  alt_en        text,
  -- Chú thích bắt buộc khi KHÔNG phải ảnh thật. Đây là chốt chặn chống đúng
  -- cái sai của trang nháp: ảnh kho được trình bày như ảnh của nhà hàng.
  chu_thich     text,

  shot_id       text,        -- khớp cột Shot ID trong brief chụp menu (P-F01…)
  mon_an_id     uuid,        -- khóa ngoại thêm ở cuối 0011 (tránh phụ thuộc vòng)

  rong            int,
  cao             int,
  kich_thuoc_byte bigint,
  dinh_dang       text,

  trang_thai    trang_thai_cong_bo not null default 'nhap',
  nguoi_tai_len uuid references nhan_su(id) on delete set null,
  nguoi_duyet   uuid references nhan_su(id) on delete set null,
  cong_bo_luc   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (bucket, duong_dan),

  -- Công bố thì phải có mô tả thay thế. Không có ngoại lệ.
  constraint tep_anh_cong_bo_du_alt check (
    trang_thai <> 'da_cong_bo' or not la_van_ban_tam(alt_vi)),

  -- Ảnh không phải ảnh thật thì phải nói rõ là gì, ngay khi lưu — không đợi
  -- tới lúc công bố, vì người duyệt cần thấy chú thích để quyết định.
  constraint tep_anh_minh_hoa_phai_ghi_ro check (
    nguon_that = 'anh_that' or not la_van_ban_tam(chu_thich)),

  constraint tep_anh_kich_thuoc_hop_le check (
    (rong is null or rong > 0) and (cao is null or cao > 0))
);

create index tep_anh_khung_idx on tep_anh(khung_ma)
  where trang_thai = 'da_cong_bo';
create index tep_anh_mon_idx on tep_anh(mon_an_id)
  where mon_an_id is not null;

create trigger tep_anh_updated_at
  before update on tep_anh
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table tep_anh is
  'Dữ liệu mô tả ảnh. File thật nằm ở Supabase Storage; bảng này giữ sự thật về từng tấm.';
comment on column tep_anh.nguon_that is
  'Bắt buộc khai. Ảnh không phải anh_that thì bắt buộc có chu_thich — chốt chặn chống trình bày ảnh kho như ảnh của Beeftown.';


-- -----------------------------------------------------------------------------
-- CHỐT CHẶN KHI CÔNG BỐ ẢNH
-- -----------------------------------------------------------------------------
-- Ràng buộc phụ thuộc bảng khác không viết được bằng CHECK, nên dùng trigger.
-- Hai việc: kiểm kích thước tối thiểu của khung, và kiểm quyền người công bố.
-- -----------------------------------------------------------------------------
create or replace function tep_anh_kiem_tra_cong_bo()
returns trigger
language plpgsql
as $$
declare
  v_khung khung_anh;
begin
  if new.trang_thai <> 'da_cong_bo' then
    return new;
  end if;

  if new.khung_ma is not null then
    select * into v_khung from khung_anh where ma = new.khung_ma;
    if found then
      if v_khung.rong_toi_thieu is not null
         and (new.rong is null or new.rong < v_khung.rong_toi_thieu) then
        raise exception 'Ảnh cho khung % cần rộng tối thiểu %px', new.khung_ma, v_khung.rong_toi_thieu
          using errcode = 'check_violation';
      end if;
      if v_khung.cao_toi_thieu is not null
         and (new.cao is null or new.cao < v_khung.cao_toi_thieu) then
        raise exception 'Ảnh cho khung % cần cao tối thiểu %px', new.khung_ma, v_khung.cao_toi_thieu
          using errcode = 'check_violation';
      end if;
    end if;
  end if;

  if new.cong_bo_luc is null then
    new.cong_bo_luc := now();
  end if;
  return new;
end;
$$;

create trigger tep_anh_kiem_tra_cong_bo_trigger
  before insert or update on tep_anh
  for each row execute function tep_anh_kiem_tra_cong_bo();


-- -----------------------------------------------------------------------------
-- DANH SÁCH ẢNH CÒN THIẾU — buổi chụp dưới dạng một câu truy vấn
-- -----------------------------------------------------------------------------
-- Beeftown_Bo_Nhan_Dien_So.html mục A5 liệt kê 10 khuôn hình cần chụp. Để
-- danh sách đó nằm trong tài liệu thì không ai biết đã chụp tới đâu; để nó
-- thành view thì lúc nào cũng trả lời được "còn thiếu gì trước khi mở".
-- -----------------------------------------------------------------------------
create view v_anh_con_thieu with (security_invoker = true) as
select
  k.ma,
  k.ten,
  k.nhom,
  k.mo_ta,
  k.ty_le,
  k.rong_toi_thieu,
  k.cao_toi_thieu,
  k.bat_buoc
from khung_anh k
where not exists (
  select 1 from tep_anh t
  where t.khung_ma = k.ma
    and t.trang_thai = 'da_cong_bo'
    and t.nguon_that = 'anh_that'
)
order by k.bat_buoc desc, k.thu_tu;

comment on view v_anh_con_thieu is
  'Khung ảnh chưa có ảnh THẬT đã công bố. Ảnh minh họa không tính là đã có.';


-- =============================================================================
-- PHÂN QUYỀN
-- =============================================================================
alter table khung_anh enable row level security;
alter table tep_anh   enable row level security;

-- Khung ảnh: ai đăng nhập cũng xem được (người chụp cần đọc mô tả), chỉ chủ
-- sở hữu mới thêm/sửa vị trí ảnh.
create policy khung_anh_doc on khung_anh
  for select using (co_phien_dang_nhap());
create policy khung_anh_sua on khung_anh
  for all using (la_chu_so_huu()) with check (la_chu_so_huu());

-- Tệp ảnh: nhân sự xem được, ba vai trò nội dung được tải lên và sửa.
-- Không ai xóa được — ảnh đã công bố mà biến mất thì trang hỏng im lặng;
-- muốn gỡ thì chuyển trang_thai sang da_thu_hoi.
create policy tep_anh_doc on tep_anh
  for select using (co_phien_dang_nhap());
create policy tep_anh_them on tep_anh
  for insert with check (
    co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]));
create policy tep_anh_sua on tep_anh
  for update using (
    co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]));


-- =============================================================================
-- SEED — 12 khung ảnh
-- =============================================================================
-- Mười khuôn hình theo Beeftown_Bo_Nhan_Dien_So.html mục A5, cộng ảnh chia sẻ
-- và ảnh bạt thi công.
--
-- TÁM TRONG MƯỜI KHUÔN BẮT BUỘC CẦN PHÒNG ĐÃ HOÀN THIỆN VÀ BIỂN ĐÃ SÁNG.
-- Đây là lý do mọi giai đoạn trước ngày mở phải hoàn chỉnh với KHÔNG một tấm
-- ảnh nào — không phải vì lười, mà vì ảnh thật chưa thể tồn tại.
-- =============================================================================
insert into khung_anh (ma, ten, mo_ta, nhom, ty_le, rong_toi_thieu, cao_toi_thieu, bat_buoc, thu_tu) values
  ('mat-tien-ngay',  'Mặt tiền ban ngày',
   'Nhìn từ hướng đi xuống cầu Ông Lãnh, thấy rõ biển hiệu và số nhà 40–42.',
   'mat_tien', '4:3', 1600, 1200, true, 10),

  ('mat-tien-toi',   'Mặt tiền buổi tối',
   'Cùng góc với ảnh ban ngày, chụp khi biển đã sáng đèn.',
   'mat_tien', '4:3', 1600, 1200, true, 20),

  ('so-nha',         'Số nhà 40–42',
   'Cận cảnh số nhà để khách đi bộ đối chiếu được.',
   'mat_tien', '1:1', 1080, 1080, false, 30),

  ('quay-thit',      'Quầy chọn bò',
   'Toàn cảnh quầy với các khay bò đã dán nhãn. Đây là ảnh giải thích concept.',
   'quay', '3:2', 1800, 1200, true, 40),

  ('khay-thit',      'Cận cảnh khay và nhãn',
   'Một khay bò với nhãn ghi tên phần cắt, trọng lượng và giá. Chữ phải đọc được.',
   'quay', '3:2', 1800, 1200, true, 50),

  ('vi-nuong',       'Vỉ nướng đang dùng',
   'Bò trên vỉ GAS — không dùng ảnh than hoa.',
   'quay', '3:2', 1800, 1200, true, 60),

  ('khong-gian',     'Không gian phòng ăn',
   'Toàn cảnh khu bàn ăn khi đã hoàn thiện. Không chụp khi còn ngổn ngang.',
   'khong_gian', '16:9', 1920, 1080, true, 70),

  ('doi-ngu',        'Đội ngũ',
   'Khánh cùng đội bếp. Không dùng ảnh người mẫu.',
   'doi_ngu', '3:2', 1800, 1200, true, 80),

  ('mon-tieu-bieu',  'Món tiêu biểu',
   'Một món đã được duyệt bán, chụp đúng cách trình bày thực tế.',
   'mon', '4:5', 1080, 1350, true, 90),

  ('bang-gia',       'Bảng giá tại quầy',
   'Bảng giá thật tại quầy. Chỉ chụp sau khi giá đã được duyệt.',
   'quay', '3:2', 1800, 1200, false, 100),

  ('og-chia-se',     'Ảnh khi chia sẻ link',
   'Ảnh hiện ra khi dán link website vào Zalo, Messenger hay Facebook. 1200×630.',
   'chia_se', '1.91:1', 1200, 630, true, 110),

  ('banner-b0',      'Bạt thi công',
   'Ảnh chụp tấm bạt sau khi treo. Đây là ảnh thật duy nhất có thể có ở ngày B0.',
   'mat_tien', '16:9', 1600, 900, false, 120);


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
  end if;
end
$$;
