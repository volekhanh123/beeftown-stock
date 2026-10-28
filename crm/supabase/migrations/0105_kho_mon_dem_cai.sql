-- =============================================================================
-- BEEFTOWN KHO — 0105 · SỐT, GIA VỊ, ĐỒ KHÔ VÀ ĐỒ UỐNG: MÓN ĐẾM THEO CÁI (đợt 1)
-- =============================================================================
-- PHẢI CHẠY SAU 0097 (bản cuối của kho_ghi_dong_phieu_nhap, kho_duyet_phieu_nhap), 0050 (kho_bao_cao_ncc),
-- 0041 (kho_bao_cao_theo_thang, kho_bao_cao_mua_hang), 0040 (kho_du_lieu_misa, kho_tien_tra_hang_goi_y),
-- 0039 (view kho_v_phieu_nhap), 0032 (kho_chi_so_quan_tri, view kho_v_phieu_xuat), 0031 (kho_dien_gia_phieu_nhap).
--
-- Khánh chốt 27–28/10/2026: kho quản lý thêm hai nhóm nguyên vật liệu, đếm theo cái (chai, hộp, lon, gói):
--   · gia_vi  — Sốt, gia vị, đồ khô: mua của nhà cung cấp, ra khỏi kho bằng phiếu Xuất bếp, chai / hộp nguyên;
--   · do_uong — Đồ uống: một chỗ để, không chuyển; bán trên iPOS thì kho tự trừ 1 chai / lon (đợt 2).
-- Nhập hàng và kiểm kê theo thùng (1 thùng = N cái, ghi ở món) — kho luôn giữ số cái. Hạn dùng là ngày in trên
-- sản phẩm, ghi lúc nhận. Thành tiền phiếu nhập khớp hóa đơn từng đồng khi nhập theo giá thùng. Kim chi (bếp tự
-- làm) để PR sau.
--
-- CÁCH LƯU: món đếm theo cái dùng đường "đếm gói" sẵn có của kho — dem_goi = true, don_vi_goi = tên đơn vị
-- ("chai", "lon"…), so_goi = số cái — và so_kg LUÔN BẰNG so_goi (kg không phải cân nặng; cột sinh dem_theo_cai
-- đánh dấu món). Nhờ vậy phân bổ lô (kho_phan_bo theo gói), kiểm kê (kho_kg_tb_goi = 1), giá vốn (gia_von_kg =
-- giá một cái) đúng mà không phải viết lại. Bất biến so_kg = so_goi được chặn ở sổ kho (trigger mới
-- kho_so_cai_dem_cai_kiem): luồng nào lỡ ghi khác là báo lỗi, không lặng lẽ sai tồn. Món đã có trong phiếu / sổ
-- không đổi được giữa hàng cân ký và hàng đếm theo cái (trigger mới kho_mat_hang_doi_kieu_dem_kiem).
--
-- Đổi trong file này:
--   1. kho_mat_hang: loại gia_vi, do_uong; cột sinh dem_theo_cai; cột so_trong_thung (số cái một thùng).
--   2. kho_phieu_nhap_dong: so_trong_thung (chép từ món lúc ghi), don_gia_thung; thanh_tien tính từ giá thùng
--      khi có (SET EXPRESSION — Postgres 17), dòng cũ không đổi.
--   3. kho_ghi_dong_phieu_nhap: món đếm theo cái không cần kg (so_kg = so_goi), phải ghi hạn dùng, nhận
--      don_gia_thung. kho_dien_gia_phieu_nhap: kế toán điền giá thùng. kho_duyet_phieu_nhap: phiếu có món đếm
--      theo cái chia chi phí khác theo tiền hàng (như thuế) thay vì theo kg.
--   4. MISA: đơn vị tính của món đếm theo cái là tên đơn vị của nó, không "kg".
--   5. Báo cáo / view cộng kg nhiều món (tháng, mua hàng theo NCC, đánh giá NCC, chỉ số quản trị, tổng kg của
--      danh sách phiếu nhập / xuất): kg chỉ tính hàng cân ký; tiền vẫn cộng mọi món.
--   6. Tiền trả hàng NCC tự tính: dòng nhập theo giá thùng tính đúng phần của giá thùng.
-- Đợt 2 (PR sau): đồ uống tự trừ qua iPOS theo mã món, gợi ý đặt hàng theo cái, mức tối thiểu / tối đa.
--
-- Triển khai: chạy migration TRƯỚC, deploy web SAU (web mới đọc cột dem_theo_cai, so_trong_thung, don_gia_thung;
-- web cũ vẫn chạy được trên database mới). Không có câu delete: chạy bằng SQL Editor hoặc psql. Chỉ chạy lên
-- production sau khi PR được gộp, rồi `npm run doi-chieu` phải báo KHỚP.
-- =============================================================================


-- =============================================================================
-- 1 · MẶT HÀNG: HAI LOẠI MỚI, ĐẾM THEO CÁI, QUY ĐỔI THÙNG
-- =============================================================================
alter table kho_mat_hang drop constraint kho_mat_hang_loai_hop_le;
alter table kho_mat_hang add constraint kho_mat_hang_loai_hop_le
  check (loai in ('tang', 'phan_cat', 'phu_pham', 'gia_vi', 'do_uong'));

alter table kho_mat_hang add column dem_theo_cai boolean generated always as (loai in ('gia_vi', 'do_uong')) stored;
alter table kho_mat_hang add column so_trong_thung int;

-- Món đếm theo cái: luôn đếm (dem_goi), không mã cân (không bán qua cân), không theo dõi theo tảng.
alter table kho_mat_hang add constraint kho_mat_hang_dem_cai_hop_le
  check (loai not in ('gia_vi', 'do_uong') or (dem_goi and ma_can is null and not theo_tang));
alter table kho_mat_hang add constraint kho_mat_hang_thung_hop_le
  check (so_trong_thung is null or (loai in ('gia_vi', 'do_uong') and so_trong_thung between 2 and 10000));

comment on column kho_mat_hang.dem_theo_cai is
  'Món đếm theo cái (0105): loại gia_vi (sốt, gia vị, đồ khô) và do_uong. Lượng là so_goi; so_kg của mọi dòng sổ, tồn, phiếu luôn bằng so_goi — không phải cân nặng, không cộng vào tổng kg.';
comment on column kho_mat_hang.so_trong_thung is
  'Số cái trong một thùng (0105), chỉ món đếm theo cái; null = không nhập theo thùng. Nhập hàng và kiểm kê gõ thùng + lẻ, kho giữ số cái.';

-- Món đã có trong phiếu nhập hay sổ kho không đổi được giữa cân ký và đếm theo cái: số kg cũ của nó là cân nặng,
-- không bằng số gói — đổi sang đếm theo cái làm lần ghi sổ sau vỡ bất biến (và ngược lại, kg = số cái thành cân
-- nặng giả). security definer: phải thấy sổ của MỌI chi nhánh (RLS của người sửa chỉ thấy chi nhánh mình). Đọc
-- loai, không đọc dem_theo_cai: cột sinh chưa tính ở trigger BEFORE.
create or replace function kho_mat_hang_doi_kieu_dem_kiem()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.loai in ('gia_vi', 'do_uong')) is distinct from (old.loai in ('gia_vi', 'do_uong'))
     and (exists (select 1 from kho_so_cai s where s.mat_hang_id = old.id)
          or exists (select 1 from kho_phieu_nhap_dong d where d.mat_hang_id = old.id)) then
    raise exception 'Món "%" đã có trong phiếu hoặc sổ kho — không đổi được giữa hàng cân ký và hàng đếm theo cái. Tạo món mới đúng loại', old.ten
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger kho_mat_hang_doi_kieu_dem_trigger
  before update of loai on kho_mat_hang
  for each row execute function kho_mat_hang_doi_kieu_dem_kiem();


-- =============================================================================
-- 2 · SỔ KHO: MÓN ĐẾM THEO CÁI CÓ so_kg = so_goi
-- =============================================================================
-- Chốt cuối của cách lưu: mọi luồng ghi sổ (nhập, xuất, chuyển, kiểm kê, hủy, iPOS…) phải ghi kg bằng số cái.
-- Luồng nào sai là báo ngay, không để tồn lệch. Chạy trước kho_so_cai_ghi_trigger (tên xếp trước), và lỗi ở
-- trigger BEFORE nào cũng hủy cả câu insert. Hàm ghi sổ đều là security definer nên đọc được kho_mat_hang.
create or replace function kho_so_cai_dem_cai_kiem()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_ten text;
  v_dv  text;
begin
  select m.ten, m.don_vi_goi into v_ten, v_dv
  from kho_mat_hang m where m.id = new.mat_hang_id and m.dem_theo_cai;
  if found and new.so_kg is distinct from new.so_goi::numeric then
    raise exception 'Món đếm theo cái "%": số kg phải bằng số % trong sổ kho', v_ten, v_dv
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger kho_so_cai_dem_cai_kiem_trigger
  before insert on kho_so_cai
  for each row execute function kho_so_cai_dem_cai_kiem();


-- =============================================================================
-- 3 · DÒNG PHIẾU NHẬP: GIÁ THÙNG, THÀNH TIỀN KHỚP HÓA ĐƠN
-- =============================================================================
-- 380.000 đ / thùng 24 lon = 15.833,33 đ một lon — đơn giá một cái (don_gia_kg, số đồng nguyên) làm tròn sẽ làm
-- thành tiền lệch hóa đơn vài đồng. Dòng giữ giá thùng và số cái một thùng (chép từ món lúc ghi): thành tiền =
-- số cái × giá thùng / số cái một thùng → 1 thùng ra đúng 380.000 đ. Dòng không giá thùng tính như cũ.
alter table kho_phieu_nhap_dong add column so_trong_thung int;
alter table kho_phieu_nhap_dong add column don_gia_thung bigint;
alter table kho_phieu_nhap_dong add constraint kho_phieu_nhap_dong_thung_hop_le
  check ((so_trong_thung is null or so_trong_thung between 2 and 10000)
         and (don_gia_thung is null or (so_trong_thung is not null and don_gia_thung >= 0)));
alter table kho_phieu_nhap_dong alter column thanh_tien set expression as
  (round(case when don_gia_thung is not null then so_kg * don_gia_thung / so_trong_thung
              else so_kg * don_gia_kg end)::bigint);

comment on column kho_phieu_nhap_dong.so_trong_thung is
  'Số cái một thùng của món lúc ghi dòng (0105, món đếm theo cái). Đổi danh mục sau đó không đổi tiền của phiếu.';
comment on column kho_phieu_nhap_dong.don_gia_thung is
  'Giá một thùng (0105). Có thì thanh_tien = so_kg (số cái) × don_gia_thung / so_trong_thung — khớp hóa đơn từng đồng; don_gia_kg là giá một cái làm tròn, chỉ để xem và so giá.';


