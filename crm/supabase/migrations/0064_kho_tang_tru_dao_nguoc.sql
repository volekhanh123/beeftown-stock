-- =============================================================================
-- BEEFTOWN KHO — 0064 · SỐ CỦA TẢNG TRỪ DÒNG ĐẢO NGƯỢC
-- =============================================================================
-- LỖI (thấy ngày 11/10/2026 khi soát luồng trên máy chạy thử): trang truy vết
-- tảng #0001 ghi "Đã bán 3,342 kg" trong khi sổ ròng là 2,119 kg; thịt 15,228 ≠
-- bán 3,342 + huỷ 0,305 + còn 12,806. Báo cáo Xuất–nhập–tồn và Bán hàng thì đúng.
--
-- Sổ kho chỉ ghi thêm. Sửa sai = thêm một dòng loai 'dao_nguoc' trỏ về dòng gốc
-- (dao_cua), số ngược dấu: hoá đơn iPOS bị sửa / huỷ / gửi lại với nội dung
-- khác (kho_ipos_dao_dong — 0037, 0042), phiên lóc mở lại (kho_mo_lai_phien_pha
-- — 0033), huỷ phiếu nhập (0035), huỷ phiếu trả hàng (0040). Ba hàm cộng dòng
-- sổ theo s.loai mà không trừ dòng đảo, nên lần bán / xuất bếp đã bị đảo vẫn
-- được tính:
--   kho_bao_cao_tang  (0050) kg_ban, kg_bep, kg_huy (kéo theo ban_pt); ngay_het
--                            lấy cả ngày của dòng đảo (kéo theo so_ngay_ban).
--   kho_truy_vet_tang (0050) từng lô cắt: kg_ban, kg_bep, kg_huy, ngay_ban_cuoi.
--   kho_can_o_ma      (0054) kg_ban, goi_ban, kg_huy, kg_khac.
-- Rà cùng lỗi ở mọi hàm đọc kho_so_cai ra thêm một chỗ:
--   kho_bao_cao_ban_gio (0054) "giảm sớm" lấy hạn dùng nhỏ nhất của MỌI dòng sổ
--                            bán của dòng iPOS, kể cả dòng đã bị đảo khi hoá đơn
--                            sửa (lần ghi lại có thể rơi vào lô khác).
--
-- SỬA — như các báo cáo khác vẫn làm (0024, 0032, 0037, 0038, 0039, 0041, 0044):
--   left join kho_so_cai g on g.id = s.dao_cua, phân loại theo
--   coalesce(g.loai, s.loai). Dòng đảo ngược mang loại của dòng nó đảo nên hai
--   dòng tự triệt nhau (trigger kho_so_cai_ghi buộc dòng đảo cùng lô, cùng vị
--   trí, đúng số ngược dấu). "Ngày cuối" thì chỉ xét dòng CÒN HIỆU LỰC: không
--   phải dòng đảo và chưa bị dòng nào đảo.
--
-- THAY THÂN (cùng chữ ký, cùng cột trả về, cùng chỗ kiểm quyền) — chép nguyên
-- văn, chỗ đổi ghi 0064:
--   kho_bao_cao_tang, kho_truy_vet_tang — chép 0050.
--   kho_can_o_ma, kho_bao_cao_ban_gio   — chép 0054.
-- Không bảng, cột, hàm mới. Không đổi quyền: create or replace giữ nguyên quyền
-- đã cấp, cả bốn hàm vẫn tự kiểm kho_duoc() ở đầu thân. Không sửa dữ liệu: sổ
-- kho y nguyên, chỉ cách cộng đổi — chạy xong là số cũ tự đúng.
-- =============================================================================


