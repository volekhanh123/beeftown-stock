-- =============================================================================
-- TẠO DỮ LIỆU THỬ CHO KHO — CHỈ CHẠY TRÊN PROJECT THỬ (Beeftown-thu)
-- =============================================================================
-- ~73 mặt hàng (tảng theo từng tảng, tảng thùng, phần cắt có ô mã, phụ phẩm,
-- hàng đóng gói), 6 nhà cung cấp THỬ, công thức lóc, bảng ủ, ghép món iPOS,
-- rồi mô phỏng 5 tuần vận hành: nhập + repack → ủ → lóc 1 tảng, giao ô →
-- ra quầy → bán qua iPOS (trừ đúng lô tảng) → huỷ hàng hết hạn → trả nợ NCC.
--
-- Mọi phiếu đi qua ĐÚNG hàm nghiệp vụ như trên web, đóng vai từng người
-- "(tập)": thủ kho lập, kế toán điền giá và duyệt, quản lý duyệt huỷ, chủ nối
-- iPOS. Sổ kho, tồn, giá vốn, hạn dùng, ô mã đều do code thật tính.
-- Riêng NGÀY GIỜ của phiếu chuyển/huỷ, lúc giao ô và giờ tạo phiếu được dời
-- về đúng ngày mô phỏng (hàm luôn ghi "hôm nay") — không sửa số lượng hay tiền.
--
-- Chạy: xoá trước (xoa-du-lieu-kho.sql), rồi dán cả file này vào Supabase →
-- SQL Editor → Run. Mất khoảng 1–2 phút. Chạy lại nhiều lần đều được (sau khi xoá).
--
-- Chốt an toàn: có chi nhánh nào tên không chứa "BẢN THỬ" → dừng. Kho chưa
-- trống → dừng. Không phải migration — đừng chép vào crm/supabase/migrations.
-- =============================================================================


-- =============================================================================
-- 0 · HÀM PHỤ (chỉ sống trong phiên này — pg_temp)
-- =============================================================================
create or replace function pg_temp.chot_an_toan() returns void language plpgsql as $f$
begin
  if not exists (select 1 from chi_nhanh) or exists (select 1 from chi_nhanh where ten not like '%BẢN THỬ%') then
    raise exception 'DỪNG: database này có chi nhánh không phải "BẢN THỬ" — script chỉ chạy trên project thử';
  end if;
end $f$;

-- Đóng vai một nhân sự (uid) như khi đăng nhập web; null = trở lại postgres.
create or replace function pg_temp.vai(p uuid) returns void language plpgsql as $f$
begin
  perform set_config('request.jwt.claims',
    case when p is null then '' else json_build_object('sub', p, 'role', 'authenticated')::text end, true);
  perform set_config('request.jwt.claim.sub', coalesce(p::text, ''), true);
  if p is null then
    reset role;
  else
    set local role authenticated;
  end if;
end $f$;

-- Giờ VN của một ngày: luc('2026-09-01', 9.5) = 09:30 sáng giờ Việt Nam.
create or replace function pg_temp.luc(p_ngay date, p_gio numeric) returns timestamptz language sql immutable as $f$
  select (p_ngay + make_interval(secs => p_gio * 3600)) at time zone 'Asia/Ho_Chi_Minh'
$f$;

-- Tắt/bật trigger chặn sửa (sổ kho, lô) — CHỈ để dời ngày giờ, không sửa số.
-- Phải dùng lệnh SET: Supabase không cho postgres đặt tham số này qua set_config().
create or replace function pg_temp.sua_ngay(p_bat boolean) returns void language plpgsql as $f$
begin
  if p_bat then
    set local session_replication_role = replica;
  else
    set local session_replication_role = origin;
  end if;
end $f$;

do $$
begin
  perform pg_temp.chot_an_toan();
  if exists (select 1 from kho_mat_hang) or exists (select 1 from kho_nha_cung_cap) or exists (select 1 from kho_lo) then
    raise exception 'DỪNG: kho chưa trống — chạy crm/supabase/thu/xoa-du-lieu-kho.sql trước';
  end if;
end
$$;


-- =============================================================================
-- 1 · THAM SỐ MẶT HÀNG (bảng tạm)
-- =============================================================================
drop table if exists pg_temp.t_mh;
create temp table t_mh (
  ma text primary key, ten text not null, nhom text, loai text not null,
  dem_goi boolean not null default true, don_vi text, han int, gia_ban bigint,
  xu_ly text not null default 'nhap_kho', ma_can text, theo_tang boolean not null default false,
  ncc text,               -- nhà cung cấp (N1..N6)
  gia_mua bigint,         -- đ/kg
  kg_min numeric, kg_max numeric,   -- kg một tảng/thùng
  goi_kg numeric,         -- kg một gói phần cắt / hàng đóng gói
  cha text,               -- phần cắt: lóc từ tảng nào
  ty_le numeric,          -- % kg tảng ra phần cắt này
  so_o int not null default 0,      -- số ô mã
  ban_ngay numeric,       -- số gói bán trung bình mỗi ngày
  ma_ipos text,           -- hàng đóng gói: mã món trên iPOS
  thu_hoi bigint,         -- phụ phẩm: giá trị thu hồi đ/kg
  stt int,
  kg_ngay numeric,        -- tảng: kg tảng dùng mỗi ngày (tính ở dưới)
  id uuid
);

-- Tảng theo dõi từng tảng (theo_tang): có số tảng, bảng ủ, lóc 1 tảng/phiên, ô mã.
insert into t_mh (ma, ten, nhom, loai, don_vi, han, theo_tang, ncc, gia_mua, kg_min, kg_max)
select ma, ten, nhom, 'tang', 'tảng', han, true, ncc, gia, kmin, kmax from (values
  ('T-WAU-RIB', 'Ribeye Wagyu Úc MB4-5 (tảng)',     'Wagyu Úc',     'N1', 1450000, 5.0, 6.5, 45),
  ('T-WAU-STR', 'Striploin Wagyu Úc MB4-5 (tảng)',  'Wagyu Úc',     'N1', 1250000, 4.5, 6.0, 45),
  ('T-WAU-TEN', 'Tenderloin Wagyu Úc MB4-5 (tảng)', 'Wagyu Úc',     'N1', 1600000, 2.2, 3.0, 45),
  ('T-ANG-RIB', 'Ribeye Angus Úc 150 ngày (tảng)',  'Angus Úc',     'N2',  650000, 5.0, 7.0, 40),
  ('T-ANG-STR', 'Striploin Angus Úc (tảng)',        'Angus Úc',     'N2',  560000, 4.5, 6.0, 40),
  ('T-ANG-TEN', 'Tenderloin Angus Úc (tảng)',       'Angus Úc',     'N1',  780000, 2.0, 2.8, 40),
  ('T-ANG-CHK', 'Chuck roll Angus Úc (tảng)',       'Angus Úc',     'N2',  380000, 8.0, 10.0, 40),
  ('T-ANG-BRK', 'Brisket Angus Úc (tảng)',          'Angus Úc',     'N2',  320000, 6.0, 8.0, 40),
  ('T-USP-RIB', 'Ribeye Mỹ Prime (tảng)',           'Bò Mỹ Prime',  'N3',  720000, 6.0, 7.5, 40),
  ('T-USP-SPL', 'Short plate Mỹ Prime (tảng)',      'Bò Mỹ Prime',  'N3',  420000, 5.0, 7.0, 40),
  ('T-USC-STR', 'Striploin Mỹ Choice (tảng)',       'Bò Mỹ Choice', 'N4',  520000, 5.0, 6.5, 35),
  ('T-USC-TOP', 'Top blade Mỹ Choice (tảng)',       'Bò Mỹ Choice', 'N4',  450000, 3.0, 4.0, 35),
  ('T-USC-RMP', 'Rump cap Mỹ Choice (tảng)',        'Bò Mỹ Choice', 'N4',  480000, 1.5, 2.0, 35),
  ('T-JPA-STR', 'Striploin Wagyu Nhật A5 (tảng)',   'Wagyu Nhật',   'N5', 3200000, 4.0, 5.0, 30)
) v(ma, ten, nhom, ncc, gia, kmin, kmax, han);

