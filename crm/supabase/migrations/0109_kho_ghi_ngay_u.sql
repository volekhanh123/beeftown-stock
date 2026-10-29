-- =============================================================================
-- BEEFTOWN KHO — 0109 · NGÀY Ủ CỦA TỪNG TẢNG Ủ: GHI TAY, GIỮ MÃI ĐỂ SAU NÀY RA CÔNG THỨC
-- =============================================================================
-- PHẢI CHẠY SAU 0107 (kho_v_tang có tảng ủ, ba cột loai_tang / ngay_bat_dau_u / so_ngay_u).
--
-- Khánh chốt 29/10/2026: "Về ngày ủ của từng miếng ấy, hiện tại giờ bạn ghi nhận thủ công nhé, tức là giờ hiện không
-- có công thức ủ, nhưng vẫn nhớ lưu giữ lại về sau tôi sẽ làm phân tích để có công thức."
--
-- Trước 0109 tảng ủ (sau trim, 0107) không có ngày ủ xong: bảng ủ (kho_bang_u, 0048) là công thức tuổi thịt → số
-- ngày ủ cho NGUYÊN tảng, tảng ủ không dùng. kho_lo bất biến (kho_lo_chan_sua, 0020) nên số ngày ủ ghi tay không nằm
-- được trên lô — nằm ở một bảng nhật ký riêng, chỉ thêm.
--
-- Đổi trong file này:
--   1. kho_ghi_u (bảng mới): mỗi lần người có quyền pha_loc ghi "tảng ủ này ủ N ngày" là MỘT dòng — số ngày, ngày bắt
--      đầu ủ (ngày trim) chụp lại, ngày ủ xong = ngày bắt đầu + N, ai ghi, lúc nào. Sửa số = thêm dòng mới; dòng cũ
--      giữ nguyên (trigger kho_ghi_u_chan_sua_xoa chặn sửa / xoá) — lần ghi đầu (đoán lúc trim) và lần cuối (thật sự ủ
--      bao lâu) đều còn để phân tích. Dòng gắn với TẢNG (tang_id = tảng gốc của lô tảng ủ, kho_lo.tang_goc_id, 0050),
--      không chỉ với lô: mở lại phiên trim rồi chốt lại sinh lô tảng ủ mới cùng tảng gốc — số ngày đã ghi vẫn theo
--      tảng. Đọc: vai xem của chi nhánh. Ghi: chỉ qua kho_ghi_ngay_u.
--   2. kho_v_ghi_u_cuoi (view mới): lần ghi gần nhất của mỗi tảng — MỘT luật "gần nhất" cho kho_v_tang,
--      kho_ghi_ngay_u và kho_nhat_ky_u.
--   3. kho_ghi_ngay_u(lô tảng ủ, số ngày, mã gửi) — hàm mới: chỉ tảng ủ (lô món loại tảng sinh từ pha lóc), còn trong
--      kho, chưa vào phiên cắt nào đã chốt; 0–365 ngày; cùng mã gửi (bấm đúp, F5) không thêm dòng và trả đúng kết quả
--      của lần bấm đầu; cùng số với lần ghi gần nhất không thêm dòng. Khóa kho_cai_dat như kho_chot_phien_pha: không
--      ghi chen lúc tảng đang được cắt.
--   4. kho_v_tang (thay định nghĩa, giữ nguyên các cột cũ, thêm một cột cuối): tảng ủ có ngày ủ xong = ngày trim của
--      lô + số ngày ghi gần nhất → tình trạng dang_u / san_sang như nguyên tảng có bảng ủ (lóc một chạm chỉ hiện khi
--      ủ xong; cắt sớm thì bấm loại tảng ở Pha lóc mới — câu nhắc "còn đang ủ"). Cột mới so_ngay_u_ghi = số ngày của
--      lần ghi gần nhất (null = chưa ghi).
--   5. kho_nhat_ky_u(chi nhánh, từ, đến) — hàm đọc mới cho file Excel "Nhật ký ủ": mỗi tảng ủ trim trong kỳ một dòng
--      — số tảng, món, ngày mổ, ngày nhận, ngày bắt đầu ủ, tuổi thịt lúc bắt đầu ủ, kg vào ủ, số ngày ủ ghi lần đầu /
--      lần cuối, số lần ghi, ai ghi, ngày cắt, số ngày ủ thật, kg lúc cắt, kg cắt ra, hao từ trim tới cắt xong %.
--      Không có tiền.
-- Một bảng mới, một view mới, ba hàm mới (một hàm trigger nội bộ). kho_v_tang thay bằng create or replace: quyền giữ
-- nguyên.
--
-- Triển khai: chạy migration trước, deploy web sau (web đọc bảng và cột mới; web cũ không đọc chúng — chạy migration
-- trước không làm hỏng web cũ). Không có câu xoá. Chỉ chạy lên production sau khi PR được gộp, rồi
-- `npm run doi-chieu` phải báo KHỚP.
-- =============================================================================


