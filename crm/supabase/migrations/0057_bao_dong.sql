-- =============================================================================
-- BEEFTOWN — 0057 · BÁO ĐỘNG (tự báo khi đèn sức khỏe chuyển đỏ)
-- =============================================================================
-- PHẢI CHẠY SAU 0056 (một mình — thêm vai may_bao_dong) VÀ SAU 0055 (bảng sức khỏe).
--
-- Bảng sức khỏe (0055) chỉ hiện khi có người mở /noi-bo. Việc chạy nền báo động
-- (web/src/lib/bao-dong.ts, cron riêng "2-59/5 * * * *") đọc ĐÚNG số liệu đó bằng tài khoản
-- máy may_bao_dong, đánh giá bằng ĐÚNG danhGiaSucKhoe() của bảng, rồi báo khi đèn mới chuyển
-- đỏ, tóm tắt 08:00, báo hết đỏ. File này chỉ giữ TRẠNG THÁI; luật (giờ đêm / sáng, xác nhận
-- hai lượt, chờ hết đỏ 15 phút, trần 5 tin mỗi đèn từ 8 giờ sáng tới 8 giờ sáng hôm sau, câu
-- chữ) ở web/src/lib/bao-dong-chinh-sach.ts và bao-dong-tin.ts — thuần, thử được từng mốc giờ
-- Việt Nam bằng đồng hồ `luc` của database.
--
--   1 · bao_dong_trang_thai (một dòng): khóa lượt + mã lượt, nhịp tim, lỗi gần nhất (đã xóa bí
--       mật), kênh đang dùng và từ lúc nào, lần tóm tắt / gửi gần nhất.
--   2 · bao_dong_su_co: mỗi đèn đỏ là một sự cố — MỘT sự cố đang mở cho mỗi đèn (chỉ mục duy
--       nhất). Không lưu câu chữ: câu soạn lại từ số liệu lúc gửi, nên không có chỗ nào để dữ
--       liệu cá nhân nằm lại. Sự cố đã đóng quá 90 ngày tự dọn.
--   3 · Tách phần KIỂM QUYỀN khỏi phần TÍNH SỐ LIỆU, để máy đọc được mà không mở quyền kho /
--       CRM nào: kho_ipos_trang_thai_goc (thân 0042 nguyên văn, trừ đúng ba dòng kiểm
--       kho_duoc), suc_khoe_so_lieu(uuid[]) (thân 0055, không kiểm vai). Cả hai là SECURITY
--       INVOKER và bị thu quyền authenticated: chỉ chạy được bên trong một hàm definer đã kiểm
--       vai. Hai hàm cũ giữ nguyên chữ ký, câu từ chối và kết quả. Hai bảng tạo TRƯỚC mục này:
--       suc_khoe_so_lieu khai báo biến kiểu bao_dong_trang_thai.
--   4 · Bốn RPC chỉ cho may_bao_dong: bắt đầu lượt (khóa 10 phút, mã lượt), ghi lượt (MỌI đèn
--       kèm màu — thiếu dữ liệu thì không đóng gì), đánh dấu đã gửi (không lặp), kết thúc lượt
--       (chỉ nhả khóa của đúng lượt mình).
--   5 · Quyền: không ai đọc / ghi thẳng hai bảng; khối CHỐT QUYỀN chép nguyên văn.
-- =============================================================================


-- =============================================================================
-- 1 · TRẠNG THÁI VIỆC BÁO ĐỘNG — một dòng
-- =============================================================================
create table bao_dong_trang_thai (
  id            smallint primary key default 1,
  dang_chay_tu  timestamptz,                    -- khóa lượt: lượt đang chạy từ lúc nào
  luot          uuid,                           -- mã của lượt đang giữ khóa
  lan_chay_cuoi timestamptz,                    -- nhịp tim: lượt gần nhất chạy XONG
  loi_cuoi      text,                           -- lỗi của lượt gần nhất (đã xóa bí mật), null = không lỗi
  kenh          text not null default 'khong',  -- kênh Worker đang dùng: khong | telegram | …
  kenh_tu_luc   timestamptz,                    -- lần đổi kênh gần nhất (nối kênh → tin "đã nối kênh")
  tom_tat_luc   timestamptz,                    -- lần gửi tóm tắt (sáng / nối kênh) gần nhất
  lan_gui_cuoi  timestamptz,                    -- lần gửi được tin gần nhất

  constraint bao_dong_trang_thai_mot_dong check (id = 1),
  constraint bao_dong_trang_thai_kenh check (kenh ~ '^[a-z_]{1,20}$'),
  constraint bao_dong_trang_thai_loi_ngan check (loi_cuoi is null or char_length(loi_cuoi) <= 500)
);

