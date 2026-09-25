-- =============================================================================
-- BEEFTOWN CRM — 0010 · CỔNG NỘI DUNG
-- Mỗi dữ kiện công khai là một dòng có công tắc riêng
-- =============================================================================
-- VẤN ĐỀ CẦN GIẢI
--
-- Kế hoạch ra mắt giao khoảng hai mươi đầu việc web, và việc nào cũng lặp lại
-- đúng một câu: chỉ đăng thứ đã được người thật xác nhận. Website nháp hiện
-- tại làm theo cách sai — viết sẵn nội dung vào HTML rồi trông chờ ai đó nhớ
-- xóa trước khi phát hành. Kết quả là hotline 0900 000 001, địa chỉ
-- [số nhà], [tên đường], bốn đánh giá khách bịa và sáu mức giá chưa duyệt đều
-- đang nằm sẵn trong file chờ được đẩy lên.
--
-- CÁCH LÀM Ở ĐÂY
--
-- Dữ kiện nằm trong database, mỗi dữ kiện một công tắc. Trang công khai đọc
-- qua ĐÚNG MỘT hàm security definer chỉ trả về dòng đã công bố. Bản nháp nằm
-- cùng bảng nhưng vai anon không có quyền vào bảng — nên không tồn tại đường
-- nào để ngày khai trương chưa duyệt lọt ra ngoài.
--
-- BÀI KIỂM TRA THIẾT KẾ: tắt hết công tắc thì trang vẫn chạy đúng và nói
-- thật. Phần nền — tên, khẩu hiệu, "nhà hàng chuyên bò tại Quận 1" — nằm
-- trong mã nguồn và không có công tắc. Công tắc CHỈ THÊM dữ kiện vào phần
-- nền, không bao giờ trừ đi.
-- =============================================================================


-- =============================================================================
-- KIỂU DỮ LIỆU CỦA MỘT DỮ KIỆN
-- =============================================================================
create type kieu_cong_bo as enum (
  'van_ban',  -- câu chữ, có bản tiếng Anh kèm theo
  'ngay',     -- ngày khai trương, ngày treo bạt
  'so',
  'bool',     -- công tắc bật/tắt một khối nội dung
  'url',      -- bắt buộc https
  'sdt',      -- chạy qua chuẩn hóa số điện thoại sẵn có
  'tep'       -- trỏ tới một dòng trong tep_anh
);


-- =============================================================================
-- SỔ ĐĂNG KÝ KHÓA — danh sách đóng
-- =============================================================================
-- Vì sao phải có bảng này thay vì cho phép khóa tự do: gõ sai tên khóa sẽ là
-- lỗi khóa ngoại NGAY LÚC GHI, chứ không phải một ô trống im lặng trên trang
-- chủ mà ba tuần sau mới có người để ý.
--
-- Cặp (khoa, kieu) là unique để bảng noi_dung_cong_bo tham chiếu được bằng
-- khóa ngoại ghép. Đó là mẹo cho phép ràng buộc CHECK trong cùng một dòng
-- nhìn thấy được kiểu đã khai báo của khóa — nhờ vậy KHÔNG THỂ lưu một ngày
-- dưới một khóa kiểu URL.
-- =============================================================================
create table khoa_cong_bo (
  khoa           text primary key,
  kieu           kieu_cong_bo not null,
  nhom           text not null,   -- 'lich' | 'lien_he' | 'trang_thai' | 'chia_se' | 'khoi'
  mo_ta          text not null,   -- VÌ SAO khóa này tồn tại, viết cho người không rành kỹ thuật
  bat_buoc       boolean not null default false,  -- thiếu = chưa đủ để khai trương
  chi_chu_so_huu boolean not null default false,  -- chỉ chủ sở hữu được công bố
  thu_tu         smallint not null default 0,

  unique (khoa, kieu)
);

comment on table khoa_cong_bo is
  'Danh sách đóng các dữ kiện có thể công bố. Thêm khóa mới ở đây trước, rồi mới dùng được.';


