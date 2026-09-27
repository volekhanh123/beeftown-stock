-- =============================================================================
-- BEEFTOWN KHO — 0048 · REPACK, TRUY VẾT TẢNG, HUỶ CẢ TẢNG, BÁO CÁO THEO TẢNG
-- =============================================================================
-- Quy trình thịt ủ (Lee Sang, 27/09): Nhập → REPACK cả tảng (mở túi, kiểm
-- tra, bỏ nước rỉ) → cân → Ủ → lấy ra lóc.
--
-- Giá vốn (đã chốt): TỔNG TIỀN MUA GIỮ NGUYÊN, CHIA CHO SỐ KG CÒN DÙNG ĐƯỢC.
--   12 kg × 450.000 = 5.400.000 đ; repack còn 11,8 kg → giá vốn 457.627 đ/kg.
-- Hao ủ, phần bỏ khi lóc đã đúng quy tắc này từ 0022 (giá trị tảng dồn hết
-- vào thịt ra), nên chỉ thêm bước repack:
--   · kho_phieu_nhap_dong.so_kg_thuc — kg sau repack. so_kg GIỮ NGHĨA kg nhà
--     cung cấp: thanh_tien, công nợ, đơn đặt, kho_v_phieu_nhap không đổi.
--   · Duyệt: lô và sổ kho theo kg sau repack; giá trị lô vẫn là tiền hàng
--     (+ chi phí, thuế) → giá vốn/kg tự chia lại.
--   · Món theo tảng: phải có kg sau repack mới gửi / duyệt được (phiếu mua).
--   · kho_bao_cao_ncc: thêm hao repack theo nhà cung cấp.
--
-- Truy vết tảng (GĐ5 kế hoạch theo tảng):
--   · kho_lo.tang_goc_id — lô phần cắt nhớ tảng gốc (trigger lúc tạo lô, lô
--     vẫn bất biến). kho_v_lo_tang: lô → số tảng (tem, quầy).
--   · kho_truy_vet_tang(lo) — một tảng từ nhận tới bán hết.
--   · kho_bao_cao_tang(cn, từ, đến) — mỗi tảng một dòng.
--   · kho_huy_ca_tang — báo huỷ mọi thứ còn lại của tảng, mỗi vị trí một
--     phiếu XH, vẫn chờ duyệt như cũ.
--
-- THAY THÂN (cùng chữ ký):
--   kho_ghi_dong_phieu_nhap  — chép 0046, thêm khóa so_kg_thuc.
--   kho_gui_duyet_phieu_nhap — chép 0031, chặn tảng thiếu kg sau repack.
--   kho_duyet_phieu_nhap     — chép 0046, như trên + lô theo kg sau repack.
--   kho_doc_phieu_nhap_kg    — chép 0046, dòng thêm so_kg_thuc.
--   kho_kg_tb_goi            — kg TB mỗi gói theo kg sau repack.
-- ĐỔI KIỂU TRẢ VỀ (drop + create): kho_bao_cao_ncc — chép 0039, thêm 3 cột.
-- =============================================================================


-- =============================================================================
-- 1 · CỘT MỚI
-- =============================================================================
alter table kho_phieu_nhap_dong add column so_kg_thuc numeric(12,3);
alter table kho_phieu_nhap_dong add constraint kho_phieu_nhap_dong_kg_thuc_hop_le
  check (so_kg_thuc is null or (so_kg_thuc > 0 and so_kg_thuc <= so_kg * 1.01));

comment on column kho_phieu_nhap_dong.so_kg_thuc is
  'Kg sau repack (0048): cân lại sau khi mở túi, bỏ nước rỉ. Kho nhập theo số này; so_kg vẫn là kg nhà cung cấp (tính tiền). Null = như so_kg. Bắt buộc với món theo dõi theo tảng khi gửi / duyệt phiếu mua.';

alter table kho_lo add column tang_goc_id uuid references kho_lo(id) on delete restrict;
create index kho_lo_tang_goc_idx on kho_lo(tang_goc_id) where tang_goc_id is not null;

comment on column kho_lo.tang_goc_id is
  'Tảng gốc của lô phần cắt (0048): lô sinh ra từ phiên lóc có tảng (lô mang so_tang) vào. Điền lúc tạo lô.';

-- Lô ra của phiên lóc nhớ tảng gốc. Lô bất biến — chỉ gán lúc INSERT.
create or replace function kho_lo_gan_tang_goc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phien_pha_id is not null and new.tang_goc_id is null then
    select coalesce(l.tang_goc_id, l.id) into new.tang_goc_id
    from kho_phien_pha_vao v
    join kho_lo l on l.id = v.lo_id
    where v.phien_pha_id = new.phien_pha_id
      and (l.so_tang is not null or l.tang_goc_id is not null)
    order by v.thu_tu, v.id
    limit 1;
  end if;
  return new;
end;
$$;

create trigger kho_lo_gan_tang_goc
  before insert on kho_lo
  for each row execute function kho_lo_gan_tang_goc();

-- Lô đã có trước file này (0046/0047 chạy trước): gán một lần. Tắt tạm trigger
-- chặn sửa — chỉ điền cột mới, không đụng số liệu.
alter table kho_lo disable trigger kho_lo_chan_sua;
do $$
declare
  v_n int;
begin
  loop
    update kho_lo x set tang_goc_id = (
      select coalesce(l.tang_goc_id, l.id)
      from kho_phien_pha_vao v join kho_lo l on l.id = v.lo_id
      where v.phien_pha_id = x.phien_pha_id and (l.so_tang is not null or l.tang_goc_id is not null)
      order by v.thu_tu, v.id limit 1)
    where x.phien_pha_id is not null and x.tang_goc_id is null
      and exists (select 1 from kho_phien_pha_vao v join kho_lo l on l.id = v.lo_id
                  where v.phien_pha_id = x.phien_pha_id and (l.so_tang is not null or l.tang_goc_id is not null));
    get diagnostics v_n = row_count;
    exit when v_n = 0;
  end loop;
end
$$;
alter table kho_lo enable trigger kho_lo_chan_sua;

-- Lô → số tảng (tảng và mọi lô cắt ra từ nó). Không tiền.
create view kho_v_lo_tang with (security_invoker = true) as
select l.chi_nhanh_id,
       l.id                        as lo_id,
       coalesce(l.tang_goc_id, l.id) as tang_id,
       coalesce(g.so_tang, l.so_tang) as so_tang
