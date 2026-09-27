-- =============================================================================
-- BEEFTOWN KHO — 0049 · Ô MÃ XOAY VÒNG · PHIÊN LÓC MỘT TẢNG (truy vết tảng GĐ2)
-- =============================================================================
-- FABi chỉ đọc mã vạch 13 số (2 + mã hàng 5 số + trọng lượng + kiểm tra) và
-- iPOS gửi về kho mã món + số lượng. Để biết miếng bán ra thuộc tảng nào, mỗi
-- phần cắt của món theo tảng có vài "ô mã" CỐ ĐỊNH (ví dụ Ribeye 10011–10019,
-- tạo một lần trên FABi, cùng giá). Khi lóc một tảng, kho giao cho phần cắt
-- một ô đang trống: cân in tem bằng mã ô đó ("Ribeye #0142"), FABi bán theo
-- mã ô, kho biết mã ô ↔ tảng. Tảng bán hết thì ô được dùng lại.
--
--   kho_o_ma       danh mục ô: phần cắt → số ô → mã cân. Dùng chung toàn
--                  thương hiệu (như kho_mat_hang). Mã ô không trùng mã cân món
--                  đang dùng nào, và ngược lại (trigger hai phía).
--   kho_o_ma_giao  ô nào đang giao cho phiên lóc nào ở chi nhánh nào; lo_id =
--                  lô phần cắt ra khi phiên chốt (trigger trên kho_phien_pha_ra).
--                  Một ô đang giữ (den_luc null) tối đa một lần mỗi chi nhánh.
--                  Ô "đang giữ" khi: phiên còn đang lóc (lo_id null), hoặc lô ra
--                  còn tồn. Hết tồn thì lần giao sau tự đóng nó.
--   kho_giao_o_ma(p_id, p_mat_hang_id)   giao ô cho phần cắt của phiên (quyền
--                  pha_loc). Phiên phải là món theo tảng và có ĐÚNG MỘT tảng.
--   kho_giai_phong_o_ma(p_giao_id)       quản lý trả ô về (quyền duyet).
--   Món theo tảng: mỗi phiên pha lóc chỉ một tảng (trigger kho_phien_pha_vao).
--   Huỷ phiên / đổi món vào → trả ô. Mở lại phiên → bỏ lo_id của ô.
--   kho_v_o_ma_giao: ô đang giữ + số tảng + tồn của lô ra. Không tiền.
--
-- THAY THÂN (cùng chữ ký), chỉ đổi chỗ tra mã cân → kho_mat_hang_theo_ma_can:
--   kho_quet_phien_pha — chép 0033 (chưa file nào thay); thêm: nhãn mã ô phải
--                        thuộc ô đang giao cho chính phiên.
--   kho_quet_kiem_ke   — chép 0032 (chưa file nào thay).
-- iPOS (bán theo mã ô → trừ đúng lô) để 0051.
-- =============================================================================


-- =============================================================================
-- 1 · DANH MỤC Ô MÃ
-- =============================================================================
create table kho_o_ma (
  id          uuid primary key default gen_random_uuid(),
  mat_hang_id uuid not null references kho_mat_hang(id) on delete restrict,
  so_o        int not null,
  ma_can      text not null,
  created_at  timestamptz not null default now(),

  constraint kho_o_ma_so_o_hop_le check (so_o between 1 and 99),
  constraint kho_o_ma_ma_can_hop_le check (ma_can ~ '^[1-9][0-9]{0,5}$'),
  constraint kho_o_ma_so_o_duy_nhat unique (mat_hang_id, so_o),
  constraint kho_o_ma_ma_can_duy_nhat unique (ma_can)
);

comment on table kho_o_ma is
  'Ô mã của phần cắt theo tảng (0049): mã cân cố định, tạo một lần trên FABi; khi lóc một tảng thì một ô được giao cho tảng đó. Dùng chung toàn thương hiệu.';

