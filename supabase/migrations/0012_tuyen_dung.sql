-- =============================================================================
-- BEEFTOWN CRM — 0012 · TUYỂN DỤNG
-- Tin tuyển dụng · hồ sơ ứng viên · vé tải CV · vòng đời và lưu trữ
-- =============================================================================
-- VÌ SAO PHẦN NÀY QUAN TRỌNG HƠN VẺ NGOÀI CỦA NÓ
--
-- 05_VanHanh/04_Training/00_KE_HOACH_CHINH_THUC.md ghi thẳng: "Tuyển dụng
-- chưa có trong Project Plan. Đây là đường găng thứ hai bên cạnh giấy ATTP."
-- Mười chín người, 11–12 ngày đào tạo, và đào tạo không bắt đầu được trước
-- khi xong nội thất.
--
-- Tính ngược từ ngày mở thì tin tuyển dụng phải sống quanh ngày treo bạt.
-- Đây là phần DUY NHẤT của website nằm trên đường găng của ngày khai trương:
-- mọi khối nội dung khác phục vụ khách hàng — những người còn sáu tuần nữa
-- mới ghé được.
--
-- BA RÀNG BUỘC ĐỊNH HÌNH THIẾT KẾ
--
--   1. anon PHẢI nộp được hồ sơ, và TUYỆT ĐỐI không đọc được hồ sơ nào —
--      kể cả hồ sơ của chính mình, kể cả khi đoán đúng mã.
--   2. Hồ sơ là dữ liệu cá nhân của người CHƯA phải khách hàng. Nghị định
--      13/2023 áp dụng đầy đủ: mục đích, sự đồng ý, thời hạn lưu.
--   3. CV là tùy chọn. Phục vụ và phụ bếp ứng tuyển từ điện thoại thường
--      không có file CV; bắt buộc đính kèm là tự loại phần lớn ứng viên thật.
-- =============================================================================


create type bo_phan_tuyen as enum (
  'sanh', 'bep', 'quay_thit', 'quan_ly', 'marketing'
);

create type loai_hop_dong as enum (
  'toan_thoi_gian', 'ban_thoi_gian', 'thoi_vu', 'thuc_tap'
);

create type trang_thai_ho_so as enum (
  'moi',
  'dang_xem',
  'hen_phong_van',
  'da_phong_van',
  'nhan_viec',
  'tu_choi',
  'ung_vien_rut',
  'da_an_danh'    -- hết hạn lưu: đã xóa thông tin nhận dạng, giữ lại dòng
);


-- =============================================================================
-- TIN TUYỂN DỤNG
-- =============================================================================
create table vi_tri_tuyen_dung (
  id           uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete cascade,

  ma       text not null unique,
  ten_vi   text not null,
  ten_en   text,
  bo_phan  bo_phan_tuyen not null,
  cap_bac  text,                  -- 'Hall Crew → Master Beef Specialist'
  loai_hop_dong loai_hop_dong not null default 'ban_thoi_gian',
  so_luong smallint,

  mo_ta_vi   text,
  mo_ta_en   text,
  yeu_cau_vi text,
  yeu_cau_en text,
  quyen_loi_vi text,
  quyen_loi_en text,
  ca_lam     text,               -- mô tả ca theo roster vận hành

  -- Lương là một CAM KẾT với người lao động, nên cùng khuôn duyệt với giá món:
  -- đề xuất một chỗ, giá trị chính thức một chỗ khác.
  luong_de_xuat_tu  bigint,
  luong_de_xuat_den bigint,
  luong_tu          bigint,
  luong_den         bigint,
  luong_da_duyet    boolean not null default false,

  han_nop    date,
  trang_thai trang_thai_cong_bo not null default 'nhap',
  nguoi_duyet uuid references nhan_su(id) on delete set null,
  cong_bo_luc timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint vi_tri_luong_chi_khi_duyet check (
    ((luong_tu is not null or luong_den is not null) = luong_da_duyet)
    and (luong_tu is null or luong_tu >= 0)
    and (luong_den is null or luong_tu is null or luong_den >= luong_tu)),

  constraint vi_tri_de_xuat_hop_le check (
    luong_de_xuat_den is null or luong_de_xuat_tu is null
    or luong_de_xuat_den >= luong_de_xuat_tu),

  -- Không đăng tin mà thiếu mô tả hoặc thiếu yêu cầu. Ứng viên cần biết mình
  -- đang ứng tuyển cái gì trước khi để lại số điện thoại.
  constraint vi_tri_cong_bo_phai_sach check (
    trang_thai <> 'da_cong_bo' or (
          not la_van_ban_tam(ten_vi)
      and not la_van_ban_tam(mo_ta_vi)
      and not la_van_ban_tam(yeu_cau_vi)))
);

