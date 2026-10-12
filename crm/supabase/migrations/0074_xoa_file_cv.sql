-- =============================================================================
-- BEEFTOWN CRM — 0074 · XÓA FILE CV KHI ẨN DANH, QUÉT CV MỒ CÔI, ĐÈN DỌN DỮ LIỆU
-- =============================================================================
-- Rà soát nợ kỹ thuật 11/10/2026 thấy ba lỗ, cùng một gốc: database không xóa
-- được file trong Supabase Storage (bảng storage.objects chặn DELETE thẳng —
-- phải đi qua API Storage), nên mọi việc dọn CV phải đi qua web, và web chưa
-- làm việc đó.
--
--   1. Trang quyền riêng tư (vi / en / ko) hứa: sáu tháng sau ngày nộp, họ tên,
--      số điện thoại, email, địa chỉ IP VÀ FILE CV bị xóa. Nút "Ẩn danh hồ sơ đã
--      quá hạn lưu" ở /noi-bo/cai-dat chạy don_dep_ho_so_het_han() (0012) — hàm
--      đó đặt duong_dan_cv = null. File ở lại trong kho ho-so-ung-tuyen, và từ
--      lúc đó không còn gì trỏ tới nó.
--   2. web/src/lib/nop-ho-so.ts tải CV TRƯỚC khi gọi nop_ho_so_ung_tuyen() (hàm
--      cần mã vé). Hàm đó từ chối được: bẫy bot, quá 5 lần / giờ / IP, số điện
--      thoại sai, nộp trùng trong ngày → file đã nằm trong kho mà không hồ sơ
--      nào trỏ tới. Vé là dấu vết duy nhất của thư mục đó, và
--      don_dep_phieu_tai_len() xóa vé.
--   3. Ba việc dọn chỉ chạy khi có người bấm (0012 cố ý không gắn pg_cron), và
--      không đèn nào nói tới lúc phải bấm.
--
-- ĐỔI GÌ
--
--   1. ho_so_cv_het_han() — đường dẫn CV (nguyên dạng cột duong_dan_cv) của
--      các hồ sơ sắp được ẩn danh. Chỉ chủ sở hữu, như don_dep_ho_so_het_han.
--   2. an_danh_ho_so_het_han(p_cv_da_xoa) — ẩn danh hồ sơ quá hạn KHÔNG có CV,
--      hoặc có CV mà đường dẫn nằm trong p_cv_da_xoa: danh sách file web đã
--      xóa và đã kiểm lại là không còn trong kho. Hồ sơ còn file thì giữ nguyên
--      (họ tên, đường dẫn) để lần bấm sau làm tiếp — mất đường dẫn là mất dấu
--      file. Thứ tự ở web (web/src/lib/xoa-cv.ts): đọc danh sách → xóa trong
--      kho → kiểm lại → gọi hàm này. Thân cập nhật chép y 0012.
--   3. don_dep_ho_so_het_han() — giữ tên (SQL Editor, web cũ trong lúc chờ
--      deploy), nhưng chỉ còn ẩn danh hồ sơ không có CV: từ SQL không xóa được
--      file, nên không được xóa dấu vết của file.
--   4. ho_so_thu_muc_cv_mo_coi(p_thu_muc) — web liệt kê thư mục gốc của kho CV
--      rồi hỏi: thư mục nào mồ côi? Mồ côi = tên là một mã vé (uuid), vé đó
--      không còn hiệu lực (không có, hoặc hết hạn quá một ngày — đúng mốc
--      don_dep_phieu_tai_len dùng để xóa vé), và không hồ sơ chưa ẩn danh nào
--      trỏ vào thư mục đó. Quét theo KHO chứ không theo vé: CV mồ côi mà vé đã
--      bị xóa từ trước vẫn tìm ra. Chủ sở hữu hoặc quản lý (hai vai dọn được
--      vé — 0065); chỉ chủ xóa được file (policy ho_so_xoa_khi_het_han, 0014),
--      nên quản lý chỉ biết số thư mục mồ côi để nhờ chủ.
--   5. Trigger ho_so_khoa_cot_don_dep: người đăng nhập không UPDATE thẳng được
--      duong_dan_cv, luu_den, da_an_danh (rà soát bảo mật của chính PR này).
--      Policy ho_so_sua (0012) cho chủ / quản lý sửa MỌI cột hồ sơ của chi
--      nhánh mình. Trước 0074 điều đó vô hại với kho file; từ 0074 nút ẩn danh
--      XÓA FILE theo duong_dan_cv bằng tài khoản chủ (xóa được mọi file trong
--      kho), nên quản lý ghi đường dẫn CV của người khác vào một hồ sơ mồi, lùi
--      hạn lưu → đèn đỏ → chủ bấm → file của người khác mất. Giao diện chỉ sửa
--      trang_thai, nguoi_phu_trach, ghi_chu_buoc; ba cột này chỉ đổi qua hàm
--      definer (nộp hồ sơ, ẩn danh) — chúng chạy dưới vai chủ hàm nên đi qua.
--   6. suc_khoe_so_lieu() thêm ô don_dep — đèn "Dọn dữ liệu cá nhân" ở bảng sức
--      khỏe (web/src/lib/suc-khoe.ts), cả thương hiệu. Thân 0063 NGUYÊN VĂN, chỉ
--      thêm ô đó trước 'chi_nhanh'.
--
-- Không gắn lịch chạy: lý do của 0012 vẫn đúng (việc hủy dữ liệu cá nhân do
-- người bấm), và xóa file cần quyền xóa trong kho CV mà chỉ tài khoản chủ có.
-- Đèn nói khi nào phải bấm; lượt báo động (0060) đọc cùng số liệu.
--
-- Câu raise exception: dùng lại hai câu đã có bản tiếng Anh trong
-- web/src/lib/cau-noi-bo.ts — không câu mới.
--
-- Hàm mới: Supabase cấp sẵn EXECUTE cho authenticated, mỗi hàm tự kiểm vai ở
-- đầu thân (XEP_LOAI của test-quyen-ghi-thang-crm.mjs); khối CHỐT QUYỀN cuối
-- file thu lại khỏi anon. Kiểm thử: crm/test/test-tuyen-dung-xoa-cv.mjs.
-- =============================================================================


