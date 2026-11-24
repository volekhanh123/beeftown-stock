-- =============================================================================
-- 0127 · TIN TUYỂN DỤNG CÔNG KHAI TRẢ THÊM NGÀY CÔNG BỐ (cong_bo_luc) — Khánh 24/11/2026
-- =============================================================================
-- PHẢI CHẠY SAU 0036 (thân tin_tuyen_dung_cong_khai mới nhất), 0027 / 0028 (trigger vi_tri_kiem_tra ghi cong_bo_luc).
--
-- Vì sao: trang /tuyen-dung, /en/jobs, /ko/jobs đã được viết để phát JSON-LD JobPosting cho Google for Jobs
-- (web/src/lib/tuyen-dung.ts → tinTuyenDungJsonLd), nhưng Google bắt buộc có ngày đăng THẬT (datePosted) và web
-- không được đoán ngày. Cột có sẵn từ 0012: vi_tri_tuyen_dung.cong_bo_luc, trigger ghi mốc mỗi lần tin chuyển sang
-- "đã công bố" (đăng lại tin đã gỡ cũng là một lần đăng — 0028). Chỉ có hàm công khai chưa trả cột này, nên trên web
-- thật chưa tin nào có JobPosting. Web đã gộp và deploy trước migration này: tin không có cong_bo_luc thì BỎ JobPosting
-- (không bịa ngày), nên chạy migration SAU hay TRƯỚC web đều không làm trang hỏng.
--
-- File này làm ĐÚNG MỘT việc: thêm cột cong_bo_luc (timestamptz) vào cuối kết quả của tin_tuyen_dung_cong_khai(text).
--   · Thân hàm chép nguyên văn từ 0036: cùng bộ lọc (công tắc hien_tuyen_dung, chỉ tin đã công bố, còn hạn nộp), cùng
--     thứ tự, cùng cách che lương chưa duyệt. Cột mới đứng CUỐI nên người đọc theo vị trí vẫn đúng; web đọc theo tên.
--   · Không lộ thêm gì: cong_bo_luc là ngày tin đang hiện trên trang (người đăng, người duyệt, mọi cột khác vẫn không
--     trả). Tin chưa công bố / đã gỡ / hết hạn nộp vẫn không ra khỏi hàm — cột mới không đổi dòng nào ra hay vào.
--   · KHÔNG điền giờ cho tin cũ: tin đã công bố từ trước 0027 (cong_bo_luc chưa từng được ghi) trả null và không có
--     JobPosting cho tới khi được đăng lại. Đúng ý — ngày đăng không đoán được thì không khai.
--
-- RETURNS TABLE đổi cột nên create or replace không dùng được (Postgres: "cannot change return type of existing
-- function") — như 0026 và 0028 đã làm: drop function rồi create lại NGAY trong file, cùng chữ ký (p_ngon_ngu text default
-- 'vi'), rồi đặt lại quyền như cuối 0101: không public, không anon rồi cấp lại cho anon; authenticated giữ quyền mặc định
-- của Supabase như trước. Hàm không có hàm hay view nào phụ thuộc (drop không cascade — có thì file này dừng, không
-- âm thầm xóa thứ khác).
--
-- Không có câu delete. Một câu drop function (trên), tạo lại ngay bên dưới với cùng quyền. Chỉ chạy lên production SAU khi
-- PR được gộp, bằng SQL Editor hoặc psql (không dùng apply_migration của Supabase MCP), cả file một lần (SQL Editor chạy
-- cả file trong một giao dịch — không có lúc nào hàm vắng mặt), rồi `npm run doi-chieu` phải báo KHỚP. Chạy migration
-- hay deploy web trước đều được; JobPosting chỉ xuất hiện khi web đang chạy đã nhận được ngày công bố từ database.
-- =============================================================================

drop function if exists tin_tuyen_dung_cong_khai(text);

create function tin_tuyen_dung_cong_khai(p_ngon_ngu text default 'vi')
returns table (
  ma            text,
  ten           text,
  bo_phan       bo_phan_tuyen,
  cap_bac       text,
  loai_hop_dong loai_hop_dong,
  so_luong      smallint,
  mo_ta         text,
  yeu_cau       text,
  quyen_loi     text,
  ca_lam        text,
  luong_tu      bigint,
  luong_den     bigint,
  luong_don_vi  don_vi_luong,
  han_nop       date,
  hoi_email       boolean,
  hoi_nam_sinh    boolean,
  hoi_ca_lam      boolean,
  hoi_gioi_thieu  boolean,
  hoi_kinh_nghiem boolean,
  hoi_cv          boolean,
  cong_bo_luc     timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.ma,
    chon_ngon_ngu(p_ngon_ngu, v.ten_vi, v.ten_en, v.ten_ko),
    v.bo_phan,
    chon_ngon_ngu(p_ngon_ngu, v.cap_bac, v.cap_bac_en, v.cap_bac_ko),
    v.loai_hop_dong,
    v.so_luong,
    chon_ngon_ngu(p_ngon_ngu, v.mo_ta_vi, v.mo_ta_en, v.mo_ta_ko),
    chon_ngon_ngu(p_ngon_ngu, v.yeu_cau_vi, v.yeu_cau_en, v.yeu_cau_ko),
    chon_ngon_ngu(p_ngon_ngu, v.quyen_loi_vi, v.quyen_loi_en, v.quyen_loi_ko),
    chon_ngon_ngu(p_ngon_ngu, v.ca_lam, v.ca_lam_en, v.ca_lam_ko),
    -- Ràng buộc bảng đã đảm bảo hai cột này chỉ có giá trị khi đã duyệt.
    v.luong_tu,
    v.luong_den,
    -- Đơn vị thì không có ràng buộc đó (cột not null), nên tự che ở đây.
    case when v.luong_da_duyet then v.luong_don_vi end,
    v.han_nop,
    v.hoi_email,
    v.hoi_nam_sinh,
    v.hoi_ca_lam,
    v.hoi_gioi_thieu,
    v.hoi_kinh_nghiem,
    v.hoi_cv,
    -- Mới (0127): ngày tin được đăng — web dùng làm datePosted của JobPosting. Tin cũ chưa từng ghi thì null.
    v.cong_bo_luc
  from vi_tri_tuyen_dung v
  where cong_tac_bat('hien_tuyen_dung')
    and v.trang_thai = 'da_cong_bo'
    and (v.han_nop is null or v.han_nop >= hom_nay_vn())
  order by v.bo_phan, v.ten_vi;
$$;

comment on function tin_tuyen_dung_cong_khai(text) is
  'CÔNG KHAI: tin tuyển dụng đã công bố, còn hạn nộp, khi công tắc hien_tuyen_dung bật. Lương chỉ trả khi đã duyệt. cong_bo_luc (0127) = lần đăng gần nhất của tin, dùng làm datePosted của JobPosting; null nếu tin đăng trước khi hệ thống ghi mốc này. Không trả người đăng, người duyệt, ghi chú nội bộ. anon gọi qua /tuyen-dung.';


-- =============================================================================
-- QUYỀN — hàm vừa tạo lại, nên đặt lại như cuối 0101 (cùng chữ ký, cùng quyền trước khi drop)
-- =============================================================================
revoke execute on function tin_tuyen_dung_cong_khai(text) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function tin_tuyen_dung_cong_khai(text) from anon';
    execute 'grant execute on function tin_tuyen_dung_cong_khai(text) to anon';
  end if;
end
$$;