-- =============================================================================
-- NỘI DUNG CÔNG BỐ — ghi thêm, không sửa đè
-- =============================================================================
-- Đổi ngày khai trương = THÊM một dòng mới và thu hồi dòng cũ, chứ không sửa
-- tại chỗ. Lý do không phải là sở thích kiến trúc:
--
--   · Khi ngày khai trương bị dời — và nó sẽ bị dời — thứ cần nhất là gỡ dữ
--     kiện sai KHỎI TRANG trong vài giây, chứ không phải chờ soạn xong bản
--     thay thế. Nên da_thu_hoi là một trạng thái đứng riêng, không phải hệ
--     quả phụ của việc sửa.
--   · Sửa tại chỗ nghĩa là một dòng UPDATE âm thầm tái công bố. Bất biến
--     "chỉ đăng thứ đã duyệt" chết lặng lẽ ngay lúc đó.
--   · Cùng triết lý với so_cai_diem và nhat_ky_dong_y: cái gì có hệ quả ra
--     bên ngoài thì chỉ ghi thêm.
-- =============================================================================
create table noi_dung_cong_bo (
  id       uuid primary key default gen_random_uuid(),
  khoa     text not null,
  kieu     kieu_cong_bo not null,   -- phi chuẩn hóa CÓ CHỦ Ý: CHECK cùng dòng cần nó

  gia_tri_text    text,
  gia_tri_text_en text,             -- chỉ dùng cho kieu = 'van_ban'
  gia_tri_ngay    date,
  gia_tri_so      bigint,
  gia_tri_bool    boolean,
  gia_tri_tep_id  uuid references tep_anh(id) on delete restrict,

  trang_thai trang_thai_cong_bo not null default 'nhap',

  -- Lên sóng và hạ sóng theo lịch. Dùng timestamptz so với now() nên không
  -- dính lỗi múi giờ; giao diện nội bộ nhập theo giờ Việt Nam.
  hien_tu    timestamptz,
  hien_den   timestamptz,

  ly_do       text,   -- vì sao đổi — đọc lại sau sáu tháng vẫn hiểu
  nguoi_tao   uuid references nhan_su(id) on delete set null,
  nguoi_duyet uuid references nhan_su(id) on delete set null,
  duyet_luc   timestamptz,
  cong_bo_luc timestamptz,
  thu_hoi_luc timestamptz,
  created_at  timestamptz not null default now(),

  foreign key (khoa, kieu) references khoa_cong_bo(khoa, kieu),

  -- Đúng kiểu, và các cột giá trị khác phải rỗng. Không dùng jsonb chính vì
  -- jsonb nhận "2026-11-1" và "0900 000 001" một cách vui vẻ, trong khi tiền
  -- đề của bảng này là database phải TỪ CHỐI giữ một dữ kiện sai định dạng.
  constraint cong_bo_dung_kieu check (
    case kieu
      when 'ngay' then gia_tri_ngay is not null
                   and gia_tri_text is null and gia_tri_text_en is null
                   and gia_tri_so is null and gia_tri_bool is null
                   and gia_tri_tep_id is null
      when 'bool' then gia_tri_bool is not null
                   and gia_tri_text is null and gia_tri_text_en is null
                   and gia_tri_ngay is null and gia_tri_so is null
                   and gia_tri_tep_id is null
      when 'so'   then gia_tri_so is not null
                   and gia_tri_text is null and gia_tri_text_en is null
                   and gia_tri_ngay is null and gia_tri_bool is null
                   and gia_tri_tep_id is null
      when 'tep'  then gia_tri_tep_id is not null
                   and gia_tri_text is null and gia_tri_text_en is null
                   and gia_tri_ngay is null and gia_tri_so is null
                   and gia_tri_bool is null
      when 'url'  then gia_tri_text ~ '^https://[^ ]+$'
                   and gia_tri_text_en is null
                   and gia_tri_ngay is null and gia_tri_so is null
                   and gia_tri_bool is null and gia_tri_tep_id is null
      when 'sdt'  then sdt_hop_le(chuan_hoa_sdt(gia_tri_text))
                   and gia_tri_text_en is null
                   and gia_tri_ngay is null and gia_tri_so is null
                   and gia_tri_bool is null and gia_tri_tep_id is null
      when 'van_ban' then not la_van_ban_tam(gia_tri_text)
                   and (gia_tri_text_en is null or not la_van_ban_tam(gia_tri_text_en))
                   and gia_tri_ngay is null and gia_tri_so is null
                   and gia_tri_bool is null and gia_tri_tep_id is null
    end),

  constraint cong_bo_khung_gio_hop_le check (
    hien_den is null or hien_tu is null or hien_den > hien_tu)
);

-- Đúng MỘT bản đang sống cho mỗi khóa. Muốn đổi thì phải thu hồi bản cũ trước.
create unique index cong_bo_dang_song_idx on noi_dung_cong_bo(khoa)
  where trang_thai = 'da_cong_bo';

