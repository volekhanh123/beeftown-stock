-- =============================================================================
-- BEEFTOWN KHO — 0040 · CÔNG NỢ KIỂU iPOS · HÓA ĐƠN GỘP · NCC HOÀN TIỀN / BÙ TRỪ
--                      · TRẢ HÀNG HAI BƯỚC · DỮ LIỆU XUẤT MISA (GĐ8b)
-- =============================================================================
-- Chủ nhà hàng đã chốt:
--   · Hóa đơn nhà cung cấp (NCC) có HAI kiểu: từng lần (một phiếu nhận hàng =
--     một hóa đơn, như 0024) và GỘP (một hóa đơn cho nhiều phiếu, NCC xuất cuối
--     tuần / cuối tháng). Kế toán dùng MISA.
--   · Chưa có file mẫu MISA, mã tài khoản, mã NCC / mặt hàng bên MISA → database
--     chỉ trả DÒNG PHẲNG đủ cột; web dựng CSV theo bảng cột cấu hình được
--     (lib/kho/misa.ts). Mã tài khoản mặc định lưu ở kho_cai_dat.misa_tk.
--   · Chỉ vai ke_toan (chủ, quản lý, kế toán) thấy mọi thứ ở giai đoạn này.
--     Thủ kho chỉ làm phần KG của trả hàng — không thấy một đồng nào.
--
-- AI LÀM GÌ (dùng quyền có sẵn, không thêm việc mới vào kho_vai_duoc)
--   Ghi trả tiền / giảm trừ / bù trừ / NCC hoàn tiền     ke_toan
--   Đối chiếu hóa đơn gộp, bỏ đối chiếu gộp              ke_toan
--   Trả hàng bước 1: ghi KG hàng trả (không tiền)        nhap hoặc ke_toan
--   Trả hàng bước 2: xác nhận số tiền giảm trừ           ke_toan
--   Công nợ theo kỳ, dữ liệu MISA                        ke_toan
--   Mã tài khoản MISA mặc định (misa_tk)                 ke_toan (không phải
--     cai_dat_goc: đây là việc sổ sách của kế toán, không đổi cách tính kho)
--   Mã MISA của mặt hàng                                 ke_toan qua hàm riêng
--     (bảng mặt hàng chỉ danh_muc sửa được — kế toán không có danh_muc)
--   Mã MISA, kiểu hóa đơn của NCC                        ncc (ghi thẳng bảng,
--     như các cột NCC khác)
--   Nhật ký đổi tài khoản ngân hàng NCC                  đọc: ncc; ghi: trigger
--
-- 1. THANH TOÁN LOẠI MỚI (kho_thanh_toan.loai)
--      bu_tru     trừ công nợ bằng một khoản NCC nợ lại quán (tiền cọc, vỏ
--                 thùng, hàng quán bán lại cho NCC…) — không qua tiền mặt /
--                 ngân hàng. Làm GIẢM còn nợ như trả tiền. Bắt buộc ghi chú
--                 (khoản gì). Không có hình thức. Số BT-.
--      hoan_tien  NCC trả lại tiền cho quán (khi quán đã trả thừa, hoặc trả
--                 hàng sau khi đã trả đủ → còn nợ ÂM). Làm TĂNG còn nợ về 0,
--                 KHÔNG BAO GIỜ vượt 0: chỉ chia vào phiếu có còn nợ < 0, mỗi
--                 phiếu tối đa đúng số âm đó. Có hình thức (chuyển khoản /
--                 tiền mặt). Số HT-.
--    View công nợ: "đã trả" (da_tra) = tiền trả + bù trừ − NCC hoàn tiền, nên
--    công thức cũ còn nợ = phải trả − đã trả − giảm trừ GIỮ NGUYÊN và mọi chỗ
--    đang dùng view (tự chia 0024, số đỏ, web) chạy đúng. Chi tiết tách ở cột
--    mới cuối view: tien_tra, bu_tru, hoan_tien.
--    kho_ghi_thanh_toan (0024) GIỮ NGUYÊN (chỉ thanh_toan / giam_tru).
--    kho_ghi_thanh_toan_v2 — cùng tham số, nhận cả bốn loại. Tự chia (không
--    chọn phiếu) vẫn theo hạn sớm nhất trước; hoàn tiền chia vào phiếu âm theo
--    ngày nhập. kho_xem_truoc_thanh_toan — xem trước cách chia (nút "Trả đủ":
--    p_so_tien null).
--
-- 2. HÓA ĐƠN GỘP
--      kho_hoa_don_ncc     một hóa đơn: số, ngày, tổng tiền, tiền thuế, tổng
--                          các phiếu lúc đối chiếu, lý do lệch.
--      kho_hoa_don_phieu   phiếu nào thuộc hóa đơn nào (phieu_id UNIQUE — một
--                          phiếu một hóa đơn gộp) + phần tiền chia cho phiếu
--                          + giá trị ĐỐI CHIẾU CŨ của phiếu (để bỏ đối chiếu
--                          thì trả phiếu về đúng như trước).
--    kho_doi_chieu_hoa_don_gop: chia tổng hóa đơn (và tiền thuế) vào từng phiếu
--    theo tỉ lệ tổng phiếu, phần lẻ theo số dư lớn nhất (kho_chia_so_du_lon_nhat
--    — tổng khớp ĐÚNG TỪNG ĐỒNG); mỗi phiếu thành "đã đối chiếu" với tien_hoa_don
--    = phần của nó, hạn trả = ngày hóa đơn + số ngày nợ của NCC. Tổng hóa đơn
--    lệch tổng phiếu → bắt buộc lý do. Cần từ 2 phiếu (1 phiếu: đối chiếu thường).
--    kho_bo_doi_chieu_gop: chỉ khi các phiếu CHƯA có khoản trả tiền / giảm trừ /
--    bù trừ / hoàn tiền nào còn hiệu lực. Trigger kho_phieu_nhap_giu_hoa_don_gop
--    chặn hủy phiếu và sửa hóa đơn từng phiếu khi phiếu đang thuộc hóa đơn gộp.
--
-- 3. TRẢ HÀNG HAI BƯỚC
--    Bước 1 — kho_tra_hang_ghi_kg (thủ kho): như kho_tra_nha_cung_cap (0024)
--      nhưng KHÔNG tiền: hàng rời kho ngay (sổ tra_ncc), phiếu XT- ở trạng thái
--      mới cho_xac_nhan_tien. Không truyền phiếu nhập thì lấy theo lô.
--    Bước 2 — kho_xac_nhan_tien_tra_hang (kế toán): số tiền giảm trừ (trống =
--      tự tính như 0024: kg × đơn giá mua + phần thuế tương ứng; 0 = NCC không
--      trừ tiền) → khoản giam_tru gắn phiếu XT-, phiếu thành da_ghi.
--    Hàng chờ: kho_ds_tra_hang_cho_tien (kế toán, có số tiền gợi ý), số đỏ và
--    sự kiện tra_hang_cho_tien. Ghi nhầm / NCC không nhận lại: hàm
--    kho_huy_tra_hang_cho_tien đảo sổ (hàng về lại lô, chỗ cũ) khi phiếu còn
--    chờ xác nhận tiền. kho_tra_nha_cung_cap (0024, một bước, có tiền) GIỮ
--    NGUYÊN cho người có ke_toan.
--
-- 4. CÔNG NỢ THEO KỲ — kho_cong_no_theo_ky: dòng đầu kỳ, từng chứng từ theo
--    ngày (tăng: nhập mua, nợ đầu kỳ, NCC hoàn tiền; giảm: trả tiền, giảm trừ,
--    bù trừ) với số dư chạy, dòng cuối kỳ. Cuối kỳ tới hôm nay = tổng còn nợ
--    của view. Dùng cho biên bản đối chiếu công nợ in được.
--    "Tăng" của một phiếu = phải trả HIỆN TẠI (hóa đơn nếu đã đối chiếu), ghi
--    vào ngày nhập — đối chiếu muộn làm đổi số của kỳ cũ, đúng như sổ công nợ.
--
-- 5. MISA — kho_du_lieu_misa(p_loai 'mua_hang' | 'thanh_toan'): dòng phẳng
--    (ngày / số chứng từ, số / ngày hóa đơn, mã NCC = ma_misa → mã số thuế →
--    "NCC-" + 8 ký tự đầu id, tên, MST, mã hàng = ma_misa → mã nội bộ, tên,
--    ĐVT kg, số lượng, đơn giá, thành tiền, thuế suất, tiền thuế chia theo số
--    dư lớn nhất, TK nợ / có / thuế từ misa_tk). Thiếu ma_misa vẫn xuất, cờ
--    thieu_ma. Chi phí khác của phiếu thành một dòng riêng.
--
-- 6. ĐỔI TÀI KHOẢN NGÂN HÀNG NCC — trigger ghi kho_ncc_tk_nhat_ky (cũ → mới,
--    ai, lúc) mỗi lần ngân hàng / số tài khoản đổi. Sự kiện ncc_doi_tai_khoan
--    cho CHỦ (cai_dat_goc) khi số tài khoản CŨ đã có (đổi thật, không phải
--    điền lần đầu) — chống lừa đổi số tài khoản nhận tiền.
--
-- SỰ KIỆN MỚI
--   tra_hang_cho_tien  nhac_nho  ke_toan: phiếu trả hàng chờ xác nhận tiền.
--                      ref_id = phiếu XT-, ref2 = NCC, ma = số XT-, ten = tên
--                      NCC, so = tổng kg trả, mốc = lúc ghi. Số đỏ mới cùng tên.
--   ncc_doi_tai_khoan  nhac_nho  chủ: ref_id = dòng nhật ký, ref2 = NCC,
--                      ma = số tài khoản MỚI, ten = tên NCC, phu = người đổi,
--                      mốc = lúc đổi (30 ngày gần nhất).
--
-- HÀM
--   kho_ghi_thanh_toan_v2, kho_xem_truoc_thanh_toan                  [ke_toan]
--   kho_doi_chieu_hoa_don_gop, kho_bo_doi_chieu_gop                  [ke_toan]
--   kho_tra_hang_ghi_kg                                     [nhap hoặc ke_toan]
--   kho_huy_tra_hang_cho_tien     [người ghi phiếu (nhap), ke_toan hoặc duyet]
--   kho_ds_tra_hang_cho_tien, kho_xac_nhan_tien_tra_hang             [ke_toan]
--   kho_cong_no_theo_ky, kho_du_lieu_misa, kho_luu_misa_tk,
--   kho_luu_ma_misa_mat_hang                                         [ke_toan]
--   Nội bộ: kho_chia_thanh_toan, kho_tien_tra_hang_goi_y.
--   Trigger: kho_ncc_ghi_doi_tai_khoan, kho_phieu_nhap_giu_hoa_don_gop.
--   Thay thân (cùng chữ ký): kho_su_kien, kho_dem_viec (chép 0039, thêm 0040).
--   View kho_v_cong_no_phieu, kho_v_cong_no_ncc: giữ cột cũ, thêm cột ở CUỐI.
-- =============================================================================


