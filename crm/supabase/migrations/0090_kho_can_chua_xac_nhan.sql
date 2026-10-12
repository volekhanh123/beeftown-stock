-- =============================================================================
-- BEEFTOWN — 0090 · BEEFTOWN CÂN: CỜ "CHƯA XÁC NHẬN" (Beeftown Cân 2.9.3)
-- =============================================================================
-- PHẢI CHẠY SAU 0061 (kho_may_can, kho_may_can_bao, kho_phien_pha_can), 0074 (thân suc_khoe_so_lieu mới nhất)
-- VÀ 0084 (khối CHỐT QUYỀN cuối file là của 0084: cấp tra_cuu_mot_dat_ban, không còn tra_cuu_dat_ban /
-- ghi_nhat_ky_tra_cuu cho anon).
--
-- Lỗi (rà soát nợ kỹ thuật 11/10/2026, tái hiện trên cân giả — can-app/test/thu.ts 6g6): cổng hai chiều
-- 33581 của cân bận chốc lát (phần mềm của hãng TM-xA đang mở, cân đang lưu) → Beeftown Cân gửi rơi về
-- cổng 33571 (cân của quán bỏ qua cổng này từ 02/10/2026) → đọc lại cân không được ("khong-doc"). Bản 2.6–
-- 2.9.2 vẫn ghi tren-can.tsv như cân đã nhận, nên lần báo kho kế tiếp gửi lech_so = 0 và TÊN Ô MỚI trong
-- tren_can → trang pha lóc hiện "Cân sẵn sàng" xanh trong khi cân vẫn tên cũ: tem in sai số tảng.
--
-- Beeftown Cân 2.9.3 chỉ ghi nhận khi đọc lại khớp (tren_can là thứ cân ĐÃ XÁC NHẬN) và báo thêm:
--   · chua_xac_nhan của MÁY: lần gửi gần nhất cân chưa xác nhận (chưa đọc lại được / đọc lại lệch), hay lần
--     xoá qua WiFi hỏng giữa chừng;
--   · chua_xac_nhan của từng DÒNG tren_can: cân có thể đang khác dòng đó (dòng có lần gửi chờ xác nhận khác
--     dòng đã xác nhận; đọc lại lệch / xoá hỏng thì mọi dòng). Lần gửi lại cả danh sách y hệt không đánh dấu
--     dòng nào — một lần đếm ngược HSD chưa đọc lại được không chặn in tem mọi ô ở trang pha lóc.
-- File này:
--
--   1 · kho_may_can: thêm chua_xac_nhan (mặc định false — máy quầy trước 2.9.3 không gửi cờ) và
--       chua_xac_nhan_tu (database ghi lần đầu thấy cờ bật, như lech_tu).
--   2 · kho_may_can_bao: thân 0061 NGUYÊN VĂN, chỉ thêm ghi hai cột đó và giữ cờ của từng dòng tren_can
--       (chỉ đúng true là bật). Cùng chữ ký, cùng quyền (xem).
--   3 · kho_phien_pha_can: thân 0061 NGUYÊN VĂN, chỉ thêm chua_xac_nhan vào mỗi dòng tren_can (cờ của dòng
--       đó) và chua_xac_nhan / chua_xac_nhan_tu vào danh sách máy. Trang pha lóc
--       (web/src/lib/kho/danh-muc-can.ts, tomTatCanPhien) không nói "Cân sẵn sàng" theo dòng chưa xác nhận.
--   4 · suc_khoe_so_lieu: thân 0074 NGUYÊN VĂN, chỉ thêm chua_xac_nhan / chua_xac_nhan_tu vào mỗi máy của
--       ô `can` — đèn "Beeftown Cân" vàng khi máy chưa xác nhận quá PHUT_LECH_CAN phút (web/src/lib/suc-khoe.ts),
--       kể cả khi lech_so = 0 (máy vừa lên từ 2.9.2, kho quay về như lần đã xác nhận).
--   Cuối file: khối CHỐT QUYỀN chép NGUYÊN VĂN từ 0084 (chép khối cũ hơn sẽ cấp lại cho anon hai hàm 0084 đã thu).
-- Triển khai: chạy được trước hay sau khi máy quầy lên 2.9.3 / web mới — khóa thiếu là false.
-- =============================================================================


-- =============================================================================
-- 1 · CỘT MỚI
-- =============================================================================
alter table kho_may_can
  add column chua_xac_nhan    boolean not null default false,   -- 0090: lần gửi gần nhất cân chưa xác nhận (máy quầy báo)
  add column chua_xac_nhan_tu timestamptz;                       -- 0090: chưa xác nhận từ lúc nào (database ghi lần đầu thấy)

