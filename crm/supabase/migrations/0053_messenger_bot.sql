-- =============================================================================
-- BEEFTOWN CRM — 0053 · MESSENGER · BOT ĐẶT BÀN: PHIÊN HỘI THOẠI, CẤU HÌNH,
--                      THỐNG KÊ, RPC MÁY VÀ NGƯỜI
-- =============================================================================
-- PHẢI CHẠY SAU 0052 (một mình) — dùng 'may_messenger' vừa thêm ở đó.
--
-- Khách nhắn Trang Facebook để đặt bàn, tra / hủy đặt bàn, hỏi giờ mở cửa,
-- gặp nhân viên. Worker (web/src/lib/messenger-hook.ts) nhận webhook Meta,
-- đăng nhập tài khoản máy may_messenger để nhớ BƯỚC hội thoại của từng khách,
-- còn đặt bàn / tra cứu / hủy / lịch trống / nội dung công khai thì gọi bằng
-- client anon KHÔNG phiên — đúng các hàm website đang dùng (tao_dat_ban với
-- p_utm_source='messenger', p_utm_medium='chatbot'). File này KHÔNG đổi hàm
-- nào có sẵn và KHÔNG đổi danh sách hàm của anon.
--
-- BẤT BIẾN
--   · KHÔNG lưu PSID thô, KHÔNG lưu nội dung tin nhắn. Khóa phiên là psid_bam
--     = HMAC-SHA256(PSID, bí mật Worker MESS_KHOA_BAM) dạng 64 ký tự hex
--     thường — web tính, database chỉ kiểm dạng (CHECK + mọi RPC từ chối
--     chuỗi khác dạng bằng 23514). du_lieu chỉ giữ thứ bot đang hỏi dở (ngày,
--     giờ, số khách, tên, SĐT) — tối đa 4000 byte, phải là đối tượng JSON.
--   · Phiên không động tới quá 30 ngày thì tự xóa (mỗi lần gọi mess_lay_phien,
--     mess_luu_phien, mess_ghi_tra_cuu dọn luôn; phiên quá hạn coi như không có).
--   · Tra cứu sai: ≥ 5 lần sai trong 15 phút → bi_khoa. Lần sai thứ 5 (và mỗi
--     lần sai sau đó khi đang khóa) đặt lại mốc sai_tu = now(), nên khóa kéo
--     dài 15 phút kể từ lần sai gần nhất. Tra ĐÚNG không xóa bộ đếm (người biết
--     một mã đúng không dùng nó để "rửa" lượt đoán mã khác). Hết 15 phút kể từ
--     sai_tu thì bộ đếm về 0 ở lần ghi kế tiếp. Messenger không có IP nên đây
--     là thứ thay cho giới hạn theo IP của website; web vẫn gọi
--     ghi_nhat_ky_tra_cuu(null, mã, đúng/sai) như website.
--   · Gửi đặt bàn: web gọi mess_xin_dat_ban NGAY TRƯỚC tao_dat_ban. Cùng một
--     khách: lần gửi trước chưa quá 5 giây → 'dang_gui' (Meta giao lặp sự
--     kiện / khách bấm hai lần chạy song song — không đặt hai bàn); đã gửi 5
--     lần trong ngày giờ VN → 'qua_luot' (chống spam đặt bàn qua bot; website
--     không đổi). Khóa dòng (for update) nên hai lần gọi song song không cùng lọt.
--   · mess_thong_ke_ngay chỉ ĐẾM theo (ngày giờ VN, loại sự kiện) — không PSID,
--     không SĐT, không nội dung. Giữ 400 ngày.
--   · Bot mặc định TẮT (mess_cau_hinh.dang_bat = false). Chỉ chủ bật được.
--   · may_messenger không đọc được bảng CRM / kho nào: duoc_truy_cap_chi_nhanh()
--     và kho_vai_duoc() không nhắc tới nó; tường ngăn 0018 (chan_vai_ngoai_crm)
--     chặn nó ghi vào bảng CRM kể cả qua hàm definer — KHÔNG có ngoại lệ nào
--     cho vai này (khác may_zalo ở 0047). Ba bảng mess_* bật RLS, không có
--     policy, thu mọi quyền của anon và authenticated: chỉ đi qua RPC.
--   · Câu lỗi lưu vào loi_cuoi đi qua mess_sach_loi(): xóa token
--     ("access_token=…", "EAA…"), chuỗi số dài (SĐT, PSID thô) và chuỗi 64 hex,
--     cắt 500 ký tự.
--
-- =============================================================================
-- DANH SÁCH RPC (web gọi qua supabase.rpc; mọi hàm trả jsonb)
-- =============================================================================
-- Lỗi quyền: SQLSTATE 42501 (insufficient_privilege → PostgREST 403) — kể cả
-- khi KHÔNG có phiên đăng nhập (không có đường "không phiên thì cho qua").
-- Lỗi dữ liệu: 23514 (check_violation).
-- Mốc giờ trong JSON là timestamptz ISO 8601; "ngay" là 'YYYY-MM-DD' giờ VN.
--
-- ---- MÁY (chỉ vai may_messenger; vai khác / không phiên → 42501) ------------
--
-- mess_lay_phien(p_psid_bam text)
--   Gọi ĐÚNG MỘT LẦN cho mỗi sự kiện KHÁCH gửi tới (tin nhắn, quick reply,
--   postback) — KHÔNG gọi cho echo. Tự: đếm 'tin_nhan'; đếm 'hoi_thoai_moi'
--   khi chưa có phiên (hoặc phiên cũ đã quá 30 ngày); ghi
--   mess_cau_hinh.lan_nhan_cuoi = now(); dọn phiên > 30 ngày. Không tạo phiên.
--   → { "dang_bat": bool, "loi_chao": text, "phut_tam_dung": int,
--       "phien": null | {
--           "buoc": text, "du_lieu": { … },
--           "tam_dung_den": ts | null, "dang_tam_dung": bool,
--           "tra_cuu_sai": int, "bi_khoa": bool, "khoa_den": ts | null,
--           "cap_nhat": ts } }
--   dang_bat = false → bot phải im (web không trả lời gì).
--   dang_tam_dung = true (tam_dung_den > now()) → nhân viên đang trực: bot im.
--   bi_khoa = true → không cho tra / hủy đặt bàn tới khoa_den.
--
-- mess_luu_phien(p_psid_bam text, p_buoc text default null,
--                p_du_lieu jsonb default null, p_tam_dung_phut integer default null)
--   Tạo phiên nếu chưa có (buoc mặc định 'menu', du_lieu '{}'), rồi:
--     p_buoc      null = giữ nguyên; khác null phải khớp ^[a-z][a-z0-9_]{0,39}$
--     p_du_lieu   null = giữ nguyên; '{}' = xóa dữ liệu đang hỏi dở; phải là
--                 đối tượng JSON ≤ 4000 byte
--     p_tam_dung_phut null = giữ nguyên tam_dung_den; 0 = bỏ tạm dừng (bot nói
--                 lại); 1–1440 = tam_dung_den = now() + số phút đó (web truyền
--                 phut_tam_dung của cấu hình khi khách chọn "Gặp nhân viên" hoặc
--                 khi nhân viên trả lời từ Trang — echo không phải của bot).
--   Không đụng tới tra_cuu_sai / sai_tu (khóa tra cứu không "rửa" được bằng
--   cách lưu phiên). Chỉ tạm dừng mà không đổi bước: mess_luu_phien(psid,
--   null, null, 60).
--   → { "ok": true, "buoc": text, "du_lieu": { … }, "tam_dung_den": ts | null,
--       "dang_tam_dung": bool, "cap_nhat": ts }
--
-- mess_ghi_tra_cuu(p_psid_bam text, p_thanh_cong boolean)
--   Gọi SAU mỗi lần tra_cuu_dat_ban / huy_dat_ban theo mã + SĐT khách gõ
--   (thanh_cong = tìm thấy đặt bàn). Tạo phiên nếu chưa có. Đếm 'tra_cuu'
--   mỗi lần; đếm 'bi_khoa' đúng một lần khi vừa chuyển sang khóa.
--   → { "ok": true, "bi_khoa": bool, "tra_cuu_sai": int, "khoa_den": ts | null }
--
-- mess_xin_dat_ban(p_psid_bam text)
--   Gọi ngay TRƯỚC mỗi lần tao_dat_ban của bot. Tạo phiên nếu chưa có. Được →
--   ghi mốc dat_ban_luc = now(), cộng dat_ban_dem (về 0 khi sang ngày VN mới).
--   → { "ok": true, "con_lai": int }
--   | { "ok": false, "ly_do": "dang_gui" }  lần trước của khách này < 5 giây
--   | { "ok": false, "ly_do": "qua_luot" }  đã 5 lần hôm nay (giờ VN)
--   Không được → web KHÔNG gọi tao_dat_ban.
--
-- mess_ghi_su_kien(p_loai text, p_loi text default null)
--   Cộng 1 vào (hôm nay giờ VN, p_loai). p_loai phải thuộc danh sách web ghi:
--     'dat_ban'           tao_dat_ban thành công qua bot
--     'dat_ban_that_bai'  tao_dat_ban bị từ chối (hết bàn, form đóng, giờ qua…)
--     'huy_dat_ban'       huy_dat_ban thành công qua bot
--     'hoi_dap'           khách xem giờ mở cửa / địa chỉ / thực đơn
--     'gap_nhan_vien'     khách chọn gặp nhân viên (hoặc > 8 khách)
--     'nhan_vien_tra_loi' nhân viên trả lời từ Trang (echo) → bot tạm dừng
--     'loi'               lỗi gọi Send API / database / chữ ký sai…
--   ('tin_nhan', 'hoi_thoai_moi', 'tra_cuu', 'bi_khoa' do RPC khác tự đếm —
--   truyền vào đây bị 23514 để không đếm hai lần.)
--   p_loi khác null (bất kể loại) → mess_cau_hinh.loi_cuoi = mess_sach_loi(p_loi),
--   loi_cuoi_luc = now().
--   → { "ok": true, "ngay": "YYYY-MM-DD", "loai": text, "dem": int }
--
-- ---- NGƯỜI: CHỈ CHỦ SỞ HỮU --------------------------------------------------
--
-- mess_doc_cau_hinh()
--   → { "dang_bat": bool, "loi_chao": text, "phut_tam_dung": int,
--       "lan_nhan_cuoi": ts | null, "loi_cuoi": text | null,
--       "loi_cuoi_luc": ts | null, "cap_nhat": ts }
--
-- mess_luu_cau_hinh(p_dang_bat boolean default null, p_loi_chao text default null,
--                   p_phut_tam_dung integer default null)
--   Tham số null = giữ nguyên. loi_chao cắt khoảng trắng hai đầu, 1–300 ký tự
--   (lời chào Messenger Profile "greeting" chỉ nhận 160 — web tự cắt khi cài).
--   phut_tam_dung 5–1440.
--   → như mess_doc_cau_hinh()
--
-- ---- NGƯỜI: CHỦ SỞ HỮU, QUẢN LÝ ---------------------------------------------
--
-- mess_tong_quan()
--   7 ngày gần nhất (hôm nay giờ VN và 6 ngày trước), đủ mọi loại, ngày không
--   có gì vẫn có dòng với số 0. Chỉ đếm — không PSID, không SĐT.
--   → { "cau_hinh": { "dang_bat", "loi_chao", "phut_tam_dung",
--                     "lan_nhan_cuoi", "loi_cuoi", "loi_cuoi_luc" },
--       "loai": [ 'tin_nhan', 'hoi_thoai_moi', 'dat_ban', 'dat_ban_that_bai',
--                 'tra_cuu', 'huy_dat_ban', 'bi_khoa', 'hoi_dap',
--                 'gap_nhan_vien', 'nhan_vien_tra_loi', 'loi' ],
--       "ngay": [ { "ngay": "YYYY-MM-DD", "dem": { <loai>: int, … } }, … ]
--               (cũ → mới, đúng 7 phần tử),
--       "tong": { <loai>: int, … }   (cộng 7 ngày),
--       "phien": { "hoat_dong_24h": int, "dang_tam_dung": int, "bi_khoa": int } }
--
-- ---- ĐỌC THẲNG --------------------------------------------------------------
--   Không có. mess_phien, mess_cau_hinh, mess_thong_ke_ngay: RLS bật, không
--   policy, không quyền bảng cho anon / authenticated.
--
-- HÀM NỘI BỘ (thu EXECUTE khỏi authenticated ở cuối file): mess_kiem_psid,
-- mess_loai_su_kien, mess_dem, mess_don_phien, mess_sach_loi,
-- mess_phien_json, mess_cau_hinh_json.
-- =============================================================================