-- Tảng mua theo thùng (không theo dõi từng tảng).
insert into t_mh (ma, ten, nhom, loai, don_vi, han, ncc, gia_mua, kg_min, kg_max)
select ma, ten, 'Bò thùng', 'tang', 'thùng', 30, 'N6', gia, kmin, kmax from (values
  ('T-SUON', 'Sườn bò Úc có xương (thùng)', 280000, 18.0, 22.0),
  ('T-BAP',  'Bắp bò Úc (thùng)',           230000, 20.0, 25.0),
  ('T-GAU',  'Gầu bò Úc (thùng)',           260000, 18.0, 22.0),
  ('T-NAM',  'Nạm bò Úc (thùng)',           210000, 20.0, 24.0),
  ('T-DUOI', 'Đuôi bò Úc (thùng)',          190000, 15.0, 18.0)
) v(ma, ten, gia, kmin, kmax);

-- Phần cắt: mã cân = 100 + stt; ô mã = 1 + stt (2 số) + số ô → 10011, 10012…
insert into t_mh (stt, ma, ten, loai, don_vi, han, gia_ban, cha, ty_le, goi_kg, so_o, ban_ngay)
select stt, ma, ten, 'phan_cat', 'gói', han, gia, cha, ty, goi, so_o, ban from (values
  ( 1, 'C-WAU-RIB-ST',  'Steak Ribeye Wagyu Úc',          4, 2900000, 'T-WAU-RIB', 62, 0.30, 6, 3.0),
  ( 2, 'C-WAU-RIB-SL',  'Ribeye Wagyu Úc cắt lát nướng',  3, 2600000, 'T-WAU-RIB', 14, 0.25, 4, 1.5),
  ( 3, 'C-WAU-RIB-KH',  'Wagyu Úc cắt khối',              3, 1900000, 'T-WAU-RIB',  6, 0.25, 3, 1.0),
  ( 4, 'C-WAU-STR-ST',  'Steak Striploin Wagyu Úc',       4, 2500000, 'T-WAU-STR', 68, 0.30, 6, 3.0),
  ( 5, 'C-WAU-STR-SL',  'Striploin Wagyu Úc shabu',       3, 2200000, 'T-WAU-STR', 14, 0.20, 4, 1.5),
  ( 6, 'C-WAU-TEN-ST',  'Filet mignon Wagyu Úc',          4, 3300000, 'T-WAU-TEN', 72, 0.20, 4, 2.0),
  ( 7, 'C-ANG-RIB-ST',  'Steak Ribeye Angus Úc',          4, 1350000, 'T-ANG-RIB', 60, 0.35, 6, 4.0),
  ( 8, 'C-ANG-RIB-SL',  'Ribeye Angus cắt lát nướng',     3, 1150000, 'T-ANG-RIB', 20, 0.30, 4, 2.0),
  ( 9, 'C-ANG-STR-ST',  'Steak Striploin Angus Úc',       4, 1150000, 'T-ANG-STR', 65, 0.30, 6, 3.0),
  (10, 'C-ANG-STR-LL',  'Bò lúc lắc Striploin Angus',     3,  780000, 'T-ANG-STR', 15, 0.30, 4, 2.0),
  (11, 'C-ANG-TEN-ST',  'Filet mignon Angus Úc',          4, 1550000, 'T-ANG-TEN', 72, 0.20, 4, 2.0),
  (12, 'C-ANG-CHK-EY',  'Steak Chuck eye Angus',          4,  890000, 'T-ANG-CHK', 35, 0.30, 5, 2.0),
  (13, 'C-ANG-CHK-SL',  'Thăn vai Angus cắt lát lẩu',     3,  690000, 'T-ANG-CHK', 30, 0.30, 5, 3.0),
  (14, 'C-ANG-CHK-XAY', 'Bò xay Angus',                   2,  420000, 'T-ANG-CHK', 15, 0.50, 3, 1.5),
  (15, 'C-ANG-BRK-SL',  'Gầu Angus cắt lát nướng',        3,  620000, 'T-ANG-BRK', 50, 0.30, 5, 3.0),
  (16, 'C-ANG-BRK-KH',  'Brisket khối BBQ',               4,  580000, 'T-ANG-BRK', 25, 1.00, 3, 0.5),
  (17, 'C-USP-RIB-ST',  'Steak Ribeye Mỹ Prime',          4, 1650000, 'T-USP-RIB', 62, 0.35, 6, 3.0),
  (18, 'C-USP-RIB-SL',  'Ribeye Mỹ Prime cắt lát',        3, 1350000, 'T-USP-RIB', 16, 0.30, 4, 1.5),
  (19, 'C-USP-SPL-SL',  'Ba chỉ bò Mỹ cuộn',              3,  690000, 'T-USP-SPL', 70, 0.50, 6, 4.0),
  (20, 'C-USP-SPL-KH',  'Short plate khối nướng',         4,  650000, 'T-USP-SPL', 10, 0.80, 3, 0.5),
  (21, 'C-USC-STR-ST',  'Steak Striploin Mỹ Choice',      4, 1050000, 'T-USC-STR', 68, 0.30, 6, 3.0),
  (22, 'C-USC-STR-SL',  'Striploin Mỹ Choice cắt lát',    3,  880000, 'T-USC-STR', 12, 0.30, 4, 1.0),
  (23, 'C-USC-TOP-ST',  'Steak Flat iron Mỹ Choice',      4,  950000, 'T-USC-TOP', 58, 0.25, 4, 0.8),
  (24, 'C-USC-TOP-SL',  'Lõi vai Mỹ cắt lát',             3,  820000, 'T-USC-TOP', 20, 0.30, 4, 0.8),
  (25, 'C-USC-RMP-ST',  'Steak Picanha Mỹ Choice',        4,  990000, 'T-USC-RMP', 70, 0.30, 4, 1.5),
  (26, 'C-JPA-STR-ST',  'Steak Wagyu Nhật A5',            4, 6800000, 'T-JPA-STR', 70, 0.15, 5, 1.5),
  (27, 'C-JPA-STR-SL',  'Wagyu Nhật A5 sukiyaki',         3, 6200000, 'T-JPA-STR', 12, 0.10, 4, 1.0),
  (28, 'C-SUON-BBQ',    'Sườn bò cắt BBQ',                4,  780000, 'T-SUON',    55, 0.50, 0, 5.0),
  (29, 'C-SUON-HAM',    'Sườn bò chặt hầm',               4,  450000, 'T-SUON',    25, 0.50, 0, 3.0),
  (30, 'C-BAP-LAT',     'Bắp bò cắt lát lẩu',             3,  480000, 'T-BAP',     60, 0.30, 0, 5.0),
  (31, 'C-BAP-KH',      'Bắp bò nguyên khối',             4,  420000, 'T-BAP',     25, 0.50, 0, 3.0),
  (32, 'C-GAU-LAT',     'Gầu bò cắt lát',                 3,  520000, 'T-GAU',     85, 0.30, 0, 6.0),
  (33, 'C-NAM-LAT',     'Nạm bò cắt lát phở',             3,  450000, 'T-NAM',     80, 0.30, 0, 6.0),
  (34, 'C-DUOI-KH',     'Đuôi bò chặt khúc',              4,  380000, 'T-DUOI',    85, 0.80, 0, 2.0)
) v(stt, ma, ten, han, gia, cha, ty, goi, so_o, ban);
update t_mh c set nhom = t.nhom, ma_can = (100 + c.stt)::text from t_mh t where t.ma = c.cha;

-- Phụ phẩm: tính theo kg, chuyển bếp hoặc bỏ.
insert into t_mh (ma, ten, nhom, loai, dem_goi, han, xu_ly, thu_hoi)
select ma, ten, 'Phụ phẩm', 'phu_pham', false, 3, xl, th from (values
  ('P-MO',        'Mỡ bò lọc ra (bỏ)',              'bo',              0),
  ('P-MO-WAGYU',  'Mỡ Wagyu (làm bơ mỡ)',           'chuyen_bep',  80000),
  ('P-VUN',       'Thịt vụn bò (bếp)',              'chuyen_bep', 180000),
  ('P-VUN-WAGYU', 'Vụn Wagyu (làm burger)',         'chuyen_bep', 450000),
  ('P-GAN',       'Gân bò',                         'chuyen_bep', 120000),
  ('P-XUONG',     'Xương ống bò (nấu nước dùng)',   'chuyen_bep',  30000),
  ('P-MANG',      'Màng, gân cứng (bỏ)',            'bo',              0),
  ('P-DE',        'Dẻ sườn vụn',                    'chuyen_bep', 150000)
) v(ma, ten, xl, th);

