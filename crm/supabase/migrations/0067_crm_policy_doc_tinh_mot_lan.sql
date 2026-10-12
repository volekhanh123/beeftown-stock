-- =============================================================================
-- BEEFTOWN CRM — 0067 · POLICY ĐỌC CHỈ CHO NHÂN SỰ CRM ĐANG LÀM ·
--                       HÀM PHÂN QUYỀN TÍNH MỘT LẦN CHO CẢ CÂU TRUY VẤN
-- =============================================================================
-- Rà soát nợ kỹ thuật 11/10/2026, hai việc trên cùng một bộ policy:
--
-- 1 · ĐỌC CHỈ KIỂM "CÓ ĐĂNG NHẬP". Tám policy đọc — khoa_cong_bo, khung_anh,
--     tep_anh (0009, 0010), noi_dung_cong_bo (0010), nhom_mon, mon_an,
--     phien_ban_thuc_don (0011): `co_phien_dang_nhap()`; mau_tin (0007):
--     `auth.uid() is not null`. Nên nhân sự ĐÃ NGHỈ, tài khoản Supabase Auth
--     không có dòng nhan_su, thủ kho / NV quầy / kế toán, tài khoản máy (Zalo,
--     iPOS, Messenger…) đọc được nội dung chưa công bố, giá đề xuất của món, mẫu
--     tin Zalo. Kho file beeftown-noi-bo (0014, policy noi_bo_nhan_su_xem) cũng
--     vậy. Giờ: bốn vai CRM đang làm — đúng những vai mở các trang dùng chúng
--     (Tổng quan /noi-bo là VAI_CRM, có thu ngân, đọc v_cong_bo_con_thieu,
--     v_anh_con_thieu, v_mon_con_vuong; bỏ thu ngân thì dòng việc "còn thiếu"
--     của thu ngân thành xanh giả).
--
-- 2 · HÀM PHÂN QUYỀN CHẠY MỖI DÒNG. duoc_truy_cap_chi_nhanh(chi_nhanh_id),
--     co_vai_tro(...), la_chu_so_huu() là hàm SQL security definer — Postgres
--     không inline được, nên policy gọi chúng MỘT LẦN CHO MỖI DÒNG. Đo trên
--     PGlite, 5.000 khách: quản lý đếm khach_hang 339–456 ms (superuser 2–3 ms),
--     v_phan_nhom_khach 756–1.243 ms. Kho (0018) đã viết đúng kiểu từ đầu:
--       · hàm KHÔNG phụ thuộc dòng bọc trong (select …) → InitPlan, tính một lần;
--       · điều kiện chi nhánh thành `chi_nhanh_id = any((select crm_cn_duoc())::uuid[])`
--         — crm_cn_duoc() trả MẢNG chi nhánh người gọi được vào (như kho_cn_duoc),
--         tính một lần. Phép ép ::uuid[] không thừa: xem chú thích kho_cn_duoc (0018).
--     Sau 0067 (cùng máy, cùng dữ liệu): quản lý đếm khach_hang 339 → 10 ms, chủ
--     134 → 6 ms; v_phan_nhom_khach 756 → 32 ms; luot_ghe 134 → 4 ms. Cùng số dòng.
--
-- NGHĨA KHÔNG ĐỔI (trừ tám policy của mục 1). crm_cn_duoc() chép điều kiện của
-- duoc_truy_cap_chi_nhanh() (0018): chủ sở hữu đang làm → mọi chi nhánh; quản
-- lý / thu ngân / marketing đang làm → chi nhánh của mình; còn lại → rỗng.
-- Cột chi_nhanh_id của mọi bảng dùng nó đều NOT NULL (khóa ngoại tới
-- chi_nhanh), trừ nhan_su — policy đó vẫn có la_chu_so_huu() đứng trước.
-- test-quyen-doc-crm.mjs mục 2 so biểu thức cũ (chép nguyên văn pg_policies
-- trước 0067) với biểu thức mới trên từng dòng của từng bảng, với 13 kiểu
-- người. alter policy giữ tên, lệnh (select / all / …), vai áp dụng.
--
-- Mục 3 của test là cổng: không policy nào ở public gọi hàm phân quyền không
-- bọc (select …), không policy nào gọi duoc_truy_cap_chi_nhanh() / kho_duoc().
--
-- STORAGE (PGlite không có schema storage — khối cuối tự bỏ qua). Thử tay trên
-- Beeftown-thu sau khi chạy: đăng nhập thủ kho → tải một đường dẫn ký sẵn của
-- file trong beeftown-noi-bo (hoặc gọi storage.from('beeftown-noi-bo').list())
-- → 400/không thấy file; đăng nhập thu ngân → thấy như cũ.
--
-- Kiểm thử: crm/test/test-quyen-doc-crm.mjs.
-- =============================================================================


