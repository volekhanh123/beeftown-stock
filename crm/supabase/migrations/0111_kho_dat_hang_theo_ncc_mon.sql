-- =============================================================================
-- BEEFTOWN KHO — 0111 · ĐẶT HÀNG THEO DANH MỤC NHÀ CUNG CẤP – MÓN (đợt 2)
-- =============================================================================
-- PHẢI CHẠY SAU 0110 (bảng kho_ncc_mat_hang).
--
-- Khánh chốt 29/10/2026: chọn nhà cung cấp rồi chọn món, hoặc chọn món rồi chọn nhà cung cấp, ở cả Nhận hàng và Đặt
-- hàng (đợt 1 — 0110 — làm Nhận hàng). Đợt này làm Đặt hàng:
--   · chọn NCC trước: gợi ý liệt kê MỌI món của NCC đó theo danh mục NCC – món, không còn chỉ món mà NCC này là người
--     giao gần nhất (trước 0111, món đổi sang NCC khác giao thì biến khỏi gợi ý của NCC cũ, NCC mới chưa giao lần nào
--     thì không có gợi ý);
--   · chọn món trước (trang web mới "Đặt theo món"): gợi ý không chọn NCC trả mỗi món MỘT NCC đề xuất — NCC chính của
--     món, không có thì NCC giao gần nhất ở chi nhánh này, rồi theo tên — web gom thành mỗi NCC một đơn nháp.
--
-- Đổi trong file này:
--   1. kho_cap_ncc_mon(NCC) — hàm NỘI BỘ mới (security invoker, chỉ hàm definer gọi; thu cả authenticated): các cặp
--      (NCC, món, NCC chính) của danh mục — tự học từ phiếu mua đã gửi / đã duyệt ở mọi chi nhánh, cộng cặp thêm tay,
--      trừ cặp đã bỏ, chỉ NCC và món đang dùng. Cùng luật với kho_ds_ncc_mat_hang (0110) — test-kho-dat-hang-theo-mon
--      so hai hàm cho cùng một tập cặp.
--   2. kho_goi_y_dat_hang (thân chép 0039, cùng chữ ký, cùng cột trả về): CTE gan_nhat lấy từ kho_cap_ncc_mon; phần
--      tính số kg không đổi.
-- Một hàm mới (nội bộ), một hàm thay thân.
--
-- Triển khai: chạy migration trước, deploy web sau (trang "Đặt theo món" gọi gợi ý không chọn NCC). Web cũ vẫn chạy
-- được với gợi ý mới (cùng cột). Không có câu xoá. Chỉ chạy lên production sau khi PR được gộp, rồi
-- `npm run doi-chieu` phải báo KHỚP.
-- =============================================================================


-- =============================================================================
-- 1 · kho_cap_ncc_mon — CÁC CẶP CỦA DANH MỤC NCC – MÓN (NỘI BỘ)
-- =============================================================================
create or replace function kho_cap_ncc_mon(p_ncc uuid default null)
returns table (nha_cung_cap_id uuid, mat_hang_id uuid, la_chinh boolean)
language sql
stable
set search_path = public
as $$
  select x.ncc, x.mh, bool_or(x.chinh)
  from (
    select distinct p.nha_cung_cap_id as ncc, d.mat_hang_id as mh, false as chinh
    from kho_phieu_nhap p
    join kho_phieu_nhap_dong d on d.phieu_nhap_id = p.id
    where p.loai = 'mua' and p.nha_cung_cap_id is not null
      and p.trang_thai in ('cho_duyet', 'da_duyet')
      and (p_ncc is null or p.nha_cung_cap_id = p_ncc)
    union all
    select s.nha_cung_cap_id, s.mat_hang_id, s.la_chinh
    from kho_ncc_mat_hang s
    where s.dang_dung and (p_ncc is null or s.nha_cung_cap_id = p_ncc)
  ) x
  join kho_nha_cung_cap n on n.id = x.ncc and n.dang_dung
  join kho_mat_hang m on m.id = x.mh and m.dang_dung
  where not exists (
    select 1 from kho_ncc_mat_hang b
    where b.nha_cung_cap_id = x.ncc and b.mat_hang_id = x.mh and not b.dang_dung
  )
  group by x.ncc, x.mh;
$$;

comment on function kho_cap_ncc_mon(uuid) is
  'Nội bộ (0111): các cặp (NCC, món, NCC chính) của danh mục NCC – món — tự học từ phiếu mua đã gửi / đã duyệt (mọi chi nhánh) cộng cặp thêm tay, trừ cặp đã bỏ, chỉ NCC và món đang dùng. Cùng luật với kho_ds_ncc_mat_hang (0110). Chỉ hàm security definer gọi (kho_goi_y_dat_hang).';


