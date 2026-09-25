-- =============================================================================
-- BEEFTOWN CRM — 0016 · VÁ HAI LỖ HỔNG QUYỀN
-- =============================================================================
-- Hai lỗi độc lập nhau, cùng một gốc: một biểu thức kiểm tra quyền chạy dưới
-- vai không đủ quyền để chạy nó.
-- =============================================================================


-- =============================================================================
-- 1 · VÉ TẢI CV — policy storage không thể tự kiểm vé
-- =============================================================================
-- LỖI
--
-- 0014 dựng policy cho anon ghi vào kho ho-so-ung-tuyen như sau:
--
--   with check (bucket_id = 'ho-so-ung-tuyen'
--               and exists (select 1 from public.phieu_tai_len p
--                           where p.id::text = (storage.foldername(name))[1] ...))
--
-- Ý đồ đúng: anon không tự chọn được đường dẫn, phải xin vé trước. Nhưng câu
-- EXISTS đó chạy DƯỚI QUYỀN ANON, mà anon:
--
--   · không có GRANT trên phieu_tai_len — bảng ra đời ở 0012, tức SAU khi
--     0008 đã `alter default privileges ... revoke all on tables from anon`;
--   · và bị RLS chặn — policy duy nhất của bảng là phieu_tai_len_doc, chỉ cho
--     chu_so_huu đọc.
--
-- Nên điều kiện luôn sai, và MỌI lượt tải CV đều bị từ chối. Ứng viên nhận
-- câu "File CV không tải lên được nên hồ sơ được nộp không kèm CV" — một câu
-- đúng ngữ pháp, sai bản chất, và xuất hiện 100% số lần.
--
-- Không test nào bắt được: phần storage nằm trong khối `if not exists (schema
-- storage)` nên PGlite bỏ qua sạch, và đó chính là điều 0014 tự cảnh báo ở
-- đầu file khi bắt phải kiểm tay.
--
-- CÁCH SỬA
--
-- Một hàm security definer làm đúng một việc: trả lời "đoạn này có phải vé
-- còn hiệu lực không". Nó KHÔNG nhận uuid mà nhận text, rồi tự kiểm định
-- dạng bên trong — vì đoạn đầu đường dẫn là chuỗi do người gửi đặt, và
-- `'abc'::uuid` sẽ ném lỗi chứ không trả false.
--
-- Hàm chỉ trả về boolean, không trả nội dung vé, nên nó không mở thêm đường
-- đọc nào vào bảng.
-- =============================================================================

