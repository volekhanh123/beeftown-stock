-- =============================================================================
-- BEEFTOWN CRM — 0014 · KHO FILE (SUPABASE STORAGE)
-- Ba kho · quyền truy cập · vé tải CV
-- =============================================================================
-- FILE NÀY LÀ NGOẠI LỆ DUY NHẤT TRONG BỘ MIGRATION
--
-- Toàn bộ nội dung bọc trong một khối kiểm tra schema `storage`. PGlite không
-- có schema đó, nên khi chạy `npm test` thì file này bỏ qua sạch và không có
-- kiểm tra nào ở đây chạy được.
--
-- Đó là một đánh đổi CÓ Ý THỨC: gom toàn bộ phần không kiểm thử được vào một
-- file duy nhất, có đánh dấu rõ, thay vì rải rác khắp nơi. Đổi lại, phần này
-- phải được KIỂM TRA BẰNG TAY trên project Supabase thật — danh sách ở cuối
-- file.
--
-- BA KHO VÀ LÝ DO
--
--   beeftown-cong-khai  · công khai · ảnh hiện trên website
--   beeftown-noi-bo     · riêng tư  · tư liệu thô, ảnh chưa duyệt
--   ho-so-ung-tuyen     · riêng tư  · CV ứng viên
--
-- Kho CV là kho nguy hiểm nhất: anon phải GHI được vào đó, nhưng tuyệt đối
-- không ĐỌC được. Một kho cho phép ghi tự do là một dịch vụ lưu trữ file miễn
-- phí cho người phát tán mã độc. Chốt chặn là vé tải lên ở 0012: server cấp
-- đoạn đường dẫn, hết hạn 15 phút, dùng một lần — và policy dưới đây kiểm tra
-- đúng đoạn đầu của đường dẫn có phải một vé còn hiệu lực hay không.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    raise notice 'Không có schema storage (đang chạy PGlite) — bỏ qua 0014.';
    return;
  end if;

  -- ---------------------------------------------------------------------------
  -- TẠO KHO
  -- ---------------------------------------------------------------------------
  -- file_size_limit và allowed_mime_types làm được việc mà SQL không làm được:
  -- chặn theo kiểu file và dung lượng ngay ở tầng kho.
  execute $sql$
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values
      ('beeftown-cong-khai', 'beeftown-cong-khai', true,  10485760,
       array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml']),
      ('beeftown-noi-bo',    'beeftown-noi-bo',    false, 52428800,
       array['image/jpeg','image/png','image/webp','image/avif','video/mp4','application/pdf']),
      ('ho-so-ung-tuyen',    'ho-so-ung-tuyen',    false, 5242880,
       array['application/pdf','image/jpeg','image/png',
             'application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
    on conflict (id) do nothing
  $sql$;

  -- ---------------------------------------------------------------------------
  -- KHO CÔNG KHAI — ai cũng xem, chỉ ba vai trò nội dung được tải lên
  -- ---------------------------------------------------------------------------
  execute $sql$
    create policy "cong_khai_ai_cung_xem" on storage.objects
      for select using (bucket_id = 'beeftown-cong-khai')
  $sql$;

  execute $sql$
    create policy "cong_khai_nhan_su_tai_len" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'beeftown-cong-khai'
        and public.co_vai_tro(array['chu_so_huu','quan_ly','marketing']::public.vai_tro[]))
  $sql$;

  execute $sql$
    create policy "cong_khai_nhan_su_sua" on storage.objects
      for update to authenticated
      using (
        bucket_id = 'beeftown-cong-khai'
        and public.co_vai_tro(array['chu_so_huu','quan_ly','marketing']::public.vai_tro[]))
  $sql$;

  -- Xóa ảnh công khai: chỉ chủ sở hữu và quản lý. Ảnh đang hiển thị mà biến
  -- mất thì trang hỏng im lặng — nên đây phải là một việc có chủ đích.
  execute $sql$
    create policy "cong_khai_xoa" on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'beeftown-cong-khai'
        and public.co_vai_tro(array['chu_so_huu','quan_ly']::public.vai_tro[]))
  $sql$;

  -- ---------------------------------------------------------------------------
  -- KHO NỘI BỘ — nhân sự đăng nhập mới thấy
  -- ---------------------------------------------------------------------------
  execute $sql$
    create policy "noi_bo_nhan_su_xem" on storage.objects
      for select to authenticated
      using (bucket_id = 'beeftown-noi-bo' and public.co_phien_dang_nhap())
  $sql$;

  execute $sql$
    create policy "noi_bo_nhan_su_tai_len" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'beeftown-noi-bo'
        and public.co_vai_tro(array['chu_so_huu','quan_ly','marketing']::public.vai_tro[]))
  $sql$;

  -- ---------------------------------------------------------------------------
  -- KHO HỒ SƠ ỨNG TUYỂN — anon GHI được, KHÔNG ĐỌC được
  -- ---------------------------------------------------------------------------
  -- Điều kiện ghi: đoạn đầu của đường dẫn phải là một vé còn hạn, chưa dùng.
  -- Đường dẫn có dạng  ho-so-ung-tuyen/<mã vé>/<tên file>, nên
  -- storage.foldername(name) lấy ra đoạn đầu chính là mã vé.
  --
  -- Nhờ vậy anon không tự chọn được đường dẫn: muốn ghi thì phải xin vé, mà
  -- vé thì do server cấp và có giới hạn theo IP.
  execute $sql$
    create policy "ho_so_anon_tai_len_bang_ve" on storage.objects
      for insert to anon
      with check (
        bucket_id = 'ho-so-ung-tuyen'
        and exists (
          select 1 from public.phieu_tai_len p
          where p.id::text = (storage.foldername(name))[1]
            and not p.da_dung
            and p.het_han > now()))
  $sql$;

  -- Chỉ chủ sở hữu và quản lý đọc được CV. Marketing và thu ngân không.
  execute $sql$
    create policy "ho_so_quan_ly_xem" on storage.objects
      for select to authenticated
      using (
        bucket_id = 'ho-so-ung-tuyen'
        and public.co_vai_tro(array['chu_so_huu','quan_ly']::public.vai_tro[]))
  $sql$;

  -- Xóa CV khi hết hạn lưu (NĐ 13/2023). Chỉ chủ sở hữu.
  execute $sql$
    create policy "ho_so_xoa_khi_het_han" on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'ho-so-ung-tuyen'
        and public.co_vai_tro(array['chu_so_huu']::public.vai_tro[]))
  $sql$;

  raise notice '0014: đã tạo 3 kho file và các chính sách truy cập.';
