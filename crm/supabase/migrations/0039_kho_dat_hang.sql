-- =============================================================================
-- BEEFTOWN KHO — 0039 · ĐẶT HÀNG NHÀ CUNG CẤP · NHẬN HÀNG THEO ĐƠN · ĐÁNH GIÁ NCC (GĐ8a)
-- =============================================================================
-- Chủ nhà hàng đã chốt: quán lập đơn đặt hàng gửi nhà cung cấp (NCC) ngay trong
-- phần mềm, có GỢI Ý số kg nên đặt; in / lưu PDF gửi Zalo; hàng về thì thủ kho
-- "Nhận hàng theo đơn này" (phiếu nhận hàng điền sẵn món và kg còn thiếu); cuối
-- kỳ xem đánh giá từng NCC.
--
-- AI LÀM GÌ (dùng quyền có sẵn, không thêm việc mới vào kho_vai_duoc)
--   Lập / sửa đơn NHÁP      nhap         (chủ, quản lý, thủ kho)
--   Điền giá dự kiến        nhap + xem_gia (chủ, quản lý). Thủ kho gửi đơn giá
--                           là bị từ chối; lưu lại đơn thì giá cũ theo mặt hàng
--                           được giữ (như kho_luu_phieu_nhap_kg 0031).
--   Gửi đơn cho NCC         nhap + duyet_nhap (chủ, quản lý). Kế toán có
--                           duyet_nhap nhưng không có nhap → không gửi đơn.
--   Hủy đơn                 nháp: nhap. Đã gửi: nhap + duyet_nhap, bắt buộc lý do.
--   Xem đơn có tiền         xem_gia (kế toán, quản lý, chủ) — bảng / view.
--   Xem đơn chỉ kg          nhap hoặc xem_gia — kho_ds_don_dat_kg, kho_doc_don_dat_kg.
--   Gợi ý đặt hàng          nhap hoặc xem_gia — không có tiền.
--   Đánh giá NCC            nhap hoặc xem_gia — cột tiền / công nợ chỉ xem_gia.
--   Thủ kho KHÔNG thấy tiền ở bất kỳ bảng / hàm nào của đơn đặt.
--
-- BẢNG
--   kho_don_dat       đơn (số DH-), vòng đời:
--                       nhap ─gửi→ da_gui ─nhận một phần→ nhan_mot_phan ─nhận đủ→ da_nhan
--                       nhap / da_gui / nhan_mot_phan ─hủy→ huy
--                     da_gui ⇄ nhan_mot_phan ⇄ da_nhan tự đổi theo phiếu nhận hàng
--                     (trigger, mục 5) — hủy / từ chối phiếu thì đơn quay lại.
--   kho_don_dat_dong  món × kg đặt (+ số gói, đơn giá dự kiến — CÓ TIỀN).
--                     so_kg_da_nhan do trigger ghi (mục 5), không ai ghi tay.
--   kho_phieu_nhap.don_dat_id   phiếu nhận hàng theo đơn nào (null = nhận lẻ).
--   kho_nha_cung_cap.so_ngay_giao (mặc định 1), ngay_giao_trong_tuan (tùy chọn).
--   kho_mat_hang.kho_toi_thieu_kg, kho_toi_da_kg (mức kho lạnh, cho gợi ý).
--
-- "ĐÃ NHẬN" (so_kg_da_nhan): tổng kg các dòng cùng mặt hàng của mọi phiếu nhận
--   hàng gắn đơn đang CHỜ DUYỆT hoặc ĐÃ DUYỆT. Phiếu nháp / bị trả về / đã hủy
--   không tính. Món giao thêm ngoài đơn không tính vào đơn.
-- "ĐỦ" một dòng: kg nhận ≥ 95% kg đặt (thịt cân không bao giờ tròn số — tảng
--   đặt "12 kg" về 11,6 kg là đủ), HOẶC dòng có số gói đặt và số gói nhận ≥ số
--   gói đặt. Mọi dòng đủ → da_nhan; có dòng đã nhận > 0 → nhan_mot_phan.
--
-- HÀM
--   kho_luu_don_dat, kho_gui_don_dat, kho_huy_don_dat               [đơn]
--   kho_ds_don_dat_kg, kho_doc_don_dat_kg                           [chỉ kg]
--   kho_goi_y_dat_hang                                              [gợi ý, không tiền]
--   kho_tao_phieu_nhap_tu_don                                       [nhap]
--   kho_bao_cao_ncc (definer)                                       [đánh giá NCC]
--   kho_luu_muc_dat_hang                                            [danh_muc]
--   Nội bộ: kho_don_dat_tinh_nhan, kho_ngay_giao_mac_dinh, kho_so_chu,
--           kho_don_dat_dong_du.
--   Trigger: kho_phieu_nhap_kiem_don, kho_phieu_nhap_cap_nhat_don.
--   Thay thân (cùng chữ ký): kho_doc_phieu_nhap_kg (thêm khóa don_dat),
--   kho_su_kien, kho_dem_viec (thêm don_dat_tre). View kho_v_phieu_nhap thêm
--   cột don_dat_id ở CUỐI.
--
-- SỰ KIỆN
--   don_dat_tre  nhac_nho  quản lý, chủ (duyet): đơn da_gui (chưa nhận chút nào)
--                          đã qua ngày giao dự kiến. ref_id = đơn, ref2 = NCC,
--                          ma = số đơn, ten = tên NCC, phu = ngày giao dự kiến
--                          (YYYY-MM-DD), so = số ngày trễ, mốc = 0 giờ ngày sau
--                          ngày giao dự kiến. Số đỏ mới: don_dat_tre.
-- =============================================================================


-- =============================================================================
-- 1 · CỘT MỚI TRÊN DANH MỤC
-- =============================================================================
alter table kho_nha_cung_cap
  add column so_ngay_giao         int not null default 1,
  add column ngay_giao_trong_tuan int[];
alter table kho_nha_cung_cap
  add constraint kho_nha_cung_cap_ngay_giao_hop_le check (so_ngay_giao between 0 and 60),
  add constraint kho_nha_cung_cap_thu_giao_hop_le check (
    ngay_giao_trong_tuan is null
    or (cardinality(ngay_giao_trong_tuan) between 1 and 7
        and ngay_giao_trong_tuan <@ array[1, 2, 3, 4, 5, 6, 7]));

comment on column kho_nha_cung_cap.so_ngay_giao is
  'Số ngày từ lúc gửi đơn tới lúc hàng về (0039, mặc định 1). Dùng cho ngày giao dự kiến và gợi ý đặt hàng.';
comment on column kho_nha_cung_cap.ngay_giao_trong_tuan is
  'Thứ NCC giao hàng (1 = Thứ Hai … 7 = Chủ nhật, như isodow). Trống = ngày nào cũng giao. Ngày giao dự kiến mặc định = ngày đầu tiên từ hôm nay + so_ngay_giao rơi vào một trong các thứ này.';

alter table kho_mat_hang
  add column kho_toi_thieu_kg numeric(12,3),
  add column kho_toi_da_kg    numeric(12,3);
alter table kho_mat_hang
  add constraint kho_mat_hang_muc_kho_hop_le check (
    (kho_toi_thieu_kg is null or kho_toi_thieu_kg >= 0)
    and (kho_toi_da_kg is null or kho_toi_da_kg > 0)
    and (kho_toi_thieu_kg is null or kho_toi_da_kg is null or kho_toi_thieu_kg <= kho_toi_da_kg));

comment on column kho_mat_hang.kho_toi_thieu_kg is
  'Mức tối thiểu ở kho lạnh (0039): còn (tồn + đang mang ra quầy + đã đặt chưa về) dưới mức này thì gợi ý đặt hàng ghi "dưới mức tối thiểu".';
comment on column kho_mat_hang.kho_toi_da_kg is
  'Mức tối đa ở kho lạnh (0039): gợi ý đặt hàng đặt cho tới mức này. Trống = dùng trung bình 28 ngày × (số ngày giao + 3).';

-- Web ghi hai cột trên qua hàm này (quyền danh_muc). Bảng vẫn cho vai
-- danh_muc update thẳng như các cột khác (policy 0019).
create or replace function kho_luu_muc_dat_hang(p_mat_hang_id uuid, p_kho_toi_thieu_kg numeric, p_kho_toi_da_kg numeric)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mh kho_mat_hang;
begin
  if not kho_co_quyen('danh_muc') then
    raise exception 'Tài khoản của bạn không sửa được mặt hàng' using errcode = 'insufficient_privilege';
  end if;
  select * into v_mh from kho_mat_hang where id = p_mat_hang_id for update;
  if not found then
    raise exception 'Không tìm thấy mặt hàng' using errcode = 'check_violation';
  end if;
  if p_kho_toi_thieu_kg is not null and (p_kho_toi_thieu_kg < 0 or p_kho_toi_thieu_kg >= 1000000) then
    raise exception '%: mức tối thiểu phải từ 0 kg trở lên', v_mh.ten using errcode = 'check_violation';
  end if;
  if p_kho_toi_da_kg is not null and (p_kho_toi_da_kg <= 0 or p_kho_toi_da_kg >= 1000000) then
    raise exception '%: mức tối đa phải lớn hơn 0 kg', v_mh.ten using errcode = 'check_violation';
  end if;
  if p_kho_toi_thieu_kg is not null and p_kho_toi_da_kg is not null and p_kho_toi_thieu_kg > p_kho_toi_da_kg then
    raise exception '%: mức tối thiểu không được lớn hơn mức tối đa', v_mh.ten using errcode = 'check_violation';
  end if;
  update kho_mat_hang
     set kho_toi_thieu_kg = round(p_kho_toi_thieu_kg, 3),
         kho_toi_da_kg    = round(p_kho_toi_da_kg, 3)
   where id = p_mat_hang_id;
  return 'Đã lưu mức kho lạnh của ' || v_mh.ten || '.';
