-- =============================================================================
-- BEEFTOWN KHO — 0033 · PHA LÓC BẰNG QUÉT NHÃN · BÁO THU HỒI THẤP · THẺ KHO
-- =============================================================================
-- Chủ nhà hàng đã chốt (GĐ5c):
--
--   · Sau pha, phần cắt để ở đâu là TÙY MÓN: có món đưa thẳng ra quầy, có món
--     cất kho lạnh (kho_mat_hang.noi_de_sau_pha).
--   · Gói nào cắt ra cũng có nhãn cân → kết quả pha ghi bằng QUÉT NHÃN: số gói
--     = số nhãn, kg = tổng kg trên nhãn. Phụ phẩm, mỡ bỏ vẫn gõ kg.
--   · Pha lóc KHÔNG duyệt. Thu hồi thấp hơn dự kiến quá nguong_thu_hoi_diem
--     điểm (0030, mặc định 3) thì tự báo quản lý; quản lý bấm "Đã xem".
--   · Thủ kho không thấy tiền (0031): mọi thứ mới ở đây chỉ có kg và %.
--
-- QUÉT NHÃN KHI PHA — y như đếm quầy cộng dồn (0032): mỗi lần bấm gửi là một
-- LƯỢT (kho_phien_pha_lan_quet, ma_gui riêng — gửi lại không cộng đôi), mỗi
-- nhãn một dòng (kho_phien_pha_quet). Database giải mã nhãn bằng
-- kho_doc_ma_vach (0032). Mỗi món có nhãn thành ĐÚNG MỘT dòng ra tu_quet =
-- true, dựng lại sau mỗi lượt: so_goi = số nhãn, so_kg = tổng kg, nơi để =
-- noi_de_sau_pha của món (mặc định kho lạnh). kho_luu_phien_pha (cùng chữ ký)
-- chỉ ghi đè các dòng GÕ TAY, không đụng dòng quét.
--
-- THU HỒI DỰ KIẾN (kho_thu_hoi_du_kien) — thu hồi = kg thịt giữ lại ÷ kg vào,
-- nên dự kiến = tổng ty_le_du_kien các dòng THỊT của công thức (bỏ phụ phẩm
-- và phần bỏ). Công thức = công thức của phiên; phiên không chọn thì công
-- thức đang dùng đầu tiên của loại tảng đó. Không có công thức (hoặc công
-- thức chưa ghi tỉ lệ) thì lấy thu hồi trung bình 30 ngày (tính theo kg) của
-- các phiên đã chốt cùng loại tảng. Tính lúc CHỐT, ghi vào phiên.
--
-- THẺ KHO (kho_the_kho) — sổ của một món: tồn đầu kỳ, từng lần nhập / xuất
-- theo thời gian, tồn lũy kế. Không tiền. Không chọn vị trí = CẢ CHI NHÁNH,
-- kể cả hàng "Đang mang ra quầy" và "Hàng chờ hủy" (hàng vẫn là của chi
-- nhánh, tồn cuối kỳ = tổng kho_ton); chuyển nội bộ hiện đủ hai dòng đi/đến.
--
-- KHÔNG ĐỔI CHỮ KÝ HÀM CÔNG KHAI NÀO. Hàm có luật đổi được thay THÂN, chép
-- nguyên văn phần còn lại; chỗ đổi có ghi "0033".
-- =============================================================================


-- =============================================================================
-- 1 · MẶT HÀNG: SAU PHA ĐỂ Ở ĐÂU
-- =============================================================================
-- Danh mục ghi thẳng bảng (web, lib/kho/danh-muc.ts) nên chỉ cần cột + CHECK.
alter table kho_mat_hang
  add column noi_de_sau_pha text;
alter table kho_mat_hang
  add constraint kho_mat_hang_noi_de_sau_pha_hop_le
  check (noi_de_sau_pha is null or noi_de_sau_pha in ('kho', 'quay'));
comment on column kho_mat_hang.noi_de_sau_pha is
  'Gói quét nhãn khi pha lóc để ở đâu: kho (kho lạnh) | quay. null = kho lạnh.';

-- Vị trí đích của một món sau pha: vị trí đang dùng đầu tiên đúng loại; chi
-- nhánh không có quầy thì về kho lạnh.
create or replace function kho_vi_tri_sau_pha(p_chi_nhanh_id uuid, p_noi text)
returns uuid
language sql
stable
set search_path = public
as $$
  select v.id from kho_vi_tri v
  where v.chi_nhanh_id = p_chi_nhanh_id and v.dang_dung and v.loai in ('kho', 'quay')
  order by (v.loai = coalesce(p_noi, 'kho')) desc, (v.loai = 'kho') desc, v.thu_tu, v.ten
  limit 1
$$;

comment on function kho_vi_tri_sau_pha is
  'NỘI BỘ. Vị trí để gói quét nhãn khi pha lóc theo noi_de_sau_pha của món (null = kho lạnh).';


-- =============================================================================
-- 2 · QUÉT NHÃN KHI PHA — BẢNG
-- =============================================================================
-- Một LƯỢT = một lần bấm gửi từ một máy. Lượt 'bo' ghi các lần −1 / bỏ lượt /
-- xóa món, để bấm hai lần không trừ hai lần. Cùng dáng kho_kiem_ke_lan_quet.
create table kho_phien_pha_lan_quet (
  id           uuid primary key default gen_random_uuid(),
  phien_pha_id uuid not null references kho_phien_pha(id) on delete cascade,
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  ma_gui       uuid not null,
  loai         text not null default 'quet',
  cach         text,
  mat_hang_id  uuid references kho_mat_hang(id) on delete restrict,
  so_nhan      int not null default 0,
  loi          jsonb not null default '[]',
  nguoi        uuid references nhan_su(id) on delete set null,
  bo_luc       timestamptz,
  created_at   timestamptz not null default clock_timestamp(),
  -- Thứ tự ghi thật (đồng hồ có thể trùng) — "lượt sau cùng" sắp theo cột này.
  thu_tu       bigint generated always as identity,

  constraint kho_phien_pha_lan_quet_ma_gui_duy_nhat unique (ma_gui),
  constraint kho_phien_pha_lan_quet_loai_hop_le check (loai in ('quet', 'bo')),
  constraint kho_phien_pha_lan_quet_cach_hop_le check (
    (loai = 'quet' and cach is null) or (loai = 'bo' and cach in ('lan_cuoi', 'bot_mot', 'xoa_mon')))
);

