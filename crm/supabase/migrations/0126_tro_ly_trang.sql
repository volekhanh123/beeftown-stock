-- =============================================================================
-- 0126 · TRỢ LÝ TRANG — KHUNG CHAT TƯ VẤN CHỌN BÒ Ở TRANG MUA THỊT VỀ (Khánh 17–18/11/2026)
-- =============================================================================
-- PHẢI CHẠY SAU 0084 (gioi_han_lay_luot), 0101 / 0113 (mua_thit_ve_cong_khai), 0115 (thân suc_khoe_so_lieu mới nhất).
--
-- Khánh 17/11/2026: để khách tự chọn bò thì khó bán lẻ — cần người tư vấn như video đào tạo thịt bò, khách nhắn tự do,
-- không bấm nút. 18/11/2026: đưa lên web, trợ lý xưng tên như người ("em là Trang bên Beeftown"), không chữ AI, bot, tự
-- động trong tin nào. ĐÚNG MỘT dòng gạch dưới cố định dưới tên Trang ở đầu khung chat có chữ "trợ lý ảo" (bấm vào mới
-- hiện phần giải thích), và Trang nói thật khi khách hỏi người hay máy ("em là trợ lý ảo của Beeftown"): chính sách dùng
-- của Anthropic và Luật Trí tuệ nhân tạo 134/2025/QH15, Điều 11 (hiệu lực 01/03/2026) buộc cho khách biết từ đầu.
-- 18/11/2026 13:35: Khánh sẽ làm cổng nội bộ để nhân viên theo dõi các cuộc chat và nhận tư vấn — cuộc chat và từng tin
-- lưu ở database (mục 3b), nhân viên nhận thì Edge Function không gọi Claude cho cuộc đó nữa (mục 4b).
--
-- Máy trả lời là Claude Haiku 5.5 chạy trong Edge Function tro-ly-trang của Supabase
-- (crm/supabase/functions/tro-ly-trang). Hàm đó gọi database bằng khóa service_role mà Supabase tự cấp cho Edge Function
-- — web (Cloudflare) không có khóa này, và anon, nhân viên KHÔNG gọi được hai hàm của nó.
--
-- File này:
--   1 · Công tắc hien_tro_ly_trang (nhóm mua_thit, chỉ chủ công bố). Chưa công bố = TẮT: không khung chat, và hàm
--       tro_ly_mo_luot từ chối mọi lượt (gọi thẳng Edge Function cũng không tốn tiền Claude).
--   2 · Sổ học tro_ly_so_hoc: câu Trang chưa biết (tự ghi khi phải mời khách liên hệ quán), câu trả lời chủ / quản lý
--       viết và duyệt ở /noi-bo/tro-ly. Chỉ câu "Đã học" vào lời dặn của Trang. Sửa thẳng bảng qua RLS như 0117.
--       Ghi sẵn năm câu Khánh đã duyệt ở bản thử ngày 18/11 và một câu chờ trả lời (giờ mở cửa).
--   3 · Nhật ký tro_ly_luot: mỗi tin khách là một dòng — chữ khách ĐÃ CHE số điện thoại, email, địa chỉ (Edge Function
--       che trước khi gửi Claude; hàm ở đây che số điện thoại, email lần nữa), các tin Trang trả lời, máy kiểm tiếng
--       Việt có phải viết lại không, số token. Không lưu IP. Dọn dòng quá 180 ngày.
--   3b · Cuộc chat tro_ly_cuoc (ai đang trả lời: Trang hay nhân viên nào; vì sao cần người) và tin nhắn tro_ly_tin (đúng
--       thứ khách thấy, theo thứ tự: khách đã che, Trang, nhân viên, câu hệ thống). tro_ly_truc: nhân viên đang mở màn
--       theo dõi (dòng dưới tên Trang chỉ được nói "có nhân viên theo dõi" khi thật sự có người).
--   4 · tro_ly_mo_luot / tro_ly_ghi_luot / tro_ly_xem — ba hàm của Edge Function (chỉ service_role). tro_ly_xem: khung
--       chat của khách hỏi lại vài giây một lần khi đang mở — nhận tin nhân viên, "nhân viên đang soạn tin".
--   4b · Nhân viên nhận tư vấn (chủ, quản lý, thu ngân đang làm, chi nhánh của mình — như hộp thư don_mua_thit):
--       tro_ly_ds_cuoc, tro_ly_xem_cuoc, tro_ly_nhan_cuoc, tro_ly_tra_cuoc, tro_ly_nv_gui, tro_ly_nv_dang_go,
--       tro_ly_dang_truc. Màn /noi-bo dùng các hàm này làm ở PR sau.
--   5 · suc_khoe_so_lieu thêm ô tro_ly — đèn "Trợ lý Trang" của bảng sức khỏe.
--   6 · Quyền.
--
-- GỬI HAI LẦN: mỗi tin khách mang mã ma_tin (trình duyệt tạo). Cùng (cuộc chat, ma_tin) — bấm đúp, mạng chập rồi trình
-- duyệt gửi lại — chỉ một dòng, chỉ một lần gọi Claude: đang trả lời thì báo "đang trả lời", đã trả lời thì trả lại
-- đúng câu cũ. Một cuộc chat khóa theo advisory lock nên số lượt không bao giờ trùng.
--
-- GIỚI HẠN (tiền Claude): 30 lượt mỗi cuộc chat, 40 lượt mỗi giờ mỗi IP, 2.000 lượt mỗi ngày cả quán
-- (gioi_han_lay_luot của 0084 — IP chỉ nằm ở đó, tự xóa sau một ngày).
--
-- Có câu delete trong thân hàm (tro_ly_ghi_luot dọn nhật ký, cuộc chat quá 180 ngày) — không câu delete nào chạy
-- lúc nạp file. Không thêm giá trị enum. Chỉ chạy lên production SAU khi PR được gộp, bằng SQL Editor (cả file một
-- lần), rồi `npm run doi-chieu` phải báo KHỚP. Chạy migration TRƯỚC, deploy web và Edge Function SAU: web cũ không đọc
-- gì mới; web mới với database cũ thì khóa hien_tro_ly_trang vắng mặt = tắt, không khung chat.
-- =============================================================================


-- =============================================================================
-- 1 · CÔNG TẮC
-- =============================================================================
insert into khoa_cong_bo (khoa, kieu, nhom, mo_ta, bat_buoc, chi_chu_so_huu, thu_tu) values
  ('hien_tro_ly_trang', 'bool', 'mua_thit',
   'Mở khung chat Trang ở trang Mua thịt về (chỉ trang tiếng Việt): khách nhắn tự do, Trang — trợ lý ảo (AI) của Beeftown — hỏi gu, gợi ý phần thịt, số gói theo số người và cho vào đơn; khách vẫn tự điền địa chỉ và bấm Đặt hàng. Khung chat chỉ hiện khi công tắc này bật VÀ trang Mua thịt về đang mở. Mỗi tin khách tốn tiền Claude (khoảng 87.000 đ một tháng ở mức 50 cuộc chat mỗi ngày) — trước khi bật: đã đặt khóa ANTHROPIC_API_KEY cho hàm tro-ly-trang trên Supabase, bảng chấm 50 câu đạt từ 45 câu, và trang Quyền riêng tư đã nói về nhật ký chat. Câu Trang chưa biết nằm ở Nội bộ → Trợ lý Trang.',
   false, true, 405);


-- =============================================================================
-- 2 · SỔ HỌC
-- =============================================================================
-- trang_thai: cho_tra_loi (Trang gặp câu chưa biết, chưa ai trả lời) → cho_duyet (đã có câu trả lời nháp, ví dụ Claude
-- tra cứu kèm nguồn) → da_duyet (chủ / quản lý đã duyệt: Trang dùng như dữ liệu từ tin nhắn kế tiếp).
-- khoa_hoi: câu hỏi viết thường, bỏ dấu câu, gộp khoảng trắng — để cùng một câu khách hỏi lần hai chỉ cộng so_lan_hoi.
create table tro_ly_so_hoc (
  id            uuid primary key default gen_random_uuid(),
  hoi           text not null,
  dap           text,
  trang_thai    text not null default 'cho_tra_loi',
  nguon         text,
  so_lan_hoi    integer not null default 1,
  hoi_lan_cuoi  timestamptz not null default now(),
  duyet_boi     uuid references nhan_su (id) on delete set null,
  duyet_luc     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  khoa_hoi      text generated always as (
                  regexp_replace(regexp_replace(lower(btrim(hoi)), '[[:punct:]]+', '', 'g'), '\s+', ' ', 'g')) stored,
  constraint tro_ly_so_hoc_trang_thai_hop_le check (trang_thai in ('cho_tra_loi', 'cho_duyet', 'da_duyet')),
  constraint tro_ly_so_hoc_hoi_hop_le check (hoi = btrim(hoi) and char_length(hoi) between 1 and 300),
  constraint tro_ly_so_hoc_dap_hop_le check (dap is null or (dap = btrim(dap) and char_length(dap) between 1 and 1000)),
  constraint tro_ly_so_hoc_nguon_hop_le check (nguon is null or char_length(nguon) <= 300),
  constraint tro_ly_so_hoc_duyet_co_dap check (trang_thai <> 'da_duyet' or dap is not null),
  constraint tro_ly_so_hoc_hoi_duy_nhat unique (khoa_hoi)
);

