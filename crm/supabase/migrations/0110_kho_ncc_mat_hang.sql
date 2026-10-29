-- =============================================================================
-- BEEFTOWN KHO — 0110 · DANH MỤC HÀNG CỦA TỪNG NHÀ CUNG CẤP (đợt 1: nhận hàng)
-- =============================================================================
-- PHẢI CHẠY SAU 0105 (kho_mat_hang, kho_phieu_nhap ở bản cuối). Không đổi bảng hay hàm cũ nào.
--
-- Khánh chốt 29/10/2026: phần nhà cung cấp quan trọng — chọn nhà cung cấp rồi chọn món, hoặc chọn món rồi chọn nhà
-- cung cấp, ở cả Nhận hàng và Đặt hàng. Danh sách "NCC nào bán món nào" máy tự học, quản lý sửa tay được. Đợt 1 làm
-- màn Nhận hàng và màn cài đặt; Đặt hàng hai lối là đợt sau.
--
-- Trước 0110 không có chỗ nào ghi NCC bán món gì: nút món ở bước 2 của Nhận hàng đoán từ ba phiếu gần nhất có tên
-- NCC giống (tìm theo chữ), gợi ý đặt hàng lấy "món NCC giao gần nhất". NCC mới hay lâu không giao thì không có nút.
--
-- Cách làm — tự học tính lúc đọc, không chép:
--   · Cặp (NCC, món) "đã giao" = có trên một phiếu MUA đã gửi hoặc đã duyệt, ở BẤT KỲ chi nhánh nào (nhà cung cấp và
--     mặt hàng dùng chung mọi chi nhánh). Phiếu nháp, bị trả về, đã hủy không tính — tính lúc đọc nên phiếu hủy sau
--     tự rơi khỏi danh sách, không có bảng chép nào để lệch.
--   · Bảng kho_ncc_mat_hang chỉ giữ phần người sửa tay: thêm cặp chưa từng giao, bỏ cặp sai (dang_dung = false — bỏ
--     rồi thì giữ bỏ, phiếu sau có giao lại cũng không tự hiện lại), đánh dấu NCC chính của món (mỗi món tối đa một).
--
-- Đổi trong file này:
--   1. kho_ncc_mat_hang (bảng mới): phần sửa tay. Đọc: vai ncc (quản lý, chủ, kế toán). Ghi: chỉ qua
--      kho_luu_ncc_mat_hang.
--   2. kho_ds_ncc_mat_hang(chi nhánh) — hàm đọc mới, vai nhap hoặc ncc của chi nhánh: mọi cặp của NCC và món đang
--      dùng — NCC chính, đã bỏ, thêm tay, đã giao (mọi chi nhánh), và ở CHI NHÁNH NÀY: số lần giao, ngày giao gần nhất,
--      kg và số gói / cái của món đó trên phiếu gần nhất. Không có tiền: thủ kho đọc được.
--   3. kho_luu_ncc_mat_hang(NCC, món, việc) — hàm ghi mới, vai ncc: 'them' (thêm / thêm lại), 'bo' (bỏ khỏi danh
--      sách), 'chinh' (NCC chính của món — NCC chính cũ của món đó thôi là chính), 'bo_chinh'. Bấm hai lần ra cùng một
--      trạng thái.
-- Một bảng mới, hai hàm mới.
--
-- Triển khai: chạy migration trước, deploy web sau (web mới gọi hai hàm mới; web cũ không gọi). Không có câu xoá.
-- Chỉ chạy lên production sau khi PR được gộp, rồi `npm run doi-chieu` phải báo KHỚP.
-- =============================================================================


