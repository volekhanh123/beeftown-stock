-- =============================================================================
-- BEEFTOWN KHO — 0046 · THEO DÕI THEO TẢNG: MỖI TẢNG MỘT LÔ, NGÀY MỔ, BẢNG Ủ
-- =============================================================================
-- Chủ đã chốt (27/09): thịt ủ (ribeye, striploin…) phải truy được tới TỪNG TẢNG
-- — mỗi tảng có ngày mổ riêng nên số ngày ủ và hạn dùng khác nhau; có sự cố
-- thì huỷ đúng các miếng của tảng đó. Kế hoạch đầy đủ: GĐ1 (file này) → ô mã
-- xoay vòng khi lóc (0047) → bán qua iPOS trừ đúng tảng (0048).
--
-- Làm ở đây, chỉ với món bật kho_mat_hang.theo_tang (món khác không đổi gì):
--   · Nhận hàng: MỖI DÒNG LÀ MỘT TẢNG (so_goi = 1), cân riêng, có ngay_mo.
--     Giữ nguyên quy tắc cũ "một dòng phiếu nhập = một lô" — nhờ vậy duyệt,
--     huỷ phiếu, trả NCC, công nợ, kiểm kê không phải sửa gì.
--   · Duyệt: lô của tảng mang ngay_mo, so_tang (số tăng dần theo chi nhánh,
--     in trên tem "#0142") và ngay_u_xong = ngày nhận + số ngày ủ tra từ
--     kho_bang_u theo tuổi thịt lúc nhận (ngày nhận − ngày mổ).
--   · Phiếu mua có món theo tảng mà dòng chưa tách tảng / thiếu ngày mổ (ví dụ
--     tạo từ đơn đặt hàng, chưa cân) thì chưa duyệt được.
--   · kho_v_tang: tảng còn trong kho — đang ủ hay sẵn sàng lóc.
--
-- THAY THÂN (cùng chữ ký):
--   kho_ghi_dong_phieu_nhap — chép 0020 (chưa file nào thay), thêm khóa ngay_mo.
--   kho_duyet_phieu_nhap    — chép 0031 (0032–0045 không thay), thêm ba cột lô.
--   kho_doc_phieu_nhap_kg   — chép 0039 (0040–0045 không thay), dòng thêm
--                             theo_tang, ngay_mo, so_tang.
-- Hàm mới nội bộ: kho_sinh_so_tang, kho_so_ngay_u (rút khỏi authenticated).
-- Không có tiền ở cột / view mới.
-- =============================================================================


-- =============================================================================
-- 1 · CỘT MỚI
-- =============================================================================
alter table kho_mat_hang add column theo_tang boolean not null default false;
alter table kho_mat_hang add constraint kho_mat_hang_theo_tang_hop_le
  check (not theo_tang or loai = 'tang');

comment on column kho_mat_hang.theo_tang is
  'Theo dõi theo tảng (0046): mỗi tảng nhận vào là một lô riêng có ngày mổ, số tảng, ngày ủ xong. Chỉ với món loại tảng.';

alter table kho_phieu_nhap_dong add column ngay_mo date;
comment on column kho_phieu_nhap_dong.ngay_mo is
  'Ngày mổ của tảng (đọc trên nhãn thùng). Bắt buộc với món theo dõi theo tảng — khi đó mỗi dòng là một tảng. 0046.';

alter table kho_lo add column ngay_mo date;
alter table kho_lo add column ngay_u_xong date;
alter table kho_lo add column so_tang int;
alter table kho_lo add constraint kho_lo_so_tang_duy_nhat unique (chi_nhanh_id, so_tang);

comment on column kho_lo.ngay_mo is 'Ngày mổ của tảng (0046).';
comment on column kho_lo.ngay_u_xong is 'Ngày ủ xong = ngày nhận + số ngày ủ tra từ kho_bang_u theo tuổi thịt lúc nhận. Null khi món chưa có bảng ủ (0046).';
comment on column kho_lo.so_tang is 'Số tảng tăng dần theo chi nhánh (in trên tem "#0142"). Chỉ với món theo dõi theo tảng (0046).';


