-- =============================================================================
-- XOÁ SẠCH DỮ LIỆU KHO — CHỈ CHẠY TRÊN PROJECT THỬ (Beeftown-thu)
-- =============================================================================
-- Xoá mọi mặt hàng, nhà cung cấp, phiếu, lô, sổ kho, tồn, bán iPOS, công nợ,
-- số thứ tự phiếu và cấu hình iPOS của kho. Giữ lại phần cài đặt gốc: vị trí,
-- lý do, cài đặt kho, máy cân, người xem, trường thêm.
--
-- Chạy: Supabase → SQL Editor → dán cả file → Run. Hoặc nhờ Claude "xoá dữ liệu thử".
--
-- Chốt an toàn: có chi nhánh nào tên không chứa "BẢN THỬ" → dừng, không xoá gì.
-- Không phải migration — đừng chép vào crm/supabase/migrations.
-- =============================================================================

do $$
declare
  -- Bảng cài đặt gốc: giữ nguyên.
  v_giu text[] := array['kho_cai_dat', 'kho_vi_tri', 'kho_ly_do', 'kho_may', 'kho_may_nguoi', 'kho_may_nhat_ky',
                        'kho_nguoi_xem', 'kho_truong_them', 'kho_thiet_lap_bo_qua'];
  v_ds  text;
  v_n   int;
begin
  if not exists (select 1 from chi_nhanh) or exists (select 1 from chi_nhanh where ten not like '%BẢN THỬ%') then
    raise exception 'DỪNG: database này có chi nhánh không phải "BẢN THỬ" — script chỉ chạy trên project thử';
  end if;

  select string_agg(format('%I', tablename), ', ' order by tablename), count(*) into v_ds, v_n
  from pg_tables
  where schemaname = 'public' and tablename like 'kho\_%' and tablename <> all (v_giu);

  -- Không CASCADE: nếu bảng giữ lại nào trỏ vào bảng bị xoá, lệnh báo lỗi thay vì xoá lan.
  execute 'truncate ' || v_ds || ' restart identity';

  -- Cấu hình iPOS đã xoá → quầy quay về "thiếu khi đếm = đã bán".
  update kho_cai_dat set nguon_so_ban = 'kiem_ke';

  raise notice 'Đã xoá % bảng kho. Còn: % mặt hàng, % lô, % dòng sổ kho.', v_n,
    (select count(*) from kho_mat_hang), (select count(*) from kho_lo), (select count(*) from kho_so_cai);
end
$$;

select (select count(*) from kho_mat_hang) as mat_hang,
       (select count(*) from kho_nha_cung_cap) as nha_cung_cap,
       (select count(*) from kho_lo) as lo,
       (select count(*) from kho_so_cai) as so_cai,
       (select count(*) from kho_vi_tri) as vi_tri_giu_lai,
       (select count(*) from kho_ly_do) as ly_do_giu_lai;