-- =============================================================================
-- 1 · kho_ghi_u — NHẬT KÝ SỐ NGÀY Ủ GHI TAY (CHỈ THÊM)
-- =============================================================================
create table kho_ghi_u (
  id             uuid primary key default gen_random_uuid(),
  chi_nhanh_id   uuid not null references chi_nhanh(id) on delete restrict,
  lo_id          uuid not null references kho_lo(id) on delete restrict,
  -- Tảng của dòng ghi: tảng gốc của lô tảng ủ (coalesce(tang_goc_id, id)) — giữ qua lần mở lại phiên trim.
  tang_id        uuid not null references kho_lo(id) on delete restrict,
  ma_gui         uuid not null,
  so_ngay_u      int not null,
  ngay_bat_dau_u date not null,
  ngay_u_xong    date not null,
  nguoi          uuid references nhan_su(id) on delete set null,
  -- clock_timestamp: hai lần ghi trong cùng một giao dịch vẫn xếp đúng thứ tự (lần gần nhất là lần sau).
  created_at     timestamptz not null default clock_timestamp(),

  constraint kho_ghi_u_ma_gui_duy_nhat unique (ma_gui),
  constraint kho_ghi_u_so_ngay_hop_le check (so_ngay_u between 0 and 365),
  constraint kho_ghi_u_ngay_khop check (ngay_u_xong = ngay_bat_dau_u + so_ngay_u)
);

create index kho_ghi_u_tang_idx on kho_ghi_u(tang_id, created_at desc);

comment on table kho_ghi_u is
  'Số ngày ủ ghi tay của từng tảng ủ (0109): mỗi lần ghi một dòng, không sửa, không xoá — lần gần nhất là số đang dùng (kho_v_tang). Giữ mọi lần để sau này phân tích ra công thức ủ. Chỉ ghi qua kho_ghi_ngay_u.';
comment on column kho_ghi_u.tang_id is 'Tảng gốc của lô tảng ủ (kho_lo.tang_goc_id; lô không có tảng gốc thì chính lô). Số ngày ủ theo tảng, không theo lô: mở lại phiên trim rồi chốt lại vẫn giữ (0109).';
comment on column kho_ghi_u.ngay_bat_dau_u is 'Ngày trim (ngày đóng gói của lô tảng ủ) chụp lại lúc ghi (0109).';
comment on column kho_ghi_u.ngay_u_xong is 'Ngày ủ xong = ngày bắt đầu ủ + số ngày ủ (0109).';

alter table kho_ghi_u enable row level security;
create policy kho_ghi_u_doc on kho_ghi_u
  for select using (chi_nhanh_id = any ((select kho_cn_duoc('xem'))::uuid[]));

-- security invoker, chỉ là trigger: không đọc gì, chỉ chặn.
create or replace function kho_ghi_u_chan_sua_xoa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Nhật ký ủ chỉ thêm, không sửa, không xoá — muốn đổi số ngày ủ thì ghi lần nữa'
    using errcode = 'restrict_violation';
end;
$$;

comment on function kho_ghi_u_chan_sua_xoa is
  'Trigger: dòng nhật ký ủ (kho_ghi_u) không sửa, không xoá được — dữ liệu để phân tích công thức ủ (0109).';

create trigger kho_ghi_u_chan_sua
  before update or delete on kho_ghi_u
  for each row execute function kho_ghi_u_chan_sua_xoa();


-- Lần ghi gần nhất của mỗi tảng. RLS của kho_ghi_u vẫn áp dụng (security_invoker).
create view kho_v_ghi_u_cuoi with (security_invoker = true) as
select distinct on (k.tang_id)
       k.tang_id, k.lo_id, k.chi_nhanh_id, k.so_ngay_u, k.ngay_bat_dau_u, k.ngay_u_xong, k.nguoi, k.created_at
from kho_ghi_u k
order by k.tang_id, k.created_at desc, k.id desc;

