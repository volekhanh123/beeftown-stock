-- =============================================================================
-- BEEFTOWN CRM — 0015 · ĐẶT MỘT DỮ KIỆN TRONG MỘT GIAO DỊCH
-- =============================================================================
-- VẤN ĐỀ
--
-- Vòng đời ở 0010 là nhap → da_duyet → da_cong_bo, cộng thêm việc phải thu
-- hồi bản đang sống trước vì chỉ số unique từng phần chỉ cho phép một bản
-- da_cong_bo cho mỗi khóa. Đổi một dữ kiện là BỐN câu lệnh.
--
-- Bốn câu lệnh từ giao diện web là BỐN REQUEST HTTP riêng biệt. Giao diện
-- nội bộ được thiết kế cho điện thoại cầm tay ở công trường — nơi sóng rớt
-- giữa chừng là chuyện bình thường, không phải ngoại lệ. Mất sóng sau request
-- thứ nhất thì dữ kiện đã bị thu hồi mà bản mới chưa lên: ĐỊA CHỈ BIẾN MẤT
-- KHỎI TRANG CHỦ và không ai được báo.
--
-- Hướng hỏng đó tuy an toàn hơn hướng ngược lại (thà mất một dữ kiện còn hơn
-- công bố dữ kiện sai), nhưng vẫn là hỏng, và nó hỏng im lặng.
--
-- CÁCH SỬA
--
-- Một hàm, một giao dịch. Bốn bước thành công cùng nhau hoặc thất bại cùng
-- nhau; không còn trạng thái lưng chừng nào tồn tại được.
--
-- VÌ SAO KHÔNG security definer — điểm quan trọng nhất của file này.
--
-- Mọi hàm công khai trước đây đều là security definer, vì chúng phục vụ vai
-- anon vốn không có quyền vào bảng. Hàm này thì ngược lại: nó chạy cho một
-- NHÂN VIÊN ĐÃ ĐĂNG NHẬP, và toàn bộ luật về việc ai được công bố cái gì đã
-- nằm sẵn trong RLS của 0010 và trong trigger noi_dung_cong_bo_kiem_tra().
--
-- Để mặc định (security invoker) nghĩa là hàm này KHÔNG THỂ cấp thêm quyền
-- cho ai. Một người vai marketing gọi nó với p_cong_bo = true sẽ bị chính
-- trigger từ chối, y như khi họ gõ câu UPDATE bằng tay. Không có luật thứ
-- hai để lệch với luật thứ nhất.
-- =============================================================================


