-- =============================================================================
-- BEEFTOWN KHO — 0128 · MÓN Ủ CHỈ Ở KHO: KHÔNG BAO GIỜ LÊN FABi, KHÔNG BÁN QUA iPOS
-- =============================================================================
-- PHẢI CHẠY SAU 0106 (bản cuối của kho_ipos_ghi_dong) VÀ 0107 (luật Trim → tảng ủ).
--
-- Khánh 26/11/2026: "FABI sẽ không có các món này, chỉ có phần mềm kho của tôi thôi" và "hardcode cái này như thế
-- nào đó, cứ tảng ủ là trong kho thôi nhé". Trước file này món ủ chỉ tránh được FABi khi mã cân và giá để trống —
-- không luật nào giữ. Khánh chọn (26/11/2026): kho TỰ NHẬN món ủ theo công thức Trim, không có ô tích; món ủ VẪN
-- giữ được mã cân ("lúc trim xong thì phải có 1 cái mã đó, dù cái mã đó chả làm gì nhưng chứa thông tin") — nên
-- luật phải nằm ở chỗ khớp món khi bán, không phải ở chỗ cấm mã cân.
--
-- Món ủ = món LOẠI TẢNG là đầu ra của một công thức pha lóc ĐANG DÙNG của món khác — đúng định nghĩa "tảng ủ" của
-- 0107 (công thức của món khác ra một món tảng là công thức Trim; trigger kho_phien_pha_dung_trinh_tu). Khách không
-- bao giờ mua tảng ủ: khách mua khay cắt ra từ nó (món phần cắt, mã cân riêng); tảng ủ bị trừ lúc chốt phiên Cắt.
--
--   1. View kho_v_mon_u (mới, security_invoker): danh sách món ủ — MỘT chỗ định nghĩa cho database và web.
--   2. Trigger kho_ipos_ma_hang_khong_mon_u (mới): không ghép được mã iPOS nào với món ủ (kho_ipos_gan_ma_v2,
--      kho_ipos_gan_o_ma đều ghi vào kho_ipos_ma_hang). Ghép cũ có sẵn thì không đụng — bước 3 chặn lúc bán.
--   3. kho_ipos_ghi_dong — thay THÂN (chép 0106): mọi đường khớp món (ghép tay, ô mã, mã giảm, nhãn cân, mã món =
--      mã cân) ra món ủ thì dòng bán "Chưa khớp" kèm lý do, KHÔNG trừ kho — món ủ không bao giờ bị FABi trừ.
-- Không bảng, cột mới; không đổi dữ liệu. Web (cùng PR) bỏ món ủ khỏi "Món cần có trên FABi", file mon-fabi.xlsx /
-- mon-fabi.csv, ô chọn món ở Ghép món, và không coi mã cân của món ủ là "kho tự nhận".
--
-- Triển khai: chạy migration TRƯỚC, deploy web SAU — web mới đọc kho_v_mon_u (thiếu view thì trang Ghép món và hai
-- file FABi báo lỗi đọc, không đưa món nào sai). Không có câu delete: chạy cả file bằng SQL Editor hoặc psql (không
-- dùng apply_migration của Supabase MCP). Chỉ chạy lên production SAU khi PR được gộp, rồi `npm run doi-chieu` phải
-- báo KHỚP (0128 là file cuối định nghĩa kho_ipos_ghi_dong).
-- =============================================================================


-- =============================================================================
-- 1 · DANH SÁCH MÓN Ủ
-- =============================================================================
-- Cùng luật với v_u của kho_phien_pha_dung_trinh_tu (0107): món tảng, là đầu ra của công thức đang dùng của MÓN
-- KHÁC. RLS của kho_mat_hang, kho_cong_thuc_pha, kho_cong_thuc_pha_dong (đều quyền xem) vẫn áp dụng.
create view kho_v_mon_u with (security_invoker = true) as
select m.id as mat_hang_id, m.ma, m.ten, m.ma_can, m.dang_dung
from kho_mat_hang m
where m.loai = 'tang'
  and exists (select 1 from kho_cong_thuc_pha c
              join kho_cong_thuc_pha_dong d on d.cong_thuc_id = c.id
              where d.mat_hang_ra_id = m.id and c.dang_dung and c.mat_hang_vao_id <> m.id);

comment on view kho_v_mon_u is
  'Món ủ (0128): món loại tảng là đầu ra của công thức pha lóc đang dùng của món khác (công thức Trim, như 0107). Chỉ ở kho: không lên FABi, không ghép mã iPOS, dòng bán iPOS ra món này "Chưa khớp". Có thể có mã cân (tem trong kho).';