-- Hàng đóng gói: mua sẵn, bán theo mã món iPOS.
insert into t_mh (ma, ten, nhom, loai, don_vi, han, gia_ban, ncc, gia_mua, goi_kg, ban_ngay, ma_ipos)
select ma, ten, 'Hàng đóng gói', 'phan_cat', dv, han, ban, 'N6', mua, goi, bn, ipos from (values
  ('H-XUCXICH',  'Xúc xích bò Đức (hộp 500g)',      'hộp',  45, 380000, 260000, 0.50, 3.0, 'SP-XX500'),
  ('H-BOVIEN',   'Bò viên gân đông lạnh (gói 500g)', 'gói', 60, 290000, 180000, 0.50, 4.0, 'SP-BV500'),
  ('H-XAY-KHAY', 'Bò xay đông lạnh (khay 300g)',    'khay', 60, 330000, 200000, 0.30, 3.0, 'SP-BX300'),
  ('H-PATTY',    'Patty burger bò Úc (hộp 4 miếng)', 'hộp', 60, 450000, 300000, 0.60, 2.0, 'SP-PATTY'),
  ('H-BOKHO',    'Bò khô miếng (gói 250g)',         'gói', 120, 780000, 520000, 0.25, 2.0, 'SP-BOKHO'),
  ('H-CHABO',    'Chả bò hút chân không (cây 500g)', 'cây', 45, 340000, 220000, 0.50, 2.0, 'SP-CHABO'),
  ('H-LAPXUONG', 'Lạp xưởng bò (gói 500g)',         'gói',  90, 460000, 300000, 0.50, 1.0, 'SP-LXB'),
  ('H-SOT-TIEU', 'Sốt tiêu đen (chai 250g)',        'chai', 180, 220000, 120000, 0.25, 1.5, 'SP-SOTTIEU'),
  ('H-SOT-BBQ',  'Sốt BBQ Hàn (chai 300g)',         'chai', 180, 200000, 110000, 0.30, 1.5, 'SP-SOTBBQ'),
  ('H-BOTOI',    'Bơ tỏi thảo mộc (hũ 200g)',       'hũ',   60, 400000, 250000, 0.20, 1.0, 'SP-BOTOI'),
  ('H-MUOI',     'Muối hồng (hũ 200g)',             'hũ',  365, 175000,  90000, 0.20, 1.0, 'SP-MUOI'),
  ('H-MO-HU',    'Mỡ bò tinh luyện (hũ 300g)',      'hũ',   90, 180000, 100000, 0.30, 0.5, 'SP-MOHU')
) v(ma, ten, dv, han, ban, mua, goi, bn, ipos);

-- Nhịp bán: số trong bảng là ngày đông; ngày thường bán khoảng 60%.
update t_mh set ban_ngay = round(ban_ngay * 0.6, 2) where ban_ngay is not null;

-- Kg tảng dùng mỗi ngày = kg phần cắt bán mỗi ngày ÷ tỷ lệ ra thịt.
update t_mh t set kg_ngay = x.kg from (
  select cha, sum(ban_ngay * goi_kg) / (sum(ty_le) / 100) as kg from t_mh where cha is not null group by cha
) x where x.cha = t.ma;

-- Phụ phẩm của mỗi tảng (% kg) — vào công thức lóc và phiên lóc.
drop table if exists pg_temp.t_phu;
create temp table t_phu as
select t.ma as cha, p.ma, p.ty_le
from t_mh t
cross join lateral (values
  ('P-MO-WAGYU', 7), ('P-VUN-WAGYU', 4), ('P-MANG', 2)) p(ma, ty_le)
where t.theo_tang and t.nhom like 'Wagyu%'
union all
select t.ma, p.ma, p.ty_le from t_mh t
cross join lateral (values ('P-MO', 6), ('P-GAN', 4), ('P-VUN', 3)) p(ma, ty_le)
where t.ma in ('T-ANG-CHK', 'T-ANG-BRK')
union all
select t.ma, p.ma, p.ty_le from t_mh t
cross join lateral (values ('P-MO', 7), ('P-VUN', 4), ('P-MANG', 2)) p(ma, ty_le)
where t.theo_tang and t.nhom not like 'Wagyu%' and t.ma not in ('T-ANG-CHK', 'T-ANG-BRK')
union all
select 'T-SUON', p.ma, p.ty_le from (values ('P-XUONG', 10), ('P-DE', 4)) p(ma, ty_le)
union all
select c, p.ma, p.ty_le from unnest(array['T-BAP', 'T-NAM']) c, (values ('P-GAN', 5), ('P-MO', 4)) p(ma, ty_le)
union all
select c, 'P-MO', 5 from unnest(array['T-GAU', 'T-DUOI']) c;

-- Nhà cung cấp THỬ: hao repack khác nhau để báo cáo NCC có nhà tốt, nhà kém.
drop table if exists pg_temp.t_ncc;
create temp table t_ncc (ma text primary key, ten text, mst text, no_ngay int, thu int[], hao numeric, kieu_hd text, id uuid);
insert into t_ncc (ma, ten, mst, no_ngay, thu, hao, kieu_hd) values
  ('N1', 'Công ty Thịt Úc Thử A',       '0000000001', 30, array[2, 5],       0.005, 'gop'),
  ('N2', 'Công ty Thịt Úc Thử B',       '0000000002', 15, array[1, 4],       0.025, 'tung_lan'),
  ('N3', 'Nhập khẩu Bò Mỹ Thử C',       '0000000003', 21, array[3, 6],       0.012, 'tung_lan'),
  ('N4', 'Bò Mỹ Thử D',                 '0000000004',  7, array[1, 5],       0.035, 'tung_lan'),
  ('N5', 'Wagyu Nhật Thử E',            '0000000005', 14, array[6],          0.008, 'tung_lan'),
  ('N6', 'Thực phẩm Thử F (hàng thùng)', '0000000006', 10, array[1, 3, 5, 6], 0,     'gop');

drop table if exists pg_temp.t_loi;
create temp table t_loi (ngay date, buoc text, loi text);

-- Bảng bán trong ngày (làm mới mỗi ngày mô phỏng).
drop table if exists pg_temp.t_ban;
create temp table t_ban (ma text, gio numeric);

-- Lúc đóng vai nhân sự (authenticated) vẫn đọc được tham số.
grant select on t_mh, t_ncc, t_phu, t_ban to authenticated;


-- =============================================================================
-- 2 · DANH MỤC: mặt hàng, ô mã, bảng ủ, công thức, NCC, món, ghép iPOS
-- =============================================================================
do $$
declare
  v_cn  uuid;
  v_ql  uuid;
  v_chu uuid;
  v_vq  uuid;
  r     record;
  v_ct  uuid;