end;
$$;

comment on function kho_luu_muc_dat_hang is
  'Lưu mức tối thiểu / tối đa ở kho lạnh (kg) của một mặt hàng (danh_muc; 0039). null = bỏ mức.';


-- =============================================================================
-- 2 · BẢNG ĐƠN ĐẶT HÀNG
-- =============================================================================
create table kho_don_dat (
  id                uuid primary key default gen_random_uuid(),
  chi_nhanh_id      uuid not null references chi_nhanh(id) on delete restrict,
  so_phieu          text not null,
  ma_gui            uuid not null,
  phien_ban         int not null default 1,
  nha_cung_cap_id   uuid not null references kho_nha_cung_cap(id) on delete restrict,
  trang_thai        text not null default 'nhap',
  ngay_dat          date not null default hom_nay_vn(),
  ngay_giao_du_kien date not null,
  ghi_chu           text,
  nguoi_lap         uuid references nhan_su(id) on delete set null,
  gui_luc           timestamptz,
  gui_boi           uuid references nhan_su(id) on delete set null,
  huy_luc           timestamptz,
  huy_boi           uuid references nhan_su(id) on delete set null,
  ly_do_huy         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint kho_don_dat_so_duy_nhat     unique (chi_nhanh_id, so_phieu),
  constraint kho_don_dat_ma_gui_duy_nhat unique (ma_gui),
  constraint kho_don_dat_trang_thai_hop_le
    check (trang_thai in ('nhap', 'da_gui', 'nhan_mot_phan', 'da_nhan', 'huy')),
  constraint kho_don_dat_ghi_chu_hop_le check (ghi_chu is null or char_length(ghi_chu) <= 500),
  constraint kho_don_dat_gui_hop_le check (trang_thai in ('nhap', 'huy') or gui_luc is not null)
);

create index kho_don_dat_ds_idx on kho_don_dat(chi_nhanh_id, trang_thai, ngay_dat desc);
create index kho_don_dat_ncc_idx on kho_don_dat(nha_cung_cap_id, ngay_giao_du_kien);

create trigger kho_don_dat_updated_at
  before update on kho_don_dat
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_don_dat is
  'Đơn đặt hàng nhà cung cấp (0039), số DH-. Không có cột tiền. Ghi CHỈ qua kho_luu_don_dat / kho_gui_don_dat / kho_huy_don_dat; da_gui ⇄ nhan_mot_phan ⇄ da_nhan do trigger phiếu nhập đổi.';

create table kho_don_dat_dong (
  id              uuid primary key default gen_random_uuid(),
  don_dat_id      uuid not null references kho_don_dat(id) on delete cascade,
  chi_nhanh_id    uuid not null references chi_nhanh(id) on delete restrict,
  thu_tu          int not null default 0,
  mat_hang_id     uuid not null references kho_mat_hang(id) on delete restrict,
  so_kg_dat       numeric(12,3) not null,
  so_goi_dat      int,
  don_gia_du_kien bigint,
  so_kg_da_nhan   numeric(12,3) not null default 0,

  constraint kho_don_dat_dong_duy_nhat unique (don_dat_id, mat_hang_id),
  constraint kho_don_dat_dong_so_hop_le check (
    so_kg_dat > 0 and (so_goi_dat is null or so_goi_dat > 0)
    and (don_gia_du_kien is null or don_gia_du_kien >= 0) and so_kg_da_nhan >= 0)
);

create index kho_don_dat_dong_don_idx on kho_don_dat_dong(don_dat_id, thu_tu);
create index kho_don_dat_dong_mh_idx on kho_don_dat_dong(chi_nhanh_id, mat_hang_id);

comment on table kho_don_dat_dong is
  'Dòng đơn đặt (0039): mặt hàng, kg đặt, số gói (tùy chọn), đơn giá dự kiến (đ/kg — CÓ TIỀN, chỉ xem_gia). so_kg_da_nhan = kg của phiếu nhận hàng gắn đơn đang chờ duyệt / đã duyệt (trigger ghi).';

alter table kho_don_dat      enable row level security;
alter table kho_don_dat_dong enable row level security;

-- Có tiền (dòng) / đi cùng tiền (đơn): chỉ vai xem_gia đọc thẳng. Thủ kho đọc
-- qua kho_ds_don_dat_kg / kho_doc_don_dat_kg. Ghi CHỈ qua hàm.
create policy kho_don_dat_doc on kho_don_dat
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));
create policy kho_don_dat_dong_doc on kho_don_dat_dong
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));

-- Phiếu nhận hàng theo đơn.
alter table kho_phieu_nhap
  add column don_dat_id uuid references kho_don_dat(id) on delete restrict;
create index kho_phieu_nhap_don_dat_idx on kho_phieu_nhap(don_dat_id) where don_dat_id is not null;
comment on column kho_phieu_nhap.don_dat_id is
  'Phiếu nhận hàng theo đơn đặt nào (0039). Cùng chi nhánh, cùng nhà cung cấp (trigger kiểm).';

-- Danh sách đơn cho vai xem giá: tổng kg, tổng tiền dự kiến, trễ hẹn.
create view kho_v_don_dat with (security_invoker = true) as
select d.id, d.chi_nhanh_id, d.so_phieu, d.trang_thai, d.phien_ban,
       d.nha_cung_cap_id, ncc.ten as ten_nha_cung_cap,
       d.ngay_dat, d.ngay_giao_du_kien, d.ghi_chu,
       d.nguoi_lap, d.gui_luc, d.gui_boi, d.huy_luc, d.huy_boi, d.ly_do_huy,
       d.created_at, d.updated_at,
       coalesce(x.so_dong, 0)       as so_dong,
       coalesce(x.tong_kg_dat, 0)   as tong_kg_dat,
       coalesce(x.tong_kg_nhan, 0)  as tong_kg_da_nhan,
       x.tien_du_kien               as tong_tien_du_kien,
       (d.trang_thai in ('da_gui', 'nhan_mot_phan') and d.ngay_giao_du_kien < hom_nay_vn()) as tre_hen
from kho_don_dat d
left join kho_nha_cung_cap ncc on ncc.id = d.nha_cung_cap_id
left join lateral (
  select count(*) as so_dong, sum(dd.so_kg_dat) as tong_kg_dat, sum(dd.so_kg_da_nhan) as tong_kg_nhan,
         sum(round(dd.so_kg_dat * dd.don_gia_du_kien))::bigint as tien_du_kien
  from kho_don_dat_dong dd where dd.don_dat_id = d.id
) x on true;

comment on view kho_v_don_dat is
  'Đơn đặt hàng kèm tổng kg đặt / đã nhận, tổng tiền dự kiến (kg × đơn giá dự kiến; null khi chưa điền giá nào), tre_hen. Chỉ vai xem_gia đọc được (RLS).';

-- kho_v_phieu_nhap (0035) thêm don_dat_id ở CUỐI — các cột cũ giữ nguyên thứ tự.
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
       coalesce(d.tien_hang, 0) + p.tien_thue + p.chi_phi_khac as tong_tien,
       p.don_dat_id
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
  'Danh sách phiếu nhập kèm tổng kg, tổng tiền. Chỉ vai xem_gia đọc được (RLS của kho_phieu_nhap). 0035: không gồm phiếu nợ đầu kỳ — xem ở kho_v_cong_no_phieu. 0039: thêm don_dat_id (phiếu nhận theo đơn đặt).';


-- =============================================================================
-- 3 · HÀM NỘI BỘ NHỎ
-- =============================================================================
-- Số kg thành chữ kiểu Việt: 12.50 → "12,5"; 10.000 → "10". Một số lẻ.
create or replace function kho_so_chu(p numeric)
returns text
language sql
immutable
set search_path = public
as $$
  select replace(case when position('.' in t) > 0 then rtrim(rtrim(t, '0'), '.') else t end, '.', ',')
  from (select round(coalesce(p, 0), 1)::text as t) x
$$;

comment on function kho_so_chu is 'NỘI BỘ (0039). Số (kg) thành chữ có dấu phẩy thập phân, một số lẻ, bỏ số 0 thừa.';

-- Ngày giao dự kiến mặc định của một NCC, tính từ p_tu (ngày gửi đơn):
-- p_tu + so_ngay_giao, rồi lùi tới thứ giao gần nhất nếu NCC chỉ giao vài thứ.
create or replace function kho_ngay_giao_mac_dinh(p_ncc uuid, p_tu date)
returns date
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select min(ngay)::date
    from kho_nha_cung_cap n,
         generate_series(p_tu + n.so_ngay_giao, p_tu + n.so_ngay_giao + 6, interval '1 day') ngay
    where n.id = p_ncc
      and (n.ngay_giao_trong_tuan is null
           or extract(isodow from ngay)::int = any(n.ngay_giao_trong_tuan))),
    p_tu + 1)
