-- =============================================================================
-- BEEFTOWN — 0072 · LƯỢT BÁO ĐỘNG 5 PHÚT DỌN BỐN BẢNG NHẬT KÝ PHÌNH MÃI ·
--                   CHỈ MỤC MỐC CỦA nhat_ky_tin
-- =============================================================================
-- Rà soát nợ kỹ thuật 11/10/2026.
--
-- 1 · Bốn bảng không bao giờ được dọn:
--       kho_ipos_lan_chay  mỗi chi nhánh 288 lượt cron mỗi ngày (0037, 0042)
--       kho_may_nhat_ky    mỗi lần gõ PIN trên máy tính bảng dùng chung (0034)
--       nhat_ky_tra_cuu    IP người tra / hủy đặt bàn — dữ liệu cá nhân (0013)
--       nhat_ky_tin        mọi tin Zalo, có SĐT và nội dung (0006, 0047)
--     0060 đã dọn bao_dong_su_co trong bao_dong_bat_dau_luot (Worker gọi 5 phút
--     một lần). Gắn thêm don_nhat_ky_qua_han() ngay sau dòng đó. Hạn giữ:
--       nhat_ky_tra_cuu    30 ngày   giới hạn tra cứu theo IP chỉ nhìn 15 phút
--       kho_may_nhat_ky   180 ngày   khóa PIN chỉ đếm 30 phút / 24 giờ
--       kho_ipos_lan_chay  90 ngày   GIỮ 10 lượt mới nhất mỗi chi nhánh (màn Kết
--                                    nối iPOS liệt kê 10) và lượt cron tự chạy xong
--                                    gần nhất (ô cron_cuoi — nhịp tim của đèn iPOS)
--       nhat_ky_tin       400 ngày   theo mốc coalesce(gui_luc, gui_sau, created_at)
--                                    (như đèn tin Zalo); KHÔNG BAO GIỜ xóa tin
--                                    cho_gui. Trần tin chăm sóc chỉ đếm tháng này;
--                                    số tin của chiến dịch quá 400 ngày giảm theo.
--     Tối đa 5.000 dòng mỗi bảng mỗi lượt: lượt đầu trên database lâu năm không
--     vượt statement_timeout (8 giây); phần còn lại các lượt sau dọn tiếp.
--     Không có khóa ngoại nào trỏ vào bốn bảng này.
--
--     Không thêm đèn sức khỏe mới: việc dọn chạy TRONG lượt báo động — hỏng thì
--     cả lượt hỏng, đèn "Báo động" (lan_chay_cuoi) đã có báo. Worker báo động
--     chưa cài (chưa có tài khoản may_bao_dong) thì không dọn — đèn đó cũng báo.
--
-- 2 · suc_khoe_so_lieu (0063), chạy mỗi lượt báo động và mỗi lần mở /noi-bo,
--     lọc nhat_ky_tin bằng `chi_nhanh_id = … and (ket_qua = 'cho_gui' or
--     coalesce(gui_luc, gui_sau, created_at) > now() - 24 giờ)` — không chỉ mục
--     nào khớp vế sau, nên quét cả bảng tin. Chỉ mục trên đúng biểu thức đó
--     (nhat_ky_tin_moc_idx) cho planner ghép (BitmapOr) với nhat_ky_tin_cho_gui_idx;
--     việc dọn ở mục 1 cũng đi qua nó.
--
-- bao_dong_bat_dau_luot: thân 0060 NGUYÊN VĂN, thêm đúng một dòng "0072".
-- Kiểm thử: test-bao-dong-don-nhat-ky.mjs, test-kho-chi-muc-tra-nguoc.mjs mục 2.
-- =============================================================================


-- =============================================================================
-- 1 · Chỉ mục mốc của nhat_ky_tin
-- =============================================================================
create index if not exists nhat_ky_tin_moc_idx
  on nhat_ky_tin ((coalesce(gui_luc, gui_sau, created_at)));


