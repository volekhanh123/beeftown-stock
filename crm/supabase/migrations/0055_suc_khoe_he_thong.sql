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
-- (web/src/lib/suc-khoe.ts), kiểm bằng dữ liệu giả (crm/test/test-suc-khoe-web.mjs).
-- Ngưỡng ĐẾM (2 giờ, 24 giờ, 2 / 7 ngày, 30 phút tin kẹt, 24 giờ tin hỏng, 7 ngày lỗi
-- Messenger) nằm ở đây; ngưỡng so với MỐC GIỜ (nhịp tim, lỗi mới, im lặng) nằm ở web.
-- Không trả dữ liệu cá nhân, không trả câu lỗi thô (câu lỗi có thể mang SĐT khách) — chi
-- tiết xem ở màn riêng của từng phần.
--
-- Ai đọc được: chủ sở hữu (mọi chi nhánh đang hoạt động) và quản lý (chi nhánh của mình).
-- Vai khác, người đã nghỉ, tài khoản máy, anon → insufficient_privilege. Kiểm ở
-- crm/test/test-suc-khoe.mjs.
--
-- Nguồn — không bảng mới; một cột mới (bat_luc) ở hai bảng cấu hình, xem mục 1:
--   iPOS        kho_ipos_trang_thai(): đèn GIỐNG HỆT màn Kết nối iPOS. Nhịp tim của việc chạy
--               nền: lượt cron gần nhất TỰ CHẠY XONG (cron ghi một lượt mỗi 5 phút khi iPOS
--               đã bật và cấu hình đủ). Lượt chết giữa chừng bị lượt sau đóng hộ, sớm nhất
--               10 phút sau khi bắt đầu — không tính, để "lượt nào cũng chết" hiện đỏ.
--   Zalo        zalo_cau_hinh (cả thương hiệu): bật từ lúc nào, chế độ, lượt gửi gần nhất
--               chạy xong (lan_chay_cuoi — zalo_ket_thuc_luot ghi mỗi lượt khi Zalo bật),
--               lượt đó có lỗi không. KHÔNG dùng updated_at: mỗi lượt BẮT ĐẦU cũng làm mới
--               nó, nên lượt nào cũng chết giữa chừng vẫn trông như đang chạy.
--               nhat_ky_tin (theo chi nhánh): tin ĐẾN HẠN trong 24 giờ qua mà hỏng / bị từ
--               chối (tin hỏng không có gui_luc, và lần thử cuối không được ghi lại — nên tính
--               theo giờ đến hạn); tin giao dịch đến hạn quá 30 phút mà vẫn chờ gửi (bộ gửi
--               chạy 5 phút một lần; tin chăm sóc chờ khung giờ là bình thường nên không tính).
--   Messenger   mess_cau_hinh, mess_thong_ke_ngay: bật từ lúc nào, tin gần nhất, lỗi gần nhất
--               lúc nào, số lỗi 7 ngày (theo ngày VN).
--   Bản dịch    v_viec_dich TRỪ noi_dung_cong_bo: ô chờ máy tự dịch; ô dịch lỗi đã quá 15
--               phút (máy dịch đang hỏng). Dữ kiện công bố chỉ dịch lại khi có người bấm Công
--               bố lại — trang Tổng quan đã có dòng việc riêng cho nó, và lỗi của nó đứng yên
--               mãi nên không nói được máy dịch có đang hỏng hay không.
--   Đặt bàn     dat_ban 'cho_xac_nhan', chia BA NHÓM KHÔNG CHỒNG NHAU để câu không đếm một
--               yêu cầu hai lần: đã qua giờ hẹn (giờ VN); chưa tới giờ hẹn mà chờ quá 24 giờ;
--               chưa tới giờ hẹn mà chờ quá 2 giờ (tới 24 giờ). Công tắc form và số bàn đang
--               dùng — form mở mà chi nhánh chưa có bàn nào thì mọi yêu cầu bị báo "hết bàn".
--   Tuyển dụng  ho_so_ung_tuyen 'moi', hai nhóm không chồng nhau: chưa ai mở quá 7 ngày; quá
--               2 ngày (tới 7 ngày).
--   Sổ kho      kho_doi_soat_ton(): lô có tồn lệch sổ kho — luôn phải rỗng; khác rỗng là
--               dữ liệu kho đã sai. Hàm đó quét cả sổ nên chỉ gọi một lần cho mọi chi nhánh.
--               Đo trên PGlite: ~300 ms với 100.000 dòng sổ. Khi sổ lớn tới mức trang Tổng
--               quan chậm thấy được: lưu kết quả đối soát định kỳ, đừng quét mỗi lần mở trang.
-- =============================================================================


-- =============================================================================
-- 1 · MỐC BẬT CỦA ZALO VÀ MESSENGER
-- =============================================================================
-- Nhịp tim cần biết "bật từ lúc nào" để không báo "bộ gửi không chạy" ngay sau khi vừa bật
-- (lượt đầu chưa kịp tới). updated_at / cap_nhat không dùng được: Zalo làm mới updated_at ở
-- mỗi lượt gửi (trigger), Messenger làm mới cap_nhat ở mỗi lần lưu cấu hình (kể cả sửa lời
-- chào) — cả hai đều che mất một bộ gửi / một webhook đã chết. bat_luc chỉ đổi khi dang_bat
-- chuyển từ tắt sang bật, giống kho_ipos_cau_hinh.bat_luc.
alter table zalo_cau_hinh add column bat_luc timestamptz;
alter table mess_cau_hinh add column bat_luc timestamptz;
comment on column zalo_cau_hinh.bat_luc is 'Lần gần nhất dang_bat chuyển từ tắt sang bật (trigger ghi_luc_bat, 0055).';
comment on column mess_cau_hinh.bat_luc is 'Lần gần nhất dang_bat chuyển từ tắt sang bật (trigger ghi_luc_bat, 0055).';

