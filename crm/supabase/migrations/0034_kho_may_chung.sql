-- =============================================================================
-- BEEFTOWN KHO — 0034 · MÁY TÍNH BẢNG DÙNG CHUNG (ĐỔI NGƯỜI BẰNG PIN) · CHỦ TỰ TẠO TÀI KHOẢN
-- =============================================================================
-- Chủ nhà hàng đã chốt (GĐ5d):
--
--   · Quầy / bếp dùng chung 1–2 máy tính bảng. Đổi người bằng MÃ PIN, máy TỰ
--     KHÓA sau 5 phút không dùng. Việc ai làm phải ghi đúng người đó.
--   · Chủ tự tạo tài khoản nhân viên kho và tài khoản máy ngay trong app.
--
-- CÁCH LÀM — KHÔNG MỞ GÌ CHO anon, KHÔNG CÓ service_role
--
--   Mỗi máy có TÀI KHOẢN RIÊNG (dòng nhan_su vai may_chung, 0029). Máy chỉ làm
--   được việc của máy: liệt kê người đã gắn vào nó, kiểm PIN. Máy không đọc
--   được dữ liệu kho hay CRM nào (test-kho-quyen, test-kho-may-chung kiểm).
--
--   Mọi thao tác nghiệp vụ vẫn chạy bằng PHIÊN CỦA CHÍNH NGƯỜI ĐÓ: lần đầu
--   người đó đăng nhập đầy đủ trên máy và đặt PIN ("gắn vào máy"); Worker cất
--   refresh token của họ, mã hóa, trong cookie riêng. Nhập đúng PIN thì Worker
--   lấy lại token đó mà đổi phiên. Database không bao giờ thấy token.
--
--   PIN không bao giờ tới database: Worker gửi pin_bam = HMAC-SHA256(khóa bí
--   mật của Worker, may_id|nhan_su_id|pin) — lộ database cũng không dò được
--   PIN 4–6 số, vì thiếu khóa (web/src/lib/kho/may-chung-ma-hoa.ts).
--
--   Khóa khi sai PIN:
--     · 5 lần sai liên tiếp của một người → khóa NGƯỜI đó 15 phút.
--     · 15 lần sai trong 30 phút, hoặc 30 lần trong 24 giờ, trên một máy
--       (mọi người cộng lại) → khóa MÁY, tới khi quản lý mở. Mọi lần kiểm
--       ghi vào kho_may_nhat_ky.
--
-- QUYỀN MỚI may_chung (chỉ vai may_chung) trong kho_vai_duoc. Không policy
-- nào hỏi quyền này — nó chỉ để hàm của máy nhận ra "đây là một máy".
--
-- CHỦ TẠO TÀI KHOẢN: Worker gọi auth.signUp bằng khóa anon (email, mật khẩu
-- tạm), rồi gọi kho_them_nhan_su bằng phiên của CHỦ. Tài khoản tự đăng ký ở
-- ngoài vẫn không thấy gì: không có dòng nhan_su là không có quyền nào.
-- =============================================================================


-- =============================================================================
-- 1 · BẢNG TRA QUYỀN — thêm may_chung
-- =============================================================================
-- Chép nguyên văn 0031, thêm một dòng. web/src/lib/kho/chung.ts soi gương;
-- test-kho-quyen.mjs so từng dòng.
create or replace function kho_vai_duoc(p_viec text)
returns vai_tro[]
language sql
immutable
set search_path = public
as $$
  select (case p_viec
    when 'xem'         then array['chu_so_huu','quan_ly','thu_kho','nhan_vien_quay','ke_toan']
    when 'xem_gia'     then array['chu_so_huu','quan_ly','ke_toan']
    when 'nhap'        then array['chu_so_huu','quan_ly','thu_kho']
    when 'duyet'       then array['chu_so_huu','quan_ly']
    when 'duyet_nhap'  then array['chu_so_huu','quan_ly','ke_toan']
    when 'pha_loc'     then array['chu_so_huu','quan_ly','thu_kho']
    when 'van_hanh'    then array['chu_so_huu','quan_ly','thu_kho','nhan_vien_quay']
    when 'ke_toan'     then array['chu_so_huu','quan_ly','ke_toan']
    when 'danh_muc'    then array['chu_so_huu','quan_ly']
    when 'ncc'         then array['chu_so_huu','quan_ly','ke_toan']
    when 'cai_dat_goc' then array['chu_so_huu']
    -- 0034: tài khoản của máy tính bảng dùng chung. Chỉ gọi được hàm kho_may_*.
    when 'may_chung'   then array['may_chung']
    else array[]::text[]
  end)::vai_tro[];
$$;

comment on function kho_vai_duoc is
  'Bảng tra quyền kho: việc → danh sách vai. Nguồn sự thật duy nhất; lib/kho/chung.ts soi gương và test-kho-quyen.mjs so khớp. 0031: thủ kho không còn xem_gia; thêm duyet_nhap. 0034: thêm may_chung (chỉ vai may_chung).';


