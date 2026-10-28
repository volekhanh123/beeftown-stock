-- =============================================================================
-- BEEFTOWN KHO — 0108 · HỦY HÓA ĐƠN TRÊN FABi TRẢ KHO NGAY (BẢN "X_DEL")
-- =============================================================================
-- PHẢI CHẠY SAU 0042 (bản cuối của kho_ipos_nhan_hd).
--
-- Thử thật 28/10/2026 (Khánh): bán hóa đơn X trên FABi (2 khay Ribeye 1,2 + 0,69 kg), rồi hủy X. Webhook iPOS DW
-- KHÔNG gửi lại X với datastate 2 — nó gửi một hóa đơn MỚI sale_id "X_DEL": datastate 2, origin_sale_id = X, cùng
-- sale_detail_id với X, quantity / amount ÂM. Kho cất "X_DEL" như một hóa đơn hủy rỗng; X vẫn trừ kho tới lượt kéo
-- bù kế tiếp (cron 5 phút) mới đưa X datastate 2 về và trả kho (production: X_DEL 15:00:56, trả kho 15:05:21 giờ
-- VN). Nhìn kho trong khoảng đó: "hủy hóa đơn rồi nhưng món không được trả lại kho".
--
-- Từ 0108: web đọc bản datastate 2 có sale_id ĐÚNG origin_sale_id + "_DEL" thành ma_hd_goc = X (ipos.ts — chỉ
-- đúng mẫu đó: hóa đơn sửa, tách, gộp chỉ trỏ origin_sale_id mà hóa đơn gốc có thể vẫn là hàng đã bán).
-- kho_ipos_nhan_hd:
--   · cất ma_hd_goc vào cột mới kho_ipos_hoa_don.ma_hd_goc của "X_DEL" (vẫn là một hóa đơn hủy riêng, đối chiếu);
--   · hủy X trong cùng chi nhánh NGAY, như hủy thường: đảo mọi dòng da_ghi (kho_ipos_dao_dong — trả đúng khay,
--     đúng kg), dòng còn lại thành da_huy "Hóa đơn đã hủy trên iPOS";
--   · X đã có "X_DEL" trong chi nhánh thì mọi bản X đến sau là hủy (FABi không mở lại hóa đơn đã hủy): bản X gửi
--     lại khi lần đầu lỗi mà đến SAU "X_DEL", bản kéo còn datastate 0 — không trừ kho, không phải đợi lượt kéo.
-- Gửi lại "X_DEL", lượt kéo đưa X datastate 2 về: X đã hủy, không còn dòng da_ghi → không trả kho lần hai.
-- Một cột, một chỉ mục mới; không hàm mới; chữ ký kho_ipos_nhan_hd không đổi. create or replace giữ quyền cũ;
-- khối cuối thu lại.
--
-- Triển khai: migration và web độc lập — web cũ không gửi ma_hd_goc (hàm bỏ qua, như trước 0108); web mới gửi
-- ma_hd_goc mà database chưa có 0108 thì khóa lạ bị bỏ qua. Không có câu xoá: chạy bằng SQL Editor hoặc psql. Chỉ
-- chạy lên production sau khi PR được gộp, rồi `npm run doi-chieu` phải báo KHỚP (0108 là file cuối định nghĩa
-- kho_ipos_nhan_hd).
-- =============================================================================


-- =============================================================================
-- 1 · CỘT ma_hd_goc — bản hủy "X_DEL" hủy hóa đơn nào
-- =============================================================================
alter table kho_ipos_hoa_don add column if not exists ma_hd_goc text
  constraint kho_ipos_hoa_don_ma_hd_goc_dai check (ma_hd_goc is null or length(ma_hd_goc) <= 100);
create index if not exists kho_ipos_hoa_don_goc_idx on kho_ipos_hoa_don(chi_nhanh_id, ma_hd_goc)
  where ma_hd_goc is not null;
comment on column kho_ipos_hoa_don.ma_hd_goc is
  'Bản hủy "X_DEL" của FABi (0108): X — hóa đơn bị hủy (cùng chi nhánh). Có dòng mang ma_hd_goc = X thì X luôn là hủy. Null với mọi hóa đơn khác.';



