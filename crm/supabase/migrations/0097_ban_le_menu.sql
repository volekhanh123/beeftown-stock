-- =============================================================================
-- BEEFTOWN — 0097 · MENU BÁN LẺ (THỊT BÒ MANG VỀ VÀ KIM CHI) — CHỈ NỘI BỘ
-- =============================================================================
-- PHẢI CHẠY SAU 0036 (bản dịch tự động: cot_ban_dich, v_viec_dich, ghi_ban_dich, ghi_so_ban_dich),
-- 0019 / 0020 (kho_mat_hang, kho_vi_tri, kho_lo, kho_ton, kho_cai_dat), 0037 / 0042 / 0049 / 0051 / 0054
-- (iPOS: kho_ipos_cau_hinh, kho_ipos_menu, kho_ipos_ma_hang; ô mã kho_o_ma; mã giảm kho_ma_giam, kho_gia_giam)
-- VÀ 0093 (khối CHỐT QUYỀN mới nhất — cuối file chép nguyên văn khối đó).
--
-- Khánh quyết 25–26/10/2026: bán lẻ mang về chỉ gồm phần thịt bò và kim chi.
--   · Quầy bán thịt THEO GRAM trên cân TMA, giá mỗi kg là kho_mat_hang.gia_ban_kg (Beeftown Cân tự gửi xuống
--     cân). Menu này KHÔNG có giá mỗi kg riêng: sửa giá mỗi kg ở đây là sửa đúng ô đó của Kho → Mặt hàng.
--   · Online (Mini App Zalo và website — các PR sau) bán GÓI CỐ ĐỊNH 200 g và 400 g của mỗi phần thịt.
--   · Kim chi tính theo HỘP, giá cố định mỗi hộp, quầy và online cùng giá.
--   · FABi (máy tính tiền iPOS) sửa TAY: API iPOS chỉ đọc được thực đơn. ban_le_doi_chieu() liệt kê việc
--     phải làm trên FABi cho một chi nhánh.
--
-- PR này KHÔNG mở gì cho anon: không hàm công khai, không công tắc, không route. Mini App Zalo và website sẽ
-- đọc menu này ở bước sau (PR riêng, kèm hàm công khai và khối CHỐT QUYỀN mới).
--
-- File này:
--   1 · Bảng ban_le_san_pham (cả thương hiệu) và ban_le_goi (gói / hộp của sản phẩm). KHÔNG khóa ngoại sang
--       bảng kho_*: hai script dọn dữ liệu kho (crm/supabase/thu/xoa-du-lieu-kho.sql,
--       don-du-lieu-thu-truoc-khai-truong.sql) truncate mọi bảng kho_% không kèm cascade — một khóa ngoại từ
--       bảng ngoài kho làm hai script đó hỏng. mat_hang_id chỉ được kiểm bằng trigger khi nó ĐỔI, và mọi chỗ
--       đọc chịu được mặt hàng đã mất (không còn dòng) hoặc ngừng dùng (dang_dung = false).
--   2 · RLS và quyền: đọc cho bốn vai CRM (chủ, quản lý, thu ngân, marketing); mọi việc ghi đi qua năm hàm
--       definer ở mục 5. Riêng các ô dịch en / ko và sổ ban_dich: chủ, quản lý, marketing ghi thẳng được — đó
--       là đường ghi của máy dịch (ghi_ban_dich chạy dưới quyền người gọi, như mọi bảng có bản dịch).
--   3 · Nối vào bản dịch tự động của 0036: ba ô ten, mo_ta, cach_dung.
--   4 · Hàm nội bộ: giá gói từ giá mỗi kg, tồn ở quầy, mặt hàng kho, gói, ảnh chụp giá.
--   5 · Năm hàm cho trang /noi-bo/ban-le: ban_le_danh_sach, ban_le_tao_san_pham, ban_le_luu_san_pham,
--       ban_le_chot_gia, ban_le_doi_chieu.
--   6 · CHỐT QUYỀN: chép nguyên văn khối của 0093 (danh sách anon KHÔNG đổi), rồi thu quyền gọi hàm nội bộ
--       của authenticated.
--
-- Triển khai: chạy migration trước, deploy web sau (trang /noi-bo/ban-le gọi các hàm ở mục 5).
-- File có câu `delete` (bỏ gói trong ban_le_luu_san_pham): chạy bằng SQL Editor hoặc psql, KHÔNG bằng
-- apply_migration / execute_sql của Supabase MCP — công cụ đó chờ người bấm xác nhận câu có delete, hết 60
-- giây thì không chạy gì (CLAUDE.md mục 8). Chỉ chạy lên production sau khi PR được gộp, rồi
-- `npm run doi-chieu` phải báo KHỚP (0097 là file cuối định nghĩa cot_ban_dich, ghi_ban_dich, v_viec_dich).
-- =============================================================================


-- =============================================================================
-- 1 · BẢNG
-- =============================================================================
-- Một dòng = một sản phẩm bán lẻ của cả thương hiệu (không theo chi nhánh, như kho_mat_hang).
--   cach_ban 'theo_can' — thịt: quầy cân theo gram ở giá mỗi kg của mặt hàng kho (mat_hang_id); online bán gói
--                         cố định, giá gói tự tính từ giá mỗi kg (ban_le_gia_goi) hoặc giá riêng của gói.
--   cach_ban 'theo_hop' — kim chi: không qua cân; mỗi hộp là một dòng ban_le_goi có giá riêng và mặt hàng kho
--                         riêng (đếm theo gói, đơn vị "hộp").
--   nguon_goi 'cat_tai_quay' — gói online cắt từ hàng ở quầy khi có đơn: FABi trừ kho đúng trọng lượng gói
--                              trên mặt hàng của sản phẩm (Ghép món "Bán theo gói, mỗi gói = 0,2 kg").
--   nguon_goi 'dong_san'     — mỗi cỡ gói là một mặt hàng kho riêng, đếm theo gói (ban_le_goi.mat_hang_id).
-- gia_chot: ảnh chụp giá chủ đã xác nhận {"kg": <giá mỗi kg hoặc null>, "goi": {"200": 190000, …}} — khóa là
-- CHỮ (so_gam::text). Giá hiện tại khác ảnh chụp → giá đó là "giá thử" (gia_thu) cho tới khi chủ chốt lại.
create table ban_le_san_pham (
  id             uuid primary key default gen_random_uuid(),
  ma             text not null,
  ma_gui         uuid,
  loai           text not null,
  cach_ban       text not null,
  ten_vi         text not null,
  ten_en         text,
  ten_ko         text,
  mo_ta_vi       text,
  mo_ta_en       text,
  mo_ta_ko       text,
  cach_dung_vi   text,
  cach_dung_en   text,
  cach_dung_ko   text,
  bao_quan       text not null default 'mat',
  mat_hang_id    uuid,
  nguon_goi      text not null default 'cat_tai_quay',
  trang_thai     text not null default 'tam_ngung',
  kenh_mini_app  boolean not null default true,
  kenh_web       boolean not null default true,
  thu_tu         int not null default 0,
  gia_chot       jsonb,
  gia_chot_luc   timestamptz,
  gia_chot_boi   uuid references nhan_su(id) on delete set null,
  ban_dich       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint ban_le_san_pham_ma_duy_nhat unique (ma),
  constraint ban_le_san_pham_ma_gui_duy_nhat unique (ma_gui),
  constraint ban_le_san_pham_ma_hop_le check (ma ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(ma) <= 40),
  constraint ban_le_san_pham_loai_hop_le check (loai in ('thit', 'kim_chi')),
  constraint ban_le_san_pham_cach_ban_hop_le check (cach_ban in ('theo_can', 'theo_hop')),
  constraint ban_le_san_pham_ten_hop_le check (btrim(ten_vi) <> '' and char_length(ten_vi) <= 120),
  -- Chỉ giới hạn độ dài câu tiếng Việt. Ô en / ko do máy dịch ghi từng ô trong một vòng lặp không bắt lỗi
  -- (ghi_ban_dich, 0036): một bản dịch dài quá giới hạn sẽ làm hỏng cả lượt ghi của sản phẩm đó mãi mãi.
  -- Giới hạn độ dài bản en / ko người gõ tay nằm ở form web.
  constraint ban_le_san_pham_mo_ta_ngan check (
    (mo_ta_vi is null or char_length(mo_ta_vi) <= 500) and (cach_dung_vi is null or char_length(cach_dung_vi) <= 500)),
  constraint ban_le_san_pham_bao_quan_hop_le check (bao_quan in ('mat', 'dong_lanh', 'giu_lanh')),
  constraint ban_le_san_pham_nguon_goi_hop_le check (nguon_goi in ('cat_tai_quay', 'dong_san')),
  constraint ban_le_san_pham_trang_thai_hop_le check (trang_thai in ('dang_ban', 'tam_ngung')),
  constraint ban_le_san_pham_gia_chot_hop_le check (gia_chot is null or jsonb_typeof(gia_chot) = 'object')
);

comment on table ban_le_san_pham is
  'Menu bán lẻ mang về (0097): phần thịt bò bán theo cân ở quầy và theo gói online, kim chi theo hộp. Cả thương hiệu. Đọc: bốn vai CRM; ghi: các hàm ban_le_* (chủ, quản lý); ô dịch en / ko: máy dịch (ghi_ban_dich).';
comment on column ban_le_san_pham.mat_hang_id is
  'Mặt hàng kho của sản phẩm theo cân: giá mỗi kg (gia_ban_kg), mã cân, tồn ở quầy. KHÔNG khóa ngoại (script dọn kho truncate bảng kho_*); kiểm bằng trigger khi đổi, chỗ đọc chịu được mặt hàng mất hoặc ngừng dùng.';
comment on column ban_le_san_pham.gia_chot is
  'Ảnh chụp giá chủ đã xác nhận: {"kg": giá mỗi kg | null, "goi": {"<số gam>": giá}}. Giá hiện tại khác ảnh chụp → giá thử.';
comment on column ban_le_san_pham.ban_dich is
  'Sổ bản dịch (0036): {"<ô>": {"en"|"ko": {bam, cach: may|tay, tt: ok|bi_chan|loi, ly_do, luc}}}. Trigger ghi_so_ban_dich() giữ sổ này đúng.';
comment on column ban_le_san_pham.kenh_mini_app is 'Bán qua Mini App Zalo (lưu từ bây giờ, Mini App đọc ở PR sau).';
comment on column ban_le_san_pham.kenh_web is 'Bán qua website (lưu từ bây giờ, website đọc ở PR sau).';

-- Một dòng = một gói online (thịt) hoặc một cỡ hộp (kim chi) của sản phẩm.
--   gia_rieng: giá cố định của gói; trống = tự tính từ giá mỗi kg (chỉ sản phẩm theo cân).
--   ma_fabi:   mã món trên FABi. Phải có ít nhất một chữ cái: mã toàn số trùng kiểu mã cân, và iPOS tự khớp
--              mã ô / mã giảm chưa ghép theo số (0054) — gói online không được rơi vào đó. Phân biệt hoa thường
--              (ghép món iPOS so khớp đúng từng ký tự).
--   mat_hang_id: mặt hàng kho của hộp kim chi / gói đóng sẵn — phải đếm theo gói (dem_goi).
-- Ba ràng buộc duy nhất cho phép hoãn tới cuối hàm: ban_le_luu_san_pham đổi cỡ hoặc mã của nhiều gói một lúc
-- (đổi chỗ 200 g ↔ 400 g), đã kiểm trước cả danh sách đích, rồi mới ghi từng dòng.
create table ban_le_goi (
  id           uuid primary key default gen_random_uuid(),
  san_pham_id  uuid not null references ban_le_san_pham(id) on delete cascade,
  so_gam       int not null,
  gia_rieng    bigint,
  ma_fabi      text,
  ma_vach      text,
  mat_hang_id  uuid,
  dang_ban     boolean not null default true,
  thu_tu       int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint ban_le_goi_so_gam_hop_le check (so_gam between 50 and 5000),
  constraint ban_le_goi_trong_luong_duy_nhat unique (san_pham_id, so_gam) deferrable initially immediate,
  constraint ban_le_goi_gia_rieng_hop_le check (
    gia_rieng is null or (gia_rieng between 1000 and 100000000 and gia_rieng % 1000 = 0)),
  constraint ban_le_goi_ma_fabi_hop_le check (
    ma_fabi is null or (ma_fabi ~ '^[A-Za-z0-9_.-]{1,40}$' and ma_fabi ~ '[A-Za-z]')),
  -- NULL không trùng nhau trong ràng buộc duy nhất: gói chưa có mã không vướng.
  constraint ban_le_goi_ma_fabi_duy_nhat unique (ma_fabi) deferrable initially immediate,
  constraint ban_le_goi_ma_vach_hop_le check (ma_vach is null or ma_vach ~ '^[0-9]{8,14}$'),
  constraint ban_le_goi_ma_vach_duy_nhat unique (ma_vach) deferrable initially immediate
);

create index ban_le_goi_san_pham_idx on ban_le_goi (san_pham_id);

comment on table ban_le_goi is
  'Gói online / hộp của một sản phẩm bán lẻ (0097): trọng lượng, giá riêng hoặc tự tính, mã FABi, mã vạch, mặt hàng kho của hộp / gói đóng sẵn.';
comment on column ban_le_goi.gia_rieng is
  'Giá cố định của gói (tròn nghìn). Trống = tự tính từ giá mỗi kg của mặt hàng kho (ban_le_gia_goi), chỉ với sản phẩm theo cân.';

create trigger ban_le_san_pham_updated_at
  before update on ban_le_san_pham
  for each row execute function tu_dong_cap_nhat_updated_at();
create trigger ban_le_goi_updated_at
  before update on ban_le_goi
  for each row execute function tu_dong_cap_nhat_updated_at();