-- =============================================================================
-- 1 · CỘT MỚI: NHÀ CUNG CẤP, MẶT HÀNG, CÀI ĐẶT
-- =============================================================================
alter table kho_nha_cung_cap
  add column kieu_hoa_don text not null default 'tung_lan',
  add column ma_misa      text;
alter table kho_nha_cung_cap
  add constraint kho_nha_cung_cap_kieu_hoa_don_hop_le check (kieu_hoa_don in ('tung_lan', 'gop')),
  add constraint kho_nha_cung_cap_ma_misa_hop_le check (ma_misa is null or ma_misa ~ '^[A-Za-z0-9_./-]{1,40}$');
create unique index kho_nha_cung_cap_ma_misa_idx on kho_nha_cung_cap(upper(ma_misa)) where ma_misa is not null;

comment on column kho_nha_cung_cap.kieu_hoa_don is
  'Cách NCC xuất hóa đơn (0040): tung_lan = mỗi lần giao một hóa đơn; gop = một hóa đơn cho nhiều lần giao.';
comment on column kho_nha_cung_cap.ma_misa is
  'Mã nhà cung cấp bên phần mềm kế toán MISA (0040). Trống thì file MISA dùng mã số thuế / mã tạm và gắn cờ thiếu mã.';

alter table kho_mat_hang add column ma_misa text;
alter table kho_mat_hang
  add constraint kho_mat_hang_ma_misa_hop_le check (ma_misa is null or ma_misa ~ '^[A-Za-z0-9_./-]{1,40}$');
create unique index kho_mat_hang_ma_misa_idx on kho_mat_hang(upper(ma_misa)) where ma_misa is not null;

comment on column kho_mat_hang.ma_misa is
  'Mã hàng bên MISA (0040). Trống thì file MISA dùng mã nội bộ và gắn cờ thiếu mã. Kế toán sửa qua kho_luu_ma_misa_mat_hang.';

alter table kho_cai_dat
  add column misa_tk jsonb not null default
    '{"tk_no_hang":"1561","tk_thue":"1331","tk_co_ncc":"331","tk_tien_mat":"1111","tk_ngan_hang":"1121","tk_bu_tru":"131"}'::jsonb;
alter table kho_cai_dat
  add constraint kho_cai_dat_misa_tk_hop_le check (jsonb_typeof(misa_tk) = 'object');

comment on column kho_cai_dat.misa_tk is
  'Mã tài khoản mặc định khi xuất MISA (0040): tk_no_hang 1561, tk_thue 1331, tk_co_ncc 331, tk_tien_mat 1111, tk_ngan_hang 1121, tk_bu_tru 131. Sửa qua kho_luu_misa_tk (ke_toan).';


-- =============================================================================
-- 2 · THANH TOÁN: LOẠI bu_tru, hoan_tien
-- =============================================================================
alter table kho_thanh_toan drop constraint kho_thanh_toan_loai_hop_le;
alter table kho_thanh_toan add constraint kho_thanh_toan_loai_hop_le
  check (loai in ('thanh_toan', 'giam_tru', 'bu_tru', 'hoan_tien'));
alter table kho_thanh_toan drop constraint kho_thanh_toan_hinh_thuc_hop_le;
alter table kho_thanh_toan add constraint kho_thanh_toan_hinh_thuc_hop_le check (
  (loai in ('thanh_toan', 'hoan_tien') and hinh_thuc in ('chuyen_khoan', 'tien_mat', 'khac'))
  or (loai in ('giam_tru', 'bu_tru') and hinh_thuc is null));

comment on table kho_thanh_toan is
  'Tiền trả nhà cung cấp (thanh_toan), giảm trừ công nợ (giam_tru — chiết khấu, trả hàng), bù trừ (bu_tru — khoản NCC nợ lại, 0040), NCC hoàn tiền (hoan_tien, 0040). Không sửa: hủy rồi ghi lại.';


-- =============================================================================
-- 3 · NHẬT KÝ ĐỔI TÀI KHOẢN NGÂN HÀNG NCC
-- =============================================================================
create table kho_ncc_tk_nhat_ky (
  id               uuid primary key default gen_random_uuid(),
  nha_cung_cap_id  uuid not null references kho_nha_cung_cap(id) on delete cascade,
  ngan_hang_cu     text,
  so_tai_khoan_cu  text,
  ngan_hang_moi    text,
  so_tai_khoan_moi text,
  nguoi_doi        uuid references nhan_su(id) on delete set null,
  luc              timestamptz not null default now()
);

create index kho_ncc_tk_nhat_ky_luc_idx on kho_ncc_tk_nhat_ky(luc desc);
create index kho_ncc_tk_nhat_ky_ncc_idx on kho_ncc_tk_nhat_ky(nha_cung_cap_id, luc desc);

comment on table kho_ncc_tk_nhat_ky is
  'Mỗi lần ngân hàng / số tài khoản của NCC đổi (0040): cũ → mới, ai đổi, lúc nào. Chỉ trigger ghi. Chống lừa đổi số tài khoản nhận tiền.';

create or replace function kho_ncc_ghi_doi_tai_khoan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ngan_hang is distinct from old.ngan_hang or new.so_tai_khoan is distinct from old.so_tai_khoan then
    insert into kho_ncc_tk_nhat_ky
      (nha_cung_cap_id, ngan_hang_cu, so_tai_khoan_cu, ngan_hang_moi, so_tai_khoan_moi, nguoi_doi)
    values
      (new.id, old.ngan_hang, old.so_tai_khoan, new.ngan_hang, new.so_tai_khoan, (nhan_su_hien_tai()).id);
  end if;
  return new;
end;
$$;

create trigger kho_ncc_ghi_doi_tai_khoan
  after update of ngan_hang, so_tai_khoan on kho_nha_cung_cap
  for each row execute function kho_ncc_ghi_doi_tai_khoan();

alter table kho_ncc_tk_nhat_ky enable row level security;
create policy kho_ncc_tk_nhat_ky_doc on kho_ncc_tk_nhat_ky
  for select using ((select kho_co_quyen('ncc')));


-- =============================================================================
-- 4 · HÓA ĐƠN GỘP
-- =============================================================================
create table kho_hoa_don_ncc (
  id              uuid primary key default gen_random_uuid(),
  chi_nhanh_id    uuid not null references chi_nhanh(id) on delete restrict,
  ma_gui          uuid not null,
  nha_cung_cap_id uuid not null references kho_nha_cung_cap(id) on delete restrict,
  so_hoa_don      text not null,
  ngay            date not null,
  tong_tien       bigint not null,
  tien_thue       bigint not null default 0,
  tong_phieu      bigint not null,
  so_phieu        int not null,
  ly_do_lech      text,
  anh             text[] not null default '{}',
  trang_thai      text not null default 'hieu_luc',
  ds_phieu_da_bo  jsonb,
  ly_do_bo        text,
  nguoi_tao       uuid references nhan_su(id) on delete set null,
  nguoi_bo        uuid references nhan_su(id) on delete set null,
  bo_luc          timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint kho_hoa_don_ncc_ma_gui_duy_nhat unique (ma_gui),
  constraint kho_hoa_don_ncc_so_hop_le check (btrim(so_hoa_don) <> '' and length(so_hoa_don) <= 60),
  constraint kho_hoa_don_ncc_tien_hop_le check (tong_tien >= 0 and tien_thue >= 0 and tien_thue <= tong_tien),
  constraint kho_hoa_don_ncc_lech_hop_le check (tong_tien = tong_phieu or coalesce(btrim(ly_do_lech), '') <> ''),
  constraint kho_hoa_don_ncc_trang_thai_hop_le check (trang_thai in ('hieu_luc', 'da_bo'))
);

create unique index kho_hoa_don_ncc_so_idx on kho_hoa_don_ncc(chi_nhanh_id, nha_cung_cap_id, lower(so_hoa_don))
  where trang_thai = 'hieu_luc';
create index kho_hoa_don_ncc_ds_idx on kho_hoa_don_ncc(chi_nhanh_id, ngay desc);

create trigger kho_hoa_don_ncc_updated_at
  before update on kho_hoa_don_ncc
  for each row execute function tu_dong_cap_nhat_updated_at();

create table kho_hoa_don_phieu (
  id                 uuid primary key default gen_random_uuid(),
  hoa_don_id         uuid not null references kho_hoa_don_ncc(id) on delete cascade,
  chi_nhanh_id       uuid not null references chi_nhanh(id) on delete restrict,
  phieu_id           uuid not null references kho_phieu_nhap(id) on delete restrict,
  thu_tu             int not null default 0,
  tong_phieu         bigint not null,
  so_tien            bigint not null,
  tien_thue          bigint not null default 0,
  truoc_so_hoa_don   text,
  truoc_ngay_hoa_don date,
  truoc_tien_hoa_don bigint,
  truoc_da_doi_chieu boolean not null,
  truoc_han          date,
  truoc_ghi_chu      text,
  truoc_nguoi        uuid references nhan_su(id) on delete set null,
  truoc_luc          timestamptz,

  constraint kho_hoa_don_phieu_phieu_duy_nhat unique (phieu_id),
  constraint kho_hoa_don_phieu_tien_hop_le check (so_tien >= 0 and tien_thue >= 0)
);

create index kho_hoa_don_phieu_hd_idx on kho_hoa_don_phieu(hoa_don_id, thu_tu);

comment on table kho_hoa_don_ncc is
  'Hóa đơn gộp của NCC — một hóa đơn cho nhiều phiếu nhận hàng (0040). Ghi qua kho_doi_chieu_hoa_don_gop, bỏ qua kho_bo_doi_chieu_gop (trang_thai da_bo, danh sách phiếu cũ ở ds_phieu_da_bo).';
comment on table kho_hoa_don_phieu is
  'Phiếu nhập thuộc hóa đơn gộp nào + phần tiền hóa đơn chia cho phiếu + giá trị đối chiếu cũ của phiếu (truoc_*) để bỏ đối chiếu thì trả về như trước.';

alter table kho_hoa_don_ncc   enable row level security;
alter table kho_hoa_don_phieu enable row level security;
create policy kho_hoa_don_ncc_doc on kho_hoa_don_ncc
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('ke_toan'))::uuid[]));
create policy kho_hoa_don_phieu_doc on kho_hoa_don_phieu
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('ke_toan'))::uuid[]));

-- Phiếu đang thuộc hóa đơn gộp: không hủy, không sửa số / tiền hóa đơn riêng lẻ
-- (tổng các phần phải luôn bằng tổng hóa đơn). Muốn sửa: bỏ đối chiếu gộp trước.
create or replace function kho_phieu_nhap_giu_hoa_don_gop()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_so text;
begin
  select h.so_hoa_don into v_so
  from kho_hoa_don_phieu hp join kho_hoa_don_ncc h on h.id = hp.hoa_don_id
  where hp.phieu_id = new.id;
  if not found then
    return new;
  end if;
  if new.trang_thai = 'da_huy' and old.trang_thai is distinct from 'da_huy' then
    raise exception 'Phiếu % nằm trong hóa đơn gộp % — kế toán bỏ đối chiếu hóa đơn đó trước', new.so_phieu, v_so
      using errcode = 'check_violation';
  end if;
  if new.tien_hoa_don is distinct from old.tien_hoa_don or new.so_hoa_don is distinct from old.so_hoa_don
     or new.ngay_hoa_don is distinct from old.ngay_hoa_don or new.da_doi_chieu is distinct from old.da_doi_chieu then
    raise exception 'Phiếu % đã đối chiếu theo hóa đơn gộp % — muốn sửa thì bỏ đối chiếu hóa đơn gộp rồi làm lại', new.so_phieu, v_so
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger kho_phieu_nhap_giu_hoa_don_gop
  before update of trang_thai, tien_hoa_don, so_hoa_don, ngay_hoa_don, da_doi_chieu on kho_phieu_nhap
  for each row execute function kho_phieu_nhap_giu_hoa_don_gop();


