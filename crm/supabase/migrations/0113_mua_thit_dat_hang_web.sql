-- =============================================================================
-- 0113 · MUA THỊT VỀ: KHÁCH ĐẶT THẲNG TRÊN WEBSITE, CHỈ GIAO TẬN NƠI (Khánh 03/11/2026)
-- =============================================================================
-- PHẢI CHẠY SAU 0101 (mua_thit_ve_kenh_mo, mua_thit_ve_goi, mười khóa nhóm mua_thit), 0084 (gioi_han_lay_luot),
-- 0070 (crm_cn_duoc), 0001 (chuan_hoa_sdt, tu_dong_cap_nhat_updated_at, nhan_su_hien_tai).
--
-- Khánh 03/11/2026: "đã lên website rồi thì cần gì Zalo OA" — "chỉ giao tận nơi". Trang /mua-thit-ve (/en/buy-meat,
-- /ko/buy-meat) bỏ bước chép tin đơn rồi gửi qua Zalo OA: khách chọn gói, điền họ tên, số điện thoại, địa chỉ giao,
-- bấm Đặt hàng; database ghi đơn (bảng don_mua_thit), nhân viên gọi xác nhận tổng tiền, phí giao, giờ giao ở hộp thư
-- /noi-bo/don-mua-thit. Không còn nhận tại quầy trên website. Website vẫn không thu tiền: trả khi nhận hàng hoặc
-- chuyển khoản khi quán gọi xác nhận.
--
-- Đây là lần đầu website ghi dữ liệu cá nhân của khách mua thịt (họ tên, số điện thoại, địa chỉ). Bảng khóa kín:
-- anon và authenticated không đọc, không ghi thẳng; anon chỉ tạo đơn qua tao_don_mua_thit; nhân viên chỉ đọc và đổi
-- trạng thái qua hai hàm definer, theo vai và chi nhánh. Trang Quyền riêng tư ba thứ tiếng ghi đúng điều đó.
--
-- Không có câu delete. Chỉ chạy lên production SAU khi PR được gộp, bằng SQL Editor hoặc psql (không dùng
-- apply_migration của Supabase MCP), rồi `npm run doi-chieu` phải báo KHỚP. Chạy migration trước, deploy web sau:
-- web cũ vẫn chạy với migration mới (trang cũ chỉ đọc menu, không cần link Zalo nữa thì vẫn mở được).
--
-- File này:
--   1 · mua_thit_ve_kenh_mo: kênh mở chỉ cần công tắc hien_mua_thit_ve — không còn đòi link Zalo OA.
--   2 · Mô tả mới của sáu khóa công bố (hai thứ tiếng: bản Anh ở web/src/lib/cau-noi-bo.ts, MO_TA_KHOA_EN).
--   3 · Bảng don_mua_thit, mã đơn (sinh_ma_don_mua_thit).
--   4 · tao_don_mua_thit — hàm anon: chống gửi hai lần, giá tính ở database từ giá đã chốt, giới hạn tần suất.
--   5 · don_mua_thit_danh_sach, don_mua_thit_chuyen — hộp thư nội bộ (chủ, quản lý, thu ngân; theo chi nhánh).
--   6 · Quyền.
-- =============================================================================


-- =============================================================================
-- 1 · KÊNH NHẬN ĐƠN: CHỈ CÔNG TẮC
-- =============================================================================
-- 0101 đòi thêm zalo_oa_url hợp lệ vì đơn đi qua chat Zalo OA. Từ 0113 đơn ghi thẳng vào database, nên link Zalo
-- không còn là điều kiện mở trang. zalo_oa_url vẫn là khóa chỉ chủ, vẫn chỉ nhận https://zalo.me/<mã> (0101) —
-- nó còn là nút liên hệ của trang. noi_dung_cong_khai (0101) gọi mua_thit_ve_goi → hàm này: hien_mua_thit_ve hiệu
-- lực = công tắc bật VÀ menu web có gói, không đổi thân.
create or replace function mua_thit_ve_kenh_mo()
returns boolean
language sql
stable
set search_path = public
as $$
  -- 0113 · bỏ điều kiện zalo_oa_url: đơn ghi thẳng vào database (tao_don_mua_thit), không qua chat Zalo OA.
  select cong_tac_bat('hien_mua_thit_ve')
