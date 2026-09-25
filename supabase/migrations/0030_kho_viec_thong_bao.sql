-- =============================================================================
-- BEEFTOWN KHO — 0030 · ĐẾM VIỆC, THÔNG BÁO, NGƯỠNG CẢNH BÁO, CHỈ SỐ QUẢN TRỊ
-- =============================================================================
-- Giao diện mới (giống iPOS Inventory Pro) có số đỏ trên menu, chuông thông
-- báo và bảng "Quản trị | Cần theo dõi". File này là phần database của chúng:
--
--   kho_dem_viec(cn)          một lần gọi → mọi con số đỏ của người đang xem.
--                             Khóa nào người đó không có quyền thì VẮNG MẶT
--                             (không phải bằng 0) — giao diện không phải đoán.
--                             Chỉ có SỐ ĐẾM, không có tiền.
--   kho_thong_bao(cn, n)      danh sách sự kiện cho trang chuông.
--   kho_da_xem_thong_bao(cn)  bấm mở chuông = đã đọc tới lúc này.
--   kho_luu_nguong(cn, json)  ngưỡng cảnh báo (giá nhập, thu hồi, giờ...).
--   kho_chi_so_quan_tri(...)  số cho cột "Quản trị" — SECURITY INVOKER, nên
--                             người không có quyền xem giá nhận về 0 đồng.
--
-- Sự kiện KHÔNG lưu thành bảng: chúng được suy ra từ chứng từ đang có, mỗi sự
-- kiện có một mốc thời gian. "Chưa đọc" = mốc đó sau lần cuối người này mở
-- chuông. Nhờ vậy không có việc nào phải nhớ "ghi thông báo", và sửa chứng từ
-- là thông báo tự đúng theo.
-- =============================================================================


-- =============================================================================
-- 1 · NGƯỠNG CẢNH BÁO — thêm vào cài đặt kho của chi nhánh
-- =============================================================================
alter table kho_cai_dat
  add column nguong_gia_mua_pt   numeric(5,2) not null default 5,
  add column nguong_thu_hoi_diem numeric(5,2) not null default 3,
  add column gio_nhac_chuyen     smallint     not null default 2,
  add column gio_chot_ngay       smallint     not null default 6,
  add column nguong_dinh_muc_pt  numeric(5,2) not null default 10;

alter table kho_cai_dat
  add constraint kho_cai_dat_nguong_gia_hop_le      check (nguong_gia_mua_pt   between 0 and 100),
  add constraint kho_cai_dat_nguong_thu_hoi_hop_le  check (nguong_thu_hoi_diem between 0 and 50),
  add constraint kho_cai_dat_gio_nhac_hop_le        check (gio_nhac_chuyen     between 1 and 48),
  add constraint kho_cai_dat_gio_chot_hop_le        check (gio_chot_ngay       between 0 and 12),
  add constraint kho_cai_dat_nguong_dinh_muc_hop_le check (nguong_dinh_muc_pt  between 0 and 100);

comment on column kho_cai_dat.nguong_gia_mua_pt is
  'Giá nhập/kg cao hơn lần nhập trước (cùng mặt hàng, cùng nhà cung cấp) quá bao nhiêu % thì cảnh báo. Chỉ cảnh báo, không chặn.';
comment on column kho_cai_dat.nguong_thu_hoi_diem is
  'Thu hồi pha lóc thấp hơn dự kiến quá bao nhiêu điểm % thì báo quản lý.';
comment on column kho_cai_dat.gio_nhac_chuyen is
  'Hàng mang ra quầy quá bao nhiêu giờ mà quầy chưa xác nhận thì báo.';
comment on column kho_cai_dat.gio_chot_ngay is
  'Mấy giờ sáng thì coi như "ngày hôm qua" đã xong — sau giờ này mà quầy chưa đếm hôm qua thì báo.';
comment on column kho_cai_dat.nguong_dinh_muc_pt is
  'Thịt xuất bếp lệch định lượng món quá bao nhiêu % (7 ngày gần nhất) thì báo.';


-- =============================================================================
-- 2 · MỐC ĐÃ ĐỌC THÔNG BÁO — một dòng cho mỗi người × chi nhánh
-- =============================================================================
create table kho_nguoi_xem (
  nhan_su_id        uuid not null references nhan_su(id) on delete cascade,
  chi_nhanh_id      uuid not null references chi_nhanh(id) on delete cascade,
  thong_bao_xem_luc timestamptz not null default now(),
  primary key (nhan_su_id, chi_nhanh_id)
);

