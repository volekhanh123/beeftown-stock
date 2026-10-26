-- =============================================================================
-- BEEFTOWN — 0102 · CÀI ĐẶT BÁN LẺ: CỠ GÓI THỊT BÒ DÙNG CHUNG — CHỈ NỘI BỘ
-- =============================================================================
-- PHẢI CHẠY SAU 0099 (ban_le_san_pham, ban_le_goi, ban_le_doc_so_nguyen, ban_le_tao_san_pham bản 5 tham số) VÀ
-- 0101 (đã có trên main — file này không đụng gì của 0101, chỉ cần đúng thứ tự số).
--
-- Khánh yêu cầu 26/10/2026: màn nội bộ bán lẻ có Cài đặt để chỉnh "bao nhiêu gram" — danh sách cỡ gói online dùng
-- chung cho thịt bò (vd 200 g, 300 g, 500 g, 1 kg), bật / tắt từng cỡ, bỏ 200 g / 400 g làm cứng trong
-- ban_le_tao_san_pham. Thêm sản phẩm thịt thì chọn cỡ nào bán; từng sản phẩm vẫn sửa gói riêng ở trang sửa.
-- Kim chi giữ nguyên (theo hộp, không dùng danh sách này).
--   · Cài đặt chỉ là MẶC ĐỊNH khi thêm sản phẩm thịt mới. Tắt / bỏ một cỡ KHÔNG đụng gói của sản phẩm đã có:
--     không cascade, không đổi gia_chot (không làm sản phẩm thành "giá thử"), không đổi updated_at (form sửa
--     đang mở không bị nguoi_khac_sua).
--   · Gieo 200 g và 400 g ĐANG DÙNG: không ai sửa cài đặt thì hành vi y như 0099.
--   · Ai sửa: chủ và quản lý (như sửa menu). Ai xem: bốn vai của menu (chủ, quản lý, thu ngân, marketing).
--
-- PR này KHÔNG mở gì cho anon: không hàm công khai, không route công khai.
--
-- File này:
--   1 · Bảng ban_le_co_goi (khóa so_gam, 50–5000 g, dang_dung, nguoi_sua) và hai dòng gieo 200 / 400. KHÔNG tên
--       kho_*, KHÔNG khóa ngoại sang bảng kho_* (lý do ở đầu 0099: script dọn kho truncate không cascade).
--   2 · RLS và quyền bảng: đọc cho bốn vai của menu; không policy thêm / sửa / xóa — mọi việc ghi qua hàm definer.
--   3 · ban_le_co_goi_phien_ban (nội bộ), ban_le_cai_dat (đọc), ban_le_luu_co_goi (lưu cả danh sách, phiên bản
--       theo nội dung — bấm hai lần / F5 không ghi hai lần, người khác vừa sửa thì không ghi đè).
--   4 · ban_le_tao_san_pham: drop bản 5 tham số, tạo lại với p_so_gam int[] default null (không để overload).
--   5 · Thu quyền gọi của đúng các hàm vừa tạo: PUBLIC và anon không gọi được hàm nào; authenticated không gọi
--       thẳng hàm phiên bản. Không chép khối "thu hết rồi cấp lại danh sách anon" — danh sách anon không đổi.
--
-- Triển khai: chạy migration trước, deploy web sau (trang /noi-bo/ban-le/cai-dat gọi ban_le_cai_dat,
-- ban_le_luu_co_goi; form Thêm sản phẩm gửi p_so_gam). Web cũ vẫn chạy với database mới: p_so_gam có mặc định.
-- File có câu `delete` (bỏ cỡ trong ban_le_luu_co_goi): chạy bằng SQL Editor hoặc psql, KHÔNG bằng apply_migration /
-- execute_sql của Supabase MCP — công cụ đó chờ người bấm xác nhận câu có delete, hết 60 giây thì không chạy gì
-- (CLAUDE.md mục 8). Chỉ chạy lên production sau khi PR được gộp, rồi `npm run doi-chieu` phải báo KHỚP (0102 là
-- file cuối định nghĩa ban_le_tao_san_pham).
-- =============================================================================


