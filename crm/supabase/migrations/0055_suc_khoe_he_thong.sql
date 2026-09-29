-- =============================================================================
-- BEEFTOWN — 0055 · SỨC KHỎE HỆ THỐNG
-- =============================================================================
--
-- MỘT hàm đọc cho bảng đèn xanh / vàng / đỏ ở trang Tổng quan (/noi-bo): chủ và quản lý
-- thấy ngay phần nào đang hỏng, thay vì đợi khách báo. Trước đây mỗi thứ nằm ở một màn
-- riêng (Kết nối iPOS, Zalo, Messenger, hộp thư đặt bàn, hồ sơ ứng tuyển) — hoặc chỉ nằm
-- trong log của Worker: việc chạy nền 5 phút dừng vì mất khóa bí mật sau một lần deploy
-- thì không ai thấy.
--
-- Hàm chỉ trả SỐ LIỆU — số đếm và mốc giờ. Màu đèn và câu hai thứ tiếng do web quyết
-- (web/src/lib/suc-khoe.ts): ngưỡng đổi được mà không cần migration, và kiểm được bằng dữ
-- liệu giả (crm/test/test-suc-khoe-web.mjs). Không trả dữ liệu cá nhân, không trả câu lỗi
-- thô (câu lỗi có thể mang SĐT khách) — chi tiết xem ở màn riêng của từng phần.
--
-- Ai đọc được: chủ sở hữu (mọi chi nhánh) và quản lý (chi nhánh của mình). Vai khác, người
-- đã nghỉ, tài khoản máy, anon → insufficient_privilege. Kiểm ở crm/test/test-suc-khoe.mjs.
--
-- Nguồn — không bảng mới, không cột mới:
--   iPOS        kho_ipos_trang_thai(): đèn GIỐNG HỆT màn Kết nối iPOS. Thêm nhịp tim của
--               việc chạy nền: lượt cron gần nhất (kho_ipos_lan_chay.nguon = 'cron' — cron
--               ghi một lượt mỗi 5 phút khi iPOS đã bật và cấu hình đủ).
--   Zalo        zalo_cau_hinh (cả thương hiệu): bật, chế độ, lượt gửi gần nhất (nhịp tim —
--               zalo_ket_thuc_luot ghi mỗi lượt khi Zalo bật), lượt đó có lỗi không.
--               nhat_ky_tin (theo chi nhánh): tin hỏng / bị từ chối trong 24 giờ; tin giao
--               dịch đến hạn quá 30 phút mà vẫn chờ gửi (bộ gửi chạy 5 phút một lần; tin chăm
--               sóc chờ khung giờ là bình thường nên không tính).
--   Messenger   mess_cau_hinh, mess_thong_ke_ngay: bật, lỗi gần nhất lúc nào, số lỗi 7 ngày.
--   Bản dịch    v_viec_dich: ô chờ dịch; ô dịch lỗi đã quá 15 phút (máy dịch đang hỏng).
--   Đặt bàn     dat_ban 'cho_xac_nhan': chờ quá 2 giờ, quá 24 giờ, đã qua giờ hẹn (giờ VN);
--               công tắc form và số bàn đang dùng — form mở mà chi nhánh chưa có bàn nào
--               thì mọi yêu cầu bị báo "hết bàn".
--   Tuyển dụng  ho_so_ung_tuyen 'moi': hồ sơ chưa ai mở quá 2 ngày / 7 ngày.
--   Sổ kho      kho_doi_soat_ton(): lô có tồn lệch sổ kho — luôn phải rỗng; khác rỗng là
--               dữ liệu kho đã sai. Hàm đó quét cả sổ nên chỉ gọi một lần cho mọi chi nhánh.
-- =============================================================================

create or replace function suc_khoe_he_thong()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ns   nhan_su;
  v_z    zalo_cau_hinh;
  v_m    mess_cau_hinh;
  v_cn   record;
  v_ipos jsonb;
  v_ch   kho_ipos_cau_hinh;
  v_lech jsonb;
  v_ds   jsonb := '[]'::jsonb;