-- =============================================================================
-- 1 · PHIÊN HỘI THOẠI — một dòng cho mỗi khách (theo PSID đã băm)
-- =============================================================================
create table mess_phien (
  psid_bam     text primary key,
  buoc         text not null default 'menu',
  du_lieu      jsonb not null default '{}'::jsonb,
  tam_dung_den timestamptz,
  tra_cuu_sai  smallint not null default 0,
  sai_tu       timestamptz,
  cap_nhat     timestamptz not null default now(),
  -- Chốt gửi đặt bàn (mess_xin_dat_ban): số lần gửi trong ngày dat_ban_ngay, mốc lần gần nhất.
  dat_ban_ngay date,
  dat_ban_dem  smallint not null default 0,
  dat_ban_luc  timestamptz,

  constraint mess_phien_psid_bam check (psid_bam ~ '^[0-9a-f]{64}$'),
  constraint mess_phien_buoc check (buoc ~ '^[a-z][a-z0-9_]{0,39}$'),
  constraint mess_phien_du_lieu check (jsonb_typeof(du_lieu) = 'object' and octet_length(du_lieu::text) <= 4000),
  constraint mess_phien_tra_cuu_sai check (tra_cuu_sai between 0 and 1000),
  constraint mess_phien_dat_ban_dem check (dat_ban_dem between 0 and 1000)
);

