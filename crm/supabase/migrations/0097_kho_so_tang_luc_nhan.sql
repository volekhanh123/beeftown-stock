-- =============================================================================
-- BEEFTOWN KHO — 0097 · SỐ TẢNG CẤP NGAY LÚC NHẬN HÀNG
-- =============================================================================
-- Khánh chốt ngày 25/10/2026: "cấp số tảng lúc nhập là cần thiết để kiểm soát".
-- Trước đây số tảng chỉ sinh lúc DUYỆT (0050, kho_duyet_phieu_nhap): tảng đã vào tủ ủ
-- mà túi chưa có số, hai tảng có thể lẫn nhau, dòng bị bỏ thì không để lại dấu vết.
-- Từ 0097 thủ kho lưu dòng tảng là có số "#0142" để viết lên túi; số giữ nguyên qua
-- mọi lần lưu; duyệt dùng lại đúng số đó.
--
-- GIỮ SỐ QUA MỖI LẦN "XOÁ HẾT DÒNG RỒI GHI LẠI": hai hàm lưu (kho_luu_phieu_nhap_kg —
-- màn Nhận hàng, kho_luu_phieu_nhap — màn Phiếu nhập; cả hai ở 0031) xoá mọi dòng của
-- phiếu rồi gọi kho_ghi_dong_phieu_nhap, id dòng đổi mỗi lần lưu. Nên số tảng đi theo
-- KHOÁ so_tang của từng dòng: web gửi lại số database đã cấp cho dòng đó. Database
-- không tin số máy gửi — kiểm trong sổ mới:
--   · kho_so_tang_cap (chi nhánh, số) — số đã cấp cho phiếu nào, ai cấp, lúc nào; số bỏ
--     thì ai bỏ, lúc nào. Số gửi lên phải là số của CHÍNH phiếu này và chưa bỏ.
--   · Dòng không gửi so_tang → cấp số mới (kho_sinh_so_tang, bộ đếm loại T như 0048).
--   · Sau khi ghi các dòng: số của phiếu không dòng nào còn mang (bỏ dòng, đổi sang món
--     thường, web cũ không gửi lại) → bo_luc. Không bao giờ cấp lại số đã bỏ.
--   · kho_phieu_nhap_dong.so_tang — số của dòng; duyệt ghi lại đúng số của lô.
-- Phiếu hủy (kho_huy_phieu_nhap, 0035) không đổi: số của phiếu đã hủy mà chưa thành lô
-- được kho_doc_phieu_nhap_kg kể vào so_tang_bo.
--
-- THAY THÂN (cùng chữ ký, cùng chỗ kiểm quyền, chép nguyên văn 0050, chỗ đổi ghi 0097):
--   kho_ghi_dong_phieu_nhap — nhận khoá so_tang, cấp / kiểm số, ghi bỏ số không còn dùng.
--   kho_duyet_phieu_nhap    — dùng số của dòng; chưa có số thì sinh như cũ và ghi sổ.
--   kho_doc_phieu_nhap_kg   — dòng trả so_tang của dòng; phiếu thêm so_tang_bo.
-- KHÔNG đổi kho_luu_phieu_nhap_kg (0031) hay kho_luu_phieu_nhap (0031): cả hai gọi
-- kho_ghi_dong_phieu_nhap. Không hàm mới, không có tiền ở bảng hay khoá mới.
-- Chạy sau 0050.
--
-- TRIỂN KHAI: chạy migration → `npm run doi-chieu` báo KHỚP → deploy web NGAY sau đó (ngoài giờ
-- nhận hàng). Web cũ không gửi so_tang: trong khoảng giữa, mỗi lần lưu cấp số mới cho mọi tảng
-- của phiếu (số cũ ghi bỏ — có kiểm thử ghi lại). Web mới đọc cột kho_phieu_nhap_dong.so_tang
-- nên không đẩy web trước migration.
-- =============================================================================


-- =============================================================================
-- 1 · SỔ SỐ TẢNG ĐÃ CẤP
-- =============================================================================
create table kho_so_tang_cap (
  chi_nhanh_id  uuid not null references chi_nhanh(id) on delete restrict,
  so_tang       int  not null,
  phieu_nhap_id uuid not null references kho_phieu_nhap(id) on delete restrict,
  cap_luc       timestamptz not null default now(),
  nguoi_cap     uuid references nhan_su(id) on delete set null,
  bo_luc        timestamptz,
  nguoi_bo      uuid references nhan_su(id) on delete set null,
  primary key (chi_nhanh_id, so_tang),
  constraint kho_so_tang_cap_so_hop_le check (so_tang > 0)
);