-- =============================================================================
-- 4 · GHI DÒNG PHIẾU NHẬP — món đếm theo cái (thay THÂN 0097, cùng chữ ký)
-- =============================================================================
-- Hàm nội bộ: hai người gọi (kho_luu_phieu_nhap_kg, kho_luu_phieu_nhap) kiểm kho_duoc(chi nhánh, 'nhap') ở đầu
-- thân. Món đếm theo cái: không đọc kg (so_kg = so_goi), không ngày mổ / kg sau repack, PHẢI có hạn dùng (ngày
-- in trên sản phẩm), nhận thêm khóa don_gia_thung.
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
  v_thuc  numeric;
  v_so    int;                                    -- 0097: số tảng của dòng
  v_nv_id uuid := (nhan_su_hien_tai()).id;        -- 0097: người cấp / bỏ số
  v_thung      int;                               -- 0105: số cái trong một thùng (chép từ món)
  v_gia_thung  bigint;                            -- 0105: giá một thùng
  c_khoa  constant text[] := array['mat_hang_id', 'so_goi', 'so_kg', 'don_gia_kg',
                                   'so_lo_ncc', 'ngay_san_xuat', 'han_dung', 'truong_them',
                                   'ngay_mo', 'so_kg_thuc', 'so_tang', 'don_gia_thung'];
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

    -- MỚI (0105): món đếm theo cái không có kg — lượng là số cái (so_goi), so_kg đặt bằng số cái ở dưới.
    if not v_mh.dem_theo_cai then
      if jsonb_typeof(v_dong -> 'so_kg') is distinct from 'number' then
        raise exception 'Dòng % (%): chưa nhập số kg', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      v_kg := (v_dong ->> 'so_kg')::numeric;
      if v_kg <= 0 or v_kg >= 1000000 or v_kg <> round(v_kg, 3) then
        raise exception 'Dòng % (%): số kg phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
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
    if v_mh.dem_goi and v_goi = 0 and not v_mh.theo_tang then   -- 0048: dòng tảng tự là 1 tảng
      raise exception 'Dòng % (%): chưa nhập số %', v_i, v_mh.ten, v_mh.don_vi_goi
        using errcode = 'check_violation';
    end if;
    -- MỚI (0105): món đếm theo cái — so_kg luôn bằng số cái (bất biến của sổ kho, kho_so_cai_dem_cai_kiem).
    if v_mh.dem_theo_cai then
      if v_goi >= 1000000 then
        raise exception 'Dòng % (%): số % quá lớn — kiểm tra lại', v_i, v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_kg := v_goi;
    end if;

    -- MỚI (0048): món theo dõi theo tảng — mỗi dòng là MỘT tảng, có ngày mổ.
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

    -- MỚI (0050): kg sau repack (cân lại sau khi mở túi, bỏ nước rỉ). so_kg
    -- vẫn là kg nhà cung cấp — cơ sở tính tiền; kho nhập theo kg sau repack.
    v_thuc := null;
    if v_dong ? 'so_kg_thuc' and v_dong -> 'so_kg_thuc' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_kg_thuc') <> 'number' then
        raise exception 'Dòng % (%): kg sau repack không hợp lệ', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      v_thuc := (v_dong ->> 'so_kg_thuc')::numeric;
      if v_thuc <= 0 or v_thuc <> round(v_thuc, 3) then
        raise exception 'Dòng % (%): kg sau repack phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      if v_thuc > v_kg * 1.01 then
        raise exception 'Dòng % (%): kg sau repack lớn hơn kg nhà cung cấp — kiểm tra lại cân', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
    end if;

    -- MỚI (0105): món đếm theo cái không có ngày mổ, kg sau repack.
    if v_mh.dem_theo_cai then
      v_mo := null;
      v_thuc := null;
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

    -- MỚI (0105): giá một thùng — món đếm theo cái có quy đổi thùng. Dòng chép số cái / thùng của món lúc
    -- ghi (đổi danh mục sau không đổi tiền của phiếu); thành tiền tính từ giá thùng nên khớp hóa đơn từng
    -- đồng, đơn giá một cái (don_gia_kg) làm tròn chỉ để xem và so giá.
    v_thung := case when v_mh.dem_theo_cai then v_mh.so_trong_thung end;
    v_gia_thung := null;
    if v_dong ? 'don_gia_thung' and v_dong -> 'don_gia_thung' <> 'null'::jsonb then
      if v_thung is null then
        raise exception 'Dòng % (%): món này không có quy đổi thùng — nhập giá một %', v_i, v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      if jsonb_typeof(v_dong -> 'don_gia_thung') <> 'number'
         or (v_dong ->> 'don_gia_thung')::numeric <> trunc((v_dong ->> 'don_gia_thung')::numeric)
         or (v_dong ->> 'don_gia_thung')::numeric < 0
         or (v_dong ->> 'don_gia_thung')::numeric >= 10000000000 then
        raise exception 'Dòng % (%): đơn giá phải là số đồng không âm', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      v_gia_thung := (v_dong ->> 'don_gia_thung')::bigint;
      v_gia := round(v_gia_thung::numeric / v_thung)::bigint;
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
    elsif v_mh.dem_theo_cai then
      -- MỚI (0105): sốt, đồ uống — hạn là ngày in trên sản phẩm, ghi lúc nhận; không tự cộng ngày.
      raise exception 'Dòng % (%): chưa ghi hạn dùng in trên sản phẩm', v_i, v_mh.ten
        using errcode = 'check_violation';
    elsif v_mh.han_dung_ngay is not null then
      v_han := p_ngay_nhap + v_mh.han_dung_ngay;
    else
      raise exception 'Dòng % (%): chưa có hạn dùng, và mặt hàng chưa cài hạn mặc định', v_i, v_mh.ten
        using errcode = 'check_violation';
    end if;

    -- MỚI (0097): số tảng cấp NGAY LÚC LƯU, sau mọi kiểm tra của dòng. Dòng gửi lại khoá so_tang
    -- (web gửi lại số database đã cấp cho dòng đó) thì giữ số — chỉ khi số đúng là của phiếu này,
    -- chưa bỏ, chưa có ở dòng trước trong cùng lượt. Không gửi thì cấp số mới. Món không theo
    -- tảng: bỏ qua khoá so_tang (số cũ của dòng, nếu có, được ghi bỏ ở cuối hàm).
    v_so := null;
    if v_mh.theo_tang then
      if v_dong ? 'so_tang' and v_dong -> 'so_tang' <> 'null'::jsonb then
        if jsonb_typeof(v_dong -> 'so_tang') <> 'number'
           or (v_dong ->> 'so_tang')::numeric <> trunc((v_dong ->> 'so_tang')::numeric)
           or (v_dong ->> 'so_tang')::numeric < 1
           or (v_dong ->> 'so_tang')::numeric > 2147483647 then
          raise exception 'Dòng % (%): số tảng không hợp lệ', v_i, v_mh.ten
            using errcode = 'check_violation';
        end if;
        v_so := (v_dong ->> 'so_tang')::int;
        if not exists (select 1 from kho_so_tang_cap c
                       where c.chi_nhanh_id = p_chi_nhanh_id and c.so_tang = v_so
                         and c.phieu_nhap_id = p_phieu_id and c.bo_luc is null) then
          -- lpad cắt chuỗi dài hơn 4 ký tự (lpad('12345', 4, '0') = '1234') — số từ 10000 in nguyên.
          raise exception 'Dòng % (%): số tảng #% không phải số của phiếu này (hoặc đã bỏ) — tải lại trang',
            v_i, v_mh.ten, case when v_so < 10000 then lpad(v_so::text, 4, '0') else v_so::text end
            using errcode = 'check_violation';
        end if;
        if exists (select 1 from kho_phieu_nhap_dong d
                   where d.phieu_nhap_id = p_phieu_id and d.so_tang = v_so) then
          raise exception 'Dòng % (%): số tảng #% đã có ở dòng khác của phiếu',
            v_i, v_mh.ten, case when v_so < 10000 then lpad(v_so::text, 4, '0') else v_so::text end
            using errcode = 'check_violation';
        end if;
      else
        v_so := kho_sinh_so_tang(p_chi_nhanh_id);
        insert into kho_so_tang_cap (chi_nhanh_id, so_tang, phieu_nhap_id, nguoi_cap)
        values (p_chi_nhanh_id, v_so, p_phieu_id, v_nv_id);
      end if;
    end if;

    insert into kho_phieu_nhap_dong
      (phieu_nhap_id, chi_nhanh_id, thu_tu, mat_hang_id, so_goi, so_kg, don_gia_kg,
       so_lo_ncc, ngay_san_xuat, han_dung, truong_them, ngay_mo, so_kg_thuc, so_tang,
       so_trong_thung, don_gia_thung)
    values
      (p_phieu_id, p_chi_nhanh_id, v_i, v_mh.id, v_goi, v_kg, v_gia,
       nullif(btrim(v_dong ->> 'so_lo_ncc'), ''), v_nsx, v_han,
       coalesce(v_dong -> 'truong_them', '{}'::jsonb), v_mo, v_thuc, v_so,
       v_thung, v_gia_thung);
  end loop;

  -- MỚI (0097): số đã cấp cho phiếu mà không dòng nào còn mang (dòng bị bỏ, đổi sang món không theo
  -- tảng, web cũ không gửi lại số) → ghi bỏ, không bao giờ cấp lại. Hai người gọi (kho_luu_phieu_nhap_kg,
  -- kho_luu_phieu_nhap) đều xoá hết dòng của phiếu TRƯỚC khi gọi hàm này, nên "dòng còn mang" là đúng các
  -- dòng vừa ghi ở trên.
  update kho_so_tang_cap c set bo_luc = now(), nguoi_bo = v_nv_id
  where c.phieu_nhap_id = p_phieu_id and c.bo_luc is null
    and not exists (select 1 from kho_phieu_nhap_dong d
                    where d.phieu_nhap_id = p_phieu_id and d.so_tang = c.so_tang);

  return v_i;
end;
$$;


