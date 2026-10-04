-- =============================================================================
-- BEEFTOWN — 0061 · BEEFTOWN CÂN BÁO VỀ KHO (truy vết tảng GĐ3, Beeftown Cân 2.9)
-- =============================================================================
-- PHẢI CHẠY SAU 0060 (định nghĩa lại suc_khoe_so_lieu) VÀ 0049 / 0054 (ô mã, máy quầy).
--
-- Trước bản này kho không biết gì về cân: chương trình Beeftown Cân ở máy quầy giữ mọi thứ trong
-- file trên máy (tren-can.tsv, nhat-ky-can.tsv). Người lóc tảng bấm "Giao ô mã" rồi phải tự đi xem
-- cân đã đổi tên phím chưa, và chỉ quản lý gửi được danh mục xuống cân (NV quầy không đọc được
-- phiên lóc — tên ô kèm số tảng).
--
--   1 · kho_can_giao_o_ma(chi nhánh): ô mã đang giao — đúng các dòng của view kho_v_o_ma_giao —
--       cho MỌI vai xem. Danh mục cân (web/src/lib/kho/danh-muc-can.ts, hangChoCan) đọc bằng hàm
--       này thay cho view: NV quầy đăng nhập ở máy quầy thì view trả rỗng không báo lỗi (RLS của
--       kho_phien_pha), tên ô mất số tảng. Không tiền.
--   2 · kho_may_can: mỗi máy quầy (mã cài đặt Beeftown Cân tự sinh) một dòng — lần báo gần nhất,
--       cân trả lời lần cuối, tự gửi bật không, số hàng kho đổi mà cân chưa nhận (từ lúc nào),
--       lần tự gửi gần nhất hỏng không, các dòng Ô MÃ đang nằm trên cân (số PLU, tên, phím tắt).
--       Không lưu câu lỗi (chữ tự do, một thứ tiếng): máy quầy tự hiện câu lỗi; kho chỉ cần biết
--       có hỏng không. kho_may_can_bao(chi nhánh, mã máy, báo) — quyền xem — ghi dòng đó.
--   3 · kho_can_tem: tem cân đã in bằng mã Ô (nhật ký bán của cân, loại 0 = bán / in tem), để
--       đối chiếu với nhãn đã quét vào phiên lóc. kho_may_can_nhat_ky(chi nhánh, mã máy, dòng) —
--       quyền xem — chỉ giữ dòng mã ô, gửi lại không trùng (khóa: chi nhánh, mã máy cân, FID, dòng,
--       giờ in). Giờ in là ĐỒNG HỒ CÂN, giờ Việt Nam (Beeftown Cân 2.8 chỉnh giờ cân mỗi ngày).
--       Quá 90 ngày tự dọn.
--   4 · kho_phien_pha_can(phiên): trang pha lóc đọc — mỗi ô của phiên: đang nằm trên cân với tên
--       gì, số PLU, phím; số nhãn đã quét bằng mã ô; số tem cân đã in bằng mã ô trong lúc phiên giữ
--       ô (từ lúc giao tới lúc chốt). Nhãn in bằng mã THƯỜNG của phần cắt có ô trong phiên theo
--       tảng (vẫn cộng vào phiên như trước — test-kho-o-ma.mjs — nhưng không mang số tảng: bán ra
--       thì kho không biết thuộc tảng nào). Quyền như đọc phiên: pha_loc hoặc xem_gia.
--   5 · suc_khoe_so_lieu: thêm ô `can` cho mỗi chi nhánh (đèn "Beeftown Cân" ở /noi-bo, lượt báo
--       động tự thấy). Thân 0060 nguyên văn, chỉ thêm ô đó.
-- =============================================================================