-- =============================================================================
-- 2 · don_nhat_ky_qua_han() — NỘI BỘ, chỉ lượt báo động gọi
-- =============================================================================
create or replace function don_nhat_ky_qua_han()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_tra_cuu int;
  v_may     int;
  v_ipos    int;
  v_tin     int;
begin
  with xoa as (
    delete from nhat_ky_tra_cuu where id in (
      select id from nhat_ky_tra_cuu
      where created_at < now() - interval '30 days'
      order by created_at limit 5000)
    returning 1)
  select count(*) into v_tra_cuu from xoa;

  with xoa as (
    delete from kho_may_nhat_ky where id in (
      select id from kho_may_nhat_ky
      where luc < now() - interval '180 days'
      order by luc limit 5000)
    returning 1)
  select count(*) into v_may from xoa;

  with giu as (
    -- 10 lượt mới nhất mỗi chi nhánh (kho_ipos_trang_thai_goc liệt kê 10)
    select l.id
    from chi_nhanh c
    cross join lateral (
      select id from kho_ipos_lan_chay
      where chi_nhanh_id = c.id
      order by bat_dau_luc desc limit 10) l
    union
    -- lượt cron tự chạy xong gần nhất — đúng điều kiện ô cron_cuoi của suc_khoe_so_lieu
    select l.id
    from chi_nhanh c
    cross join lateral (
      select id from kho_ipos_lan_chay x
      where x.chi_nhanh_id = c.id and x.nguon = 'cron'
        and x.ket_thuc_luc is not null
        and x.ket_thuc_luc < x.bat_dau_luc + interval '10 minutes'
      order by x.bat_dau_luc desc limit 1) l
  ), xoa as (
    delete from kho_ipos_lan_chay where id in (
      select l.id from kho_ipos_lan_chay l
      where l.bat_dau_luc < now() - interval '90 days'
        and not exists (select 1 from giu where giu.id = l.id)
      order by l.bat_dau_luc limit 5000)
    returning 1)
  select count(*) into v_ipos from xoa;

  with xoa as (
    delete from nhat_ky_tin where id in (
      select id from nhat_ky_tin
      where coalesce(gui_luc, gui_sau, created_at) < now() - interval '400 days'
        and ket_qua <> 'cho_gui'
      order by coalesce(gui_luc, gui_sau, created_at) limit 5000)
    returning 1)
  select count(*) into v_tin from xoa;

  return jsonb_build_object('nhat_ky_tra_cuu', v_tra_cuu, 'kho_may_nhat_ky', v_may,
                            'kho_ipos_lan_chay', v_ipos, 'nhat_ky_tin', v_tin);
end;
$$;

comment on function don_nhat_ky_qua_han() is
  'NỘI BỘ (0072): dọn nhat_ky_tra_cuu > 30 ngày, kho_may_nhat_ky > 180 ngày, kho_ipos_lan_chay > 90 ngày (giữ 10 lượt mới nhất và lượt cron xong gần nhất mỗi chi nhánh), nhat_ky_tin > 400 ngày (trừ cho_gui); tối đa 5.000 dòng mỗi bảng. Chỉ bao_dong_bat_dau_luot() gọi. Trả số dòng đã xóa từng bảng.';