-- =============================================================================
-- 4b · LƯU PHIẾU NHẬP — vai không xem giá không gửi được giá thùng; giá thùng đi theo món khi lưu lại
--      (thay THÂN 0031 của kho_luu_phieu_nhap_kg và kho_luu_phieu_nhap, cùng chữ ký)
-- =============================================================================
-- Thiếu chỗ này thì khóa mới don_gia_thung lọt qua chốt "người nhận hàng không điền đơn giá" (chốt cũ chỉ nhìn
-- don_gia_kg) — thủ kho tự đặt được giá. Và thủ kho sửa số lon sau khi kế toán điền giá thùng thì dòng mới chỉ
-- còn giá một cái làm tròn — thành tiền lệch hóa đơn.
create or replace function kho_luu_phieu_nhap_kg(
  p_id              uuid,
  p_chi_nhanh_id    uuid,
  p_ma_gui          uuid,
  p_phien_ban       int,
  p_loai            text,
  p_nha_cung_cap_id uuid,
  p_vi_tri_id       uuid,
  p_ngay_nhap       date,
  p_so_hoa_don      text,
  p_ngay_hoa_don    date,
  p_ghi_chu         text,
  p_anh_them        text[],
  p_truong_them     jsonb,
  p_dong            jsonb
)
returns table (phieu_id uuid, phien_ban_moi int, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv   nhan_su;
  v_pn   kho_phieu_nhap;
  v_id   uuid;
  v_pb   int;
  v_anh  text[];
  v_a    text;
  v_dong jsonb;
  v_i    int := 0;
  v_gia  jsonb := '{}';
  v_gia_thung jsonb := '{}';   -- 0105
begin
  if not kho_duoc(p_chi_nhanh_id, 'nhap') then
    raise exception 'Tài khoản của bạn không được lập phiếu nhập'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();

  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho — vào Cài đặt kho, bấm "Bắt đầu dùng kho"'
      using errcode = 'check_violation';
  end if;

  if p_loai is null or p_loai not in ('mua', 'ton_dau') then
    raise exception 'Loại phiếu nhập không hợp lệ' using errcode = 'check_violation';
  end if;
  if p_ngay_nhap is null or p_ngay_nhap > hom_nay_vn() then
    raise exception 'Ngày nhập không được sau hôm nay' using errcode = 'check_violation';
  end if;
  if p_ngay_nhap < hom_nay_vn() - 90 then
    raise exception 'Ngày nhập quá 90 ngày trước — kiểm tra lại ngày' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from kho_vi_tri
                 where id = p_vi_tri_id and chi_nhanh_id = p_chi_nhanh_id
                   and dang_dung and loai in ('kho', 'quay')) then
    raise exception 'Chọn nơi nhận hàng là một kho hoặc quầy đang dùng'
      using errcode = 'check_violation';
  end if;
  if p_loai = 'ton_dau' and p_nha_cung_cap_id is not null then
    raise exception 'Phiếu tồn đầu kỳ không có nhà cung cấp'
      using errcode = 'check_violation';
  end if;
  if p_nha_cung_cap_id is not null and not exists (
       select 1 from kho_nha_cung_cap where id = p_nha_cung_cap_id and dang_dung) then
    raise exception 'Nhà cung cấp không có hoặc đã ngừng dùng' using errcode = 'check_violation';
  end if;

  -- Dòng hàng: không có ô giá. Kiểm TRƯỚC khi ghi gì.
  if p_dong is not null and jsonb_typeof(p_dong) = 'array' then
    for v_dong in select value from jsonb_array_elements(p_dong) loop
      v_i := v_i + 1;
      if jsonb_typeof(v_dong) = 'object' and (v_dong ? 'don_gia_kg' or v_dong ? 'don_gia_thung') then   -- 0105: cả giá thùng
        raise exception 'Dòng %: người nhận hàng không điền đơn giá — kế toán hoặc quản lý điền khi duyệt', v_i
          using errcode = 'check_violation';
      end if;
    end loop;
  end if;

  if p_id is null then
    select pn.id, pn.phien_ban into v_id, v_pb
    from kho_phieu_nhap pn where pn.ma_gui = p_ma_gui;
    if found then
      return query select v_id, v_pb, true;
      return;
    end if;
    v_anh := '{}';
  else
    select * into v_pn from kho_phieu_nhap where kho_phieu_nhap.id = p_id for update;
    if not found or v_pn.chi_nhanh_id <> p_chi_nhanh_id then
      raise exception 'Không tìm thấy phiếu nhập' using errcode = 'foreign_key_violation';
    end if;
    if v_pn.trang_thai = 'cho_duyet' then
      raise exception 'Phiếu đang chờ duyệt — rút về rồi mới sửa được' using errcode = 'check_violation';
    end if;
    if v_pn.trang_thai not in ('nhap', 'tu_choi') then
      raise exception 'Phiếu % đã % — không sửa được nữa', v_pn.so_phieu,
        case v_pn.trang_thai when 'da_duyet' then 'được duyệt' else 'bị hủy' end
        using errcode = 'check_violation';
    end if;
    if p_phien_ban is distinct from v_pn.phien_ban then
      raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
        using errcode = 'check_violation';
    end if;
    if p_loai <> v_pn.loai then
      raise exception 'Không đổi được loại phiếu sau khi đã tạo' using errcode = 'check_violation';
    end if;
    v_anh := v_pn.anh;
  end if;

  -- Ảnh: chỉ cộng thêm, bỏ trùng, đúng thư mục ảnh nhập của chi nhánh.
  foreach v_a in array coalesce(p_anh_them, '{}'::text[]) loop
    v_a := btrim(v_a);
    continue when v_a is null or v_a = '';
    if v_a not like p_chi_nhanh_id::text || '/nhap/%' or v_a like '%..%' then
      raise exception 'Đường dẫn ảnh không thuộc chi nhánh này' using errcode = 'check_violation';
    end if;
    if not (v_a = any(v_anh)) then
      v_anh := v_anh || v_a;
    end if;
  end loop;

  if p_id is null then
    insert into kho_phieu_nhap
      (chi_nhanh_id, so_phieu, ma_gui, loai, nha_cung_cap_id, vi_tri_id, ngay_nhap,
       so_hoa_don, ngay_hoa_don, ghi_chu, anh, truong_them, nguoi_tao)
    values
      (p_chi_nhanh_id,
       kho_sinh_so(p_chi_nhanh_id, case when p_loai = 'ton_dau' then 'TD' else 'PN' end),
       p_ma_gui, p_loai, p_nha_cung_cap_id, p_vi_tri_id, p_ngay_nhap,
       nullif(btrim(p_so_hoa_don), ''), p_ngay_hoa_don,
       nullif(btrim(p_ghi_chu), ''), v_anh, coalesce(p_truong_them, '{}'),
       v_nv.id)
    returning kho_phieu_nhap.id, kho_phieu_nhap.phien_ban into v_id, v_pb;
  else
    -- Đơn giá đang có, theo mặt hàng: dòng đầu tiên của mỗi món.
    -- 0105: kèm giá thùng (dòng nhập theo giá thùng) — mất nó thì thành tiền thành giá một cái làm tròn.
    select coalesce(jsonb_object_agg(x.mat_hang_id::text, x.don_gia_kg), '{}'),
           coalesce(jsonb_object_agg(x.mat_hang_id::text, x.don_gia_thung) filter (where x.don_gia_thung is not null), '{}')
      into v_gia, v_gia_thung
    from (
      select distinct on (d.mat_hang_id) d.mat_hang_id, d.don_gia_kg, d.don_gia_thung
      from kho_phieu_nhap_dong d
      where d.phieu_nhap_id = p_id
      order by d.mat_hang_id, d.thu_tu, d.id
    ) x;

    update kho_phieu_nhap set
      nha_cung_cap_id = p_nha_cung_cap_id,
      vi_tri_id       = p_vi_tri_id,
      ngay_nhap       = p_ngay_nhap,
      so_hoa_don      = nullif(btrim(p_so_hoa_don), ''),
      ngay_hoa_don    = p_ngay_hoa_don,
      ghi_chu         = nullif(btrim(p_ghi_chu), ''),
      anh             = v_anh,
      truong_them     = coalesce(p_truong_them, '{}'),
      trang_thai      = 'nhap',
      phien_ban       = kho_phieu_nhap.phien_ban + 1
    where kho_phieu_nhap.id = p_id
    returning kho_phieu_nhap.id, kho_phieu_nhap.phien_ban into v_id, v_pb;

    delete from kho_phieu_nhap_dong where phieu_nhap_id = p_id;
  end if;

  perform kho_ghi_dong_phieu_nhap(v_id, p_chi_nhanh_id, p_ngay_nhap, coalesce(p_dong, '[]'::jsonb));

  if v_gia <> '{}'::jsonb then
    update kho_phieu_nhap_dong d
    set don_gia_kg = (v_gia ->> d.mat_hang_id::text)::bigint
    where d.phieu_nhap_id = v_id and v_gia ? d.mat_hang_id::text;
  end if;

  -- 0105: giá thùng đã điền đi theo mặt hàng sang dòng mới (dòng mới vẫn có quy đổi thùng); giá một cái tính lại
  -- theo số cái một thùng của dòng mới.
  if v_gia_thung <> '{}'::jsonb then
    update kho_phieu_nhap_dong d
    set don_gia_thung = (v_gia_thung ->> d.mat_hang_id::text)::bigint,
        don_gia_kg    = round((v_gia_thung ->> d.mat_hang_id::text)::numeric / d.so_trong_thung)::bigint
    where d.phieu_nhap_id = v_id and v_gia_thung ? d.mat_hang_id::text and d.so_trong_thung is not null;
  end if;

  return query select v_id, v_pb, false;
end;
$$;

create or replace function kho_luu_phieu_nhap(
  p_id              uuid,
  p_chi_nhanh_id    uuid,
  p_ma_gui          uuid,
  p_phien_ban       int,
  p_loai            text,
  p_nha_cung_cap_id uuid,
  p_vi_tri_id       uuid,
  p_ngay_nhap       date,
  p_so_hoa_don      text,
  p_ngay_hoa_don    date,
  p_han_thanh_toan  date,
  p_tien_thue       bigint,
  p_chi_phi_khac    bigint,
  p_ghi_chu         text,
  p_anh             text[],
  p_truong_them     jsonb,
  p_dong            jsonb
)
returns table (phieu_id uuid, phien_ban_moi int, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv      nhan_su;
  v_pn      kho_phieu_nhap;
  v_id      uuid;
  v_pb      int;
  v_anh     text;
  v_xem_gia boolean;          -- 0031
  v_dong    jsonb;            -- 0031
  v_gia     jsonb := '{}';    -- 0031
  v_gia_thung jsonb := '{}';  -- 0105
begin
  if not kho_duoc(p_chi_nhanh_id, 'nhap') then
    raise exception 'Tài khoản của bạn không được lập phiếu nhập'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();

  -- 0031: vai không xem giá không gửi được tiền. Kiểm TRƯỚC khi ghi gì.
  v_xem_gia := kho_duoc(p_chi_nhanh_id, 'xem_gia');
  if not v_xem_gia then
    if coalesce(p_tien_thue, 0) <> 0 or coalesce(p_chi_phi_khac, 0) <> 0 then
      raise exception 'Tài khoản của bạn không điền giá — dùng màn Nhận hàng'
        using errcode = 'insufficient_privilege';
    end if;
    if p_dong is not null and jsonb_typeof(p_dong) = 'array' then
      for v_dong in select value from jsonb_array_elements(p_dong) loop
        if jsonb_typeof(v_dong) = 'object'
           and ((v_dong ? 'don_gia_kg' and jsonb_typeof(v_dong -> 'don_gia_kg') <> 'null')
                or (v_dong ? 'don_gia_thung' and jsonb_typeof(v_dong -> 'don_gia_thung') <> 'null')) then   -- 0105
          raise exception 'Tài khoản của bạn không điền giá — dùng màn Nhận hàng'
            using errcode = 'insufficient_privilege';
        end if;
      end loop;
    end if;
  end if;

  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho — vào Cài đặt kho, bấm "Bắt đầu dùng kho"'
      using errcode = 'check_violation';
  end if;

  if p_loai not in ('mua', 'ton_dau') then
    raise exception 'Loại phiếu nhập không hợp lệ' using errcode = 'check_violation';
  end if;
  if p_ngay_nhap is null or p_ngay_nhap > hom_nay_vn() then
    raise exception 'Ngày nhập không được sau hôm nay' using errcode = 'check_violation';
  end if;
  if p_ngay_nhap < hom_nay_vn() - 90 then
    raise exception 'Ngày nhập quá 90 ngày trước — kiểm tra lại ngày' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from kho_vi_tri
                 where id = p_vi_tri_id and chi_nhanh_id = p_chi_nhanh_id
                   and dang_dung and loai in ('kho', 'quay')) then
    raise exception 'Chọn nơi nhận hàng là một kho hoặc quầy đang dùng'
      using errcode = 'check_violation';
  end if;
  if p_loai = 'ton_dau' and (p_nha_cung_cap_id is not null
                             or coalesce(p_tien_thue, 0) <> 0
                             or coalesce(p_chi_phi_khac, 0) <> 0) then
    raise exception 'Phiếu tồn đầu kỳ không có nhà cung cấp, thuế hay chi phí mua'
      using errcode = 'check_violation';
  end if;
  if coalesce(p_tien_thue, 0) < 0 or coalesce(p_chi_phi_khac, 0) < 0 then
    raise exception 'Tiền thuế và chi phí khác không được âm' using errcode = 'check_violation';
  end if;
  if p_nha_cung_cap_id is not null and not exists (
       select 1 from kho_nha_cung_cap where id = p_nha_cung_cap_id and dang_dung) then
    raise exception 'Nhà cung cấp không có hoặc đã ngừng dùng' using errcode = 'check_violation';
  end if;
  foreach v_anh in array coalesce(p_anh, '{}'::text[]) loop
    if v_anh not like p_chi_nhanh_id::text || '/nhap/%' then
      raise exception 'Đường dẫn ảnh không thuộc chi nhánh này' using errcode = 'check_violation';
    end if;
  end loop;

  if p_id is null then
    select pn.id, pn.phien_ban into v_id, v_pb
    from kho_phieu_nhap pn where pn.ma_gui = p_ma_gui;
    if found then
      return query select v_id, v_pb, true;
      return;
    end if;

    -- 0031: phiếu mới chưa có hạn thanh toán nào để "giữ nguyên".
    if not v_xem_gia and p_han_thanh_toan is not null then
      raise exception 'Tài khoản của bạn không điền giá — dùng màn Nhận hàng'
        using errcode = 'insufficient_privilege';
    end if;

    insert into kho_phieu_nhap
      (chi_nhanh_id, so_phieu, ma_gui, loai, nha_cung_cap_id, vi_tri_id, ngay_nhap,
       so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_thue, chi_phi_khac,
       ghi_chu, anh, truong_them, nguoi_tao)
    values
      (p_chi_nhanh_id,
       kho_sinh_so(p_chi_nhanh_id, case when p_loai = 'ton_dau' then 'TD' else 'PN' end),
       p_ma_gui, p_loai, p_nha_cung_cap_id, p_vi_tri_id, p_ngay_nhap,
       nullif(btrim(p_so_hoa_don), ''), p_ngay_hoa_don, p_han_thanh_toan,
       coalesce(p_tien_thue, 0), coalesce(p_chi_phi_khac, 0),
       nullif(btrim(p_ghi_chu), ''), coalesce(p_anh, '{}'), coalesce(p_truong_them, '{}'),
       v_nv.id)
    returning kho_phieu_nhap.id, kho_phieu_nhap.phien_ban into v_id, v_pb;
  else
    select * into v_pn from kho_phieu_nhap where kho_phieu_nhap.id = p_id for update;
    if not found or v_pn.chi_nhanh_id <> p_chi_nhanh_id then
      raise exception 'Không tìm thấy phiếu nhập' using errcode = 'foreign_key_violation';
    end if;
    if v_pn.trang_thai = 'cho_duyet' then
      raise exception 'Phiếu đang chờ duyệt — rút về rồi mới sửa được' using errcode = 'check_violation';
    end if;
    if v_pn.trang_thai not in ('nhap', 'tu_choi') then
      raise exception 'Phiếu % đã % — không sửa được nữa', v_pn.so_phieu,
        case v_pn.trang_thai when 'da_duyet' then 'được duyệt' else 'bị hủy' end
        using errcode = 'check_violation';
    end if;
    if p_phien_ban is distinct from v_pn.phien_ban then
      raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
        using errcode = 'check_violation';
    end if;
    if p_loai <> v_pn.loai then
      raise exception 'Không đổi được loại phiếu sau khi đã tạo' using errcode = 'check_violation';
    end if;

    -- 0031: vai không xem giá — không đổi hạn thanh toán, không xóa ảnh;
    -- ghi nhớ đơn giá đang có theo mặt hàng để mang sang dòng mới.
    if not v_xem_gia then
      if p_han_thanh_toan is not null
         and p_han_thanh_toan is distinct from v_pn.han_thanh_toan then
        raise exception 'Tài khoản của bạn không điền giá — dùng màn Nhận hàng'
          using errcode = 'insufficient_privilege';
      end if;
      if not (coalesce(v_pn.anh, '{}'::text[]) <@ coalesce(p_anh, '{}'::text[])) then
        raise exception 'Không xóa được ảnh hóa đơn đã chụp'
          using errcode = 'insufficient_privilege';
      end if;

      -- 0105: kèm giá thùng (dòng nhập theo giá thùng) — mất nó thì thành tiền thành giá một cái làm tròn.
      select coalesce(jsonb_object_agg(x.mat_hang_id::text, x.don_gia_kg), '{}'),
             coalesce(jsonb_object_agg(x.mat_hang_id::text, x.don_gia_thung) filter (where x.don_gia_thung is not null), '{}')
        into v_gia, v_gia_thung
      from (
        select distinct on (d.mat_hang_id) d.mat_hang_id, d.don_gia_kg, d.don_gia_thung
        from kho_phieu_nhap_dong d
        where d.phieu_nhap_id = p_id
        order by d.mat_hang_id, d.thu_tu, d.id
      ) x;
    end if;

    update kho_phieu_nhap set
      nha_cung_cap_id = p_nha_cung_cap_id,
      vi_tri_id       = p_vi_tri_id,
      ngay_nhap       = p_ngay_nhap,
      so_hoa_don      = nullif(btrim(p_so_hoa_don), ''),
      ngay_hoa_don    = p_ngay_hoa_don,
      -- 0031: vai không xem giá giữ nguyên ba ô tiền đang có.
      han_thanh_toan  = case when v_xem_gia then p_han_thanh_toan
                             else kho_phieu_nhap.han_thanh_toan end,
      tien_thue       = case when v_xem_gia then coalesce(p_tien_thue, 0)
                             else kho_phieu_nhap.tien_thue end,
      chi_phi_khac    = case when v_xem_gia then coalesce(p_chi_phi_khac, 0)
                             else kho_phieu_nhap.chi_phi_khac end,
      ghi_chu         = nullif(btrim(p_ghi_chu), ''),
      anh             = coalesce(p_anh, '{}'),
      truong_them     = coalesce(p_truong_them, '{}'),
      trang_thai      = 'nhap',
      phien_ban       = kho_phieu_nhap.phien_ban + 1
    where kho_phieu_nhap.id = p_id
    returning kho_phieu_nhap.id, kho_phieu_nhap.phien_ban into v_id, v_pb;

    delete from kho_phieu_nhap_dong where phieu_nhap_id = p_id;
  end if;

  perform kho_ghi_dong_phieu_nhap(v_id, p_chi_nhanh_id, p_ngay_nhap, coalesce(p_dong, '[]'::jsonb));

  -- 0031: đơn giá kế toán / quản lý đã điền đi theo mặt hàng sang dòng mới.
  if v_gia <> '{}'::jsonb then
    update kho_phieu_nhap_dong d
    set don_gia_kg = (v_gia ->> d.mat_hang_id::text)::bigint
    where d.phieu_nhap_id = v_id and v_gia ? d.mat_hang_id::text;
  end if;

  -- 0105: giá thùng đã điền đi theo mặt hàng sang dòng mới (dòng mới vẫn có quy đổi thùng); giá một cái tính lại
  -- theo số cái một thùng của dòng mới.
  if v_gia_thung <> '{}'::jsonb then
    update kho_phieu_nhap_dong d
    set don_gia_thung = (v_gia_thung ->> d.mat_hang_id::text)::bigint,
        don_gia_kg    = round((v_gia_thung ->> d.mat_hang_id::text)::numeric / d.so_trong_thung)::bigint
    where d.phieu_nhap_id = v_id and v_gia_thung ? d.mat_hang_id::text and d.so_trong_thung is not null;
  end if;

  return query select v_id, v_pb, false;