-- Mã sản phẩm là khóa cho Mini App và website (PR sau): đổi mã là làm gãy mọi chỗ đã lưu nó.
create or replace function ban_le_san_pham_giu_ma()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Mã sản phẩm không đổi được sau khi tạo.' using errcode = 'check_violation';
end;
$$;

create trigger ban_le_san_pham_giu_ma
  before update of ma on ban_le_san_pham
  for each row when (new.ma is distinct from old.ma)
  execute function ban_le_san_pham_giu_ma();

-- Mặt hàng kho phải có thật lúc GẮN. Chỉ kiểm khi mat_hang_id đổi: script dọn kho truncate kho_mat_hang và để
-- lại liên kết treo — lần lưu sau (ghi lại đúng giá trị cũ) vẫn phải lưu được. Hàm chạy dưới quyền người gọi
-- và không gọi hàm nội bộ nào: chỉ hàm definer (chủ bảng) và superuser ghi được cột này.
create or replace function ban_le_kiem_mat_hang()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from kho_mat_hang where id = new.mat_hang_id) then
    raise exception 'Không thấy mặt hàng kho này.' using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create trigger ban_le_san_pham_kiem_mat_hang_them
  before insert on ban_le_san_pham
  for each row when (new.mat_hang_id is not null)
  execute function ban_le_kiem_mat_hang();
create trigger ban_le_san_pham_kiem_mat_hang_sua
  before update of mat_hang_id on ban_le_san_pham
  for each row when (new.mat_hang_id is not null and new.mat_hang_id is distinct from old.mat_hang_id)
  execute function ban_le_kiem_mat_hang();
create trigger ban_le_goi_kiem_mat_hang_them
  before insert on ban_le_goi
  for each row when (new.mat_hang_id is not null)
  execute function ban_le_kiem_mat_hang();
create trigger ban_le_goi_kiem_mat_hang_sua
  before update of mat_hang_id on ban_le_goi
  for each row when (new.mat_hang_id is not null and new.mat_hang_id is distinct from old.mat_hang_id)
  execute function ban_le_kiem_mat_hang();


-- =============================================================================
-- 2 · RLS VÀ QUYỀN
-- =============================================================================
-- Đọc: bốn vai CRM đang làm — đúng bộ của trang nội bộ (VAI_CRM). Vai kho, tài khoản máy, nhân sự đã nghỉ,
-- tài khoản không có dòng nhan_su: 0 dòng.
-- Sửa thẳng: CHỈ các ô dịch en / ko và sổ ban_dich (quyền cột bên dưới), chỉ chủ, quản lý, marketing — đúng
-- VAI_BIEN_TAP của web/src/lib/ban-dich.ts, những vai chạy dịch bù (dichBu). Policy này tồn tại để máy dịch
-- ghi được; mọi thay đổi nghiệp vụ (tên, giá, gói, trạng thái, mặt hàng kho) đi qua hàm definer ở mục 5.
-- Không có policy thêm / xóa.
alter table ban_le_san_pham enable row level security;
alter table ban_le_goi enable row level security;

create policy ban_le_san_pham_doc on ban_le_san_pham
  for select using ((select co_vai_tro(array['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing']::vai_tro[])));
create policy ban_le_san_pham_dich on ban_le_san_pham
  for update using ((select co_vai_tro(array['chu_so_huu', 'quan_ly', 'marketing']::vai_tro[])))
  with check ((select co_vai_tro(array['chu_so_huu', 'quan_ly', 'marketing']::vai_tro[])));
create policy ban_le_goi_doc on ban_le_goi
  for select using ((select co_vai_tro(array['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing']::vai_tro[])));

-- revoke all (không chỉ insert / update / delete): bỏ luôn TRUNCATE (không qua RLS), REFERENCES, TRIGGER mà
-- quyền mặc định của Supabase cấp. Cùng cách với 0047 (zalo_cau_hinh).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on ban_le_san_pham, ban_le_goi from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on ban_le_san_pham, ban_le_goi from authenticated';
    execute 'grant select on ban_le_san_pham, ban_le_goi to authenticated';
    execute 'grant update (ten_en, ten_ko, mo_ta_en, mo_ta_ko, cach_dung_en, cach_dung_ko, ban_dich)
             on ban_le_san_pham to authenticated';
  end if;
end
$$;


-- =============================================================================
-- 3 · BẢN DỊCH TỰ ĐỘNG (0036)
-- =============================================================================
-- Ba ô dịch: ten (ten_vi), mo_ta (mo_ta_vi), cach_dung (cach_dung_vi). cot_ban_dich() chép nguyên văn 0036,
-- thêm ba dòng cuối. create or replace giữ nguyên quyền gọi của các hàm 0036 — chúng chạy dưới quyền người
-- đăng nhập (trigger, view, ghi_ban_dich), nên KHÔNG thu hồi hay cấp lại quyền nào của chúng ở đây.
create or replace function cot_ban_dich()
returns table (bang text, cot text, nguon text)
language sql
immutable
as $$
  select * from (values
    ('vi_tri_tuyen_dung', 'ten',          'ten_vi'),
    ('vi_tri_tuyen_dung', 'mo_ta',        'mo_ta_vi'),
    ('vi_tri_tuyen_dung', 'yeu_cau',      'yeu_cau_vi'),
    ('vi_tri_tuyen_dung', 'quyen_loi',    'quyen_loi_vi'),
    ('vi_tri_tuyen_dung', 'ca_lam',       'ca_lam'),
    ('vi_tri_tuyen_dung', 'cap_bac',      'cap_bac'),
    ('nhom_mon',          'ten',          'ten_vi'),
    ('nhom_mon',          'mo_ta',        'mo_ta_vi'),
    ('mon_an',            'ten',          'ten_vi'),
    ('mon_an',            'mo_ta',        'mo_ta_vi'),
    ('mon_an',            'canh_bao',     'canh_bao'),
    ('mon_an',            'khau_phan',    'khau_phan'),
    ('tep_anh',           'alt',          'alt_vi'),
    ('tep_anh',           'chu_thich',    'chu_thich'),
    ('noi_dung_cong_bo',  'gia_tri_text', 'gia_tri_text'),
    ('ban_le_san_pham',   'ten',          'ten_vi'),
    ('ban_le_san_pham',   'mo_ta',        'mo_ta_vi'),
    ('ban_le_san_pham',   'cach_dung',    'cach_dung_vi')
  ) as d(bang, cot, nguon)
$$;

create trigger so_ban_dich_trigger
  before insert or update on ban_le_san_pham
  for each row execute function ghi_so_ban_dich();

-- Chép nguyên văn thân 0036, thêm nhánh ban_le_san_pham vào cuối "dong". PHẢI ghi lại
-- with (security_invoker = true): create or replace view thay CẢ danh sách tùy chọn — thiếu mệnh đề là view
-- chạy dưới quyền chủ view, bỏ qua RLS của mọi bảng nguồn (test-an-toan.mjs mục 2). Cùng cột, cùng thứ tự;
-- không drop (giữ quyền và chú thích).
create or replace view v_viec_dich with (security_invoker = true) as
with dong as (
  select 'vi_tri_tuyen_dung'::text as bang, v.id, to_jsonb(v) as d
  from vi_tri_tuyen_dung v
  where v.trang_thai <> 'da_thu_hoi'
  union all
  select 'nhom_mon', g.id, to_jsonb(g)
  from nhom_mon g
  where g.dang_dung
  union all
  select 'mon_an', m.id, to_jsonb(m)
  from mon_an m
  where m.trang_thai <> 'da_thu_hoi'
  union all
  select 'tep_anh', t.id, to_jsonb(t)
  from tep_anh t
  where t.trang_thai <> 'da_thu_hoi'
  union all
  select 'noi_dung_cong_bo', n.id, to_jsonb(n)
  from noi_dung_cong_bo n
  where n.trang_thai = 'da_cong_bo' and n.kieu = 'van_ban'
  union all
  -- 0097 · Cả sản phẩm tạm ngưng: phải dịch xong TRƯỚC khi chuyển sang Đang bán.
  select 'ban_le_san_pham', s.id, to_jsonb(s)
  from ban_le_san_pham s
),
o as (
  select dong.bang,
         dong.id as dong_id,
         c.cot,
         l.ngon_ngu,
         dong.d ->> c.nguon as nguon,
         bam_nguon(dong.d ->> c.nguon) as bam,
         chuan_ban_dich(dong.d ->> (c.cot || '_' || l.ngon_ngu)) as ban,
         dong.d -> 'ban_dich' -> c.cot -> l.ngon_ngu as so
  from dong
  join cot_ban_dich() c on c.bang = dong.bang
  cross join (values ('en'), ('ko')) as l(ngon_ngu)
)
select
  bang,
  dong_id,
  cot,
  ngon_ngu,
  nguon,
  bam,
  case
    when so ->> 'tt' = 'loi' and so ->> 'bam' = bam then 'thu_lai'
    when ban is null and (so is null or so ->> 'bam' = bam) then 'thieu'
    else 'cu'
  end as ly_do
from o
-- coalesce(..., false) ở hai vế sau là BẮT BUỘC: ô chưa có sổ thì so ->> 'bam'
-- là null, "null = bam" là null, và "not null" cũng là null — WHERE coi null
-- là sai, nên thiếu coalesce thì chính những ô CHƯA TỪNG DỊCH biến mất khỏi
-- view. Đúng loại ô cần dịch nhất (test-ban-dich.mjs bắt được, đã thử gỡ).
-- Vế đầu tự an toàn nhờ "ban is not null" — ô trống kéo cả vế thành false —
-- nhưng vẫn bọc coalesce để người sửa sau không phải nhớ chi tiết đó.
where not la_van_ban_tam(nguon)
  and not coalesce(so ->> 'bam' = bam and so ->> 'tt' = 'ok' and ban is not null, false)
  and not coalesce(so ->> 'bam' = bam and so ->> 'tt' = 'bi_chan', false)
  and not coalesce(so ->> 'bam' = bam and so ->> 'tt' = 'loi'
                   and (so ->> 'luc')::timestamptz > now() - interval '15 minutes', false);

-- Chép nguyên văn thân 0036, chỉ thêm 'ban_le_san_pham' vào danh sách bảng nhận bản dịch.
create or replace function ghi_ban_dich(p_bang text, p_dong_id uuid, p_muc jsonb)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_muc   jsonb;
  v_nguon text;
  v_tt    text;
  v_ban   text;
  v_so    jsonb;
  v_dem   integer;
  v_tong  integer := 0;
begin
  if p_bang not in ('vi_tri_tuyen_dung', 'nhom_mon', 'mon_an', 'tep_anh', 'ban_le_san_pham') then
    -- noi_dung_cong_bo cố ý vắng mặt: bản dịch của nó đi cùng phiên bản,
    -- qua dat_noi_dung(). Xem đầu file.
    raise exception 'Bảng % không nhận bản dịch qua hàm này', p_bang
      using errcode = 'invalid_parameter_value';
  end if;
  if jsonb_typeof(p_muc) is distinct from 'array' then
    raise exception 'p_muc phải là một mảng' using errcode = 'invalid_parameter_value';
  end if;

  perform set_config('beeftown.ghi_ban_dich', 'on', true);

  for v_muc in select * from jsonb_array_elements(p_muc) loop
    select c.nguon into v_nguon
    from cot_ban_dich() c
    where c.bang = p_bang and c.cot = v_muc ->> 'cot';
    if v_nguon is null then
      raise exception 'Ô % không nằm trong danh sách dịch của bảng %', v_muc ->> 'cot', p_bang
        using errcode = 'invalid_parameter_value';
    end if;
    if (v_muc ->> 'ngon_ngu') is null or (v_muc ->> 'ngon_ngu') not in ('en', 'ko') then
      raise exception 'Ngôn ngữ dịch phải là en hoặc ko' using errcode = 'invalid_parameter_value';
    end if;
    if (v_muc ->> 'bam') is null then
      raise exception 'Thiếu bam của câu gốc' using errcode = 'invalid_parameter_value';
    end if;

    v_tt := coalesce(v_muc ->> 'tt', 'ok');
    if v_tt not in ('ok', 'bi_chan', 'loi') then
      raise exception 'Trạng thái bản dịch không hợp lệ: %', v_tt
        using errcode = 'invalid_parameter_value';
    end if;

    v_ban := case when v_tt = 'ok' then chuan_ban_dich(v_muc ->> 'noi_dung') end;
    if v_tt = 'ok' and v_ban is null then
      -- Máy trả về chuỗi rỗng là máy hỏng, không phải một bản dịch.
      v_tt := 'loi';
    end if;

    v_so := jsonb_strip_nulls(jsonb_build_object(
      'bam',   v_muc ->> 'bam',
      'cach',  'may',
      'tt',    v_tt,
      'ly_do', case when v_tt = 'loi' and v_ban is null and (v_muc ->> 'ly_do') is null
                    then 'Máy dịch trả về chuỗi rỗng'
                    else left(v_muc ->> 'ly_do', 500) end,
      'luc',   now()));

    execute format($f$
      update %1$I
         set %2$I = $1,
             ban_dich = jsonb_set(ban_dich, array[$2],
                          coalesce(ban_dich -> $2, '{}'::jsonb) || jsonb_build_object($3, $4))
       where id = $5
         and bam_nguon(%3$I) = $6
    $f$, p_bang, (v_muc ->> 'cot') || '_' || (v_muc ->> 'ngon_ngu'), v_nguon)
    using v_ban, v_muc ->> 'cot', v_muc ->> 'ngon_ngu', v_so, p_dong_id, v_muc ->> 'bam';

    get diagnostics v_dem = row_count;
    v_tong := v_tong + v_dem;
  end loop;

  return v_tong;
end;
$$;


