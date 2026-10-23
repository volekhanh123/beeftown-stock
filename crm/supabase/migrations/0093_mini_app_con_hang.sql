-- =============================================================================
-- BEEFTOWN — 0093 · MINI APP ZALO: CÒN HÀNG Ở QUẦY
-- =============================================================================
-- PHẢI CHẠY SAU 0010 (khoa_cong_bo, cong_tac_bat), 0019 (kho_truong_them, kho_mat_hang), 0020 (kho_ton,
-- kho_lo) VÀ 0084 (khối CHỐT QUYỀN cuối file chép từ 0090, bản mới nhất của khối 0084).
--
-- Mini App Zalo (mini-app/) bán 6 phần thịt theo khay, giá cố định (Khánh quyết 22/10/2026). Bước 2:
-- khách thấy phần thịt nào "còn hàng / sắp hết / tạm hết" theo SỐ KHAY Ở QUẦY trong kho.
--
-- Mini App không gọi database: nó hỏi website (GET /mini-app/con-hang.json), website gọi hàm dưới đây bằng
-- vai anon. Hàm chỉ trả TRẠNG THÁI, không trả số khay, số kg hay tên mặt hàng trong kho — cùng lý do
-- lich_trong_theo_ma() trả boolean thay vì số bàn (web/src/lib/dat-ban.ts): con số tồn là thứ đối thủ
-- đếm được, và hook khan hiếm bị cấm. Không có dữ liệu khách nào đi qua đây (Mini App phải giữ dữ liệu
-- khách ở Việt Nam — mini-app/CLAUDE.md, "Quy tắc của Zalo phải giữ").
--
-- File này:
--   1 · Ô thông tin thêm "Phần thịt trên Mini App Zalo" (kho_truong_them, mặt hàng, khoa mini_app, kiểu
--       chọn, 6 mã phần thịt của mini-app/src/san-pham.ts). Chủ / quản lý chọn ô này trên đúng mặt hàng
--       phần cắt ở màn mặt hàng của kho — không cần màn mới. Thêm phần thịt mới: sửa lựa chọn của ô.
--   2 · Công tắc mini_app_hien_con_hang (khoa_cong_bo, chỉ chủ công bố), MẶC ĐỊNH TẮT: số kho chỉ đúng
--       khi quầy quét khay ra vào kho đúng lúc. Tắt thì hàm trả rỗng và Mini App hiện mọi phần như cũ.
--   3 · mini_app_con_hang(p_chi_nhanh_ma) — anon gọi được (thêm vào khối CHỐT QUYỀN).
-- Triển khai: chạy migration trước, deploy web sau (route mới gọi hàm này; thiếu hàm thì route trả rỗng).
-- =============================================================================


-- =============================================================================
-- 1 · Ô "PHẦN THỊT TRÊN MINI APP ZALO" CHO MẶT HÀNG
-- =============================================================================
-- Không bắt buộc: chỉ vài mặt hàng phần cắt gắn với Mini App. Đã có ô cùng khóa (chủ tự tạo trước) thì
-- giữ nguyên ô đó.
insert into kho_truong_them (doi_tuong, khoa, nhan, kieu, lua_chon, bat_buoc, goi_y, thu_tu)
values ('mat_hang', 'mini_app', 'Phần thịt trên Mini App Zalo', 'chon',
        array['ribeye-with-cap', 'outside-skirt', 'chadolbagi', 'top-blade', 'galbisal', 'la-galbi'],
        false,
        'Chọn phần thịt Mini App bán bằng khay của mặt hàng này. Để trống nếu mặt hàng không bán trên Mini App.',
        900)
on conflict (doi_tuong, khoa) do nothing;


