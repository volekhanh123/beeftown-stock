-- =============================================================================
-- GHI MỘT LƯỢT SAO LƯU vào he_thong_sao_luu (0058) — bước cuối của .github/workflows/sao-luu.yml
-- =============================================================================
--
--     psql "$SAO_LUU_DB_URL" -X -v ON_ERROR_STOP=1 -v bat_dau_luc=… -v ok=… … -f crm/sao-luu/ghi-luot.sql
--
-- Mọi giá trị đi qua biến psql :'ten' — psql tự đặt trong nháy đơn và nhân đôi nháy bên trong,
-- nên câu lỗi hay số liệu lạ không thành được lệnh SQL. Ô để trống ('') → null.
-- Một lượt chạy (run_id-run_attempt) chỉ ghi một dòng: chạy lại bước này không nhân đôi.
-- Kiểm ở crm/test/test-suc-khoe.mjs (chạy đúng file này trên database dựng từ migration).
insert into public.he_thong_sao_luu
  (bat_dau_luc, ok, kich_thuoc, so_bang, so_dong, thu_khoi_phuc, loi, luot_chay)
values
  (:'bat_dau_luc'::timestamptz,
   :'ok'::boolean,
   nullif(:'kich_thuoc', '')::bigint,
   nullif(:'so_bang', '')::int,
   nullif(:'so_dong', '')::bigint,
   :'thu_khoi_phuc',
   nullif(left(:'loi', 300), ''),
   :'luot_chay')
on conflict (luot_chay) do nothing;