-- =============================================================================
-- 1 · Ô MÃ ĐANG GIAO CHO DANH MỤC CÂN — mọi vai xem
-- =============================================================================
create or replace function kho_can_giao_o_ma(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';
  end if;
  -- Đúng view kho_v_o_ma_giao (cùng luật con_giu), đọc dưới quyền chủ hàm.
  select coalesce(jsonb_agg(to_jsonb(g) - 'chi_nhanh_id' order by g.ten_hang, g.so_o), '[]'::jsonb) into v
  from kho_v_o_ma_giao g
  where g.chi_nhanh_id = p_chi_nhanh_id;
  return v;
end;
$$;

comment on function kho_can_giao_o_ma(uuid) is
  'Ô mã đang giao ở chi nhánh — đúng các dòng của kho_v_o_ma_giao (0049) — cho danh mục cân (quyền xem, 0061): NV quầy ở máy quầy đọc view thì rỗng (không đọc được phiên lóc). Không tiền.';


-- =============================================================================
-- 2 · MÁY QUẦY BÁO TRẠNG THÁI
-- =============================================================================
create table kho_may_can (
  id              uuid primary key default gen_random_uuid(),
  chi_nhanh_id    uuid not null references chi_nhanh(id) on delete cascade,
  ma_may          uuid not null,                         -- mã cài đặt Beeftown Cân (cau-hinh.json), không phải mã cân
  phien_ban       text,                                  -- phiên bản Beeftown Cân
  mac_can         text,                                  -- mã máy (MAC) của cân đang dùng, null = chưa biết
  bao_luc         timestamptz not null default now(),    -- lần báo gần nhất (đồng hồ database)
  nguoi           uuid references nhan_su(id) on delete set null,  -- người đang đăng nhập ở máy quầy
  giu_ket_noi     boolean not null default false,        -- 2.8: nhịp 30 giây hỏi giờ cân đang bật
  can_tra_loi_luc timestamptz,                           -- lần cuối cân trả lời (máy báo, không quá now())
  tu_gui          boolean not null default false,        -- Tự gửi xuống cân đang bật
  lech_so         int,                                   -- hàng kho thêm / sửa mà cân chưa có; null = chưa biết
  lech_tu         timestamptz,                           -- lệch từ lúc nào (database ghi lần đầu thấy lech_so > 0)
  gui_loi         boolean not null default false,        -- lần tự gửi gần nhất hỏng (không đọc được kho / không nối được cân)
  gui_luc         timestamptz,                           -- lần gửi xuống cân được gần nhất (máy báo)
  tren_can        jsonb not null default '[]',           -- dòng Ô MÃ trên cân: [{plu, ma_can, ten, phim[]}]
  nhat_ky_luc     timestamptz,                           -- lần gửi nhật ký cân lên kho gần nhất
  created_at      timestamptz not null default now(),

  constraint kho_may_can_mot_dong unique (chi_nhanh_id, ma_may),
  constraint kho_may_can_phien_ban check (phien_ban is null or phien_ban ~ '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$'),
  constraint kho_may_can_mac check (mac_can is null or mac_can ~ '^[0-9A-F]{12}$'),
  constraint kho_may_can_lech check (lech_so is null or lech_so between 0 and 100000),
  constraint kho_may_can_tren_can check (jsonb_typeof(tren_can) = 'array')
);

comment on table kho_may_can is
  'Mỗi máy quầy chạy Beeftown Cân một dòng (0061): lần báo gần nhất, cân trả lời lần cuối, tự gửi, lệch kho, dòng ô mã đang trên cân. Không câu lỗi. Chỉ đọc / ghi qua RPC (kho_may_can_bao, kho_phien_pha_can, suc_khoe_so_lieu).';

alter table kho_may_can enable row level security;

-- Mốc giờ máy gửi: ISO có Z (không phụ thuộc TimeZone của phiên), sai dạng / ngày không có thật → null.
create or replace function kho_luc_iso(p text)
returns timestamptz
language plpgsql
stable
set search_path = public
as $$
begin
  if p is null or p !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,6})?Z$' then
    return null;
  end if;
  return p::timestamptz;
exception when others then
  return null;
end;
$$;

comment on function kho_luc_iso(text) is
  'NỘI BỘ (0061): "YYYY-MM-DDTHH:MM:SS(.sss)Z" → timestamptz; sai dạng hay ngày không có thật (31/02) → null.';

-- Giờ đồng hồ cân (giờ VN, nhật ký bán: "YYYY-MM-DD HH:MM:SS") → timestamptz.
create or replace function kho_luc_can_vn(p text)
returns timestamptz
language plpgsql
immutable
set search_path = public
as $$
begin
  if p is null or p !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$' then
    return null;
  end if;
  return (p::timestamp - interval '7 hours') at time zone 'utc';
exception when others then
  return null;
end;
$$;

comment on function kho_luc_can_vn(text) is
  'NỘI BỘ (0061): giờ đồng hồ cân "YYYY-MM-DD HH:MM:SS" (giờ Việt Nam) → timestamptz; sai dạng hay ngày không có thật → null.';

