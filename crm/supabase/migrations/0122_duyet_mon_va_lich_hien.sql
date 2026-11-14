-- =============================================================================
-- BEEFTOWN CRM — 0122 · AI ĐƯỢC DUYỆT GIÁ, ĐỔI CỜ MÓN VÀ ĐỔI LỊCH HIỆN CỦA NỘI DUNG ĐÃ CÔNG BỐ
-- =============================================================================
-- LỖI (rà soát bảo mật 14/11/2026, tái hiện trên PGlite —
-- crm/test/test-quyen-duyet-thuc-don-noi-dung.mjs)
--
-- Hai chỗ giao diện không cho làm nhưng gọi thẳng database (PostgREST, bằng chính tài
-- khoản nhân viên) thì làm được — cùng khuôn lỗi 0027 đã vá cho lương của tin tuyển dụng.
--
-- 1 · mon_an. Policy mon_an_sua (0011, 0070) cho chủ, quản lý và MARKETING sửa mọi cột.
--     Màn /noi-bo/thuc-don chỉ gửi tên, mô tả, khẩu phần, thứ tự, trạng thái
--     (web/src/lib/thuc-don-noi-bo.ts: "KHÔNG ĐỤNG GIÁ, MỨC CAY, MÓN SỐNG, CÓ CỒN, NHÓM").
--     Nhưng tài khoản marketing gọi thẳng thì:
--       · tự ghi gia + gia_da_duyet = true — "giá đã duyệt" mà không ai duyệt;
--       · bỏ co_con — đồ uống có cồn hiện ra khi công tắc hien_do_uong_co_con (chỉ chủ bật) đang tắt;
--       · bỏ la_mon_song — món sống công bố không kèm câu cảnh báo (CHECK
--         mon_an_cong_bo_phai_sach chỉ đòi cảnh báo khi cờ còn bật);
--       · chuyển món sang nhóm khác, hay thêm thẳng một món mới với nhóm và cờ tự chọn.
--
-- 2 · noi_dung_cong_bo. thu_hoi_noi_dung (0016) chỉ cho chủ gỡ khóa "chỉ chủ sở hữu" và ghi
--     lại lý do. Trigger noi_dung_cong_bo_kiem_tra (0010, 0036) khóa giá trị và trạng thái của
--     dòng đã công bố nhưng không nhìn hai cột hien_tu / hien_den — mà cong_tac_bat (0010) và
--     noi_dung_cong_khai (0101) đều tôn trọng hai cột đó. Marketing hay quản lý đặt
--     hien_den = now() cho form_dat_ban_dang_mo là form đặt bàn đóng với khách, không qua
--     cổng thu hồi, không lý do, và màn Nội dung của chủ vẫn báo khóa "đang sống".
--
-- ĐỔI GÌ
--
--   1. Trigger mon_an_kiem_duyet_trigger (before insert or update on mon_an): người đang đăng
--      nhập mà không phải chủ hay quản lý thì không thêm được món, và không đổi được gia,
--      gia_da_duyet, muc_cay, muc_cay_da_duyet, la_mon_song, co_con, nhom_mon_id. Gửi kèm các
--      cột đó với giá trị KHÔNG đổi thì vẫn lưu. Marketing vẫn sửa chữ, đề xuất giá / mức cay
--      (gia_de_xuat, muc_cay_de_xuat), công bố và gỡ món như trước.
--   2. Trigger noi_dung_cong_bo_khung_gio_trigger (before update on noi_dung_cong_bo): với dòng
--      ĐÃ CÔNG BỐ, đổi hien_tu / hien_den chỉ dành cho người được công bố khóa đó — chủ với
--      khóa chi_chu_so_huu, chủ hoặc quản lý với khóa thường (đúng luật của dat_noi_dung và
--      thu_hoi_noi_dung). Bản nháp, bản đã duyệt chưa công bố: không đụng.
--
-- Cả hai trigger bỏ qua lời gọi KHÔNG phiên (SQL Editor, các khối SQL của web/THUC-DON.md,
-- seed của migration) — như tim_hoac_tao_khach (0045) và các trigger cùng khu.
--
-- VÌ SAO CHẶN CẢ THÊM MÓN. Policy mon_an_them (0011) cho marketing thêm món, nhưng một món
-- mới mang theo nhóm và hai cờ pháp lý do người thêm tự chọn — đúng những thứ bản này giữ lại
-- cho người duyệt. Website chưa có nút thêm món (thuc-don-noi-bo.ts: "Thêm món mới cần chọn
-- nhóm, mã và hai cờ pháp lý — để sau"). Khi làm nút đó, quyết định lại ở đây.
--
-- CÒN LẠI, KHÔNG ĐÓNG ĐƯỢC BẰNG TRIGGER: marketing có quyền sửa chữ nên vẫn đổi được TÊN một
-- món không cồn thành tên đồ uống có cồn. Đó là chính quyền biên tập; ai duyệt chữ là việc
-- của quy trình, không của bảng.
--
-- AI ĐƯỢC DUYỆT: chủ và quản lý — theo luật 0027 cho lương. Muốn chỉ chủ duyệt thì đổi mảng
-- vai trong mon_an_kiem_duyet (một migration mới).
--
-- CÂU MỚI (bản tiếng Anh ở web/src/lib/cau-noi-bo.ts):
--   'Chỉ chủ nhà hàng hoặc quản lý mới thêm được món, duyệt được giá, mức cay và đổi cờ món sống, có cồn hay nhóm của món'
--   'Khóa % chỉ chủ sở hữu mới được đổi lịch hiện trên trang'
--   'Không có quyền đổi lịch hiện của nội dung đã công bố'
--
-- Hai hàm trigger là security invoker (chỉ gọi các hàm kiểm vai sẵn có), đặt search_path,
-- và không ai được gọi thẳng — trigger vẫn chạy mà không cần quyền EXECUTE của người ghi.
--
-- Không sửa dữ liệu. Không câu delete. Kiểm thử: crm/test/test-quyen-duyet-thuc-don-noi-dung.mjs.
-- =============================================================================


-- =============================================================================
-- 1 · MÓN ĂN — giá, mức cay, cờ món sống / có cồn, nhóm và việc thêm món: chỉ chủ và quản lý
-- =============================================================================
create or replace function mon_an_kiem_duyet()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if co_phien_dang_nhap()
     and not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[])
     and (tg_op = 'INSERT'
          or (new.gia, new.gia_da_duyet, new.muc_cay, new.muc_cay_da_duyet,
              new.la_mon_song, new.co_con, new.nhom_mon_id)
             is distinct from
             (old.gia, old.gia_da_duyet, old.muc_cay, old.muc_cay_da_duyet,
              old.la_mon_song, old.co_con, old.nhom_mon_id)) then
    raise exception 'Chỉ chủ nhà hàng hoặc quản lý mới thêm được món, duyệt được giá, mức cay và đổi cờ món sống, có cồn hay nhóm của món'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