comment on table bao_dong_trang_thai is
  'Một dòng: khóa lượt, nhịp tim, lỗi gần nhất, kênh, mốc tóm tắt của việc chạy nền báo động (0057). Chỉ đọc / ghi qua RPC máy và suc_khoe_so_lieu.';

insert into bao_dong_trang_thai (id) values (1) on conflict (id) do nothing;

alter table bao_dong_trang_thai enable row level security;


-- =============================================================================
-- 2 · SỰ CỐ — mỗi đèn đỏ một sự cố
-- =============================================================================
create table bao_dong_su_co (
  id           uuid primary key default gen_random_uuid(),
  khoa         text not null,                 -- ma_den, hoặc ma_den:<id chi nhánh>
  ma_den       text not null,                 -- dat_ban | ipos | zalo | … | doc_so_lieu
  chi_nhanh_id uuid references chi_nhanh(id) on delete cascade,   -- null = đèn cả thương hiệu
  bat_dau_luc  timestamptz not null default now(),
  het_do_tu    timestamptz,                   -- lần đầu thấy hết đỏ (đang chờ); null = đang đỏ
  mau_sau      text,                          -- màu lúc hết đỏ: xanh | vang | tat | mat (đèn không còn)
  het_luc      timestamptz,                   -- đóng sự cố
  bao_mo_luc   timestamptz,                   -- đã báo "mới đỏ" (hoặc nằm trong một tóm tắt)
  bao_mo_kenh  text,
  bao_het_luc  timestamptz,                   -- đã báo hết đỏ

  constraint bao_dong_su_co_ma_den check (ma_den ~ '^[a-z_]{1,40}$'),
  constraint bao_dong_su_co_khoa check (khoa = ma_den || coalesce(':' || chi_nhanh_id::text, '')),
  constraint bao_dong_su_co_mau_sau check (mau_sau is null or mau_sau in ('xanh', 'vang', 'tat', 'mat')),
  constraint bao_dong_su_co_kenh check (bao_mo_kenh is null or bao_mo_kenh ~ '^[a-z_]{1,20}$')
);

comment on table bao_dong_su_co is
  'Sự cố của việc báo động (0057): một đèn đỏ = một sự cố, một sự cố đang mở cho mỗi khoa. Không lưu câu chữ. Chỉ đọc / ghi qua RPC máy báo động.';

create unique index bao_dong_su_co_mo_idx on bao_dong_su_co(khoa) where het_luc is null;
create index bao_dong_su_co_het_idx on bao_dong_su_co(het_luc) where het_luc is not null;
create index bao_dong_su_co_bao_idx on bao_dong_su_co(bao_mo_luc) where bao_mo_luc is not null;

alter table bao_dong_su_co enable row level security;


