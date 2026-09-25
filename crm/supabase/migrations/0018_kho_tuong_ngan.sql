-- =============================================================================
-- BEEFTOWN — 0018 · KHO · TƯỜNG NGĂN GIỮA CRM VÀ KHO
-- =============================================================================
-- Migration này KHÔNG thêm bảng kho nào. Nó làm hai việc phải xong TRƯỚC khi
-- có tài khoản vai kho đầu tiên:
--
--   1. Vai kho (thu_kho, nhan_vien_quay, ke_toan) KHÔNG được thấy hay ghi dữ
--      liệu CRM: khách hàng, đặt bàn, lượt ghé, sổ điểm, tin nhắn.
--   2. Dựng bộ hàm phân quyền riêng của kho — một nguồn sự thật duy nhất cho
--      câu hỏi "vai nào được làm việc gì trong kho".
--
-- VÌ SAO PHẢI CÓ TƯỜNG
--
-- 0001 định nghĩa duoc_truy_cap_chi_nhanh() = "chủ sở hữu, hoặc bất kỳ ai
-- cùng chi nhánh". Hồi đó chỉ có bốn vai, cả bốn đều là người của CRM, nên
-- "cùng chi nhánh" đồng nghĩa "được xem khách". Thêm vai kho mà không sửa gì
-- thì một nhân viên quầy thịt đọc được toàn bộ số điện thoại khách, và sửa
-- được đặt bàn (dat_ban_sua chỉ kiểm chi nhánh).
--
-- Tệ hơn, ba hàm SECURITY DEFINER của CRM — ghi_luot_ghe, tim_hoac_tao_khach,
-- xep_hang_gui_tin — không tự kiểm vai trò. Sửa RLS không chặn được chúng, vì
-- hàm definer đi xuyên RLS.
--
-- CÁCH SỬA, HAI LỚP
--
--   Lớp đọc : duoc_truy_cap_chi_nhanh() giờ chỉ trả true cho BỐN VAI CRM.
--             Cùng chữ ký, cùng thuộc tính, nên quyền đã cấp giữ nguyên và
--             hành vi của bốn vai cũ không đổi một dòng nào. Vai thêm sau này
--             mặc định bị loại — an toàn theo mặc định.
--   Lớp ghi : trigger chan_vai_ngoai_crm() trên sáu bảng CRM. Trigger chạy cả
--             khi lệnh ghi đến từ bên trong một hàm definer, nên nó chặn được
--             đúng chỗ mà RLS không chặn được.
--
-- Không chép lại thân ba hàm CRM để thêm dòng kiểm vai: chép lại là một cơ
-- hội sai lệch, và file này muốn chạm vào CRM ít nhất có thể.
--
-- GIỚI HẠN CỐ Ý: một tài khoản = một vai (nhan_su.vai_tro). Quản lý dùng được
-- cả CRM lẫn kho. Một thu ngân kiêm đếm kho thì cần hai tài khoản.
-- =============================================================================


-- =============================================================================
-- 1 · LỚP ĐỌC — duoc_truy_cap_chi_nhanh() chỉ còn cho vai CRM
-- =============================================================================
create or replace function duoc_truy_cap_chi_nhanh(muc_tieu uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from nhan_su
    where auth_uid = auth.uid()
      and dang_lam
      and (
        vai_tro = 'chu_so_huu'
        or (chi_nhanh_id = muc_tieu
            and vai_tro in ('quan_ly', 'thu_ngan', 'marketing'))
      )
  );
$$;

comment on function duoc_truy_cap_chi_nhanh is
  'Nhân sự CRM có được đụng vào dữ liệu CRM của chi nhánh này không. Chỉ bốn vai CRM — vai kho bị loại có chủ đích (0018). Kho dùng kho_cn_duoc().';


-- =============================================================================
-- 2 · LỚP GHI — chặn vai ngoài CRM ghi vào bảng CRM, kể cả qua hàm definer
-- =============================================================================
create or replace function la_nhan_su_ngoai_crm()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from nhan_su
    where auth_uid = auth.uid()
      and dang_lam
      and vai_tro not in ('chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing')
  );
$$;

comment on function la_nhan_su_ngoai_crm is
  'True khi người đang đăng nhập là nhân sự nhưng KHÔNG thuộc bốn vai CRM (ví dụ thủ kho). False với khách vãng lai, migration và service_role.';