comment on table mess_phien is
  'Bước hội thoại của bot Messenger cho từng khách. Khóa là HMAC của PSID (không lưu PSID thô), không lưu nội dung tin nhắn. Tự xóa sau 30 ngày không động tới (0053).';
comment on column mess_phien.psid_bam     is 'HMAC-SHA256(PSID, MESS_KHOA_BAM) — 64 ký tự hex thường, web tính.';
comment on column mess_phien.du_lieu      is 'Thứ bot đang hỏi dở: ngày, giờ, số khách, tên, SĐT. Xóa khi xong việc.';
comment on column mess_phien.tam_dung_den is 'Nhân viên đang trực cho khách này — bot im tới mốc này.';
comment on column mess_phien.dat_ban_dem  is 'Số lần bot gửi tao_dat_ban cho khách này trong ngày dat_ban_ngay (giờ VN) — tối đa 5.';
comment on column mess_phien.tra_cuu_sai  is 'Số lần tra cứu / hủy đặt bàn sai tính từ sai_tu. ≥ 5 trong 15 phút = khóa.';

create index mess_phien_cap_nhat_idx on mess_phien (cap_nhat);


-- =============================================================================
-- 2 · CẤU HÌNH BOT — một dòng
-- =============================================================================
create table mess_cau_hinh (
  id             smallint primary key default 1,
  dang_bat       boolean not null default false,
  loi_chao       text not null default 'Chào anh/chị! Beeftown có thể giúp gì ạ? Anh/chị chọn một mục bên dưới nhé.',
  phut_tam_dung  smallint not null default 60,
  lan_nhan_cuoi  timestamptz,
  loi_cuoi       text,
  loi_cuoi_luc   timestamptz,
  cap_nhat       timestamptz not null default now(),

  constraint mess_cau_hinh_mot_dong check (id = 1),
  constraint mess_cau_hinh_loi_chao check (char_length(btrim(loi_chao)) between 1 and 300),
  constraint mess_cau_hinh_phut_tam_dung check (phut_tam_dung between 5 and 1440),
  constraint mess_cau_hinh_loi_cuoi check (loi_cuoi is null or char_length(loi_cuoi) <= 500)
);