create index cong_bo_khoa_idx on noi_dung_cong_bo(khoa, created_at desc);

comment on table noi_dung_cong_bo is
  'Các phiên bản của từng dữ kiện công khai. Chỉ ghi thêm — đổi giá trị nghĩa là thêm dòng mới và thu hồi dòng cũ.';


-- -----------------------------------------------------------------------------
-- VÒNG ĐỜI — cưỡng chế bằng trigger, không phải bằng quy ước
-- -----------------------------------------------------------------------------
-- nhap → da_duyet → da_cong_bo → da_thu_hoi. Không đi ngược. da_thu_hoi là
-- trạng thái cuối.
--
-- Quyền công bố phụ thuộc TRẠNG THÁI ĐÍCH chứ không phụ thuộc bảng hay dòng,
-- nên phải nằm ở trigger chứ không phải ở policy.
-- -----------------------------------------------------------------------------
create or replace function noi_dung_cong_bo_kiem_tra()
returns trigger
language plpgsql
as $$
declare
  v_khoa khoa_cong_bo;
begin
  select * into v_khoa from khoa_cong_bo where khoa = new.khoa;

  if tg_op = 'INSERT' then
    -- Người dùng thật LUÔN phải bắt đầu từ bản nháp.
    --
    -- Ngoại lệ duy nhất là khi không có phiên đăng nhập (auth.uid() null):
    -- đó là đường của migration, seed và service_role — những chủ thể vốn đã
    -- toàn quyền trên database, nên chặn ở đây không bảo vệ thêm được gì mà
    -- chỉ làm seed không chạy được.
    if new.trang_thai <> 'nhap' and co_phien_dang_nhap() then
      raise exception 'Dòng mới phải bắt đầu ở trạng thái nhap'
        using errcode = 'check_violation';
    end if;
    if new.trang_thai = 'da_cong_bo' then
      new.cong_bo_luc := coalesce(new.cong_bo_luc, now());
    end if;
    return new;
  end if;

  -- Giá trị của một dòng ĐÃ CÔNG BỐ là bất biến. Muốn đổi thì thu hồi rồi
  -- thêm dòng mới — nếu không, một câu UPDATE sẽ âm thầm tái công bố.
  if old.trang_thai = 'da_cong_bo' then
    if new.khoa <> old.khoa
       or new.kieu <> old.kieu
       or new.gia_tri_text    is distinct from old.gia_tri_text
       or new.gia_tri_text_en is distinct from old.gia_tri_text_en
       or new.gia_tri_ngay    is distinct from old.gia_tri_ngay
       or new.gia_tri_so      is distinct from old.gia_tri_so
       or new.gia_tri_bool    is distinct from old.gia_tri_bool
       or new.gia_tri_tep_id  is distinct from old.gia_tri_tep_id then
      raise exception 'Không sửa được giá trị đã công bố. Hãy thu hồi rồi thêm dòng mới.'
        using errcode = 'restrict_violation';
    end if;
  end if;

  if new.trang_thai <> old.trang_thai then
    if not (
         (old.trang_thai = 'nhap'       and new.trang_thai = 'da_duyet')
      or (old.trang_thai = 'da_duyet'   and new.trang_thai = 'da_cong_bo')
      or (old.trang_thai = 'da_duyet'   and new.trang_thai = 'nhap')
      or (old.trang_thai = 'da_cong_bo' and new.trang_thai = 'da_thu_hoi')
    ) then
      raise exception 'Không chuyển được trạng thái từ % sang %', old.trang_thai, new.trang_thai
        using errcode = 'check_violation';
    end if;

    if new.trang_thai = 'da_cong_bo' then
      -- Cùng lý do như nhánh INSERT: không có phiên đăng nhập nghĩa là
      -- migration hoặc service_role, không phải người dùng cần kiểm quyền.
      if co_phien_dang_nhap() then
        if v_khoa.chi_chu_so_huu then
          if not la_chu_so_huu() then
            raise exception 'Khóa % chỉ chủ sở hữu mới được công bố', new.khoa
              using errcode = 'insufficient_privilege';
          end if;
        elsif not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
          raise exception 'Không có quyền công bố nội dung'
            using errcode = 'insufficient_privilege';
        end if;
      end if;
      new.cong_bo_luc := coalesce(new.cong_bo_luc, now());
    end if;

    if new.trang_thai = 'da_duyet' then
      new.duyet_luc := coalesce(new.duyet_luc, now());
    end if;

    if new.trang_thai = 'da_thu_hoi' then
      new.thu_hoi_luc := coalesce(new.thu_hoi_luc, now());
    end if;
  end if;

  return new;