-- =============================================================================
-- 2 · kho_goi_y_dat_hang — MÓN CỦA NCC THEO DANH MỤC (thân chép 0039)
-- =============================================================================
create or replace function kho_goi_y_dat_hang(p_chi_nhanh_id uuid, p_ncc uuid)
returns table (
  mat_hang_id uuid, ma text, ten text, loai text, dem_goi boolean, don_vi_goi text,
  nha_cung_cap_id uuid, so_ngay_giao int,
  ton_kg numeric, dang_chuyen_kg numeric, dang_dat_kg numeric,
  dung_28_ngay_kg numeric, dung_tb_ngay_kg numeric,
  kho_toi_thieu_kg numeric, kho_toi_da_kg numeric,
  muc_can_kg numeric, de_nghi_kg numeric, de_nghi_goi int, duoi_toi_thieu boolean,
  ly_do text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hom_nay date := hom_nay_vn();
begin
  if not (kho_duoc(p_chi_nhanh_id, 'nhap') or kho_duoc(p_chi_nhanh_id, 'xem_gia')) then
    raise exception 'Tài khoản của bạn không xem được gợi ý đặt hàng ở chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;

  return query
  -- 0111 · món của NCC theo danh mục NCC – món (kho_cap_ncc_mon: tự học + sửa tay, bỏ cặp đã bỏ), không còn "món
  -- NCC giao gần nhất ở chi nhánh này". Chọn một NCC: mọi món của NCC đó. Không chọn: mỗi món MỘT NCC đề xuất —
  -- NCC chính → NCC giao gần nhất ở chi nhánh này → tên NCC.
  with cap as (
    select c.nha_cung_cap_id, c.mat_hang_id, c.la_chinh from kho_cap_ncc_mon(p_ncc) c
  ),
  lan_cuoi as (
    -- Lần giao gần nhất của từng cặp: ngày nhận, cùng ngày thì phiếu lập sau (như 0039: ngay_nhap desc, created_at desc).
    select p.nha_cung_cap_id as ncc, pd.mat_hang_id as mh, max(p.ngay_nhap) as ngay,
           (array_agg(p.created_at order by p.ngay_nhap desc, p.created_at desc))[1] as luc
    from kho_phieu_nhap p
    join kho_phieu_nhap_dong pd on pd.phieu_nhap_id = p.id
    where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua'
      and p.trang_thai in ('cho_duyet', 'da_duyet') and p.nha_cung_cap_id is not null
      and (p_ncc is null or p.nha_cung_cap_id = p_ncc)
    group by p.nha_cung_cap_id, pd.mat_hang_id
  ),
  gan_nhat as (
    select distinct on (c.mat_hang_id) c.mat_hang_id, c.nha_cung_cap_id
    from cap c
    join kho_nha_cung_cap n on n.id = c.nha_cung_cap_id
    left join lan_cuoi l on l.ncc = c.nha_cung_cap_id and l.mh = c.mat_hang_id
    order by c.mat_hang_id, c.la_chinh desc, l.ngay desc nulls last, l.luc desc nulls last, n.ten
  ),
  mon as (
    select m.*, g.nha_cung_cap_id as ncc_id, coalesce(n.so_ngay_giao, 1) as ngay_giao
    from kho_mat_hang m
    join gan_nhat g on g.mat_hang_id = m.id
    left join kho_nha_cung_cap n on n.id = g.nha_cung_cap_id
    where m.dang_dung and (p_ncc is null or g.nha_cung_cap_id = p_ncc)
  ),
  ton as (
    select t.mat_hang_id,
           coalesce(sum(t.so_kg) filter (where v.loai in ('kho', 'quay')), 0) as kg,
           coalesce(sum(t.so_kg) filter (where v.loai = 'dang_chuyen'), 0) as di_duong
    from kho_ton t
    join kho_vi_tri v on v.id = t.vi_tri_id
    join kho_lo l on l.id = t.lo_id
    where t.chi_nhanh_id = p_chi_nhanh_id and t.mat_hang_id in (select id from mon)
      and l.han_dung >= v_hom_nay and t.so_kg > 0
    group by t.mat_hang_id
  ),
  dat as (
    select dd.mat_hang_id, sum(greatest(dd.so_kg_dat - dd.so_kg_da_nhan, 0)) as kg
    from kho_don_dat_dong dd
    join kho_don_dat d on d.id = dd.don_dat_id
    where d.chi_nhanh_id = p_chi_nhanh_id and d.trang_thai in ('da_gui', 'nhan_mot_phan')
    group by dd.mat_hang_id
  ),
  dung as (
    select s.mat_hang_id, -sum(s.so_kg) as kg
    from kho_so_cai s
    left join kho_so_cai g on g.id = s.dao_cua
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay between v_hom_nay - 27 and v_hom_nay
      and s.mat_hang_id in (select id from mon)
      and coalesce(g.loai, s.loai) in ('ban', 'xuat_bep', 'huy', 'xuat_khac', 'pha_loc_vao')
    group by s.mat_hang_id
  ),
  kg_goi as (
    select pd.mat_hang_id, sum(pd.so_kg) / nullif(sum(pd.so_goi), 0) as kg
    from kho_phieu_nhap_dong pd
    join kho_phieu_nhap p on p.id = pd.phieu_nhap_id
    where p.chi_nhanh_id = p_chi_nhanh_id and p.trang_thai = 'da_duyet'
      and p.ngay_nhap >= v_hom_nay - 180 and pd.so_goi > 0
    group by pd.mat_hang_id
  ),
  tinh as (
    select m.id, m.ma, m.ten, m.loai, m.dem_goi, m.don_vi_goi, m.ncc_id, m.ngay_giao,
           m.kho_toi_thieu_kg as toi_thieu, m.kho_toi_da_kg as toi_da, m.thu_tu,
           coalesce(t.kg, 0) as ton_kg, coalesce(t.di_duong, 0) as di_duong,
           coalesce(d.kg, 0) as dat_kg,
           greatest(coalesce(u.kg, 0), 0) as dung_28,
           round(greatest(coalesce(u.kg, 0), 0) / 28, 3) as tb,
           kg.kg as kg_moi_goi
    from mon m
    left join ton t on t.mat_hang_id = m.id
    left join dat d on d.mat_hang_id = m.id
    left join dung u on u.mat_hang_id = m.id
    left join kg_goi kg on kg.mat_hang_id = m.id
  ),
  kq as (
    select x.*,
           x.ton_kg + x.di_duong + x.dat_kg as con_kg,
           coalesce(x.toi_da, round(x.tb * (x.ngay_giao + 3), 3)) as muc_can
    from tinh x
  ),
  kq2 as (
    select k.*,
           round(ceil(greatest(k.muc_can - k.con_kg, 0) * 10) / 10, 1) as de_nghi,
           (k.toi_thieu is not null and k.con_kg < k.toi_thieu) as duoi
    from kq k
  )
  select k.id, k.ma, k.ten, k.loai, k.dem_goi, k.don_vi_goi, k.ncc_id, k.ngay_giao,
         k.ton_kg, k.di_duong, k.dat_kg, k.dung_28, k.tb, k.toi_thieu, k.toi_da,
         k.muc_can, k.de_nghi,
         case when k.dem_goi and k.de_nghi > 0 and k.kg_moi_goi > 0
              then ceil(k.de_nghi / k.kg_moi_goi)::int end,
         k.duoi,
         case
           when k.toi_da is null and k.dung_28 = 0 then
             'Chưa bán / dùng trong 28 ngày qua và chưa cài mức tối đa kho lạnh — tự quyết số đặt'
             || case when k.con_kg > 0 then ' (đang có ' || kho_so_chu(k.con_kg) || ' kg)' else '' end
           else
             'Cần ' || kho_so_chu(k.muc_can) || ' kg ('
             || case when k.toi_da is not null then 'mức tối đa kho lạnh'
                     else 'dùng TB ' || kho_so_chu(k.tb) || ' kg/ngày × ' || (k.ngay_giao + 3) || ' ngày: '
                          || k.ngay_giao || ' ngày chờ hàng + 3 ngày dự phòng' end
             || '); đang có ' || kho_so_chu(k.ton_kg) || ' kg'
             || case when k.di_duong > 0 then ', đang mang ra quầy ' || kho_so_chu(k.di_duong) || ' kg' else '' end
             || case when k.dat_kg > 0 then ', đã đặt chưa về ' || kho_so_chu(k.dat_kg) || ' kg' else '' end
             || case when k.de_nghi > 0 then ' → nên đặt ' || kho_so_chu(k.de_nghi) || ' kg'
                     else ' → chưa cần đặt' end
         end
         || case when k.duoi then '. Dưới mức tối thiểu ' || kho_so_chu(k.toi_thieu) || ' kg!' else '' end
  from kq2 k
  order by (k.de_nghi > 0) desc, k.duoi desc, k.loai, k.thu_tu, k.ten;
end;
$$;

comment on function kho_goi_y_dat_hang(uuid, uuid) is
  'Gợi ý đặt hàng (nhap hoặc xem_gia; 0039, 0111; không tiền): mức cần (mức tối đa kho lạnh, hoặc dùng TB 28 ngày × (số ngày giao + 3)) − (tồn kho + quầy + đang mang ra quầy + đã đặt chưa về). Món của NCC theo danh mục NCC – món (kho_cap_ncc_mon, 0111). p_ncc null: mỗi món một NCC đề xuất — NCC chính → giao gần nhất ở chi nhánh này → tên.';


-- =============================================================================
-- 3 · THU QUYỀN — đúng các hàm của file này (0008 mục 6)
-- =============================================================================
-- kho_cap_ncc_mon: nội bộ — thu cả authenticated (test-kho-quyen.mjs NOI_BO). kho_goi_y_dat_hang: create or replace
-- giữ quyền cũ (authenticated gọi được, tự kiểm vai). Danh sách anon không đổi.
do $$
begin
  execute 'revoke execute on function kho_cap_ncc_mon(uuid) from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function kho_cap_ncc_mon(uuid) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_cap_ncc_mon(uuid) from authenticated';
  end if;
end
$$;
