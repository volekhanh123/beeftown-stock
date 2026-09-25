-- =============================================================================
-- BEEFTOWN KHO — 0035 · CHUẨN BỊ CHẠY THẬT: NỢ ĐẦU KỲ · TỒN ĐẦU KỲ DẠNG LƯỚI · TIẾN ĐỘ THIẾT LẬP
-- =============================================================================
-- Chủ nhà hàng đã chốt (GĐ5e):
--
--   · Chạy thật sau 1–2 tháng. Chủ / quản lý cần một màn "Thiết lập" dẫn từng
--     bước và biết CÒN THIẾU GÌ. Nhân viên tập trên Supabase thử riêng — không
--     làm nút xóa dữ liệu.
--   · Kế toán ghi NỢ ĐẦU KỲ của từng nhà cung cấp MỘT LẦN.
--   · Tồn đầu kỳ nhập nhanh dạng lưới / dán Excel: nhiều vị trí một lượt.
--
-- 1. NỢ ĐẦU KỲ = phiếu nhập loại mới 'no_dau' (số ND-2610-0001):
--      · không vị trí (vi_tri_id null — CHỈ loại này được null), không dòng
--        hàng, không lô, không dòng sổ kho → tồn, báo cáo nhập / xuất / giá
--        vốn không bao giờ thấy nó.
--      · SỐ TIỀN NỢ lưu ở cột mới tien_no_dau (bigint, > 0, CHỈ loại no_dau có).
--        Phiếu tạo ra đã duyệt và ĐÃ ĐỐI CHIẾU: tien_hoa_don = tien_no_dau,
--        da_doi_chieu = true. Nên công thức công nợ của 0024 giữ nguyên:
--          phải trả = coalesce(tien_hoa_don, tổng phiếu) = tien_no_dau
--        và "tổng phiếu" của view công nợ cộng thêm tien_no_dau → không hiện
--        LỆCH. Không mượn chi_phi_khac: cột đó đi vào giá vốn khi duyệt, và
--        ràng buộc cũ cấm nó ở phiếu không phải mua.
--      · kho_v_cong_no_phieu lọc loai in ('mua','no_dau') → thanh toán tự
--        chia (0024) trả được cả nợ đầu kỳ, theo hạn sớm nhất trước.
--      · Hủy bằng kho_huy_phieu_nhap (kế toán hủy được phiếu no_dau); trigger
--        0024 vẫn chặn khi phiếu đã có thanh toán / giảm trừ.
--      · Thủ kho không thấy: bảng phiếu nhập đã khóa với vai không xem giá
--        (0031); ba hàm đọc chỉ kg (_kg, ds NCC) bỏ phiếu no_dau.
--      · kho_v_phieu_nhap (danh sách phiếu nhập hàng) bỏ phiếu no_dau — nợ
--        đầu kỳ nằm ở màn Công nợ.
--
-- 2. TỒN ĐẦU KỲ DẠNG LƯỚI — kho_luu_ton_dau_ky: gom dòng theo vị trí, mỗi vị
--    trí MỘT phiếu ton_dau, gửi duyệt luôn; tự duyệt khi cài đặt cho_tu_duyet
--    bật VÀ người gọi được duyệt phiếu nhập (duyet_nhap), không thì để chờ
--    duyệt. Quyền theo luật tồn đầu kỳ có sẵn (0020/0031): lập được khi có
--    'nhap'; đơn giá (giá vốn ước tính) chỉ vai 'xem_gia' gửi được. Không kiểm
--    ô thông tin bắt buộc (như 0031 lúc gửi).
--
-- 3. TIẾN ĐỘ THIẾT LẬP — kho_tien_do_thiet_lap: 10 bước, mỗi bước chỉ SỐ ĐẾM,
--    không tiền. Bảng kho_thiet_lap_bo_qua ghi bước nào được đánh dấu bỏ qua
--    ("không có nợ đầu kỳ", "không dùng máy chung"...). Hai mốc mới trong
--    kho_cai_dat do trigger ghi: goc_xem_luc (chủ đã lưu cài đặt gốc — cách
--    tính giá vốn) và nguong_luu_luc (đã lưu ngưỡng cảnh báo). kho_luu_nguong
--    dựng lại: chỉ gạt công tắc "Quầy phải bấm nhận" thì không ghi mốc ngưỡng.
--
-- MỘT LƯỢT GỬI → NHIỀU PHIẾU: cột mới ma_gui_chung giữ mã gửi của cả lượt;
-- mỗi phiếu có ma_gui riêng = md5(ma_gui_chung:khóa nhóm) để giữ unique cũ.
-- Bấm hai lần / F5 → trả lại đúng các phiếu đã tạo.
-- =============================================================================


-- =============================================================================
-- 1 · PHIẾU NHẬP: LOẠI no_dau, CỘT tien_no_dau, ma_gui_chung
-- =============================================================================
alter table kho_phieu_nhap drop constraint kho_phieu_nhap_loai_hop_le;
alter table kho_phieu_nhap add constraint kho_phieu_nhap_loai_hop_le
  check (loai in ('mua', 'ton_dau', 'no_dau'));

alter table kho_phieu_nhap alter column vi_tri_id drop not null;

alter table kho_phieu_nhap
  add column tien_no_dau  bigint,
  add column ma_gui_chung uuid;

-- Ràng buộc cũ viết "loai = 'mua' or (tồn đầu kỳ hợp lệ)" — nếu giữ, nợ đầu
-- kỳ (có nhà cung cấp) sẽ bị chặn. Viết lại chỉ cho ton_dau.
alter table kho_phieu_nhap drop constraint kho_phieu_nhap_ton_dau_hop_le;
alter table kho_phieu_nhap add constraint kho_phieu_nhap_ton_dau_hop_le check (
  loai <> 'ton_dau' or (nha_cung_cap_id is null and tien_thue = 0 and chi_phi_khac = 0));

-- Nợ đầu kỳ: có nhà cung cấp, có số tiền, không vị trí, không thuế / chi phí.
-- Vị trí được trống CHỈ với nợ đầu kỳ.
alter table kho_phieu_nhap
  add constraint kho_phieu_nhap_vi_tri_hop_le check ((vi_tri_id is null) = (loai = 'no_dau')),
  add constraint kho_phieu_nhap_no_dau_hop_le check (
    (loai = 'no_dau') = (tien_no_dau is not null)
    and (loai <> 'no_dau' or (nha_cung_cap_id is not null and tien_no_dau > 0
                              and tien_thue = 0 and chi_phi_khac = 0)));

create index kho_phieu_nhap_ma_gui_chung_idx on kho_phieu_nhap(ma_gui_chung) where ma_gui_chung is not null;

comment on column kho_phieu_nhap.tien_no_dau is
  'Chỉ phiếu no_dau (0035): số tiền còn nợ nhà cung cấp lúc bắt đầu dùng phần mềm, đồng. Chép luôn sang tien_hoa_don (đã đối chiếu) nên công nợ tính như phiếu mua.';
comment on column kho_phieu_nhap.ma_gui_chung is
  'Mã gửi của cả lượt khi một lần bấm tạo nhiều phiếu (tồn đầu kỳ dạng lưới, nợ đầu kỳ — 0035). ma_gui của từng phiếu = md5(ma_gui_chung:khóa nhóm).';


