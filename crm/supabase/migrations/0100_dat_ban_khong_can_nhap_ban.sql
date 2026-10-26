-- =============================================================================
-- BEEFTOWN CRM — 0100 · ĐẶT BÀN KHÔNG CẦN NHẬP BÀN TRƯỚC
-- =============================================================================
-- Trước đây form đặt bàn chỉ mở khi bảng ban_an có bàn: so_ban_con_trong() đếm
-- bàn đang dùng trừ lượt đã đặt, bảng trống thì mọi khung giờ còn 0 bàn — web
-- hiện "chưa mở đặt bàn" và tao_dat_ban() báo "đã hết bàn". Ngày 26/10/2026 cả hai
-- công tắc (form_dat_ban_dang_mo, gio_phuc_vu_da_chot) đã bật mà form vẫn không
-- lên vì production có 0 bàn. Khánh quyết: mở luôn, không bắt nhập bàn.
--
-- Yêu cầu đặt bàn vốn chỉ là YÊU CẦU (cho_xac_nhan): nhân viên gọi lại xác nhận
-- từng cái. Nên:
--   · Chi nhánh CHƯA NHẬP BÀN NÀO (không dòng ban_an nào) → không tính sức chứa:
--     mọi khung giờ trong giờ mở cửa nhận yêu cầu. so_ban_con_trong() trả
--     2147483647 (số lớn nhất của integer = "không giới hạn"); con số không ra
--     tới trình duyệt — lich_trong_theo_ma() chỉ trả có/không, web và Messenger
--     bỏ cột con_trong.
--   · Đã nhập bàn → tính như cũ (0004), hết bàn thì báo hết bàn. Ngừng dùng hết
--     bàn = không còn chỗ (như cũ), KHÔNG phải "không giới hạn" — muốn đóng nhận
--     đặt bàn thì tắt ở /noi-bo/cai-dat; muốn quay lại không giới hạn thì xóa bàn.
-- Chặn gửi dồn vẫn giữ nguyên (0084: 3 yêu cầu chờ mỗi số điện thoại, 5 lượt mỗi
-- giờ mỗi IP); gửi lại y hệt trong 10 phút vẫn trả lại mã cũ (0062).
--
-- Thân hàm chép nguyên văn 0004, chỉ thêm khối 0100. Chữ ký giữ nguyên nên quyền
-- giữ nguyên (anon không gọi được hàm này — 0013 mục chốt quyền).
--
-- TRIỂN KHAI: chạy sau khi PR gộp, nguyên file ở SQL Editor → `npm run doi-chieu`
-- báo KHỚP → rồi mới deploy web: web mới bỏ đèn đỏ "form mở mà chưa có bàn"
-- (lib/suc-khoe.ts), deploy trước thì đèn xanh trong lúc form còn đóng.
-- Kiểm thử: crm/test/test-dat-ban-khong-ban.mjs.
-- =============================================================================

create or replace function so_ban_con_trong(
  p_chi_nhanh_id uuid,
  p_ngay         date,
  p_gio          time
)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cn        chi_nhanh;
  v_tong_ban  integer;
  v_da_dat    integer;
  v_bat_dau   timestamp;
  v_ket_thuc  timestamp;
begin
  select * into v_cn from chi_nhanh where id = p_chi_nhanh_id;
  if not found then
    return 0;
  end if;

  -- ---- 0100 · Chưa nhập bàn nào → không tính sức chứa ------------------------
  if not exists (select 1 from ban_an where chi_nhanh_id = p_chi_nhanh_id) then
    return 2147483647;
  end if;
  -- ---- Hết phần 0100 — từ đây là nguyên văn 0004 ------------------------------

  select count(*) into v_tong_ban
  from ban_an
  where chi_nhanh_id = p_chi_nhanh_id and dang_dung;

  v_bat_dau  := p_ngay + p_gio;
  v_ket_thuc := v_bat_dau + make_interval(mins => v_cn.thoi_luong_bua_phut);

  -- Đếm đặt bàn có khoảng [bắt đầu, kết thúc) giao với khung đang xét
  select count(*) into v_da_dat
  from dat_ban db
  where db.chi_nhanh_id = p_chi_nhanh_id
    and db.ngay = p_ngay
    and db.trang_thai in ('cho_xac_nhan', 'da_xac_nhan', 'da_den')
    and (db.ngay + db.gio) < v_ket_thuc
    and (db.ngay + db.gio + make_interval(mins => v_cn.thoi_luong_bua_phut)) > v_bat_dau;

  return greatest(v_tong_ban - v_da_dat, 0);
end;
$$;

comment on function so_ban_con_trong is
  'Số bàn còn nhận tại một khung giờ. Chi nhánh chưa nhập bàn nào: 2147483647 = không giới hạn (0100) — nhân viên gọi xác nhận từng yêu cầu.';

-- Mô tả công tắc ở màn Nội dung nói "CHỈ bật khi … đã nhập bàn thật vào ban_an" —
-- từ 0100 không còn đúng. Bản tiếng Anh: web/src/lib/cau-noi-bo.ts (MO_TA_KHOA_EN).
update khoa_cong_bo
   set mo_ta = 'Bật form đặt bàn. Chỉ bật khi có người gọi lại khách trong giờ mở cửa. Chưa nhập bàn thì nhận mọi yêu cầu trong giờ mở cửa; đã nhập bàn thì báo hết bàn khi kín.'
 where khoa = 'form_dat_ban_dang_mo';
