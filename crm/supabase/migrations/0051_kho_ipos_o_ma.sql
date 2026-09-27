-- =============================================================================
-- BEEFTOWN KHO — 0051 · BÁN QUA iPOS THEO Ô MÃ → TRỪ ĐÚNG LÔ CỦA TẢNG
-- =============================================================================
-- Kế hoạch truy vết theo tảng GĐ4. iPOS đã xác nhận (27/09): callback gửi
-- item_id riêng cho từng món — nên mỗi ô mã (món "Ribeye – ô 2" trên FABi) là
-- một mã món iPOS riêng. Kho biết ô ↔ tảng (kho_o_ma_giao, 0049) nên trừ được
-- đúng lô của tảng thay vì theo hạn gần nhất (FEFO).
--
-- Dòng bán iPOS biết ô bằng một trong ba cách (theo thứ tự):
--   1. Ghép món iPOS với ô ở màn Ghép món (kho_ipos_ma_hang.o_ma_id —
--      kho_ipos_gan_o_ma).
--   2. Mã món iPOS chưa ghép mà trùng mã một ô (món ô trên FABi đặt mã = mã
--      cân của ô) — tự nhận, không phải ghép.
--   3. Nhãn cân của dòng in bằng mã ô (mã vạch 2XCCCCC…) — với dòng chưa ghép
--      hoặc ghép "hàng cân nhãn".
-- Có ô → lấy lô đang gắn với ô LÚC BÁN (kho_o_ma_giao tu_luc ≤ giờ bán <
-- den_luc). Lô đó ở quầy đủ hàng → trừ đúng lô đó (kể cả đã quá hạn — hàng
-- thật khách đã mua). Không đủ, hoặc ô chưa gắn lô (phiên lóc chưa chốt) →
-- trừ theo hạn gần nhất như cũ và đánh dấu kho_ipos_dong.lech_o để đối soát.
-- Món không có ô: không đổi gì.
--
-- THAY THÂN (cùng chữ ký):
--   kho_ipos_ghi_dong  — chép 0042, thêm ô mã (chỗ đổi ghi 0051); khớp mã cân
--                        qua kho_mat_hang_theo_ma_can (nhận cả mã ô, 0049).
--   kho_ipos_gan_ma_v2 — chép 0042, ghép lại = bỏ ô mã.
-- Hàm mới: kho_ipos_gan_o_ma (danh_muc); nội bộ kho_ipos_lo_cua_o,
-- kho_ipos_lay_lo_cua_lo, kho_ipos_goi_theo_kg_lo.
-- =============================================================================


-- =============================================================================
-- 1 · CỘT MỚI
-- =============================================================================
alter table kho_ipos_ma_hang add column o_ma_id uuid references kho_o_ma(id) on delete set null;
alter table kho_ipos_ma_hang add constraint kho_ipos_ma_hang_o_ma_hop_le
  check (o_ma_id is null or (kieu = 'mon' and mat_hang_id is not null));

comment on column kho_ipos_ma_hang.o_ma_id is
  'Ô mã của món iPOS (0051): bán món này = bán phần cắt của tảng đang giữ ô → trừ đúng lô của tảng. Chỉ với kiểu mon; mat_hang_id là món của ô.';

alter table kho_ipos_dong add column o_ma_id uuid references kho_o_ma(id) on delete set null;
alter table kho_ipos_dong add column lo_o_id uuid references kho_lo(id) on delete set null;
alter table kho_ipos_dong add column lech_o boolean not null default false;

comment on column kho_ipos_dong.o_ma_id is 'Ô mã của dòng bán (0051) — từ ghép món, mã món trùng mã ô, hoặc nhãn cân mã ô.';
comment on column kho_ipos_dong.lo_o_id is 'Lô gắn với ô lúc bán (0051). Null = ô chưa gắn lô.';
comment on column kho_ipos_dong.lech_o is
  'Có ô mà không trừ được lô của ô (lô thiếu ở quầy, hoặc ô chưa gắn lô) → đã trừ theo hạn gần nhất (0051). Cần đối soát.';

