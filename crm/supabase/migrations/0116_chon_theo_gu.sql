-- =============================================================================
-- 0116 · CHỌN THEO GU — gu của từng phần thịt bán lẻ, khối "Chọn theo gu" ở trang Thực đơn
-- =============================================================================
-- Đợt 2 của đề xuất giao diện (Khánh duyệt 12/11/2026): lời hứa "Không cần rành bò. Chọn theo gu, thấy giá trước."
-- cần một chỗ nói phần cắt nào hợp gu nào. Phần cắt bán ở quầy là đúng danh sách của menu bán lẻ (ban_le_san_pham,
-- 0099 — Khánh xác nhận 12/11/2026), nên gu gắn thẳng vào sản phẩm thịt của menu đó: tên, mô tả, cách dùng và bản
-- dịch en / ko đã có sẵn ở đây. Đợt 3 (thẻ Mua thịt về) đọc cùng cột này.
--
-- Bốn gu, khóa cố định (chữ hiện ba thứ tiếng nằm ở web/src/lib/chon-theo-gu.ts):
--   mem_beo   Mềm, béo              dam_vi    Đậm vị, dai giòn
--   nac_thanh Nạc, thanh            lat_mong  Lát mỏng
--
-- CÔNG BỐ = GẮN GU. Phần thịt chưa gắn gu nào thì không có trong khối; gỡ hết gu là gỡ khỏi khối. Phần thịt Tạm ngưng
-- ở menu bán lẻ cũng không có (quầy không còn bán thì khách đừng đi hỏi), dù còn gu. Không phụ thuộc kênh bán web:
-- khối nói về quầy ở nhà hàng, không phải về đơn mang về. Tên còn chữ tạm (la_van_ban_tam) thì ẩn, như mọi chỗ công
-- khai khác.
--
-- Không câu delete. Không thêm giá trị enum. Chạy migration trước, deploy web sau (web cũ không gọi hàm mới; web mới
-- gọi hàm chưa có thì khối ẩn — lib/chon-theo-gu.ts không bao giờ ném lỗi ra trang).

alter table ban_le_san_pham add column gu text[] not null default '{}';

alter table ban_le_san_pham add constraint ban_le_san_pham_gu_hop_le check (
  gu <@ array['mem_beo', 'dam_vi', 'nac_thanh', 'lat_mong']::text[]
  and cardinality(gu) <= 4
  and (cardinality(gu) = 0 or loai = 'thit')
);

comment on column ban_le_san_pham.gu is
  'Gu của phần thịt cho khối "Chọn theo gu" ở trang Thực đơn (0116): con của {mem_beo, dam_vi, nac_thanh, lat_mong}, không trùng, theo thứ tự đó. Rỗng = không có trong khối. Chỉ sản phẩm loai = thit. Ghi qua ban_le_luu_gu.';


-- =============================================================================
-- ban_le_luu_gu — chủ, quản lý gắn / gỡ gu của một phần thịt
-- =============================================================================
-- Cùng bộ vai sửa menu bán lẻ (VAI_SUA_BAN_LE của web/src/lib/ban-le-noi-bo.ts). Nhận mảng khóa bất kỳ thứ tự, bỏ
-- trùng, ghi theo thứ tự cố định — gửi hai lần cùng lựa chọn là cùng một kết quả. Khóa lạ thì từ chối cả lượt,
-- không ghi nửa vời. Trả về gu đã ghi.
create or replace function ban_le_luu_gu(p_id uuid, p_gu text[])
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_thu_tu constant text[] := array['mem_beo', 'dam_vi', 'nac_thanh', 'lat_mong'];
  v_gu     text[];
  v_loai   text;
begin
  if not co_vai_tro(array['chu_so_huu', 'quan_ly']::vai_tro[]) then
    raise exception 'Chỉ chủ hoặc quản lý được sửa gu của phần thịt.' using errcode = 'insufficient_privilege';
  end if;
  if p_gu is null or exists (select 1 from unnest(p_gu) k where k is null or not k = any (v_thu_tu)) then
    raise exception 'Gu không hợp lệ.';
  end if;

  select loai into v_loai from ban_le_san_pham where id = p_id for update;
  if not found then
    raise exception 'Không thấy sản phẩm này.';
  end if;
  if v_loai <> 'thit' and cardinality(p_gu) > 0 then
    raise exception 'Chỉ phần thịt mới có gu.';
  end if;

  v_gu := array(select k from unnest(v_thu_tu) with ordinality as d(k, i) where k = any (p_gu) order by i);
  update ban_le_san_pham set gu = v_gu where id = p_id;
  return v_gu;
end;
$$;

revoke all on function ban_le_luu_gu(uuid, text[]) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function ban_le_luu_gu(uuid, text[]) from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function ban_le_luu_gu(uuid, text[]) to authenticated';
  end if;
end
$$;


-- =============================================================================
-- bo_tai_quay_theo_gu — khách (anon) đọc các phần thịt đã gắn gu, đúng thứ tiếng
-- =============================================================================
-- Tên, mô tả, cách dùng theo cùng luật dịch của Mua thịt về (chu_dich_con_hieu_luc, 0101): bản dịch en / ko chỉ
-- dùng khi còn khớp câu tiếng Việt hiện tại, không thì câu tiếng Việt. Không giá, không gói, không tồn: giá ở quán
-- chỉ có trên nhãn khay.
create or replace function bo_tai_quay_theo_gu(p_ngon_ngu text default 'vi')
returns table (
  san_pham_ma text,
  ten         text,
  ten_vi      text,
  mo_ta       text,
  cach_dung   text,
  gu          text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select x.ma,
         chu_dich_con_hieu_luc(p_ngon_ngu, x.ban_dich, 'ten', x.ten_vi, x.ten_en, x.ten_ko),
         x.ten_vi,
         chu_dich_con_hieu_luc(p_ngon_ngu, x.ban_dich, 'mo_ta', x.mo_ta_vi, x.mo_ta_en, x.mo_ta_ko),
         chu_dich_con_hieu_luc(p_ngon_ngu, x.ban_dich, 'cach_dung', x.cach_dung_vi, x.cach_dung_en, x.cach_dung_ko),
         x.gu
  from ban_le_san_pham x
  where x.loai = 'thit'
    and x.trang_thai = 'dang_ban'
    and cardinality(x.gu) > 0
    and not la_van_ban_tam(x.ten_vi)
  order by x.thu_tu, x.ten_vi, x.id
$$;

revoke all on function bo_tai_quay_theo_gu(text) from public;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'grant execute on function bo_tai_quay_theo_gu(text) to anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function bo_tai_quay_theo_gu(text) to authenticated';
  end if;
end
$$;