-- =============================================================================
-- 4 · HÀM NỘI BỘ — chỉ năm hàm ở mục 5 gọi (chạy dưới quyền chủ hàm); authenticated không gọi thẳng được
-- =============================================================================
-- Giá gói từ giá mỗi kg, làm tròn tới 1.000 đ. Có bản TypeScript giống hệt (giaGoi trong
-- web/src/lib/ban-le-noi-bo.ts) — sửa thì sửa cả hai. Luôn chia cho 1000000.0 (số thập phân), không chia số
-- nguyên. Kết quả 0 (giá mỗi kg quá nhỏ) → null: 0 đ không bao giờ là một giá.
--   999.999 đ/kg × 200 g = 200.000 · 1.002.500 × 200 = 201.000 · 1.840.000 × 400 = 736.000 · 2.000 × 200 → null
create or replace function ban_le_gia_goi(p_gia_kg bigint, p_so_gam int)
returns bigint
language sql
immutable
as $$
  select nullif((round(p_gia_kg * p_so_gam / 1000000.0) * 1000)::bigint, 0)
$$;

comment on function ban_le_gia_goi is
  'Giá gói p_so_gam gam từ giá mỗi kg, tròn 1.000 đ; 0 → null (0097). Giống giaGoi của web/src/lib/ban-le-noi-bo.ts.';

-- Giá bán của một gói: giá riêng, không thì tự tính (chỉ sản phẩm theo cân, từ giá mỗi kg DÙNG ĐƯỢC — mặt hàng
-- mất hay ngừng dùng thì p_gia_kg là null). 0 không bao giờ là giá.
create or replace function ban_le_gia_ban(p_gia_rieng bigint, p_cach_ban text, p_gia_kg bigint, p_so_gam int)
returns bigint
language sql
immutable
as $$
  select nullif(coalesce(p_gia_rieng, case when p_cach_ban = 'theo_can' then ban_le_gia_goi(p_gia_kg, p_so_gam) end), 0)
$$;