-- =============================================================================
-- 2 · KHÔNG GHÉP MÃ iPOS VỚI MÓN Ủ
-- =============================================================================
-- security invoker: chỉ chạy dưới kho_ipos_gan_ma_v2 / kho_ipos_gan_o_ma (security definer, đã kiểm danh_muc).
create or replace function kho_ipos_ma_hang_khong_mon_u()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_ten text;
begin
  if new.mat_hang_id is null then
    return new;
  end if;
  select u.ten into v_ten from kho_v_mon_u u where u.mat_hang_id = new.mat_hang_id;
  if found then
    raise exception '"%" là món ủ — chỉ ở kho, không bán qua FABi: không ghép được mã iPOS với món này', v_ten
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

comment on function kho_ipos_ma_hang_khong_mon_u() is
  'NỘI BỘ (trigger, 0128). Chặn ghép mã iPOS (kho_ipos_ma_hang.mat_hang_id) với món ủ (kho_v_mon_u) — món ủ chỉ ở kho.';

drop trigger if exists kho_ipos_ma_hang_khong_mon_u_trigger on kho_ipos_ma_hang;
create trigger kho_ipos_ma_hang_khong_mon_u_trigger
  before insert or update of mat_hang_id on kho_ipos_ma_hang
  for each row execute function kho_ipos_ma_hang_khong_mon_u();


