-- =============================================================================
-- BEEFTOWN — 0101 · MUA THỊT VỀ — MENU BÁN LẺ CHO TRANG CÔNG KHAI
-- =============================================================================
-- PHẢI CHẠY SAU 0099 (ban_le_san_pham, ban_le_goi, ban_le_san_pham_json, khối CHỐT QUYỀN mới nhất),
-- 0036 (noi_dung_cong_khai bản mới nhất, chon_ngon_ngu, bam_nguon), 0010 (khoa_cong_bo, noi_dung_cong_bo,
-- cong_tac_bat), 0008 (la_van_ban_tam). 0101 là file cuối định nghĩa noi_dung_cong_khai.
--
-- Trang /mua-thit-ve (/en/buy-meat, /ko/buy-meat): khách chọn gói thịt bò và hộp kim chi, web soạn tin đơn
-- tiếng Việt để khách gửi qua Zalo OA (luồng TẠM của PR 2 — sau này đổi sang deep link Mini App, chỉ sửa
-- web/src/lib/dich-dat-hang.ts). Website không ghi gì vào database: hàm anon mới chỉ đọc.
--
-- Luật giá (Khánh chốt 26/10/2026): trang hiện giá của gói trong ảnh chụp gia_chot — giá chủ đã chốt ở
-- /noi-bo/ban-le. Giá mỗi kg ở Kho hay giá riêng của gói đổi sau lần chốt thì trang VẪN giữ giá đã chốt cho tới
-- khi chủ chốt lại; quán báo tổng tiền (theo FABi) khi xác nhận đơn. Chưa chốt lần nào: ẩn sản phẩm. Gói không có
-- trong ảnh chụp (thêm sau lần chốt): ẩn gói. Kim chi: giá chốt của hộp.
--
--   Trường hợp                                                    Trang khách
--   Chưa chốt giá lần nào (gia_chot null)                         ẩn sản phẩm
--   Đã chốt, chưa đổi gì                                          hiện, gia = giá chốt (= giá hiện tại)
--   Giá mỗi kg ở Kho đổi sau khi chốt                             hiện, gia = giá chốt cũ cho tới khi chủ chốt lại
--   Giá riêng của gói / hộp đổi sau khi chốt                      như trên
--   Giá mỗi kg của mặt hàng bị xóa sau khi chốt                   vẫn giá chốt (/noi-bo/ban-le cảnh báo chủ)
--   Chủ chốt lại                                                  giá mới
--   Gói thêm sau lần chốt (so_gam vắng trong gia_chot -> 'goi')   ẩn gói đó, gói khác vẫn hiện
--   Gói ngưng bán / sản phẩm Tạm ngưng / bỏ kênh website          ẩn
--   Phần thịt chưa gắn, đã mất hoặc ngừng dùng mặt hàng kho       ẩn sản phẩm
--   Gói đóng sẵn / hộp có mặt hàng riêng đã mất / ngừng dùng      ẩn gói đó
--   Hộp kim chi đã chốt                                           hiện, don_vi = 'hop', giá chốt của hộp
--   Tên còn ngoặc vuông                                           ẩn sản phẩm (mô tả / cách dùng → null)
--   Công tắc tắt, hoặc chưa có link Zalo OA hợp lệ                không dòng nào
-- Giới hạn còn lại: database không đọc được giá FABi (0099, ban_le_doi_chieu) — nhân viên trực OA tính lại
-- tổng tiền theo FABi lúc xác nhận là lớp chặn cuối.
--
-- Không có câu delete. Chỉ chạy lên production SAU khi PR được gộp, bằng SQL Editor hoặc psql (không dùng
-- apply_migration của Supabase MCP), rồi `npm run doi-chieu` phải báo KHỚP. Chạy migration trước, deploy web sau.
-- File này:
--   1 · la_link_zalo_oa; zalo_oa_url thành khóa chỉ chủ; trigger zalo_oa_url_kiem_tra.
--   2 · Mười khóa công bố nhóm mua_thit.
--   3 · chu_dich_con_hieu_luc — chọn chữ theo ngôn ngữ, bỏ bản dịch của câu gốc cũ.
--   4 · mua_thit_ve_kenh_mo; mua_thit_ve_cong_khai — hàm anon duy nhất của file.
--   5 · noi_dung_cong_khai: hien_mua_thit_ve trả về là công tắc HIỆU LỰC.
--   6 · Chú thích của từng hàm.
--   7 · Khối chốt quyền (chép 0099, thêm một dòng grant); thu quyền authenticated của hai hàm nội bộ mới.
-- =============================================================================