comment on function mon_an_kiem_duyet() is
  'Trigger của mon_an (0122): người đăng nhập không phải chủ / quản lý không thêm được món và không đổi được giá đã duyệt, mức cay đã duyệt, cờ món sống, cờ có cồn, nhóm. Không phiên (SQL Editor) thì bỏ qua.';

create trigger mon_an_kiem_duyet_trigger
  before insert or update on mon_an
  for each row execute function mon_an_kiem_duyet();


-- =============================================================================
-- 2 · NỘI DUNG ĐÃ CÔNG BỐ — lịch hiện (hien_tu, hien_den) theo đúng luật công bố / thu hồi
-- =============================================================================
create or replace function noi_dung_cong_bo_khung_gio_kiem_tra()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_chi_chu boolean;
begin
  if not co_phien_dang_nhap() then
    return new;
  end if;
  if old.trang_thai <> 'da_cong_bo' then
    return new;
  end if;
  if new.hien_tu is not distinct from old.hien_tu
     and new.hien_den is not distinct from old.hien_den then
    return new;
  end if;

  select k.chi_chu_so_huu into v_chi_chu from khoa_cong_bo k where k.khoa = old.khoa;
  -- Không thấy khóa (không xảy ra: có khóa ngoại) thì coi như khóa chỉ chủ — sai thì chặt, không sai thì lỏng.
  if coalesce(v_chi_chu, true) then
    if not la_chu_so_huu() then
      raise exception 'Khóa % chỉ chủ sở hữu mới được đổi lịch hiện trên trang', old.khoa
        using errcode = 'insufficient_privilege';
    end if;
  elsif not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
    raise exception 'Không có quyền đổi lịch hiện của nội dung đã công bố'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

comment on function noi_dung_cong_bo_khung_gio_kiem_tra() is
  'Trigger của noi_dung_cong_bo (0122): dòng đã công bố chỉ được đổi hien_tu / hien_den bởi người được công bố khóa đó (chủ với khóa chi_chu_so_huu; chủ hoặc quản lý với khóa thường). Không phiên thì bỏ qua.';

create trigger noi_dung_cong_bo_khung_gio_trigger
  before update on noi_dung_cong_bo
  for each row execute function noi_dung_cong_bo_khung_gio_kiem_tra();


-- =============================================================================
-- QUYỀN — hai hàm trigger không ai gọi thẳng (trigger chạy không cần quyền EXECUTE của người ghi)
-- =============================================================================
revoke execute on function mon_an_kiem_duyet() from public;
revoke execute on function noi_dung_cong_bo_khung_gio_kiem_tra() from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function mon_an_kiem_duyet() from anon';
    execute 'revoke execute on function noi_dung_cong_bo_khung_gio_kiem_tra() from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function mon_an_kiem_duyet() from authenticated';
    execute 'revoke execute on function noi_dung_cong_bo_khung_gio_kiem_tra() from authenticated';
  end if;
end
$$;