-- =============================================================================
-- 2 · BẢNG Ủ — tuổi thịt lúc nhận → số ngày ủ
-- =============================================================================
-- Ví dụ Ribeye: tuổi ≤ 5 ngày → ủ 18 ngày; ≤ 10 → ủ 14; còn lại (null) → ủ 10.
-- Tra: dòng có tuoi_den_ngay nhỏ nhất mà ≥ tuổi thịt; không có thì dòng null.
create table kho_bang_u (
  id            uuid primary key default gen_random_uuid(),
  mat_hang_id   uuid not null references kho_mat_hang(id) on delete cascade,
  tuoi_den_ngay int,
  so_ngay_u     int not null,
  created_at    timestamptz not null default now(),

  constraint kho_bang_u_tuoi_hop_le check (tuoi_den_ngay is null or tuoi_den_ngay between 0 and 365),
  constraint kho_bang_u_so_ngay_hop_le check (so_ngay_u between 0 and 365)
);

create unique index kho_bang_u_moc_idx on kho_bang_u(mat_hang_id, tuoi_den_ngay) where tuoi_den_ngay is not null;
create unique index kho_bang_u_con_lai_idx on kho_bang_u(mat_hang_id) where tuoi_den_ngay is null;

comment on table kho_bang_u is
  'Bảng ủ của món theo dõi theo tảng (0046): tuổi thịt lúc nhận (ngày) → số ngày ủ. Dùng chung toàn thương hiệu như kho_mat_hang.';

alter table kho_bang_u enable row level security;
create policy kho_bang_u_doc on kho_bang_u
  for select using ((select kho_co_quyen('xem')));
create policy kho_bang_u_sua on kho_bang_u
  for all using ((select kho_co_quyen('danh_muc')))
  with check ((select kho_co_quyen('danh_muc')));

create or replace function kho_so_ngay_u(p_mat_hang_id uuid, p_tuoi int)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select so_ngay_u from kho_bang_u
     where mat_hang_id = p_mat_hang_id and tuoi_den_ngay is not null and tuoi_den_ngay >= greatest(p_tuoi, 0)
     order by tuoi_den_ngay limit 1),
    (select so_ngay_u from kho_bang_u
     where mat_hang_id = p_mat_hang_id and tuoi_den_ngay is null));
$$;

comment on function kho_so_ngay_u is
  'Số ngày ủ theo bảng ủ của món cho tuổi thịt lúc nhận; null khi món chưa có bảng. Nội bộ (0046).';


