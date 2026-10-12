-- =============================================================================
-- BEEFTOWN CRM — 0069 · HÀM CRM GIỚI HẠN ĐÚNG CHI NHÁNH · XẾP TIN MỘT LẦN ·
--                       ĐẶT BÀN CHỈ ĐỔI THEO ĐÚNG BƯỚC
-- =============================================================================
-- Rà soát nợ kỹ thuật 11/10/2026, phần quyền còn lại sau 0065. Bốn hàm definer
-- kiểm VAI nhưng không kiểm CHI NHÁNH, và policy dat_ban_sua (0007) cho sửa
-- mọi cột:
--
--   · tim_hoac_tao_khach() — thu ngân / quản lý Q1 biết số điện thoại là nhận
--     NGUYÊN dòng khach_hang của khách chỉ ăn ở Q7 (ghi chú, ngày sinh), điền
--     được tên cho khách Q7 chưa có tên (tin Zalo của Q7 gọi khách bằng tên
--     đó); tra không thấy thì tạo dòng mới cho chi nhánh bất kỳ, hoặc không
--     gắn chi nhánh nào — dòng mồ côi không nhân viên nào thấy.
--   · phieu_do_launch() — nhận mã chi nhánh bất kỳ hoặc null: số liệu MỌI chi
--     nhánh cho marketing một chi nhánh. Mã gõ sai (không tìm thấy) cũng thành
--     "mọi chi nhánh".
--   · tao_tin_tuyen_dung_mau() — nhận p_chi_nhanh_id bất kỳ: quản lý Q1 tạo tin
--     nháp vào Q7.
--   · xep_hang_gui_tin() — không đặt khoa_gui: bấm đúp là HAI tin ZBS có tính
--     phí. Không kiểm khách thuộc chi nhánh: tin (và chi phí ZBS) của khách
--     chỉ ăn ở Q7 ghi vào sổ Q1. Chiến dịch truyền vào cũng không kiểm.
--   · dat_ban_sua (0007) — `using (duoc_truy_cap_chi_nhanh(chi_nhanh_id))`, mọi
--     cột, mọi bước: đã hủy → đã xác nhận (nảy tin Zalo ZBS-01/02 cho khách đã
--     hủy), đã tới → chờ gọi, đổi khách của đặt bàn, đổi mã, sửa "khách đồng ý
--     nhận tin" (bằng chứng Nghị định 13), ghi tên người khác vào nguoi_xu_ly.
--     Chú thích ở /noi-bo/dat-ban nói "nếu lọt thì RLS vẫn chặn" — RLS không
--     nhìn bước chuyển.
--
-- CÁCH SỬA
--
--   1 · tim_hoac_tao_khach — khách ĐÃ CÓ: người gọi không thấy khách đó (đúng
--       điều kiện policy khach_hang_doc: chủ sở hữu, hoặc khách đã ghé / đặt bàn
--       ở chi nhánh người gọi) thì chỉ nhận id, sdt, dang_hoat_dong — đủ cho
--       ghi_luot_ghe() ghi lượt ghé đầu tiên của khách ở chi nhánh mới; không
--       bổ sung tên. Khách MỚI: ngoài chủ sở hữu, p_chi_nhanh phải là chi nhánh
--       của người gọi. Hai đường gọi lồng (ghi_luot_ghe, tao_dat_ban) chỉ đọc
--       v_khach.id; tao_dat_ban của website chạy dưới anon (không phiên) nên
--       không đổi gì.
--   2 · phieu_do_launch — ngoài chủ sở hữu: để trống = chi nhánh của mình, mã
--       chi nhánh khác = từ chối. Mã không tìm thấy = báo lỗi cho mọi người.
--   3 · tao_tin_tuyen_dung_mau — có phiên thì p_chi_nhanh_id phải là chi nhánh
--       người gọi được vào (chủ sở hữu: mọi chi nhánh) — y như vi_tri_them.
--   4 · xep_hang_gui_tin — khoa_gui:
--         có chiến dịch  CD:<chiến dịch>:<khách> (CÙNG khoá với
--                        zalo_tao_chien_dich — không thêm được tin thứ hai cho
--                        khách chiến dịch đã xếp)
--         gửi tay        TAY:<chi nhánh>:<mã mẫu>:<khách>:<ngày giờ VN>
--       Khoá đã có, tin đang chờ / đã gửi thì trả lại ĐÚNG tin đó (như
--       zalo_tao_chien_dich trả lại chiến dịch đã tạo), kiểm trước duoc_phep_gui:
--       bấm lại không bị báo nhầm "đã đủ 2 tin/tháng" bởi chính tin vừa xếp. Tin
--       đã hỏng / bị từ chối / bị hủy thì bấm lại là gửi MỚI (tin cũ đổi khoá,
--       ở nguyên trong nhật ký). Có chiến dịch thì mẫu phải là mẫu của chiến dịch. Hai lời gọi cùng lúc: unique
--       khoa_gui + on conflict do nothing — lời sau đọc lại tin của lời trước.
--       Có phiên thì khách phải đã ghé hoặc đặt bàn ở p_chi_nhanh_id (như
--       zalo_khach_theo_nhom của chiến dịch); chiến dịch phải của chi nhánh đó.
--   5 · Trigger dat_ban_kiem_sua (BEFORE INSERT OR UPDATE), chỉ khi có phiên
--       đăng nhập (tao_dat_ban / huy_dat_ban của website chạy dưới anon; SQL
--       Editor sửa tay như cũ). Chèn thẳng (dat_ban_them — nhân viên ghi hộ):
--       chỉ ở chờ gọi / đã xác nhận, bàn / lượt ghé / người xử lý như dưới,
--       nguoi_tao (cột mới) = người ghi. Sửa:
--         · bước chuyển trạng thái đúng 5 bước của hộp thư /noi-bo/dat-ban
--           (CHUYEN_DUOC — test-quyen-chi-nhanh-crm.mjs đọc thẳng từ trang và
--           thử cả 20 cặp): chờ gọi → đã xác nhận | đã hủy; đã xác nhận → đã tới
--           | không tới | đã hủy;
--         · không đổi khách, chi nhánh, mã đặt bàn, đồng ý nhận tin, nguồn
--           (utm_*, trang_gioi_thieu), giờ tạo;
--         · đặt bàn đã kết thúc (đã tới / không tới / đã hủy): không đổi ngày,
--           giờ, số khách, bàn — ghi chú, dịp vẫn sửa được;
--         · bàn phải của chi nhánh đặt bàn; lượt ghé nối vào phải của đúng
--           khách, đúng chi nhánh;
--         · nguoi_xu_ly chỉ được là chính người đang đăng nhập; đổi trạng thái
--           thì tự ghi người đang đăng nhập vào đó;
--         · bàn, lượt ghé, người xử lý, người tạo về null luôn được — ON DELETE
--           SET NULL khi xoá bàn / nhân sự chạy như một câu UPDATE dưới phiên
--           của người xoá.
--       Đổi ngày / giờ / số khách khi chưa kết thúc vẫn được: khách gọi đổi giờ
--       là việc thường (test-zalo*.mjs dựa vào). dat_ban_them GIỮ nguyên.
--
-- CHỮ KÝ GIỮ NGUYÊN (README, lưu ý 6) — create or replace, không sinh overload.
-- Thân hàm chép NGUYÊN VĂN bản mới nhất (tim_hoac_tao_khach, xep_hang_gui_tin:
-- 0045; phieu_do_launch: 0013; tao_tin_tuyen_dung_mau: 0026), phần thêm đánh
-- dấu "0069".
--
-- Kiểm thử: crm/test/test-quyen-chi-nhanh-crm.mjs.
-- =============================================================================


