-- =============================================================================
-- BEEFTOWN CRM — 0028 · LƯƠNG TÍNH THEO GIỜ HAY THEO THÁNG
-- =============================================================================
-- VẤN ĐỀ
--
-- 0012 lưu lương là hai con số đồng, không nói trả theo gì. Ở nhà hàng, người
-- làm bán thời gian thường nhận lương giờ (25.000 đ), người làm toàn thời gian
-- nhận lương tháng (6.000.000 đ). Trang tuyển dụng chỉ hiện "25.000 đ" — người
-- đọc phải tự đoán, và đoán sai là tưởng mình được trả 25.000 đ một tháng.
--
-- CÁCH LÀM
--
-- Enum don_vi_luong ('gio', 'thang') và hai cột, theo đúng khuôn đề xuất /
-- chính thức sẵn có của lương:
--
--   · luong_de_xuat_don_vi — đi với mức đề xuất; ai soạn được tin cũng ghi được.
--   · luong_don_vi         — đi với mức đang hiện trên trang; nút duyệt chép nó
--                            từ mức đề xuất cùng lúc với hai con số.
--
-- ĐƠN VỊ LÀ MỘT PHẦN CỦA CON SỐ. Đổi "6.000.000 đ/tháng" thành "/giờ" là đổi
-- cam kết với người lao động, nên trigger vi_tri_kiem_tra() của 0027 chặn
-- luong_don_vi y như luong_tu và luong_den: marketing không đổi được.
--
-- Cả hai cột mặc định 'thang': trước file này, ví dụ trong màn soạn và mọi
-- kiểm thử đều là lương tháng. Riêng tin có sẵn mà con số dưới một triệu đồng
-- thì chuyển sang 'gio' — xem đoạn cập nhật ngay dưới. Màn soạn tự chọn sẵn
-- 'gio' cho tin bán thời gian chưa có mức đề xuất.
--
-- Tin chưa duyệt lương thì tin_tuyen_dung_cong_khai() trả đơn vị null, như hai
-- con số. Hàm đổi cột trả về nên phải drop rồi tạo lại — cùng lý do, cùng cách
-- với 0026, và khối chốt quyền cuối file cấp lại quyền cho anon.
-- =============================================================================

create type don_vi_luong as enum ('gio', 'thang');

alter table vi_tri_tuyen_dung
  add column luong_de_xuat_don_vi don_vi_luong not null default 'thang',
  add column luong_don_vi         don_vi_luong not null default 'thang';

comment on column vi_tri_tuyen_dung.luong_de_xuat_don_vi is
  'Mức đề xuất tính theo giờ hay theo tháng. Nút duyệt chép nó sang luong_don_vi cùng hai con số.';
comment on column vi_tri_tuyen_dung.luong_don_vi is
  'Mức đang hiện trên trang tính theo giờ hay theo tháng. Chỉ chủ nhà hàng và quản lý đổi được — trigger vi_tri_kiem_tra().';

-- Tin có sẵn: con số dưới một triệu đồng chỉ có thể là lương giờ — lương tối
-- thiểu vùng tính theo tháng đều trên ba triệu. Để nguyên 'thang' thì trang
-- sẽ hiện "28.000 đ/tháng" cho một mức đã duyệt.
--
-- PHẢI CHẠY TRƯỚC KHI THAY TRIGGER bên dưới. Trigger mới coi đổi luong_don_vi
-- là đổi lương đã duyệt, và lúc chạy migration không có phiên đăng nhập, nên
-- nó ghi người duyệt thành null, giờ duyệt thành bây giờ — xóa mất vết ai đã
-- duyệt. Trigger của 0027 chưa nhìn cột này.
update vi_tri_tuyen_dung set luong_de_xuat_don_vi = 'gio'
where greatest(luong_de_xuat_tu, luong_de_xuat_den) < 1000000;

update vi_tri_tuyen_dung set luong_don_vi = 'gio'
where greatest(luong_tu, luong_den) < 1000000;


