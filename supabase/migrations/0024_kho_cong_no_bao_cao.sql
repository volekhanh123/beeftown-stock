-- =============================================================================
-- BEEFTOWN — 0024 · KHO · ĐỐI CHIẾU HÓA ĐƠN, CÔNG NỢ, TRẢ HÀNG, BÁO CÁO
-- =============================================================================
-- CÔNG NỢ NHÀ CUNG CẤP — mỗi phiếu nhập MUA đã duyệt là một khoản phải trả:
--   phải trả  = tiền trên hóa đơn (khi kế toán đã đối chiếu)
--               hoặc tổng phiếu (tiền hàng + thuế + chi phí khác) khi chưa
--   còn nợ    = phải trả − đã trả − giảm trừ
--   quá hạn   = còn nợ > 0 và hạn thanh toán đã qua
-- Hóa đơn đỏ thường về SAU hàng vài ngày, nên đối chiếu là một bước riêng:
-- kế toán ghi số, ngày, tiền trên hóa đơn; lệch với phiếu thì thấy ngay.
--
-- THANH TOÁN / GIẢM TRỪ — mỗi khoản chia vào các phiếu nhập (phân bổ). Không
-- chọn phiếu thì trả phiếu đến hạn sớm nhất trước. Không trả vượt số còn nợ.
-- Ghi nhầm thì HỦY khoản đó (có lý do) rồi ghi lại — không sửa.
--
-- TRẢ HÀNG NHÀ CUNG CẤP — hàng rời kho bằng dòng sổ loại mới 'tra_ncc', và
-- tự sinh một khoản giảm trừ công nợ cho đúng phiếu nhập đó: kg trả × đơn giá
-- mua, cộng phần thuế tương ứng (hoặc số tiền kế toán ghi theo biên bản).
--
-- BÁO CÁO — hàm SECURITY INVOKER: chạy dưới quyền người gọi, RLS vẫn áp
-- dụng. Giá trị = kg × giá vốn/kg của lô; vai không xem giá nhận giá trị 0.
-- Dòng đảo ngược được tính vào loại của dòng gốc (hủy phiếu nhập trong kỳ thì
-- cột nhập giảm, không thành một cột lạ).
-- =============================================================================


-- =============================================================================
-- 1 · SỔ KHO VÀ PHIẾU XUẤT NHẬN LOẠI MỚI: TRẢ NHÀ CUNG CẤP
-- =============================================================================
alter table kho_so_cai drop constraint kho_so_cai_loai_hop_le;
alter table kho_so_cai add constraint kho_so_cai_loai_hop_le check (loai in (
  'nhap', 'pha_loc_vao', 'pha_loc_ra', 'chuyen_di', 'chuyen_den',
  'ban', 'xuat_bep', 'huy', 'kiem_ke', 'hao_hut', 'dao_nguoc', 'tra_ncc'));
alter table kho_so_cai drop constraint kho_so_cai_dau_hop_le;
alter table kho_so_cai add constraint kho_so_cai_dau_hop_le check (
  (loai in ('nhap', 'pha_loc_ra', 'chuyen_den') and so_kg >= 0 and so_goi >= 0)
  or (loai in ('pha_loc_vao', 'chuyen_di', 'ban', 'xuat_bep', 'huy', 'tra_ncc') and so_kg <= 0 and so_goi <= 0)
  or loai in ('kiem_ke', 'hao_hut', 'dao_nguoc')
);

alter table kho_phieu_xuat drop constraint kho_phieu_xuat_loai_hop_le;
alter table kho_phieu_xuat add constraint kho_phieu_xuat_loai_hop_le
  check (loai in ('chuyen', 'xuat_bep', 'huy', 'tra_ncc'));
alter table kho_phieu_xuat add column phieu_nhap_id uuid references kho_phieu_nhap(id) on delete restrict;
alter table kho_phieu_xuat add constraint kho_phieu_xuat_tra_ncc_hop_le
  check ((loai = 'tra_ncc') = (phieu_nhap_id is not null));

comment on column kho_phieu_xuat.phieu_nhap_id is 'Phiếu trả hàng: phiếu nhập của lô được trả.';


-- =============================================================================
-- 2 · ĐỐI CHIẾU HÓA ĐƠN
-- =============================================================================
alter table kho_phieu_nhap
  add column tien_hoa_don      bigint,
  add column da_doi_chieu      boolean not null default false,
  add column ghi_chu_doi_chieu text,
  add column nguoi_doi_chieu   uuid references nhan_su(id) on delete set null,
  add column doi_chieu_luc     timestamptz;
alter table kho_phieu_nhap
  add constraint kho_phieu_nhap_hoa_don_hop_le check (tien_hoa_don is null or tien_hoa_don >= 0),
  add constraint kho_phieu_nhap_doi_chieu_hop_le check (not da_doi_chieu or tien_hoa_don is not null);


