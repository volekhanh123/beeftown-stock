-- =============================================================================
-- BEEFTOWN CRM — 0026 · MỖI TIN TUYỂN DỤNG TỰ CHỌN FORM HỎI NHỮNG GÌ
-- =============================================================================
-- (0017–0024 đã có chủ ở các nhánh làm song song, 0025 là bản vá quyền kiểm
-- vé tải CV — nên file này là 0026. Trước đây đánh số 0025; đổi 25/09/2026.)
--
-- VẤN ĐỀ
--
-- Form nộp hồ sơ hỏi mọi vị trí cùng một bộ câu: email, năm sinh, ca làm,
-- giới thiệu, kinh nghiệm, file CV. Nhưng không phải vị trí nào cũng cần CV.
-- Quản lý và marketing thì nên có; phục vụ, phụ bếp nộp từ điện thoại và hầu
-- như không có file CV — một ô "đính kèm CV" với họ chỉ thêm một chỗ để ngần
-- ngừ.
--
-- CÁCH LÀM
--
-- Sáu cột hoi_* trên vi_tri_tuyen_dung, mỗi cột một trường TÙY CHỌN của form.
-- Người soạn tin bật/tắt ở /noi-bo/tin-tuyen-dung.
--
--   · Chỉ hai nấc: hỏi / không hỏi. Trường đã hỏi vẫn KHÔNG bắt buộc — đúng
--     ràng buộc 3 ở đầu 0012: bắt đính kèm là tự loại ứng viên thật.
--   · Họ tên, số điện thoại và ô đồng ý không có công tắc. Thiếu hai cái đầu
--     thì không liên lạc được; thiếu cái cuối thì không được phép lưu hồ sơ.
--   · CV mặc định KHÔNG hỏi, mọi trường khác mặc định hỏi — tức giữ nguyên
--     hành vi cũ trừ CV. Bốn tin mẫu quản lý và marketing bật CV sẵn.
--
-- TẮT LÀ KHÔNG LƯU, KHÔNG CHỈ LÀ ẨN
--
-- Form ẩn trường bằng CSS nên trình duyệt cũ vẫn thấy và vẫn gửi lên. Vì thế
-- nop_ho_so_ung_tuyen() bỏ giá trị của mọi trường mà tin không hỏi — không thu
-- nhiều hơn mức cần là nguyên tắc của cả bảng hồ sơ (xem cột nam_sinh ở 0012).
-- Với CV, vé tải lên bị bỏ qua chứ không bị đánh dấu đã dùng.
--
-- tin_tuyen_dung_cong_khai() phải trả thêm sáu cột này cho form, mà Postgres
-- không cho create or replace đổi các cột trả về — nên hàm được drop rồi tạo
-- lại, cùng tên, cùng tham số. Không sinh overload (xem lưu ý 6 ở README), và
-- khối chốt quyền cuối file cấp lại quyền cho anon.
-- =============================================================================

alter table vi_tri_tuyen_dung
  add column hoi_email       boolean not null default true,
  add column hoi_nam_sinh    boolean not null default true,
  add column hoi_ca_lam      boolean not null default true,
  add column hoi_gioi_thieu  boolean not null default true,
  add column hoi_kinh_nghiem boolean not null default true,
  add column hoi_cv          boolean not null default false;

comment on column vi_tri_tuyen_dung.hoi_email is
  'Form của tin này có hỏi email không. Không hỏi thì không lưu, dù có gửi lên.';
comment on column vi_tri_tuyen_dung.hoi_nam_sinh is
  'Form của tin này có hỏi năm sinh không. Không hỏi thì không lưu, dù có gửi lên.';
comment on column vi_tri_tuyen_dung.hoi_ca_lam is
  'Form của tin này có hỏi ca làm được không. Không hỏi thì không lưu, dù có gửi lên.';
comment on column vi_tri_tuyen_dung.hoi_gioi_thieu is
  'Form của tin này có ô giới thiệu bản thân không. Không hỏi thì không lưu, dù có gửi lên.';
comment on column vi_tri_tuyen_dung.hoi_kinh_nghiem is
  'Form của tin này có hỏi kinh nghiệm không. Không hỏi thì không lưu, dù có gửi lên.';