-- Chỉ chặn đúng vai ngoài CRM. Khách vãng lai đặt bàn trên website chạy dưới
-- anon, auth.uid() là null, nên hàm trên trả false và trigger cho qua.
create or replace function chan_vai_ngoai_crm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if la_nhan_su_ngoai_crm() then
    raise exception 'Tài khoản kho không được ghi dữ liệu khách hàng, đặt bàn hay điểm tích lũy'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

comment on function chan_vai_ngoai_crm is
  'Trigger tường ngăn: vai kho không ghi được vào bảng CRM, kể cả qua ghi_luot_ghe() hay tim_hoac_tao_khach() — hai hàm definer mà RLS không chặn được.';

create trigger khach_hang_chan_vai_ngoai_crm
  before insert or update on khach_hang
  for each row execute function chan_vai_ngoai_crm();

create trigger luot_ghe_chan_vai_ngoai_crm
  before insert or update on luot_ghe
  for each row execute function chan_vai_ngoai_crm();

create trigger so_cai_diem_chan_vai_ngoai_crm
  before insert or update on so_cai_diem
  for each row execute function chan_vai_ngoai_crm();

create trigger dat_ban_chan_vai_ngoai_crm
  before insert or update on dat_ban
  for each row execute function chan_vai_ngoai_crm();

create trigger nhat_ky_tin_chan_vai_ngoai_crm
  before insert or update on nhat_ky_tin
  for each row execute function chan_vai_ngoai_crm();

create trigger nhat_ky_dong_y_chan_vai_ngoai_crm
  before insert or update on nhat_ky_dong_y
  for each row execute function chan_vai_ngoai_crm();


-- =============================================================================
-- 3 · PHÂN QUYỀN KHO — một bảng tra duy nhất
-- =============================================================================
-- Mỗi "việc" trong kho ứng với một danh sách vai. Policy, hàm RPC và giao
-- diện đều hỏi cùng một chỗ này. web/src/lib/kho/chung.ts có một bản soi gương
-- để ẩn nút cho gọn, và test-kho-quyen.mjs so hai bản với nhau từng dòng —
-- lệch một vai là test đỏ.
--
--   xem         tồn, lô, hạn dùng, biến động kho (không có cột tiền nào)
--   xem_gia     giá nhập, giá vốn, phiếu nhập, nhà cung cấp, phiên pha lóc,
--               công nợ, báo cáo có tiền
--   nhap        tạo / sửa / gửi / rút phiếu nhập
--   duyet       duyệt, từ chối, hủy phiếu nhập; duyệt hủy hàng; duyệt kiểm kê
--   pha_loc     lưu, chốt, mở lại phiên pha lóc
--   van_hanh    chuyển quầy, xuất bếp, đề nghị hủy, đếm kiểm kê
--   ke_toan     đối chiếu hóa đơn, thanh toán, trả hàng nhà cung cấp
--   danh_muc    mặt hàng, công thức pha lóc, vị trí, lý do, mã vạch
--   ncc         nhà cung cấp
--   cai_dat_goc định nghĩa ô thông tin thêm, cách tính giá vốn, nguồn số bán
--
-- Nhân viên quầy/bếp có "xem" nhưng không có "xem_gia": chủ nhà hàng đã chốt
-- rằng họ không thấy giá nhập và giá vốn thịt.
-- =============================================================================
create or replace function kho_vai_duoc(p_viec text)
returns vai_tro[]
language sql
immutable
set search_path = public
as $$
  select (case p_viec
    when 'xem'         then array['chu_so_huu','quan_ly','thu_kho','nhan_vien_quay','ke_toan']
    when 'xem_gia'     then array['chu_so_huu','quan_ly','thu_kho','ke_toan']
    when 'nhap'        then array['chu_so_huu','quan_ly','thu_kho']
    when 'duyet'       then array['chu_so_huu','quan_ly']
    when 'pha_loc'     then array['chu_so_huu','quan_ly','thu_kho']
    when 'van_hanh'    then array['chu_so_huu','quan_ly','thu_kho','nhan_vien_quay']
    when 'ke_toan'     then array['chu_so_huu','quan_ly','ke_toan']
    when 'danh_muc'    then array['chu_so_huu','quan_ly']
    when 'ncc'         then array['chu_so_huu','quan_ly','ke_toan']
    when 'cai_dat_goc' then array['chu_so_huu']
    else array[]::text[]
  end)::vai_tro[];
$$;

comment on function kho_vai_duoc is
  'Bảng tra quyền kho: việc → danh sách vai. Nguồn sự thật duy nhất; lib/kho/chung.ts soi gương và test-kho-quyen.mjs so khớp.';