-- =============================================================================
-- 2 · BẢNG
-- =============================================================================
-- Một máy = một tài khoản may_chung. Đăng ký lại cùng tài khoản là cập nhật
-- chính dòng đó (unique nhan_su_id).
create table kho_may (
  id              uuid primary key default gen_random_uuid(),
  chi_nhanh_id    uuid not null references chi_nhanh(id) on delete restrict,
  nhan_su_id      uuid not null unique references nhan_su(id) on delete restrict,
  ten             text not null check (length(btrim(ten)) between 1 and 60),
  phut_khoa       smallint not null default 5 check (phut_khoa between 1 and 60),
  dang_dung       boolean not null default true,     -- false = quản lý đã tắt máy
  bi_khoa         boolean not null default false,    -- khóa vì sai PIN nhiều / quản lý khóa
  bi_khoa_luc     timestamptz,
  mo_khoa_luc     timestamptz,                       -- đếm sai PIN của máy tính từ mốc này
  nguoi_dang_dung uuid references nhan_su(id) on delete set null,
  dung_tu         timestamptz,
  nguoi_dang_ky   uuid references nhan_su(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger kho_may_updated_at
  before update on kho_may
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_may is
  'Máy tính bảng dùng chung ở quầy/bếp (GĐ5d). Mỗi máy một tài khoản vai may_chung. Không lưu token nào.';

-- Người đã gắn vào máy. KHÔNG có policy SELECT: không ai đọc thẳng được
-- pin_bam, kể cả chủ — chỉ đi qua hàm.
create table kho_may_nguoi (
  may_id         uuid not null references kho_may(id) on delete cascade,
  nhan_su_id     uuid not null references nhan_su(id) on delete cascade,
  pin_bam        text not null check (pin_bam ~ '^[0-9a-f]{64}$'),
  sai_lien_tiep  smallint not null default 0,
  khoa_den       timestamptz,
  gan_luc        timestamptz not null default now(),
  doi_pin_luc    timestamptz not null default now(),
  dung_lan_cuoi  timestamptz,
  primary key (may_id, nhan_su_id)
);

comment on table kho_may_nguoi is
  'Người đã gắn vào một máy dùng chung. pin_bam = HMAC-SHA256 do Worker tính (khóa KHO_MAY_KHOA), database không thấy PIN. Không có policy SELECT.';
comment on column kho_may_nguoi.pin_bam is
  'HMAC-SHA256(khóa dẫn xuất từ KHO_MAY_KHOA, may_id|nhan_su_id|pin), 64 ký tự hex thường.';

create table kho_may_nhat_ky (
  id           bigint generated always as identity primary key,
  may_id       uuid not null references kho_may(id) on delete cascade,
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  nhan_su_id   uuid references nhan_su(id) on delete set null,   -- người được nhắc tới
  boi          uuid references nhan_su(id) on delete set null,   -- ai làm (máy, người, quản lý)
  su_kien      text not null check (su_kien in (
                 'dang_ky', 'gan', 'doi_pin', 'pin_dung', 'pin_sai',
                 'khoa_nguoi', 'khoa_may', 'khoa_man', 'go',
                 'mo_khoa_nguoi', 'mo_khoa_may', 'tat')),
  ghi_chu      text,
  luc          timestamptz not null default now()
);

create index kho_may_nhat_ky_dem_idx on kho_may_nhat_ky (may_id, su_kien, luc);

comment on table kho_may_nhat_ky is
  'Nhật ký máy dùng chung: đăng ký, gắn, kiểm PIN đúng/sai, khóa, gỡ, tắt. pin_sai 30 phút gần nhất dùng để khóa máy.';

alter table kho_may         enable row level security;
alter table kho_may_nguoi   enable row level security;
alter table kho_may_nhat_ky enable row level security;

-- Quản lý chi nhánh xem được máy và nhật ký (không có bí mật nào ở đây).
-- Ghi: chỉ qua hàm.
create policy kho_may_doc on kho_may
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('duyet'))::uuid[]));
create policy kho_may_nhat_ky_doc on kho_may_nhat_ky
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('duyet'))::uuid[]));


-- =============================================================================
-- 3 · HÀM NỘI BỘ
-- =============================================================================
-- Máy của phiên đang gọi. Không phải tài khoản máy, máy chưa đăng ký hay đã
-- bị tắt → báo lỗi (mọi hàm "gọi bằng máy" dừng ở đây).
create or replace function kho_may_cua_phien()
returns kho_may
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ns nhan_su;
  v_may kho_may;
begin
  v_ns := nhan_su_hien_tai();
  if v_ns.id is null or not kho_co_quyen('may_chung') then
    raise exception 'Chỉ tài khoản máy dùng chung mới làm được việc này'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_may from kho_may where nhan_su_id = v_ns.id;
  if not found then
    raise exception 'Máy này chưa được đăng ký — nhờ quản lý đăng ký máy'
      using errcode = 'insufficient_privilege';
  end if;
  if not v_may.dang_dung then
    raise exception 'Máy này đã bị tắt — nhờ quản lý đăng ký lại'
      using errcode = 'insufficient_privilege';
  end if;
  return v_may;
end;
$$;

comment on function kho_may_cua_phien is
  'NỘI BỘ. Dòng kho_may của tài khoản máy đang gọi; báo lỗi nếu không phải máy, chưa đăng ký hay đã tắt.';

