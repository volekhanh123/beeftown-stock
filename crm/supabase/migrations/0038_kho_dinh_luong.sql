-- =============================================================================
-- BEEFTOWN KHO — 0038 · ĐỊNH LƯỢNG MÓN, ĐỐI CHIẾU ĐỊNH MỨC (GĐ7b)
-- =============================================================================
-- Chủ nhà hàng đã chốt: "định lượng món = ĐỐI CHIẾU định mức". Bếp VẪN nhận
-- thịt bằng phiếu Xuất bếp; bếp KHÔNG là vị trí tồn; kho KHÔNG tự trừ theo
-- định lượng. Định lượng chỉ để so: bếp đã nhận bao nhiêu kg, so với số kg
-- "lẽ ra phải dùng" = số suất bán trên iPOS × gram mỗi suất.
--
-- BẢNG
--   kho_mon        món bán (theo CHI NHÁNH — mỗi chi nhánh một máy iPOS, mã món
--                  iPOS riêng, như kho_ipos_ma_hang 0037). ma_ipos tùy chọn;
--                  ten_khong_dau tự sinh (kho_khong_dau) để dán Excel khớp tên.
--   kho_dinh_luong gram một mặt hàng trong MỘT suất của món (unique món + mặt hàng).
--   Không có cột tiền: thủ kho, NV quầy đọc được.
--
-- SỐ SUẤT BÁN LẤY TỪ ĐÂU (kho_dinh_muc_ban)
--   Dòng hóa đơn iPOS (kho_ipos_dong, 0037) có ma_ipos = kho_mon.ma_ipos, cùng
--   chi nhánh, ngày bán giờ VN trong kỳ; bỏ HĐ hủy và dòng da_huy (dòng bị bỏ
--   khỏi HĐ sửa). Số suất = so_goi (số lượng nguyên), số lẻ thì so_kg, thiếu cả
--   hai = 1.
--   Món ăn KHÔNG phải hàng kho, nên ở 0037 mã món ăn được ghép kiểu 'bo_qua'
--   ("không phải hàng kho") — dòng bán thành trạng thái bo_qua; chưa ghép thì
--   chua_khop / cho. Các trạng thái đó đều được đếm.
--   KHÔNG đếm dòng da_ghi: dòng đó là hàng bán thẳng từ kho (ghép kiểu 'mon' /
--   'goi_can' ở 0037) và đã trừ kho ở quầy — bếp không nhận nó bằng Xuất bếp.
--   Cùng lý do, kho_luu_mon từ chối mã iPOS đang ghép kiểu 'mon' / 'goi_can', và
--   "Lấy món từ iPOS" (kho_mon_tu_ipos) lấy mã ghép kiểu 'bo_qua' + mã bán mà
--   chưa ghép, KHÔNG lấy kiểu 'mon' (đó là một mặt hàng bán nguyên, không phải
--   món bếp nấu).
--
-- KG BẾP ĐÃ NHẬN (kho_dinh_muc_tinh)
--   Mọi dòng sổ loai 'xuat_bep' trong kỳ: phiếu Xuất bếp (0023/0032, chứng từ
--   phieu_xuat) VÀ phần "chuyển bếp" khi chốt pha lóc (0022/0033, chứng từ
--   phien_pha, cùng loai xuat_bep). Dòng dao_nguoc của chúng (mở lại phiên pha)
--   trừ lại. Ngày = ngày sổ.
--
-- HÀM
--   kho_luu_mon, kho_luu_dinh_luong, kho_nhap_dinh_luong,
--   kho_mon_tu_ipos                                        [danh_muc]
--   kho_bao_cao_dinh_muc (definer)                         [xem; tien_chenh chỉ xem_gia]
--   Nội bộ: kho_khong_dau, kho_dinh_muc_ban, kho_dinh_muc_tinh.
--
-- SỰ KIỆN (thay thân kho_su_kien / kho_dem_viec, cùng chữ ký, chép 0037):
--   dinh_muc_lech  nhac_nho  quản lý, chủ (duyet): 7 ngày gần nhất (tính cả hôm
--                            nay), mặt hàng có kg lẽ ra dùng > 0 mà |lệch| vượt
--                            kho_cai_dat.nguong_dinh_muc_pt (0030). Chưa có bán
--                            món từ iPOS → không báo. Mỗi mặt hàng một dòng.
--   Số đỏ mới: dinh_muc_lech (số mặt hàng lệch).
-- =============================================================================