end;
$$;


-- =============================================================================
-- 5 · ĐIỀN GIÁ — giá thùng (thay THÂN 0031, cùng chữ ký)
-- =============================================================================
-- Mỗi phần tử p_gia: {dong_id, don_gia_kg} như cũ, hoặc {dong_id, don_gia_thung} cho dòng có quy đổi thùng —
-- don_gia_kg tự tính (giá một cái làm tròn), thành tiền theo giá thùng.
create or replace function kho_dien_gia_phieu_nhap(
  p_id             uuid,
  p_phien_ban      int,
  p_so_hoa_don     text,
  p_ngay_hoa_don   date,
  p_han_thanh_toan date,
  p_tien_thue      bigint,
  p_chi_phi_khac   bigint,
  p_gia            jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn    kho_phieu_nhap;
  v_g     jsonb;
  v_khoa  text;
  v_i     int := 0;
  v_dong  uuid;
  v_so    numeric;
  v_pb    int;
  v_thung int;   -- 0105
  c_uuid  constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'duyet_nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được điền giá'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_pn from kho_phieu_nhap where id = p_id for update;

  if v_pn.trang_thai not in ('nhap', 'cho_duyet', 'tu_choi') then
    raise exception 'Phiếu % đã % — không điền giá được nữa', v_pn.so_phieu,
      case v_pn.trang_thai when 'da_duyet' then 'được duyệt' else 'bị hủy' end
      using errcode = 'check_violation';
  end if;
  if p_phien_ban is distinct from v_pn.phien_ban then
    raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
      using errcode = 'check_violation';
  end if;
  if coalesce(p_tien_thue, 0) < 0 or coalesce(p_chi_phi_khac, 0) < 0 then
    raise exception 'Tiền thuế và chi phí khác không được âm' using errcode = 'check_violation';
  end if;
  if coalesce(p_tien_thue, 0) >= 10000000000000 or coalesce(p_chi_phi_khac, 0) >= 10000000000000 then
    raise exception 'Tiền thuế hoặc chi phí khác quá lớn — kiểm lại' using errcode = 'check_violation';
  end if;
  if v_pn.loai = 'ton_dau' and (coalesce(p_tien_thue, 0) <> 0 or coalesce(p_chi_phi_khac, 0) <> 0) then
    raise exception 'Phiếu tồn đầu kỳ không có thuế hay chi phí mua' using errcode = 'check_violation';
  end if;
  if p_ngay_hoa_don is not null and p_ngay_hoa_don > hom_nay_vn() then
    raise exception 'Ngày hóa đơn không được sau hôm nay' using errcode = 'check_violation';
  end if;

  if p_gia is null then p_gia := '[]'; end if;
  if jsonb_typeof(p_gia) <> 'array' then
    raise exception 'Danh sách giá không hợp lệ' using errcode = 'check_violation';
  end if;

  for v_g in select value from jsonb_array_elements(p_gia) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_g) <> 'object' then
      raise exception 'Giá thứ % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_g) loop
      if v_khoa <> all (array['dong_id', 'don_gia_kg', 'don_gia_thung']) then
        raise exception 'Giá thứ %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
      end if;
    end loop;
    if jsonb_typeof(v_g -> 'dong_id') is distinct from 'string' or (v_g ->> 'dong_id') !~* c_uuid then
      raise exception 'Giá thứ %: thiếu dòng hàng', v_i using errcode = 'check_violation';
    end if;
    v_dong := (v_g ->> 'dong_id')::uuid;
    if not exists (select 1 from kho_phieu_nhap_dong where id = v_dong and phieu_nhap_id = p_id) then
      raise exception 'Giá thứ %: dòng hàng không thuộc phiếu này — tải lại trang', v_i
        using errcode = 'check_violation';
    end if;
    -- MỚI (0105): giá một thùng (món đếm theo cái có quy đổi thùng) — thành tiền tính từ giá thùng.
    if v_g ? 'don_gia_thung' and v_g -> 'don_gia_thung' <> 'null'::jsonb then
      select so_trong_thung into v_thung from kho_phieu_nhap_dong where id = v_dong;
      if v_thung is null then
        raise exception 'Giá thứ %: món này không có quy đổi thùng — nhập giá một đơn vị', v_i
          using errcode = 'check_violation';
      end if;
      if jsonb_typeof(v_g -> 'don_gia_thung') <> 'number' then
        raise exception 'Giá thứ %: đơn giá phải là một con số', v_i using errcode = 'check_violation';
      end if;
      v_so := (v_g ->> 'don_gia_thung')::numeric;
      if v_so < 0 or v_so <> trunc(v_so) or v_so >= 10000000000 then
        raise exception 'Giá thứ %: đơn giá phải là số đồng nguyên, không âm', v_i
          using errcode = 'check_violation';
      end if;
      update kho_phieu_nhap_dong set don_gia_thung = v_so::bigint, don_gia_kg = round(v_so / v_thung)::bigint
      where id = v_dong;
      continue;
    end if;
    if jsonb_typeof(v_g -> 'don_gia_kg') is distinct from 'number' then
      raise exception 'Giá thứ %: đơn giá phải là một con số', v_i using errcode = 'check_violation';
    end if;
    v_so := (v_g ->> 'don_gia_kg')::numeric;
    if v_so < 0 or v_so <> trunc(v_so) or v_so >= 10000000000 then
      raise exception 'Giá thứ %: đơn giá phải là số đồng nguyên, không âm', v_i
        using errcode = 'check_violation';
    end if;
    update kho_phieu_nhap_dong set don_gia_kg = v_so::bigint, don_gia_thung = null where id = v_dong;
  end loop;

  update kho_phieu_nhap set
    so_hoa_don     = nullif(btrim(p_so_hoa_don), ''),
    ngay_hoa_don   = p_ngay_hoa_don,
    han_thanh_toan = p_han_thanh_toan,
    tien_thue      = coalesce(p_tien_thue, 0),
    chi_phi_khac   = coalesce(p_chi_phi_khac, 0),
    phien_ban      = phien_ban + 1
  where id = p_id
  returning phien_ban into v_pb;

  return v_pb;
end;
$$;