-- =============================================================================
-- 3 · GHI MỘT DÒNG — thay THÂN kho_ipos_ghi_dong (cùng chữ ký)
-- =============================================================================
-- kho_ipos_ghi_dong — chép 0106; chỗ đổi ghi 0128: sau khi khớp món (mọi đường), món ủ → "Chưa khớp", không trừ.
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
  v_t_kg  numeric;            -- 0104: tồn của lô ở quầy trước dòng này
  v_t_goi int;
  v_chenh numeric;            -- 0104: chênh lệch cân (chỉ gói cuối của lô ở quầy / kg vượt lô)
  v_lo_tem uuid;              -- 0106: lô có khay tem đúng kg bán, chưa bán (kho_ipos_lo_theo_tem)
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
    elsif v_mp.id is null and btrim(v_d.ma_ipos) ~ '^[0-9]+$'
          and coalesce(upper(kho_ipos_don_vi_dong(v_h.raw, v_d.khoa_dong)), 'KG') = 'KG' then
      -- 0103 · Mã món iPOS chưa ghép là MÃ CÂN của một món đang dùng (FABi đặt mã món
      -- = mã cân, thường thêm số 0 đầu cho đủ 5 số: 01011): kho tự nhận như ô / mã giảm.
      -- Chỉ mã cân của chính món — ô và mã giảm đã nhận ở trên; nhãn cân (v_ma) đi trước;
      -- ghép tay (kể cả goi_can, bo_qua) luôn thắng; đơn vị FABi khác KG (món hộp, chai…
      -- trùng số) thì không nhận. Không ghi ma_can vào dòng: lần thử lại vẫn đọc quantity
      -- như lần đầu (v_tu_sl).
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
    -- 0128 · Món ủ (tảng ủ — đầu ra công thức Trim, kho_v_mon_u) chỉ ở kho, không bao giờ bán qua FABi: mọi đường
    -- khớp ở trên (ghép tay cũ, ô mã, mã giảm, nhãn cân, mã món = mã cân) ra món ủ thì "Chưa khớp", không trừ kho.
    -- Món ủ vẫn có thể có mã cân (tem trong kho) — chặn ở đây chứ không cấm mã cân.
    if v_mh.id is not null and exists (select 1 from kho_v_mon_u u where u.mat_hang_id = v_mh.id) then
      update kho_ipos_dong set trang_thai = 'chua_khop', so_lan_thu = so_lan_thu + 1, ma_can = coalesce(ma_can, v_ma),
        ly_do = 'Món ủ "' || v_mh.ten || '" chỉ ở kho, không bán qua FABi — ghép mã này với món bán ra ở Ghép món'
      where id = p_id;
      return 'chua_khop';
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
          -- 0104: kg đúng bằng tem một khay đã quét lúc cắt → một khay; không thì số gói có tổng kg gần nhất.
          v_goi := case when kho_ipos_mot_khay_quet(v_c.vi_tri_ban_id, v_mh.id, v_lo_o, v_kg) then 1
                        else coalesce(kho_ipos_goi_theo_kg_lo(v_c.vi_tri_ban_id, v_lo_o, v_kg),
                                      kho_ipos_goi_theo_kg(v_c.vi_tri_ban_id, v_mh.id, v_kg)) end;
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
    -- 0106: không ô, bán một khay có kg → lô có khay tem đúng kg đó chưa bán (tem quét lúc cắt) trước
    -- lô hạn gần nhất — khay của tảng nào trừ đúng lô tảng đó.
    if v_mh.dem_goi and v_o is null and v_goi = 1 and v_kg is not null then
      v_lo_tem := kho_ipos_lo_theo_tem(v_c.vi_tri_ban_id, v_mh.id, v_kg);
    end if;
    v_pb := kho_ipos_lay_lo_cua_lo(v_c.vi_tri_ban_id, v_mh.id, v_lo_o, v_goi, v_kg);
    v_lech := v_pb is null and v_o is not null;
    if v_pb is null and v_lo_tem is not null then
      v_pb := kho_ipos_lay_lo_cua_lo(v_c.vi_tri_ban_id, v_mh.id, v_lo_tem, v_goi, v_kg);   -- 0106
    end if;
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
          v_goi := case when kho_ipos_mot_khay_quet(v_c.vi_tri_ban_id, v_mh.id, v_lo_o, v_kg) then 1   -- 0104
                        else coalesce(kho_ipos_goi_theo_kg_lo(v_c.vi_tri_ban_id, v_lo_o, v_kg),
                                      kho_ipos_goi_theo_kg(v_c.vi_tri_ban_id, v_mh.id, v_kg)) end;
        end if;
        if v_mh.dem_goi and v_o is null and v_goi = 1 and v_kg is not null then   -- 0106
          v_lo_tem := kho_ipos_lo_theo_tem(v_c.vi_tri_ban_id, v_mh.id, v_kg);
        end if;
        v_pb := kho_ipos_lay_lo_cua_lo(v_c.vi_tri_ban_id, v_mh.id, v_lo_o, v_goi, v_kg);
        v_lech := v_pb is null and v_o is not null;
        if v_pb is null and v_lo_tem is not null then
          v_pb := kho_ipos_lay_lo_cua_lo(v_c.vi_tri_ban_id, v_mh.id, v_lo_tem, v_goi, v_kg);   -- 0106
        end if;
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
        -- 0104 · Trừ ĐÚNG kg bán (kg trên tem), không theo kg trung bình của gói: lô giữ phần kg còn
        -- lại — khi cắt có quét tem từng khay, đó đúng là tổng các khay chưa bán. Hao hụt ghi ở nhập /
        -- trim / pha lóc, không ở lúc bán. Chỉ hai chỗ ghi MỘT dòng chênh lệch cân (ghi trước dòng ban —
        -- tồn không âm): bán gói CUỐI của lô ở quầy → lô về đúng 0/0; kg bán từ hết kg còn lại của lô trở
        -- lên mà lô còn gói → các gói còn lại giữ kg trung bình trước lần bán (không để gói 0 kg).
        select t.so_kg, t.so_goi into v_t_kg, v_t_goi from kho_ton t
        where t.lo_id = (v_e ->> 'lo_id')::uuid and t.vi_tri_id = v_c.vi_tri_ban_id
        for update;
        v_chenh := case when (v_e ->> 'so_goi')::int >= coalesce(v_t_goi, 0) then v_phan - coalesce(v_t_kg, 0)
                        when v_phan >= v_t_kg
                          then v_phan - round(v_t_kg * (v_e ->> 'so_goi')::int / v_t_goi, 3)
                        else 0 end;
        if v_chenh <> 0 then
          insert into kho_so_cai
            (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
             chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi, ngay)
          values
            (v_d.chi_nhanh_id, (v_e ->> 'lo_id')::uuid, v_c.vi_tri_ban_id, v_mh.id, 'hao_hut', v_chenh, 0,
             'ban_hang', p_id,
             case when (v_e ->> 'so_goi')::int >= coalesce(v_t_goi, 0) then 'Chênh lệch cân khi bán hết lô ở quầy · iPOS '
                  else 'Kg bán vượt kg còn lại của lô · iPOS ' end || v_h.ma_hd,
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
-- 4 · THU QUYỀN — đúng hai hàm của file này (0008 mục 6)
-- =============================================================================
-- Cả hai hàm nội bộ: thu cả authenticated (test-kho-quyen.mjs NOI_BO). View đọc theo quyền mặc định như mọi view kho;
-- RLS của bảng gốc lo phần còn lại (security_invoker). Danh sách anon không đổi.
do $$
begin
  execute 'revoke execute on function kho_ipos_ma_hang_khong_mon_u() from public';
  execute 'revoke execute on function kho_ipos_ghi_dong(uuid) from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function kho_ipos_ma_hang_khong_mon_u() from anon';
    execute 'revoke execute on function kho_ipos_ghi_dong(uuid) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_ipos_ma_hang_khong_mon_u() from authenticated';
    execute 'revoke execute on function kho_ipos_ghi_dong(uuid) from authenticated';
  end if;
end
$$;