create index kho_phien_pha_lan_quet_phien_idx on kho_phien_pha_lan_quet(phien_pha_id, thu_tu);

-- Một dòng cho mỗi nhãn. Hai gói cùng món cùng cân nặng in ra cùng một mã —
-- vẫn là hai dòng. Nhãn pha lóc phải có kg (dòng ra cần kg).
create table kho_phien_pha_quet (
  id           uuid primary key default gen_random_uuid(),
  phien_pha_id uuid not null references kho_phien_pha(id) on delete cascade,
  lan_quet_id  uuid not null references kho_phien_pha_lan_quet(id) on delete cascade,
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  mat_hang_id  uuid not null references kho_mat_hang(id) on delete restrict,
  ma           text not null,
  so_kg        numeric(12,3) not null,
  created_at   timestamptz not null default clock_timestamp(),
  thu_tu       bigint generated always as identity,   -- "nhãn sau cùng" cho nút −1

  constraint kho_phien_pha_quet_ma_hop_le check (ma ~ '^[0-9]{13}$'),
  constraint kho_phien_pha_quet_kg_hop_le check (so_kg > 0)
);

create index kho_phien_pha_quet_phien_idx on kho_phien_pha_quet(phien_pha_id, mat_hang_id, thu_tu);

-- Dòng ra dựng từ nhãn: mỗi món một dòng.
alter table kho_phien_pha_ra
  add column tu_quet boolean not null default false;
create unique index kho_phien_pha_ra_quet_idx on kho_phien_pha_ra(phien_pha_id, mat_hang_id) where tu_quet;

comment on table kho_phien_pha_quet is
  'Từng nhãn đã quét khi pha lóc (0033). Chỉ ghi qua kho_quet_phien_pha / kho_bo_quet_phien_pha.';
comment on column kho_phien_pha_ra.tu_quet is
  'Dòng dựng từ nhãn đã quét (so_goi = số nhãn, so_kg = tổng kg). kho_luu_phien_pha không sửa / xóa dòng này.';


-- =============================================================================
-- 3 · THU HỒI THẤP — CỘT TRÊN PHIÊN
-- =============================================================================
alter table kho_phien_pha
  add column ty_le_du_kien  numeric(6,2),
  add column nguon_du_kien  text,
  add column thu_hoi_thap   boolean not null default false,
  add column da_xem_boi     uuid references nhan_su(id) on delete set null,
  add column da_xem_luc     timestamptz,
  add column da_xem_ghi_chu text;
alter table kho_phien_pha
  add constraint kho_phien_pha_nguon_du_kien_hop_le
  check (nguon_du_kien is null or nguon_du_kien in ('cong_thuc', 'tb_30_ngay'));

comment on column kho_phien_pha.ty_le_du_kien is
  'Thu hồi dự kiến (%) ghi lúc chốt: theo công thức, không có thì trung bình 30 ngày (nguon_du_kien).';
comment on column kho_phien_pha.thu_hoi_thap is
  'Lúc chốt: thu hồi < dự kiến − nguong_thu_hoi_diem → báo quản lý (sự kiện thu_hoi_thap) tới khi bấm "Đã xem".';