create index vi_tri_cong_bo_idx on vi_tri_tuyen_dung(chi_nhanh_id)
  where trang_thai = 'da_cong_bo';

create trigger vi_tri_tuyen_dung_updated_at
  before update on vi_tri_tuyen_dung
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on column vi_tri_tuyen_dung.luong_da_duyet is
  'Mức lương công bố phải được duyệt. Bảng lương nằm trong tài liệu mật, không được vô tình lọt lên trang công khai.';


-- =============================================================================
-- VÉ TẢI CV — server cấp đường dẫn, không phải ứng viên
-- =============================================================================
-- Thiết kế hiển nhiên là: nộp hồ sơ trước, rồi upload vào đường dẫn theo id
-- hồ sơ. Nhưng như vậy là đưa cho anon đúng cái định danh phải giữ kín.
--
-- Đảo lại: SERVER cấp một đoạn đường dẫn ngẫu nhiên, hết hạn sau 15 phút,
-- dùng đúng một lần. Ứng viên upload vào đó rồi nộp kèm mã vé. Id hồ sơ
-- không bao giờ rời khỏi database.
-- =============================================================================
create table phieu_tai_len (
  id         uuid primary key default gen_random_uuid(),
  het_han    timestamptz not null default now() + interval '15 minutes',
  da_dung    boolean not null default false,
  ip         inet,
  created_at timestamptz not null default now()
);

create index phieu_tai_len_don_dep_idx on phieu_tai_len(het_han)
  where not da_dung;