end;
$$;

create trigger noi_dung_cong_bo_kiem_tra_trigger
  before insert or update on noi_dung_cong_bo
  for each row execute function noi_dung_cong_bo_kiem_tra();


-- =============================================================================
-- ĐƯỜNG ĐỌC DUY NHẤT CHO WEBSITE
-- =============================================================================
-- Trả về TOÀN BỘ khóa trong sổ đăng ký; khóa chưa công bố có giá trị null.
--
-- Vì sao trả đủ mọi khóa thay vì chỉ khóa đã công bố: front-end cần phân biệt
-- được hai tình huống rất khác nhau —
--   · thuộc tính THIẾU HẲN  → gõ sai tên khóa, là lỗi lập trình;
--   · thuộc tính CÓ, giá trị null → chưa duyệt, hiện bản dự phòng.
-- Nếu chỉ trả khóa đã công bố thì hai tình huống trông giống hệt nhau, và
-- một lỗi chính tả sẽ lặng lẽ biến thành một khoảng trống trên trang chủ.
--
-- Vì sao là HÀM security definer chứ không phải policy cho anon đọc bảng:
--   · Bản nháp nằm CÙNG BẢNG. Mở quyền đọc ở mức dòng nghĩa là đặt cược toàn
--     bộ bí mật ngày khai trương vào một mệnh đề WHERE trong policy.
--   · test-phan-quyen.mjs mục 6 khẳng định "anon lỗi khi đụng vào MỌI bảng".
--     Giữ một bất biến đúng thì rẻ hơn giữ hai.
-- =============================================================================
create or replace function noi_dung_cong_khai(p_ngon_ngu text default 'vi')
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_object_agg(k.khoa, v.gia_tri), '{}'::jsonb)
  from khoa_cong_bo k
  left join lateral (
    select case n.kieu
             when 'ngay' then to_jsonb(n.gia_tri_ngay)
             when 'bool' then to_jsonb(n.gia_tri_bool)
             when 'so'   then to_jsonb(n.gia_tri_so)
             when 'tep'  then jsonb_build_object(
                                'url',       t.duong_dan,
                                'bucket',    t.bucket,
                                'alt',       case when p_ngon_ngu = 'en'
                                                  then coalesce(t.alt_en, t.alt_vi)
                                                  else t.alt_vi end,
                                'chu_thich', t.chu_thich,
                                'nguon',     t.nguon_that,
                                'rong',      t.rong,
                                'cao',       t.cao)
             when 'van_ban' then to_jsonb(
                                case when p_ngon_ngu = 'en'
                                     then coalesce(n.gia_tri_text_en, n.gia_tri_text)
                                     else n.gia_tri_text end)
             else to_jsonb(n.gia_tri_text)
           end as gia_tri
    from noi_dung_cong_bo n
    left join tep_anh t on t.id = n.gia_tri_tep_id
    where n.khoa = k.khoa
      and n.trang_thai = 'da_cong_bo'
      and now() >= coalesce(n.hien_tu,  '-infinity'::timestamptz)
      and now() <  coalesce(n.hien_den, 'infinity'::timestamptz)
    limit 1
  ) v on true;
$$;

comment on function noi_dung_cong_khai is
  'Đường đọc DUY NHẤT của website vào nội dung công bố. Trả đủ mọi khóa trong sổ đăng ký; khóa chưa duyệt có giá trị null.';


-- -----------------------------------------------------------------------------
-- ĐỌC MỘT CÔNG TẮC — dùng trong ràng buộc nghiệp vụ
-- -----------------------------------------------------------------------------
-- Tách riêng khỏi noi_dung_cong_khai() vì hàm kia gom cả sổ đăng ký thành
-- jsonb, quá nặng để gọi trong mỗi lượt đặt bàn.
-- -----------------------------------------------------------------------------
create or replace function cong_tac_bat(p_khoa text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select n.gia_tri_bool
    from noi_dung_cong_bo n
    where n.khoa = p_khoa
      and n.kieu = 'bool'
      and n.trang_thai = 'da_cong_bo'
      and now() >= coalesce(n.hien_tu,  '-infinity'::timestamptz)
      and now() <  coalesce(n.hien_den, 'infinity'::timestamptz)
    limit 1
  ), false);
$$;

comment on function cong_tac_bat is
  'True chỉ khi công tắc đã được công bố VÀ đang bật. Chưa công bố = tắt.';