-- =============================================================================
-- 1 · crm_cn_duoc() — các chi nhánh CRM người đang đăng nhập được vào, MỘT mảng
-- =============================================================================
create or replace function crm_cn_duoc()
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
      and ns.vai_tro in ('chu_so_huu', 'quan_ly', 'thu_ngan', 'marketing')
    limit 1
  ), '{}'::uuid[]);
$$;

comment on function crm_cn_duoc is
  'Các chi nhánh mà nhân sự CRM đang đăng nhập được vào (0067) — đúng tập duoc_truy_cap_chi_nhanh() trả lời "có": chủ sở hữu mọi chi nhánh, quản lý / thu ngân / marketing chi nhánh của mình, còn lại rỗng. Dùng trong policy dạng chi_nhanh_id = any((select crm_cn_duoc())::uuid[]) — tính một lần cho cả câu truy vấn.';


-- =============================================================================
-- 2 · Policy theo chi nhánh (0007, 0012, 0013) — mảng tính một lần
-- =============================================================================
alter policy chi_nhanh_doc on chi_nhanh
  using (id = any ((select crm_cn_duoc())::uuid[]));
alter policy chi_nhanh_sua on chi_nhanh
  using ((select la_chu_so_huu())) with check ((select la_chu_so_huu()));

alter policy nhan_su_doc on nhan_su
  using ((select la_chu_so_huu())
         or auth_uid = (select auth.uid())
         or chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]));
alter policy nhan_su_sua on nhan_su
  using ((select la_chu_so_huu())) with check ((select la_chu_so_huu()));

alter policy khach_hang_doc on khach_hang
  using ((select la_chu_so_huu())
         or exists (select 1 from luot_ghe lg
                    where lg.khach_hang_id = khach_hang.id
                      and lg.chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]))
         or exists (select 1 from dat_ban db
                    where db.khach_hang_id = khach_hang.id
                      and db.chi_nhanh_id = any ((select crm_cn_duoc())::uuid[])));

alter policy dong_y_doc on nhat_ky_dong_y
  using ((select la_chu_so_huu())
         or exists (select 1 from khach_hang kh where kh.id = nhat_ky_dong_y.khach_hang_id));

alter policy luot_ghe_doc on luot_ghe
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]));

alter policy cau_hinh_doc on cau_hinh_tich_diem
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]));
alter policy cau_hinh_sua on cau_hinh_tich_diem
  using ((select la_chu_so_huu())) with check ((select la_chu_so_huu()));

alter policy so_cai_doc on so_cai_diem
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]));

alter policy ban_an_doc on ban_an
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]));
alter policy ban_an_sua on ban_an
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[])
         and (select co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[])));

alter policy dat_ban_doc on dat_ban
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]));
alter policy dat_ban_them on dat_ban
  with check (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]));
alter policy dat_ban_sua on dat_ban
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]));

alter policy mau_tin_sua on mau_tin
  using ((select la_chu_so_huu())) with check ((select la_chu_so_huu()));

alter policy chien_dich_doc on chien_dich
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]));
alter policy chien_dich_sua on chien_dich
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[])
         and (select co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])));

alter policy nhat_ky_tin_doc on nhat_ky_tin
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]));

alter policy ho_so_doc on ho_so_ung_tuyen
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[])
         and (select co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[])));
alter policy ho_so_sua on ho_so_ung_tuyen
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[])
         and (select co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[])));