-- =============================================================================
-- 2 · NHẬN HÓA ĐƠN — chép nguyên thân 0042, thêm hủy hóa đơn gốc (ma_hd_goc)
-- =============================================================================
-- Lõi: hộp thư + ghi sổ. NỘI BỘ — người gọi đã kiểm quyền và khóa kho_cai_dat
-- rồi kho_ipos_cau_hinh. p_hoa_don: mảng ≤ 200 HĐ, mỗi HĐ
--   {ma_hd, thoi_diem_ban, da_huy?, ma_hd_goc?, raw?, dong: [
--     {khoa_dong?, ma_ipos?, ten_ipos?, ma_vach?, ma_can?, so_kg?, so_goi?, so_luong?, thanh_tien?}]}
--   ma_hd_goc (0108, chỉ xét khi da_huy): hóa đơn bị hủy bằng bản "X_DEL" — hủy luôn hóa đơn đó.
create or replace function kho_ipos_nhan_hd(p_chi_nhanh_id uuid, p_lan_id uuid, p_hoa_don jsonb, p_ghi_so boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_x      jsonb;
  v_e      jsonb;
  v_i      int;
  v_ma     text;
  v_luc    timestamptz;
  v_huy    boolean;
  v_dong   jsonb;
  v_bam    text;
  v_h      kho_ipos_hoa_don;
  v_goc    text;
  v_g      kho_ipos_hoa_don;
  v_dg     record;
  v_khoa   text;
  v_mc     text;
  v_goi    numeric;
  v_kg     numeric;
  v_sl     numeric;
  v_tt     numeric;
  v_raw    jsonb;
  v_moi    int := 0;
  v_trung  int := 0;
  v_sua    int := 0;
  v_hd_huy int := 0;
  v_hd_loi int := 0;
  v_so_dong int := 0;
  v_canh   jsonb := '[]';
  v_id     uuid;
  v_st     text;
  v_ipos   boolean;
  v_dem    jsonb := jsonb_build_object('da_ghi', 0, 'thieu_hang', 0, 'chua_khop', 0, 'bo_qua', 0,
                                       'loi', 0, 'cho', 0, 'da_huy', 0);
begin
  if p_hoa_don is null or jsonb_typeof(p_hoa_don) <> 'array' then
    raise exception 'Danh sách hóa đơn không hợp lệ' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_hoa_don) > 200 then
    raise exception 'Tối đa 200 hóa đơn một lần gửi' using errcode = 'check_violation';
  end if;

  -- ---- 1 · Hộp thư ----------------------------------------------------------
  for v_x in select value from jsonb_array_elements(p_hoa_don) loop
    v_ma := null;
    begin
      if jsonb_typeof(v_x) <> 'object' then
        raise exception 'HĐ không phải object';
      end if;
      v_ma := left(nullif(btrim(v_x ->> 'ma_hd'), ''), 100);
      if v_ma is null then
        raise exception 'thiếu ma_hd';
      end if;
      if coalesce(v_x ->> 'thoi_diem_ban', '') !~ '^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}' then
        raise exception 'thoi_diem_ban không đọc được';
      end if;
      v_luc := (v_x ->> 'thoi_diem_ban')::timestamptz;
      if (v_x ->> 'thoi_diem_ban') !~ '(Z|[+-]\d{2}(:?\d{2})?)$' then
        -- Không ghi múi giờ: iPOS ở Việt Nam → +07:00.
        v_luc := ((v_x ->> 'thoi_diem_ban')::timestamp - interval '7 hours') at time zone 'utc';
      end if;
      v_huy := coalesce((v_x ->> 'da_huy')::boolean, false);
      v_goc := case when v_huy then left(nullif(btrim(v_x ->> 'ma_hd_goc'), ''), 100) end;
      if v_goc = v_ma then
        v_goc := null;
      end if;
      -- 0108 · FABi không mở lại hóa đơn đã hủy: X đã có bản hủy "X_DEL" trong chi nhánh → mọi bản X đến sau là
      -- hủy (bản gửi lại khi lần đầu lỗi mà đến SAU "X_DEL", bản kéo còn datastate 0) — không trừ kho.
      if not v_huy and exists (select 1 from kho_ipos_hoa_don g
                               where g.chi_nhanh_id = p_chi_nhanh_id and g.ma_hd_goc = v_ma) then
        v_huy := true;
      end if;
      if v_x ? 'dong' and jsonb_typeof(v_x -> 'dong') not in ('array', 'null') then
        raise exception 'dong không phải mảng';
      end if;
      if jsonb_array_length(coalesce(nullif(v_x -> 'dong', 'null'::jsonb), '[]')) > 500 then
        raise exception 'quá 500 dòng';
      end if;

      -- Chuẩn hóa dòng.
      v_dong := '[]';
      v_i := 0;
      for v_e in select value from jsonb_array_elements(coalesce(nullif(v_x -> 'dong', 'null'::jsonb), '[]')) loop
        v_i := v_i + 1;
        if jsonb_typeof(v_e) <> 'object' then
          raise exception 'dòng % không phải object', v_i;
        end if;
        v_khoa := left(coalesce(nullif(btrim(v_e ->> 'khoa_dong'), ''), v_i::text), 100);
        if exists (select 1 from jsonb_array_elements(v_dong) y where y ->> 'khoa_dong' = v_khoa) then
          raise exception 'trùng khoa_dong %', v_khoa;
        end if;
        v_mc := nullif(ltrim(btrim(coalesce(v_e ->> 'ma_can', '')), '0'), '');
        if v_mc is not null and v_mc !~ '^[1-9][0-9]{0,5}$' then
          v_mc := null;
        end if;
        v_kg  := round(nullif(v_e ->> 'so_kg', '')::numeric, 3);
        v_goi := nullif(v_e ->> 'so_goi', '')::numeric;
        v_sl  := round(nullif(v_e ->> 'so_luong', '')::numeric, 3);
        v_tt  := round(nullif(v_e ->> 'thanh_tien', '')::numeric);
        if (v_kg is not null and (v_kg < 0 or v_kg > 100000))
           or (v_goi is not null and (v_goi < 0 or v_goi > 100000 or v_goi <> trunc(v_goi)))
           or (v_sl is not null and (v_sl < 0 or v_sl > 100000)) then
          raise exception 'dòng %: số lượng không hợp lệ', v_i;
        end if;
        v_dong := v_dong || (jsonb_build_object(
          'khoa_dong', v_khoa,
          'ma_ipos',  left(nullif(btrim(v_e ->> 'ma_ipos'), ''), 100),
          'ten_ipos', left(nullif(btrim(v_e ->> 'ten_ipos'), ''), 200),
          'ma_vach',  left(nullif(btrim(v_e ->> 'ma_vach'), ''), 40),
          'ma_can',   v_mc,
          'so_kg',    v_kg,
          'so_goi',   v_goi::int,
          'thanh_tien', v_tt::bigint)
          -- so_luong chỉ có mặt khi iPOS gửi: băm HĐ cũ (0037) không đổi.
          || case when v_sl is not null then jsonb_build_object('so_luong', v_sl) else '{}'::jsonb end);
      end loop;

      v_bam := md5(jsonb_build_object(
        't', to_char(v_luc at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.US'), 'h', v_huy, 'd', v_dong)::text);
      v_raw := case when v_x ? 'raw' and pg_column_size(v_x -> 'raw') <= 32000 then kho_ipos_bo_pii(v_x -> 'raw') end;

      -- 0108 · Bản hủy "X_DEL" của FABi (datastate 2, origin_sale_id = X): hủy X NGAY — webhook không gửi lại X,
      -- trước 0108 X chỉ trả kho khi lượt kéo đưa X datastate 2 về. Trước khi xét băm của "X_DEL": iPOS gửi lại
      -- "X_DEL" (trùng băm) vẫn qua đây — X đã hủy thì không làm gì. Chỉ X trong CHI NHÁNH này. X đến sau (bản
      -- cũ, bản kéo) đều thành hủy ở bước trên; X datastate 2 khác băm → nhánh "found" dưới: không còn dòng da_ghi
      -- nào để đảo lần hai. X chưa tới: không làm gì — "X_DEL" cất ma_hd_goc, X tới sau thành hủy.
      if v_goc is not null then
        select * into v_g from kho_ipos_hoa_don where chi_nhanh_id = p_chi_nhanh_id and ma_hd = v_goc for update;
        if found and not v_g.da_huy then
          perform kho_ipos_dao_dong(d.id) from kho_ipos_dong d where d.hoa_don_id = v_g.id and d.trang_thai = 'da_ghi';
          update kho_ipos_hoa_don set da_huy = true, lan_chay_id = p_lan_id, so_lan_sua = so_lan_sua + 1
          where id = v_g.id;
          update kho_ipos_dong set trang_thai = 'da_huy', ly_do = 'Hóa đơn đã hủy trên iPOS'
          where hoa_don_id = v_g.id and trang_thai <> 'bo_qua';
          -- Không đếm hd_huy ở đây: "X_DEL" đếm là một hóa đơn hủy rồi — một lần hủy, một số đếm.
        end if;
      end if;

      select * into v_h from kho_ipos_hoa_don where chi_nhanh_id = p_chi_nhanh_id and ma_hd = v_ma for update;
      if found and v_h.bam = v_bam then
        v_trung := v_trung + 1;
        continue;
      end if;

      if found then
        -- HĐ sửa / hủy trên iPOS: đảo mọi dòng đã ghi rồi ghi lại theo nội dung mới.
        perform kho_ipos_dao_dong(d.id) from kho_ipos_dong d where d.hoa_don_id = v_h.id and d.trang_thai = 'da_ghi';
        update kho_ipos_hoa_don set bam = v_bam, thoi_diem_ban = v_luc, da_huy = v_huy, raw = v_raw,
                                    ma_hd_goc = v_goc, lan_chay_id = p_lan_id, so_lan_sua = so_lan_sua + 1
        where id = v_h.id;
        if v_huy then
          v_hd_huy := v_hd_huy + 1;
        else
          v_sua := v_sua + 1;
        end if;
        update kho_ipos_dong set trang_thai = 'da_huy',
          ly_do = case when v_huy then 'Hóa đơn đã hủy trên iPOS' else 'Dòng đã bỏ khỏi hóa đơn trên iPOS' end
        where hoa_don_id = v_h.id and trang_thai <> 'bo_qua'
          and (v_huy or khoa_dong not in (select y ->> 'khoa_dong' from jsonb_array_elements(v_dong) y));
      else
        insert into kho_ipos_hoa_don (chi_nhanh_id, ma_hd, bam, thoi_diem_ban, da_huy, ma_hd_goc, raw, lan_chay_id)
        values (p_chi_nhanh_id, v_ma, v_bam, v_luc, v_huy, v_goc, v_raw, p_lan_id)
        returning * into v_h;
        v_moi := v_moi + 1;
        if v_huy then
          v_hd_huy := v_hd_huy + 1;
        end if;
      end if;

      if not v_huy then
        for v_dg in
          select * from jsonb_to_recordset(v_dong) as y(khoa_dong text, ma_ipos text, ten_ipos text, ma_vach text,
                                                       ma_can text, so_kg numeric, so_goi int, so_luong numeric,
                                                       thanh_tien bigint)
        loop
          insert into kho_ipos_dong (hoa_don_id, chi_nhanh_id, khoa_dong, thoi_diem_ban, ma_ipos, ten_ipos,
                                     ma_vach, ma_can, so_kg, so_goi, so_luong, thanh_tien)
          values (v_h.id, p_chi_nhanh_id, v_dg.khoa_dong, v_luc, v_dg.ma_ipos, v_dg.ten_ipos,
                  v_dg.ma_vach, v_dg.ma_can, v_dg.so_kg, v_dg.so_goi, v_dg.so_luong, v_dg.thanh_tien)
          on conflict (hoa_don_id, khoa_dong) do update set
            thoi_diem_ban = excluded.thoi_diem_ban, ma_ipos = excluded.ma_ipos, ten_ipos = excluded.ten_ipos,
            ma_vach = excluded.ma_vach, ma_can = excluded.ma_can, so_kg = excluded.so_kg,
            so_goi = excluded.so_goi, so_luong = excluded.so_luong, thanh_tien = excluded.thanh_tien,
            trang_thai = 'cho', ly_do = null, mat_hang_id = null, lo_het_han = false, ghi_luc = null,
            so_lan_thu = 0, xu_ly_boi = null, xu_ly_luc = null;
          v_so_dong := v_so_dong + 1;
        end loop;
      end if;
    exception when others then
      v_hd_loi := v_hd_loi + 1;
      -- Chỉ tên khóa / câu lỗi ngắn — không chép giá trị thô.
      v_canh := v_canh || jsonb_build_object('ma_hd', v_ma, 'loi', left(sqlerrm, 200));
    end;
  end loop;

  -- ---- 2 · Ghi sổ mọi dòng đang chờ (kể cả dòng cũ — tự thử lại) -------------
  -- Chưa chuyển sang trừ kho theo iPOS: dòng đã đánh dấu "chưa chuyển" không
  -- thử lại nữa (mỗi callback một lần — không quét lại cả nghìn dòng chờ).
  if p_ghi_so then
    v_ipos := exists (select 1 from kho_cai_dat cd join kho_ipos_cau_hinh c on c.chi_nhanh_id = cd.chi_nhanh_id
                      where cd.chi_nhanh_id = p_chi_nhanh_id and cd.nguon_so_ban = 'ipos' and c.ipos_tu_luc is not null);
    for v_id in
      select d.id from kho_ipos_dong d
      where d.chi_nhanh_id = p_chi_nhanh_id and d.trang_thai in ('cho', 'thieu_hang', 'chua_khop')
        and (v_ipos or d.ly_do is distinct from 'Chưa chuyển sang trừ kho theo iPOS')
      order by d.thoi_diem_ban, d.created_at, d.khoa_dong
    loop
      v_st := kho_ipos_ghi_dong(v_id);
      v_dem := jsonb_set(v_dem, array[v_st], to_jsonb(coalesce((v_dem ->> v_st)::int, 0) + 1));
    end loop;
  end if;

  -- ---- 3 · Nhật ký, mốc ----------------------------------------------------
  update kho_ipos_lan_chay set
    so_hd = so_hd + jsonb_array_length(p_hoa_don), so_dong = so_dong + v_so_dong,
    so_da_ghi = so_da_ghi + (v_dem ->> 'da_ghi')::int
  where id = p_lan_id;
  update kho_ipos_cau_hinh set
    hop_thu_luc = now(),
    nhan_hd_luc = case when jsonb_array_length(p_hoa_don) > 0 then now() else nhan_hd_luc end
  where chi_nhanh_id = p_chi_nhanh_id;

  return jsonb_build_object(
    'hd_moi', v_moi, 'hd_trung', v_trung, 'hd_sua', v_sua, 'hd_huy', v_hd_huy, 'hd_loi', v_hd_loi,
    'canh_bao', v_canh, 'so_dong', v_so_dong, 'dong', v_dem, 'da_ghi_so', p_ghi_so);
end;
$$;


comment on function kho_ipos_nhan_hd is
  'NỘI BỘ (0042; 0108). Lõi nhận hóa đơn iPOS (người gọi đã kiểm quyền, khóa kho_cai_dat rồi cấu hình): hộp thư (trùng băm = bỏ, băm khác = đảo ngược rồi ghi lại, hủy = đảo ngược; raw bỏ thông tin khách), bản hủy có ma_hd_goc ("X_DEL" của FABi) cất ma_hd_goc và hủy luôn hóa đơn gốc cùng chi nhánh, hóa đơn đã có bản "_DEL" đến sau luôn là hủy, p_ghi_so → ghi sổ mọi dòng cho / thieu_hang / chua_khop; cập nhật hop_thu_luc, nhan_hd_luc.';



-- =============================================================================
-- 3 · THU QUYỀN — đúng hàm của file này (0008 mục 6)
-- =============================================================================
-- create or replace giữ quyền cũ; thu lại cho chắc như 0042. Hàm nội bộ: thu cả authenticated
-- (test-kho-quyen.mjs NOI_BO). Danh sách anon không đổi.
do $$
begin
  execute 'revoke execute on function kho_ipos_nhan_hd(uuid, uuid, jsonb, boolean) from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function kho_ipos_nhan_hd(uuid, uuid, jsonb, boolean) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_ipos_nhan_hd(uuid, uuid, jsonb, boolean) from authenticated';
  end if;
end
$$;