comment on column vi_tri_tuyen_dung.hoi_cv is
  'Form của tin này có ô đính kèm CV không. Có thì vẫn không bắt buộc. Không hỏi thì vé tải CV gửi kèm bị bỏ qua.';

-- Database đã chạy tao_tin_tuyen_dung_mau() trước file này thì bật CV cho
-- đúng bốn tin. Database mới thì bảng còn rỗng; hàm mẫu bên dưới lo phần đó.
update vi_tri_tuyen_dung
set hoi_cv = true
where ma in ('quan-ly-cua-hang', 'quan-ly-sanh', 'to-truong-sanh', 'dau-moi-marketing');


-- =============================================================================
-- TIN MẪU — thêm cột hoi_cv, còn lại chép nguyên văn từ 0012
-- =============================================================================
create or replace function tao_tin_tuyen_dung_mau(p_chi_nhanh_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_so int;
begin
  if co_phien_dang_nhap() and not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
    raise exception 'Chỉ chủ sở hữu hoặc quản lý mới khởi tạo được tin tuyển dụng mẫu'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from chi_nhanh where id = p_chi_nhanh_id) then
    raise exception 'Không tìm thấy chi nhánh %', p_chi_nhanh_id
      using errcode = 'foreign_key_violation';
  end if;

  with da_them as (
    insert into vi_tri_tuyen_dung
      (chi_nhanh_id, ma, ten_vi, ten_en, bo_phan, cap_bac, loai_hop_dong, so_luong, hoi_cv)
    select p_chi_nhanh_id, v.ma, v.ten_vi, v.ten_en, v.bo_phan::bo_phan_tuyen,
           v.cap_bac, v.loai::loai_hop_dong, v.so_luong, v.hoi_cv
    from (values
      ('nhan-vien-sanh',    'Nhân viên sảnh',             'Hall Employee',
       'sanh', 'Hall Crew → Master Beef Specialist (7 bậc)', 'ban_thoi_gian', 8::smallint, false),
      ('to-truong-sanh',    'Tổ trưởng sảnh',             'Floor Leader',
       'sanh', 'Bậc trên nhân viên sảnh', 'toan_thoi_gian', 2::smallint, true),
      ('quan-ly-sanh',      'Quản lý sảnh',               'Floor Manager',
       'quan_ly', 'Hướng lên Quản lý cửa hàng', 'toan_thoi_gian', 1::smallint, true),
      ('quan-ly-cua-hang',  'Quản lý cửa hàng',           'Store Manager',
       'quan_ly', null, 'toan_thoi_gian', 1::smallint, true),
      ('nhan-vien-bep',     'Nhân viên bếp',              'Kitchen Staff',
       'bep', '3 bậc', 'toan_thoi_gian', 4::smallint, false),
      ('nhan-vien-thit',    'Nhân viên bộ phận thịt',     'Meat Department Staff',
       'quay_thit', '3 bậc', 'toan_thoi_gian', 2::smallint, false),
      ('tu-van-quay-thit',  'Nhân viên tư vấn quầy thịt', 'Meat Showcase Sales Assistant',
       'quay_thit', 'Kiêm thao tác POS tại quầy', 'ban_thoi_gian', 2::smallint, false),
      ('dau-moi-marketing', 'Đầu mối marketing',          'Marketing Coordinator',
       'marketing', null, 'ban_thoi_gian', 1::smallint, true)
    ) as v(ma, ten_vi, ten_en, bo_phan, cap_bac, loai, so_luong, hoi_cv)
    where not exists (select 1 from vi_tri_tuyen_dung t where t.ma = v.ma)
    returning 1)
  select count(*) into v_so from da_them;

  return v_so;
end;
$$;


-- =============================================================================
-- TIN CÔNG KHAI — trả thêm sáu cột hoi_* cho form
-- =============================================================================
drop function if exists tin_tuyen_dung_cong_khai(text);

