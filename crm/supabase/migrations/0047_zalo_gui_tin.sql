-- =============================================================================
-- BEEFTOWN CRM — 0047 · ZALO ZBS · HÀNG GỬI TIN, CẤU HÌNH, RPC MÁY VÀ NGƯỜI
-- =============================================================================
-- PHẢI CHẠY SAU 0046 (một mình) — dùng 'may_zalo' và 'da_huy' vừa thêm ở đó.
--
-- 0006 có sẵn mẫu tin, chiến dịch, nhật ký gửi, duoc_phep_gui(),
-- xep_hang_gui_tin() — nhưng không có gì GỬI được. File này dựng phần database
-- của lớp gửi: Worker (web/src/lib/zalo-gui.ts) đăng nhập bằng tài khoản máy
-- may_zalo, 5 phút một lượt, lấy lô tin đến hạn, gọi Zalo, ghi kết quả.
--
-- CHỦ ĐÃ CHỐT (27/09/2026)
--   · ĐẶT BÀN = GIAO DỊCH. Khách lần đầu đặt bàn trên web (chưa ghé lần nào)
--     vẫn nhận ZBS-01 (xác nhận) và ZBS-02 (nhắc trước 2 tiếng) — nhưng KHÔNG
--     nhận tin chăm sóc cho tới khi đã thật sự ghé.
--   · Đợt này tự động ZBS-01, ZBS-02; màn chiến dịch gửi tay cho mẫu cham_soc.
--     ZBS-03/04 có cờ bat_tu_dong nhưng chưa có gì tự xếp chúng.
--
-- BẤT BIẾN
--   · Tin cham_soc: trần tran_cham_soc_thang (mặc định 2) tin/khách/tháng theo
--     giờ Việt Nam, tính cả tin đang cho_gui; chỉ gửi trong khung gio_tu–gio_den
--     (mặc định 08:00–21:00). Tin giao_dich không bị trần, không bị khung giờ.
--   · khoa_gui unique: ZBS-01:dat_ban:<id>, ZBS-02:dat_ban:<id>,
--     CD:<chien_dich_id>:<khach_hang_id>. Trigger chạy lại / gọi lại không trùng.
--   · Trigger đặt bàn KHÔNG BAO GIỜ làm hỏng đặt bàn: lỗi bên trong bị nuốt và
--     ghi vào zalo_cau_hinh.loi_cuoi.
--   · Token Zalo chỉ nằm trong DB dưới dạng BẢN MÃ "v1.<base64url>" (web mã hóa
--     bằng bí mật Worker ZALO_KHOA). CHECK chặn chuỗi không đúng dạng — một
--     token thô dán nhầm sẽ bị từ chối. Bản mã chỉ ra khỏi DB qua
--     zalo_bat_dau_luot() cho may_zalo. Chủ đọc được các cột KHÁC của
--     zalo_cau_hinh (quyền cột), không đọc được hai cột *_ma_hoa.
--   · may_zalo không đọc được bảng CRM nào (duoc_truy_cap_chi_nhanh() không
--     nhắc tới nó). Nó ghi nhat_ky_tin chỉ qua RPC definer: trigger tường ngăn
--     0018 được thay thân để cho may_zalo UPDATE nhat_ky_tin — không có policy
--     UPDATE nào trên bảng đó, nên UPDATE thẳng vẫn không làm gì được.
--
-- =============================================================================
-- DANH SÁCH RPC (web gọi qua supabase.rpc; mọi hàm trả jsonb trừ khi ghi khác)
-- =============================================================================
-- Lỗi quyền: SQLSTATE 42501 (insufficient_privilege → PostgREST 403).
-- Lỗi dữ liệu: 23514 (check_violation) hoặc 23503 (foreign_key_violation).
--
-- ---- MÁY (chỉ vai may_zalo; không phiên / vai khác → 42501) -----------------
--
-- zalo_bat_dau_luot(p_gioi_han integer default 50)
--   Khóa lượt 10 phút (zalo_cau_hinh.dang_chay_tu), dọn tin đặt bàn đã quá giờ
--   hẹn, lấy tối đa p_gioi_han (1–200) tin cho_gui đã đến hạn, KIỂM LẠI
--   duoc_phep_gui (trần tháng không tính chính tin đó) và mẫu còn duyệt; tin
--   cham_soc chỉ lấy khi đang trong khung giờ. Mỗi tin lấy ra: lan_thu + 1.
--   → { "khoa": false, "dang_bat": true, "trong_khung_cham_soc": bool,
--       "cau_hinh": { "app_id", "oa_id", "che_do": "thu"|"that",
--                     "refresh_token_ma_hoa", "access_token_ma_hoa",
--                     "het_han_luc" },
--       "lo": [ { "id": uuid (dùng làm tracking_id), "sdt": "0xxxxxxxxx",
--                 "template_id": mau_tin.ma_zalo, "mau_ma": "ZBS-01",
--                 "loai_tin": "giao_dich"|"cham_soc",
--                 "du_lieu": { tham số: chuỗi }, "lan_thu": int } ] }
--   Đang có lượt khác (< 10 phút): { "khoa": true, "dang_bat": true,
--       "dang_chay_tu": ts, "cau_hinh": null, "lo": [] }
--   Zalo đang tắt: { "khoa": false, "dang_bat": false, "cau_hinh": null, "lo": [] }
--
-- zalo_ghi_ket_qua(p_id uuid, p_ket_qua text, p_ma_zalo text default null,
--                  p_loi text default null, p_thu_lai_sau integer default null)
--   p_ket_qua: 'da_gui' | 'that_bai' | 'bi_tu_choi'. p_thu_lai_sau = số GIÂY
--   (kẹp 60–86400): chỉ có nghĩa với 'that_bai' — còn lượt (lan_thu < 5) thì
--   tin quay về cho_gui với thu_lai_luc = now() + p_thu_lai_sau; hết lượt thì
--   that_bai. p_loi được xóa token trước khi lưu, cắt 500 ký tự.
--   Tin đã da_huy mà Zalo báo đã gửi → ghi da_gui (sự thật thắng).
--   → { "ok": true, "bo_qua": false, "id", "ket_qua", "lan_thu", "thu_lai_luc" }
--   Tin đã ở trạng thái cuối: { "ok": true, "bo_qua": true, "id", "ket_qua" }
--   Tin cho_gui chưa được lấy trong lượt nào: { "ok": false, "id",
--       "loi": "Tin chưa được lấy ra trong lượt gửi nào" }
--
-- zalo_luu_token(p_access_ma_hoa text, p_het_han_luc timestamptz,
--                p_refresh_ma_hoa text default null)
--   Lưu access token mới (bản mã) + hạn; refresh token Zalo dùng MỘT lần nên
--   có cái mới thì truyền luôn — lưu ngay trong cùng lời gọi.
--   → { "ok": true, "het_han_luc" }
--
-- zalo_ket_thuc_luot(p_loi text default null, p_quota integer default null)
--   Nhả khóa, ghi lan_chay_cuoi, loi_cuoi (null = xóa lỗi cũ), quota_con (null
--   = giữ). Tin đã lấy mà không báo kết quả được trả lại hàng chờ (lan_thu đã
--   tăng — tối đa 5 lần rồi that_bai). Chiến dịch dang_chay hết tin chờ →
--   hoan_tat.
--   → { "ok": true, "so_tin_tra_lai": int, "so_chien_dich_xong": int }
--
-- ---- NGƯỜI: CHỈ CHỦ SỞ HỮU --------------------------------------------------
--
-- zalo_doc_cau_hinh()
--   → { "app_id", "oa_id", "che_do", "dang_bat", "gio_tu": "08:00",
--       "gio_den": "21:00", "tran_cham_soc_thang", "het_han_luc",
--       "co_refresh_token": bool, "co_access_token": bool,
--       "token_cap_nhat_luc", "dang_chay_tu", "lan_chay_cuoi", "loi_cuoi",
--       "quota_con",
--       "mau": [ { "ma", "ten", "loai", "noi_dung", "tham_so": [..],
--                  "ma_zalo", "da_duyet", "bat_tu_dong", "dang_dung" } ] }
--   KHÔNG BAO GIỜ trả bản mã token.
--
-- zalo_luu_cau_hinh(p_app_id text default null, p_oa_id text default null,
--                   p_che_do text default null, p_dang_bat boolean default null,
--                   p_gio_tu time default null, p_gio_den time default null,
--                   p_tran_cham_soc_thang integer default null)
--   Tham số null = giữ nguyên; app_id/oa_id chuỗi rỗng = xóa. Bật (dang_bat)
--   cần đủ app_id, oa_id, refresh token. gio_tu < gio_den; trần 0–2.
--   → như zalo_doc_cau_hinh()
--
-- zalo_luu_refresh_token(p_ma_hoa text)
--   Bản mã "v1.…" do web mã hóa. Lưu thì xóa access token cũ (lượt sau làm
--   mới ngay). null/rỗng = ngắt kết nối: xóa cả hai token và TẮT gửi tin.
--   → { "ok": true, "co_refresh_token": bool }
--
-- zalo_luu_mau(p_ma text, p_ma_zalo text, p_da_duyet boolean, p_bat_tu_dong boolean)
--   p_ma: 'ZBS-01'… Đã duyệt thì phải có mã Zalo.
--   → { "ok": true, "ma", "ma_zalo", "da_duyet", "bat_tu_dong", "tham_so" }
--
-- ---- NGƯỜI: CHỦ SỞ HỮU, QUẢN LÝ, MARKETING — ĐÚNG CHI NHÁNH -------------------
--
-- zalo_xem_truoc_chien_dich(p_chi_nhanh_id uuid, p_mau_ma text,
--                           p_nhom text default null, p_gui_luc timestamptz default null)
--   p_nhom: null | 'tat_ca' | 'vip' | một nhóm của v_phan_nhom_khach ('moi',
--   'dang_thanh_thoi_quen', 'than_thiet', 'ngu_dong', 'chua_ghe', 'b2b', 'khac').
--   Khách "của chi nhánh" = từng ghé hoặc từng đặt bàn ở chi nhánh đó.
--   → { "tong": int, "du_dieu_kien": int,
--       "bi_loai": [ { "ly_do": text, "so": int } ],   -- lý do của duoc_phep_gui
--       "mau": { "ma", "ten", "loai", "da_duyet", "san_sang": bool },
--       "tham_so_can_nhap": [ tên tham số web phải hỏi, vd "google_review_link" ],
--       "tran_thang": int, "dang_bat": bool }
--
-- zalo_tao_chien_dich(p_chi_nhanh_id uuid, p_ma_gui uuid, p_mau_ma text,
--                     p_nhom text, p_ten text, p_du_lieu jsonb default '{}',
--                     p_gui_luc timestamptz default null)
--   Chỉ mẫu cham_soc đã duyệt, Zalo đang bật. Xếp từ v_duoc_gui_tin, từng
--   khách qua duoc_phep_gui (trần tính theo tháng của p_gui_luc). p_du_lieu phải
--   có đủ tham_so_can_nhap. p_gui_luc null = gửi ngay; không quá 5 phút trong
--   quá khứ, không quá 60 ngày tới. Idempotent theo p_ma_gui.
--   → { "ok": true, "trung": bool, "chien_dich_id", "so_tin": int, "bi_loai": int }
--
-- zalo_dung_chien_dich(p_chien_dich_id uuid)
--   Chiến dịch → tam_dung, mọi tin cho_gui của nó → da_huy.
--   → { "ok": true, "so_huy": int }
--
-- zalo_thu_lai(p_id uuid)
--   Chỉ tin that_bai → cho_gui ngay (lan_thu về 0). Lượt sau vẫn kiểm lại
--   duoc_phep_gui. → { "ok": true, "id" }
--
-- zalo_tong_quan(p_chi_nhanh_id uuid)
--   Chỉ đếm, không SĐT.
--   → { "ket_noi": { "dang_bat", "che_do", "co_token", "het_han_luc",
--                    "dang_chay": bool, "lan_chay_cuoi", "loi_cuoi", "quota_con",
--                    "gio_tu", "gio_den", "tran_cham_soc_thang" },
--       "dem": { "cho_gui", "da_gui_hom_nay", "da_gui_30_ngay", "that_bai",
--                "bi_tu_choi", "da_huy" },
--       "chien_dich": [ { "id", "ten", "mau_ma", "nhom", "trang_thai",
--                         "bat_dau", "so_tin", "da_gui", "that_bai", "cho_gui" } ],
--       "mau": [ { "ma", "ten", "loai", "da_duyet", "bat_tu_dong", "san_sang" } ] }
--
-- ---- ĐỌC THẲNG (RLS) --------------------------------------------------------
--   v_zalo_nhat_ky (security_invoker) — hàng chờ + nhật ký có tên mẫu, tên
--   chiến dịch, SĐT che giữa (sdt_an), trạng thái, lỗi, lần thử, các mốc giờ.
--   mau_tin — mọi nhân sự đăng nhập đọc được (0007), nay có tham_so, bat_tu_dong.
--   zalo_cau_hinh — chỉ chủ, và chỉ các cột không bí mật.
--
-- HÀM NỘI BỘ (thu EXECUTE khỏi authenticated ở cuối file): zalo_rut_tham_so,
-- zalo_loc_tham_so, zalo_du_lieu_goc, zalo_du_lieu_dat_ban, zalo_dien_noi_dung,
-- zalo_luc_hen, zalo_sach_loi, zalo_xep_tin_mot, zalo_xep_tin_dat_ban,
-- zalo_khach_theo_nhom, và ba hàm trigger.
--
-- kiem_duoc_phep_gui() là thân thật của duoc_phep_gui(), thêm hai tham số (tin
-- không tính vào trần, mốc tháng). CỐ Ý không thu khỏi authenticated: nó là
-- SECURITY INVOKER như duoc_phep_gui() — ai gọi cũng chỉ thấy đúng những gì
-- RLS cho thấy — và duoc_phep_gui() (invoker) gọi nó.
-- =============================================================================


