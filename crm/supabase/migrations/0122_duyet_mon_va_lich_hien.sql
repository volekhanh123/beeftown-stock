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
--       · chuyển món sang nhóm khác, hay thêm thẳng một món mới với nhóm và cờ tự chọn;
--       · ghi các ô còn lại mà màn hình không bao giờ gửi: giả người duyệt và giờ duyệt giá
--         (gia_nguoi_duyet, gia_duyet_luc), đổi mã món, xóa danh sách dị ứng, sửa ghi chú nội bộ.
--
-- 2 · noi_dung_cong_bo. thu_hoi_noi_dung (0016) chỉ cho chủ gỡ khóa "chỉ chủ sở hữu" và ghi
--     lại lý do. Trigger noi_dung_cong_bo_kiem_tra (0010, 0036) khóa giá trị và trạng thái của
--     dòng đã công bố nhưng không nhìn hai cột hien_tu / hien_den — mà cong_tac_bat (0010) và
--     noi_dung_cong_khai (0101) đều tôn trọng hai cột đó. Marketing hay quản lý đặt
--     hien_den = now() cho form_dat_ban_dang_mo là form đặt bàn đóng với khách, không qua
--     cổng thu hồi, không lý do, và màn Nội dung của chủ vẫn báo khóa "đang sống".
--     Cũng trigger đó không nhìn các cột GHI CHÚ và GHI VẾT của dòng đã công bố (ly_do,
--     nguoi_duyet, cong_bo_luc…) và không giữ gì ở dòng ĐÃ GỠ: marketing viết lại được "ai duyệt,
--     lúc nào, vì sao" của một công tắc chỉ chủ đang chạy, và cả giá trị của bản đã gỡ. Không
--     đổi được thứ khách thấy, nhưng đó là sổ chủ đọc khi cần biết ai đã làm gì (vòng hai của
--     rà soát 14/11).
--
-- ĐỔI GÌ
--
--   1. Trigger mon_an_kiem_duyet_trigger (before insert or update on mon_an): người đang đăng
--      nhập mà không phải chủ hay quản lý thì không thêm được món, và chỉ đổi được ĐÚNG các cột
--      trong một danh sách: chữ tiếng Việt và bản dịch (tên, mô tả, khẩu phần, cảnh báo), thứ
--      tự, trạng thái, hai cột đề xuất (gia_de_xuat, muc_cay_de_xuat) và sổ bản dịch — đúng
--      những ô màn /noi-bo/thuc-don và máy dịch ghi. MỌI CỘT KHÁC bị chặn, kể cả cột thêm vào
--      bảng sau này: danh sách là "được sửa", không phải "bị cấm", nên quên không thành hở.
--      Gửi kèm cột khác với giá trị KHÔNG đổi thì vẫn lưu. Marketing vẫn sửa chữ, đề xuất giá /
--      mức cay, công bố và gỡ món như trước.
--   2. Trigger noi_dung_cong_bo_da_len_trang_trigger (before update on noi_dung_cong_bo): dòng
--      ĐÃ LÊN TRANG — đang công bố hoặc đã gỡ — chỉ người được công bố khóa đó mới sửa được:
--      chủ với khóa chi_chu_so_huu, chủ hoặc quản lý với khóa thường (đúng luật của dat_noi_dung
--      và thu_hoi_noi_dung). Tức là lịch hiện (hien_tu, hien_den), ghi chú, người duyệt, các mốc
--      giờ; ở dòng đã gỡ là mọi cột — kể cả cột khoa: chuyển một dòng đã gỡ sang khóa khác thì
--      phải được công bố CẢ khóa cũ lẫn khóa mới (quản lý không nhét được dòng vào sổ của khóa
--      chỉ chủ). Hai thứ trigger cũ noi_dung_cong_bo_kiem_tra đã giữ thì vẫn
--      do nó xét, bằng câu của nó: giá trị của dòng đang công bố (bất biến với mọi người) và việc
--      chuyển trạng thái (gỡ khỏi trang). Bản nháp, bản đã duyệt chưa công bố: không đụng.
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
--   'Chỉ chủ nhà hàng hoặc quản lý mới thêm được món, duyệt được giá, mức cay, đổi cờ món sống, có cồn, nhóm và các ô khác ngoài phần chữ, thứ tự, trạng thái và đề xuất của món'
--   'Khóa % chỉ chủ sở hữu mới được đổi lịch hiện trên trang'
--   'Không có quyền đổi lịch hiện của nội dung đã công bố'
--   'Khóa % chỉ chủ sở hữu mới được sửa dòng đã công bố hoặc đã gỡ'
--   'Không có quyền sửa nội dung đã công bố hoặc đã gỡ'
--
-- Hai hàm trigger là security invoker (chỉ gọi các hàm kiểm vai sẵn có), đặt search_path,
-- và không ai được gọi thẳng — trigger vẫn chạy mà không cần quyền EXECUTE của người ghi.
--
-- Không sửa dữ liệu. Không câu delete. Kiểm thử: crm/test/test-quyen-duyet-thuc-don-noi-dung.mjs.
-- =============================================================================


