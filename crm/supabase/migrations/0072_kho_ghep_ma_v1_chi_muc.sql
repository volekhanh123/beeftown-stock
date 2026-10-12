-- =============================================================================
-- BEEFTOWN KHO — 0072 · GHÉP MÓN iPOS BẰNG HÀM v1 BỎ Ô MÃ · CHỈ MỤC TRA NGƯỢC
-- =============================================================================
-- Rà soát nợ kỹ thuật 11/10/2026.
--
-- 1 · kho_ipos_gan_ma (v1, thân 0042) vẫn gọi được qua RPC — web đã dùng
--     kho_ipos_gan_ma_v2. 0051 thêm kho_ipos_ma_hang.o_ma_id (món iPOS bán theo
--     một ô của tảng; ràng buộc kho_ipos_ma_hang_o_ma_hop_le: có ô thì phải là
--     kiểu mon, có món) và dạy v2 "ghép lại = bỏ ô" — nhưng không đụng v1. Với
--     một món đang gắn ô, v1:
--       · ghép lại sang goi_can / bo_qua → vỡ ràng buộc (23514);
--       · ghép lại sang MÓN KHÁC → chạy được, o_ma_id vẫn trỏ ô của món cũ:
--         kho_ipos_ghi_dong ưu tiên ô, nên bán món này trừ lô của ô cũ chứ
--         không phải món vừa chọn — lệch kho lặng lẽ.
--     Vá v1 đúng như v2 (một dòng trong on conflict). Giữ hàm và quyền gọi:
--     test-kho-ipos, test-kho-dinh-luong, test-kho-ipos-callback dùng nó, và
--     GOI_DUOC (test-kho-quyen.mjs) đã xếp loại nó. Thân còn lại chép NGUYÊN VĂN
--     0042; chữ ký giữ nguyên.
--
-- 2 · Chỉ mục tra ngược: năm khóa ngoại kho được tra từ phía "cha" (truy vết
--     lô → phiếu nhập, phiên pha → lô ra, phiếu nhập → phiếu trả NCC, lô → dòng
--     xuất, lô → phiên pha đã dùng nó) mà không chỉ mục nào mở đầu bằng cột đó
--     (kho_phien_pha_vao_duy_nhat có lo_id nhưng ở vị trí thứ hai). Bốn cột cho
--     phép null: chỉ mục từng phần `where … is not null` (phần lớn dòng null).
--     Bảng còn nhỏ — create index thường (khóa ghi trong tích tắc), không cần
--     concurrently (không chạy được trong giao dịch của migration).
--
-- Kiểm thử: test-kho-ipos-ghep-ma-v1.mjs, test-kho-chi-muc-tra-nguoc.mjs mục 1.
-- =============================================================================


