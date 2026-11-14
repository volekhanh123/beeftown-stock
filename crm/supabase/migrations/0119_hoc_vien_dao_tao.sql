-- =============================================================================
-- 0119 · VIDEO ĐÀO TẠO · TÀI KHOẢN HỌC VIÊN CHỈ XEM VIDEO (Khánh 14/11/2026)
-- =============================================================================
-- PHẢI CHẠY SAU 0118 (một mình — vai hoc_vien), 0117 (bảng video_dao_tao, policy video_dao_tao_doc), 0034 (bốn hàm
-- nhân viên của chủ — bản cuối, chép nguyên văn rồi vá).
--
-- Khánh 14/11/2026: "1 tài khoản demo về việc training và chỉ mở cho việc training thôi" — một tài khoản dùng chung
-- cho cả lớp trong buổi đào tạo. Trước file này không vai nào làm được: bảy vai người đọc được video_dao_tao, nhưng vai
-- nào trong bảy cũng mở thêm màn CRM hay kho.
--
-- AI LÀM GÌ
--   hoc_vien: ĐỌC video_dao_tao — không thêm, không sửa, không xóa (ba policy ghi vẫn chỉ chủ, quản lý). Ngoài ra chỉ
--             đọc được dòng nhan_su của chính nó (policy nhan_su_doc, 0007 / 0070 — không đổi). Không bảng CRM nào
--             (crm_cn_duoc, duoc_truy_cap_chi_nhanh: bốn vai CRM), không bảng kho nào (kho_vai_duoc không có vai
--             này), không RPC kho nào (mọi hàm kho kiểm kho_duoc / kho_co_quyen). Khóa tài khoản (dang_lam = false)
--             là đọc 0 dòng ngay: co_vai_tro() chỉ tính nhân sự đang làm.
--   chủ:      tạo, khóa, mở lại tài khoản học viên ở Kho › Cài đặt › Nhân viên, như tài khoản kho và tài khoản máy —
--             bốn hàm của 0034 nhận thêm vai hoc_vien. Câu báo của bốn hàm giữ nguyên từng chữ (kiểm thử và bản
--             tiếng Anh ở web/src/lib/kho/cau-kho-en.ts khớp theo chữ).
--
-- Web (middleware.ts) đưa mọi trang /noi-bo khác về /noi-bo/dao-tao cho vai này — đó là để học viên không lạc vào trang
-- toàn ô trống. Lớp chặn thật vẫn là RLS ở đây: học viên có mật khẩu chung và khóa anon (công khai) thì gọi thẳng
-- được Supabase, nhưng cũng chỉ đọc được đúng những dòng trên.
--
-- Một câu delete nằm trong THÂN kho_khoa_nhan_su (chép nguyên văn từ 0034: gỡ tài khoản bị khóa khỏi máy dùng chung) —
-- chỉ chạy khi chủ bấm Khóa, không chạy lúc chạy migration. Không thêm giá trị enum (0118 đã thêm). Không bảng mới.
-- Chỉ chạy lên production SAU khi PR được gộp, bằng SQL Editor (0118 trước và một mình), rồi `npm run doi-chieu`
-- phải báo KHỚP. Chạy migration trước, deploy web sau: web cũ không có vai học viên trong danh sách tạo tài khoản, và
-- chưa ai có tài khoản vai này.
--
-- File này:
--   1 · Policy video_dao_tao_doc — thêm hoc_vien.
--   2 · kho_them_nhan_su, kho_khoa_nhan_su, kho_mo_nhan_su, kho_ds_nhan_su_kho — thêm hoc_vien.
--   3 · Thu quyền — đúng bốn hàm của file này.
-- =============================================================================


-- =============================================================================
-- 1 · AI ĐỌC ĐƯỢC VIDEO ĐÀO TẠO — bảy vai người (0117) và học viên
-- =============================================================================
-- Hàm phân quyền bọc trong (select …): Postgres tính một lần cho cả câu (0070, test-quyen-doc-crm.mjs mục 3).
alter policy video_dao_tao_doc on video_dao_tao
  using ((select co_vai_tro(array['chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing',
                                  'thu_kho', 'nhan_vien_quay', 'ke_toan', 'hoc_vien']::vai_tro[])));

comment on table video_dao_tao is
  'Video training nội bộ (0117): YouTube chế độ Không công khai, nhúng ở /noi-bo/dao-tao. Bảy vai người đang làm và học viên (0119) xem; chủ, quản lý sửa tên / mô tả, xóa; video mới thêm thẳng vào bảng (web/README.md, mục Video đào tạo).';