create index kho_so_tang_cap_phieu_idx on kho_so_tang_cap(phieu_nhap_id);

comment on table kho_so_tang_cap is
  'Sổ số tảng đã cấp (0097): mỗi số tảng của chi nhánh một dòng — cấp cho phiếu nhập nào, ai cấp, lúc nào; bo_luc / nguoi_bo khi số không còn dùng (dòng bị bỏ, đổi sang món thường, món tắt theo tảng lúc duyệt). Số đã bỏ không bao giờ cấp lại. Chỉ hàm definer đọc / ghi (RLS bật, không policy, thu quyền bảng).';

-- Như kho_so_thu_tu (0020): bật RLS, không policy — chỉ hàm definer đọc và ghi.
alter table kho_so_tang_cap enable row level security;


-- =============================================================================
-- 2 · SỐ TẢNG CỦA DÒNG PHIẾU NHẬP
-- =============================================================================
alter table kho_phieu_nhap_dong add column so_tang int;
create unique index kho_phieu_nhap_dong_so_tang_idx on kho_phieu_nhap_dong(chi_nhanh_id, so_tang)
  where so_tang is not null;

comment on column kho_phieu_nhap_dong.so_tang is
  'Số tảng của dòng (0097): cấp lúc lưu dòng (kho_ghi_dong_phieu_nhap), giữ nguyên qua mọi lần lưu khi web gửi lại khoá so_tang; dòng đã duyệt mang đúng số của lô. Chỉ với món theo dõi theo tảng. Sổ: kho_so_tang_cap.';


-- =============================================================================
-- 3 · ĐIỀN DỮ LIỆU CŨ — chỉ thêm, không đụng kho_lo (lô bất biến)
-- =============================================================================
-- Số tảng trước 0097 sinh lúc duyệt: người cấp là người duyệt, lúc cấp là lúc tạo lô.
insert into kho_so_tang_cap (chi_nhanh_id, so_tang, phieu_nhap_id, cap_luc, nguoi_cap)
select l.chi_nhanh_id, l.so_tang, d.phieu_nhap_id, l.created_at, p.nguoi_duyet
from kho_lo l
join kho_phieu_nhap_dong d on d.id = l.phieu_nhap_dong_id
join kho_phieu_nhap p on p.id = d.phieu_nhap_id
where l.so_tang is not null;

-- Trigger duy nhất của bảng dòng (0020) chỉ kiểm truong_them khi giá trị đó đổi — không chạy ở đây.
update kho_phieu_nhap_dong d set so_tang = l.so_tang
from kho_lo l
where l.id = d.lo_id and l.so_tang is not null and d.so_tang is null;


