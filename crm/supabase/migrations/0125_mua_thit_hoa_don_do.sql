-- =============================================================================
-- 0125 · MUA THỊT VỀ: KHÁCH CẦN XUẤT HÓA ĐƠN ĐỎ (HÓA ĐƠN GIÁ TRỊ GIA TĂNG) — Khánh 18/11/2026
-- =============================================================================
-- PHẢI CHẠY SAU 0113 (don_mua_thit, tao_don_mua_thit), 0115 (thân don_mua_thit_danh_sach mới nhất, bảng
-- thanh_toan_vnpay_web).
--
-- Khánh 18/11/2026: quán có xuất hóa đơn đỏ và cần một mẫu để khách nhập thông tin. Trang Mua thịt về (/mua-thit-ve,
-- /en/buy-meat, /ko/buy-meat) thêm ô "Cần xuất hóa đơn đỏ"; chọn ô đó thì khách điền tên đơn vị, mã số thuế, địa chỉ
-- đơn vị, email nhận hóa đơn. Đơn ghi các thông tin này; hộp thư /noi-bo/don-mua-thit hiện cho nhân viên xuất hóa đơn.
--
-- Luật (cùng luật ở web/src/lib/don-mua-thit.ts — chuanHoaMaSoThue, MAU_MA_SO_THUE, MAU_EMAIL_HOA_DON; kiểm thử
-- crm/test/test-mua-thit-hoa-don.mjs so hai bên trên cùng một bảng chữ):
--   · Chọn xuất hóa đơn thì BẮT BUỘC: tên đơn vị (1–200 ký tự), mã số thuế đúng dạng (10 số, hoặc 10 số - 3 số của
--     đơn vị phụ thuộc), email nhận hóa đơn đúng dạng (tối đa 200 ký tự). Địa chỉ đơn vị không bắt buộc (tối đa 300).
--   · Mã số thuế lưu một dạng: bỏ dấu cách và dấu chấm, mọi kiểu gạch ngang thành "-", 13 số liền nhau thành
--     "0123456789-001".
--   · Không chọn thì bốn cột hóa đơn để trống — ràng buộc của bảng giữ cả hai chiều, cho mọi đường ghi.
--
-- Không có câu delete. Có hai câu drop function, tạo lại ngay trong file với cùng quyền: tao_don_mua_thit đổi tham số
-- (thêm p_hoa_don ở cuối — để nguyên bản mười tham số thì Postgres có hai hàm cùng tên, lời gọi mười tham số không biết
-- chọn hàm nào), don_mua_thit_danh_sach đổi kiểu trả về. Chỉ chạy lên production SAU khi PR được gộp, bằng SQL Editor
-- hoặc psql (không dùng apply_migration của Supabase MCP), cả file một lần (SQL Editor chạy cả file trong một giao dịch
-- — không có lúc nào hàm đặt hàng vắng mặt), rồi `npm run doi-chieu` phải báo KHỚP.
--
-- Chạy migration TRƯỚC, deploy web SAU. Web cũ gọi tao_don_mua_thit với mười tham số cũ — p_hoa_don có mặc định null nên
-- vẫn chạy; hộp thư cũ đọc theo tên cột nên bỏ qua cột mới. Lỡ deploy web mới trước: đơn không chọn hóa đơn vẫn đặt được
-- (web chỉ gửi p_hoa_don khi khách chọn ô), đơn có chọn bị database từ chối và trang báo CHƯA ghi nhận.
--
-- File này:
--   1 · Năm cột hóa đơn của don_mua_thit, hai ràng buộc.
--   2 · tao_don_mua_thit — thêm p_hoa_don (jsonb, mặc định null).
--   3 · don_mua_thit_danh_sach — trả thêm năm cột hóa đơn.
--   4 · Quyền.
--
-- CÂU MỚI (web dịch ở web/src/lib/chu.ts cho trang en / ko, web/src/lib/cau-noi-bo.ts cho nội bộ):
--   'Thông tin xuất hóa đơn không đúng dạng' · 'Chưa điền tên đơn vị xuất hóa đơn' · 'Tên đơn vị dài quá 200 ký tự' ·
--   'Mã số thuế phải gồm 10 số, hoặc 10 số - 3 số' · 'Địa chỉ đơn vị dài quá 300 ký tự' ·
--   'Chưa điền email nhận hóa đơn' · 'Email nhận hóa đơn không đúng dạng'. 'Email dài quá 200 ký tự' đã có từ 0121.
--   Câu raise exception cũ giữ nguyên từng chữ.
-- =============================================================================