-- =============================================================================
-- 1 · ĐƯỜNG DẪN CV SẮP ẨN DANH
-- =============================================================================
-- Cùng điều kiện "quá hạn" với an_danh_ho_so_het_han: luu_den là ngày cuối còn
-- giữ, nên hồ sơ quá hạn khi luu_den nhỏ hơn hôm nay THEO GIỜ VIỆT NAM.
create or replace function ho_so_cv_het_han()
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if co_phien_dang_nhap() and not co_vai_tro(array['chu_so_huu']::vai_tro[]) then
    raise exception 'Chỉ chủ sở hữu mới chạy được việc dọn hồ sơ hết hạn'
      using errcode = 'insufficient_privilege';
  end if;

  return coalesce((
    select array_agg(h.duong_dan_cv order by h.luu_den, h.id)
    from ho_so_ung_tuyen h
    where not h.da_an_danh
      and h.luu_den < hom_nay_vn()
      and h.duong_dan_cv is not null), '{}'::text[]);
end;
$$;

comment on function ho_so_cv_het_han() is
  'Đường dẫn CV (dạng ho-so-ung-tuyen/<vé>/<tên>) của hồ sơ quá hạn lưu chưa ẩn danh. Chỉ chủ sở hữu. Web xóa các file này trong kho rồi mới gọi an_danh_ho_so_het_han (0074).';