-- -----------------------------------------------------------------------------
-- CÒN THIẾU GÌ TRƯỚC KHI KHAI TRƯƠNG — checklist dưới dạng truy vấn
-- -----------------------------------------------------------------------------
create view v_cong_bo_con_thieu with (security_invoker = true) as
select k.khoa, k.nhom, k.mo_ta, k.chi_chu_so_huu
from khoa_cong_bo k
where k.bat_buoc
  and not exists (
    select 1 from noi_dung_cong_bo n
    where n.khoa = k.khoa and n.trang_thai = 'da_cong_bo')
order by k.thu_tu;

comment on view v_cong_bo_con_thieu is
  'Các dữ kiện bắt buộc chưa được công bố. Rỗng = website đã đủ thông tin để khai trương.';


-- =============================================================================
-- CÔNG TẮC ĐẶT BÀN PHẢI CÓ HIỆU LỰC THẬT
-- =============================================================================
-- Không có chốt chặn này thì công tắc chỉ là đồ trang trí: một trang đã nằm
-- trong bộ nhớ đệm của trình duyệt vẫn gọi được RPC và vẫn ghi đặt bàn, kể cả
-- sau khi nhà hàng đã tắt form vì không có người trực.
--
-- Câu báo lỗi là câu MỚI. Không đụng vào các chuỗi cũ mà test đang khớp regex.
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
                       dip, ghi_chu, dong_y_nhan_tin,
                       utm_source, utm_medium, utm_campaign, trang_gioi_thieu)
  values (v_cn.id, v_khach.id, p_ngay, p_gio, p_so_khach,
          p_dip, p_ghi_chu, p_dong_y,
          p_utm_source, p_utm_medium, p_utm_campaign, p_trang_gioi_thieu)
  returning * into v_dat;

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


-- =============================================================================
-- PHÂN QUYỀN
-- =============================================================================
alter table khoa_cong_bo     enable row level security;
alter table noi_dung_cong_bo enable row level security;

create policy khoa_cong_bo_doc on khoa_cong_bo
  for select using (co_phien_dang_nhap());
create policy khoa_cong_bo_sua on khoa_cong_bo
  for all using (la_chu_so_huu()) with check (la_chu_so_huu());

create policy noi_dung_doc on noi_dung_cong_bo
  for select using (co_phien_dang_nhap());

-- Ba vai trò nội dung soạn được bản nháp. Chỉ trigger mới quyết định ai được
-- đẩy lên da_cong_bo — vì luật đó phụ thuộc trạng thái đích.
create policy noi_dung_them on noi_dung_cong_bo
  for insert with check (
    co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])
    and trang_thai = 'nhap');

create policy noi_dung_sua on noi_dung_cong_bo
  for update using (
    co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]));

-- Xóa được bản nháp chưa ai duyệt. Từ da_duyet trở đi thì phải để lại vết.
create policy noi_dung_xoa on noi_dung_cong_bo
  for delete using (
    trang_thai = 'nhap'
    and co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]));


