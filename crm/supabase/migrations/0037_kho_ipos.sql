-- =============================================================================
-- BEEFTOWN KHO — 0037 · ĐỒNG BỘ BÁN HÀNG iPOS (GĐ7a)
-- =============================================================================
-- Chủ nhà hàng đã chốt (GĐ7a): máy bán hàng iPOS là nơi ghi BÁN. Kho tự trừ
-- theo từng hóa đơn iPOS, 5 phút một lượt; quầy không còn "thiếu = đã bán".
--
-- AI CHẠY ĐỒNG BỘ — tài khoản máy may_ipos (0029), MỘT việc mới dong_bo_ban
--   · dong_bo_ban = chu_so_huu, quan_ly, may_ipos. Vai may_ipos CHỈ có việc
--     này: không xem, không xem giá, không đọc bảng nào (test-kho-quyen kiểm).
--   · Cron của Worker đăng nhập bằng tài khoản máy (bí mật KHO_IPOS_EMAIL /
--     KHO_IPOS_MAT_KHAU); quản lý bấm "Cập nhật ngay" thì chạy bằng phiên của
--     chính quản lý. Không service_role.
--   · TOKEN iPOS KHÔNG BAO GIỜ VÀO DATABASE: nó là bí mật Worker
--     IPOS_ACCESS_TOKEN. kho_ipos_luu_cau_hinh từ chối mọi khóa / giá trị có chữ
--     "token"; kho_ipos_ket_thuc xóa "access_token=…" khỏi câu lỗi trước khi lưu.
--
-- MỘT LƯỢT (web/src/lib/kho/ipos-dong-bo.ts):
--   1. kho_ipos_bat_dau(cn, 'cron'|'tay') → khóa lượt + cửa sổ thời gian
--      (watermark − 15 phút chồng lấn, không trước mốc chuyển).
--   2. Worker gọi iPOS, đọc JSON (lib/kho/ipos.ts), gửi từng lô ≤ 200 HĐ:
--      kho_ipos_nhan(cn, lan_id, [HĐ...], den_luc | null).
--      den_luc CHỈ gửi ở lô cuối — lô giữa gửi null (watermark chưa tiến).
--   3. kho_ipos_ket_thuc(lan_id, lỗi | null) → nhả khóa, ghi nhật ký.
--
-- HỘP THƯ TRƯỚC, GHI SỔ SAU — không bao giờ mất / chặn một lần bán
--   · kho_ipos_hoa_don (unique chi nhánh + mã HĐ, băm nội dung) và
--     kho_ipos_dong (unique HĐ + khóa dòng). HĐ trùng mã cùng băm = bỏ qua; băm
--     khác (HĐ sửa trên iPOS) = đảo ngược dòng đã ghi rồi ghi lại; HĐ hủy =
--     đảo ngược, dòng → da_huy.
--   · Ghi từng dòng trong khối con riêng (kho_ipos_ghi_dong): lỗi một dòng →
--     'loi', không hỏng lô. Dòng cho / thieu_hang / chua_khop TỰ THỬ LẠI mỗi lượt
--     (lý do thường gặp: giấy tờ đi sau thực tế — pha lóc chưa chốt, hàng đang
--     mang ra chưa bấm nhận).
--
-- LUẬT GHI MỘT DÒNG (kho_ipos_ghi_dong)
--   · Chưa chuyển sang iPOS (nguon_so_ban <> 'ipos' hoặc chưa có mốc) → để
--     'cho' (chờ, không đếm vào việc). Bán TRƯỚC mốc ipos_tu_luc → bo_qua (đã
--     tính trong lần đếm quầy cuối).
--   · Khớp món: kho_ipos_ma_hang theo mã iPOS (kieu mon = món cố định; goi_can =
--     món cân nhãn, món thật đọc từ mã cân trên nhãn; bo_qua = không phải hàng
--     kho), rồi tới mã cân. MÃ CÂN: DATABASE tự giải từ mã vạch thô (ma_vach)
--     bằng kho_doc_ma_vach theo mẫu trong Cài đặt — như kho_quet_kiem_ke (0032).
--     Web có gửi ma_can thì dùng ma_can đó trước. kg trên nhãn: so_kg của dòng,
--     thiếu thì lấy kg giải từ nhãn.
--   · Vị trí = quầy bán (kho_ipos_cau_hinh.vi_tri_ban_id). FEFO qua kho_phan_bo:
--     lô còn hạn trước, thiếu thì cho lấy lô hết hạn (cờ lo_het_han).
--   · Món đếm gói: 1 nhãn = 1 gói; kg nhãn ≠ kg sổ → dòng hao_hut (lệch cân)
--     rồi dòng ban đúng kg nhãn — lô về đúng 0 gói 0 kg khi bán gói cuối.
--   · Ngày sổ = ngày BÁN giờ Việt Nam (bán 23:50, đồng bộ 00:10 → ngày hôm trước).
--   · chung_tu_loai 'ban_hang', chung_tu_id = id dòng iPOS.
--   · Thiếu hàng mà có phiếu mang ra quầy (dang_chuyen, 0032) chứa món đó → tự
--     nhận ĐỦ phiếu đó (máy thay NV quầy bấm "Đã nhận đủ") rồi ghi. Vẫn thiếu →
--     thieu_hang. KHÔNG BAO GIỜ raise ra ngoài.
--
-- KIỂM KÊ QUẦY KHI NGUỒN iPOS (thay thân, cùng chữ ký, chép 0032):
--   · kho_gui_kiem_ke từ chối khi đồng bộ đang bật cho quầy đó mà watermark cũ
--     hơn 10 phút (số bán chưa mới thì chụp sổ ra thừa giả).
--   · kho_duyet_kiem_ke từ chối khi còn dòng thieu_hang / chua_khop của quầy đó
--     bán trước lúc gửi.
--
-- SỰ KIỆN (thay thân kho_su_kien / kho_dem_viec, chép 0033):
--   ipos_cho_xu_ly    nhac_nho  quản lý, chủ: số dòng chua_khop + thieu_hang.
--   ipos_mat_ket_noi  he_thong  quản lý, chủ: lần cuối lỗi, hoặc > 30 phút không
--                               đồng bộ được trong giờ mở cửa.
--   Số đỏ mới: ipos_cho_xu_ly.
--
-- BÁO CÁO: kho_bao_cao_ban_thuc (invoker) — doanh thu THẬT từ dòng iPOS đã
-- ghi; hàng bán ghi từ kiểm kê quầy (trước mốc) vẫn là "ước tính". Hàm cũ
-- kho_bao_cao_ban giữ nguyên.
-- =============================================================================


-- =============================================================================
-- 1 · BẢNG TRA QUYỀN — thêm dong_bo_ban
-- =============================================================================
-- Chép nguyên văn 0034, thêm một dòng. web/src/lib/kho/chung.ts soi gương;
-- test-kho-quyen.mjs so từng dòng.
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
    -- 0034: tài khoản của máy tính bảng dùng chung. Chỉ gọi được hàm kho_may_*.
    when 'may_chung'   then array['may_chung']
    -- 0037: đồng bộ bán hàng iPOS. Máy may_ipos CHỈ có việc này.
    when 'dong_bo_ban' then array['chu_so_huu','quan_ly','may_ipos']
    else array[]::text[]
  end)::vai_tro[];
$$;

comment on function kho_vai_duoc is
  'Bảng tra quyền kho: việc → danh sách vai. Nguồn sự thật duy nhất; lib/kho/chung.ts soi gương và test-kho-quyen.mjs so khớp. 0031: thủ kho không còn xem_gia; thêm duyet_nhap. 0034: thêm may_chung (chỉ vai may_chung). 0037: thêm dong_bo_ban (chủ, quản lý, may_ipos).';