-- =============================================================================
-- 1 · tim_hoac_tao_khach — khách chi nhánh khác không lộ; khách mới đúng chi nhánh
-- =============================================================================
create or replace function tim_hoac_tao_khach(
  p_sdt        text,
  p_ho_ten     text default null,
  p_chi_nhanh  uuid default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns khach_hang
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sdt   text := chuan_hoa_sdt(p_sdt);
  v_khach khach_hang;
  v_an    khach_hang;   -- 0069: mọi cột null, chỉ điền id / sdt / dang_hoat_dong
begin
  -- ---- 0045 · Ai được tra cứu / tạo hồ sơ khách ---------------------------
  if co_phien_dang_nhap()
     and not co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan']::vai_tro[]) then
    raise exception 'Chỉ chủ sở hữu, quản lý hoặc thu ngân mới tra cứu hay tạo được hồ sơ khách'
      using errcode = 'insufficient_privilege';
  end if;
  -- ---- Hết phần 0045 — từ đây là nguyên văn 0002 --------------------------

  if v_sdt is null or not sdt_hop_le(v_sdt) then
    raise exception 'Số điện thoại không hợp lệ: %', coalesce(p_sdt, '(rỗng)')
      using errcode = 'check_violation';
  end if;

  select * into v_khach from khach_hang where sdt = v_sdt;

  if found then
    -- ---- 0069 · Khách của chi nhánh khác: chỉ id, không dữ liệu riêng tư --
    -- Đúng điều kiện policy khach_hang_doc (0007): chủ sở hữu, hoặc khách đã ghé
    -- / đặt bàn ở chi nhánh người gọi. Không phiên (website, máy POS) như cũ.
    if co_phien_dang_nhap()
       and not la_chu_so_huu()
       and not exists (select 1 from luot_ghe lg
                       where lg.khach_hang_id = v_khach.id and duoc_truy_cap_chi_nhanh(lg.chi_nhanh_id))
       and not exists (select 1 from dat_ban d
                       where d.khach_hang_id = v_khach.id and duoc_truy_cap_chi_nhanh(d.chi_nhanh_id)) then
      v_an.id := v_khach.id;
      v_an.sdt := v_khach.sdt;
      v_an.dang_hoat_dong := v_khach.dang_hoat_dong;
      return v_an;
    end if;
    -- ---- Hết phần 0069 -----------------------------------------------------

    -- Khách cũ: chỉ bổ sung thông tin còn thiếu, KHÔNG ghi đè dữ liệu đã có
    update khach_hang
    set ho_ten = coalesce(khach_hang.ho_ten, p_ho_ten)
    where id = v_khach.id
    returning * into v_khach;
    return v_khach;
  end if;

  -- ---- 0069 · Khách mới: chỉ cho chi nhánh của người gọi ------------------
  if co_phien_dang_nhap()
     and not la_chu_so_huu()
     and (p_chi_nhanh is null or not duoc_truy_cap_chi_nhanh(p_chi_nhanh)) then
    raise exception 'Chỉ tạo được hồ sơ khách mới cho chi nhánh của bạn'
      using errcode = 'insufficient_privilege';
  end if;
  -- ---- Hết phần 0069 -------------------------------------------------------

  insert into khach_hang (sdt, ho_ten, chi_nhanh_dau_tien,
                          nguon_utm_source, nguon_utm_medium, nguon_utm_campaign)
  values (v_sdt, p_ho_ten, p_chi_nhanh, p_utm_source, p_utm_medium, p_utm_campaign)
  returning * into v_khach;

  return v_khach;
end;
$$;

comment on function tim_hoac_tao_khach is
  'Điểm vào duy nhất để tạo khách. Chống trùng hồ sơ do SĐT khác định dạng. Có phiên đăng nhập thì chỉ chủ sở hữu, quản lý, thu ngân (0045); khách chưa từng ghé / đặt bàn ở chi nhánh người gọi chỉ trả id, sdt, dang_hoat_dong và không bổ sung tên; khách mới chỉ tạo cho chi nhánh người gọi (0069). Website đi qua tao_dat_ban() dưới anon.';


-- =============================================================================
-- 2 · phieu_do_launch — chỉ chi nhánh của người xem (chủ sở hữu: mọi chi nhánh)
-- =============================================================================
create or replace function phieu_do_launch(
  p_tu  date default (hom_nay_vn() - 30),
  p_den date default hom_nay_vn(),
  p_chi_nhanh_ma text default null
)
returns table (
  chi_so    text,
  gia_tri   numeric,
  don_vi    text,
  dien_giai text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cn uuid;
begin
  if not co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]) then
    raise exception 'Không có quyền xem phiếu đo'
      using errcode = 'insufficient_privilege';
  end if;

  if p_chi_nhanh_ma is not null then
    select id into v_cn from chi_nhanh where lower(ma) = lower(p_chi_nhanh_ma);
    -- ---- 0069 · Mã gõ sai không thành "mọi chi nhánh" ----------------------
    if not found then
      raise exception 'Không tìm thấy chi nhánh %', p_chi_nhanh_ma
        using errcode = 'foreign_key_violation';
    end if;
  end if;

  -- ---- 0069 · Quản lý, marketing: chỉ chi nhánh của mình -------------------
  if not la_chu_so_huu() then
    if v_cn is null then
      v_cn := (nhan_su_hien_tai()).chi_nhanh_id;
    elsif not duoc_truy_cap_chi_nhanh(v_cn) then
      raise exception 'Chỉ xem được phiếu đo của chi nhánh của bạn'
        using errcode = 'insufficient_privilege';
    end if;
  end if;
  -- ---- Hết phần 0069 — từ đây là nguyên văn 0013 ---------------------------

  return query
  with sk as (
    select loai, count(*) as n
    from su_kien_web
    where ngay between p_tu and p_den
      and (v_cn is null or chi_nhanh_id = v_cn)
    group by loai
  ),
  db as (
    select
      count(*) as yeu_cau,
      count(*) filter (where trang_thai in ('da_xac_nhan','da_den')) as xac_nhan,
      count(*) filter (where trang_thai = 'da_den') as den
    from dat_ban
    where ngay between p_tu and p_den
      and (v_cn is null or chi_nhanh_id = v_cn)
  )
  select 'luot_xem_trang'::text,
         coalesce((select n from sk where loai = 'xem_trang'), 0)::numeric,
         'lượt'::text,
         'Lượt mở trang. Không phải số người.'::text
  union all
  select 'mo_thuc_don',
         coalesce((select n from sk where loai = 'mo_thuc_don'), 0)::numeric,
         'lượt', 'Khách bấm xem thực đơn.'
  union all
  select 'bam_chi_duong',
         coalesce((select n from sk where loai = 'bam_chi_duong'), 0)::numeric,
         'lượt', 'Bấm mở chỉ đường. Ý định đi tới, chưa phải đã tới.'
  union all
  select 'bam_goi_dien',
         coalesce((select n from sk where loai = 'bam_goi_dien'), 0)::numeric,
         'lượt', 'Bấm số điện thoại. Không biết cuộc gọi có kết nối không.'
  union all
  select 'bam_mang_xa_hoi',
         coalesce((select sum(n) from sk
                   where loai in ('bam_facebook','bam_instagram','bam_tiktok','bam_zalo')), 0)::numeric,
         'lượt', 'Bấm sang Facebook, Instagram, TikTok hoặc Zalo.'
  union all
  select 'gui_ho_so',
         coalesce((select n from sk where loai = 'gui_ho_so'), 0)::numeric,
         'lượt', 'Hồ sơ ứng tuyển đã gửi.'
  union all
  -- Ba con số dưới đây là BA VIỆC KHÁC NHAU. Đừng cộng, đừng thay thế nhau.
  select 'yeu_cau_dat_ban', (select yeu_cau from db)::numeric, 'yêu cầu',
         'Hệ thống đã NHẬN yêu cầu. KHÔNG có nghĩa là đã có bàn.'
  union all
  select 'da_xac_nhan', (select xac_nhan from db)::numeric, 'yêu cầu',
         'Nhân viên đã gọi và XÁC NHẬN. Đây mới là bàn đã giữ.'
  union all
  select 'khach_da_den', (select den from db)::numeric, 'nhóm',
         'Nhóm THỰC ĐẾN. Đây là con số duy nhất nói về người ngồi vào bàn.';