create function tin_tuyen_dung_cong_khai(p_ngon_ngu text default 'vi')
returns table (
  ma            text,
  ten           text,
  bo_phan       bo_phan_tuyen,
  cap_bac       text,
  loai_hop_dong loai_hop_dong,
  so_luong      smallint,
  mo_ta         text,
  yeu_cau       text,
  quyen_loi     text,
  ca_lam        text,
  luong_tu      bigint,
  luong_den     bigint,
  han_nop       date,
  hoi_email       boolean,
  hoi_nam_sinh    boolean,
  hoi_ca_lam      boolean,
  hoi_gioi_thieu  boolean,
  hoi_kinh_nghiem boolean,
  hoi_cv          boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.ma,
    case when p_ngon_ngu = 'en' then coalesce(v.ten_en, v.ten_vi) else v.ten_vi end,
    v.bo_phan,
    v.cap_bac,
    v.loai_hop_dong,
    v.so_luong,
    case when p_ngon_ngu = 'en' then coalesce(v.mo_ta_en, v.mo_ta_vi) else v.mo_ta_vi end,
    case when p_ngon_ngu = 'en' then coalesce(v.yeu_cau_en, v.yeu_cau_vi) else v.yeu_cau_vi end,
    case when p_ngon_ngu = 'en' then coalesce(v.quyen_loi_en, v.quyen_loi_vi) else v.quyen_loi_vi end,
    v.ca_lam,
    -- Ràng buộc bảng đã đảm bảo hai cột này chỉ có giá trị khi đã duyệt.
    v.luong_tu,
    v.luong_den,
    v.han_nop,
    v.hoi_email,
    v.hoi_nam_sinh,
    v.hoi_ca_lam,
    v.hoi_gioi_thieu,
    v.hoi_kinh_nghiem,
    v.hoi_cv
  from vi_tri_tuyen_dung v
  where cong_tac_bat('hien_tuyen_dung')
    and v.trang_thai = 'da_cong_bo'
    and (v.han_nop is null or v.han_nop >= hom_nay_vn())
  order by v.bo_phan, v.ten_vi;
$$;


-- =============================================================================
-- NỘP HỒ SƠ — bỏ giá trị của trường tin không hỏi; còn lại nguyên văn 0012
-- =============================================================================
create or replace function nop_ho_so_ung_tuyen(
  p_vi_tri_ma   text,
  p_ho_ten      text,
  p_sdt         text,
  p_email       text default null,
  p_nam_sinh    smallint default null,
  p_gioi_thieu  text default null,
  p_kinh_nghiem text default null,
  p_ca_lam_duoc text[] default null,
  p_ma_tai_len  uuid default null,
  p_ten_tep     text default null,
  p_dong_y      boolean default false,
  p_bay         text default null,   -- honeypot: bot điền, người không thấy
  p_giay_tren_form int default null,
  p_utm_source   text default null,
  p_utm_campaign text default null,
  p_ip          inet default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vi_tri vi_tri_tuyen_dung;
  v_sdt    text;
  v_dem    int;
  v_phieu  phieu_tai_len;
  v_ma     text;
  v_duong_dan text;
  i        int;
begin
  -- Honeypot và thời gian điền form: bot trượt cả hai. Câu báo lỗi CỐ Ý
  -- chung chung — nói rõ cái nào sai là dạy cho bot cách lách.
  if coalesce(btrim(p_bay), '') <> ''
     or (p_giay_tren_form is not null and p_giay_tren_form < 3) then
    raise exception 'Không gửi được hồ sơ, vui lòng thử lại'
      using errcode = 'check_violation';
  end if;

  if not cong_tac_bat('hien_tuyen_dung') then
    raise exception 'Cổng tuyển dụng đang tạm đóng'
      using errcode = 'check_violation';
  end if;

  if p_ip is not null then
    select count(*) into v_dem from ho_so_ung_tuyen
    where ip = p_ip and created_at > now() - interval '1 hour';
    if v_dem >= 5 then
      raise exception 'Bạn đã nộp quá nhiều hồ sơ, vui lòng liên hệ trực tiếp với nhà hàng'
        using errcode = 'check_violation';
    end if;
  end if;

  select * into v_vi_tri from vi_tri_tuyen_dung
  where ma = p_vi_tri_ma and trang_thai = 'da_cong_bo';
  if not found then
    raise exception 'Không tìm thấy vị trí tuyển dụng %', p_vi_tri_ma
      using errcode = 'foreign_key_violation';
  end if;

  if v_vi_tri.han_nop is not null and v_vi_tri.han_nop < hom_nay_vn() then
    raise exception 'Vị trí này đã hết hạn nhận hồ sơ'
      using errcode = 'check_violation';
  end if;

  -- 0026: trường tin này không hỏi thì không lưu, dù có gửi lên. Form chỉ ẩn
  -- bằng CSS, nên trình duyệt cũ vẫn thấy và vẫn gửi.
  if not v_vi_tri.hoi_email       then p_email       := null; end if;
  if not v_vi_tri.hoi_nam_sinh    then p_nam_sinh    := null; end if;
  if not v_vi_tri.hoi_ca_lam      then p_ca_lam_duoc := null; end if;
  if not v_vi_tri.hoi_gioi_thieu  then p_gioi_thieu  := null; end if;
  if not v_vi_tri.hoi_kinh_nghiem then p_kinh_nghiem := null; end if;
  if not v_vi_tri.hoi_cv then
    -- Vé không bị đánh dấu đã dùng: nó tự hết hạn sau 15 phút.
    p_ma_tai_len := null;
    p_ten_tep    := null;
  end if;

  if not p_dong_y then
    raise exception 'Chưa đồng ý cho Beeftown xử lý thông tin ứng tuyển'
      using errcode = 'check_violation';
  end if;

  v_sdt := chuan_hoa_sdt(p_sdt);
  if not sdt_hop_le(v_sdt) then
    raise exception 'Số điện thoại không hợp lệ: %', p_sdt
      using errcode = 'check_violation';
  end if;

  if la_van_ban_tam(p_ho_ten) then
    raise exception 'Vui lòng điền họ tên'
      using errcode = 'check_violation';
  end if;

  -- Vé tải CV: chỉ nhận vé còn hạn và chưa dùng.
  if p_ma_tai_len is not null then
    select * into v_phieu from phieu_tai_len
    where id = p_ma_tai_len and not da_dung and het_han > now()
    for update;
    if not found then
      raise exception 'Phiếu tải CV đã hết hạn, vui lòng chọn lại file'
        using errcode = 'check_violation';
    end if;
    update phieu_tai_len set da_dung = true where id = p_ma_tai_len;
    v_duong_dan := 'ho-so-ung-tuyen/' || p_ma_tai_len::text || '/'
                   || coalesce(nullif(btrim(p_ten_tep), ''), 'cv');
  end if;

  -- Mã hồ sơ: BT-UV-YYMM-<5 ký tự>. Bỏ 0/O/1/I/L cho dễ đọc qua điện thoại.
  for i in 1..20 loop
    v_ma := 'BT-UV-' || to_char(bay_gio_vn(), 'YYMM') || '-' ||
            string_agg(substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ',
                              (floor(random() * 31) + 1)::int, 1), '')
      from generate_series(1, 5);
    exit when not exists (select 1 from ho_so_ung_tuyen where ma_ho_so = v_ma);
    v_ma := null;
  end loop;
  if v_ma is null then
    raise exception 'Không sinh được mã hồ sơ, vui lòng thử lại';
  end if;

  insert into ho_so_ung_tuyen (
    ma_ho_so, vi_tri_id, chi_nhanh_id,
    ho_ten, sdt, email, nam_sinh, gioi_thieu, kinh_nghiem, ca_lam_duoc,
    duong_dan_cv,
    dong_y_noi_dung, dong_y_ip,
    luu_den, nguon_utm_source, nguon_utm_campaign, ip, ngay_nop)
  values (
    v_ma, v_vi_tri.id, v_vi_tri.chi_nhanh_id,
    btrim(p_ho_ten), v_sdt, nullif(btrim(p_email), ''), p_nam_sinh,
    p_gioi_thieu, p_kinh_nghiem, p_ca_lam_duoc,
    v_duong_dan,
    'Tôi đồng ý để Beeftown lưu và sử dụng thông tin trong hồ sơ này cho mục đích tuyển dụng, trong vòng 6 tháng kể từ ngày nộp.',
    p_ip,
    hom_nay_vn() + 180, p_utm_source, p_utm_campaign, p_ip, hom_nay_vn());

  return v_ma;
end;
$$;


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6. Giữ dòng ve_con_hieu_luc: xem 0025.
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
    -- Không phải để website gọi: policy tải CV trên storage.objects gọi nó
    -- dưới vai anon. Xem 0025.
    execute 'grant execute on function ve_con_hieu_luc(text) to anon';

    -- Đo lường
    execute 'grant execute on function ghi_su_kien_web(text,text,uuid,text,text,text,text,text,text,text) to anon';
  end if;
end
$$;
