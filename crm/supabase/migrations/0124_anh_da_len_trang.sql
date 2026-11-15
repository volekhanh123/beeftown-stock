-- =============================================================================
-- BEEFTOWN CRM — 0124 · ẢNH CỦA NỘI DUNG ĐÃ LÊN TRANG CHỈ NGƯỜI ĐƯỢC CÔNG BỐ KHÓA ĐÓ MỚI SỬA ĐƯỢC
-- =============================================================================
-- LỖI (vòng bốn rà soát của 0122, tái hiện trên PGlite — crm/test/test-quyen-anh-da-len-trang.mjs)
--
-- Nội dung kiểu ảnh không giữ ảnh trong dòng noi_dung_cong_bo: nó trỏ tới một dòng tep_anh qua gia_tri_tep_id
-- (khóa anh_chia_se — ảnh og:image của trang công khai). noi_dung_cong_khai() (bản cuối 0101) đọc thẳng dòng tep_anh
-- đó: đường dẫn, kho, mô tả thay thế, chú thích, nguồn ảnh, kích thước; web/src/layouts/Trang.astro dựng thẻ
-- og:image từ đúng các cột ấy. Trigger của 0010 và 0122 khóa CỘT gia_tri_tep_id của dòng đã lên trang, nhưng không
-- khóa DÒNG ảnh được trỏ tới, còn policy tep_anh_sua (0009, 0070) cho chủ, quản lý và marketing sửa mọi cột của
-- mọi dòng tep_anh. Tức là người không được công bố khóa đó vẫn đổi được ảnh khách thấy — kể cả khai lại nguồn ảnh,
-- đúng chốt chặn của 0009 — mà không qua cổng công bố (dat_noi_dung, thu_hoi_noi_dung).
--
-- ĐỔI GÌ
--
--   Trigger anh_da_len_trang_trigger (before update on tep_anh): ảnh được một dòng noi_dung_cong_bo ĐÃ LÊN TRANG
--   trỏ tới — đang công bố hoặc đã gỡ — chỉ người được công bố MỌI khóa của các dòng đó mới sửa được: chỉ chủ khi
--   trong đó có một khóa chi_chu_so_huu, chủ hoặc quản lý khi toàn khóa thường. Cùng luật với trigger
--   noi_dung_cong_bo_da_len_trang_kiem_tra (0122), dat_noi_dung và thu_hoi_noi_dung. Xét mọi cột, kể cả cột thêm
--   vào bảng sau này: so cả dòng (to_jsonb), không theo danh sách cột, nên quên không thành hở. Gửi lại dòng với
--   giá trị KHÔNG đổi thì vẫn lưu.
--
--   Ảnh chưa lên trang — chưa dòng nào trỏ tới, hay chỉ bản nháp / bản đã duyệt chưa công bố trỏ tới — không đụng:
--   marketing vẫn tải ảnh mới, sửa nó và gắn vào bản nháp như trước. Ảnh của dòng ĐÃ GỠ vẫn giữ, như 0122: dòng đã
--   gỡ là sổ ghi vết "ảnh nào đã lên trang, lúc nào", và có thể được công bố lại bằng bản mới trỏ tới cùng ảnh.
--
-- THAY ẢNH ĐANG CÔNG BỐ — đường cũ, không đổi: tải ảnh mới (một dòng tep_anh mới), rồi người được công bố khóa đó
-- công bố bản mới trỏ tới nó (dat_noi_dung với p_cong_bo; bản cũ tự thành dòng đã gỡ). Chủ và quản lý cũng sửa
-- thẳng được dòng ảnh đã lên trang của khóa họ công bố được: họ tự công bố được bản thay thế, chặn họ không giữ thêm
-- được gì.
--
-- XÓA: đã chặn sẵn, file này không thêm gì. tep_anh không có policy xóa (0009: "Không ai xóa được"), và khóa ngoại
-- noi_dung_cong_bo.gia_tri_tep_id là on delete restrict (0010) — chặn cả lời gọi không phiên. Kiểm thử nhóm 8 giữ
-- cả hai lớp.
--
-- MÁY DỊCH. web/src/lib/ban-dich.ts dịch bù dưới phiên người đang mở /noi-bo, ghi qua ghi_ban_dich (security
-- invoker) với nội dung bản dịch do người gọi gửi lên. Bản tiếng Anh, tiếng Hàn của ảnh đã lên trang là thứ khách
-- thấy y như bản tiếng Việt, nên cũng khóa — giống bản dịch của dòng noi_dung_cong_bo đang công bố (0036). Lượt dịch
-- bù dưới phiên marketing không ghi được ảnh đã lên trang (việc chạy nền, không màn hình nào báo "đã dịch" cho ảnh);
-- lượt dưới phiên chủ hay quản lý — thường ngay sau khi họ bấm công bố — ghi được.
--
-- VÌ SAO SECURITY DEFINER. Hàm phải thấy MỌI dòng noi_dung_cong_bo trỏ tới ảnh, bất kể người gọi đọc được gì. Hàm
-- security invoker đọc qua RLS của người gọi: một migration sau này thu hẹp policy noi_dung_doc (ví dụ marketing chỉ
-- thấy bản nháp) sẽ làm hàm thấy 0 dòng và lặng lẽ mở khóa (kiểm thử nhóm 9 thử đúng chuyện này). Hàm không trả gì
-- ra ngoài hai câu báo bên dưới — câu nêu tên khóa, mà người tới được trigger này vốn đọc được sổ khóa —, đặt
-- search_path, và không ai gọi thẳng được. Trigger BEFORE UPDATE chỉ chạy với dòng đã qua USING của policy
-- tep_anh_sua, nên chỉ chủ, quản lý, marketing đang làm mới tới được câu báo (khác INSERT — lý do 0123 dùng AFTER).
--
-- KHÔNG PHIÊN THÌ BỎ QUA: Supabase Studio (Table Editor, SQL Editor) — nơi ảnh được tải lên hôm nay (web/README.md,
-- "Màn hình chọn ảnh") — và seed của migration, như hai trigger của 0122.
--
-- THỨ TỰ TRIGGER. Postgres chạy các trigger BEFORE của một bảng theo thứ tự tên. anh_da_len_trang_trigger đứng TRƯỚC
-- so_ban_dich_trigger, tep_anh_kiem_tra_cong_bo_trigger và tep_anh_updated_at, nên hàm thấy đúng dòng người gọi gửi
-- lên: chưa có giờ sửa tự ghi, chưa có sổ bản dịch tự chuẩn hóa — update không đổi gì thì to_jsonb(new) bằng
-- to_jsonb(old). Đổi tên trigger mà nó đứng sau một trigger khác thì kiểm thử nhóm 9 đỏ.
--
-- CÒN LẠI, NGOÀI PHẠM VI: ảnh chỉ nằm trong bản nháp vẫn sửa được tới lúc bản công bố trỏ tới nó được ghi — người
-- công bố công bố ảnh đúng như dòng tep_anh đang là lúc bấm, như với mọi bản nháp (0122 không khóa bản nháp).
--
-- CÂU MỚI (bản tiếng Anh ở web/src/lib/cau-noi-bo.ts):
--   'Khóa % chỉ chủ sở hữu mới được sửa ảnh của nội dung đã công bố hoặc đã gỡ'
--   'Không có quyền sửa ảnh của nội dung đã công bố hoặc đã gỡ'
--
-- Không sửa dữ liệu. Không câu delete. Không thay thân hàm nào có sẵn. Chạy migration lên production sau khi PR
-- được gộp; web không đổi gì cần deploy trước hay sau.
-- =============================================================================