begin
  perform pg_temp.chot_an_toan();
  select id into v_cn from chi_nhanh order by ma limit 1;
  select auth_uid into v_chu from nhan_su where vai_tro = 'chu_so_huu' and dang_lam and auth_uid is not null order by created_at limit 1;
  select auth_uid into v_ql from nhan_su where vai_tro = 'quan_ly' and chi_nhanh_id = v_cn and dang_lam and auth_uid is not null order by created_at limit 1;
  if v_chu is null or v_ql is null then
    raise exception 'Cần tài khoản Chủ và Quản lý (đang làm, có đăng nhập) cho chi nhánh %', v_cn;
  end if;

  -- Kho chi nhánh chưa khởi tạo thì khởi tạo (vị trí, lý do, cài đặt).
  if not exists (select 1 from kho_cai_dat where chi_nhanh_id = v_cn) then
    perform pg_temp.vai(v_ql);
    perform kho_khoi_tao(v_cn);
    perform pg_temp.vai(null);
  end if;
  select id into v_vq from kho_vi_tri where chi_nhanh_id = v_cn and loai = 'quay' and dang_dung order by created_at limit 1;

  -- Mặt hàng (danh mục dùng chung mọi chi nhánh).
  insert into kho_mat_hang (ma, ten, nhom, loai, dem_goi, don_vi_goi, han_dung_ngay, canh_bao_truoc_ngay, gia_ban_kg,
                            xu_ly_mac_dinh, ma_can, ton_toi_thieu_kg, quay_toi_thieu_goi, quay_toi_da_goi,
                            noi_de_sau_pha, theo_tang, thu_tu)
  select t.ma, t.ten, t.nhom, t.loai, t.dem_goi, coalesce(t.don_vi, 'kg'), t.han,
         case when t.loai = 'tang' then 5 when t.nhom = 'Hàng đóng gói' then 7 else 1 end,
         t.gia_ban, t.xu_ly, t.ma_can,
         case when t.loai = 'tang' then round(t.kg_ngay * 7, 1)
              when t.nhom = 'Hàng đóng gói' then round(t.ban_ngay * t.goi_kg * 5, 1) end,
         case when t.ban_ngay is not null then ceil(t.ban_ngay * 1.5)::int end,
         case when t.ban_ngay is not null then ceil(t.ban_ngay * 4)::int end,
         case when t.cha is not null then 'quay' end,
         t.theo_tang,
         row_number() over (order by case t.loai when 'tang' then 1 when 'phan_cat' then 2 else 3 end, t.nhom, t.ma)::int
  from t_mh t;
  update t_mh t set id = m.id from kho_mat_hang m where m.ma = t.ma;

  -- Giá trị thu hồi phụ phẩm (để chia giá vốn khi lóc).
  insert into kho_mat_hang_gia (mat_hang_id, gia_tri_thu_hoi_kg)
  select id, thu_hoi from t_mh where loai = 'phu_pham' and thu_hoi > 0;

  -- Ô mã cho phần cắt của tảng theo tảng.
  insert into kho_o_ma (mat_hang_id, so_o, ma_can)
  select t.id, o, (10000 + t.stt * 10 + o)::text
  from t_mh t, generate_series(1, t.so_o) o
  where t.so_o > 0;

  -- Bảng ủ: thịt càng non càng ủ lâu. Wagyu Nhật A5 chỉ nghỉ 2 ngày.
  insert into kho_bang_u (mat_hang_id, tuoi_den_ngay, so_ngay_u)
  select t.id, b.tuoi, b.ngay from t_mh t,
    (values (7, 14), (14, 10), (null::int, 7)) b(tuoi, ngay)
  where t.theo_tang and t.ma <> 'T-JPA-STR'
  union all
  select id, null, 2 from t_mh where ma = 'T-JPA-STR';

  -- Công thức lóc cho từng tảng: phần cắt + phụ phẩm.
  for r in select * from t_mh where loai = 'tang' order by ma loop
    insert into kho_cong_thuc_pha (mat_hang_vao_id, ten) values (r.id, 'Lóc chuẩn') returning id into v_ct;
    insert into kho_cong_thuc_pha_dong (cong_thuc_id, mat_hang_ra_id, ty_le_du_kien, xu_ly, thu_tu)
    select v_ct, c.id, c.ty_le, 'nhap_kho', row_number() over (order by c.stt)::int
    from t_mh c where c.cha = r.ma
    union all
    select v_ct, p.id, f.ty_le, p.xu_ly, 100 + row_number() over (order by f.ma)::int
    from t_phu f join t_mh p on p.ma = f.ma where f.cha = r.ma;
  end loop;

  -- Nhà cung cấp.
  insert into kho_nha_cung_cap (ten, ma_so_thue, dien_thoai, nguoi_lien_he, so_ngay_no, so_ngay_giao,
                                ngay_giao_trong_tuan, kieu_hoa_don, ghi_chu)
  select n.ten, n.mst, '0900 000 00' || right(n.ma, 1), 'Anh/chị phụ trách ' || n.ma, n.no_ngay, 1, n.thu, n.kieu_hd,
         'Nhà cung cấp THỬ — dữ liệu tạo tự động, hao repack khoảng ' || replace((n.hao * 100)::text, '.', ',') || '%'
  from t_ncc n;
  update t_ncc n set id = c.id from kho_nha_cung_cap c where c.ten = n.ten;

  -- Món bếp (định lượng để đối chiếu xuất bếp) — bán trên iPOS nhưng không trừ kho.
  insert into kho_mon (chi_nhanh_id, ma_ipos, ten) values
    (v_cn, 'MON-PHO',     'Phở bò tái nạm'),
    (v_cn, 'MON-LUCLAC',  'Bò lúc lắc'),
    (v_cn, 'MON-BURGER',  'Burger bò Úc'),
    (v_cn, 'MON-SUPDUOI', 'Súp đuôi bò');
  insert into kho_dinh_luong (chi_nhanh_id, mon_id, mat_hang_id, gram)
  select v_cn, m.id, t.id, g from (values
    ('MON-PHO', 'C-NAM-LAT', 80), ('MON-PHO', 'C-BAP-LAT', 50), ('MON-LUCLAC', 'C-ANG-STR-LL', 150),
    ('MON-BURGER', 'H-PATTY', 150), ('MON-SUPDUOI', 'C-DUOI-KH', 300)
  ) v(mon, mh, g) join kho_mon m on m.ma_ipos = v.mon and m.chi_nhanh_id = v_cn join t_mh t on t.ma = v.mh;

  -- Nối iPOS (bản thử, không token) + chuyển sang trừ kho theo iPOS từ 22 ngày trước.
  perform pg_temp.vai(v_chu);
  perform kho_ipos_luu_cau_hinh(v_cn, jsonb_build_object('bat', true, 'pos_parent', 'THU', 'pos_id', 'THU',
                                                          'vi_tri_ban_id', v_vq));
  perform kho_ipos_chuyen_sang(v_cn, pg_temp.luc(hom_nay_vn() - 22, 0));
  -- Ghép mã iPOS: hàng đóng gói bán theo gói; combo steak trừ 1 gói ribeye; món bếp chỉ đếm suất.
  for r in select * from t_mh where ma_ipos is not null loop
    perform kho_ipos_gan_ma_v2(v_cn, r.ma_ipos, 'mon', r.id, 'goi', null);
  end loop;
  perform kho_ipos_gan_ma_v2(v_cn, 'COMBO-RIB-ANG', 'mon', (select id from t_mh where ma = 'C-ANG-RIB-ST'), 'goi', null);
  perform kho_ipos_gan_ma_v2(v_cn, m, 'bo_qua', null, 'suat', null)
  from unnest(array['MON-PHO', 'MON-LUCLAC', 'MON-BURGER', 'MON-SUPDUOI']) m;
  perform pg_temp.vai(null);

  raise notice 'Danh mục: % mặt hàng, % ô mã, % NCC', (select count(*) from kho_mat_hang), (select count(*) from kho_o_ma),
    (select count(*) from kho_nha_cung_cap);
end
$$;


-- =============================================================================
-- 3 · MÔ PHỎNG 38 NGÀY: nhập → ủ → lóc → quầy → bán → huỷ → trả nợ
-- =============================================================================
do $$
declare
  v_cn   uuid;  v_vk uuid;  v_vq uuid;  v_ld_huy uuid;
  u_chu  uuid;  u_ql uuid;  u_tk uuid;  u_nv uuid;  u_kt uuid;
  v_hom  date := hom_nay_vn();
  v_d    int;
  v_ngay date;
  v_n    record;   -- nhà cung cấp
  r      record;
  x      record;
  v_dong jsonb;
  v_gia  jsonb;
  v_id   uuid;
  v_pb   int;
  v_ton  numeric;
  v_cnt  int;
  v_kg   numeric;
  v_tong numeric;
  v_ra   jsonb;
  v_lo   record;
  v_heso numeric;
  v_gio_max numeric;
  v_hd   jsonb;
  v_hd_dong jsonb;
  v_so_hd int := 0;
  v_luc  timestamptz;
  v_ma   text;
  v_goi  int;
  v_k    int;
  v_huy_hd text[] := '{}';