-- =============================================================================
-- 1 · MÓN ĂN — người biên tập chỉ sửa được chữ, thứ tự, trạng thái và đề xuất; còn lại: chủ và quản lý
-- =============================================================================
create or replace function mon_an_kiem_duyet()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  -- Cột người không phải chủ / quản lý (tức marketing — policy mon_an_sua không cho vai nào khác) ĐƯỢC SỬA.
  --   · chữ tiếng Việt, bản dịch, thứ tự: COT_SUA và COT_DICH của web/src/lib/thuc-don-noi-bo.ts;
  --   · trang_thai: công bố và gỡ món;
  --   · gia_de_xuat, muc_cay_de_xuat: đề xuất chờ duyệt (0011: "quản lý hoặc marketing điền thoải mái");
  --   · ban_dich: sổ bản dịch — ghi_ban_dich (máy dịch, chạy dưới phiên người soạn) và ghi_so_ban_dich ghi;
  --   · updated_at: trigger mon_an_updated_at ghi đè mọi giá trị gửi lên bằng giờ thật, nên để trong danh sách là
  --     vô hại.
  -- Cột không có ở đây — kể cả cột thêm vào bảng sau này — chỉ chủ và quản lý đổi được. cong_bo_luc (giờ công bố)
  -- CỐ Ý không có: trigger mon_an_kiem_tra_nhom tự điền nó lúc công bố, và trigger đó chạy SAU trigger này (thứ tự
  -- tên: mon_an_kiem_duyet_trigger đứng trước mon_an_kiem_tra_nhom_trigger) — lúc trigger này xét thì cột chưa
  -- đổi, nên công bố bình thường không bị chặn; chỉ người biên tập tự gửi một giờ công bố mới bị từ chối. Đổi tên
  -- hay thêm trigger đứng trước trigger này mà đụng cột đó thì kiểm thử "Marketing công bố món đã viết xong" đỏ.
  v_duoc_sua constant text[] := array[
    'ten_vi', 'ten_en', 'ten_ko', 'mo_ta_vi', 'mo_ta_en', 'mo_ta_ko',
    'khau_phan', 'khau_phan_en', 'khau_phan_ko', 'canh_bao', 'canh_bao_en', 'canh_bao_ko',
    'thu_tu', 'trang_thai', 'gia_de_xuat', 'muc_cay_de_xuat', 'ban_dich',
    'updated_at'];
begin
  if not co_phien_dang_nhap() or co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
    return new;
  end if;
  if tg_op = 'INSERT'
     or (to_jsonb(new) - v_duoc_sua) is distinct from (to_jsonb(old) - v_duoc_sua) then
    raise exception 'Chỉ chủ nhà hàng hoặc quản lý mới thêm được món, duyệt được giá, mức cay, đổi cờ món sống, có cồn, nhóm và các ô khác ngoài phần chữ, thứ tự, trạng thái và đề xuất của món'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

comment on function mon_an_kiem_duyet() is
  'Trigger của mon_an (0122): người đăng nhập không phải chủ / quản lý không thêm được món và chỉ đổi được chữ, bản dịch, thứ tự, trạng thái, hai cột đề xuất và sổ bản dịch — giá đã duyệt, mức cay đã duyệt, cờ món sống, cờ có cồn, nhóm và mọi cột khác thì không. Không phiên (SQL Editor) thì bỏ qua.';

create trigger mon_an_kiem_duyet_trigger
  before insert or update on mon_an
  for each row execute function mon_an_kiem_duyet();


-- =============================================================================
-- 2 · NỘI DUNG ĐÃ LÊN TRANG (đang công bố hoặc đã gỡ) — sửa theo đúng luật công bố / thu hồi
-- =============================================================================
create or replace function noi_dung_cong_bo_da_len_trang_kiem_tra()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  -- Cột của dòng ĐANG CÔNG BỐ mà trigger noi_dung_cong_bo_kiem_tra (0036) đã giữ bất biến với mọi người, bằng câu
  -- "Không sửa được giá trị đã công bố…". Hàm này không xét lại các cột đó ở dòng đang công bố, để người dùng vẫn
  -- nhận đúng câu cũ. Ở dòng ĐÃ GỠ trigger cũ không giữ gì, nên hàm này xét mọi cột.
  v_gia_tri constant text[] := array[
    'khoa', 'kieu', 'gia_tri_text', 'gia_tri_text_en', 'gia_tri_text_ko',
    'gia_tri_ngay', 'gia_tri_so', 'gia_tri_bool', 'gia_tri_tep_id', 'ban_dich'];
  v_bo_qua   text[] := array[]::text[];
  v_khoa     text;
  v_chi_chu  boolean;
  v_doi_lich boolean;
