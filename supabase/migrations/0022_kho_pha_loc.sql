-- =============================================================================
-- BEEFTOWN — 0022 · KHO · PHA LÓC: TỈ LỆ THU HỒI VÀ GIÁ VỐN THẬT
-- =============================================================================
-- Một phiên pha lóc: lấy một hoặc vài tảng CÙNG LOẠI (ví dụ hai tảng thăn
-- ngoại của hai lô), cắt ra các phần bán ở quầy, phụ phẩm, phần bỏ.
--
--   vào 10 kg thăn ngoại × 500.000đ = 5.000.000đ
--   ra   7 kg thăn cắt lát      (bán ở quầy)
--        1 kg thịt vụn          (phụ phẩm dùng lại, định giá 100.000đ/kg)
--      1,5 kg mỡ               (bỏ)
--      0,5 kg                  (hao hụt: không cân được — nước, vụn bám dao)
--   → thu hồi 70%, giá vốn thăn cắt lát = (5.000.000 − 100.000) ÷ 7 = 700.000đ/kg
--
-- MỘT LOẠI ĐẦU VÀO MỖI PHIÊN — có chủ đích. Pha chung thăn ngoại với nạc vai
-- thì giá vốn hai loại trộn lẫn, và tỉ lệ thu hồi "của thăn ngoại" không còn
-- nghĩa. Pha hai loại = hai phiên.
--
-- LẤY HẾT LÔ. Lấy hết số tảng của một lô ở một chỗ thì lấy hết luôn số kg còn
-- trên sổ, dù cân lại thấy nhẹ hơn (nước rỉ trong túi hút chân không). Phần
-- chênh đó nằm trong hao hụt của phiên — giá vốn thịt ra gánh luôn, đúng là
-- "giá vốn thật". Không làm vậy thì sổ còn "0 tảng, 0,3 kg": tồn ảo.
--
-- CHIA GIÁ VỐN (kho_tinh_phien_pha)
--   1. Giá trị đầu vào = Σ kg lấy ra × giá vốn/kg của từng lô tảng.
--   2. Phụ phẩm GIỮ LẠI được tính trước theo giá trị thu hồi (cài trong mặt
--      hàng, bảng kho_mat_hang_gia). Phần BỎ = 0.
--   3. Phần còn lại chia cho các phần thịt giữ lại — theo GIÁ TRỊ BÁN (kg ×
--      giá bán/kg, mặc định) hoặc theo KG (cài đặt gốc). Thiếu giá bán của một
--      phần thì cả phiên chia theo kg, kèm cảnh báo.
--   4. Chia bằng số dư lớn nhất: tổng giá trị ra = giá trị vào, TUYỆT ĐỐI.
--
-- Tồn chỉ thay đổi lúc CHỐT. Phiên nháp không chạm sổ kho.
-- =============================================================================


-- =============================================================================
-- 1 · BẢNG
-- =============================================================================
create table kho_phien_pha (
  id              uuid primary key default gen_random_uuid(),
  chi_nhanh_id    uuid not null references chi_nhanh(id) on delete restrict,
  so_phieu        text not null,
  ma_gui          uuid not null,
  phien_ban       int not null default 1,
  mat_hang_vao_id uuid not null references kho_mat_hang(id) on delete restrict,
  cong_thuc_id    uuid references kho_cong_thuc_pha(id) on delete set null,
  ngay_pha        date not null default hom_nay_vn(),
  ghi_chu         text,
  trang_thai      text not null default 'nhap',
  ly_do           text,
  -- Tổng kết, ghi lúc chốt. Không có tiền: giá vốn nằm ở kho_lo_gia.
  tong_kg_vao      numeric(12,3),
  tong_kg_thit     numeric(12,3),
  tong_kg_phu_pham numeric(12,3),
  tong_kg_bo       numeric(12,3),
  tong_kg_hao_hut  numeric(12,3),
  ty_le_thu_hoi    numeric(6,2),
  nguoi_tao       uuid references nhan_su(id) on delete set null,
  nguoi_chot      uuid references nhan_su(id) on delete set null,
  chot_luc        timestamptz,
  nguoi_huy       uuid references nhan_su(id) on delete set null,
  huy_luc         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint kho_phien_pha_so_duy_nhat     unique (chi_nhanh_id, so_phieu),
  constraint kho_phien_pha_ma_gui_duy_nhat unique (ma_gui),
  constraint kho_phien_pha_trang_thai_hop_le check (trang_thai in ('nhap', 'da_chot', 'da_huy'))
);

create index kho_phien_pha_trang_thai_idx on kho_phien_pha(chi_nhanh_id, trang_thai, ngay_pha desc);

create trigger kho_phien_pha_updated_at
  before update on kho_phien_pha
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_phien_pha is
  'Phiên pha lóc: một loại tảng vào, các phần ra. Chỉ ghi qua kho_*_phien_pha. Tồn chỉ đổi lúc chốt.';

create table kho_phien_pha_vao (
  id           uuid primary key default gen_random_uuid(),
  phien_pha_id uuid not null references kho_phien_pha(id) on delete cascade,
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  thu_tu       int not null default 0,
  lo_id        uuid not null references kho_lo(id) on delete restrict,
  vi_tri_id    uuid not null references kho_vi_tri(id) on delete restrict,
  so_kg        numeric(12,3) not null,
  so_goi       int not null default 0,

  constraint kho_phien_pha_vao_so_hop_le check (so_kg > 0 and so_goi >= 0),
  constraint kho_phien_pha_vao_duy_nhat unique (phien_pha_id, lo_id, vi_tri_id)
);

create index kho_phien_pha_vao_phien_idx on kho_phien_pha_vao(phien_pha_id);