-- =============================================================================
-- 6 · DUYỆT PHIẾU NHẬP — chi phí khác chia theo tiền khi phiếu có món đếm theo cái (thay THÂN 0097)
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
  v_co_cai boolean;   -- 0105: phiếu có món đếm theo cái
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

  -- MỚI (0048): món theo dõi theo tảng phải mỗi dòng một tảng, có ngày mổ —
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

  -- MỚI (0050): tảng phải có kg sau repack.
  if v_pn.loai = 'mua' then
    select d.thu_tu, m.ten into v_thieu_tt, v_thieu_ten
    from kho_phieu_nhap_dong d
    join kho_mat_hang m on m.id = d.mat_hang_id
    where d.phieu_nhap_id = p_id and m.theo_tang and d.so_kg_thuc is null
    order by d.thu_tu
    limit 1;
    if found then
      raise exception 'Dòng % (%): tảng chưa có kg sau repack — repack, cân rồi gửi', v_thieu_tt, v_thieu_ten
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
  -- 0105: phiếu có món đếm theo cái (kg của nó là số cái, không phải cân nặng) → chi phí khác chia theo
  -- tiền hàng như thuế; phiếu chỉ có thịt chia theo kg như cũ.
  select exists (select 1 from kho_phieu_nhap_dong d join kho_mat_hang m on m.id = d.mat_hang_id
                 where d.phieu_nhap_id = p_id and m.dem_theo_cai) into v_co_cai;
  v_cp  := kho_chia_so_du_lon_nhat(
             case when v_cd.chi_phi_vao_gia_von then v_pn.chi_phi_khac else 0 end,
             case when v_co_cai and v_tong_hang > 0 then v_hang else v_kg end);
  v_vat := kho_chia_so_du_lon_nhat(
             case when v_cd.vat_vao_gia_von then v_pn.tien_thue else 0 end,
             case when v_tong_hang > 0 then v_hang else v_kg end);

  for v_dong in
    select * from kho_phieu_nhap_dong where phieu_nhap_id = p_id order by thu_tu
  loop
    v_i := v_i + 1;

    -- MỚI (0048): tảng của món theo dõi theo tảng có số tảng tăng dần của chi
    -- nhánh, và ngày ủ xong tra theo bảng ủ của món.
    -- 0097: số tảng là số đã cấp cho dòng lúc lưu. Dòng chưa có số (tồn đầu kỳ dạng lưới, phiếu
    -- lưu trước 0097, món bật theo tảng sau khi lưu) thì sinh như cũ và ghi vào sổ. Dòng có số mà
    -- món đã tắt theo tảng → số ghi bỏ, lô không số.
    select * into v_mh from kho_mat_hang where id = v_dong.mat_hang_id;
    v_so_tang := null;
    if v_mh.theo_tang and v_dong.so_goi <= 1 then
      v_so_tang := v_dong.so_tang;
      if v_so_tang is null then
        v_so_tang := kho_sinh_so_tang(v_pn.chi_nhanh_id);
        insert into kho_so_tang_cap (chi_nhanh_id, so_tang, phieu_nhap_id, nguoi_cap)
        values (v_pn.chi_nhanh_id, v_so_tang, v_pn.id, v_nv.id);
      end if;
    elsif v_dong.so_tang is not null then
      update kho_so_tang_cap set bo_luc = now(), nguoi_bo = v_nv.id
      where chi_nhanh_id = v_pn.chi_nhanh_id and so_tang = v_dong.so_tang and bo_luc is null;
    end if;
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
            v_dong.thanh_tien + v_cp[v_i] + v_vat[v_i], coalesce(v_dong.so_kg_thuc, v_dong.so_kg));

    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
    values
      (v_pn.chi_nhanh_id, v_lo, v_pn.vi_tri_id, v_dong.mat_hang_id, 'nhap',
       coalesce(v_dong.so_kg_thuc, v_dong.so_kg), v_dong.so_goi, 'phieu_nhap', v_pn.id, v_nv.id, v_pn.ngay_nhap);

    -- 0097: dòng đã duyệt mang đúng số của lô (null khi lô không số).
    update kho_phieu_nhap_dong set lo_id = v_lo, so_tang = v_so_tang where id = v_dong.id;
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