-- =============================================================================
-- 1 · CỘT HÓA ĐƠN CỦA don_mua_thit
-- =============================================================================
-- Đơn cũ: xuat_hoa_don = false, bốn cột null — qua được cả hai ràng buộc, không phải sửa dòng nào.
alter table don_mua_thit
  add column xuat_hoa_don       boolean not null default false,
  add column hoa_don_ten_don_vi text,
  add column hoa_don_ma_so_thue text,
  add column hoa_don_dia_chi    text,
  add column hoa_don_email      text;

-- Chọn xuất hóa đơn: bắt buộc tên đơn vị, mã số thuế đúng dạng, email đúng dạng; địa chỉ đơn vị có thể trống. Mẫu mã
-- số thuế và mẫu email trùng từng ký tự với tao_don_mua_thit ở mục 2 và với web/src/lib/don-mua-thit.ts.
alter table don_mua_thit
  add constraint don_mua_thit_hoa_don check (
    not xuat_hoa_don
    or (    btrim(coalesce(hoa_don_ten_don_vi, '')) <> ''
        and char_length(hoa_don_ten_don_vi) <= 200
        and coalesce(hoa_don_ma_so_thue, '') ~ '^[0-9]{10}(-[0-9]{3})?$'
        and char_length(coalesce(hoa_don_email, '')) <= 200
        and coalesce(hoa_don_email, '') ~ '^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$'
        and (hoa_don_dia_chi is null or char_length(hoa_don_dia_chi) between 1 and 300))
  ),
  -- Không chọn: không giữ thông tin hóa đơn nào (dữ liệu cá nhân chỉ thu khi khách cần).
  add constraint don_mua_thit_khong_hoa_don check (
    xuat_hoa_don
    or (hoa_don_ten_don_vi is null and hoa_don_ma_so_thue is null and hoa_don_dia_chi is null and hoa_don_email is null)
  );

comment on table don_mua_thit is
  'Đơn mua thịt về khách đặt trên website (0113): họ tên, số điện thoại, địa chỉ giao, ảnh chụp dòng đơn và tạm tính lúc đặt; khách cần hóa đơn đỏ thì thêm tên đơn vị, mã số thuế, địa chỉ đơn vị, email nhận hóa đơn (0125). Chỉ giao tận nơi. Khóa kín: anon tạo qua tao_don_mua_thit; nhân viên (chủ, quản lý, thu ngân, theo chi nhánh) đọc qua don_mua_thit_danh_sach, đổi trạng thái qua don_mua_thit_chuyen.';
comment on column don_mua_thit.xuat_hoa_don is
  'Khách chọn "Cần xuất hóa đơn đỏ" (0125). true thì tên đơn vị, mã số thuế, email nhận hóa đơn bắt buộc (ràng buộc don_mua_thit_hoa_don); false thì bốn cột hóa đơn trống (don_mua_thit_khong_hoa_don).';
comment on column don_mua_thit.hoa_don_ma_so_thue is
  'Mã số thuế ghi trên hóa đơn (0125): 10 số, hoặc 10 số - 3 số của đơn vị phụ thuộc — đã bỏ dấu cách, dấu chấm; 13 số liền nhau lưu thành 0123456789-001.';
comment on column don_mua_thit.hoa_don_dia_chi is
  'Địa chỉ đơn vị ghi trên hóa đơn (0125), không bắt buộc: khách để trống thì nhân viên tra theo mã số thuế.';