comment on table kho_nguoi_xem is
  'Lần cuối mỗi người mở trang thông báo kho ở mỗi chi nhánh. Sự kiện có mốc sau thời điểm này là "chưa đọc".';

alter table kho_nguoi_xem enable row level security;

create policy kho_nguoi_xem_doc on kho_nguoi_xem
  for select using (nhan_su_id = (select (nhan_su_hien_tai()).id));


-- =============================================================================
-- 3 · HÀM NỘI BỘ
-- =============================================================================
-- Ngày + giờ theo giờ Việt Nam → thời điểm (timestamptz). Không dùng tên múi
-- giờ: Việt Nam cố định +07:00, và PGlite của bộ test không mang dữ liệu múi giờ.
create or replace function kho_luc_vn(p_ngay date, p_gio numeric)
returns timestamptz
language sql
immutable
set search_path = public
as $$
  select ((p_ngay::timestamp + make_interval(secs => p_gio * 3600)) - interval '7 hours') at time zone 'utc'
$$;

-- Mọi sự kiện mà NGƯỜI ĐANG ĐĂNG NHẬP được thấy ở một chi nhánh. Quyền kiểm
-- bên trong từng nhóm, nên hai hàm công khai bên dưới chỉ việc đếm/liệt kê.
--
--   nhom : van_hanh (việc tay chân) | nhac_nho (duyệt, công nợ) | he_thong
--   khoa : loại sự kiện — lib/kho/viec.ts đặt câu chữ và đường dẫn cho mỗi khóa
--   ref_id, ref2, ma, ten, phu, so : chứng từ / lô / mặt hàng liên quan để dựng
--          câu và đường dẫn. ref2 = vị trí (sự kiện hạn dùng, kiểm kê, báo hủy)
--          hoặc nhà cung cấp (công nợ, chờ duyệt nhập); phu = loại vị trí.
--   luc  : mốc thời gian của sự kiện
--
-- Chỉ lấy sự kiện trong 30 ngày gần nhất và không lấy mốc ở tương lai.
create or replace function kho_su_kien(p_chi_nhanh_id uuid)
returns table (khoa text, nhom text, ref_id uuid, ref2 uuid, ma text, ten text, phu text, so numeric, luc timestamptz)
language plpgsql
stable
set search_path = public
as $$
declare
  v_ns       nhan_su;
  v_cd       kho_cai_dat;
  v_chi_quay boolean;
  v_hom_nay  date := hom_nay_vn();
  v_tu       timestamptz := now() - interval '30 days';
