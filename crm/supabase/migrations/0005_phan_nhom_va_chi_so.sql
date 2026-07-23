-- =============================================================================
-- BEEFTOWN CRM — 0005 · PHÂN NHÓM KHÁCH & CHỈ SỐ
-- =============================================================================
-- Sáu nhóm khách (Beeftown_CRM_Design.html mục C) và sáu chỉ số (mục G).
--
-- Làm dạng VIEW chứ không lưu cứng:
--   · Luôn tươi, không cần job đồng bộ chạy đêm
--   · Sửa điều kiện phân nhóm chỉ cần sửa một chỗ
--   · Không có nguy cơ dữ liệu lệch giữa bảng phân nhóm và thực tế
-- =============================================================================

-- =============================================================================
-- TỔNG HỢP HÀNH VI TỪNG KHÁCH
-- =============================================================================
create or replace view v_khach_tong_hop as
select
  kh.id                as khach_hang_id,
  kh.sdt,
  kh.ho_ten,
  kh.la_khach_b2b,
  kh.dang_hoat_dong,
  kh.ngay_sinh_ngay,
  kh.ngay_sinh_thang,

  count(lg.id)                          as so_lan_ghe,
  coalesce(sum(lg.thuc_thu), 0)::bigint as tong_chi_tieu,
  case when count(lg.id) > 0
       then (coalesce(sum(lg.thuc_thu), 0) / count(lg.id))::bigint
       else 0 end                       as hoa_don_trung_binh,

  min(lg.thoi_diem)                     as lan_ghe_dau,
  max(lg.thoi_diem)                     as lan_ghe_gan_nhat,

  case when max(lg.thoi_diem) is not null
       then extract(day from now() - max(lg.thoi_diem))::int
       else null end                    as so_ngay_chua_quay_lai,

  coalesce(sd.so_du, 0)                 as diem_hien_co,
  coalesce(dy.dang_dong_y, false)       as dang_dong_y_nhan_tin

from khach_hang kh
left join luot_ghe lg        on lg.khach_hang_id = kh.id
left join v_so_du_diem sd    on sd.khach_hang_id = kh.id
left join v_dong_y_hien_tai dy on dy.khach_hang_id = kh.id
group by kh.id, kh.sdt, kh.ho_ten, kh.la_khach_b2b, kh.dang_hoat_dong,
         kh.ngay_sinh_ngay, kh.ngay_sinh_thang, sd.so_du, dy.dang_dong_y;

comment on view v_khach_tong_hop is
  'Hành vi tổng hợp mỗi khách. Nền của phân nhóm và mọi chỉ số.';

-- =============================================================================
-- SÁU NHÓM KHÁCH (mục C1)
-- =============================================================================
-- Phân loại bằng đúng hai con số: số lần ghé và số ngày chưa quay lại.
-- Thứ tự CASE quan trọng — nhóm đầu tiên khớp sẽ thắng.
-- =============================================================================
create or replace view v_phan_nhom_khach as
select
  t.*,
  case
    -- B2B tách riêng: không tích điểm cá nhân, chăm sóc bằng hợp đồng
    when t.la_khach_b2b then 'b2b'

    -- Chưa từng ghé (mới chỉ đặt bàn hoặc để lại SĐT)
    when t.so_lan_ghe = 0 then 'chua_ghe'

    -- Ngủ đông: từng ghé từ 2 lần, đã 60+ ngày không quay lại
    -- Đây là nhóm ĐÁNG CỨU NHẤT — họ đã biết và từng thích quán
    when t.so_lan_ghe >= 2 and t.so_ngay_chua_quay_lai >= 60 then 'ngu_dong'

    -- Mới: 1 lần ghé trong vòng 30 ngày
    when t.so_lan_ghe = 1 and t.so_ngay_chua_quay_lai <= 30 then 'moi'

    -- Đang hình thành thói quen: 2–3 lần
    when t.so_lan_ghe between 2 and 3 then 'dang_thanh_thoi_quen'

    -- Thân thiết: 4+ lần và còn ghé trong 60 ngày
    when t.so_lan_ghe >= 4 and t.so_ngay_chua_quay_lai <= 60 then 'than_thiet'

    else 'khac'
  end as nhom
from v_khach_tong_hop t
where t.dang_hoat_dong;