comment on table tro_ly_so_hoc is
  'Sổ học của Trang (0126): câu Trang chưa biết và câu trả lời đã duyệt. Chủ, quản lý, marketing xem ở /noi-bo/tro-ly; chủ, quản lý viết, duyệt, bỏ. Chỉ dòng da_duyet vào lời dặn của Trang (tro_ly_mo_luot).';
comment on column tro_ly_so_hoc.hoi is
  'Câu hỏi chung chung, không tên, số điện thoại, địa chỉ của khách. Trang tự ghi (tro_ly_ghi_luot) hoặc người duyệt thêm tay.';
comment on column tro_ly_so_hoc.so_lan_hoi is
  'Số lần Trang gặp câu này (cùng khoa_hoi thì cộng thêm). Câu hỏi nhiều thì trả lời trước.';
comment on column tro_ly_so_hoc.duyet_boi is
  'Người duyệt lần cuối — tự điền từ phiên đăng nhập khi dòng chuyển sang (hoặc sửa câu trả lời ở) da_duyet.';

create index tro_ly_so_hoc_trang_thai_idx on tro_ly_so_hoc (trang_thai, hoi_lan_cuoi desc);

create trigger tro_ly_so_hoc_updated_at
  before update on tro_ly_so_hoc
  for each row execute function tu_dong_cap_nhat_updated_at();

-- Người duyệt và giờ duyệt do database điền: vào da_duyet (hoặc sửa câu trả lời khi đang da_duyet) thì ghi người đang
-- đăng nhập; rời da_duyet thì xóa. Người dùng không ghi được hai ô này (quyền cột bên dưới).
create or replace function tro_ly_so_hoc_ghi_duyet()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.trang_thai = 'da_duyet' then
    if tg_op = 'INSERT' or old.trang_thai is distinct from 'da_duyet' or old.dap is distinct from new.dap then
      new.duyet_luc := now();
      new.duyet_boi := (nhan_su_hien_tai()).id;
    end if;
  else
    new.duyet_luc := null;
    new.duyet_boi := null;
  end if;
  return new;
end;
$$;

create trigger tro_ly_so_hoc_ghi_duyet
  before insert or update on tro_ly_so_hoc
  for each row execute function tro_ly_so_hoc_ghi_duyet();

alter table tro_ly_so_hoc enable row level security;

create policy tro_ly_so_hoc_doc on tro_ly_so_hoc
  for select using ((select co_vai_tro(array['chu_so_huu', 'quan_ly', 'marketing']::vai_tro[])));
create policy tro_ly_so_hoc_them on tro_ly_so_hoc
  for insert with check ((select co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[])));
create policy tro_ly_so_hoc_sua on tro_ly_so_hoc
  for update using ((select co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[])))
  with check ((select co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[])));
create policy tro_ly_so_hoc_xoa on tro_ly_so_hoc
  for delete using ((select co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[])));

-- Năm câu Khánh đã duyệt và một câu chờ trả lời — chép từ sổ học của bản thử (artifact AmfGipVG8AJLp2Ke7nAdfw, đọc
-- ngày 18/11/2026). Câu trả lời giữ đúng từng chữ đã duyệt.
insert into tro_ly_so_hoc (hoi, dap, trang_thai, nguon) values
  ('Quán giao hàng thế nào, bao lâu thì tới?',
   'Dạ quán giao theo khung giờ anh/chị muốn nhận, đặt giao qua Ahamove ạ. Anh/chị ghi giờ muốn nhận ở phần ghi chú khi đặt; sau khi anh/chị trả tiền, quán gọi lại để hẹn giờ giao.',
   'da_duyet', 'Khánh trả lời ngày 18/11/2026: giao theo khung giờ khách yêu cầu, đặt giao qua Ahamove.'),
  ('Quán có xuất hóa đơn đỏ không?',
   'Dạ quán có xuất hóa đơn đỏ ạ. Anh/chị cần thì nhập thông tin xuất hóa đơn vào mẫu của quán là được.',
   'da_duyet', 'Khánh trả lời ngày 18/11/2026: có xuất hóa đơn đỏ, khách nhập thông tin vào mẫu (ô "Cần xuất hóa đơn đỏ" của trang Mua thịt về, 0125).'),
  ('Thịt mát để tủ lạnh được bao lâu?',
   'Anh/chị xem hạn dùng in trên nhãn từng khay ạ. Thịt mát để ngăn mát, khay sườn bò ướp cấp đông thì để ngăn đá.',
   'da_duyet', 'Claude đề xuất ngày 18/11/2026 từ máy cân in tem (in hạn dùng theo lô) và cách bảo quản trong database. Khánh duyệt ngày 18/11/2026; Sang nên xác nhận nhãn khay bán lẻ có in hạn dùng.'),
  ('Tái chín, chín vừa, chín tới khác nhau thế nào?',
   'Tái chín là giữa miếng còn hồng đỏ. Chín vừa là giữa chuyển hồng nhạt. Chín tới là giữa chỉ còn ánh hồng, ít nước hơn. Chín hẳn là chín đều, không còn hồng.',
   'da_duyet', 'Claude tra ngày 18/11/2026: Điện Máy Xanh, FPT Shop, Mytour (bài về độ chín của bít tết). Khánh duyệt ngày 18/11/2026.'),
  ('Sườn bò cắt ngang ướp sẵn là phần gì?',
   'Là sườn bò cắt lát mỏng ngang qua xương, nên mỗi lát có vài mẩu xương nhỏ, rồi ướp sẵn và cấp đông.',
   'da_duyet', 'Claude tra ngày 18/11/2026: Maangchi, I Heart Umami (cách cắt ngang xương); mô tả khay LA Galbi trong database. Khánh duyệt ngày 18/11/2026.'),
  ('Quán mở cửa mấy giờ?', null,
   'cho_tra_loi', 'Database website đang ghi 11:00–14:00 và 16:00–23:00 (kiểm ngày 04/10/2026), chưa chốt.');


-- =============================================================================
-- 3 · NHẬT KÝ CHAT
-- =============================================================================
-- Một dòng mỗi tin khách. trang_thai: dang (Edge Function đang hỏi Claude) → tra_loi | loi. tra_loi là đúng thứ khách
-- thấy: {tin: [...], the: [...], don: [...], chot, chuyen_nguoi, cau_chua_biet}. tin_khach đã che (xem đầu file).
create table tro_ly_luot (
  id             bigint generated always as identity primary key,
  cuoc_id        uuid not null,
  ma_tin         uuid not null,
  luot           integer not null,
  tin_khach      text not null,
  trang_thai     text not null default 'dang',
  tra_loi        jsonb,
  viet_lai       boolean not null default false,
  thay_tu        boolean not null default false,
  bo_tin         smallint not null default 0,
  loi            text,
  token_vao      integer,
  token_ra       integer,
  token_doc_dem  integer,
  token_ghi_dem  integer,
  mili_giay      integer,
  created_at     timestamptz not null default now(),
  xong_luc       timestamptz,
  constraint tro_ly_luot_trang_thai_hop_le check (trang_thai in ('dang', 'tra_loi', 'loi')),
  constraint tro_ly_luot_luot_hop_le check (luot between 1 and 100),
  constraint tro_ly_luot_tin_hop_le check (char_length(tin_khach) between 1 and 600),
  constraint tro_ly_luot_loi_hop_le check (loi is null or char_length(loi) <= 200),
  constraint tro_ly_luot_tin_duy_nhat unique (cuoc_id, ma_tin),
  constraint tro_ly_luot_thu_tu_duy_nhat unique (cuoc_id, luot)
);

