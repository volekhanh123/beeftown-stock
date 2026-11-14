-- =============================================================================
-- 0120 · VÁ QUYỀN NHỎ — hủy phiếu nhập kiểm quyền trước; thu quyền bảng thừa
-- =============================================================================
-- Hai lỗ nhỏ có từ trước, tìm thấy khi rà soát PR vai học viên (14/11/2026). Rất khó khai thác, vá sớm vì tài khoản
-- học viên dùng chung một mật khẩu cho cả lớp.
--
-- 1 · kho_huy_phieu_nhap trả "Phiếu … đã bị hủy trước đó." cho phiếu đã hủy, và ném "Không tìm thấy phiếu nhập" /
--     "Phiếu đang chờ duyệt…" / "Chỉ quản lý hủy được phiếu đã duyệt" TRƯỚC khi xét vai: tài khoản đăng nhập bất kỳ
--     biết mã (UUID) của một phiếu là đọc được số phiếu và trạng thái. Chép nguyên văn bản cuối (0035), chỉ đưa bước
--     kiểm quyền lên trước mọi câu trả về. Không câu raise mới, không đổi chữ câu cũ (bản tiếng Anh khớp theo chữ).
--
-- 2 · Quyền mặc định của Supabase cấp cho authenticated cả TRUNCATE, REFERENCES, TRIGGER và MAINTAIN (Postgres 17)
--     trên mọi bảng / view tạo ra — production 14/11/2026: 110 bảng / view của public. PostgREST không gọi được các
--     lệnh này, nhưng TRUNCATE bỏ qua RLS và MAINTAIN cho LOCK TABLE: thu đi cho chắc, cả cho bảng tạo sau này.
--     SELECT, INSERT, UPDATE, DELETE giữ nguyên.
--
-- Không câu delete. Không thêm giá trị enum. Chạy một lượt. Không cần deploy web (web không đổi).