-- =============================================================================
-- 2 · tao_don_mua_thit — THÊM p_hoa_don
-- =============================================================================
-- Thân 0113 nguyên văn; chỗ vá ghi "-- 0125 ·". p_hoa_don: null (hoặc JSON null) = không cần hóa đơn; object
-- {ten_don_vi, ma_so_thue, dia_chi, email} = cần xuất hóa đơn. Kiểm ngay sau ô liên hệ, trước giỏ: đơn sai nhận đúng
-- câu của nó và không tốn lượt giới hạn tần suất. Gửi lại cùng ma_gui vẫn trả đơn cũ như trước (không đọc p_hoa_don).
drop function if exists tao_don_mua_thit(uuid, text, text, text, text, text, jsonb, jsonb, text, inet);

create or replace function tao_don_mua_thit(
  p_ma_gui      uuid,
  p_chi_nhanh_ma text,
  p_ho_ten      text,
  p_sdt         text,
  p_dia_chi     text,
  p_ghi_chu     text,
  p_gio         jsonb,
  p_gia_da_xem  jsonb,
  p_ngon_ngu    text default 'vi',
  p_ip          inet default null,
  -- 0125 · hóa đơn đỏ: null = không cần; {ten_don_vi, ma_so_thue, dia_chi, email} = cần xuất hóa đơn.
  p_hoa_don     jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cn      chi_nhanh;
  v_don     don_mua_thit;
  v_ho_ten  text := regexp_replace(btrim(coalesce(p_ho_ten, '')), '\s+', ' ', 'g');
  v_dia_chi text := regexp_replace(btrim(coalesce(p_dia_chi, '')), '\s+', ' ', 'g');
  v_ghi_chu text := nullif(btrim(replace(coalesce(p_ghi_chu, ''), E'\r', '')), '');
  v_sdt     text := chuan_hoa_sdt(p_sdt);
  v_menu    jsonb := '{}'::jsonb;   -- khoa → gói đặt được (không tạm hết)
  v_het     jsonb := '{}'::jsonb;   -- khoa → gói đang tạm hết
  v_dong    jsonb := '[]'::jsonb;
  v_tong    bigint := 0;
  v_khoa    text;
  v_so      jsonb;
  v_n       int;
  v_g       jsonb;
  v_dem     int;
  r         record;
  -- 0125 · hóa đơn đỏ
  v_xuat_hoa_don boolean := p_hoa_don is not null and jsonb_typeof(p_hoa_don) <> 'null';
  v_hd_ten       text;
  v_hd_ma_so_thue text;
  v_hd_dia_chi   text;
  v_hd_email     text;
begin
  if not mua_thit_ve_kenh_mo() then
    raise exception 'Mua thịt về qua website đang tạm đóng'
      using errcode = 'check_violation';
  end if;

  select * into v_cn from chi_nhanh where lower(ma) = lower(p_chi_nhanh_ma) and dang_hoat_dong;
  if not found then
    raise exception 'Không tìm thấy chi nhánh %', p_chi_nhanh_ma
      using errcode = 'foreign_key_violation';
  end if;

  -- ---- Gửi hai lần: cùng mã chống gửi hai lần → đơn cũ ------------------------------------------------
  if p_ma_gui is null then
    raise exception 'Thiếu mã chống gửi hai lần — tải lại trang.'
      using errcode = 'check_violation';
  end if;
  -- Hai lượt cùng mã chạy song song xếp hàng ở đây; lượt sau thấy dòng lượt trước vừa ghi.
  perform pg_advisory_xact_lock(hashtext('don_mua_thit:' || p_ma_gui::text));
  select * into v_don from don_mua_thit where ma_gui = p_ma_gui;
  if found then
    return jsonb_build_object('ma_don', v_don.ma_don, 'tam_tinh', v_don.tam_tinh, 'da_co', true);
  end if;

  -- ---- Ô liên hệ ------------------------------------------------------------------------------------
  if v_ho_ten = '' then
    raise exception 'Chưa điền họ tên' using errcode = 'check_violation';
  end if;
  if char_length(v_ho_ten) > 120 then
    raise exception 'Họ tên dài quá 120 ký tự' using errcode = 'check_violation';
  end if;
  if v_sdt is null or v_sdt !~ '^0[0-9]{9,10}$' then
    raise exception 'Số điện thoại không hợp lệ' using errcode = 'check_violation';
  end if;
  if char_length(v_dia_chi) < 8 then
    raise exception 'Địa chỉ giao hàng quá ngắn, vui lòng ghi rõ số nhà, tên đường và khu vực' using errcode = 'check_violation';
  end if;
  if char_length(v_dia_chi) > 300 then
    raise exception 'Địa chỉ giao hàng dài quá 300 ký tự' using errcode = 'check_violation';
  end if;
  if char_length(v_ghi_chu) > 500 then
    raise exception 'Ghi chú dài quá 500 ký tự' using errcode = 'check_violation';
  end if;

  -- ---- 0125 · Hóa đơn đỏ: chọn thì bắt buộc tên đơn vị, mã số thuế đúng dạng, email đúng dạng -----------
  -- Cùng luật với chuanHoaMaSoThue, MAU_MA_SO_THUE, MAU_EMAIL_HOA_DON của web/src/lib/don-mua-thit.ts và với ràng
  -- buộc don_mua_thit_hoa_don (mục 1).
  if v_xuat_hoa_don then
    if jsonb_typeof(p_hoa_don) <> 'object' then
      raise exception 'Thông tin xuất hóa đơn không đúng dạng' using errcode = 'check_violation';
    end if;
    v_hd_ten := btrim(regexp_replace(coalesce(p_hoa_don ->> 'ten_don_vi', ''), '\s+', ' ', 'g'));
    if v_hd_ten = '' then
      raise exception 'Chưa điền tên đơn vị xuất hóa đơn' using errcode = 'check_violation';
    end if;
    if char_length(v_hd_ten) > 200 then
      raise exception 'Tên đơn vị dài quá 200 ký tự' using errcode = 'check_violation';
    end if;
    -- Mọi kiểu gạch ngang (bàn phím điện thoại, Word, PDF: U+2010–U+2015, U+2212) thành "-"; bỏ dấu cách (cả cách
    -- không ngắt U+00A0, cách hẹp U+202F, ký tự rộng 0 U+200B, U+FEFF), tab, xuống dòng, dấu chấm; 13 số liền nhau
    -- thành 10 số - 3 số. (repeat thay cho bảy dấu gạch viết liền: bộ đọc migration của repo coi hai gạch là chú thích.)
    v_hd_ma_so_thue := translate(
      translate(coalesce(p_hoa_don ->> 'ma_so_thue', ''), E'‐‑‒–—―−', repeat('-', 7)),
      E' \t\r\n  ​﻿.', '');
    if v_hd_ma_so_thue ~ '^[0-9]{13}$' then
      v_hd_ma_so_thue := substr(v_hd_ma_so_thue, 1, 10) || '-' || substr(v_hd_ma_so_thue, 11, 3);
    end if;
    if v_hd_ma_so_thue !~ '^[0-9]{10}(-[0-9]{3})?$' then
      raise exception 'Mã số thuế phải gồm 10 số, hoặc 10 số - 3 số' using errcode = 'check_violation';
    end if;
    v_hd_dia_chi := nullif(btrim(regexp_replace(coalesce(p_hoa_don ->> 'dia_chi', ''), '\s+', ' ', 'g')), '');
    if char_length(v_hd_dia_chi) > 300 then
      raise exception 'Địa chỉ đơn vị dài quá 300 ký tự' using errcode = 'check_violation';
    end if;
    v_hd_email := btrim(coalesce(p_hoa_don ->> 'email', ''));
    if v_hd_email = '' then
      raise exception 'Chưa điền email nhận hóa đơn' using errcode = 'check_violation';
    end if;
    if char_length(v_hd_email) > 200 then
      raise exception 'Email dài quá 200 ký tự' using errcode = 'check_violation';
    end if;
    if v_hd_email !~ '^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$' then
      raise exception 'Email nhận hóa đơn không đúng dạng' using errcode = 'check_violation';
    end if;
  end if;

  -- ---- Giỏ: từng gói phải còn trên menu công khai, số gói 1–10 --------------------------------------
  for r in select * from mua_thit_ve_goi('vi', v_cn.ma, false) loop
    if r.tam_het then
      v_het := v_het || jsonb_build_object(r.san_pham_ma || '_' || r.so_gam, true);
    else
      v_menu := v_menu || jsonb_build_object(r.san_pham_ma || '_' || r.so_gam, jsonb_build_object(
        'khoa', r.san_pham_ma || '_' || r.so_gam, 'san_pham_ma', r.san_pham_ma, 'ten_vi', r.ten_vi,
        'don_vi', r.don_vi, 'bao_quan', r.bao_quan, 'so_gam', r.so_gam, 'gia', r.gia));
    end if;
  end loop;

  if jsonb_typeof(p_gio) is distinct from 'object' then
    raise exception 'Đơn chưa có gói nào' using errcode = 'check_violation';
  end if;
  for v_khoa, v_so in select e.key, e.value from jsonb_each(p_gio) e loop
    -- Số gói: số nguyên 0–10 (số JSON hay chuỗi chữ số như ô chọn của form gửi). 0 bỏ qua.
    v_n := case
             when jsonb_typeof(v_so) = 'number' and (v_so #>> '{}') ~ '^[0-9]{1,2}$' then (v_so #>> '{}')::int
             when jsonb_typeof(v_so) = 'string' and (v_so #>> '{}') ~ '^[0-9]{1,2}$' then (v_so #>> '{}')::int
           end;
    if v_n is null or v_n > 10 then
      raise exception 'Số gói mỗi loại phải từ 0 đến 10' using errcode = 'check_violation';
    end if;
    continue when v_n = 0;
    if v_het ? v_khoa then
      raise exception 'Có gói trong đơn vừa tạm hết, vui lòng tải lại trang và chọn lại' using errcode = 'check_violation';
    end if;
    if not (v_menu ? v_khoa) then
      raise exception 'Có gói trong đơn không còn bán, vui lòng tải lại trang và chọn lại' using errcode = 'check_violation';
    end if;
  end loop;

  -- Dòng đơn theo thứ tự menu (cùng giỏ thì cùng đơn, không theo thứ tự khách chọn).
  for r in select * from mua_thit_ve_goi('vi', v_cn.ma, false) loop
    v_khoa := r.san_pham_ma || '_' || r.so_gam;
    continue when not (v_menu ? v_khoa) or not (p_gio ? v_khoa);
    v_n := (p_gio ->> v_khoa)::int;
    continue when v_n = 0;
    -- Giá khách đã thấy phải đúng giá hiện tại (số nguyên, so theo chữ số).
    if p_gia_da_xem is null or jsonb_typeof(p_gia_da_xem) <> 'object'
       or (p_gia_da_xem ->> v_khoa) is distinct from r.gia::text then
      raise exception 'Giá vừa đổi, vui lòng tải lại trang để xem giá mới' using errcode = 'check_violation';
    end if;
    v_g := (v_menu -> v_khoa) || jsonb_build_object('so_luong', v_n, 'thanh_tien', r.gia * v_n);
    v_dong := v_dong || jsonb_build_array(v_g);
    v_tong := v_tong + r.gia * v_n;
  end loop;

  if jsonb_array_length(v_dong) = 0 then
    raise exception 'Đơn chưa có gói nào' using errcode = 'check_violation';
  end if;

  -- ---- Giới hạn tần suất cho lời gọi không phiên (khuôn tao_dat_ban, 0084) ----------------------------
  if not co_phien_dang_nhap() then
    -- Theo số điện thoại: đơn còn chờ quán gọi xác nhận. Khoá theo số trước khi đếm.
    perform pg_advisory_xact_lock(hashtext('don_mua_thit_sdt:' || v_sdt));
    select count(*) into v_dem from don_mua_thit d where d.sdt = v_sdt and d.trang_thai = 'cho_xac_nhan';
    if v_dem >= 3 then
      raise exception 'Số điện thoại này đã có nhiều đơn đang chờ quán gọi xác nhận, vui lòng gọi quán'
        using errcode = 'check_violation';
    end if;
    if p_ip is not null
       and not gioi_han_lay_luot('tao_don_mua_thit', 'ip:' || host(p_ip), 5, interval '1 hour') then
      raise exception 'Mạng bạn đang dùng đã gửi quá nhiều đơn, vui lòng thử lại sau hoặc gọi quán'
        using errcode = 'check_violation';
    end if;
    if not gioi_han_lay_luot('tao_don_mua_thit', 'cn:' || v_cn.id::text, 30, interval '1 hour') then
      raise exception 'Hệ thống đang nhận quá nhiều đơn, vui lòng thử lại sau hoặc gọi quán'
        using errcode = 'check_violation';
    end if;
  end if;

  -- 0125 · thêm năm cột hóa đơn (không chọn: false và bốn null).
  insert into don_mua_thit (ma_don, ma_gui, chi_nhanh_id, ho_ten, sdt, dia_chi, ghi_chu, dong, tam_tinh, ngon_ngu,
                            xuat_hoa_don, hoa_don_ten_don_vi, hoa_don_ma_so_thue, hoa_don_dia_chi, hoa_don_email)
  values (sinh_ma_don_mua_thit(), p_ma_gui, v_cn.id, v_ho_ten, v_sdt, v_dia_chi, v_ghi_chu, v_dong, v_tong,
          case when p_ngon_ngu in ('vi', 'en', 'ko') then p_ngon_ngu else 'vi' end,
          v_xuat_hoa_don, v_hd_ten, v_hd_ma_so_thue, v_hd_dia_chi, v_hd_email)
  returning * into v_don;

  return jsonb_build_object('ma_don', v_don.ma_don, 'tam_tinh', v_don.tam_tinh, 'da_co', false);
end;
$$;

comment on function tao_don_mua_thit(uuid, text, text, text, text, text, jsonb, jsonb, text, inet, jsonb) is
  'CÔNG KHAI (0113, hóa đơn đỏ 0125): trang Mua thịt về ghi một đơn giao tận nơi. Kênh phải mở (hien_mua_thit_ve); đơn tính ở database từ menu công khai (giá đã chốt, gói tạm hết không đặt được); giá khách đã thấy khác giá hiện tại thì không ghi. p_hoa_don null = không cần hóa đơn; object {ten_don_vi, ma_so_thue, dia_chi, email} = cần xuất hóa đơn đỏ — bắt buộc tên đơn vị, mã số thuế 10 số hoặc 10 số - 3 số, email đúng dạng. Cùng ma_gui trả lại đơn cũ. Không phiên: tối đa 3 đơn chờ mỗi số điện thoại, 5 đơn mỗi giờ mỗi IP, 30 đơn mỗi giờ mỗi chi nhánh. Trả {ma_don, tam_tinh, da_co}.';


-- =============================================================================
-- 3 · don_mua_thit_danh_sach — TRẢ THÊM NĂM CỘT HÓA ĐƠN
-- =============================================================================
-- Thân 0115 nguyên văn, thêm năm cột hóa đơn (0125). Kiểu trả về đổi nên phải drop rồi tạo lại — cùng tham số, cùng
-- quyền (mục 4). Web cũ đọc theo tên cột nên không vướng cột mới.
drop function if exists don_mua_thit_danh_sach(text);

create or replace function don_mua_thit_danh_sach(p_loc text default 'cho')
returns table (
  id          uuid,
  ma_don      text,
  created_at  timestamptz,
  updated_at  timestamptz,
  ho_ten      text,
  sdt         text,
  dia_chi     text,
  ghi_chu     text,
  dong        jsonb,
  tam_tinh    bigint,
  ngon_ngu    text,
  trang_thai  text,
  nguoi_xu_ly text,
  -- 0115 · trả tiền qua VNPay
  da_tra          bigint,
  tra_luc         timestamptz,
  ma_vnpay        text,
  so_lan_mo       int,
  khach_ve_da_tra boolean,
  -- 0125 · hóa đơn đỏ
  xuat_hoa_don       boolean,
  hoa_don_ten_don_vi text,
  hoa_don_ma_so_thue text,
  hoa_don_dia_chi    text,
  hoa_don_email      text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_loc text := case when p_loc in ('cho', 'dang', 'xong', 'tat_ca') then p_loc else 'cho' end;
begin
  if not don_mua_thit_duoc_xem() then
    raise exception 'Không có quyền xem đơn mua thịt' using errcode = 'insufficient_privilege';
  end if;
  return query
  select d.id, d.ma_don, d.created_at, d.updated_at, d.ho_ten, d.sdt, d.dia_chi, d.ghi_chu, d.dong, d.tam_tinh,
         d.ngon_ngu, d.trang_thai, ns.ho_ten,
         -- 0115 · trả tiền qua VNPay
         coalesce(tt.da_tra, 0)::bigint, tt.tra_luc, tt.ma_vnpay, coalesce(tt.so_lan_mo, 0)::int,
         coalesce(tt.khach_ve_da_tra, false),
         -- 0125 · hóa đơn đỏ
         d.xuat_hoa_don, d.hoa_don_ten_don_vi, d.hoa_don_ma_so_thue, d.hoa_don_dia_chi, d.hoa_don_email
  from don_mua_thit d
  left join nhan_su ns on ns.id = d.nguoi_xu_ly
  left join lateral (
    select sum(t.so_tien) filter (where t.trang_thai = 'da_tra') as da_tra,
           max(t.tra_luc) as tra_luc,
           (array_agg(t.ma_vnpay order by t.tra_luc desc) filter (where t.trang_thai = 'da_tra'))[1] as ma_vnpay,
           count(*) as so_lan_mo,
           bool_or(t.trang_thai = 'cho' and t.ve_ma_phan_hoi = '00') as khach_ve_da_tra
    from thanh_toan_vnpay_web t
    where t.don_id = d.id
  ) tt on true
  where d.chi_nhanh_id = any (crm_cn_duoc())
    and case v_loc
          when 'cho'  then d.trang_thai = 'cho_xac_nhan'
          when 'dang' then d.trang_thai = 'da_xac_nhan'
          when 'xong' then d.trang_thai in ('da_giao', 'da_huy') and d.created_at > now() - interval '30 days'
          else d.trang_thai in ('cho_xac_nhan', 'da_xac_nhan') or d.created_at > now() - interval '30 days'
        end
  order by d.created_at desc
  limit 200;
end;
$$;

comment on function don_mua_thit_danh_sach(text) is
  'Hộp thư đơn mua thịt website (0113, 0115 thêm trả tiền VNPay, 0125 thêm hóa đơn đỏ): chủ, quản lý, thu ngân đang làm, đơn của chi nhánh mình (crm_cn_duoc). p_loc cho | dang | xong | tat_ca. Mới nhất trước, tối đa 200. da_tra: tổng đã trả qua VNPay (lớn hơn tam_tinh = trả hai lần); khach_ve_da_tra: khách về trang kết quả với mã 00 mà VNPay chưa báo về; xuat_hoa_don và bốn cột hoa_don_*: thông tin khách điền để xuất hóa đơn đỏ.';


-- =============================================================================
-- 4 · QUYỀN
-- =============================================================================
-- Như 0113 và 0115: anon chỉ tạo đơn (tao_don_mua_thit vẫn trong DUOC_PHEP của crm/test/test-an-toan.mjs — cùng tên,
-- thêm một tham số); authenticated chỉ đọc hộp thư (hàm tự kiểm vai).
revoke execute on function tao_don_mua_thit(uuid, text, text, text, text, text, jsonb, jsonb, text, inet, jsonb) from public;
revoke execute on function don_mua_thit_danh_sach(text) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function tao_don_mua_thit(uuid, text, text, text, text, text, jsonb, jsonb, text, inet, jsonb) to anon';
    execute 'revoke execute on function don_mua_thit_danh_sach(text) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function tao_don_mua_thit(uuid, text, text, text, text, text, jsonb, jsonb, text, inet, jsonb) from authenticated';
    execute 'grant execute on function don_mua_thit_danh_sach(text) to authenticated';
  end if;
end
$$;
