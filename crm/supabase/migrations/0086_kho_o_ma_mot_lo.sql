-- =============================================================================
-- BEEFTOWN KHO — 0086 · MỘT Ô MÃ CHỈ VỀ MỘT LÔ: LÔ CÓ KHAY MANG NHÃN
-- =============================================================================
-- LỖI (rà soát độc lập ngày 12/10/2026, trước khi mở PR soát luồng 6 bước; dựng
-- lại được trên PGlite): phiên lóc một tảng gõ tay HAI dòng ra cho cùng một phần
-- cắt đang giữ ô mã, ví dụ
--     Thăn ngoại cắt lát   4 khay → Quầy
--     Thăn ngoại cắt lát   0,5 kg → chuyển thẳng bếp
-- kho_chot_phien_pha (0033) sinh một lô cho MỖI dòng giữ lại, còn ô chỉ nhớ được
-- MỘT lô: trigger kho_phien_pha_ra_o_ma (0049) ghi đè lo_id của ô mỗi lần một
-- dòng ra nhận lô, nên dòng chốt sau cùng thắng. Ô rơi vào lô chuyển bếp — lô đó
-- xuất hết ngay trong lúc chốt — thì:
--   · kho_o_ma_con_giu coi ô đã "trống" trong khi 4 khay dán nhãn mã ô đó còn
--     nằm ở quầy;
--   · tảng lóc sau lấy lại đúng ô đó (kho_giao_o_ma đóng ô "trống" rồi giao lại);
--   · quét một khay của tảng #1 thì phiếu chuyển / xuất bếp / báo hủy — và hóa
--     đơn iPOS bán theo mã ô (kho_ipos_lo_cua_o, 0051) — trừ lô của tảng #2.
-- Tổng tồn theo món vẫn đúng và kho_doi_soat_ton() vẫn rỗng; cái sai là LÔ bị
-- trừ: truy vết tảng, thu hồi theo tảng, hạn dùng của lô bị trừ.
-- Hai dòng nhập kho của cùng phần cắt ("4 khay → Quầy" + "6 khay → Kho lạnh")
-- cũng thành hai lô với một ô: ô theo lô sau, lô trước không ô nào trỏ tới.
-- Chỉ xảy ra khi GÕ TAY: món đã quét nhãn thì database không cho thêm dòng thứ
-- hai (0033), nên phiên dùng cân và nhãn không gặp.
--
-- SỬA — thay thân hàm trigger kho_phien_pha_ra_o_ma (cùng tên, cùng kiểu, cùng
-- quyền; trigger trên kho_phien_pha_ra giữ nguyên):
--   1. Ô chỉ theo lô của dòng NHẬP KHO. Dòng chuyển thẳng bếp không mang nhãn
--      ra quầy nên không đụng tới ô — dòng nào chốt trước cũng vậy. Phần cắt chỉ
--      có dòng chuyển thẳng bếp → ô không gắn lô nào, tảng sau dùng lại được.
--   2. Dòng nhập kho THỨ HAI của cùng phần cắt đang giữ ô → từ chối, nói rõ cách
--      làm (gộp một dòng, chốt, rồi chuyển ra quầy). Vì trigger chạy trong
--      kho_chot_phien_pha nên cả lần chốt không ghi gì.
--   3. Mở lại phiên (lô về null) → ô bỏ lô, như 0049.
-- Phiên không giao ô mã (không có dòng kho_o_ma_giao) không đổi gì: hai dòng
-- nhập kho vẫn chốt được như trước.
--
-- TRẢ Ô LÚC CHỐT (rà soát lần hai, cùng ngày): phần cắt giữ ô mà phiên chốt
-- KHÔNG có dòng nhập kho nào — chỉ chuyển thẳng bếp (đường này do mục 1 mở ra),
-- hoặc không cắt ra (kho_giao_o_ma giao ô cho mọi phần cắt có ô trong công thức;
-- có từ 0049) — để lại ô không lô trong khi phiên đã chốt. Ba chỗ đọc coi "ô
-- không lô" là phiên còn đang lóc: Beeftown Cân hiện "Đang lóc" và đếm ô đó là
-- đang dùng, phiếu quét nhãn và màn Quét nhãn nói "phiên lóc … chưa chốt" — đều
-- sai. Trigger mới kho_phien_pha_chot_tra_o_ma trên kho_phien_pha: phiên chuyển
-- sang da_chot → trả ngay (den_luc) các ô của phiên chưa gắn lô. Không khay nào
-- mang nhãn các ô đó nằm trên sổ, và kho_o_ma_con_giu vốn đã coi chúng là trống
-- (lần giao sau tự đóng) — nay đóng ngay lúc chốt. Lịch sử giao ô giữ nguyên.
-- Mở lại phiên rồi cần lại ô cho phần cắt đó thì bấm "Giao ô mã" lần nữa.
--
-- Không bảng, cột mới. Một hàm trigger mới (nội bộ, rút khỏi authenticated như
-- các trigger ô mã của 0049). create or replace giữ nguyên quyền của
-- kho_phien_pha_ra_o_ma. Không sửa dữ liệu: ô đang giao giữ nguyên lô đang trỏ.
-- Một câu raise exception mới — bản tiếng Anh ở web/src/lib/kho/cau-kho-en.ts.
-- =============================================================================


