-- =============================================================================
-- BEEFTOWN KHO — 0103 · iPOS: KHO TỰ NHẬN MÓN CÂN THEO MÃ MÓN FABi = MÃ CÂN
-- =============================================================================
-- PHẢI CHẠY SAU 0054 (bản cuối của kho_ipos_ghi_dong) VÀ 0099 (bản cuối của ban_le_doi_chieu).
--
-- Khánh chạy thử FABi thật 27/10/2026: nhập món bằng "Thêm món từ file" của FABi, Mã món = Mã barcode
-- = mã cân đệm đủ 5 số (01011). Quét tem cân trên FABi ra đúng món, đúng kg; webhook iPOS DW gửi về
-- item_id "01011", quantity 0,23 (kg). Kho vẫn bắt Ghép món tay cho mã đó, dù mã món chính là mã cân 1011
-- của Steak Ribeye Úc. Khánh: "chọn mã món đó thì nó phải biết chính xác là món gì rồi, theo việc mình
-- cài đặt ban đầu".
--
-- Kho đã tự nhận theo cách này cho mã ô (0051) và mã giảm (0054). File này thêm bậc cuối cho mã cân của
-- chính món:
--   · kho_ipos_ghi_dong — dòng bán CHƯA GHÉP, không nhãn cân, mã món iPOS toàn chữ số: bỏ số 0 đầu, trùng
--     mã cân của một món ĐANG DÙNG → khớp món đó, quantity là số kg (như ô / mã giảm). Thứ tự giữ nguyên:
--     ghép tay > ô mã > mã giảm > nhãn cân > (mới) mã món = mã cân. Ghép tay "Không phải hàng kho", suất,
--     hàng cân nhãn vẫn thắng — lối thoát khi FABi có món KHÁC mang trùng số.
--   · ban_le_doi_chieu — dòng mã cân chưa ghép không còn việc "ghep" (chưa ghép đã đúng, như ô / mã giảm).
--     Ghép sai (món khác, theo gói, có ô, goi_can không mặt hàng) vẫn là sua_ghep.
--   · Hàm mới kho_ipos_ma_da_ban (security invoker, chỉ đọc): mã món iPOS dạng số đã từng có dòng bán ở chi
--     nhánh. Web dựng file "Thêm món từ file" cho FABi (/noi-bo/kho/ban-ipos/mon-fabi.xlsx): FABi chỉ THÊM món,
--     API iPOS DW không đọc được thực đơn — mã đã bán là chắc có trên FABi, không đưa lại vào file.
-- Không bảng, cột mới. create or replace giữ quyền cũ; khối cuối thu lại đúng các hàm của file cho chắc.
--
-- Dòng đang "Chưa khớp" mang mã như vậy: lượt thử lại kế tiếp (cron 5 phút / nút Thử lại) tự khớp. Dòng
-- "Chờ" (chưa chuyển sang trừ theo iPOS) xử lý khi chuyển, như mọi dòng khác.
--
-- Triển khai: chạy migration TRƯỚC, deploy web SAU — mục "Món cần có trên FABi" của web mới gọi
-- kho_ipos_ma_da_ban (thiếu hàm thì mục đó báo lỗi, trang vẫn chạy). File không có câu delete: chạy bằng SQL
-- Editor hoặc psql. Chỉ chạy lên production
-- sau khi PR được gộp, rồi `npm run doi-chieu` phải báo KHỚP (0103 là file cuối định nghĩa kho_ipos_ghi_dong
-- và ban_le_doi_chieu).
-- =============================================================================


