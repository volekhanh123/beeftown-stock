-- =============================================================================
-- BEEFTOWN — 0058 · SAO LƯU HẰNG ĐÊM: GHI LƯỢT CHẠY, ĐÈN "SAO LƯU"
-- =============================================================================
--
-- Trước migration này Beeftown không có bản sao lưu nào do mình giữ: repo không có script sao
-- lưu, và bản sao lưu của Supabase (nếu gói có) nằm cùng chỗ với database. Mất project (xoá
-- nhầm, tài khoản bị khoá, lỗi ghi đè) là mất sổ kho, công nợ, khách, đặt bàn.
--
-- Việc sao lưu chạy NGOÀI database: .github/workflows/sao-luu.yml mỗi đêm gọi
-- crm/sao-luu/sao-luu.sh (supabase db dump → nén → mã hoá AES-256) rồi khôi phục THỬ bản đó vào
-- một Supabase dựng tạm trong máy CI (crm/sao-luu/khoi-phuc.sh — đủ số dòng từng bảng, sổ kho
-- khớp tồn). Cuối lượt, workflow ghi MỘT dòng vào he_thong_sao_luu bằng chính chuỗi kết nối nó
-- dùng để sao lưu (vai postgres).
--
-- Database chỉ giữ dòng ghi đó để bảng sức khỏe ở /noi-bo có đèn "Sao lưu dữ liệu" — CLAUDE.md
-- mục 9: việc chạy nền mới phải có đèn, hỏng thì chủ thấy ngay chứ không đợi đến ngày cần khôi
-- phục mới biết. Màu và câu: web/src/lib/suc-khoe.ts — đỏ khi quá 36 giờ không có bản DÙNG ĐƯỢC
-- (đã sao lưu VÀ khôi phục thử đạt): bản sao không khôi phục được thì coi như không có.
--
-- Hàm đọc RIÊNG (suc_khoe_sao_luu), không nhét vào suc_khoe_he_thong(): nhánh "Báo động" (0056,
-- 0057, chưa gộp khi viết migration này) viết lại suc_khoe_he_thong() — định nghĩa lại thân hàm
-- đó ở đây thì PR nào gộp sau sẽ xoá thay đổi của PR kia. Web gọi hai hàm song song rồi gộp.
--
-- Ai đọc / ghi he_thong_sao_luu: không ai qua API. RLS bật, không có policy, anon và
-- authenticated bị thu hết quyền; chỉ vai postgres (workflow) ghi, và suc_khoe_sao_luu()
-- (security definer, chủ + quản lý) đọc. Kiểm ở crm/test/test-suc-khoe.mjs nhóm 12.
-- =============================================================================


-- =============================================================================
-- 1 · he_thong_sao_luu — mỗi lượt sao lưu một dòng
-- =============================================================================
create table he_thong_sao_luu (
  id            bigint generated always as identity primary key,
  -- Lúc lượt BẮT ĐẦU (workflow gửi lên): dữ liệu trong bản sao là của khoảng lúc này.
  bat_dau_luc   timestamptz not null,
  ket_thuc_luc  timestamptz not null default now(),
  ok            boolean not null,
  -- Cỡ file đã mã hoá (byte), số bảng / số dòng trong bản sao.
  kich_thuoc    bigint,
  so_bang       int,
  so_dong       bigint,
  -- Khôi phục thử vào Supabase dựng tạm: dat = đủ dòng từng bảng + sổ kho khớp; hong = không
  -- khôi phục được hoặc lệch; chua_thu = lượt sao lưu hỏng thì không có gì để thử.
  thu_khoi_phuc text not null default 'chua_thu' check (thu_khoi_phuc in ('dat', 'hong', 'chua_thu')),
  -- Một câu ngắn do workflow viết (bước nào hỏng) — không chép log thô, log có thể lộ chuỗi kết nối.
  loi           text check (loi is null or char_length(loi) <= 300),
  -- "<run_id>-<run_attempt>" của GitHub Actions: một lượt chạy chỉ ghi một dòng (bam-hai-lan).
  luot_chay     text not null unique check (luot_chay ~ '^[0-9]{1,20}-[0-9]{1,4}$'),
  -- coalesce: so sánh với null ra null, và CHECK coi null là đạt — thiếu coalesce thì một lượt "tốt"
  -- không có cỡ file vẫn ghi được (test-suc-khoe.mjs nhóm 12 bắt đúng lỗi này).
  check (not ok or (coalesce(kich_thuoc, 0) > 0 and coalesce(so_bang, 0) > 0 and coalesce(so_dong, -1) >= 0)),
  check (ok or thu_khoi_phuc = 'chua_thu'),
  check (bat_dau_luc <= ket_thuc_luc + interval '5 minutes')
);