-- =============================================================================
-- 3 · THANH TOÁN VÀ GIẢM TRỪ
-- =============================================================================
create table kho_thanh_toan (
  id              uuid primary key default gen_random_uuid(),
  chi_nhanh_id    uuid not null references chi_nhanh(id) on delete restrict,
  so_phieu        text not null,
  ma_gui          uuid not null,
  nha_cung_cap_id uuid not null references kho_nha_cung_cap(id) on delete restrict,
  loai            text not null,
  hinh_thuc       text,
  so_tien         bigint not null,
  ngay            date not null default hom_nay_vn(),
  ghi_chu         text,
  anh             text[] not null default '{}',
  phieu_xuat_id   uuid references kho_phieu_xuat(id) on delete restrict,
  trang_thai      text not null default 'hieu_luc',
  ly_do_huy       text,
  nguoi_tao       uuid references nhan_su(id) on delete set null,
  nguoi_huy       uuid references nhan_su(id) on delete set null,
  huy_luc         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint kho_thanh_toan_so_duy_nhat     unique (chi_nhanh_id, so_phieu),
  constraint kho_thanh_toan_ma_gui_duy_nhat unique (ma_gui),
  constraint kho_thanh_toan_loai_hop_le     check (loai in ('thanh_toan', 'giam_tru')),
  constraint kho_thanh_toan_hinh_thuc_hop_le check (
    (loai = 'thanh_toan' and hinh_thuc in ('chuyen_khoan', 'tien_mat', 'khac'))
    or (loai = 'giam_tru' and hinh_thuc is null)),
  constraint kho_thanh_toan_tien_hop_le     check (so_tien > 0),
  constraint kho_thanh_toan_trang_thai_hop_le check (trang_thai in ('hieu_luc', 'da_huy'))
);

create index kho_thanh_toan_ncc_idx on kho_thanh_toan(chi_nhanh_id, nha_cung_cap_id, ngay desc);

create trigger kho_thanh_toan_updated_at
  before update on kho_thanh_toan
  for each row execute function tu_dong_cap_nhat_updated_at();

create table kho_thanh_toan_phan_bo (
  id            uuid primary key default gen_random_uuid(),
  thanh_toan_id uuid not null references kho_thanh_toan(id) on delete cascade,
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  phieu_nhap_id uuid not null references kho_phieu_nhap(id) on delete restrict,
  so_tien       bigint not null,

  constraint kho_thanh_toan_phan_bo_tien_hop_le check (so_tien > 0),
  constraint kho_thanh_toan_phan_bo_duy_nhat unique (thanh_toan_id, phieu_nhap_id)
);

create index kho_thanh_toan_phan_bo_phieu_idx on kho_thanh_toan_phan_bo(phieu_nhap_id);

comment on table kho_thanh_toan is
  'Tiền trả nhà cung cấp (thanh_toan) và giảm trừ công nợ (giam_tru — chiết khấu, trả hàng). Không sửa: hủy rồi ghi lại.';

-- Phiếu nhập đã có tiền trả / giảm trừ thì không hủy được — tiền phải gỡ trước.
create or replace function kho_phieu_nhap_chan_huy_da_tra()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.trang_thai = 'da_duyet' and new.trang_thai = 'da_huy' and exists (
       select 1 from kho_thanh_toan_phan_bo pb
       join kho_thanh_toan t on t.id = pb.thanh_toan_id
       where pb.phieu_nhap_id = new.id and t.trang_thai = 'hieu_luc') then
    raise exception 'Phiếu % đã có thanh toán hoặc giảm trừ — kế toán hủy các khoản đó trước', new.so_phieu
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger kho_phieu_nhap_chan_huy_da_tra
  before update of trang_thai on kho_phieu_nhap
  for each row execute function kho_phieu_nhap_chan_huy_da_tra();


-- =============================================================================
-- 4 · VIEW CÔNG NỢ
-- =============================================================================
create view kho_v_cong_no_phieu with (security_invoker = true) as
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
         coalesce(d.tien_hang, 0) + p.tien_thue + p.chi_phi_khac as tong_tien_phieu,
         coalesce(p.tien_hoa_don, coalesce(d.tien_hang, 0) + p.tien_thue + p.chi_phi_khac) as phai_tra,
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
  where p.loai = 'mua' and p.trang_thai = 'da_duyet'
) x;

comment on view kho_v_cong_no_phieu is
  'Công nợ từng phiếu nhập mua đã duyệt: phải trả, đã trả, giảm trừ, còn nợ, quá hạn. Chỉ vai xem giá đọc được (RLS của kho_phieu_nhap).';

create view kho_v_cong_no_ncc with (security_invoker = true) as
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

comment on view kho_v_cong_no_ncc is 'Công nợ gom theo nhà cung cấp.';


-- =============================================================================
-- 5 · ĐỐI CHIẾU HÓA ĐƠN — RPC
-- =============================================================================
create or replace function kho_doi_chieu_hoa_don(
  p_id             uuid,
  p_so_hoa_don     text,
  p_ngay_hoa_don   date,
  p_tien_hoa_don   bigint,
  p_han_thanh_toan date,
  p_ghi_chu        text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn   kho_phieu_nhap;
  v_ncc  kho_nha_cung_cap;
  v_han  date;
  v_tong bigint;
  v_lech bigint;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'ke_toan') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được đối chiếu hóa đơn'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_pn from kho_phieu_nhap where id = p_id for update;
  if v_pn.loai <> 'mua' or v_pn.trang_thai <> 'da_duyet' then
    raise exception 'Chỉ đối chiếu được phiếu nhập mua đã duyệt' using errcode = 'check_violation';
  end if;
  if coalesce(btrim(p_so_hoa_don), '') = '' then
    raise exception 'Ghi số hóa đơn' using errcode = 'check_violation';
  end if;
  if p_tien_hoa_don is null or p_tien_hoa_don < 0 or p_tien_hoa_don >= 10000000000000 then
    raise exception 'Ghi tổng tiền trên hóa đơn (số đồng không âm)' using errcode = 'check_violation';
  end if;
  if p_ngay_hoa_don is not null and p_ngay_hoa_don > hom_nay_vn() then
    raise exception 'Ngày hóa đơn không được sau hôm nay' using errcode = 'check_violation';
  end if;

  select * into v_ncc from kho_nha_cung_cap where id = v_pn.nha_cung_cap_id;
  v_han := coalesce(p_han_thanh_toan,
                    coalesce(p_ngay_hoa_don, v_pn.ngay_hoa_don, v_pn.ngay_nhap) + coalesce(v_ncc.so_ngay_no, 0));

  update kho_phieu_nhap set
    so_hoa_don        = btrim(p_so_hoa_don),
    ngay_hoa_don      = coalesce(p_ngay_hoa_don, ngay_hoa_don),
    tien_hoa_don      = p_tien_hoa_don,
    han_thanh_toan    = v_han,
    da_doi_chieu      = true,
    ghi_chu_doi_chieu = nullif(btrim(p_ghi_chu), ''),
    nguoi_doi_chieu   = (nhan_su_hien_tai()).id,
    doi_chieu_luc     = now()
  where id = p_id;

  select tong_tien_phieu into v_tong from kho_v_cong_no_phieu where id = p_id;
  v_lech := p_tien_hoa_don - v_tong;
  return 'Đã đối chiếu ' || v_pn.so_phieu || ' với hóa đơn ' || btrim(p_so_hoa_don)
    || case when v_lech = 0 then ': khớp phiếu.'
            else ': LỆCH ' || case when v_lech > 0 then '+' else '−' end
                 || replace(to_char(abs(v_lech), 'FM999G999G999G999'), ',', '.') || ' đ so với phiếu — công nợ tính theo hóa đơn.' end;
