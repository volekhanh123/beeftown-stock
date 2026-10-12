-- =============================================================================
-- BEEFTOWN CRM — 0086 · HỒ SƠ ỨNG TUYỂN PHẢI CÓ SỐ ĐIỆN THOẠI
-- =============================================================================
-- (Trước đây đánh số 0080 rồi 0084. Main nhận 0081_ho_so_gui_lai rồi
-- 0084_gioi_han_cong_khai — cả hai viết lại cùng hàm — nên file này phải chạy SAU
-- chúng. Thứ tự gộp Khánh chốt 12/10/2026: PR #77 trước, PR này sau. Số lấy bằng
-- npm run so-migration.)
--
-- LỖI (có từ 0012, phát hiện khi làm PR #74, tái hiện trên PGlite)
--
-- nop_ho_so_ung_tuyen() kiểm số điện thoại bằng
--
--     v_sdt := chuan_hoa_sdt(p_sdt);
--     if not sdt_hop_le(v_sdt) then raise exception 'Số điện thoại không hợp lệ: %' …
--
-- Ô số điện thoại không có chữ số nào ("abc", rỗng, toàn dấu cách, "---"):
-- chuan_hoa_sdt() bỏ hết ký tự không phải số và trả null. sdt_hop_le(null) là
-- null chứ không phải false, "not null" vẫn là null, nên lệnh if không chạy.
-- Ràng buộc ho_so_sdt_hop_le check (da_an_danh or sdt_hop_le(sdt)) (0012) cũng
-- cho qua: check trả null thì Postgres tính là đạt. Hồ sơ được lưu với
-- sdt = null — không liên lạc được ứng viên, và chỉ mục chống nộp trùng
-- ho_so_khong_trung_idx (vi_tri_id, sdt, ngay_nop) không chặn hai dòng null.
--
-- Website không gửi ô rỗng (web/src/lib/nop-ho-so.ts báo "thiếu số" trước),
-- nhưng gửi "abc" thẳng xuống database. Ai gọi API công khai bằng khóa anon
-- thì gửi được cả null.
--
-- ĐỔI GÌ
--
--   1. nop_ho_so_ung_tuyen — thân 0084_gioi_han_cong_khai NGUYÊN VĂN (0081 cho lần
--      gửi lại nhận đúng mã cũ; 0084 thêm giới hạn tần suất và khóa), chỉ đổi
--      điều kiện thành
--      "if v_sdt is null or not sdt_hop_le(v_sdt) then": đúng mẫu tao_dat_ban
--      (0002, 0045, 0069) và tim_hoac_tao_khach (0002) đang dùng. Câu
--      raise exception giữ nguyên chữ — trang vi / en / ko (web/src/lib/chu.ts)
--      và nội bộ (web/src/lib/cau-noi-bo.ts) đã nhận ra câu này.
--   2. Ràng buộc MỚI ho_so_sdt_bat_buoc check (da_an_danh or sdt is not null):
--      mọi đường ghi khác (quản lý sửa thẳng qua policy ho_so_sua, hàm viết sau
--      này) cũng không để lọt hồ sơ chưa ẩn danh mà sdt rỗng. Ràng buộc cũ
--      ho_so_sdt_hop_le giữ nguyên tên và nội dung; hai cái cùng nhau mới đủ:
--      có số, và số đúng dạng. Hồ sơ đã ẩn danh (0012, 0074) vẫn sdt = null.
--
-- Rà các hàm còn lại (grep "not sdt_hop_le" trên mọi migration): chỉ
-- nop_ho_so_ung_tuyen (0012, 0026, 0081, 0084) thiếu "is null". Kiểm thử đọc định nghĩa
-- ĐANG CHẠY của mọi hàm trong database, nên nhánh nào viết lại hàm này từ thân
-- cũ sẽ đỏ: crm/test/test-tuyen-dung-sdt-rong.mjs.
--
-- DỮ LIỆU CŨ: ràng buộc mới kiểm cả dòng đã có (không "not valid"). Đếm trên
-- production ngày 12/10/2026: 0 hồ sơ, 0 dòng sdt rỗng chưa ẩn danh. Trước khi
-- chạy, đếm lại cho chắc:
--
--     select count(*) from ho_so_ung_tuyen where sdt is null and not da_an_danh;
--
-- Khác 0 thì DỪNG, hỏi Khánh (liên lạc ứng viên bằng email nếu có, hoặc ẩn danh
-- sớm) — đừng tự thêm "not valid": dòng cũ sẽ không sửa được trạng thái nữa.
--
-- Không hàm mới. Hàm viết lại giữ security definer, set search_path và quyền
-- của anon; khối CHỐT QUYỀN cuối file chép từ 0084_gioi_han_cong_khai (danh sách anon mới).
-- =============================================================================


-- =============================================================================
-- 1 · NỘP HỒ SƠ — thân 0084_gioi_han_cong_khai, chỉ thêm "v_sdt is null or" vào điều kiện số điện thoại
-- =============================================================================
create or replace function nop_ho_so_ung_tuyen(
  p_vi_tri_ma   text,
  p_ho_ten      text,
  p_sdt         text,
  p_email       text default null,
  p_nam_sinh    smallint default null,
  p_gioi_thieu  text default null,
  p_kinh_nghiem text default null,
  p_ca_lam_duoc text[] default null,
  p_ma_tai_len  uuid default null,
  p_ten_tep     text default null,
  p_dong_y      boolean default false,
  p_bay         text default null,   -- honeypot: bot điền, người không thấy
  p_giay_tren_form int default null,
  p_utm_source   text default null,
  p_utm_campaign text default null,
  p_ip          inet default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vi_tri vi_tri_tuyen_dung;
  v_sdt    text;
  v_dem    int;
  v_tong   int;
  v_phieu  phieu_tai_len;
  v_ma     text;
  v_duong_dan text;
  v_cu     ho_so_ung_tuyen;
  i        int;
begin
  -- Honeypot và thời gian điền form: bot trượt cả hai. Câu báo lỗi CỐ Ý
  -- chung chung — nói rõ cái nào sai là dạy cho bot cách lách.
  if coalesce(btrim(p_bay), '') <> ''
     or (p_giay_tren_form is not null and p_giay_tren_form < 3) then
    raise exception 'Không gửi được hồ sơ, vui lòng thử lại'
      using errcode = 'check_violation';
  end if;

  if not cong_tac_bat('hien_tuyen_dung') then
    raise exception 'Cổng tuyển dụng đang tạm đóng'
      using errcode = 'check_violation';
  end if;

  -- 0081: dời lên từ sau bước đếm IP.
  select * into v_vi_tri from vi_tri_tuyen_dung
  where ma = p_vi_tri_ma and trang_thai = 'da_cong_bo';
  if not found then
    raise exception 'Không tìm thấy vị trí tuyển dụng %', p_vi_tri_ma
      using errcode = 'foreign_key_violation';
  end if;

  -- 0026: trường tin này không hỏi thì không lưu, dù có gửi lên. Form chỉ ẩn
  -- bằng CSS, nên trình duyệt cũ vẫn thấy và vẫn gửi. (0081: dời lên theo.)
  if not v_vi_tri.hoi_email       then p_email       := null; end if;
  if not v_vi_tri.hoi_nam_sinh    then p_nam_sinh    := null; end if;
  if not v_vi_tri.hoi_ca_lam      then p_ca_lam_duoc := null; end if;
  if not v_vi_tri.hoi_gioi_thieu  then p_gioi_thieu  := null; end if;
  if not v_vi_tri.hoi_kinh_nghiem then p_kinh_nghiem := null; end if;
  if not v_vi_tri.hoi_cv then
    -- Vé không bị đánh dấu đã dùng: nó tự hết hạn sau 15 phút.
    p_ma_tai_len := null;
    p_ten_tep    := null;
  end if;

  v_sdt := chuan_hoa_sdt(p_sdt);

  -- ---- 0081 · Gửi lại y hệt → trả lại hồ sơ cũ ------------------------------
  if not co_phien_dang_nhap() and p_dong_y then
    -- Hai lượt gửi chồng nhau của cùng một người xếp hàng ở đây; lượt sau thấy
    -- hồ sơ lượt trước vừa ghi. Khóa nhả khi giao dịch xong.
    perform pg_advisory_xact_lock(hashtextextended(v_vi_tri.id::text || '|' || coalesce(v_sdt, ''), 0));

    select h.* into v_cu
    from ho_so_ung_tuyen h
    where h.vi_tri_id = v_vi_tri.id
      and h.sdt = v_sdt
      and not h.da_an_danh
      and (h.ngay_nop = hom_nay_vn() or h.created_at > now() - interval '10 minutes')
      and h.ho_ten = btrim(p_ho_ten)
      and h.email is not distinct from nullif(btrim(p_email), '')
      and h.nam_sinh is not distinct from p_nam_sinh
      and h.gioi_thieu is not distinct from p_gioi_thieu
      and h.kinh_nghiem is not distinct from p_kinh_nghiem
      and h.ca_lam_duoc is not distinct from p_ca_lam_duoc
      -- Có kèm CV thì chỉ khớp hồ sơ đã có CV — không gắn file vào hồ sơ cũ (xem đầu file).
      and (p_ma_tai_len is null or h.duong_dan_cv is not null)
    order by h.created_at desc
    limit 1;

    if found then
      return v_cu.ma_ho_so;
    end if;
  end if;
  -- ---- Hết phần 0081 — từ đây là nguyên văn 0026 (trừ hai bước đã dời lên) ----

  -- ---- 0084 · Khoá trước khi đếm; IP null đếm như một IP; trần toàn cục ---
  -- Đứng SAU bước gửi lại y hệt của 0081: lần gửi lại khi đã chạm giới hạn vẫn
  -- nhận đúng mã cũ (hồ sơ đã ghi), không phải "quá nhiều".
  perform pg_advisory_xact_lock(hashtext('ho_so_ung_tuyen'));

  select count(*) filter (where ip is not distinct from p_ip), count(*)
    into v_dem, v_tong
  from ho_so_ung_tuyen
  where created_at > now() - interval '1 hour';

  if v_dem >= 5 and p_ip is not null then
    raise exception 'Bạn đã nộp quá nhiều hồ sơ, vui lòng liên hệ trực tiếp với nhà hàng'
      using errcode = 'check_violation';
  end if;
  if v_dem >= 5 or v_tong >= 30 then
    raise exception 'Hệ thống đang nhận quá nhiều yêu cầu, vui lòng thử lại sau hoặc liên hệ trực tiếp với nhà hàng'
      using errcode = 'check_violation';
  end if;
  -- ---- Hết phần 0084 — từ đây là nguyên văn 0081 ----------------------------

  if v_vi_tri.han_nop is not null and v_vi_tri.han_nop < hom_nay_vn() then
    raise exception 'Vị trí này đã hết hạn nhận hồ sơ'
      using errcode = 'check_violation';
  end if;

  if not p_dong_y then
    raise exception 'Chưa đồng ý cho Beeftown xử lý thông tin ứng tuyển'
      using errcode = 'check_violation';
  end if;

  if v_sdt is null or not sdt_hop_le(v_sdt) then
    raise exception 'Số điện thoại không hợp lệ: %', p_sdt
      using errcode = 'check_violation';
  end if;

  if la_van_ban_tam(p_ho_ten) then
    raise exception 'Vui lòng điền họ tên'
      using errcode = 'check_violation';
  end if;

  -- Vé tải CV: chỉ nhận vé còn hạn và chưa dùng.
  if p_ma_tai_len is not null then
    select * into v_phieu from phieu_tai_len
    where id = p_ma_tai_len and not da_dung and het_han > now()
    for update;
    if not found then
      raise exception 'Phiếu tải CV đã hết hạn, vui lòng chọn lại file'
        using errcode = 'check_violation';
    end if;
    update phieu_tai_len set da_dung = true where id = p_ma_tai_len;
    v_duong_dan := 'ho-so-ung-tuyen/' || p_ma_tai_len::text || '/'
                   || coalesce(nullif(btrim(p_ten_tep), ''), 'cv');
  end if;

  -- Mã hồ sơ: BT-UV-YYMM-<5 ký tự>. Bỏ 0/O/1/I/L cho dễ đọc qua điện thoại.
  for i in 1..20 loop
    v_ma := 'BT-UV-' || to_char(bay_gio_vn(), 'YYMM') || '-' ||
            string_agg(substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ',
                              (floor(random() * 31) + 1)::int, 1), '')
      from generate_series(1, 5);
    exit when not exists (select 1 from ho_so_ung_tuyen where ma_ho_so = v_ma);
    v_ma := null;
  end loop;
  if v_ma is null then
    raise exception 'Không sinh được mã hồ sơ, vui lòng thử lại';
  end if;

  insert into ho_so_ung_tuyen (
    ma_ho_so, vi_tri_id, chi_nhanh_id,
    ho_ten, sdt, email, nam_sinh, gioi_thieu, kinh_nghiem, ca_lam_duoc,
    duong_dan_cv,
    dong_y_noi_dung, dong_y_ip,
    luu_den, nguon_utm_source, nguon_utm_campaign, ip, ngay_nop)
  values (
    v_ma, v_vi_tri.id, v_vi_tri.chi_nhanh_id,
    btrim(p_ho_ten), v_sdt, nullif(btrim(p_email), ''), p_nam_sinh,
    p_gioi_thieu, p_kinh_nghiem, p_ca_lam_duoc,
    v_duong_dan,
    'Tôi đồng ý để Beeftown lưu và sử dụng thông tin trong hồ sơ này cho mục đích tuyển dụng, trong vòng 6 tháng kể từ ngày nộp.',
    p_ip,
    hom_nay_vn() + 180, p_utm_source, p_utm_campaign, p_ip, hom_nay_vn());

  return v_ma;
end;
$$;


-- =============================================================================
-- 2 · RÀNG BUỘC — hồ sơ chưa ẩn danh phải có số điện thoại
-- =============================================================================
-- sdt_hop_le(null) là null, nên ho_so_sdt_hop_le (0012) không chặn được sdt
-- rỗng. Không sửa ràng buộc cũ (tên của nó nằm trong câu lỗi đã gặp); thêm cái mới.
alter table ho_so_ung_tuyen
  add constraint ho_so_sdt_bat_buoc check (da_an_danh or sdt is not null);

comment on constraint ho_so_sdt_bat_buoc on ho_so_ung_tuyen is
  'Hồ sơ chưa ẩn danh phải có số điện thoại (0086). ho_so_sdt_hop_le kiểm dạng số nhưng cho qua null.';


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6. Giữ dòng ve_con_hieu_luc: xem 0025.
-- =============================================================================
-- Từ 0084 KHÔNG còn dòng ghi_nhat_ky_tra_cuu, và tra_cuu_dat_ban nhường chỗ cho
-- tra_cuu_mot_dat_ban (mục 3). Migration sau chép khối này, đừng chép khối của
-- 0062 trở về trước.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on all functions in schema public from public';
    execute 'revoke execute on all functions in schema public from anon';

    -- Đặt bàn
    execute 'grant execute on function tao_dat_ban(text,text,text,date,time,smallint,text,text,boolean,text,text,text,text,inet) to anon';
    execute 'grant execute on function lich_trong_theo_ma(text,date) to anon';
    execute 'grant execute on function chi_nhanh_cong_khai() to anon';
    execute 'grant execute on function tra_cuu_mot_dat_ban(text,text,inet) to anon';
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


-- =============================================================================
-- KIỂM TRA BẰNG TAY SAU KHI CHẠY (Beeftown-thu trước, production sau khi gộp)
-- =============================================================================
--  1. /tuyen-dung, mở một tin, số điện thoại gõ "abc" → trang báo "Số điện
--     thoại không hợp lệ: abc" (trang /en: "The phone number is not valid.",
--     /ko: "전화번호가 올바르지 않아요."); /noi-bo/tuyen-dung không có hồ sơ mới.
--  2. Cùng form, số thật (0912 345 678) → nhận được mã BT-UV-…, hồ sơ hiện ở
--     /noi-bo/tuyen-dung với số 0912345678.
--  3. npm run doi-chieu báo KHỚP.
