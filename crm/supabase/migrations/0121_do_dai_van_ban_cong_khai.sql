-- =============================================================================
-- BEEFTOWN CRM — 0121 · GIỚI HẠN ĐỘ DÀI VĂN BẢN CỦA CÁC HÀM CÔNG KHAI
-- =============================================================================
-- LỖI (rà soát bảo mật 14/11/2026, tái hiện trên PGlite — crm/test/test-cong-khai-do-dai.mjs)
--
-- 0084 giới hạn SỐ LƯỢT gọi của các hàm công khai và ghi ở đầu file "bảng không đầy".
-- Nhưng ba hàm cũ không giới hạn ĐỘ DÀI chữ nhận vào, và ba bảng chúng ghi không có
-- ràng buộc độ dài nào:
--
--   · tao_dat_ban        — p_ho_ten, p_ghi_chu, p_dip, p_utm_*, p_trang_gioi_thieu
--   · huy_dat_ban        — p_ly_do (nối vào dat_ban.ghi_chu)
--   · nop_ho_so_ung_tuyen — p_ho_ten, p_email, p_gioi_thieu, p_kinh_nghiem, p_ca_lam_duoc,
--                           p_ten_tep, p_utm_*
--
-- Khoá anon là công khai (0084, đầu file): ai cũng gọi thẳng được ba hàm này. Trần 30 đặt
-- bàn / giờ / chi nhánh và 30 hồ sơ / giờ không ngăn mỗi lượt mang một ô chữ dài hàng chục MB:
-- database đầy dần, và trang /noi-bo/dat-ban, /noi-bo/tuyen-dung tải nguyên các ô đó của 100
-- dòng. Website có ngưỡng thân POST riêng (web/src/lib/xu-ly-form.ts) nhưng ngưỡng đó chỉ
-- che lối đi qua form. tao_don_mua_thit (0113) và ghi_su_kien_web (0084) đã giới hạn độ dài.
--
-- ĐỔI GÌ
--
--   1. tao_dat_ban — thân 0084 nguyên văn, thêm một khối ở đầu: họ tên quá 120, ghi chú quá
--      500, dịp quá 100 ký tự thì từ chối bằng câu rõ ràng; utm cắt còn 100, trang giới thiệu
--      cắt còn 300 ký tự (khách không gõ các ô đó — cắt như ghi_su_kien_web, không làm mất yêu cầu).
--   2. huy_dat_ban — thân 0084 nguyên văn, chỉ đổi câu ghi chú: lý do giữ 300 ký tự đầu, ghi chú
--      cũ nhường chỗ để cả câu không quá 1000 ký tự. Khách luôn hủy được, dấu "Khách tự huỷ"
--      không bao giờ bị cắt.
--   3. nop_ho_so_ung_tuyen — thân 0086 nguyên văn, thêm một khối SAU khối 0026 (trường tin không
--      hỏi đã thành null, không tính): họ tên quá 120, email quá 200, giới thiệu / kinh nghiệm quá
--      4000 ký tự thì từ chối; quá 20 ca, ca dài, tên tệp CV quá 200 ký tự thì dùng câu chung của
--      bẫy bot (form dựng các ô này, người nộp không gõ); utm cắt còn 100.
--   4. Ràng buộc MỚI trên ba bảng (dat_ban_chu_ngan, khach_hang_chu_ngan, ho_so_chu_ngan): chặn
--      mọi đường ghi khác — nhân viên sửa qua policy, hàm viết sau này.
--
-- VÌ SAO HÀM CHẶT HƠN BẢNG
--
--   Ô              Hàm (khách gửi)     Bảng (mọi đường ghi)
--   họ tên         120                 200
--   ghi chú        500 (không đếm \r)  1000
--   dịp            100                 200
--   utm            cắt còn 100         300
--   trang g.thiệu  cắt còn 300         1000
--   email          200                 320
--   giới thiệu,    4000 (không đếm \r) 8000
--   kinh nghiệm
--   ca làm         20 ca, gộp ≤ 400    20 ca, gộp ≤ 1000
--   tên tệp CV     200                 đường dẫn CV ≤ 400
--
-- Ghi chú 500 ký tự người gõ có thể thành gần 1000 ký tự khi mỗi lần xuống dòng mang thêm \r,
-- và huy_dat_ban còn nối "· Khách tự huỷ: <lý do>" — nên trần của bảng phải rộng hơn trần của
-- hàm, không thì một yêu cầu hợp lệ không hủy được. Ghi chú KHÔNG bị chuẩn hoá khi lưu: bước
-- "gửi lại y hệt" của 0062 so từng ký tự (test-dat-ban-goi-lai.mjs). Giới hạn 120 và 500 trùng
-- với tao_don_mua_thit (0113); các số còn lại là lựa chọn của bản này — đổi thì đổi cả bảng trên.
--
-- CÂU MỚI (web dịch ở web/src/lib/chu.ts cho trang en / ko, web/src/lib/cau-noi-bo.ts cho nội bộ):
--   'Dịp dài quá 100 ký tự' · 'Email dài quá 200 ký tự' · 'Phần giới thiệu dài quá 4000 ký tự' ·
--   'Phần kinh nghiệm dài quá 4000 ký tự'. 'Họ tên dài quá 120 ký tự' và 'Ghi chú dài quá 500 ký tự'
--   đã có từ 0113. Câu raise exception cũ giữ nguyên từng chữ.
--
-- DỮ LIỆU CŨ: ràng buộc mới kiểm cả dòng đã có (không "not valid" — xem 0086: dòng cũ vượt giới
-- hạn sẽ không sửa được trạng thái nữa, khách không hủy được, hồ sơ không ẩn danh được). Khối đầu
-- file đếm trước; có dòng vượt thì DỪNG trước khi đổi bất cứ thứ gì và nói rõ bảng nào. Khi đó hỏi
-- Khánh: xem các dòng đó (nhiều khả năng là rác do gọi thẳng API), rồi cắt ngắn hoặc nâng trần —
-- đừng tự thêm "not valid". Đếm tay trước khi chạy:
--
--     select count(*) from dat_ban where char_length(coalesce(ghi_chu, '')) > 1000
--        or char_length(coalesce(dip, '')) > 200 or char_length(coalesce(trang_gioi_thieu, '')) > 1000
--        or greatest(char_length(coalesce(utm_source, '')), char_length(coalesce(utm_medium, '')),
--                    char_length(coalesce(utm_campaign, ''))) > 300;
--     select count(*) from khach_hang where char_length(coalesce(ho_ten, '')) > 200
--        or greatest(char_length(coalesce(nguon_utm_source, '')), char_length(coalesce(nguon_utm_medium, '')),
--                    char_length(coalesce(nguon_utm_campaign, ''))) > 300;
--     select count(*) from ho_so_ung_tuyen where char_length(coalesce(ho_ten, '')) > 200
--        or char_length(coalesce(email, '')) > 320 or char_length(coalesce(gioi_thieu, '')) > 8000
--        or char_length(coalesce(kinh_nghiem, '')) > 8000 or coalesce(cardinality(ca_lam_duoc), 0) > 20
--        or char_length(coalesce(array_to_string(ca_lam_duoc, ',', ''), '')) > 1000
--        or char_length(coalesce(duong_dan_cv, '')) > 400
--        or greatest(char_length(coalesce(nguon_utm_source, '')), char_length(coalesce(nguon_utm_campaign, ''))) > 300;
--
-- KHÔNG ĐỔI chữ ký, tham số mặc định, kiểu trả về, security definer, search_path của hàm nào.
-- Không hàm mới. create or replace giữ nguyên quyền đã cấp (anon gọi được cả ba — DUOC_PHEP của
-- crm/test/test-an-toan.mjs), nên file này không có khối chốt quyền.
--
-- Kiểm thử: crm/test/test-cong-khai-do-dai.mjs.
-- =============================================================================