begin
  v_ns := nhan_su_hien_tai();
  select * into v_cd from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id;
  if v_ns.id is null or v_cd.chi_nhanh_id is null or not kho_duoc(p_chi_nhanh_id, 'xem') then
    return;
  end if;
  v_chi_quay := v_ns.vai_tro = 'nhan_vien_quay';

  -- ---- Việc của chính mình bị trả về --------------------------------------
  if kho_duoc(p_chi_nhanh_id, 'nhap') then
    return query
      select 'nhap_bi_tu_choi', 'van_hanh', p.id, null::uuid, p.so_phieu, p.ly_do, null::text, null::numeric, p.duyet_luc
      from kho_phieu_nhap p
      where p.chi_nhanh_id = p_chi_nhanh_id and p.trang_thai = 'tu_choi'
        and p.nguoi_tao = v_ns.id and p.duyet_luc >= v_tu;
  end if;

  if kho_duoc(p_chi_nhanh_id, 'van_hanh') then
    return query
      select 'huy_bi_tu_choi', 'van_hanh', x.id, null::uuid, x.so_phieu, x.ly_do_tu_choi, null::text, null::numeric, x.duyet_luc
      from kho_phieu_xuat x
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'huy' and x.trang_thai = 'tu_choi'
        and x.nguoi_tao = v_ns.id and x.duyet_luc >= v_tu;

    return query
      select 'kiem_ke_tra_ve', 'van_hanh', k.id, k.vi_tri_id, k.so_phieu, k.ly_do, v.loai, null::numeric, k.updated_at
      from kho_kiem_ke k
      join kho_vi_tri v on v.id = k.vi_tri_id
      where k.chi_nhanh_id = p_chi_nhanh_id and k.trang_thai = 'dang_dem'
        and k.ly_do is not null and k.updated_at >= v_tu
        and (not v_chi_quay or v.loai = 'quay');
  end if;

  -- ---- Hạn dùng (NV quầy: chỉ hàng ở quầy) ---------------------------------
  return query
    select case when t.tinh_trang_han = 'het_han' then 'het_han' else 'sap_het_han' end,
           'van_hanh', t.lo_id, t.vi_tri_id, t.ma_lo, t.ten_hang || ' · ' || t.ten_vi_tri, t.loai_vi_tri,
           case when t.dem_goi then t.so_goi::numeric else t.so_kg end,
           case when t.tinh_trang_han = 'het_han'
                then kho_luc_vn(t.han_dung + 1, 0)
                else kho_luc_vn(t.han_dung - coalesce(m.canh_bao_truoc_ngay, v_cd.canh_bao_truoc_ngay, 1), 0)
           end
    from kho_v_ton t
    join kho_mat_hang m on m.id = t.mat_hang_id
    where t.chi_nhanh_id = p_chi_nhanh_id and t.loai_vi_tri in ('kho', 'quay')
      and t.tinh_trang_han in ('het_han', 'sap_het')
      and (not v_chi_quay or t.loai_vi_tri = 'quay');

  -- ---- Quầy dưới mức tối thiểu (không tính gói đã hết hạn) -----------------
  return query
    select 'quay_duoi_muc', 'van_hanh', m.id, null::uuid, m.ma, m.ten, null::text, coalesce(c.con_kg, 0),
           coalesce(q.lan_cuoi, kho_luc_vn(v_hom_nay, 0))
    from kho_mat_hang m
    left join lateral (
      select sum(t.so_kg) as con_kg
      from kho_v_ton t
      where t.chi_nhanh_id = p_chi_nhanh_id and t.mat_hang_id = m.id
        and t.loai_vi_tri = 'quay' and t.tinh_trang_han <> 'het_han'
    ) c on true
    left join lateral (
      -- Mốc = lần cuối hàng này ra/vào quầy: đọc rồi thì chỉ báo lại khi quầy động tới nó.
      select max(s.created_at) as lan_cuoi
      from kho_so_cai s
      join kho_vi_tri v on v.id = s.vi_tri_id
      where s.chi_nhanh_id = p_chi_nhanh_id and s.mat_hang_id = m.id and v.loai = 'quay'
    ) q on true
    where m.dang_dung and m.ton_toi_thieu_kg is not null
      and coalesce(c.con_kg, 0) < m.ton_toi_thieu_kg;

  -- ---- Quầy chưa đếm hôm qua (sau giờ chốt ngày) ---------------------------
  if (kho_duoc(p_chi_nhanh_id, 'van_hanh') or kho_duoc(p_chi_nhanh_id, 'duyet'))
     and bay_gio_vn() >= v_hom_nay::timestamp + make_interval(hours => v_cd.gio_chot_ngay) then
    return query
      select 'quay_chua_dem', 'van_hanh', v.id, v.id, null::text, v.ten, 'quay'::text, null::numeric,
             kho_luc_vn(v_hom_nay, v_cd.gio_chot_ngay)
      from kho_vi_tri v
      where v.chi_nhanh_id = p_chi_nhanh_id and v.loai = 'quay' and v.dang_dung
        and (exists (select 1 from kho_ton t where t.vi_tri_id = v.id and (t.so_kg > 0 or t.so_goi > 0))
             or exists (select 1 from kho_so_cai s where s.vi_tri_id = v.id and s.ngay = v_hom_nay - 1))
        and not exists (
          select 1 from kho_kiem_ke k
          where k.vi_tri_id = v.id and k.gui_luc >= kho_luc_vn(v_hom_nay - 1, 10));
  end if;

  -- ---- Chờ duyệt ------------------------------------------------------------
  if kho_duoc(p_chi_nhanh_id, 'duyet') then
    return query
      select 'cho_duyet_nhap', 'nhac_nho', p.id, p.nha_cung_cap_id, p.so_phieu, n.ten, null::text, null::numeric, coalesce(p.gui_luc, p.updated_at)
      from kho_phieu_nhap p
      left join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
      where p.chi_nhanh_id = p_chi_nhanh_id and p.trang_thai = 'cho_duyet';

    return query
      select 'cho_duyet_huy', 'nhac_nho', x.id, x.vi_tri_id, x.so_phieu, v.ten, v.loai, null::numeric, x.created_at
      from kho_phieu_xuat x
      join kho_vi_tri v on v.id = x.vi_tri_id
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'huy' and x.trang_thai = 'cho_duyet';

    return query
      select 'cho_duyet_kiem_ke', 'nhac_nho', k.id, k.vi_tri_id, k.so_phieu, v.ten, v.loai, null::numeric, coalesce(k.gui_luc, k.updated_at)
      from kho_kiem_ke k
      join kho_vi_tri v on v.id = k.vi_tri_id
      where k.chi_nhanh_id = p_chi_nhanh_id and k.trang_thai = 'cho_duyet';
  end if;

  -- ---- Công nợ (chỉ số phiếu, không số tiền) --------------------------------
  if kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    return query
      select 'cong_no_qua_han', 'nhac_nho', c.id, c.nha_cung_cap_id, c.so_phieu, c.ten_nha_cung_cap, null::text,
             c.so_ngay_qua_han::numeric, kho_luc_vn(c.han_thanh_toan + 1, 0)
      from kho_v_cong_no_phieu c
      where c.chi_nhanh_id = p_chi_nhanh_id and c.qua_han;

    return query
      select 'cong_no_den_han', 'nhac_nho', c.id, c.nha_cung_cap_id, c.so_phieu, c.ten_nha_cung_cap, null::text,
             (c.han_thanh_toan - v_hom_nay)::numeric, kho_luc_vn(c.han_thanh_toan - 7, 0)
      from kho_v_cong_no_phieu c
      where c.chi_nhanh_id = p_chi_nhanh_id and c.con_no > 0
        and c.han_thanh_toan between v_hom_nay and v_hom_nay + 7;

    return query
      select 'chua_doi_chieu', 'nhac_nho', c.id, c.nha_cung_cap_id, c.so_phieu, c.ten_nha_cung_cap, null::text, null::numeric,
             coalesce(p.duyet_luc, p.updated_at)
      from kho_v_cong_no_phieu c
      join kho_phieu_nhap p on p.id = c.id
      where c.chi_nhanh_id = p_chi_nhanh_id and not c.da_doi_chieu;
  end if;

  -- ---- Phiên pha lóc để nháp quá một ngày ------------------------------------
  if kho_duoc(p_chi_nhanh_id, 'pha_loc') then
    return query
      select 'pha_nhap_lau', 'he_thong', f.id, null::uuid, f.so_phieu, m.ten, null::text, null::numeric, f.created_at + interval '1 day'
      from kho_phien_pha f
      join kho_mat_hang m on m.id = f.mat_hang_vao_id
      where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'nhap'
        and f.created_at < now() - interval '1 day';
  end if;