-- =============================================================================
-- 1 · BẢNG
-- =============================================================================
-- Một dòng = một cỡ gói online dùng chung cho thịt bò của cả thương hiệu (không theo chi nhánh, như menu).
-- dang_dung = true: cỡ hiện sẵn ở form Thêm sản phẩm và là gói mặc định của thịt bán theo cân mới tạo.
-- Thứ tự luôn theo so_gam (như gói của sản phẩm ở mọi nơi) — không có cột thu_tu.
create table if not exists ban_le_co_goi (
  so_gam     int primary key,
  dang_dung  boolean not null default true,
  nguoi_sua  uuid references nhan_su(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ban_le_co_goi_so_gam_hop_le check (so_gam between 50 and 5000)
);

comment on table ban_le_co_goi is
  'Cỡ gói online dùng chung cho thịt bò (0102): cỡ đang dùng là gói mặc định khi thêm sản phẩm thịt theo cân. Đổi cài đặt không đụng sản phẩm đã có. Ghi qua ban_le_luu_co_goi.';
comment on column ban_le_co_goi.nguoi_sua is
  'Nhân sự thêm hoặc đổi dang_dung của dòng này lần cuối (null: dòng gieo của migration).';

create trigger ban_le_co_goi_updated_at
  before update on ban_le_co_goi
  for each row execute function tu_dong_cap_nhat_updated_at();

-- Hành vi cũ của 0099 (thịt theo cân có sẵn 200 g và 400 g) giữ nguyên khi chưa ai sửa cài đặt.
insert into ban_le_co_goi (so_gam) values (200), (400) on conflict (so_gam) do nothing;


-- =============================================================================
-- 2 · RLS VÀ QUYỀN BẢNG
-- =============================================================================
-- Đọc: bốn vai của menu (đúng policy ban_le_san_pham_doc / ban_le_goi_doc của 0099). Không policy thêm / sửa / xóa.
alter table ban_le_co_goi enable row level security;

create policy ban_le_co_goi_doc on ban_le_co_goi
  for select using ((select co_vai_tro(array['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing']::vai_tro[])));

-- revoke all (không chỉ insert / update / delete): bỏ luôn TRUNCATE (không qua RLS), REFERENCES, TRIGGER mà quyền
-- mặc định của Supabase cấp. Cùng cách với 0099.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on ban_le_co_goi from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on ban_le_co_goi from authenticated';
    execute 'grant select on ban_le_co_goi to authenticated';
  end if;
end
$$;


-- =============================================================================
-- 3 · BA HÀM CỦA TRANG /noi-bo/ban-le/cai-dat
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.1 · ban_le_co_goi_phien_ban — phiên bản của cả danh sách, tính theo NỘI DUNG
-- -----------------------------------------------------------------------------
-- md5 của "so_gam:dang_dung" nối dấu phẩy theo so_gam tăng dần (danh sách rỗng → md5 của chuỗi rỗng). Không dùng
-- updated_at: dòng bị xóa không để lại dấu thời gian. Nội bộ — chỉ hai hàm definer ở dưới gọi.
create or replace function ban_le_co_goi_phien_ban()
returns text
language sql
stable
set search_path = public
as $$
  select md5(coalesce(string_agg(so_gam::text || ':' || dang_dung::text, ',' order by so_gam), ''))
  from ban_le_co_goi
$$;

-- -----------------------------------------------------------------------------
-- 3.2 · ban_le_cai_dat — đọc cài đặt cho trang
-- -----------------------------------------------------------------------------
-- {"phien_ban": text, "co_goi": [{"so_gam": int, "dang_dung": bool}, …]} theo so_gam tăng dần; [] khi chưa có cỡ.
-- Khóa trùng kiểu CaiDatBanLe / CoGoi của web/src/lib/ban-le-noi-bo.ts.
create or replace function ban_le_cai_dat()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not co_vai_tro(array['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing']::vai_tro[]) then
    raise exception 'Tài khoản này không xem được menu bán lẻ.' using errcode = 'insufficient_privilege';
  end if;

  return jsonb_build_object(
    'phien_ban', ban_le_co_goi_phien_ban(),
    'co_goi', coalesce((select jsonb_agg(jsonb_build_object('so_gam', c.so_gam, 'dang_dung', c.dang_dung) order by c.so_gam)
                        from ban_le_co_goi c), '[]'::jsonb));
end;
$$;

-- -----------------------------------------------------------------------------
-- 3.3 · ban_le_luu_co_goi — lưu CẢ danh sách cỡ gói
-- -----------------------------------------------------------------------------
-- p_phien_ban: phiên bản trang đã đọc (ban_le_cai_dat). p_co_goi: mảng [{so_gam, dang_dung}] — đúng hai khóa đó.
-- Cỡ có trong bảng mà vắng trong danh sách thì BỎ; cỡ mới thì thêm; cỡ đổi dang_dung thì sửa. Dòng thêm / đổi ghi
-- nguoi_sua = người gọi; dòng không đổi không bị ghi (updated_at, nguoi_sua nguyên).
--
-- MỌI KIỂM TRA TRƯỚC LẦN GHI ĐẦU TIÊN (như ban_le_luu_san_pham): vai → danh sách là mảng, tối đa 30 dòng → từng
-- dòng: đúng hai khóa, số gam 50–5000 (số nguyên hoặc chuỗi chữ số, ban_le_doc_so_nguyen), dang_dung là boolean
-- JSON, không trùng cỡ → tối đa 20 cỡ đang dùng (một sản phẩm có tối đa 20 gói). Rồi khóa (advisory) và so:
--   · danh sách hiện tại TRÙNG danh sách gửi lên → {ok:true, khong_doi:true, phien_ban, co_goi} — bấm hai lần, F5,
--     lưu mà không đổi gì: không ghi lần nữa; cũng không báo "người khác sửa" khi bảng đã đúng như người dùng muốn.
--   · khác, và phiên bản hiện tại khác p_phien_ban → {ok:false, ly_do:'nguoi_khac_sua', phien_ban, co_goi} (không
--     raise, không ghi) — trang hiện danh sách mới để người dùng lưu lại.
--   · khác, cùng phiên bản → ghi, trả {ok:true, khong_doi:false, phien_ban, co_goi} đọc lại sau khi ghi.
-- Đổi cài đặt không đụng ban_le_goi / ban_le_san_pham: sản phẩm đã có giữ gói, giá chốt, phiên bản.
create or replace function ban_le_luu_co_goi(p_phien_ban text, p_co_goi jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dong    jsonb;
  v_so      numeric;
  v_ds_so   int[] := '{}';
  v_ds_dung boolean[] := '{}';
  v_moi     jsonb;
  v_hien    jsonb;
  v_nguoi   uuid;
begin
  if not co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[]) then
    raise exception 'Chỉ chủ và quản lý được sửa menu bán lẻ.' using errcode = 'insufficient_privilege';
  end if;
  if p_co_goi is null or jsonb_typeof(p_co_goi) <> 'array' then
    raise exception 'Danh sách cỡ gói không hợp lệ — tải lại trang.';
  end if;
  -- Đếm dòng trước khi đọc từng dòng: mảng quá dài không bắt vòng dò trùng bên dưới chạy lâu.
  if jsonb_array_length(p_co_goi) > 30 then
    raise exception 'Danh sách có tối đa 30 cỡ gói.';
  end if;

  for v_dong in select e from jsonb_array_elements(p_co_goi) e loop
    if jsonb_typeof(v_dong) <> 'object' or not (v_dong ? 'so_gam') or not (v_dong ? 'dang_dung')
       or exists (select 1 from jsonb_object_keys(v_dong) k where k not in ('so_gam', 'dang_dung')) then
      raise exception 'Danh sách cỡ gói không hợp lệ — tải lại trang.';
    end if;
    v_so := ban_le_doc_so_nguyen(v_dong -> 'so_gam');
    if v_so is null or v_so < 50 or v_so > 5000 then
      raise exception 'Trọng lượng gói phải từ 50 đến 5.000 g.';
    end if;
    if jsonb_typeof(v_dong -> 'dang_dung') <> 'boolean' then
      raise exception 'Danh sách cỡ gói không hợp lệ — tải lại trang.';
    end if;
    if v_so::int = any(v_ds_so) then
      raise exception 'Cỡ gói % g nhập hai lần.', v_so::int;
    end if;
    v_ds_so := v_ds_so || v_so::int;
    v_ds_dung := v_ds_dung || (v_dong -> 'dang_dung')::boolean;
  end loop;

  if (select count(*) from unnest(v_ds_dung) d where d) > 20 then
    raise exception 'Tối đa 20 cỡ gói đang dùng — một sản phẩm có tối đa 20 gói.';
  end if;

  v_moi := coalesce((select jsonb_agg(jsonb_build_object('so_gam', x.so_gam, 'dang_dung', x.dang_dung) order by x.so_gam)
                     from unnest(v_ds_so, v_ds_dung) as x(so_gam, dang_dung)), '[]'::jsonb);

  -- Hai lần lưu cùng lúc (hai người, hay bấm đúp trên hai kết nối): lần sau đợi lần trước xong rồi mới so.
  perform pg_advisory_xact_lock(hashtext('ban_le_co_goi'));

  v_hien := coalesce((select jsonb_agg(jsonb_build_object('so_gam', c.so_gam, 'dang_dung', c.dang_dung) order by c.so_gam)
                      from ban_le_co_goi c), '[]'::jsonb);
  if v_hien = v_moi then
    return jsonb_build_object('ok', true, 'khong_doi', true, 'phien_ban', ban_le_co_goi_phien_ban(), 'co_goi', v_hien);
  end if;
  if ban_le_co_goi_phien_ban() is distinct from p_phien_ban then
    return jsonb_build_object('ok', false, 'ly_do', 'nguoi_khac_sua', 'phien_ban', ban_le_co_goi_phien_ban(), 'co_goi', v_hien);
  end if;

  v_nguoi := (nhan_su_hien_tai()).id;
  delete from ban_le_co_goi where so_gam <> all (v_ds_so);
  insert into ban_le_co_goi (so_gam, dang_dung, nguoi_sua)
  select x.so_gam, x.dang_dung, v_nguoi from unnest(v_ds_so, v_ds_dung) as x(so_gam, dang_dung)
  on conflict (so_gam) do update
    set dang_dung = excluded.dang_dung, nguoi_sua = excluded.nguoi_sua
    where ban_le_co_goi.dang_dung is distinct from excluded.dang_dung;

  return jsonb_build_object(
    'ok', true, 'khong_doi', false, 'phien_ban', ban_le_co_goi_phien_ban(),
    'co_goi', coalesce((select jsonb_agg(jsonb_build_object('so_gam', c.so_gam, 'dang_dung', c.dang_dung) order by c.so_gam)
                        from ban_le_co_goi c), '[]'::jsonb));
end;
$$;


-- =============================================================================
-- 4 · ban_le_tao_san_pham — THÊM p_so_gam (cỡ gói chọn ở form Thêm sản phẩm)
-- =============================================================================
-- create or replace với bộ tham số khác sẽ tạo OVERLOAD (crm/README.md, lưu ý 6): lời gọi 5 tham số thành mơ hồ,
-- PostgREST chọn bừa. Drop bản 5 tham số rồi tạo bản 6 tham số; p_so_gam có mặc định nên lời gọi 5 tham số (web
-- cũ, kiểm thử cũ) vẫn chạy và ra đúng hành vi cũ khi cài đặt còn 200 / 400.
drop function if exists ban_le_tao_san_pham(uuid, text, text, text, text);

-- Thân chép 0099 (5.2), giữ nguyên thứ tự kiểm và mọi câu cũ; thêm khối cỡ gói trước lần ghi đầu tiên.
-- p_ma_gui do trang sinh một lần cho mỗi form. Gửi lại cùng mã → trả sản phẩm đã có (da_co: true), bất kể danh
-- sách cỡ lần này. Sản phẩm mới luôn Tạm ngưng: chưa có giá, chưa gắn kho.
-- Gói tạo sẵn — CHỈ khi cách bán theo cân (kim chi theo hộp: không gói, bỏ qua p_so_gam):
--   · p_so_gam null (không gửi) → các cỡ ĐANG DÙNG của ban_le_co_goi, so_gam tăng dần;
--   · p_so_gam là mảng → đúng các cỡ đó, bỏ trùng; [] → không gói nào. Nhận mọi cỡ 50–5000 g — kể cả cỡ vừa bị
--     tắt giữa lúc mở form và lúc gửi (người dùng đã chọn rõ trên form). Phần tử null / ngoài khoảng → câu cũ
--     'Trọng lượng gói phải từ 50 đến 5.000 g.'; hơn 20 cỡ khác nhau → câu cũ 'Một sản phẩm có tối đa 20 gói.'.
--     Kiểm TRƯỚC khi thêm sản phẩm: bị từ chối thì không sản phẩm nào được tạo.
-- Bỏ trùng bằng select distinct: ràng buộc unique (san_pham_id, so_gam) của ban_le_goi là deferrable nên không làm
-- trọng tài cho on conflict được.
create or replace function ban_le_tao_san_pham(p_ma_gui uuid, p_ma text, p_ten_vi text, p_loai text, p_cach_ban text,
                                               p_so_gam int[] default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     uuid;
  v_ten    text := btrim(replace(coalesce(p_ten_vi, ''), E'\r', ''));
  v_co_goi int[];
begin
  if not co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[]) then
    raise exception 'Chỉ chủ và quản lý được sửa menu bán lẻ.' using errcode = 'insufficient_privilege';
  end if;
  if p_ma_gui is null then
    raise exception 'Thiếu mã chống gửi hai lần — tải lại trang.';
  end if;

  -- Bấm lần hai sau khi lần đầu đã lưu: trả ngay sản phẩm đã có, kể cả khi lần này gõ khác.
  select id into v_id from ban_le_san_pham where ma_gui = p_ma_gui;
  if v_id is not null then
    return jsonb_build_object('id', v_id, 'da_co', true);
  end if;

  if p_ma is null or p_ma !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or char_length(p_ma) > 40 then
    raise exception 'Mã sản phẩm chỉ gồm chữ thường không dấu, số và dấu gạch ngang, tối đa 40 ký tự.';
  end if;
  if v_ten = '' then
    raise exception 'Chưa điền tên sản phẩm.';
  end if;
  if char_length(v_ten) > 120 then
    raise exception 'Tên sản phẩm dài quá 120 ký tự.';
  end if;
  if p_loai is null or p_loai not in ('thit', 'kim_chi') then
    raise exception 'Loại sản phẩm phải là thịt bò hoặc kim chi.';
  end if;
  if p_cach_ban is null or p_cach_ban not in ('theo_can', 'theo_hop') then
    raise exception 'Cách bán phải là theo cân hoặc theo hộp.';
  end if;

  -- Cỡ gói tạo sẵn (0102). Theo hộp: v_co_goi để null — không gói nào.
  if p_cach_ban = 'theo_can' then
    if p_so_gam is null then
      v_co_goi := array(select c.so_gam from ban_le_co_goi c where c.dang_dung order by c.so_gam);
    else
      if exists (select 1 from unnest(p_so_gam) g where g is null or g < 50 or g > 5000) then
        raise exception 'Trọng lượng gói phải từ 50 đến 5.000 g.';
      end if;
      v_co_goi := array(select distinct g from unnest(p_so_gam) g order by g);
    end if;
    -- Cài đặt cho tối đa 20 cỡ đang dùng (ban_le_luu_co_goi); kiểm cả nhánh đó cho chắc.
    if cardinality(v_co_goi) > 20 then
      raise exception 'Một sản phẩm có tối đa 20 gói.';
    end if;
  end if;

  begin
    insert into ban_le_san_pham (ma, ma_gui, ten_vi, loai, cach_ban, bao_quan, trang_thai)
    values (p_ma, p_ma_gui, v_ten, p_loai, p_cach_ban,
            case when p_loai = 'kim_chi' then 'giu_lanh' else 'mat' end, 'tam_ngung')
    on conflict (ma_gui) do nothing
    returning id into v_id;
  exception when unique_violation then
    -- Hai lần bấm cùng lúc: lần sau có thể vấp chỉ mục của ma (thứ tự kiểm chỉ mục không cố định) trong khi
    -- chính sản phẩm đó vừa được lần trước tạo. Câu lệnh mới thấy dòng đã giao dịch xong.
    select id into v_id from ban_le_san_pham where ma_gui = p_ma_gui;
    if v_id is not null then
      return jsonb_build_object('id', v_id, 'da_co', true);
    end if;
    raise exception 'Mã sản phẩm này đã có. Đổi tên hoặc sửa mã.' using errcode = 'unique_violation';
  end;

  if v_id is null then
    -- on conflict (ma_gui): lần bấm kia vừa tạo xong.
    select id into v_id from ban_le_san_pham where ma_gui = p_ma_gui;
    return jsonb_build_object('id', v_id, 'da_co', true);
  end if;

  if cardinality(v_co_goi) > 0 then
    insert into ban_le_goi (san_pham_id, so_gam) select v_id, g from unnest(v_co_goi) g;
  end if;
  return jsonb_build_object('id', v_id, 'da_co', false);
end;
$$;


-- =============================================================================
-- CHÚ THÍCH CỦA TỪNG HÀM
-- =============================================================================
comment on function ban_le_co_goi_phien_ban() is
  'Phiên bản của danh sách cỡ gói (0102): md5 của "so_gam:dang_dung" nối dấu phẩy theo so_gam. Nội bộ: chỉ ban_le_cai_dat, ban_le_luu_co_goi gọi.';
comment on function ban_le_cai_dat() is
  'Cài đặt bán lẻ cho /noi-bo/ban-le/cai-dat (0102): {phien_ban, co_goi:[{so_gam, dang_dung}]} theo so_gam. Vai: chủ, quản lý, thu ngân, marketing.';
comment on function ban_le_luu_co_goi(text, jsonb) is
  'Lưu cả danh sách cỡ gói thịt bò (0102), chủ / quản lý. Trùng danh sách hiện tại → khong_doi; phiên bản cũ → nguoi_khac_sua (không ghi). Không đụng sản phẩm đã có.';
comment on function ban_le_tao_san_pham(uuid, text, text, text, text, int[]) is
  'Thêm sản phẩm bán lẻ (0099, 0102), chủ / quản lý. Cùng p_ma_gui → trả sản phẩm đã có (da_co). Mới: Tạm ngưng; thịt theo cân có gói theo p_so_gam (null: các cỡ đang dùng của ban_le_co_goi; []: không gói), tối đa 20.';


-- =============================================================================
-- 5 · THU QUYỀN — đúng các hàm vừa tạo (0008 mục 6)
-- =============================================================================
-- Hàm vừa CREATE có EXECUTE cho PUBLIC (mặc định của Postgres) và cho anon, authenticated (quyền mặc định của
-- Supabase) — drop rồi tạo lại ban_le_tao_san_pham cũng mất quyền cũ, nhận lại quyền mặc định. File này thu ĐÚNG
-- các hàm nó tạo (như 0078, 0088) thay vì chép khối "thu hết rồi cấp lại danh sách anon": danh sách anon không đổi,
-- khối mới nhất vẫn là của 0101.
--   · PUBLIC, anon: không gọi được hàm nào trong bốn hàm (test-ban-le.mjs: không hàm ban_le_* nào anon gọi được).
--   · authenticated: gọi ban_le_cai_dat, ban_le_luu_co_goi, ban_le_tao_san_pham (tự kiểm vai ở câu đầu,
--     test-quyen-ghi-thang-crm.mjs XEP_LOAI) — cấp rõ, không trông vào quyền mặc định. ban_le_co_goi_phien_ban:
--     thu — chỉ hai hàm definer gọi.
do $$
begin
  execute 'revoke execute on function ban_le_co_goi_phien_ban() from public';
  execute 'revoke execute on function ban_le_cai_dat() from public';
  execute 'revoke execute on function ban_le_luu_co_goi(text, jsonb) from public';
  execute 'revoke execute on function ban_le_tao_san_pham(uuid, text, text, text, text, int[]) from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function ban_le_co_goi_phien_ban() from anon';
    execute 'revoke execute on function ban_le_cai_dat() from anon';
    execute 'revoke execute on function ban_le_luu_co_goi(text, jsonb) from anon';
    execute 'revoke execute on function ban_le_tao_san_pham(uuid, text, text, text, text, int[]) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function ban_le_co_goi_phien_ban() from authenticated';
    execute 'grant execute on function ban_le_cai_dat() to authenticated';
    execute 'grant execute on function ban_le_luu_co_goi(text, jsonb) to authenticated';
    execute 'grant execute on function ban_le_tao_san_pham(uuid, text, text, text, text, int[]) to authenticated';
  end if;
end
$$;
