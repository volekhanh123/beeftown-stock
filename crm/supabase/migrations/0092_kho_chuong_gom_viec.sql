-- =============================================================================
-- BEEFTOWN — 0092 · KHO: SỐ CHUÔNG ĐẾM DÒNG ĐÃ GOM, 7 NGÀY
-- =============================================================================
-- PHẢI CHẠY SAU 0040 (thân kho_dem_viec mới nhất).
--
-- Khánh duyệt 22/10/2026 (giảm chi tiết phần kho, phần 1 · Hằng ngày): trang chuông chỉ hiện 7 ngày gần
-- nhất và gom sự kiện cùng loại từ 3 cái trở lên thành một dòng ("30 món quầy sắp hết" thay 30 dòng).
-- Số đỏ trên chuông (chua_doc) phải đếm đúng thứ trang chuông in, không thì chuông vẫn "99+" trong khi
-- trang chỉ có vài dòng. Trước file này: mọi sự kiện chưa đọc trong 30 ngày, mỗi sự kiện một.
--
--   kho_dem_viec: thân 0040 NGUYÊN VĂN, chỉ đổi cách tính chua_doc — số dòng có sự kiện chưa đọc, trong
--   7 ngày, khóa có ≥ 3 sự kiện (trong 7 ngày) là một dòng, ncc_doi_tai_khoan luôn từng dòng. Các số khác
--   (quay_duoi_muc, quay_chua_dem, dinh_muc_lech) như cũ, vẫn đọc kho_su_kien MỘT lần. Cùng chữ ký, cùng
--   quyền, cùng kiểm vai đầu hàm.
--
-- Luật gom nằm hai nơi: đây và web/src/lib/kho/viec.ts (NGUONG_GOM, KHOA_KHONG_GOM, NGAY_CHUONG).
-- crm/test/test-kho-viec.mjs so số database đếm với số dòng web gom — đổi một bên thì đổi bên kia.
-- Không đổi dữ liệu, không bảng mới.
-- =============================================================================

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

  -- 0092: chua_doc = số DÒNG của trang chuông có tin chưa đọc — 7 ngày, khóa có ≥ 3 sự kiện gom một dòng
  -- (trừ ncc_doi_tai_khoan, luôn từng dòng). Đúng luật gomSuKien / NGUONG_GOM / KHOA_KHONG_GOM /
  -- NGAY_CHUONG của web/src/lib/kho/viec.ts.
  with e as materialized (select * from kho_su_kien(p_chi_nhanh_id)),
  g as (
    select e.khoa,
           count(*) as tong,
           count(*) filter (where v_xem_luc is null or e.luc > v_xem_luc) as chua
    from e
    where e.luc <= now() and e.luc >= now() - interval '7 days'
    group by e.khoa
  )
  select (select count(*) from e where e.khoa = 'quay_duoi_muc'),
         (select count(*) from e where e.khoa = 'quay_chua_dem'),
         (select coalesce(sum(case when g.tong >= 3 and g.khoa <> 'ncc_doi_tai_khoan'
                                   then (g.chua > 0)::int else g.chua end), 0)::int from g),
         (select count(*) from e where e.khoa = 'dinh_muc_lech')
    into v_duoi_muc, v_chua_dem, v_chua_doc, v_dinh_muc;

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
      'dinh_muc_lech', v_dinh_muc,
      -- 0039: đơn đặt hàng đã gửi, quá ngày giao mà chưa nhận chút nào
      'don_dat_tre', (select count(*) from kho_don_dat
                      where chi_nhanh_id = p_chi_nhanh_id and trang_thai = 'da_gui'
                        and ngay_giao_du_kien < v_hom_nay));
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
    -- 0040: trả hàng chờ kế toán xác nhận số tiền giảm trừ.
    v := v || jsonb_build_object('tra_hang_cho_tien', (
      select count(*) from kho_phieu_xuat x
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'tra_ncc' and x.trang_thai = 'cho_xac_nhan_tien'));
  end if;

  v := v || jsonb_build_object('chua_doc', v_chua_doc, 'thong_bao_xem_luc', v_xem_luc);

  return v;
end;
$$;


comment on function kho_dem_viec is
  'Mọi số đỏ trên menu kho của người đang đăng nhập ở một chi nhánh, trong MỘT lần gọi. Khóa nào không có quyền thì vắng mặt. Chỉ đếm, không tiền. duyet_nhap theo quyền duyet_nhap (0031); yeu_cau_quay, hang_dang_chuyen, hang_chuyen_qua_gio, chuyen_nhan_thieu (0032); thu_hoi_thap (0033); ipos_cho_xu_ly (0037); dinh_muc_lech (0038); don_dat_tre (0039); tra_hang_cho_tien (0040). chua_doc (0092): số dòng của trang chuông có tin chưa đọc — 7 ngày, khóa có ≥ 3 sự kiện gom một dòng, trừ ncc_doi_tai_khoan.';