-- =============================================================================
-- 1 · MẪU TIN — tham số và cờ tự động
-- =============================================================================
alter table mau_tin add column tham_so jsonb not null default '[]'::jsonb;
alter table mau_tin add column bat_tu_dong boolean not null default false;

comment on column mau_tin.tham_so is
  'Tên tham số lấy từ <...> trong noi_dung, theo thứ tự xuất hiện. Chủ đăng ký mẫu trên Zalo ĐÚNG các tên này. Trigger tự tính — đừng sửa tay.';
comment on column mau_tin.bat_tu_dong is
  'Hệ thống tự xếp mẫu này (ZBS-01 khi đặt bàn, ZBS-02 trước giờ hẹn 2 tiếng). Mặc định tắt.';

-- Tên tham số theo thứ tự xuất hiện đầu tiên, không lặp.
create or replace function zalo_rut_tham_so(p_noi_dung text)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select coalesce(jsonb_agg(x.ten order by x.vt), '[]'::jsonb)
  from (
    select r.m[1] as ten, min(r.vt) as vt
    from regexp_matches(coalesce(p_noi_dung, ''), '<([A-Za-z_][A-Za-z0-9_]*)>', 'g')
         with ordinality as r(m, vt)
    group by r.m[1]
  ) x;
$$;

create or replace function zalo_mau_tin_tham_so()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.tham_so := zalo_rut_tham_so(new.noi_dung);
  return new;
end;
$$;

create trigger mau_tin_zalo_tham_so
  before insert or update of noi_dung on mau_tin
  for each row execute function zalo_mau_tin_tham_so();

-- Văn bản chuẩn: Beeftown_Bo_Nhan_Dien_So.html mục B4. Hai chỗ "[hotline]" và
-- "[số nhà], [tên đường]…" của bản gốc thành tham số <hotline>, <address> — điền
-- từ chi_nhanh.dien_thoai / chi_nhanh.dia_chi lúc xếp tin. Tin cham_soc kết
-- thúc bằng câu hủy nhận "NGUNG" (Beeftown_CRM_Design.html mục I2).
-- Chỉ sửa mẫu CHƯA duyệt: mẫu đã duyệt phải khớp đúng bản đã nộp Zalo.
update mau_tin set noi_dung =
 E'BEEFTOWN — XÁC NHẬN ĐẶT BÀN\nKhách hàng: <customer_name>\nSố điện thoại: <phone>\nNgày: <date>\nGiờ: <time>\nSố khách: <guests>\nMã đặt bàn: <booking_code>\n\nBàn được giữ trong 15 phút kể từ giờ hẹn. Cần đổi lịch, anh/chị nhắn Zalo hoặc gọi <hotline>.\nĐịa chỉ: <address>.'
where ma = 'ZBS-01' and not da_duyet;

update mau_tin set noi_dung =
 E'BEEFTOWN — NHẮC LỊCH HÔM NAY\nAnh/chị <customer_name> ơi, bàn <guests> khách lúc <time> hôm nay đã sẵn sàng.\nĐịa chỉ: <address>.\nBàn giữ 15 phút kể từ giờ hẹn. Cần hỗ trợ: <hotline>'
where ma = 'ZBS-02' and not da_duyet;

update mau_tin set noi_dung =
 E'BEEFTOWN — CẢM ƠN ANH/CHỊ\nCảm ơn anh/chị <customer_name> đã ghé Beeftown hôm nay.\nNếu bữa ăn vừa ý, anh/chị dành 30 giây đánh giá giúp tụi em nhé — mỗi góp ý đều được đọc và ghi nhận.\nĐánh giá tại: <google_review_link>\n\nKhông muốn nhận tin nữa, anh/chị nhắn "NGUNG" cho Beeftown.'
where ma = 'ZBS-03' and not da_duyet;

update mau_tin set noi_dung =
 E'BEEFTOWN — THẺ THÀNH VIÊN\nAnh/chị <customer_name> vừa tích <points> điểm từ hóa đơn <amount>đ.\nTổng điểm hiện có: <total_points> điểm (tương đương <cash_value>đ)\nĐiểm được trừ trực tiếp vào hóa đơn lần sau, không giới hạn thời gian sử dụng.'
where ma = 'ZBS-04' and not da_duyet;

-- Mẫu nào chưa được trigger chạm tới (đã duyệt, không sửa chữ) cũng có tham_so.
update mau_tin set tham_so = zalo_rut_tham_so(noi_dung);

alter table mau_tin add constraint mau_tin_cham_soc_co_huy_nhan
  check (loai <> 'cham_soc' or noi_dung like '%NGUNG%');


-- =============================================================================
-- 2 · NHẬT KÝ TIN — hàng chờ gửi
-- =============================================================================
alter table nhat_ky_tin add column du_lieu     jsonb not null default '{}'::jsonb;
alter table nhat_ky_tin add column khoa_gui    text unique;
alter table nhat_ky_tin add column dat_ban_id  uuid references dat_ban(id) on delete set null;
alter table nhat_ky_tin add column gui_sau     timestamptz;
alter table nhat_ky_tin add column lan_thu     integer not null default 0;
alter table nhat_ky_tin add column thu_lai_luc timestamptz;
alter table nhat_ky_tin add column dang_gui_tu timestamptz;
alter table nhat_ky_tin add column loai_tin    loai_mau_tin;