comment on table tro_ly_luot is
  'Nhật ký chat của Trang (0126): một dòng mỗi tin khách, chữ khách đã che số điện thoại, email, địa chỉ; không IP. Chỉ Edge Function tro-ly-trang ghi (tro_ly_mo_luot, tro_ly_ghi_luot); chủ, quản lý đọc để duyệt chat. Tự dọn sau 180 ngày.';
comment on column tro_ly_luot.viet_lai is
  'Tin đầu của Claude còn chữ không phải tiếng Việt hay chữ cấm — đã bắt viết lại một lần.';
comment on column tro_ly_luot.bo_tin is
  'Số tin bị bỏ vì viết lại rồi vẫn còn chữ cấm hay chữ nước ngoài.';

create index tro_ly_luot_created_at_idx on tro_ly_luot (created_at);

alter table tro_ly_luot enable row level security;
create policy tro_ly_luot_doc on tro_ly_luot
  for select using ((select co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[])));


-- =============================================================================
-- 3b · CUỘC CHAT, TIN NHẮN, NHÂN VIÊN ĐANG TRỰC
-- =============================================================================
-- Một dòng mỗi cuộc chat (id = mã cuộc trình duyệt tạo). ai_tra_loi: trang | nhan_vien — nhân viên nào đang nhận ở
-- nhan_vien_id. can_nguoi: vì sao cuộc này cần người, lấy lý do nặng nhất — gap_nguoi (khách đòi gặp người) >
-- chuyen_nguoi (Trang mời liên hệ quán) > chot_don (khách vừa chốt đơn); trả lại cho Trang thì xóa.
-- nhan_vien_go_luc: nhân viên đang gõ (khách thấy bong bóng đang soạn khi còn trong 6 giây). khach_xem_luc: lần cuối
-- khung chat của khách hỏi lại (tro_ly_xem) — biết khách còn mở khung hay đã đi.
create table tro_ly_cuoc (
  id                uuid primary key,
  chi_nhanh_id      uuid references chi_nhanh (id) on delete set null,
  ai_tra_loi        text not null default 'trang',
  nhan_vien_id      uuid references nhan_su (id) on delete set null,
  nhan_luc          timestamptz,
  can_nguoi         text,
  can_nguoi_luc     timestamptz,
  nhan_vien_go_luc  timestamptz,
  khach_xem_luc     timestamptz,
  so_tin_khach      integer not null default 0,
  tin_cuoi_luc      timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  constraint tro_ly_cuoc_ai_hop_le check (ai_tra_loi in ('trang', 'nhan_vien')),
  constraint tro_ly_cuoc_trang_khong_nhan_vien check (ai_tra_loi = 'nhan_vien' or nhan_vien_id is null),
  constraint tro_ly_cuoc_can_nguoi_hop_le check (can_nguoi is null or can_nguoi in ('gap_nguoi', 'chuyen_nguoi', 'chot_don'))
);

comment on table tro_ly_cuoc is
  'Cuộc chat của khung Trang (0126): ai đang trả lời (Trang hay nhân viên nào), vì sao cần người, khách còn mở khung không. Chỉ hàm của Edge Function và hàm nhân viên (mục 4b) đọc / ghi. Tự dọn sau 180 ngày không tin mới.';

create index tro_ly_cuoc_tin_cuoi_idx on tro_ly_cuoc (tin_cuoi_luc desc);

-- Đúng thứ khách thấy, theo thứ tự id. nguoi: khach (chữ ĐÃ CHE như nhật ký) · trang (mỗi tin một dòng; dòng cuối của
-- lượt kèm du_lieu {the, don, chot, chuyen_nguoi}) · nhan_vien (ten_hien = tên gọi lúc gửi) · he_thong (noi_dung là mã:
-- nhan_vien_vao | trang_quay_lai — trang dịch ra chữ). ma_tin: mã tin trình duyệt / màn nhân viên tạo — gửi hai lần một dòng.
-- Tin nhân viên được che số (tro_ly_che_so) sau một ngày: khách đã nhận đúng chữ, nhật ký lâu dài thì không còn số.
create table tro_ly_tin (
  id            bigint generated always as identity primary key,
  cuoc_id       uuid not null references tro_ly_cuoc (id) on delete cascade,
  nguoi         text not null,
  noi_dung      text not null,
  du_lieu       jsonb,
  nhan_vien_id  uuid references nhan_su (id) on delete set null,
  ten_hien      text,
  ma_tin        uuid,
  da_che        boolean not null default false,
  created_at    timestamptz not null default now(),
  constraint tro_ly_tin_nguoi_hop_le check (nguoi in ('khach', 'trang', 'nhan_vien', 'he_thong')),
  constraint tro_ly_tin_noi_dung_hop_le check (char_length(noi_dung) between 1 and 1000),
  constraint tro_ly_tin_he_thong_hop_le check (nguoi <> 'he_thong' or noi_dung in ('nhan_vien_vao', 'trang_quay_lai')),
  constraint tro_ly_tin_ten_hop_le check (ten_hien is null or char_length(ten_hien) <= 60)
);

comment on table tro_ly_tin is
  'Tin nhắn của khung Trang (0126), đúng thứ tự khách thấy: khách (đã che số điện thoại, email, địa chỉ), Trang, nhân viên, câu hệ thống. Chỉ hàm definer đọc / ghi. Tin nhân viên che số sau một ngày; xóa cùng cuộc chat sau 180 ngày.';

create unique index tro_ly_tin_ma_tin_idx on tro_ly_tin (cuoc_id, ma_tin) where ma_tin is not null;
create index tro_ly_tin_cuoc_idx on tro_ly_tin (cuoc_id, id);

-- Nhân viên đang mở màn theo dõi: màn đó gọi tro_ly_dang_truc() mỗi 20–30 giây. Có dòng trong 60 giây = đang trực.
-- chi_nhanh_id null = chủ (trực mọi chi nhánh).
create table tro_ly_truc (
  nhan_su_id    uuid primary key references nhan_su (id) on delete cascade,
  chi_nhanh_id  uuid references chi_nhanh (id) on delete cascade,
  luc           timestamptz not null default now()
);

comment on table tro_ly_truc is
  'Nhân viên đang mở màn theo dõi chat của Trang (0126) — lần gọi tro_ly_dang_truc() gần nhất. Trong 60 giây thì khung chat được nói "có nhân viên theo dõi".';

alter table tro_ly_cuoc enable row level security;
alter table tro_ly_tin enable row level security;
alter table tro_ly_truc enable row level security;