-- =============================================================================
-- 2 · VIEW — dựng lại, GIỮ NGUYÊN cột và thứ tự
-- =============================================================================
-- Công nợ: thêm no_dau; "tổng phiếu" cộng tien_no_dau (phiếu không có dòng).
create or replace view kho_v_cong_no_phieu with (security_invoker = true) as
select x.*,
       x.phai_tra - x.da_tra - x.giam_tru as con_no,
       (x.phai_tra - x.da_tra - x.giam_tru > 0
        and x.han_thanh_toan is not null and x.han_thanh_toan < hom_nay_vn()) as qua_han,
       case when x.phai_tra - x.da_tra - x.giam_tru > 0 and x.han_thanh_toan < hom_nay_vn()
            then hom_nay_vn() - x.han_thanh_toan else 0 end as so_ngay_qua_han
from (
  select p.id, p.chi_nhanh_id, p.so_phieu, p.nha_cung_cap_id, n.ten as ten_nha_cung_cap,
         p.ngay_nhap, p.so_hoa_don, p.ngay_hoa_don, p.han_thanh_toan,
         p.tien_hoa_don, p.da_doi_chieu, p.ghi_chu_doi_chieu, p.doi_chieu_luc,
         coalesce(d.tien_hang, 0) + p.tien_thue + p.chi_phi_khac + coalesce(p.tien_no_dau, 0) as tong_tien_phieu,
         coalesce(p.tien_hoa_don,
                  coalesce(d.tien_hang, 0) + p.tien_thue + p.chi_phi_khac + coalesce(p.tien_no_dau, 0)) as phai_tra,
         coalesce(t.da_tra, 0) as da_tra,
         coalesce(t.giam_tru, 0) as giam_tru
  from kho_phieu_nhap p
  join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
  left join lateral (
    select sum(dd.thanh_tien) as tien_hang from kho_phieu_nhap_dong dd where dd.phieu_nhap_id = p.id
  ) d on true
  left join lateral (
    select sum(pb.so_tien) filter (where tt.loai = 'thanh_toan') as da_tra,
           sum(pb.so_tien) filter (where tt.loai = 'giam_tru') as giam_tru
    from kho_thanh_toan_phan_bo pb
    join kho_thanh_toan tt on tt.id = pb.thanh_toan_id
    where pb.phieu_nhap_id = p.id and tt.trang_thai = 'hieu_luc'
  ) t on true
  -- 0035: cả nợ đầu kỳ.
  where p.loai in ('mua', 'no_dau') and p.trang_thai = 'da_duyet'
) x;

comment on view kho_v_cong_no_phieu is
  'Công nợ từng phiếu nhập mua đã duyệt và từng phiếu nợ đầu kỳ (0035): phải trả, đã trả, giảm trừ, còn nợ, quá hạn. Chỉ vai xem giá đọc được (RLS của kho_phieu_nhap).';

-- Chép nguyên văn 0024 (không đổi) — dựng lại cho rõ nó đi theo view trên.
create or replace view kho_v_cong_no_ncc with (security_invoker = true) as
select c.chi_nhanh_id, c.nha_cung_cap_id, c.ten_nha_cung_cap,
       count(*)::int as so_phieu,
       (count(*) filter (where c.con_no <> 0))::int as so_phieu_con_no,
       (count(*) filter (where not c.da_doi_chieu))::int as so_phieu_chua_doi_chieu,
       sum(c.phai_tra)::bigint as tong_phai_tra,
       sum(c.da_tra)::bigint as da_tra,
       sum(c.giam_tru)::bigint as giam_tru,
       sum(c.con_no)::bigint as con_no,
       coalesce(sum(c.con_no) filter (where c.qua_han), 0)::bigint as no_qua_han,
       min(c.han_thanh_toan) filter (where c.con_no > 0) as han_gan_nhat
from kho_v_cong_no_phieu c
group by c.chi_nhanh_id, c.nha_cung_cap_id, c.ten_nha_cung_cap;

comment on view kho_v_cong_no_ncc is 'Công nợ gom theo nhà cung cấp (gồm cả nợ đầu kỳ — 0035).';

-- Danh sách phiếu nhập hàng: bỏ nợ đầu kỳ (không có hàng, không có vị trí).
create or replace view kho_v_phieu_nhap with (security_invoker = true) as
select p.id, p.chi_nhanh_id, p.so_phieu, p.loai, p.trang_thai, p.phien_ban,
       p.nha_cung_cap_id, ncc.ten as ten_nha_cung_cap,
       p.vi_tri_id, v.ten as ten_vi_tri,
       p.ngay_nhap, p.so_hoa_don, p.ngay_hoa_don, p.han_thanh_toan,
       p.tien_thue, p.chi_phi_khac, p.ghi_chu, p.ly_do,
       p.nguoi_tao, p.nguoi_gui, p.gui_luc, p.nguoi_duyet, p.duyet_luc,
       p.nguoi_huy, p.huy_luc, p.created_at, p.updated_at,
       coalesce(d.so_dong, 0)   as so_dong,
       coalesce(d.tong_kg, 0)   as tong_kg,
       coalesce(d.tong_goi, 0)  as tong_goi,
       coalesce(d.tien_hang, 0) as tien_hang,
       coalesce(d.tien_hang, 0) + p.tien_thue + p.chi_phi_khac as tong_tien
from kho_phieu_nhap p
left join kho_nha_cung_cap ncc on ncc.id = p.nha_cung_cap_id
left join kho_vi_tri v on v.id = p.vi_tri_id
left join lateral (
  select count(*) as so_dong, sum(dd.so_kg) as tong_kg,
         sum(dd.so_goi) as tong_goi, sum(dd.thanh_tien) as tien_hang
  from kho_phieu_nhap_dong dd where dd.phieu_nhap_id = p.id
) d on true
where p.loai <> 'no_dau';

comment on view kho_v_phieu_nhap is
  'Danh sách phiếu nhập kèm tổng kg, tổng tiền. Chỉ vai xem_gia đọc được (RLS của kho_phieu_nhap). 0035: không gồm phiếu nợ đầu kỳ — xem ở kho_v_cong_no_phieu.';