alter table kho_o_ma enable row level security;
create policy kho_o_ma_doc on kho_o_ma
  for select using ((select kho_co_quyen('xem')));
create policy kho_o_ma_sua on kho_o_ma
  for all using ((select kho_co_quyen('danh_muc')))
  with check ((select kho_co_quyen('danh_muc')));

-- Mã ô: bỏ số 0 đầu, không trùng mã cân món đang dùng; chỉ phần cắt.
create or replace function kho_o_ma_kiem()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.ma_can := ltrim(btrim(new.ma_can), '0');
  if not exists (select 1 from kho_mat_hang where id = new.mat_hang_id and loai = 'phan_cat') then
    raise exception 'Ô mã chỉ dành cho phần cắt' using errcode = 'check_violation';
  end if;
  if exists (select 1 from kho_mat_hang where ma_can = new.ma_can and dang_dung) then
    raise exception 'Mã % đang là mã cân của món khác — chọn mã ô khác', new.ma_can
      using errcode = 'unique_violation';
  end if;
  return new;
end;
$$;

create trigger kho_o_ma_kiem_trigger
  before insert or update on kho_o_ma
  for each row execute function kho_o_ma_kiem();

create or replace function kho_mat_hang_ma_can_khong_trung_o()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ma_can is not null and new.dang_dung
     and exists (select 1 from kho_o_ma where ma_can = new.ma_can) then
    raise exception 'Mã cân % đang là ô mã của một phần cắt theo tảng — chọn mã khác', new.ma_can
      using errcode = 'unique_violation';
  end if;
  return new;
end;
$$;

-- Tên bắt đầu bằng "kho_mat_hang_z" để chạy SAU trigger chuẩn hoá mã cân (0019).
create trigger kho_mat_hang_z_ma_can_khong_trung_o
  before insert or update of ma_can, dang_dung on kho_mat_hang
  for each row execute function kho_mat_hang_ma_can_khong_trung_o();

-- Món theo mã cân: mã của chính món (đang dùng), hoặc mã một ô của món. Nội bộ.
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
  limit 1;
$$;

comment on function kho_mat_hang_theo_ma_can is
  'NỘI BỘ (0049). Món của một mã cân đọc từ nhãn: mã của món, hoặc mã một ô mã của món.';


-- =============================================================================
-- 2 · GIAO Ô CHO PHIÊN LÓC
-- =============================================================================
create table kho_o_ma_giao (
  id           uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  o_ma_id      uuid not null references kho_o_ma(id) on delete restrict,
  phien_pha_id uuid not null references kho_phien_pha(id) on delete restrict,
  lo_id        uuid references kho_lo(id) on delete restrict,
  tu_luc       timestamptz not null default now(),
  den_luc      timestamptz,
  nguoi        uuid references nhan_su(id) on delete set null
);

create unique index kho_o_ma_giao_dang_giu_idx on kho_o_ma_giao(chi_nhanh_id, o_ma_id) where den_luc is null;
create index kho_o_ma_giao_phien_idx on kho_o_ma_giao(phien_pha_id);
create index kho_o_ma_giao_lo_idx on kho_o_ma_giao(lo_id);

comment on table kho_o_ma_giao is
  'Lần giao một ô mã cho phiên lóc (một tảng) ở một chi nhánh (0049). lo_id = lô phần cắt ra khi phiên chốt. den_luc null = ô đang giữ. Chỉ ghi qua hàm.';

alter table kho_o_ma_giao enable row level security;
create policy kho_o_ma_giao_doc on kho_o_ma_giao
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));

-- Ô còn giữ thật không: phiên đang lóc (chưa có lô ra), hoặc lô ra còn tồn.
create or replace function kho_o_ma_con_giu(p_giao kho_o_ma_giao)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_giao.den_luc is null and (
    (p_giao.lo_id is null and exists (select 1 from kho_phien_pha p where p.id = p_giao.phien_pha_id and p.trang_thai = 'nhap'))
    or (p_giao.lo_id is not null and exists (select 1 from kho_ton t where t.lo_id = p_giao.lo_id and (t.so_kg > 0 or t.so_goi > 0))));
