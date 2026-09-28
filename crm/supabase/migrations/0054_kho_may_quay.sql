-- =============================================================================
-- BEEFTOWN KHO — 0054 · MÁY QUẦY (BEEFTOWN CÂN): MÃ GIẢM GIÁ · BẢNG QUẦY ·
--                         TẢNG & Ô MÃ · BÁO CÁO BÁN THEO GIỜ
-- =============================================================================
-- Beeftown Cân (can-app) thành phần mềm của quầy, không chỉ nạp cân. Chủ nhà
-- hàng đã chốt (27/09/2026):
--
--   · GIẢM GIÁ HÀNG CẬN DATE BẰNG MÃ CÂN RIÊNG (đổi chính sách 0032 "không
--     giảm giá"). Máy tính tiền FABi không đọc giá trên tem — mã vạch chỉ có
--     mã hàng 5 số + trọng lượng, FABi nhân với giá món của FABi. Nên mỗi mức
--     giảm của một món là MỘT MÃ CÂN RIÊNG (kho_ma_giam): trên cân là một hàng
--     "Steak Ribeye Angus -30%" giá đã giảm; trên FABi là một món cùng mã, cùng
--     giá đã giảm. NV quầy cân lại gói cận date bằng mã giảm, dán tem mới.
--     Bán ra: kho nhận mã giảm như nhận ô mã (0051) → trừ đúng món, theo hạn
--     gần nhất, ghi kho_ipos_dong.ma_giam_id để báo cáo tiền đã giảm và bắt
--     trường hợp giảm giá gói còn hạn xa.
--   · Máy quầy dùng cho NV quầy + quản lý: đăng nhập theo vai. NV quầy không
--     đọc được phiên lóc, dòng bán iPOS (xem_gia) → hàm bảng quầy và tảng & ô
--     là SECURITY DEFINER, kiểm quyền xem, KHÔNG trả tiền vốn.
--
-- Bảng mới: kho_ma_giam.  Cột mới: kho_ipos_dong.ma_giam_id.
-- Hàm mới: kho_gia_giam (thuần), kho_luu_ma_giam, kho_bat_ma_giam (danh_muc),
--   kho_bang_quay, kho_can_o_ma (xem), kho_bao_cao_ban_gio (xem_gia).
-- THAY THÂN (cùng chữ ký): kho_ipos_ghi_dong (chép 0051, chỗ đổi ghi 0054),
--   kho_mat_hang_theo_ma_can (nhận cả mã giảm — quét nhãn đếm quầy / kiểm kê).
-- View kho_v_ipos_dong thêm cột cuối: ma_giam_id, giam_pt, ma_can_giam.
-- =============================================================================


-- =============================================================================
-- 1 · MÃ GIẢM GIÁ
-- =============================================================================
create table kho_ma_giam (
  id          uuid primary key default gen_random_uuid(),
  mat_hang_id uuid not null references kho_mat_hang(id) on delete restrict,
  phan_tram   int not null,
  ma_can      text not null,
  dang_dung   boolean not null default true,
  nguoi_tao   uuid references nhan_su(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint kho_ma_giam_phan_tram_hop_le check (phan_tram between 5 and 90),
  constraint kho_ma_giam_ma_can_hop_le check (ma_can ~ '^[1-9][0-9]{0,5}$'),
  constraint kho_ma_giam_ma_can_duy_nhat unique (ma_can),
  constraint kho_ma_giam_muc_duy_nhat unique (mat_hang_id, phan_tram)
);

comment on table kho_ma_giam is
  'Mã giảm giá hàng cận date (0054): một mức giảm của một món = một mã cân riêng. Trên cân là hàng "<tên> -30%" giá đã giảm; trên FABi tạo món cùng mã, cùng giá đã giảm. Dùng chung toàn thương hiệu. Chỉ ghi qua hàm.';
comment on column kho_ma_giam.dang_dung is
  'Tắt = không đưa lên cân nữa. Mã vẫn giữ (không dùng lại cho món khác) để tem in trước đó vẫn bán được.';

alter table kho_ma_giam enable row level security;
create policy kho_ma_giam_doc on kho_ma_giam
  for select using ((select kho_co_quyen('xem')));

-- Giá sau giảm: làm tròn tới 1.000 đ. Công thức này có bản TypeScript giống
-- hệt (web/src/lib/kho/ma-giam.ts giaGiam) — sửa thì sửa cả hai.
create or replace function kho_gia_giam(p_gia bigint, p_phan_tram int)
returns bigint
language sql
immutable
as $$
  select case when p_gia is null or p_phan_tram is null then null
              else (round(p_gia * (100 - p_phan_tram) / 100000.0) * 1000)::bigint end;
$$;

comment on function kho_gia_giam is
  'NỘI BỘ (0054). Giá bán/kg sau khi giảm p_phan_tram %, làm tròn tới 1.000 đ (0054). Giống ma-giam.ts giaGiam.';

-- Mã cân không được trùng giữa ba nơi: mã món, ô mã (0049), mã giảm.
create or replace function kho_ma_giam_kiem()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.ma_can := ltrim(btrim(new.ma_can), '0');
  if exists (select 1 from kho_mat_hang where ma_can = new.ma_can and dang_dung) then
    raise exception 'Mã % đang là mã cân của một món — chọn mã khác', new.ma_can using errcode = 'unique_violation';
  end if;
  if exists (select 1 from kho_o_ma where ma_can = new.ma_can) then
    raise exception 'Mã % đang là ô mã của một phần cắt theo tảng — chọn mã khác', new.ma_can using errcode = 'unique_violation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger kho_ma_giam_kiem_trigger
  before insert or update on kho_ma_giam
  for each row execute function kho_ma_giam_kiem();

create or replace function kho_o_ma_khong_trung_giam()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from kho_ma_giam where ma_can = ltrim(btrim(new.ma_can), '0')) then
    raise exception 'Mã % đang là mã giảm giá — chọn mã ô khác', new.ma_can using errcode = 'unique_violation';
  end if;
  return new;
end;
$$;

create trigger kho_o_ma_z_khong_trung_giam
  before insert or update of ma_can on kho_o_ma
  for each row execute function kho_o_ma_khong_trung_giam();

create or replace function kho_mat_hang_ma_can_khong_trung_giam()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ma_can is not null and new.dang_dung
     and exists (select 1 from kho_ma_giam where ma_can = new.ma_can) then
    raise exception 'Mã cân % đang là mã giảm giá — chọn mã khác', new.ma_can using errcode = 'unique_violation';
  end if;
  return new;
end;
$$;

-- Tên bắt đầu bằng "kho_mat_hang_z" để chạy SAU trigger chuẩn hoá mã cân (0019).
create trigger kho_mat_hang_z_ma_can_khong_trung_giam
  before insert or update of ma_can, dang_dung on kho_mat_hang
  for each row execute function kho_mat_hang_ma_can_khong_trung_giam();

-- Tạo / bật lại một mức giảm. p_ma_can null = lấy mã trống nhỏ nhất từ 90001.
create or replace function kho_luu_ma_giam(p_mat_hang_id uuid, p_phan_tram int, p_ma_can text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mh kho_mat_hang;
  v_g  kho_ma_giam;
  v_ma text := nullif(ltrim(btrim(coalesce(p_ma_can, '')), '0'), '');
  v_so int;
begin
  if not kho_co_quyen('danh_muc') then
    raise exception 'Chỉ quản lý hoặc chủ được tạo mã giảm giá' using errcode = 'insufficient_privilege';
  end if;
  select * into v_mh from kho_mat_hang where id = p_mat_hang_id;
  if v_mh.id is null or not v_mh.dang_dung then
    raise exception 'Không thấy món này, hoặc món đã ngừng dùng' using errcode = 'no_data_found';
  end if;
  if coalesce(v_mh.gia_ban_kg, 0) <= 0 then
    raise exception '"%" chưa có giá bán/kg — điền giá ở Mặt hàng trước', v_mh.ten using errcode = 'check_violation';
  end if;
  if v_mh.ma_can is null and not exists (select 1 from kho_o_ma where mat_hang_id = v_mh.id) then
    raise exception '"%" không bán qua cân (chưa có mã cân) — mã giảm giá chỉ dùng cho hàng cân', v_mh.ten
      using errcode = 'check_violation';
  end if;
  if p_phan_tram is null or p_phan_tram not between 5 and 90 then
    raise exception 'Mức giảm từ 5%% đến 90%%' using errcode = 'check_violation';
  end if;
  if v_ma is not null and v_ma !~ '^[1-9][0-9]{0,5}$' then
    raise exception 'Mã cân là số, tối đa 6 chữ số' using errcode = 'check_violation';
  end if;

  select * into v_g from kho_ma_giam where mat_hang_id = v_mh.id and phan_tram = p_phan_tram;
  if v_g.id is not null then
    update kho_ma_giam set dang_dung = true, ma_can = coalesce(v_ma, ma_can) where id = v_g.id
    returning * into v_g;
  else
    if v_ma is null then
      for v_so in 90001 .. 999999 loop
        v_ma := v_so::text;
        exit when not exists (select 1 from kho_ma_giam where ma_can = v_ma)
              and not exists (select 1 from kho_o_ma where ma_can = v_ma)
              and not exists (select 1 from kho_mat_hang where ma_can = v_ma);
        v_ma := null;
      end loop;
      if v_ma is null then
        raise exception 'Hết mã trống để tạo mã giảm giá — nhập mã tay' using errcode = 'check_violation';
      end if;
    end if;
    insert into kho_ma_giam (mat_hang_id, phan_tram, ma_can, nguoi_tao)
    values (v_mh.id, p_phan_tram, v_ma, (nhan_su_hien_tai()).id)
    returning * into v_g;
  end if;

  return jsonb_build_object('id', v_g.id, 'mat_hang_id', v_mh.id, 'ten', v_mh.ten, 'phan_tram', v_g.phan_tram,
                            'ma_can', v_g.ma_can, 'gia_ban_kg', v_mh.gia_ban_kg,
                            'gia_giam_kg', kho_gia_giam(v_mh.gia_ban_kg, v_g.phan_tram), 'dang_dung', v_g.dang_dung);
end;
$$;

comment on function kho_luu_ma_giam is
  'Tạo hoặc bật lại mức giảm p_phan_tram (5–90) của một món bán qua cân (danh_muc, 0054). p_ma_can null = tự lấy mã trống từ 90001. Trả {id, mat_hang_id, ten, phan_tram, ma_can, gia_ban_kg, gia_giam_kg, dang_dung}.';

create or replace function kho_bat_ma_giam(p_id uuid, p_dang_dung boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_g kho_ma_giam;
begin
  if not kho_co_quyen('danh_muc') then
    raise exception 'Chỉ quản lý hoặc chủ được sửa mã giảm giá' using errcode = 'insufficient_privilege';
  end if;
  update kho_ma_giam set dang_dung = coalesce(p_dang_dung, false) where id = p_id returning * into v_g;
  if v_g.id is null then
    raise exception 'Không thấy mã giảm giá này' using errcode = 'no_data_found';
  end if;
  return case when v_g.dang_dung then 'Đã bật mã ' || v_g.ma_can || ' (giảm ' || v_g.phan_tram || '%).'
              else 'Đã tắt mã ' || v_g.ma_can || '. Lần gửi xuống cân sau sẽ bỏ hàng này (qua WiFi thì còn nằm trên cân, nạp USB để xoá hẳn).' end;
end;
$$;

comment on function kho_bat_ma_giam is
  'Bật / tắt một mã giảm giá (danh_muc, 0054). Tắt = không đưa lên cân; mã vẫn giữ để tem cũ bán được.';

-- Món theo mã cân: mã của món, mã một ô (0049), hoặc mã giảm giá (0054).
create or replace function kho_mat_hang_theo_ma_can(p_ma_can text)
returns setof kho_mat_hang
language sql
stable
security definer
set search_path = public
as $$
  select m.* from kho_mat_hang m where m.ma_can = p_ma_can and m.dang_dung
  union all
  select m.* from kho_o_ma o join kho_mat_hang m on m.id = o.mat_hang_id
  where o.ma_can = p_ma_can and m.dang_dung
    and not exists (select 1 from kho_mat_hang x where x.ma_can = p_ma_can and x.dang_dung)
  union all
  select m.* from kho_ma_giam g join kho_mat_hang m on m.id = g.mat_hang_id
  where g.ma_can = p_ma_can and m.dang_dung
    and not exists (select 1 from kho_mat_hang x where x.ma_can = p_ma_can and x.dang_dung)
    and not exists (select 1 from kho_o_ma x where x.ma_can = p_ma_can)
  limit 1;
$$;

comment on function kho_mat_hang_theo_ma_can is
  'NỘI BỘ (0049, 0054). Món của một mã cân đọc từ nhãn: mã của món, mã một ô mã, hoặc mã giảm giá của món.';


-- =============================================================================
-- 2 · BÁN QUA iPOS NHẬN MÃ GIẢM
-- =============================================================================
alter table kho_ipos_dong add column ma_giam_id uuid references kho_ma_giam(id) on delete set null;
comment on column kho_ipos_dong.ma_giam_id is
  'Mã giảm giá của dòng bán (0054) — mã món iPOS trùng mã giảm, hoặc nhãn cân in bằng mã giảm. Trừ theo hạn gần nhất.';

create index kho_ipos_dong_ma_giam_idx on kho_ipos_dong(ma_giam_id) where ma_giam_id is not null;

-- Thêm cột vào cuối view (giữ nguyên các cột cũ — chép 0051).
create or replace view kho_v_ipos_dong with (security_invoker = true) as
  select d.id, d.chi_nhanh_id, d.hoa_don_id, h.ma_hd, h.da_huy as hd_da_huy, d.khoa_dong,
         d.thoi_diem_ban, ((d.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date as ngay_ban,
         d.ma_ipos, d.ten_ipos, d.ma_vach, d.ma_can, d.so_kg, d.so_goi, d.thanh_tien,
         d.mat_hang_id, m.ma as ma_mat_hang, m.ten as ten_mat_hang, m.dem_goi, m.don_vi_goi,
         d.trang_thai, d.so_lan_thu, d.ly_do, d.lo_het_han, d.ghi_luc, d.xu_ly_boi, d.xu_ly_luc,
         d.created_at, d.updated_at, d.so_luong,
         d.o_ma_id, o.so_o, o.ma_can as ma_can_o, d.lo_o_id, d.lech_o,
         (select coalesce(g.so_tang, l.so_tang) from kho_lo l left join kho_lo g on g.id = l.tang_goc_id
           where l.id = d.lo_o_id) as so_tang,
         d.ma_giam_id, mg.phan_tram as giam_pt, mg.ma_can as ma_can_giam
  from kho_ipos_dong d
  join kho_ipos_hoa_don h on h.id = d.hoa_don_id
  left join kho_mat_hang m on m.id = d.mat_hang_id
  left join kho_o_ma o on o.id = d.o_ma_id
  left join kho_ma_giam mg on mg.id = d.ma_giam_id;

comment on view kho_v_ipos_dong is
  'Dòng bán iPOS kèm mã HĐ, tên món kho, ngày bán giờ VN (0037), số lượng gốc (0042), ô mã / lô của ô / số tảng / lệch ô (0051), mã giảm giá (0054). security_invoker: vai không xem_gia không thấy dòng nào.';

-- kho_ipos_ghi_dong — chép 0051; chỗ đổi ghi 0054: nhận mã giảm (như ô), mặc
-- định bán theo kg, ghi ma_giam_id.
create or replace function kho_ipos_ghi_dong(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d     kho_ipos_dong;
  v_h     kho_ipos_hoa_don;
  v_c     kho_ipos_cau_hinh;
  v_cd    kho_cai_dat;
  v_mp    kho_ipos_ma_hang;
  v_mh    kho_mat_hang;
  v_doc   record;
  v_ma    text;
  v_kg    numeric;
  v_goi   int;
  v_pb    jsonb;
  v_px    record;
  v_e     jsonb;
  v_n     int;
  v_i     int := 0;
  v_so    numeric;
  v_con   numeric;
  v_phan  numeric;
  v_ngay  date;
  v_nv    uuid;
  v_tu_sl boolean := false;   -- 0042: số lượng suy từ so_luong (callback, không nhãn)
  v_dv    text;
  v_o     uuid;               -- 0051: ô mã của dòng bán
  v_om    kho_o_ma;
  v_lo_o  uuid;               -- 0051: lô đang gắn với ô lúc bán
  v_lech  boolean := false;   -- 0051: có ô mà không trừ được lô của ô
  v_mg    kho_ma_giam;        -- 0054: mã giảm giá của dòng bán
begin
  select * into v_d from kho_ipos_dong where id = p_id for update;
  if not found then
    return null;
  end if;
  if v_d.trang_thai not in ('cho', 'thieu_hang', 'chua_khop', 'loi') then
    return v_d.trang_thai;
  end if;

  begin
    select * into v_h  from kho_ipos_hoa_don where id = v_d.hoa_don_id;
    select * into v_c  from kho_ipos_cau_hinh where chi_nhanh_id = v_d.chi_nhanh_id;
    select * into v_cd from kho_cai_dat where chi_nhanh_id = v_d.chi_nhanh_id;

    if v_h.da_huy then
      update kho_ipos_dong set trang_thai = 'da_huy', ly_do = 'Hóa đơn đã hủy trên iPOS' where id = p_id;
      return 'da_huy';
    end if;

    -- Chưa chuyển sang trừ kho theo iPOS: quầy còn "thiếu = đã bán". Để chờ.
    if v_cd.chi_nhanh_id is null or v_cd.nguon_so_ban <> 'ipos' or v_c.ipos_tu_luc is null then
      update kho_ipos_dong set trang_thai = 'cho', ly_do = 'Chưa chuyển sang trừ kho theo iPOS' where id = p_id;
      return 'cho';
    end if;
    if v_d.thoi_diem_ban < v_c.ipos_tu_luc then
      update kho_ipos_dong set trang_thai = 'bo_qua', so_lan_thu = so_lan_thu + 1,
        ly_do = 'Bán trước mốc chuyển sang iPOS — đã tính trong lần đếm quầy'
      where id = p_id;
      return 'bo_qua';
    end if;

    -- ---- Khớp món ------------------------------------------------------------
    if v_d.ma_ipos is not null then
      select * into v_mp from kho_ipos_ma_hang where chi_nhanh_id = v_d.chi_nhanh_id and ma_ipos = v_d.ma_ipos;
    end if;
    if v_mp.kieu = 'bo_qua' then
      update kho_ipos_dong set trang_thai = 'bo_qua', so_lan_thu = so_lan_thu + 1,
        ly_do = case when v_mp.don_vi_ban = 'suat' then 'Món chế biến — chỉ đếm suất, không trừ kho'
                     else 'Không phải hàng kho' end
      where id = p_id;
      return 'bo_qua';
    end if;

    v_ma := v_d.ma_can;
    v_kg := v_d.so_kg;
    if v_d.ma_vach is not null and v_cd.mau_ma_vach is not null then
      select * into v_doc from kho_doc_ma_vach(v_d.ma_vach, v_cd.mau_ma_vach, v_cd.so_le_kg);
      if v_doc.loi is null then
        v_ma := coalesce(v_ma, v_doc.ma_can);
        v_kg := coalesce(v_kg, v_doc.so_kg);
      end if;
    end if;

    -- 0051 · Ô mã: ghép thẳng (kho_ipos_ma_hang.o_ma_id); hoặc chưa ghép mà mã
    -- món iPOS trùng mã ô (món ô trên FABi đặt mã = mã cân); hoặc nhãn cân in
    -- bằng mã ô. Ghép "mon" không kèm ô thì không suy ô từ nhãn.
    v_o := v_mp.o_ma_id;
    if v_o is null and v_mp.id is null and v_d.ma_ipos is not null then
      select o.id into v_o from kho_o_ma o where o.ma_can = nullif(ltrim(btrim(v_d.ma_ipos), '0'), '');
    end if;
    if v_o is null and v_ma is not null and (v_mp.id is null or v_mp.kieu = 'goi_can') then
      select o.id into v_o from kho_o_ma o where o.ma_can = v_ma;
    end if;
    if v_o is not null then
      select * into v_om from kho_o_ma where id = v_o;
    end if;

    -- 0054 · Mã giảm giá: như ô — mã món iPOS chưa ghép trùng một mã giảm (món
    -- giảm trên FABi đặt mã = mã cân giảm), hoặc nhãn cân in bằng mã giảm.
    -- Mã giảm đã tắt vẫn nhận: tem in trước khi tắt vẫn bán được.
    if v_o is null and v_mp.id is null and v_d.ma_ipos is not null then
      select * into v_mg from kho_ma_giam g where g.ma_can = nullif(ltrim(btrim(v_d.ma_ipos), '0'), '');
    end if;
    if v_o is null and v_mg.id is null and v_ma is not null and (v_mp.id is null or v_mp.kieu = 'goi_can') then
      select * into v_mg from kho_ma_giam g where g.ma_can = v_ma;
    end if;

    if v_mp.kieu = 'mon' or (v_mp.kieu = 'goi_can' and v_mp.mat_hang_id is not null) then
      select * into v_mh from kho_mat_hang where id = v_mp.mat_hang_id;
    elsif v_om.id is not null then
      select * into v_mh from kho_mat_hang where id = v_om.mat_hang_id and dang_dung;
    elsif v_mg.id is not null then
      select * into v_mh from kho_mat_hang where id = v_mg.mat_hang_id and dang_dung;   -- 0054
    elsif v_ma is not null then
      select * into v_mh from kho_mat_hang_theo_ma_can(v_ma);   -- 0051: nhận cả mã ô (0049)
    end if;
    if v_om.id is not null and v_om.mat_hang_id is distinct from v_mh.id then
      v_o := null;   -- ô của món khác: bỏ, trừ theo món đã khớp
      v_om := null;
    end if;
    if v_mg.id is not null and v_mg.mat_hang_id is distinct from v_mh.id then
      v_mg := null;   -- 0054: mã giảm của món khác: bỏ
    end if;
    if v_mh.id is null then
      update kho_ipos_dong set trang_thai = 'chua_khop', so_lan_thu = so_lan_thu + 1, ma_can = coalesce(ma_can, v_ma),
        ly_do = case when v_mp.kieu = 'goi_can' then 'Mã cân ' || coalesce(v_ma, '(không đọc được)') || ' chưa gán cho món nào'
                     else 'Chưa ghép mã iPOS với món trong kho' end
      where id = p_id;
      return 'chua_khop';
    end if;

    if v_c.vi_tri_ban_id is null then
      raise exception 'Chưa chọn quầy bán trong Kết nối iPOS';
    end if;

    -- 0051: lô gắn với ô lúc bán (tảng đang dùng ô đó).
    if v_o is not null then
      v_lo_o := kho_ipos_lo_cua_o(v_d.chi_nhanh_id, v_o, v_d.thoi_diem_ban);
    end if;

    -- ---- 0042 · Dòng chỉ có số lượng iPOS (không nhãn cân) ------------------
    v_tu_sl := v_d.so_luong is not null and v_d.ma_vach is null and v_d.ma_can is null;
    if v_tu_sl then
      -- 0051: món có ô mã là món cân trên FABi — mặc định quantity là số kg.
      v_dv := coalesce(v_mp.don_vi_ban, case when v_o is not null or v_mg.id is not null or not v_mh.dem_goi then 'kg' else 'goi' end);
      if v_d.so_luong <= 0 then
        raise exception 'Số lượng bán trên iPOS phải lớn hơn 0';
      end if;
      if v_dv = 'kg' then
        v_kg := v_d.so_luong;
        if v_mh.dem_goi then
          v_goi := coalesce(kho_ipos_goi_theo_kg_lo(v_c.vi_tri_ban_id, v_lo_o, v_kg),
                            kho_ipos_goi_theo_kg(v_c.vi_tri_ban_id, v_mh.id, v_kg));
        end if;
      else
        if v_d.so_luong <> trunc(v_d.so_luong) then
          raise exception 'iPOS báo bán % gói "%" — số gói phải là số nguyên. Món này bán theo kg thì đổi "Bán theo" ở Ghép món',
            replace(trim_scale(v_d.so_luong)::text, '.', ','), v_mh.ten;
        end if;
        v_goi := v_d.so_luong::int;
        if v_mh.dem_goi then
          v_kg := null;   -- kg lấy theo sổ của gói bán ra
        elsif v_mp.kg_moi_don_vi is not null then
          v_kg := round(v_d.so_luong * v_mp.kg_moi_don_vi, 3);
        else
          raise exception '"%" tính theo kg mà iPOS bán theo gói — điền "mỗi gói = … kg" ở Ghép món', v_mh.ten;
        end if;
      end if;
    end if;

    if v_mh.dem_goi then
      v_goi := coalesce(v_goi, v_d.so_goi, 1);
      if v_goi <= 0 then
        raise exception 'Số gói bán phải lớn hơn 0';
      end if;
    else
      if v_kg is null or v_kg <= 0 then
        raise exception '"%" tính theo kg mà dòng iPOS không có số kg', v_mh.ten;
      end if;
    end if;

    -- ---- Lấy lô; thiếu thì tự nhận hàng đang mang ra quầy --------------------
    -- 0051: có ô → lấy đúng lô của ô trước; lô đó thiếu (hoặc ô chưa gắn lô)
    -- thì trừ theo hạn gần nhất như cũ và đánh dấu lech_o để đối soát.
    v_pb := kho_ipos_lay_lo_cua_lo(v_c.vi_tri_ban_id, v_mh.id, v_lo_o, v_goi, v_kg);
    v_lech := v_pb is null and v_o is not null;
    if v_pb is null then
      v_pb := kho_ipos_lay_lo(v_c.vi_tri_ban_id, v_mh.id, v_goi, v_kg);
    end if;
    if v_pb is null then
      for v_px in
        select x.id from kho_phieu_xuat x
        where x.chi_nhanh_id = v_d.chi_nhanh_id and x.loai = 'chuyen' and x.trang_thai = 'dang_chuyen'
          and x.vi_tri_den_id = v_c.vi_tri_ban_id
          and exists (select 1 from kho_chuyen_tren_duong(x.id) t where t.mat_hang_id = v_mh.id)
        order by x.created_at, x.id
      loop
        perform kho_ipos_tu_nhan(v_px.id);
        if v_tu_sl and v_dv = 'kg' and v_mh.dem_goi then
          v_goi := coalesce(kho_ipos_goi_theo_kg_lo(v_c.vi_tri_ban_id, v_lo_o, v_kg),
                            kho_ipos_goi_theo_kg(v_c.vi_tri_ban_id, v_mh.id, v_kg));
        end if;
        v_pb := kho_ipos_lay_lo_cua_lo(v_c.vi_tri_ban_id, v_mh.id, v_lo_o, v_goi, v_kg);
        v_lech := v_pb is null and v_o is not null;
        if v_pb is null then
          v_pb := kho_ipos_lay_lo(v_c.vi_tri_ban_id, v_mh.id, v_goi, v_kg);
        end if;
        exit when v_pb is not null;
      end loop;
    end if;
    if v_pb is null then
      update kho_ipos_dong set trang_thai = 'thieu_hang', so_lan_thu = so_lan_thu + 1,
        mat_hang_id = v_mh.id, ma_can = coalesce(ma_can, v_ma), o_ma_id = v_o, lo_o_id = v_lo_o, ma_giam_id = v_mg.id,
        so_kg = case when v_tu_sl then v_kg else coalesce(so_kg, v_kg) end,
        so_goi = case when v_tu_sl then v_goi else so_goi end,
        ly_do = 'Quầy không đủ "' || v_mh.ten || '" trên sổ: cần '
          || case when v_mh.dem_goi then v_goi || ' ' || v_mh.don_vi_goi
                    || case when v_tu_sl and v_kg is not null then ' (' || replace(trim_scale(v_kg)::text, '.', ',') || ' kg)' else '' end
                  else replace(trim_scale(v_kg)::text, '.', ',') || ' kg' end
      where id = p_id;
      return 'thieu_hang';
    end if;

    -- ---- Ghi sổ --------------------------------------------------------------
    v_ngay := ((v_d.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date;
    v_nv := (nhan_su_hien_tai()).id;
    v_n := jsonb_array_length(v_pb -> 'lo');
    select coalesce(sum((x ->> 'so_kg')::numeric), 0) into v_so from jsonb_array_elements(v_pb -> 'lo') x;
    v_con := v_kg;
    for v_e in select x from jsonb_array_elements(v_pb -> 'lo') x loop
      v_i := v_i + 1;
      if v_mh.dem_goi and v_kg is not null then
        -- Kg bán chia cho các lô theo kg sổ; lô cuối nhận phần dư.
        v_phan := case when v_i = v_n then v_con
                       when v_so > 0 then round(v_kg * (v_e ->> 'so_kg')::numeric / v_so, 3)
                       else 0 end;
        v_con := v_con - v_phan;
        if v_phan <> (v_e ->> 'so_kg')::numeric then
          insert into kho_so_cai
            (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
             chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi, ngay)
          values
            (v_d.chi_nhanh_id, (v_e ->> 'lo_id')::uuid, v_c.vi_tri_ban_id, v_mh.id, 'hao_hut',
             v_phan - (v_e ->> 'so_kg')::numeric, 0,
             'ban_hang', p_id,
             case when v_tu_sl then 'Lệch kg bán theo cân · iPOS ' else 'Lệch kg nhãn cân · iPOS ' end || v_h.ma_hd,
             v_nv, v_ngay);
        end if;
      else
        v_phan := (v_e ->> 'so_kg')::numeric;
      end if;
      if v_phan <> 0 or (v_e ->> 'so_goi')::int <> 0 then
        insert into kho_so_cai
          (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
           chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi, ngay)
        values
          (v_d.chi_nhanh_id, (v_e ->> 'lo_id')::uuid, v_c.vi_tri_ban_id, v_mh.id, 'ban',
           -v_phan, -(v_e ->> 'so_goi')::int,
           'ban_hang', p_id, 'iPOS ' || v_h.ma_hd, v_nv, v_ngay);
      end if;
    end loop;

    update kho_ipos_dong set
      trang_thai = 'da_ghi', so_lan_thu = so_lan_thu + 1, mat_hang_id = v_mh.id,
      ma_can = coalesce(ma_can, v_ma),
      so_kg = case when v_tu_sl then coalesce(v_kg, v_so) else coalesce(so_kg, v_kg) end,
      so_goi = case when v_tu_sl then v_goi else so_goi end,
      lo_het_han = (v_pb ->> 'het_han')::boolean, ghi_luc = now(),
      o_ma_id = v_o, lo_o_id = v_lo_o, lech_o = v_lech, ma_giam_id = v_mg.id,
      ly_do = nullif(concat_ws(' · ',
                case when (v_pb ->> 'het_han')::boolean then 'Đã bán gói thuộc lô HẾT HẠN' end,
                case when v_lech then 'Ô ' || v_om.so_o || ' (mã ' || v_om.ma_can || '): '
                  || case when v_lo_o is null then 'ô chưa gắn tảng lúc bán' else 'lô của tảng không đủ' end
                  || ' — đã trừ theo hạn gần nhất' end), '')
    where id = p_id;
    return 'da_ghi';
  exception when others then
    update kho_ipos_dong set trang_thai = 'loi', so_lan_thu = so_lan_thu + 1, ly_do = left(sqlerrm, 300)
    where id = p_id;
    return 'loi';
  end;
end;
$$;


-- =============================================================================
-- 3 · BẢNG QUẦY — một lần gọi cho màn "Quầy" của Beeftown Cân
-- =============================================================================
-- Không có giá vốn; giá bán/kg là giá công khai (vai xem đã đọc được ở
-- kho_mat_hang). Tính gộp / gợi ý ở phía máy (can-app/src/quay.ts).
create or replace function kho_bang_quay(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';
  end if;

  select jsonb_build_object(
    'hom_nay', hom_nay_vn(),
    'canh_bao_truoc_ngay', coalesce((select canh_bao_truoc_ngay from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id), 1),
    'vi_tri', coalesce((
      select jsonb_agg(jsonb_build_object('id', v.id, 'ten', v.ten) order by v.thu_tu, v.ten)
      from kho_vi_tri v where v.chi_nhanh_id = p_chi_nhanh_id and v.loai = 'quay' and v.dang_dung), '[]'::jsonb),
    -- Từng lô đang ở quầy.
    'lo', coalesce((
      select jsonb_agg(jsonb_build_object(
               'lo_id', t.lo_id, 'ma_lo', t.ma_lo, 'mat_hang_id', t.mat_hang_id, 'vi_tri_id', t.vi_tri_id,
               'so_goi', t.so_goi, 'so_kg', t.so_kg, 'han_dung', t.han_dung, 'so_ngay_con', t.so_ngay_con,
               'tinh_trang', t.tinh_trang_han, 'ngay_dong_goi', t.ngay_dong_goi,
               'so_tang', (select coalesce(g.so_tang, l.so_tang) from kho_lo l left join kho_lo g on g.id = l.tang_goc_id
                           where l.id = t.lo_id))
             order by t.han_dung nulls last, t.lo_tao_luc)
      from kho_v_ton t where t.chi_nhanh_id = p_chi_nhanh_id and t.loai_vi_tri = 'quay'), '[]'::jsonb),
    -- Món: có hàng ở quầy, hoặc có mức tối thiểu ở quầy.
    'mon', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.id, 'ma', m.ma, 'ten', m.ten, 'nhom', m.nhom, 'loai', m.loai, 'dem_goi', m.dem_goi,
               'don_vi_goi', m.don_vi_goi, 'ma_can', m.ma_can, 'gia_ban_kg', m.gia_ban_kg,
               'quay_toi_thieu_goi', m.quay_toi_thieu_goi, 'quay_toi_da_goi', m.quay_toi_da_goi,
               'ton_toi_thieu_kg', m.ton_toi_thieu_kg,
               'canh_bao_truoc_ngay', m.canh_bao_truoc_ngay)
             order by m.thu_tu, m.ten)
      from kho_mat_hang m
      where m.dang_dung and m.loai <> 'tang'
        and (m.quay_toi_thieu_goi is not null
             or exists (select 1 from kho_v_ton t where t.chi_nhanh_id = p_chi_nhanh_id and t.loai_vi_tri = 'quay'
                        and t.mat_hang_id = m.id))), '[]'::jsonb),
    -- Dưới mức ở quầy → đề nghị mang ra (0032).
    'goi_y', coalesce((
      select jsonb_agg(jsonb_build_object(
               'mat_hang_id', g.mat_hang_id, 'so_goi_quay', g.so_goi_quay, 'so_kg_quay', g.so_kg_quay,
               'so_goi_dang_mang', g.so_goi_dang_mang, 'so_goi_kho', g.so_goi_kho, 'so_kg_kho', g.so_kg_kho,
               'so_goi_de_nghi', g.so_goi_de_nghi, 'so_kg_de_nghi', g.so_kg_de_nghi))
      from kho_goi_y_ra_quay(p_chi_nhanh_id, null) g), '[]'::jsonb),
    'ma_giam', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', g.id, 'mat_hang_id', g.mat_hang_id, 'phan_tram', g.phan_tram, 'ma_can', g.ma_can,
               'gia_giam_kg', kho_gia_giam(m.gia_ban_kg, g.phan_tram))
             order by g.phan_tram)
      from kho_ma_giam g join kho_mat_hang m on m.id = g.mat_hang_id
      where g.dang_dung and m.dang_dung), '[]'::jsonb),
    -- Yêu cầu lấy hàng chưa xong (7 ngày gần nhất).
    'yeu_cau', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', y.id, 'so_phieu', y.so_phieu, 'trang_thai', y.trang_thai, 'created_at', y.created_at,
               'ghi_chu', y.ghi_chu, 'nguoi', ns.ho_ten,
               'dong', (select coalesce(jsonb_agg(jsonb_build_object('ten', m.ten, 'so_goi', d.so_goi, 'so_kg', d.so_kg,
                                                                     'don_vi_goi', m.don_vi_goi) order by m.ten), '[]'::jsonb)
                        from kho_yeu_cau_quay_dong d join kho_mat_hang m on m.id = d.mat_hang_id
                        where d.yeu_cau_id = y.id))
             order by y.created_at desc)
      from kho_yeu_cau_quay y left join nhan_su ns on ns.id = y.nguoi_tao
      where y.chi_nhanh_id = p_chi_nhanh_id and y.trang_thai in ('cho', 'dang_lam')
        and y.created_at > now() - interval '7 days'), '[]'::jsonb),
    -- Hàng đang mang ra quầy — NV quầy bấm "Đã nhận" (trên web).
    'dang_mang', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'so_phieu', x.so_phieu, 'created_at', x.created_at,
               'so_goi', (select coalesce(sum(t.so_goi), 0) from kho_chuyen_tren_duong(x.id) t))
             order by x.created_at)
      from kho_phieu_xuat x
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'chuyen' and x.trang_thai = 'dang_chuyen'), '[]'::jsonb),
    -- Phiếu huỷ ở quầy chờ quản lý duyệt.
    'cho_duyet_huy', coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'so_phieu', x.so_phieu, 'created_at', x.created_at,
               'ghi_chu', x.ghi_chu) order by x.created_at)
      from kho_phieu_xuat x join kho_vi_tri v on v.id = x.vi_tri_id
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'huy' and x.trang_thai = 'cho_duyet' and v.loai = 'quay'), '[]'::jsonb),
    'ly_do_huy', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'ten', l.ten, 'can_anh', l.can_anh) order by l.thu_tu, l.ten)
      from kho_ly_do l where l.loai = 'huy' and l.dang_dung), '[]'::jsonb)
  ) into v;
  return v;