-- =============================================================================
-- 7 · MISA — đơn vị tính theo món (thay THÂN 0040)
-- =============================================================================
-- Món đếm theo cái: đơn vị là don_vi_goi ("lon", "chai"…), số lượng là số cái, đơn giá là giá một cái
-- (don_gia_kg); thành tiền là thành tiền của dòng (khớp hóa đơn khi nhập theo giá thùng).
create or replace function kho_du_lieu_misa(p_chi_nhanh_id uuid, p_tu date, p_den date, p_loai text)
returns table (
  thu_tu int, loai_chung_tu text, ngay_chung_tu date, so_chung_tu text, so_hoa_don text, ngay_hoa_don date,
  ma_ncc text, ten_ncc text, ma_so_thue text, ma_hang text, ten_hang text, dvt text,
  so_luong numeric, don_gia bigint, thanh_tien bigint, thue_suat numeric, tien_thue bigint,
  tk_no text, tk_co text, tk_thue text, hinh_thuc text, dien_giai text, thieu_ma boolean, ref_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_tk     jsonb;
  v_n      int := 0;
  v_p      record;
  v_d      record;
  v_t      record;
  v_thue   bigint[];
  v_ts     numeric[];
  v_i      int;
  v_ts_pt  numeric;
  v_ma_ncc text;
  v_thieu_ncc boolean;
  v_dg     text;
  v_tk_tien text;
begin
  if not kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    raise exception 'Tài khoản của bạn không xuất được dữ liệu kế toán' using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 400 then
    raise exception 'Mỗi lần xuất tối đa khoảng 13 tháng' using errcode = 'check_violation';
  end if;
  if p_loai is null or p_loai not in ('mua_hang', 'thanh_toan') then
    raise exception 'Chọn loại dữ liệu: mua hàng hoặc thanh toán' using errcode = 'check_violation';
  end if;
  select c.misa_tk into v_tk from kho_cai_dat c where c.chi_nhanh_id = p_chi_nhanh_id;
  v_tk := '{"tk_no_hang":"1561","tk_thue":"1331","tk_co_ncc":"331","tk_tien_mat":"1111","tk_ngan_hang":"1121","tk_bu_tru":"131"}'::jsonb
          || coalesce(v_tk, '{}'::jsonb);

  if p_loai = 'mua_hang' then
    for v_p in
      select p.*, n.ten as ten_ncc, n.ma_misa as ncc_ma_misa, n.ma_so_thue as ncc_mst,
             (select coalesce(sum(dd.thanh_tien), 0) from kho_phieu_nhap_dong dd where dd.phieu_nhap_id = p.id) as tien_hang
      from kho_phieu_nhap p
      join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
      where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
        and p.ngay_nhap between p_tu and p_den
      order by p.ngay_nhap, p.so_phieu
    loop
      v_ma_ncc := coalesce(v_p.ncc_ma_misa, v_p.ncc_mst, 'NCC-' || upper(left(v_p.nha_cung_cap_id::text, 8)));
      v_thieu_ncc := v_p.ncc_ma_misa is null;
      v_ts_pt := case when v_p.tien_hang > 0 and v_p.tien_thue > 0
                      then round(v_p.tien_thue::numeric * 100 / v_p.tien_hang, 2) else 0 end;
      v_dg := 'Nhập hàng ' || v_p.so_phieu
              || case when v_p.da_doi_chieu and v_p.tien_hoa_don is distinct from v_p.tien_hang + v_p.tien_thue + v_p.chi_phi_khac
                      then '; hóa đơn ghi ' || replace(to_char(v_p.tien_hoa_don, 'FM999G999G999G999'), ',', '.')
                           || ' đ, lệch ' || replace(to_char(v_p.tien_hoa_don - (v_p.tien_hang + v_p.tien_thue + v_p.chi_phi_khac),
                                                            'FMS999G999G999G999'), ',', '.') || ' đ so với phiếu'
                      else '' end;
      select array_agg(dd.thanh_tien::numeric order by dd.thu_tu, dd.id) into v_ts
      from kho_phieu_nhap_dong dd where dd.phieu_nhap_id = v_p.id;
      v_thue := kho_chia_so_du_lon_nhat(v_p.tien_thue, coalesce(v_ts, '{}'::numeric[]));
      v_i := 0;
      for v_d in
        select dd.*, m.ma as mh_ma, m.ten as mh_ten, m.ma_misa as mh_ma_misa,
               m.dem_theo_cai as mh_dem_cai, m.don_vi_goi as mh_dvt   -- 0105
        from kho_phieu_nhap_dong dd join kho_mat_hang m on m.id = dd.mat_hang_id
        where dd.phieu_nhap_id = v_p.id order by dd.thu_tu, dd.id
      loop
        v_i := v_i + 1;
        v_n := v_n + 1;
        return query select v_n, 'mua_hang'::text, v_p.ngay_nhap, v_p.so_phieu, v_p.so_hoa_don, v_p.ngay_hoa_don,
          v_ma_ncc, v_p.ten_ncc, v_p.ncc_mst, coalesce(v_d.mh_ma_misa, v_d.mh_ma), v_d.mh_ten,
          case when v_d.mh_dem_cai then v_d.mh_dvt else 'kg' end,
          v_d.so_kg, v_d.don_gia_kg, v_d.thanh_tien, v_ts_pt, v_thue[v_i],
          v_tk ->> 'tk_no_hang', v_tk ->> 'tk_co_ncc', v_tk ->> 'tk_thue', null::text, v_dg,
          v_thieu_ncc or v_d.mh_ma_misa is null, v_p.id;
      end loop;
      if v_p.chi_phi_khac > 0 then
        v_n := v_n + 1;
        return query select v_n, 'mua_hang'::text, v_p.ngay_nhap, v_p.so_phieu, v_p.so_hoa_don, v_p.ngay_hoa_don,
          v_ma_ncc, v_p.ten_ncc, v_p.ncc_mst, null::text, 'Chi phí mua hàng khác'::text, null::text,
          null::numeric, null::bigint, v_p.chi_phi_khac, 0::numeric, 0::bigint,
          v_tk ->> 'tk_no_hang', v_tk ->> 'tk_co_ncc', v_tk ->> 'tk_thue', null::text, v_dg,
          v_thieu_ncc, v_p.id;
      end if;
    end loop;
    return;
  end if;

  for v_t in
    select t.*, n.ten as ten_ncc, n.ma_misa as ncc_ma_misa, n.ma_so_thue as ncc_mst,
           (select string_agg(distinct p.so_hoa_don, ', ') from kho_thanh_toan_phan_bo pb
              join kho_phieu_nhap p on p.id = pb.phieu_nhap_id where pb.thanh_toan_id = t.id) as ds_hoa_don,
           (select string_agg(p.so_phieu, ', ' order by p.so_phieu) from kho_thanh_toan_phan_bo pb
              join kho_phieu_nhap p on p.id = pb.phieu_nhap_id where pb.thanh_toan_id = t.id) as ds_phieu
    from kho_thanh_toan t
    join kho_nha_cung_cap n on n.id = t.nha_cung_cap_id
    where t.chi_nhanh_id = p_chi_nhanh_id and t.trang_thai = 'hieu_luc' and t.ngay between p_tu and p_den
    order by t.ngay, t.so_phieu
  loop
    v_n := v_n + 1;
    v_tk_tien := case v_t.hinh_thuc when 'tien_mat' then v_tk ->> 'tk_tien_mat'
                                    when 'chuyen_khoan' then v_tk ->> 'tk_ngan_hang' end;
    return query select v_n, v_t.loai, v_t.ngay, v_t.so_phieu, v_t.ds_hoa_don, null::date,
      coalesce(v_t.ncc_ma_misa, v_t.ncc_mst, 'NCC-' || upper(left(v_t.nha_cung_cap_id::text, 8))),
      v_t.ten_ncc, v_t.ncc_mst, null::text, null::text, null::text,
      null::numeric, null::bigint, v_t.so_tien, null::numeric, null::bigint,
      case v_t.loai when 'hoan_tien' then v_tk_tien else v_tk ->> 'tk_co_ncc' end,
      case v_t.loai when 'thanh_toan' then v_tk_tien
                    when 'hoan_tien'  then v_tk ->> 'tk_co_ncc'
                    when 'giam_tru'   then v_tk ->> 'tk_no_hang'
                    else v_tk ->> 'tk_bu_tru' end,
      null::text, v_t.hinh_thuc,
      case v_t.loai when 'thanh_toan' then 'Trả tiền nhà cung cấp'
                    when 'hoan_tien'  then 'Nhà cung cấp hoàn tiền'
                    when 'giam_tru'   then 'Giảm trừ công nợ'
                    else 'Bù trừ công nợ' end
        || coalesce(': ' || v_t.ghi_chu, '') || coalesce(' — phiếu ' || v_t.ds_phieu, ''),
      v_t.ncc_ma_misa is null, v_t.id;
  end loop;
end;
$$;


-- =============================================================================
-- 8 · BÁO CÁO VÀ VIEW CỘNG KG NHIỀU MÓN — kg chỉ tính hàng cân ký (thay THÂN, cùng chữ ký / cột)
-- =============================================================================
create or replace function kho_bao_cao_theo_thang(p_chi_nhanh_id uuid, p_nam int)
returns table (
  thang int, tu date, den date,
  ton_dau_kg numeric, ton_dau_tien bigint,
  nhap_kg numeric, nhap_tien bigint,
  ban_kg numeric, ban_tien bigint,
  xuat_bep_kg numeric, xuat_bep_tien bigint,
  xuat_khac_kg numeric, xuat_khac_tien bigint,
  tra_ncc_kg numeric, tra_ncc_tien bigint,
  huy_kg numeric, huy_tien bigint,
  hao_hut_kg numeric, hao_hut_tien bigint,
  pha_mat_kg numeric, pha_mat_tien bigint,
  ton_cuoi_kg numeric, ton_cuoi_tien bigint,
  chi_phi_thit bigint,
  co_ipos boolean, doanh_thu bigint, chi_phi_tren_doanh_thu_pt numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gia boolean;
  v_dau date;
  v_cuoi date;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';
  end if;
  if p_nam is null or p_nam < 2000 or p_nam > 2100 then
    raise exception 'Chọn năm (ví dụ 2026)' using errcode = 'check_violation';
  end if;
  v_gia  := kho_duoc(p_chi_nhanh_id, 'xem_gia');
  v_dau  := make_date(p_nam, 1, 1);
  v_cuoi := make_date(p_nam, 12, 31);

  return query
  with thang_ds as (
    select g.t::int as t, make_date(p_nam, g.t::int, 1) as tu,
           (make_date(p_nam, g.t::int, 1) + interval '1 month' - interval '1 day')::date as den
    from generate_series(1, 12) g(t)
    where make_date(p_nam, g.t::int, 1) <= hom_nay_vn()
  ),
  dong as (
    -- 0105: món đếm theo cái — tiền vẫn cộng, kg tính 0 (kg của nó là số cái).
    select s.ngay, case when m.dem_theo_cai then 0 else s.so_kg end as so_kg, coalesce(g.loai, s.loai) as loai,
           s.so_kg * coalesce(lg.gia_von_kg, 0) as gt
    from kho_so_cai s
    join kho_mat_hang m on m.id = s.mat_hang_id
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_lo_gia lg on lg.lo_id = s.lo_id
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay <= v_cuoi
  ),
  truoc as (
    select coalesce(sum(d.so_kg), 0) as kg, coalesce(sum(d.gt), 0) as gt
    from dong d where d.ngay < v_dau
  ),
  gom as (
    select extract(month from d.ngay)::int as t,
      coalesce(sum(d.so_kg), 0) as tong_kg,
      coalesce(sum(d.gt), 0)    as tong_gt,
      coalesce(sum(d.so_kg) filter (where d.loai = 'nhap'), 0) as nhap_kg,
      coalesce(sum(d.gt)    filter (where d.loai = 'nhap'), 0) as nhap_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai = 'ban'), 0) as ban_kg,
      -coalesce(sum(d.gt)    filter (where d.loai = 'ban'), 0) as ban_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai = 'xuat_bep'), 0) as bep_kg,
      -coalesce(sum(d.gt)    filter (where d.loai = 'xuat_bep'), 0) as bep_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai = 'xuat_khac'), 0) as khac_kg,
      -coalesce(sum(d.gt)    filter (where d.loai = 'xuat_khac'), 0) as khac_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai = 'tra_ncc'), 0) as tra_kg,
      -coalesce(sum(d.gt)    filter (where d.loai = 'tra_ncc'), 0) as tra_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai = 'huy'), 0) as huy_kg,
      -coalesce(sum(d.gt)    filter (where d.loai = 'huy'), 0) as huy_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai in ('hao_hut', 'kiem_ke')), 0) as hh_kg,
      -coalesce(sum(d.gt)    filter (where d.loai in ('hao_hut', 'kiem_ke')), 0) as hh_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai in ('pha_loc_vao', 'pha_loc_ra')), 0) as pha_kg,
      -coalesce(sum(d.gt)    filter (where d.loai in ('pha_loc_vao', 'pha_loc_ra')), 0) as pha_gt
    from dong d
    where d.ngay >= v_dau
    group by 1
  ),
  ipos as (
    select extract(month from ((i.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date)::int as t,
           coalesce(sum(i.thanh_tien), 0) as dt
    from kho_ipos_dong i
    where i.chi_nhanh_id = p_chi_nhanh_id and i.trang_thai <> 'da_huy'
      and ((i.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date between v_dau and v_cuoi
    group by 1
  ),
  noi as (
    select k.t, k.tu, k.den,
           (select tr.kg from truoc tr) + coalesce((select sum(g2.tong_kg) from gom g2 where g2.t < k.t), 0) as dau_kg,
           (select tr.gt from truoc tr) + coalesce((select sum(g2.tong_gt) from gom g2 where g2.t < k.t), 0) as dau_gt,
           coalesce(g.tong_kg, 0) as tong_kg, coalesce(g.tong_gt, 0) as tong_gt,
           coalesce(g.nhap_kg, 0) as nhap_kg, coalesce(g.nhap_gt, 0) as nhap_gt,
           coalesce(g.ban_kg, 0) as ban_kg, coalesce(g.ban_gt, 0) as ban_gt,
           coalesce(g.bep_kg, 0) as bep_kg, coalesce(g.bep_gt, 0) as bep_gt,
           coalesce(g.khac_kg, 0) as khac_kg, coalesce(g.khac_gt, 0) as khac_gt,
           coalesce(g.tra_kg, 0) as tra_kg, coalesce(g.tra_gt, 0) as tra_gt,
           coalesce(g.huy_kg, 0) as huy_kg, coalesce(g.huy_gt, 0) as huy_gt,
           coalesce(g.hh_kg, 0) as hh_kg, coalesce(g.hh_gt, 0) as hh_gt,
           coalesce(g.pha_kg, 0) as pha_kg, coalesce(g.pha_gt, 0) as pha_gt,
           ip.t is not null as co_ipos, ip.dt
    from thang_ds k
    left join gom g on g.t = k.t
    left join ipos ip on ip.t = k.t
  )
  select n.t, n.tu, n.den,
         round(n.dau_kg, 3), case when v_gia then round(n.dau_gt)::bigint end,
         round(n.nhap_kg, 3), case when v_gia then round(n.nhap_gt)::bigint end,
         round(n.ban_kg, 3),  case when v_gia then round(n.ban_gt)::bigint end,
         round(n.bep_kg, 3),  case when v_gia then round(n.bep_gt)::bigint end,
         round(n.khac_kg, 3), case when v_gia then round(n.khac_gt)::bigint end,
         round(n.tra_kg, 3),  case when v_gia then round(n.tra_gt)::bigint end,
         round(n.huy_kg, 3),  case when v_gia then round(n.huy_gt)::bigint end,
         round(n.hh_kg, 3),   case when v_gia then round(n.hh_gt)::bigint end,
         round(n.pha_kg, 3),  case when v_gia then round(n.pha_gt)::bigint end,
         round(n.dau_kg + n.tong_kg, 3), case when v_gia then round(n.dau_gt + n.tong_gt)::bigint end,
         case when v_gia then round(n.ban_gt + n.bep_gt + n.khac_gt + n.huy_gt + n.hh_gt)::bigint end,
         n.co_ipos,
         case when v_gia and n.co_ipos then n.dt::bigint end,
         case when v_gia and n.co_ipos and n.dt > 0
              then round((n.ban_gt + n.bep_gt + n.khac_gt + n.huy_gt + n.hh_gt) / n.dt * 100, 1) end
  from noi n
  order by n.t;
end;
$$;

create or replace function kho_bao_cao_mua_hang(p_chi_nhanh_id uuid, p_tu date, p_den date, p_nhom text)
returns table (
  nhom text, id uuid, ma text, ten text,
  so_phieu int, so_ncc int, so_mat_hang int,
  so_kg numeric, so_goi int,
  tien_hang bigint, tien_thue bigint, chi_phi_khac bigint, tong_tien bigint,
  gia_tb_kg bigint, gia_thap_kg bigint, gia_cao_kg bigint,
  ty_trong_pt numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tong numeric;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem_gia') then
    raise exception 'Tài khoản của bạn không xem được báo cáo mua hàng (có giá tiền)' using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 366 then
    raise exception 'Khoảng ngày tối đa 1 năm' using errcode = 'check_violation';
  end if;
  if p_nhom is null or p_nhom not in ('ncc', 'mat_hang') then
    raise exception 'Chọn xem theo nhà cung cấp hoặc theo mặt hàng' using errcode = 'check_violation';
  end if;

  select coalesce(sum(d.thanh_tien), 0) into v_tong
  from kho_phieu_nhap p
  join kho_phieu_nhap_dong d on d.phieu_nhap_id = p.id
  where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
    and p.ngay_nhap between p_tu and p_den;

  if p_nhom = 'ncc' then
    return query
    with pn as (
      select p.id, p.nha_cung_cap_id as ncc, p.tien_thue, p.chi_phi_khac, p.tien_hoa_don,
             (select coalesce(sum(d.thanh_tien), 0) from kho_phieu_nhap_dong d where d.phieu_nhap_id = p.id) as tien_hang,
             -- 0105: kg, gói và giá TB/kg của nhà cung cấp chỉ tính hàng cân ký (món đếm theo cái: kg là số cái).
             (select coalesce(sum(d.so_kg), 0) from kho_phieu_nhap_dong d join kho_mat_hang m on m.id = d.mat_hang_id
               where d.phieu_nhap_id = p.id and not m.dem_theo_cai) as kg,
             (select coalesce(sum(d.so_goi), 0) from kho_phieu_nhap_dong d join kho_mat_hang m on m.id = d.mat_hang_id
               where d.phieu_nhap_id = p.id and not m.dem_theo_cai) as goi,
             (select coalesce(sum(d.thanh_tien), 0) from kho_phieu_nhap_dong d join kho_mat_hang m on m.id = d.mat_hang_id
               where d.phieu_nhap_id = p.id and not m.dem_theo_cai) as tien_kg
      from kho_phieu_nhap p
      where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
        and p.ngay_nhap between p_tu and p_den
    ),
    mh as (
      select p.nha_cung_cap_id as ncc, count(distinct d.mat_hang_id)::int as so_mh
      from kho_phieu_nhap p
      join kho_phieu_nhap_dong d on d.phieu_nhap_id = p.id
      where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
        and p.ngay_nhap between p_tu and p_den
      group by p.nha_cung_cap_id
    ),
    g as (
      select pn.ncc, count(*)::int as so_phieu, sum(pn.kg) as kg, sum(pn.goi)::int as goi, sum(pn.tien_kg) as tien_kg,
             sum(pn.tien_hang) as tien_hang, sum(pn.tien_thue) as thue, sum(pn.chi_phi_khac) as cp,
             sum(coalesce(pn.tien_hoa_don, pn.tien_hang + pn.tien_thue + pn.chi_phi_khac)) as tong
      from pn group by pn.ncc
    )
    select 'ncc'::text, g.ncc, n.ma_misa, coalesce(n.ten, 'Không ghi nhà cung cấp'),
           g.so_phieu, null::int, coalesce(mh.so_mh, 0),
           round(g.kg, 3), g.goi,
           g.tien_hang::bigint, g.thue::bigint, g.cp::bigint, g.tong::bigint,
           case when g.kg > 0 then round(g.tien_kg / g.kg)::bigint end,
           null::bigint, null::bigint,
           case when v_tong > 0 then round(g.tien_hang * 100 / v_tong, 1) end
    from g
    left join kho_nha_cung_cap n on n.id = g.ncc
    left join mh on mh.ncc is not distinct from g.ncc
    order by g.tien_hang desc, n.ten;
  else
    return query
    select 'mat_hang'::text, m.id, m.ma, m.ten,
           count(distinct p.id)::int, count(distinct p.nha_cung_cap_id)::int, null::int,
           round(sum(d.so_kg), 3), sum(d.so_goi)::int,
           sum(d.thanh_tien)::bigint, null::bigint, null::bigint, null::bigint,
           case when sum(d.so_kg) > 0 then round(sum(d.thanh_tien) / sum(d.so_kg))::bigint end,
           min(d.don_gia_kg)::bigint, max(d.don_gia_kg)::bigint,
           case when v_tong > 0 then round(sum(d.thanh_tien) * 100 / v_tong, 1) end
    from kho_phieu_nhap p
    join kho_phieu_nhap_dong d on d.phieu_nhap_id = p.id
    join kho_mat_hang m on m.id = d.mat_hang_id
    where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
      and p.ngay_nhap between p_tu and p_den
    group by m.id, m.ma, m.ten, m.loai, m.thu_tu
    order by sum(d.thanh_tien) desc, m.loai, m.thu_tu, m.ten;
  end if;
end;
$$;

create or replace function kho_bao_cao_ncc(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  nha_cung_cap_id uuid, ten text,
  so_phieu int, tong_kg numeric, gia_tb_kg bigint,
  thu_hoi_tb_pt numeric, so_phien_pha int, kg_tra numeric,
  so_lan_lech_hoa_don int, so_ngay_tra_tb numeric,
  so_don int, so_don_thieu int, kg_thieu numeric, so_don_tre int,
  diem_sao numeric,
  kg_repack_ncc numeric, kg_repack_thuc numeric, hao_repack_pt numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gia     boolean;
  v_hom_nay date := hom_nay_vn();
begin
  if not (kho_duoc(p_chi_nhanh_id, 'nhap') or kho_duoc(p_chi_nhanh_id, 'xem_gia')) then
    raise exception 'Tài khoản của bạn không xem được đánh giá nhà cung cấp ở chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 366 then
    raise exception 'Khoảng ngày tối đa 1 năm' using errcode = 'check_violation';
  end if;
  v_gia := kho_duoc(p_chi_nhanh_id, 'xem_gia');

  return query
  with pn as (
    select p.id, p.nha_cung_cap_id as ncc, p.tien_thue, p.chi_phi_khac, p.da_doi_chieu, p.tien_hoa_don,
           p.ngay_nhap, p.ngay_hoa_don,
           -- 0105: kg và giá TB/kg chỉ tính hàng cân ký (món đếm theo cái: kg là số cái).
           (select coalesce(sum(d.so_kg), 0) from kho_phieu_nhap_dong d join kho_mat_hang m on m.id = d.mat_hang_id
             where d.phieu_nhap_id = p.id and not m.dem_theo_cai) as kg,
           (select coalesce(sum(d.thanh_tien), 0) from kho_phieu_nhap_dong d join kho_mat_hang m on m.id = d.mat_hang_id
             where d.phieu_nhap_id = p.id and not m.dem_theo_cai) as tien_hang
    from kho_phieu_nhap p
    where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
      and p.nha_cung_cap_id is not null and p.ngay_nhap between p_tu and p_den
  ),
  pn_ncc as (
    select pn.ncc, count(*)::int as so_phieu, sum(pn.kg) as kg, sum(pn.tien_hang) as tien_hang,
           count(*) filter (where pn.da_doi_chieu
                              and pn.tien_hoa_don <> pn.tien_hang + pn.tien_thue + pn.chi_phi_khac)::int as lech
    from pn group by pn.ncc
  ),
  -- 0050: hao hụt repack — chỉ các dòng đã ghi kg sau repack.
  repack as (
    select pn.ncc, sum(d.so_kg) as kg_ncc, sum(d.so_kg_thuc) as kg_thuc
    from pn join kho_phieu_nhap_dong d on d.phieu_nhap_id = pn.id
    where d.so_kg_thuc is not null
    group by pn.ncc
  ),
  tra_tien as (
    select pn.ncc,
           sum(pb.so_tien * (t.ngay - coalesce(pn.ngay_hoa_don, pn.ngay_nhap)))::numeric
             / nullif(sum(pb.so_tien), 0) as ngay_tb
    from pn
    join kho_thanh_toan_phan_bo pb on pb.phieu_nhap_id = pn.id
    join kho_thanh_toan t on t.id = pb.thanh_toan_id
    where t.loai = 'thanh_toan' and t.trang_thai = 'hieu_luc'
    group by pn.ncc
  ),
  pha as (
    select p.nha_cung_cap_id as ncc,
           sum(v.so_kg * f.ty_le_thu_hoi) / nullif(sum(v.so_kg), 0) as thu_hoi,
           count(distinct f.id)::int as so_phien
    from kho_phien_pha f
    join kho_phien_pha_vao v on v.phien_pha_id = f.id
    join kho_lo l on l.id = v.lo_id
    join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    join kho_phieu_nhap p on p.id = d.phieu_nhap_id
    where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'da_chot' and f.ty_le_thu_hoi is not null
      and f.ngay_pha between p_tu and p_den and p.nha_cung_cap_id is not null
    group by p.nha_cung_cap_id
  ),
  tra_hang as (
    select p.nha_cung_cap_id as ncc, sum(xd.so_kg) filter (where not m.dem_theo_cai) as kg
    from kho_phieu_xuat x
    join kho_phieu_xuat_dong xd on xd.phieu_xuat_id = x.id
    join kho_mat_hang m on m.id = xd.mat_hang_id
    join kho_phieu_nhap p on p.id = x.phieu_nhap_id
    where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'tra_ncc' and x.trang_thai not in ('tu_choi', 'da_huy')
      and x.ngay between p_tu and p_den
    group by p.nha_cung_cap_id
  ),
  don as (
    select d.id, d.nha_cung_cap_id as ncc, d.trang_thai, d.ngay_giao_du_kien,
           (select min(p.ngay_nhap) from kho_phieu_nhap p
             where p.don_dat_id = d.id and p.trang_thai in ('cho_duyet', 'da_duyet')) as ngay_nhan_dau,
           (select coalesce(sum(greatest(dd.so_kg_dat - dd.so_kg_da_nhan, 0)), 0)
              from kho_don_dat_dong dd where dd.don_dat_id = d.id) as kg_con,
           exists (
             select 1 from kho_don_dat_dong dd
             where dd.don_dat_id = d.id
               and not kho_don_dat_dong_du(dd.so_kg_dat, dd.so_kg_da_nhan, dd.so_goi_dat,
                     (select sum(pd.so_goi)::int from kho_phieu_nhap p
                        join kho_phieu_nhap_dong pd on pd.phieu_nhap_id = p.id
                       where p.don_dat_id = d.id and p.trang_thai in ('cho_duyet', 'da_duyet')
                         and pd.mat_hang_id = dd.mat_hang_id))) as con_thieu
    from kho_don_dat d
    where d.chi_nhanh_id = p_chi_nhanh_id and d.trang_thai <> 'nhap' and d.gui_luc is not null
      and d.ngay_giao_du_kien between p_tu and p_den
  ),
  don_ncc as (
    select don.ncc, count(*)::int as so_don,
           count(*) filter (where don.ngay_nhan_dau is not null and don.con_thieu
                              and (don.trang_thai = 'huy' or don.ngay_giao_du_kien < v_hom_nay))::int as thieu,
           coalesce(sum(don.kg_con) filter (where don.ngay_nhan_dau is not null and don.con_thieu
                              and (don.trang_thai = 'huy' or don.ngay_giao_du_kien < v_hom_nay)), 0) as kg_thieu,
           count(*) filter (where don.ngay_nhan_dau > don.ngay_giao_du_kien
                              or (don.ngay_nhan_dau is null and don.trang_thai <> 'huy'
                                  and don.ngay_giao_du_kien < v_hom_nay))::int as tre
    from don group by don.ncc
  ),
  ds as (
    select n.id, n.ten,
           coalesce(a.so_phieu, 0) as so_phieu, coalesce(a.kg, 0) as kg, a.tien_hang, coalesce(a.lech, 0) as lech,
           h.thu_hoi, coalesce(h.so_phien, 0) as so_phien, coalesce(r.kg, 0) as kg_tra, tt.ngay_tb,
           coalesce(o.so_don, 0) as so_don, coalesce(o.thieu, 0) as thieu, coalesce(o.kg_thieu, 0) as kg_thieu,
           coalesce(o.tre, 0) as tre,
           rp.kg_ncc as rp_ncc, rp.kg_thuc as rp_thuc
    from kho_nha_cung_cap n
    left join pn_ncc a on a.ncc = n.id
    left join pha h on h.ncc = n.id
    left join tra_hang r on r.ncc = n.id
    left join tra_tien tt on tt.ncc = n.id
    left join don_ncc o on o.ncc = n.id
    left join repack rp on rp.ncc = n.id
    where a.ncc is not null or o.ncc is not null or h.ncc is not null or r.ncc is not null
  )
  select ds.id, ds.ten, ds.so_phieu, round(ds.kg, 3),
         case when v_gia and ds.kg > 0 then round(ds.tien_hang / ds.kg)::bigint end,
         round(ds.thu_hoi, 1), ds.so_phien, round(ds.kg_tra, 3),
         case when v_gia then ds.lech end,
         case when v_gia then round(ds.ngay_tb, 1) end,
         ds.so_don, ds.thieu, round(ds.kg_thieu, 3), ds.tre,
         case when ds.so_phieu = 0 and ds.so_don = 0 then null
              else round(greatest(1, least(5, round((5
                     - case when ds.so_don > 0 then 2.0 * ds.thieu / ds.so_don + 1.0 * ds.tre / ds.so_don else 0 end
                     - case when ds.so_phieu > 0 then 1.0 * ds.lech / ds.so_phieu
                                                    + least(1, 10 * ds.kg_tra / nullif(ds.kg, 0)) else 0 end
                   ) * 2) / 2)), 1)
         end,
         round(ds.rp_ncc, 3), round(ds.rp_thuc, 3),
         case when ds.rp_ncc > 0 then round((ds.rp_ncc - ds.rp_thuc) * 100 / ds.rp_ncc, 2) end
  from ds
  order by ds.kg desc, ds.ten;
end;
$$;

create or replace function kho_chi_so_quan_tri(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns jsonb
language sql
stable
set search_path = public
as $$
  with ky as (
    select p_tu as tu, p_den as den,
           p_tu - (p_den - p_tu + 1) as tu_truoc, p_tu - 1 as den_truoc
  ),
  ton as (
    select coalesce(sum(g.gia_tri) filter (where v.loai = 'kho'), 0)  as gia_tri_kho,
           coalesce(sum(g.gia_tri) filter (where v.loai = 'quay'), 0) as gia_tri_quay
    from kho_v_ton_gia g
    join kho_vi_tri v on v.id = g.vi_tri_id
    where g.chi_nhanh_id = p_chi_nhanh_id
  ),
  quay as (
    select m.id, m.ton_toi_thieu_kg, coalesce(sum(t.so_kg), 0) as con_kg
    from kho_mat_hang m
    left join kho_v_ton t on t.mat_hang_id = m.id and t.chi_nhanh_id = p_chi_nhanh_id
                         and t.loai_vi_tri = 'quay' and t.tinh_trang_han <> 'het_han'
    where m.dang_dung and m.ton_toi_thieu_kg is not null
    group by m.id, m.ton_toi_thieu_kg
  ),
  pha as (
    select sum(f.tong_kg_vao)  filter (where f.ngay_pha between k.tu and k.den)             as kg_vao,
           sum(f.tong_kg_thit) filter (where f.ngay_pha between k.tu and k.den)             as kg_thit,
           count(*)            filter (where f.ngay_pha between k.tu and k.den)             as so_phien,
           sum(f.tong_kg_vao)  filter (where f.ngay_pha between k.tu_truoc and k.den_truoc) as kg_vao_truoc,
           sum(f.tong_kg_thit) filter (where f.ngay_pha between k.tu_truoc and k.den_truoc) as kg_thit_truoc
    from kho_phien_pha f, ky k
    where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'da_chot'
  ),
  gia_von as (
    select sum(g.gia_tri)   filter (where l.ngay_dong_goi between k.tu and k.den)             as gt,
           sum(g.so_kg_goc) filter (where l.ngay_dong_goi between k.tu and k.den)             as kg,
           sum(g.gia_tri)   filter (where l.ngay_dong_goi between k.tu_truoc and k.den_truoc) as gt_truoc,
           sum(g.so_kg_goc) filter (where l.ngay_dong_goi between k.tu_truoc and k.den_truoc) as kg_truoc
    from kho_lo l
    join kho_lo_gia g on g.lo_id = l.id
    join kho_mat_hang m on m.id = l.mat_hang_id
    cross join ky k
    where l.chi_nhanh_id = p_chi_nhanh_id and l.nguon = 'pha_loc' and m.loai = 'phan_cat'
  ),
  so_cai as (
    select coalesce(g.loai, s.loai) as loai, s.so_kg, s.ngay,
           s.so_kg * coalesce(lg.gia_von_kg, 0) as gia_tri,
           m.dem_theo_cai as cai   -- 0105
    from kho_so_cai s
    join kho_mat_hang m on m.id = s.mat_hang_id
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_lo_gia lg on lg.lo_id = s.lo_id
    cross join ky k
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay between k.tu_truoc and k.den
  ),
  dung as (
    select
      -- Thịt đã dùng = bán + xuất bếp + xuất khác (0032) + hủy + thiếu khi kiểm kê (thừa trừ lại)
      -sum(x.gia_tri) filter (where x.loai in ('ban', 'xuat_bep', 'xuat_khac', 'huy', 'kiem_ke', 'hao_hut')
                               and x.ngay between k.tu and k.den)                          as chi_phi,
      -sum(x.gia_tri) filter (where x.loai in ('ban', 'xuat_bep', 'xuat_khac', 'huy', 'kiem_ke', 'hao_hut')
                               and x.ngay between k.tu_truoc and k.den_truoc)              as chi_phi_truoc,
      -sum(x.gia_tri) filter (where x.loai = 'huy' and x.ngay between k.tu and k.den)       as huy,
      -sum(x.gia_tri) filter (where x.loai in ('kiem_ke', 'hao_hut') and x.ngay between k.tu and k.den
                               and x.so_kg < 0)                                            as kiem_ke_thieu,
       sum(x.gia_tri) filter (where x.loai in ('kiem_ke', 'hao_hut') and x.ngay between k.tu and k.den
                               and x.so_kg > 0)                                            as kiem_ke_thua,
      -sum(x.gia_tri) filter (where x.loai = 'xuat_bep' and x.ngay between k.tu and k.den)  as xuat_bep,
      -sum(x.gia_tri) filter (where x.loai = 'ban' and x.ngay between k.tu and k.den)       as ban_gia_von,
      -sum(x.so_kg)   filter (where x.loai = 'ban' and x.ngay between k.tu and k.den and not x.cai) as ban_kg
    from so_cai x, ky k
  ),
  ban as (
    select sum(b.doanh_thu_uoc_tinh) as doanh_thu_uoc_tinh
    from kho_bao_cao_ban(p_chi_nhanh_id, p_tu, p_den) b
  )
  select jsonb_build_object(
    'tu', p_tu, 'den', p_den,
    'gia_tri_ton_kho',  (select gia_tri_kho from ton),
    'gia_tri_ton_quay', (select gia_tri_quay from ton),
    'mh_het_quay',      (select count(*) from quay where con_kg = 0),
    'mh_duoi_muc',      (select count(*) from quay where con_kg > 0 and con_kg < ton_toi_thieu_kg),
    'so_phien_pha',     (select coalesce(so_phien, 0) from pha),
    'thu_hoi_pt',       (select case when kg_vao > 0 then round(kg_thit * 100 / kg_vao, 2) end from pha),
    'thu_hoi_pt_truoc', (select case when kg_vao_truoc > 0 then round(kg_thit_truoc * 100 / kg_vao_truoc, 2) end from pha),
    'gia_von_kg',       (select case when kg > 0 then round(gt / kg) end from gia_von),
    'gia_von_kg_truoc', (select case when kg_truoc > 0 then round(gt_truoc / kg_truoc) end from gia_von),
    'chi_phi_thit',       (select coalesce(round(chi_phi), 0) from dung),
    'chi_phi_thit_truoc', (select coalesce(round(chi_phi_truoc), 0) from dung),
    'huy',                (select coalesce(round(huy), 0) from dung),
    'kiem_ke_thieu',      (select coalesce(round(kiem_ke_thieu), 0) from dung),
    'kiem_ke_thua',       (select coalesce(round(kiem_ke_thua), 0) from dung),
    'xuat_bep',           (select coalesce(round(xuat_bep), 0) from dung),
    'ban_gia_von',        (select coalesce(round(ban_gia_von), 0) from dung),
    'ban_kg',             (select coalesce(ban_kg, 0) from dung),
    'doanh_thu_uoc_tinh', (select coalesce(doanh_thu_uoc_tinh, 0) from ban)
  )
$$;

create or replace view kho_v_phieu_nhap with (security_invoker = true) as
select p.id, p.chi_nhanh_id, p.so_phieu, p.loai, p.trang_thai, p.phien_ban,
       p.nha_cung_cap_id, ncc.ten as ten_nha_cung_cap,
       p.vi_tri_id, v.ten as ten_vi_tri,
       p.ngay_nhap, p.so_hoa_don, p.ngay_hoa_don, p.han_thanh_toan,
       p.tien_thue, p.chi_phi_khac, p.ghi_chu, p.ly_do,
       p.nguoi_tao, p.nguoi_gui, p.gui_luc, p.nguoi_duyet, p.duyet_luc,
       p.nguoi_huy, p.huy_luc, p.created_at, p.updated_at,
       coalesce(d.so_dong, 0)   as so_dong,
       coalesce(d.tong_kg, 0)   as tong_kg,
       coalesce(d.tong_goi, 0)  as tong_goi,
       coalesce(d.tien_hang, 0) as tien_hang,
       coalesce(d.tien_hang, 0) + p.tien_thue + p.chi_phi_khac as tong_tien,
       p.don_dat_id
from kho_phieu_nhap p
left join kho_nha_cung_cap ncc on ncc.id = p.nha_cung_cap_id
left join kho_vi_tri v on v.id = p.vi_tri_id
left join lateral (
  select count(*) as so_dong, sum(dd.so_kg) filter (where not m.dem_theo_cai) as tong_kg,
         sum(dd.so_goi) as tong_goi, sum(dd.thanh_tien) as tien_hang
  from kho_phieu_nhap_dong dd join kho_mat_hang m on m.id = dd.mat_hang_id
  where dd.phieu_nhap_id = p.id
) d on true
where p.loai <> 'no_dau';

create or replace view kho_v_phieu_xuat with (security_invoker = true) as
select p.id, p.chi_nhanh_id, p.so_phieu, p.loai, p.trang_thai, p.ngay,
       p.vi_tri_id, v.ten as ten_vi_tri, v.loai as loai_vi_tri,
       p.vi_tri_den_id, vd.ten as ten_vi_tri_den,
       p.ly_do_id, ld.ten as ten_ly_do, p.ghi_chu, p.anh, p.ly_do_tu_choi,
       p.nguoi_tao, p.nguoi_duyet, p.duyet_luc, p.created_at,
       coalesce(d.so_dong, 0)::int as so_dong,
       coalesce(d.tong_goi, 0)::int as tong_goi,
       coalesce(d.tong_kg, 0) as tong_kg,
       -- 0032
       p.yeu_cau_id, yc.so_phieu as so_yeu_cau,
       p.nguoi_nhan, p.nhan_luc,
       d.tong_goi_nhan::int as tong_goi_nhan, d.tong_kg_nhan,
       p.xu_ly_thieu, p.ly_do_xu_ly, p.nguoi_xu_ly, p.xu_ly_luc
from kho_phieu_xuat p
join kho_vi_tri v on v.id = p.vi_tri_id
left join kho_vi_tri vd on vd.id = p.vi_tri_den_id
left join kho_ly_do ld on ld.id = p.ly_do_id
left join kho_yeu_cau_quay yc on yc.id = p.yeu_cau_id
left join lateral (
  select count(*) as so_dong, sum(dd.so_goi) as tong_goi, sum(dd.so_kg) filter (where not m.dem_theo_cai) as tong_kg,
         sum(dd.so_goi_nhan) as tong_goi_nhan, sum(dd.so_kg_nhan) filter (where not m.dem_theo_cai) as tong_kg_nhan
  from kho_phieu_xuat_dong dd join kho_mat_hang m on m.id = dd.mat_hang_id
  where dd.phieu_xuat_id = p.id
) d on true;


-- =============================================================================
-- 9 · TIỀN TRẢ HÀNG TỰ TÍNH — dòng nhập theo giá thùng (thay THÂN 0040)
-- =============================================================================
create or replace function kho_tien_tra_hang_goi_y(p_phieu_xuat_id uuid)
returns bigint
language sql
stable
set search_path = public
as $$
  with gt as (
    -- 0105: dòng nhập theo giá thùng → kg (số cái) × giá thùng / số cái một thùng, như thành tiền của dòng.
    select coalesce(sum(round(case when nd.don_gia_thung is not null
                                   then d.so_kg * nd.don_gia_thung / nd.so_trong_thung
                                   else d.so_kg * coalesce(nd.don_gia_kg, 0) end)::bigint), 0) as gia_tri
    from kho_phieu_xuat_dong d
    join kho_lo l on l.id = d.lo_id
    left join kho_phieu_nhap_dong nd on nd.id = l.phieu_nhap_dong_id
    where d.phieu_xuat_id = p_phieu_xuat_id
  ),
  pn as (
    select p.tien_thue,
           (select coalesce(sum(dd.thanh_tien), 0) from kho_phieu_nhap_dong dd where dd.phieu_nhap_id = p.id) as tien_hang
    from kho_phieu_xuat x join kho_phieu_nhap p on p.id = x.phieu_nhap_id
    where x.id = p_phieu_xuat_id
  )
  select gt.gia_tri + case when pn.tien_thue > 0 and pn.tien_hang > 0
                           then round(pn.tien_thue::numeric * gt.gia_tri / pn.tien_hang)::bigint else 0 end
  from gt, pn
$$;


-- =============================================================================
-- 10 · QUYỀN (0008 mục 6)
-- =============================================================================
-- Hai hàm trigger mới: nội bộ (test-kho-quyen.mjs NOI_BO) — trigger chạy không cần quyền execute. Các hàm thay
-- THÂN: create or replace giữ quyền cũ; thu lại cho chắc như file gốc của chúng.
do $$
begin
  execute 'revoke execute on function kho_mat_hang_doi_kieu_dem_kiem() from public';
  execute 'revoke execute on function kho_so_cai_dem_cai_kiem() from public';
  execute 'revoke execute on function kho_ghi_dong_phieu_nhap(uuid, uuid, date, jsonb) from public';
  execute 'revoke execute on function kho_tien_tra_hang_goi_y(uuid) from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function kho_mat_hang_doi_kieu_dem_kiem() from anon';
    execute 'revoke execute on function kho_so_cai_dem_cai_kiem() from anon';
    execute 'revoke execute on function kho_ghi_dong_phieu_nhap(uuid, uuid, date, jsonb) from anon';
    execute 'revoke execute on function kho_tien_tra_hang_goi_y(uuid) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_mat_hang_doi_kieu_dem_kiem() from authenticated';
    execute 'revoke execute on function kho_so_cai_dem_cai_kiem() from authenticated';
    execute 'revoke execute on function kho_ghi_dong_phieu_nhap(uuid, uuid, date, jsonb) from authenticated';
    execute 'revoke execute on function kho_tien_tra_hang_goi_y(uuid) from authenticated';
  end if;
end
$$;