-- =============================================================================
-- 3 · TÁCH KIỂM QUYỀN KHỎI TÍNH SỐ LIỆU
-- =============================================================================
-- Thân 0042 NGUYÊN VĂN, trừ đúng ba dòng kiểm kho_duoc — crm/test/test-suc-khoe.mjs (nhóm 12) so
-- với 0042 và so kết quả với hàm cũ dựng lại. SECURITY INVOKER: gọi thẳng (nếu lỡ có quyền) thì
-- RLS của người gọi áp dụng.
create or replace function kho_ipos_trang_thai_goc(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_c    kho_ipos_cau_hinh;
  v_cd   kho_cai_dat;
  v_dem  jsonb;
  v_mat  boolean;
  v_den  text;
  v_cau  text;
  v_du   boolean;
  v_cho  int;
begin
  select * into v_cd from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id;
  select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id;

  select jsonb_build_object(
           'cho',        count(*) filter (where d.trang_thai = 'cho'),
           'chua_khop',  count(*) filter (where d.trang_thai = 'chua_khop'),
           'thieu_hang', count(*) filter (where d.trang_thai = 'thieu_hang'),
           'loi',        count(*) filter (where d.trang_thai = 'loi'),
           'het_han',    count(*) filter (where d.trang_thai = 'da_ghi' and d.lo_het_han
                                            and d.thoi_diem_ban >= now() - interval '7 days'),
           'da_ghi_hom_nay', count(*) filter (where d.trang_thai = 'da_ghi'
                                                and ((d.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date = hom_nay_vn()))
    into v_dem
  from kho_ipos_dong d where d.chi_nhanh_id = p_chi_nhanh_id;
  v_cho := (v_dem ->> 'chua_khop')::int + (v_dem ->> 'thieu_hang')::int;

  -- 0042: iPOS tự đẩy hóa đơn — không cần đường dẫn lấy hóa đơn.
  v_du := v_c.chi_nhanh_id is not null and coalesce(v_c.pos_parent, '') <> '' and coalesce(v_c.pos_id, '') <> ''
          and v_c.vi_tri_ban_id is not null;
  v_mat := v_c.chi_nhanh_id is not null and kho_ipos_mat_ket_noi(v_c);

  if v_c.chi_nhanh_id is null or not v_c.bat then
    v_den := 'vang'; v_cau := 'Chưa bật đồng bộ iPOS.';
  elsif not v_du then
    v_den := 'vang'; v_cau := 'Chưa cấu hình đủ kết nối iPOS.';
  elsif v_mat and v_c.loi_tu_luc is not null then
    v_den := 'do'; v_cau := 'Lần cập nhật gần nhất bị lỗi — bấm "Cập nhật ngay" để thử lại.';
  elsif v_mat then
    v_den := 'do'; v_cau := 'Đã hơn ' || v_c.gio_mat_ket_noi
      || ' giờ trong giờ mở cửa không nhận được hóa đơn nào từ iPOS — kiểm tra máy iPOS và địa chỉ nhận hóa đơn.';
  elsif coalesce(v_cd.nguon_so_ban, 'kiem_ke') <> 'ipos' or v_c.ipos_tu_luc is null then
    v_den := 'vang'; v_cau := 'Đang nhận hóa đơn iPOS nhưng CHƯA trừ kho — còn dùng đếm quầy làm số bán.';
  elsif v_cho > 0 or (v_dem ->> 'loi')::int > 0 then
    v_den := 'vang'; v_cau := 'Có dòng bán chưa trừ được kho — mở Bán hàng iPOS để xử lý.';
  else
    v_den := 'xanh'; v_cau := 'Kho đang tự trừ theo iPOS.';
  end if;

  return jsonb_build_object(
    'co_cau_hinh', v_c.chi_nhanh_id is not null,
    'bat', coalesce(v_c.bat, false),
    'cau_hinh_du', v_du,
    'nguon_so_ban', coalesce(v_cd.nguon_so_ban, 'kiem_ke'),
    'api_url', coalesce(v_c.api_url, 'https://apitest.foodbook.vn/ipos/ws/xpartner'),
    'pos_parent', v_c.pos_parent, 'pos_id', v_c.pos_id, 'duong_dan_hoa_don', v_c.duong_dan_hoa_don,
    'vi_tri_ban_id', v_c.vi_tri_ban_id,
    'gio_mo_cua', coalesce(v_c.gio_mo_cua, 10), 'gio_dong_cua', coalesce(v_c.gio_dong_cua, 23),
    'gio_mat_ket_noi', coalesce(v_c.gio_mat_ket_noi, 3),
    'ipos_tu_luc', v_c.ipos_tu_luc, 'dong_bo_den_luc', v_c.dong_bo_den_luc,
    'dang_chay', v_c.dang_chay_tu is not null and v_c.dang_chay_tu > now() - interval '10 minutes',
    'lan_cuoi_luc', v_c.lan_cuoi_luc, 'lan_cuoi_loi', v_c.lan_cuoi_loi, 'lan_ok_luc', v_c.lan_ok_luc,
    'nhan_hd_luc', v_c.nhan_hd_luc, 'hop_thu_luc', v_c.hop_thu_luc,
    'menu_luc', v_c.menu_luc, 'menu_can_lam_moi', coalesce(v_c.menu_can_lam_moi, false),
    'so_mon_menu', (select count(*) from kho_ipos_menu m where m.chi_nhanh_id = p_chi_nhanh_id),
    'mat_ket_noi', coalesce(v_mat, false),
    'den', v_den, 'cau', v_cau,
    'cho_xu_ly', v_cho, 'dem', v_dem,
    'lan_chay', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'nguon', l.nguon, 'bat_dau_luc', l.bat_dau_luc,
                                          'ket_thuc_luc', l.ket_thuc_luc, 'so_hd', l.so_hd, 'so_dong', l.so_dong,
                                          'so_da_ghi', l.so_da_ghi, 'loi', l.loi) order by l.bat_dau_luc desc)
      from (select * from kho_ipos_lan_chay where chi_nhanh_id = p_chi_nhanh_id
            order by bat_dau_luc desc limit 10) l), '[]'));