end;
$$;


-- =============================================================================
-- 6 · GHI / HỦY THANH TOÁN, GIẢM TRỪ
-- =============================================================================
-- p_phan_bo: [{phieu_nhap_id, so_tien}] — rỗng thì trả phiếu đến hạn sớm nhất trước.
create or replace function kho_ghi_thanh_toan(
  p_chi_nhanh_id    uuid,
  p_ma_gui          uuid,
  p_nha_cung_cap_id uuid,
  p_loai            text,
  p_hinh_thuc       text,
  p_so_tien         bigint,
  p_ngay            date,
  p_ghi_chu         text,
  p_anh             text[],
  p_phan_bo         jsonb
)
returns table (thanh_toan_id uuid, so_phieu text, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_so    text;
  v_anh   text;
  v_con   bigint;
  v_lay   bigint;
  v_tong  bigint := 0;
  v_no    bigint;
  v_r     record;
  v_dong  jsonb;
  v_khoa  text;
  v_pn    uuid;
  v_tien  bigint;
  v_ds    uuid[] := '{}';
  v_tien_ds bigint[] := '{}';
  i       int;
  c_uuid  constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    raise exception 'Tài khoản của bạn không được ghi thanh toán' using errcode = 'insufficient_privilege';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;

  select t.id, t.so_phieu into v_id, v_so from kho_thanh_toan t where t.ma_gui = p_ma_gui;
  if found then
    return query select v_id, v_so, true;
    return;
  end if;

  if p_loai is null or p_loai not in ('thanh_toan', 'giam_tru') then
    raise exception 'Loại không hợp lệ' using errcode = 'check_violation';
  end if;
  if p_loai = 'thanh_toan' and (p_hinh_thuc is null or p_hinh_thuc not in ('chuyen_khoan', 'tien_mat', 'khac')) then
    raise exception 'Chọn hình thức thanh toán' using errcode = 'check_violation';
  end if;
  if p_so_tien is null or p_so_tien <= 0 or p_so_tien >= 10000000000000 then
    raise exception 'Số tiền phải lớn hơn 0' using errcode = 'check_violation';
  end if;
  if p_ngay is null or p_ngay > hom_nay_vn() then
    raise exception 'Ngày không được sau hôm nay' using errcode = 'check_violation';
  end if;
  if p_ngay < hom_nay_vn() - 366 then
    raise exception 'Ngày quá một năm trước — kiểm tra lại' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from kho_nha_cung_cap where id = p_nha_cung_cap_id) then
    raise exception 'Không tìm thấy nhà cung cấp' using errcode = 'check_violation';
  end if;
  if coalesce(array_length(p_anh, 1), 0) > 8 then
    raise exception 'Tối đa 8 ảnh' using errcode = 'check_violation';
  end if;
  foreach v_anh in array coalesce(p_anh, '{}'::text[]) loop
    if v_anh not like p_chi_nhanh_id::text || '/thanh_toan/%' or v_anh like '%..%' then
      raise exception 'Đường dẫn ảnh không thuộc chi nhánh này' using errcode = 'check_violation';
    end if;
  end loop;

  -- Phân bổ.
  if p_phan_bo is null or jsonb_typeof(p_phan_bo) <> 'array' or jsonb_array_length(p_phan_bo) = 0 then
    v_con := p_so_tien;
    for v_r in
      select c.id, c.con_no from kho_v_cong_no_phieu c
      where c.chi_nhanh_id = p_chi_nhanh_id and c.nha_cung_cap_id = p_nha_cung_cap_id and c.con_no > 0
      order by c.han_thanh_toan nulls last, c.ngay_nhap, c.so_phieu
    loop
      exit when v_con <= 0;
      v_lay := least(v_con, v_r.con_no);
      v_ds := v_ds || v_r.id;
      v_tien_ds := v_tien_ds || v_lay;
      v_con := v_con - v_lay;
    end loop;
    if v_con > 0 then
      select coalesce(sum(c.con_no) filter (where c.con_no > 0), 0) into v_no from kho_v_cong_no_phieu c
      where c.chi_nhanh_id = p_chi_nhanh_id and c.nha_cung_cap_id = p_nha_cung_cap_id;
      raise exception 'Số tiền lớn hơn công nợ còn lại của nhà cung cấp (% đ)',
        replace(to_char(v_no, 'FM999G999G999G999'), ',', '.')
        using errcode = 'check_violation';
    end if;
  else
    for v_dong in select value from jsonb_array_elements(p_phan_bo) loop
      if jsonb_typeof(v_dong) <> 'object' then
        raise exception 'Phân bổ không hợp lệ' using errcode = 'check_violation';
      end if;
      for v_khoa in select jsonb_object_keys(v_dong) loop
        if v_khoa <> all (array['phieu_nhap_id', 'so_tien']) then
          raise exception 'Phân bổ: trường "%" không được nhận', v_khoa using errcode = 'check_violation';
        end if;
      end loop;
      if jsonb_typeof(v_dong -> 'phieu_nhap_id') is distinct from 'string' or (v_dong ->> 'phieu_nhap_id') !~* c_uuid then
        raise exception 'Phân bổ: chưa chọn phiếu nhập' using errcode = 'check_violation';
      end if;
      if jsonb_typeof(v_dong -> 'so_tien') is distinct from 'number'
         or (v_dong ->> 'so_tien')::numeric <> trunc((v_dong ->> 'so_tien')::numeric)
         or (v_dong ->> 'so_tien')::numeric <= 0 then
        raise exception 'Phân bổ: số tiền mỗi phiếu phải là số đồng lớn hơn 0' using errcode = 'check_violation';
      end if;
      v_pn := (v_dong ->> 'phieu_nhap_id')::uuid;
      v_tien := (v_dong ->> 'so_tien')::bigint;
      if v_pn = any(v_ds) then
        raise exception 'Một phiếu nhập bị chọn hai lần' using errcode = 'check_violation';
      end if;
      select c.con_no into v_no from kho_v_cong_no_phieu c
      where c.id = v_pn and c.chi_nhanh_id = p_chi_nhanh_id and c.nha_cung_cap_id = p_nha_cung_cap_id;
      if not found then
        raise exception 'Phiếu nhập được chọn không phải phiếu mua đã duyệt của nhà cung cấp này' using errcode = 'check_violation';
      end if;
      if v_tien > v_no then
        raise exception 'Phiếu % chỉ còn nợ % đ', (select p.so_phieu from kho_phieu_nhap p where p.id = v_pn),
          replace(to_char(greatest(v_no, 0), 'FM999G999G999G999'), ',', '.')
          using errcode = 'check_violation';
      end if;
      v_ds := v_ds || v_pn;
      v_tien_ds := v_tien_ds || v_tien;
      v_tong := v_tong + v_tien;
    end loop;
    if v_tong <> p_so_tien then
      raise exception 'Tổng phân bổ (% đ) khác số tiền (% đ)',
        replace(to_char(v_tong, 'FM999G999G999G999'), ',', '.'),
        replace(to_char(p_so_tien, 'FM999G999G999G999'), ',', '.')
        using errcode = 'check_violation';
    end if;
  end if;

  insert into kho_thanh_toan
    (chi_nhanh_id, so_phieu, ma_gui, nha_cung_cap_id, loai, hinh_thuc, so_tien, ngay, ghi_chu, anh, nguoi_tao)
  values
    (p_chi_nhanh_id, kho_sinh_so(p_chi_nhanh_id, case when p_loai = 'thanh_toan' then 'TT' else 'GT' end),
     p_ma_gui, p_nha_cung_cap_id, p_loai, case when p_loai = 'thanh_toan' then p_hinh_thuc end,
     p_so_tien, p_ngay, nullif(btrim(p_ghi_chu), ''), coalesce(p_anh, '{}'), (nhan_su_hien_tai()).id)
  returning kho_thanh_toan.id, kho_thanh_toan.so_phieu into v_id, v_so;

  for i in 1..coalesce(array_length(v_ds, 1), 0) loop
    insert into kho_thanh_toan_phan_bo (thanh_toan_id, chi_nhanh_id, phieu_nhap_id, so_tien)
    values (v_id, p_chi_nhanh_id, v_ds[i], v_tien_ds[i]);
  end loop;

  return query select v_id, v_so, false;