$$;

comment on function mua_thit_ve_kenh_mo() is
  'Kênh nhận đơn Mua thịt về mở (0113): công tắc hien_mua_thit_ve bật. Từ 0113 không còn đòi link Zalo OA — đơn ghi thẳng vào database qua tao_don_mua_thit. Nội bộ: chỉ hàm definer gọi.';
comment on function mua_thit_ve_cong_khai(text, text) is
  'CÔNG KHAI (0101, kênh mở theo 0113): gói bán lẻ của trang Mua thịt về — chỉ khi công tắc hien_mua_thit_ve bật, chỉ sản phẩm Đang bán, kênh website, đã được chủ chốt giá; gia = giá gói trong ảnh chụp gia_chot (giá đã chốt, không theo giá kg mới); tam_het chỉ khi công tắc mua_thit_hien_tam_het bật và số kho tin được. Không trả mã nội bộ, giá kg, số tồn. anon gọi qua /mua-thit-ve.';
comment on function noi_dung_cong_khai(text) is
  'Đường đọc DUY NHẤT của website vào nội dung công bố. Trả đủ mọi khóa trong sổ đăng ký; khóa chưa duyệt có giá trị null. hien_mua_thit_ve là công tắc HIỆU LỰC (0101, 0113): true chỉ khi bật và có gói trên menu web.';


-- =============================================================================
-- 2 · MÔ TẢ KHÓA — ĐÚNG VỚI LUỒNG MỚI
-- =============================================================================
-- Màn /noi-bo/noi-dung đọc mo_ta; bản tiếng Anh cùng PR ở MO_TA_KHOA_EN (crm/test/test-mua-thit-dat-hang.mjs kiểm
-- hai bên cùng nói về luồng mới). Cờ chỉ chủ, kiểu, nhóm, thứ tự giữ nguyên.
update khoa_cong_bo set mo_ta =
  'Mở trang Mua thịt về và mục của nó trên thanh điều hướng: khách chọn gói, điền họ tên, số điện thoại, địa chỉ giao và đặt hàng ngay trên website; đơn vào hộp thư Đơn mua thịt ở /noi-bo, nhân viên gọi khách xác nhận tổng tiền, phí giao và giờ giao. Chỉ giao tận nơi, website không thu tiền. Trang CHỈ mở khi công tắc này bật VÀ có ít nhất một sản phẩm Đang bán, kênh website, đã được chủ chốt giá ở Bán lẻ. Trang hiện giá gói đã chốt; giá mỗi kg ở Kho đổi thì trang vẫn giữ giá đã chốt cho tới khi chủ chốt lại. Chỉ bật khi có người xem hộp thư và gọi khách trong giờ mở cửa, đã chốt ai giao hàng, và đã có ý kiến luật sư về cách ghi định lượng gói giá cố định.'
where khoa = 'hien_mua_thit_ve';

update khoa_cong_bo set mo_ta =
  'Khu vực giao và cách tính phí giao của đơn mua thịt về, như khách đọc (trang chỉ giao tận nơi). Chưa công bố thì trang ghi: quán báo phí giao khi gọi xác nhận đơn. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.'
where khoa = 'mua_thit_giao_hang';

update khoa_cong_bo set mo_ta =
  'Giờ giao đơn mua thịt về, như khách đọc. Chưa công bố thì trang ghi: quán hẹn giờ giao khi gọi xác nhận đơn. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.'
where khoa = 'mua_thit_gio_nhan';

update khoa_cong_bo set mo_ta =
  'Hàng mua về có vấn đề: báo trong bao lâu, quán xử lý thế nào. Chưa công bố thì trang không có câu hỏi này. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.'
where khoa = 'mua_thit_hang_loi';

