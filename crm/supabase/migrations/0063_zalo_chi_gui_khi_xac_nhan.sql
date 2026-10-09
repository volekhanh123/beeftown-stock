-- =============================================================================
-- BEEFTOWN CRM — 0063 · TIN ZALO ĐẶT BÀN CHỈ ĐI KHI NHÀ HÀNG ĐÃ XÁC NHẬN
-- =============================================================================
-- Lỗi của 0047: trigger dat_ban_zalo gọi zalo_xep_tin_dat_ban(new.id,
-- tg_op = 'INSERT', …) cho MỌI dòng dat_ban mới — kể cả yêu cầu khách vừa gửi
-- trên website / Messenger qua tao_dat_ban() dưới vai anon, lúc chưa ai gọi xác
-- nhận. Hàm xếp ngay:
--
--   · ZBS-01 "BEEFTOWN — XÁC NHẬN ĐẶT BÀN … Bàn được giữ trong 15 phút kể từ
--     giờ hẹn." — gửi trong lượt 5 phút kế tiếp;
--   · ZBS-02 "… bàn <guests> khách lúc <time> hôm nay đã sẵn sàng. … Bàn giữ 15
--     phút kể từ giờ hẹn." — hẹn trước giờ hẹn 2 tiếng.
--
-- Cả hai nói bàn ĐÃ được giữ, trong khi yêu cầu chỉ là "đã nhận" cho tới khi
-- nhân viên gọi khách và bấm "Đã gọi xác nhận" (web/src/lib/messenger.ts,
-- web/THIET-KE.md mục 5, /noi-bo/dat-ban, CLAUDE.md mục 7 cau-chu).
--
-- KHÁNH ĐÃ CHỐT (09/10/2026)
--   · Lúc khách gửi yêu cầu: KHÔNG gửi tin Zalo nào — web và Messenger đã nói
--     "đã nhận yêu cầu".
--   · Nhân viên bấm "Đã gọi xác nhận" (cho_xac_nhan → da_xac_nhan): ZBS-01 ngay,
--     ZBS-02 trước giờ hẹn 2 tiếng (bỏ khi giờ nhắc đã qua — như 0047). Chữ hai
--     mẫu GIỮ NGUYÊN: đã nộp / đã duyệt với Zalo, và lúc này đúng sự thật.
--   · Tin đã nằm trong hàng chờ cho yêu cầu chưa xác nhận (xếp theo 0047, trước
--     khi chạy file này): GIỮ LẠI — máy gửi không lấy cho tới khi đặt bàn được
--     xác nhận; khách hủy hoặc quá giờ hẹn thì tự bỏ theo đường cũ của 0047.
--
-- ĐỔI GÌ
--   1. zalo_xep_tin_dat_ban: tham số thứ hai đổi nghĩa và đổi tên p_moi ("dòng
--      mới tạo") → p_vua_xac_nhan ("vừa được nhà hàng xác nhận"). CREATE OR
--      REPLACE không đổi được tên tham số nên DROP rồi tạo lại — cùng chữ ký
--      (uuid, boolean, boolean), cùng definer + search_path, rút lại quyền gọi
--      ở cuối file. Xếp tin MỚI chỉ khi đặt bàn đang da_xac_nhan. Phần hủy / dời
--      / cập nhật tham số tin đang chờ giữ nguyên; cập nhật tham số chạy cả lúc
--      xác nhận (tin cũ đang giữ đi ra với số khách, giờ mới nhất).
--   2. zalo_sau_dat_ban: "vừa xác nhận" = UPDATE đổi trang_thai sang da_xac_nhan,
--      hoặc INSERT thẳng một dòng da_xac_nhan (policy dat_ban_them cho nhân viên
--      chèn thẳng). Đổi giờ tính như 0047. Lỗi bên trong vẫn bị nuốt: KHÔNG BAO
--      GIỜ làm hỏng việc đặt bàn hay việc xác nhận.
--   3. zalo_bat_dau_luot: thêm đúng một điều kiện ở câu chọn lô — tin của đặt
--      bàn đang cho_xac_nhan nằm yên trong hàng chờ (không lấy, không tính lần
--      thử, không hủy). Đây là chốt cuối: dù tin vào hàng chờ bằng đường nào,
--      không tin đặt bàn nào rời database khi yêu cầu chưa được xác nhận. Chỉ
--      giữ cho_xac_nhan, không giữ da_den / khong_den: 0047 đã chốt "khách đã
--      đến thì chỉ thôi nhắc lịch, ZBS-01 vẫn đi" — file này không đổi điều đó.
--      Phần còn lại nguyên văn 0047 (chưa file nào sau 0047 thay hàm này).
--   4. Tin cũ đang giữ, lúc nhà hàng xác nhận: ZBS-01 dời gui_sau về lúc xác
--      nhận (gửi ngay như tin vừa xếp, không mang mốc của lúc khách gửi); ZBS-02
--      mà giờ nhắc đã qua thì hủy — như đặt bàn xác nhận sát giờ theo đường mới.
--   5. suc_khoe_so_lieu: ô tin_zalo.cho_qua_han ("tin giao dịch đến hạn quá 30
--      phút mà chưa gửi" — đèn đỏ, có báo động) không đếm tin máy không được lấy
--      ở mục 3: chúng đang chờ đúng luật, không kẹt. Thân 0061 nguyên văn, thêm
--      đúng một điều kiện — CHỮ Y HỆT điều kiện ở mục 3 (test-zalo-xac-nhan.mjs
--      kiểm), chỉ khác tên bảng tắt (n. / t.).
--
-- CHẠY CẢ FILE MỘT LẦN. Mục 1 là DROP rồi CREATE: chạy rời từng mảnh mà mảnh
-- CREATE không chạy thì đặt bàn vẫn ghi được (trigger nuốt lỗi) nhưng không tin
-- Zalo nào được xếp nữa. SQL Editor (dán cả file) và supabase db push chạy cả
-- file trong một giao dịch. Chạy xong `npm run doi-chieu` phải báo KHỚP — thiếu
-- hàm zalo_xep_tin_dat_ban nghĩa là đúng chuyện trên.
--
-- Trigger dat_ban_zalo (after insert or update of ngay, gio, so_khach,
-- trang_thai) giữ nguyên — nó đã chạy khi trang_thai đổi.
-- Không bảng, cột, chỉ mục mới. Không câu raise exception mới. Chữ ký RPC của
-- máy và của người không đổi — web không phải đổi gì để chạy được.
--
-- Câu mới ghi vào nhat_ky_tin.loi (có bản tiếng Anh ở web/src/lib/zalo-cau-en.ts):
--   'Xác nhận khi đã sát giờ hẹn — không còn nhắc trước 2 tiếng'
--
-- Kiểm thử: crm/test/test-zalo-xac-nhan.mjs (tái hiện lỗi), test-zalo.mjs,
-- test-zalo-web.mjs, test-dat-ban-goi-lai.mjs.
-- =============================================================================


-- =============================================================================
-- 1 · XẾP TIN CHO MỘT ĐẶT BÀN — tin mới chỉ khi đã xác nhận
-- =============================================================================
drop function zalo_xep_tin_dat_ban(uuid, boolean, boolean);

create function zalo_xep_tin_dat_ban(p_dat_ban_id uuid, p_vua_xac_nhan boolean, p_doi_gio boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dat  dat_ban;
  v_bat  boolean;
  v_nhac timestamptz;
begin
  select * into v_dat from dat_ban where id = p_dat_ban_id;
  if not found then return; end if;

  v_nhac := zalo_luc_hen(v_dat.ngay, v_dat.gio) - interval '2 hours';

  -- Hủy: mọi tin đặt bàn còn chờ thôi gửi.
  if v_dat.trang_thai = 'da_huy' then
    update nhat_ky_tin set ket_qua = 'da_huy', loi = 'Khách đã hủy đặt bàn', dang_gui_tu = null
    where dat_ban_id = v_dat.id and ket_qua = 'cho_gui';
    return;
  end if;

  -- Đã đến / không đến: không nhắc lịch nữa.
  if v_dat.trang_thai in ('da_den', 'khong_den') then
    update nhat_ky_tin n set ket_qua = 'da_huy', loi = 'Đặt bàn đã kết thúc — không nhắc lịch nữa', dang_gui_tu = null
    from mau_tin m
    where m.id = n.mau_tin_id and m.ma = 'ZBS-02'
      and n.dat_ban_id = v_dat.id and n.ket_qua = 'cho_gui';
    return;
  end if;

  -- Đổi ngày/giờ: dời tin nhắc (kể cả tin đã hủy vì lần đổi trước), hoặc hủy
  -- khi giờ nhắc mới đã qua.
  if p_doi_gio then
    update nhat_ky_tin n
    set gui_sau = v_nhac, ket_qua = 'cho_gui', loi = null, lan_thu = 0,
        thu_lai_luc = null, dang_gui_tu = null
    from mau_tin m
    where m.id = n.mau_tin_id and m.ma = 'ZBS-02'
      and n.dat_ban_id = v_dat.id and n.ket_qua in ('cho_gui', 'da_huy')
      and v_nhac > now();

    update nhat_ky_tin n
    set ket_qua = 'da_huy', loi = 'Giờ hẹn mới đã sát — không còn nhắc trước 2 tiếng', dang_gui_tu = null
    from mau_tin m
    where m.id = n.mau_tin_id and m.ma = 'ZBS-02'
      and n.dat_ban_id = v_dat.id and n.ket_qua = 'cho_gui'
      and v_nhac <= now();
  end if;

  -- Vừa xác nhận mà còn tin xếp trước 0063 đang giữ: ZBS-01 đi ngay như tin vừa
  -- xếp (gui_sau = lúc xác nhận — đèn sức khỏe không coi là kẹt); ZBS-02 mà giờ
  -- nhắc đã qua thì thôi, như đường mới không xếp ZBS-02 khi xác nhận sát giờ.
  if p_vua_xac_nhan then
    update nhat_ky_tin n set gui_sau = now()
    from mau_tin m
    where m.id = n.mau_tin_id and m.ma = 'ZBS-01'
      and n.dat_ban_id = v_dat.id and n.ket_qua = 'cho_gui'
      and coalesce(n.gui_sau, n.created_at) < now();

    update nhat_ky_tin n
    set ket_qua = 'da_huy', loi = 'Xác nhận khi đã sát giờ hẹn — không còn nhắc trước 2 tiếng', dang_gui_tu = null
    from mau_tin m
    where m.id = n.mau_tin_id and m.ma = 'ZBS-02'
      and n.dat_ban_id = v_dat.id and n.ket_qua = 'cho_gui'
      and v_nhac <= now();
  end if;

  -- Ngày, giờ, số khách mới vào tham số của tin còn chờ — kể cả lúc vừa xác
  -- nhận: tin xếp trước 0063 đang được giữ đi ra với dữ liệu mới nhất.
  update nhat_ky_tin n
  set du_lieu  = zalo_du_lieu_dat_ban(v_dat.id, m.tham_so),
      noi_dung = zalo_dien_noi_dung(m.noi_dung, zalo_du_lieu_dat_ban(v_dat.id, m.tham_so))
  from mau_tin m
  where m.id = n.mau_tin_id and n.dat_ban_id = v_dat.id and n.ket_qua = 'cho_gui';

  select dang_bat into v_bat from zalo_cau_hinh where id = 1;
  if not coalesce(v_bat, false) then return; end if;

  -- 0063: ZBS-01 "XÁC NHẬN ĐẶT BÀN … Bàn được giữ" và ZBS-02 "bàn … đã sẵn
  -- sàng" chỉ đúng sự thật khi nhà hàng đã gọi xác nhận. Yêu cầu khách vừa gửi
  -- (cho_xac_nhan) không được xếp tin nào.
  if v_dat.trang_thai <> 'da_xac_nhan' then return; end if;

  if p_vua_xac_nhan then
    perform zalo_xep_tin_mot(v_dat, 'ZBS-01', now());
  end if;
  if (p_vua_xac_nhan or p_doi_gio) and v_nhac > now() then
    perform zalo_xep_tin_mot(v_dat, 'ZBS-02', v_nhac);
  end if;
end;
$$;

comment on function zalo_xep_tin_dat_ban(uuid, boolean, boolean) is
  'Trigger đặt bàn gọi: hủy / dời / cập nhật tin đang chờ; xếp ZBS-01 (ngay) và ZBS-02 (hẹn − 2 tiếng) CHỈ khi đặt bàn đã xác nhận — p_vua_xac_nhan = vừa chuyển sang da_xac_nhan (0063).';


-- =============================================================================
-- 2 · TRIGGER — "vừa xác nhận" thay cho "vừa tạo"
-- =============================================================================
-- Trigger: KHÔNG BAO GIỜ làm hỏng đặt bàn hay việc xác nhận. Chạy cả dưới anon
-- (tao_dat_ban của website) — không cần phiên, không cần quyền gì của người gọi.
create or replace function zalo_sau_dat_ban()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doi_gio      boolean := false;
  v_vua_xac_nhan boolean;
begin
  -- Lúc nhà hàng xác nhận: nhân viên bấm "Đã gọi xác nhận" (→ da_xac_nhan), hoặc
  -- chèn thẳng một đặt bàn đã xác nhận. Khách gửi form (cho_xac_nhan) thì không.
  if tg_op = 'INSERT' then
    v_vua_xac_nhan := new.trang_thai = 'da_xac_nhan';
  else
    v_vua_xac_nhan := new.trang_thai = 'da_xac_nhan' and old.trang_thai <> 'da_xac_nhan';
    v_doi_gio := (old.ngay is distinct from new.ngay) or (old.gio is distinct from new.gio);
  end if;

  begin
    perform zalo_xep_tin_dat_ban(new.id, v_vua_xac_nhan, v_doi_gio);
  exception when others then
    begin
      update zalo_cau_hinh
      set loi_cuoi = left('Xếp tin Zalo cho đặt bàn ' || coalesce(new.ma_dat_ban, new.id::text)
                          || ' lỗi: ' || sqlerrm, 500)
      where id = 1;
    exception when others then
      null;  -- ghi lỗi cũng hỏng thì thôi — đặt bàn vẫn phải thành công
    end;
  end;
  return null;
end;
$$;

comment on column mau_tin.bat_tu_dong is
  'Hệ thống tự xếp mẫu này: ZBS-01 khi nhân viên bấm "Đã gọi xác nhận", ZBS-02 trước giờ hẹn 2 tiếng — chỉ cho đặt bàn đã xác nhận (0063). Mặc định tắt.';


-- =============================================================================
-- 3 · LƯỢT GỬI CỦA MÁY — tin của đặt bàn chưa xác nhận nằm yên trong hàng chờ
-- =============================================================================
-- Nguyên văn 0047, thêm đúng một điều kiện ở câu chọn lô (đánh dấu "0063").
create or replace function zalo_bat_dau_luot(p_gioi_han integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg   zalo_cau_hinh;
  v_han   integer := least(greatest(coalesce(p_gioi_han, 50), 1), 200);
  v_gio   time := gio_vn();
  v_khung boolean;
  v_lo    jsonb := '[]'::jsonb;
  v_kt    record;
  r       record;
begin
  if not co_vai_tro(array['may_zalo']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy Zalo mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_cfg from zalo_cau_hinh where id = 1 for update;

  if not found or not v_cfg.dang_bat then
    return jsonb_build_object('khoa', false, 'dang_bat', false, 'cau_hinh', null, 'lo', '[]'::jsonb);
  end if;

  if v_cfg.dang_chay_tu is not null and v_cfg.dang_chay_tu > now() - interval '10 minutes' then
    return jsonb_build_object('khoa', true, 'dang_bat', true, 'dang_chay_tu', v_cfg.dang_chay_tu,
                              'cau_hinh', null, 'lo', '[]'::jsonb);
  end if;

  update zalo_cau_hinh set dang_chay_tu = now() where id = 1;

  v_khung := v_gio >= v_cfg.gio_tu and v_gio < v_cfg.gio_den;

  -- Tin đặt bàn mà giờ hẹn đã qua (Zalo tắt một lúc, máy ngừng chạy…) thì thôi.
  update nhat_ky_tin n
  set ket_qua = 'da_huy', loi = 'Đã quá giờ hẹn — không gửi tin đặt bàn nữa', dang_gui_tu = null
  from dat_ban d
  where n.dat_ban_id = d.id and n.ket_qua = 'cho_gui'
    and (n.dang_gui_tu is null or n.dang_gui_tu < now() - interval '10 minutes')
    and zalo_luc_hen(d.ngay, d.gio) <= now();

  -- Lấy ra 5 lần mà không lần nào báo được kết quả.
  update nhat_ky_tin
  set ket_qua = 'that_bai', loi = 'Đã thử 5 lần mà không nhận được kết quả', dang_gui_tu = null
  where ket_qua = 'cho_gui' and lan_thu >= 5
    and (dang_gui_tu is null or dang_gui_tu < now() - interval '10 minutes');

  for r in
    select n.id, n.khach_hang_id, n.sdt_gui, n.du_lieu, n.lan_thu, n.dat_ban_id,
           coalesce(n.loai_tin, m.loai) as loai,
           m.id as mau_id, m.ma, m.ma_zalo, m.da_duyet, m.dang_dung, m.bat_tu_dong
    from nhat_ky_tin n
    left join mau_tin m on m.id = n.mau_tin_id
    where n.ket_qua = 'cho_gui'
      and coalesce(n.gui_sau, n.created_at) <= now()
      and (n.thu_lai_luc is null or n.thu_lai_luc <= now())
      and (n.dang_gui_tu is null or n.dang_gui_tu < now() - interval '10 minutes')
      and (coalesce(n.loai_tin, m.loai) is distinct from 'cham_soc' or v_khung)
      -- 0063: đặt bàn chưa được xác nhận → tin nằm yên (không lấy, không tính lần
      -- thử, không hủy). Xác nhận xong lượt sau lấy; khách hủy / quá giờ hẹn thì bị
      -- hủy ở trên như mọi tin đặt bàn.
      and not exists (select 1 from dat_ban d where d.id = n.dat_ban_id and d.trang_thai = 'cho_xac_nhan')
    order by coalesce(n.gui_sau, n.created_at), n.created_at
    limit v_han
    for update of n skip locked
  loop
    if r.mau_id is null or not r.dang_dung or not r.da_duyet or r.ma_zalo is null
       or (r.dat_ban_id is not null and not r.bat_tu_dong) then
      update nhat_ky_tin
      set ket_qua = 'da_huy', loi = 'Mẫu tin chưa được Zalo duyệt hoặc đã tắt', dang_gui_tu = null
      where id = r.id;
      continue;
    end if;

    select * into v_kt from kiem_duoc_phep_gui(r.khach_hang_id, r.loai, r.id, now());
    if not v_kt.duoc_gui then
      update nhat_ky_tin
      set ket_qua = 'bi_tu_choi', loi = v_kt.ly_do, dang_gui_tu = null
      where id = r.id;
      continue;
    end if;

    update nhat_ky_tin set dang_gui_tu = now(), lan_thu = lan_thu + 1 where id = r.id;

    v_lo := v_lo || jsonb_build_array(jsonb_build_object(
      'id', r.id, 'sdt', r.sdt_gui, 'template_id', r.ma_zalo, 'mau_ma', r.ma,
      'loai_tin', r.loai, 'du_lieu', r.du_lieu, 'lan_thu', r.lan_thu + 1));
  end loop;

  return jsonb_build_object(
    'khoa', false,
    'dang_bat', true,
    'trong_khung_cham_soc', v_khung,
    'cau_hinh', jsonb_build_object(
      'app_id', v_cfg.app_id, 'oa_id', v_cfg.oa_id, 'che_do', v_cfg.che_do,
      'refresh_token_ma_hoa', v_cfg.refresh_token_ma_hoa,
      'access_token_ma_hoa', v_cfg.access_token_ma_hoa,
      'het_han_luc', v_cfg.het_han_luc),
    'lo', v_lo);
end;
$$;


comment on function zalo_bat_dau_luot is
  'Máy Zalo: khóa lượt 10 phút, trả cấu hình (token bản mã) và lô tin đến hạn đã kiểm lại duoc_phep_gui và khung giờ (0047). Tin của đặt bàn chưa xác nhận không được lấy (0063).';


-- =============================================================================
-- 4 · SỐ LIỆU BẢNG SỨC KHỎE — tin đang giữ không phải tin kẹt
-- =============================================================================
-- Thân 0061 NGUYÊN VĂN, chỉ thêm điều kiện "0063" vào ô tin_zalo.cho_qua_han. Chữ y hệt
-- điều kiện ở câu chọn lô của zalo_bat_dau_luot ở trên (n. → t.): tin máy không được
-- lấy thì không phải tin máy đang để kẹt.
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
    'chi_nhanh', v_ds);
end;
$$;

comment on function suc_khoe_so_lieu(uuid[], jsonb) is
  'NỘI BỘ (0060, 0061 thêm ô can, 0063 cho_qua_han bỏ tin đặt bàn chưa xác nhận — máy gửi không lấy): số liệu bảng sức khỏe cho các chi nhánh ĐANG HOẠT ĐỘNG trong danh sách, không kiểm vai. p_lech: đối soát sổ kho đã có (null = quét). Chỉ gọi từ suc_khoe_he_thong() (chủ / quản lý) và bao_dong_bat_dau_luot() (máy báo động). Không ai đăng nhập gọi thẳng được.';


-- =============================================================================
-- 5 · HÀM NỘI BỘ — rút khỏi authenticated (như 0047 mục 12, 0061 mục 6)
-- =============================================================================
-- DROP + CREATE trả lại quyền mặc định của Supabase (anon, authenticated, PUBLIC).
-- Khối CHỐT QUYỀN dưới đây thu anon / PUBLIC; authenticated thu ở đây.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function zalo_xep_tin_dat_ban(uuid, boolean, boolean) from authenticated';
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
