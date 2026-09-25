-- =============================================================================
-- BEEFTOWN — 0023 · KHO · CHUYỂN QUẦY, XUẤT BẾP, HỦY HÀNG, KIỂM KÊ
-- =============================================================================
-- PHIẾU XUẤT — ba loại, một bảng:
--   chuyen    kho lạnh ⇄ quầy. Ghi sổ ngay.
--   xuat_bep  đưa bếp (thường là hàng sắp hết hạn). Ghi sổ ngay.
--   huy       hai bước. Lập phiếu = chuyển hàng sang vị trí "Hàng chờ hủy"
--             (không còn nằm ở quầy, không bị đếm nhầm thành "đã bán"). Quản
--             lý duyệt → ghi hủy. Từ chối → hàng về lại chỗ cũ.
--
-- CHỌN LÔ (kho_phan_bo) — người dùng thường chỉ biết "3 gói thăn cắt lát",
-- không biết lô nào. Hệ thống lấy lô hết hạn sớm nhất trước (FEFO), theo GÓI
-- NGUYÊN; kg của phần lấy = số gói × kg trung bình/gói của lô, và lô nào trao
-- gói cuối cùng thì trao luôn toàn bộ kg còn lại (không để "0 gói, 0,02 kg").
-- Mặt hàng không đếm gói (thịt vụn theo khay) thì lấy theo kg.
-- Kg cân/quét được trên nhãn chỉ ghi để tham khảo; kg trên sổ được kiểm kê
-- chỉnh lại.
--
-- AN TOÀN THỰC PHẨM: đưa ra quầy và xuất bếp tự bỏ qua lô ĐÃ HẾT HẠN; chọn
-- đích danh lô hết hạn thì bị từ chối — hàng hết hạn chỉ có đường báo hủy.
--
-- KIỂM KÊ — đếm một vị trí (quầy hoặc kho lạnh):
--   dang_dem → (gửi) cho_duyet → (quản lý duyệt) da_duyet
--                              → (từ chối) dang_dem — đếm lại
--   theo_mat_hang: đếm số gói mỗi mặt hàng (quầy). Duyệt = DỰNG LẠI TỒN:
--     giữ lô MỚI NHẤT đủ số gói đếm được (hàng cũ đã bán trước — FEFO), lô
--     cũ hơn giảm trước. 0 gói thì 0 kg.
--   theo_lo: đếm từng lô (kho lạnh, tảng).
--   Sổ sách được CHỤP lúc gửi; lúc duyệt chỉ ghi phần chênh so với ảnh chụp,
--   nên hàng chuyển vào sau khi gửi không bị xóa mất.
--   Phần THIẾU ở quầy, khi nguồn số bán là kiểm kê (chưa nối iPOS), ghi là
--   BÁN. Còn lại ghi là chênh lệch kiểm kê.
--   Duyệt bị chặn khi vị trí còn phiếu nhập chờ duyệt hoặc phiên pha lóc
--   nháp — hàng đã nằm đó thật mà sổ chưa có, duyệt sẽ ghi sai.
-- =============================================================================


-- =============================================================================
-- 1 · PHIẾU XUẤT
-- =============================================================================
create table kho_phieu_xuat (
  id            uuid primary key default gen_random_uuid(),
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  so_phieu      text not null,
  ma_gui        uuid not null,
  loai          text not null,
  vi_tri_id     uuid not null references kho_vi_tri(id) on delete restrict,
  vi_tri_den_id uuid references kho_vi_tri(id) on delete restrict,
  ly_do_id      uuid references kho_ly_do(id) on delete restrict,
  ghi_chu       text,
  anh           text[] not null default '{}',
  trang_thai    text not null,
  ly_do_tu_choi text,
  ngay          date not null default hom_nay_vn(),
  nguoi_tao     uuid references nhan_su(id) on delete set null,
  nguoi_duyet   uuid references nhan_su(id) on delete set null,
  duyet_luc     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint kho_phieu_xuat_so_duy_nhat      unique (chi_nhanh_id, so_phieu),
  constraint kho_phieu_xuat_ma_gui_duy_nhat  unique (ma_gui),
  constraint kho_phieu_xuat_loai_hop_le      check (loai in ('chuyen', 'xuat_bep', 'huy')),
  constraint kho_phieu_xuat_trang_thai_hop_le check (trang_thai in ('da_ghi', 'cho_duyet', 'da_duyet', 'tu_choi')),
  constraint kho_phieu_xuat_den_hop_le       check ((loai = 'chuyen') = (vi_tri_den_id is not null))
);

create index kho_phieu_xuat_ds_idx on kho_phieu_xuat(chi_nhanh_id, loai, created_at desc);
create index kho_phieu_xuat_cho_idx on kho_phieu_xuat(chi_nhanh_id) where trang_thai = 'cho_duyet';

create trigger kho_phieu_xuat_updated_at
  before update on kho_phieu_xuat
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_phieu_xuat is
  'Chuyển kho ⇄ quầy, xuất bếp, báo hủy. Chỉ ghi qua kho_tao_phieu_xuat / kho_duyet_phieu_huy / kho_tu_choi_phieu_huy. Lô cụ thể của từng dòng nằm ở kho_so_cai (chung_tu_id).';

create table kho_phieu_xuat_dong (
  id            uuid primary key default gen_random_uuid(),
  phieu_xuat_id uuid not null references kho_phieu_xuat(id) on delete cascade,
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  thu_tu        int not null default 0,
  mat_hang_id   uuid not null references kho_mat_hang(id) on delete restrict,
  lo_id         uuid references kho_lo(id) on delete restrict,
  so_goi        int not null default 0,
  so_kg         numeric(12,3) not null,
  so_kg_do      numeric(12,3),

  constraint kho_phieu_xuat_dong_so_hop_le check (so_goi >= 0 and so_kg >= 0 and (so_kg_do is null or so_kg_do > 0))
);

create index kho_phieu_xuat_dong_phieu_idx on kho_phieu_xuat_dong(phieu_xuat_id, thu_tu);

comment on column kho_phieu_xuat_dong.lo_id is 'Lô người dùng chọn đích danh; null = hệ thống chọn theo FEFO.';
comment on column kho_phieu_xuat_dong.so_kg is 'Kg theo sổ đã chuyển/xuất (tổng các lô).';
comment on column kho_phieu_xuat_dong.so_kg_do is 'Kg cân hoặc cộng từ nhãn khi quét — chỉ để tham khảo.';