-- Thêm cột vào cuối view (giữ nguyên các cột cũ).
create or replace view kho_v_ipos_dong with (security_invoker = true) as
  select d.id, d.chi_nhanh_id, d.hoa_don_id, h.ma_hd, h.da_huy as hd_da_huy, d.khoa_dong,
         d.thoi_diem_ban, ((d.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date as ngay_ban,
         d.ma_ipos, d.ten_ipos, d.ma_vach, d.ma_can, d.so_kg, d.so_goi, d.thanh_tien,
         d.mat_hang_id, m.ma as ma_mat_hang, m.ten as ten_mat_hang, m.dem_goi, m.don_vi_goi,
         d.trang_thai, d.so_lan_thu, d.ly_do, d.lo_het_han, d.ghi_luc, d.xu_ly_boi, d.xu_ly_luc,
         d.created_at, d.updated_at, d.so_luong,
         d.o_ma_id, o.so_o, o.ma_can as ma_can_o, d.lo_o_id, d.lech_o,
         (select coalesce(g.so_tang, l.so_tang) from kho_lo l left join kho_lo g on g.id = l.tang_goc_id
           where l.id = d.lo_o_id) as so_tang
  from kho_ipos_dong d
  join kho_ipos_hoa_don h on h.id = d.hoa_don_id
  left join kho_mat_hang m on m.id = d.mat_hang_id
  left join kho_o_ma o on o.id = d.o_ma_id;

comment on view kho_v_ipos_dong is
  'Dòng bán iPOS kèm mã HĐ, tên món kho, ngày bán giờ VN (0037), số lượng gốc (0042), ô mã / lô của ô / số tảng / lệch ô (0051). security_invoker: vai không xem_gia không thấy dòng nào.';


-- =============================================================================
-- 2 · HÀM NỘI BỘ
-- =============================================================================

-- Lô đang gắn với ô ở chi nhánh LÚC p_luc. Null = ô chưa gắn lô lúc đó.
create or replace function kho_ipos_lo_cua_o(p_chi_nhanh_id uuid, p_o_ma_id uuid, p_luc timestamptz)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select g.lo_id from kho_o_ma_giao g
  where g.chi_nhanh_id = p_chi_nhanh_id and g.o_ma_id = p_o_ma_id and g.lo_id is not null
    and g.tu_luc <= p_luc and (g.den_luc is null or g.den_luc > p_luc)
  order by g.tu_luc desc
  limit 1
$$;

comment on function kho_ipos_lo_cua_o is 'NỘI BỘ (0051). Lô gắn với ô mã ở chi nhánh tại một thời điểm.';

-- Lấy ĐÚNG một lô ở quầy cho một lần bán. Lô không đủ → null. Không ghi gì.
-- Trả {lo: [{lo_id, so_goi, so_kg}], het_han} như kho_ipos_lay_lo.
create or replace function kho_ipos_lay_lo_cua_lo(p_vi_tri_id uuid, p_mat_hang_id uuid, p_lo_id uuid, p_so_goi int, p_so_kg numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mh kho_mat_hang;
  v_t  kho_ton;
  v_a  jsonb;
begin
  if p_lo_id is null then
    return null;
  end if;
  select * into v_mh from kho_mat_hang where id = p_mat_hang_id;
  select * into v_t from kho_ton where lo_id = p_lo_id and vi_tri_id = p_vi_tri_id and mat_hang_id = p_mat_hang_id;
  if not found then
    return null;
  end if;
  if v_mh.dem_goi then
    if p_so_goi is null or p_so_goi <= 0 or v_t.so_goi < p_so_goi then
      return null;
    end if;
  elsif p_so_kg is null or p_so_kg <= 0 or v_t.so_kg < p_so_kg then
    return null;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('lo_id', b.lo_id, 'so_goi', b.so_goi, 'so_kg', b.so_kg)), '[]')
    into v_a
  from kho_phan_bo(p_vi_tri_id, p_mat_hang_id, p_lo_id,
                   case when v_mh.dem_goi then p_so_goi end,
                   case when v_mh.dem_goi then null else p_so_kg end, false) b;
  return jsonb_build_object('lo', v_a,
    'het_han', (select l.han_dung < hom_nay_vn() from kho_lo l where l.id = p_lo_id));
exception when check_violation then
  return null;
end;
$$;

comment on function kho_ipos_lay_lo_cua_lo is
  'NỘI BỘ (0051). Lấy đúng một lô ở quầy cho một lần bán (lô của ô mã). Không đủ → null. Không ghi sổ.';

-- Bán theo kg món đếm gói, từ một lô: số gói gần nhất với số kg theo kg TB mỗi
-- gói của lô đó ở quầy (tối thiểu 1). Lô không có ở quầy → null.
create or replace function kho_ipos_goi_theo_kg_lo(p_vi_tri_id uuid, p_lo_id uuid, p_kg numeric)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case when p_kg > 0 and t.so_goi > 0 and t.so_kg > 0
              then greatest(1, round(p_kg / (t.so_kg / t.so_goi)))::int end
  from kho_ton t
  where t.lo_id = p_lo_id and t.vi_tri_id = p_vi_tri_id
$$;

comment on function kho_ipos_goi_theo_kg_lo is 'NỘI BỘ (0051). Số gói của một lô ứng với số kg bán (kg TB mỗi gói của lô ở quầy).';


-- =============================================================================
-- 3 · GHI MỘT DÒNG — thay THÂN kho_ipos_ghi_dong (cùng chữ ký), chép 0042
-- =============================================================================
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

    if v_mp.kieu = 'mon' or (v_mp.kieu = 'goi_can' and v_mp.mat_hang_id is not null) then
      select * into v_mh from kho_mat_hang where id = v_mp.mat_hang_id;
    elsif v_om.id is not null then
      select * into v_mh from kho_mat_hang where id = v_om.mat_hang_id and dang_dung;
    elsif v_ma is not null then
      select * into v_mh from kho_mat_hang_theo_ma_can(v_ma);   -- 0051: nhận cả mã ô (0049)
    end if;
    if v_om.id is not null and v_om.mat_hang_id is distinct from v_mh.id then
      v_o := null;   -- ô của món khác: bỏ, trừ theo món đã khớp
      v_om := null;
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
      v_dv := coalesce(v_mp.don_vi_ban, case when v_o is not null or not v_mh.dem_goi then 'kg' else 'goi' end);
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
        mat_hang_id = v_mh.id, ma_can = coalesce(ma_can, v_ma), o_ma_id = v_o, lo_o_id = v_lo_o,
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
      o_ma_id = v_o, lo_o_id = v_lo_o, lech_o = v_lech,
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
-- 4 · GHÉP MÓN iPOS
-- =============================================================================
-- 4a · Ghép thường — chép 0042; ghép lại bằng hàm này thì bỏ ô mã.
create or replace function kho_ipos_gan_ma_v2(
  p_chi_nhanh_id  uuid,
  p_ma_ipos       text,
  p_kieu          text,
  p_mat_hang_id   uuid,
  p_don_vi_ban    text,
  p_kg_moi_don_vi numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma   text := nullif(btrim(p_ma_ipos), '');
  v_dv   text := nullif(lower(btrim(coalesce(p_don_vi_ban, ''))), '');
  v_kieu text := p_kieu;
  v_mh   uuid := p_mat_hang_id;
  v_kg   numeric;
  v_r    uuid;
  v_tt   text;
  v_dem  jsonb := '{}';
  v_n    int := 0;
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không ghép được món iPOS' using errcode = 'insufficient_privilege';
  end if;
  if v_ma is null or char_length(v_ma) > 100 then
    raise exception 'Thiếu mã món iPOS' using errcode = 'check_violation';
  end if;
  if v_kieu is not null and v_kieu not in ('goi_can', 'mon', 'bo_qua') then
    raise exception 'Kiểu ghép phải là goi_can, mon hoặc bo_qua' using errcode = 'check_violation';
  end if;
  if v_dv is not null and v_dv not in ('kg', 'goi', 'suat') then
    raise exception 'Bán theo phải là kg, gói hoặc suất' using errcode = 'check_violation';
  end if;

  if v_kieu is not null then
    if v_dv = 'suat' then
      -- Món chế biến: không trừ kho, chỉ đếm suất.
      v_kieu := 'bo_qua';
      v_mh := null;
    end if;
    if v_kieu = 'bo_qua' then
      v_mh := null;
      if v_dv <> 'suat' then
        v_dv := null;
      end if;
    end if;
    if v_kieu = 'mon' and v_mh is null then
      raise exception 'Chọn món trong kho' using errcode = 'check_violation';
    end if;
    if v_mh is not null and not exists (select 1 from kho_mat_hang where id = v_mh) then
      raise exception 'Không tìm thấy món trong kho' using errcode = 'check_violation';
    end if;
    if v_dv = 'goi' and p_kg_moi_don_vi is not null then
      if p_kg_moi_don_vi <= 0 or p_kg_moi_don_vi > 1000 then
        raise exception 'Mỗi gói phải nặng hơn 0 kg và không quá 1000 kg' using errcode = 'check_violation';
      end if;
      v_kg := round(p_kg_moi_don_vi, 3);
    end if;
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;

  if v_kieu is null then
    delete from kho_ipos_ma_hang where chi_nhanh_id = p_chi_nhanh_id and ma_ipos = v_ma;
    v_dv := null;
  else
    insert into kho_ipos_ma_hang (chi_nhanh_id, ma_ipos, ten_ipos, kieu, mat_hang_id, don_vi_ban, kg_moi_don_vi, nguoi_sua)
    values (p_chi_nhanh_id, v_ma,
            coalesce((select d.ten_ipos from kho_ipos_dong d where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = v_ma
                        and d.ten_ipos is not null order by d.created_at desc limit 1),
                     (select m.ten_ipos from kho_ipos_menu m where m.chi_nhanh_id = p_chi_nhanh_id and m.ma_ipos = v_ma)),
            v_kieu, v_mh, v_dv, v_kg, (nhan_su_hien_tai()).id)
    on conflict (chi_nhanh_id, ma_ipos) do update set
      kieu = excluded.kieu, mat_hang_id = excluded.mat_hang_id, don_vi_ban = excluded.don_vi_ban,
      kg_moi_don_vi = excluded.kg_moi_don_vi, nguoi_sua = excluded.nguoi_sua,
      o_ma_id = null,   -- 0051: ghép lại bằng hàm này = bỏ ô mã
      ten_ipos = coalesce(excluded.ten_ipos, kho_ipos_ma_hang.ten_ipos);
  end if;

  for v_r in
    select d.id from kho_ipos_dong d
    where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = v_ma and d.trang_thai in ('chua_khop', 'thieu_hang', 'loi')
    order by d.thoi_diem_ban, d.created_at
  loop
    v_tt := kho_ipos_ghi_dong(v_r);
    v_dem := jsonb_set(v_dem, array[v_tt], to_jsonb(coalesce((v_dem ->> v_tt)::int, 0) + 1));
    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('ma_ipos', v_ma, 'kieu', v_kieu, 'mat_hang_id', v_mh, 'don_vi_ban', v_dv,
                            'kg_moi_don_vi', v_kg, 'so_dong', v_n, 'dong', v_dem);
end;
$$;

-- 4b · Ghép món iPOS với MỘT ô mã (danh_muc). Món kho = món của ô. p_don_vi_ban:
-- kg (mặc định — món ô trên FABi bán theo cân, quantity là số kg) hoặc goi.
-- Ghép xong xử lý lại mọi dòng chua_khop / thieu_hang / loi cùng mã.
create or replace function kho_ipos_gan_o_ma(
  p_chi_nhanh_id uuid,
  p_ma_ipos      text,
  p_o_ma_id      uuid,
  p_don_vi_ban   text default 'kg'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma  text := nullif(btrim(p_ma_ipos), '');
  v_dv  text := coalesce(nullif(lower(btrim(coalesce(p_don_vi_ban, ''))), ''), 'kg');
  v_o   kho_o_ma;
  v_mh  kho_mat_hang;
  v_r   uuid;
  v_tt  text;
  v_dem jsonb := '{}';
  v_n   int := 0;
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không ghép được món iPOS' using errcode = 'insufficient_privilege';
  end if;
  if v_ma is null or char_length(v_ma) > 100 then
    raise exception 'Thiếu mã món iPOS' using errcode = 'check_violation';
  end if;
  if v_dv not in ('kg', 'goi') then
    raise exception 'Món ô mã bán theo kg hoặc gói' using errcode = 'check_violation';
  end if;
  select * into v_o from kho_o_ma where id = p_o_ma_id;
  if not found then
    raise exception 'Không tìm thấy ô mã' using errcode = 'check_violation';
  end if;
  select * into v_mh from kho_mat_hang where id = v_o.mat_hang_id;
  if not v_mh.dang_dung then
    raise exception 'Món của ô mã đã ngừng dùng' using errcode = 'check_violation';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;

  insert into kho_ipos_ma_hang (chi_nhanh_id, ma_ipos, ten_ipos, kieu, mat_hang_id, don_vi_ban, kg_moi_don_vi, o_ma_id, nguoi_sua)
  values (p_chi_nhanh_id, v_ma,
          coalesce((select d.ten_ipos from kho_ipos_dong d where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = v_ma
                      and d.ten_ipos is not null order by d.created_at desc limit 1),
                   (select m.ten_ipos from kho_ipos_menu m where m.chi_nhanh_id = p_chi_nhanh_id and m.ma_ipos = v_ma)),
          'mon', v_mh.id, v_dv, null, v_o.id, (nhan_su_hien_tai()).id)
  on conflict (chi_nhanh_id, ma_ipos) do update set
    kieu = 'mon', mat_hang_id = excluded.mat_hang_id, don_vi_ban = excluded.don_vi_ban,
    kg_moi_don_vi = null, o_ma_id = excluded.o_ma_id, nguoi_sua = excluded.nguoi_sua,
    ten_ipos = coalesce(excluded.ten_ipos, kho_ipos_ma_hang.ten_ipos);

  for v_r in
    select d.id from kho_ipos_dong d
    where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = v_ma and d.trang_thai in ('chua_khop', 'thieu_hang', 'loi')
    order by d.thoi_diem_ban, d.created_at
  loop
    v_tt := kho_ipos_ghi_dong(v_r);
    v_dem := jsonb_set(v_dem, array[v_tt], to_jsonb(coalesce((v_dem ->> v_tt)::int, 0) + 1));
    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('ma_ipos', v_ma, 'kieu', 'mon', 'mat_hang_id', v_mh.id, 'ten_mat_hang', v_mh.ten,
                            'o_ma_id', v_o.id, 'so_o', v_o.so_o, 'ma_can', v_o.ma_can, 'don_vi_ban', v_dv,
                            'so_dong', v_n, 'dong', v_dem);
end;
$$;

comment on function kho_ipos_gan_o_ma is
  'Ghép mã món iPOS với một ô mã (danh_muc, 0051): bán món này → trừ đúng lô của tảng đang giữ ô lúc bán. p_don_vi_ban kg (mặc định) | goi. Xử lý lại ngay mọi dòng chua_khop / thieu_hang / loi cùng mã. Trả {ma_ipos, kieu, mat_hang_id, ten_mat_hang, o_ma_id, so_o, ma_can, don_vi_ban, so_dong, dong{trạng thái: số}}.';


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (bọc kiểm pg_roles như 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_ipos_lo_cua_o(uuid, uuid, timestamptz) from authenticated';
    execute 'revoke execute on function kho_ipos_lay_lo_cua_lo(uuid, uuid, uuid, int, numeric) from authenticated';
    execute 'revoke execute on function kho_ipos_goi_theo_kg_lo(uuid, uuid, numeric) from authenticated';
    execute 'revoke execute on function kho_ipos_ghi_dong(uuid) from authenticated';
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
