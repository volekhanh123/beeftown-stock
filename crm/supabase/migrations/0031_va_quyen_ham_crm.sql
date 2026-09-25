-- =============================================================================
-- BEEFTOWN CRM — 0031 · BA HÀM DEFINER CỦA CRM TỰ KIỂM VAI
-- =============================================================================
-- LỖI
--
-- ghi_luot_ghe(), tim_hoac_tao_khach() và xep_hang_gui_tin() là SECURITY
-- DEFINER: chạy dưới quyền chủ hàm nên đi xuyên RLS, và không tự kiểm vai trò
-- hay chi nhánh. Khối chốt quyền ở cuối mọi migration chỉ thu EXECUTE khỏi
-- public và anon — vai `authenticated` vẫn giữ EXECUTE mà Supabase cấp mặc
-- định cho mọi hàm mới. Nên MỌI phiên đăng nhập gọi được cả ba qua RPC:
--
--   · marketing gọi ghi_luot_ghe() là tự phát được điểm tích lũy. Điểm là
--     tiền, và 0001/0007 ghi rõ marketing KHÔNG được sửa điểm;
--   · ghi_luot_ghe() ghi created_by theo tham số p_nhan_su_id, nên sổ cái
--     điểm ghi danh bất kỳ ai người gọi khai;
--   · tim_hoac_tao_khach() với SĐT đã có thì UPDATE rồi trả về NGUYÊN dòng
--     khach_hang — dữ liệu cá nhân — cho cả vai mà RLS không cho thêm/sửa
--     khách;
--   · tệ nhất, một tài khoản Supabase Auth tự đăng ký, không có dòng nhan_su,
--     cũng làm được cả ba nếu dự án bật đăng ký.
--
-- 0018 đã dựng trigger chan_vai_ngoai_crm() chặn VAI KHO ghi vào bảng CRM,
-- và cố ý không đụng tới marketing hay tài khoản không phải nhân sự.
--
-- CÁCH SỬA
--
-- Mỗi hàm tự kiểm vai ngay đầu thân hàm, đúng khuôn tao_tin_tuyen_dung_mau()
-- ở 0012: `if co_phien_dang_nhap() and not ... then raise`. Không có phiên
-- đăng nhập — migration, seed, service_role, và khách đặt bàn trên website
-- (anon, auth.uid() null) — thì cho qua như cũ.
--
--   ghi_luot_ghe        chủ sở hữu, quản lý, thu ngân — VÀ đúng chi nhánh,
--                       y như policy luot_ghe_them và so_cai_them ở 0007.
--                       Người ghi lấy từ phiên đăng nhập, không tin tham số.
--   tim_hoac_tao_khach  chủ sở hữu, quản lý, thu ngân — y như policy
--                       khach_hang_them và khach_hang_sua ở 0007.
--   xep_hang_gui_tin    chủ sở hữu, quản lý, marketing — VÀ đúng chi nhánh,
--                       y như policy chien_dich_sua ở 0007.
--
-- Lỗi quyền dùng errcode insufficient_privilege (42501), giống trigger 0018:
-- PostgREST trả 403 thay vì 400, nên web phân biệt được "không có quyền" với
-- "dữ liệu sai".
--
-- ĐƯỜNG ĐẶT BÀN CÔNG KHAI KHÔNG ĐỔI. tao_dat_ban() gọi tim_hoac_tao_khach()
-- dưới anon, auth.uid() null, nên hàm cho qua. Website gọi tao_dat_ban() bằng
-- client anon không kèm phiên (web/src/lib/noi-dung.ts taoClient), kể cả khi
-- người bấm đang đăng nhập /noi-bo.
--
-- VÌ SAO KHÔNG THU EXECUTE KHỎI authenticated CHO XONG: /noi-bo gọi database
-- dưới vai authenticated (web/src/lib/phien.ts), và thu ngân sẽ cần gọi
-- ghi_luot_ghe() từ đó. Quyền ở đây phân theo VAI trong bảng nhan_su, mà
-- GRANT của Postgres không nhìn thấy bảng đó.
--
-- CHỮ KÝ GIỮ NGUYÊN từng tham số, từng giá trị mặc định (README, lưu ý 6).
-- Thân hàm chép NGUYÊN VĂN từ bản mới nhất — 0002, 0003, 0006; tới 0030 chưa
-- migration nào thay thân ba hàm này. Phần thêm chỉ nằm ở đầu, đánh dấu "0031".
--
-- GIỚI HẠN CÒN LẠI, cố ý chưa sửa ở đây:
--
--   · tim_hoac_tao_khach() vẫn trả nguyên dòng khách cho thu ngân / quản lý
--     của MỌI chi nhánh, tra bằng SĐT. SĐT là khóa toàn hệ thống và
--     ghi_luot_ghe() cần tìm ra khách cũ khi họ ghé chi nhánh mới, nên việc
--     tra chéo là thiết kế. Muốn trả ít cột hơn thì phải là một hàm MỚI:
--     create or replace không đổi được kiểu trả về.
--   · xep_hang_gui_tin() không kiểm khách có thuộc chi nhánh đó không. Muốn
--     lợi dụng thì phải biết uuid của một khách chi nhánh khác, mà RLS không
--     cho đọc uuid đó.
-- =============================================================================