-- =============================================================================
-- 1 · HỦY PHIẾU NHẬP — kiểm quyền trước mọi câu trả về
-- =============================================================================
-- Chép nguyên văn 0035; chỗ đổi có ghi "0120".
create or replace function kho_huy_phieu_nhap(p_id uuid, p_ly_do text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn    kho_phieu_nhap;
  v_dong  record;
  v_nv    nhan_su;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  if not found then
    -- 0120: người không được hủy phiếu ở chi nhánh nào nhận đúng câu như với phiếu có thật — không dò được mã nào
    -- có, mã nào không.
    if cardinality(kho_cn_duoc('nhap') || kho_cn_duoc('duyet') || kho_cn_duoc('ke_toan')) = 0 then
      raise exception 'Tài khoản của bạn không được hủy phiếu nhập' using errcode = 'insufficient_privilege';
    end if;
    raise exception 'Không tìm thấy phiếu nhập' using errcode = 'foreign_key_violation';
  end if;

  -- 0120: kiểm quyền TRƯỚC mọi câu trả về. Cửa vào là ba quyền mà các bước bên dưới kiểm (nhap: phiếu nháp, bị từ
  -- chối; duyet: phiếu đã duyệt; ke_toan: nợ đầu kỳ), ở chi nhánh của phiếu. Ai không qua: một câu chung — không số
  -- phiếu, không trạng thái, không loại phiếu. Kế toán qua cửa với phiếu mua / tồn đầu: họ đã xem được phiếu đó
  -- (xem_gia) và từ chối được phiếu chờ duyệt (duyet_nhap), nên câu "đã bị hủy trước đó" / "đang chờ duyệt" không
  -- lộ gì mới. Nợ đầu kỳ chỉ qua cửa ke_toan: thủ kho không thấy nợ đầu kỳ ở đâu cả, kể cả phiếu đã hủy.
  if not (kho_duoc(v_pn.chi_nhanh_id, 'nhap') or kho_duoc(v_pn.chi_nhanh_id, 'duyet')
          or kho_duoc(v_pn.chi_nhanh_id, 'ke_toan')) then
    raise exception 'Tài khoản của bạn không được hủy phiếu nhập' using errcode = 'insufficient_privilege';
  end if;
  if v_pn.loai = 'no_dau' and not kho_duoc(v_pn.chi_nhanh_id, 'ke_toan') then
    raise exception 'Chỉ kế toán hoặc quản lý hủy được nợ đầu kỳ' using errcode = 'insufficient_privilege';
  end if;

  if v_pn.trang_thai = 'da_huy' then
    return 'Phiếu ' || v_pn.so_phieu || ' đã bị hủy trước đó.';
  end if;
  if v_pn.trang_thai = 'cho_duyet' then
    raise exception 'Phiếu đang chờ duyệt — rút về hoặc từ chối trước khi hủy'
      using errcode = 'check_violation';
  end if;

  v_nv := nhan_su_hien_tai();

  -- 0035: nợ đầu kỳ — việc của kế toán. Không có lô, không có sổ kho: chỉ
  -- đổi trạng thái. Đã có thanh toán / giảm trừ thì trigger 0024 chặn.
  -- 0120: bước kiểm 'ke_toan' của nợ đầu kỳ đã đưa lên đầu hàm.
  if v_pn.loai = 'no_dau' then
    if coalesce(btrim(p_ly_do), '') = '' then
      raise exception 'Cần ghi lý do hủy nợ đầu kỳ' using errcode = 'check_violation';
    end if;
    perform 1 from kho_cai_dat where chi_nhanh_id = v_pn.chi_nhanh_id for update;
    select * into v_pn from kho_phieu_nhap where id = p_id for update;
    if v_pn.trang_thai <> 'da_duyet' then
      raise exception 'Phiếu vừa được người khác xử lý — tải lại trang' using errcode = 'check_violation';
    end if;
    update kho_phieu_nhap set
      trang_thai = 'da_huy', ly_do = btrim(p_ly_do),
      nguoi_huy = v_nv.id, huy_luc = now(), phien_ban = phien_ban + 1
    where id = p_id;
    return 'Đã hủy nợ đầu kỳ ' || v_pn.so_phieu || '.';
  end if;

  if v_pn.trang_thai in ('nhap', 'tu_choi') then
    if not kho_duoc(v_pn.chi_nhanh_id, 'nhap') then
      raise exception 'Tài khoản của bạn không được hủy phiếu nhập'
        using errcode = 'insufficient_privilege';
    end if;
    update kho_phieu_nhap set
      trang_thai = 'da_huy', ly_do = nullif(btrim(p_ly_do), ''),
      nguoi_huy = v_nv.id, huy_luc = now(), phien_ban = phien_ban + 1
    where id = p_id;
    return 'Đã hủy phiếu nháp ' || v_pn.so_phieu || '.';
  end if;

  -- Từ đây: phiếu đã duyệt. Cùng cửa với việc duyệt.
  if not kho_duoc(v_pn.chi_nhanh_id, 'duyet') then
    raise exception 'Chỉ quản lý hủy được phiếu đã duyệt' using errcode = 'insufficient_privilege';
  end if;
  if coalesce(btrim(p_ly_do), '') = '' then
    raise exception 'Cần ghi lý do hủy phiếu đã duyệt' using errcode = 'check_violation';
  end if;

  perform 1 from kho_cai_dat where chi_nhanh_id = v_pn.chi_nhanh_id for update;
  select * into v_pn from kho_phieu_nhap where id = p_id for update;
  if v_pn.trang_thai <> 'da_duyet' then
    raise exception 'Phiếu vừa được người khác xử lý — tải lại trang' using errcode = 'check_violation';
  end if;

  for v_dong in
    select d.lo_id, l.ma_lo,
           (select count(*) from kho_so_cai s where s.lo_id = d.lo_id) as so_dong
    from kho_phieu_nhap_dong d
    join kho_lo l on l.id = d.lo_id
    where d.phieu_nhap_id = p_id
  loop
    if v_dong.so_dong <> 1 then
      raise exception 'Không hủy được: lô % đã được dùng (pha lóc, chuyển, xuất hoặc kiểm kê). Hãy điều chỉnh qua kiểm kê.', v_dong.ma_lo
        using errcode = 'check_violation';
    end if;
  end loop;

  insert into kho_so_cai
    (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
     chung_tu_loai, chung_tu_id, dao_cua, ghi_chu, nguoi_ghi)
  select s.chi_nhanh_id, s.lo_id, s.vi_tri_id, s.mat_hang_id, 'dao_nguoc',
         -s.so_kg, -s.so_goi, 'phieu_nhap', p_id, s.id, 'Hủy phiếu nhập', v_nv.id
  from kho_so_cai s
  join kho_phieu_nhap_dong d on d.lo_id = s.lo_id
  where d.phieu_nhap_id = p_id and s.loai = 'nhap'
  order by d.thu_tu;

  update kho_phieu_nhap set
    trang_thai = 'da_huy', ly_do = btrim(p_ly_do),
    nguoi_huy = v_nv.id, huy_luc = now(), phien_ban = phien_ban + 1
  where id = p_id;

  return 'Đã hủy phiếu ' || v_pn.so_phieu || ' và trả tồn về như trước khi nhập.';
end;
$$;
-- create or replace giữ nguyên quyền gọi đang có: authenticated gọi được, anon không (test-kho-quyen.mjs, GOI_DUOC).


-- =============================================================================
-- 2 · THU TRUNCATE, REFERENCES, TRIGGER, MAINTAIN KHỎI anon VÀ authenticated
-- =============================================================================
-- Cùng ý với `revoke all` của 0099, 0102, 0117, nhưng cho MỌI bảng / view của public và cho cả bảng tạo sau này.
-- Không đụng SELECT, INSERT, UPDATE, DELETE (kể cả quyền theo cột) — RLS và các lệnh grant đã có vẫn y như cũ.
--
-- `on all tables` gồm cả view, materialized view, bảng ngoài. `alter default privileges` (không ghi `for role`) đổi
-- quyền mặc định của role đang chạy — trên Supabase là postgres, đúng role tạo mọi bảng của repo (production
-- 14/11/2026: 99 bảng, 28 view, chủ đều là postgres). Quyền mặc định của supabase_admin thì postgres không sửa được;
-- repo không tạo bảng bằng role đó. Như 0008 đã ghi: độ bền thật nằm ở kiểm thử —
-- test-quyen-bang-khong-truncate.mjs đỏ nếu một migration sau này `grant all` cho anon / authenticated.
do $$
declare
  v_vai text;
begin
  foreach v_vai in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = v_vai) then
      execute format('revoke truncate, references, trigger, maintain on all tables in schema public from %I', v_vai);
      execute format('alter default privileges in schema public revoke truncate, references, trigger, maintain on tables from %I', v_vai);
    end if;
  end loop;
end;
$$;