-- =============================================================================
-- 1 · GHI MỘT DÒNG — thay THÂN kho_ipos_ghi_dong (cùng chữ ký)
-- =============================================================================
-- kho_ipos_ghi_dong — chép 0054; chỗ đổi ghi 0103: mã món iPOS chưa ghép = mã cân
-- của món đang dùng → khớp món đó, mặc định bán theo kg (v_tu_ma).
create or replace function kho_ipos_ghi_dong(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d     kho_ipos_dong;
  v_h     kho_ipos_hoa_don;
  v_c     kho_ipos_cau_hinh;
  v_cd    kho_cai_dat;
  v_mp    kho_ipos_ma_hang;
  v_mh    kho_mat_hang;
  v_doc   record;
  v_ma    text;
  v_kg    numeric;
  v_goi   int;
  v_pb    jsonb;
  v_px    record;
  v_e     jsonb;
  v_n     int;
  v_i     int := 0;
  v_so    numeric;
  v_con   numeric;
  v_phan  numeric;
  v_ngay  date;
  v_nv    uuid;
  v_tu_sl boolean := false;   -- 0042: số lượng suy từ so_luong (callback, không nhãn)
  v_dv    text;
  v_o     uuid;               -- 0051: ô mã của dòng bán
  v_om    kho_o_ma;
  v_lo_o  uuid;               -- 0051: lô đang gắn với ô lúc bán
  v_lech  boolean := false;   -- 0051: có ô mà không trừ được lô của ô
  v_mg    kho_ma_giam;        -- 0054: mã giảm giá của dòng bán
  v_tu_ma boolean := false;   -- 0103: mã món iPOS chưa ghép = mã cân của món
begin
  select * into v_d from kho_ipos_dong where id = p_id for update;
  if not found then
    return null;
  end if;
  if v_d.trang_thai not in ('cho', 'thieu_hang', 'chua_khop', 'loi') then
    return v_d.trang_thai;
  end if;

  begin
    select * into v_h  from kho_ipos_hoa_don where id = v_d.hoa_don_id;
    select * into v_c  from kho_ipos_cau_hinh where chi_nhanh_id = v_d.chi_nhanh_id;
    select * into v_cd from kho_cai_dat where chi_nhanh_id = v_d.chi_nhanh_id;

    if v_h.da_huy then
      update kho_ipos_dong set trang_thai = 'da_huy', ly_do = 'Hóa đơn đã hủy trên iPOS' where id = p_id;
      return 'da_huy';
    end if;

    -- Chưa chuyển sang trừ kho theo iPOS: quầy còn "thiếu = đã bán". Để chờ.
    if v_cd.chi_nhanh_id is null or v_cd.nguon_so_ban <> 'ipos' or v_c.ipos_tu_luc is null then
      update kho_ipos_dong set trang_thai = 'cho', ly_do = 'Chưa chuyển sang trừ kho theo iPOS' where id = p_id;
      return 'cho';
    end if;
    if v_d.thoi_diem_ban < v_c.ipos_tu_luc then
      update kho_ipos_dong set trang_thai = 'bo_qua', so_lan_thu = so_lan_thu + 1,
        ly_do = 'Bán trước mốc chuyển sang iPOS — đã tính trong lần đếm quầy'
      where id = p_id;
      return 'bo_qua';
    end if;

    -- ---- Khớp món ------------------------------------------------------------
    if v_d.ma_ipos is not null then
      select * into v_mp from kho_ipos_ma_hang where chi_nhanh_id = v_d.chi_nhanh_id and ma_ipos = v_d.ma_ipos;
    end if;
    if v_mp.kieu = 'bo_qua' then
      update kho_ipos_dong set trang_thai = 'bo_qua', so_lan_thu = so_lan_thu + 1,
        ly_do = case when v_mp.don_vi_ban = 'suat' then 'Món chế biến — chỉ đếm suất, không trừ kho'
                     else 'Không phải hàng kho' end
      where id = p_id;
      return 'bo_qua';
    end if;

    v_ma := v_d.ma_can;
    v_kg := v_d.so_kg;
    if v_d.ma_vach is not null and v_cd.mau_ma_vach is not null then
      select * into v_doc from kho_doc_ma_vach(v_d.ma_vach, v_cd.mau_ma_vach, v_cd.so_le_kg);
      if v_doc.loi is null then
        v_ma := coalesce(v_ma, v_doc.ma_can);
        v_kg := coalesce(v_kg, v_doc.so_kg);
      end if;
    end if;

    -- 0051 · Ô mã: ghép thẳng (kho_ipos_ma_hang.o_ma_id); hoặc chưa ghép mà mã
    -- món iPOS trùng mã ô (món ô trên FABi đặt mã = mã cân); hoặc nhãn cân in
    -- bằng mã ô. Ghép "mon" không kèm ô thì không suy ô từ nhãn.
    v_o := v_mp.o_ma_id;
    if v_o is null and v_mp.id is null and v_d.ma_ipos is not null then
      select o.id into v_o from kho_o_ma o where o.ma_can = nullif(ltrim(btrim(v_d.ma_ipos), '0'), '');
    end if;
    if v_o is null and v_ma is not null and (v_mp.id is null or v_mp.kieu = 'goi_can') then
      select o.id into v_o from kho_o_ma o where o.ma_can = v_ma;
    end if;
    if v_o is not null then
      select * into v_om from kho_o_ma where id = v_o;
    end if;

    -- 0054 · Mã giảm giá: như ô — mã món iPOS chưa ghép trùng một mã giảm (món
    -- giảm trên FABi đặt mã = mã cân giảm), hoặc nhãn cân in bằng mã giảm.
    -- Mã giảm đã tắt vẫn nhận: tem in trước khi tắt vẫn bán được.
    if v_o is null and v_mp.id is null and v_d.ma_ipos is not null then
      select * into v_mg from kho_ma_giam g where g.ma_can = nullif(ltrim(btrim(v_d.ma_ipos), '0'), '');
    end if;
    if v_o is null and v_mg.id is null and v_ma is not null and (v_mp.id is null or v_mp.kieu = 'goi_can') then
      select * into v_mg from kho_ma_giam g where g.ma_can = v_ma;
    end if;

    if v_mp.kieu = 'mon' or (v_mp.kieu = 'goi_can' and v_mp.mat_hang_id is not null) then
      select * into v_mh from kho_mat_hang where id = v_mp.mat_hang_id;
    elsif v_om.id is not null then
      select * into v_mh from kho_mat_hang where id = v_om.mat_hang_id and dang_dung;
    elsif v_mg.id is not null then
      select * into v_mh from kho_mat_hang where id = v_mg.mat_hang_id and dang_dung;   -- 0054
    elsif v_ma is not null then
      select * into v_mh from kho_mat_hang_theo_ma_can(v_ma);   -- 0051: nhận cả mã ô (0049)
    elsif v_mp.id is null and btrim(v_d.ma_ipos) ~ '^[0-9]+$' then
      -- 0103 · Mã món iPOS chưa ghép là MÃ CÂN của một món đang dùng (FABi đặt mã món
      -- = mã cân, thường thêm số 0 đầu cho đủ 5 số: 01011): kho tự nhận như ô / mã giảm.
      -- Chỉ mã cân của chính món — ô và mã giảm đã nhận ở trên; nhãn cân (v_ma) đi trước;
      -- ghép tay (kể cả goi_can, bo_qua) luôn thắng. Không ghi ma_can vào dòng: lần thử
      -- lại vẫn đọc quantity như lần đầu (v_tu_sl).
      select * into v_mh from kho_mat_hang
      where ma_can = nullif(ltrim(btrim(v_d.ma_ipos), '0'), '') and dang_dung;
      v_tu_ma := v_mh.id is not null;
    end if;
    if v_om.id is not null and v_om.mat_hang_id is distinct from v_mh.id then
      v_o := null;   -- ô của món khác: bỏ, trừ theo món đã khớp
      v_om := null;
    end if;
    if v_mg.id is not null and v_mg.mat_hang_id is distinct from v_mh.id then
      v_mg := null;   -- 0054: mã giảm của món khác: bỏ
    end if;
    if v_mh.id is null then
      update kho_ipos_dong set trang_thai = 'chua_khop', so_lan_thu = so_lan_thu + 1, ma_can = coalesce(ma_can, v_ma),
        ly_do = case when v_mp.kieu = 'goi_can' then 'Mã cân ' || coalesce(v_ma, '(không đọc được)') || ' chưa gán cho món nào'
                     else 'Chưa ghép mã iPOS với món trong kho' end
      where id = p_id;
      return 'chua_khop';
    end if;

    if v_c.vi_tri_ban_id is null then
      raise exception 'Chưa chọn quầy bán trong Kết nối iPOS';
    end if;

    -- 0051: lô gắn với ô lúc bán (tảng đang dùng ô đó).
    if v_o is not null then
      v_lo_o := kho_ipos_lo_cua_o(v_d.chi_nhanh_id, v_o, v_d.thoi_diem_ban);
    end if;

    -- ---- 0042 · Dòng chỉ có số lượng iPOS (không nhãn cân) ------------------
    v_tu_sl := v_d.so_luong is not null and v_d.ma_vach is null and v_d.ma_can is null;
    if v_tu_sl then
      -- 0051: món có ô mã là món cân trên FABi — mặc định quantity là số kg.
      -- 0103: mã món = mã cân cũng là món cân (FABi đọc kg từ tem) — kg.
      v_dv := coalesce(v_mp.don_vi_ban, case when v_o is not null or v_mg.id is not null or v_tu_ma or not v_mh.dem_goi then 'kg' else 'goi' end);
      if v_d.so_luong <= 0 then
        raise exception 'Số lượng bán trên iPOS phải lớn hơn 0';
      end if;
      if v_dv = 'kg' then
        v_kg := v_d.so_luong;
        if v_mh.dem_goi then
          v_goi := coalesce(kho_ipos_goi_theo_kg_lo(v_c.vi_tri_ban_id, v_lo_o, v_kg),
                            kho_ipos_goi_theo_kg(v_c.vi_tri_ban_id, v_mh.id, v_kg));
        end if;
      else
        if v_d.so_luong <> trunc(v_d.so_luong) then
          raise exception 'iPOS báo bán % gói "%" — số gói phải là số nguyên. Món này bán theo kg thì đổi "Bán theo" ở Ghép món',
            replace(trim_scale(v_d.so_luong)::text, '.', ','), v_mh.ten;
        end if;
        v_goi := v_d.so_luong::int;
        if v_mh.dem_goi then
          v_kg := null;   -- kg lấy theo sổ của gói bán ra
        elsif v_mp.kg_moi_don_vi is not null then
          v_kg := round(v_d.so_luong * v_mp.kg_moi_don_vi, 3);
        else
          raise exception '"%" tính theo kg mà iPOS bán theo gói — điền "mỗi gói = … kg" ở Ghép món', v_mh.ten;
        end if;
      end if;
    end if;

    if v_mh.dem_goi then
      v_goi := coalesce(v_goi, v_d.so_goi, 1);
      if v_goi <= 0 then
        raise exception 'Số gói bán phải lớn hơn 0';
      end if;
    else
      if v_kg is null or v_kg <= 0 then
        raise exception '"%" tính theo kg mà dòng iPOS không có số kg', v_mh.ten;
      end if;
    end if;

    -- ---- Lấy lô; thiếu thì tự nhận hàng đang mang ra quầy --------------------
    -- 0051: có ô → lấy đúng lô của ô trước; lô đó thiếu (hoặc ô chưa gắn lô)
    -- thì trừ theo hạn gần nhất như cũ và đánh dấu lech_o để đối soát.
    v_pb := kho_ipos_lay_lo_cua_lo(v_c.vi_tri_ban_id, v_mh.id, v_lo_o, v_goi, v_kg);
    v_lech := v_pb is null and v_o is not null;
    if v_pb is null then
      v_pb := kho_ipos_lay_lo(v_c.vi_tri_ban_id, v_mh.id, v_goi, v_kg);
    end if;
    if v_pb is null then
      for v_px in
        select x.id from kho_phieu_xuat x
        where x.chi_nhanh_id = v_d.chi_nhanh_id and x.loai = 'chuyen' and x.trang_thai = 'dang_chuyen'
          and x.vi_tri_den_id = v_c.vi_tri_ban_id
          and exists (select 1 from kho_chuyen_tren_duong(x.id) t where t.mat_hang_id = v_mh.id)
        order by x.created_at, x.id
      loop
        perform kho_ipos_tu_nhan(v_px.id);
        if v_tu_sl and v_dv = 'kg' and v_mh.dem_goi then
          v_goi := coalesce(kho_ipos_goi_theo_kg_lo(v_c.vi_tri_ban_id, v_lo_o, v_kg),
                            kho_ipos_goi_theo_kg(v_c.vi_tri_ban_id, v_mh.id, v_kg));
        end if;
        v_pb := kho_ipos_lay_lo_cua_lo(v_c.vi_tri_ban_id, v_mh.id, v_lo_o, v_goi, v_kg);
        v_lech := v_pb is null and v_o is not null;
        if v_pb is null then
          v_pb := kho_ipos_lay_lo(v_c.vi_tri_ban_id, v_mh.id, v_goi, v_kg);
        end if;
        exit when v_pb is not null;
      end loop;
    end if;
    if v_pb is null then
      update kho_ipos_dong set trang_thai = 'thieu_hang', so_lan_thu = so_lan_thu + 1,
        mat_hang_id = v_mh.id, ma_can = coalesce(ma_can, v_ma), o_ma_id = v_o, lo_o_id = v_lo_o, ma_giam_id = v_mg.id,
        so_kg = case when v_tu_sl then v_kg else coalesce(so_kg, v_kg) end,
        so_goi = case when v_tu_sl then v_goi else so_goi end,
        ly_do = 'Quầy không đủ "' || v_mh.ten || '" trên sổ: cần '
          || case when v_mh.dem_goi then v_goi || ' ' || v_mh.don_vi_goi
                    || case when v_tu_sl and v_kg is not null then ' (' || replace(trim_scale(v_kg)::text, '.', ',') || ' kg)' else '' end
                  else replace(trim_scale(v_kg)::text, '.', ',') || ' kg' end
      where id = p_id;
      return 'thieu_hang';
    end if;

    -- ---- Ghi sổ --------------------------------------------------------------
    v_ngay := ((v_d.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date;
    v_nv := (nhan_su_hien_tai()).id;
    v_n := jsonb_array_length(v_pb -> 'lo');
    select coalesce(sum((x ->> 'so_kg')::numeric), 0) into v_so from jsonb_array_elements(v_pb -> 'lo') x;
    v_con := v_kg;
    for v_e in select x from jsonb_array_elements(v_pb -> 'lo') x loop
      v_i := v_i + 1;
      if v_mh.dem_goi and v_kg is not null then
        -- Kg bán chia cho các lô theo kg sổ; lô cuối nhận phần dư.
        v_phan := case when v_i = v_n then v_con
                       when v_so > 0 then round(v_kg * (v_e ->> 'so_kg')::numeric / v_so, 3)
                       else 0 end;
        v_con := v_con - v_phan;
        if v_phan <> (v_e ->> 'so_kg')::numeric then
          insert into kho_so_cai
            (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
             chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi, ngay)
          values
            (v_d.chi_nhanh_id, (v_e ->> 'lo_id')::uuid, v_c.vi_tri_ban_id, v_mh.id, 'hao_hut',
             v_phan - (v_e ->> 'so_kg')::numeric, 0,
             'ban_hang', p_id,
             case when v_tu_sl then 'Lệch kg bán theo cân · iPOS ' else 'Lệch kg nhãn cân · iPOS ' end || v_h.ma_hd,
             v_nv, v_ngay);
        end if;
      else
        v_phan := (v_e ->> 'so_kg')::numeric;
      end if;
      if v_phan <> 0 or (v_e ->> 'so_goi')::int <> 0 then
        insert into kho_so_cai
          (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
           chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi, ngay)
        values
          (v_d.chi_nhanh_id, (v_e ->> 'lo_id')::uuid, v_c.vi_tri_ban_id, v_mh.id, 'ban',
           -v_phan, -(v_e ->> 'so_goi')::int,
           'ban_hang', p_id, 'iPOS ' || v_h.ma_hd, v_nv, v_ngay);
      end if;
    end loop;

    update kho_ipos_dong set
      trang_thai = 'da_ghi', so_lan_thu = so_lan_thu + 1, mat_hang_id = v_mh.id,
      ma_can = coalesce(ma_can, v_ma),
      so_kg = case when v_tu_sl then coalesce(v_kg, v_so) else coalesce(so_kg, v_kg) end,
      so_goi = case when v_tu_sl then v_goi else so_goi end,
      lo_het_han = (v_pb ->> 'het_han')::boolean, ghi_luc = now(),
      o_ma_id = v_o, lo_o_id = v_lo_o, lech_o = v_lech, ma_giam_id = v_mg.id,
      ly_do = nullif(concat_ws(' · ',
                case when (v_pb ->> 'het_han')::boolean then 'Đã bán gói thuộc lô HẾT HẠN' end,
                case when v_lech then 'Ô ' || v_om.so_o || ' (mã ' || v_om.ma_can || '): '
                  || case when v_lo_o is null then 'ô chưa gắn tảng lúc bán' else 'lô của tảng không đủ' end
                  || ' — đã trừ theo hạn gần nhất' end), '')
    where id = p_id;
    return 'da_ghi';
  exception when others then
    update kho_ipos_dong set trang_thai = 'loi', so_lan_thu = so_lan_thu + 1, ly_do = left(sqlerrm, 300)
    where id = p_id;
    return 'loi';
  end;
end;
$$;



-- =============================================================================
-- 2 · ĐỐI CHIẾU BÁN LẺ — thay THÂN ban_le_doi_chieu (cùng chữ ký)
-- =============================================================================
-- -----------------------------------------------------------------------------
-- ban_le_doi_chieu — chép 0099; chỗ đổi ghi 0103: dòng mã cân chưa ghép KHÔNG còn việc ghep
-- -----------------------------------------------------------------------------
-- FABi sửa tay (API iPOS chỉ đọc thực đơn). Không có giá FABi nào trong database (có chủ đích —
-- kho_ipos_menu không lưu giá), nên trang ghi "so giá trên FABi bằng tay" và hiện giá phải đặt.
-- Đầu: {menu_luc, menu_can_lam_moi, bat, so_mon_menu, menu_cu, dong}. menu_cu = chưa đọc được thực đơn, đọc
-- đã quá 2 giờ, đồng bộ đang tắt, hoặc iPOS báo thực đơn vừa đổi: khi đó KHÔNG BAO GIỜ nói "chưa có trên FABi"
-- (viec menu_cu thay cho tao_mon / bat_mon).
-- Dòng (loai_dong):
--   can      — mỗi mặt hàng dùng được, có mã cân, của sản phẩm theo cân (mọi trạng thái; nhiều sản phẩm cùng
--              mặt hàng gom một dòng). Ghép đúng: kiểu mon / goi_can, đúng mặt hàng, không ô, bán theo kg (hoặc
--              "theo món kho" khi mặt hàng chỉ cân kg); chưa ghép cũng đúng (0103: kho_ipos_ghi_dong tự nhận
--              mã FABi = mã cân, bán theo kg). goi_can không mặt hàng là sua_ghep: dòng bán FABi không
--              bao giờ mang mã cân, nên không bao giờ khớp được (0054). Mã FABi so sau khi bỏ số 0 đầu như
--              kho_ipos_ghi_dong; hiện mã FABi thật.
--   o_ma     — mỗi ô mã của mặt hàng đó (giá = giá mỗi kg); ma_giam — mỗi mã giảm đang dùng (giá kho_gia_giam).
--              Chưa ghép vẫn đúng (iPOS tự khớp theo số) — chỉ kiểm có / đang bán trên FABi và giá phải đặt.
--   goi      — mỗi gói của sản phẩm Đang bán đang bán. Cắt tại quầy: kiểu mon, mặt hàng của sản phẩm, bán theo
--              gói, mỗi gói = số gam / 1000 kg (chỉ so kg khi mặt hàng cân kg; đếm theo khay thì khay_nguyen).
--              Đóng sẵn / hộp: kiểu mon, mặt hàng của gói, bán theo gói hoặc theo món kho.
--              Sản phẩm Tạm ngưng hoặc gói ngưng bán mà mã FABi còn đang bán → tat_mon.
--   kiem_tra — mã FABi đang bán, ghép bán theo gói vào một mặt hàng của menu bán lẻ, mà không phải mã gói nào
--              của menu, không phải mã cân / ô mã / mã giảm mà các dòng trên đòi, không ghép vào ô mã →
--              kiem_tra_mon (xem lại, không phải lệnh tắt).
-- Mỗi dòng có don_vi: 'goi' / 'hop' (dòng gói của sản phẩm theo cân / theo hộp) hoặc null — trang ghi "gói 200 g"
-- hay "hộp 500 g".
-- Việc (viec): khop (chỉ khi không còn việc nào khác), menu_cu, tao_mon, bat_mon, ghep, sua_ghep, dat_gia (giá
-- chưa chốt hoặc đã đổi sau lần chốt), thieu_gia (gói đang bán chưa có giá; dòng mã cân / ô mã / mã giảm: giá
-- mỗi kg trống hay 0 đ — Beeftown Cân bỏ qua dòng, gia_phai_dat null), gia_qua_can, khay_nguyen, thieu_mat_hang,
-- goi_khong_dem_goi, chua_co_ma, tat_mon, kiem_tra_mon.
create or replace function ban_le_doi_chieu(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_c       kho_ipos_cau_hinh;
  v_so_mon  int;
  v_cu      boolean;
  v_dong    jsonb := '[]'::jsonb;
  r         record;
  q         record;
  v_sp      ban_le_san_pham;
  v_g       ban_le_goi;
  v_mh      kho_mat_hang;     -- mặt hàng của sản phẩm
  v_mhg     kho_mat_hang;     -- mặt hàng của gói
  v_mong    kho_mat_hang;     -- mặt hàng phép ghép phải trỏ tới
  v_menu    kho_ipos_menu;
  v_map     kho_ipos_ma_hang;
  v_ma      text;
  v_viec    text[];
  v_gia     bigint;
  v_gia_kg  bigint;
  v_thu     boolean;
  v_rieng   boolean;
  v_dung    boolean;
  v_tren    jsonb;
  v_don_vi  text;             -- dòng gói: 'goi' (theo cân) / 'hop' (theo hộp)
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản này không đối chiếu được FABi ở chi nhánh này.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id;
  select count(*) into v_so_mon from kho_ipos_menu where chi_nhanh_id = p_chi_nhanh_id;
  v_cu := v_c.menu_luc is null or v_c.menu_luc < now() - interval '2 hours'
          or not coalesce(v_c.bat, false) or coalesce(v_c.menu_can_lam_moi, false);

  -- ---- Mã cân, ô mã, mã giảm của mặt hàng sản phẩm theo cân ------------------------------------------------
  for r in
    select m.id, m.ten, m.ma_can, m.gia_ban_kg, m.dem_goi,
           (array_agg(s.id order by case s.loai when 'thit' then 0 else 1 end, s.thu_tu, s.ten_vi, s.id))[1] as san_pham_id,
           string_agg(s.ten_vi, ' · ' order by case s.loai when 'thit' then 0 else 1 end, s.thu_tu, s.ten_vi, s.id) as ten_san_pham,
           bool_or(s.gia_chot is null or (s.gia_chot ->> 'kg')::bigint is distinct from m.gia_ban_kg) as gia_thu,
           min(case s.loai when 'thit' then 0 else 1 end) as nhom_sp, min(s.thu_tu) as thu_tu_sp,
           min(s.ten_vi) as ten_sp
    from ban_le_san_pham s
    join kho_mat_hang m on m.id = s.mat_hang_id and m.dang_dung
    where s.cach_ban = 'theo_can'
    group by m.id
    order by nhom_sp, thu_tu_sp, ten_sp, m.id
  loop
    if r.ma_can is not null then
      -- Món trên FABi có mã = mã cân (FABi có thể thêm số 0 đầu); ưu tiên mã trùng đúng từng ký tự.
      v_menu := null;
      select * into v_menu from kho_ipos_menu mn
      where mn.chi_nhanh_id = p_chi_nhanh_id and nullif(ltrim(btrim(mn.ma_ipos), '0'), '') = r.ma_can
      order by (mn.ma_ipos = r.ma_can) desc, mn.dang_ban desc, mn.ma_ipos limit 1;
      v_map := null;
      if v_menu.ma_ipos is not null then
        select * into v_map from kho_ipos_ma_hang mp
        where mp.chi_nhanh_id = p_chi_nhanh_id and mp.ma_ipos = v_menu.ma_ipos;
      else
        select * into v_map from kho_ipos_ma_hang mp
        where mp.chi_nhanh_id = p_chi_nhanh_id and nullif(ltrim(btrim(mp.ma_ipos), '0'), '') = r.ma_can
        order by (mp.ma_ipos = r.ma_can) desc, mp.ma_ipos limit 1;
      end if;
      v_ma := coalesce(v_menu.ma_ipos, v_map.ma_ipos, r.ma_can);

      v_viec := '{}';
      if v_menu.ma_ipos is null then
        v_viec := v_viec || case when v_cu then 'menu_cu' else 'tao_mon' end;
      elsif not v_menu.dang_ban then
        v_viec := v_viec || case when v_cu then 'menu_cu' else 'bat_mon' end;
      end if;
      -- "Ghép đúng" bọc coalesce(…, false): ô trống của Ghép món (don_vi_ban null) làm phép so ra NULL, và
      -- "not NULL" cũng là NULL — thiếu coalesce thì ghép SAI (mặt hàng đếm khay ghép "theo món kho") lọt qua.
      -- 0103: chưa ghép là đúng — kho_ipos_ghi_dong tự nhận mã FABi này (bỏ số 0 đầu = mã cân), bán theo kg.
      if v_map.id is not null and not coalesce(v_map.kieu in ('mon', 'goi_can') and v_map.mat_hang_id is not distinct from r.id
                         and v_map.o_ma_id is null
                         and (v_map.don_vi_ban is not distinct from 'kg' or (v_map.don_vi_ban is null and not r.dem_goi)),
                         false) then
        v_viec := v_viec || 'sua_ghep'::text;
      end if;
      -- Giá trống hay 0 đ: Beeftown Cân bỏ qua dòng (cân không bán được mã này) — thieu_gia, không bao giờ khop,
      -- không dat_gia (không có giá nào để đặt). Quá cửa sổ 6 chữ số: gia_qua_can.
      if r.gia_ban_kg is null or r.gia_ban_kg <= 0 then
        v_viec := v_viec || 'thieu_gia'::text;
      else
        if r.gia_ban_kg > 999999 then
          v_viec := v_viec || 'gia_qua_can'::text;
        end if;
        if r.gia_thu then
          v_viec := v_viec || 'dat_gia'::text;
        end if;
      end if;
      if cardinality(v_viec) = 0 then
        v_viec := array['khop'];
      end if;

      v_dong := v_dong || jsonb_build_array(jsonb_build_object(
        'loai_dong', 'can', 'ma_fabi', v_ma, 'ma_can', r.ma_can, 'so_o', null, 'phan_tram', null, 'don_vi', null,
        'ten_san_pham', r.ten_san_pham, 'san_pham_id', r.san_pham_id, 'so_gam', null,
        -- Giá trống / 0 đ: không có giá nào để đặt — null, không bao giờ "đặt 0 đ/kg trên FABi".
        'gia_phai_dat', case when r.gia_ban_kg > 0 then r.gia_ban_kg end,
        'tren_fabi', case when v_menu.ma_ipos is not null then jsonb_build_object(
                            'co', true, 'ma', v_menu.ma_ipos, 'ten', v_menu.ten_ipos, 'dang_ban', v_menu.dang_ban)
                          when v_cu then null
                          else jsonb_build_object('co', false, 'ma', null, 'ten', null, 'dang_ban', null) end,
        'ghep', case when v_map.id is null then null else jsonb_build_object(
                  'kieu', v_map.kieu, 'mat_hang_ten', (select ten from kho_mat_hang where id = v_map.mat_hang_id),
                  'don_vi_ban', v_map.don_vi_ban, 'kg_moi_don_vi', v_map.kg_moi_don_vi) end,
        'mong_doi', jsonb_build_object('kieu', 'mon', 'mat_hang_ten', r.ten, 'don_vi_ban', 'kg', 'kg_moi_don_vi', null),
        'viec', to_jsonb(v_viec)));
    end if;

    -- Ô mã và mã giảm: một món FABi riêng mỗi mã, giá cố định trên FABi.
    for q in
      select 'o_ma'::text as loai_dong, 0 as nhom, o.so_o as thu_tu, o.ma_can, r.gia_ban_kg as gia,
             o.so_o, null::int as phan_tram
      from kho_o_ma o where o.mat_hang_id = r.id
      union all
      select 'ma_giam', 1, g.phan_tram, g.ma_can, kho_gia_giam(r.gia_ban_kg, g.phan_tram), null, g.phan_tram
      from kho_ma_giam g where g.mat_hang_id = r.id and g.dang_dung
      order by 2, 3
    loop
      v_ma := q.ma_can;
      -- Giá phải đặt chỉ khi có thật: giá mỗi kg trống / 0 đ (hay giá giảm làm tròn ra 0) → null.
      v_gia := case when q.gia > 0 then q.gia end;
      v_tren := jsonb_build_object('loai_dong', q.loai_dong, 'so_o', q.so_o, 'phan_tram', q.phan_tram, 'don_vi', null);
      v_menu := null;
      select * into v_menu from kho_ipos_menu mn
      where mn.chi_nhanh_id = p_chi_nhanh_id and nullif(ltrim(btrim(mn.ma_ipos), '0'), '') = v_ma
      order by (mn.ma_ipos = v_ma) desc, mn.dang_ban desc, mn.ma_ipos limit 1;
      v_map := null;
      select * into v_map from kho_ipos_ma_hang mp
      where mp.chi_nhanh_id = p_chi_nhanh_id and mp.ma_ipos = coalesce(v_menu.ma_ipos, v_ma);

      v_viec := '{}';
      if v_menu.ma_ipos is null then
        v_viec := v_viec || case when v_cu then 'menu_cu' else 'tao_mon' end;
      elsif not v_menu.dang_ban then
        v_viec := v_viec || case when v_cu then 'menu_cu' else 'bat_mon' end;
      end if;
      -- Như dòng mã cân: không có giá để đặt (v_gia null ở trên) → thieu_gia, không bao giờ khop.
      if v_gia is null then
        v_viec := v_viec || 'thieu_gia'::text;
      else
        if v_gia > 999999 then
          v_viec := v_viec || 'gia_qua_can'::text;
        end if;
        if r.gia_thu then
          v_viec := v_viec || 'dat_gia'::text;
        end if;
      end if;
      if cardinality(v_viec) = 0 then
        v_viec := array['khop'];
      end if;

      v_dong := v_dong || jsonb_build_array(v_tren || jsonb_build_object(
        'ma_fabi', coalesce(v_menu.ma_ipos, v_ma), 'ma_can', v_ma,
        'ten_san_pham', r.ten_san_pham, 'san_pham_id', r.san_pham_id, 'so_gam', null,
        'gia_phai_dat', v_gia,
        'tren_fabi', case when v_menu.ma_ipos is not null then jsonb_build_object(
                            'co', true, 'ma', v_menu.ma_ipos, 'ten', v_menu.ten_ipos, 'dang_ban', v_menu.dang_ban)
                          when v_cu then null
                          else jsonb_build_object('co', false, 'ma', null, 'ten', null, 'dang_ban', null) end,
        'ghep', case when v_map.id is null then null else jsonb_build_object(
                  'kieu', v_map.kieu, 'mat_hang_ten', (select ten from kho_mat_hang where id = v_map.mat_hang_id),
                  'don_vi_ban', v_map.don_vi_ban, 'kg_moi_don_vi', v_map.kg_moi_don_vi) end,
        'mong_doi', null,
        'viec', to_jsonb(v_viec)));
    end loop;
  end loop;

  -- ---- Gói online / hộp ---------------------------------------------------------------------------------------
  for v_sp in
    select * from ban_le_san_pham s
    order by case s.loai when 'thit' then 0 else 1 end, s.thu_tu, s.ten_vi, s.id
  loop
    v_mh := null;
    if v_sp.mat_hang_id is not null then
      select * into v_mh from kho_mat_hang where id = v_sp.mat_hang_id;
    end if;
    v_dung := v_mh.id is not null and v_mh.dang_dung;
    v_gia_kg := case when v_sp.cach_ban = 'theo_can' and v_dung then v_mh.gia_ban_kg end;
    v_rieng := v_sp.cach_ban = 'theo_hop' or v_sp.nguon_goi = 'dong_san';
    v_don_vi := 'goi';
    if v_sp.cach_ban = 'theo_hop' then
      v_don_vi := 'hop';
    end if;

    for v_g in select * from ban_le_goi where san_pham_id = v_sp.id order by so_gam loop
      v_menu := null;
      if v_g.ma_fabi is not null then
        select * into v_menu from kho_ipos_menu mn
        where mn.chi_nhanh_id = p_chi_nhanh_id and mn.ma_ipos = v_g.ma_fabi;
      end if;

      -- Không bán (sản phẩm Tạm ngưng hoặc gói ngưng): chỉ có việc khi FABi còn đang bán mã đó.
      if v_sp.trang_thai <> 'dang_ban' or not v_g.dang_ban then
        if v_menu.ma_ipos is not null and v_menu.dang_ban then
          v_map := null;
          select * into v_map from kho_ipos_ma_hang mp
          where mp.chi_nhanh_id = p_chi_nhanh_id and mp.ma_ipos = v_g.ma_fabi;
          v_dong := v_dong || jsonb_build_array(jsonb_build_object(
            'loai_dong', 'goi', 'ma_fabi', v_g.ma_fabi, 'ma_can', null, 'so_o', null, 'phan_tram', null,
            'don_vi', v_don_vi,
            'ten_san_pham', v_sp.ten_vi, 'san_pham_id', v_sp.id, 'so_gam', v_g.so_gam,
            'gia_phai_dat', null,
            'tren_fabi', jsonb_build_object('co', true, 'ma', v_menu.ma_ipos, 'ten', v_menu.ten_ipos, 'dang_ban', true),
            'ghep', case when v_map.id is null then null else jsonb_build_object(
                      'kieu', v_map.kieu, 'mat_hang_ten', (select ten from kho_mat_hang where id = v_map.mat_hang_id),
                      'don_vi_ban', v_map.don_vi_ban, 'kg_moi_don_vi', v_map.kg_moi_don_vi) end,
            'mong_doi', null,
            'viec', jsonb_build_array('tat_mon')));
        end if;
        continue;
      end if;

      v_mhg := null;
      if v_g.mat_hang_id is not null then
        select * into v_mhg from kho_mat_hang where id = v_g.mat_hang_id;
      end if;
      v_mong := case when v_rieng then v_mhg else v_mh end;
      v_gia := ban_le_gia_ban(v_g.gia_rieng, v_sp.cach_ban, v_gia_kg, v_g.so_gam);
      v_thu := v_sp.gia_chot is null
               or (v_sp.gia_chot -> 'goi' ->> (v_g.so_gam::text))::bigint is distinct from v_gia
               or (v_sp.cach_ban = 'theo_can' and (v_sp.gia_chot ->> 'kg')::bigint is distinct from v_gia_kg);

      v_viec := '{}';
      if v_mong.id is null or not v_mong.dang_dung then
        v_viec := v_viec || 'thieu_mat_hang'::text;
      elsif v_rieng and not v_mong.dem_goi then
        v_viec := v_viec || 'goi_khong_dem_goi'::text;
      elsif not v_rieng and v_mong.dem_goi then
        v_viec := v_viec || 'khay_nguyen'::text;
      end if;

      v_map := null;
      if v_g.ma_fabi is null then
        v_viec := v_viec || 'chua_co_ma'::text;
      else
        if v_menu.ma_ipos is null then
          v_viec := v_viec || case when v_cu then 'menu_cu' else 'tao_mon' end;
        elsif not v_menu.dang_ban then
          v_viec := v_viec || case when v_cu then 'menu_cu' else 'bat_mon' end;
        end if;
        select * into v_map from kho_ipos_ma_hang mp
        where mp.chi_nhanh_id = p_chi_nhanh_id and mp.ma_ipos = v_g.ma_fabi;
        -- coalesce(…, false) như dòng mã cân: gói cắt tại quầy ghép "theo món kho" (don_vi_ban trống — mặt hàng
        -- cân kg thì iPOS trừ 1 kg mỗi gói) hay "theo gói" thiếu "mỗi gói = … kg" (iPOS từ chối dòng bán, 0054)
        -- làm phép so ra NULL — vẫn là ghép sai.
        if v_map.id is null then
          v_viec := v_viec || 'ghep'::text;
        elsif v_mong.id is not null and v_mong.dang_dung and not coalesce(
                v_map.kieu = 'mon' and v_map.mat_hang_id = v_mong.id and v_map.o_ma_id is null
                and case when v_rieng then v_map.don_vi_ban is null or v_map.don_vi_ban = 'goi'
                         else v_map.don_vi_ban is not distinct from 'goi'
                              and (v_mong.dem_goi or v_map.kg_moi_don_vi = v_g.so_gam / 1000.0) end,
                false) then
          v_viec := v_viec || 'sua_ghep'::text;
        end if;
      end if;
      if v_gia is null then
        v_viec := v_viec || 'thieu_gia'::text;
      elsif v_thu then
        v_viec := v_viec || 'dat_gia'::text;
      end if;
      if cardinality(v_viec) = 0 then
        v_viec := array['khop'];
      end if;

      v_dong := v_dong || jsonb_build_array(jsonb_build_object(
        'loai_dong', 'goi', 'ma_fabi', v_g.ma_fabi, 'ma_can', null, 'so_o', null, 'phan_tram', null,
        'don_vi', v_don_vi,
        'ten_san_pham', v_sp.ten_vi, 'san_pham_id', v_sp.id, 'so_gam', v_g.so_gam,
        'gia_phai_dat', v_gia,
        'tren_fabi', case when v_g.ma_fabi is null then null
                          when v_menu.ma_ipos is not null then jsonb_build_object(
                            'co', true, 'ma', v_menu.ma_ipos, 'ten', v_menu.ten_ipos, 'dang_ban', v_menu.dang_ban)
                          when v_cu then null
                          else jsonb_build_object('co', false, 'ma', null, 'ten', null, 'dang_ban', null) end,
        'ghep', case when v_map.id is null then null else jsonb_build_object(
                  'kieu', v_map.kieu, 'mat_hang_ten', (select ten from kho_mat_hang where id = v_map.mat_hang_id),
                  'don_vi_ban', v_map.don_vi_ban, 'kg_moi_don_vi', v_map.kg_moi_don_vi) end,
        'mong_doi', jsonb_build_object(
                      'kieu', 'mon', 'mat_hang_ten', v_mong.ten, 'don_vi_ban', 'goi',
                      'kg_moi_don_vi', case when not v_rieng and not coalesce(v_mong.dem_goi, false)
                                            then v_g.so_gam / 1000.0 end),
        'viec', to_jsonb(v_viec)));
    end loop;
  end loop;

  -- ---- Mã FABi đang bán, trừ cùng mặt hàng theo gói, mà menu bán lẻ không có -----------------------------
  -- Không bao giờ bảo xem lại / tắt một mã mà mục khác của trang ĐÒI có trên FABi — và chỉ loại ĐÚNG những mã
  -- đó: mã cân, ô mã, mã giảm ĐANG DÙNG của mặt hàng dùng được của sản phẩm theo cân (đúng tập dòng can / o_ma /
  -- ma_giam ở trên tạo ra). Mã so sau khi bỏ số 0 đầu như kho_ipos_ghi_dong. Mã giảm đã tắt, mã cân của mặt hàng
  -- ngừng dùng hay của mặt hàng hộp không dòng nào đòi — FABi còn bán chúng theo gói thì vẫn phải xem lại. Loại
  -- thêm dòng ghép vào ô mã (o_ma_id — hàng cân của ô, không phải gói). Dòng bán theo kg đã ngoài điều kiện đơn
  -- vị ở dưới (chỉ 'goi', hoặc "theo món kho" của mặt hàng đếm theo gói).
  for r in
    with lien_ket as (
      select s.mat_hang_id as id from ban_le_san_pham s where s.mat_hang_id is not null
      union
      select g.mat_hang_id from ban_le_goi g where g.mat_hang_id is not null
    ),
    mh_dong_can as (
      select distinct m.id, m.ma_can
      from ban_le_san_pham s
      join kho_mat_hang m on m.id = s.mat_hang_id and m.dang_dung
      where s.cach_ban = 'theo_can'
    ),
    ma_duoc_doi as (
      select c.ma_can from mh_dong_can c where c.ma_can is not null
      union
      select o.ma_can from kho_o_ma o join mh_dong_can c on c.id = o.mat_hang_id
      union
      select g.ma_can from kho_ma_giam g join mh_dong_can c on c.id = g.mat_hang_id where g.dang_dung
    )
    select mp.ma_ipos, mp.kieu, mp.don_vi_ban, mp.kg_moi_don_vi, m.ten as mat_hang_ten, mn.ten_ipos
    from kho_ipos_ma_hang mp
    join kho_mat_hang m on m.id = mp.mat_hang_id
    join kho_ipos_menu mn on mn.chi_nhanh_id = mp.chi_nhanh_id and mn.ma_ipos = mp.ma_ipos and mn.dang_ban
    where mp.chi_nhanh_id = p_chi_nhanh_id
      and (mp.don_vi_ban = 'goi' or (mp.don_vi_ban is null and m.dem_goi))
      and mp.o_ma_id is null
      and mp.mat_hang_id in (select id from lien_ket)
      and not exists (select 1 from ban_le_goi g where g.ma_fabi = mp.ma_ipos)
      and not exists (select 1 from ma_duoc_doi d where d.ma_can = nullif(ltrim(btrim(mp.ma_ipos), '0'), ''))
    order by mp.ma_ipos
  loop
    v_dong := v_dong || jsonb_build_array(jsonb_build_object(
      'loai_dong', 'kiem_tra', 'ma_fabi', r.ma_ipos, 'ma_can', null, 'so_o', null, 'phan_tram', null, 'don_vi', null,
      'ten_san_pham', null, 'san_pham_id', null, 'so_gam', null, 'gia_phai_dat', null,
      'tren_fabi', jsonb_build_object('co', true, 'ma', r.ma_ipos, 'ten', r.ten_ipos, 'dang_ban', true),
      'ghep', jsonb_build_object('kieu', r.kieu, 'mat_hang_ten', r.mat_hang_ten,
                                 'don_vi_ban', r.don_vi_ban, 'kg_moi_don_vi', r.kg_moi_don_vi),
      'mong_doi', null,
      'viec', jsonb_build_array('kiem_tra_mon')));
  end loop;

  return jsonb_build_object(
    'menu_luc', v_c.menu_luc,
    'menu_can_lam_moi', coalesce(v_c.menu_can_lam_moi, false),
    'bat', coalesce(v_c.bat, false),
    'so_mon_menu', v_so_mon,
    'menu_cu', v_cu,
    'dong', v_dong);
end;
$$;

comment on function ban_le_doi_chieu(uuid) is
  'Đối chiếu menu bán lẻ với FABi của một chi nhánh (0099; 0103: mã cân chưa ghép không còn việc ghep — kho tự nhận), danh_muc: mã cân, ô mã, mã giảm, gói; việc phải làm trên FABi. Không đọc giá FABi (không lưu ở đâu).';



-- =============================================================================
-- 3 · MÃ MÓN iPOS ĐÃ BÁN — để file nhập món cho FABi không thêm lại món đã có
-- =============================================================================
-- Trả mã dạng số đã bỏ số 0 đầu ("01011" → "1011") — đúng cách so mã cân / mã ô / mã giảm của kho; mã chữ
-- (ITEM-XXXX) không liên quan file nhập nên bỏ, tập trả về luôn nhỏ. security invoker: RLS của kho_ipos_dong
-- (vai xem_gia, đúng chi nhánh) quyết định ai thấy gì — vai khác, chi nhánh khác nhận tập rỗng, không lỗi.
create or replace function kho_ipos_ma_da_ban(p_chi_nhanh_id uuid)
returns table (ma_so text)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct ltrim(btrim(d.ma_ipos), '0')
  from kho_ipos_dong d
  where d.chi_nhanh_id = p_chi_nhanh_id
    and btrim(d.ma_ipos) ~ '^[0-9]*[1-9][0-9]*$'
  order by 1;
$$;

comment on function kho_ipos_ma_da_ban(uuid) is
  'Mã món iPOS dạng số (đã bỏ số 0 đầu) từng có dòng bán ở chi nhánh (0103) — mã đã bán là chắc có trên FABi; web bỏ khỏi file "Thêm món từ file". security invoker: RLS kho_ipos_dong (xem_gia).';


-- =============================================================================
-- 4 · THU QUYỀN — đúng các hàm của file này (0008 mục 6)
-- =============================================================================
-- create or replace giữ quyền cũ; thu lại cho chắc, như 0054 (kho_ipos_ghi_dong: chỉ hàm definer khác gọi)
-- và 0099 (ban_le_doi_chieu: trang nội bộ gọi, tự kiểm vai danh_muc ở câu đầu — test-quyen-ghi-thang-crm.mjs
-- XEP_LOAI). kho_ipos_ma_da_ban: hàm mới nhận EXECUTE mặc định cho PUBLIC / anon — thu; authenticated gọi được
-- (RLS lọc, test-kho-quyen.mjs GOI_DUOC). Không chép khối "thu hết rồi cấp lại danh sách anon" — danh sách anon
-- không đổi.
do $$
begin
  execute 'revoke execute on function kho_ipos_ghi_dong(uuid) from public';
  execute 'revoke execute on function ban_le_doi_chieu(uuid) from public';
  execute 'revoke execute on function kho_ipos_ma_da_ban(uuid) from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function kho_ipos_ghi_dong(uuid) from anon';
    execute 'revoke execute on function ban_le_doi_chieu(uuid) from anon';
    execute 'revoke execute on function kho_ipos_ma_da_ban(uuid) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_ipos_ghi_dong(uuid) from authenticated';
    execute 'grant execute on function ban_le_doi_chieu(uuid) to authenticated';
    execute 'grant execute on function kho_ipos_ma_da_ban(uuid) to authenticated';
  end if;
end
$$;