$$;

comment on function kho_o_ma_con_giu is
  'NỘI BỘ (0049). Ô còn giữ: phiên còn đang lóc, hoặc lô phần cắt ra còn tồn.';

create or replace function kho_giao_o_ma(p_id uuid, p_mat_hang_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ph    kho_phien_pha;
  v_mv    kho_mat_hang;
  v_nv    nhan_su;
  v_so_lo int;
  v_mh    record;
  v_o     kho_o_ma;
  v_g     kho_o_ma_giao;
  v_n     int := 0;
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found or not kho_duoc(v_ph.chi_nhanh_id, 'pha_loc') then
    raise exception 'Không tìm thấy phiên pha lóc, hoặc tài khoản không được ghi pha lóc'
      using errcode = 'insufficient_privilege';
  end if;
  -- Khóa chi nhánh (như mọi hàm ghi kho) rồi phiên: hai máy giao ô cùng lúc thì lần lượt.
  perform 1 from kho_cai_dat where chi_nhanh_id = v_ph.chi_nhanh_id for update;
  select * into v_ph from kho_phien_pha where id = p_id for update;
  if v_ph.trang_thai <> 'nhap' then
    raise exception 'Phiên % đã chốt hoặc bị hủy — không giao ô mã được nữa', v_ph.so_phieu
      using errcode = 'check_violation';
  end if;
  select * into v_mv from kho_mat_hang where id = v_ph.mat_hang_vao_id;
  if not v_mv.theo_tang then
    raise exception '"%" không theo dõi theo tảng — không cần ô mã', v_mv.ten using errcode = 'check_violation';
  end if;
  select count(distinct lo_id) into v_so_lo from kho_phien_pha_vao where phien_pha_id = p_id;
  if v_so_lo <> 1 then
    raise exception 'Chọn đúng một tảng cho phiên rồi mới giao ô mã' using errcode = 'check_violation';
  end if;
  v_nv := nhan_su_hien_tai();

  for v_mh in
    select m.id, m.ten from kho_mat_hang m
    where m.dang_dung and exists (select 1 from kho_o_ma o where o.mat_hang_id = m.id)
      and (case when p_mat_hang_id is not null then m.id = p_mat_hang_id
                else m.id in (select d.mat_hang_ra_id
                              from kho_cong_thuc_pha c join kho_cong_thuc_pha_dong d on d.cong_thuc_id = c.id
                              where c.mat_hang_vao_id = v_ph.mat_hang_vao_id and c.dang_dung
                                and (v_ph.cong_thuc_id is null or c.id = v_ph.cong_thuc_id)) end)
    order by m.ten
  loop
    v_n := v_n + 1;
    -- Đã giao cho phiên này rồi → giữ nguyên (bấm hai lần không lấy hai ô).
    if exists (select 1 from kho_o_ma_giao g join kho_o_ma o on o.id = g.o_ma_id
               where g.phien_pha_id = p_id and g.den_luc is null and o.mat_hang_id = v_mh.id) then
      continue;
    end if;
    -- Đóng các lần giao đã hết (lô ra bán / huỷ hết) của món này ở chi nhánh.
    update kho_o_ma_giao g set den_luc = now()
    from kho_o_ma o
    where o.id = g.o_ma_id and o.mat_hang_id = v_mh.id and g.chi_nhanh_id = v_ph.chi_nhanh_id
      and g.den_luc is null and not kho_o_ma_con_giu(g);
    select o.* into v_o from kho_o_ma o
    where o.mat_hang_id = v_mh.id
      and not exists (select 1 from kho_o_ma_giao g
                      where g.o_ma_id = o.id and g.chi_nhanh_id = v_ph.chi_nhanh_id and g.den_luc is null)
    order by o.so_o
    limit 1;
    if not found then
      raise exception '"%" đã dùng hết ô mã ở chi nhánh này — giải phóng ô của tảng đã bán hết, hoặc thêm ô ở Thiết lập → Mặt hàng', v_mh.ten
        using errcode = 'check_violation';
    end if;
    insert into kho_o_ma_giao (chi_nhanh_id, o_ma_id, phien_pha_id, nguoi)
    values (v_ph.chi_nhanh_id, v_o.id, p_id, v_nv.id);
  end loop;

  if v_n = 0 then
    raise exception 'Chưa có phần cắt nào có ô mã — cài ô mã cho phần cắt ở Thiết lập → Mặt hàng (và công thức pha lóc của tảng)'
      using errcode = 'check_violation';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object('giao_id', g.id, 'mat_hang_id', o.mat_hang_id, 'ten', m.ten,
                                        'so_o', o.so_o, 'ma_can', o.ma_can) order by m.ten)
    from kho_o_ma_giao g join kho_o_ma o on o.id = g.o_ma_id join kho_mat_hang m on m.id = o.mat_hang_id
    where g.phien_pha_id = p_id and g.den_luc is null), '[]'::jsonb);