end
$$;


-- =============================================================================
-- KIỂM TRA BẰNG TAY — BẮT BUỘC, vì npm test không chạm tới được phần này
-- =============================================================================
-- Làm trên project Supabase thật, sau khi chạy xong toàn bộ migration:
--
--  1. Storage → phải thấy đúng ba kho, và chỉ beeftown-cong-khai có cờ Public.
--
--  2. Mở một cửa sổ ẩn danh, dán đường dẫn của một file trong ho-so-ung-tuyen.
--     PHẢI bị từ chối. Đây là phép thử quan trọng nhất của cả file.
--
--  3. Đăng nhập bằng tài khoản vai trò marketing, thử mở cùng file đó.
--     PHẢI bị từ chối.
--
--  4. Đăng nhập bằng tài khoản quản lý → mở được.
--
--  5. Thử tải file lên ho-so-ung-tuyen với một đường dẫn tự bịa
--     (ví dụ ho-so-ung-tuyen/test/x.pdf). PHẢI bị từ chối vì "test" không
--     phải một mã vé hợp lệ.
--
--  6. Xin vé qua xin_phieu_tai_cv(), tải lên đường dẫn theo mã vé đó →
--     thành công. Tải lên lần hai cùng đường dẫn → vé đã dùng, PHẢI bị từ chối.
--
--  7. Thử tải một file .exe lên bất kỳ kho nào → bị chặn bởi allowed_mime_types.
--
--  8. Thử tải một file 20MB lên ho-so-ung-tuyen → bị chặn bởi file_size_limit.
--
-- Ghi lại ngày kiểm tra và người kiểm tra vào crm/README.md.
-- =============================================================================