-- =============================================================================
-- 2 · BẢNG
-- =============================================================================
-- Cấu hình kết nối, 1 dòng / chi nhánh. KHÔNG có token — token là bí mật Worker.
create table kho_ipos_cau_hinh (
  chi_nhanh_id      uuid primary key references chi_nhanh(id) on delete cascade,
  bat               boolean not null default false,
  api_url           text not null default 'https://apitest.foodbook.vn/ipos/ws/xpartner',
  pos_parent        text,
  pos_id            text,
  duong_dan_hoa_don text,
  vi_tri_ban_id     uuid references kho_vi_tri(id) on delete set null,
  gio_mo_cua        smallint not null default 10,
  gio_dong_cua      smallint not null default 23,
  ipos_tu_luc       timestamptz,
  dong_bo_den_luc   timestamptz,
  dang_chay_tu      timestamptz,
  lan_dang_chay     uuid,
  lan_cuoi_luc      timestamptz,
  lan_cuoi_loi      text,
  lan_ok_luc        timestamptz,
  loi_tu_luc        timestamptz,
  bat_luc           timestamptz,
  nguoi_sua         uuid references nhan_su(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint kho_ipos_cau_hinh_url_hop_le check (
    api_url ~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/[A-Za-z0-9._~/-]*)?$' and api_url !~* 'token'),
  constraint kho_ipos_cau_hinh_duong_dan_hop_le check (
    duong_dan_hoa_don is null or (duong_dan_hoa_don ~ '^/?[A-Za-z0-9._~/-]{1,200}$' and duong_dan_hoa_don !~* 'token')),
  constraint kho_ipos_cau_hinh_pos_hop_le check (
    (pos_parent is null or pos_parent ~ '^[A-Za-z0-9_.-]{1,60}$')
    and (pos_id is null or pos_id ~ '^[A-Za-z0-9_.-]{1,60}$')),
  constraint kho_ipos_cau_hinh_gio_hop_le check (
    gio_mo_cua between 0 and 23 and gio_dong_cua between 1 and 24 and gio_mo_cua < gio_dong_cua),
  constraint kho_ipos_cau_hinh_loi_ngan check (lan_cuoi_loi is null or char_length(lan_cuoi_loi) <= 300)
);

create trigger kho_ipos_cau_hinh_updated_at
  before update on kho_ipos_cau_hinh
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_ipos_cau_hinh is
  'Kết nối iPOS của một chi nhánh (0037). KHÔNG chứa token — token là bí mật Worker IPOS_ACCESS_TOKEN. Ghi qua kho_ipos_luu_cau_hinh / kho_ipos_chuyen_sang / kho_ipos_tro_ve và các hàm của lượt đồng bộ.';
comment on column kho_ipos_cau_hinh.duong_dan_hoa_don is
  'Đường dẫn endpoint lấy hóa đơn, nối sau api_url. Trống = chưa cấu hình (chờ tài liệu API iPOS).';
comment on column kho_ipos_cau_hinh.vi_tri_ban_id is 'Quầy bán — hàng bán trên iPOS trừ ở vị trí này.';
comment on column kho_ipos_cau_hinh.ipos_tu_luc is
  'Mốc chuyển sang trừ kho theo iPOS. Bán trước mốc = đã tính trong lần đếm quầy cuối → bỏ qua.';
comment on column kho_ipos_cau_hinh.dong_bo_den_luc is 'Watermark: iPOS đã được đọc hết tới lúc này.';
comment on column kho_ipos_cau_hinh.dang_chay_tu is 'Khóa lượt: đang có lượt chạy từ lúc này. Quá 10 phút coi như lượt đó hỏng.';
comment on column kho_ipos_cau_hinh.lan_ok_luc is 'Lần cuối một lượt kết thúc không lỗi.';
comment on column kho_ipos_cau_hinh.loi_tu_luc is 'Bắt đầu chuỗi lượt lỗi liên tiếp (null = lượt cuối không lỗi).';

-- Ghép mã món iPOS với món trong kho, theo chi nhánh.
create table kho_ipos_ma_hang (
  id           uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete cascade,
  ma_ipos      text not null,
  ten_ipos     text,
  kieu         text not null,
  mat_hang_id  uuid references kho_mat_hang(id) on delete restrict,
  nguoi_sua    uuid references nhan_su(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint kho_ipos_ma_hang_duy_nhat unique (chi_nhanh_id, ma_ipos),
  constraint kho_ipos_ma_hang_kieu_hop_le check (kieu in ('goi_can', 'mon', 'bo_qua')),
  constraint kho_ipos_ma_hang_mon_hop_le check (
    (kieu = 'mon' and mat_hang_id is not null) or (kieu = 'bo_qua' and mat_hang_id is null) or kieu = 'goi_can')
);

create trigger kho_ipos_ma_hang_updated_at
  before update on kho_ipos_ma_hang
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_ipos_ma_hang is
  'Mã món iPOS → món kho (0037). kieu: mon = món cố định (mat_hang_id); goi_can = món bán bằng nhãn cân, món thật đọc từ mã cân trên nhãn (mat_hang_id tùy chọn); bo_qua = không phải hàng kho (nước, dịch vụ).';

-- Hộp thư hóa đơn.
create table kho_ipos_hoa_don (
  id            uuid primary key default gen_random_uuid(),
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  ma_hd         text not null,
  bam           text not null,
  thoi_diem_ban timestamptz not null,
  da_huy        boolean not null default false,
  raw           jsonb,
  lan_chay_id   uuid,
  so_lan_sua    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint kho_ipos_hoa_don_duy_nhat unique (chi_nhanh_id, ma_hd)
);

create index kho_ipos_hoa_don_luc_idx on kho_ipos_hoa_don(chi_nhanh_id, thoi_diem_ban);

create trigger kho_ipos_hoa_don_updated_at
  before update on kho_ipos_hoa_don
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_ipos_hoa_don is
  'Hóa đơn iPOS đã nhận (0037). bam = md5 nội dung đã chuẩn hóa: cùng mã cùng băm = bỏ qua; băm khác = HĐ sửa → đảo ngược rồi ghi lại.';

create table kho_ipos_dong (
  id            uuid primary key default gen_random_uuid(),
  hoa_don_id    uuid not null references kho_ipos_hoa_don(id) on delete restrict,
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  khoa_dong     text not null,
  thoi_diem_ban timestamptz not null,
  ma_ipos       text,
  ten_ipos      text,
  ma_vach       text,
  ma_can        text,
  so_kg         numeric(12,3),
  so_goi        int,
  thanh_tien    bigint,
  mat_hang_id   uuid references kho_mat_hang(id) on delete restrict,
  trang_thai    text not null default 'cho',
  so_lan_thu    int not null default 0,
  ly_do         text,
  lo_het_han    boolean not null default false,
  ghi_luc       timestamptz,
  xu_ly_boi     uuid references nhan_su(id) on delete set null,
  xu_ly_luc     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint kho_ipos_dong_duy_nhat unique (hoa_don_id, khoa_dong),
  constraint kho_ipos_dong_trang_thai_hop_le check (trang_thai in (
    'cho', 'da_ghi', 'chua_khop', 'thieu_hang', 'bo_qua', 'da_huy', 'loi')),
  constraint kho_ipos_dong_so_hop_le check ((so_kg is null or so_kg >= 0) and (so_goi is null or so_goi >= 0))
);

create index kho_ipos_dong_cho_idx on kho_ipos_dong(chi_nhanh_id, trang_thai, thoi_diem_ban)
  where trang_thai in ('cho', 'chua_khop', 'thieu_hang', 'loi');
create index kho_ipos_dong_ma_idx on kho_ipos_dong(chi_nhanh_id, ma_ipos);
create index kho_ipos_dong_hd_idx on kho_ipos_dong(hoa_don_id);

create trigger kho_ipos_dong_updated_at
  before update on kho_ipos_dong
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_ipos_dong is
  'Từng dòng hóa đơn iPOS và trạng thái trừ kho (0037): cho | da_ghi | chua_khop | thieu_hang | bo_qua | da_huy | loi. Dòng sổ kho: chung_tu_loai ban_hang, chung_tu_id = id dòng.';
comment on column kho_ipos_dong.thanh_tien is 'Tiền bán thật của dòng trên iPOS (đồng). Chỉ vai xem_gia đọc được.';
comment on column kho_ipos_dong.lo_het_han is 'Đã phải lấy gói thuộc lô hết hạn để ghi bán.';

-- Nhật ký lượt đồng bộ. KHÔNG token.
create table kho_ipos_lan_chay (
  id           uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete cascade,
  nguon        text not null,
  nguoi        uuid references nhan_su(id) on delete set null,
  bat_dau_luc  timestamptz not null default now(),
  ket_thuc_luc timestamptz,
  tu_luc       timestamptz,
  den_luc      timestamptz,
  so_hd        int not null default 0,
  so_dong      int not null default 0,
  so_da_ghi    int not null default 0,
  loi          text,

  constraint kho_ipos_lan_chay_nguon_hop_le check (nguon in ('cron', 'tay')),
  constraint kho_ipos_lan_chay_loi_ngan check (loi is null or char_length(loi) <= 300)
);

create index kho_ipos_lan_chay_cn_idx on kho_ipos_lan_chay(chi_nhanh_id, bat_dau_luc desc);

comment on table kho_ipos_lan_chay is
  'Nhật ký lượt đồng bộ iPOS (0037): nguồn cron | tay, người, số HĐ / dòng, lỗi ngắn (đã xóa token).';

-- Danh sách dòng cho màn Bán hàng iPOS. Có tiền → chỉ vai xem_gia (RLS bảng gốc).
create view kho_v_ipos_dong with (security_invoker = true) as
  select d.id, d.chi_nhanh_id, d.hoa_don_id, h.ma_hd, h.da_huy as hd_da_huy, d.khoa_dong,
         d.thoi_diem_ban, ((d.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date as ngay_ban,
         d.ma_ipos, d.ten_ipos, d.ma_vach, d.ma_can, d.so_kg, d.so_goi, d.thanh_tien,
         d.mat_hang_id, m.ma as ma_mat_hang, m.ten as ten_mat_hang, m.dem_goi, m.don_vi_goi,
         d.trang_thai, d.so_lan_thu, d.ly_do, d.lo_het_han, d.ghi_luc, d.xu_ly_boi, d.xu_ly_luc,
         d.created_at, d.updated_at
  from kho_ipos_dong d
  join kho_ipos_hoa_don h on h.id = d.hoa_don_id
  left join kho_mat_hang m on m.id = d.mat_hang_id;

comment on view kho_v_ipos_dong is
  'Dòng bán iPOS kèm mã HĐ, tên món kho, ngày bán giờ VN (0037). security_invoker: vai không xem_gia không thấy dòng nào.';


-- =============================================================================
-- 3 · PHÂN QUYỀN — đọc thẳng; ghi CHỈ qua hàm
-- =============================================================================
alter table kho_ipos_cau_hinh enable row level security;
alter table kho_ipos_ma_hang  enable row level security;
alter table kho_ipos_hoa_don  enable row level security;
alter table kho_ipos_dong     enable row level security;
alter table kho_ipos_lan_chay enable row level security;

-- Không tiền: mọi vai xem kho đọc được.
create policy kho_ipos_cau_hinh_doc on kho_ipos_cau_hinh
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
create policy kho_ipos_ma_hang_doc on kho_ipos_ma_hang
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
create policy kho_ipos_lan_chay_doc on kho_ipos_lan_chay
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
-- Có tiền bán: chỉ vai xem_gia.
create policy kho_ipos_hoa_don_doc on kho_ipos_hoa_don
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));
create policy kho_ipos_dong_doc on kho_ipos_dong
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem_gia'))::uuid[]));


-- =============================================================================
-- 4 · HÀM NỘI BỘ: LẤY LÔ, TỰ NHẬN HÀNG ĐI ĐƯỜNG, ĐẢO NGƯỢC, GHI MỘT DÒNG
-- =============================================================================

-- Chọn lô cho một lần bán ở quầy: lô CÒN HẠN trước (FEFO), thiếu thì lấy phần
-- còn lại từ lô hết hạn. Không đủ cả hai → null. Không ghi gì.
-- Trả {lo: [{lo_id, so_goi, so_kg}], het_han: bool}.
create or replace function kho_ipos_lay_lo(p_vi_tri_id uuid, p_mat_hang_id uuid, p_so_goi int, p_so_kg numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mh     kho_mat_hang;
  v_can    numeric;
  v_con    numeric;
  v_tong   numeric;
  v_lay    numeric;
  v_a      jsonb := '[]';
  v_b      jsonb := '[]';
begin
  select * into v_mh from kho_mat_hang where id = p_mat_hang_id;
  v_can := case when v_mh.dem_goi then p_so_goi else p_so_kg end;
  if v_can is null or v_can <= 0 then
    return null;
  end if;

  select coalesce(sum(case when v_mh.dem_goi then t.so_goi else t.so_kg end)
                    filter (where l.han_dung >= hom_nay_vn()), 0),
         coalesce(sum(case when v_mh.dem_goi then t.so_goi else t.so_kg end), 0)
    into v_con, v_tong
  from kho_ton t join kho_lo l on l.id = t.lo_id
  where t.vi_tri_id = p_vi_tri_id and t.mat_hang_id = p_mat_hang_id;
  if v_tong < v_can then
    return null;
  end if;

  v_lay := least(v_can, v_con);
  if v_lay > 0 then
    select coalesce(jsonb_agg(jsonb_build_object('lo_id', b.lo_id, 'so_goi', b.so_goi, 'so_kg', b.so_kg)), '[]')
      into v_a
    from kho_phan_bo(p_vi_tri_id, p_mat_hang_id, null,
                     case when v_mh.dem_goi then v_lay::int end,
                     case when v_mh.dem_goi then null else v_lay end, true) b;
  end if;
  if v_can - v_lay > 0 then
    -- Lô hết hạn đứng trước lô còn hạn theo FEFO, và phần hết hạn đủ cho
    -- phần còn lại (tổng ≥ cần) — nên lượt này chỉ đụng lô hết hạn.
    select coalesce(jsonb_agg(jsonb_build_object('lo_id', b.lo_id, 'so_goi', b.so_goi, 'so_kg', b.so_kg)), '[]')
      into v_b
    from kho_phan_bo(p_vi_tri_id, p_mat_hang_id, null,
                     case when v_mh.dem_goi then (v_can - v_lay)::int end,
                     case when v_mh.dem_goi then null else v_can - v_lay end, false) b;
  end if;
  return jsonb_build_object('lo', v_a || v_b, 'het_han', jsonb_array_length(v_b) > 0);
exception when check_violation then
  return null;
end;
$$;

comment on function kho_ipos_lay_lo is
  'NỘI BỘ (0037). Chọn lô bán ở quầy: còn hạn trước (FEFO), thiếu thì lô hết hạn. Không đủ → null. Không ghi sổ.';

-- Máy tự nhận ĐỦ một phiếu mang ra quầy (như NV quầy bấm "Đã nhận đủ", 0032):
-- toàn bộ hàng đi đường của phiếu vào quầy, phiếu → da_nhan.
create or replace function kho_ipos_tu_nhan(p_phieu_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_px kho_phieu_xuat;
  v_nv uuid := (nhan_su_hien_tai()).id;
  v_dc uuid;
  v_r  record;
  v_n  int := 0;
begin
  select * into v_px from kho_phieu_xuat where id = p_phieu_id for update;
  if not found or v_px.loai <> 'chuyen' or v_px.trang_thai <> 'dang_chuyen' then
    return 0;
  end if;
  select id into v_dc from kho_vi_tri where chi_nhanh_id = v_px.chi_nhanh_id and loai = 'dang_chuyen';
  for v_r in select * from kho_chuyen_tren_duong(p_phieu_id) t order by t.han_dung, t.lo_tao_luc, t.lo_id loop
    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi)
    values
      (v_px.chi_nhanh_id, v_r.lo_id, v_dc, v_r.mat_hang_id, 'chuyen_di', -v_r.so_kg, -v_r.so_goi,
       'phieu_xuat', p_phieu_id, 'Tự nhận khi iPOS báo đã bán', v_nv);
    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi)
    values
      (v_px.chi_nhanh_id, v_r.lo_id, v_px.vi_tri_den_id, v_r.mat_hang_id, 'chuyen_den', v_r.so_kg, v_r.so_goi,
       'phieu_xuat', p_phieu_id, 'Tự nhận khi iPOS báo đã bán', v_nv);
    v_n := v_n + 1;
  end loop;
  update kho_phieu_xuat_dong set so_goi_nhan = so_goi, so_kg_nhan = so_kg where phieu_xuat_id = p_phieu_id;
  update kho_phieu_xuat set trang_thai = 'da_nhan', nguoi_nhan = v_nv, nhan_luc = now(),
                            nhan_ma_gui = gen_random_uuid()
  where id = p_phieu_id;
  if v_px.yeu_cau_id is not null then
    update kho_yeu_cau_quay set trang_thai = 'xong' where id = v_px.yeu_cau_id and trang_thai = 'dang_lam';
  end if;
  return v_n;
end;
$$;

comment on function kho_ipos_tu_nhan is
  'NỘI BỘ (0037). Nhận đủ một phiếu mang ra quầy thay NV quầy khi iPOS đã bán hàng của phiếu đó.';

-- Đảo ngược mọi dòng sổ bán (ban, hao_hut) của một dòng iPOS chưa bị đảo.
-- Dòng kiem_ke "hàng ngoài sổ" giữ nguyên: hàng đó có thật. Ngày = ngày gốc.
create or replace function kho_ipos_dao_dong(p_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s kho_so_cai;
  v_n int := 0;
begin
  for v_s in
    select s.* from kho_so_cai s
    where s.chung_tu_loai = 'ban_hang' and s.chung_tu_id = p_id and s.loai in ('ban', 'hao_hut')
      and not exists (select 1 from kho_so_cai r where r.dao_cua = s.id)
    -- Dòng ban trước (trả hàng về lô), hao_hut sau — tồn không lúc nào âm.
    order by case when s.loai = 'ban' then 0 else 1 end, s.created_at desc, s.id desc
  loop
    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, dao_cua, ghi_chu, nguoi_ghi, ngay)
    values
      (v_s.chi_nhanh_id, v_s.lo_id, v_s.vi_tri_id, v_s.mat_hang_id, 'dao_nguoc', -v_s.so_kg, -v_s.so_goi,
       'ban_hang', p_id, v_s.id, 'HĐ iPOS sửa / hủy', (nhan_su_hien_tai()).id, v_s.ngay);
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

comment on function kho_ipos_dao_dong is
  'NỘI BỘ (0037). Đảo ngược các dòng sổ ban / hao_hut của một dòng iPOS (HĐ sửa hoặc hủy). Trả số dòng đã đảo.';

-- Ghi MỘT dòng iPOS vào sổ kho. KHÔNG BAO GIỜ raise: lỗi bất ngờ → 'loi'.
-- Người gọi đã khóa kho_cai_dat. Trả trạng thái mới.
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
        ly_do = 'Không phải hàng kho' where id = p_id;
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
    if v_mh.dem_goi then
      v_goi := coalesce(v_d.so_goi, 1);
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
        v_pb := kho_ipos_lay_lo(v_c.vi_tri_ban_id, v_mh.id, v_goi, v_kg);
        exit when v_pb is not null;
      end loop;
    end if;
    if v_pb is null then
      update kho_ipos_dong set trang_thai = 'thieu_hang', so_lan_thu = so_lan_thu + 1,
        mat_hang_id = v_mh.id, ma_can = coalesce(ma_can, v_ma), so_kg = coalesce(so_kg, v_kg),
        ly_do = 'Quầy không đủ "' || v_mh.ten || '" trên sổ: cần '
          || case when v_mh.dem_goi then v_goi || ' ' || v_mh.don_vi_goi
                  else replace(v_kg::text, '.', ',') || ' kg' end
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
        -- Kg nhãn chia cho các lô theo kg sổ; lô cuối nhận phần dư.
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
             'ban_hang', p_id, 'Lệch kg nhãn cân · iPOS ' || v_h.ma_hd, v_nv, v_ngay);
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
      ma_can = coalesce(ma_can, v_ma), so_kg = coalesce(so_kg, v_kg), lo_het_han = (v_pb ->> 'het_han')::boolean, ghi_luc = now(),
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
  'NỘI BỘ (0037). Trừ kho một dòng bán iPOS: khớp món (ghép mã → mã cân), FEFO ở quầy bán (còn hạn trước), hao_hut lệch kg nhãn rồi ban, ngày = ngày bán giờ VN; thiếu thì tự nhận hàng đang mang ra quầy. Không bao giờ raise: lỗi → loi.';

-- Mất kết nối: lượt cuối lỗi, hoặc trong giờ mở cửa mà > 30 phút chưa có lượt tốt.
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
        and coalesce(p_c.lan_ok_luc, p_c.bat_luc, p_c.updated_at) < now() - interval '30 minutes'))
