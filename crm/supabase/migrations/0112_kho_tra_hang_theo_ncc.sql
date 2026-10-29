-- =============================================================================
-- BEEFTOWN KHO — 0112 · TRẢ HÀNG NHÀ CUNG CẤP: CHỌN NHÀ CUNG CẤP TRƯỚC
-- =============================================================================
-- PHẢI CHẠY SAU 0040 (trả hàng hai bước, kho_tra_hang_ghi_kg) và 0031 (thủ kho không thấy tiền). Không đổi bảng hay
-- hàm cũ nào.
--
-- Khánh chốt 29/10/2026 ("làm tiếp các mục còn lại" — mục 5 của bản rà các màn kho): màn Trả hàng nhà cung cấp là
-- bảng mọi lô nhập mua, chỉ tìm bằng chữ. Chọn nhà cung cấp trước thì chỉ hiện lô của nhà cung cấp đó.
--
-- Vướng: lô biết NCC qua phiếu nhập (kho_lo → kho_phieu_nhap_dong → kho_phieu_nhap), mà thủ kho (vai nhap) không đọc
-- được hai bảng phiếu nhập — chúng có cột tiền (0031, policy xem_gia) — và cả bảng nhà cung cấp (policy xem_gia; màn
-- nhận hàng đọc tên NCC qua kho_ds_ncc_nhap). Hàm mới trả (lô, NCC, tên NCC): không tiền, không số phiếu.
--
-- Đổi trong file này:
--   1. kho_ncc_cua_lo(chi nhánh) — hàm đọc mới, vai nhap hoặc ke_toan của chi nhánh (đúng quyền màn trả hàng và
--      kho_tra_hang_ghi_kg): mỗi lô của phiếu MUA ĐÃ DUYỆT ở chi nhánh còn tồn ở kho / quầy → NCC của phiếu và tên
--      NCC (null nếu phiếu không ghi NCC; NCC đã ngừng giao dịch vẫn có tên — hàng của họ vẫn trả được). Lô tồn đầu,
--      lô pha lóc ra không có: kho_tra_hang_ghi_kg cũng không nhận chúng. Đi từ kho_ton (hàng đang có) chứ không từ mọi
--      lô từng nhập; xếp theo lô để web đọc từng trang 1.000 dòng (docTungTrang) nối khít.
--   2. Thu quyền: authenticated gọi được (tự kiểm vai ở câu đầu), anon thì không.
-- =============================================================================


-- =============================================================================
-- 1 · kho_ncc_cua_lo
-- =============================================================================
create or replace function kho_ncc_cua_lo(p_chi_nhanh_id uuid)
returns table (lo_id uuid, nha_cung_cap_id uuid, ten_nha_cung_cap text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (kho_duoc(p_chi_nhanh_id, 'nhap') or kho_duoc(p_chi_nhanh_id, 'ke_toan')) then
    raise exception 'Tài khoản của bạn không được xem hàng trả nhà cung cấp ở chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  return query
    select l.id, p.nha_cung_cap_id, n.ten
    from kho_lo l
    join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    join kho_phieu_nhap p on p.id = d.phieu_nhap_id
    left join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
    where l.id in (
        select t.lo_id
        from kho_ton t
        join kho_vi_tri v on v.id = t.vi_tri_id
        where t.chi_nhanh_id = p_chi_nhanh_id and v.loai in ('kho', 'quay') and (t.so_kg > 0 or t.so_goi > 0)
      )
      and l.chi_nhanh_id = p_chi_nhanh_id
      and p.chi_nhanh_id = p_chi_nhanh_id
      and p.loai = 'mua'
      and p.trang_thai = 'da_duyet'
    order by l.id;
end;
$$;

comment on function kho_ncc_cua_lo(uuid) is
  'Lô nhập mua (phiếu đã duyệt) còn tồn ở kho / quầy của chi nhánh → NCC của phiếu và tên NCC (0112). Vai nhap hoặc ke_toan. Không tiền, không số phiếu: thủ kho đọc được. Màn Trả hàng nhà cung cấp lọc lô theo NCC.';


-- =============================================================================
-- 2 · THU QUYỀN — đúng hàm của file này (0008 mục 6)
-- =============================================================================
do $$
begin
  execute 'revoke execute on function kho_ncc_cua_lo(uuid) from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function kho_ncc_cua_lo(uuid) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function kho_ncc_cua_lo(uuid) to authenticated';
  end if;
end
$$;
