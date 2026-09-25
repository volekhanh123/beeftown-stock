-- =============================================================================
-- BEEFTOWN — 0019 · KHO · DANH MỤC, Ô THÔNG TIN THÊM, CÀI ĐẶT
-- =============================================================================
-- Mọi thứ chủ nhà hàng tự khai báo trên web, không cần lập trình viên:
--
--   kho_vi_tri          kho lạnh, quầy thịt, chỗ để hàng chờ hủy
--   kho_mat_hang        tảng nhập, phần cắt bán ở quầy, phụ phẩm
--   kho_mat_hang_gia    giá trị thu hồi của phụ phẩm — tách bảng vì là số
--                       liệu giá vốn, nhân viên quầy/bếp không được thấy
--   kho_cong_thuc_pha   công thức pha lóc mẫu: tảng này thường ra những gì
--   kho_nha_cung_cap    nhà cung cấp
--   kho_ly_do           lý do hủy, lý do xuất bếp, lý do điều chỉnh
--   kho_truong_them     Ô THÔNG TIN THÊM do chủ nhà hàng tự tạo
--   kho_cai_dat         cài đặt theo chi nhánh: mã vạch cân, cách tính giá vốn
--
-- Ô THÔNG TIN THÊM — VÌ SAO LÀ JSONB
--
-- 0010 tránh jsonb cho giá trị có kiểu, vì jsonb nhận mọi thứ và không ai kiểm.
-- Ở đây chủ nhà hàng cần tự thêm ô ("Xuất xứ", "Grade", "Nhiệt độ khi nhận")
-- mà không cần ai viết migration — nên cột phải mềm. Bù lại, mọi giá trị đi
-- qua kho_chuan_hoa_truong_them(): chỉ nhận đúng dạng chuẩn của từng kiểu,
-- khóa lạ bị từ chối. jsonb ở đây là một cái hộp có khóa, không phải thùng rác.
-- =============================================================================


-- =============================================================================
-- 1 · VỊ TRÍ KHO
-- =============================================================================
-- Ba loại:
--   kho     : kho lạnh, tủ mát — nơi để tảng và hàng dự trữ
--   quay    : quầy thịt khách tự chọn. Kiểm kê ở đây còn là cách biết số bán
--             khi chưa nối iPOS (xem kho_cai_dat.nguon_so_ban)
--   cho_huy : chỗ để hàng đang chờ quản lý duyệt hủy. Hàng chuyển sang đây
--             ngay khi có người báo hủy, để kiểm kê quầy không đếm hụt nó rồi
--             ghi nhầm thành "đã bán". Mỗi chi nhánh đúng một vị trí loại này,
--             chỉ kho_khoi_tao() tạo ra.
-- =============================================================================
create table kho_vi_tri (
  id           uuid primary key default gen_random_uuid(),
  chi_nhanh_id uuid not null references chi_nhanh(id) on delete restrict,
  ten          text not null,
  loai         text not null,
  dang_dung    boolean not null default true,
  thu_tu       int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint kho_vi_tri_loai_hop_le check (loai in ('kho', 'quay', 'cho_huy')),
  constraint kho_vi_tri_ten_hop_le  check (btrim(ten) <> '' and length(ten) <= 60)
);

create unique index kho_vi_tri_ten_idx on kho_vi_tri(chi_nhanh_id, lower(ten));
create unique index kho_vi_tri_cho_huy_idx on kho_vi_tri(chi_nhanh_id) where loai = 'cho_huy';

create trigger kho_vi_tri_updated_at
  before update on kho_vi_tri
  for each row execute function tu_dong_cap_nhat_updated_at();

-- Vị trí chờ hủy là một phần của quy trình duyệt hủy — không được đổi loại,
-- không được tắt. Chi nhánh của một vị trí cũng không đổi được: tồn kho đã
-- ghi theo nó.
create or replace function kho_vi_tri_kiem_sua()
returns trigger
language plpgsql
as $$
begin
  if new.chi_nhanh_id <> old.chi_nhanh_id then
    raise exception 'Không chuyển được vị trí kho sang chi nhánh khác'
      using errcode = 'check_violation';
  end if;
  if (old.loai = 'cho_huy' or new.loai = 'cho_huy') and new.loai <> old.loai then
    raise exception 'Không đổi được loại của vị trí chờ hủy'
      using errcode = 'check_violation';
  end if;
  if old.loai = 'cho_huy' and not new.dang_dung then
    raise exception 'Không tắt được vị trí chờ hủy — quy trình duyệt hủy cần nó'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger kho_vi_tri_kiem_sua_trigger
  before update on kho_vi_tri
  for each row execute function kho_vi_tri_kiem_sua();

comment on table kho_vi_tri is
  'Vị trí để hàng: kho lạnh, quầy thịt, chờ hủy. Tắt thì đặt dang_dung=false, không xóa — tồn kho và sổ kho tham chiếu tới nó.';