end;
$$;

comment on function phieu_do_launch is
  'Phiếu đo ra mắt: lượt xem, bấm, hồ sơ, và ba con số đặt bàn KHÁC NHAU (nhận / xác nhận / thực đến). Chủ sở hữu, quản lý, marketing. Ngoài chủ sở hữu: để trống chi nhánh = chi nhánh của mình, mã chi nhánh khác bị từ chối; mã không tìm thấy báo lỗi (0069).';


-- =============================================================================
-- 3 · tao_tin_tuyen_dung_mau — quản lý chỉ cho chi nhánh mình
-- =============================================================================
create or replace function tao_tin_tuyen_dung_mau(p_chi_nhanh_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_so int;
begin
  if co_phien_dang_nhap() and not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
    raise exception 'Chỉ chủ sở hữu hoặc quản lý mới khởi tạo được tin tuyển dụng mẫu'
      using errcode = 'insufficient_privilege';
  end if;

  -- ---- 0069 · Đúng chi nhánh, như policy vi_tri_them -----------------------
  if co_phien_dang_nhap() and not duoc_truy_cap_chi_nhanh(p_chi_nhanh_id) then
    raise exception 'Chỉ khởi tạo được tin mẫu cho chi nhánh của bạn'
      using errcode = 'insufficient_privilege';
  end if;
  -- ---- Hết phần 0069 — từ đây là nguyên văn 0026 ---------------------------

  if not exists (select 1 from chi_nhanh where id = p_chi_nhanh_id) then
    raise exception 'Không tìm thấy chi nhánh %', p_chi_nhanh_id
      using errcode = 'foreign_key_violation';
  end if;

  with da_them as (
    insert into vi_tri_tuyen_dung
      (chi_nhanh_id, ma, ten_vi, ten_en, bo_phan, cap_bac, loai_hop_dong, so_luong, hoi_cv)
    select p_chi_nhanh_id, v.ma, v.ten_vi, v.ten_en, v.bo_phan::bo_phan_tuyen,
           v.cap_bac, v.loai::loai_hop_dong, v.so_luong, v.hoi_cv
    from (values
      ('nhan-vien-sanh',    'Nhân viên sảnh',             'Hall Employee',
       'sanh', 'Hall Crew → Master Beef Specialist (7 bậc)', 'ban_thoi_gian', 8::smallint, false),
      ('to-truong-sanh',    'Tổ trưởng sảnh',             'Floor Leader',
       'sanh', 'Bậc trên nhân viên sảnh', 'toan_thoi_gian', 2::smallint, true),
      ('quan-ly-sanh',      'Quản lý sảnh',               'Floor Manager',
       'quan_ly', 'Hướng lên Quản lý cửa hàng', 'toan_thoi_gian', 1::smallint, true),
      ('quan-ly-cua-hang',  'Quản lý cửa hàng',           'Store Manager',
       'quan_ly', null, 'toan_thoi_gian', 1::smallint, true),
      ('nhan-vien-bep',     'Nhân viên bếp',              'Kitchen Staff',
       'bep', '3 bậc', 'toan_thoi_gian', 4::smallint, false),
      ('nhan-vien-thit',    'Nhân viên bộ phận thịt',     'Meat Department Staff',
       'quay_thit', '3 bậc', 'toan_thoi_gian', 2::smallint, false),
      ('tu-van-quay-thit',  'Nhân viên tư vấn quầy thịt', 'Meat Showcase Sales Assistant',
       'quay_thit', 'Kiêm thao tác POS tại quầy', 'ban_thoi_gian', 2::smallint, false),
      ('dau-moi-marketing', 'Đầu mối marketing',          'Marketing Coordinator',
       'marketing', null, 'ban_thoi_gian', 1::smallint, true)
    ) as v(ma, ten_vi, ten_en, bo_phan, cap_bac, loai, so_luong, hoi_cv)
    where not exists (select 1 from vi_tri_tuyen_dung t where t.ma = v.ma)
    returning 1)
  select count(*) into v_so from da_them;

  return v_so;
end;
$$;


-- =============================================================================
-- 4 · xep_hang_gui_tin — một lần bấm một tin; khách và chiến dịch đúng chi nhánh
-- =============================================================================
create or replace function xep_hang_gui_tin(
  p_chi_nhanh_id  uuid,
  p_khach_hang_id uuid,
  p_mau_tin_ma    text,
  p_noi_dung      text default null,
  p_chien_dich_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mau   mau_tin;
  v_khach khach_hang;
  v_check record;
  v_id    uuid;
  v_khoa  text;
  v_kq    ket_qua_gui;
  v_ma_cd text;
begin
  -- ---- 0045 · Ai được xếp tin gửi khách -----------------------------------
  if co_phien_dang_nhap()
     and not (co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])
              and duoc_truy_cap_chi_nhanh(p_chi_nhanh_id)) then
    raise exception 'Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này mới xếp được tin gửi khách'
      using errcode = 'insufficient_privilege';
  end if;

  -- ---- 0069 · Khách của chi nhánh này, chiến dịch của chi nhánh này --------
  if co_phien_dang_nhap()
     and not exists (select 1 from luot_ghe lg
                     where lg.khach_hang_id = p_khach_hang_id and lg.chi_nhanh_id = p_chi_nhanh_id)
     and not exists (select 1 from dat_ban d
                     where d.khach_hang_id = p_khach_hang_id and d.chi_nhanh_id = p_chi_nhanh_id) then
    raise exception 'Khách này chưa từng ghé hay đặt bàn ở chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  if p_chien_dich_id is not null then
    select m.ma into v_ma_cd
    from chien_dich c join mau_tin m on m.id = c.mau_tin_id
    where c.id = p_chien_dich_id and c.chi_nhanh_id = p_chi_nhanh_id;
    if not found then
      raise exception 'Chiến dịch không thuộc chi nhánh này'
        using errcode = 'check_violation';
    end if;
    -- Khoá CD:<chiến dịch>:<khách> không có mẫu: tin mẫu khác sẽ chiếm chỗ tin của chiến dịch.
    if v_ma_cd is distinct from p_mau_tin_ma then
      raise exception 'Mẫu tin khác mẫu của chiến dịch'
        using errcode = 'check_violation';
    end if;
  end if;

  -- ---- 0069 · Bấm hai lần = một tin ----------------------------------------
  -- Gửi tay: khoá theo chi nhánh (khách của hai chi nhánh nhận được tin của mỗi bên), mẫu, khách, ngày
  -- giờ VN. Tin đang chờ / đã gửi: trả lại đúng tin đó. Tin đã hỏng / bị từ chối / bị hủy: bấm gửi lại
  -- là một lần gửi MỚI — tin cũ giữ nguyên trong nhật ký, đổi khoá để nhả chỗ cho tin mới.
  v_khoa := case
              when p_chien_dich_id is not null then 'CD:' || p_chien_dich_id || ':' || p_khach_hang_id
              else 'TAY:' || p_chi_nhanh_id || ':' || p_mau_tin_ma || ':' || p_khach_hang_id
                   || ':' || to_char(hom_nay_vn(), 'YYYY-MM-DD')
            end;
  select id, ket_qua into v_id, v_kq from nhat_ky_tin where khoa_gui = v_khoa for update;
  if found then
    if v_kq in ('cho_gui', 'da_gui') then
      return v_id;
    end if;
    update nhat_ky_tin set khoa_gui = v_khoa || ':cu:' || v_id where id = v_id;
    v_id := null;
  end if;
  -- ---- Hết phần 0069 — từ đây là nguyên văn 0006 (insert thêm khoa_gui) ----

  select * into v_mau from mau_tin where ma = p_mau_tin_ma and dang_dung;
  if not found then
    raise exception 'Không tìm thấy mẫu tin %', p_mau_tin_ma
      using errcode = 'foreign_key_violation';
  end if;

  if not v_mau.da_duyet or v_mau.ma_zalo is null then
    raise exception 'Mẫu tin % chưa được Zalo duyệt', p_mau_tin_ma
      using errcode = 'check_violation';
  end if;

  select * into v_khach from khach_hang where id = p_khach_hang_id;
  if not found then
    raise exception 'Không tìm thấy khách hàng' using errcode = 'foreign_key_violation';
  end if;

  select * into v_check from duoc_phep_gui(p_khach_hang_id, v_mau.loai);
  if not v_check.duoc_gui then
    raise exception 'Không được phép gửi: %', v_check.ly_do
      using errcode = 'check_violation';
  end if;

  insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, mau_tin_id, chien_dich_id,
                           sdt_gui, noi_dung, ket_qua, khoa_gui)
  values (p_chi_nhanh_id, p_khach_hang_id, v_mau.id, p_chien_dich_id,
          v_khach.sdt, coalesce(p_noi_dung, v_mau.noi_dung), 'cho_gui', v_khoa)
  on conflict (khoa_gui) do nothing
  returning id into v_id;

  -- 0069: lời gọi song song đã ghi trước (cùng khoá) — trả lại tin của nó.
  if v_id is null then
    select id into v_id from nhat_ky_tin where khoa_gui = v_khoa;
  end if;

  return v_id;
