-- =============================================================================
-- BEEFTOWN KHO — 0043 · LÝ DO XUẤT BẾP KHÔNG TÍNH ĐỊNH MỨC ("Cơm nhân viên")
-- =============================================================================
-- Chủ đã chốt (26/09): phiếu Xuất bếp lý do "Cơm nhân viên" KHÔNG tính vào
-- định mức bếp. Trước đây kho_dinh_muc_tinh (0038) cộng MỌI dòng sổ xuat_bep
-- làm "bếp nhận", nên thịt nấu cơm nhân viên làm báo cáo định mức và cảnh báo
-- dinh_muc_lech luôn lệch dương.
--
-- Làm tổng quát, không cứng theo tên:
--   kho_ly_do.tinh_dinh_muc  boolean not null default true. Chỉ có nghĩa với
--                            lý do loai 'xuat_bep'. false = phiếu Xuất bếp có
--                            lý do này không cộng vào "bếp nhận".
--   kho_ly_do dùng chung toàn thương hiệu (không có chi_nhanh_id, 0019) — cập
--   nhật mọi dòng khớp: loai 'xuat_bep', tên chuẩn hóa (NFC, bỏ khoảng trắng
--   đầu cuối, gộp khoảng trắng, chữ thường) = 'cơm nhân viên'.
--   Trigger BEFORE INSERT kho_ly_do_dinh_muc_mac_dinh: thêm lý do Xuất bếp tên
--   đó (kho_khoi_tao của database mới, hoặc quản lý tự thêm) → false. Chỉ lúc
--   thêm: quản lý bật lại được bằng UPDATE (ô "Tính vào định mức bếp").
--   Cột không có tiền; quyền sửa theo policy kho_ly_do_sua (danh_muc) như cũ.
--
-- THAY THÂN kho_dinh_muc_tinh (cùng chữ ký, chép 0038 — 0039–0042 không thay):
--   CTE bep bỏ dòng sổ mà dòng gốc (coalesce(g, s): dòng dao_nguoc xét theo
--   dòng nó đảo) có chung_tu_loai 'phieu_xuat' và phiếu đó có ly_do_id →
--   kho_ly_do.tinh_dinh_muc = false. Phần "chuyển bếp" khi chốt pha lóc
--   (chung_tu phien_pha) giữ nguyên. Cảnh báo 7 ngày (kho_su_kien) dùng chung
--   hàm này nên tự đúng. Hàm vẫn nội bộ (rút khỏi authenticated như 0038).
--   Không đổi hàm công khai nào.
-- =============================================================================


-- =============================================================================
-- 1 · CỘT tinh_dinh_muc
-- =============================================================================
alter table kho_ly_do add column tinh_dinh_muc boolean not null default true;

comment on column kho_ly_do.tinh_dinh_muc is
  'Chỉ với lý do Xuất bếp: false = phiếu Xuất bếp có lý do này KHÔNG cộng vào "bếp nhận" khi đối chiếu định mức (mặc định false cho "Cơm nhân viên"). 0043.';

update kho_ly_do
set tinh_dinh_muc = false
where loai = 'xuat_bep'
  and lower(regexp_replace(btrim(normalize(ten, NFC)), '\s+', ' ', 'g')) = 'cơm nhân viên';


-- =============================================================================
-- 2 · THÊM LÝ DO "Cơm nhân viên" → MẶC ĐỊNH KHÔNG TÍNH ĐỊNH MỨC
-- =============================================================================
create or replace function kho_ly_do_dinh_muc_mac_dinh()
returns trigger
language plpgsql
as $$
begin
  if new.loai = 'xuat_bep'
     and lower(regexp_replace(btrim(normalize(new.ten, NFC)), '\s+', ' ', 'g')) = 'cơm nhân viên' then
    new.tinh_dinh_muc := false;
  end if;
  return new;
end;
$$;

create trigger kho_ly_do_dinh_muc_mac_dinh_trigger
  before insert on kho_ly_do
  for each row execute function kho_ly_do_dinh_muc_mac_dinh();