-- =============================================================================
-- TRIGGER 0027 — thêm luong_don_vi vào nhóm cột chính thức; còn lại nguyên văn
-- =============================================================================
create or replace function vi_tri_kiem_tra()
returns trigger
language plpgsql
as $$
declare
  v_doi_luong boolean;
begin
  v_doi_luong := case
    when tg_op = 'INSERT' then new.luong_da_duyet
    else (new.luong_tu, new.luong_den, new.luong_don_vi, new.luong_da_duyet)
         is distinct from (old.luong_tu, old.luong_den, old.luong_don_vi, old.luong_da_duyet)
  end;

  if v_doi_luong then
    if co_phien_dang_nhap()
       and not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
      raise exception 'Chỉ chủ nhà hàng hoặc quản lý mới duyệt được mức lương'
        using errcode = 'insufficient_privilege';
    end if;

    if new.luong_da_duyet then
      new.luong_nguoi_duyet := (nhan_su_hien_tai()).id;
      new.luong_duyet_luc   := now();
    else
      new.luong_nguoi_duyet := null;
      new.luong_duyet_luc   := null;
    end if;
  end if;

  -- Đăng lại một tin đã gỡ cũng tính là một lần đăng: mốc và người đăng mới.
  if new.trang_thai = 'da_cong_bo'
     and (tg_op = 'INSERT' or old.trang_thai <> 'da_cong_bo') then
    new.cong_bo_luc := now();
    new.nguoi_duyet := (nhan_su_hien_tai()).id;
  end if;

  return new;
end;
$$;


-- =============================================================================
-- TIN CÔNG KHAI — trả thêm đơn vị lương; còn lại nguyên văn 0026
-- =============================================================================
drop function if exists tin_tuyen_dung_cong_khai(text);

create function tin_tuyen_dung_cong_khai(p_ngon_ngu text default 'vi')
returns table (
  ma            text,
  ten           text,
  bo_phan       bo_phan_tuyen,
  cap_bac       text,
  loai_hop_dong loai_hop_dong,
  so_luong      smallint,
  mo_ta         text,
  yeu_cau       text,
  quyen_loi     text,
  ca_lam        text,
  luong_tu      bigint,
  luong_den     bigint,
  luong_don_vi  don_vi_luong,
  han_nop       date,
  hoi_email       boolean,
  hoi_nam_sinh    boolean,
  hoi_ca_lam      boolean,
  hoi_gioi_thieu  boolean,
  hoi_kinh_nghiem boolean,
  hoi_cv          boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.ma,
    case when p_ngon_ngu = 'en' then coalesce(v.ten_en, v.ten_vi) else v.ten_vi end,
    v.bo_phan,
    v.cap_bac,
    v.loai_hop_dong,
    v.so_luong,
    case when p_ngon_ngu = 'en' then coalesce(v.mo_ta_en, v.mo_ta_vi) else v.mo_ta_vi end,
    case when p_ngon_ngu = 'en' then coalesce(v.yeu_cau_en, v.yeu_cau_vi) else v.yeu_cau_vi end,
    case when p_ngon_ngu = 'en' then coalesce(v.quyen_loi_en, v.quyen_loi_vi) else v.quyen_loi_vi end,
    v.ca_lam,
    -- Ràng buộc bảng đã đảm bảo hai cột này chỉ có giá trị khi đã duyệt.
    v.luong_tu,
    v.luong_den,
    -- Đơn vị thì không có ràng buộc đó (cột not null), nên tự che ở đây.
    case when v.luong_da_duyet then v.luong_don_vi end,
    v.han_nop,
    v.hoi_email,
    v.hoi_nam_sinh,
    v.hoi_ca_lam,
    v.hoi_gioi_thieu,
    v.hoi_kinh_nghiem,
    v.hoi_cv
  from vi_tri_tuyen_dung v
  where cong_tac_bat('hien_tuyen_dung')
    and v.trang_thai = 'da_cong_bo'
    and (v.han_nop is null or v.han_nop >= hom_nay_vn())
  order by v.bo_phan, v.ten_vi;
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