-- =============================================================================
-- 3 · GHI NỢ ĐẦU KỲ — kế toán
-- =============================================================================
-- p_dong: [{nha_cung_cap_id, so_tien, han_thanh_toan?, so_hoa_don?, ghi_chu?}]
--   · mỗi nhà cung cấp một dòng; nhà cung cấp đã có nợ đầu kỳ còn hiệu lực ở
--     chi nhánh này → báo lỗi (hủy phiếu cũ rồi ghi lại).
--   · hạn bỏ trống = hôm nay + số ngày nợ của nhà cung cấp (như phiếu mua).
-- Trả: {da_co, tong_tien, phieu: [{nha_cung_cap_id, phieu_id, so_phieu, so_tien, han_thanh_toan}]}
create or replace function kho_ghi_no_dau_ky(p_chi_nhanh_id uuid, p_ma_gui uuid, p_dong jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv    nhan_su;
  v_dong  jsonb;
  v_khoa  text;
  v_i     int := 0;
  v_ncc   kho_nha_cung_cap;
  v_tien  bigint;
  v_han   date;
  v_hd    text;
  v_gc    text;
  v_so    text;
  v_ds    uuid[] := '{}';
  c_khoa  constant text[] := array['nha_cung_cap_id', 'so_tien', 'han_thanh_toan', 'so_hoa_don', 'ghi_chu'];
  c_uuid  constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    raise exception 'Tài khoản của bạn không được ghi nợ đầu kỳ' using errcode = 'insufficient_privilege';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;
  if p_ma_gui is null then
    raise exception 'Thiếu mã gửi — tải lại trang rồi làm lại' using errcode = 'check_violation';
  end if;
  v_nv := nhan_su_hien_tai();

  if not exists (select 1 from kho_phieu_nhap p
                 where p.ma_gui_chung = p_ma_gui and p.loai = 'no_dau' and p.chi_nhanh_id = p_chi_nhanh_id) then
    if p_dong is null or jsonb_typeof(p_dong) <> 'array' or jsonb_array_length(p_dong) = 0 then
      raise exception 'Chưa có dòng nợ nào' using errcode = 'check_violation';
    end if;
    if jsonb_array_length(p_dong) > 300 then
      raise exception 'Tối đa 300 nhà cung cấp một lần' using errcode = 'check_violation';
    end if;

    for v_dong in select value from jsonb_array_elements(p_dong) loop
      v_i := v_i + 1;
      if jsonb_typeof(v_dong) <> 'object' then
        raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
      end if;
      for v_khoa in select jsonb_object_keys(v_dong) loop
        if not (v_khoa = any(c_khoa)) then
          raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
        end if;
      end loop;

      if jsonb_typeof(v_dong -> 'nha_cung_cap_id') is distinct from 'string'
         or (v_dong ->> 'nha_cung_cap_id') !~* c_uuid then
        raise exception 'Dòng %: chưa chọn nhà cung cấp', v_i using errcode = 'check_violation';
      end if;
      select * into v_ncc from kho_nha_cung_cap where id = (v_dong ->> 'nha_cung_cap_id')::uuid;
      if not found then
        raise exception 'Dòng %: không tìm thấy nhà cung cấp', v_i using errcode = 'check_violation';
      end if;
      if v_ncc.id = any(v_ds) then
        raise exception 'Dòng % (%): nhà cung cấp này đã có ở dòng trên — gộp thành một dòng', v_i, v_ncc.ten
          using errcode = 'check_violation';
      end if;
      select p.so_phieu into v_so from kho_phieu_nhap p
      where p.chi_nhanh_id = p_chi_nhanh_id and p.nha_cung_cap_id = v_ncc.id
        and p.loai = 'no_dau' and p.trang_thai <> 'da_huy'
      limit 1;
      if v_so is not null then
        raise exception 'Dòng % (%): đã ghi nợ đầu kỳ ở phiếu % — hủy phiếu đó trước nếu muốn ghi lại', v_i, v_ncc.ten, v_so
          using errcode = 'check_violation';
      end if;

      if jsonb_typeof(v_dong -> 'so_tien') is distinct from 'number'
         or (v_dong ->> 'so_tien')::numeric <> trunc((v_dong ->> 'so_tien')::numeric)
         or (v_dong ->> 'so_tien')::numeric <= 0
         or (v_dong ->> 'so_tien')::numeric >= 10000000000000 then
        raise exception 'Dòng % (%): số tiền nợ phải là số đồng lớn hơn 0', v_i, v_ncc.ten
          using errcode = 'check_violation';
      end if;
      v_tien := (v_dong ->> 'so_tien')::bigint;

      v_han := null;
      if coalesce(v_dong ->> 'han_thanh_toan', '') <> '' then
        begin
          v_han := (v_dong ->> 'han_thanh_toan')::date;
        exception when others then
          raise exception 'Dòng % (%): hạn thanh toán không hợp lệ', v_i, v_ncc.ten using errcode = 'check_violation';
        end;
        if v_han < hom_nay_vn() - 3650 or v_han > hom_nay_vn() + 3650 then
          raise exception 'Dòng % (%): hạn thanh toán không hợp lệ', v_i, v_ncc.ten using errcode = 'check_violation';
        end if;
      else
        v_han := hom_nay_vn() + coalesce(v_ncc.so_ngay_no, 0);
      end if;

      v_hd := nullif(btrim(coalesce(v_dong ->> 'so_hoa_don', '')), '');
      v_gc := nullif(btrim(coalesce(v_dong ->> 'ghi_chu', '')), '');
      if length(v_hd) > 60 or length(v_gc) > 500 then
        raise exception 'Dòng % (%): số hóa đơn tối đa 60 ký tự, ghi chú tối đa 500', v_i, v_ncc.ten
          using errcode = 'check_violation';
      end if;

      insert into kho_phieu_nhap
        (chi_nhanh_id, so_phieu, ma_gui, ma_gui_chung, loai, nha_cung_cap_id, vi_tri_id,
         ngay_nhap, so_hoa_don, han_thanh_toan, ghi_chu, tien_no_dau,
         tien_hoa_don, da_doi_chieu, nguoi_doi_chieu, doi_chieu_luc,
         trang_thai, nguoi_tao, nguoi_gui, gui_luc, nguoi_duyet, duyet_luc)
      values
        (p_chi_nhanh_id, kho_sinh_so(p_chi_nhanh_id, 'ND'),
         md5(p_ma_gui::text || ':' || v_ncc.id::text)::uuid, p_ma_gui, 'no_dau', v_ncc.id, null,
         hom_nay_vn(), v_hd, v_han, v_gc, v_tien,
         v_tien, true, v_nv.id, now(),
         'da_duyet', v_nv.id, v_nv.id, now(), v_nv.id, now());

      v_ds := v_ds || v_ncc.id;
    end loop;
  end if;

  return (
    select jsonb_build_object(
      'da_co',     v_i = 0,
      'tong_tien', coalesce(sum(p.tien_no_dau), 0),
      'phieu',     coalesce(jsonb_agg(jsonb_build_object(
                     'nha_cung_cap_id', p.nha_cung_cap_id,
                     'phieu_id',        p.id,
                     'so_phieu',        p.so_phieu,
                     'so_tien',         p.tien_no_dau,
                     'han_thanh_toan',  p.han_thanh_toan) order by p.so_phieu), '[]'::jsonb))
    from kho_phieu_nhap p
    where p.ma_gui_chung = p_ma_gui and p.loai = 'no_dau' and p.chi_nhanh_id = p_chi_nhanh_id);
end;
$$;

comment on function kho_ghi_no_dau_ky is
  'Kế toán ghi nợ đầu kỳ: mỗi nhà cung cấp một phiếu ND- đã duyệt, đã đối chiếu (tien_no_dau = tien_hoa_don). Không hàng, không lô, không sổ kho. Chống trùng theo p_ma_gui. Hủy bằng kho_huy_phieu_nhap.';


-- =============================================================================
-- 4 · HỦY PHIẾU NHẬP — kế toán hủy được nợ đầu kỳ
-- =============================================================================
-- Chép nguyên văn 0020; chỗ đổi có ghi "0035".
create or replace function kho_huy_phieu_nhap(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn    kho_phieu_nhap;
  v_dong  record;
  v_nv    nhan_su;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  if not found then
    raise exception 'Không tìm thấy phiếu nhập' using errcode = 'foreign_key_violation';
  end if;
  if v_pn.trang_thai = 'da_huy' then
    return 'Phiếu ' || v_pn.so_phieu || ' đã bị hủy trước đó.';
  end if;
  if v_pn.trang_thai = 'cho_duyet' then
    raise exception 'Phiếu đang chờ duyệt — rút về hoặc từ chối trước khi hủy'
      using errcode = 'check_violation';
  end if;

  v_nv := nhan_su_hien_tai();

  -- 0035: nợ đầu kỳ — việc của kế toán. Không có lô, không có sổ kho: chỉ
  -- đổi trạng thái. Đã có thanh toán / giảm trừ thì trigger 0024 chặn.
  if v_pn.loai = 'no_dau' then
    if not kho_duoc(v_pn.chi_nhanh_id, 'ke_toan') then
      raise exception 'Chỉ kế toán hoặc quản lý hủy được nợ đầu kỳ' using errcode = 'insufficient_privilege';
    end if;
    if coalesce(btrim(p_ly_do), '') = '' then
      raise exception 'Cần ghi lý do hủy nợ đầu kỳ' using errcode = 'check_violation';
    end if;
    perform 1 from kho_cai_dat where chi_nhanh_id = v_pn.chi_nhanh_id for update;
    select * into v_pn from kho_phieu_nhap where id = p_id for update;
    if v_pn.trang_thai <> 'da_duyet' then
      raise exception 'Phiếu vừa được người khác xử lý — tải lại trang' using errcode = 'check_violation';
    end if;
    update kho_phieu_nhap set
      trang_thai = 'da_huy', ly_do = btrim(p_ly_do),
      nguoi_huy = v_nv.id, huy_luc = now(), phien_ban = phien_ban + 1
    where id = p_id;
    return 'Đã hủy nợ đầu kỳ ' || v_pn.so_phieu || '.';
  end if;

  if v_pn.trang_thai in ('nhap', 'tu_choi') then
    if not kho_duoc(v_pn.chi_nhanh_id, 'nhap') then
      raise exception 'Tài khoản của bạn không được hủy phiếu nhập'
        using errcode = 'insufficient_privilege';
    end if;
    update kho_phieu_nhap set
      trang_thai = 'da_huy', ly_do = nullif(btrim(p_ly_do), ''),
      nguoi_huy = v_nv.id, huy_luc = now(), phien_ban = phien_ban + 1
    where id = p_id;
    return 'Đã hủy phiếu nháp ' || v_pn.so_phieu || '.';
  end if;

  -- Từ đây: phiếu đã duyệt. Cùng cửa với việc duyệt.
  if not kho_duoc(v_pn.chi_nhanh_id, 'duyet') then
    raise exception 'Chỉ quản lý hủy được phiếu đã duyệt' using errcode = 'insufficient_privilege';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Cần ghi lý do hủy phiếu đã duyệt' using errcode = 'check_violation';
  end if;

  perform 1 from kho_cai_dat where chi_nhanh_id = v_pn.chi_nhanh_id for update;
  select * into v_pn from kho_phieu_nhap where id = p_id for update;
  if v_pn.trang_thai <> 'da_duyet' then
    raise exception 'Phiếu vừa được người khác xử lý — tải lại trang' using errcode = 'check_violation';
  end if;

  for v_dong in
    select d.lo_id, l.ma_lo,
           (select count(*) from kho_so_cai s where s.lo_id = d.lo_id) as so_dong
    from kho_phieu_nhap_dong d
    join kho_lo l on l.id = d.lo_id
    where d.phieu_nhap_id = p_id
  loop
    if v_dong.so_dong <> 1 then
      raise exception 'Không hủy được: lô % đã được dùng (pha lóc, chuyển, xuất hoặc kiểm kê). Hãy điều chỉnh qua kiểm kê.', v_dong.ma_lo
        using errcode = 'check_violation';
    end if;
  end loop;

  insert into kho_so_cai
    (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
     chung_tu_loai, chung_tu_id, dao_cua, ghi_chu, nguoi_ghi)
  select s.chi_nhanh_id, s.lo_id, s.vi_tri_id, s.mat_hang_id, 'dao_nguoc',
         -s.so_kg, -s.so_goi, 'phieu_nhap', p_id, s.id, 'Hủy phiếu nhập', v_nv.id
  from kho_so_cai s
  join kho_phieu_nhap_dong d on d.lo_id = s.lo_id
  where d.phieu_nhap_id = p_id and s.loai = 'nhap'
  order by d.thu_tu;

  update kho_phieu_nhap set
    trang_thai = 'da_huy', ly_do = btrim(p_ly_do),
    nguoi_huy = v_nv.id, huy_luc = now(), phien_ban = phien_ban + 1
  where id = p_id;

  return 'Đã hủy phiếu ' || v_pn.so_phieu || ' và trả tồn về như trước khi nhập.';
end;
$$;


-- =============================================================================
-- 5 · HÀM ĐỌC CHỈ KG (0031) — bỏ phiếu nợ đầu kỳ
-- =============================================================================
-- Chép nguyên văn 0031; chỗ đổi có ghi "0035". Nợ đầu kỳ là loại phiếu CÓ
-- TIỀN, không có hàng: người nhận hàng không có gì để xem ở đó.
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
        and p.loai <> 'no_dau'   -- 0035
    ) x on true
    where n.dang_dung
    order by x.lan_cuoi desc nulls last, n.ten;
end;
$$;

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
      and p.loai <> 'no_dau'   -- 0035
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
  -- 0035: phiếu nợ đầu kỳ coi như không có.
  if not found or v_pn.loai = 'no_dau' or not kho_duoc(v_pn.chi_nhanh_id, 'nhap') then
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


-- =============================================================================
-- 6 · TỒN ĐẦU KỲ DẠNG LƯỚI
-- =============================================================================
-- p_dong: [{vi_tri_id, mat_hang_id, so_goi?, so_kg, don_gia_kg?, han_dung?}]
--   · "Dòng N" trong câu lỗi là số dòng của cả lưới (người dán Excel dò lại
--     được), không phải số dòng trong từng phiếu.
--   · Hạn bỏ trống = p_ngay + hạn mặc định của mặt hàng.
--   · Đơn giá (giá vốn ước tính/kg) chỉ vai xem_gia gửi được — thủ kho để
--     trống, kế toán / quản lý điền khi duyệt như phiếu tồn đầu kỳ thường.
-- Trả: {da_co, phieu: [{vi_tri_id, phieu_id, so_phieu, trang_thai, so_dong}]}
--   trang_thai = 'da_duyet' (tự duyệt) hoặc 'cho_duyet'.
create or replace function kho_luu_ton_dau_ky(p_chi_nhanh_id uuid, p_ma_gui uuid, p_ngay date, p_dong jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv       nhan_su;
  v_cd       kho_cai_dat;
  v_xem_gia  boolean;
  v_tu_duyet boolean;
  v_da_co    boolean;
  v_dong     jsonb;
  v_khoa     text;
  v_i        int := 0;
  v_vt       uuid;
  v_mh       kho_mat_hang;
  v_kg       numeric;
  v_goi      int;
  v_gia      bigint;
  v_han      date;
  a_vt       uuid[] := '{}';
  a_mh       uuid[] := '{}';
  a_goi      int[] := '{}';
  a_kg       numeric[] := '{}';
  a_gia      bigint[] := '{}';
  a_han      date[] := '{}';
  v_ds_vt    uuid[] := '{}';
  v_id       uuid;
  v_pb       int;
  v_tt       int;
  j          int;
  c_khoa     constant text[] := array['vi_tri_id', 'mat_hang_id', 'so_goi', 'so_kg', 'don_gia_kg', 'han_dung'];
  c_uuid     constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not kho_duoc(p_chi_nhanh_id, 'nhap') then
    raise exception 'Tài khoản của bạn không được nhập tồn đầu kỳ' using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();
  v_xem_gia := kho_duoc(p_chi_nhanh_id, 'xem_gia');

  select * into v_cd from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho — vào Cài đặt kho, bấm "Bắt đầu dùng kho"'
      using errcode = 'check_violation';
  end if;
  if p_ma_gui is null then
    raise exception 'Thiếu mã gửi — tải lại trang rồi làm lại' using errcode = 'check_violation';
  end if;

  v_da_co := exists (select 1 from kho_phieu_nhap p
                     where p.ma_gui_chung = p_ma_gui and p.loai = 'ton_dau' and p.chi_nhanh_id = p_chi_nhanh_id);

  if not v_da_co then
    if p_ngay is null or p_ngay > hom_nay_vn() then
      raise exception 'Ngày tồn đầu kỳ không được trống hay sau hôm nay' using errcode = 'check_violation';
    end if;
    if p_ngay < hom_nay_vn() - 90 then
      raise exception 'Ngày tồn đầu kỳ quá 90 ngày trước — kiểm tra lại ngày' using errcode = 'check_violation';
    end if;
    if p_dong is null or jsonb_typeof(p_dong) <> 'array' or jsonb_array_length(p_dong) = 0 then
      raise exception 'Chưa có dòng hàng nào' using errcode = 'check_violation';
    end if;
    if jsonb_array_length(p_dong) > 500 then
      raise exception 'Tối đa 500 dòng một lần — chia thành nhiều lần' using errcode = 'check_violation';
    end if;

    -- Lượt 1: kiểm hết mọi dòng trước khi ghi gì.
    for v_dong in select value from jsonb_array_elements(p_dong) loop
      v_i := v_i + 1;
      if jsonb_typeof(v_dong) <> 'object' then
        raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
      end if;
      for v_khoa in select jsonb_object_keys(v_dong) loop
        if not (v_khoa = any(c_khoa)) then
          raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
        end if;
      end loop;

      if jsonb_typeof(v_dong -> 'vi_tri_id') is distinct from 'string'
         or (v_dong ->> 'vi_tri_id') !~* c_uuid
         or not exists (select 1 from kho_vi_tri
                        where id = (v_dong ->> 'vi_tri_id')::uuid and chi_nhanh_id = p_chi_nhanh_id
                          and dang_dung and loai in ('kho', 'quay')) then
        raise exception 'Dòng %: chọn nơi để là một kho hoặc quầy đang dùng của chi nhánh này', v_i
          using errcode = 'check_violation';
      end if;
      v_vt := (v_dong ->> 'vi_tri_id')::uuid;

      if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string'
         or (v_dong ->> 'mat_hang_id') !~* c_uuid then
        raise exception 'Dòng %: chưa chọn mặt hàng', v_i using errcode = 'check_violation';
      end if;
      select * into v_mh from kho_mat_hang where id = (v_dong ->> 'mat_hang_id')::uuid;
      if not found or not v_mh.dang_dung then
        raise exception 'Dòng %: mặt hàng không có hoặc đã ngừng dùng', v_i using errcode = 'check_violation';
      end if;

      if jsonb_typeof(v_dong -> 'so_kg') is distinct from 'number' then
        raise exception 'Dòng % (%): chưa nhập số kg', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      v_kg := (v_dong ->> 'so_kg')::numeric;
      if v_kg <= 0 or v_kg >= 1000000 or v_kg <> round(v_kg, 3) then
        raise exception 'Dòng % (%): số kg phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;

      v_goi := 0;
      if v_dong ? 'so_goi' and v_dong -> 'so_goi' <> 'null'::jsonb then
        if jsonb_typeof(v_dong -> 'so_goi') <> 'number'
           or (v_dong ->> 'so_goi')::numeric <> trunc((v_dong ->> 'so_goi')::numeric)
           or (v_dong ->> 'so_goi')::numeric < 0
           or (v_dong ->> 'so_goi')::numeric > 100000 then
          raise exception 'Dòng % (%): số % phải là số nguyên không âm', v_i, v_mh.ten, v_mh.don_vi_goi
            using errcode = 'check_violation';
        end if;
        v_goi := (v_dong ->> 'so_goi')::int;
      end if;
      if v_mh.dem_goi and v_goi = 0 then
        raise exception 'Dòng % (%): chưa nhập số %', v_i, v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;

      v_gia := 0;
      if v_dong ? 'don_gia_kg' and v_dong -> 'don_gia_kg' <> 'null'::jsonb then
        if not v_xem_gia then
          raise exception 'Tài khoản của bạn không điền giá — để trống cột đơn giá, kế toán điền khi duyệt'
            using errcode = 'insufficient_privilege';
        end if;
        if jsonb_typeof(v_dong -> 'don_gia_kg') <> 'number'
           or (v_dong ->> 'don_gia_kg')::numeric <> trunc((v_dong ->> 'don_gia_kg')::numeric)
           or (v_dong ->> 'don_gia_kg')::numeric < 0
           or (v_dong ->> 'don_gia_kg')::numeric >= 10000000000000 then
          raise exception 'Dòng % (%): đơn giá phải là số đồng không âm', v_i, v_mh.ten
            using errcode = 'check_violation';
        end if;
        v_gia := (v_dong ->> 'don_gia_kg')::bigint;
      end if;

      if coalesce(v_dong ->> 'han_dung', '') <> '' then
        begin
          v_han := (v_dong ->> 'han_dung')::date;
        exception when others then
          raise exception 'Dòng % (%): hạn dùng không hợp lệ', v_i, v_mh.ten using errcode = 'check_violation';
        end;
        if v_han < p_ngay - 3650 or v_han > p_ngay + 3650 then
          raise exception 'Dòng % (%): hạn dùng không hợp lệ', v_i, v_mh.ten using errcode = 'check_violation';
        end if;
      elsif v_mh.han_dung_ngay is not null then
        v_han := p_ngay + v_mh.han_dung_ngay;
      else
        raise exception 'Dòng % (%): chưa có hạn dùng, và mặt hàng chưa cài hạn mặc định', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;

      a_vt  := a_vt  || v_vt;
      a_mh  := a_mh  || v_mh.id;
      a_goi := a_goi || v_goi;
      a_kg  := a_kg  || v_kg;
      a_gia := a_gia || v_gia;
      a_han := a_han || v_han;
      if not (v_vt = any(v_ds_vt)) then
        v_ds_vt := v_ds_vt || v_vt;
      end if;
    end loop;

    -- Lượt 2: mỗi vị trí một phiếu, theo thứ tự xuất hiện trong lưới.
    v_tu_duyet := v_cd.cho_tu_duyet and kho_duoc(p_chi_nhanh_id, 'duyet_nhap');
    foreach v_vt in array v_ds_vt loop
      insert into kho_phieu_nhap
        (chi_nhanh_id, so_phieu, ma_gui, ma_gui_chung, loai, vi_tri_id, ngay_nhap, nguoi_tao)
      values
        (p_chi_nhanh_id, kho_sinh_so(p_chi_nhanh_id, 'TD'),
         md5(p_ma_gui::text || ':' || v_vt::text)::uuid, p_ma_gui, 'ton_dau', v_vt, p_ngay, v_nv.id)
      returning id, phien_ban into v_id, v_pb;

      v_tt := 0;
      for j in 1..cardinality(a_vt) loop
        continue when a_vt[j] <> v_vt;
        v_tt := v_tt + 1;
        insert into kho_phieu_nhap_dong
          (phieu_nhap_id, chi_nhanh_id, thu_tu, mat_hang_id, so_goi, so_kg, don_gia_kg, han_dung)
        values
          (v_id, p_chi_nhanh_id, v_tt, a_mh[j], a_goi[j], a_kg[j], a_gia[j], a_han[j]);
      end loop;

      -- Gửi luôn (tồn đầu kỳ không kiểm ô bắt buộc — 0031). Tự duyệt khi được.
      perform kho_gui_duyet_phieu_nhap(v_id, v_pb);
      if v_tu_duyet then
        perform kho_duyet_phieu_nhap(v_id);
      end if;
    end loop;
  end if;

  return (
    select jsonb_build_object(
      'da_co', v_da_co,
      'phieu', coalesce(jsonb_agg(jsonb_build_object(
                 'vi_tri_id',  p.vi_tri_id,
                 'phieu_id',   p.id,
                 'so_phieu',   p.so_phieu,
                 'trang_thai', p.trang_thai,
                 'so_dong',    (select count(*)::int from kho_phieu_nhap_dong d where d.phieu_nhap_id = p.id))
               order by p.so_phieu), '[]'::jsonb))
    from kho_phieu_nhap p
    where p.ma_gui_chung = p_ma_gui and p.loai = 'ton_dau' and p.chi_nhanh_id = p_chi_nhanh_id);
end;
$$;

comment on function kho_luu_ton_dau_ky is
  'Tồn đầu kỳ dạng lưới: mỗi vị trí một phiếu ton_dau (TD-), gửi duyệt luôn; tự duyệt khi cho_tu_duyet bật và người gọi có duyet_nhap. Quyền nhap; đơn giá chỉ vai xem_gia. Chống trùng theo p_ma_gui.';


-- =============================================================================
-- 7 · THIẾT LẬP: MỐC ĐÃ LƯU, BỎ QUA BƯỚC
-- =============================================================================
alter table kho_cai_dat
  add column goc_xem_luc    timestamptz,
  add column nguong_luu_luc timestamptz;

comment on column kho_cai_dat.goc_xem_luc is
  'Lần cuối chủ lưu cài đặt gốc (cách tính giá vốn, nguồn số bán, tự duyệt) — trigger ghi. null = chưa ai xem bước "Giá vốn" của Thiết lập.';
comment on column kho_cai_dat.nguong_luu_luc is
  'Lần cuối lưu ngưỡng cảnh báo — trigger ghi. null = đang dùng ngưỡng mặc định, chưa ai xem.';

-- Trigger "update of <cột>" chạy khi cột có trong lệnh SET, kể cả giữ nguyên
-- giá trị: bấm Lưu mà không đổi gì vẫn tính là đã xem.
create or replace function kho_cai_dat_ghi_moc()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_argv[0] = 'goc' then
    new.goc_xem_luc := now();
  else
    new.nguong_luu_luc := now();
  end if;
  return new;
end;
$$;

create trigger kho_cai_dat_moc_goc
  before update of phuong_phap_gia_von, chi_phi_vao_gia_von, vat_vao_gia_von, nguon_so_ban, cho_tu_duyet
  on kho_cai_dat
  for each row execute function kho_cai_dat_ghi_moc('goc');

create trigger kho_cai_dat_moc_nguong
  before update of nguong_gia_mua_pt, nguong_thu_hoi_diem, gio_nhac_chuyen, gio_chot_ngay, nguong_dinh_muc_pt
  on kho_cai_dat
  for each row execute function kho_cai_dat_ghi_moc('nguong');

-- Chép nguyên văn 0032; chỗ đổi có ghi "0035". Công tắc "Quầy phải bấm nhận"
-- cũng lưu qua hàm này — gạt công tắc không được đánh dấu bước "Ngưỡng" xong.
create or replace function kho_luu_nguong(p_chi_nhanh_id uuid, p_nguong jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_khoa text;
  v_so   numeric;
  v_moc  timestamptz;
  v_hop_le constant text[] := array['nguong_gia_mua_pt', 'nguong_thu_hoi_diem', 'gio_nhac_chuyen',
                                    'gio_chot_ngay', 'nguong_dinh_muc_pt', 'chuyen_quay_can_nhan'];
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không được sửa cài đặt kho'
      using errcode = 'insufficient_privilege';
  end if;
  if p_nguong is null or jsonb_typeof(p_nguong) <> 'object' then
    raise exception 'Ngưỡng phải là một đối tượng {tên: số}' using errcode = 'check_violation';
  end if;

  -- 0035: giữ mốc cũ (xem cuối hàm).
  select nguong_luu_luc into v_moc from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Kho của chi nhánh này chưa được khởi tạo' using errcode = 'check_violation';
  end if;

  for v_khoa in select jsonb_object_keys(p_nguong) loop
    if not (v_khoa = any(v_hop_le)) then
      raise exception 'Không có ngưỡng tên "%"', v_khoa using errcode = 'check_violation';
    end if;
    -- 0032: công tắc là đúng/sai, không phải số.
    if v_khoa = 'chuyen_quay_can_nhan' then
      if jsonb_typeof(p_nguong -> v_khoa) <> 'boolean' then
        raise exception '"%" phải là bật hoặc tắt', v_khoa using errcode = 'check_violation';
      end if;
      continue;
    end if;
    if jsonb_typeof(p_nguong -> v_khoa) <> 'number' then
      raise exception 'Ngưỡng "%" phải là một con số', v_khoa using errcode = 'check_violation';
    end if;
    v_so := (p_nguong ->> v_khoa)::numeric;
    if v_khoa in ('gio_nhac_chuyen', 'gio_chot_ngay') and v_so <> trunc(v_so) then
      raise exception 'Ngưỡng "%" phải là số giờ nguyên', v_khoa using errcode = 'check_violation';
    end if;
  end loop;

  update kho_cai_dat set
    nguong_gia_mua_pt    = coalesce((p_nguong ->> 'nguong_gia_mua_pt')::numeric,   nguong_gia_mua_pt),
    nguong_thu_hoi_diem  = coalesce((p_nguong ->> 'nguong_thu_hoi_diem')::numeric, nguong_thu_hoi_diem),
    gio_nhac_chuyen      = coalesce((p_nguong ->> 'gio_nhac_chuyen')::smallint,    gio_nhac_chuyen),
    gio_chot_ngay        = coalesce((p_nguong ->> 'gio_chot_ngay')::smallint,      gio_chot_ngay),
    nguong_dinh_muc_pt   = coalesce((p_nguong ->> 'nguong_dinh_muc_pt')::numeric,  nguong_dinh_muc_pt),
    chuyen_quay_can_nhan = coalesce((p_nguong ->> 'chuyen_quay_can_nhan')::boolean, chuyen_quay_can_nhan)
  where chi_nhanh_id = p_chi_nhanh_id;

  -- 0035: lệnh trên luôn có đủ 5 cột ngưỡng trong SET nên trigger mốc luôn
  -- chạy. Chỉ gạt công tắc quầy (không gửi ngưỡng nào) thì KHÔNG tính là đã
  -- xem ngưỡng: trả mốc về như cũ (lệnh này không đụng cột ngưỡng → trigger
  -- không chạy lại).
  if not (p_nguong ?| array['nguong_gia_mua_pt', 'nguong_thu_hoi_diem', 'gio_nhac_chuyen',
                            'gio_chot_ngay', 'nguong_dinh_muc_pt']) then
    update kho_cai_dat set nguong_luu_luc = v_moc where chi_nhanh_id = p_chi_nhanh_id;
  end if;
end;
$$;

-- Bước được đánh dấu bỏ qua ("không có nợ đầu kỳ", "không dùng máy chung"...).
-- Hai bước không bỏ qua được: nhân viên và mặt hàng.
create table kho_thiet_lap_bo_qua (
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete cascade,
  buoc         text not null,
  nguoi        uuid references nhan_su(id) on delete set null,
  luc          timestamptz not null default now(),
  primary key (chi_nhanh_id, buoc),

  constraint kho_thiet_lap_bo_qua_buoc_hop_le check (buoc in (
    'cong_thuc', 'ncc_no_dau', 'ton_dau', 'gia_von', 'dinh_muc',
    'vi_tri_ly_do_ma_vach', 'nguong', 'may_chung'))
);

alter table kho_thiet_lap_bo_qua enable row level security;

create policy kho_thiet_lap_bo_qua_doc on kho_thiet_lap_bo_qua
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));

comment on table kho_thiet_lap_bo_qua is
  'Bước Thiết lập được đánh dấu bỏ qua theo chi nhánh (0035). Ghi qua kho_danh_dau_thiet_lap.';


-- =============================================================================
-- 8 · TIẾN ĐỘ THIẾT LẬP
-- =============================================================================
-- Một bước: {xong, so?, thieu?, bo_qua, duoc_bo_qua}. so / thieu vắng khi
-- bước đó không đếm gì. NỘI BỘ.
create or replace function kho_buoc_thiet_lap(
  p_dat boolean, p_bo_qua boolean, p_duoc_bo_qua boolean, p_so int, p_thieu int)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'xong',        coalesce(p_dat, false) or (p_duoc_bo_qua and coalesce(p_bo_qua, false)),
    'so',          p_so,
    'thieu',       p_thieu,
    'bo_qua',      p_duoc_bo_qua and coalesce(p_bo_qua, false),
    'duoc_bo_qua', p_duoc_bo_qua));
