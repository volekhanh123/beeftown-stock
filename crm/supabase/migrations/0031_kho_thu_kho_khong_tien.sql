-- =============================================================================
-- BEEFTOWN KHO — 0031 · THỦ KHO KHÔNG THẤY TIỀN · NHẬN HÀNG CHỈ KG · ĐIỀN GIÁ KHI DUYỆT
-- =============================================================================
-- Chủ nhà hàng đã chốt (GĐ5a):
--
--   · Thủ kho chỉ CHỤP hóa đơn (bắt buộc), CÂN, ĐẾM. Thủ kho KHÔNG thấy tiền:
--     giá nhập, giá vốn, thành tiền, lãi.
--   · KẾ TOÁN hoặc QUẢN LÝ điền giá — đọc từ ảnh hóa đơn thủ kho đã chụp. Kế
--     toán được duyệt phiếu nhập luôn, không phải chờ quản lý.
--   · Giá nhập cao hơn lần trước (cùng mặt hàng, cùng nhà cung cấp) quá
--     kho_cai_dat.nguong_gia_mua_pt (mặc định 5%) thì CẢNH BÁO, không chặn.
--   · Duyệt phiếu mua bắt buộc mọi dòng có đơn giá > 0. Trước đây bỏ trống
--     đơn giá vẫn duyệt được, lô sinh ra có giá vốn 0 đồng.
--
-- CÁCH LÀM
--
--   1. Bảng quyền: thủ kho ra khỏi xem_gia. Thêm việc mới duyet_nhap (chủ,
--      quản lý, kế toán) cho điền giá + duyệt/từ chối phiếu nhập. duyet giữ
--      nguyên (chủ, quản lý): duyệt hủy hàng, kiểm kê, hủy phiếu đã duyệt.
--      Mọi policy đang hỏi xem_gia (phiếu nhập, nhà cung cấp, giá vốn lô,
--      ảnh hóa đơn...) tự đóng với thủ kho — không phải sửa từng cái.
--   2. Phiên pha lóc: ba bảng này KHÔNG có cột tiền (giá vốn nằm ở
--      kho_lo_gia), nên mở đọc cho vai pha_loc — thủ kho vẫn làm pha lóc.
--      Riêng kho_phien_pha_ra.gia_ban_kg là GIÁ BÁN chụp lúc chốt, cùng con số
--      công khai với kho_mat_hang.gia_ban_kg — không phải giá nhập hay giá vốn.
--   3. Thủ kho mất quyền đọc bảng phiếu nhập và nhà cung cấp, nên có một bộ
--      hàm đọc CHỈ KG (đuôi _kg): không trả đơn giá, thành tiền, thuế, chi
--      phí, giá vốn, không trả cả đường dẫn ảnh (ảnh hóa đơn có giá — chỉ vai
--      xem_gia xem được, 0021). Thủ kho thấy "đã chụp N ảnh".
--   4. Ghi: kho_luu_phieu_nhap_kg (thủ kho, không có ô giá, ảnh chỉ CỘNG thêm)
--      và kho_dien_gia_phieu_nhap (duyet_nhap). kho_so_sanh_gia_nhap trả mức
--      chênh với lần nhập trước để trang duyệt tô đỏ.
--   5. Thay THÂN (cùng chữ ký) các hàm có luật đổi. Chép nguyên văn phần còn
--      lại; chỗ đổi có ghi "0031" hoặc "MỚI (0031)".
--
-- KHÔNG ĐỔI CHỮ KÝ HÀM CÔNG KHAI NÀO. kho_luu_phieu_nhap (0020) giữ chữ ký:
-- trang nhập hàng cũ của vai xem giá dùng nó (và chỉ qua nó mới xóa được ảnh).
-- Nhưng hàm đó chỉ hỏi quyền nhap, nên thủ kho gọi thẳng vẫn ghi được giá,
-- thuế, chi phí, hạn thanh toán và xóa được ảnh — mục 6 bịt chỗ này.
-- =============================================================================


-- =============================================================================
-- 1 · BẢNG TRA QUYỀN — thủ kho ra khỏi xem_gia, thêm duyet_nhap
-- =============================================================================
--   xem         tồn, lô, hạn dùng, biến động kho (không có cột tiền nào)
--   xem_gia     giá nhập, giá vốn, phiếu nhập, nhà cung cấp, ảnh hóa đơn,
--               công nợ, báo cáo có tiền. KHÔNG còn thủ kho (0031).
--   nhap        tạo / sửa / gửi / rút phiếu nhập (thủ kho: qua hàm _kg)
--   duyet       duyệt hủy hàng, duyệt kiểm kê, hủy phiếu nhập ĐÃ duyệt
--   duyet_nhap  điền giá, duyệt, từ chối phiếu nhập (0031 — có kế toán)
--   pha_loc     lưu, chốt, mở lại phiên pha lóc; đọc phiên pha lóc (kg)
--   van_hanh    chuyển quầy, xuất bếp, đề nghị hủy, đếm kiểm kê
--   ke_toan     đối chiếu hóa đơn, thanh toán, trả hàng nhà cung cấp
--   danh_muc    mặt hàng, công thức pha lóc, vị trí, lý do, mã vạch
--   ncc         nhà cung cấp
--   cai_dat_goc định nghĩa ô thông tin thêm, cách tính giá vốn, nguồn số bán
--
-- web/src/lib/kho/chung.ts soi gương bảng này; test-kho-quyen.mjs so từng dòng.
-- =============================================================================
create or replace function kho_vai_duoc(p_viec text)
returns vai_tro[]
language sql
immutable
set search_path = public
as $$
  select (case p_viec
    when 'xem'         then array['chu_so_huu','quan_ly','thu_kho','nhan_vien_quay','ke_toan']
    when 'xem_gia'     then array['chu_so_huu','quan_ly','ke_toan']
    when 'nhap'        then array['chu_so_huu','quan_ly','thu_kho']
    when 'duyet'       then array['chu_so_huu','quan_ly']
    when 'duyet_nhap'  then array['chu_so_huu','quan_ly','ke_toan']
    when 'pha_loc'     then array['chu_so_huu','quan_ly','thu_kho']
    when 'van_hanh'    then array['chu_so_huu','quan_ly','thu_kho','nhan_vien_quay']
    when 'ke_toan'     then array['chu_so_huu','quan_ly','ke_toan']
    when 'danh_muc'    then array['chu_so_huu','quan_ly']
    when 'ncc'         then array['chu_so_huu','quan_ly','ke_toan']
    when 'cai_dat_goc' then array['chu_so_huu']
    else array[]::text[]
  end)::vai_tro[];
$$;

comment on function kho_vai_duoc is
  'Bảng tra quyền kho: việc → danh sách vai. Nguồn sự thật duy nhất; lib/kho/chung.ts soi gương và test-kho-quyen.mjs so khớp. 0031: thủ kho không còn xem_gia; thêm duyet_nhap (chủ, quản lý, kế toán).';


-- =============================================================================
-- 2 · PHIÊN PHA LÓC — mở đọc cho vai pha_loc
-- =============================================================================
-- Trước đây ba bảng này hỏi xem_gia (thủ kho có xem_gia nên không ai để ý).
-- Không có cột tiền nào: tổng kết là kg và %, giá vốn nằm ở kho_lo_gia.
-- kho_v_phien_pha là view security_invoker nên đi theo policy mới luôn.
drop policy kho_phien_pha_doc on kho_phien_pha;
drop policy kho_phien_pha_vao_doc on kho_phien_pha_vao;
drop policy kho_phien_pha_ra_doc on kho_phien_pha_ra;

create policy kho_phien_pha_doc on kho_phien_pha
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[])
                    or chi_nhanh_id = any ((select kho_cn_duoc('pha_loc'))::uuid[]));
create policy kho_phien_pha_vao_doc on kho_phien_pha_vao
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[])
                    or chi_nhanh_id = any ((select kho_cn_duoc('pha_loc'))::uuid[]));
create policy kho_phien_pha_ra_doc on kho_phien_pha_ra
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[])
                    or chi_nhanh_id = any ((select kho_cn_duoc('pha_loc'))::uuid[]));


-- =============================================================================
-- 3 · ĐỌC CHỈ KG — cho thủ kho
-- =============================================================================
-- Hàm definer (thủ kho không đọc được bảng phiếu nhập nữa), kiểm quyền nhap
-- đầu tiên. Luật của cả mục: KHÔNG trả trường tiền nào. test-kho-thu-kho.mjs
-- quét đệ quy mọi khóa trả về.
-- =============================================================================

-- Nhà cung cấp để chọn khi nhận hàng: chỉ id, tên, lần nhập gần nhất ở chi
-- nhánh này (không số điện thoại, tài khoản ngân hàng, số ngày nợ). Người
-- giao hàng quen đứng đầu danh sách.
create or replace function kho_ds_ncc_nhap(p_chi_nhanh_id uuid)
returns table (id uuid, ten text, lan_cuoi date)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not kho_duoc(p_chi_nhanh_id, 'nhap') then
    raise exception 'Tài khoản của bạn không được nhận hàng ở chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;

  return query
    select n.id, n.ten, x.lan_cuoi
    from kho_nha_cung_cap n
    left join lateral (
      select max(p.ngay_nhap) as lan_cuoi
      from kho_phieu_nhap p
      where p.nha_cung_cap_id = n.id and p.chi_nhanh_id = p_chi_nhanh_id
        and p.trang_thai <> 'da_huy'
    ) x on true
    where n.dang_dung
    order by x.lan_cuoi desc nulls last, n.ten;