begin
  perform pg_temp.chot_an_toan();
  perform setseed(0.2026);
  select id into v_cn from chi_nhanh order by ma limit 1;
  select id into v_vk from kho_vi_tri where chi_nhanh_id = v_cn and loai = 'kho' and dang_dung order by created_at limit 1;
  select id into v_vq from kho_vi_tri where chi_nhanh_id = v_cn and loai = 'quay' and dang_dung order by created_at limit 1;
  select id into v_ld_huy from kho_ly_do where loai = 'huy' and dang_dung order by (ten ilike '%hạn%') desc, thu_tu limit 1;
  select auth_uid into u_chu from nhan_su where vai_tro = 'chu_so_huu' and dang_lam and auth_uid is not null order by created_at limit 1;
  select auth_uid into u_ql from nhan_su where vai_tro = 'quan_ly' and chi_nhanh_id = v_cn and dang_lam and auth_uid is not null order by created_at limit 1;
  select auth_uid into u_tk from nhan_su where vai_tro = 'thu_kho' and chi_nhanh_id = v_cn and dang_lam and auth_uid is not null order by created_at limit 1;
  select auth_uid into u_nv from nhan_su where vai_tro = 'nhan_vien_quay' and chi_nhanh_id = v_cn and dang_lam and auth_uid is not null order by created_at limit 1;
  select auth_uid into u_kt from nhan_su where vai_tro = 'ke_toan' and chi_nhanh_id = v_cn and dang_lam and auth_uid is not null order by created_at limit 1;
  if u_tk is null or u_nv is null or u_kt is null then
    raise exception 'Cần đủ tài khoản Thủ kho, NV quầy, Kế toán (đang làm, có đăng nhập) cho chi nhánh %', v_cn;
  end if;

  for v_d in -38 .. 0 loop
    v_ngay := v_hom + v_d;

    -- ---- 1 · NHẬN HÀNG (thủ kho lập, kế toán điền giá + duyệt) ---------------
    if v_d <= -1 then
      for v_n in select * from t_ncc where extract(isodow from v_ngay)::int = any (thu) order by ma loop
        v_dong := '[]';
        for r in select * from t_mh where ncc = v_n.ma order by ma loop
          if r.loai = 'tang' then
            select coalesce(sum(t.so_kg), 0) into v_ton from kho_ton t where t.vi_tri_id = v_vk and t.mat_hang_id = r.id;
            if v_ton < r.kg_ngay * (case when r.theo_tang then 14 else 7 end) then
              v_cnt := least(case when r.theo_tang then 4 else 3 end,
                             greatest(1, ceil((r.kg_ngay * case when r.theo_tang then 20 else 10 end - v_ton)
                                              / ((r.kg_min + r.kg_max) / 2))::int));
              for i in 1 .. v_cnt loop
                v_kg := round(r.kg_min + random()::numeric * (r.kg_max - r.kg_min), 2);
                v_dong := v_dong || jsonb_strip_nulls(jsonb_build_object(
                  'mat_hang_id', r.id, 'so_kg', v_kg, 'so_goi', 1,
                  'so_kg_thuc', case when r.theo_tang
                                     then round(v_kg * (1 - v_n.hao * (0.6 + random()::numeric * 0.8)), 2) end,
                  'ngay_mo', case when r.theo_tang then v_ngay - (4 + floor(random()::numeric * 12))::int end,
                  'so_lo_ncc', 'LOT-' || v_n.ma || '-' || to_char(v_ngay, 'MMDD') || '-' || i));
              end loop;
            end if;
          else
            -- Hàng đóng gói: tổng kho + quầy dưới 6 ngày bán → đặt đủ 12 ngày.
            select coalesce(sum(t.so_goi), 0) into v_ton from kho_ton t where t.mat_hang_id = r.id and t.vi_tri_id in (v_vk, v_vq);
            if v_ton < r.ban_ngay * 6 then
              v_cnt := ceil(r.ban_ngay * 12)::int;
              v_dong := v_dong || jsonb_build_object('mat_hang_id', r.id, 'so_goi', v_cnt, 'so_kg', round(v_cnt * r.goi_kg, 3));
            end if;
          end if;
        end loop;
        continue when jsonb_array_length(v_dong) = 0;

        begin
          perform pg_temp.vai(u_tk);
          select phieu_id, phien_ban_moi into v_id, v_pb from kho_luu_phieu_nhap_kg(
            null, v_cn, gen_random_uuid(), null, 'mua', v_n.id, v_vk, v_ngay, null, null,
            'Giao hàng ' || to_char(v_ngay, 'DD/MM'),
            array[v_cn::text || '/nhap/' || gen_random_uuid() || '/1.jpg'], '{}'::jsonb, v_dong);
          perform kho_gui_duyet_phieu_nhap(v_id, v_pb);
          perform pg_temp.vai(null);

          -- Giá ±3%, thỉnh thoảng một dòng đắt hơn 8% để hiện cảnh báo giá mua.
          select jsonb_agg(jsonb_build_object('dong_id', d.id, 'don_gia_kg',
                   round(t.gia_mua * (0.97 + random()::numeric * 0.06) * case when random()::numeric < 0.05 then 1.08 else 1 end, -3)))
          into v_gia
          from kho_phieu_nhap_dong d join t_mh t on t.id = d.mat_hang_id where d.phieu_nhap_id = v_id;
          select phien_ban into v_pb from kho_phieu_nhap where id = v_id;
          perform pg_temp.vai(u_kt);
          perform kho_dien_gia_phieu_nhap(v_id, v_pb, 'HD' || to_char(v_ngay, 'YYMMDD') || right(v_n.ma, 1), v_ngay, null,
                                          0, 0, v_gia);
          perform kho_duyet_phieu_nhap(v_id);
          perform pg_temp.vai(null);
        exception when others then
          insert into t_loi values (v_ngay, 'nhập ' || v_n.ma, sqlerrm);
        end;
      end loop;
    end if;

    -- ---- 2 · RA QUẦY hàng đóng gói (thủ kho chuyển, không cần quầy nhận) -----
    if v_d >= -22 then
      v_dong := '[]';
      for r in select * from t_mh where ma_ipos is not null order by ma loop
        select coalesce(sum(so_goi) filter (where vi_tri_id = v_vq), 0), coalesce(sum(so_goi) filter (where vi_tri_id = v_vk), 0)
        into v_ton, v_kg from kho_ton where mat_hang_id = r.id;
        if v_ton < ceil(r.ban_ngay * 1.5) and v_kg > 0 then
          v_dong := v_dong || jsonb_build_object('mat_hang_id', r.id,
                                                 'so_goi', least(v_kg, ceil(r.ban_ngay * 4) - v_ton)::int);
        end if;
      end loop;
      if jsonb_array_length(v_dong) > 0 then
        begin
          perform pg_temp.vai(u_tk);
          select phieu_id into v_id from kho_tao_phieu_xuat(v_cn, gen_random_uuid(), 'chuyen', v_vk, v_vq, null,
                                                            'Bổ sung quầy đầu ca', null, v_dong);
          perform pg_temp.vai(null);
          perform pg_temp.sua_ngay(true);
          update kho_so_cai set ngay = v_ngay, created_at = pg_temp.luc(v_ngay, 9.5)
          where chung_tu_loai = 'phieu_xuat' and chung_tu_id = v_id;
          update kho_phieu_xuat set ngay = v_ngay, created_at = pg_temp.luc(v_ngay, 9.5), updated_at = pg_temp.luc(v_ngay, 9.5)
          where id = v_id;
          perform pg_temp.sua_ngay(false);
        exception when others then
          insert into t_loi values (v_ngay, 'chuyển quầy', sqlerrm);
        end;
      end if;
    end if;

    -- ---- 3 · LÓC (thủ kho): quầy còn dưới 2 ngày bán → lóc 1 tảng đã ủ xong --
    if v_d >= -24 then
      for r in select t.* from t_mh t where t.loai = 'tang' order by t.ma loop
        select coalesce(sum(k.so_goi), 0) into v_ton
        from kho_ton k join t_mh c on c.id = k.mat_hang_id
        where k.vi_tri_id = v_vq and c.cha = r.ma;
        continue when v_ton >= 2 * (select sum(ban_ngay) from t_mh where cha = r.ma);

        select k.lo_id, k.so_kg into v_lo
        from kho_ton k join kho_lo l on l.id = k.lo_id
        where k.vi_tri_id = v_vk and k.mat_hang_id = r.id and k.so_kg > 0
          and l.han_dung >= v_ngay and (l.ngay_u_xong is null or l.ngay_u_xong <= v_ngay)
          and l.ngay_dong_goi <= v_ngay
        order by l.han_dung, l.so_tang nulls last, l.created_at
        limit 1;
        continue when v_lo.lo_id is null;

        -- Kg ra: theo công thức ±, phụ phẩm ±; tổng không quá 98,5% kg vào.
        select jsonb_agg(jsonb_build_object('mh', c.id, 'kg', v_lo.so_kg * c.ty_le / 100 * (0.95 + random()::numeric * 0.07),
                                            'goi_kg', c.goi_kg, 'xu_ly', 'nhap_kho'))
        into v_ra from t_mh c where c.cha = r.ma;
        select v_ra || coalesce(jsonb_agg(jsonb_build_object('mh', p.id, 'kg', v_lo.so_kg * f.ty_le / 100 * (0.9 + random()::numeric * 0.2),
                                                             'goi_kg', null, 'xu_ly', p.xu_ly)), '[]')
        into v_ra from t_phu f join t_mh p on p.ma = f.ma where f.cha = r.ma;
        select sum((e ->> 'kg')::numeric) into v_tong from jsonb_array_elements(v_ra) e;
        v_heso := least(1, v_lo.so_kg * 0.985 / v_tong);
        select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                 'mat_hang_id', e ->> 'mh',
                 'so_kg', floor((e ->> 'kg')::numeric * v_heso * 1000) / 1000,
                 'so_goi', case when e ->> 'goi_kg' is not null
                                then greatest(1, round((e ->> 'kg')::numeric * v_heso / (e ->> 'goi_kg')::numeric))::int end,
                 'xu_ly', e ->> 'xu_ly',
                 'vi_tri_id', case when e ->> 'xu_ly' = 'nhap_kho' then v_vq::text end)))
        into v_ra from jsonb_array_elements(v_ra) e;

        begin
          perform pg_temp.vai(u_tk);
          select phien_id into v_id from kho_luu_phien_pha(
            null, v_cn, gen_random_uuid(), null, r.id,
            (select c.id from kho_cong_thuc_pha c where c.mat_hang_vao_id = r.id limit 1),
            v_ngay, null, jsonb_build_array(jsonb_build_object('lo_id', v_lo.lo_id, 'vi_tri_id', v_vk)), v_ra);
          if r.theo_tang then
            perform kho_giao_o_ma(v_id, null);
          end if;
          perform pg_temp.vai(null);
          select phien_ban into v_pb from kho_phien_pha where id = v_id;
          perform pg_temp.vai(u_tk);
          perform kho_chot_phien_pha(v_id, v_pb);
          perform pg_temp.vai(null);
          -- Ô giao lúc 7h sáng ngày lóc; ô trả lúc 6h59 (hàm ghi "bây giờ").
          update kho_o_ma_giao set tu_luc = pg_temp.luc(v_ngay, 7) where phien_pha_id = v_id;
          update kho_o_ma_giao set den_luc = pg_temp.luc(v_ngay, 6.98) where den_luc = now();
        exception when others then
          insert into t_loi values (v_ngay, 'lóc ' || r.ma, sqlerrm);
        end;
      end loop;
    end if;

    -- ---- 4 · HUỶ hàng quá hạn ở quầy (NV quầy báo, quản lý duyệt) ----------
    -- Hai ngày cuối để nguyên → màn hình còn cảnh báo "quá hạn".
    if v_d between -21 and -2 then
      select jsonb_agg(jsonb_build_object('mat_hang_id', k.mat_hang_id, 'lo_id', k.lo_id, 'so_goi', k.so_goi))
      into v_dong
      from kho_ton k join kho_lo l on l.id = k.lo_id join kho_mat_hang m on m.id = k.mat_hang_id
      where k.vi_tri_id = v_vq and l.han_dung < v_ngay and k.so_goi > 0 and m.dem_goi;
      if v_dong is not null then
        begin
          perform pg_temp.vai(u_nv);
          select phieu_id into v_id from kho_tao_phieu_xuat(v_cn, gen_random_uuid(), 'huy', v_vq, null, v_ld_huy,
            'Quá hạn, bỏ cuối ngày', array[v_cn::text || '/huy/' || gen_random_uuid() || '.jpg'], v_dong);
          perform pg_temp.vai(u_ql);
          perform kho_duyet_phieu_huy(v_id);
          perform pg_temp.vai(null);
          perform pg_temp.sua_ngay(true);
          update kho_so_cai set ngay = v_ngay, created_at = pg_temp.luc(v_ngay, 21.5)
          where chung_tu_loai = 'phieu_xuat' and chung_tu_id = v_id;
          update kho_phieu_xuat set ngay = v_ngay, created_at = pg_temp.luc(v_ngay, 21.5),
                 updated_at = pg_temp.luc(v_ngay, 21.6), duyet_luc = pg_temp.luc(v_ngay, 21.6)
          where id = v_id;
          perform pg_temp.sua_ngay(false);
        exception when others then
          insert into t_loi values (v_ngay, 'huỷ quá hạn', sqlerrm);
        end;
      end if;
    end if;

    -- ---- 5 · BÁN qua iPOS (quét tem cân ở quầy) -----------------------------
    if v_d >= -21 then
      v_gio_max := case when v_d < 0 then 21
                        else least(21, extract(epoch from (now() at time zone 'Asia/Ho_Chi_Minh')::time) / 3600 - 0.2) end;
      if v_gio_max > 10.5 then
        truncate t_ban;
        insert into t_ban (ma, gio)
        select t.ma, 10 + random()::numeric * (v_gio_max - 10) as gio
        from t_mh t
        cross join lateral generate_series(1, floor(t.ban_ngay
            * case when extract(isodow from v_ngay) in (6, 7) then 1.4 else 1 end
            * (0.5 + random()::numeric) + random()::numeric)::int) g
        where t.ban_ngay is not null
        union all
        select m, 10 + random()::numeric * (v_gio_max - 10)
        from unnest(array['MON-PHO', 'MON-PHO', 'MON-LUCLAC', 'MON-BURGER', 'MON-SUPDUOI', 'COMBO-RIB-ANG']) m
        where random()::numeric < 0.8
        union all
        select m, 10 + random()::numeric * (v_gio_max - 10)
        from unnest(array['NUOC-SUOI', 'TUI-GIU-LANH']) m
        where random()::numeric < 0.3;

        v_hd := null;
        for x in select * from t_ban order by gio loop
          -- Gom 1–3 dòng một hoá đơn.
          if v_hd is null or random()::numeric < 0.55 or jsonb_array_length(v_hd -> 'dong') >= 3 then
            if v_hd is not null and jsonb_array_length(v_hd -> 'dong') > 0 then
              perform pg_temp.vai(u_chu);
              perform kho_ipos_nhan_callback(v_cn, jsonb_build_array(v_hd));
              perform pg_temp.vai(null);
            end if;
            v_so_hd := v_so_hd + 1;
            v_luc := pg_temp.luc(v_ngay, x.gio);
            v_hd := jsonb_build_object('ma_hd', 'HD-THU-' || to_char(v_ngay, 'YYMMDD') || '-' || lpad(v_so_hd::text, 4, '0'),
                                       'thoi_diem_ban', to_char(v_luc at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD"T"HH24:MI:SS') || '+07:00',
                                       'dong', '[]'::jsonb);
          end if;
          v_k := jsonb_array_length(v_hd -> 'dong') + 1;
          select * into r from t_mh where ma = x.ma;

          if r.cha is not null then
            -- Phần cắt: nhân viên lấy gói gần hết hạn trước (75%), còn lại lấy bất kỳ.
            select k.lo_id, k.so_goi, k.so_kg into v_lo
            from kho_ton k join kho_lo l on l.id = k.lo_id
            where k.vi_tri_id = v_vq and k.mat_hang_id = r.id and k.so_goi > 0 and l.han_dung >= v_ngay
            order by case when random()::numeric < 0.75 then l.han_dung end nulls last, random()::numeric
            limit 1;
            continue when v_lo.lo_id is null;
            v_kg := case when v_lo.so_goi = 1 then v_lo.so_kg
                         else least(round(v_lo.so_kg / v_lo.so_goi * (0.94 + random()::numeric * 0.12), 3),
                                    v_lo.so_kg - 0.05 * (v_lo.so_goi - 1)) end;
            v_ma := null;
            if r.so_o > 0 then
              select o.ma_can into v_ma from kho_o_ma_giao g join kho_o_ma o on o.id = g.o_ma_id
              where g.lo_id = v_lo.lo_id and g.den_luc is null limit 1;
              -- 4%: tem in nhầm ô đang trống → kho trừ theo hạn gần nhất, đánh dấu lệch ô.
              if random()::numeric < 0.04 then
                select o.ma_can into v_ma from kho_o_ma o
                where o.mat_hang_id = r.id
                  and not exists (select 1 from kho_o_ma_giao g where g.o_ma_id = o.id and g.den_luc is null)
                order by random()::numeric limit 1;
              end if;
            end if;
            v_hd := jsonb_set(v_hd, '{dong}', (v_hd -> 'dong') || jsonb_build_object(
              'khoa_dong', v_k::text, 'ma_can', coalesce(v_ma, r.ma_can), 'so_kg', v_kg, 'so_goi', 1,
              'ten_ipos', r.ten, 'thanh_tien', round(v_kg * r.gia_ban, -2)));
          elsif r.ma_ipos is not null then
            select coalesce(sum(so_goi), 0) into v_ton from kho_ton where vi_tri_id = v_vq and mat_hang_id = r.id;
            continue when v_ton < 1;
            v_goi := least(v_ton, 1 + floor(random()::numeric * 2))::int;
            v_hd := jsonb_set(v_hd, '{dong}', (v_hd -> 'dong') || jsonb_build_object(
              'khoa_dong', v_k::text, 'ma_ipos', r.ma_ipos, 'ten_ipos', r.ten, 'so_luong', v_goi,
              'thanh_tien', round(v_goi * r.goi_kg * r.gia_ban, -3)));
          else
            v_hd := jsonb_set(v_hd, '{dong}', (v_hd -> 'dong') || jsonb_build_object(
              'khoa_dong', v_k::text, 'ma_ipos', x.ma, 'so_luong', 1,
              'ten_ipos', case x.ma when 'MON-PHO' then 'Phở bò tái nạm' when 'MON-LUCLAC' then 'Bò lúc lắc'
                                    when 'MON-BURGER' then 'Burger bò Úc' when 'MON-SUPDUOI' then 'Súp đuôi bò'
                                    when 'COMBO-RIB-ANG' then 'Combo steak Ribeye Angus'
                                    when 'NUOC-SUOI' then 'Nước suối' else 'Túi giữ lạnh' end,
              'thanh_tien', case x.ma when 'MON-PHO' then 85000 when 'MON-LUCLAC' then 165000 when 'MON-BURGER' then 145000
                                      when 'MON-SUPDUOI' then 120000 when 'COMBO-RIB-ANG' then 520000
                                      when 'NUOC-SUOI' then 15000 else 25000 end));
          end if;
        end loop;
        if v_hd is not null and jsonb_array_length(v_hd -> 'dong') > 0 then
          perform pg_temp.vai(u_chu);
          perform kho_ipos_nhan_callback(v_cn, jsonb_build_array(v_hd));
          perform pg_temp.vai(null);
        end if;

        -- Hai hoá đơn bị huỷ trên iPOS sau khi bán → kho hoàn lại.
        if v_d in (-15, -4) then
          select to_jsonb(h) into v_hd from (
            select h.ma_hd, to_char(h.thoi_diem_ban at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD"T"HH24:MI:SS') || '+07:00' as thoi_diem_ban,
                   true as da_huy
            from kho_ipos_hoa_don h
            where h.chi_nhanh_id = v_cn and (h.thoi_diem_ban at time zone 'Asia/Ho_Chi_Minh')::date = v_ngay
              and exists (select 1 from kho_ipos_dong d where d.hoa_don_id = h.id and d.trang_thai = 'da_ghi')
            order by h.thoi_diem_ban limit 1) h;
          if v_hd is not null then
            begin
              perform pg_temp.vai(u_chu);
              perform kho_ipos_nhan_callback(v_cn, jsonb_build_array(v_hd));
              perform pg_temp.vai(null);
            exception when others then
              insert into t_loi values (v_ngay, 'huỷ hoá đơn', sqlerrm);
            end;
          end if;
        end if;
      end if;
    end if;

    -- ---- 6 · TRẢ NỢ NCC (kế toán) -------------------------------------------
    for v_n in select n.*, p.phan from t_ncc n join (values (-12, 'N1', 1.0), (-9, 'N6', 1.0), (-6, 'N3', 0.6),
                                                           (-5, 'N2', 0.5), (-3, 'N1', 1.0)) p(d, ncc, phan)
                 on p.ncc = n.ma and p.d = v_d loop
      select con_no into v_ton from kho_v_cong_no_ncc where chi_nhanh_id = v_cn and nha_cung_cap_id = v_n.id;
      continue when coalesce(v_ton, 0) <= 0;
      begin
        perform pg_temp.vai(u_kt);
        select thanh_toan_id into v_id from kho_ghi_thanh_toan_v2(v_cn, gen_random_uuid(), v_n.id, 'thanh_toan', 'chuyen_khoan',
          floor(v_ton * v_n.phan / 1000)::bigint * 1000, v_ngay, 'Chuyển khoản thanh toán (thử)', null, null);
        perform pg_temp.vai(null);
        update kho_thanh_toan set created_at = pg_temp.luc(v_ngay, 15), updated_at = pg_temp.luc(v_ngay, 15) where id = v_id;
      exception when others then
        insert into t_loi values (v_ngay, 'trả nợ ' || v_n.ma, sqlerrm);
      end;
    end loop;
  end loop;

  raise notice 'Mô phỏng xong: % phiếu nhập, % phiên lóc, % hoá đơn iPOS, % lỗi bỏ qua',
    (select count(*) from kho_phieu_nhap), (select count(*) from kho_phien_pha),
    (select count(*) from kho_ipos_hoa_don), (select count(*) from t_loi);
end
$$;


-- =============================================================================
-- 4 · TRẠNG THÁI CUỐI: việc đang chờ để bấm thử ngay
-- =============================================================================
do $$
declare
  v_cn  uuid;  v_vk uuid;  v_vq uuid;
  u_tk  uuid;  u_nv uuid;  u_kt uuid;
  v_hom date := hom_nay_vn();
  v_id  uuid;
  v_pb  int;
  v_gia jsonb;
  v_dong jsonb;
  v_ld  uuid;
begin
  perform pg_temp.chot_an_toan();
  select id into v_cn from chi_nhanh order by ma limit 1;
  select id into v_vk from kho_vi_tri where chi_nhanh_id = v_cn and loai = 'kho' and dang_dung order by created_at limit 1;
  select id into v_vq from kho_vi_tri where chi_nhanh_id = v_cn and loai = 'quay' and dang_dung order by created_at limit 1;
  select auth_uid into u_tk from nhan_su where vai_tro = 'thu_kho' and chi_nhanh_id = v_cn and dang_lam and auth_uid is not null order by created_at limit 1;
  select auth_uid into u_nv from nhan_su where vai_tro = 'nhan_vien_quay' and chi_nhanh_id = v_cn and dang_lam and auth_uid is not null order by created_at limit 1;
  select auth_uid into u_kt from nhan_su where vai_tro = 'ke_toan' and chi_nhanh_id = v_cn and dang_lam and auth_uid is not null order by created_at limit 1;

  -- a) Tảng sắp hết hạn mà còn đang ủ (nhận 2 ngày trước, thịt đã già, hạn còn 2 ngày).
  perform pg_temp.vai(u_tk);
  select phieu_id, phien_ban_moi into v_id, v_pb from kho_luu_phieu_nhap_kg(
    null, v_cn, gen_random_uuid(), null, 'mua', (select id from t_ncc where ma = 'N4'), v_vk, v_hom - 2, null, null,
    'Tảng hàng tồn NCC xả — hạn ngắn',
    array[v_cn::text || '/nhap/' || gen_random_uuid() || '/1.jpg'], '{}'::jsonb,
    jsonb_build_array(jsonb_build_object('mat_hang_id', (select id from t_mh where ma = 'T-USC-STR'), 'so_kg', 5.6,
      'so_kg_thuc', 5.38, 'ngay_mo', v_hom - 40, 'han_dung', v_hom + 2, 'so_lo_ncc', 'LOT-N4-XA')));
  perform kho_gui_duyet_phieu_nhap(v_id, v_pb);
  perform pg_temp.vai(null);
  select jsonb_agg(jsonb_build_object('dong_id', id, 'don_gia_kg', 430000)) into v_gia from kho_phieu_nhap_dong where phieu_nhap_id = v_id;
  select phien_ban into v_pb from kho_phieu_nhap where id = v_id;
  perform pg_temp.vai(u_kt);
  perform kho_dien_gia_phieu_nhap(v_id, v_pb, 'HD-XA-01', v_hom - 2, null, 0, 0, v_gia);
  perform kho_duyet_phieu_nhap(v_id);
  perform pg_temp.vai(null);

  -- b) Phiếu nhập CHỜ DUYỆT hôm nay: 3 tảng Angus đã repack, chưa có giá → kế toán điền giá, duyệt.
  perform pg_temp.vai(u_tk);
  select phieu_id, phien_ban_moi into v_id, v_pb from kho_luu_phieu_nhap_kg(
    null, v_cn, gen_random_uuid(), null, 'mua', (select id from t_ncc where ma = 'N2'), v_vk, v_hom, null, null,
    'Hàng về sáng nay — đã repack, chờ kế toán điền giá',
    array[v_cn::text || '/nhap/' || gen_random_uuid() || '/1.jpg'], '{}'::jsonb,
    jsonb_build_array(
      jsonb_build_object('mat_hang_id', (select id from t_mh where ma = 'T-ANG-RIB'), 'so_kg', 6.12, 'so_kg_thuc', 5.95,
                         'ngay_mo', v_hom - 9, 'so_lo_ncc', 'LOT-N2-HN-1'),
      jsonb_build_object('mat_hang_id', (select id from t_mh where ma = 'T-ANG-RIB'), 'so_kg', 5.84, 'so_kg_thuc', 5.71,
                         'ngay_mo', v_hom - 9, 'so_lo_ncc', 'LOT-N2-HN-2'),
      jsonb_build_object('mat_hang_id', (select id from t_mh where ma = 'T-ANG-STR'), 'so_kg', 5.2, 'so_kg_thuc', 5.05,
                         'ngay_mo', v_hom - 6, 'so_lo_ncc', 'LOT-N2-HN-3')));
  perform kho_gui_duyet_phieu_nhap(v_id, v_pb);

  -- c) Phiếu nhập NHÁP (chưa gửi duyệt): hàng đóng gói.
  perform kho_luu_phieu_nhap_kg(
    null, v_cn, gen_random_uuid(), null, 'mua', (select id from t_ncc where ma = 'N6'), v_vk, v_hom, null, null,
    'Nháp — đang đếm hàng', null, '{}'::jsonb,
    jsonb_build_array(
      jsonb_build_object('mat_hang_id', (select id from t_mh where ma = 'H-BOVIEN'), 'so_goi', 20, 'so_kg', 10),
      jsonb_build_object('mat_hang_id', (select id from t_mh where ma = 'H-XUCXICH'), 'so_goi', 12, 'so_kg', 6)));
  perform pg_temp.vai(null);

  -- d) Phiếu HUỶ chờ quản lý duyệt: 1 gói ở quầy bị rách bao bì.
  select jsonb_build_array(jsonb_build_object('mat_hang_id', k.mat_hang_id, 'lo_id', k.lo_id, 'so_goi', 1))
  into v_dong
  from kho_ton k join kho_lo l on l.id = k.lo_id join kho_mat_hang m on m.id = k.mat_hang_id
  where k.vi_tri_id = v_vq and k.so_goi > 1 and l.han_dung >= v_hom and m.dem_goi and m.gia_ban_kg > 1000000
  order by l.han_dung limit 1;
  select id into v_ld from kho_ly_do where loai = 'huy' and dang_dung order by (ten ilike '%hỏng%' or ten ilike '%rách%') desc, thu_tu limit 1;
  if v_dong is not null then
    perform pg_temp.vai(u_nv);
    perform kho_tao_phieu_xuat(v_cn, gen_random_uuid(), 'huy', v_vq, null, v_ld, 'Bao bì hút chân không bị hở',
                               array[v_cn::text || '/huy/' || gen_random_uuid() || '.jpg'], v_dong);
    perform pg_temp.vai(null);
  end if;

  -- e) Yêu cầu quầy đang mở: NV quầy xin thêm hàng đóng gói cho ca tối.
  perform pg_temp.vai(u_nv);
  perform kho_tao_yeu_cau(v_cn, gen_random_uuid(), v_vq, 'tay', 'Ca tối cuối tuần, xin thêm hàng',
    jsonb_build_array(jsonb_build_object('mat_hang_id', (select id from t_mh where ma = 'H-BOVIEN'), 'so_goi', 6),
                      jsonb_build_object('mat_hang_id', (select id from t_mh where ma = 'H-XUCXICH'), 'so_goi', 4)));
  perform pg_temp.vai(null);