-- Người này còn được dùng máy của chi nhánh này không: đang làm, có quyền xem
-- kho ở đúng chi nhánh máy (chủ: mọi chi nhánh).
create or replace function kho_may_nguoi_hop_le(p_nhan_su_id uuid, p_chi_nhanh_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from nhan_su ns
    where ns.id = p_nhan_su_id
      and ns.dang_lam
      and ns.vai_tro = any(kho_vai_duoc('xem'))
      and (ns.vai_tro = 'chu_so_huu' or ns.chi_nhanh_id = p_chi_nhanh_id)
  );
$$;

comment on function kho_may_nguoi_hop_le is
  'NỘI BỘ. Nhân sự còn làm, có quyền xem kho ở chi nhánh của máy (chủ: mọi chi nhánh).';

create or replace function kho_may_ghi(p_may kho_may, p_su_kien text, p_nhan_su_id uuid, p_ghi_chu text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into kho_may_nhat_ky (may_id, chi_nhanh_id, nhan_su_id, boi, su_kien, ghi_chu)
  values (p_may.id, p_may.chi_nhanh_id, p_nhan_su_id, (nhan_su_hien_tai()).id, p_su_kien, p_ghi_chu);
$$;

comment on function kho_may_ghi is 'NỘI BỘ. Ghi một dòng kho_may_nhat_ky, boi = người đang gọi.';

create or replace function kho_may_kiem_pin_bam(p_pin_bam text)
returns text
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_pin_bam is null or p_pin_bam !~ '^[0-9a-f]{64}$' then
    raise exception 'Mã PIN gửi lên không đúng dạng' using errcode = 'check_violation';
  end if;
  return p_pin_bam;
end;
$$;

comment on function kho_may_kiem_pin_bam is 'NỘI BỘ. pin_bam phải là 64 ký tự hex thường (HMAC-SHA256 do Worker tính).';


-- =============================================================================
-- 4 · ĐĂNG KÝ, TẮT, DANH SÁCH MÁY — quản lý (duyet)
-- =============================================================================
-- Quản lý đăng nhập trên máy tính bảng, gõ email / mật khẩu tài khoản máy;
-- Worker đăng nhập tài khoản đó để biết auth uid rồi gọi hàm này bằng phiên
-- QUẢN LÝ. Đăng ký lại một máy đã tắt thì bật lại, nhưng người đã gắn trước
-- đó phải gắn lại (tắt đã gỡ hết).
create or replace function kho_dang_ky_may(p_auth_uid uuid, p_ten text, p_phut_khoa int default 5)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ns  nhan_su;
  v_may kho_may;
  v_moi boolean := false;
  v_ten text := nullif(btrim(left(p_ten, 60)), '');
begin
  select * into v_ns from nhan_su where auth_uid = p_auth_uid;
  if not found or v_ns.vai_tro <> 'may_chung' or not v_ns.dang_lam then
    raise exception 'Tài khoản này không phải tài khoản máy dùng chung (hoặc đã bị khóa)'
      using errcode = 'check_violation';
  end if;
  if not kho_duoc(v_ns.chi_nhanh_id, 'duyet') then
    raise exception 'Chỉ quản lý chi nhánh của máy mới đăng ký được máy'
      using errcode = 'insufficient_privilege';
  end if;
  if p_phut_khoa is null or p_phut_khoa not between 1 and 60 then
    raise exception 'Số phút tự khóa phải từ 1 đến 60' using errcode = 'check_violation';
  end if;

  select * into v_may from kho_may where nhan_su_id = v_ns.id for update;
  if not found then
    insert into kho_may (chi_nhanh_id, nhan_su_id, ten, phut_khoa, nguoi_dang_ky)
    values (v_ns.chi_nhanh_id, v_ns.id, coalesce(v_ten, v_ns.ho_ten), p_phut_khoa, (nhan_su_hien_tai()).id)
    returning * into v_may;
    v_moi := true;
  else
    update kho_may set
      chi_nhanh_id = v_ns.chi_nhanh_id,
      ten = coalesce(v_ten, ten),
      phut_khoa = p_phut_khoa,
      dang_dung = true,
      nguoi_dang_ky = (nhan_su_hien_tai()).id
    where id = v_may.id
    returning * into v_may;
  end if;
  perform kho_may_ghi(v_may, 'dang_ky', null, case when v_moi then 'moi' else 'dang_ky_lai' end);

  return jsonb_build_object(
    'may_id', v_may.id, 'nhan_su_id', v_ns.id, 'chi_nhanh_id', v_may.chi_nhanh_id,
    'ten', v_may.ten, 'phut_khoa', v_may.phut_khoa, 'moi', v_moi);
end;
$$;

comment on function kho_dang_ky_may is
  'Quản lý (duyet) đăng ký một máy dùng chung theo auth uid của tài khoản may_chung. Gọi lại = sửa tên / phút khóa, bật lại máy đã tắt.';

-- Tắt máy: phiên máy hết tác dụng ngay (mọi hàm máy báo lỗi), gỡ hết người
-- đã gắn — token cất trên máy không còn đường nào dùng được.
create or replace function kho_may_tat(p_may_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_may kho_may;
  v_go int;
begin
  select * into v_may from kho_may where id = p_may_id for update;
  if not found or not kho_duoc(v_may.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy máy, hoặc tài khoản không được tắt máy'
      using errcode = 'insufficient_privilege';
  end if;
  delete from kho_may_nguoi where may_id = v_may.id;
  get diagnostics v_go = row_count;
  update kho_may set dang_dung = false, nguoi_dang_dung = null, dung_tu = null
  where id = v_may.id;
  perform kho_may_ghi(v_may, 'tat', null, 'gỡ ' || v_go || ' người');
  return jsonb_build_object('may_id', v_may.id, 'dang_dung', false, 'so_nguoi_go', v_go);
end;
$$;

comment on function kho_may_tat is
  'Quản lý (duyet) tắt một máy: phiên máy hết tác dụng, gỡ mọi người đã gắn.';

-- Danh sách máy + người đã gắn (KHÔNG có PIN). p_chi_nhanh_id null = mọi chi
-- nhánh người gọi có quyền duyet.
create or replace function kho_ds_may(p_chi_nhanh_id uuid default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'chi_nhanh_id', m.chi_nhanh_id, 'ten_chi_nhanh', cn.ten, 'ten', m.ten,
    'phut_khoa', m.phut_khoa, 'dang_dung', m.dang_dung,
    'bi_khoa', m.bi_khoa, 'bi_khoa_luc', m.bi_khoa_luc,
    'tai_khoan_nhan_su_id', m.nhan_su_id, 'tai_khoan_ho_ten', tk.ho_ten, 'tai_khoan_dang_lam', tk.dang_lam,
    'nguoi_dang_dung', m.nguoi_dang_dung, 'ten_nguoi_dang_dung', nd.ho_ten, 'dung_tu', m.dung_tu,
    'created_at', m.created_at,
    'sai_30_phut', (select count(*)::int from kho_may_nhat_ky nk
                    where nk.may_id = m.id and nk.su_kien = 'pin_sai'
                      and nk.luc > greatest(now() - interval '30 minutes', coalesce(m.mo_khoa_luc, '-infinity'))),
    'nguoi', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nhan_su_id', mn.nhan_su_id, 'ho_ten', ns.ho_ten, 'vai_tro', ns.vai_tro,
        'dang_lam', ns.dang_lam, 'sai_lien_tiep', mn.sai_lien_tiep,
        'khoa_den', case when mn.khoa_den > now() then mn.khoa_den end,
        'gan_luc', mn.gan_luc, 'dung_lan_cuoi', mn.dung_lan_cuoi) order by ns.ho_ten)
      from kho_may_nguoi mn join nhan_su ns on ns.id = mn.nhan_su_id
      where mn.may_id = m.id), '[]'::jsonb)
  ) order by cn.ten, m.dang_dung desc, m.ten), '[]'::jsonb)
  from kho_may m
  join chi_nhanh cn on cn.id = m.chi_nhanh_id
  join nhan_su tk on tk.id = m.nhan_su_id
  left join nhan_su nd on nd.id = m.nguoi_dang_dung
  where m.chi_nhanh_id = any(kho_cn_duoc('duyet'))
    and (p_chi_nhanh_id is null or m.chi_nhanh_id = p_chi_nhanh_id);