begin
  if not co_phien_dang_nhap() then
    return new;
  end if;
  if old.trang_thai not in ('da_cong_bo', 'da_thu_hoi') then
    return new;
  end if;
  -- Chuyển trạng thái: từ hai trạng thái này chỉ có một bước hợp lệ (đang công bố → đã gỡ), và
  -- noi_dung_cong_bo_kiem_tra xét quyền của bước đó bằng câu của nó; mọi bước khác nó từ chối. Người không được gỡ
  -- thì cả câu lệnh — kể cả cột ghi chú gửi kèm — bị hủy ở đó.
  if new.trang_thai is distinct from old.trang_thai then
    return new;
  end if;
  if old.trang_thai = 'da_cong_bo' then
    v_bo_qua := v_gia_tri;
  end if;
  if (to_jsonb(new) - v_bo_qua) is not distinct from (to_jsonb(old) - v_bo_qua) then
    return new;
  end if;

  -- Đổi lịch hiện của dòng đang công bố là đóng / mở thứ khách thấy: câu riêng. Còn lại là sửa sổ ghi vết.
  v_doi_lich := old.trang_thai = 'da_cong_bo'
    and (new.hien_tu is distinct from old.hien_tu or new.hien_den is distinct from old.hien_den);

  -- Quyền xét theo CẢ khóa cũ lẫn khóa mới. Dòng đã gỡ đổi được cột khoa (trigger cũ không giữ gì ở đó): người chỉ
  -- được công bố khóa thường không được nhét một dòng vào sổ của khóa chỉ chủ, cũng không kéo được một dòng ra khỏi
  -- sổ đó. Không thấy khóa (không xảy ra: có khóa ngoại) thì coi như khóa chỉ chủ — sai thì chặt, không sai thì lỏng.
  v_khoa := old.khoa;
  select k.chi_chu_so_huu into v_chi_chu from khoa_cong_bo k where k.khoa = old.khoa;
  if not coalesce(v_chi_chu, true) and new.khoa is distinct from old.khoa then
    v_khoa := new.khoa;
    v_chi_chu := null;
    select k.chi_chu_so_huu into v_chi_chu from khoa_cong_bo k where k.khoa = new.khoa;
  end if;
  if coalesce(v_chi_chu, true) then
    if not la_chu_so_huu() then
      if v_doi_lich then
        raise exception 'Khóa % chỉ chủ sở hữu mới được đổi lịch hiện trên trang', v_khoa
          using errcode = 'insufficient_privilege';
      end if;
      raise exception 'Khóa % chỉ chủ sở hữu mới được sửa dòng đã công bố hoặc đã gỡ', v_khoa
        using errcode = 'insufficient_privilege';
    end if;
  elsif not co_vai_tro(array['chu_so_huu','quan_ly']::vai_tro[]) then
    if v_doi_lich then
      raise exception 'Không có quyền đổi lịch hiện của nội dung đã công bố'
        using errcode = 'insufficient_privilege';
    end if;
    raise exception 'Không có quyền sửa nội dung đã công bố hoặc đã gỡ'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

comment on function noi_dung_cong_bo_da_len_trang_kiem_tra() is
  'Trigger của noi_dung_cong_bo (0122): dòng đã lên trang — đang công bố hoặc đã gỡ — chỉ người được công bố khóa đó (chủ với khóa chi_chu_so_huu; chủ hoặc quản lý với khóa thường) mới sửa được: lịch hiện, ghi chú, người duyệt, các mốc giờ; ở dòng đã gỡ là mọi cột. Giá trị của dòng đang công bố và việc chuyển trạng thái vẫn do noi_dung_cong_bo_kiem_tra xét. Không phiên thì bỏ qua.';

-- Tên trigger đứng TRƯỚC noi_dung_cong_bo_kiem_tra_trigger theo thứ tự chữ cái, nên hàm trên thấy đúng dòng người
-- gọi gửi lên (trigger cũ chỉ tự điền mốc giờ khi chuyển trạng thái — đường mà hàm trên bỏ qua).
create trigger noi_dung_cong_bo_da_len_trang_trigger
  before update on noi_dung_cong_bo
  for each row execute function noi_dung_cong_bo_da_len_trang_kiem_tra();


-- =============================================================================
-- QUYỀN — hai hàm trigger không ai gọi thẳng (trigger chạy không cần quyền EXECUTE của người ghi)
-- =============================================================================
revoke execute on function mon_an_kiem_duyet() from public;
revoke execute on function noi_dung_cong_bo_da_len_trang_kiem_tra() from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function mon_an_kiem_duyet() from anon';
    execute 'revoke execute on function noi_dung_cong_bo_da_len_trang_kiem_tra() from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function mon_an_kiem_duyet() from authenticated';
    execute 'revoke execute on function noi_dung_cong_bo_da_len_trang_kiem_tra() from authenticated';
  end if;
end
$$;