-- =============================================================================
-- 2 · ẨN DANH — CHỈ HỒ SƠ ĐÃ HẾT FILE
-- =============================================================================
-- Hai lượt chồng nhau (bấm đúp): lượt sau chờ khóa dòng của lượt trước rồi
-- đánh giá lại điều kiện "not da_an_danh" — mỗi hồ sơ ẩn danh đúng một lần.
create or replace function an_danh_ho_so_het_han(p_cv_da_xoa text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_so int;
begin
  if co_phien_dang_nhap() and not co_vai_tro(array['chu_so_huu']::vai_tro[]) then
    raise exception 'Chỉ chủ sở hữu mới chạy được việc dọn hồ sơ hết hạn'
      using errcode = 'insufficient_privilege';
  end if;

  with da_don as (
    update ho_so_ung_tuyen
    set ho_ten = null, sdt = null, email = null, duong_dan_cv = null,
        gioi_thieu = null, kinh_nghiem = null, ghi_chu_noi_bo = null,
        ip = null, dong_y_ip = null,
        da_an_danh = true,
        trang_thai = 'da_an_danh'
    where not da_an_danh and luu_den < hom_nay_vn()
      and (duong_dan_cv is null or duong_dan_cv = any(coalesce(p_cv_da_xoa, '{}'::text[])))
    returning 1)
  select count(*) into v_so from da_don;

  return v_so;
end;
$$;

comment on function an_danh_ho_so_het_han(text[]) is
  'Ẩn danh hồ sơ quá hạn lưu không có CV, hoặc có CV đã xóa khỏi kho (p_cv_da_xoa: đường dẫn nguyên dạng duong_dan_cv mà web đã xóa và kiểm lại). Hồ sơ còn file giữ nguyên. Chỉ chủ sở hữu (0074).';


-- =============================================================================
-- 3 · don_dep_ho_so_het_han() — KHÔNG CÒN XÓA DẤU VẾT CỦA FILE
-- =============================================================================
create or replace function don_dep_ho_so_het_han()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if not co_vai_tro(array['chu_so_huu']::vai_tro[]) and co_phien_dang_nhap() then
    raise exception 'Chỉ chủ sở hữu mới chạy được việc dọn hồ sơ hết hạn'
      using errcode = 'insufficient_privilege';
  end if;

  -- Từ SQL không xóa được file trong kho: hồ sơ có CV chờ nút "Ẩn danh hồ sơ
  -- đã quá hạn lưu" ở /noi-bo/cai-dat (xóa file rồi mới ẩn danh).
  return an_danh_ho_so_het_han(array[]::text[]);
end;
$$;

comment on function don_dep_ho_so_het_han() is
  'Ẩn danh hồ sơ quá hạn lưu KHÔNG có CV (0074). Hồ sơ có CV chỉ được ẩn danh sau khi web xóa file — xem an_danh_ho_so_het_han.';


-- =============================================================================
-- 4 · THƯ MỤC CV MỒ CÔI
-- =============================================================================
-- Đường dẫn kho: <mã vé>/<tên file> (0012, 0014). So mã vé bằng chữ (id::text),
-- không ép tên thư mục sang uuid: Postgres không hứa thứ tự tính các điều kiện,
-- và một tên lạ bị ép kiểu là cả lượt hỏng.
create or replace function ho_so_thu_muc_cv_mo_coi(p_thu_muc text[])
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if co_phien_dang_nhap() and not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
    raise exception 'Chỉ chủ sở hữu hoặc quản lý mới dọn được vé tải CV'
      using errcode = 'insufficient_privilege';
  end if;

  return coalesce((
    select array_agg(t.ten order by t.ten)
    from (select distinct x as ten from unnest(p_thu_muc) x) t
    where t.ten ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      -- Vé còn hiệu lực, hoặc vừa hết hạn chưa quá một ngày: có thể đang có
      -- người bấm gửi. Cùng mốc với don_dep_phieu_tai_len().
      and not exists (select 1 from phieu_tai_len p
                      where p.id::text = t.ten and p.het_han >= now() - interval '1 day')
      and not exists (select 1 from ho_so_ung_tuyen h
                      where split_part(h.duong_dan_cv, '/', 2) = t.ten)), '{}'::text[]);
end;
$$;

comment on function ho_so_thu_muc_cv_mo_coi(text[]) is
  'Trong các tên thư mục web liệt kê từ kho ho-so-ung-tuyen: những thư mục mồ côi (mã vé không còn hiệu lực hơn một ngày, không hồ sơ chưa ẩn danh nào trỏ tới). Tên không phải mã vé không bao giờ mồ côi. Chủ sở hữu hoặc quản lý (0074).';


-- =============================================================================
-- 5 · ĐƯỜNG DẪN CV, HẠN LƯU, CỜ ẨN DANH — CHỈ ĐỔI QUA HÀM
-- =============================================================================
-- current_user: lời UPDATE thẳng qua PostgREST chạy dưới vai authenticated;
-- UPDATE bên trong hàm security definer (an_danh_ho_so_het_han) chạy dưới vai
-- chủ hàm. Không kiểm vai người (co_vai_tro): chủ sở hữu cũng chỉ đổi ba cột
-- này qua việc dọn — SQL Editor (vai postgres) vẫn sửa tay được khi cần.
create or replace function ho_so_khoa_cot_don_dep()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated')
     and (new.duong_dan_cv is distinct from old.duong_dan_cv
          or new.luu_den is distinct from old.luu_den
          or new.da_an_danh is distinct from old.da_an_danh) then
    raise exception 'Đường dẫn CV, hạn lưu và trạng thái ẩn danh của hồ sơ chỉ đổi được qua việc dọn dữ liệu ở màn Cài đặt'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

comment on function ho_so_khoa_cot_don_dep() is
  'Trigger (0074): người đăng nhập không UPDATE thẳng duong_dan_cv, luu_den, da_an_danh của hồ sơ — nút ẩn danh xóa file theo duong_dan_cv bằng quyền của chủ, nên các cột đó phải do database tự đặt.';

drop trigger if exists ho_so_khoa_cot_don_dep on ho_so_ung_tuyen;
create trigger ho_so_khoa_cot_don_dep
  before update on ho_so_ung_tuyen
  for each row execute function ho_so_khoa_cot_don_dep();


-- =============================================================================
-- 6 · SỐ LIỆU BẢNG SỨC KHỎE — ô don_dep
-- =============================================================================
-- Thân 0063 NGUYÊN VĂN, chỉ thêm ô don_dep trước 'chi_nhanh'. Ngưỡng:
--   · hồ sơ quá hạn lưu, chưa ẩn danh: hai nhóm không chồng nhau — quá hạn 1–7
--     ngày; quá hạn hơn 7 ngày (web: đỏ — lời hứa trên trang quyền riêng tư);
--   · vé tải CV chưa dùng, hết hạn quá 7 ngày: mỗi vé có thể còn một CV mồ côi;
--   · dữ liệu đo lường cũ hơn 97 ngày (90 ngày trang quyền riêng tư hứa, cộng
--     7 ngày chờ bấm): có hay không — su_kien_web lớn, exists dùng chỉ mục ngày.
-- Đếm cả thương hiệu, không lọc theo p_chi_nhanh_ids: việc dọn là của cả
-- thương hiệu, và số đếm không mang dữ liệu cá nhân nào.
create or replace function suc_khoe_so_lieu(p_chi_nhanh_ids uuid[], p_lech jsonb default null)
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
  v_lech := coalesce(p_lech, suc_khoe_lech_so_kho());

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
                            coalesce(t.thu_lai_luc, '-infinity'::timestamptz)) < now() - interval '30 minutes'
               -- 0063: tin máy gửi không được lấy (đặt bàn chưa xác nhận) đang chờ đúng luật.
               and not exists (select 1 from dat_ban d where d.id = t.dat_ban_id and d.trang_thai = 'cho_xac_nhan')))
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
        'lech',   coalesce((v_lech ->> v_cn.id::text)::int, 0)),

      -- 0061: đèn "Beeftown Cân" — máy quầy báo về kho (kho_may_can_bao). Không câu lỗi, không người.
      'can', jsonb_build_object(
        'gio_mo_cua',  coalesce(v_ch.gio_mo_cua, 10),
        'gio_dong_cua', coalesce(v_ch.gio_dong_cua, 23),
        'may', (select coalesce(jsonb_agg(jsonb_build_object(
                          'bao_luc', mc.bao_luc, 'giu_ket_noi', mc.giu_ket_noi, 'can_tra_loi_luc', mc.can_tra_loi_luc,
                          'tu_gui', mc.tu_gui, 'lech_so', mc.lech_so, 'lech_tu', mc.lech_tu, 'gui_loi', mc.gui_loi)
                        order by mc.bao_luc), '[]'::jsonb)
                from kho_may_can mc
                where mc.chi_nhanh_id = v_cn.id and mc.bao_luc > now() - interval '14 days'))
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
    -- 0060: việc chạy nền báo động — đèn "Báo động" của bảng (web/src/lib/suc-khoe.ts).
    'bao_dong', jsonb_build_object(
      'lan_chay_cuoi', v_bd.lan_chay_cuoi,
      'kenh',          coalesce(v_bd.kenh, 'khong'),
      'co_loi',        v_bd.loi_cuoi is not null,
      'lan_gui_cuoi',  v_bd.lan_gui_cuoi),
    -- 0074: đèn "Dọn dữ liệu cá nhân" — việc dọn chỉ chạy khi chủ bấm (0012), đèn nói khi nào phải bấm.
    -- Hai nhóm hồ sơ không chồng nhau: quá hạn hơn 7 ngày > quá hạn 1–7 ngày.
    'don_dep', jsonb_build_object(
      'ho_so_qua_han',        (select count(*) from ho_so_ung_tuyen h
                               where not h.da_an_danh and h.luu_den < hom_nay_vn() and h.luu_den >= hom_nay_vn() - 7),
      'ho_so_qua_han_7_ngay', (select count(*) from ho_so_ung_tuyen h
                               where not h.da_an_danh and h.luu_den < hom_nay_vn() - 7),
      've_qua_han',           (select count(*) from phieu_tai_len p
                               where not p.da_dung and p.het_han < now() - interval '7 days'),
      'su_kien_qua_han',      exists (select 1 from su_kien_web s where s.ngay < hom_nay_vn() - 97)),
    'chi_nhanh', v_ds);