$$;

comment on function kho_ds_may is
  'Quản lý (duyet): danh sách máy dùng chung + người đã gắn (không PIN). null = mọi chi nhánh được duyet.';


-- =============================================================================
-- 5 · GỌI BẰNG PHIÊN MÁY — "Ai đang dùng máy?", kiểm PIN
-- =============================================================================
create or replace function kho_may_ds_nguoi()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_may kho_may;
begin
  v_may := kho_may_cua_phien();
  return jsonb_build_object(
    'may', jsonb_build_object(
      'id', v_may.id, 'ten', v_may.ten, 'chi_nhanh_id', v_may.chi_nhanh_id,
      'ten_chi_nhanh', (select ten from chi_nhanh where id = v_may.chi_nhanh_id),
      'phut_khoa', v_may.phut_khoa, 'bi_khoa', v_may.bi_khoa, 'nhan_su_id', v_may.nhan_su_id),
    'nguoi', coalesce((
      select jsonb_agg(jsonb_build_object(
        'nhan_su_id', ns.id, 'ho_ten', ns.ho_ten, 'vai_tro', ns.vai_tro,
        'khoa_den', case when mn.khoa_den > now() then mn.khoa_den end,
        'dung_lan_cuoi', mn.dung_lan_cuoi)
        order by mn.dung_lan_cuoi desc nulls last, ns.ho_ten)
      from kho_may_nguoi mn join nhan_su ns on ns.id = mn.nhan_su_id
      where mn.may_id = v_may.id
        and kho_may_nguoi_hop_le(ns.id, v_may.chi_nhanh_id)), '[]'::jsonb));
end;
$$;

comment on function kho_may_ds_nguoi is
  'Gọi bằng phiên MÁY: thông tin máy và người đã gắn (còn làm, đúng chi nhánh) cho màn "Ai đang dùng máy?".';