-- =============================================================================
-- 2 · CHỦ TẠO, KHÓA, MỞ LẠI TÀI KHOẢN HỌC VIÊN — bản cuối ở 0034, chỉ thêm vai hoc_vien
-- =============================================================================
-- Vai chủ được tạo ở đây: ba vai kho, hai vai máy và học viên (0119). KHÔNG tạo vai CRM (chủ, quản lý, thu ngân,
-- marketing) — những vai đó thấy dữ liệu khách hàng, thêm người như vậy phải là việc có chủ ý ở màn nhân sự CRM.
create or replace function kho_them_nhan_su(p_auth_uid uuid, p_ho_ten text, p_vai_tro vai_tro, p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ten   text := nullif(btrim(left(p_ho_ten, 100)), '');
  v_email text;
  v_id    uuid;
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ nhà hàng mới tạo được tài khoản' using errcode = 'insufficient_privilege';
  end if;
  -- 0119 · thêm hoc_vien (tài khoản chỉ xem video đào tạo). Câu báo giữ nguyên chữ: màn Nhân viên chỉ đưa ra đúng
  -- các vai trong danh sách này, nên câu chỉ hiện khi ai đó gọi thẳng hàm với vai CRM.
  if p_vai_tro is null or p_vai_tro not in ('thu_kho', 'nhan_vien_quay', 'ke_toan', 'may_chung', 'may_ipos', 'hoc_vien') then
    raise exception 'Ở đây chỉ tạo được tài khoản kho (thủ kho, NV quầy/bếp, kế toán) hoặc tài khoản máy'
      using errcode = 'check_violation';
  end if;
  if v_ten is null then
    raise exception 'Cần họ tên' using errcode = 'check_violation';
  end if;
  if p_chi_nhanh_id is null or not exists (select 1 from chi_nhanh where id = p_chi_nhanh_id) then
    raise exception 'Chọn chi nhánh' using errcode = 'check_violation';
  end if;
  select u.email into v_email from auth.users u where u.id = p_auth_uid;
  if not found then
    raise exception 'Không tìm thấy tài khoản đăng nhập vừa tạo' using errcode = 'check_violation';
  end if;
  if exists (select 1 from nhan_su where auth_uid = p_auth_uid) then
    raise exception 'Tài khoản đăng nhập này đã gắn với một nhân sự khác' using errcode = 'unique_violation';
  end if;

  insert into nhan_su (auth_uid, chi_nhanh_id, ho_ten, email, vai_tro, dang_lam)
  values (p_auth_uid, p_chi_nhanh_id, v_ten, v_email, p_vai_tro, true)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'ho_ten', v_ten, 'email', v_email,
                            'vai_tro', p_vai_tro, 'chi_nhanh_id', p_chi_nhanh_id);
end;
$$;

comment on function kho_them_nhan_su is
  'Chủ: nối một tài khoản Supabase Auth vừa đăng ký với dòng nhan_su mới. Chỉ vai thu_kho|nhan_vien_quay|ke_toan|may_chung|may_ipos|hoc_vien (0119); uid phải có trong auth.users và chưa gắn nhân sự nào.';