-- =============================================================================
-- 4 · QUÉT NHÃN KHI PHA — HÀM
-- =============================================================================
-- Dựng lại các dòng ra tu_quet từ nhãn: mỗi món một dòng, gói = số nhãn (món
-- không đếm gói thì 0), kg = tổng kg, vào vị trí theo noi_de_sau_pha. Món hết
-- nhãn (bỏ lượt, −1, xóa món) thì dòng của nó bị bỏ.
create or replace function kho_phien_pha_tinh_quet(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ph  kho_phien_pha;
  v_max int;
begin
  select * into v_ph from kho_phien_pha where id = p_id;

  delete from kho_phien_pha_ra r
  where r.phien_pha_id = p_id and r.tu_quet
    and not exists (select 1 from kho_phien_pha_quet q
                     where q.phien_pha_id = p_id and q.mat_hang_id = r.mat_hang_id);

  update kho_phien_pha_ra r set
    so_goi    = case when m.dem_goi then x.n else 0 end,
    so_kg     = x.kg,
    xu_ly     = 'nhap_kho',
    vi_tri_id = kho_vi_tri_sau_pha(v_ph.chi_nhanh_id, m.noi_de_sau_pha)
  from (select q.mat_hang_id, count(*)::int as n, sum(q.so_kg) as kg
          from kho_phien_pha_quet q where q.phien_pha_id = p_id group by q.mat_hang_id) x,
       kho_mat_hang m
  where r.phien_pha_id = p_id and r.tu_quet and r.mat_hang_id = x.mat_hang_id and m.id = r.mat_hang_id;

  select coalesce(max(thu_tu), 0) into v_max from kho_phien_pha_ra where phien_pha_id = p_id;
  insert into kho_phien_pha_ra
    (phien_pha_id, chi_nhanh_id, thu_tu, mat_hang_id, so_kg, so_goi, xu_ly, vi_tri_id, tu_quet)
  select p_id, v_ph.chi_nhanh_id, v_max + row_number() over (order by min(q.thu_tu)), q.mat_hang_id,
         sum(q.so_kg), case when m.dem_goi then count(*)::int else 0 end, 'nhap_kho',
         kho_vi_tri_sau_pha(v_ph.chi_nhanh_id, m.noi_de_sau_pha), true
  from kho_phien_pha_quet q
  join kho_mat_hang m on m.id = q.mat_hang_id
  where q.phien_pha_id = p_id
    and not exists (select 1 from kho_phien_pha_ra r
                     where r.phien_pha_id = p_id and r.tu_quet and r.mat_hang_id = q.mat_hang_id)
  group by q.mat_hang_id, m.dem_goi, m.noi_de_sau_pha;
end;
$$;

comment on function kho_phien_pha_tinh_quet is
  'NỘI BỘ. Dựng lại các dòng ra tu_quet của phiên pha lóc từ nhãn đã quét.';

-- Kết quả trả cho màn "Cân & quét": các món đã quét (món vừa quét lên đầu) và
-- số kg tạm tính. Chỉ kg, gói, % — không tiền.
--   {da_co, so_nhan, loi[{ma, loi}], phien_ban,
--    mon[{mat_hang_id, ten, don_vi_goi, dem_goi, so_nhan, so_goi, so_kg, vi_tri_id, ten_vi_tri, loai_vi_tri}],
--    kg_vao, kg_ra, kg_thit, kg_phu_pham, kg_bo, kg_hao_hut, ty_le_thu_hoi}
create or replace function kho_phien_pha_tra_quet(p_id uuid, p_da_co boolean, p_so_nhan int, p_loi jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pb     int;
  v_mon    jsonb;
  v_kg_vao numeric;
  v_t      record;
begin
  select phien_ban into v_pb from kho_phien_pha where id = p_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'mat_hang_id', r.mat_hang_id, 'ten', m.ten, 'don_vi_goi', m.don_vi_goi, 'dem_goi', m.dem_goi,
           'so_nhan', x.n, 'so_goi', r.so_goi, 'so_kg', r.so_kg,
           'vi_tri_id', r.vi_tri_id, 'ten_vi_tri', v.ten, 'loai_vi_tri', v.loai)
         order by x.lan_cuoi desc, r.thu_tu), '[]'::jsonb)
    into v_mon
  from kho_phien_pha_ra r
  join kho_mat_hang m on m.id = r.mat_hang_id
  left join kho_vi_tri v on v.id = r.vi_tri_id
  join (select q.mat_hang_id, count(*)::int as n, max(q.thu_tu) as lan_cuoi
          from kho_phien_pha_quet q where q.phien_pha_id = p_id group by q.mat_hang_id) x
    on x.mat_hang_id = r.mat_hang_id
  where r.phien_pha_id = p_id and r.tu_quet;

  select coalesce(sum(so_kg), 0) into v_kg_vao from kho_phien_pha_vao where phien_pha_id = p_id;
  -- Chia nhóm như kho_tinh_phien_pha: bỏ | phụ phẩm | thịt.
  select coalesce(sum(r.so_kg), 0) as ra,
         coalesce(sum(r.so_kg) filter (where r.xu_ly <> 'bo' and m.loai <> 'phu_pham'), 0) as thit,
         coalesce(sum(r.so_kg) filter (where r.xu_ly <> 'bo' and m.loai = 'phu_pham'), 0) as pp,
         coalesce(sum(r.so_kg) filter (where r.xu_ly = 'bo'), 0) as bo
    into v_t
  from kho_phien_pha_ra r
  join kho_mat_hang m on m.id = r.mat_hang_id
  where r.phien_pha_id = p_id;

  return jsonb_build_object(
    'da_co', p_da_co, 'so_nhan', p_so_nhan, 'loi', coalesce(p_loi, '[]'::jsonb),
    'phien_ban', v_pb, 'mon', v_mon,
    'kg_vao', v_kg_vao, 'kg_ra', v_t.ra, 'kg_thit', v_t.thit, 'kg_phu_pham', v_t.pp, 'kg_bo', v_t.bo,
    'kg_hao_hut', v_kg_vao - v_t.ra,
    'ty_le_thu_hoi', case when v_kg_vao > 0 then round(v_t.thit * 100 / v_kg_vao, 2) end);
end;
$$;

comment on function kho_phien_pha_tra_quet is
  'NỘI BỘ. Kết quả của kho_quet_phien_pha / kho_bo_quet_phien_pha: món đã quét và kg tạm tính. Không tiền.';

-- p_ma: mảng CHUỖI SỐ THÔ đúng như máy quét gửi, tối đa 300 nhãn một lượt.
-- Nhãn đọc không được (hoặc không dùng được ở đây) trả trong "loi", các nhãn
-- khác vẫn được cộng. Cùng p_ma_gui = cùng lượt, không cộng đôi.
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
    select * into v_mh from kho_mat_hang where ma_can = v_doc.ma_can and dang_dung;
    if not found then
      v_loi := v_loi || jsonb_build_object('ma', v_ma,
        'loi', 'Mã hàng ' || v_doc.ma_can || ' chưa gán cho món nào — báo quản lý');
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