end;
$$;

comment on function kho_ipos_trang_thai_goc is
  'NỘI BỘ (0057): phần tính của kho_ipos_trang_thai, không kiểm quyền. Chỉ gọi từ hàm definer đã kiểm vai (kho_ipos_trang_thai, suc_khoe_so_lieu). Không ai đăng nhập gọi thẳng được.';

create or replace function kho_ipos_trang_thai(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';
  end if;
  return kho_ipos_trang_thai_goc(p_chi_nhanh_id);
end;
$$;

comment on function kho_ipos_trang_thai is
  'Trạng thái đồng bộ iPOS (xem, không tiền): cấu hình (không token), đèn xanh | vang | do + câu dễ hiểu, lần nhận hóa đơn cuối (nhan_hd_luc), lần xử lý hộp thư cuối (hop_thu_luc), thực đơn (menu_luc, menu_can_lam_moi, so_mon_menu), số dòng theo trạng thái, 10 lượt gần nhất. 0042: không cần đường dẫn hóa đơn; mất kết nối = lượt lỗi hoặc quá gio_mat_ket_noi giờ không nhận hóa đơn trong giờ mở cửa. 0057: kiểm quyền rồi gọi kho_ipos_trang_thai_goc (kết quả không đổi).';

-- Thân 0055, không kiểm vai; danh sách chi nhánh do hàm gọi quyết định. Thêm ô bao_dong.
create or replace function suc_khoe_so_lieu(p_chi_nhanh_ids uuid[])
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_z    zalo_cau_hinh;
  v_m    mess_cau_hinh;
  v_cn   record;
  v_ipos jsonb;
  v_ch   kho_ipos_cau_hinh;
  v_lech jsonb;
  v_bd   bao_dong_trang_thai;
  v_ds   jsonb := '[]'::jsonb;
begin
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
      and c.id = any(p_chi_nhanh_ids)
    order by c.ten
  loop
    v_ipos := kho_ipos_trang_thai_goc(v_cn.id);
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
  select * into v_bd from bao_dong_trang_thai where id = 1;

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
    -- 0057: việc chạy nền báo động — đèn "Báo động" của bảng (web/src/lib/suc-khoe.ts).
    'bao_dong', jsonb_build_object(
      'lan_chay_cuoi', v_bd.lan_chay_cuoi,
      'kenh',          coalesce(v_bd.kenh, 'khong'),
      'co_loi',        v_bd.loi_cuoi is not null,
      'lan_gui_cuoi',  v_bd.lan_gui_cuoi),
    'chi_nhanh', v_ds);
end;
$$;

comment on function suc_khoe_so_lieu(uuid[]) is
  'NỘI BỘ (0057): số liệu bảng sức khỏe cho các chi nhánh ĐANG HOẠT ĐỘNG trong danh sách, không kiểm vai. Chỉ gọi từ suc_khoe_he_thong() (chủ / quản lý) và bao_dong_bat_dau_luot() (máy báo động). Không ai đăng nhập gọi thẳng được.';

create or replace function suc_khoe_he_thong()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ns  nhan_su;
  v_ids uuid[];