-- =============================================================================
-- 5 · VIEW CÔNG NỢ — dựng lại, GIỮ NGUYÊN cột và thứ tự, thêm cột ở CUỐI
-- =============================================================================
-- da_tra = tiền trả + bù trừ − NCC hoàn tiền (xem đầu file). Cột mới: loai
-- (mua | no_dau), tien_tra, bu_tru, hoan_tien, hoa_don_gop_id.
create or replace view kho_v_cong_no_phieu with (security_invoker = true) as
select x.id, x.chi_nhanh_id, x.so_phieu, x.nha_cung_cap_id, x.ten_nha_cung_cap,
       x.ngay_nhap, x.so_hoa_don, x.ngay_hoa_don, x.han_thanh_toan,
       x.tien_hoa_don, x.da_doi_chieu, x.ghi_chu_doi_chieu, x.doi_chieu_luc,
       x.tong_tien_phieu, x.phai_tra, x.da_tra, x.giam_tru,
       x.phai_tra - x.da_tra - x.giam_tru as con_no,
       (x.phai_tra - x.da_tra - x.giam_tru > 0
        and x.han_thanh_toan is not null and x.han_thanh_toan < hom_nay_vn()) as qua_han,
       case when x.phai_tra - x.da_tra - x.giam_tru > 0 and x.han_thanh_toan < hom_nay_vn()
            then hom_nay_vn() - x.han_thanh_toan else 0 end as so_ngay_qua_han,
       -- 0040
       x.loai, x.tien_tra, x.bu_tru, x.hoan_tien, x.hoa_don_gop_id
from (
  select p.id, p.chi_nhanh_id, p.so_phieu, p.nha_cung_cap_id, n.ten as ten_nha_cung_cap,
         p.ngay_nhap, p.so_hoa_don, p.ngay_hoa_don, p.han_thanh_toan,
         p.tien_hoa_don, p.da_doi_chieu, p.ghi_chu_doi_chieu, p.doi_chieu_luc,
         coalesce(d.tien_hang, 0) + p.tien_thue + p.chi_phi_khac + coalesce(p.tien_no_dau, 0) as tong_tien_phieu,
         coalesce(p.tien_hoa_don,
                  coalesce(d.tien_hang, 0) + p.tien_thue + p.chi_phi_khac + coalesce(p.tien_no_dau, 0)) as phai_tra,
         coalesce(t.da_tra, 0) + coalesce(t.bu_tru, 0) - coalesce(t.hoan_tien, 0) as da_tra,
         coalesce(t.giam_tru, 0) as giam_tru,
         p.loai,
         coalesce(t.da_tra, 0) as tien_tra,
         coalesce(t.bu_tru, 0) as bu_tru,
         coalesce(t.hoan_tien, 0) as hoan_tien,
         hp.hoa_don_id as hoa_don_gop_id
  from kho_phieu_nhap p
  join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
  left join lateral (
    select sum(dd.thanh_tien) as tien_hang from kho_phieu_nhap_dong dd where dd.phieu_nhap_id = p.id
  ) d on true
  left join lateral (
    select sum(pb.so_tien) filter (where tt.loai = 'thanh_toan') as da_tra,
           sum(pb.so_tien) filter (where tt.loai = 'giam_tru') as giam_tru,
           sum(pb.so_tien) filter (where tt.loai = 'bu_tru') as bu_tru,
           sum(pb.so_tien) filter (where tt.loai = 'hoan_tien') as hoan_tien
    from kho_thanh_toan_phan_bo pb
    join kho_thanh_toan tt on tt.id = pb.thanh_toan_id
    where pb.phieu_nhap_id = p.id and tt.trang_thai = 'hieu_luc'
  ) t on true
  left join kho_hoa_don_phieu hp on hp.phieu_id = p.id
  where p.loai in ('mua', 'no_dau') and p.trang_thai = 'da_duyet'
) x;

comment on view kho_v_cong_no_phieu is
  'Công nợ từng phiếu nhập mua đã duyệt và từng phiếu nợ đầu kỳ (0035): phải trả, đã trả (0040: tiền trả + bù trừ − NCC hoàn tiền), giảm trừ, còn nợ, quá hạn; 0040 thêm cuối: loai, tien_tra, bu_tru, hoan_tien, hoa_don_gop_id. Chỉ vai xem giá đọc được (RLS của kho_phieu_nhap).';

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
       min(c.han_thanh_toan) filter (where c.con_no > 0) as han_gan_nhat,
       -- 0040
       sum(c.tien_tra)::bigint as tien_tra,
       sum(c.bu_tru)::bigint as bu_tru,
       sum(c.hoan_tien)::bigint as hoan_tien,
       (count(*) filter (where c.hoa_don_gop_id is not null))::int as so_phieu_hoa_don_gop,
       coalesce(sum(c.con_no) filter (where c.con_no > 0 and c.han_thanh_toan between hom_nay_vn() and hom_nay_vn() + 7), 0)::bigint
         as no_den_han_7_ngay
from kho_v_cong_no_phieu c
group by c.chi_nhanh_id, c.nha_cung_cap_id, c.ten_nha_cung_cap;

comment on view kho_v_cong_no_ncc is
  'Công nợ gom theo nhà cung cấp (gồm cả nợ đầu kỳ — 0035). 0040 thêm cuối: tien_tra, bu_tru, hoan_tien, so_phieu_hoa_don_gop, no_den_han_7_ngay.';


-- =============================================================================
-- 6 · GHI THANH TOÁN BỐN LOẠI, XEM TRƯỚC CÁCH CHIA
-- =============================================================================
-- NỘI BỘ. Cách tự chia một số tiền cho các phiếu của một NCC:
--   thanh_toan, giam_tru, bu_tru: phiếu còn nợ > 0, hạn sớm nhất trước (như 0024);
--   hoan_tien: phiếu còn nợ < 0 (NCC nợ lại quán), ngày nhập cũ trước.
-- con_lai = phần phiếu nhận được tối đa. so_tien = phần được chia (0 nếu tiền
-- đã hết trước khi tới phiếu này). p_so_tien null = chia đủ ("Trả đủ").
create or replace function kho_chia_thanh_toan(p_chi_nhanh_id uuid, p_nha_cung_cap_id uuid, p_loai text, p_so_tien bigint)
returns table (phieu_nhap_id uuid, so_phieu text, ngay_nhap date, han_thanh_toan date, con_lai bigint, so_tien bigint)
language plpgsql
stable
set search_path = public
as $$
#variable_conflict use_column
declare
  v_con bigint := p_so_tien;
  v_r   record;
  v_lay bigint;
begin
  for v_r in
    select c.id, c.so_phieu, c.ngay_nhap, c.han_thanh_toan,
           (case when p_loai = 'hoan_tien' then -c.con_no else c.con_no end)::bigint as con_lai
    from kho_v_cong_no_phieu c
    where c.chi_nhanh_id = p_chi_nhanh_id and c.nha_cung_cap_id = p_nha_cung_cap_id
      and case when p_loai = 'hoan_tien' then c.con_no < 0 else c.con_no > 0 end
    order by case when p_loai = 'hoan_tien' then null else c.han_thanh_toan end nulls last,
             c.ngay_nhap, c.so_phieu
  loop
    v_lay := case when v_con is null then v_r.con_lai else greatest(least(v_con, v_r.con_lai), 0) end;
    if v_con is not null then
      v_con := v_con - v_lay;
    end if;
    return query select v_r.id, v_r.so_phieu, v_r.ngay_nhap, v_r.han_thanh_toan, v_r.con_lai, v_lay;
  end loop;
end;
$$;

comment on function kho_chia_thanh_toan is
  'NỘI BỘ (0040). Tự chia một khoản cho các phiếu của NCC: trả / giảm trừ / bù trừ vào phiếu còn nợ theo hạn sớm nhất; hoàn tiền vào phiếu còn nợ âm theo ngày nhập.';

