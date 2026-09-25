-- =============================================================================
-- BEEFTOWN CRM — 0013 · CÔNG KHAI VÀ ĐO LƯỜNG
-- Vá mã đặt bàn · tra cứu và hủy · thông tin chi nhánh · đo lường website
-- =============================================================================
-- BA VIỆC TRONG FILE NÀY
--
--   1. Vá một lỗi production tiềm tàng: ma_dat_ban KHÔNG duy nhất.
--   2. Bịt một lỗ hổng nhỏ nhưng thật: website không có cách nào đổi mã chi
--      nhánh thành id, vì lich_trong_theo_ngay() nhận uuid còn anon thì không
--      đọc được bảng chi_nhanh.
--   3. Đo lường website, với một ràng buộc nghiêm ngặt: KHÔNG được đánh đồng
--      "khách bấm nút" với "nhà hàng xác nhận" với "khách thực đến".
-- =============================================================================


-- =============================================================================
-- 1 · MÃ ĐẶT BÀN PHẢI DUY NHẤT
-- =============================================================================
-- Bản cũ trả về upper(substring(id::text, 1, 6)) — sáu ký tự hex lấy từ đầu
-- uuid, KHÔNG lưu lại, KHÔNG có ràng buộc duy nhất.
--
-- 16^6 ≈ 16,7 triệu tổ hợp nghe có vẻ nhiều, nhưng nghịch lý ngày sinh nói
-- xác suất trùng đạt 50% ở khoảng 4.800 lượt đặt. Mô hình tài chính đặt điểm
-- hòa vốn ở 70,5 lượt/ngày. Nghĩa là đây là lỗi của NĂM ĐẦU TIÊN, không phải
-- chuyện xa xôi — và nó chặn luôn việc tra cứu theo mã.
--
-- Cách vá: cột thật, chỉ mục duy nhất, bộ sinh mã có vòng thử lại. Dùng bảng
-- chữ Crockford base32 bỏ 0/O/1/I/L để đọc qua điện thoại không nhầm.
-- =============================================================================
alter table dat_ban add column ma_dat_ban text;

-- Ai đổi trạng thái đặt bàn. updated_at cho biết KHI NÀO, không cho biết AI —
-- mà "ai hủy bàn này" là câu hỏi sẽ được hỏi.
alter table dat_ban add column nguoi_xu_ly uuid references nhan_su(id) on delete set null;

create unique index dat_ban_ma_idx on dat_ban(ma_dat_ban)
  where ma_dat_ban is not null;

create or replace function sinh_ma_dat_ban()
returns text
language plpgsql
volatile
as $$
declare
  v_ma text;
  i    int;
begin
  for i in 1..20 loop
    select string_agg(
             substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ',
                    (floor(random() * 31) + 1)::int, 1), '')
      into v_ma
      from generate_series(1, 6);
    exit when not exists (select 1 from dat_ban where ma_dat_ban = v_ma);
    v_ma := null;
  end loop;

  if v_ma is null then
    raise exception 'Không sinh được mã đặt bàn, vui lòng thử lại';
  end if;
  return v_ma;
end;
$$;

-- Điền mã cho các đặt bàn đã có. Không dùng lại tiền tố uuid cũ vì chính nó
-- là thứ có thể đã trùng.
update dat_ban set ma_dat_ban = sinh_ma_dat_ban() where ma_dat_ban is null;