-- =============================================================================
-- 3 · bao_dong_bat_dau_luot — chép 0060, thêm lời gọi dọn
-- =============================================================================
create or replace function bao_dong_bat_dau_luot(p_kenh text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_tt   bao_dong_trang_thai;
  v_luot uuid;
  v_ids  uuid[];
  v_so   jsonb;
  v_loi  text;
  v_bao  jsonb;
  v_lech jsonb;
begin
  if not co_vai_tro(array['may_bao_dong']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy báo động mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;
  if p_kenh is null or p_kenh !~ '^[a-z_]{1,20}$' then
    raise exception 'Tên kênh báo động không hợp lệ' using errcode = 'check_violation';
  end if;

  select * into v_tt from bao_dong_trang_thai where id = 1 for update;
  if v_tt.dang_chay_tu is not null and v_tt.dang_chay_tu > now() - interval '10 minutes' then
    return jsonb_build_object('bi_khoa', true, 'dang_chay_tu', v_tt.dang_chay_tu);
  end if;

  v_luot := gen_random_uuid();
  update bao_dong_trang_thai
     set dang_chay_tu = now(),
         luot         = v_luot,
         kenh_tu_luc  = case when kenh is distinct from p_kenh then now() else kenh_tu_luc end,
         kenh         = p_kenh
   where id = 1
  returning * into v_tt;

  delete from bao_dong_su_co where het_luc < now() - interval '90 days';
  -- 0072: bốn bảng nhật ký phình mãi — tối đa 5.000 dòng mỗi bảng mỗi lượt.
  perform don_nhat_ky_qua_han();

  -- Đọc hỏng → so_lieu null + câu lỗi, KHÔNG ném: lượt vẫn chạy để Worker ghi đèn giả doc_so_lieu.
  -- "when others" không bắt query_canceled — mà statement_timeout của Supabase (8 giây cho vai
  -- authenticated) báo đúng mã đó khi sổ kho lớn; nên bắt riêng.
  begin
    select coalesce(array_agg(c.id), '{}'::uuid[]) into v_ids from chi_nhanh c where c.dang_hoat_dong;
    v_lech := v_tt.so_kho_lech;
    if v_lech is null or v_tt.so_kho_luc is null or v_tt.so_kho_luc <= now() - interval '30 minutes' then
      v_lech := suc_khoe_lech_so_kho();
      update bao_dong_trang_thai set so_kho_lech = v_lech, so_kho_luc = now() where id = 1;
    end if;
    -- Số liệu sao lưu gắn thêm như trang /noi-bo gắn (docSucKhoeVaSaoLuu): cùng đèn, cùng ngưỡng.
    v_so := suc_khoe_so_lieu(v_ids, v_lech) || jsonb_build_object('sao_luu', suc_khoe_sao_luu_so_lieu());
  exception
    when query_canceled then
      v_so  := null;
      v_loi := bao_dong_sach_loi(sqlerrm);
    when others then
      v_so  := null;
      v_loi := bao_dong_sach_loi(sqlerrm);
  end;

  select coalesce(jsonb_agg(jsonb_build_object('khoa', s.khoa, 'bao_mo_luc', s.bao_mo_luc)
                            order by s.bao_mo_luc), '[]'::jsonb)
    into v_bao
  from bao_dong_su_co s
  where s.bao_mo_luc > now() - interval '48 hours';

  return jsonb_build_object(
    'bi_khoa', false,
    'luot', v_luot,
    'so_lieu', v_so,
    'loi_so_lieu', v_loi,
    'trang_thai', jsonb_build_object(
      'kenh',          v_tt.kenh,
      'kenh_tu_luc',   v_tt.kenh_tu_luc,
      'tom_tat_luc',   v_tt.tom_tat_luc,
      'lan_chay_cuoi', v_tt.lan_chay_cuoi),
    'da_bao_48_gio', v_bao);
end;
$$;

comment on function bao_dong_bat_dau_luot(text) is
  'Máy báo động (0060): bắt đầu lượt. {bi_khoa:true, dang_chay_tu} nếu lượt khác đang chạy (dưới 10 phút); không thì {bi_khoa:false, luot, so_lieu|null (số liệu bảng sức khỏe + ô sao_luu), loi_so_lieu, trang_thai{kenh, kenh_tu_luc, tom_tat_luc, lan_chay_cuoi}, da_bao_48_gio[{khoa, bao_mo_luc}]}. Ghi kênh Worker đang dùng; dọn sự cố đóng quá 90 ngày và bốn bảng nhật ký quá hạn (don_nhat_ky_qua_han, 0072).';


-- =============================================================================
-- 4 · Hàm nội bộ — rút khỏi authenticated (như 0047 mục 12, 0063 mục 5)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function don_nhat_ky_qua_han() from authenticated';
  end if;
end
$$;


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6. Giữ dòng ve_con_hieu_luc: xem 0025.
-- don_nhat_ky_qua_han() mới: anon và PUBLIC thu ở đây; authenticated thu ở mục 4.
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