-- =============================================================================
-- 4 · HAI HÀM CỦA EDGE FUNCTION
-- =============================================================================
-- Che lần hai (Edge Function đã che kỹ hơn, kể cả địa chỉ): số điện thoại Việt Nam, dãy từ 9 chữ số, email.
create or replace function tro_ly_che_so(p_chu text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(
           regexp_replace(
             regexp_replace(coalesce(p_chu, ''), '(\+?84|\m0)([ .-]?[0-9]){8,10}', '[số điện thoại]', 'g'),
             '[0-9]{9,}', '[số]', 'g'),
           '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[email]', 'g')
$$;

comment on function tro_ly_che_so(text) is
  'Che số điện thoại Việt Nam, dãy từ 9 chữ số, email trong chữ khách (0126) — lớp che thứ hai của nhật ký Trang.';

-- Tên khách thấy khi nhân viên vào chat: tên gọi (chữ cuối của họ tên) — "Nguyễn Văn Minh" → "Minh".
create or replace function tro_ly_ten_goi(p_ho_ten text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(left(regexp_replace(btrim(coalesce(p_ho_ten, '')), '^.*\s', ''), 60), '')
$$;

-- Có nhân viên đang mở màn theo dõi cho chi nhánh này (chủ trực mọi chi nhánh) trong 60 giây qua.
create or replace function tro_ly_co_truc(p_chi_nhanh_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from tro_ly_truc t
                 join nhan_su ns on ns.id = t.nhan_su_id and ns.dang_lam
                 where t.luc > now() - interval '60 seconds'
                   and (t.chi_nhanh_id is null or t.chi_nhanh_id = p_chi_nhanh_id))
$$;

-- Nhân viên đã nhận mà rời màn theo dõi (không gọi tro_ly_dang_truc() hơn 2 phút, và nhận đã hơn 2 phút): tự trả cuộc
-- lại cho Trang — khách không bao giờ nhắn vào khoảng không. Trả true khi vừa trả lại.
create or replace function tro_ly_tu_tra_lai(p_cuoc uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  update tro_ly_cuoc c
     set ai_tra_loi = 'trang', nhan_vien_id = null, nhan_luc = null, nhan_vien_go_luc = null
   where c.id = p_cuoc and c.ai_tra_loi = 'nhan_vien'
     and coalesce(c.nhan_luc, '-infinity'::timestamptz) < now() - interval '2 minutes'
     and not exists (select 1 from tro_ly_truc t
                     where t.nhan_su_id = c.nhan_vien_id and t.luc > now() - interval '2 minutes');
  if not found then
    return false;
  end if;
  insert into tro_ly_tin (cuoc_id, nguoi, noi_dung) values (p_cuoc, 'he_thong', 'trang_quay_lai');
  return true;
end;
$$;

-- Lý do cần người nặng hơn thì thay lý do cũ (gap_nguoi > chuyen_nguoi > chot_don).
create or replace function tro_ly_hang_can_nguoi(p_ly_do text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case p_ly_do when 'gap_nguoi' then 3 when 'chuyen_nguoi' then 2 when 'chot_don' then 1 else 0 end
$$;

-- Mở một lượt: kiểm công tắc, giới hạn, giữ chỗ dòng nhật ký, ghi tin khách vào cuộc chat, trả dữ liệu Trang đọc ở lượt
-- này. Trả {duoc: true, luot, lich_su, menu, so_hoc, xen} hoặc {duoc: false, ly_do} — ly_do: sai (tham số) · tat (công
-- tắc tắt) · chua_mo (trang Mua thịt về không mở / menu rỗng) · qua_luot_cuoc · qua_luot_ip · qua_luot_ngay ·
-- dang_tra_loi (cùng ma_tin đang được trả lời) · da_tra_loi (cùng ma_tin đã trả lời — kèm tra_loi cũ) · nhan_vien
-- (nhân viên đang nhận cuộc này: tin khách đã ghi cho nhân viên, KHÔNG gọi Claude — kèm ten).
-- xen: khi nhân viên vừa trả cuộc lại cho Trang — các tin khách và nhân viên đã nhắn với nhau từ lượt Trang trước, để
-- Trang nối tiếp (rỗng khi không có tin nhân viên nào ở giữa).
create or replace function tro_ly_mo_luot(
  p_cuoc         uuid,
  p_ma_tin       uuid,
  p_tin          text,
  p_ip           inet default null,
  p_chi_nhanh_ma text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_dong  tro_ly_luot;
  v_luot  integer;
  v_menu  jsonb;
  v_cuoc  tro_ly_cuoc;
  v_tin   text;
  v_moi   integer;
  v_moc   bigint;
  v_xen   jsonb := '[]'::jsonb;
begin
  if p_cuoc is null or p_ma_tin is null or p_tin is null or btrim(p_tin) = '' or char_length(p_tin) > 600 then
    return jsonb_build_object('duoc', false, 'ly_do', 'sai');
  end if;
  v_tin := tro_ly_che_so(btrim(p_tin));

  -- Một cuộc chat một hàng đợi: hai tin cùng lúc không lấy trùng số lượt.
  perform pg_advisory_xact_lock(hashtext('tro_ly_trang:' || p_cuoc::text));

  select * into v_dong from tro_ly_luot where cuoc_id = p_cuoc and ma_tin = p_ma_tin;
  if found then
    if v_dong.trang_thai = 'tra_loi' then
      -- Kèm menu hiện tại: Edge Function dựng lại thẻ mà không phải gọi database lần nữa.
      return jsonb_build_object('duoc', false, 'ly_do', 'da_tra_loi', 'tra_loi', v_dong.tra_loi,
        'menu', (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) from mua_thit_ve_cong_khai('vi', p_chi_nhanh_ma) m));
    end if;
    if v_dong.trang_thai = 'dang' and v_dong.created_at > now() - interval '90 seconds' then
      return jsonb_build_object('duoc', false, 'ly_do', 'dang_tra_loi');
    end if;
    -- Lượt lỗi, hay treo quá 90 giây (Edge Function chết giữa chừng): cho thử lại trên chính dòng đó.
  end if;

  if not cong_tac_bat('hien_tro_ly_trang') then
    return jsonb_build_object('duoc', false, 'ly_do', 'tat');
  end if;

  -- Nhân viên đang nhận cuộc này: ghi tin cho nhân viên đọc, không lượt Trang, không tốn lượt Claude của cuộc / ngày.
  -- Nhân viên đã rời màn theo dõi thì cuộc tự về Trang trước (tro_ly_tu_tra_lai).
  perform tro_ly_tu_tra_lai(p_cuoc);
  select * into v_cuoc from tro_ly_cuoc where id = p_cuoc for update;
  if found and v_cuoc.ai_tra_loi = 'nhan_vien' then
    if not exists (select 1 from tro_ly_tin t where t.cuoc_id = p_cuoc and t.ma_tin = p_ma_tin) then
      if v_cuoc.so_tin_khach >= 300 then
        return jsonb_build_object('duoc', false, 'ly_do', 'qua_luot_cuoc');
      end if;
      if p_ip is not null and not gioi_han_lay_luot('tro_ly_trang', 'ip:' || host(p_ip), 40, interval '1 hour') then
        return jsonb_build_object('duoc', false, 'ly_do', 'qua_luot_ip');
      end if;
      insert into tro_ly_tin (cuoc_id, nguoi, noi_dung, ma_tin) values (p_cuoc, 'khach', v_tin, p_ma_tin);
      update tro_ly_cuoc set so_tin_khach = so_tin_khach + 1, tin_cuoi_luc = now() where id = p_cuoc;
    end if;
    return jsonb_build_object('duoc', false, 'ly_do', 'nhan_vien',
      'ten', (select tro_ly_ten_goi(ns.ho_ten) from nhan_su ns where ns.id = v_cuoc.nhan_vien_id));
  end if;

  select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) into v_menu
  from mua_thit_ve_cong_khai('vi', p_chi_nhanh_ma) m;
  if jsonb_array_length(v_menu) = 0 then
    return jsonb_build_object('duoc', false, 'ly_do', 'chua_mo');
  end if;

  if v_dong.id is null then
    select count(*) into v_luot from tro_ly_luot where cuoc_id = p_cuoc;
    if v_luot >= 30 then
      return jsonb_build_object('duoc', false, 'ly_do', 'qua_luot_cuoc');
    end if;
  end if;

  if p_ip is not null and not gioi_han_lay_luot('tro_ly_trang', 'ip:' || host(p_ip), 40, interval '1 hour') then
    return jsonb_build_object('duoc', false, 'ly_do', 'qua_luot_ip');
  end if;
  if not gioi_han_lay_luot('tro_ly_trang', 'ca_quan', 2000, interval '1 day') then
    return jsonb_build_object('duoc', false, 'ly_do', 'qua_luot_ngay');
  end if;

  if v_dong.id is null then
    insert into tro_ly_luot (cuoc_id, ma_tin, luot, tin_khach)
    values (p_cuoc, p_ma_tin, v_luot + 1, v_tin)
    returning * into v_dong;
  else
    update tro_ly_luot
       set trang_thai = 'dang', tin_khach = v_tin, tra_loi = null, loi = null,
           created_at = now(), xong_luc = null
     where id = v_dong.id
    returning * into v_dong;
  end if;

  -- Cuộc chat và tin khách (nhân viên theo dõi thấy ngay, trước khi Trang trả lời). Gửi lại cùng ma_tin: không thêm.
  insert into tro_ly_cuoc (id, chi_nhanh_id)
  values (p_cuoc, (select c.id from chi_nhanh c where lower(c.ma) = lower(p_chi_nhanh_ma) and c.dang_hoat_dong))
  on conflict (id) do nothing;
  insert into tro_ly_tin (cuoc_id, nguoi, noi_dung, ma_tin) values (p_cuoc, 'khach', v_tin, p_ma_tin)
  on conflict (cuoc_id, ma_tin) where ma_tin is not null do nothing;
  get diagnostics v_moi = row_count;
  update tro_ly_cuoc set so_tin_khach = so_tin_khach + v_moi, tin_cuoi_luc = now() where id = p_cuoc;

  -- Nhân viên vừa trả cuộc lại: các tin khách / nhân viên từ tin Trang cuối, nếu ở giữa có tin nhân viên (tối đa 12).
  select max(t.id) into v_moc from tro_ly_tin t where t.cuoc_id = p_cuoc and t.nguoi = 'trang';
  if exists (select 1 from tro_ly_tin t where t.cuoc_id = p_cuoc and t.nguoi = 'nhan_vien' and t.id > coalesce(v_moc, 0)) then
    select coalesce(jsonb_agg(jsonb_build_object('nguoi', x.nguoi, 'noi_dung', x.noi_dung, 'ten', x.ten_hien) order by x.id), '[]'::jsonb)
      into v_xen
    from (select t.id, t.nguoi, t.noi_dung, t.ten_hien from tro_ly_tin t
          where t.cuoc_id = p_cuoc and t.id > coalesce(v_moc, 0) and t.nguoi in ('khach', 'nhan_vien')
            and t.ma_tin is distinct from p_ma_tin
          order by t.id desc limit 12) x;
  end if;

  return jsonb_build_object(
    'xen', v_xen,
    'duoc', true,
    'luot', v_dong.luot,
    -- Tám lượt gần nhất đã trả lời của cuộc này (cũ trước): lịch sử Trang đọc lấy ở database, không lấy từ trình duyệt.
    'lich_su', (
      select coalesce(jsonb_agg(jsonb_build_object('khach', l.tin_khach, 'tra_loi', l.tra_loi) order by l.luot), '[]'::jsonb)
      from (select t.luot, t.tin_khach, t.tra_loi from tro_ly_luot t
            where t.cuoc_id = p_cuoc and t.trang_thai = 'tra_loi' and t.luot < v_dong.luot
            order by t.luot desc limit 8) l),
    'menu', v_menu,
    'so_hoc', (
      select coalesce(jsonb_agg(jsonb_build_object('hoi', s.hoi, 'dap', s.dap) order by s.duyet_luc, s.id), '[]'::jsonb)
      from (select h.id, h.hoi, h.dap, h.duyet_luc from tro_ly_so_hoc h
            where h.trang_thai = 'da_duyet' order by h.duyet_luc, h.id limit 60) s));
end;
$$;

comment on function tro_ly_mo_luot(uuid, uuid, text, inet, text) is
  'Edge Function tro-ly-trang (0126, chỉ service_role): mở một lượt chat của Trang — công tắc hien_tro_ly_trang, trang Mua thịt về mở, 30 lượt mỗi cuộc, 40 lượt mỗi giờ mỗi IP, 2.000 lượt mỗi ngày; cùng ma_tin không trả lời hai lần; ghi tin khách vào tro_ly_tin. Nhân viên đang nhận cuộc thì chỉ ghi tin, trả ly_do nhan_vien (không gọi Claude). Trả lịch sử của cuộc, menu công khai (giá đã chốt), sổ học đã duyệt, tin nhân viên vừa nhắn (xen).';

-- Đóng một lượt: ghi thứ khách đã thấy (hoặc lỗi), từng tin Trang vào cuộc chat, lý do cần người, câu chưa biết vào sổ
-- học, dọn nhật ký cũ. p_ket_qua: {tra_loi: {...} | null, loi: text | null, doi_nguoi (khách đòi gặp người — Edge
-- Function nhận ra từ chữ khách), viet_lai, thay_tu, bo_tin, token_vao, token_ra, token_doc_dem, token_ghi_dem,
-- mili_giay}. Trả false khi không có lượt đang mở khớp (đã ghi rồi, hay chưa từng mở).
create or replace function tro_ly_ghi_luot(p_cuoc uuid, p_ma_tin uuid, p_ket_qua jsonb)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_loi  text := nullif(btrim(coalesce(p_ket_qua ->> 'loi', '')), '');
  v_cau  text;
  v_so   jsonb := coalesce(p_ket_qua, '{}'::jsonb);
  v_tl   jsonb;
  v_n    integer;
  v_ly   text;
begin
  update tro_ly_luot
     set trang_thai    = case when v_loi is null and jsonb_typeof(v_so -> 'tra_loi') = 'object' then 'tra_loi' else 'loi' end,
         tra_loi       = case when jsonb_typeof(v_so -> 'tra_loi') = 'object' then v_so -> 'tra_loi' end,
         loi           = case when v_loi is not null then left(v_loi, 200)
                              when jsonb_typeof(v_so -> 'tra_loi') <> 'object' or v_so -> 'tra_loi' is null then 'khong_co_tra_loi' end,
         viet_lai      = coalesce((v_so ->> 'viet_lai')::boolean, false),
         thay_tu       = coalesce((v_so ->> 'thay_tu')::boolean, false),
         bo_tin        = least(greatest(coalesce((v_so ->> 'bo_tin')::smallint, 0), 0), 10),
         token_vao     = (v_so ->> 'token_vao')::integer,
         token_ra      = (v_so ->> 'token_ra')::integer,
         token_doc_dem = (v_so ->> 'token_doc_dem')::integer,
         token_ghi_dem = (v_so ->> 'token_ghi_dem')::integer,
         mili_giay     = (v_so ->> 'mili_giay')::integer,
         xong_luc      = now()
   where cuoc_id = p_cuoc and ma_tin = p_ma_tin and trang_thai = 'dang';
  if not found then
    return false;
  end if;

  -- Từng tin Trang vào cuộc chat (tin cuối kèm thẻ, đơn); lý do cần người nặng nhất của cuộc.
  v_tl := case when v_loi is null and jsonb_typeof(v_so -> 'tra_loi') = 'object' then v_so -> 'tra_loi' end;
  if v_tl is not null and exists (select 1 from tro_ly_cuoc where id = p_cuoc) then
    v_n := case when jsonb_typeof(v_tl -> 'tin') = 'array' then jsonb_array_length(v_tl -> 'tin') else 0 end;
    insert into tro_ly_tin (cuoc_id, nguoi, noi_dung, du_lieu)
    select p_cuoc, 'trang', left(btrim(x.chu), 1000),
           case when x.thu_tu = v_n then jsonb_build_object(
             'the', coalesce(v_tl -> 'the', '[]'::jsonb), 'don', coalesce(v_tl -> 'don', '[]'::jsonb),
             'chot', coalesce((v_tl ->> 'chot')::boolean, false),
             'chuyen_nguoi', coalesce((v_tl ->> 'chuyen_nguoi')::boolean, false)) end
    from jsonb_array_elements_text(case when v_n > 0 then v_tl -> 'tin' else '[]'::jsonb end) with ordinality as x(chu, thu_tu)
    where btrim(x.chu) <> ''
    order by x.thu_tu;

    v_ly := case when coalesce((v_so ->> 'doi_nguoi')::boolean, false) then 'gap_nguoi'
                 when coalesce((v_tl ->> 'chuyen_nguoi')::boolean, false) then 'chuyen_nguoi'
                 when coalesce((v_tl ->> 'chot')::boolean, false) then 'chot_don' end;
    update tro_ly_cuoc
       set tin_cuoi_luc  = now(),
           can_nguoi     = case when tro_ly_hang_can_nguoi(v_ly) > tro_ly_hang_can_nguoi(can_nguoi) then v_ly else can_nguoi end,
           can_nguoi_luc = case when tro_ly_hang_can_nguoi(v_ly) > tro_ly_hang_can_nguoi(can_nguoi) then now() else can_nguoi_luc end
     where id = p_cuoc;
  end if;

  -- Câu Trang chưa biết → sổ học "Chờ trả lời"; câu đã có (cùng khoa_hoi) thì cộng số lần hỏi.
  v_cau := btrim(tro_ly_che_so(left(coalesce(v_so -> 'tra_loi' ->> 'cau_chua_biet', ''), 300)));
  if v_loi is null and v_cau <> '' then
    insert into tro_ly_so_hoc (hoi, trang_thai, nguon)
    values (v_cau, 'cho_tra_loi', 'Khách hỏi Trang ngày ' || to_char(hom_nay_vn(), 'DD/MM/YYYY'))
    on conflict (khoa_hoi) do update
      set so_lan_hoi = tro_ly_so_hoc.so_lan_hoi + 1, hoi_lan_cuoi = now();
  end if;

  -- Dọn dần, mỗi lượt một ít (như gioi_han_lay_luot của 0084): nhật ký quá 180 ngày; cuộc chat quá 180 ngày không tin
  -- mới (tin của nó xóa theo); tin nhân viên quá một ngày thì che số.
  delete from tro_ly_luot
  where id in (select l.id from tro_ly_luot l
               where l.created_at < now() - interval '180 days'
               order by l.created_at
               limit 50
               for update skip locked);
  delete from tro_ly_cuoc
  where id in (select c.id from tro_ly_cuoc c
               where c.tin_cuoi_luc < now() - interval '180 days'
               order by c.tin_cuoi_luc
               limit 20
               for update skip locked);
  update tro_ly_tin
     set noi_dung = tro_ly_che_so(noi_dung), da_che = true
   where id in (select t.id from tro_ly_tin t
                where t.nguoi = 'nhan_vien' and not t.da_che and t.created_at < now() - interval '1 day'
                order by t.id
                limit 50
                for update skip locked);
  return true;
end;
$$;

comment on function tro_ly_ghi_luot(uuid, uuid, jsonb) is
  'Edge Function tro-ly-trang (0126, chỉ service_role): đóng lượt đang mở — ghi thứ khách thấy hoặc lỗi, từng tin Trang vào tro_ly_tin, lý do cần người của cuộc, câu chưa biết vào sổ học (cộng số lần hỏi nếu đã có); dọn nhật ký và cuộc chat quá 180 ngày, che số trong tin nhân viên quá một ngày.';

-- Khung chat của khách hỏi lại (vài giây một lần khi đang mở): ai đang trả lời, nhân viên có đang gõ, có nhân viên trực
-- không, và các tin nhân viên / câu hệ thống mới hơn p_sau. Tin khách và tin Trang khung đã có (lượt gửi trả về) —
-- không trả lại. Trả {tat: true} khi công tắc tắt. Ghi khach_xem_luc tối đa mười giây một lần.
create or replace function tro_ly_xem(p_cuoc uuid, p_sau bigint default 0, p_chi_nhanh_ma text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_cuoc tro_ly_cuoc;
begin
  if p_cuoc is null then
    return jsonb_build_object('sai', true);
  end if;
  if not cong_tac_bat('hien_tro_ly_trang') then
    return jsonb_build_object('tat', true);
  end if;
  perform tro_ly_tu_tra_lai(p_cuoc);
  select * into v_cuoc from tro_ly_cuoc where id = p_cuoc;
  if not found then
    -- Chưa gửi tin nào: chỉ cần biết có nhân viên trực không (dòng dưới tên Trang, phần giải thích).
    return jsonb_build_object('ai_tra_loi', 'trang', 'dang_go', false, 'tin', '[]'::jsonb,
      'truc', tro_ly_co_truc((select c.id from chi_nhanh c where lower(c.ma) = lower(p_chi_nhanh_ma) and c.dang_hoat_dong)));
  end if;
  if v_cuoc.khach_xem_luc is null or v_cuoc.khach_xem_luc < now() - interval '10 seconds' then
    update tro_ly_cuoc set khach_xem_luc = now() where id = p_cuoc;
  end if;
  return jsonb_build_object(
    'ai_tra_loi', v_cuoc.ai_tra_loi,
    'ten', case when v_cuoc.ai_tra_loi = 'nhan_vien'
                then (select tro_ly_ten_goi(ns.ho_ten) from nhan_su ns where ns.id = v_cuoc.nhan_vien_id) end,
    'dang_go', v_cuoc.ai_tra_loi = 'nhan_vien' and coalesce(v_cuoc.nhan_vien_go_luc > now() - interval '6 seconds', false),
    'truc', tro_ly_co_truc(v_cuoc.chi_nhanh_id),
    'tin', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'nguoi', t.nguoi, 'noi_dung', t.noi_dung, 'ten', t.ten_hien)
                                      order by t.id), '[]'::jsonb)
            from (select x.id, x.nguoi, x.noi_dung, x.ten_hien from tro_ly_tin x
                  where x.cuoc_id = p_cuoc and x.id > coalesce(p_sau, 0) and x.nguoi in ('nhan_vien', 'he_thong')
                  order by x.id
                  limit 50) t));