-- =============================================================================
-- 0 · DỮ LIỆU CŨ — có dòng vượt trần thì dừng trước khi đổi gì
-- =============================================================================
do $$
declare
  v_dat   bigint;
  v_khach bigint;
  v_ho_so bigint;
begin
  select count(*) into v_dat from dat_ban
   where char_length(coalesce(ghi_chu, '')) > 1000
      or char_length(coalesce(dip, '')) > 200
      or char_length(coalesce(trang_gioi_thieu, '')) > 1000
      or greatest(char_length(coalesce(utm_source, '')), char_length(coalesce(utm_medium, '')),
                  char_length(coalesce(utm_campaign, ''))) > 300;
  select count(*) into v_khach from khach_hang
   where char_length(coalesce(ho_ten, '')) > 200
      or greatest(char_length(coalesce(nguon_utm_source, '')), char_length(coalesce(nguon_utm_medium, '')),
                  char_length(coalesce(nguon_utm_campaign, ''))) > 300;
  select count(*) into v_ho_so from ho_so_ung_tuyen
   where char_length(coalesce(ho_ten, '')) > 200
      or char_length(coalesce(email, '')) > 320
      or char_length(coalesce(gioi_thieu, '')) > 8000
      or char_length(coalesce(kinh_nghiem, '')) > 8000
      or coalesce(cardinality(ca_lam_duoc), 0) > 20
      or char_length(coalesce(array_to_string(ca_lam_duoc, ',', ''), '')) > 1000
      or char_length(coalesce(duong_dan_cv, '')) > 400
      or greatest(char_length(coalesce(nguon_utm_source, '')), char_length(coalesce(nguon_utm_campaign, ''))) > 300;

  if v_dat + v_khach + v_ho_so > 0 then
    raise exception '0121 DỪNG: % đặt bàn, % khách, % hồ sơ đang có ô chữ vượt trần mới. Chưa đổi gì. Xem mục DỮ LIỆU CŨ ở đầu file rồi hỏi Khánh.',
      v_dat, v_khach, v_ho_so;
  end if;