$$;

comment on function kho_ipos_mat_ket_noi is
  'NỘI BỘ (0037). Đồng bộ iPOS đang bật mà lượt cuối lỗi, hoặc trong giờ mở cửa đã hơn 30 phút không có lượt tốt.';


-- =============================================================================
-- 5 · MỘT LƯỢT ĐỒNG BỘ — bat_dau → nhan (nhiều lô) → ket_thuc  [dong_bo_ban]
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
  if p_nguon is null or p_nguon not in ('cron', 'tay') then
    raise exception 'Nguồn lượt đồng bộ phải là cron hoặc tay' using errcode = 'check_violation';
  end if;

  select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found or not v_c.bat then
    return jsonb_build_object('duoc', false, 'ly_do', 'Đồng bộ iPOS chưa bật ở chi nhánh này');
  end if;
  if coalesce(v_c.pos_parent, '') = '' then v_thieu := v_thieu || 'pos_parent'::text; end if;
  if coalesce(v_c.pos_id, '') = '' then v_thieu := v_thieu || 'pos_id'::text; end if;
  if coalesce(v_c.duong_dan_hoa_don, '') = '' then v_thieu := v_thieu || 'đường dẫn lấy hóa đơn'::text; end if;
  if v_c.vi_tri_ban_id is null then v_thieu := v_thieu || 'quầy bán'::text; end if;
  if cardinality(v_thieu) > 0 then
    return jsonb_build_object('duoc', false,
      'ly_do', 'Chưa cấu hình đủ kết nối iPOS: thiếu ' || array_to_string(v_thieu, ', '));
  end if;

  if v_c.dang_chay_tu is not null and v_c.dang_chay_tu > now() - interval '10 minutes' then
    return jsonb_build_object('duoc', false, 'ly_do', 'Đang có một lượt đồng bộ chạy — đợi ít phút');
  end if;
  if v_c.lan_dang_chay is not null then
    update kho_ipos_lan_chay set ket_thuc_luc = now(), loi = 'Quá 10 phút không xong — coi như hỏng'
    where id = v_c.lan_dang_chay and ket_thuc_luc is null;
  end if;
  if p_nguon = 'tay' and exists (
       select 1 from kho_ipos_lan_chay l
       where l.chi_nhanh_id = p_chi_nhanh_id and l.bat_dau_luc > now() - interval '60 seconds') then
    return jsonb_build_object('duoc', false, 'ly_do', 'Vừa cập nhật xong — đợi 1 phút rồi bấm lại');
  end if;

  v_tu := coalesce(v_c.dong_bo_den_luc - interval '15 minutes', v_c.ipos_tu_luc, now() - interval '1 hour');
  if v_c.ipos_tu_luc is not null and v_tu < v_c.ipos_tu_luc then
    v_tu := v_c.ipos_tu_luc;
  end if;

  insert into kho_ipos_lan_chay (chi_nhanh_id, nguon, nguoi, tu_luc, den_luc)
  values (p_chi_nhanh_id, p_nguon, (nhan_su_hien_tai()).id, v_tu, v_den)
  returning id into v_id;
  update kho_ipos_cau_hinh set dang_chay_tu = now(), lan_dang_chay = v_id where chi_nhanh_id = p_chi_nhanh_id;

  return jsonb_build_object(
    'duoc', true, 'lan_id', v_id, 'api_url', v_c.api_url, 'pos_parent', v_c.pos_parent, 'pos_id', v_c.pos_id,
    'duong_dan_hoa_don', v_c.duong_dan_hoa_don, 'tu_luc', v_tu, 'den_luc', v_den);