end;
$$;

comment on function tro_ly_xem(uuid, bigint, text) is
  'Edge Function tro-ly-trang (0126, chỉ service_role): khung chat của khách hỏi lại — ai đang trả lời (Trang / nhân viên, tên gọi), nhân viên đang gõ, có nhân viên trực, tin nhân viên và câu hệ thống mới hơn p_sau (tối đa 50).';


-- =============================================================================
-- 4b · NHÂN VIÊN NHẬN TƯ VẤN (màn /noi-bo làm ở PR sau — các hàm sẵn sàng từ đây)
-- =============================================================================
-- Quyền như hộp thư đơn mua thịt (0113): chủ, quản lý, thu ngân đang làm; cuộc chat của chi nhánh mình (crm_cn_duoc —
-- chủ thấy mọi chi nhánh, và cuộc chưa rõ chi nhánh). Marketing và vai kho không thấy chat của khách.
create or replace function tro_ly_duoc_ho_tro()
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

comment on function tro_ly_duoc_ho_tro() is
  'Người đăng nhập theo dõi và nhận được chat của Trang (0126): chủ, quản lý, thu ngân đang làm — như don_mua_thit_duoc_xem(). Chi nhánh lọc thêm bằng tro_ly_thay_cuoc().';

create or replace function tro_ly_thay_cuoc(p_chi_nhanh_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select tro_ly_duoc_ho_tro()
     and (p_chi_nhanh_id = any (crm_cn_duoc())
          or (p_chi_nhanh_id is null
              and exists (select 1 from nhan_su where auth_uid = auth.uid() and dang_lam and vai_tro = 'chu_so_huu')))
$$;

-- Danh sách cuộc đang mở (tin trong 2 giờ, hoặc nhân viên đang nhận). Lên đầu: cuộc Trang đang trả lời mà cần người
-- (khách đòi gặp người > Trang mời liên hệ quán > khách vừa chốt đơn), rồi cuộc nhân viên đang nhận, rồi tin mới nhất.
create or replace function tro_ly_ds_cuoc()
returns table (
  id             uuid,
  chi_nhanh      text,
  ai_tra_loi     text,
  nhan_vien      text,
  cua_toi        boolean,
  can_nguoi      text,
  can_nguoi_luc  timestamptz,
  so_tin_khach   integer,
  tin_cuoi       text,
  tin_cuoi_luc   timestamptz,
  khach_dang_mo  boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_toi uuid;
begin
  if not tro_ly_duoc_ho_tro() then
    raise exception 'Không có quyền xem chat của Trang' using errcode = 'insufficient_privilege';
  end if;
  v_toi := (nhan_su_hien_tai()).id;
  return query
  select c.id, cn.ten, c.ai_tra_loi, ns.ho_ten, coalesce(c.nhan_vien_id = v_toi, false), c.can_nguoi, c.can_nguoi_luc,
         c.so_tin_khach,
         (select t.noi_dung from tro_ly_tin t where t.cuoc_id = c.id and t.nguoi = 'khach' order by t.id desc limit 1),
         c.tin_cuoi_luc, coalesce(c.khach_xem_luc > now() - interval '45 seconds', false)
  from tro_ly_cuoc c
  left join chi_nhanh cn on cn.id = c.chi_nhanh_id
  left join nhan_su ns on ns.id = c.nhan_vien_id
  where (c.ai_tra_loi = 'nhan_vien' or c.tin_cuoi_luc > now() - interval '2 hours')
    and tro_ly_thay_cuoc(c.chi_nhanh_id)
  order by (c.ai_tra_loi = 'trang' and c.can_nguoi is not null) desc,
           tro_ly_hang_can_nguoi(case when c.ai_tra_loi = 'trang' then c.can_nguoi end) desc,
           (c.ai_tra_loi = 'nhan_vien') desc,
           c.tin_cuoi_luc desc
  limit 100;
end;
$$;

comment on function tro_ly_ds_cuoc() is
  'Màn theo dõi chat của Trang (0126): cuộc đang mở của chi nhánh mình, cuộc cần người lên đầu. Chủ, quản lý, thu ngân đang làm. Tối đa 100.';

-- Xem một cuộc trực tiếp: trạng thái và mọi tin mới hơn p_sau (tối đa 200, cũ trước).
create or replace function tro_ly_xem_cuoc(p_cuoc uuid, p_sau bigint default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cuoc tro_ly_cuoc;
begin
  if not tro_ly_duoc_ho_tro() then
    raise exception 'Không có quyền xem chat của Trang' using errcode = 'insufficient_privilege';
  end if;
  select * into v_cuoc from tro_ly_cuoc where id = p_cuoc;
  if not found or not tro_ly_thay_cuoc(v_cuoc.chi_nhanh_id) then
    raise exception 'Không thấy cuộc chat này' using errcode = 'no_data_found';
  end if;
  return jsonb_build_object(
    'cuoc', jsonb_build_object(
      'id', v_cuoc.id, 'ai_tra_loi', v_cuoc.ai_tra_loi,
      'nhan_vien', (select ns.ho_ten from nhan_su ns where ns.id = v_cuoc.nhan_vien_id),
      'cua_toi', coalesce(v_cuoc.nhan_vien_id = (nhan_su_hien_tai()).id, false),
      'can_nguoi', v_cuoc.can_nguoi, 'can_nguoi_luc', v_cuoc.can_nguoi_luc,
      'khach_dang_mo', coalesce(v_cuoc.khach_xem_luc > now() - interval '45 seconds', false),
      'tin_cuoi_luc', v_cuoc.tin_cuoi_luc, 'created_at', v_cuoc.created_at),
    'tin', (select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'nguoi', t.nguoi, 'noi_dung', t.noi_dung,
                                                         'ten', t.ten_hien, 'du_lieu', t.du_lieu, 'luc', t.created_at)
                                      order by t.id), '[]'::jsonb)
            from (select x.* from tro_ly_tin x where x.cuoc_id = p_cuoc and x.id > coalesce(p_sau, 0)
                  order by x.id limit 200) t));