-- =============================================================================
-- 1 · BÁO CÁO THEO TẢNG — mỗi tảng nhận trong kỳ một dòng (chép 0050)
-- =============================================================================
-- Quyền xem. Cột tiền (don_gia_ncc, gia_von_*) chỉ vai xem_gia, không thì null.
--   kg_ncc → kg_repack (hao_repack_pt) → kg_vao_loc → kg_thit / kg_phu_pham /
--   kg_bo / kg_hao_hut (thu_hoi_pt = thịt ÷ vào lóc) → kg_ban / kg_bep /
--   kg_huy / kg_con (tảng + mọi lô cắt ra). ngay_het: ngày của dòng sổ còn hiệu
--   lực cuối cùng khi đã hết sạch; so_ngay_ban = ngay_het − ngay_loc.
-- 0064: kg_ban / kg_bep / kg_huy là số RÒNG. Tảng đã lóc hết thì kg_thit +
--   kg_phu_pham khớp với kg_ban + kg_bep + kg_huy + kg_con; phần chênh đúng
--   bằng các dòng lệch cân, kiểm kê, xuất khác của các lô cắt.
create or replace function kho_bao_cao_tang(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  lo_id uuid, so_tang int, ma_lo text, mat_hang_id uuid, ten_hang text, ten_ncc text,
  phieu_nhap_id uuid, so_phieu_nhap text,
  ngay_mo date, ngay_nhan date, ngay_u_xong date, han_dung date, ngay_loc date, ngay_het date,
  kg_ncc numeric, kg_repack numeric, hao_repack_pt numeric,
  kg_vao_loc numeric, kg_thit numeric, kg_phu_pham numeric, kg_bo numeric, kg_hao_hut numeric, thu_hoi_pt numeric,
  kg_ban numeric, kg_bep numeric, kg_huy numeric, kg_con numeric, ban_pt numeric, so_ngay_ban int,
  tinh_trang text,
  don_gia_ncc bigint, gia_von_repack_kg bigint, gia_von_thit_kg bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_gia boolean;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 366 then
    raise exception 'Khoảng ngày tối đa 1 năm' using errcode = 'check_violation';
  end if;
  v_gia := kho_duoc(p_chi_nhanh_id, 'xem_gia');

  return query
  with t as (
    select l.id, l.so_tang, l.ma_lo, l.mat_hang_id, m.ten as ten_hang, l.ngay_mo, l.ngay_dong_goi as ngay_nhan,
           l.ngay_u_xong, l.han_dung, d.so_kg as kg_ncc, coalesce(d.so_kg_thuc, d.so_kg) as kg_repack,
           d.so_kg_thuc, d.don_gia_kg, p.id as pn_id, p.so_phieu as pn_so, n.ten as ten_ncc,
           lg.gia_von_kg
    from kho_lo l
    join kho_mat_hang m on m.id = l.mat_hang_id
    left join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
    left join kho_phieu_nhap p on p.id = d.phieu_nhap_id
    left join kho_nha_cung_cap n on n.id = p.nha_cung_cap_id
    left join kho_lo_gia lg on lg.lo_id = l.id
    where l.chi_nhanh_id = p_chi_nhanh_id and l.so_tang is not null
      and l.ngay_dong_goi between p_tu and p_den
  ),
  cay as (   -- tảng + mọi lô cắt ra
    select t.id as tang_id, t.id as lo_id from t
    union all
    select x.tang_goc_id, x.id from kho_lo x join t on t.id = x.tang_goc_id
  ),
  pha as (
    select v.lo_id as tang_id, min(f.ngay_pha) as ngay_loc, sum(v.so_kg) as kg_vao,
           sum(f.tong_kg_thit) as kg_thit, sum(f.tong_kg_phu_pham) as kg_pp,
           sum(f.tong_kg_bo) as kg_bo, sum(f.tong_kg_hao_hut) as kg_hh
    from kho_phien_pha_vao v
    join kho_phien_pha f on f.id = v.phien_pha_id and f.trang_thai = 'da_chot'
    where v.lo_id in (select t.id from t)
    group by v.lo_id
  ),
  so as (
    select cay.tang_id,
           -- 0064: dòng đảo ngược xét theo dòng nó đảo (g) — lần bán / xuất bếp / huỷ đã
           -- bị đảo tự triệt với dòng đảo của nó.
           -coalesce(sum(s.so_kg) filter (where coalesce(g.loai, s.loai) = 'ban'), 0)       as kg_ban,
           -coalesce(sum(s.so_kg) filter (where coalesce(g.loai, s.loai) = 'xuat_bep'), 0)  as kg_bep,
           -coalesce(sum(s.so_kg) filter (where coalesce(g.loai, s.loai) = 'huy'), 0)       as kg_huy,
           -- 0064: ngày sổ cuối chỉ xét dòng còn hiệu lực — không phải dòng đảo, chưa bị đảo.
           max(s.ngay) filter (where s.dao_cua is null and dao.id is null) as ngay_cuoi
    from cay join kho_so_cai s on s.lo_id = cay.lo_id
    left join kho_so_cai g on g.id = s.dao_cua
    left join kho_so_cai dao on dao.dao_cua = s.id
    group by cay.tang_id
  ),
  ton as (
    select cay.tang_id, coalesce(sum(x.so_kg), 0) as kg_con, coalesce(sum(x.so_goi), 0) as goi_con
    from cay join kho_ton x on x.lo_id = cay.lo_id
    group by cay.tang_id
  ),
  thit as (
    select cay.tang_id, sum(lg.gia_tri)::numeric / nullif(sum(lg.so_kg_goc), 0) as gia_kg
    from cay
    join kho_lo x on x.id = cay.lo_id and x.id <> cay.tang_id
    join kho_mat_hang m on m.id = x.mat_hang_id and m.loai <> 'phu_pham'
    join kho_lo_gia lg on lg.lo_id = x.id
    group by cay.tang_id
  )
  select t.id, t.so_tang, t.ma_lo, t.mat_hang_id, t.ten_hang, t.ten_ncc,
         case when v_gia then t.pn_id end, t.pn_so,
         t.ngay_mo, t.ngay_nhan, t.ngay_u_xong, t.han_dung, h.ngay_loc,
         case when coalesce(o.kg_con, 0) = 0 and coalesce(o.goi_con, 0) = 0 then s.ngay_cuoi end,
         round(t.kg_ncc, 3), round(t.kg_repack, 3),
         case when t.so_kg_thuc is not null and t.kg_ncc > 0
              then round((t.kg_ncc - t.so_kg_thuc) * 100 / t.kg_ncc, 2) end,
         round(h.kg_vao, 3), round(h.kg_thit, 3), round(h.kg_pp, 3), round(h.kg_bo, 3), round(h.kg_hh, 3),
         case when h.kg_vao > 0 then round(h.kg_thit * 100 / h.kg_vao, 2) end,
         round(coalesce(s.kg_ban, 0), 3), round(coalesce(s.kg_bep, 0), 3), round(coalesce(s.kg_huy, 0), 3),
         round(coalesce(o.kg_con, 0), 3),
         case when h.kg_thit > 0 then round(coalesce(s.kg_ban, 0) * 100 / h.kg_thit, 1) end,
         case when h.ngay_loc is not null and coalesce(o.kg_con, 0) = 0 and coalesce(o.goi_con, 0) = 0
              then s.ngay_cuoi - h.ngay_loc end,
         case when coalesce(o.kg_con, 0) = 0 and coalesce(o.goi_con, 0) = 0 then 'het'
              when h.ngay_loc is null then 'chua_loc'
              else 'dang_ban' end,
         case when v_gia then t.don_gia_kg end,
         case when v_gia then round(t.gia_von_kg)::bigint end,
         case when v_gia then round(th.gia_kg)::bigint end
  from t
  left join pha h on h.tang_id = t.id
  left join so s on s.tang_id = t.id
  left join ton o on o.tang_id = t.id
  left join thit th on th.tang_id = t.id
  order by t.ngay_nhan desc, t.so_tang desc;
end;
$$;

comment on function kho_bao_cao_tang is
  'Báo cáo theo tảng (quyền xem; 0050): mỗi tảng nhận trong kỳ — kg nhà cung cấp → sau repack → vào lóc → thịt / phụ phẩm / bỏ / hao hụt, đã bán / bếp / huỷ / còn, số ngày từ lóc tới bán hết, tình trạng chua_loc / dang_ban / het. Cột tiền (don_gia_ncc, gia_von_repack_kg, gia_von_thit_kg) và phieu_nhap_id chỉ vai xem_gia, không thì null. 0064: bán / bếp / huỷ là số RÒNG — đã trừ dòng đảo ngược (hoá đơn iPOS sửa / huỷ, phiên lóc mở lại); ngay_het là ngày của dòng sổ còn hiệu lực cuối cùng.';


-- =============================================================================
-- 2 · TRUY VẾT MỘT TẢNG (chép 0050)
-- =============================================================================
-- p_lo_id: tảng hoặc bất kỳ lô cắt ra từ nó. Quyền xem; tiền chỉ vai xem_gia.
-- Đầu trang (tang) là một dòng kho_bao_cao_tang nên tự đúng theo mục 1; ở đây
-- sửa số của TỪNG LÔ CẮT.
create or replace function kho_truy_vet_tang(p_lo_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tang kho_lo;
  v_gia  boolean;
  v_dong jsonb;
begin
  select t.* into v_tang
  from kho_lo l join kho_lo t on t.id = coalesce(l.tang_goc_id, l.id)
  where l.id = p_lo_id;
  if not found or not kho_duoc(v_tang.chi_nhanh_id, 'xem') then
    raise exception 'Không tìm thấy tảng, hoặc tài khoản không được xem'
      using errcode = 'insufficient_privilege';
  end if;
  if v_tang.so_tang is null then
    raise exception 'Lô % không thuộc tảng nào (món không theo dõi theo tảng)', v_tang.ma_lo
      using errcode = 'check_violation';
  end if;
  v_gia := kho_duoc(v_tang.chi_nhanh_id, 'xem_gia');

  select to_jsonb(r) into v_dong
  from kho_bao_cao_tang(v_tang.chi_nhanh_id, v_tang.ngay_dong_goi, v_tang.ngay_dong_goi) r
  where r.lo_id = v_tang.id;

  return jsonb_build_object(
    'co_gia', v_gia,
    'tang', v_dong,
    'ton_tang', coalesce((
      select jsonb_agg(jsonb_build_object('vi_tri', v.ten, 'loai_vi_tri', v.loai, 'so_kg', x.so_kg, 'so_goi', x.so_goi)
                       order by v.ten)
      from kho_ton x join kho_vi_tri v on v.id = x.vi_tri_id
      where x.lo_id = v_tang.id and (x.so_kg > 0 or x.so_goi > 0)), '[]'::jsonb),
    'phien', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', f.id, 'so_phieu', f.so_phieu, 'ngay_pha', f.ngay_pha, 'trang_thai', f.trang_thai,
               'kg_vao', v.so_kg, 'kg_thit', f.tong_kg_thit, 'kg_phu_pham', f.tong_kg_phu_pham,
               'kg_bo', f.tong_kg_bo, 'kg_hao_hut', f.tong_kg_hao_hut, 'ty_le_thu_hoi', f.ty_le_thu_hoi)
             order by f.ngay_pha, f.so_phieu)
      from kho_phien_pha_vao v join kho_phien_pha f on f.id = v.phien_pha_id
      where v.lo_id = v_tang.id and f.trang_thai <> 'da_huy'), '[]'::jsonb),
    'lo_ra', coalesce((
      select jsonb_agg(jsonb_build_object(
               'lo_id', x.id, 'ma_lo', x.ma_lo, 'mat_hang_id', x.mat_hang_id, 'ten_hang', m.ten,
               'loai_hang', m.loai, 'dem_goi', m.dem_goi, 'don_vi_goi', m.don_vi_goi,
               'han_dung', x.han_dung, 'ngay_loc', x.ngay_dong_goi,
               'kg_ra', lg.so_kg_goc,
               'gia_von_kg', case when v_gia then round(lg.gia_von_kg)::bigint end,
               'o_ma', (select jsonb_build_object('so_o', o.so_o, 'ma_can', o.ma_can, 'dang_giu', g.den_luc is null)
                          from kho_o_ma_giao g join kho_o_ma o on o.id = g.o_ma_id
                         where g.lo_id = x.id order by g.tu_luc desc limit 1),
               -- 0064: dòng đảo ngược xét theo dòng nó đảo (g) — như kho_bao_cao_tang.
               'kg_ban', -coalesce((select sum(s.so_kg) from kho_so_cai s left join kho_so_cai g on g.id = s.dao_cua
                                     where s.lo_id = x.id and coalesce(g.loai, s.loai) = 'ban'), 0),
               'kg_bep', -coalesce((select sum(s.so_kg) from kho_so_cai s left join kho_so_cai g on g.id = s.dao_cua
                                     where s.lo_id = x.id and coalesce(g.loai, s.loai) = 'xuat_bep'), 0),
               'kg_huy', -coalesce((select sum(s.so_kg) from kho_so_cai s left join kho_so_cai g on g.id = s.dao_cua
                                     where s.lo_id = x.id and coalesce(g.loai, s.loai) = 'huy'), 0),
               -- 0064: lần bán cuối CÒN HIỆU LỰC — dòng bán đã bị đảo (hoá đơn sửa / huỷ) không tính.
               'ngay_ban_cuoi', (select max(s.ngay) from kho_so_cai s
                                  where s.lo_id = x.id and s.loai = 'ban'
                                    and not exists (select 1 from kho_so_cai dao where dao.dao_cua = s.id)),
               'con', coalesce((
                 select jsonb_agg(jsonb_build_object('vi_tri', v.ten, 'loai_vi_tri', v.loai, 'so_kg', t.so_kg, 'so_goi', t.so_goi)
                                  order by v.ten)
                 from kho_ton t join kho_vi_tri v on v.id = t.vi_tri_id
                 where t.lo_id = x.id and (t.so_kg > 0 or t.so_goi > 0)), '[]'::jsonb))
             order by x.ngay_dong_goi, m.loai, m.ten, x.ma_lo)
      from kho_lo x
      join kho_mat_hang m on m.id = x.mat_hang_id
      left join kho_lo_gia lg on lg.lo_id = x.id
      where x.tang_goc_id = v_tang.id), '[]'::jsonb),
    'phieu_huy', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', x.id, 'so_phieu', x.so_phieu, 'trang_thai', x.trang_thai, 'ngay', x.created_at,
               'so_kg', (select sum(xd.so_kg) from kho_phieu_xuat_dong xd where xd.phieu_xuat_id = x.id))
             order by x.created_at, x.so_phieu)
      from kho_phieu_xuat x
      join kho_huy_tang h on h.id = x.huy_tang_id
      where h.tang_id = v_tang.id), '[]'::jsonb));
