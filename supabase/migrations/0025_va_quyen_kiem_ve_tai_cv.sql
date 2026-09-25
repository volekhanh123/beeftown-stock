-- =============================================================================
-- BEEFTOWN CRM — 0025 · ANON PHẢI GỌI ĐƯỢC HÀM KIỂM VÉ TẢI CV
-- =============================================================================
-- (Số 0017–0024 đã có chủ ở các nhánh làm song song — module kho và bản vá
-- quyền hàm CRM — nên file này là 0025. Trước đây đánh số 0023, trùng với
-- 0023 của nhánh kho; đổi ngày 25/09/2026, thứ tự với 0026–0027 giữ nguyên.)
--
-- LỖI
--
-- Mục 1 của 0016 chẩn đúng bệnh của 0014: biểu thức trong policy storage
-- chạy DƯỚI QUYỀN ANON. Rồi khối chốt quyền cuối chính file đó lại làm ngược
-- với chẩn đoán: KHÔNG cấp EXECUTE trên ve_con_hieu_luc() cho anon, với lý do
-- "policy chạy dưới quyền của chính storage".
--
-- Không có "quyền của chính storage". Postgres tính biểu thức của policy như
-- một phần của câu lệnh, dưới vai đang chạy câu lệnh, và quyền EXECUTE được
-- kiểm với chính vai đó. security definer không cứu được: nó chỉ đổi vai BÊN
-- TRONG thân hàm, sau khi người gọi đã qua cửa EXECUTE. Supabase Storage đặt
-- vai theo JWT cho mỗi request — set_config('role', ...) — nên với khóa anon,
-- vai đó là anon.
--
-- Kết quả: mọi lượt tải CV bị từ chối với
--
--   42501  permission denied for function ve_con_hieu_luc
--
-- và nop-ho-so.ts nuốt lỗi đó đúng như thiết kế: hồ sơ vẫn nộp, CV thì không,
-- 100% số lần. Lỗi của 0014 còn nguyên, chỉ đổi câu báo lỗi. npm test không
-- bắt được vì PGlite không có schema storage.
--
-- KIỂM TAY — 2026-09-25, bước 6 của 0014 bằng khóa anon, trên Supabase thử
-- dựng cục bộ (Postgres 17.10 · storage-api v1.79.19 · PostgREST v13.0.8):
--
--   trước file này · tải lên <mã vé>/cv.pdf → 403 permission denied for
--                    function ve_con_hieu_luc
--   sau file này   · thành công; đường dẫn tự bịa và vé đã dùng vẫn bị từ chối
--
-- Chi tiết ở crm/README.md, mục "Nhật ký kiểm tay kho file".
--
-- CÁCH SỬA
--
-- Cấp EXECUTE trên ve_con_hieu_luc(text) cho anon. Nỗi lo "mở đường dò vé"
-- ở 0016 không đứng được:
--
--   · hàm chỉ trả boolean cho MỘT đoạn đường dẫn — không trả nội dung vé,
--     không liệt kê được vé nào;
--   · muốn dò trúng thì phải đoán một uuid ngẫu nhiên 122 bit;
--   · và chính policy storage đã là đúng câu hỏi đó: tải một file lên
--     <đoạn>/x là hỏi "đoạn này có phải vé còn hạn không". Gọi thẳng hàm
--     không cho biết thêm điều gì.
--
-- Website KHÔNG gọi hàm này qua RPC — chỉ policy storage gọi. Nên nó có mặt
-- trong DUOC_PHEP của test-an-toan.mjs (anon có quyền), nhưng vắng mặt trong
-- CONG_KHAI của test-hop-dong-web.mjs (mã web không được gọi).
--
-- CHO NGƯỜI VIẾT MIGRATION SAU
--
-- Mọi khối chốt quyền từ đây về sau PHẢI giữ dòng grant ve_con_hieu_luc.
-- Khối chốt quyền mở đầu bằng revoke trên MỌI hàm, nên chép danh sách từ một
-- file cũ hơn 0025 là âm thầm làm hỏng tải CV lần nữa. Thứ bắt được chuyện
-- đó là DUOC_PHEP trong test-an-toan.mjs và mục 7 của test-dat-noi-dung.mjs.
--
-- Khối chốt quyền của 0018–0022 viết trước file này nên chưa có dòng đó.
-- Trên database mới chúng chạy trước 0025 nên không sao — nhưng đừng chạy
-- chúng SAU 0025 trên một database đã có sẵn.
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
    -- Không phải để website gọi: policy ho_so_anon_tai_len_bang_ve trên
    -- storage.objects gọi nó dưới vai anon. Xem đầu file.
    execute 'grant execute on function ve_con_hieu_luc(text) to anon';

    -- Đo lường
    execute 'grant execute on function ghi_su_kien_web(text,text,uuid,text,text,text,text,text,text,text) to anon';
  end if;
end
$$;
