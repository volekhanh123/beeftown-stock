-- =============================================================================
-- BEEFTOWN CRM — 0068 · CHỈ SỐ CRM ĐẾM NGÀY THEO GIỜ VIỆT NAM · ngay_vn()
-- =============================================================================
-- chi_so_crm() (0008) lọc kỳ bằng `lan_dau::date`, `thoi_diem::date`,
-- `created_at::date`. TimeZone của phiên trên Supabase là UTC, nên ::date của
-- một timestamptz cắt ngày theo UTC: lượt ghé 00:30 giờ Việt Nam ngày 11 là
-- 17:30 UTC ngày 10 — đếm sang ngày 10. Mọi lượt ghé, khách mới, điểm phát /
-- dùng trong khung 0h–7h sáng giờ VN lệch một ngày (rà soát nợ kỹ thuật
-- 11/10/2026). Đúng kiểu lỗi 0008 đã vá cho current_date — nhưng regex của
-- kiem-migration.mjs chỉ bắt current_date / now()::date, không bắt
-- `<cột timestamptz>::date`.
--
-- CÁCH SỬA
--   · ngay_vn(timestamptz) → date: ngày theo giờ Việt Nam, cùng cách
--     hom_nay_vn() (0008): `at time zone 'utc'` rồi + 7 giờ — độc lập với
--     TimeZone của phiên, không cần gói tzdata (Việt Nam không có giờ mùa hè).
--     immutable: dựng được chỉ mục theo ngày VN nếu cần.
--   · chi_so_crm(): ba chỗ ::date thành ngay_vn(…). Còn lại chép NGUYÊN VĂN
--     0008 (chữ ký, INVOKER, mặc định hom_nay_vn()).
--   · kiem-migration.mjs (bộ dò ở crm/test/gio-utc.mjs) bắt cả
--     `<cột / biến timestamptz>::date`, date(…), cast(… as date),
--     date_trunc('day', …) ở migration mới.
--
-- Kiểm thử: crm/test/test-chi-so-gio-vn.mjs (mốc 23:50 / 00:00 / 00:10 / 00:30
-- giờ VN, qua năm, 29/02, ngày không có thật 31/02).
-- =============================================================================

create or replace function ngay_vn(p_luc timestamptz)
returns date
language sql
immutable
parallel safe
as $$ select ((p_luc at time zone 'utc') + interval '7 hours')::date $$;

comment on function ngay_vn(timestamptz) is
  'Ngày theo giờ Việt Nam của một thời điểm (0068). Dùng thay <timestamptz>::date — trên Supabase phiên chạy UTC nên ::date cắt ngày theo UTC.';


-- =============================================================================
-- chi_so_crm — chép 0008, ba chỗ ::date thành ngay_vn()
-- =============================================================================
create or replace function chi_so_crm(
  p_chi_nhanh_id uuid default null,
  p_tu_ngay      date default (hom_nay_vn() - 30),
  p_den_ngay     date default hom_nay_vn()
)
returns table (
  chi_so   text,
  gia_tri  numeric,
  don_vi   text,
  dien_giai text
)
language plpgsql
stable
as $$
declare
  v_khach_moi        int;
  v_khach_quay_lai   int;
  v_tong_luot        int;
  v_tong_khach       int;
  v_hoa_don_tb       numeric;
  v_lan_ghe_tb       numeric;
  v_diem_phat        bigint;
  v_diem_dung        bigint;
begin
  -- Khách mới trong kỳ và bao nhiêu trong số đó đã quay lại — CÓ lọc chi nhánh
  with dau as (
    select khach_hang_id,
           min(thoi_diem) as lan_dau,
           count(*)       as so_lan
    from luot_ghe
    where (p_chi_nhanh_id is null or chi_nhanh_id = p_chi_nhanh_id)
    group by khach_hang_id
  )
  select count(*) filter (where ngay_vn(lan_dau) between p_tu_ngay and p_den_ngay),
         count(*) filter (where ngay_vn(lan_dau) between p_tu_ngay and p_den_ngay
                            and so_lan >= 2)
    into v_khach_moi, v_khach_quay_lai
  from dau;

  select count(*), count(distinct khach_hang_id), avg(thuc_thu)
    into v_tong_luot, v_tong_khach, v_hoa_don_tb
  from luot_ghe
  where ngay_vn(thoi_diem) between p_tu_ngay and p_den_ngay
    and (p_chi_nhanh_id is null or chi_nhanh_id = p_chi_nhanh_id);

  v_lan_ghe_tb := case when v_tong_khach > 0
                       then v_tong_luot::numeric / v_tong_khach else 0 end;

  select coalesce(sum(so_diem) filter (where loai = 'tich'), 0),
         coalesce(abs(sum(so_diem) filter (where loai = 'dung')), 0)
    into v_diem_phat, v_diem_dung
  from so_cai_diem
  where ngay_vn(created_at) between p_tu_ngay and p_den_ngay
    and (p_chi_nhanh_id is null or chi_nhanh_id = p_chi_nhanh_id);

  return query
  select 'ty_le_quay_lai_lan_2'::text,
         case when v_khach_moi > 0
              then round(v_khach_quay_lai::numeric / v_khach_moi * 100, 1)
              else 0 end,
         '%'::text,
         'Chỉ số quan trọng nhất 3 tháng đầu. Thấp = vấn đề ở món ăn/dịch vụ, không phải ở tích điểm.'::text
  union all
  select 'tan_suat_ghe', round(v_lan_ghe_tb, 2), 'lượt/khách',
         'Khách quen quán nướng thường ghé mỗi 4–8 tuần. Xu hướng quan trọng hơn con số.'
  union all
  select 'hoa_don_trung_binh', round(coalesce(v_hoa_don_tb, 0), 0), 'đồng',
         'So với mốc 290.000đ trong mô hình tài chính.'
  union all
  select 'gia_tri_vong_doi', round(coalesce(v_hoa_don_tb, 0) * v_lan_ghe_tb * 0.132, 0), 'đồng',
         'Lợi nhuận thực một khách mang lại (biên đóng góp 13,2%).'
  union all
  select 'ty_le_diem_duoc_dung',
         case when v_diem_phat > 0
              then round(v_diem_dung::numeric / v_diem_phat * 100, 1)
              else 0 end,
         '%',
         'Dưới 40% nghĩa là khách không thấy hấp dẫn — xem lại ngưỡng dùng.'
  union all
  select 'so_luot_ghe', v_tong_luot::numeric, 'lượt',
         'Tổng lượt ghé trong kỳ. Hòa vốn cần 70,5 lượt/ngày.';
end;
$$;

comment on function chi_so_crm is
  'Sáu chỉ số theo mục G1. Ngày theo giờ Việt Nam (ngay_vn, 0068). Gọi hằng tháng, ghi lại để xem xu hướng. Khi truyền chi nhánh, "khách mới" = lần đầu ghé chi nhánh đó.';


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6. Giữ dòng ve_con_hieu_luc: xem 0025.
-- ngay_vn() mới: authenticated GIỮ quyền gọi (chi_so_crm là INVOKER); anon
-- và PUBLIC thu ở đây như mọi hàm.
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