end;
$$;

comment on function suc_khoe_so_lieu(uuid[], jsonb) is
  'NỘI BỘ (0060, 0061 thêm ô can, 0063 cho_qua_han bỏ tin đặt bàn chưa xác nhận — máy gửi không lấy, 0074 thêm ô don_dep — đèn Dọn dữ liệu cá nhân): số liệu bảng sức khỏe cho các chi nhánh ĐANG HOẠT ĐỘNG trong danh sách, không kiểm vai. p_lech: đối soát sổ kho đã có (null = quét). Chỉ gọi từ suc_khoe_he_thong() (chủ / quản lý) và bao_dong_bat_dau_luot() (máy báo động). Không ai đăng nhập gọi thẳng được.';


-- =============================================================================
-- 7 · HÀM NỘI BỘ — giữ suc_khoe_so_lieu ngoài tầm authenticated (như 0063 mục 5)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function suc_khoe_so_lieu(uuid[], jsonb) from authenticated';
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


-- =============================================================================
-- KIỂM TRA BẰNG TAY TRÊN PROJECT Beeftown-thu — BẮT BUỘC, vì npm test không có
-- Storage (PGlite không có schema storage, xem 0014)
-- =============================================================================
-- Sau khi chạy migration này và deploy web lên bản thử:
--
--  1. Tài khoản QUẢN LÝ: Storage → ho-so-ung-tuyen mở được danh sách thư mục
--     (policy ho_so_quan_ly_xem). Ở /noi-bo/cai-dat bấm "Xóa CV mồ côi và dọn
--     vé" khi kho có thư mục mồ côi → câu nhờ chủ nhà hàng, số vé KHÔNG đổi,
--     file vẫn còn (quản lý không có policy xóa).
--  2. Nộp ở /tuyen-dung (tin có hỏi CV) hai lần cùng số điện thoại, cùng tin,
--     trong cùng ngày, lần hai kèm CV → database từ chối lần hai (trùng) sau khi
--     file đã lên → Storage có thêm một thư mục <mã vé>/ mà không hồ sơ nào trỏ
--     tới. (Số điện thoại sai dạng thì từ 0074 web không tải CV lên nữa.)
--     Đợi vé quá hạn hơn một ngày, hoặc trong SQL Editor:
--       update phieu_tai_len set het_han = now() - interval '2 days' where id = '<mã vé>';
--     Tài khoản CHỦ bấm "Xóa CV mồ côi và dọn vé" → câu "Đã xóa 1 file CV mồ
--     côi"; Storage không còn thư mục đó; vé đã bị xóa.
--  3. Nộp một hồ sơ kèm CV hợp lệ; SQL Editor:
--       update ho_so_ung_tuyen set luu_den = hom_nay_vn() - 1 where ma_ho_so = '<mã>';
--     Đèn "Dọn dữ liệu cá nhân" ở /noi-bo chuyển vàng. Tài khoản CHỦ bấm "Ẩn
--     danh hồ sơ đã quá hạn lưu" → "Đã ẩn danh 1 hồ sơ … Đã xóa 1 file CV";
--     Storage không còn file; dòng hồ sơ còn nhưng họ tên / số điện thoại trống;
--     đèn xanh lại.
--  4. Lặp bước 3, nhưng bấm nút bằng tài khoản QUẢN LÝ → nút không hiện (chỉ chủ);
--     gọi thẳng rpc('ho_so_cv_het_han') bằng khóa của quản lý → bị từ chối.
--  5. Trong Storage, đặt một file vào thư mục của hồ sơ CÒN HẠN rồi bấm bước 2
--     lần nữa → file đó KHÔNG bị xóa (hồ sơ chưa ẩn danh trỏ vào thư mục).
--  6. Bằng khóa anon + phiên của QUẢN LÝ, gọi thẳng PostgREST:
--       PATCH /rest/v1/ho_so_ung_tuyen?id=eq.<một hồ sơ của chi nhánh mình>
--       {"luu_den":"2020-01-01"}
--     → bị từ chối với câu "… chỉ đổi được qua việc dọn dữ liệu ở màn Cài đặt".
--
-- Ghi lại ngày kiểm tra và người kiểm tra vào crm/README.md, mục "Nhật ký kiểm
-- tay kho file".
-- =============================================================================