end;
$$;

comment on function kho_giao_o_ma is
  'Giao ô mã trống cho phần cắt của phiên lóc một tảng (quyền pha_loc, 0049). p_mat_hang_id null = mọi phần cắt có ô mã trong công thức của tảng. Bấm lại không lấy thêm ô. Trả [{giao_id, mat_hang_id, ten, so_o, ma_can}].';

create or replace function kho_giai_phong_o_ma(p_giao_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_g kho_o_ma_giao;
  v_o kho_o_ma;
begin
  select * into v_g from kho_o_ma_giao where id = p_giao_id;
  if not found or not kho_duoc(v_g.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy ô mã, hoặc tài khoản không được giải phóng ô mã'
      using errcode = 'insufficient_privilege';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = v_g.chi_nhanh_id for update;
  select * into v_g from kho_o_ma_giao where id = p_giao_id for update;
  select * into v_o from kho_o_ma where id = v_g.o_ma_id;
  if v_g.den_luc is not null then
    return 'Ô ' || v_o.so_o || ' (mã ' || v_o.ma_can || ') đã trống từ trước.';
  end if;
  update kho_o_ma_giao set den_luc = now() where id = p_giao_id;
  return 'Đã giải phóng ô ' || v_o.so_o || ' (mã ' || v_o.ma_can || ').';
end;
$$;

comment on function kho_giai_phong_o_ma is
  'Trả một ô mã về trống (quyền duyet — quản lý, chủ; 0049). Dùng khi tảng đã hết mà sổ còn lẻ, hoặc giao nhầm.';


-- =============================================================================
-- 3 · TRIGGER GIỮ Ô ĐÚNG VỚI PHIÊN
-- =============================================================================
-- Món theo tảng: mỗi phiên chỉ một tảng (một lô vào, có thể từ nhiều vị trí).
create or replace function kho_phien_pha_vao_mot_tang()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from kho_lo l join kho_mat_hang m on m.id = l.mat_hang_id
             where l.id = new.lo_id and m.theo_tang)
     and exists (select 1 from kho_phien_pha_vao v
                 where v.phien_pha_id = new.phien_pha_id and v.lo_id <> new.lo_id) then
    raise exception 'Món theo dõi theo tảng: mỗi phiên pha lóc chỉ một tảng — mở phiên khác cho tảng sau'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger kho_phien_pha_vao_mot_tang_trigger
  after insert or update of lo_id on kho_phien_pha_vao
  for each row execute function kho_phien_pha_vao_mot_tang();

-- Chốt phiên → ô nhận lô ra; mở lại phiên → bỏ lô.
create or replace function kho_phien_pha_ra_o_ma()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update kho_o_ma_giao g set lo_id = new.lo_id
  from kho_o_ma o
  where o.id = g.o_ma_id and o.mat_hang_id = new.mat_hang_id
    and g.phien_pha_id = new.phien_pha_id and g.den_luc is null;
  return new;
end;
$$;

create trigger kho_phien_pha_ra_o_ma_trigger
  after update of lo_id on kho_phien_pha_ra
  for each row when (new.lo_id is distinct from old.lo_id)
  execute function kho_phien_pha_ra_o_ma();

-- Huỷ phiên, hoặc đổi món vào → trả ô.
create or replace function kho_phien_pha_tra_o_ma()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update kho_o_ma_giao set den_luc = now()
  where phien_pha_id = new.id and den_luc is null;
  return new;
end;
$$;

create trigger kho_phien_pha_tra_o_ma_trigger
  after update of trang_thai, mat_hang_vao_id on kho_phien_pha
  for each row when (new.trang_thai = 'da_huy' and old.trang_thai <> 'da_huy'
                     or new.mat_hang_vao_id <> old.mat_hang_vao_id)
  execute function kho_phien_pha_tra_o_ma();


-- =============================================================================
-- 4 · VIEW Ô ĐANG GIỮ
-- =============================================================================
create view kho_v_o_ma_giao with (security_invoker = true) as
select g.chi_nhanh_id,
       g.id           as giao_id,
       o.id           as o_ma_id,
       o.mat_hang_id,
       m.ten          as ten_hang,
       o.so_o,
       o.ma_can,
       g.phien_pha_id,
       p.so_phieu,
       p.trang_thai   as trang_thai_phien,
       lv.lo_vao_id,
       lt.so_tang,
       lt.ma_lo       as ma_lo_tang,
       g.lo_id,
       lr.han_dung,
       coalesce(tr.so_kg, 0)  as con_kg,
       coalesce(tr.so_goi, 0) as con_goi,
       -- cùng luật kho_o_ma_con_giu (viết thẳng: view chạy dưới quyền người đọc).
       (g.lo_id is null and p.trang_thai = 'nhap') or coalesce(tr.so_kg, 0) > 0 or coalesce(tr.so_goi, 0) > 0 as con_giu,
       g.tu_luc
from kho_o_ma_giao g
join kho_o_ma o      on o.id = g.o_ma_id
join kho_mat_hang m  on m.id = o.mat_hang_id
join kho_phien_pha p on p.id = g.phien_pha_id
left join lateral (select min(v.lo_id::text)::uuid as lo_vao_id from kho_phien_pha_vao v where v.phien_pha_id = g.phien_pha_id) lv on true
left join kho_lo lt  on lt.id = lv.lo_vao_id
left join kho_lo lr  on lr.id = g.lo_id
left join lateral (select sum(t.so_kg) as so_kg, sum(t.so_goi) as so_goi from kho_ton t where t.lo_id = g.lo_id) tr on true
where g.den_luc is null;

comment on view kho_v_o_ma_giao is
  'Ô mã đang giao (0049): phần cắt, số ô, mã, phiên lóc, số tảng, lô ra, hạn dùng, còn bao nhiêu, còn giữ không. Không tiền.';


-- =============================================================================
-- 5 · QUÉT NHÃN KHI PHA — nhận mã ô (chép 0033)
-- =============================================================================
create or replace function kho_quet_phien_pha(p_id uuid, p_ma_gui uuid, p_ma jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ph   kho_phien_pha;
  v_cd   kho_cai_dat;
  v_lan  kho_phien_pha_lan_quet;
  v_nv   nhan_su;
  v_x    jsonb;
  v_ma   text;
  v_doc  record;
  v_mh   kho_mat_hang;
  v_loi  jsonb := '[]';
  v_n    int := 0;
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found or not kho_duoc(v_ph.chi_nhanh_id, 'pha_loc') then
    raise exception 'Không tìm thấy phiên pha lóc, hoặc tài khoản không được ghi pha lóc'
      using errcode = 'insufficient_privilege';
  end if;
  -- Khóa phiên: hai máy quét cùng lúc thì lần lượt, không mất lượt nào.
  select * into v_ph from kho_phien_pha where id = p_id for update;

  select * into v_lan from kho_phien_pha_lan_quet where ma_gui = p_ma_gui;
  if found then
    if v_lan.phien_pha_id <> p_id then
      raise exception 'Mã gửi đã dùng cho phiên khác' using errcode = 'check_violation';
    end if;
    return kho_phien_pha_tra_quet(p_id, true, v_lan.so_nhan, v_lan.loi);
  end if;

  if v_ph.trang_thai <> 'nhap' then
    raise exception 'Phiên % đã % — không quét thêm được', v_ph.so_phieu,
      case v_ph.trang_thai when 'da_chot' then 'chốt' else 'bị hủy' end
      using errcode = 'check_violation';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_ph.chi_nhanh_id;
  if v_cd.mau_ma_vach is null then
    raise exception 'Chưa bật đọc nhãn cân — quản lý mở Cài đặt kho, mục Mã vạch' using errcode = 'check_violation';
  end if;
  if p_ma is null or jsonb_typeof(p_ma) <> 'array' or jsonb_array_length(p_ma) = 0 then
    raise exception 'Chưa quét nhãn nào' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_ma) > 300 then
    raise exception 'Tối đa 300 nhãn một lần gửi' using errcode = 'check_violation';
  end if;

  v_nv := nhan_su_hien_tai();
  insert into kho_phien_pha_lan_quet (phien_pha_id, chi_nhanh_id, ma_gui, loai, nguoi)
  values (p_id, v_ph.chi_nhanh_id, p_ma_gui, 'quet', v_nv.id)
  returning * into v_lan;

  for v_x in select value from jsonb_array_elements(p_ma) loop
    if jsonb_typeof(v_x) <> 'string' then
      raise exception 'Danh sách mã phải là các chuỗi số' using errcode = 'check_violation';
    end if;
    v_ma := left(btrim(v_x #>> '{}'), 40);
    select * into v_doc from kho_doc_ma_vach(v_ma, v_cd.mau_ma_vach, v_cd.so_le_kg);
    if v_doc.loi is not null then
      v_loi := v_loi || jsonb_build_object('ma', v_ma, 'loi', v_doc.loi);
      continue;
    end if;
    -- 0049: mã cân của món, hoặc mã của một ô (món theo tảng).
    select * into v_mh from kho_mat_hang_theo_ma_can(v_doc.ma_can);
    if not found then
      v_loi := v_loi || jsonb_build_object('ma', v_ma,
        'loi', 'Mã hàng ' || v_doc.ma_can || ' chưa gán cho món nào — báo quản lý');
      continue;
    end if;
    -- 0049: nhãn in bằng mã ô phải là ô đang giao cho CHÍNH phiên này.
    if exists (select 1 from kho_o_ma o where o.ma_can = v_doc.ma_can)
       and not exists (select 1 from kho_o_ma_giao g join kho_o_ma o on o.id = g.o_ma_id
                       where g.phien_pha_id = p_id and g.den_luc is null and o.ma_can = v_doc.ma_can) then
      v_loi := v_loi || jsonb_build_object('ma', v_ma,
        'loi', 'Mã ô ' || v_doc.ma_can || ' không giao cho phiên này — bấm "Giao ô mã" rồi in bằng đúng phím trên cân');
      continue;
    end if;
    if v_mh.id = v_ph.mat_hang_vao_id then
      v_loi := v_loi || jsonb_build_object('ma', v_ma,
        'loi', '"' || v_mh.ten || '" là hàng đem pha, không phải phần cắt ra');
      continue;
    end if;
    if v_doc.so_kg is null then
      v_loi := v_loi || jsonb_build_object('ma', v_ma,
        'loi', 'Nhãn "' || v_mh.ten || '" không có số kg — cân lại in nhãn có kg');
      continue;
    end if;
    if exists (select 1 from kho_phien_pha_ra r
               where r.phien_pha_id = p_id and r.mat_hang_id = v_mh.id and not r.tu_quet) then
      v_loi := v_loi || jsonb_build_object('ma', v_ma,
        'loi', '"' || v_mh.ten || '" đã ghi bằng tay — xóa dòng đó rồi quét lại');
      continue;
    end if;
    insert into kho_phien_pha_quet (phien_pha_id, lan_quet_id, chi_nhanh_id, mat_hang_id, ma, so_kg)
    values (p_id, v_lan.id, v_ph.chi_nhanh_id, v_mh.id, v_ma, v_doc.so_kg);
    v_n := v_n + 1;
  end loop;

  update kho_phien_pha_lan_quet set so_nhan = v_n, loi = v_loi where id = v_lan.id;
  perform kho_phien_pha_tinh_quet(p_id);
  update kho_phien_pha set phien_ban = phien_ban + 1 where id = p_id;

  return kho_phien_pha_tra_quet(p_id, false, v_n, v_loi);
end;
$$;

comment on function kho_quet_phien_pha is
  'Cộng một lượt quét nhãn vào phiên pha lóc nháp (quyền pha_loc). p_ma = mảng chuỗi số THÔ; database giải mã theo mẫu trong Cài đặt. Cùng p_ma_gui = cùng lượt. Trả {da_co, so_nhan, loi[{ma,loi}], phien_ban, mon[], kg_vao, kg_ra, kg_thit, kg_phu_pham, kg_bo, kg_hao_hut, ty_le_thu_hoi}. Không tiền.';


-- =============================================================================
-- 6 · QUÉT KIỂM KÊ — nhận mã ô (chép 0032)
-- =============================================================================
create or replace function kho_quet_kiem_ke(p_id uuid, p_ma_gui uuid, p_ma jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk   kho_kiem_ke;
  v_cd   kho_cai_dat;
  v_lan  kho_kiem_ke_lan_quet;
  v_nv   nhan_su;
  v_x    jsonb;
  v_ma   text;
  v_doc  record;
  v_mh   kho_mat_hang;
  v_loi  jsonb := '[]';
  v_n    int := 0;
  v_pb   int;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được kiểm kê'
      using errcode = 'insufficient_privilege';
  end if;
  -- Khóa phiếu: hai máy quét cùng lúc thì lần lượt, không mất lượt nào.
  select * into v_kk from kho_kiem_ke where id = p_id for update;

  select * into v_lan from kho_kiem_ke_lan_quet where ma_gui = p_ma_gui;
  if found then
    if v_lan.kiem_ke_id <> p_id then
      raise exception 'Mã gửi đã dùng cho phiếu khác' using errcode = 'check_violation';
    end if;
    return jsonb_build_object('da_co', true, 'so_nhan', v_lan.so_nhan, 'loi', v_lan.loi,
                              'phien_ban', v_kk.phien_ban, 'mon', kho_kiem_ke_ds_quet(p_id));
  end if;

  if v_kk.trang_thai <> 'dang_dem' then
    raise exception 'Phiếu % không còn ở bước đếm', v_kk.so_phieu using errcode = 'check_violation';
  end if;
  if v_kk.kieu <> 'theo_mat_hang' then
    raise exception 'Phiếu đếm theo lô không quét nhãn — nhập số từng lô' using errcode = 'check_violation';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_kk.chi_nhanh_id;
  if v_cd.mau_ma_vach is null then
    raise exception 'Chưa bật đọc nhãn cân — quản lý mở Cài đặt kho, mục Mã vạch' using errcode = 'check_violation';
  end if;
  if p_ma is null or jsonb_typeof(p_ma) <> 'array' or jsonb_array_length(p_ma) = 0 then
    raise exception 'Chưa quét nhãn nào' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_ma) > 300 then
    raise exception 'Tối đa 300 nhãn một lần gửi' using errcode = 'check_violation';
  end if;

  v_nv := nhan_su_hien_tai();
  insert into kho_kiem_ke_lan_quet (kiem_ke_id, chi_nhanh_id, ma_gui, loai, nguoi)
  values (p_id, v_kk.chi_nhanh_id, p_ma_gui, 'quet', v_nv.id)
  returning * into v_lan;

  for v_x in select value from jsonb_array_elements(p_ma) loop
    if jsonb_typeof(v_x) <> 'string' then
      raise exception 'Danh sách mã phải là các chuỗi số' using errcode = 'check_violation';
    end if;
    v_ma := left(btrim(v_x #>> '{}'), 40);
    select * into v_doc from kho_doc_ma_vach(v_ma, v_cd.mau_ma_vach, v_cd.so_le_kg);
    if v_doc.loi is not null then
      v_loi := v_loi || jsonb_build_object('ma', v_ma, 'loi', v_doc.loi);
      continue;
    end if;
    -- 0049: mã cân của món, hoặc mã của một ô (món theo tảng).
    select * into v_mh from kho_mat_hang_theo_ma_can(v_doc.ma_can);
    if not found then
      v_loi := v_loi || jsonb_build_object('ma', v_ma,
        'loi', 'Mã hàng ' || v_doc.ma_can || ' chưa gán cho món nào — báo quản lý');
      continue;
    end if;
    if not v_mh.dem_goi and v_doc.so_kg is null then
      v_loi := v_loi || jsonb_build_object('ma', v_ma,
        'loi', '"' || v_mh.ten || '" tính theo kg mà nhãn không có kg — nhập số kg bằng tay');
      continue;
    end if;
    insert into kho_kiem_ke_quet (kiem_ke_id, lan_quet_id, chi_nhanh_id, mat_hang_id, ma, so_kg)
    values (p_id, v_lan.id, v_kk.chi_nhanh_id, v_mh.id, v_ma, v_doc.so_kg);
    v_n := v_n + 1;
  end loop;

  update kho_kiem_ke_lan_quet set so_nhan = v_n, loi = v_loi where id = v_lan.id;
  perform kho_kiem_ke_tinh_quet(p_id);
  update kho_kiem_ke set phien_ban = phien_ban + 1 where id = p_id returning phien_ban into v_pb;

  return jsonb_build_object('da_co', false, 'so_nhan', v_n, 'loi', v_loi,
                            'phien_ban', v_pb, 'mon', kho_kiem_ke_ds_quet(p_id));
end;
$$;

comment on function kho_quet_kiem_ke is
  'Cộng một lượt quét nhãn vào phiếu kiểm kê (theo mặt hàng). p_ma = mảng chuỗi số THÔ; database giải mã theo mẫu trong Cài đặt. Cùng p_ma_gui = cùng lượt, không cộng đôi. Trả {da_co, so_nhan, loi[{ma,loi}], phien_ban, mon[]}.';


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_mat_hang_theo_ma_can(text) from authenticated';
    execute 'revoke execute on function kho_o_ma_con_giu(kho_o_ma_giao) from authenticated';
    execute 'revoke execute on function kho_o_ma_kiem() from authenticated';
    execute 'revoke execute on function kho_mat_hang_ma_can_khong_trung_o() from authenticated';
    execute 'revoke execute on function kho_phien_pha_vao_mot_tang() from authenticated';
    execute 'revoke execute on function kho_phien_pha_ra_o_ma() from authenticated';
    execute 'revoke execute on function kho_phien_pha_tra_o_ma() from authenticated';
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
