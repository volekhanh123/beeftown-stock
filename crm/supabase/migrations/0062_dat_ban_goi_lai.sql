-- =============================================================================
-- BEEFTOWN CRM — 0062 · GỬI YÊU CẦU ĐẶT BÀN HAI LẦN CHỈ RA MỘT DÒNG
-- =============================================================================
-- Form hỏi bàn chặn bấm đúp bằng JavaScript bổ trợ (khóa nút "Đang gửi…"). Ba
-- đường vẫn gọi tao_dat_ban() lần hai với đúng yêu cầu cũ:
--
--   · khách tắt JavaScript, hoặc trình duyệt gửi lại POST;
--   · khách gửi lại vì mạng chập — database đã ghi xong rồi mạng mới đứt
--     (xu-ly-form.ts, messenger-anon.ts);
--   · Messenger gửi lại cùng yêu cầu sau câu "KHÔNG CHẮC đã ghi nhận".
--
-- Bản 0013 tạo dòng thứ hai: hai mã cho một khách cùng giờ, trừ chỗ hai lần,
-- trigger dat_ban_zalo (0047) xếp tin ZBS-01 hai lần, nhật ký đồng ý ghi hai lần.
--
-- TỪ BẢN NÀY: lần gọi lại Y HỆT trả lại dòng cũ — cùng dat_ban_id, cùng
-- ma_dat_ban — và không ghi gì thêm. "Y hệt" là đủ nội dung khách đã gửi:
--
--   số điện thoại (đã chuẩn hóa) · chi nhánh · ngày · giờ · số khách · dịp ·
--   ghi chú · đồng ý nhận tin
--
-- và dòng cũ còn cho_xac_nhan, tạo trong 10 phút. Ba lý do không dùng khóa ngắn
-- hơn (chỉ số điện thoại + chi nhánh + ngày + giờ):
--
--   1. Bấm đúp, F5, gửi lại sau mất mạng đều gửi y hệt — khóa đủ nội dung vẫn
--      bắt trọn.
--   2. Khách SỬA số khách / ghi chú rồi gửi lại thì ra dòng thứ hai như trước —
--      nhân viên thấy cả hai khi gọi xác nhận. Khóa ngắn sẽ nuốt mất thay đổi mà
--      vẫn trả câu "đã nhận": nói sai.
--   3. Hàm trả ma_dat_ban cho người gọi, mà mã + số điện thoại đủ để tra cứu và
--      HỦY bàn (huy_dat_ban). Khóa càng ít trường thì người chỉ biết số điện
--      thoại và giờ càng dễ lấy được mã của người khác.
--
-- CHỈ ÁP DỤNG CHO LỜI GỌI KHÔNG PHIÊN (anon) — website và Messenger luôn gọi như
-- vậy (0045, 0053). Phiên đăng nhập đi đường cũ: quy tắc 0045 trong
-- tim_hoac_tao_khach() (chỉ chủ sở hữu / quản lý / thu ngân) vẫn chặn trước khi
-- đụng tới dữ liệu khách. Tra dòng cũ TRƯỚC bước đó mà không có điều kiện này thì
-- một phiên marketing, vai kho hay tài khoản không có dòng nhan_su đọc được mã
-- đặt bàn của khách.
--
-- THỨ TỰ ĐỔI MỘT CHỖ: khóa dòng chi_nhanh (for update) dời lên ngay sau bước tìm
-- chi nhánh, trước bước kiểm ngày giờ.
--   · Hai lượt gửi chồng nhau xếp hàng ở khóa này. Ở READ COMMITTED, câu tìm dòng
--     cũ đứng sau khóa chụp ảnh mới, nên lượt sau thấy dòng lượt trước vừa ghi.
--   · Tìm dòng cũ đứng TRƯỚC kiểm ngày giờ và kiểm chỗ trống: khung giờ vừa trôi
--     qua, hay lượt đầu đã lấy bàn cuối, thì lượt gửi lại nhận đúng mã cũ — yêu
--     cầu ĐÃ được ghi — chứ không phải "đã qua" / "đã hết bàn".
-- Mọi câu raise exception giữ nguyên từng chữ (test khớp theo chữ tiếng Việt).
-- Chữ ký, tham số mặc định, cột trả về giữ nguyên — web không đổi gì.
-- Không bảng, cột, chỉ mục mới: dat_ban_lich_idx (chi_nhanh_id, ngay, gio)
-- where trang_thai in ('cho_xac_nhan', 'da_xac_nhan') phủ câu tìm.
--
-- Kiểm thử: crm/test/test-dat-ban-goi-lai.mjs.
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
begin
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

comment on function tao_dat_ban is
  'API công khai cho website và Messenger. SECURITY DEFINER. Kiểm tra chỗ trống nguyên tử và chặn khung giờ đã qua theo giờ Việt Nam. Từ 0062: lời gọi không phiên gửi lại Y HỆT (số điện thoại, chi nhánh, ngày, giờ, số khách, dịp, ghi chú, đồng ý nhận tin) trong 10 phút, khi dòng cũ còn cho_xac_nhan, nhận lại đúng dòng cũ và mã cũ — không ghi gì thêm.';


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