from kho_lo l
left join kho_lo g on g.id = l.tang_goc_id
where l.so_tang is not null or l.tang_goc_id is not null;

comment on view kho_v_lo_tang is
  'Lô → tảng gốc và số tảng (0048): chính tảng và các lô phần cắt ra từ nó. Không có tiền.';


-- =============================================================================
-- 2 · GHI DÒNG PHIẾU NHẬP — thêm so_kg_thuc (chép 0046)
-- =============================================================================
create or replace function kho_ghi_dong_phieu_nhap(
  p_phieu_id     uuid,
  p_chi_nhanh_id uuid,
  p_ngay_nhap    date,
  p_dong         jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dong  jsonb;
  v_khoa  text;
  v_i     int := 0;
  v_mh    kho_mat_hang;
  v_han   date;
  v_nsx   date;
  v_kg    numeric;
  v_goi   int;
  v_gia   bigint;
  v_mo    date;
  v_thuc  numeric;
  c_khoa  constant text[] := array['mat_hang_id', 'so_goi', 'so_kg', 'don_gia_kg',
                                   'so_lo_ncc', 'ngay_san_xuat', 'han_dung', 'truong_them',
                                   'ngay_mo', 'so_kg_thuc'];
begin
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' then
    raise exception 'Danh sách dòng hàng không hợp lệ' using errcode = 'check_violation';
  end if;

  for v_dong in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if not (v_khoa = any(c_khoa)) then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa
          using errcode = 'check_violation';
      end if;
    end loop;

    if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string'
       or (v_dong ->> 'mat_hang_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Dòng %: chưa chọn mặt hàng', v_i using errcode = 'check_violation';
    end if;
    select * into v_mh from kho_mat_hang
    where id = (v_dong ->> 'mat_hang_id')::uuid;
    if not found or not v_mh.dang_dung then
      raise exception 'Dòng %: mặt hàng không có hoặc đã ngừng dùng', v_i
        using errcode = 'check_violation';
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
         or (v_dong ->> 'so_goi')::numeric < 0 then
        raise exception 'Dòng % (%): số % phải là số nguyên không âm', v_i, v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi')::int;
    end if;
    if v_mh.dem_goi and v_goi = 0 and not v_mh.theo_tang then   -- 0046: dòng tảng tự là 1 tảng
      raise exception 'Dòng % (%): chưa nhập số %', v_i, v_mh.ten, v_mh.don_vi_goi
        using errcode = 'check_violation';
    end if;

    -- MỚI (0046): món theo dõi theo tảng — mỗi dòng là MỘT tảng, có ngày mổ.
    v_mo := null;
    if coalesce(v_dong ->> 'ngay_mo', '') <> '' then
      begin
        v_mo := (v_dong ->> 'ngay_mo')::date;
      exception when others then
        raise exception 'Dòng % (%): ngày mổ không hợp lệ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end;
      if v_mo > p_ngay_nhap then
        raise exception 'Dòng % (%): ngày mổ không được sau ngày nhận hàng', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      if v_mo < p_ngay_nhap - 365 then
        raise exception 'Dòng % (%): ngày mổ quá một năm trước ngày nhận — kiểm tra lại', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
    end if;
    if v_mh.theo_tang then
      if v_goi > 1 then
        raise exception 'Dòng % (%): món theo dõi theo tảng — mỗi tảng một dòng, cân riêng', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      v_goi := 1;
      if v_mo is null then
        raise exception 'Dòng % (%): chưa nhập ngày mổ của tảng', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
    end if;

    -- MỚI (0048): kg sau repack (cân lại sau khi mở túi, bỏ nước rỉ). so_kg
    -- vẫn là kg nhà cung cấp — cơ sở tính tiền; kho nhập theo kg sau repack.
    v_thuc := null;
    if v_dong ? 'so_kg_thuc' and v_dong -> 'so_kg_thuc' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_kg_thuc') <> 'number' then
        raise exception 'Dòng % (%): kg sau repack không hợp lệ', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      v_thuc := (v_dong ->> 'so_kg_thuc')::numeric;
      if v_thuc <= 0 or v_thuc <> round(v_thuc, 3) then
        raise exception 'Dòng % (%): kg sau repack phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      if v_thuc > v_kg * 1.01 then
        raise exception 'Dòng % (%): kg sau repack lớn hơn kg nhà cung cấp — kiểm tra lại cân', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
    end if;

    v_gia := 0;
    if v_dong ? 'don_gia_kg' and v_dong -> 'don_gia_kg' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'don_gia_kg') <> 'number'
         or (v_dong ->> 'don_gia_kg')::numeric <> trunc((v_dong ->> 'don_gia_kg')::numeric)
         or (v_dong ->> 'don_gia_kg')::numeric < 0 then
        raise exception 'Dòng % (%): đơn giá phải là số đồng không âm', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      v_gia := (v_dong ->> 'don_gia_kg')::bigint;
    end if;

    v_nsx := null;
    if coalesce(v_dong ->> 'ngay_san_xuat', '') <> '' then
      begin
        v_nsx := (v_dong ->> 'ngay_san_xuat')::date;
      exception when others then
        raise exception 'Dòng % (%): ngày sản xuất không hợp lệ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end;
    end if;

    if coalesce(v_dong ->> 'han_dung', '') <> '' then
      begin
        v_han := (v_dong ->> 'han_dung')::date;
      exception when others then
        raise exception 'Dòng % (%): hạn dùng không hợp lệ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end;
    elsif v_mh.han_dung_ngay is not null then
      v_han := p_ngay_nhap + v_mh.han_dung_ngay;
    else
      raise exception 'Dòng % (%): chưa có hạn dùng, và mặt hàng chưa cài hạn mặc định', v_i, v_mh.ten
        using errcode = 'check_violation';
    end if;

    insert into kho_phieu_nhap_dong
      (phieu_nhap_id, chi_nhanh_id, thu_tu, mat_hang_id, so_goi, so_kg, don_gia_kg,
       so_lo_ncc, ngay_san_xuat, han_dung, truong_them, ngay_mo, so_kg_thuc)
    values
      (p_phieu_id, p_chi_nhanh_id, v_i, v_mh.id, v_goi, v_kg, v_gia,
       nullif(btrim(v_dong ->> 'so_lo_ncc'), ''), v_nsx, v_han,
       coalesce(v_dong -> 'truong_them', '{}'::jsonb), v_mo, v_thuc);
  end loop;

  return v_i;
end;
$$;

-- =============================================================================
-- 3 · GỬI DUYỆT — tảng phải có kg sau repack (chép 0031)
-- =============================================================================
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
  v_tt   int;
  v_ten  text;
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

  -- MỚI (0048): tảng phải có kg sau repack trước khi gửi — kho nhập theo số
  -- này. Chưa repack xong thì để phiếu nháp.
  if v_pn.loai = 'mua' then
    select d.thu_tu, m.ten into v_tt, v_ten
    from kho_phieu_nhap_dong d join kho_mat_hang m on m.id = d.mat_hang_id
    where d.phieu_nhap_id = p_id and m.theo_tang and d.so_kg_thuc is null
    order by d.thu_tu limit 1;
    if found then
      raise exception 'Dòng % (%): tảng chưa có kg sau repack — repack, cân rồi gửi', v_tt, v_ten
        using errcode = 'check_violation';
    end if;
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

-- =============================================================================
-- 4 · DUYỆT — lô theo kg sau repack (chép 0046)
-- =============================================================================
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
  v_mh     kho_mat_hang;
  v_so_tang int;
  v_u_xong date;
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

  -- MỚI (0046): món theo dõi theo tảng phải mỗi dòng một tảng, có ngày mổ —
  -- phiếu tạo từ đơn đặt hàng chưa được thủ kho cân từng tảng thì chưa duyệt.
  if v_pn.loai = 'mua' then
    select d.thu_tu, m.ten into v_thieu_tt, v_thieu_ten
    from kho_phieu_nhap_dong d
    join kho_mat_hang m on m.id = d.mat_hang_id
    where d.phieu_nhap_id = p_id and m.theo_tang and (d.so_goi <> 1 or d.ngay_mo is null)
    order by d.thu_tu
    limit 1;
    if found then
      raise exception 'Dòng % (%): món theo dõi theo tảng — mỗi tảng một dòng, có ngày mổ. Sửa phiếu nhận hàng rồi duyệt', v_thieu_tt, v_thieu_ten
        using errcode = 'check_violation';
    end if;
  end if;

  -- MỚI (0048): tảng phải có kg sau repack.
  if v_pn.loai = 'mua' then
    select d.thu_tu, m.ten into v_thieu_tt, v_thieu_ten
    from kho_phieu_nhap_dong d
    join kho_mat_hang m on m.id = d.mat_hang_id
    where d.phieu_nhap_id = p_id and m.theo_tang and d.so_kg_thuc is null
    order by d.thu_tu
    limit 1;
    if found then
      raise exception 'Dòng % (%): tảng chưa có kg sau repack — repack, cân rồi gửi', v_thieu_tt, v_thieu_ten
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

    -- MỚI (0046): tảng của món theo dõi theo tảng có số tảng tăng dần của chi
    -- nhánh, và ngày ủ xong tra theo bảng ủ của món.
    select * into v_mh from kho_mat_hang where id = v_dong.mat_hang_id;
    v_so_tang := case when v_mh.theo_tang and v_dong.so_goi <= 1
                      then kho_sinh_so_tang(v_pn.chi_nhanh_id) end;
    v_u_xong := case when v_dong.ngay_mo is not null
                     then v_pn.ngay_nhap + kho_so_ngay_u(v_dong.mat_hang_id, v_pn.ngay_nhap - v_dong.ngay_mo) end;

    insert into kho_lo
      (chi_nhanh_id, ma_lo, mat_hang_id, nguon, phieu_nhap_dong_id,
       ngay_dong_goi, ngay_san_xuat, han_dung, so_lo_ncc, truong_them,
       ngay_mo, ngay_u_xong, so_tang)
    values
      (v_pn.chi_nhanh_id, kho_sinh_so(v_pn.chi_nhanh_id, 'L'), v_dong.mat_hang_id,
       case when v_pn.loai = 'ton_dau' then 'ton_dau' else 'nhap' end, v_dong.id,
       v_pn.ngay_nhap, v_dong.ngay_san_xuat, v_dong.han_dung, v_dong.so_lo_ncc,
       v_dong.truong_them, v_dong.ngay_mo, v_u_xong, v_so_tang)
    returning id into v_lo;

    insert into kho_lo_gia (lo_id, chi_nhanh_id, gia_tri, so_kg_goc)
    values (v_lo, v_pn.chi_nhanh_id,
            v_dong.thanh_tien + v_cp[v_i] + v_vat[v_i], coalesce(v_dong.so_kg_thuc, v_dong.so_kg));

    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
    values
      (v_pn.chi_nhanh_id, v_lo, v_pn.vi_tri_id, v_dong.mat_hang_id, 'nhap',
       coalesce(v_dong.so_kg_thuc, v_dong.so_kg), v_dong.so_goi, 'phieu_nhap', v_pn.id, v_nv.id, v_pn.ngay_nhap);

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
  'Duyệt phiếu nhập (quyền duyet_nhap — chủ, quản lý, kế toán): mỗi dòng thành một lô, có giá vốn nhập kho (cộng chi phí và thuế theo cài đặt, chia không lệch một đồng), và một dòng sổ kho. Phiếu mua phải có đơn giá ở mọi dòng (0031). Món theo dõi theo tảng: mỗi dòng một tảng có ngày mổ và kg sau repack; lô mang số tảng và ngày ủ xong (0046). Lô và sổ kho theo kg sau repack, giá trị lô vẫn là tiền hàng → giá vốn/kg chia lại (0048). Chỉ lúc này tồn mới cộng.';

-- =============================================================================
-- 5 · ĐỌC PHIẾU NHẬN HÀNG — dòng thêm so_kg_thuc (chép 0046)
-- =============================================================================
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
               'lo_id',         d.lo_id,
               -- 0046: món theo dõi theo tảng — mỗi dòng một tảng.
               'theo_tang',     m.theo_tang,
               'ngay_mo',       d.ngay_mo,
               'so_tang',       (select l.so_tang from kho_lo l where l.id = d.lo_id),
               -- 0048: kg sau repack (null = như kg nhà cung cấp).
               'so_kg_thuc',    d.so_kg_thuc)
             order by d.thu_tu, d.id)
      from kho_phieu_nhap_dong d
      join kho_mat_hang m on m.id = d.mat_hang_id
      where d.phieu_nhap_id = p_id), '[]'::jsonb),
    -- 0039: đơn đặt hàng của phiếu. so_kg_da_nhan gồm cả phiếu này nếu phiếu
    -- đang chờ duyệt / đã duyệt; web tự trừ khi cần "còn lại trước phiếu này".
    'don_dat', (
      select jsonb_build_object(
               'id',                dd.id,
               'so_phieu',          dd.so_phieu,
               'trang_thai',        dd.trang_thai,
               'ngay_giao_du_kien', dd.ngay_giao_du_kien,
               'dong', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'mat_hang_id',   x.mat_hang_id,
                          'ten_mat_hang',  m.ten,
                          'so_kg_dat',     x.so_kg_dat,
                          'so_goi_dat',    x.so_goi_dat,
                          'so_kg_da_nhan', x.so_kg_da_nhan)
                        order by x.thu_tu)
                 from kho_don_dat_dong x
                 join kho_mat_hang m on m.id = x.mat_hang_id
                 where x.don_dat_id = dd.id), '[]'::jsonb))
      from kho_don_dat dd where dd.id = v_pn.don_dat_id));