end;
$$;

comment on function kho_ipos_bat_dau is
  'Bắt đầu một lượt đồng bộ iPOS (dong_bo_ban). Trả {duoc, ly_do?, lan_id, api_url, pos_parent, pos_id, duong_dan_hoa_don, tu_luc, den_luc}. Từ chối (duoc=false) khi chưa bật / chưa cấu hình đủ / đang có lượt chạy (< 10 phút) / nguồn tay và lượt trước < 60 giây. Không trả token — token là bí mật Worker.';

-- p_hoa_don: mảng tối đa 200 HĐ, mỗi HĐ
--   {ma_hd, thoi_diem_ban (ISO có múi giờ), da_huy?, raw?, dong: [
--     {khoa_dong?, ma_ipos?, ten_ipos?, ma_vach?, ma_can?, so_kg?, so_goi?, thanh_tien?}]}
-- khoa_dong trống = số thứ tự dòng (1, 2, ...). HĐ sai dạng bị bỏ, báo trong canh_bao.
-- p_den_luc: gửi ở lô CUỐI của lượt để tiến watermark; lô giữa gửi null.
create or replace function kho_ipos_nhan(p_chi_nhanh_id uuid, p_lan_id uuid, p_hoa_don jsonb, p_den_luc timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c      kho_ipos_cau_hinh;
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
  v_tt     numeric;
  v_raw    jsonb;
  v_moi    int := 0;
  v_trung  int := 0;
  v_sua    int := 0;
  v_hd_huy int := 0;
  v_hd_loi int := 0;
  v_so_dong int := 0;
  v_canh   jsonb := '[]';
  v_kq     jsonb := '{}';
  v_id     uuid;
  v_st     text;
  v_dem    jsonb := jsonb_build_object('da_ghi', 0, 'thieu_hang', 0, 'chua_khop', 0, 'bo_qua', 0,
                                       'loi', 0, 'cho', 0, 'da_huy', 0);
begin
  if not kho_duoc(p_chi_nhanh_id, 'dong_bo_ban') then
    raise exception 'Tài khoản của bạn không đồng bộ được bán hàng iPOS của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  -- Khóa xếp hàng của chi nhánh (như mọi hàm ghi sổ) rồi tới cấu hình.
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found or p_lan_id is null or v_c.lan_dang_chay is distinct from p_lan_id then
    raise exception 'Lượt đồng bộ này đã kết thúc hoặc quá hạn — chạy lại' using errcode = 'check_violation';
  end if;
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
        v_tt  := round(nullif(v_e ->> 'thanh_tien', '')::numeric);
        if (v_kg is not null and (v_kg < 0 or v_kg > 100000))
           or (v_goi is not null and (v_goi < 0 or v_goi > 100000 or v_goi <> trunc(v_goi))) then
          raise exception 'dòng %: số lượng không hợp lệ', v_i;
        end if;
        v_dong := v_dong || jsonb_build_object(
          'khoa_dong', v_khoa,
          'ma_ipos',  left(nullif(btrim(v_e ->> 'ma_ipos'), ''), 100),
          'ten_ipos', left(nullif(btrim(v_e ->> 'ten_ipos'), ''), 200),
          'ma_vach',  left(nullif(btrim(v_e ->> 'ma_vach'), ''), 40),
          'ma_can',   v_mc,
          'so_kg',    v_kg,
          'so_goi',   v_goi::int,
          'thanh_tien', v_tt::bigint);
      end loop;

      v_bam := md5(jsonb_build_object(
        't', to_char(v_luc at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.US'), 'h', v_huy, 'd', v_dong)::text);
      v_raw := case when v_x ? 'raw' and pg_column_size(v_x -> 'raw') <= 32000 then v_x -> 'raw' end;

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
                                                       ma_can text, so_kg numeric, so_goi int, thanh_tien bigint)
        loop
          insert into kho_ipos_dong (hoa_don_id, chi_nhanh_id, khoa_dong, thoi_diem_ban, ma_ipos, ten_ipos,
                                     ma_vach, ma_can, so_kg, so_goi, thanh_tien)
          values (v_h.id, p_chi_nhanh_id, v_dg.khoa_dong, v_luc, v_dg.ma_ipos, v_dg.ten_ipos,
                  v_dg.ma_vach, v_dg.ma_can, v_dg.so_kg, v_dg.so_goi, v_dg.thanh_tien)
          on conflict (hoa_don_id, khoa_dong) do update set
            thoi_diem_ban = excluded.thoi_diem_ban, ma_ipos = excluded.ma_ipos, ten_ipos = excluded.ten_ipos,
            ma_vach = excluded.ma_vach, ma_can = excluded.ma_can, so_kg = excluded.so_kg,
            so_goi = excluded.so_goi, thanh_tien = excluded.thanh_tien,
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
  for v_id in
    select d.id from kho_ipos_dong d
    where d.chi_nhanh_id = p_chi_nhanh_id and d.trang_thai in ('cho', 'thieu_hang', 'chua_khop')
    order by d.thoi_diem_ban, d.created_at, d.khoa_dong
  loop
    v_st := kho_ipos_ghi_dong(v_id);
    v_dem := jsonb_set(v_dem, array[v_st], to_jsonb(coalesce((v_dem ->> v_st)::int, 0) + 1));
  end loop;

  -- ---- 3 · Watermark, nhật ký -------------------------------------------------
  if p_den_luc is not null then
    update kho_ipos_cau_hinh set
      dong_bo_den_luc = greatest(coalesce(dong_bo_den_luc, '-infinity'::timestamptz), least(p_den_luc, now()))
    where chi_nhanh_id = p_chi_nhanh_id;
  end if;
  update kho_ipos_lan_chay set
    so_hd = so_hd + jsonb_array_length(p_hoa_don), so_dong = so_dong + v_so_dong,
    so_da_ghi = so_da_ghi + (v_dem ->> 'da_ghi')::int
  where id = p_lan_id;

  return jsonb_build_object(
    'hd_moi', v_moi, 'hd_trung', v_trung, 'hd_sua', v_sua, 'hd_huy', v_hd_huy, 'hd_loi', v_hd_loi,
    'canh_bao', v_canh, 'so_dong', v_so_dong, 'dong', v_dem,
    'den_luc', (select dong_bo_den_luc from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id));
end;
$$;

comment on function kho_ipos_nhan is
  'Nhận một lô ≤ 200 HĐ iPOS (dong_bo_ban, trong lượt p_lan_id): ghi hộp thư (trùng băm = bỏ, băm khác = đảo ngược rồi ghi lại, hủy = đảo ngược), rồi ghi sổ mọi dòng cho / thieu_hang / chua_khop của chi nhánh, lỗi một dòng không hỏng lô. p_den_luc (lô cuối) tiến watermark. Trả {hd_moi, hd_trung, hd_sua, hd_huy, hd_loi, canh_bao[{ma_hd, loi}], so_dong, dong{trạng thái: số}, den_luc}.';

create or replace function kho_ipos_ket_thuc(p_lan_id uuid, p_loi text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_l   kho_ipos_lan_chay;
  v_loi text;
begin
  select * into v_l from kho_ipos_lan_chay where id = p_lan_id;
  if not found or not kho_duoc(v_l.chi_nhanh_id, 'dong_bo_ban') then
    raise exception 'Không tìm thấy lượt đồng bộ, hoặc tài khoản không đồng bộ được iPOS'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_l from kho_ipos_lan_chay where id = p_lan_id for update;
  if v_l.ket_thuc_luc is not null then
    return jsonb_build_object('lan_id', v_l.id, 'loi', v_l.loi, 'da_co', true);
  end if;

  -- Lưới cuối: token lỡ lọt vào câu lỗi thì xóa trước khi lưu.
  v_loi := nullif(btrim(p_loi), '');
  if v_loi is not null then
    v_loi := regexp_replace(v_loi, '(access_token|token)(["'']?\s*[=:]\s*["'']?)[^&\s"'',;]+', '\1\2***', 'gi');
    v_loi := left(v_loi, 300);
  end if;

  update kho_ipos_lan_chay set ket_thuc_luc = now(), loi = v_loi where id = p_lan_id;
  update kho_ipos_cau_hinh set
    dang_chay_tu  = case when lan_dang_chay = p_lan_id then null else dang_chay_tu end,
    lan_dang_chay = case when lan_dang_chay = p_lan_id then null else lan_dang_chay end,
    lan_cuoi_luc  = now(),
    lan_cuoi_loi  = v_loi,
    lan_ok_luc    = case when v_loi is null then now() else lan_ok_luc end,
    loi_tu_luc    = case when v_loi is null then null else coalesce(loi_tu_luc, now()) end
  where chi_nhanh_id = v_l.chi_nhanh_id;

  return jsonb_build_object('lan_id', v_l.id, 'loi', v_loi, 'da_co', false);
end;
$$;

comment on function kho_ipos_ket_thuc is
  'Kết thúc lượt đồng bộ iPOS (dong_bo_ban): nhả khóa, ghi nhật ký. p_loi null = lượt tốt. Câu lỗi cắt ≤ 300 ký tự, "access_token=…" bị thay bằng ***.';


-- =============================================================================
-- 6 · CẤU HÌNH, CHUYỂN NGUỒN SỐ BÁN  [cai_dat_goc]
-- =============================================================================
-- p_cau_hinh: chỉ những khóa muốn đổi, trong số
--   bat, api_url, pos_parent, pos_id, duong_dan_hoa_don, vi_tri_ban_id, gio_mo_cua, gio_dong_cua.
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
                         'gio_mo_cua', 'gio_dong_cua']) then
      raise exception 'Trường "%" không được nhận', v_k using errcode = 'check_violation';
    end if;
  end loop;

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
    nguoi_sua = (nhan_su_hien_tai()).id
  where chi_nhanh_id = p_chi_nhanh_id;

  return kho_ipos_trang_thai(p_chi_nhanh_id);
end;
$$;

comment on function kho_ipos_luu_cau_hinh is
  'Chủ lưu kết nối iPOS (cai_dat_goc): bat, api_url, pos_parent, pos_id, duong_dan_hoa_don, vi_tri_ban_id (quầy), gio_mo_cua, gio_dong_cua — chỉ khóa có mặt mới đổi. Từ chối mọi thứ có chữ "token". Trả kho_ipos_trang_thai.';

-- Chuyển sang trừ kho theo iPOS: nguồn số bán = ipos và mốc chuyển CÙNG LÚC.
-- p_tu_luc null = lúc gửi của lần đếm quầy bán (nguồn kiểm kê) đã duyệt gần nhất.
create or replace function kho_ipos_chuyen_sang(p_chi_nhanh_id uuid, p_tu_luc timestamptz)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c   kho_ipos_cau_hinh;
  v_tu  timestamptz := p_tu_luc;
begin
  if not kho_duoc(p_chi_nhanh_id, 'cai_dat_goc') then
    raise exception 'Chỉ chủ nhà hàng đổi được nguồn số bán' using errcode = 'insufficient_privilege';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Kho chi nhánh này chưa khởi tạo' using errcode = 'check_violation';
  end if;
  select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found or v_c.vi_tri_ban_id is null then
    raise exception 'Chọn quầy bán trong Kết nối iPOS trước' using errcode = 'check_violation';
  end if;

  if v_tu is null then
    select k.gui_luc into v_tu from kho_kiem_ke k
    where k.chi_nhanh_id = p_chi_nhanh_id and k.vi_tri_id = v_c.vi_tri_ban_id
      and k.trang_thai = 'da_duyet' and k.nguon_so_ban = 'kiem_ke' and k.gui_luc is not null
    order by k.gui_luc desc limit 1;
    if v_tu is null then
      raise exception 'Chưa có lần đếm quầy nào được duyệt — chọn mốc chuyển' using errcode = 'check_violation';
    end if;
  end if;
  if v_tu > now() + interval '1 day' then
    raise exception 'Mốc chuyển không được quá 1 ngày tới' using errcode = 'check_violation';
  end if;

  update kho_cai_dat set nguon_so_ban = 'ipos' where chi_nhanh_id = p_chi_nhanh_id;
  -- Watermark lùi về mốc: đọc lại iPOS từ mốc (HĐ đã có trong hộp thư trùng băm → bỏ qua).
  update kho_ipos_cau_hinh set ipos_tu_luc = v_tu, dong_bo_den_luc = v_tu, nguoi_sua = (nhan_su_hien_tai()).id
  where chi_nhanh_id = p_chi_nhanh_id;

  return jsonb_build_object('nguon_so_ban', 'ipos', 'ipos_tu_luc', v_tu);
end;
$$;

comment on function kho_ipos_chuyen_sang is
  'Chủ chuyển sang trừ kho theo iPOS (cai_dat_goc): nguon_so_ban = ipos và mốc ipos_tu_luc cùng lúc. p_tu_luc null = gui_luc lần đếm quầy (nguồn kiểm kê) đã duyệt gần nhất. Bán trước mốc → bỏ qua.';

create or replace function kho_ipos_tro_ve(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not kho_duoc(p_chi_nhanh_id, 'cai_dat_goc') then
    raise exception 'Chỉ chủ nhà hàng đổi được nguồn số bán' using errcode = 'insufficient_privilege';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Kho chi nhánh này chưa khởi tạo' using errcode = 'check_violation';
  end if;
  update kho_cai_dat set nguon_so_ban = 'kiem_ke' where chi_nhanh_id = p_chi_nhanh_id;
  update kho_ipos_cau_hinh set ipos_tu_luc = null, nguoi_sua = (nhan_su_hien_tai()).id
  where chi_nhanh_id = p_chi_nhanh_id;
  return jsonb_build_object('nguon_so_ban', 'kiem_ke', 'ipos_tu_luc', null);
end;
$$;

comment on function kho_ipos_tro_ve is
  'Chủ quay lại "đếm quầy = số bán" (cai_dat_goc): nguon_so_ban = kiem_ke, bỏ mốc iPOS. Dòng đã ghi giữ nguyên; dòng mới để chờ.';


-- =============================================================================
-- 7 · XỬ LÝ HÀNG CHỜ  [danh_muc: ghép mã; duyet: thử lại / ngoài sổ / bỏ qua]
-- =============================================================================
-- p_kieu null = bỏ ghép. Ghép xong xử lý lại mọi dòng chua_khop cùng mã.
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
            (select d.ten_ipos from kho_ipos_dong d where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = v_ma
               and d.ten_ipos is not null order by d.created_at desc limit 1),
            p_kieu, case when p_kieu = 'bo_qua' then null else p_mat_hang_id end, (nhan_su_hien_tai()).id)
    on conflict (chi_nhanh_id, ma_ipos) do update set
      kieu = excluded.kieu, mat_hang_id = excluded.mat_hang_id, nguoi_sua = excluded.nguoi_sua,
      ten_ipos = coalesce(excluded.ten_ipos, kho_ipos_ma_hang.ten_ipos);
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
  'Ghép mã món iPOS với món kho (danh_muc): kieu mon | goi_can | bo_qua; p_kieu null = bỏ ghép. Xử lý lại ngay mọi dòng chua_khop cùng mã. Trả {ma_ipos, kieu, so_dong, dong{trạng thái: số}}.';

-- p_cach: thu_lai | bo_qua | ngoai_so (hàng có ở quầy mà sổ không có: cộng
-- kiem_ke vào lô mới nhất của món rồi ghi bán — bắt buộc lý do).
create or replace function kho_ipos_xu_ly_dong(p_id uuid, p_cach text, p_ly_do text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d    kho_ipos_dong;
  v_c    kho_ipos_cau_hinh;
  v_mh   kho_mat_hang;
  v_ly   text := nullif(btrim(p_ly_do), '');
  v_nv   uuid;
  v_tt   text;
  v_can  numeric;
  v_co   numeric;
  v_thieu numeric;
  v_kg   numeric;
  v_lo   uuid;
  v_tb   numeric;
begin
  select * into v_d from kho_ipos_dong where id = p_id;
  if not found or not kho_duoc(v_d.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy dòng bán iPOS, hoặc tài khoản không xử lý được' using errcode = 'insufficient_privilege';
  end if;
  if p_cach is null or p_cach not in ('thu_lai', 'bo_qua', 'ngoai_so') then
    raise exception 'Cách xử lý phải là thu_lai, bo_qua hoặc ngoai_so' using errcode = 'check_violation';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = v_d.chi_nhanh_id for update;
  select * into v_d from kho_ipos_dong where id = p_id for update;
  if v_d.trang_thai not in ('cho', 'thieu_hang', 'chua_khop', 'loi') then
    raise exception 'Dòng này đã xử lý xong (%)', v_d.trang_thai using errcode = 'check_violation';
  end if;
  v_nv := (nhan_su_hien_tai()).id;

  if p_cach = 'bo_qua' then
    update kho_ipos_dong set trang_thai = 'bo_qua', ly_do = coalesce(left(v_ly, 300), 'Quản lý bỏ qua'),
                             xu_ly_boi = v_nv, xu_ly_luc = now()
    where id = p_id;
    return jsonb_build_object('trang_thai', 'bo_qua');
  end if;

  if p_cach = 'ngoai_so' then
    if v_ly is null or char_length(v_ly) < 3 then
      raise exception 'Ghi lý do hàng ngoài sổ' using errcode = 'check_violation';
    end if;
    if v_d.trang_thai <> 'thieu_hang' or v_d.mat_hang_id is null then
      raise exception 'Chỉ dòng thiếu hàng mới ghi được hàng ngoài sổ' using errcode = 'check_violation';
    end if;
    select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = v_d.chi_nhanh_id;
    select * into v_mh from kho_mat_hang where id = v_d.mat_hang_id;
    v_can := case when v_mh.dem_goi then coalesce(v_d.so_goi, 1) else v_d.so_kg end;
    select coalesce(sum(case when v_mh.dem_goi then t.so_goi else t.so_kg end), 0) into v_co
    from kho_ton t where t.vi_tri_id = v_c.vi_tri_ban_id and t.mat_hang_id = v_mh.id;
    v_thieu := v_can - v_co;
    if v_thieu > 0 then
      select l.id into v_lo from kho_lo l
      where l.chi_nhanh_id = v_d.chi_nhanh_id and l.mat_hang_id = v_mh.id
      order by l.created_at desc, l.id desc limit 1;
      if v_lo is null then
        raise exception 'Chưa có lô nào của "%" — nhập hàng hoặc tồn đầu kỳ trước', v_mh.ten
          using errcode = 'check_violation';
      end if;
      if v_mh.dem_goi then
        v_tb := coalesce(case when v_d.so_kg is not null then v_d.so_kg / coalesce(v_d.so_goi, 1) end,
                         kho_kg_tb_goi(v_lo), 0);
        v_kg := round(v_tb * v_thieu, 3);
      else
        v_kg := v_thieu;
      end if;
      insert into kho_so_cai
        (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
         chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi, ngay)
      values
        (v_d.chi_nhanh_id, v_lo, v_c.vi_tri_ban_id, v_mh.id, 'kiem_ke', v_kg,
         case when v_mh.dem_goi then v_thieu::int else 0 end,
         'ban_hang', p_id, left('Hàng ngoài sổ: ' || v_ly, 300), v_nv,
         ((v_d.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date);
    end if;
    v_tt := kho_ipos_ghi_dong(p_id);
    if v_tt <> 'da_ghi' then
      raise exception 'Chưa ghi được: %', (select ly_do from kho_ipos_dong where id = p_id)
        using errcode = 'check_violation';
    end if;
    update kho_ipos_dong set xu_ly_boi = v_nv, xu_ly_luc = now(),
      ly_do = left('Hàng ngoài sổ: ' || v_ly, 300) where id = p_id;
    return jsonb_build_object('trang_thai', 'da_ghi');
  end if;

  -- thu_lai
  v_tt := kho_ipos_ghi_dong(p_id);
  update kho_ipos_dong set xu_ly_boi = v_nv, xu_ly_luc = now() where id = p_id;
  return jsonb_build_object('trang_thai', v_tt, 'ly_do', (select ly_do from kho_ipos_dong where id = p_id));
end;
$$;

comment on function kho_ipos_xu_ly_dong is
  'Quản lý xử lý một dòng bán iPOS chưa trừ kho (duyet): thu_lai | bo_qua | ngoai_so (cộng kiem_ke phần thiếu vào lô mới nhất của món ở quầy bán rồi ghi bán — bắt buộc lý do). Trả {trang_thai, ly_do?}.';


-- =============================================================================
-- 8 · TRẠNG THÁI (màn Kết nối iPOS, trang chủ quản lý)  [xem — không tiền]
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

  v_du := v_c.chi_nhanh_id is not null and coalesce(v_c.pos_parent, '') <> '' and coalesce(v_c.pos_id, '') <> ''
          and coalesce(v_c.duong_dan_hoa_don, '') <> '' and v_c.vi_tri_ban_id is not null;
  v_mat := v_c.chi_nhanh_id is not null and kho_ipos_mat_ket_noi(v_c);

  if v_c.chi_nhanh_id is null or not v_c.bat then
    v_den := 'vang'; v_cau := 'Chưa bật đồng bộ iPOS.';
  elsif not v_du then
    v_den := 'vang'; v_cau := 'Chưa cấu hình đủ kết nối iPOS.';
  elsif v_mat and v_c.loi_tu_luc is not null then
    v_den := 'do'; v_cau := 'Lần đồng bộ gần nhất bị lỗi — số bán chưa cập nhật.';
  elsif v_mat then
    v_den := 'do'; v_cau := 'Hơn 30 phút chưa đồng bộ được iPOS.';
  elsif coalesce(v_cd.nguon_so_ban, 'kiem_ke') <> 'ipos' or v_c.ipos_tu_luc is null then
    v_den := 'vang'; v_cau := 'Đang đọc iPOS nhưng CHƯA trừ kho — còn dùng đếm quầy làm số bán.';
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
    'ipos_tu_luc', v_c.ipos_tu_luc, 'dong_bo_den_luc', v_c.dong_bo_den_luc,
    'dang_chay', v_c.dang_chay_tu is not null and v_c.dang_chay_tu > now() - interval '10 minutes',
    'lan_cuoi_luc', v_c.lan_cuoi_luc, 'lan_cuoi_loi', v_c.lan_cuoi_loi, 'lan_ok_luc', v_c.lan_ok_luc,
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
  'Trạng thái đồng bộ iPOS (xem, không tiền): cấu hình (không token), đèn xanh | vang | do + câu dễ hiểu, lần chạy cuối, số dòng theo trạng thái, 10 lượt gần nhất.';


-- =============================================================================
-- 9 · BÁO CÁO BÁN — doanh thu thật từ iPOS  (SECURITY INVOKER như 0024)
-- =============================================================================
-- nguon 'ipos'    : dòng bán ghi từ HĐ iPOS — doanh_thu = tổng thanh_tien thật.
-- nguon 'uoc_tinh': dòng bán ghi từ kiểm kê quầy (trước mốc) — kg × giá bán hiện tại.
create or replace function kho_bao_cao_ban_thuc(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  mat_hang_id uuid, ten text, nguon text, so_kg numeric, so_goi int, gia_von bigint,
  doanh_thu bigint, lai_gop bigint
)
language sql
stable
set search_path = public
as $$
  with dong as (
    select s.mat_hang_id, s.chung_tu_loai = 'ban_hang' as tu_ipos, s.so_kg, s.so_goi,
           s.so_kg * coalesce(lg.gia_von_kg, 0) as gia_tri
    from kho_so_cai s
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_lo_gia lg on lg.lo_id = s.lo_id
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay between p_tu and p_den
      and coalesce(g.loai, s.loai) = 'ban'
  ),
  gom as (
    select d.mat_hang_id, d.tu_ipos, -sum(d.so_kg) as kg, (-sum(d.so_goi))::int as goi, -sum(d.gia_tri) as gv
    from dong d
    group by d.mat_hang_id, d.tu_ipos
    having sum(d.so_kg) <> 0 or sum(d.so_goi) <> 0
  ),
  tien as (
    select i.mat_hang_id, sum(i.thanh_tien) as dt
    from kho_ipos_dong i
    where i.chi_nhanh_id = p_chi_nhanh_id and i.trang_thai = 'da_ghi'
      and ((i.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date between p_tu and p_den
    group by i.mat_hang_id
  ),
  kq as (
    select m.id, m.ten, case when g.tu_ipos then 'ipos' else 'uoc_tinh' end as nguon, g.kg, g.goi,
           round(g.gv)::bigint as gv,
           (case when g.tu_ipos then coalesce(t.dt, 0) else round(g.kg * coalesce(m.gia_ban_kg, 0)) end)::bigint as dt,
           m.loai, m.thu_tu
    from gom g
    join kho_mat_hang m on m.id = g.mat_hang_id
    left join tien t on t.mat_hang_id = g.mat_hang_id and g.tu_ipos
  )
  select k.id, k.ten, k.nguon, k.kg, k.goi, k.gv, k.dt, k.dt - k.gv
  from kq k
  order by k.loai, k.thu_tu, k.ten, k.nguon
$$;

comment on function kho_bao_cao_ban_thuc is
  'Hàng bán trong kỳ (0037): nguon ipos = doanh thu THẬT từ dòng HĐ iPOS đã ghi; nguon uoc_tinh = từ kiểm kê quầy (trước khi nối iPOS), kg × giá bán hiện tại. Giá vốn theo lô. SECURITY INVOKER: không xem_gia thì tiền = 0.';


-- =============================================================================
-- 10 · KIỂM KÊ QUẦY KHI NGUỒN iPOS — thay THÂN (cùng chữ ký), chép 0032
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

  -- 0037: quầy trừ kho theo iPOS — số bán phải mới (≤ 10 phút) trước khi chụp sổ.
  if v_kk.nguon_so_ban = 'ipos' then
    select * into v_ip from kho_ipos_cau_hinh where chi_nhanh_id = v_kk.chi_nhanh_id;
    if found and v_ip.bat and v_ip.vi_tri_ban_id = v_kk.vi_tri_id
       and (v_ip.dong_bo_den_luc is null or v_ip.dong_bo_den_luc < now() - interval '10 minutes') then
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

create or replace function kho_duyet_kiem_ke(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk     kho_kiem_ke;
  v_cd     kho_cai_dat;
  v_vt     kho_vi_tri;
  v_nv     nhan_su;
  v_ds     text;
  v_d      record;
  v_r      record;
  v_loai   text;
  v_dg     int;
  v_dk     numeric;
  v_ban_g  int := 0;
  v_ban_k  numeric := 0;
  v_so_lo  int := 0;
  v_n      int;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được duyệt'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_kk.chi_nhanh_id for update;
  select * into v_kk from kho_kiem_ke where id = p_id for update;
  if v_kk.trang_thai = 'da_duyet' then
    return 'Phiếu ' || v_kk.so_phieu || ' đã được duyệt trước đó.';
  end if;
  if v_kk.trang_thai <> 'cho_duyet' then
    raise exception 'Phiếu % chưa được gửi duyệt', v_kk.so_phieu using errcode = 'check_violation';
  end if;
  v_nv := nhan_su_hien_tai();
  if not v_cd.cho_tu_duyet and v_nv.id is not null and v_nv.id in (v_kk.nguoi_tao, v_kk.nguoi_gui) then
    raise exception 'Cài đặt không cho tự duyệt phiếu do chính mình lập — nhờ quản lý khác duyệt'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_vt from kho_vi_tri where id = v_kk.vi_tri_id;

  -- Hàng đã nằm ở đó mà sổ chưa có → duyệt sẽ ghi sai. Xử lý chứng từ treo trước.
  select string_agg(so_phieu, ', ') into v_ds from kho_phieu_nhap
  where chi_nhanh_id = v_kk.chi_nhanh_id and vi_tri_id = v_kk.vi_tri_id and trang_thai = 'cho_duyet';
  if v_ds is not null then
    raise exception 'Còn phiếu nhập chờ duyệt vào "%": % — duyệt hoặc từ chối trước khi duyệt kiểm kê', v_vt.ten, v_ds
      using errcode = 'check_violation';
  end if;
  select string_agg(p.so_phieu, ', ') into v_ds from kho_phien_pha p
  where p.chi_nhanh_id = v_kk.chi_nhanh_id and p.trang_thai = 'nhap'
    and (exists (select 1 from kho_phien_pha_vao v where v.phien_pha_id = p.id and v.vi_tri_id = v_kk.vi_tri_id)
         or exists (select 1 from kho_phien_pha_ra r where r.phien_pha_id = p.id and r.vi_tri_id = v_kk.vi_tri_id));
  if v_ds is not null then
    raise exception 'Còn phiên pha lóc chưa chốt dùng "%": % — chốt hoặc hủy trước khi duyệt kiểm kê', v_vt.ten, v_ds
      using errcode = 'check_violation';
  end if;

  -- 0032: hàng đang mang ra vị trí này mà quầy chưa bấm nhận — có thể đã nằm
  -- trên quầy mà sổ chưa có, đếm sẽ ra thừa giả.
  select string_agg(x.so_phieu, ', ') into v_ds from kho_phieu_xuat x
  where x.chi_nhanh_id = v_kk.chi_nhanh_id and x.vi_tri_den_id = v_kk.vi_tri_id and x.trang_thai = 'dang_chuyen';
  if v_ds is not null then
    raise exception 'Còn hàng đang mang ra chưa bấm nhận: % — bấm "Đã nhận" (hoặc báo thiếu) trước khi %', v_ds, 'duyệt kiểm kê'
      using errcode = 'check_violation';
  end if;

  -- 0037: quầy trừ kho theo iPOS — dòng bán trước lúc gửi mà chưa trừ được kho
  -- (thiếu hàng / chưa ghép món) sẽ làm kiểm kê ra thiếu giả.
  if v_kk.nguon_so_ban = 'ipos' and v_vt.loai = 'quay' then
    select count(*) into v_n
    from kho_ipos_dong d join kho_ipos_cau_hinh c on c.chi_nhanh_id = d.chi_nhanh_id
    where d.chi_nhanh_id = v_kk.chi_nhanh_id and c.vi_tri_ban_id = v_kk.vi_tri_id
      and d.trang_thai in ('thieu_hang', 'chua_khop') and d.thoi_diem_ban <= v_kk.gui_luc;
    if v_n > 0 then
      raise exception 'Còn % dòng bán iPOS trước lúc gửi chưa trừ được kho (thiếu hàng / chưa ghép món) — xử lý ở Bán hàng iPOS rồi duyệt', v_n
        using errcode = 'check_violation';
    end if;
  end if;

  for v_d in select id from kho_kiem_ke_dong where kiem_ke_id = p_id order by thu_tu loop
    perform kho_dung_lai_ton(v_d.id);
  end loop;

  v_loai := case when v_vt.loai = 'quay' and v_kk.nguon_so_ban = 'kiem_ke' then 'ban' else 'kiem_ke' end;

  begin
    -- Phần thừa trước, phần thiếu sau — tồn không lúc nào âm giữa chừng.
    for v_r in
      select kl.lo_id, greatest(kl.so_goi_moi - kl.so_goi_so, 0) as g, greatest(kl.so_kg_moi - kl.so_kg_so, 0) as k
      from kho_kiem_ke_lo kl join kho_kiem_ke_dong d on d.id = kl.kiem_ke_dong_id
      where d.kiem_ke_id = p_id
        and (kl.so_goi_moi > kl.so_goi_so or kl.so_kg_moi > kl.so_kg_so)
    loop
      insert into kho_so_cai
        (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
         chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
      values
        (v_kk.chi_nhanh_id, v_r.lo_id, v_kk.vi_tri_id, (select mat_hang_id from kho_lo where id = v_r.lo_id),
         'kiem_ke', v_r.k, v_r.g, 'kiem_ke', p_id, v_nv.id, v_kk.ngay_kiem);
      v_so_lo := v_so_lo + 1;
    end loop;

    for v_r in
      select kl.lo_id, least(kl.so_goi_moi - kl.so_goi_so, 0) as g, least(kl.so_kg_moi - kl.so_kg_so, 0) as k
      from kho_kiem_ke_lo kl join kho_kiem_ke_dong d on d.id = kl.kiem_ke_dong_id
      where d.kiem_ke_id = p_id
        and (kl.so_goi_moi < kl.so_goi_so or kl.so_kg_moi < kl.so_kg_so)
    loop
      insert into kho_so_cai
        (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
         chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
      values
        (v_kk.chi_nhanh_id, v_r.lo_id, v_kk.vi_tri_id, (select mat_hang_id from kho_lo where id = v_r.lo_id),
         v_loai, v_r.k, v_r.g, 'kiem_ke', p_id, v_nv.id, v_kk.ngay_kiem);
      if v_loai = 'ban' then
        v_ban_g := v_ban_g - v_r.g;
        v_ban_k := v_ban_k - v_r.k;
      end if;
      v_so_lo := v_so_lo + 1;
    end loop;
  exception when check_violation then
    raise exception 'Không duyệt được: % — tồn đã thay đổi sau khi gửi kiểm kê. Bấm "Từ chối" để đếm lại.', sqlerrm
      using errcode = 'check_violation';
  end;

  update kho_kiem_ke set trang_thai = 'da_duyet', nguoi_duyet = v_nv.id, duyet_luc = now(),
                         phien_ban = phien_ban + 1
  where id = p_id;

  return 'Đã duyệt ' || v_kk.so_phieu || ': ' || v_so_lo || ' dòng điều chỉnh'
    || case when v_ban_g > 0 or v_ban_k > 0
            then ', ghi bán ' || v_ban_g || ' gói (' || replace(trim(to_char(v_ban_k, 'FM999999990.000')), '.', ',') || ' kg)'
            else '' end
    || '.';
end;
$$;


-- =============================================================================
-- 11 · SỰ KIỆN VÀ SỐ ĐỎ — thay THÂN (cùng chữ ký), chép 0033, thêm 0037
-- =============================================================================
--   ipos_cho_xu_ly    nhac_nho  quản lý, chủ (duyet): dòng bán iPOS chưa khớp /
--                               thiếu hàng.
--   ipos_mat_ket_noi  he_thong  quản lý, chủ: lượt cuối lỗi, hoặc > 30 phút không
--                               đồng bộ được trong giờ mở cửa.
-- Số đỏ mới: ipos_cho_xu_ly.
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
  'NỘI BỘ. 0037: thêm ipos_cho_xu_ly, ipos_mat_ket_noi. Mọi sự kiện thông báo người đang đăng nhập được thấy ở một chi nhánh, suy ra từ chứng từ. Gọi qua kho_dem_viec / kho_thong_bao.';

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
                         where chi_nhanh_id = p_chi_nhanh_id and trang_thai in ('chua_khop', 'thieu_hang')));
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
  'Mọi số đỏ trên menu kho của người đang đăng nhập ở một chi nhánh, trong MỘT lần gọi. Khóa nào không có quyền thì vắng mặt. Chỉ đếm, không tiền. duyet_nhap theo quyền duyet_nhap (0031); yeu_cau_quay, hang_dang_chuyen, hang_chuyen_qua_gio, chuyen_nhan_thieu (0032); thu_hoi_thap (0033); ipos_cho_xu_ly (0037).';


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_ipos_lay_lo(uuid, uuid, int, numeric) from authenticated';
    execute 'revoke execute on function kho_ipos_tu_nhan(uuid) from authenticated';
    execute 'revoke execute on function kho_ipos_dao_dong(uuid) from authenticated';
    execute 'revoke execute on function kho_ipos_ghi_dong(uuid) from authenticated';
    execute 'revoke execute on function kho_ipos_mat_ket_noi(kho_ipos_cau_hinh) from authenticated';
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