create or replace function ve_con_hieu_luc(p_doan text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- Đoạn đầu đường dẫn do NGƯỜI GỬI đặt. Không ép kiểu thẳng: một đoạn như
  -- 'test' sẽ làm cả câu policy ném lỗi thay vì trả false, và lỗi trong
  -- policy thì hiện ra thành một thông báo khó hiểu ở tầng storage.
  if p_doan is null then return false; end if;
  if p_doan !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;

  v_id := p_doan::uuid;

  return exists (
    select 1 from phieu_tai_len
    where id = v_id
      and not da_dung
      and het_han > now());
end;
$$;

comment on function ve_con_hieu_luc is
  'Đoạn đầu đường dẫn kho CV có phải một vé còn hiệu lực không. Chỉ trả boolean — không mở đường đọc nào vào phieu_tai_len.';


-- Thay policy cũ. Bọc trong khối kiểm schema storage để PGlite bỏ qua, đúng
-- khuôn 0014.
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    raise notice 'Không có schema storage (đang chạy PGlite) — bỏ qua mục 1 của 0016.';
    return;
  end if;

  execute $sql$ drop policy if exists "ho_so_anon_tai_len_bang_ve" on storage.objects $sql$;

  execute $sql$
    create policy "ho_so_anon_tai_len_bang_ve" on storage.objects
      for insert to anon
      with check (
        bucket_id = 'ho-so-ung-tuyen'
        and public.ve_con_hieu_luc((storage.foldername(name))[1]))
  $sql$;

  raise notice '0016: đã vá policy tải CV — anon giờ kiểm vé qua hàm definer.';
end
$$;


-- =============================================================================
-- 2 · THU HỒI NỘI DUNG — cờ chi_chu_so_huu chỉ có hiệu lực một chiều
-- =============================================================================
-- LỖI
--
-- khoa_cong_bo.chi_chu_so_huu nghĩa là "chỉ chủ nhà hàng được công bố khóa
-- này". Trigger noi_dung_cong_bo_kiem_tra() ở 0010 kiểm đúng điều đó — nhưng
-- CHỈ ở nhánh new.trang_thai = 'da_cong_bo'. Nhánh 'da_thu_hoi' chỉ set
-- thu_hoi_luc, không kiểm vai trò nào.
--
-- Cộng với policy noi_dung_sua (0010) cho cả marketing UPDATE, và
-- thu_hoi_noi_dung() ở 0015 là security invoker không có câu kiểm quyền nào,
-- kết quả là: QUẢN LÝ VÀ MARKETING GỠ ĐƯỢC khỏi trang những dữ kiện mà chỉ
-- chủ nhà hàng mới đặt lên được — trong đó có form_dat_ban_dang_mo và
-- hotline.
--
-- Giao diện /noi-bo chỉ GIẤU nút, đúng thứ mà chú thích đầu 0015 tự hứa
-- không bao giờ làm: "Không có luật thứ hai để lệch với luật thứ nhất."
--
-- CÁCH SỬA
--
-- Đưa cùng khối kiểm quyền sang nhánh da_thu_hoi. Gỡ một dữ kiện xuống là
-- một hành vi có hệ quả ra bên ngoài y như đưa nó lên, nên nó phải qua cùng
-- một cửa.
--
-- Giữ nguyên toàn bộ phần còn lại của hàm — chép lại nguyên văn từ 0010 rồi
-- chỉ thêm một khối. Không đổi chữ trong bất kỳ câu raise exception cũ nào.
-- =============================================================================

create or replace function noi_dung_cong_bo_kiem_tra()
returns trigger
language plpgsql
as $$
declare
  v_khoa khoa_cong_bo;
begin
  select * into v_khoa from khoa_cong_bo where khoa = new.khoa;

  if tg_op = 'INSERT' then
    if new.trang_thai <> 'nhap' and co_phien_dang_nhap() then
      raise exception 'Dòng mới phải bắt đầu ở trạng thái nhap'
        using errcode = 'check_violation';
    end if;
    if new.trang_thai = 'da_cong_bo' then
      new.cong_bo_luc := coalesce(new.cong_bo_luc, now());
    end if;
    return new;
  end if;

  if old.trang_thai = 'da_cong_bo' then
    if new.khoa <> old.khoa
       or new.kieu <> old.kieu
       or new.gia_tri_text    is distinct from old.gia_tri_text
       or new.gia_tri_text_en is distinct from old.gia_tri_text_en
       or new.gia_tri_ngay    is distinct from old.gia_tri_ngay
       or new.gia_tri_so      is distinct from old.gia_tri_so
       or new.gia_tri_bool    is distinct from old.gia_tri_bool
       or new.gia_tri_tep_id  is distinct from old.gia_tri_tep_id then
      raise exception 'Không sửa được giá trị đã công bố. Hãy thu hồi rồi thêm dòng mới.'
        using errcode = 'restrict_violation';
    end if;
  end if;

  if new.trang_thai <> old.trang_thai then
    if not (
         (old.trang_thai = 'nhap'       and new.trang_thai = 'da_duyet')
      or (old.trang_thai = 'da_duyet'   and new.trang_thai = 'da_cong_bo')
      or (old.trang_thai = 'da_duyet'   and new.trang_thai = 'nhap')
      or (old.trang_thai = 'da_cong_bo' and new.trang_thai = 'da_thu_hoi')
    ) then
      raise exception 'Không chuyển được trạng thái từ % sang %', old.trang_thai, new.trang_thai
        using errcode = 'check_violation';
    end if;

    if new.trang_thai = 'da_cong_bo' then
      if co_phien_dang_nhap() then
        if v_khoa.chi_chu_so_huu then
          if not la_chu_so_huu() then
            raise exception 'Khóa % chỉ chủ sở hữu mới được công bố', new.khoa
              using errcode = 'insufficient_privilege';
          end if;
        elsif not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
          raise exception 'Không có quyền công bố nội dung'
            using errcode = 'insufficient_privilege';
        end if;
      end if;
      new.cong_bo_luc := coalesce(new.cong_bo_luc, now());
    end if;

    if new.trang_thai = 'da_duyet' then
      new.duyet_luc := coalesce(new.duyet_luc, now());
    end if;

    if new.trang_thai = 'da_thu_hoi' then
      -- MỤC 2 CỦA 0016. Gỡ một dữ kiện khỏi trang là hành vi có hệ quả ra bên
      -- ngoài y như đưa nó lên, nên nó qua cùng một cửa. Không có khối này thì
      -- marketing tắt được form đặt bàn và gỡ được hotline.
      if co_phien_dang_nhap() then
        if v_khoa.chi_chu_so_huu then
          if not la_chu_so_huu() then
            raise exception 'Khóa % chỉ chủ sở hữu mới được gỡ khỏi trang', new.khoa
              using errcode = 'insufficient_privilege';
          end if;
        elsif not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
          raise exception 'Không có quyền gỡ nội dung khỏi trang'
            using errcode = 'insufficient_privilege';
        end if;
      end if;
      new.thu_hoi_luc := coalesce(new.thu_hoi_luc, now());
    end if;
  end if;

  return new;
end;
$$;


-- =============================================================================
-- 3 · NHẬT KÝ HỒ SƠ — một bước chuyển, một dòng nhật ký
-- =============================================================================
-- LỖI
--
-- Trigger ho_so_kiem_tra_vong_doi() ở 0012 đã tự chèn một dòng nhat_ky_ho_so
-- mỗi khi trang_thai đổi. Giao diện /noi-bo/tuyen-dung chèn THÊM một dòng
-- nữa cho cùng bước chuyển, vì nó cần chỗ để lưu ghi chú của người xử lý.
--
-- Kết quả: hai dòng cho một việc. Và nhat_ky_ho_so là bảng BẤT BIẾN —
-- nhat_ky_ho_so_chan_sua_xoa() chặn cả UPDATE lẫn DELETE — nên dòng thừa
-- không bao giờ dọn được. Một vết kiểm toán nói sai về số lần xảy ra thì
-- tệ hơn không có vết.
--
-- CÁCH SỬA
--
-- Đưa ghi chú vào cùng câu UPDATE, để trigger đọc nó. Một chỗ ghi, một dòng.
-- Giao diện bỏ hẳn câu insert.
--
-- Cột giữ lại giá trị của bước chuyển gần nhất thay vì tự xóa: trigger là
-- AFTER UPDATE nên muốn xóa phải thêm một lượt ghi nữa, mà "ghi chú của lần
-- xử lý gần nhất" lại là thứ hữu ích để hiện lên màn hình.
-- =============================================================================

alter table ho_so_ung_tuyen
  add column if not exists ghi_chu_buoc text;

comment on column ho_so_ung_tuyen.ghi_chu_buoc is
  'Ghi chú của lần đổi trạng thái gần nhất. Đặt trong cùng câu UPDATE để trigger chép vào nhật ký — đừng chèn thẳng vào nhat_ky_ho_so.';

-- security definer là BẮT BUỘC kể từ khi policy INSERT bên dưới thành false.
-- Trigger thường chạy dưới quyền người gọi, nên nó sẽ bị chính policy đó chặn
-- và mọi lượt đổi trạng thái hồ sơ sẽ lỗi. Chạy dưới quyền chủ bảng là cách
-- nói "CHỈ đường này được ghi vào nhật ký".
--
-- Không mở thêm quyền cho ai: nhan_su_hien_tai() đọc auth.uid() từ JWT chứ
-- không đọc vai đang chạy, nên nhật ký vẫn ghi đúng tên người thật.
create or replace function ho_so_kiem_tra_vong_doi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into nhat_ky_ho_so (ho_so_id, tu_trang_thai, den_trang_thai, ghi_chu)
    values (new.id, null, new.trang_thai, 'Ứng viên nộp hồ sơ');
    return new;
  end if;

  if new.trang_thai = old.trang_thai then
    return new;
  end if;

  if not (
       (old.trang_thai = 'moi'           and new.trang_thai = 'dang_xem')
    or (old.trang_thai = 'dang_xem'      and new.trang_thai in ('hen_phong_van','tu_choi'))
    or (old.trang_thai = 'hen_phong_van' and new.trang_thai in ('da_phong_van','tu_choi'))
    or (old.trang_thai = 'da_phong_van'  and new.trang_thai in ('nhan_viec','tu_choi'))
    -- Ứng viên rút lui được ở bất cứ đâu, trừ khi đã ẩn danh.
    or (new.trang_thai = 'ung_vien_rut'  and old.trang_thai <> 'da_an_danh')
    -- Hết hạn lưu: mọi trạng thái đều đi tới ẩn danh được.
    or (new.trang_thai = 'da_an_danh')
  ) then
    raise exception 'Không chuyển được hồ sơ từ % sang %', old.trang_thai, new.trang_thai
      using errcode = 'check_violation';
  end if;

  insert into nhat_ky_ho_so (ho_so_id, tu_trang_thai, den_trang_thai, ghi_chu, nguoi_thuc_hien)
  values (new.id, old.trang_thai, new.trang_thai,
          nullif(btrim(new.ghi_chu_buoc), ''),      -- MỤC 3 CỦA 0016
          (nhan_su_hien_tai()).id);

  return new;
end;
$$;

-- Giao diện không còn lý do gì để chèn thẳng vào nhật ký. Đóng cửa đó lại —
-- policy cũ là `with check (true)`, tức ai đăng nhập cũng ghi được một dòng
-- kiểm toán tùy ý vào bất kỳ hồ sơ nào.
drop policy if exists nhat_ky_ho_so_them on nhat_ky_ho_so;
create policy nhat_ky_ho_so_them on nhat_ky_ho_so
  for insert with check (false);

comment on table nhat_ky_ho_so is
  'Vết kiểm toán bất biến. CHỈ trigger ho_so_kiem_tra_vong_doi() ghi vào đây — policy INSERT là false để không ai chèn tay được.';


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6
-- =============================================================================
-- THIẾU MỘT DÒNG — 0025 đã bổ sung. Danh sách dưới đây không cấp
-- ve_con_hieu_luc() cho anon, với lý do "policy chạy dưới quyền của chính
-- storage". Lý do đó sai, và ngược với chính mục 1 ở trên: policy chạy dưới
-- vai của request — với khóa anon là anon — nên anon phải có EXECUTE. Kiểm
-- tay trên Supabase thử: thiếu dòng đó thì mọi lượt tải CV lỗi
-- "permission denied for function ve_con_hieu_luc".
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