end;
$$;

comment on function kho_ghi_thanh_toan is
  'Ghi một khoản trả tiền / giảm trừ cho nhà cung cấp, chia vào các phiếu nhập (tự chia theo hạn nếu không chọn). Không trả vượt số còn nợ.';

create or replace function kho_huy_thanh_toan(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tt kho_thanh_toan;
begin
  select * into v_tt from kho_thanh_toan where id = p_id;
  if not found or not kho_duoc(v_tt.chi_nhanh_id, 'ke_toan') then
    raise exception 'Không tìm thấy khoản thanh toán, hoặc tài khoản không được hủy'
      using errcode = 'insufficient_privilege';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Cần ghi lý do hủy' using errcode = 'check_violation';
  end if;
  select * into v_tt from kho_thanh_toan where id = p_id for update;
  if v_tt.trang_thai = 'da_huy' then
    return 'Khoản ' || v_tt.so_phieu || ' đã bị hủy trước đó.';
  end if;
  if v_tt.phieu_xuat_id is not null then
    raise exception 'Giảm trừ do trả hàng đi cùng phiếu trả hàng — không hủy riêng được' using errcode = 'check_violation';
  end if;
  update kho_thanh_toan set trang_thai = 'da_huy', ly_do_huy = btrim(p_ly_do),
                            nguoi_huy = (nhan_su_hien_tai()).id, huy_luc = now()
  where id = p_id;
  return 'Đã hủy ' || v_tt.so_phieu || ' — công nợ các phiếu liên quan đã trở lại như trước.';
end;
$$;


-- =============================================================================
-- 7 · TRẢ HÀNG NHÀ CUNG CẤP
-- =============================================================================
-- p_dong: [{lo_id, so_kg, so_goi}] — lô của chính phiếu nhập này, đang ở p_vi_tri_id.
-- p_so_tien_giam_tru: null = tự tính (kg × đơn giá mua + phần thuế tương ứng).
create or replace function kho_tra_nha_cung_cap(
  p_chi_nhanh_id      uuid,
  p_ma_gui            uuid,
  p_phieu_nhap_id     uuid,
  p_vi_tri_id         uuid,
  p_ghi_chu           text,
  p_anh               text[],
  p_so_tien_giam_tru  bigint,
  p_dong              jsonb
)
returns table (phieu_xuat_id uuid, so_phieu text, so_tien_giam_tru bigint, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv      nhan_su;
  v_pn      kho_phieu_nhap;
  v_vt      kho_vi_tri;
  v_id      uuid;
  v_so      text;
  v_tien    bigint;
  v_anh     text;
  v_dong    jsonb;
  v_khoa    text;
  v_i       int := 0;
  v_lo      kho_lo;
  v_mh      kho_mat_hang;
  v_dg      bigint;
  v_kg      numeric;
  v_goi     int;
  v_ton_kg  numeric;
  v_ton_goi int;
  v_gia_tri bigint := 0;
  v_tien_hang bigint;
  v_tt      uuid;
  c_uuid    constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    raise exception 'Tài khoản của bạn không được ghi trả hàng nhà cung cấp' using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;

  select px.id, px.so_phieu into v_id, v_so from kho_phieu_xuat px where px.ma_gui = p_ma_gui;
  if found then
    select t.so_tien into v_tien from kho_thanh_toan t where t.phieu_xuat_id = v_id;
    return query select v_id, v_so, coalesce(v_tien, 0::bigint), true;
    return;
  end if;

  select * into v_pn from kho_phieu_nhap where id = p_phieu_nhap_id;
  if not found or v_pn.chi_nhanh_id <> p_chi_nhanh_id or v_pn.loai <> 'mua' or v_pn.trang_thai <> 'da_duyet' then
    raise exception 'Chỉ trả hàng được cho phiếu nhập mua đã duyệt của chi nhánh này' using errcode = 'check_violation';
  end if;
  select * into v_vt from kho_vi_tri where id = p_vi_tri_id;
  if not found or v_vt.chi_nhanh_id <> p_chi_nhanh_id or v_vt.loai = 'cho_huy' then
    raise exception 'Chọn nơi đang để hàng cần trả (kho hoặc quầy)' using errcode = 'check_violation';
  end if;
  if p_so_tien_giam_tru is not null and (p_so_tien_giam_tru < 0 or p_so_tien_giam_tru >= 10000000000000) then
    raise exception 'Số tiền giảm trừ không được âm' using errcode = 'check_violation';
  end if;
  if coalesce(array_length(p_anh, 1), 0) > 8 then
    raise exception 'Tối đa 8 ảnh' using errcode = 'check_violation';
  end if;
  foreach v_anh in array coalesce(p_anh, '{}'::text[]) loop
    if v_anh not like p_chi_nhanh_id::text || '/thanh_toan/%' or v_anh like '%..%' then
      raise exception 'Đường dẫn ảnh không thuộc chi nhánh này' using errcode = 'check_violation';
    end if;
  end loop;
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' or jsonb_array_length(p_dong) = 0 then
    raise exception 'Chưa chọn hàng trả' using errcode = 'check_violation';
  end if;

  insert into kho_phieu_xuat
    (chi_nhanh_id, so_phieu, ma_gui, loai, vi_tri_id, phieu_nhap_id, ghi_chu, anh, trang_thai, nguoi_tao)
  values
    (p_chi_nhanh_id, kho_sinh_so(p_chi_nhanh_id, 'XT'), p_ma_gui, 'tra_ncc', v_vt.id, v_pn.id,
     nullif(btrim(p_ghi_chu), ''), coalesce(p_anh, '{}'), 'da_ghi', v_nv.id)
  returning kho_phieu_xuat.id, kho_phieu_xuat.so_phieu into v_id, v_so;

  for v_dong in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if v_khoa <> all (array['lo_id', 'so_kg', 'so_goi']) then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
      end if;
    end loop;
    if jsonb_typeof(v_dong -> 'lo_id') is distinct from 'string' or (v_dong ->> 'lo_id') !~* c_uuid then
      raise exception 'Dòng %: chưa chọn lô', v_i using errcode = 'check_violation';
    end if;
    select l.* into v_lo from kho_lo l
    join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where l.id = (v_dong ->> 'lo_id')::uuid and d.phieu_nhap_id = v_pn.id;
    if v_lo.id is null then
      raise exception 'Dòng %: lô không thuộc phiếu nhập %', v_i, v_pn.so_phieu using errcode = 'check_violation';
    end if;
    select * into v_mh from kho_mat_hang where id = v_lo.mat_hang_id;
    select d.don_gia_kg into v_dg from kho_phieu_nhap_dong d where d.id = v_lo.phieu_nhap_dong_id;
    select t.so_kg, t.so_goi into v_ton_kg, v_ton_goi from kho_ton t where t.lo_id = v_lo.id and t.vi_tri_id = v_vt.id;
    v_ton_kg := coalesce(v_ton_kg, 0);
    v_ton_goi := coalesce(v_ton_goi, 0);

    if jsonb_typeof(v_dong -> 'so_kg') is distinct from 'number' then
      raise exception 'Lô %: chưa nhập số kg trả', v_lo.ma_lo using errcode = 'check_violation';
    end if;
    v_kg := (v_dong ->> 'so_kg')::numeric;
    if v_kg <= 0 or v_kg <> round(v_kg, 3) then
      raise exception 'Lô %: số kg phải lớn hơn 0, tối đa 3 số lẻ', v_lo.ma_lo using errcode = 'check_violation';
    end if;
    if v_kg > v_ton_kg then
      raise exception 'Lô % ở "%" chỉ còn % kg', v_lo.ma_lo, v_vt.ten, v_ton_kg using errcode = 'check_violation';
    end if;
    v_goi := 0;
    if v_dong ? 'so_goi' and v_dong -> 'so_goi' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi') <> 'number'
         or (v_dong ->> 'so_goi')::numeric <> trunc((v_dong ->> 'so_goi')::numeric)
         or (v_dong ->> 'so_goi')::numeric < 0 then
        raise exception 'Lô %: số % phải là số nguyên không âm', v_lo.ma_lo, v_mh.don_vi_goi using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi')::int;
    end if;
    if v_goi > v_ton_goi then
      raise exception 'Lô % ở "%" chỉ còn % %', v_lo.ma_lo, v_vt.ten, v_ton_goi, v_mh.don_vi_goi using errcode = 'check_violation';
    end if;
    -- Như pha lóc: trả hết kg thì trả hết gói; trả hết gói thì trả hết kg.
    if v_kg = v_ton_kg then
      v_goi := v_ton_goi;
    elsif v_mh.dem_goi and v_goi > 0 and v_goi = v_ton_goi then
      v_kg := v_ton_kg;
    end if;

    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, nguoi_ghi)
    values
      (p_chi_nhanh_id, v_lo.id, v_vt.id, v_lo.mat_hang_id, 'tra_ncc', -v_kg, -v_goi,
       'phieu_xuat', v_id, v_nv.id);
    insert into kho_phieu_xuat_dong (phieu_xuat_id, chi_nhanh_id, thu_tu, mat_hang_id, lo_id, so_goi, so_kg)
    values (v_id, p_chi_nhanh_id, v_i, v_lo.mat_hang_id, v_lo.id, v_goi, v_kg);

    v_gia_tri := v_gia_tri + round(v_kg * coalesce(v_dg, 0))::bigint;
  end loop;

  if p_so_tien_giam_tru is not null then
    v_tien := p_so_tien_giam_tru;
  else
    select coalesce(sum(d.thanh_tien), 0) into v_tien_hang from kho_phieu_nhap_dong d where d.phieu_nhap_id = v_pn.id;
    v_tien := v_gia_tri + case when v_pn.tien_thue > 0 and v_tien_hang > 0
                               then round(v_pn.tien_thue::numeric * v_gia_tri / v_tien_hang)::bigint else 0 end;
  end if;

  if v_tien > 0 then
    insert into kho_thanh_toan
      (chi_nhanh_id, so_phieu, ma_gui, nha_cung_cap_id, loai, so_tien, ngay, ghi_chu, phieu_xuat_id, nguoi_tao)
    values
      (p_chi_nhanh_id, kho_sinh_so(p_chi_nhanh_id, 'GT'), gen_random_uuid(), v_pn.nha_cung_cap_id, 'giam_tru',
       v_tien, hom_nay_vn(), 'Trả hàng ' || v_so || ' của phiếu ' || v_pn.so_phieu, v_id, v_nv.id)
    returning id into v_tt;
    -- Không chặn vượt số còn nợ: phiếu đã trả đủ mà vẫn trả hàng thì nhà
    -- cung cấp nợ lại mình — còn nợ âm là đúng sự thật.
    insert into kho_thanh_toan_phan_bo (thanh_toan_id, chi_nhanh_id, phieu_nhap_id, so_tien)
    values (v_tt, p_chi_nhanh_id, v_pn.id, v_tien);
  end if;

  return query select v_id, v_so, v_tien, false;
end;
$$;

comment on function kho_tra_nha_cung_cap is
  'Trả hàng cho nhà cung cấp: ghi sổ tra_ncc từ lô của phiếu nhập, tự sinh giảm trừ công nợ cho phiếu đó.';


-- =============================================================================
-- 8 · BÁO CÁO — SECURITY INVOKER, RLS của người gọi vẫn áp dụng
-- =============================================================================
create or replace function kho_bao_cao_xuat_nhap_ton(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  mat_hang_id uuid, ma text, ten text, loai text, dem_goi boolean, don_vi_goi text,
  dau_kg numeric, dau_gia_tri bigint,
  nhap_kg numeric, nhap_gia_tri bigint,
  pha_ra_kg numeric, pha_ra_gia_tri bigint,
  pha_vao_kg numeric, pha_vao_gia_tri bigint,
  ban_kg numeric, ban_gia_tri bigint,
  xuat_bep_kg numeric, xuat_bep_gia_tri bigint,
  huy_kg numeric, huy_gia_tri bigint,
  tra_ncc_kg numeric, tra_ncc_gia_tri bigint,
  kiem_ke_kg numeric, kiem_ke_gia_tri bigint,
  cuoi_kg numeric, cuoi_gia_tri bigint
)
language sql
stable
set search_path = public
as $$
  with dong as (
    select s.mat_hang_id, s.ngay, s.so_kg,
           coalesce(g.loai, s.loai) as loai,
           s.so_kg * coalesce(lg.gia_von_kg, 0) as gia_tri
    from kho_so_cai s
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_lo_gia lg on lg.lo_id = s.lo_id
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay <= p_den
  ),
  gom as (
    select d.mat_hang_id,
      coalesce(sum(d.so_kg)   filter (where d.ngay < p_tu), 0) as dau_kg,
      coalesce(sum(d.gia_tri) filter (where d.ngay < p_tu), 0) as dau_gt,
      coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'nhap'), 0) as nhap_kg,
      coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'nhap'), 0) as nhap_gt,
      coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'pha_loc_ra'), 0) as pha_ra_kg,
      coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'pha_loc_ra'), 0) as pha_ra_gt,
      -coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'pha_loc_vao'), 0) as pha_vao_kg,
      -coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'pha_loc_vao'), 0) as pha_vao_gt,
      -coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'ban'), 0) as ban_kg,
      -coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'ban'), 0) as ban_gt,
      -coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'xuat_bep'), 0) as bep_kg,
      -coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'xuat_bep'), 0) as bep_gt,
      -coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'huy'), 0) as huy_kg,
      -coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'huy'), 0) as huy_gt,
      -coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'tra_ncc'), 0) as tra_kg,
      -coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'tra_ncc'), 0) as tra_gt,
      coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai in ('kiem_ke', 'hao_hut')), 0) as kk_kg,
      coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai in ('kiem_ke', 'hao_hut')), 0) as kk_gt,
      coalesce(sum(d.so_kg), 0) as cuoi_kg,
      coalesce(sum(d.gia_tri), 0) as cuoi_gt
    from dong d
    group by d.mat_hang_id
  )
  select m.id, m.ma, m.ten, m.loai, m.dem_goi, m.don_vi_goi,
         g.dau_kg, round(g.dau_gt)::bigint,
         g.nhap_kg, round(g.nhap_gt)::bigint,
         g.pha_ra_kg, round(g.pha_ra_gt)::bigint,
         g.pha_vao_kg, round(g.pha_vao_gt)::bigint,
         g.ban_kg, round(g.ban_gt)::bigint,
         g.bep_kg, round(g.bep_gt)::bigint,
         g.huy_kg, round(g.huy_gt)::bigint,
         g.tra_kg, round(g.tra_gt)::bigint,
         g.kk_kg, round(g.kk_gt)::bigint,
         g.cuoi_kg, round(g.cuoi_gt)::bigint
  from gom g
  join kho_mat_hang m on m.id = g.mat_hang_id
  where g.dau_kg <> 0 or g.cuoi_kg <> 0 or g.nhap_kg <> 0 or g.pha_ra_kg <> 0 or g.pha_vao_kg <> 0
     or g.ban_kg <> 0 or g.bep_kg <> 0 or g.huy_kg <> 0 or g.tra_kg <> 0 or g.kk_kg <> 0
  order by m.loai, m.thu_tu, m.ten
