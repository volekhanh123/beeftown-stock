-- =============================================================================
-- DỌN DỮ LIỆU THỬ CỦA KHO TRƯỚC KHAI TRƯƠNG — CHẠY TRÊN PROJECT THẬT (Beeftown)
-- =============================================================================
-- Kho trên project thật đang chứa dữ liệu mô phỏng nạp để bấm thử (mặt hàng, nhà
-- cung cấp "Thử A–F", phiếu, lô, hóa đơn iPOS giả…). Trước khi nhập hàng thật
-- phải xoá hết. Phạm vi y như xoa-du-lieu-kho.sql: mọi bảng kho_*, GIỮ cài đặt
-- gốc — vị trí, lý do, cài đặt kho, máy dùng chung, máy Beeftown Cân, người xem,
-- trường thêm. Số phiếu và số tảng bắt đầu lại từ 0001. Không đụng khách hàng,
-- đặt bàn, nhân sự, chi nhánh. Ảnh trên Supabase Storage không bị xoá.
--
-- Khác xoa-du-lieu-kho.sql (chỉ chạy trên project thử): file này chạy được trên
-- project thật, nên có BA CHỐT do người chạy tự gõ.
--
-- CÁCH CHẠY — chủ nhà hàng, Supabase → project Beeftown → SQL Editor:
--   1. Dán cả file. Sửa ba dòng trong khung "SỬA BA DÒNG NÀY" ngay bên dưới:
--        c_ten_chi_nhanh  tên chi nhánh đang có, gõ đúng từng chữ (xem ở
--                         /noi-bo/cai-dat, mục Chi nhánh);
--        c_hom_nay        ngày hôm nay theo giờ Việt Nam, dạng 'YYYY-MM-DD';
--        c_che_do         'xem' = chỉ đếm, không xoá gì · 'xoa' = xoá thật.
--   2. Run với 'xem' → bảng kết quả liệt kê từng bảng kho và số dòng đang có.
--   3. Đổi thành 'xoa' → Run lần nữa → mọi dòng loại "dữ liệu" về 0.
--
-- TỪ CHỐI, KHÔNG XOÁ GÌ, khi:
--   · ba dòng chưa sửa, sửa sai tên chi nhánh, sai ngày hôm nay, chế độ lạ;
--   · database có hơn một chi nhánh (kho của nhiều chi nhánh — đã là thật);
--   · có chi nhánh tên chứa "BẢN THỬ" (project thử — dùng xoa-du-lieu-kho.sql);
--   · hôm nay đã tới hoặc qua ngày bán đầu tiên c_ngay_ban_dau (08/11/2026 —
--     lịch đổi thì sửa hằng số này trong file, cùng PR);
--   · kho đang trừ bán theo iPOS (nguồn số bán 'ipos'), hoặc cấu hình iPOS đang
--     bật — hóa đơn thật có thể đang vào.
-- Mọi việc nằm trong MỘT khối: lỗi giữa chừng thì không bảng nào bị xoá.
--
-- Không phải migration — đừng chép vào crm/supabase/migrations.
-- Kiểm thử: crm/test/test-kho-don-truoc-khai-truong.mjs.
-- =============================================================================

do $$
declare
  -- ============================ SỬA BA DÒNG NÀY ============================
  c_ten_chi_nhanh text := 'GÕ ĐÚNG TÊN CHI NHÁNH';
  c_hom_nay       text := 'YYYY-MM-DD';
  c_che_do        text := 'xem';
  -- =========================================================================

  -- Ngày bán đầu tiên (soft opening). Từ ngày này dữ liệu kho là thật.
  c_ngay_ban_dau  constant date := date '2026-11-08';

  -- Bảng cài đặt gốc: giữ nguyên — y như xoa-du-lieu-kho.sql (kiểm thử so hai danh sách).
  v_giu text[] := array['kho_cai_dat', 'kho_vi_tri', 'kho_ly_do', 'kho_may', 'kho_may_nguoi', 'kho_may_nhat_ky',
                        'kho_may_can', 'kho_nguoi_xem', 'kho_truong_them', 'kho_thiet_lap_bo_qua'];
  v_so_cn   int;
  v_ten     text;
  v_ngay    date;
  v_ds      text;
  v_n       int;
  v_bang    text;
  v_dem     bigint;
