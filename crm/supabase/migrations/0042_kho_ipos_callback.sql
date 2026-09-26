-- =============================================================================
-- BEEFTOWN KHO — 0042 · iPOS TỰ ĐẨY HÓA ĐƠN SANG (callback) (GĐ7c)
-- =============================================================================
-- Tài liệu thật của iPOS (Postman "IPOS HUB API INTERGRATION FOR MERCHANT")
-- khác giả định của 0037:
--   · KHÔNG có API kéo danh sách hóa đơn. Thu ngân in hóa đơn → iPOS Hub POST
--     Event 11 "sale_manager" tới callback_url của mình. Hub có thể bắn trùng:
--     chống trùng theo (pos_parent, pos_id, tran_id) — web ghép ma_hd =
--     "<pos_id>:<tran_id>", unique (chi nhánh, ma_hd) + băm như 0037.
--   · Dòng hàng KHÔNG có mã vạch, KHÔNG có kg từng nhãn: chỉ item_id + quantity.
--     Hai dòng cùng item_id là hai dòng riêng (khoa_dong = chỉ số dòng).
--   · API kéo được: danh mục món (/v2/items) → kho_ipos_menu (gợi ý ghép món).
--
-- BẢNG (thêm cột, không đổi cột cũ)
--   kho_ipos_ma_hang.don_vi_ban   kg | goi | suat | null (null = theo món kho:
--                                 món đếm gói → gói, món theo kg → kg)
--                    kg_moi_don_vi mỗi gói bán = X kg (chỉ khi goi, món kho
--                                 tính theo kg mà iPOS bán theo gói)
--   kho_ipos_dong.so_luong        quantity gốc của iPOS
--   kho_ipos_cau_hinh.nhan_hd_luc   lần cuối nhận được hóa đơn
--                    .hop_thu_luc   lần cuối hộp thư được xử lý xong (callback
--                                   hoặc lượt thử lại hàng chờ)
--                    .gio_mat_ket_noi (mặc định 3) · menu_luc · menu_can_lam_moi
--   kho_ipos_lan_chay.nguon       thêm 'callback'
--   kho_ipos_menu (mới)           danh mục món iPOS — không giá bán
--
-- GHI MỘT DÒNG CÓ so_luong (không nhãn cân) — thay thân kho_ipos_ghi_dong:
--   · suat (kiểu bo_qua): món chế biến → bo_qua, không trừ kho; GĐ7b đếm suất
--     từ so_luong (kho_dinh_muc_ban thay thân: so_luong trước so_goi / so_kg).
--   · kg : kg bán = so_luong. Món đếm gói → số gói NGUYÊN lấy theo FEFO sao
--     cho tổng kg sổ gần kg bán nhất (kho_ipos_goi_theo_kg); lệch → hao_hut
--     như lệch kg nhãn (0037).
--   · goi: số gói = so_luong (phải nguyên). Món theo kg → kg = so_luong ×
--     kg_moi_don_vi (thiếu → 'loi', nhắc điền ở Ghép món).
--   · so_kg / so_goi của dòng do database suy ra lại mỗi lần thử (ghi đè).
--   Không bao giờ chặn bán: thiếu hàng → thieu_hang, lỗi → loi, như 0037.
--
-- NHẬN CALLBACK — kho_ipos_nhan_callback(cn, hóa đơn | [hóa đơn] | [])
--   [dong_bo_ban]. Không khóa lượt, không giới hạn 60 giây: nhiều callback song
--   song xếp hàng trên khóa hàng kho_cai_dat (như mọi hàm ghi sổ) + unique mã
--   HĐ. Luôn cất vào hộp thư (không mất một lần bán); chỉ ghi sổ khi kết nối
--   đang bật. [] = thử lại hàng chờ. kho_ipos_bat_dau(cn, 'callback') cũng được
--   (không khóa, không 60 giây) cho ai muốn dùng bat_dau → nhan → ket_thuc.
--   kho_ipos_tim_chi_nhanh(pos_parent, pos_id): máy may_ipos không đọc bảng nào
--   nên tìm chi nhánh qua hàm này. kho_ipos_luu_menu / kho_ipos_bao_menu_doi:
--   lưu danh mục món, Event 12 item_changed đặt cờ "thực đơn cần làm mới".
--
-- QUYẾT ĐỊNH — "đồng bộ trễ" khi iPOS đẩy
--   Không có hóa đơn ≠ mất kết nối (quán vắng khách). Nên:
--   · kho_gui_kiem_ke: bỏ điều kiện watermark (dong_bo_den_luc); chặn khi hộp
--     thư chưa được xử lý trong 10 phút (hop_thu_luc — cron 5 phút một lần thử
--     lại hàng chờ, callback cũng cập nhật). Lỗi đọc thực đơn KHÔNG chặn đếm.
--   · ipos_mat_ket_noi: lượt cuối lỗi (loi_tu_luc), hoặc TRONG giờ mở cửa mà
--     quá gio_mat_ket_noi giờ không nhận hóa đơn nào (tính từ giờ mở cửa hôm
--     nay, không tính đêm qua).
--   · Không cần "đường dẫn lấy hóa đơn" nữa (cột giữ nguyên, không bắt buộc).
--
-- raw hóa đơn: lưới thứ hai ở database bỏ mọi khóa thông tin khách
-- (membership_*, customer*, delivery*, payment*, sale_note, phone, email,
-- address…) ở mọi tầng — web đã bỏ trước (kho_ipos_bo_pii).
-- =============================================================================


-- =============================================================================
-- 1 · BẢNG
-- =============================================================================
alter table kho_ipos_ma_hang
  add column don_vi_ban    text,
  add column kg_moi_don_vi numeric(10,3);

alter table kho_ipos_ma_hang
  add constraint kho_ipos_ma_hang_don_vi_hop_le check (
    (don_vi_ban is null or don_vi_ban in ('kg', 'goi', 'suat'))
    and (don_vi_ban is distinct from 'suat' or (kieu = 'bo_qua' and mat_hang_id is null))
    and (kg_moi_don_vi is null or (don_vi_ban = 'goi' and kg_moi_don_vi > 0 and kg_moi_don_vi <= 1000)));

comment on column kho_ipos_ma_hang.don_vi_ban is
  'Món iPOS bán theo (0042): kg = quantity là số kg; goi = quantity là số gói; suat = món chế biến (kiểu bo_qua), không trừ kho, chỉ đếm suất cho định mức; null = theo món kho (đếm gói → gói, theo kg → kg).';
comment on column kho_ipos_ma_hang.kg_moi_don_vi is
  'Mỗi gói bán trên iPOS = bao nhiêu kg (0042). Chỉ dùng khi bán theo gói mà món kho tính theo kg.';

alter table kho_ipos_dong
  add column so_luong numeric(12,3);

alter table kho_ipos_dong
  add constraint kho_ipos_dong_so_luong_hop_le check (so_luong is null or so_luong >= 0);

comment on column kho_ipos_dong.so_luong is
  'Số lượng gốc iPOS gửi (quantity, 0042). Có so_luong mà không nhãn cân → so_kg / so_goi do database suy ra theo "bán theo" của mã món.';

alter table kho_ipos_cau_hinh
  add column nhan_hd_luc      timestamptz,
  add column hop_thu_luc      timestamptz,
  add column gio_mat_ket_noi  smallint not null default 3,
  add column menu_luc         timestamptz,
  add column menu_can_lam_moi boolean not null default false;

alter table kho_ipos_cau_hinh
  add constraint kho_ipos_cau_hinh_gio_mat_hop_le check (gio_mat_ket_noi between 1 and 12);

comment on column kho_ipos_cau_hinh.nhan_hd_luc is 'Lần cuối nhận được hóa đơn iPOS (callback hoặc lượt đồng bộ) (0042).';
comment on column kho_ipos_cau_hinh.hop_thu_luc is
  'Lần cuối hộp thư hóa đơn được xử lý xong — callback hoặc lượt thử lại hàng chờ (0042). Đếm quầy chỉ gửi được khi mốc này mới hơn 10 phút.';
comment on column kho_ipos_cau_hinh.gio_mat_ket_noi is
  'Trong giờ mở cửa, quá bấy nhiêu giờ không nhận hóa đơn nào thì báo mất kết nối iPOS (0042, mặc định 3).';
comment on column kho_ipos_cau_hinh.menu_luc is 'Lần cuối đọc được danh mục món iPOS (/v2/items) (0042).';
comment on column kho_ipos_cau_hinh.menu_can_lam_moi is 'iPOS báo thực đơn đổi (Event 12 item_changed) — lượt cron kế tiếp đọc lại (0042).';

alter table kho_ipos_lan_chay drop constraint kho_ipos_lan_chay_nguon_hop_le;
alter table kho_ipos_lan_chay
  add constraint kho_ipos_lan_chay_nguon_hop_le check (nguon in ('cron', 'tay', 'callback'));

comment on table kho_ipos_lan_chay is
  'Nhật ký lượt đồng bộ iPOS (0037): nguồn cron | tay | callback (0042), người, số HĐ / dòng, lỗi ngắn (đã xóa token).';

-- Danh mục món iPOS (đọc từ /v2/items). KHÔNG giá bán: thủ kho / NV quầy đọc được.
create table kho_ipos_menu (
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete cascade,
  ma_ipos      text not null,
  ten_ipos     text,
  loai         text,
  dang_ban     boolean not null default true,
  cap_nhat_luc timestamptz not null default now(),

  primary key (chi_nhanh_id, ma_ipos),
  constraint kho_ipos_menu_ma_hop_le check (btrim(ma_ipos) = ma_ipos and ma_ipos <> '' and char_length(ma_ipos) <= 100),
  constraint kho_ipos_menu_ten_ngan check (
    (ten_ipos is null or char_length(ten_ipos) <= 200) and (loai is null or char_length(loai) <= 100))
);

comment on table kho_ipos_menu is
  'Danh mục món trên iPOS của chi nhánh (0042), đọc từ /v2/items mỗi giờ hoặc khi iPOS báo thực đơn đổi. Chỉ mã, tên, nhóm, còn bán — không giá. Ghi qua kho_ipos_luu_menu.';

alter table kho_ipos_menu enable row level security;
create policy kho_ipos_menu_doc on kho_ipos_menu
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));