$$;

comment on function kho_bao_cao_xuat_nhap_ton is
  'Xuất – nhập – tồn theo mặt hàng trong kỳ (theo ngày chứng từ). Chuyển giữa các vị trí không tính (cộng trừ bằng 0). Giá trị theo giá vốn lô.';

create or replace function kho_bao_cao_thu_hoi(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  mat_hang_vao_id uuid, ten_mat_hang text, nha_cung_cap_id uuid, ten_nha_cung_cap text,
  so_phien int, kg_vao numeric, kg_thit numeric, kg_phu_pham numeric, kg_bo numeric, kg_hao_hut numeric,
  ty_le_thu_hoi numeric, gia_tri_vao bigint, gia_von_vao_kg numeric, gia_von_thit_kg numeric
)
language sql
stable
set search_path = public
as $$
  with phien as (
    select p.* from kho_phien_pha p
    where p.chi_nhanh_id = p_chi_nhanh_id and p.trang_thai = 'da_chot'
      and p.ngay_pha between p_tu and p_den and p.tong_kg_vao > 0
  ),
  thit as (
    select r.phien_pha_id, sum(coalesce(lg.gia_tri, 0)) as gia_tri
    from kho_phien_pha_ra r
    join phien p on p.id = r.phien_pha_id
    join kho_mat_hang m on m.id = r.mat_hang_id
    left join kho_lo_gia lg on lg.lo_id = r.lo_id
    where r.xu_ly <> 'bo' and m.loai <> 'phu_pham'
    group by r.phien_pha_id
  ),
  -- Một phiên có thể dùng tảng của nhiều nhà cung cấp: chia kết quả của phiên
  -- theo tỉ lệ kg từng lô vào.
  vao as (
    select p.id as phien_id, p.mat_hang_vao_id, pn.nha_cung_cap_id,
           v.so_kg / p.tong_kg_vao as phan, v.so_kg,
           v.so_kg * coalesce(lg.gia_von_kg, 0) as gia_tri,
           p.tong_kg_thit, p.tong_kg_phu_pham, p.tong_kg_bo, p.tong_kg_hao_hut,
           coalesce(t.gia_tri, 0) as gia_tri_thit
    from phien p
    join kho_phien_pha_vao v on v.phien_pha_id = p.id
    left join kho_lo l on l.id = v.lo_id
    left join kho_lo_gia lg on lg.lo_id = v.lo_id
    left join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    left join kho_phieu_nhap pn on pn.id = d.phieu_nhap_id and pn.loai = 'mua'
    left join thit t on t.phien_pha_id = p.id
  )
  select x.mat_hang_vao_id, m.ten, x.nha_cung_cap_id, n.ten,
         count(distinct x.phien_id)::int,
         round(sum(x.so_kg), 3),
         round(sum(x.tong_kg_thit * x.phan), 3),
         round(sum(x.tong_kg_phu_pham * x.phan), 3),
         round(sum(x.tong_kg_bo * x.phan), 3),
         round(sum(x.tong_kg_hao_hut * x.phan), 3),
         round(sum(x.tong_kg_thit * x.phan) * 100 / nullif(sum(x.so_kg), 0), 2),
         round(sum(x.gia_tri))::bigint,
         round(sum(x.gia_tri) / nullif(sum(x.so_kg), 0)),
         round(sum(x.gia_tri_thit * x.phan) / nullif(sum(x.tong_kg_thit * x.phan), 0))
  from vao x
  join kho_mat_hang m on m.id = x.mat_hang_vao_id
  left join kho_nha_cung_cap n on n.id = x.nha_cung_cap_id
  group by x.mat_hang_vao_id, m.ten, x.nha_cung_cap_id, n.ten
  order by m.ten, n.ten nulls last