end;
$$;

comment on function xep_hang_gui_tin is
  'Xếp một tin vào hàng gửi sau khi qua duoc_phep_gui(). Có phiên đăng nhập thì chỉ chủ sở hữu, quản lý, marketing của đúng chi nhánh (0045), khách phải đã ghé / đặt bàn ở chi nhánh đó, chiến dịch phải của chi nhánh đó (0069). khoa_gui CD:<chiến dịch>:<khách> hoặc TAY:<chi nhánh>:<mẫu>:<khách>:<ngày VN>: gọi lại trả ĐÚNG tin đang chờ / đã gửi; tin hỏng / bị từ chối / bị hủy thì xếp tin mới (0069).';


-- =============================================================================
-- 5 · dat_ban_kiem_sua — nhân viên chỉ ghi / đổi đặt bàn theo đúng bước của hộp thư
-- =============================================================================
-- nguoi_tao: nhân viên ghi hộ yêu cầu (chèn thẳng, hoặc gọi tao_dat_ban bằng phiên
-- đăng nhập). Tạo một đặt bàn ở chi nhánh mình là cho chi nhánh đó thấy hồ sơ khách
-- (khach_hang_doc) — việc đó giờ luôn để lại tên người làm, như luot_ghe.created_by.
alter table dat_ban add column if not exists nguoi_tao uuid references nhan_su(id) on delete set null;
comment on column dat_ban.nguoi_tao is
  'Nhân viên ghi hộ yêu cầu này (0069, trigger dat_ban_kiem_sua). Null = khách tự đặt (website, Messenger) hoặc ghi không phiên (SQL Editor).';