alter policy vi_tri_doc on vi_tri_tuyen_dung
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[]));
alter policy vi_tri_sua on vi_tri_tuyen_dung
  using (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[])
         and (select co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])));
alter policy vi_tri_them on vi_tri_tuyen_dung
  with check (chi_nhanh_id = any ((select crm_cn_duoc())::uuid[])
              and (select co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])));

alter policy phieu_tai_len_doc on phieu_tai_len
  using ((select co_vai_tro(array['chu_so_huu']::vai_tro[])));
alter policy su_kien_web_doc on su_kien_web
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])));
alter policy nhat_ky_tra_cuu_doc on nhat_ky_tra_cuu
  using ((select co_vai_tro(array['chu_so_huu']::vai_tro[])));
alter policy zalo_cau_hinh_doc on zalo_cau_hinh
  using ((select la_chu_so_huu()));


-- =============================================================================
-- 3 · Nội dung, ảnh, thực đơn, mẫu tin (0007, 0009–0011) — ĐỌC: bốn vai CRM
--     đang làm (trước: chỉ cần đăng nhập); GHI: như cũ, tính một lần
-- =============================================================================
alter policy mau_tin_doc on mau_tin
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan','marketing']::vai_tro[])));

alter policy khung_anh_doc on khung_anh
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan','marketing']::vai_tro[])));
alter policy khung_anh_sua on khung_anh
  using ((select la_chu_so_huu())) with check ((select la_chu_so_huu()));

alter policy tep_anh_doc on tep_anh
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan','marketing']::vai_tro[])));
alter policy tep_anh_them on tep_anh
  with check ((select co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])));
alter policy tep_anh_sua on tep_anh
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])));

alter policy khoa_cong_bo_doc on khoa_cong_bo
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan','marketing']::vai_tro[])));
alter policy khoa_cong_bo_sua on khoa_cong_bo
  using ((select la_chu_so_huu())) with check ((select la_chu_so_huu()));

alter policy noi_dung_doc on noi_dung_cong_bo
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan','marketing']::vai_tro[])));
alter policy noi_dung_them on noi_dung_cong_bo
  with check ((select co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[]))
              and trang_thai = 'nhap');
alter policy noi_dung_sua on noi_dung_cong_bo
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])));
alter policy noi_dung_xoa on noi_dung_cong_bo
  using (trang_thai = 'nhap'
         and (select co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])));

alter policy nhom_mon_doc on nhom_mon
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan','marketing']::vai_tro[])));
alter policy nhom_mon_sua on nhom_mon
  using ((select co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[])))
  with check ((select co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[])));

alter policy mon_an_doc on mon_an
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan','marketing']::vai_tro[])));
alter policy mon_an_them on mon_an
  with check ((select co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])));
alter policy mon_an_sua on mon_an
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])));

alter policy phien_ban_doc on phien_ban_thuc_don
  using ((select co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan','marketing']::vai_tro[])));
alter policy phien_ban_sua on phien_ban_thuc_don
  using ((select co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[])))
  with check ((select co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[])));


-- =============================================================================
-- 4 · STORAGE — kho file beeftown-noi-bo: bốn vai CRM đang làm (0014: mọi phiên)
-- =============================================================================
-- PGlite không có schema storage: bỏ qua, như 0014. Drop + create đúng như cách
-- 0014 tạo (cùng tên, cùng "to authenticated").
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'storage') then
    raise notice 'Không có schema storage (đang chạy PGlite) — bỏ qua phần storage của 0067.';
    return;
  end if;

  execute 'drop policy if exists "noi_bo_nhan_su_xem" on storage.objects';
  execute $sql$
    create policy "noi_bo_nhan_su_xem" on storage.objects
      for select to authenticated
      using (bucket_id = 'beeftown-noi-bo'
             and (select public.co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan','marketing']::public.vai_tro[])))
  $sql$;
end
$$;


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6. Giữ dòng ve_con_hieu_luc: xem 0025.
-- crm_cn_duoc() mới: authenticated GIỮ quyền gọi (policy chạy dưới vai người
-- đọc); anon và PUBLIC thu ở đây như mọi hàm.
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