end
$$;


-- =============================================================================
-- 1 · ĐẶT BÀN — thân 0084_gioi_han_cong_khai nguyên văn, thêm khối 0121 ở đầu
-- =============================================================================
create or replace function tao_dat_ban(
  p_chi_nhanh_ma text,
  p_sdt          text,
  p_ho_ten       text,
  p_ngay         date,
  p_gio          time,
  p_so_khach     smallint,
  p_dip          text default null,
  p_ghi_chu      text default null,
  p_dong_y       boolean default false,
  p_utm_source   text default null,
  p_utm_medium   text default null,
  p_utm_campaign text default null,
  p_trang_gioi_thieu text default null,
  p_ip           inet default null
)
returns table (
  dat_ban_id uuid,
  ma_dat_ban text,
  con_trong  integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cn     chi_nhanh;
  v_khach  khach_hang;
  v_trong  integer;
  v_dat    dat_ban;
  v_sdt    text;
  v_dem    integer;
begin
  -- ---- 0121 · Giới hạn độ dài chữ — đứng đầu, cho mọi người gọi (website, Messenger, nhân viên ghi hộ) ----
  -- Ghi chú không đếm \r: trình duyệt đếm một lần xuống dòng là 1 ký tự nhưng gửi lên \r\n.
  if char_length(coalesce(p_ho_ten, '')) > 120 then
    raise exception 'Họ tên dài quá 120 ký tự' using errcode = 'check_violation';
  end if;
  if char_length(replace(coalesce(p_ghi_chu, ''), E'\r', '')) > 500 then
    raise exception 'Ghi chú dài quá 500 ký tự' using errcode = 'check_violation';
  end if;
  if char_length(coalesce(p_dip, '')) > 100 then
    raise exception 'Dịp dài quá 100 ký tự' using errcode = 'check_violation';
  end if;
  -- utm và trang giới thiệu do trình duyệt tự gắn, khách không gõ: cắt như ghi_su_kien_web (0084) —
  -- không vì một đường dẫn dài mà mất yêu cầu của khách.
  p_utm_source       := left(p_utm_source, 100);
  p_utm_medium       := left(p_utm_medium, 100);
  p_utm_campaign     := left(p_utm_campaign, 100);
  p_trang_gioi_thieu := left(p_trang_gioi_thieu, 300);
  -- ---- Hết phần 0121 — từ đây là nguyên văn 0084 ---------------------------------------------

  if not cong_tac_bat('form_dat_ban_dang_mo') then
    raise exception 'Form đặt bàn đang tạm đóng'
      using errcode = 'check_violation';
  end if;

  select * into v_cn from chi_nhanh
  where lower(ma) = lower(p_chi_nhanh_ma) and dang_hoat_dong;
  if not found then
    raise exception 'Không tìm thấy chi nhánh %', p_chi_nhanh_ma
      using errcode = 'foreign_key_violation';
  end if;

  -- 0062: dời lên từ sau bước kiểm ngày giờ — hai lượt gửi chồng nhau xếp hàng
  -- ở đây, lượt sau thấy dòng lượt trước vừa ghi.
  perform 1 from chi_nhanh where id = v_cn.id for update;

  -- ---- 0062 · Gửi lại y hệt trong 10 phút → trả lại dòng cũ ---------------
  if not co_phien_dang_nhap() then
    select d.* into v_dat
    from dat_ban d
    join khach_hang k on k.id = d.khach_hang_id
    where d.chi_nhanh_id = v_cn.id
      and d.ngay = p_ngay
      and d.gio = p_gio
      and d.trang_thai = 'cho_xac_nhan'
      and d.created_at > now() - interval '10 minutes'
      and k.sdt = chuan_hoa_sdt(p_sdt)
      and d.so_khach = p_so_khach
      and d.dip is not distinct from p_dip
      and d.ghi_chu is not distinct from p_ghi_chu
      and d.dong_y_nhan_tin = p_dong_y
    order by d.created_at desc
    limit 1;

    if found then
      return query
      select v_dat.id, v_dat.ma_dat_ban,
             so_ban_con_trong(v_cn.id, p_ngay, p_gio);
      return;
    end if;
  end if;
  -- ---- Hết phần 0062 — từ đây là nguyên văn 0013 --------------------------

  if p_ngay < hom_nay_vn() then
    raise exception 'Không thể đặt bàn cho ngày trong quá khứ'
      using errcode = 'check_violation';
  end if;

  if p_ngay = hom_nay_vn() and p_gio <= gio_vn() then
    raise exception 'Khung giờ % hôm nay đã qua', p_gio
      using errcode = 'check_violation';
  end if;

  v_trong := so_ban_con_trong(v_cn.id, p_ngay, p_gio);
  if v_trong <= 0 then
    raise exception 'Khung giờ % ngày % đã hết bàn', p_gio, p_ngay
      using errcode = 'check_violation';
  end if;

  -- ---- 0084 · Giới hạn tần suất cho lời gọi không phiên ---------------------
  -- Đứng sau mọi bước kiểm: yêu cầu sai (ngày qua, hết bàn) nhận đúng câu của
  -- nó và không tốn lượt. Lượt lấy ở đây hủy theo nếu bước sau ném lỗi.
  if not co_phien_dang_nhap() then
    v_sdt := chuan_hoa_sdt(p_sdt);

    -- Theo số điện thoại: yêu cầu còn chờ xác nhận, từ hôm nay trở đi. Khoá
    -- theo số trước khi đếm — hai lượt cùng số ở hai chi nhánh không cùng lọt.
    if v_sdt is not null then
      perform pg_advisory_xact_lock(hashtext('dat_ban_sdt:' || v_sdt));
      select count(*) into v_dem
      from dat_ban d
      join khach_hang k on k.id = d.khach_hang_id
      where k.sdt = v_sdt
        and d.trang_thai = 'cho_xac_nhan'
        and d.ngay >= hom_nay_vn();
      if v_dem >= 3 then
        raise exception 'Số điện thoại này đã có nhiều yêu cầu đặt bàn đang chờ nhà hàng xác nhận, vui lòng gọi nhà hàng'
          using errcode = 'check_violation';
      end if;
    end if;

    -- Theo IP. p_ip do người gọi truyền — lớp mỏng. Null (bot Messenger) không
    -- có xô riêng: xem đầu file.
    if p_ip is not null
       and not gioi_han_lay_luot('tao_dat_ban', 'ip:' || host(p_ip), 5, interval '1 hour') then
      raise exception 'Mạng bạn đang dùng đã gửi quá nhiều yêu cầu đặt bàn, vui lòng thử lại sau hoặc gọi nhà hàng'
        using errcode = 'check_violation';
    end if;

    -- Theo chi nhánh: lớp kẻ gọi thẳng không lách được.
    if not gioi_han_lay_luot('tao_dat_ban', 'cn:' || v_cn.id::text, 30, interval '1 hour') then
      raise exception 'Hệ thống đang nhận quá nhiều yêu cầu, vui lòng thử lại sau hoặc liên hệ trực tiếp với nhà hàng'
        using errcode = 'check_violation';
    end if;
  end if;
  -- ---- Hết phần 0084 -----------------------------------------------------------

  v_khach := tim_hoac_tao_khach(p_sdt, p_ho_ten, v_cn.id,
                                p_utm_source, p_utm_medium, p_utm_campaign);

  insert into dat_ban (chi_nhanh_id, khach_hang_id, ngay, gio, so_khach,
                       dip, ghi_chu, dong_y_nhan_tin, ma_dat_ban,
                       utm_source, utm_medium, utm_campaign, trang_gioi_thieu)
  values (v_cn.id, v_khach.id, p_ngay, p_gio, p_so_khach,
          p_dip, p_ghi_chu, p_dong_y, sinh_ma_dat_ban(),
          p_utm_source, p_utm_medium, p_utm_campaign, p_trang_gioi_thieu)
  returning * into v_dat;

  if p_dong_y then
    insert into nhat_ky_dong_y (khach_hang_id, dong_y, kenh, noi_dung, ip)
    values (v_khach.id, true, 'web',
            'Tôi đồng ý để Beeftown liên hệ xác nhận đặt bàn và gửi thông tin ưu đãi qua số điện thoại này. Có thể huỷ nhận tin bất cứ lúc nào.',
            p_ip);
  end if;

  return query
  select v_dat.id, v_dat.ma_dat_ban,
         so_ban_con_trong(v_cn.id, p_ngay, p_gio);
end;
$$;


-- =============================================================================
-- 2 · HỦY ĐẶT BÀN — thân 0084_gioi_han_cong_khai nguyên văn, chỉ đổi câu ghi chú
-- =============================================================================
create or replace function huy_dat_ban(
  p_ma    text,
  p_sdt   text,
  p_ly_do text default null,
  p_ip    inet default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dat dat_ban;
  v_sdt text;
  v_bam text;
  v_cau text;   -- 0121
begin
  v_sdt := chuan_hoa_sdt(p_sdt);
  v_bam := case when v_sdt is null then null else md5(v_sdt) end;

  -- 0084: hủy là một đường tra mã — cùng khoá, cùng sổ với tra_cuu_dat_ban.
  perform kiem_khoa_tra_cuu(p_ip, v_bam);

  select d.* into v_dat
  from dat_ban d
  join khach_hang k on k.id = d.khach_hang_id
  where upper(d.ma_dat_ban) = upper(btrim(p_ma))
    and k.sdt = v_sdt
    and d.ngay >= hom_nay_vn()
  for update;

  if not found then
    perform ghi_lan_tra_cuu(p_ip, p_ma, false, v_bam);
    return false;
  end if;

  if v_dat.trang_thai in ('da_den', 'khong_den', 'da_huy') then
    raise exception 'Đặt bàn này không huỷ được nữa, vui lòng gọi nhà hàng'
      using errcode = 'check_violation';
  end if;

  -- 0121 · Lý do hủy giữ 300 ký tự đầu. Ghi chú cũ nhường chỗ để cả câu không quá 1000 ký tự
  -- (ràng buộc dat_ban_chu_ngan) — dấu "Khách tự huỷ" không bao giờ bị cắt, và khách luôn hủy được.
  v_cau := 'Khách tự huỷ' || coalesce(': ' || left(p_ly_do, 300), '');
  update dat_ban
  set trang_thai = 'da_huy',
      ghi_chu = coalesce(left(ghi_chu, 1000 - 3 - char_length(v_cau)) || ' · ', '') || v_cau
  where id = v_dat.id;

  perform ghi_lan_tra_cuu(p_ip, p_ma, true, v_bam);
  return true;
end;
$$;


-- =============================================================================
-- 3 · NỘP HỒ SƠ — thân 0086_ho_so_sdt_bat_buoc nguyên văn, thêm khối 0121 sau khối 0026
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

  -- ---- 0121 · Giới hạn độ dài chữ — SAU khối 0026: trường tin không hỏi đã thành null, không tính ----
  -- Giới thiệu, kinh nghiệm không đếm \r (như ghi chú đặt bàn).
  if char_length(btrim(coalesce(p_ho_ten, ''))) > 120 then
    raise exception 'Họ tên dài quá 120 ký tự' using errcode = 'check_violation';
  end if;
  if char_length(btrim(coalesce(p_email, ''))) > 200 then
    raise exception 'Email dài quá 200 ký tự' using errcode = 'check_violation';
  end if;
  if char_length(replace(coalesce(p_gioi_thieu, ''), E'\r', '')) > 4000 then
    raise exception 'Phần giới thiệu dài quá 4000 ký tự' using errcode = 'check_violation';
  end if;
  if char_length(replace(coalesce(p_kinh_nghiem, ''), E'\r', '')) > 4000 then
    raise exception 'Phần kinh nghiệm dài quá 4000 ký tự' using errcode = 'check_violation';
  end if;
  -- Ca làm và tên tệp do form dựng, người nộp không gõ: vượt là lời gọi không qua form — câu chung như bẫy bot.
  if coalesce(cardinality(p_ca_lam_duoc), 0) > 20
     or char_length(coalesce(array_to_string(p_ca_lam_duoc, ',', ''), '')) > 400
     or char_length(coalesce(p_ten_tep, '')) > 200 then
    raise exception 'Không gửi được hồ sơ, vui lòng thử lại' using errcode = 'check_violation';
  end if;
  p_utm_source   := left(p_utm_source, 100);
  p_utm_campaign := left(p_utm_campaign, 100);
  -- ---- Hết phần 0121 — từ đây là nguyên văn 0086 ---------------------------------------------

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
-- 4 · RÀNG BUỘC — trần độ dài cho mọi đường ghi vào ba bảng
-- =============================================================================
-- Rộng hơn trần của hàm một bậc (bảng ở đầu file). Kiểm cả dòng đã có: khối 0 đã đếm trước.
alter table dat_ban
  add constraint dat_ban_chu_ngan check (
        char_length(coalesce(ghi_chu, '')) <= 1000
    and char_length(coalesce(dip, '')) <= 200
    and char_length(coalesce(utm_source, '')) <= 300
    and char_length(coalesce(utm_medium, '')) <= 300
    and char_length(coalesce(utm_campaign, '')) <= 300
    and char_length(coalesce(trang_gioi_thieu, '')) <= 1000);

comment on constraint dat_ban_chu_ngan on dat_ban is
  'Trần độ dài các ô chữ của đặt bàn (0121): ghi chú 1000, dịp 200, utm 300, trang giới thiệu 1000 ký tự. tao_dat_ban chặt hơn (500 / 100 / cắt 100 / cắt 300).';

alter table khach_hang
  add constraint khach_hang_chu_ngan check (
        char_length(coalesce(ho_ten, '')) <= 200
    and char_length(coalesce(nguon_utm_source, '')) <= 300
    and char_length(coalesce(nguon_utm_medium, '')) <= 300
    and char_length(coalesce(nguon_utm_campaign, '')) <= 300);

comment on constraint khach_hang_chu_ngan on khach_hang is
  'Trần độ dài họ tên (200) và nguồn utm (300 ký tự) của hồ sơ khách (0121). tao_dat_ban chặt hơn (120 / cắt 100).';

-- Số ca kiểm bằng cardinality: array_to_string bỏ qua phần tử null, nên một mảng toàn null dài tuỳ ý
-- vẫn ra chuỗi rỗng.
alter table ho_so_ung_tuyen
  add constraint ho_so_chu_ngan check (
        char_length(coalesce(ho_ten, '')) <= 200
    and char_length(coalesce(email, '')) <= 320
    and char_length(coalesce(gioi_thieu, '')) <= 8000
    and char_length(coalesce(kinh_nghiem, '')) <= 8000
    and coalesce(cardinality(ca_lam_duoc), 0) <= 20
    and char_length(coalesce(array_to_string(ca_lam_duoc, ',', ''), '')) <= 1000
    and char_length(coalesce(duong_dan_cv, '')) <= 400
    and char_length(coalesce(nguon_utm_source, '')) <= 300
    and char_length(coalesce(nguon_utm_campaign, '')) <= 300);

comment on constraint ho_so_chu_ngan on ho_so_ung_tuyen is
  'Trần độ dài các ô chữ của hồ sơ ứng tuyển (0121): họ tên 200, email 320, giới thiệu / kinh nghiệm 8000, 20 ca, đường dẫn CV 400, utm 300 ký tự. nop_ho_so_ung_tuyen chặt hơn.';