end;
$$;

comment on function tro_ly_xem_cuoc(uuid, bigint) is
  'Màn theo dõi chat của Trang (0126): một cuộc — trạng thái và tin mới hơn p_sau (tối đa 200). Chủ, quản lý, thu ngân đang làm, cuộc của chi nhánh mình.';

-- Nhận tư vấn: từ lúc này Edge Function không gọi Claude cho cuộc này; khách thấy câu "… đã vào chat" (tên gọi).
-- Trả da_nhan | da_o_san (mình đang nhận rồi — bấm đúp) | nguoi_khac (nhân viên khác đang nhận).
create or replace function tro_ly_nhan_cuoc(p_cuoc uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_cuoc tro_ly_cuoc;
  v_toi  nhan_su;
begin
  if not tro_ly_duoc_ho_tro() then
    raise exception 'Không có quyền nhận chat của Trang' using errcode = 'insufficient_privilege';
  end if;
  select * into v_cuoc from tro_ly_cuoc where id = p_cuoc for update;
  if not found or not tro_ly_thay_cuoc(v_cuoc.chi_nhanh_id) then
    raise exception 'Không thấy cuộc chat này' using errcode = 'no_data_found';
  end if;
  v_toi := nhan_su_hien_tai();
  if v_cuoc.ai_tra_loi = 'nhan_vien' then
    return case when v_cuoc.nhan_vien_id = v_toi.id then 'da_o_san' else 'nguoi_khac' end;
  end if;
  update tro_ly_cuoc
     set ai_tra_loi = 'nhan_vien', nhan_vien_id = v_toi.id, nhan_luc = now(), nhan_vien_go_luc = null
   where id = p_cuoc;
  insert into tro_ly_tin (cuoc_id, nguoi, noi_dung, nhan_vien_id, ten_hien)
  values (p_cuoc, 'he_thong', 'nhan_vien_vao', v_toi.id, tro_ly_ten_goi(v_toi.ho_ten));
  return 'da_nhan';
end;
$$;

comment on function tro_ly_nhan_cuoc(uuid) is
  'Nhân viên nhận một cuộc chat của Trang (0126): Edge Function thôi gọi Claude cho cuộc đó, khách thấy "… đã vào chat". Trả da_nhan | da_o_san | nguoi_khac.';

-- Trả lại cho Trang: người đang nhận, hoặc chủ / quản lý (nhân viên quên trả). Xóa lý do cần người; khách thấy câu
-- "Trang tiếp tục hỗ trợ". Trả da_tra | da_o_san (Trang đang trả lời rồi) | nguoi_khac.
create or replace function tro_ly_tra_cuoc(p_cuoc uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_cuoc tro_ly_cuoc;
  v_toi  nhan_su;
begin
  if not tro_ly_duoc_ho_tro() then
    raise exception 'Không có quyền nhận chat của Trang' using errcode = 'insufficient_privilege';
  end if;
  select * into v_cuoc from tro_ly_cuoc where id = p_cuoc for update;
  if not found or not tro_ly_thay_cuoc(v_cuoc.chi_nhanh_id) then
    raise exception 'Không thấy cuộc chat này' using errcode = 'no_data_found';
  end if;
  v_toi := nhan_su_hien_tai();
  if v_cuoc.ai_tra_loi = 'trang' then
    return 'da_o_san';
  end if;
  if v_cuoc.nhan_vien_id is distinct from v_toi.id and v_toi.vai_tro not in ('chu_so_huu', 'quan_ly') then
    return 'nguoi_khac';
  end if;
  update tro_ly_cuoc
     set ai_tra_loi = 'trang', nhan_vien_id = null, nhan_luc = null, nhan_vien_go_luc = null,
         can_nguoi = null, can_nguoi_luc = null
   where id = p_cuoc;
  insert into tro_ly_tin (cuoc_id, nguoi, noi_dung) values (p_cuoc, 'he_thong', 'trang_quay_lai');
  return 'da_tra';
end;
$$;

comment on function tro_ly_tra_cuoc(uuid) is
  'Trả một cuộc chat lại cho Trang (0126): người đang nhận, hoặc chủ / quản lý. Trả da_tra | da_o_san | nguoi_khac.';

-- Nhân viên gửi một tin (chỉ người đang nhận cuộc). Cùng p_ma_tin (bấm đúp, mạng chập gửi lại) → da_co, không thêm dòng.
-- Trả da_gui | da_co | chua_nhan (mình không phải người đang nhận cuộc này).
create or replace function tro_ly_nv_gui(p_cuoc uuid, p_ma_tin uuid, p_noi_dung text)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_cuoc tro_ly_cuoc;
  v_toi  nhan_su;
  v_chu  text := btrim(coalesce(p_noi_dung, ''));
begin
  if not tro_ly_duoc_ho_tro() then
    raise exception 'Không có quyền nhận chat của Trang' using errcode = 'insufficient_privilege';
  end if;
  if p_ma_tin is null or v_chu = '' or char_length(v_chu) > 1000 then
    raise exception 'Tin nhắn trống hoặc dài quá 1.000 ký tự' using errcode = 'check_violation';
  end if;
  select * into v_cuoc from tro_ly_cuoc where id = p_cuoc for update;
  if not found or not tro_ly_thay_cuoc(v_cuoc.chi_nhanh_id) then
    raise exception 'Không thấy cuộc chat này' using errcode = 'no_data_found';
  end if;
  if exists (select 1 from tro_ly_tin t where t.cuoc_id = p_cuoc and t.ma_tin = p_ma_tin) then
    return 'da_co';
  end if;
  v_toi := nhan_su_hien_tai();
  if v_cuoc.ai_tra_loi <> 'nhan_vien' or v_cuoc.nhan_vien_id is distinct from v_toi.id then
    return 'chua_nhan';
  end if;
  insert into tro_ly_tin (cuoc_id, nguoi, noi_dung, nhan_vien_id, ten_hien, ma_tin)
  values (p_cuoc, 'nhan_vien', v_chu, v_toi.id, tro_ly_ten_goi(v_toi.ho_ten), p_ma_tin);
  update tro_ly_cuoc set tin_cuoi_luc = now(), nhan_vien_go_luc = null where id = p_cuoc;
  return 'da_gui';
end;
$$;

comment on function tro_ly_nv_gui(uuid, uuid, text) is
  'Nhân viên đang nhận cuộc chat gửi một tin cho khách (0126). Cùng ma_tin không ghi hai lần. Trả da_gui | da_co | chua_nhan.';

-- Nhân viên đang gõ: khung chat của khách hiện bong bóng đang soạn trong 6 giây. Chỉ người đang nhận cuộc.
create or replace function tro_ly_nv_dang_go(p_cuoc uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not tro_ly_duoc_ho_tro() then
    raise exception 'Không có quyền nhận chat của Trang' using errcode = 'insufficient_privilege';
  end if;
  update tro_ly_cuoc
     set nhan_vien_go_luc = now()
   where id = p_cuoc and ai_tra_loi = 'nhan_vien' and nhan_vien_id = (nhan_su_hien_tai()).id;
  return found;
end;
$$;

comment on function tro_ly_nv_dang_go(uuid) is
  'Nhân viên đang nhận cuộc chat báo đang gõ (0126): khách thấy bong bóng đang soạn trong 6 giây. Trả false khi không phải người đang nhận.';

-- Màn theo dõi đang mở: gọi mỗi 20–30 giây. Chủ trực mọi chi nhánh; quản lý, thu ngân chi nhánh của mình.
create or replace function tro_ly_dang_truc()
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_toi nhan_su;
begin
  if not tro_ly_duoc_ho_tro() then
    raise exception 'Không có quyền theo dõi chat của Trang' using errcode = 'insufficient_privilege';
  end if;
  v_toi := nhan_su_hien_tai();
  insert into tro_ly_truc (nhan_su_id, chi_nhanh_id, luc)
  values (v_toi.id, case when v_toi.vai_tro = 'chu_so_huu' then null else v_toi.chi_nhanh_id end, now())
  on conflict (nhan_su_id) do update set chi_nhanh_id = excluded.chi_nhanh_id, luc = excluded.luc;
  return true;
end;
$$;

comment on function tro_ly_dang_truc() is
  'Màn theo dõi chat của Trang đang mở (0126): ghi lúc này cho người đăng nhập. Trong 60 giây thì khung chat của khách được nói có nhân viên theo dõi.';


-- =============================================================================
-- 5 · suc_khoe_so_lieu — THÊM Ô tro_ly (đèn "Trợ lý Trang")
-- =============================================================================
-- Chép nguyên văn bản 0115, thêm một ô trước 'chi_nhanh'. loi_24h tính cả lượt treo quá 5 phút (Edge Function chết
-- giữa chừng — không bao giờ ghi được lỗi của chính nó).
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
    -- 0115 · đèn "Thanh toán VNPay" — đơn mua thịt về trả trước trên website (cả thương hiệu, một Terminal).
    'vnpay', (
      select jsonb_build_object(
        'lan_mo_30_ngay', count(*) filter (where t.created_at > now() - interval '30 days'),
        'ipn_cuoi',       max(t.ipn_luc),
        've_chua_ipn',    count(*) filter (where t.trang_thai = 'cho' and t.ve_ma_phan_hoi = '00'
                                             and t.ve_luc > now() - interval '24 hours'
                                             and t.ve_luc < now() - interval '10 minutes'))
      from thanh_toan_vnpay_web t),
    -- 0126 · đèn "Trợ lý Trang" — khung chat của trang Mua thịt về (Edge Function tro-ly-trang, Claude).
    'tro_ly', (
      select jsonb_build_object(
        'bat',       cong_tac_bat('hien_tro_ly_trang'),
        'luot_24h',  count(*),
        'loi_24h',   count(*) filter (where l.trang_thai = 'loi'
                                         or (l.trang_thai = 'dang' and l.created_at < now() - interval '5 minutes')),
        'luot_cuoi', max(l.xong_luc) filter (where l.trang_thai = 'tra_loi'))
      from tro_ly_luot l
      where l.created_at > now() - interval '24 hours'),
    'chi_nhanh', v_ds);
end;
$$;


-- =============================================================================
-- 6 · QUYỀN
-- =============================================================================
-- Sổ học: sửa thẳng bảng qua RLS (như 0117) — thêm, sửa đúng bốn ô hoi, dap, trang_thai, nguon; người duyệt, giờ duyệt,
-- số lần hỏi do database ghi. Nhật ký: chỉ đọc (chủ, quản lý — RLS); không ai ghi trực tiếp.
-- Cuộc chat, tin nhắn, nhân viên trực: không vai nào đọc / ghi thẳng bảng (RLS bật, không policy) — chỉ qua hàm.
-- Ba hàm của Edge Function: chỉ service_role. Bảy hàm nhân viên (mục 4b): authenticated, tự kiểm vai và chi nhánh.
-- Hàm nội bộ (che số, tên gọi, trực, tự trả lại, hạng, quyền): thu khỏi mọi vai — chỉ hàm definer gọi.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on tro_ly_so_hoc from anon';
    execute 'revoke all on tro_ly_luot from anon';
    execute 'revoke all on tro_ly_cuoc from anon';
    execute 'revoke all on tro_ly_tin from anon';
    execute 'revoke all on tro_ly_truc from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on tro_ly_so_hoc from authenticated';
    execute 'grant select, delete on tro_ly_so_hoc to authenticated';
    execute 'grant insert (hoi, dap, trang_thai, nguon) on tro_ly_so_hoc to authenticated';
    execute 'grant update (hoi, dap, trang_thai, nguon) on tro_ly_so_hoc to authenticated';
    execute 'revoke all on tro_ly_luot from authenticated';
    execute 'grant select on tro_ly_luot to authenticated';
    execute 'revoke all on tro_ly_cuoc from authenticated';
    execute 'revoke all on tro_ly_tin from authenticated';
    execute 'revoke all on tro_ly_truc from authenticated';
  end if;
end;
$$;

revoke execute on function tro_ly_mo_luot(uuid, uuid, text, inet, text) from public;
revoke execute on function tro_ly_ghi_luot(uuid, uuid, jsonb) from public;
revoke execute on function tro_ly_xem(uuid, bigint, text) from public;
revoke execute on function tro_ly_che_so(text) from public;
revoke execute on function tro_ly_so_hoc_ghi_duyet() from public;
revoke execute on function tro_ly_ten_goi(text) from public;
revoke execute on function tro_ly_co_truc(uuid) from public;
revoke execute on function tro_ly_tu_tra_lai(uuid) from public;
revoke execute on function tro_ly_hang_can_nguoi(text) from public;
revoke execute on function tro_ly_duoc_ho_tro() from public;
revoke execute on function tro_ly_thay_cuoc(uuid) from public;
revoke execute on function tro_ly_ds_cuoc() from public;
revoke execute on function tro_ly_xem_cuoc(uuid, bigint) from public;
revoke execute on function tro_ly_nhan_cuoc(uuid) from public;
revoke execute on function tro_ly_tra_cuoc(uuid) from public;
revoke execute on function tro_ly_nv_gui(uuid, uuid, text) from public;
revoke execute on function tro_ly_nv_dang_go(uuid) from public;
revoke execute on function tro_ly_dang_truc() from public;
do $$
declare
  v_noi_bo text[] := array[
    'tro_ly_mo_luot(uuid, uuid, text, inet, text)', 'tro_ly_ghi_luot(uuid, uuid, jsonb)', 'tro_ly_xem(uuid, bigint, text)',
    'tro_ly_che_so(text)', 'tro_ly_so_hoc_ghi_duyet()', 'tro_ly_ten_goi(text)', 'tro_ly_co_truc(uuid)',
    'tro_ly_tu_tra_lai(uuid)', 'tro_ly_hang_can_nguoi(text)', 'tro_ly_duoc_ho_tro()', 'tro_ly_thay_cuoc(uuid)'];
  v_nhan_vien text[] := array[
    'tro_ly_ds_cuoc()', 'tro_ly_xem_cuoc(uuid, bigint)', 'tro_ly_nhan_cuoc(uuid)', 'tro_ly_tra_cuoc(uuid)',
    'tro_ly_nv_gui(uuid, uuid, text)', 'tro_ly_nv_dang_go(uuid)', 'tro_ly_dang_truc()'];
  v_ham text;
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    foreach v_ham in array v_noi_bo || v_nhan_vien loop
      execute format('revoke execute on function %s from anon', v_ham);
    end loop;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    foreach v_ham in array v_noi_bo loop
      execute format('revoke execute on function %s from authenticated', v_ham);
    end loop;
    foreach v_ham in array v_nhan_vien loop
      execute format('grant execute on function %s to authenticated', v_ham);
    end loop;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function tro_ly_mo_luot(uuid, uuid, text, inet, text) to service_role';
    execute 'grant execute on function tro_ly_ghi_luot(uuid, uuid, jsonb) to service_role';
    execute 'grant execute on function tro_ly_xem(uuid, bigint, text) to service_role';
  end if;
end;
$$;
