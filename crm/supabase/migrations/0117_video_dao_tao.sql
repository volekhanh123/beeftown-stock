-- =============================================================================
-- 0117 · VIDEO ĐÀO TẠO — danh sách video training nội bộ, xem ở /noi-bo/dao-tao
-- =============================================================================
-- Khánh chốt 14/11/2026: video training (dài hơn 11 phút, không có thông tin nhạy cảm) để trên YouTube ở chế độ
-- "Không công khai", nhúng vào một trang chỉ nhân viên đã đăng nhập mới mở được.
--
-- VÌ SAO MÃ VIDEO NẰM TRONG DATABASE, KHÔNG TRONG MÃ NGUỒN. Repo công khai trên GitHub: mã video ghi trong file .ts là
-- ai cũng đọc được, và "Không công khai" chỉ còn là "ai có link thì xem". Ở đây mã video chỉ ra khỏi database cho người
-- đang đăng nhập — anon, tài khoản máy, nhân sự đã nghỉ, tài khoản không có dòng nhan_su: 0 dòng.
--
-- Giới hạn đã nói với Khánh: cổng đăng nhập giấu link, không khóa video. Nhân viên đang xem vẫn chép được link YouTube
-- gửi ra ngoài, và người đã nghỉ còn giữ link vẫn mở được. Chấp nhận vì nội dung không nhạy cảm. Cần khóa thật thì
-- chuyển sang Cloudflare Stream (link ký, tự hết hạn) — thay cột youtube_id, không thay trang.
--
-- AI LÀM GÌ
--   Xem: bảy vai người (bốn vai CRM 0001, ba vai kho 0017) đang làm — đúng các vai mở được trang. Video dùng chung cho
--        mọi chi nhánh: training là của cả quán, không có cột chi_nhanh_id.
--   Thêm, sửa tên / mô tả, xóa: chủ nhà hàng, quản lý (như Cài đặt nhà hàng).
--   Sửa thẳng bảng qua RLS — không hàm definer. Quyền cột: thêm chỉ được ba ô youtube_id, tieu_de, mo_ta; sửa chỉ
--   tieu_de, mo_ta. Muốn đổi video thì xóa rồi thêm (một dòng là một video, không lẳng lặng đổi ruột).
--
-- GỬI HAI LẦN: youtube_id duy nhất. Bấm đúp nút Thêm thì lần hai vướng ràng buộc (23505) — web báo "video này đã có
-- trong danh sách", đúng sự thật vì lần một đã thêm.
--
-- Không câu delete. Không thêm giá trị enum. Chạy migration trước, deploy web sau (web mới đọc bảng chưa có thì trang
-- báo chưa đọc được danh sách — không trang 500; web cũ không đọc bảng này).

create table video_dao_tao (
  id          uuid primary key default gen_random_uuid(),
  -- Mã 11 ký tự sau watch?v= / youtu.be/. Web tách từ link dán vào (lib/video-dao-tao.ts, layMaYoutube).
  youtube_id  text not null,
  tieu_de     text not null,
  mo_ta       text,
  tao_boi     uuid references nhan_su (id) on delete set null default (nhan_su_hien_tai()).id,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint video_dao_tao_youtube_hop_le check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  constraint video_dao_tao_youtube_duy_nhat unique (youtube_id),
  constraint video_dao_tao_tieu_de_hop_le check (tieu_de = btrim(tieu_de) and char_length(tieu_de) between 1 and 150),
  constraint video_dao_tao_mo_ta_hop_le check (mo_ta is null or (mo_ta = btrim(mo_ta) and char_length(mo_ta) between 1 and 1000))
);

comment on table video_dao_tao is
  'Video training nội bộ (0117): YouTube chế độ Không công khai, nhúng ở /noi-bo/dao-tao. Bảy vai người đang làm xem; chủ, quản lý thêm / sửa / xóa.';
comment on column video_dao_tao.youtube_id is
  'Mã video YouTube (11 ký tự). Chỉ người đang đăng nhập đọc được — repo công khai nên mã không được nằm trong mã nguồn.';
comment on column video_dao_tao.tao_boi is
  'Nhân sự đã thêm video. Tự điền từ phiên đăng nhập (nhan_su_hien_tai), người dùng không ghi được ô này.';

create index video_dao_tao_created_at_idx on video_dao_tao (created_at);

create trigger video_dao_tao_updated_at
  before update on video_dao_tao
  for each row execute function tu_dong_cap_nhat_updated_at();


-- =============================================================================
-- RLS VÀ QUYỀN
-- =============================================================================
-- Hàm phân quyền bọc trong (select …): Postgres tính một lần cho cả câu (0070, test-quyen-doc-crm.mjs mục 3).
alter table video_dao_tao enable row level security;

create policy video_dao_tao_doc on video_dao_tao
  for select using ((select co_vai_tro(array['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing',
                                             'thu_kho', 'nhan_vien_quay', 'ke_toan']::vai_tro[])));
create policy video_dao_tao_them on video_dao_tao
  for insert with check ((select co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[])));
create policy video_dao_tao_sua on video_dao_tao
  for update using ((select co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[])))
  with check ((select co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[])));
create policy video_dao_tao_xoa on video_dao_tao
  for delete using ((select co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[])));

-- revoke all (không chỉ insert / update / delete): bỏ luôn TRUNCATE (không qua RLS), REFERENCES, TRIGGER mà quyền mặc
-- định của Supabase cấp. Cùng cách với 0099 (ban_le_san_pham).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on video_dao_tao from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on video_dao_tao from authenticated';
    execute 'grant select, delete on video_dao_tao to authenticated';
    execute 'grant insert (youtube_id, tieu_de, mo_ta) on video_dao_tao to authenticated';
    execute 'grant update (tieu_de, mo_ta) on video_dao_tao to authenticated';
  end if;
end;
$$;