comment on column nhat_ky_tin.du_lieu     is 'template_data gửi Zalo: tên tham số → chuỗi.';
comment on column nhat_ky_tin.khoa_gui    is 'Chống trùng: ZBS-01:dat_ban:<id>, ZBS-02:dat_ban:<id>, CD:<chien_dich>:<khach>.';
comment on column nhat_ky_tin.gui_sau     is 'Hẹn giờ: không gửi trước mốc này. Null = gửi ngay.';
comment on column nhat_ky_tin.lan_thu     is 'Số lần máy đã lấy tin ra gửi. Tối đa 5.';
comment on column nhat_ky_tin.dang_gui_tu is 'Máy đã lấy tin ra lúc này và chưa báo kết quả. Quá 10 phút thì coi như bỏ.';
comment on column nhat_ky_tin.loai_tin    is 'Chép từ mẫu lúc xếp — trần tin chăm sóc đếm theo cột này.';

update nhat_ky_tin n set loai_tin = m.loai from mau_tin m where m.id = n.mau_tin_id and n.loai_tin is null;

create index nhat_ky_tin_cho_gui_idx on nhat_ky_tin (coalesce(gui_sau, created_at))
  where ket_qua = 'cho_gui';
create index nhat_ky_tin_dat_ban_idx on nhat_ky_tin (dat_ban_id) where dat_ban_id is not null;

-- Tham số chung mọi mẫu: tên khách, SĐT, địa chỉ và hotline chi nhánh.
create or replace function zalo_du_lieu_goc(p_khach_hang_id uuid, p_chi_nhanh_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'customer_name', coalesce(nullif(btrim((select ho_ten from khach_hang where id = p_khach_hang_id)), ''), 'Quý khách'),
    'phone',   (select sdt from khach_hang where id = p_khach_hang_id),
    'address', (select nullif(btrim(dia_chi), '') from chi_nhanh where id = p_chi_nhanh_id),
    'hotline', (select nullif(btrim(dien_thoai), '') from chi_nhanh where id = p_chi_nhanh_id)
  ));
$$;

-- Chỉ giữ các khóa mẫu thật sự có — Zalo từ chối tham số thừa.
create or replace function zalo_loc_tham_so(p_du_lieu jsonb, p_tham_so jsonb)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
  from jsonb_each(coalesce(p_du_lieu, '{}'::jsonb)) e
  where coalesce(p_tham_so, '[]'::jsonb) ? e.key;
$$;

create or replace function zalo_dien_noi_dung(p_noi_dung text, p_du_lieu jsonb)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_kq text := p_noi_dung;
  e record;
begin
  for e in select key, value from jsonb_each_text(coalesce(p_du_lieu, '{}'::jsonb)) loop
    v_kq := replace(v_kq, '<' || e.key || '>', coalesce(e.value, ''));
  end loop;
  return v_kq;
end;
$$;

-- Tin xếp qua xep_hang_gui_tin() (0045) hay INSERT thẳng: chép loại tin từ
-- mẫu, và điền tham số chung khi nơi xếp chưa điền gì.
create or replace function zalo_nhat_ky_tin_dien()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mau mau_tin;
begin
  if new.mau_tin_id is not null then
    select * into v_mau from mau_tin where id = new.mau_tin_id;
    if found then
      if new.loai_tin is null then new.loai_tin := v_mau.loai; end if;
      if coalesce(new.du_lieu, '{}'::jsonb) = '{}'::jsonb then
        new.du_lieu := zalo_loc_tham_so(zalo_du_lieu_goc(new.khach_hang_id, new.chi_nhanh_id), v_mau.tham_so);
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger nhat_ky_tin_zalo_dien
  before insert on nhat_ky_tin
  for each row execute function zalo_nhat_ky_tin_dien();


-- =============================================================================
-- 3 · CHIẾN DỊCH — tham số cố định và chống bấm hai lần
-- =============================================================================
alter table chien_dich add column du_lieu jsonb not null default '{}'::jsonb;
alter table chien_dich add column ma_gui uuid unique;

comment on column chien_dich.du_lieu is 'Tham số cố định của cả chiến dịch (vd google_review_link, link ưu đãi).';
comment on column chien_dich.ma_gui  is 'Mã một lần của form tạo chiến dịch — bấm gửi hai lần vẫn một chiến dịch.';


-- =============================================================================
-- 4 · CẤU HÌNH ZALO — một dòng cho cả thương hiệu
-- =============================================================================
create table zalo_cau_hinh (
  id                   smallint primary key default 1,
  app_id               text,
  oa_id                text,
  refresh_token_ma_hoa text,
  access_token_ma_hoa  text,
  het_han_luc          timestamptz,           -- hạn của access token
  token_cap_nhat_luc   timestamptz,
  che_do               text not null default 'thu',   -- thu = mode development của Zalo
  dang_bat             boolean not null default false,
  gio_tu               time not null default '08:00', -- khung gửi tin chăm sóc, giờ VN
  gio_den              time not null default '21:00',
  tran_cham_soc_thang  smallint not null default 2,
  dang_chay_tu         timestamptz,           -- khóa lượt gửi
  lan_chay_cuoi        timestamptz,
  loi_cuoi             text,
  quota_con            integer,
  updated_at           timestamptz not null default now(),

  constraint zalo_cau_hinh_mot_dong check (id = 1),
  constraint zalo_cau_hinh_app_id check (app_id is null or app_id ~ '^[A-Za-z0-9_-]+$' and length(app_id) <= 64),
  constraint zalo_cau_hinh_oa_id  check (oa_id  is null or oa_id  ~ '^[A-Za-z0-9_-]+$' and length(oa_id)  <= 64),
  -- Bản mã của web: "v1." + base64url(iv 12 ‖ bản mã ‖ thẻ 16) — ít nhất 38 ký tự sau tiền tố.
  constraint zalo_cau_hinh_refresh_la_ban_ma check (refresh_token_ma_hoa is null
    or (refresh_token_ma_hoa ~ '^v1\.[A-Za-z0-9_-]+$' and length(refresh_token_ma_hoa) between 41 and 8192)),
  constraint zalo_cau_hinh_access_la_ban_ma check (access_token_ma_hoa is null
    or (access_token_ma_hoa ~ '^v1\.[A-Za-z0-9_-]+$' and length(access_token_ma_hoa) between 41 and 8192)),
  constraint zalo_cau_hinh_che_do check (che_do in ('thu', 'that')),
  constraint zalo_cau_hinh_khung_gio check (gio_tu < gio_den),
  constraint zalo_cau_hinh_tran check (tran_cham_soc_thang between 0 and 2),
  constraint zalo_cau_hinh_bat_can_du check (not dang_bat
    or (app_id is not null and oa_id is not null and refresh_token_ma_hoa is not null))
);

comment on table zalo_cau_hinh is
  'Kết nối Zalo ZBS, một dòng. Token chỉ ở dạng bản mã; chủ đọc được các cột khác, bản mã chỉ ra qua zalo_bat_dau_luot() cho may_zalo.';

create trigger zalo_cau_hinh_updated_at
  before update on zalo_cau_hinh
  for each row execute function tu_dong_cap_nhat_updated_at();

insert into zalo_cau_hinh (id) values (1) on conflict (id) do nothing;

alter table zalo_cau_hinh enable row level security;

create policy zalo_cau_hinh_doc on zalo_cau_hinh
  for select using (la_chu_so_huu());
-- Không có policy ghi: mọi thay đổi đi qua RPC.

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on zalo_cau_hinh from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on zalo_cau_hinh from authenticated';
    -- Quyền CỘT: hai cột *_ma_hoa không có ở đây, nên kể cả chủ cũng không
    -- select được chúng ("select *" bị từ chối — web chọn cột hoặc gọi
    -- zalo_doc_cau_hinh()).
    execute 'grant select (id, app_id, oa_id, het_han_luc, token_cap_nhat_luc, che_do, dang_bat,
                           gio_tu, gio_den, tran_cham_soc_thang, dang_chay_tu, lan_chay_cuoi,
                           loi_cuoi, quota_con, updated_at) on zalo_cau_hinh to authenticated';
  end if;
end
$$;


-- =============================================================================
-- 5 · ĐƯỢC PHÉP GỬI — đặt bàn là giao dịch, trần tin chăm sóc
-- =============================================================================
-- Thân thật nằm ở kiem_duoc_phep_gui() vì lượt gửi phải kiểm lại MỘT tin đang
-- chờ mà không đếm chính nó vào trần — việc duoc_phep_gui(khách, loại) không
-- nói được, và chữ ký của nó không được đổi (README, lưu ý 6).
--
-- Luật (theo thứ tự, lý do đầu tiên khớp thắng — câu chữ ba lý do cũ giữ nguyên):
--   1. không có khách / khách đã yêu cầu xóa → không;
--   2. chưa từng ghé: giao_dich được nếu có đặt bàn CHƯA HỦY (đặt bàn = giao
--      dịch); cham_soc thì không — "Khách chưa từng giao dịch";
--   3. cham_soc cần đồng ý nhận tin;
--   4. cham_soc: số tin cham_soc cho_gui + da_gui của khách trong THÁNG (giờ VN)
--      của p_luc — mốc mỗi tin = gui_luc, hoặc gui_sau, hoặc created_at — phải
--      nhỏ hơn zalo_cau_hinh.tran_cham_soc_thang.
--
-- SECURITY INVOKER như duoc_phep_gui(): đi qua RLS của người gọi. Mọi đường
-- xếp tin thật (xep_hang_gui_tin, RPC zalo_*, trigger đặt bàn) là definer nên
-- thấy đủ. Gọi thẳng dưới vai không phải chủ thì zalo_cau_hinh bị RLS che và
-- trần lấy mặc định 2.
-- =============================================================================
create or replace function kiem_duoc_phep_gui(
  p_khach_hang_id uuid,
  p_loai_tin      loai_mau_tin,
  p_tru_tin_id    uuid default null,
  p_luc           timestamptz default null
)
returns table (duoc_gui boolean, ly_do text)
language plpgsql
stable
set search_path = public
as $$
declare
  v_dang_hoat_dong boolean;
  v_so_lan_ghe     bigint;
  v_dong_y         boolean;
  v_tran           integer;
  v_dem            bigint;
  v_thang          timestamp;