-- Thêm so_luong vào cuối view (giữ nguyên các cột cũ).
create or replace view kho_v_ipos_dong with (security_invoker = true) as
  select d.id, d.chi_nhanh_id, d.hoa_don_id, h.ma_hd, h.da_huy as hd_da_huy, d.khoa_dong,
         d.thoi_diem_ban, ((d.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date as ngay_ban,
         d.ma_ipos, d.ten_ipos, d.ma_vach, d.ma_can, d.so_kg, d.so_goi, d.thanh_tien,
         d.mat_hang_id, m.ma as ma_mat_hang, m.ten as ten_mat_hang, m.dem_goi, m.don_vi_goi,
         d.trang_thai, d.so_lan_thu, d.ly_do, d.lo_het_han, d.ghi_luc, d.xu_ly_boi, d.xu_ly_luc,
         d.created_at, d.updated_at, d.so_luong
  from kho_ipos_dong d
  join kho_ipos_hoa_don h on h.id = d.hoa_don_id
  left join kho_mat_hang m on m.id = d.mat_hang_id;

comment on view kho_v_ipos_dong is
  'Dòng bán iPOS kèm mã HĐ, tên món kho, ngày bán giờ VN (0037), số lượng gốc (0042). security_invoker: vai không xem_gia không thấy dòng nào.';


-- =============================================================================
-- 2 · HÀM NỘI BỘ MỚI
-- =============================================================================

-- Bỏ mọi khóa thông tin khách ở mọi tầng của raw hóa đơn.
create or replace function kho_ipos_bo_pii(p jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
begin
  if p is null then
    return null;
  elsif jsonb_typeof(p) = 'object' then
    return coalesce((
      select jsonb_object_agg(e.key, kho_ipos_bo_pii(e.value))
      from jsonb_each(p) e
      where e.key !~* '^(membership|member_|customer|khach|delivery|payment|sale_note|note|ghi_chu|phone|mobile|tel|email|address|dia_chi|sdt|so_dien_thoai|user_)'),
      '{}'::jsonb);
  elsif jsonb_typeof(p) = 'array' then
    return coalesce((
      select jsonb_agg(kho_ipos_bo_pii(a.value) order by a.i)
      from jsonb_array_elements(p) with ordinality a(value, i)), '[]'::jsonb);
  end if;
  return p;
end;
$$;

comment on function kho_ipos_bo_pii is
  'NỘI BỘ (0042). Bỏ các khóa thông tin khách (membership_*, customer*, delivery*, payment*, sale_note, phone, email, address…) ở mọi tầng của JSON hóa đơn trước khi lưu raw.';

-- Món đếm gói mà iPOS bán theo kg: bao nhiêu gói NGUYÊN ở quầy (thứ tự như
-- kho_ipos_lay_lo: lô còn hạn theo FEFO, rồi lô hết hạn) cho tổng kg sổ gần kg
-- bán nhất (ít nhất 1). Quầy không đủ → trả số lớn hơn số gói đang có (để
-- kho_ipos_lay_lo báo thiếu). Không ghi gì.
create or replace function kho_ipos_goi_theo_kg(p_vi_tri_id uuid, p_mat_hang_id uuid, p_kg numeric)
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_r    record;
  v_k    numeric;
  v_tb   numeric;
  v_cum  numeric := 0;
  v_prev numeric := 0;
  v_n    int := 0;
begin
  if p_kg is null or p_kg <= 0 then
    return null;
  end if;
  for v_r in
    select t.so_kg, t.so_goi
    from kho_ton t join kho_lo l on l.id = t.lo_id
    where t.vi_tri_id = p_vi_tri_id and t.mat_hang_id = p_mat_hang_id and t.so_goi > 0
    order by (l.han_dung < hom_nay_vn()), l.han_dung, l.created_at, l.id
  loop
    v_k := v_r.so_kg / v_r.so_goi;
    v_tb := v_k;
    for i in 1 .. v_r.so_goi loop
      v_prev := v_cum;
      v_cum := v_cum + v_k;
      v_n := v_n + 1;
      if v_cum >= p_kg - 0.0005 then
        if v_n > 1 and (p_kg - v_prev) < (v_cum - p_kg) then
          return v_n - 1;
        end if;
        return v_n;
      end if;
    end loop;
  end loop;
  return v_n + greatest(1, ceil((p_kg - v_cum) / coalesce(nullif(v_tb, 0), p_kg)))::int;
end;
$$;

comment on function kho_ipos_goi_theo_kg is
  'NỘI BỘ (0042). Món đếm gói bán theo kg trên iPOS: số gói nguyên ở quầy (còn hạn trước, FEFO) có tổng kg sổ gần kg bán nhất. Quầy không đủ → số lớn hơn số gói đang có.';

-- Mốc tính "lâu không nhận hóa đơn": hóa đơn cuối, nhưng không sớm hơn giờ mở
-- cửa hôm nay (đêm qua quán đóng — không tính).
create or replace function kho_ipos_moc_nhan(p_c kho_ipos_cau_hinh)
returns timestamptz
language sql
stable
set search_path = public
as $$
  select greatest(coalesce(p_c.nhan_hd_luc, p_c.bat_luc, p_c.updated_at),
                  kho_luc_vn(hom_nay_vn(), p_c.gio_mo_cua))
$$;

comment on function kho_ipos_moc_nhan is
  'NỘI BỘ (0042). Mốc tính "lâu không nhận hóa đơn iPOS": hóa đơn cuối nhận được, không sớm hơn giờ mở cửa hôm nay.';


-- =============================================================================
-- 3 · GHI MỘT DÒNG — thay THÂN kho_ipos_ghi_dong (cùng chữ ký), chép 0037
-- =============================================================================
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

    if v_mp.kieu = 'mon' or (v_mp.kieu = 'goi_can' and v_mp.mat_hang_id is not null) then
      select * into v_mh from kho_mat_hang where id = v_mp.mat_hang_id;
    elsif v_ma is not null then
      select * into v_mh from kho_mat_hang where ma_can = v_ma and dang_dung;
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

    -- ---- 0042 · Dòng chỉ có số lượng iPOS (không nhãn cân) ------------------
    v_tu_sl := v_d.so_luong is not null and v_d.ma_vach is null and v_d.ma_can is null;
    if v_tu_sl then
      v_dv := coalesce(v_mp.don_vi_ban, case when v_mh.dem_goi then 'goi' else 'kg' end);
      if v_d.so_luong <= 0 then
        raise exception 'Số lượng bán trên iPOS phải lớn hơn 0';
      end if;
      if v_dv = 'kg' then
        v_kg := v_d.so_luong;
        if v_mh.dem_goi then
          v_goi := kho_ipos_goi_theo_kg(v_c.vi_tri_ban_id, v_mh.id, v_kg);
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
    v_pb := kho_ipos_lay_lo(v_c.vi_tri_ban_id, v_mh.id, v_goi, v_kg);
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
          v_goi := kho_ipos_goi_theo_kg(v_c.vi_tri_ban_id, v_mh.id, v_kg);
        end if;
        v_pb := kho_ipos_lay_lo(v_c.vi_tri_ban_id, v_mh.id, v_goi, v_kg);
        exit when v_pb is not null;
      end loop;
    end if;
    if v_pb is null then
      update kho_ipos_dong set trang_thai = 'thieu_hang', so_lan_thu = so_lan_thu + 1,
        mat_hang_id = v_mh.id, ma_can = coalesce(ma_can, v_ma),
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
      ly_do = case when (v_pb ->> 'het_han')::boolean then 'Đã bán gói thuộc lô HẾT HẠN' end
    where id = p_id;
    return 'da_ghi';
  exception when others then
    update kho_ipos_dong set trang_thai = 'loi', so_lan_thu = so_lan_thu + 1, ly_do = left(sqlerrm, 300)
    where id = p_id;
    return 'loi';
  end;
end;
$$;

comment on function kho_ipos_ghi_dong is
  'NỘI BỘ (0037, 0042). Trừ kho một dòng bán iPOS: khớp món (ghép mã → mã cân), số lượng (nhãn cân, hoặc so_luong theo "bán theo" kg | goi | suat của mã món — suat = món chế biến, bỏ qua), FEFO ở quầy bán (còn hạn trước), hao_hut lệch kg rồi ban, ngày = ngày bán giờ VN; thiếu thì tự nhận hàng đang mang ra quầy. Không bao giờ raise: lỗi → loi.';

-- Mất kết nối (0042): lượt cuối lỗi, hoặc trong giờ mở cửa quá gio_mat_ket_noi
-- giờ không nhận hóa đơn nào.
create or replace function kho_ipos_mat_ket_noi(p_c kho_ipos_cau_hinh)
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(p_c.bat, false) and (
    p_c.loi_tu_luc is not null
    or (extract(hour from bay_gio_vn()) >= p_c.gio_mo_cua
        and extract(hour from bay_gio_vn()) < p_c.gio_dong_cua
        and kho_ipos_moc_nhan(p_c) < now() - make_interval(hours => p_c.gio_mat_ket_noi)))
$$;

comment on function kho_ipos_mat_ket_noi is
  'NỘI BỘ (0037, 0042). Đồng bộ iPOS đang bật mà lượt cuối lỗi (thử lại hàng chờ / đọc thực đơn), hoặc trong giờ mở cửa đã quá gio_mat_ket_noi giờ (tính từ giờ mở cửa hôm nay) không nhận hóa đơn nào.';


-- =============================================================================
-- 4 · NHẬN HÓA ĐƠN — lõi chung, lượt (0037), callback (0042)
-- =============================================================================
-- Lõi: hộp thư + ghi sổ. NỘI BỘ — người gọi đã kiểm quyền và khóa kho_cai_dat
-- rồi kho_ipos_cau_hinh. p_hoa_don: mảng ≤ 200 HĐ, mỗi HĐ
--   {ma_hd, thoi_diem_ban, da_huy?, raw?, dong: [
--     {khoa_dong?, ma_ipos?, ten_ipos?, ma_vach?, ma_can?, so_kg?, so_goi?, so_luong?, thanh_tien?}]}
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

      select * into v_h from kho_ipos_hoa_don where chi_nhanh_id = p_chi_nhanh_id and ma_hd = v_ma for update;
      if found and v_h.bam = v_bam then
        v_trung := v_trung + 1;
        continue;
      end if;

      if found then
        -- HĐ sửa / hủy trên iPOS: đảo mọi dòng đã ghi rồi ghi lại theo nội dung mới.
        perform kho_ipos_dao_dong(d.id) from kho_ipos_dong d where d.hoa_don_id = v_h.id and d.trang_thai = 'da_ghi';
        update kho_ipos_hoa_don set bam = v_bam, thoi_diem_ban = v_luc, da_huy = v_huy, raw = v_raw,
                                    lan_chay_id = p_lan_id, so_lan_sua = so_lan_sua + 1
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
        insert into kho_ipos_hoa_don (chi_nhanh_id, ma_hd, bam, thoi_diem_ban, da_huy, raw, lan_chay_id)
        values (p_chi_nhanh_id, v_ma, v_bam, v_luc, v_huy, v_raw, p_lan_id)
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
  'NỘI BỘ (0042). Lõi nhận hóa đơn iPOS (người gọi đã kiểm quyền, khóa kho_cai_dat rồi cấu hình): hộp thư (trùng băm = bỏ, băm khác = đảo ngược rồi ghi lại, hủy = đảo ngược; raw bỏ thông tin khách), p_ghi_so → ghi sổ mọi dòng cho / thieu_hang / chua_khop; cập nhật hop_thu_luc, nhan_hd_luc.';

-- Thay THÂN (cùng chữ ký, 0037): nhận thêm lượt 'callback' (không khóa lượt),
-- dòng có so_luong; phần việc chuyển sang kho_ipos_nhan_hd.
create or replace function kho_ipos_nhan(p_chi_nhanh_id uuid, p_lan_id uuid, p_hoa_don jsonb, p_den_luc timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c  kho_ipos_cau_hinh;
  v_kq jsonb;
begin
  if not kho_duoc(p_chi_nhanh_id, 'dong_bo_ban') then
    raise exception 'Tài khoản của bạn không đồng bộ được bán hàng iPOS của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  -- Khóa xếp hàng của chi nhánh (như mọi hàm ghi sổ) rồi tới cấu hình.
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found or p_lan_id is null
     or (v_c.lan_dang_chay is distinct from p_lan_id
         and not exists (select 1 from kho_ipos_lan_chay l
                         where l.id = p_lan_id and l.chi_nhanh_id = p_chi_nhanh_id
                           and l.nguon = 'callback' and l.ket_thuc_luc is null)) then
    raise exception 'Lượt đồng bộ này đã kết thúc hoặc quá hạn — chạy lại' using errcode = 'check_violation';
  end if;

  v_kq := kho_ipos_nhan_hd(p_chi_nhanh_id, p_lan_id, p_hoa_don, true);

  if p_den_luc is not null then
    update kho_ipos_cau_hinh set
      dong_bo_den_luc = greatest(coalesce(dong_bo_den_luc, '-infinity'::timestamptz), least(p_den_luc, now()))
    where chi_nhanh_id = p_chi_nhanh_id;
  end if;

  return (v_kq - 'da_ghi_so')
    || jsonb_build_object('den_luc', (select dong_bo_den_luc from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id));
end;
$$;

comment on function kho_ipos_nhan is
  'Nhận một lô ≤ 200 HĐ iPOS (dong_bo_ban, trong lượt p_lan_id — lượt cron / tay đang giữ khóa, hoặc lượt callback chưa kết thúc): ghi hộp thư (trùng băm = bỏ, băm khác = đảo ngược rồi ghi lại, hủy = đảo ngược), rồi ghi sổ mọi dòng cho / thieu_hang / chua_khop của chi nhánh, lỗi một dòng không hỏng lô. Mảng rỗng = thử lại hàng chờ. p_den_luc (lô cuối) tiến watermark. Dòng có thể gửi so_luong (0042). Trả {hd_moi, hd_trung, hd_sua, hd_huy, hd_loi, canh_bao[{ma_hd, loi}], so_dong, dong{trạng thái: số}, den_luc}.';

-- Callback iPOS gói gọn trong MỘT lời gọi (0042). p_hoa_don: một HĐ (object),
-- mảng ≤ 200 HĐ, hoặc [] (= thử lại hàng chờ). Luôn cất vào hộp thư; ghi sổ
-- chỉ khi kết nối đang bật.
create or replace function kho_ipos_nhan_callback(p_chi_nhanh_id uuid, p_hoa_don jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c   kho_ipos_cau_hinh;
  v_ds  jsonb;
  v_lan uuid;
  v_kq  jsonb;
begin
  if not kho_duoc(p_chi_nhanh_id, 'dong_bo_ban') then
    raise exception 'Tài khoản của bạn không đồng bộ được bán hàng iPOS của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  v_ds := case when p_hoa_don is null or p_hoa_don = 'null'::jsonb then '[]'::jsonb
               when jsonb_typeof(p_hoa_don) = 'object' then jsonb_build_array(p_hoa_don)
               else p_hoa_don end;
  if jsonb_typeof(v_ds) <> 'array' then
    raise exception 'Hóa đơn không hợp lệ' using errcode = 'check_violation';
  end if;

  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Kho chi nhánh này chưa khởi tạo' using errcode = 'check_violation';
  end if;
  select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh này chưa có kết nối iPOS' using errcode = 'check_violation';
  end if;

  insert into kho_ipos_lan_chay (chi_nhanh_id, nguon, nguoi)
  values (p_chi_nhanh_id, 'callback', (nhan_su_hien_tai()).id)
  returning id into v_lan;

  v_kq := kho_ipos_nhan_hd(p_chi_nhanh_id, v_lan, v_ds, v_c.bat);

  update kho_ipos_lan_chay set ket_thuc_luc = now() where id = v_lan;
  update kho_ipos_cau_hinh set lan_cuoi_luc = now(), lan_ok_luc = now()
  where chi_nhanh_id = p_chi_nhanh_id;

  return v_kq || jsonb_build_object('lan_id', v_lan, 'bat', v_c.bat);
end;
$$;

comment on function kho_ipos_nhan_callback is
  'iPOS đẩy hóa đơn sang (dong_bo_ban, 0042): p_hoa_don = một HĐ | mảng ≤ 200 HĐ | [] (thử lại hàng chờ), cùng dạng kho_ipos_nhan (dòng dùng so_luong). Không khóa lượt, không giới hạn 60 giây: callback song song xếp hàng trên khóa kho_cai_dat, trùng mã HĐ cùng băm = bỏ. Luôn cất hộp thư; ghi sổ chỉ khi kết nối bật. Ghi một lượt nguồn callback. Trả {hd_moi, hd_trung, hd_sua, hd_huy, hd_loi, canh_bao, so_dong, dong, da_ghi_so, lan_id, bat}.';

-- Máy may_ipos không đọc được bảng nào: tìm chi nhánh của hóa đơn qua hàm này.
create or replace function kho_ipos_tim_chi_nhanh(p_pos_parent text, p_pos_id text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.chi_nhanh_id
  from kho_ipos_cau_hinh c
  where lower(c.pos_parent) = lower(btrim(p_pos_parent)) and c.pos_id = btrim(p_pos_id)
    and c.chi_nhanh_id = any ((select kho_cn_duoc('dong_bo_ban'))::uuid[])
  order by c.bat desc, c.chi_nhanh_id
  limit 1
$$;

comment on function kho_ipos_tim_chi_nhanh is
  'Chi nhánh có kết nối iPOS khớp (pos_parent không phân biệt hoa thường, pos_id) mà người gọi đồng bộ được (dong_bo_ban, 0042). Không khớp → null.';


-- =============================================================================
-- 5 · LƯỢT CRON / TAY / CALLBACK — thay THÂN kho_ipos_bat_dau (cùng chữ ký)
-- =============================================================================
create or replace function kho_ipos_bat_dau(p_chi_nhanh_id uuid, p_nguon text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c    kho_ipos_cau_hinh;
  v_id   uuid;
  v_tu   timestamptz;
  v_den  timestamptz := now();
  v_thieu text[] := '{}';
begin
  if not kho_duoc(p_chi_nhanh_id, 'dong_bo_ban') then
    raise exception 'Tài khoản của bạn không đồng bộ được bán hàng iPOS của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  if p_nguon is null or p_nguon not in ('cron', 'tay', 'callback') then
    raise exception 'Nguồn lượt đồng bộ phải là cron, tay hoặc callback' using errcode = 'check_violation';
  end if;

  select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found or not v_c.bat then
    return jsonb_build_object('duoc', false, 'ly_do', 'Đồng bộ iPOS chưa bật ở chi nhánh này');
  end if;
  -- 0042: iPOS tự đẩy hóa đơn — không cần đường dẫn lấy hóa đơn.
  if coalesce(v_c.pos_parent, '') = '' then v_thieu := v_thieu || 'pos_parent'::text; end if;
  if coalesce(v_c.pos_id, '') = '' then v_thieu := v_thieu || 'pos_id'::text; end if;
  if v_c.vi_tri_ban_id is null then v_thieu := v_thieu || 'quầy bán'::text; end if;
  if cardinality(v_thieu) > 0 then
    return jsonb_build_object('duoc', false,
      'ly_do', 'Chưa cấu hình đủ kết nối iPOS: thiếu ' || array_to_string(v_thieu, ', '));
  end if;

  v_tu := coalesce(v_c.dong_bo_den_luc - interval '15 minutes', v_c.ipos_tu_luc, now() - interval '1 hour');
  if v_c.ipos_tu_luc is not null and v_tu < v_c.ipos_tu_luc then
    v_tu := v_c.ipos_tu_luc;
  end if;

  if p_nguon <> 'callback' then
    if v_c.dang_chay_tu is not null and v_c.dang_chay_tu > now() - interval '10 minutes' then
      return jsonb_build_object('duoc', false, 'ly_do', 'Đang có một lượt đồng bộ chạy — đợi ít phút');
    end if;
    if v_c.lan_dang_chay is not null then
      update kho_ipos_lan_chay set ket_thuc_luc = now(), loi = 'Quá 10 phút không xong — coi như hỏng'
      where id = v_c.lan_dang_chay and ket_thuc_luc is null;
    end if;
    if p_nguon = 'tay' and exists (
         select 1 from kho_ipos_lan_chay l
         where l.chi_nhanh_id = p_chi_nhanh_id and l.nguon <> 'callback'
           and l.bat_dau_luc > now() - interval '60 seconds') then
      return jsonb_build_object('duoc', false, 'ly_do', 'Vừa cập nhật xong — đợi 1 phút rồi bấm lại');
    end if;
  end if;

  insert into kho_ipos_lan_chay (chi_nhanh_id, nguon, nguoi, tu_luc, den_luc)
  values (p_chi_nhanh_id, p_nguon, (nhan_su_hien_tai()).id, v_tu, v_den)
  returning id into v_id;
  if p_nguon <> 'callback' then
    update kho_ipos_cau_hinh set dang_chay_tu = now(), lan_dang_chay = v_id where chi_nhanh_id = p_chi_nhanh_id;
  end if;

  return jsonb_build_object(
    'duoc', true, 'lan_id', v_id, 'api_url', v_c.api_url, 'pos_parent', v_c.pos_parent, 'pos_id', v_c.pos_id,
    'duong_dan_hoa_don', v_c.duong_dan_hoa_don, 'tu_luc', v_tu, 'den_luc', v_den,
    'menu_luc', v_c.menu_luc, 'menu_can_lam_moi', v_c.menu_can_lam_moi);
end;
$$;

comment on function kho_ipos_bat_dau is
  'Bắt đầu một lượt đồng bộ iPOS (dong_bo_ban). Nguồn cron | tay (khóa lượt 10 phút; tay cách lượt trước ≥ 60 giây) | callback (0042: không khóa, không giới hạn). Trả {duoc, ly_do?, lan_id, api_url, pos_parent, pos_id, duong_dan_hoa_don, tu_luc, den_luc, menu_luc, menu_can_lam_moi}. Từ chối (duoc=false) khi chưa bật / thiếu pos_parent, pos_id, quầy bán / đang có lượt chạy. Không trả token — token là bí mật Worker.';


-- =============================================================================
-- 6 · DANH MỤC MÓN iPOS  [dong_bo_ban]
-- =============================================================================
-- p_mon: [{ma_ipos, ten_ipos?, loai?, dang_ban?}] ≤ 5000 — TOÀN BỘ danh mục:
-- mã không còn trong danh sách bị xóa khỏi kho_ipos_menu. Mã ghép chưa có tên
-- iPOS thì lấy tên từ đây. Không nhận giá.
create or replace function kho_ipos_luu_menu(p_chi_nhanh_id uuid, p_mon jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds   jsonb := '[]';
  v_moi  int;
  v_bo   int;
  v_ten  int;
begin
  if not kho_duoc(p_chi_nhanh_id, 'dong_bo_ban') then
    raise exception 'Tài khoản của bạn không đồng bộ được bán hàng iPOS của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  if p_mon is null or jsonb_typeof(p_mon) <> 'array' then
    raise exception 'Danh mục món không hợp lệ' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_mon) > 5000 then
    raise exception 'Tối đa 5000 món' using errcode = 'check_violation';
  end if;
  perform 1 from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh này chưa có kết nối iPOS' using errcode = 'check_violation';
  end if;

  -- Chuẩn hóa một lần (mã trùng: lấy lần đầu) — theo tập, không vòng lặp lồng.
  select coalesce(jsonb_agg(jsonb_build_object('ma_ipos', x.ma, 'ten_ipos', x.ten, 'loai', x.loai, 'dang_ban', x.dang_ban)
                            order by x.i), '[]')
    into v_ds
  from (
    select distinct on (y.ma) y.ma, y.ten, y.loai, y.dang_ban, y.i
    from (
      select left(nullif(btrim(e ->> 'ma_ipos'), ''), 100) as ma,
             left(nullif(btrim(e ->> 'ten_ipos'), ''), 200) as ten,
             left(nullif(btrim(e ->> 'loai'), ''), 100) as loai,
             coalesce((e ->> 'dang_ban')::boolean, true) as dang_ban,
             t.i
      from jsonb_array_elements(p_mon) with ordinality t(e, i)
      where jsonb_typeof(e) = 'object'
    ) y
    where y.ma is not null
    order by y.ma, y.i
  ) x;

  select count(*) into v_moi from jsonb_to_recordset(v_ds) as y(ma_ipos text)
  where not exists (select 1 from kho_ipos_menu m where m.chi_nhanh_id = p_chi_nhanh_id and m.ma_ipos = y.ma_ipos);

  insert into kho_ipos_menu (chi_nhanh_id, ma_ipos, ten_ipos, loai, dang_ban, cap_nhat_luc)
  select p_chi_nhanh_id, y.ma_ipos, y.ten_ipos, y.loai, y.dang_ban, now()
  from jsonb_to_recordset(v_ds) as y(ma_ipos text, ten_ipos text, loai text, dang_ban boolean)
  on conflict (chi_nhanh_id, ma_ipos) do update set
    ten_ipos = excluded.ten_ipos, loai = excluded.loai, dang_ban = excluded.dang_ban, cap_nhat_luc = now();

  delete from kho_ipos_menu m
  where m.chi_nhanh_id = p_chi_nhanh_id
    and not exists (select 1 from jsonb_to_recordset(v_ds) as y(ma_ipos text) where y.ma_ipos = m.ma_ipos);
  get diagnostics v_bo = row_count;

  update kho_ipos_ma_hang g set ten_ipos = m.ten_ipos
  from kho_ipos_menu m
  where g.chi_nhanh_id = p_chi_nhanh_id and m.chi_nhanh_id = p_chi_nhanh_id and m.ma_ipos = g.ma_ipos
    and g.ten_ipos is null and m.ten_ipos is not null;
  get diagnostics v_ten = row_count;

  update kho_ipos_cau_hinh set menu_luc = now(), menu_can_lam_moi = false where chi_nhanh_id = p_chi_nhanh_id;

  return jsonb_build_object('so_mon', jsonb_array_length(v_ds), 'moi', v_moi, 'bo', v_bo, 'dat_ten', v_ten);
end;
$$;

comment on function kho_ipos_luu_menu is
  'Lưu TOÀN BỘ danh mục món iPOS của chi nhánh (dong_bo_ban, 0042): p_mon [{ma_ipos, ten_ipos?, loai?, dang_ban?}] ≤ 5000, mã trùng lấy lần đầu, mã không còn thì xóa; mã đã ghép chưa có tên thì lấy tên; tắt cờ "thực đơn cần làm mới". Không nhận giá. Trả {so_mon, moi, bo, dat_ten}.';

create or replace function kho_ipos_bao_menu_doi(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not kho_duoc(p_chi_nhanh_id, 'dong_bo_ban') then
    raise exception 'Tài khoản của bạn không đồng bộ được bán hàng iPOS của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  update kho_ipos_cau_hinh set menu_can_lam_moi = true where chi_nhanh_id = p_chi_nhanh_id;
  if not found then
    raise exception 'Chi nhánh này chưa có kết nối iPOS' using errcode = 'check_violation';
  end if;
  return jsonb_build_object('menu_can_lam_moi', true);
end;
$$;

comment on function kho_ipos_bao_menu_doi is
  'iPOS báo thực đơn đổi (Event 12 item_changed) → đặt cờ menu_can_lam_moi; lượt cron kế tiếp đọc lại danh mục (dong_bo_ban, 0042).';


-- =============================================================================
-- 7 · CẤU HÌNH — thay THÂN kho_ipos_luu_cau_hinh (cùng chữ ký), thêm gio_mat_ket_noi
-- =============================================================================
create or replace function kho_ipos_luu_cau_hinh(p_chi_nhanh_id uuid, p_cau_hinh jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_k   text;
  v_c   kho_ipos_cau_hinh;
  v_bat boolean;
  v_vt  kho_vi_tri;
  v_txt text;
begin
  if not kho_duoc(p_chi_nhanh_id, 'cai_dat_goc') then
    raise exception 'Chỉ chủ nhà hàng sửa được kết nối iPOS' using errcode = 'insufficient_privilege';
  end if;
  if not exists (select 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id) then
    raise exception 'Kho chi nhánh này chưa khởi tạo' using errcode = 'check_violation';
  end if;
  if p_cau_hinh is null or jsonb_typeof(p_cau_hinh) <> 'object' then
    raise exception 'Cấu hình không hợp lệ' using errcode = 'check_violation';
  end if;
  -- Token KHÔNG BAO GIỜ vào database.
  v_txt := p_cau_hinh::text;
  if v_txt ~* 'token' then
    raise exception 'Không lưu token vào database — token iPOS là bí mật Worker IPOS_ACCESS_TOKEN (npx wrangler secret put IPOS_ACCESS_TOKEN)'
      using errcode = 'check_violation';
  end if;
  for v_k in select jsonb_object_keys(p_cau_hinh) loop
    if v_k <> all (array['bat', 'api_url', 'pos_parent', 'pos_id', 'duong_dan_hoa_don', 'vi_tri_ban_id',
                         'gio_mo_cua', 'gio_dong_cua', 'gio_mat_ket_noi']) then
      raise exception 'Trường "%" không được nhận', v_k using errcode = 'check_violation';
    end if;
  end loop;
  if p_cau_hinh ? 'gio_mat_ket_noi'
     and coalesce(p_cau_hinh ->> 'gio_mat_ket_noi', '') !~ '^([1-9]|1[0-2])$' then
    raise exception 'Báo mất kết nối sau 1 đến 12 giờ không nhận hóa đơn' using errcode = 'check_violation';
  end if;

  if p_cau_hinh ? 'vi_tri_ban_id' and nullif(p_cau_hinh ->> 'vi_tri_ban_id', '') is not null then
    select * into v_vt from kho_vi_tri
    where id = (p_cau_hinh ->> 'vi_tri_ban_id')::uuid and chi_nhanh_id = p_chi_nhanh_id;
    if not found or v_vt.loai <> 'quay' then
      raise exception 'Quầy bán phải là một vị trí loại quầy của chi nhánh này' using errcode = 'check_violation';
    end if;
  end if;

  insert into kho_ipos_cau_hinh (chi_nhanh_id) values (p_chi_nhanh_id) on conflict (chi_nhanh_id) do nothing;
  select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id for update;
  v_bat := case when p_cau_hinh ? 'bat' then coalesce((p_cau_hinh ->> 'bat')::boolean, false) else v_c.bat end;

  update kho_ipos_cau_hinh set
    bat = v_bat,
    bat_luc = case when v_bat and not v_c.bat then now() else bat_luc end,
    api_url = case when p_cau_hinh ? 'api_url'
                   then coalesce(nullif(rtrim(btrim(p_cau_hinh ->> 'api_url'), '/'), ''),
                                 'https://apitest.foodbook.vn/ipos/ws/xpartner')
                   else api_url end,
    pos_parent = case when p_cau_hinh ? 'pos_parent' then nullif(btrim(p_cau_hinh ->> 'pos_parent'), '') else pos_parent end,
    pos_id = case when p_cau_hinh ? 'pos_id' then nullif(btrim(p_cau_hinh ->> 'pos_id'), '') else pos_id end,
    duong_dan_hoa_don = case when p_cau_hinh ? 'duong_dan_hoa_don'
                             then nullif(btrim(p_cau_hinh ->> 'duong_dan_hoa_don'), '') else duong_dan_hoa_don end,
    vi_tri_ban_id = case when p_cau_hinh ? 'vi_tri_ban_id'
                         then nullif(p_cau_hinh ->> 'vi_tri_ban_id', '')::uuid else vi_tri_ban_id end,
    gio_mo_cua = case when p_cau_hinh ? 'gio_mo_cua' then (p_cau_hinh ->> 'gio_mo_cua')::smallint else gio_mo_cua end,
    gio_dong_cua = case when p_cau_hinh ? 'gio_dong_cua' then (p_cau_hinh ->> 'gio_dong_cua')::smallint else gio_dong_cua end,
    gio_mat_ket_noi = case when p_cau_hinh ? 'gio_mat_ket_noi'
                           then (p_cau_hinh ->> 'gio_mat_ket_noi')::smallint else gio_mat_ket_noi end,
    nguoi_sua = (nhan_su_hien_tai()).id
  where chi_nhanh_id = p_chi_nhanh_id;

  return kho_ipos_trang_thai(p_chi_nhanh_id);
end;
$$;

comment on function kho_ipos_luu_cau_hinh is
  'Chủ lưu kết nối iPOS (cai_dat_goc): bat, api_url, pos_parent, pos_id, duong_dan_hoa_don (không còn dùng, 0042), vi_tri_ban_id (quầy), gio_mo_cua, gio_dong_cua, gio_mat_ket_noi (1–12, 0042) — chỉ khóa có mặt mới đổi. Từ chối mọi thứ có chữ "token". Trả kho_ipos_trang_thai.';


-- =============================================================================
-- 8 · GHÉP MÃ — thay THÂN kho_ipos_gan_ma (0037), thêm kho_ipos_gan_ma_v2  [danh_muc]
-- =============================================================================
-- Hàm cũ giữ hành vi: ghép kiểu mon | goi_can | bo_qua, chỉ xử lý lại dòng
-- chua_khop. Đổi kiểu → "bán theo" về mặc định (theo món kho); giữ kiểu thì
-- giữ "bán theo" đã chọn ở v2.
create or replace function kho_ipos_gan_ma(p_chi_nhanh_id uuid, p_ma_ipos text, p_kieu text, p_mat_hang_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma  text := nullif(btrim(p_ma_ipos), '');
  v_mh  kho_mat_hang;
  v_r   uuid;
  v_tt  text;
  v_dem jsonb := '{}';
  v_n   int := 0;
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không ghép được món iPOS' using errcode = 'insufficient_privilege';
  end if;
  if v_ma is null or char_length(v_ma) > 100 then
    raise exception 'Thiếu mã món iPOS' using errcode = 'check_violation';
  end if;
  if p_kieu is not null and p_kieu not in ('goi_can', 'mon', 'bo_qua') then
    raise exception 'Kiểu ghép phải là goi_can, mon hoặc bo_qua' using errcode = 'check_violation';
  end if;
  if p_kieu = 'mon' and p_mat_hang_id is null then
    raise exception 'Chọn món trong kho' using errcode = 'check_violation';
  end if;
  if p_kieu in ('mon', 'goi_can') and p_mat_hang_id is not null then
    select * into v_mh from kho_mat_hang where id = p_mat_hang_id;
    if not found then
      raise exception 'Không tìm thấy món trong kho' using errcode = 'check_violation';
    end if;
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;

  if p_kieu is null then
    delete from kho_ipos_ma_hang where chi_nhanh_id = p_chi_nhanh_id and ma_ipos = v_ma;
  else
    insert into kho_ipos_ma_hang (chi_nhanh_id, ma_ipos, ten_ipos, kieu, mat_hang_id, nguoi_sua)
    values (p_chi_nhanh_id, v_ma,
            coalesce((select d.ten_ipos from kho_ipos_dong d where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = v_ma
                        and d.ten_ipos is not null order by d.created_at desc limit 1),
                     (select m.ten_ipos from kho_ipos_menu m where m.chi_nhanh_id = p_chi_nhanh_id and m.ma_ipos = v_ma)),
            p_kieu, case when p_kieu = 'bo_qua' then null else p_mat_hang_id end, (nhan_su_hien_tai()).id)
    on conflict (chi_nhanh_id, ma_ipos) do update set
      kieu = excluded.kieu, mat_hang_id = excluded.mat_hang_id, nguoi_sua = excluded.nguoi_sua,
      ten_ipos = coalesce(excluded.ten_ipos, kho_ipos_ma_hang.ten_ipos),
      don_vi_ban = case when excluded.kieu = kho_ipos_ma_hang.kieu then kho_ipos_ma_hang.don_vi_ban end,
      kg_moi_don_vi = case when excluded.kieu = kho_ipos_ma_hang.kieu then kho_ipos_ma_hang.kg_moi_don_vi end;
  end if;

  for v_r in
    select d.id from kho_ipos_dong d
    where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = v_ma and d.trang_thai = 'chua_khop'
    order by d.thoi_diem_ban, d.created_at
  loop
    v_tt := kho_ipos_ghi_dong(v_r);
    v_dem := jsonb_set(v_dem, array[v_tt], to_jsonb(coalesce((v_dem ->> v_tt)::int, 0) + 1));
    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('ma_ipos', v_ma, 'kieu', p_kieu, 'so_dong', v_n, 'dong', v_dem);
end;
$$;

comment on function kho_ipos_gan_ma is
  'Ghép mã món iPOS với món kho (danh_muc): kieu mon | goi_can | bo_qua; p_kieu null = bỏ ghép. Xử lý lại ngay mọi dòng chua_khop cùng mã. Đổi kiểu → "bán theo" về mặc định (0042; muốn chọn kg / gói / suất dùng kho_ipos_gan_ma_v2). Trả {ma_ipos, kieu, so_dong, dong{trạng thái: số}}.';

-- p_don_vi_ban: kg | goi | suat | null (theo món kho). suat = món chế biến:
-- lưu thành kiểu bo_qua, không món kho. p_kg_moi_don_vi chỉ dùng khi goi.
-- Ghép xong xử lý lại mọi dòng chua_khop / thieu_hang / loi cùng mã.
create or replace function kho_ipos_gan_ma_v2(
  p_chi_nhanh_id  uuid,
  p_ma_ipos       text,
  p_kieu          text,
  p_mat_hang_id   uuid,
  p_don_vi_ban    text,
  p_kg_moi_don_vi numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma   text := nullif(btrim(p_ma_ipos), '');
  v_dv   text := nullif(lower(btrim(coalesce(p_don_vi_ban, ''))), '');
  v_kieu text := p_kieu;
  v_mh   uuid := p_mat_hang_id;
  v_kg   numeric;
  v_r    uuid;
  v_tt   text;
  v_dem  jsonb := '{}';
  v_n    int := 0;
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không ghép được món iPOS' using errcode = 'insufficient_privilege';
  end if;
  if v_ma is null or char_length(v_ma) > 100 then
    raise exception 'Thiếu mã món iPOS' using errcode = 'check_violation';
  end if;
  if v_kieu is not null and v_kieu not in ('goi_can', 'mon', 'bo_qua') then
    raise exception 'Kiểu ghép phải là goi_can, mon hoặc bo_qua' using errcode = 'check_violation';
  end if;
  if v_dv is not null and v_dv not in ('kg', 'goi', 'suat') then
    raise exception 'Bán theo phải là kg, gói hoặc suất' using errcode = 'check_violation';
  end if;

  if v_kieu is not null then
    if v_dv = 'suat' then
      -- Món chế biến: không trừ kho, chỉ đếm suất.
      v_kieu := 'bo_qua';
      v_mh := null;
    end if;
    if v_kieu = 'bo_qua' then
      v_mh := null;
      if v_dv <> 'suat' then
        v_dv := null;
      end if;
    end if;
    if v_kieu = 'mon' and v_mh is null then
      raise exception 'Chọn món trong kho' using errcode = 'check_violation';
    end if;
    if v_mh is not null and not exists (select 1 from kho_mat_hang where id = v_mh) then
      raise exception 'Không tìm thấy món trong kho' using errcode = 'check_violation';
    end if;
    if v_dv = 'goi' and p_kg_moi_don_vi is not null then
      if p_kg_moi_don_vi <= 0 or p_kg_moi_don_vi > 1000 then
        raise exception 'Mỗi gói phải nặng hơn 0 kg và không quá 1000 kg' using errcode = 'check_violation';
      end if;
      v_kg := round(p_kg_moi_don_vi, 3);
    end if;
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;

  if v_kieu is null then
    delete from kho_ipos_ma_hang where chi_nhanh_id = p_chi_nhanh_id and ma_ipos = v_ma;
    v_dv := null;
  else
    insert into kho_ipos_ma_hang (chi_nhanh_id, ma_ipos, ten_ipos, kieu, mat_hang_id, don_vi_ban, kg_moi_don_vi, nguoi_sua)
    values (p_chi_nhanh_id, v_ma,
            coalesce((select d.ten_ipos from kho_ipos_dong d where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = v_ma
                        and d.ten_ipos is not null order by d.created_at desc limit 1),
                     (select m.ten_ipos from kho_ipos_menu m where m.chi_nhanh_id = p_chi_nhanh_id and m.ma_ipos = v_ma)),
            v_kieu, v_mh, v_dv, v_kg, (nhan_su_hien_tai()).id)
    on conflict (chi_nhanh_id, ma_ipos) do update set
      kieu = excluded.kieu, mat_hang_id = excluded.mat_hang_id, don_vi_ban = excluded.don_vi_ban,
      kg_moi_don_vi = excluded.kg_moi_don_vi, nguoi_sua = excluded.nguoi_sua,
      ten_ipos = coalesce(excluded.ten_ipos, kho_ipos_ma_hang.ten_ipos);
  end if;

  for v_r in
    select d.id from kho_ipos_dong d
    where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = v_ma and d.trang_thai in ('chua_khop', 'thieu_hang', 'loi')
    order by d.thoi_diem_ban, d.created_at
  loop
    v_tt := kho_ipos_ghi_dong(v_r);
    v_dem := jsonb_set(v_dem, array[v_tt], to_jsonb(coalesce((v_dem ->> v_tt)::int, 0) + 1));
    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('ma_ipos', v_ma, 'kieu', v_kieu, 'mat_hang_id', v_mh, 'don_vi_ban', v_dv,
                            'kg_moi_don_vi', v_kg, 'so_dong', v_n, 'dong', v_dem);
end;
$$;

comment on function kho_ipos_gan_ma_v2 is
  'Ghép mã món iPOS (danh_muc, 0042) kèm "bán theo": p_don_vi_ban kg | goi | suat | null (theo món kho); suat = món chế biến → lưu kiểu bo_qua, không trừ kho, chỉ đếm suất; p_kg_moi_don_vi (0 < x ≤ 1000) chỉ khi goi. p_kieu null = bỏ ghép. Xử lý lại ngay mọi dòng chua_khop / thieu_hang / loi cùng mã. Trả {ma_ipos, kieu, mat_hang_id, don_vi_ban, kg_moi_don_vi, so_dong, dong{trạng thái: số}}.';


-- =============================================================================
-- 9 · TRẠNG THÁI — thay THÂN kho_ipos_trang_thai (cùng chữ ký)  [xem — không tiền]
-- =============================================================================
create or replace function kho_ipos_trang_thai(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_c    kho_ipos_cau_hinh;
  v_cd   kho_cai_dat;
  v_dem  jsonb;
  v_mat  boolean;
  v_den  text;
  v_cau  text;
  v_du   boolean;
  v_cho  int;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id;
  select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id;

  select jsonb_build_object(
           'cho',        count(*) filter (where d.trang_thai = 'cho'),
           'chua_khop',  count(*) filter (where d.trang_thai = 'chua_khop'),
           'thieu_hang', count(*) filter (where d.trang_thai = 'thieu_hang'),
           'loi',        count(*) filter (where d.trang_thai = 'loi'),
           'het_han',    count(*) filter (where d.trang_thai = 'da_ghi' and d.lo_het_han
                                            and d.thoi_diem_ban >= now() - interval '7 days'),
           'da_ghi_hom_nay', count(*) filter (where d.trang_thai = 'da_ghi'
                                                and ((d.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date = hom_nay_vn()))
    into v_dem
  from kho_ipos_dong d where d.chi_nhanh_id = p_chi_nhanh_id;
  v_cho := (v_dem ->> 'chua_khop')::int + (v_dem ->> 'thieu_hang')::int;

  -- 0042: iPOS tự đẩy hóa đơn — không cần đường dẫn lấy hóa đơn.
  v_du := v_c.chi_nhanh_id is not null and coalesce(v_c.pos_parent, '') <> '' and coalesce(v_c.pos_id, '') <> ''
          and v_c.vi_tri_ban_id is not null;
  v_mat := v_c.chi_nhanh_id is not null and kho_ipos_mat_ket_noi(v_c);

  if v_c.chi_nhanh_id is null or not v_c.bat then
    v_den := 'vang'; v_cau := 'Chưa bật đồng bộ iPOS.';
  elsif not v_du then
    v_den := 'vang'; v_cau := 'Chưa cấu hình đủ kết nối iPOS.';
  elsif v_mat and v_c.loi_tu_luc is not null then
    v_den := 'do'; v_cau := 'Lần cập nhật gần nhất bị lỗi — bấm "Cập nhật ngay" để thử lại.';
  elsif v_mat then
    v_den := 'do'; v_cau := 'Đã hơn ' || v_c.gio_mat_ket_noi
      || ' giờ trong giờ mở cửa không nhận được hóa đơn nào từ iPOS — kiểm tra máy iPOS và địa chỉ nhận hóa đơn.';
  elsif coalesce(v_cd.nguon_so_ban, 'kiem_ke') <> 'ipos' or v_c.ipos_tu_luc is null then
    v_den := 'vang'; v_cau := 'Đang nhận hóa đơn iPOS nhưng CHƯA trừ kho — còn dùng đếm quầy làm số bán.';
  elsif v_cho > 0 or (v_dem ->> 'loi')::int > 0 then
    v_den := 'vang'; v_cau := 'Có dòng bán chưa trừ được kho — mở Bán hàng iPOS để xử lý.';
  else
    v_den := 'xanh'; v_cau := 'Kho đang tự trừ theo iPOS.';
  end if;

  return jsonb_build_object(
    'co_cau_hinh', v_c.chi_nhanh_id is not null,
    'bat', coalesce(v_c.bat, false),
    'cau_hinh_du', v_du,
    'nguon_so_ban', coalesce(v_cd.nguon_so_ban, 'kiem_ke'),
    'api_url', coalesce(v_c.api_url, 'https://apitest.foodbook.vn/ipos/ws/xpartner'),
    'pos_parent', v_c.pos_parent, 'pos_id', v_c.pos_id, 'duong_dan_hoa_don', v_c.duong_dan_hoa_don,
    'vi_tri_ban_id', v_c.vi_tri_ban_id,
    'gio_mo_cua', coalesce(v_c.gio_mo_cua, 10), 'gio_dong_cua', coalesce(v_c.gio_dong_cua, 23),
    'gio_mat_ket_noi', coalesce(v_c.gio_mat_ket_noi, 3),
    'ipos_tu_luc', v_c.ipos_tu_luc, 'dong_bo_den_luc', v_c.dong_bo_den_luc,
    'dang_chay', v_c.dang_chay_tu is not null and v_c.dang_chay_tu > now() - interval '10 minutes',
    'lan_cuoi_luc', v_c.lan_cuoi_luc, 'lan_cuoi_loi', v_c.lan_cuoi_loi, 'lan_ok_luc', v_c.lan_ok_luc,
    'nhan_hd_luc', v_c.nhan_hd_luc, 'hop_thu_luc', v_c.hop_thu_luc,
    'menu_luc', v_c.menu_luc, 'menu_can_lam_moi', coalesce(v_c.menu_can_lam_moi, false),
    'so_mon_menu', (select count(*) from kho_ipos_menu m where m.chi_nhanh_id = p_chi_nhanh_id),
    'mat_ket_noi', coalesce(v_mat, false),
    'den', v_den, 'cau', v_cau,
    'cho_xu_ly', v_cho, 'dem', v_dem,
    'lan_chay', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'nguon', l.nguon, 'bat_dau_luc', l.bat_dau_luc,
                                          'ket_thuc_luc', l.ket_thuc_luc, 'so_hd', l.so_hd, 'so_dong', l.so_dong,
                                          'so_da_ghi', l.so_da_ghi, 'loi', l.loi) order by l.bat_dau_luc desc)
      from (select * from kho_ipos_lan_chay where chi_nhanh_id = p_chi_nhanh_id
            order by bat_dau_luc desc limit 10) l), '[]'));
end;
$$;

comment on function kho_ipos_trang_thai is
  'Trạng thái đồng bộ iPOS (xem, không tiền): cấu hình (không token), đèn xanh | vang | do + câu dễ hiểu, lần nhận hóa đơn cuối (nhan_hd_luc), lần xử lý hộp thư cuối (hop_thu_luc), thực đơn (menu_luc, menu_can_lam_moi, so_mon_menu), số dòng theo trạng thái, 10 lượt gần nhất. 0042: không cần đường dẫn hóa đơn; mất kết nối = lượt lỗi hoặc quá gio_mat_ket_noi giờ không nhận hóa đơn trong giờ mở cửa.';


-- =============================================================================
-- 10 · ĐỊNH MỨC GĐ7b — thay THÂN kho_dinh_muc_ban (0038): đếm so_luong trước
-- =============================================================================
create or replace function kho_dinh_muc_ban(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (mon_id uuid, so_suat numeric)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, sum(coalesce(d.so_luong, d.so_goi::numeric, d.so_kg, 1))
  from kho_mon m
  join kho_ipos_dong d on d.chi_nhanh_id = m.chi_nhanh_id and d.ma_ipos = m.ma_ipos
  join kho_ipos_hoa_don h on h.id = d.hoa_don_id
  where m.chi_nhanh_id = p_chi_nhanh_id and m.ma_ipos is not null
    and not h.da_huy and d.trang_thai not in ('da_huy', 'da_ghi')
    and d.thoi_diem_ban >= kho_luc_vn(p_tu, 0) and d.thoi_diem_ban < kho_luc_vn(p_den + 1, 0)
  group by m.id
  having sum(coalesce(d.so_luong, d.so_goi::numeric, d.so_kg, 1)) <> 0
$$;

comment on function kho_dinh_muc_ban is
  'NỘI BỘ (0038, 0042). Số suất bán từng món trong kỳ (ngày giờ VN) từ dòng iPOS khớp kho_mon.ma_ipos: bỏ HĐ hủy, dòng da_huy, dòng da_ghi (hàng bán thẳng từ quầy, đã trừ kho). Suất = so_luong iPOS (0042), không có thì so_goi / so_kg / 1.';


-- =============================================================================
-- 11 · KIỂM KÊ QUẦY KHI NGUỒN iPOS — thay THÂN kho_gui_kiem_ke (cùng chữ ký), chép 0037
-- =============================================================================
create or replace function kho_gui_kiem_ke(p_id uuid, p_phien_ban int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk    kho_kiem_ke;
  v_ds    text;
  v_lech  int;
  v_ip    kho_ipos_cau_hinh;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được kiểm kê'
      using errcode = 'insufficient_privilege';
  end if;
  -- Khóa cài đặt chi nhánh: không ai ghi sổ trong lúc chụp sổ sách.
  perform 1 from kho_cai_dat where chi_nhanh_id = v_kk.chi_nhanh_id for update;
  select * into v_kk from kho_kiem_ke where id = p_id for update;
  if v_kk.trang_thai = 'cho_duyet' then
    return 'Phiếu ' || v_kk.so_phieu || ' đã gửi, đang chờ duyệt.';
  end if;
  if v_kk.trang_thai <> 'dang_dem' then
    raise exception 'Phiếu % không còn ở bước đếm', v_kk.so_phieu using errcode = 'check_violation';
  end if;
  if p_phien_ban is distinct from v_kk.phien_ban then
    raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
      using errcode = 'check_violation';
  end if;

  -- 0032: hàng đang mang ra vị trí này mà quầy chưa bấm nhận — có thể đã nằm
  -- trên quầy mà sổ chưa có, đếm sẽ ra thừa giả.
  select string_agg(x.so_phieu, ', ') into v_ds from kho_phieu_xuat x
  where x.chi_nhanh_id = v_kk.chi_nhanh_id and x.vi_tri_den_id = v_kk.vi_tri_id and x.trang_thai = 'dang_chuyen';
  if v_ds is not null then
    raise exception 'Còn hàng đang mang ra chưa bấm nhận: % — bấm "Đã nhận" (hoặc báo thiếu) trước khi %', v_ds, 'gửi kiểm kê'
      using errcode = 'check_violation';
  end if;

  -- 0037 → 0042: quầy trừ kho theo iPOS — hộp thư hóa đơn phải được xử lý
  -- trong 10 phút gần nhất (callback hoặc lượt thử lại hàng chờ 5 phút / lần).
  -- iPOS tự đẩy hóa đơn: quán vắng khách (không có hóa đơn mới) KHÔNG chặn.
  if v_kk.nguon_so_ban = 'ipos' then
    select * into v_ip from kho_ipos_cau_hinh where chi_nhanh_id = v_kk.chi_nhanh_id;
    if found and v_ip.bat and v_ip.vi_tri_ban_id = v_kk.vi_tri_id
       and (v_ip.hop_thu_luc is null or v_ip.hop_thu_luc < now() - interval '10 minutes') then
      raise exception 'Bán hàng iPOS chưa cập nhật hơn 10 phút — mở Kết nối iPOS, bấm "Cập nhật ngay" rồi gửi lại'
        using errcode = 'check_violation';
    end if;
  end if;

  perform kho_kiem_ke_bo_sung_dong(p_id);

  select string_agg(x.ten, ', ') into v_ds from (
    select m.ten from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
    where d.kiem_ke_id = p_id
      and (case when m.dem_goi then d.so_goi_dem is null else d.so_kg_dem is null end)
    order by d.thu_tu limit 6) x;
  if v_ds is not null then
    raise exception 'Chưa đếm: % — đếm hết (không còn thì ghi 0) rồi gửi', v_ds using errcode = 'check_violation';
  end if;

  -- Chụp sổ sách.
  delete from kho_kiem_ke_lo where kiem_ke_dong_id in (select id from kho_kiem_ke_dong where kiem_ke_id = p_id);
  if v_kk.kieu = 'theo_mat_hang' then
    insert into kho_kiem_ke_lo (kiem_ke_dong_id, chi_nhanh_id, lo_id, so_goi_so, so_kg_so)
    select d.id, v_kk.chi_nhanh_id, t.lo_id, t.so_goi, t.so_kg
    from kho_kiem_ke_dong d
    join kho_ton t on t.mat_hang_id = d.mat_hang_id and t.vi_tri_id = v_kk.vi_tri_id
    where d.kiem_ke_id = p_id and (t.so_kg > 0 or t.so_goi > 0);
  else
    insert into kho_kiem_ke_lo (kiem_ke_dong_id, chi_nhanh_id, lo_id, so_goi_so, so_kg_so)
    select d.id, v_kk.chi_nhanh_id, d.lo_id, coalesce(t.so_goi, 0), coalesce(t.so_kg, 0)
    from kho_kiem_ke_dong d
    left join kho_ton t on t.lo_id = d.lo_id and t.vi_tri_id = v_kk.vi_tri_id
    where d.kiem_ke_id = p_id;
  end if;
  update kho_kiem_ke_dong d set
    so_goi_so = coalesce(x.g, 0), so_kg_so = coalesce(x.k, 0)
  from (select d2.id, sum(kl.so_goi_so)::int as g, sum(kl.so_kg_so) as k
          from kho_kiem_ke_dong d2
          left join kho_kiem_ke_lo kl on kl.kiem_ke_dong_id = d2.id
         where d2.kiem_ke_id = p_id group by d2.id) x
  where x.id = d.id;

  -- Đếm 0 mà sổ còn: phải xác nhận "đã hết thật".
  select string_agg(x.ten, ', ') into v_ds from (
    select m.ten from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
    where d.kiem_ke_id = p_id and not d.xac_nhan_het
      and (d.so_goi_so > 0 or d.so_kg_so > 0)
      and (case when m.dem_goi then d.so_goi_dem = 0 else d.so_kg_dem = 0 end)
    order by d.thu_tu limit 6) x;
  if v_ds is not null then
    raise exception 'Đếm được 0 nhưng sổ còn hàng: % — tích "Đã hết thật" để xác nhận rồi gửi lại', v_ds
      using errcode = 'check_violation';
  end if;

  select count(*) into v_lech
  from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
  where d.kiem_ke_id = p_id
    and (case when m.dem_goi
              then d.so_goi_dem <> d.so_goi_so or (d.so_kg_dem is not null and d.so_kg_dem <> d.so_kg_so)
              else d.so_kg_dem <> d.so_kg_so end);

  update kho_kiem_ke set
    trang_thai = 'cho_duyet', nguoi_gui = (nhan_su_hien_tai()).id, gui_luc = now(),
    ly_do = null, phien_ban = phien_ban + 1
  where id = p_id;

  return 'Đã gửi ' || v_kk.so_phieu || ': ' || v_lech || ' dòng lệch sổ, chờ quản lý duyệt.';
end;
$$;

comment on function kho_gui_kiem_ke is
  'NV gửi phiếu kiểm kê (van_hanh): chụp sổ sách, chặn khi còn hàng đang mang ra chưa nhận (0032); quầy trừ kho theo iPOS thì hộp thư hóa đơn phải được xử lý trong 10 phút gần nhất (0042 — không đòi hóa đơn mới).';


-- =============================================================================
-- 12 · SỰ KIỆN — thay THÂN kho_su_kien (cùng chữ ký), chép 0040
-- =============================================================================
-- Chỉ đổi ipos_mat_ket_noi: so = số phút từ hóa đơn cuối nhận được (null =
-- chưa nhận hóa đơn nào); mốc 'cham'
-- = mốc nhận (không sớm hơn giờ mở cửa hôm nay) + gio_mat_ket_noi giờ.
create or replace function kho_su_kien(p_chi_nhanh_id uuid)
returns table (khoa text, nhom text, ref_id uuid, ref2 uuid, ma text, ten text, phu text, so numeric, luc timestamptz)
language plpgsql
stable
set search_path = public
as $$
declare
  v_ns       nhan_su;
  v_cd       kho_cai_dat;
  v_chi_quay boolean;
  v_hom_nay  date := hom_nay_vn();
  v_tu       timestamptz := now() - interval '30 days';
begin
  v_ns := nhan_su_hien_tai();
  select * into v_cd from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id;
  if v_ns.id is null or v_cd.chi_nhanh_id is null or not kho_duoc(p_chi_nhanh_id, 'xem') then
    return;
  end if;
  v_chi_quay := v_ns.vai_tro = 'nhan_vien_quay';

  -- ---- Việc của chính mình bị trả về --------------------------------------
  if kho_duoc(p_chi_nhanh_id, 'nhap') then
    return query
      select 'nhap_bi_tu_choi', 'van_hanh', p.id, null::uuid, p.so_phieu, p.ly_do, null::text, null::numeric, p.duyet_luc
      from kho_phieu_nhap p
      where p.chi_nhanh_id = p_chi_nhanh_id and p.trang_thai = 'tu_choi'
        and p.nguoi_tao = v_ns.id and p.duyet_luc >= v_tu;
  end if;

  if kho_duoc(p_chi_nhanh_id, 'van_hanh') then
    return query
      select 'huy_bi_tu_choi', 'van_hanh', x.id, null::uuid, x.so_phieu, x.ly_do_tu_choi, null::text, null::numeric, x.duyet_luc
      from kho_phieu_xuat x
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'huy' and x.trang_thai = 'tu_choi'
        and x.nguoi_tao = v_ns.id and x.duyet_luc >= v_tu;

    return query
      select 'kiem_ke_tra_ve', 'van_hanh', k.id, k.vi_tri_id, k.so_phieu, k.ly_do, v.loai, null::numeric, k.updated_at
      from kho_kiem_ke k
      join kho_vi_tri v on v.id = k.vi_tri_id
      where k.chi_nhanh_id = p_chi_nhanh_id and k.trang_thai = 'dang_dem'
        and k.ly_do is not null and k.updated_at >= v_tu
        and (not v_chi_quay or v.loai = 'quay');
  end if;

  -- ---- 0032 · Mang hàng ra quầy ---------------------------------------------
  -- Thủ kho (và quản lý): quầy có yêu cầu đang chờ.
  if kho_duoc(p_chi_nhanh_id, 'van_hanh') and not v_chi_quay then
    return query
      select 'yeu_cau_quay', 'van_hanh', y.id, y.vi_tri_id, y.so_phieu, v.ten, v.loai,
             (select count(*) from kho_yeu_cau_quay_dong d where d.yeu_cau_id = y.id)::numeric, y.created_at
      from kho_yeu_cau_quay y
      join kho_vi_tri v on v.id = y.vi_tri_id
      where y.chi_nhanh_id = p_chi_nhanh_id and y.trang_thai = 'cho';
  end if;

  -- NV quầy (và quản lý): hàng đang mang ra, chờ bấm nhận. Quá gio_nhac_chuyen
  -- giờ thì phu = 'qua_gio' (mức đỏ) và mốc dời tới lúc quá giờ — thành thông
  -- báo chưa đọc lần nữa. so = số gói.
  if v_chi_quay or kho_duoc(p_chi_nhanh_id, 'duyet') then
    return query
      select 'hang_dang_chuyen', 'van_hanh', x.id, x.vi_tri_den_id, x.so_phieu, v.ten,
             coalesce(case when x.created_at <= now() - make_interval(hours => v_cd.gio_nhac_chuyen)
                           then 'qua_gio' end, 'quay'),
             (select coalesce(sum(d.so_goi), 0) from kho_phieu_xuat_dong d where d.phieu_xuat_id = x.id)::numeric,
             case when x.created_at <= now() - make_interval(hours => v_cd.gio_nhac_chuyen)
                  then x.created_at + make_interval(hours => v_cd.gio_nhac_chuyen) else x.created_at end
      from kho_phieu_xuat x
      join kho_vi_tri v on v.id = x.vi_tri_den_id
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'chuyen' and x.trang_thai = 'dang_chuyen';
  end if;

  -- ---- Hạn dùng (NV quầy: chỉ hàng ở quầy) ---------------------------------
  return query
    select case when t.tinh_trang_han = 'het_han' then 'het_han' else 'sap_het_han' end,
           'van_hanh', t.lo_id, t.vi_tri_id, t.ma_lo, t.ten_hang || ' · ' || t.ten_vi_tri, t.loai_vi_tri,
           case when t.dem_goi then t.so_goi::numeric else t.so_kg end,
           case when t.tinh_trang_han = 'het_han'
                then kho_luc_vn(t.han_dung + 1, 0)
                else kho_luc_vn(t.han_dung - coalesce(m.canh_bao_truoc_ngay, v_cd.canh_bao_truoc_ngay, 1), 0)
           end
    from kho_v_ton t
    join kho_mat_hang m on m.id = t.mat_hang_id
    where t.chi_nhanh_id = p_chi_nhanh_id and t.loai_vi_tri in ('kho', 'quay')
      and t.tinh_trang_han in ('het_han', 'sap_het')
      and (not v_chi_quay or t.loai_vi_tri = 'quay');

  -- ---- Quầy dưới mức tối thiểu (không tính gói đã hết hạn) -----------------
  return query
    select 'quay_duoi_muc', 'van_hanh', m.id, null::uuid, m.ma, m.ten, null::text, coalesce(c.con_kg, 0),
           coalesce(q.lan_cuoi, kho_luc_vn(v_hom_nay, 0))
    from kho_mat_hang m
    left join lateral (
      select sum(t.so_kg) as con_kg
      from kho_v_ton t
      where t.chi_nhanh_id = p_chi_nhanh_id and t.mat_hang_id = m.id
        and t.loai_vi_tri = 'quay' and t.tinh_trang_han <> 'het_han'
    ) c on true
    left join lateral (
      -- Mốc = lần cuối hàng này ra/vào quầy: đọc rồi thì chỉ báo lại khi quầy động tới nó.
      select max(s.created_at) as lan_cuoi
      from kho_so_cai s
      join kho_vi_tri v on v.id = s.vi_tri_id
      where s.chi_nhanh_id = p_chi_nhanh_id and s.mat_hang_id = m.id and v.loai = 'quay'
    ) q on true
    where m.dang_dung and m.ton_toi_thieu_kg is not null
      and coalesce(c.con_kg, 0) < m.ton_toi_thieu_kg;

  -- ---- Quầy chưa đếm hôm qua (sau giờ chốt ngày) ---------------------------
  if (kho_duoc(p_chi_nhanh_id, 'van_hanh') or kho_duoc(p_chi_nhanh_id, 'duyet'))
     and bay_gio_vn() >= v_hom_nay::timestamp + make_interval(hours => v_cd.gio_chot_ngay) then
    return query
      select 'quay_chua_dem', 'van_hanh', v.id, v.id, null::text, v.ten, 'quay'::text, null::numeric,
             kho_luc_vn(v_hom_nay, v_cd.gio_chot_ngay)
      from kho_vi_tri v
      where v.chi_nhanh_id = p_chi_nhanh_id and v.loai = 'quay' and v.dang_dung
        and (exists (select 1 from kho_ton t where t.vi_tri_id = v.id and (t.so_kg > 0 or t.so_goi > 0))
             or exists (select 1 from kho_so_cai s where s.vi_tri_id = v.id and s.ngay = v_hom_nay - 1))
        and not exists (
          select 1 from kho_kiem_ke k
          where k.vi_tri_id = v.id and k.gui_luc >= kho_luc_vn(v_hom_nay - 1, 10));
  end if;

  -- ---- Chờ duyệt ------------------------------------------------------------
  -- 0031: phiếu nhập theo quyền duyet_nhap (có kế toán); hủy và kiểm kê vẫn duyet.
  if kho_duoc(p_chi_nhanh_id, 'duyet_nhap') then
    return query
      select 'cho_duyet_nhap', 'nhac_nho', p.id, p.nha_cung_cap_id, p.so_phieu, n.ten, null::text, null::numeric, coalesce(p.gui_luc, p.updated_at)
      from kho_phieu_nhap p
      left join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
      where p.chi_nhanh_id = p_chi_nhanh_id and p.trang_thai = 'cho_duyet';
  end if;

  if kho_duoc(p_chi_nhanh_id, 'duyet') then
    return query
      select 'cho_duyet_huy', 'nhac_nho', x.id, x.vi_tri_id, x.so_phieu, v.ten, v.loai, null::numeric, x.created_at
      from kho_phieu_xuat x
      join kho_vi_tri v on v.id = x.vi_tri_id
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'huy' and x.trang_thai = 'cho_duyet';

    -- 0032: quầy nhận thiếu — quản lý trả về kho hoặc ghi mất. so = số gói thiếu.
    return query
      select 'chuyen_nhan_thieu', 'nhac_nho', x.id, x.vi_tri_den_id, x.so_phieu, v.ten, v.loai,
             (select coalesce(sum(d.so_goi - coalesce(d.so_goi_nhan, 0)), 0) from kho_phieu_xuat_dong d
               where d.phieu_xuat_id = x.id)::numeric,
             coalesce(x.nhan_luc, x.updated_at)
      from kho_phieu_xuat x
      join kho_vi_tri v on v.id = x.vi_tri_den_id
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'chuyen' and x.trang_thai = 'nhan_thieu';

    return query
      select 'cho_duyet_kiem_ke', 'nhac_nho', k.id, k.vi_tri_id, k.so_phieu, v.ten, v.loai, null::numeric, coalesce(k.gui_luc, k.updated_at)
      from kho_kiem_ke k
      join kho_vi_tri v on v.id = k.vi_tri_id
      where k.chi_nhanh_id = p_chi_nhanh_id and k.trang_thai = 'cho_duyet';

    -- 0033: pha lóc thu hồi thấp hơn dự kiến quá ngưỡng — tới khi quản lý bấm
    -- "Đã xem". so = thu hồi %, phu = dự kiến % (chữ số, dấu chấm), ten = tên tảng.
    return query
      select 'thu_hoi_thap', 'nhac_nho', f.id, f.mat_hang_vao_id, f.so_phieu, m.ten, f.ty_le_du_kien::text,
             f.ty_le_thu_hoi::numeric, f.chot_luc
      from kho_phien_pha f
      join kho_mat_hang m on m.id = f.mat_hang_vao_id
      where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'da_chot'
        and f.thu_hoi_thap and f.da_xem_luc is null;
  end if;

  -- ---- 0037 · Bán hàng iPOS (quản lý, chủ) ----------------------------------
  -- ipos_cho_xu_ly: so = số dòng chưa khớp + thiếu hàng; phu = số chưa khớp.
  -- Mốc = dòng chờ mới nhất vào hộp thư (thử lại mỗi lượt không làm "chưa đọc" lại).
  if kho_duoc(p_chi_nhanh_id, 'duyet') then
    return query
      select 'ipos_cho_xu_ly', 'nhac_nho', null::uuid, null::uuid, null::text, null::text,
             (count(*) filter (where d.trang_thai = 'chua_khop'))::text, count(*)::numeric, max(d.created_at)
      from kho_ipos_dong d
      where d.chi_nhanh_id = p_chi_nhanh_id and d.trang_thai in ('chua_khop', 'thieu_hang')
      having count(*) > 0;

    -- ipos_mat_ket_noi (0042 — iPOS tự đẩy hóa đơn): phu = 'loi' (lượt thử lại /
    -- đọc thực đơn cuối bị lỗi) | 'cham' (trong giờ mở cửa, quá gio_mat_ket_noi
    -- giờ không nhận hóa đơn nào); so = số phút từ hóa đơn cuối nhận được
    -- (null = chưa nhận hóa đơn nào).
    return query
      select 'ipos_mat_ket_noi', 'he_thong', null::uuid, null::uuid, null::text, null::text,
             coalesce(case when c.loi_tu_luc is not null then 'loi' end, 'cham'),
             round(extract(epoch from now() - c.nhan_hd_luc) / 60)::numeric,
             case when c.loi_tu_luc is not null then c.loi_tu_luc
                  else kho_ipos_moc_nhan(c) + make_interval(hours => c.gio_mat_ket_noi) end
      from kho_ipos_cau_hinh c
      where c.chi_nhanh_id = p_chi_nhanh_id and kho_ipos_mat_ket_noi(c);

    -- ---- 0038 · Định lượng: bếp nhận lệch định mức (7 ngày gần nhất) --------
    -- Chỉ tính khi chi nhánh có định lượng (không tốn công cho chi nhánh chưa dùng).
    if exists (select 1 from kho_dinh_luong dl where dl.chi_nhanh_id = p_chi_nhanh_id)
       and exists (select 1 from kho_dinh_muc_ban(p_chi_nhanh_id, v_hom_nay - 6, v_hom_nay)) then
      return query
        select 'dinh_muc_lech', 'nhac_nho', t.mat_hang_id, null::uuid, m.ma, m.ten,
               (t.kg_xuat_bep - t.kg_ly_thuyet)::text,
               round((t.kg_xuat_bep - t.kg_ly_thuyet) / t.kg_ly_thuyet * 100, 1),
               kho_luc_vn(v_hom_nay, 0)
        from kho_dinh_muc_tinh(p_chi_nhanh_id, v_hom_nay - 6, v_hom_nay) t
        join kho_mat_hang m on m.id = t.mat_hang_id
        where t.kg_ly_thuyet > 0
          and abs(t.kg_xuat_bep - t.kg_ly_thuyet) > t.kg_ly_thuyet * v_cd.nguong_dinh_muc_pt / 100;
    end if;
  end if;

  -- ---- 0039 · Đơn đặt hàng quá ngày giao mà chưa nhận chút nào (quản lý, chủ)
  -- so = số ngày trễ, phu = ngày giao dự kiến (YYYY-MM-DD), mốc = 0 giờ ngày
  -- sau ngày giao dự kiến.
  if kho_duoc(p_chi_nhanh_id, 'duyet') then
    return query
      select 'don_dat_tre', 'nhac_nho', d.id, d.nha_cung_cap_id, d.so_phieu, n.ten,
             to_char(d.ngay_giao_du_kien, 'YYYY-MM-DD'), (v_hom_nay - d.ngay_giao_du_kien)::numeric,
             kho_luc_vn(d.ngay_giao_du_kien + 1, 0)
      from kho_don_dat d
      join kho_nha_cung_cap n on n.id = d.nha_cung_cap_id
      where d.chi_nhanh_id = p_chi_nhanh_id and d.trang_thai = 'da_gui'
        and d.ngay_giao_du_kien < v_hom_nay;
  end if;

  -- ---- Công nợ (chỉ số phiếu, không số tiền) --------------------------------
  if kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    return query
      select 'cong_no_qua_han', 'nhac_nho', c.id, c.nha_cung_cap_id, c.so_phieu, c.ten_nha_cung_cap, null::text,
             c.so_ngay_qua_han::numeric, kho_luc_vn(c.han_thanh_toan + 1, 0)
      from kho_v_cong_no_phieu c
      where c.chi_nhanh_id = p_chi_nhanh_id and c.qua_han;

    return query
      select 'cong_no_den_han', 'nhac_nho', c.id, c.nha_cung_cap_id, c.so_phieu, c.ten_nha_cung_cap, null::text,
             (c.han_thanh_toan - v_hom_nay)::numeric, kho_luc_vn(c.han_thanh_toan - 7, 0)
      from kho_v_cong_no_phieu c
      where c.chi_nhanh_id = p_chi_nhanh_id and c.con_no > 0
        and c.han_thanh_toan between v_hom_nay and v_hom_nay + 7;

    return query
      select 'chua_doi_chieu', 'nhac_nho', c.id, c.nha_cung_cap_id, c.so_phieu, c.ten_nha_cung_cap, null::text, null::numeric,
             coalesce(p.duyet_luc, p.updated_at)
      from kho_v_cong_no_phieu c
      join kho_phieu_nhap p on p.id = c.id
      where c.chi_nhanh_id = p_chi_nhanh_id and not c.da_doi_chieu;

    -- 0040: thủ kho đã ghi kg hàng trả NCC, chờ kế toán xác nhận số tiền giảm
    -- trừ. so = tổng kg trả (không tiền), mốc = lúc ghi.
    return query
      select 'tra_hang_cho_tien', 'nhac_nho', x.id, pn.nha_cung_cap_id, x.so_phieu, n.ten, null::text,
             (select coalesce(sum(d.so_kg), 0) from kho_phieu_xuat_dong d where d.phieu_xuat_id = x.id)::numeric,
             x.created_at
      from kho_phieu_xuat x
      join kho_phieu_nhap pn on pn.id = x.phieu_nhap_id
      left join kho_nha_cung_cap n on n.id = pn.nha_cung_cap_id
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'tra_ncc' and x.trang_thai = 'cho_xac_nhan_tien';
  end if;

  -- ---- 0040 · Số tài khoản ngân hàng NCC bị đổi (chỉ chủ) --------------------
  -- Chỉ khi số tài khoản CŨ đã có (đổi thật, không phải điền lần đầu) và số
  -- (bỏ dấu cách) hoặc ngân hàng thật sự khác — gõ thêm dấu cách không báo. NCC dùng
  -- chung mọi chi nhánh nên chi nhánh nào chủ cũng thấy. ma = số tài khoản mới,
  -- ten = tên NCC, phu = người đổi, mốc = lúc đổi.
  if kho_duoc(p_chi_nhanh_id, 'cai_dat_goc') then
    return query
      select 'ncc_doi_tai_khoan', 'nhac_nho', k.id, k.nha_cung_cap_id, k.so_tai_khoan_moi, n.ten, ns.ho_ten,
             null::numeric, k.luc
      from kho_ncc_tk_nhat_ky k
      join kho_nha_cung_cap n on n.id = k.nha_cung_cap_id
      left join nhan_su ns on ns.id = k.nguoi_doi
      where k.so_tai_khoan_cu is not null and k.luc >= v_tu
        and (regexp_replace(k.so_tai_khoan_cu, '\s', '', 'g')
               is distinct from regexp_replace(coalesce(k.so_tai_khoan_moi, ''), '\s', '', 'g')
             or lower(btrim(coalesce(k.ngan_hang_cu, ''))) is distinct from lower(btrim(coalesce(k.ngan_hang_moi, ''))));
  end if;

  -- ---- Phiên pha lóc để nháp quá một ngày ------------------------------------
  if kho_duoc(p_chi_nhanh_id, 'pha_loc') then
    return query
      select 'pha_nhap_lau', 'he_thong', f.id, null::uuid, f.so_phieu, m.ten, null::text, null::numeric, f.created_at + interval '1 day'
      from kho_phien_pha f
      join kho_mat_hang m on m.id = f.mat_hang_vao_id
      where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'nhap'
        and f.created_at < now() - interval '1 day';
  end if;
end;
$$;


comment on function kho_su_kien is
  'NỘI BỘ. 0037: thêm ipos_cho_xu_ly, ipos_mat_ket_noi. 0038: thêm dinh_muc_lech. 0039: thêm don_dat_tre. 0040: thêm tra_hang_cho_tien, ncc_doi_tai_khoan. 0042: ipos_mat_ket_noi theo mô hình iPOS đẩy hóa đơn. Mọi sự kiện thông báo người đang đăng nhập được thấy ở một chi nhánh, suy ra từ chứng từ. Gọi qua kho_dem_viec / kho_thong_bao.';



-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_ipos_bo_pii(jsonb) from authenticated';
    execute 'revoke execute on function kho_ipos_goi_theo_kg(uuid, uuid, numeric) from authenticated';
    execute 'revoke execute on function kho_ipos_moc_nhan(kho_ipos_cau_hinh) from authenticated';
    execute 'revoke execute on function kho_ipos_nhan_hd(uuid, uuid, jsonb, boolean) from authenticated';
    execute 'revoke execute on function kho_ipos_ghi_dong(uuid) from authenticated';
    execute 'revoke execute on function kho_ipos_mat_ket_noi(kho_ipos_cau_hinh) from authenticated';
    execute 'revoke execute on function kho_dinh_muc_ban(uuid, date, date) from authenticated';
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