end;
$$;

-- =============================================================================
-- 6 · KG TRUNG BÌNH MỖI GÓI — theo kg sau repack (chép 0023)
-- =============================================================================
create or replace function kho_kg_tb_goi(p_lo_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select coalesce(d.so_kg_thuc, d.so_kg) / nullif(d.so_goi, 0)
       from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
      where l.id = p_lo_id),
    (select r.so_kg / nullif(r.so_goi, 0) from kho_phien_pha_ra r where r.lo_id = p_lo_id limit 1),
    (select sum(t.so_kg) / nullif(sum(t.so_goi), 0) from kho_ton t where t.lo_id = p_lo_id and t.so_goi > 0)
  )
$$;


-- =============================================================================
-- 7 · ĐÁNH GIÁ NHÀ CUNG CẤP — thêm hao repack (chép 0039)
-- =============================================================================
drop function kho_bao_cao_ncc(uuid, date, date);

create or replace function kho_bao_cao_ncc(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  nha_cung_cap_id uuid, ten text,
  so_phieu int, tong_kg numeric, gia_tb_kg bigint,
  thu_hoi_tb_pt numeric, so_phien_pha int, kg_tra numeric,
  so_lan_lech_hoa_don int, so_ngay_tra_tb numeric,
  so_don int, so_don_thieu int, kg_thieu numeric, so_don_tre int,
  diem_sao numeric,
  kg_repack_ncc numeric, kg_repack_thuc numeric, hao_repack_pt numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gia     boolean;
  v_hom_nay date := hom_nay_vn();
begin
  if not (kho_duoc(p_chi_nhanh_id, 'nhap') or kho_duoc(p_chi_nhanh_id, 'xem_gia')) then
    raise exception 'Tài khoản của bạn không xem được đánh giá nhà cung cấp ở chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 366 then
    raise exception 'Khoảng ngày tối đa 1 năm' using errcode = 'check_violation';
  end if;
  v_gia := kho_duoc(p_chi_nhanh_id, 'xem_gia');

  return query
  with pn as (
    select p.id, p.nha_cung_cap_id as ncc, p.tien_thue, p.chi_phi_khac, p.da_doi_chieu, p.tien_hoa_don,
           p.ngay_nhap, p.ngay_hoa_don,
           (select coalesce(sum(d.so_kg), 0) from kho_phieu_nhap_dong d where d.phieu_nhap_id = p.id) as kg,
           (select coalesce(sum(d.thanh_tien), 0) from kho_phieu_nhap_dong d where d.phieu_nhap_id = p.id) as tien_hang
    from kho_phieu_nhap p
    where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
      and p.nha_cung_cap_id is not null and p.ngay_nhap between p_tu and p_den
  ),
  pn_ncc as (
    select pn.ncc, count(*)::int as so_phieu, sum(pn.kg) as kg, sum(pn.tien_hang) as tien_hang,
           count(*) filter (where pn.da_doi_chieu
                              and pn.tien_hoa_don <> pn.tien_hang + pn.tien_thue + pn.chi_phi_khac)::int as lech
    from pn group by pn.ncc
  ),
  -- 0048: hao hụt repack — chỉ các dòng đã ghi kg sau repack.
  repack as (
    select pn.ncc, sum(d.so_kg) as kg_ncc, sum(d.so_kg_thuc) as kg_thuc
    from pn join kho_phieu_nhap_dong d on d.phieu_nhap_id = pn.id
    where d.so_kg_thuc is not null
    group by pn.ncc
  ),
  tra_tien as (
    select pn.ncc,
           sum(pb.so_tien * (t.ngay - coalesce(pn.ngay_hoa_don, pn.ngay_nhap)))::numeric
             / nullif(sum(pb.so_tien), 0) as ngay_tb
    from pn
    join kho_thanh_toan_phan_bo pb on pb.phieu_nhap_id = pn.id
    join kho_thanh_toan t on t.id = pb.thanh_toan_id
    where t.loai = 'thanh_toan' and t.trang_thai = 'hieu_luc'
    group by pn.ncc
  ),
  pha as (
    select p.nha_cung_cap_id as ncc,
           sum(v.so_kg * f.ty_le_thu_hoi) / nullif(sum(v.so_kg), 0) as thu_hoi,
           count(distinct f.id)::int as so_phien
    from kho_phien_pha f
    join kho_phien_pha_vao v on v.phien_pha_id = f.id
    join kho_lo l on l.id = v.lo_id
    join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    join kho_phieu_nhap p on p.id = d.phieu_nhap_id
    where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'da_chot' and f.ty_le_thu_hoi is not null
      and f.ngay_pha between p_tu and p_den and p.nha_cung_cap_id is not null
    group by p.nha_cung_cap_id
  ),
  tra_hang as (
    select p.nha_cung_cap_id as ncc, sum(xd.so_kg) as kg
    from kho_phieu_xuat x
    join kho_phieu_xuat_dong xd on xd.phieu_xuat_id = x.id
    join kho_phieu_nhap p on p.id = x.phieu_nhap_id
    where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'tra_ncc' and x.trang_thai not in ('tu_choi', 'da_huy')
      and x.ngay between p_tu and p_den
    group by p.nha_cung_cap_id
  ),
  don as (
    select d.id, d.nha_cung_cap_id as ncc, d.trang_thai, d.ngay_giao_du_kien,
           (select min(p.ngay_nhap) from kho_phieu_nhap p
             where p.don_dat_id = d.id and p.trang_thai in ('cho_duyet', 'da_duyet')) as ngay_nhan_dau,
           (select coalesce(sum(greatest(dd.so_kg_dat - dd.so_kg_da_nhan, 0)), 0)
              from kho_don_dat_dong dd where dd.don_dat_id = d.id) as kg_con,
           exists (
             select 1 from kho_don_dat_dong dd
             where dd.don_dat_id = d.id
               and not kho_don_dat_dong_du(dd.so_kg_dat, dd.so_kg_da_nhan, dd.so_goi_dat,
                     (select sum(pd.so_goi)::int from kho_phieu_nhap p
                        join kho_phieu_nhap_dong pd on pd.phieu_nhap_id = p.id
                       where p.don_dat_id = d.id and p.trang_thai in ('cho_duyet', 'da_duyet')
                         and pd.mat_hang_id = dd.mat_hang_id))) as con_thieu
    from kho_don_dat d
    where d.chi_nhanh_id = p_chi_nhanh_id and d.trang_thai <> 'nhap' and d.gui_luc is not null
      and d.ngay_giao_du_kien between p_tu and p_den
  ),
  don_ncc as (
    select don.ncc, count(*)::int as so_don,
           count(*) filter (where don.ngay_nhan_dau is not null and don.con_thieu
                              and (don.trang_thai = 'huy' or don.ngay_giao_du_kien < v_hom_nay))::int as thieu,
           coalesce(sum(don.kg_con) filter (where don.ngay_nhan_dau is not null and don.con_thieu
                              and (don.trang_thai = 'huy' or don.ngay_giao_du_kien < v_hom_nay)), 0) as kg_thieu,
           count(*) filter (where don.ngay_nhan_dau > don.ngay_giao_du_kien
                              or (don.ngay_nhan_dau is null and don.trang_thai <> 'huy'
                                  and don.ngay_giao_du_kien < v_hom_nay))::int as tre
    from don group by don.ncc
  ),
  ds as (
    select n.id, n.ten,
           coalesce(a.so_phieu, 0) as so_phieu, coalesce(a.kg, 0) as kg, a.tien_hang, coalesce(a.lech, 0) as lech,
           h.thu_hoi, coalesce(h.so_phien, 0) as so_phien, coalesce(r.kg, 0) as kg_tra, tt.ngay_tb,
           coalesce(o.so_don, 0) as so_don, coalesce(o.thieu, 0) as thieu, coalesce(o.kg_thieu, 0) as kg_thieu,
           coalesce(o.tre, 0) as tre,
           rp.kg_ncc as rp_ncc, rp.kg_thuc as rp_thuc
    from kho_nha_cung_cap n
    left join pn_ncc a on a.ncc = n.id
    left join pha h on h.ncc = n.id
    left join tra_hang r on r.ncc = n.id
    left join tra_tien tt on tt.ncc = n.id
    left join don_ncc o on o.ncc = n.id
    left join repack rp on rp.ncc = n.id
    where a.ncc is not null or o.ncc is not null or h.ncc is not null or r.ncc is not null
  )
  select ds.id, ds.ten, ds.so_phieu, round(ds.kg, 3),
         case when v_gia and ds.kg > 0 then round(ds.tien_hang / ds.kg)::bigint end,
         round(ds.thu_hoi, 1), ds.so_phien, round(ds.kg_tra, 3),
         case when v_gia then ds.lech end,
         case when v_gia then round(ds.ngay_tb, 1) end,
         ds.so_don, ds.thieu, round(ds.kg_thieu, 3), ds.tre,
         case when ds.so_phieu = 0 and ds.so_don = 0 then null
              else round(greatest(1, least(5, round((5
                     - case when ds.so_don > 0 then 2.0 * ds.thieu / ds.so_don + 1.0 * ds.tre / ds.so_don else 0 end
                     - case when ds.so_phieu > 0 then 1.0 * ds.lech / ds.so_phieu
                                                    + least(1, 10 * ds.kg_tra / nullif(ds.kg, 0)) else 0 end
                   ) * 2) / 2)), 1)
         end,
         round(ds.rp_ncc, 3), round(ds.rp_thuc, 3),
         case when ds.rp_ncc > 0 then round((ds.rp_ncc - ds.rp_thuc) * 100 / ds.rp_ncc, 2) end
  from ds
  order by ds.kg desc, ds.ten;
end;
$$;

comment on function kho_bao_cao_ncc is
  'Đánh giá nhà cung cấp (nhap hoặc xem_gia; 0039): theo phiếu mua đã duyệt trong kỳ và đơn đặt có ngày giao trong kỳ — số phiếu, kg, giá TB/kg, thu hồi pha lóc TB, kg trả, số lần lệch hóa đơn, số ngày trả tiền TB, đơn giao thiếu / trễ, điểm sao 1–5 (công thức ở migration). 0048: kg nhà cung cấp / kg sau repack / % hao repack của các dòng có ghi kg sau repack. gia_tb_kg, so_lan_lech_hoa_don, so_ngay_tra_tb chỉ vai xem_gia, không thì null.';


-- =============================================================================
-- 8 · BÁO CÁO THEO TẢNG — mỗi tảng nhận trong kỳ một dòng
-- =============================================================================
-- Quyền xem. Cột tiền (don_gia_ncc, gia_von_*) chỉ vai xem_gia, không thì null.
--   kg_ncc → kg_repack (hao_repack_pt) → kg_vao_loc → kg_thit / kg_phu_pham /
--   kg_bo / kg_hao_hut (thu_hoi_pt = thịt ÷ vào lóc) → kg_ban / kg_bep /
--   kg_huy / kg_con (tảng + mọi lô cắt ra). ngay_het: ngày sổ kho cuối khi
--   đã hết sạch; so_ngay_ban = ngay_het − ngay_loc.
create or replace function kho_bao_cao_tang(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  lo_id uuid, so_tang int, ma_lo text, mat_hang_id uuid, ten_hang text, ten_ncc text,
  phieu_nhap_id uuid, so_phieu_nhap text,
  ngay_mo date, ngay_nhan date, ngay_u_xong date, han_dung date, ngay_loc date, ngay_het date,
  kg_ncc numeric, kg_repack numeric, hao_repack_pt numeric,
  kg_vao_loc numeric, kg_thit numeric, kg_phu_pham numeric, kg_bo numeric, kg_hao_hut numeric, thu_hoi_pt numeric,
  kg_ban numeric, kg_bep numeric, kg_huy numeric, kg_con numeric, ban_pt numeric, so_ngay_ban int,
  tinh_trang text,
  don_gia_ncc bigint, gia_von_repack_kg bigint, gia_von_thit_kg bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gia boolean;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 366 then
    raise exception 'Khoảng ngày tối đa 1 năm' using errcode = 'check_violation';
  end if;
  v_gia := kho_duoc(p_chi_nhanh_id, 'xem_gia');

  return query
  with t as (
    select l.id, l.so_tang, l.ma_lo, l.mat_hang_id, m.ten as ten_hang, l.ngay_mo, l.ngay_dong_goi as ngay_nhan,
           l.ngay_u_xong, l.han_dung, d.so_kg as kg_ncc, coalesce(d.so_kg_thuc, d.so_kg) as kg_repack,
           d.so_kg_thuc, d.don_gia_kg, p.id as pn_id, p.so_phieu as pn_so, n.ten as ten_ncc,
           lg.gia_von_kg
    from kho_lo l
    join kho_mat_hang m on m.id = l.mat_hang_id
    left join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    left join kho_phieu_nhap p on p.id = d.phieu_nhap_id
    left join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
    left join kho_lo_gia lg on lg.lo_id = l.id
    where l.chi_nhanh_id = p_chi_nhanh_id and l.so_tang is not null
      and l.ngay_dong_goi between p_tu and p_den
  ),
  cay as (   -- tảng + mọi lô cắt ra
    select t.id as tang_id, t.id as lo_id from t
    union all
    select x.tang_goc_id, x.id from kho_lo x join t on t.id = x.tang_goc_id
  ),
  pha as (
    select v.lo_id as tang_id, min(f.ngay_pha) as ngay_loc, sum(v.so_kg) as kg_vao,
           sum(f.tong_kg_thit) as kg_thit, sum(f.tong_kg_phu_pham) as kg_pp,
           sum(f.tong_kg_bo) as kg_bo, sum(f.tong_kg_hao_hut) as kg_hh
    from kho_phien_pha_vao v
    join kho_phien_pha f on f.id = v.phien_pha_id and f.trang_thai = 'da_chot'
    where v.lo_id in (select t.id from t)
    group by v.lo_id
  ),
  so as (
    select cay.tang_id,
           -coalesce(sum(s.so_kg) filter (where s.loai = 'ban'), 0)       as kg_ban,
           -coalesce(sum(s.so_kg) filter (where s.loai = 'xuat_bep'), 0)  as kg_bep,
           -coalesce(sum(s.so_kg) filter (where s.loai = 'huy'), 0)       as kg_huy,
           max(s.ngay) as ngay_cuoi
    from cay join kho_so_cai s on s.lo_id = cay.lo_id
    group by cay.tang_id
  ),
  ton as (
    select cay.tang_id, coalesce(sum(x.so_kg), 0) as kg_con, coalesce(sum(x.so_goi), 0) as goi_con
    from cay join kho_ton x on x.lo_id = cay.lo_id
    group by cay.tang_id
  ),
  thit as (
    select cay.tang_id, sum(lg.gia_tri)::numeric / nullif(sum(lg.so_kg_goc), 0) as gia_kg
    from cay
    join kho_lo x on x.id = cay.lo_id and x.id <> cay.tang_id
    join kho_mat_hang m on m.id = x.mat_hang_id and m.loai <> 'phu_pham'
    join kho_lo_gia lg on lg.lo_id = x.id
    group by cay.tang_id
  )
  select t.id, t.so_tang, t.ma_lo, t.mat_hang_id, t.ten_hang, t.ten_ncc,
         case when v_gia then t.pn_id end, t.pn_so,
         t.ngay_mo, t.ngay_nhan, t.ngay_u_xong, t.han_dung, h.ngay_loc,
         case when coalesce(o.kg_con, 0) = 0 and coalesce(o.goi_con, 0) = 0 then s.ngay_cuoi end,
         round(t.kg_ncc, 3), round(t.kg_repack, 3),
         case when t.so_kg_thuc is not null and t.kg_ncc > 0
              then round((t.kg_ncc - t.so_kg_thuc) * 100 / t.kg_ncc, 2) end,
         round(h.kg_vao, 3), round(h.kg_thit, 3), round(h.kg_pp, 3), round(h.kg_bo, 3), round(h.kg_hh, 3),
         case when h.kg_vao > 0 then round(h.kg_thit * 100 / h.kg_vao, 2) end,
         round(coalesce(s.kg_ban, 0), 3), round(coalesce(s.kg_bep, 0), 3), round(coalesce(s.kg_huy, 0), 3),
         round(coalesce(o.kg_con, 0), 3),
         case when h.kg_thit > 0 then round(coalesce(s.kg_ban, 0) * 100 / h.kg_thit, 1) end,
         case when h.ngay_loc is not null and coalesce(o.kg_con, 0) = 0 and coalesce(o.goi_con, 0) = 0
              then s.ngay_cuoi - h.ngay_loc end,
         case when coalesce(o.kg_con, 0) = 0 and coalesce(o.goi_con, 0) = 0 then 'het'
              when h.ngay_loc is null then 'chua_loc'
              else 'dang_ban' end,
         case when v_gia then t.don_gia_kg end,
         case when v_gia then round(t.gia_von_kg)::bigint end,
         case when v_gia then round(th.gia_kg)::bigint end
  from t
  left join pha h on h.tang_id = t.id
  left join so s on s.tang_id = t.id
  left join ton o on o.tang_id = t.id
  left join thit th on th.tang_id = t.id
  order by t.ngay_nhan desc, t.so_tang desc;
end;
$$;

comment on function kho_bao_cao_tang is
  'Báo cáo theo tảng (quyền xem; 0048): mỗi tảng nhận trong kỳ — kg nhà cung cấp → sau repack → vào lóc → thịt / phụ phẩm / bỏ / hao hụt, đã bán / bếp / huỷ / còn, số ngày từ lóc tới bán hết, tình trạng chua_loc / dang_ban / het. Cột tiền (don_gia_ncc, gia_von_repack_kg, gia_von_thit_kg) và phieu_nhap_id chỉ vai xem_gia, không thì null.';


-- =============================================================================
-- 9 · HUỶ CẢ TẢNG
-- =============================================================================
-- Một lần bấm "Huỷ cả tảng" = một dòng kho_huy_tang (giữ cho gửi lại không tạo
-- thêm phiếu) + mỗi vị trí đang có hàng của tảng một phiếu XH (chờ duyệt như
-- mọi phiếu huỷ). Hàng đang "Chờ huỷ" bỏ qua (đã có phiếu); hàng đang mang ra
-- quầy chưa nhận thì báo lại số kg để quầy nhận rồi huỷ.
create table kho_huy_tang (
  id           uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  ma_gui       uuid not null,
  tang_id      uuid not null references kho_lo(id) on delete restrict,
  ly_do_id     uuid references kho_ly_do(id) on delete restrict,
  ghi_chu      text,
  nguoi        uuid references nhan_su(id) on delete set null,
  created_at   timestamptz not null default now(),

  constraint kho_huy_tang_ma_gui_duy_nhat unique (ma_gui)
);

create index kho_huy_tang_tang_idx on kho_huy_tang(tang_id);

comment on table kho_huy_tang is
  'Lần báo huỷ cả tảng (0048). Các phiếu XH sinh ra trỏ về đây qua kho_phieu_xuat.huy_tang_id. Chỉ ghi qua kho_huy_ca_tang.';

alter table kho_huy_tang enable row level security;
create policy kho_huy_tang_doc on kho_huy_tang
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));