begin
  select kh.dang_hoat_dong,
         (select count(*) from luot_ghe where khach_hang_id = kh.id),
         coalesce(dy.dang_dong_y, false)
    into v_dang_hoat_dong, v_so_lan_ghe, v_dong_y
  from khach_hang kh
  left join v_dong_y_hien_tai dy on dy.khach_hang_id = kh.id
  where kh.id = p_khach_hang_id;

  if not found then
    return query select false, 'Không tìm thấy khách hàng'::text; return;
  end if;

  if not v_dang_hoat_dong then
    return query select false, 'Khách đã yêu cầu xoá dữ liệu'::text; return;
  end if;

  -- Điều kiện của Zalo: phải từng giao dịch. Chủ đã chốt: đặt bàn chưa hủy
  -- là giao dịch — nhưng chỉ cho tin giao dịch.
  if v_so_lan_ghe = 0 then
    if p_loai_tin = 'giao_dich' and exists (
         select 1 from dat_ban
         where khach_hang_id = p_khach_hang_id and trang_thai <> 'da_huy') then
      return query select true, 'OK'::text; return;
    end if;
    return query select false, 'Khách chưa từng giao dịch — Zalo không cho gửi'::text; return;
  end if;

  if p_loai_tin = 'cham_soc' and not v_dong_y then
    return query select false, 'Khách chưa đồng ý nhận tin quảng cáo'::text; return;
  end if;

  if p_loai_tin = 'cham_soc' then
    v_tran := coalesce((select tran_cham_soc_thang from zalo_cau_hinh where id = 1), 2);
    v_thang := date_trunc('month', (coalesce(p_luc, now()) at time zone 'utc') + interval '7 hours');
    select count(*) into v_dem
    from nhat_ky_tin n
    where n.khach_hang_id = p_khach_hang_id
      and n.loai_tin = 'cham_soc'
      and n.ket_qua in ('cho_gui', 'da_gui')
      and (p_tru_tin_id is null or n.id <> p_tru_tin_id)
      and date_trunc('month', (coalesce(n.gui_luc, n.gui_sau, n.created_at) at time zone 'utc')
                              + interval '7 hours') = v_thang;
    if v_dem >= v_tran then
      return query select false, format('Khách đã đủ %s tin chăm sóc trong tháng', v_tran); return;
    end if;
  end if;

  return query select true, 'OK'::text;
end;
$$;

comment on function kiem_duoc_phep_gui is
  'Thân thật của duoc_phep_gui(), thêm p_tru_tin_id (tin không tính vào trần tháng) và p_luc (tháng nào). Invoker — đi qua RLS người gọi (0047).';

-- Cùng chữ ký, cùng thuộc tính (plpgsql, stable, invoker) — chỉ thay thân.
create or replace function duoc_phep_gui(
  p_khach_hang_id uuid,
  p_loai_tin      loai_mau_tin
)
returns table (duoc_gui boolean, ly_do text)
language plpgsql
stable
as $$
begin
  return query select * from kiem_duoc_phep_gui(p_khach_hang_id, p_loai_tin, null, null);
end;
$$;

comment on function duoc_phep_gui is
  'Chốt chặn trước khi gửi. LUÔN gọi hàm này, đừng gửi thẳng từ danh sách khách. 0047: đặt bàn chưa hủy tính là giao dịch cho tin giao_dich; tin cham_soc có trần tháng.';


-- =============================================================================
-- 6 · TƯỜNG NGĂN 0018 — cho may_zalo cập nhật nhat_ky_tin (qua RPC)
-- =============================================================================
-- Cùng chữ ký. Thay đổi CÓ CHỦ Ý duy nhất: vai may_zalo được UPDATE
-- nhat_ky_tin — để zalo_bat_dau_luot / zalo_ghi_ket_qua / zalo_ket_thuc_luot
-- (definer) ghi trạng thái gửi. Bảng đó không có policy UPDATE (0007), nên
-- may_zalo không UPDATE thẳng được; INSERT và mọi bảng CRM khác vẫn bị chặn.
-- Câu báo lỗi giữ nguyên chữ (README, lưu ý 9).
-- =============================================================================
create or replace function chan_vai_ngoai_crm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if la_nhan_su_ngoai_crm() then
    -- 0047 · máy Zalo ghi kết quả gửi
    if tg_table_name = 'nhat_ky_tin' and tg_op = 'UPDATE'
       and co_vai_tro(array['may_zalo']::vai_tro[]) then
      return new;
    end if;
    raise exception 'Tài khoản kho không được ghi dữ liệu khách hàng, đặt bàn hay điểm tích lũy'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

comment on function chan_vai_ngoai_crm is
  'Trigger tường ngăn: vai kho không ghi được vào bảng CRM, kể cả qua ghi_luot_ghe() hay tim_hoac_tao_khach() — hai hàm definer mà RLS không chặn được. 0047: riêng may_zalo được UPDATE nhat_ky_tin (qua RPC definer).';


-- =============================================================================
-- 7 · ĐẶT BÀN → ZBS-01 NGAY, ZBS-02 TRƯỚC GIỜ HẸN 2 TIẾNG
-- =============================================================================
-- Giờ hẹn là giờ VN (dat_ban.ngay + gio). Đổi ra timestamptz không nhờ TimeZone
-- của phiên — cùng cách bay_gio_vn() ở 0008.
create or replace function zalo_luc_hen(p_ngay date, p_gio time)
returns timestamptz
language sql
immutable
set search_path = public
as $$ select ((p_ngay + p_gio) - interval '7 hours') at time zone 'utc' $$;

create or replace function zalo_du_lieu_dat_ban(p_dat_ban_id uuid, p_tham_so jsonb)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select zalo_loc_tham_so(
           zalo_du_lieu_goc(d.khach_hang_id, d.chi_nhanh_id)
           || jsonb_build_object(
                'date',         to_char(d.ngay, 'DD/MM/YYYY'),
                'time',         to_char(d.gio, 'HH24:MI'),
                'guests',       d.so_khach::text,
                'booking_code', coalesce(d.ma_dat_ban, '')),
           p_tham_so)
  from dat_ban d where d.id = p_dat_ban_id;
$$;

-- Xếp MỘT tin tự động cho một đặt bàn. Trả id, hoặc null khi không xếp (mẫu
-- chưa sẵn sàng, không được phép gửi, hoặc đã có — khoa_gui).
create or replace function zalo_xep_tin_mot(p_dat dat_ban, p_mau_ma text, p_gui_sau timestamptz)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mau mau_tin;
  v_kt  record;
  v_dl  jsonb;
  v_id  uuid;