$$;

comment on function kho_bao_cao_thu_hoi is
  'Thu hồi pha lóc theo loại tảng × nhà cung cấp trong kỳ: kg vào, thịt, phụ phẩm, bỏ, hao hụt, giá vốn vào và giá vốn thịt ra mỗi kg.';

create or replace function kho_bao_cao_hao_hut(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  mat_hang_id uuid, ten text, loai_dong text, ly_do text,
  so_kg numeric, so_goi int, gia_tri bigint
)
language sql
stable
set search_path = public
as $$
  with dong as (
    select s.mat_hang_id, coalesce(g.loai, s.loai) as loai, s.so_kg, s.so_goi,
           s.so_kg * coalesce(lg.gia_von_kg, 0) as gia_tri,
           s.chung_tu_loai, s.chung_tu_id
    from kho_so_cai s
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_lo_gia lg on lg.lo_id = s.lo_id
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay between p_tu and p_den
  ),
  phan_loai as (
    select d.*,
           case when d.loai in ('kiem_ke', 'hao_hut')
                then case when d.so_kg < 0 or (d.so_kg = 0 and d.so_goi < 0) then 'kiem_ke_thieu' else 'kiem_ke_thua' end
                else d.loai end as nhom,
           case when d.chung_tu_loai = 'phien_pha' then 'Pha lóc chuyển thẳng bếp'
                else ld.ten end as ten_ly_do
    from dong d
    left join kho_phieu_xuat px on d.chung_tu_loai = 'phieu_xuat' and px.id = d.chung_tu_id
    left join kho_ly_do ld on ld.id = px.ly_do_id
    where d.loai in ('huy', 'xuat_bep', 'tra_ncc', 'kiem_ke', 'hao_hut')
  )
  select x.mat_hang_id, m.ten, x.nhom, x.ten_ly_do,
         abs(sum(x.so_kg)), abs(sum(x.so_goi))::int, abs(round(sum(x.gia_tri)))::bigint
  from phan_loai x
  join kho_mat_hang m on m.id = x.mat_hang_id
  group by x.mat_hang_id, m.ten, m.loai, m.thu_tu, x.nhom, x.ten_ly_do
  having sum(x.so_kg) <> 0 or sum(x.so_goi) <> 0
  order by x.nhom, m.loai, m.thu_tu, m.ten
