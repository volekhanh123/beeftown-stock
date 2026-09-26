-- =============================================================================
-- BEEFTOWN KHO — 0032 · QUẦY: YÊU CẦU → MANG RA → XÁC NHẬN · ĐẾM QUẦY CỘNG DỒN · XUẤT KHÁC
-- =============================================================================
-- Chủ nhà hàng đã chốt (GĐ5b):
--
--   · Bổ sung quầy theo ba bước: NV quầy YÊU CẦU → thủ kho MANG RA → NV quầy
--     bấm ĐÃ NHẬN. Nhận thiếu thì báo quản lý.
--   · Không giảm giá hàng sắp hết hạn: gói nào hạn gần thì xếp ra bán trước
--     (phần gợi ý nằm ở web, lib/kho/trang-chu.ts).
--   · Đếm quầy cuối ngày bằng máy quét: quét từng nhãn, nhiều máy cùng quét
--     một phiếu thì số CỘNG DỒN, bấm hai lần không cộng đôi.
--   · Xuất khác (dùng nội bộ, tặng khách, hàng mẫu...) phải có lý do.
--
-- HÀNG ĐI ĐƯỜNG — mỗi chi nhánh có thêm một vị trí loại 'dang_chuyen' ("Đang
-- mang ra quầy"). Khi cài đặt chuyen_quay_can_nhan BẬT và người lập phiếu
-- chuyển kho → quầy KHÔNG phải NV quầy, hàng rời kho vào vị trí này (phiếu ở
-- trạng thái dang_chuyen), chưa vào quầy. NV quầy bấm nhận thì hàng mới vào
-- quầy. Nhờ vậy lúc đếm quầy không có hàng "trên bàn mà chưa có trên sổ".
--   dang_chuyen → (nhận đủ) da_nhan
--               → (nhận thiếu) nhan_thieu → (quản lý: trả về kho) da_tra_ve
--                                         → (quản lý: ghi mất)    da_nhan
--               → (người lập hủy, chưa ai nhận) da_huy — hàng về kho
-- NV quầy tự lấy hàng thì vào thẳng quầy như cũ. Cài đặt mặc định TẮT: mọi
-- phiếu chuyển y như trước (màn thiết lập GĐ5e sẽ bật).
-- "Đang mang ra quầy" không phải chỗ để hàng: không chọn làm nơi lấy / nơi
-- nhận, không kiểm kê, không trả nhà cung cấp, không pha lóc từ đó.
--
-- ĐẾM QUẦY CỘNG DỒN — mỗi lần bấm gửi từ máy quét là một LƯỢT (ma_gui riêng,
-- kho_kiem_ke_lan_quet), mỗi nhãn một dòng (kho_kiem_ke_quet). DATABASE giải
-- mã nhãn theo mẫu mã vạch trong Cài đặt (như lib/kho/ma-vach.ts), web gửi
-- nguyên chuỗi số quét được. Số gói của món = số nhãn + số gõ tay thêm
-- (kho_kiem_ke_dong.so_goi_them).
--
-- XUẤT KHÁC — loại phiếu và loại sổ mới 'xuat_khac', ghi sổ ngay, bắt buộc
-- lý do. Báo cáo hao hụt có nhóm riêng; kho_bao_cao_xnt_v2 có cột xuat_khac
-- và hao_hut (hàm cũ kho_bao_cao_xuat_nhap_ton giữ nguyên).
--
-- KHÔNG ĐỔI CHỮ KÝ HÀM CÔNG KHAI NÀO. Hàm có luật đổi được thay THÂN, chép
-- nguyên văn phần còn lại; chỗ đổi có ghi "0032".
-- =============================================================================


-- =============================================================================
-- 1 · VỊ TRÍ "ĐANG MANG RA QUẦY", CÀI ĐẶT, MẶT HÀNG, LÝ DO
-- =============================================================================
alter table kho_vi_tri drop constraint kho_vi_tri_loai_hop_le;
alter table kho_vi_tri add constraint kho_vi_tri_loai_hop_le
  check (loai in ('kho', 'quay', 'cho_huy', 'dang_chuyen'));
create unique index kho_vi_tri_dang_chuyen_idx on kho_vi_tri(chi_nhanh_id) where loai = 'dang_chuyen';

-- Chờ hủy và đang mang ra quầy là một phần của quy trình — không đổi loại,
-- không tắt được. Chép 0019, thêm dang_chuyen (0032).
create or replace function kho_vi_tri_kiem_sua()
returns trigger
language plpgsql
as $$
begin
  if new.chi_nhanh_id <> old.chi_nhanh_id then
    raise exception 'Không chuyển được vị trí kho sang chi nhánh khác'
      using errcode = 'check_violation';
  end if;
  if (old.loai = 'cho_huy' or new.loai = 'cho_huy') and new.loai <> old.loai then
    raise exception 'Không đổi được loại của vị trí chờ hủy'
      using errcode = 'check_violation';
  end if;
  if old.loai = 'cho_huy' and not new.dang_dung then
    raise exception 'Không tắt được vị trí chờ hủy — quy trình duyệt hủy cần nó'
      using errcode = 'check_violation';
  end if;
  -- 0032
  if (old.loai = 'dang_chuyen' or new.loai = 'dang_chuyen') and new.loai <> old.loai then
    raise exception 'Không đổi được loại của vị trí "Đang mang ra quầy"'
      using errcode = 'check_violation';
  end if;
  if old.loai = 'dang_chuyen' and not new.dang_dung then
    raise exception 'Không tắt được vị trí "Đang mang ra quầy" — việc mang hàng ra quầy cần nó'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Vị trí chờ hủy và đang mang ra quầy chỉ kho_khoi_tao() tạo.
drop policy kho_vi_tri_them on kho_vi_tri;
create policy kho_vi_tri_them on kho_vi_tri
  for insert with check (
    chi_nhanh_id = any ((select kho_cn_duoc('danh_muc'))::uuid[])
    and loai not in ('cho_huy', 'dang_chuyen'));

alter table kho_cai_dat
  add column chuyen_quay_can_nhan boolean not null default false;
comment on column kho_cai_dat.chuyen_quay_can_nhan is
  'Bật: thủ kho / quản lý mang hàng kho → quầy thì hàng nằm ở "Đang mang ra quầy" tới khi NV quầy bấm nhận. Tắt: vào thẳng quầy như trước. NV quầy tự lấy luôn vào thẳng.';

-- Tối thiểu / tối đa ở quầy tính theo GÓI (NV quầy đếm gói, không cân).
alter table kho_mat_hang
  add column quay_toi_thieu_goi int,
  add column quay_toi_da_goi    int;
alter table kho_mat_hang
  add constraint kho_mat_hang_quay_goi_hop_le check (
    (quay_toi_thieu_goi is null or quay_toi_thieu_goi between 0 and 100000)
    and (quay_toi_da_goi is null or quay_toi_da_goi between 1 and 100000)
    and (quay_toi_thieu_goi is null or quay_toi_da_goi is null or quay_toi_da_goi >= quay_toi_thieu_goi));
comment on column kho_mat_hang.quay_toi_thieu_goi is
  'Quầy còn ít hơn số gói này (tính cả hàng đang mang ra) thì gợi ý mang thêm. null = dùng ton_toi_thieu_kg.';
comment on column kho_mat_hang.quay_toi_da_goi is
  'Gợi ý mang ra cho đủ số gói này. null = cho đủ quay_toi_thieu_goi.';

alter table kho_ly_do drop constraint kho_ly_do_loai_hop_le;
alter table kho_ly_do add constraint kho_ly_do_loai_hop_le
  check (loai in ('huy', 'xuat_bep', 'dieu_chinh', 'xuat_khac'));


-- =============================================================================
-- 2 · YÊU CẦU MANG HÀNG RA QUẦY
-- =============================================================================
--   cho      NV quầy vừa gửi, chờ thủ kho
--   dang_lam thủ kho đã mang ra, hàng đang trên đường (chờ quầy bấm nhận)
--   xong     hàng đã vào quầy (hoặc chuyển thẳng khi cài đặt tắt)
--   huy      hủy (người lập đổi ý, hoặc kho không có hàng)
-- Không có tiền — mọi vai kho đọc được (xem).
create table kho_yeu_cau_quay (
  id            uuid primary key default gen_random_uuid(),
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  so_phieu      text not null,
  ma_gui        uuid not null,
  vi_tri_id     uuid not null references kho_vi_tri(id) on delete restrict,
  nguon         text not null default 'tay',
  trang_thai    text not null default 'cho',
  ghi_chu       text,
  nguoi_tao     uuid references nhan_su(id) on delete set null,
  nguoi_xu_ly   uuid references nhan_su(id) on delete set null,
  xu_ly_luc     timestamptz,
  ly_do_huy     text,
  nguoi_huy     uuid references nhan_su(id) on delete set null,
  huy_luc       timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint kho_yeu_cau_quay_so_duy_nhat     unique (chi_nhanh_id, so_phieu),
  constraint kho_yeu_cau_quay_ma_gui_duy_nhat unique (ma_gui),
  constraint kho_yeu_cau_quay_nguon_hop_le    check (nguon in ('tay', 'goi_y')),
  constraint kho_yeu_cau_quay_trang_thai_hop_le check (trang_thai in ('cho', 'dang_lam', 'xong', 'huy'))
);

create index kho_yeu_cau_quay_ds_idx on kho_yeu_cau_quay(chi_nhanh_id, created_at desc);
create index kho_yeu_cau_quay_cho_idx on kho_yeu_cau_quay(chi_nhanh_id) where trang_thai = 'cho';

create trigger kho_yeu_cau_quay_updated_at
  before update on kho_yeu_cau_quay
  for each row execute function tu_dong_cap_nhat_updated_at();

create table kho_yeu_cau_quay_dong (
  id            uuid primary key default gen_random_uuid(),
  yeu_cau_id    uuid not null references kho_yeu_cau_quay(id) on delete cascade,
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  thu_tu        int not null default 0,
  mat_hang_id   uuid not null references kho_mat_hang(id) on delete restrict,
  so_goi        int not null default 0,
  so_kg         numeric(12,3),
  ghi_chu       text,

  constraint kho_yeu_cau_quay_dong_so_hop_le check (so_goi >= 0 and (so_kg is null or so_kg > 0)),
  constraint kho_yeu_cau_quay_dong_duy_nhat unique (yeu_cau_id, mat_hang_id)
);

comment on table kho_yeu_cau_quay is
  'NV quầy yêu cầu mang hàng ra quầy (số YC-). Chỉ ghi qua kho_tao_yeu_cau / kho_huy_yeu_cau / kho_chuyen_theo_yeu_cau.';
comment on column kho_yeu_cau_quay_dong.so_goi is 'Số gói cần (mặt hàng đếm gói). Mặt hàng theo kg dùng so_kg.';


-- =============================================================================
-- 3 · PHIẾU XUẤT: HÀNG ĐI ĐƯỜNG, XUẤT KHÁC · SỔ KHO: LOẠI xuat_khac
-- =============================================================================
alter table kho_phieu_xuat drop constraint kho_phieu_xuat_loai_hop_le;
alter table kho_phieu_xuat add constraint kho_phieu_xuat_loai_hop_le
  check (loai in ('chuyen', 'xuat_bep', 'huy', 'tra_ncc', 'xuat_khac'));
alter table kho_phieu_xuat drop constraint kho_phieu_xuat_trang_thai_hop_le;
alter table kho_phieu_xuat add constraint kho_phieu_xuat_trang_thai_hop_le
  check (trang_thai in ('da_ghi', 'cho_duyet', 'da_duyet', 'tu_choi',
                        'dang_chuyen', 'da_nhan', 'nhan_thieu', 'da_tra_ve', 'da_huy'));

alter table kho_phieu_xuat
  add column yeu_cau_id   uuid references kho_yeu_cau_quay(id) on delete restrict,
  add column nguoi_nhan   uuid references nhan_su(id) on delete set null,
  add column nhan_luc     timestamptz,
  add column nhan_ma_gui  uuid,
  add column xu_ly_thieu  text,
  add column ly_do_xu_ly  text,
  add column nguoi_xu_ly  uuid references nhan_su(id) on delete set null,
  add column xu_ly_luc    timestamptz;
alter table kho_phieu_xuat
  add constraint kho_phieu_xuat_nhan_ma_gui_duy_nhat unique (nhan_ma_gui),
  add constraint kho_phieu_xuat_xu_ly_thieu_hop_le check (xu_ly_thieu is null or xu_ly_thieu in ('tra_ve', 'mat')),
  add constraint kho_phieu_xuat_di_duong_hop_le check (
    trang_thai not in ('dang_chuyen', 'da_nhan', 'nhan_thieu', 'da_tra_ve', 'da_huy') or loai = 'chuyen');

create index kho_phieu_xuat_di_duong_idx on kho_phieu_xuat(chi_nhanh_id)
  where trang_thai in ('dang_chuyen', 'nhan_thieu');

comment on column kho_phieu_xuat.yeu_cau_id is 'Phiếu chuyển lập từ yêu cầu của quầy (kho_chuyen_theo_yeu_cau).';
comment on column kho_phieu_xuat.nhan_ma_gui is 'ma_gui của lần bấm nhận — bấm hai lần không nhận hai lần.';
comment on column kho_phieu_xuat.xu_ly_thieu is 'Quản lý xử lý phần nhận thiếu: tra_ve (về kho) | mat (ghi hao hụt).';

alter table kho_phieu_xuat_dong
  add column so_goi_nhan int,
  add column so_kg_nhan  numeric(12,3);
alter table kho_phieu_xuat_dong
  add constraint kho_phieu_xuat_dong_nhan_hop_le check (
    (so_goi_nhan is null or so_goi_nhan >= 0) and (so_kg_nhan is null or so_kg_nhan >= 0));
comment on column kho_phieu_xuat_dong.so_goi_nhan is 'Hàng đi đường: số gói quầy xác nhận đã nhận. null = chưa nhận / không đi đường.';

-- Tiền lệ 0024:30-39: dựng lại hai CHECK của sổ kho với loại mới.
alter table kho_so_cai drop constraint kho_so_cai_loai_hop_le;
alter table kho_so_cai add constraint kho_so_cai_loai_hop_le check (loai in (
  'nhap', 'pha_loc_vao', 'pha_loc_ra', 'chuyen_di', 'chuyen_den',
  'ban', 'xuat_bep', 'huy', 'kiem_ke', 'hao_hut', 'dao_nguoc', 'tra_ncc', 'xuat_khac'));
alter table kho_so_cai drop constraint kho_so_cai_dau_hop_le;
alter table kho_so_cai add constraint kho_so_cai_dau_hop_le check (
  (loai in ('nhap', 'pha_loc_ra', 'chuyen_den') and so_kg >= 0 and so_goi >= 0)
  or (loai in ('pha_loc_vao', 'chuyen_di', 'ban', 'xuat_bep', 'huy', 'tra_ncc', 'xuat_khac') and so_kg <= 0 and so_goi <= 0)
  or loai in ('kiem_ke', 'hao_hut', 'dao_nguoc')
);


-- =============================================================================
-- 4 · "ĐANG MANG RA QUẦY" KHÔNG PHẢI CHỖ ĐỂ HÀNG
-- =============================================================================
-- Một trigger canh ở mọi chứng từ chọn vị trí: phiếu xuất / trả NCC (nơi lấy,
-- nơi nhận), phiếu kiểm kê, dòng vào/ra của phiên pha lóc. Hàng chỉ vào / ra
-- vị trí đi đường qua sổ kho của phiếu chuyển.
create or replace function kho_chan_vi_tri_di_duong()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_dong jsonb := to_jsonb(new);   -- bảng nào cũng đọc được, kể cả khi không có cột nơi nhận
begin
  if exists (select 1 from kho_vi_tri v
             where v.id in ((v_dong ->> 'vi_tri_id')::uuid, (v_dong ->> 'vi_tri_den_id')::uuid)
               and v.loai = 'dang_chuyen') then
    raise exception '"Đang mang ra quầy" không phải chỗ để hàng — chọn kho hoặc quầy'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger kho_phieu_xuat_chan_di_duong
  before insert or update of vi_tri_id, vi_tri_den_id on kho_phieu_xuat
  for each row execute function kho_chan_vi_tri_di_duong();
create trigger kho_kiem_ke_chan_di_duong
  before insert or update of vi_tri_id on kho_kiem_ke
  for each row execute function kho_chan_vi_tri_di_duong();
create trigger kho_phien_pha_vao_chan_di_duong
  before insert or update of vi_tri_id on kho_phien_pha_vao
  for each row execute function kho_chan_vi_tri_di_duong();
create trigger kho_phien_pha_ra_chan_di_duong
  before insert or update of vi_tri_id on kho_phien_pha_ra
  for each row execute function kho_chan_vi_tri_di_duong();


-- =============================================================================
-- 5 · KHỞI TẠO — thêm vị trí đi đường và lý do xuất khác, bù cho chi nhánh cũ
-- =============================================================================
-- Chép 0019; phần thêm có ghi 0032. Gọi lại vẫn chỉ tạo thứ còn thiếu.
create or replace function kho_khoi_tao(p_chi_nhanh_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tao   int := 0;
  v_so    int;
  v_kho   uuid;
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không được khởi tạo kho'
      using errcode = 'insufficient_privilege';
  end if;

  insert into kho_cai_dat (chi_nhanh_id) values (p_chi_nhanh_id)
  on conflict (chi_nhanh_id) do nothing;
  get diagnostics v_so = row_count;
  v_tao := v_tao + v_so;

  if not exists (select 1 from kho_vi_tri where chi_nhanh_id = p_chi_nhanh_id and loai = 'kho') then
    insert into kho_vi_tri (chi_nhanh_id, ten, loai, thu_tu)
    values (p_chi_nhanh_id, 'Kho lạnh', 'kho', 1);
    v_tao := v_tao + 1;
  end if;
  if not exists (select 1 from kho_vi_tri where chi_nhanh_id = p_chi_nhanh_id and loai = 'quay') then
    insert into kho_vi_tri (chi_nhanh_id, ten, loai, thu_tu)
    values (p_chi_nhanh_id, 'Quầy thịt', 'quay', 2);
    v_tao := v_tao + 1;
  end if;
  if not exists (select 1 from kho_vi_tri where chi_nhanh_id = p_chi_nhanh_id and loai = 'cho_huy') then
    insert into kho_vi_tri (chi_nhanh_id, ten, loai, thu_tu)
    values (p_chi_nhanh_id, 'Hàng chờ hủy', 'cho_huy', 9);
    v_tao := v_tao + 1;
  end if;
  -- 0032: hàng thủ kho đang mang ra, quầy chưa bấm nhận.
  if not exists (select 1 from kho_vi_tri where chi_nhanh_id = p_chi_nhanh_id and loai = 'dang_chuyen') then
    insert into kho_vi_tri (chi_nhanh_id, ten, loai, thu_tu)
    values (p_chi_nhanh_id, 'Đang mang ra quầy', 'dang_chuyen', 8);
    v_tao := v_tao + 1;
  end if;

  select id into v_kho from kho_vi_tri
  where chi_nhanh_id = p_chi_nhanh_id and loai = 'kho' and dang_dung
  order by thu_tu, created_at limit 1;

  update kho_cai_dat set vi_tri_nhan_hang_id = v_kho
  where chi_nhanh_id = p_chi_nhanh_id and vi_tri_nhan_hang_id is null;

  if not exists (select 1 from kho_ly_do) then
    insert into kho_ly_do (loai, ten, can_anh, thu_tu) values
      ('huy',        'Hết hạn dùng',           true,  1),
      ('huy',        'Biến màu, có mùi',       true,  2),
      ('huy',        'Rơi, dập, nhiễm bẩn',    true,  3),
      ('huy',        'Bao bì hỏng, hở khí',    true,  4),
      ('huy',        'Khác',                   true,  9),
      ('xuat_bep',   'Gần hết hạn',            false, 1),
      ('xuat_bep',   'Làm món ở bếp',          false, 2),
      ('xuat_bep',   'Cơm nhân viên',          false, 3),
      ('xuat_bep',   'Khác',                   false, 9),
      ('dieu_chinh', 'Chênh lệch kiểm kê',     false, 1),
      ('dieu_chinh', 'Nhập sai',               false, 2);
    v_tao := v_tao + 11;
  end if;
  -- 0032
  if not exists (select 1 from kho_ly_do where loai = 'xuat_khac') then
    insert into kho_ly_do (loai, ten, can_anh, thu_tu) values
      ('xuat_khac', 'Dùng nội bộ', false, 1),
      ('xuat_khac', 'Tặng khách',  false, 2),
      ('xuat_khac', 'Hàng mẫu',    false, 3),
      ('xuat_khac', 'Khác',        false, 9);
    v_tao := v_tao + 4;
  end if;

  return v_tao;
end;
$$;

comment on function kho_khoi_tao is
  'Bắt đầu dùng kho cho một chi nhánh: cài đặt, bốn vị trí (kho lạnh, quầy, đang mang ra quầy, chờ hủy), lý do mặc định. Gọi lại an toàn — chỉ tạo thứ còn thiếu.';

-- Bù cho chi nhánh đã khởi tạo trước 0032.
insert into kho_vi_tri (chi_nhanh_id, ten, loai, thu_tu)
select c.chi_nhanh_id, 'Đang mang ra quầy', 'dang_chuyen', 8
from kho_cai_dat c
where not exists (select 1 from kho_vi_tri v where v.chi_nhanh_id = c.chi_nhanh_id and v.loai = 'dang_chuyen')
on conflict do nothing;

insert into kho_ly_do (loai, ten, can_anh, thu_tu)
select x.loai, x.ten, false, x.thu_tu
from (values ('xuat_khac', 'Dùng nội bộ', 1), ('xuat_khac', 'Tặng khách', 2),
             ('xuat_khac', 'Hàng mẫu', 3), ('xuat_khac', 'Khác', 9)) as x(loai, ten, thu_tu)
where exists (select 1 from kho_ly_do)
  and not exists (select 1 from kho_ly_do where loai = 'xuat_khac');


-- =============================================================================
-- 6 · CÔNG TẮC "QUẦY PHẢI BẤM NHẬN" — qua kho_luu_nguong (cùng chữ ký)
-- =============================================================================
-- Chép 0030; thêm khóa chuyen_quay_can_nhan nhận true/false (0032).
create or replace function kho_luu_nguong(p_chi_nhanh_id uuid, p_nguong jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_khoa text;
  v_so   numeric;
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

  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
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
end;
$$;

comment on function kho_luu_nguong is
  'Lưu các ngưỡng cảnh báo của chi nhánh (quyền danh_muc). Chỉ nhận các khóa đã biết, giá trị là số; chuyen_quay_can_nhan (0032) là true/false. Ràng buộc CHECK của bảng giữ khoảng hợp lệ.';


-- =============================================================================
-- 7 · LẬP PHIẾU XUẤT — thân chuyển vào kho_ghi_phieu_xuat (nội bộ)
-- =============================================================================
-- Chép kho_tao_phieu_xuat của 0023; chỗ đổi (0032): loại xuat_khac (bắt buộc
-- lý do, số XK-, ghi sổ 'xuat_khac', chỉ hàng còn hạn); hàng đi đường; không
-- chọn "Đang mang ra quầy" làm nơi lấy / nơi nhận; gắn yêu cầu của quầy.
create or replace function kho_ghi_phieu_xuat(
  p_chi_nhanh_id  uuid,
  p_ma_gui        uuid,
  p_loai          text,
  p_vi_tri_id     uuid,
  p_vi_tri_den_id uuid,
  p_ly_do_id      uuid,
  p_ghi_chu       text,
  p_anh           text[],
  p_dong          jsonb,
  p_yeu_cau_id    uuid
)
returns table (phieu_id uuid, so_phieu text, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv      nhan_su;
  v_id      uuid;
  v_so      text;
  v_vt      kho_vi_tri;
  v_den     kho_vi_tri;
  v_cho     uuid;
  v_ld      kho_ly_do;
  v_anh     text;
  v_dong    jsonb;
  v_khoa    text;
  v_i       int := 0;
  v_mh      kho_mat_hang;
  v_lo      kho_lo;
  v_goi     int;
  v_kg      numeric;
  v_kg_do   numeric;
  v_con_han boolean;
  v_pb      record;
  v_tong_g  int;
  v_tong_k  numeric;
  v_cd      kho_cai_dat;
  v_dc      uuid;
  v_di_duong boolean := false;
  c_uuid    constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not kho_duoc(p_chi_nhanh_id, 'van_hanh') then
    raise exception 'Tài khoản của bạn không được chuyển, xuất hay báo hủy hàng'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();

  select * into v_cd from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;

  select px.id, px.so_phieu into v_id, v_so from kho_phieu_xuat px where px.ma_gui = p_ma_gui;
  if found then
    return query select v_id, v_so, true;
    return;
  end if;

  if p_loai is null or p_loai not in ('chuyen', 'xuat_bep', 'huy', 'xuat_khac') then
    raise exception 'Loại phiếu không hợp lệ' using errcode = 'check_violation';
  end if;

  select * into v_vt from kho_vi_tri where id = p_vi_tri_id;
  if not found or v_vt.chi_nhanh_id <> p_chi_nhanh_id or v_vt.loai in ('cho_huy', 'dang_chuyen') or not v_vt.dang_dung then
    raise exception 'Chọn nơi lấy hàng là một kho hoặc quầy đang dùng' using errcode = 'check_violation';
  end if;

  if p_loai = 'chuyen' then
    select * into v_den from kho_vi_tri where id = p_vi_tri_den_id;
    if not found or v_den.chi_nhanh_id <> p_chi_nhanh_id or v_den.loai in ('cho_huy', 'dang_chuyen') or not v_den.dang_dung then
      raise exception 'Chọn nơi nhận là một kho hoặc quầy đang dùng' using errcode = 'check_violation';
    end if;
    if v_den.id = v_vt.id then
      raise exception 'Nơi lấy và nơi nhận phải khác nhau' using errcode = 'check_violation';
    end if;
  elsif p_vi_tri_den_id is not null then
    raise exception 'Chỉ phiếu chuyển mới có nơi nhận' using errcode = 'check_violation';
  end if;

  if p_ly_do_id is not null then
    select * into v_ld from kho_ly_do where id = p_ly_do_id;
    if not found or not v_ld.dang_dung or v_ld.loai <> p_loai then
      raise exception 'Lý do không hợp lệ cho loại phiếu này' using errcode = 'check_violation';
    end if;
  end if;
  if p_loai = 'huy' and p_ly_do_id is null then
    raise exception 'Báo hủy phải chọn lý do' using errcode = 'check_violation';
  end if;
  -- 0032
  if p_loai = 'xuat_khac' and p_ly_do_id is null then
    raise exception 'Xuất khác phải chọn lý do (dùng nội bộ, tặng khách...)' using errcode = 'check_violation';
  end if;

  if coalesce(array_length(p_anh, 1), 0) > 0 and p_loai <> 'huy' then
    raise exception 'Chỉ phiếu báo hủy mới kèm ảnh' using errcode = 'check_violation';
  end if;
  if coalesce(array_length(p_anh, 1), 0) > 8 then
    raise exception 'Tối đa 8 ảnh' using errcode = 'check_violation';
  end if;
  foreach v_anh in array coalesce(p_anh, '{}'::text[]) loop
    if v_anh not like p_chi_nhanh_id::text || '/huy/%' or v_anh like '%..%' then
      raise exception 'Đường dẫn ảnh không thuộc chi nhánh này' using errcode = 'check_violation';
    end if;
  end loop;
  if p_loai = 'huy' and v_ld.can_anh and coalesce(array_length(p_anh, 1), 0) = 0 then
    raise exception 'Lý do "%" cần ít nhất một ảnh chụp hàng', v_ld.ten using errcode = 'check_violation';
  end if;

  if p_dong is null or jsonb_typeof(p_dong) <> 'array' or jsonb_array_length(p_dong) = 0 then
    raise exception 'Phiếu chưa có dòng hàng nào' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_dong) > 200 then
    raise exception 'Tối đa 200 dòng một phiếu' using errcode = 'check_violation';
  end if;

  if p_loai = 'huy' then
    select id into v_cho from kho_vi_tri where chi_nhanh_id = p_chi_nhanh_id and loai = 'cho_huy';
    if v_cho is null then
      raise exception 'Chi nhánh chưa có vị trí "Hàng chờ hủy"' using errcode = 'check_violation';
    end if;
  end if;

  -- Đưa ra quầy, xuất bếp, xuất khác (0032): chỉ lấy hàng còn hạn.
  v_con_han := (p_loai in ('xuat_bep', 'xuat_khac')) or (p_loai = 'chuyen' and v_den.loai = 'quay');

  -- 0032 · HÀNG ĐI ĐƯỜNG: kho → quầy, cài đặt bật, người lập không phải NV
  -- quầy → hàng nằm ở "Đang mang ra quầy" tới khi quầy bấm nhận.
  v_di_duong := p_loai = 'chuyen' and v_vt.loai = 'kho' and v_den.loai = 'quay'
                and v_cd.chuyen_quay_can_nhan and v_nv.vai_tro is distinct from 'nhan_vien_quay';
  if v_di_duong then
    select id into v_dc from kho_vi_tri where chi_nhanh_id = p_chi_nhanh_id and loai = 'dang_chuyen';
    if v_dc is null then
      raise exception 'Chi nhánh chưa có vị trí "Đang mang ra quầy" — quản lý mở Cài đặt kho, bấm Khởi tạo'
        using errcode = 'check_violation';
    end if;
  end if;

  insert into kho_phieu_xuat
    (chi_nhanh_id, so_phieu, ma_gui, loai, vi_tri_id, vi_tri_den_id, ly_do_id,
     ghi_chu, anh, trang_thai, nguoi_tao, yeu_cau_id)
  values
    (p_chi_nhanh_id,
     kho_sinh_so(p_chi_nhanh_id, case p_loai when 'chuyen' then 'XC' when 'xuat_bep' then 'XB'
                                             when 'xuat_khac' then 'XK' else 'XH' end),
     p_ma_gui, p_loai, v_vt.id, v_den.id, p_ly_do_id,
     nullif(btrim(p_ghi_chu), ''), coalesce(p_anh, '{}'),
     case when p_loai = 'huy' then 'cho_duyet' when v_di_duong then 'dang_chuyen' else 'da_ghi' end,
     v_nv.id, p_yeu_cau_id)
  returning kho_phieu_xuat.id, kho_phieu_xuat.so_phieu into v_id, v_so;

  for v_dong in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if v_khoa <> all (array['mat_hang_id', 'lo_id', 'so_goi', 'so_kg']) then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
      end if;
    end loop;
    if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string' or (v_dong ->> 'mat_hang_id') !~* c_uuid then
      raise exception 'Dòng %: chưa chọn mặt hàng', v_i using errcode = 'check_violation';
    end if;
    select * into v_mh from kho_mat_hang where id = (v_dong ->> 'mat_hang_id')::uuid;
    if not found then
      raise exception 'Dòng %: mặt hàng không có', v_i using errcode = 'check_violation';
    end if;

    v_lo := null;
    if v_dong ? 'lo_id' and v_dong -> 'lo_id' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'lo_id') <> 'string' or (v_dong ->> 'lo_id') !~* c_uuid then
        raise exception 'Dòng % (%): lô không hợp lệ', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      select * into v_lo from kho_lo where id = (v_dong ->> 'lo_id')::uuid;
      if v_lo.id is null or v_lo.chi_nhanh_id <> p_chi_nhanh_id or v_lo.mat_hang_id <> v_mh.id then
        raise exception 'Dòng % (%): lô không thuộc mặt hàng này', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      if v_con_han and v_lo.han_dung < hom_nay_vn() then
        raise exception 'Lô % đã hết hạn — không % được. Hàng hết hạn thì báo hủy.', v_lo.ma_lo,
          case when p_loai = 'xuat_bep' then 'xuất bếp' else 'đưa ra quầy' end
          using errcode = 'check_violation';
      end if;
    end if;

    v_goi := 0;
    if v_dong ? 'so_goi' and v_dong -> 'so_goi' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi') <> 'number'
         or (v_dong ->> 'so_goi')::numeric <> trunc((v_dong ->> 'so_goi')::numeric)
         or (v_dong ->> 'so_goi')::numeric < 0 or (v_dong ->> 'so_goi')::numeric > 100000 then
        raise exception 'Dòng % (%): số % phải là số nguyên không âm', v_i, v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi')::int;
    end if;
    v_kg := null;
    if v_dong ? 'so_kg' and v_dong -> 'so_kg' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_kg') <> 'number' then
        raise exception 'Dòng % (%): số kg không hợp lệ', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      v_kg := (v_dong ->> 'so_kg')::numeric;
      if v_kg <= 0 or v_kg >= 1000000 or v_kg <> round(v_kg, 3) then
        raise exception 'Dòng % (%): số kg phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
    end if;

    if v_mh.dem_goi then
      if v_goi = 0 then
        raise exception 'Dòng % (%): chưa nhập số %', v_i, v_mh.ten, v_mh.don_vi_goi using errcode = 'check_violation';
      end if;
      v_kg_do := v_kg;
    else
      if v_kg is null then
        raise exception 'Dòng % (%): chưa nhập số kg', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      v_kg_do := null;
    end if;

    v_tong_g := 0;
    v_tong_k := 0;
    for v_pb in
      select * from kho_phan_bo(v_vt.id, v_mh.id, v_lo.id, v_goi, v_kg, v_con_han)
    loop
      if p_loai in ('xuat_bep', 'xuat_khac') then
        insert into kho_so_cai
          (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
           chung_tu_loai, chung_tu_id, nguoi_ghi)
        values
          (p_chi_nhanh_id, v_pb.lo_id, v_vt.id, v_mh.id, p_loai, -v_pb.so_kg, -v_pb.so_goi,
           'phieu_xuat', v_id, v_nv.id);
      else
        insert into kho_so_cai
          (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
           chung_tu_loai, chung_tu_id, nguoi_ghi)
        values
          (p_chi_nhanh_id, v_pb.lo_id, v_vt.id, v_mh.id, 'chuyen_di', -v_pb.so_kg, -v_pb.so_goi,
           'phieu_xuat', v_id, v_nv.id);
        insert into kho_so_cai
          (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
           chung_tu_loai, chung_tu_id, nguoi_ghi)
        values
          (p_chi_nhanh_id, v_pb.lo_id, coalesce(v_dc, v_den.id, v_cho), v_mh.id, 'chuyen_den', v_pb.so_kg, v_pb.so_goi,
           'phieu_xuat', v_id, v_nv.id);
      end if;
      v_tong_g := v_tong_g + v_pb.so_goi;
      v_tong_k := v_tong_k + v_pb.so_kg;
    end loop;

    insert into kho_phieu_xuat_dong
      (phieu_xuat_id, chi_nhanh_id, thu_tu, mat_hang_id, lo_id, so_goi, so_kg, so_kg_do)
    values
      (v_id, p_chi_nhanh_id, v_i, v_mh.id, v_lo.id, v_tong_g, v_tong_k, v_kg_do);
  end loop;

  return query select v_id, v_so, false;
end;
$$;


comment on function kho_ghi_phieu_xuat is
  'NỘI BỘ. Thân của kho_tao_phieu_xuat (0032): chuyển (có thể đi đường), xuất bếp, xuất khác, báo hủy. p_yeu_cau_id: phiếu lập từ yêu cầu của quầy.';

-- p_dong: [{mat_hang_id, lo_id?, so_goi?, so_kg?}] — xem kho_ghi_phieu_xuat.
create or replace function kho_tao_phieu_xuat(
  p_chi_nhanh_id  uuid,
  p_ma_gui        uuid,
  p_loai          text,
  p_vi_tri_id     uuid,
  p_vi_tri_den_id uuid,
  p_ly_do_id      uuid,
  p_ghi_chu       text,
  p_anh           text[],
  p_dong          jsonb
)
returns table (phieu_id uuid, so_phieu text, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select g.phieu_id, g.so_phieu, g.da_co
    from kho_ghi_phieu_xuat(p_chi_nhanh_id, p_ma_gui, p_loai, p_vi_tri_id, p_vi_tri_den_id,
                            p_ly_do_id, p_ghi_chu, p_anh, p_dong, null) g;
end;
$$;

comment on function kho_tao_phieu_xuat is
  'Lập phiếu chuyển / xuất bếp / xuất khác (ghi sổ ngay; chuyển kho → quầy có thể thành hàng đi đường khi bật chuyen_quay_can_nhan) hoặc báo hủy (chờ quản lý duyệt). Chọn lô hạn gần trước.';


-- =============================================================================
-- 8 · YÊU CẦU CỦA QUẦY
-- =============================================================================
-- p_dong: [{mat_hang_id, so_goi?, so_kg?, ghi_chu?}]
--   mặt hàng đếm gói: so_goi > 0.   mặt hàng theo kg: so_kg > 0.
-- p_vi_tri_id null = quầy đầu tiên của chi nhánh. p_nguon: tay | goi_y.
create or replace function kho_tao_yeu_cau(
  p_chi_nhanh_id uuid,
  p_ma_gui       uuid,
  p_vi_tri_id    uuid,
  p_nguon        text,
  p_ghi_chu      text,
  p_dong         jsonb
)
returns table (yeu_cau_id uuid, so_phieu text, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv    nhan_su;
  v_id    uuid;
  v_so    text;
  v_vt    kho_vi_tri;
  v_dong  jsonb;
  v_khoa  text;
  v_i     int := 0;
  v_mh    kho_mat_hang;
  v_goi   int;
  v_kg    numeric;
  c_uuid  constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not kho_duoc(p_chi_nhanh_id, 'van_hanh') then
    raise exception 'Tài khoản của bạn không được yêu cầu mang hàng ra quầy'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;

  select y.id, y.so_phieu into v_id, v_so from kho_yeu_cau_quay y where y.ma_gui = p_ma_gui;
  if found then
    return query select v_id, v_so, true;
    return;
  end if;

  if coalesce(p_nguon, 'tay') not in ('tay', 'goi_y') then
    raise exception 'Nguồn yêu cầu không hợp lệ' using errcode = 'check_violation';
  end if;
  if p_vi_tri_id is null then
    select * into v_vt from kho_vi_tri
    where chi_nhanh_id = p_chi_nhanh_id and loai = 'quay' and dang_dung
    order by thu_tu, created_at limit 1;
  else
    select * into v_vt from kho_vi_tri where id = p_vi_tri_id;
  end if;
  if v_vt.id is null or v_vt.chi_nhanh_id <> p_chi_nhanh_id or v_vt.loai <> 'quay' or not v_vt.dang_dung then
    raise exception 'Chọn quầy cần hàng' using errcode = 'check_violation';
  end if;

  if p_dong is null or jsonb_typeof(p_dong) <> 'array' or jsonb_array_length(p_dong) = 0 then
    raise exception 'Yêu cầu chưa có món nào' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_dong) > 100 then
    raise exception 'Tối đa 100 món một yêu cầu' using errcode = 'check_violation';
  end if;

  insert into kho_yeu_cau_quay (chi_nhanh_id, so_phieu, ma_gui, vi_tri_id, nguon, ghi_chu, nguoi_tao)
  values (p_chi_nhanh_id, kho_sinh_so(p_chi_nhanh_id, 'YC'), p_ma_gui, v_vt.id, coalesce(p_nguon, 'tay'),
          nullif(btrim(left(p_ghi_chu, 500)), ''), v_nv.id)
  returning kho_yeu_cau_quay.id, kho_yeu_cau_quay.so_phieu into v_id, v_so;

  for v_dong in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if v_khoa <> all (array['mat_hang_id', 'so_goi', 'so_kg', 'ghi_chu']) then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
      end if;
    end loop;
    if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string' or (v_dong ->> 'mat_hang_id') !~* c_uuid then
      raise exception 'Dòng %: chưa chọn món', v_i using errcode = 'check_violation';
    end if;
    select * into v_mh from kho_mat_hang where id = (v_dong ->> 'mat_hang_id')::uuid;
    if not found or not v_mh.dang_dung then
      raise exception 'Dòng %: món không có hoặc đã ngừng dùng', v_i using errcode = 'check_violation';
    end if;

    v_goi := 0;
    if v_dong ? 'so_goi' and v_dong -> 'so_goi' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi') <> 'number'
         or (v_dong ->> 'so_goi')::numeric <> trunc((v_dong ->> 'so_goi')::numeric)
         or (v_dong ->> 'so_goi')::numeric < 0 or (v_dong ->> 'so_goi')::numeric > 100000 then
        raise exception '"%": số % phải là số nguyên không âm', v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi')::int;
    end if;
    v_kg := null;
    if v_dong ? 'so_kg' and v_dong -> 'so_kg' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_kg') <> 'number' then
        raise exception '"%": số kg không hợp lệ', v_mh.ten using errcode = 'check_violation';
      end if;
      v_kg := (v_dong ->> 'so_kg')::numeric;
      if v_kg <= 0 or v_kg >= 1000000 or v_kg <> round(v_kg, 3) then
        raise exception '"%": số kg phải lớn hơn 0, tối đa 3 số lẻ', v_mh.ten using errcode = 'check_violation';
      end if;
    end if;
    if v_mh.dem_goi and v_goi = 0 then
      raise exception '"%": chưa nhập số %', v_mh.ten, v_mh.don_vi_goi using errcode = 'check_violation';
    end if;
    if not v_mh.dem_goi and v_kg is null then
      raise exception '"%": chưa nhập số kg', v_mh.ten using errcode = 'check_violation';
    end if;

    begin
      insert into kho_yeu_cau_quay_dong (yeu_cau_id, chi_nhanh_id, thu_tu, mat_hang_id, so_goi, so_kg, ghi_chu)
      values (v_id, p_chi_nhanh_id, v_i, v_mh.id, case when v_mh.dem_goi then v_goi else 0 end,
              case when v_mh.dem_goi then null else v_kg end,
              nullif(btrim(left(v_dong ->> 'ghi_chu', 200)), ''));
    exception when unique_violation then
      raise exception '"%" bị nhập hai lần', v_mh.ten using errcode = 'check_violation';
    end;
  end loop;

  return query select v_id, v_so, false;
end;
$$;

comment on function kho_tao_yeu_cau is
  'NV quầy yêu cầu mang hàng ra quầy (số YC-). Chống trùng bằng p_ma_gui. p_dong: [{mat_hang_id, so_goi | so_kg, ghi_chu?}].';

create or replace function kho_huy_yeu_cau(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_yc kho_yeu_cau_quay;
begin
  select * into v_yc from kho_yeu_cau_quay where id = p_id;
  if not found or not kho_duoc(v_yc.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy yêu cầu, hoặc tài khoản không được hủy'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_yc from kho_yeu_cau_quay where id = p_id for update;
  if v_yc.trang_thai = 'huy' then
    return 'Yêu cầu ' || v_yc.so_phieu || ' đã hủy trước đó.';
  end if;
  if v_yc.trang_thai <> 'cho' then
    raise exception 'Yêu cầu % đã được mang ra — không hủy được nữa', v_yc.so_phieu
      using errcode = 'check_violation';
  end if;
  update kho_yeu_cau_quay set
    trang_thai = 'huy', ly_do_huy = nullif(btrim(left(p_ly_do, 500)), ''),
    nguoi_huy = (nhan_su_hien_tai()).id, huy_luc = now()
  where id = p_id;
  return 'Đã hủy yêu cầu ' || v_yc.so_phieu || '.';
end;
$$;

comment on function kho_huy_yeu_cau is 'Hủy một yêu cầu của quầy khi chưa ai mang ra (quyền van_hanh).';

-- GỢI Ý MANG RA QUẦY — SECURITY INVOKER (RLS của người gọi). Món dưới mức:
--   có quay_toi_thieu_goi: gói còn hạn ở quầy + gói đang mang ra < tối thiểu
--                          → đề nghị đủ tới quay_toi_da_goi (không có thì tới tối thiểu)
--   không có, có ton_toi_thieu_kg: kg tương tự → đề nghị theo kg (mặt hàng đếm
--                          gói thì đổi ra gói theo kg trung bình một gói ở kho)
-- Đề nghị không vượt số còn hạn ở kho. Món kho đã hết vẫn liệt kê (đề nghị 0)
-- để quầy biết mà báo quản lý.
create or replace function kho_goi_y_ra_quay(p_chi_nhanh_id uuid, p_vi_tri_id uuid)
returns table (
  mat_hang_id uuid, ma text, ten text, nhom text, dem_goi boolean, don_vi_goi text,
  quay_toi_thieu_goi int, quay_toi_da_goi int, ton_toi_thieu_kg numeric,
  so_goi_quay int, so_kg_quay numeric,
  so_goi_dang_mang int, so_kg_dang_mang numeric,
  so_goi_kho int, so_kg_kho numeric,
  so_goi_de_nghi int, so_kg_de_nghi numeric
)
language sql
stable
set search_path = public
as $$
  with quay as (
    select t.mat_hang_id, sum(t.so_goi)::int as goi, sum(t.so_kg) as kg
    from kho_v_ton t
    where t.chi_nhanh_id = p_chi_nhanh_id and t.loai_vi_tri = 'quay' and t.tinh_trang_han <> 'het_han'
      and (p_vi_tri_id is null or t.vi_tri_id = p_vi_tri_id)
    group by t.mat_hang_id
  ),
  kho as (
    select t.mat_hang_id, sum(t.so_goi)::int as goi, sum(t.so_kg) as kg
    from kho_v_ton t
    where t.chi_nhanh_id = p_chi_nhanh_id and t.loai_vi_tri = 'kho' and t.tinh_trang_han <> 'het_han'
    group by t.mat_hang_id
  ),
  dang as (
    select s.mat_hang_id, sum(s.so_goi)::int as goi, sum(s.so_kg) as kg
    from kho_phieu_xuat x
    join kho_so_cai s on s.chung_tu_loai = 'phieu_xuat' and s.chung_tu_id = x.id
    join kho_vi_tri v on v.id = s.vi_tri_id and v.loai = 'dang_chuyen'
    where x.chi_nhanh_id = p_chi_nhanh_id and x.trang_thai = 'dang_chuyen'
      and (p_vi_tri_id is null or x.vi_tri_den_id = p_vi_tri_id)
    group by s.mat_hang_id
  ),
  x as (
    select m.*,
           coalesce(q.goi, 0) as q_goi, coalesce(q.kg, 0) as q_kg,
           coalesce(d.goi, 0) as d_goi, coalesce(d.kg, 0) as d_kg,
           coalesce(k.goi, 0) as k_goi, coalesce(k.kg, 0) as k_kg,
           k.kg / nullif(k.goi, 0) as k_tb
    from kho_mat_hang m
    left join quay q on q.mat_hang_id = m.id
    left join dang d on d.mat_hang_id = m.id
    left join kho k on k.mat_hang_id = m.id
    where m.dang_dung
      and case
            when m.dem_goi and m.quay_toi_thieu_goi is not null
              then coalesce(q.goi, 0) + coalesce(d.goi, 0) < m.quay_toi_thieu_goi
            when m.ton_toi_thieu_kg is not null
              then coalesce(q.kg, 0) + coalesce(d.kg, 0) < m.ton_toi_thieu_kg
            else false
          end
  )
  select x.id, x.ma, x.ten, x.nhom, x.dem_goi, x.don_vi_goi,
         x.quay_toi_thieu_goi, x.quay_toi_da_goi, x.ton_toi_thieu_kg,
         x.q_goi, x.q_kg, x.d_goi, x.d_kg, x.k_goi, x.k_kg,
         case
           when not x.dem_goi then null
           when x.quay_toi_thieu_goi is not null
             then least(greatest(coalesce(x.quay_toi_da_goi, x.quay_toi_thieu_goi) - x.q_goi - x.d_goi, 0), x.k_goi)
           when x.k_tb > 0
             then least(ceil((x.ton_toi_thieu_kg - x.q_kg - x.d_kg) / x.k_tb)::int, x.k_goi)
           else 0
         end,
         case when x.dem_goi then null
              else least(greatest(x.ton_toi_thieu_kg - x.q_kg - x.d_kg, 0), x.k_kg) end
  from x
  order by x.loai, x.thu_tu, x.ten
$$;

comment on function kho_goi_y_ra_quay is
  'Món ở quầy dưới mức (theo gói: quay_toi_thieu_goi, không có thì ton_toi_thieu_kg), kèm số đang mang ra, số còn hạn ở kho và số đề nghị mang ra. SECURITY INVOKER, không có tiền.';


-- =============================================================================
-- 9 · MANG RA QUẦY, NHẬN, XỬ LÝ THIẾU, HỦY CHUYẾN
-- =============================================================================
-- Hàng CÒN TRÊN ĐƯỜNG của một phiếu chuyển, theo lô: cộng mọi dòng sổ của
-- phiếu ở vị trí đi đường (vào +, nhận / trả về / mất −). Không đọc kho_ton
-- của vị trí đó — hai phiếu có thể chở cùng một lô.
create or replace function kho_chuyen_tren_duong(p_id uuid)
returns table (lo_id uuid, mat_hang_id uuid, so_goi int, so_kg numeric, han_dung date, lo_tao_luc timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.lo_id, l.mat_hang_id, sum(s.so_goi)::int, sum(s.so_kg), l.han_dung, l.created_at
  from kho_so_cai s
  join kho_lo l on l.id = s.lo_id
  join kho_vi_tri v on v.id = s.vi_tri_id
  where s.chung_tu_loai = 'phieu_xuat' and s.chung_tu_id = p_id and v.loai = 'dang_chuyen'
  group by s.lo_id, l.mat_hang_id, l.han_dung, l.created_at
  having sum(s.so_goi) > 0 or sum(s.so_kg) > 0
$$;

-- Đưa hết hàng còn trên đường của phiếu về nơi lấy (hủy chuyến, trả về kho)
-- hoặc ghi mất. Trả số gói, kg đã xử lý.
create or replace function kho_don_tren_duong(p_id uuid, p_cach text, p_ghi_chu text)
returns table (so_goi int, so_kg numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_px kho_phieu_xuat;
  v_nv nhan_su;
  v_dc uuid;
  v_r  record;
  v_g  int := 0;
  v_k  numeric := 0;
begin
  select * into v_px from kho_phieu_xuat where id = p_id;
  select id into v_dc from kho_vi_tri where chi_nhanh_id = v_px.chi_nhanh_id and loai = 'dang_chuyen';
  v_nv := nhan_su_hien_tai();
  for v_r in select * from kho_chuyen_tren_duong(p_id) t order by t.han_dung, t.lo_tao_luc, t.lo_id loop
    if p_cach = 'mat' then
      insert into kho_so_cai
        (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
         chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi)
      values
        (v_px.chi_nhanh_id, v_r.lo_id, v_dc, v_r.mat_hang_id, 'hao_hut', -v_r.so_kg, -v_r.so_goi,
         'phieu_xuat', p_id, p_ghi_chu, v_nv.id);
    else
      insert into kho_so_cai
        (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
         chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi)
      values
        (v_px.chi_nhanh_id, v_r.lo_id, v_dc, v_r.mat_hang_id, 'chuyen_di', -v_r.so_kg, -v_r.so_goi,
         'phieu_xuat', p_id, p_ghi_chu, v_nv.id);
      insert into kho_so_cai
        (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
         chung_tu_loai, chung_tu_id, ghi_chu, nguoi_ghi)
      values
        (v_px.chi_nhanh_id, v_r.lo_id, v_px.vi_tri_id, v_r.mat_hang_id, 'chuyen_den', v_r.so_kg, v_r.so_goi,
         'phieu_xuat', p_id, p_ghi_chu, v_nv.id);
    end if;
    v_g := v_g + v_r.so_goi;
    v_k := v_k + v_r.so_kg;
  end loop;
  return query select v_g, v_k;
end;
$$;

-- Thủ kho mang hàng ra theo yêu cầu. p_dong null = đúng như yêu cầu; hoặc
-- [{mat_hang_id, lo_id?, so_goi?, so_kg?}] khi kho không đủ / chọn lô.
-- p_vi_tri_id null = kho nhận hàng mặc định trong Cài đặt.
create or replace function kho_chuyen_theo_yeu_cau(
  p_id        uuid,
  p_ma_gui    uuid,
  p_vi_tri_id uuid,
  p_dong      jsonb
)
returns table (phieu_id uuid, so_phieu text, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_yc    kho_yeu_cau_quay;
  v_cd    kho_cai_dat;
  v_id    uuid;
  v_so    text;
  v_nguon uuid;
  v_dong  jsonb;
  v_tt    text;
begin
  select * into v_yc from kho_yeu_cau_quay where id = p_id;
  if not found or not kho_duoc(v_yc.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy yêu cầu, hoặc tài khoản không được mang hàng ra quầy'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_yc.chi_nhanh_id for update;

  select px.id, px.so_phieu into v_id, v_so from kho_phieu_xuat px where px.ma_gui = p_ma_gui;
  if found then
    return query select v_id, v_so, true;
    return;
  end if;

  select * into v_yc from kho_yeu_cau_quay where id = p_id for update;
  if v_yc.trang_thai <> 'cho' then
    raise exception 'Yêu cầu % %', v_yc.so_phieu,
      case v_yc.trang_thai when 'huy' then 'đã hủy' else 'đã có người mang ra rồi' end
      using errcode = 'check_violation';
  end if;

  v_nguon := coalesce(p_vi_tri_id, v_cd.vi_tri_nhan_hang_id,
    (select v.id from kho_vi_tri v where v.chi_nhanh_id = v_yc.chi_nhanh_id and v.loai = 'kho' and v.dang_dung
      order by v.thu_tu, v.created_at limit 1));

  if p_dong is null then
    select jsonb_agg(case when m.dem_goi
                          then jsonb_build_object('mat_hang_id', d.mat_hang_id, 'so_goi', d.so_goi)
                          else jsonb_build_object('mat_hang_id', d.mat_hang_id, 'so_kg', d.so_kg) end
                     order by d.thu_tu)
      into v_dong
    from kho_yeu_cau_quay_dong d join kho_mat_hang m on m.id = d.mat_hang_id
    where d.yeu_cau_id = p_id;
  else
    v_dong := p_dong;
  end if;

  select g.phieu_id, g.so_phieu into v_id, v_so
  from kho_ghi_phieu_xuat(v_yc.chi_nhanh_id, p_ma_gui, 'chuyen', v_nguon, v_yc.vi_tri_id, null,
                          'Theo yêu cầu ' || v_yc.so_phieu, '{}', v_dong, v_yc.id) g;

  select px.trang_thai into v_tt from kho_phieu_xuat px where px.id = v_id;
  update kho_yeu_cau_quay set
    trang_thai = case when v_tt = 'dang_chuyen' then 'dang_lam' else 'xong' end,
    nguoi_xu_ly = (nhan_su_hien_tai()).id, xu_ly_luc = now()
  where id = p_id;

  return query select v_id, v_so, false;
end;
$$;

comment on function kho_chuyen_theo_yeu_cau is
  'Thủ kho mang hàng ra quầy theo yêu cầu: lập phiếu chuyển (đi đường nếu bật chuyen_quay_can_nhan). p_dong null = đúng như yêu cầu.';

-- Quầy bấm nhận hàng đang mang ra. p_dong null = nhận đủ; hoặc
-- [{mat_hang_id, so_goi?, so_kg?}] = số THỰC NHẬN của những món thiếu (món
-- không có trong danh sách = nhận đủ). Lấy từ chính các lô đi đường của phiếu,
-- lô hạn gần trước. Thiếu → nhan_thieu, báo quản lý.
create or replace function kho_nhan_hang_chuyen(p_id uuid, p_ma_gui uuid, p_dong jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_px    kho_phieu_xuat;
  v_nv    nhan_su;
  v_dc    uuid;
  v_m     record;
  v_r     record;
  v_d     record;
  v_e     jsonb;
  v_dong  jsonb;
  v_khoa  text;
  v_mh    kho_mat_hang;
  v_can   numeric;
  v_het   boolean;
  v_g     int;
  v_k     numeric;
  v_tg    int;
  v_tk    numeric;
  v_nhan_g int := 0;
  v_nhan_k numeric := 0;
  v_con_g int;
  v_con_k numeric;
  v_i     int := 0;
  c_uuid  constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  select * into v_px from kho_phieu_xuat where id = p_id;
  if not found or v_px.loai <> 'chuyen' or not kho_duoc(v_px.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy phiếu mang ra quầy, hoặc tài khoản không được nhận hàng'
      using errcode = 'insufficient_privilege';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = v_px.chi_nhanh_id for update;
  select * into v_px from kho_phieu_xuat where id = p_id for update;

  if v_px.nhan_ma_gui = p_ma_gui then
    return 'Đã ghi nhận hàng của phiếu ' || v_px.so_phieu || '.';
  end if;
  if v_px.trang_thai in ('da_nhan', 'nhan_thieu', 'da_tra_ve') then
    raise exception 'Phiếu % đã có người bấm nhận rồi', v_px.so_phieu using errcode = 'check_violation';
  end if;
  if v_px.trang_thai = 'da_huy' then
    raise exception 'Phiếu % đã hủy — hàng đã về kho', v_px.so_phieu using errcode = 'check_violation';
  end if;
  if v_px.trang_thai <> 'dang_chuyen' then
    raise exception 'Phiếu % không phải hàng đang mang ra quầy', v_px.so_phieu using errcode = 'check_violation';
  end if;
  v_nv := nhan_su_hien_tai();
  if v_nv.id is not null and v_nv.id = v_px.nguoi_tao then
    raise exception 'Người mang hàng ra không tự bấm nhận — nhờ nhân viên quầy kiểm và bấm'
      using errcode = 'check_violation';
  end if;

  -- Kiểm danh sách thực nhận.
  if p_dong is not null and jsonb_typeof(p_dong) <> 'array' then
    raise exception 'Danh sách hàng nhận không hợp lệ' using errcode = 'check_violation';
  end if;
  v_dong := coalesce(p_dong, '[]'::jsonb);
  for v_e in select value from jsonb_array_elements(v_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_e) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_e) loop
      if v_khoa <> all (array['mat_hang_id', 'so_goi', 'so_kg']) then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
      end if;
    end loop;
    if jsonb_typeof(v_e -> 'mat_hang_id') is distinct from 'string' or (v_e ->> 'mat_hang_id') !~* c_uuid
       or not exists (select 1 from kho_phieu_xuat_dong d where d.phieu_xuat_id = p_id
                       and d.mat_hang_id = (v_e ->> 'mat_hang_id')::uuid) then
      raise exception 'Dòng %: món này không có trong phiếu %', v_i, v_px.so_phieu using errcode = 'check_violation';
    end if;
    if (select count(*) from jsonb_array_elements(v_dong) x where x ->> 'mat_hang_id' = v_e ->> 'mat_hang_id') > 1 then
      raise exception 'Dòng %: món bị nhập hai lần', v_i using errcode = 'check_violation';
    end if;
  end loop;

  select id into v_dc from kho_vi_tri where chi_nhanh_id = v_px.chi_nhanh_id and loai = 'dang_chuyen';

  for v_m in
    select t.mat_hang_id, sum(t.so_goi)::int as goi, sum(t.so_kg) as kg
    from kho_chuyen_tren_duong(p_id) t group by t.mat_hang_id
  loop
    select * into v_mh from kho_mat_hang where id = v_m.mat_hang_id;
    select x.value into v_e from jsonb_array_elements(v_dong) x
    where x.value ->> 'mat_hang_id' = v_m.mat_hang_id::text;

    -- Số thực nhận của món này; không ghi = nhận đủ.
    if v_mh.dem_goi then
      v_can := v_m.goi;
      if v_e is not null and v_e ? 'so_goi' and v_e -> 'so_goi' <> 'null'::jsonb then
        if jsonb_typeof(v_e -> 'so_goi') <> 'number'
           or (v_e ->> 'so_goi')::numeric <> trunc((v_e ->> 'so_goi')::numeric)
           or (v_e ->> 'so_goi')::numeric < 0 then
          raise exception '"%": số % nhận phải là số nguyên không âm', v_mh.ten, v_mh.don_vi_goi
            using errcode = 'check_violation';
        end if;
        v_can := (v_e ->> 'so_goi')::numeric;
      end if;
      if v_can > v_m.goi then
        raise exception '"%": nhận % % nhưng phiếu chỉ mang ra % %', v_mh.ten, v_can, v_mh.don_vi_goi,
          v_m.goi, v_mh.don_vi_goi using errcode = 'check_violation';
      end if;
      v_het := v_can = v_m.goi;
    else
      v_can := v_m.kg;
      if v_e is not null and v_e ? 'so_kg' and v_e -> 'so_kg' <> 'null'::jsonb then
        if jsonb_typeof(v_e -> 'so_kg') <> 'number' or (v_e ->> 'so_kg')::numeric < 0
           or (v_e ->> 'so_kg')::numeric <> round((v_e ->> 'so_kg')::numeric, 3) then
          raise exception '"%": số kg nhận không hợp lệ', v_mh.ten using errcode = 'check_violation';
        end if;
        v_can := (v_e ->> 'so_kg')::numeric;
      end if;
      if v_can > v_m.kg then
        raise exception '"%": nhận % kg nhưng phiếu chỉ mang ra % kg', v_mh.ten,
          replace(v_can::text, '.', ','), replace(v_m.kg::text, '.', ',') using errcode = 'check_violation';
      end if;
      v_het := v_can = v_m.kg;
    end if;

    -- Chuyển từ đi đường vào quầy, lô hạn gần trước. Nhận đủ thì chuyển nguyên
    -- từng lô (không để lại lẻ kg).
    v_tg := 0;
    v_tk := 0;
    for v_r in
      select * from kho_chuyen_tren_duong(p_id) t where t.mat_hang_id = v_m.mat_hang_id
      order by t.han_dung, t.lo_tao_luc, t.lo_id
    loop
      exit when not v_het and v_can <= 0;
      if v_het then
        v_g := v_r.so_goi;
        v_k := v_r.so_kg;
      elsif v_mh.dem_goi then
        v_g := least(v_r.so_goi, v_can::int);
        v_k := case when v_g = v_r.so_goi then v_r.so_kg else round(v_r.so_kg * v_g / nullif(v_r.so_goi, 0), 3) end;
        v_can := v_can - v_g;
      else
        v_k := least(v_r.so_kg, v_can);
        v_g := case when v_k = v_r.so_kg then v_r.so_goi else 0 end;
        v_can := v_can - v_k;
      end if;
      continue when v_g = 0 and coalesce(v_k, 0) = 0;
      insert into kho_so_cai
        (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
         chung_tu_loai, chung_tu_id, nguoi_ghi)
      values
        (v_px.chi_nhanh_id, v_r.lo_id, v_dc, v_r.mat_hang_id, 'chuyen_di', -v_k, -v_g,
         'phieu_xuat', p_id, v_nv.id);
      insert into kho_so_cai
        (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
         chung_tu_loai, chung_tu_id, nguoi_ghi)
      values
        (v_px.chi_nhanh_id, v_r.lo_id, v_px.vi_tri_den_id, v_r.mat_hang_id, 'chuyen_den', v_k, v_g,
         'phieu_xuat', p_id, v_nv.id);
      v_tg := v_tg + v_g;
      v_tk := v_tk + v_k;
    end loop;

    -- Ghi số thực nhận lên các dòng của món (thường chỉ một dòng).
    for v_d in
      select d.id, d.so_goi, d.so_kg,
             row_number() over (order by d.thu_tu desc, d.id desc) = 1 as cuoi
      from kho_phieu_xuat_dong d
      where d.phieu_xuat_id = p_id and d.mat_hang_id = v_m.mat_hang_id
      order by d.thu_tu, d.id
    loop
      v_g := case when v_d.cuoi then v_tg else least(v_d.so_goi, v_tg) end;
      v_k := case when v_d.cuoi then v_tk else least(v_d.so_kg, v_tk) end;
      update kho_phieu_xuat_dong set so_goi_nhan = v_g, so_kg_nhan = v_k where id = v_d.id;
      v_tg := v_tg - v_g;
      v_tk := v_tk - v_k;
    end loop;
  end loop;

  select coalesce(sum(t.so_goi), 0)::int, coalesce(sum(t.so_kg), 0)
    into v_con_g, v_con_k
  from kho_chuyen_tren_duong(p_id) t;
  select coalesce(sum(d.so_goi_nhan), 0)::int, coalesce(sum(d.so_kg_nhan), 0)
    into v_nhan_g, v_nhan_k
  from kho_phieu_xuat_dong d where d.phieu_xuat_id = p_id;

  update kho_phieu_xuat set
    trang_thai = case when v_con_g > 0 or v_con_k > 0 then 'nhan_thieu' else 'da_nhan' end,
    nguoi_nhan = v_nv.id, nhan_luc = now(), nhan_ma_gui = p_ma_gui
  where id = p_id;
  if v_px.yeu_cau_id is not null then
    update kho_yeu_cau_quay set trang_thai = 'xong' where id = v_px.yeu_cau_id and trang_thai = 'dang_lam';
  end if;

  if v_con_g > 0 or v_con_k > 0 then
    return 'Đã nhận ' || v_px.so_phieu || ': ' || v_nhan_g || ' gói. Thiếu ' || v_con_g || ' gói ('
      || replace(trim(to_char(v_con_k, 'FM999999990.000')), '.', ',') || ' kg) — đã báo quản lý.';
  end if;
  return 'Đã nhận đủ ' || v_px.so_phieu || ': ' || v_nhan_g || ' gói ('
    || replace(trim(to_char(v_nhan_k, 'FM999999990.000')), '.', ',') || ' kg).';
end;
$$;

comment on function kho_nhan_hang_chuyen is
  'Quầy xác nhận đã nhận hàng đang mang ra. p_dong null = nhận đủ; [{mat_hang_id, so_goi | so_kg}] = số thực nhận của món thiếu. Thiếu → nhan_thieu (báo quản lý). Chống bấm hai lần bằng p_ma_gui.';

-- Quản lý xử lý phần nhận thiếu: tra_ve = hàng còn ở kho (về lại nơi lấy),
-- mat = rơi vỡ / thất lạc (ghi sổ hao hụt, bắt buộc lý do).
create or replace function kho_xu_ly_chuyen_thieu(p_id uuid, p_cach text, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_px kho_phieu_xuat;
  v_x  record;
begin
  select * into v_px from kho_phieu_xuat where id = p_id;
  if not found or v_px.loai <> 'chuyen' or not kho_duoc(v_px.chi_nhanh_id, 'duyet') then
    raise exception 'Không tìm thấy phiếu chuyển, hoặc tài khoản không được xử lý hàng thiếu'
      using errcode = 'insufficient_privilege';
  end if;
  if p_cach is null or p_cach not in ('tra_ve', 'mat') then
    raise exception 'Chọn "trả về kho" hoặc "ghi mất"' using errcode = 'check_violation';
  end if;
  if p_cach = 'mat' and coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Ghi lý do mất hàng (rơi vỡ, thất lạc...)' using errcode = 'check_violation';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = v_px.chi_nhanh_id for update;
  select * into v_px from kho_phieu_xuat where id = p_id for update;
  if v_px.xu_ly_thieu = p_cach then
    return 'Phiếu ' || v_px.so_phieu || ' đã được xử lý trước đó.';
  end if;
  if v_px.trang_thai <> 'nhan_thieu' then
    raise exception 'Phiếu % không có hàng thiếu cần xử lý', v_px.so_phieu using errcode = 'check_violation';
  end if;

  select * into v_x from kho_don_tren_duong(p_id, p_cach,
    case when p_cach = 'mat' then 'Mất khi mang ra quầy: ' || btrim(left(p_ly_do, 200))
         else 'Nhận thiếu — trả về kho' end);

  update kho_phieu_xuat set
    trang_thai = case when p_cach = 'tra_ve' then 'da_tra_ve' else 'da_nhan' end,
    xu_ly_thieu = p_cach, ly_do_xu_ly = nullif(btrim(left(p_ly_do, 500)), ''),
    nguoi_xu_ly = (nhan_su_hien_tai()).id, xu_ly_luc = now()
  where id = p_id;

  return case when p_cach = 'tra_ve'
              then 'Đã trả ' || v_x.so_goi || ' gói thiếu của ' || v_px.so_phieu || ' về kho.'
              else 'Đã ghi mất ' || v_x.so_goi || ' gói ('
                   || replace(trim(to_char(v_x.so_kg, 'FM999999990.000')), '.', ',') || ' kg) của ' || v_px.so_phieu || '.'
         end;
end;
$$;

comment on function kho_xu_ly_chuyen_thieu is
  'Quản lý (duyet) xử lý phiếu nhận thiếu: p_cach tra_ve (hàng về nơi lấy → da_tra_ve) | mat (ghi hao hụt, bắt buộc lý do → da_nhan).';

-- Người lập (hoặc quản lý) hủy chuyến khi quầy chưa bấm nhận: hàng về lại
-- nơi lấy, yêu cầu của quầy (nếu có) quay về chờ.
create or replace function kho_huy_chuyen(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_px kho_phieu_xuat;
  v_nv nhan_su;
  v_x  record;
begin
  select * into v_px from kho_phieu_xuat where id = p_id;
  if not found or v_px.loai <> 'chuyen' or not kho_duoc(v_px.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy phiếu chuyển, hoặc tài khoản không được hủy'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();
  if v_nv.id is distinct from v_px.nguoi_tao and not kho_duoc(v_px.chi_nhanh_id, 'duyet') then
    raise exception 'Chỉ người mang hàng ra (hoặc quản lý) hủy được chuyến này'
      using errcode = 'insufficient_privilege';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = v_px.chi_nhanh_id for update;
  select * into v_px from kho_phieu_xuat where id = p_id for update;
  if v_px.trang_thai = 'da_huy' then
    return 'Phiếu ' || v_px.so_phieu || ' đã hủy trước đó.';
  end if;
  if v_px.trang_thai <> 'dang_chuyen' then
    raise exception 'Phiếu % không còn đang mang ra — không hủy được', v_px.so_phieu
      using errcode = 'check_violation';
  end if;

  select * into v_x from kho_don_tren_duong(p_id, 'tra_ve', 'Hủy chuyến — hàng về lại chỗ cũ');

  update kho_phieu_xuat set
    trang_thai = 'da_huy', ly_do_xu_ly = nullif(btrim(left(p_ly_do, 500)), ''),
    nguoi_xu_ly = v_nv.id, xu_ly_luc = now()
  where id = p_id;
  if v_px.yeu_cau_id is not null then
    update kho_yeu_cau_quay set trang_thai = 'cho', nguoi_xu_ly = null, xu_ly_luc = null
    where id = v_px.yeu_cau_id and trang_thai = 'dang_lam';
  end if;

  return 'Đã hủy ' || v_px.so_phieu || ' — ' || v_x.so_goi || ' gói đã về lại chỗ cũ.';
end;
$$;

comment on function kho_huy_chuyen is
  'Hủy phiếu chuyển đang mang ra (quầy chưa bấm nhận): hàng về nơi lấy, trạng thái da_huy. Người lập hoặc quyền duyet.';


-- =============================================================================
-- 10 · ĐẾM QUẦY CỘNG DỒN BẰNG MÁY QUÉT
-- =============================================================================
-- Một LƯỢT = một lần bấm gửi từ một máy (ma_gui duy nhất). Gửi lại cùng lượt
-- (mạng chập chờn, bấm hai lần) không cộng thêm. Lượt 'bo' ghi lại các lần
-- bấm −1 / bỏ lượt / xóa món, cũng để bấm hai lần không trừ hai lần.
create table kho_kiem_ke_lan_quet (
  id           uuid primary key default gen_random_uuid(),
  kiem_ke_id   uuid not null references kho_kiem_ke(id) on delete cascade,
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  ma_gui       uuid not null,
  loai         text not null default 'quet',
  cach         text,
  mat_hang_id  uuid references kho_mat_hang(id) on delete restrict,
  so_nhan      int not null default 0,
  loi          jsonb not null default '[]',
  nguoi        uuid references nhan_su(id) on delete set null,
  bo_luc       timestamptz,
  created_at   timestamptz not null default clock_timestamp(),
  -- Thứ tự ghi thật: đồng hồ có thể trùng tới micro giây (PGlite còn thô hơn),
  -- nên "lượt sau cùng" sắp theo cột này, không theo created_at.
  thu_tu       bigint generated always as identity,

  constraint kho_kiem_ke_lan_quet_ma_gui_duy_nhat unique (ma_gui),
  constraint kho_kiem_ke_lan_quet_loai_hop_le check (loai in ('quet', 'bo')),
  constraint kho_kiem_ke_lan_quet_cach_hop_le check (
    (loai = 'quet' and cach is null) or (loai = 'bo' and cach in ('lan_cuoi', 'bot_mot', 'xoa_mon')))
);

create index kho_kiem_ke_lan_quet_phieu_idx on kho_kiem_ke_lan_quet(kiem_ke_id, created_at);

-- Một dòng cho mỗi nhãn đã quét. Hai gói cùng món cùng cân nặng in ra cùng
-- một mã — vẫn là hai dòng.
create table kho_kiem_ke_quet (
  id           uuid primary key default gen_random_uuid(),
  kiem_ke_id   uuid not null references kho_kiem_ke(id) on delete cascade,
  lan_quet_id  uuid not null references kho_kiem_ke_lan_quet(id) on delete cascade,
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  mat_hang_id  uuid not null references kho_mat_hang(id) on delete restrict,
  ma           text not null,
  so_kg        numeric(12,3),
  created_at   timestamptz not null default clock_timestamp(),
  thu_tu       bigint generated always as identity,   -- "nhãn sau cùng" cho nút −1 (xem lan_quet)

  constraint kho_kiem_ke_quet_ma_hop_le check (ma ~ '^[0-9]{13}$'),
  constraint kho_kiem_ke_quet_kg_hop_le check (so_kg is null or so_kg > 0)
);

create index kho_kiem_ke_quet_phieu_idx on kho_kiem_ke_quet(kiem_ke_id, mat_hang_id, created_at);

alter table kho_kiem_ke_dong
  add column so_goi_them int not null default 0,
  add column tu_quet     boolean not null default false;
alter table kho_kiem_ke_dong
  add constraint kho_kiem_ke_dong_them_hop_le check (so_goi_them >= 0);

comment on table kho_kiem_ke_quet is
  'Từng nhãn đã quét khi đếm (0032). Chỉ ghi qua kho_quet_kiem_ke / kho_bo_quet_kiem_ke.';
comment on column kho_kiem_ke_dong.so_goi_them is
  'Món có quét nhãn: số gói gõ tay THÊM (gói không có nhãn). so_goi_dem = số nhãn + so_goi_them.';
comment on column kho_kiem_ke_dong.tu_quet is 'Số đếm của dòng này tính từ nhãn đã quét.';

-- Đọc một mã vạch nhãn cân theo mẫu — bản SQL của docMaVach (lib/kho/ma-vach.ts).
-- Trả mã cân (đã bỏ số 0 đầu), kg (mẫu có W), hoặc câu lỗi.
create or replace function kho_doc_ma_vach(p_ma text, p_mau text, p_so_le int)
returns table (ma_can text, so_kg numeric, loi text)
language plpgsql
immutable
set search_path = public
as $$
declare
  s     text := btrim(coalesce(p_ma, ''));
  v_c   text := '';
  v_w   text := '';
  v_tong int := 0;
  v_k   text;
  i     int;
begin
  if p_mau is null or char_length(p_mau) <> 13
     or p_mau !~ '^[0-9X]*C{1,6}[0-9X]*(W{3,6}|P{3,7})[0-9X]*K$' then
    return query select null::text, null::numeric, 'Mẫu mã vạch trong Cài đặt không hợp lệ';
    return;
  end if;
  if s !~ '^[0-9]{13}$' then
    return query select null::text, null::numeric, 'Không phải mã 13 số';
    return;
  end if;
  for i in 1..12 loop
    v_tong := v_tong + (substr(s, i, 1)::int) * (case when i % 2 = 1 then 1 else 3 end);
  end loop;
  if (10 - v_tong % 10) % 10 <> substr(s, 13, 1)::int then
    return query select null::text, null::numeric, 'Sai số kiểm tra — quét lại';
    return;
  end if;
  for i in 1..13 loop
    v_k := substr(p_mau, i, 1);
    if v_k ~ '[0-9]' then
      if substr(s, i, 1) <> v_k then
        return query select null::text, null::numeric, 'Không phải nhãn cân (đầu mã không khớp mẫu)';
        return;
      end if;
    elsif v_k = 'C' then
      v_c := v_c || substr(s, i, 1);
    elsif v_k = 'W' then
      v_w := v_w || substr(s, i, 1);
    end if;
  end loop;
  v_c := ltrim(v_c, '0');
  if v_c = '' then
    return query select null::text, null::numeric, 'Mã hàng trên nhãn bằng 0';
    return;
  end if;
  if v_w <> '' and v_w::numeric = 0 then
    return query select null::text, null::numeric, 'Trọng lượng trên nhãn bằng 0';
    return;
  end if;
  return query select v_c,
    case when v_w = '' then null else round(v_w::numeric / power(10, coalesce(p_so_le, 3))::numeric, 3) end,
    null::text;
end;
$$;

comment on function kho_doc_ma_vach is
  'NỘI BỘ. Đọc mã EAN-13 nhãn cân theo mẫu (như docMaVach ở web): mã cân, kg hoặc câu lỗi.';

-- Dựng lại số đếm của các món có quét: so_goi_dem = số nhãn + so_goi_them;
-- kg = tổng kg trên nhãn khi mọi gói đều có nhãn có kg (có gói gõ tay thêm thì
-- để trống, lúc duyệt ước theo kg trung bình). Món theo kg: kg = tổng nhãn.
-- Món hết nhãn (bỏ lượt, −1) thì trả về số gõ tay, hoặc "chưa đếm".
create or replace function kho_kiem_ke_tinh_quet(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk  kho_kiem_ke;
  v_max int;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  select coalesce(max(thu_tu), 0) into v_max from kho_kiem_ke_dong where kiem_ke_id = p_id;

  insert into kho_kiem_ke_dong (kiem_ke_id, chi_nhanh_id, thu_tu, mat_hang_id)
  select p_id, v_kk.chi_nhanh_id, v_max + row_number() over (order by min(q.thu_tu)), q.mat_hang_id
  from kho_kiem_ke_quet q
  where q.kiem_ke_id = p_id
    and not exists (select 1 from kho_kiem_ke_dong d
                     where d.kiem_ke_id = p_id and d.mat_hang_id = q.mat_hang_id and d.lo_id is null)
  group by q.mat_hang_id;

  update kho_kiem_ke_dong d set
    so_goi_dem   = case when m.dem_goi then x.n + d.so_goi_them else null end,
    so_kg_dem    = case when not m.dem_goi then x.kg
                        when d.so_goi_them = 0 and x.n_kg = x.n then x.kg
                        else null end,
    xac_nhan_het = false,
    tu_quet      = true
  from (select q.mat_hang_id, count(*)::int as n, count(q.so_kg)::int as n_kg, sum(q.so_kg) as kg
          from kho_kiem_ke_quet q where q.kiem_ke_id = p_id group by q.mat_hang_id) x,
       kho_mat_hang m
  where d.kiem_ke_id = p_id and d.lo_id is null and d.mat_hang_id = x.mat_hang_id and m.id = d.mat_hang_id;

  update kho_kiem_ke_dong d set
    so_goi_dem = nullif(d.so_goi_them, 0), so_kg_dem = null, so_goi_them = 0, tu_quet = false
  where d.kiem_ke_id = p_id and d.tu_quet
    and not exists (select 1 from kho_kiem_ke_quet q where q.kiem_ke_id = p_id and q.mat_hang_id = d.mat_hang_id);
end;
$$;

-- Danh sách chạy cho màn đếm: các món đã quét, món vừa quét lên đầu.
create or replace function kho_kiem_ke_ds_quet(p_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'mat_hang_id', d.mat_hang_id, 'ten', m.ten, 'don_vi_goi', m.don_vi_goi, 'dem_goi', m.dem_goi,
           'so_nhan', coalesce(x.n, 0), 'so_goi_them', d.so_goi_them,
           'so_goi_dem', d.so_goi_dem, 'so_kg_dem', d.so_kg_dem)
         order by x.lan_cuoi desc nulls last, d.thu_tu), '[]'::jsonb)
  from kho_kiem_ke_dong d
  join kho_mat_hang m on m.id = d.mat_hang_id
  left join (select q.mat_hang_id, count(*)::int as n, max(q.created_at) as lan_cuoi
               from kho_kiem_ke_quet q where q.kiem_ke_id = p_id group by q.mat_hang_id) x
         on x.mat_hang_id = d.mat_hang_id
  where d.kiem_ke_id = p_id and d.lo_id is null and (d.tu_quet or d.so_goi_them > 0)
$$;

-- p_ma: mảng CHUỖI SỐ THÔ đúng như máy quét gửi (["2012345012509", ...]),
-- tối đa 300 nhãn một lượt. Database giải mã theo mẫu trong Cài đặt. Nhãn đọc
-- không được thì trả trong "loi", các nhãn khác vẫn được cộng.
-- Trả: {da_co, so_nhan, loi: [{ma, loi}], phien_ban, mon: [...]}.
create or replace function kho_quet_kiem_ke(p_id uuid, p_ma_gui uuid, p_ma jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk   kho_kiem_ke;
  v_cd   kho_cai_dat;
  v_lan  kho_kiem_ke_lan_quet;
  v_nv   nhan_su;
  v_x    jsonb;
  v_ma   text;
  v_doc  record;
  v_mh   kho_mat_hang;
  v_loi  jsonb := '[]';
  v_n    int := 0;
  v_pb   int;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được kiểm kê'
      using errcode = 'insufficient_privilege';
  end if;
  -- Khóa phiếu: hai máy quét cùng lúc thì lần lượt, không mất lượt nào.
  select * into v_kk from kho_kiem_ke where id = p_id for update;

  select * into v_lan from kho_kiem_ke_lan_quet where ma_gui = p_ma_gui;
  if found then
    if v_lan.kiem_ke_id <> p_id then
      raise exception 'Mã gửi đã dùng cho phiếu khác' using errcode = 'check_violation';
    end if;
    return jsonb_build_object('da_co', true, 'so_nhan', v_lan.so_nhan, 'loi', v_lan.loi,
                              'phien_ban', v_kk.phien_ban, 'mon', kho_kiem_ke_ds_quet(p_id));
  end if;

  if v_kk.trang_thai <> 'dang_dem' then
    raise exception 'Phiếu % không còn ở bước đếm', v_kk.so_phieu using errcode = 'check_violation';
  end if;
  if v_kk.kieu <> 'theo_mat_hang' then
    raise exception 'Phiếu đếm theo lô không quét nhãn — nhập số từng lô' using errcode = 'check_violation';
  end if;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_kk.chi_nhanh_id;
  if v_cd.mau_ma_vach is null then
    raise exception 'Chưa bật đọc nhãn cân — quản lý mở Cài đặt kho, mục Mã vạch' using errcode = 'check_violation';
  end if;
  if p_ma is null or jsonb_typeof(p_ma) <> 'array' or jsonb_array_length(p_ma) = 0 then
    raise exception 'Chưa quét nhãn nào' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(p_ma) > 300 then
    raise exception 'Tối đa 300 nhãn một lần gửi' using errcode = 'check_violation';
  end if;

  v_nv := nhan_su_hien_tai();
  insert into kho_kiem_ke_lan_quet (kiem_ke_id, chi_nhanh_id, ma_gui, loai, nguoi)
  values (p_id, v_kk.chi_nhanh_id, p_ma_gui, 'quet', v_nv.id)
  returning * into v_lan;

  for v_x in select value from jsonb_array_elements(p_ma) loop
    if jsonb_typeof(v_x) <> 'string' then
      raise exception 'Danh sách mã phải là các chuỗi số' using errcode = 'check_violation';
    end if;
    v_ma := left(btrim(v_x #>> '{}'), 40);
    select * into v_doc from kho_doc_ma_vach(v_ma, v_cd.mau_ma_vach, v_cd.so_le_kg);
    if v_doc.loi is not null then
      v_loi := v_loi || jsonb_build_object('ma', v_ma, 'loi', v_doc.loi);
      continue;
    end if;
    select * into v_mh from kho_mat_hang where ma_can = v_doc.ma_can and dang_dung;
    if not found then
      v_loi := v_loi || jsonb_build_object('ma', v_ma,
        'loi', 'Mã hàng ' || v_doc.ma_can || ' chưa gán cho món nào — báo quản lý');
      continue;
    end if;
    if not v_mh.dem_goi and v_doc.so_kg is null then
      v_loi := v_loi || jsonb_build_object('ma', v_ma,
        'loi', '"' || v_mh.ten || '" tính theo kg mà nhãn không có kg — nhập số kg bằng tay');
      continue;
    end if;
    insert into kho_kiem_ke_quet (kiem_ke_id, lan_quet_id, chi_nhanh_id, mat_hang_id, ma, so_kg)
    values (p_id, v_lan.id, v_kk.chi_nhanh_id, v_mh.id, v_ma, v_doc.so_kg);
    v_n := v_n + 1;
  end loop;

  update kho_kiem_ke_lan_quet set so_nhan = v_n, loi = v_loi where id = v_lan.id;
  perform kho_kiem_ke_tinh_quet(p_id);
  update kho_kiem_ke set phien_ban = phien_ban + 1 where id = p_id returning phien_ban into v_pb;

  return jsonb_build_object('da_co', false, 'so_nhan', v_n, 'loi', v_loi,
                            'phien_ban', v_pb, 'mon', kho_kiem_ke_ds_quet(p_id));
end;
$$;

comment on function kho_quet_kiem_ke is
  'Cộng một lượt quét nhãn vào phiếu kiểm kê (theo mặt hàng). p_ma = mảng chuỗi số THÔ; database giải mã theo mẫu trong Cài đặt. Cùng p_ma_gui = cùng lượt, không cộng đôi. Trả {da_co, so_nhan, loi[{ma,loi}], phien_ban, mon[]}.';

-- Sửa số đã quét. p_cach:
--   lan_cuoi  bỏ lượt quét gần nhất của chính người bấm (p_mat_hang_id null)
--   bot_mot   −1 gói của món p_mat_hang_id (nhãn quét sau cùng; hết nhãn thì bớt gói gõ tay)
--   xoa_mon   xóa hết nhãn và số gõ tay của món → món về "chưa đếm"
create or replace function kho_bo_quet_kiem_ke(p_id uuid, p_ma_gui uuid, p_cach text, p_mat_hang_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk   kho_kiem_ke;
  v_lan  kho_kiem_ke_lan_quet;
  v_bo   kho_kiem_ke_lan_quet;
  v_nv   nhan_su;
  v_n    int := 0;
  v_pb   int;
  v_q    uuid;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được kiểm kê'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_kk from kho_kiem_ke where id = p_id for update;

  select * into v_lan from kho_kiem_ke_lan_quet where ma_gui = p_ma_gui;
  if found then
    if v_lan.kiem_ke_id <> p_id then
      raise exception 'Mã gửi đã dùng cho phiếu khác' using errcode = 'check_violation';
    end if;
    return jsonb_build_object('da_co', true, 'so_nhan', v_lan.so_nhan, 'loi', '[]'::jsonb,
                              'phien_ban', v_kk.phien_ban, 'mon', kho_kiem_ke_ds_quet(p_id));
  end if;
  if v_kk.trang_thai <> 'dang_dem' then
    raise exception 'Phiếu % không còn ở bước đếm', v_kk.so_phieu using errcode = 'check_violation';
  end if;
  if p_cach is null or p_cach not in ('lan_cuoi', 'bot_mot', 'xoa_mon') then
    raise exception 'Cách sửa không hợp lệ' using errcode = 'check_violation';
  end if;
  if p_cach <> 'lan_cuoi' and p_mat_hang_id is null then
    raise exception 'Chưa chọn món' using errcode = 'check_violation';
  end if;
  v_nv := nhan_su_hien_tai();

  if p_cach = 'lan_cuoi' then
    select * into v_bo from kho_kiem_ke_lan_quet
    where kiem_ke_id = p_id and loai = 'quet' and bo_luc is null and nguoi is not distinct from v_nv.id
      and exists (select 1 from kho_kiem_ke_quet q where q.lan_quet_id = kho_kiem_ke_lan_quet.id)
    order by thu_tu desc limit 1;
    if v_bo.id is null then
      raise exception 'Bạn chưa có lượt quét nào để bỏ' using errcode = 'check_violation';
    end if;
    delete from kho_kiem_ke_quet where lan_quet_id = v_bo.id;
    get diagnostics v_n = row_count;
    update kho_kiem_ke_lan_quet set bo_luc = now() where id = v_bo.id;
  elsif p_cach = 'bot_mot' then
    select q.id into v_q from kho_kiem_ke_quet q
    where q.kiem_ke_id = p_id and q.mat_hang_id = p_mat_hang_id
    order by q.thu_tu desc limit 1;
    if v_q is not null then
      delete from kho_kiem_ke_quet where id = v_q;
      v_n := 1;
    else
      update kho_kiem_ke_dong set so_goi_them = so_goi_them - 1,
                                  so_goi_dem = case when so_goi_them > 1 then so_goi_them - 1 end
      where kiem_ke_id = p_id and mat_hang_id = p_mat_hang_id and lo_id is null and so_goi_them > 0;
      get diagnostics v_n = row_count;
      if v_n = 0 then
        raise exception 'Món này chưa quét gói nào' using errcode = 'check_violation';
      end if;
    end if;
  else
    delete from kho_kiem_ke_quet where kiem_ke_id = p_id and mat_hang_id = p_mat_hang_id;
    get diagnostics v_n = row_count;
    update kho_kiem_ke_dong set so_goi_them = 0, so_goi_dem = null, so_kg_dem = null,
                                xac_nhan_het = false, tu_quet = false
    where kiem_ke_id = p_id and mat_hang_id = p_mat_hang_id and lo_id is null;
  end if;

  insert into kho_kiem_ke_lan_quet (kiem_ke_id, chi_nhanh_id, ma_gui, loai, cach, mat_hang_id, so_nhan, nguoi)
  values (p_id, v_kk.chi_nhanh_id, p_ma_gui, 'bo', p_cach, p_mat_hang_id, v_n, v_nv.id);
  perform kho_kiem_ke_tinh_quet(p_id);
  update kho_kiem_ke set phien_ban = phien_ban + 1 where id = p_id returning phien_ban into v_pb;

  return jsonb_build_object('da_co', false, 'so_nhan', v_n, 'loi', '[]'::jsonb,
                            'phien_ban', v_pb, 'mon', kho_kiem_ke_ds_quet(p_id));
end;
$$;

comment on function kho_bo_quet_kiem_ke is
  'Sửa số đã quét: p_cach lan_cuoi (bỏ lượt gần nhất của mình) | bot_mot (−1 gói của p_mat_hang_id) | xoa_mon. Chống bấm hai lần bằng p_ma_gui. Trả như kho_quet_kiem_ke; so_nhan = số nhãn / gói đã bớt.';

-- "Hết hàng" một chạm: mọi món chưa đếm (và món đếm 0) = 0, xác nhận đã hết.
-- Trả {phien_ban, so_mon}.
create or replace function kho_het_hang_con_lai(p_id uuid, p_phien_ban int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk kho_kiem_ke;
  v_n  int;
  v_pb int;
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được kiểm kê'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_kk from kho_kiem_ke where id = p_id for update;
  if v_kk.trang_thai <> 'dang_dem' then
    raise exception 'Phiếu % không còn ở bước đếm', v_kk.so_phieu using errcode = 'check_violation';
  end if;
  if p_phien_ban is distinct from v_kk.phien_ban then
    raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
      using errcode = 'check_violation';
  end if;

  perform kho_kiem_ke_bo_sung_dong(p_id);
  update kho_kiem_ke_dong d set
    so_goi_dem   = case when m.dem_goi then 0 else d.so_goi_dem end,
    so_kg_dem    = case when m.dem_goi then null else 0 end,
    xac_nhan_het = true
  from kho_mat_hang m
  where d.kiem_ke_id = p_id and m.id = d.mat_hang_id and not d.xac_nhan_het
    and (case when m.dem_goi then coalesce(d.so_goi_dem, 0) = 0 else coalesce(d.so_kg_dem, 0) = 0 end);
  get diagnostics v_n = row_count;

  update kho_kiem_ke set phien_ban = phien_ban + 1 where id = p_id returning phien_ban into v_pb;
  return jsonb_build_object('phien_ban', v_pb, 'so_mon', v_n);
end;
$$;

comment on function kho_het_hang_con_lai is
  'Một chạm "những món này đã bán hết": mọi dòng chưa đếm hoặc đếm 0 thành 0 và xác nhận hết. Chống đè bằng p_phien_ban. Trả {phien_ban, so_mon}.';


-- ---- Thay THÂN kho_luu_kiem_ke / kho_gui_kiem_ke / kho_duyet_kiem_ke (0023) --
-- Chép nguyên văn; chỗ đổi có ghi 0032.
-- p_dong: [{mat_hang_id, lo_id?, so_goi_dem?, so_kg_dem?, xac_nhan_het?, ghi_chu?, so_goi_them?}] — thay toàn bộ.
create or replace function kho_luu_kiem_ke(p_id uuid, p_phien_ban int, p_ghi_chu text, p_dong jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kk    kho_kiem_ke;
  v_dong  jsonb;
  v_khoa  text;
  v_i     int := 0;
  v_mh    kho_mat_hang;
  v_lo    kho_lo;
  v_goi   int;
  v_kg    numeric;
  v_het   boolean;
  v_pb    int;
  v_n     int;
  v_them  int;
  c_uuid  constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  select * into v_kk from kho_kiem_ke where id = p_id;
  if not found or not kho_duoc(v_kk.chi_nhanh_id, 'van_hanh') then
    raise exception 'Không tìm thấy phiếu kiểm kê, hoặc tài khoản không được kiểm kê'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_kk from kho_kiem_ke where id = p_id for update;
  if v_kk.trang_thai <> 'dang_dem' then
    raise exception 'Phiếu % không còn ở bước đếm', v_kk.so_phieu using errcode = 'check_violation';
  end if;
  if p_phien_ban is distinct from v_kk.phien_ban then
    raise exception 'Phiếu đã được sửa ở máy khác. Tải lại trang để xem bản mới nhất.'
      using errcode = 'check_violation';
  end if;
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' then
    raise exception 'Danh sách dòng đếm không hợp lệ' using errcode = 'check_violation';
  end if;

  delete from kho_kiem_ke_dong where kiem_ke_id = p_id;

  for v_dong in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if v_khoa <> all (array['mat_hang_id', 'lo_id', 'so_goi_dem', 'so_kg_dem', 'xac_nhan_het', 'ghi_chu', 'so_goi_them']) then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa using errcode = 'check_violation';
      end if;
    end loop;

    v_lo := null;
    if v_kk.kieu = 'theo_lo' then
      if jsonb_typeof(v_dong -> 'lo_id') is distinct from 'string' or (v_dong ->> 'lo_id') !~* c_uuid then
        raise exception 'Dòng %: chưa chọn lô', v_i using errcode = 'check_violation';
      end if;
      select * into v_lo from kho_lo where id = (v_dong ->> 'lo_id')::uuid;
      if v_lo.id is null or v_lo.chi_nhanh_id <> v_kk.chi_nhanh_id then
        raise exception 'Dòng %: lô không thuộc chi nhánh này', v_i using errcode = 'check_violation';
      end if;
      select * into v_mh from kho_mat_hang where id = v_lo.mat_hang_id;
    else
      if v_dong ? 'lo_id' and v_dong -> 'lo_id' <> 'null'::jsonb then
        raise exception 'Phiếu đếm theo mặt hàng không chọn lô' using errcode = 'check_violation';
      end if;
      if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string' or (v_dong ->> 'mat_hang_id') !~* c_uuid then
        raise exception 'Dòng %: chưa chọn mặt hàng', v_i using errcode = 'check_violation';
      end if;
      select * into v_mh from kho_mat_hang where id = (v_dong ->> 'mat_hang_id')::uuid;
      if not found then
        raise exception 'Dòng %: mặt hàng không có', v_i using errcode = 'check_violation';
      end if;
    end if;

    v_goi := null;
    if v_dong ? 'so_goi_dem' and v_dong -> 'so_goi_dem' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi_dem') <> 'number'
         or (v_dong ->> 'so_goi_dem')::numeric <> trunc((v_dong ->> 'so_goi_dem')::numeric)
         or (v_dong ->> 'so_goi_dem')::numeric < 0 or (v_dong ->> 'so_goi_dem')::numeric > 100000 then
        raise exception '"%": số % đếm được phải là số nguyên không âm', v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi_dem')::int;
    end if;
    v_kg := null;
    if v_dong ? 'so_kg_dem' and v_dong -> 'so_kg_dem' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_kg_dem') <> 'number' then
        raise exception '"%": số kg không hợp lệ', v_mh.ten using errcode = 'check_violation';
      end if;
      v_kg := (v_dong ->> 'so_kg_dem')::numeric;
      if v_kg < 0 or v_kg >= 1000000 or v_kg <> round(v_kg, 3) then
        raise exception '"%": số kg không âm, tối đa 3 số lẻ', v_mh.ten using errcode = 'check_violation';
      end if;
    end if;
    if v_mh.dem_goi and v_goi is not null then
      if v_goi = 0 and coalesce(v_kg, 0) > 0 then
        raise exception '"%": đếm 0 % mà có % kg — kiểm lại', v_mh.ten, v_mh.don_vi_goi, v_kg
          using errcode = 'check_violation';
      end if;
      if v_goi > 0 and v_kg = 0 then
        raise exception '"%": có % % mà 0 kg — bỏ trống ô kg nếu không cân', v_mh.ten, v_goi, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
    end if;
    if v_dong ? 'xac_nhan_het' and jsonb_typeof(v_dong -> 'xac_nhan_het') not in ('boolean', 'null') then
      raise exception '"%": ô xác nhận hết không hợp lệ', v_mh.ten using errcode = 'check_violation';
    end if;
    v_het := coalesce((v_dong ->> 'xac_nhan_het')::boolean, false);

    -- 0032 · CỘNG DỒN VỚI NHÃN ĐÃ QUÉT. so_goi_them = gói gõ tay thêm; không
    -- gửi thì so_goi_dem được hiểu là TỔNG (nhãn + tay) và không được ít hơn
    -- số nhãn đã quét — quét nhầm thì bấm −1.
    v_them := 0;
    if v_dong ? 'so_goi_them' and v_dong -> 'so_goi_them' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi_them') <> 'number'
         or (v_dong ->> 'so_goi_them')::numeric <> trunc((v_dong ->> 'so_goi_them')::numeric)
         or (v_dong ->> 'so_goi_them')::numeric < 0 or (v_dong ->> 'so_goi_them')::numeric > 100000 then
        raise exception '"%": số % thêm phải là số nguyên không âm', v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_them := (v_dong ->> 'so_goi_them')::int;
    end if;
    v_n := 0;
    if v_lo.id is null then
      select count(*) into v_n from kho_kiem_ke_quet q where q.kiem_ke_id = p_id and q.mat_hang_id = v_mh.id;
    end if;
    if v_n > 0 and v_mh.dem_goi then
      if not (v_dong ? 'so_goi_them') and v_goi is not null then
        if v_goi < v_n then
          raise exception '"%": đã quét % % — số đếm không được ít hơn. Quét nhầm thì bấm −1', v_mh.ten, v_n, v_mh.don_vi_goi
            using errcode = 'check_violation';
        end if;
        v_them := v_goi - v_n;
      end if;
    elsif v_n = 0 and v_them > 0 then
      v_goi := coalesce(v_goi, 0) + v_them;
      v_them := 0;
    end if;
    if v_n > 0 and not v_mh.dem_goi then
      v_them := 0;
    end if;

    begin
      insert into kho_kiem_ke_dong
        (kiem_ke_id, chi_nhanh_id, thu_tu, mat_hang_id, lo_id, so_goi_dem, so_kg_dem, xac_nhan_het, ghi_chu,
         so_goi_them)
      values
        (p_id, v_kk.chi_nhanh_id, v_i, v_mh.id, v_lo.id, v_goi, v_kg, v_het,
         nullif(btrim(left(v_dong ->> 'ghi_chu', 200)), ''), v_them);
    exception when unique_violation then
      raise exception '"%"% bị nhập hai lần', v_mh.ten,
        case when v_lo.id is not null then ' (lô ' || v_lo.ma_lo || ')' else '' end
        using errcode = 'check_violation';
    end;
  end loop;

  perform kho_kiem_ke_bo_sung_dong(p_id);
  perform kho_kiem_ke_tinh_quet(p_id);   -- 0032

  update kho_kiem_ke set ghi_chu = nullif(btrim(p_ghi_chu), ''), phien_ban = phien_ban + 1
  where id = p_id
  returning phien_ban into v_pb;
  return v_pb;
end;
$$;


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
-- 11 · BÁO CÁO — xuất khác, hao hụt (SECURITY INVOKER như 0024)
-- =============================================================================
-- Hao hụt: thêm nhóm xuat_khac; dòng sổ hao_hut (mất khi mang ra quầy) thành
-- nhóm riêng 'hao_hut' thay vì gộp vào kiểm kê (trước 0032 chưa hàm nào ghi
-- loại này). Chép 0024, chỗ đổi ở phan_loai.
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
           case when d.loai = 'kiem_ke'
                then case when d.so_kg < 0 or (d.so_kg = 0 and d.so_goi < 0) then 'kiem_ke_thieu' else 'kiem_ke_thua' end
                else d.loai end as nhom,
           case when d.chung_tu_loai = 'phien_pha' then 'Pha lóc chuyển thẳng bếp'
                when d.loai = 'hao_hut' and d.chung_tu_loai = 'phieu_xuat' then 'Mất khi mang ra quầy'
                else ld.ten end as ten_ly_do
    from dong d
    left join kho_phieu_xuat px on d.chung_tu_loai = 'phieu_xuat' and px.id = d.chung_tu_id
    left join kho_ly_do ld on ld.id = px.ly_do_id
    where d.loai in ('huy', 'xuat_bep', 'xuat_khac', 'tra_ncc', 'kiem_ke', 'hao_hut')
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
  'Hủy, xuất bếp, xuất khác, trả nhà cung cấp, chênh lệch kiểm kê (thiếu / thừa), hao hụt (mất khi mang ra quầy) trong kỳ, theo mặt hàng và lý do.';

-- Xuất – nhập – tồn có cột xuất khác và hao hụt (tách khỏi kiểm kê). Hàm cũ
-- kho_bao_cao_xuat_nhap_ton giữ nguyên chữ ký cho web cũ.
create or replace function kho_bao_cao_xnt_v2(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  mat_hang_id uuid, ma text, ten text, loai text, dem_goi boolean, don_vi_goi text,
  dau_kg numeric, dau_gia_tri bigint,
  nhap_kg numeric, nhap_gia_tri bigint,
  pha_ra_kg numeric, pha_ra_gia_tri bigint,
  pha_vao_kg numeric, pha_vao_gia_tri bigint,
  ban_kg numeric, ban_gia_tri bigint,
  xuat_bep_kg numeric, xuat_bep_gia_tri bigint,
  xuat_khac_kg numeric, xuat_khac_gia_tri bigint,
  huy_kg numeric, huy_gia_tri bigint,
  tra_ncc_kg numeric, tra_ncc_gia_tri bigint,
  kiem_ke_kg numeric, kiem_ke_gia_tri bigint,
  hao_hut_kg numeric, hao_hut_gia_tri bigint,
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
      -coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'xuat_khac'), 0) as khac_kg,
      -coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'xuat_khac'), 0) as khac_gt,
      -coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'huy'), 0) as huy_kg,
      -coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'huy'), 0) as huy_gt,
      -coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'tra_ncc'), 0) as tra_kg,
      -coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'tra_ncc'), 0) as tra_gt,
      coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'kiem_ke'), 0) as kk_kg,
      coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'kiem_ke'), 0) as kk_gt,
      -coalesce(sum(d.so_kg)   filter (where d.ngay >= p_tu and d.loai = 'hao_hut'), 0) as hh_kg,
      -coalesce(sum(d.gia_tri) filter (where d.ngay >= p_tu and d.loai = 'hao_hut'), 0) as hh_gt,
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
         g.khac_kg, round(g.khac_gt)::bigint,
         g.huy_kg, round(g.huy_gt)::bigint,
         g.tra_kg, round(g.tra_gt)::bigint,
         g.kk_kg, round(g.kk_gt)::bigint,
         g.hh_kg, round(g.hh_gt)::bigint,
         g.cuoi_kg, round(g.cuoi_gt)::bigint
  from gom g
  join kho_mat_hang m on m.id = g.mat_hang_id
  where g.dau_kg <> 0 or g.cuoi_kg <> 0 or g.nhap_kg <> 0 or g.pha_ra_kg <> 0 or g.pha_vao_kg <> 0
     or g.ban_kg <> 0 or g.bep_kg <> 0 or g.khac_kg <> 0 or g.huy_kg <> 0 or g.tra_kg <> 0
     or g.kk_kg <> 0 or g.hh_kg <> 0
  order by m.loai, m.thu_tu, m.ten
$$;


comment on function kho_bao_cao_xnt_v2 is
  'Xuất – nhập – tồn theo mặt hàng trong kỳ (0032): như kho_bao_cao_xuat_nhap_ton, thêm xuat_khac và hao_hut (mất khi mang ra quầy) tách khỏi kiem_ke. Giá trị theo giá vốn lô; không có quyền xem giá thì 0.';

-- Chỉ số quản trị: chi phí thịt tính cả xuất khác. Chép 0030.
create or replace function kho_chi_so_quan_tri(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns jsonb
language sql
stable
set search_path = public
as $$
  with ky as (
    select p_tu as tu, p_den as den,
           p_tu - (p_den - p_tu + 1) as tu_truoc, p_tu - 1 as den_truoc
  ),
  ton as (
    select coalesce(sum(g.gia_tri) filter (where v.loai = 'kho'), 0)  as gia_tri_kho,
           coalesce(sum(g.gia_tri) filter (where v.loai = 'quay'), 0) as gia_tri_quay
    from kho_v_ton_gia g
    join kho_vi_tri v on v.id = g.vi_tri_id
    where g.chi_nhanh_id = p_chi_nhanh_id
  ),
  quay as (
    select m.id, m.ton_toi_thieu_kg, coalesce(sum(t.so_kg), 0) as con_kg
    from kho_mat_hang m
    left join kho_v_ton t on t.mat_hang_id = m.id and t.chi_nhanh_id = p_chi_nhanh_id
                         and t.loai_vi_tri = 'quay' and t.tinh_trang_han <> 'het_han'
    where m.dang_dung and m.ton_toi_thieu_kg is not null
    group by m.id, m.ton_toi_thieu_kg
  ),
  pha as (
    select sum(f.tong_kg_vao)  filter (where f.ngay_pha between k.tu and k.den)             as kg_vao,
           sum(f.tong_kg_thit) filter (where f.ngay_pha between k.tu and k.den)             as kg_thit,
           count(*)            filter (where f.ngay_pha between k.tu and k.den)             as so_phien,
           sum(f.tong_kg_vao)  filter (where f.ngay_pha between k.tu_truoc and k.den_truoc) as kg_vao_truoc,
           sum(f.tong_kg_thit) filter (where f.ngay_pha between k.tu_truoc and k.den_truoc) as kg_thit_truoc
    from kho_phien_pha f, ky k
    where f.chi_nhanh_id = p_chi_nhanh_id and f.trang_thai = 'da_chot'
  ),
  gia_von as (
    select sum(g.gia_tri)   filter (where l.ngay_dong_goi between k.tu and k.den)             as gt,
           sum(g.so_kg_goc) filter (where l.ngay_dong_goi between k.tu and k.den)             as kg,
           sum(g.gia_tri)   filter (where l.ngay_dong_goi between k.tu_truoc and k.den_truoc) as gt_truoc,
           sum(g.so_kg_goc) filter (where l.ngay_dong_goi between k.tu_truoc and k.den_truoc) as kg_truoc
    from kho_lo l
    join kho_lo_gia g on g.lo_id = l.id
    join kho_mat_hang m on m.id = l.mat_hang_id
    cross join ky k
    where l.chi_nhanh_id = p_chi_nhanh_id and l.nguon = 'pha_loc' and m.loai = 'phan_cat'
  ),
  so_cai as (
    select coalesce(g.loai, s.loai) as loai, s.so_kg, s.ngay,
           s.so_kg * coalesce(lg.gia_von_kg, 0) as gia_tri
    from kho_so_cai s
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_lo_gia lg on lg.lo_id = s.lo_id
    cross join ky k
    where s.chi_nhanh_id = p_chi_nhanh_id and s.ngay between k.tu_truoc and k.den
  ),
  dung as (
    select
      -- Thịt đã dùng = bán + xuất bếp + xuất khác (0032) + hủy + thiếu khi kiểm kê (thừa trừ lại)
      -sum(x.gia_tri) filter (where x.loai in ('ban', 'xuat_bep', 'xuat_khac', 'huy', 'kiem_ke', 'hao_hut')
                               and x.ngay between k.tu and k.den)                          as chi_phi,
      -sum(x.gia_tri) filter (where x.loai in ('ban', 'xuat_bep', 'xuat_khac', 'huy', 'kiem_ke', 'hao_hut')
                               and x.ngay between k.tu_truoc and k.den_truoc)              as chi_phi_truoc,
      -sum(x.gia_tri) filter (where x.loai = 'huy' and x.ngay between k.tu and k.den)       as huy,
      -sum(x.gia_tri) filter (where x.loai in ('kiem_ke', 'hao_hut') and x.ngay between k.tu and k.den
                               and x.so_kg < 0)                                            as kiem_ke_thieu,
       sum(x.gia_tri) filter (where x.loai in ('kiem_ke', 'hao_hut') and x.ngay between k.tu and k.den
                               and x.so_kg > 0)                                            as kiem_ke_thua,
      -sum(x.gia_tri) filter (where x.loai = 'xuat_bep' and x.ngay between k.tu and k.den)  as xuat_bep,
      -sum(x.gia_tri) filter (where x.loai = 'ban' and x.ngay between k.tu and k.den)       as ban_gia_von,
      -sum(x.so_kg)   filter (where x.loai = 'ban' and x.ngay between k.tu and k.den)       as ban_kg
    from so_cai x, ky k
  ),
  ban as (
    select sum(b.doanh_thu_uoc_tinh) as doanh_thu_uoc_tinh
    from kho_bao_cao_ban(p_chi_nhanh_id, p_tu, p_den) b
  )
  select jsonb_build_object(
    'tu', p_tu, 'den', p_den,
    'gia_tri_ton_kho',  (select gia_tri_kho from ton),
    'gia_tri_ton_quay', (select gia_tri_quay from ton),
    'mh_het_quay',      (select count(*) from quay where con_kg = 0),
    'mh_duoi_muc',      (select count(*) from quay where con_kg > 0 and con_kg < ton_toi_thieu_kg),
    'so_phien_pha',     (select coalesce(so_phien, 0) from pha),
    'thu_hoi_pt',       (select case when kg_vao > 0 then round(kg_thit * 100 / kg_vao, 2) end from pha),
    'thu_hoi_pt_truoc', (select case when kg_vao_truoc > 0 then round(kg_thit_truoc * 100 / kg_vao_truoc, 2) end from pha),
    'gia_von_kg',       (select case when kg > 0 then round(gt / kg) end from gia_von),
    'gia_von_kg_truoc', (select case when kg_truoc > 0 then round(gt_truoc / kg_truoc) end from gia_von),
    'chi_phi_thit',       (select coalesce(round(chi_phi), 0) from dung),
    'chi_phi_thit_truoc', (select coalesce(round(chi_phi_truoc), 0) from dung),
    'huy',                (select coalesce(round(huy), 0) from dung),
    'kiem_ke_thieu',      (select coalesce(round(kiem_ke_thieu), 0) from dung),
    'kiem_ke_thua',       (select coalesce(round(kiem_ke_thua), 0) from dung),
    'xuat_bep',           (select coalesce(round(xuat_bep), 0) from dung),
    'ban_gia_von',        (select coalesce(round(ban_gia_von), 0) from dung),
    'ban_kg',             (select coalesce(ban_kg, 0) from dung),
    'doanh_thu_uoc_tinh', (select coalesce(doanh_thu_uoc_tinh, 0) from ban)
  )
$$;



-- =============================================================================
-- 12 · SỰ KIỆN VÀ SỐ ĐỎ — thay THÂN (cùng chữ ký), chép 0031, thêm 0032
-- =============================================================================
--   yeu_cau_quay       van_hanh  thủ kho, quản lý: quầy có yêu cầu đang chờ
--   hang_dang_chuyen   van_hanh  NV quầy, quản lý: hàng đang mang ra, chờ bấm
--                                nhận (phu = 'qua_gio' khi quá gio_nhac_chuyen)
--   chuyen_nhan_thieu  nhac_nho  quản lý: quầy nhận thiếu, cần xử lý
-- Số đỏ mới: yeu_cau_quay, hang_dang_chuyen, hang_chuyen_qua_gio, chuyen_nhan_thieu.
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
                            where chi_nhanh_id = p_chi_nhanh_id and loai = 'chuyen' and trang_thai = 'nhan_thieu'));
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
  'Mọi số đỏ trên menu kho của người đang đăng nhập ở một chi nhánh, trong MỘT lần gọi. Khóa nào không có quyền thì vắng mặt. Chỉ đếm, không tiền. duyet_nhap theo quyền duyet_nhap (0031); yeu_cau_quay, hang_dang_chuyen, hang_chuyen_qua_gio, chuyen_nhan_thieu (0032).';


-- =============================================================================
-- 13 · VIEW — thêm cột Ở CUỐI
-- =============================================================================
create or replace view kho_v_phieu_xuat with (security_invoker = true) as
select p.id, p.chi_nhanh_id, p.so_phieu, p.loai, p.trang_thai, p.ngay,
       p.vi_tri_id, v.ten as ten_vi_tri, v.loai as loai_vi_tri,
       p.vi_tri_den_id, vd.ten as ten_vi_tri_den,
       p.ly_do_id, ld.ten as ten_ly_do, p.ghi_chu, p.anh, p.ly_do_tu_choi,
       p.nguoi_tao, p.nguoi_duyet, p.duyet_luc, p.created_at,
       coalesce(d.so_dong, 0)::int as so_dong,
       coalesce(d.tong_goi, 0)::int as tong_goi,
       coalesce(d.tong_kg, 0) as tong_kg,
       -- 0032
       p.yeu_cau_id, yc.so_phieu as so_yeu_cau,
       p.nguoi_nhan, p.nhan_luc,
       d.tong_goi_nhan::int as tong_goi_nhan, d.tong_kg_nhan,
       p.xu_ly_thieu, p.ly_do_xu_ly, p.nguoi_xu_ly, p.xu_ly_luc
from kho_phieu_xuat p
join kho_vi_tri v on v.id = p.vi_tri_id
left join kho_vi_tri vd on vd.id = p.vi_tri_den_id
left join kho_ly_do ld on ld.id = p.ly_do_id
left join kho_yeu_cau_quay yc on yc.id = p.yeu_cau_id
left join lateral (
  select count(*) as so_dong, sum(dd.so_goi) as tong_goi, sum(dd.so_kg) as tong_kg,
         sum(dd.so_goi_nhan) as tong_goi_nhan, sum(dd.so_kg_nhan) as tong_kg_nhan
  from kho_phieu_xuat_dong dd where dd.phieu_xuat_id = p.id
) d on true;

create or replace view kho_v_kiem_ke with (security_invoker = true) as
select k.id, k.chi_nhanh_id, k.so_phieu, k.phien_ban, k.vi_tri_id, v.ten as ten_vi_tri, v.loai as loai_vi_tri,
       k.kieu, k.nguon_so_ban, k.ngay_kiem, k.trang_thai, k.ghi_chu, k.ly_do,
       k.nguoi_tao, k.nguoi_gui, k.gui_luc, k.nguoi_duyet, k.duyet_luc, k.created_at,
       (select count(*) from kho_kiem_ke_dong d where d.kiem_ke_id = k.id)::int as so_dong,
       (select count(*) from kho_kiem_ke_dong d join kho_mat_hang m on m.id = d.mat_hang_id
         where d.kiem_ke_id = k.id
           and (case when m.dem_goi then d.so_goi_dem is not null else d.so_kg_dem is not null end))::int as so_dong_da_dem,
       -- 0032
       (select count(*) from kho_kiem_ke_quet q where q.kiem_ke_id = k.id)::int as so_nhan_quet
from kho_kiem_ke k
join kho_vi_tri v on v.id = k.vi_tri_id;

-- Yêu cầu của quầy kèm tên quầy, số món, phiếu mang ra (nếu có).
create view kho_v_yeu_cau_quay with (security_invoker = true) as
select y.id, y.chi_nhanh_id, y.so_phieu, y.vi_tri_id, v.ten as ten_vi_tri, y.nguon, y.trang_thai,
       y.ghi_chu, y.nguoi_tao, y.created_at, y.nguoi_xu_ly, y.xu_ly_luc,
       y.ly_do_huy, y.nguoi_huy, y.huy_luc,
       (select count(*) from kho_yeu_cau_quay_dong d where d.yeu_cau_id = y.id)::int as so_mon,
       (select coalesce(sum(d.so_goi), 0) from kho_yeu_cau_quay_dong d where d.yeu_cau_id = y.id)::int as tong_goi,
       px.id as phieu_xuat_id, px.so_phieu as so_phieu_xuat, px.trang_thai as trang_thai_phieu_xuat
from kho_yeu_cau_quay y
join kho_vi_tri v on v.id = y.vi_tri_id
left join lateral (
  select x.id, x.so_phieu, x.trang_thai from kho_phieu_xuat x
  where x.yeu_cau_id = y.id order by x.created_at desc limit 1
) px on true;


-- =============================================================================
-- 14 · PHÂN QUYỀN — không có tiền: mọi vai kho đọc được (xem)
-- =============================================================================
alter table kho_yeu_cau_quay      enable row level security;
alter table kho_yeu_cau_quay_dong enable row level security;
alter table kho_kiem_ke_lan_quet  enable row level security;
alter table kho_kiem_ke_quet      enable row level security;

create policy kho_yeu_cau_quay_doc on kho_yeu_cau_quay
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
create policy kho_yeu_cau_quay_dong_doc on kho_yeu_cau_quay_dong
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
create policy kho_kiem_ke_lan_quet_doc on kho_kiem_ke_lan_quet
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
create policy kho_kiem_ke_quet_doc on kho_kiem_ke_quet
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_ghi_phieu_xuat(uuid, uuid, text, uuid, uuid, uuid, text, text[], jsonb, uuid) from authenticated';
    execute 'revoke execute on function kho_chuyen_tren_duong(uuid) from authenticated';
    execute 'revoke execute on function kho_don_tren_duong(uuid, text, text) from authenticated';
    execute 'revoke execute on function kho_doc_ma_vach(text, text, int) from authenticated';
    execute 'revoke execute on function kho_kiem_ke_tinh_quet(uuid) from authenticated';
    execute 'revoke execute on function kho_kiem_ke_ds_quet(uuid) from authenticated';
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