-- =============================================================================
-- 1 · ghi_luot_ghe — chủ sở hữu, quản lý, thu ngân của ĐÚNG chi nhánh
-- =============================================================================
-- Người ghi: khi có phiên, created_by của lượt ghé và của các dòng sổ cái là
-- nhân sự ĐANG ĐĂNG NHẬP. p_nhan_su_id trỏ tới người khác thì từ chối chứ
-- không lặng lẽ sửa — sổ cái điểm là chứng từ, ghi danh người khác phải là một
-- lỗi nhìn thấy được. Không có phiên (POS chạy bằng service_role, seed) thì
-- vẫn tin tham số như cũ.
--
-- Gán đè p_nhan_su_id (tham số PL/pgSQL gán được) thay vì sửa ba chỗ dùng nó
-- bên dưới: nhờ vậy thân hàm từ dòng `if p_tong_hoa_don < 0` trở xuống giữ
-- nguyên văn 0003.
-- =============================================================================
create or replace function ghi_luot_ghe(
  p_chi_nhanh_id  uuid,
  p_sdt           text,
  p_tong_hoa_don  bigint,
  p_ho_ten        text    default null,
  p_so_khach      smallint default null,
  p_diem_muon_dung bigint default 0,
  p_la_khuyen_mai boolean default false,
  p_ma_hoa_don    text    default null,
  p_nhan_su_id    uuid    default null
)
returns table (
  luot_ghe_id  uuid,
  khach_hang_id uuid,
  diem_da_dung bigint,
  diem_tich_duoc bigint,
  so_du_moi    bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_khach   khach_hang;
  v_cau_hinh cau_hinh_tich_diem;
  v_so_du   bigint;
  v_dung    bigint := coalesce(p_diem_muon_dung, 0);
  v_tich    bigint := 0;
  v_luot    luot_ghe;
  v_nguoi_ghi uuid;  -- 0031
begin
  -- ---- 0031 · Ai được ghi lượt ghé và phát điểm ---------------------------
  if co_phien_dang_nhap() then
    if not (co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan']::vai_tro[])
            and duoc_truy_cap_chi_nhanh(p_chi_nhanh_id)) then
      raise exception 'Chỉ chủ sở hữu, quản lý hoặc thu ngân của chi nhánh này mới ghi được lượt ghé và điểm tích lũy'
        using errcode = 'insufficient_privilege';
    end if;

    v_nguoi_ghi := (nhan_su_hien_tai()).id;
    if p_nhan_su_id is not null and p_nhan_su_id <> v_nguoi_ghi then
      raise exception 'Không ghi được lượt ghé dưới tên một nhân sự khác'
        using errcode = 'insufficient_privilege';
    end if;
    p_nhan_su_id := v_nguoi_ghi;
  end if;
  -- ---- Hết phần 0031 — từ đây là nguyên văn 0003 --------------------------

  if p_tong_hoa_don < 0 then
    raise exception 'Tổng hóa đơn không được âm' using errcode = 'check_violation';
  end if;

  v_khach := tim_hoac_tao_khach(p_sdt, p_ho_ten, p_chi_nhanh_id);

  select * into v_cau_hinh from cau_hinh_tich_diem where chi_nhanh_id = p_chi_nhanh_id;
  if not found then
    raise exception 'Chi nhánh chưa có cấu hình tích điểm' using errcode = 'foreign_key_violation';
  end if;

  -- ---- Trừ điểm khách muốn dùng -------------------------------------------
  if v_dung > 0 then
    if not v_cau_hinh.dang_bat then
      raise exception 'Chương trình tích điểm chưa được bật cho chi nhánh này'
        using errcode = 'check_violation';
    end if;

    v_so_du := so_du_diem(v_khach.id);

    -- Luật 1: ngưỡng dùng tối thiểu
    if v_so_du < v_cau_hinh.nguong_dung_toi_thieu then
      raise exception 'Chưa đủ ngưỡng dùng điểm: cần tối thiểu %đ, hiện có %đ',
        v_cau_hinh.nguong_dung_toi_thieu, v_so_du
        using errcode = 'check_violation';
    end if;

    if v_dung > v_so_du then
      raise exception 'Không đủ điểm: số dư %đ, muốn dùng %đ', v_so_du, v_dung
        using errcode = 'check_violation';
    end if;

    if v_dung > p_tong_hoa_don then
      raise exception 'Không thể trừ %đ điểm cho hóa đơn %đ', v_dung, p_tong_hoa_don
        using errcode = 'check_violation';
    end if;
  end if;

  -- ---- Tạo lượt ghé --------------------------------------------------------
  insert into luot_ghe (chi_nhanh_id, khach_hang_id, so_khach,
                        tong_hoa_don, diem_da_dung, la_khuyen_mai,
                        ma_hoa_don, created_by)
  values (p_chi_nhanh_id, v_khach.id, p_so_khach,
          p_tong_hoa_don, v_dung, p_la_khuyen_mai,
          p_ma_hoa_don, p_nhan_su_id)
  returning * into v_luot;

  -- ---- Ghi sổ cái: trừ trước, cộng sau -------------------------------------
  if v_dung > 0 then
    insert into so_cai_diem (chi_nhanh_id, khach_hang_id, luot_ghe_id,
                             loai, so_diem, ly_do, created_by)
    values (p_chi_nhanh_id, v_khach.id, v_luot.id,
            'dung', -v_dung, 'Trừ vào hóa đơn ' || coalesce(p_ma_hoa_don, v_luot.id::text),
            p_nhan_su_id);
  end if;

  if v_cau_hinh.dang_bat then
    v_tich := tinh_diem_tich(p_tong_hoa_don, v_dung, p_la_khuyen_mai, v_cau_hinh.ty_le_tich);

    if v_tich > 0 then
      insert into so_cai_diem (chi_nhanh_id, khach_hang_id, luot_ghe_id,
                               loai, so_diem, ly_do, created_by)
      values (p_chi_nhanh_id, v_khach.id, v_luot.id,
              'tich', v_tich,
              'Tích ' || (v_cau_hinh.ty_le_tich * 100)::text || '% hóa đơn',
              p_nhan_su_id);
    end if;
  end if;

  return query
  select v_luot.id, v_khach.id, v_dung, v_tich, so_du_diem(v_khach.id);
end;
$$;

comment on function ghi_luot_ghe is
  'Điểm vào duy nhất cho thu ngân. Làm trọn trong một giao dịch: lượt ghé + trừ điểm + tích điểm. Có phiên đăng nhập thì chỉ chủ sở hữu, quản lý, thu ngân của đúng chi nhánh, và người ghi là người đang đăng nhập (0031).';


-- =============================================================================
-- 2 · tim_hoac_tao_khach — chủ sở hữu, quản lý, thu ngân
-- =============================================================================
-- Không kiểm chi nhánh, có chủ đích: SĐT là khóa toàn hệ thống, khách của chi
-- nhánh này ghé chi nhánh kia vẫn là MỘT hồ sơ — xem "Giới hạn còn lại" ở đầu
-- file. Policy khach_hang_them/khach_hang_sua cũng chỉ kiểm vai.
--
-- tao_dat_ban() của website gọi hàm này dưới anon: auth.uid() null thì
-- co_phien_dang_nhap() trả false và hàm cho qua.
--
-- HỆ QUẢ CẦN BIẾT: gọi tao_dat_ban() bằng MỘT PHIÊN đăng nhập không phải chủ
-- sở hữu / quản lý / thu ngân (marketing, vai kho, tài khoản không phải nhân
-- sự) giờ bị từ chối ngay ở bước tạo khách. Website không gặp vì luôn gọi
-- bằng client anon. Nếu sau này có tài khoản cho KHÁCH HÀNG đăng nhập, form
-- đặt bàn vẫn phải gọi bằng client anon — hoặc sửa chính hàm này.
-- =============================================================================
create or replace function tim_hoac_tao_khach(
  p_sdt        text,
  p_ho_ten     text default null,
  p_chi_nhanh  uuid default null,
  p_utm_source text default null,
  p_utm_medium text default null,
  p_utm_campaign text default null
)
returns khach_hang
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sdt   text := chuan_hoa_sdt(p_sdt);
  v_khach khach_hang;
begin
  -- ---- 0031 · Ai được tra cứu / tạo hồ sơ khách ---------------------------
  if co_phien_dang_nhap()
     and not co_vai_tro(array['chu_so_huu','quan_ly','thu_ngan']::vai_tro[]) then
    raise exception 'Chỉ chủ sở hữu, quản lý hoặc thu ngân mới tra cứu hay tạo được hồ sơ khách'
      using errcode = 'insufficient_privilege';
  end if;
  -- ---- Hết phần 0031 — từ đây là nguyên văn 0002 --------------------------

  if v_sdt is null or not sdt_hop_le(v_sdt) then
    raise exception 'Số điện thoại không hợp lệ: %', coalesce(p_sdt, '(rỗng)')
      using errcode = 'check_violation';
  end if;

  select * into v_khach from khach_hang where sdt = v_sdt;

  if found then
    -- Khách cũ: chỉ bổ sung thông tin còn thiếu, KHÔNG ghi đè dữ liệu đã có
    update khach_hang
    set ho_ten = coalesce(khach_hang.ho_ten, p_ho_ten)
    where id = v_khach.id
    returning * into v_khach;
    return v_khach;
  end if;

  insert into khach_hang (sdt, ho_ten, chi_nhanh_dau_tien,
                          nguon_utm_source, nguon_utm_medium, nguon_utm_campaign)
  values (v_sdt, p_ho_ten, p_chi_nhanh, p_utm_source, p_utm_medium, p_utm_campaign)
  returning * into v_khach;

  return v_khach;
end;
$$;

comment on function tim_hoac_tao_khach is
  'Điểm vào duy nhất để tạo khách. Chống trùng hồ sơ do SĐT khác định dạng. Có phiên đăng nhập thì chỉ chủ sở hữu, quản lý, thu ngân (0031); website đi qua tao_dat_ban() dưới anon.';


-- =============================================================================
-- 3 · xep_hang_gui_tin — chủ sở hữu, quản lý, marketing của ĐÚNG chi nhánh
-- =============================================================================
-- Thu ngân không chạy chiến dịch (chien_dich_sua ở 0007 không có thu_ngan).
-- Kiểm chi nhánh vì dòng nhat_ky_tin mang chi_nhanh_id do người gọi truyền:
-- thiếu nó thì marketing chi nhánh này ghi được tin — và chi phí ZBS — vào sổ
-- của chi nhánh khác.
-- =============================================================================
create or replace function xep_hang_gui_tin(
  p_chi_nhanh_id  uuid,
  p_khach_hang_id uuid,
  p_mau_tin_ma    text,
  p_noi_dung      text default null,
  p_chien_dich_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mau   mau_tin;
  v_khach khach_hang;
  v_check record;
  v_id    uuid;
begin
  -- ---- 0031 · Ai được xếp tin gửi khách -----------------------------------
  if co_phien_dang_nhap()
     and not (co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])
              and duoc_truy_cap_chi_nhanh(p_chi_nhanh_id)) then
    raise exception 'Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này mới xếp được tin gửi khách'
      using errcode = 'insufficient_privilege';
  end if;
  -- ---- Hết phần 0031 — từ đây là nguyên văn 0006 --------------------------

  select * into v_mau from mau_tin where ma = p_mau_tin_ma and dang_dung;
  if not found then
    raise exception 'Không tìm thấy mẫu tin %', p_mau_tin_ma
      using errcode = 'foreign_key_violation';
  end if;

  if not v_mau.da_duyet or v_mau.ma_zalo is null then
    raise exception 'Mẫu tin % chưa được Zalo duyệt', p_mau_tin_ma
      using errcode = 'check_violation';
  end if;

  select * into v_khach from khach_hang where id = p_khach_hang_id;
  if not found then
    raise exception 'Không tìm thấy khách hàng' using errcode = 'foreign_key_violation';
  end if;

  select * into v_check from duoc_phep_gui(p_khach_hang_id, v_mau.loai);
  if not v_check.duoc_gui then
    raise exception 'Không được phép gửi: %', v_check.ly_do
      using errcode = 'check_violation';
  end if;

  insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, mau_tin_id, chien_dich_id,
                           sdt_gui, noi_dung, ket_qua)
  values (p_chi_nhanh_id, p_khach_hang_id, v_mau.id, p_chien_dich_id,
          v_khach.sdt, coalesce(p_noi_dung, v_mau.noi_dung), 'cho_gui')
  returning id into v_id;

  return v_id;
end;
$$;

comment on function xep_hang_gui_tin is
  'Xếp một tin vào hàng gửi sau khi qua duoc_phep_gui(). Có phiên đăng nhập thì chỉ chủ sở hữu, quản lý, marketing của đúng chi nhánh (0031).';


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