$$;

comment on function kho_ngay_giao_mac_dinh is
  'NỘI BỘ (0039). Ngày giao dự kiến mặc định: từ p_tu + so_ngay_giao, ngày đầu tiên rơi vào thứ NCC giao (ngay_giao_trong_tuan; trống = mọi ngày).';

-- Một dòng đơn đã "đủ" chưa (xem đầu file).
create or replace function kho_don_dat_dong_du(p_kg_dat numeric, p_kg_nhan numeric, p_goi_dat int, p_goi_nhan int)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(p_kg_nhan, 0) >= p_kg_dat * 0.95
      or (p_goi_dat is not null and coalesce(p_goi_nhan, 0) >= p_goi_dat)
$$;

comment on function kho_don_dat_dong_du is
  'NỘI BỘ (0039). Dòng đơn đặt đã đủ: kg nhận ≥ 95% kg đặt, hoặc có số gói đặt và số gói nhận ≥ số gói đặt.';


-- =============================================================================
-- 4 · LẬP, GỬI, HỦY ĐƠN
-- =============================================================================
-- p_dong: [{mat_hang_id, so_kg_dat, so_goi_dat?, don_gia_du_kien?}]
--   · Người không xem_gia (thủ kho) gửi khóa don_gia_du_kien → từ chối (có là
--     báo lỗi, không lặng lẽ bỏ — như 0031).
--   · Dòng không có khóa don_gia_du_kien: giữ đơn giá cũ của cùng mặt hàng
--     (thủ kho sửa kg đơn quản lý đã điền giá thì giá không mất). Vai xem_gia
--     gửi don_gia_du_kien = null là xóa giá.
--   · Mỗi mặt hàng một dòng. Chỉ sửa được đơn NHÁP; muốn đổi đơn đã gửi thì
--     hủy rồi lập lại (NCC đã nhận bản in).
-- p_ngay_giao null = ngày giao mặc định của NCC (kho_ngay_giao_mac_dinh).
create or replace function kho_luu_don_dat(
  p_id           uuid,
  p_chi_nhanh_id uuid,
  p_ma_gui       uuid,
  p_phien_ban    int,
  p_ncc          uuid,
  p_ngay_giao    date,
  p_ghi_chu      text,
  p_dong         jsonb
)
returns table (don_id uuid, phien_ban_moi int, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv      nhan_su;
  v_xem_gia boolean;
  v_dd      kho_don_dat;
  v_ncc     kho_nha_cung_cap;
  v_id      uuid;
  v_pb      int;
  v_ngay    date;
  v_gc      text := nullif(btrim(coalesce(p_ghi_chu, '')), '');
  v_dong    jsonb;
  v_khoa    text;
  v_i       int := 0;
  v_mh      kho_mat_hang;
  v_kg      numeric;
  v_goi     int;
  v_gia     bigint;
  v_co_gia  boolean;
  v_gia_cu  jsonb := '{}';
  a_mh      uuid[] := '{}';
  a_kg      numeric[] := '{}';
  a_goi     int[] := '{}';
  a_gia     bigint[] := '{}';
  a_co_gia  boolean[] := '{}';
  c_khoa    constant text[] := array['mat_hang_id', 'so_kg_dat', 'so_goi_dat', 'don_gia_du_kien'];
  c_uuid    constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not kho_duoc(p_chi_nhanh_id, 'nhap') then
    raise exception 'Tài khoản của bạn không được lập đơn đặt hàng ở chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();
  v_xem_gia := kho_duoc(p_chi_nhanh_id, 'xem_gia');

  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho — vào Thiết lập, bấm "Bắt đầu dùng kho"'
      using errcode = 'check_violation';
  end if;

  -- Bấm Lưu hai lần / F5: cùng ma_gui thì trả đơn đã có.
  if p_id is null then
    select d.id, d.phien_ban into v_id, v_pb from kho_don_dat d where d.ma_gui = p_ma_gui;
    if found then
      return query select v_id, v_pb, true;
      return;
    end if;
    if p_ma_gui is null then
      raise exception 'Thiếu mã chống gửi trùng — tải lại trang rồi lưu' using errcode = 'check_violation';
    end if;
  else
    select * into v_dd from kho_don_dat d where d.id = p_id for update;
    if not found or v_dd.chi_nhanh_id <> p_chi_nhanh_id then
      raise exception 'Không tìm thấy đơn đặt hàng' using errcode = 'check_violation';
    end if;
    if v_dd.trang_thai <> 'nhap' then
      raise exception 'Đơn % đã % — không sửa được nữa. Muốn đổi thì hủy đơn rồi lập đơn mới.', v_dd.so_phieu,
        case v_dd.trang_thai when 'huy' then 'bị hủy' when 'da_nhan' then 'nhận đủ hàng' else 'gửi cho nhà cung cấp' end
        using errcode = 'check_violation';
    end if;
    if p_phien_ban is distinct from v_dd.phien_ban then
      raise exception 'Đơn đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
        using errcode = 'check_violation';
    end if;
  end if;

  select * into v_ncc from kho_nha_cung_cap where id = p_ncc;
  if not found or not v_ncc.dang_dung then
    raise exception 'Chọn nhà cung cấp đang dùng' using errcode = 'check_violation';
  end if;

  v_ngay := coalesce(p_ngay_giao, kho_ngay_giao_mac_dinh(p_ncc, hom_nay_vn()));
  if v_ngay < hom_nay_vn() then
    raise exception 'Ngày giao không được trước hôm nay' using errcode = 'check_violation';
  end if;
  if v_ngay > hom_nay_vn() + 90 then
    raise exception 'Ngày giao quá 90 ngày tới — kiểm tra lại ngày' using errcode = 'check_violation';
  end if;
  if v_gc is not null and char_length(v_gc) > 500 then
    raise exception 'Ghi chú dài quá (tối đa 500 chữ)' using errcode = 'check_violation';
  end if;

  -- Dòng hàng: kiểm HẾT trước khi ghi gì.
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' or jsonb_array_length(p_dong) = 0 then
    raise exception 'Đơn chưa có món nào — ghi số kg cho ít nhất một món' using errcode = 'check_violation';
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
    if v_dong ? 'don_gia_du_kien' and not v_xem_gia then
      raise exception 'Dòng %: thủ kho không điền giá — quản lý điền giá dự kiến khi gửi đơn', v_i
        using errcode = 'check_violation';
    end if;

    if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string'
       or (v_dong ->> 'mat_hang_id') !~* c_uuid then
      raise exception 'Dòng %: chưa chọn mặt hàng', v_i using errcode = 'check_violation';
    end if;
    select * into v_mh from kho_mat_hang where id = (v_dong ->> 'mat_hang_id')::uuid;
    if not found or not v_mh.dang_dung then
      raise exception 'Dòng %: mặt hàng không có hoặc đã ngừng dùng', v_i using errcode = 'check_violation';
    end if;
    if v_mh.id = any(a_mh) then
      raise exception 'Dòng % (%): món này đã có ở dòng trên — gộp lại một dòng', v_i, v_mh.ten
        using errcode = 'check_violation';
    end if;

    if jsonb_typeof(v_dong -> 'so_kg_dat') is distinct from 'number' then
      raise exception 'Dòng % (%): chưa ghi số kg đặt', v_i, v_mh.ten using errcode = 'check_violation';
    end if;
    v_kg := (v_dong ->> 'so_kg_dat')::numeric;
    if v_kg <= 0 or v_kg >= 100000 or v_kg <> round(v_kg, 3) then
      raise exception 'Dòng % (%): số kg đặt phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mh.ten
        using errcode = 'check_violation';
    end if;

    v_goi := null;
    if v_dong ? 'so_goi_dat' and v_dong -> 'so_goi_dat' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi_dat') <> 'number'
         or (v_dong ->> 'so_goi_dat')::numeric <> trunc((v_dong ->> 'so_goi_dat')::numeric)
         or (v_dong ->> 'so_goi_dat')::numeric <= 0 or (v_dong ->> 'so_goi_dat')::numeric > 100000 then
        raise exception 'Dòng % (%): số % đặt phải là số nguyên lớn hơn 0', v_i, v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi_dat')::int;
    end if;

    v_gia := null;
    v_co_gia := v_dong ? 'don_gia_du_kien';
    if v_co_gia and v_dong -> 'don_gia_du_kien' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'don_gia_du_kien') <> 'number'
         or (v_dong ->> 'don_gia_du_kien')::numeric <> trunc((v_dong ->> 'don_gia_du_kien')::numeric)
         or (v_dong ->> 'don_gia_du_kien')::numeric < 0
         or (v_dong ->> 'don_gia_du_kien')::numeric >= 1000000000 then
        raise exception 'Dòng % (%): đơn giá dự kiến phải là số đồng không âm', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      v_gia := (v_dong ->> 'don_gia_du_kien')::bigint;
    end if;

    a_mh := a_mh || v_mh.id;
    a_kg := a_kg || v_kg;
    a_goi := a_goi || v_goi;
    a_gia := a_gia || v_gia;
    a_co_gia := a_co_gia || v_co_gia;
  end loop;

  if p_id is null then
    insert into kho_don_dat (chi_nhanh_id, so_phieu, ma_gui, nha_cung_cap_id, ngay_giao_du_kien, ghi_chu, nguoi_lap)
    values (p_chi_nhanh_id, kho_sinh_so(p_chi_nhanh_id, 'DH'), p_ma_gui, p_ncc, v_ngay, v_gc, v_nv.id)
    returning kho_don_dat.id, kho_don_dat.phien_ban into v_id, v_pb;
  else
    -- Đơn giá dự kiến đang có, theo mặt hàng.
    select coalesce(jsonb_object_agg(dd.mat_hang_id::text, dd.don_gia_du_kien), '{}')
      into v_gia_cu
    from kho_don_dat_dong dd where dd.don_dat_id = p_id and dd.don_gia_du_kien is not null;

    update kho_don_dat set
      nha_cung_cap_id   = p_ncc,
      ngay_giao_du_kien = v_ngay,
      ghi_chu           = v_gc,
      phien_ban         = kho_don_dat.phien_ban + 1
    where kho_don_dat.id = p_id
    returning kho_don_dat.id, kho_don_dat.phien_ban into v_id, v_pb;

    delete from kho_don_dat_dong where don_dat_id = p_id;
  end if;

  for j in 1 .. cardinality(a_mh) loop
    insert into kho_don_dat_dong (don_dat_id, chi_nhanh_id, thu_tu, mat_hang_id, so_kg_dat, so_goi_dat, don_gia_du_kien)
    values (v_id, p_chi_nhanh_id, j, a_mh[j], a_kg[j], a_goi[j],
            case when a_co_gia[j] then a_gia[j] else (v_gia_cu ->> a_mh[j]::text)::bigint end);
  end loop;

  return query select v_id, v_pb, false;