-- =============================================================================
-- 2 · CHỌN LÔ THEO FEFO — nội bộ
-- =============================================================================
create or replace function kho_phan_bo(
  p_vi_tri_id   uuid,
  p_mat_hang_id uuid,
  p_lo_id       uuid,
  p_so_goi      int,
  p_so_kg       numeric,
  p_chi_con_han boolean
)
returns table (lo_id uuid, so_goi int, so_kg numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mh   kho_mat_hang;
  v_vt   kho_vi_tri;
  v_r    record;
  v_con  numeric;
  v_goi  int;
  v_lay  numeric;
  v_co   numeric;
begin
  select * into v_mh from kho_mat_hang m where m.id = p_mat_hang_id;
  select * into v_vt from kho_vi_tri v where v.id = p_vi_tri_id;
  v_con := case when v_mh.dem_goi then p_so_goi else p_so_kg end;
  if v_con is null or v_con <= 0 then
    raise exception 'Số lượng lấy ra phải lớn hơn 0' using errcode = 'check_violation';
  end if;

  for v_r in
    select t.lo_id as lo, t.so_kg as kg, t.so_goi as goi
    from kho_ton t
    join kho_lo l on l.id = t.lo_id
    where t.vi_tri_id = p_vi_tri_id
      and t.mat_hang_id = p_mat_hang_id
      and (p_lo_id is null or t.lo_id = p_lo_id)
      and (case when v_mh.dem_goi then t.so_goi > 0 else t.so_kg > 0 end)
      and (not p_chi_con_han or l.han_dung >= hom_nay_vn())
    order by l.han_dung, l.created_at, l.id
  loop
    exit when v_con <= 0;
    if v_mh.dem_goi then
      v_goi := least(v_r.goi, v_con::int);
      lo_id  := v_r.lo;
      so_goi := v_goi;
      so_kg  := case when v_goi = v_r.goi then v_r.kg else round(v_r.kg * v_goi / v_r.goi, 3) end;
      v_con  := v_con - v_goi;
    else
      v_lay  := least(v_r.kg, v_con);
      lo_id  := v_r.lo;
      so_kg  := v_lay;
      so_goi := case when v_lay = v_r.kg then v_r.goi else 0 end;
      v_con  := v_con - v_lay;
    end if;
    return next;
  end loop;

  if v_con > 0 then
    select coalesce(sum(case when v_mh.dem_goi then t.so_goi else t.so_kg end), 0) into v_co
    from kho_ton t join kho_lo l on l.id = t.lo_id
    where t.vi_tri_id = p_vi_tri_id and t.mat_hang_id = p_mat_hang_id
      and (p_lo_id is null or t.lo_id = p_lo_id)
      and (not p_chi_con_han or l.han_dung >= hom_nay_vn());
    raise exception 'Không đủ hàng: "%" ở "%" chỉ còn % %', v_mh.ten, v_vt.ten,
      replace(v_co::text, '.', ','),
      case when v_mh.dem_goi then v_mh.don_vi_goi else 'kg' end
        || case when p_chi_con_han then ' còn hạn' else '' end
      using errcode = 'check_violation';
  end if;
end;
$$;

comment on function kho_phan_bo is
  'Chọn lô để lấy hàng ở một vị trí: lô chỉ định, hoặc FEFO theo gói nguyên (theo kg nếu mặt hàng không đếm gói). Nội bộ.';


-- =============================================================================
-- 3 · LẬP PHIẾU XUẤT
-- =============================================================================
-- p_dong: [{mat_hang_id, lo_id?, so_goi?, so_kg?}]
--   mặt hàng đếm gói:   so_goi bắt buộc; so_kg (nếu có) là kg cân/quét được.
--   mặt hàng theo kg:   so_kg bắt buộc.
create or replace function kho_tao_phieu_xuat(
  p_chi_nhanh_id  uuid,
  p_ma_gui        uuid,
  p_loai          text,
  p_vi_tri_id     uuid,
  p_vi_tri_den_id uuid,
  p_ly_do_id      uuid,
  p_ghi_chu       text,
  p_anh           text[],
  p_dong          jsonb
)
returns table (phieu_id uuid, so_phieu text, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv      nhan_su;
  v_id      uuid;
  v_so      text;
  v_vt      kho_vi_tri;
  v_den     kho_vi_tri;
  v_cho     uuid;
  v_ld      kho_ly_do;
  v_anh     text;
  v_dong    jsonb;
  v_khoa    text;
  v_i       int := 0;
  v_mh      kho_mat_hang;
  v_lo      kho_lo;
  v_goi     int;
  v_kg      numeric;
  v_kg_do   numeric;
  v_con_han boolean;
  v_pb      record;
  v_tong_g  int;
  v_tong_k  numeric;
  c_uuid    constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not kho_duoc(p_chi_nhanh_id, 'van_hanh') then
    raise exception 'Tài khoản của bạn không được chuyển, xuất hay báo hủy hàng'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();

  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;

  select px.id, px.so_phieu into v_id, v_so from kho_phieu_xuat px where px.ma_gui = p_ma_gui;
  if found then
    return query select v_id, v_so, true;
    return;
  end if;

  if p_loai is null or p_loai not in ('chuyen', 'xuat_bep', 'huy') then
    raise exception 'Loại phiếu không hợp lệ' using errcode = 'check_violation';
  end if;

  select * into v_vt from kho_vi_tri where id = p_vi_tri_id;
  if not found or v_vt.chi_nhanh_id <> p_chi_nhanh_id or v_vt.loai = 'cho_huy' or not v_vt.dang_dung then
    raise exception 'Chọn nơi lấy hàng là một kho hoặc quầy đang dùng' using errcode = 'check_violation';
  end if;

  if p_loai = 'chuyen' then
    select * into v_den from kho_vi_tri where id = p_vi_tri_den_id;
    if not found or v_den.chi_nhanh_id <> p_chi_nhanh_id or v_den.loai = 'cho_huy' or not v_den.dang_dung then
      raise exception 'Chọn nơi nhận là một kho hoặc quầy đang dùng' using errcode = 'check_violation';
    end if;
    if v_den.id = v_vt.id then
      raise exception 'Nơi lấy và nơi nhận phải khác nhau' using errcode = 'check_violation';
    end if;
  elsif p_vi_tri_den_id is not null then
    raise exception 'Chỉ phiếu chuyển mới có nơi nhận' using errcode = 'check_violation';
  end if;

  if p_ly_do_id is not null then
    select * into v_ld from kho_ly_do where id = p_ly_do_id;
    if not found or not v_ld.dang_dung or v_ld.loai <> p_loai then
      raise exception 'Lý do không hợp lệ cho loại phiếu này' using errcode = 'check_violation';
    end if;
  end if;
  if p_loai = 'huy' and p_ly_do_id is null then
    raise exception 'Báo hủy phải chọn lý do' using errcode = 'check_violation';
  end if;

  if coalesce(array_length(p_anh, 1), 0) > 0 and p_loai <> 'huy' then
    raise exception 'Chỉ phiếu báo hủy mới kèm ảnh' using errcode = 'check_violation';
  end if;
  if coalesce(array_length(p_anh, 1), 0) > 8 then
    raise exception 'Tối đa 8 ảnh' using errcode = 'check_violation';
  end if;
  foreach v_anh in array coalesce(p_anh, '{}'::text[]) loop
    if v_anh not like p_chi_nhanh_id::text || '/huy/%' or v_anh like '%..%' then
      raise exception 'Đường dẫn ảnh không thuộc chi nhánh này' using errcode = 'check_violation';
    end if;
  end loop;
  if p_loai = 'huy' and v_ld.can_anh and coalesce(array_length(p_anh, 1), 0) = 0 then
    raise exception 'Lý do "%" cần ít nhất một ảnh chụp hàng', v_ld.ten using errcode = 'check_violation';
  end if;

  if p_dong is null or jsonb_typeof(p_dong) <> 'array' or jsonb_array_length(p_dong) = 0 then
    raise exception 'Phiếu chưa có dòng hàng nào' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_dong) > 200 then
    raise exception 'Tối đa 200 dòng một phiếu' using errcode = 'check_violation';
  end if;

  if p_loai = 'huy' then
    select id into v_cho from kho_vi_tri where chi_nhanh_id = p_chi_nhanh_id and loai = 'cho_huy';
    if v_cho is null then
      raise exception 'Chi nhánh chưa có vị trí "Hàng chờ hủy"' using errcode = 'check_violation';
    end if;
  end if;

  -- Đưa ra quầy và xuất bếp: chỉ lấy hàng còn hạn.
  v_con_han := (p_loai = 'xuat_bep') or (p_loai = 'chuyen' and v_den.loai = 'quay');

  insert into kho_phieu_xuat
    (chi_nhanh_id, so_phieu, ma_gui, loai, vi_tri_id, vi_tri_den_id, ly_do_id,
     ghi_chu, anh, trang_thai, nguoi_tao)
  values
    (p_chi_nhanh_id,
     kho_sinh_so(p_chi_nhanh_id, case p_loai when 'chuyen' then 'XC' when 'xuat_bep' then 'XB' else 'XH' end),
     p_ma_gui, p_loai, v_vt.id, v_den.id, p_ly_do_id,
     nullif(btrim(p_ghi_chu), ''), coalesce(p_anh, '{}'),
     case when p_loai = 'huy' then 'cho_duyet' else 'da_ghi' end, v_nv.id)
  returning kho_phieu_xuat.id, kho_phieu_xuat.so_phieu into v_id, v_so;

  for v_dong in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if v_khoa <> all (array['mat_hang_id', 'lo_id', 'so_goi', 'so_kg']) then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
      end if;
    end loop;
    if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string' or (v_dong ->> 'mat_hang_id') !~* c_uuid then
      raise exception 'Dòng %: chưa chọn mặt hàng', v_i using errcode = 'check_violation';
    end if;
    select * into v_mh from kho_mat_hang where id = (v_dong ->> 'mat_hang_id')::uuid;
    if not found then
      raise exception 'Dòng %: mặt hàng không có', v_i using errcode = 'check_violation';
    end if;

    v_lo := null;
    if v_dong ? 'lo_id' and v_dong -> 'lo_id' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'lo_id') <> 'string' or (v_dong ->> 'lo_id') !~* c_uuid then
        raise exception 'Dòng % (%): lô không hợp lệ', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      select * into v_lo from kho_lo where id = (v_dong ->> 'lo_id')::uuid;
      if v_lo.id is null or v_lo.chi_nhanh_id <> p_chi_nhanh_id or v_lo.mat_hang_id <> v_mh.id then
        raise exception 'Dòng % (%): lô không thuộc mặt hàng này', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      if v_con_han and v_lo.han_dung < hom_nay_vn() then
        raise exception 'Lô % đã hết hạn — không % được. Hàng hết hạn thì báo hủy.', v_lo.ma_lo,
          case when p_loai = 'xuat_bep' then 'xuất bếp' else 'đưa ra quầy' end
          using errcode = 'check_violation';
      end if;
    end if;

    v_goi := 0;
    if v_dong ? 'so_goi' and v_dong -> 'so_goi' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi') <> 'number'
         or (v_dong ->> 'so_goi')::numeric <> trunc((v_dong ->> 'so_goi')::numeric)
         or (v_dong ->> 'so_goi')::numeric < 0 or (v_dong ->> 'so_goi')::numeric > 100000 then
        raise exception 'Dòng % (%): số % phải là số nguyên không âm', v_i, v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi')::int;
    end if;
    v_kg := null;
    if v_dong ? 'so_kg' and v_dong -> 'so_kg' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_kg') <> 'number' then
        raise exception 'Dòng % (%): số kg không hợp lệ', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      v_kg := (v_dong ->> 'so_kg')::numeric;
      if v_kg <= 0 or v_kg >= 1000000 or v_kg <> round(v_kg, 3) then
        raise exception 'Dòng % (%): số kg phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
    end if;

    if v_mh.dem_goi then
      if v_goi = 0 then
        raise exception 'Dòng % (%): chưa nhập số %', v_i, v_mh.ten, v_mh.don_vi_goi using errcode = 'check_violation';
      end if;
      v_kg_do := v_kg;
    else
      if v_kg is null then
        raise exception 'Dòng % (%): chưa nhập số kg', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      v_kg_do := null;
    end if;

    v_tong_g := 0;
    v_tong_k := 0;
    for v_pb in
      select * from kho_phan_bo(v_vt.id, v_mh.id, v_lo.id, v_goi, v_kg, v_con_han)
    loop
      if p_loai = 'xuat_bep' then
        insert into kho_so_cai
          (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
           chung_tu_loai, chung_tu_id, nguoi_ghi)
        values
          (p_chi_nhanh_id, v_pb.lo_id, v_vt.id, v_mh.id, 'xuat_bep', -v_pb.so_kg, -v_pb.so_goi,
           'phieu_xuat', v_id, v_nv.id);
      else
        insert into kho_so_cai
          (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
           chung_tu_loai, chung_tu_id, nguoi_ghi)
        values
          (p_chi_nhanh_id, v_pb.lo_id, v_vt.id, v_mh.id, 'chuyen_di', -v_pb.so_kg, -v_pb.so_goi,
           'phieu_xuat', v_id, v_nv.id);
        insert into kho_so_cai
          (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
           chung_tu_loai, chung_tu_id, nguoi_ghi)
        values
          (p_chi_nhanh_id, v_pb.lo_id, coalesce(v_den.id, v_cho), v_mh.id, 'chuyen_den', v_pb.so_kg, v_pb.so_goi,
           'phieu_xuat', v_id, v_nv.id);
      end if;
      v_tong_g := v_tong_g + v_pb.so_goi;
      v_tong_k := v_tong_k + v_pb.so_kg;
    end loop;

    insert into kho_phieu_xuat_dong
      (phieu_xuat_id, chi_nhanh_id, thu_tu, mat_hang_id, lo_id, so_goi, so_kg, so_kg_do)
    values
      (v_id, p_chi_nhanh_id, v_i, v_mh.id, v_lo.id, v_tong_g, v_tong_k, v_kg_do);
  end loop;

  return query select v_id, v_so, false;