begin
  v_ns := nhan_su_hien_tai();
  if v_ns.id is null or v_ns.vai_tro not in ('chu_so_huu', 'quan_ly') then
    raise exception 'Chỉ chủ sở hữu hoặc quản lý mới xem được sức khỏe hệ thống'
      using errcode = 'insufficient_privilege';
  end if;

  select coalesce(array_agg(c.id), '{}'::uuid[]) into v_ids
  from chi_nhanh c
  where c.dang_hoat_dong
    and (v_ns.vai_tro = 'chu_so_huu' or c.id = v_ns.chi_nhanh_id);

  return suc_khoe_so_lieu(v_ids);
end;
$$;

comment on function suc_khoe_he_thong() is
  'Số liệu cho bảng đèn sức khỏe hệ thống ở /noi-bo. Chủ: mọi chi nhánh đang hoạt động; quản lý: chi nhánh của mình. '
  'Chỉ số đếm và mốc giờ — màu và câu chữ ở web/src/lib/suc-khoe.ts. 0057: kiểm vai rồi gọi suc_khoe_so_lieu.';


-- =============================================================================
-- 4 · RPC CỦA MÁY BÁO ĐỘNG — chỉ may_bao_dong
-- =============================================================================
-- Câu lỗi lưu lại: xóa token kiểu Telegram (123456:AA…) TRƯỚC — mess_sach_loi (0053) còn xóa
-- token / mật khẩu / chuỗi hex / số điện thoại, nhưng sẽ chỉ cắt mất phần số của token Telegram.
create or replace function bao_dong_sach_loi(p_loi text)
returns text
language sql
immutable
set search_path = public
as $$
  select mess_sach_loi(regexp_replace(p_loi, '[0-9]{6,}:[A-Za-z0-9_-]{30,}', '***', 'g'));
$$;

comment on function bao_dong_sach_loi(text) is
  'NỘI BỘ (0057): câu lỗi của việc báo động trước khi lưu — xóa token Telegram rồi mess_sach_loi (token, mật khẩu, hex, SĐT), tối đa 500 ký tự.';

-- Bắt đầu lượt: khóa (lượt treo quá 10 phút coi như đã chết), mã lượt, số liệu mọi chi nhánh
-- đang hoạt động (hỏng thì null + lỗi — lượt vẫn chạy để ghi đèn giả doc_so_lieu), trạng thái
-- cho luật báo, và các lần "đã báo" trong 48 giờ (trần tin của mỗi đèn tính từ 8 giờ sáng giờ VN).
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

  begin
    select coalesce(array_agg(c.id), '{}'::uuid[]) into v_ids from chi_nhanh c where c.dang_hoat_dong;
    v_so := suc_khoe_so_lieu(v_ids);
  exception when others then
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
  'Máy báo động (0057): bắt đầu lượt. {bi_khoa:true, dang_chay_tu} nếu lượt khác đang chạy (dưới 10 phút); không thì {bi_khoa:false, luot, so_lieu|null, loi_so_lieu, trang_thai{kenh, kenh_tu_luc, tom_tat_luc, lan_chay_cuoi}, da_bao_48_gio[{khoa, bao_mo_luc}]}. Ghi kênh Worker đang dùng; dọn sự cố đóng quá 90 ngày.';

-- Ghi lượt: MỌI đèn đã đánh giá kèm màu. Đỏ → mở sự cố mới hoặc tiếp tục sự cố đang mở (kể
-- cả khi nó đang chờ hết đỏ — chập chờn vẫn là MỘT sự cố). Màu khác → bắt đầu / tiếp tục chờ
-- hết đỏ. p_day_du = true (danh sách đầy đủ): sự cố đang mở mà đèn không còn trong danh sách
-- (chi nhánh ngừng hoạt động…) → chờ hết đỏ với mau_sau 'mat'. Số liệu không tin được thì
-- Worker gửi p_day_du = false (chỉ đèn giả doc_so_lieu) → không sự cố nào bị coi là đã hết.
create or replace function bao_dong_ghi_luot(p_luot uuid, p_den jsonb, p_day_du boolean default true)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_tt   bao_dong_trang_thai;
  v_d    jsonb;
  v_ma   text;
  v_mau  text;
  v_cn   uuid;
  v_khoa text;
  v_co   text[] := '{}';