create or replace function kho_xem_truoc_thanh_toan(
  p_chi_nhanh_id    uuid,
  p_nha_cung_cap_id uuid,
  p_loai            text,
  p_so_tien         bigint
)
returns table (phieu_nhap_id uuid, so_phieu text, ngay_nhap date, han_thanh_toan date, con_lai bigint, so_tien bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    raise exception 'Tài khoản của bạn không xem được công nợ' using errcode = 'insufficient_privilege';
  end if;
  if p_loai is null or p_loai not in ('thanh_toan', 'giam_tru', 'bu_tru', 'hoan_tien') then
    raise exception 'Loại không hợp lệ' using errcode = 'check_violation';
  end if;
  if p_so_tien is not null and (p_so_tien < 0 or p_so_tien >= 10000000000000) then
    raise exception 'Số tiền không hợp lệ' using errcode = 'check_violation';
  end if;
  return query select * from kho_chia_thanh_toan(p_chi_nhanh_id, p_nha_cung_cap_id, p_loai, p_so_tien);
end;
$$;

comment on function kho_xem_truoc_thanh_toan is
  'Xem trước cách một khoản được chia vào các phiếu (đúng thứ tự kho_ghi_thanh_toan_v2 sẽ chia). p_so_tien null = trả đủ: so_tien = con_lai mọi phiếu. Tổng so_tien < số nhập = vượt số còn nợ.';

-- p_phan_bo: [{phieu_nhap_id, so_tien}] — rỗng thì tự chia (kho_chia_thanh_toan).
create or replace function kho_ghi_thanh_toan_v2(
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
#variable_conflict use_column
declare
  v_id    uuid;
  v_so    text;
  v_anh   text;
  v_tong  bigint := 0;
  v_no    bigint;
  v_r     record;
  v_dong  jsonb;
  v_khoa  text;
  v_pn    uuid;
  v_tien  bigint;
  v_ds    uuid[] := '{}';
  v_tien_ds bigint[] := '{}';
  v_hoan  boolean;
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

  if p_loai is null or p_loai not in ('thanh_toan', 'giam_tru', 'bu_tru', 'hoan_tien') then
    raise exception 'Loại không hợp lệ' using errcode = 'check_violation';
  end if;
  v_hoan := p_loai = 'hoan_tien';
  if p_loai in ('thanh_toan', 'hoan_tien')
     and (p_hinh_thuc is null or p_hinh_thuc not in ('chuyen_khoan', 'tien_mat', 'khac')) then
    raise exception 'Chọn hình thức: chuyển khoản, tiền mặt hoặc khác' using errcode = 'check_violation';
  end if;
  if p_loai = 'bu_tru' and coalesce(btrim(p_ghi_chu), '') = '' then
    raise exception 'Bù trừ: ghi rõ khoản nhà cung cấp nợ lại quán (ví dụ tiền cọc, vỏ thùng)' using errcode = 'check_violation';
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
    for v_r in select * from kho_chia_thanh_toan(p_chi_nhanh_id, p_nha_cung_cap_id, p_loai, p_so_tien) loop
      if v_r.so_tien > 0 then
        v_ds := v_ds || v_r.phieu_nhap_id;
        v_tien_ds := v_tien_ds || v_r.so_tien;
        v_tong := v_tong + v_r.so_tien;
      end if;
      v_no := coalesce(v_no, 0) + v_r.con_lai;
    end loop;
    if v_tong < p_so_tien then
      if v_hoan then
        raise exception 'Số tiền lớn hơn số nhà cung cấp còn nợ lại quán (% đ)',
          replace(to_char(coalesce(v_no, 0), 'FM999G999G999G999'), ',', '.')
          using errcode = 'check_violation';
      end if;
      raise exception 'Số tiền lớn hơn công nợ còn lại của nhà cung cấp (% đ)',
        replace(to_char(coalesce(v_no, 0), 'FM999G999G999G999'), ',', '.')
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
      select (case when v_hoan then -c.con_no else c.con_no end)::bigint into v_no from kho_v_cong_no_phieu c
      where c.id = v_pn and c.chi_nhanh_id = p_chi_nhanh_id and c.nha_cung_cap_id = p_nha_cung_cap_id;
      if not found then
        raise exception 'Phiếu nhập được chọn không phải phiếu mua đã duyệt của nhà cung cấp này' using errcode = 'check_violation';
      end if;
      if v_tien > v_no then
        if v_hoan then
          raise exception 'Phiếu %: nhà cung cấp chỉ còn nợ lại quán % đ', (select p.so_phieu from kho_phieu_nhap p where p.id = v_pn),
            replace(to_char(greatest(v_no, 0), 'FM999G999G999G999'), ',', '.')
            using errcode = 'check_violation';
        end if;
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
    (p_chi_nhanh_id,
     kho_sinh_so(p_chi_nhanh_id, case p_loai when 'thanh_toan' then 'TT' when 'giam_tru' then 'GT'
                                             when 'bu_tru' then 'BT' else 'HT' end),
     p_ma_gui, p_nha_cung_cap_id, p_loai,
     case when p_loai in ('thanh_toan', 'hoan_tien') then p_hinh_thuc end,
     p_so_tien, p_ngay, nullif(btrim(p_ghi_chu), ''), coalesce(p_anh, '{}'), (nhan_su_hien_tai()).id)
  returning kho_thanh_toan.id, kho_thanh_toan.so_phieu into v_id, v_so;

  for i in 1..coalesce(array_length(v_ds, 1), 0) loop
    insert into kho_thanh_toan_phan_bo (thanh_toan_id, chi_nhanh_id, phieu_nhap_id, so_tien)
    values (v_id, p_chi_nhanh_id, v_ds[i], v_tien_ds[i]);
  end loop;

  return query select v_id, v_so, false;
end;
$$;

comment on function kho_ghi_thanh_toan_v2 is
  'Ghi một khoản cho NCC (0040): trả tiền (TT-), giảm trừ (GT-), bù trừ (BT-, bắt buộc ghi chú), NCC hoàn tiền (HT-, chỉ vào phiếu còn nợ âm, không vượt 0). Cùng tham số kho_ghi_thanh_toan (0024 — giữ nguyên). Tự chia khi không chọn phiếu.';


-- =============================================================================
-- 7 · HÓA ĐƠN GỘP — RPC
-- =============================================================================
create or replace function kho_doi_chieu_hoa_don_gop(
  p_chi_nhanh_id uuid,
  p_ma_gui       uuid,
  p_ncc          uuid,
  p_so_hoa_don   text,
  p_ngay         date,
  p_tong_tien    bigint,
  p_tien_thue    bigint,
  p_phieu        uuid[],
  p_ly_do_lech   text
)
returns table (hoa_don_id uuid, tong_phieu bigint, lech bigint, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_hd    kho_hoa_don_ncc;
  v_ncc   kho_nha_cung_cap;
  v_ids   uuid[] := '{}';
  v_tp    numeric[] := '{}';
  v_tong  bigint := 0;
  v_lech  bigint;
  v_thue  bigint := coalesce(p_tien_thue, 0);
  v_phan  bigint[];
  v_pthue bigint[];
  v_p     kho_phieu_nhap;
  v_so    text;
  v_n     int;
  v_id    uuid;
  v_ly_do text := nullif(btrim(p_ly_do_lech), '');
  i       int;
begin
  if not kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    raise exception 'Tài khoản của bạn không được đối chiếu hóa đơn' using errcode = 'insufficient_privilege';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;

  select * into v_hd from kho_hoa_don_ncc h where h.ma_gui = p_ma_gui;
  if found then
    return query select v_hd.id, v_hd.tong_phieu, v_hd.tong_tien - v_hd.tong_phieu, true;
    return;
  end if;

  select * into v_ncc from kho_nha_cung_cap where id = p_ncc;
  if not found then
    raise exception 'Không tìm thấy nhà cung cấp' using errcode = 'check_violation';
  end if;
  if coalesce(btrim(p_so_hoa_don), '') = '' or length(btrim(p_so_hoa_don)) > 60 then
    raise exception 'Ghi số hóa đơn' using errcode = 'check_violation';
  end if;
  if p_ngay is null then
    raise exception 'Ghi ngày hóa đơn' using errcode = 'check_violation';
  end if;
  if p_ngay > hom_nay_vn() then
    raise exception 'Ngày hóa đơn không được sau hôm nay' using errcode = 'check_violation';
  end if;
  if p_tong_tien is null or p_tong_tien < 0 or p_tong_tien >= 10000000000000 then
    raise exception 'Ghi tổng tiền trên hóa đơn (số đồng không âm)' using errcode = 'check_violation';
  end if;
  if v_thue < 0 or v_thue > p_tong_tien then
    raise exception 'Tiền thuế phải từ 0 đến tổng tiền hóa đơn' using errcode = 'check_violation';
  end if;
  v_n := coalesce(cardinality(p_phieu), 0);
  if v_n < 2 then
    raise exception 'Hóa đơn gộp cần từ 2 phiếu trở lên — một phiếu thì dùng "Đối chiếu hóa đơn" thường'
      using errcode = 'check_violation';
  end if;
  if v_n > 200 then
    raise exception 'Một hóa đơn gộp tối đa 200 phiếu' using errcode = 'check_violation';
  end if;
  if array_position(p_phieu, null) is not null
     or (select count(distinct x) from unnest(p_phieu) x) <> v_n then
    raise exception 'Một phiếu bị chọn hai lần' using errcode = 'check_violation';
  end if;
  if exists (select 1 from kho_hoa_don_ncc h
             where h.chi_nhanh_id = p_chi_nhanh_id and h.nha_cung_cap_id = p_ncc
               and h.trang_thai = 'hieu_luc' and lower(h.so_hoa_don) = lower(btrim(p_so_hoa_don))) then
    raise exception 'Hóa đơn số % của nhà cung cấp này đã được đối chiếu', btrim(p_so_hoa_don)
      using errcode = 'check_violation';
  end if;

  -- Khóa các phiếu theo thứ tự id (tránh kẹt khóa), rồi xếp theo ngày nhập để chia.
  perform 1 from kho_phieu_nhap where id = any(p_phieu) order by id for update;
  for v_p in
    select * from kho_phieu_nhap where id = any(p_phieu) order by ngay_nhap, so_phieu
  loop
    if v_p.chi_nhanh_id <> p_chi_nhanh_id or v_p.loai <> 'mua' or v_p.trang_thai <> 'da_duyet'
       or v_p.nha_cung_cap_id is distinct from p_ncc then
      raise exception 'Phiếu % không phải phiếu nhập mua đã duyệt của nhà cung cấp này', v_p.so_phieu
        using errcode = 'check_violation';
    end if;
    select h.so_hoa_don into v_so
    from kho_hoa_don_phieu hp join kho_hoa_don_ncc h on h.id = hp.hoa_don_id where hp.phieu_id = v_p.id;
    if found then
      raise exception 'Phiếu % đã nằm trong hóa đơn gộp % — bỏ đối chiếu hóa đơn đó trước', v_p.so_phieu, v_so
        using errcode = 'check_violation';
    end if;
    v_ids := v_ids || v_p.id;
    v_tp := v_tp || (select c.tong_tien_phieu from kho_v_cong_no_phieu c where c.id = v_p.id);
  end loop;
  if coalesce(cardinality(v_ids), 0) <> v_n then
    raise exception 'Có phiếu không tìm thấy — tải lại trang rồi chọn lại' using errcode = 'check_violation';
  end if;

  for i in 1..v_n loop
    v_tong := v_tong + v_tp[i]::bigint;
  end loop;
  v_lech := p_tong_tien - v_tong;
  if v_lech <> 0 and v_ly_do is null then
    raise exception 'Tổng hóa đơn lệch % đ so với tổng các phiếu (% đ) — ghi lý do lệch',
      case when v_lech > 0 then '+' else '−' end || replace(to_char(abs(v_lech), 'FM999G999G999G999'), ',', '.'),
      replace(to_char(v_tong, 'FM999G999G999G999'), ',', '.')
      using errcode = 'check_violation';
  end if;

  v_phan  := kho_chia_so_du_lon_nhat(p_tong_tien, v_tp);
  v_pthue := kho_chia_so_du_lon_nhat(v_thue, v_tp);

  insert into kho_hoa_don_ncc
    (chi_nhanh_id, ma_gui, nha_cung_cap_id, so_hoa_don, ngay, tong_tien, tien_thue, tong_phieu, so_phieu,
     ly_do_lech, nguoi_tao)
  values
    (p_chi_nhanh_id, p_ma_gui, p_ncc, btrim(p_so_hoa_don), p_ngay, p_tong_tien, v_thue, v_tong, v_n,
     case when v_lech <> 0 then v_ly_do end, (nhan_su_hien_tai()).id)
  returning id into v_id;

  for i in 1..v_n loop
    select * into v_p from kho_phieu_nhap where id = v_ids[i];
    -- Ghi phiếu TRƯỚC khi gắn vào hóa đơn: trigger giữ hóa đơn gộp chỉ chặn phiếu đã gắn.
    update kho_phieu_nhap set
      so_hoa_don        = btrim(p_so_hoa_don),
      ngay_hoa_don      = p_ngay,
      tien_hoa_don      = v_phan[i],
      han_thanh_toan    = p_ngay + coalesce(v_ncc.so_ngay_no, 0),
      da_doi_chieu      = true,
      ghi_chu_doi_chieu = 'Hóa đơn gộp ' || btrim(p_so_hoa_don) || ' (' || v_n || ' phiếu)'
                          || case when v_lech <> 0 then ' — lệch: ' || v_ly_do else '' end,
      nguoi_doi_chieu   = (nhan_su_hien_tai()).id,
      doi_chieu_luc     = now()
    where id = v_ids[i];
    insert into kho_hoa_don_phieu
      (hoa_don_id, chi_nhanh_id, phieu_id, thu_tu, tong_phieu, so_tien, tien_thue,
       truoc_so_hoa_don, truoc_ngay_hoa_don, truoc_tien_hoa_don, truoc_da_doi_chieu, truoc_han, truoc_ghi_chu,
       truoc_nguoi, truoc_luc)
    values
      (v_id, p_chi_nhanh_id, v_ids[i], i, v_tp[i]::bigint, v_phan[i], v_pthue[i],
       v_p.so_hoa_don, v_p.ngay_hoa_don, v_p.tien_hoa_don, v_p.da_doi_chieu, v_p.han_thanh_toan, v_p.ghi_chu_doi_chieu,
       v_p.nguoi_doi_chieu, v_p.doi_chieu_luc);
  end loop;

  return query select v_id, v_tong, v_lech, false;
end;
$$;

comment on function kho_doi_chieu_hoa_don_gop is
  'Đối chiếu MỘT hóa đơn NCC cho NHIỀU phiếu nhập (0040): chia tổng tiền và tiền thuế theo tỉ lệ tổng từng phiếu, phần lẻ theo số dư lớn nhất (tổng khớp từng đồng); lệch tổng phiếu thì bắt buộc lý do. ma_gui chống bấm hai lần.';

create or replace function kho_bo_doi_chieu_gop(p_hoa_don_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hd kho_hoa_don_ncc;
  v_r  record;
  v_ds jsonb := '[]'::jsonb;
begin
  select * into v_hd from kho_hoa_don_ncc where id = p_hoa_don_id;
  if not found or not kho_duoc(v_hd.chi_nhanh_id, 'ke_toan') then
    raise exception 'Không tìm thấy hóa đơn gộp, hoặc tài khoản không được bỏ đối chiếu'
      using errcode = 'insufficient_privilege';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Cần ghi lý do bỏ đối chiếu' using errcode = 'check_violation';
  end if;
  select * into v_hd from kho_hoa_don_ncc where id = p_hoa_don_id for update;
  if v_hd.trang_thai = 'da_bo' then
    return 'Hóa đơn gộp ' || v_hd.so_hoa_don || ' đã được bỏ đối chiếu trước đó.';
  end if;
  if exists (
    select 1 from kho_hoa_don_phieu hp
    join kho_thanh_toan_phan_bo pb on pb.phieu_nhap_id = hp.phieu_id
    join kho_thanh_toan t on t.id = pb.thanh_toan_id
    where hp.hoa_don_id = v_hd.id and t.trang_thai = 'hieu_luc') then
    raise exception 'Các phiếu của hóa đơn % đã có khoản trả tiền, giảm trừ, bù trừ hoặc hoàn tiền — hủy các khoản đó trước rồi mới bỏ đối chiếu',
      v_hd.so_hoa_don using errcode = 'check_violation';
  end if;

  for v_r in
    select hp.*, p.so_phieu from kho_hoa_don_phieu hp join kho_phieu_nhap p on p.id = hp.phieu_id
    where hp.hoa_don_id = v_hd.id order by hp.thu_tu for update of hp
  loop
    v_ds := v_ds || jsonb_build_object('phieu_id', v_r.phieu_id, 'so_phieu', v_r.so_phieu,
                                       'tong_phieu', v_r.tong_phieu, 'so_tien', v_r.so_tien, 'tien_thue', v_r.tien_thue);
    -- Gỡ khỏi hóa đơn TRƯỚC rồi mới trả phiếu về như cũ (trigger giữ hóa đơn gộp).
    delete from kho_hoa_don_phieu where id = v_r.id;
    update kho_phieu_nhap set
      so_hoa_don        = v_r.truoc_so_hoa_don,
      ngay_hoa_don      = v_r.truoc_ngay_hoa_don,
      tien_hoa_don      = v_r.truoc_tien_hoa_don,
      da_doi_chieu      = v_r.truoc_da_doi_chieu,
      han_thanh_toan    = v_r.truoc_han,
      ghi_chu_doi_chieu = v_r.truoc_ghi_chu,
      nguoi_doi_chieu   = v_r.truoc_nguoi,
      doi_chieu_luc     = v_r.truoc_luc
    where id = v_r.phieu_id;
  end loop;

  update kho_hoa_don_ncc set trang_thai = 'da_bo', ds_phieu_da_bo = v_ds, ly_do_bo = btrim(p_ly_do),
                             nguoi_bo = (nhan_su_hien_tai()).id, bo_luc = now()
  where id = v_hd.id;
  return 'Đã bỏ đối chiếu hóa đơn gộp ' || v_hd.so_hoa_don || ' — ' || jsonb_array_length(v_ds)
    || ' phiếu trở lại như trước khi đối chiếu.';
end;
$$;

comment on function kho_bo_doi_chieu_gop is
  'Bỏ đối chiếu một hóa đơn gộp (0040): chỉ khi các phiếu chưa có khoản trả tiền / giảm trừ / bù trừ / hoàn tiền còn hiệu lực. Phiếu trở về đúng giá trị đối chiếu trước đó.';


-- =============================================================================
-- 8 · TRẢ HÀNG HAI BƯỚC
-- =============================================================================
alter table kho_phieu_xuat drop constraint kho_phieu_xuat_trang_thai_hop_le;
alter table kho_phieu_xuat add constraint kho_phieu_xuat_trang_thai_hop_le
  check (trang_thai in ('da_ghi', 'cho_duyet', 'da_duyet', 'tu_choi',
                        'dang_chuyen', 'da_nhan', 'nhan_thieu', 'da_tra_ve', 'da_huy',
                        'cho_xac_nhan_tien'));
alter table kho_phieu_xuat
  add column nguoi_xac_nhan uuid references nhan_su(id) on delete set null,
  add column xac_nhan_luc   timestamptz;
alter table kho_phieu_xuat
  add constraint kho_phieu_xuat_cho_tien_hop_le check (trang_thai <> 'cho_xac_nhan_tien' or loai = 'tra_ncc');
-- 0032 chỉ cho phiếu chuyển dùng các trạng thái đi đường / da_huy. Thêm: phiếu
-- trả hàng còn chờ xác nhận tiền hủy được (kho_huy_tra_hang_cho_tien) → da_huy.
alter table kho_phieu_xuat drop constraint kho_phieu_xuat_di_duong_hop_le;
alter table kho_phieu_xuat add constraint kho_phieu_xuat_di_duong_hop_le check (
  trang_thai not in ('dang_chuyen', 'da_nhan', 'nhan_thieu', 'da_tra_ve', 'da_huy') or loai = 'chuyen'
  or (loai = 'tra_ncc' and trang_thai = 'da_huy'));

create index kho_phieu_xuat_cho_tien_idx on kho_phieu_xuat(chi_nhanh_id) where trang_thai = 'cho_xac_nhan_tien';

comment on column kho_phieu_xuat.xac_nhan_luc is
  'Trả hàng hai bước (0040): lúc kế toán xác nhận số tiền giảm trừ. Phiếu trả hàng ở trạng thái cho_xac_nhan_tien cho tới lúc đó.';

-- NỘI BỘ. Số tiền giảm trừ tự tính của một phiếu trả hàng, đúng công thức 0024:
-- Σ round(kg trả × đơn giá mua của lô) + phần thuế tương ứng của phiếu nhập.
create or replace function kho_tien_tra_hang_goi_y(p_phieu_xuat_id uuid)
returns bigint
language sql
stable
set search_path = public
as $$
  with gt as (
    select coalesce(sum(round(d.so_kg * coalesce(nd.don_gia_kg, 0))::bigint), 0) as gia_tri
    from kho_phieu_xuat_dong d
    join kho_lo l on l.id = d.lo_id
    left join kho_phieu_nhap_dong nd on nd.id = l.phieu_nhap_dong_id
    where d.phieu_xuat_id = p_phieu_xuat_id
  ),
  pn as (
    select p.tien_thue,
           (select coalesce(sum(dd.thanh_tien), 0) from kho_phieu_nhap_dong dd where dd.phieu_nhap_id = p.id) as tien_hang
    from kho_phieu_xuat x join kho_phieu_nhap p on p.id = x.phieu_nhap_id
    where x.id = p_phieu_xuat_id
  )
  select gt.gia_tri + case when pn.tien_thue > 0 and pn.tien_hang > 0
                           then round(pn.tien_thue::numeric * gt.gia_tri / pn.tien_hang)::bigint else 0 end
  from gt, pn
$$;

comment on function kho_tien_tra_hang_goi_y is
  'NỘI BỘ (0040). Tiền giảm trừ tự tính của phiếu trả hàng: kg × đơn giá mua + phần thuế tương ứng (như 0024).';

-- Bước 1 — CHỈ KG. p_dong: [{lo_id, so_kg, so_goi}] — lô của cùng một phiếu
-- nhập, đang ở p_vi_tri_id. p_phieu_nhap_id null = lấy theo lô đầu tiên.
create or replace function kho_tra_hang_ghi_kg(
  p_chi_nhanh_id  uuid,
  p_ma_gui        uuid,
  p_phieu_nhap_id uuid,
  p_vi_tri_id     uuid,
  p_ghi_chu       text,
  p_anh           text[],
  p_dong          jsonb
)
returns table (phieu_xuat_id uuid, so_phieu text, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_nv      nhan_su;
  v_pn      kho_phieu_nhap;
  v_pn_id   uuid := p_phieu_nhap_id;
  v_vt      kho_vi_tri;
  v_id      uuid;
  v_so      text;
  v_anh     text;
  v_dong    jsonb;
  v_khoa    text;
  v_i       int := 0;
  v_lo      kho_lo;
  v_mh      kho_mat_hang;
  v_kg      numeric;
  v_goi     int;
  v_ton_kg  numeric;
  v_ton_goi int;
  c_uuid    constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  if not (kho_duoc(p_chi_nhanh_id, 'nhap') or kho_duoc(p_chi_nhanh_id, 'ke_toan')) then
    raise exception 'Tài khoản của bạn không được ghi trả hàng nhà cung cấp' using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;

  select px.id, px.so_phieu into v_id, v_so from kho_phieu_xuat px where px.ma_gui = p_ma_gui;
  if found then
    return query select v_id, v_so, true;
    return;
  end if;

  if p_dong is null or jsonb_typeof(p_dong) <> 'array' or jsonb_array_length(p_dong) = 0 then
    raise exception 'Chưa chọn hàng trả' using errcode = 'check_violation';
  end if;
  if v_pn_id is null then
    -- Lấy phiếu nhập theo lô đầu tiên (thủ kho chọn lô, không chọn phiếu).
    select d.phieu_nhap_id into v_pn_id
    from kho_lo l join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where jsonb_typeof(p_dong -> 0) = 'object' and (p_dong -> 0 ->> 'lo_id') ~* c_uuid
      and l.id = (p_dong -> 0 ->> 'lo_id')::uuid;
  end if;
  select * into v_pn from kho_phieu_nhap where id = v_pn_id;
  if not found or v_pn.chi_nhanh_id <> p_chi_nhanh_id or v_pn.loai <> 'mua' or v_pn.trang_thai <> 'da_duyet' then
    raise exception 'Chỉ trả hàng được cho hàng nhập mua (phiếu đã duyệt) của chi nhánh này' using errcode = 'check_violation';
  end if;
  select * into v_vt from kho_vi_tri where id = p_vi_tri_id;
  if not found or v_vt.chi_nhanh_id <> p_chi_nhanh_id or v_vt.loai = 'cho_huy' then
    raise exception 'Chọn nơi đang để hàng cần trả (kho hoặc quầy)' using errcode = 'check_violation';
  end if;
  if coalesce(array_length(p_anh, 1), 0) > 8 then
    raise exception 'Tối đa 8 ảnh' using errcode = 'check_violation';
  end if;
  foreach v_anh in array coalesce(p_anh, '{}'::text[]) loop
    if (v_anh not like p_chi_nhanh_id::text || '/huy/%' and v_anh not like p_chi_nhanh_id::text || '/thanh_toan/%')
       or v_anh like '%..%' then
      raise exception 'Đường dẫn ảnh không thuộc chi nhánh này' using errcode = 'check_violation';
    end if;
  end loop;

  insert into kho_phieu_xuat
    (chi_nhanh_id, so_phieu, ma_gui, loai, vi_tri_id, phieu_nhap_id, ghi_chu, anh, trang_thai, nguoi_tao)
  values
    (p_chi_nhanh_id, kho_sinh_so(p_chi_nhanh_id, 'XT'), p_ma_gui, 'tra_ncc', v_vt.id, v_pn.id,
     nullif(btrim(p_ghi_chu), ''), coalesce(p_anh, '{}'), 'cho_xac_nhan_tien', v_nv.id)
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
    v_lo := null;
    select l.* into v_lo from kho_lo l
    join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    where l.id = (v_dong ->> 'lo_id')::uuid and d.phieu_nhap_id = v_pn.id;
    if v_lo.id is null then
      raise exception 'Dòng %: lô không thuộc lần nhập % — mỗi lần trả chỉ chọn hàng của một lần nhập', v_i, v_pn.so_phieu
        using errcode = 'check_violation';
    end if;
    select * into v_mh from kho_mat_hang where id = v_lo.mat_hang_id;
    v_ton_kg := null; v_ton_goi := null;
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
    -- Như 0024: trả hết kg thì trả hết gói; trả hết gói thì trả hết kg.
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
  end loop;

  return query select v_id, v_so, false;
end;
$$;

comment on function kho_tra_hang_ghi_kg is
  'Trả hàng NCC bước 1 (0040): ghi KG hàng trả — hàng rời kho ngay (sổ tra_ncc), phiếu XT- chờ kế toán xác nhận số tiền (cho_xac_nhan_tien). Không tiền. Thủ kho (nhap) hoặc kế toán.';

create or replace function kho_ds_tra_hang_cho_tien(p_chi_nhanh_id uuid)
returns table (
  phieu_xuat_id uuid, so_phieu text, ngay date, phieu_nhap_id uuid, so_phieu_nhap text,
  nha_cung_cap_id uuid, ten_nha_cung_cap text, tong_kg numeric, tong_goi int, so_dong int,
  so_tien_goi_y bigint, nguoi_ghi text, ghi_chu text, so_anh int, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    raise exception 'Tài khoản của bạn không xem được trả hàng chờ xác nhận tiền' using errcode = 'insufficient_privilege';
  end if;
  return query
    select x.id, x.so_phieu, x.ngay, p.id, p.so_phieu, p.nha_cung_cap_id, n.ten,
           coalesce(d.kg, 0), coalesce(d.goi, 0)::int, coalesce(d.n, 0)::int,
           kho_tien_tra_hang_goi_y(x.id), ns.ho_ten, x.ghi_chu, coalesce(cardinality(x.anh), 0), x.created_at
    from kho_phieu_xuat x
    join kho_phieu_nhap p on p.id = x.phieu_nhap_id
    left join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
    left join nhan_su ns on ns.id = x.nguoi_tao
    left join lateral (
      select sum(dd.so_kg) as kg, sum(dd.so_goi) as goi, count(*) as n
      from kho_phieu_xuat_dong dd where dd.phieu_xuat_id = x.id
    ) d on true
    where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'tra_ncc' and x.trang_thai = 'cho_xac_nhan_tien'
    order by x.created_at, x.so_phieu;
end;
$$;

comment on function kho_ds_tra_hang_cho_tien is
  'Hàng chờ "Trả hàng chờ xác nhận tiền" của kế toán (0040): phiếu XT- thủ kho đã ghi kg, kèm số tiền giảm trừ tự tính (so_tien_goi_y).';

-- Bước 2 — p_so_tien null = tự tính; 0 = NCC không trừ tiền (không sinh giảm trừ).
create or replace function kho_xac_nhan_tien_tra_hang(p_phieu_xuat_id uuid, p_so_tien bigint, p_ghi_chu text)
returns table (so_phieu text, so_tien_giam_tru bigint, da_co boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_px   kho_phieu_xuat;
  v_pn   kho_phieu_nhap;
  v_tien bigint;
  v_tt   uuid;
  v_nv   nhan_su;
begin
  select * into v_px from kho_phieu_xuat where id = p_phieu_xuat_id;
  if not found or not kho_duoc(v_px.chi_nhanh_id, 'ke_toan') then
    raise exception 'Không tìm thấy phiếu trả hàng, hoặc tài khoản không được xác nhận tiền'
      using errcode = 'insufficient_privilege';
  end if;
  select * into v_px from kho_phieu_xuat where id = p_phieu_xuat_id for update;
  if v_px.loai <> 'tra_ncc' then
    raise exception 'Phiếu % không phải phiếu trả hàng nhà cung cấp', v_px.so_phieu using errcode = 'check_violation';
  end if;
  if v_px.trang_thai = 'da_ghi' then
    select t.so_tien into v_tien from kho_thanh_toan t where t.phieu_xuat_id = v_px.id and t.trang_thai = 'hieu_luc';
    return query select v_px.so_phieu, coalesce(v_tien, 0::bigint), true;
    return;
  end if;
  if v_px.trang_thai <> 'cho_xac_nhan_tien' then
    raise exception 'Phiếu % không chờ xác nhận tiền', v_px.so_phieu using errcode = 'check_violation';
  end if;
  if p_so_tien is not null and (p_so_tien < 0 or p_so_tien >= 10000000000000) then
    raise exception 'Số tiền giảm trừ không được âm' using errcode = 'check_violation';
  end if;
  select * into v_pn from kho_phieu_nhap where id = v_px.phieu_nhap_id;
  if v_pn.trang_thai <> 'da_duyet' then
    raise exception 'Phiếu nhập % không còn hiệu lực — không ghi được giảm trừ', v_pn.so_phieu using errcode = 'check_violation';
  end if;

  v_nv := nhan_su_hien_tai();
  v_tien := coalesce(p_so_tien, kho_tien_tra_hang_goi_y(v_px.id));
  if v_tien > 0 then
    insert into kho_thanh_toan
      (chi_nhanh_id, so_phieu, ma_gui, nha_cung_cap_id, loai, so_tien, ngay, ghi_chu, phieu_xuat_id, nguoi_tao)
    values
      (v_px.chi_nhanh_id, kho_sinh_so(v_px.chi_nhanh_id, 'GT'), gen_random_uuid(), v_pn.nha_cung_cap_id, 'giam_tru',
       v_tien, hom_nay_vn(),
       'Trả hàng ' || v_px.so_phieu || ' của phiếu ' || v_pn.so_phieu
         || coalesce(' — ' || nullif(btrim(p_ghi_chu), ''), ''),
       v_px.id, v_nv.id)
    returning id into v_tt;
    -- Như 0024: không chặn vượt số còn nợ — phiếu đã trả đủ mà vẫn trả hàng thì
    -- NCC nợ lại quán (còn nợ âm), rồi NCC hoàn tiền hoặc bù trừ.
    insert into kho_thanh_toan_phan_bo (thanh_toan_id, chi_nhanh_id, phieu_nhap_id, so_tien)
    values (v_tt, v_px.chi_nhanh_id, v_pn.id, v_tien);
  end if;

  update kho_phieu_xuat set trang_thai = 'da_ghi', nguoi_xac_nhan = v_nv.id, xac_nhan_luc = now()
  where id = v_px.id;

  return query select v_px.so_phieu, v_tien, false;
end;
$$;

comment on function kho_xac_nhan_tien_tra_hang is
  'Trả hàng NCC bước 2 (0040): kế toán xác nhận số tiền giảm trừ (trống = tự tính, 0 = không trừ). Sinh khoản giam_tru gắn phiếu XT-, phiếu thành da_ghi. Bấm lại trả về kết quả cũ.';

-- Hủy phiếu trả hàng CÒN CHỜ xác nhận tiền (thủ kho ghi nhầm kg, NCC không
-- nhận lại hàng): đảo từng dòng sổ tra_ncc của phiếu (dao_nguoc) → hàng về lại
-- đúng lô, đúng chỗ; phiếu thành da_huy. Chưa có đồng giảm trừ nào nên công nợ
-- không đổi. Người ghi phiếu (còn quyền nhap), kế toán hoặc quản lý (duyet).
-- Phiếu đã xác nhận tiền (da_ghi) thì không hủy ở đây.
create or replace function kho_huy_tra_hang_cho_tien(p_phieu_xuat_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_px kho_phieu_xuat;
  v_nv nhan_su;
  v_n  int;
begin
  select * into v_px from kho_phieu_xuat where id = p_phieu_xuat_id;
  if not found or v_px.loai <> 'tra_ncc'
     or not (kho_duoc(v_px.chi_nhanh_id, 'nhap') or kho_duoc(v_px.chi_nhanh_id, 'ke_toan')) then
    raise exception 'Không tìm thấy phiếu trả hàng, hoặc tài khoản không được hủy'
      using errcode = 'insufficient_privilege';
  end if;
  v_nv := nhan_su_hien_tai();
  if v_nv.id is distinct from v_px.nguoi_tao
     and not kho_duoc(v_px.chi_nhanh_id, 'ke_toan') and not kho_duoc(v_px.chi_nhanh_id, 'duyet') then
    raise exception 'Chỉ người ghi phiếu, kế toán hoặc quản lý hủy được phiếu trả hàng này'
      using errcode = 'insufficient_privilege';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Cần ghi lý do hủy (ví dụ: ghi nhầm số kg, nhà cung cấp không nhận lại)' using errcode = 'check_violation';
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = v_px.chi_nhanh_id for update;
  select * into v_px from kho_phieu_xuat where id = p_phieu_xuat_id for update;
  if v_px.trang_thai = 'da_huy' then
    return 'Phiếu ' || v_px.so_phieu || ' đã hủy trước đó.';
  end if;
  if v_px.trang_thai <> 'cho_xac_nhan_tien' then
    raise exception 'Phiếu % đã được kế toán xác nhận tiền — không hủy được nữa', v_px.so_phieu
      using errcode = 'check_violation';
  end if;

  insert into kho_so_cai
    (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
     chung_tu_loai, chung_tu_id, dao_cua, ghi_chu, nguoi_ghi)
  select s.chi_nhanh_id, s.lo_id, s.vi_tri_id, s.mat_hang_id, 'dao_nguoc',
         -s.so_kg, -s.so_goi, 'phieu_xuat', v_px.id, s.id, 'Hủy phiếu trả hàng chờ xác nhận', v_nv.id
  from kho_so_cai s
  where s.chung_tu_loai = 'phieu_xuat' and s.chung_tu_id = v_px.id and s.loai = 'tra_ncc'
  order by s.id;
  get diagnostics v_n = row_count;

  update kho_phieu_xuat set
    trang_thai = 'da_huy', ly_do_xu_ly = btrim(left(p_ly_do, 500)),
    nguoi_xu_ly = v_nv.id, xu_ly_luc = now()
  where id = v_px.id;

  return 'Đã hủy phiếu trả hàng ' || v_px.so_phieu || ' — ' || v_n || ' lô đã về lại chỗ cũ.';
end;
$$;

comment on function kho_huy_tra_hang_cho_tien is
  'Hủy phiếu trả hàng NCC còn chờ xác nhận tiền (0040): đảo sổ tra_ncc (hàng về lại lô, chỗ cũ), phiếu da_huy. Người ghi phiếu, kế toán hoặc quản lý. Bấm lại trả câu cũ.';


-- =============================================================================
-- 9 · CÔNG NỢ THEO KỲ — biên bản đối chiếu công nợ
-- =============================================================================
-- loai: dau_ky | mua | no_dau | thanh_toan | giam_tru | bu_tru | hoan_tien | cuoi_ky.
-- Dòng dau_ky: so_du = đầu kỳ. Dòng cuoi_ky: tang / giam = tổng phát sinh trong
-- kỳ, so_du = cuối kỳ. p_ncc null = mọi NCC của chi nhánh.
create or replace function kho_cong_no_theo_ky(p_chi_nhanh_id uuid, p_ncc uuid, p_tu date, p_den date)
returns table (
  thu_tu int, ngay date, loai text, ref_id uuid, so_chung_tu text, so_hoa_don text,
  nha_cung_cap_id uuid, ten_nha_cung_cap text, dien_giai text, tang bigint, giam bigint, so_du bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    raise exception 'Tài khoản của bạn không xem được công nợ' using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 3700 then
    raise exception 'Khoảng ngày tối đa 10 năm' using errcode = 'check_violation';
  end if;

  return query
  with pn as (
    select c.id, c.nha_cung_cap_id, c.ten_nha_cung_cap, c.so_phieu, c.so_hoa_don, c.ngay_nhap, c.loai,
           c.phai_tra::bigint as phai_tra
    from kho_v_cong_no_phieu c
    where c.chi_nhanh_id = p_chi_nhanh_id and (p_ncc is null or c.nha_cung_cap_id = p_ncc)
  ),
  ps as (
    select pn.ngay_nhap as d_ngay, pn.loai as d_loai, pn.id as d_ref, pn.so_phieu as d_so, pn.so_hoa_don as d_hd,
           pn.nha_cung_cap_id as d_ncc, pn.ten_nha_cung_cap as d_ten,
           case when pn.loai = 'no_dau' then 'Nợ đầu kỳ (lúc bắt đầu dùng phần mềm)' else 'Nhập hàng' end as d_dg,
           pn.phai_tra as d_tang, 0::bigint as d_giam, 0 as d_xep
    from pn
    union all
    select t.ngay, t.loai, t.id, t.so_phieu,
           string_agg(distinct pn.so_hoa_don, ', '),
           t.nha_cung_cap_id, min(pn.ten_nha_cung_cap),
           case t.loai
             when 'thanh_toan' then 'Trả tiền' || case t.hinh_thuc when 'chuyen_khoan' then ' (chuyển khoản)'
                                                                 when 'tien_mat' then ' (tiền mặt)' else '' end
             when 'giam_tru'   then 'Giảm trừ'
             when 'bu_tru'     then 'Bù trừ công nợ'
             else 'Nhà cung cấp hoàn tiền' || case t.hinh_thuc when 'chuyen_khoan' then ' (chuyển khoản)'
                                                              when 'tien_mat' then ' (tiền mặt)' else '' end
           end || coalesce(': ' || t.ghi_chu, '')
               || ' — phiếu ' || string_agg(pn.so_phieu, ', ' order by pn.so_phieu),
           case when t.loai = 'hoan_tien' then sum(pb.so_tien)::bigint else 0::bigint end,
           case when t.loai = 'hoan_tien' then 0::bigint else sum(pb.so_tien)::bigint end,
           1
    from kho_thanh_toan t
    join kho_thanh_toan_phan_bo pb on pb.thanh_toan_id = t.id
    join pn on pn.id = pb.phieu_nhap_id
    where t.trang_thai = 'hieu_luc'
    group by t.id, t.ngay, t.loai, t.so_phieu, t.nha_cung_cap_id, t.hinh_thuc, t.ghi_chu
  ),
  dau as (select coalesce(sum(ps.d_tang - ps.d_giam), 0)::bigint as v from ps where ps.d_ngay < p_tu),
  ky as (select ps.* from ps where ps.d_ngay between p_tu and p_den),
  tong as (select coalesce(sum(ky.d_tang), 0)::bigint as t, coalesce(sum(ky.d_giam), 0)::bigint as g from ky)
  select 0, p_tu, 'dau_ky'::text, null::uuid, null::text, null::text, p_ncc, null::text,
         'Số dư đầu kỳ'::text, null::bigint, null::bigint, (select dau.v from dau)
  union all
  select (row_number() over w)::int, ky.d_ngay, ky.d_loai, ky.d_ref, ky.d_so, ky.d_hd,
         ky.d_ncc, ky.d_ten, ky.d_dg, ky.d_tang, ky.d_giam,
         ((select dau.v from dau) + sum(ky.d_tang - ky.d_giam) over w)::bigint
  from ky
  window w as (order by ky.d_ngay, ky.d_xep, ky.d_so, ky.d_ref rows between unbounded preceding and current row)
  union all
  select 2147483647, p_den, 'cuoi_ky'::text, null::uuid, null::text, null::text, p_ncc, null::text,
         'Số dư cuối kỳ'::text, tong.t, tong.g, (select dau.v from dau) + tong.t - tong.g
  from tong
    order by 1;
end;
$$;

comment on function kho_cong_no_theo_ky is
  'Sổ công nợ NCC theo kỳ (0040): dòng đầu kỳ, từng chứng từ (tăng: nhập mua, nợ đầu kỳ, NCC hoàn tiền; giảm: trả tiền, giảm trừ, bù trừ) với số dư chạy, dòng cuối kỳ. Cuối kỳ tới hôm nay = tổng còn nợ của kho_v_cong_no_phieu. Dùng cho biên bản đối chiếu công nợ.';


-- =============================================================================
-- 10 · MISA: DỮ LIỆU XUẤT, MÃ TÀI KHOẢN, MÃ MISA MẶT HÀNG
-- =============================================================================
-- Một kiểu dòng cho cả hai loại (cột không dùng thì null):
--   mua_hang   mỗi dòng hàng của phiếu nhập MUA đã duyệt có ngày nhập trong kỳ
--              (+ một dòng "Chi phí mua hàng khác" nếu phiếu có). Nợ đầu kỳ
--              không phải mua hàng — không xuất.
--              TK nợ = tk_no_hang, TK có = tk_co_ncc, TK thuế = tk_thue.
--   thanh_toan mỗi khoản còn hiệu lực có ngày trong kỳ:
--              trả tiền      nợ tk_co_ncc / có tk_tien_mat | tk_ngan_hang
--              NCC hoàn tiền nợ tk_tien_mat | tk_ngan_hang / có tk_co_ncc
--              giảm trừ      nợ tk_co_ncc / có tk_no_hang
--              bù trừ        nợ tk_co_ncc / có tk_bu_tru
--              Hình thức "khác": TK tiền để trống, kế toán điền tay.
-- Thuế suất (%) = tiền thuế phiếu / tiền hàng phiếu; tiền thuế chia cho từng
-- dòng theo thành tiền, số dư lớn nhất (tổng khớp từng đồng).
create or replace function kho_du_lieu_misa(p_chi_nhanh_id uuid, p_tu date, p_den date, p_loai text)
returns table (
  thu_tu int, loai_chung_tu text, ngay_chung_tu date, so_chung_tu text, so_hoa_don text, ngay_hoa_don date,
  ma_ncc text, ten_ncc text, ma_so_thue text, ma_hang text, ten_hang text, dvt text,
  so_luong numeric, don_gia bigint, thanh_tien bigint, thue_suat numeric, tien_thue bigint,
  tk_no text, tk_co text, tk_thue text, hinh_thuc text, dien_giai text, thieu_ma boolean, ref_id uuid
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_tk     jsonb;
  v_n      int := 0;
  v_p      record;
  v_d      record;
  v_t      record;
  v_thue   bigint[];
  v_ts     numeric[];
  v_i      int;
  v_ts_pt  numeric;
  v_ma_ncc text;
  v_thieu_ncc boolean;
  v_dg     text;
  v_tk_tien text;
begin
  if not kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    raise exception 'Tài khoản của bạn không xuất được dữ liệu kế toán' using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 400 then
    raise exception 'Mỗi lần xuất tối đa khoảng 13 tháng' using errcode = 'check_violation';
  end if;
  if p_loai is null or p_loai not in ('mua_hang', 'thanh_toan') then
    raise exception 'Chọn loại dữ liệu: mua hàng hoặc thanh toán' using errcode = 'check_violation';
  end if;
  select c.misa_tk into v_tk from kho_cai_dat c where c.chi_nhanh_id = p_chi_nhanh_id;
  v_tk := '{"tk_no_hang":"1561","tk_thue":"1331","tk_co_ncc":"331","tk_tien_mat":"1111","tk_ngan_hang":"1121","tk_bu_tru":"131"}'::jsonb
          || coalesce(v_tk, '{}'::jsonb);

  if p_loai = 'mua_hang' then
    for v_p in
      select p.*, n.ten as ten_ncc, n.ma_misa as ncc_ma_misa, n.ma_so_thue as ncc_mst,
             (select coalesce(sum(dd.thanh_tien), 0) from kho_phieu_nhap_dong dd where dd.phieu_nhap_id = p.id) as tien_hang
      from kho_phieu_nhap p
      join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
      where p.chi_nhanh_id = p_chi_nhanh_id and p.loai = 'mua' and p.trang_thai = 'da_duyet'
        and p.ngay_nhap between p_tu and p_den
      order by p.ngay_nhap, p.so_phieu
    loop
      v_ma_ncc := coalesce(v_p.ncc_ma_misa, v_p.ncc_mst, 'NCC-' || upper(left(v_p.nha_cung_cap_id::text, 8)));
      v_thieu_ncc := v_p.ncc_ma_misa is null;
      v_ts_pt := case when v_p.tien_hang > 0 and v_p.tien_thue > 0
                      then round(v_p.tien_thue::numeric * 100 / v_p.tien_hang, 2) else 0 end;
      v_dg := 'Nhập hàng ' || v_p.so_phieu
              || case when v_p.da_doi_chieu and v_p.tien_hoa_don is distinct from v_p.tien_hang + v_p.tien_thue + v_p.chi_phi_khac
                      then '; hóa đơn ghi ' || replace(to_char(v_p.tien_hoa_don, 'FM999G999G999G999'), ',', '.')
                           || ' đ, lệch ' || replace(to_char(v_p.tien_hoa_don - (v_p.tien_hang + v_p.tien_thue + v_p.chi_phi_khac),
                                                            'FMS999G999G999G999'), ',', '.') || ' đ so với phiếu'
                      else '' end;
      select array_agg(dd.thanh_tien::numeric order by dd.thu_tu, dd.id) into v_ts
      from kho_phieu_nhap_dong dd where dd.phieu_nhap_id = v_p.id;
      v_thue := kho_chia_so_du_lon_nhat(v_p.tien_thue, coalesce(v_ts, '{}'::numeric[]));
      v_i := 0;
      for v_d in
        select dd.*, m.ma as mh_ma, m.ten as mh_ten, m.ma_misa as mh_ma_misa
        from kho_phieu_nhap_dong dd join kho_mat_hang m on m.id = dd.mat_hang_id
        where dd.phieu_nhap_id = v_p.id order by dd.thu_tu, dd.id
      loop
        v_i := v_i + 1;
        v_n := v_n + 1;
        return query select v_n, 'mua_hang'::text, v_p.ngay_nhap, v_p.so_phieu, v_p.so_hoa_don, v_p.ngay_hoa_don,
          v_ma_ncc, v_p.ten_ncc, v_p.ncc_mst, coalesce(v_d.mh_ma_misa, v_d.mh_ma), v_d.mh_ten, 'kg'::text,
          v_d.so_kg, v_d.don_gia_kg, v_d.thanh_tien, v_ts_pt, v_thue[v_i],
          v_tk ->> 'tk_no_hang', v_tk ->> 'tk_co_ncc', v_tk ->> 'tk_thue', null::text, v_dg,
          v_thieu_ncc or v_d.mh_ma_misa is null, v_p.id;
      end loop;
      if v_p.chi_phi_khac > 0 then
        v_n := v_n + 1;
        return query select v_n, 'mua_hang'::text, v_p.ngay_nhap, v_p.so_phieu, v_p.so_hoa_don, v_p.ngay_hoa_don,
          v_ma_ncc, v_p.ten_ncc, v_p.ncc_mst, null::text, 'Chi phí mua hàng khác'::text, null::text,
          null::numeric, null::bigint, v_p.chi_phi_khac, 0::numeric, 0::bigint,
          v_tk ->> 'tk_no_hang', v_tk ->> 'tk_co_ncc', v_tk ->> 'tk_thue', null::text, v_dg,
          v_thieu_ncc, v_p.id;
      end if;
    end loop;
    return;
  end if;

  for v_t in
    select t.*, n.ten as ten_ncc, n.ma_misa as ncc_ma_misa, n.ma_so_thue as ncc_mst,
           (select string_agg(distinct p.so_hoa_don, ', ') from kho_thanh_toan_phan_bo pb
              join kho_phieu_nhap p on p.id = pb.phieu_nhap_id where pb.thanh_toan_id = t.id) as ds_hoa_don,
           (select string_agg(p.so_phieu, ', ' order by p.so_phieu) from kho_thanh_toan_phan_bo pb
              join kho_phieu_nhap p on p.id = pb.phieu_nhap_id where pb.thanh_toan_id = t.id) as ds_phieu
    from kho_thanh_toan t
    join kho_nha_cung_cap n on n.id = t.nha_cung_cap_id
    where t.chi_nhanh_id = p_chi_nhanh_id and t.trang_thai = 'hieu_luc' and t.ngay between p_tu and p_den
    order by t.ngay, t.so_phieu
  loop
    v_n := v_n + 1;
    v_tk_tien := case v_t.hinh_thuc when 'tien_mat' then v_tk ->> 'tk_tien_mat'
                                    when 'chuyen_khoan' then v_tk ->> 'tk_ngan_hang' end;
    return query select v_n, v_t.loai, v_t.ngay, v_t.so_phieu, v_t.ds_hoa_don, null::date,
      coalesce(v_t.ncc_ma_misa, v_t.ncc_mst, 'NCC-' || upper(left(v_t.nha_cung_cap_id::text, 8))),
      v_t.ten_ncc, v_t.ncc_mst, null::text, null::text, null::text,
      null::numeric, null::bigint, v_t.so_tien, null::numeric, null::bigint,
      case v_t.loai when 'hoan_tien' then v_tk_tien else v_tk ->> 'tk_co_ncc' end,
      case v_t.loai when 'thanh_toan' then v_tk_tien
                    when 'hoan_tien'  then v_tk ->> 'tk_co_ncc'
                    when 'giam_tru'   then v_tk ->> 'tk_no_hang'
                    else v_tk ->> 'tk_bu_tru' end,
      null::text, v_t.hinh_thuc,
      case v_t.loai when 'thanh_toan' then 'Trả tiền nhà cung cấp'
                    when 'hoan_tien'  then 'Nhà cung cấp hoàn tiền'
                    when 'giam_tru'   then 'Giảm trừ công nợ'
                    else 'Bù trừ công nợ' end
        || coalesce(': ' || v_t.ghi_chu, '') || coalesce(' — phiếu ' || v_t.ds_phieu, ''),
      v_t.ncc_ma_misa is null, v_t.id;
  end loop;
end;
$$;

comment on function kho_du_lieu_misa is
  'Dữ liệu phẳng để xuất sang MISA (0040): mua_hang = từng dòng hàng phiếu nhập mua đã duyệt (+ chi phí khác), thanh_toan = từng khoản trả tiền / hoàn tiền / giảm trừ / bù trừ. TK từ kho_cai_dat.misa_tk. Thiếu mã MISA vẫn xuất, thieu_ma = true. Định dạng file dựng ở web (lib/kho/misa.ts, COT_MISA).';

create or replace function kho_luu_misa_tk(p_chi_nhanh_id uuid, p_misa_tk jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_khoa text;
  v_moi  jsonb;
  c_khoa constant text[] := array['tk_no_hang', 'tk_thue', 'tk_co_ncc', 'tk_tien_mat', 'tk_ngan_hang', 'tk_bu_tru'];
begin
  if not kho_duoc(p_chi_nhanh_id, 'ke_toan') then
    raise exception 'Tài khoản của bạn không được sửa mã tài khoản kế toán' using errcode = 'insufficient_privilege';
  end if;
  if p_misa_tk is null or jsonb_typeof(p_misa_tk) <> 'object' then
    raise exception 'Mã tài khoản phải là một đối tượng {tên: mã}' using errcode = 'check_violation';
  end if;
  for v_khoa in select jsonb_object_keys(p_misa_tk) loop
    if v_khoa <> all (c_khoa) then
      raise exception 'Mã tài khoản: trường "%" không được nhận', v_khoa using errcode = 'check_violation';
    end if;
    if jsonb_typeof(p_misa_tk -> v_khoa) <> 'string' or (p_misa_tk ->> v_khoa) !~ '^[0-9]{3,10}$' then
      raise exception 'Mã tài khoản phải là 3 đến 10 chữ số (ví dụ 331, 1561)' using errcode = 'check_violation';
    end if;
  end loop;
  update kho_cai_dat set misa_tk = misa_tk || p_misa_tk
  where chi_nhanh_id = p_chi_nhanh_id
  returning misa_tk into v_moi;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;
  return v_moi;
end;
$$;

comment on function kho_luu_misa_tk is
  'Sửa mã tài khoản mặc định khi xuất MISA (0040, ke_toan). Chỉ nhận các khóa của misa_tk, mỗi mã 3–10 chữ số; khóa không gửi giữ nguyên.';

create or replace function kho_luu_ma_misa_mat_hang(p_mat_hang_id uuid, p_ma_misa text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma text := nullif(btrim(p_ma_misa), '');
begin
  if not kho_co_quyen('ke_toan') then
    raise exception 'Tài khoản của bạn không được sửa mã MISA' using errcode = 'insufficient_privilege';
  end if;
  if v_ma is not null and v_ma !~ '^[A-Za-z0-9_./-]{1,40}$' then
    raise exception 'Mã MISA chỉ gồm chữ không dấu, số và các dấu _ . / - (tối đa 40 ký tự)' using errcode = 'check_violation';
  end if;
  if v_ma is not null and exists (select 1 from kho_mat_hang where upper(ma_misa) = upper(v_ma) and id <> p_mat_hang_id) then
    raise exception 'Mã MISA % đã dùng cho mặt hàng khác', v_ma using errcode = 'check_violation';
  end if;
  update kho_mat_hang set ma_misa = v_ma where id = p_mat_hang_id;
  if not found then
    raise exception 'Không tìm thấy mặt hàng' using errcode = 'check_violation';
  end if;
end;
$$;

comment on function kho_luu_ma_misa_mat_hang is
  'Kế toán sửa mã MISA của một mặt hàng (0040) — chỉ cột ma_misa (bảng mặt hàng chỉ vai danh_muc sửa được). Trống = xóa mã.';


-- =============================================================================
-- 11 · SỰ KIỆN VÀ SỐ ĐỎ — thay THÂN (cùng chữ ký), chép 0039, thêm 0040
-- =============================================================================
--   tra_hang_cho_tien  nhac_nho  ke_toan — xem đầu file.
--   ncc_doi_tai_khoan  nhac_nho  chủ (cai_dat_goc) — xem đầu file.
-- Số đỏ mới: tra_hang_cho_tien (ke_toan).
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
  'NỘI BỘ. 0037: thêm ipos_cho_xu_ly, ipos_mat_ket_noi. 0038: thêm dinh_muc_lech. 0039: thêm don_dat_tre. 0040: thêm tra_hang_cho_tien, ncc_doi_tai_khoan. Mọi sự kiện thông báo người đang đăng nhập được thấy ở một chi nhánh, suy ra từ chứng từ. Gọi qua kho_dem_viec / kho_thong_bao.';

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
    -- 0040: trả hàng chờ kế toán xác nhận số tiền giảm trừ.
    v := v || jsonb_build_object('tra_hang_cho_tien', (
      select count(*) from kho_phieu_xuat x
      where x.chi_nhanh_id = p_chi_nhanh_id and x.loai = 'tra_ncc' and x.trang_thai = 'cho_xac_nhan_tien'));
  end if;

  v := v || jsonb_build_object('chua_doc', v_chua_doc, 'thong_bao_xem_luc', v_xem_luc);

  return v;
end;
$$;


comment on function kho_dem_viec is
  'Mọi số đỏ trên menu kho của người đang đăng nhập ở một chi nhánh, trong MỘT lần gọi. Khóa nào không có quyền thì vắng mặt. Chỉ đếm, không tiền. duyet_nhap theo quyền duyet_nhap (0031); yeu_cau_quay, hang_dang_chuyen, hang_chuyen_qua_gio, chuyen_nhan_thieu (0032); thu_hoi_thap (0033); ipos_cho_xu_ly (0037); dinh_muc_lech (0038); don_dat_tre (0039); tra_hang_cho_tien (0040).';


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (xem 0020)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_chia_thanh_toan(uuid, uuid, text, bigint) from authenticated';
    execute 'revoke execute on function kho_tien_tra_hang_goi_y(uuid) from authenticated';
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