end;
$$;

comment on function kho_ds_ncc_nhap is
  'Nhà cung cấp đang dùng để chọn khi nhận hàng (quyền nhap): id, tên, lần nhập gần nhất ở chi nhánh này — gần nhất lên đầu. Không có thông tin liên hệ, ngân hàng hay tiền.';

-- Danh sách phiếu nhập, chỉ kg. p_trang_thai null = mọi trạng thái. p_q tìm
-- theo số phiếu, tên nhà cung cấp, số hóa đơn (không phân biệt hoa thường;
-- dấu % và _ người gõ được hiểu đúng là chữ). Mới nhất trước.
create or replace function kho_ds_phieu_nhap_kg(
  p_chi_nhanh_id uuid,
  p_trang_thai   text,
  p_q            text,
  p_tu           date,
  p_den          date,
  p_cua_toi      boolean,
  p_gioi_han     int,
  p_bo_qua       int
)
returns table (
  id uuid, so_phieu text, loai text, trang_thai text, ten_nha_cung_cap text,
  ten_vi_tri text, ngay_nhap date, so_hoa_don text, so_dong int, tong_kg numeric,
  tong_goi int, so_anh int, ly_do text, nguoi_tao uuid, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_nv  uuid;
  v_tim text;
begin
  if not kho_duoc(p_chi_nhanh_id, 'nhap') then
    raise exception 'Tài khoản của bạn không được xem phiếu nhận hàng ở chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := (nhan_su_hien_tai()).id;

  v_tim := nullif(btrim(coalesce(p_q, '')), '');
  if v_tim is not null then
    v_tim := '%' || replace(replace(replace(left(v_tim, 60), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  return query
    select p.id, p.so_phieu, p.loai, p.trang_thai, n.ten, v.ten,
           p.ngay_nhap, p.so_hoa_don,
           coalesce(d.so_dong, 0)::int, coalesce(d.tong_kg, 0)::numeric, coalesce(d.tong_goi, 0)::int,
           cardinality(p.anh)::int, p.ly_do, p.nguoi_tao, p.created_at
    from kho_phieu_nhap p
    left join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
    left join kho_vi_tri v on v.id = p.vi_tri_id
    left join lateral (
      select count(*) as so_dong, sum(dd.so_kg) as tong_kg, sum(dd.so_goi) as tong_goi
      from kho_phieu_nhap_dong dd where dd.phieu_nhap_id = p.id
    ) d on true
    where p.chi_nhanh_id = p_chi_nhanh_id
      and (p_trang_thai is null or p.trang_thai = p_trang_thai)
      and (p_tu is null or p.ngay_nhap >= p_tu)
      and (p_den is null or p.ngay_nhap <= p_den)
      and (not coalesce(p_cua_toi, false) or p.nguoi_tao = v_nv)
      and (v_tim is null
           or p.so_phieu ilike v_tim
           or n.ten ilike v_tim
           or p.so_hoa_don ilike v_tim)
    order by p.ngay_nhap desc, p.created_at desc, p.id
    limit least(greatest(coalesce(p_gioi_han, 30), 1), 200)
    offset greatest(coalesce(p_bo_qua, 0), 0);
end;
$$;

comment on function kho_ds_phieu_nhap_kg is
  'Danh sách phiếu nhập cho người nhận hàng (quyền nhap): số dòng, tổng kg, tổng gói, số ảnh. KHÔNG có tiền. p_gioi_han 1..200, mới nhất trước.';

-- Một phiếu nhập, chỉ kg. Không trả đường dẫn ảnh (chỉ số ảnh) và không trả
-- trường tiền nào — kể cả hạn thanh toán.
create or replace function kho_doc_phieu_nhap_kg(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pn kho_phieu_nhap;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được xem'
      using errcode = 'insufficient_privilege';
  end if;

  return jsonb_build_object(
    'id',               v_pn.id,
    'so_phieu',         v_pn.so_phieu,
    'loai',             v_pn.loai,
    'trang_thai',       v_pn.trang_thai,
    'nha_cung_cap_id',  v_pn.nha_cung_cap_id,
    'ten_nha_cung_cap', (select n.ten from kho_nha_cung_cap n where n.id = v_pn.nha_cung_cap_id),
    'vi_tri_id',        v_pn.vi_tri_id,
    'ten_vi_tri',       (select v.ten from kho_vi_tri v where v.id = v_pn.vi_tri_id),
    'ngay_nhap',        v_pn.ngay_nhap,
    'so_hoa_don',       v_pn.so_hoa_don,
    'ngay_hoa_don',     v_pn.ngay_hoa_don,
    'ghi_chu',          v_pn.ghi_chu,
    'so_anh',           cardinality(v_pn.anh),
    'truong_them',      v_pn.truong_them,
    'ly_do',            v_pn.ly_do,
    'phien_ban',        v_pn.phien_ban,
    'nguoi_tao',        v_pn.nguoi_tao,
    'nguoi_gui',        v_pn.nguoi_gui,
    'gui_luc',          v_pn.gui_luc,
    'nguoi_duyet',      v_pn.nguoi_duyet,
    'duyet_luc',        v_pn.duyet_luc,
    'created_at',       v_pn.created_at,
    'dong', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id',            d.id,
               'thu_tu',        d.thu_tu,
               'mat_hang_id',   d.mat_hang_id,
               'ten_mat_hang',  m.ten,
               'dem_goi',       m.dem_goi,
               'don_vi_goi',    m.don_vi_goi,
               'so_goi',        d.so_goi,
               'so_kg',         d.so_kg,
               'so_lo_ncc',     d.so_lo_ncc,
               'ngay_san_xuat', d.ngay_san_xuat,
               'han_dung',      d.han_dung,
               'truong_them',   d.truong_them,
               'lo_id',         d.lo_id)
             order by d.thu_tu, d.id)
      from kho_phieu_nhap_dong d
      join kho_mat_hang m on m.id = d.mat_hang_id
      where d.phieu_nhap_id = p_id), '[]'::jsonb));
end;
$$;

comment on function kho_doc_phieu_nhap_kg is
  'Một phiếu nhập cho người nhận hàng (quyền nhap trên chi nhánh của phiếu): đầu phiếu, số ảnh, các dòng kg/gói/hạn. KHÔNG có tiền, KHÔNG có đường dẫn ảnh.';

-- Xem thử phiên pha lóc bằng kg và %: tự tính từ các dòng, KHÔNG gọi
-- kho_tinh_phien_pha (hàm đó đọc giá vốn và có thể ném lỗi về giá trị).
--   nhom: thit | phu_pham | bo — cùng cách chia nhóm với kho_tinh_phien_pha.
create or replace function kho_xem_thu_phien_pha_kg(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ph      kho_phien_pha;
  v_kg_vao  numeric;
  v_kg_ra   numeric;
  v_kg_thit numeric;
  v_kg_pp   numeric;
  v_kg_bo   numeric;
  v_dong    jsonb;
  v_canh_bao text[] := '{}';
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found or not (kho_duoc(v_ph.chi_nhanh_id, 'pha_loc') or kho_duoc(v_ph.chi_nhanh_id, 'xem_gia')) then
    raise exception 'Không tìm thấy phiên pha lóc, hoặc tài khoản không được xem'
      using errcode = 'insufficient_privilege';
  end if;

  select coalesce(sum(v.so_kg), 0) into v_kg_vao
  from kho_phien_pha_vao v where v.phien_pha_id = p_id;

  with ra as (
    select r.id, r.thu_tu, r.mat_hang_id, m.ten, r.so_kg,
           case when r.xu_ly = 'bo' then 'bo'
                when m.loai = 'phu_pham' then 'phu_pham'
                else 'thit' end as nhom
    from kho_phien_pha_ra r
    join kho_mat_hang m on m.id = r.mat_hang_id
    where r.phien_pha_id = p_id
  )
  select coalesce(sum(so_kg), 0),
         coalesce(sum(so_kg) filter (where nhom = 'thit'), 0),
         coalesce(sum(so_kg) filter (where nhom = 'phu_pham'), 0),
         coalesce(sum(so_kg) filter (where nhom = 'bo'), 0),
         coalesce(jsonb_agg(jsonb_build_object(
           'ra_id', id, 'mat_hang_id', mat_hang_id, 'ten', ten, 'nhom', nhom, 'so_kg', so_kg,
           'ty_le', case when v_kg_vao > 0 then round(so_kg * 100 / v_kg_vao, 2) end)
           order by thu_tu, id), '[]'::jsonb)
    into v_kg_ra, v_kg_thit, v_kg_pp, v_kg_bo, v_dong
  from ra;

  if v_kg_vao = 0 then
    v_canh_bao := v_canh_bao || 'Chưa chọn tảng nào đem pha'::text;
  end if;
  if jsonb_array_length(v_dong) = 0 then
    v_canh_bao := v_canh_bao || 'Chưa nhập phần nào cắt ra'::text;
  end if;
  -- Cùng ngưỡng 0,05 kg với kho_chot_phien_pha: vượt là chốt bị từ chối.
  if v_kg_vao > 0 and v_kg_ra > v_kg_vao + 0.05 then
    v_canh_bao := v_canh_bao || 'Tổng kg ra lớn hơn kg vào — kiểm lại số cân'::text;
  end if;

  return jsonb_build_object(
    'tong_kg_vao',    v_kg_vao,
    'kg_thit',        v_kg_thit,
    'kg_phu_pham',    v_kg_pp,
    'kg_bo',          v_kg_bo,
    'kg_hao_hut',     v_kg_vao - v_kg_thit - v_kg_pp - v_kg_bo,
    'ty_le_thu_hoi',  case when v_kg_vao > 0 then round(v_kg_thit * 100 / v_kg_vao, 2) end,
    'dong',           v_dong,
    'canh_bao',       to_jsonb(v_canh_bao));
end;
$$;

comment on function kho_xem_thu_phien_pha_kg is
  'Xem thử phiên pha lóc bằng kg và % (quyền pha_loc hoặc xem_gia): tổng vào, thịt, phụ phẩm, bỏ, hao hụt, thu hồi, từng phần ra. KHÔNG có tiền.';


-- =============================================================================
-- 4 · GHI — thủ kho lưu kg, kế toán / quản lý điền giá
-- =============================================================================

-- Lưu phiếu nhận hàng CHỈ KG. Cùng các kiểm tra như kho_luu_phieu_nhap (0020),
-- khác bốn chỗ:
--   · dòng hàng KHÔNG được có khóa don_gia_kg (có là báo lỗi, không lặng lẽ bỏ);
--   · ảnh p_anh_them được CỘNG vào ảnh đang có, bỏ trùng — thủ kho không xóa
--     được ảnh (xóa là việc của vai xem giá qua kho_luu_phieu_nhap);
--   · giữ nguyên tiền thuế, chi phí khác, hạn thanh toán đang có;
--   · thay dòng thì mang đơn giá cũ theo mặt hàng (dòng đầu tiên cùng món) sang
--     dòng mới — kế toán điền giá rồi, thủ kho sửa kg, giá không mất.
create or replace function kho_luu_phieu_nhap_kg(
  p_id              uuid,
  p_chi_nhanh_id    uuid,
  p_ma_gui          uuid,
  p_phien_ban       int,
  p_loai            text,
  p_nha_cung_cap_id uuid,
  p_vi_tri_id       uuid,
  p_ngay_nhap       date,
  p_so_hoa_don      text,
  p_ngay_hoa_don    date,
  p_ghi_chu         text,
  p_anh_them        text[],
  p_truong_them     jsonb,
  p_dong            jsonb
)
returns table (phieu_id uuid, phien_ban_moi int, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv   nhan_su;
  v_pn   kho_phieu_nhap;
  v_id   uuid;
  v_pb   int;
  v_anh  text[];
  v_a    text;
  v_dong jsonb;
  v_i    int := 0;
  v_gia  jsonb := '{}';
begin
  if not kho_duoc(p_chi_nhanh_id, 'nhap') then
    raise exception 'Tài khoản của bạn không được lập phiếu nhập'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();

  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho — vào Cài đặt kho, bấm "Bắt đầu dùng kho"'
      using errcode = 'check_violation';
  end if;

  if p_loai is null or p_loai not in ('mua', 'ton_dau') then
    raise exception 'Loại phiếu nhập không hợp lệ' using errcode = 'check_violation';
  end if;
  if p_ngay_nhap is null or p_ngay_nhap > hom_nay_vn() then
    raise exception 'Ngày nhập không được sau hôm nay' using errcode = 'check_violation';
  end if;
  if p_ngay_nhap < hom_nay_vn() - 90 then
    raise exception 'Ngày nhập quá 90 ngày trước — kiểm tra lại ngày' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from kho_vi_tri
                 where id = p_vi_tri_id and chi_nhanh_id = p_chi_nhanh_id
                   and dang_dung and loai in ('kho', 'quay')) then
    raise exception 'Chọn nơi nhận hàng là một kho hoặc quầy đang dùng'
      using errcode = 'check_violation';
  end if;
  if p_loai = 'ton_dau' and p_nha_cung_cap_id is not null then
    raise exception 'Phiếu tồn đầu kỳ không có nhà cung cấp'
      using errcode = 'check_violation';
  end if;
  if p_nha_cung_cap_id is not null and not exists (
       select 1 from kho_nha_cung_cap where id = p_nha_cung_cap_id and dang_dung) then
    raise exception 'Nhà cung cấp không có hoặc đã ngừng dùng' using errcode = 'check_violation';
  end if;

  -- Dòng hàng: không có ô giá. Kiểm TRƯỚC khi ghi gì.
  if p_dong is not null and jsonb_typeof(p_dong) = 'array' then
    for v_dong in select value from jsonb_array_elements(p_dong) loop
      v_i := v_i + 1;
      if jsonb_typeof(v_dong) = 'object' and v_dong ? 'don_gia_kg' then
        raise exception 'Dòng %: người nhận hàng không điền đơn giá — kế toán hoặc quản lý điền khi duyệt', v_i
          using errcode = 'check_violation';
      end if;
    end loop;
  end if;

  if p_id is null then
    select pn.id, pn.phien_ban into v_id, v_pb
    from kho_phieu_nhap pn where pn.ma_gui = p_ma_gui;
    if found then
      return query select v_id, v_pb, true;
      return;
    end if;
    v_anh := '{}';
  else
    select * into v_pn from kho_phieu_nhap where kho_phieu_nhap.id = p_id for update;
    if not found or v_pn.chi_nhanh_id <> p_chi_nhanh_id then
      raise exception 'Không tìm thấy phiếu nhập' using errcode = 'foreign_key_violation';
    end if;
    if v_pn.trang_thai = 'cho_duyet' then
      raise exception 'Phiếu đang chờ duyệt — rút về rồi mới sửa được' using errcode = 'check_violation';
    end if;
    if v_pn.trang_thai not in ('nhap', 'tu_choi') then
      raise exception 'Phiếu % đã % — không sửa được nữa', v_pn.so_phieu,
        case v_pn.trang_thai when 'da_duyet' then 'được duyệt' else 'bị hủy' end
        using errcode = 'check_violation';
    end if;
    if p_phien_ban is distinct from v_pn.phien_ban then
      raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
        using errcode = 'check_violation';
    end if;
    if p_loai <> v_pn.loai then
      raise exception 'Không đổi được loại phiếu sau khi đã tạo' using errcode = 'check_violation';
    end if;
    v_anh := v_pn.anh;
  end if;

  -- Ảnh: chỉ cộng thêm, bỏ trùng, đúng thư mục ảnh nhập của chi nhánh.
  foreach v_a in array coalesce(p_anh_them, '{}'::text[]) loop
    v_a := btrim(v_a);
    continue when v_a is null or v_a = '';
    if v_a not like p_chi_nhanh_id::text || '/nhap/%' or v_a like '%..%' then
      raise exception 'Đường dẫn ảnh không thuộc chi nhánh này' using errcode = 'check_violation';
    end if;
    if not (v_a = any(v_anh)) then
      v_anh := v_anh || v_a;
    end if;
  end loop;

  if p_id is null then
    insert into kho_phieu_nhap
      (chi_nhanh_id, so_phieu, ma_gui, loai, nha_cung_cap_id, vi_tri_id, ngay_nhap,
       so_hoa_don, ngay_hoa_don, ghi_chu, anh, truong_them, nguoi_tao)
    values
      (p_chi_nhanh_id,
       kho_sinh_so(p_chi_nhanh_id, case when p_loai = 'ton_dau' then 'TD' else 'PN' end),
       p_ma_gui, p_loai, p_nha_cung_cap_id, p_vi_tri_id, p_ngay_nhap,
       nullif(btrim(p_so_hoa_don), ''), p_ngay_hoa_don,
       nullif(btrim(p_ghi_chu), ''), v_anh, coalesce(p_truong_them, '{}'),
       v_nv.id)
    returning kho_phieu_nhap.id, kho_phieu_nhap.phien_ban into v_id, v_pb;
  else
    -- Đơn giá đang có, theo mặt hàng: dòng đầu tiên của mỗi món.
    select coalesce(jsonb_object_agg(x.mat_hang_id::text, x.don_gia_kg), '{}')
      into v_gia
    from (
      select distinct on (d.mat_hang_id) d.mat_hang_id, d.don_gia_kg
      from kho_phieu_nhap_dong d
      where d.phieu_nhap_id = p_id
      order by d.mat_hang_id, d.thu_tu, d.id
    ) x;

    update kho_phieu_nhap set
      nha_cung_cap_id = p_nha_cung_cap_id,
      vi_tri_id       = p_vi_tri_id,
      ngay_nhap       = p_ngay_nhap,
      so_hoa_don      = nullif(btrim(p_so_hoa_don), ''),
      ngay_hoa_don    = p_ngay_hoa_don,
      ghi_chu         = nullif(btrim(p_ghi_chu), ''),
      anh             = v_anh,
      truong_them     = coalesce(p_truong_them, '{}'),
      trang_thai      = 'nhap',
      phien_ban       = kho_phieu_nhap.phien_ban + 1
    where kho_phieu_nhap.id = p_id
    returning kho_phieu_nhap.id, kho_phieu_nhap.phien_ban into v_id, v_pb;

    delete from kho_phieu_nhap_dong where phieu_nhap_id = p_id;
  end if;

  perform kho_ghi_dong_phieu_nhap(v_id, p_chi_nhanh_id, p_ngay_nhap, coalesce(p_dong, '[]'::jsonb));

  if v_gia <> '{}'::jsonb then
    update kho_phieu_nhap_dong d
    set don_gia_kg = (v_gia ->> d.mat_hang_id::text)::bigint
    where d.phieu_nhap_id = v_id and v_gia ? d.mat_hang_id::text;
  end if;

  return query select v_id, v_pb, false;
end;
$$;

comment on function kho_luu_phieu_nhap_kg is
  'Lưu phiếu nhận hàng chỉ kg (quyền nhap). Không nhận đơn giá; ảnh chỉ cộng thêm; giữ thuế, chi phí, hạn thanh toán; đơn giá đã điền đi theo mặt hàng sang dòng mới. Chống trùng bằng p_ma_gui, chống ghi đè bằng p_phien_ban.';

-- Điền giá — kế toán / quản lý, đọc từ ảnh hóa đơn. Không đổi trạng thái:
-- điền lúc phiếu còn nháp, đang chờ duyệt hay bị trả về đều được.
--   p_gia: [{"dong_id": uuid, "don_gia_kg": số đồng nguyên ≥ 0}] — dòng nào
--          không có trong mảng thì giữ giá cũ.
-- Số hóa đơn, ngày hóa đơn, hạn thanh toán, thuế, chi phí khác: GHI ĐÈ bằng
-- giá trị gửi lên (form điền sẵn giá trị đang có). Trả phien_ban mới.
create or replace function kho_dien_gia_phieu_nhap(
  p_id             uuid,
  p_phien_ban      int,
  p_so_hoa_don     text,
  p_ngay_hoa_don   date,
  p_han_thanh_toan date,
  p_tien_thue      bigint,
  p_chi_phi_khac   bigint,
  p_gia            jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn    kho_phieu_nhap;
  v_g     jsonb;
  v_khoa  text;
  v_i     int := 0;
  v_dong  uuid;
  v_so    numeric;
  v_pb    int;
  c_uuid  constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'duyet_nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được điền giá'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_pn from kho_phieu_nhap where id = p_id for update;

  if v_pn.trang_thai not in ('nhap', 'cho_duyet', 'tu_choi') then
    raise exception 'Phiếu % đã % — không điền giá được nữa', v_pn.so_phieu,
      case v_pn.trang_thai when 'da_duyet' then 'được duyệt' else 'bị hủy' end
      using errcode = 'check_violation';
  end if;
  if p_phien_ban is distinct from v_pn.phien_ban then
    raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
      using errcode = 'check_violation';
  end if;
  if coalesce(p_tien_thue, 0) < 0 or coalesce(p_chi_phi_khac, 0) < 0 then
    raise exception 'Tiền thuế và chi phí khác không được âm' using errcode = 'check_violation';
  end if;
  if coalesce(p_tien_thue, 0) >= 10000000000000 or coalesce(p_chi_phi_khac, 0) >= 10000000000000 then
    raise exception 'Tiền thuế hoặc chi phí khác quá lớn — kiểm lại' using errcode = 'check_violation';
  end if;
  if v_pn.loai = 'ton_dau' and (coalesce(p_tien_thue, 0) <> 0 or coalesce(p_chi_phi_khac, 0) <> 0) then
    raise exception 'Phiếu tồn đầu kỳ không có thuế hay chi phí mua' using errcode = 'check_violation';
  end if;
  if p_ngay_hoa_don is not null and p_ngay_hoa_don > hom_nay_vn() then
    raise exception 'Ngày hóa đơn không được sau hôm nay' using errcode = 'check_violation';
  end if;

  if p_gia is null then p_gia := '[]'; end if;
  if jsonb_typeof(p_gia) <> 'array' then
    raise exception 'Danh sách giá không hợp lệ' using errcode = 'check_violation';
  end if;

  for v_g in select value from jsonb_array_elements(p_gia) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_g) <> 'object' then
      raise exception 'Giá thứ % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_g) loop
      if v_khoa <> all (array['dong_id', 'don_gia_kg']) then
        raise exception 'Giá thứ %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
      end if;
    end loop;
    if jsonb_typeof(v_g -> 'dong_id') is distinct from 'string' or (v_g ->> 'dong_id') !~* c_uuid then
      raise exception 'Giá thứ %: thiếu dòng hàng', v_i using errcode = 'check_violation';
    end if;
    v_dong := (v_g ->> 'dong_id')::uuid;
    if not exists (select 1 from kho_phieu_nhap_dong where id = v_dong and phieu_nhap_id = p_id) then
      raise exception 'Giá thứ %: dòng hàng không thuộc phiếu này — tải lại trang', v_i
        using errcode = 'check_violation';
    end if;
    if jsonb_typeof(v_g -> 'don_gia_kg') is distinct from 'number' then
      raise exception 'Giá thứ %: đơn giá phải là một con số', v_i using errcode = 'check_violation';
    end if;
    v_so := (v_g ->> 'don_gia_kg')::numeric;
    if v_so < 0 or v_so <> trunc(v_so) or v_so >= 10000000000 then
      raise exception 'Giá thứ %: đơn giá phải là số đồng nguyên, không âm', v_i
        using errcode = 'check_violation';
    end if;
    update kho_phieu_nhap_dong set don_gia_kg = v_so::bigint where id = v_dong;
  end loop;

  update kho_phieu_nhap set
    so_hoa_don     = nullif(btrim(p_so_hoa_don), ''),
    ngay_hoa_don   = p_ngay_hoa_don,
    han_thanh_toan = p_han_thanh_toan,
    tien_thue      = coalesce(p_tien_thue, 0),
    chi_phi_khac   = coalesce(p_chi_phi_khac, 0),
    phien_ban      = phien_ban + 1
  where id = p_id
  returning phien_ban into v_pb;

  return v_pb;
end;
$$;

comment on function kho_dien_gia_phieu_nhap is
  'Điền giá phiếu nhập (quyền duyet_nhap): đơn giá từng dòng, số/ngày hóa đơn, hạn thanh toán, thuế, chi phí khác. Không đổi trạng thái. Kiểm phien_ban, trả phien_ban mới.';

-- So giá với lần nhập trước — để trang duyệt tô đỏ, KHÔNG chặn gì.
-- SECURITY INVOKER: RLS của kho_phieu_nhap / kho_phieu_nhap_dong đã chặn vai
-- không xem giá (thủ kho, NV quầy gọi thì nhận 0 dòng).
--   Lần trước = dòng có giá của phiếu MUA ĐÃ DUYỆT gần nhất (theo ngày nhập,
--   rồi lúc duyệt), cùng chi nhánh, cùng mặt hàng, cùng nhà cung cấp, khác
--   phiếu này, và trước phiếu này nếu phiếu này đã duyệt.
--   Dòng chưa có lần trước → gia_truoc, ngay_truoc, so_phieu_truoc null.
--   Dòng chưa có giá hoặc chưa có lần trước → chenh_pt null, vuot_nguong false.
create or replace function kho_so_sanh_gia_nhap(p_id uuid)
returns table (
  dong_id uuid, mat_hang_id uuid, don_gia_kg bigint, gia_truoc bigint,
  ngay_truoc date, so_phieu_truoc text, chenh_pt numeric, vuot_nguong boolean
)
language sql
stable
set search_path = public
as $$
  select d.id, d.mat_hang_id, d.don_gia_kg, t.don_gia_kg, t.ngay_nhap, t.so_phieu,
         c.chenh_pt,
         coalesce(abs(c.chenh_pt) > cd.nguong_gia_mua_pt, false)
  from kho_phieu_nhap p
  join kho_phieu_nhap_dong d on d.phieu_nhap_id = p.id
  left join kho_cai_dat cd on cd.chi_nhanh_id = p.chi_nhanh_id
  left join lateral (
    select d2.don_gia_kg, p2.ngay_nhap, p2.so_phieu
    from kho_phieu_nhap_dong d2
    join kho_phieu_nhap p2 on p2.id = d2.phieu_nhap_id
    where p2.chi_nhanh_id = p.chi_nhanh_id
      and p2.loai = 'mua' and p2.trang_thai = 'da_duyet'
      and p2.nha_cung_cap_id = p.nha_cung_cap_id
      and p2.id <> p.id
      and d2.mat_hang_id = d.mat_hang_id
      and d2.don_gia_kg > 0
      and (p.trang_thai <> 'da_duyet'
           or p2.ngay_nhap < p.ngay_nhap
           or (p2.ngay_nhap = p.ngay_nhap and p2.duyet_luc < p.duyet_luc))
    order by p2.ngay_nhap desc, p2.duyet_luc desc nulls last, d2.thu_tu
    limit 1
  ) t on true
  cross join lateral (
    select case when d.don_gia_kg > 0 and t.don_gia_kg > 0
                then round((d.don_gia_kg - t.don_gia_kg) * 100.0 / t.don_gia_kg, 1) end as chenh_pt
  ) c
  where p.id = p_id
  order by d.thu_tu, d.id
$$;

comment on function kho_so_sanh_gia_nhap is
  'So đơn giá từng dòng phiếu nhập với lần nhập trước (cùng chi nhánh, mặt hàng, nhà cung cấp): % chênh (1 số lẻ) và có vượt ngưỡng nguong_gia_mua_pt không. Chỉ cảnh báo. SECURITY INVOKER — vai không xem giá nhận 0 dòng.';


-- =============================================================================
-- 5 · THAY THÂN — cùng chữ ký, chép nguyên văn, chỗ đổi có ghi 0031
-- =============================================================================

-- Gửi duyệt: phiếu mua phải có ảnh; phiếu tồn đầu kỳ bỏ kiểm ô bắt buộc.
create or replace function kho_gui_duyet_phieu_nhap(p_id uuid, p_phien_ban int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn   kho_phieu_nhap;
  v_dong kho_phieu_nhap_dong;
  v_so   int;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id for update;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được gửi duyệt'
      using errcode = 'insufficient_privilege';
  end if;
  if v_pn.trang_thai = 'cho_duyet' then
    return 'Phiếu ' || v_pn.so_phieu || ' đã được gửi duyệt trước đó.';
  end if;
  if v_pn.trang_thai not in ('nhap', 'tu_choi') then
    raise exception 'Phiếu % không còn ở trạng thái nháp', v_pn.so_phieu
      using errcode = 'check_violation';
  end if;
  if p_phien_ban is distinct from v_pn.phien_ban then
    raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
      using errcode = 'check_violation';
  end if;
  if v_pn.loai = 'mua' and v_pn.nha_cung_cap_id is null then
    raise exception 'Chưa chọn nhà cung cấp' using errcode = 'check_violation';
  end if;
  -- MỚI (0031): hàng mua phải có ảnh hóa đơn / phiếu giao hàng. Người điền
  -- giá (kế toán, quản lý) đọc giá từ ảnh này — thủ kho không gõ giá nữa.
  if v_pn.loai = 'mua' and cardinality(v_pn.anh) = 0 then
    raise exception 'Chưa chụp hóa đơn / phiếu giao hàng — chụp rồi gửi'
      using errcode = 'check_violation';
  end if;

  select count(*) into v_so from kho_phieu_nhap_dong where phieu_nhap_id = p_id;
  if v_so = 0 then
    raise exception 'Phiếu chưa có dòng hàng nào' using errcode = 'check_violation';
  end if;

  -- Ô bắt buộc: kiểm lúc gửi, không kiểm lúc lưu nháp. MỚI (0031): phiếu
  -- tồn đầu kỳ bỏ qua — hàng đã nằm sẵn trong kho, không có "nhiệt độ khi
  -- nhận" hay số xe giao hàng nào để điền.
  if v_pn.loai = 'mua' then
    perform kho_chuan_hoa_truong_them('phieu_nhap', v_pn.truong_them, true);
    for v_dong in select * from kho_phieu_nhap_dong where phieu_nhap_id = p_id order by thu_tu loop
      perform kho_chuan_hoa_truong_them('lo_hang', v_dong.truong_them, true);
    end loop;
  end if;

  update kho_phieu_nhap set
    trang_thai = 'cho_duyet',
    nguoi_gui  = (nhan_su_hien_tai()).id,
    gui_luc    = now(),
    ly_do      = null,
    phien_ban  = phien_ban + 1
  where id = p_id;

  return 'Đã gửi phiếu ' || v_pn.so_phieu || ' chờ duyệt.';
end;
$$;

-- Duyệt: quyền duyet_nhap (kế toán duyệt được); phiếu mua phải đủ đơn giá.
create or replace function kho_duyet_phieu_nhap(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn     kho_phieu_nhap;
  v_cd     kho_cai_dat;
  v_nv     nhan_su;
  v_dong   kho_phieu_nhap_dong;
  v_ids    uuid[];
  v_kg     numeric[];
  v_hang   numeric[];
  v_cp     bigint[];
  v_vat    bigint[];
  v_tong_hang bigint;
  v_lo     uuid;
  v_i      int := 0;
  v_han_tt date;
  v_thieu_tt  int;
  v_thieu_ten text;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'duyet_nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được duyệt phiếu'
      using errcode = 'insufficient_privilege';
  end if;

  -- Khóa theo đúng thứ tự: cài đặt chi nhánh trước, phiếu sau.
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_pn.chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;
  select * into v_pn from kho_phieu_nhap where id = p_id for update;

  if v_pn.trang_thai = 'da_duyet' then
    return 'Phiếu ' || v_pn.so_phieu || ' đã được duyệt trước đó.';
  end if;
  if v_pn.trang_thai <> 'cho_duyet' then
    raise exception 'Phiếu % chưa được gửi duyệt', v_pn.so_phieu using errcode = 'check_violation';
  end if;

  -- MỚI (0031): hàng mua phải có đơn giá ở MỌI dòng. Trước đây bỏ trống đơn
  -- giá vẫn duyệt được, và lô sinh ra có giá vốn 0 đồng — sai cả báo cáo lẫn
  -- công nợ. Câu lỗi chỉ nêu dòng và tên món, không nêu số tiền nào.
  if v_pn.loai = 'mua' then
    select d.thu_tu, m.ten into v_thieu_tt, v_thieu_ten
    from kho_phieu_nhap_dong d
    join kho_mat_hang m on m.id = d.mat_hang_id
    where d.phieu_nhap_id = p_id and d.don_gia_kg <= 0
    order by d.thu_tu
    limit 1;
    if found then
      raise exception 'Dòng % (%): chưa có đơn giá — điền giá rồi duyệt', v_thieu_tt, v_thieu_ten
        using errcode = 'check_violation';
    end if;
  end if;

  v_nv := nhan_su_hien_tai();
  if not v_cd.cho_tu_duyet
     and v_nv.id is not null
     and v_nv.id in (v_pn.nguoi_tao, v_pn.nguoi_gui) then
    raise exception 'Cài đặt không cho tự duyệt phiếu do chính mình lập — nhờ quản lý khác duyệt'
      using errcode = 'insufficient_privilege';
  end if;

  select array_agg(d.id order by d.thu_tu),
         array_agg(d.so_kg order by d.thu_tu),
         array_agg(d.thanh_tien::numeric order by d.thu_tu),
         coalesce(sum(d.thanh_tien), 0)
    into v_ids, v_kg, v_hang, v_tong_hang
  from kho_phieu_nhap_dong d where d.phieu_nhap_id = p_id;

  if v_ids is null then
    raise exception 'Phiếu chưa có dòng hàng nào' using errcode = 'check_violation';
  end if;

  -- Giá vốn nhập kho = tiền hàng + chi phí khác (chia theo kg) + thuế (chia
  -- theo tiền hàng) — mỗi khoản chỉ tính khi cài đặt bật.
  v_cp  := kho_chia_so_du_lon_nhat(
             case when v_cd.chi_phi_vao_gia_von then v_pn.chi_phi_khac else 0 end, v_kg);
  v_vat := kho_chia_so_du_lon_nhat(
             case when v_cd.vat_vao_gia_von then v_pn.tien_thue else 0 end,
             case when v_tong_hang > 0 then v_hang else v_kg end);

  for v_dong in
    select * from kho_phieu_nhap_dong where phieu_nhap_id = p_id order by thu_tu
  loop
    v_i := v_i + 1;

    insert into kho_lo
      (chi_nhanh_id, ma_lo, mat_hang_id, nguon, phieu_nhap_dong_id,
       ngay_dong_goi, ngay_san_xuat, han_dung, so_lo_ncc, truong_them)
    values
      (v_pn.chi_nhanh_id, kho_sinh_so(v_pn.chi_nhanh_id, 'L'), v_dong.mat_hang_id,
       case when v_pn.loai = 'ton_dau' then 'ton_dau' else 'nhap' end, v_dong.id,
       v_pn.ngay_nhap, v_dong.ngay_san_xuat, v_dong.han_dung, v_dong.so_lo_ncc,
       v_dong.truong_them)
    returning id into v_lo;

    insert into kho_lo_gia (lo_id, chi_nhanh_id, gia_tri, so_kg_goc)
    values (v_lo, v_pn.chi_nhanh_id,
            v_dong.thanh_tien + v_cp[v_i] + v_vat[v_i], v_dong.so_kg);

    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
    values
      (v_pn.chi_nhanh_id, v_lo, v_pn.vi_tri_id, v_dong.mat_hang_id, 'nhap',
       v_dong.so_kg, v_dong.so_goi, 'phieu_nhap', v_pn.id, v_nv.id, v_pn.ngay_nhap);

    update kho_phieu_nhap_dong set lo_id = v_lo where id = v_dong.id;
  end loop;

  if v_pn.loai = 'mua' and v_pn.han_thanh_toan is null then
    select coalesce(v_pn.ngay_hoa_don, v_pn.ngay_nhap) + ncc.so_ngay_no into v_han_tt
    from kho_nha_cung_cap ncc where ncc.id = v_pn.nha_cung_cap_id;
  else
    v_han_tt := v_pn.han_thanh_toan;
  end if;

  update kho_phieu_nhap set
    trang_thai     = 'da_duyet',
    nguoi_duyet    = v_nv.id,
    duyet_luc      = now(),
    han_thanh_toan = v_han_tt,
    phien_ban      = phien_ban + 1
  where id = p_id;

  return 'Đã duyệt phiếu ' || v_pn.so_phieu || ': ' || v_i || ' lô hàng đã vào kho.';
end;
$$;

comment on function kho_duyet_phieu_nhap is
  'Duyệt phiếu nhập (quyền duyet_nhap — chủ, quản lý, kế toán): mỗi dòng thành một lô, có giá vốn nhập kho (cộng chi phí và thuế theo cài đặt, chia không lệch một đồng), và một dòng sổ kho. Phiếu mua phải có đơn giá ở mọi dòng (0031). Chỉ lúc này tồn mới cộng.';

-- Từ chối: quyền duyet_nhap.
create or replace function kho_tu_choi_phieu_nhap(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn kho_phieu_nhap;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id for update;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'duyet_nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được duyệt phiếu'
      using errcode = 'insufficient_privilege';
  end if;
  if v_pn.trang_thai = 'tu_choi' then
    return 'Phiếu ' || v_pn.so_phieu || ' đã bị từ chối trước đó.';
  end if;
  if v_pn.trang_thai <> 'cho_duyet' then
    raise exception 'Chỉ từ chối được phiếu đang chờ duyệt' using errcode = 'check_violation';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Cần ghi lý do từ chối để người lập phiếu biết sửa gì'
      using errcode = 'check_violation';
  end if;

  update kho_phieu_nhap set
    trang_thai  = 'tu_choi',
    ly_do       = btrim(p_ly_do),
    nguoi_duyet = (nhan_su_hien_tai()).id,
    duyet_luc   = now(),
    phien_ban   = phien_ban + 1
  where id = p_id;

  return 'Đã từ chối phiếu ' || v_pn.so_phieu || '.';
end;
$$;


-- Tính phiên pha lóc: chép nguyên văn 0022, chỉ đổi MỘT câu lỗi cho không in
-- số tiền — thủ kho bấm "Chốt" cũng có thể gặp câu này.
create or replace function kho_tinh_phien_pha(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ph         kho_phien_pha;
  v_cd         kho_cai_dat;
  v_gt_vao     bigint := 0;
  v_kg_vao     numeric := 0;
  v_han_vao    date;
  v_r          record;
  v_ra_ids     uuid[] := '{}';
  v_nhom       text[] := '{}';     -- 'thit' | 'phu_pham' | 'bo'
  v_kg         numeric[] := '{}';
  v_nrv        bigint[] := '{}';
  v_ts         numeric[] := '{}';
  v_gia_tri    bigint[] := '{}';
  v_tong_nrv   bigint := 0;
  v_con_lai    bigint;
  v_kg_thit    numeric := 0;
  v_kg_pp      numeric := 0;
  v_kg_bo      numeric := 0;
  v_theo       text;
  v_thieu_gia  text[] := '{}';
  v_thieu_th   text[] := '{}';
  v_canh_bao   text[] := '{}';
  v_chia       bigint[];
  v_chi_so     int[] := '{}';
  v_ts_con     numeric[] := '{}';
  i            int;
  n            int;
  v_dong       jsonb := '[]';
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found then
    raise exception 'Không tìm thấy phiên pha lóc' using errcode = 'foreign_key_violation';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_ph.chi_nhanh_id;
  v_theo := coalesce(v_cd.phuong_phap_gia_von, 'gia_tri');

  -- Đầu vào: giá trị theo giá vốn/kg của từng lô.
  for v_r in
    select v.so_kg, coalesce(g.gia_von_kg, 0) as gia_von_kg, l.han_dung
    from kho_phien_pha_vao v
    join kho_lo l on l.id = v.lo_id
    left join kho_lo_gia g on g.lo_id = v.lo_id
    where v.phien_pha_id = p_id
  loop
    v_gt_vao := v_gt_vao + round(v_r.so_kg * v_r.gia_von_kg)::bigint;
    v_kg_vao := v_kg_vao + v_r.so_kg;
    v_han_vao := least(coalesce(v_han_vao, v_r.han_dung), v_r.han_dung);
  end loop;

  -- Đầu ra: phân nhóm, giá trị thu hồi phụ phẩm, trọng số chia.
  for v_r in
    select r.id, r.so_kg, r.xu_ly, m.loai, m.ten, m.gia_ban_kg, mg.gia_tri_thu_hoi_kg
    from kho_phien_pha_ra r
    join kho_mat_hang m on m.id = r.mat_hang_id
    left join kho_mat_hang_gia mg on mg.mat_hang_id = r.mat_hang_id
    where r.phien_pha_id = p_id
    order by r.thu_tu, r.id
  loop
    v_ra_ids := v_ra_ids || v_r.id;
    v_kg := v_kg || v_r.so_kg::numeric;
    if v_r.xu_ly = 'bo' then
      v_nhom := v_nhom || 'bo'::text;
      v_nrv := v_nrv || 0::bigint;
      v_ts := v_ts || 0::numeric;
      v_kg_bo := v_kg_bo + v_r.so_kg;
    elsif v_r.loai = 'phu_pham' then
      v_nhom := v_nhom || 'phu_pham'::text;
      v_nrv := v_nrv || round(v_r.so_kg * coalesce(v_r.gia_tri_thu_hoi_kg, 0))::bigint;
      v_ts := v_ts || 0::numeric;
      v_tong_nrv := v_tong_nrv + round(v_r.so_kg * coalesce(v_r.gia_tri_thu_hoi_kg, 0))::bigint;
      v_kg_pp := v_kg_pp + v_r.so_kg;
      if v_r.gia_tri_thu_hoi_kg is null and not (v_r.ten = any(v_thieu_th)) then
        v_thieu_th := v_thieu_th || v_r.ten::text;
      end if;
    else
      v_nhom := v_nhom || 'thit'::text;
      v_nrv := v_nrv || 0::bigint;
      v_ts := v_ts || (v_r.so_kg * coalesce(v_r.gia_ban_kg, 0))::numeric;
      v_kg_thit := v_kg_thit + v_r.so_kg;
      if coalesce(v_r.gia_ban_kg, 0) = 0 and not (v_r.ten = any(v_thieu_gia)) then
        v_thieu_gia := v_thieu_gia || v_r.ten::text;
      end if;
    end if;
  end loop;

  if v_theo = 'gia_tri' and coalesce(array_length(v_thieu_gia, 1), 0) > 0 then
    v_theo := 'khoi_luong';
    v_canh_bao := v_canh_bao || ('Chưa có giá bán: ' || array_to_string(v_thieu_gia, ', ')
                                 || ' — phiên này chia giá vốn theo kg')::text;
  end if;
  if coalesce(array_length(v_thieu_th, 1), 0) > 0 then
    v_canh_bao := v_canh_bao || ('Phụ phẩm chưa có giá trị thu hồi (tính 0 đ): '
                                 || array_to_string(v_thieu_th, ', '))::text;
  end if;

  n := coalesce(array_length(v_ra_ids, 1), 0);
  v_gia_tri := array_fill(0::bigint, array[greatest(n, 1)]);

  if v_tong_nrv > v_gt_vao then
    -- 0031: không in số tiền — thủ kho chốt phiên cũng gặp câu này.
    raise exception 'Giá trị thu hồi phụ phẩm lớn hơn giá vốn đầu vào — nhờ quản lý kiểm lại giá trị thu hồi trong Cài đặt mặt hàng'
      using errcode = 'check_violation';
  end if;
  v_con_lai := v_gt_vao - v_tong_nrv;

  for i in 1..n loop
    if v_nhom[i] = 'phu_pham' then v_gia_tri[i] := v_nrv[i]; end if;
  end loop;

  -- Chia phần còn lại cho phần thịt; không có phần thịt thì cho phụ phẩm giữ
  -- lại (theo kg); không giữ lại gì cả thì giá trị đó là tổn thất của phiên.
  for i in 1..n loop
    if v_nhom[i] = 'thit' then
      v_chi_so := v_chi_so || i;
      v_ts_con := v_ts_con || case when v_theo = 'gia_tri' then v_ts[i] else v_kg[i] end;
    end if;
  end loop;
  if coalesce(array_length(v_chi_so, 1), 0) = 0 then
    for i in 1..n loop
      if v_nhom[i] = 'phu_pham' then
        v_chi_so := v_chi_so || i;
        v_ts_con := v_ts_con || v_kg[i];
      end if;
    end loop;
  end if;
  if coalesce(array_length(v_chi_so, 1), 0) > 0 then
    v_chia := kho_chia_so_du_lon_nhat(v_con_lai, v_ts_con);
    for i in 1..array_length(v_chi_so, 1) loop
      v_gia_tri[v_chi_so[i]] := v_gia_tri[v_chi_so[i]] + v_chia[i];
    end loop;
  elsif v_con_lai > 0 and n > 0 then
    v_canh_bao := v_canh_bao || 'Không giữ lại phần nào — toàn bộ giá vốn đầu vào thành tổn thất'::text;
  end if;

  for i in 1..n loop
    v_dong := v_dong || jsonb_build_object(
      'ra_id', v_ra_ids[i], 'nhom', v_nhom[i], 'so_kg', v_kg[i],
      'gia_tri', v_gia_tri[i],
      'gia_von_kg', round(v_gia_tri[i]::numeric / v_kg[i]),
      'ty_le', case when v_kg_vao > 0 then round(v_kg[i] * 100 / v_kg_vao, 2) end);
  end loop;

  return jsonb_build_object(
    'tong_kg_vao', v_kg_vao,
    'tong_kg_thit', v_kg_thit,
    'tong_kg_phu_pham', v_kg_pp,
    'tong_kg_bo', v_kg_bo,
    'tong_kg_hao_hut', v_kg_vao - v_kg_thit - v_kg_pp - v_kg_bo,
    'ty_le_thu_hoi', case when v_kg_vao > 0 then round(v_kg_thit * 100 / v_kg_vao, 2) end,
    'ty_le_phu_pham', case when v_kg_vao > 0 then round(v_kg_pp * 100 / v_kg_vao, 2) end,
    'ty_le_bo', case when v_kg_vao > 0 then round(v_kg_bo * 100 / v_kg_vao, 2) end,
    'ty_le_hao_hut', case when v_kg_vao > 0
                          then round((v_kg_vao - v_kg_thit - v_kg_pp - v_kg_bo) * 100 / v_kg_vao, 2) end,
    'gia_tri_vao', v_gt_vao,
    'gia_von_vao_kg', case when v_kg_vao > 0 then round(v_gt_vao / v_kg_vao) end,
    'gia_tri_phu_pham', v_tong_nrv,
    'han_som_nhat_vao', v_han_vao,
    'chia_theo', v_theo,
    'canh_bao', to_jsonb(v_canh_bao),
    'dong', v_dong);
end;
$$;

comment on function kho_tinh_phien_pha is
  'Tính tỉ lệ thu hồi và chia giá vốn cho một phiên pha lóc, KHÔNG ghi gì. Nội bộ — gọi qua kho_xem_thu_phien_pha() hoặc kho_chot_phien_pha(). Câu lỗi không in số tiền (0031).';


-- Sự kiện và số đỏ: phiếu nhập chờ duyệt theo quyền duyet_nhap thay duyet —
-- để kế toán thấy số đỏ Duyệt. Chép nguyên văn 0030, chỉ đổi đúng chỗ đó.
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

    return query
      select 'cho_duyet_kiem_ke', 'nhac_nho', k.id, k.vi_tri_id, k.so_phieu, v.ten, v.loai, null::numeric, coalesce(k.gui_luc, k.updated_at)
      from kho_kiem_ke k
      join kho_vi_tri v on v.id = k.vi_tri_id
      where k.chi_nhanh_id = p_chi_nhanh_id and k.trang_thai = 'cho_duyet';
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
  'NỘI BỘ. Mọi sự kiện thông báo người đang đăng nhập được thấy ở một chi nhánh, suy ra từ chứng từ. Gọi qua kho_dem_viec / kho_thong_bao.';

create or replace function kho_dem_viec(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ns       nhan_su;
  v_cd       kho_cai_dat;
  v          jsonb;
  v_chi_quay boolean;
  v_hom_nay  date := hom_nay_vn();
  v_xem_luc  timestamptz;
  v_duoi_muc int;
  v_chua_dem int;
  v_chua_doc int;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;

  v_ns := nhan_su_hien_tai();
  select * into v_cd from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id;
  v := jsonb_build_object('khoi_tao', v_cd.chi_nhanh_id is not null);
  if v_cd.chi_nhanh_id is null then
    return v;
  end if;
  v_chi_quay := v_ns.vai_tro = 'nhan_vien_quay';

  -- Hạn dùng và quầy — ai xem kho cũng có
  v := v || (
    select jsonb_build_object(
      'het_han',     count(*) filter (where t.tinh_trang_han = 'het_han'),
      'sap_het_han', count(*) filter (where t.tinh_trang_han = 'sap_het'))
    from kho_v_ton t
    where t.chi_nhanh_id = p_chi_nhanh_id and t.loai_vi_tri in ('kho', 'quay')
      and (not v_chi_quay or t.loai_vi_tri = 'quay'));

  -- Mọi sự kiện đếm MỘT lần: quầy dưới mức, quầy chưa đếm, số chưa đọc.
  select x.thong_bao_xem_luc into v_xem_luc
  from kho_nguoi_xem x where x.nhan_su_id = v_ns.id and x.chi_nhanh_id = p_chi_nhanh_id;

  select count(*) filter (where e.khoa = 'quay_duoi_muc'),
         count(*) filter (where e.khoa = 'quay_chua_dem'),
         count(*) filter (where e.luc <= now() and e.luc >= now() - interval '30 days'
                            and (v_xem_luc is null or e.luc > v_xem_luc))
    into v_duoi_muc, v_chua_dem, v_chua_doc
  from kho_su_kien(p_chi_nhanh_id) e;

  v := v || jsonb_build_object('quay_duoi_muc', v_duoi_muc);
  if kho_duoc(p_chi_nhanh_id, 'van_hanh') or kho_duoc(p_chi_nhanh_id, 'duyet') then
    v := v || jsonb_build_object('quay_chua_dem', v_chua_dem);
  end if;

  if kho_duoc(p_chi_nhanh_id, 'nhap') then
    v := v || (
      select jsonb_build_object(
        'nhap_bi_tra', count(*) filter (where p.trang_thai = 'tu_choi'),
        'nhap_nhap',   count(*) filter (where p.trang_thai = 'nhap'))
      from kho_phieu_nhap p
      where p.chi_nhanh_id = p_chi_nhanh_id and p.nguoi_tao = v_ns.id
        and p.trang_thai in ('tu_choi', 'nhap'));
  end if;

  if kho_duoc(p_chi_nhanh_id, 'van_hanh') then
    v := v || jsonb_build_object(
      'huy_bi_tra', (
        select count(*) from kho_phieu_xuat x
        where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'huy' and x.trang_thai = 'tu_choi'
          and x.nguoi_tao = v_ns.id and x.duyet_luc >= now() - interval '7 days'),
      'kiem_ke_tra_ve', (
        select count(*) from kho_kiem_ke k
        join kho_vi_tri vt on vt.id = k.vi_tri_id
        where k.chi_nhanh_id = p_chi_nhanh_id and k.trang_thai = 'dang_dem' and k.ly_do is not null
          and (not v_chi_quay or vt.loai = 'quay')));
  end if;

  if kho_duoc(p_chi_nhanh_id, 'pha_loc') then
    v := v || jsonb_build_object('pha_nhap', (
      select count(*) from kho_phien_pha f
      where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'nhap'));
  end if;

  -- 0031: phiếu nhập theo quyền duyet_nhap (kế toán cũng thấy số đỏ Duyệt).
  if kho_duoc(p_chi_nhanh_id, 'duyet_nhap') then
    v := v || jsonb_build_object(
      'duyet_nhap', (select count(*) from kho_phieu_nhap
                     where chi_nhanh_id = p_chi_nhanh_id and trang_thai = 'cho_duyet'));
  end if;

  if kho_duoc(p_chi_nhanh_id, 'duyet') then
    v := v || jsonb_build_object(
      'duyet_huy', (select count(*) from kho_phieu_xuat
                    where chi_nhanh_id = p_chi_nhanh_id and loai = 'huy' and trang_thai = 'cho_duyet'),
      'duyet_kiem_ke', (select count(*) from kho_kiem_ke
                        where chi_nhanh_id = p_chi_nhanh_id and trang_thai = 'cho_duyet'));
  end if;

  if kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    v := v || (
      select jsonb_build_object(
        'cong_no_qua_han', count(*) filter (where c.qua_han),
        'cong_no_7_ngay',  count(*) filter (where c.con_no > 0
                                              and c.han_thanh_toan between v_hom_nay and v_hom_nay + 7),
        'chua_doi_chieu',  count(*) filter (where not c.da_doi_chieu))
      from kho_v_cong_no_phieu c
      where c.chi_nhanh_id = p_chi_nhanh_id);
  end if;

  v := v || jsonb_build_object('chua_doc', v_chua_doc, 'thong_bao_xem_luc', v_xem_luc);

  return v;
end;
$$;

comment on function kho_dem_viec is
  'Mọi số đỏ trên menu kho của người đang đăng nhập ở một chi nhánh, trong MỘT lần gọi. Khóa nào không có quyền thì vắng mặt. Chỉ đếm, không tiền. duyet_nhap theo quyền duyet_nhap (0031).';


-- =============================================================================
-- 6 · BỊT kho_luu_phieu_nhap (0020) — vai không xem giá không ghi được tiền
-- =============================================================================
-- Hàm cũ chỉ hỏi quyền nhap. Thủ kho vẫn có nhap (để lưu phiếu nhận hàng qua
-- _kg), nên gọi thẳng hàm cũ thì ghi được đơn giá, thuế, chi phí khác, hạn
-- thanh toán và xóa được ảnh hóa đơn (p_anh THAY toàn bộ ảnh). Cùng chữ ký,
-- chép nguyên văn thân 0020; chỗ đổi có ghi "0031". Vai có xem_gia: y như cũ.
--
-- Vai KHÔNG có xem_gia:
--   · dòng có khóa don_gia_kg khác null → báo lỗi (không lặng lẽ bỏ);
--   · p_tien_thue / p_chi_phi_khac khác 0, hay p_han_thanh_toan khác null và
--     khác giá trị đang lưu → báo lỗi. Gửi 0 / null nghĩa là "không đụng":
--     giữ nguyên thuế, chi phí, hạn thanh toán đang có;
--   · p_anh phải chứa đủ mọi ảnh đang có trên phiếu — chỉ thêm, không xóa;
--   · thay dòng thì mang đơn giá cũ theo mặt hàng sang dòng mới, như
--     kho_luu_phieu_nhap_kg (dòng đầu tiên cùng món).
create or replace function kho_luu_phieu_nhap(
  p_id              uuid,
  p_chi_nhanh_id    uuid,
  p_ma_gui          uuid,
  p_phien_ban       int,
  p_loai            text,
  p_nha_cung_cap_id uuid,
  p_vi_tri_id       uuid,
  p_ngay_nhap       date,
  p_so_hoa_don      text,
  p_ngay_hoa_don    date,
  p_han_thanh_toan  date,
  p_tien_thue       bigint,
  p_chi_phi_khac    bigint,
  p_ghi_chu         text,
  p_anh             text[],
  p_truong_them     jsonb,
  p_dong            jsonb
)
returns table (phieu_id uuid, phien_ban_moi int, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv      nhan_su;
  v_pn      kho_phieu_nhap;
  v_id      uuid;
  v_pb      int;
  v_anh     text;
  v_xem_gia boolean;          -- 0031
  v_dong    jsonb;            -- 0031
  v_gia     jsonb := '{}';    -- 0031
begin
  if not kho_duoc(p_chi_nhanh_id, 'nhap') then
    raise exception 'Tài khoản của bạn không được lập phiếu nhập'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();

  -- 0031: vai không xem giá không gửi được tiền. Kiểm TRƯỚC khi ghi gì.
  v_xem_gia := kho_duoc(p_chi_nhanh_id, 'xem_gia');
  if not v_xem_gia then
    if coalesce(p_tien_thue, 0) <> 0 or coalesce(p_chi_phi_khac, 0) <> 0 then
      raise exception 'Tài khoản của bạn không điền giá — dùng màn Nhận hàng'
        using errcode = 'insufficient_privilege';
    end if;
    if p_dong is not null and jsonb_typeof(p_dong) = 'array' then
      for v_dong in select value from jsonb_array_elements(p_dong) loop
        if jsonb_typeof(v_dong) = 'object' and v_dong ? 'don_gia_kg'
           and jsonb_typeof(v_dong -> 'don_gia_kg') <> 'null' then
          raise exception 'Tài khoản của bạn không điền giá — dùng màn Nhận hàng'
            using errcode = 'insufficient_privilege';
        end if;
      end loop;
    end if;
  end if;

  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho — vào Cài đặt kho, bấm "Bắt đầu dùng kho"'
      using errcode = 'check_violation';
  end if;

  if p_loai not in ('mua', 'ton_dau') then
    raise exception 'Loại phiếu nhập không hợp lệ' using errcode = 'check_violation';
  end if;
  if p_ngay_nhap is null or p_ngay_nhap > hom_nay_vn() then
    raise exception 'Ngày nhập không được sau hôm nay' using errcode = 'check_violation';
  end if;
  if p_ngay_nhap < hom_nay_vn() - 90 then
    raise exception 'Ngày nhập quá 90 ngày trước — kiểm tra lại ngày' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from kho_vi_tri
                 where id = p_vi_tri_id and chi_nhanh_id = p_chi_nhanh_id
                   and dang_dung and loai in ('kho', 'quay')) then
    raise exception 'Chọn nơi nhận hàng là một kho hoặc quầy đang dùng'
      using errcode = 'check_violation';
  end if;
  if p_loai = 'ton_dau' and (p_nha_cung_cap_id is not null
                             or coalesce(p_tien_thue, 0) <> 0
                             or coalesce(p_chi_phi_khac, 0) <> 0) then
    raise exception 'Phiếu tồn đầu kỳ không có nhà cung cấp, thuế hay chi phí mua'
      using errcode = 'check_violation';
  end if;
  if coalesce(p_tien_thue, 0) < 0 or coalesce(p_chi_phi_khac, 0) < 0 then
    raise exception 'Tiền thuế và chi phí khác không được âm' using errcode = 'check_violation';
  end if;
  if p_nha_cung_cap_id is not null and not exists (
       select 1 from kho_nha_cung_cap where id = p_nha_cung_cap_id and dang_dung) then
    raise exception 'Nhà cung cấp không có hoặc đã ngừng dùng' using errcode = 'check_violation';
  end if;
  foreach v_anh in array coalesce(p_anh, '{}'::text[]) loop
    if v_anh not like p_chi_nhanh_id::text || '/nhap/%' then
      raise exception 'Đường dẫn ảnh không thuộc chi nhánh này' using errcode = 'check_violation';
    end if;
  end loop;

  if p_id is null then
    select pn.id, pn.phien_ban into v_id, v_pb
    from kho_phieu_nhap pn where pn.ma_gui = p_ma_gui;
    if found then
      return query select v_id, v_pb, true;
      return;
    end if;

    -- 0031: phiếu mới chưa có hạn thanh toán nào để "giữ nguyên".
    if not v_xem_gia and p_han_thanh_toan is not null then
      raise exception 'Tài khoản của bạn không điền giá — dùng màn Nhận hàng'
        using errcode = 'insufficient_privilege';
    end if;

    insert into kho_phieu_nhap
      (chi_nhanh_id, so_phieu, ma_gui, loai, nha_cung_cap_id, vi_tri_id, ngay_nhap,
       so_hoa_don, ngay_hoa_don, han_thanh_toan, tien_thue, chi_phi_khac,
       ghi_chu, anh, truong_them, nguoi_tao)
    values
      (p_chi_nhanh_id,
       kho_sinh_so(p_chi_nhanh_id, case when p_loai = 'ton_dau' then 'TD' else 'PN' end),
       p_ma_gui, p_loai, p_nha_cung_cap_id, p_vi_tri_id, p_ngay_nhap,
       nullif(btrim(p_so_hoa_don), ''), p_ngay_hoa_don, p_han_thanh_toan,
       coalesce(p_tien_thue, 0), coalesce(p_chi_phi_khac, 0),
       nullif(btrim(p_ghi_chu), ''), coalesce(p_anh, '{}'), coalesce(p_truong_them, '{}'),
       v_nv.id)
    returning kho_phieu_nhap.id, kho_phieu_nhap.phien_ban into v_id, v_pb;
  else
    select * into v_pn from kho_phieu_nhap where kho_phieu_nhap.id = p_id for update;
    if not found or v_pn.chi_nhanh_id <> p_chi_nhanh_id then
      raise exception 'Không tìm thấy phiếu nhập' using errcode = 'foreign_key_violation';
    end if;
    if v_pn.trang_thai = 'cho_duyet' then
      raise exception 'Phiếu đang chờ duyệt — rút về rồi mới sửa được' using errcode = 'check_violation';
    end if;
    if v_pn.trang_thai not in ('nhap', 'tu_choi') then
      raise exception 'Phiếu % đã % — không sửa được nữa', v_pn.so_phieu,
        case v_pn.trang_thai when 'da_duyet' then 'được duyệt' else 'bị hủy' end
        using errcode = 'check_violation';
    end if;
    if p_phien_ban is distinct from v_pn.phien_ban then
      raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
        using errcode = 'check_violation';
    end if;
    if p_loai <> v_pn.loai then
      raise exception 'Không đổi được loại phiếu sau khi đã tạo' using errcode = 'check_violation';
    end if;

    -- 0031: vai không xem giá — không đổi hạn thanh toán, không xóa ảnh;
    -- ghi nhớ đơn giá đang có theo mặt hàng để mang sang dòng mới.
    if not v_xem_gia then
      if p_han_thanh_toan is not null
         and p_han_thanh_toan is distinct from v_pn.han_thanh_toan then
        raise exception 'Tài khoản của bạn không điền giá — dùng màn Nhận hàng'
          using errcode = 'insufficient_privilege';
      end if;
      if not (coalesce(v_pn.anh, '{}'::text[]) <@ coalesce(p_anh, '{}'::text[])) then
        raise exception 'Không xóa được ảnh hóa đơn đã chụp'
          using errcode = 'insufficient_privilege';
      end if;

      select coalesce(jsonb_object_agg(x.mat_hang_id::text, x.don_gia_kg), '{}')
        into v_gia
      from (
        select distinct on (d.mat_hang_id) d.mat_hang_id, d.don_gia_kg
        from kho_phieu_nhap_dong d
        where d.phieu_nhap_id = p_id
        order by d.mat_hang_id, d.thu_tu, d.id
      ) x;
    end if;

    update kho_phieu_nhap set
      nha_cung_cap_id = p_nha_cung_cap_id,
      vi_tri_id       = p_vi_tri_id,
      ngay_nhap       = p_ngay_nhap,
      so_hoa_don      = nullif(btrim(p_so_hoa_don), ''),
      ngay_hoa_don    = p_ngay_hoa_don,
      -- 0031: vai không xem giá giữ nguyên ba ô tiền đang có.
      han_thanh_toan  = case when v_xem_gia then p_han_thanh_toan
                             else kho_phieu_nhap.han_thanh_toan end,
      tien_thue       = case when v_xem_gia then coalesce(p_tien_thue, 0)
                             else kho_phieu_nhap.tien_thue end,
      chi_phi_khac    = case when v_xem_gia then coalesce(p_chi_phi_khac, 0)
                             else kho_phieu_nhap.chi_phi_khac end,
      ghi_chu         = nullif(btrim(p_ghi_chu), ''),
      anh             = coalesce(p_anh, '{}'),
      truong_them     = coalesce(p_truong_them, '{}'),
      trang_thai      = 'nhap',
      phien_ban       = kho_phieu_nhap.phien_ban + 1
    where kho_phieu_nhap.id = p_id
    returning kho_phieu_nhap.id, kho_phieu_nhap.phien_ban into v_id, v_pb;

    delete from kho_phieu_nhap_dong where phieu_nhap_id = p_id;
  end if;

  perform kho_ghi_dong_phieu_nhap(v_id, p_chi_nhanh_id, p_ngay_nhap, coalesce(p_dong, '[]'::jsonb));

  -- 0031: đơn giá kế toán / quản lý đã điền đi theo mặt hàng sang dòng mới.
  if v_gia <> '{}'::jsonb then
    update kho_phieu_nhap_dong d
    set don_gia_kg = (v_gia ->> d.mat_hang_id::text)::bigint
    where d.phieu_nhap_id = v_id and v_gia ? d.mat_hang_id::text;
  end if;

  return query select v_id, v_pb, false;
end;
$$;

comment on function kho_luu_phieu_nhap is
  'Lưu nháp phiếu nhập (tạo mới khi p_id null). Chống trùng bằng p_ma_gui, chống ghi đè bằng p_phien_ban. Không chạm tồn kho. Vai không có xem_gia (0031): không gửi được đơn giá, thuế, chi phí, hạn thanh toán; không xóa được ảnh; đơn giá đã điền đi theo mặt hàng sang dòng mới.';


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