-- =============================================================================
-- 1 · kho_ipos_gan_ma (v1) — chép 0042, ghép lại = bỏ ô mã
-- =============================================================================
create or replace function kho_ipos_gan_ma(p_chi_nhanh_id uuid, p_ma_ipos text, p_kieu text, p_mat_hang_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma  text := nullif(btrim(p_ma_ipos), '');
  v_mh  kho_mat_hang;
  v_r   uuid;
  v_tt  text;
  v_dem jsonb := '{}';
  v_n   int := 0;
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không ghép được món iPOS' using errcode = 'insufficient_privilege';
  end if;
  if v_ma is null or char_length(v_ma) > 100 then
    raise exception 'Thiếu mã món iPOS' using errcode = 'check_violation';
  end if;
  if p_kieu is not null and p_kieu not in ('goi_can', 'mon', 'bo_qua') then
    raise exception 'Kiểu ghép phải là goi_can, mon hoặc bo_qua' using errcode = 'check_violation';
  end if;
  if p_kieu = 'mon' and p_mat_hang_id is null then
    raise exception 'Chọn món trong kho' using errcode = 'check_violation';
  end if;
  if p_kieu in ('mon', 'goi_can') and p_mat_hang_id is not null then
    select * into v_mh from kho_mat_hang where id = p_mat_hang_id;
    if not found then
      raise exception 'Không tìm thấy món trong kho' using errcode = 'check_violation';
    end if;
  end if;
  perform 1 from kho_cai_dat where chi_nhanh_id = p_chi_nhanh_id for update;

  if p_kieu is null then
    delete from kho_ipos_ma_hang where chi_nhanh_id = p_chi_nhanh_id and ma_ipos = v_ma;
  else
    insert into kho_ipos_ma_hang (chi_nhanh_id, ma_ipos, ten_ipos, kieu, mat_hang_id, nguoi_sua)
    values (p_chi_nhanh_id, v_ma,
            coalesce((select d.ten_ipos from kho_ipos_dong d where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = v_ma
                        and d.ten_ipos is not null order by d.created_at desc limit 1),
                     (select m.ten_ipos from kho_ipos_menu m where m.chi_nhanh_id = p_chi_nhanh_id and m.ma_ipos = v_ma)),
            p_kieu, case when p_kieu = 'bo_qua' then null else p_mat_hang_id end, (nhan_su_hien_tai()).id)
    on conflict (chi_nhanh_id, ma_ipos) do update set
      kieu = excluded.kieu, mat_hang_id = excluded.mat_hang_id, nguoi_sua = excluded.nguoi_sua,
      ten_ipos = coalesce(excluded.ten_ipos, kho_ipos_ma_hang.ten_ipos),
      don_vi_ban = case when excluded.kieu = kho_ipos_ma_hang.kieu then kho_ipos_ma_hang.don_vi_ban end,
      kg_moi_don_vi = case when excluded.kieu = kho_ipos_ma_hang.kieu then kho_ipos_ma_hang.kg_moi_don_vi end,
      o_ma_id = null;   -- 0072: ghép lại bằng hàm này = bỏ ô mã, như kho_ipos_gan_ma_v2 (0051)
  end if;

  for v_r in
    select d.id from kho_ipos_dong d
    where d.chi_nhanh_id = p_chi_nhanh_id and d.ma_ipos = v_ma and d.trang_thai = 'chua_khop'
    order by d.thoi_diem_ban, d.created_at
  loop
    v_tt := kho_ipos_ghi_dong(v_r);
    v_dem := jsonb_set(v_dem, array[v_tt], to_jsonb(coalesce((v_dem ->> v_tt)::int, 0) + 1));
    v_n := v_n + 1;
  end loop;

  return jsonb_build_object('ma_ipos', v_ma, 'kieu', p_kieu, 'so_dong', v_n, 'dong', v_dem);
end;
$$;

comment on function kho_ipos_gan_ma is
  'Ghép mã món iPOS với món kho (danh_muc): kieu mon | goi_can | bo_qua; p_kieu null = bỏ ghép. Xử lý lại ngay mọi dòng chua_khop cùng mã. Đổi kiểu → "bán theo" về mặc định; ghép lại = bỏ ô mã như v2 (0072) (0042; muốn chọn kg / gói / suất dùng kho_ipos_gan_ma_v2). Trả {ma_ipos, kieu, so_dong, dong{trạng thái: số}}.';

-- =============================================================================
-- 2 · Chỉ mục tra ngược
-- =============================================================================
create index if not exists kho_lo_phien_pha_idx
  on kho_lo (phien_pha_id) where phien_pha_id is not null;
create index if not exists kho_lo_phieu_nhap_dong_idx
  on kho_lo (phieu_nhap_dong_id) where phieu_nhap_dong_id is not null;
create index if not exists kho_phieu_xuat_phieu_nhap_idx
  on kho_phieu_xuat (phieu_nhap_id) where phieu_nhap_id is not null;
create index if not exists kho_phieu_xuat_dong_lo_idx
  on kho_phieu_xuat_dong (lo_id) where lo_id is not null;
create index if not exists kho_phien_pha_vao_lo_idx
  on kho_phien_pha_vao (lo_id);