begin
  if not co_vai_tro(array['may_bao_dong']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy báo động mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_tt from bao_dong_trang_thai where id = 1 for update;
  if p_luot is null or v_tt.luot is distinct from p_luot or v_tt.dang_chay_tu is null then
    raise exception 'Lượt báo động này đã kết thúc hoặc quá hạn' using errcode = 'check_violation';
  end if;

  if p_den is null or jsonb_typeof(p_den) <> 'array' or jsonb_array_length(p_den) > 1000 then
    raise exception 'Danh sách đèn không hợp lệ' using errcode = 'check_violation';
  end if;

  for v_d in select e from jsonb_array_elements(p_den) e loop
    if jsonb_typeof(v_d) <> 'object' then
      raise exception 'Danh sách đèn không hợp lệ' using errcode = 'check_violation';
    end if;
    v_ma  := v_d ->> 'ma_den';
    v_mau := v_d ->> 'mau';
    begin
      v_cn := nullif(v_d ->> 'chi_nhanh_id', '')::uuid;
    exception when invalid_text_representation then
      raise exception 'Danh sách đèn không hợp lệ' using errcode = 'check_violation';
    end;
    if v_ma is null or v_ma !~ '^[a-z_]{1,40}$' or v_mau is null or v_mau not in ('xanh', 'vang', 'do', 'tat')
       or (v_cn is not null and not exists (select 1 from chi_nhanh c where c.id = v_cn)) then
      raise exception 'Danh sách đèn không hợp lệ' using errcode = 'check_violation';
    end if;

    v_khoa := v_ma || coalesce(':' || v_cn::text, '');
    v_co := v_co || v_khoa;
    if v_mau = 'do' then
      insert into bao_dong_su_co (khoa, ma_den, chi_nhanh_id)
      values (v_khoa, v_ma, v_cn)
      on conflict (khoa) where het_luc is null
      do update set het_do_tu = null, mau_sau = null;
    else
      update bao_dong_su_co
         set het_do_tu = coalesce(het_do_tu, now()), mau_sau = v_mau
       where khoa = v_khoa and het_luc is null;
    end if;
  end loop;

  if coalesce(p_day_du, false) then
    update bao_dong_su_co s
       set het_do_tu = coalesce(s.het_do_tu, now()), mau_sau = 'mat'
     where s.het_luc is null
       and not (s.khoa = any(v_co));
  end if;

  return jsonb_build_object(
    'luc', now(),
    'su_co', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', s.id, 'khoa', s.khoa, 'ma_den', s.ma_den, 'chi_nhanh_id', s.chi_nhanh_id,
               'bat_dau_luc', s.bat_dau_luc, 'het_do_tu', s.het_do_tu, 'mau_sau', s.mau_sau,
               'bao_mo_luc', s.bao_mo_luc, 'bao_mo_kenh', s.bao_mo_kenh, 'bao_het_luc', s.bao_het_luc)
             order by s.bat_dau_luc, s.khoa)
      from bao_dong_su_co s
      where s.het_luc is null), '[]'::jsonb));
end;
$$;

comment on function bao_dong_ghi_luot(uuid, jsonb, boolean) is
  'Máy báo động (0057): ghi màu MỌI đèn của lượt [{ma_den, chi_nhanh_id|null, mau: xanh|vang|do|tat}]. Đỏ → mở / tiếp tục sự cố; màu khác → chờ hết đỏ. p_day_du: sự cố của đèn không còn → mau_sau mat. Cần đúng mã lượt. Trả {luc, su_co[] đang mở}.';

-- Đánh dấu đã gửi. Không cần mã lượt: là sự thật về một tin ĐÃ gửi, ghi mấy lần cũng giữ mốc
-- đầu. p_mo: tin "mới đỏ" hoặc tóm tắt; p_het: tin hết đỏ (chỉ sự cố đã báo và đang chờ hết).
create or replace function bao_dong_da_gui(p_kenh text, p_mo uuid[] default '{}', p_het uuid[] default '{}',
                                           p_tom_tat boolean default false)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_mo  integer;
  v_het integer;