-- =============================================================================
-- 1 · kho_ncc_mat_hang — PHẦN SỬA TAY CỦA DANH MỤC NCC – MÓN
-- =============================================================================
create table kho_ncc_mat_hang (
  nha_cung_cap_id uuid not null references kho_nha_cung_cap(id) on delete cascade,
  mat_hang_id     uuid not null references kho_mat_hang(id) on delete cascade,
  -- false = người sửa tay đã bỏ cặp này: không hiện thành nút dù phiếu cũ có giao.
  dang_dung       boolean not null default true,
  la_chinh        boolean not null default false,
  nguoi_sua       uuid references nhan_su(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  primary key (nha_cung_cap_id, mat_hang_id),
  constraint kho_ncc_mat_hang_chinh_dang_dung check (dang_dung or not la_chinh)
);

-- Mỗi món tối đa một NCC chính.
create unique index kho_ncc_mat_hang_chinh_idx on kho_ncc_mat_hang(mat_hang_id) where la_chinh;
create index kho_ncc_mat_hang_mon_idx on kho_ncc_mat_hang(mat_hang_id);

create trigger kho_ncc_mat_hang_updated_at
  before update on kho_ncc_mat_hang
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_ncc_mat_hang is
  'Phần sửa tay của danh mục "NCC nào bán món nào" (0110): thêm cặp chưa từng giao, bỏ cặp sai, NCC chính của món. Phần tự học (cặp có trên phiếu mua đã gửi / đã duyệt) tính lúc đọc trong kho_ds_ncc_mat_hang, không chép vào đây. Chỉ ghi qua kho_luu_ncc_mat_hang.';
comment on column kho_ncc_mat_hang.dang_dung is
  'false = đã bỏ tay khỏi danh sách món của NCC — không tự hiện lại khi phiếu sau giao món đó (0110).';
comment on column kho_ncc_mat_hang.la_chinh is
  'NCC chính của món: lên đầu khi chọn món trước rồi chọn NCC. Mỗi món tối đa một (kho_ncc_mat_hang_chinh_idx, 0110).';

alter table kho_ncc_mat_hang enable row level security;
-- Đọc thẳng bảng: người sửa nhà cung cấp. Thủ kho đọc qua kho_ds_ncc_mat_hang. Không có policy ghi.
create policy kho_ncc_mat_hang_doc on kho_ncc_mat_hang
  for select using ((select kho_co_quyen('ncc')));


-- =============================================================================
-- 2 · kho_ds_ncc_mat_hang — ĐỌC DANH MỤC (TỰ HỌC + SỬA TAY), KHÔNG CÓ TIỀN
-- =============================================================================
create or replace function kho_ds_ncc_mat_hang(p_chi_nhanh_id uuid)
returns table (
  nha_cung_cap_id uuid,
  mat_hang_id     uuid,
  la_chinh        boolean,
  da_bo           boolean,
  them_tay        boolean,
  da_giao         boolean,
  so_lan          int,
  lan_cuoi        date,
  kg_lan_cuoi     numeric,
  goi_lan_cuoi    int
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (kho_duoc(p_chi_nhanh_id, 'nhap') or kho_duoc(p_chi_nhanh_id, 'ncc')) then
    raise exception 'Tài khoản của bạn không được xem nhà cung cấp ở chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;

  return query
    with theo_phieu as (
      -- Một dòng cho mỗi (NCC, món, phiếu): món chia nhiều dòng trên một phiếu (mỗi tảng một dòng) cộng lại.
      select p.nha_cung_cap_id as ncc, d.mat_hang_id as mh, p.id as phieu, p.chi_nhanh_id as cn,
             p.ngay_nhap, p.created_at, sum(d.so_kg) as kg, sum(d.so_goi)::int as goi
      from kho_phieu_nhap p
      join kho_phieu_nhap_dong d on d.phieu_nhap_id = p.id
      where p.loai = 'mua' and p.nha_cung_cap_id is not null
        and p.trang_thai in ('cho_duyet', 'da_duyet')
      group by p.nha_cung_cap_id, d.mat_hang_id, p.id, p.chi_nhanh_id, p.ngay_nhap, p.created_at
    ),
    o_day as (
      -- Chỉ chi nhánh đang xem: lần giao gần nhất và số lần.
      select t.ncc, t.mh, count(*)::int as so_lan,
             (array_agg(t.ngay_nhap order by t.ngay_nhap desc, t.created_at desc))[1] as lan_cuoi,
             (array_agg(t.kg order by t.ngay_nhap desc, t.created_at desc))[1] as kg,
             (array_agg(t.goi order by t.ngay_nhap desc, t.created_at desc))[1] as goi
      from theo_phieu t
      where t.cn = p_chi_nhanh_id
      group by t.ncc, t.mh
    ),
    cap as (
      select x.ncc, x.mh, bool_or(x.da_giao) as da_giao
      from (
        select distinct t.ncc, t.mh, true as da_giao from theo_phieu t
        union all
        select s.nha_cung_cap_id, s.mat_hang_id, false from kho_ncc_mat_hang s
      ) x
      group by x.ncc, x.mh
    )
    select c.ncc, c.mh,
           coalesce(s.la_chinh, false),
           coalesce(not s.dang_dung, false),
           coalesce(s.dang_dung, false),
           c.da_giao,
           coalesce(o.so_lan, 0),
           o.lan_cuoi,
           o.kg,
           o.goi
    from cap c
    join kho_nha_cung_cap n on n.id = c.ncc and n.dang_dung
    join kho_mat_hang m on m.id = c.mh and m.dang_dung
    left join kho_ncc_mat_hang s on s.nha_cung_cap_id = c.ncc and s.mat_hang_id = c.mh
    left join o_day o on o.ncc = c.ncc and o.mh = c.mh
    order by n.ten, coalesce(s.la_chinh, false) desc, o.lan_cuoi desc nulls last, m.ten;
end;
$$;

comment on function kho_ds_ncc_mat_hang(uuid) is
  'Danh mục NCC – món (0110): cặp đã giao (phiếu mua đã gửi / đã duyệt, mọi chi nhánh) cộng cặp thêm tay, chỉ NCC và món đang dùng. da_bo = đã bỏ tay (web không hiện thành nút). Số lần, lần cuối, kg / gói của lần cuối tính ở chi nhánh truyền vào. Không có tiền — vai nhap (thủ kho) hoặc ncc.';


-- =============================================================================
-- 3 · kho_luu_ncc_mat_hang — SỬA TAY MỘT CẶP
-- =============================================================================
create or replace function kho_luu_ncc_mat_hang(p_nha_cung_cap_id uuid, p_mat_hang_id uuid, p_viec text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nguoi uuid;
begin
  if not kho_co_quyen('ncc') then
    raise exception 'Tài khoản của bạn không được sửa nhà cung cấp'
      using errcode = 'insufficient_privilege';
  end if;
  if p_viec is null or p_viec not in ('them', 'bo', 'chinh', 'bo_chinh') then
    raise exception 'Việc với món của nhà cung cấp không hợp lệ';
  end if;
  if not exists (select 1 from kho_nha_cung_cap where id = p_nha_cung_cap_id and dang_dung) then
    raise exception 'Chọn nhà cung cấp đang dùng';
  end if;
  -- Khóa dòng món: hai người cùng đặt NCC chính cho một món thì người sau chờ, không vấp chỉ mục duy nhất.
  perform 1 from kho_mat_hang where id = p_mat_hang_id and dang_dung for update;
  if not found then
    raise exception 'Chọn mặt hàng đang dùng';
  end if;

  v_nguoi := (nhan_su_hien_tai()).id;

  if p_viec = 'chinh' then
    update kho_ncc_mat_hang
       set la_chinh = false, nguoi_sua = v_nguoi
     where mat_hang_id = p_mat_hang_id and la_chinh and nha_cung_cap_id <> p_nha_cung_cap_id;
  end if;

  insert into kho_ncc_mat_hang (nha_cung_cap_id, mat_hang_id, dang_dung, la_chinh, nguoi_sua)
  values (p_nha_cung_cap_id, p_mat_hang_id, p_viec <> 'bo', p_viec = 'chinh', v_nguoi)
  on conflict (nha_cung_cap_id, mat_hang_id) do update
    set dang_dung = excluded.dang_dung,
        -- 'them' giữ nguyên NCC chính nếu đã là chính; 'bo', 'bo_chinh' thôi là chính.
        la_chinh  = case p_viec when 'chinh' then true
                                when 'them' then kho_ncc_mat_hang.la_chinh
                                else false end,
        nguoi_sua = excluded.nguoi_sua;
end;
$$;

comment on function kho_luu_ncc_mat_hang(uuid, uuid, text) is
  'Sửa tay một cặp NCC – món (0110), vai ncc: them (thêm / thêm lại), bo (bỏ khỏi danh sách, thôi là chính), chinh (NCC chính của món — NCC chính cũ thôi là chính), bo_chinh. Bấm hai lần ra cùng trạng thái.';


-- =============================================================================
-- 4 · THU QUYỀN — đúng các hàm của file này (0008 mục 6)
-- =============================================================================
-- Hai hàm mới: authenticated gọi được (tự kiểm vai ở câu đầu), anon thì không. Danh sách anon không đổi.
do $$
begin
  execute 'revoke execute on function kho_ds_ncc_mat_hang(uuid) from public';
  execute 'revoke execute on function kho_luu_ncc_mat_hang(uuid, uuid, text) from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function kho_ds_ncc_mat_hang(uuid) from anon';
    execute 'revoke execute on function kho_luu_ncc_mat_hang(uuid, uuid, text) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function kho_ds_ncc_mat_hang(uuid) to authenticated';
    execute 'grant execute on function kho_luu_ncc_mat_hang(uuid, uuid, text) to authenticated';
  end if;
end
$$;