-- =============================================================================
-- 4 · GHI DÒNG PHIẾU NHẬP — cấp / giữ số tảng (chép 0050)
-- =============================================================================
-- Hàm nội bộ (đã rút khỏi authenticated ở 0048, 0050 — create or replace giữ nguyên quyền). Hai
-- người gọi kiểm kho_duoc(chi nhánh, 'nhap') ở đầu thân (0031:403 và 0031:1463).
create or replace function kho_ghi_dong_phieu_nhap(
  p_phieu_id     uuid,
  p_chi_nhanh_id uuid,
  p_ngay_nhap    date,
  p_dong         jsonb
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dong  jsonb;
  v_khoa  text;
  v_i     int := 0;
  v_mh    kho_mat_hang;
  v_han   date;
  v_nsx   date;
  v_kg    numeric;
  v_goi   int;
  v_gia   bigint;
  v_mo    date;
  v_thuc  numeric;
  v_so    int;                                    -- 0097: số tảng của dòng
  v_nv_id uuid := (nhan_su_hien_tai()).id;        -- 0097: người cấp / bỏ số
  c_khoa  constant text[] := array['mat_hang_id', 'so_goi', 'so_kg', 'don_gia_kg',
                                   'so_lo_ncc', 'ngay_san_xuat', 'han_dung', 'truong_them',
                                   'ngay_mo', 'so_kg_thuc', 'so_tang'];
begin
  if p_dong is null or jsonb_typeof(p_dong) <> 'array' then
    raise exception 'Danh sách dòng hàng không hợp lệ' using errcode = 'check_violation';
  end if;

  for v_dong in select value from jsonb_array_elements(p_dong) loop
    v_i := v_i + 1;
    if jsonb_typeof(v_dong) <> 'object' then
      raise exception 'Dòng % không hợp lệ', v_i using errcode = 'check_violation';
    end if;
    for v_khoa in select jsonb_object_keys(v_dong) loop
      if not (v_khoa = any(c_khoa)) then
        raise exception 'Dòng %: trường "%" không được nhận', v_i, v_khoa
          using errcode = 'check_violation';
      end if;
    end loop;

    if jsonb_typeof(v_dong -> 'mat_hang_id') is distinct from 'string'
       or (v_dong ->> 'mat_hang_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Dòng %: chưa chọn mặt hàng', v_i using errcode = 'check_violation';
    end if;
    select * into v_mh from kho_mat_hang
    where id = (v_dong ->> 'mat_hang_id')::uuid;
    if not found or not v_mh.dang_dung then
      raise exception 'Dòng %: mặt hàng không có hoặc đã ngừng dùng', v_i
        using errcode = 'check_violation';
    end if;

    if jsonb_typeof(v_dong -> 'so_kg') is distinct from 'number' then
      raise exception 'Dòng % (%): chưa nhập số kg', v_i, v_mh.ten using errcode = 'check_violation';
    end if;
    v_kg := (v_dong ->> 'so_kg')::numeric;
    if v_kg <= 0 or v_kg >= 1000000 or v_kg <> round(v_kg, 3) then
      raise exception 'Dòng % (%): số kg phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mh.ten
        using errcode = 'check_violation';
    end if;

    v_goi := 0;
    if v_dong ? 'so_goi' and v_dong -> 'so_goi' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_goi') <> 'number'
         or (v_dong ->> 'so_goi')::numeric <> trunc((v_dong ->> 'so_goi')::numeric)
         or (v_dong ->> 'so_goi')::numeric < 0 then
        raise exception 'Dòng % (%): số % phải là số nguyên không âm', v_i, v_mh.ten, v_mh.don_vi_goi
          using errcode = 'check_violation';
      end if;
      v_goi := (v_dong ->> 'so_goi')::int;
    end if;
    if v_mh.dem_goi and v_goi = 0 and not v_mh.theo_tang then   -- 0048: dòng tảng tự là 1 tảng
      raise exception 'Dòng % (%): chưa nhập số %', v_i, v_mh.ten, v_mh.don_vi_goi
        using errcode = 'check_violation';
    end if;

    -- MỚI (0048): món theo dõi theo tảng — mỗi dòng là MỘT tảng, có ngày mổ.
    v_mo := null;
    if coalesce(v_dong ->> 'ngay_mo', '') <> '' then
      begin
        v_mo := (v_dong ->> 'ngay_mo')::date;
      exception when others then
        raise exception 'Dòng % (%): ngày mổ không hợp lệ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end;
      if v_mo > p_ngay_nhap then
        raise exception 'Dòng % (%): ngày mổ không được sau ngày nhận hàng', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      if v_mo < p_ngay_nhap - 365 then
        raise exception 'Dòng % (%): ngày mổ quá một năm trước ngày nhận — kiểm tra lại', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
    end if;
    if v_mh.theo_tang then
      if v_goi > 1 then
        raise exception 'Dòng % (%): món theo dõi theo tảng — mỗi tảng một dòng, cân riêng', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      v_goi := 1;
      if v_mo is null then
        raise exception 'Dòng % (%): chưa nhập ngày mổ của tảng', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
    end if;

    -- MỚI (0050): kg sau repack (cân lại sau khi mở túi, bỏ nước rỉ). so_kg
    -- vẫn là kg nhà cung cấp — cơ sở tính tiền; kho nhập theo kg sau repack.
    v_thuc := null;
    if v_dong ? 'so_kg_thuc' and v_dong -> 'so_kg_thuc' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'so_kg_thuc') <> 'number' then
        raise exception 'Dòng % (%): kg sau repack không hợp lệ', v_i, v_mh.ten using errcode = 'check_violation';
      end if;
      v_thuc := (v_dong ->> 'so_kg_thuc')::numeric;
      if v_thuc <= 0 or v_thuc <> round(v_thuc, 3) then
        raise exception 'Dòng % (%): kg sau repack phải lớn hơn 0, tối đa 3 số lẻ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      if v_thuc > v_kg * 1.01 then
        raise exception 'Dòng % (%): kg sau repack lớn hơn kg nhà cung cấp — kiểm tra lại cân', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
    end if;

    v_gia := 0;
    if v_dong ? 'don_gia_kg' and v_dong -> 'don_gia_kg' <> 'null'::jsonb then
      if jsonb_typeof(v_dong -> 'don_gia_kg') <> 'number'
         or (v_dong ->> 'don_gia_kg')::numeric <> trunc((v_dong ->> 'don_gia_kg')::numeric)
         or (v_dong ->> 'don_gia_kg')::numeric < 0 then
        raise exception 'Dòng % (%): đơn giá phải là số đồng không âm', v_i, v_mh.ten
          using errcode = 'check_violation';
      end if;
      v_gia := (v_dong ->> 'don_gia_kg')::bigint;
    end if;

    v_nsx := null;
    if coalesce(v_dong ->> 'ngay_san_xuat', '') <> '' then
      begin
        v_nsx := (v_dong ->> 'ngay_san_xuat')::date;
      exception when others then
        raise exception 'Dòng % (%): ngày sản xuất không hợp lệ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end;
    end if;

    if coalesce(v_dong ->> 'han_dung', '') <> '' then
      begin
        v_han := (v_dong ->> 'han_dung')::date;
      exception when others then
        raise exception 'Dòng % (%): hạn dùng không hợp lệ', v_i, v_mh.ten
          using errcode = 'check_violation';
      end;
    elsif v_mh.han_dung_ngay is not null then
      v_han := p_ngay_nhap + v_mh.han_dung_ngay;
    else
      raise exception 'Dòng % (%): chưa có hạn dùng, và mặt hàng chưa cài hạn mặc định', v_i, v_mh.ten
        using errcode = 'check_violation';
    end if;

    -- MỚI (0097): số tảng cấp NGAY LÚC LƯU, sau mọi kiểm tra của dòng. Dòng gửi lại khoá so_tang
    -- (web gửi lại số database đã cấp cho dòng đó) thì giữ số — chỉ khi số đúng là của phiếu này,
    -- chưa bỏ, chưa có ở dòng trước trong cùng lượt. Không gửi thì cấp số mới. Món không theo
    -- tảng: bỏ qua khoá so_tang (số cũ của dòng, nếu có, được ghi bỏ ở cuối hàm).
    v_so := null;
    if v_mh.theo_tang then
      if v_dong ? 'so_tang' and v_dong -> 'so_tang' <> 'null'::jsonb then
        if jsonb_typeof(v_dong -> 'so_tang') <> 'number'
           or (v_dong ->> 'so_tang')::numeric <> trunc((v_dong ->> 'so_tang')::numeric)
           or (v_dong ->> 'so_tang')::numeric < 1
           or (v_dong ->> 'so_tang')::numeric > 2147483647 then
          raise exception 'Dòng % (%): số tảng không hợp lệ', v_i, v_mh.ten
            using errcode = 'check_violation';
        end if;
        v_so := (v_dong ->> 'so_tang')::int;
        if not exists (select 1 from kho_so_tang_cap c
                       where c.chi_nhanh_id = p_chi_nhanh_id and c.so_tang = v_so
                         and c.phieu_nhap_id = p_phieu_id and c.bo_luc is null) then
          -- lpad cắt chuỗi dài hơn 4 ký tự (lpad('12345', 4, '0') = '1234') — số từ 10000 in nguyên.
          raise exception 'Dòng % (%): số tảng #% không phải số của phiếu này (hoặc đã bỏ) — tải lại trang',
            v_i, v_mh.ten, case when v_so < 10000 then lpad(v_so::text, 4, '0') else v_so::text end
            using errcode = 'check_violation';
        end if;
        if exists (select 1 from kho_phieu_nhap_dong d
                   where d.phieu_nhap_id = p_phieu_id and d.so_tang = v_so) then
          raise exception 'Dòng % (%): số tảng #% đã có ở dòng khác của phiếu',
            v_i, v_mh.ten, case when v_so < 10000 then lpad(v_so::text, 4, '0') else v_so::text end
            using errcode = 'check_violation';
        end if;
      else
        v_so := kho_sinh_so_tang(p_chi_nhanh_id);
        insert into kho_so_tang_cap (chi_nhanh_id, so_tang, phieu_nhap_id, nguoi_cap)
        values (p_chi_nhanh_id, v_so, p_phieu_id, v_nv_id);
      end if;
    end if;

    insert into kho_phieu_nhap_dong
      (phieu_nhap_id, chi_nhanh_id, thu_tu, mat_hang_id, so_goi, so_kg, don_gia_kg,
       so_lo_ncc, ngay_san_xuat, han_dung, truong_them, ngay_mo, so_kg_thuc, so_tang)
    values
      (p_phieu_id, p_chi_nhanh_id, v_i, v_mh.id, v_goi, v_kg, v_gia,
       nullif(btrim(v_dong ->> 'so_lo_ncc'), ''), v_nsx, v_han,
       coalesce(v_dong -> 'truong_them', '{}'::jsonb), v_mo, v_thuc, v_so);
  end loop;

  -- MỚI (0097): số đã cấp cho phiếu mà không dòng nào còn mang (dòng bị bỏ, đổi sang món không theo
  -- tảng, web cũ không gửi lại số) → ghi bỏ, không bao giờ cấp lại. Hai người gọi (kho_luu_phieu_nhap_kg,
  -- kho_luu_phieu_nhap) đều xoá hết dòng của phiếu TRƯỚC khi gọi hàm này, nên "dòng còn mang" là đúng các
  -- dòng vừa ghi ở trên.
  update kho_so_tang_cap c set bo_luc = now(), nguoi_bo = v_nv_id
  where c.phieu_nhap_id = p_phieu_id and c.bo_luc is null
    and not exists (select 1 from kho_phieu_nhap_dong d
                    where d.phieu_nhap_id = p_phieu_id and d.so_tang = c.so_tang);

  return v_i;
end;
$$;

-- =============================================================================
-- 5 · DUYỆT — dùng số tảng của dòng (chép 0050)
-- =============================================================================
create or replace function kho_duyet_phieu_nhap(p_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pn     kho_phieu_nhap;
  v_cd     kho_cai_dat;
  v_nv     nhan_su;
  v_dong   kho_phieu_nhap_dong;
  v_ids    uuid[];
  v_kg     numeric[];
  v_hang   numeric[];
  v_cp     bigint[];
  v_vat    bigint[];
  v_tong_hang bigint;
  v_lo     uuid;
  v_i      int := 0;
  v_han_tt date;
  v_thieu_tt  int;
  v_thieu_ten text;
  v_mh     kho_mat_hang;
  v_so_tang int;
  v_u_xong date;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  if not found or not kho_duoc(v_pn.chi_nhanh_id, 'duyet_nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được duyệt phiếu'
      using errcode = 'insufficient_privilege';
  end if;

  -- Khóa theo đúng thứ tự: cài đặt chi nhánh trước, phiếu sau.
  select * into v_cd from kho_cai_dat where chi_nhanh_id = v_pn.chi_nhanh_id for update;
  if not found then
    raise exception 'Chi nhánh chưa bắt đầu dùng kho' using errcode = 'check_violation';
  end if;
  select * into v_pn from kho_phieu_nhap where id = p_id for update;

  if v_pn.trang_thai = 'da_duyet' then
    return 'Phiếu ' || v_pn.so_phieu || ' đã được duyệt trước đó.';
  end if;
  if v_pn.trang_thai <> 'cho_duyet' then
    raise exception 'Phiếu % chưa được gửi duyệt', v_pn.so_phieu using errcode = 'check_violation';
  end if;

  -- MỚI (0031): hàng mua phải có đơn giá ở MỌI dòng. Trước đây bỏ trống đơn
  -- giá vẫn duyệt được, và lô sinh ra có giá vốn 0 đồng — sai cả báo cáo lẫn
  -- công nợ. Câu lỗi chỉ nêu dòng và tên món, không nêu số tiền nào.
  if v_pn.loai = 'mua' then
    select d.thu_tu, m.ten into v_thieu_tt, v_thieu_ten
    from kho_phieu_nhap_dong d
    join kho_mat_hang m on m.id = d.mat_hang_id
    where d.phieu_nhap_id = p_id and d.don_gia_kg <= 0
    order by d.thu_tu
    limit 1;
    if found then
      raise exception 'Dòng % (%): chưa có đơn giá — điền giá rồi duyệt', v_thieu_tt, v_thieu_ten
        using errcode = 'check_violation';
    end if;
  end if;

  -- MỚI (0048): món theo dõi theo tảng phải mỗi dòng một tảng, có ngày mổ —
  -- phiếu tạo từ đơn đặt hàng chưa được thủ kho cân từng tảng thì chưa duyệt.
  if v_pn.loai = 'mua' then
    select d.thu_tu, m.ten into v_thieu_tt, v_thieu_ten
    from kho_phieu_nhap_dong d
    join kho_mat_hang m on m.id = d.mat_hang_id
    where d.phieu_nhap_id = p_id and m.theo_tang and (d.so_goi <> 1 or d.ngay_mo is null)
    order by d.thu_tu
    limit 1;
    if found then
      raise exception 'Dòng % (%): món theo dõi theo tảng — mỗi tảng một dòng, có ngày mổ. Sửa phiếu nhận hàng rồi duyệt', v_thieu_tt, v_thieu_ten
        using errcode = 'check_violation';
    end if;
  end if;

  -- MỚI (0050): tảng phải có kg sau repack.
  if v_pn.loai = 'mua' then
    select d.thu_tu, m.ten into v_thieu_tt, v_thieu_ten
    from kho_phieu_nhap_dong d
    join kho_mat_hang m on m.id = d.mat_hang_id
    where d.phieu_nhap_id = p_id and m.theo_tang and d.so_kg_thuc is null
    order by d.thu_tu
    limit 1;
    if found then
      raise exception 'Dòng % (%): tảng chưa có kg sau repack — repack, cân rồi gửi', v_thieu_tt, v_thieu_ten
        using errcode = 'check_violation';
    end if;
  end if;

  v_nv := nhan_su_hien_tai();
  if not v_cd.cho_tu_duyet
     and v_nv.id is not null
     and v_nv.id in (v_pn.nguoi_tao, v_pn.nguoi_gui) then
    raise exception 'Cài đặt không cho tự duyệt phiếu do chính mình lập — nhờ quản lý khác duyệt'
      using errcode = 'insufficient_privilege';
  end if;

  select array_agg(d.id order by d.thu_tu),
         array_agg(d.so_kg order by d.thu_tu),
         array_agg(d.thanh_tien::numeric order by d.thu_tu),
         coalesce(sum(d.thanh_tien), 0)
    into v_ids, v_kg, v_hang, v_tong_hang
  from kho_phieu_nhap_dong d where d.phieu_nhap_id = p_id;

  if v_ids is null then
    raise exception 'Phiếu chưa có dòng hàng nào' using errcode = 'check_violation';
  end if;

  -- Giá vốn nhập kho = tiền hàng + chi phí khác (chia theo kg) + thuế (chia
  -- theo tiền hàng) — mỗi khoản chỉ tính khi cài đặt bật.
  v_cp  := kho_chia_so_du_lon_nhat(
             case when v_cd.chi_phi_vao_gia_von then v_pn.chi_phi_khac else 0 end, v_kg);
  v_vat := kho_chia_so_du_lon_nhat(
             case when v_cd.vat_vao_gia_von then v_pn.tien_thue else 0 end,
             case when v_tong_hang > 0 then v_hang else v_kg end);

  for v_dong in
    select * from kho_phieu_nhap_dong where phieu_nhap_id = p_id order by thu_tu
  loop
    v_i := v_i + 1;

    -- MỚI (0048): tảng của món theo dõi theo tảng có số tảng tăng dần của chi
    -- nhánh, và ngày ủ xong tra theo bảng ủ của món.
    -- 0097: số tảng là số đã cấp cho dòng lúc lưu. Dòng chưa có số (tồn đầu kỳ dạng lưới, phiếu
    -- lưu trước 0097, món bật theo tảng sau khi lưu) thì sinh như cũ và ghi vào sổ. Dòng có số mà
    -- món đã tắt theo tảng → số ghi bỏ, lô không số.
    select * into v_mh from kho_mat_hang where id = v_dong.mat_hang_id;
    v_so_tang := null;
    if v_mh.theo_tang and v_dong.so_goi <= 1 then
      v_so_tang := v_dong.so_tang;
      if v_so_tang is null then
        v_so_tang := kho_sinh_so_tang(v_pn.chi_nhanh_id);
        insert into kho_so_tang_cap (chi_nhanh_id, so_tang, phieu_nhap_id, nguoi_cap)
        values (v_pn.chi_nhanh_id, v_so_tang, v_pn.id, v_nv.id);
      end if;
    elsif v_dong.so_tang is not null then
      update kho_so_tang_cap set bo_luc = now(), nguoi_bo = v_nv.id
      where chi_nhanh_id = v_pn.chi_nhanh_id and so_tang = v_dong.so_tang and bo_luc is null;
    end if;
    v_u_xong := case when v_dong.ngay_mo is not null
                     then v_pn.ngay_nhap + kho_so_ngay_u(v_dong.mat_hang_id, v_pn.ngay_nhap - v_dong.ngay_mo) end;

    insert into kho_lo
      (chi_nhanh_id, ma_lo, mat_hang_id, nguon, phieu_nhap_dong_id,
       ngay_dong_goi, ngay_san_xuat, han_dung, so_lo_ncc, truong_them,
       ngay_mo, ngay_u_xong, so_tang)
    values
      (v_pn.chi_nhanh_id, kho_sinh_so(v_pn.chi_nhanh_id, 'L'), v_dong.mat_hang_id,
       case when v_pn.loai = 'ton_dau' then 'ton_dau' else 'nhap' end, v_dong.id,
       v_pn.ngay_nhap, v_dong.ngay_san_xuat, v_dong.han_dung, v_dong.so_lo_ncc,
       v_dong.truong_them, v_dong.ngay_mo, v_u_xong, v_so_tang)
    returning id into v_lo;

    insert into kho_lo_gia (lo_id, chi_nhanh_id, gia_tri, so_kg_goc)
    values (v_lo, v_pn.chi_nhanh_id,
            v_dong.thanh_tien + v_cp[v_i] + v_vat[v_i], coalesce(v_dong.so_kg_thuc, v_dong.so_kg));

    insert into kho_so_cai
      (chi_nhanh_id, lo_id, vi_tri_id, mat_hang_id, loai, so_kg, so_goi,
       chung_tu_loai, chung_tu_id, nguoi_ghi, ngay)
    values
      (v_pn.chi_nhanh_id, v_lo, v_pn.vi_tri_id, v_dong.mat_hang_id, 'nhap',
       coalesce(v_dong.so_kg_thuc, v_dong.so_kg), v_dong.so_goi, 'phieu_nhap', v_pn.id, v_nv.id, v_pn.ngay_nhap);

    -- 0097: dòng đã duyệt mang đúng số của lô (null khi lô không số).
    update kho_phieu_nhap_dong set lo_id = v_lo, so_tang = v_so_tang where id = v_dong.id;
  end loop;

  if v_pn.loai = 'mua' and v_pn.han_thanh_toan is null then
    select coalesce(v_pn.ngay_hoa_don, v_pn.ngay_nhap) + ncc.so_ngay_no into v_han_tt
    from kho_nha_cung_cap ncc where ncc.id = v_pn.nha_cung_cap_id;
  else
    v_han_tt := v_pn.han_thanh_toan;
  end if;

  update kho_phieu_nhap set
    trang_thai     = 'da_duyet',
    nguoi_duyet    = v_nv.id,
    duyet_luc      = now(),
    han_thanh_toan = v_han_tt,
    phien_ban      = phien_ban + 1
  where id = p_id;

  return 'Đã duyệt phiếu ' || v_pn.so_phieu || ': ' || v_i || ' lô hàng đã vào kho.';
end;
$$;

comment on function kho_duyet_phieu_nhap is
  'Duyệt phiếu nhập (quyền duyet_nhap — chủ, quản lý, kế toán): mỗi dòng thành một lô, có giá vốn nhập kho (cộng chi phí và thuế theo cài đặt, chia không lệch một đồng), và một dòng sổ kho. Phiếu mua phải có đơn giá ở mọi dòng (0031). Món theo dõi theo tảng: mỗi dòng một tảng có ngày mổ và kg sau repack; lô mang số tảng và ngày ủ xong (0048). Lô và sổ kho theo kg sau repack, giá trị lô vẫn là tiền hàng → giá vốn/kg chia lại (0050). Số tảng cấp lúc lưu dòng; duyệt dùng đúng số của dòng, chưa có thì sinh như cũ và ghi sổ kho_so_tang_cap (tồn đầu kỳ dạng lưới, phiếu lưu trước 0097, món bật theo tảng sau khi lưu); món đã tắt theo tảng thì số ghi bỏ (0097). Chỉ lúc này tồn mới cộng.';

-- =============================================================================
-- 6 · ĐỌC PHIẾU NHẬN HÀNG — so_tang của dòng, so_tang_bo (chép 0050)
-- =============================================================================
create or replace function kho_doc_phieu_nhap_kg(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_pn kho_phieu_nhap;
begin
  select * into v_pn from kho_phieu_nhap where id = p_id;
  -- 0035: phiếu nợ đầu kỳ coi như không có.
  if not found or v_pn.loai = 'no_dau' or not kho_duoc(v_pn.chi_nhanh_id, 'nhap') then
    raise exception 'Không tìm thấy phiếu nhập, hoặc tài khoản không được xem'
      using errcode = 'insufficient_privilege';
  end if;

  return jsonb_build_object(
    'id',               v_pn.id,
    'so_phieu',         v_pn.so_phieu,
    'loai',             v_pn.loai,
    'trang_thai',       v_pn.trang_thai,
    'nha_cung_cap_id',  v_pn.nha_cung_cap_id,
    'ten_nha_cung_cap', (select n.ten from kho_nha_cung_cap n where n.id = v_pn.nha_cung_cap_id),
    'vi_tri_id',        v_pn.vi_tri_id,
    'ten_vi_tri',       (select v.ten from kho_vi_tri v where v.id = v_pn.vi_tri_id),
    'ngay_nhap',        v_pn.ngay_nhap,
    'so_hoa_don',       v_pn.so_hoa_don,
    'ngay_hoa_don',     v_pn.ngay_hoa_don,
    'ghi_chu',          v_pn.ghi_chu,
    'so_anh',           cardinality(v_pn.anh),
    'truong_them',      v_pn.truong_them,
    'ly_do',            v_pn.ly_do,
    'phien_ban',        v_pn.phien_ban,
    'nguoi_tao',        v_pn.nguoi_tao,
    'nguoi_gui',        v_pn.nguoi_gui,
    'gui_luc',          v_pn.gui_luc,
    'nguoi_duyet',      v_pn.nguoi_duyet,
    'duyet_luc',        v_pn.duyet_luc,
    'created_at',       v_pn.created_at,
    'dong', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id',            d.id,
               'thu_tu',        d.thu_tu,
               'mat_hang_id',   d.mat_hang_id,
               'ten_mat_hang',  m.ten,
               'dem_goi',       m.dem_goi,
               'don_vi_goi',    m.don_vi_goi,
               'so_goi',        d.so_goi,
               'so_kg',         d.so_kg,
               'so_lo_ncc',     d.so_lo_ncc,
               'ngay_san_xuat', d.ngay_san_xuat,
               'han_dung',      d.han_dung,
               'truong_them',   d.truong_them,
               'lo_id',         d.lo_id,
               -- 0048: món theo dõi theo tảng — mỗi dòng một tảng.
               'theo_tang',     m.theo_tang,
               'ngay_mo',       d.ngay_mo,
               -- 0097: số tảng cấp lúc lưu dòng; dòng đã duyệt mang đúng số của lô.
               'so_tang',       d.so_tang,
               -- 0050: kg sau repack (null = như kg nhà cung cấp).
               'so_kg_thuc',    d.so_kg_thuc)
             order by d.thu_tu, d.id)
      from kho_phieu_nhap_dong d
      join kho_mat_hang m on m.id = d.mat_hang_id
      where d.phieu_nhap_id = p_id), '[]'::jsonb),
    -- 0097: số tảng đã cấp cho phiếu mà không dùng nữa — dòng bị bỏ / đổi sang món thường, hoặc
    -- phiếu đã hủy mà số chưa thành lô. Túi có thể đã mang số: thủ kho gạch đi.
    'so_tang_bo', coalesce((
      select jsonb_agg(c.so_tang order by c.so_tang)
      from kho_so_tang_cap c
      where c.phieu_nhap_id = v_pn.id
        and (c.bo_luc is not null
             or (v_pn.trang_thai = 'da_huy'
                 and not exists (select 1 from kho_lo l
                                 where l.chi_nhanh_id = c.chi_nhanh_id and l.so_tang = c.so_tang)))), '[]'::jsonb),
    -- 0039: đơn đặt hàng của phiếu. so_kg_da_nhan gồm cả phiếu này nếu phiếu
    -- đang chờ duyệt / đã duyệt; web tự trừ khi cần "còn lại trước phiếu này".
    'don_dat', (
      select jsonb_build_object(
               'id',                dd.id,
               'so_phieu',          dd.so_phieu,
               'trang_thai',        dd.trang_thai,
               'ngay_giao_du_kien', dd.ngay_giao_du_kien,
               'dong', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'mat_hang_id',   x.mat_hang_id,
                          'ten_mat_hang',  m.ten,
                          'so_kg_dat',     x.so_kg_dat,
                          'so_goi_dat',    x.so_goi_dat,
                          'so_kg_da_nhan', x.so_kg_da_nhan)
                        order by x.thu_tu)
                 from kho_don_dat_dong x
                 join kho_mat_hang m on m.id = x.mat_hang_id
                 where x.don_dat_id = dd.id), '[]'::jsonb))
      from kho_don_dat dd where dd.id = v_pn.don_dat_id));