end;
$$;

comment on function kho_tao_phieu_xuat is
  'Lập phiếu chuyển / xuất bếp (ghi sổ ngay) hoặc báo hủy (chuyển sang "Hàng chờ hủy", chờ quản lý duyệt). Chọn lô theo FEFO.';


-- =============================================================================
-- 4 · DUYỆT / TỪ CHỐI BÁO HỦY
-- =============================================================================
create or replace function kho_duyet_phieu_huy(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_px  kho_phieu_xuat;
  v_cd  kho_cai_dat;
  v_nv  nhan_su;
  v_cho uuid;
  v_r   record;
  v_kg  numeric := 0;
begin
  select * into v_px from kho_phieu_xuat where id = p_id;
  if not found or v_px.loai <> 'huy' or not kho_duoc(v_px.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy phiếu báo hủy, hoặc tài khoản không được duyệt'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_px.chi_nhanh_id for update;
  select * into v_px from kho_phieu_xuat where id = p_id for update;

  if v_px.trang_thai = 'da_duyet' then
    return 'Phiếu ' || v_px.so_phieu || ' đã được duyệt trước đó.';
  end if;
  if v_px.trang_thai <> 'cho_duyet' then
    raise exception 'Phiếu % đã bị từ chối', v_px.so_phieu using errcode = 'check_violation';
  end if;
  v_nv := nhan_su_hien_tai();
  if not v_cd.cho_tu_duyet and v_nv.id is not null and v_nv.id = v_px.nguoi_tao then
    raise exception 'Cài đặt không cho tự duyệt phiếu do chính mình lập — nhờ quản lý khác duyệt'
      using errcode = 'insufficient_privilege';
  end if;

  select id into v_cho from kho_vi_tri where chi_nhanh_id = v_px.chi_nhanh_id and loai = 'cho_huy';
  for v_r in
    select s.lo_id, sum(s.so_kg) as kg, sum(s.so_goi)::int as goi
    from kho_so_cai s
    where s.chung_tu_loai = 'phieu_xuat' and s.chung_tu_id = p_id
      and s.loai = 'chuyen_den' and s.vi_tri_id = v_cho
    group by s.lo_id
  loop
    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, nguoi_ghi)
    values
      (v_px.chi_nhanh_id, v_r.lo_id, v_cho, (select mat_hang_id from kho_lo where id = v_r.lo_id),
       'huy', -v_r.kg, -v_r.goi, 'phieu_xuat', p_id, v_nv.id);
    v_kg := v_kg + v_r.kg;
  end loop;

  update kho_phieu_xuat set trang_thai = 'da_duyet', nguoi_duyet = v_nv.id, duyet_luc = now()
  where id = p_id;

  return 'Đã duyệt hủy ' || v_px.so_phieu || ': ' || replace(trim(to_char(v_kg, 'FM999999990.000')), '.', ',') || ' kg.';
end;
$$;

create or replace function kho_tu_choi_phieu_huy(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_px  kho_phieu_xuat;
  v_nv  nhan_su;
  v_cho uuid;
  v_r   record;
begin
  select * into v_px from kho_phieu_xuat where id = p_id;
  if not found or v_px.loai <> 'huy' or not kho_duoc(v_px.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy phiếu báo hủy, hoặc tài khoản không được duyệt'
      using errcode = 'insufficient_privilege';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Cần ghi lý do từ chối' using errcode = 'check_violation';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = v_px.chi_nhanh_id for update;
  select * into v_px from kho_phieu_xuat where id = p_id for update;
  if v_px.trang_thai = 'tu_choi' then
    return 'Phiếu ' || v_px.so_phieu || ' đã bị từ chối trước đó.';
  end if;
  if v_px.trang_thai <> 'cho_duyet' then
    raise exception 'Phiếu % đã được duyệt — hàng đã hủy', v_px.so_phieu using errcode = 'check_violation';
  end if;

  v_nv := nhan_su_hien_tai();
  select id into v_cho from kho_vi_tri where chi_nhanh_id = v_px.chi_nhanh_id and loai = 'cho_huy';
  for v_r in
    select s.lo_id, sum(s.so_kg) as kg, sum(s.so_goi)::int as goi
    from kho_so_cai s
    where s.chung_tu_loai = 'phieu_xuat' and s.chung_tu_id = p_id
      and s.loai = 'chuyen_den' and s.vi_tri_id = v_cho
    group by s.lo_id
  loop
    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi)
    values
      (v_px.chi_nhanh_id, v_r.lo_id, v_cho, (select mat_hang_id from kho_lo where id = v_r.lo_id),
       'chuyen_di', -v_r.kg, -v_r.goi, 'phieu_xuat', p_id, 'Từ chối hủy — trả về chỗ cũ', v_nv.id);
    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi)
    values
      (v_px.chi_nhanh_id, v_r.lo_id, v_px.vi_tri_id, (select mat_hang_id from kho_lo where id = v_r.lo_id),
       'chuyen_den', v_r.kg, v_r.goi, 'phieu_xuat', p_id, 'Từ chối hủy — trả về chỗ cũ', v_nv.id);
  end loop;

  update kho_phieu_xuat set
    trang_thai = 'tu_choi', ly_do_tu_choi = btrim(p_ly_do), nguoi_duyet = v_nv.id, duyet_luc = now()
  where id = p_id;

  return 'Đã từ chối ' || v_px.so_phieu || ' — hàng đã về lại chỗ cũ.';
end;
$$;


-- =============================================================================
-- 5 · KIỂM KÊ — BẢNG
-- =============================================================================
create table kho_kiem_ke (
  id            uuid primary key default gen_random_uuid(),
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  so_phieu      text not null,
  ma_gui        uuid not null,
  phien_ban     int not null default 1,
  vi_tri_id     uuid not null references kho_vi_tri(id) on delete restrict,
  kieu          text not null,
  nguon_so_ban  text not null,
  ngay_kiem     date not null default hom_nay_vn(),
  trang_thai    text not null default 'dang_dem',
  ghi_chu       text,
  ly_do         text,
  nguoi_tao     uuid references nhan_su(id) on delete set null,
  nguoi_gui     uuid references nhan_su(id) on delete set null,
  gui_luc       timestamptz,
  nguoi_duyet   uuid references nhan_su(id) on delete set null,
  duyet_luc     timestamptz,
  nguoi_huy     uuid references nhan_su(id) on delete set null,
  huy_luc       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint kho_kiem_ke_so_duy_nhat     unique (chi_nhanh_id, so_phieu),
  constraint kho_kiem_ke_ma_gui_duy_nhat unique (ma_gui),
  constraint kho_kiem_ke_kieu_hop_le     check (kieu in ('theo_mat_hang', 'theo_lo')),
  constraint kho_kiem_ke_nguon_hop_le    check (nguon_so_ban in ('kiem_ke', 'ipos')),
  constraint kho_kiem_ke_trang_thai_hop_le check (trang_thai in ('dang_dem', 'cho_duyet', 'da_duyet', 'da_huy'))
);

-- Mỗi vị trí chỉ một phiếu kiểm kê đang mở.
create unique index kho_kiem_ke_mo_idx on kho_kiem_ke(vi_tri_id) where trang_thai in ('dang_dem', 'cho_duyet');
create index kho_kiem_ke_ds_idx on kho_kiem_ke(chi_nhanh_id, ngay_kiem desc);

create trigger kho_kiem_ke_updated_at
  before update on kho_kiem_ke
  for each row execute function tu_dong_cap_nhat_updated_at();

create table kho_kiem_ke_dong (
  id            uuid primary key default gen_random_uuid(),
  kiem_ke_id    uuid not null references kho_kiem_ke(id) on delete cascade,
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  thu_tu        int not null default 0,
  mat_hang_id   uuid not null references kho_mat_hang(id) on delete restrict,
  lo_id         uuid references kho_lo(id) on delete restrict,
  so_goi_dem    int,
  so_kg_dem     numeric(12,3),
  xac_nhan_het  boolean not null default false,
  ghi_chu       text,
  -- Sổ sách chụp lúc gửi duyệt.
  so_goi_so     int,
  so_kg_so      numeric(12,3),

  constraint kho_kiem_ke_dong_so_hop_le check (
    (so_goi_dem is null or so_goi_dem >= 0) and (so_kg_dem is null or so_kg_dem >= 0))
);

create unique index kho_kiem_ke_dong_hang_idx on kho_kiem_ke_dong(kiem_ke_id, mat_hang_id) where lo_id is null;
create unique index kho_kiem_ke_dong_lo_idx   on kho_kiem_ke_dong(kiem_ke_id, lo_id) where lo_id is not null;

-- Từng lô phía sau một dòng: sổ lúc gửi (so) và tồn mới sau khi duyệt (moi).
create table kho_kiem_ke_lo (
  id              uuid primary key default gen_random_uuid(),
  kiem_ke_dong_id uuid not null references kho_kiem_ke_dong(id) on delete cascade,
  chi_nhanh_id    uuid not null references chi_nhanh(id) on delete restrict,
  lo_id           uuid not null references kho_lo(id) on delete restrict,
  so_goi_so       int not null,
  so_kg_so        numeric(12,3) not null,
  so_goi_moi      int,
  so_kg_moi       numeric(12,3),

  constraint kho_kiem_ke_lo_duy_nhat unique (kiem_ke_dong_id, lo_id)
);

comment on table kho_kiem_ke is
  'Phiếu kiểm kê một vị trí. Chỉ ghi qua kho_*_kiem_ke. Duyệt = ghi phần chênh so với sổ lúc gửi.';


-- =============================================================================
-- 6 · KIỂM KÊ — HÀM NỘI BỘ
-- =============================================================================
-- Kg trung bình mỗi gói của một lô, để ước kg khi đếm thừa gói mà không cân.
create or replace function kho_kg_tb_goi(p_lo_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select d.so_kg / nullif(d.so_goi, 0)
       from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
      where l.id = p_lo_id),
    (select r.so_kg / nullif(r.so_goi, 0) from kho_phien_pha_ra r where r.lo_id = p_lo_id limit 1),
    (select sum(t.so_kg) / nullif(sum(t.so_goi), 0) from kho_ton t where t.lo_id = p_lo_id and t.so_goi > 0)
  )
