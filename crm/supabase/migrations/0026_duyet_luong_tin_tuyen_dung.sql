-- =============================================================================
-- BEEFTOWN CRM — 0026 · CHỈ CHỦ NHÀ HÀNG VÀ QUẢN LÝ DUYỆT ĐƯỢC LƯƠNG
-- =============================================================================
-- VẤN ĐỀ
--
-- 0012 tách lương làm hai: mức đề xuất (luong_de_xuat_*) và mức chính thức
-- (luong_tu, luong_den, luong_da_duyet) — "cùng khuôn duyệt với giá món".
-- Nhưng không có gì kiểm AI được đặt mức chính thức: policy vi_tri_sua cho
-- cả marketing sửa cả dòng. Tức marketing tự duyệt được con số sẽ hiện trên
-- trang — một cam kết với người lao động, lấy từ bảng lương mật.
--
-- Khi tin chỉ sửa được bằng SQL thì lỗ này nằm im. Màn soạn tin ở
-- /noi-bo/tin-tuyen-dung có nút "Duyệt mức đề xuất", và giấu nút không phải
-- phân quyền (xem 0016 mục 2).
--
-- QUYẾT ĐỊNH — chủ nhà hàng chốt ngày 2026-09-25
--
--   · Duyệt hoặc bỏ duyệt mức lương chính thức: chủ nhà hàng và quản lý.
--   · Đăng và gỡ tin: cả ba vai soạn tin, kể cả marketing — đúng như policy
--     vi_tri_sua đang cho. Không thêm luật cho việc đó.
--
-- CÁCH LÀM
--
-- Một trigger BEFORE trên vi_tri_tuyen_dung, chỉ chặn khi BA CỘT CHÍNH THỨC
-- đổi giá trị. Marketing vẫn sửa được mọi thứ khác của một tin đã duyệt
-- lương, kể cả mức đề xuất. Không có phiên đăng nhập (migration, seed,
-- service_role) thì không chặn — cùng khuôn với 0010.
--
-- Trigger cũng ghi ai duyệt lương và lúc nào (hai cột mới, như
-- gia_nguoi_duyet, gia_duyet_luc của món ăn), và ai đăng tin, lúc nào —
-- nguoi_duyet và cong_bo_luc có từ 0012 nhưng chưa từng được ghi.
-- =============================================================================

alter table vi_tri_tuyen_dung
  add column luong_nguoi_duyet uuid references nhan_su(id) on delete set null,
  add column luong_duyet_luc   timestamptz;

comment on column vi_tri_tuyen_dung.luong_nguoi_duyet is
  'Ai duyệt mức lương đang hiện trên trang. Trigger vi_tri_kiem_tra() tự ghi — đừng ghi tay.';
comment on column vi_tri_tuyen_dung.nguoi_duyet is
  'Ai đăng tin lên trang lần gần nhất. Trigger vi_tri_kiem_tra() tự ghi từ 0026.';


create or replace function vi_tri_kiem_tra()
returns trigger
language plpgsql
as $$
declare
  v_doi_luong boolean;
begin
  v_doi_luong := case
    when tg_op = 'INSERT' then new.luong_da_duyet
    else (new.luong_tu, new.luong_den, new.luong_da_duyet)
         is distinct from (old.luong_tu, old.luong_den, old.luong_da_duyet)
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

create trigger vi_tri_kiem_tra_trigger
  before insert or update on vi_tri_tuyen_dung
  for each row execute function vi_tri_kiem_tra();


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6. Giữ dòng ve_con_hieu_luc: xem 0023.
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
    -- dưới vai anon. Xem 0023.
    execute 'grant execute on function ve_con_hieu_luc(text) to anon';

    -- Đo lường
    execute 'grant execute on function ghi_su_kien_web(text,text,uuid,text,text,text,text,text,text,text) to anon';
  end if;
end
$$;
