-- =============================================================================
-- BEEFTOWN KHO — 0107 · TẢNG → TRIM → TẢNG Ủ → CẮT: ĐÚNG TRÌNH TỰ · TẢNG · Ủ TÁCH NGUYÊN TẢNG / TẢNG Ủ
-- =============================================================================
-- PHẢI CHẠY SAU 0048 (kho_v_tang) VÀ 0088 (trigger chốt phiên của ô mã — trigger mới chạy độc lập với nó).
--
-- Khánh chốt 28/10/2026: "Từ tảng thì lúc trim ban đầu nó sẽ luôn ra tảng ủ. Tảng ủ xong mới ra Ribeye khay."
-- Trim: nguyên tảng → MỘT tảng ủ (vẫn một khối) + vụn thừa — hao hụt ghi ở đây. Cắt: tảng ủ → khay, không ra vụn.
-- "Nguyên tảng và ủ là hai mục khác nhau." Hệ thống trước 0107 dựng theo kiểu ủ nguyên tảng rồi lóc: màn Tảng · ủ
-- (kho_v_tang) chỉ có lô NHẬN HÀNG của món theo tảng — tảng ủ sau trim (lô sinh từ pha lóc) không hiện ở đâu; và
-- pha lóc không chặn trình tự (nguyên tảng cắt thẳng ra khay vẫn chốt được).
--
-- Đổi trong file này:
--   1. kho_v_tang (thay định nghĩa, giữ nguyên các cột cũ, thêm ba cột cuối): thêm TẢNG Ủ — lô món loại tảng sinh ra
--      từ pha lóc, còn tồn — mang số tảng và ngày mổ của tảng gốc (kho_lo.tang_goc_id, 0050). Cột mới:
--      loai_tang ('nguyen' = lô nhận hàng, 'u' = tảng sau trim), ngay_bat_dau_u (ngày trim = ngày đóng gói của lô
--      pha lóc), so_ngay_u (hôm nay giờ VN − ngày bắt đầu ủ). Tảng ủ không có bảng ủ (Khánh: "ủ không cần quan
--      tâm") → tinh_trang_u 'chua_co_bang_u', ngay_u_xong null; lóc một chạm (tangLocDuoc, locMotTang) dùng được.
--   2. kho_phien_pha_dung_trinh_tu (trigger mới, BEFORE UPDATE OF trang_thai, nháp → đã chốt), chỉ với hai loại món:
--      · món vào có công thức đang dùng ra một món TẢNG (công thức Trim): phiên phải ra ít nhất một tảng nhập kho,
--        và mọi đầu ra không bỏ đi phải nằm trong các công thức TRIM đang dùng của món vào — không cắt thẳng ra khay
--        (một công thức cắt thẳng cũ còn bật cũng không mở lại đường tắt);
--      · món vào là TẢNG Ủ (món tảng nằm trong đầu ra của công thức đang dùng của món khác) mà có công thức đang
--        dùng: mọi đầu ra không bỏ đi phải nằm trong công thức đó — không ra vụn.
--      Đầu ra "bỏ" (xu_ly bo) luôn được. Món khác không đổi gì. Chặn ở lúc chốt (cả dòng gõ tay lẫn dòng quét nhãn);
--      lỗi thì cả lần chốt không ghi gì (trigger chạy trong cùng giao dịch với kho_chot_phien_pha).
-- Không bảng, cột bảng mới. Một hàm trigger mới (nội bộ). View thay bằng create or replace: quyền giữ nguyên.
--
-- Triển khai: chạy migration trước, deploy web sau (web đọc ba cột mới; web cũ không đọc chúng — chạy migration
-- trước không làm hỏng web cũ). Không có câu xoá. Chỉ chạy lên production sau khi PR được gộp, rồi
-- `npm run doi-chieu` phải báo KHỚP.
-- =============================================================================


-- =============================================================================
-- 1 · kho_v_tang — NGUYÊN TẢNG (nhận hàng) VÀ TẢNG Ủ (sau trim)
-- =============================================================================
-- Chép 0048; chỗ đổi ghi 0107: số tảng / ngày mổ lấy của tảng gốc khi lô không có; điều kiện thêm lô món loại tảng
-- sinh từ pha lóc; ba cột cuối.
create or replace view kho_v_tang with (security_invoker = true) as
select l.chi_nhanh_id,
       l.id            as lo_id,
       l.ma_lo,
       coalesce(l.so_tang, g.so_tang) as so_tang,          -- 0107: tảng ủ mang số của tảng gốc
       l.mat_hang_id,
       m.ma            as ma_hang,
       m.ten           as ten_hang,
       coalesce(l.ngay_mo, g.ngay_mo) as ngay_mo,          -- 0107
       l.ngay_dong_goi as ngay_nhan,
       l.ngay_u_xong,
       l.han_dung,
       (hom_nay_vn() - coalesce(l.ngay_mo, g.ngay_mo)) as tuoi_ngay,
       (l.ngay_u_xong - hom_nay_vn()) as con_ngay_u,
       case
         when l.ngay_u_xong is null then 'chua_co_bang_u'
         when l.ngay_u_xong > hom_nay_vn() then 'dang_u'
         else 'san_sang'
       end as tinh_trang_u,
       t.so_kg,
       t.so_goi,
       t.vi_tri,
       case when l.nguon = 'pha_loc' then 'u' else 'nguyen' end as loai_tang,            -- 0107
       case when l.nguon = 'pha_loc' then l.ngay_dong_goi end as ngay_bat_dau_u,         -- 0107: ngày trim
       case when l.nguon = 'pha_loc' then hom_nay_vn() - l.ngay_dong_goi end as so_ngay_u -- 0107
from kho_lo l
join kho_mat_hang m on m.id = l.mat_hang_id
left join kho_lo g on g.id = l.tang_goc_id
join lateral (
  select sum(x.so_kg) as so_kg, sum(x.so_goi) as so_goi,
         string_agg(v.ten, ', ' order by v.ten) as vi_tri
  from kho_ton x join kho_vi_tri v on v.id = x.vi_tri_id
  where x.lo_id = l.id and (x.so_kg > 0 or x.so_goi > 0)
) t on t.so_kg is not null
where (m.theo_tang and l.nguon in ('nhap', 'ton_dau'))
   or (m.loai = 'tang' and l.nguon = 'pha_loc');                                        -- 0107: tảng ủ

comment on view kho_v_tang is
  'Tảng còn tồn: nguyên tảng (lô nhận hàng của món theo dõi theo tảng — loai_tang nguyen) và tảng ủ (lô món loại tảng sinh từ pha lóc / trim — loai_tang u, số tảng và ngày mổ của tảng gốc, ngày bắt đầu ủ, số ngày đã ủ). Số tảng, ngày mổ, tuổi thịt, ngày ủ xong, tình trạng (dang_u / san_sang / chua_co_bang_u). Không có tiền (0048, 0107).';


-- =============================================================================
-- 2 · ĐÚNG TRÌNH TỰ LÚC CHỐT PHIÊN (trigger mới)
-- =============================================================================
-- security invoker: chỉ chạy trong kho_chot_phien_pha (security definer, đã kiểm vai pha_loc); chỉ đọc danh mục.
create or replace function kho_phien_pha_dung_trinh_tu()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_vao  kho_mat_hang;
  v_trim boolean;   -- món vào phải trim: có công thức đang dùng ra một món tảng
  v_u    boolean;   -- món vào là tảng ủ có công thức (cắt) đang dùng
  v_sai  kho_mat_hang;
begin
  select * into v_vao from kho_mat_hang where id = new.mat_hang_vao_id;
  v_trim := exists (
    select 1 from kho_cong_thuc_pha c
    join kho_cong_thuc_pha_dong d on d.cong_thuc_id = c.id
    join kho_mat_hang m on m.id = d.mat_hang_ra_id
    where c.mat_hang_vao_id = new.mat_hang_vao_id and c.dang_dung and m.loai = 'tang');
  v_u := not v_trim and v_vao.loai = 'tang'
    and exists (select 1 from kho_cong_thuc_pha c join kho_cong_thuc_pha_dong d on d.cong_thuc_id = c.id
                where d.mat_hang_ra_id = new.mat_hang_vao_id and c.dang_dung and c.mat_hang_vao_id <> new.mat_hang_vao_id)
    and exists (select 1 from kho_cong_thuc_pha c where c.mat_hang_vao_id = new.mat_hang_vao_id and c.dang_dung);
  if not v_trim and not v_u then
    return new;
  end if;

  -- Đầu ra không bỏ đi phải nằm trong một công thức đang dùng của món vào — với món phải trim: công thức TRIM.
  select m.* into v_sai
  from kho_phien_pha_ra r
  join kho_mat_hang m on m.id = r.mat_hang_id
  where r.phien_pha_id = new.id and r.xu_ly <> 'bo'
    and not exists (
      select 1 from kho_cong_thuc_pha c join kho_cong_thuc_pha_dong d on d.cong_thuc_id = c.id
      where c.mat_hang_vao_id = new.mat_hang_vao_id and c.dang_dung and d.mat_hang_ra_id = r.mat_hang_id
        and (not v_trim or exists (select 1 from kho_cong_thuc_pha_dong d2 join kho_mat_hang m2 on m2.id = d2.mat_hang_ra_id
                                   where d2.cong_thuc_id = c.id and m2.loai = 'tang')))
  order by r.thu_tu, r.id
  limit 1;
  if v_sai.id is not null and v_trim and v_sai.loai = 'phan_cat' then
    raise exception '"%" chưa ra được từ "%": phải Trim ra tảng ủ trước, ủ xong mới cắt khay — bỏ dòng này rồi chốt',
      v_sai.ten, v_vao.ten using errcode = 'check_violation';
  end if;
  if v_sai.id is not null and v_trim then
    raise exception '"%" không có trong công thức Trim của "%" — thêm vào công thức, hoặc ghi là bỏ đi, rồi chốt',
      v_sai.ten, v_vao.ten using errcode = 'check_violation';
  end if;
  if v_sai.id is not null then
    raise exception '"%" không có trong công thức cắt của "%" — tảng ủ chỉ cắt ra khay; bỏ dòng này rồi chốt',
      v_sai.ten, v_vao.ten using errcode = 'check_violation';
  end if;

  -- Trim luôn ra tảng ủ (nhập kho; món đếm tảng thì có số tảng).
  if v_trim and not exists (
    select 1 from kho_phien_pha_ra r join kho_mat_hang m on m.id = r.mat_hang_id
    where r.phien_pha_id = new.id and m.loai = 'tang' and r.xu_ly = 'nhap_kho' and (r.so_goi > 0 or not m.dem_goi)) then
    raise exception 'Trim "%" phải ra một tảng ủ — nhập kg tảng ủ (1 tảng) rồi chốt', v_vao.ten
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

comment on function kho_phien_pha_dung_trinh_tu is
  'NỘI BỘ (trigger, 0107). Chốt phiên lóc: món vào có công thức Trim (ra một món tảng) phải ra tảng ủ và chỉ ra món trong công thức; tảng ủ có công thức cắt chỉ ra món trong công thức. Dòng bỏ đi luôn được; món khác không đổi.';

drop trigger if exists kho_phien_pha_dung_trinh_tu_trigger on kho_phien_pha;
create trigger kho_phien_pha_dung_trinh_tu_trigger
  before update of trang_thai on kho_phien_pha
  for each row when (old.trang_thai = 'nhap' and new.trang_thai = 'da_chot')
  execute function kho_phien_pha_dung_trinh_tu();


-- =============================================================================
-- 3 · THU QUYỀN — đúng hàm vừa tạo (0008 mục 6)
-- =============================================================================
-- Hàm trigger mới (security invoker): CREATE cho PUBLIC quyền EXECUTE — thu khỏi PUBLIC, anon và authenticated như
-- 0088. View thay
-- bằng create or replace: quyền giữ nguyên. Danh sách anon không đổi.
do $$
begin
  execute 'revoke execute on function kho_phien_pha_dung_trinh_tu() from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function kho_phien_pha_dung_trinh_tu() from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_phien_pha_dung_trinh_tu() from authenticated';
  end if;
end
$$;