begin
  if c_ten_chi_nhanh = 'GÕ ĐÚNG TÊN CHI NHÁNH' or c_hom_nay = 'YYYY-MM-DD' then
    raise exception 'DỪNG: chưa sửa ba dòng ở khung "SỬA BA DÒNG NÀY" đầu file — không xoá gì';
  end if;
  if c_che_do is null or c_che_do not in ('xem', 'xoa') then
    raise exception 'DỪNG: c_che_do phải là ''xem'' (chỉ đếm) hoặc ''xoa'' (xoá thật) — không xoá gì';
  end if;

  select count(*) into v_so_cn from chi_nhanh;
  if v_so_cn <> 1 then
    raise exception 'DỪNG: database có % chi nhánh — file này chỉ dọn kho lúc nhà hàng mới có một chi nhánh, trước khai trương. Không xoá gì', v_so_cn;
  end if;
  select ten into v_ten from chi_nhanh;
  if v_ten like '%BẢN THỬ%' then
    raise exception 'DỪNG: đây là project thử (chi nhánh "BẢN THỬ") — dùng crm/supabase/thu/xoa-du-lieu-kho.sql. Không xoá gì';
  end if;
  if btrim(c_ten_chi_nhanh) is distinct from btrim(v_ten) then
    raise exception 'DỪNG: tên chi nhánh gõ vào không khớp chi nhánh của database này — mở /noi-bo/cai-dat, mục Chi nhánh, chép đúng tên. Không xoá gì';
  end if;

  begin
    v_ngay := c_hom_nay::date;
  exception when others then
    raise exception 'DỪNG: c_hom_nay phải là ngày dạng ''YYYY-MM-DD'' — không xoá gì';
  end;
  if v_ngay is distinct from hom_nay_vn() then
    raise exception 'DỪNG: ngày gõ vào (%) không phải hôm nay theo giờ Việt Nam — gõ lại ngày hôm nay. Không xoá gì', to_char(v_ngay, 'DD/MM/YYYY');
  end if;
  if hom_nay_vn() >= c_ngay_ban_dau then
    raise exception 'DỪNG: đã tới ngày bán đầu tiên (%) — dữ liệu kho bây giờ là thật, không dọn bằng file này. Không xoá gì', to_char(c_ngay_ban_dau, 'DD/MM/YYYY');
  end if;

  if exists (select 1 from kho_cai_dat where nguon_so_ban = 'ipos') then
    raise exception 'DỪNG: kho đang trừ bán theo iPOS — hóa đơn thật có thể đang vào. Chuyển về "đếm quầy" (hoặc hỏi người cài iPOS) trước. Không xoá gì';
  end if;
  if exists (select 1 from kho_ipos_cau_hinh where bat) then
    raise exception 'DỪNG: cấu hình iPOS đang bật — hóa đơn thật có thể đang vào. Tắt nối iPOS ở Cài đặt kho trước. Không xoá gì';
  end if;

  if c_che_do = 'xoa' then
    select string_agg(format('%I', tablename), ', ' order by tablename), count(*) into v_ds, v_n
    from pg_tables
    where schemaname = 'public' and tablename like 'kho\_%' and tablename <> all (v_giu);

    -- Không CASCADE: bảng giữ lại nào trỏ vào bảng bị xoá thì lệnh báo lỗi, không xoá lan.
    execute 'truncate ' || v_ds || ' restart identity';
    raise notice 'Đã xoá % bảng dữ liệu kho của chi nhánh "%".', v_n, v_ten;
  else
    raise notice 'Chế độ xem: không xoá gì. Bảng kết quả bên dưới là số dòng đang có.';
  end if;

  -- Số dòng từng bảng kho cho bảng kết quả cuối file (bảng tạm của phiên, không đụng dữ liệu).
  create temp table if not exists dem_kho (bang text primary key, loai text not null, so_dong bigint not null);
  truncate pg_temp.dem_kho;
  for v_bang in select tablename from pg_tables where schemaname = 'public' and tablename like 'kho\_%' loop
    execute format('select count(*) from public.%I', v_bang) into v_dem;
    insert into dem_kho values (v_bang, case when v_bang = any (v_giu) then 'giữ (cài đặt)' else 'dữ liệu' end, v_dem);
  end loop;
end
$$;

-- Từng bảng kho và số dòng đang có. Sau khi chạy 'xoa': mọi dòng "dữ liệu" phải là 0.
select bang, loai, so_dong from pg_temp.dem_kho order by loai, so_dong desc, bang;