create table kho_phien_pha_ra (
  id           uuid primary key default gen_random_uuid(),
  phien_pha_id uuid not null references kho_phien_pha(id) on delete cascade,
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  thu_tu       int not null default 0,
  mat_hang_id  uuid not null references kho_mat_hang(id) on delete restrict,
  so_kg        numeric(12,3) not null,
  so_goi       int not null default 0,
  xu_ly        text not null,
  vi_tri_id    uuid references kho_vi_tri(id) on delete restrict,
  han_dung     date,
  -- Chụp lại lúc chốt: giá BÁN (công khai), dùng để chia giá vốn. Không phải giá vốn.
  gia_ban_kg   bigint,
  lo_id        uuid references kho_lo(id) on delete restrict,

  constraint kho_phien_pha_ra_so_hop_le check (so_kg > 0 and so_goi >= 0),
  constraint kho_phien_pha_ra_xu_ly_hop_le check (xu_ly in ('nhap_kho', 'chuyen_bep', 'bo'))
);

create index kho_phien_pha_ra_phien_idx on kho_phien_pha_ra(phien_pha_id, thu_tu);

alter table kho_lo
  add constraint kho_lo_phien_pha_fk
  foreign key (phien_pha_id) references kho_phien_pha(id) on delete restrict;

comment on table kho_phien_pha_ra is
  'Đầu ra của phiên pha lóc. xu_ly: nhap_kho (vào kho/quầy, thành lô mới), chuyen_bep (thành lô rồi xuất bếp ngay), bo (không có lô, giá trị 0).';