-- =============================================================================
-- HỒ SƠ ỨNG TUYỂN
-- =============================================================================
create table ho_so_ung_tuyen (
  id      uuid primary key default gen_random_uuid(),
  ma_ho_so text not null unique,          -- 'BT-UV-2611-K7M2Q'

  vi_tri_id    uuid not null references vi_tri_tuyen_dung(id) on delete restrict,
  -- Phi chuẩn hóa để RLS lọc theo chi nhánh mà không phải join — cùng cách
  -- dat_ban làm ở 0004.
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,

  ho_ten     text,
  sdt        text,
  email      text,
  -- CHỈ năm sinh, không phải ngày đầy đủ. Đủ để kiểm tra quy định lao động
  -- với người dưới 18 tuổi, và không thu nhiều hơn mức cần.
  nam_sinh   smallint,
  gioi_thieu text,
  kinh_nghiem text,
  ca_lam_duoc text[],

  duong_dan_cv text,   -- 'ho-so-ung-tuyen/<mã vé>/<tên file>'

  -- NĐ 13/2023: KHÔNG THỂ lưu hồ sơ mà không lưu đúng câu ứng viên đã đọc.
  dong_y_noi_dung text not null,
  dong_y_luc      timestamptz not null default now(),
  dong_y_ip       inet,

  luu_den    date not null,      -- hết hạn thì ẩn danh, không xóa
  da_an_danh boolean not null default false,

  trang_thai      trang_thai_ho_so not null default 'moi',
  nguoi_phu_trach uuid references nhan_su(id) on delete set null,
  ghi_chu_noi_bo  text,

  nguon_utm_source   text,
  nguon_utm_campaign text,
  ip         inet,
  ngay_nop   date not null default hom_nay_vn(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ho_so_sdt_hop_le check (da_an_danh or sdt_hop_le(sdt)),
  constraint ho_so_nam_sinh_hop_le check (
    nam_sinh is null or nam_sinh between 1950 and 2020),
  constraint ho_so_an_danh_sach_se check (
    not da_an_danh or (ho_ten is null and sdt is null
                       and email is null and duong_dan_cv is null))
);

-- Chống bấm hai lần và chống spam: một số điện thoại, một vị trí, một ngày.
-- Dùng cột ngay_nop thay vì biểu thức trên created_at, vì chuyển múi giờ là
-- hàm STABLE nên không đánh chỉ mục được.
create unique index ho_so_khong_trung_idx
  on ho_so_ung_tuyen(vi_tri_id, sdt, ngay_nop) where not da_an_danh;

create index ho_so_chi_nhanh_idx on ho_so_ung_tuyen(chi_nhanh_id, created_at desc);
create index ho_so_het_han_idx   on ho_so_ung_tuyen(luu_den) where not da_an_danh;
create index ho_so_ip_idx        on ho_so_ung_tuyen(ip, created_at desc);

create trigger ho_so_ung_tuyen_updated_at
  before update on ho_so_ung_tuyen
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table ho_so_ung_tuyen is
  'Hồ sơ ứng tuyển. Dữ liệu cá nhân của người chưa phải khách hàng — NĐ 13/2023 áp dụng đầy đủ.';
comment on column ho_so_ung_tuyen.luu_den is
  'Hết hạn thì don_dep_ho_so_het_han() xóa thông tin nhận dạng và giữ lại dòng, để số liệu và vết kiểm toán còn nguyên.';


-- =============================================================================
-- NHẬT KÝ XỬ LÝ HỒ SƠ — chỉ ghi thêm
-- =============================================================================
create table nhat_ky_ho_so (
  id       uuid primary key default gen_random_uuid(),
  ho_so_id uuid not null references ho_so_ung_tuyen(id) on delete cascade,
  tu_trang_thai  trang_thai_ho_so,
  den_trang_thai trang_thai_ho_so not null,
  ghi_chu  text,
  nguoi_thuc_hien uuid references nhan_su(id) on delete set null,
  created_at timestamptz not null default now()
);

create index nhat_ky_ho_so_idx on nhat_ky_ho_so(ho_so_id, created_at desc);

create or replace function nhat_ky_ho_so_chan_sua_xoa()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Nhật ký hồ sơ là bất biến. Muốn ghi chú thêm, tạo dòng mới.'
    using errcode = 'restrict_violation';
end;
$$;

create trigger nhat_ky_ho_so_chan_sua
  before update or delete on nhat_ky_ho_so
  for each row execute function nhat_ky_ho_so_chan_sua_xoa();


-- -----------------------------------------------------------------------------
-- VÒNG ĐỜI HỒ SƠ
-- -----------------------------------------------------------------------------
create or replace function ho_so_kiem_tra_vong_doi()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into nhat_ky_ho_so (ho_so_id, tu_trang_thai, den_trang_thai, ghi_chu)
    values (new.id, null, new.trang_thai, 'Ứng viên nộp hồ sơ');
    return new;
  end if;

  if new.trang_thai = old.trang_thai then
    return new;
  end if;

  if not (
       (old.trang_thai = 'moi'           and new.trang_thai = 'dang_xem')
    or (old.trang_thai = 'dang_xem'      and new.trang_thai in ('hen_phong_van','tu_choi'))
    or (old.trang_thai = 'hen_phong_van' and new.trang_thai in ('da_phong_van','tu_choi'))
    or (old.trang_thai = 'da_phong_van'  and new.trang_thai in ('nhan_viec','tu_choi'))
    -- Ứng viên rút lui được ở bất cứ đâu, trừ khi đã ẩn danh.
    or (new.trang_thai = 'ung_vien_rut'  and old.trang_thai <> 'da_an_danh')
    -- Hết hạn lưu: mọi trạng thái đều đi tới ẩn danh được.
    or (new.trang_thai = 'da_an_danh')
  ) then
    raise exception 'Không chuyển được hồ sơ từ % sang %', old.trang_thai, new.trang_thai
      using errcode = 'check_violation';
  end if;

  insert into nhat_ky_ho_so (ho_so_id, tu_trang_thai, den_trang_thai, nguoi_thuc_hien)
  values (new.id, old.trang_thai, new.trang_thai, (nhan_su_hien_tai()).id);

  return new;
end;
$$;

create trigger ho_so_kiem_tra_vong_doi_trigger
  after insert or update on ho_so_ung_tuyen
  for each row execute function ho_so_kiem_tra_vong_doi();


-- =============================================================================
-- TIN TUYỂN DỤNG CÔNG KHAI
-- =============================================================================
create or replace function tin_tuyen_dung_cong_khai(p_ngon_ngu text default 'vi')
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
  han_nop       date
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
    v.han_nop
  from vi_tri_tuyen_dung v
  where cong_tac_bat('hien_tuyen_dung')
    and v.trang_thai = 'da_cong_bo'
    and (v.han_nop is null or v.han_nop >= hom_nay_vn())
  order by v.bo_phan, v.ten_vi;
$$;


-- =============================================================================
-- XIN VÉ TẢI CV
-- =============================================================================
create or replace function xin_phieu_tai_cv(p_ip inet default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dem int;
  v_id  uuid;
begin
  if not cong_tac_bat('hien_tuyen_dung') then
    raise exception 'Cổng tuyển dụng đang tạm đóng'
      using errcode = 'check_violation';
  end if;

  -- Vé là quyền ghi vào kho file. Không phát vô tội vạ.
  if p_ip is not null then
    select count(*) into v_dem from phieu_tai_len
    where ip = p_ip and created_at > now() - interval '1 hour';
    if v_dem >= 10 then
      raise exception 'Bạn đã thử tải lên quá nhiều lần, vui lòng chờ ít phút'
        using errcode = 'check_violation';
    end if;
  end if;

  insert into phieu_tai_len (ip) values (p_ip) returning id into v_id;
  return v_id;
end;
$$;


-- =============================================================================
-- NỘP HỒ SƠ — cửa duy nhất cho anon
-- =============================================================================
-- Dựng theo khuôn tao_dat_ban(): security definer, anon gọi được, kiểm tra
-- đầy đủ bên trong, trả về một mã ngắn để ứng viên NHẮC TỚI.
--
-- KHÔNG có hàm tra cứu hồ sơ. Tra cứu đặt bàn có lý do — khách cần hủy bàn.
-- Tra cứu hồ sơ là mở một đường đọc dữ liệu cá nhân sau một mã ngắn, chỉ để
-- trả về câu "đang xem xét". Một cuộc gọi làm việc đó tốt hơn.
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

comment on function nop_ho_so_ung_tuyen is
  'Cửa duy nhất để anon nộp hồ sơ. Trả về mã hồ sơ để ứng viên nhắc tới — KHÔNG có hàm tra cứu ngược.';


-- =============================================================================
-- THỐNG KÊ TUYỂN DỤNG — marketing xem được SỐ, không xem được NGƯỜI
-- =============================================================================
-- Cố ý làm HÀM có kiểm tra vai trò, không làm view definer. Lý do: "mọi view
-- trong public đều là security_invoker" là một khẳng định mà test kiểm được
-- bằng một câu truy vấn. Một ngoại lệ biến nó từ phép thử đúng/sai thành
-- chuyện phải cân nhắc từng trường hợp.
-- =============================================================================
create or replace function thong_ke_tuyen_dung(
  p_tu  date default (hom_nay_vn() - 30),
  p_den date default hom_nay_vn()
)
returns table (
  vi_tri_ma   text,
  vi_tri_ten  text,
  so_ho_so    bigint,
  dang_xem    bigint,
  hen_phong_van bigint,
  nhan_viec   bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]) then
    raise exception 'Không có quyền xem thống kê tuyển dụng'
      using errcode = 'insufficient_privilege';
  end if;

  return query
  select v.ma, v.ten_vi,
         count(h.id),
         count(h.id) filter (where h.trang_thai = 'dang_xem'),
         count(h.id) filter (where h.trang_thai = 'hen_phong_van'),
         count(h.id) filter (where h.trang_thai = 'nhan_viec')
  from vi_tri_tuyen_dung v
  left join ho_so_ung_tuyen h
    on h.vi_tri_id = v.id and h.ngay_nop between p_tu and p_den
  where duoc_truy_cap_chi_nhanh(v.chi_nhanh_id)
  group by v.ma, v.ten_vi
  order by v.ma;
end;
$$;


-- =============================================================================
-- HẾT HẠN LƯU — ẨN DANH, KHÔNG XÓA
-- =============================================================================
-- Xóa dòng thì số liệu phễu tuyển dụng và vết kiểm toán biến mất theo. Ẩn
-- danh giữ được cả hai, và vẫn là "xóa dữ liệu cá nhân" theo đúng nghĩa.
-- Cùng triết lý với khach_hang.dang_hoat_dong ở 0002.
--
-- KHÔNG gắn vào pg_cron: PGlite không có cron nên không test được, và một
-- công việc chạy ngầm âm thầm hủy dữ liệu cá nhân thì nên do người bấm cho
-- tới khi đã chứng minh là đúng.
-- =============================================================================
create or replace function don_dep_ho_so_het_han()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_so int;
begin
  if not co_vai_tro(array['chu_so_huu']::vai_tro[]) and co_phien_dang_nhap() then
    raise exception 'Chỉ chủ sở hữu mới chạy được việc dọn hồ sơ hết hạn'
      using errcode = 'insufficient_privilege';
  end if;

  with da_don as (
    update ho_so_ung_tuyen
    set ho_ten = null, sdt = null, email = null, duong_dan_cv = null,
        gioi_thieu = null, kinh_nghiem = null, ghi_chu_noi_bo = null,
        ip = null, dong_y_ip = null,
        da_an_danh = true,
        trang_thai = 'da_an_danh'
    where not da_an_danh and luu_den < hom_nay_vn()
    returning 1)
  select count(*) into v_so from da_don;

  return v_so;
end;
$$;

create or replace function don_dep_phieu_tai_len()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_so int;
begin
  with da_xoa as (
    delete from phieu_tai_len
    where het_han < now() - interval '1 day'
    returning 1)
  select count(*) into v_so from da_xoa;
  return v_so;
end;
$$;


-- =============================================================================
-- PHÂN QUYỀN
-- =============================================================================
alter table vi_tri_tuyen_dung enable row level security;
alter table ho_so_ung_tuyen   enable row level security;
alter table nhat_ky_ho_so     enable row level security;
alter table phieu_tai_len     enable row level security;

-- Tin tuyển dụng: nhân sự xem được, ba vai trò nội dung soạn được.
create policy vi_tri_doc on vi_tri_tuyen_dung
  for select using (duoc_truy_cap_chi_nhanh(chi_nhanh_id));
create policy vi_tri_them on vi_tri_tuyen_dung
  for insert with check (
    duoc_truy_cap_chi_nhanh(chi_nhanh_id)
    and co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]));