end;
$$;

comment on function kho_luu_don_dat is
  'Lưu đơn đặt hàng NHÁP (quyền nhap; 0039). p_dong [{mat_hang_id, so_kg_dat, so_goi_dat?, don_gia_du_kien?}] — vai không xem_gia gửi don_gia_du_kien bị từ chối; dòng thiếu khóa giá giữ giá cũ theo mặt hàng. Chống trùng bằng p_ma_gui, chống ghi đè bằng p_phien_ban. Trả (don_id, phien_ban_moi, da_co).';

-- Gửi đơn cho NCC (in / PDF / Zalo làm ở web): chủ, quản lý.
create or replace function kho_gui_don_dat(p_id uuid, p_phien_ban int)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dd  kho_don_dat;
  v_ncc kho_nha_cung_cap;
begin
  select * into v_dd from kho_don_dat where id = p_id for update;
  if not found or not kho_duoc(v_dd.chi_nhanh_id, 'nhap') or not kho_duoc(v_dd.chi_nhanh_id, 'duyet_nhap') then
    raise exception 'Không tìm thấy đơn, hoặc tài khoản không được gửi đơn đặt hàng (quản lý / chủ gửi)'
      using errcode = 'insufficient_privilege';
  end if;
  if v_dd.trang_thai in ('da_gui', 'nhan_mot_phan', 'da_nhan') then
    return 'Đơn ' || v_dd.so_phieu || ' đã được gửi trước đó.';
  end if;
  if v_dd.trang_thai <> 'nhap' then
    raise exception 'Đơn % đã bị hủy', v_dd.so_phieu using errcode = 'check_violation';
  end if;
  if p_phien_ban is distinct from v_dd.phien_ban then
    raise exception 'Đơn đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
      using errcode = 'check_violation';
  end if;
  select * into v_ncc from kho_nha_cung_cap where id = v_dd.nha_cung_cap_id;
  if not v_ncc.dang_dung then
    raise exception 'Nhà cung cấp % đã ngừng dùng', v_ncc.ten using errcode = 'check_violation';
  end if;
  if not exists (select 1 from kho_don_dat_dong where don_dat_id = p_id) then
    raise exception 'Đơn chưa có món nào' using errcode = 'check_violation';
  end if;
  if v_dd.ngay_giao_du_kien < hom_nay_vn() then
    raise exception 'Ngày giao % đã qua — sửa ngày giao rồi gửi', to_char(v_dd.ngay_giao_du_kien, 'DD/MM/YYYY')
      using errcode = 'check_violation';
  end if;

  update kho_don_dat set
    trang_thai = 'da_gui',
    gui_luc    = now(),
    gui_boi    = (nhan_su_hien_tai()).id,
    phien_ban  = phien_ban + 1
  where id = p_id;

  return 'Đã gửi đơn ' || v_dd.so_phieu || ' cho ' || v_ncc.ten || '. In hoặc lưu PDF để gửi Zalo.';
end;
$$;

comment on function kho_gui_don_dat is
  'Gửi đơn đặt hàng (nhap + duyet_nhap = chủ, quản lý; 0039): nháp → da_gui. Gửi lại đơn đã gửi trả câu báo, không lỗi. p_phien_ban chống gửi bản cũ.';