-- Đọc một số nguyên từ ô JSON: số không phần lẻ, hoặc chuỗi chữ số (tối đa 15 chữ số). Khác → null.
create or replace function ban_le_doc_so_nguyen(p_gia_tri jsonb)
returns numeric
language sql
immutable
as $$
  select case
    when jsonb_typeof(p_gia_tri) = 'number'
         and (p_gia_tri #>> '{}')::numeric = trunc((p_gia_tri #>> '{}')::numeric)
         and abs((p_gia_tri #>> '{}')::numeric) < 1000000000000000
      then (p_gia_tri #>> '{}')::numeric
    when jsonb_typeof(p_gia_tri) = 'string' and btrim(p_gia_tri #>> '{}') ~ '^-?[0-9]{1,15}$'
      then btrim(p_gia_tri #>> '{}')::numeric
  end
$$;

-- Đọc chữ từ ô JSON: bỏ \r (trình duyệt gửi xuống dòng là \r\n) và khoảng trắng hai đầu; rỗng / null → null.
create or replace function ban_le_doc_chu(p_gia_tri jsonb)
returns text
language sql
immutable
as $$
  select nullif(btrim(replace(p_gia_tri #>> '{}', E'\r', '')), '')
$$;

-- Mặt hàng kho dạng JSON cho trang: không giá vốn, không tồn. Dòng rỗng (mặt hàng mất) → null.
-- Thu ngân và marketing (không có quyền xem kho) cũng thấy tên, mã, mã cân và giá mỗi kg của mặt hàng gắn
-- với sản phẩm — có chủ đích: giá cân ở quầy là giá công khai cho khách; giá vốn và tồn thì không bao giờ.
create or replace function ban_le_mat_hang_json(p_mh kho_mat_hang)
returns jsonb
language sql
immutable
as $$
  select case when p_mh.id is null then null else jsonb_build_object(
    'id', p_mh.id, 'ma', p_mh.ma, 'ten', p_mh.ten, 'loai', p_mh.loai, 'gia_ban_kg', p_mh.gia_ban_kg,
    'ma_can', p_mh.ma_can, 'dem_goi', p_mh.dem_goi, 'don_vi_goi', p_mh.don_vi_goi, 'dang_dung', p_mh.dang_dung) end
$$;

-- Tồn ở QUẦY của một mặt hàng tại một chi nhánh, chỉ lô còn hạn theo ngày giờ Việt Nam.
-- Quầy = vị trí bán của Kết nối iPOS (kho_ipos_cau_hinh.vi_tri_ban_id — mọi dòng bán FABi trừ ở đó) khi đã
-- chọn; chưa chọn thì mọi vị trí loại 'quay' của chi nhánh.
create or replace function ban_le_ton_quay(p_chi_nhanh_id uuid, p_mat_hang_id uuid, out so_kg numeric, out so_goi bigint)
language sql
stable
as $$
  with quay as (
    select c.vi_tri_ban_id as id
    from kho_ipos_cau_hinh c
    where c.chi_nhanh_id = p_chi_nhanh_id and c.vi_tri_ban_id is not null
    union all
    select v.id
    from kho_vi_tri v
    where v.chi_nhanh_id = p_chi_nhanh_id and v.loai = 'quay'
      and not exists (select 1 from kho_ipos_cau_hinh c
                      where c.chi_nhanh_id = p_chi_nhanh_id and c.vi_tri_ban_id is not null)
  )
  select coalesce(sum(t.so_kg), 0), coalesce(sum(t.so_goi), 0)::bigint
  from kho_ton t
  join kho_lo l on l.id = t.lo_id
  where t.chi_nhanh_id = p_chi_nhanh_id
    and t.mat_hang_id = p_mat_hang_id
    and t.vi_tri_id in (select id from quay)
    and l.han_dung >= hom_nay_vn()
$$;

-- Số tồn ở quầy chỉ TIN ĐƯỢC khi chi nhánh trừ kho theo iPOS (nguon_so_ban = 'ipos' và đã có mốc
-- ipos_tu_luc): ở chế độ kiểm kê, hàng bán chưa bị trừ cho tới lần đếm quầy kế tiếp — số kho cao hơn thật.
create or replace function ban_le_ton_tin_duoc(p_chi_nhanh_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from kho_cai_dat d
    join kho_ipos_cau_hinh c on c.chi_nhanh_id = d.chi_nhanh_id
    where d.chi_nhanh_id = p_chi_nhanh_id
      and d.nguon_so_ban = 'ipos'
      and c.ipos_tu_luc is not null)
$$;

-- Ảnh chụp giá hiện tại của một sản phẩm — đúng thứ ban_le_chot_gia ghi vào gia_chot:
--   {"kg": giá mỗi kg (sản phẩm theo cân, mặt hàng có thật và đang dùng) | null,
--    "goi": {"<số gam>": giá} của MỌI gói có giá > 0, kể cả gói ngưng bán}
-- Gói ngưng bán vẫn vào ảnh chụp: gia_thu của một gói so với ảnh chụp, nên gói ngưng bán có giá mà vắng ở đây
-- thì là "giá thử" mãi — không lần chốt nào bỏ được chữ đó (bán lại gói đó là bán ngay ở giá đã chốt).
create or replace function ban_le_gia_hien_tai(p_san_pham_id uuid)
returns jsonb
language sql
stable
as $$
  with sp as (
    select s.id, s.cach_ban,
           case when s.cach_ban = 'theo_can' and m.dang_dung then m.gia_ban_kg end as gia_kg
    from ban_le_san_pham s
    left join kho_mat_hang m on m.id = s.mat_hang_id
    where s.id = p_san_pham_id
  )
  select jsonb_build_object(
    'kg', sp.gia_kg,
    'goi', coalesce((
      select jsonb_object_agg(g.so_gam::text, x.gia)
      from ban_le_goi g
      cross join lateral (select ban_le_gia_ban(g.gia_rieng, sp.cach_ban, sp.gia_kg, g.so_gam) as gia) x
      where g.san_pham_id = sp.id and x.gia > 0), '{}'::jsonb))
  from sp
$$;

-- Một sản phẩm dạng JSON cho trang và cho kết quả lưu: mọi cột trừ ma_gui (ban_dich chỉ khi p_kem_ban_dich),
-- mặt hàng kho, gói kèm giá, cảnh báo, tồn ở quầy.
-- p_chi_nhanh_id null = không tính tồn (người gọi chưa chọn chi nhánh, hoặc không có quyền xem kho ở đó —
-- hàm gọi quyết định, hàm này không kiểm quyền).
--
-- Mặt hàng "mất" (không còn dòng) và "ngừng" (dang_dung = false) đều KHÔNG DÙNG ĐƯỢC: không lấy giá, không
-- tính tồn, kèm cảnh báo. Mã cảnh báo (canh_bao, thứ tự cố định):
--   chua_gia_can      mặt hàng theo cân dùng được, có mã cân, mà giá mỗi kg TRỐNG hoặc ≤ 0
--   gia_qua_can       …mà giá mỗi kg > 999.999 (cửa sổ 6 chữ số của cân TMA, web/src/lib/kho/can-tma.ts GIA_TOI_DA)
--                     Cả hai: Beeftown Cân bỏ qua dòng đó (can-tma.ts kiemHang) và cân GIỮ dòng cũ — mã đã có trên
--                     cân thì cân vẫn in giá cũ, chưa có thì cân không bán được. Hai mã riêng để trang không phải
--                     đoán trạng thái theo giá.
--   thieu_gia         sản phẩm Đang bán mà không gói đang bán nào có giá > 0
--   khay_nguyen       theo cân + cắt tại quầy + mặt hàng đếm theo khay: FABi trừ NGUYÊN một khay cho mỗi gói
--                     online (0054). Mọi trạng thái: ban_le_luu_san_pham chặn lần lưu ĐƯA sản phẩm vào cấu hình
--                     này khi Đang bán; mặt hàng bị đổi sang đếm theo khay sau đó thì chỉ còn cảnh báo
--   chua_gan_kho      sản phẩm theo cân chưa gắn mặt hàng kho
--   mat_hang_mat      mặt hàng của sản phẩm theo cân, hoặc của gói / hộp đang bán, không còn trong kho
--   mat_hang_ngung    …đã ngừng dùng
--   goi_khong_dem_goi mặt hàng của hộp / gói đóng sẵn đang bán không đếm theo gói
--   hop_chua_co_kho   hộp kim chi đang bán chưa gắn mặt hàng kho
--   goi_chua_co_kho   gói đóng sẵn đang bán (thịt, nguon_goi = dong_san) chưa gắn mặt hàng kho
--
-- Tồn ở quầy của mặt hàng sản phẩm (cắt tại quầy) tính MỘT lần cho cả sản phẩm, dùng cho mọi gói và cho "ton".
create or replace function ban_le_san_pham_json(p_id uuid, p_chi_nhanh_id uuid, p_kem_ban_dich boolean)
returns jsonb
language plpgsql
stable
as $$
declare
  v_sp        ban_le_san_pham;
  v_mh        kho_mat_hang;     -- mặt hàng của sản phẩm
  v_mhg       kho_mat_hang;     -- mặt hàng của gói
  v_g         ban_le_goi;
  v_dung      boolean;          -- mặt hàng của sản phẩm có thật và đang dùng
  v_gia_kg    bigint;           -- giá mỗi kg dùng được (theo cân, mặt hàng dùng được), không thì null
  v_rieng     boolean;          -- gói dùng mặt hàng riêng (hộp kim chi, gói đóng sẵn)
  v_tin       boolean := false; -- số tồn ở quầy tin được
  v_tu_tinh   bigint;
  v_gia       bigint;
  v_con       text;
  v_kg        numeric;
  v_so_goi    bigint;
  v_kg_sp     numeric;          -- tồn ở quầy của mặt hàng sản phẩm (kg), tính một lần; null = không tính
  v_goi_sp    bigint;           -- …và số gói của nó
  v_goi       jsonb := '[]'::jsonb;
  v_co_gia    boolean := false;
  v_mat       boolean := false;
  v_ngung     boolean := false;
  v_khong_dem boolean := false;
  v_hop_thieu boolean := false;
  v_goi_thieu boolean := false;
  v_canh      text[] := '{}';
  v_ton       jsonb;
  v_gia_moi   jsonb;
begin
  select * into v_sp from ban_le_san_pham where id = p_id;
  if not found then
    return null;
  end if;
  if v_sp.mat_hang_id is not null then
    select * into v_mh from kho_mat_hang where id = v_sp.mat_hang_id;
  end if;
  v_dung := v_mh.id is not null and v_mh.dang_dung;
  v_gia_kg := case when v_sp.cach_ban = 'theo_can' and v_dung then v_mh.gia_ban_kg end;
  v_rieng := v_sp.cach_ban = 'theo_hop' or v_sp.nguon_goi = 'dong_san';
  if p_chi_nhanh_id is not null then
    v_tin := ban_le_ton_tin_duoc(p_chi_nhanh_id);
    -- Một lần cho cả sản phẩm (mọi gói cắt tại quầy cùng hỏi đúng câu này).
    if v_sp.cach_ban = 'theo_can' and v_dung then
      select t.so_kg, t.so_goi into v_kg_sp, v_goi_sp from ban_le_ton_quay(p_chi_nhanh_id, v_mh.id) t;
    end if;
  end if;

  for v_g in select * from ban_le_goi where san_pham_id = p_id order by so_gam loop
    v_mhg := null;
    if v_g.mat_hang_id is not null then
      select * into v_mhg from kho_mat_hang where id = v_g.mat_hang_id;
    end if;
    v_tu_tinh := case when v_sp.cach_ban = 'theo_can' then ban_le_gia_goi(v_gia_kg, v_g.so_gam) end;
    v_gia := ban_le_gia_ban(v_g.gia_rieng, v_sp.cach_ban, v_gia_kg, v_g.so_gam);

    -- Còn hàng: chỉ khi số tồn tin được và mặt hàng dùng được. Cắt tại quầy → đủ kg cho một gói; hộp / gói
    -- đóng sẵn → còn ít nhất một gói của mặt hàng đếm theo gói.
    v_con := null;
    if v_tin then
      if not v_rieng then
        if v_dung then
          v_con := case when v_kg_sp >= v_g.so_gam / 1000.0 then 'con' else 'het' end;
        end if;
      elsif v_mhg.id is not null and v_mhg.dang_dung and v_mhg.dem_goi then
        select t.so_goi into v_so_goi from ban_le_ton_quay(p_chi_nhanh_id, v_mhg.id) t;
        v_con := case when v_so_goi >= 1 then 'con' else 'het' end;
      end if;
    end if;

    if v_g.dang_ban then
      if v_gia is not null then
        v_co_gia := true;
      end if;
      if v_rieng then
        if v_g.mat_hang_id is null then
          if v_sp.cach_ban = 'theo_hop' then v_hop_thieu := true; else v_goi_thieu := true; end if;
        elsif v_mhg.id is null then
          v_mat := true;
        elsif not v_mhg.dang_dung then
          v_ngung := true;
        elsif not v_mhg.dem_goi then
          v_khong_dem := true;
        end if;
      end if;
    end if;

    v_goi := v_goi || jsonb_build_array(jsonb_build_object(
      'id', v_g.id,
      'so_gam', v_g.so_gam,
      'gia_rieng', v_g.gia_rieng,
      'gia_tu_tinh', v_tu_tinh,
      'gia', v_gia,
      -- Không bao giờ null. Khóa ảnh chụp là CHỮ: ->> với số nguyên là chỉ số mảng, luôn ra null trên object.
      'gia_thu', (v_sp.gia_chot is null
                  or (v_sp.gia_chot -> 'goi' ->> (v_g.so_gam::text))::bigint is distinct from v_gia
                  or (v_sp.cach_ban = 'theo_can' and (v_sp.gia_chot ->> 'kg')::bigint is distinct from v_gia_kg)),
      'ma_fabi', v_g.ma_fabi,
      'ma_vach', v_g.ma_vach,
      'dang_ban', v_g.dang_ban,
      'thu_tu', v_g.thu_tu,
      'mat_hang', ban_le_mat_hang_json(v_mhg),
      'mat_hang_mat', v_g.mat_hang_id is not null and v_mhg.id is null,
      'mat_hang_ngung', v_mhg.id is not null and not v_mhg.dang_dung,
      'con_hang', v_con));
  end loop;

  if v_sp.cach_ban = 'theo_can' and v_dung and v_mh.ma_can is not null then
    -- "is null" phải viết rõ: null <= 0 là null, và giá trống chính là trường hợp cân bỏ qua dòng.
    if v_mh.gia_ban_kg is null or v_mh.gia_ban_kg <= 0 then
      v_canh := v_canh || 'chua_gia_can'::text;
    elsif v_mh.gia_ban_kg > 999999 then
      v_canh := v_canh || 'gia_qua_can'::text;
    end if;
  end if;
  if v_sp.trang_thai = 'dang_ban' and not v_co_gia then
    v_canh := v_canh || 'thieu_gia'::text;
  end if;
  if v_sp.cach_ban = 'theo_can' and v_sp.nguon_goi = 'cat_tai_quay' and v_dung and v_mh.dem_goi then
    v_canh := v_canh || 'khay_nguyen'::text;
  end if;
  if v_sp.cach_ban = 'theo_can' and v_sp.mat_hang_id is null then
    v_canh := v_canh || 'chua_gan_kho'::text;
  end if;
  if v_mat or (v_sp.cach_ban = 'theo_can' and v_sp.mat_hang_id is not null and v_mh.id is null) then
    v_canh := v_canh || 'mat_hang_mat'::text;
  end if;
  if v_ngung or (v_sp.cach_ban = 'theo_can' and v_mh.id is not null and not v_mh.dang_dung) then
    v_canh := v_canh || 'mat_hang_ngung'::text;
  end if;
  if v_khong_dem then
    v_canh := v_canh || 'goi_khong_dem_goi'::text;
  end if;
  if v_hop_thieu then
    v_canh := v_canh || 'hop_chua_co_kho'::text;
  end if;
  if v_goi_thieu then
    v_canh := v_canh || 'goi_chua_co_kho'::text;
  end if;

  -- Tồn của sản phẩm: theo cân → mặt hàng của sản phẩm (hàng cân ở quầy); theo hộp → cộng các mặt hàng hộp
  -- dùng được (mỗi mặt hàng một lần).
  if p_chi_nhanh_id is not null then
    if v_sp.cach_ban = 'theo_can' and v_dung then
      v_ton := jsonb_build_object('so_kg', v_kg_sp, 'so_goi', v_goi_sp, 'tin_duoc', v_tin);
    elsif v_sp.cach_ban = 'theo_hop' then
      select sum(t.so_kg), sum(t.so_goi) into v_kg, v_so_goi
      from (select distinct g.mat_hang_id from ban_le_goi g
            join kho_mat_hang m on m.id = g.mat_hang_id and m.dang_dung
            where g.san_pham_id = p_id) h
      cross join lateral ban_le_ton_quay(p_chi_nhanh_id, h.mat_hang_id) t;
      if v_kg is not null then
        v_ton := jsonb_build_object('so_kg', v_kg, 'so_goi', v_so_goi, 'tin_duoc', v_tin);
      end if;
    end if;
  end if;

  v_gia_moi := ban_le_gia_hien_tai(p_id);

  return (to_jsonb(v_sp) - 'ma_gui' - case when p_kem_ban_dich then '' else 'ban_dich' end)
    || jsonb_build_object(
         'mat_hang', ban_le_mat_hang_json(v_mh),
         'mat_hang_mat', v_sp.mat_hang_id is not null and v_mh.id is null,
         'mat_hang_ngung', v_mh.id is not null and not v_mh.dang_dung,
         'gia_chot_boi_ten', (select ns.ho_ten from nhan_su ns where ns.id = v_sp.gia_chot_boi),
         -- Đúng ảnh chụp ban_le_chot_gia sẽ ghi: trang gửi lại nguyên văn làm p_gia_da_xem.
         'gia_de_chot', v_gia_moi,
         'gia_thu', v_sp.gia_chot is null or v_sp.gia_chot is distinct from v_gia_moi,
         'goi', v_goi,
         'canh_bao', to_jsonb(v_canh),
         'ton', v_ton);
end;
$$;


-- =============================================================================
-- 5 · NĂM HÀM CỦA TRANG /noi-bo/ban-le — security definer, kiểm vai ở câu đầu tiên, từ chối = 42501
-- =============================================================================
-- Vai: XEM = chủ, quản lý, thu ngân, marketing · SỬA = chủ, quản lý · CHỐT GIÁ = chủ ·
-- ĐỐI CHIẾU = kho_duoc(chi nhánh, 'danh_muc') (chủ: mọi chi nhánh; quản lý: chi nhánh của mình).
-- co_vai_tro / la_chu_so_huu / kho_duoc đều đòi dang_lam: nhân sự đã nghỉ và tài khoản không có dòng nhan_su
-- bị từ chối.

-- -----------------------------------------------------------------------------
-- 5.1 · ban_le_danh_sach — menu cho trang (một sản phẩm khi có p_id; [] nếu không thấy)
-- -----------------------------------------------------------------------------
-- Thứ tự: thịt trước kim chi, rồi thu_tu, rồi tên. Tồn ở quầy chỉ khi có p_chi_nhanh_id VÀ người gọi xem được
-- kho chi nhánh đó (kho_duoc 'xem': chủ, quản lý); thu ngân và marketing không bao giờ thấy tồn.
-- CÓ CHỦ ĐÍCH: thu ngân và marketing (không có quyền xem kho) thấy tên, mã, mã cân và giá mỗi kg của mặt hàng
-- kho gắn với sản phẩm — giá cân là giá công khai ở quầy. Không bao giờ thấy giá vốn hay tồn.
create or replace function ban_le_danh_sach(p_chi_nhanh_id uuid default null, p_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cn uuid;
begin
  if not co_vai_tro(array['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing']::vai_tro[]) then
    raise exception 'Tài khoản này không xem được menu bán lẻ.' using errcode = 'insufficient_privilege';
  end if;

  v_cn := case when p_chi_nhanh_id is not null and kho_duoc(p_chi_nhanh_id, 'xem') then p_chi_nhanh_id end;

  return coalesce((
    select jsonb_agg(ban_le_san_pham_json(s.id, v_cn, p_id is not null)
                     order by case s.loai when 'thit' then 0 else 1 end, s.thu_tu, s.ten_vi, s.id)
    from ban_le_san_pham s
    where p_id is null or s.id = p_id), '[]'::jsonb);
end;
$$;

comment on function ban_le_danh_sach(uuid, uuid) is
  'Menu bán lẻ cho /noi-bo/ban-le (0097). Vai: chủ, quản lý, thu ngân, marketing. Tồn ở quầy chỉ khi xem được kho chi nhánh đó.';

-- -----------------------------------------------------------------------------
-- 5.2 · ban_le_tao_san_pham — thêm sản phẩm (bấm hai lần = một sản phẩm)
-- -----------------------------------------------------------------------------
-- p_ma_gui do trang sinh một lần cho mỗi form. Gửi lại cùng mã → trả sản phẩm đã có (da_co: true). Sản phẩm
-- mới luôn Tạm ngưng: chưa có giá, chưa gắn kho. Thịt theo cân có sẵn hai gói 200 g và 400 g.
create or replace function ban_le_tao_san_pham(p_ma_gui uuid, p_ma text, p_ten_vi text, p_loai text, p_cach_ban text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id  uuid;
  v_ten text := btrim(replace(coalesce(p_ten_vi, ''), E'\r', ''));
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

  if p_cach_ban = 'theo_can' then
    insert into ban_le_goi (san_pham_id, so_gam) values (v_id, 200), (v_id, 400);
  end if;
  return jsonb_build_object('id', v_id, 'da_co', false);
end;
$$;

comment on function ban_le_tao_san_pham(uuid, text, text, text, text) is
  'Thêm sản phẩm bán lẻ (0097), chủ / quản lý. Cùng p_ma_gui → trả sản phẩm đã có (da_co). Mới: Tạm ngưng; thịt theo cân có gói 200 g, 400 g.';

-- -----------------------------------------------------------------------------
-- 5.3 · ban_le_luu_san_pham — lưu form sửa sản phẩm
-- -----------------------------------------------------------------------------
-- p_du_lieu: ô nào vắng = giữ nguyên; JSON null = xóa ô được phép trống. Ô lạ bị từ chối (web gõ nhầm tên ô
-- thì báo lỗi, không lặng lẽ "Đã lưu" mà không lưu gì).
--   ten_vi, ten_en, ten_ko, mo_ta_vi, mo_ta_en, mo_ta_ko, cach_dung_vi, cach_dung_en, cach_dung_ko, loai,
--   cach_ban, bao_quan, nguon_goi, trang_thai, kenh_mini_app, kenh_web, thu_tu, mat_hang_id,
--   gia_ban_kg (+ gia_ban_kg_cu: giá mỗi kg trang đã thấy), goi
-- goi: tối đa 20 dòng {id?, so_gam, gia_rieng, ma_fabi, ma_vach, mat_hang_id, dang_ban, thu_tu, xoa?}.
--   Có id + xoa: true → bỏ gói (trả trong da_bo); có id → sửa; không id → thêm. Gói đang có mà danh sách không
--   nhắc tới thì GIỮ NGUYÊN — bỏ gói luôn phải nói rõ. id phải là id của một gói ĐANG CÓ của chính sản phẩm
--   này (không phải khóa tạm của gói thêm cùng lần, không phải gói vừa bỏ ở dòng trước) — khác thì "Không
--   thấy gói này — tải lại trang.".
--
-- MỌI KIỂM TRA TRƯỚC LẦN GHI ĐẦU TIÊN: hàm trả về bình thường thì PostgREST giao dịch luôn, nên một
-- {ok:false} sau khi đã ghi sản phẩm sẽ để lại bản ghi nửa vời.
--   1) khóa dòng sản phẩm; 2) phiên bản (updated_at) khác → {ok:false, ly_do:'nguoi_khac_sua'} (không lỗi);
--   3) tính giá trị đích, chưa ghi; 4) giá mỗi kg: khóa dòng mặt hàng kho, giá kho đã đổi so với lúc trang
--   đọc → {ok:false, ly_do:'gia_kho_vua_doi', gia_ban_kg}; 5) gói và luật khay nguyên (chỉ chặn lần lưu đưa
--   sản phẩm Đang bán vào cấu hình khay nguyên); 6) mới ghi.
-- Giá mỗi kg là ô gia_ban_kg của Kho → Mặt hàng: đổi cho MỌI chi nhánh, đổi cả giá cân, giá mã giảm, ô mã,
-- cách chia giá vốn khi chốt phiên lóc và báo cáo ước tính. Đổi mặt hàng kho và giá mỗi kg trong cùng một
-- lần lưu bị từ chối: gia_ban_kg_cu là giá của mặt hàng CŨ.
create or replace function ban_le_luu_san_pham(p_id uuid, p_phien_ban timestamptz, p_du_lieu jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cu        ban_le_san_pham;           -- dòng đang có (đã khóa)
  v_moi       ban_le_san_pham;           -- dòng sẽ ghi
  v_mh        kho_mat_hang;              -- mặt hàng kho sản phẩm sẽ gắn
  v_khoa      text;
  v_chu       text;
  v_so        numeric;
  v_gia_kg    bigint;                    -- giá mỗi kg mới
  v_gia_hien  bigint;                    -- giá mỗi kg trong kho lúc lưu
  v_doi_gia   boolean := false;
  v_goi_cu    jsonb := '{}'::jsonb;      -- gói đang có, khóa là id
  v_goi_moi   jsonb := '{}'::jsonb;      -- gói sau khi áp danh sách; gói thêm có khóa 'moi-<thứ tự>'
  v_bo        jsonb := '[]'::jsonb;      -- gói bị bỏ: [{so_gam, ma_fabi}]
  v_bo_id     uuid[] := '{}';
  v_g         jsonb;
  v_thu_tu    bigint;
  v_dong      jsonb;
  v_trung     int;
  v_luc       timestamptz;
  v_kq        jsonb;
begin
  if not co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[]) then
    raise exception 'Chỉ chủ và quản lý được sửa menu bán lẻ.' using errcode = 'insufficient_privilege';
  end if;
  if jsonb_typeof(p_du_lieu) is distinct from 'object' then
    raise exception 'Dữ liệu lưu không hợp lệ — tải lại trang.';
  end if;

  -- 1 · Khóa dòng: hai lần lưu cùng sản phẩm đi lần lượt.
  select * into v_cu from ban_le_san_pham where id = p_id for update;
  if not found then
    raise exception 'Không thấy sản phẩm này.';
  end if;

  -- 2 · Phiên bản.
  if v_cu.updated_at is distinct from p_phien_ban then
    return jsonb_build_object('ok', false, 'ly_do', 'nguoi_khac_sua', 'updated_at', v_cu.updated_at);
  end if;

  -- 3 · Giá trị đích.
  for v_khoa in select jsonb_object_keys(p_du_lieu) loop
    if v_khoa not in ('ten_vi', 'ten_en', 'ten_ko', 'mo_ta_vi', 'mo_ta_en', 'mo_ta_ko', 'cach_dung_vi',
                      'cach_dung_en', 'cach_dung_ko', 'loai', 'cach_ban', 'bao_quan', 'nguon_goi', 'trang_thai',
                      'kenh_mini_app', 'kenh_web', 'thu_tu', 'mat_hang_id', 'gia_ban_kg', 'gia_ban_kg_cu', 'goi') then
      raise exception 'Không nhận ô "%" — tải lại trang.', v_khoa;
    end if;
  end loop;

  v_moi := v_cu;
  if p_du_lieu ? 'ten_vi' then
    v_moi.ten_vi := ban_le_doc_chu(p_du_lieu -> 'ten_vi');
    if v_moi.ten_vi is null then
      raise exception 'Chưa điền tên sản phẩm.';
    end if;
    if char_length(v_moi.ten_vi) > 120 then
      raise exception 'Tên sản phẩm dài quá 120 ký tự.';
    end if;
  end if;
  if p_du_lieu ? 'mo_ta_vi' then
    v_moi.mo_ta_vi := ban_le_doc_chu(p_du_lieu -> 'mo_ta_vi');
    if char_length(v_moi.mo_ta_vi) > 500 then
      raise exception 'Mô tả dài quá 500 ký tự.';
    end if;
  end if;
  if p_du_lieu ? 'cach_dung_vi' then
    v_moi.cach_dung_vi := ban_le_doc_chu(p_du_lieu -> 'cach_dung_vi');
    if char_length(v_moi.cach_dung_vi) > 500 then
      raise exception 'Cách dùng dài quá 500 ký tự.';
    end if;
  end if;
  -- Bản en / ko người gõ tay: trigger ghi_so_ban_dich ghi sổ là bản 'tay'. Không giới hạn độ dài ở đây (xem
  -- ràng buộc của bảng).
  if p_du_lieu ? 'ten_en'       then v_moi.ten_en       := ban_le_doc_chu(p_du_lieu -> 'ten_en');       end if;
  if p_du_lieu ? 'ten_ko'       then v_moi.ten_ko       := ban_le_doc_chu(p_du_lieu -> 'ten_ko');       end if;
  if p_du_lieu ? 'mo_ta_en'     then v_moi.mo_ta_en     := ban_le_doc_chu(p_du_lieu -> 'mo_ta_en');     end if;
  if p_du_lieu ? 'mo_ta_ko'     then v_moi.mo_ta_ko     := ban_le_doc_chu(p_du_lieu -> 'mo_ta_ko');     end if;
  if p_du_lieu ? 'cach_dung_en' then v_moi.cach_dung_en := ban_le_doc_chu(p_du_lieu -> 'cach_dung_en'); end if;
  if p_du_lieu ? 'cach_dung_ko' then v_moi.cach_dung_ko := ban_le_doc_chu(p_du_lieu -> 'cach_dung_ko'); end if;

  if p_du_lieu ? 'loai' then
    v_moi.loai := p_du_lieu ->> 'loai';
    if v_moi.loai is null or v_moi.loai not in ('thit', 'kim_chi') then
      raise exception 'Loại sản phẩm phải là thịt bò hoặc kim chi.';
    end if;
  end if;
  if p_du_lieu ? 'cach_ban' then
    v_moi.cach_ban := p_du_lieu ->> 'cach_ban';
    if v_moi.cach_ban is null or v_moi.cach_ban not in ('theo_can', 'theo_hop') then
      raise exception 'Cách bán phải là theo cân hoặc theo hộp.';
    end if;
  end if;
  if p_du_lieu ? 'bao_quan' then
    v_moi.bao_quan := p_du_lieu ->> 'bao_quan';
    if v_moi.bao_quan is null or v_moi.bao_quan not in ('mat', 'dong_lanh', 'giu_lanh') then
      raise exception 'Cách bảo quản không hợp lệ.';
    end if;
  end if;
  if p_du_lieu ? 'nguon_goi' then
    v_moi.nguon_goi := p_du_lieu ->> 'nguon_goi';
    if v_moi.nguon_goi is null or v_moi.nguon_goi not in ('cat_tai_quay', 'dong_san') then
      raise exception 'Cách làm gói phải là cắt tại quầy hoặc đóng gói sẵn.';
    end if;
  end if;
  if p_du_lieu ? 'trang_thai' then
    v_moi.trang_thai := p_du_lieu ->> 'trang_thai';
    if v_moi.trang_thai is null or v_moi.trang_thai not in ('dang_ban', 'tam_ngung') then
      raise exception 'Trạng thái phải là Đang bán hoặc Tạm ngưng.';
    end if;
  end if;
  foreach v_khoa in array array['kenh_mini_app', 'kenh_web'] loop
    if p_du_lieu ? v_khoa and jsonb_typeof(p_du_lieu -> v_khoa) is distinct from 'boolean' then
      raise exception 'Ô "%" phải là Có hoặc Không.', v_khoa;
    end if;
  end loop;
  if p_du_lieu ? 'kenh_mini_app' then v_moi.kenh_mini_app := (p_du_lieu ->> 'kenh_mini_app')::boolean; end if;
  if p_du_lieu ? 'kenh_web'      then v_moi.kenh_web      := (p_du_lieu ->> 'kenh_web')::boolean;      end if;
  if p_du_lieu ? 'thu_tu' then
    v_so := ban_le_doc_so_nguyen(p_du_lieu -> 'thu_tu');
    if v_so is null or abs(v_so) > 1000000 then
      raise exception 'Thứ tự phải là số nguyên.';
    end if;
    v_moi.thu_tu := v_so::int;
  end if;
  if p_du_lieu ? 'mat_hang_id' then
    v_chu := ban_le_doc_chu(p_du_lieu -> 'mat_hang_id');
    if v_chu is not null and v_chu !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Không thấy mặt hàng kho này.';
    end if;
    v_moi.mat_hang_id := v_chu::uuid;
  end if;
  if v_moi.mat_hang_id is not null then
    select * into v_mh from kho_mat_hang where id = v_moi.mat_hang_id;
    if v_mh.id is null and v_moi.mat_hang_id is distinct from v_cu.mat_hang_id then
      raise exception 'Không thấy mặt hàng kho này.';
    end if;
  end if;

  -- 4 · Giá mỗi kg (ô của Kho → Mặt hàng).
  if p_du_lieu ? 'gia_ban_kg' then
    if v_moi.mat_hang_id is distinct from v_cu.mat_hang_id then
      raise exception 'Lưu mặt hàng kho trước, rồi mới sửa giá mỗi kg.';
    end if;
    if not kho_co_quyen('danh_muc') then
      raise exception 'Tài khoản này không sửa được giá mỗi kg ở Kho → Mặt hàng.' using errcode = 'insufficient_privilege';
    end if;
    if v_mh.id is null or not v_mh.dang_dung then
      raise exception 'Sản phẩm chưa gắn mặt hàng kho đang dùng, chưa sửa được giá mỗi kg.';
    end if;
    v_so := ban_le_doc_so_nguyen(p_du_lieu -> 'gia_ban_kg');
    if v_so is null or v_so < 1000 then
      raise exception 'Giá mỗi kg phải từ 1.000 đ.';
    end if;
    if v_so > 100000000 then
      raise exception 'Giá mỗi kg tối đa 100.000.000 đ.';
    end if;
    v_gia_kg := v_so::bigint;
    -- Khóa dòng mặt hàng: lần sửa nhanh / màn Mặt hàng chạy cùng lúc không bị ghi đè lặng lẽ.
    select gia_ban_kg into v_gia_hien from kho_mat_hang where id = v_mh.id for update;
    if v_gia_hien is distinct from ban_le_doc_so_nguyen(p_du_lieu -> 'gia_ban_kg_cu')::bigint then
      return jsonb_build_object('ok', false, 'ly_do', 'gia_kho_vua_doi', 'gia_ban_kg', v_gia_hien);
    end if;
    v_doi_gia := v_gia_kg is distinct from v_gia_hien;
  end if;

  -- 5 · Gói.
  select coalesce(jsonb_object_agg(g.id::text, jsonb_build_object(
           'id', g.id, 'so_gam', g.so_gam, 'gia_rieng', g.gia_rieng, 'ma_fabi', g.ma_fabi, 'ma_vach', g.ma_vach,
           'mat_hang_id', g.mat_hang_id, 'dang_ban', g.dang_ban, 'thu_tu', g.thu_tu)), '{}'::jsonb)
    into v_goi_cu
  from ban_le_goi g where g.san_pham_id = p_id;
  v_goi_moi := v_goi_cu;

  if p_du_lieu ? 'goi' then
    if jsonb_typeof(p_du_lieu -> 'goi') is distinct from 'array' then
      raise exception 'Danh sách gói không hợp lệ — tải lại trang.';
    end if;
    if jsonb_array_length(p_du_lieu -> 'goi') > 20 then
      raise exception 'Một sản phẩm có tối đa 20 gói.';
    end if;

    for v_g, v_thu_tu in select e, n from jsonb_array_elements(p_du_lieu -> 'goi') with ordinality as x(e, n) loop
      if jsonb_typeof(v_g) is distinct from 'object' then
        raise exception 'Danh sách gói không hợp lệ — tải lại trang.';
      end if;
      for v_khoa in select jsonb_object_keys(v_g) loop
        if v_khoa not in ('id', 'so_gam', 'gia_rieng', 'ma_fabi', 'ma_vach', 'mat_hang_id', 'dang_ban', 'thu_tu', 'xoa') then
          raise exception 'Không nhận ô "%" — tải lại trang.', v_khoa;
        end if;
      end loop;

      v_khoa := ban_le_doc_chu(v_g -> 'id');
      if v_khoa is not null then
        -- id phải là id THẬT của một gói đang có của sản phẩm này: khóa của v_goi_cu (gói trước lần lưu) là
        -- g.id::text, nên chuỗi nào không phải id gói (khóa tạm 'moi-<thứ tự>' của gói thêm trong chính lần này,
        -- chữ bất kỳ) đều rơi ở đây — trước khi có phép đổi ::uuid nào, không sửa lặng lẽ gói vừa thêm. Gói đã
        -- bỏ ở dòng trước của cùng danh sách (không còn trong v_goi_moi) cũng là "không thấy".
        if not (v_goi_cu ? v_khoa) or not (v_goi_moi ? v_khoa) then
          raise exception 'Không thấy gói này — tải lại trang.';
        end if;
        if v_g -> 'xoa' = 'true'::jsonb then
          v_bo := v_bo || jsonb_build_array(jsonb_build_object(
                    'so_gam', (v_goi_cu -> v_khoa ->> 'so_gam')::int, 'ma_fabi', v_goi_cu -> v_khoa ->> 'ma_fabi'));
          v_bo_id := v_bo_id || v_khoa::uuid;
          v_goi_moi := v_goi_moi - v_khoa;
          continue;
        end if;
        v_dong := v_goi_moi -> v_khoa;
      else
        if v_g -> 'xoa' = 'true'::jsonb then
          continue;   -- dòng trống người dùng chọn "Bỏ gói này": không có gì để bỏ
        end if;
        v_khoa := 'moi-' || v_thu_tu;
        v_dong := jsonb_build_object('id', null, 'so_gam', null, 'gia_rieng', null, 'ma_fabi', null,
                                     'ma_vach', null, 'mat_hang_id', null, 'dang_ban', true, 'thu_tu', 0);
      end if;

      if v_g ? 'so_gam' then
        v_so := ban_le_doc_so_nguyen(v_g -> 'so_gam');
        if v_so is null or v_so < 50 or v_so > 5000 then
          raise exception 'Trọng lượng gói phải từ 50 đến 5.000 g.';
        end if;
        v_dong := v_dong || jsonb_build_object('so_gam', v_so::int);
      end if;
      if v_g ? 'gia_rieng' then
        if ban_le_doc_chu(v_g -> 'gia_rieng') is null then
          v_dong := v_dong || jsonb_build_object('gia_rieng', null);
        else
          v_so := ban_le_doc_so_nguyen(v_g -> 'gia_rieng');
          if v_so is null or v_so < 1000 or v_so > 100000000 then
            raise exception 'Giá gói phải từ 1.000 đ đến 100.000.000 đ.';
          end if;
          if v_so % 1000 <> 0 then
            raise exception 'Giá gói phải tròn nghìn đồng.';
          end if;
          v_dong := v_dong || jsonb_build_object('gia_rieng', v_so::bigint);
        end if;
      end if;
      if v_g ? 'ma_fabi' then
        v_chu := ban_le_doc_chu(v_g -> 'ma_fabi');
        if v_chu is not null and v_chu !~ '^[A-Za-z0-9_.-]{1,40}$' then
          raise exception 'Mã FABi chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới, gạch ngang, tối đa 40 ký tự.';
        end if;
        if v_chu is not null and v_chu !~ '[A-Za-z]' then
          raise exception 'Mã FABi phải có ít nhất một chữ cái — mã toàn số dễ trùng mã cân.';
        end if;
        v_dong := v_dong || jsonb_build_object('ma_fabi', v_chu);
      end if;
      if v_g ? 'ma_vach' then
        v_chu := ban_le_doc_chu(v_g -> 'ma_vach');
        if v_chu is not null and v_chu !~ '^[0-9]{8,14}$' then
          raise exception 'Mã vạch phải gồm 8 đến 14 chữ số.';
        end if;
        v_dong := v_dong || jsonb_build_object('ma_vach', v_chu);
      end if;
      if v_g ? 'mat_hang_id' then
        v_chu := ban_le_doc_chu(v_g -> 'mat_hang_id');
        if v_chu is not null
           and (v_chu !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                or (v_chu is distinct from v_dong ->> 'mat_hang_id'
                    and not exists (select 1 from kho_mat_hang m where m.id = v_chu::uuid))) then
          raise exception 'Không thấy mặt hàng kho này.';
        end if;
        v_dong := v_dong || jsonb_build_object('mat_hang_id', v_chu::uuid);
      end if;
      if v_g ? 'dang_ban' then
        if jsonb_typeof(v_g -> 'dang_ban') is distinct from 'boolean' then
          raise exception 'Ô "%" phải là Có hoặc Không.', 'dang_ban';
        end if;
        v_dong := v_dong || jsonb_build_object('dang_ban', v_g -> 'dang_ban');
      end if;
      if v_g ? 'thu_tu' then
        v_so := ban_le_doc_so_nguyen(v_g -> 'thu_tu');
        if v_so is null or abs(v_so) > 1000000 then
          raise exception 'Thứ tự phải là số nguyên.';
        end if;
        v_dong := v_dong || jsonb_build_object('thu_tu', v_so::int);
      end if;
      if (v_dong ->> 'so_gam') is null then
        raise exception 'Trọng lượng gói phải từ 50 đến 5.000 g.';
      end if;
      v_goi_moi := v_goi_moi || jsonb_build_object(v_khoa, v_dong);
    end loop;

    if (select count(*) from jsonb_object_keys(v_goi_moi)) > 20 then
      raise exception 'Một sản phẩm có tối đa 20 gói.';
    end if;

    select (e.value ->> 'so_gam')::int into v_trung
    from jsonb_each(v_goi_moi) e
    group by 1 having count(*) > 1 order by 1 limit 1;
    if v_trung is not null then
      raise exception 'Hai gói cùng trọng lượng % g.', v_trung;
    end if;

    -- Mã FABi và mã vạch không trùng gói nào — cả của sản phẩm khác. Khóa chung cho mọi lần lưu có gói: hai
    -- sản phẩm cùng lúc nhận một mã thì lần sau thấy lần trước, không vấp ràng buộc ở cuối giao dịch.
    perform pg_advisory_xact_lock(hashtext('ban_le_goi_ma'));
    select x.ma into v_chu
    from (select e.value ->> 'ma_fabi' as ma from jsonb_each(v_goi_moi) e where e.value ->> 'ma_fabi' is not null) x
    group by x.ma
    having count(*) > 1
        or exists (select 1 from ban_le_goi g where g.ma_fabi = x.ma and g.san_pham_id <> p_id)
    order by x.ma limit 1;
    if v_chu is not null then
      raise exception 'Mã FABi % đã dùng cho gói khác.', v_chu;
    end if;
    select x.ma into v_chu
    from (select e.value ->> 'ma_vach' as ma from jsonb_each(v_goi_moi) e where e.value ->> 'ma_vach' is not null) x
    group by x.ma
    having count(*) > 1
        or exists (select 1 from ban_le_goi g where g.ma_vach = x.ma and g.san_pham_id <> p_id)
    order by x.ma limit 1;
    if v_chu is not null then
      raise exception 'Mã vạch % đã dùng cho gói khác.', v_chu;
    end if;
  end if;

  -- Khay nguyên: mặt hàng đếm theo khay thì FABi trừ NGUYÊN một khay (theo số kg trên sổ) cho mỗi gói online
  -- bán theo gói (0054: kg_moi_don_vi bị bỏ qua) — sổ kho sai ngay từ đơn đầu. Chỉ chặn lần lưu ĐƯA sản phẩm
  -- Đang bán vào cấu hình đó: chuyển sang Đang bán, hoặc (đã Đang bán) đổi mặt hàng kho / cách làm gói / cách
  -- bán. So GIÁ TRỊ cũ và mới, không so ô có mặt: form gửi lại đủ ô, kể cả ô không đổi. Mặt hàng bị đổi sang
  -- đếm theo khay ở Kho → Mặt hàng SAU khi Đang bán thì lần lưu khác vẫn được (canh_bao khay_nguyen) — chặn cả
  -- những lần đó là khóa luôn việc sửa mô tả, hay chuyển Tạm ngưng qua chính màn này. Bị chặn thì cả lần lưu
  -- bị hủy, trang giữ chữ đã gõ.
  if v_moi.trang_thai = 'dang_ban' and v_moi.cach_ban = 'theo_can' and v_moi.nguon_goi = 'cat_tai_quay'
     and v_mh.id is not null and v_mh.dang_dung and v_mh.dem_goi
     and (v_cu.trang_thai <> 'dang_ban'
          or v_moi.mat_hang_id is distinct from v_cu.mat_hang_id
          or v_moi.nguon_goi is distinct from v_cu.nguon_goi
          or v_moi.cach_ban is distinct from v_cu.cach_ban) then
    raise exception 'Chưa lưu được: gói online "Cắt tại quầy khi có đơn" trên mặt hàng kho đếm theo khay thì FABi sẽ trừ nguyên một khay cho mỗi gói. Chọn "Đóng gói sẵn", đổi mặt hàng sang cân theo kg, hoặc để Tạm ngưng.';
  end if;

  -- 6 · Ghi. Luôn cập nhật dòng sản phẩm (trigger đẩy updated_at) — kể cả khi chỉ gói đổi: phiên bản của
  -- trang phải đổi theo.
  update ban_le_san_pham set
    ten_vi = v_moi.ten_vi, ten_en = v_moi.ten_en, ten_ko = v_moi.ten_ko,
    mo_ta_vi = v_moi.mo_ta_vi, mo_ta_en = v_moi.mo_ta_en, mo_ta_ko = v_moi.mo_ta_ko,
    cach_dung_vi = v_moi.cach_dung_vi, cach_dung_en = v_moi.cach_dung_en, cach_dung_ko = v_moi.cach_dung_ko,
    loai = v_moi.loai, cach_ban = v_moi.cach_ban, bao_quan = v_moi.bao_quan, nguon_goi = v_moi.nguon_goi,
    trang_thai = v_moi.trang_thai, kenh_mini_app = v_moi.kenh_mini_app, kenh_web = v_moi.kenh_web,
    thu_tu = v_moi.thu_tu, mat_hang_id = v_moi.mat_hang_id
  where id = p_id
  returning updated_at into v_luc;

  if p_du_lieu ? 'goi' then
    -- Danh sách đích đã kiểm đủ ở trên; hoãn ba ràng buộc duy nhất tới hết phần ghi để đổi chỗ cỡ / mã giữa
    -- các gói không vấp ở dòng giữa chừng, rồi kiểm lại ngay trong hàm.
    set constraints ban_le_goi_trong_luong_duy_nhat, ban_le_goi_ma_fabi_duy_nhat, ban_le_goi_ma_vach_duy_nhat deferred;
    if cardinality(v_bo_id) > 0 then
      delete from ban_le_goi where id = any(v_bo_id) and san_pham_id = p_id;
    end if;
    for v_khoa, v_dong in select e.key, e.value from jsonb_each(v_goi_moi) e loop
      if v_khoa like 'moi-%' then
        insert into ban_le_goi (san_pham_id, so_gam, gia_rieng, ma_fabi, ma_vach, mat_hang_id, dang_ban, thu_tu)
        values (p_id, (v_dong ->> 'so_gam')::int, (v_dong ->> 'gia_rieng')::bigint, v_dong ->> 'ma_fabi',
                v_dong ->> 'ma_vach', (v_dong ->> 'mat_hang_id')::uuid, (v_dong ->> 'dang_ban')::boolean,
                (v_dong ->> 'thu_tu')::int);
      elsif v_dong is distinct from v_goi_cu -> v_khoa then
        update ban_le_goi set
          so_gam = (v_dong ->> 'so_gam')::int, gia_rieng = (v_dong ->> 'gia_rieng')::bigint,
          ma_fabi = v_dong ->> 'ma_fabi', ma_vach = v_dong ->> 'ma_vach',
          mat_hang_id = (v_dong ->> 'mat_hang_id')::uuid, dang_ban = (v_dong ->> 'dang_ban')::boolean,
          thu_tu = (v_dong ->> 'thu_tu')::int
        where id = v_khoa::uuid;
      end if;
    end loop;
    set constraints ban_le_goi_trong_luong_duy_nhat, ban_le_goi_ma_fabi_duy_nhat, ban_le_goi_ma_vach_duy_nhat immediate;
  end if;

  if v_doi_gia then
    update kho_mat_hang set gia_ban_kg = v_gia_kg where id = v_mh.id;
  end if;

  v_kq := ban_le_san_pham_json(p_id, null, false);
  return jsonb_build_object(
    'ok', true,
    'updated_at', v_luc,
    'gia_kho_doi', v_doi_gia,
    'da_bo', v_bo,
    'canh_bao', v_kq -> 'canh_bao',
    'mat_hang', v_kq -> 'mat_hang');
end;
$$;

comment on function ban_le_luu_san_pham(uuid, timestamptz, jsonb) is
  'Lưu sản phẩm bán lẻ (0097), chủ / quản lý: mọi kiểm tra trước lần ghi đầu; nguoi_khac_sua / gia_kho_vua_doi trả ok:false không ghi gì. Có thể sửa gia_ban_kg của mặt hàng kho (danh_muc).';

-- -----------------------------------------------------------------------------
-- 5.4 · ban_le_chot_gia — chủ xác nhận giá, bỏ chữ "Giá thử"
-- -----------------------------------------------------------------------------
-- p_gia_da_xem: đúng ảnh chụp trang đã hiện (gia_de_chot của ban_le_danh_sach). Giá đổi được ở Kho → Mặt hàng
-- mà không đụng dòng sản phẩm, nên phiên bản thôi chưa đủ: ảnh chụp lúc chốt khác ảnh chụp trang đã hiện →
-- {ok:false, ly_do:'gia_vua_doi', gia}. Ảnh chụp trống (không giá mỗi kg, không gói nào có giá) → lỗi.
create or replace function ban_le_chot_gia(p_id uuid, p_phien_ban timestamptz, p_gia_da_xem jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sp  ban_le_san_pham;
  v_gia jsonb;
  v_luc timestamptz;
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ được chốt giá bán lẻ.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_sp from ban_le_san_pham where id = p_id for update;
  if not found then
    raise exception 'Không thấy sản phẩm này.';
  end if;
  if v_sp.updated_at is distinct from p_phien_ban then
    return jsonb_build_object('ok', false, 'ly_do', 'nguoi_khac_sua', 'updated_at', v_sp.updated_at);
  end if;

  -- Giữ giá mỗi kg đứng yên tới hết giao dịch: ảnh chụp ghi vào phải đúng giá lúc ghi.
  if v_sp.mat_hang_id is not null then
    perform 1 from kho_mat_hang where id = v_sp.mat_hang_id for share;
  end if;
  v_gia := ban_le_gia_hien_tai(p_id);

  if v_gia is distinct from p_gia_da_xem then
    return jsonb_build_object('ok', false, 'ly_do', 'gia_vua_doi', 'gia', v_gia);
  end if;
  if v_gia -> 'kg' = 'null'::jsonb and v_gia -> 'goi' = '{}'::jsonb then
    raise exception 'Chưa có giá nào để chốt.';
  end if;
  if v_sp.gia_chot is not distinct from v_gia then
    return jsonb_build_object('ok', true, 'da_chot_roi', true, 'updated_at', v_sp.updated_at);
  end if;

  update ban_le_san_pham
     set gia_chot = v_gia, gia_chot_luc = now(), gia_chot_boi = (nhan_su_hien_tai()).id
   where id = p_id
  returning updated_at into v_luc;
  return jsonb_build_object('ok', true, 'updated_at', v_luc);
end;
$$;

comment on function ban_le_chot_gia(uuid, timestamptz, jsonb) is
  'Chủ chốt giá bán lẻ (0097): ghi ảnh chụp giá vào gia_chot. ok:false khi người khác vừa sửa hoặc giá vừa đổi so với trang đã hiện.';

-- -----------------------------------------------------------------------------
-- 5.5 · ban_le_doi_chieu — việc phải làm trên FABi của một chi nhánh
-- -----------------------------------------------------------------------------
-- FABi sửa tay (API iPOS chỉ đọc thực đơn). Không có giá FABi nào trong database (có chủ đích —
-- kho_ipos_menu không lưu giá), nên trang ghi "so giá trên FABi bằng tay" và hiện giá phải đặt.
-- Đầu: {menu_luc, menu_can_lam_moi, bat, so_mon_menu, menu_cu, dong}. menu_cu = chưa đọc được thực đơn, đọc
-- đã quá 2 giờ, đồng bộ đang tắt, hoặc iPOS báo thực đơn vừa đổi: khi đó KHÔNG BAO GIỜ nói "chưa có trên FABi"
-- (viec menu_cu thay cho tao_mon / bat_mon).
-- Dòng (loai_dong):
--   can      — mỗi mặt hàng dùng được, có mã cân, của sản phẩm theo cân (mọi trạng thái; nhiều sản phẩm cùng
--              mặt hàng gom một dòng). Ghép đúng: kiểu mon / goi_can, đúng mặt hàng, không ô, bán theo kg (hoặc
--              "theo món kho" khi mặt hàng chỉ cân kg). goi_can không mặt hàng là sua_ghep: dòng bán FABi không
--              bao giờ mang mã cân, nên không bao giờ khớp được (0054). Mã FABi so sau khi bỏ số 0 đầu như
--              kho_ipos_ghi_dong; hiện mã FABi thật.
--   o_ma     — mỗi ô mã của mặt hàng đó (giá = giá mỗi kg); ma_giam — mỗi mã giảm đang dùng (giá kho_gia_giam).
--              Chưa ghép vẫn đúng (iPOS tự khớp theo số) — chỉ kiểm có / đang bán trên FABi và giá phải đặt.
--   goi      — mỗi gói của sản phẩm Đang bán đang bán. Cắt tại quầy: kiểu mon, mặt hàng của sản phẩm, bán theo
--              gói, mỗi gói = số gam / 1000 kg (chỉ so kg khi mặt hàng cân kg; đếm theo khay thì khay_nguyen).
--              Đóng sẵn / hộp: kiểu mon, mặt hàng của gói, bán theo gói hoặc theo món kho.
--              Sản phẩm Tạm ngưng hoặc gói ngưng bán mà mã FABi còn đang bán → tat_mon.
--   kiem_tra — mã FABi đang bán, ghép bán theo gói vào một mặt hàng của menu bán lẻ, mà không phải mã gói nào
--              của menu, không phải mã cân / ô mã / mã giảm mà các dòng trên đòi, không ghép vào ô mã →
--              kiem_tra_mon (xem lại, không phải lệnh tắt).
-- Mỗi dòng có don_vi: 'goi' / 'hop' (dòng gói của sản phẩm theo cân / theo hộp) hoặc null — trang ghi "gói 200 g"
-- hay "hộp 500 g".
-- Việc (viec): khop (chỉ khi không còn việc nào khác), menu_cu, tao_mon, bat_mon, ghep, sua_ghep, dat_gia (giá
-- chưa chốt hoặc đã đổi sau lần chốt), thieu_gia (gói đang bán chưa có giá; dòng mã cân / ô mã / mã giảm: giá
-- mỗi kg trống hay 0 đ — Beeftown Cân bỏ qua dòng, gia_phai_dat null), gia_qua_can, khay_nguyen, thieu_mat_hang,
-- goi_khong_dem_goi, chua_co_ma, tat_mon, kiem_tra_mon.
create or replace function ban_le_doi_chieu(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_c       kho_ipos_cau_hinh;
  v_so_mon  int;
  v_cu      boolean;
  v_dong    jsonb := '[]'::jsonb;
  r         record;
  q         record;
  v_sp      ban_le_san_pham;
  v_g       ban_le_goi;
  v_mh      kho_mat_hang;     -- mặt hàng của sản phẩm
  v_mhg     kho_mat_hang;     -- mặt hàng của gói
  v_mong    kho_mat_hang;     -- mặt hàng phép ghép phải trỏ tới
  v_menu    kho_ipos_menu;
  v_map     kho_ipos_ma_hang;
  v_ma      text;
  v_viec    text[];
  v_gia     bigint;
  v_gia_kg  bigint;
  v_thu     boolean;
  v_rieng   boolean;
  v_dung    boolean;
  v_tren    jsonb;
  v_don_vi  text;             -- dòng gói: 'goi' (theo cân) / 'hop' (theo hộp)
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản này không đối chiếu được FABi ở chi nhánh này.' using errcode = 'insufficient_privilege';
  end if;

  select * into v_c from kho_ipos_cau_hinh where chi_nhanh_id = p_chi_nhanh_id;
  select count(*) into v_so_mon from kho_ipos_menu where chi_nhanh_id = p_chi_nhanh_id;
  v_cu := v_c.menu_luc is null or v_c.menu_luc < now() - interval '2 hours'
          or not coalesce(v_c.bat, false) or coalesce(v_c.menu_can_lam_moi, false);

  -- ---- Mã cân, ô mã, mã giảm của mặt hàng sản phẩm theo cân ------------------------------------------------
  for r in
    select m.id, m.ten, m.ma_can, m.gia_ban_kg, m.dem_goi,
           (array_agg(s.id order by case s.loai when 'thit' then 0 else 1 end, s.thu_tu, s.ten_vi, s.id))[1] as san_pham_id,
           string_agg(s.ten_vi, ' · ' order by case s.loai when 'thit' then 0 else 1 end, s.thu_tu, s.ten_vi, s.id) as ten_san_pham,
           bool_or(s.gia_chot is null or (s.gia_chot ->> 'kg')::bigint is distinct from m.gia_ban_kg) as gia_thu,
           min(case s.loai when 'thit' then 0 else 1 end) as nhom_sp, min(s.thu_tu) as thu_tu_sp,
           min(s.ten_vi) as ten_sp
    from ban_le_san_pham s
    join kho_mat_hang m on m.id = s.mat_hang_id and m.dang_dung
    where s.cach_ban = 'theo_can'
    group by m.id
    order by nhom_sp, thu_tu_sp, ten_sp, m.id
  loop
    if r.ma_can is not null then
      -- Món trên FABi có mã = mã cân (FABi có thể thêm số 0 đầu); ưu tiên mã trùng đúng từng ký tự.
      v_menu := null;
      select * into v_menu from kho_ipos_menu mn
      where mn.chi_nhanh_id = p_chi_nhanh_id and nullif(ltrim(btrim(mn.ma_ipos), '0'), '') = r.ma_can
      order by (mn.ma_ipos = r.ma_can) desc, mn.dang_ban desc, mn.ma_ipos limit 1;
      v_map := null;
      if v_menu.ma_ipos is not null then
        select * into v_map from kho_ipos_ma_hang mp
        where mp.chi_nhanh_id = p_chi_nhanh_id and mp.ma_ipos = v_menu.ma_ipos;
      else
        select * into v_map from kho_ipos_ma_hang mp
        where mp.chi_nhanh_id = p_chi_nhanh_id and nullif(ltrim(btrim(mp.ma_ipos), '0'), '') = r.ma_can
        order by (mp.ma_ipos = r.ma_can) desc, mp.ma_ipos limit 1;
      end if;
      v_ma := coalesce(v_menu.ma_ipos, v_map.ma_ipos, r.ma_can);

      v_viec := '{}';
      if v_menu.ma_ipos is null then
        v_viec := v_viec || case when v_cu then 'menu_cu' else 'tao_mon' end;
      elsif not v_menu.dang_ban then
        v_viec := v_viec || case when v_cu then 'menu_cu' else 'bat_mon' end;
      end if;
      -- "Ghép đúng" bọc coalesce(…, false): ô trống của Ghép món (don_vi_ban null) làm phép so ra NULL, và
      -- "not NULL" cũng là NULL — thiếu coalesce thì ghép SAI (mặt hàng đếm khay ghép "theo món kho") lọt qua.
      if v_map.id is null then
        v_viec := v_viec || 'ghep'::text;
      elsif not coalesce(v_map.kieu in ('mon', 'goi_can') and v_map.mat_hang_id is not distinct from r.id
                         and v_map.o_ma_id is null
                         and (v_map.don_vi_ban is not distinct from 'kg' or (v_map.don_vi_ban is null and not r.dem_goi)),
                         false) then
        v_viec := v_viec || 'sua_ghep'::text;
      end if;
      -- Giá trống hay 0 đ: Beeftown Cân bỏ qua dòng (cân không bán được mã này) — thieu_gia, không bao giờ khop,
      -- không dat_gia (không có giá nào để đặt). Quá cửa sổ 6 chữ số: gia_qua_can.
      if r.gia_ban_kg is null or r.gia_ban_kg <= 0 then
        v_viec := v_viec || 'thieu_gia'::text;
      else
        if r.gia_ban_kg > 999999 then
          v_viec := v_viec || 'gia_qua_can'::text;
        end if;
        if r.gia_thu then
          v_viec := v_viec || 'dat_gia'::text;
        end if;
      end if;
      if cardinality(v_viec) = 0 then
        v_viec := array['khop'];
      end if;

      v_dong := v_dong || jsonb_build_array(jsonb_build_object(
        'loai_dong', 'can', 'ma_fabi', v_ma, 'ma_can', r.ma_can, 'so_o', null, 'phan_tram', null, 'don_vi', null,
        'ten_san_pham', r.ten_san_pham, 'san_pham_id', r.san_pham_id, 'so_gam', null,
        -- Giá trống / 0 đ: không có giá nào để đặt — null, không bao giờ "đặt 0 đ/kg trên FABi".
        'gia_phai_dat', case when r.gia_ban_kg > 0 then r.gia_ban_kg end,
        'tren_fabi', case when v_menu.ma_ipos is not null then jsonb_build_object(
                            'co', true, 'ma', v_menu.ma_ipos, 'ten', v_menu.ten_ipos, 'dang_ban', v_menu.dang_ban)
                          when v_cu then null
                          else jsonb_build_object('co', false, 'ma', null, 'ten', null, 'dang_ban', null) end,
        'ghep', case when v_map.id is null then null else jsonb_build_object(
                  'kieu', v_map.kieu, 'mat_hang_ten', (select ten from kho_mat_hang where id = v_map.mat_hang_id),
                  'don_vi_ban', v_map.don_vi_ban, 'kg_moi_don_vi', v_map.kg_moi_don_vi) end,
        'mong_doi', jsonb_build_object('kieu', 'mon', 'mat_hang_ten', r.ten, 'don_vi_ban', 'kg', 'kg_moi_don_vi', null),
        'viec', to_jsonb(v_viec)));
    end if;

    -- Ô mã và mã giảm: một món FABi riêng mỗi mã, giá cố định trên FABi.
    for q in
      select 'o_ma'::text as loai_dong, 0 as nhom, o.so_o as thu_tu, o.ma_can, r.gia_ban_kg as gia,
             o.so_o, null::int as phan_tram
      from kho_o_ma o where o.mat_hang_id = r.id
      union all
      select 'ma_giam', 1, g.phan_tram, g.ma_can, kho_gia_giam(r.gia_ban_kg, g.phan_tram), null, g.phan_tram
      from kho_ma_giam g where g.mat_hang_id = r.id and g.dang_dung
      order by 2, 3
    loop
      v_ma := q.ma_can;
      -- Giá phải đặt chỉ khi có thật: giá mỗi kg trống / 0 đ (hay giá giảm làm tròn ra 0) → null.
      v_gia := case when q.gia > 0 then q.gia end;
      v_tren := jsonb_build_object('loai_dong', q.loai_dong, 'so_o', q.so_o, 'phan_tram', q.phan_tram, 'don_vi', null);
      v_menu := null;
      select * into v_menu from kho_ipos_menu mn
      where mn.chi_nhanh_id = p_chi_nhanh_id and nullif(ltrim(btrim(mn.ma_ipos), '0'), '') = v_ma
      order by (mn.ma_ipos = v_ma) desc, mn.dang_ban desc, mn.ma_ipos limit 1;
      v_map := null;
      select * into v_map from kho_ipos_ma_hang mp
      where mp.chi_nhanh_id = p_chi_nhanh_id and mp.ma_ipos = coalesce(v_menu.ma_ipos, v_ma);

      v_viec := '{}';
      if v_menu.ma_ipos is null then
        v_viec := v_viec || case when v_cu then 'menu_cu' else 'tao_mon' end;
      elsif not v_menu.dang_ban then
        v_viec := v_viec || case when v_cu then 'menu_cu' else 'bat_mon' end;
      end if;
      -- Như dòng mã cân: không có giá để đặt (v_gia null ở trên) → thieu_gia, không bao giờ khop.
      if v_gia is null then
        v_viec := v_viec || 'thieu_gia'::text;
      else
        if v_gia > 999999 then
          v_viec := v_viec || 'gia_qua_can'::text;
        end if;
        if r.gia_thu then
          v_viec := v_viec || 'dat_gia'::text;
        end if;
      end if;
      if cardinality(v_viec) = 0 then
        v_viec := array['khop'];
      end if;

      v_dong := v_dong || jsonb_build_array(v_tren || jsonb_build_object(
        'ma_fabi', coalesce(v_menu.ma_ipos, v_ma), 'ma_can', v_ma,
        'ten_san_pham', r.ten_san_pham, 'san_pham_id', r.san_pham_id, 'so_gam', null,
        'gia_phai_dat', v_gia,
        'tren_fabi', case when v_menu.ma_ipos is not null then jsonb_build_object(
                            'co', true, 'ma', v_menu.ma_ipos, 'ten', v_menu.ten_ipos, 'dang_ban', v_menu.dang_ban)
                          when v_cu then null
                          else jsonb_build_object('co', false, 'ma', null, 'ten', null, 'dang_ban', null) end,
        'ghep', case when v_map.id is null then null else jsonb_build_object(
                  'kieu', v_map.kieu, 'mat_hang_ten', (select ten from kho_mat_hang where id = v_map.mat_hang_id),
                  'don_vi_ban', v_map.don_vi_ban, 'kg_moi_don_vi', v_map.kg_moi_don_vi) end,
        'mong_doi', null,
        'viec', to_jsonb(v_viec)));
    end loop;
  end loop;

  -- ---- Gói online / hộp ---------------------------------------------------------------------------------------
  for v_sp in
    select * from ban_le_san_pham s
    order by case s.loai when 'thit' then 0 else 1 end, s.thu_tu, s.ten_vi, s.id
  loop
    v_mh := null;
    if v_sp.mat_hang_id is not null then
      select * into v_mh from kho_mat_hang where id = v_sp.mat_hang_id;
    end if;
    v_dung := v_mh.id is not null and v_mh.dang_dung;
    v_gia_kg := case when v_sp.cach_ban = 'theo_can' and v_dung then v_mh.gia_ban_kg end;
    v_rieng := v_sp.cach_ban = 'theo_hop' or v_sp.nguon_goi = 'dong_san';
    v_don_vi := 'goi';
    if v_sp.cach_ban = 'theo_hop' then
      v_don_vi := 'hop';
    end if;

    for v_g in select * from ban_le_goi where san_pham_id = v_sp.id order by so_gam loop
      v_menu := null;
      if v_g.ma_fabi is not null then
        select * into v_menu from kho_ipos_menu mn
        where mn.chi_nhanh_id = p_chi_nhanh_id and mn.ma_ipos = v_g.ma_fabi;
      end if;

      -- Không bán (sản phẩm Tạm ngưng hoặc gói ngưng): chỉ có việc khi FABi còn đang bán mã đó.
      if v_sp.trang_thai <> 'dang_ban' or not v_g.dang_ban then
        if v_menu.ma_ipos is not null and v_menu.dang_ban then
          v_map := null;
          select * into v_map from kho_ipos_ma_hang mp
          where mp.chi_nhanh_id = p_chi_nhanh_id and mp.ma_ipos = v_g.ma_fabi;
          v_dong := v_dong || jsonb_build_array(jsonb_build_object(
            'loai_dong', 'goi', 'ma_fabi', v_g.ma_fabi, 'ma_can', null, 'so_o', null, 'phan_tram', null,
            'don_vi', v_don_vi,
            'ten_san_pham', v_sp.ten_vi, 'san_pham_id', v_sp.id, 'so_gam', v_g.so_gam,
            'gia_phai_dat', null,
            'tren_fabi', jsonb_build_object('co', true, 'ma', v_menu.ma_ipos, 'ten', v_menu.ten_ipos, 'dang_ban', true),
            'ghep', case when v_map.id is null then null else jsonb_build_object(
                      'kieu', v_map.kieu, 'mat_hang_ten', (select ten from kho_mat_hang where id = v_map.mat_hang_id),
                      'don_vi_ban', v_map.don_vi_ban, 'kg_moi_don_vi', v_map.kg_moi_don_vi) end,
            'mong_doi', null,
            'viec', jsonb_build_array('tat_mon')));
        end if;
        continue;
      end if;

      v_mhg := null;
      if v_g.mat_hang_id is not null then
        select * into v_mhg from kho_mat_hang where id = v_g.mat_hang_id;
      end if;
      v_mong := case when v_rieng then v_mhg else v_mh end;
      v_gia := ban_le_gia_ban(v_g.gia_rieng, v_sp.cach_ban, v_gia_kg, v_g.so_gam);
      v_thu := v_sp.gia_chot is null
               or (v_sp.gia_chot -> 'goi' ->> (v_g.so_gam::text))::bigint is distinct from v_gia
               or (v_sp.cach_ban = 'theo_can' and (v_sp.gia_chot ->> 'kg')::bigint is distinct from v_gia_kg);

      v_viec := '{}';
      if v_mong.id is null or not v_mong.dang_dung then
        v_viec := v_viec || 'thieu_mat_hang'::text;
      elsif v_rieng and not v_mong.dem_goi then
        v_viec := v_viec || 'goi_khong_dem_goi'::text;
      elsif not v_rieng and v_mong.dem_goi then
        v_viec := v_viec || 'khay_nguyen'::text;
      end if;

      v_map := null;
      if v_g.ma_fabi is null then
        v_viec := v_viec || 'chua_co_ma'::text;
      else
        if v_menu.ma_ipos is null then
          v_viec := v_viec || case when v_cu then 'menu_cu' else 'tao_mon' end;
        elsif not v_menu.dang_ban then
          v_viec := v_viec || case when v_cu then 'menu_cu' else 'bat_mon' end;
        end if;
        select * into v_map from kho_ipos_ma_hang mp
        where mp.chi_nhanh_id = p_chi_nhanh_id and mp.ma_ipos = v_g.ma_fabi;
        -- coalesce(…, false) như dòng mã cân: gói cắt tại quầy ghép "theo món kho" (don_vi_ban trống — mặt hàng
        -- cân kg thì iPOS trừ 1 kg mỗi gói) hay "theo gói" thiếu "mỗi gói = … kg" (iPOS từ chối dòng bán, 0054)
        -- làm phép so ra NULL — vẫn là ghép sai.
        if v_map.id is null then
          v_viec := v_viec || 'ghep'::text;
        elsif v_mong.id is not null and v_mong.dang_dung and not coalesce(
                v_map.kieu = 'mon' and v_map.mat_hang_id = v_mong.id and v_map.o_ma_id is null
                and case when v_rieng then v_map.don_vi_ban is null or v_map.don_vi_ban = 'goi'
                         else v_map.don_vi_ban is not distinct from 'goi'
                              and (v_mong.dem_goi or v_map.kg_moi_don_vi = v_g.so_gam / 1000.0) end,
                false) then
          v_viec := v_viec || 'sua_ghep'::text;
        end if;
      end if;
      if v_gia is null then
        v_viec := v_viec || 'thieu_gia'::text;
      elsif v_thu then
        v_viec := v_viec || 'dat_gia'::text;
      end if;
      if cardinality(v_viec) = 0 then
        v_viec := array['khop'];
      end if;

      v_dong := v_dong || jsonb_build_array(jsonb_build_object(
        'loai_dong', 'goi', 'ma_fabi', v_g.ma_fabi, 'ma_can', null, 'so_o', null, 'phan_tram', null,
        'don_vi', v_don_vi,
        'ten_san_pham', v_sp.ten_vi, 'san_pham_id', v_sp.id, 'so_gam', v_g.so_gam,
        'gia_phai_dat', v_gia,
        'tren_fabi', case when v_g.ma_fabi is null then null
                          when v_menu.ma_ipos is not null then jsonb_build_object(
                            'co', true, 'ma', v_menu.ma_ipos, 'ten', v_menu.ten_ipos, 'dang_ban', v_menu.dang_ban)
                          when v_cu then null
                          else jsonb_build_object('co', false, 'ma', null, 'ten', null, 'dang_ban', null) end,
        'ghep', case when v_map.id is null then null else jsonb_build_object(
                  'kieu', v_map.kieu, 'mat_hang_ten', (select ten from kho_mat_hang where id = v_map.mat_hang_id),
                  'don_vi_ban', v_map.don_vi_ban, 'kg_moi_don_vi', v_map.kg_moi_don_vi) end,
        'mong_doi', jsonb_build_object(
                      'kieu', 'mon', 'mat_hang_ten', v_mong.ten, 'don_vi_ban', 'goi',
                      'kg_moi_don_vi', case when not v_rieng and not coalesce(v_mong.dem_goi, false)
                                            then v_g.so_gam / 1000.0 end),
        'viec', to_jsonb(v_viec)));
    end loop;
  end loop;

  -- ---- Mã FABi đang bán, trừ cùng mặt hàng theo gói, mà menu bán lẻ không có -----------------------------
  -- Không bao giờ bảo xem lại / tắt một mã mà mục khác của trang ĐÒI có trên FABi — và chỉ loại ĐÚNG những mã
  -- đó: mã cân, ô mã, mã giảm ĐANG DÙNG của mặt hàng dùng được của sản phẩm theo cân (đúng tập dòng can / o_ma /
  -- ma_giam ở trên tạo ra). Mã so sau khi bỏ số 0 đầu như kho_ipos_ghi_dong. Mã giảm đã tắt, mã cân của mặt hàng
  -- ngừng dùng hay của mặt hàng hộp không dòng nào đòi — FABi còn bán chúng theo gói thì vẫn phải xem lại. Loại
  -- thêm dòng ghép vào ô mã (o_ma_id — hàng cân của ô, không phải gói). Dòng bán theo kg đã ngoài điều kiện đơn
  -- vị ở dưới (chỉ 'goi', hoặc "theo món kho" của mặt hàng đếm theo gói).
  for r in
    with lien_ket as (
      select s.mat_hang_id as id from ban_le_san_pham s where s.mat_hang_id is not null
      union
      select g.mat_hang_id from ban_le_goi g where g.mat_hang_id is not null
    ),
    mh_dong_can as (
      select distinct m.id, m.ma_can
      from ban_le_san_pham s
      join kho_mat_hang m on m.id = s.mat_hang_id and m.dang_dung
      where s.cach_ban = 'theo_can'
    ),
    ma_duoc_doi as (
      select c.ma_can from mh_dong_can c where c.ma_can is not null
      union
      select o.ma_can from kho_o_ma o join mh_dong_can c on c.id = o.mat_hang_id
      union
      select g.ma_can from kho_ma_giam g join mh_dong_can c on c.id = g.mat_hang_id where g.dang_dung
    )
    select mp.ma_ipos, mp.kieu, mp.don_vi_ban, mp.kg_moi_don_vi, m.ten as mat_hang_ten, mn.ten_ipos
    from kho_ipos_ma_hang mp
    join kho_mat_hang m on m.id = mp.mat_hang_id
    join kho_ipos_menu mn on mn.chi_nhanh_id = mp.chi_nhanh_id and mn.ma_ipos = mp.ma_ipos and mn.dang_ban
    where mp.chi_nhanh_id = p_chi_nhanh_id
      and (mp.don_vi_ban = 'goi' or (mp.don_vi_ban is null and m.dem_goi))
      and mp.o_ma_id is null
      and mp.mat_hang_id in (select id from lien_ket)
      and not exists (select 1 from ban_le_goi g where g.ma_fabi = mp.ma_ipos)
      and not exists (select 1 from ma_duoc_doi d where d.ma_can = nullif(ltrim(btrim(mp.ma_ipos), '0'), ''))
    order by mp.ma_ipos
  loop
    v_dong := v_dong || jsonb_build_array(jsonb_build_object(
      'loai_dong', 'kiem_tra', 'ma_fabi', r.ma_ipos, 'ma_can', null, 'so_o', null, 'phan_tram', null, 'don_vi', null,
      'ten_san_pham', null, 'san_pham_id', null, 'so_gam', null, 'gia_phai_dat', null,
      'tren_fabi', jsonb_build_object('co', true, 'ma', r.ma_ipos, 'ten', r.ten_ipos, 'dang_ban', true),
      'ghep', jsonb_build_object('kieu', r.kieu, 'mat_hang_ten', r.mat_hang_ten,
                                 'don_vi_ban', r.don_vi_ban, 'kg_moi_don_vi', r.kg_moi_don_vi),
      'mong_doi', null,
      'viec', jsonb_build_array('kiem_tra_mon')));
  end loop;

  return jsonb_build_object(
    'menu_luc', v_c.menu_luc,
    'menu_can_lam_moi', coalesce(v_c.menu_can_lam_moi, false),
    'bat', coalesce(v_c.bat, false),
    'so_mon_menu', v_so_mon,
    'menu_cu', v_cu,
    'dong', v_dong);
end;
$$;

comment on function ban_le_doi_chieu(uuid) is
  'Đối chiếu menu bán lẻ với FABi của một chi nhánh (0097), danh_muc: mã cân, ô mã, mã giảm, gói; việc phải làm trên FABi. Không đọc giá FABi (không lưu ở đâu).';



-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6. Giữ dòng ve_con_hieu_luc: xem 0025.
-- =============================================================================
-- Chép nguyên văn từ 0093. File này KHÔNG thêm hàm anon nào: năm hàm ban_le_* là của trang nội bộ (tự kiểm
-- vai, test-quyen-ghi-thang-crm.mjs XEP_LOAI). Migration sau chép khối này, đừng chép khối của 0062 trở về
-- trước.
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

    -- Mini App Zalo (0093): chỉ trạng thái còn hàng, không số khay, không dữ liệu khách
    execute 'grant execute on function mini_app_con_hang(text) to anon';
  end if;
end
$$;

-- Hàm nội bộ của mục 4: revoke from public / anon ở trên KHÔNG gỡ quyền authenticated nhận qua quyền mặc định
-- của Supabase. Những hàm đọc bảng kho (hay ghép từ hàm đọc kho) và hàm đọc số chỉ năm hàm definer gọi: thu
-- lại. ban_le_gia_goi để nguyên — hàm thuần, không đọc bảng nào (kiểm thử so nó với bản TypeScript).
-- Hai hàm trigger cũng thu: Postgres không kiểm quyền EXECUTE của hàm trigger lúc trigger chạy.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function ban_le_gia_ban(bigint, text, bigint, int) from authenticated';
    execute 'revoke execute on function ban_le_doc_so_nguyen(jsonb) from authenticated';
    execute 'revoke execute on function ban_le_doc_chu(jsonb) from authenticated';
    execute 'revoke execute on function ban_le_mat_hang_json(kho_mat_hang) from authenticated';
    execute 'revoke execute on function ban_le_ton_quay(uuid, uuid) from authenticated';
    execute 'revoke execute on function ban_le_ton_tin_duoc(uuid) from authenticated';
    execute 'revoke execute on function ban_le_gia_hien_tai(uuid) from authenticated';
    execute 'revoke execute on function ban_le_san_pham_json(uuid, uuid, boolean) from authenticated';
    execute 'revoke execute on function ban_le_san_pham_giu_ma() from authenticated';
    execute 'revoke execute on function ban_le_kiem_mat_hang() from authenticated';
  end if;
end
$$;