create or replace function ghi_luc_bat()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.dang_bat and (tg_op = 'INSERT' or not old.dang_bat) then
    new.bat_luc := now();
  end if;
  return new;
end;
$$;

comment on function ghi_luc_bat is
  'Trigger của zalo_cau_hinh và mess_cau_hinh: bat_luc = now() khi dang_bat chuyển từ tắt sang bật.';

create trigger zalo_cau_hinh_bat_luc
  before insert or update of dang_bat on zalo_cau_hinh
  for each row execute function ghi_luc_bat();
create trigger mess_cau_hinh_bat_luc
  before insert or update of dang_bat on mess_cau_hinh
  for each row execute function ghi_luc_bat();

-- Đang bật sẵn lúc chạy migration: không biết bật từ bao giờ — tính từ bây giờ.
update zalo_cau_hinh set bat_luc = now() where dang_bat and bat_luc is null;
update mess_cau_hinh set bat_luc = now() where dang_bat and bat_luc is null;


-- =============================================================================
-- 2 · suc_khoe_he_thong()
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
        -- Lượt tự chạy xong: có giờ kết thúc, và kết thúc trước khi bị lượt sau đóng hộ
        -- (kho_ipos_bat_dau đóng lượt treo quá 10 phút với lỗi "Quá 10 phút không xong").
        'cron_cuoi',       (select max(l.bat_dau_luc) from kho_ipos_lan_chay l
                            where l.chi_nhanh_id = v_cn.id and l.nguon = 'cron'
                              and l.ket_thuc_luc is not null
                              and l.ket_thuc_luc < l.bat_dau_luc + interval '10 minutes')),

      -- Tin hỏng không bao giờ có gui_luc, và lần thử cuối không được ghi lại: "hỏng lúc
      -- nào" tính theo lúc ĐẾN HẠN (gui_sau — tin nhắc hẹn xếp từ nhiều ngày trước), không
      -- theo lúc tạo. Web nói đúng như vậy: "tin đến hạn trong 24 giờ qua đã hỏng".
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

      -- Ba nhóm không chồng nhau: qua giờ hẹn > chờ quá 24 giờ > chờ quá 2 giờ.
      'dat_ban', (
        select jsonb_build_object(
          'form_mo',        cong_tac_bat('form_dat_ban_dang_mo'),
          'so_ban',         (select count(*) from ban_an b where b.chi_nhanh_id = v_cn.id and b.dang_dung),
          'cho',            count(*),
          'qua_gio_hen',    count(*) filter (where d.ngay + d.gio < bay_gio_vn()),
          'cho_qua_24_gio', count(*) filter (where d.ngay + d.gio >= bay_gio_vn()
                                               and d.created_at < now() - interval '24 hours'),
          'cho_qua_2_gio',  count(*) filter (where d.ngay + d.gio >= bay_gio_vn()
                                               and d.created_at >= now() - interval '24 hours'
                                               and d.created_at < now() - interval '2 hours'))
        from dat_ban d
        where d.chi_nhanh_id = v_cn.id and d.trang_thai = 'cho_xac_nhan'),

      -- Hai nhóm không chồng nhau: quá 7 ngày > quá 2 ngày (tới 7 ngày).
      'tuyen_dung', (
        select jsonb_build_object(
          'moi',            count(*),
          'moi_qua_7_ngay', count(*) filter (where h.created_at < now() - interval '7 days'),
          'moi_qua_2_ngay', count(*) filter (where h.created_at >= now() - interval '7 days'
                                               and h.created_at < now() - interval '2 days'))
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
    'zalo', jsonb_build_object(
      'dang_bat',      coalesce(v_z.dang_bat, false),
      'che_do',        v_z.che_do,
      'bat_luc',       v_z.bat_luc,
      'lan_chay_cuoi', v_z.lan_chay_cuoi,
      'co_loi',        v_z.loi_cuoi is not null),
    'messenger', jsonb_build_object(
      'dang_bat',      coalesce(v_m.dang_bat, false),
      'bat_luc',       v_m.bat_luc,
      'lan_nhan_cuoi', v_m.lan_nhan_cuoi,
      'loi_cuoi_luc',  v_m.loi_cuoi_luc,
      'loi_7_ngay',    (select coalesce(sum(t.dem), 0) from mess_thong_ke_ngay t
                        where t.loai = 'loi' and t.ngay > hom_nay_vn() - 7)),
    'dich', (
      select jsonb_build_object(
        'cho', count(*) filter (where v.ly_do in ('thieu', 'cu')),
        'loi', count(*) filter (where v.ly_do = 'thu_lai'))
      from v_viec_dich v
      where v.bang <> 'noi_dung_cong_bo'),
    'chi_nhanh', v_ds);
end;
$$;

comment on function suc_khoe_he_thong() is
  'Số liệu cho bảng đèn sức khỏe hệ thống ở /noi-bo. Chủ: mọi chi nhánh đang hoạt động; quản lý: chi nhánh của mình. '
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