-- Hủy đơn. Nháp: ai lập đơn được (nhap). Đã gửi / nhận một phần: chủ, quản
-- lý, bắt buộc lý do. Phiếu nhận hàng đã gắn vẫn giữ nguyên (hàng đã về là đã về).
create or replace function kho_huy_don_dat(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dd kho_don_dat;
  v_ld text := nullif(btrim(coalesce(p_ly_do, '')), '');
begin
  select * into v_dd from kho_don_dat where id = p_id for update;
  if not found or not kho_duoc(v_dd.chi_nhanh_id, 'nhap') then
    raise exception 'Không tìm thấy đơn, hoặc tài khoản không được hủy đơn đặt hàng'
      using errcode = 'insufficient_privilege';
  end if;
  if v_dd.trang_thai = 'huy' then
    return 'Đơn ' || v_dd.so_phieu || ' đã hủy trước đó.';
  end if;
  if v_dd.trang_thai = 'da_nhan' then
    raise exception 'Đơn % đã nhận đủ hàng — không hủy được', v_dd.so_phieu using errcode = 'check_violation';
  end if;
  if v_dd.trang_thai <> 'nhap' then
    if not kho_duoc(v_dd.chi_nhanh_id, 'duyet_nhap') then
      raise exception 'Đơn đã gửi cho nhà cung cấp — nhờ quản lý hủy' using errcode = 'insufficient_privilege';
    end if;
    if v_ld is null then
      raise exception 'Ghi lý do hủy (ví dụ: nhà cung cấp hết hàng)' using errcode = 'check_violation';
    end if;
  end if;
  if v_ld is not null and char_length(v_ld) > 500 then
    raise exception 'Lý do dài quá (tối đa 500 chữ)' using errcode = 'check_violation';
  end if;

  update kho_don_dat set
    trang_thai = 'huy',
    huy_luc    = now(),
    huy_boi    = (nhan_su_hien_tai()).id,
    ly_do_huy  = v_ld,
    phien_ban  = phien_ban + 1
  where id = p_id;

  return 'Đã hủy đơn ' || v_dd.so_phieu || '.';
end;
$$;

comment on function kho_huy_don_dat is
  'Hủy đơn đặt hàng (0039). Nháp: quyền nhap. Đã gửi / nhận một phần: nhap + duyet_nhap, bắt buộc lý do. Đã nhận đủ: không hủy. Phiếu nhận hàng đã gắn giữ nguyên.';


-- =============================================================================
-- 5 · ĐƠN ↔ PHIẾU NHẬN HÀNG
-- =============================================================================
-- Tính lại kg đã nhận từng dòng và trạng thái đơn. Đơn nháp / đã hủy: chỉ
-- cập nhật kg, không đổi trạng thái.
create or replace function kho_don_dat_tinh_nhan(p_don_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dd   kho_don_dat;
  v_so   int;
  v_du   int;
  v_co   int;
  v_moi  text;
begin
  select * into v_dd from kho_don_dat where id = p_don_id for update;
  if not found then
    return;
  end if;

  with nhan as (
    select pd.mat_hang_id, sum(pd.so_kg) as kg
    from kho_phieu_nhap p
    join kho_phieu_nhap_dong pd on pd.phieu_nhap_id = p.id
    where p.don_dat_id = p_don_id and p.trang_thai in ('cho_duyet', 'da_duyet')
    group by pd.mat_hang_id
  )
  update kho_don_dat_dong d
     set so_kg_da_nhan = coalesce(n.kg, 0)
    from kho_don_dat_dong d2
    left join nhan n on n.mat_hang_id = d2.mat_hang_id
   where d.id = d2.id and d2.don_dat_id = p_don_id
     and d.so_kg_da_nhan is distinct from coalesce(n.kg, 0);

  if v_dd.trang_thai not in ('da_gui', 'nhan_mot_phan', 'da_nhan') then
    return;
  end if;

  select count(*),
         count(*) filter (where kho_don_dat_dong_du(d.so_kg_dat, d.so_kg_da_nhan, d.so_goi_dat, g.goi)),
         count(*) filter (where d.so_kg_da_nhan > 0)
    into v_so, v_du, v_co
  from kho_don_dat_dong d
  left join lateral (
    select sum(pd.so_goi)::int as goi
    from kho_phieu_nhap p
    join kho_phieu_nhap_dong pd on pd.phieu_nhap_id = p.id
    where p.don_dat_id = p_don_id and p.trang_thai in ('cho_duyet', 'da_duyet')
      and pd.mat_hang_id = d.mat_hang_id
  ) g on true
  where d.don_dat_id = p_don_id;

  v_moi := case when v_so > 0 and v_du = v_so then 'da_nhan'
                when v_co > 0 then 'nhan_mot_phan'
                else 'da_gui' end;
  if v_moi <> v_dd.trang_thai then
    update kho_don_dat set trang_thai = v_moi, phien_ban = phien_ban + 1 where id = p_don_id;
  end if;
end;
$$;

comment on function kho_don_dat_tinh_nhan is
  'NỘI BỘ (0039). Ghi so_kg_da_nhan từng dòng đơn (phiếu gắn đơn đang chờ duyệt / đã duyệt) và đổi da_gui ⇄ nhan_mot_phan ⇄ da_nhan. Trigger phiếu nhập gọi.';

-- Trước khi ghi phiếu nhập có đơn: cùng chi nhánh, cùng NCC, phiếu mua.
create or replace function kho_phieu_nhap_kiem_don()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dd kho_don_dat;
begin
  if new.don_dat_id is null then
    return new;
  end if;
  select * into v_dd from kho_don_dat where id = new.don_dat_id;
  if not found or v_dd.chi_nhanh_id <> new.chi_nhanh_id then
    raise exception 'Đơn đặt hàng không thuộc chi nhánh này' using errcode = 'check_violation';
  end if;
  if new.loai <> 'mua' then
    raise exception 'Chỉ phiếu nhập mua mới gắn được với đơn đặt hàng' using errcode = 'check_violation';
  end if;
  if new.nha_cung_cap_id is distinct from v_dd.nha_cung_cap_id then
    raise exception 'Phiếu này nhận hàng theo đơn % — nhà cung cấp phải đúng nhà cung cấp của đơn', v_dd.so_phieu
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger kho_phieu_nhap_kiem_don_trigger
  before insert or update of don_dat_id, nha_cung_cap_id, chi_nhanh_id, loai on kho_phieu_nhap
  for each row execute function kho_phieu_nhap_kiem_don();

-- Sau khi phiếu đổi trạng thái (gửi, rút, duyệt, từ chối, hủy) → tính lại đơn.
create or replace function kho_phieu_nhap_cap_nhat_don()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.don_dat_id is not null then
    perform kho_don_dat_tinh_nhan(new.don_dat_id);
  end if;
  if tg_op = 'UPDATE' and old.don_dat_id is not null and old.don_dat_id is distinct from new.don_dat_id then
    perform kho_don_dat_tinh_nhan(old.don_dat_id);
  end if;
  return null;
end;
$$;

create trigger kho_phieu_nhap_cap_nhat_don_trigger
  after insert or update of trang_thai, don_dat_id on kho_phieu_nhap
  for each row execute function kho_phieu_nhap_cap_nhat_don();

-- "Nhận hàng theo đơn này": tạo phiếu nhận hàng NHÁP gắn đơn, điền sẵn mỗi món
-- còn thiếu một dòng (kg = kg đặt − kg đã nhận; số gói tương tự nếu đơn có số
-- gói). Thủ kho cân lại, sửa số rồi lưu / gửi như phiếu thường (0031).
--   · Đơn phải đã gửi / nhận một phần.
--   · Đơn đang có phiếu NHÁP gắn (chưa gửi) → trả phiếu đó, không tạo phiếu thứ
--     hai (bấm lại nút là mở lại phiếu đang làm dở).
--   · Cùng p_ma_gui → trả phiếu đã tạo.
--   · Nơi nhận: kho lạnh đầu tiên đang dùng (thủ kho đổi được ở màn nhận hàng).
--   · Hạn dùng: ngày nhận + hạn mặc định của món; món chưa cài hạn mặc định
--     thì tạm để hôm nay và ghi chú phiếu nhắc ghi hạn trên nhãn.
--   · Không chép đơn giá dự kiến: giá thật đọc từ hóa đơn lúc điền giá.
create or replace function kho_tao_phieu_nhap_tu_don(p_don_id uuid, p_ma_gui uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dd    kho_don_dat;
  v_ncc   kho_nha_cung_cap;
  v_id    uuid;
  v_vt    uuid;
  v_ngay  date := hom_nay_vn();
  v_thieu text;
  v_i     int := 0;
  r       record;
begin
  select * into v_dd from kho_don_dat where id = p_don_id;
  if not found or not kho_duoc(v_dd.chi_nhanh_id, 'nhap') then
    raise exception 'Không tìm thấy đơn, hoặc tài khoản không được nhận hàng'
      using errcode = 'insufficient_privilege';
  end if;

  select p.id into v_id from kho_phieu_nhap p where p.ma_gui = p_ma_gui;
  if found then
    if not exists (select 1 from kho_phieu_nhap p where p.id = v_id and p.don_dat_id = p_don_id) then
      raise exception 'Mã gửi đã dùng cho phiếu khác — tải lại trang' using errcode = 'check_violation';
    end if;
    return v_id;
  end if;
  if p_ma_gui is null then
    raise exception 'Thiếu mã chống gửi trùng — tải lại trang' using errcode = 'check_violation';
  end if;

  perform 1 from kho_cai_dat where chi_nhanh_id = v_dd.chi_nhanh_id for update;
  select * into v_dd from kho_don_dat where id = p_don_id for update;

  if v_dd.trang_thai not in ('da_gui', 'nhan_mot_phan') then
    raise exception 'Đơn % %', v_dd.so_phieu,
      case v_dd.trang_thai when 'nhap' then 'chưa gửi cho nhà cung cấp'
                           when 'da_nhan' then 'đã nhận đủ hàng'
                           else 'đã bị hủy' end
      using errcode = 'check_violation';
  end if;

  select p.id into v_id from kho_phieu_nhap p
  where p.don_dat_id = p_don_id and p.trang_thai = 'nhap'
  order by p.created_at desc limit 1;
  if found then
    return v_id;
  end if;

  select * into v_ncc from kho_nha_cung_cap where id = v_dd.nha_cung_cap_id;
  if not v_ncc.dang_dung then
    raise exception 'Nhà cung cấp % đã ngừng dùng', v_ncc.ten using errcode = 'check_violation';
  end if;
  select v.id into v_vt from kho_vi_tri v
  where v.chi_nhanh_id = v_dd.chi_nhanh_id and v.loai = 'kho' and v.dang_dung
  order by v.thu_tu, v.ten limit 1;
  if v_vt is null then
    raise exception 'Chi nhánh chưa có kho lạnh đang dùng' using errcode = 'check_violation';
  end if;

  insert into kho_phieu_nhap (chi_nhanh_id, so_phieu, ma_gui, loai, nha_cung_cap_id, vi_tri_id, ngay_nhap,
                              ghi_chu, nguoi_tao, don_dat_id)
  values (v_dd.chi_nhanh_id, kho_sinh_so(v_dd.chi_nhanh_id, 'PN'), p_ma_gui, 'mua', v_dd.nha_cung_cap_id, v_vt,
          v_ngay, 'Nhận theo đơn ' || v_dd.so_phieu, (nhan_su_hien_tai()).id, p_don_id)
  returning id into v_id;

  -- Chỉ dòng CHƯA ĐỦ (luật "đủ" ở đầu file): tảng đặt 12 kg đã về 11,6 kg là
  -- đủ — không điền dòng 0,4 kg bắt thủ kho xóa tay (hoặc lỡ gửi số không có thật).
  for r in
    select x.* from (
      select d.mat_hang_id, d.so_kg_dat, d.so_kg_da_nhan, d.so_goi_dat, d.thu_tu, m.ten, m.han_dung_ngay,
             coalesce((select sum(pd.so_goi) from kho_phieu_nhap p
                       join kho_phieu_nhap_dong pd on pd.phieu_nhap_id = p.id
                       where p.don_dat_id = p_don_id and p.trang_thai in ('cho_duyet', 'da_duyet')
                         and pd.mat_hang_id = d.mat_hang_id), 0)::int as goi_da_nhan
      from kho_don_dat_dong d
      join kho_mat_hang m on m.id = d.mat_hang_id
      where d.don_dat_id = p_don_id and d.so_kg_dat > d.so_kg_da_nhan and m.dang_dung
    ) x
    where not kho_don_dat_dong_du(x.so_kg_dat, x.so_kg_da_nhan, x.so_goi_dat, x.goi_da_nhan)
    order by x.thu_tu
  loop
    v_i := v_i + 1;
    insert into kho_phieu_nhap_dong (phieu_nhap_id, chi_nhanh_id, thu_tu, mat_hang_id, so_goi, so_kg, han_dung)
    values (v_id, v_dd.chi_nhanh_id, v_i, r.mat_hang_id,
            case when r.so_goi_dat is not null then greatest(r.so_goi_dat - r.goi_da_nhan, 0) else 0 end,
            r.so_kg_dat - r.so_kg_da_nhan,
            v_ngay + coalesce(r.han_dung_ngay, 0));
    if r.han_dung_ngay is null then
      v_thieu := concat_ws(', ', v_thieu, r.ten);
    end if;
  end loop;

  if v_i = 0 then
    raise exception 'Đơn % không còn món nào chờ giao', v_dd.so_phieu using errcode = 'check_violation';
  end if;
  if v_thieu is not null then
    update kho_phieu_nhap
       set ghi_chu = ghi_chu || '. Ghi hạn dùng theo nhãn cho: ' || v_thieu
     where id = v_id;
  end if;

  return v_id;
end;
$$;

comment on function kho_tao_phieu_nhap_tu_don is
  'Nhận hàng theo đơn (nhap; 0039): tạo phiếu nhận hàng nháp gắn đơn, mỗi món còn thiếu một dòng (kg / gói còn lại, hạn = hôm nay + hạn mặc định), không chép giá. Đơn đang có phiếu nháp → trả phiếu đó; cùng p_ma_gui → trả phiếu đã tạo. Trả id phiếu.';


-- =============================================================================
-- 6 · ĐỌC CHỈ KG — thủ kho (và mọi vai xem giá)
-- =============================================================================
-- p_trang_thai: null = mọi đơn; 'dang_cho' = đã gửi hoặc nhận một phần (đơn chờ
-- hàng về); còn lại = đúng trạng thái đó. p_tu / p_den lọc ngày lập đơn.
-- Tìm theo số đơn / tên NCC (như kho_ds_phieu_nhap_kg 0031).
create or replace function kho_ds_don_dat_kg(
  p_chi_nhanh_id    uuid,
  p_trang_thai      text,
  p_nha_cung_cap_id uuid,
  p_q               text,
  p_tu              date,
  p_den             date,
  p_cua_toi         boolean,
  p_gioi_han        int,
  p_bo_qua          int
)
returns table (
  id uuid, so_phieu text, trang_thai text, nha_cung_cap_id uuid, ten_nha_cung_cap text,
  ngay_dat date, ngay_giao_du_kien date, so_dong int, tong_kg_dat numeric, tong_kg_da_nhan numeric,
  tre_hen boolean, nguoi_lap uuid, ten_nguoi_lap text, gui_luc timestamptz, created_at timestamptz
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
  if not (kho_duoc(p_chi_nhanh_id, 'nhap') or kho_duoc(p_chi_nhanh_id, 'xem_gia')) then
    raise exception 'Tài khoản của bạn không xem được đơn đặt hàng ở chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := (nhan_su_hien_tai()).id;

  v_tim := nullif(btrim(coalesce(p_q, '')), '');
  if v_tim is not null then
    v_tim := '%' || replace(replace(replace(left(v_tim, 60), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  return query
    select d.id, d.so_phieu, d.trang_thai, d.nha_cung_cap_id, n.ten,
           d.ngay_dat, d.ngay_giao_du_kien,
           coalesce(x.so_dong, 0)::int, coalesce(x.kg_dat, 0)::numeric, coalesce(x.kg_nhan, 0)::numeric,
           (d.trang_thai in ('da_gui', 'nhan_mot_phan') and d.ngay_giao_du_kien < hom_nay_vn()),
           d.nguoi_lap, ns.ho_ten, d.gui_luc, d.created_at
    from kho_don_dat d
    join kho_nha_cung_cap n on n.id = d.nha_cung_cap_id
    left join nhan_su ns on ns.id = d.nguoi_lap
    left join lateral (
      select count(*) as so_dong, sum(dd.so_kg_dat) as kg_dat, sum(dd.so_kg_da_nhan) as kg_nhan
      from kho_don_dat_dong dd where dd.don_dat_id = d.id
    ) x on true
    where d.chi_nhanh_id = p_chi_nhanh_id
      and (p_trang_thai is null
           or (p_trang_thai = 'dang_cho' and d.trang_thai in ('da_gui', 'nhan_mot_phan'))
           or d.trang_thai = p_trang_thai)
      and (p_nha_cung_cap_id is null or d.nha_cung_cap_id = p_nha_cung_cap_id)
      and (p_tu is null or d.ngay_dat >= p_tu)
      and (p_den is null or d.ngay_dat <= p_den)
      and (not coalesce(p_cua_toi, false) or d.nguoi_lap = v_nv)
      and (v_tim is null or d.so_phieu ilike v_tim or n.ten ilike v_tim)
    order by d.ngay_dat desc, d.created_at desc, d.id
    limit least(greatest(coalesce(p_gioi_han, 30), 1), 200)
    offset greatest(coalesce(p_bo_qua, 0), 0);
end;
$$;

comment on function kho_ds_don_dat_kg is
  'Danh sách đơn đặt hàng CHỈ KG (nhap hoặc xem_gia; 0039): lọc trạng thái (''dang_cho'' = da_gui + nhan_mot_phan), NCC, ngày lập, của tôi, tìm số đơn / tên NCC, chia trang. Không trả tiền.';

create or replace function kho_doc_don_dat_kg(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_dd kho_don_dat;
begin
  select * into v_dd from kho_don_dat where id = p_id;
  if not found or not (kho_duoc(v_dd.chi_nhanh_id, 'nhap') or kho_duoc(v_dd.chi_nhanh_id, 'xem_gia')) then
    raise exception 'Không tìm thấy đơn đặt hàng, hoặc tài khoản không được xem'
      using errcode = 'insufficient_privilege';
  end if;

  return jsonb_build_object(
    'id',                v_dd.id,
    'so_phieu',          v_dd.so_phieu,
    'trang_thai',        v_dd.trang_thai,
    'phien_ban',         v_dd.phien_ban,
    'nha_cung_cap_id',   v_dd.nha_cung_cap_id,
    'ten_nha_cung_cap',  (select n.ten from kho_nha_cung_cap n where n.id = v_dd.nha_cung_cap_id),
    'ngay_dat',          v_dd.ngay_dat,
    'ngay_giao_du_kien', v_dd.ngay_giao_du_kien,
    'tre_hen',           v_dd.trang_thai in ('da_gui', 'nhan_mot_phan') and v_dd.ngay_giao_du_kien < hom_nay_vn(),
    'ghi_chu',           v_dd.ghi_chu,
    'nguoi_lap',         v_dd.nguoi_lap,
    'ten_nguoi_lap',     (select ns.ho_ten from nhan_su ns where ns.id = v_dd.nguoi_lap),
    'gui_luc',           v_dd.gui_luc,
    'gui_boi',           v_dd.gui_boi,
    'ten_nguoi_gui',     (select ns.ho_ten from nhan_su ns where ns.id = v_dd.gui_boi),
    'huy_luc',           v_dd.huy_luc,
    'ly_do_huy',         v_dd.ly_do_huy,
    'created_at',        v_dd.created_at,
    'dong', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id',            d.id,
               'thu_tu',        d.thu_tu,
               'mat_hang_id',   d.mat_hang_id,
               'ma',            m.ma,
               'ten_mat_hang',  m.ten,
               'dem_goi',       m.dem_goi,
               'don_vi_goi',    m.don_vi_goi,
               'so_kg_dat',     d.so_kg_dat,
               'so_goi_dat',    d.so_goi_dat,
               'so_kg_da_nhan', d.so_kg_da_nhan,
               'so_kg_con_lai', greatest(d.so_kg_dat - d.so_kg_da_nhan, 0),
               -- Dòng đã "đủ" (≥ 95% kg hoặc đủ số gói — đầu file): web hiện ✓
               -- thay cho "còn thiếu 0,4 kg".
               'du',            kho_don_dat_dong_du(d.so_kg_dat, d.so_kg_da_nhan, d.so_goi_dat, g.goi))
             order by d.thu_tu, d.id)
      from kho_don_dat_dong d
      join kho_mat_hang m on m.id = d.mat_hang_id
      left join lateral (
        select sum(pd.so_goi)::int as goi
        from kho_phieu_nhap p
        join kho_phieu_nhap_dong pd on pd.phieu_nhap_id = p.id
        where p.don_dat_id = p_id and p.trang_thai in ('cho_duyet', 'da_duyet')
          and pd.mat_hang_id = d.mat_hang_id
      ) g on true
      where d.don_dat_id = p_id), '[]'::jsonb),
    'phieu', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id',         p.id,
               'so_phieu',   p.so_phieu,
               'trang_thai', p.trang_thai,
               'ngay_nhap',  p.ngay_nhap,
               'tong_kg',    (select coalesce(sum(pd.so_kg), 0) from kho_phieu_nhap_dong pd where pd.phieu_nhap_id = p.id))
             order by p.ngay_nhap, p.created_at)
      from kho_phieu_nhap p
      where p.don_dat_id = p_id), '[]'::jsonb));