create or replace function dat_ban_kiem_sua()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_toi uuid;
begin
  -- Không phiên: tao_dat_ban / huy_dat_ban của website và Messenger (anon), SQL Editor,
  -- service_role — như cũ.
  if not co_phien_dang_nhap() then
    return new;
  end if;
  v_toi := (nhan_su_hien_tai()).id;

  -- Bàn, lượt ghé nối vào: đúng chi nhánh, đúng khách. Về null luôn được (ON DELETE SET NULL
  -- của ban_an / luot_ghe chạy như một câu UPDATE dưới phiên của người xoá).
  if new.ban_an_id is not null
     and (tg_op = 'INSERT' or new.ban_an_id is distinct from old.ban_an_id)
     and not exists (select 1 from ban_an b where b.id = new.ban_an_id and b.chi_nhanh_id = new.chi_nhanh_id) then
    raise exception 'Bàn này không thuộc chi nhánh của đặt bàn'
      using errcode = 'check_violation';
  end if;
  if new.luot_ghe_id is not null
     and (tg_op = 'INSERT' or new.luot_ghe_id is distinct from old.luot_ghe_id)
     and not exists (select 1 from luot_ghe lg
                     where lg.id = new.luot_ghe_id
                       and lg.khach_hang_id = new.khach_hang_id
                       and lg.chi_nhanh_id = new.chi_nhanh_id) then
    raise exception 'Lượt ghé phải của đúng khách và đúng chi nhánh của đặt bàn'
      using errcode = 'check_violation';
  end if;
  if new.nguoi_xu_ly is not null
     and (tg_op = 'INSERT' or new.nguoi_xu_ly is distinct from old.nguoi_xu_ly)
     and new.nguoi_xu_ly is distinct from v_toi then
    raise exception 'Người xử lý phải là chính người đang đăng nhập'
      using errcode = 'insufficient_privilege';
  end if;

  -- ---- Chèn thẳng (dat_ban_them) / tao_dat_ban bằng phiên: nhân viên ghi hộ -----
  if tg_op = 'INSERT' then
    -- Ghi hộ là yêu cầu chờ gọi, hoặc đã gọi xác nhận luôn — không "tạo" một đặt bàn đã kết thúc.
    if new.trang_thai not in ('cho_xac_nhan', 'da_xac_nhan') then
      raise exception 'Đặt bàn mới chỉ ở trạng thái chờ gọi hoặc đã xác nhận'
        using errcode = 'check_violation';
    end if;
    new.nguoi_tao := v_toi;
    if new.trang_thai = 'da_xac_nhan' then
      new.nguoi_xu_ly := v_toi;
    end if;
    return new;
  end if;

  -- ---- Sửa (dat_ban_sua) -------------------------------------------------------
  if new.id <> old.id
     or new.chi_nhanh_id <> old.chi_nhanh_id
     or new.khach_hang_id <> old.khach_hang_id
     or new.ma_dat_ban is distinct from old.ma_dat_ban
     or new.created_at <> old.created_at
     or new.dong_y_nhan_tin <> old.dong_y_nhan_tin
     or new.utm_source is distinct from old.utm_source
     or new.utm_medium is distinct from old.utm_medium
     or new.utm_campaign is distinct from old.utm_campaign
     or new.trang_gioi_thieu is distinct from old.trang_gioi_thieu
     or (new.nguoi_tao is distinct from old.nguoi_tao and new.nguoi_tao is not null) then
    raise exception 'Không sửa được khách, chi nhánh, mã đặt bàn, đồng ý nhận tin hay nguồn của một đặt bàn'
      using errcode = 'insufficient_privilege';
  end if;

  -- Đúng 5 bước của CHUYEN_DUOC ở web/src/pages/noi-bo/dat-ban.astro.
  if new.trang_thai <> old.trang_thai
     and not ((old.trang_thai = 'cho_xac_nhan' and new.trang_thai in ('da_xac_nhan', 'da_huy'))
              or (old.trang_thai = 'da_xac_nhan' and new.trang_thai in ('da_den', 'khong_den', 'da_huy'))) then
    raise exception 'Bước chuyển trạng thái đặt bàn không hợp lệ'
      using errcode = 'check_violation';
  end if;

  if old.trang_thai in ('da_den', 'khong_den', 'da_huy')
     and (new.ngay <> old.ngay or new.gio <> old.gio or new.so_khach <> old.so_khach
          or (new.ban_an_id is distinct from old.ban_an_id and new.ban_an_id is not null)) then
    raise exception 'Đặt bàn đã kết thúc — không đổi được ngày, giờ, số khách hay bàn'
      using errcode = 'check_violation';
  end if;

  if new.trang_thai <> old.trang_thai then
    new.nguoi_xu_ly := v_toi;
  end if;

  return new;
end;
$$;

comment on function dat_ban_kiem_sua is
  'Trigger (0069): có phiên đăng nhập thì đặt bàn ghi hộ chỉ ở chờ gọi / đã xác nhận (nguoi_tao = người ghi), chỉ đổi theo đúng 5 bước của hộp thư /noi-bo/dat-ban; không đổi khách, chi nhánh, mã, đồng ý nhận tin, nguồn, giờ tạo, người tạo; đã kết thúc thì không đổi ngày / giờ / số khách / bàn; bàn và lượt ghé phải đúng chi nhánh, đúng khách; nguoi_xu_ly = người đang đăng nhập. Cột khoá ngoại về null (ON DELETE SET NULL) luôn được.';

drop trigger if exists dat_ban_kiem_sua on dat_ban;
create trigger dat_ban_kiem_sua
  before insert or update on dat_ban
  for each row execute function dat_ban_kiem_sua();


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