update khoa_cong_bo set mo_ta =
  'Đổi hoặc hủy đơn mua thịt về trước và sau khi quán xác nhận. Chưa công bố thì trang không có câu hỏi này. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.'
where khoa = 'mua_thit_doi_huy';

update khoa_cong_bo set mo_ta =
  'Zalo OA chính thức, dạng https://zalo.me/<mã OA> (OA Nhà hàng Beeftown Hồ Tùng Mậu: https://zalo.me/3030027075662095415). Chỉ chủ công bố hay gỡ (từ 0101): khách bấm link này để nhắn quán. Từ 0113 đơn Mua thịt về không còn đi qua Zalo — trang mở không cần khóa này.'
where khoa = 'zalo_oa_url';


-- =============================================================================
-- 3 · BẢNG don_mua_thit
-- =============================================================================
-- Một dòng một đơn khách đặt trên website. Ảnh chụp dòng đơn (dong) giữ tên, cỡ gói, giá lúc đặt: chủ đổi tên hay
-- chốt giá mới sau đó thì đơn cũ vẫn đúng như khách đã thấy. tam_tinh là tổng tiền gói, chưa gồm phí giao.
-- Trạng thái (hộp thư /noi-bo/don-mua-thit — CHUYEN_DUOC của web/src/pages/noi-bo/don-mua-thit.astro):
--   cho_xac_nhan → da_xac_nhan (đã gọi khách, chốt tổng tiền, phí giao, giờ giao) | da_huy
--   da_xac_nhan  → da_giao | da_huy
create table don_mua_thit (
  id           uuid primary key default gen_random_uuid(),
  ma_don       text not null,
  ma_gui       uuid not null,
  chi_nhanh_id uuid not null references chi_nhanh(id),
  ho_ten       text not null,
  sdt          text not null,
  dia_chi      text not null,
  ghi_chu      text,
  dong         jsonb not null,
  tam_tinh     bigint not null,
  ngon_ngu     text not null default 'vi',
  trang_thai   text not null default 'cho_xac_nhan',
  nguoi_xu_ly  uuid references nhan_su(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint don_mua_thit_ma_duy_nhat unique (ma_don),
  constraint don_mua_thit_ma_gui_duy_nhat unique (ma_gui),
  constraint don_mua_thit_ho_ten check (char_length(ho_ten) between 1 and 120),
  constraint don_mua_thit_sdt check (sdt ~ '^0[0-9]{9,10}$'),
  constraint don_mua_thit_dia_chi check (char_length(dia_chi) between 8 and 300),
  constraint don_mua_thit_ghi_chu check (ghi_chu is null or char_length(ghi_chu) <= 500),
  constraint don_mua_thit_dong check (jsonb_typeof(dong) = 'array' and jsonb_array_length(dong) between 1 and 60),
  constraint don_mua_thit_tam_tinh check (tam_tinh > 0),
  constraint don_mua_thit_ngon_ngu check (ngon_ngu in ('vi', 'en', 'ko')),
  constraint don_mua_thit_trang_thai check (trang_thai in ('cho_xac_nhan', 'da_xac_nhan', 'da_giao', 'da_huy'))
);

create trigger don_mua_thit_updated_at
  before update on don_mua_thit
  for each row execute function tu_dong_cap_nhat_updated_at();

create index don_mua_thit_hop_thu_idx on don_mua_thit (chi_nhanh_id, trang_thai, created_at desc);
create index don_mua_thit_sdt_idx on don_mua_thit (sdt) where trang_thai = 'cho_xac_nhan';

-- Khóa kín: không policy nào — authenticated và anon không đọc, không ghi thẳng. Đọc / đổi qua hàm definer (mục 5).
alter table don_mua_thit enable row level security;
revoke all on table don_mua_thit from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on table don_mua_thit from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on table don_mua_thit from authenticated';
  end if;
end
$$;

comment on table don_mua_thit is
  'Đơn mua thịt về khách đặt trên website (0113): họ tên, số điện thoại, địa chỉ giao, ảnh chụp dòng đơn và tạm tính lúc đặt. Chỉ giao tận nơi, website không thu tiền. Khóa kín: anon tạo qua tao_don_mua_thit; nhân viên (chủ, quản lý, thu ngân, theo chi nhánh) đọc qua don_mua_thit_danh_sach, đổi trạng thái qua don_mua_thit_chuyen.';
comment on column don_mua_thit.dong is
  'Ảnh chụp dòng đơn lúc đặt: [{khoa, san_pham_ma, ten_vi, don_vi, bao_quan, so_gam, so_luong, gia, thanh_tien}] theo thứ tự menu. Giá là giá chủ đã chốt lúc khách đặt.';
comment on column don_mua_thit.ma_gui is
  'Mã chống gửi hai lần: trang dựng một mã mỗi lần hiện form; gửi lại cùng mã (bấm đúp, F5, mạng chập) trả lại đơn cũ.';

-- Mã đơn 6 ký tự, bỏ chữ dễ nhầm (0/O, 1/I/L) — như sinh_ma_dat_ban (0013), không trùng mã đơn đã có.
create or replace function sinh_ma_don_mua_thit()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  v_ma text;
  i    int;
begin
  for i in 1..20 loop
    select string_agg(substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', (floor(random() * 31) + 1)::int, 1), '')
      into v_ma
      from generate_series(1, 6);
    exit when not exists (select 1 from don_mua_thit where ma_don = v_ma);
    v_ma := null;
  end loop;
  if v_ma is null then
    raise exception 'Không sinh được mã đơn, vui lòng thử lại';
  end if;
  return v_ma;
end;
$$;


-- =============================================================================
-- 4 · tao_don_mua_thit — HÀM ANON CỦA TRANG MUA THỊT VỀ
-- =============================================================================
-- Trang gửi: mã chống gửi hai lần, mã chi nhánh của website, ba ô liên hệ, ghi chú, giỏ {khoa: số gói} và giá khách
-- đã thấy {khoa: giá}. khoa = <mã sản phẩm>_<số gam> (khoaGoi của web/src/lib/don-mua-thit.ts).
--
-- Database tự tính đơn từ menu công khai (mua_thit_ve_goi — cùng luật của trang: giá đã chốt, gói tạm hết). Trang
-- không bao giờ quyết định giá. Giá khách đã thấy khác giá hiện tại (chủ vừa chốt lại giữa lúc mở trang và lúc
-- bấm Đặt hàng) → không ghi, báo khách tải lại trang: khách không đặt theo một con số rồi bị báo con số khác.
--
-- Thứ tự kiểm (câu lỗi là câu khách đọc — cauLoiDatabase của web/src/lib/chu.ts có bản en, ko):
--   kênh đóng → chi nhánh → mã chống gửi hai lần (gửi lại → trả đơn cũ, không tốn lượt) → ô liên hệ → giỏ → giá →
--   giới hạn tần suất (đứng sau mọi bước kiểm: đơn sai nhận đúng câu của nó và không tốn lượt).
-- Trả jsonb {ma_don, tam_tinh, da_co} — không bảng (0084: PostgREST hủy giao dịch của hàm trả bảng ở chế độ object).
create or replace function tao_don_mua_thit(
  p_ma_gui      uuid,
  p_chi_nhanh_ma text,
  p_ho_ten      text,
  p_sdt         text,
  p_dia_chi     text,
  p_ghi_chu     text,
  p_gio         jsonb,
  p_gia_da_xem  jsonb,
  p_ngon_ngu    text default 'vi',
  p_ip          inet default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cn      chi_nhanh;
  v_don     don_mua_thit;
  v_ho_ten  text := regexp_replace(btrim(coalesce(p_ho_ten, '')), '\s+', ' ', 'g');
  v_dia_chi text := regexp_replace(btrim(coalesce(p_dia_chi, '')), '\s+', ' ', 'g');
  v_ghi_chu text := nullif(btrim(replace(coalesce(p_ghi_chu, ''), E'\r', '')), '');
  v_sdt     text := chuan_hoa_sdt(p_sdt);
  v_menu    jsonb := '{}'::jsonb;   -- khoa → gói đặt được (không tạm hết)
  v_het     jsonb := '{}'::jsonb;   -- khoa → gói đang tạm hết
  v_dong    jsonb := '[]'::jsonb;
  v_tong    bigint := 0;
  v_khoa    text;
  v_so      jsonb;
  v_n       int;
  v_g       jsonb;
  v_dem     int;
  r         record;
begin
  if not mua_thit_ve_kenh_mo() then
    raise exception 'Mua thịt về qua website đang tạm đóng'
      using errcode = 'check_violation';
  end if;

  select * into v_cn from chi_nhanh where lower(ma) = lower(p_chi_nhanh_ma) and dang_hoat_dong;
  if not found then
    raise exception 'Không tìm thấy chi nhánh %', p_chi_nhanh_ma
      using errcode = 'foreign_key_violation';
  end if;

  -- ---- Gửi hai lần: cùng mã chống gửi hai lần → đơn cũ ------------------------------------------------
  if p_ma_gui is null then
    raise exception 'Thiếu mã chống gửi hai lần — tải lại trang.'
      using errcode = 'check_violation';
  end if;
  -- Hai lượt cùng mã chạy song song xếp hàng ở đây; lượt sau thấy dòng lượt trước vừa ghi.
  perform pg_advisory_xact_lock(hashtext('don_mua_thit:' || p_ma_gui::text));
  select * into v_don from don_mua_thit where ma_gui = p_ma_gui;
  if found then
    return jsonb_build_object('ma_don', v_don.ma_don, 'tam_tinh', v_don.tam_tinh, 'da_co', true);
  end if;

  -- ---- Ô liên hệ ------------------------------------------------------------------------------------
  if v_ho_ten = '' then
    raise exception 'Chưa điền họ tên' using errcode = 'check_violation';
  end if;
  if char_length(v_ho_ten) > 120 then
    raise exception 'Họ tên dài quá 120 ký tự' using errcode = 'check_violation';
  end if;
  if v_sdt is null or v_sdt !~ '^0[0-9]{9,10}$' then
    raise exception 'Số điện thoại không hợp lệ' using errcode = 'check_violation';
  end if;
  if char_length(v_dia_chi) < 8 then
    raise exception 'Địa chỉ giao hàng quá ngắn, vui lòng ghi rõ số nhà, tên đường và khu vực' using errcode = 'check_violation';
  end if;
  if char_length(v_dia_chi) > 300 then
    raise exception 'Địa chỉ giao hàng dài quá 300 ký tự' using errcode = 'check_violation';
  end if;
  if char_length(v_ghi_chu) > 500 then
    raise exception 'Ghi chú dài quá 500 ký tự' using errcode = 'check_violation';
  end if;

  -- ---- Giỏ: từng gói phải còn trên menu công khai, số gói 1–10 --------------------------------------
  for r in select * from mua_thit_ve_goi('vi', v_cn.ma, false) loop
    if r.tam_het then
      v_het := v_het || jsonb_build_object(r.san_pham_ma || '_' || r.so_gam, true);
    else
      v_menu := v_menu || jsonb_build_object(r.san_pham_ma || '_' || r.so_gam, jsonb_build_object(
        'khoa', r.san_pham_ma || '_' || r.so_gam, 'san_pham_ma', r.san_pham_ma, 'ten_vi', r.ten_vi,
        'don_vi', r.don_vi, 'bao_quan', r.bao_quan, 'so_gam', r.so_gam, 'gia', r.gia));
    end if;
  end loop;

  if jsonb_typeof(p_gio) is distinct from 'object' then
    raise exception 'Đơn chưa có gói nào' using errcode = 'check_violation';
  end if;
  for v_khoa, v_so in select e.key, e.value from jsonb_each(p_gio) e loop
    -- Số gói: số nguyên 0–10 (số JSON hay chuỗi chữ số như ô chọn của form gửi). 0 bỏ qua.
    v_n := case
             when jsonb_typeof(v_so) = 'number' and (v_so #>> '{}') ~ '^[0-9]{1,2}$' then (v_so #>> '{}')::int
             when jsonb_typeof(v_so) = 'string' and (v_so #>> '{}') ~ '^[0-9]{1,2}$' then (v_so #>> '{}')::int
           end;
    if v_n is null or v_n > 10 then
      raise exception 'Số gói mỗi loại phải từ 0 đến 10' using errcode = 'check_violation';
    end if;
    continue when v_n = 0;
    if v_het ? v_khoa then
      raise exception 'Có gói trong đơn vừa tạm hết, vui lòng tải lại trang và chọn lại' using errcode = 'check_violation';
    end if;
    if not (v_menu ? v_khoa) then
      raise exception 'Có gói trong đơn không còn bán, vui lòng tải lại trang và chọn lại' using errcode = 'check_violation';
    end if;
  end loop;

  -- Dòng đơn theo thứ tự menu (cùng giỏ thì cùng đơn, không theo thứ tự khách chọn).
  for r in select * from mua_thit_ve_goi('vi', v_cn.ma, false) loop
    v_khoa := r.san_pham_ma || '_' || r.so_gam;
    continue when not (v_menu ? v_khoa) or not (p_gio ? v_khoa);
    v_n := (p_gio ->> v_khoa)::int;
    continue when v_n = 0;
    -- Giá khách đã thấy phải đúng giá hiện tại (số nguyên, so theo chữ số).
    if p_gia_da_xem is null or jsonb_typeof(p_gia_da_xem) <> 'object'
       or (p_gia_da_xem ->> v_khoa) is distinct from r.gia::text then
      raise exception 'Giá vừa đổi, vui lòng tải lại trang để xem giá mới' using errcode = 'check_violation';
    end if;
    v_g := (v_menu -> v_khoa) || jsonb_build_object('so_luong', v_n, 'thanh_tien', r.gia * v_n);
    v_dong := v_dong || jsonb_build_array(v_g);
    v_tong := v_tong + r.gia * v_n;
  end loop;

  if jsonb_array_length(v_dong) = 0 then
    raise exception 'Đơn chưa có gói nào' using errcode = 'check_violation';
  end if;

  -- ---- Giới hạn tần suất cho lời gọi không phiên (khuôn tao_dat_ban, 0084) ----------------------------
  if not co_phien_dang_nhap() then
    -- Theo số điện thoại: đơn còn chờ quán gọi xác nhận. Khoá theo số trước khi đếm.
    perform pg_advisory_xact_lock(hashtext('don_mua_thit_sdt:' || v_sdt));
    select count(*) into v_dem from don_mua_thit d where d.sdt = v_sdt and d.trang_thai = 'cho_xac_nhan';
    if v_dem >= 3 then
      raise exception 'Số điện thoại này đã có nhiều đơn đang chờ quán gọi xác nhận, vui lòng gọi quán'
        using errcode = 'check_violation';
    end if;
    if p_ip is not null
       and not gioi_han_lay_luot('tao_don_mua_thit', 'ip:' || host(p_ip), 5, interval '1 hour') then
      raise exception 'Mạng bạn đang dùng đã gửi quá nhiều đơn, vui lòng thử lại sau hoặc gọi quán'
        using errcode = 'check_violation';
    end if;
    if not gioi_han_lay_luot('tao_don_mua_thit', 'cn:' || v_cn.id::text, 30, interval '1 hour') then
      raise exception 'Hệ thống đang nhận quá nhiều đơn, vui lòng thử lại sau hoặc gọi quán'
        using errcode = 'check_violation';
    end if;
  end if;

  insert into don_mua_thit (ma_don, ma_gui, chi_nhanh_id, ho_ten, sdt, dia_chi, ghi_chu, dong, tam_tinh, ngon_ngu)
  values (sinh_ma_don_mua_thit(), p_ma_gui, v_cn.id, v_ho_ten, v_sdt, v_dia_chi, v_ghi_chu, v_dong, v_tong,
          case when p_ngon_ngu in ('vi', 'en', 'ko') then p_ngon_ngu else 'vi' end)
  returning * into v_don;

  return jsonb_build_object('ma_don', v_don.ma_don, 'tam_tinh', v_don.tam_tinh, 'da_co', false);
end;
$$;

comment on function tao_don_mua_thit(uuid, text, text, text, text, text, jsonb, jsonb, text, inet) is
  'CÔNG KHAI (0113): trang Mua thịt về ghi một đơn giao tận nơi. Kênh phải mở (hien_mua_thit_ve); đơn tính ở database từ menu công khai (giá đã chốt, gói tạm hết không đặt được); giá khách đã thấy khác giá hiện tại thì không ghi. Cùng ma_gui trả lại đơn cũ. Không phiên: tối đa 3 đơn chờ mỗi số điện thoại, 5 đơn mỗi giờ mỗi IP, 30 đơn mỗi giờ mỗi chi nhánh. Trả {ma_don, tam_tinh, da_co}.';


-- =============================================================================
-- 5 · HỘP THƯ NỘI BỘ — /noi-bo/don-mua-thit
-- =============================================================================
-- Chủ, quản lý, thu ngân đang làm; theo chi nhánh của mình (crm_cn_duoc — chủ thấy mọi chi nhánh). Marketing và vai
-- kho không thấy: đơn có địa chỉ nhà khách, chỉ người gọi xác nhận và giao cần đọc.
create or replace function don_mua_thit_duoc_xem()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from nhan_su
                 where auth_uid = auth.uid() and dang_lam
                   and vai_tro in ('chu_so_huu', 'quan_ly', 'thu_ngan'))
$$;

comment on function don_mua_thit_duoc_xem() is
  'Người đăng nhập xem và xử lý được đơn mua thịt website (0113): chủ, quản lý, thu ngân đang làm. Chi nhánh lọc thêm bằng crm_cn_duoc().';

-- p_loc: 'cho' (chờ gọi xác nhận), 'dang' (đã xác nhận, chờ giao), 'xong' (đã giao / đã hủy trong 30 ngày),
-- 'tat_ca' (đơn đang mở và mọi đơn trong 30 ngày). Lạ → 'cho'. Mới nhất trước; tối đa 200 dòng.
create or replace function don_mua_thit_danh_sach(p_loc text default 'cho')
returns table (
  id          uuid,
  ma_don      text,
  created_at  timestamptz,
  updated_at  timestamptz,
  ho_ten      text,
  sdt         text,
  dia_chi     text,
  ghi_chu     text,
  dong        jsonb,
  tam_tinh    bigint,
  ngon_ngu    text,
  trang_thai  text,
  nguoi_xu_ly text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_loc text := case when p_loc in ('cho', 'dang', 'xong', 'tat_ca') then p_loc else 'cho' end;
begin
  if not don_mua_thit_duoc_xem() then
    raise exception 'Không có quyền xem đơn mua thịt' using errcode = 'insufficient_privilege';
  end if;
  return query
  select d.id, d.ma_don, d.created_at, d.updated_at, d.ho_ten, d.sdt, d.dia_chi, d.ghi_chu, d.dong, d.tam_tinh,
         d.ngon_ngu, d.trang_thai, ns.ho_ten
  from don_mua_thit d
  left join nhan_su ns on ns.id = d.nguoi_xu_ly
  where d.chi_nhanh_id = any (crm_cn_duoc())
    and case v_loc
          when 'cho'  then d.trang_thai = 'cho_xac_nhan'
          when 'dang' then d.trang_thai = 'da_xac_nhan'
          when 'xong' then d.trang_thai in ('da_giao', 'da_huy') and d.created_at > now() - interval '30 days'
          else d.trang_thai in ('cho_xac_nhan', 'da_xac_nhan') or d.created_at > now() - interval '30 days'
        end
  order by d.created_at desc
  limit 200;
end;
$$;

comment on function don_mua_thit_danh_sach(text) is
  'Hộp thư đơn mua thịt website (0113): chủ, quản lý, thu ngân đang làm, đơn của chi nhánh mình (crm_cn_duoc). p_loc cho | dang | xong | tat_ca. Mới nhất trước, tối đa 200.';

-- Đổi trạng thái một đơn theo đúng bốn bước của hộp thư. Bấm đúp / hai người cùng bấm: lần sau thấy đơn đã ở trạng
-- thái đích → 'da_o_san' (không lỗi); đơn đã sang trạng thái khác → 'nguoi_khac'. Đổi được → 'da_chuyen'.
create or replace function don_mua_thit_chuyen(p_id uuid, p_tu text, p_toi text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_don don_mua_thit;
begin
  if not don_mua_thit_duoc_xem() then
    raise exception 'Không có quyền xử lý đơn mua thịt' using errcode = 'insufficient_privilege';
  end if;
  if not ((p_tu = 'cho_xac_nhan' and p_toi in ('da_xac_nhan', 'da_huy'))
          or (p_tu = 'da_xac_nhan' and p_toi in ('da_giao', 'da_huy'))) then
    raise exception 'Bước chuyển trạng thái đơn không hợp lệ' using errcode = 'check_violation';
  end if;

  select * into v_don from don_mua_thit d
  where d.id = p_id and d.chi_nhanh_id = any (crm_cn_duoc())
  for update;
  if not found then
    raise exception 'Không thấy đơn này' using errcode = 'no_data_found';
  end if;

  if v_don.trang_thai = p_toi then
    return 'da_o_san';
  end if;
  if v_don.trang_thai <> p_tu then
    return 'nguoi_khac';
  end if;

  update don_mua_thit set trang_thai = p_toi, nguoi_xu_ly = (nhan_su_hien_tai()).id where id = p_id;
  return 'da_chuyen';
end;
$$;

comment on function don_mua_thit_chuyen(uuid, text, text) is
  'Đổi trạng thái đơn mua thịt website (0113): chờ gọi → đã xác nhận / đã hủy; đã xác nhận → đã giao / đã hủy. Chủ, quản lý, thu ngân, đơn của chi nhánh mình. Trả da_chuyen | da_o_san | nguoi_khac; nguoi_xu_ly = người bấm.';


-- =============================================================================
-- 6 · QUYỀN
-- =============================================================================
-- anon: đúng một hàm mới (tao_don_mua_thit) — xếp vào DUOC_PHEP của crm/test/test-an-toan.mjs.
-- authenticated: hai hàm hộp thư (tự kiểm vai). Hàm nội bộ (mã đơn, quyền xem) thu khỏi mọi vai: chỉ hàm definer gọi.
revoke execute on function tao_don_mua_thit(uuid, text, text, text, text, text, jsonb, jsonb, text, inet) from public;
revoke execute on function don_mua_thit_danh_sach(text) from public;
revoke execute on function don_mua_thit_chuyen(uuid, text, text) from public;
revoke execute on function don_mua_thit_duoc_xem() from public;
revoke execute on function sinh_ma_don_mua_thit() from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function tao_don_mua_thit(uuid, text, text, text, text, text, jsonb, jsonb, text, inet) to anon';
    execute 'revoke execute on function don_mua_thit_danh_sach(text) from anon';
    execute 'revoke execute on function don_mua_thit_chuyen(uuid, text, text) from anon';
    execute 'revoke execute on function don_mua_thit_duoc_xem() from anon';
    execute 'revoke execute on function sinh_ma_don_mua_thit() from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function don_mua_thit_danh_sach(text) to authenticated';
    execute 'grant execute on function don_mua_thit_chuyen(uuid, text, text) to authenticated';
    execute 'revoke execute on function tao_don_mua_thit(uuid, text, text, text, text, text, jsonb, jsonb, text, inet) from authenticated';
    execute 'revoke execute on function don_mua_thit_duoc_xem() from authenticated';
    execute 'revoke execute on function sinh_ma_don_mua_thit() from authenticated';
  end if;
end
$$;
