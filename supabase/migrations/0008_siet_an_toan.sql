-- =============================================================================
-- BEEFTOWN CRM — 0008 · SIẾT AN TOÀN
-- Vá bốn lỗ hổng · sửa hai lỗi chỉ số · helper dùng chung cho 0009–0014
-- =============================================================================
-- Migration này KHÔNG thêm tính năng nào. Nó sửa những chỗ hệ thống đang hở,
-- và phải chạy TRƯỚC mọi migration sau — vì khối `alter default privileges`
-- ở mục 1 là thứ bảo vệ toàn bộ bảng và hàm được tạo ra ở 0009–0014.
--
-- Bốn lỗ hổng:
--   1. 0007 chỉ thu hồi quyền BẢNG, chưa thu hồi quyền HÀM. Postgres mặc định
--      cấp EXECUTE cho PUBLIC, nên người lạ không đăng nhập gọi được
--      ghi_luot_ghe() để tự tạo điểm tích lũy.
--   2. Cả 7 view thiếu security_invoker → chạy dưới quyền owner → nhân sự một
--      chi nhánh xem được tệp khách toàn thương hiệu.
--   3. current_date/current_time chạy theo múi giờ phiên (UTC trên Supabase),
--      Việt Nam UTC+7 → khung giờ "đã qua" sai 7 tiếng.
--   4. Bảng tạo sau này tự nhận quyền mặc định Supabase cấp cho anon.
--
-- Hai lỗi trong chi_so_crm(): ty_le_quay_lai_lan_2 không áp p_chi_nhanh_id,
-- và biến v_hoa_don_co_sdt là code chết.
-- =============================================================================


-- =============================================================================
-- 1 · QUYỀN THỰC THI HÀM — lỗ hổng nghiêm trọng nhất
-- =============================================================================
-- 0007 chạy `revoke all on all tables ... from anon` rồi dừng. Nhưng quyền gọi
-- hàm là một hệ thống riêng: Postgres cấp EXECUTE cho PUBLIC theo mặc định với
-- MỌI hàm vừa tạo, và Supabase còn cấp THÊM cho anon qua default privileges.
-- Vì vậy ba dòng `grant execute ... to anon` ở cuối 0007 thực ra không mở thêm
-- gì cả — anon vốn đã gọi được TẤT CẢ.
--
-- Hậu quả cụ thể: `select ghi_luot_ghe(...)` từ một người lạ không đăng nhập
-- sẽ ghi lượt ghé và phát điểm tích lũy. Điểm là tiền.
--
-- Phải thu hồi CẢ HAI: từ PUBLIC và từ anon. Thu hồi một bên là chưa đủ.
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on all functions in schema public from public';
    execute 'revoke execute on all functions in schema public from anon';
    execute 'revoke all     on all sequences in schema public from anon';

    -- Chặn tận gốc: mọi bảng/hàm/sequence tạo SAU migration này đều không
    -- được cấp cho anon nữa. Đây là thứ bảo vệ 0009–0014.
    execute 'alter default privileges in schema public revoke execute on functions from public';
    execute 'alter default privileges in schema public revoke execute on functions from anon';
    execute 'alter default privileges in schema public revoke all     on tables    from anon';
    execute 'alter default privileges in schema public revoke all     on sequences from anon';

    -- Việc cấp lại nằm ở MỤC 6 cuối file, sau khi mọi hàm đã được tạo xong.
  end if;
end
$$;

-- LƯU Ý CHO NGƯỜI BẢO TRÌ — hai giới hạn của khối trên:
--
--   a) `alter default privileges` chỉ ràng buộc đối tượng do CHÍNH role đã
--      chạy lệnh này tạo ra. Trên Supabase đó là `postgres`, trùng với role
--      cấp default privileges của Supabase, nên khớp. Nhưng nếu sau này có ai
--      tạo hàm dưới role khác (ví dụ supabase_admin), khối này âm thầm vô hiệu.
--
--   b) Với HÀM, khối trên KHÔNG đủ — xem mục 6. Postgres cấp EXECUTE cho
--      PUBLIC như một mặc định DỰNG SẴN trong nhân, không phải một dòng trong
--      pg_default_acl, nên `alter default privileges ... revoke` không ghi đè
--      được. Với BẢNG và SEQUENCE thì đủ, vì mặc định gốc là không cấp gì.
--
--   c) Vì (a) và (b), ĐỘ BỀN THẬT SỰ NẰM Ở BÀI TEST, không nằm ở câu DDL này.
--      test/test-an-toan.mjs liệt kê pg_proc và fail nếu tập hàm anon gọi được
--      khác danh sách đã duyệt. Thêm hàm mà quên revoke → npm test đỏ ngay.
--
-- Thu hồi EXECUTE từ PUBLIC KHÔNG làm hỏng:
--   · hàm trigger — Postgres kiểm tra quyền lúc `create trigger`, không phải
--     lúc trigger chạy;
--   · sdt_hop_le() trong CHECK của khach_hang — biểu thức ràng buộc chạy
--     không qua kiểm tra ACL.