end
$$;


-- =============================================================================
-- 5 · DỜI NGÀY GIỜ về đúng ngày mô phỏng (không đổi số lượng, tiền)
-- =============================================================================
do $$
begin
  perform pg_temp.chot_an_toan();
  perform pg_temp.sua_ngay(true);

  update kho_phieu_nhap set
    created_at = pg_temp.luc(ngay_nhap, 8),
    gui_luc    = case when gui_luc is not null then pg_temp.luc(ngay_nhap, 8.5) end,
    duyet_luc  = case when duyet_luc is not null then pg_temp.luc(ngay_nhap, 10) end,
    updated_at = pg_temp.luc(ngay_nhap, case when duyet_luc is not null then 10 else 8.5 end)
  where ngay_nhap < hom_nay_vn();

  update kho_phien_pha set
    created_at = pg_temp.luc(ngay_pha, 6.5),
    chot_luc   = case when chot_luc is not null then pg_temp.luc(ngay_pha, 7) end,
    updated_at = pg_temp.luc(ngay_pha, 7)
  where ngay_pha < hom_nay_vn();

  -- Sổ kho: giờ ghi theo loại chứng từ; bán = đúng giờ trên hoá đơn iPOS.
  update kho_so_cai s set created_at = coalesce(
      (select d.thoi_diem_ban from kho_ipos_dong d where d.id = s.chung_tu_id),
      pg_temp.luc(s.ngay, case when s.loai = 'nhap' then 10
                               when s.loai like 'pha_loc%' then 7
                               else 12 end))
  where (s.created_at at time zone 'Asia/Ho_Chi_Minh')::date <> s.ngay;

  -- Lô: giờ tạo và mã lô theo ngày đóng gói (hàm đặt mã theo ngày chạy script).
  update kho_lo set created_at = pg_temp.luc(ngay_dong_goi, case when nguon = 'pha_loc' then 7 else 10 end)
  where ngay_dong_goi < hom_nay_vn();
  update kho_lo set ma_lo = 'TAM-' || id::text;
  update kho_lo l set ma_lo = x.ma
  from (select id, 'L' || to_char(ngay_dong_goi, 'YYMMDD') || '-'
                   || lpad(row_number() over (partition by chi_nhanh_id, ngay_dong_goi order by created_at, id)::text, 3, '0') as ma
        from kho_lo) x
  where x.id = l.id;

  perform pg_temp.sua_ngay(false);