-- =============================================================================
-- 1 · LINK ZALO OA: CHỈ CHỦ, CHỈ https://zalo.me/<mã>
-- =============================================================================
-- zalo_oa_url là đích của mọi đơn mua thịt về (và nơi khách nhận mã QR chuyển khoản): ai đổi được link này là
-- đổi được nơi khách gửi đơn và chuyển tiền. Từ 0101 chỉ chủ công bố hay gỡ (cờ chi_chu_so_huu chặn cả hai,
-- trigger noi_dung_cong_bo_kiem_tra của 0036), và giá trị mới phải là link chat của một Zalo OA.
--
-- Mẫu trùng từng ký tự với MAU_LINK_ZALO_OA của web/src/lib/dich-dat-hang.ts (crm/test/test-mua-thit-ve.mjs
-- nhóm 9 đối chiếu hai bên). Không trim: ràng buộc cong_bo_dung_kieu của khóa kiểu url đã cấm dấu cách (0010).
-- Nhận mã số OA (3030027075662095415) và URL tùy biến của OA. https://zalo.me/<số điện thoại> (tài khoản cá
-- nhân) cũng khớp mẫu — mẫu chỉ chặn trang không phải Zalo; chặn người đổi đích là việc của cờ chỉ chủ.
create or replace function la_link_zalo_oa(p_url text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select coalesce(p_url ~ '^https://zalo\.me/[0-9A-Za-z._-]+/?$', false)
$$;

update khoa_cong_bo
set chi_chu_so_huu = true,
    mo_ta = 'Zalo OA chính thức, dạng https://zalo.me/<mã OA> (OA Nhà hàng Beeftown Hồ Tùng Mậu: https://zalo.me/3030027075662095415). Chỉ chủ công bố hay gỡ (từ 0101): trang Mua thịt về gửi đơn — và khách nhận mã QR chuyển khoản — qua đúng link này.'
where khoa = 'zalo_oa_url';

-- Không security definer: chạy dưới quyền người ghi dòng, không đọc bảng nào.
create or replace function zalo_oa_url_kiem_tra()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Chỉ kiểm khi giá trị mới vào: dòng cũ (có trước 0101) không hợp lệ vẫn THU HỒI được.
  if tg_op = 'UPDATE' and new.gia_tri_text is not distinct from old.gia_tri_text then
    return new;
  end if;
  if not la_link_zalo_oa(new.gia_tri_text) then
    raise exception 'Link Zalo OA phải có dạng https://zalo.me/ và mã OA, không thêm gì phía sau.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists zalo_oa_url_kiem_tra_trigger on noi_dung_cong_bo;
create trigger zalo_oa_url_kiem_tra_trigger
  before insert or update on noi_dung_cong_bo
  for each row when (new.khoa = 'zalo_oa_url')
  execute function zalo_oa_url_kiem_tra();


-- =============================================================================
-- 2 · MƯỜI KHÓA CÔNG BỐ — NHÓM mua_thit
-- =============================================================================
-- Không khóa nào bắt buộc để khai trương. Chưa công bố thì trang dùng câu mặc định hoặc ẩn phần đó
-- (web/src/components/TrangMuaThitVe.astro). Khóa văn bản được máy dịch sang en / ko như mọi khóa văn bản.
-- Tám khóa văn bản không nhận số tiền: phí giao, đơn tối thiểu quán báo khi xác nhận đơn (bộ quét chữ cấm chỉ
-- miễn số tiền nằm trong phần tử data-tien của danh sách gói).
insert into khoa_cong_bo (khoa, kieu, nhom, mo_ta, bat_buoc, chi_chu_so_huu, thu_tu) values
  ('hien_mua_thit_ve', 'bool', 'mua_thit',
   'Mở trang Mua thịt về và mục của nó trên thanh điều hướng: khách chọn gói, web soạn tin đơn để khách gửi qua Zalo OA. Trang CHỈ mở khi đủ ba điều kiện: công tắc này bật, đã công bố zalo_oa_url (link https://zalo.me/…), và có ít nhất một sản phẩm Đang bán, kênh website, đã được chủ chốt giá ở Bán lẻ. Trang hiện giá gói đã chốt; giá mỗi kg ở Kho đổi thì trang vẫn giữ giá đã chốt cho tới khi chủ chốt lại — nhân viên trực OA luôn tính lại tổng tiền theo FABi lúc xác nhận, không theo số trong tin (khách sửa được tin). Sửa tên, mô tả ở Bán lẻ thì trang đổi ngay. Chỉ bật khi có người trực Zalo OA trả lời đơn, đã thử chép đơn trên điện thoại thật, và đã có ý kiến luật sư về cách ghi định lượng gói giá cố định.',
   false, true, 400),
  ('mua_thit_hien_tam_het', 'bool', 'mua_thit',
   'Trang Mua thịt về ghi "Tạm hết ở quầy" theo tồn ở quầy trong kho. CHỈ bật khi chi nhánh đã trừ kho theo iPOS và quầy ghi hàng ra vào đúng lúc — kho ghi thiếu thì khách thấy "tạm hết" khi quầy còn hàng.',
   false, true, 410),
  ('mua_thit_gio_nhan', 'van_ban', 'mua_thit',
   'Giờ nhận tại quầy và giờ giao của đơn mua thịt về, như khách đọc. Chưa công bố thì trang ghi: quán hẹn giờ nhận khi xác nhận đơn. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.',
   false, false, 420),
  ('mua_thit_giao_hang', 'van_ban', 'mua_thit',
   'Công bố khóa này là MỞ giao tận nơi trên trang Mua thịt về: khu vực giao và cách tính phí, như khách đọc. Chưa công bố thì trang chỉ nhận tại quầy. Chỉ công bố khi đã chốt ai giao, giao xa bao nhiêu, túi giữ lạnh. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.',
   false, true, 430),
  ('mua_thit_thue', 'van_ban', 'mua_thit',
   'Một câu về VAT của giá trên trang Mua thịt về. Chưa công bố thì trang không nói gì về thuế. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.',
   false, true, 440),
  ('mua_thit_bao_quan_mat', 'van_ban', 'mua_thit',
   'Cách bảo quản thịt mát mua về: nhiệt độ, dùng trong mấy ngày. Chưa công bố thì thẻ thịt mát không có phần Bảo quản. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.',
   false, false, 450),
  ('mua_thit_bao_quan_dong_lanh', 'van_ban', 'mua_thit',
   'Cách bảo quản và rã đông thịt đông lạnh mua về. Chưa công bố thì thẻ thịt đông lạnh không có phần Bảo quản. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.',
   false, false, 460),
  ('mua_thit_can_lech', 'van_ban', 'mua_thit',
   'Gói cân thật lệch vài gam so với số ghi trên trang thì tính tiền thế nào. Chưa công bố thì trang không có câu hỏi này. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.',
   false, true, 470),
  ('mua_thit_hang_loi', 'van_ban', 'mua_thit',
   'Hàng mua về có vấn đề: báo trong bao lâu, quán xử lý thế nào. Chưa công bố thì trang chỉ ghi: nhắn quán qua Zalo OA kèm ảnh gói hàng. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.',
   false, true, 480),
  ('mua_thit_doi_huy', 'van_ban', 'mua_thit',
   'Đổi hoặc hủy đơn mua thịt về trước và sau khi quán xác nhận. Chưa công bố thì trang chỉ ghi: nhắn trong cùng khung chat Zalo với quán. Không ghi số tiền — phí giao, đơn tối thiểu quán báo khi xác nhận đơn.',
   false, false, 490)
on conflict (khoa) do nothing;


-- =============================================================================
-- 3 · chu_dich_con_hieu_luc — CHỮ THEO NGÔN NGỮ, BỎ BẢN DỊCH CỦA CÂU GỐC CŨ
-- =============================================================================
-- Sổ dịch (ban_dich, 0036) giữ băm câu gốc lúc dịch. Câu gốc đổi mà ô dịch giữ nguyên thì băm lệch — đó là
-- tín hiệu "cần dịch lại" của v_viec_dich; chon_ngon_ngu một mình không xem sổ. Tên phần thịt nằm trong tin
-- đơn: "Ba chỉ" đổi thành "Thăn" mà trang tiếng Anh còn "Brisket" là đặt nhầm món. Nên bản dịch chỉ dùng khi
-- băm của nó trùng câu gốc hiện tại; không thì lùi như chon_ngon_ngu (ko → en → vi).
-- Câu gốc rỗng, null hay còn ngoặc vuông → null. Hàm thuần: không đọc bảng nào. Tên không bắt đầu bằng ban_le_
-- (bất biến "không hàm ban_le_* nào anon gọi được" của test-ban-le.mjs nói về các hàm của trang nội bộ).
create or replace function chu_dich_con_hieu_luc(
  p_ngon_ngu text, p_so jsonb, p_cot text, p_vi text, p_en text, p_ko text)
returns text
language sql
immutable
set search_path = public
as $$
  select case when la_van_ban_tam(p_vi) then null else chon_ngon_ngu(p_ngon_ngu, p_vi,
    case when p_so -> p_cot -> 'en' ->> 'bam' = bam_nguon(p_vi) then p_en end,
    case when p_so -> p_cot -> 'ko' ->> 'bam' = bam_nguon(p_vi) then p_ko end) end
$$;


-- =============================================================================
-- 4 · KÊNH NHẬN ĐƠN VÀ MENU CÔNG KHAI
-- =============================================================================
-- Kênh nhận đơn MỞ khi: công tắc hien_mua_thit_ve đã công bố và bật, VÀ zalo_oa_url đã công bố (trong khung giờ
-- hiện) là link Zalo OA hợp lệ. Không security definer: chỉ hàm definer (mua_thit_ve_cong_khai) gọi nó.
create or replace function mua_thit_ve_kenh_mo()
returns boolean
language sql
stable
set search_path = public
as $$
  select cong_tac_bat('hien_mua_thit_ve') and exists (
    select 1 from noi_dung_cong_bo n
    where n.khoa = 'zalo_oa_url' and n.trang_thai = 'da_cong_bo'
      and now() >= coalesce(n.hien_tu,  '-infinity'::timestamptz)
      and now() <  coalesce(n.hien_den, 'infinity'::timestamptz)
      and la_link_zalo_oa(n.gia_tri_text))
$$;

-- Mỗi dòng một gói khách chọn được — 11 cột, đúng thứ tự (hợp đồng của web/src/lib/mua-thit-ve.ts,
-- web/kiem-tra/gia-supabase.mjs). Không trả id, ma_gui, mặt hàng kho, giá mỗi kg, giá hiện tại / riêng / tự
-- tính, mã FABi, mã vạch, cả ảnh chụp, người chốt, sổ dịch, kênh, trạng thái, cảnh báo, số tồn, thời điểm.
--   gia       giá gói trong ảnh chụp gia_chot -> 'goi' (luật giá ở đầu file), luôn > 0, không bao giờ null
--   tam_het   true CHỈ khi công tắc mua_thit_hien_tam_het bật, p_chi_nhanh_ma là chi nhánh đang hoạt động,
--             số tồn ở quầy tin được (ban_le_ton_tin_duoc: trừ kho theo iPOS) và gói hết (con_hang = 'het', lô
--             còn hạn theo hom_nay_vn()); mọi trường hợp khác false
-- Không kiểm vai (hàm công khai, như mini_app_con_hang của 0093). Không raise: đầu vào lạ thì trả ít dòng hơn.
-- p_ngon_ngu lạ → tiếng Việt (chon_ngon_ngu). Thứ tự: thịt trước kim chi, rồi thu_tu, tên; gói theo so_gam
-- tăng dần (ban_le_san_pham_json).
create or replace function mua_thit_ve_cong_khai(p_ngon_ngu text default 'vi', p_chi_nhanh_ma text default null)
returns table (
  san_pham_ma text,
  loai        text,
  don_vi      text,
  bao_quan    text,
  ten         text,
  ten_vi      text,
  mo_ta       text,
  cach_dung   text,
  so_gam      int,
  gia         bigint,
  tam_het     boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cn  uuid;            -- chi nhánh để tính "Tạm hết"; null = không tính
  s     ban_le_san_pham;
  j     jsonb;
  g     jsonb;
  v_gia bigint;
begin
  -- 1. Kênh nhận đơn chưa mở: công tắc tắt / chưa công bố, hoặc chưa có link Zalo OA hợp lệ → không dòng nào.
  if not mua_thit_ve_kenh_mo() then
    return;
  end if;
  -- 2. Chi nhánh chỉ để tính "Tạm hết", chỉ khi công tắc riêng bật. Mã lạ / ngừng hoạt động → không tính.
  if cong_tac_bat('mua_thit_hien_tam_het') then
    select c.id into v_cn from chi_nhanh c where lower(c.ma) = lower(p_chi_nhanh_ma) and c.dang_hoat_dong;
  end if;
  -- Mọi cột viết kèm bí danh: tên cột trả về (loai, ten_vi, so_gam, gia…) trùng tên cột bảng.
  for s in
    select * from ban_le_san_pham x
    where x.trang_thai = 'dang_ban' and x.kenh_web
      and jsonb_typeof(x.gia_chot -> 'goi') = 'object'             -- 3. chưa chốt giá lần nào → ẩn
      and not la_van_ban_tam(x.ten_vi)                              -- 4. tên còn chữ tạm → ẩn
      and not (x.cach_ban = 'theo_can' and x.mat_hang_id is null)   -- 5a. thịt chưa gắn mặt hàng kho → ẩn
    order by case x.loai when 'thit' then 0 else 1 end, x.thu_tu, x.ten_vi, x.id
  loop
    j := ban_le_san_pham_json(s.id, v_cn, false);   -- MỘT luật tồn và mặt hàng, ở 0099
    -- 5b. Mặt hàng kho của phần thịt đã mất / ngừng dùng → quầy không còn bán → ẩn cả sản phẩm.
    continue when s.cach_ban = 'theo_can'
                  and ((j ->> 'mat_hang_mat')::boolean or (j ->> 'mat_hang_ngung')::boolean);
    for g in select d.dong from jsonb_array_elements(j -> 'goi') as d(dong) loop
      -- 6. Giá = giá của gói trong ảnh chụp lần chốt (quyết định 1). Khóa ảnh chụp là CHỮ (0099).
      v_gia := case when jsonb_typeof(s.gia_chot -> 'goi' -> (g ->> 'so_gam')) = 'number'
                    then (s.gia_chot -> 'goi' ->> (g ->> 'so_gam'))::bigint end;
      continue when not (g ->> 'dang_ban')::boolean         -- gói ngưng bán
                    or v_gia is null or v_gia <= 0           -- gói thêm sau lần chốt / không có giá trong ảnh chụp
                    or (g ->> 'mat_hang_mat')::boolean       -- 6b. gói đóng sẵn / hộp có mặt hàng riêng đã mất
                    or (g ->> 'mat_hang_ngung')::boolean;    --     hoặc ngừng dùng
      san_pham_ma := s.ma;
      loai        := s.loai;
      don_vi      := case when s.cach_ban = 'theo_hop' then 'hop' else 'goi' end;
      bao_quan    := s.bao_quan;
      ten         := chu_dich_con_hieu_luc(p_ngon_ngu, s.ban_dich, 'ten', s.ten_vi, s.ten_en, s.ten_ko);
      ten_vi      := s.ten_vi;
      mo_ta       := chu_dich_con_hieu_luc(p_ngon_ngu, s.ban_dich, 'mo_ta', s.mo_ta_vi, s.mo_ta_en, s.mo_ta_ko);
      cach_dung   := chu_dich_con_hieu_luc(p_ngon_ngu, s.ban_dich, 'cach_dung', s.cach_dung_vi, s.cach_dung_en,
                                           s.cach_dung_ko);
      so_gam      := (g ->> 'so_gam')::int;
      gia         := v_gia;
      tam_het     := coalesce(g ->> 'con_hang' = 'het', false);
      return next;
    end loop;
  end loop;
end;
$$;


-- =============================================================================
-- 5 · noi_dung_cong_khai — hien_mua_thit_ve LÀ CÔNG TẮC HIỆU LỰC
-- =============================================================================
-- Điều hướng (mọi trang), trạng thái trang Mua thịt về và form cùng đọc MỘT giá trị: hien_mua_thit_ve trả về
-- true CHỈ khi công tắc công bố true VÀ link Zalo OA hợp lệ đã công bố VÀ mua_thit_ve_cong_khai('vi', null) có
-- ít nhất một dòng (null chi nhánh: tam_het luôn false — "gói đặt được" ở đây là gói có trên menu web). Không
-- thì một mục điều hướng dẫn tới trang "chưa mở". Chưa công bố → null như mọi khóa; công bố false → false.
-- Menu chỉ được tính khi công tắc công bố true (nhánh case).
--
-- Cùng chữ ký, cùng kiểu trả: create or replace giữ quyền EXECUTE của anon. Khối select bên trong chép NGUYÊN
-- VĂN thân 0036 (crm/test/test-mua-thit-ve.mjs nhóm 8 kiểm) — sửa ở đây thì sửa theo bản mới nhất của khối đó.
-- web/src/lib/messenger-anon.ts cũng gọi hàm này; nó không đọc khóa mới.
create or replace function noi_dung_cong_khai(p_ngon_ngu text default 'vi')
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case
           when x.d -> 'hien_mua_thit_ve' = 'true'::jsonb
             then jsonb_set(x.d, '{hien_mua_thit_ve}',
                            to_jsonb(exists (select 1 from mua_thit_ve_cong_khai('vi', null))))
           else x.d
         end
  from (
  -- Chép nguyên văn 0036 (thân noi_dung_cong_khai), thêm bí danh "as d".
  select coalesce(jsonb_object_agg(k.khoa, v.gia_tri), '{}'::jsonb) as d
  from khoa_cong_bo k
  left join lateral (
    select case n.kieu
             when 'ngay' then to_jsonb(n.gia_tri_ngay)
             when 'bool' then to_jsonb(n.gia_tri_bool)
             when 'so'   then to_jsonb(n.gia_tri_so)
             when 'tep'  then jsonb_build_object(
                                'url',       t.duong_dan,
                                'bucket',    t.bucket,
                                'alt',       chon_ngon_ngu(p_ngon_ngu, t.alt_vi, t.alt_en, t.alt_ko),
                                'chu_thich', chon_ngon_ngu(p_ngon_ngu, t.chu_thich,
                                                           t.chu_thich_en, t.chu_thich_ko),
                                'nguon',     t.nguon_that,
                                'rong',      t.rong,
                                'cao',       t.cao)
             when 'van_ban' then to_jsonb(chon_ngon_ngu(p_ngon_ngu, n.gia_tri_text,
                                                         n.gia_tri_text_en, n.gia_tri_text_ko))
             else to_jsonb(n.gia_tri_text)
           end as gia_tri
    from noi_dung_cong_bo n
    left join tep_anh t on t.id = n.gia_tri_tep_id
    where n.khoa = k.khoa
      and n.trang_thai = 'da_cong_bo'
      and now() >= coalesce(n.hien_tu,  '-infinity'::timestamptz)
      and now() <  coalesce(n.hien_den, 'infinity'::timestamptz)
    limit 1
  ) v on true
  ) x;
$$;


-- =============================================================================
-- 6 · CHÚ THÍCH
-- =============================================================================
comment on function la_link_zalo_oa(text) is
  'Link chat của một Zalo OA: https://zalo.me/<mã>, không gì phía sau (0101). Trùng MAU_LINK_ZALO_OA của web/src/lib/dich-dat-hang.ts. Hàm thuần.';
comment on function zalo_oa_url_kiem_tra() is
  'Trigger (0101): giá trị mới của zalo_oa_url phải qua la_link_zalo_oa; dòng cũ không hợp lệ vẫn thu hồi được.';
comment on function chu_dich_con_hieu_luc(text, jsonb, text, text, text, text) is
  'Chữ theo ngôn ngữ (ko → en → vi) chỉ với bản dịch còn hiệu lực — băm trong sổ dịch trùng câu gốc hiện tại (0101). Câu gốc rỗng / tạm → null. Hàm thuần.';
comment on function mua_thit_ve_kenh_mo() is
  'Kênh nhận đơn Mua thịt về mở (0101): công tắc hien_mua_thit_ve bật và zalo_oa_url đã công bố là link https://zalo.me/…. Nội bộ: chỉ hàm definer gọi.';
comment on function mua_thit_ve_cong_khai(text, text) is
  'CÔNG KHAI (0101): gói bán lẻ của trang Mua thịt về — chỉ khi kênh mở (hien_mua_thit_ve bật và zalo_oa_url là link https://zalo.me/…), chỉ sản phẩm Đang bán, kênh website, đã được chủ chốt giá; gia = giá gói trong ảnh chụp gia_chot (giá đã chốt, không theo giá kg mới); tam_het chỉ khi công tắc mua_thit_hien_tam_het bật và số kho tin được. Không trả mã nội bộ, giá kg, số tồn. anon gọi qua /mua-thit-ve.';
comment on function noi_dung_cong_khai(text) is
  'Đường đọc DUY NHẤT của website vào nội dung công bố. Trả đủ mọi khóa trong sổ đăng ký; khóa chưa duyệt có giá trị null. hien_mua_thit_ve là công tắc HIỆU LỰC (0101): true chỉ khi bật, có link Zalo OA hợp lệ và có gói trên menu web.';



-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6. Giữ dòng ve_con_hieu_luc: xem 0025.
-- =============================================================================
-- Chép nguyên văn từ 0099, thêm mua_thit_ve_cong_khai (trang Mua thịt về). Migration sau chép khối này, đừng
-- chép khối của 0062 trở về trước.
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
    -- Mua thịt về (0101): gói đang bán có giá chủ đã chốt; không mã nội bộ, không giá kg, không số tồn
    execute 'grant execute on function mua_thit_ve_cong_khai(text,text) to anon';
  end if;
end
$$;

-- Hai hàm nội bộ mới: revoke from public / anon ở trên KHÔNG gỡ quyền authenticated nhận qua quyền mặc định của
-- Supabase. mua_thit_ve_kenh_mo đọc noi_dung_cong_bo, chỉ hàm definer gọi; hàm trigger cũng thu (Postgres không
-- kiểm quyền EXECUTE của hàm trigger lúc trigger chạy). la_link_zalo_oa, chu_dich_con_hieu_luc để nguyên — hàm
-- thuần, không đọc bảng nào (như ban_le_gia_goi).
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function mua_thit_ve_kenh_mo() from authenticated';
    execute 'revoke execute on function zalo_oa_url_kiem_tra() from authenticated';
  end if;
end
$$;