create policy vi_tri_sua on vi_tri_tuyen_dung
  for update using (
    duoc_truy_cap_chi_nhanh(chi_nhanh_id)
    and co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]));

-- HỒ SƠ: chỉ chủ sở hữu và quản lý. Thu ngân không liên quan, và marketing
-- chỉ được xem SỐ qua thong_ke_tuyen_dung() — dữ liệu cá nhân của người chưa
-- phải khách hàng thì càng ít người chạm vào càng tốt.
create policy ho_so_doc on ho_so_ung_tuyen
  for select using (
    duoc_truy_cap_chi_nhanh(chi_nhanh_id)
    and co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]));
create policy ho_so_sua on ho_so_ung_tuyen
  for update using (
    duoc_truy_cap_chi_nhanh(chi_nhanh_id)
    and co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]));
-- Không có policy INSERT: đường vào duy nhất là nop_ho_so_ung_tuyen().
-- Không có policy DELETE: hết hạn thì ẩn danh, không xóa.

create policy nhat_ky_ho_so_doc on nhat_ky_ho_so
  for select using (
    exists (select 1 from ho_so_ung_tuyen h where h.id = ho_so_id));
create policy nhat_ky_ho_so_them on nhat_ky_ho_so
  for insert with check (true);

-- Vé tải CV không chứa dữ liệu cá nhân, nhưng cũng không có lý do gì để nhân
-- sự đọc. Chỉ hàm definer đụng tới.
create policy phieu_tai_len_doc on phieu_tai_len
  for select using (co_vai_tro(array['chu_so_huu']::vai_tro[]));