-- =============================================================================
-- 2 · Ô THÔNG TIN THÊM — định nghĩa và kiểm tra
-- =============================================================================
-- Đặt trước bảng mặt hàng vì trigger của các bảng sau gọi hàm kiểm tra ở đây.
--
-- khoa (tên máy) và kieu KHÔNG đổi được sau khi tạo: dữ liệu cũ đã lưu theo
-- chúng. Muốn đổi thì tắt ô cũ, tạo ô mới — giá trị cũ vẫn hiện, chỉ đọc.
-- nhan (tên hiển thị), bat_buoc, lua_chon, thu_tu thì sửa thoải mái.
-- =============================================================================
create table kho_truong_them (
  id         uuid primary key default gen_random_uuid(),
  doi_tuong  text not null,
  khoa       text not null,
  nhan       text not null,
  kieu       text not null,
  lua_chon   text[] not null default '{}',
  bat_buoc   boolean not null default false,
  goi_y      text,
  dang_dung  boolean not null default true,
  thu_tu     int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kho_truong_them_doi_tuong_hop_le
    check (doi_tuong in ('mat_hang', 'nha_cung_cap', 'phieu_nhap', 'lo_hang')),
  constraint kho_truong_them_khoa_hop_le check (khoa ~ '^[a-z][a-z0-9_]{0,39}$'),
  constraint kho_truong_them_nhan_hop_le check (btrim(nhan) <> '' and length(nhan) <= 80),
  constraint kho_truong_them_kieu_hop_le
    check (kieu in ('chu', 'so', 'ngay', 'chon', 'co_khong')),
  constraint kho_truong_them_lua_chon_hop_le
    check (kieu <> 'chon' or cardinality(lua_chon) >= 1),
  constraint kho_truong_them_duy_nhat unique (doi_tuong, khoa)
);

create trigger kho_truong_them_updated_at
  before update on kho_truong_them
  for each row execute function tu_dong_cap_nhat_updated_at();

create or replace function kho_truong_them_kiem_sua()
returns trigger
language plpgsql
as $$
begin
  if new.doi_tuong <> old.doi_tuong or new.khoa <> old.khoa or new.kieu <> old.kieu then
    raise exception 'Không đổi được kiểu hay tên máy của ô đã tạo. Hãy tắt ô cũ rồi tạo ô mới.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger kho_truong_them_kiem_sua_trigger
  before update on kho_truong_them
  for each row execute function kho_truong_them_kiem_sua();

comment on table kho_truong_them is
  'Ô thông tin thêm do chủ nhà hàng tự tạo cho mặt hàng, nhà cung cấp, phiếu nhập, lô hàng. khoa và kieu bất biến sau khi tạo.';