comment on table mess_cau_hinh is
  'Bot Messenger, một dòng: bật/tắt (mặc định tắt), lời chào, số phút bot im khi khách gặp nhân viên, lần nhận tin cuối, lỗi cuối (0053).';

insert into mess_cau_hinh (id) values (1) on conflict (id) do nothing;


-- =============================================================================
-- 3 · THỐNG KÊ THEO NGÀY — chỉ đếm
-- =============================================================================
create table mess_thong_ke_ngay (
  ngay date not null,
  loai text not null,
  dem  integer not null default 0,
  primary key (ngay, loai),

  constraint mess_thong_ke_ngay_loai check (loai in (
    'tin_nhan', 'hoi_thoai_moi', 'dat_ban', 'dat_ban_that_bai', 'tra_cuu', 'huy_dat_ban',
    'bi_khoa', 'hoi_dap', 'gap_nhan_vien', 'nhan_vien_tra_loi', 'loi')),
  constraint mess_thong_ke_ngay_dem check (dem >= 0)
);

comment on table mess_thong_ke_ngay is
  'Số sự kiện của bot Messenger theo ngày giờ VN và loại — để chủ xem bot có chạy không. Không PSID, không SĐT (0053).';


-- =============================================================================
-- 4 · KHÓA BẢNG — chỉ đi qua RPC
-- =============================================================================
alter table mess_phien         enable row level security;
alter table mess_cau_hinh      enable row level security;
alter table mess_thong_ke_ngay enable row level security;
-- Không có policy nào: kể cả chủ cũng đọc qua mess_doc_cau_hinh / mess_tong_quan.

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on mess_phien, mess_cau_hinh, mess_thong_ke_ngay from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on mess_phien, mess_cau_hinh, mess_thong_ke_ngay from authenticated';
  end if;
