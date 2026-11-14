-- =============================================================================
-- BEEFTOWN CRM — 0123 · KHO: CHỈ NỐI THÀNH NHÂN VIÊN MỘT TÀI KHOẢN ĐĂNG NHẬP VỪA TẠO
-- =============================================================================
-- LỖI (rà soát bảo mật 14/11/2026, tái hiện bằng Supabase Auth giả —
-- crm/test/test-kho-nhan-vien-tai-khoan.mjs)
--
-- Màn Cài đặt → Nhân viên tạo tài khoản bằng auth.signUp với khóa anon (0034), nên Supabase phải
-- mở đăng ký công khai: ai cũng đăng ký được một email bất kỳ. Khi Supabase bật "Confirm email"
-- và email đã có một tài khoản CHƯA xác nhận, lần đăng ký sau không báo lỗi và không đổi mật
-- khẩu — Supabase trả lại chính tài khoản cũ (mã nguồn công khai của Supabase Auth,
-- internal/api/signup.go). Web lấy uid đó gọi kho_them_nhan_su, và hàm này nối BẤT KỲ tài khoản
-- nào đang có trong auth.users, không xem nó được tạo lúc nào. Email đã bị người khác đăng ký
-- trước thì nhân viên mới mang mật khẩu của người đó; mật khẩu tạm chủ cầm không mở được gì.
--
-- HAI LỚP CHẶN
--
--   · web (cùng PR): themNhanVien đăng nhập thử bằng mật khẩu tạm trước khi nối
--     (web/src/lib/kho/nhan-vien.ts, thuMatKhauTam). Sai mật khẩu = tài khoản có từ trước = không nối.
--   · database (file này): một trigger trên nhan_su. Người đang đăng nhập gắn một tài khoản đăng
--     nhập vào dòng nhân sự (thêm dòng mới, hoặc đổi auth_uid của dòng cũ) thì tài khoản đó phải
--     được tạo trong 10 phút gần nhất. Lớp này đứng vững cả khi mã web bị sửa ngược: người đăng
--     ký trước phải đoán trúng chủ sẽ bấm tạo trong vòng 10 phút, và mỗi email chỉ đoán được một
--     lần (đăng ký lại không đổi created_at của tài khoản cũ).
--
-- VÌ SAO LÀ TRIGGER, KHÔNG THAY THÂN kho_them_nhan_su. Nhánh vai học viên (0119, đang chờ gộp) cũng
-- viết lại kho_them_nhan_su để nhận thêm vai hoc_vien. Hai file cùng "create or replace" một hàm
-- thì file chạy sau đè file chạy trước — bản của file này sẽ làm mất vai học viên. Trigger không
-- đụng thân hàm nào, nên hai PR gộp theo thứ tự nào cũng đúng; và mọi đường ghi nhan_su dưới một
-- phiên (kể cả chủ gọi thẳng bảng qua policy nhan_su_sua) đều qua cùng một luật.
--
-- VÌ SAO 10 PHÚT. Web gọi kho_them_nhan_su ngay sau auth.signUp, cùng một lần bấm — cách nhau vài
-- giây. 10 phút đủ rộng cho mạng chậm và đồng hồ lệch, đủ hẹp để một tài khoản đăng ký sẵn từ
-- hôm qua không lọt. Không đường hợp lệ nào nối một tài khoản cũ dưới một phiên: bước nối hỏng
-- thì màn hình đã bảo xóa tài khoản đăng nhập trong Supabase rồi tạo lại (tài khoản mới,
-- created_at mới).
--
-- KHÔNG PHIÊN THÌ BỎ QUA. Chủ, quản lý, thu ngân, marketing được tạo trong Supabase Studio rồi nối
-- auth_uid bằng SQL Editor / Table Editor (web/README.md) — tài khoản đó thường đã có từ lâu.
-- Trigger chỉ xét lời gọi có auth.uid(), như tim_hoac_tao_khach (0045) và hai trigger của 0122.
--
-- Hàm trigger là security definer: nó phải đọc auth.users (cột created_at) cả khi câu ghi chạy
-- dưới vai authenticated. Nó không trả gì ra ngoài câu báo bên dưới, đặt search_path, và không
-- ai gọi thẳng được (trigger chạy không cần quyền EXECUTE của người ghi). Trigger chạy SAU khi
-- dòng đã qua RLS (after insert or update), nên câu báo đó chỉ tới tay người được ghi nhan_su —
-- lý do ghi ngay trên câu create trigger.
--
-- Thứ tự câu báo của kho_them_nhan_su giữ nguyên: câu về quyền, vai, họ tên, chi nhánh, "Không
-- tìm thấy tài khoản đăng nhập vừa tạo", "đã gắn với một nhân sự khác" đều đến TRƯỚC câu insert —
-- người không phải chủ không dò được tuổi của một tài khoản.
--
-- CÂU MỚI (bản tiếng Anh ở web/src/lib/kho/cau-kho-en.ts):
--   'Tài khoản đăng nhập này có từ trước, không phải vừa tạo ở màn Nhân viên'
--
-- So sánh hai mốc timestamptz (now() trừ 10 phút) không phụ thuộc múi giờ — không cắt ngày.
-- Không sửa dữ liệu. Không câu delete. Chạy migration trước hay deploy web trước đều được: hai
-- lớp độc lập.
-- =============================================================================