-- p_bao: {phien_ban, mac_can, giu_ket_noi, can_tra_loi_luc, tu_gui, lech_so, gui_loi, gui_luc,
--         tren_can: [{plu, ma_can, ten, phim[]}] | null (null / không có = không đổi từ lần báo trước)}.
-- Khóa thiếu / sai kiểu → coi như chưa biết (null / false), không từ chối cả lần báo: máy quầy bản
-- cũ hơn vẫn báo được nhịp.
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
  v_so_o    int;
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
  -- Mốc giờ máy gửi không được ở tương lai (đồng hồ máy quầy lệch): kẹp về now(). LEAST bỏ qua null
  -- nên kẹp riêng — thiếu mốc là chưa biết, không phải "vừa xong".
  v_tra_loi := kho_luc_iso(p_bao ->> 'can_tra_loi_luc');
  v_tra_loi := case when v_tra_loi > now() then now() else v_tra_loi end;
  v_gui := kho_luc_iso(p_bao ->> 'gui_luc');
  v_gui := case when v_gui > now() then now() else v_gui end;

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
                             where jsonb_typeof(ph) = 'string' limit 8) p8), '[]'::jsonb) as phim
      from jsonb_array_elements(p_bao -> 'tren_can') d
      where jsonb_typeof(d) = 'object'
    ), o as (
      select distinct on (x.ma_can) x.plu, x.ma_can, x.ten, x.phim
      from dong x
      where x.plu between 1 and 9999980
        and exists (select 1 from kho_o_ma om where om.ma_can = x.ma_can)
      order by x.ma_can, x.plu
    )
    select coalesce(jsonb_agg(jsonb_build_object('plu', o.plu, 'ma_can', o.ma_can, 'ten', o.ten, 'phim', o.phim)
                              order by o.plu), '[]'::jsonb) into v_tren
    from o;
  end if;

  v_nv := nhan_su_hien_tai();
  -- Hai lần báo cùng lúc (hai cửa sổ, gửi lại): ON CONFLICT ghi lần lượt, một dòng mỗi máy.
  insert into kho_may_can as m (chi_nhanh_id, ma_may, phien_ban, mac_can, bao_luc, nguoi, giu_ket_noi, can_tra_loi_luc,
                                tu_gui, lech_so, lech_tu, gui_loi, gui_luc, tren_can)
  values (p_chi_nhanh_id, p_ma_may, v_pb, v_mac, now(), v_nv.id,
          coalesce(p_bao -> 'giu_ket_noi' = 'true'::jsonb, false), v_tra_loi,
          coalesce(p_bao -> 'tu_gui' = 'true'::jsonb, false), v_lech, case when v_lech > 0 then now() end,
          coalesce(p_bao -> 'gui_loi' = 'true'::jsonb, false), v_gui, coalesce(v_tren, '[]'::jsonb))
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
    tren_can        = case when v_tren is null then m.tren_can else excluded.tren_can end
  returning jsonb_array_length(m.tren_can) into v_so_o;

  return jsonb_build_object('luc', now(), 'so_o_tren_can', v_so_o);
end;
$$;

comment on function kho_may_can_bao(uuid, uuid, jsonb) is
  'Beeftown Cân ở máy quầy báo trạng thái (quyền xem, 0061): phiên bản, MAC cân, cân trả lời lần cuối, tự gửi, số hàng lệch kho, tự gửi hỏng, dòng ô mã đang trên cân (tren_can null = không đổi). Gọi lại bao nhiêu lần cũng một dòng mỗi máy. Trả {luc, so_o_tren_can}.';


-- =============================================================================
-- 3 · TEM CÂN ĐÃ IN BẰNG MÃ Ô (nhật ký bán của cân)
-- =============================================================================
create table kho_can_tem (
  id            bigint generated always as identity primary key,
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete cascade,
  mac_can       text not null,               -- '' khi nhật ký không biết mã máy cân
  fid           bigint not null,             -- số giao dịch của cân
  stt           int not null,                -- dòng hàng thứ mấy trong giao dịch
  in_luc        timestamptz not null,        -- giờ in theo ĐỒNG HỒ CÂN (giờ VN)
  plu           int not null,
  ma_can        text not null,               -- mã ô (kho_o_ma.ma_can) lúc đọc nhật ký
  so_kg         numeric(10, 3) not null,
  nhan_luc      timestamptz not null default now(),

  constraint kho_can_tem_mot_lan unique (chi_nhanh_id, mac_can, fid, stt, in_luc),
  constraint kho_can_tem_mac check (mac_can ~ '^([0-9A-F]{12})?$'),
  constraint kho_can_tem_kg check (so_kg > 0 and so_kg < 1000)
);