-- =============================================================================
-- 2 · CÔNG TẮC — MẶC ĐỊNH TẮT
-- =============================================================================
insert into khoa_cong_bo (khoa, kieu, nhom, mo_ta, bat_buoc, chi_chu_so_huu, thu_tu) values
  ('mini_app_hien_con_hang', 'bool', 'trang_thai',
   'Mini App Zalo hiện "còn hàng / sắp hết / tạm hết" theo số khay ở quầy trong kho. CHỈ bật khi quầy đã quét khay ra vào kho đúng lúc — số kho sai thì khách thấy "tạm hết" khi quầy còn hàng, hoặc đặt phần quầy đã hết.',
   false, true, 55)
on conflict (khoa) do nothing;


-- =============================================================================
-- 3 · mini_app_con_hang — TRẠNG THÁI TỪNG PHẦN THỊT CỦA MINI APP
-- =============================================================================
-- Đếm khay (so_goi) của các mặt hàng gắn ô mini_app, ở vị trí loại 'quay' của chi nhánh, chỉ lô CÒN HẠN
-- (han_dung >= hôm nay giờ VN). Không tính hàng đang chuyển ra quầy (dang_chuyen), trong kho hay chờ hủy:
-- khách chỉ mua được khay đã nằm ở quầy. Nhiều mặt hàng cùng gắn một phần thịt thì cộng khay.
--   0 khay      → 'het'
--   1–2 khay    → 'sap_het'
--   từ 3 khay   → 'con'
-- Chỉ mặt hàng đang dùng và đếm theo khay (dem_goi): mặt hàng chỉ cân kg không có số khay để đếm.
-- Trả rỗng khi: công tắc tắt, ô mini_app bị tắt, chi nhánh không có hoặc ngừng hoạt động. Phần thịt chưa
-- gắn mặt hàng nào không có dòng — Mini App hiện phần đó như cũ.
-- Không kiểm vai: hàm công khai như chi_nhanh_cong_khai(); không đọc hay trả dữ liệu khách.
create or replace function mini_app_con_hang(p_chi_nhanh_ma text)
returns table (ma text, trang_thai text)
language sql
stable
security definer
set search_path = public
as $$
  with cn as (
    select c.id
    from chi_nhanh c
    where lower(c.ma) = lower(p_chi_nhanh_ma) and c.dang_hoat_dong
  ),
  gan as (
    select m.id as mat_hang_id, m.truong_them ->> 'mini_app' as ma
    from kho_mat_hang m
    where m.dang_dung
      and m.dem_goi
      and coalesce(m.truong_them ->> 'mini_app', '') <> ''
  ),
  dem as (
    select g.ma,
           coalesce(sum(t.so_goi) filter (where v.loai = 'quay' and l.han_dung >= hom_nay_vn()), 0) as so_khay
    from gan g
    cross join cn
    left join kho_ton t    on t.mat_hang_id = g.mat_hang_id and t.chi_nhanh_id = cn.id
    left join kho_vi_tri v on v.id = t.vi_tri_id
    left join kho_lo l     on l.id = t.lo_id
    group by g.ma
  )
  select d.ma,
         case when d.so_khay <= 0 then 'het'
              when d.so_khay <= 2 then 'sap_het'
              else 'con'
         end
  from dem d
  where cong_tac_bat('mini_app_hien_con_hang')
    and exists (select 1 from kho_truong_them k
                where k.doi_tuong = 'mat_hang' and k.khoa = 'mini_app' and k.dang_dung)
  order by d.ma;
$$;

comment on function mini_app_con_hang(text) is
  'CÔNG KHAI (0093): trạng thái het / sap_het / con của từng phần thịt Mini App Zalo theo số khay ở quầy (lô còn hạn) của chi nhánh. Chỉ khi công tắc mini_app_hien_con_hang bật. Không trả số khay. anon gọi qua website (/mini-app/con-hang.json).';



-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6. Giữ dòng ve_con_hieu_luc: xem 0025.
-- =============================================================================
-- Chép từ 0090 (khối của 0084), thêm mini_app_con_hang (mục 3). Migration sau chép khối này, đừng chép khối
-- của 0062 trở về trước.
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
  end if;
end
$$;
