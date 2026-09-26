-- =============================================================================
-- BEEFTOWN KHO — 0041 · SỬA HÀNG LOẠT DANH MỤC · BÁO CÁO THEO THÁNG
--                      · MUA HÀNG THEO NCC / MẶT HÀNG · SỔ THANH TOÁN (GĐ8c)
-- =============================================================================
-- Không thêm bảng, không thêm việc vào kho_vai_duoc, không đổi hàm cũ. Bốn
-- hàm mới, đều SECURITY DEFINER, kiểm quyền bằng kho_duoc ở dòng đầu.
--
-- AI LÀM GÌ
--   kho_sua_nhanh_mat_hang     danh_muc (chủ, quản lý)
--   kho_bao_cao_theo_thang     xem (mọi vai kho) — cột TIỀN chỉ vai xem_gia,
--                              vai khác nhận null (thủ kho, NV quầy thấy kg)
--   kho_bao_cao_mua_hang       xem_gia (chủ, quản lý, kế toán)
--   kho_so_thanh_toan          ke_toan (chủ, quản lý, kế toán)
--
-- 1. SỬA HÀNG LOẠT MẶT HÀNG — kho_sua_nhanh_mat_hang(p_chi_nhanh_id, p_dong)
--    p_dong = [{ id, phien_ban, <ô cần đổi>… }], tối đa 1000 dòng.
--      phien_ban   updated_at của mặt hàng lúc mở trang (chuỗi ISO web đọc
--                  được). Khác updated_at hiện tại = có người vừa sửa → lỗi
--                  dòng "vừa được người khác sửa", không ghi đè.
--      Ô sửa được: gia_ban_kg, han_dung_ngay, ma_can, quay_toi_thieu_goi,
--                  quay_toi_da_goi, ton_toi_thieu_kg, kho_toi_thieu_kg,
--                  kho_toi_da_kg, noi_de_sau_pha ('kho' | 'quay'), dang_dung.
--      Mỗi ô:  vắng mặt hoặc chuỗi rỗng ""  → GIỮ giá trị cũ
--              null (JSON)                  → XÓA (bỏ trống) — trừ dang_dung
--              số / chuỗi số                → giá trị mới (kg nhận "1,5")
--    TẤT CẢ HOẶC KHÔNG: kiểm mọi dòng trước; có lỗi ở bất kỳ dòng nào thì
--    không ghi dòng nào và trả { ok: false, loi: [{ dong, id, ten, truong,
--    cau }] } — mỗi lỗi một câu để web hiện ngay tại dòng đó. Không lỗi: ghi
--    các dòng có thay đổi thật (dòng không đổi gì không chạm, updated_at giữ
--    nguyên) → { ok: true, so_dong_luu, so_dong_khong_doi, dong: [{ id,
--    phien_ban }], cau }.
--    Kiểm trên giá trị CUỐI (ô mới + ô giữ): tối thiểu ≤ tối đa (quầy, kho
--    lạnh); mã cân không trùng món đang dùng khác — kể cả giữa các dòng trong
--    cùng lần lưu; đổi chéo mã cân giữa hai món trong một lần lưu được (bỏ mã
--    cũ trước rồi mới ghi mã mới).
--    Giá vốn, giá trị thu hồi phụ phẩm KHÔNG sửa ở đây (bảng giá riêng).
--    Hàm lưu hiện có (web ghi thẳng bảng từng món, kho_luu_muc_dat_hang) không
--    có phiên bản chống ghi đè và không lưu nhiều món một lần — nên thêm hàm.
--
-- 2. BÁO CÁO THEO THÁNG — kho_bao_cao_theo_thang(p_chi_nhanh_id, p_nam)
--    Mỗi tháng của năm p_nam đã bắt đầu (tính theo hom_nay_vn()) một dòng;
--    năm tương lai → 0 dòng. Theo sổ kho (kho_so_cai, ngày chứng từ), dòng
--    đảo ngược tính theo loại của dòng gốc (như kho_bao_cao_xnt_v2). Kg dương:
--      ton_dau     tồn trước ngày 1 của tháng
--      nhap        nhập (phiếu nhập mua + tồn đầu kỳ)
--      ban         xuất bán (iPOS và kiểm kê quầy trước khi nối iPOS)
--      xuat_bep, xuat_khac, tra_ncc, huy
--      hao_hut     mất khi mang ra quầy + kiểm kê thiếu (trừ kiểm kê thừa)
--      pha_mat     kg tảng đem pha − kg thịt / phụ phẩm pha ra (phần bỏ + hao)
--      ton_cuoi    tồn sau ngày cuối tháng
--    ton_cuoi = ton_dau + nhap − ban − xuat_bep − xuat_khac − tra_ncc − huy
--               − hao_hut − pha_mat (chuyển kho ↔ quầy trong chi nhánh = 0).
--    Tiền = kg × giá vốn lô (_tien). chi_phi_thit = ban + xuat_bep + xuat_khac
--    + huy + hao_hut (tiền; như "chi phí thịt" của kho_chi_so_quan_tri).
--    doanh_thu = tổng tiền các dòng hóa đơn iPOS của tháng (trừ dòng đã hủy;
--    gồm cả món không dùng thịt); co_ipos = tháng có dòng iPOS nào;
--    chi_phi_tren_doanh_thu_pt = chi phí thịt ÷ doanh thu × 100.
--    Không có quyền xem_gia: MỌI cột tiền (_tien, chi_phi_thit, doanh_thu,
--    chi_phi_tren_doanh_thu_pt) = null.
--
-- 3. MUA HÀNG — kho_bao_cao_mua_hang(p_chi_nhanh_id, p_tu, p_den, p_nhom)
--    Phiếu nhập MUA đã duyệt có ngày nhập trong kỳ (không gồm tồn đầu kỳ,
--    nợ đầu kỳ). Kỳ tối đa 1 năm.
--      p_nhom 'ncc'       một dòng một NCC: số phiếu, số mặt hàng, kg, gói,
--                         tiền hàng, thuế, chi phí khác, tong_tien (= phải
--                         trả: tiền hóa đơn nếu đã đối chiếu, không thì tổng
--                         phiếu), giá TB/kg (tiền hàng ÷ kg), tỷ trọng %.
--      p_nhom 'mat_hang'  một dòng một mặt hàng: số phiếu, số NCC, kg, gói,
--                         tiền hàng, giá TB / thấp nhất / cao nhất một kg, tỷ
--                         trọng %. Thuế, chi phí khác, tong_tien = null (thuế
--                         ghi theo phiếu, không theo món).
--    Tỷ trọng % = tiền hàng của dòng ÷ tổng tiền hàng kỳ × 100.
--
-- 4. SỔ THANH TOÁN — kho_so_thanh_toan(p_chi_nhanh_id, p_tu, p_den)
--    Mọi khoản trong kho_thanh_toan có ngày trong kỳ (cả khoản đã hủy — để
--    kế toán thấy; tien_ra / tien_vao / giam_no của khoản đã hủy = 0):
--      tien_ra   tiền rời quán (trả tiền)
--      tien_vao  tiền NCC trả lại (NCC hoàn tiền)
--      giam_no   làm giảm công nợ bao nhiêu (trả tiền, giảm trừ, bù trừ: +;
--                NCC hoàn tiền: −)
--    kèm tên loại / cách trả tiếng Việt, NCC, số các phiếu nhập được chia,
--    số phiếu trả hàng (giảm trừ do trả hàng), người ghi. Kỳ tối đa 1 năm.
--
-- HÀM
--   kho_sua_nhanh_mat_hang                                          [danh_muc]
--   kho_bao_cao_theo_thang                           [xem; tiền chỉ xem_gia]
--   kho_bao_cao_mua_hang                                             [xem_gia]
--   kho_so_thanh_toan                                                [ke_toan]
-- =============================================================================