$$;

comment on function kho_buoc_thiet_lap is 'NỘI BỘ. Dựng một bước của kho_tien_do_thiet_lap.';

-- Quyền xem. CHỈ SỐ ĐẾM, không tiền (thủ kho, NV quầy gọi được).
--   chi_nhanh_nhan_vien  so = thủ kho + NV quầy đang làm; xong khi ≥ 1
--   mat_hang             so = mặt hàng đang dùng; thieu = món thiếu hạn mặc
--                        định, hoặc phần cắt thiếu giá bán / mã cân; xong khi
--                        so ≥ 1 và thieu = 0
--   cong_thuc            so = công thức đang dùng; thieu = tảng chưa có công
--                        thức; xong khi so ≥ 1
--   ncc_no_dau           so = NCC đang dùng; thieu = NCC chưa ghi nợ đầu kỳ;
--                        xong khi so ≥ 1 và (đã ghi ≥ 1 phiếu nợ đầu kỳ hoặc
--                        đánh dấu "không có nợ")
--   ton_dau              so = kho/quầy đã có tồn đầu kỳ đã duyệt; thieu = kho/
--                        quầy chưa có; xong khi thieu = 0
--   gia_von              xong khi chủ đã lưu cài đặt gốc (goc_xem_luc)
--   dinh_muc             so = phần cắt có tồn tối thiểu; thieu = phần cắt chưa
--                        có; xong khi so ≥ 1
--   vi_tri_ly_do_ma_vach so = kho/quầy đang dùng; thieu = số mục còn thiếu
--                        trong 4: có kho, có quầy, có lý do, có mẫu mã vạch
--   nguong               xong khi đã lưu ngưỡng (nguong_luu_luc)
--   may_chung            so = máy đang dùng; xong khi ≥ 1
-- Bước đánh dấu bỏ qua (trừ chi_nhanh_nhan_vien, mat_hang) tính là xong.
-- Trả thêm: con_lai (số bước chưa xong), tong (10), da_khoi_tao.
create or replace function kho_tien_do_thiet_lap(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cd   kho_cai_dat;
  v_bq   text[];
  v      jsonb := '{}';
  v_so   int;
  v_thieu int;
  v_n    int;
  v_k    text;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được thiết lập kho của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id;
  v_bq := array(select b.buoc from kho_thiet_lap_bo_qua b where b.chi_nhanh_id = p_chi_nhanh_id);

  -- Chi nhánh & nhân viên
  select count(*)::int into v_so from nhan_su ns
  where ns.chi_nhanh_id = p_chi_nhanh_id and ns.dang_lam and ns.vai_tro in ('thu_kho', 'nhan_vien_quay');
  v := v || jsonb_build_object('chi_nhanh_nhan_vien', kho_buoc_thiet_lap(v_so >= 1, false, false, v_so, null));

  -- Mặt hàng
  select count(*)::int,
         (count(*) filter (where m.han_dung_ngay is null
                             or (m.loai = 'phan_cat' and (m.gia_ban_kg is null or m.ma_can is null))))::int
    into v_so, v_thieu
  from kho_mat_hang m where m.dang_dung;
  v := v || jsonb_build_object('mat_hang', kho_buoc_thiet_lap(v_so >= 1 and v_thieu = 0, false, false, v_so, v_thieu));

  -- Công thức pha lóc
  select count(*)::int into v_so
  from kho_cong_thuc_pha c join kho_mat_hang m on m.id = c.mat_hang_vao_id
  where c.dang_dung and m.dang_dung;
  select count(*)::int into v_thieu
  from kho_mat_hang m
  where m.dang_dung and m.loai = 'tang'
    and not exists (select 1 from kho_cong_thuc_pha c where c.mat_hang_vao_id = m.id and c.dang_dung);
  v := v || jsonb_build_object('cong_thuc',
         kho_buoc_thiet_lap(v_so >= 1, 'cong_thuc' = any(v_bq), true, v_so, v_thieu));

  -- Nhà cung cấp & nợ đầu kỳ
  select count(*)::int,
         (count(*) filter (where not exists (
            select 1 from kho_phieu_nhap p
            where p.nha_cung_cap_id = n.id and p.chi_nhanh_id = p_chi_nhanh_id
              and p.loai = 'no_dau' and p.trang_thai <> 'da_huy')))::int
    into v_so, v_thieu
  from kho_nha_cung_cap n where n.dang_dung;
  select count(*)::int into v_n from kho_phieu_nhap p
  where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'no_dau' and p.trang_thai <> 'da_huy';
  v := v || jsonb_build_object('ncc_no_dau', jsonb_strip_nulls(jsonb_build_object(
         'xong',        v_so >= 1 and (v_n >= 1 or 'ncc_no_dau' = any(v_bq)),
         'so',          v_so,
         'thieu',       v_thieu,
         'bo_qua',      'ncc_no_dau' = any(v_bq),
         'duoc_bo_qua', true)));

  -- Tồn đầu kỳ: mỗi kho / quầy đang dùng có phiếu tồn đầu kỳ đã duyệt
  select (count(*) filter (where x.co))::int, (count(*) filter (where not x.co))::int
    into v_so, v_thieu
  from (
    select exists (select 1 from kho_phieu_nhap p
                   where p.vi_tri_id = vt.id and p.loai = 'ton_dau' and p.trang_thai = 'da_duyet') as co
    from kho_vi_tri vt
    where vt.chi_nhanh_id = p_chi_nhanh_id and vt.dang_dung and vt.loai in ('kho', 'quay')
  ) x;
  v := v || jsonb_build_object('ton_dau',
         kho_buoc_thiet_lap(v_so + v_thieu >= 1 and v_thieu = 0, 'ton_dau' = any(v_bq), true, v_so, v_thieu));

  -- Giá vốn (cài đặt gốc)
  v := v || jsonb_build_object('gia_von',
         kho_buoc_thiet_lap(v_cd.goc_xem_luc is not null, 'gia_von' = any(v_bq), true, null, null));

  -- Định mức tồn ở quầy
  select (count(*) filter (where m.quay_toi_thieu_goi is not null or m.ton_toi_thieu_kg is not null))::int,
         (count(*) filter (where m.quay_toi_thieu_goi is null and m.ton_toi_thieu_kg is null))::int
    into v_so, v_thieu
  from kho_mat_hang m where m.dang_dung and m.loai = 'phan_cat';
  v := v || jsonb_build_object('dinh_muc',
         kho_buoc_thiet_lap(v_so >= 1, 'dinh_muc' = any(v_bq), true, v_so, v_thieu));

  -- Vị trí, lý do, mã vạch
  select count(*)::int into v_so from kho_vi_tri vt
  where vt.chi_nhanh_id = p_chi_nhanh_id and vt.dang_dung and vt.loai in ('kho', 'quay');
  v_thieu :=
      (case when exists (select 1 from kho_vi_tri vt where vt.chi_nhanh_id = p_chi_nhanh_id
                          and vt.dang_dung and vt.loai = 'kho') then 0 else 1 end)
    + (case when exists (select 1 from kho_vi_tri vt where vt.chi_nhanh_id = p_chi_nhanh_id
                          and vt.dang_dung and vt.loai = 'quay') then 0 else 1 end)
    + (case when exists (select 1 from kho_ly_do l where l.dang_dung) then 0 else 1 end)
    + (case when v_cd.mau_ma_vach is not null then 0 else 1 end);
  v := v || jsonb_build_object('vi_tri_ly_do_ma_vach',
         kho_buoc_thiet_lap(v_thieu = 0, 'vi_tri_ly_do_ma_vach' = any(v_bq), true, v_so, v_thieu));

  -- Ngưỡng cảnh báo
  v := v || jsonb_build_object('nguong',
         kho_buoc_thiet_lap(v_cd.nguong_luu_luc is not null, 'nguong' = any(v_bq), true, null, null));

  -- Máy dùng chung
  select count(*)::int into v_so from kho_may km where km.chi_nhanh_id = p_chi_nhanh_id and km.dang_dung;
  v := v || jsonb_build_object('may_chung',
         kho_buoc_thiet_lap(v_so >= 1, 'may_chung' = any(v_bq), true, v_so, null));

  v_n := 0;
  for v_k in select jsonb_object_keys(v) loop
    if not (v -> v_k ->> 'xong')::boolean then
      v_n := v_n + 1;
    end if;
  end loop;

  return v || jsonb_build_object('con_lai', v_n, 'tong', 10, 'da_khoi_tao', v_cd.chi_nhanh_id is not null);
end;
$$;

comment on function kho_tien_do_thiet_lap is
  'Tiến độ màn Thiết lập (0035): 10 bước {xong, so?, thieu?, bo_qua, duoc_bo_qua} + con_lai, tong, da_khoi_tao. Quyền xem; chỉ số đếm, không tiền.';

-- Đánh dấu / bỏ đánh dấu "bỏ qua" một bước. Quyền danh_muc; riêng
-- ncc_no_dau thì kế toán cũng bấm được ("Không có nợ đầu kỳ"), riêng gia_von
-- chỉ chủ (cai_dat_goc). Trả tiến độ mới.
create or replace function kho_danh_dau_thiet_lap(p_chi_nhanh_id uuid, p_buoc text, p_bo_qua boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_buoc is null or p_buoc not in ('cong_thuc', 'ncc_no_dau', 'ton_dau', 'gia_von', 'dinh_muc',
                                      'vi_tri_ly_do_ma_vach', 'nguong', 'may_chung') then
    raise exception 'Bước này không bỏ qua được' using errcode = 'check_violation';
  end if;
  if not (case p_buoc
            when 'ncc_no_dau' then kho_duoc(p_chi_nhanh_id, 'danh_muc') or kho_duoc(p_chi_nhanh_id, 'ke_toan')
            when 'gia_von'    then kho_duoc(p_chi_nhanh_id, 'cai_dat_goc')
            else kho_duoc(p_chi_nhanh_id, 'danh_muc')
          end) then
    raise exception 'Tài khoản của bạn không đánh dấu được bước này' using errcode = 'insufficient_privilege';
  end if;

  if coalesce(p_bo_qua, false) then
    insert into kho_thiet_lap_bo_qua (chi_nhanh_id, buoc, nguoi)
    values (p_chi_nhanh_id, p_buoc, (nhan_su_hien_tai()).id)
    on conflict (chi_nhanh_id, buoc) do nothing;
  else
    delete from kho_thiet_lap_bo_qua where chi_nhanh_id = p_chi_nhanh_id and buoc = p_buoc;
  end if;

  return kho_tien_do_thiet_lap(p_chi_nhanh_id);
end;
$$;

comment on function kho_danh_dau_thiet_lap is
  'Đánh dấu (p_bo_qua true) hoặc bỏ đánh dấu một bước Thiết lập là "bỏ qua". danh_muc; ncc_no_dau thêm kế toán; gia_von chỉ chủ. Trả kho_tien_do_thiet_lap.';


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_buoc_thiet_lap(boolean, boolean, boolean, int, int) from authenticated';
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