create or replace function tep_anh_da_len_trang_kiem_tra()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_da_len_trang boolean;  -- có dòng noi_dung_cong_bo đang công bố hoặc đã gỡ trỏ tới ảnh này
  v_khoa_chu     text;     -- một khóa chỉ chủ sở hữu trong các dòng đó — nêu trong câu báo
begin
  if not co_phien_dang_nhap() then
    return new;
  end if;
  if to_jsonb(new) is not distinct from to_jsonb(old) then
    return new;
  end if;

  -- Mọi dòng ĐÃ LÊN TRANG trỏ tới ảnh này, bất kể RLS của người gọi (hàm definer). Không thấy khóa trong sổ đăng ký
  -- (không xảy ra: có khóa ngoại) thì coi như khóa chỉ chủ — sai thì chặt, như 0122.
  select count(*) > 0,
         min(n.khoa) filter (where coalesce(k.chi_chu_so_huu, true))
    into v_da_len_trang, v_khoa_chu
    from noi_dung_cong_bo n
    left join khoa_cong_bo k on k.khoa = n.khoa
   where n.gia_tri_tep_id = old.id
     and n.trang_thai in ('da_cong_bo', 'da_thu_hoi');

  if not v_da_len_trang then
    return new;
  end if;
  -- Phải được công bố MỌI khóa trỏ tới ảnh: một khóa chỉ chủ là đủ để chỉ chủ sửa được.
  if v_khoa_chu is not null then
    if not la_chu_so_huu() then
      raise exception 'Khóa % chỉ chủ sở hữu mới được sửa ảnh của nội dung đã công bố hoặc đã gỡ', v_khoa_chu
        using errcode = 'insufficient_privilege';
    end if;
  elsif not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
    raise exception 'Không có quyền sửa ảnh của nội dung đã công bố hoặc đã gỡ'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

comment on function tep_anh_da_len_trang_kiem_tra() is
  'Trigger của tep_anh (0124): ảnh được một dòng noi_dung_cong_bo đang công bố hoặc đã gỡ trỏ tới chỉ người được công bố mọi khóa của các dòng đó mới sửa được — chủ khi có một khóa chi_chu_so_huu, chủ hoặc quản lý khi toàn khóa thường; mọi cột, kể cả bản dịch. Ảnh chưa lên trang (chưa ai trỏ tới, hay chỉ bản nháp trỏ tới) không đụng. Security definer để thấy mọi dòng trỏ tới ảnh bất kể RLS của người gọi. Không phiên (Supabase Studio) thì bỏ qua.';

-- Tên đứng TRƯỚC mọi trigger khác của tep_anh theo thứ tự chữ cái (so_ban_dich_trigger, tep_anh_kiem_tra_cong_bo_trigger,
-- tep_anh_updated_at): hàm trên thấy đúng dòng người gọi gửi lên.
create trigger anh_da_len_trang_trigger
  before update on tep_anh
  for each row execute function tep_anh_da_len_trang_kiem_tra();


-- =============================================================================
-- QUYỀN — hàm trigger không ai gọi thẳng (trigger chạy không cần quyền EXECUTE của người ghi)
-- =============================================================================
revoke execute on function tep_anh_da_len_trang_kiem_tra() from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function tep_anh_da_len_trang_kiem_tra() from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function tep_anh_da_len_trang_kiem_tra() from authenticated';
  end if;
end
$$;