end
$$;


-- =============================================================================
-- 5 · HÀM NỘI BỘ
-- =============================================================================
-- Loại sự kiện, đúng thứ tự hiện trên màn /noi-bo/messenger.
create or replace function mess_loai_su_kien()
returns text[]
language sql
immutable
set search_path = public
as $$
  select array['tin_nhan', 'hoi_thoai_moi', 'dat_ban', 'dat_ban_that_bai', 'tra_cuu', 'huy_dat_ban',
               'bi_khoa', 'hoi_dap', 'gap_nhan_vien', 'nhan_vien_tra_loi', 'loi']::text[];
$$;

create or replace function mess_kiem_psid(p_psid_bam text)
returns void
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_psid_bam is null or p_psid_bam !~ '^[0-9a-f]{64}$' then
    raise exception 'Mã khách Messenger phải là chuỗi băm 64 ký tự hex'
      using errcode = 'check_violation';
  end if;
end;
$$;

create or replace function mess_dem(p_loai text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dem integer;
begin
  insert into mess_thong_ke_ngay as t (ngay, loai, dem)
  values (hom_nay_vn(), p_loai, 1)
  on conflict (ngay, loai) do update set dem = t.dem + 1
  returning t.dem into v_dem;
  return v_dem;
end;
$$;

create or replace function mess_don_phien()
returns void
language sql
security definer
set search_path = public
as $$
  delete from mess_phien where cap_nhat < now() - interval '30 days';
$$;

-- Câu lỗi không bao giờ chứa token, SĐT hay PSID.
create or replace function mess_sach_loi(p_loi text)
returns text
language sql
immutable
set search_path = public
as $$
  select left(
           regexp_replace(
             regexp_replace(
               regexp_replace(
                 regexp_replace(nullif(btrim(p_loi), ''),
                   '(access_token|page_token|appsecret_proof|app_secret|verify_token|hub\.verify_token|secret|password|mat_khau|authorization|x-hub-signature-256)("?\s*[:=]\s*"?)(bearer\s+|sha256=)?[^\s"&,;}]+',
                   '\1\2***', 'gi'),
                 'EAA[A-Za-z0-9]{10,}', 'EAA***', 'g'),
               '[0-9a-fA-F]{32,}', '***', 'g'),
             '\+?[0-9][0-9 .]{7,}[0-9]', '***', 'g'),
         500);
$$;

create or replace function mess_phien_json(p mess_phien)
returns jsonb
language sql
stable
set search_path = public
as $$
  select case when p.psid_bam is null then null else jsonb_build_object(
    'buoc', p.buoc,
    'du_lieu', p.du_lieu,
    'tam_dung_den', p.tam_dung_den,
    'dang_tam_dung', coalesce(p.tam_dung_den > now(), false),
    'tra_cuu_sai', p.tra_cuu_sai,
    'bi_khoa', p.tra_cuu_sai >= 5 and coalesce(p.sai_tu > now() - interval '15 minutes', false),
    'khoa_den', case when p.tra_cuu_sai >= 5 and p.sai_tu > now() - interval '15 minutes'
                     then p.sai_tu + interval '15 minutes' end,
    'cap_nhat', p.cap_nhat) end;
$$;

create or replace function mess_cau_hinh_json()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'dang_bat', c.dang_bat, 'loi_chao', c.loi_chao, 'phut_tam_dung', c.phut_tam_dung,
    'lan_nhan_cuoi', c.lan_nhan_cuoi, 'loi_cuoi', c.loi_cuoi, 'loi_cuoi_luc', c.loi_cuoi_luc,
    'cap_nhat', c.cap_nhat)
  from mess_cau_hinh c where c.id = 1;