-- =============================================================================
-- 2 · VIEW PHẢI CHẠY DƯỚI QUYỀN NGƯỜI GỌI
-- =============================================================================
-- Mặc định view chạy dưới quyền NGƯỜI TẠO ra nó — ở đây là role chạy migration,
-- thường có BYPASSRLS. Nghĩa là toàn bộ công sức tách dữ liệu theo chi nhánh ở
-- 0007 bị vô hiệu ngay khi nhân sự truy vấn qua view thay vì qua bảng gốc:
-- v_khach_tong_hop trả về khách của MỌI chi nhánh.
--
-- Đây đúng là điều 0007 dòng 56–59 viết ra để ngăn: "chi nhánh nhượng quyền
-- KHÔNG được xem toàn bộ tệp khách của thương hiệu".
--
-- Cả hai file test hiện tại đều không truy vấn view dưới `set role`, nên không
-- có kiểm tra nào bắt được. test-an-toan.mjs bổ sung phần đó.
-- =============================================================================
alter view v_dong_y_hien_tai set (security_invoker = true);
alter view v_so_du_diem      set (security_invoker = true);
alter view v_khach_tong_hop  set (security_invoker = true);
alter view v_phan_nhom_khach set (security_invoker = true);
alter view v_khach_vip       set (security_invoker = true);
alter view v_duoc_gui_tin    set (security_invoker = true);
alter view v_thong_ke_nhom   set (security_invoker = true);

-- HỆ QUẢ NGHIỆP VỤ — đây là QUYẾT ĐỊNH, không phải tác dụng phụ:
--
--   · so_lan_ghe và tong_chi_tieu giờ tính THEO CHI NHÁNH với nhân sự chi
--     nhánh, và toàn thương hiệu với chủ sở hữu. Một khách ăn 2 lần ở Q1 và
--     2 lần ở Q7 sẽ hiện so_lan_ghe = 2 với quản lý mỗi bên, = 4 với chủ.
--     Cùng một khách có thể rơi vào hai nhóm khác nhau tùy người xem.
--   · v_khach_vip dùng percent_rank() nên "top 10%" thành top 10% CỦA CHI
--     NHÁNH với nhân sự chi nhánh.
--
-- Đây là hành vi đúng theo mục tiêu nhượng quyền. Nếu sau này cần nhóm khách
-- toàn thương hiệu cho nhân sự chi nhánh, phải viết một HÀM security definer
-- có kiểm tra vai trò rõ ràng — đừng gỡ security_invoker khỏi view, vì "mọi
-- view trong public đều là invoker" là một khẳng định mà test kiểm được.


-- =============================================================================
-- 3 · MÚI GIỜ — Việt Nam UTC+7, Supabase chạy UTC
-- =============================================================================
-- current_date/current_time/now() phụ thuộc tham số TimeZone của phiên kết
-- nối. Trên Supabase đó là UTC. 21:00 giờ Việt Nam là 14:00 UTC, nên khung
-- 19:00 TỐI NAY vẫn bị tính là "chưa qua" và website vẫn mời khách đặt.
--
-- Nặng hơn: tao_dat_ban() chỉ kiểm `p_ngay < current_date`, KHÔNG kiểm giờ
-- trong ngày. Nên kể cả giao diện có ẩn khung giờ đã qua, gọi thẳng RPC vẫn
-- đặt được bàn cho 19:00 lúc 21:00.
--
-- Dùng SỐ HỌC +7 giờ thay vì tên múi giờ 'Asia/Ho_Chi_Minh' vì:
--   · Việt Nam bỏ giờ mùa hè từ 1975 — offset cố định, không ngoại lệ;
--   · 0001 dòng 10–13 cam kết schema "chạy được trên mọi Postgres chuẩn", mà
--     tên múi giờ phụ thuộc gói tzdata của bản build — PGlite (WASM) không
--     chắc có đủ.
--
-- `now() at time zone 'utc'` trả về timestamp KHÔNG có múi giờ và độc lập với
-- TimeZone của phiên — nên ::date và ::time sau đó cũng độc lập.
-- =============================================================================
create or replace function bay_gio_vn()
returns timestamp
language sql
stable
as $$ select (now() at time zone 'utc') + interval '7 hours' $$;