end;
$$;

comment on function kho_doc_don_dat_kg is
  'Một đơn đặt hàng CHỈ KG (nhap hoặc xem_gia; 0039): đầu đơn, dòng (kg / gói đặt, kg đã nhận, còn lại, du = đã đủ), phiếu nhận hàng đã gắn. Không trả đơn giá dự kiến.';

-- Thay thân kho_doc_phieu_nhap_kg (0035, cùng chữ ký): chép nguyên văn, thêm
-- khóa don_dat (null khi phiếu không theo đơn) để màn nhận hàng hiện cột "Đặt".
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
-- 7 · GỢI Ý ĐẶT HÀNG (không tiền)
-- =============================================================================
-- Mỗi mặt hàng đang dùng mà NHÀ CUNG CẤP MUA GẦN NHẤT ở chi nhánh này là p_ncc
-- (phiếu mua chờ duyệt / đã duyệt mới nhất). p_ncc null = mọi mặt hàng đã từng
-- mua, kèm NCC gần nhất. (Chưa có cột "NCC chính" — món chưa từng mua thì thêm
-- tay trên màn đặt hàng.)
--
-- CÔNG THỨC (kg):
--   con_kg      = tồn ở kho lạnh + quầy (lô còn hạn)
--               + đang mang ra quầy (vị trí dang_chuyen, 0032)
--               + đã đặt chưa về (đơn da_gui / nhan_mot_phan của chi nhánh, mọi
--                 NCC: kg đặt − kg đã nhận, không âm; đơn nháp không tính)
--   dung_28     = kg rời kho 28 ngày gần nhất (hôm nay − 27 → hôm nay) theo sổ:
--                 bán + xuất bếp + hủy + xuất khác + pha lóc (tảng đem pha),
--                 trừ phần đảo ngược. Không tính chuyển kho ↔ quầy, trả NCC,
--                 kiểm kê.
--   dung_tb     = dung_28 ÷ 28
--   muc_can     = kho_toi_da_kg nếu có, không thì dung_tb × (số ngày giao + 3)
--                 (3 ngày dự phòng; số ngày giao của NCC, mặc định 1)
--   de_nghi_kg  = max(0, muc_can − con_kg), làm tròn LÊN 0,1 kg
--   de_nghi_goi = món đếm gói: de_nghi_kg ÷ kg TB một gói (dòng nhập 180 ngày),
--                 làm tròn lên; chưa có số liệu → null
--   duoi_toi_thieu = có kho_toi_thieu_kg và con_kg < kho_toi_thieu_kg
create or replace function kho_goi_y_dat_hang(p_chi_nhanh_id uuid, p_ncc uuid)
returns table (
  mat_hang_id uuid, ma text, ten text, loai text, dem_goi boolean, don_vi_goi text,
  nha_cung_cap_id uuid, so_ngay_giao int,
  ton_kg numeric, dang_chuyen_kg numeric, dang_dat_kg numeric,
  dung_28_ngay_kg numeric, dung_tb_ngay_kg numeric,
  kho_toi_thieu_kg numeric, kho_toi_da_kg numeric,
  muc_can_kg numeric, de_nghi_kg numeric, de_nghi_goi int, duoi_toi_thieu boolean,
  ly_do text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hom_nay date := hom_nay_vn();
begin
  if not (kho_duoc(p_chi_nhanh_id, 'nhap') or kho_duoc(p_chi_nhanh_id, 'xem_gia')) then
    raise exception 'Tài khoản của bạn không xem được gợi ý đặt hàng ở chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;

  return query
  with gan_nhat as (
    select distinct on (pd.mat_hang_id) pd.mat_hang_id, p.nha_cung_cap_id
    from kho_phieu_nhap p
    join kho_phieu_nhap_dong pd on pd.phieu_nhap_id = p.id
    where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua'
      and p.trang_thai in ('cho_duyet', 'da_duyet') and p.nha_cung_cap_id is not null
    order by pd.mat_hang_id, p.ngay_nhap desc, p.created_at desc
  ),
  mon as (
    select m.*, g.nha_cung_cap_id as ncc_id, coalesce(n.so_ngay_giao, 1) as ngay_giao
    from kho_mat_hang m
    join gan_nhat g on g.mat_hang_id = m.id
    left join kho_nha_cung_cap n on n.id = g.nha_cung_cap_id
    where m.dang_dung and (p_ncc is null or g.nha_cung_cap_id = p_ncc)
  ),
  ton as (
    select t.mat_hang_id,
           coalesce(sum(t.so_kg) filter (where v.loai in ('kho', 'quay')), 0) as kg,
           coalesce(sum(t.so_kg) filter (where v.loai = 'dang_chuyen'), 0) as di_duong
    from kho_ton t
    join kho_vi_tri v on v.id = t.vi_tri_id
    join kho_lo l on l.id = t.lo_id
    where t.chi_nhanh_id = p_chi_nhanh_id and t.mat_hang_id in (select id from mon)
      and l.han_dung >= v_hom_nay and t.so_kg > 0
    group by t.mat_hang_id
  ),
  dat as (
    select dd.mat_hang_id, sum(greatest(dd.so_kg_dat - dd.so_kg_da_nhan, 0)) as kg
    from kho_don_dat_dong dd
    join kho_don_dat d on d.id = dd.don_dat_id
    where d.chi_nhanh_id = p_chi_nhanh_id and d.trang_thai in ('da_gui', 'nhan_mot_phan')
    group by dd.mat_hang_id
  ),
  dung as (
    select s.mat_hang_id, -sum(s.so_kg) as kg
    from kho_so_cai s
    left join kho_so_cai g on g.id = s.dao_cua
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay between v_hom_nay - 27 and v_hom_nay
      and s.mat_hang_id in (select id from mon)
      and coalesce(g.loai, s.loai) in ('ban', 'xuat_bep', 'huy', 'xuat_khac', 'pha_loc_vao')
    group by s.mat_hang_id
  ),
  kg_goi as (
    select pd.mat_hang_id, sum(pd.so_kg) / nullif(sum(pd.so_goi), 0) as kg
    from kho_phieu_nhap_dong pd
    join kho_phieu_nhap p on p.id = pd.phieu_nhap_id
    where p.chi_nhanh_id = p_chi_nhanh_id and p.trang_thai = 'da_duyet'
      and p.ngay_nhap >= v_hom_nay - 180 and pd.so_goi > 0
    group by pd.mat_hang_id
  ),
  tinh as (
    select m.id, m.ma, m.ten, m.loai, m.dem_goi, m.don_vi_goi, m.ncc_id, m.ngay_giao,
           m.kho_toi_thieu_kg as toi_thieu, m.kho_toi_da_kg as toi_da, m.thu_tu,
           coalesce(t.kg, 0) as ton_kg, coalesce(t.di_duong, 0) as di_duong,
           coalesce(d.kg, 0) as dat_kg,
           greatest(coalesce(u.kg, 0), 0) as dung_28,
           round(greatest(coalesce(u.kg, 0), 0) / 28, 3) as tb,
           kg.kg as kg_moi_goi
    from mon m
    left join ton t on t.mat_hang_id = m.id
    left join dat d on d.mat_hang_id = m.id
    left join dung u on u.mat_hang_id = m.id
    left join kg_goi kg on kg.mat_hang_id = m.id
  ),
  kq as (
    select x.*,
           x.ton_kg + x.di_duong + x.dat_kg as con_kg,
           coalesce(x.toi_da, round(x.tb * (x.ngay_giao + 3), 3)) as muc_can
    from tinh x
  ),
  kq2 as (
    select k.*,
           round(ceil(greatest(k.muc_can - k.con_kg, 0) * 10) / 10, 1) as de_nghi,
           (k.toi_thieu is not null and k.con_kg < k.toi_thieu) as duoi
    from kq k
  )
  select k.id, k.ma, k.ten, k.loai, k.dem_goi, k.don_vi_goi, k.ncc_id, k.ngay_giao,
         k.ton_kg, k.di_duong, k.dat_kg, k.dung_28, k.tb, k.toi_thieu, k.toi_da,
         k.muc_can, k.de_nghi,
         case when k.dem_goi and k.de_nghi > 0 and k.kg_moi_goi > 0
              then ceil(k.de_nghi / k.kg_moi_goi)::int end,
         k.duoi,
         case
           when k.toi_da is null and k.dung_28 = 0 then
             'Chưa bán / dùng trong 28 ngày qua và chưa cài mức tối đa kho lạnh — tự quyết số đặt'
             || case when k.con_kg > 0 then ' (đang có ' || kho_so_chu(k.con_kg) || ' kg)' else '' end
           else
             'Cần ' || kho_so_chu(k.muc_can) || ' kg ('
             || case when k.toi_da is not null then 'mức tối đa kho lạnh'
                     else 'dùng TB ' || kho_so_chu(k.tb) || ' kg/ngày × ' || (k.ngay_giao + 3) || ' ngày: '
                          || k.ngay_giao || ' ngày chờ hàng + 3 ngày dự phòng' end
             || '); đang có ' || kho_so_chu(k.ton_kg) || ' kg'
             || case when k.di_duong > 0 then ', đang mang ra quầy ' || kho_so_chu(k.di_duong) || ' kg' else '' end
             || case when k.dat_kg > 0 then ', đã đặt chưa về ' || kho_so_chu(k.dat_kg) || ' kg' else '' end
             || case when k.de_nghi > 0 then ' → nên đặt ' || kho_so_chu(k.de_nghi) || ' kg'
                     else ' → chưa cần đặt' end
         end
         || case when k.duoi then '. Dưới mức tối thiểu ' || kho_so_chu(k.toi_thieu) || ' kg!' else '' end
  from kq2 k
  order by (k.de_nghi > 0) desc, k.duoi desc, k.loai, k.thu_tu, k.ten;
end;
$$;

comment on function kho_goi_y_dat_hang is
  'Gợi ý đặt hàng (nhap hoặc xem_gia; 0039; không tiền): món có NCC mua gần nhất = p_ncc (null = mọi món đã từng mua). de_nghi_kg = max(0, (kho_toi_da_kg hoặc dùng TB 28 ngày × (số ngày giao + 3)) − (tồn kho + quầy + đang mang ra quầy + đã đặt chưa về)), làm tròn lên 0,1 kg. Dùng = bán + xuất bếp + hủy + xuất khác + pha lóc. ly_do là câu giải thích một dòng.';


-- =============================================================================
-- 8 · ĐÁNH GIÁ NHÀ CUNG CẤP
-- =============================================================================
-- Theo phiếu mua ĐÃ DUYỆT có ngày nhập trong kỳ (không gồm nợ đầu kỳ) và đơn
-- đặt có ngày giao dự kiến trong kỳ:
--   so_phieu, tong_kg      số phiếu, tổng kg nhận
--   gia_tb_kg              tiền hàng ÷ kg (không thuế, chi phí) — CHỈ xem_gia
--   thu_hoi_tb_pt          thu hồi TB của phiên pha lóc đã chốt trong kỳ, tính
--                          theo kg tảng của NCC đem pha (bình quân gia quyền)
--   so_phien_pha           số phiên pha có tảng của NCC
--   kg_tra                 kg trả NCC (phiếu trả hàng trong kỳ)
--   so_lan_lech_hoa_don    phiếu đã đối chiếu mà tiền hóa đơn ≠ tổng phiếu — CHỈ xem_gia
--   so_ngay_tra_tb         ngày trả tiền TB từ ngày hóa đơn (ngày nhập nếu
--                          không có), bình quân theo số tiền — CHỈ xem_gia
--   so_don                 đơn đã gửi (không nháp) có ngày giao dự kiến trong kỳ
--   so_don_thieu, kg_thieu đơn đã có hàng về nhưng còn dòng chưa đủ (luật "đủ"
--                          ở đầu file) và đã hủy hoặc đã qua ngày giao dự kiến
--   so_don_tre             đơn có phiếu nhận đầu tiên sau ngày giao dự kiến,
--                          hoặc chưa nhận gì mà đã qua ngày giao (chưa hủy)
--   diem_sao (1–5, bước 0,5) = 5 − 2 × (đơn thiếu ÷ số đơn) − 1 × (đơn trễ ÷ số đơn)
--                           − 1 × (phiếu lệch hóa đơn ÷ số phiếu)
--                           − min(1, 10 × kg trả ÷ kg nhận)
--                          không có đơn thì bỏ hai phần đơn; không có phiếu thì
--                          bỏ hai phần phiếu; không có cả hai → null.
create or replace function kho_bao_cao_ncc(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  nha_cung_cap_id uuid, ten text,
  so_phieu int, tong_kg numeric, gia_tb_kg bigint,
  thu_hoi_tb_pt numeric, so_phien_pha int, kg_tra numeric,
  so_lan_lech_hoa_don int, so_ngay_tra_tb numeric,
  so_don int, so_don_thieu int, kg_thieu numeric, so_don_tre int,
  diem_sao numeric
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
           coalesce(o.tre, 0) as tre
    from kho_nha_cung_cap n
    left join pn_ncc a on a.ncc = n.id
    left join pha h on h.ncc = n.id
    left join tra_hang r on r.ncc = n.id
    left join tra_tien tt on tt.ncc = n.id
    left join don_ncc o on o.ncc = n.id
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
         end
  from ds
  order by ds.kg desc, ds.ten;
end;
$$;

comment on function kho_bao_cao_ncc is
  'Đánh giá nhà cung cấp (nhap hoặc xem_gia; 0039): theo phiếu mua đã duyệt trong kỳ và đơn đặt có ngày giao trong kỳ — số phiếu, kg, giá TB/kg, thu hồi pha lóc TB, kg trả, số lần lệch hóa đơn, số ngày trả tiền TB, đơn giao thiếu / trễ, điểm sao 1–5 (công thức ở migration). gia_tb_kg, so_lan_lech_hoa_don, so_ngay_tra_tb chỉ vai xem_gia, không thì null.';


-- =============================================================================
-- 9 · SỰ KIỆN VÀ SỐ ĐỎ — thay THÂN (cùng chữ ký), chép 0038, thêm 0039
-- =============================================================================
--   don_dat_tre  nhac_nho  quản lý, chủ (duyet): đơn da_gui (chưa nhận chút nào)
--                          đã qua ngày giao dự kiến — xem đầu file.
-- Số đỏ mới: don_dat_tre.
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

    -- ipos_mat_ket_noi: phu = 'loi' (lượt cuối lỗi) | 'cham' (> 30 phút trong giờ
    -- mở cửa); so = số phút từ lần đồng bộ tốt cuối.
    return query
      select 'ipos_mat_ket_noi', 'he_thong', null::uuid, null::uuid, null::text, null::text,
             coalesce(case when c.loi_tu_luc is not null then 'loi' end, 'cham'),
             round(extract(epoch from now() - coalesce(c.lan_ok_luc, c.bat_luc, c.updated_at)) / 60)::numeric,
             case when c.loi_tu_luc is not null then c.loi_tu_luc
                  else coalesce(c.lan_ok_luc, c.bat_luc, c.updated_at) + interval '30 minutes' end
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
  'NỘI BỘ. 0037: thêm ipos_cho_xu_ly, ipos_mat_ket_noi. 0038: thêm dinh_muc_lech. 0039: thêm don_dat_tre. Mọi sự kiện thông báo người đang đăng nhập được thấy ở một chi nhánh, suy ra từ chứng từ. Gọi qua kho_dem_viec / kho_thong_bao.';

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
  v_dinh_muc int;
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
                            and (v_xem_luc is null or e.luc > v_xem_luc)),
         count(*) filter (where e.khoa = 'dinh_muc_lech')
    into v_duoi_muc, v_chua_dem, v_chua_doc, v_dinh_muc
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

  -- 0032: mang hàng ra quầy.
  if kho_duoc(p_chi_nhanh_id, 'van_hanh') and not v_chi_quay then
    v := v || jsonb_build_object('yeu_cau_quay', (
      select count(*) from kho_yeu_cau_quay y
      where y.chi_nhanh_id = p_chi_nhanh_id and y.trang_thai = 'cho'));
  end if;
  if v_chi_quay or kho_duoc(p_chi_nhanh_id, 'duyet') then
    v := v || (
      select jsonb_build_object(
        'hang_dang_chuyen',    count(*),
        'hang_chuyen_qua_gio', count(*) filter (where x.created_at <= now() - make_interval(hours => v_cd.gio_nhac_chuyen)))
      from kho_phieu_xuat x
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'chuyen' and x.trang_thai = 'dang_chuyen');
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
                        where chi_nhanh_id = p_chi_nhanh_id and trang_thai = 'cho_duyet'),
      'chuyen_nhan_thieu', (select count(*) from kho_phieu_xuat
                            where chi_nhanh_id = p_chi_nhanh_id and loai = 'chuyen' and trang_thai = 'nhan_thieu'),
      -- 0033
      'thu_hoi_thap', (select count(*) from kho_phien_pha
                       where chi_nhanh_id = p_chi_nhanh_id and trang_thai = 'da_chot'
                         and thu_hoi_thap and da_xem_luc is null),
      -- 0037
      'ipos_cho_xu_ly', (select count(*) from kho_ipos_dong
                         where chi_nhanh_id = p_chi_nhanh_id and trang_thai in ('chua_khop', 'thieu_hang')),
      -- 0038: số mặt hàng bếp nhận lệch định mức 7 ngày (đếm từ kho_su_kien ở trên)
      'dinh_muc_lech', v_dinh_muc,
      -- 0039: đơn đặt hàng đã gửi, quá ngày giao mà chưa nhận chút nào
      'don_dat_tre', (select count(*) from kho_don_dat
                      where chi_nhanh_id = p_chi_nhanh_id and trang_thai = 'da_gui'
                        and ngay_giao_du_kien < v_hom_nay));
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
  'Mọi số đỏ trên menu kho của người đang đăng nhập ở một chi nhánh, trong MỘT lần gọi. Khóa nào không có quyền thì vắng mặt. Chỉ đếm, không tiền. duyet_nhap theo quyền duyet_nhap (0031); yeu_cau_quay, hang_dang_chuyen, hang_chuyen_qua_gio, chuyen_nhan_thieu (0032); thu_hoi_thap (0033); ipos_cho_xu_ly (0037); dinh_muc_lech (0038); don_dat_tre (0039).';



-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_so_chu(numeric) from authenticated';
    execute 'revoke execute on function kho_ngay_giao_mac_dinh(uuid, date) from authenticated';
    execute 'revoke execute on function kho_don_dat_dong_du(numeric, numeric, int, int) from authenticated';
    execute 'revoke execute on function kho_don_dat_tinh_nhan(uuid) from authenticated';
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