create index kho_can_tem_o on kho_can_tem (chi_nhanh_id, ma_can, in_luc);

comment on table kho_can_tem is
  'Tem cân đã in bằng mã ô (nhật ký bán của cân, loại 0) — đối chiếu với nhãn đã quét vào phiên lóc (0061). Giờ in là đồng hồ cân. Quá 90 ngày tự dọn. Chỉ đọc / ghi qua RPC.';

alter table kho_can_tem enable row level security;

-- p_dong: [{mac, fid, stt, luc: "YYYY-MM-DD HH:MM:SS" (đồng hồ cân), plu, ma_can, so_kg, loai}].
-- Chỉ giữ dòng bán (loai 0) mang MÃ Ô, kg hợp lệ, giờ in không ở tương lai quá một ngày (đồng hồ cân
-- lệch) và không cũ hơn 62 ngày. Dòng khác bỏ qua im lặng — máy quầy gửi cả nhật ký đã đọc.
create or replace function kho_may_can_nhat_ky(p_chi_nhanh_id uuid, p_ma_may uuid, p_dong jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tong int;
  v_moi  int;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';
  end if;
  if p_ma_may is null then
    raise exception 'Thiếu mã máy quầy' using errcode = 'check_violation';
  end if;
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' then
    raise exception 'Nhật ký cân phải là một danh sách' using errcode = 'check_violation';
  end if;
  v_tong := jsonb_array_length(p_dong);
  if v_tong > 2000 then
    raise exception 'Tối đa 2000 dòng nhật ký cân một lần gửi' using errcode = 'check_violation';
  end if;

  with dong as (
    select upper(case when jsonb_typeof(d -> 'mac') = 'string' then d ->> 'mac' else '' end) as mac,
           -- Kiểm dạng TRƯỚC khi đổi kiểu (CASE lồng: không phụ thuộc thứ tự tính của AND).
           case when jsonb_typeof(d -> 'fid') = 'number' then
             case when (d ->> 'fid') ~ '^[0-9]{1,12}$' then (d ->> 'fid')::bigint end end as fid,
           case when jsonb_typeof(d -> 'stt') = 'number' then
             case when (d ->> 'stt') ~ '^[0-9]{1,6}$' then (d ->> 'stt')::int end end as stt,
           kho_luc_can_vn(case when jsonb_typeof(d -> 'luc') = 'string' then d ->> 'luc' end) as in_luc,
           case when jsonb_typeof(d -> 'plu') = 'number' then
             case when (d ->> 'plu') ~ '^[0-9]{1,7}$' then (d ->> 'plu')::int end end as plu,
           case when jsonb_typeof(d -> 'ma_can') = 'string' then
             case when (d ->> 'ma_can') ~ '^[0-9]{1,6}$' then ltrim(d ->> 'ma_can', '0') end end as ma_can,
           case when jsonb_typeof(d -> 'so_kg') = 'number' then
             case when (d ->> 'so_kg') ~ '^[0-9]{1,4}(\.[0-9]+)?$' then round((d ->> 'so_kg')::numeric, 3) end end as so_kg,
           case when jsonb_typeof(d -> 'loai') = 'number' then d ->> 'loai' end as loai
    from jsonb_array_elements(p_dong) d
    where jsonb_typeof(d) = 'object'
  ), them as (
    insert into kho_can_tem (chi_nhanh_id, mac_can, fid, stt, in_luc, plu, ma_can, so_kg)
    select p_chi_nhanh_id, x.mac, x.fid, x.stt, x.in_luc, x.plu, x.ma_can, x.so_kg
    from dong x
    where x.loai = '0'
      and x.mac ~ '^([0-9A-F]{12})?$'
      and x.fid is not null and x.stt is not null and x.plu between 1 and 9999980
      and x.in_luc is not null and x.in_luc <= now() + interval '1 day' and x.in_luc > now() - interval '62 days'
      and x.so_kg > 0 and x.so_kg < 1000
      and exists (select 1 from kho_o_ma o where o.ma_can = x.ma_can)
    on conflict on constraint kho_can_tem_mot_lan do nothing
    returning 1
  )
  select count(*)::int into v_moi from them;

  update kho_may_can set nhat_ky_luc = now()
  where chi_nhanh_id = p_chi_nhanh_id and ma_may = p_ma_may;
  delete from kho_can_tem where chi_nhanh_id = p_chi_nhanh_id and in_luc < now() - interval '90 days';

  return jsonb_build_object('tong', v_tong, 'moi', v_moi);
end;
$$;

comment on function kho_may_can_nhat_ky(uuid, uuid, jsonb) is
  'Beeftown Cân gửi nhật ký bán của cân lên kho (quyền xem, 0061): chỉ giữ dòng bán (loại 0) mang mã ô; gửi lại không trùng. Tối đa 2000 dòng một lần. Trả {tong, moi}.';


-- =============================================================================
-- 4 · TRANG PHA LÓC: Ô NÀO ĐÃ LÊN CÂN, ĐỐI CHIẾU TEM IN / NHÃN QUÉT, NHÃN MÃ THƯỜNG
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
      'tu_luc', g.tu_luc, 'den_luc', coalesce(v_ph.chot_luc, g.den_luc),
      'quet', (select count(*) from quet q where q.ma_can = o.ma_can),
      'quet_kg', (select coalesce(sum(q.so_kg), 0) from quet q where q.ma_can = o.ma_can),
      'in', ti.so, 'in_kg', ti.kg,
      'tren_can', (select coalesce(jsonb_agg(jsonb_build_object('plu', e -> 'plu', 'ten', e -> 'ten', 'phim', e -> 'phim',
                                                                'bao_luc', mc.bao_luc) order by mc.bao_luc desc), '[]'::jsonb)
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
    -- Tem cân in bằng mã ô trong lúc phiên giữ ô: từ lúc giao tới lúc chốt (chưa chốt: tới giờ).
    left join lateral (select count(*) as so, coalesce(sum(t.so_kg), 0) as kg from kho_can_tem t
                       where t.chi_nhanh_id = v_ph.chi_nhanh_id and t.ma_can = o.ma_can
                         and t.in_luc >= g.tu_luc
                         and t.in_luc < coalesce(v_ph.chot_luc, g.den_luc, now())) ti on true
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
                   'gui_loi', mc.gui_loi, 'gui_luc', mc.gui_luc, 'nhat_ky_luc', mc.nhat_ky_luc) order by mc.bao_luc desc), '[]'::jsonb)
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
  'Trang pha lóc (quyền pha_loc hoặc xem_gia, 0061): mỗi ô của phiên — đang giữ không, trên cân (số PLU, tên, phím, theo từng máy quầy), số nhãn đã quét bằng mã ô, số tem cân in bằng mã ô từ lúc giao tới lúc chốt; nhãn mã thường của phần cắt có ô (phiên theo tảng); các máy quầy báo trong 14 ngày. Không tiền.';