end;
$$;

comment on function kho_doc_phieu_nhap_kg is
  'Một phiếu nhập cho người nhận hàng (quyền nhap trên chi nhánh của phiếu): đầu phiếu, số ảnh, các dòng kg/gói/hạn, số tảng của dòng (0097), so_tang_bo — số tảng đã cấp cho phiếu mà không dùng nữa (0097). KHÔNG có tiền, KHÔNG có đường dẫn ảnh.';


-- =============================================================================
-- 7 · QUYỀN BẢNG — không ai đăng nhập đọc / ghi thẳng sổ (bọc kiểm pg_roles như 0060, 0061)
-- =============================================================================
-- RLS bật, không policy đã chặn; thu thêm quyền bảng để nếu RLS bị tắt nhầm vẫn còn một lớp chặn.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on kho_so_tang_cap from anon, authenticated';
  end if;
end
$$;


-- =============================================================================
-- KHÔNG CÓ KHỐI CHỐT QUYỀN
-- =============================================================================
-- Ba hàm trên chỉ thay thân, cùng chữ ký: CREATE OR REPLACE giữ nguyên quyền (như 0089).
-- Khối "thu hết rồi cấp lại danh sách anon" của 0008 không được chép vào đây: danh sách
-- đó đã đổi ở 0084, bản chép cũ chạy sau 0084 mở lại hai hàm đã đóng và đóng hàm tra cứu
-- mới (test-an-toan.mjs bắt).