-- =============================================================================
-- 2 · TÍNH THU HỒI VÀ CHIA GIÁ VỐN — không ghi gì, dùng cho xem thử và chốt
-- =============================================================================
create or replace function kho_tinh_phien_pha(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ph         kho_phien_pha;
  v_cd         kho_cai_dat;
  v_gt_vao     bigint := 0;
  v_kg_vao     numeric := 0;
  v_han_vao    date;
  v_r          record;
  v_ra_ids     uuid[] := '{}';
  v_nhom       text[] := '{}';     -- 'thit' | 'phu_pham' | 'bo'
  v_kg         numeric[] := '{}';
  v_nrv        bigint[] := '{}';
  v_ts         numeric[] := '{}';
  v_gia_tri    bigint[] := '{}';
  v_tong_nrv   bigint := 0;
  v_con_lai    bigint;
  v_kg_thit    numeric := 0;
  v_kg_pp      numeric := 0;
  v_kg_bo      numeric := 0;
  v_theo       text;
  v_thieu_gia  text[] := '{}';
  v_thieu_th   text[] := '{}';
  v_canh_bao   text[] := '{}';
  v_chia       bigint[];
  v_chi_so     int[] := '{}';
  v_ts_con     numeric[] := '{}';
  i            int;
  n            int;
  v_dong       jsonb := '[]';
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found then
    raise exception 'Không tìm thấy phiên pha lóc' using errcode = 'foreign_key_violation';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_ph.chi_nhanh_id;
  v_theo := coalesce(v_cd.phuong_phap_gia_von, 'gia_tri');

  -- Đầu vào: giá trị theo giá vốn/kg của từng lô.
  for v_r in
    select v.so_kg, coalesce(g.gia_von_kg, 0) as gia_von_kg, l.han_dung
    from kho_phien_pha_vao v
    join kho_lo l on l.id = v.lo_id
    left join kho_lo_gia g on g.lo_id = v.lo_id
    where v.phien_pha_id = p_id
  loop
    v_gt_vao := v_gt_vao + round(v_r.so_kg * v_r.gia_von_kg)::bigint;
    v_kg_vao := v_kg_vao + v_r.so_kg;
    v_han_vao := least(coalesce(v_han_vao, v_r.han_dung), v_r.han_dung);
  end loop;

  -- Đầu ra: phân nhóm, giá trị thu hồi phụ phẩm, trọng số chia.
  for v_r in
    select r.id, r.so_kg, r.xu_ly, m.loai, m.ten, m.gia_ban_kg, mg.gia_tri_thu_hoi_kg
    from kho_phien_pha_ra r
    join kho_mat_hang m on m.id = r.mat_hang_id
    left join kho_mat_hang_gia mg on mg.mat_hang_id = r.mat_hang_id
    where r.phien_pha_id = p_id
    order by r.thu_tu, r.id
  loop
    v_ra_ids := v_ra_ids || v_r.id;
    v_kg := v_kg || v_r.so_kg::numeric;
    if v_r.xu_ly = 'bo' then
      v_nhom := v_nhom || 'bo'::text;
      v_nrv := v_nrv || 0::bigint;
      v_ts := v_ts || 0::numeric;
      v_kg_bo := v_kg_bo + v_r.so_kg;
    elsif v_r.loai = 'phu_pham' then
      v_nhom := v_nhom || 'phu_pham'::text;
      v_nrv := v_nrv || round(v_r.so_kg * coalesce(v_r.gia_tri_thu_hoi_kg, 0))::bigint;
      v_ts := v_ts || 0::numeric;
      v_tong_nrv := v_tong_nrv + round(v_r.so_kg * coalesce(v_r.gia_tri_thu_hoi_kg, 0))::bigint;
      v_kg_pp := v_kg_pp + v_r.so_kg;
      if v_r.gia_tri_thu_hoi_kg is null and not (v_r.ten = any(v_thieu_th)) then
        v_thieu_th := v_thieu_th || v_r.ten::text;
      end if;
    else
      v_nhom := v_nhom || 'thit'::text;
      v_nrv := v_nrv || 0::bigint;
      v_ts := v_ts || (v_r.so_kg * coalesce(v_r.gia_ban_kg, 0))::numeric;
      v_kg_thit := v_kg_thit + v_r.so_kg;
      if coalesce(v_r.gia_ban_kg, 0) = 0 and not (v_r.ten = any(v_thieu_gia)) then
        v_thieu_gia := v_thieu_gia || v_r.ten::text;
      end if;
    end if;
  end loop;

  if v_theo = 'gia_tri' and coalesce(array_length(v_thieu_gia, 1), 0) > 0 then
    v_theo := 'khoi_luong';
    v_canh_bao := v_canh_bao || ('Chưa có giá bán: ' || array_to_string(v_thieu_gia, ', ')
                                 || ' — phiên này chia giá vốn theo kg')::text;
  end if;
  if coalesce(array_length(v_thieu_th, 1), 0) > 0 then
    v_canh_bao := v_canh_bao || ('Phụ phẩm chưa có giá trị thu hồi (tính 0 đ): '
                                 || array_to_string(v_thieu_th, ', '))::text;
  end if;

  n := coalesce(array_length(v_ra_ids, 1), 0);
  v_gia_tri := array_fill(0::bigint, array[greatest(n, 1)]);

  if v_tong_nrv > v_gt_vao then
    raise exception 'Giá trị thu hồi phụ phẩm (% đ) lớn hơn giá vốn đầu vào (% đ) — kiểm lại giá trị thu hồi trong Cài đặt mặt hàng', v_tong_nrv, v_gt_vao
      using errcode = 'check_violation';
  end if;
  v_con_lai := v_gt_vao - v_tong_nrv;

  for i in 1..n loop
    if v_nhom[i] = 'phu_pham' then v_gia_tri[i] := v_nrv[i]; end if;
  end loop;

  -- Chia phần còn lại cho phần thịt; không có phần thịt thì cho phụ phẩm giữ
  -- lại (theo kg); không giữ lại gì cả thì giá trị đó là tổn thất của phiên.
  for i in 1..n loop
    if v_nhom[i] = 'thit' then
      v_chi_so := v_chi_so || i;
      v_ts_con := v_ts_con || case when v_theo = 'gia_tri' then v_ts[i] else v_kg[i] end;
    end if;
  end loop;
  if coalesce(array_length(v_chi_so, 1), 0) = 0 then
    for i in 1..n loop
      if v_nhom[i] = 'phu_pham' then
        v_chi_so := v_chi_so || i;
        v_ts_con := v_ts_con || v_kg[i];
      end if;
    end loop;
  end if;
  if coalesce(array_length(v_chi_so, 1), 0) > 0 then
    v_chia := kho_chia_so_du_lon_nhat(v_con_lai, v_ts_con);
    for i in 1..array_length(v_chi_so, 1) loop
      v_gia_tri[v_chi_so[i]] := v_gia_tri[v_chi_so[i]] + v_chia[i];
    end loop;
  elsif v_con_lai > 0 and n > 0 then
    v_canh_bao := v_canh_bao || 'Không giữ lại phần nào — toàn bộ giá vốn đầu vào thành tổn thất'::text;
  end if;

  for i in 1..n loop
    v_dong := v_dong || jsonb_build_object(
      'ra_id', v_ra_ids[i], 'nhom', v_nhom[i], 'so_kg', v_kg[i],
      'gia_tri', v_gia_tri[i],
      'gia_von_kg', round(v_gia_tri[i]::numeric / v_kg[i]),
      'ty_le', case when v_kg_vao > 0 then round(v_kg[i] * 100 / v_kg_vao, 2) end);
  end loop;

  return jsonb_build_object(
    'tong_kg_vao', v_kg_vao,
    'tong_kg_thit', v_kg_thit,
    'tong_kg_phu_pham', v_kg_pp,
    'tong_kg_bo', v_kg_bo,
    'tong_kg_hao_hut', v_kg_vao - v_kg_thit - v_kg_pp - v_kg_bo,
    'ty_le_thu_hoi', case when v_kg_vao > 0 then round(v_kg_thit * 100 / v_kg_vao, 2) end,
    'ty_le_phu_pham', case when v_kg_vao > 0 then round(v_kg_pp * 100 / v_kg_vao, 2) end,
    'ty_le_bo', case when v_kg_vao > 0 then round(v_kg_bo * 100 / v_kg_vao, 2) end,
    'ty_le_hao_hut', case when v_kg_vao > 0
                          then round((v_kg_vao - v_kg_thit - v_kg_pp - v_kg_bo) * 100 / v_kg_vao, 2) end,
    'gia_tri_vao', v_gt_vao,
    'gia_von_vao_kg', case when v_kg_vao > 0 then round(v_gt_vao / v_kg_vao) end,
    'gia_tri_phu_pham', v_tong_nrv,
    'han_som_nhat_vao', v_han_vao,
    'chia_theo', v_theo,
    'canh_bao', to_jsonb(v_canh_bao),
    'dong', v_dong);
end;
$$;

comment on function kho_tinh_phien_pha is
  'Tính tỉ lệ thu hồi và chia giá vốn cho một phiên pha lóc, KHÔNG ghi gì. Nội bộ — gọi qua kho_xem_thu_phien_pha() hoặc kho_chot_phien_pha().';


-- =============================================================================
-- 3 · LƯU NHÁP
-- =============================================================================
-- p_vao: [{lo_id, vi_tri_id, so_kg, so_goi}] — so_kg bỏ trống = lấy hết lô ở chỗ đó.
-- p_ra:  [{mat_hang_id, so_kg, so_goi, xu_ly, vi_tri_id, han_dung}]
create or replace function kho_luu_phien_pha(
  p_id              uuid,
  p_chi_nhanh_id    uuid,
  p_ma_gui          uuid,
  p_phien_ban       int,
  p_mat_hang_vao_id uuid,
  p_cong_thuc_id    uuid,
  p_ngay_pha        date,
  p_ghi_chu         text,
  p_vao             jsonb,
  p_ra              jsonb
)
returns table (phien_id uuid, phien_ban_moi int, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv      nhan_su;
  v_ph      kho_phien_pha;
  v_mh      kho_mat_hang;
  v_id      uuid;
  v_pb      int;
  v_dong    jsonb;
  v_khoa    text;
  v_i       int;
  v_lo      kho_lo;
  v_vt      kho_vi_tri;
  v_kg      numeric;
  v_goi     int;
  v_ton_kg  numeric;
  v_ton_goi int;
  v_mhr     kho_mat_hang;
  v_xl      text;
  v_han     date;
  c_uuid    constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not kho_duoc(p_chi_nhanh_id, 'pha_loc') then
    raise exception 'Tài khoản của bạn không được ghi pha lóc'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();

  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;

  select * into v_mh from kho_mat_hang where id = p_mat_hang_vao_id;
  if not found or v_mh.loai not in ('tang', 'phan_cat') then
    raise exception 'Chọn loại tảng (hoặc phần cắt) đem đi pha' using errcode = 'check_violation';
  end if;
  if p_ngay_pha is null or p_ngay_pha > hom_nay_vn() then
    raise exception 'Ngày pha không được sau hôm nay' using errcode = 'check_violation';
  end if;
  if p_ngay_pha < hom_nay_vn() - 30 then
    raise exception 'Ngày pha quá 30 ngày trước — kiểm tra lại ngày' using errcode = 'check_violation';
  end if;
  if p_cong_thuc_id is not null and not exists (
       select 1 from kho_cong_thuc_pha where id = p_cong_thuc_id and mat_hang_vao_id = p_mat_hang_vao_id) then
    raise exception 'Công thức không dành cho loại tảng này' using errcode = 'check_violation';
  end if;
  if p_vao is null then p_vao := '[]'; end if;
  if p_ra is null then p_ra := '[]'; end if;
  if jsonb_typeof(p_vao) <> 'array' or jsonb_typeof(p_ra) <> 'array' then
    raise exception 'Danh sách đầu vào / đầu ra không hợp lệ' using errcode = 'check_violation';
  end if;

  if p_id is null then
    select pp.id, pp.phien_ban into v_id, v_pb from kho_phien_pha pp where pp.ma_gui = p_ma_gui;
    if found then
      return query select v_id, v_pb, true;
      return;
    end if;
    insert into kho_phien_pha
      (chi_nhanh_id, so_phieu, ma_gui, mat_hang_vao_id, cong_thuc_id, ngay_pha, ghi_chu, nguoi_tao)
    values
      (p_chi_nhanh_id, kho_sinh_so(p_chi_nhanh_id, 'PL'), p_ma_gui, p_mat_hang_vao_id,
       p_cong_thuc_id, p_ngay_pha, nullif(btrim(p_ghi_chu), ''), v_nv.id)
    returning kho_phien_pha.id, kho_phien_pha.phien_ban into v_id, v_pb;
  else
    select * into v_ph from kho_phien_pha where kho_phien_pha.id = p_id for update;
    if not found or v_ph.chi_nhanh_id <> p_chi_nhanh_id then
      raise exception 'Không tìm thấy phiên pha lóc' using errcode = 'foreign_key_violation';
    end if;
    if v_ph.trang_thai <> 'nhap' then
      raise exception 'Phiên % đã % — không sửa được', v_ph.so_phieu,
        case v_ph.trang_thai when 'da_chot' then 'chốt (mở lại nếu cần sửa)' else 'bị hủy' end
        using errcode = 'check_violation';
    end if;
    if p_phien_ban is distinct from v_ph.phien_ban then
      raise exception 'Phiên đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
        using errcode = 'check_violation';
    end if;
    update kho_phien_pha set
      mat_hang_vao_id = p_mat_hang_vao_id,
      cong_thuc_id    = p_cong_thuc_id,
      ngay_pha        = p_ngay_pha,
      ghi_chu         = nullif(btrim(p_ghi_chu), ''),
      phien_ban       = kho_phien_pha.phien_ban + 1
    where kho_phien_pha.id = p_id
    returning kho_phien_pha.id, kho_phien_pha.phien_ban into v_id, v_pb;
    delete from kho_phien_pha_vao where phien_pha_id = p_id;
    delete from kho_phien_pha_ra where phien_pha_id = p_id;
  end if;

  -- ĐẦU VÀO: lô nào, ở đâu, bao nhiêu kg.
  v_i := 0;
  for v_dong in select value from jsonb_array_elements(p_vao) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Đầu vào % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if v_khoa <> all (array['lo_id', 'vi_tri_id', 'so_kg', 'so_goi']) then
        raise exception 'Đầu vào %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
      end if;
    end loop;
    if jsonb_typeof(v_dong -> 'lo_id') is distinct from 'string' or (v_dong ->> 'lo_id') !~* c_uuid
       or jsonb_typeof(v_dong -> 'vi_tri_id') is distinct from 'string' or (v_dong ->> 'vi_tri_id') !~* c_uuid then
      raise exception 'Đầu vào %: chưa chọn lô', v_i using errcode = 'check_violation';
    end if;
    select * into v_lo from kho_lo where id = (v_dong ->> 'lo_id')::uuid;
    select * into v_vt from kho_vi_tri where id = (v_dong ->> 'vi_tri_id')::uuid;
    if v_lo.id is null or v_vt.id is null
       or v_lo.chi_nhanh_id <> p_chi_nhanh_id or v_vt.chi_nhanh_id <> p_chi_nhanh_id then
      raise exception 'Đầu vào %: lô hoặc vị trí không thuộc chi nhánh này', v_i using errcode = 'check_violation';
    end if;
    if v_lo.mat_hang_id <> p_mat_hang_vao_id then
      raise exception 'Đầu vào %: lô % không phải loại đã chọn — mỗi phiên chỉ pha một loại', v_i, v_lo.ma_lo
        using errcode = 'check_violation';
    end if;
    if v_vt.loai = 'cho_huy' then
      raise exception 'Lô % đang chờ hủy — không đem pha được', v_lo.ma_lo using errcode = 'check_violation';
    end if;

    select t.so_kg, t.so_goi into v_ton_kg, v_ton_goi
    from kho_ton t where t.lo_id = v_lo.id and t.vi_tri_id = v_vt.id;
    v_ton_kg := coalesce(v_ton_kg, 0);
    v_ton_goi := coalesce(v_ton_goi, 0);
    if v_ton_kg <= 0 then
      raise exception 'Lô % ở "%" đã hết', v_lo.ma_lo, v_vt.ten using errcode = 'check_violation';
    end if;

    v_goi := 0;
    if v_dong ? 'so_goi' and v_dong -> 'so_goi' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi') <> 'number'
         or (v_dong ->> 'so_goi')::numeric <> trunc((v_dong ->> 'so_goi')::numeric)
         or (v_dong ->> 'so_goi')::numeric < 0 then
        raise exception 'Đầu vào % (lô %): số % phải là số nguyên không âm', v_i, v_lo.ma_lo, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi')::int;
    end if;
    if v_goi > v_ton_goi then
      raise exception 'Lô % ở "%" chỉ còn % %', v_lo.ma_lo, v_vt.ten, v_ton_goi, v_mh.don_vi_goi
        using errcode = 'check_violation';
    end if;

    if not (v_dong ? 'so_kg') or v_dong -> 'so_kg' = 'null'::jsonb then
      v_kg := v_ton_kg;                      -- bỏ trống = lấy hết
    elsif jsonb_typeof(v_dong -> 'so_kg') <> 'number' then
      raise exception 'Đầu vào % (lô %): số kg không hợp lệ', v_i, v_lo.ma_lo using errcode = 'check_violation';
    else
      v_kg := (v_dong ->> 'so_kg')::numeric;
      if v_kg <= 0 or v_kg <> round(v_kg, 3) then
        raise exception 'Đầu vào % (lô %): số kg phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_lo.ma_lo
          using errcode = 'check_violation';
      end if;
      if v_kg > v_ton_kg then
        raise exception 'Lô % ở "%" chỉ còn % kg', v_lo.ma_lo, v_vt.ten, v_ton_kg
          using errcode = 'check_violation';
      end if;
    end if;

    -- Lấy hết kg thì lấy hết gói; lấy hết gói (đếm gói) thì lấy hết kg.
    if v_kg = v_ton_kg then
      v_goi := v_ton_goi;
    elsif v_mh.dem_goi and v_goi > 0 and v_goi = v_ton_goi then
      v_kg := v_ton_kg;
    end if;

    begin
      insert into kho_phien_pha_vao (phien_pha_id, chi_nhanh_id, thu_tu, lo_id, vi_tri_id, so_kg, so_goi)
      values (v_id, p_chi_nhanh_id, v_i, v_lo.id, v_vt.id, v_kg, v_goi);
    exception when unique_violation then
      raise exception 'Lô % ở "%" bị chọn hai lần', v_lo.ma_lo, v_vt.ten using errcode = 'check_violation';
    end;
  end loop;

  -- ĐẦU RA
  v_i := 0;
  for v_dong in select value from jsonb_array_elements(p_ra) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Đầu ra % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if v_khoa <> all (array['mat_hang_id', 'so_kg', 'so_goi', 'xu_ly', 'vi_tri_id', 'han_dung']) then
        raise exception 'Đầu ra %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
      end if;
    end loop;
    if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string' or (v_dong ->> 'mat_hang_id') !~* c_uuid then
      raise exception 'Đầu ra %: chưa chọn mặt hàng', v_i using errcode = 'check_violation';
    end if;
    select * into v_mhr from kho_mat_hang where id = (v_dong ->> 'mat_hang_id')::uuid;
    if not found or not v_mhr.dang_dung then
      raise exception 'Đầu ra %: mặt hàng không có hoặc đã ngừng dùng', v_i using errcode = 'check_violation';
    end if;
    if jsonb_typeof(v_dong -> 'so_kg') is distinct from 'number' then
      raise exception 'Đầu ra % (%): chưa nhập số kg', v_i, v_mhr.ten using errcode = 'check_violation';
    end if;
    v_kg := (v_dong ->> 'so_kg')::numeric;
    if v_kg <= 0 or v_kg >= 1000000 or v_kg <> round(v_kg, 3) then
      raise exception 'Đầu ra % (%): số kg phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mhr.ten using errcode = 'check_violation';
    end if;
    v_goi := 0;
    if v_dong ? 'so_goi' and v_dong -> 'so_goi' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi') <> 'number'
         or (v_dong ->> 'so_goi')::numeric <> trunc((v_dong ->> 'so_goi')::numeric)
         or (v_dong ->> 'so_goi')::numeric < 0 then
        raise exception 'Đầu ra % (%): số % phải là số nguyên không âm', v_i, v_mhr.ten, v_mhr.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi')::int;
    end if;
    v_xl := coalesce(nullif(v_dong ->> 'xu_ly', ''), v_mhr.xu_ly_mac_dinh);
    if v_xl not in ('nhap_kho', 'chuyen_bep', 'bo') then
      raise exception 'Đầu ra % (%): cách xử lý không hợp lệ', v_i, v_mhr.ten using errcode = 'check_violation';
    end if;
    v_vt := null;
    if v_xl = 'nhap_kho' then
      if jsonb_typeof(v_dong -> 'vi_tri_id') is distinct from 'string' or (v_dong ->> 'vi_tri_id') !~* c_uuid then
        raise exception 'Đầu ra % (%): chọn nơi để (kho hay quầy)', v_i, v_mhr.ten using errcode = 'check_violation';
      end if;
      select * into v_vt from kho_vi_tri where id = (v_dong ->> 'vi_tri_id')::uuid;
      if v_vt.id is null or v_vt.chi_nhanh_id <> p_chi_nhanh_id or v_vt.loai = 'cho_huy' or not v_vt.dang_dung then
        raise exception 'Đầu ra % (%): nơi để phải là kho hoặc quầy đang dùng', v_i, v_mhr.ten using errcode = 'check_violation';
      end if;
      if v_mhr.dem_goi and v_goi = 0 then
        raise exception 'Đầu ra % (%): chưa nhập số %', v_i, v_mhr.ten, v_mhr.don_vi_goi using errcode = 'check_violation';
      end if;
    end if;
    v_han := null;
    if v_xl <> 'bo' and coalesce(v_dong ->> 'han_dung', '') <> '' then
      begin
        v_han := (v_dong ->> 'han_dung')::date;
      exception when others then
        raise exception 'Đầu ra % (%): hạn dùng không hợp lệ', v_i, v_mhr.ten using errcode = 'check_violation';
      end;
      if v_han < p_ngay_pha then
        raise exception 'Đầu ra % (%): hạn dùng trước ngày pha', v_i, v_mhr.ten using errcode = 'check_violation';
      end if;
    end if;
    insert into kho_phien_pha_ra
      (phien_pha_id, chi_nhanh_id, thu_tu, mat_hang_id, so_kg, so_goi, xu_ly, vi_tri_id, han_dung)
    values
      (v_id, p_chi_nhanh_id, v_i, v_mhr.id, v_kg, v_goi, v_xl, v_vt.id, v_han);
  end loop;

  return query select v_id, v_pb, false;
end;
$$;

comment on function kho_luu_phien_pha is
  'Lưu nháp phiên pha lóc (tạo mới khi p_id null). Đầu vào phải cùng một loại tảng và đủ tồn. Không chạm sổ kho.';


-- =============================================================================
-- 4 · XEM THỬ — thấy thu hồi và giá vốn TRƯỚC khi chốt
-- =============================================================================
create or replace function kho_xem_thu_phien_pha(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ph kho_phien_pha;
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found or not kho_duoc(v_ph.chi_nhanh_id, 'xem_gia') then
    raise exception 'Không tìm thấy phiên pha lóc, hoặc tài khoản không được xem'
      using errcode = 'insufficient_privilege';
  end if;
  return kho_tinh_phien_pha(p_id);
end;
$$;


-- =============================================================================
-- 5 · CHỐT — ghi sổ: trừ tảng, sinh lô cho từng phần giữ lại
-- =============================================================================
create or replace function kho_chot_phien_pha(p_id uuid, p_phien_ban int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ph      kho_phien_pha;
  v_nv      nhan_su;
  v_tinh    jsonb;
  v_d       jsonb;
  v_ra      kho_phien_pha_ra;
  v_vao     kho_phien_pha_vao;
  v_mh      kho_mat_hang;
  v_lo      uuid;
  v_han     date;
  v_vt_pha  uuid;
  v_so_lo   int := 0;
  v_kg_ra   numeric;
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found or not kho_duoc(v_ph.chi_nhanh_id, 'pha_loc') then
    raise exception 'Không tìm thấy phiên pha lóc, hoặc tài khoản không được chốt'
      using errcode = 'insufficient_privilege';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = v_ph.chi_nhanh_id for update;
  select * into v_ph from kho_phien_pha where id = p_id for update;

  if v_ph.trang_thai = 'da_chot' then
    return 'Phiên ' || v_ph.so_phieu || ' đã được chốt trước đó.';
  end if;
  if v_ph.trang_thai <> 'nhap' then
    raise exception 'Phiên % đã bị hủy', v_ph.so_phieu using errcode = 'check_violation';
  end if;
  if p_phien_ban is distinct from v_ph.phien_ban then
    raise exception 'Phiên đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
      using errcode = 'check_violation';
  end if;
  if not exists (select 1 from kho_phien_pha_vao where phien_pha_id = p_id) then
    raise exception 'Chưa chọn tảng nào đem pha' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from kho_phien_pha_ra where phien_pha_id = p_id) then
    raise exception 'Chưa nhập phần nào cắt ra' using errcode = 'check_violation';
  end if;

  v_tinh := kho_tinh_phien_pha(p_id);
  select coalesce(sum(so_kg), 0) into v_kg_ra from kho_phien_pha_ra where phien_pha_id = p_id;
  if v_kg_ra > (v_tinh ->> 'tong_kg_vao')::numeric + 0.05 then
    raise exception 'Tổng kg ra (% kg) lớn hơn kg vào (% kg) — kiểm lại số cân',
      v_kg_ra, v_tinh ->> 'tong_kg_vao'
      using errcode = 'check_violation';
  end if;

  v_nv := nhan_su_hien_tai();

  -- Trừ tảng đầu vào. Không đủ tồn (ai đó đã dùng lô sau khi lưu nháp) thì
  -- trigger sổ kho báo lỗi và cả phiên không được ghi.
  for v_vao in select * from kho_phien_pha_vao where phien_pha_id = p_id order by thu_tu loop
    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
    values
      (v_ph.chi_nhanh_id, v_vao.lo_id, v_vao.vi_tri_id, v_ph.mat_hang_vao_id, 'pha_loc_vao',
       -v_vao.so_kg, -v_vao.so_goi, 'phien_pha', p_id, v_nv.id, v_ph.ngay_pha);
  end loop;

  -- Chỗ pha (cho phần chuyển bếp): vị trí của đầu vào đầu tiên.
  select vi_tri_id into v_vt_pha from kho_phien_pha_vao where phien_pha_id = p_id order by thu_tu limit 1;

  -- Sinh lô cho từng phần giữ lại.
  for v_d in select value from jsonb_array_elements(v_tinh -> 'dong') loop
    select * into v_ra from kho_phien_pha_ra where id = (v_d ->> 'ra_id')::uuid;
    select * into v_mh from kho_mat_hang where id = v_ra.mat_hang_id;
    update kho_phien_pha_ra set gia_ban_kg = v_mh.gia_ban_kg where id = v_ra.id;
    continue when v_ra.xu_ly = 'bo';

    v_han := coalesce(v_ra.han_dung,
                      least(v_ph.ngay_pha + coalesce(v_mh.han_dung_ngay, 3650),
                            (v_tinh ->> 'han_som_nhat_vao')::date));

    insert into kho_lo
      (chi_nhanh_id, ma_lo, mat_hang_id, nguon, phien_pha_id, ngay_dong_goi, han_dung)
    values
      (v_ph.chi_nhanh_id, kho_sinh_so(v_ph.chi_nhanh_id, 'L'), v_ra.mat_hang_id, 'pha_loc', p_id,
       v_ph.ngay_pha, v_han)
    returning id into v_lo;

    insert into kho_lo_gia (lo_id, chi_nhanh_id, gia_tri, so_kg_goc)
    values (v_lo, v_ph.chi_nhanh_id, (v_d ->> 'gia_tri')::bigint, v_ra.so_kg);

    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
    values
      (v_ph.chi_nhanh_id, v_lo, coalesce(v_ra.vi_tri_id, v_vt_pha), v_ra.mat_hang_id, 'pha_loc_ra',
       v_ra.so_kg, v_ra.so_goi, 'phien_pha', p_id, v_nv.id, v_ph.ngay_pha);

    if v_ra.xu_ly = 'chuyen_bep' then
      insert into kho_so_cai
        (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
         chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi, ngay)
      values
        (v_ph.chi_nhanh_id, v_lo, coalesce(v_ra.vi_tri_id, v_vt_pha), v_ra.mat_hang_id, 'xuat_bep',
         -v_ra.so_kg, -v_ra.so_goi, 'phien_pha', p_id, 'Pha lóc chuyển thẳng bếp', v_nv.id, v_ph.ngay_pha);
    end if;

    update kho_phien_pha_ra
    set lo_id = v_lo, han_dung = v_han, vi_tri_id = coalesce(v_ra.vi_tri_id, v_vt_pha)
    where id = v_ra.id;
    v_so_lo := v_so_lo + 1;
  end loop;

  update kho_phien_pha set
    trang_thai       = 'da_chot',
    tong_kg_vao      = (v_tinh ->> 'tong_kg_vao')::numeric,
    tong_kg_thit     = (v_tinh ->> 'tong_kg_thit')::numeric,
    tong_kg_phu_pham = (v_tinh ->> 'tong_kg_phu_pham')::numeric,
    tong_kg_bo       = (v_tinh ->> 'tong_kg_bo')::numeric,
    tong_kg_hao_hut  = (v_tinh ->> 'tong_kg_hao_hut')::numeric,
    ty_le_thu_hoi    = (v_tinh ->> 'ty_le_thu_hoi')::numeric,
    nguoi_chot       = v_nv.id,
    chot_luc         = now(),
    phien_ban        = phien_ban + 1
  where id = p_id;

  return 'Đã chốt phiên ' || v_ph.so_phieu || ': thu hồi '
    || replace(coalesce(v_tinh ->> 'ty_le_thu_hoi', '0'), '.', ',') || '%, '
    || v_so_lo || ' lô mới.';
end;
$$;

comment on function kho_chot_phien_pha is
  'Chốt phiên pha lóc: trừ tảng, sinh lô cho từng phần giữ lại với giá vốn đã chia (tổng ra = tổng vào). Phần chuyển bếp thành lô rồi xuất bếp ngay.';


-- =============================================================================
-- 6 · MỞ LẠI, HỦY
-- =============================================================================
-- Mở lại: chỉ khi MỌI lô sinh ra chưa bị đụng tới (chỉ có dòng sổ của chính
-- phiên này). Đảo ngược các dòng sổ của phiên theo thứ tự ngược: hoàn xuất
-- bếp trước, rồi trừ lô ra, rồi mới trả tảng — tồn không lúc nào âm.
create or replace function kho_mo_lai_phien_pha(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ph   kho_phien_pha;
  v_nv   nhan_su;
  v_r    record;
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found or not kho_duoc(v_ph.chi_nhanh_id, 'pha_loc') then
    raise exception 'Không tìm thấy phiên pha lóc, hoặc tài khoản không được mở lại'
      using errcode = 'insufficient_privilege';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Cần ghi lý do mở lại phiên đã chốt' using errcode = 'check_violation';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = v_ph.chi_nhanh_id for update;
  select * into v_ph from kho_phien_pha where id = p_id for update;
  if v_ph.trang_thai = 'nhap' then
    return 'Phiên ' || v_ph.so_phieu || ' đang mở để sửa.';
  end if;
  if v_ph.trang_thai <> 'da_chot' then
    raise exception 'Phiên % đã bị hủy', v_ph.so_phieu using errcode = 'check_violation';
  end if;

  for v_r in
    select l.ma_lo,
           (select count(*) from kho_so_cai s
             where s.lo_id = l.id
               and not (s.chung_tu_loai = 'phien_pha' and s.chung_tu_id = p_id)) as khac
    from kho_lo l where l.phien_pha_id = p_id
  loop
    if v_r.khac > 0 then
      raise exception 'Không mở lại được: lô % đã được dùng sau khi chốt (chuyển, xuất, bán hoặc kiểm kê)', v_r.ma_lo
        using errcode = 'check_violation';
    end if;
  end loop;

  v_nv := nhan_su_hien_tai();
  for v_r in
    select s.* from kho_so_cai s
    where s.chung_tu_loai = 'phien_pha' and s.chung_tu_id = p_id
      and s.loai <> 'dao_nguoc'
      and not exists (select 1 from kho_so_cai d where d.dao_cua = s.id)
    order by case s.loai when 'xuat_bep' then 0 when 'pha_loc_ra' then 1 else 2 end,
             s.created_at desc, s.id
  loop
    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, dao_cua, ghi_chu, nguoi_ghi)
    values
      (v_r.chi_nhanh_id, v_r.lo_id, v_r.vi_tri_id, v_r.mat_hang_id, 'dao_nguoc',
       -v_r.so_kg, -v_r.so_goi, 'phien_pha', p_id, v_r.id, 'Mở lại phiên pha lóc', v_nv.id);
  end loop;

  update kho_phien_pha_ra set lo_id = null where phien_pha_id = p_id;
  update kho_phien_pha set
    trang_thai = 'nhap', ly_do = btrim(p_ly_do),
    tong_kg_vao = null, tong_kg_thit = null, tong_kg_phu_pham = null,
    tong_kg_bo = null, tong_kg_hao_hut = null, ty_le_thu_hoi = null,
    nguoi_chot = null, chot_luc = null, phien_ban = phien_ban + 1
  where id = p_id;

  return 'Đã mở lại phiên ' || v_ph.so_phieu || ' — tồn đã trả về như trước khi chốt. Sửa xong nhớ chốt lại.';
end;
$$;

create or replace function kho_huy_phien_pha(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ph kho_phien_pha;
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found or not kho_duoc(v_ph.chi_nhanh_id, 'pha_loc') then
    raise exception 'Không tìm thấy phiên pha lóc, hoặc tài khoản không được hủy'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_ph from kho_phien_pha where id = p_id for update;
  if v_ph.trang_thai = 'da_huy' then
    return 'Phiên ' || v_ph.so_phieu || ' đã bị hủy trước đó.';
  end if;
  if v_ph.trang_thai <> 'nhap' then
    raise exception 'Phiên đã chốt — mở lại trước khi hủy' using errcode = 'check_violation';
  end if;
  update kho_phien_pha set
    trang_thai = 'da_huy', ly_do = nullif(btrim(p_ly_do), ''),
    nguoi_huy = (nhan_su_hien_tai()).id, huy_luc = now(), phien_ban = phien_ban + 1
  where id = p_id;
  return 'Đã hủy phiên nháp ' || v_ph.so_phieu || '.';
end;
$$;


-- =============================================================================
-- 7 · VIEW VÀ PHÂN QUYỀN
-- =============================================================================
create view kho_v_phien_pha with (security_invoker = true) as
select p.id, p.chi_nhanh_id, p.so_phieu, p.trang_thai, p.phien_ban,
       p.mat_hang_vao_id, m.ten as ten_mat_hang_vao, m.ma as ma_mat_hang_vao,
       p.cong_thuc_id, p.ngay_pha, p.ghi_chu, p.ly_do,
       p.tong_kg_vao, p.tong_kg_thit, p.tong_kg_phu_pham, p.tong_kg_bo,
       p.tong_kg_hao_hut, p.ty_le_thu_hoi,
       p.nguoi_tao, p.nguoi_chot, p.chot_luc, p.created_at,
       (select count(*) from kho_phien_pha_vao v where v.phien_pha_id = p.id)::int as so_dau_vao,
       (select count(*) from kho_phien_pha_ra r where r.phien_pha_id = p.id)::int as so_dau_ra,
       (select coalesce(sum(v.so_kg), 0) from kho_phien_pha_vao v where v.phien_pha_id = p.id) as kg_vao_nhap,
       (select coalesce(sum(r.so_kg), 0) from kho_phien_pha_ra r where r.phien_pha_id = p.id) as kg_ra_nhap
from kho_phien_pha p
join kho_mat_hang m on m.id = p.mat_hang_vao_id;

comment on view kho_v_phien_pha is
  'Danh sách phiên pha lóc kèm tổng kết. Không có tiền.';

alter table kho_phien_pha     enable row level security;
alter table kho_phien_pha_vao enable row level security;
alter table kho_phien_pha_ra  enable row level security;

-- Pha lóc là việc của thủ kho, quản lý; kế toán xem được (giá vốn). NV quầy/bếp
-- không cần — lô phần cắt họ thấy ở trang tồn là đủ.
create policy kho_phien_pha_doc on kho_phien_pha
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));
create policy kho_phien_pha_vao_doc on kho_phien_pha_vao
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));
create policy kho_phien_pha_ra_doc on kho_phien_pha_ra
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_tinh_phien_pha(uuid) from authenticated';
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