-- =============================================================================
-- 1 · ĐẶT GIÁ TRỊ CHO MỘT KHÓA
-- =============================================================================
create or replace function dat_noi_dung(
  p_khoa     text,
  p_text     text    default null,
  p_text_en  text    default null,
  p_ngay     date    default null,
  p_so       bigint  default null,
  p_bool     boolean default null,
  p_tep_id   uuid    default null,
  p_ly_do    text    default null,
  p_cong_bo  boolean default false   -- false = chỉ lưu nháp; true = đưa lên trang
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_khoa khoa_cong_bo;
  v_toi  nhan_su;
  v_id   uuid;
begin
  select * into v_khoa from khoa_cong_bo where khoa = p_khoa;
  if not found then
    -- Sổ đăng ký là danh sách đóng. Gõ sai tên khóa phải là lỗi ngay bây giờ,
    -- không phải một ô trống im lặng trên trang chủ ba tuần sau.
    raise exception 'Không có khóa công bố tên %', p_khoa
      using errcode = 'foreign_key_violation';
  end if;

  v_toi := nhan_su_hien_tai();

  -- Thu hồi bản đang sống TRƯỚC, vì chỉ số cong_bo_dang_song_idx chỉ cho
  -- phép một bản da_cong_bo cho mỗi khóa. Nằm trong cùng giao dịch nên nếu
  -- bước công bố bên dưới hỏng, câu này cũng bị cuốn ngược lại.
  if p_cong_bo then
    update noi_dung_cong_bo
       set trang_thai = 'da_thu_hoi',
           ly_do = coalesce(ly_do, 'Thay bằng bản mới')
     where khoa = p_khoa and trang_thai = 'da_cong_bo';
  end if;

  insert into noi_dung_cong_bo (
    khoa, kieu,
    gia_tri_text, gia_tri_text_en, gia_tri_ngay, gia_tri_so, gia_tri_bool, gia_tri_tep_id,
    trang_thai, ly_do, nguoi_tao)
  values (
    p_khoa, v_khoa.kieu,
    case when v_khoa.kieu in ('van_ban','url','sdt') then p_text end,
    case when v_khoa.kieu = 'van_ban' then nullif(btrim(p_text_en), '') end,
    case when v_khoa.kieu = 'ngay' then p_ngay end,
    case when v_khoa.kieu = 'so'   then p_so   end,
    case when v_khoa.kieu = 'bool' then p_bool end,
    case when v_khoa.kieu = 'tep'  then p_tep_id end,
    'nhap', nullif(btrim(p_ly_do), ''), v_toi.id)
  returning id into v_id;

  if p_cong_bo then
    -- Hai bước rời nhau vì trigger chỉ cho đi từng nấc một. Ai không đủ
    -- quyền sẽ dừng đúng ở đây, và cả giao dịch bị hủy.
    update noi_dung_cong_bo
       set trang_thai = 'da_duyet', nguoi_duyet = v_toi.id
     where id = v_id;
    update noi_dung_cong_bo
       set trang_thai = 'da_cong_bo'
     where id = v_id;
  end if;

  return v_id;
end;
$$;

comment on function dat_noi_dung is
  'Đặt giá trị cho một khóa công bố trong MỘT giao dịch: thu hồi bản cũ, thêm bản mới, duyệt, công bố. Chạy dưới quyền người gọi — RLS và trigger của 0010 vẫn là luật duy nhất.';


-- =============================================================================
-- 2 · THU HỒI
-- =============================================================================
-- Tách riêng vì đây là việc làm nhiều nhất khi có sự cố, và lúc đó người ta
-- cần đúng MỘT nút. Khi ngày khai trương bị dời, thứ cần nhất là gỡ ngày sai
-- khỏi trang trong vài giây — không phải soạn xong ngày mới rồi mới gỡ.
-- =============================================================================
create or replace function thu_hoi_noi_dung(
  p_khoa  text,
  p_ly_do text default null
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_so int;
begin
  update noi_dung_cong_bo
     set trang_thai = 'da_thu_hoi',
         ly_do = coalesce(nullif(btrim(p_ly_do), ''), ly_do)
   where khoa = p_khoa and trang_thai = 'da_cong_bo';

  get diagnostics v_so = row_count;
  return v_so > 0;
end;
$$;

comment on function thu_hoi_noi_dung is
  'Gỡ một dữ kiện khỏi trang công khai ngay lập tức. Trả về false nếu khóa đó vốn đã không được công bố.';


-- =============================================================================
-- 3 · BẢNG ĐIỀU KHIỂN CHO GIAO DIỆN NỘI BỘ
-- =============================================================================
-- Giao diện cần cả sổ đăng ký lẫn giá trị đang sống, trong một lần gọi. Làm
-- VIEW chứ không làm hàm, vì nó chỉ là một phép nối.
--
-- security_invoker PHẢI KHAI TƯỜNG MINH. Mặc định của Postgres là view chạy
-- dưới quyền NGƯỜI TẠO, nên một view mới sẽ đi xuyên qua RLS của bảng bên
-- dưới — đúng lỗ hổng số 2 mà 0008 đã vá. 0008 chỉ sửa được 7 view có mặt
-- lúc đó; mọi view thêm sau phải tự khai, và test-an-toan.mjs mục 2 liệt kê
-- pg_class để bắt đúng chuyện quên này.
-- =============================================================================
create or replace view v_bang_cong_tac as
select
  k.khoa,
  k.kieu,
  k.nhom,
  k.mo_ta,
  k.bat_buoc,
  k.chi_chu_so_huu,
  k.thu_tu,
  n.id              as ban_id,
  n.gia_tri_text,
  n.gia_tri_text_en,
  n.gia_tri_ngay,
  n.gia_tri_so,
  n.gia_tri_bool,
  n.gia_tri_tep_id,
  n.cong_bo_luc,
  n.ly_do,
  (n.id is not null) as dang_song
from khoa_cong_bo k
left join noi_dung_cong_bo n
       on n.khoa = k.khoa and n.trang_thai = 'da_cong_bo';

alter view v_bang_cong_tac set (security_invoker = true);

comment on view v_bang_cong_tac is
  'Sổ đăng ký khóa kèm giá trị đang được công bố. Một lần gọi là đủ dựng màn hình công tắc.';


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6
-- =============================================================================
-- Postgres cấp EXECUTE cho PUBLIC theo mặc định với MỌI hàm mới, và
-- alter default privileges KHÔNG ghi đè được mặc định đó. Nên mọi migration
-- tạo hàm phải kết thúc bằng khối này, nếu không hai hàm vừa viết ở trên sẽ
-- tự động mở cho anon.
--
-- test-an-toan.mjs so danh sách hàm anon gọi được với một danh sách 12 tên
-- viết cứng, nên quên khối này là npm test đỏ ngay.
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

    -- Đo lường
    execute 'grant execute on function ghi_su_kien_web(text,text,uuid,text,text,text,text,text,text,text) to anon';

    -- ĐÃ BỎ khỏi danh sách công khai, cố ý:
    --   lich_trong_theo_ngay(uuid,date)  — anon không có cách lấy uuid, và
    --   so_ban_con_trong(uuid,date,time) — trả về SỐ bàn, là một oracle sức
    --                                       chứa. Dùng lich_trong_theo_ma().
  end if;
end
$$;