$$;

-- Thêm dòng (chưa đếm) cho mọi mặt hàng / lô đang có ở vị trí mà phiếu chưa có.
create or replace function kho_kiem_ke_bo_sung_dong(p_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk  kho_kiem_ke;
  v_max int;
  v_n   int;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  select coalesce(max(thu_tu), 0) into v_max from kho_kiem_ke_dong where kiem_ke_id = p_id;

  if v_kk.kieu = 'theo_mat_hang' then
    insert into kho_kiem_ke_dong (kiem_ke_id, chi_nhanh_id, thu_tu, mat_hang_id)
    select p_id, v_kk.chi_nhanh_id, v_max + row_number() over (order by m.thu_tu, m.ten), m.id
    from kho_mat_hang m
    where m.id in (select t.mat_hang_id from kho_ton t
                    where t.vi_tri_id = v_kk.vi_tri_id and (t.so_kg > 0 or t.so_goi > 0))
      and not exists (select 1 from kho_kiem_ke_dong d
                       where d.kiem_ke_id = p_id and d.mat_hang_id = m.id and d.lo_id is null);
  else
    insert into kho_kiem_ke_dong (kiem_ke_id, chi_nhanh_id, thu_tu, mat_hang_id, lo_id)
    select p_id, v_kk.chi_nhanh_id, v_max + row_number() over (order by m.thu_tu, m.ten, l.han_dung, l.ma_lo),
           l.mat_hang_id, l.id
    from kho_ton t
    join kho_lo l on l.id = t.lo_id
    join kho_mat_hang m on m.id = l.mat_hang_id
    where t.vi_tri_id = v_kk.vi_tri_id and (t.so_kg > 0 or t.so_goi > 0)
      and not exists (select 1 from kho_kiem_ke_dong d where d.kiem_ke_id = p_id and d.lo_id = l.id);
  end if;
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- DỰNG LẠI TỒN cho một dòng đã đếm: tính số gói / kg mới của từng lô
-- (kho_kiem_ke_lo.so_goi_moi, so_kg_moi). Không ghi sổ.
create or replace function kho_dung_lai_ton(p_dong_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d    kho_kiem_ke_dong;
  v_mh   kho_mat_hang;
  v_ids  uuid[];
  v_lo   uuid[];
  v_g    int[];
  v_k    numeric[];
  v_t    int[] := '{}';
  v_tk   numeric[] := '{}';
  v_w    numeric[] := '{}';
  v_gram bigint[];
  v_moi  uuid;
  v_con  numeric;
  v_tb   numeric;
  n      int;
  i      int;
begin
  select * into v_d from kho_kiem_ke_dong where id = p_dong_id;
  select * into v_mh from kho_mat_hang where id = v_d.mat_hang_id;

  -- Đếm được mà không có lô nào (hàng tìm thấy ngoài sổ): ghi vào lô mới nhất
  -- của mặt hàng ở chi nhánh.
  if not exists (select 1 from kho_kiem_ke_lo where kiem_ke_dong_id = p_dong_id)
     and (coalesce(v_d.so_goi_dem, 0) > 0 or coalesce(v_d.so_kg_dem, 0) > 0) then
    select l.id into v_moi from kho_lo l
    where l.chi_nhanh_id = v_d.chi_nhanh_id and l.mat_hang_id = v_d.mat_hang_id
    order by l.han_dung desc, l.created_at desc, l.id desc limit 1;
    if v_moi is null then
      raise exception 'Không có lô nào của "%" để ghi phần thừa — lập phiếu tồn đầu kỳ cho mặt hàng này trước', v_mh.ten
        using errcode = 'check_violation';
    end if;
    insert into kho_kiem_ke_lo (kiem_ke_dong_id, chi_nhanh_id, lo_id, so_goi_so, so_kg_so)
    values (p_dong_id, v_d.chi_nhanh_id, v_moi, 0, 0);
  end if;

  select array_agg(kl.id order by l.han_dung desc, l.created_at desc, l.id desc),
         array_agg(kl.lo_id order by l.han_dung desc, l.created_at desc, l.id desc),
         array_agg(kl.so_goi_so order by l.han_dung desc, l.created_at desc, l.id desc),
         array_agg(kl.so_kg_so order by l.han_dung desc, l.created_at desc, l.id desc)
    into v_ids, v_lo, v_g, v_k
  from kho_kiem_ke_lo kl join kho_lo l on l.id = kl.lo_id
  where kl.kiem_ke_dong_id = p_dong_id;
  n := coalesce(array_length(v_ids, 1), 0);
  if n = 0 then
    return;
  end if;

  if v_mh.dem_goi then
    -- Gói: lô mới nhất giữ trước; thừa thì cộng vào lô mới nhất.
    v_con := v_d.so_goi_dem;
    for i in 1..n loop
      v_t[i] := least(v_g[i], v_con::int);
      v_con := v_con - v_t[i];
    end loop;
    if v_con > 0 then
      v_t[1] := v_t[1] + v_con::int;
    end if;

    if v_d.so_kg_dem is not null then
      -- Có cân / quét: chia đúng tổng kg cho các lô theo gói × kg trung bình.
      for i in 1..n loop
        v_tb := case when v_g[i] > 0 then v_k[i] / v_g[i] else kho_kg_tb_goi(v_lo[i]) end;
        v_w[i] := v_t[i] * coalesce(nullif(v_tb, 0), 1);
      end loop;
      v_gram := kho_chia_so_du_lon_nhat(round(v_d.so_kg_dem * 1000)::bigint, v_w);
      for i in 1..n loop
        v_tk[i] := v_gram[i]::numeric / 1000;
      end loop;
    else
      for i in 1..n loop
        if v_t[i] = 0 then
          v_tk[i] := 0;
        elsif v_t[i] = v_g[i] then
          v_tk[i] := v_k[i];
        elsif v_t[i] < v_g[i] then
          v_tk[i] := round(v_k[i] * v_t[i] / v_g[i], 3);
        else
          v_tb := case when v_g[i] > 0 then v_k[i] / v_g[i] else kho_kg_tb_goi(v_lo[i]) end;
          if coalesce(v_tb, 0) = 0 then
            raise exception '"%": đếm thừa % % mà không rõ số kg — nhập số kg đếm được', v_mh.ten,
              v_t[i] - v_g[i], v_mh.don_vi_goi
              using errcode = 'check_violation';
          end if;
          v_tk[i] := round(v_k[i] + (v_t[i] - v_g[i]) * v_tb, 3);
        end if;
      end loop;
    end if;
  else
    -- Theo kg: lô mới nhất giữ trước.
    v_con := v_d.so_kg_dem;
    for i in 1..n loop
      v_tk[i] := least(v_k[i], v_con);
      v_con := v_con - v_tk[i];
    end loop;
    if v_con > 0 then
      v_tk[1] := v_tk[1] + v_con;
    end if;
    for i in 1..n loop
      v_t[i] := case when v_tk[i] > 0 then v_g[i] else 0 end;
    end loop;
  end if;

  for i in 1..n loop
    update kho_kiem_ke_lo set so_goi_moi = v_t[i], so_kg_moi = v_tk[i] where id = v_ids[i];
  end loop;
end;
$$;


-- =============================================================================
-- 7 · KIỂM KÊ — HÀM GỌI TỪ WEB
-- =============================================================================
create or replace function kho_bat_dau_kiem_ke(
  p_chi_nhanh_id uuid,
  p_vi_tri_id    uuid,
  p_kieu         text,
  p_ma_gui       uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cd  kho_cai_dat;
  v_vt  kho_vi_tri;
  v_id  uuid;
  v_so  text;
begin
  if not kho_duoc(p_chi_nhanh_id, 'van_hanh') then
    raise exception 'Tài khoản của bạn không được kiểm kê' using errcode = 'insufficient_privilege';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;

  select id into v_id from kho_kiem_ke where ma_gui = p_ma_gui;
  if found then
    return v_id;
  end if;

  select * into v_vt from kho_vi_tri where id = p_vi_tri_id;
  if not found or v_vt.chi_nhanh_id <> p_chi_nhanh_id or v_vt.loai = 'cho_huy' or not v_vt.dang_dung then
    raise exception 'Chọn vị trí kiểm kê là một kho hoặc quầy đang dùng' using errcode = 'check_violation';
  end if;
  if p_kieu is null or p_kieu not in ('theo_mat_hang', 'theo_lo') then
    raise exception 'Cách đếm không hợp lệ' using errcode = 'check_violation';
  end if;
  select so_phieu into v_so from kho_kiem_ke
  where vi_tri_id = p_vi_tri_id and trang_thai in ('dang_dem', 'cho_duyet');
  if found then
    raise exception '"%" đang có phiếu kiểm kê % chưa xong', v_vt.ten, v_so using errcode = 'check_violation';
  end if;

  insert into kho_kiem_ke (chi_nhanh_id, so_phieu, ma_gui, vi_tri_id, kieu, nguon_so_ban, nguoi_tao)
  values (p_chi_nhanh_id, kho_sinh_so(p_chi_nhanh_id, 'KK'), p_ma_gui, p_vi_tri_id, p_kieu,
          v_cd.nguon_so_ban, (nhan_su_hien_tai()).id)
  returning id into v_id;

  perform kho_kiem_ke_bo_sung_dong(v_id);
  return v_id;
end;
$$;

-- p_dong: [{mat_hang_id, lo_id?, so_goi_dem?, so_kg_dem?, xac_nhan_het?, ghi_chu?}] — thay toàn bộ.
create or replace function kho_luu_kiem_ke(p_id uuid, p_phien_ban int, p_ghi_chu text, p_dong jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk    kho_kiem_ke;
  v_dong  jsonb;
  v_khoa  text;
  v_i     int := 0;
  v_mh    kho_mat_hang;
  v_lo    kho_lo;
  v_goi   int;
  v_kg    numeric;
  v_het   boolean;
  v_pb    int;
  c_uuid  constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được kiểm kê'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_kk from kho_kiem_ke where id = p_id for update;
  if v_kk.trang_thai <> 'dang_dem' then
    raise exception 'Phiếu % không còn ở bước đếm', v_kk.so_phieu using errcode = 'check_violation';
  end if;
  if p_phien_ban is distinct from v_kk.phien_ban then
    raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
      using errcode = 'check_violation';
  end if;
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' then
    raise exception 'Danh sách dòng đếm không hợp lệ' using errcode = 'check_violation';
  end if;

  delete from kho_kiem_ke_dong where kiem_ke_id = p_id;

  for v_dong in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if v_khoa <> all (array['mat_hang_id', 'lo_id', 'so_goi_dem', 'so_kg_dem', 'xac_nhan_het', 'ghi_chu']) then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
      end if;
    end loop;

    v_lo := null;
    if v_kk.kieu = 'theo_lo' then
      if jsonb_typeof(v_dong -> 'lo_id') is distinct from 'string' or (v_dong ->> 'lo_id') !~* c_uuid then
        raise exception 'Dòng %: chưa chọn lô', v_i using errcode = 'check_violation';
      end if;
      select * into v_lo from kho_lo where id = (v_dong ->> 'lo_id')::uuid;
      if v_lo.id is null or v_lo.chi_nhanh_id <> v_kk.chi_nhanh_id then
        raise exception 'Dòng %: lô không thuộc chi nhánh này', v_i using errcode = 'check_violation';
      end if;
      select * into v_mh from kho_mat_hang where id = v_lo.mat_hang_id;
    else
      if v_dong ? 'lo_id' and v_dong -> 'lo_id' <> 'null'::jsonb then
        raise exception 'Phiếu đếm theo mặt hàng không chọn lô' using errcode = 'check_violation';
      end if;
      if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string' or (v_dong ->> 'mat_hang_id') !~* c_uuid then
        raise exception 'Dòng %: chưa chọn mặt hàng', v_i using errcode = 'check_violation';
      end if;
      select * into v_mh from kho_mat_hang where id = (v_dong ->> 'mat_hang_id')::uuid;
      if not found then
        raise exception 'Dòng %: mặt hàng không có', v_i using errcode = 'check_violation';
      end if;
    end if;

    v_goi := null;
    if v_dong ? 'so_goi_dem' and v_dong -> 'so_goi_dem' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi_dem') <> 'number'
         or (v_dong ->> 'so_goi_dem')::numeric <> trunc((v_dong ->> 'so_goi_dem')::numeric)
         or (v_dong ->> 'so_goi_dem')::numeric < 0 or (v_dong ->> 'so_goi_dem')::numeric > 100000 then
        raise exception '"%": số % đếm được phải là số nguyên không âm', v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi_dem')::int;
    end if;
    v_kg := null;
    if v_dong ? 'so_kg_dem' and v_dong -> 'so_kg_dem' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_kg_dem') <> 'number' then
        raise exception '"%": số kg không hợp lệ', v_mh.ten using errcode = 'check_violation';
      end if;
      v_kg := (v_dong ->> 'so_kg_dem')::numeric;
      if v_kg < 0 or v_kg >= 1000000 or v_kg <> round(v_kg, 3) then
        raise exception '"%": số kg không âm, tối đa 3 số lẻ', v_mh.ten using errcode = 'check_violation';
      end if;
    end if;
    if v_mh.dem_goi and v_goi is not null then
      if v_goi = 0 and coalesce(v_kg, 0) > 0 then
        raise exception '"%": đếm 0 % mà có % kg — kiểm lại', v_mh.ten, v_mh.don_vi_goi, v_kg
          using errcode = 'check_violation';
      end if;
      if v_goi > 0 and v_kg = 0 then
        raise exception '"%": có % % mà 0 kg — bỏ trống ô kg nếu không cân', v_mh.ten, v_goi, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
    end if;
    if v_dong ? 'xac_nhan_het' and jsonb_typeof(v_dong -> 'xac_nhan_het') not in ('boolean', 'null') then
      raise exception '"%": ô xác nhận hết không hợp lệ', v_mh.ten using errcode = 'check_violation';
    end if;
    v_het := coalesce((v_dong ->> 'xac_nhan_het')::boolean, false);

    begin
      insert into kho_kiem_ke_dong
        (kiem_ke_id, chi_nhanh_id, thu_tu, mat_hang_id, lo_id, so_goi_dem, so_kg_dem, xac_nhan_het, ghi_chu)
      values
        (p_id, v_kk.chi_nhanh_id, v_i, v_mh.id, v_lo.id, v_goi, v_kg, v_het,
         nullif(btrim(left(v_dong ->> 'ghi_chu', 200)), ''));
    exception when unique_violation then
      raise exception '"%"% bị nhập hai lần', v_mh.ten,
        case when v_lo.id is not null then ' (lô ' || v_lo.ma_lo || ')' else '' end
        using errcode = 'check_violation';
    end;
  end loop;

  perform kho_kiem_ke_bo_sung_dong(p_id);

  update kho_kiem_ke set ghi_chu = nullif(btrim(p_ghi_chu), ''), phien_ban = phien_ban + 1
  where id = p_id
  returning phien_ban into v_pb;
  return v_pb;
end;
$$;

create or replace function kho_gui_kiem_ke(p_id uuid, p_phien_ban int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk    kho_kiem_ke;
  v_ds    text;
  v_lech  int;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được kiểm kê'
      using errcode = 'insufficient_privilege';
  end if;
  -- Khóa cài đặt chi nhánh: không ai ghi sổ trong lúc chụp sổ sách.
  perform 1 from kho_cai_dat where chi_nhanh_id = v_kk.chi_nhanh_id for update;
  select * into v_kk from kho_kiem_ke where id = p_id for update;
  if v_kk.trang_thai = 'cho_duyet' then
    return 'Phiếu ' || v_kk.so_phieu || ' đã gửi, đang chờ duyệt.';
  end if;
  if v_kk.trang_thai <> 'dang_dem' then
    raise exception 'Phiếu % không còn ở bước đếm', v_kk.so_phieu using errcode = 'check_violation';
  end if;
  if p_phien_ban is distinct from v_kk.phien_ban then
    raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
      using errcode = 'check_violation';
  end if;

  perform kho_kiem_ke_bo_sung_dong(p_id);

  select string_agg(x.ten, ', ') into v_ds from (
    select m.ten from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
    where d.kiem_ke_id = p_id
      and (case when m.dem_goi then d.so_goi_dem is null else d.so_kg_dem is null end)
    order by d.thu_tu limit 6) x;
  if v_ds is not null then
    raise exception 'Chưa đếm: % — đếm hết (không còn thì ghi 0) rồi gửi', v_ds using errcode = 'check_violation';
  end if;

  -- Chụp sổ sách.
  delete from kho_kiem_ke_lo where kiem_ke_dong_id in (select id from kho_kiem_ke_dong where kiem_ke_id = p_id);
  if v_kk.kieu = 'theo_mat_hang' then
    insert into kho_kiem_ke_lo (kiem_ke_dong_id, chi_nhanh_id, lo_id, so_goi_so, so_kg_so)
    select d.id, v_kk.chi_nhanh_id, t.lo_id, t.so_goi, t.so_kg
    from kho_kiem_ke_dong d
    join kho_ton t on t.mat_hang_id = d.mat_hang_id and t.vi_tri_id = v_kk.vi_tri_id
    where d.kiem_ke_id = p_id and (t.so_kg > 0 or t.so_goi > 0);
  else
    insert into kho_kiem_ke_lo (kiem_ke_dong_id, chi_nhanh_id, lo_id, so_goi_so, so_kg_so)
    select d.id, v_kk.chi_nhanh_id, d.lo_id, coalesce(t.so_goi, 0), coalesce(t.so_kg, 0)
    from kho_kiem_ke_dong d
    left join kho_ton t on t.lo_id = d.lo_id and t.vi_tri_id = v_kk.vi_tri_id
    where d.kiem_ke_id = p_id;
  end if;
  update kho_kiem_ke_dong d set
    so_goi_so = coalesce(x.g, 0), so_kg_so = coalesce(x.k, 0)
  from (select d2.id, sum(kl.so_goi_so)::int as g, sum(kl.so_kg_so) as k
          from kho_kiem_ke_dong d2
          left join kho_kiem_ke_lo kl on kl.kiem_ke_dong_id = d2.id
         where d2.kiem_ke_id = p_id group by d2.id) x
  where x.id = d.id;

  -- Đếm 0 mà sổ còn: phải xác nhận "đã hết thật".
  select string_agg(x.ten, ', ') into v_ds from (
    select m.ten from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
    where d.kiem_ke_id = p_id and not d.xac_nhan_het
      and (d.so_goi_so > 0 or d.so_kg_so > 0)
      and (case when m.dem_goi then d.so_goi_dem = 0 else d.so_kg_dem = 0 end)
    order by d.thu_tu limit 6) x;
  if v_ds is not null then
    raise exception 'Đếm được 0 nhưng sổ còn hàng: % — tích "Đã hết thật" để xác nhận rồi gửi lại', v_ds
      using errcode = 'check_violation';
  end if;

  select count(*) into v_lech
  from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
  where d.kiem_ke_id = p_id
    and (case when m.dem_goi
              then d.so_goi_dem <> d.so_goi_so or (d.so_kg_dem is not null and d.so_kg_dem <> d.so_kg_so)
              else d.so_kg_dem <> d.so_kg_so end);

  update kho_kiem_ke set
    trang_thai = 'cho_duyet', nguoi_gui = (nhan_su_hien_tai()).id, gui_luc = now(),
    ly_do = null, phien_ban = phien_ban + 1
  where id = p_id;

  return 'Đã gửi ' || v_kk.so_phieu || ': ' || v_lech || ' dòng lệch sổ, chờ quản lý duyệt.';
end;
$$;

create or replace function kho_duyet_kiem_ke(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk     kho_kiem_ke;
  v_cd     kho_cai_dat;
  v_vt     kho_vi_tri;
  v_nv     nhan_su;
  v_ds     text;
  v_d      record;
  v_r      record;
  v_loai   text;
  v_dg     int;
  v_dk     numeric;
  v_ban_g  int := 0;
  v_ban_k  numeric := 0;
  v_so_lo  int := 0;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được duyệt'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_kk.chi_nhanh_id for update;
  select * into v_kk from kho_kiem_ke where id = p_id for update;
  if v_kk.trang_thai = 'da_duyet' then
    return 'Phiếu ' || v_kk.so_phieu || ' đã được duyệt trước đó.';
  end if;
  if v_kk.trang_thai <> 'cho_duyet' then
    raise exception 'Phiếu % chưa được gửi duyệt', v_kk.so_phieu using errcode = 'check_violation';
  end if;
  v_nv := nhan_su_hien_tai();
  if not v_cd.cho_tu_duyet and v_nv.id is not null and v_nv.id in (v_kk.nguoi_tao, v_kk.nguoi_gui) then
    raise exception 'Cài đặt không cho tự duyệt phiếu do chính mình lập — nhờ quản lý khác duyệt'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_vt from kho_vi_tri where id = v_kk.vi_tri_id;

  -- Hàng đã nằm ở đó mà sổ chưa có → duyệt sẽ ghi sai. Xử lý chứng từ treo trước.
  select string_agg(so_phieu, ', ') into v_ds from kho_phieu_nhap
  where chi_nhanh_id = v_kk.chi_nhanh_id and vi_tri_id = v_kk.vi_tri_id and trang_thai = 'cho_duyet';
  if v_ds is not null then
    raise exception 'Còn phiếu nhập chờ duyệt vào "%": % — duyệt hoặc từ chối trước khi duyệt kiểm kê', v_vt.ten, v_ds
      using errcode = 'check_violation';
  end if;
  select string_agg(p.so_phieu, ', ') into v_ds from kho_phien_pha p
  where p.chi_nhanh_id = v_kk.chi_nhanh_id and p.trang_thai = 'nhap'
    and (exists (select 1 from kho_phien_pha_vao v where v.phien_pha_id = p.id and v.vi_tri_id = v_kk.vi_tri_id)
         or exists (select 1 from kho_phien_pha_ra r where r.phien_pha_id = p.id and r.vi_tri_id = v_kk.vi_tri_id));
  if v_ds is not null then
    raise exception 'Còn phiên pha lóc chưa chốt dùng "%": % — chốt hoặc hủy trước khi duyệt kiểm kê', v_vt.ten, v_ds
      using errcode = 'check_violation';
  end if;

  for v_d in select id from kho_kiem_ke_dong where kiem_ke_id = p_id order by thu_tu loop
    perform kho_dung_lai_ton(v_d.id);
  end loop;

  v_loai := case when v_vt.loai = 'quay' and v_kk.nguon_so_ban = 'kiem_ke' then 'ban' else 'kiem_ke' end;

  begin
    -- Phần thừa trước, phần thiếu sau — tồn không lúc nào âm giữa chừng.
    for v_r in
      select kl.lo_id, greatest(kl.so_goi_moi - kl.so_goi_so, 0) as g, greatest(kl.so_kg_moi - kl.so_kg_so, 0) as k
      from kho_kiem_ke_lo kl join kho_kiem_ke_dong d on d.id = kl.kiem_ke_dong_id
      where d.kiem_ke_id = p_id
        and (kl.so_goi_moi > kl.so_goi_so or kl.so_kg_moi > kl.so_kg_so)
    loop
      insert into kho_so_cai
        (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
         chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
      values
        (v_kk.chi_nhanh_id, v_r.lo_id, v_kk.vi_tri_id, (select mat_hang_id from kho_lo where id = v_r.lo_id),
         'kiem_ke', v_r.k, v_r.g, 'kiem_ke', p_id, v_nv.id, v_kk.ngay_kiem);
      v_so_lo := v_so_lo + 1;
    end loop;

    for v_r in
      select kl.lo_id, least(kl.so_goi_moi - kl.so_goi_so, 0) as g, least(kl.so_kg_moi - kl.so_kg_so, 0) as k
      from kho_kiem_ke_lo kl join kho_kiem_ke_dong d on d.id = kl.kiem_ke_dong_id
      where d.kiem_ke_id = p_id
        and (kl.so_goi_moi < kl.so_goi_so or kl.so_kg_moi < kl.so_kg_so)
    loop
      insert into kho_so_cai
        (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
         chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
      values
        (v_kk.chi_nhanh_id, v_r.lo_id, v_kk.vi_tri_id, (select mat_hang_id from kho_lo where id = v_r.lo_id),
         v_loai, v_r.k, v_r.g, 'kiem_ke', p_id, v_nv.id, v_kk.ngay_kiem);
      if v_loai = 'ban' then
        v_ban_g := v_ban_g - v_r.g;
        v_ban_k := v_ban_k - v_r.k;
      end if;
      v_so_lo := v_so_lo + 1;
    end loop;
  exception when check_violation then
    raise exception 'Không duyệt được: % — tồn đã thay đổi sau khi gửi kiểm kê. Bấm "Từ chối" để đếm lại.', sqlerrm
      using errcode = 'check_violation';
  end;

  update kho_kiem_ke set trang_thai = 'da_duyet', nguoi_duyet = v_nv.id, duyet_luc = now(),
                         phien_ban = phien_ban + 1
  where id = p_id;

  return 'Đã duyệt ' || v_kk.so_phieu || ': ' || v_so_lo || ' dòng điều chỉnh'
    || case when v_ban_g > 0 or v_ban_k > 0
            then ', ghi bán ' || v_ban_g || ' gói (' || replace(trim(to_char(v_ban_k, 'FM999999990.000')), '.', ',') || ' kg)'
            else '' end
    || '.';
end;
$$;

create or replace function kho_tu_choi_kiem_ke(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk kho_kiem_ke;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được duyệt'
      using errcode = 'insufficient_privilege';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Cần ghi lý do để người đếm biết đếm lại chỗ nào' using errcode = 'check_violation';
  end if;
  select * into v_kk from kho_kiem_ke where id = p_id for update;
  if v_kk.trang_thai <> 'cho_duyet' then
    raise exception 'Chỉ từ chối được phiếu đang chờ duyệt' using errcode = 'check_violation';
  end if;
  delete from kho_kiem_ke_lo where kiem_ke_dong_id in (select id from kho_kiem_ke_dong where kiem_ke_id = p_id);
  update kho_kiem_ke_dong set so_goi_so = null, so_kg_so = null where kiem_ke_id = p_id;
  update kho_kiem_ke set trang_thai = 'dang_dem', ly_do = btrim(p_ly_do), nguoi_gui = null, gui_luc = null,
                         phien_ban = phien_ban + 1
  where id = p_id;
  return 'Đã trả ' || v_kk.so_phieu || ' về để đếm lại.';
end;
$$;

create or replace function kho_huy_kiem_ke(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk kho_kiem_ke;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được hủy'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_kk from kho_kiem_ke where id = p_id for update;
  if v_kk.trang_thai = 'da_huy' then
    return 'Phiếu ' || v_kk.so_phieu || ' đã bị hủy trước đó.';
  end if;
  if v_kk.trang_thai = 'da_duyet' then
    raise exception 'Phiếu đã duyệt — không hủy được' using errcode = 'check_violation';
  end if;
  if v_kk.trang_thai = 'cho_duyet' and not kho_duoc(v_kk.chi_nhanh_id, 'duyet') then
    raise exception 'Phiếu đang chờ duyệt — chỉ quản lý hủy được' using errcode = 'insufficient_privilege';
  end if;
  update kho_kiem_ke set trang_thai = 'da_huy', ly_do = nullif(btrim(p_ly_do), ''),
                         nguoi_huy = (nhan_su_hien_tai()).id, huy_luc = now(), phien_ban = phien_ban + 1
  where id = p_id;
  return 'Đã hủy phiếu kiểm kê ' || v_kk.so_phieu || '.';
end;
$$;


-- =============================================================================
-- 8 · VIEW VÀ PHÂN QUYỀN
-- =============================================================================
-- Không có tiền trong phiếu xuất và kiểm kê → mọi vai kho đọc được (xem).
create view kho_v_phieu_xuat with (security_invoker = true) as
select p.id, p.chi_nhanh_id, p.so_phieu, p.loai, p.trang_thai, p.ngay,
       p.vi_tri_id, v.ten as ten_vi_tri, v.loai as loai_vi_tri,
       p.vi_tri_den_id, vd.ten as ten_vi_tri_den,
       p.ly_do_id, ld.ten as ten_ly_do, p.ghi_chu, p.anh, p.ly_do_tu_choi,
       p.nguoi_tao, p.nguoi_duyet, p.duyet_luc, p.created_at,
       coalesce(d.so_dong, 0)::int as so_dong,
       coalesce(d.tong_goi, 0)::int as tong_goi,
       coalesce(d.tong_kg, 0) as tong_kg
from kho_phieu_xuat p
join kho_vi_tri v on v.id = p.vi_tri_id
left join kho_vi_tri vd on vd.id = p.vi_tri_den_id
left join kho_ly_do ld on ld.id = p.ly_do_id
left join lateral (
  select count(*) as so_dong, sum(dd.so_goi) as tong_goi, sum(dd.so_kg) as tong_kg
  from kho_phieu_xuat_dong dd where dd.phieu_xuat_id = p.id
) d on true;

create view kho_v_kiem_ke with (security_invoker = true) as
select k.id, k.chi_nhanh_id, k.so_phieu, k.phien_ban, k.vi_tri_id, v.ten as ten_vi_tri, v.loai as loai_vi_tri,
       k.kieu, k.nguon_so_ban, k.ngay_kiem, k.trang_thai, k.ghi_chu, k.ly_do,
       k.nguoi_tao, k.nguoi_gui, k.gui_luc, k.nguoi_duyet, k.duyet_luc, k.created_at,
       (select count(*) from kho_kiem_ke_dong d where d.kiem_ke_id = k.id)::int as so_dong,
       (select count(*) from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
         where d.kiem_ke_id = k.id
           and (case when m.dem_goi then d.so_goi_dem is not null else d.so_kg_dem is not null end))::int as so_dong_da_dem
from kho_kiem_ke k
join kho_vi_tri v on v.id = k.vi_tri_id;

alter table kho_phieu_xuat      enable row level security;
alter table kho_phieu_xuat_dong enable row level security;
alter table kho_kiem_ke         enable row level security;
alter table kho_kiem_ke_dong    enable row level security;
alter table kho_kiem_ke_lo      enable row level security;

create policy kho_phieu_xuat_doc on kho_phieu_xuat
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
create policy kho_phieu_xuat_dong_doc on kho_phieu_xuat_dong
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
create policy kho_kiem_ke_doc on kho_kiem_ke
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
create policy kho_kiem_ke_dong_doc on kho_kiem_ke_dong
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
create policy kho_kiem_ke_lo_doc on kho_kiem_ke_lo
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_phan_bo(uuid, uuid, uuid, int, numeric, boolean) from authenticated';
    execute 'revoke execute on function kho_kg_tb_goi(uuid) from authenticated';
    execute 'revoke execute on function kho_kiem_ke_bo_sung_dong(uuid) from authenticated';
    execute 'revoke execute on function kho_dung_lai_ton(uuid) from authenticated';
  end if;
end
$$;


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6
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
  end if;
end
$$;