-- =============================================================================
-- 2 · THÔNG TIN CHI NHÁNH CHO WEBSITE
-- =============================================================================
-- KHÔNG trả về id. Mã chi nhánh (chi_nhanh.ma) mới là định danh công khai.
--
-- Giờ phục vụ chỉ trả ra khi khóa gio_phuc_vu_da_chot đã được công bố. Đây là
-- chốt chặn quan trọng: bảng chi_nhanh có sẵn giá trị mặc định 11:00–14:00 và
-- 17:00–22:00 từ 0001, trong khi roster vận hành lại ghi ca tối bắt đầu 16:00.
-- Ai tạo dòng chi nhánh mà không để ý sẽ thừa hưởng giờ sai một cách im lặng —
-- nên mặc định là KHÔNG công bố giờ.
-- =============================================================================
create or replace function chi_nhanh_cong_khai()
returns table (
  ma          text,
  ten         text,
  khu_vuc     text,
  dia_chi     text,
  dien_thoai  text,
  gio_da_chot boolean,
  trua_bat_dau  time,
  trua_ket_thuc time,
  toi_bat_dau   time,
  toi_ket_thuc  time,
  giu_ban_phut  int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.ma, c.ten, c.khu_vuc, c.dia_chi, c.dien_thoai,
    cong_tac_bat('gio_phuc_vu_da_chot'),
    case when cong_tac_bat('gio_phuc_vu_da_chot') then c.trua_bat_dau  end,
    case when cong_tac_bat('gio_phuc_vu_da_chot') then c.trua_ket_thuc end,
    case when cong_tac_bat('gio_phuc_vu_da_chot') then c.toi_bat_dau   end,
    case when cong_tac_bat('gio_phuc_vu_da_chot') then c.toi_ket_thuc  end,
    case when cong_tac_bat('gio_phuc_vu_da_chot') then c.giu_ban_phut  end
  from chi_nhanh c
  where c.dang_hoat_dong
  order by c.ma;
$$;


-- -----------------------------------------------------------------------------
-- LỊCH TRỐNG THEO MÃ CHI NHÁNH
-- -----------------------------------------------------------------------------
-- TÊN MỚI, không phải nạp chồng. `create or replace` với bộ tham số khác sẽ
-- âm thầm tạo ra một hàm THỨ HAI cùng tên, và bản cũ vẫn giữ nguyên quyền đã
-- cấp cho anon. Tệ hơn: gọi lich_trong_theo_ngay('q1', '2026-11-20') với hai
-- phiên bản (uuid,date) và (text,date) sẽ lỗi "function is not unique", mà
-- PostgREST gửi đúng kiểu đó.
--
-- QUY TẮC CHUNG: không bao giờ đổi chữ ký của một hàm công khai. Cần chữ ký
-- khác thì đặt tên khác.
-- -----------------------------------------------------------------------------
create or replace function lich_trong_theo_ma(
  p_chi_nhanh_ma text,
  p_ngay         date
)
returns table (
  gio       time,
  buoi      text,
  con_cho   boolean,   -- CHỈ còn chỗ hay không. Cố ý KHÔNG trả về con số.
  da_qua    boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.gio,
    l.buoi,
    l.con_trong > 0,
    l.da_qua
  from chi_nhanh c
  cross join lateral lich_trong_theo_ngay(c.id, p_ngay) l
  where lower(c.ma) = lower(p_chi_nhanh_ma) and c.dang_hoat_dong
  order by l.gio;
$$;

comment on function lich_trong_theo_ma is
  'Lịch trống cho website. Trả về CÓ/KHÔNG còn chỗ, không trả về số bàn — con số là một oracle sức chứa, và hiển thị nó ra là tạo cảm giác khan hiếm giả.';


-- =============================================================================
-- 3 · TẠO ĐẶT BÀN — lưu mã thật
-- =============================================================================
-- Chữ ký và tên cột trả về GIỮ NGUYÊN. Chỉ khác ở chỗ mã lấy từ cột thật.
-- =============================================================================
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
  if not cong_tac_bat('form_dat_ban_dang_mo') then
    raise exception 'Form đặt bàn đang tạm đóng'
      using errcode = 'check_violation';
  end if;

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

  if p_ngay = hom_nay_vn() and p_gio <= gio_vn() then
    raise exception 'Khung giờ % hôm nay đã qua', p_gio
      using errcode = 'check_violation';
  end if;

  perform 1 from chi_nhanh where id = v_cn.id for update;

  v_trong := so_ban_con_trong(v_cn.id, p_ngay, p_gio);
  if v_trong <= 0 then
    raise exception 'Khung giờ % ngày % đã hết bàn', p_gio, p_ngay
      using errcode = 'check_violation';
  end if;

  v_khach := tim_hoac_tao_khach(p_sdt, p_ho_ten, v_cn.id,
                                p_utm_source, p_utm_medium, p_utm_campaign);

  insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach,
                       dip, ghi_chu, dong_y_nhan_tin, ma_dat_ban,
                       utm_source, utm_medium, utm_campaign, trang_gioi_thieu)
  values (v_cn.id, v_khach.id, p_ngay, p_gio, p_so_khach,
          p_dip, p_ghi_chu, p_dong_y, sinh_ma_dat_ban(),
          p_utm_source, p_utm_medium, p_utm_campaign, p_trang_gioi_thieu)
  returning * into v_dat;

  if p_dong_y then
    insert into nhat_ky_dong_y (khach_hang_id, dong_y, kenh, noi_dung, ip)
    values (v_khach.id, true, 'web',
            'Tôi đồng ý để Beeftown liên hệ xác nhận đặt bàn và gửi thông tin ưu đãi qua số điện thoại này. Có thể huỷ nhận tin bất cứ lúc nào.',
            p_ip);
  end if;

  return query
  select v_dat.id, v_dat.ma_dat_ban,
         so_ban_con_trong(v_cn.id, p_ngay, p_gio);
end;
$$;


-- =============================================================================
-- 4 · TRA CỨU VÀ HỦY ĐẶT BÀN
-- =============================================================================
-- Sáu ký tự là ít. Bốn lớp bảo vệ, không lớp nào tự nó đủ:
--
--   1. Mã KHÔNG bao giờ đủ — phải khớp cả số điện thoại đã chuẩn hóa.
--   2. Kết quả trả về ĐƯỢC CHE — tên rút gọn, số điện thoại che giữa. Đoán
--      đúng cũng gần như không thu được gì mà người đoán chưa tự cung cấp.
--   3. Giới hạn số lần thử theo IP, và ghi lại — bảng nhật ký này cũng là
--      bằng chứng nếu có ai bắt đầu dò mã.
--   4. Chỉ tra được đặt bàn từ hôm qua trở đi. Danh sách khách cũ không phải
--      một API.
-- =============================================================================
create table nhat_ky_tra_cuu (
  id         uuid primary key default gen_random_uuid(),
  ip         inet,
  ma_thu     text,
  thanh_cong boolean not null default false,
  created_at timestamptz not null default now()
);

create index nhat_ky_tra_cuu_idx on nhat_ky_tra_cuu(ip, created_at desc);

alter table nhat_ky_tra_cuu enable row level security;
create policy nhat_ky_tra_cuu_doc on nhat_ky_tra_cuu
  for select using (co_vai_tro(array['chu_so_huu']::vai_tro[]));


create or replace function tra_cuu_dat_ban(
  p_ma  text,
  p_sdt text,
  p_ip  inet default null
)
returns table (
  ma_dat_ban    text,
  chi_nhanh_ten text,
  ngay          date,
  gio           time,
  so_khach      smallint,
  trang_thai    trang_thai_dat_ban,
  ho_ten_che    text,
  sdt_che       text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_dem int;
  v_sdt text;
begin
  if p_ip is not null then
    select count(*) into v_dem from nhat_ky_tra_cuu
    where ip = p_ip and not thanh_cong
      and created_at > now() - interval '15 minutes';
    if v_dem >= 6 then
      raise exception 'Tra cứu bị tạm khoá, vui lòng gọi nhà hàng'
        using errcode = 'check_violation';
    end if;
  end if;

  v_sdt := chuan_hoa_sdt(p_sdt);

  return query
  select
    d.ma_dat_ban,
    c.ten,
    d.ngay,
    d.gio,
    d.so_khach,
    d.trang_thai,
    -- "Nguyễn Văn An" → "Nguyễn V. A"
    regexp_replace(k.ho_ten, '(\S+)\s+(\S)\S*\s+(\S)\S*$', '\1 \2. \3'),
    -- "0912345678" → "09****5678"
    substr(k.sdt, 1, 2) || repeat('*', greatest(length(k.sdt) - 6, 0))
      || substr(k.sdt, length(k.sdt) - 3)
  from dat_ban d
  join chi_nhanh c  on c.id = d.chi_nhanh_id
  join khach_hang k on k.id = d.khach_hang_id
  where upper(d.ma_dat_ban) = upper(btrim(p_ma))
    and k.sdt = v_sdt
    and d.ngay >= hom_nay_vn() - 1;
end;
$$;

-- Ghi nhật ký phải nằm ở hàm riêng vì tra_cuu_dat_ban là STABLE (không ghi
-- được). Website gọi hàm này ngay sau khi tra cứu.
create or replace function ghi_nhat_ky_tra_cuu(
  p_ip inet, p_ma text, p_thanh_cong boolean
)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  insert into nhat_ky_tra_cuu (ip, ma_thu, thanh_cong)
  values (p_ip, left(coalesce(p_ma, ''), 12), coalesce(p_thanh_cong, false));
$$;


create or replace function huy_dat_ban(
  p_ma    text,
  p_sdt   text,
  p_ly_do text default null,
  p_ip    inet default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dat dat_ban;
  v_sdt text;
begin
  v_sdt := chuan_hoa_sdt(p_sdt);

  select d.* into v_dat
  from dat_ban d
  join khach_hang k on k.id = d.khach_hang_id
  where upper(d.ma_dat_ban) = upper(btrim(p_ma))
    and k.sdt = v_sdt
    and d.ngay >= hom_nay_vn()
  for update;

  if not found then
    perform ghi_nhat_ky_tra_cuu(p_ip, p_ma, false);
    return false;
  end if;

  if v_dat.trang_thai in ('da_den', 'khong_den', 'da_huy') then
    raise exception 'Đặt bàn này không huỷ được nữa, vui lòng gọi nhà hàng'
      using errcode = 'check_violation';
  end if;

  update dat_ban
  set trang_thai = 'da_huy',
      ghi_chu = coalesce(ghi_chu || ' · ', '') || 'Khách tự huỷ'
                || coalesce(': ' || p_ly_do, '')
  where id = v_dat.id;

  perform ghi_nhat_ky_tra_cuu(p_ip, p_ma, true);
  return true;
end;
$$;


-- =============================================================================
-- 5 · ĐO LƯỜNG WEBSITE
-- =============================================================================
-- Kế hoạch IMC mục 7 nói rõ ba con số KHÔNG được đánh đồng:
--   yêu cầu đã nhận  ≠  nhà hàng đã xác nhận  ≠  khách thực đến
--
-- Enum dưới đây CỐ Ý không có 'da_xac_nhan' và 'da_den'. Hai việc đó không
-- xảy ra trên website — chúng chỉ sống ở dat_ban.trang_thai và do người thật
-- ghi nhận. Một enum thiếu chúng là cách rẻ nhất để không ai vô tình trộn
-- "khách bấm nút" với "khách tới ăn".
--
-- VÌ SAO ĐỂ TRONG POSTGRES CHỨ KHÔNG DÙNG CÔNG CỤ NGOÀI:
--   1. Phễu chỉ có nghĩa khi nối được với dat_ban.trang_thai, mà trạng thái
--      đó do nhân viên ghi trong CRM. Công cụ ngoài nắm nửa trên của phễu,
--      database nắm nửa dưới — và việc đối chiếu hai nguồn CHÍNH LÀ cách ba
--      con số bị trộn lẫn.
--   2. NĐ 13/2023: một thẻ đo của bên thứ ba là chuyển dữ liệu ra nước ngoài,
--      kéo theo cả một lớp xin phép mới trên một dự án vốn đã có sổ đồng ý
--      rất cẩn thận cho đúng một mục đích.
--   3. Dòng đầu tiên của README là Beeftown sở hữu 100% dữ liệu khách.
--
-- KHÔNG LƯU IP cho đo lường. dat_ban và nhat_ky_dong_y lưu inet vì đó là bằng
-- chứng pháp lý về sự đồng ý; đếm lượt mở thực đơn thì không phải. Băm IP có
-- muối cũng vẫn là dữ liệu cá nhân mặc áo — không gian 32 bit quá nhỏ.
-- =============================================================================
create type su_kien_web_loai as enum (
  'xem_trang',
  'mo_thuc_don',
  'bam_chi_duong',
  'bam_goi_dien',
  'bam_facebook',
  'bam_instagram',
  'bam_tiktok',
  'bam_zalo',
  'mo_form_dat_ban',
  'gui_form_dat_ban',
  'mo_tuyen_dung',
  'gui_ho_so'
);

create table su_kien_web (
  id     uuid primary key default gen_random_uuid(),
  loai   su_kien_web_loai not null,
  chi_nhanh_id uuid references chi_nhanh(id) on delete set null,

  trang     text,
  ngon_ngu  text,
  phien_id  uuid,        -- ngẫu nhiên mỗi lượt truy cập. KHÔNG có IP.
  ket_qua   text,        -- 'thanh_cong' | 'het_cho' | 'loi' cho các sự kiện gửi

  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  trang_gioi_thieu text,

  created_at timestamptz not null default now(),
  ngay       date not null default hom_nay_vn()
);

create index su_kien_web_ngay_idx  on su_kien_web(ngay, loai);
create index su_kien_web_phien_idx on su_kien_web(phien_id, created_at desc)
  where phien_id is not null;

alter table su_kien_web enable row level security;
create policy su_kien_web_doc on su_kien_web
  for select using (co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]));


create or replace function ghi_su_kien_web(
  p_loai         text,
  p_trang        text default null,
  p_phien        uuid default null,
  p_chi_nhanh_ma text default null,
  p_ngon_ngu     text default null,
  p_ket_qua      text default null,
  p_utm_source   text default null,
  p_utm_medium   text default null,
  p_utm_campaign text default null,
  p_trang_gioi_thieu text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dem int;
  v_cn  uuid;
begin
  -- Trần thô để một trang bị lỗi vòng lặp không làm ngập bảng.
  if p_phien is not null then
    select count(*) into v_dem from su_kien_web
    where phien_id = p_phien and created_at > now() - interval '1 minute';
    if v_dem >= 60 then
      return;
    end if;
  end if;

  if p_chi_nhanh_ma is not null then
    select id into v_cn from chi_nhanh where lower(ma) = lower(p_chi_nhanh_ma);
  end if;

  insert into su_kien_web (loai, chi_nhanh_id, trang, ngon_ngu, phien_id, ket_qua,
                           utm_source, utm_medium, utm_campaign, trang_gioi_thieu)
  values (p_loai::su_kien_web_loai, v_cn, left(p_trang, 200), left(p_ngon_ngu, 5),
          p_phien, left(p_ket_qua, 20),
          left(p_utm_source, 100), left(p_utm_medium, 100),
          left(p_utm_campaign, 100), left(p_trang_gioi_thieu, 300));
exception
  when invalid_text_representation then
    -- Loại sự kiện lạ thì bỏ qua, không làm hỏng trang của khách.
    return;
end;
$$;


-- -----------------------------------------------------------------------------
-- PHIẾU ĐO RA MẮT — ba con số đứng riêng, có chú giải đi kèm
-- -----------------------------------------------------------------------------
-- Cùng khuôn bốn cột với chi_so_crm() để bảng điều khiển vẽ chung một thành
-- phần. Cột dien_giai không phải trang trí: nó là chỗ ghi thẳng rằng ba con
-- số cuối KHÁC NHAU, ngay cạnh chính ba con số đó.
-- -----------------------------------------------------------------------------
create or replace function phieu_do_launch(
  p_tu  date default (hom_nay_vn() - 30),
  p_den date default hom_nay_vn(),
  p_chi_nhanh_ma text default null
)
returns table (
  chi_so    text,
  gia_tri   numeric,
  don_vi    text,
  dien_giai text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cn uuid;
begin
  if not co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]) then
    raise exception 'Không có quyền xem phiếu đo'
      using errcode = 'insufficient_privilege';
  end if;

  if p_chi_nhanh_ma is not null then
    select id into v_cn from chi_nhanh where lower(ma) = lower(p_chi_nhanh_ma);
  end if;

  return query
  with sk as (
    select loai, count(*) as n
    from su_kien_web
    where ngay between p_tu and p_den
      and (v_cn is null or chi_nhanh_id = v_cn)
    group by loai
  ),
  db as (
    select
      count(*) as yeu_cau,
      count(*) filter (where trang_thai in ('da_xac_nhan','da_den')) as xac_nhan,
      count(*) filter (where trang_thai = 'da_den') as den
    from dat_ban
    where ngay between p_tu and p_den
      and (v_cn is null or chi_nhanh_id = v_cn)
  )
  select 'luot_xem_trang'::text,
         coalesce((select n from sk where loai = 'xem_trang'), 0)::numeric,
         'lượt'::text,
         'Lượt mở trang. Không phải số người.'::text
  union all
  select 'mo_thuc_don',
         coalesce((select n from sk where loai = 'mo_thuc_don'), 0)::numeric,
         'lượt', 'Khách bấm xem thực đơn.'
  union all
  select 'bam_chi_duong',
         coalesce((select n from sk where loai = 'bam_chi_duong'), 0)::numeric,
         'lượt', 'Bấm mở chỉ đường. Ý định đi tới, chưa phải đã tới.'
  union all
  select 'bam_goi_dien',
         coalesce((select n from sk where loai = 'bam_goi_dien'), 0)::numeric,
         'lượt', 'Bấm số điện thoại. Không biết cuộc gọi có kết nối không.'
  union all
  select 'bam_mang_xa_hoi',
         coalesce((select sum(n) from sk
                   where loai in ('bam_facebook','bam_instagram','bam_tiktok','bam_zalo')), 0)::numeric,
         'lượt', 'Bấm sang Facebook, Instagram, TikTok hoặc Zalo.'
  union all
  select 'gui_ho_so',
         coalesce((select n from sk where loai = 'gui_ho_so'), 0)::numeric,
         'lượt', 'Hồ sơ ứng tuyển đã gửi.'
  union all
  -- Ba con số dưới đây là BA VIỆC KHÁC NHAU. Đừng cộng, đừng thay thế nhau.
  select 'yeu_cau_dat_ban', (select yeu_cau from db)::numeric, 'yêu cầu',
         'Hệ thống đã NHẬN yêu cầu. KHÔNG có nghĩa là đã có bàn.'
  union all
  select 'da_xac_nhan', (select xac_nhan from db)::numeric, 'yêu cầu',
         'Nhân viên đã gọi và XÁC NHẬN. Đây mới là bàn đã giữ.'
  union all
  select 'khach_da_den', (select den from db)::numeric, 'nhóm',
         'Nhóm THỰC ĐẾN. Đây là con số duy nhất nói về người ngồi vào bàn.';
end;
$$;


create or replace function don_dep_su_kien_web()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_so int;
begin
  if co_phien_dang_nhap() and not co_vai_tro(array['chu_so_huu']::vai_tro[]) then
    raise exception 'Chỉ chủ sở hữu mới dọn được dữ liệu đo lường'
      using errcode = 'insufficient_privilege';
  end if;

  with da_xoa as (
    delete from su_kien_web where ngay < hom_nay_vn() - 90 returning 1)
  select count(*) into v_so from da_xoa;
  return v_so;
end;
$$;

comment on function don_dep_su_kien_web is
  'Xóa sự kiện quá 90 ngày. Chỉ thu dữ liệu cho đúng mục đích đã nêu, và không giữ lâu hơn mức cần.';


-- =============================================================================
-- CHỐT QUYỀN — danh sách công khai ĐẦY ĐỦ VÀ CUỐI CÙNG
-- =============================================================================
-- Danh sách này được chép lại thành một hằng số trong test/test-an-toan.mjs.
-- Câu DDL nói ý định; bài test mới là thứ chứng minh.
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on all functions in schema public from public';
    execute 'revoke execute on all functions in schema public from anon';

    -- Đặt bàn
    execute 'grant execute on function tao_dat_ban(text,text,text,date,time,smallint,text,text,boolean,text,text,text,text,inet) to anon';
    execute 'grant execute on function lich_trong_theo_ma(text,date) to anon';
    execute 'grant execute on function chi_nhanh_cong_khai() to anon';
    execute 'grant execute on function tra_cuu_dat_ban(text,text,inet) to anon';
    execute 'grant execute on function ghi_nhat_ky_tra_cuu(inet,text,boolean) to anon';
    execute 'grant execute on function huy_dat_ban(text,text,text,inet) to anon';

    -- Nội dung
    execute 'grant execute on function noi_dung_cong_khai(text) to anon';
    execute 'grant execute on function thuc_don_cong_khai(text) to anon';

    -- Tuyển dụng
    execute 'grant execute on function tin_tuyen_dung_cong_khai(text) to anon';
    execute 'grant execute on function xin_phieu_tai_cv(inet) to anon';
    execute 'grant execute on function nop_ho_so_ung_tuyen(text,text,text,text,smallint,text,text,text[],uuid,text,boolean,text,int,text,text,inet) to anon';

    -- Đo lường
    execute 'grant execute on function ghi_su_kien_web(text,text,uuid,text,text,text,text,text,text,text) to anon';

    -- ĐÃ BỎ khỏi danh sách công khai, cố ý:
    --   lich_trong_theo_ngay(uuid,date)  — anon không có cách lấy uuid, và
    --   so_ban_con_trong(uuid,date,time) — trả về SỐ bàn, là một oracle sức
    --                                       chứa. Dùng lich_trong_theo_ma().
  end if;
end
$$;