comment on column kho_may_can.chua_xac_nhan is
  'Beeftown Cân 2.9.3 (0090): lần gửi gần nhất cân chưa xác nhận (chưa đọc lại được / đọc lại lệch) hay lần xoá qua WiFi hỏng — cân có thể khác tren_can. Máy trước 2.9.3: luôn false.';
comment on column kho_may_can.chua_xac_nhan_tu is
  'Lúc database thấy chua_xac_nhan bật lần đầu (0090); hết chưa xác nhận thì null.';


-- =============================================================================
-- 2 · MÁY QUẦY BÁO TRẠNG THÁI — thêm chua_xac_nhan
-- =============================================================================
-- p_bao: như 0061, thêm chua_xac_nhan (boolean; thiếu / sai kiểu = false) và chua_xac_nhan trong mỗi dòng tren_can.
create or replace function kho_may_can_bao(p_chi_nhanh_id uuid, p_ma_may uuid, p_bao jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nv      nhan_su;
  v_mac     text;
  v_pb      text;
  v_lech    int;
  v_tren    jsonb;
  v_tra_loi timestamptz;
  v_gui     timestamptz;
  v_giay    text;
  v_so_o    int;
  v_cxn     boolean;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';
  end if;
  if p_ma_may is null then
    raise exception 'Thiếu mã máy quầy' using errcode = 'check_violation';
  end if;
  if p_bao is null or jsonb_typeof(p_bao) <> 'object' then
    raise exception 'Dữ liệu máy quầy báo không đúng dạng' using errcode = 'check_violation';
  end if;

  -- Mỗi ô kiểm dạng TRƯỚC khi đổi kiểu (CASE lồng: không phụ thuộc thứ tự tính của AND).
  v_pb := case when jsonb_typeof(p_bao -> 'phien_ban') = 'string'
                and (p_bao ->> 'phien_ban') ~ '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' then p_bao ->> 'phien_ban' end;
  v_mac := case when jsonb_typeof(p_bao -> 'mac_can') = 'string'
                 and upper(p_bao ->> 'mac_can') ~ '^[0-9A-F]{12}$' then upper(p_bao ->> 'mac_can') end;
  v_lech := case when jsonb_typeof(p_bao -> 'lech_so') = 'number' then
              case when (p_bao ->> 'lech_so') ~ '^[0-9]{1,5}$' then (p_bao ->> 'lech_so')::int end end;
  -- Số giây từ lần cân trả lời / gửi được (0 – 30 ngày); thiếu hay sai kiểu = chưa biết (null), không phải "vừa xong".
  v_giay := case when jsonb_typeof(p_bao -> 'can_tra_loi_giay') = 'number' then p_bao ->> 'can_tra_loi_giay' end;
  v_tra_loi := case when v_giay ~ '^[0-9]{1,7}$' then
                 case when v_giay::int <= 2592000 then now() - make_interval(secs => v_giay::int) end end;
  v_giay := case when jsonb_typeof(p_bao -> 'gui_giay') = 'number' then p_bao ->> 'gui_giay' end;
  v_gui := case when v_giay ~ '^[0-9]{1,7}$' then
             case when v_giay::int <= 2592000 then now() - make_interval(secs => v_giay::int) end end;

  -- Dòng trên cân: chỉ giữ dòng MÃ Ô (kho_o_ma) — trang pha lóc chỉ cần những dòng đó.
  if jsonb_typeof(p_bao -> 'tren_can') = 'array' then
    if jsonb_array_length(p_bao -> 'tren_can') > 4000 then
      raise exception 'Tối đa 4000 dòng hàng trên cân một lần báo' using errcode = 'check_violation';
    end if;
    with dong as (
      select case when jsonb_typeof(d -> 'plu') = 'number' then
               case when (d ->> 'plu') ~ '^[0-9]{1,7}$' then (d ->> 'plu')::int end end as plu,
             case when jsonb_typeof(d -> 'ma_can') = 'string' then
               case when (d ->> 'ma_can') ~ '^[0-9]{1,6}$' then ltrim(d ->> 'ma_can', '0') end end as ma_can,
             left(regexp_replace(case when jsonb_typeof(d -> 'ten') = 'string' then d ->> 'ten' else '' end,
                                 '[[:cntrl:]]', '', 'g'), 40) as ten,
             coalesce((select jsonb_agg(left(regexp_replace(ph #>> '{}', '[[:cntrl:]]', '', 'g'), 16))
                       from (select ph from jsonb_array_elements(
                               case when jsonb_typeof(d -> 'phim') = 'array' then d -> 'phim' else '[]'::jsonb end) ph
                             where jsonb_typeof(ph) = 'string' limit 8) p8), '[]'::jsonb) as phim,
             -- 0090: cân có thể đang khác dòng này — chỉ đúng true là bật.
             coalesce(d -> 'chua_xac_nhan' = 'true'::jsonb, false) as chua_xac_nhan
      from jsonb_array_elements(p_bao -> 'tren_can') d
      where jsonb_typeof(d) = 'object'
    ), o as (
      select distinct on (x.ma_can) x.plu, x.ma_can, x.ten, x.phim, x.chua_xac_nhan
      from dong x
      where x.plu between 1 and 9999980
        and exists (select 1 from kho_o_ma om where om.ma_can = x.ma_can)
      order by x.ma_can, x.plu
    )
    select coalesce(jsonb_agg(jsonb_build_object('plu', o.plu, 'ma_can', o.ma_can, 'ten', o.ten, 'phim', o.phim,
                                                 'chua_xac_nhan', o.chua_xac_nhan)
                              order by o.plu), '[]'::jsonb) into v_tren
    from o;
  end if;

  v_nv := nhan_su_hien_tai();
  -- Hai lần báo cùng lúc (hai cửa sổ, gửi lại): ON CONFLICT ghi lần lượt, một dòng mỗi máy.
  -- 0090: chua_xac_nhan — chỉ đúng true là bật; thiếu / sai kiểu (máy quầy trước 2.9.3) = false.
  v_cxn := coalesce(p_bao -> 'chua_xac_nhan' = 'true'::jsonb, false);
  insert into kho_may_can as m (chi_nhanh_id, ma_may, phien_ban, mac_can, bao_luc, nguoi, giu_ket_noi, can_tra_loi_luc,
                                tu_gui, lech_so, lech_tu, gui_loi, gui_luc, tren_can, chua_xac_nhan, chua_xac_nhan_tu)
  values (p_chi_nhanh_id, p_ma_may, v_pb, v_mac, now(), v_nv.id,
          coalesce(p_bao -> 'giu_ket_noi' = 'true'::jsonb, false), v_tra_loi,
          coalesce(p_bao -> 'tu_gui' = 'true'::jsonb, false), v_lech, case when v_lech > 0 then now() end,
          coalesce(p_bao -> 'gui_loi' = 'true'::jsonb, false), v_gui, coalesce(v_tren, '[]'::jsonb),
          v_cxn, case when v_cxn then now() end)
  on conflict (chi_nhanh_id, ma_may) do update set
    phien_ban       = coalesce(excluded.phien_ban, m.phien_ban),
    mac_can         = coalesce(excluded.mac_can, m.mac_can),
    bao_luc         = now(),
    nguoi           = excluded.nguoi,
    giu_ket_noi     = excluded.giu_ket_noi,
    -- Mốc giờ không bao giờ lùi (lần báo cũ đến sau, máy vừa mở lại chưa nghe cân): GREATEST bỏ qua null.
    can_tra_loi_luc = greatest(excluded.can_tra_loi_luc, m.can_tra_loi_luc),
    tu_gui          = excluded.tu_gui,
    lech_so         = excluded.lech_so,
    -- Còn lệch thì giữ mốc bắt đầu lệch; hết lệch (hay chưa biết) thì xóa.
    lech_tu         = case when excluded.lech_so > 0 then coalesce(case when m.lech_so > 0 then m.lech_tu end, now()) end,
    gui_loi         = excluded.gui_loi,
    gui_luc         = greatest(excluded.gui_luc, m.gui_luc),
    tren_can        = case when v_tren is null then m.tren_can else excluded.tren_can end,
    chua_xac_nhan   = excluded.chua_xac_nhan,
    -- 0090: còn chưa xác nhận thì giữ mốc bắt đầu; đã xác nhận thì xóa (như lech_tu).
    chua_xac_nhan_tu = case when excluded.chua_xac_nhan then coalesce(case when m.chua_xac_nhan then m.chua_xac_nhan_tu end, now()) end
  returning jsonb_array_length(m.tren_can) into v_so_o;

  return jsonb_build_object('luc', now(), 'so_o_tren_can', v_so_o);
end;
$$;

comment on function kho_may_can_bao(uuid, uuid, jsonb) is
  'Beeftown Cân ở máy quầy báo trạng thái (quyền xem, 0061; 0090 thêm chua_xac_nhan): phiên bản, MAC cân, cân trả lời cách đây bao nhiêu giây, tự gửi, số hàng lệch kho, tự gửi hỏng, gửi được cách đây bao nhiêu giây, lần gửi gần nhất cân chưa xác nhận, dòng ô mã đang trên cân (tren_can null = không đổi). Gọi lại bao nhiêu lần cũng một dòng mỗi máy. Trả {luc, so_o_tren_can}.';


-- =============================================================================
-- 3 · TRANG PHA LÓC — kèm cờ chua_xac_nhan của máy quầy
-- =============================================================================
create or replace function kho_phien_pha_can(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ph     kho_phien_pha;
  v_cd     kho_cai_dat;
  v_tang   boolean;
  v_o      jsonb;
  v_thuong jsonb;
  v_may    jsonb;
begin
  select * into v_ph from kho_phien_pha where id = p_id;
  if not found or not (kho_duoc(v_ph.chi_nhanh_id, 'pha_loc') or kho_duoc(v_ph.chi_nhanh_id, 'xem_gia')) then
    raise exception 'Không tìm thấy phiên pha lóc, hoặc tài khoản không được xem'
      using errcode = 'insufficient_privilege';
  end if;
  select coalesce(m.theo_tang, false) into v_tang from kho_mat_hang m where m.id = v_ph.mat_hang_vao_id;
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_ph.chi_nhanh_id;

  with may as (
    -- Máy quầy của chi nhánh còn báo trong 14 ngày (máy im lâu hơn coi như đã thôi dùng).
    select * from kho_may_can mc
    where mc.chi_nhanh_id = v_ph.chi_nhanh_id and mc.bao_luc > now() - interval '14 days'
  ), quet as (
    -- Nhãn đã quét của phiên, giải mã lại theo mẫu của chi nhánh để lấy mã cân.
    select q.mat_hang_id, d.ma_can, q.so_kg
    from kho_phien_pha_quet q
    cross join lateral kho_doc_ma_vach(q.ma, v_cd.mau_ma_vach, v_cd.so_le_kg) d
    where q.phien_pha_id = p_id and d.loi is null
  ), o as (
    select m.ten, o.so_o, jsonb_build_object(
      'giao_id', g.id, 'o_ma_id', o.id, 'mat_hang_id', m.id, 'ten_hang', m.ten, 'so_o', o.so_o, 'ma_can', o.ma_can,
      'so_tang', lt.so_tang, 'dang_giu', g.den_luc is null,
      -- Phiên giữ ô tới lúc chốt, hay tới lúc ô được trả nếu trả trước (quản lý giải phóng) — LEAST bỏ qua null.
      'tu_luc', g.tu_luc, 'den_luc', least(v_ph.chot_luc, g.den_luc),
      'quet', (select count(*) from quet q where q.ma_can = o.ma_can),
      'quet_kg', (select coalesce(sum(q.so_kg), 0) from quet q where q.ma_can = o.ma_can),
      'in', ti.so, 'in_kg', ti.kg,
      -- 0090: kèm cờ chua_xac_nhan của dòng (máy báo cân có thể đang khác dòng đó) — trang không nói "Cân sẵn sàng" theo nó.
      'tren_can', (select coalesce(jsonb_agg(jsonb_build_object('plu', e -> 'plu', 'ten', e -> 'ten', 'phim', e -> 'phim',
                                                                'bao_luc', mc.bao_luc,
                                                                'chua_xac_nhan', coalesce(e -> 'chua_xac_nhan' = 'true'::jsonb, false))
                                             order by mc.bao_luc desc), '[]'::jsonb)
                   from may mc
                   cross join lateral jsonb_array_elements(mc.tren_can) e
                   where e ->> 'ma_can' = o.ma_can)
    ) as x
    from kho_o_ma_giao g
    join kho_o_ma o on o.id = g.o_ma_id
    join kho_mat_hang m on m.id = o.mat_hang_id
    left join lateral (select min(v.lo_id::text)::uuid as lo_vao_id from kho_phien_pha_vao v
                       where v.phien_pha_id = g.phien_pha_id) lv on true
    left join kho_lo lt on lt.id = lv.lo_vao_id
    -- Tem cân in bằng mã ô trong lúc phiên giữ ô: từ lúc giao tới lúc chốt hay lúc ô được trả, cái nào sớm hơn
    -- (chưa chốt, còn giữ: tới giờ) — ô trả sớm rồi giao phiên khác thì tem của phiên kia không tính vào đây.
    left join lateral (select count(*) as so, coalesce(sum(t.so_kg), 0) as kg from kho_can_tem t
                       where t.chi_nhanh_id = v_ph.chi_nhanh_id and t.ma_can = o.ma_can
                         and t.in_luc >= g.tu_luc
                         and t.in_luc < coalesce(least(v_ph.chot_luc, g.den_luc), now())) ti on true
    where g.phien_pha_id = p_id
  ), thuong as (
    -- Phiên theo tảng: nhãn in bằng mã THƯỜNG (mã món, mã giảm) của phần cắt có ô — không mang số tảng.
    select q.mat_hang_id, m.ten, q.ma_can, count(*)::int as so_nhan, sum(q.so_kg) as so_kg
    from quet q
    join kho_mat_hang m on m.id = q.mat_hang_id
    where v_tang
      and not exists (select 1 from kho_o_ma om where om.ma_can = q.ma_can)
      and exists (select 1 from kho_o_ma om where om.mat_hang_id = q.mat_hang_id)
    group by q.mat_hang_id, m.ten, q.ma_can
  )
  select (select coalesce(jsonb_agg(o.x order by o.ten, o.so_o), '[]'::jsonb) from o),
         (select coalesce(jsonb_agg(jsonb_build_object('mat_hang_id', t.mat_hang_id, 'ten', t.ten, 'ma_can', t.ma_can,
                                                       'so_nhan', t.so_nhan, 'so_kg', t.so_kg) order by t.ten, t.ma_can), '[]'::jsonb)
          from thuong t),
         (select coalesce(jsonb_agg(jsonb_build_object(
                   'bao_luc', mc.bao_luc, 'phien_ban', mc.phien_ban, 'giu_ket_noi', mc.giu_ket_noi,
                   'can_tra_loi_luc', mc.can_tra_loi_luc, 'tu_gui', mc.tu_gui, 'lech_so', mc.lech_so, 'lech_tu', mc.lech_tu,
                   'gui_loi', mc.gui_loi, 'gui_luc', mc.gui_luc, 'nhat_ky_luc', mc.nhat_ky_luc,
                   'chua_xac_nhan', mc.chua_xac_nhan, 'chua_xac_nhan_tu', mc.chua_xac_nhan_tu) order by mc.bao_luc desc), '[]'::jsonb)
          from may mc)
  into v_o, v_thuong, v_may;

  return jsonb_build_object(
    'luc', now(),
    'theo_tang', coalesce(v_tang, false),
    'co_mau_ma_vach', v_cd.mau_ma_vach is not null,
    'o', v_o,
    'nhan_thuong', v_thuong,
    'may', v_may);
end;
$$;

comment on function kho_phien_pha_can(uuid) is
  'Trang pha lóc (quyền pha_loc hoặc xem_gia, 0061; 0090 thêm chua_xac_nhan): mỗi ô của phiên — đang giữ không, trên cân (số PLU, tên, phím, dòng đó cân đã xác nhận chưa, theo từng máy quầy), số nhãn đã quét bằng mã ô, số tem cân in bằng mã ô từ lúc giao tới lúc chốt; nhãn mã thường của phần cắt có ô (phiên theo tảng); các máy quầy báo trong 14 ngày. Không tiền.';


-- =============================================================================
-- 4 · SỐ LIỆU BẢNG SỨC KHỎE — máy của ô `can` kèm chua_xac_nhan
-- =============================================================================
-- Thân 0074 (bản mới nhất — 0074 thêm ô don_dep) NGUYÊN VĂN, chỉ thêm chua_xac_nhan / chua_xac_nhan_tu vào mỗi máy của ô `can`.
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
                          'tu_gui', mc.tu_gui, 'lech_so', mc.lech_so, 'lech_tu', mc.lech_tu, 'gui_loi', mc.gui_loi,
                          -- 0090: lần gửi gần nhất cân chưa xác nhận, từ lúc nào.
                          'chua_xac_nhan', mc.chua_xac_nhan, 'chua_xac_nhan_tu', mc.chua_xac_nhan_tu)
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
  'NỘI BỘ (0060, 0061 thêm ô can, 0063 cho_qua_han bỏ tin đặt bàn chưa xác nhận — máy gửi không lấy, 0074 thêm ô don_dep — đèn Dọn dữ liệu cá nhân, 0090 thêm chua_xac_nhan vào máy của ô can): số liệu bảng sức khỏe cho các chi nhánh ĐANG HOẠT ĐỘNG trong danh sách, không kiểm vai. p_lech: đối soát sổ kho đã có (null = quét). Chỉ gọi từ suc_khoe_he_thong() (chủ / quản lý) và bao_dong_bat_dau_luot() (máy báo động). Không ai đăng nhập gọi thẳng được.';

-- Hàm nội bộ: chỉ suc_khoe_he_thong() (chủ / quản lý) và bao_dong_bat_dau_luot() gọi — rút khỏi authenticated như 0061 mục 6.
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