comment on view v_phan_nhom_khach is
  'Sáu nhóm khách theo mục C1. Nhóm VIP tính riêng ở v_khach_vip (top 10% chi tiêu).';

-- -----------------------------------------------------------------------------
-- KHÁCH VIP — top 10% chi tiêu tích lũy
-- -----------------------------------------------------------------------------
-- Tách riêng vì VIP là thuộc tính chồng lên nhóm, không loại trừ nhau:
-- một khách vừa 'than_thiet' vừa có thể là VIP.
-- -----------------------------------------------------------------------------
create or replace view v_khach_vip as
select *
from (
  select
    t.*,
    percent_rank() over (order by t.tong_chi_tieu) as thu_hang
  from v_khach_tong_hop t
  where t.dang_hoat_dong and t.so_lan_ghe > 0
) x
where x.thu_hang >= 0.90;

comment on view v_khach_vip is
  'Top 10% chi tiêu. Nhóm giới thiệu khách mới nhiều nhất — quản lý nên nhớ mặt.';

-- -----------------------------------------------------------------------------
-- DANH SÁCH GỬI CHIẾN DỊCH — đã lọc điều kiện pháp lý
-- -----------------------------------------------------------------------------
-- Chỉ khách ĐỒNG Ý nhận tin và ĐÃ TỪNG GIAO DỊCH mới được gửi tin quảng cáo.
-- Điều kiện thứ hai là yêu cầu của Zalo ZBS: người nhận phải từng giao dịch
-- với doanh nghiệp.
-- -----------------------------------------------------------------------------
create or replace view v_duoc_gui_tin as
select n.*
from v_phan_nhom_khach n
where n.dang_dong_y_nhan_tin
  and n.so_lan_ghe > 0;

comment on view v_duoc_gui_tin is
  'Danh sách hợp lệ để gửi tin quảng cáo. LUÔN gửi từ view này, đừng gửi thẳng từ khach_hang.';

-- =============================================================================
-- SÁU CHỈ SỐ THEO DÕI (mục G1)
-- =============================================================================
create or replace function chi_so_crm(
  p_chi_nhanh_id uuid default null,
  p_tu_ngay      date default (current_date - 30),
  p_den_ngay     date default current_date
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
  v_hoa_don_co_sdt   int;
begin
  -- Khách mới trong kỳ và bao nhiêu trong số đó đã quay lại
  select count(*) into v_khach_moi
  from v_khach_tong_hop
  where lan_ghe_dau::date between p_tu_ngay and p_den_ngay;

  select count(*) into v_khach_quay_lai
  from v_khach_tong_hop
  where lan_ghe_dau::date between p_tu_ngay and p_den_ngay
    and so_lan_ghe >= 2;

  select count(*), count(distinct khach_hang_id), avg(thuc_thu)
    into v_tong_luot, v_tong_khach, v_hoa_don_tb
  from luot_ghe
  where thoi_diem::date between p_tu_ngay and p_den_ngay
    and (p_chi_nhanh_id is null or chi_nhanh_id = p_chi_nhanh_id);

  v_lan_ghe_tb := case when v_tong_khach > 0
                       then v_tong_luot::numeric / v_tong_khach else 0 end;

  select coalesce(sum(so_diem) filter (where loai = 'tich'), 0),
         coalesce(abs(sum(so_diem) filter (where loai = 'dung')), 0)
    into v_diem_phat, v_diem_dung
  from so_cai_diem
  where created_at::date between p_tu_ngay and p_den_ngay
    and (p_chi_nhanh_id is null or chi_nhanh_id = p_chi_nhanh_id);

  select count(*) into v_hoa_don_co_sdt
  from luot_ghe
  where thoi_diem::date between p_tu_ngay and p_den_ngay
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
  'Sáu chỉ số theo mục G1. Gọi hằng tháng, ghi lại để xem xu hướng.';

-- =============================================================================
-- ĐẾM KHÁCH THEO NHÓM — cho bảng điều khiển
-- =============================================================================
create or replace view v_thong_ke_nhom as
select
  nhom,
  count(*)                        as so_khach,
  sum(tong_chi_tieu)::bigint      as tong_chi_tieu,
  round(avg(hoa_don_trung_binh))  as hoa_don_tb,
  sum(diem_hien_co)::bigint       as tong_diem_dang_giu
from v_phan_nhom_khach
group by nhom
order by so_khach desc;