begin
  v_ns := nhan_su_hien_tai();
  if v_ns.id is null or v_ns.vai_tro not in ('chu_so_huu', 'quan_ly') then
    raise exception 'Chỉ chủ sở hữu hoặc quản lý mới xem được sức khỏe hệ thống'
      using errcode = 'insufficient_privilege';
  end if;

  select coalesce(jsonb_object_agg(x.chi_nhanh_id, x.n), '{}'::jsonb) into v_lech
  from (select v.chi_nhanh_id, count(*) as n
        from kho_doi_soat_ton() d
        join kho_vi_tri v on v.id = d.vi_tri_id
        group by v.chi_nhanh_id) x;

  -- Chi nhánh đã ngừng hoạt động không nhận đặt bàn (tao_dat_ban lọc dang_hoat_dong) — không báo gì.
  for v_cn in
    select c.id, c.ma, c.ten
    from chi_nhanh c
    where c.dang_hoat_dong
      and (v_ns.vai_tro = 'chu_so_huu' or c.id = v_ns.chi_nhanh_id)
    order by c.ten
  loop
    v_ipos := kho_ipos_trang_thai(v_cn.id);
    v_ch := null;
    select * into v_ch from kho_ipos_cau_hinh where chi_nhanh_id = v_cn.id;

    v_ds := v_ds || jsonb_build_array(jsonb_build_object(
      'id',  v_cn.id,
      'ma',  v_cn.ma,     -- trang kho chọn chi nhánh bằng ?cn=<ma>
      'ten', v_cn.ten,

      'ipos', jsonb_build_object(
        'co_cau_hinh',     v_ipos -> 'co_cau_hinh',
        'bat',             v_ipos -> 'bat',
        'cau_hinh_du',     v_ipos -> 'cau_hinh_du',
        'den',             v_ipos -> 'den',
        'mat_ket_noi',     v_ipos -> 'mat_ket_noi',
        'loi_tu_luc',      v_ch.loi_tu_luc,
        'nhan_hd_luc',     v_ipos -> 'nhan_hd_luc',
        'gio_mat_ket_noi', v_ipos -> 'gio_mat_ket_noi',
        'dang_tru_kho',    (v_ipos ->> 'nguon_so_ban') = 'ipos' and (v_ipos ->> 'ipos_tu_luc') is not null,
        'cho_xu_ly',       v_ipos -> 'cho_xu_ly',
        'dong_loi',        v_ipos -> 'dem' -> 'loi',
        'bat_luc',         v_ch.bat_luc,
        'cron_cuoi',       (select max(l.bat_dau_luc) from kho_ipos_lan_chay l
                            where l.chi_nhanh_id = v_cn.id and l.nguon = 'cron')),

      -- Tin hỏng không bao giờ có gui_luc: "hỏng lúc nào" ≈ lúc đến hạn (gui_sau — tin nhắc hẹn
      -- xếp từ nhiều ngày trước), không phải lúc tạo.
      'tin_zalo', (
        select jsonb_build_object(
          'that_bai_24h', count(*) filter (
             where t.ket_qua in ('that_bai', 'bi_tu_choi')
               and coalesce(t.gui_luc, t.gui_sau, t.created_at) > now() - interval '24 hours'),
          'cho_qua_han', count(*) filter (
             where t.ket_qua = 'cho_gui'
               and t.loai_tin is distinct from 'cham_soc'
               and greatest(coalesce(t.gui_sau, t.created_at),
                            coalesce(t.thu_lai_luc, '-infinity'::timestamptz)) < now() - interval '30 minutes'))
        from nhat_ky_tin t
        where t.chi_nhanh_id = v_cn.id
          and (t.ket_qua = 'cho_gui' or coalesce(t.gui_luc, t.gui_sau, t.created_at) > now() - interval '24 hours')),

      'dat_ban', (
        select jsonb_build_object(
          'form_mo',        cong_tac_bat('form_dat_ban_dang_mo'),
          'so_ban',         (select count(*) from ban_an b where b.chi_nhanh_id = v_cn.id and b.dang_dung),
          'cho',            count(*),
          'cho_qua_2_gio',  count(*) filter (where d.created_at < now() - interval '2 hours'),
          'cho_qua_24_gio', count(*) filter (where d.created_at < now() - interval '24 hours'),
          'qua_gio_hen',    count(*) filter (where d.ngay + d.gio < bay_gio_vn()))
        from dat_ban d
        where d.chi_nhanh_id = v_cn.id and d.trang_thai = 'cho_xac_nhan'),

      'tuyen_dung', (
        select jsonb_build_object(
          'moi',            count(*),
          'moi_qua_2_ngay', count(*) filter (where h.created_at < now() - interval '2 days'),
          'moi_qua_7_ngay', count(*) filter (where h.created_at < now() - interval '7 days'))
        from ho_so_ung_tuyen h
        where h.chi_nhanh_id = v_cn.id and h.trang_thai = 'moi'),

      'so_kho', jsonb_build_object(
        'co_kho', exists (select 1 from kho_vi_tri v where v.chi_nhanh_id = v_cn.id),
        'lech',   coalesce((v_lech ->> v_cn.id::text)::int, 0))
    ));
  end loop;

  select * into v_z from zalo_cau_hinh where id = 1;
  select * into v_m from mess_cau_hinh where id = 1;

  return jsonb_build_object(
    'luc', now(),
    -- sua_luc: lần cuối dòng cấu hình đổi — Zalo có trigger updated_at nên mỗi lượt gửi cũng
    -- làm mới nó; Messenger chỉ đổi khi lưu cấu hình. Web dùng để không báo "bộ gửi không chạy"
    -- ngay sau khi vừa bật.
    'zalo', jsonb_build_object(
      'dang_bat',      coalesce(v_z.dang_bat, false),
      'che_do',        v_z.che_do,
      'lan_chay_cuoi', v_z.lan_chay_cuoi,
      'sua_luc',       v_z.updated_at,
      'co_loi',        v_z.loi_cuoi is not null),
    'messenger', jsonb_build_object(
      'dang_bat',      coalesce(v_m.dang_bat, false),
      'loi_cuoi_luc',  v_m.loi_cuoi_luc,
      'lan_nhan_cuoi', v_m.lan_nhan_cuoi,
      'sua_luc',       v_m.cap_nhat,
      'loi_7_ngay',    (select coalesce(sum(t.dem), 0) from mess_thong_ke_ngay t
                        where t.loai = 'loi' and t.ngay > hom_nay_vn() - 7)),
    'dich', (
      select jsonb_build_object(
        'cho', count(*) filter (where v.ly_do in ('thieu', 'cu')),
        'loi', count(*) filter (where v.ly_do = 'thu_lai'))
      from v_viec_dich v),
    'chi_nhanh', v_ds);
end;
$$;

comment on function suc_khoe_he_thong() is
  'Số liệu cho bảng đèn sức khỏe hệ thống ở /noi-bo. Chủ: mọi chi nhánh; quản lý: chi nhánh của mình. '
  'Chỉ số đếm và mốc giờ — màu và câu chữ ở web/src/lib/suc-khoe.ts.';

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