$$;


-- =============================================================================
-- 6 · RPC MÁY — chỉ may_messenger
-- =============================================================================
create or replace function mess_lay_phien(p_psid_bam text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg mess_cau_hinh;
  v_p   mess_phien;
begin
  if not co_vai_tro(array['may_messenger']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy Messenger mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;
  perform mess_kiem_psid(p_psid_bam);

  perform mess_don_phien();

  update mess_cau_hinh set lan_nhan_cuoi = now() where id = 1
  returning * into v_cfg;

  select * into v_p from mess_phien where psid_bam = p_psid_bam;
  if not found then
    perform mess_dem('hoi_thoai_moi');
  end if;
  perform mess_dem('tin_nhan');

  return jsonb_build_object(
    'dang_bat', v_cfg.dang_bat,
    'loi_chao', v_cfg.loi_chao,
    'phut_tam_dung', v_cfg.phut_tam_dung,
    'phien', mess_phien_json(v_p));
end;
$$;

comment on function mess_lay_phien is
  'Máy Messenger: bước hội thoại của một khách (theo PSID đã băm) + bot bật/tắt, lời chào. Đếm tin nhận, hội thoại mới; dọn phiên > 30 ngày (0053).';

create or replace function mess_luu_phien(
  p_psid_bam      text,
  p_buoc          text    default null,
  p_du_lieu       jsonb   default null,
  p_tam_dung_phut integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p mess_phien;
begin
  if not co_vai_tro(array['may_messenger']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy Messenger mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;
  perform mess_kiem_psid(p_psid_bam);

  if p_buoc is not null and p_buoc !~ '^[a-z][a-z0-9_]{0,39}$' then
    raise exception 'Bước hội thoại không hợp lệ' using errcode = 'check_violation';
  end if;
  if p_du_lieu is not null
     and (jsonb_typeof(p_du_lieu) <> 'object' or octet_length(p_du_lieu::text) > 4000) then
    raise exception 'Dữ liệu phiên phải là đối tượng JSON không quá 4000 byte' using errcode = 'check_violation';
  end if;
  if p_tam_dung_phut is not null and p_tam_dung_phut not between 0 and 1440 then
    raise exception 'Số phút tạm dừng từ 0 đến 1440' using errcode = 'check_violation';
  end if;

  perform mess_don_phien();

  insert into mess_phien (psid_bam) values (p_psid_bam) on conflict (psid_bam) do nothing;

  update mess_phien
  set buoc         = coalesce(p_buoc, buoc),
      du_lieu      = coalesce(p_du_lieu, du_lieu),
      tam_dung_den = case
                       when p_tam_dung_phut is null then tam_dung_den
                       when p_tam_dung_phut = 0     then null
                       else now() + make_interval(mins => p_tam_dung_phut)
                     end,
      cap_nhat     = now()
  where psid_bam = p_psid_bam
  returning * into v_p;

  return jsonb_build_object(
    'ok', true, 'buoc', v_p.buoc, 'du_lieu', v_p.du_lieu,
    'tam_dung_den', v_p.tam_dung_den, 'dang_tam_dung', coalesce(v_p.tam_dung_den > now(), false),
    'cap_nhat', v_p.cap_nhat);
end;
$$;

comment on function mess_luu_phien is
  'Máy Messenger: lưu bước / dữ liệu hỏi dở / tạm dừng bot của một khách. Tham số null = giữ nguyên; p_tam_dung_phut 0 = bỏ tạm dừng (0053).';

create or replace function mess_ghi_tra_cuu(p_psid_bam text, p_thanh_cong boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p        mess_phien;
  v_truoc    boolean;
  v_khoa     boolean;
begin
  if not co_vai_tro(array['may_messenger']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy Messenger mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;
  perform mess_kiem_psid(p_psid_bam);
  if p_thanh_cong is null then
    raise exception 'Thiếu kết quả tra cứu' using errcode = 'check_violation';
  end if;

  perform mess_don_phien();

  insert into mess_phien (psid_bam) values (p_psid_bam) on conflict (psid_bam) do nothing;
  select * into v_p from mess_phien where psid_bam = p_psid_bam for update;

  -- Hết cửa sổ 15 phút: bộ đếm về 0.
  if v_p.sai_tu is null or v_p.sai_tu <= now() - interval '15 minutes' then
    v_p.tra_cuu_sai := 0;
    v_p.sai_tu := null;
  end if;
  v_truoc := v_p.tra_cuu_sai >= 5;

  if not p_thanh_cong then
    v_p.tra_cuu_sai := least(v_p.tra_cuu_sai + 1, 1000);
    if v_p.sai_tu is null or v_p.tra_cuu_sai >= 5 then
      v_p.sai_tu := now();
    end if;
  end if;
  v_khoa := v_p.tra_cuu_sai >= 5;

  update mess_phien
  set tra_cuu_sai = v_p.tra_cuu_sai, sai_tu = v_p.sai_tu, cap_nhat = now()
  where psid_bam = p_psid_bam;

  perform mess_dem('tra_cuu');
  if v_khoa and not v_truoc then
    perform mess_dem('bi_khoa');
  end if;

  return jsonb_build_object(
    'ok', true, 'bi_khoa', v_khoa, 'tra_cuu_sai', v_p.tra_cuu_sai,
    'khoa_den', case when v_khoa then v_p.sai_tu + interval '15 minutes' end);
end;
$$;

comment on function mess_ghi_tra_cuu is
  'Máy Messenger: ghi một lần tra cứu / hủy đặt bàn đúng hay sai. ≥ 5 lần sai trong 15 phút → bi_khoa, khóa 15 phút kể từ lần sai gần nhất (0053).';

create or replace function mess_xin_dat_ban(p_psid_bam text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_p   mess_phien;
  v_nay date := hom_nay_vn();
  v_dem smallint;
begin
  if not co_vai_tro(array['may_messenger']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy Messenger mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;
  perform mess_kiem_psid(p_psid_bam);

  perform mess_don_phien();

  insert into mess_phien (psid_bam) values (p_psid_bam) on conflict (psid_bam) do nothing;
  select * into v_p from mess_phien where psid_bam = p_psid_bam for update;

  if v_p.dat_ban_luc is not null and v_p.dat_ban_luc > now() - interval '5 seconds' then
    return jsonb_build_object('ok', false, 'ly_do', 'dang_gui');
  end if;

  v_dem := case when v_p.dat_ban_ngay is distinct from v_nay then 0 else v_p.dat_ban_dem end;
  if v_dem >= 5 then
    return jsonb_build_object('ok', false, 'ly_do', 'qua_luot');
  end if;

  update mess_phien
  set dat_ban_ngay = v_nay, dat_ban_dem = v_dem + 1, dat_ban_luc = now(), cap_nhat = now()
  where psid_bam = p_psid_bam;

  return jsonb_build_object('ok', true, 'con_lai', 5 - (v_dem + 1));
end;
$$;

comment on function mess_xin_dat_ban is
  'Máy Messenger: xin gửi một yêu cầu đặt bàn cho một khách — chặn lần gửi trùng trong 5 giây và quá 5 lần / ngày VN (0053).';

create or replace function mess_ghi_su_kien(p_loai text, p_loi text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dem integer;
begin
  if not co_vai_tro(array['may_messenger']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy Messenger mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;

  if p_loai is null or p_loai not in ('dat_ban', 'dat_ban_that_bai', 'huy_dat_ban', 'hoi_dap',
                                      'gap_nhan_vien', 'nhan_vien_tra_loi', 'loi') then
    raise exception 'Loại sự kiện Messenger không hợp lệ: %', coalesce(p_loai, '(rỗng)')
      using errcode = 'check_violation';
  end if;

  v_dem := mess_dem(p_loai);

  if nullif(btrim(p_loi), '') is not null then
    update mess_cau_hinh set loi_cuoi = mess_sach_loi(p_loi), loi_cuoi_luc = now() where id = 1;
  end if;

  -- Giữ 400 ngày.
  delete from mess_thong_ke_ngay where ngay < hom_nay_vn() - 400;

  return jsonb_build_object('ok', true, 'ngay', to_char(hom_nay_vn(), 'YYYY-MM-DD'),
                            'loai', p_loai, 'dem', v_dem);
end;
$$;

comment on function mess_ghi_su_kien is
  'Máy Messenger: cộng 1 vào thống kê ngày của một loại sự kiện (danh sách cố định); kèm câu lỗi thì lưu loi_cuoi đã xóa bí mật (0053).';


-- =============================================================================
-- 7 · RPC NGƯỜI
-- =============================================================================
create or replace function mess_doc_cau_hinh()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ sở hữu mới xem được cài đặt bot Messenger'
      using errcode = 'insufficient_privilege';
  end if;
  return mess_cau_hinh_json();
end;
$$;

create or replace function mess_luu_cau_hinh(
  p_dang_bat      boolean default null,
  p_loi_chao      text    default null,
  p_phut_tam_dung integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chao text := btrim(p_loi_chao);
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ sở hữu mới sửa được cài đặt bot Messenger'
      using errcode = 'insufficient_privilege';
  end if;

  if p_loi_chao is not null and char_length(v_chao) not between 1 and 300 then
    raise exception 'Lời chào dài từ 1 đến 300 ký tự' using errcode = 'check_violation';
  end if;
  if p_phut_tam_dung is not null and p_phut_tam_dung not between 5 and 1440 then
    raise exception 'Số phút bot im khi khách gặp nhân viên từ 5 đến 1440' using errcode = 'check_violation';
  end if;

  update mess_cau_hinh
  set dang_bat      = coalesce(p_dang_bat, dang_bat),
      loi_chao      = coalesce(v_chao, loi_chao),
      phut_tam_dung = coalesce(p_phut_tam_dung, phut_tam_dung),
      cap_nhat      = now()
  where id = 1;

  return mess_cau_hinh_json();
end;
$$;

create or replace function mess_tong_quan()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_loai text[] := mess_loai_su_kien();
  v_tu   date   := hom_nay_vn() - 6;
begin
  if not co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[]) then
    raise exception 'Chỉ chủ sở hữu hoặc quản lý mới xem được bot Messenger'
      using errcode = 'insufficient_privilege';
  end if;

  return jsonb_build_object(
    'cau_hinh', mess_cau_hinh_json() - 'cap_nhat',
    'loai', to_jsonb(v_loai),
    'ngay', (select jsonb_agg(jsonb_build_object(
                'ngay', to_char(d.ngay, 'YYYY-MM-DD'),
                'dem', (select jsonb_object_agg(l.loai, coalesce(t.dem, 0))
                        from unnest(v_loai) as l(loai)
                        left join mess_thong_ke_ngay t on t.ngay = d.ngay and t.loai = l.loai))
              order by d.ngay)
             from (select (v_tu + i)::date as ngay from generate_series(0, 6) as i) d),
    'tong', (select jsonb_object_agg(l.loai, coalesce((select sum(t.dem) from mess_thong_ke_ngay t
                                                        where t.loai = l.loai and t.ngay >= v_tu), 0))
             from unnest(v_loai) as l(loai)),
    'phien', (select jsonb_build_object(
                'hoat_dong_24h', count(*) filter (where p.cap_nhat > now() - interval '24 hours'),
                'dang_tam_dung', count(*) filter (where p.tam_dung_den > now()),
                'bi_khoa',       count(*) filter (where p.tra_cuu_sai >= 5
                                                    and p.sai_tu > now() - interval '15 minutes'))
              from mess_phien p where p.cap_nhat >= now() - interval '30 days'));
end;
$$;


-- =============================================================================
-- 8 · HÀM NỘI BỘ — rút khỏi authenticated (README, lưu ý 13)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function mess_loai_su_kien() from authenticated';
    execute 'revoke execute on function mess_kiem_psid(text) from authenticated';
    execute 'revoke execute on function mess_dem(text) from authenticated';
    execute 'revoke execute on function mess_don_phien() from authenticated';
    execute 'revoke execute on function mess_sach_loi(text) from authenticated';
    execute 'revoke execute on function mess_phien_json(mess_phien) from authenticated';
    execute 'revoke execute on function mess_cau_hinh_json() from authenticated';
  end if;
end
$$;


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