create or replace function nhan_su_kiem_tai_khoan_vua_tao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tao_luc timestamptz;
begin
  if not co_phien_dang_nhap() or new.auth_uid is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.auth_uid is not distinct from old.auth_uid then
    return new;
  end if;

  select u.created_at into v_tao_luc from auth.users u where u.id = new.auth_uid;
  -- Không thấy tài khoản, không rõ tạo lúc nào, hay tạo quá 10 phút trước: đều từ chối.
  if v_tao_luc is null or v_tao_luc < now() - interval '10 minutes' then
    raise exception 'Tài khoản đăng nhập này có từ trước, không phải vừa tạo ở màn Nhân viên'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

comment on function nhan_su_kiem_tai_khoan_vua_tao() is
  'Trigger AFTER của nhan_su (0123): người đang đăng nhập gắn một tài khoản Supabase Auth vào dòng nhân sự thì tài khoản đó phải được tạo trong 10 phút gần nhất — tài khoản có từ trước mang mật khẩu của người đã đăng ký nó. Chạy sau RLS, nên chỉ người được ghi nhan_su mới thấy câu báo. Không phiên (SQL Editor, Table Editor) thì bỏ qua.';

-- AFTER, không BEFORE: trigger BEFORE chạy TRƯỚC khi RLS xét quyền ghi, nên một tài khoản đã đăng nhập nhưng không
-- được ghi nhan_su (quản lý, marketing, tài khoản lạ) thêm thử một dòng là đọc được từ câu lỗi rằng mã tài khoản nó
-- đưa vào có vừa được tạo hay không. Trigger AFTER chỉ chạy với dòng đã qua RLS (chủ, hoặc hàm definer của chủ);
-- người không có quyền ghi nhận câu lỗi của RLS, giống nhau cho mọi mã tài khoản. raise exception ở đây vẫn hủy
-- cả câu lệnh — dòng vừa ghi bị cuốn ngược lại.
create trigger nhan_su_kiem_tai_khoan_vua_tao_trigger
  after insert or update of auth_uid on nhan_su
  for each row execute function nhan_su_kiem_tai_khoan_vua_tao();


-- =============================================================================
-- QUYỀN — hàm trigger không ai gọi thẳng (trigger chạy không cần quyền EXECUTE của người ghi)
-- =============================================================================
revoke execute on function nhan_su_kiem_tai_khoan_vua_tao() from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function nhan_su_kiem_tai_khoan_vua_tao() from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function nhan_su_kiem_tai_khoan_vua_tao() from authenticated';
  end if;
end
$$;