begin
  if not co_vai_tro(array['may_bao_dong']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy báo động mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;
  if p_kenh is null or p_kenh !~ '^[a-z_]{1,20}$' or p_kenh = 'khong' then
    raise exception 'Tên kênh báo động không hợp lệ' using errcode = 'check_violation';
  end if;

  update bao_dong_su_co
     set bao_mo_luc = now(), bao_mo_kenh = p_kenh
   where id = any(coalesce(p_mo, '{}'::uuid[])) and bao_mo_luc is null;
  get diagnostics v_mo = row_count;

  update bao_dong_su_co
     set bao_het_luc = now()
   where id = any(coalesce(p_het, '{}'::uuid[]))
     and bao_mo_luc is not null and bao_het_luc is null and het_do_tu is not null;
  get diagnostics v_het = row_count;

  update bao_dong_trang_thai
     set lan_gui_cuoi = now(),
         tom_tat_luc  = case when coalesce(p_tom_tat, false)
                             then greatest(coalesce(tom_tat_luc, '-infinity'::timestamptz), now())
                             else tom_tat_luc end
   where id = 1;

  return jsonb_build_object('ok', true, 'so_mo', v_mo, 'so_het', v_het);
end;
$$;

comment on function bao_dong_da_gui(text, uuid[], uuid[], boolean) is
  'Máy báo động (0057): đánh dấu đã gửi qua p_kenh (không phải khong). p_mo → bao_mo_luc (chỉ lần đầu), p_het → bao_het_luc (chỉ sự cố đã báo, đang chờ hết đỏ), p_tom_tat → tom_tat_luc. Gọi lại không đổi mốc đã có.';

-- Kết thúc lượt: đóng các sự cố Worker đã quyết (chỉ sự cố đang chờ hết đỏ — đỏ lại thì
-- không đóng), ghi nhịp tim và lỗi (đã xóa bí mật), nhả khóa CHỈ khi đúng lượt của mình.
create or replace function bao_dong_ket_thuc_luot(p_luot uuid, p_dong uuid[] default '{}', p_loi text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_nha  boolean;
  v_dong integer;
begin
  if not co_vai_tro(array['may_bao_dong']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy báo động mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;

  update bao_dong_su_co
     set het_luc = now()
   where id = any(coalesce(p_dong, '{}'::uuid[])) and het_luc is null and het_do_tu is not null;
  get diagnostics v_dong = row_count;

  select p_luot is not null and luot is not distinct from p_luot into v_nha
  from bao_dong_trang_thai where id = 1 for update;

  update bao_dong_trang_thai
     set lan_chay_cuoi = now(),
         loi_cuoi      = bao_dong_sach_loi(p_loi),
         dang_chay_tu  = case when v_nha then null else dang_chay_tu end,
         luot          = case when v_nha then null else luot end
   where id = 1;

  return jsonb_build_object('ok', true, 'so_dong', v_dong, 'nha_khoa', v_nha);
end;
$$;

comment on function bao_dong_ket_thuc_luot(uuid, uuid[], text) is
  'Máy báo động (0057): kết thúc lượt — đóng các sự cố trong p_dong (chỉ khi đang chờ hết đỏ), ghi lan_chay_cuoi và loi_cuoi (bao_dong_sach_loi; null = không lỗi), nhả khóa chỉ khi p_luot đúng lượt đang giữ.';


-- =============================================================================
-- 5 · QUYỀN
-- =============================================================================
-- Không ai đăng nhập đọc / ghi thẳng hai bảng (máy cũng không: nó đi qua bốn RPC). Hàm nội bộ
-- thu quyền authenticated — chỉ chạy được bên trong hàm definer đã kiểm vai.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on bao_dong_trang_thai from anon, authenticated';
    execute 'revoke all on bao_dong_su_co from anon, authenticated';
    execute 'revoke execute on function kho_ipos_trang_thai_goc(uuid) from authenticated';
    execute 'revoke execute on function suc_khoe_so_lieu(uuid[]) from authenticated';
    execute 'revoke execute on function bao_dong_sach_loi(text) from authenticated';
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