comment on view kho_v_ghi_u_cuoi is
  'Lần ghi số ngày ủ gần nhất của mỗi tảng (0109) — một luật "gần nhất" (created_at, rồi id) cho kho_v_tang, kho_ghi_ngay_u, kho_nhat_ky_u.';


-- =============================================================================
-- 2 · kho_ghi_ngay_u — GHI "TẢNG Ủ NÀY Ủ N NGÀY"
-- =============================================================================
create or replace function kho_ghi_ngay_u(p_lo_id uuid, p_so_ngay int, p_ma_gui uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lo   kho_lo;
  v_mh   kho_mat_hang;
  v_so   text;
  v_tang uuid;
  v_cu   kho_ghi_u;
  v_moi  kho_ghi_u;
  v_truoc int;
begin
  select * into v_lo from kho_lo where id = p_lo_id;
  if not found or not kho_duoc(v_lo.chi_nhanh_id, 'pha_loc') then
    raise exception 'Không tìm thấy tảng ủ, hoặc tài khoản không được ghi ngày ủ'
      using errcode = 'insufficient_privilege';
  end if;
  if p_ma_gui is null then
    raise exception 'Thiếu mã gửi — tải lại trang rồi làm lại' using errcode = 'check_violation';
  end if;

  select * into v_mh from kho_mat_hang where id = v_lo.mat_hang_id;
  -- Tảng ủ = lô món loại tảng sinh từ pha lóc (trim) — cùng điều kiện với kho_v_tang (0107).
  if v_lo.nguon <> 'pha_loc' or v_mh.loai <> 'tang' then
    raise exception 'Chỉ ghi ngày ủ cho tảng ủ (tảng đã trim) — "%" không phải tảng ủ', v_mh.ten
      using errcode = 'check_violation';
  end if;
  if p_so_ngay is null or p_so_ngay not between 0 and 365 then
    raise exception 'Số ngày ủ phải là số nguyên từ 0 đến 365' using errcode = 'check_violation';
  end if;
  v_so := coalesce('#' || lpad(coalesce(v_lo.so_tang, (select g.so_tang from kho_lo g where g.id = v_lo.tang_goc_id))::text, 4, '0'),
                   v_lo.ma_lo);
  v_tang := coalesce(v_lo.tang_goc_id, v_lo.id);

  -- Cùng khóa với kho_chot_phien_pha: không ghi chen vào lúc tảng đang được cắt; hai lần bấm cùng mã gửi đi lần lượt.
  perform 1 from kho_cai_dat where chi_nhanh_id = v_lo.chi_nhanh_id for update;

  -- Bấm đúp / F5: cùng mã gửi → không thêm dòng, trả đúng kết quả của lần bấm đầu (câu "Đã lưu" / "Đã đổi" như
  -- lần đầu — trình duyệt hiện câu của lần bấm sau cùng).
  select * into v_cu from kho_ghi_u where ma_gui = p_ma_gui;
  if found then
    if v_cu.lo_id <> v_lo.id then
      raise exception 'Thiếu mã gửi — tải lại trang rồi làm lại' using errcode = 'check_violation';
    end if;
    select k.so_ngay_u into v_truoc from kho_ghi_u k
    where k.tang_id = v_cu.tang_id and (k.created_at, k.id) < (v_cu.created_at, v_cu.id)
    order by k.created_at desc, k.id desc limit 1;
    return jsonb_build_object('da_co', false, 'so_tang', v_so, 'so_ngay_u', v_cu.so_ngay_u,
                              'ngay_u_xong', v_cu.ngay_u_xong, 'so_ngay_cu', v_truoc);
  end if;

  if exists (select 1 from kho_phien_pha_vao v join kho_phien_pha p on p.id = v.phien_pha_id
             where v.lo_id = v_lo.id and p.trang_thai = 'da_chot') then
    raise exception 'Tảng ủ % đã cắt — số ngày ủ giữ nguyên như lúc cắt để sau này phân tích', v_so
      using errcode = 'check_violation';
  end if;
  if not exists (select 1 from kho_ton x where x.lo_id = v_lo.id and x.so_kg > 0) then
    raise exception 'Tảng ủ % không còn trong kho — không ghi ngày ủ được', v_so using errcode = 'check_violation';
  end if;

  -- Cùng số với lần ghi gần nhất của tảng: không thêm dòng (nhật ký chỉ ghi lần đổi).
  select c.so_ngay_u into v_truoc from kho_v_ghi_u_cuoi c where c.tang_id = v_tang;
  if v_truoc = p_so_ngay then
    return jsonb_build_object('da_co', true, 'so_tang', v_so, 'so_ngay_u', p_so_ngay,
                              'ngay_u_xong', v_lo.ngay_dong_goi + p_so_ngay);
  end if;

  insert into kho_ghi_u (chi_nhanh_id, lo_id, tang_id, ma_gui, so_ngay_u, ngay_bat_dau_u, ngay_u_xong, nguoi)
  values (v_lo.chi_nhanh_id, v_lo.id, v_tang, p_ma_gui, p_so_ngay, v_lo.ngay_dong_goi, v_lo.ngay_dong_goi + p_so_ngay,
          (nhan_su_hien_tai()).id)
  returning * into v_moi;

  return jsonb_build_object('da_co', false, 'so_tang', v_so, 'so_ngay_u', v_moi.so_ngay_u,
                            'ngay_u_xong', v_moi.ngay_u_xong, 'so_ngay_cu', v_truoc);
end;
$$;

comment on function kho_ghi_ngay_u is
  'Ghi số ngày ủ của một tảng ủ (quyền pha_loc, 0109): tảng ủ còn trong kho, chưa cắt; 0–365 ngày. Mỗi lần đổi số một dòng kho_ghi_u (gắn với tảng gốc); cùng mã gửi (trả kết quả lần đầu) hoặc cùng số với lần gần nhất thì không thêm dòng.';


-- =============================================================================
-- 3 · kho_v_tang — TẢNG Ủ CÓ NGÀY Ủ XONG TỪ LẦN GHI GẦN NHẤT
-- =============================================================================
-- Chép 0107; chỗ đổi ghi 0109: ngày ủ xong của tảng ủ = ngày trim của lô + số ngày ghi gần nhất của tảng
-- (kho_v_ghi_u_cuoi; lô bất biến nên kho_lo.ngay_u_xong của tảng ủ luôn null); cột cuối so_ngay_u_ghi.
create or replace view kho_v_tang with (security_invoker = true) as
select l.chi_nhanh_id,
       l.id            as lo_id,
       l.ma_lo,
       coalesce(l.so_tang, g.so_tang) as so_tang,          -- 0107: tảng ủ mang số của tảng gốc
       l.mat_hang_id,
       m.ma            as ma_hang,
       m.ten           as ten_hang,
       coalesce(l.ngay_mo, g.ngay_mo) as ngay_mo,          -- 0107
       l.ngay_dong_goi as ngay_nhan,
       coalesce(l.ngay_u_xong, l.ngay_dong_goi + u.so_ngay_u) as ngay_u_xong,  -- 0109: tảng ủ — số ngày ghi tay
       l.han_dung,
       (hom_nay_vn() - coalesce(l.ngay_mo, g.ngay_mo)) as tuoi_ngay,
       (coalesce(l.ngay_u_xong, l.ngay_dong_goi + u.so_ngay_u) - hom_nay_vn()) as con_ngay_u,  -- 0109
       case
         when coalesce(l.ngay_u_xong, l.ngay_dong_goi + u.so_ngay_u) is null then 'chua_co_bang_u'  -- 0109
         when coalesce(l.ngay_u_xong, l.ngay_dong_goi + u.so_ngay_u) > hom_nay_vn() then 'dang_u'   -- 0109
         else 'san_sang'
       end as tinh_trang_u,
       t.so_kg,
       t.so_goi,
       t.vi_tri,
       case when l.nguon = 'pha_loc' then 'u' else 'nguyen' end as loai_tang,            -- 0107
       case when l.nguon = 'pha_loc' then l.ngay_dong_goi end as ngay_bat_dau_u,         -- 0107: ngày trim
       case when l.nguon = 'pha_loc' then hom_nay_vn() - l.ngay_dong_goi end as so_ngay_u, -- 0107
       u.so_ngay_u as so_ngay_u_ghi                                                      -- 0109
from kho_lo l
join kho_mat_hang m on m.id = l.mat_hang_id
left join kho_lo g on g.id = l.tang_goc_id
join lateral (
  select sum(x.so_kg) as so_kg, sum(x.so_goi) as so_goi,
         string_agg(v.ten, ', ' order by v.ten) as vi_tri
  from kho_ton x join kho_vi_tri v on v.id = x.vi_tri_id
  where x.lo_id = l.id and (x.so_kg > 0 or x.so_goi > 0)
) t on t.so_kg is not null
left join kho_v_ghi_u_cuoi u                                                             -- 0109: chỉ tảng ủ
  on l.nguon = 'pha_loc' and u.tang_id = coalesce(l.tang_goc_id, l.id)
where (m.theo_tang and l.nguon in ('nhap', 'ton_dau'))
   or (m.loai = 'tang' and l.nguon = 'pha_loc');                                        -- 0107: tảng ủ

comment on view kho_v_tang is
  'Tảng còn tồn: nguyên tảng (lô nhận hàng của món theo dõi theo tảng — loai_tang nguyen) và tảng ủ (lô món loại tảng sinh từ pha lóc / trim — loai_tang u, số tảng và ngày mổ của tảng gốc, ngày bắt đầu ủ, số ngày đã ủ, số ngày ủ ghi tay so_ngay_u_ghi). Số tảng, ngày mổ, tuổi thịt, ngày ủ xong (nguyên tảng: bảng ủ; tảng ủ: lần ghi tay gần nhất), tình trạng (dang_u / san_sang / chua_co_bang_u). Không có tiền (0048, 0107, 0109).';


-- =============================================================================
-- 4 · kho_nhat_ky_u — NHẬT KÝ Ủ ĐỂ PHÂN TÍCH (FILE EXCEL)
-- =============================================================================
-- Mỗi tảng ủ trim trong kỳ (ngày trim từ p_tu tới p_den) một dòng. Tảng ủ = lô món loại tảng của một phiên trim còn
-- chốt (dòng ra của phiên trỏ tới lô — phiên mở lại thì lô cũ không còn được trỏ tới, không tính hai lần; số ngày
-- đã ghi đi theo tảng nên vẫn ở dòng của lô mới). Cắt = phiên lóc đã chốt có lô tảng ủ làm đầu vào. Kg cắt ra của
-- tảng = kg ra không bỏ đi của phiên cắt, chia theo tỉ lệ kg của tảng trong kg vào phiên (thường một phiên một tảng).
-- Hao từ trim tới cắt xong % = (kg vào ủ − kg cắt ra) ÷ kg vào ủ — gồm phần nhẹ đi lúc ủ (kể cả phần kiểm kê đã trừ),
-- phần bỏ đi và hao lúc cắt; chỉ tính khi tảng ủ đã hết và không kg nào rời lô theo đường khác (bán, xuất bếp, huỷ,
-- trả nhà cung cấp, xuất khác — sổ kho, trừ dòng đã đảo).
create or replace function kho_nhat_ky_u(p_chi_nhanh_id uuid, p_tu date, p_den date)
returns table (
  lo_id           uuid,
  so_tang         int,
  ma_lo           text,
  ten_hang        text,
  ten_hang_goc    text,
  ngay_mo         date,
  ngay_nhan       date,
  ngay_bat_dau_u  date,
  tuoi_luc_u      int,
  kg_vao_u        numeric,
  so_ngay_u_dau   int,
  so_ngay_u_ghi   int,
  ngay_u_xong     date,
  so_lan_ghi      int,
  nguoi_ghi       text,
  ngay_ghi_cuoi   date,
  ngay_cat        date,
  so_ngay_u_that  int,
  kg_luc_cat      numeric,
  kg_cat_ra       numeric,
  hao_pt          numeric,
  tinh_trang      text
)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if not kho_duoc(p_chi_nhanh_id, 'xem') then
    raise exception 'Tài khoản của bạn không xem được kho của chi nhánh này'
      using errcode = 'insufficient_privilege';
  end if;
  if p_tu is null or p_den is null or p_tu > p_den then
    raise exception 'Chọn khoảng ngày (từ ngày không sau đến ngày)' using errcode = 'check_violation';
  end if;
  if p_den - p_tu > 366 then
    raise exception 'Khoảng ngày tối đa 1 năm' using errcode = 'check_violation';
  end if;

  return query
  select l.id,
         coalesce(l.so_tang, g.so_tang),
         l.ma_lo,
         m.ten,
         mg.ten,
         coalesce(l.ngay_mo, g.ngay_mo),
         g.ngay_dong_goi,
         l.ngay_dong_goi,
         l.ngay_dong_goi - coalesce(l.ngay_mo, g.ngay_mo),
         r.so_kg,
         u.dau,
         uc.so_ngay_u,
         l.ngay_dong_goi + uc.so_ngay_u,
         u.so_lan,
         ns.ho_ten,
         ngay_vn(uc.created_at),
         c.ngay_cat,
         c.ngay_cat - l.ngay_dong_goi,
         c.kg_luc_cat,
         c.kg_cat_ra,
         case when c.ngay_cat is not null and r.so_kg > 0 and con.kg = 0 and khac.kg = 0
              then round((r.so_kg - c.kg_cat_ra) / r.so_kg * 100, 1) end,
         case when c.ngay_cat is not null then 'da_cat'
              when con.kg > 0 then 'dang_u'
              else 'khac' end
  from kho_lo l
  join kho_mat_hang m on m.id = l.mat_hang_id and m.loai = 'tang'
  join kho_phien_pha_ra r on r.lo_id = l.id
  join kho_phien_pha pt on pt.id = r.phien_pha_id and pt.trang_thai = 'da_chot'
  left join kho_lo g on g.id = l.tang_goc_id
  left join kho_mat_hang mg on mg.id = g.mat_hang_id
  left join lateral (
    select count(*)::int as so_lan,
           (array_agg(k.so_ngay_u order by k.created_at, k.id))[1] as dau
    from kho_ghi_u k where k.tang_id = coalesce(l.tang_goc_id, l.id)
  ) u on true
  left join kho_v_ghi_u_cuoi uc on uc.tang_id = coalesce(l.tang_goc_id, l.id)
  left join nhan_su ns on ns.id = uc.nguoi
  join lateral (select coalesce(sum(x.so_kg), 0) as kg from kho_ton x where x.lo_id = l.id) con on true
  join lateral (
    select coalesce(sum(s.so_kg), 0) + coalesce(sum(d.so_kg), 0) as kg
    from kho_so_cai s left join kho_so_cai d on d.dao_cua = s.id
    where s.lo_id = l.id and s.loai in ('ban', 'xuat_bep', 'huy', 'tra_ncc', 'xuat_khac')
  ) khac on true
  left join lateral (
    select min(p.ngay_pha) as ngay_cat,
           sum(v.so_kg) as kg_luc_cat,
           round(sum(ra.kg_ra * v.so_kg / nullif(vt.kg_vao, 0)), 3) as kg_cat_ra
    from kho_phien_pha_vao v
    join kho_phien_pha p on p.id = v.phien_pha_id and p.trang_thai = 'da_chot'
    join lateral (select sum(x.so_kg) as kg_vao from kho_phien_pha_vao x where x.phien_pha_id = p.id) vt on true
    join lateral (select coalesce(sum(x.so_kg), 0) as kg_ra from kho_phien_pha_ra x
                  where x.phien_pha_id = p.id and x.xu_ly <> 'bo') ra on true
    where v.lo_id = l.id
  ) c on true
  where l.chi_nhanh_id = p_chi_nhanh_id
    and l.nguon = 'pha_loc'
    and l.ngay_dong_goi between p_tu and p_den
  order by l.ngay_dong_goi, coalesce(l.so_tang, g.so_tang), l.ma_lo;
end;
$$;

comment on function kho_nhat_ky_u is
  'Nhật ký ủ (0109, quyền xem): mỗi tảng ủ trim trong kỳ một dòng — tuổi thịt lúc bắt đầu ủ, kg vào ủ, số ngày ủ ghi tay (lần đầu, lần cuối, số lần, ai ghi), ngày cắt, số ngày ủ thật, kg lúc cắt, kg cắt ra, hao từ trim tới cắt xong %. Dữ liệu để phân tích ra công thức ủ. Không có tiền.';


-- =============================================================================
-- 5 · THU QUYỀN — đúng hàm của file này (0008 mục 6)
-- =============================================================================
-- kho_ghi_ngay_u, kho_nhat_ky_u: authenticated gọi được (tự kiểm vai), anon thì không. Hàm trigger: thu cả
-- authenticated (test-kho-quyen.mjs NOI_BO). Danh sách anon không đổi.
do $$
begin
  execute 'revoke execute on function kho_ghi_ngay_u(uuid, int, uuid) from public';
  execute 'revoke execute on function kho_nhat_ky_u(uuid, date, date) from public';
  execute 'revoke execute on function kho_ghi_u_chan_sua_xoa() from public';
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke execute on function kho_ghi_ngay_u(uuid, int, uuid) from anon';
    execute 'revoke execute on function kho_nhat_ky_u(uuid, date, date) from anon';
    execute 'revoke execute on function kho_ghi_u_chan_sua_xoa() from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function kho_ghi_ngay_u(uuid, int, uuid) to authenticated';
    execute 'grant execute on function kho_nhat_ky_u(uuid, date, date) to authenticated';
    execute 'revoke execute on function kho_ghi_u_chan_sua_xoa() from authenticated';
  end if;
end
$$;