-- =============================================================================
-- 3 · SỐ TẢNG — tăng dần theo chi nhánh, không đặt lại theo kỳ
-- =============================================================================
create or replace function kho_sinh_so_tang(p_chi_nhanh_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_so int;
begin
  insert into kho_so_thu_tu (chi_nhanh_id, loai, ky, so_cuoi)
  values (p_chi_nhanh_id, 'T', '-', 1)
  on conflict (chi_nhanh_id, loai, ky)
    do update set so_cuoi = kho_so_thu_tu.so_cuoi + 1
  returning so_cuoi into v_so;
  return v_so;
end;
$$;

comment on function kho_sinh_so_tang is
  'Số tảng kế tiếp của chi nhánh (1, 2, 3…) — in trên tem "#0142". Nội bộ (0046).';


-- =============================================================================
-- 4 · GHI DÒNG PHIẾU NHẬP — thêm ngay_mo (chép 0020)
-- =============================================================================
create or replace function kho_ghi_dong_phieu_nhap(
  p_phieu_id     uuid,
  p_chi_nhanh_id uuid,
  p_ngay_nhap    date,
  p_dong         jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dong  jsonb;
  v_khoa  text;
  v_i     int := 0;
  v_mh    kho_mat_hang;
  v_han   date;
  v_nsx   date;
  v_kg    numeric;
  v_goi   int;
  v_gia   bigint;
  v_mo    date;
  c_khoa  constant text[] := array['mat_hang_id', 'so_goi', 'so_kg', 'don_gia_kg',
                                   'so_lo_ncc', 'ngay_san_xuat', 'han_dung', 'truong_them',
                                   'ngay_mo'];
begin
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' then
    raise exception 'Danh sách dòng hàng không hợp lệ' using errcode = 'check_violation';
  end if;

  for v_dong in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if not (v_khoa = any(c_khoa)) then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa
          using errcode = 'check_violation';
      end if;
    end loop;

    if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string'
       or (v_dong ->> 'mat_hang_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Dòng %: chưa chọn mặt hàng', v_i using errcode = 'check_violation';
    end if;
    select * into v_mh from kho_mat_hang
    where id = (v_dong ->> 'mat_hang_id')::uuid;
    if not found or not v_mh.dang_dung then
      raise exception 'Dòng %: mặt hàng không có hoặc đã ngừng dùng', v_i
        using errcode = 'check_violation';
    end if;

    if jsonb_typeof(v_dong -> 'so_kg') is distinct from 'number' then
      raise exception 'Dòng % (%): chưa nhập số kg', v_i, v_mh.ten using errcode = 'check_violation';
    end if;
    v_kg := (v_dong ->> 'so_kg')::numeric;
    if v_kg <= 0 or v_kg >= 1000000 or v_kg <> round(v_kg, 3) then
      raise exception 'Dòng % (%): số kg phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mh.ten
        using errcode = 'check_violation';
    end if;

    v_goi := 0;
    if v_dong ? 'so_goi' and v_dong -> 'so_goi' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi') <> 'number'
         or (v_dong ->> 'so_goi')::numeric <> trunc((v_dong ->> 'so_goi')::numeric)
         or (v_dong ->> 'so_goi')::numeric < 0 then
        raise exception 'Dòng % (%): số % phải là số nguyên không âm', v_i, v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi')::int;
    end if;
    if v_mh.dem_goi and v_goi = 0 and not v_mh.theo_tang then   -- 0046: dòng tảng tự là 1 tảng
      raise exception 'Dòng % (%): chưa nhập số %', v_i, v_mh.ten, v_mh.don_vi_goi
        using errcode = 'check_violation';
    end if;

    -- MỚI (0046): món theo dõi theo tảng — mỗi dòng là MỘT tảng, có ngày mổ.
    v_mo := null;
    if coalesce(v_dong ->> 'ngay_mo', '') <> '' then
      begin
        v_mo := (v_dong ->> 'ngay_mo')::date;
      exception when others then
        raise exception 'Dòng % (%): ngày mổ không hợp lệ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end;
      if v_mo > p_ngay_nhap then
        raise exception 'Dòng % (%): ngày mổ không được sau ngày nhận hàng', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      if v_mo < p_ngay_nhap - 365 then
        raise exception 'Dòng % (%): ngày mổ quá một năm trước ngày nhận — kiểm tra lại', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
    end if;
    if v_mh.theo_tang then
      if v_goi > 1 then
        raise exception 'Dòng % (%): món theo dõi theo tảng — mỗi tảng một dòng, cân riêng', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      v_goi := 1;
      if v_mo is null then
        raise exception 'Dòng % (%): chưa nhập ngày mổ của tảng', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
    end if;

    v_gia := 0;
    if v_dong ? 'don_gia_kg' and v_dong -> 'don_gia_kg' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'don_gia_kg') <> 'number'
         or (v_dong ->> 'don_gia_kg')::numeric <> trunc((v_dong ->> 'don_gia_kg')::numeric)
         or (v_dong ->> 'don_gia_kg')::numeric < 0 then
        raise exception 'Dòng % (%): đơn giá phải là số đồng không âm', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      v_gia := (v_dong ->> 'don_gia_kg')::bigint;
    end if;

    v_nsx := null;
    if coalesce(v_dong ->> 'ngay_san_xuat', '') <> '' then
      begin
        v_nsx := (v_dong ->> 'ngay_san_xuat')::date;
      exception when others then
        raise exception 'Dòng % (%): ngày sản xuất không hợp lệ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end;
    end if;

    if coalesce(v_dong ->> 'han_dung', '') <> '' then
      begin
        v_han := (v_dong ->> 'han_dung')::date;
      exception when others then
        raise exception 'Dòng % (%): hạn dùng không hợp lệ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end;
    elsif v_mh.han_dung_ngay is not null then
      v_han := p_ngay_nhap + v_mh.han_dung_ngay;
    else
      raise exception 'Dòng % (%): chưa có hạn dùng, và mặt hàng chưa cài hạn mặc định', v_i, v_mh.ten
        using errcode = 'check_violation';
    end if;

    insert into kho_phieu_nhap_dong
      (phieu_nhap_id, chi_nhanh_id, thu_tu, mat_hang_id, so_goi, so_kg, don_gia_kg,
       so_lo_ncc, ngay_san_xuat, han_dung, truong_them, ngay_mo)
    values
      (p_phieu_id, p_chi_nhanh_id, v_i, v_mh.id, v_goi, v_kg, v_gia,
       nullif(btrim(v_dong ->> 'so_lo_ncc'), ''), v_nsx, v_han,
       coalesce(v_dong -> 'truong_them', '{}'::jsonb), v_mo);
  end loop;

  return v_i;
end;
$$;

-- =============================================================================
-- 5 · DUYỆT PHIẾU NHẬP — lô tảng mang ngày mổ, số tảng, ngày ủ xong (chép 0031)
-- =============================================================================
create or replace function kho_duyet_phieu_nhap(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn     kho_phieu_nhap;
  v_cd     kho_cai_dat;
  v_nv     nhan_su;
  v_dong   kho_phieu_nhap_dong;
  v_ids    uuid[];
  v_kg     numeric[];
  v_hang   numeric[];
  v_cp     bigint[];
  v_vat    bigint[];
  v_tong_hang bigint;
  v_lo     uuid;
  v_i      int := 0;
  v_han_tt date;
  v_thieu_tt  int;
  v_thieu_ten text;
  v_mh     kho_mat_hang;
  v_so_tang int;
  v_u_xong date;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'duyet_nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được duyệt phiếu'
      using errcode = 'insufficient_privilege';
  end if;

  -- Khóa theo đúng thứ tự: cài đặt chi nhánh trước, phiếu sau.
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_pn.chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;
  select * into v_pn from kho_phieu_nhap where id = p_id for update;

  if v_pn.trang_thai = 'da_duyet' then
    return 'Phiếu ' || v_pn.so_phieu || ' đã được duyệt trước đó.';
  end if;
  if v_pn.trang_thai <> 'cho_duyet' then
    raise exception 'Phiếu % chưa được gửi duyệt', v_pn.so_phieu using errcode = 'check_violation';
  end if;

  -- MỚI (0031): hàng mua phải có đơn giá ở MỌI dòng. Trước đây bỏ trống đơn
  -- giá vẫn duyệt được, và lô sinh ra có giá vốn 0 đồng — sai cả báo cáo lẫn
  -- công nợ. Câu lỗi chỉ nêu dòng và tên món, không nêu số tiền nào.
  if v_pn.loai = 'mua' then
    select d.thu_tu, m.ten into v_thieu_tt, v_thieu_ten
    from kho_phieu_nhap_dong d
    join kho_mat_hang m on m.id = d.mat_hang_id
    where d.phieu_nhap_id = p_id and d.don_gia_kg <= 0
    order by d.thu_tu
    limit 1;
    if found then
      raise exception 'Dòng % (%): chưa có đơn giá — điền giá rồi duyệt', v_thieu_tt, v_thieu_ten
        using errcode = 'check_violation';
    end if;
  end if;

  -- MỚI (0046): món theo dõi theo tảng phải mỗi dòng một tảng, có ngày mổ —
  -- phiếu tạo từ đơn đặt hàng chưa được thủ kho cân từng tảng thì chưa duyệt.
  if v_pn.loai = 'mua' then
    select d.thu_tu, m.ten into v_thieu_tt, v_thieu_ten
    from kho_phieu_nhap_dong d
    join kho_mat_hang m on m.id = d.mat_hang_id
    where d.phieu_nhap_id = p_id and m.theo_tang and (d.so_goi <> 1 or d.ngay_mo is null)
    order by d.thu_tu
    limit 1;
    if found then
      raise exception 'Dòng % (%): món theo dõi theo tảng — mỗi tảng một dòng, có ngày mổ. Sửa phiếu nhận hàng rồi duyệt', v_thieu_tt, v_thieu_ten
        using errcode = 'check_violation';
    end if;
  end if;

  v_nv := nhan_su_hien_tai();
  if not v_cd.cho_tu_duyet
     and v_nv.id is not null
     and v_nv.id in (v_pn.nguoi_tao, v_pn.nguoi_gui) then
    raise exception 'Cài đặt không cho tự duyệt phiếu do chính mình lập — nhờ quản lý khác duyệt'
      using errcode = 'insufficient_privilege';
  end if;

  select array_agg(d.id order by d.thu_tu),
         array_agg(d.so_kg order by d.thu_tu),
         array_agg(d.thanh_tien::numeric order by d.thu_tu),
         coalesce(sum(d.thanh_tien), 0)
    into v_ids, v_kg, v_hang, v_tong_hang
  from kho_phieu_nhap_dong d where d.phieu_nhap_id = p_id;

  if v_ids is null then
    raise exception 'Phiếu chưa có dòng hàng nào' using errcode = 'check_violation';
  end if;

  -- Giá vốn nhập kho = tiền hàng + chi phí khác (chia theo kg) + thuế (chia
  -- theo tiền hàng) — mỗi khoản chỉ tính khi cài đặt bật.
  v_cp  := kho_chia_so_du_lon_nhat(
             case when v_cd.chi_phi_vao_gia_von then v_pn.chi_phi_khac else 0 end, v_kg);
  v_vat := kho_chia_so_du_lon_nhat(
             case when v_cd.vat_vao_gia_von then v_pn.tien_thue else 0 end,
             case when v_tong_hang > 0 then v_hang else v_kg end);

  for v_dong in
    select * from kho_phieu_nhap_dong where phieu_nhap_id = p_id order by thu_tu
  loop
    v_i := v_i + 1;

    -- MỚI (0046): tảng của món theo dõi theo tảng có số tảng tăng dần của chi
    -- nhánh, và ngày ủ xong tra theo bảng ủ của món.
    select * into v_mh from kho_mat_hang where id = v_dong.mat_hang_id;
    v_so_tang := case when v_mh.theo_tang and v_dong.so_goi <= 1
                      then kho_sinh_so_tang(v_pn.chi_nhanh_id) end;
    v_u_xong := case when v_dong.ngay_mo is not null
                     then v_pn.ngay_nhap + kho_so_ngay_u(v_dong.mat_hang_id, v_pn.ngay_nhap - v_dong.ngay_mo) end;

    insert into kho_lo
      (chi_nhanh_id, ma_lo, mat_hang_id, nguon, phieu_nhap_dong_id,
       ngay_dong_goi, ngay_san_xuat, han_dung, so_lo_ncc, truong_them,
       ngay_mo, ngay_u_xong, so_tang)
    values
      (v_pn.chi_nhanh_id, kho_sinh_so(v_pn.chi_nhanh_id, 'L'), v_dong.mat_hang_id,
       case when v_pn.loai = 'ton_dau' then 'ton_dau' else 'nhap' end, v_dong.id,
       v_pn.ngay_nhap, v_dong.ngay_san_xuat, v_dong.han_dung, v_dong.so_lo_ncc,
       v_dong.truong_them, v_dong.ngay_mo, v_u_xong, v_so_tang)
    returning id into v_lo;

    insert into kho_lo_gia (lo_id, chi_nhanh_id, gia_tri, so_kg_goc)
    values (v_lo, v_pn.chi_nhanh_id,
            v_dong.thanh_tien + v_cp[v_i] + v_vat[v_i], v_dong.so_kg);

    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
    values
      (v_pn.chi_nhanh_id, v_lo, v_pn.vi_tri_id, v_dong.mat_hang_id, 'nhap',
       v_dong.so_kg, v_dong.so_goi, 'phieu_nhap', v_pn.id, v_nv.id, v_pn.ngay_nhap);

    update kho_phieu_nhap_dong set lo_id = v_lo where id = v_dong.id;
  end loop;

  if v_pn.loai = 'mua' and v_pn.han_thanh_toan is null then
    select coalesce(v_pn.ngay_hoa_don, v_pn.ngay_nhap) + ncc.so_ngay_no into v_han_tt
    from kho_nha_cung_cap ncc where ncc.id = v_pn.nha_cung_cap_id;
  else
    v_han_tt := v_pn.han_thanh_toan;
  end if;

  update kho_phieu_nhap set
    trang_thai     = 'da_duyet',
    nguoi_duyet    = v_nv.id,
    duyet_luc      = now(),
    han_thanh_toan = v_han_tt,
    phien_ban      = phien_ban + 1
  where id = p_id;

  return 'Đã duyệt phiếu ' || v_pn.so_phieu || ': ' || v_i || ' lô hàng đã vào kho.';
end;
$$;

comment on function kho_duyet_phieu_nhap is
  'Duyệt phiếu nhập (quyền duyet_nhap — chủ, quản lý, kế toán): mỗi dòng thành một lô, có giá vốn nhập kho (cộng chi phí và thuế theo cài đặt, chia không lệch một đồng), và một dòng sổ kho. Phiếu mua phải có đơn giá ở mọi dòng (0031). Món theo dõi theo tảng: mỗi dòng một tảng có ngày mổ; lô mang số tảng và ngày ủ xong (0046). Chỉ lúc này tồn mới cộng.';


-- =============================================================================
-- 5b · ĐỌC PHIẾU NHẬN HÀNG — thêm theo_tang, ngay_mo, so_tang (chép 0039)
-- =============================================================================
create or replace function kho_doc_phieu_nhap_kg(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pn kho_phieu_nhap;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  -- 0035: phiếu nợ đầu kỳ coi như không có.
  if not found or v_pn.loai = 'no_dau' or not kho_duoc(v_pn.chi_nhanh_id, 'nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được xem'
      using errcode = 'insufficient_privilege';
  end if;

  return jsonb_build_object(
    'id',               v_pn.id,
    'so_phieu',         v_pn.so_phieu,
    'loai',             v_pn.loai,
    'trang_thai',       v_pn.trang_thai,
    'nha_cung_cap_id',  v_pn.nha_cung_cap_id,
    'ten_nha_cung_cap', (select n.ten from kho_nha_cung_cap n where n.id = v_pn.nha_cung_cap_id),
    'vi_tri_id',        v_pn.vi_tri_id,
    'ten_vi_tri',       (select v.ten from kho_vi_tri v where v.id = v_pn.vi_tri_id),
    'ngay_nhap',        v_pn.ngay_nhap,
    'so_hoa_don',       v_pn.so_hoa_don,
    'ngay_hoa_don',     v_pn.ngay_hoa_don,
    'ghi_chu',          v_pn.ghi_chu,
    'so_anh',           cardinality(v_pn.anh),
    'truong_them',      v_pn.truong_them,
    'ly_do',            v_pn.ly_do,
    'phien_ban',        v_pn.phien_ban,
    'nguoi_tao',        v_pn.nguoi_tao,
    'nguoi_gui',        v_pn.nguoi_gui,
    'gui_luc',          v_pn.gui_luc,
    'nguoi_duyet',      v_pn.nguoi_duyet,
    'duyet_luc',        v_pn.duyet_luc,
    'created_at',       v_pn.created_at,
    'dong', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id',            d.id,
               'thu_tu',        d.thu_tu,
               'mat_hang_id',   d.mat_hang_id,
               'ten_mat_hang',  m.ten,
               'dem_goi',       m.dem_goi,
               'don_vi_goi',    m.don_vi_goi,
               'so_goi',        d.so_goi,
               'so_kg',         d.so_kg,
               'so_lo_ncc',     d.so_lo_ncc,
               'ngay_san_xuat', d.ngay_san_xuat,
               'han_dung',      d.han_dung,
               'truong_them',   d.truong_them,
               'lo_id',         d.lo_id,
               -- 0046: món theo dõi theo tảng — mỗi dòng một tảng.
               'theo_tang',     m.theo_tang,
               'ngay_mo',       d.ngay_mo,
               'so_tang',       (select l.so_tang from kho_lo l where l.id = d.lo_id))
             order by d.thu_tu, d.id)
      from kho_phieu_nhap_dong d
      join kho_mat_hang m on m.id = d.mat_hang_id
      where d.phieu_nhap_id = p_id), '[]'::jsonb),
    -- 0039: đơn đặt hàng của phiếu. so_kg_da_nhan gồm cả phiếu này nếu phiếu
    -- đang chờ duyệt / đã duyệt; web tự trừ khi cần "còn lại trước phiếu này".
    'don_dat', (
      select jsonb_build_object(
               'id',                dd.id,
               'so_phieu',          dd.so_phieu,
               'trang_thai',        dd.trang_thai,
               'ngay_giao_du_kien', dd.ngay_giao_du_kien,
               'dong', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'mat_hang_id',   x.mat_hang_id,
                          'ten_mat_hang',  m.ten,
                          'so_kg_dat',     x.so_kg_dat,
                          'so_goi_dat',    x.so_goi_dat,
                          'so_kg_da_nhan', x.so_kg_da_nhan)
                        order by x.thu_tu)
                 from kho_don_dat_dong x
                 join kho_mat_hang m on m.id = x.mat_hang_id
                 where x.don_dat_id = dd.id), '[]'::jsonb))
      from kho_don_dat dd where dd.id = v_pn.don_dat_id));