-- =============================================================================
-- 1 · BỎ DẤU — "Phở bò tái" → "pho bo tai" (khớp tên khi dán Excel)
-- =============================================================================
-- Giống boDau() của web (lib/kho/chung.ts): tách dấu (NFD), bỏ dấu, đ → d; thêm:
-- chữ thường, gộp khoảng trắng. Nhận cả chữ dựng sẵn lẫn chữ tổ hợp (Excel Mac).
create or replace function kho_khong_dau(p text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(btrim(regexp_replace(lower(translate(
           regexp_replace(normalize(coalesce(p, ''), NFD), '[̀-ͯ]', '', 'g'),
           'đĐ', 'dd')), '\s+', ' ', 'g')), '')
$$;

comment on function kho_khong_dau is
  'NỘI BỘ (0038). Bỏ dấu tiếng Việt, chữ thường, gộp khoảng trắng — khóa khớp tên món / mặt hàng khi dán Excel.';


-- =============================================================================
-- 2 · BẢNG
-- =============================================================================
create table kho_mon (
  id            uuid primary key default gen_random_uuid(),
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete cascade,
  ma_ipos       text,
  ten           text not null,
  ten_khong_dau text generated always as (kho_khong_dau(ten)) stored,
  dang_ban      boolean not null default true,
  nguoi_sua     uuid references nhan_su(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint kho_mon_ten_hop_le check (btrim(ten) <> '' and char_length(ten) <= 120),
  constraint kho_mon_ma_ipos_hop_le check (ma_ipos is null or (btrim(ma_ipos) = ma_ipos and ma_ipos <> ''
                                                              and char_length(ma_ipos) <= 100))
);

create unique index kho_mon_ma_ipos_idx on kho_mon(chi_nhanh_id, ma_ipos) where ma_ipos is not null;
-- Hai món cùng tên không dấu thì dán Excel không biết món nào → không cho.
create unique index kho_mon_ten_idx on kho_mon(chi_nhanh_id, ten_khong_dau);

create trigger kho_mon_updated_at
  before update on kho_mon
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_mon is
  'Món bán (0038), theo chi nhánh. ma_ipos = mã món trên iPOS (để đếm số suất bán); trống = chưa nối iPOS. dang_ban = false: ẩn khỏi danh sách (món bỏ, hoặc món không dùng thịt). Ghi qua kho_luu_mon / kho_nhap_dinh_luong / kho_mon_tu_ipos.';
comment on column kho_mon.ten_khong_dau is 'Tên bỏ dấu, chữ thường (kho_khong_dau) — khóa khớp khi dán Excel, duy nhất trong chi nhánh.';

create table kho_dinh_luong (
  id           uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete cascade,
  mon_id       uuid not null references kho_mon(id) on delete cascade,
  mat_hang_id  uuid not null references kho_mat_hang(id) on delete restrict,
  gram         numeric(10,2) not null,
  nguoi_sua    uuid references nhan_su(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint kho_dinh_luong_duy_nhat unique (mon_id, mat_hang_id),
  constraint kho_dinh_luong_gram_hop_le check (gram > 0 and gram <= 10000)
);

create index kho_dinh_luong_mh_idx on kho_dinh_luong(chi_nhanh_id, mat_hang_id);

create trigger kho_dinh_luong_updated_at
  before update on kho_dinh_luong
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_dinh_luong is
  'Định lượng (0038): gram một mặt hàng trong MỘT suất của món. Chỉ để đối chiếu với Xuất bếp (kho_bao_cao_dinh_muc) — không trừ kho.';

alter table kho_mon        enable row level security;
alter table kho_dinh_luong enable row level security;

-- Không tiền: mọi vai xem kho đọc được. Ghi CHỈ qua hàm.
create policy kho_mon_doc on kho_mon
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
create policy kho_dinh_luong_doc on kho_dinh_luong
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));


-- =============================================================================
-- 3 · MÓN, ĐỊNH LƯỢNG  [danh_muc]
-- =============================================================================
-- p_id null = thêm món. Trả dòng món (jsonb).
create or replace function kho_luu_mon(p_chi_nhanh_id uuid, p_id uuid, p_ten text, p_ma_ipos text, p_dang_ban boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ten  text := regexp_replace(btrim(coalesce(p_ten, '')), '\s+', ' ', 'g');
  v_ma   text := nullif(btrim(coalesce(p_ma_ipos, '')), '');
  v_m    kho_mon;
  v_trung kho_mon;
  v_mp   kho_ipos_ma_hang;
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không sửa được danh sách món' using errcode = 'insufficient_privilege';
  end if;
  if v_ten = '' then
    raise exception 'Nhập tên món' using errcode = 'check_violation';
  end if;
  if char_length(v_ten) > 120 then
    raise exception 'Tên món dài quá (tối đa 120 chữ)' using errcode = 'check_violation';
  end if;
  if v_ma is not null and char_length(v_ma) > 100 then
    raise exception 'Mã iPOS dài quá' using errcode = 'check_violation';
  end if;
  if p_id is not null then
    select * into v_m from kho_mon where id = p_id and chi_nhanh_id = p_chi_nhanh_id for update;
    if not found then
      raise exception 'Không tìm thấy món này ở chi nhánh' using errcode = 'check_violation';
    end if;
  end if;

  if v_ma is not null then
    select * into v_mp from kho_ipos_ma_hang where chi_nhanh_id = p_chi_nhanh_id and ma_ipos = v_ma;
    if v_mp.kieu in ('mon', 'goi_can') then
      raise exception 'Mã iPOS % đang ghép với hàng bán thẳng từ quầy (đã trừ kho khi bán) — không làm định lượng cho mã này', v_ma
        using errcode = 'check_violation';
    end if;
    select * into v_trung from kho_mon
    where chi_nhanh_id = p_chi_nhanh_id and ma_ipos = v_ma and id is distinct from p_id;
    if found then
      raise exception 'Mã iPOS % đã dùng cho món "%"', v_ma, v_trung.ten using errcode = 'check_violation';
    end if;
  end if;
  select * into v_trung from kho_mon
  where chi_nhanh_id = p_chi_nhanh_id and ten_khong_dau = kho_khong_dau(v_ten) and id is distinct from p_id;
  if found then
    raise exception 'Đã có món "%" — hai món không được trùng tên (kể cả khác dấu)', v_trung.ten
      using errcode = 'check_violation';
  end if;

  if p_id is null then
    insert into kho_mon (chi_nhanh_id, ma_ipos, ten, dang_ban, nguoi_sua)
    values (p_chi_nhanh_id, v_ma, v_ten, coalesce(p_dang_ban, true), (nhan_su_hien_tai()).id)
    returning * into v_m;
  else
    update kho_mon set ma_ipos = v_ma, ten = v_ten, dang_ban = coalesce(p_dang_ban, dang_ban),
                       nguoi_sua = (nhan_su_hien_tai()).id
    where id = p_id
    returning * into v_m;
  end if;
  return to_jsonb(v_m);
end;
$$;

comment on function kho_luu_mon is
  'Thêm (p_id null) / sửa một món (danh_muc): tên (không trùng kể cả khác dấu), mã iPOS (không trùng; không nhận mã đang ghép kiểu mon / goi_can — hàng bán thẳng từ quầy), dang_ban. Trả dòng món.';

-- p_dong: [{mat_hang_id, gram}] — THAY TOÀN BỘ định lượng của món. Mảng rỗng = xóa hết.
create or replace function kho_luu_dinh_luong(p_mon_id uuid, p_dong jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_m   kho_mon;
  v_e   jsonb;
  v_i   int := 0;
  v_k   text;
  v_mh  kho_mat_hang;
  v_g   numeric;
  v_da  uuid[] := '{}';
  v_nv  uuid;
begin
  select * into v_m from kho_mon where id = p_mon_id;
  if not found or not kho_duoc(v_m.chi_nhanh_id, 'danh_muc') then
    raise exception 'Không tìm thấy món, hoặc tài khoản không sửa được định lượng' using errcode = 'insufficient_privilege';
  end if;
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' then
    raise exception 'Danh sách định lượng không hợp lệ' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_dong) > 100 then
    raise exception 'Một món tối đa 100 mặt hàng' using errcode = 'check_violation';
  end if;
  select * into v_m from kho_mon where id = p_mon_id for update;

  for v_e in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_e) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_k in select jsonb_object_keys(v_e) loop
      if v_k not in ('mat_hang_id', 'gram') then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_k using errcode = 'check_violation';
      end if;
    end loop;
    select * into v_mh from kho_mat_hang where id = nullif(v_e ->> 'mat_hang_id', '')::uuid;
    if not found then
      raise exception 'Dòng %: chọn mặt hàng', v_i using errcode = 'check_violation';
    end if;
    if v_mh.id = any (v_da) then
      raise exception 'Dòng %: "%" có hai lần — gộp thành một dòng', v_i, v_mh.ten using errcode = 'check_violation';
    end if;
    v_da := v_da || v_mh.id;
    v_g := case when jsonb_typeof(v_e -> 'gram') = 'number' then (v_e ->> 'gram')::numeric end;
    if v_g is null or v_g <= 0 or v_g > 10000 or v_g <> round(v_g, 2) then
      raise exception 'Dòng % (%): gram phải lớn hơn 0 và không quá 10.000', v_i, v_mh.ten using errcode = 'check_violation';
    end if;
  end loop;

  v_nv := (nhan_su_hien_tai()).id;
  delete from kho_dinh_luong where mon_id = p_mon_id;
  insert into kho_dinh_luong (chi_nhanh_id, mon_id, mat_hang_id, gram, nguoi_sua)
  select v_m.chi_nhanh_id, p_mon_id, (x ->> 'mat_hang_id')::uuid, (x ->> 'gram')::numeric, v_nv
  from jsonb_array_elements(p_dong) x;
  update kho_mon set nguoi_sua = v_nv where id = p_mon_id;

  return jsonb_build_object('mon_id', p_mon_id, 'so_dong', v_i);
end;
$$;

comment on function kho_luu_dinh_luong is
  'Lưu định lượng một món (danh_muc): p_dong [{mat_hang_id, gram}] THAY TOÀN BỘ dòng cũ; mảng rỗng = xóa hết. gram > 0, ≤ 10.000, tối đa 2 số lẻ. Trả {mon_id, so_dong}.';


-- =============================================================================
-- 4 · LẤY MÓN TỪ iPOS  [danh_muc]
-- =============================================================================
-- Nguồn: (1) mã ghép kiểu 'bo_qua' ("không phải hàng kho" — món ăn, đồ uống);
-- (2) mã có trong dòng bán iPOS mà chưa ghép, không phải nhãn cân (không có mã
-- vạch / mã cân). Bỏ mã ghép kiểu mon / goi_can (hàng bán thẳng từ quầy) và mã
-- đã có món. Tên = tên iPOS mới nhất (thiếu thì chính mã). Món cùng tên không
-- dấu mà chưa có mã iPOS → gắn mã vào món đó; cùng tên mà đã có mã khác → tên
-- thêm "(mã)". Chạy lại không tạo trùng.
create or replace function kho_mon_tu_ipos(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_r     record;
  v_m     kho_mon;
  v_ten   text;
  v_nv    uuid;
  v_tao   int := 0;
  v_ghep  int := 0;
  v_ds    jsonb := '[]';
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không sửa được danh sách món' using errcode = 'insufficient_privilege';
  end if;
  v_nv := (nhan_su_hien_tai()).id;
  -- Hai người bấm cùng lúc: xếp hàng theo chi nhánh.
  perform pg_advisory_xact_lock(hashtext('kho_mon_tu_ipos:' || p_chi_nhanh_id::text));

  for v_r in
    with ma as (
      select m.ma_ipos, m.ten_ipos, 0 as uu_tien
      from kho_ipos_ma_hang m
      where m.chi_nhanh_id = p_chi_nhanh_id and m.kieu = 'bo_qua'
      union all
      select d.ma_ipos, d.ten_ipos, 1
      from kho_ipos_dong d
      where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos is not null
        and d.ma_vach is null and d.ma_can is null and d.trang_thai <> 'da_ghi'
        and not exists (select 1 from kho_ipos_ma_hang m
                        where m.chi_nhanh_id = p_chi_nhanh_id and m.ma_ipos = d.ma_ipos)
    )
    select x.ma_ipos,
           coalesce((select d.ten_ipos from kho_ipos_dong d
                     where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = x.ma_ipos and d.ten_ipos is not null
                     order by d.thoi_diem_ban desc, d.created_at desc limit 1),
                    max(x.ten_ipos), x.ma_ipos) as ten
    from ma x
    where not exists (select 1 from kho_mon k where k.chi_nhanh_id = p_chi_nhanh_id and k.ma_ipos = x.ma_ipos)
      and char_length(x.ma_ipos) <= 100
    group by x.ma_ipos
    order by 2, 1
  loop
    v_ten := left(regexp_replace(btrim(v_r.ten), '\s+', ' ', 'g'), 120);
    select * into v_m from kho_mon where chi_nhanh_id = p_chi_nhanh_id and ten_khong_dau = kho_khong_dau(v_ten);
    if found and v_m.ma_ipos is null then
      update kho_mon set ma_ipos = v_r.ma_ipos, nguoi_sua = v_nv where id = v_m.id returning * into v_m;
      v_ghep := v_ghep + 1;
    else
      if found then
        v_ten := left(v_ten, 100) || ' (' || left(v_r.ma_ipos, 17) || ')';
      end if;
      insert into kho_mon (chi_nhanh_id, ma_ipos, ten, nguoi_sua)
      values (p_chi_nhanh_id, v_r.ma_ipos, v_ten, v_nv)
      on conflict do nothing
      returning * into v_m;
      if v_m.id is null then
        continue;
      end if;
      v_tao := v_tao + 1;
    end if;
    v_ds := v_ds || jsonb_build_object('id', v_m.id, 'ten', v_m.ten, 'ma_ipos', v_m.ma_ipos);
    v_m := null;
  end loop;

  return jsonb_build_object('tao_moi', v_tao, 'gan_ma', v_ghep, 'mon', v_ds);
end;
$$;

comment on function kho_mon_tu_ipos is
  'Lấy món từ iPOS (danh_muc): mã ghép kiểu bo_qua + mã bán chưa ghép (không phải nhãn cân) → món mới; cùng tên không dấu mà chưa có mã thì gắn mã. Không lấy mã kiểu mon / goi_can. Chạy lại không trùng. Trả {tao_moi, gan_ma, mon[{id, ten, ma_ipos}]}.';


-- =============================================================================
-- 5 · DÁN EXCEL ĐỊNH LƯỢNG  [danh_muc]
-- =============================================================================
-- Cột: Mã/Tên món | Mặt hàng (mã, mã cân hoặc tên) | Gram. Web tách bảng dán
-- thành p_dong = [{mon, mat_hang, gram, dong?}] (dong = số dòng trong ô dán, để
-- câu lỗi trùng chỗ người dùng thấy; thiếu thì 1, 2, …).
--   Món: mã iPOS trước (không phân biệt hoa thường), rồi tên không dấu; không có
--        → món MỚI (tao_mon_moi), tạo khi áp dụng.
--   Mặt hàng: mã (hoa thường như nhau), mã cân, rồi tên không dấu trong các mặt
--        hàng đang dùng; hai mặt hàng cùng tên → lỗi, bảo ghi mã.
--   Gram: số > 0, ≤ 10.000; nhận "150", "150,5", "150.5".
-- p_ap_dung = false: chỉ xem trước. true: còn dòng lỗi thì từ chối cả bảng; không
-- lỗi thì thêm / sửa gram (KHÔNG xóa mặt hàng không có trong bảng dán — bỏ một
-- mặt hàng khỏi món thì sửa ở màn món). Áp dụng lại cùng bảng: không đổi gì.
-- Mỗi dòng trả {stt, ok, loi, mon{id, ten, ma_ipos}, mat_hang{id, ma, ten},
-- gram, gram_cu, tao_mon_moi, thay_doi: them | sua | giu}.
create or replace function kho_nhap_dinh_luong(p_chi_nhanh_id uuid, p_dong jsonb, p_ap_dung boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_e      jsonb;
  v_i      int := 0;
  v_stt    int;
  v_mon_t  text;
  v_mh_t   text;
  v_g_t    text;
  v_g      numeric;
  v_loi    text;
  v_m      kho_mon;
  v_mh     kho_mat_hang;
  v_n      int;
  v_khoa   text;
  v_da     jsonb := '{}';
  v_cu     numeric;
  v_tt     text;
  v_kq     jsonb := '[]';
  v_so_loi int := 0;
  v_moi    jsonb := '{}';
  v_them   int := 0;
  v_sua    int := 0;
  v_giu    int := 0;
  v_nv     uuid;
  v_x      jsonb;
  v_id     uuid;
  v_tao    int := 0;
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không sửa được định lượng món' using errcode = 'insufficient_privilege';
  end if;
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' or jsonb_array_length(p_dong) = 0 then
    raise exception 'Chưa có dòng nào — dán bảng Món | Mặt hàng | Gram' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_dong) > 2000 then
    raise exception 'Tối đa 2.000 dòng một lần dán' using errcode = 'check_violation';
  end if;
  if p_ap_dung then
    perform pg_advisory_xact_lock(hashtext('kho_mon_tu_ipos:' || p_chi_nhanh_id::text));
  end if;

  for v_e in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    v_loi := null; v_m := null; v_mh := null; v_g := null; v_cu := null; v_tt := null;
    v_stt := v_i;
    if jsonb_typeof(v_e) <> 'object' then
      v_kq := v_kq || jsonb_build_object('stt', v_stt, 'ok', false, 'loi', 'Dòng ' || v_stt || ': không đọc được');
      v_so_loi := v_so_loi + 1;
      continue;
    end if;
    if (v_e ->> 'dong') ~ '^[0-9]{1,6}$' then
      v_stt := (v_e ->> 'dong')::int;
    end if;
    v_mon_t := regexp_replace(btrim(coalesce(v_e ->> 'mon', '')), '\s+', ' ', 'g');
    v_mh_t  := btrim(coalesce(v_e ->> 'mat_hang', ''));
    v_g_t   := replace(btrim(coalesce(v_e ->> 'gram', '')), ',', '.');

    -- ---- Món --------------------------------------------------------------
    if v_mon_t = '' then
      v_loi := 'thiếu tên hoặc mã món';
    elsif char_length(v_mon_t) > 120 then
      v_loi := 'tên món dài quá (tối đa 120 chữ)';
    else
      select * into v_m from kho_mon
      where chi_nhanh_id = p_chi_nhanh_id and ma_ipos is not null and lower(ma_ipos) = lower(v_mon_t)
      order by (ma_ipos = v_mon_t) desc limit 1;
      if v_m.id is null then
        select * into v_m from kho_mon
        where chi_nhanh_id = p_chi_nhanh_id and ten_khong_dau = kho_khong_dau(v_mon_t);
      end if;
    end if;

    -- ---- Mặt hàng ---------------------------------------------------------
    if v_loi is null then
      if v_mh_t = '' then
        v_loi := 'thiếu mặt hàng';
      else
        select * into v_mh from kho_mat_hang where ma = upper(v_mh_t);
        if v_mh.id is null and ltrim(v_mh_t, '0') ~ '^[1-9][0-9]{0,5}$' then
          select * into v_mh from kho_mat_hang where ma_can = ltrim(v_mh_t, '0') and dang_dung;
        end if;
        if v_mh.id is null then
          select count(*) into v_n from kho_mat_hang where dang_dung and kho_khong_dau(ten) = kho_khong_dau(v_mh_t);
          if v_n = 1 then
            select * into v_mh from kho_mat_hang where dang_dung and kho_khong_dau(ten) = kho_khong_dau(v_mh_t);
          elsif v_n > 1 then
            v_loi := 'có ' || v_n || ' mặt hàng tên "' || left(v_mh_t, 60) || '" — ghi mã mặt hàng';
          else
            v_loi := 'không tìm thấy mặt hàng "' || left(v_mh_t, 60) || '" — ghi đúng mã, mã cân hoặc tên';
          end if;
        end if;
      end if;
    end if;

    -- ---- Gram -------------------------------------------------------------
    if v_loi is null then
      if v_g_t !~ '^[0-9]{1,6}(\.[0-9]{1,2})?$' then
        v_loi := 'gram "' || left(coalesce(v_e ->> 'gram', ''), 20) || '" không phải số (ví dụ 150 hoặc 150,5)';
      else
        v_g := v_g_t::numeric;
        if v_g <= 0 or v_g > 10000 then
          v_loi := 'gram phải lớn hơn 0 và không quá 10.000';
        end if;
      end if;
    end if;

    -- ---- Trùng trong bảng dán -------------------------------------------------
    if v_loi is null then
      v_khoa := coalesce(v_m.id::text, 'moi:' || kho_khong_dau(v_mon_t)) || '|' || v_mh.id::text;
      if v_da ? v_khoa then
        v_loi := 'trùng với dòng ' || (v_da ->> v_khoa) || ' (cùng món, cùng mặt hàng)';
      else
        v_da := v_da || jsonb_build_object(v_khoa, v_stt);
      end if;
    end if;

    if v_loi is not null then
      v_so_loi := v_so_loi + 1;
      v_kq := v_kq || jsonb_build_object(
        'stt', v_stt, 'ok', false,
        'loi', 'Dòng ' || v_stt || case when v_mon_t <> '' then ' (' || left(v_mon_t, 60) || ')' else '' end || ': ' || v_loi,
        'mon', case when v_mon_t <> '' then jsonb_build_object('id', v_m.id, 'ten', coalesce(v_m.ten, v_mon_t), 'ma_ipos', v_m.ma_ipos) end,
        'mat_hang', case when v_mh.id is not null then jsonb_build_object('id', v_mh.id, 'ma', v_mh.ma, 'ten', v_mh.ten) end,
        'gram', v_g, 'tao_mon_moi', v_m.id is null and v_mon_t <> '');
      continue;
    end if;

    if v_m.id is not null then
      select gram into v_cu from kho_dinh_luong where mon_id = v_m.id and mat_hang_id = v_mh.id;
    end if;
    v_tt := case when v_cu is null then 'them' when v_cu = v_g then 'giu' else 'sua' end;
    if v_m.id is null then
      v_moi := v_moi || jsonb_build_object(kho_khong_dau(v_mon_t), v_mon_t);
    end if;
    v_kq := v_kq || jsonb_build_object(
      'stt', v_stt, 'ok', true, 'loi', null,
      'mon', jsonb_build_object('id', v_m.id, 'ten', coalesce(v_m.ten, v_mon_t), 'ma_ipos', v_m.ma_ipos),
      'mat_hang', jsonb_build_object('id', v_mh.id, 'ma', v_mh.ma, 'ten', v_mh.ten),
      'gram', v_g, 'gram_cu', v_cu, 'tao_mon_moi', v_m.id is null, 'thay_doi', v_tt);
  end loop;

  select count(*) filter (where (x -> 'ok')::boolean and x ->> 'thay_doi' = 'them'),
         count(*) filter (where (x -> 'ok')::boolean and x ->> 'thay_doi' = 'sua'),
         count(*) filter (where (x -> 'ok')::boolean and x ->> 'thay_doi' = 'giu')
    into v_them, v_sua, v_giu
  from jsonb_array_elements(v_kq) x;

  if p_ap_dung then
    if v_so_loi > 0 then
      raise exception 'Còn % dòng lỗi — sửa trong bảng dán rồi bấm Áp dụng lại. %', v_so_loi,
        (select string_agg(x ->> 'loi', '; ') from (
           select x from jsonb_array_elements(v_kq) x where not (x -> 'ok')::boolean limit 3) t)
        using errcode = 'check_violation';
    end if;
    v_nv := (nhan_su_hien_tai()).id;
    for v_x in select x from jsonb_array_elements(v_kq) x loop
      v_id := nullif(v_x -> 'mon' ->> 'id', '')::uuid;
      if v_id is null then
        select id into v_id from kho_mon
        where chi_nhanh_id = p_chi_nhanh_id and ten_khong_dau = kho_khong_dau(v_x -> 'mon' ->> 'ten');
        if v_id is null then
          insert into kho_mon (chi_nhanh_id, ten, nguoi_sua)
          values (p_chi_nhanh_id, v_moi ->> kho_khong_dau(v_x -> 'mon' ->> 'ten'), v_nv)
          returning id into v_id;
          v_tao := v_tao + 1;
        end if;
      end if;
      insert into kho_dinh_luong (chi_nhanh_id, mon_id, mat_hang_id, gram, nguoi_sua)
      values (p_chi_nhanh_id, v_id, (v_x -> 'mat_hang' ->> 'id')::uuid, (v_x ->> 'gram')::numeric, v_nv)
      on conflict (mon_id, mat_hang_id) do update set gram = excluded.gram, nguoi_sua = excluded.nguoi_sua
        where kho_dinh_luong.gram is distinct from excluded.gram;
    end loop;
  end if;

  return jsonb_build_object(
    'dong', v_kq, 'so_dong', v_i, 'so_loi', v_so_loi,
    'so_mon_moi', (select count(*) from jsonb_object_keys(v_moi)),
    'them', v_them, 'sua', v_sua, 'giu', v_giu,
    'da_ap_dung', coalesce(p_ap_dung, false), 'da_tao_mon', v_tao);
end;
$$;

comment on function kho_nhap_dinh_luong is
  'Dán Excel định lượng (danh_muc): p_dong [{mon, mat_hang, gram, dong?}]. Món khớp mã iPOS rồi tên không dấu (không có → món mới, tạo khi áp dụng); mặt hàng khớp mã, mã cân, rồi tên không dấu. p_ap_dung false = xem trước; true = còn lỗi thì từ chối cả bảng, không thì thêm / sửa gram (không xóa dòng khác), chạy lại không đổi gì. Trả {dong[{stt, ok, loi, mon, mat_hang, gram, gram_cu, tao_mon_moi, thay_doi}], so_dong, so_loi, so_mon_moi, them, sua, giu, da_ap_dung, da_tao_mon}.';


-- =============================================================================
-- 6 · ĐỐI CHIẾU ĐỊNH MỨC
-- =============================================================================
-- Số suất bán từng món trong kỳ (xem đầu file: dòng iPOS nào được đếm).
create or replace function kho_dinh_muc_ban(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (mon_id uuid, so_suat numeric)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, sum(coalesce(d.so_goi::numeric, d.so_kg, 1))
  from kho_mon m
  join kho_ipos_dong d on d.chi_nhanh_id = m.chi_nhanh_id and d.ma_ipos = m.ma_ipos
  join kho_ipos_hoa_don h on h.id = d.hoa_don_id
  where m.chi_nhanh_id = p_chi_nhanh_id and m.ma_ipos is not null
    and not h.da_huy and d.trang_thai not in ('da_huy', 'da_ghi')
    and d.thoi_diem_ban >= kho_luc_vn(p_tu, 0) and d.thoi_diem_ban < kho_luc_vn(p_den + 1, 0)
  group by m.id
  having sum(coalesce(d.so_goi::numeric, d.so_kg, 1)) <> 0
$$;

comment on function kho_dinh_muc_ban is
  'NỘI BỘ (0038). Số suất bán từng món trong kỳ (ngày giờ VN) từ dòng iPOS khớp kho_mon.ma_ipos: bỏ HĐ hủy, dòng da_huy, dòng da_ghi (hàng bán thẳng từ quầy, đã trừ kho).';

-- Theo mặt hàng: kg bếp nhận (xuất bếp + chuyển bếp khi pha, trừ đảo ngược),
-- kg lẽ ra dùng (suất × gram), số suất của các món dùng mặt hàng đó, giá vốn
-- trung bình của phần bếp nhận (đ/kg). Kỳ bếp không nhận mặt hàng đó (bếp dùng
-- thịt không qua phiếu — lệch âm) thì lấy giá vốn trung bình mọi lô của mặt
-- hàng ở chi nhánh, để "Tiền lệch" không trống đúng lúc cần nhất; chưa lô nào
-- có giá → null.
-- Có mặt: mặt hàng bếp nhận trong kỳ, hoặc có trong định lượng của chi nhánh.
create or replace function kho_dinh_muc_tinh(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (mat_hang_id uuid, kg_xuat_bep numeric, kg_ly_thuyet numeric, so_suat numeric, gia_von_tb_kg numeric)
language sql
stable
security definer
set search_path = public
as $$
  with bep as (
    select s.mat_hang_id,
           -sum(s.so_kg) as kg,
           -sum(s.so_kg * lg.gia_von_kg) filter (where lg.lo_id is not null) as gt,
           -sum(s.so_kg) filter (where lg.lo_id is not null) as kg_co_gia
    from kho_so_cai s
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_lo_gia lg on lg.lo_id = s.lo_id
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay between p_tu and p_den
      and coalesce(g.loai, s.loai) = 'xuat_bep'
    group by s.mat_hang_id
  ),
  lt as (
    select dl.mat_hang_id,
           coalesce(sum(b.so_suat * dl.gram), 0) / 1000 as kg,
           coalesce(sum(b.so_suat), 0) as so_suat
    from kho_dinh_luong dl
    left join kho_dinh_muc_ban(p_chi_nhanh_id, p_tu, p_den) b on b.mon_id = dl.mon_id
    where dl.chi_nhanh_id = p_chi_nhanh_id
    group by dl.mat_hang_id
  ),
  gia_lo as (
    select lo.mat_hang_id, sum(lg.gia_tri)::numeric / nullif(sum(lg.so_kg_goc), 0) as gia
    from kho_lo lo
    join kho_lo_gia lg on lg.lo_id = lo.id
    where lo.chi_nhanh_id = p_chi_nhanh_id and lo.mat_hang_id in (select mat_hang_id from lt)
    group by lo.mat_hang_id
  )
  select coalesce(b.mat_hang_id, l.mat_hang_id),
         round(coalesce(b.kg, 0), 3),
         round(coalesce(l.kg, 0), 3),
         coalesce(l.so_suat, 0),
         round(coalesce(case when b.kg_co_gia > 0 then b.gt / b.kg_co_gia end, gl.gia), 4)
  from bep b
  full join lt l on l.mat_hang_id = b.mat_hang_id
  left join gia_lo gl on gl.mat_hang_id = coalesce(b.mat_hang_id, l.mat_hang_id)
  where coalesce(b.kg, 0) <> 0 or l.mat_hang_id is not null
$$;

comment on function kho_dinh_muc_tinh is
  'NỘI BỘ (0038). Theo mặt hàng trong kỳ: kg_xuat_bep (sổ loai xuat_bep: phiếu Xuất bếp + chuyển bếp khi chốt pha lóc, trừ đảo ngược), kg_ly_thuyet (suất bán iPOS × gram / 1000), so_suat, gia_von_tb_kg (của phần bếp nhận; bếp không nhận thì TB mọi lô của mặt hàng — CÓ TIỀN, chỉ hàm gọi kiểm xem_gia mới được trả ra).';

-- Báo cáo đối chiếu định mức (xem). Tiền (tien_chenh) chỉ vai xem_gia, không thì null.
--   chenh_kg = kg_xuat_bep − kg_ly_thuyet (dương = bếp dùng nhiều hơn định lượng)
--   chenh_pt = chenh_kg / kg_ly_thuyet × 100 (null khi kg_ly_thuyet = 0)
--   vuot_nguong = |chenh_pt| > nguong_dinh_muc_pt và đã có bán
--   so_mon_chua_dinh_luong = số món có bán trong kỳ mà chưa có định lượng (cả bảng)
--   chua_co_ban = kỳ này chưa có suất bán nào khớp món (chưa nối iPOS / chưa có
--                 mã iPOS trên món) → kg lẽ ra dùng = 0, không đánh giá lệch.
create or replace function kho_bao_cao_dinh_muc(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  mat_hang_id uuid, ma text, ten text, loai text,
  kg_xuat_bep numeric, kg_ly_thuyet numeric, chenh_kg numeric, chenh_pt numeric,
  so_suat numeric, nguong_pt numeric, vuot_nguong boolean,
  so_mon_chua_dinh_luong int, chua_co_ban boolean,
  tien_chenh bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gia     boolean;
  v_nguong  numeric;
  v_chua_dl int;
  v_co_ban  boolean;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 366 then
    raise exception 'Khoảng ngày tối đa 1 năm' using errcode = 'check_violation';
  end if;
  v_gia := kho_duoc(p_chi_nhanh_id, 'xem_gia');
  select coalesce(c.nguong_dinh_muc_pt, 10) into v_nguong from kho_cai_dat c where c.chi_nhanh_id = p_chi_nhanh_id;
  v_nguong := coalesce(v_nguong, 10);

  select count(*) filter (where not exists (select 1 from kho_dinh_luong dl where dl.mon_id = b.mon_id)),
         count(*) > 0
    into v_chua_dl, v_co_ban
  from kho_dinh_muc_ban(p_chi_nhanh_id, p_tu, p_den) b;

  return query
    select t.mat_hang_id, m.ma, m.ten, m.loai,
           t.kg_xuat_bep, t.kg_ly_thuyet,
           t.kg_xuat_bep - t.kg_ly_thuyet,
           case when t.kg_ly_thuyet > 0
                then round((t.kg_xuat_bep - t.kg_ly_thuyet) / t.kg_ly_thuyet * 100, 1) end,
           t.so_suat, v_nguong,
           case when v_co_ban and t.kg_ly_thuyet > 0
                then abs(t.kg_xuat_bep - t.kg_ly_thuyet) / t.kg_ly_thuyet * 100 > v_nguong
                else false end,
           v_chua_dl, not v_co_ban,
           case when v_gia and t.gia_von_tb_kg is not null
                then round((t.kg_xuat_bep - t.kg_ly_thuyet) * t.gia_von_tb_kg)::bigint end
    from kho_dinh_muc_tinh(p_chi_nhanh_id, p_tu, p_den) t
    join kho_mat_hang m on m.id = t.mat_hang_id
    order by abs(t.kg_xuat_bep - t.kg_ly_thuyet) desc, m.loai, m.thu_tu, m.ten;
end;
$$;

comment on function kho_bao_cao_dinh_muc is
  'Đối chiếu định mức (xem; 0038): theo mặt hàng — kg bếp nhận (Xuất bếp + chuyển bếp khi pha) so với kg lẽ ra dùng (suất bán iPOS × gram), chenh_kg, chenh_pt, vuot_nguong (nguong_dinh_muc_pt), so_mon_chua_dinh_luong, chua_co_ban. tien_chenh (lệch × giá vốn TB phần bếp nhận; bếp không nhận thì TB các lô) chỉ vai xem_gia, không thì null. Không trừ kho.';


-- =============================================================================
-- 7 · SỰ KIỆN VÀ SỐ ĐỎ — thay THÂN (cùng chữ ký), chép 0037, thêm 0038
-- =============================================================================
--   dinh_muc_lech  nhac_nho  quản lý, chủ (duyet): 7 ngày gần nhất (hôm nay − 6
--                            → hôm nay), mặt hàng có kg lẽ ra dùng > 0 và
--                            |lệch| > nguong_dinh_muc_pt. Chưa có suất bán nào
--                            khớp món → không báo. Mỗi mặt hàng một dòng:
--                            ref_id = mặt hàng, ma / ten = mã / tên, so = lệch %
--                            (dương = bếp nhận nhiều hơn định lượng), phu = lệch
--                            kg (chữ số, dấu chấm). Mốc = 0 giờ hôm nay: còn
--                            lệch thì sáng hôm sau báo lại (chưa đọc).
-- Số đỏ mới: dinh_muc_lech (số mặt hàng lệch).
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

  -- ---- 0032 · Mang hàng ra quầy ---------------------------------------------
  -- Thủ kho (và quản lý): quầy có yêu cầu đang chờ.
  if kho_duoc(p_chi_nhanh_id, 'van_hanh') and not v_chi_quay then
    return query
      select 'yeu_cau_quay', 'van_hanh', y.id, y.vi_tri_id, y.so_phieu, v.ten, v.loai,
             (select count(*) from kho_yeu_cau_quay_dong d where d.yeu_cau_id = y.id)::numeric, y.created_at
      from kho_yeu_cau_quay y
      join kho_vi_tri v on v.id = y.vi_tri_id
      where y.chi_nhanh_id = p_chi_nhanh_id and y.trang_thai = 'cho';
  end if;

  -- NV quầy (và quản lý): hàng đang mang ra, chờ bấm nhận. Quá gio_nhac_chuyen
  -- giờ thì phu = 'qua_gio' (mức đỏ) và mốc dời tới lúc quá giờ — thành thông
  -- báo chưa đọc lần nữa. so = số gói.
  if v_chi_quay or kho_duoc(p_chi_nhanh_id, 'duyet') then
    return query
      select 'hang_dang_chuyen', 'van_hanh', x.id, x.vi_tri_den_id, x.so_phieu, v.ten,
             coalesce(case when x.created_at <= now() - make_interval(hours => v_cd.gio_nhac_chuyen)
                           then 'qua_gio' end, 'quay'),
             (select coalesce(sum(d.so_goi), 0) from kho_phieu_xuat_dong d where d.phieu_xuat_id = x.id)::numeric,
             case when x.created_at <= now() - make_interval(hours => v_cd.gio_nhac_chuyen)
                  then x.created_at + make_interval(hours => v_cd.gio_nhac_chuyen) else x.created_at end
      from kho_phieu_xuat x
      join kho_vi_tri v on v.id = x.vi_tri_den_id
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'chuyen' and x.trang_thai = 'dang_chuyen';
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
  -- 0031: phiếu nhập theo quyền duyet_nhap (có kế toán); hủy và kiểm kê vẫn duyet.
  if kho_duoc(p_chi_nhanh_id, 'duyet_nhap') then
    return query
      select 'cho_duyet_nhap', 'nhac_nho', p.id, p.nha_cung_cap_id, p.so_phieu, n.ten, null::text, null::numeric, coalesce(p.gui_luc, p.updated_at)
      from kho_phieu_nhap p
      left join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
      where p.chi_nhanh_id = p_chi_nhanh_id and p.trang_thai = 'cho_duyet';
  end if;

  if kho_duoc(p_chi_nhanh_id, 'duyet') then
    return query
      select 'cho_duyet_huy', 'nhac_nho', x.id, x.vi_tri_id, x.so_phieu, v.ten, v.loai, null::numeric, x.created_at
      from kho_phieu_xuat x
      join kho_vi_tri v on v.id = x.vi_tri_id
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'huy' and x.trang_thai = 'cho_duyet';

    -- 0032: quầy nhận thiếu — quản lý trả về kho hoặc ghi mất. so = số gói thiếu.
    return query
      select 'chuyen_nhan_thieu', 'nhac_nho', x.id, x.vi_tri_den_id, x.so_phieu, v.ten, v.loai,
             (select coalesce(sum(d.so_goi - coalesce(d.so_goi_nhan, 0)), 0) from kho_phieu_xuat_dong d
               where d.phieu_xuat_id = x.id)::numeric,
             coalesce(x.nhan_luc, x.updated_at)
      from kho_phieu_xuat x
      join kho_vi_tri v on v.id = x.vi_tri_den_id
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'chuyen' and x.trang_thai = 'nhan_thieu';

    return query
      select 'cho_duyet_kiem_ke', 'nhac_nho', k.id, k.vi_tri_id, k.so_phieu, v.ten, v.loai, null::numeric, coalesce(k.gui_luc, k.updated_at)
      from kho_kiem_ke k
      join kho_vi_tri v on v.id = k.vi_tri_id
      where k.chi_nhanh_id = p_chi_nhanh_id and k.trang_thai = 'cho_duyet';

    -- 0033: pha lóc thu hồi thấp hơn dự kiến quá ngưỡng — tới khi quản lý bấm
    -- "Đã xem". so = thu hồi %, phu = dự kiến % (chữ số, dấu chấm), ten = tên tảng.
    return query
      select 'thu_hoi_thap', 'nhac_nho', f.id, f.mat_hang_vao_id, f.so_phieu, m.ten, f.ty_le_du_kien::text,
             f.ty_le_thu_hoi::numeric, f.chot_luc
      from kho_phien_pha f
      join kho_mat_hang m on m.id = f.mat_hang_vao_id
      where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'da_chot'
        and f.thu_hoi_thap and f.da_xem_luc is null;
  end if;

  -- ---- 0037 · Bán hàng iPOS (quản lý, chủ) ----------------------------------
  -- ipos_cho_xu_ly: so = số dòng chưa khớp + thiếu hàng; phu = số chưa khớp.
  -- Mốc = dòng chờ mới nhất vào hộp thư (thử lại mỗi lượt không làm "chưa đọc" lại).
  if kho_duoc(p_chi_nhanh_id, 'duyet') then
    return query
      select 'ipos_cho_xu_ly', 'nhac_nho', null::uuid, null::uuid, null::text, null::text,
             (count(*) filter (where d.trang_thai = 'chua_khop'))::text, count(*)::numeric, max(d.created_at)
      from kho_ipos_dong d
      where d.chi_nhanh_id = p_chi_nhanh_id and d.trang_thai in ('chua_khop', 'thieu_hang')
      having count(*) > 0;

    -- ipos_mat_ket_noi: phu = 'loi' (lượt cuối lỗi) | 'cham' (> 30 phút trong giờ
    -- mở cửa); so = số phút từ lần đồng bộ tốt cuối.
    return query
      select 'ipos_mat_ket_noi', 'he_thong', null::uuid, null::uuid, null::text, null::text,
             coalesce(case when c.loi_tu_luc is not null then 'loi' end, 'cham'),
             round(extract(epoch from now() - coalesce(c.lan_ok_luc, c.bat_luc, c.updated_at)) / 60)::numeric,
             case when c.loi_tu_luc is not null then c.loi_tu_luc
                  else coalesce(c.lan_ok_luc, c.bat_luc, c.updated_at) + interval '30 minutes' end
      from kho_ipos_cau_hinh c
      where c.chi_nhanh_id = p_chi_nhanh_id and kho_ipos_mat_ket_noi(c);

    -- ---- 0038 · Định lượng: bếp nhận lệch định mức (7 ngày gần nhất) --------
    -- Chỉ tính khi chi nhánh có định lượng (không tốn công cho chi nhánh chưa dùng).
    if exists (select 1 from kho_dinh_luong dl where dl.chi_nhanh_id = p_chi_nhanh_id)
       and exists (select 1 from kho_dinh_muc_ban(p_chi_nhanh_id, v_hom_nay - 6, v_hom_nay)) then
      return query
        select 'dinh_muc_lech', 'nhac_nho', t.mat_hang_id, null::uuid, m.ma, m.ten,
               (t.kg_xuat_bep - t.kg_ly_thuyet)::text,
               round((t.kg_xuat_bep - t.kg_ly_thuyet) / t.kg_ly_thuyet * 100, 1),
               kho_luc_vn(v_hom_nay, 0)
        from kho_dinh_muc_tinh(p_chi_nhanh_id, v_hom_nay - 6, v_hom_nay) t
        join kho_mat_hang m on m.id = t.mat_hang_id
        where t.kg_ly_thuyet > 0
          and abs(t.kg_xuat_bep - t.kg_ly_thuyet) > t.kg_ly_thuyet * v_cd.nguong_dinh_muc_pt / 100;
    end if;
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
  'NỘI BỘ. 0037: thêm ipos_cho_xu_ly, ipos_mat_ket_noi. 0038: thêm dinh_muc_lech. Mọi sự kiện thông báo người đang đăng nhập được thấy ở một chi nhánh, suy ra từ chứng từ. Gọi qua kho_dem_viec / kho_thong_bao.';

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
  v_dinh_muc int;
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
                            and (v_xem_luc is null or e.luc > v_xem_luc)),
         count(*) filter (where e.khoa = 'dinh_muc_lech')
    into v_duoi_muc, v_chua_dem, v_chua_doc, v_dinh_muc
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

  -- 0032: mang hàng ra quầy.
  if kho_duoc(p_chi_nhanh_id, 'van_hanh') and not v_chi_quay then
    v := v || jsonb_build_object('yeu_cau_quay', (
      select count(*) from kho_yeu_cau_quay y
      where y.chi_nhanh_id = p_chi_nhanh_id and y.trang_thai = 'cho'));
  end if;
  if v_chi_quay or kho_duoc(p_chi_nhanh_id, 'duyet') then
    v := v || (
      select jsonb_build_object(
        'hang_dang_chuyen',    count(*),
        'hang_chuyen_qua_gio', count(*) filter (where x.created_at <= now() - make_interval(hours => v_cd.gio_nhac_chuyen)))
      from kho_phieu_xuat x
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'chuyen' and x.trang_thai = 'dang_chuyen');
  end if;

  if kho_duoc(p_chi_nhanh_id, 'pha_loc') then
    v := v || jsonb_build_object('pha_nhap', (
      select count(*) from kho_phien_pha f
      where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'nhap'));
  end if;

  -- 0031: phiếu nhập theo quyền duyet_nhap (kế toán cũng thấy số đỏ Duyệt).
  if kho_duoc(p_chi_nhanh_id, 'duyet_nhap') then
    v := v || jsonb_build_object(
      'duyet_nhap', (select count(*) from kho_phieu_nhap
                     where chi_nhanh_id = p_chi_nhanh_id and trang_thai = 'cho_duyet'));
  end if;

  if kho_duoc(p_chi_nhanh_id, 'duyet') then
    v := v || jsonb_build_object(
      'duyet_huy', (select count(*) from kho_phieu_xuat
                    where chi_nhanh_id = p_chi_nhanh_id and loai = 'huy' and trang_thai = 'cho_duyet'),
      'duyet_kiem_ke', (select count(*) from kho_kiem_ke
                        where chi_nhanh_id = p_chi_nhanh_id and trang_thai = 'cho_duyet'),
      'chuyen_nhan_thieu', (select count(*) from kho_phieu_xuat
                            where chi_nhanh_id = p_chi_nhanh_id and loai = 'chuyen' and trang_thai = 'nhan_thieu'),
      -- 0033
      'thu_hoi_thap', (select count(*) from kho_phien_pha
                       where chi_nhanh_id = p_chi_nhanh_id and trang_thai = 'da_chot'
                         and thu_hoi_thap and da_xem_luc is null),
      -- 0037
      'ipos_cho_xu_ly', (select count(*) from kho_ipos_dong
                         where chi_nhanh_id = p_chi_nhanh_id and trang_thai in ('chua_khop', 'thieu_hang')),
      -- 0038: số mặt hàng bếp nhận lệch định mức 7 ngày (đếm từ kho_su_kien ở trên)
      'dinh_muc_lech', v_dinh_muc);
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
  'Mọi số đỏ trên menu kho của người đang đăng nhập ở một chi nhánh, trong MỘT lần gọi. Khóa nào không có quyền thì vắng mặt. Chỉ đếm, không tiền. duyet_nhap theo quyền duyet_nhap (0031); yeu_cau_quay, hang_dang_chuyen, hang_chuyen_qua_gio, chuyen_nhan_thieu (0032); thu_hoi_thap (0033); ipos_cho_xu_ly (0037); dinh_muc_lech (0038).';



-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_khong_dau(text) from authenticated';
    execute 'revoke execute on function kho_dinh_muc_ban(uuid, date, date) from authenticated';
    execute 'revoke execute on function kho_dinh_muc_tinh(uuid, date, date) from authenticated';
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