create or replace function kho_phien_pha_ra_o_ma()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_so_o   int;
  v_ma_can text;
  v_ten    text;
begin
  -- Mở lại phiên (lô về null): ô bỏ lô — như 0049.
  if new.lo_id is null then
    update kho_o_ma_giao g set lo_id = null
    from kho_o_ma o
    where o.id = g.o_ma_id and o.mat_hang_id = new.mat_hang_id
      and g.phien_pha_id = new.phien_pha_id and g.den_luc is null;
    return new;
  end if;

  -- 0086: phần chuyển thẳng bếp thành lô rồi xuất hết ngay trong lúc chốt —
  -- không khay nào mang nhãn ra quầy, ô không theo lô đó.
  if new.xu_ly is distinct from 'nhap_kho' then
    return new;
  end if;

  -- 0086: ô chỉ nhớ được MỘT lô. Ô của phần cắt này trong phiên đã có lô khác
  -- (một dòng nhập kho trước đó của cùng lần chốt) → hai lô, một ô: từ chối.
  select o.so_o, o.ma_can into v_so_o, v_ma_can
  from kho_o_ma_giao g join kho_o_ma o on o.id = g.o_ma_id
  where o.mat_hang_id = new.mat_hang_id and g.phien_pha_id = new.phien_pha_id
    and g.den_luc is null and g.lo_id is not null and g.lo_id <> new.lo_id
  limit 1;
  if found then
    select ten into v_ten from kho_mat_hang where id = new.mat_hang_id;
    raise exception '"%" đang giữ ô % (mã %): mỗi phiên pha lóc chỉ ghi một dòng nhập kho cho món này — gộp các dòng thành một, chốt phiên xong rồi chuyển phần cần ra quầy', v_ten, v_so_o, v_ma_can
      using errcode = 'check_violation';
  end if;

  update kho_o_ma_giao g set lo_id = new.lo_id
  from kho_o_ma o
  where o.id = g.o_ma_id and o.mat_hang_id = new.mat_hang_id
    and g.phien_pha_id = new.phien_pha_id and g.den_luc is null;
  return new;
end;
$$;

comment on function kho_phien_pha_ra_o_ma is
  'NỘI BỘ (trigger, 0049). Chốt phiên lóc → ô mã của phần cắt nhận lô ra; mở lại phiên → bỏ lô. 0086: ô chỉ theo lô của dòng NHẬP KHO (không theo lô chuyển thẳng bếp); dòng nhập kho thứ hai của cùng phần cắt đang giữ ô thì từ chối chốt.';


-- =============================================================================
-- CHỐT PHIÊN → TRẢ NGAY Ô KHÔNG CÓ LÔ NHẬP KHO
-- =============================================================================
create or replace function kho_phien_pha_chot_tra_o_ma()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Chạy sau khi kho_chot_phien_pha đã gắn lô cho mọi dòng nhập kho (trigger
  -- trên kho_phien_pha_ra): ô nào của phiên vẫn chưa có lô thì không có khay
  -- nào mang nhãn ô đó trên sổ.
  update kho_o_ma_giao set den_luc = now()
  where phien_pha_id = new.id and den_luc is null and lo_id is null;
  return new;
end;
$$;

comment on function kho_phien_pha_chot_tra_o_ma is
  'NỘI BỘ (trigger, 0086). Phiên lóc chuyển sang da_chot → trả ngay các ô mã của phiên chưa gắn lô (phần cắt chỉ chuyển thẳng bếp, hoặc không cắt ra).';

drop trigger if exists kho_phien_pha_chot_tra_o_ma_trigger on kho_phien_pha;
create trigger kho_phien_pha_chot_tra_o_ma_trigger
  after update of trang_thai on kho_phien_pha
  for each row when (new.trang_thai = 'da_chot' and old.trang_thai is distinct from 'da_chot')
  execute function kho_phien_pha_chot_tra_o_ma();


-- =============================================================================
-- HÀM NỘI BỘ — rút khỏi authenticated (như các trigger ô mã của 0049)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function kho_phien_pha_chot_tra_o_ma() from authenticated';
  end if;
end
$$;


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6. Giữ dòng ve_con_hieu_luc: xem 0025.
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