begin
  select * into v_mau from mau_tin
  where ma = p_mau_ma and dang_dung and da_duyet and ma_zalo is not null and bat_tu_dong;
  if not found then return null; end if;

  select * into v_kt from kiem_duoc_phep_gui(p_dat.khach_hang_id, v_mau.loai, null, p_gui_sau);
  if not v_kt.duoc_gui then return null; end if;

  v_dl := zalo_du_lieu_dat_ban(p_dat.id, v_mau.tham_so);

  insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, mau_tin_id, sdt_gui, noi_dung,
                           ket_qua, du_lieu, khoa_gui, gui_sau, loai_tin, dat_ban_id)
  select p_dat.chi_nhanh_id, p_dat.khach_hang_id, v_mau.id, kh.sdt,
         zalo_dien_noi_dung(v_mau.noi_dung, v_dl),
         'cho_gui', v_dl, p_mau_ma || ':dat_ban:' || p_dat.id, p_gui_sau, v_mau.loai, p_dat.id
  from khach_hang kh where kh.id = p_dat.khach_hang_id
  on conflict (khoa_gui) do nothing
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function zalo_xep_tin_dat_ban(p_dat_ban_id uuid, p_moi boolean, p_doi_gio boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dat  dat_ban;
  v_bat  boolean;
  v_nhac timestamptz;
begin
  select * into v_dat from dat_ban where id = p_dat_ban_id;
  if not found then return; end if;

  v_nhac := zalo_luc_hen(v_dat.ngay, v_dat.gio) - interval '2 hours';

  -- Hủy: mọi tin đặt bàn còn chờ thôi gửi.
  if v_dat.trang_thai = 'da_huy' then
    update nhat_ky_tin set ket_qua = 'da_huy', loi = 'Khách đã hủy đặt bàn', dang_gui_tu = null
    where dat_ban_id = v_dat.id and ket_qua = 'cho_gui';
    return;
  end if;

  -- Đã đến / không đến: không nhắc lịch nữa.
  if v_dat.trang_thai in ('da_den', 'khong_den') then
    update nhat_ky_tin n set ket_qua = 'da_huy', loi = 'Đặt bàn đã kết thúc — không nhắc lịch nữa', dang_gui_tu = null
    from mau_tin m
    where m.id = n.mau_tin_id and m.ma = 'ZBS-02'
      and n.dat_ban_id = v_dat.id and n.ket_qua = 'cho_gui';
    return;
  end if;

  -- Đổi ngày/giờ: dời tin nhắc (kể cả tin đã hủy vì lần đổi trước), hoặc hủy
  -- khi giờ nhắc mới đã qua.
  if p_doi_gio then
    update nhat_ky_tin n
    set gui_sau = v_nhac, ket_qua = 'cho_gui', loi = null, lan_thu = 0,
        thu_lai_luc = null, dang_gui_tu = null
    from mau_tin m
    where m.id = n.mau_tin_id and m.ma = 'ZBS-02'
      and n.dat_ban_id = v_dat.id and n.ket_qua in ('cho_gui', 'da_huy')
      and v_nhac > now();

    update nhat_ky_tin n
    set ket_qua = 'da_huy', loi = 'Giờ hẹn mới đã sát — không còn nhắc trước 2 tiếng', dang_gui_tu = null
    from mau_tin m
    where m.id = n.mau_tin_id and m.ma = 'ZBS-02'
      and n.dat_ban_id = v_dat.id and n.ket_qua = 'cho_gui'
      and v_nhac <= now();
  end if;

  -- Ngày, giờ, số khách mới vào tham số của tin còn chờ.
  if not p_moi then
    update nhat_ky_tin n
    set du_lieu  = zalo_du_lieu_dat_ban(v_dat.id, m.tham_so),
        noi_dung = zalo_dien_noi_dung(m.noi_dung, zalo_du_lieu_dat_ban(v_dat.id, m.tham_so))
    from mau_tin m
    where m.id = n.mau_tin_id and n.dat_ban_id = v_dat.id and n.ket_qua = 'cho_gui';
  end if;

  select dang_bat into v_bat from zalo_cau_hinh where id = 1;
  if not coalesce(v_bat, false) then return; end if;

  if p_moi then
    perform zalo_xep_tin_mot(v_dat, 'ZBS-01', now());
  end if;
  if (p_moi or p_doi_gio) and v_nhac > now() then
    perform zalo_xep_tin_mot(v_dat, 'ZBS-02', v_nhac);
  end if;
end;
$$;

-- Trigger: KHÔNG BAO GIỜ làm hỏng đặt bàn. Chạy cả dưới anon (tao_dat_ban của
-- website) — không cần phiên, không cần quyền gì của người gọi.
create or replace function zalo_sau_dat_ban()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doi_gio boolean := false;
begin
  if tg_op = 'UPDATE' then
    v_doi_gio := (old.ngay is distinct from new.ngay) or (old.gio is distinct from new.gio);
  end if;

  begin
    perform zalo_xep_tin_dat_ban(new.id, tg_op = 'INSERT', v_doi_gio);
  exception when others then
    begin
      update zalo_cau_hinh
      set loi_cuoi = left('Xếp tin Zalo cho đặt bàn ' || coalesce(new.ma_dat_ban, new.id::text)
                          || ' lỗi: ' || sqlerrm, 500)
      where id = 1;
    exception when others then
      null;  -- ghi lỗi cũng hỏng thì thôi — đặt bàn vẫn phải thành công
    end;
  end;
  return null;
end;
$$;

create trigger dat_ban_zalo
  after insert or update of ngay, gio, so_khach, trang_thai on dat_ban
  for each row execute function zalo_sau_dat_ban();


-- =============================================================================
-- 8 · RPC MÁY — chỉ vai may_zalo
-- =============================================================================
-- Câu lỗi không bao giờ chứa token: xóa mọi "access_token=…", "refresh_token":…,
-- "secret_key: …" trước khi lưu, cắt 500 ký tự.
create or replace function zalo_sach_loi(p_loi text)
returns text
language sql
immutable
set search_path = public
as $$
  select left(regexp_replace(nullif(btrim(p_loi), ''),
                '(access_token|refresh_token|secret_key|app_secret|code_verifier|authorization)("?\s*[:=]\s*"?)(bearer\s+)?[^\s"&,;}]+',
                '\1\2***', 'gi'),
              500);
$$;

create or replace function zalo_bat_dau_luot(p_gioi_han integer default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg   zalo_cau_hinh;
  v_han   integer := least(greatest(coalesce(p_gioi_han, 50), 1), 200);
  v_gio   time := gio_vn();
  v_khung boolean;
  v_lo    jsonb := '[]'::jsonb;
  v_kt    record;
  r       record;
begin
  if not co_vai_tro(array['may_zalo']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy Zalo mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_cfg from zalo_cau_hinh where id = 1 for update;

  if not found or not v_cfg.dang_bat then
    return jsonb_build_object('khoa', false, 'dang_bat', false, 'cau_hinh', null, 'lo', '[]'::jsonb);
  end if;

  if v_cfg.dang_chay_tu is not null and v_cfg.dang_chay_tu > now() - interval '10 minutes' then
    return jsonb_build_object('khoa', true, 'dang_bat', true, 'dang_chay_tu', v_cfg.dang_chay_tu,
                              'cau_hinh', null, 'lo', '[]'::jsonb);
  end if;

  update zalo_cau_hinh set dang_chay_tu = now() where id = 1;

  v_khung := v_gio >= v_cfg.gio_tu and v_gio < v_cfg.gio_den;

  -- Tin đặt bàn mà giờ hẹn đã qua (Zalo tắt một lúc, máy ngừng chạy…) thì thôi.
  update nhat_ky_tin n
  set ket_qua = 'da_huy', loi = 'Đã quá giờ hẹn — không gửi tin đặt bàn nữa', dang_gui_tu = null
  from dat_ban d
  where n.dat_ban_id = d.id and n.ket_qua = 'cho_gui'
    and (n.dang_gui_tu is null or n.dang_gui_tu < now() - interval '10 minutes')
    and zalo_luc_hen(d.ngay, d.gio) <= now();

  -- Lấy ra 5 lần mà không lần nào báo được kết quả.
  update nhat_ky_tin
  set ket_qua = 'that_bai', loi = 'Đã thử 5 lần mà không nhận được kết quả', dang_gui_tu = null
  where ket_qua = 'cho_gui' and lan_thu >= 5
    and (dang_gui_tu is null or dang_gui_tu < now() - interval '10 minutes');

  for r in
    select n.id, n.khach_hang_id, n.sdt_gui, n.du_lieu, n.lan_thu, n.dat_ban_id,
           coalesce(n.loai_tin, m.loai) as loai,
           m.id as mau_id, m.ma, m.ma_zalo, m.da_duyet, m.dang_dung, m.bat_tu_dong
    from nhat_ky_tin n
    left join mau_tin m on m.id = n.mau_tin_id
    where n.ket_qua = 'cho_gui'
      and coalesce(n.gui_sau, n.created_at) <= now()
      and (n.thu_lai_luc is null or n.thu_lai_luc <= now())
      and (n.dang_gui_tu is null or n.dang_gui_tu < now() - interval '10 minutes')
      and (coalesce(n.loai_tin, m.loai) is distinct from 'cham_soc' or v_khung)
    order by coalesce(n.gui_sau, n.created_at), n.created_at
    limit v_han
    for update of n skip locked
  loop
    if r.mau_id is null or not r.dang_dung or not r.da_duyet or r.ma_zalo is null
       or (r.dat_ban_id is not null and not r.bat_tu_dong) then
      update nhat_ky_tin
      set ket_qua = 'da_huy', loi = 'Mẫu tin chưa được Zalo duyệt hoặc đã tắt', dang_gui_tu = null
      where id = r.id;
      continue;
    end if;

    select * into v_kt from kiem_duoc_phep_gui(r.khach_hang_id, r.loai, r.id, now());
    if not v_kt.duoc_gui then
      update nhat_ky_tin
      set ket_qua = 'bi_tu_choi', loi = v_kt.ly_do, dang_gui_tu = null
      where id = r.id;
      continue;
    end if;

    update nhat_ky_tin set dang_gui_tu = now(), lan_thu = lan_thu + 1 where id = r.id;

    v_lo := v_lo || jsonb_build_array(jsonb_build_object(
      'id', r.id, 'sdt', r.sdt_gui, 'template_id', r.ma_zalo, 'mau_ma', r.ma,
      'loai_tin', r.loai, 'du_lieu', r.du_lieu, 'lan_thu', r.lan_thu + 1));
  end loop;

  return jsonb_build_object(
    'khoa', false,
    'dang_bat', true,
    'trong_khung_cham_soc', v_khung,
    'cau_hinh', jsonb_build_object(
      'app_id', v_cfg.app_id, 'oa_id', v_cfg.oa_id, 'che_do', v_cfg.che_do,
      'refresh_token_ma_hoa', v_cfg.refresh_token_ma_hoa,
      'access_token_ma_hoa', v_cfg.access_token_ma_hoa,
      'het_han_luc', v_cfg.het_han_luc),
    'lo', v_lo);
end;
$$;

comment on function zalo_bat_dau_luot is
  'Máy Zalo: khóa lượt 10 phút, trả cấu hình (token bản mã) và lô tin đến hạn đã kiểm lại duoc_phep_gui và khung giờ (0047).';

create or replace function zalo_ghi_ket_qua(
  p_id          uuid,
  p_ket_qua     text,
  p_ma_zalo     text default null,
  p_loi         text default null,
  p_thu_lai_sau integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tin nhat_ky_tin;
begin
  if not co_vai_tro(array['may_zalo']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy Zalo mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;

  if p_ket_qua is null or p_ket_qua not in ('da_gui', 'that_bai', 'bi_tu_choi') then
    raise exception 'Kết quả gửi không hợp lệ: %', coalesce(p_ket_qua, '(rỗng)')
      using errcode = 'check_violation';
  end if;

  select * into v_tin from nhat_ky_tin where id = p_id for update;
  if not found then
    raise exception 'Không tìm thấy tin %', p_id using errcode = 'foreign_key_violation';
  end if;

  if v_tin.ket_qua <> 'cho_gui' and not (v_tin.ket_qua = 'da_huy' and p_ket_qua = 'da_gui') then
    return jsonb_build_object('ok', true, 'bo_qua', true, 'id', v_tin.id, 'ket_qua', v_tin.ket_qua);
  end if;

  if v_tin.ket_qua = 'cho_gui' and v_tin.dang_gui_tu is null then
    return jsonb_build_object('ok', false, 'id', v_tin.id,
                              'loi', 'Tin chưa được lấy ra trong lượt gửi nào');
  end if;

  if p_ket_qua = 'da_gui' then
    update nhat_ky_tin
    set ket_qua = 'da_gui', gui_luc = now(), ma_zalo_tra_ve = left(nullif(btrim(p_ma_zalo), ''), 200),
        loi = null, dang_gui_tu = null, thu_lai_luc = null
    where id = p_id returning * into v_tin;
  elsif p_ket_qua = 'that_bai' and p_thu_lai_sau is not null and v_tin.lan_thu < 5 then
    update nhat_ky_tin
    set ket_qua = 'cho_gui',
        thu_lai_luc = now() + make_interval(secs => least(greatest(p_thu_lai_sau, 60), 86400)),
        loi = zalo_sach_loi(p_loi), dang_gui_tu = null
    where id = p_id returning * into v_tin;
  else
    update nhat_ky_tin
    set ket_qua = p_ket_qua::ket_qua_gui, loi = zalo_sach_loi(p_loi),
        dang_gui_tu = null, thu_lai_luc = null
    where id = p_id returning * into v_tin;
  end if;

  return jsonb_build_object('ok', true, 'bo_qua', false, 'id', v_tin.id, 'ket_qua', v_tin.ket_qua,
                            'lan_thu', v_tin.lan_thu, 'thu_lai_luc', v_tin.thu_lai_luc);
end;
$$;

create or replace function zalo_luu_token(
  p_access_ma_hoa  text,
  p_het_han_luc    timestamptz,
  p_refresh_ma_hoa text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not co_vai_tro(array['may_zalo']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy Zalo mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;

  if p_access_ma_hoa is null or p_het_han_luc is null then
    raise exception 'Thiếu access token hoặc hạn dùng' using errcode = 'check_violation';
  end if;

  -- CHECK của bảng từ chối chuỗi không phải bản mã "v1.…".
  update zalo_cau_hinh
  set access_token_ma_hoa  = p_access_ma_hoa,
      het_han_luc          = p_het_han_luc,
      refresh_token_ma_hoa = coalesce(p_refresh_ma_hoa, refresh_token_ma_hoa),
      token_cap_nhat_luc   = now()
  where id = 1;

  return jsonb_build_object('ok', true, 'het_han_luc', p_het_han_luc);
end;
$$;

create or replace function zalo_ket_thuc_luot(p_loi text default null, p_quota integer default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tra_lai integer;
  v_xong    integer;
begin
  if not co_vai_tro(array['may_zalo']::vai_tro[]) then
    raise exception 'Chỉ tài khoản máy Zalo mới gọi được hàm này'
      using errcode = 'insufficient_privilege';
  end if;

  update zalo_cau_hinh
  set dang_chay_tu = null, lan_chay_cuoi = now(), loi_cuoi = zalo_sach_loi(p_loi),
      quota_con = coalesce(p_quota, quota_con)
  where id = 1;

  -- Lấy ra mà không báo kết quả: trả lại hàng chờ (lan_thu đã tăng lúc lấy).
  update nhat_ky_tin set dang_gui_tu = null
  where ket_qua = 'cho_gui' and dang_gui_tu is not null;
  get diagnostics v_tra_lai = row_count;

  update chien_dich c set trang_thai = 'hoan_tat', ket_thuc = now()
  where c.trang_thai = 'dang_chay'
    and not exists (select 1 from nhat_ky_tin n where n.chien_dich_id = c.id and n.ket_qua = 'cho_gui');
  get diagnostics v_xong = row_count;

  return jsonb_build_object('ok', true, 'so_tin_tra_lai', v_tra_lai, 'so_chien_dich_xong', v_xong);
end;
$$;


-- =============================================================================
-- 9 · RPC NGƯỜI — CHỦ SỞ HỮU: cấu hình, token, mẫu
-- =============================================================================
create or replace function zalo_doc_cau_hinh()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cfg zalo_cau_hinh;
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ sở hữu mới xem được cài đặt Zalo'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_cfg from zalo_cau_hinh where id = 1;

  return jsonb_build_object(
    'app_id', v_cfg.app_id, 'oa_id', v_cfg.oa_id, 'che_do', v_cfg.che_do,
    'dang_bat', v_cfg.dang_bat,
    'gio_tu', to_char(v_cfg.gio_tu, 'HH24:MI'), 'gio_den', to_char(v_cfg.gio_den, 'HH24:MI'),
    'tran_cham_soc_thang', v_cfg.tran_cham_soc_thang,
    'het_han_luc', v_cfg.het_han_luc,
    'co_refresh_token', v_cfg.refresh_token_ma_hoa is not null,
    'co_access_token', v_cfg.access_token_ma_hoa is not null,
    'token_cap_nhat_luc', v_cfg.token_cap_nhat_luc,
    'dang_chay_tu', v_cfg.dang_chay_tu, 'lan_chay_cuoi', v_cfg.lan_chay_cuoi,
    'loi_cuoi', v_cfg.loi_cuoi, 'quota_con', v_cfg.quota_con,
    'mau', (select coalesce(jsonb_agg(jsonb_build_object(
               'ma', m.ma, 'ten', m.ten, 'loai', m.loai, 'noi_dung', m.noi_dung,
               'tham_so', m.tham_so, 'ma_zalo', m.ma_zalo, 'da_duyet', m.da_duyet,
               'bat_tu_dong', m.bat_tu_dong, 'dang_dung', m.dang_dung) order by m.ma), '[]'::jsonb)
            from mau_tin m));
end;
$$;

create or replace function zalo_luu_cau_hinh(
  p_app_id              text    default null,
  p_oa_id               text    default null,
  p_che_do              text    default null,
  p_dang_bat            boolean default null,
  p_gio_tu              time    default null,
  p_gio_den             time    default null,
  p_tran_cham_soc_thang integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cfg zalo_cau_hinh;
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ sở hữu mới sửa được cài đặt Zalo'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_cfg from zalo_cau_hinh where id = 1 for update;

  if p_app_id is not null then v_cfg.app_id := nullif(btrim(p_app_id), ''); end if;
  if p_oa_id  is not null then v_cfg.oa_id  := nullif(btrim(p_oa_id), '');  end if;
  if p_che_do is not null then v_cfg.che_do := p_che_do; end if;
  if p_dang_bat is not null then v_cfg.dang_bat := p_dang_bat; end if;
  if p_gio_tu  is not null then v_cfg.gio_tu  := p_gio_tu;  end if;
  if p_gio_den is not null then v_cfg.gio_den := p_gio_den; end if;
  if p_tran_cham_soc_thang is not null then v_cfg.tran_cham_soc_thang := p_tran_cham_soc_thang; end if;

  if v_cfg.che_do not in ('thu', 'that') then
    raise exception 'Chế độ gửi phải là "thu" hoặc "that"' using errcode = 'check_violation';
  end if;
  if v_cfg.gio_tu >= v_cfg.gio_den then
    raise exception 'Giờ bắt đầu gửi tin chăm sóc phải trước giờ kết thúc' using errcode = 'check_violation';
  end if;
  if v_cfg.tran_cham_soc_thang not between 0 and 2 then
    raise exception 'Trần tin chăm sóc mỗi tháng từ 0 đến 2' using errcode = 'check_violation';
  end if;
  if v_cfg.dang_bat and (v_cfg.app_id is null or v_cfg.oa_id is null or v_cfg.refresh_token_ma_hoa is null) then
    raise exception 'Chưa đủ App ID, OA ID và refresh token để bật gửi tin Zalo' using errcode = 'check_violation';
  end if;

  update zalo_cau_hinh
  set app_id = v_cfg.app_id, oa_id = v_cfg.oa_id, che_do = v_cfg.che_do, dang_bat = v_cfg.dang_bat,
      gio_tu = v_cfg.gio_tu, gio_den = v_cfg.gio_den, tran_cham_soc_thang = v_cfg.tran_cham_soc_thang
  where id = 1;

  return zalo_doc_cau_hinh();
end;
$$;

create or replace function zalo_luu_refresh_token(p_ma_hoa text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ma text := nullif(btrim(p_ma_hoa), '');
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ sở hữu mới nối được tài khoản Zalo'
      using errcode = 'insufficient_privilege';
  end if;

  if v_ma is null then
    update zalo_cau_hinh
    set refresh_token_ma_hoa = null, access_token_ma_hoa = null, het_han_luc = null,
        dang_bat = false, token_cap_nhat_luc = now()
    where id = 1;
  else
    if v_ma !~ '^v1\.[A-Za-z0-9_-]+$' or length(v_ma) not between 41 and 8192 then
      raise exception 'Refresh token phải được mã hóa trước khi lưu' using errcode = 'check_violation';
    end if;
    update zalo_cau_hinh
    set refresh_token_ma_hoa = v_ma, access_token_ma_hoa = null, het_han_luc = null,
        token_cap_nhat_luc = now()
    where id = 1;
  end if;

  return jsonb_build_object('ok', true, 'co_refresh_token', v_ma is not null);
end;
$$;

create or replace function zalo_luu_mau(
  p_ma          text,
  p_ma_zalo     text,
  p_da_duyet    boolean,
  p_bat_tu_dong boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mau mau_tin;
  v_ma_zalo text := nullif(btrim(p_ma_zalo), '');
begin
  if not la_chu_so_huu() then
    raise exception 'Chỉ chủ sở hữu mới sửa được mẫu tin Zalo'
      using errcode = 'insufficient_privilege';
  end if;

  if coalesce(p_da_duyet, false) and v_ma_zalo is null then
    raise exception 'Mẫu đã duyệt phải có mã mẫu Zalo' using errcode = 'check_violation';
  end if;
  if v_ma_zalo is not null and (length(v_ma_zalo) > 64 or v_ma_zalo !~ '^[A-Za-z0-9_-]+$') then
    raise exception 'Mã mẫu Zalo không hợp lệ' using errcode = 'check_violation';
  end if;

  update mau_tin
  set ma_zalo = v_ma_zalo, da_duyet = coalesce(p_da_duyet, false),
      bat_tu_dong = coalesce(p_bat_tu_dong, false)
  where ma = p_ma
  returning * into v_mau;

  if not found then
    raise exception 'Không tìm thấy mẫu tin %', p_ma using errcode = 'foreign_key_violation';
  end if;

  return jsonb_build_object('ok', true, 'ma', v_mau.ma, 'ma_zalo', v_mau.ma_zalo,
                            'da_duyet', v_mau.da_duyet, 'bat_tu_dong', v_mau.bat_tu_dong,
                            'tham_so', v_mau.tham_so);
end;
$$;


-- =============================================================================
-- 10 · RPC NGƯỜI — CHIẾN DỊCH (chủ sở hữu, quản lý, marketing — đúng chi nhánh)
-- =============================================================================
-- Khách "của chi nhánh" = đã ghé hoặc đã đặt bàn ở đó — đúng như policy
-- khach_hang_doc (0007). Lọc nhóm theo v_phan_nhom_khach / v_khach_vip.
create or replace function zalo_khach_theo_nhom(p_chi_nhanh_id uuid, p_nhom text)
returns setof uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_nhom text := nullif(nullif(btrim(p_nhom), ''), 'tat_ca');
begin
  if v_nhom is not null and v_nhom not in ('vip', 'moi', 'dang_thanh_thoi_quen', 'than_thiet',
                                           'ngu_dong', 'chua_ghe', 'b2b', 'khac') then
    raise exception 'Nhóm khách không hợp lệ: %', p_nhom using errcode = 'check_violation';
  end if;

  return query
  select kh.id
  from khach_hang kh
  where (exists (select 1 from luot_ghe lg where lg.khach_hang_id = kh.id and lg.chi_nhanh_id = p_chi_nhanh_id)
         or exists (select 1 from dat_ban d where d.khach_hang_id = kh.id and d.chi_nhanh_id = p_chi_nhanh_id))
    and (v_nhom is null
         or (v_nhom = 'vip' and exists (select 1 from v_khach_vip v where v.khach_hang_id = kh.id))
         or (v_nhom <> 'vip' and exists (select 1 from v_phan_nhom_khach p
                                         where p.khach_hang_id = kh.id and p.nhom = v_nhom)));
end;
$$;

create or replace function zalo_xem_truoc_chien_dich(
  p_chi_nhanh_id uuid,
  p_mau_ma       text,
  p_nhom         text default null,
  p_gui_luc      timestamptz default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_mau  mau_tin;
  v_cfg  zalo_cau_hinh;
  v_luc  timestamptz := coalesce(p_gui_luc, now());
  v_kq   jsonb;
begin
  if not (co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])
          and duoc_truy_cap_chi_nhanh(p_chi_nhanh_id)) then
    raise exception 'Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này mới chạy được chiến dịch Zalo'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_mau from mau_tin where ma = p_mau_ma;
  if not found then
    raise exception 'Không tìm thấy mẫu tin %', p_mau_ma using errcode = 'foreign_key_violation';
  end if;
  if v_mau.loai <> 'cham_soc' then
    raise exception 'Chiến dịch chỉ dùng mẫu tin chăm sóc' using errcode = 'check_violation';
  end if;

  select * into v_cfg from zalo_cau_hinh where id = 1;

  with ds as (
    select k.id, (select x.ly_do from kiem_duoc_phep_gui(k.id, 'cham_soc', null, v_luc) x) as ly_do
    from zalo_khach_theo_nhom(p_chi_nhanh_id, p_nhom) k(id)
  )
  select jsonb_build_object(
    'tong', (select count(*) from ds),
    'du_dieu_kien', (select count(*) from ds where ly_do = 'OK'),
    'bi_loai', (select coalesce(jsonb_agg(jsonb_build_object('ly_do', ly_do, 'so', so) order by so desc, ly_do), '[]'::jsonb)
                from (select ly_do, count(*)::int as so from ds where ly_do <> 'OK' group by ly_do) g))
  into v_kq;

  return v_kq || jsonb_build_object(
    'mau', jsonb_build_object('ma', v_mau.ma, 'ten', v_mau.ten, 'loai', v_mau.loai,
                              'da_duyet', v_mau.da_duyet,
                              'san_sang', v_mau.da_duyet and v_mau.ma_zalo is not null and v_mau.dang_dung),
    'tham_so_can_nhap', (select coalesce(jsonb_agg(t order by vt), '[]'::jsonb)
                         from jsonb_array_elements_text(v_mau.tham_so) with ordinality as a(t, vt)
                         where t not in ('customer_name', 'phone', 'address', 'hotline')),
    'tran_thang', v_cfg.tran_cham_soc_thang,
    'dang_bat', v_cfg.dang_bat);
end;
$$;

create or replace function zalo_tao_chien_dich(
  p_chi_nhanh_id uuid,
  p_ma_gui       uuid,
  p_mau_ma       text,
  p_nhom         text,
  p_ten          text,
  p_du_lieu      jsonb default '{}'::jsonb,
  p_gui_luc      timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cd    chien_dich;
  v_mau   mau_tin;
  v_bat   boolean;
  v_luc   timestamptz := coalesce(p_gui_luc, now());
  v_them  jsonb;
  v_thieu text;
  v_dl    jsonb;
  v_kt    record;
  v_so    integer := 0;
  v_loai  integer := 0;
  v_id    uuid;
  r       record;
begin
  if not (co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])
          and duoc_truy_cap_chi_nhanh(p_chi_nhanh_id)) then
    raise exception 'Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này mới chạy được chiến dịch Zalo'
      using errcode = 'insufficient_privilege';
  end if;

  if p_ma_gui is null then
    raise exception 'Thiếu mã gửi' using errcode = 'check_violation';
  end if;

  -- Bấm gửi hai lần: trả lại chiến dịch đã tạo.
  select * into v_cd from chien_dich where ma_gui = p_ma_gui;
  if found then
    if v_cd.chi_nhanh_id <> p_chi_nhanh_id then
      raise exception 'Mã gửi đã dùng cho chi nhánh khác' using errcode = 'check_violation';
    end if;
    return jsonb_build_object('ok', true, 'trung', true, 'chien_dich_id', v_cd.id,
      'so_tin', (select count(*) from nhat_ky_tin where chien_dich_id = v_cd.id), 'bi_loai', null);
  end if;

  if nullif(btrim(p_ten), '') is null then
    raise exception 'Chiến dịch cần có tên' using errcode = 'check_violation';
  end if;

  select * into v_mau from mau_tin where ma = p_mau_ma and dang_dung;
  if not found then
    raise exception 'Không tìm thấy mẫu tin %', p_mau_ma using errcode = 'foreign_key_violation';
  end if;
  if v_mau.loai <> 'cham_soc' then
    raise exception 'Chiến dịch chỉ dùng mẫu tin chăm sóc' using errcode = 'check_violation';
  end if;
  if not v_mau.da_duyet or v_mau.ma_zalo is null then
    raise exception 'Mẫu tin % chưa được Zalo duyệt', p_mau_ma using errcode = 'check_violation';
  end if;

  select dang_bat into v_bat from zalo_cau_hinh where id = 1;
  if not coalesce(v_bat, false) then
    raise exception 'Gửi tin Zalo đang tắt' using errcode = 'check_violation';
  end if;

  if v_luc < now() - interval '5 minutes' then
    raise exception 'Giờ gửi đã qua' using errcode = 'check_violation';
  end if;
  if v_luc > now() + interval '60 days' then
    raise exception 'Chỉ hẹn giờ gửi trong vòng 60 ngày' using errcode = 'check_violation';
  end if;

  if p_du_lieu is not null and jsonb_typeof(p_du_lieu) <> 'object' then
    raise exception 'Tham số chiến dịch phải là một đối tượng JSON' using errcode = 'check_violation';
  end if;

  -- Tham số do người tạo nhập: mọi tham số của mẫu trừ bốn tham số tự điền.
  select coalesce(jsonb_object_agg(e.key, to_jsonb(btrim(e.value))), '{}'::jsonb)
    into v_them
  from jsonb_each_text(coalesce(p_du_lieu, '{}'::jsonb)) e
  where v_mau.tham_so ? e.key
    and e.key not in ('customer_name', 'phone', 'address', 'hotline')
    and nullif(btrim(e.value), '') is not null;

  select string_agg(t, ', ' order by vt) into v_thieu
  from jsonb_array_elements_text(v_mau.tham_so) with ordinality as a(t, vt)
  where t not in ('customer_name', 'phone', 'address', 'hotline') and not (v_them ? t);
  if v_thieu is not null then
    raise exception 'Thiếu tham số cho mẫu %: %', p_mau_ma, v_thieu using errcode = 'check_violation';
  end if;

  insert into chien_dich (chi_nhanh_id, mau_tin_id, ten, nhom_muc_tieu, trang_thai,
                          bat_dau, created_by, du_lieu, ma_gui)
  values (p_chi_nhanh_id, v_mau.id, btrim(p_ten), nullif(nullif(btrim(p_nhom), ''), 'tat_ca'), 'dang_chay',
          v_luc, (nhan_su_hien_tai()).id, v_them, p_ma_gui)
  returning * into v_cd;

  -- Luôn gửi từ v_duoc_gui_tin, rồi từng khách qua duoc_phep_gui (README, lưu ý 4).
  for r in
    select k.id, kh.sdt
    from zalo_khach_theo_nhom(p_chi_nhanh_id, p_nhom) k(id)
    join v_duoc_gui_tin v on v.khach_hang_id = k.id
    join khach_hang kh on kh.id = k.id
    order by kh.sdt
  loop
    select * into v_kt from kiem_duoc_phep_gui(r.id, 'cham_soc', null, v_luc);
    if not v_kt.duoc_gui then
      v_loai := v_loai + 1;
      continue;
    end if;

    v_dl := zalo_loc_tham_so(zalo_du_lieu_goc(r.id, p_chi_nhanh_id) || v_them, v_mau.tham_so);

    insert into nhat_ky_tin (chi_nhanh_id, khach_hang_id, mau_tin_id, chien_dich_id, sdt_gui,
                             noi_dung, ket_qua, du_lieu, khoa_gui, gui_sau, loai_tin)
    values (p_chi_nhanh_id, r.id, v_mau.id, v_cd.id, r.sdt,
            zalo_dien_noi_dung(v_mau.noi_dung, v_dl), 'cho_gui', v_dl,
            'CD:' || v_cd.id || ':' || r.id, v_luc, 'cham_soc')
    on conflict (khoa_gui) do nothing
    returning id into v_id;

    if v_id is not null then v_so := v_so + 1; end if;
    v_id := null;
  end loop;

  if v_so = 0 then
    update chien_dich set trang_thai = 'hoan_tat', ket_thuc = now() where id = v_cd.id;
  end if;

  return jsonb_build_object('ok', true, 'trung', false, 'chien_dich_id', v_cd.id,
                            'so_tin', v_so, 'bi_loai', v_loai);
end;
$$;

create or replace function zalo_dung_chien_dich(p_chien_dich_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cd chien_dich;
  v_so integer;
begin
  select * into v_cd from chien_dich where id = p_chien_dich_id;

  if not (co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])
          and found and duoc_truy_cap_chi_nhanh(v_cd.chi_nhanh_id)) then
    raise exception 'Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này mới chạy được chiến dịch Zalo'
      using errcode = 'insufficient_privilege';
  end if;

  update nhat_ky_tin set ket_qua = 'da_huy', loi = 'Chiến dịch đã dừng', dang_gui_tu = null
  where chien_dich_id = v_cd.id and ket_qua = 'cho_gui';
  get diagnostics v_so = row_count;

  if v_cd.trang_thai in ('nhap', 'dang_chay') then
    update chien_dich set trang_thai = 'tam_dung', ket_thuc = now() where id = v_cd.id;
  end if;

  return jsonb_build_object('ok', true, 'so_huy', v_so);
end;
$$;

create or replace function zalo_thu_lai(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tin nhat_ky_tin;
begin
  select * into v_tin from nhat_ky_tin where id = p_id for update;

  if not (co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])
          and found and duoc_truy_cap_chi_nhanh(v_tin.chi_nhanh_id)) then
    raise exception 'Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này mới gửi lại được tin Zalo'
      using errcode = 'insufficient_privilege';
  end if;

  if v_tin.ket_qua <> 'that_bai' then
    raise exception 'Chỉ gửi lại được tin thất bại' using errcode = 'check_violation';
  end if;

  update nhat_ky_tin
  set ket_qua = 'cho_gui', lan_thu = 0, thu_lai_luc = null, loi = null,
      dang_gui_tu = null, gui_sau = now()
  where id = p_id;

  return jsonb_build_object('ok', true, 'id', p_id);
end;
$$;

create or replace function zalo_tong_quan(p_chi_nhanh_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_cfg zalo_cau_hinh;
begin
  if not (co_vai_tro(array['chu_so_huu','quan_ly','marketing']::vai_tro[])
          and duoc_truy_cap_chi_nhanh(p_chi_nhanh_id)) then
    raise exception 'Chỉ chủ sở hữu, quản lý hoặc marketing của chi nhánh này mới xem được tin Zalo'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_cfg from zalo_cau_hinh where id = 1;

  return jsonb_build_object(
    'ket_noi', jsonb_build_object(
      'dang_bat', v_cfg.dang_bat, 'che_do', v_cfg.che_do,
      'co_token', v_cfg.refresh_token_ma_hoa is not null,
      'het_han_luc', v_cfg.het_han_luc,
      'dang_chay', v_cfg.dang_chay_tu is not null and v_cfg.dang_chay_tu > now() - interval '10 minutes',
      'lan_chay_cuoi', v_cfg.lan_chay_cuoi, 'loi_cuoi', v_cfg.loi_cuoi, 'quota_con', v_cfg.quota_con,
      'gio_tu', to_char(v_cfg.gio_tu, 'HH24:MI'), 'gio_den', to_char(v_cfg.gio_den, 'HH24:MI'),
      'tran_cham_soc_thang', v_cfg.tran_cham_soc_thang),
    'dem', (select jsonb_build_object(
        'cho_gui',        count(*) filter (where ket_qua = 'cho_gui'),
        'da_gui_hom_nay', count(*) filter (where ket_qua = 'da_gui'
                            and ((gui_luc at time zone 'utc') + interval '7 hours')::date = hom_nay_vn()),
        'da_gui_30_ngay', count(*) filter (where ket_qua = 'da_gui' and gui_luc > now() - interval '30 days'),
        'that_bai',       count(*) filter (where ket_qua = 'that_bai'),
        'bi_tu_choi',     count(*) filter (where ket_qua = 'bi_tu_choi'),
        'da_huy',         count(*) filter (where ket_qua = 'da_huy'))
      from nhat_ky_tin where chi_nhanh_id = p_chi_nhanh_id),
    'chien_dich', (select coalesce(jsonb_agg(x.o order by x.created_at desc), '[]'::jsonb) from (
        select c.created_at, jsonb_build_object(
          'id', c.id, 'ten', c.ten, 'mau_ma', m.ma, 'nhom', c.nhom_muc_tieu,
          'trang_thai', c.trang_thai, 'bat_dau', c.bat_dau,
          'so_tin',   (select count(*) from nhat_ky_tin n where n.chien_dich_id = c.id),
          'da_gui',   (select count(*) from nhat_ky_tin n where n.chien_dich_id = c.id and n.ket_qua = 'da_gui'),
          'that_bai', (select count(*) from nhat_ky_tin n where n.chien_dich_id = c.id and n.ket_qua = 'that_bai'),
          'cho_gui',  (select count(*) from nhat_ky_tin n where n.chien_dich_id = c.id and n.ket_qua = 'cho_gui')) as o
        from chien_dich c join mau_tin m on m.id = c.mau_tin_id
        where c.chi_nhanh_id = p_chi_nhanh_id
        order by c.created_at desc limit 20) x),
    'mau', (select coalesce(jsonb_agg(jsonb_build_object(
               'ma', m.ma, 'ten', m.ten, 'loai', m.loai, 'da_duyet', m.da_duyet,
               'bat_tu_dong', m.bat_tu_dong,
               'san_sang', m.da_duyet and m.ma_zalo is not null and m.dang_dung) order by m.ma), '[]'::jsonb)
            from mau_tin m));
end;
$$;


-- =============================================================================
-- 11 · VIEW HÀNG CHỜ + NHẬT KÝ — security_invoker, SĐT che giữa
-- =============================================================================
create view v_zalo_nhat_ky with (security_invoker = true) as
select
  n.id,
  n.chi_nhanh_id,
  n.khach_hang_id,
  kh.ho_ten,
  case when length(n.sdt_gui) >= 7
       then left(n.sdt_gui, 3) || repeat('*', length(n.sdt_gui) - 6) || right(n.sdt_gui, 3)
       else n.sdt_gui end as sdt_an,
  m.ma  as mau_ma,
  m.ten as mau_ten,
  n.loai_tin,
  n.chien_dich_id,
  c.ten as chien_dich_ten,
  n.dat_ban_id,
  n.ket_qua,
  n.loi,
  n.lan_thu,
  n.gui_sau,
  n.thu_lai_luc,
  n.gui_luc,
  n.created_at,
  coalesce(n.gui_luc, n.thu_lai_luc, n.gui_sau, n.created_at) as moc
from nhat_ky_tin n
left join mau_tin m     on m.id = n.mau_tin_id
left join chien_dich c  on c.id = n.chien_dich_id
left join khach_hang kh on kh.id = n.khach_hang_id;

comment on view v_zalo_nhat_ky is
  'Hàng chờ và nhật ký tin Zalo cho màn /noi-bo/zalo. security_invoker — RLS của nhat_ky_tin quyết định ai thấy dòng nào. SĐT che giữa.';


-- =============================================================================
-- 12 · HÀM NỘI BỘ — rút khỏi authenticated (README, lưu ý 13)
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke execute on function zalo_rut_tham_so(text) from authenticated';
    execute 'revoke execute on function zalo_mau_tin_tham_so() from authenticated';
    execute 'revoke execute on function zalo_du_lieu_goc(uuid, uuid) from authenticated';
    execute 'revoke execute on function zalo_loc_tham_so(jsonb, jsonb) from authenticated';
    execute 'revoke execute on function zalo_dien_noi_dung(text, jsonb) from authenticated';
    execute 'revoke execute on function zalo_nhat_ky_tin_dien() from authenticated';
    execute 'revoke execute on function zalo_luc_hen(date, time) from authenticated';
    execute 'revoke execute on function zalo_du_lieu_dat_ban(uuid, jsonb) from authenticated';
    execute 'revoke execute on function zalo_xep_tin_mot(dat_ban, text, timestamptz) from authenticated';
    execute 'revoke execute on function zalo_xep_tin_dat_ban(uuid, boolean, boolean) from authenticated';
    execute 'revoke execute on function zalo_sau_dat_ban() from authenticated';
    execute 'revoke execute on function zalo_sach_loi(text) from authenticated';
    execute 'revoke execute on function zalo_khach_theo_nhom(uuid, text) from authenticated';
  end if;
end
$$;


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