$$;

comment on function kho_bao_cao_hao_hut is
  'Hủy, xuất bếp, trả nhà cung cấp, chênh lệch kiểm kê (thiếu / thừa) trong kỳ, theo mặt hàng và lý do.';

create or replace function kho_bao_cao_ban(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  mat_hang_id uuid, ten text, so_kg numeric, so_goi int, gia_von bigint,
  gia_ban_kg bigint, doanh_thu_uoc_tinh bigint, lai_gop_uoc_tinh bigint
)
language sql
stable
set search_path = public
as $$
  with dong as (
    select s.mat_hang_id, s.so_kg, s.so_goi, s.so_kg * coalesce(lg.gia_von_kg, 0) as gia_tri
    from kho_so_cai s
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_lo_gia lg on lg.lo_id = s.lo_id
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay between p_tu and p_den
      and coalesce(g.loai, s.loai) = 'ban'
  )
  select m.id, m.ten, -sum(d.so_kg), (-sum(d.so_goi))::int, round(-sum(d.gia_tri))::bigint,
         m.gia_ban_kg,
         round(-sum(d.so_kg) * m.gia_ban_kg)::bigint,
         round(-sum(d.so_kg) * m.gia_ban_kg + sum(d.gia_tri))::bigint
  from dong d
  join kho_mat_hang m on m.id = d.mat_hang_id
  group by m.id, m.ten, m.gia_ban_kg, m.loai, m.thu_tu
  having sum(d.so_kg) <> 0 or sum(d.so_goi) <> 0
  order by m.loai, m.thu_tu, m.ten
$$;

comment on function kho_bao_cao_ban is
  'Hàng bán trong kỳ (từ kiểm kê quầy khi chưa nối iPOS): kg, giá vốn, doanh thu và lãi gộp ƯỚC TÍNH theo giá bán hiện tại.';


-- =============================================================================
-- 9 · PHÂN QUYỀN
-- =============================================================================
alter table kho_thanh_toan         enable row level security;
alter table kho_thanh_toan_phan_bo enable row level security;

create policy kho_thanh_toan_doc on kho_thanh_toan
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));
create policy kho_thanh_toan_phan_bo_doc on kho_thanh_toan_phan_bo
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6
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

    -- Đo lường
    execute 'grant execute on function ghi_su_kien_web(text,text,uuid,text,text,text,text,text,text,text) to anon';
  end if;
end
$$;