-- =============================================================================
-- KHỞI TẠO 8 VỊ TRÍ MẪU — gọi MỘT LẦN sau khi đã tạo chi nhánh
-- =============================================================================
-- Vì sao đây là HÀM chứ không phải khối INSERT trong migration:
--
-- Tin tuyển dụng thuộc về một chi nhánh, mà lúc migration chạy thì bảng
-- chi_nhanh còn rỗng. Một khối INSERT đọc từ chi_nhanh ở thời điểm đó sẽ
-- chèn đúng KHÔNG dòng nào và không báo lỗi gì cả — kiểu hỏng im lặng tệ
-- nhất. Bài test đã bắt được đúng điều này.
--
-- Tên vị trí lấy từ bảng mục lục 05_VanHanh/README.md.
--
-- BẢNG LƯƠNG KHÔNG ĐƯỢC ĐƯA VÀO: nó nằm trong các file .docx mật, và một con
-- số lương sai trên trang công khai là chuyện khác hẳn một mô tả món sai.
--
-- Tất cả ở trạng thái nháp: mô tả và yêu cầu phải do người viết, và ràng buộc
-- vi_tri_cong_bo_phai_sach không cho đăng tin thiếu hai phần đó.
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
      (chi_nhanh_id, ma, ten_vi, ten_en, bo_phan, cap_bac, loai_hop_dong, so_luong)
    select p_chi_nhanh_id, v.ma, v.ten_vi, v.ten_en, v.bo_phan::bo_phan_tuyen,
           v.cap_bac, v.loai::loai_hop_dong, v.so_luong
    from (values
      ('nhan-vien-sanh',    'Nhân viên sảnh',             'Hall Employee',
       'sanh', 'Hall Crew → Master Beef Specialist (7 bậc)', 'ban_thoi_gian', 8::smallint),
      ('to-truong-sanh',    'Tổ trưởng sảnh',             'Floor Leader',
       'sanh', 'Bậc trên nhân viên sảnh', 'toan_thoi_gian', 2::smallint),
      ('quan-ly-sanh',      'Quản lý sảnh',               'Floor Manager',
       'quan_ly', 'Hướng lên Quản lý cửa hàng', 'toan_thoi_gian', 1::smallint),
      ('quan-ly-cua-hang',  'Quản lý cửa hàng',           'Store Manager',
       'quan_ly', null, 'toan_thoi_gian', 1::smallint),
      ('nhan-vien-bep',     'Nhân viên bếp',              'Kitchen Staff',
       'bep', '3 bậc', 'toan_thoi_gian', 4::smallint),
      ('nhan-vien-thit',    'Nhân viên bộ phận thịt',     'Meat Department Staff',
       'quay_thit', '3 bậc', 'toan_thoi_gian', 2::smallint),
      ('tu-van-quay-thit',  'Nhân viên tư vấn quầy thịt', 'Meat Showcase Sales Assistant',
       'quay_thit', 'Kiêm thao tác POS tại quầy', 'ban_thoi_gian', 2::smallint),
      ('dau-moi-marketing', 'Đầu mối marketing',          'Marketing Coordinator',
       'marketing', null, 'ban_thoi_gian', 1::smallint)
    ) as v(ma, ten_vi, ten_en, bo_phan, cap_bac, loai, so_luong)
    where not exists (select 1 from vi_tri_tuyen_dung t where t.ma = v.ma)
    returning 1)
  select count(*) into v_so from da_them;

  return v_so;
end;
$$;

comment on function tao_tin_tuyen_dung_mau is
  'Tạo 8 tin tuyển dụng mẫu ở trạng thái nháp cho một chi nhánh. Gọi một lần khi cài đặt. Gọi lại thì bỏ qua tin đã có.';


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
    execute 'grant execute on function tin_tuyen_dung_cong_khai(text) to anon';
    execute 'grant execute on function xin_phieu_tai_cv(inet) to anon';
    execute 'grant execute on function nop_ho_so_ung_tuyen(text,text,text,text,smallint,text,text,text[],uuid,text,boolean,text,int,text,text,inet) to anon';
  end if;
end
$$;