end;
$$;

comment on function kho_truy_vet_tang is
  'Truy vết một tảng (quyền xem; 0050): p_lo_id là tảng hoặc lô cắt ra từ nó. Trả {co_gia, tang (một dòng kho_bao_cao_tang), ton_tang[], phien[], lo_ra[{…, o_ma, kg_ban, kg_bep, kg_huy, con[]}], phieu_huy[]}. gia_von_kg và cột tiền của tang chỉ vai xem_gia. 0064: kg_ban / kg_bep / kg_huy của từng lô là số ròng (đã trừ dòng đảo ngược); ngay_ban_cuoi là ngày của lần bán cuối còn hiệu lực.';


-- =============================================================================
-- 3 · TẢNG & Ô MÃ cho Beeftown Cân (chép 0054)
-- =============================================================================
-- Mỗi ô: đang giữ tảng nào, lóc ra bao nhiêu, bán / huỷ / khác / còn bao nhiêu,
-- bán lệch ô mấy lần. 0064: bán / huỷ / khác là số ròng. Số lần bán đúng ô /
-- lệch ô đếm dòng iPOS đang da_ghi (dòng của hoá đơn huỷ đã là da_huy) — không đổi.
create or replace function kho_can_o_ma(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v jsonb;
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này' using errcode = 'insufficient_privilege';
  end if;

  select coalesce(jsonb_agg(x.o order by x.ten, x.so_o), '[]'::jsonb) into v
  from (
    select m.ten, o.so_o, jsonb_build_object(
      'o_ma_id', o.id, 'mat_hang_id', m.id, 'ten', m.ten, 'so_o', o.so_o, 'ma_can', o.ma_can,
      'giao_id', g.id, 'tu_luc', g.tu_luc,
      'phien_pha_id', p.id, 'so_phieu_loc', p.so_phieu, 'trang_thai_phien', p.trang_thai,
      'lo_id', g.lo_id, 'ma_lo', lr.ma_lo, 'han_dung', lr.han_dung,
      'so_tang', lt.so_tang, 'ma_lo_tang', lt.ma_lo,
      'kg_ra', ra.so_kg, 'goi_ra', ra.so_goi,
      'con_kg', coalesce(tr.so_kg, 0), 'con_goi', coalesce(tr.so_goi, 0),
      'kg_ban', coalesce(sc.kg_ban, 0), 'goi_ban', coalesce(sc.goi_ban, 0),
      'kg_huy', coalesce(sc.kg_huy, 0), 'kg_khac', coalesce(sc.kg_khac, 0),
      'so_ban_dung_o', coalesce(bn.dung, 0), 'so_lech_o', coalesce(bn.lech, 0),
      'con_giu', g.id is not null and ((g.lo_id is null and p.trang_thai = 'nhap')
                                       or coalesce(tr.so_kg, 0) > 0 or coalesce(tr.so_goi, 0) > 0)
    ) as o
    from kho_o_ma o
    join kho_mat_hang m on m.id = o.mat_hang_id and m.dang_dung
    left join kho_o_ma_giao g on g.o_ma_id = o.id and g.chi_nhanh_id = p_chi_nhanh_id and g.den_luc is null
    left join kho_phien_pha p on p.id = g.phien_pha_id
    left join kho_lo lr on lr.id = g.lo_id
    left join lateral (select min(v.lo_id::text)::uuid as lo_vao_id from kho_phien_pha_vao v
                       where v.phien_pha_id = g.phien_pha_id) lv on true
    left join kho_lo lt on lt.id = lv.lo_vao_id
    left join lateral (select sum(r.so_kg) as so_kg, sum(r.so_goi)::int as so_goi from kho_phien_pha_ra r
                       where r.lo_id = g.lo_id) ra on true
    left join lateral (select sum(t.so_kg) as so_kg, sum(t.so_goi)::int as so_goi from kho_ton t
                       where t.lo_id = g.lo_id) tr on true
    left join lateral (
      -- 0064: dòng đảo ngược xét theo dòng nó đảo (goc — chữ g ở hàm này đã là lần giao ô).
      select -sum(s.so_kg) filter (where coalesce(goc.loai, s.loai) = 'ban') as kg_ban,
             -sum(s.so_goi) filter (where coalesce(goc.loai, s.loai) = 'ban') as goi_ban,
             -sum(s.so_kg) filter (where coalesce(goc.loai, s.loai) = 'huy') as kg_huy,
             -sum(s.so_kg) filter (where coalesce(goc.loai, s.loai) in ('xuat_bep', 'xuat_khac', 'hao_hut', 'kiem_ke')) as kg_khac
      from kho_so_cai s
      left join kho_so_cai goc on goc.id = s.dao_cua
      where s.lo_id = g.lo_id and s.vi_tri_id in
        (select vt.id from kho_vi_tri vt where vt.chi_nhanh_id = p_chi_nhanh_id and vt.loai in ('quay', 'kho', 'cho_huy'))
    ) sc on true
    left join lateral (
      select count(*) filter (where not d.lech_o)::int as dung, count(*) filter (where d.lech_o)::int as lech
      from kho_ipos_dong d
      where d.chi_nhanh_id = p_chi_nhanh_id and d.o_ma_id = o.id and d.trang_thai = 'da_ghi'
        and d.thoi_diem_ban >= g.tu_luc
    ) bn on true
  ) x;
  return v;
end;
$$;

comment on function kho_can_o_ma is
  'Tảng & ô mã cho Beeftown Cân (quyền xem, 0054): mỗi ô mã của món đang dùng — tảng đang giữ ô (số tảng, lô vào), phiên lóc, lô ra (hạn), kg / gói lóc ra, còn, đã bán, huỷ, khác; số lần bán đúng ô và lệch ô từ lúc giao. Ô trống: các cột giao là null. Không có tiền. 0064: đã bán / huỷ / khác là số ròng (đã trừ dòng đảo ngược của hoá đơn iPOS sửa / huỷ).';


-- =============================================================================
-- 4 · BÁO CÁO BÁN THEO GIỜ (iPOS) — kèm bán giảm giá (chép 0054)
-- =============================================================================
-- Số dòng, kg, gói, doanh thu lấy từ dòng iPOS đang da_ghi của hoá đơn chưa huỷ
-- — không đổi. 0064: "giảm sớm" chỉ xét lô của dòng sổ bán còn hiệu lực.
create or replace function kho_bao_cao_ban_gio(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  ngay date, gio int, mat_hang_id uuid, ma text, ten text, nhom text,
  so_dong int, so_kg numeric, so_goi int, doanh_thu bigint,
  so_dong_giam int, so_kg_giam numeric, doanh_thu_giam bigint, tien_giam bigint, so_dong_giam_som int,
  so_dong_lech_o int
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem_gia') then
    raise exception 'Báo cáo bán có doanh thu — chỉ chủ, quản lý, kế toán xem được' using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 366 then
    raise exception 'Khoảng ngày tối đa 1 năm' using errcode = 'check_violation';
  end if;

  return query
  with d as (
    select dd.*, ((dd.thoi_diem_ban at time zone 'utc') + interval '7 hours') as luc_vn,
           m.ma as ma_mh, m.ten as ten_mh, m.nhom as nhom_mh, m.gia_ban_kg,
           coalesce(m.canh_bao_truoc_ngay, cd.canh_bao_truoc_ngay, 1) as canh_bao
    from kho_ipos_dong dd
    join kho_ipos_hoa_don h on h.id = dd.hoa_don_id and not h.da_huy
    join kho_mat_hang m on m.id = dd.mat_hang_id
    left join kho_cai_dat cd on cd.chi_nhanh_id = dd.chi_nhanh_id
    where dd.chi_nhanh_id = p_chi_nhanh_id and dd.trang_thai = 'da_ghi'
      and ((dd.thoi_diem_ban at time zone 'utc') + interval '7 hours')::date between p_tu and p_den
  ), x as (
    select d.*, d.luc_vn::date as ngay_vn, extract(hour from d.luc_vn)::int as gio_vn,
           -- Giảm sớm: mọi lô đã trừ còn hạn xa hơn mức cảnh báo lúc bán.
           d.ma_giam_id is not null and (
             select min(l.han_dung) from kho_so_cai s join kho_lo l on l.id = s.lo_id
             where s.chung_tu_loai = 'ban_hang' and s.chung_tu_id = d.id and s.loai = 'ban'
               -- 0064: chỉ dòng bán còn hiệu lực — hoá đơn sửa thì dòng cũ đã bị đảo, lô của nó không tính.
               and not exists (select 1 from kho_so_cai dao where dao.dao_cua = s.id)
           ) - d.luc_vn::date > d.canh_bao as giam_som
    from d
  )
  select x.ngay_vn, x.gio_vn, x.mat_hang_id, x.ma_mh, x.ten_mh, x.nhom_mh,
         count(*)::int,
         coalesce(sum(x.so_kg), 0),
         coalesce(sum(x.so_goi), 0)::int,
         coalesce(sum(x.thanh_tien), 0)::bigint,
         (count(*) filter (where x.ma_giam_id is not null))::int,
         coalesce(sum(x.so_kg) filter (where x.ma_giam_id is not null), 0),
         coalesce(sum(x.thanh_tien) filter (where x.ma_giam_id is not null), 0)::bigint,
         coalesce(sum(greatest(round(x.so_kg * x.gia_ban_kg) - coalesce(x.thanh_tien, 0), 0))
                    filter (where x.ma_giam_id is not null), 0)::bigint,
         (count(*) filter (where x.giam_som))::int,
         (count(*) filter (where x.lech_o))::int
  from x
  group by x.ngay_vn, x.gio_vn, x.mat_hang_id, x.ma_mh, x.ten_mh, x.nhom_mh
  order by 1, 2, 5;
end;
$$;

comment on function kho_bao_cao_ban_gio is
  'Bán theo ngày × giờ × món từ dòng iPOS đã trừ kho (xem_gia, 0054): số dòng, kg, gói, doanh thu; phần bán bằng mã giảm giá (kg, doanh thu, tiền đã giảm ước theo giá bán hiện tại, số dòng giảm SỚM — lô còn hạn xa hơn mức cảnh báo); số dòng lệch ô. Hoá đơn đã huỷ không tính. 0064: giảm sớm xét lô của dòng sổ bán còn hiệu lực (dòng đã bị đảo khi hoá đơn sửa không tính).';


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