create or replace function hom_nay_vn()
returns date
language sql
stable
as $$ select (((now() at time zone 'utc') + interval '7 hours'))::date $$;

create or replace function gio_vn()
returns time
language sql
stable
as $$ select (((now() at time zone 'utc') + interval '7 hours'))::time $$;

comment on function bay_gio_vn is
  'Thời điểm hiện tại theo giờ Việt Nam, không phụ thuộc TimeZone của phiên.';
comment on function hom_nay_vn is
  'Ngày hôm nay theo giờ Việt Nam. Dùng thay current_date ở MỌI chỗ nghiệp vụ.';
comment on function gio_vn is
  'Giờ hiện tại theo giờ Việt Nam. Dùng thay current_time.';


-- -----------------------------------------------------------------------------
-- 3a · LỊCH TRỐNG — thay current_date/current_time
-- -----------------------------------------------------------------------------
-- Giữ nguyên chữ ký và tên cột trả về. KHÔNG đổi chữ ký của hàm công khai:
-- `create or replace` với bộ tham số khác sẽ âm thầm tạo ra một OVERLOAD, và
-- bản cũ vẫn giữ nguyên quyền đã cấp cho anon. Muốn đổi thì đặt TÊN MỚI.
-- -----------------------------------------------------------------------------
create or replace function lich_trong_theo_ngay(
  p_chi_nhanh_id uuid,
  p_ngay         date
)
returns table (
  gio        time,
  buoi       text,
  con_trong  integer,
  da_qua     boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    k.gio,
    k.buoi,
    so_ban_con_trong(p_chi_nhanh_id, p_ngay, k.gio) as con_trong,
    -- Khung giờ đã qua theo GIỜ VIỆT NAM thì không nhận nữa
    (p_ngay < hom_nay_vn())
      or (p_ngay = hom_nay_vn() and k.gio <= gio_vn()) as da_qua
  from khung_gio_trong_ngay(p_chi_nhanh_id) k
  order by k.gio;
$$;


-- -----------------------------------------------------------------------------
-- 3b · TẠO ĐẶT BÀN — thêm chốt chặn giờ trong ngày ở TẦNG SERVER
-- -----------------------------------------------------------------------------
-- Bản cũ chỉ kiểm ngày. Giao diện có ẩn khung giờ đã qua cũng vô nghĩa nếu
-- gọi thẳng RPC vẫn lọt — và RPC thì công khai theo thiết kế.
--
-- Câu "Không thể đặt bàn cho ngày trong quá khứ" giữ NGUYÊN TỪNG CHỮ vì
-- chay-test.mjs khớp regex /quá khứ/i. Chốt chặn giờ dùng câu MỚI.
-- -----------------------------------------------------------------------------
create or replace function tao_dat_ban(
  p_chi_nhanh_ma text,
  p_sdt          text,
  p_ho_ten       text,
  p_ngay         date,
  p_gio          time,
  p_so_khach     smallint,
  p_dip          text default null,
  p_ghi_chu      text default null,
  p_dong_y       boolean default false,
  p_utm_source   text default null,
  p_utm_medium   text default null,
  p_utm_campaign text default null,
  p_trang_gioi_thieu text default null,
  p_ip           inet default null
)
returns table (
  dat_ban_id uuid,
  ma_dat_ban text,
  con_trong  integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cn     chi_nhanh;
  v_khach  khach_hang;
  v_trong  integer;
  v_dat    dat_ban;
begin
  select * into v_cn from chi_nhanh
  where lower(ma) = lower(p_chi_nhanh_ma) and dang_hoat_dong;
  if not found then
    raise exception 'Không tìm thấy chi nhánh %', p_chi_nhanh_ma
      using errcode = 'foreign_key_violation';
  end if;

  if p_ngay < hom_nay_vn() then
    raise exception 'Không thể đặt bàn cho ngày trong quá khứ'
      using errcode = 'check_violation';
  end if;

  -- MỚI: khung giờ hôm nay đã trôi qua thì cũng không nhận
  if p_ngay = hom_nay_vn() and p_gio <= gio_vn() then
    raise exception 'Khung giờ % hôm nay đã qua', p_gio
      using errcode = 'check_violation';
  end if;

  -- Khóa chi nhánh để việc kiểm tra chỗ trống và ghi đặt bàn là nguyên tử
  perform 1 from chi_nhanh where id = v_cn.id for update;

  v_trong := so_ban_con_trong(v_cn.id, p_ngay, p_gio);
  if v_trong <= 0 then
    raise exception 'Khung giờ % ngày % đã hết bàn', p_gio, p_ngay
      using errcode = 'check_violation';
  end if;

  v_khach := tim_hoac_tao_khach(p_sdt, p_ho_ten, v_cn.id,
                                p_utm_source, p_utm_medium, p_utm_campaign);

  insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach,
                       dip, ghi_chu, dong_y_nhan_tin,
                       utm_source, utm_medium, utm_campaign, trang_gioi_thieu)
  values (v_cn.id, v_khach.id, p_ngay, p_gio, p_so_khach,
          p_dip, p_ghi_chu, p_dong_y,
          p_utm_source, p_utm_medium, p_utm_campaign, p_trang_gioi_thieu)
  returning * into v_dat;

  -- Ghi nhật ký đồng ý — bằng chứng tuân thủ NĐ 13/2023
  if p_dong_y then
    insert into nhat_ky_dong_y (khach_hang_id, dong_y, kenh, noi_dung, ip)
    values (v_khach.id, true, 'web',
            'Tôi đồng ý để Beeftown liên hệ xác nhận đặt bàn và gửi thông tin ưu đãi qua số điện thoại này. Có thể huỷ nhận tin bất cứ lúc nào.',
            p_ip);
  end if;

  return query
  select v_dat.id,
         upper(substring(v_dat.id::text, 1, 6)),   -- 0013 thay bằng cột thật
         so_ban_con_trong(v_cn.id, p_ngay, p_gio);
end;
$$;

comment on function tao_dat_ban is
  'API công khai cho website. SECURITY DEFINER. Kiểm tra chỗ trống nguyên tử và chặn khung giờ đã qua theo giờ Việt Nam.';


-- =============================================================================
-- 4 · CHỈ SỐ CRM — sửa hai lỗi
-- =============================================================================
-- Lỗi 1: v_khach_moi và v_khach_quay_lai đọc từ v_khach_tong_hop, vốn KHÔNG có
--        chiều chi nhánh. Nên p_chi_nhanh_id không bao giờ được áp dụng và
--        bảng đo theo chi nhánh hiện tỷ lệ quay lại của TOÀN thương hiệu,
--        trong khi năm chỉ số còn lại đều đã lọc đúng. Một con số sai nằm cạnh
--        năm con số đúng là kiểu sai khó phát hiện nhất.
-- Lỗi 2: v_hoa_don_co_sdt được khai báo, được tính, rồi không ai đọc. Nó là
--        bản sao từng chữ của truy vấn v_tong_luot ba dòng phía trên.
--
-- Cách sửa: tính trực tiếp từ luot_ghe có lọc chi nhánh. NGỮ NGHĨA ĐỔI THEO —
-- khi truyền p_chi_nhanh_id, "khách mới" nghĩa là LẦN ĐẦU GHÉ CHI NHÁNH NÀY
-- trong kỳ, không phải lần đầu biết tới thương hiệu. Với một nhà hàng thì hai
-- cách hiểu trùng nhau; khi có chi nhánh thứ hai thì đây là con số quản lý chi
-- nhánh thật sự cần.
--
-- Giữ INVOKER (không phải definer): quản lý chi nhánh gọi chi_so_crm(null) sẽ
-- tự động bị RLS thu hẹp về chi nhánh mình. Phòng thủ nhiều lớp trên tham số.
-- =============================================================================
create or replace function chi_so_crm(
  p_chi_nhanh_id uuid default null,
  p_tu_ngay      date default (hom_nay_vn() - 30),
  p_den_ngay     date default hom_nay_vn()
)
returns table (
  chi_so   text,
  gia_tri  numeric,
  don_vi   text,
  dien_giai text
)
language plpgsql
stable
as $$
declare
  v_khach_moi        int;
  v_khach_quay_lai   int;
  v_tong_luot        int;
  v_tong_khach       int;
  v_hoa_don_tb       numeric;
  v_lan_ghe_tb       numeric;
  v_diem_phat        bigint;
  v_diem_dung        bigint;
begin
  -- Khách mới trong kỳ và bao nhiêu trong số đó đã quay lại — CÓ lọc chi nhánh
  with dau as (
    select khach_hang_id,
           min(thoi_diem) as lan_dau,
           count(*)       as so_lan
    from luot_ghe
    where (p_chi_nhanh_id is null or chi_nhanh_id = p_chi_nhanh_id)
    group by khach_hang_id
  )
  select count(*) filter (where lan_dau::date between p_tu_ngay and p_den_ngay),
         count(*) filter (where lan_dau::date between p_tu_ngay and p_den_ngay
                            and so_lan >= 2)
    into v_khach_moi, v_khach_quay_lai
  from dau;

  select count(*), count(distinct khach_hang_id), avg(thuc_thu)
    into v_tong_luot, v_tong_khach, v_hoa_don_tb
  from luot_ghe
  where thoi_diem::date between p_tu_ngay and p_den_ngay
    and (p_chi_nhanh_id is null or chi_nhanh_id = p_chi_nhanh_id);

  v_lan_ghe_tb := case when v_tong_khach > 0
                       then v_tong_luot::numeric / v_tong_khach else 0 end;

  select coalesce(sum(so_diem) filter (where loai = 'tich'), 0),
         coalesce(abs(sum(so_diem) filter (where loai = 'dung')), 0)
    into v_diem_phat, v_diem_dung
  from so_cai_diem
  where created_at::date between p_tu_ngay and p_den_ngay
    and (p_chi_nhanh_id is null or chi_nhanh_id = p_chi_nhanh_id);

  return query
  select 'ty_le_quay_lai_lan_2'::text,
         case when v_khach_moi > 0
              then round(v_khach_quay_lai::numeric / v_khach_moi * 100, 1)
              else 0 end,
         '%'::text,
         'Chỉ số quan trọng nhất 3 tháng đầu. Thấp = vấn đề ở món ăn/dịch vụ, không phải ở tích điểm.'::text
  union all
  select 'tan_suat_ghe', round(v_lan_ghe_tb, 2), 'lượt/khách',
         'Khách quen quán nướng thường ghé mỗi 4–8 tuần. Xu hướng quan trọng hơn con số.'
  union all
  select 'hoa_don_trung_binh', round(coalesce(v_hoa_don_tb, 0), 0), 'đồng',
         'So với mốc 290.000đ trong mô hình tài chính.'
  union all
  select 'gia_tri_vong_doi', round(coalesce(v_hoa_don_tb, 0) * v_lan_ghe_tb * 0.132, 0), 'đồng',
         'Lợi nhuận thực một khách mang lại (biên đóng góp 13,2%).'
  union all
  select 'ty_le_diem_duoc_dung',
         case when v_diem_phat > 0
              then round(v_diem_dung::numeric / v_diem_phat * 100, 1)
              else 0 end,
         '%',
         'Dưới 40% nghĩa là khách không thấy hấp dẫn — xem lại ngưỡng dùng.'
  union all
  select 'so_luot_ghe', v_tong_luot::numeric, 'lượt',
         'Tổng lượt ghé trong kỳ. Hòa vốn cần 70,5 lượt/ngày.';
end;
$$;

comment on function chi_so_crm is
  'Sáu chỉ số theo mục G1. Gọi hằng tháng, ghi lại để xem xu hướng. Khi truyền chi nhánh, "khách mới" = lần đầu ghé chi nhánh đó.';


-- =============================================================================
-- 5 · HELPER DÙNG CHUNG CHO 0009–0014
-- =============================================================================

-- Vòng đời công bố, dùng chung cho nội dung, ảnh, món ăn và tin tuyển dụng.
-- da_thu_hoi là CÔNG DÂN HẠNG NHẤT chứ không phải hệ quả phụ: khi ngày khai
-- trương bị dời, thứ cần nhất là gỡ dữ kiện sai KHỎI TRANG trong vài giây,
-- chứ không phải chờ soạn xong bản thay thế.
create type trang_thai_cong_bo as enum (
  'nhap',        -- đang soạn, chưa ai duyệt
  'da_duyet',    -- đã duyệt nội dung, chưa lên sóng
  'da_cong_bo',  -- đang hiển thị công khai
  'da_thu_hoi'   -- đã gỡ khỏi trang; giữ lại để truy vết
);

-- -----------------------------------------------------------------------------
-- CÓ ĐANG ĐĂNG NHẬP KHÔNG
-- -----------------------------------------------------------------------------
-- Mọi chỗ trong schema này chạm tới schema auth đều phải đi qua một hàm
-- SECURITY DEFINER — xem la_chu_so_huu(), co_vai_tro(), nhan_su_hien_tai()
-- ở 0001. Lý do: vai trò authenticated KHÔNG có quyền vào schema auth, nên
-- gọi thẳng auth.uid() từ một trigger hay một policy thường sẽ lỗi
-- "permission denied for schema auth".
--
-- Trả về false khi không có phiên đăng nhập — tức là migration, seed, hoặc
-- service_role.
-- -----------------------------------------------------------------------------
create or replace function co_phien_dang_nhap()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select auth.uid() is not null $$;

comment on function co_phien_dang_nhap is
  'True khi có người dùng thật đang đăng nhập. False với migration, seed và service_role.';


-- -----------------------------------------------------------------------------
-- VĂN BẢN TẠM — chốt chặn chống nội dung nháp lọt ra công khai
-- -----------------------------------------------------------------------------
-- Bảng nội dung menu có sẵn những ô như:
--     [Mô tả sau khi duyệt công thức]
--     [Chờ xác nhận công thức để đặt tên Việt]
-- Đây là ghi chú cho người biên tập, không phải câu chữ phục vụ khách. Quy ước
-- dấu ngoặc vuông đã tồn tại sẵn trong dữ liệu nguồn, nên biến nó thành một
-- ràng buộc CHECK là cách rẻ nhất để KHÔNG THỂ công bố nhầm.
--
-- Rỗng và null cũng tính là tạm — "chưa viết" và "viết dở" đều không được đăng.
-- -----------------------------------------------------------------------------
create or replace function la_van_ban_tam(t text)
returns boolean
language sql
immutable
as $$ select t is null or btrim(t) = '' or t ~ '\[.*\]' $$;

comment on function la_van_ban_tam is
  'True nếu văn bản còn là bản nháp: rỗng, null, hoặc còn dấu ngoặc vuông kiểu [chờ duyệt]. Dùng trong CHECK trước khi cho phép công bố.';


-- =============================================================================
-- 6 · CHỐT QUYỀN — BẮT BUỘC là mục cuối cùng của file
-- =============================================================================
-- Mục 1 đã gỡ quyền mặc định mà Supabase cấp cho anon. Với BẢNG và SEQUENCE
-- thế là đủ, vì mặc định gốc của Postgres là không cấp gì cho PUBLIC.
--
-- HÀM THÌ KHÁC, và đây là chỗ dễ nhầm nhất trong cả schema:
--   Postgres cấp EXECUTE cho PUBLIC với mọi hàm mới như một mặc định DỰNG SẴN
--   trong nhân, chứ không phải một dòng trong pg_default_acl. Câu
--   `alter default privileges ... revoke execute on functions from public`
--   KHÔNG ghi đè được mặc định dựng sẵn đó.
--
--   Đã kiểm chứng bằng thực nghiệm: hàm tạo ra SAU khối mục 1 vẫn có
--   proacl = null, tức PUBLIC — và do đó anon — vẫn gọi được. Chính
--   test-an-toan.mjs đã bắt được điều này với bốn hàm helper ở mục 3 và 5.
--
-- QUY TẮC CHO MỌI MIGRATION SAU: file nào có tạo hàm thì PHẢI kết thúc bằng
-- một khối như dưới đây. 0013 giữ danh sách cho phép đầy đủ và cuối cùng.
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on all functions in schema public from public';
    execute 'revoke execute on all functions in schema public from anon';

    -- Đúng ba hàm website cần ở giai đoạn này. 0013 mở rộng danh sách.
    execute 'grant execute on function tao_dat_ban(text,text,text,date,time,smallint,text,text,boolean,text,text,text,text,inet) to anon';
    execute 'grant execute on function lich_trong_theo_ngay(uuid,date) to anon';
    execute 'grant execute on function so_ban_con_trong(uuid,date,time) to anon';
  end if;
end
$$;