-- =============================================================================
-- 5 · SỐ LIỆU BẢNG SỨC KHỎE — thêm ô `can` (đèn "Beeftown Cân") cho mỗi chi nhánh
-- =============================================================================
-- Thân 0060 NGUYÊN VĂN, chỉ thêm ô `can` sau `so_kho`. gio_mo_cua / gio_dong_cua: giờ mở cửa của
-- chi nhánh (cài ở Kết nối iPOS, mặc định 10–23 như kho_ipos_trang_thai) — máy quầy tắt ngoài giờ là
-- bình thường. may: các máy báo trong 14 ngày.
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
  'NỘI BỘ (0060, 0061 thêm ô can): số liệu bảng sức khỏe cho các chi nhánh ĐANG HOẠT ĐỘNG trong danh sách, không kiểm vai. p_lech: đối soát sổ kho đã có (null = quét). Chỉ gọi từ suc_khoe_he_thong() (chủ / quản lý) và bao_dong_bat_dau_luot() (máy báo động). Không ai đăng nhập gọi thẳng được.';


-- =============================================================================
-- 6 · QUYỀN
-- =============================================================================
-- Không ai đăng nhập đọc / ghi thẳng hai bảng: máy quầy ghi qua hai RPC, trang pha lóc và bảng sức
-- khỏe đọc qua RPC. Hàm nội bộ thu quyền authenticated.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on kho_may_can from anon, authenticated';
    execute 'revoke all on kho_can_tem from anon, authenticated';
    execute 'revoke execute on function kho_luc_iso(text) from authenticated';
    execute 'revoke execute on function kho_luc_can_vn(text) from authenticated';
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
