-- =============================================================================
-- BEEFTOWN — 0021 · KHO · ẢNH CHỨNG TỪ (SUPABASE STORAGE)
-- =============================================================================
-- Ảnh hóa đơn nhà cung cấp, ảnh hàng hỏng khi báo hủy, ảnh chứng từ thanh toán.
--
-- Kho file RIÊNG `kho-chung-tu`, không dùng chung beeftown-noi-bo, vì kho đó:
--   · cho MỌI phiên đăng nhập đọc — nhân viên quầy sẽ thấy ảnh hóa đơn có giá;
--   · không cho thủ kho tải lên;
--   · là nơi để tư liệu marketing, không phải chứng từ.
--
-- ĐƯỜNG DẪN: <chi_nhanh_id>/<loai>/<ma_gui>/<số thứ tự>.<đuôi>
--   loai = nhap       : ảnh hóa đơn, phiếu giao hàng   → đọc: xem_gia · tải: nhap
--          huy        : ảnh hàng hỏng                  → đọc: xem     · tải: van_hanh
--          thanh_toan : ảnh ủy nhiệm chi, biên nhận    → đọc: xem_gia · tải: ke_toan
-- Đoạn đầu (chi nhánh) và đoạn hai (loại) quyết định ai đọc, ai tải.
--
-- Không có policy SỬA hay XÓA: ảnh là bằng chứng. Tải nhầm thì tải ảnh khác,
-- ảnh cũ vẫn nằm đó — nhưng chứng từ chỉ trỏ tới ảnh mới.
--
-- HAI HÀM KIỂM TRA NẰM NGOÀI KHỐI STORAGE, có chủ đích: PGlite không có schema
-- storage nên bỏ qua cả khối, nhưng vẫn kiểm được hai hàm này (test-kho-quyen).
-- Hàm nhận TEXT và tự kiểm định dạng — đoạn đường dẫn do người gửi đặt, và
-- 'abc'::uuid sẽ ném lỗi thay vì trả false (bài học của 0016).
--
-- Hai hàm phải GỌI ĐƯỢC bởi authenticated: policy storage chạy dưới vai của
-- người đang tải, không phải dưới vai chủ hàm. (Đây là chỗ 0016 có thể đã
-- sai với anon — xem ghi chú trong README.)
-- =============================================================================

create or replace function kho_tach_duong_dan_tep(p_ten text)
returns table (chi_nhanh_id uuid, loai text)
language plpgsql
immutable
as $$
declare
  v_doan text[];
begin
  if p_ten is null then
    return;
  end if;
  v_doan := string_to_array(p_ten, '/');
  if array_length(v_doan, 1) < 4
     or v_doan[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     or v_doan[2] not in ('nhap', 'huy', 'thanh_toan')
     or p_ten like '%..%' then
    return;
  end if;
  return query select v_doan[1]::uuid, v_doan[2];
end;
$$;

comment on function kho_tach_duong_dan_tep is
  'Tách đường dẫn ảnh chứng từ kho thành (chi nhánh, loại). Đường dẫn sai dạng trả về rỗng, không ném lỗi.';

create or replace function kho_duoc_doc_tep(p_ten text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select kho_duoc(t.chi_nhanh_id,
                    case t.loai when 'huy' then 'xem' else 'xem_gia' end)
    from kho_tach_duong_dan_tep(p_ten) t
  ), false);
$$;

create or replace function kho_duoc_tai_tep(p_ten text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select kho_duoc(t.chi_nhanh_id,
                    case t.loai when 'nhap' then 'nhap'
                                when 'huy' then 'van_hanh'
                                else 'ke_toan' end)
    from kho_tach_duong_dan_tep(p_ten) t
  ), false);
$$;

comment on function kho_duoc_doc_tep is
  'Người đang đăng nhập có được XEM ảnh chứng từ kho này không. Ảnh hủy: vai xem. Hóa đơn, thanh toán: vai xem_gia.';
comment on function kho_duoc_tai_tep is
  'Người đang đăng nhập có được TẢI LÊN ảnh chứng từ kho vào đường dẫn này không.';


do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    raise notice 'Không có schema storage (đang chạy PGlite) — bỏ qua phần kho file của 0021.';
    return;
  end if;

  execute $sql$
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values
      ('kho-chung-tu', 'kho-chung-tu', false, 10485760,
       array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'])
    on conflict (id) do nothing
  $sql$;

  execute $sql$
    create policy "kho_chung_tu_xem" on storage.objects
      for select to authenticated
      using (bucket_id = 'kho-chung-tu' and public.kho_duoc_doc_tep(name))
  $sql$;

  execute $sql$
    create policy "kho_chung_tu_tai_len" on storage.objects
      for insert to authenticated
      with check (bucket_id = 'kho-chung-tu' and public.kho_duoc_tai_tep(name))
  $sql$;

  raise notice '0021: đã tạo kho file kho-chung-tu và hai chính sách xem / tải lên.';
end
$$;


-- =============================================================================
-- KIỂM TRA BẰNG TAY — BẮT BUỘC, vì npm test không chạm tới phần storage
-- =============================================================================
-- Làm trên project Supabase THỬ (không phải project thật), sau khi chạy xong
-- toàn bộ migration và tạo tài khoản các vai:
--
--  1. Storage → có kho kho-chung-tu, KHÔNG có cờ Public.
--  2. Thủ kho lập phiếu nhập có chụp hóa đơn → ảnh tải lên được.
--  3. Đăng nhập nhân viên quầy, mở đường dẫn ảnh hóa đơn đó → PHẢI bị từ chối.
--  4. Nhân viên quầy báo hủy có ảnh → tải lên được; quản lý mở xem được.
--  5. Tài khoản chi nhánh khác mở ảnh của chi nhánh này → PHẢI bị từ chối.
--  6. Thử tải một file .exe hoặc file 20MB → bị chặn bởi kho.
--  7. Thử xóa một ảnh qua API bằng tài khoản quản lý → PHẢI bị từ chối.
--
-- Ghi lại ngày kiểm tra và người kiểm tra vào crm/README.md.
-- =============================================================================


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6
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

    -- Đo lường
    execute 'grant execute on function ghi_su_kien_web(text,text,uuid,text,text,text,text,text,text,text) to anon';
  end if;
end
$$;