-- Người đang đăng nhập có được làm việc này không (không xét chi nhánh).
-- Dùng cho bảng dùng chung toàn thương hiệu như danh mục mặt hàng.
create or replace function kho_co_quyen(p_viec text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from nhan_su
    where auth_uid = auth.uid()
      and dang_lam
      and vai_tro = any(kho_vai_duoc(p_viec))
  );
$$;

comment on function kho_co_quyen is
  'Người đang đăng nhập có vai được làm việc p_viec trong kho không. Không xét chi nhánh — dùng cho danh mục toàn thương hiệu.';

-- Danh sách chi nhánh mà người đang đăng nhập được làm việc này. Chủ sở hữu:
-- mọi chi nhánh. Vai khác: đúng chi nhánh của mình. Không có quyền: mảng rỗng.
--
-- Trả MẢNG chứ không trả boolean theo từng dòng, để policy viết được
--     chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[])
-- — dấu ngoặc select làm Postgres tính hàm MỘT lần cho cả câu truy vấn thay
-- vì một lần cho mỗi dòng. Phép ép ::uuid[] KHÔNG thừa: thiếu nó thì
-- `any ((select ...))` bị hiểu là "so với từng DÒNG của truy vấn con", tức so
-- uuid với uuid[], và Postgres báo "operator does not exist: uuid = uuid[]".
create or replace function kho_cn_duoc(p_viec text)
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case
             when ns.vai_tro = 'chu_so_huu'
               then (select coalesce(array_agg(cn.id), '{}'::uuid[]) from chi_nhanh cn)
             else array[ns.chi_nhanh_id]
           end
    from nhan_su ns
    where ns.auth_uid = auth.uid()
      and ns.dang_lam
      and ns.vai_tro = any(kho_vai_duoc(p_viec))
    limit 1
  ), '{}'::uuid[]);
$$;

comment on function kho_cn_duoc is
  'Các chi nhánh người đang đăng nhập được làm việc p_viec trong kho. Chủ sở hữu: tất cả. Dùng trong policy dạng chi_nhanh_id = any((select kho_cn_duoc(...))::uuid[]).';

create or replace function kho_duoc(p_chi_nhanh_id uuid, p_viec text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_chi_nhanh_id is not null
     and p_chi_nhanh_id = any(kho_cn_duoc(p_viec));
$$;

comment on function kho_duoc is
  'Người đang đăng nhập có được làm việc p_viec trong kho của chi nhánh này không. Mọi hàm RPC kho gọi hàm này đầu tiên.';


-- =============================================================================
-- 4 · HAI CHỖ ĐỌC MÀ VAI KHO CẦN SAU KHI BỊ NGĂN
-- =============================================================================
-- Lớp đọc ở mục 1 cũng chặn vai kho đọc bảng chi_nhanh (chi_nhanh_doc dùng
-- duoc_truy_cap_chi_nhanh). Trang kho cần tên chi nhánh, nên mở lại đúng
-- chi nhánh của họ. Bảng chi_nhanh không chứa dữ liệu cá nhân.
create policy chi_nhanh_doc_kho on chi_nhanh
  for select using (id = any ((select kho_cn_duoc('xem'))::uuid[]));

-- Chứng từ kho ghi "ai lập, ai duyệt" bằng id nhân sự. Vai kho không đọc được
-- bảng nhan_su của người khác (và không nên: bảng đó có email). Hàm này chỉ
-- trả họ tên, chỉ của người cùng chi nhánh hoặc chủ sở hữu.
create or replace function kho_ten_nhan_su(p_ids uuid[])
returns table (id uuid, ho_ten text)
language sql
stable
security definer
set search_path = public
as $$
  select ns.id, ns.ho_ten
  from nhan_su ns
  where kho_co_quyen('xem')
    and ns.id = any(p_ids)
    and (ns.chi_nhanh_id is null
         or ns.chi_nhanh_id = any(kho_cn_duoc('xem')));
$$;

comment on function kho_ten_nhan_su is
  'Họ tên người lập/duyệt chứng từ kho. Chỉ trả họ tên, chỉ người cùng chi nhánh hoặc chủ sở hữu — không mở đường đọc email hay vai trò.';


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6
-- =============================================================================
-- Không hàm kho nào được cấp cho anon. Danh sách dưới đây chép NGUYÊN VĂN từ
-- 0016; test-an-toan.mjs canh nó.
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