-- Kết quả (không báo lỗi — lần sai phải được GHI, báo lỗi thì mất):
--   dung       đúng PIN → máy ghi người đang dùng; Worker đổi phiên
--   sai        sai PIN, còn con_lan lần trước khi khóa người
--   khoa_nguoi người đang bị khóa (khoa_den), hoặc vừa sai lần thứ 5
--   khoa_may   máy đang bị khóa, hoặc vừa chạm 15 lần sai / 30 phút (30 / 24 giờ)
create or replace function kho_may_kiem_pin(p_nhan_su_id uuid, p_pin_bam text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_may  kho_may;
  v_mn   kho_may_nguoi;
  v_sai  int;
  v_dem  int;
  v_dem_ngay int;
begin
  v_may := kho_may_cua_phien();
  perform kho_may_kiem_pin_bam(p_pin_bam);
  -- Khóa dòng máy: hai lần gõ PIN cùng lúc không đếm lọt.
  select * into v_may from kho_may where id = v_may.id for update;

  if v_may.bi_khoa then
    return jsonb_build_object('ket_qua', 'khoa_may', 'dung', false);
  end if;

  select * into v_mn from kho_may_nguoi
  where may_id = v_may.id and nhan_su_id = p_nhan_su_id for update;
  if not found or not kho_may_nguoi_hop_le(p_nhan_su_id, v_may.chi_nhanh_id) then
    raise exception 'Người này chưa gắn vào máy (hoặc tài khoản đã bị khóa) — đăng nhập đầy đủ để gắn lại'
      using errcode = 'check_violation';
  end if;

  if v_mn.khoa_den > now() then
    return jsonb_build_object('ket_qua', 'khoa_nguoi', 'dung', false, 'khoa_den', v_mn.khoa_den);
  end if;

  if v_mn.pin_bam = p_pin_bam then
    update kho_may_nguoi set sai_lien_tiep = 0, khoa_den = null, dung_lan_cuoi = now()
    where may_id = v_may.id and nhan_su_id = p_nhan_su_id;
    update kho_may set nguoi_dang_dung = p_nhan_su_id, dung_tu = now() where id = v_may.id;
    perform kho_may_ghi(v_may, 'pin_dung', p_nhan_su_id, null);
    return jsonb_build_object('ket_qua', 'dung', 'dung', true,
      'ho_ten', (select ho_ten from nhan_su where id = p_nhan_su_id));
  end if;

  -- Sai. Ghi trước, rồi tính khóa người, rồi khóa máy (khóa máy thắng).
  perform kho_may_ghi(v_may, 'pin_sai', p_nhan_su_id, null);
  v_sai := v_mn.sai_lien_tiep + 1;
  if v_sai >= 5 then
    update kho_may_nguoi set sai_lien_tiep = 0, khoa_den = now() + interval '15 minutes'
    where may_id = v_may.id and nhan_su_id = p_nhan_su_id
    returning * into v_mn;
    perform kho_may_ghi(v_may, 'khoa_nguoi', p_nhan_su_id, '5 lần sai liên tiếp');
  else
    update kho_may_nguoi set sai_lien_tiep = v_sai
    where may_id = v_may.id and nhan_su_id = p_nhan_su_id;
  end if;

  select count(*) filter (where luc > now() - interval '30 minutes'), count(*)
    into v_dem, v_dem_ngay
  from kho_may_nhat_ky
  where may_id = v_may.id and su_kien = 'pin_sai'
    and luc > greatest(now() - interval '24 hours', coalesce(v_may.mo_khoa_luc, '-infinity'));
  -- 15 lần / 30 phút chặn dò nhanh. 30 lần / 24 giờ chặn dò CHẬM (14 lần mỗi
  -- nửa giờ, cả ngày, vẫn lọt dưới ngưỡng 30 phút — đủ để dò hết PIN 4 số
  -- trong vài ngày). Cả hai tính lại từ lần quản lý mở khóa máy.
  if v_dem >= 15 or v_dem_ngay >= 30 then
    update kho_may set bi_khoa = true, bi_khoa_luc = now(), nguoi_dang_dung = null, dung_tu = null
    where id = v_may.id;
    perform kho_may_ghi(v_may, 'khoa_may', p_nhan_su_id, case when v_dem >= 15
      then v_dem || ' lần sai trong 30 phút' else v_dem_ngay || ' lần sai trong 24 giờ' end);
    return jsonb_build_object('ket_qua', 'khoa_may', 'dung', false);
  end if;

  if v_sai >= 5 then
    return jsonb_build_object('ket_qua', 'khoa_nguoi', 'dung', false, 'khoa_den', v_mn.khoa_den);
  end if;
  return jsonb_build_object('ket_qua', 'sai', 'dung', false, 'con_lan', 5 - v_sai);
end;
$$;

comment on function kho_may_kiem_pin is
  'Gọi bằng phiên MÁY: kiểm pin_bam của một người đã gắn. Trả {ket_qua: dung|sai|khoa_nguoi|khoa_may, dung, con_lan?, khoa_den?, ho_ten?}. 5 sai liên tiếp → khóa người 15 phút; 15 sai / 30 phút hoặc 30 sai / 24 giờ trên máy → khóa máy.';


-- =============================================================================
-- 6 · GỌI BẰNG PHIÊN NGƯỜI — gắn vào máy, đổi PIN, khóa màn, tự gỡ
-- =============================================================================
-- Gắn = người đó đang đăng nhập ĐẦY ĐỦ trên máy (mật khẩu), cùng chi nhánh
-- với máy. Gắn lại (quên PIN, bị khóa) thì đặt PIN mới và xóa khóa.
create or replace function kho_may_gan_nguoi(p_may_id uuid, p_pin_bam text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ns  nhan_su;
  v_may kho_may;
  v_co  boolean;
begin
  perform kho_may_kiem_pin_bam(p_pin_bam);
  v_ns := nhan_su_hien_tai();
  select * into v_may from kho_may where id = p_may_id for update;
  if not found or not v_may.dang_dung then
    raise exception 'Không tìm thấy máy, hoặc máy đã bị tắt' using errcode = 'check_violation';
  end if;
  if v_ns.id is null or not kho_may_nguoi_hop_le(v_ns.id, v_may.chi_nhanh_id) then
    raise exception 'Chỉ nhân viên kho của chi nhánh này mới gắn được vào máy'
      using errcode = 'insufficient_privilege';
  end if;

  v_co := exists (select 1 from kho_may_nguoi where may_id = v_may.id and nhan_su_id = v_ns.id);
  if not v_co and (select count(*) from kho_may_nguoi where may_id = v_may.id) >= 20 then
    raise exception 'Máy đã gắn đủ 20 người — nhờ quản lý gỡ bớt người không dùng'
      using errcode = 'check_violation';
  end if;

  insert into kho_may_nguoi (may_id, nhan_su_id, pin_bam, dung_lan_cuoi)
  values (v_may.id, v_ns.id, p_pin_bam, now())
  on conflict (may_id, nhan_su_id) do update set
    pin_bam = excluded.pin_bam, sai_lien_tiep = 0, khoa_den = null,
    doi_pin_luc = now(), dung_lan_cuoi = now();
  update kho_may set nguoi_dang_dung = v_ns.id, dung_tu = now() where id = v_may.id;
  perform kho_may_ghi(v_may, case when v_co then 'doi_pin' else 'gan' end, v_ns.id, null);

  return jsonb_build_object('may_id', v_may.id, 'nhan_su_id', v_ns.id, 'ten_may', v_may.ten,
                            'phut_khoa', v_may.phut_khoa, 'gan_lai', v_co);
end;
$$;

comment on function kho_may_gan_nguoi is
  'Gọi bằng phiên NGƯỜI (đăng nhập đầy đủ): gắn mình vào máy với pin_bam (Worker băm, không gửi PIN thô). Cùng chi nhánh với máy. Gắn lại = PIN mới, xóa khóa.';

-- Đổi PIN khi đã gắn (đang dùng máy bằng phiên của mình).
create or replace function kho_may_dat_pin(p_may_id uuid, p_pin_bam text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ns  nhan_su;
  v_may kho_may;
begin
  perform kho_may_kiem_pin_bam(p_pin_bam);
  v_ns := nhan_su_hien_tai();
  select * into v_may from kho_may where id = p_may_id;
  if not found or not v_may.dang_dung or v_ns.id is null
     or not kho_may_nguoi_hop_le(v_ns.id, v_may.chi_nhanh_id)
     or not exists (select 1 from kho_may_nguoi where may_id = v_may.id and nhan_su_id = v_ns.id) then
    raise exception 'Bạn chưa gắn vào máy này' using errcode = 'insufficient_privilege';
  end if;
  update kho_may_nguoi set pin_bam = p_pin_bam, sai_lien_tiep = 0, khoa_den = null, doi_pin_luc = now()
  where may_id = v_may.id and nhan_su_id = v_ns.id;
  perform kho_may_ghi(v_may, 'doi_pin', v_ns.id, null);
  return jsonb_build_object('may_id', v_may.id, 'nhan_su_id', v_ns.id);
end;
$$;

comment on function kho_may_dat_pin is
  'Gọi bằng phiên NGƯỜI: đổi PIN của chính mình trên một máy đã gắn (pin_bam do Worker băm).';

-- Khóa máy. p_cach:
--   bam     người đang dùng bấm "Khóa máy"
--   het_gio Worker thấy quá phut_khoa (moTrangKho)
--        → hai cách trên chỉ KHÓA MÀN: bỏ người đang dùng, về "Ai đang dùng máy?".
--          Gọi được bằng phiên máy, phiên người đã gắn, hoặc quản lý.
--   quan_ly quản lý KHÓA HẲN máy (bi_khoa): PIN không mở được nữa tới khi
--          quản lý mở (kho_may_mo_khoa). Cần duyet.
create or replace function kho_may_khoa(p_may_id uuid, p_cach text default 'bam')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ns  nhan_su;
  v_may kho_may;
begin
  if p_cach is null or p_cach not in ('bam', 'het_gio', 'quan_ly') then
    raise exception 'Cách khóa không hợp lệ' using errcode = 'check_violation';
  end if;
  v_ns := nhan_su_hien_tai();
  select * into v_may from kho_may where id = p_may_id for update;
  if not found then
    raise exception 'Không tìm thấy máy' using errcode = 'insufficient_privilege';
  end if;

  if p_cach = 'quan_ly' then
    if not kho_duoc(v_may.chi_nhanh_id, 'duyet') then
      raise exception 'Chỉ quản lý mới khóa hẳn được máy' using errcode = 'insufficient_privilege';
    end if;
    update kho_may set bi_khoa = true, bi_khoa_luc = now(), nguoi_dang_dung = null, dung_tu = null
    where id = v_may.id;
    perform kho_may_ghi(v_may, 'khoa_may', v_may.nguoi_dang_dung, 'quan_ly');
    return jsonb_build_object('may_id', v_may.id, 'bi_khoa', true);
  end if;

  if not (coalesce(v_ns.id = v_may.nhan_su_id, false)
          or exists (select 1 from kho_may_nguoi where may_id = v_may.id and nhan_su_id = v_ns.id)
          or kho_duoc(v_may.chi_nhanh_id, 'duyet')) then
    raise exception 'Tài khoản không được khóa máy này' using errcode = 'insufficient_privilege';
  end if;
  update kho_may set nguoi_dang_dung = null, dung_tu = null where id = v_may.id;
  perform kho_may_ghi(v_may, 'khoa_man', v_may.nguoi_dang_dung, p_cach);
  return jsonb_build_object('may_id', v_may.id, 'bi_khoa', v_may.bi_khoa);
end;
$$;

comment on function kho_may_khoa is
  'Khóa máy. p_cach bam|het_gio: khóa màn (máy, người đã gắn, quản lý gọi được). quan_ly: khóa hẳn máy tới khi quản lý mở (duyet).';

-- Gỡ khỏi máy. p_nhan_su_id null = tự gỡ mình ("Gỡ tôi khỏi máy này");
-- gỡ người khác cần duyet.
create or replace function kho_may_go(p_may_id uuid, p_nhan_su_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ns   nhan_su;
  v_may  kho_may;
  v_ai   uuid;
  v_go   int;
begin
  v_ns := nhan_su_hien_tai();
  select * into v_may from kho_may where id = p_may_id for update;
  if not found or v_ns.id is null then
    raise exception 'Không tìm thấy máy' using errcode = 'insufficient_privilege';
  end if;
  v_ai := coalesce(p_nhan_su_id, v_ns.id);
  if v_ai <> v_ns.id and not kho_duoc(v_may.chi_nhanh_id, 'duyet') then
    raise exception 'Chỉ quản lý mới gỡ được người khác khỏi máy' using errcode = 'insufficient_privilege';
  end if;
  delete from kho_may_nguoi where may_id = v_may.id and nhan_su_id = v_ai;
  get diagnostics v_go = row_count;
  if v_may.nguoi_dang_dung = v_ai then
    update kho_may set nguoi_dang_dung = null, dung_tu = null where id = v_may.id;
  end if;
  if v_go > 0 then
    perform kho_may_ghi(v_may, 'go', v_ai, case when v_ai = v_ns.id then 'tu_go' else 'quan_ly' end);
  end if;
  return jsonb_build_object('may_id', v_may.id, 'nhan_su_id', v_ai, 'da_go', v_go > 0);
end;
$$;

comment on function kho_may_go is
  'Gỡ một người khỏi máy. p_nhan_su_id null = tự gỡ mình; gỡ người khác cần duyet.';

-- Quản lý mở khóa: p_nhan_su_id null = mở khóa MÁY (đếm sai PIN của máy tính
-- lại từ lúc này); có p_nhan_su_id = mở khóa một NGƯỜI trên máy.
create or replace function kho_may_mo_khoa(p_may_id uuid, p_nhan_su_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_may kho_may;
begin
  select * into v_may from kho_may where id = p_may_id for update;
  if not found or not kho_duoc(v_may.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy máy, hoặc tài khoản không được mở khóa'
      using errcode = 'insufficient_privilege';
  end if;
  if p_nhan_su_id is null then
    update kho_may set bi_khoa = false, bi_khoa_luc = null, mo_khoa_luc = now() where id = v_may.id;
    perform kho_may_ghi(v_may, 'mo_khoa_may', null, null);
  else
    update kho_may_nguoi set sai_lien_tiep = 0, khoa_den = null
    where may_id = v_may.id and nhan_su_id = p_nhan_su_id;
    if not found then
      raise exception 'Người này chưa gắn vào máy' using errcode = 'check_violation';
    end if;
    perform kho_may_ghi(v_may, 'mo_khoa_nguoi', p_nhan_su_id, null);
  end if;
  return jsonb_build_object('may_id', v_may.id, 'nhan_su_id', p_nhan_su_id);
end;
$$;

comment on function kho_may_mo_khoa is
  'Quản lý (duyet) mở khóa máy (p_nhan_su_id null) hoặc mở khóa một người trên máy.';


-- =============================================================================
-- 7 · CHỦ TỰ TẠO TÀI KHOẢN
-- =============================================================================
-- Vai chủ được tạo ở đây: ba vai kho và hai vai máy. KHÔNG tạo vai CRM (chủ,
-- quản lý, thu ngân, marketing) — những vai đó thấy dữ liệu khách hàng, thêm
-- người như vậy phải là việc có chủ ý ở màn nhân sự CRM.
create or replace function kho_them_nhan_su(p_auth_uid uuid, p_ho_ten text, p_vai_tro vai_tro, p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ten   text := nullif(btrim(left(p_ho_ten, 100)), '');
  v_email text;
  v_id    uuid;
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ nhà hàng mới tạo được tài khoản' using errcode = 'insufficient_privilege';
  end if;
  if p_vai_tro is null or p_vai_tro not in ('thu_kho', 'nhan_vien_quay', 'ke_toan', 'may_chung', 'may_ipos') then
    raise exception 'Ở đây chỉ tạo được tài khoản kho (thủ kho, NV quầy/bếp, kế toán) hoặc tài khoản máy'
      using errcode = 'check_violation';
  end if;
  if v_ten is null then
    raise exception 'Cần họ tên' using errcode = 'check_violation';
  end if;
  if p_chi_nhanh_id is null or not exists (select 1 from chi_nhanh where id = p_chi_nhanh_id) then
    raise exception 'Chọn chi nhánh' using errcode = 'check_violation';
  end if;
  select u.email into v_email from auth.users u where u.id = p_auth_uid;
  if not found then
    raise exception 'Không tìm thấy tài khoản đăng nhập vừa tạo' using errcode = 'check_violation';
  end if;
  if exists (select 1 from nhan_su where auth_uid = p_auth_uid) then
    raise exception 'Tài khoản đăng nhập này đã gắn với một nhân sự khác' using errcode = 'unique_violation';
  end if;

  insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, email, vai_tro, dang_lam)
  values (p_auth_uid, p_chi_nhanh_id, v_ten, v_email, p_vai_tro, true)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'ho_ten', v_ten, 'email', v_email,
                            'vai_tro', p_vai_tro, 'chi_nhanh_id', p_chi_nhanh_id);
end;
$$;

comment on function kho_them_nhan_su is
  'Chủ: nối một tài khoản Supabase Auth vừa đăng ký với dòng nhan_su mới. Chỉ vai thu_kho|nhan_vien_quay|ke_toan|may_chung|may_ipos; uid phải có trong auth.users và chưa gắn nhân sự nào.';

-- Nhân sự chủ quản lý ở màn "Nhân viên kho": vai kho, quản lý, hai vai máy.
create or replace function kho_khoa_nhan_su(p_nhan_su_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ns nhan_su;
  v_go int;
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ nhà hàng mới khóa được tài khoản' using errcode = 'insufficient_privilege';
  end if;
  select * into v_ns from nhan_su where id = p_nhan_su_id for update;
  if not found or v_ns.vai_tro not in ('quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan', 'may_chung', 'may_ipos') then
    raise exception 'Không tìm thấy nhân viên kho này' using errcode = 'check_violation';
  end if;
  if v_ns.auth_uid = auth.uid() then
    raise exception 'Không tự khóa tài khoản của mình được' using errcode = 'check_violation';
  end if;
  update nhan_su set dang_lam = false where id = v_ns.id;
  -- Gỡ khỏi mọi máy dùng chung: mở lại tài khoản thì phải gắn lại, token cũ
  -- còn cất trên máy không dùng được nữa.
  delete from kho_may_nguoi where nhan_su_id = v_ns.id;
  get diagnostics v_go = row_count;
  update kho_may set nguoi_dang_dung = null, dung_tu = null where nguoi_dang_dung = v_ns.id;
  return jsonb_build_object('id', v_ns.id, 'dang_lam', false, 'so_may_go', v_go);
end;
$$;

comment on function kho_khoa_nhan_su is
  'Chủ: khóa tài khoản (dang_lam = false) một nhân viên kho / quản lý / máy; không tự khóa mình. Gỡ khỏi mọi máy dùng chung.';

create or replace function kho_mo_nhan_su(p_nhan_su_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ns nhan_su;
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ nhà hàng mới mở lại được tài khoản' using errcode = 'insufficient_privilege';
  end if;
  select * into v_ns from nhan_su where id = p_nhan_su_id for update;
  if not found or v_ns.vai_tro not in ('quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan', 'may_chung', 'may_ipos') then
    raise exception 'Không tìm thấy nhân viên kho này' using errcode = 'check_violation';
  end if;
  if v_ns.auth_uid = auth.uid() then
    raise exception 'Không tự mở tài khoản của mình được' using errcode = 'check_violation';
  end if;
  update nhan_su set dang_lam = true where id = v_ns.id;
  return jsonb_build_object('id', v_ns.id, 'dang_lam', true);
end;
$$;

comment on function kho_mo_nhan_su is 'Chủ: mở lại tài khoản đã khóa (dang_lam = true).';

create or replace function kho_ds_nhan_su_kho(p_chi_nhanh_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ nhà hàng mới xem được danh sách này' using errcode = 'insufficient_privilege';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', ns.id, 'ho_ten', ns.ho_ten, 'email', ns.email, 'vai_tro', ns.vai_tro,
      'chi_nhanh_id', ns.chi_nhanh_id, 'ten_chi_nhanh', cn.ten, 'dang_lam', ns.dang_lam,
      'created_at', ns.created_at,
      'so_may', (select count(*)::int from kho_may_nguoi mn where mn.nhan_su_id = ns.id))
      order by cn.ten, ns.dang_lam desc, ns.vai_tro, ns.ho_ten)
    from nhan_su ns
    left join chi_nhanh cn on cn.id = ns.chi_nhanh_id
    where ns.vai_tro in ('quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan', 'may_chung', 'may_ipos')
      and (p_chi_nhanh_id is null or ns.chi_nhanh_id = p_chi_nhanh_id)), '[]'::jsonb);
end;
$$;

comment on function kho_ds_nhan_su_kho is
  'Chủ: danh sách quản lý, nhân viên kho và tài khoản máy (mọi chi nhánh, hoặc một chi nhánh).';


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_may_cua_phien() from authenticated';
    execute 'revoke execute on function kho_may_nguoi_hop_le(uuid, uuid) from authenticated';
    execute 'revoke execute on function kho_may_ghi(kho_may, text, uuid, text) from authenticated';
    execute 'revoke execute on function kho_may_kiem_pin_bam(text) from authenticated';
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
