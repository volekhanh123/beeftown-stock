-- =============================================================================
-- BEEFTOWN KHO — 0098 · DANH SÁCH PHIÊN PHA LÓC ĐẾM SỐ LÔ VÀO, KHÔNG ĐẾM DÒNG
-- =============================================================================
-- Danh sách phiên pha lóc (/noi-bo/kho/pha-loc) in "N lô vào (… kg)" cho phiên chưa chốt bằng cột
-- so_dau_vao của kho_v_phien_pha — mà cột đó là count(*) số DÒNG vào (0022, 0033). Một lô có thể có
-- nhiều dòng vào, mỗi vị trí một dòng: "Lóc #0142" một chạm (web, không migration) đưa vào phiên mọi
-- chỗ lóc được của tảng — kho lạnh và quầy — nên phiên một tảng hiện "2 lô vào".
--
-- Thêm cột so_lo_vao = số lô KHÁC NHAU của phiên, ở CUỐI view (giữ nguyên mọi cột cũ, chép 0033).
-- so_dau_vao giữ nguyên nghĩa số dòng (không đổi tên, không đổi cách tính — web cũ vẫn đọc được).
-- View vẫn security_invoker: ai đọc được kho_phien_pha_vao (0031) mới thấy số; không có tiền.
-- Không hàm mới, không bảng mới, không đổi quyền.
--
-- TRIỂN KHAI: chạy sau 0033 (cùng đợt với 0097) → `npm run doi-chieu` báo KHỚP → deploy web. Web mới
-- đọc cột so_lo_vao nên không đẩy web trước migration (danh sách phiên pha lóc sẽ báo lỗi đọc).
-- Kiểm thử: crm/test/test-kho-loc-tang-web.mjs (nhóm 4 và 14).
-- =============================================================================

create or replace view kho_v_phien_pha with (security_invoker = true) as
select p.id, p.chi_nhanh_id, p.so_phieu, p.trang_thai, p.phien_ban,
       p.mat_hang_vao_id, m.ten as ten_mat_hang_vao, m.ma as ma_mat_hang_vao,
       p.cong_thuc_id, p.ngay_pha, p.ghi_chu, p.ly_do,
       p.tong_kg_vao, p.tong_kg_thit, p.tong_kg_phu_pham, p.tong_kg_bo,
       p.tong_kg_hao_hut, p.ty_le_thu_hoi,
       p.nguoi_tao, p.nguoi_chot, p.chot_luc, p.created_at,
       (select count(*) from kho_phien_pha_vao v where v.phien_pha_id = p.id)::int as so_dau_vao,
       (select count(*) from kho_phien_pha_ra r where r.phien_pha_id = p.id)::int as so_dau_ra,
       (select coalesce(sum(v.so_kg), 0) from kho_phien_pha_vao v where v.phien_pha_id = p.id) as kg_vao_nhap,
       (select coalesce(sum(r.so_kg), 0) from kho_phien_pha_ra r where r.phien_pha_id = p.id) as kg_ra_nhap,
       -- 0033
       p.ty_le_du_kien, p.nguon_du_kien, p.thu_hoi_thap, p.da_xem_boi, p.da_xem_luc, p.da_xem_ghi_chu,
       (select count(*) from kho_phien_pha_quet q where q.phien_pha_id = p.id)::int as so_nhan_quet,
       -- 0098
       (select count(distinct v.lo_id) from kho_phien_pha_vao v where v.phien_pha_id = p.id)::int as so_lo_vao
from kho_phien_pha p
join kho_mat_hang m on m.id = p.mat_hang_vao_id;

comment on view kho_v_phien_pha is
  'Danh sách phiên pha lóc kèm tổng kết. Không có tiền. so_dau_vao là số DÒNG vào (mỗi lô mỗi vị trí một dòng); so_lo_vao (0098) là số LÔ khác nhau — danh sách in "N lô vào" bằng so_lo_vao.';