-- Nhân sự chủ quản lý ở màn "Nhân viên kho": vai kho, quản lý, hai vai máy, học viên (0119).
create or replace function kho_khoa_nhan_su(p_nhan_su_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ns nhan_su;
  v_go int;
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ nhà hàng mới khóa được tài khoản' using errcode = 'insufficient_privilege';
  end if;
  select * into v_ns from nhan_su where id = p_nhan_su_id for update;
  -- 0119 · thêm hoc_vien: hết buổi đào tạo chủ khóa tài khoản dùng chung ngay trên màn Nhân viên.
  if not found or v_ns.vai_tro not in ('quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan', 'may_chung', 'may_ipos', 'hoc_vien') then
    raise exception 'Không tìm thấy nhân viên kho này' using errcode = 'check_violation';
  end if;
  if v_ns.auth_uid = auth.uid() then
    raise exception 'Không tự khóa tài khoản của mình được' using errcode = 'check_violation';
  end if;
  update nhan_su set dang_lam = false where id = v_ns.id;
  -- Gỡ khỏi mọi máy dùng chung: mở lại tài khoản thì phải gắn lại, token cũ
  -- còn cất trên máy không dùng được nữa.
  delete from kho_may_nguoi where nhan_su_id = v_ns.id;
  get diagnostics v_go = row_count;
  update kho_may set nguoi_dang_dung = null, dung_tu = null where nguoi_dang_dung = v_ns.id;
  return jsonb_build_object('id', v_ns.id, 'dang_lam', false, 'so_may_go', v_go);
end;
$$;

comment on function kho_khoa_nhan_su is
  'Chủ: khóa tài khoản (dang_lam = false) một nhân viên kho / quản lý / máy / học viên (0119); không tự khóa mình. Gỡ khỏi mọi máy dùng chung.';

create or replace function kho_mo_nhan_su(p_nhan_su_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ns nhan_su;
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ nhà hàng mới mở lại được tài khoản' using errcode = 'insufficient_privilege';
  end if;
  select * into v_ns from nhan_su where id = p_nhan_su_id for update;
  -- 0119 · thêm hoc_vien: mở lại tài khoản học viên cho buổi đào tạo sau.
  if not found or v_ns.vai_tro not in ('quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan', 'may_chung', 'may_ipos', 'hoc_vien') then
    raise exception 'Không tìm thấy nhân viên kho này' using errcode = 'check_violation';
  end if;
  if v_ns.auth_uid = auth.uid() then
    raise exception 'Không tự mở tài khoản của mình được' using errcode = 'check_violation';
  end if;
  update nhan_su set dang_lam = true where id = v_ns.id;
  return jsonb_build_object('id', v_ns.id, 'dang_lam', true);
end;
$$;

comment on function kho_mo_nhan_su is 'Chủ: mở lại tài khoản đã khóa (dang_lam = true).';

create or replace function kho_ds_nhan_su_kho(p_chi_nhanh_id uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ nhà hàng mới xem được danh sách này' using errcode = 'insufficient_privilege';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', ns.id, 'ho_ten', ns.ho_ten, 'email', ns.email, 'vai_tro', ns.vai_tro,
      'chi_nhanh_id', ns.chi_nhanh_id, 'ten_chi_nhanh', cn.ten, 'dang_lam', ns.dang_lam,
      'created_at', ns.created_at,
      'so_may', (select count(*)::int from kho_may_nguoi mn where mn.nhan_su_id = ns.id))
      order by cn.ten, ns.dang_lam desc, ns.vai_tro, ns.ho_ten)
    from nhan_su ns
    left join chi_nhanh cn on cn.id = ns.chi_nhanh_id
    -- 0119 · thêm hoc_vien: chủ thấy tài khoản học viên để khóa / mở lại.
    where ns.vai_tro in ('quan_ly', 'thu_kho', 'nhan_vien_quay', 'ke_toan', 'may_chung', 'may_ipos', 'hoc_vien')
      and (p_chi_nhanh_id is null or ns.chi_nhanh_id = p_chi_nhanh_id)), '[]'::jsonb);
end;
$$;

comment on function kho_ds_nhan_su_kho is
  'Chủ: danh sách quản lý, nhân viên kho, tài khoản máy và học viên (0119) — mọi chi nhánh, hoặc một chi nhánh.';


-- =============================================================================
-- 3 · THU QUYỀN — đúng bốn hàm của file này (0008 mục 6)
-- =============================================================================
-- create or replace giữ quyền cũ của hàm; viết lại cho chắc, như 0112. authenticated gọi được (mỗi hàm tự kiểm chủ
-- ở dòng đầu), anon và PUBLIC thì không.
do $$
begin
  execute 'revoke execute on function kho_them_nhan_su(uuid, text, vai_tro, uuid) from public';
  execute 'revoke execute on function kho_khoa_nhan_su(uuid) from public';
  execute 'revoke execute on function kho_mo_nhan_su(uuid) from public';
  execute 'revoke execute on function kho_ds_nhan_su_kho(uuid) from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function kho_them_nhan_su(uuid, text, vai_tro, uuid) from anon';
    execute 'revoke execute on function kho_khoa_nhan_su(uuid) from anon';
    execute 'revoke execute on function kho_mo_nhan_su(uuid) from anon';
    execute 'revoke execute on function kho_ds_nhan_su_kho(uuid) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function kho_them_nhan_su(uuid, text, vai_tro, uuid) to authenticated';
    execute 'grant execute on function kho_khoa_nhan_su(uuid) to authenticated';
    execute 'grant execute on function kho_mo_nhan_su(uuid) to authenticated';
    execute 'grant execute on function kho_ds_nhan_su_kho(uuid) to authenticated';
  end if;
end
$$;