end;
$$;




-- =============================================================================
-- 6 · VIEW TẢNG — tảng còn trong kho: đang ủ / sẵn sàng lóc
-- =============================================================================
create view kho_v_tang with (security_invoker = true) as
select l.chi_nhanh_id,
       l.id            as lo_id,
       l.ma_lo,
       l.so_tang,
       l.mat_hang_id,
       m.ma            as ma_hang,
       m.ten           as ten_hang,
       l.ngay_mo,
       l.ngay_dong_goi as ngay_nhan,
       l.ngay_u_xong,
       l.han_dung,
       (hom_nay_vn() - l.ngay_mo)     as tuoi_ngay,
       (l.ngay_u_xong - hom_nay_vn()) as con_ngay_u,
       case
         when l.ngay_u_xong is null then 'chua_co_bang_u'
         when l.ngay_u_xong > hom_nay_vn() then 'dang_u'
         else 'san_sang'
       end as tinh_trang_u,
       t.so_kg,
       t.so_goi,
       t.vi_tri
from kho_lo l
join kho_mat_hang m on m.id = l.mat_hang_id
join lateral (
  select sum(x.so_kg) as so_kg, sum(x.so_goi) as so_goi,
         string_agg(v.ten, ', ' order by v.ten) as vi_tri
  from kho_ton x join kho_vi_tri v on v.id = x.vi_tri_id
  where x.lo_id = l.id and (x.so_kg > 0 or x.so_goi > 0)
) t on t.so_kg is not null
where m.theo_tang and l.nguon in ('nhap', 'ton_dau');

comment on view kho_v_tang is
  'Tảng (lô của món theo dõi theo tảng) còn tồn: số tảng, ngày mổ, tuổi thịt, ngày ủ xong, tình trạng (dang_u / san_sang / chua_co_bang_u). Không có tiền (0046).';


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (bọc kiểm pg_roles như 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_sinh_so_tang(uuid) from authenticated';
    execute 'revoke execute on function kho_so_ngay_u(uuid, int) from authenticated';
    execute 'revoke execute on function kho_ghi_dong_phieu_nhap(uuid, uuid, date, jsonb) from authenticated';
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