end;
$$;

comment on function kho_su_kien is
  'NỘI BỘ. Mọi sự kiện thông báo người đang đăng nhập được thấy ở một chi nhánh, suy ra từ chứng từ. Gọi qua kho_dem_viec / kho_thong_bao.';


-- =============================================================================
-- 4 · ĐẾM VIỆC — một lần gọi cho mọi số đỏ
-- =============================================================================
create or replace function kho_dem_viec(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ns       nhan_su;
  v_cd       kho_cai_dat;
  v          jsonb;
  v_chi_quay boolean;
  v_hom_nay  date := hom_nay_vn();
  v_xem_luc  timestamptz;
  v_duoi_muc int;
  v_chua_dem int;
  v_chua_doc int;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;

  v_ns := nhan_su_hien_tai();
  select * into v_cd from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id;
  v := jsonb_build_object('khoi_tao', v_cd.chi_nhanh_id is not null);
  if v_cd.chi_nhanh_id is null then
    return v;
  end if;
  v_chi_quay := v_ns.vai_tro = 'nhan_vien_quay';

  -- Hạn dùng và quầy — ai xem kho cũng có
  v := v || (
    select jsonb_build_object(
      'het_han',     count(*) filter (where t.tinh_trang_han = 'het_han'),
      'sap_het_han', count(*) filter (where t.tinh_trang_han = 'sap_het'))
    from kho_v_ton t
    where t.chi_nhanh_id = p_chi_nhanh_id and t.loai_vi_tri in ('kho', 'quay')
      and (not v_chi_quay or t.loai_vi_tri = 'quay'));

  -- Mọi sự kiện đếm MỘT lần: quầy dưới mức, quầy chưa đếm, số chưa đọc.
  select x.thong_bao_xem_luc into v_xem_luc
  from kho_nguoi_xem x where x.nhan_su_id = v_ns.id and x.chi_nhanh_id = p_chi_nhanh_id;

  select count(*) filter (where e.khoa = 'quay_duoi_muc'),
         count(*) filter (where e.khoa = 'quay_chua_dem'),
         count(*) filter (where e.luc <= now() and e.luc >= now() - interval '30 days'
                            and (v_xem_luc is null or e.luc > v_xem_luc))
    into v_duoi_muc, v_chua_dem, v_chua_doc
  from kho_su_kien(p_chi_nhanh_id) e;

  v := v || jsonb_build_object('quay_duoi_muc', v_duoi_muc);
  if kho_duoc(p_chi_nhanh_id, 'van_hanh') or kho_duoc(p_chi_nhanh_id, 'duyet') then
    v := v || jsonb_build_object('quay_chua_dem', v_chua_dem);
  end if;

  if kho_duoc(p_chi_nhanh_id, 'nhap') then
    v := v || (
      select jsonb_build_object(
        'nhap_bi_tra', count(*) filter (where p.trang_thai = 'tu_choi'),
        'nhap_nhap',   count(*) filter (where p.trang_thai = 'nhap'))
      from kho_phieu_nhap p
      where p.chi_nhanh_id = p_chi_nhanh_id and p.nguoi_tao = v_ns.id
        and p.trang_thai in ('tu_choi', 'nhap'));
  end if;

  if kho_duoc(p_chi_nhanh_id, 'van_hanh') then
    v := v || jsonb_build_object(
      'huy_bi_tra', (
        select count(*) from kho_phieu_xuat x
        where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'huy' and x.trang_thai = 'tu_choi'
          and x.nguoi_tao = v_ns.id and x.duyet_luc >= now() - interval '7 days'),
      'kiem_ke_tra_ve', (
        select count(*) from kho_kiem_ke k
        join kho_vi_tri vt on vt.id = k.vi_tri_id
        where k.chi_nhanh_id = p_chi_nhanh_id and k.trang_thai = 'dang_dem' and k.ly_do is not null
          and (not v_chi_quay or vt.loai = 'quay')));
  end if;

  if kho_duoc(p_chi_nhanh_id, 'pha_loc') then
    v := v || jsonb_build_object('pha_nhap', (
      select count(*) from kho_phien_pha f
      where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'nhap'));
  end if;

  if kho_duoc(p_chi_nhanh_id, 'duyet') then
    v := v || jsonb_build_object(
      'duyet_nhap', (select count(*) from kho_phieu_nhap
                     where chi_nhanh_id = p_chi_nhanh_id and trang_thai = 'cho_duyet'),
      'duyet_huy', (select count(*) from kho_phieu_xuat
                    where chi_nhanh_id = p_chi_nhanh_id and loai = 'huy' and trang_thai = 'cho_duyet'),
      'duyet_kiem_ke', (select count(*) from kho_kiem_ke
                        where chi_nhanh_id = p_chi_nhanh_id and trang_thai = 'cho_duyet'));
  end if;

  if kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    v := v || (
      select jsonb_build_object(
        'cong_no_qua_han', count(*) filter (where c.qua_han),
        'cong_no_7_ngay',  count(*) filter (where c.con_no > 0
                                              and c.han_thanh_toan between v_hom_nay and v_hom_nay + 7),
        'chua_doi_chieu',  count(*) filter (where not c.da_doi_chieu))
      from kho_v_cong_no_phieu c
      where c.chi_nhanh_id = p_chi_nhanh_id);
  end if;

  v := v || jsonb_build_object('chua_doc', v_chua_doc, 'thong_bao_xem_luc', v_xem_luc);

  return v;
end;
$$;

comment on function kho_dem_viec is
  'Mọi số đỏ trên menu kho của người đang đăng nhập ở một chi nhánh, trong MỘT lần gọi. Khóa nào không có quyền thì vắng mặt. Chỉ đếm, không tiền.';


-- =============================================================================
-- 5 · THÔNG BÁO
-- =============================================================================
create or replace function kho_thong_bao(p_chi_nhanh_id uuid, p_gioi_han int)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ns      nhan_su;
  v_xem_luc timestamptz;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  v_ns := nhan_su_hien_tai();
  select x.thong_bao_xem_luc into v_xem_luc
  from kho_nguoi_xem x where x.nhan_su_id = v_ns.id and x.chi_nhanh_id = p_chi_nhanh_id;

  return jsonb_build_object(
    'xem_luc', v_xem_luc,
    'su_kien', coalesce((
      select jsonb_agg(to_jsonb(e) || jsonb_build_object('chua_doc', v_xem_luc is null or e.luc > v_xem_luc)
                       order by e.luc desc)
      from (
        select * from kho_su_kien(p_chi_nhanh_id) s
        where s.luc <= now() and s.luc >= now() - interval '30 days'
        order by s.luc desc
        limit least(greatest(coalesce(p_gioi_han, 100), 1), 300)
      ) e), '[]'::jsonb));
end;
$$;

comment on function kho_thong_bao is
  'Danh sách sự kiện thông báo (mới nhất trước, tối đa p_gioi_han, 30 ngày gần nhất) kèm cờ chưa đọc. Câu chữ do lib/kho/viec.ts dựng từ khóa.';

create or replace function kho_da_xem_thong_bao(p_chi_nhanh_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ns nhan_su;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  v_ns := nhan_su_hien_tai();
  insert into kho_nguoi_xem (nhan_su_id, chi_nhanh_id, thong_bao_xem_luc)
  values (v_ns.id, p_chi_nhanh_id, now())
  on conflict (nhan_su_id, chi_nhanh_id) do update set thong_bao_xem_luc = excluded.thong_bao_xem_luc;
end;
$$;

comment on function kho_da_xem_thong_bao is 'Đánh dấu mọi thông báo tới lúc này là đã đọc (người đang đăng nhập, một chi nhánh).';


-- =============================================================================
-- 6 · LƯU NGƯỠNG CẢNH BÁO
-- =============================================================================
create or replace function kho_luu_nguong(p_chi_nhanh_id uuid, p_nguong jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_khoa text;
  v_so   numeric;
  v_hop_le constant text[] := array['nguong_gia_mua_pt', 'nguong_thu_hoi_diem', 'gio_nhac_chuyen',
                                    'gio_chot_ngay', 'nguong_dinh_muc_pt'];
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không được sửa cài đặt kho'
      using errcode = 'insufficient_privilege';
  end if;
  if p_nguong is null or jsonb_typeof(p_nguong) <> 'object' then
    raise exception 'Ngưỡng phải là một đối tượng {tên: số}' using errcode = 'check_violation';
  end if;

  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Kho của chi nhánh này chưa được khởi tạo' using errcode = 'check_violation';
  end if;

  for v_khoa in select jsonb_object_keys(p_nguong) loop
    if not (v_khoa = any(v_hop_le)) then
      raise exception 'Không có ngưỡng tên "%"', v_khoa using errcode = 'check_violation';
    end if;
    if jsonb_typeof(p_nguong -> v_khoa) <> 'number' then
      raise exception 'Ngưỡng "%" phải là một con số', v_khoa using errcode = 'check_violation';
    end if;
    v_so := (p_nguong ->> v_khoa)::numeric;
    if v_khoa in ('gio_nhac_chuyen', 'gio_chot_ngay') and v_so <> trunc(v_so) then
      raise exception 'Ngưỡng "%" phải là số giờ nguyên', v_khoa using errcode = 'check_violation';
    end if;
  end loop;

  update kho_cai_dat set
    nguong_gia_mua_pt   = coalesce((p_nguong ->> 'nguong_gia_mua_pt')::numeric,   nguong_gia_mua_pt),
    nguong_thu_hoi_diem = coalesce((p_nguong ->> 'nguong_thu_hoi_diem')::numeric, nguong_thu_hoi_diem),
    gio_nhac_chuyen     = coalesce((p_nguong ->> 'gio_nhac_chuyen')::smallint,    gio_nhac_chuyen),
    gio_chot_ngay       = coalesce((p_nguong ->> 'gio_chot_ngay')::smallint,      gio_chot_ngay),
    nguong_dinh_muc_pt  = coalesce((p_nguong ->> 'nguong_dinh_muc_pt')::numeric,  nguong_dinh_muc_pt)
  where chi_nhanh_id = p_chi_nhanh_id;
end;
$$;

comment on function kho_luu_nguong is
  'Lưu các ngưỡng cảnh báo của chi nhánh (quyền danh_muc). Chỉ nhận các khóa đã biết, giá trị là số; ràng buộc CHECK của bảng giữ khoảng hợp lệ.';


-- =============================================================================
-- 7 · CHỈ SỐ QUẢN TRỊ — SECURITY INVOKER
-- =============================================================================
-- Chạy dưới quyền người gọi, nên RLS của kho_lo_gia vẫn áp dụng: người không
-- có quyền xem giá nhận về 0 đồng thay vì lỗi. Kỳ trước = cùng số ngày, ngay
-- trước p_tu — để so "tuần này / tuần trước", "tháng này / tháng trước".
create or replace function kho_chi_so_quan_tri(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns jsonb
language sql
stable
set search_path = public
as $$
  with ky as (
    select p_tu as tu, p_den as den,
           p_tu - (p_den - p_tu + 1) as tu_truoc, p_tu - 1 as den_truoc
  ),
  ton as (
    select coalesce(sum(g.gia_tri) filter (where v.loai = 'kho'), 0)  as gia_tri_kho,
           coalesce(sum(g.gia_tri) filter (where v.loai = 'quay'), 0) as gia_tri_quay
    from kho_v_ton_gia g
    join kho_vi_tri v on v.id = g.vi_tri_id
    where g.chi_nhanh_id = p_chi_nhanh_id
  ),
  quay as (
    select m.id, m.ton_toi_thieu_kg, coalesce(sum(t.so_kg), 0) as con_kg
    from kho_mat_hang m
    left join kho_v_ton t on t.mat_hang_id = m.id and t.chi_nhanh_id = p_chi_nhanh_id
                         and t.loai_vi_tri = 'quay' and t.tinh_trang_han <> 'het_han'
    where m.dang_dung and m.ton_toi_thieu_kg is not null
    group by m.id, m.ton_toi_thieu_kg
  ),
  pha as (
    select sum(f.tong_kg_vao)  filter (where f.ngay_pha between k.tu and k.den)             as kg_vao,
           sum(f.tong_kg_thit) filter (where f.ngay_pha between k.tu and k.den)             as kg_thit,
           count(*)            filter (where f.ngay_pha between k.tu and k.den)             as so_phien,
           sum(f.tong_kg_vao)  filter (where f.ngay_pha between k.tu_truoc and k.den_truoc) as kg_vao_truoc,
           sum(f.tong_kg_thit) filter (where f.ngay_pha between k.tu_truoc and k.den_truoc) as kg_thit_truoc
    from kho_phien_pha f, ky k
    where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'da_chot'
  ),
  gia_von as (
    select sum(g.gia_tri)   filter (where l.ngay_dong_goi between k.tu and k.den)             as gt,
           sum(g.so_kg_goc) filter (where l.ngay_dong_goi between k.tu and k.den)             as kg,
           sum(g.gia_tri)   filter (where l.ngay_dong_goi between k.tu_truoc and k.den_truoc) as gt_truoc,
           sum(g.so_kg_goc) filter (where l.ngay_dong_goi between k.tu_truoc and k.den_truoc) as kg_truoc
    from kho_lo l
    join kho_lo_gia g on g.lo_id = l.id
    join kho_mat_hang m on m.id = l.mat_hang_id
    cross join ky k
    where l.chi_nhanh_id = p_chi_nhanh_id and l.nguon = 'pha_loc' and m.loai = 'phan_cat'
  ),
  so_cai as (
    select coalesce(g.loai, s.loai) as loai, s.so_kg, s.ngay,
           s.so_kg * coalesce(lg.gia_von_kg, 0) as gia_tri
    from kho_so_cai s
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_lo_gia lg on lg.lo_id = s.lo_id
    cross join ky k
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay between k.tu_truoc and k.den
  ),
  dung as (
    select
      -- Thịt đã dùng = bán + xuất bếp + hủy + thiếu khi kiểm kê (thừa trừ lại)
      -sum(x.gia_tri) filter (where x.loai in ('ban', 'xuat_bep', 'huy', 'kiem_ke', 'hao_hut')
                               and x.ngay between k.tu and k.den)                          as chi_phi,
      -sum(x.gia_tri) filter (where x.loai in ('ban', 'xuat_bep', 'huy', 'kiem_ke', 'hao_hut')
                               and x.ngay between k.tu_truoc and k.den_truoc)              as chi_phi_truoc,
      -sum(x.gia_tri) filter (where x.loai = 'huy' and x.ngay between k.tu and k.den)       as huy,
      -sum(x.gia_tri) filter (where x.loai in ('kiem_ke', 'hao_hut') and x.ngay between k.tu and k.den
                               and x.so_kg < 0)                                            as kiem_ke_thieu,
       sum(x.gia_tri) filter (where x.loai in ('kiem_ke', 'hao_hut') and x.ngay between k.tu and k.den
                               and x.so_kg > 0)                                            as kiem_ke_thua,
      -sum(x.gia_tri) filter (where x.loai = 'xuat_bep' and x.ngay between k.tu and k.den)  as xuat_bep,
      -sum(x.gia_tri) filter (where x.loai = 'ban' and x.ngay between k.tu and k.den)       as ban_gia_von,
      -sum(x.so_kg)   filter (where x.loai = 'ban' and x.ngay between k.tu and k.den)       as ban_kg
    from so_cai x, ky k
  ),
  ban as (
    select sum(b.doanh_thu_uoc_tinh) as doanh_thu_uoc_tinh
    from kho_bao_cao_ban(p_chi_nhanh_id, p_tu, p_den) b
  )
  select jsonb_build_object(
    'tu', p_tu, 'den', p_den,
    'gia_tri_ton_kho',  (select gia_tri_kho from ton),
    'gia_tri_ton_quay', (select gia_tri_quay from ton),
    'mh_het_quay',      (select count(*) from quay where con_kg = 0),
    'mh_duoi_muc',      (select count(*) from quay where con_kg > 0 and con_kg < ton_toi_thieu_kg),
    'so_phien_pha',     (select coalesce(so_phien, 0) from pha),
    'thu_hoi_pt',       (select case when kg_vao > 0 then round(kg_thit * 100 / kg_vao, 2) end from pha),
    'thu_hoi_pt_truoc', (select case when kg_vao_truoc > 0 then round(kg_thit_truoc * 100 / kg_vao_truoc, 2) end from pha),
    'gia_von_kg',       (select case when kg > 0 then round(gt / kg) end from gia_von),
    'gia_von_kg_truoc', (select case when kg_truoc > 0 then round(gt_truoc / kg_truoc) end from gia_von),
    'chi_phi_thit',       (select coalesce(round(chi_phi), 0) from dung),
    'chi_phi_thit_truoc', (select coalesce(round(chi_phi_truoc), 0) from dung),
    'huy',                (select coalesce(round(huy), 0) from dung),
    'kiem_ke_thieu',      (select coalesce(round(kiem_ke_thieu), 0) from dung),
    'kiem_ke_thua',       (select coalesce(round(kiem_ke_thua), 0) from dung),
    'xuat_bep',           (select coalesce(round(xuat_bep), 0) from dung),
    'ban_gia_von',        (select coalesce(round(ban_gia_von), 0) from dung),
    'ban_kg',             (select coalesce(ban_kg, 0) from dung),
    'doanh_thu_uoc_tinh', (select coalesce(doanh_thu_uoc_tinh, 0) from ban)
  )
$$;

comment on function kho_chi_so_quan_tri is
  'Số cho cột "Quản trị" của trang chủ quản lý: giá trị tồn, món quầy hết/dưới mức, thu hồi, giá vốn thịt/kg, chi phí thịt, hủy, chênh kiểm kê, bán ước tính — kỳ này và kỳ trước. SECURITY INVOKER: không có quyền xem giá thì tiền = 0.';


-- =============================================================================
-- 8 · HÀM NỘI BỘ — RÚT KHỎI authenticated
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_luc_vn(date, numeric) from authenticated';
    execute 'revoke execute on function kho_su_kien(uuid) from authenticated';
  end if;
end
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