end;
$$;

comment on function kho_bang_quay is
  'Màn Quầy của Beeftown Cân (quyền xem, 0054): {hom_nay, canh_bao_truoc_ngay, vi_tri[], lo[] (lô ở quầy, hạn, số tảng), mon[], goi_y[] (dưới mức, đề nghị mang ra), ma_giam[] (mã giảm đang bật, giá đã giảm), yeu_cau[] (chưa xong), dang_mang[], cho_duyet_huy[], ly_do_huy[]}. Không có giá vốn.';


-- =============================================================================
-- 4 · TẢNG & Ô MÃ — mỗi ô: đang giữ tảng nào, lóc ra bao nhiêu, bán / huỷ /
--     còn bao nhiêu, bán lệch ô mấy lần
-- =============================================================================
create or replace function kho_can_o_ma(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';
  end if;

  select coalesce(jsonb_agg(x.o order by x.ten, x.so_o), '[]'::jsonb) into v
  from (
    select m.ten, o.so_o, jsonb_build_object(
      'o_ma_id', o.id, 'mat_hang_id', m.id, 'ten', m.ten, 'so_o', o.so_o, 'ma_can', o.ma_can,
      'giao_id', g.id, 'tu_luc', g.tu_luc,
      'phien_pha_id', p.id, 'so_phieu_loc', p.so_phieu, 'trang_thai_phien', p.trang_thai,
      'lo_id', g.lo_id, 'ma_lo', lr.ma_lo, 'han_dung', lr.han_dung,
      'so_tang', lt.so_tang, 'ma_lo_tang', lt.ma_lo,
      'kg_ra', ra.so_kg, 'goi_ra', ra.so_goi,
      'con_kg', coalesce(tr.so_kg, 0), 'con_goi', coalesce(tr.so_goi, 0),
      'kg_ban', coalesce(sc.kg_ban, 0), 'goi_ban', coalesce(sc.goi_ban, 0),
      'kg_huy', coalesce(sc.kg_huy, 0), 'kg_khac', coalesce(sc.kg_khac, 0),
      'so_ban_dung_o', coalesce(bn.dung, 0), 'so_lech_o', coalesce(bn.lech, 0),
      'con_giu', g.id is not null and ((g.lo_id is null and p.trang_thai = 'nhap')
                                       or coalesce(tr.so_kg, 0) > 0 or coalesce(tr.so_goi, 0) > 0)
    ) as o
    from kho_o_ma o
    join kho_mat_hang m on m.id = o.mat_hang_id and m.dang_dung
    left join kho_o_ma_giao g on g.o_ma_id = o.id and g.chi_nhanh_id = p_chi_nhanh_id and g.den_luc is null
    left join kho_phien_pha p on p.id = g.phien_pha_id
    left join kho_lo lr on lr.id = g.lo_id
    left join lateral (select min(v.lo_id::text)::uuid as lo_vao_id from kho_phien_pha_vao v
                       where v.phien_pha_id = g.phien_pha_id) lv on true
    left join kho_lo lt on lt.id = lv.lo_vao_id
    left join lateral (select sum(r.so_kg) as so_kg, sum(r.so_goi)::int as so_goi from kho_phien_pha_ra r
                       where r.lo_id = g.lo_id) ra on true
    left join lateral (select sum(t.so_kg) as so_kg, sum(t.so_goi)::int as so_goi from kho_ton t
                       where t.lo_id = g.lo_id) tr on true
    left join lateral (
      select -sum(s.so_kg) filter (where s.loai = 'ban') as kg_ban,
             -sum(s.so_goi) filter (where s.loai = 'ban') as goi_ban,
             -sum(s.so_kg) filter (where s.loai = 'huy') as kg_huy,
             -sum(s.so_kg) filter (where s.loai in ('xuat_bep', 'xuat_khac', 'hao_hut', 'kiem_ke')) as kg_khac
      from kho_so_cai s where s.lo_id = g.lo_id and s.vi_tri_id in
        (select vt.id from kho_vi_tri vt where vt.chi_nhanh_id = p_chi_nhanh_id and vt.loai in ('quay', 'kho', 'cho_huy'))
    ) sc on true
    left join lateral (
      select count(*) filter (where not d.lech_o)::int as dung, count(*) filter (where d.lech_o)::int as lech
      from kho_ipos_dong d
      where d.chi_nhanh_id = p_chi_nhanh_id and d.o_ma_id = o.id and d.trang_thai = 'da_ghi'
        and d.thoi_diem_ban >= g.tu_luc
    ) bn on true
  ) x;
  return v;
end;
$$;

comment on function kho_can_o_ma is
  'Tảng & ô mã cho Beeftown Cân (quyền xem, 0054): mỗi ô mã của món đang dùng — tảng đang giữ ô (số tảng, lô vào), phiên lóc, lô ra (hạn), kg / gói lóc ra, còn, đã bán, huỷ, khác; số lần bán đúng ô và lệch ô từ lúc giao. Ô trống: các cột giao là null. Không có tiền.';


-- =============================================================================
-- 5 · BÁO CÁO BÁN THEO GIỜ (iPOS) — kèm bán giảm giá
-- =============================================================================
create or replace function kho_bao_cao_ban_gio(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  ngay date, gio int, mat_hang_id uuid, ma text, ten text, nhom text,
  so_dong int, so_kg numeric, so_goi int, doanh_thu bigint,
  so_dong_giam int, so_kg_giam numeric, doanh_thu_giam bigint, tien_giam bigint, so_dong_giam_som int,
  so_dong_lech_o int
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem_gia') then
    raise exception 'Báo cáo bán có doanh thu — chỉ chủ, quản lý, kế toán xem được' using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 366 then
    raise exception 'Khoảng ngày tối đa 1 năm' using errcode = 'check_violation';
  end if;

  return query
  with d as (
    select dd.*, ((dd.thoi_diem_ban at time zone 'utc') + interval '7 hours') as luc_vn,
           m.ma as ma_mh, m.ten as ten_mh, m.nhom as nhom_mh, m.gia_ban_kg,
           coalesce(m.canh_bao_truoc_ngay, cd.canh_bao_truoc_ngay, 1) as canh_bao
    from kho_ipos_dong dd
    join kho_ipos_hoa_don h on h.id = dd.hoa_don_id and not h.da_huy
    join kho_mat_hang m on m.id = dd.mat_hang_id
    left join kho_cai_dat cd on cd.chi_nhanh_id = dd.chi_nhanh_id
    where dd.chi_nhanh_id = p_chi_nhanh_id and dd.trang_thai = 'da_ghi'
      and ((dd.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date between p_tu and p_den
  ), x as (
    select d.*, d.luc_vn::date as ngay_vn, extract(hour from d.luc_vn)::int as gio_vn,
           -- Giảm sớm: mọi lô đã trừ còn hạn xa hơn mức cảnh báo lúc bán.
           d.ma_giam_id is not null and (
             select min(l.han_dung) from kho_so_cai s join kho_lo l on l.id = s.lo_id
             where s.chung_tu_loai = 'ban_hang' and s.chung_tu_id = d.id and s.loai = 'ban'
           ) - d.luc_vn::date > d.canh_bao as giam_som
    from d
  )
  select x.ngay_vn, x.gio_vn, x.mat_hang_id, x.ma_mh, x.ten_mh, x.nhom_mh,
         count(*)::int,
         coalesce(sum(x.so_kg), 0),
         coalesce(sum(x.so_goi), 0)::int,
         coalesce(sum(x.thanh_tien), 0)::bigint,
         (count(*) filter (where x.ma_giam_id is not null))::int,
         coalesce(sum(x.so_kg) filter (where x.ma_giam_id is not null), 0),
         coalesce(sum(x.thanh_tien) filter (where x.ma_giam_id is not null), 0)::bigint,
         coalesce(sum(greatest(round(x.so_kg * x.gia_ban_kg) - coalesce(x.thanh_tien, 0), 0))
                    filter (where x.ma_giam_id is not null), 0)::bigint,
         (count(*) filter (where x.giam_som))::int,
         (count(*) filter (where x.lech_o))::int
  from x
  group by x.ngay_vn, x.gio_vn, x.mat_hang_id, x.ma_mh, x.ten_mh, x.nhom_mh
  order by 1, 2, 5;
end;
$$;

comment on function kho_bao_cao_ban_gio is
  'Bán theo ngày × giờ × món từ dòng iPOS đã trừ kho (xem_gia, 0054): số dòng, kg, gói, doanh thu; phần bán bằng mã giảm giá (kg, doanh thu, tiền đã giảm ước theo giá bán hiện tại, số dòng giảm SỚM — lô còn hạn xa hơn mức cảnh báo); số dòng lệch ô. Hoá đơn đã huỷ không tính.';


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_mat_hang_theo_ma_can(text) from authenticated';
    execute 'revoke execute on function kho_ma_giam_kiem() from authenticated';
    execute 'revoke execute on function kho_o_ma_khong_trung_giam() from authenticated';
    execute 'revoke execute on function kho_mat_hang_ma_can_khong_trung_giam() from authenticated';
    execute 'revoke execute on function kho_ipos_ghi_dong(uuid) from authenticated';
    execute 'revoke execute on function kho_gia_giam(bigint, int) from authenticated';
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