-- Sửa số đã quét. p_cach:
--   lan_cuoi  bỏ lượt quét gần nhất của chính người bấm (p_mat_hang_id null)
--   bot_mot   −1 gói của món p_mat_hang_id (nhãn quét sau cùng)
--   xoa_mon   xóa hết nhãn của món → dòng của món biến mất
create or replace function kho_bo_quet_phien_pha(p_id uuid, p_ma_gui uuid, p_cach text, p_mat_hang_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ph   kho_phien_pha;
  v_lan  kho_phien_pha_lan_quet;
  v_bo   kho_phien_pha_lan_quet;
  v_nv   nhan_su;
  v_n    int := 0;
  v_q    uuid;
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found or not kho_duoc(v_ph.chi_nhanh_id, 'pha_loc') then
    raise exception 'Không tìm thấy phiên pha lóc, hoặc tài khoản không được ghi pha lóc'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_ph from kho_phien_pha where id = p_id for update;

  select * into v_lan from kho_phien_pha_lan_quet where ma_gui = p_ma_gui;
  if found then
    if v_lan.phien_pha_id <> p_id then
      raise exception 'Mã gửi đã dùng cho phiên khác' using errcode = 'check_violation';
    end if;
    return kho_phien_pha_tra_quet(p_id, true, v_lan.so_nhan, '[]'::jsonb);
  end if;
  if v_ph.trang_thai <> 'nhap' then
    raise exception 'Phiên % đã % — không sửa được', v_ph.so_phieu,
      case v_ph.trang_thai when 'da_chot' then 'chốt' else 'bị hủy' end
      using errcode = 'check_violation';
  end if;
  if p_cach is null or p_cach not in ('lan_cuoi', 'bot_mot', 'xoa_mon') then
    raise exception 'Cách sửa không hợp lệ' using errcode = 'check_violation';
  end if;
  if p_cach <> 'lan_cuoi' and p_mat_hang_id is null then
    raise exception 'Chưa chọn món' using errcode = 'check_violation';
  end if;
  v_nv := nhan_su_hien_tai();

  if p_cach = 'lan_cuoi' then
    select * into v_bo from kho_phien_pha_lan_quet l
    where l.phien_pha_id = p_id and l.loai = 'quet' and l.bo_luc is null and l.nguoi is not distinct from v_nv.id
      and exists (select 1 from kho_phien_pha_quet q where q.lan_quet_id = l.id)
    order by l.thu_tu desc limit 1;
    if v_bo.id is null then
      raise exception 'Bạn chưa có lượt quét nào để bỏ' using errcode = 'check_violation';
    end if;
    delete from kho_phien_pha_quet where lan_quet_id = v_bo.id;
    get diagnostics v_n = row_count;
    update kho_phien_pha_lan_quet set bo_luc = now() where id = v_bo.id;
  elsif p_cach = 'bot_mot' then
    select q.id into v_q from kho_phien_pha_quet q
    where q.phien_pha_id = p_id and q.mat_hang_id = p_mat_hang_id
    order by q.thu_tu desc limit 1;
    if v_q is null then
      raise exception 'Món này chưa quét nhãn nào' using errcode = 'check_violation';
    end if;
    delete from kho_phien_pha_quet where id = v_q;
    v_n := 1;
  else
    delete from kho_phien_pha_quet where phien_pha_id = p_id and mat_hang_id = p_mat_hang_id;
    get diagnostics v_n = row_count;
  end if;

  insert into kho_phien_pha_lan_quet (phien_pha_id, chi_nhanh_id, ma_gui, loai, cach, mat_hang_id, so_nhan, nguoi)
  values (p_id, v_ph.chi_nhanh_id, p_ma_gui, 'bo', p_cach, p_mat_hang_id, v_n, v_nv.id);
  perform kho_phien_pha_tinh_quet(p_id);
  update kho_phien_pha set phien_ban = phien_ban + 1 where id = p_id;

  return kho_phien_pha_tra_quet(p_id, false, v_n, '[]'::jsonb);
end;
$$;

comment on function kho_bo_quet_phien_pha is
  'Sửa nhãn đã quét của phiên pha lóc: p_cach lan_cuoi (bỏ lượt gần nhất của mình) | bot_mot (−1 gói của p_mat_hang_id) | xoa_mon. Chống bấm hai lần bằng p_ma_gui. Trả như kho_quet_phien_pha; so_nhan = số nhãn đã bớt.';


-- ---- Thay THÂN kho_luu_phien_pha (0022) — chép nguyên văn; chỗ đổi có ghi 0033.
-- p_vao: [{lo_id, vi_tri_id, so_kg, so_goi}] — so_kg bỏ trống = lấy hết lô ở chỗ đó.
-- p_ra:  [{mat_hang_id, so_kg, so_goi, xu_ly, vi_tri_id, han_dung}] — CHỈ các dòng gõ tay.
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
  v_max_quet int := 0;
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
    -- 0033: chỉ thay các dòng gõ tay; dòng dựng từ nhãn đã quét giữ nguyên.
    delete from kho_phien_pha_ra where phien_pha_id = p_id and not tu_quet;
    select coalesce(max(thu_tu), 0) into v_max_quet
    from kho_phien_pha_ra where phien_pha_id = p_id and tu_quet;
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
    -- 0033
    if v_vt.loai = 'dang_chuyen' then
      raise exception 'Lô % đang mang ra quầy — chờ quầy nhận rồi mới đem pha', v_lo.ma_lo using errcode = 'check_violation';
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
    -- 0033: món đã quét nhãn thì sửa bằng −1 / bỏ lượt, không gõ tay thêm dòng.
    if exists (select 1 from kho_phien_pha_ra r
               where r.phien_pha_id = v_id and r.mat_hang_id = v_mhr.id and r.tu_quet) then
      raise exception 'Đầu ra % (%): món này đã quét nhãn — sửa bằng nút −1 hoặc bỏ lượt quét', v_i, v_mhr.ten
        using errcode = 'check_violation';
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
      if v_vt.id is null or v_vt.chi_nhanh_id <> p_chi_nhanh_id or v_vt.loai in ('cho_huy', 'dang_chuyen')   -- 0033: + đi đường
         or not v_vt.dang_dung then
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
      (v_id, p_chi_nhanh_id, v_max_quet + v_i, v_mhr.id, v_kg, v_goi, v_xl, v_vt.id, v_han);   -- 0033: sau dòng quét
  end loop;

  return query select v_id, v_pb, false;
end;
$$;

comment on function kho_luu_phien_pha is
  'Lưu nháp phiên pha lóc (tạo mới khi p_id null). Đầu vào phải cùng một loại tảng và đủ tồn. Không chạm sổ kho. 0033: p_ra chỉ thay các dòng gõ tay — dòng quét nhãn (tu_quet) giữ nguyên; món đã quét không gõ tay được; không chọn vị trí đi đường.';


-- =============================================================================
-- 5 · THU HỒI DỰ KIẾN, CHỐT, MỞ LẠI, "ĐÃ XEM"
-- =============================================================================
-- Thu hồi dự kiến của một phiên (xem đầu file). Trả
--   {ty_le_du_kien, nguon_du_kien: cong_thuc | tb_30_ngay | null,
--    ty_le_cong_thuc, ty_le_tb_30_ngay, cong_thuc_id}
-- TB 30 ngày = Σ kg thịt ÷ Σ kg vào của các phiên ĐÃ CHỐT cùng loại tảng, ngày
-- pha trong 30 ngày tính tới ngày pha của phiên này (không tính chính nó).
create or replace function kho_thu_hoi_du_kien(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ph kho_phien_pha;
  v_ct uuid;
  v_ct_tl numeric;
  v_tb numeric;
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  v_ct := v_ph.cong_thuc_id;
  if v_ct is null then
    select c.id into v_ct from kho_cong_thuc_pha c
    where c.mat_hang_vao_id = v_ph.mat_hang_vao_id and c.dang_dung
    order by c.thu_tu, c.ten limit 1;
  end if;
  if v_ct is not null then
    select nullif(sum(d.ty_le_du_kien), 0) into v_ct_tl
    from kho_cong_thuc_pha_dong d
    join kho_mat_hang m on m.id = d.mat_hang_ra_id
    where d.cong_thuc_id = v_ct and m.loai <> 'phu_pham' and coalesce(d.xu_ly, m.xu_ly_mac_dinh) <> 'bo';
  end if;

  select round(sum(f.tong_kg_thit) * 100 / nullif(sum(f.tong_kg_vao), 0), 2) into v_tb
  from kho_phien_pha f
  where f.chi_nhanh_id = v_ph.chi_nhanh_id and f.mat_hang_vao_id = v_ph.mat_hang_vao_id
    and f.trang_thai = 'da_chot' and f.id <> p_id
    and f.ngay_pha between v_ph.ngay_pha - 30 and v_ph.ngay_pha;

  return jsonb_build_object(
    'ty_le_du_kien', coalesce(v_ct_tl, v_tb),
    'nguon_du_kien', case when v_ct_tl is not null then 'cong_thuc' when v_tb is not null then 'tb_30_ngay' end,
    'ty_le_cong_thuc', v_ct_tl,
    'ty_le_tb_30_ngay', v_tb,
    'cong_thuc_id', v_ct);
end;
$$;

comment on function kho_thu_hoi_du_kien is
  'NỘI BỘ. Thu hồi dự kiến của phiên pha lóc: tổng tỉ lệ các dòng thịt của công thức, không có thì trung bình 30 ngày. Không tiền.';

-- ---- Thay THÂN kho_chot_phien_pha (0022) — chép nguyên văn; chỗ đổi có ghi 0033.
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
  v_dk      jsonb;      -- 0033
  v_nguong  numeric;
  v_thap    boolean;
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

  -- 0033: so với thu hồi dự kiến; thấp quá ngưỡng thì báo quản lý (không chặn).
  v_dk := kho_thu_hoi_du_kien(p_id);
  select nguong_thu_hoi_diem into v_nguong from kho_cai_dat where chi_nhanh_id = v_ph.chi_nhanh_id;
  v_thap := coalesce((v_tinh ->> 'ty_le_thu_hoi')::numeric
                     < (v_dk ->> 'ty_le_du_kien')::numeric - coalesce(v_nguong, 3), false);

  update kho_phien_pha set
    trang_thai       = 'da_chot',
    tong_kg_vao      = (v_tinh ->> 'tong_kg_vao')::numeric,
    tong_kg_thit     = (v_tinh ->> 'tong_kg_thit')::numeric,
    tong_kg_phu_pham = (v_tinh ->> 'tong_kg_phu_pham')::numeric,
    tong_kg_bo       = (v_tinh ->> 'tong_kg_bo')::numeric,
    tong_kg_hao_hut  = (v_tinh ->> 'tong_kg_hao_hut')::numeric,
    ty_le_thu_hoi    = (v_tinh ->> 'ty_le_thu_hoi')::numeric,
    ty_le_du_kien    = (v_dk ->> 'ty_le_du_kien')::numeric,   -- 0033
    nguon_du_kien    = v_dk ->> 'nguon_du_kien',
    thu_hoi_thap     = v_thap,
    da_xem_boi       = null,
    da_xem_luc       = null,
    da_xem_ghi_chu   = null,
    nguoi_chot       = v_nv.id,
    chot_luc         = now(),
    phien_ban        = phien_ban + 1
  where id = p_id;

  return 'Đã chốt phiên ' || v_ph.so_phieu || ': thu hồi '
    || replace(coalesce(v_tinh ->> 'ty_le_thu_hoi', '0'), '.', ',') || '%, '
    || v_so_lo || ' lô mới.'
    || case when v_thap then ' Thu hồi thấp hơn dự kiến ('
                             || replace((v_dk ->> 'ty_le_du_kien'), '.', ',') || '%) — đã báo quản lý.'
            else '' end;   -- 0033
end;
$$;

comment on function kho_chot_phien_pha is
  'Chốt phiên pha lóc: trừ tảng, sinh lô cho từng phần giữ lại với giá vốn đã chia (tổng ra = tổng vào). Phần chuyển bếp thành lô rồi xuất bếp ngay. 0033: ghi thu hồi dự kiến; thấp hơn quá nguong_thu_hoi_diem thì bật thu_hoi_thap (báo quản lý).';

-- ---- Thay THÂN kho_mo_lai_phien_pha (0022) — chép nguyên văn; chỗ đổi có ghi 0033.
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
    nguoi_chot = null, chot_luc = null, phien_ban = phien_ban + 1,
    -- 0033: kết quả cũ hết giá trị — chốt lại sẽ so lại.
    ty_le_du_kien = null, nguon_du_kien = null, thu_hoi_thap = false,
    da_xem_boi = null, da_xem_luc = null, da_xem_ghi_chu = null
  where id = p_id;

  return 'Đã mở lại phiên ' || v_ph.so_phieu || ' — tồn đã trả về như trước khi chốt. Sửa xong nhớ chốt lại.';
end;
$$;

-- Quản lý bấm "Đã xem" kết quả một phiên đã chốt (thường là phiên thu hồi
-- thấp) → hết sự kiện thu_hoi_thap. Pha lóc vẫn không duyệt: đây chỉ là ghi
-- nhận đã biết. Bấm lại không đổi người / giờ đã ghi.
create or replace function kho_xac_nhan_phien_pha(p_id uuid, p_ghi_chu text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ph kho_phien_pha;
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found or not kho_duoc(v_ph.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy phiên pha lóc, hoặc tài khoản không được xác nhận'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_ph from kho_phien_pha where id = p_id for update;
  if v_ph.trang_thai <> 'da_chot' then
    raise exception 'Phiên % chưa chốt — chưa có kết quả để xem', v_ph.so_phieu using errcode = 'check_violation';
  end if;
  if length(coalesce(p_ghi_chu, '')) > 500 then
    raise exception 'Ghi chú tối đa 500 chữ' using errcode = 'check_violation';
  end if;
  if v_ph.da_xem_luc is not null then
    return 'Phiên ' || v_ph.so_phieu || ' đã được xem trước đó.';
  end if;
  update kho_phien_pha set
    da_xem_boi = (nhan_su_hien_tai()).id, da_xem_luc = now(), da_xem_ghi_chu = nullif(btrim(p_ghi_chu), '')
  where id = p_id;
  return 'Đã ghi nhận: đã xem kết quả phiên ' || v_ph.so_phieu || '.';
end;
$$;

comment on function kho_xac_nhan_phien_pha is
  'Quản lý (quyền duyet) ghi nhận đã xem kết quả một phiên pha lóc đã chốt — hết báo thu hồi thấp. Không đổi sổ kho, không đổi phien_ban.';


-- =============================================================================
-- 6 · THẺ KHO — không tiền, quyền xem
-- =============================================================================
-- Dòng đầu: loai = 'dau_ky' ("Tồn đầu kỳ", tồn trước p_tu; p_tu null = từ đầu,
-- tồn đầu 0). Sau đó từng dòng sổ kho có ngày trong [p_tu, p_den] (p_den null =
-- hôm nay), theo ngày rồi thứ tự ghi; ton_kg / ton_goi là tồn lũy kế sau dòng
-- đó. p_vi_tri_id null = cả chi nhánh, kể cả "Đang mang ra quầy" và "Hàng chờ
-- hủy" (tồn cuối = tổng kho_ton của món); chuyển nội bộ hiện cả hai dòng.
-- Dòng dao_nguoc (hủy / mở lại phiếu) giữ đúng số chứng từ của phiếu gốc.
create or replace function kho_the_kho(
  p_chi_nhanh_id uuid,
  p_mat_hang_id  uuid,
  p_vi_tri_id    uuid,
  p_tu           date,
  p_den          date
)
returns table (
  ngay date, loai text, ten_loai text, so_chung_tu text, chung_tu_loai text, chung_tu_id uuid,
  vi_tri text, ma_lo text, nhap_kg numeric, xuat_kg numeric, ton_kg numeric,
  nhap_goi int, xuat_goi int, ton_goi int, dien_giai text, lo_id uuid, vi_tri_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_den      date := coalesce(p_den, hom_nay_vn());
  v_dau_kg   numeric := 0;
  v_dau_goi  int := 0;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  if p_mat_hang_id is null or not exists (select 1 from kho_mat_hang m where m.id = p_mat_hang_id) then
    raise exception 'Không tìm thấy mặt hàng' using errcode = 'foreign_key_violation';
  end if;
  if p_vi_tri_id is not null and not exists (
       select 1 from kho_vi_tri v where v.id = p_vi_tri_id and v.chi_nhanh_id = p_chi_nhanh_id) then
    raise exception 'Vị trí không thuộc chi nhánh này' using errcode = 'check_violation';
  end if;
  if p_tu is not null and p_tu > v_den then
    raise exception 'Từ ngày phải trước đến ngày' using errcode = 'check_violation';
  end if;

  if p_tu is not null then
    select coalesce(sum(s.so_kg), 0), coalesce(sum(s.so_goi), 0)::int into v_dau_kg, v_dau_goi
    from kho_so_cai s
    where s.chi_nhanh_id = p_chi_nhanh_id and s.mat_hang_id = p_mat_hang_id
      and (p_vi_tri_id is null or s.vi_tri_id = p_vi_tri_id)
      and s.ngay < p_tu;
  end if;

  return query select p_tu, 'dau_ky'::text, 'Tồn đầu kỳ'::text, null::text, null::text, null::uuid,
    null::text, null::text, null::numeric, null::numeric, v_dau_kg, null::int, null::int, v_dau_goi,
    null::text, null::uuid, null::uuid;

  return query
    select s.ngay, s.loai,
           case s.loai
             when 'nhap' then 'Nhập' when 'pha_loc_vao' then 'Đem pha lóc' when 'pha_loc_ra' then 'Pha lóc ra'
             when 'chuyen_di' then 'Chuyển đi' when 'chuyen_den' then 'Chuyển đến' when 'ban' then 'Bán'
             when 'xuat_bep' then 'Xuất bếp' when 'huy' then 'Hủy' when 'kiem_ke' then 'Chênh lệch kiểm kê'
             when 'hao_hut' then 'Hao hụt cân' when 'dao_nguoc' then 'Đảo ngược' when 'tra_ncc' then 'Trả nhà cung cấp'
             when 'xuat_khac' then 'Xuất khác' else s.loai end,
           case s.chung_tu_loai
             when 'phieu_nhap' then pn.so_phieu when 'phien_pha' then pp.so_phieu
             when 'phieu_xuat' then px.so_phieu when 'kiem_ke' then kk.so_phieu end,
           s.chung_tu_loai, s.chung_tu_id, v.ten, l.ma_lo,
           greatest(s.so_kg, 0), greatest(-s.so_kg, 0),
           v_dau_kg + sum(s.so_kg) over w,
           greatest(s.so_goi, 0), greatest(-s.so_goi, 0),
           (v_dau_goi + sum(s.so_goi) over w)::int,
           coalesce(s.ghi_chu,
             case s.chung_tu_loai
               when 'phieu_nhap' then case when pn.loai = 'ton_dau' then 'Khai tồn đầu kỳ' else 'Nhập từ ' || ncc.ten end
               when 'phien_pha' then 'Pha lóc ' || mv.ten
               when 'phieu_xuat' then coalesce(ld.ten, px.ghi_chu)
             end),
           s.lo_id, s.vi_tri_id
    from kho_so_cai s
    join kho_vi_tri v on v.id = s.vi_tri_id
    join kho_lo l on l.id = s.lo_id
    left join kho_phieu_nhap pn on s.chung_tu_loai = 'phieu_nhap' and pn.id = s.chung_tu_id
    left join kho_nha_cung_cap ncc on ncc.id = pn.nha_cung_cap_id
    left join kho_phien_pha pp on s.chung_tu_loai = 'phien_pha' and pp.id = s.chung_tu_id
    left join kho_mat_hang mv on mv.id = pp.mat_hang_vao_id
    left join kho_phieu_xuat px on s.chung_tu_loai = 'phieu_xuat' and px.id = s.chung_tu_id
    left join kho_ly_do ld on ld.id = px.ly_do_id
    left join kho_kiem_ke kk on s.chung_tu_loai = 'kiem_ke' and kk.id = s.chung_tu_id
    where s.chi_nhanh_id = p_chi_nhanh_id and s.mat_hang_id = p_mat_hang_id
      and (p_vi_tri_id is null or s.vi_tri_id = p_vi_tri_id)
      and (p_tu is null or s.ngay >= p_tu) and s.ngay <= v_den
    window w as (order by s.ngay, s.created_at, s.id rows between unbounded preceding and current row)
    order by s.ngay, s.created_at, s.id;
end;
$$;

comment on function kho_the_kho is
  'Thẻ kho của một món (quyền xem, KHÔNG tiền): dòng đầu "Tồn đầu kỳ" (loai dau_ky), rồi từng dòng sổ kho trong kỳ theo thời gian, cột tồn lũy kế. p_vi_tri_id null = cả chi nhánh (kể cả hàng đang mang ra quầy, chờ hủy); p_tu null = từ đầu; p_den null = hôm nay.';


-- =============================================================================
-- 7 · XEM THỬ CHỈ KG — thay THÂN (0031), thêm dự kiến / TB 30 ngày; chỗ đổi có ghi 0033
-- =============================================================================
create or replace function kho_xem_thu_phien_pha_kg(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ph      kho_phien_pha;
  v_kg_vao  numeric;
  v_kg_ra   numeric;
  v_kg_thit numeric;
  v_kg_pp   numeric;
  v_kg_bo   numeric;
  v_dong    jsonb;
  v_canh_bao text[] := '{}';
  v_dk      jsonb;      -- 0033
  v_nguong  numeric;
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found or not (kho_duoc(v_ph.chi_nhanh_id, 'pha_loc') or kho_duoc(v_ph.chi_nhanh_id, 'xem_gia')) then
    raise exception 'Không tìm thấy phiên pha lóc, hoặc tài khoản không được xem'
      using errcode = 'insufficient_privilege';
  end if;

  select coalesce(sum(v.so_kg), 0) into v_kg_vao
  from kho_phien_pha_vao v where v.phien_pha_id = p_id;

  with ra as (
    select r.id, r.thu_tu, r.mat_hang_id, m.ten, r.so_kg, r.so_goi, r.xu_ly, r.tu_quet, r.vi_tri_id,
           case when r.xu_ly = 'bo' then 'bo'
                when m.loai = 'phu_pham' then 'phu_pham'
                else 'thit' end as nhom
    from kho_phien_pha_ra r
    join kho_mat_hang m on m.id = r.mat_hang_id
    where r.phien_pha_id = p_id
  )
  select coalesce(sum(so_kg), 0),
         coalesce(sum(so_kg) filter (where nhom = 'thit'), 0),
         coalesce(sum(so_kg) filter (where nhom = 'phu_pham'), 0),
         coalesce(sum(so_kg) filter (where nhom = 'bo'), 0),
         coalesce(jsonb_agg(jsonb_build_object(
           'ra_id', id, 'mat_hang_id', mat_hang_id, 'ten', ten, 'nhom', nhom, 'so_kg', so_kg,
           'ty_le', case when v_kg_vao > 0 then round(so_kg * 100 / v_kg_vao, 2) end,
           -- 0033
           'so_goi', so_goi, 'xu_ly', xu_ly, 'tu_quet', tu_quet, 'vi_tri_id', vi_tri_id)
           order by thu_tu, id), '[]'::jsonb)
    into v_kg_ra, v_kg_thit, v_kg_pp, v_kg_bo, v_dong
  from ra;

  if v_kg_vao = 0 then
    v_canh_bao := v_canh_bao || 'Chưa chọn tảng nào đem pha'::text;
  end if;
  if jsonb_array_length(v_dong) = 0 then
    v_canh_bao := v_canh_bao || 'Chưa nhập phần nào cắt ra'::text;
  end if;
  -- Cùng ngưỡng 0,05 kg với kho_chot_phien_pha: vượt là chốt bị từ chối.
  if v_kg_vao > 0 and v_kg_ra > v_kg_vao + 0.05 then
    v_canh_bao := v_canh_bao || 'Tổng kg ra lớn hơn kg vào — kiểm lại số cân'::text;
  end if;

  -- 0033: thu hồi dự kiến và trung bình 30 ngày cho màn kết quả. Phiên đã
  -- chốt thì dự kiến là số đã ghi lúc chốt.
  v_dk := kho_thu_hoi_du_kien(p_id);
  select nguong_thu_hoi_diem into v_nguong from kho_cai_dat where chi_nhanh_id = v_ph.chi_nhanh_id;

  return jsonb_build_object(
    'tong_kg_vao',    v_kg_vao,
    'kg_thit',        v_kg_thit,
    'kg_phu_pham',    v_kg_pp,
    'kg_bo',          v_kg_bo,
    'kg_hao_hut',     v_kg_vao - v_kg_thit - v_kg_pp - v_kg_bo,
    'ty_le_thu_hoi',  case when v_kg_vao > 0 then round(v_kg_thit * 100 / v_kg_vao, 2) end,
    'dong',           v_dong,
    'canh_bao',       to_jsonb(v_canh_bao),
    -- 0033
    'ty_le_du_kien',       case when v_ph.trang_thai = 'da_chot' then v_ph.ty_le_du_kien
                                else (v_dk ->> 'ty_le_du_kien')::numeric end,
    'nguon_du_kien',       case when v_ph.trang_thai = 'da_chot' then v_ph.nguon_du_kien
                                else v_dk ->> 'nguon_du_kien' end,
    'ty_le_tb_30_ngay',    (v_dk ->> 'ty_le_tb_30_ngay')::numeric,
    'nguong_thu_hoi_diem', v_nguong,
    'thu_hoi_thap',        v_ph.thu_hoi_thap,
    'da_xem_luc',          v_ph.da_xem_luc);
end;
$$;

comment on function kho_xem_thu_phien_pha_kg is
  'Xem thử phiên pha lóc bằng kg và % (quyền pha_loc hoặc xem_gia): tổng vào, thịt, phụ phẩm, bỏ, hao hụt, thu hồi, từng phần ra. KHÔNG có tiền. 0033: thêm ty_le_du_kien, nguon_du_kien, ty_le_tb_30_ngay, nguong_thu_hoi_diem, thu_hoi_thap, da_xem_luc; dòng có so_goi, xu_ly, tu_quet, vi_tri_id.';


-- =============================================================================
-- 8 · SỰ KIỆN VÀ SỐ ĐỎ — thay THÂN (cùng chữ ký), chép 0032, thêm 0033
-- =============================================================================
--   thu_hoi_thap  nhac_nho  quản lý, chủ (duyet): phiên pha lóc thu hồi thấp hơn
--                           dự kiến quá nguong_thu_hoi_diem, chưa bấm "Đã xem".
-- Số đỏ mới: thu_hoi_thap.
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
                         and thu_hoi_thap and da_xem_luc is null));
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
  'Mọi số đỏ trên menu kho của người đang đăng nhập ở một chi nhánh, trong MỘT lần gọi. Khóa nào không có quyền thì vắng mặt. Chỉ đếm, không tiền. duyet_nhap theo quyền duyet_nhap (0031); yeu_cau_quay, hang_dang_chuyen, hang_chuyen_qua_gio, chuyen_nhan_thieu (0032); thu_hoi_thap (0033).';



-- ---- View — thêm cột Ở CUỐI -------------------------------------------------
create or replace view kho_v_phien_pha with (security_invoker = true) as
select p.id, p.chi_nhanh_id, p.so_phieu, p.trang_thai, p.phien_ban,
       p.mat_hang_vao_id, m.ten as ten_mat_hang_vao, m.ma as ma_mat_hang_vao,
       p.cong_thuc_id, p.ngay_pha, p.ghi_chu, p.ly_do,
       p.tong_kg_vao, p.tong_kg_thit, p.tong_kg_phu_pham, p.tong_kg_bo,
       p.tong_kg_hao_hut, p.ty_le_thu_hoi,
       p.nguoi_tao, p.nguoi_chot, p.chot_luc, p.created_at,
       (select count(*) from kho_phien_pha_vao v where v.phien_pha_id = p.id)::int as so_dau_vao,
       (select count(*) from kho_phien_pha_ra r where r.phien_pha_id = p.id)::int as so_dau_ra,
       (select coalesce(sum(v.so_kg), 0) from kho_phien_pha_vao v where v.phien_pha_id = p.id) as kg_vao_nhap,
       (select coalesce(sum(r.so_kg), 0) from kho_phien_pha_ra r where r.phien_pha_id = p.id) as kg_ra_nhap,
       -- 0033
       p.ty_le_du_kien, p.nguon_du_kien, p.thu_hoi_thap, p.da_xem_boi, p.da_xem_luc, p.da_xem_ghi_chu,
       (select count(*) from kho_phien_pha_quet q where q.phien_pha_id = p.id)::int as so_nhan_quet
from kho_phien_pha p
join kho_mat_hang m on m.id = p.mat_hang_vao_id;


-- =============================================================================
-- 9 · PHÂN QUYỀN — như phiên pha lóc (0031): vai pha_loc hoặc xem_gia đọc
-- =============================================================================
alter table kho_phien_pha_lan_quet enable row level security;
alter table kho_phien_pha_quet     enable row level security;

create policy kho_phien_pha_lan_quet_doc on kho_phien_pha_lan_quet
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[])
                    or chi_nhanh_id = any ((select kho_cn_duoc('pha_loc'))::uuid[]));
create policy kho_phien_pha_quet_doc on kho_phien_pha_quet
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[])
                    or chi_nhanh_id = any ((select kho_cn_duoc('pha_loc'))::uuid[]));


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_vi_tri_sau_pha(uuid, text) from authenticated';
    execute 'revoke execute on function kho_phien_pha_tinh_quet(uuid) from authenticated';
    execute 'revoke execute on function kho_phien_pha_tra_quet(uuid, boolean, int, jsonb) from authenticated';
    execute 'revoke execute on function kho_thu_hoi_du_kien(uuid) from authenticated';
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