comment on table he_thong_sao_luu is
  'Mỗi lượt sao lưu hằng đêm (.github/workflows/sao-luu.yml) một dòng. Chỉ workflow ghi (vai postgres); '
  'suc_khoe_sao_luu() đọc cho đèn "Sao lưu dữ liệu". Không đọc / ghi được qua API.';

create index he_thong_sao_luu_moi_nhat on he_thong_sao_luu (bat_dau_luc desc, id desc);

alter table he_thong_sao_luu enable row level security;
-- Không có policy nào: anon / authenticated không thấy dòng nào kể cả khi còn quyền bảng.

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on he_thong_sao_luu from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on he_thong_sao_luu from authenticated';
  end if;
end
$$;


-- =============================================================================
-- 2 · suc_khoe_sao_luu() — số liệu cho đèn "Sao lưu dữ liệu"
-- =============================================================================
-- Ai đọc được: như suc_khoe_he_thong() — chủ sở hữu và quản lý (sao lưu là việc của cả thương hiệu,
-- quản lý thấy cùng số liệu). Vai khác, người đã nghỉ, tài khoản máy, anon → insufficient_privilege
-- với ĐÚNG câu của suc_khoe_he_thong (web đã có bản tiếng Anh). Chỉ trả mốc giờ, cờ và cỡ file —
-- không trả câu lỗi (xem log lượt chạy ở GitHub Actions).
create or replace function suc_khoe_sao_luu()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_ns nhan_su;
  v_cuoi he_thong_sao_luu;
  v_dung he_thong_sao_luu;
begin
  v_ns := nhan_su_hien_tai();
  if v_ns.id is null or v_ns.vai_tro not in ('chu_so_huu', 'quan_ly') then
    raise exception 'Chỉ chủ sở hữu hoặc quản lý mới xem được sức khỏe hệ thống'
      using errcode = 'insufficient_privilege';
  end if;

  -- Lượt gần nhất, bất kể kết quả.
  select * into v_cuoi from he_thong_sao_luu s order by s.bat_dau_luc desc, s.id desc limit 1;
  -- Bản DÙNG ĐƯỢC gần nhất: sao lưu xong, đã lưu, VÀ khôi phục thử đạt. Mốc là lúc lượt bắt đầu —
  -- dữ liệu trong bản sao là của lúc đó.
  select * into v_dung from he_thong_sao_luu s
  where s.ok and s.thu_khoi_phuc = 'dat'
  order by s.bat_dau_luc desc, s.id desc limit 1;

  return jsonb_build_object(
    'lan_cuoi',       v_cuoi.bat_dau_luc,
    'lan_cuoi_ok',    v_cuoi.ok,
    'lan_cuoi_thu',   v_cuoi.thu_khoi_phuc,
    'dung_duoc_cuoi', v_dung.bat_dau_luc,
    'kich_thuoc',     v_dung.kich_thuoc);
end;
$$;

comment on function suc_khoe_sao_luu() is
  'Số liệu cho đèn "Sao lưu dữ liệu" ở /noi-bo (0058): lượt sao lưu gần nhất và bản dùng được (khôi phục thử đạt) gần nhất. '
  'Chủ và quản lý. Màu và câu chữ ở web/src/lib/suc-khoe.ts.';

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