-- Kiểm và chuẩn hóa giá trị. Chỉ nhận dạng CHUẨN của từng kiểu — không đoán:
--   chu      : chuỗi, tối đa 500 ký tự (cắt khoảng trắng hai đầu)
--   so       : số JSON (không nhận chuỗi "12")
--   ngay     : chuỗi YYYY-MM-DD là một ngày có thật
--   chon     : chuỗi nằm trong lua_chon
--   co_khong : true / false của JSON
-- Ô trống (thiếu, null, chuỗi rỗng) bị bỏ khỏi kết quả. Khóa không có định
-- nghĩa bị TỪ CHỐI. Ô đã tắt giữ nguyên giá trị cũ, không kiểm lại.
--
-- p_kiem_bat_buoc: danh mục kiểm ngay khi lưu; chứng từ (phiếu nhập) chỉ kiểm
-- lúc gửi duyệt, để lưu nháp dở dang không bị chặn.
create or replace function kho_chuan_hoa_truong_them(
  p_doi_tuong     text,
  p_gia_tri       jsonb,
  p_kiem_bat_buoc boolean
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_ra   jsonb := '{}'::jsonb;
  v_dn   kho_truong_them;
  v_khoa text;
  v_gt   jsonb;
  v_chu  text;
begin
  if p_gia_tri is null or p_gia_tri = 'null'::jsonb then
    p_gia_tri := '{}'::jsonb;
  end if;
  if jsonb_typeof(p_gia_tri) <> 'object' then
    raise exception 'Ô thông tin thêm phải là một bộ tên → giá trị'
      using errcode = 'check_violation';
  end if;

  for v_khoa in select jsonb_object_keys(p_gia_tri) loop
    if not exists (select 1 from kho_truong_them
                   where doi_tuong = p_doi_tuong and khoa = v_khoa) then
      raise exception 'Ô thông tin "%" không tồn tại', v_khoa
        using errcode = 'check_violation';
    end if;
  end loop;

  for v_dn in
    select * from kho_truong_them where doi_tuong = p_doi_tuong order by thu_tu, nhan
  loop
    v_gt := p_gia_tri -> v_dn.khoa;

    if v_gt is null
       or v_gt = 'null'::jsonb
       or (jsonb_typeof(v_gt) = 'string' and btrim(v_gt #>> '{}') = '') then
      if p_kiem_bat_buoc and v_dn.dang_dung and v_dn.bat_buoc then
        raise exception 'Chưa điền ô bắt buộc: %', v_dn.nhan
          using errcode = 'check_violation';
      end if;
      continue;
    end if;

    if not v_dn.dang_dung then
      v_ra := v_ra || jsonb_build_object(v_dn.khoa, v_gt);
      continue;
    end if;

    if v_dn.kieu = 'chu' then
      if jsonb_typeof(v_gt) <> 'string' then
        raise exception 'Ô "%" phải là chữ', v_dn.nhan using errcode = 'check_violation';
      end if;
      v_chu := btrim(v_gt #>> '{}');
      if length(v_chu) > 500 then
        raise exception 'Ô "%" dài quá 500 ký tự', v_dn.nhan using errcode = 'check_violation';
      end if;
      v_ra := v_ra || jsonb_build_object(v_dn.khoa, v_chu);

    elsif v_dn.kieu = 'so' then
      if jsonb_typeof(v_gt) <> 'number' then
        raise exception 'Ô "%" phải là số', v_dn.nhan using errcode = 'check_violation';
      end if;
      v_ra := v_ra || jsonb_build_object(v_dn.khoa, v_gt);

    elsif v_dn.kieu = 'ngay' then
      v_chu := v_gt #>> '{}';
      if jsonb_typeof(v_gt) <> 'string' or v_chu !~ '^\d{4}-\d{2}-\d{2}$' then
        raise exception 'Ô "%" phải là ngày (năm-tháng-ngày)', v_dn.nhan
          using errcode = 'check_violation';
      end if;
      begin
        perform v_chu::date;
      exception when others then
        raise exception 'Ô "%": % không phải một ngày có thật', v_dn.nhan, v_chu
          using errcode = 'check_violation';
      end;
      v_ra := v_ra || jsonb_build_object(v_dn.khoa, v_chu);

    elsif v_dn.kieu = 'chon' then
      if jsonb_typeof(v_gt) <> 'string' or not ((v_gt #>> '{}') = any(v_dn.lua_chon)) then
        raise exception 'Ô "%" phải chọn một trong: %', v_dn.nhan, array_to_string(v_dn.lua_chon, ', ')
          using errcode = 'check_violation';
      end if;
      v_ra := v_ra || jsonb_build_object(v_dn.khoa, v_gt #>> '{}');

    elsif v_dn.kieu = 'co_khong' then
      if jsonb_typeof(v_gt) <> 'boolean' then
        raise exception 'Ô "%" phải là Có hoặc Không', v_dn.nhan using errcode = 'check_violation';
      end if;
      v_ra := v_ra || jsonb_build_object(v_dn.khoa, v_gt);
    end if;
  end loop;

  return v_ra;
end;
$$;

comment on function kho_chuan_hoa_truong_them is
  'Kiểm và chuẩn hóa ô thông tin thêm theo định nghĩa trong kho_truong_them. Từ chối khóa lạ và giá trị sai kiểu.';

-- Trigger dùng chung. tg_argv[0] = đối tượng, tg_argv[1] = có kiểm bắt buộc.
-- Chỉ kiểm khi cột truong_them thật sự đổi: thêm một ô bắt buộc mới không làm
-- mọi mặt hàng cũ bỗng không sửa được tên.
create or replace function kho_truong_them_kiem()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.truong_them is distinct from old.truong_them then
    new.truong_them := kho_chuan_hoa_truong_them(tg_argv[0], new.truong_them,
                                                 tg_argv[1]::boolean);
  end if;
  return new;
end;
$$;


-- =============================================================================
-- 3 · MẶT HÀNG
-- =============================================================================
-- Ba loại:
--   tang     : tảng / khối nhập về (thăn ngoại nguyên tảng, nạc vai...)
--   phan_cat : phần cắt đóng gói bán ở quầy
--   phu_pham : mỡ, xương, gân, thịt vụn — sinh ra khi pha lóc
--
-- dem_goi: mặt hàng quản lý theo GÓI/TẢNG (đếm được) hay chỉ theo kg. Phần
-- cắt và tảng thì đếm được; mỡ vụn đổ chung một khay thì chỉ cân.
--
-- ma_can: mã hàng trong mã vạch cân (5 số giữa của mã 2+5+5+1). Lưu KHÔNG có
-- số 0 đầu: nhãn in "00012" và người nhập gõ "12" phải là cùng một mặt hàng.
--
-- gia_ban_kg là giá bán công khai ở quầy — ai trong kho cũng được thấy. Giá
-- trị thu hồi của phụ phẩm là số liệu giá vốn nên nằm ở kho_mat_hang_gia.
-- =============================================================================
create table kho_mat_hang (
  id                  uuid primary key default gen_random_uuid(),
  ma                  text not null,
  ten                 text not null,
  ten_phu             text,
  nhom                text,
  loai                text not null,
  dem_goi             boolean not null default true,
  don_vi_goi          text not null default 'gói',
  han_dung_ngay       int,
  canh_bao_truoc_ngay int,
  gia_ban_kg          bigint,
  xu_ly_mac_dinh      text not null default 'nhap_kho',
  ma_can              text,
  ton_toi_thieu_kg    numeric(12,3),
  truong_them         jsonb not null default '{}',
  dang_dung           boolean not null default true,
  thu_tu              int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint kho_mat_hang_ma_hop_le    check (ma ~ '^[A-Z0-9][A-Z0-9_.-]{0,29}$'),
  constraint kho_mat_hang_ten_hop_le   check (btrim(ten) <> '' and length(ten) <= 120),
  constraint kho_mat_hang_loai_hop_le  check (loai in ('tang', 'phan_cat', 'phu_pham')),
  constraint kho_mat_hang_don_vi_hop_le check (btrim(don_vi_goi) <> '' and length(don_vi_goi) <= 20),
  constraint kho_mat_hang_han_hop_le   check (han_dung_ngay is null or han_dung_ngay between 1 and 3650),
  constraint kho_mat_hang_canh_bao_hop_le
    check (canh_bao_truoc_ngay is null or canh_bao_truoc_ngay between 0 and 365),
  constraint kho_mat_hang_gia_hop_le   check (gia_ban_kg is null or gia_ban_kg >= 0),
  constraint kho_mat_hang_xu_ly_hop_le check (xu_ly_mac_dinh in ('nhap_kho', 'chuyen_bep', 'bo')),
  constraint kho_mat_hang_ma_can_hop_le check (ma_can is null or ma_can ~ '^[1-9][0-9]{0,5}$'),
  constraint kho_mat_hang_ton_toi_thieu_hop_le
    check (ton_toi_thieu_kg is null or ton_toi_thieu_kg >= 0),
  constraint kho_mat_hang_truong_them_hop_le check (jsonb_typeof(truong_them) = 'object')
);

create unique index kho_mat_hang_ma_idx on kho_mat_hang(ma);
-- Một mã cân chỉ trỏ tới một mặt hàng ĐANG DÙNG, để đọc nhãn không bao giờ mơ hồ.
create unique index kho_mat_hang_ma_can_idx on kho_mat_hang(ma_can)
  where ma_can is not null and dang_dung;

create trigger kho_mat_hang_updated_at
  before update on kho_mat_hang
  for each row execute function tu_dong_cap_nhat_updated_at();

create or replace function kho_mat_hang_chuan_hoa()
returns trigger
language plpgsql
as $$
begin
  new.ma  := upper(btrim(new.ma));
  new.ten := btrim(new.ten);
  new.ten_phu := nullif(btrim(new.ten_phu), '');
  new.nhom    := nullif(btrim(new.nhom), '');
  new.ma_can  := nullif(ltrim(btrim(coalesce(new.ma_can, '')), '0'), '');
  return new;
end;
$$;

create trigger kho_mat_hang_chuan_hoa_trigger
  before insert or update on kho_mat_hang
  for each row execute function kho_mat_hang_chuan_hoa();

create trigger kho_mat_hang_truong_them_trigger
  before insert or update on kho_mat_hang
  for each row execute function kho_truong_them_kiem('mat_hang', 'true');

comment on table kho_mat_hang is
  'Danh mục mặt hàng kho, dùng chung toàn thương hiệu: tảng nhập, phần cắt bán ở quầy, phụ phẩm. Không xóa — tắt bằng dang_dung.';

create table kho_mat_hang_gia (
  mat_hang_id        uuid primary key references kho_mat_hang(id) on delete cascade,
  gia_tri_thu_hoi_kg bigint,
  updated_at         timestamptz not null default now(),

  constraint kho_mat_hang_gia_hop_le check (gia_tri_thu_hoi_kg is null or gia_tri_thu_hoi_kg >= 0)
);

create trigger kho_mat_hang_gia_updated_at
  before update on kho_mat_hang_gia
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_mat_hang_gia is
  'Giá trị thu hồi (đ/kg) của phụ phẩm khi được dùng lại — trừ vào giá vốn khi pha lóc. Tách bảng vì là số liệu giá vốn: chỉ vai xem_gia đọc được.';


-- =============================================================================
-- 4 · CÔNG THỨC PHA LÓC MẪU
-- =============================================================================
-- "Tảng thăn ngoại thường ra: thăn cắt lát ~75%, vụn ~8%, mỡ ~15%". Dùng để
-- điền sẵn phiếu pha lóc và so tỉ lệ thực tế với dự kiến. Không bắt buộc.
-- =============================================================================
create table kho_cong_thuc_pha (
  id              uuid primary key default gen_random_uuid(),
  mat_hang_vao_id uuid not null references kho_mat_hang(id) on delete restrict,
  ten             text not null,
  ghi_chu         text,
  dang_dung       boolean not null default true,
  thu_tu          int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint kho_cong_thuc_pha_ten_hop_le check (btrim(ten) <> '' and length(ten) <= 120)
);

create unique index kho_cong_thuc_pha_ten_idx on kho_cong_thuc_pha(mat_hang_vao_id, lower(ten));

create trigger kho_cong_thuc_pha_updated_at
  before update on kho_cong_thuc_pha
  for each row execute function tu_dong_cap_nhat_updated_at();

create table kho_cong_thuc_pha_dong (
  id             uuid primary key default gen_random_uuid(),
  cong_thuc_id   uuid not null references kho_cong_thuc_pha(id) on delete cascade,
  mat_hang_ra_id uuid not null references kho_mat_hang(id) on delete restrict,
  ty_le_du_kien  numeric(5,2),
  xu_ly          text,
  thu_tu         int not null default 0,

  constraint kho_cong_thuc_pha_dong_duy_nhat unique (cong_thuc_id, mat_hang_ra_id),
  constraint kho_cong_thuc_pha_dong_ty_le_hop_le
    check (ty_le_du_kien is null or ty_le_du_kien between 0 and 100),
  constraint kho_cong_thuc_pha_dong_xu_ly_hop_le
    check (xu_ly is null or xu_ly in ('nhap_kho', 'chuyen_bep', 'bo'))
);

create index kho_cong_thuc_pha_dong_cong_thuc_idx on kho_cong_thuc_pha_dong(cong_thuc_id);

-- Đầu vào phải là thứ có thể đem đi pha: tảng, hoặc phần cắt pha tiếp
-- (pha nhiều tầng). Phụ phẩm không pha tiếp.
create or replace function kho_cong_thuc_pha_kiem()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (select 1 from kho_mat_hang
                 where id = new.mat_hang_vao_id and loai in ('tang', 'phan_cat')) then
    raise exception 'Đầu vào công thức pha lóc phải là tảng hoặc phần cắt'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger kho_cong_thuc_pha_kiem_trigger
  before insert or update on kho_cong_thuc_pha
  for each row execute function kho_cong_thuc_pha_kiem();

comment on table kho_cong_thuc_pha is
  'Công thức pha lóc mẫu cho từng loại tảng: điền sẵn phiếu pha và làm mốc so tỉ lệ thu hồi thực tế.';


-- =============================================================================
-- 5 · NHÀ CUNG CẤP
-- =============================================================================
create table kho_nha_cung_cap (
  id            uuid primary key default gen_random_uuid(),
  ten           text not null,
  ma_so_thue    text,
  dien_thoai    text,
  email         text,
  dia_chi       text,
  nguoi_lien_he text,
  so_ngay_no    int not null default 0,
  ngan_hang     text,
  so_tai_khoan  text,
  ghi_chu       text,
  truong_them   jsonb not null default '{}',
  dang_dung     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint kho_nha_cung_cap_ten_hop_le check (btrim(ten) <> '' and length(ten) <= 160),
  constraint kho_nha_cung_cap_mst_hop_le
    check (ma_so_thue is null or ma_so_thue ~ '^[0-9]{10}(-[0-9]{3})?$'),
  constraint kho_nha_cung_cap_no_hop_le  check (so_ngay_no between 0 and 365),
  constraint kho_nha_cung_cap_truong_them_hop_le check (jsonb_typeof(truong_them) = 'object')
);

create unique index kho_nha_cung_cap_ten_idx on kho_nha_cung_cap(lower(ten));

create trigger kho_nha_cung_cap_updated_at
  before update on kho_nha_cung_cap
  for each row execute function tu_dong_cap_nhat_updated_at();

create trigger kho_nha_cung_cap_truong_them_trigger
  before insert or update on kho_nha_cung_cap
  for each row execute function kho_truong_them_kiem('nha_cung_cap', 'true');

comment on table kho_nha_cung_cap is
  'Nhà cung cấp thịt. so_ngay_no là hạn thanh toán mặc định tính từ ngày hóa đơn. Chỉ vai xem_gia đọc được.';


-- =============================================================================
-- 6 · LÝ DO
-- =============================================================================
-- can_anh: lý do này bắt buộc chụp ít nhất một ảnh (ví dụ hủy vì biến màu).
-- =============================================================================
create table kho_ly_do (
  id         uuid primary key default gen_random_uuid(),
  loai       text not null,
  ten        text not null,
  can_anh    boolean not null default false,
  dang_dung  boolean not null default true,
  thu_tu     int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint kho_ly_do_loai_hop_le check (loai in ('huy', 'xuat_bep', 'dieu_chinh')),
  constraint kho_ly_do_ten_hop_le  check (btrim(ten) <> '' and length(ten) <= 80)
);

create unique index kho_ly_do_ten_idx on kho_ly_do(loai, lower(ten));

create trigger kho_ly_do_updated_at
  before update on kho_ly_do
  for each row execute function tu_dong_cap_nhat_updated_at();


-- =============================================================================
-- 7 · CÀI ĐẶT KHO THEO CHI NHÁNH
-- =============================================================================
-- MẪU MÃ VẠCH — 13 ký tự, mỗi ký tự tả một chữ số của mã EAN-13 trên nhãn cân:
--   0-9 : chữ số cố định        X : chữ số bất kỳ
--   C   : mã hàng (ma_can)      W : trọng lượng      P : thành tiền
--   K   : số kiểm tra (cuối)
-- Mặc định '2XCCCCCWWWWWK' = cân Dahua TM-A kiểu 2+5+5+1: hai số đầu (số đầu
-- là 2), năm số mã hàng, năm số trọng lượng theo gram, một số kiểm tra.
-- null = chưa bật đọc nhãn.
--
-- Hai nhóm cài đặt, hai mức quyền:
--   danh_muc    : vị trí nhận hàng, mẫu mã vạch, số lẻ, ngày cảnh báo
--   cai_dat_goc : cách tính giá vốn, nguồn số bán, tự duyệt — đổi là đổi
--                 CON SỐ trong báo cáo, nên chỉ chủ nhà hàng.
-- =============================================================================
create table kho_cai_dat (
  chi_nhanh_id        uuid primary key references chi_nhanh(id) on delete cascade,
  vi_tri_nhan_hang_id uuid references kho_vi_tri(id) on delete set null,
  phuong_phap_gia_von text not null default 'gia_tri',
  chi_phi_vao_gia_von boolean not null default true,
  vat_vao_gia_von     boolean not null default false,
  nguon_so_ban        text not null default 'kiem_ke',
  cho_tu_duyet        boolean not null default true,
  mau_ma_vach         text default '2XCCCCCWWWWWK',
  so_le_kg            smallint not null default 3,
  canh_bao_truoc_ngay int not null default 1,
  updated_at          timestamptz not null default now(),

  constraint kho_cai_dat_gia_von_hop_le check (phuong_phap_gia_von in ('gia_tri', 'khoi_luong')),
  constraint kho_cai_dat_nguon_ban_hop_le check (nguon_so_ban in ('kiem_ke', 'ipos')),
  constraint kho_cai_dat_ma_vach_hop_le check (
    mau_ma_vach is null
    or (char_length(mau_ma_vach) = 13
        and mau_ma_vach ~ '^[0-9X]*C{1,6}[0-9X]*(W{3,6}|P{3,7})[0-9X]*K$')
  ),
  constraint kho_cai_dat_so_le_hop_le    check (so_le_kg between 0 and 3),
  constraint kho_cai_dat_canh_bao_hop_le check (canh_bao_truoc_ngay between 0 and 60)
);

create trigger kho_cai_dat_updated_at
  before update on kho_cai_dat
  for each row execute function tu_dong_cap_nhat_updated_at();

comment on table kho_cai_dat is
  'Cài đặt kho theo chi nhánh. Hàng này cũng là KHÓA XẾP HÀNG: mọi hàm ghi sổ kho khóa nó trước, để hai lệnh ghi cùng chi nhánh không chen nhau.';
comment on column kho_cai_dat.nguon_so_ban is
  'kiem_ke: chưa nối iPOS — kiểm kê quầy thấy thiếu thì ghi là đã bán. ipos: số bán đến từ iPOS — thiếu khi kiểm kê là hao hụt thật.';
comment on column kho_cai_dat.cho_tu_duyet is
  'Cho phép quản lý tự duyệt chứng từ do chính mình lập. Quán nhỏ cần bật; người duyệt luôn được ghi lại.';


-- =============================================================================
-- 8 · CÁC HÀM GHI CÀI ĐẶT VÀ KHỞI TẠO
-- =============================================================================
create or replace function kho_luu_cai_dat(
  p_chi_nhanh_id        uuid,
  p_vi_tri_nhan_hang_id uuid,
  p_mau_ma_vach         text,
  p_so_le_kg            int,
  p_canh_bao_truoc_ngay int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không được sửa cài đặt kho'
      using errcode = 'insufficient_privilege';
  end if;

  if p_vi_tri_nhan_hang_id is not null and not exists (
       select 1 from kho_vi_tri
       where id = p_vi_tri_nhan_hang_id and chi_nhanh_id = p_chi_nhanh_id
         and loai = 'kho' and dang_dung) then
    raise exception 'Vị trí nhận hàng phải là một kho đang dùng của chi nhánh này'
      using errcode = 'check_violation';
  end if;

  insert into kho_cai_dat (chi_nhanh_id) values (p_chi_nhanh_id)
  on conflict (chi_nhanh_id) do nothing;

  update kho_cai_dat set
    vi_tri_nhan_hang_id = p_vi_tri_nhan_hang_id,
    mau_ma_vach         = nullif(upper(btrim(coalesce(p_mau_ma_vach, ''))), ''),
    so_le_kg            = p_so_le_kg,
    canh_bao_truoc_ngay = p_canh_bao_truoc_ngay
  where chi_nhanh_id = p_chi_nhanh_id;
end;
$$;

create or replace function kho_luu_cai_dat_goc(
  p_chi_nhanh_id        uuid,
  p_phuong_phap_gia_von text,
  p_chi_phi_vao_gia_von boolean,
  p_vat_vao_gia_von     boolean,
  p_nguon_so_ban        text,
  p_cho_tu_duyet        boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not kho_duoc(p_chi_nhanh_id, 'cai_dat_goc') then
    raise exception 'Chỉ chủ nhà hàng đổi được cách tính giá vốn và nguồn số bán'
      using errcode = 'insufficient_privilege';
  end if;

  insert into kho_cai_dat (chi_nhanh_id) values (p_chi_nhanh_id)
  on conflict (chi_nhanh_id) do nothing;

  update kho_cai_dat set
    phuong_phap_gia_von = p_phuong_phap_gia_von,
    chi_phi_vao_gia_von = p_chi_phi_vao_gia_von,
    vat_vao_gia_von     = p_vat_vao_gia_von,
    nguon_so_ban        = p_nguon_so_ban,
    cho_tu_duyet        = p_cho_tu_duyet
  where chi_nhanh_id = p_chi_nhanh_id;
end;
$$;

-- Bắt đầu dùng kho cho một chi nhánh: cài đặt mặc định, ba vị trí, lý do
-- mặc định. Gọi lại bao nhiêu lần cũng được — chỉ tạo thứ còn thiếu.
-- Là một HÀM chứ không phải câu insert trong migration: lúc migration chạy,
-- bảng chi_nhanh có thể còn rỗng (bài học tao_tin_tuyen_dung_mau ở 0012).
create or replace function kho_khoi_tao(p_chi_nhanh_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tao   int := 0;
  v_so    int;
  v_kho   uuid;
begin
  if not kho_duoc(p_chi_nhanh_id, 'danh_muc') then
    raise exception 'Tài khoản của bạn không được khởi tạo kho'
      using errcode = 'insufficient_privilege';
  end if;

  insert into kho_cai_dat (chi_nhanh_id) values (p_chi_nhanh_id)
  on conflict (chi_nhanh_id) do nothing;
  get diagnostics v_so = row_count;
  v_tao := v_tao + v_so;

  if not exists (select 1 from kho_vi_tri where chi_nhanh_id = p_chi_nhanh_id and loai = 'kho') then
    insert into kho_vi_tri (chi_nhanh_id, ten, loai, thu_tu)
    values (p_chi_nhanh_id, 'Kho lạnh', 'kho', 1);
    v_tao := v_tao + 1;
  end if;
  if not exists (select 1 from kho_vi_tri where chi_nhanh_id = p_chi_nhanh_id and loai = 'quay') then
    insert into kho_vi_tri (chi_nhanh_id, ten, loai, thu_tu)
    values (p_chi_nhanh_id, 'Quầy thịt', 'quay', 2);
    v_tao := v_tao + 1;
  end if;
  if not exists (select 1 from kho_vi_tri where chi_nhanh_id = p_chi_nhanh_id and loai = 'cho_huy') then
    insert into kho_vi_tri (chi_nhanh_id, ten, loai, thu_tu)
    values (p_chi_nhanh_id, 'Hàng chờ hủy', 'cho_huy', 9);
    v_tao := v_tao + 1;
  end if;

  select id into v_kho from kho_vi_tri
  where chi_nhanh_id = p_chi_nhanh_id and loai = 'kho' and dang_dung
  order by thu_tu, created_at limit 1;

  update kho_cai_dat set vi_tri_nhan_hang_id = v_kho
  where chi_nhanh_id = p_chi_nhanh_id and vi_tri_nhan_hang_id is null;

  if not exists (select 1 from kho_ly_do) then
    insert into kho_ly_do (loai, ten, can_anh, thu_tu) values
      ('huy',        'Hết hạn dùng',           true,  1),
      ('huy',        'Biến màu, có mùi',       true,  2),
      ('huy',        'Rơi, dập, nhiễm bẩn',    true,  3),
      ('huy',        'Bao bì hỏng, hở khí',    true,  4),
      ('huy',        'Khác',                   true,  9),
      ('xuat_bep',   'Gần hết hạn',            false, 1),
      ('xuat_bep',   'Làm món ở bếp',          false, 2),
      ('xuat_bep',   'Cơm nhân viên',          false, 3),
      ('xuat_bep',   'Khác',                   false, 9),
      ('dieu_chinh', 'Chênh lệch kiểm kê',     false, 1),
      ('dieu_chinh', 'Nhập sai',               false, 2);
    v_tao := v_tao + 11;
  end if;

  return v_tao;
end;
$$;

comment on function kho_khoi_tao is
  'Bắt đầu dùng kho cho một chi nhánh: cài đặt, ba vị trí (kho lạnh, quầy, chờ hủy), lý do mặc định. Gọi lại an toàn — chỉ tạo thứ còn thiếu.';

-- Danh mục mẫu cho quán bò nướng: vài tảng nhập khẩu phổ biến, phần cắt tương
-- ứng và phụ phẩm. CHỈ chạy khi danh mục còn rỗng, và chỉ là điểm khởi đầu —
-- tên, hạn dùng, giá đều sửa được. Không đặt giá bán: giá phải do người thật
-- quyết định.
create or replace function kho_tao_danh_muc_mau()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_so int;
begin
  if not kho_co_quyen('danh_muc') then
    raise exception 'Tài khoản của bạn không được sửa danh mục kho'
      using errcode = 'insufficient_privilege';
  end if;
  if exists (select 1 from kho_mat_hang) then
    raise exception 'Danh mục đã có mặt hàng — danh mục mẫu chỉ dùng khi bắt đầu từ trống'
      using errcode = 'check_violation';
  end if;

  insert into kho_mat_hang
    (ma, ten, ten_phu, nhom, loai, dem_goi, don_vi_goi, han_dung_ngay,
     canh_bao_truoc_ngay, xu_ly_mac_dinh, thu_tu)
  values
    ('T-THANLUNG',  'Thăn lưng nguyên tảng',  'Ribeye roll',        'Thăn',  'tang', true, 'tảng', 30, 5, 'nhap_kho', 10),
    ('T-THANNGOAI', 'Thăn ngoại nguyên tảng', 'Striploin',          'Thăn',  'tang', true, 'tảng', 30, 5, 'nhap_kho', 11),
    ('T-THANNOI',   'Thăn nội nguyên tảng',   'Tenderloin',         'Thăn',  'tang', true, 'tảng', 30, 5, 'nhap_kho', 12),
    ('T-NACVAI',    'Nạc vai nguyên tảng',    'Chuck roll',         'Vai',   'tang', true, 'tảng', 30, 5, 'nhap_kho', 20),
    ('T-LOIVAI',    'Lõi vai nguyên tảng',    'Oyster blade',       'Vai',   'tang', true, 'tảng', 30, 5, 'nhap_kho', 21),
    ('T-BACHI',     'Ba chỉ nguyên tảng',     'Short plate',        'Ba chỉ','tang', true, 'tảng', 30, 5, 'nhap_kho', 30),
    ('T-SUON',      'Sườn không xương',       'Boneless short rib', 'Sườn',  'tang', true, 'tảng', 30, 5, 'nhap_kho', 40),
    ('T-GAU',       'Gầu nguyên tảng',        'Brisket',            'Gầu',   'tang', true, 'tảng', 30, 5, 'nhap_kho', 50),
    ('C-THANLUNG',  'Thăn lưng cắt lát',      'Ribeye slice',       'Thăn',  'phan_cat', true, 'gói', 3, 1, 'nhap_kho', 110),
    ('C-THANNGOAI', 'Thăn ngoại cắt lát',     'Striploin slice',    'Thăn',  'phan_cat', true, 'gói', 3, 1, 'nhap_kho', 111),
    ('C-THANNOI',   'Thăn nội cắt miếng',     'Tenderloin cut',     'Thăn',  'phan_cat', true, 'gói', 3, 1, 'nhap_kho', 112),
    ('C-NACVAI',    'Nạc vai cắt lát',        'Chuck slice',        'Vai',   'phan_cat', true, 'gói', 3, 1, 'nhap_kho', 120),
    ('C-LOIVAI',    'Lõi vai cắt lát',        'Oyster blade slice', 'Vai',   'phan_cat', true, 'gói', 3, 1, 'nhap_kho', 121),
    ('C-BACHI',     'Ba chỉ cuộn',            'Short plate roll',   'Ba chỉ','phan_cat', true, 'gói', 3, 1, 'nhap_kho', 130),
    ('C-SUON',      'Sườn cắt lát',           'Short rib slice',    'Sườn',  'phan_cat', true, 'gói', 3, 1, 'nhap_kho', 140),
    ('C-GAU',       'Gầu cắt lát',            'Brisket slice',      'Gầu',   'phan_cat', true, 'gói', 3, 1, 'nhap_kho', 150),
    ('P-VUN',       'Thịt vụn',               'Trimmings',          'Phụ phẩm', 'phu_pham', false, 'khay', 2, 1, 'chuyen_bep', 210),
    ('P-GAN',       'Gân',                    'Sinew',              'Phụ phẩm', 'phu_pham', false, 'khay', 2, 1, 'chuyen_bep', 220),
    ('P-MO',        'Mỡ',                     'Fat',                'Phụ phẩm', 'phu_pham', false, 'khay', 2, 1, 'bo',         230);
  get diagnostics v_so = row_count;
  return v_so;
end;
$$;

comment on function kho_tao_danh_muc_mau is
  'Tạo danh mục mẫu (tảng, phần cắt, phụ phẩm) khi danh mục còn rỗng. Không có giá bán — giá do người thật đặt.';


-- =============================================================================
-- 9 · PHÂN QUYỀN
-- =============================================================================
-- Danh mục dùng chung toàn thương hiệu: đọc theo vai, không xét chi nhánh.
-- Vị trí và cài đặt thuộc chi nhánh: đọc/ghi theo kho_cn_duoc().
-- Không có policy XÓA ở đâu cả: tắt bằng dang_dung. Riêng dòng công thức pha
-- lóc là cấu hình thuần túy nên được xóa (policy for all).
-- =============================================================================
alter table kho_vi_tri             enable row level security;
alter table kho_truong_them        enable row level security;
alter table kho_mat_hang           enable row level security;
alter table kho_mat_hang_gia       enable row level security;
alter table kho_cong_thuc_pha      enable row level security;
alter table kho_cong_thuc_pha_dong enable row level security;
alter table kho_nha_cung_cap       enable row level security;
alter table kho_ly_do              enable row level security;
alter table kho_cai_dat            enable row level security;

create policy kho_vi_tri_doc on kho_vi_tri
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));
-- Vị trí chờ hủy chỉ kho_khoi_tao() tạo.
create policy kho_vi_tri_them on kho_vi_tri
  for insert with check (
    chi_nhanh_id = any ((select kho_cn_duoc('danh_muc'))::uuid[])
    and loai <> 'cho_huy');
create policy kho_vi_tri_sua on kho_vi_tri
  for update using (chi_nhanh_id = any ((select kho_cn_duoc('danh_muc'))::uuid[]));

create policy kho_truong_them_doc on kho_truong_them
  for select using ((select kho_co_quyen('xem')));
create policy kho_truong_them_them on kho_truong_them
  for insert with check ((select kho_co_quyen('cai_dat_goc')));
create policy kho_truong_them_sua on kho_truong_them
  for update using ((select kho_co_quyen('cai_dat_goc')));

create policy kho_mat_hang_doc on kho_mat_hang
  for select using ((select kho_co_quyen('xem')));
create policy kho_mat_hang_them on kho_mat_hang
  for insert with check ((select kho_co_quyen('danh_muc')));
create policy kho_mat_hang_sua on kho_mat_hang
  for update using ((select kho_co_quyen('danh_muc')));

create policy kho_mat_hang_gia_doc on kho_mat_hang_gia
  for select using ((select kho_co_quyen('xem_gia')));
create policy kho_mat_hang_gia_sua on kho_mat_hang_gia
  for all using ((select kho_co_quyen('danh_muc')))
  with check ((select kho_co_quyen('danh_muc')));

create policy kho_cong_thuc_pha_doc on kho_cong_thuc_pha
  for select using ((select kho_co_quyen('xem')));
create policy kho_cong_thuc_pha_them on kho_cong_thuc_pha
  for insert with check ((select kho_co_quyen('danh_muc')));
create policy kho_cong_thuc_pha_sua on kho_cong_thuc_pha
  for update using ((select kho_co_quyen('danh_muc')));

create policy kho_cong_thuc_pha_dong_doc on kho_cong_thuc_pha_dong
  for select using ((select kho_co_quyen('xem')));
create policy kho_cong_thuc_pha_dong_sua on kho_cong_thuc_pha_dong
  for all using ((select kho_co_quyen('danh_muc')))
  with check ((select kho_co_quyen('danh_muc')));

create policy kho_nha_cung_cap_doc on kho_nha_cung_cap
  for select using ((select kho_co_quyen('xem_gia')));
create policy kho_nha_cung_cap_them on kho_nha_cung_cap
  for insert with check ((select kho_co_quyen('ncc')));
create policy kho_nha_cung_cap_sua on kho_nha_cung_cap
  for update using ((select kho_co_quyen('ncc')));

create policy kho_ly_do_doc on kho_ly_do
  for select using ((select kho_co_quyen('xem')));
create policy kho_ly_do_them on kho_ly_do
  for insert with check ((select kho_co_quyen('danh_muc')));
create policy kho_ly_do_sua on kho_ly_do
  for update using ((select kho_co_quyen('danh_muc')));

-- Cài đặt chỉ ghi qua kho_luu_cai_dat / kho_luu_cai_dat_goc / kho_khoi_tao:
-- hai mức quyền trên cùng một hàng thì policy không tách được, hàm thì được.
create policy kho_cai_dat_doc on kho_cai_dat
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));


-- =============================================================================
-- CHỐT QUYỀN — xem giải thích ở 0008 mục 6
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
  end if;
end
$$;