-- =============================================================================
-- 1 · SỬA HÀNG LOẠT MẶT HÀNG
-- =============================================================================
create or replace function kho_sua_nhanh_mat_hang(p_chi_nhanh_id uuid, p_dong jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_r        jsonb;
  v_i        int;
  v_id       uuid;
  v_cu       kho_mat_hang;
  v_moi      kho_mat_hang;
  v_ds       kho_mat_hang[] := '{}';
  v_doi_can  uuid[] := '{}';
  v_da_thay  uuid[] := '{}';
  v_loi      jsonb := '[]';
  v_ra       jsonb := '[]';
  v_pb       timestamptz;
  v_x        jsonb;
  v_t        text;
  v_khong_doi int := 0;
  v_ten      text;
  v_trung    text;
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không sửa được danh mục mặt hàng' using errcode = 'insufficient_privilege';
  end if;
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' then
    raise exception 'Dữ liệu gửi lên không đúng dạng danh sách' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_dong) = 0 then
    return jsonb_build_object('ok', true, 'so_dong_luu', 0, 'so_dong_khong_doi', 0, 'dong', '[]'::jsonb,
                              'cau', 'Chưa đổi ô nào — không có gì để lưu.');
  end if;
  if jsonb_array_length(p_dong) > 1000 then
    raise exception 'Mỗi lần lưu tối đa 1000 món' using errcode = 'check_violation';
  end if;

  for v_r, v_i in select e, n::int from jsonb_array_elements(p_dong) with ordinality as t(e, n) loop
    v_ten := null;
    if jsonb_typeof(v_r) <> 'object' then
      v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', null, 'ten', null, 'truong', null,
                                           'cau', 'Dòng ' || v_i || ' không đúng dạng.');
      continue;
    end if;
    begin
      v_id := (v_r->>'id')::uuid;
    exception when others then
      v_id := null;
    end;
    if v_id is null then
      v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', null, 'ten', null, 'truong', null,
                                           'cau', 'Dòng ' || v_i || ': thiếu mặt hàng.');
      continue;
    end if;
    if v_id = any(v_da_thay) then
      v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', null, 'truong', null,
                                           'cau', 'Một món được gửi hai lần trong cùng một lần lưu.');
      continue;
    end if;
    v_da_thay := v_da_thay || v_id;

    select * into v_cu from kho_mat_hang where id = v_id for update;
    if not found then
      v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', null, 'truong', null,
                                           'cau', 'Không tìm thấy món này — có thể đã bị xóa. Tải lại trang.');
      continue;
    end if;
    v_ten := v_cu.ten;

    -- Phiên bản: bắt buộc, phải đúng updated_at hiện tại.
    begin
      v_pb := nullif(btrim(v_r->>'phien_ban'), '')::timestamptz;
    exception when others then
      v_pb := null;
    end;
    if v_pb is null then
      v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', null,
                                           'cau', v_ten || ': thiếu phiên bản của dòng — tải lại trang rồi sửa lại.');
      continue;
    end if;
    if v_pb is distinct from v_cu.updated_at then
      v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', null,
                                           'cau', v_ten || ': vừa được người khác sửa lúc '
                                                  || to_char(v_cu.updated_at at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM')
                                                  || ' — tải lại trang để xem số mới rồi sửa lại.');
      continue;
    end if;

    v_moi := v_cu;

    -- Giá bán / kg (đồng)
    v_x := v_r->'gia_ban_kg';
    if v_x is not null and v_x <> '""'::jsonb then
      if jsonb_typeof(v_x) = 'null' then v_moi.gia_ban_kg := null;
      else
        v_t := btrim(v_x #>> '{}');
        if v_t ~ '^\d{1,11}$' then v_moi.gia_ban_kg := v_t::bigint;
        else
          v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'gia_ban_kg',
                                               'cau', v_ten || ': giá bán/kg phải là số đồng, ví dụ 650000.');
        end if;
      end if;
    end if;

    -- Hạn dùng mặc định (ngày)
    v_x := v_r->'han_dung_ngay';
    if v_x is not null and v_x <> '""'::jsonb then
      if jsonb_typeof(v_x) = 'null' then v_moi.han_dung_ngay := null;
      else
        v_t := btrim(v_x #>> '{}');
        if v_t ~ '^\d{1,4}$' and v_t::int between 1 and 3650 then v_moi.han_dung_ngay := v_t::int;
        else
          v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'han_dung_ngay',
                                               'cau', v_ten || ': hạn dùng là số ngày, từ 1 đến 3650.');
        end if;
      end if;
    end if;

    -- Mã cân (bỏ số 0 ở đầu)
    v_x := v_r->'ma_can';
    if v_x is not null and v_x <> '""'::jsonb then
      if jsonb_typeof(v_x) = 'null' then v_moi.ma_can := null;
      else
        v_t := ltrim(btrim(v_x #>> '{}'), '0');
        if v_t ~ '^[1-9][0-9]{0,5}$' then v_moi.ma_can := v_t;
        else
          v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'ma_can',
                                               'cau', v_ten || ': mã cân là dãy số (tối đa 6 số), đúng như mã hàng cài trên cân.');
        end if;
      end if;
    end if;

    -- Quầy tối thiểu / tối đa (gói)
    v_x := v_r->'quay_toi_thieu_goi';
    if v_x is not null and v_x <> '""'::jsonb then
      if jsonb_typeof(v_x) = 'null' then v_moi.quay_toi_thieu_goi := null;
      else
        v_t := btrim(v_x #>> '{}');
        if v_t ~ '^\d{1,6}$' and v_t::int <= 100000 then v_moi.quay_toi_thieu_goi := v_t::int;
        else
          v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'quay_toi_thieu_goi',
                                               'cau', v_ten || ': số gói tối thiểu ở quầy là số nguyên, từ 0.');
        end if;
      end if;
    end if;
    v_x := v_r->'quay_toi_da_goi';
    if v_x is not null and v_x <> '""'::jsonb then
      if jsonb_typeof(v_x) = 'null' then v_moi.quay_toi_da_goi := null;
      else
        v_t := btrim(v_x #>> '{}');
        if v_t ~ '^\d{1,6}$' and v_t::int between 1 and 100000 then v_moi.quay_toi_da_goi := v_t::int;
        else
          v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'quay_toi_da_goi',
                                               'cau', v_ten || ': số gói tối đa ở quầy là số nguyên, từ 1.');
        end if;
      end if;
    end if;

    -- Tồn tối thiểu ở quầy (kg — món không đếm gói)
    v_x := v_r->'ton_toi_thieu_kg';
    if v_x is not null and v_x <> '""'::jsonb then
      if jsonb_typeof(v_x) = 'null' then v_moi.ton_toi_thieu_kg := null;
      else
        v_t := btrim(v_x #>> '{}');
        if v_t ~ '^\d{1,6}([.,]\d{1,3})?$' then v_moi.ton_toi_thieu_kg := replace(v_t, ',', '.')::numeric;
        else
          v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'ton_toi_thieu_kg',
                                               'cau', v_ten || ': tồn tối thiểu là số kg, ví dụ 2,5.');
        end if;
      end if;
    end if;

    -- Kho lạnh tối thiểu / tối đa (kg)
    v_x := v_r->'kho_toi_thieu_kg';
    if v_x is not null and v_x <> '""'::jsonb then
      if jsonb_typeof(v_x) = 'null' then v_moi.kho_toi_thieu_kg := null;
      else
        v_t := btrim(v_x #>> '{}');
        if v_t ~ '^\d{1,6}([.,]\d{1,3})?$' then v_moi.kho_toi_thieu_kg := replace(v_t, ',', '.')::numeric;
        else
          v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'kho_toi_thieu_kg',
                                               'cau', v_ten || ': mức tối thiểu kho lạnh là số kg, ví dụ 20 hoặc 12,5.');
        end if;
      end if;
    end if;
    v_x := v_r->'kho_toi_da_kg';
    if v_x is not null and v_x <> '""'::jsonb then
      if jsonb_typeof(v_x) = 'null' then v_moi.kho_toi_da_kg := null;
      else
        v_t := btrim(v_x #>> '{}');
        if v_t ~ '^\d{1,6}([.,]\d{1,3})?$' and replace(v_t, ',', '.')::numeric > 0 then
          v_moi.kho_toi_da_kg := replace(v_t, ',', '.')::numeric;
        else
          v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'kho_toi_da_kg',
                                               'cau', v_ten || ': mức tối đa kho lạnh là số kg lớn hơn 0 (bỏ trống nếu không dùng).');
        end if;
      end if;
    end if;

    -- Sau pha để ở
    v_x := v_r->'noi_de_sau_pha';
    if v_x is not null and v_x <> '""'::jsonb then
      if jsonb_typeof(v_x) = 'null' then v_moi.noi_de_sau_pha := null;
      elsif (v_x #>> '{}') in ('kho', 'quay') then v_moi.noi_de_sau_pha := v_x #>> '{}';
      else
        v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'noi_de_sau_pha',
                                             'cau', v_ten || ': sau pha để ở "kho" (kho lạnh) hoặc "quay" (quầy).');
      end if;
    end if;

    -- Đang dùng / ngưng dùng
    v_x := v_r->'dang_dung';
    if v_x is not null and v_x <> '""'::jsonb then
      if lower(v_x #>> '{}') in ('true', '1', 'co') then v_moi.dang_dung := true;
      elsif lower(v_x #>> '{}') in ('false', '0', 'khong') then v_moi.dang_dung := false;
      else
        v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'dang_dung',
                                             'cau', v_ten || ': chọn "Đang dùng" hoặc "Ngưng dùng".');
      end if;
    end if;

    -- Kiểm trên giá trị cuối (ô mới + ô giữ nguyên).
    if v_moi.quay_toi_thieu_goi is not null and v_moi.quay_toi_da_goi is not null
       and v_moi.quay_toi_thieu_goi > v_moi.quay_toi_da_goi then
      v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'quay_toi_da_goi',
                                           'cau', v_ten || ': số gói tối đa ở quầy phải từ ' || v_moi.quay_toi_thieu_goi
                                                  || ' (số gói tối thiểu) trở lên.');
    end if;
    if v_moi.kho_toi_thieu_kg is not null and v_moi.kho_toi_da_kg is not null
       and v_moi.kho_toi_thieu_kg > v_moi.kho_toi_da_kg then
      v_loi := v_loi || jsonb_build_object('dong', v_i, 'id', v_id, 'ten', v_ten, 'truong', 'kho_toi_da_kg',
                                           'cau', v_ten || ': mức tối thiểu kho lạnh không được lớn hơn mức tối đa.');
    end if;

    if row(v_moi.gia_ban_kg, v_moi.han_dung_ngay, v_moi.ma_can, v_moi.quay_toi_thieu_goi, v_moi.quay_toi_da_goi,
           v_moi.ton_toi_thieu_kg, v_moi.kho_toi_thieu_kg, v_moi.kho_toi_da_kg, v_moi.noi_de_sau_pha, v_moi.dang_dung)
       is not distinct from
       row(v_cu.gia_ban_kg, v_cu.han_dung_ngay, v_cu.ma_can, v_cu.quay_toi_thieu_goi, v_cu.quay_toi_da_goi,
           v_cu.ton_toi_thieu_kg, v_cu.kho_toi_thieu_kg, v_cu.kho_toi_da_kg, v_cu.noi_de_sau_pha, v_cu.dang_dung) then
      v_khong_doi := v_khong_doi + 1;
    else
      v_ds := v_ds || v_moi;
      if v_moi.ma_can is distinct from v_cu.ma_can or v_moi.dang_dung is distinct from v_cu.dang_dung then
        v_doi_can := v_doi_can || v_id;
      end if;
    end if;
  end loop;

  -- Mã cân trùng (trên trạng thái CUỐI): giữa các dòng sửa, và với món đang
  -- dùng không nằm trong lần lưu này.
  for v_moi in select * from unnest(v_ds) loop
    if v_moi.ma_can is null or not v_moi.dang_dung or not (v_moi.id = any(v_doi_can)) then
      continue;
    end if;
    select m.ten into v_trung
    from kho_mat_hang m
    where m.ma_can = v_moi.ma_can and m.dang_dung and m.id <> v_moi.id
      and not (m.id = any (select x.id from unnest(v_ds) x))
    limit 1;
    if v_trung is null then
      select x.ten into v_trung
      from unnest(v_ds) x
      where x.ma_can = v_moi.ma_can and x.dang_dung and x.id <> v_moi.id
      limit 1;
    end if;
    if v_trung is not null then
      v_loi := v_loi || jsonb_build_object(
        'dong', (select n::int from jsonb_array_elements(p_dong) with ordinality t(e, n)
                  where e->>'id' = v_moi.id::text limit 1),
        'id', v_moi.id, 'ten', v_moi.ten, 'truong', 'ma_can',
        'cau', v_moi.ten || ': mã cân ' || v_moi.ma_can || ' đang dùng cho "' || v_trung || '".');
      v_trung := null;
    end if;
  end loop;

  if jsonb_array_length(v_loi) > 0 then
    return jsonb_build_object('ok', false, 'so_dong_luu', 0, 'so_dong_khong_doi', 0, 'loi', v_loi,
      'cau', 'Chưa lưu món nào: ' || jsonb_array_length(v_loi) || ' ô cần sửa (xem chữ đỏ ở từng dòng).');
  end if;

  -- Ghi. Bỏ mã cân của các dòng đổi mã / đổi trạng thái trước, để đổi chéo mã
  -- cân giữa hai món không vấp chỉ mục duy nhất giữa chừng.
  if cardinality(v_doi_can) > 0 then
    update kho_mat_hang set ma_can = null where id = any(v_doi_can);
  end if;
  for v_moi in select * from unnest(v_ds) loop
    update kho_mat_hang
       set gia_ban_kg         = v_moi.gia_ban_kg,
           han_dung_ngay      = v_moi.han_dung_ngay,
           ma_can             = v_moi.ma_can,
           quay_toi_thieu_goi = v_moi.quay_toi_thieu_goi,
           quay_toi_da_goi    = v_moi.quay_toi_da_goi,
           ton_toi_thieu_kg   = round(v_moi.ton_toi_thieu_kg, 3),
           kho_toi_thieu_kg   = round(v_moi.kho_toi_thieu_kg, 3),
           kho_toi_da_kg      = round(v_moi.kho_toi_da_kg, 3),
           noi_de_sau_pha     = v_moi.noi_de_sau_pha,
           dang_dung          = v_moi.dang_dung
     where id = v_moi.id
    returning jsonb_build_object('id', id, 'phien_ban', updated_at) into v_x;
    v_ra := v_ra || v_x;
  end loop;

  return jsonb_build_object(
    'ok', true, 'so_dong_luu', cardinality(v_ds), 'so_dong_khong_doi', v_khong_doi, 'dong', v_ra,
    'cau', case when cardinality(v_ds) = 0 then 'Chưa đổi ô nào — không có gì để lưu.'
                else 'Đã lưu ' || cardinality(v_ds) || ' món.' end);
end;
$$;

comment on function kho_sua_nhanh_mat_hang is
  'Sửa nhiều mặt hàng một lần (danh_muc; 0041). p_dong [{id, phien_ban (updated_at), gia_ban_kg?, han_dung_ngay?, ma_can?, quay_toi_thieu_goi?, quay_toi_da_goi?, ton_toi_thieu_kg?, kho_toi_thieu_kg?, kho_toi_da_kg?, noi_de_sau_pha?, dang_dung?}] — ô vắng / "" = giữ, null = xóa. Tất cả hoặc không: lỗi thì trả {ok:false, loi:[{dong,id,ten,truong,cau}]} và không ghi gì; phiên bản khác updated_at = người khác vừa sửa. Không sửa giá vốn.';


-- =============================================================================
-- 2 · BÁO CÁO THEO THÁNG
-- =============================================================================
create or replace function kho_bao_cao_theo_thang(p_chi_nhanh_id uuid, p_nam int)
returns table (
  thang int, tu date, den date,
  ton_dau_kg numeric, ton_dau_tien bigint,
  nhap_kg numeric, nhap_tien bigint,
  ban_kg numeric, ban_tien bigint,
  xuat_bep_kg numeric, xuat_bep_tien bigint,
  xuat_khac_kg numeric, xuat_khac_tien bigint,
  tra_ncc_kg numeric, tra_ncc_tien bigint,
  huy_kg numeric, huy_tien bigint,
  hao_hut_kg numeric, hao_hut_tien bigint,
  pha_mat_kg numeric, pha_mat_tien bigint,
  ton_cuoi_kg numeric, ton_cuoi_tien bigint,
  chi_phi_thit bigint,
  co_ipos boolean, doanh_thu bigint, chi_phi_tren_doanh_thu_pt numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gia boolean;
  v_dau date;
  v_cuoi date;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';
  end if;
  if p_nam is null or p_nam < 2000 or p_nam > 2100 then
    raise exception 'Chọn năm (ví dụ 2026)' using errcode = 'check_violation';
  end if;
  v_gia  := kho_duoc(p_chi_nhanh_id, 'xem_gia');
  v_dau  := make_date(p_nam, 1, 1);
  v_cuoi := make_date(p_nam, 12, 31);

  return query
  with thang_ds as (
    select g.t::int as t, make_date(p_nam, g.t::int, 1) as tu,
           (make_date(p_nam, g.t::int, 1) + interval '1 month' - interval '1 day')::date as den
    from generate_series(1, 12) g(t)
    where make_date(p_nam, g.t::int, 1) <= hom_nay_vn()
  ),
  dong as (
    select s.ngay, s.so_kg, coalesce(g.loai, s.loai) as loai,
           s.so_kg * coalesce(lg.gia_von_kg, 0) as gt
    from kho_so_cai s
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_lo_gia lg on lg.lo_id = s.lo_id
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay <= v_cuoi
  ),
  truoc as (
    select coalesce(sum(d.so_kg), 0) as kg, coalesce(sum(d.gt), 0) as gt
    from dong d where d.ngay < v_dau
  ),
  gom as (
    select extract(month from d.ngay)::int as t,
      coalesce(sum(d.so_kg), 0) as tong_kg,
      coalesce(sum(d.gt), 0)    as tong_gt,
      coalesce(sum(d.so_kg) filter (where d.loai = 'nhap'), 0) as nhap_kg,
      coalesce(sum(d.gt)    filter (where d.loai = 'nhap'), 0) as nhap_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai = 'ban'), 0) as ban_kg,
      -coalesce(sum(d.gt)    filter (where d.loai = 'ban'), 0) as ban_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai = 'xuat_bep'), 0) as bep_kg,
      -coalesce(sum(d.gt)    filter (where d.loai = 'xuat_bep'), 0) as bep_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai = 'xuat_khac'), 0) as khac_kg,
      -coalesce(sum(d.gt)    filter (where d.loai = 'xuat_khac'), 0) as khac_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai = 'tra_ncc'), 0) as tra_kg,
      -coalesce(sum(d.gt)    filter (where d.loai = 'tra_ncc'), 0) as tra_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai = 'huy'), 0) as huy_kg,
      -coalesce(sum(d.gt)    filter (where d.loai = 'huy'), 0) as huy_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai in ('hao_hut', 'kiem_ke')), 0) as hh_kg,
      -coalesce(sum(d.gt)    filter (where d.loai in ('hao_hut', 'kiem_ke')), 0) as hh_gt,
      -coalesce(sum(d.so_kg) filter (where d.loai in ('pha_loc_vao', 'pha_loc_ra')), 0) as pha_kg,
      -coalesce(sum(d.gt)    filter (where d.loai in ('pha_loc_vao', 'pha_loc_ra')), 0) as pha_gt
    from dong d
    where d.ngay >= v_dau
    group by 1
  ),
  ipos as (
    select extract(month from ((i.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date)::int as t,
           coalesce(sum(i.thanh_tien), 0) as dt
    from kho_ipos_dong i
    where i.chi_nhanh_id = p_chi_nhanh_id and i.trang_thai <> 'da_huy'
      and ((i.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date between v_dau and v_cuoi
    group by 1
  ),
  noi as (
    select k.t, k.tu, k.den,
           (select tr.kg from truoc tr) + coalesce((select sum(g2.tong_kg) from gom g2 where g2.t < k.t), 0) as dau_kg,
           (select tr.gt from truoc tr) + coalesce((select sum(g2.tong_gt) from gom g2 where g2.t < k.t), 0) as dau_gt,
           coalesce(g.tong_kg, 0) as tong_kg, coalesce(g.tong_gt, 0) as tong_gt,
           coalesce(g.nhap_kg, 0) as nhap_kg, coalesce(g.nhap_gt, 0) as nhap_gt,
           coalesce(g.ban_kg, 0) as ban_kg, coalesce(g.ban_gt, 0) as ban_gt,
           coalesce(g.bep_kg, 0) as bep_kg, coalesce(g.bep_gt, 0) as bep_gt,
           coalesce(g.khac_kg, 0) as khac_kg, coalesce(g.khac_gt, 0) as khac_gt,
           coalesce(g.tra_kg, 0) as tra_kg, coalesce(g.tra_gt, 0) as tra_gt,
           coalesce(g.huy_kg, 0) as huy_kg, coalesce(g.huy_gt, 0) as huy_gt,
           coalesce(g.hh_kg, 0) as hh_kg, coalesce(g.hh_gt, 0) as hh_gt,
           coalesce(g.pha_kg, 0) as pha_kg, coalesce(g.pha_gt, 0) as pha_gt,
           ip.t is not null as co_ipos, ip.dt
    from thang_ds k
    left join gom g on g.t = k.t
    left join ipos ip on ip.t = k.t
  )
  select n.t, n.tu, n.den,
         round(n.dau_kg, 3), case when v_gia then round(n.dau_gt)::bigint end,
         round(n.nhap_kg, 3), case when v_gia then round(n.nhap_gt)::bigint end,
         round(n.ban_kg, 3),  case when v_gia then round(n.ban_gt)::bigint end,
         round(n.bep_kg, 3),  case when v_gia then round(n.bep_gt)::bigint end,
         round(n.khac_kg, 3), case when v_gia then round(n.khac_gt)::bigint end,
         round(n.tra_kg, 3),  case when v_gia then round(n.tra_gt)::bigint end,
         round(n.huy_kg, 3),  case when v_gia then round(n.huy_gt)::bigint end,
         round(n.hh_kg, 3),   case when v_gia then round(n.hh_gt)::bigint end,
         round(n.pha_kg, 3),  case when v_gia then round(n.pha_gt)::bigint end,
         round(n.dau_kg + n.tong_kg, 3), case when v_gia then round(n.dau_gt + n.tong_gt)::bigint end,
         case when v_gia then round(n.ban_gt + n.bep_gt + n.khac_gt + n.huy_gt + n.hh_gt)::bigint end,
         n.co_ipos,
         case when v_gia and n.co_ipos then n.dt::bigint end,
         case when v_gia and n.co_ipos and n.dt > 0
              then round((n.ban_gt + n.bep_gt + n.khac_gt + n.huy_gt + n.hh_gt) / n.dt * 100, 1) end
  from noi n
  order by n.t;
end;
$$;

comment on function kho_bao_cao_theo_thang is
  'Báo cáo theo tháng của một năm (xem; 0041): mỗi tháng đã bắt đầu một dòng — tồn đầu, nhập, bán, xuất bếp, xuất khác, trả NCC, hủy, hao hụt (mất khi mang ra quầy + kiểm kê thiếu trừ thừa), pha mất (tảng đem pha − thịt pha ra), tồn cuối (kg và tiền theo giá vốn lô); chi_phi_thit = bán + xuất bếp + xuất khác + hủy + hao hụt; doanh_thu = dòng hóa đơn iPOS (trừ đã hủy), co_ipos; chi_phi_tren_doanh_thu_pt. Mọi cột tiền chỉ vai xem_gia, không thì null.';


-- =============================================================================
-- 3 · MUA HÀNG THEO NCC / MẶT HÀNG
-- =============================================================================
create or replace function kho_bao_cao_mua_hang(p_chi_nhanh_id uuid, p_tu date, p_den date, p_nhom text)
returns table (
  nhom text, id uuid, ma text, ten text,
  so_phieu int, so_ncc int, so_mat_hang int,
  so_kg numeric, so_goi int,
  tien_hang bigint, tien_thue bigint, chi_phi_khac bigint, tong_tien bigint,
  gia_tb_kg bigint, gia_thap_kg bigint, gia_cao_kg bigint,
  ty_trong_pt numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tong numeric;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem_gia') then
    raise exception 'Tài khoản của bạn không xem được báo cáo mua hàng (có giá tiền)' using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 366 then
    raise exception 'Khoảng ngày tối đa 1 năm' using errcode = 'check_violation';
  end if;
  if p_nhom is null or p_nhom not in ('ncc', 'mat_hang') then
    raise exception 'Chọn xem theo nhà cung cấp hoặc theo mặt hàng' using errcode = 'check_violation';
  end if;

  select coalesce(sum(d.thanh_tien), 0) into v_tong
  from kho_phieu_nhap p
  join kho_phieu_nhap_dong d on d.phieu_nhap_id = p.id
  where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
    and p.ngay_nhap between p_tu and p_den;

  if p_nhom = 'ncc' then
    return query
    with pn as (
      select p.id, p.nha_cung_cap_id as ncc, p.tien_thue, p.chi_phi_khac, p.tien_hoa_don,
             (select coalesce(sum(d.thanh_tien), 0) from kho_phieu_nhap_dong d where d.phieu_nhap_id = p.id) as tien_hang,
             (select coalesce(sum(d.so_kg), 0) from kho_phieu_nhap_dong d where d.phieu_nhap_id = p.id) as kg,
             (select coalesce(sum(d.so_goi), 0) from kho_phieu_nhap_dong d where d.phieu_nhap_id = p.id) as goi
      from kho_phieu_nhap p
      where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
        and p.ngay_nhap between p_tu and p_den
    ),
    mh as (
      select p.nha_cung_cap_id as ncc, count(distinct d.mat_hang_id)::int as so_mh
      from kho_phieu_nhap p
      join kho_phieu_nhap_dong d on d.phieu_nhap_id = p.id
      where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
        and p.ngay_nhap between p_tu and p_den
      group by p.nha_cung_cap_id
    ),
    g as (
      select pn.ncc, count(*)::int as so_phieu, sum(pn.kg) as kg, sum(pn.goi)::int as goi,
             sum(pn.tien_hang) as tien_hang, sum(pn.tien_thue) as thue, sum(pn.chi_phi_khac) as cp,
             sum(coalesce(pn.tien_hoa_don, pn.tien_hang + pn.tien_thue + pn.chi_phi_khac)) as tong
      from pn group by pn.ncc
    )
    select 'ncc'::text, g.ncc, n.ma_misa, coalesce(n.ten, 'Không ghi nhà cung cấp'),
           g.so_phieu, null::int, coalesce(mh.so_mh, 0),
           round(g.kg, 3), g.goi,
           g.tien_hang::bigint, g.thue::bigint, g.cp::bigint, g.tong::bigint,
           case when g.kg > 0 then round(g.tien_hang / g.kg)::bigint end,
           null::bigint, null::bigint,
           case when v_tong > 0 then round(g.tien_hang * 100 / v_tong, 1) end
    from g
    left join kho_nha_cung_cap n on n.id = g.ncc
    left join mh on mh.ncc is not distinct from g.ncc
    order by g.tien_hang desc, n.ten;
  else
    return query
    select 'mat_hang'::text, m.id, m.ma, m.ten,
           count(distinct p.id)::int, count(distinct p.nha_cung_cap_id)::int, null::int,
           round(sum(d.so_kg), 3), sum(d.so_goi)::int,
           sum(d.thanh_tien)::bigint, null::bigint, null::bigint, null::bigint,
           case when sum(d.so_kg) > 0 then round(sum(d.thanh_tien) / sum(d.so_kg))::bigint end,
           min(d.don_gia_kg)::bigint, max(d.don_gia_kg)::bigint,
           case when v_tong > 0 then round(sum(d.thanh_tien) * 100 / v_tong, 1) end
    from kho_phieu_nhap p
    join kho_phieu_nhap_dong d on d.phieu_nhap_id = p.id
    join kho_mat_hang m on m.id = d.mat_hang_id
    where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
      and p.ngay_nhap between p_tu and p_den
    group by m.id, m.ma, m.ten, m.loai, m.thu_tu
    order by sum(d.thanh_tien) desc, m.loai, m.thu_tu, m.ten;
  end if;
end;
$$;

comment on function kho_bao_cao_mua_hang is
  'Mua hàng trong kỳ (xem_gia; 0041): phiếu nhập mua đã duyệt theo ngày nhập. p_nhom ncc: số phiếu, số mặt hàng, kg, gói, tiền hàng, thuế, chi phí khác, tong_tien (tiền hóa đơn nếu đã đối chiếu, không thì tổng phiếu), giá TB/kg, tỷ trọng %. p_nhom mat_hang: số phiếu, số NCC, kg, gói, tiền hàng, giá TB / thấp / cao một kg, tỷ trọng % (thuế, chi phí, tong_tien null).';


-- =============================================================================
-- 4 · SỔ THANH TOÁN
-- =============================================================================
create or replace function kho_so_thanh_toan(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  id uuid, ngay date, so_phieu text, loai text, ten_loai text, hinh_thuc text, ten_hinh_thuc text,
  nha_cung_cap_id uuid, ten_nha_cung_cap text,
  so_tien bigint, tien_ra bigint, tien_vao bigint, giam_no bigint,
  trang_thai text, ly_do_huy text, ghi_chu text,
  phieu_nhap text, phieu_xuat text, nguoi_ghi text, ghi_luc timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    raise exception 'Tài khoản của bạn không xem được sổ thanh toán' using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 366 then
    raise exception 'Khoảng ngày tối đa 1 năm' using errcode = 'check_violation';
  end if;

  return query
  select t.id, t.ngay, t.so_phieu, t.loai,
         case t.loai when 'thanh_toan' then 'Trả tiền' when 'giam_tru' then 'Giảm trừ'
                     when 'bu_tru' then 'Bù trừ' when 'hoan_tien' then 'NCC hoàn tiền' else t.loai end,
         t.hinh_thuc,
         case t.hinh_thuc when 'chuyen_khoan' then 'Chuyển khoản' when 'tien_mat' then 'Tiền mặt'
                          when 'khac' then 'Khác' end,
         t.nha_cung_cap_id, n.ten,
         t.so_tien,
         case when t.trang_thai = 'hieu_luc' and t.loai = 'thanh_toan' then t.so_tien else 0 end,
         case when t.trang_thai = 'hieu_luc' and t.loai = 'hoan_tien' then t.so_tien else 0 end,
         case when t.trang_thai <> 'hieu_luc' then 0
              when t.loai = 'hoan_tien' then -t.so_tien else t.so_tien end,
         t.trang_thai, t.ly_do_huy, t.ghi_chu,
         (select string_agg(distinct p.so_phieu, ', ' order by p.so_phieu)
            from kho_thanh_toan_phan_bo pb join kho_phieu_nhap p on p.id = pb.phieu_nhap_id
           where pb.thanh_toan_id = t.id),
         x.so_phieu, ns.ho_ten, t.created_at
  from kho_thanh_toan t
  join kho_nha_cung_cap n on n.id = t.nha_cung_cap_id
  left join kho_phieu_xuat x on x.id = t.phieu_xuat_id
  left join nhan_su ns on ns.id = t.nguoi_tao
  where t.chi_nhanh_id = p_chi_nhanh_id and t.ngay between p_tu and p_den
  order by t.ngay, t.created_at, t.so_phieu;
end;
$$;

comment on function kho_so_thanh_toan is
  'Sổ thanh toán nhà cung cấp trong kỳ (ke_toan; 0041): mọi khoản trả tiền / giảm trừ / bù trừ / NCC hoàn tiền theo ngày, cả khoản đã hủy (tiền = 0). tien_ra = tiền rời quán, tien_vao = NCC trả lại, giam_no = làm giảm công nợ (hoàn tiền: âm). Kèm tên loại, cách trả, NCC, các phiếu nhập được chia, phiếu trả hàng, người ghi.';


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