-- =============================================================================
-- 3 · KG BẾP NHẬN — bỏ phiếu Xuất bếp có lý do không tính định mức
-- =============================================================================
-- Theo mặt hàng: kg bếp nhận (xuất bếp + chuyển bếp khi pha, trừ đảo ngược;
-- 0043: trừ phiếu Xuất bếp có lý do tinh_dinh_muc = false), kg lẽ ra dùng
-- (suất × gram), số suất của các món dùng mặt hàng đó, giá vốn trung bình của
-- phần bếp nhận (đ/kg). Kỳ bếp không nhận mặt hàng đó thì lấy giá vốn trung
-- bình mọi lô của mặt hàng ở chi nhánh; chưa lô nào có giá → null.
-- Có mặt: mặt hàng bếp nhận trong kỳ, hoặc có trong định lượng của chi nhánh.
create or replace function kho_dinh_muc_tinh(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (mat_hang_id uuid, kg_xuat_bep numeric, kg_ly_thuyet numeric, so_suat numeric, gia_von_tb_kg numeric)
language sql
stable
security definer
set search_path = public
as $$
  with bep as (
    select s.mat_hang_id,
           -sum(s.so_kg) as kg,
           -sum(s.so_kg * lg.gia_von_kg) filter (where lg.lo_id is not null) as gt,
           -sum(s.so_kg) filter (where lg.lo_id is not null) as kg_co_gia
    from kho_so_cai s
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_lo_gia lg on lg.lo_id = s.lo_id
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay between p_tu and p_den
      and coalesce(g.loai, s.loai) = 'xuat_bep'
      -- 0043: phiếu Xuất bếp có lý do không tính định mức (Cơm nhân viên…)
      and not exists (
        select 1
        from kho_phieu_xuat px
        join kho_ly_do ld on ld.id = px.ly_do_id
        where coalesce(g.chung_tu_loai, s.chung_tu_loai) = 'phieu_xuat'
          and px.id = coalesce(g.chung_tu_id, s.chung_tu_id)
          and not ld.tinh_dinh_muc
      )
    group by s.mat_hang_id
  ),
  lt as (
    select dl.mat_hang_id,
           coalesce(sum(b.so_suat * dl.gram), 0) / 1000 as kg,
           coalesce(sum(b.so_suat), 0) as so_suat
    from kho_dinh_luong dl
    left join kho_dinh_muc_ban(p_chi_nhanh_id, p_tu, p_den) b on b.mon_id = dl.mon_id
    where dl.chi_nhanh_id = p_chi_nhanh_id
    group by dl.mat_hang_id
  ),
  gia_lo as (
    select lo.mat_hang_id, sum(lg.gia_tri)::numeric / nullif(sum(lg.so_kg_goc), 0) as gia
    from kho_lo lo
    join kho_lo_gia lg on lg.lo_id = lo.id
    where lo.chi_nhanh_id = p_chi_nhanh_id and lo.mat_hang_id in (select mat_hang_id from lt)
    group by lo.mat_hang_id
  )
  select coalesce(b.mat_hang_id, l.mat_hang_id),
         round(coalesce(b.kg, 0), 3),
         round(coalesce(l.kg, 0), 3),
         coalesce(l.so_suat, 0),
         round(coalesce(case when b.kg_co_gia > 0 then b.gt / b.kg_co_gia end, gl.gia), 4)
  from bep b
  full join lt l on l.mat_hang_id = b.mat_hang_id
  left join gia_lo gl on gl.mat_hang_id = coalesce(b.mat_hang_id, l.mat_hang_id)
  where coalesce(b.kg, 0) <> 0 or l.mat_hang_id is not null
$$;

comment on function kho_dinh_muc_tinh is
  'NỘI BỘ (0038, 0043). Theo mặt hàng trong kỳ: kg_xuat_bep (sổ loai xuat_bep: phiếu Xuất bếp + chuyển bếp khi chốt pha lóc, trừ đảo ngược; BỎ phiếu Xuất bếp có lý do tinh_dinh_muc = false, mặc định "Cơm nhân viên"), kg_ly_thuyet (suất bán iPOS × gram / 1000), so_suat, gia_von_tb_kg (của phần bếp nhận; bếp không nhận thì TB mọi lô của mặt hàng — CÓ TIỀN, chỉ hàm gọi kiểm xem_gia mới được trả ra).';


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020, 0038)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_dinh_muc_tinh(uuid, date, date) from authenticated';
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