-- =============================================================================
-- SEED SỔ ĐĂNG KÝ
-- =============================================================================
-- CHỈ MỘT dòng được seed ở trạng thái da_cong_bo: form_dat_ban_dang_mo = true,
-- để 8 kiểm tra đặt bàn sẵn có trong hai file test cũ không bị hỏng.
--
-- Mọi khóa còn lại chỉ có mặt trong sổ đăng ký, chưa có giá trị nào. Nghĩa là
-- ngay sau khi chạy migration: không ngày khai trương, không hotline, không
-- mạng xã hội, không đánh giá khách. Đó chính là bất biến, được thể hiện bằng
-- dữ liệu chứ không bằng lời hứa.
-- =============================================================================
insert into khoa_cong_bo (khoa, kieu, nhom, mo_ta, bat_buoc, chi_chu_so_huu, thu_tu) values
  -- --- Lịch ------------------------------------------------------------------
  ('ngay_khai_truong', 'ngay', 'lich',
   'Ngày mở cửa chính thức. Chưa chốt bằng văn bản thì KHÔNG công bố — đổi ngày sau khi đã đăng là rủi ro lớn nhất của cả dự án.',
   true, true, 10),
  ('ngay_treo_bang_ron', 'ngay', 'lich',
   'Ngày treo bạt thi công. Dùng để hẹn giờ lên sóng cho khối địa chỉ.',
   false, true, 20),

  -- --- Trạng thái và công tắc khối --------------------------------------------
  ('dong_trang_thai', 'van_ban', 'trang_thai',
   'Một câu nói nhà hàng đang ở giai đoạn nào. Cần đổi định kỳ — câu đứng yên ba tháng khiến trang trông như bị bỏ hoang.',
   true, false, 30),
  ('form_dat_ban_dang_mo', 'bool', 'trang_thai',
   'Bật form đặt bàn. CHỈ bật khi đã có người trực trả lời VÀ đã nhập bàn thật vào ban_an.',
   true, true, 40),
  ('gio_phuc_vu_da_chot', 'bool', 'trang_thai',
   'Giờ phục vụ đã được xác nhận. Tắt thì website không hiện giờ, dù bảng chi_nhanh vẫn có giá trị mặc định.',
   true, true, 50),
  ('hien_thuc_don', 'bool', 'khoi',
   'Hiện khối thực đơn.',
   false, false, 60),
  ('hien_do_uong_co_con', 'bool', 'khoi',
   'Hiện đồ uống có cồn. Luật quảng cáo rượu bia có giới hạn riêng — tắt là mặc định an toàn.',
   false, true, 70),
  ('hien_tuyen_dung', 'bool', 'khoi',
   'Hiện cổng tuyển dụng.',
   false, false, 80),
  ('hien_ba_buoc', 'bool', 'khoi',
   'Hiện khối hướng dẫn ba bước chọn món.',
   false, false, 90),
  ('hien_quay_thit', 'bool', 'khoi',
   'Hiện khối công việc phía sau quầy bò.',
   false, false, 100),
  ('hien_tiec_nhom', 'bool', 'khoi',
   'Hiện khối bữa nhóm và công ty.',
   false, false, 110),
  ('hien_danh_gia', 'bool', 'khoi',
   'Hiện đánh giá khách. Chỉ bật khi có review THẬT và được phép dùng — trang nháp cũ đang có bốn đánh giá bịa.',
   false, true, 120),

  -- --- Liên hệ ---------------------------------------------------------------
  ('dia_chi_hien_thi', 'van_ban', 'lien_he',
   'Địa chỉ đầy đủ như khách đọc được. Chỉ công bố khi đã đối chiếu hợp đồng thuê.',
   true, false, 130),
  ('hotline', 'sdt', 'lien_he',
   'Số điện thoại nhà hàng. Chỉ công bố khi có người thật nghe máy trong giờ đã công bố.',
   false, true, 140),
  ('facebook_url', 'url', 'lien_he',
   'Trang Facebook chính thức. Đây là nút bấm chính của trang ra mắt — phải là trang đã có ảnh bìa và bài đăng.',
   true, false, 150),
  ('instagram_url', 'url', 'lien_he', 'Trang Instagram chính thức.', false, false, 160),
  ('tiktok_url',    'url', 'lien_he', 'Kênh TikTok chính thức.',     false, false, 170),
  ('zalo_oa_url',   'url', 'lien_he', 'Zalo OA chính thức.',         false, false, 180),
  ('google_maps_url', 'url', 'lien_he',
   'Link chỉ đường Google Maps. Phải bấm thử trên điện thoại thật trước khi công bố.',
   false, false, 190),
  ('email_lien_he', 'van_ban', 'lien_he',
   'Hộp thư có người đọc. Dùng làm đường lui khi chưa có hotline.',
   false, false, 200),

  -- --- Chia sẻ link ----------------------------------------------------------
  ('tieu_de_og', 'van_ban', 'chia_se',
   'Tiêu đề hiện ra khi dán link vào Zalo hoặc Facebook.',
   false, false, 210),
  ('mo_ta_og', 'van_ban', 'chia_se',
   'Một dòng mô tả hiện kèm khi chia sẻ link.',
   false, false, 220),
  ('anh_chia_se', 'tep', 'chia_se',
   'Ảnh hiện khi chia sẻ link. Thiếu ảnh này thì link dán vào Zalo chỉ ra một dòng chữ xanh trơ.',
   true, false, 230);

-- Công tắc đặt bàn: bật sẵn để giữ nguyên hành vi mà hai file test cũ đang
-- kiểm. Trên môi trường thật, hãy TẮT cho tới khi có người trực.
insert into noi_dung_cong_bo (khoa, kieu, gia_tri_bool, trang_thai, ly_do, cong_bo_luc)
values ('form_dat_ban_dang_mo', 'bool', true, 'da_cong_bo',
        'Mặc định khi cài đặt. Hãy tắt cho tới khi có người trực nhận yêu cầu.', now());


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
  end if;
end
$$;