end
$$;


-- =============================================================================
-- 6 · TÓM TẮT
-- =============================================================================
select
  (select count(*) from kho_mat_hang)                                             as mat_hang,
  (select count(*) from kho_mat_hang where theo_tang)                             as mon_theo_tang,
  (select count(*) from kho_o_ma)                                                 as o_ma,
  (select count(*) from kho_nha_cung_cap)                                         as nha_cung_cap,
  (select count(*) from kho_phieu_nhap)                                           as phieu_nhap,
  (select count(*) from kho_lo where so_tang is not null)                         as so_tang,
  (select count(*) from kho_phien_pha where trang_thai = 'da_chot')               as phien_loc,
  (select count(*) from kho_ipos_hoa_don)                                         as hoa_don_ipos,
  (select count(*) from kho_ipos_dong where trang_thai = 'da_ghi')                as dong_ban_da_tru,
  (select count(*) from kho_ipos_dong where lech_o)                               as dong_lech_o,
  (select count(*) from kho_ipos_dong where trang_thai = 'chua_khop')             as dong_cho_ghep,
  (select count(*) from kho_phieu_xuat where loai = 'huy')                        as phieu_huy,
  (select count(*) from kho_thanh_toan)                                           as lan_tra_no,
  (select count(*) from t_loi)                                                    as loi_bo_qua;