alter table kho_phieu_xuat add column huy_tang_id uuid references kho_huy_tang(id) on delete restrict;
comment on column kho_phieu_xuat.huy_tang_id is 'Phiếu huỷ sinh ra từ "Huỷ cả tảng" (0048).';

create or replace function kho_huy_ca_tang(
  p_lo_id    uuid,
  p_ma_gui   uuid,
  p_ly_do_id uuid,
  p_ghi_chu  text,
  p_anh      text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tang  kho_lo;
  v_ht    kho_huy_tang;
  v_vt    record;
  v_dong  jsonb;
  v_px    record;
  v_chu   text;
  v_dc    numeric;
begin
  if p_ma_gui is null then
    raise exception 'Thiếu mã gửi — tải lại trang rồi làm lại' using errcode = 'check_violation';
  end if;

  select * into v_ht from kho_huy_tang where ma_gui = p_ma_gui;
  if found then
    if not kho_duoc(v_ht.chi_nhanh_id, 'van_hanh') then
      raise exception 'Không tìm thấy tảng, hoặc tài khoản không được báo hủy hàng'
        using errcode = 'insufficient_privilege';
    end if;
    return jsonb_build_object(
      'da_co', true,
      'so_tang', (select l.so_tang from kho_lo l where l.id = v_ht.tang_id),
      'kg_dang_chuyen', 0,
      'phieu', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'so_phieu', x.so_phieu) order by x.so_phieu)
                         from kho_phieu_xuat x where x.huy_tang_id = v_ht.id), '[]'::jsonb));
  end if;

  select t.* into v_tang
  from kho_lo l join kho_lo t on t.id = coalesce(l.tang_goc_id, l.id)
  where l.id = p_lo_id;
  if not found or v_tang.so_tang is null or not kho_duoc(v_tang.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy tảng, hoặc tài khoản không được báo hủy hàng'
      using errcode = 'insufficient_privilege';
  end if;

  insert into kho_huy_tang (chi_nhanh_id, ma_gui, tang_id, ly_do_id, ghi_chu, nguoi)
  values (v_tang.chi_nhanh_id, p_ma_gui, v_tang.id, p_ly_do_id, nullif(btrim(p_ghi_chu), ''), (nhan_su_hien_tai()).id)
  returning * into v_ht;

  v_chu := 'Huỷ cả tảng #' || lpad(v_tang.so_tang::text, 4, '0')
           || coalesce(': ' || nullif(btrim(p_ghi_chu), ''), '');

  for v_vt in
    select x.vi_tri_id
    from kho_ton x
    join kho_vi_tri v on v.id = x.vi_tri_id
    join kho_lo l on l.id = x.lo_id
    where (l.id = v_tang.id or l.tang_goc_id = v_tang.id)
      and (x.so_kg > 0 or x.so_goi > 0)
      and v.loai not in ('cho_huy', 'dang_chuyen')
    group by x.vi_tri_id, v.ten
    order by v.ten
  loop
    select jsonb_agg(
             jsonb_build_object('mat_hang_id', x.mat_hang_id, 'lo_id', x.lo_id)
             || case when m.dem_goi then jsonb_build_object('so_goi', x.so_goi)
                     else jsonb_build_object('so_kg', x.so_kg) end
             order by m.ten, x.lo_id)
      into v_dong
    from kho_ton x
    join kho_lo l on l.id = x.lo_id
    join kho_mat_hang m on m.id = x.mat_hang_id
    where x.vi_tri_id = v_vt.vi_tri_id
      and (l.id = v_tang.id or l.tang_goc_id = v_tang.id)
      and case when m.dem_goi then x.so_goi > 0 else x.so_kg > 0 end;
    continue when v_dong is null;

    select * into v_px
    from kho_ghi_phieu_xuat(v_tang.chi_nhanh_id, gen_random_uuid(), 'huy', v_vt.vi_tri_id, null,
                            p_ly_do_id, v_chu, p_anh, v_dong, null);
    update kho_phieu_xuat set huy_tang_id = v_ht.id where id = v_px.phieu_id;
  end loop;

  if not exists (select 1 from kho_phieu_xuat where huy_tang_id = v_ht.id) then
    raise exception 'Tảng #% không còn hàng ở kho hay quầy để hủy', lpad(v_tang.so_tang::text, 4, '0')
      using errcode = 'check_violation';
  end if;

  select coalesce(sum(x.so_kg), 0) into v_dc
  from kho_ton x
  join kho_vi_tri v on v.id = x.vi_tri_id and v.loai = 'dang_chuyen'
  join kho_lo l on l.id = x.lo_id
  where l.id = v_tang.id or l.tang_goc_id = v_tang.id;

  return jsonb_build_object(
    'da_co', false,
    'so_tang', v_tang.so_tang,
    'kg_dang_chuyen', v_dc,
    'phieu', (select jsonb_agg(jsonb_build_object('id', x.id, 'so_phieu', x.so_phieu) order by x.so_phieu)
              from kho_phieu_xuat x where x.huy_tang_id = v_ht.id));
end;
$$;

comment on function kho_huy_ca_tang is
  'Huỷ cả tảng (quyền van_hanh; 0048): p_lo_id là tảng hoặc bất kỳ lô cắt ra từ nó. Mỗi vị trí còn hàng của tảng một phiếu báo huỷ XH (lý do bắt buộc, ảnh như phiếu huỷ thường), chờ duyệt như cũ. Cùng p_ma_gui = cùng lần bấm. Trả {da_co, so_tang, kg_dang_chuyen, phieu[{id, so_phieu}]}.';


-- =============================================================================
-- 10 · TRUY VẾT MỘT TẢNG
-- =============================================================================
-- p_lo_id: tảng hoặc bất kỳ lô cắt ra từ nó. Quyền xem; tiền chỉ vai xem_gia.
create or replace function kho_truy_vet_tang(p_lo_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tang kho_lo;
  v_gia  boolean;
  v_dong jsonb;
begin
  select t.* into v_tang
  from kho_lo l join kho_lo t on t.id = coalesce(l.tang_goc_id, l.id)
  where l.id = p_lo_id;
  if not found or not kho_duoc(v_tang.chi_nhanh_id, 'xem') then
    raise exception 'Không tìm thấy tảng, hoặc tài khoản không được xem'
      using errcode = 'insufficient_privilege';
  end if;
  if v_tang.so_tang is null then
    raise exception 'Lô % không thuộc tảng nào (món không theo dõi theo tảng)', v_tang.ma_lo
      using errcode = 'check_violation';
  end if;
  v_gia := kho_duoc(v_tang.chi_nhanh_id, 'xem_gia');

  select to_jsonb(r) into v_dong
  from kho_bao_cao_tang(v_tang.chi_nhanh_id, v_tang.ngay_dong_goi, v_tang.ngay_dong_goi) r
  where r.lo_id = v_tang.id;

  return jsonb_build_object(
    'co_gia', v_gia,
    'tang', v_dong,
    'ton_tang', coalesce((
      select jsonb_agg(jsonb_build_object('vi_tri', v.ten, 'loai_vi_tri', v.loai, 'so_kg', x.so_kg, 'so_goi', x.so_goi)
                       order by v.ten)
      from kho_ton x join kho_vi_tri v on v.id = x.vi_tri_id
      where x.lo_id = v_tang.id and (x.so_kg > 0 or x.so_goi > 0)), '[]'::jsonb),
    'phien', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', f.id, 'so_phieu', f.so_phieu, 'ngay_pha', f.ngay_pha, 'trang_thai', f.trang_thai,
               'kg_vao', v.so_kg, 'kg_thit', f.tong_kg_thit, 'kg_phu_pham', f.tong_kg_phu_pham,
               'kg_bo', f.tong_kg_bo, 'kg_hao_hut', f.tong_kg_hao_hut, 'ty_le_thu_hoi', f.ty_le_thu_hoi)
             order by f.ngay_pha, f.so_phieu)
      from kho_phien_pha_vao v join kho_phien_pha f on f.id = v.phien_pha_id
      where v.lo_id = v_tang.id and f.trang_thai <> 'da_huy'), '[]'::jsonb),
    'lo_ra', coalesce((
      select jsonb_agg(jsonb_build_object(
               'lo_id', x.id, 'ma_lo', x.ma_lo, 'mat_hang_id', x.mat_hang_id, 'ten_hang', m.ten,
               'loai_hang', m.loai, 'dem_goi', m.dem_goi, 'don_vi_goi', m.don_vi_goi,
               'han_dung', x.han_dung, 'ngay_loc', x.ngay_dong_goi,
               'kg_ra', lg.so_kg_goc,
               'gia_von_kg', case when v_gia then round(lg.gia_von_kg)::bigint end,
               'o_ma', (select jsonb_build_object('so_o', o.so_o, 'ma_can', o.ma_can, 'dang_giu', g.den_luc is null)
                          from kho_o_ma_giao g join kho_o_ma o on o.id = g.o_ma_id
                         where g.lo_id = x.id order by g.tu_luc desc limit 1),
               'kg_ban', -coalesce((select sum(s.so_kg) from kho_so_cai s where s.lo_id = x.id and s.loai = 'ban'), 0),
               'kg_bep', -coalesce((select sum(s.so_kg) from kho_so_cai s where s.lo_id = x.id and s.loai = 'xuat_bep'), 0),
               'kg_huy', -coalesce((select sum(s.so_kg) from kho_so_cai s where s.lo_id = x.id and s.loai = 'huy'), 0),
               'ngay_ban_cuoi', (select max(s.ngay) from kho_so_cai s where s.lo_id = x.id and s.loai = 'ban'),
               'con', coalesce((
                 select jsonb_agg(jsonb_build_object('vi_tri', v.ten, 'loai_vi_tri', v.loai, 'so_kg', t.so_kg, 'so_goi', t.so_goi)
                                  order by v.ten)
                 from kho_ton t join kho_vi_tri v on v.id = t.vi_tri_id
                 where t.lo_id = x.id and (t.so_kg > 0 or t.so_goi > 0)), '[]'::jsonb))
             order by x.ngay_dong_goi, m.loai, m.ten, x.ma_lo)
      from kho_lo x
      join kho_mat_hang m on m.id = x.mat_hang_id
      left join kho_lo_gia lg on lg.lo_id = x.id
      where x.tang_goc_id = v_tang.id), '[]'::jsonb),
    'phieu_huy', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', x.id, 'so_phieu', x.so_phieu, 'trang_thai', x.trang_thai, 'ngay', x.created_at,
               'so_kg', (select sum(xd.so_kg) from kho_phieu_xuat_dong xd where xd.phieu_xuat_id = x.id))
             order by x.created_at, x.so_phieu)
      from kho_phieu_xuat x
      join kho_huy_tang h on h.id = x.huy_tang_id
      where h.tang_id = v_tang.id), '[]'::jsonb));
end;
$$;

comment on function kho_truy_vet_tang is
  'Truy vết một tảng (quyền xem; 0048): p_lo_id là tảng hoặc lô cắt ra từ nó. Trả {co_gia, tang (một dòng kho_bao_cao_tang), ton_tang[], phien[], lo_ra[{…, o_ma, kg_ban, kg_bep, kg_huy, con[]}], phieu_huy[]}. gia_von_kg và cột tiền của tang chỉ vai xem_gia.';


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (bọc kiểm pg_roles như 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_lo_gan_tang_goc() from authenticated';
    execute 'revoke execute on function kho_ghi_dong_phieu_nhap(uuid, uuid, date, jsonb) from authenticated';
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
